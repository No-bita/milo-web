import './styles/milo.css';
import './styles/ux-fixes.css';
import './styles/ux-context.css';
import './styles/premium-icons.css';
import './styles/polish.css';
import { initApp } from './app.js';
import { installPremiumIcons } from './components/premium-icons.js';

const app = document.getElementById('app');
if (app) {
  initApp(app);
  installPremiumIcons(app);
}
