import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
// Correction : Utilisation du bon fichier "LanguageContext"
import { LanguageProvider } from './contexts/LanguageContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
// Correction : Utilisation du bon chemin pour le BookingProvider
import { BookingProvider } from './contexts/BookingContext';
// Si vous n'avez pas de fichier index.css, vous pouvez commenter ou supprimer cette ligne.
// import './index.css'; 

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {/* Correction : Utilisation du bon composant LanguageProvider */}
        <LanguageProvider>
          <CurrencyProvider>
            <BookingProvider>
              <App />
            </BookingProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
