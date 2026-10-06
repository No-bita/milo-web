import './styles/milo.css';
import './styles/ux-fixes.css';
import { initApp } from './app.js';

const app = document.getElementById('app');
if (app) {
  initApp(app);
}
