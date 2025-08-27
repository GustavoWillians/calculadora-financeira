import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'; // <-- MUDANÇA AQUI
import { SnackbarProvider } from 'notistack';
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter> {/* <-- MUDANÇA AQUI */}
      <SnackbarProvider
        maxSnack={3}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <App />
      </SnackbarProvider>
    </HashRouter> {/* <-- MUDANÇA AQUI */}
  </React.StrictMode>,
)