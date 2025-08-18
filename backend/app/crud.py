# backend/app/crud.py
from sqlalchemy.orm import Session
from . import models, schemas

# Função para criar um novo gasto
def create_gasto(db: Session, gasto: schemas.GastoCreate):
    db_gasto = models.Gasto(descricao=gasto.descricao, valor=gasto.valor)
    db.add(db_gasto)
    db.commit()
    db.refresh(db_gasto)
    return db_gasto

# Função para buscar uma lista de gastos
def get_gastos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Gasto).offset(skip).limit(limit).all()