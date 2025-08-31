import os
import sys
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import random

# Adiciona o diretório raiz ao path para que o script encontre a pasta 'backend'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app import models

# --- CONFIGURAÇÃO ---
DATABASE_FILE = "app.db"
DB_PATH = os.path.join(os.path.dirname(__file__), DATABASE_FILE)
DATABASE_URL = f"sqlite:///{DB_PATH}"

if os.path.exists(DB_PATH):
    os.remove(DB_PATH)
    print(f"Banco de dados antigo '{DATABASE_FILE}' removido.")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

models.Base.metadata.create_all(bind=engine)
print("Tabelas do banco de dados criadas com sucesso.")

db = SessionLocal()

try:
    # --- DADOS DE TESTE (MOCK DATA) ---
    print("Iniciando a inserção de dados...")

    # 1. Categorias
    categorias = [
        models.Categoria(nome="Moradia", is_active=True),
        models.Categoria(nome="Alimentação", is_active=True),
        models.Categoria(nome="Transporte", is_active=True),
        models.Categoria(nome="Lazer", is_active=True),
        models.Categoria(nome="Saúde", is_active=True),
        models.Categoria(nome="Compras", is_active=True),
        models.Categoria(nome="Educação", is_active=True),
        models.Categoria(nome="Assinaturas", is_active=True),
        models.Categoria(nome="Viagens", is_active=True),
        models.Categoria(nome="Pessoal", is_active=True),
    ]
    db.add_all(categorias)
    db.commit()
    cat_moradia, cat_alimentacao, cat_transporte, cat_lazer, cat_saude, cat_compras, cat_educacao, cat_assinaturas, cat_viagens, cat_pessoal = categorias
    print(f"{len(categorias)} categorias inseridas.")

    # 2. Cartões de Crédito
    card_nubank = models.CartaoCredito(nome="Nubank", dia_fechamento=20, is_active=True)
    card_inter = models.CartaoCredito(nome="Inter", dia_fechamento=28, is_active=True)
    card_bradesco = models.CartaoCredito(nome="Bradesco", dia_fechamento=5, is_active=False)
    db.add_all([card_nubank, card_inter, card_bradesco])
    db.commit()
    print("3 cartões de crédito inseridos.")

    # 3. Metas
    meta_viagem = models.Meta(nome="Viagem para a Europa", valor_objetivo=30000.0, data_objetivo=datetime(2026, 12, 20))
    meta_carro = models.Meta(nome="Entrada do Carro", valor_objetivo=15000.0, data_objetivo=datetime(2026, 6, 1))
    db.add_all([meta_viagem, meta_carro])
    db.commit()
    print("2 metas inseridas.")

    # 4. Contribuições para as Metas
    contribs = [
        models.Contribuicao(valor=1000, responsavel="Gustavo", meta_id=meta_viagem.id, data_contribuicao=datetime(2025, 6, 10)),
        models.Contribuicao(valor=800, responsavel="Luh", meta_id=meta_viagem.id, data_contribuicao=datetime(2025, 7, 12)),
        models.Contribuicao(valor=1200, responsavel="Gustavo", meta_id=meta_viagem.id, data_contribuicao=datetime(2025, 8, 15)),
        models.Contribuicao(valor=500, responsavel="Gustavo", meta_id=meta_carro.id, data_contribuicao=datetime(2025, 7, 25)),
        models.Contribuicao(valor=750, responsavel="Gustavo", meta_id=meta_carro.id, data_contribuicao=datetime(2025, 8, 25)),
    ]
    db.add_all(contribs)
    db.commit()
    print(f"{len(contribs)} contribuições inseridas.")

    # 5. Gastos
    gastos_para_adicionar = [
        # --- JUNHO 2025 ---
        models.Gasto(nome="Aluguel", valor=2200.0, responsavel="Gustavo", data=datetime(2025, 6, 5), categoria_id=cat_moradia.id, cartao_id=None),
        models.Gasto(nome="Supermercado", valor=780.20, responsavel="Luh", data=datetime(2025, 6, 8), categoria_id=cat_alimentacao.id, cartao_id=card_inter.id),
        models.Gasto(nome="Netflix", valor=39.90, responsavel="Gustavo", data=datetime(2025, 6, 15), categoria_id=cat_assinaturas.id, cartao_id=card_nubank.id),
        models.Gasto(nome="Gasolina", valor=150.0, responsavel="Gustavo", data=datetime(2025, 6, 22), categoria_id=cat_transporte.id, cartao_id=card_nubank.id), # Fatura de Julho

        # --- JULHO 2025 ---
        models.Gasto(nome="Aluguel", valor=2200.0, responsavel="Gustavo", data=datetime(2025, 7, 5), categoria_id=cat_moradia.id, cartao_id=None),
        models.Gasto(nome="Feira", valor=120.0, responsavel="Luh", data=datetime(2025, 7, 12), categoria_id=cat_alimentacao.id, cartao_id=None),
        models.Gasto(nome="Cinema", valor=95.0, responsavel="Luh", data=datetime(2025, 7, 19), categoria_id=cat_lazer.id, cartao_id=card_nubank.id), # Fatura de Julho
        models.Gasto(nome="Jantar Romântico", valor=350.0, responsavel="Gustavo", data=datetime(2025, 7, 20), categoria_id=cat_lazer.id, cartao_id=card_nubank.id), # Fatura de Agosto
        models.Gasto(nome="Fone de Ouvido", valor=600.0, responsavel="Gustavo", data=datetime(2025, 7, 25), categoria_id=cat_compras.id, cartao_id=card_nubank.id, is_parcelado=True, numero_parcelas=3, valor_parcela=200.0), # Fatura de Agosto

        # --- AGOSTO 2025 ---
        models.Gasto(nome="Aluguel", valor=2200.0, responsavel="Gustavo", data=datetime(2025, 8, 5), categoria_id=cat_moradia.id, cartao_id=None),
        models.Gasto(nome="Supermercado", valor=910.45, responsavel="Luh", data=datetime(2025, 8, 10), categoria_id=cat_alimentacao.id, cartao_id=card_inter.id),
        models.Gasto(nome="Show", valor=450.0, responsavel="Luh", data=datetime(2025, 8, 16), categoria_id=cat_lazer.id, cartao_id=card_nubank.id), # Fatura de Agosto
        models.Gasto(nome="Roupas", valor=380.0, responsavel="Luh", data=datetime(2025, 8, 19), categoria_id=cat_compras.id, cartao_id=card_nubank.id), # Fatura de Agosto
        models.Gasto(nome="Curso Online", valor=1200.0, responsavel="Gustavo", data=datetime(2025, 8, 20), categoria_id=cat_educacao.id, cartao_id=card_nubank.id, is_parcelado=True, numero_parcelas=4, valor_parcela=300.0), # Fatura de Setembro
        models.Gasto(nome="Presente", valor=250.0, responsavel="Gustavo", data=datetime(2025, 8, 25), categoria_id=cat_pessoal.id, cartao_id=card_nubank.id), # Fatura de Setembro
        
        # --- SETEMBRO 2025 ---
        models.Gasto(nome="Aluguel", valor=2200.0, responsavel="Gustavo", data=datetime(2025, 9, 5), categoria_id=cat_moradia.id, cartao_id=None),
        models.Gasto(nome="Passagem Aérea", valor=1800.0, responsavel="Gustavo", data=datetime(2025, 9, 8), categoria_id=cat_viagens.id, cartao_id=card_inter.id, is_parcelado=True, numero_parcelas=6, valor_parcela=300.0),
        models.Gasto(nome="Spotify", valor=21.90, responsavel="Luh", data=datetime(2025, 9, 15), categoria_id=cat_assinaturas.id, cartao_id=card_nubank.id), # Fatura de Setembro
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
