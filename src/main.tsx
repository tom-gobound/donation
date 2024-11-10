import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { initializeFirebase } from './lib/firebase';

const init = async () => {
  try {
    await initializeFirebase();
    
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (error) {
    console.error('Application initialization failed:', error);
    document.getElementById('root')!.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <h1>Unable to load application</h1>
        <p>Please refresh the page or try again later.</p>
      </div>
    `;
  }
};

init();