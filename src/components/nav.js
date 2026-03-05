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
  { href: '#about', label: 'About', icon: 'about' },
  { href: '#analytics', label: 'Analytics', icon: 'chart' },
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
  brain: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C9 2 7 4 7 6.5c0 1 .3 1.8.8 2.5C6.3 9.8 5 11.3 5 13c0 1.5.8 2.8 2 3.5-.2.5-.3 1-.3 1.5 0 2.2 1.8 4 4 4h2.6c2.2 0 4-1.8 4-4 0-.5-.1-1-.3-1.5 1.2-.7 2-2 2-3.5 0-1.7-1.3-3.2-2.8-3.9.5-.7.8-1.5.8-2.6C17 4 15 2 12 2z"/><path d="M12 2v20" opacity="0.3"/></svg>`
};

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
          <a href="#dashboard" class="navbar-portal ${current === 'dashboard' ? 'active' : ''}" id="nav-portal">
            ${ICONS.portal}
            Counselor Portal
          </a>
          <div class="navbar-secure" id="nav-secure">
            ${ICONS.lock}
            Anonymous & Secure
          </div>
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
      </ul>
    </div>
  `;

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

  // Close mobile nav on link click
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', closeMobileNav);
  });
}
