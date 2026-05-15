/**
 * EmoSense — Counselor Registration Page
 * Allows new counselors to create an account. Their email is used for SOS notifications.
 */

import { apiPost, saveCounselorToken, clearCounselorToken } from '../api.js';

export function renderCounselorRegister(container) {
    container.innerHTML = `
    <div class="container" style="padding: 2rem 0 4rem; max-width: 580px; margin: 0 auto;">

      <!-- Header -->
      <div class="text-center animate-slide-up" style="margin-bottom: 2rem;">
        <span style="display: inline-block; background: rgba(34,197,94,0.12); color: #4ade80; padding: 5px 16px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; margin-bottom: 0.75rem; letter-spacing: 0.02em;">Staff Onboarding</span>
        <h1 style="font-size: 2rem; margin-bottom: 0.5rem; color: white; font-weight: 700;">Register as a Counselor</h1>
        <p style="color: rgba(255,255,255,0.45); max-width: 440px; margin: 0 auto; font-size: 0.88rem; line-height: 1.5;">
          Create your EmoSense account to support students. Your email will also receive <strong style="color: #f87171;">SOS emergency notifications</strong>.
        </p>
      </div>

      <!-- Registration Card -->
      <div class="animate-slide-up-delay-1" style="background: rgba(255,255,255,0.035); padding: 2rem 2rem 2.25rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.07); backdrop-filter: blur(24px); box-shadow: 0 8px 40px rgba(0,0,0,0.25);">

        <!-- Already have an account? -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.75rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.06);">
          <span style="font-size: 0.8rem; color: rgba(255,255,255,0.4);">Already registered?</span>
          <a href="#dashboard" style="font-size: 0.8rem; color: #818cf8; text-decoration: none; font-weight: 600; transition: color 0.2s;" onmouseover="this.style.color='#a5b4fc'" onmouseout="this.style.color='#818cf8'">Sign in →</a>
        </div>

        <form id="register-form" autocomplete="off">

          <!-- Full Name -->
          <div style="margin-bottom: 1.25rem;">
            <label for="reg-name" style="display: block; font-weight: 600; margin-bottom: 6px; color: white; font-size: 0.85rem;">Full Name <span style="color: #f87171;">*</span></label>
            <input type="text" id="reg-name" placeholder="e.g. Dr. Tendai Moyo" required
              style="width: 100%; padding: 0.7rem 0.9rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; font-size: 0.9rem; font-family: inherit; outline: none; transition: border-color 0.2s, box-shadow 0.2s;"
              onfocus="this.style.borderColor='rgba(99,102,241,0.5)';this.style.boxShadow='0 0 0 3px rgba(99,102,241,0.08)'"
              onblur="this.style.borderColor='rgba(255,255,255,0.1)';this.style.boxShadow='none'" />
          </div>

          <!-- Email -->
          <div style="margin-bottom: 1.25rem;">
            <label for="reg-email" style="display: block; font-weight: 600; margin-bottom: 6px; color: white; font-size: 0.85rem;">Email Address <span style="color: #f87171;">*</span></label>
            <input type="email" id="reg-email" placeholder="counselor@msu.ac.zw" required
              style="width: 100%; padding: 0.7rem 0.9rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; font-size: 0.9rem; font-family: inherit; outline: none; transition: border-color 0.2s, box-shadow 0.2s;"
              onfocus="this.style.borderColor='rgba(99,102,241,0.5)';this.style.boxShadow='0 0 0 3px rgba(99,102,241,0.08)'"
              onblur="this.style.borderColor='rgba(255,255,255,0.1)';this.style.boxShadow='none'" />
            <div style="margin-top: 4px; font-size: 0.72rem; color: rgba(255,255,255,0.35); display: flex; align-items: center; gap: 4px;">
              <span style="color: #f87171;">🔔</span> SOS emergency alerts will be sent to this email
            </div>
          </div>

          <!-- Password Row -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.25rem;">
            <div>
              <label for="reg-password" style="display: block; font-weight: 600; margin-bottom: 6px; color: white; font-size: 0.85rem;">Password <span style="color: #f87171;">*</span></label>
              <input type="password" id="reg-password" placeholder="Min. 6 characters" required minlength="6"
                style="width: 100%; padding: 0.7rem 0.9rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; font-size: 0.9rem; font-family: inherit; outline: none; transition: border-color 0.2s, box-shadow 0.2s;"
                onfocus="this.style.borderColor='rgba(99,102,241,0.5)';this.style.boxShadow='0 0 0 3px rgba(99,102,241,0.08)'"
                onblur="this.style.borderColor='rgba(255,255,255,0.1)';this.style.boxShadow='none'" />
            </div>
            <div>
              <label for="reg-password-confirm" style="display: block; font-weight: 600; margin-bottom: 6px; color: white; font-size: 0.85rem;">Confirm <span style="color: #f87171;">*</span></label>
              <input type="password" id="reg-password-confirm" placeholder="Repeat password" required minlength="6"
                style="width: 100%; padding: 0.7rem 0.9rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; font-size: 0.9rem; font-family: inherit; outline: none; transition: border-color 0.2s, box-shadow 0.2s;"
                onfocus="this.style.borderColor='rgba(99,102,241,0.5)';this.style.boxShadow='0 0 0 3px rgba(99,102,241,0.08)'"
                onblur="this.style.borderColor='rgba(255,255,255,0.1)';this.style.boxShadow='none'" />
            </div>
          </div>

          <!-- Gender + Phone Row -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.25rem;">
            <div>
              <label for="reg-gender" style="display: block; font-weight: 600; margin-bottom: 6px; color: white; font-size: 0.85rem;">Gender <span style="color: #f87171;">*</span></label>
              <select id="reg-gender" required
                style="width: 100%; padding: 0.7rem 0.9rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; font-size: 0.9rem; font-family: inherit; outline: none; transition: border-color 0.2s;">
                <option value="" style="background: #1e293b;">Select...</option>
                <option value="female" style="background: #1e293b;">Female</option>
                <option value="male" style="background: #1e293b;">Male</option>
              </select>
            </div>
            <div>
              <label for="reg-phone" style="display: block; font-weight: 600; margin-bottom: 6px; color: white; font-size: 0.85rem;">Phone <span style="color: rgba(255,255,255,0.3); font-weight: 400; font-size: 0.75rem;">(optional)</span></label>
              <input type="tel" id="reg-phone" placeholder="+263 7XX XXX XXX"
                style="width: 100%; padding: 0.7rem 0.9rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; font-size: 0.9rem; font-family: inherit; outline: none; transition: border-color 0.2s, box-shadow 0.2s;"
                onfocus="this.style.borderColor='rgba(99,102,241,0.5)';this.style.boxShadow='0 0 0 3px rgba(99,102,241,0.08)'"
                onblur="this.style.borderColor='rgba(255,255,255,0.1)';this.style.boxShadow='none'" />
            </div>
          </div>

          <!-- Specialization -->
          <div style="margin-bottom: 1.25rem;">
            <label for="reg-specialization" style="display: block; font-weight: 600; margin-bottom: 6px; color: white; font-size: 0.85rem;">Specialization</label>
            <select id="reg-specialization"
              style="width: 100%; padding: 0.7rem 0.9rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; font-size: 0.9rem; font-family: inherit; outline: none; transition: border-color 0.2s;">
              <option value="" style="background: #1e293b;">General Counseling</option>
              <option value="Student Stress & Anxiety" style="background: #1e293b;">Student Stress & Anxiety</option>
              <option value="Relationship & Family" style="background: #1e293b;">Relationship & Family</option>
              <option value="Career & Life Transitions" style="background: #1e293b;">Career & Life Transitions</option>
              <option value="Depression & Mood" style="background: #1e293b;">Depression & Mood</option>
              <option value="Financial Wellness" style="background: #1e293b;">Financial Wellness</option>
              <option value="Substance Abuse" style="background: #1e293b;">Substance Abuse</option>
              <option value="Trauma & PTSD" style="background: #1e293b;">Trauma & PTSD</option>
            </select>
          </div>

          <!-- Bio -->
          <div style="margin-bottom: 1.5rem;">
            <label for="reg-bio" style="display: block; font-weight: 600; margin-bottom: 6px; color: white; font-size: 0.85rem;">Professional Bio <span style="color: rgba(255,255,255,0.3); font-weight: 400; font-size: 0.75rem;">(optional)</span></label>
            <textarea id="reg-bio" rows="3" placeholder="A brief description of your experience, approach, and areas of expertise..."
              style="width: 100%; padding: 0.7rem 0.9rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; font-size: 0.9rem; font-family: inherit; outline: none; resize: vertical; transition: border-color 0.2s, box-shadow 0.2s; min-height: 70px;"
              onfocus="this.style.borderColor='rgba(99,102,241,0.5)';this.style.boxShadow='0 0 0 3px rgba(99,102,241,0.08)'"
              onblur="this.style.borderColor='rgba(255,255,255,0.1)';this.style.boxShadow='none'"></textarea>
          </div>

          <!-- SOS Notification Consent -->
          <div style="margin-bottom: 1.5rem; padding: 0.9rem 1rem; background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.12); border-radius: 12px;">
            <label style="display: flex; align-items: flex-start; gap: 0.6rem; cursor: pointer;">
              <input type="checkbox" id="reg-sos-consent" checked
                style="accent-color: #ef4444; margin-top: 3px; min-width: 16px;" />
              <span style="font-size: 0.8rem; color: rgba(255,255,255,0.55); line-height: 1.4;">
                I agree to receive <strong style="color: #f87171;">SOS emergency email notifications</strong> when a student activates the emergency button. I understand these alerts are critical for student safety.
              </span>
            </label>
          </div>

          <!-- Error Message -->
          <div id="register-error" style="display: none; margin-bottom: 1rem; padding: 0.75rem 1rem; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); border-radius: 10px; color: #fca5a5; font-size: 0.85rem;"></div>

          <!-- Success Message -->
          <div id="register-success" style="display: none; margin-bottom: 1rem; padding: 0.75rem 1rem; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25); border-radius: 10px; color: #86efac; font-size: 0.85rem;"></div>

          <!-- Submit -->
          <button type="submit" id="register-submit-btn"
            style="width: 100%; padding: 0.85rem; font-size: 1rem; background: linear-gradient(135deg, #22c55e, #16a34a); border: none; border-radius: 12px; color: white; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.25s; box-shadow: 0 4px 20px rgba(34,197,94,0.2); letter-spacing: 0.01em;"
            onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 6px 28px rgba(34,197,94,0.3)'"
            onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 4px 20px rgba(34,197,94,0.2)'">
            Create Counselor Account
          </button>
        </form>
      </div>

      <!-- Info Footer -->
      <div class="animate-slide-up-delay-2" style="margin-top: 1.5rem; text-align: center;">
        <div style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.25rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px;">
          <span style="font-size: 0.95rem;">🔐</span>
          <span style="font-size: 0.75rem; color: rgba(255,255,255,0.35);">All data is encrypted. Your credentials are stored securely with bcrypt hashing.</span>
        </div>
      </div>
    </div>
    `;

    // ── Form submission handler ──
    const form = document.getElementById('register-form');
    const errorEl = document.getElementById('register-error');
    const successEl = document.getElementById('register-success');
    const submitBtn = document.getElementById('register-submit-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorEl.style.display = 'none';
        successEl.style.display = 'none';

        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const passwordConfirm = document.getElementById('reg-password-confirm').value;
        const gender = document.getElementById('reg-gender').value;
        const phone = document.getElementById('reg-phone').value.trim();
        const specialization = document.getElementById('reg-specialization').value;
        const bio = document.getElementById('reg-bio').value.trim();

        // Validation
        if (!name || !email || !password || !gender) {
            showError('Please fill in all required fields.');
            return;
        }

        if (password.length < 6) {
            showError('Password must be at least 6 characters.');
            return;
        }

        if (password !== passwordConfirm) {
            showError('Passwords do not match.');
            return;
        }

        if (!email.includes('@')) {
            showError('Please enter a valid email address.');
            return;
        }

        // Submit
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Creating your account...';
        submitBtn.style.opacity = '0.7';

        try {
            const result = await apiPost('/api/counselors/register', {
                name,
                email,
                password,
                gender,
                phone,
                specialization: specialization || 'General Counseling',
                bio
            });

            if (result.error) {
                showError(result.error);
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Create Counselor Account';
                submitBtn.style.opacity = '1';
                return;
            }

            // Clear any stale old token, then store new one for auto-login
            clearCounselorToken();
            if (result.token) {
                saveCounselorToken(result.token);
            }

            // Show success
            successEl.style.display = 'block';
            successEl.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.2rem;">✅</span>
                    <div>
                        <strong>Welcome, ${name}!</strong><br/>
                        <span style="font-size: 0.8rem; opacity: 0.8;">Your counselor account has been created. SOS alerts will be sent to <strong>${email}</strong>. Redirecting to your dashboard...</span>
                    </div>
                </div>
            `;
            submitBtn.innerHTML = '✅ Account Created!';
            submitBtn.style.background = 'linear-gradient(135deg, #059669, #047857)';

            // Redirect to dashboard after 2s
            setTimeout(() => {
                window.location.hash = '#dashboard';
                // Force nav refresh to show logged-in state
                window.location.reload();
            }, 2000);

        } catch (err) {
            showError(err.message || 'Registration failed. Please try again.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Create Counselor Account';
            submitBtn.style.opacity = '1';
        }
    });

    function showError(msg) {
        errorEl.style.display = 'block';
        errorEl.innerHTML = `⚠️ ${msg}`;
        errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}
