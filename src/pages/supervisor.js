/**
 * EmoSense Supervisor Portal
 * Admin dashboard for monitoring counselors, queue stats, flagged sessions, reports,
 * and managing counselor accounts (delete).
 */

import { apiGet, apiPost, apiPut, apiDelete, getCounselorToken, saveCounselorToken, clearCounselorToken } from '../api.js';

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
    const { counselors, queueStats, recentAlerts, feedbackSummary, emotionStats, recentFeedback } = data;

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
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: var(--space-xl);">
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
        <div class="card" style="text-align: center; padding: 1.25rem;">
          <div style="font-size: 2rem; font-weight: 800; color: #6366f1;">${counselors.length}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">Total Counselors</div>
        </div>
      </div>

      <!-- Tabs -->
      <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; border-bottom: 2px solid var(--gray-200); padding-bottom: 0.5rem; flex-wrap: wrap;">
        <button class="btn btn-sm sup-tab active" data-tab="counselors">👥 Counselors</button>
        <button class="btn btn-sm sup-tab" data-tab="alerts">🚨 Alerts</button>
        <button class="btn btn-sm sup-tab" data-tab="emotions">🧠 Emotion Trends</button>
        <button class="btn btn-sm sup-tab" data-tab="feedback">📊 Feedback Stats</button>
        <button class="btn btn-sm sup-tab" data-tab="student-feedback">💬 Student Feedback</button>
      </div>

      <!-- Counselors Tab -->
      <div class="sup-panel" id="panel-counselors">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 style="margin: 0;">Counselor Status & Management</h3>
          <a href="#counselor-register" class="btn btn-sm btn-primary" style="font-size: 0.8rem; padding: 0.4rem 1rem; text-decoration: none;">+ Add Counselor</a>
        </div>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
            <thead>
              <tr style="background: var(--gray-50); text-align: left;">
                <th style="padding: 0.75rem;">Name</th>
                <th style="padding: 0.75rem;">Email</th>
                <th style="padding: 0.75rem;">Status</th>
                <th style="padding: 0.75rem;">Specialization</th>
                <th style="padding: 0.75rem;">Active</th>
                <th style="padding: 0.75rem;">Load</th>
                <th style="padding: 0.75rem; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${counselors.map(c => {
                const load = c.max_concurrent_chats > 0 ? Math.round((c.activeChats / c.max_concurrent_chats) * 100) : 0;
                const loadColor = load >= 80 ? '#ef4444' : load >= 50 ? '#f59e0b' : '#22c55e';
                return `
                <tr style="border-bottom: 1px solid var(--gray-100);" data-counselor-row="${c.id}">
                  <td style="padding: 0.75rem;"><strong>${c.name}</strong></td>
                  <td style="padding: 0.75rem; font-size: 0.8rem; color: var(--text-muted);">${c.email || '—'}</td>
                  <td style="padding: 0.75rem;">${c.is_online ? '<span style="color: #22c55e;">🟢 Online</span>' : '<span style="color: var(--text-muted);">⚪ Offline</span>'}</td>
                  <td style="padding: 0.75rem;">${c.specialization || '—'}</td>
                  <td style="padding: 0.75rem;">${c.activeChats || 0}/${c.max_concurrent_chats || 3}</td>
                  <td style="padding: 0.75rem;"><div style="background: var(--gray-200); border-radius: 10px; height: 8px; width: 80px;"><div style="background: ${loadColor}; border-radius: 10px; height: 8px; width: ${load}%;"></div></div></td>
                  <td style="padding: 0.75rem; text-align: center;">
                    <button class="btn-delete-counselor" data-id="${c.id}" data-name="${c.name}" title="Delete counselor"
                      style="background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.25); border-radius: 8px; padding: 0.3rem 0.7rem; font-size: 0.75rem; cursor: pointer; font-weight: 600; transition: all 0.2s;"
                      onmouseover="this.style.background='#ef4444';this.style.color='white'"
                      onmouseout="this.style.background='rgba(239,68,68,0.1)';this.style.color='#ef4444'"
                      onclick="window.__deleteCounselor(${c.id}, '${c.name.replace(/'/g, "\\'")}')">
                      🗑️ Delete
                    </button>
                  </td>
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

      <!-- Feedback Stats Tab -->
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

      <!-- Student Feedback Tab (NEW) -->
      <div class="sup-panel" id="panel-student-feedback" style="display: none;">
        <h3 style="margin-bottom: 1rem;">💬 Student Feedback</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">View all feedback submitted by students after their sessions.</p>
        ${!recentFeedback || recentFeedback.length === 0 
          ? '<div style="text-align: center; padding: 2rem; color: var(--text-muted);"><div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📝</div><p>No student feedback yet.</p></div>'
          : `<div style="display: flex; flex-direction: column; gap: 0.75rem;">
              ${recentFeedback.map(fb => {
                const stars = '⭐'.repeat(fb.rating || 0) + '☆'.repeat(5 - (fb.rating || 0));
                const ratingColor = fb.rating >= 4 ? '#22c55e' : fb.rating >= 3 ? '#f59e0b' : '#ef4444';
                const outcomeColors = {
                  'felt_better': '#22c55e', 'much_better': '#059669', 'no_change': '#f59e0b',
                  'felt_worse': '#ef4444', 'neutral': '#6b7280'
                };
                const outcomeLabels = {
                  'felt_better': '🙂 Felt Better', 'much_better': '😊 Much Better', 'no_change': '😐 No Change',
                  'felt_worse': '😞 Felt Worse', 'neutral': '😐 Neutral'
                };
                return `
                <div style="background: white; border: 1px solid var(--gray-200); border-radius: 12px; padding: 1rem 1.25rem; transition: all 0.2s;" 
                     onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'" onmouseout="this.style.boxShadow='none'">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.75rem; flex-shrink: 0;">${(fb.display_name || 'S').charAt(0)}</div>
                      <div>
                        <div style="font-weight: 600; font-size: 0.85rem;">${fb.display_name || 'Student'}</div>
                        <div style="font-size: 0.7rem; color: var(--text-muted);">${new Date(fb.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-size: 0.85rem; letter-spacing: 2px;">${stars}</div>
                      <div style="font-size: 0.7rem; font-weight: 700; color: ${ratingColor};">${fb.rating}/5</div>
                    </div>
                  </div>
                  ${fb.comment ? `<div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; padding: 0.5rem 0; border-top: 1px solid var(--gray-100);">"${fb.comment}"</div>` : ''}
                  <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.4rem;">
                    ${fb.counselor_name ? `<span style="font-size: 0.7rem; padding: 2px 8px; border-radius: 10px; background: rgba(99,102,241,0.1); color: #818cf8;">🩺 ${fb.counselor_name}</span>` : ''}
                    ${fb.category ? `<span style="font-size: 0.7rem; padding: 2px 8px; border-radius: 10px; background: rgba(245,158,11,0.1); color: #d97706;">📂 ${fb.category}</span>` : ''}
                    ${fb.session_type ? `<span style="font-size: 0.7rem; padding: 2px 8px; border-radius: 10px; background: rgba(107,114,128,0.1); color: #6b7280;">${fb.session_type}</span>` : ''}
                    ${fb.emotional_outcome ? `<span style="font-size: 0.7rem; padding: 2px 8px; border-radius: 10px; background: rgba(34,197,94,0.1); color: ${outcomeColors[fb.emotional_outcome] || '#6b7280'};">${outcomeLabels[fb.emotional_outcome] || fb.emotional_outcome}</span>` : ''}
                  </div>
                  ${fb.improvement ? `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem; font-style: italic;">💡 Suggestion: "${fb.improvement}"</div>` : ''}
                </div>`;
              }).join('')}
            </div>`
        }
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

    // Delete counselor — global handler so onclick in HTML always works
    window.__deleteCounselor = async (id, name) => {
        // Show custom confirmation dialog (native confirm() can be suppressed by browsers)
        const overlay = document.createElement('div');
        overlay.id = 'delete-confirm-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
        overlay.innerHTML = `
            <div style="background:#1e293b;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:2rem;max-width:420px;width:90%;color:white;box-shadow:0 20px 40px rgba(0,0,0,0.4);">
                <h3 style="margin:0 0 0.5rem;font-size:1.2rem;">⚠️ Delete Counselor</h3>
                <p style="color:rgba(255,255,255,0.6);font-size:0.9rem;margin-bottom:1rem;">Are you sure you want to delete <strong style="color:white;">"${name}"</strong>?</p>
                <ul style="color:rgba(255,255,255,0.5);font-size:0.8rem;margin-bottom:1.5rem;padding-left:1.2rem;">
                    <li>Remove their account permanently</li>
                    <li>Close any active sessions</li>
                    <li>Remove their schedules and notes</li>
                </ul>
                <div style="display:flex;gap:0.75rem;justify-content:flex-end;">
                    <button id="del-cancel" style="padding:0.5rem 1.25rem;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:transparent;color:white;cursor:pointer;font-size:0.85rem;">Cancel</button>
                    <button id="del-confirm" style="padding:0.5rem 1.25rem;border-radius:10px;border:none;background:#ef4444;color:white;cursor:pointer;font-weight:700;font-size:0.85rem;">Delete</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Wait for user choice
        const userChoice = await new Promise(resolve => {
            overlay.querySelector('#del-confirm').addEventListener('click', () => resolve(true));
            overlay.querySelector('#del-cancel').addEventListener('click', () => resolve(false));
            overlay.addEventListener('click', (e) => { if (e.target === overlay) resolve(false); });
        });
        overlay.remove();

        if (!userChoice) return;

        const btn = container.querySelector(`.btn-delete-counselor[data-id="${id}"]`);
        if (btn) { btn.disabled = true; btn.innerHTML = '⏳...'; }

        try {
            await apiDelete(`/api/counselors/${id}`, token);

            // Remove the row from the table with animation
            const row = container.querySelector(`[data-counselor-row="${id}"]`);
            if (row) {
                row.style.transition = 'all 0.3s';
                row.style.opacity = '0';
                row.style.transform = 'translateX(20px)';
                setTimeout(() => row.remove(), 300);
            }

            showToast(`✅ Counselor "${name}" has been deleted.`, 'success');
        } catch (err) {
            if (btn) { btn.disabled = false; btn.innerHTML = '🗑️ Delete'; }
            showToast(`❌ Failed to delete: ${err.message}`, 'error');
        }
    };


    document.getElementById('refresh-btn')?.addEventListener('click', () => renderSupervisor(container));
    document.getElementById('sup-logout')?.addEventListener('click', () => { clearCounselorToken(); renderSupervisorLogin(container); });
}

function showToast(message, type = 'success') {
    const existing = document.getElementById('sup-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'sup-toast';
    toast.style.cssText = `
        position: fixed; bottom: 2rem; right: 2rem; z-index: 10000;
        padding: 0.85rem 1.5rem; border-radius: 12px;
        font-size: 0.85rem; font-weight: 600; color: white;
        background: ${type === 'success' ? 'linear-gradient(135deg, #059669, #047857)' : 'linear-gradient(135deg, #dc2626, #991b1b)'};
        box-shadow: 0 8px 30px rgba(0,0,0,0.25);
        animation: slideUp 0.3s ease-out;
        max-width: 400px;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}
