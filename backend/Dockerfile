# Usar uma imagem oficial do Python
FROM python:3.11-slim

# 1. Mudar o WORKDIR para um "corredor" genérico
WORKDIR /code

# Copiar o arquivo de dependências e instalar
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 2. Copiar a sua pasta 'app' para dentro do WORKDIR
COPY ./app /code/app

# Expor a porta que a aplicação vai rodar
EXPOSE 8000

# 3. Este comando agora vai funcionar, pois estamos no "corredor" /code
# e o Python consegue "ver" a pasta /code/app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]