import './styles/milo.css';
import './styles/ux-context.css';
import { initApp } from './app.js';
import { initPartnerContext } from './ux-context.js';

const app = document.getElementById('app');
if (app) {
  initApp(app);
  initPartnerContext(app);
}
