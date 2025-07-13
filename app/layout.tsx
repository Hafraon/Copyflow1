@@ .. @@
 import { StrictMode } from 'react';
 import { createRoot } from 'react-dom/client';
 import App from './App.tsx';
 import './index.css';
+import './i18n';
import { initErrorTracking } from './lib/error-handling';

 createRoot(document.getElementById('root')!).render(
   <StrictMode>
     <App />
   </StrictMode>
 );

// Initialize error tracking
initErrorTracking();