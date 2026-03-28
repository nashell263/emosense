/**
 * EmoSense Personal Mental Health Dashboard
 * Shows mood trends, trigger detection, mood distribution,
 * AI-generated insights, and mood-based content recommendations.
 */

import { apiGet, apiPost } from '../api.js';
import { getEmotionEmoji, getEmotionColor, getEmotionLabel } from '../engine/sentiment-engine.js';
import { getRecommendations, getContentCategories } from '../engine/recommendations.js';
import { renderVoiceRoomGrid } from './voice-rooms.js';

const USER_ID = 'session_' + (localStorage.getItem('emosense_user_id') || (() => {
  const id = Date.now().toString(36);
  localStorage.setItem('emosense_user_id', id);
  return id;
})());

export function renderStudentHub(container) {
  container.innerHTML = `
    <div class="my-dashboard">
      <div class="dash-header">
      <div class="dash-header">
        <div class="dash-header-text">
          <h1>Student Social Hub</h1>
          <p>Connect with peers in anonymous safe spaces or explore your personalized mental health insights.</p>
        </div>
      </div>

      <!-- ────── Voice Rooms (PROMINENT) ────── -->
      <section class="social-section animate-slide-up">
        <div class="section-header">
          <h2>🎙️ Anonymous Safe Spaces</h2>
          <p>Join a live topic-based room to talk or just listen. Fully anonymous, always supportive.</p>
        </div>
        <div id="hub-voice-rooms" class="hub-rooms-grid">
          <div class="loading-pulse">Loading active spaces...</div>
        </div>
      </section>

      <!-- ────── Quick Action Row ────── -->
      <div class="hub-actions animate-slide-up-delay-1">
        <button class="hub-btn primary" id="log-mood-btn">
          <span>📊</span> Log My Current Mood
        </button>
        <button class="hub-btn secondary" id="view-insights-btn">
          <span>🔍</span> View My Mood Insights
        </button>
      </div>

      <!-- Quick Mood Logger -->
      <div class="mood-logger" id="mood-logger" style="display:none;">
        <div class="mood-logger-inner">
          <h3>How are you feeling right now?</h3>
          <div class="mood-grid" id="mood-grid">
            <button class="mood-option" data-mood="hopeful" style="--mc: #059669">😊 Good</button>
            <button class="mood-option" data-mood="neutral" style="--mc: #6b7280">😐 Okay</button>
            <button class="mood-option" data-mood="stress" style="--mc: #ea580c">😰 Stressed</button>
            <button class="mood-option" data-mood="anxiety" style="--mc: #d97706">😟 Anxious</button>
            <button class="mood-option" data-mood="sadness" style="--mc: #6366f1">😢 Sad</button>
            <button class="mood-option" data-mood="depression" style="--mc: #7c3aed">😔 Depressed</button>
            <button class="mood-option" data-mood="loneliness" style="--mc: #8b5cf6">🥺 Lonely</button>
            <button class="mood-option" data-mood="anger" style="--mc: #dc2626">😤 Angry</button>
            <button class="mood-option" data-mood="academic_pressure" style="--mc: #dc2626">📚 Academic</button>
            <button class="mood-option" data-mood="financial_stress" style="--mc: #ca8a04">💸 Financial</button>
          </div>
          <div class="mood-intensity-row" id="mood-intensity-row" style="display:none;">
            <label>Intensity: <span id="intensity-val">50%</span></label>
            <input type="range" id="mood-intensity" min="0" max="100" value="50" />
            <textarea id="mood-notes" placeholder="Any notes? (optional)" rows="2"></textarea>
            <button class="mood-submit-btn" id="mood-submit-btn">Save Mood Entry</button>
          </div>
        </div>
      </div>

      <!-- ────── Insights Dashboard (COLLAPSIBLE) ────── -->
      <div id="insights-section" style="display:none;" class="animate-slide-up">
        <div class="dash-grid">
          <!-- Mood Timeline Chart -->
          <div class="dash-card dash-card-wide">
            <div class="dash-card-header">
              <h3>📈 Mood Timeline</h3>
              <select class="dash-period" id="timeline-period">
                <option value="7">Last 7 days</option>
                <option value="14">Last 14 days</option>
                <option value="30" selected>Last 30 days</option>
              </select>
            </div>
            <div class="dash-card-body">
              <canvas id="mood-timeline-canvas" height="200"></canvas>
              <div id="timeline-empty" class="dash-empty" style="display:none;">
                <p>📝 Start logging your mood to see trends here!</p>
              </div>
            </div>
          </div>

          <!-- AI Insights -->
          <div class="dash-card dash-card-wide">
            <div class="dash-card-header"><h3>🧠 AI Guidance</h3></div>
            <div class="dash-card-body">
              <div id="ai-insights" class="ai-insights-container">
                <div class="dash-empty"><p>AI insights will appear after a few entries!</p></div>
              </div>
            </div>
          </div>

          <!-- Digital Twin Mood Prediction -->
          <div class="dash-card">
            <div class="dash-card-header"><h3>🎭 Tomorrow's Outlook</h3></div>
            <div class="dash-card-body">
               <div id="mood-prediction" class="prediction-container">
                 <div class="dash-empty"><p>Predicting your next 24h...</p></div>
               </div>
            </div>
          </div>

          <!-- Recommended For You -->
          <div class="dash-card">
            <div class="dash-card-header"><h3>💡 Recommended For You</h3></div>
            <div class="dash-card-body">
              <div id="dash-recommendations" class="dash-recommendations">
                <div class="dash-empty"><p>Based on your recent moods</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  `;

  // ──── Mood Logger ────
  const logBtn = document.getElementById('log-mood-btn');
  const logger = document.getElementById('mood-logger');
  let selectedMood = null;

  logBtn.addEventListener('click', () => {
    logger.style.display = logger.style.display === 'none' ? 'block' : 'none';
  });

  document.querySelectorAll('.mood-option').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mood-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedMood = btn.dataset.mood;
      document.getElementById('mood-intensity-row').style.display = 'block';
    });
  });

  const insightsBtn = document.getElementById('view-insights-btn');
  const insightsSection = document.getElementById('insights-section');

  insightsBtn.addEventListener('click', () => {
    const isHidden = insightsSection.style.display === 'none';
    insightsSection.style.display = isHidden ? 'block' : 'none';
    insightsBtn.innerHTML = isHidden ? '<span>📊</span> Hide My Insights' : '<span>🔍</span> View My Mood Insights';
    if (isHidden) {
      insightsSection.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // ──── Load Voice Rooms ────
  const loadVoiceRooms = async () => {
    const rooms = await apiGet('/api/voice-rooms').catch(() => []);
    renderVoiceRoomGrid(container, rooms);
  };
  loadVoiceRooms();

  // Refresh rooms every 30 seconds
  const roomRefreshInterval = setInterval(() => {
    if (document.getElementById('hub-voice-rooms')) {
      loadVoiceRooms();
    } else {
      clearInterval(roomRefreshInterval);
    }
  }, 30000);

  const intensitySlider = document.getElementById('mood-intensity');
  intensitySlider.addEventListener('input', () => {
    document.getElementById('intensity-val').textContent = intensitySlider.value + '%';
  });

  document.getElementById('mood-submit-btn').addEventListener('click', async () => {
    if (!selectedMood) return;
    const intensity = parseInt(intensitySlider.value) / 100;
    const notes = document.getElementById('mood-notes').value;

    try {
      await apiPost('/api/mood/log', {
        userId: USER_ID,
        mood: selectedMood,
        intensity,
        notes,
        source: 'manual'
      });

      // Reset and refresh
      logger.style.display = 'none';
      selectedMood = null;
      document.querySelectorAll('.mood-option').forEach(b => b.classList.remove('selected'));
      document.getElementById('mood-intensity-row').style.display = 'none';
      document.getElementById('mood-notes').value = '';
      intensitySlider.value = 50;

      loadDashboardData();
    } catch (err) {
      console.error('Failed to log mood:', err);
    }
  });

  // ──── Period change ────
  document.getElementById('timeline-period').addEventListener('change', () => {
    loadDashboardData();
  });

  // ──── Load Dashboard Data ────
  loadDashboardData();
}

async function loadDashboardData() {
  const days = document.getElementById('timeline-period')?.value || 30;

  try {
    // Load all data in parallel
    const [history, trends, insights] = await Promise.all([
      apiGet(`/api/mood/history/${USER_ID}?days=${days}`).catch(() => []),
      apiGet(`/api/mood/trends/${USER_ID}?days=${days}`).catch(() => ({ dailyTrends: [], dayOfWeekPattern: [], distribution: [] })),
      apiGet(`/api/mood/insights/${USER_ID}`).catch(() => ({ insights: [], message: '' }))
    ]);

    renderTimeline(history, days);
    renderDistribution(trends.distribution || []);
    renderTriggerInsights(trends.dayOfWeekPattern || []);
    renderAIInsights(insights);
    renderRecommendations(trends.distribution || []);
    renderMoodPrediction(history);

    // ── Preferences ──
    const prefs = await apiGet(`/api/preferences/${USER_ID}`).catch(() => ({}));
    const liteModeCheck = document.getElementById('pref-lite-mode');
    const personalitySelect = document.getElementById('pref-personality');
    const languageSelect = document.getElementById('pref-language');

    if (liteModeCheck) liteModeCheck.checked = !!prefs.lite_mode;
    if (personalitySelect) personalitySelect.value = prefs.personality_mode || 'gentle';
    if (languageSelect) languageSelect.value = prefs.language || 'en';

    document.getElementById('save-prefs-btn').onclick = async () => {
      await apiPost(`/api/preferences/${USER_ID}`, {
        liteMode: liteModeCheck.checked,
        personalityMode: personalitySelect.value,
        language: languageSelect.value
      });
      alert('Preferences saved successfully!');
    };
  } catch (err) {
    console.error('Dashboard data error:', err);
  }
}

function renderTimeline(entries, days) {
  const canvas = document.getElementById('mood-timeline-canvas');
  const emptyEl = document.getElementById('timeline-empty');

  if (!entries || entries.length === 0) {
    canvas.style.display = 'none';
    emptyEl.style.display = 'block';
    return;
  }

  canvas.style.display = 'block';
  emptyEl.style.display = 'none';

  const ctx = canvas.getContext('2d');
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = 200;

  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Group by date
  const byDate = {};
  entries.forEach(e => {
    const date = e.created_at.split('T')[0] || e.created_at.split(' ')[0];
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(e);
  });

  const dates = Object.keys(byDate).sort();
  if (dates.length === 0) return;

  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const w = canvas.width - padding.left - padding.right;
  const h = canvas.height - padding.top - padding.bottom;

  // Draw grid
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (h / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + w, y);
    ctx.stroke();
  }

  // Plot intensity over time
  const points = dates.map((date, i) => {
    const dayEntries = byDate[date];
    const avgIntensity = dayEntries.reduce((s, e) => s + e.intensity, 0) / dayEntries.length;
    const dominantMood = dayEntries.reduce((acc, e) => {
      acc[e.mood] = (acc[e.mood] || 0) + 1;
      return acc;
    }, {});
    const topMood = Object.entries(dominantMood).sort((a, b) => b[1] - a[1])[0][0];

    return {
      x: padding.left + (i / Math.max(dates.length - 1, 1)) * w,
      y: padding.top + (1 - avgIntensity) * h,
      mood: topMood,
      date,
      intensity: avgIntensity
    };
  });

  // Draw line
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.8)';
  ctx.lineWidth = 2;
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();

  // Draw gradient fill
  const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + h);
  gradient.addColorStop(0, 'rgba(139, 92, 246, 0.15)');
  gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.lineTo(points[points.length - 1].x, padding.top + h);
  ctx.lineTo(points[0].x, padding.top + h);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Draw points with emoji
  points.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = getEmotionColor(p.mood);
    ctx.fill();

    ctx.font = '11px system-ui';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'center';
    const shortDate = new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    ctx.fillText(shortDate, p.x, padding.top + h + 20);
  });

  // Y-axis labels
  ctx.font = '10px system-ui';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.textAlign = 'right';
  ctx.fillText('High', padding.left - 5, padding.top + 10);
  ctx.fillText('Low', padding.left - 5, padding.top + h);
}

function renderDistribution(distribution) {
  const container = document.getElementById('mood-distribution');
  if (!distribution || distribution.length === 0) {
    container.innerHTML = '<div class="dash-empty"><p>Log some moods to see distribution</p></div>';
    return;
  }

  const total = distribution.reduce((s, d) => s + d.count, 0);
  container.innerHTML = distribution.map(d => {
    const pct = Math.round((d.count / total) * 100);
    const color = getEmotionColor(d.mood);
    const emoji = getEmotionEmoji(d.mood);
    return `
      <div class="dist-item">
        <div class="dist-label">
          <span>${emoji} ${getEmotionLabel(d.mood)}</span>
          <span class="dist-pct">${pct}%</span>
        </div>
        <div class="dist-bar-bg">
          <div class="dist-bar" style="width:${pct}%; background:${color};"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderMoodPrediction(history) {
  const container = document.getElementById('mood-prediction');
  if (!history || history.length < 3) {
    container.innerHTML = '<div class="dash-empty"><p>Need 3+ days of data for a Digital Twin forecast</p></div>';
    return;
  }

  const prediction = predictNextMood(history);
  container.innerHTML = `
    <div class="prediction-content">
      <div class="prediction-main">
        <span class="pred-icon">${prediction.icon}</span>
        <div class="pred-text">
          <h4>Likely: ${prediction.mood}</h4>
          <p>Confidence: ${prediction.confidence}%</p>
        </div>
      </div>
      <div class="pred-body">
        <div class="pred-rationale">
          <h5>Why?</h5>
          <p>${prediction.rationale}</p>
        </div>
        <div class="pred-advice">
          <h5>Proactive Step:</h5>
          <p>${prediction.advice}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Digital Twin Helper: Predict next mood based on history and patterns
 */
function predictNextMood(history) {
  const recent = history.slice(-10);
  const avgIntensity = recent.reduce((s, m) => s + m.intensity, 0) / recent.length;

  // Day of week pattern check
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowDay = tomorrow.getDay(); // 0-6

  const historyOnSameDay = history.filter(m => new Date(m.created_at).getDay() === tomorrowDay);
  const negOnSameDay = historyOnSameDay.filter(m =>
    ['stress', 'anxiety', 'depression', 'sadness', 'anger'].includes(m.mood)
  );

  // Pattern detection logic
  if (tomorrowDay === 0 && negOnSameDay.length / historyOnSameDay.length > 0.6) {
    return {
      mood: 'Evening Anxiety',
      icon: '😟',
      confidence: 78,
      rationale: 'I\'ve detected a recurring "Sunday Slump" in your emotional history.',
      advice: 'Try scheduling a low-pressure social activity or a hobby you love for tomorrow evening.'
    };
  }

  if (avgIntensity > 0.75) {
    return {
      mood: 'High Intensity',
      icon: '⚠️',
      confidence: 65,
      rationale: 'Your emotional frequency has been unusually high for the last 48 hours.',
      advice: 'Tomorrow might feel overwhelming. Can you move one non-essential task to next week?'
    };
  }

  if (avgIntensity < 0.4 && history.length > 5) {
    return {
      mood: 'Stable / Upward',
      icon: '🌱',
      confidence: 55,
      rationale: 'You\'ve been maintaining a steady, calm baseline recently.',
      advice: 'A great time to tackle something you\'ve been putting off while your energy is stable!'
    };
  }

  return {
    mood: 'Moderate / Normal',
    icon: '🧘',
    confidence: 45,
    rationale: 'No strong patterns detected for tomorrow; follow your usual routine.',
    advice: 'Keep logging your feelings to help me understand your patterns better.'
  };
}


function renderTriggerInsights(dayOfWeekData) {
  const container = document.getElementById('trigger-insights');
  if (!dayOfWeekData || dayOfWeekData.length === 0) {
    container.innerHTML = '<div class="dash-empty"><p>Use the app more — trigger detection needs data</p></div>';
    return;
  }

  // Group by day
  const byDay = {};
  dayOfWeekData.forEach(d => {
    if (!byDay[d.day_name]) byDay[d.day_name] = [];
    byDay[d.day_name].push(d);
  });

  const dayInsights = Object.entries(byDay).map(([day, moods]) => {
    const negMoods = moods.filter(m => ['stress', 'anxiety', 'depression', 'sadness', 'anger', 'loneliness'].includes(m.mood));
    const totalCount = moods.reduce((s, m) => s + m.count, 0);
    const negCount = negMoods.reduce((s, m) => s + m.count, 0);
    const negPct = totalCount > 0 ? Math.round((negCount / totalCount) * 100) : 0;
    const topMood = moods.sort((a, b) => b.count - a.count)[0];

    return { day, negPct, topMood: topMood.mood, total: totalCount };
  }).sort((a, b) => b.negPct - a.negPct);

  container.innerHTML = dayInsights.slice(0, 5).map(d => `
    <div class="trigger-item ${d.negPct > 60 ? 'trigger-warning' : ''}">
      <span class="trigger-day">${d.day}</span>
      <span class="trigger-mood">${getEmotionEmoji(d.topMood)} ${getEmotionLabel(d.topMood)}</span>
      ${d.negPct > 60 ? `<span class="trigger-alert">⚠️ ${d.negPct}% negative</span>` : ''}
    </div>
  `).join('');
}

function renderAIInsights(data) {
  const container = document.getElementById('ai-insights');
  if (!data || !data.insights || data.insights.length === 0) {
    container.innerHTML = `<div class="dash-empty"><p>${data?.message || 'Keep logging your mood — insights appear after a few entries!'}</p></div>`;
    return;
  }

  container.innerHTML = data.insights.map(insight => `
    <div class="insight-card insight-${insight.severity || 'info'}">
      <span class="insight-icon">${insight.icon}</span>
      <div class="insight-content">
        <div class="insight-title">${insight.title}</div>
        <div class="insight-desc">${insight.description}</div>
      </div>
    </div>
  `).join('');
}

function renderRecommendations(distribution) {
  const container = document.getElementById('dash-recommendations');
  if (!distribution || distribution.length === 0) {
    container.innerHTML = '<div class="dash-empty"><p>Recommendations appear based on your mood data</p></div>';
    return;
  }

  // Get recommendations for the most common moods
  const topMoods = distribution.slice(0, 2);
  let allRecs = [];
  topMoods.forEach(d => {
    const recs = getRecommendations(d.mood, d.avg_intensity, 2);
    allRecs = allRecs.concat(recs);
  });

  if (allRecs.length === 0) {
    container.innerHTML = '<div class="dash-empty"><p>No specific recommendations yet</p></div>';
    return;
  }

  container.innerHTML = allRecs.slice(0, 4).map(rec => `
    <div class="dash-rec-card">
      <div class="dash-rec-icon">${rec.icon}</div>
      <div class="dash-rec-info">
        <div class="dash-rec-title">${rec.title}</div>
        <div class="dash-rec-desc">${rec.description}</div>
        <span class="dash-rec-type">${rec.type} · ${rec.duration}</span>
      </div>
    </div>
  `).join('');
}
