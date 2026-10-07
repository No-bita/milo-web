import './styles/milo.css';
import './styles/ux-fixes.css';
import './styles/ux-context.css';
import './styles/premium-icons.css';
import './styles/polish.css';
import './styles/waiting-glasses.css';
import './styles/deck-labels.css';
import './styles/skip-line.css';
import './styles/s3-compact.css';
import './styles/first-open.css';
import './styles/partner-welcome.css';
import { showFirstOpen } from './components/first-open.js';
import { initApp } from './app.js';
import { installPremiumIcons } from './components/premium-icons.js';

const app = document.getElementById('app');
if (app) {
  showFirstOpen(app, () => {
    initApp(app);
    installPremiumIcons(app);
  });
}
