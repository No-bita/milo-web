import './styles/milo.css';
import './styles/deck-labels.css';
import { initApp } from './app.js';

const app = document.getElementById('app');
if (app) {
  initApp(app);
}
