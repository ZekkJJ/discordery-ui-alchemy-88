
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { supabase } from '@/integrations/supabase/client';

// Ensure Supabase auth is initialized before rendering
(async () => {
  try {
    // Try to restore session from storage
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting session:", error);
    } else {
      console.log("Initial auth check complete, session exists:", !!data.session);
    }
  } catch (e) {
    console.error("Failed to initialize auth:", e);
  } finally {
    // Render the app regardless of auth status
    createRoot(document.getElementById("root")!).render(<App />);
  }
})();
