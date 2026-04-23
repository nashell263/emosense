/**
 * EmoSense Home Page
 * Matching the provided screenshots with hero, stats, features, CTA.
 */

export function renderHome(container) {
    container.innerHTML = `
    <!-- A. Hero Section -->
    <section class="section" style="padding-top: var(--space-3xl); padding-bottom: var(--space-2xl); background: linear-gradient(180deg, var(--primary-50) 0%, #ffffff 100%); text-align: center;">
      <div class="container animate-slide-up">
        <h1 style="font-family: var(--font-display); font-size: 3.5rem; font-weight: 800; color: var(--gray-900); margin-bottom: var(--space-md); line-height: 1.1;">
          You don't have to handle <br>everything <span style="color: var(--primary-600);">alone.</span>
        </h1>
        <p style="font-size: 1.2rem; color: var(--text-secondary); max-width: 600px; margin: 0 auto var(--space-xl); line-height: 1.6;">
          EmoSense provides a safe, anonymous space for MSU students. Whether you need an ear right now or professional counseling, we're here.
        </p>

        <!-- B. Quick Access Options -->
        <div style="display: flex; justify-content: center; gap: var(--space-md); flex-wrap: wrap; margin-bottom: var(--space-2xl);">
          <a href="#chat" class="btn btn-primary btn-lg" style="padding: 1rem 2rem; font-size: 1.1rem; border-radius: var(--radius-full); box-shadow: 0 10px 20px rgba(59, 130, 246, 0.2);">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            Chat with AI Now
          </a>
          <a href="#counselors" class="btn btn-outline btn-lg" style="padding: 1rem 2rem; font-size: 1.1rem; border-radius: var(--radius-full); background: white;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Find a Counselor
          </a>
        </div>

        <!-- Live Status Snippet -->
        <div id="home-live-status" style="display: inline-flex; align-items: center; gap: 0.5rem; background: white; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.85rem; color: var(--text-secondary); box-shadow: var(--shadow-sm);">
           <div class="vr-loading-spinner" style="width: 14px; height: 14px; border-width: 2px;"></div> Checking counselor availability...
        </div>
      </div>
    </section>

    <!-- C. How It Works -->
    <section class="section" style="background: #ffffff;">
      <div class="container">
        <div class="text-center animate-slide-up" style="margin-bottom: var(--space-2xl);">
          <h2 style="font-size: 2rem; font-weight: 700;">How EmoSense Works</h2>
          <p style="color: var(--text-secondary);">Getting help has never been easier or safer.</p>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--space-xl);">
          <div class="card text-center" style="border: none; box-shadow: none;">
            <div style="width: 60px; height: 60px; background: var(--primary-100); color: var(--primary-600); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-md); font-size: 1.5rem; font-weight: bold;">1</div>
            <h3>Quick Triage</h3>
            <p style="color: var(--text-secondary);">Answer a few simple questions so we understand what you're going through.</p>
          </div>
          <div class="card text-center" style="border: none; box-shadow: none;">
            <div style="width: 60px; height: 60px; background: var(--primary-100); color: var(--primary-600); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-md); font-size: 1.5rem; font-weight: bold;">2</div>
            <h3>Smart Matching</h3>
            <p style="color: var(--text-secondary);">Connect instantly with our AI or let us match you with the right counselor.</p>
          </div>
          <div class="card text-center" style="border: none; box-shadow: none;">
            <div style="width: 60px; height: 60px; background: var(--primary-100); color: var(--primary-600); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-md); font-size: 1.5rem; font-weight: bold;">3</div>
            <h3>Start Healing</h3>
            <p style="color: var(--text-secondary);">Chat securely and anonymously. Get the support you deserve on your terms.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- D. Trust & Safety Section -->
    <section class="section" style="background: var(--gray-50);">
      <div class="container" style="display: flex; align-items: center; gap: var(--space-3xl); flex-wrap: wrap;">
        <div style="flex: 1; min-width: 300px;">
          <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: var(--space-md);">Your Secret is Safe With Us</h2>
          <p style="color: var(--text-secondary); margin-bottom: var(--space-lg); line-height: 1.6;">
            We know privacy is the biggest barrier to getting help. EmoSense is built on a foundation of absolute anonymity and data protection.
          </p>
          <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 1rem;">
            <li style="display: flex; align-items: center; gap: 10px;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-500)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <strong>100% Anonymous:</strong> No login or real name required.
            </li>
            <li style="display: flex; align-items: center; gap: 10px;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-500)" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
              <strong>End-to-End Encryption:</strong> Your chats cannot be read by anyone else.
            </li>
            <li style="display: flex; align-items: center; gap: 10px;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-500)" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <strong>Professional Boundaries:</strong> Counselors only see your chosen alias.
            </li>
          </ul>
        </div>
        <div style="flex: 1; min-width: 300px; display: flex; justify-content: center;">
            <div style="background: white; padding: 2rem; border-radius: var(--radius-2xl); box-shadow: var(--shadow-lg); max-width: 350px;">
                <h4 style="text-align: center; color: var(--gray-500); margin-bottom: 1rem;">Live Chat Preview</h4>
                <div style="background: var(--gray-100); padding: 10px 15px; border-radius: 15px 15px 15px 0; margin-bottom: 10px; width: fit-content; max-width: 80%;">
                    I'm feeling so overwhelmed with exams.
                </div>
                <div style="background: var(--primary-100); color: var(--primary-800); padding: 10px 15px; border-radius: 15px 15px 0 15px; margin-left: auto; width: fit-content; max-width: 80%;">
                    I hear you. Exam season is incredibly tough. Let's break this down together. You are safe here.
                </div>
            </div>
        </div>
      </div>
    </section>

    <!-- E. Counselor Preview Section -->
    <section class="section">
      <div class="container text-center">
        <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: var(--space-sm);">Meet Our Professionals</h2>
        <p style="color: var(--text-secondary); margin-bottom: var(--space-xl);">Trained, empathetic, and ready to listen.</p>
        <div style="display: flex; justify-content: center; gap: var(--space-lg); flex-wrap: wrap;">
           <div class="card" style="width: 250px;">
               <img src="/counselors/counselor-1.png" style="width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 1rem; display: block;" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMSI+PGNpcmNsZSBjeD0iMTIiIGN5PSI4IiByPSI1Ii8+PHBhdGggZD0iTTMgMjF2LTJhNyA3IDAgMCAxIDE0IDB2MiIvPjwvc3ZnPg=='" />
               <h4>Tendai Moyo</h4>
               <p style="font-size: 0.9rem; color: var(--text-muted);">Stress & Anxiety</p>
           </div>
           <div class="card" style="width: 250px;">
               <img src="/counselors/counselor-2.png" style="width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 1rem; display: block;" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMSI+PGNpcmNsZSBjeD0iMTIiIGN5PSI4IiByPSI1Ii8+PHBhdGggZD0iTTMgMjF2LTJhNyA3IDAgMCAxIDE0IDB2MiIvPjwvc3ZnPg=='" />
               <h4>Tatenda Chirwa</h4>
               <p style="font-size: 0.9rem; color: var(--text-muted);">Relationships</p>
           </div>
           <div class="card" style="width: 250px;">
               <img src="/counselors/counselor-3.png" style="width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 1rem; display: block;" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMSI+PGNpcmNsZSBjeD0iMTIiIGN5PSI4IiByPSI1Ii8+PHBhdGggZD0iTTMgMjF2LTJhNyA3IDAgMCAxIDE0IDB2MiIvPjwvc3ZnPg=='" />
               <h4>Rutendo Mhaka</h4>
               <p style="font-size: 0.9rem; color: var(--text-muted);">Career & Life Transitions</p>
           </div>
        </div>
      </div>
    </section>

    <!-- F. AI Support Section -->
    <section class="section" style="background: var(--primary-50);">
      <div class="container text-center">
        <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: var(--space-sm);">24/7 AI Companion</h2>
        <p style="color: var(--text-secondary); max-width: 600px; margin: 0 auto var(--space-lg);">
          Can't sleep? Overwhelmed at 2 AM? Our AI understands nuances, detects your emotions, and guides you through evidence-based coping techniques like Box Breathing and Grounding.
        </p>
        <a href="#chat" class="btn btn-outline" style="background: white;">Try AI Chat</a>
      </div>
    </section>

    <!-- G. Emergency Help Section -->
    <section class="section" style="background: #fff5f5; border-top: 1px solid #fed7d7; border-bottom: 1px solid #fed7d7;">
      <div class="container text-center">
        <div style="width: 60px; height: 60px; background: var(--red-100); color: var(--red-600); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-md);">
           <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <h2 style="font-size: 2rem; font-weight: 700; color: var(--red-700); margin-bottom: var(--space-sm);">In Crisis? We're Here.</h2>
        <p style="color: var(--red-600); max-width: 600px; margin: 0 auto var(--space-lg);">
          If you are having thoughts of self-harm or suicide, please know that things can get better and help is available immediately. Use the SOS button located at the top right of your screen anywhere in the app to alert emergency responders.
        </p>
        <button class="btn btn-primary" onclick="window.location.hash='#emergency'" style="background: var(--red-600); border-color: var(--red-600);">Access Emergency Resources</button>
      </div>
    </section>

    <!-- H. Call to Action (Bottom) -->
    <section class="section">
      <div class="container text-center">
        <h2 style="font-size: 2.5rem; font-weight: 800; margin-bottom: var(--space-md);">Take the First Step</h2>
        <p style="font-size: 1.2rem; color: var(--text-secondary); margin-bottom: var(--space-xl);">No pressure. No judgment. Just support.</p>
        <a href="#triage" onclick="window.location.hash='#counselors'" class="btn btn-primary btn-lg" style="padding: 1rem 3rem; font-size: 1.2rem; border-radius: var(--radius-full);">Find Help Now</a>
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

  // Fetch live counselor data
  fetchLiveCounselorData();
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
      statusEl.innerHTML = `<span style="color: #22c55e; font-size: 1.2rem; line-height: 1;">🟢</span> <strong>${onlineCount} counselor${onlineCount > 1 ? 's' : ''}</strong> available right now. Wait time < 5 mins.`;
    } else {
      statusEl.innerHTML = `<span style="color: #f59e0b; font-size: 1.2rem; line-height: 1;">🟡</span> AI Support available 24/7. Next human counselor at 08:00 AM.`;
    }
  } catch (err) {
    statusEl.innerHTML = `AI Support available 24/7`;
  }
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
