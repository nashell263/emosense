/**
 * EmoSense About Page — Redesigned
 * Polished hero section with images, objectives, technology, and disclaimer.
 */

export function renderAbout(container) {
  container.innerHTML = `
    <div class="about-container">
      <!-- Hero -->
      <div class="text-center animate-slide-up" style="margin-bottom: var(--space-2xl);">
        <span class="hero-badge" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 18px; background: var(--primary-50); color: var(--primary-700); font-size: 0.8125rem; font-weight: 500; border-radius: var(--radius-full); border: 1px solid var(--primary-200); margin-bottom: var(--space-lg);">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C9 2 7 4 7 6.5c0 1 .3 1.8.8 2.5C6.3 9.8 5 11.3 5 13c0 1.5.8 2.8 2 3.5-.2.5-.3 1-.3 1.5 0 2.2 1.8 4 4 4h2.6c2.2 0 4-1.8 4-4 0-.5-.1-1-.3-1.5 1.2-.7 2-2 2-3.5 0-1.7-1.3-3.2-2.8-3.9.5-.7.8-1.5.8-2.6C17 4 15 2 12 2z"/></svg>
          About EmoSense
        </span>
        <h1 style="font-size: 2.5rem; margin-bottom: var(--space-md);">
          Emotion-Aware Digital <span style="color: var(--primary-600);">Counseling Assistant</span>
        </h1>
        <p class="subtitle" style="max-width: 650px; margin: 0 auto;">
          Enhancing Student Mental Wellness at Midlands State University through Natural Language Processing and Sentiment Analysis
        </p>
      </div>

      <!-- Images Grid -->
      <div class="about-images animate-slide-up-delay-1" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-lg); margin-bottom: var(--space-3xl);">
        <div style="border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-lg);">
          <img src="/about-counseling.png" alt="Students supporting each other on campus" style="width: 100%; height: 300px; object-fit: cover;" />
        </div>
        <div style="border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-lg);">
          <img src="/about-wellness.png" alt="Mindfulness and mental wellness" style="width: 100%; height: 300px; object-fit: cover;" />
        </div>
      </div>

      <!-- Problem Statement -->
      <div class="about-section animate-slide-up-delay-2">
        <h2>The Problem</h2>
        <p>
          Mental health issues among college students have grown significantly both internationally and within higher education institutions in Zimbabwe. Students face academic pressure, financial hardship, social difficulties, and personal problems that badly impact emotional health.
        </p>
        <p>
          At Midlands State University (MSU), there are only <strong>8 professional counselors</strong> serving more than <strong>30,000 students</strong> — a ratio of <strong>3,750:1</strong>. This overwhelmed system means most students cannot access timely support.
        </p>
        <p>
          Degree programmes that begin with approximately 1,000 students at Level 1.1 see dramatic drops to about 300 by Level 2 — a <strong>70% decrease</strong> largely attributed to unaddressed mental health challenges, stigma, and lack of accessible support services.
        </p>
      </div>

      <!-- Objectives -->
      <div class="about-section">
        <h2>Project Objectives</h2>
        <ul>
          <li>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span>Design and implement a text-based AI counseling assistant using NLP techniques to analyze students' written emotional expressions</span>
          </li>
          <li>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span>Integrate sentiment analysis and emotion detection models capable of identifying stress, anxiety, depression, and low mood (≥75% accuracy)</span>
          </li>
          <li>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span>Provide personalized emotional support messages and self-help recommendations aligned with detected emotional state (≥80% alignment)</span>
          </li>
          <li>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span>Develop an anonymous and accessible web platform — no authentication required, no personal data collected</span>
          </li>
          <li>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span>Evaluate system effectiveness through user feedback (≥70% satisfaction) and performance testing</span>
          </li>
        </ul>
      </div>

      <!-- How It Works -->
      <div class="about-section">
        <h2>Technologies & How It Works</h2>
        <p>EmoSense leverages modern NLP and sentiment analysis technologies to understand your emotions:</p>
        <div class="tech-grid">
          <div class="tech-item">
            <h4>🧠 NLP Processing</h4>
            <p>Multi-signal text analysis with keyword detection, phrase pattern matching, and contextual understanding.</p>
          </div>
          <div class="tech-item">
            <h4>💭 Sentiment Analysis</h4>
            <p>Determines emotional polarity (positive/negative/neutral) with comparative scoring.</p>
          </div>
          <div class="tech-item">
            <h4>🎯 Emotion Detection</h4>
            <p>Classifies 8+ emotional states: stress, anxiety, depression, sadness, loneliness, anger, academic & financial pressure.</p>
          </div>
          <div class="tech-item">
            <h4>💚 Evidence-Based Responses</h4>
            <p>Techniques from CBT, mindfulness, and counseling psychology. Varied, non-repetitive support aligned to detected emotion.</p>
          </div>
          <div class="tech-item">
            <h4>🔒 Privacy-First Architecture</h4>
            <p>All processing happens in-browser. Zero data transmission. No accounts, no tracking, complete anonymity.</p>
          </div>
          <div class="tech-item">
            <h4>🆘 Crisis Detection</h4>
            <p>Real-time crisis keyword monitoring with immediate professional referral to MSU Counseling Unit and Zimbabwe services.</p>
          </div>
        </div>
      </div>

      <!-- Key Features -->
      <div class="about-section">
        <h2>Key Features</h2>
        <ul>
          <li>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span><strong>Emotion-Aware AI Chat</strong> — Contextual conversations that understand and respond to your emotional state</span>
          </li>
          <li>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span><strong>Real-Time Emotion Display</strong> — See your detected emotional state, confidence level, and analysis signals</span>
          </li>
          <li>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span><strong>Mood Tracking</strong> — Monitor emotional patterns over time with line charts and distribution analysis</span>
          </li>
          <li>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span><strong>Self-Help Resources</strong> — Curated guides for stress, anxiety, depression, academics, finances, and social connection</span>
          </li>
          <li>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span><strong>100% Anonymous & Free</strong> — No registration, no login, no personal data. Available 24/7.</span>
          </li>
        </ul>
      </div>

      <!-- Disclaimer -->
      <div class="disclaimer-box">
        <h3>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Important Disclaimer
        </h3>
        <p>
          EmoSense is a <strong>supplementary tool</strong> designed to provide initial emotional support. It does <strong>not replace professional counseling or therapy</strong>. If you are experiencing a mental health crisis, please contact the MSU Counseling Unit, Befrienders Zimbabwe (+263 4 790 652), or Zimbabwe Emergency Services (999/112) immediately.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <footer class="footer">
      <div class="container footer-inner">
        <div class="footer-brand">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-600)" stroke-width="1.5"><path d="M12 2C9 2 7 4 7 6.5c0 1 .3 1.8.8 2.5C6.3 9.8 5 11.3 5 13c0 1.5.8 2.8 2 3.5-.2.5-.3 1-.3 1.5 0 2.2 1.8 4 4 4h2.6c2.2 0 4-1.8 4-4 0-.5-.1-1-.3-1.5 1.2-.7 2-2 2-3.5 0-1.7-1.3-3.2-2.8-3.9.5-.7.8-1.5.8-2.6C17 4 15 2 12 2z"/></svg>
          EmoSense <span>– Emotion-Aware Digital Counseling</span>
        </div>
        <div class="footer-disclaimer">Designed for Midlands State University students.</div>
      </div>
    </footer>
  `;
}
