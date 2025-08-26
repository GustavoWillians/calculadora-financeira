# Usar uma imagem oficial do Node.js
FROM node:20-alpine

# Definir o diretório de trabalho
WORKDIR /app

# Copiar os arquivos de dependência e instalar
# Copiamos estes primeiro para aproveitar o cache do Docker
COPY package.json .
COPY package-lock.json .
RUN npm install

# Copiar o resto do código do frontend
COPY . .

# Expor a porta que o Vite usa para desenvolvimento
EXPOSE 5173

# Comando para iniciar o servidor de desenvolvimento
# A flag --host já está no package.json, mas podemos garantir aqui também
CMD ["npm", "run", "start"]