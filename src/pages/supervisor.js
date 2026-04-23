/**
 * EmoSense Supervisor Portal
 * Admin dashboard for monitoring counselors, queue stats, flagged sessions, and reports
 */

import { apiGet, apiPost, apiPut, getCounselorToken, saveCounselorToken, clearCounselorToken } from '../api.js';

export async function renderSupervisor(container) {
    const token = getCounselorToken();
    if (!token) {
        renderSupervisorLogin(container);
        return;
    }

    container.innerHTML = `<div style="text-align:center; padding: 4rem;"><div class="vr-loading-spinner"></div><p>Loading supervisor dashboard...</p></div>`;

    try {
        const data = await apiGet('/api/supervisor/dashboard', token);
        renderSupervisorUI(container, data, token);
    } catch (err) {
        renderSupervisorLogin(container);
    }
}

function renderSupervisorLogin(container) {
    container.innerHTML = `
    <div class="dashboard-login-page">
      <div class="login-card animate-slide-up">
        <div class="login-header">
          <div class="login-icon" style="background: linear-gradient(135deg, #7c3aed, #a855f7);">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h2>Supervisor Portal</h2>
          <p>Access analytics, manage counselors, and monitor system health.</p>
          <div id="login-error" class="login-error" style="display: none;"></div>
          <form id="login-form">
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" id="login-email" placeholder="supervisor@msu.ac.zw" required />
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" id="login-password" placeholder="Enter password" required />
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; background: linear-gradient(135deg, #7c3aed, #a855f7);">
              Sign In as Supervisor
            </button>
          </form>
          <div class="login-demo-note">
            <strong>Demo:</strong> Use any counselor credentials (they have supervisor access in demo mode)
          </div>
        </div>
      </div>
    </div>
  `;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const result = await apiPost('/api/counselors/login', {
                email: document.getElementById('login-email').value,
                password: document.getElementById('login-password').value
            });
            saveCounselorToken(result.token);
            renderSupervisor(container);
        } catch (err) {
            const errEl = document.getElementById('login-error');
            errEl.textContent = err.message;
            errEl.style.display = 'block';
        }
    });
}

function renderSupervisorUI(container, data, token) {
    const { counselors, queueStats, recentAlerts, feedbackSummary, emotionStats } = data;

    container.innerHTML = `
    <div style="padding: var(--space-xl) var(--space-lg); max-width: 1200px; margin: 0 auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-xl);">
        <div>
          <h1 style="font-size: 1.75rem; margin-bottom: 0.25rem;">🛡️ Supervisor Dashboard</h1>
          <p style="color: var(--text-muted); font-size: 0.875rem;">System monitoring and counselor management</p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-sm btn-outline" id="refresh-btn">🔄 Refresh</button>
          <button class="btn btn-sm btn-outline" id="sup-logout" style="color: var(--red-600);">Logout</button>
        </div>
      </div>

      <!-- Overview Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: var(--space-xl);">
        <div class="card" style="text-align: center; padding: 1.25rem;">
          <div style="font-size: 2rem; font-weight: 800; color: var(--primary-600);">${queueStats.totalActive || 0}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">Active Sessions</div>
        </div>
        <div class="card" style="text-align: center; padding: 1.25rem;">
          <div style="font-size: 2rem; font-weight: 800; color: #f59e0b;">${queueStats.totalWaiting || 0}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">In Queue</div>
        </div>
        <div class="card" style="text-align: center; padding: 1.25rem;">
          <div style="font-size: 2rem; font-weight: 800; color: #22c55e;">${counselors.filter(c => c.is_online).length}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">Counselors Online</div>
        </div>
        <div class="card" style="text-align: center; padding: 1.25rem;">
          <div style="font-size: 2rem; font-weight: 800; color: #ef4444;">${recentAlerts.filter(a => a.status === 'new').length}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">Unresolved Alerts</div>
        </div>
        <div class="card" style="text-align: center; padding: 1.25rem;">
          <div style="font-size: 2rem; font-weight: 800; color: #8b5cf6;">${feedbackSummary.avgRating || '—'}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">Avg Rating</div>
        </div>
      </div>

      <!-- Tabs -->
      <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; border-bottom: 2px solid var(--gray-200); padding-bottom: 0.5rem;">
        <button class="btn btn-sm sup-tab active" data-tab="counselors">👥 Counselors</button>
        <button class="btn btn-sm sup-tab" data-tab="alerts">🚨 Alerts</button>
        <button class="btn btn-sm sup-tab" data-tab="emotions">🧠 Emotion Trends</button>
        <button class="btn btn-sm sup-tab" data-tab="feedback">📊 Feedback</button>
      </div>

      <!-- Counselors Tab -->
      <div class="sup-panel" id="panel-counselors">
        <h3 style="margin-bottom: 1rem;">Counselor Status & Coverage</h3>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
            <thead>
              <tr style="background: var(--gray-50); text-align: left;">
                <th style="padding: 0.75rem;">Name</th>
                <th style="padding: 0.75rem;">Status</th>
                <th style="padding: 0.75rem;">Specialization</th>
                <th style="padding: 0.75rem;">Active Chats</th>
                <th style="padding: 0.75rem;">Max</th>
                <th style="padding: 0.75rem;">Load</th>
              </tr>
            </thead>
            <tbody>
              ${counselors.map(c => {
                const load = c.max_concurrent_chats > 0 ? Math.round((c.activeChats / c.max_concurrent_chats) * 100) : 0;
                const loadColor = load >= 80 ? '#ef4444' : load >= 50 ? '#f59e0b' : '#22c55e';
                return `
                <tr style="border-bottom: 1px solid var(--gray-100);">
                  <td style="padding: 0.75rem;"><strong>${c.name}</strong></td>
                  <td style="padding: 0.75rem;">${c.is_online ? '<span style="color: #22c55e;">🟢 Online</span>' : '<span style="color: var(--text-muted);">⚪ Offline</span>'}</td>
                  <td style="padding: 0.75rem;">${c.specialization || '—'}</td>
                  <td style="padding: 0.75rem;">${c.activeChats || 0}</td>
                  <td style="padding: 0.75rem;">${c.max_concurrent_chats || 3}</td>
                  <td style="padding: 0.75rem;"><div style="background: var(--gray-200); border-radius: 10px; height: 8px; width: 80px;"><div style="background: ${loadColor}; border-radius: 10px; height: 8px; width: ${load}%;"></div></div></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Alerts Tab -->
      <div class="sup-panel" id="panel-alerts" style="display: none;">
        <h3 style="margin-bottom: 1rem;">Recent Crisis Alerts</h3>
        ${recentAlerts.length === 0 ? '<p style="color: var(--text-muted);">No recent alerts.</p>' :
          recentAlerts.map(a => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border: 1px solid ${a.status === 'new' ? 'var(--red-200)' : 'var(--gray-200)'}; border-radius: var(--radius-md); margin-bottom: 0.5rem; background: ${a.status === 'new' ? 'var(--red-50)' : 'white'};">
              <div>
                <strong>${a.student_alias || 'Unknown'}</strong>
                <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 0.5rem;">${new Date(a.created_at).toLocaleString()}</span>
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">${a.trigger_message?.substring(0, 100) || '—'}</div>
              </div>
              <span style="font-size: 0.75rem; padding: 4px 10px; border-radius: 10px; background: ${a.status === 'new' ? 'var(--red-100)' : 'var(--green-100, #dcfce7)'}; color: ${a.status === 'new' ? 'var(--red-700)' : '#16a34a'};">${a.status}</span>
            </div>
          `).join('')}
      </div>

      <!-- Emotions Tab -->
      <div class="sup-panel" id="panel-emotions" style="display: none;">
        <h3 style="margin-bottom: 1rem;">Emotion Distribution (Recent Sessions)</h3>
        ${emotionStats.length === 0 ? '<p style="color: var(--text-muted);">No emotion data yet.</p>' : `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem;">
            ${emotionStats.map(e => {
              const colors = { stress: '#ef4444', anxiety: '#f59e0b', 'low mood': '#6366f1', neutral: '#22c55e', frustration: '#f97316', loneliness: '#8b5cf6' };
              const emojis = { stress: '😰', anxiety: '😟', 'low mood': '😔', neutral: '😊', frustration: '😤', loneliness: '🥺' };
              return `
                <div class="card" style="padding: 1rem; text-align: center;">
                  <div style="font-size: 2rem;">${emojis[e.emotion] || '💭'}</div>
                  <div style="font-weight: 600; text-transform: capitalize;">${e.emotion}</div>
                  <div style="font-size: 1.5rem; font-weight: 800; color: ${colors[e.emotion] || '#6b7280'};">${e.count}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">detections</div>
                </div>`;
            }).join('')}
          </div>
        `}
      </div>

      <!-- Feedback Tab -->
      <div class="sup-panel" id="panel-feedback" style="display: none;">
        <h3 style="margin-bottom: 1rem;">Feedback Analytics</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <div class="card" style="padding: 1rem; text-align: center;">
            <div style="font-size: 1.5rem; font-weight: 700;">${feedbackSummary.total || 0}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">Total Reviews</div>
          </div>
          <div class="card" style="padding: 1rem; text-align: center;">
            <div style="font-size: 1.5rem; font-weight: 700;">${feedbackSummary.avgRating || '—'}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">Avg Rating</div>
          </div>
          <div class="card" style="padding: 1rem; text-align: center;">
            <div style="font-size: 1.5rem; font-weight: 700;">${feedbackSummary.positivePercent || 0}%</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">Positive (4-5★)</div>
          </div>
        </div>
        ${feedbackSummary.outcomes?.length > 0 ? `
          <h4 style="margin-bottom: 0.5rem;">Emotional Outcomes</h4>
          <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;">
            ${feedbackSummary.outcomes.map(o => `
              <div style="background: var(--gray-50); padding: 0.5rem 1rem; border-radius: var(--radius-md); font-size: 0.85rem;">
                <strong>${o.outcome || 'N/A'}</strong>: ${o.count}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;

    // Tab switching
    container.querySelectorAll('.sup-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            container.querySelectorAll('.sup-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            container.querySelectorAll('.sup-panel').forEach(p => p.style.display = 'none');
            document.getElementById(`panel-${tab.dataset.tab}`).style.display = 'block';
        });
    });

    document.getElementById('refresh-btn')?.addEventListener('click', () => renderSupervisor(container));
    document.getElementById('sup-logout')?.addEventListener('click', () => { clearCounselorToken(); renderSupervisorLogin(container); });
}
