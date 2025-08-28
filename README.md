#  Calculadora Financeira Pessoal - Aplicativo de Desktop

## 📝 Sobre o Projeto

Este é um aplicativo de desktop completo para controle financeiro pessoal, criado com o objetivo de substituir planilhas complexas e oferecer uma experiência de usuário mais simples e intuitiva. O projeto foi desenvolvido para ajudar a gerenciar despesas diárias, faturas de cartão de crédito e metas financeiras de forma visual e organizada.

O aplicativo funciona de forma 100% offline e autocontida, com um executável único para Windows.

---

## ✨ Funcionalidades Principais

* **Dashboard (Visão Geral):** Uma tela inicial com KPIs (Key Performance Indicators) que resumem o impacto financeiro do mês, incluindo gasto total, total em cartões e total em débito.
* **Gráficos Interativos:** Análise visual dos gastos por categoria, com filtros por tipo de pagamento (débito/cartão) e por responsável.
* **Gerenciamento de Faturas:** Uma tela dedicada para visualizar o histórico de faturas de cada cartão de crédito, com cálculo preciso do período de compras baseado no dia de fechamento.
* **Controle de Parcelas:** Suporte completo para compras parceladas, com as parcelas sendo corretamente alocadas em suas respectivas faturas.
* **Gerenciamento de Metas:** Crie e acompanhe o progresso de objetivos financeiros, como viagens ou grandes compras.
* **CRUD Completo:** Funcionalidades para Adicionar, Editar e Excluir gastos, categorias e cartões, sempre mantendo a integridade do histórico financeiro (soft delete).

---

## 🚀 Tecnologias Utilizadas

Este projeto foi construído com uma stack moderna, combinando a robustez do Python no backend com a reatividade do React no frontend.

* **Backend:**
    * **Python 3.10+**
    * **FastAPI:** Para a construção da API REST.
    * **SQLAlchemy:** Como ORM para a comunicação com o banco de dados.
    * **SQLite:** Como banco de dados de arquivo único, ideal para uma aplicação de desktop.

* **Frontend:**
    * **React:** Para a construção da interface de usuário.
    * **Vite:** Como ferramenta de build e servidor de desenvolvimento.
    * **Material-UI (MUI):** Para a biblioteca de componentes visuais.
    * **Recharts:** Para a criação dos gráficos.

* **Empacotamento para Desktop:**
    * **PyInstaller:** Para empacotar o backend, o frontend e todas as dependências em um único executável (`.exe`).
    * **pywebview:** Para criar a janela nativa do Windows que exibe a interface React.

---

## 🛠️ Como Gerar o Executável (`.exe`)

Para compilar o projeto e gerar o instalador para Windows, siga os passos abaixo.

### Pré-requisitos
* Python 3.10+ instalado e adicionado ao PATH.
* Node.js e npm instalados.

### Passo a Passo

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/seu-usuario/seu-repositorio.git](https://github.com/seu-usuario/seu-repositorio.git)
    cd seu-repositorio
    ```

2.  **Crie e ative um ambiente virtual para o Python:**
    ```bash
    python -m venv venv
    .\venv\Scripts\activate
    ```

3.  **Instale as dependências do backend:**
    ```bash
    pip install -r backend/requirements.txt
    pip install pywebview pyinstaller 
    ```

4.  **Instale as dependências e compile o frontend:**
    ```bash
    cd frontend
    npm install
    npm run build
    cd .. 
    ```

5.  **Gere o executável com PyInstaller:**
    Na pasta raiz do projeto, execute o comando:
    ```bash
    pyinstaller --name "CalculadoraFinanceira" --onefile --add-data "frontend/dist;frontend/dist" --add-data "backend;backend" --hidden-import "uvicorn.lifespan.on" --hidden-import "uvicorn.loops.auto" --hidden-import "uvicorn.protocols.http.auto" run_desktop_app.py
    ```

6.  **Pronto!** O executável final estará na pasta `dist` que foi criada na raiz do projeto.
