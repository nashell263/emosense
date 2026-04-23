/**
 * EmoSense Onboarding Guide — First-time user tour + context-aware assistant
 */

const TOUR_STEPS = [
  { target: '#nav-chat', title: 'Talk to EmoSense', desc: 'Chat with our AI counselor anytime, 24/7. It understands your emotions.', icon: '💬' },
  { target: '#nav-people', title: 'Find a Counselor', desc: 'Get matched with a human counselor through our smart triage system.', icon: '🩺' },
  { target: '#nav-mic', title: 'Safe Space Rooms', desc: 'Join moderated group support sessions with voice and chat.', icon: '🎙️' },
  { target: '.sos-floating-btn, .sos-btn', title: 'Emergency SOS', desc: 'Tap this anytime for immediate crisis support and alerts.', icon: '🚨' },
];

export function initOnboardingGuide() {
  if (localStorage.getItem('emosense_tour_done')) {
    renderGuideIcon();
    return;
  }
  showWelcomePrompt();
}

function showWelcomePrompt() {
  const el = document.createElement('div');
  el.id = 'onboarding-welcome';
  el.innerHTML = `
    <div class="guide-welcome">
      <div class="guide-avatar">🧭</div>
      <div class="guide-welcome-body">
        <div class="guide-welcome-title">Hi there! 👋</div>
        <div class="guide-welcome-text">I'm your EmoSense guide. Want a quick tour?</div>
        <div class="guide-welcome-actions">
          <button class="guide-btn-start" id="guide-start">Yes, show me</button>
          <button class="guide-btn-skip" id="guide-skip">Skip</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(el);

  document.getElementById('guide-start').onclick = () => { el.remove(); startTour(0); };
  document.getElementById('guide-skip').onclick = () => { el.remove(); localStorage.setItem('emosense_tour_done', '1'); renderGuideIcon(); };
}

function startTour(stepIndex) {
  document.querySelectorAll('.guide-overlay, .guide-tooltip').forEach(e => e.remove());
  if (stepIndex >= TOUR_STEPS.length) {
    localStorage.setItem('emosense_tour_done', '1');
    showTourComplete();
    return;
  }

  const step = TOUR_STEPS[stepIndex];
  const target = document.querySelector(step.target);

  // Overlay
  const overlay = document.createElement('div');
  overlay.className = 'guide-overlay';
  document.body.appendChild(overlay);

  // Tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'guide-tooltip';
  tooltip.innerHTML = `
    <div style="font-size:1.5rem;margin-bottom:0.25rem;">${step.icon}</div>
    <div style="font-weight:700;margin-bottom:0.25rem;">${step.title}</div>
    <div style="font-size:0.85rem;color:var(--gray-600);margin-bottom:0.75rem;">${step.desc}</div>
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:0.75rem;color:var(--gray-400);">${stepIndex + 1} of ${TOUR_STEPS.length}</span>
      <button class="guide-btn-next" id="guide-next">${stepIndex < TOUR_STEPS.length - 1 ? 'Next →' : 'Finish ✓'}</button>
    </div>
  `;
  document.body.appendChild(tooltip);

  // Position tooltip near target
  if (target) {
    target.style.position = 'relative';
    target.style.zIndex = '10001';
    target.style.boxShadow = '0 0 0 4px rgba(20, 184, 166, 0.4)';
    target.style.borderRadius = '8px';
    const rect = target.getBoundingClientRect();
    tooltip.style.top = (rect.bottom + 12) + 'px';
    tooltip.style.left = Math.max(16, Math.min(rect.left, window.innerWidth - 320)) + 'px';
  } else {
    tooltip.style.top = '50%';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translate(-50%, -50%)';
  }

  document.getElementById('guide-next').onclick = () => {
    if (target) { target.style.zIndex = ''; target.style.boxShadow = ''; }
    overlay.remove();
    tooltip.remove();
    startTour(stepIndex + 1);
  };

  overlay.onclick = () => {
    if (target) { target.style.zIndex = ''; target.style.boxShadow = ''; }
    overlay.remove();
    tooltip.remove();
    localStorage.setItem('emosense_tour_done', '1');
    renderGuideIcon();
  };
}

function showTourComplete() {
  const el = document.createElement('div');
  el.className = 'guide-welcome';
  el.style.cssText = 'position:fixed;bottom:24px;left:24px;z-index:10000;';
  el.innerHTML = `
    <div class="guide-avatar">✅</div>
    <div class="guide-welcome-body">
      <div class="guide-welcome-title">You're all set!</div>
      <div class="guide-welcome-text">Explore freely. Tap the 🧭 icon anytime for help.</div>
    </div>
  `;
  document.body.appendChild(el);
  setTimeout(() => { el.remove(); renderGuideIcon(); }, 3500);
}

function renderGuideIcon() {
  if (document.getElementById('guide-icon-btn')) return;
  const btn = document.createElement('button');
  btn.id = 'guide-icon-btn';
  btn.className = 'guide-icon-btn';
  btn.innerHTML = '🧭';
  btn.title = 'Need help? Take a tour';
  btn.onclick = () => {
    localStorage.removeItem('emosense_tour_done');
    btn.remove();
    showWelcomePrompt();
  };
  document.body.appendChild(btn);
}
