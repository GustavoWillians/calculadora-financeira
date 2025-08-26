const { app, BrowserWindow } = require('electron');
const path = require('path');

// Verifica se está em modo de desenvolvimento
const isDev = process.env.IS_DEV === 'true';

function createWindow() {
  // Cria a janela do navegador.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Carrega a URL do app Vite (em desenvolvimento) ou o arquivo HTML (em produção).
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Abre as Ferramentas de Desenvolvedor.
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});