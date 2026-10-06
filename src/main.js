import './styles/milo.css';
import './styles/premium-icons.css';
import { installPremiumIcons } from './components/premium-icons.js';
import { initApp } from './app.js';

const app = document.getElementById('app');
if (app) {
  initApp(app);
  installPremiumIcons(app);
}
