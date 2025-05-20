
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { supabase } from './lib/supabase'

// Add initialization for auth persistence
async function initializeApp() {
  // Try to restore auth session on page load
  await supabase.auth.getSession();
  
  createRoot(document.getElementById("root")!).render(<App />);
}

initializeApp();
