/**
 * EmoSense Navigation Component
 */

import { getCurrentRoute } from '../router.js';

const NAV_LINKS = [
  { href: '#home', label: 'Home', icon: 'home' },
  { href: '#chat', label: 'Talk to EmoSense', icon: 'chat' },
  { href: '#counselors', label: 'Counselors', icon: 'people' },
  { href: '#resources', label: 'Resources', icon: 'resources' },
  { href: '#mood-tracker', label: 'Mood Tracker', icon: 'chart' },
  { href: '#voice-rooms', label: 'Safe Space', icon: 'mic' },
  { href: '#feedback', label: 'Feedback', icon: 'feedback' },
  { href: '#about', label: 'About', icon: 'about' },
];

const STAFF_LINKS = [
  { href: '#dashboard', label: 'Counselor Dashboard', icon: '🩺' },
  { href: '#supervisor', label: 'Supervisor Portal', icon: '🛡️' },
  { href: '#analytics', label: 'Analytics', icon: '📊' },
  { href: '#counselor-register', label: 'Register as Counselor', icon: '📝' },
];

const ICONS = {
  home: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  chat: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
  people: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  resources: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
  chart: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
  about: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  lock: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  portal: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  brain: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C9 2 7 4 7 6.5c0 1 .3 1.8.8 2.5C6.3 9.8 5 11.3 5 13c0 1.5.8 2.8 2 3.5-.2.5-.3 1-.3 1.5 0 2.2 1.8 4 4 4h2.6c2.2 0 4-1.8 4-4 0-.5-.1-1-.3-1.5 1.2-.7 2-2 2-3.5 0-1.7-1.3-3.2-2.8-3.9.5-.7.8-1.5.8-2.6C17 4 15 2 12 2z"/><path d="M12 2v20" opacity="0.3"/></svg>`,
  mic: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,
  feedback: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`
};

function getCounselorNavIndicator() {
  try {
    const token = localStorage.getItem('emosense_counselor_token');
    if (token) {
      // Decode JWT payload (base64)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const name = payload.name || 'Counselor';
      return `
        <div class="navbar-secure" id="nav-secure" style="display: flex; align-items: center; gap: 8px;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: #22c55e;"></span>
          <span style="font-size: 0.8rem; color: white; font-weight: 500;">${name}</span>
          <button id="nav-logout-btn" style="background: rgba(239,68,68,0.12); color: #f87171; border: 1px solid rgba(239,68,68,0.2); padding: 3px 10px; border-radius: 8px; font-size: 0.7rem; cursor: pointer; font-family: inherit;">Logout</button>
        </div>`;
    }
  } catch(e) {}
  return `<div class="navbar-secure" id="nav-secure">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    Anonymous &amp; Secure
  </div>`;
}

export function renderNav(container) {
  const current = getCurrentRoute();

  container.innerHTML = `
    <div class="navbar">
      <div class="container navbar-inner">
        <a href="#home" class="navbar-brand" id="nav-brand">
          ${ICONS.brain}
          EmoSense
        </a>

        <ul class="navbar-links" id="nav-links">
          ${NAV_LINKS.map(link => `
            <li>
              <a href="${link.href}" class="${current === link.href.slice(1) ? 'active' : ''}" id="nav-${link.icon}">
                ${ICONS[link.icon]}
                ${link.label}
              </a>
            </li>
          `).join('')}
        </ul>

        <div class="navbar-right">
          <div class="navbar-portal-dropdown" id="portal-dropdown">
            <button class="navbar-portal ${['dashboard','supervisor','analytics'].includes(current) ? 'active' : ''}" id="portal-toggle">
              ${ICONS.portal}
              Staff Portal
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="portal-menu" id="portal-menu">
              ${STAFF_LINKS.map(link => `
                <a href="${link.href}" class="portal-menu-item ${current === link.href.slice(1) ? 'active' : ''}">
                  <span>${link.icon}</span> ${link.label}
                </a>
              `).join('')}
            </div>
          </div>
          ${getCounselorNavIndicator()}
        </div>

        <button class="hamburger" id="hamburger-btn" aria-label="Open menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>

    <div class="mobile-nav-overlay" id="mobile-nav-overlay"></div>
    <div class="mobile-nav" id="mobile-nav">
      <button class="mobile-nav-close" id="mobile-nav-close" aria-label="Close menu">✕</button>
      <ul class="mobile-nav-links">
        ${NAV_LINKS.map(link => `
          <li>
            <a href="${link.href}" class="mobile-nav-link ${current === link.href.slice(1) ? 'active' : ''}">
              ${ICONS[link.icon]}
              ${link.label}
            </a>
          </li>
        `).join('')}
        <li style="border-top: 1px solid var(--gray-200); margin-top: 0.5rem; padding-top: 0.5rem;">
          <div style="padding: 0.5rem 1rem; font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Staff Access</div>
        </li>
        ${STAFF_LINKS.map(link => `
          <li>
            <a href="${link.href}" class="mobile-nav-link ${current === link.href.slice(1) ? 'active' : ''}">
              <span style="font-size: 1rem;">${link.icon}</span>
              ${link.label}
            </a>
          </li>
        `).join('')}
      </ul>
    </div>
  `;

  // Portal dropdown toggle
  const portalToggle = document.getElementById('portal-toggle');
  const portalMenu = document.getElementById('portal-menu');
  portalToggle?.addEventListener('click', (e) => {
    e.preventDefault();
    portalMenu.classList.toggle('show');
  });
  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#portal-dropdown')) {
      portalMenu?.classList.remove('show');
    }
  });
  // Close dropdown on link click
  portalMenu?.querySelectorAll('.portal-menu-item').forEach(link => {
    link.addEventListener('click', () => portalMenu.classList.remove('show'));
  });

  // Mobile nav handlers
  const hamburger = document.getElementById('hamburger-btn');
  const mobileNav = document.getElementById('mobile-nav');
  const overlay = document.getElementById('mobile-nav-overlay');
  const closeBtn = document.getElementById('mobile-nav-close');

  const openMobileNav = () => {
    mobileNav.classList.add('active');
    overlay.classList.add('active');
    overlay.style.display = 'block';
  };

  const closeMobileNav = () => {
    mobileNav.classList.remove('active');
    overlay.classList.remove('active');
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
  };

  hamburger?.addEventListener('click', openMobileNav);
  closeBtn?.addEventListener('click', closeMobileNav);
  overlay?.addEventListener('click', closeMobileNav);

  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', closeMobileNav);
  });

  // Nav logout button (for logged-in counselors)
  document.getElementById('nav-logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('emosense_counselor_token');
    sessionStorage.removeItem('emosense_counselor_token'); // Clean up any stale sessionStorage tokens
    window.location.hash = '#home';
    window.location.reload();
  });
}
