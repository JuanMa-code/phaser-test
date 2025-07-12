import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('game');
createRoot(container!).render(<App />);
