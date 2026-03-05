/**
 * EmoSense Home Page
 * Matching the provided screenshots with hero, stats, features, CTA.
 */

export function renderHome(container) {
    container.innerHTML = `
    <!-- Hero Section -->
    <section class="section" style="padding-top: var(--space-2xl); padding-bottom: var(--space-xl); background: linear-gradient(180deg, var(--primary-50) 0%, #f0fdf4 100%);">
      <div class="container">
        <div style="display: flex; align-items: center; gap: var(--space-3xl); flex-wrap: wrap;">
          <div style="flex: 1; min-width: 300px;" class="animate-slide-up">
            <div style="display: inline-flex; align-items: center; gap: 8px; background: var(--primary-100); border: 1px solid var(--primary-200); padding: 6px 16px; border-radius: var(--radius-full); font-size: 0.8125rem; font-weight: 500; color: var(--primary-700); margin-bottom: var(--space-xl);">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C9 2 7 4 7 6.5c0 1 .3 1.8.8 2.5C6.3 9.8 5 11.3 5 13c0 1.5.8 2.8 2 3.5-.2.5-.3 1-.3 1.5 0 2.2 1.8 4 4 4h2.6c2.2 0 4-1.8 4-4 0-.5-.1-1-.3-1.5 1.2-.7 2-2 2-3.5 0-1.7-1.3-3.2-2.8-3.9.5-.7.8-1.5.8-2.6C17 4 15 2 12 2z"/></svg>
              Emotion-Aware Digital Counseling
            </div>

            <h1 style="font-family: var(--font-display); font-size: 3rem; font-weight: 800; color: var(--gray-900); margin-bottom: var(--space-lg); line-height: 1.1;" class="hero-title">
              Your Mental<br>Wellness <span style="color: var(--primary-600);">Matters</span>
            </h1>

            <p style="font-size: 1.0625rem; color: var(--text-secondary); max-width: 460px; margin-bottom: var(--space-xl); line-height: 1.7;">
              EmoSense is an AI-powered counseling assistant designed for students at Midlands State University. Get anonymous, instant emotional support through intelligent text-based conversations.
            </p>

            <div style="display: flex; gap: var(--space-md); flex-wrap: wrap; margin-bottom: var(--space-xl);">
              <a href="#chat" class="btn btn-primary btn-lg" id="hero-cta-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                Start Talking to EmoSense →
              </a>
              <a href="#about" class="btn btn-outline" id="hero-cta-secondary">Learn More</a>
            </div>

            <div style="display: flex; gap: var(--space-xl); flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 6px; font-size: 0.8125rem; color: var(--text-secondary);">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-500)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                No sign-up needed
              </div>
              <div style="display: flex; align-items: center; gap: 6px; font-size: 0.8125rem; color: var(--text-secondary);">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-500)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Completely free
              </div>
              <div style="display: flex; align-items: center; gap: 6px; font-size: 0.8125rem; color: var(--text-secondary);">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-500)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Anonymous
              </div>
            </div>
          </div>

          <div style="flex: 1; min-width: 300px; display: flex; justify-content: center;" class="animate-slide-up-delay-2">
            <div style="position: relative; width: 100%; max-width: 420px;">
              <div style="width: 100%; aspect-ratio: 4/3; border-radius: var(--radius-2xl); background: linear-gradient(135deg, var(--primary-200), var(--primary-400)); overflow: hidden; display: flex; align-items: center; justify-content: center;">
                <div style="text-align: center; color: white; padding: 2rem;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <p style="font-size: 0.9rem; margin-top: 1rem; opacity: 0.9;">Supporting student wellness</p>
                </div>
              </div>
              <!-- Floating emotion badge -->
              <div style="position: absolute; bottom: -12px; right: 20px; background: white; border-radius: var(--radius-xl); padding: 12px 20px; box-shadow: var(--shadow-lg); display: flex; align-items: center; gap: 10px;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary-50); display: flex; align-items: center; justify-content: center; color: var(--primary-600);">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                </div>
                <div>
                  <div style="font-size: 0.7rem; color: var(--text-muted);">Emotion Detected</div>
                  <div style="font-size: 0.875rem; font-weight: 600; color: var(--gray-800);">Feeling Supported</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Mental Health Crisis Section -->
    <section class="section" style="padding-top: var(--space-3xl);">
      <div class="container">
        <div class="text-center animate-slide-up" style="margin-bottom: var(--space-2xl);">
          <h2 style="font-size: 1.75rem; font-weight: 800; margin-bottom: var(--space-sm);">The Mental Health Crisis in Zimbabwean Universities</h2>
          <p style="color: var(--text-secondary); max-width: 600px; margin: 0 auto;">Students face immense challenges, yet support systems are overwhelmed. EmoSense bridges the gap between need and access.</p>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid animate-slide-up-delay-1" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-lg); margin-bottom: var(--space-2xl);">
          <div class="stat-card">
            <div class="stat-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div class="stat-card-value">30,000+</div>
            <div class="stat-card-label">Students at MSU</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </div>
            <div class="stat-card-value">8</div>
            <div class="stat-card-label">Professional Counselors</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div class="stat-card-value">3,750:1</div>
            <div class="stat-card-label">Student-to-Counselor Ratio</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div class="stat-card-value">24/7</div>
            <div class="stat-card-label">EmoSense Availability</div>
          </div>
        </div>

        <!-- Alert Callout -->
        <div class="alert-callout animate-slide-up-delay-2">
          <div class="alert-callout-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <h3>A Critical Dropout Pattern</h3>
          </div>
          <p>
            At MSU, degree programmes typically begin with approximately <strong>1,000 students in Level 1.1</strong>. By Level 2, this number drops dramatically to about <strong>300 students</strong> - a 70% decrease largely attributed to stress, anxiety, academic pressure, financial challenges, and inadequate mental health support. Stigma, fear of judgment, lack of privacy, and long waiting times prevent students from seeking help, despite having the academic ability to succeed.
          </p>
        </div>
      </div>
    </section>

    <!-- How EmoSense Helps -->
    <section class="section">
      <div class="container">
        <div class="text-center animate-slide-up" style="margin-bottom: var(--space-2xl);">
          <h2 style="font-size: 1.75rem; font-weight: 800; margin-bottom: var(--space-sm);">How EmoSense Helps</h2>
          <p style="color: var(--text-secondary); max-width: 600px; margin: 0 auto;">Combining NLP, sentiment analysis, and evidence-based counseling techniques to provide accessible mental wellness support.</p>
        </div>

        <div class="features-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-lg);">
          ${renderFeatureCard(
        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C9 2 7 4 7 6.5c0 1 .3 1.8.8 2.5C6.3 9.8 5 11.3 5 13c0 1.5.8 2.8 2 3.5-.2.5-.3 1-.3 1.5 0 2.2 1.8 4 4 4h2.6c2.2 0 4-1.8 4-4 0-.5-.1-1-.3-1.5 1.2-.7 2-2 2-3.5 0-1.7-1.3-3.2-2.8-3.9.5-.7.8-1.5.8-2.6C17 4 15 2 12 2z"/></svg>`,
        'Emotion Detection',
        'Advanced NLP and sentiment analysis identifies your emotional state from text, detecting stress, anxiety, depression, and more with measurable accuracy.'
    )}
          ${renderFeatureCard(
        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
        'AI Counseling Assistant',
        'Receive personalized emotional support messages and evidence-based self-help recommendations tailored to your specific emotional needs.'
    )}
          ${renderFeatureCard(
        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
        '100% Anonymous',
        'No login required. No personal data collected. Access mental wellness support anytime without fear of judgment or stigma.'
    )}
          ${renderFeatureCard(
        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
        'Mood Tracking',
        'Track your emotional patterns over time to better understand your mental wellness journey and identify triggers.'
    )}
          ${renderFeatureCard(
        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        'Instant Access',
        'No waiting times, no appointments needed. Get immediate emotional support whenever you need it, day or night.'
    )}
          ${renderFeatureCard(
        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
        'Evidence-Based Support',
        'Recommendations grounded in psychological research and best practices, designed to complement professional counseling services.'
    )}
        </div>
      </div>
    </section>

    <!-- CTA Banner -->
    <section class="section" style="padding-top: 0;">
      <div class="container">
        <div class="cta-banner animate-slide-up">
          <div class="cta-banner-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C9 2 7 4 7 6.5c0 1 .3 1.8.8 2.5C6.3 9.8 5 11.3 5 13c0 1.5.8 2.8 2 3.5-.2.5-.3 1-.3 1.5 0 2.2 1.8 4 4 4h2.6c2.2 0 4-1.8 4-4 0-.5-.1-1-.3-1.5 1.2-.7 2-2 2-3.5 0-1.7-1.3-3.2-2.8-3.9.5-.7.8-1.5.8-2.6C17 4 15 2 12 2z"/></svg>
          </div>
          <h2>You Don't Have to Face It Alone</h2>
          <p>Whether you're dealing with academic pressure, financial stress, anxiety, or just need someone to talk to, EmoSense is here for you. Completely anonymous. Available 24/7.</p>
          <a href="#chat" class="btn btn-white btn-lg" id="cta-start-conversation">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            Start a Conversation →
          </a>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container footer-inner">
        <div class="footer-brand">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-600)" stroke-width="1.5"><path d="M12 2C9 2 7 4 7 6.5c0 1 .3 1.8.8 2.5C6.3 9.8 5 11.3 5 13c0 1.5.8 2.8 2 3.5-.2.5-.3 1-.3 1.5 0 2.2 1.8 4 4 4h2.6c2.2 0 4-1.8 4-4 0-.5-.1-1-.3-1.5 1.2-.7 2-2 2-3.5 0-1.7-1.3-3.2-2.8-3.9.5-.7.8-1.5.8-2.6C17 4 15 2 12 2z"/></svg>
          EmoSense <span>– Emotion-Aware Digital Counseling</span>
        </div>
        <div class="footer-disclaimer">
          Designed for Midlands State University students. This is a supplementary tool and does not replace professional counseling services. If you are in crisis, please contact a professional counselor immediately.
        </div>
      </div>
    </footer>
  `;
}

function renderFeatureCard(icon, title, description) {
    return `
    <div class="card">
      <div class="card-icon">${icon}</div>
      <h3>${title}</h3>
      <p>${description}</p>
    </div>
  `;
}
