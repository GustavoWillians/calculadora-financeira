import os
from datetime import datetime, timedelta
from typing import List, Optional

from dateutil.relativedelta import relativedelta
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import Boolean, create_engine, extract
from sqlalchemy.orm import Session, sessionmaker, joinedload, selectinload

from . import models, schemas

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@db/mydatabase")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Calculadora Financeira API")

origins_str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost")
origins = origins_str.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
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
                gasto_virtual.data = data_parcela_atual
                gasto_virtual.parcela_atual = i + 1
                gastos_parcela_do_periodo.append(gasto_virtual)
    gastos_totais = gastos_normais + gastos_parcela_do_periodo
    gastos_totais.sort(key=lambda x: x.data, reverse=True)
    return gastos_totais

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
    
    new_categoria = models.Categoria(nome=categoria.nome)
    db.add(new_categoria)
    db.commit()
    db.refresh(new_categoria)
    return new_categoria

@app.get("/categorias/", response_model=List[schemas.Categoria])
def read_categorias(db: Session = Depends(get_db)):
    return db.query(models.Categoria).filter(models.Categoria.is_active == True).order_by(models.Categoria.nome).all()

@app.delete("/categorias/{categoria_id}", status_code=200) # Mudamos o status code para 200 para poder enviar uma resposta
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
    novo_gasto = models.Gasto(**gasto.dict())
    db.add(novo_gasto)
    db.commit()
    db.refresh(novo_gasto)
    return novo_gasto

@app.put("/gastos/{gasto_id}", response_model=schemas.Gasto)
def update_gasto(gasto_id: int, gasto_update: schemas.GastoUpdate, db: Session = Depends(get_db)):
    db_gasto = db.query(models.Gasto).get(gasto_id)
    if not db_gasto:
        raise HTTPException(status_code=404, detail="Gasto não encontrado")
    update_data = gasto_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_gasto, key, value)
    db.add(db_gasto)
    db.commit()
    db.refresh(db_gasto)
    return db_gasto

# --- NOVO ENDPOINT DE EXCLUSÃO ---
@app.delete("/gastos/{gasto_id}", status_code=204)
def delete_gasto(gasto_id: int, db: Session = Depends(get_db)):
    db_gasto = db.query(models.Gasto).get(gasto_id)
    if not db_gasto:
        raise HTTPException(status_code=404, detail="Gasto não encontrado")
    db.delete(db_gasto)
    db.commit()
    return {"detail": "Gasto deletado com sucesso"}

@app.get("/gastos/", response_model=List[schemas.Gasto])
def read_gastos(db: Session = Depends(get_db), ano: Optional[int] = None, mes: Optional[int] = None):
    if not ano or not mes:
        raise HTTPException(status_code=400, detail="Ano e mês são obrigatórios")
    data_inicio = datetime(ano, mes, 1)
    data_fim = data_inicio + relativedelta(months=+1)
    return _get_gastos_por_periodo(db, data_inicio, data_fim)

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
        for i in range(compra.numero_parcelas):
            data_parcela_atual = compra.data + relativedelta(months=+i)
            if data_inicio_mes <= data_parcela_atual < data_fim_mes:
                gasto_schema = schemas.Gasto.from_orm(compra)
                gasto_schema.parcela_atual = i + 1
                resultados_ativos_no_mes.append(gasto_schema)
                break
    return resultados_ativos_no_mes

@app.get("/faturas/{cartao_id}", response_model=List[schemas.Gasto])
def read_fatura(cartao_id: int, ano: int, mes: int, db: Session = Depends(get_db)):
    cartao = db.query(models.CartaoCredito).get(cartao_id)
    if not cartao:
        raise HTTPException(status_code=404, detail="Cartão não encontrado")
    dia_fechamento = cartao.dia_fechamento
    try:
        data_fechamento_atual = (datetime(ano, mes, 1)).replace(day=dia_fechamento)
    except ValueError:
        ultimo_dia_mes = (datetime(ano, mes, 1) + relativedelta(months=1)) - relativedelta(days=1)
        data_fechamento_atual = ultimo_dia_mes
    data_fechamento_anterior = data_fechamento_atual - relativedelta(months=1)
    periodo_inicio = data_fechamento_anterior + timedelta(days=1)
    periodo_fim = data_fechamento_atual + timedelta(days=1)
    return _get_gastos_por_periodo(db, periodo_inicio, periodo_fim, cartao_id)

@app.post("/cartoes/", response_model=schemas.CartaoCredito, status_code=201)
def create_cartao(cartao: schemas.CartaoCreditoCreate, db: Session = Depends(get_db)):
    novo_cartao = models.CartaoCredito(**cartao.dict())
    db.add(novo_cartao)
    db.commit()
    db.refresh(novo_cartao)
    return novo_cartao

@app.get("/cartoes/", response_model=List[schemas.CartaoCredito])
def read_cartoes(db: Session = Depends(get_db), include_inactive: bool = False):
    query = db.query(models.CartaoCredito)
    if not include_inactive:
        # Por padrão, para os formulários, retorna apenas os cartões ativos
        query = query.filter(models.CartaoCredito.is_active == True)
    return query.order_by(models.CartaoCredito.nome).all()

# RENOMEIE esta função de delete_cartao para deactivate_cartao
@app.delete("/cartoes/{cartao_id}", response_model=schemas.CartaoCredito)
def deactivate_cartao(cartao_id: int, db: Session = Depends(get_db)):
    db_cartao = db.query(models.CartaoCredito).get(cartao_id)
    if not db_cartao:
        raise HTTPException(status_code=404, detail="Cartão não encontrado")
    
    db_cartao.is_active = False
    db.commit()
    db.refresh(db_cartao)
    return db_cartao

# ADICIONE esta nova função
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
    nova_meta = models.Meta(**meta.dict())
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
    nova_contribuicao = models.Contribuicao(**contribuicao.dict(), meta_id=meta_id)
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