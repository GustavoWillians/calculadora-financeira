from sqlalchemy import Boolean, Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship, Mapped
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Categoria(Base):
    __tablename__ = "categorias"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    gastos = relationship("Gasto", back_populates="categoria")

class CartaoCredito(Base):
    __tablename__ = "cartoes_credito"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True, index=True, nullable=False)
    dia_fechamento = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    gastos = relationship("Gasto", back_populates="cartao")

class Meta(Base):
    __tablename__ = "metas"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True, nullable=False)
    valor_objetivo = Column(Float, nullable=False)
    data_objetivo = Column(DateTime, nullable=False)
    data_criacao = Column(DateTime, default=datetime.utcnow)
    contribuicoes = relationship("Contribuicao", back_populates="meta", cascade="all, delete-orphan")

    @property
    def valor_atual(self):
        return sum(c.valor for c in self.contribuicoes)

# Contribuição DEPOIS de Meta
class Contribuicao(Base):
    __tablename__ = "contribuicoes"
    id = Column(Integer, primary_key=True, index=True)
    valor = Column(Float, nullable=False)
    responsavel = Column(String, index=True, nullable=False)
    data_contribuicao = Column(DateTime, default=datetime.utcnow)
    meta_id = Column(Integer, ForeignKey("metas.id"))
    meta = relationship("Meta", back_populates="contribuicoes")

# Gasto por último
class Gasto(Base):
    __tablename__ = "gastos"

    id = Column(Integer, primary_key=True, index=True)
    descricao = Column(String, index=True)
    valor = Column(Float, nullable=False) # Este será o VALOR TOTAL da compra
    responsavel = Column(String, default="Eu", index=True)
    data = Column(DateTime, nullable=False)
    
    # NOVOS CAMPOS PARA PARCELAMENTO
    is_parcelado = Column(Boolean, default=False)
    numero_parcelas = Column(Integer, default=1)
    valor_parcela = Column(Float, nullable=True) # Valor de cada parcela
    
    categoria_id = Column(Integer, ForeignKey("categorias.id"))
    categoria = relationship("Categoria", back_populates="gastos")
    cartao_id = Column(Integer, ForeignKey("cartoes_credito.id"), nullable=True)
    cartao = relationship("CartaoCredito", back_populates="gastos")