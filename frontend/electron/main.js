const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const waitOn = require('wait-on');

const isDev = process.env.IS_DEV === 'true';
let backendProcess = null;

function startPythonBackend() {
  const backendPath = app.isPackaged
    ? path.join(process.resourcesPath, 'backend')
    : path.join(__dirname, '..', '..', 'backend');

  console.log(`Iniciando backend a partir de: ${backendPath}`);

  const command = 'python';
  const args = ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'];
  if (isDev) {
    args.push('--reload');
  }

  backendProcess = spawn(command, args, { cwd: backendPath });

  backendProcess.stdout.on('data', (data) => console.log(`[Backend]: ${data}`));
  backendProcess.stderr.on('data', (data) => console.error(`[Backend ERR]: ${data}`));
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const url = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '..', 'dist', 'index.html')}`;

  if (isDev) {
    waitOn({ resources: [url] }, (err) => {
      if (err) {
        console.error('Servidor Vite não iniciou a tempo.', err);
        app.quit();
      } else {
        mainWindow.loadURL(url);
        mainWindow.webContents.openDevTools();
      }
    });
  } else {
    // Em produção, aguarda o backend iniciar antes de carregar
    waitOn({ resources: ['tcp:127.0.0.1:8000'] }, (err) => {
       if (err) {
         console.error('Backend não iniciou a tempo.', err);
         app.quit();
       } else {
         mainWindow.loadURL(url);
       }
    });
  }
}

app.whenReady().then(() => {
  startPythonBackend();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Garante que o processo do backend seja encerrado ao fechar o app
app.on('will-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
});