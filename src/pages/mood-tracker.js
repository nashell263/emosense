/**
 * EmoSense Mood Tracker Page — Complete Redesign
 * Stats cards, line chart, donut distribution chart, and modal check-in.
 */

const MOODS = [
  { emoji: '😊', label: 'Great', value: 5, color: '#059669' },
  { emoji: '🙂', label: 'Good', value: 4, color: '#0d9488' },
  { emoji: '😐', label: 'Okay', value: 3, color: '#f59e0b' },
  { emoji: '😔', label: 'Low', value: 2, color: '#ea580c' },
  { emoji: '😢', label: 'Bad', value: 1, color: '#dc2626' },
];

const STORAGE_KEY = 'emosense_mood_history';

function getMoodHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveMoodEntry(entry) {
  const history = getMoodHistory();
  history.unshift(entry);
  if (history.length > 90) history.length = 90;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function renderMoodTracker(container) {
  const history = getMoodHistory();

  // Calculate stats
  const totalEntries = history.length;
  const avgMood = totalEntries > 0
    ? (history.reduce((sum, e) => sum + e.value, 0) / totalEntries).toFixed(1)
    : '—';
  const trend = getTrend(history);

  container.innerHTML = `
    <div class="mood-tracker-container">
      <!-- Header with Log Mood button -->
      <div class="mood-tracker-header animate-slide-up" style="display: flex; align-items: flex-start; justify-content: space-between; text-align: left;">
        <div>
          <h1>Track Your Emotional Wellness</h1>
          <p>Monitor your mood patterns to better understand your mental health journey.</p>
        </div>
        <button class="btn-log-mood" id="open-mood-modal">
          + Log Mood
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="mood-stats-grid animate-slide-up-delay-1">
        <div class="mood-stat-card">
          <div class="label">Total Entries</div>
          <div class="value">${totalEntries}</div>
        </div>
        <div class="mood-stat-card">
          <div class="label">Average Mood</div>
          <div class="value teal">${avgMood}/5</div>
        </div>
        <div class="mood-stat-card">
          <div class="label">Trend</div>
          <div class="value green"><span class="trend-icon">${trend.icon}</span>${trend.label}</div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="mood-charts-grid animate-slide-up-delay-2">
        <!-- Line Chart -->
        <div class="mood-chart-section">
          <h2>Mood Over Time</h2>
          <canvas id="mood-line-chart" class="mood-chart-canvas"></canvas>
          <div id="no-line-data" style="text-align: center; padding: var(--space-xl); color: var(--text-muted); display: none;">
            Log at least 2 moods to see your trend chart.
          </div>
        </div>

        <!-- Donut Chart -->
        <div class="mood-chart-section">
          <h2>Mood Distribution</h2>
          <div class="mood-donut-container">
            <canvas id="mood-donut-chart" width="220" height="220"></canvas>
            <div id="no-donut-data" style="text-align: center; padding: var(--space-xl); color: var(--text-muted); display: none;">
              Log moods to see your distribution.
            </div>
          </div>
        </div>
      </div>

      <!-- Recent History -->
      <div class="mood-history animate-slide-up-delay-3">
        <h2>Recent Entries</h2>
        <div id="mood-history-list">
          <div style="text-align: center; padding: var(--space-xl); color: var(--text-muted);">
            No mood entries yet. Click "Log Mood" to get started!
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="footer">
      <div class="container footer-inner">
        <div class="footer-brand">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-600)" stroke-width="1.5"><path d="M12 2C9 2 7 4 7 6.5c0 1 .3 1.8.8 2.5C6.3 9.8 5 11.3 5 13c0 1.5.8 2.8 2 3.5-.2.5-.3 1-.3 1.5 0 2.2 1.8 4 4 4h2.6c2.2 0 4-1.8 4-4 0-.5-.1-1-.3-1.5 1.2-.7 2-2 2-3.5 0-1.7-1.3-3.2-2.8-3.9.5-.7.8-1.5.8-2.6C17 4 15 2 12 2z"/></svg>
          EmoSense <span>– Emotion-Aware Digital Counseling</span>
        </div>
        <div class="footer-disclaimer">All mood data is stored locally on your device. Nothing is sent to any server.</div>
      </div>
    </footer>
  `;

  // Log Mood modal
  document.getElementById('open-mood-modal').addEventListener('click', () => openMoodModal(container));

  renderHistory();
  renderLineChart();
  renderDonutChart();
}

function openMoodModal(pageContainer) {
  let selectedMood = null;

  const overlay = document.createElement('div');
  overlay.className = 'mood-modal-overlay';
  overlay.innerHTML = `
    <div class="mood-modal">
      <h2>How are you feeling right now?</h2>
      <div class="mood-options" id="modal-mood-options">
        ${MOODS.map(mood => `
          <button class="mood-option" data-value="${mood.value}" data-emoji="${mood.emoji}" data-label="${mood.label}">
            <span class="emoji">${mood.emoji}</span>
            <span class="label">${mood.label}</span>
          </button>
        `).join('')}
      </div>
      <textarea class="mood-note-input" id="modal-mood-note" placeholder="Add a note about how you're feeling (optional)..."></textarea>
      <div style="display: flex; gap: var(--space-md); justify-content: center;">
        <button class="btn btn-outline" id="modal-cancel">Cancel</button>
        <button class="btn btn-primary" id="modal-save" disabled>Log My Mood</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) { overlay.remove(); }
  });

  document.getElementById('modal-cancel').addEventListener('click', () => overlay.remove());

  // Mood selection
  const options = overlay.querySelectorAll('.mood-option');
  const saveBtn = document.getElementById('modal-save');

  options.forEach(btn => {
    btn.addEventListener('click', () => {
      options.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedMood = {
        value: parseInt(btn.dataset.value),
        emoji: btn.dataset.emoji,
        label: btn.dataset.label
      };
      saveBtn.disabled = false;
    });
  });

  saveBtn.addEventListener('click', () => {
    if (!selectedMood) return;

    const note = document.getElementById('modal-mood-note').value.trim();
    const entry = {
      ...selectedMood,
      note,
      timestamp: Date.now(),
      date: new Date().toLocaleDateString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short',
        day: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    };

    saveMoodEntry(entry);
    overlay.remove();
    renderMoodTracker(pageContainer);
  });
}

function getTrend(history) {
  if (history.length < 2) return { icon: '📊', label: 'N/A' };
  const recent = history.slice(0, Math.min(3, history.length));
  const older = history.slice(Math.min(3, history.length), Math.min(6, history.length));
  if (older.length === 0) return { icon: '📊', label: 'New' };

  const recentAvg = recent.reduce((s, e) => s + e.value, 0) / recent.length;
  const olderAvg = older.reduce((s, e) => s + e.value, 0) / older.length;
  const diff = recentAvg - olderAvg;

  if (diff > 0.5) return { icon: '📈', label: 'Improving' };
  if (diff < -0.5) return { icon: '📉', label: 'Declining' };
  return { icon: '➡️', label: 'Moderate' };
}

function renderHistory() {
  const list = document.getElementById('mood-history-list');
  const history = getMoodHistory();

  if (history.length === 0) {
    list.innerHTML = `<div style="text-align: center; padding: var(--space-xl); color: var(--text-muted);">No mood entries yet. Click "Log Mood" to get started!</div>`;
    return;
  }

  list.innerHTML = history.slice(0, 15).map(entry => `
    <div class="mood-entry">
      <span class="emoji">${entry.emoji}</span>
      <div class="mood-entry-info">
        <div class="mood-label">${entry.label}</div>
        ${entry.note ? `<div class="mood-note">${entry.note}</div>` : ''}
        <div class="mood-date">${entry.date}</div>
      </div>
    </div>
  `).join('');
}

function renderLineChart() {
  const canvas = document.getElementById('mood-line-chart');
  const noData = document.getElementById('no-line-data');
  const history = getMoodHistory().slice(0, 14).reverse();

  if (history.length < 2) {
    canvas.style.display = 'none';
    noData.style.display = 'block';
    return;
  }

  canvas.style.display = 'block';
  noData.style.display = 'none';

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width, h = rect.height;
  const pad = { top: 20, right: 20, bottom: 40, left: 30 };
  const cw = w - pad.left - pad.right;
  const ch = h - pad.top - pad.bottom;

  ctx.clearRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = pad.top + ch - (i / 5) * ch;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.textAlign = 'right';
    ctx.fillText(i.toString(), pad.left - 6, y + 4);
  }

  // Plot
  const points = history.map((entry, i) => ({
    x: pad.left + (i / (history.length - 1)) * cw,
    y: pad.top + ch - (entry.value / 5) * ch,
    entry
  }));

  // Area
  ctx.beginPath();
  ctx.moveTo(points[0].x, pad.top + ch);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, pad.top + ch);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
  grad.addColorStop(0, 'rgba(13, 148, 136, 0.2)');
  grad.addColorStop(1, 'rgba(13, 148, 136, 0.02)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Smooth line
  ctx.beginPath();
  ctx.strokeStyle = '#0d9488';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (points.length >= 3) {
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  } else {
    points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  }
  ctx.stroke();

  // Dots
  points.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#0d9488';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
  });

  // X labels (dates)
  ctx.font = '10px Inter, sans-serif';
  ctx.fillStyle = '#9ca3af';
  ctx.textAlign = 'center';
  points.forEach((p, i) => {
    if (history.length <= 7 || i % 2 === 0) {
      const d = new Date(p.entry.timestamp);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      ctx.fillText(`${d.getDate()} ${dayNames[d.getDay()]}`, p.x, pad.top + ch + 18);
    }
  });
}

function renderDonutChart() {
  const canvas = document.getElementById('mood-donut-chart');
  const noData = document.getElementById('no-donut-data');
  const history = getMoodHistory();

  if (history.length === 0) {
    canvas.style.display = 'none';
    noData.style.display = 'block';
    return;
  }

  canvas.style.display = 'block';
  noData.style.display = 'none';

  // Count moods
  const counts = {};
  history.forEach(e => {
    counts[e.label] = (counts[e.label] || 0) + 1;
  });

  const entries = Object.entries(counts).map(([label, count]) => {
    const mood = MOODS.find(m => m.label === label);
    return { label, count, color: mood ? mood.color : '#6b7280' };
  }).sort((a, b) => b.count - a.count);

  const total = history.length;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = 220 * dpr;
  canvas.height = 220 * dpr;
  ctx.scale(dpr, dpr);

  const cx = 110, cy = 100;
  const outerR = 80, innerR = 50;
  let startAngle = -Math.PI / 2;

  ctx.clearRect(0, 0, 220, 220);

  entries.forEach(entry => {
    const sliceAngle = (entry.count / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
    ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = entry.color;
    ctx.fill();

    // Label
    const midAngle = startAngle + sliceAngle / 2;
    const labelR = outerR + 18;
    const lx = cx + Math.cos(midAngle) * labelR;
    const ly = cy + Math.sin(midAngle) * labelR;
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = '#374151';
    ctx.textAlign = Math.cos(midAngle) > 0 ? 'left' : 'right';
    ctx.fillText(`${entry.label} (${entry.count})`, lx, ly);

    startAngle += sliceAngle;
  });
}
