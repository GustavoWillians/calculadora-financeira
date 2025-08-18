import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'; // Importe
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* Adicione aqui */}
      <App />
    </BrowserRouter> {/* E aqui */}
  </React.StrictMode>,
)