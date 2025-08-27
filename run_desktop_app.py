import sys
import os
import threading
import uvicorn
import webview
import shutil # <-- LINHA ADICIONADA E CORRIGIDA
from backend.app.main import app as fastapi_app

# --- FUNÇÃO AUXILIAR PARA ENCONTRAR ARQUIVOS EMPACOTADOS ---
def resource_path(relative_path):
    """ Retorna o caminho absoluto para o recurso, funciona para dev e para o PyInstaller """
    try:
        # O PyInstaller cria uma pasta temporária e armazena o caminho em _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)

# --- LÓGICA DO SERVIDOR ---
def run_server():
    # --- LÓGICA DE GERENCIAMENTO DO BANCO DE DADOS ---
    
    # 1. Define um caminho seguro e com permissão de escrita na pasta de dados do usuário
    app_data_path = os.path.join(os.path.expanduser('~'), 'AppData', 'Roaming', 'CalculadoraFinanceira')
    os.makedirs(app_data_path, exist_ok=True) # Cria a pasta se ela não existir
    
    persistent_db_path = os.path.join(app_data_path, 'app.db')

    # 2. Na primeira execução, copia o banco de dados do pacote para a pasta de dados
    if not os.path.exists(persistent_db_path):
        bundle_db_path = resource_path(os.path.join("backend", "app.db"))
        # Garante que o arquivo de origem existe antes de tentar copiar
        if os.path.exists(bundle_db_path):
            shutil.copy2(bundle_db_path, persistent_db_path)
            print(f"Banco de dados inicializado em: {persistent_db_path}")
        else:
            print(f"AVISO: Arquivo de banco de dados 'molde' não encontrado em {bundle_db_path}")


    # 3. Usa o banco de dados persistente para iniciar o servidor
    os.environ["DATABASE_URL"] = f"sqlite:///{persistent_db_path}"
    
    uvicorn.run(fastapi_app, host="127.0.0.1", port=8000)

# --- LÓGICA PRINCIPAL DA APLICAÇÃO ---
if __name__ == '__main__':
    server_thread = threading.Thread(target=run_server)
    server_thread.daemon = True
    server_thread.start()

    frontend_path = resource_path(os.path.join("frontend", "dist", "index.html"))

    webview.create_window(
        'Calculadora Financeira',
        f'file://{frontend_path}',
        width=1280,
        height=720,
        min_size=(1024, 600)
    )
    webview.start()