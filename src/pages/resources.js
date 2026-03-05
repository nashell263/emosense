/**
 * EmoSense Resources Page — Premium Redesign
 * Interactive self-help guides, wellness toolkit, emergency contacts, and guided exercises.
 */

export function renderResources(container) {
  container.innerHTML = `
    <!-- Hero Section -->
    <section class="resources-hero-section">
      <div class="container">
        <div class="resources-hero-content animate-slide-up">
          <span class="hero-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            Wellness Toolkit
          </span>
          <h1>Your Mental Wellness<br>Resource Center</h1>
          <p>Evidence-based self-help guides, coping strategies, and emergency support — all designed for MSU students navigating the pressures of university life.</p>
        </div>
      </div>
    </section>

    <div class="container" style="padding-bottom: var(--space-3xl);">

      <!-- Quick Help Cards -->
      <div class="quick-help-grid animate-slide-up-delay-1">
        <a href="#chat" class="quick-help-card qh-chat">
          <div class="qh-icon">💬</div>
          <h3>Talk to EmoSense AI</h3>
          <p>Get instant emotional support through our AI counselor</p>
        </a>
        <a href="#counselors" class="quick-help-card qh-counselor">
          <div class="qh-icon">👩‍⚕️</div>
          <h3>Live Counselor Chat</h3>
          <p>Connect anonymously with a real MSU counselor</p>
        </a>
        <div class="quick-help-card qh-crisis" id="crisis-quick">
          <div class="qh-icon">🆘</div>
          <h3>Crisis Support</h3>
          <p>Immediate help: 999 / Befrienders: +263 4 790 652</p>
        </div>
      </div>

      <!-- Self-Help Guides -->
      <section class="resources-section animate-slide-up-delay-2">
        <div class="section-header">
          <h2>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary-600)" stroke-width="2"><path d="M12 2C9 2 7 4 7 6.5c0 1 .3 1.8.8 2.5C6.3 9.8 5 11.3 5 13c0 1.5.8 2.8 2 3.5-.2.5-.3 1-.3 1.5 0 2.2 1.8 4 4 4h2.6c2.2 0 4-1.8 4-4 0-.5-.1-1-.3-1.5 1.2-.7 2-2 2-3.5 0-1.7-1.3-3.2-2.8-3.9.5-.7.8-1.5.8-2.6C17 4 15 2 12 2z"/></svg>
            Self-Help Guides
          </h2>
          <p>Tap each guide for evidence-based techniques you can use right now.</p>
        </div>

        <div class="guides-grid">
          <!-- Stress Management -->
          <div class="guide-card" data-guide="stress">
            <div class="guide-card-visual" style="background: linear-gradient(135deg, #fef3c7, #fbbf24);">
              <span class="guide-emoji">⚡</span>
            </div>
            <div class="guide-card-content">
              <span class="guide-category">Stress Management</span>
              <h3>Managing Academic & Life Stress</h3>
              <p>Stress is your body's alarm system. While short-term stress can actually boost focus, chronic stress damages health, sleep, and academic performance.</p>
              <div class="guide-techniques" id="guide-stress" style="display: none;">
                <div class="technique-item">
                  <span class="technique-num">1</span>
                  <div>
                    <strong>4-7-8 Breathing</strong>
                    <p>Inhale for 4 seconds, hold for 7, exhale slowly for 8. This activates your parasympathetic nervous system — your body's natural "calm down" switch. Do 3 rounds.</p>
                  </div>
                </div>
                <div class="technique-item">
                  <span class="technique-num">2</span>
                  <div>
                    <strong>The Brain Dump</strong>
                    <p>Take a blank page and write EVERYTHING that's on your mind — no order, no filter, just dump it all out. Then circle the 3 most important items. This clears mental clutter.</p>
                  </div>
                </div>
                <div class="technique-item">
                  <span class="technique-num">3</span>
                  <div>
                    <strong>Pomodoro Technique</strong>
                    <p>Study for 25 minutes, then take a 5-minute break. After 4 rounds, take a 20-minute break. Works because your brain can only sustain deep focus for ~25 minutes.</p>
                  </div>
                </div>
                <div class="technique-item">
                  <span class="technique-num">4</span>
                  <div>
                    <strong>Progressive Muscle Relaxation</strong>
                    <p>Tense each muscle group for 5 seconds, then release. Start from your toes and work up to your forehead. Stress lives in the body — release it physically.</p>
                  </div>
                </div>
                <div class="technique-item">
                  <span class="technique-num">5</span>
                  <div>
                    <strong>The Circle of Control</strong>
                    <p>Draw two circles. Inner circle = things you CAN control (your effort, your attitude, who you ask for help). Outer circle = things you can't (others' actions, outcomes). Focus energy on the inner circle only.</p>
                  </div>
                </div>
              </div>
              <button class="guide-toggle-btn">Show Techniques ↓</button>
            </div>
          </div>

          <!-- Anxiety Relief -->
          <div class="guide-card" data-guide="anxiety">
            <div class="guide-card-visual" style="background: linear-gradient(135deg, #fce7f3, #ec4899);">
              <span class="guide-emoji">🧘</span>
            </div>
            <div class="guide-card-content">
              <span class="guide-category">Anxiety Relief</span>
              <h3>Coping with Anxiety & Worry</h3>
              <p>Anxiety tells you that danger is coming — but most of the time, it's a false alarm. These techniques help your brain tell the difference.</p>
              <div class="guide-techniques" id="guide-anxiety" style="display: none;">
                <div class="technique-item">
                  <span class="technique-num">1</span>
                  <div>
                    <strong>5-4-3-2-1 Grounding</strong>
                    <p>Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. This pulls your brain out of "future panic" and into the present moment where you're actually safe.</p>
                  </div>
                </div>
                <div class="technique-item">
                  <span class="technique-num">2</span>
                  <div>
                    <strong>Thought Challenging (CBT)</strong>
                    <p>When anxious, ask: "What's the evidence FOR this worry? What's the evidence AGAINST it? What would I tell my best friend in this situation?" Anxiety isn't truth — it's a feeling.</p>
                  </div>
                </div>
                <div class="technique-item">
                  <span class="technique-num">3</span>
                  <div>
                    <strong>STOP Technique</strong>
                    <p><strong>S</strong>top what you're doing. <strong>T</strong>ake a breath. <strong>O</strong>bserve what's happening (body, thoughts, emotions). <strong>P</strong>roceed with awareness. Takes 30 seconds and interrupts the anxiety spiral.</p>
                  </div>
                </div>
                <div class="technique-item">
                  <span class="technique-num">4</span>
                  <div>
                    <strong>Cold Water Reset</strong>
                    <p>Splash cold water on your face, hold ice cubes, or put cold water on your wrists. This triggers the "dive reflex" which slows your heart rate immediately. Works even during panic attacks.</p>
                  </div>
                </div>
                <div class="technique-item">
                  <span class="technique-num">5</span>
                  <div>
                    <strong>Worry Time</strong>
                    <p>Set a dedicated 15-minute "worry time" each day. When worries pop up outside that time, write them down and say: "I'll worry about this at 6 PM." This trains your brain that you're in control.</p>
                  </div>
                </div>
              </div>
              <button class="guide-toggle-btn">Show Techniques ↓</button>
            </div>
          </div>

          <!-- Depression Support -->
          <div class="guide-card" data-guide="depression">
            <div class="guide-card-visual" style="background: linear-gradient(135deg, #ede9fe, #8b5cf6);">
              <span class="guide-emoji">🌅</span>
            </div>
            <div class="guide-card-content">
              <span class="guide-category">Mood Support</span>
              <h3>When You're Feeling Low</h3>
              <p>Depression tells you nothing will ever change. That's the illness talking, not the truth. These small steps create momentum when everything feels impossible.</p>
              <div class="guide-techniques" id="guide-depression" style="display: none;">
                <div class="technique-item">
                  <span class="technique-num">1</span>
                  <div>
                    <strong>Behavioral Activation</strong>
                    <p>Depression says "wait until you feel better to do things." The truth is — doing things is what helps you feel better. Start absurdly small: just stand up. Open a curtain. Step outside for 30 seconds.</p>
                  </div>
                </div>
                <div class="technique-item">
                  <span class="technique-num">2</span>
                  <div>
                    <strong>HALT Check-In</strong>
                    <p>Ask yourself: Am I <strong>H</strong>ungry? <strong>A</strong>ngry? <strong>L</strong>onely? <strong>T</strong>ired? Often what feels like depression is actually one of these basic needs screaming for attention.</p>
                  </div>
                </div>
                <div class="technique-item">
                  <span class="technique-num">3</span>
                  <div>
                    <strong>Morning Sunlight</strong>
                    <p>Get 15 minutes of morning sunlight within an hour of waking. This resets your circadian rhythm and boosts serotonin — the same brain chemical that antidepressants target.</p>
                  </div>
                </div>
                <div class="technique-item">
                  <span class="technique-num">4</span>
                  <div>
                    <strong>The "3 Okay Things" Journal</strong>
                    <p>Each night, write 3 things that were "okay" — not amazing, just okay. "I ate lunch. I replied to a message. I took a shower." On dark days, "okay" is enough.</p>
                  </div>
                </div>
                <div class="technique-item">
                  <span class="technique-num">5</span>
                  <div>
                    <strong>When to Seek Help</strong>
                    <p>If these feelings last more than 2 weeks, if you've lost interest in everything, if getting out of bed feels impossible — please reach out to MSU Counseling at Student Affairs. This is not weakness. This is self-care at its strongest.</p>
                  </div>
                </div>
              </div>
              <button class="guide-toggle-btn">Show Techniques ↓</button>
            </div>
          </div>

          <!-- Sleep Hygiene -->
          <div class="guide-card" data-guide="sleep">
            <div class="guide-card-visual" style="background: linear-gradient(135deg, #dbeafe, #3b82f6);">
              <span class="guide-emoji">🌙</span>
            </div>
            <div class="guide-card-content">
              <span class="guide-category">Sleep Hygiene</span>
              <h3>Improving Your Sleep</h3>
              <p>Poor sleep is both a symptom and a cause of mental health struggles. Sleep is when your brain processes emotions — skip it, and everything feels harder.</p>
              <div class="guide-techniques" id="guide-sleep" style="display: none;">
                <div class="technique-item">
                  <span class="technique-num">1</span>
                  <div>
                    <strong>Consistent Wake Time</strong>
                    <p>Wake up at the same time every day — even weekends. This is more important than what time you go to bed. Your body clock anchors to your wake time.</p>
                  </div>
                </div>
                <div class="technique-item">
                  <span class="technique-num">2</span>
                  <div>
                    <strong>Wind-Down Routine</strong>
                    <p>30 minutes before bed: no screens, dim lights, do something calming (read, stretch, journal). This signals your brain to produce melatonin.</p>
                  </div>
                </div>
                <div class="technique-item">
                  <span class="technique-num">3</span>
                  <div>
                    <strong>Phone Outside the Room</strong>
                    <p>Charge your phone outside your bedroom. This removes the temptation to scroll at 2 AM and eliminates blue light exposure. Use a basic alarm clock instead.</p>
                  </div>
                </div>
                <div class="technique-item">
                  <span class="technique-num">4</span>
                  <div>
                    <strong>Body Scan Meditation</strong>
                    <p>Lying in bed, slowly focus attention on each body part from toes to head. Notice sensations without judging. This redirects your mind from racing thoughts to physical awareness.</p>
                  </div>
                </div>
              </div>
              <button class="guide-toggle-btn">Show Techniques ↓</button>
            </div>
          </div>

          <!-- Social Connection -->
          <div class="guide-card" data-guide="social">
            <div class="guide-card-visual" style="background: linear-gradient(135deg, #ccfbf1, #14b8a6);">
              <span class="guide-emoji">🤝</span>
            </div>
            <div class="guide-card-content">
              <span class="guide-category">Social Connection</span>
              <h3>Building Supportive Relationships</h3>
              <p>Loneliness isn't about being alone — it's about feeling unseen. Human connection is a basic psychological need, and even small steps can transform isolation.</p>
              <div class="guide-techniques" id="guide-social" style="display: none;">
                <div class="technique-item">
                  <span class="technique-num">1</span>
                  <div>
                    <strong>The "Small Hello" Method</strong>
                    <p>Start with eye contact and a nod. Then a "hey." Then a question. Connection builds gradually. You don't need to suddenly become an extrovert — just take the next small step.</p>
                  </div>
                </div>
                <div class="technique-item">
                  <span class="technique-num">2</span>
                  <div>
                    <strong>Study in Shared Spaces</strong>
                    <p>Instead of studying alone in your room, go to the library or a campus common area. Being around other people — even without talking — reduces loneliness.</p>
                  </div>
                </div>
                <div class="technique-item">
                  <span class="technique-num">3</span>
                  <div>
                    <strong>Join One Thing</strong>
                    <p>Pick one campus club, society, church group, or study group. You don't have to stay if it doesn't fit — but trying is what matters. Connection requires showing up.</p>
                  </div>
                </div>
                <div class="technique-item">
                  <span class="technique-num">4</span>
                  <div>
                    <strong>Schedule Family Calls</strong>
                    <p>Set a regular time to call home — even 10 minutes. Hearing familiar voices counteracts the "nobody cares" feeling that loneliness creates.</p>
                  </div>
                </div>
              </div>
              <button class="guide-toggle-btn">Show Techniques ↓</button>
            </div>
          </div>

          <!-- Financial Wellness -->
          <div class="guide-card" data-guide="financial">
            <div class="guide-card-visual" style="background: linear-gradient(135deg, #d1fae5, #10b981);">
              <span class="guide-emoji">💰</span>
            </div>
            <div class="guide-card-content">
              <span class="guide-category">Financial Wellness</span>
              <h3>Navigating Financial Pressure</h3>
              <p>Financial stress affects everything — your sleep, your focus, your self-worth. These resources and strategies can help you navigate the pressure.</p>
              <div class="guide-techniques" id="guide-financial" style="display: none;">
                <div class="technique-item">
                  <span class="technique-num">1</span>
                  <div>
                    <strong>MSU Financial Aid Office</strong>
                    <p>Visit the Financial Aid Office on campus to ask about bursaries, emergency funds, and payment plan options. Many students don't know these exist — ask.</p>
                  </div>
                </div>
                <div class="technique-item">
                  <span class="technique-num">2</span>
                  <div>
                    <strong>Department Notice Boards</strong>
                    <p>Check your department's notice board regularly for scholarship and bursary opportunities. Many go unclaimed because students don't check.</p>
                  </div>
                </div>
                <div class="technique-item">
                  <span class="technique-num">3</span>
                  <div>
                    <strong>Use Library Digital Resources</strong>
                    <p>Before buying textbooks, check MSU library e-resources. Many courses have digital textbook access included in your fees.</p>
                  </div>
                </div>
                <div class="technique-item">
                  <span class="technique-num">4</span>
                  <div>
                    <strong>Avoid Loan Sharks</strong>
                    <p>Predatory lenders target desperate students. If someone offers easy money with "small" interest — walk away. The short-term relief creates long-term suffering.</p>
                  </div>
                </div>
              </div>
              <button class="guide-toggle-btn">Show Techniques ↓</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Quick Exercises Section -->
      <section class="resources-section animate-slide-up-delay-3">
        <div class="section-header">
          <h2>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary-600)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            2-Minute Exercises
          </h2>
          <p>Quick practices you can do anywhere, anytime — even between lectures.</p>
        </div>
        <div class="exercises-grid">
          <div class="exercise-card" id="ex-breathing">
            <div class="exercise-icon">🫁</div>
            <h4>Box Breathing</h4>
            <p>Breathe in for 4 counts, hold 4, out 4, hold 4. Repeat 4 times.</p>
            <div class="exercise-visual" id="breathing-visual" style="display: none;">
              <div class="breathing-circle" id="breathing-circle">
                <span id="breathing-text">Ready</span>
              </div>
              <button class="btn btn-primary btn-sm" id="start-breathing">Start Exercise</button>
            </div>
            <button class="exercise-try-btn" data-exercise="breathing">Try Now</button>
          </div>
          <div class="exercise-card">
            <div class="exercise-icon">✋</div>
            <h4>5-4-3-2-1 Grounding</h4>
            <p>Name: 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste.</p>
          </div>
          <div class="exercise-card">
            <div class="exercise-icon">🦋</div>
            <h4>Butterfly Hug</h4>
            <p>Cross arms over your chest, alternately tap your shoulders. Calms the nervous system through bilateral stimulation.</p>
          </div>
          <div class="exercise-card">
            <div class="exercise-icon">🧊</div>
            <h4>Cold Water Reset</h4>
            <p>Splash cold water on your face or hold ice cubes. Triggers the dive reflex, instantly slowing your heart rate.</p>
          </div>
        </div>
      </section>

      <!-- Emergency Contacts -->
      <section class="emergency-section-redesign">
        <div class="emergency-header">
          <div class="emergency-icon-wrap">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </div>
          <div>
            <h2>Emergency & Crisis Support</h2>
            <p>If you or someone you know is in immediate danger, please reach out now.</p>
          </div>
        </div>
        <div class="emergency-contacts-grid">
          <div class="emergency-card">
            <div class="ec-name">MSU Counseling Unit</div>
            <div class="ec-detail">Student Affairs Building</div>
            <div class="ec-type">Walk-in</div>
          </div>
          <div class="emergency-card">
            <div class="ec-name">Zimbabwe Emergency</div>
            <div class="ec-detail">999 / 112</div>
            <div class="ec-type">24/7 Hotline</div>
          </div>
          <div class="emergency-card">
            <div class="ec-name">Befrienders Zimbabwe</div>
            <div class="ec-detail">+263 4 790 652</div>
            <div class="ec-type">Crisis Line</div>
          </div>
          <div class="emergency-card">
            <div class="ec-name">Childline Zimbabwe</div>
            <div class="ec-detail">116 (Toll-free)</div>
            <div class="ec-type">Youth Support</div>
          </div>
          <div class="emergency-card">
            <div class="ec-name">Zimbabwe National Helpline</div>
            <div class="ec-detail">+263 242 737 815</div>
            <div class="ec-type">Mental Health</div>
          </div>
        </div>
      </section>

      <!-- CTA Banner -->
      <section class="resources-cta">
        <div class="cta-content">
          <div class="cta-icon">🌱</div>
          <h2>Healing Is Not Linear</h2>
          <p>Some days you'll feel strong. Other days you'll struggle. Both are part of the journey. What matters is that you keep showing up — for yourself.</p>
          <div class="cta-actions">
            <a href="#chat" class="btn btn-primary">Talk to EmoSense AI</a>
            <a href="#counselors" class="btn btn-outline" style="border-color: white; color: white;">Connect with a Counselor</a>
          </div>
        </div>
      </section>
    </div>

    <footer class="footer">
      <div class="container footer-inner">
        <div class="footer-brand">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-600)" stroke-width="1.5"><path d="M12 2C9 2 7 4 7 6.5c0 1 .3 1.8.8 2.5C6.3 9.8 5 11.3 5 13c0 1.5.8 2.8 2 3.5-.2.5-.3 1-.3 1.5 0 2.2 1.8 4 4 4h2.6c2.2 0 4-1.8 4-4 0-.5-.1-1-.3-1.5 1.2-.7 2-2 2-3.5 0-1.7-1.3-3.2-2.8-3.9.5-.7.8-1.5.8-2.6C17 4 15 2 12 2z"/></svg>
          EmoSense <span>– Evidence-based resources for student wellness</span>
        </div>
        <div class="footer-disclaimer">All techniques are evidence-based. For persistent issues, please seek professional counseling.</div>
      </div>
    </footer>
  `;

  // Toggle guide techniques
  container.querySelectorAll('.guide-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.guide-card');
      const techniques = card.querySelector('.guide-techniques');
      const isOpen = techniques.style.display !== 'none';
      techniques.style.display = isOpen ? 'none' : 'block';
      btn.textContent = isOpen ? 'Show Techniques ↓' : 'Hide Techniques ↑';
    });
  });

  // Breathing exercise
  const breathingBtn = container.querySelector('[data-exercise="breathing"]');
  if (breathingBtn) {
    breathingBtn.addEventListener('click', () => {
      const visual = document.getElementById('breathing-visual');
      visual.style.display = visual.style.display === 'none' ? 'flex' : 'none';
      breathingBtn.style.display = 'none';
    });
  }

  const startBreathingBtn = document.getElementById('start-breathing');
  if (startBreathingBtn) {
    startBreathingBtn.addEventListener('click', () => {
      runBreathingExercise();
    });
  }
}

function runBreathingExercise() {
  const circle = document.getElementById('breathing-circle');
  const text = document.getElementById('breathing-text');
  const btn = document.getElementById('start-breathing');
  if (!circle || !text) return;

  btn.disabled = true;
  btn.textContent = 'In progress...';
  let round = 0;
  const maxRounds = 4;

  const phases = [
    { label: 'Breathe In', duration: 4000, scale: 1.4 },
    { label: 'Hold', duration: 4000, scale: 1.4 },
    { label: 'Breathe Out', duration: 4000, scale: 1.0 },
    { label: 'Hold', duration: 4000, scale: 1.0 },
  ];

  let phaseIdx = 0;

  function nextPhase() {
    if (round >= maxRounds) {
      text.textContent = 'Well done! 🌟';
      circle.style.transform = 'scale(1)';
      btn.disabled = false;
      btn.textContent = 'Start Again';
      return;
    }

    const phase = phases[phaseIdx];
    text.textContent = phase.label;
    circle.style.transform = `scale(${phase.scale})`;

    phaseIdx++;
    if (phaseIdx >= phases.length) {
      phaseIdx = 0;
      round++;
    }

    setTimeout(nextPhase, phase.duration);
  }

  nextPhase();
}
