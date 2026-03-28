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
import { renderStudentHub } from './pages/student-hub.js';
import { renderVoiceRooms } from './pages/voice-rooms.js';
import { renderAchievements } from './pages/achievements.js';
import { renderTherapistMatch } from './pages/therapist-match.js';
import { renderEmergencySupport } from './pages/emergency-support.js';

// Register routes
registerRoute('home', renderHome);
registerRoute('chat', renderChat);
registerRoute('resources', renderResources);
registerRoute('mood-tracker', renderMoodTracker);
registerRoute('about', renderAbout);
registerRoute('counselors', renderCounselors);
registerRoute('dashboard', renderDashboard); // Counselor Portal
registerRoute('student-hub', renderStudentHub);
registerRoute('voice-rooms', renderVoiceRooms);
registerRoute('achievements', renderAchievements);
registerRoute('therapist-match', renderTherapistMatch);
registerRoute('emergency', renderEmergencySupport);

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/src/sw.js').catch(err => console.log('SW reg failed:', err));
  });
}

// Initialize navigation
const navContainer = document.getElementById('main-nav');
renderNav(navContainer);

// Update nav on hash change
window.addEventListener('hashchange', () => {
  renderNav(navContainer);
});

// Start router
initRouter();

// ──── Proactive Crisis Check ────
const USER_ID = 'session_' + (localStorage.getItem('emosense_user_id') || 'test_user');
async function checkCrisisRisk() {
  try {
    const res = await fetch(`${window.location.origin}/api/crisis/predict/${USER_ID}`);
    if (!res.ok) return;
    const data = await res.json();

    if (data.proactiveMessages && data.proactiveMessages.length > 0) {
      showProactiveAlert(data.proactiveMessages[0]);
    }
  } catch (err) {
    console.error('Crisis check failed:', err);
  }
}

function showProactiveAlert(msg) {
  // Create alert overlay if it doesn't exist
  let overlay = document.getElementById('proactive-alert-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'proactive-alert-overlay';
    overlay.className = 'proactive-alert-overlay';
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
        <div class="proactive-alert-card">
            <h3>${msg.title}</h3>
            <p>${msg.message}</p>
            <div class="alert-actions">
                ${msg.actions.map(a => `<button class="alert-btn" onclick="handleAlertAction('${a.action}')">${a.label}</button>`).join('')}
            </div>
        </div>
    `;
  overlay.style.display = 'flex';
}

window.handleAlertAction = (action) => {
  document.getElementById('proactive-alert-overlay').style.display = 'none';
  if (action === 'counselor') window.location.hash = '#counselors';
  if (action === 'chat') window.location.hash = '#chat';
  if (action === 'coping') window.location.hash = '#chat'; // Could deep link to coping section
  if (action === 'emergency') window.location.hash = '#emergency';
  if (action.startsWith('call:')) window.location.href = `tel:${action.split(':')[1]}`;
};

// Check every 5 minutes
setInterval(checkCrisisRisk, 5 * 60 * 1000);
setTimeout(checkCrisisRisk, 3000); // Initial check after 3s
