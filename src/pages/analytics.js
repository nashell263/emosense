/**
 * EmoSense Counselor Analytics Dashboard
 * Emotion distribution, trends, crisis alerts, and summary stats.
 * All charts rendered with Canvas API — no external libraries.
 */

import { apiGet, apiPut, getCounselorToken } from '../api.js';

const EMOTION_COLORS = {
  stress: '#f59e0b',
  anxiety: '#ec4899',
  depression: '#8b5cf6',
  sadness: '#6366f1',
  loneliness: '#14b8a6',
  academic_pressure: '#3b82f6',
  financial_stress: '#10b981',
  anger: '#ef4444',
  hopeful: '#22c55e',
  neutral: '#94a3b8',
  crisis: '#dc2626'
};

const EMOTION_LABELS = {
  stress: 'Stress', anxiety: 'Anxiety', depression: 'Depression',
  sadness: 'Sadness', loneliness: 'Loneliness', academic_pressure: 'Academic Pressure',
  financial_stress: 'Financial Stress', anger: 'Anger', hopeful: 'Positive',
  neutral: 'Neutral', crisis: 'Crisis'
};

export function renderAnalytics(container) {
  const token = getCounselorToken();

  if (!token) {
    container.innerHTML = `
      <div class="container" style="padding-top: var(--space-3xl); text-align: center;">
        <div class="analytics-login-prompt">
          <div style="font-size: 3rem; margin-bottom: var(--space-md);">📊</div>
          <h2>Counselor Analytics Dashboard</h2>
          <p>You must be logged in as a counselor to access analytics.</p>
          <a href="#dashboard" class="btn btn-primary" style="margin-top: var(--space-lg);">Go to Dashboard Login</a>
        </div>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="analytics-page">
      <div class="container">
        <div class="analytics-header animate-slide-up">
          <div>
            <h1>📊 Analytics Dashboard</h1>
            <p>Student emotional wellness insights — data anonymized</p>
          </div>
          <div class="analytics-period-selector">
            <button class="period-btn active" data-period="7">7 Days</button>
            <button class="period-btn" data-period="30">30 Days</button>
            <button class="period-btn" data-period="90">All Time</button>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="analytics-stats animate-slide-up-delay-1" id="stats-grid">
          <div class="stat-card">
            <div class="stat-icon" style="background: #dbeafe; color: #2563eb;">📋</div>
            <div class="stat-value" id="stat-sessions">—</div>
            <div class="stat-label">Total Sessions</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #fef3c7; color: #d97706;">💬</div>
            <div class="stat-value" id="stat-messages">—</div>
            <div class="stat-label">Messages Analyzed</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #fce7f3; color: #db2777;">🎯</div>
            <div class="stat-value" id="stat-top-emotion">—</div>
            <div class="stat-label">Most Common Emotion</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #fee2e2; color: #dc2626;">🚨</div>
            <div class="stat-value" id="stat-crisis">—</div>
            <div class="stat-label">Crisis Alerts</div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="analytics-charts animate-slide-up-delay-2">
          <div class="chart-card">
            <h3>Emotion Distribution</h3>
            <p class="chart-desc">Percentage breakdown of detected student emotions</p>
            <div class="chart-container" id="pie-container"></div>
            <div id="pie-legend" class="chart-legend"></div>
          </div>
          <div class="chart-card">
            <h3>Emotion Breakdown</h3>
            <p class="chart-desc">Count of each emotion type detected</p>
            <div class="chart-container" id="bar-container"></div>
          </div>
        </div>

        <!-- Second Row -->
        <div class="analytics-charts animate-slide-up-delay-3" style="margin-top: var(--space-lg);">
          <div class="chart-card">
            <h3>Peak Distress Hours</h3>
            <p class="chart-desc">When students reach out most</p>
            <div class="chart-container" id="hours-container"></div>
          </div>
          <div class="chart-card">
            <h3>🚨 Crisis Alerts</h3>
            <p class="chart-desc">Recent crisis detections (anonymous)</p>
            <div id="crisis-alerts-list" class="crisis-list">
              <div class="loading-text">Loading alerts...</div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  // Load data
  let currentPeriod = 7;
  loadAnalytics(token, currentPeriod);

  // Period selector
  container.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPeriod = parseInt(btn.dataset.period);
      loadAnalytics(token, currentPeriod);
    });
  });
}

async function loadAnalytics(token, period) {
  try {
    const [summary, emotions, trends, alerts] = await Promise.all([
      apiGet('/api/analytics/summary', token),
      apiGet(`/api/analytics/emotions?period=${period}`, token),
      apiGet(`/api/analytics/trends?period=${period}`, token),
      apiGet('/api/crisis/alerts', token)
    ]);

    // Stats cards
    const sessEl = document.getElementById('stat-sessions');
    const msgEl = document.getElementById('stat-messages');
    const topEl = document.getElementById('stat-top-emotion');
    const crEl = document.getElementById('stat-crisis');
    if (sessEl) sessEl.textContent = summary.totalSessions;
    if (msgEl) msgEl.textContent = summary.totalMessages;
    if (topEl) topEl.textContent = EMOTION_LABELS[summary.topEmotion] || 'None';
    if (crEl) crEl.textContent = `${summary.activeCrisis} active / ${summary.crisisCount} total`;

    // Pie chart (donut)
    if (emotions.emotions && emotions.emotions.length > 0) {
      drawPieChart(emotions.emotions);
    } else {
      showEmpty('pie-container', 'No emotion data yet. Chat with students to generate data.');
    }

    // Bar chart
    if (emotions.emotions && emotions.emotions.length > 0) {
      drawBarChart(emotions.emotions);
    } else {
      showEmpty('bar-container', 'No data available.');
    }

    // Peak hours
    if (summary.peakHours && summary.peakHours.length > 0) {
      drawHoursChart(summary.peakHours);
    } else {
      showEmpty('hours-container', 'No time data yet.');
    }

    // Crisis alerts
    renderCrisisAlerts(alerts, token);

  } catch (err) {
    console.error('Analytics error:', err);
  }
}

function showEmpty(containerId, message) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = `<div class="empty-state">${message}</div>`;
}

function createCanvas(containerId, width, height) {
  const container = document.getElementById(containerId);
  if (!container) return null;
  container.innerHTML = '';
  const canvas = document.createElement('canvas');
  // Set actual pixel dimensions
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = '100%';
  canvas.style.maxHeight = height + 'px';
  container.appendChild(canvas);
  return canvas;
}

function drawPieChart(emotions) {
  const canvas = createCanvas('pie-container', 400, 280);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const cx = w * 0.4, cy = h / 2, r = Math.min(cx, cy) - 20;

  const total = emotions.reduce((sum, e) => sum + e.count, 0);
  let startAngle = -Math.PI / 2;

  emotions.forEach(e => {
    const sliceAngle = (e.count / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = EMOTION_COLORS[e.emotion] || '#94a3b8';
    ctx.fill();
    startAngle += sliceAngle;
  });

  // Donut hole
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Center text
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 28px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(total, cx, cy - 4);
  ctx.font = '12px Inter, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('total', cx, cy + 16);

  // Legend
  const legend = document.getElementById('pie-legend');
  if (legend) {
    legend.innerHTML = emotions.map(e =>
      `<div class="legend-item">
                <span class="legend-dot" style="background:${EMOTION_COLORS[e.emotion] || '#94a3b8'}"></span>
                <span>${EMOTION_LABELS[e.emotion] || e.emotion}</span>
                <strong>${e.percentage}%</strong>
            </div>`
    ).join('');
  }
}

function drawBarChart(emotions) {
  const canvas = createCanvas('bar-container', 500, 280);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const padding = { top: 20, right: 20, bottom: 60, left: 40 };

  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const maxCount = Math.max(...emotions.map(e => e.count), 1);
  const barW = Math.min(50, chartW / emotions.length - 8);

  // Grid lines
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(maxCount * (4 - i) / 4), padding.left - 6, y + 3);
  }

  // Bars
  emotions.forEach((e, i) => {
    const x = padding.left + i * (chartW / emotions.length) + (chartW / emotions.length - barW) / 2;
    const barH = (e.count / maxCount) * chartH;
    const y = padding.top + chartH - barH;

    const gradient = ctx.createLinearGradient(x, y, x, padding.top + chartH);
    const color = EMOTION_COLORS[e.emotion] || '#94a3b8';
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, color + '88');
    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
    ctx.fill();

    // Count on top
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(e.count, x + barW / 2, y - 5);

    // Label below
    ctx.fillStyle = '#64748b';
    ctx.font = '9px Inter, sans-serif';
    ctx.save();
    ctx.translate(x + barW / 2, h - padding.bottom + 10);
    ctx.rotate(Math.PI / 6);
    ctx.textAlign = 'left';
    ctx.fillText(EMOTION_LABELS[e.emotion] || e.emotion, 0, 0);
    ctx.restore();
  });
}

function drawHoursChart(peakHours) {
  const canvas = createCanvas('hours-container', 500, 200);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const padding = { top: 15, right: 20, bottom: 30, left: 40 };

  const maxCount = Math.max(...peakHours.map(p => p.count), 1);
  const barW = Math.min(60, (w - padding.left - padding.right) / peakHours.length - 15);

  peakHours.forEach((p, i) => {
    const x = padding.left + i * ((w - padding.left - padding.right) / peakHours.length) + 10;
    const barH = (p.count / maxCount) * (h - padding.top - padding.bottom);
    const y = h - padding.bottom - barH;

    const gradient = ctx.createLinearGradient(x, y, x, h - padding.bottom);
    gradient.addColorStop(0, '#6366f1');
    gradient.addColorStop(1, '#818cf8');
    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, [6, 6, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#64748b';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${p.hour}:00`, x + barW / 2, h - 10);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(p.count, x + barW / 2, y - 6);
  });
}

function renderCrisisAlerts(alerts, token) {
  const container = document.getElementById('crisis-alerts-list');
  if (!container) return;

  if (!alerts || alerts.length === 0) {
    container.innerHTML = `<div class="empty-state">No crisis alerts recorded. This is a good sign! 💚</div>`;
    return;
  }

  container.innerHTML = alerts.slice(0, 10).map(a => `
    <div class="crisis-alert-item ${a.status}">
      <div class="crisis-alert-header">
        <span class="crisis-severity ${a.severity}">${a.severity.toUpperCase()}</span>
        <span class="crisis-alias">${a.student_alias}</span>
        <span class="crisis-time">${new Date(a.created_at).toLocaleString()}</span>
      </div>
      <div class="crisis-message">"${(a.trigger_message || '').substring(0, 120)}${a.trigger_message?.length > 120 ? '...' : ''}"</div>
      <div class="crisis-footer">
        <span class="crisis-emotion">${EMOTION_LABELS[a.detected_emotion] || a.detected_emotion || 'Unknown'}</span>
        <span class="crisis-status-badge ${a.status}">${a.status}</span>
        ${a.status === 'new' ? `<button class="btn btn-sm btn-acknowledge" data-id="${a.id}">Acknowledge</button>` : ''}
        ${a.status === 'acknowledged' ? `<button class="btn btn-sm btn-resolve" data-id="${a.id}">Resolve</button>` : ''}
        ${a.acknowledged_by_name ? `<span class="crisis-by">by ${a.acknowledged_by_name}</span>` : ''}
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.btn-acknowledge').forEach(btn => {
    btn.addEventListener('click', async () => {
      await apiPut(`/api/crisis/alerts/${btn.dataset.id}/acknowledge`, {}, token);
      const updatedAlerts = await apiGet('/api/crisis/alerts', token);
      renderCrisisAlerts(updatedAlerts, token);
    });
  });

  container.querySelectorAll('.btn-resolve').forEach(btn => {
    btn.addEventListener('click', async () => {
      await apiPut(`/api/crisis/alerts/${btn.dataset.id}/resolve`, {}, token);
      const updatedAlerts = await apiGet('/api/crisis/alerts', token);
      renderCrisisAlerts(updatedAlerts, token);
    });
  });
}
