import './styles/milo.css';
import './styles/polish.css';
import { initApp } from './app.js';

const app = document.getElementById('app');
if (app) {
  initApp(app);
}
