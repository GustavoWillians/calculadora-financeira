import os
import sys
from datetime import datetime

# Adiciona o diretório raiz ao path para que o script encontre a pasta 'backend'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app import models

# --- CONFIGURAÇÃO ---
DATABASE_FILE = "app.db"
# Garante que o DB seja criado dentro da pasta /backend/
DB_PATH = os.path.join(os.path.dirname(__file__), DATABASE_FILE)
DATABASE_URL = f"sqlite:///{DB_PATH}"

# Apaga o banco de dados antigo, se existir, para começar do zero
if os.path.exists(DB_PATH):
    os.remove(DB_PATH)
    print(f"Banco de dados antigo '{DATABASE_FILE}' removido.")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Cria todas as tabelas
models.Base.metadata.create_all(bind=engine)
print("Tabelas do banco de dados criadas com sucesso.")

db = SessionLocal()

try:
    # --- DADOS DE TESTE (MOCK DATA) ---

    # 1. Categorias
    cat_moradia = models.Categoria(nome="Moradia", is_active=True)
    cat_alimentacao = models.Categoria(nome="Alimentação", is_active=True)
    cat_transporte = models.Categoria(nome="Transporte", is_active=True)
    cat_lazer = models.Categoria(nome="Lazer", is_active=True)
    cat_saude = models.Categoria(nome="Saúde", is_active=True)
    cat_compras = models.Categoria(nome="Compras", is_active=True)
    cat_educacao = models.Categoria(nome="Educação", is_active=True)
    db.add_all([cat_moradia, cat_alimentacao, cat_transporte, cat_lazer, cat_saude, cat_compras, cat_educacao])
    db.commit()
    print("Categorias inseridas.")

    # 2. Cartões de Crédito
    card_nubank = models.CartaoCredito(nome="Nubank", dia_fechamento=20, is_active=True)
    card_inter = models.CartaoCredito(nome="Inter", dia_fechamento=10, is_active=True)
    card_bradesco = models.CartaoCredito(nome="Bradesco", dia_fechamento=5, is_active=False) # Cartão inativo
    db.add_all([card_nubank, card_inter, card_bradesco])
    db.commit()
    print("Cartões de crédito inseridos.")

    # 3. Metas
    meta_viagem = models.Meta(nome="Viagem para o Japão", valor_objetivo=25000.0, data_objetivo=datetime(2026, 10, 1))
    meta_apto = models.Meta(nome="Entrada do Apartamento", valor_objetivo=50000.0, data_objetivo=datetime(2027, 12, 31))
    db.add_all([meta_viagem, meta_apto])
    db.commit()
    print("Metas inseridas.")

    # 4. Contribuições para as Metas
    contrib1 = models.Contribuicao(valor=1500, responsavel="Gustavo", meta_id=meta_viagem.id, data_contribuicao=datetime(2025, 7, 15))
    contrib2 = models.Contribuicao(valor=1200, responsavel="Luh", meta_id=meta_viagem.id, data_contribuicao=datetime(2025, 8, 15))
    contrib3 = models.Contribuicao(valor=2500, responsavel="Gustavo", meta_id=meta_apto.id, data_contribuicao=datetime(2025, 8, 20))
    db.add_all([contrib1, contrib2, contrib3])
    db.commit()
    print("Contribuições inseridas.")

    # 5. Gastos
    gastos_para_adicionar = [
        # --- Mês de Julho 2025 ---
        models.Gasto(nome="Aluguel", anotacao="Pagamento mensal", valor=2200.0, responsavel="Gustavo", data=datetime(2025, 7, 5), categoria_id=cat_moradia.id, cartao_id=None),
        models.Gasto(nome="Supermercado", anotacao="Compras da quinzena", valor=850.50, responsavel="Luh", data=datetime(2025, 7, 10), categoria_id=cat_alimentacao.id, cartao_id=card_inter.id),
        models.Gasto(nome="Cinema", anotacao="Filme novo com amigos", valor=80.0, responsavel="Gustavo", data=datetime(2025, 7, 18), categoria_id=cat_lazer.id, cartao_id=card_nubank.id),
        models.Gasto(nome="Uber", anotacao="Volta do cinema", valor=25.70, responsavel="Luh", data=datetime(2025, 7, 22), categoria_id=cat_transporte.id, cartao_id=card_nubank.id),
        
        # --- Mês de Agosto 2025 ---
        models.Gasto(nome="Conta de Luz", valor=180.0, responsavel="Gustavo", data=datetime(2025, 8, 8), categoria_id=cat_moradia.id, cartao_id=None),
        models.Gasto(nome="Restaurante Japonês", valor=220.0, responsavel="Gustavo", data=datetime(2025, 8, 12), categoria_id=cat_alimentacao.id, cartao_id=card_nubank.id),
        models.Gasto(nome="Farmácia", anotacao="Remédios e vitaminas", valor=115.40, responsavel="Luh", data=datetime(2025, 8, 19), categoria_id=cat_saude.id, cartao_id=card_nubank.id),
        
        # Compra parcelada que começa na fatura de Agosto
        models.Gasto(nome="Celular Novo", anotacao="iPhone 16", valor=3600.0, responsavel="Gustavo", data=datetime(2025, 8, 15), categoria_id=cat_compras.id, cartao_id=card_nubank.id, is_parcelado=True, numero_parcelas=12, valor_parcela=300.0),
        
        # Compra feita no dia do fechamento (deve ir para a próxima fatura)
        models.Gasto(nome="Tênis de Corrida", valor=450.0, responsavel="Luh", data=datetime(2025, 8, 20), categoria_id=cat_compras.id, cartao_id=card_nubank.id),
        
        # Compra feita após o fechamento (também vai para a próxima fatura)
        models.Gasto(nome="Livros", anotacao="Livros técnicos para estudo", valor=120.0, responsavel="Gustavo", data=datetime(2025, 8, 21), categoria_id=cat_educacao.id, cartao_id=card_nubank.id),
    ]
    db.add_all(gastos_para_adicionar)
    db.commit()
    print(f"{len(gastos_para_adicionar)} gastos inseridos.")

    print("\nBanco de dados populado com sucesso!")
    print(f"Arquivo '{DATABASE_FILE}' foi criado em '{os.path.dirname(DB_PATH)}'")

except Exception as e:
    print(f"\nOcorreu um erro: {e}")
    db.rollback()
finally:
    db.close()