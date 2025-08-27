import os
from datetime import datetime, timedelta
from typing import List, Optional

from dateutil.relativedelta import relativedelta
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import Boolean, create_engine, extract
from sqlalchemy.orm import Session, sessionmaker, joinedload, selectinload
from contextlib import asynccontextmanager

from . import models, schemas

# --- NOVA ESTRUTURA DE INICIALIZAÇÃO ---
# Define variáveis globais que serão inicializadas depois
engine = None
SessionLocal = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global engine, SessionLocal
    # Este código roda QUANDO O SERVIDOR INICIA
    
    # Pega a URL do banco de dados que foi definida pelo run_desktop_app.py
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db") # Mantém um padrão seguro
    
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Cria as tabelas no banco de dados
    models.Base.metadata.create_all(bind=engine)
    print("Banco de dados conectado e tabelas criadas.")
    
    yield
    # Este código roda QUANDO O SERVIDOR TERMINA (não usado por nós)
    print("Servidor finalizado.")


app = FastAPI(title="Calculadora Financeira API", lifespan=lifespan)

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    if SessionLocal is None:
        raise HTTPException(status_code=500, detail="A sessão com o banco de dados não foi inicializada.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _get_gastos_por_periodo(db: Session, data_inicio: datetime, data_fim: datetime, cartao_id: Optional[int] = None):
    query_normais = db.query(models.Gasto).options(
        joinedload(models.Gasto.categoria),
        joinedload(models.Gasto.cartao)
    ).filter(
        models.Gasto.is_parcelado == False,
        models.Gasto.data >= data_inicio,
        models.Gasto.data < data_fim
    )
    query_parcelados = db.query(models.Gasto).options(
        joinedload(models.Gasto.categoria),
        joinedload(models.Gasto.cartao)
    ).filter(
        models.Gasto.is_parcelado == True,
        models.Gasto.data < data_fim
    )
    if cartao_id:
        query_normais = query_normais.filter(models.Gasto.cartao_id == cartao_id)
        query_parcelados = query_parcelados.filter(models.Gasto.cartao_id == cartao_id)
    gastos_normais = query_normais.all()
    compras_parceladas_ativas = query_parcelados.all()
    gastos_parcela_do_periodo = []
    for compra in compras_parceladas_ativas:
        for i in range(compra.numero_parcelas):
            data_parcela_atual = compra.data + relativedelta(months=+i)
            if data_inicio <= data_parcela_atual < data_fim:
                gasto_virtual = schemas.Gasto.from_orm(compra)
                gasto_virtual.valor = compra.valor_parcela
                gasto_virtual.data = compra.data
                gasto_virtual.parcela_atual = i + 1
                gastos_parcela_do_periodo.append(gasto_virtual)
    gastos_totais = gastos_normais + gastos_parcela_do_periodo
    gastos_totais.sort(key=lambda x: (x.data, x.id), reverse=True)
    return gastos_totais

def _calcular_periodo_fatura(ano: int, mes: int, dia_fechamento: int):
    """
    Calcula o período de compras para uma fatura.
    Regra: Para a fatura de Agosto (mês 8) com fechamento dia 20,
    o período é de 20 de Julho a 19 de Agosto.
    """
    # 1. Calcula o fim do período (inclusive).
    # Este é o dia ANTERIOR ao fechamento da fatura do mês atual.
    try:
        fechamento_atual = datetime(ano, mes, dia_fechamento)
    except ValueError:
        # Lida com dias inválidos (ex: dia 31), pegando o último dia do mês
        fechamento_atual = (datetime(ano, mes, 1) + relativedelta(months=1)) - timedelta(days=1)
    
    periodo_fim = fechamento_atual - timedelta(days=1)

    # 2. Calcula o início do período (inclusive).
    # Este é o dia de fechamento do MÊS ANTERIOR.
    periodo_inicio = fechamento_atual - relativedelta(months=1)
    
    return periodo_inicio, periodo_fim

@app.get("/")
def read_root():
    return {"status": "API da Calculadora Financeira está no ar!"}

@app.post("/categorias/", response_model=schemas.Categoria, status_code=201)
def create_categoria(categoria: schemas.CategoriaCreate, db: Session = Depends(get_db)):
    db_categoria = db.query(models.Categoria).filter(models.Categoria.nome == categoria.nome).first()
    if db_categoria:
        if not db_categoria.is_active:
            db_categoria.is_active = True
            db.commit()
            db.refresh(db_categoria)
            return db_categoria
        else:
            raise HTTPException(status_code=400, detail="Categoria com este nome já existe")
    new_categoria = models.Categoria(**categoria.model_dump())
    db.add(new_categoria)
    db.commit()
    db.refresh(new_categoria)
    return new_categoria

@app.get("/categorias/", response_model=List[schemas.Categoria])
def read_categorias(db: Session = Depends(get_db)):
    return db.query(models.Categoria).filter(models.Categoria.is_active == True).order_by(models.Categoria.nome).all()

@app.delete("/categorias/{categoria_id}", status_code=200)
def delete_categoria(categoria_id: int, db: Session = Depends(get_db)):
    db_categoria = db.query(models.Categoria).get(categoria_id)
    if not db_categoria:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    gastos_associados = db.query(models.Gasto).filter(models.Gasto.categoria_id == categoria_id).count()
    if gastos_associados > 0:
        db_categoria.is_active = False
        db.commit()
        return {"status": "soft_deleted", "message": "Categoria desativada pois está em uso. Altere os gastos existentes para poder removê-la permanentemente."}
    else:
        db.delete(db_categoria)
        db.commit()
        return {"status": "hard_deleted", "message": "Categoria removida com sucesso."}

@app.post("/gastos/", response_model=schemas.Gasto, status_code=201)
def create_gasto(gasto: schemas.GastoCreate, db: Session = Depends(get_db)):
    novo_gasto = models.Gasto(**gasto.model_dump())
    db.add(novo_gasto)
    db.commit()
    db.refresh(novo_gasto)
    return novo_gasto

@app.put("/gastos/{gasto_id}", response_model=schemas.Gasto)
def update_gasto(gasto_id: int, gasto_update: schemas.GastoUpdate, db: Session = Depends(get_db)):
    db_gasto = db.query(models.Gasto).get(gasto_id)
    if not db_gasto:
        raise HTTPException(status_code=404, detail="Gasto não encontrado")
    update_data = gasto_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_gasto, key, value)
    db.add(db_gasto)
    db.commit()
    db.refresh(db_gasto)
    return db_gasto

@app.delete("/gastos/{gasto_id}", status_code=204)
def delete_gasto(gasto_id: int, db: Session = Depends(get_db)):
    db_gasto = db.query(models.Gasto).get(gasto_id)
    if not db_gasto:
        raise HTTPException(status_code=404, detail="Gasto não encontrado")
    db.delete(db_gasto)
    db.commit()
    return {"detail": "Gasto deletado com sucesso"}

@app.get("/gastos/", response_model=List[schemas.Gasto])
def read_gastos(db: Session = Depends(get_db), ano: Optional[int] = None, mes: Optional[int] = None, tipo_pagamento: Optional[str] = None):
    if not ano or not mes:
        raise HTTPException(status_code=400, detail="Ano e mês são obrigatórios")
    data_inicio = datetime(ano, mes, 1)
    data_fim = data_inicio + relativedelta(months=+1)
    gastos = _get_gastos_por_periodo(db, data_inicio, data_fim)
    if tipo_pagamento == 'debito':
        gastos = [g for g in gastos if g.cartao is None]
    return gastos

@app.get("/gastos/parcelados", response_model=List[schemas.Gasto])
def read_gastos_parcelados(db: Session = Depends(get_db), ano: Optional[int] = None, mes: Optional[int] = None):
    if not ano or not mes:
        hoje = datetime.utcnow()
        ano = hoje.year
        mes = hoje.month
    data_inicio_mes = datetime(ano, mes, 1)
    data_fim_mes = data_inicio_mes + relativedelta(months=+1)
    compras_parceladas = db.query(models.Gasto).options(
        joinedload(models.Gasto.categoria),
        joinedload(models.Gasto.cartao)
    ).filter(models.Gasto.is_parcelado == True).order_by(models.Gasto.data.desc()).all()
    resultados_ativos_no_mes = []
    for compra in compras_parceladas:
        data_ultima_parcela = compra.data + relativedelta(months=+(compra.numero_parcelas - 1))
        fim_validade_parcela = (data_ultima_parcela + relativedelta(months=1)).replace(day=1)
        if datetime.utcnow() < fim_validade_parcela:
            compra_inicio_mes = compra.data.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            hoje_inicio_mes = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            delta = relativedelta(hoje_inicio_mes, compra_inicio_mes)
            parcela_atual = (delta.years * 12 + delta.months) + 1
            if parcela_atual <= compra.numero_parcelas:
                gasto_schema = schemas.Gasto.from_orm(compra)
                gasto_schema.parcela_atual = parcela_atual
                resultados_ativos_no_mes.append(gasto_schema)
    return resultados_ativos_no_mes

@app.get("/faturas/{cartao_id}", response_model=schemas.Fatura)
def read_fatura(cartao_id: int, ano: int, mes: int, db: Session = Depends(get_db)):
    cartao = db.query(models.CartaoCredito).get(cartao_id)
    if not cartao:
        raise HTTPException(status_code=404, detail="Cartão não encontrado")

    periodo_inicio, periodo_fim_real = _calcular_periodo_fatura(ano, mes, cartao.dia_fechamento)
    
    periodo_fim_query = periodo_fim_real + timedelta(days=1)
    
    gastos_do_periodo = _get_gastos_por_periodo(db, periodo_inicio, periodo_fim_query, cartao_id)

    return {
        "gastos": gastos_do_periodo,
        "periodo_inicio": periodo_inicio.date(),
        "periodo_fim": periodo_fim_real.date()
    }

@app.post("/cartoes/", response_model=schemas.CartaoCredito, status_code=201)
def create_cartao(cartao: schemas.CartaoCreditoCreate, db: Session = Depends(get_db)):
    novo_cartao = models.CartaoCredito(**cartao.model_dump())
    db.add(novo_cartao)
    db.commit()
    db.refresh(novo_cartao)
    return novo_cartao

@app.get("/cartoes/", response_model=List[schemas.CartaoCredito])
def read_cartoes(db: Session = Depends(get_db), include_inactive: bool = False):
    query = db.query(models.CartaoCredito)
    if not include_inactive:
        query = query.filter(models.CartaoCredito.is_active == True)
    return query.order_by(models.CartaoCredito.nome).all()

@app.delete("/cartoes/{cartao_id}", response_model=schemas.CartaoCredito)
def deactivate_cartao(cartao_id: int, db: Session = Depends(get_db)):
    db_cartao = db.query(models.CartaoCredito).get(cartao_id)
    if not db_cartao:
        raise HTTPException(status_code=404, detail="Cartão não encontrado")
    db_cartao.is_active = False
    db.commit()
    db.refresh(db_cartao)
    return db_cartao

@app.post("/cartoes/{cartao_id}/reactivate", response_model=schemas.CartaoCredito)
def reactivate_cartao(cartao_id: int, db: Session = Depends(get_db)):
    db_cartao = db.query(models.CartaoCredito).get(cartao_id)
    if not db_cartao:
        raise HTTPException(status_code=404, detail="Cartão não encontrado")
    db_cartao.is_active = True
    db.commit()
    db.refresh(db_cartao)
    return db_cartao

@app.post("/metas/", response_model=schemas.Meta, status_code=201)
def create_meta(meta: schemas.MetaCreate, db: Session = Depends(get_db)):
    nova_meta = models.Meta(**meta.model_dump())
    db.add(nova_meta)
    db.commit()
    db.refresh(nova_meta)
    return nova_meta

@app.get("/metas/", response_model=List[schemas.Meta])
def read_metas(db: Session = Depends(get_db)):
    return db.query(models.Meta).options(selectinload(models.Meta.contribuicoes)).all()

@app.delete("/metas/{meta_id}", status_code=204)
def delete_meta(meta_id: int, db: Session = Depends(get_db)):
    db_meta = db.query(models.Meta).get(meta_id)
    if not db_meta:
        raise HTTPException(status_code=404, detail="Meta não encontrada")
    db.delete(db_meta)
    db.commit()
    return {"detail": "Meta deletada"}

@app.post("/metas/{meta_id}/contribuicoes/", response_model=schemas.Contribuicao, status_code=201)
def create_contribuicao_para_meta(meta_id: int, contribuicao: schemas.ContribuicaoCreate, db: Session = Depends(get_db)):
    db_meta = db.query(models.Meta).get(meta_id)
    if not db_meta:
        raise HTTPException(status_code=404, detail="Meta não encontrada")
    nova_contribuicao = models.Contribuicao(**contribuicao.model_dump(), meta_id=meta_id)
    db.add(nova_contribuicao)
    db.commit()
    db.refresh(nova_contribuicao)
    return nova_contribuicao

@app.delete("/contribuicoes/{contribuicao_id}", status_code=204)
def delete_contribuicao(contribuicao_id: int, db: Session = Depends(get_db)):
    db_contribuicao = db.query(models.Contribuicao).get(contribuicao_id)
    if not db_contribuicao:
        raise HTTPException(status_code=404, detail="Contribuição não encontrada")
    db.delete(db_contribuicao)
    db.commit()
    return {"detail": "Contribuição deletada"}