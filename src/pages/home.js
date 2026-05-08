/**
 * EmoSense Home Page — Premium Redesign
 * Glassmorphism + Animated Gradients + Modern UX
 */

export function renderHome(container) {
    container.innerHTML = `
    <!-- Animated Background -->
    <div class="es-home">
      <div class="es-bg-gradient"></div>
      <div class="es-bg-orb es-orb-1"></div>
      <div class="es-bg-orb es-orb-2"></div>
      <div class="es-bg-orb es-orb-3"></div>

      <!-- ═══ HERO ═══ -->
      <section class="es-hero">
        <div class="es-hero-content">
          <div class="es-hero-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Private & Anonymous
          </div>
          <h1 class="es-hero-title">
            You Don't Have To<br>Handle Everything <span class="es-gradient-text">Alone.</span>
          </h1>
          <p class="es-hero-sub">
            Connect with trusted counsellors privately, securely, and instantly — whenever you need support. No judgment. No records. Just care.
          </p>
          <div class="es-hero-actions">
            <a href="#chat" class="es-btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Talk to AI Now
            </a>
            <a href="#counselors" class="es-btn-glass">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Find a Counselor
            </a>
          </div>
          <div class="es-live-badge" id="home-live-status" style="margin-bottom:1.5rem;">
            <div class="es-pulse-dot"></div>
            <span>Checking availability...</span>
          </div>
          <div class="es-hero-stats" id="es-hero-stats">
            <div class="es-stat-item">
              <span class="es-stat-num" id="stat-helped">2,400+</span>
              <span class="es-stat-label">Students Helped</span>
            </div>
            <div class="es-stat-divider"></div>
            <div class="es-stat-item">
              <span class="es-stat-num">24/7</span>
              <span class="es-stat-label">AI Available</span>
            </div>
            <div class="es-stat-divider"></div>
            <div class="es-stat-item">
              <span class="es-stat-num">&lt;5 min</span>
              <span class="es-stat-label">Response Time</span>
            </div>
          </div>
        </div>

        <!-- Floating Glass Card (Desktop) -->
        <div class="es-hero-visual">
          <div class="es-glass-preview">
            <div class="es-preview-header">
              <div class="es-preview-dot green"></div>
              <span>Live Session</span>
            </div>
            <div class="es-preview-chat">
              <div class="es-preview-msg left">
                <p>I'm feeling really overwhelmed with everything lately...</p>
              </div>
              <div class="es-preview-msg right">
                <p>I hear you. That sounds incredibly difficult. You've taken a brave step by reaching out. Let's work through this together.</p>
              </div>
              <div class="es-preview-msg left">
                <p>Thank you. I just didn't know who to talk to.</p>
              </div>
            </div>
            <div class="es-preview-input">
              <span>Type your message...</span>
              <div class="es-send-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </div>
            </div>
          </div>
          <!-- Floating badges -->
          <div class="es-float-badge es-float-1">🔒 End-to-End Encrypted</div>
          <div class="es-float-badge es-float-2">🧠 AI-Powered Insights</div>
          <div class="es-float-badge es-float-3">💛 100% Anonymous</div>
        </div>
      </section>

      <!-- ═══ FEATURES ═══ -->
      <section class="es-section">
        <div class="es-container">
          <div class="es-section-header">
            <span class="es-tag">How It Works</span>
            <h2>Getting help has never been<br><span class="es-gradient-text">easier or safer.</span></h2>
          </div>
          <div class="es-features-grid">
            <div class="es-feature-card">
              <div class="es-feature-icon" style="background:rgba(99,102,241,0.1);color:#6366f1;">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <h3>Start a Conversation</h3>
              <p>Chat anonymously with our AI companion or a real counselor. No login. No paperwork.</p>
            </div>
            <div class="es-feature-card">
              <div class="es-feature-icon" style="background:rgba(16,185,129,0.1);color:#10b981;">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3>Safe & Private</h3>
              <p>End-to-end encryption. No data stored. Only your chosen alias is visible. Full anonymity guaranteed.</p>
            </div>
            <div class="es-feature-card">
              <div class="es-feature-icon" style="background:rgba(245,158,11,0.1);color:#f59e0b;">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              </div>
              <h3>Emotion Detection</h3>
              <p>Our AI reads emotional cues in your messages and adjusts support in real-time to what you need most.</p>
            </div>
            <div class="es-feature-card">
              <div class="es-feature-icon" style="background:rgba(236,72,153,0.1);color:#ec4899;">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <h3>Smart Matching</h3>
              <p>Get matched with the right counselor based on your needs, gender preference, and availability.</p>
            </div>
            <div class="es-feature-card">
              <div class="es-feature-icon" style="background:rgba(59,130,246,0.1);color:#3b82f6;">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.11 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <h3>Voice & Video Calls</h3>
              <p>Sometimes talking is easier. Connect via secure voice or video when you need a human connection.</p>
            </div>
            <div class="es-feature-card">
              <div class="es-feature-icon" style="background:rgba(220,38,38,0.1);color:#dc2626;">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <h3>SOS Emergency</h3>
              <p>One-tap emergency button that instantly alerts counselors, campus security, and sends your location.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══ COUNSELORS PREVIEW ═══ -->
      <section class="es-section es-section-dark">
        <div class="es-container">
          <div class="es-section-header">
            <span class="es-tag">Meet The Team</span>
            <h2>Trusted Professionals<br><span class="es-gradient-text">Ready to Listen</span></h2>
            <p class="es-section-sub">Trained, empathetic, and available when you need them most.</p>
          </div>
          <div class="es-counselors-grid" id="es-counselors-grid">
            <!-- Filled dynamically -->
          </div>
          <div style="text-align:center;margin-top:2rem;">
            <a href="#counselors" class="es-btn-glass" style="display:inline-flex;">View All Counselors</a>
          </div>
        </div>
      </section>

      <!-- ═══ DASHBOARD PREVIEW ═══ -->
      <section class="es-section">
        <div class="es-container">
          <div class="es-dash-row">
            <div class="es-dash-text">
              <span class="es-tag">Your Space</span>
              <h2>Everything You Need<br>In <span class="es-gradient-text">One Place</span></h2>
              <p>Track your emotional wellbeing, access resources, and connect with counselors — all from a secure, private dashboard built just for you.</p>
              <ul class="es-check-list">
                <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Real-time mood tracking</li>
                <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Secure chat history</li>
                <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> AI coping exercises</li>
                <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Emergency SOS at your fingertips</li>
              </ul>
              <a href="#chat" class="es-btn-primary" style="margin-top:1.5rem;display:inline-flex;">Try It Now</a>
            </div>
            <div class="es-dash-preview">
              <div class="es-dash-card">
                <div class="es-dash-card-header">
                  <span>😊 Mood Today</span>
                  <span class="es-tag-sm">Good</span>
                </div>
                <div class="es-mood-bar">
                  <div class="es-mood-fill" style="width:72%;"></div>
                </div>
                <span style="font-size:0.7rem;color:var(--gray-400);">72% positive — better than yesterday</span>
              </div>
              <div class="es-dash-card">
                <div class="es-dash-card-header">
                  <span>💬 Recent Chats</span>
                  <span class="es-tag-sm">3 Active</span>
                </div>
                <div class="es-mini-chat"><div class="es-mini-avatar">🧠</div><div><strong>AI Companion</strong><br><span>You're doing great. Remember the breathing...</span></div></div>
                <div class="es-mini-chat"><div class="es-mini-avatar">👩‍⚕️</div><div><strong>Tatenda C.</strong><br><span>Let's continue from our last session...</span></div></div>
              </div>
              <div class="es-dash-card">
                <div class="es-dash-card-header">
                  <span>🔔 Notifications</span>
                  <span class="es-tag-sm" style="background:rgba(220,38,38,0.1);color:#dc2626;">2 New</span>
                </div>
                <div class="es-notif-item">📅 Appointment reminder — Tomorrow 2PM</div>
                <div class="es-notif-item">💛 Wellness check-in available</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══ CRISIS ═══ -->
      <section class="es-crisis-section">
        <div class="es-container" style="text-align:center;">
          <div class="es-crisis-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h2>In Crisis? You're Not Alone.</h2>
          <p>If you're having thoughts of self-harm or feeling unsafe, help is available right now.</p>
          <div class="es-crisis-actions">
            <a href="tel:999" class="es-crisis-btn">📞 Call Emergency (999)</a>
            <a href="tel:+2634790652" class="es-crisis-btn">🆘 Befrienders Zim</a>
            <button class="es-crisis-btn sos" onclick="document.getElementById('sos-fab')?.click()">🚨 Use SOS Button</button>
          </div>
        </div>
      </section>

      <!-- ═══ CTA ═══ -->
      <section class="es-cta-section">
        <div class="es-container" style="text-align:center;">
          <h2>Take the First Step.</h2>
          <p>No pressure. No judgment. Just support.</p>
          <a href="#counselors" class="es-btn-primary es-btn-xl">Find Help Now</a>
        </div>
      </section>

      <!-- ═══ FOOTER ═══ -->
      <footer class="es-footer">
        <div class="es-container">
          <div class="es-footer-grid">
            <div class="es-footer-brand">
              <div class="es-nav-brand" style="margin-bottom:0.75rem;">
                <div class="es-brand-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C9 2 7 4 7 6.5c0 1 .3 1.8.8 2.5C6.3 9.8 5 11.3 5 13c0 1.5.8 2.8 2 3.5-.2.5-.3 1-.3 1.5 0 2.2 1.8 4 4 4h2.6c2.2 0 4-1.8 4-4 0-.5-.1-1-.3-1.5 1.2-.7 2-2 2-3.5 0-1.7-1.3-3.2-2.8-3.9.5-.7.8-1.5.8-2.6C17 4 15 2 12 2z"/></svg></div>
                <span>EmoSense</span>
              </div>
              <p>Emotion-Aware Digital Counseling Platform for Midlands State University students.</p>
            </div>
            <div class="es-footer-col">
              <h4>Platform</h4>
              <a href="#chat">AI Chat</a>
              <a href="#counselors">Counselors</a>
              <a href="#resources">Resources</a>
              <a href="#voice-rooms">Voice Rooms</a>
            </div>
            <div class="es-footer-col">
              <h4>Support</h4>
              <a href="#counselors">Get Help Now</a>
              <a href="tel:999">Emergency (999)</a>
              <a href="tel:+2634790652">Befrienders Zim</a>
              <a href="#feedback">Give Feedback</a>
            </div>
            <div class="es-footer-col">
              <h4>Legal</h4>
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Service</a>
              <a href="#data">Data Protection</a>
              <a href="#faq">FAQs</a>
            </div>
          </div>
          <div class="es-footer-bottom">
            <p>&copy; ${new Date().getFullYear()} EmoSense — Midlands State University. This is a supplementary tool and does not replace professional counseling.</p>
          </div>
        </div>
      </footer>
    </div>
    `;

    fetchLiveCounselorData();
    loadCounselorPreviews();
    animateOnScroll();
}

async function fetchLiveCounselorData() {
    const statusEl = document.getElementById('home-live-status');
    if (!statusEl) return;
    try {
        const res = await fetch('/api/counselors');
        if (!res.ok) throw new Error();
        const counselors = await res.json();
        const onlineCount = counselors.filter(c => c.is_online).length;
        if (onlineCount > 0) {
            statusEl.innerHTML = `<div class="es-pulse-dot live"></div><span><strong>${onlineCount}</strong> counselor${onlineCount > 1 ? 's' : ''} online now</span>`;
        } else {
            statusEl.innerHTML = `<div class="es-pulse-dot"></div><span>AI Support available 24/7</span>`;
        }
    } catch (err) {
        statusEl.innerHTML = `<div class="es-pulse-dot"></div><span>AI Support 24/7</span>`;
    }
}

async function loadCounselorPreviews() {
    const grid = document.getElementById('es-counselors-grid');
    if (!grid) return;
    try {
        const res = await fetch('/api/counselors');
        if (!res.ok) throw new Error();
        const counselors = await res.json();
        const shown = counselors.slice(0, 4);
        grid.innerHTML = shown.map((c, i) => {
            const imgIndex = i + 1;
            const specialties = c.specialties || 'General Support';
            return `
            <div class="es-counselor-card">
                <div class="es-counselor-status ${c.is_online ? 'online' : 'offline'}"></div>
                <img src="/counselors/counselor-${imgIndex}.png" alt="${c.name}" onerror="this.style.display='none'" />
                <h4>${c.name}</h4>
                <p class="es-counselor-spec">${typeof specialties === 'string' ? specialties : specialties.join(', ')}</p>
                <div class="es-counselor-meta">
                    <span class="${c.is_online ? 'online' : ''}">${c.is_online ? '● Online' : '○ Offline'}</span>
                    ${c.is_online ? '<span>&lt; 5 min response</span>' : ''}
                </div>
                <a href="#counselors" class="es-counselor-btn">${c.is_online ? 'Talk Now' : 'View Profile'}</a>
            </div>`;
        }).join('');
    } catch(e) {
        grid.innerHTML = '<p style="color:var(--gray-400);grid-column:1/-1;text-align:center;">Unable to load counselors</p>';
    }
}



function animateOnScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('es-visible');
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.es-feature-card, .es-counselor-card, .es-dash-card, .es-dash-text').forEach(el => {
        el.classList.add('es-animate-in');
        observer.observe(el);
    });
}
