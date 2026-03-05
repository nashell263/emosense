/**
 * EmoSense - Main Entry Point
 * Initializes routing, navigation, and page rendering.
 */

import './styles/index.css';
import { registerRoute, initRouter } from './router.js';
import { renderNav } from './components/nav.js';
import { renderHome } from './pages/home.js';
import { renderChat } from './pages/chat.js';
import { renderResources } from './pages/resources.js';
import { renderMoodTracker } from './pages/mood-tracker.js';
import { renderAbout } from './pages/about.js';
import { renderCounselors } from './pages/counselors.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderAnalytics } from './pages/analytics.js';

// Initialize navigation
const navContainer = document.getElementById('main-nav');
renderNav(navContainer);

// Register routes
registerRoute('home', renderHome);
registerRoute('chat', renderChat);
registerRoute('resources', renderResources);
registerRoute('mood-tracker', renderMoodTracker);
registerRoute('about', renderAbout);
registerRoute('counselors', renderCounselors);
registerRoute('dashboard', renderDashboard);
registerRoute('analytics', renderAnalytics);

// Update nav on hash change
window.addEventListener('hashchange', () => {
  renderNav(navContainer);
});

// Start router
initRouter();
