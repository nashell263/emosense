/**
 * EmoSense - Main Entry Point
 * Initializes routing, navigation, and page rendering.
 */

import './styles/index.css';
import './styles/voice-rooms.css';
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
import { renderVoiceRooms } from './pages/voice-rooms.js';
import { renderFeedback } from './pages/feedback.js';
import { renderEmergencyButton } from './components/emergency-button.js';
import { initOnboardingGuide } from './components/onboarding-guide.js';
import { renderSupervisor } from './pages/supervisor.js';
import { renderCounselorRegister } from './pages/counselor-register.js';

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
registerRoute('voice-rooms', renderVoiceRooms);
registerRoute('feedback', renderFeedback);
registerRoute('supervisor', renderSupervisor);
registerRoute('counselor-register', renderCounselorRegister);

// Update nav on hash change
window.addEventListener('hashchange', () => {
  renderNav(navContainer);
});

// Start router
initRouter();

// Initialize Global SOS Button
renderEmergencyButton(document.body);

// Initialize Onboarding Guide (first-time user tour)
setTimeout(() => initOnboardingGuide(), 1500);
