import './styles/milo.css';
import { initApp } from './app.js';
import './styles/premium-icons.css';
import { installPremiumIcons } from './components/premium-icons.js';

const app = document.getElementById('app');
if (app) {
  initApp(app);
  installPremiumIcons(app);
}
