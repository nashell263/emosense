/**
 * EmoSense Feedback Page
 * Beautiful feedback form with star ratings, categories, and public stats.
 */

import { apiGet, apiPost } from '../api.js';

export async function renderFeedback(container) {
  container.innerHTML = `
    <div class="fb-page">
      <div class="fb-hero">
        <div class="fb-hero-content">
          <div class="fb-hero-icon">💬</div>
          <h1 class="fb-title">Share Your Feedback</h1>
          <p class="fb-subtitle">Help us improve EmoSense — your voice shapes the future of mental health support at MSU.</p>
        </div>
        <div class="fb-hero-glow"></div>
      </div>

      <div class="fb-layout">
        <!-- Feedback Form -->
        <div class="fb-form-card" id="fb-form-card">
          <h2 class="fb-form-title">📝 Your Experience</h2>

          <div class="fb-field">
            <label class="fb-label">How would you rate your experience?</label>
            <div class="fb-stars" id="fb-stars">
              ${[1,2,3,4,5].map(n => `<button class="fb-star" data-value="${n}" id="fb-star-${n}">★</button>`).join('')}
            </div>
            <div class="fb-rating-text" id="fb-rating-text">Tap a star to rate</div>
          </div>

          <div class="fb-field">
            <label class="fb-label">Category</label>
            <div class="fb-categories" id="fb-categories">
              ${['Chat AI', 'Counsellors', 'Voice Rooms', 'Website', 'Resources', 'Other'].map(cat => 
                `<button class="fb-cat-btn" data-cat="${cat.toLowerCase().replace(' ', '_')}">${cat}</button>`
              ).join('')}
            </div>
          </div>

          <div class="fb-field">
            <label class="fb-label">Tell us more (optional)</label>
            <textarea class="fb-textarea" id="fb-comment" placeholder="What went well? What could be better? Any suggestions..." rows="4"></textarea>
          </div>

          <div class="fb-field fb-toggle-field">
            <label class="fb-label">Submit anonymously?</label>
            <div class="fb-toggle-row">
              <button class="fb-toggle active" id="fb-anon-toggle">
                <span class="fb-toggle-dot"></span>
              </button>
              <span class="fb-toggle-label" id="fb-anon-label">Anonymous</span>
            </div>
          </div>

          <div class="fb-field">
            <label class="fb-label">How do you feel after using EmoSense?</label>
            <div class="fb-categories" id="fb-outcomes">
              <button class="fb-cat-btn" data-outcome="better">😊 Better</button>
              <button class="fb-cat-btn" data-outcome="slightly_better">🙂 Slightly better</button>
              <button class="fb-cat-btn" data-outcome="no_change">😐 No change</button>
              <button class="fb-cat-btn" data-outcome="worse">😔 Worse</button>
            </div>
          </div>

          <div class="fb-field">
            <label class="fb-label">What type of support did you receive? (select all)</label>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;" id="fb-support-types">
              <label style="display: flex; align-items: center; gap: 4px; font-size: 0.85rem;"><input type="checkbox" value="emotional_support"> Emotional support</label>
              <label style="display: flex; align-items: center; gap: 4px; font-size: 0.85rem;"><input type="checkbox" value="advice"> Advice & guidance</label>
              <label style="display: flex; align-items: center; gap: 4px; font-size: 0.85rem;"><input type="checkbox" value="someone_to_talk"> Someone to talk to</label>
              <label style="display: flex; align-items: center; gap: 4px; font-size: 0.85rem;"><input type="checkbox" value="crisis_support"> Crisis support</label>
            </div>
          </div>

          <div class="fb-field">
            <label class="fb-label">Suggestions for improvement (optional)</label>
            <textarea class="fb-textarea" id="fb-improvement" placeholder="What could we do better?" rows="2"></textarea>
          </div>

          <button class="fb-submit-btn" id="fb-submit-btn" disabled>
            <span class="fb-submit-icon">🚀</span>
            Submit Feedback
          </button>
          <div class="fb-submit-msg" id="fb-submit-msg"></div>
        </div>

        <!-- Stats Panel -->
        <div class="fb-stats-panel" id="fb-stats-panel">
          <h2 class="fb-stats-title">📊 Community Feedback</h2>
          <div class="fb-stats-loading" id="fb-stats-loading">
            <div class="vr-loading-spinner"></div>
            <p>Loading stats...</p>
          </div>
          <div class="fb-stats-content" id="fb-stats-content" style="display:none;"></div>
        </div>
      </div>

      <!-- Success overlay -->
      <div class="fb-success-overlay" id="fb-success-overlay" style="display:none;">
        <div class="fb-success-card">
          <div class="fb-success-icon">🎉</div>
          <h2>Thank You!</h2>
          <p>Your feedback helps us create a better experience for all MSU students.</p>
          <button class="btn btn-primary" id="fb-success-close">Submit Another</button>
        </div>
      </div>
    </div>
  `;

  initFeedbackForm();
  loadPublicStats();
}

function initFeedbackForm() {
  let selectedRating = 0;
  let selectedCategory = 'general';
  let isAnonymous = true;
  let selectedOutcome = '';

  const ratingLabels = ['', 'Poor 😞', 'Fair 😐', 'Good 🙂', 'Great 😊', 'Excellent 🤩'];
  const stars = document.querySelectorAll('.fb-star');
  const ratingText = document.getElementById('fb-rating-text');
  const submitBtn = document.getElementById('fb-submit-btn');
  const submitMsg = document.getElementById('fb-submit-msg');
  const anonToggle = document.getElementById('fb-anon-toggle');
  const anonLabel = document.getElementById('fb-anon-label');

  // Star rating
  stars.forEach(star => {
    star.addEventListener('mouseenter', () => {
      const val = parseInt(star.dataset.value);
      stars.forEach(s => s.classList.toggle('hover', parseInt(s.dataset.value) <= val));
    });
    star.addEventListener('mouseleave', () => {
      stars.forEach(s => s.classList.remove('hover'));
    });
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.dataset.value);
      stars.forEach(s => s.classList.toggle('selected', parseInt(s.dataset.value) <= selectedRating));
      ratingText.textContent = ratingLabels[selectedRating];
      submitBtn.disabled = false;
    });
  });

  // Category selection
  document.querySelectorAll('.fb-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.fb-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedCategory = btn.dataset.cat;
    });
  });

  // Outcome buttons
  document.querySelectorAll('#fb-outcomes .fb-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#fb-outcomes .fb-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedOutcome = btn.dataset.outcome;
    });
  });

  // Anonymous toggle
  anonToggle.addEventListener('click', () => {
    isAnonymous = !isAnonymous;
    anonToggle.classList.toggle('active', isAnonymous);
    anonLabel.textContent = isAnonymous ? 'Anonymous' : 'Named (optional)';
  });

  // Submit
  submitBtn.addEventListener('click', async () => {
    if (selectedRating === 0) return;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="fb-submit-icon">⏳</span> Submitting...';

    // Collect support types
    const supportTypes = [];
    document.querySelectorAll('#fb-support-types input:checked').forEach(cb => supportTypes.push(cb.value));

    try {
      await apiPost('/api/feedback', {
        rating: selectedRating,
        category: selectedCategory,
        comment: document.getElementById('fb-comment').value.trim(),
        anonymous: isAnonymous,
        sessionType: 'general',
        helpful: selectedRating >= 4,
        emotional_outcome: selectedOutcome,
        support_types: JSON.stringify(supportTypes),
        improvement: document.getElementById('fb-improvement')?.value?.trim() || ''
      });

      document.getElementById('fb-success-overlay').style.display = 'flex';
      loadPublicStats();
    } catch (err) {
      submitMsg.textContent = '⚠️ Failed to submit. Please try again.';
      submitMsg.style.color = 'var(--red-500)';
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="fb-submit-icon">🚀</span> Submit Feedback';
    }
  });

  // Success close
  document.getElementById('fb-success-close')?.addEventListener('click', () => {
    document.getElementById('fb-success-overlay').style.display = 'none';
    // Reset form
    selectedRating = 0;
    selectedCategory = 'general';
    stars.forEach(s => s.classList.remove('selected'));
    ratingText.textContent = 'Tap a star to rate';
    document.getElementById('fb-comment').value = '';
    document.querySelectorAll('.fb-cat-btn').forEach(b => b.classList.remove('active'));
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="fb-submit-icon">🚀</span> Submit Feedback';
    submitMsg.textContent = '';
  });
}

async function loadPublicStats() {
  try {
    const data = await apiGet('/api/feedback/public-stats');
    const loading = document.getElementById('fb-stats-loading');
    const content = document.getElementById('fb-stats-content');
    if (!content) return;

    loading.style.display = 'none';
    content.style.display = 'block';

    const total = data.stats?.total || 0;
    const avg = data.stats?.avg_rating || 0;
    const positive = data.stats?.positive_count || 0;
    const positivePercent = total > 0 ? Math.round((positive / total) * 100) : 0;

    content.innerHTML = `
      <div class="fb-stat-cards">
        <div class="fb-stat-item">
          <div class="fb-stat-value">${total}</div>
          <div class="fb-stat-label">Total Reviews</div>
        </div>
        <div class="fb-stat-item">
          <div class="fb-stat-value">${avg > 0 ? avg : '—'}</div>
          <div class="fb-stat-label">Avg Rating</div>
        </div>
        <div class="fb-stat-item">
          <div class="fb-stat-value">${positivePercent}%</div>
          <div class="fb-stat-label">Positive</div>
        </div>
      </div>

      ${data.byCategory?.length > 0 ? `
        <div class="fb-cat-stats">
          <h3>By Category</h3>
          ${data.byCategory.map(c => `
            <div class="fb-cat-row">
              <span class="fb-cat-name">${c.category || 'general'}</span>
              <div class="fb-cat-bar-track">
                <div class="fb-cat-bar-fill" style="width: ${total > 0 ? Math.round((c.count / total) * 100) : 0}%"></div>
              </div>
              <span class="fb-cat-rating">${c.avg_rating || '—'} ★</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${data.recent?.length > 0 ? `
        <div class="fb-recent">
          <h3>Recent Feedback</h3>
          ${data.recent.slice(0, 5).map(r => `
            <div class="fb-recent-item">
              <div class="fb-recent-header">
                <span class="fb-recent-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                <span class="fb-recent-name">${r.display_name}</span>
              </div>
              <p class="fb-recent-comment">${escapeHtml(r.comment)}</p>
            </div>
          `).join('')}
        </div>
      ` : '<p class="fb-no-data">No feedback yet — be the first! 🌟</p>'}
    `;
  } catch (err) {
    const loading = document.getElementById('fb-stats-loading');
    if (loading) loading.innerHTML = '<p>Could not load stats</p>';
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, c => map[c]);
}
