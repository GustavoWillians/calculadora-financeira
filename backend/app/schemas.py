from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from datetime import date

# --- Categoria Schemas ---

# Schema para exibir uma categoria na resposta da API
class Categoria(BaseModel):
    id: int
    nome: str

    class Config:
        from_attributes = True # Permite que o Pydantic leia dados de objetos do SQLAlchemy

# Schema para receber dados ao criar uma nova categoria
class CategoriaCreate(BaseModel):
    nome: str

# --- NOVOS SCHEMAS DE CARTÃO DE CRÉDITO ---
class CartaoCreditoBase(BaseModel):
    nome: str
    dia_fechamento: int

class CartaoCreditoCreate(CartaoCreditoBase):
    pass

class CartaoCredito(CartaoCreditoBase):
    id: int

    class Config:
        from_attributes = True

# Schema para receber dados ao criar um novo gasto
class GastoCreate(BaseModel):
    descricao: str
    valor: float # O valor aqui é o total
    responsavel: Optional[str] = "Eu"
    categoria_id: int
    data: date
    cartao_id: Optional[int] = None
    # NOVOS CAMPOS OPCIONAIS
    is_parcelado: Optional[bool] = False
    numero_parcelas: Optional[int] = 1
    valor_parcela: Optional[float] = None

class GastoUpdate(BaseModel):
    descricao: Optional[str] = None
    valor: Optional[float] = None
    responsavel: Optional[str] = None
    categoria_id: Optional[int] = None
    data: Optional[date] = None
    cartao_id: Optional[int] = None
    is_parcelado: Optional[bool] = None
    numero_parcelas: Optional[int] = None
    valor_parcela: Optional[float] = None

# Schema para exibir um gasto na resposta da API (inclui os dados da categoria)
class Gasto(BaseModel):
    id: int
    descricao: str
    valor: float
    responsavel: str
    data: datetime
    categoria: Categoria
    cartao: Optional[CartaoCredito] = None
    # NOVOS CAMPOS NA RESPOSTA
    is_parcelado: bool
    numero_parcelas: int
    valor_parcela: Optional[float] = None
    parcela_atual: Optional[int] = None

    class Config:
        from_attributes = True

# ... (schemas de Gasto/Categoria) ...

# --- NOVOS SCHEMAS DE CONTRIBUIÇÃO ---
class ContribuicaoBase(BaseModel):
    valor: float
    responsavel: str

class ContribuicaoCreate(ContribuicaoBase):
    data_contribuicao: date
    pass

class Contribuicao(ContribuicaoBase):
    id: int
    data_contribuicao: datetime

    class Config:
        from_attributes = True

# --- SCHEMAS DE META ATUALIZADOS ---
class MetaBase(BaseModel):
    nome: str
    valor_objetivo: float
    data_objetivo: date # Usamos 'date' para a entrada

class MetaCreate(MetaBase):
    pass

class Meta(MetaBase):
    id: int
    valor_atual: float # O Pydantic vai pegar o valor da propriedade que criamos
    data_criacao: datetime
    contribuicoes: List[Contribuicao] = []

    class Config:
        from_attributes = True