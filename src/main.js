import './styles/milo.css';
import './styles/polish.css';
import './styles/waiting-glasses.css';
import { initApp } from './app.js';

const app = document.getElementById('app');
if (app) {
  initApp(app);
}
