/**
 * EmoSense Counselor Dashboard
 * Login, profile management, schedule, and incoming chat acceptance
 */

import { apiPost, apiGet, apiPut, getSocketUrl, saveCounselorToken, getCounselorToken, clearCounselorToken } from '../api.js';
import { io } from 'socket.io-client';

let socket = null;
let currentCounselor = null;
let activeSessionId = null;

export function renderDashboard(container) {
    const token = getCounselorToken();
    if (token) {
        loadDashboard(container, token);
    } else {
        renderLogin(container);
    }
}

/* ──────────── LOGIN ──────────── */

function renderLogin(container) {
    container.innerHTML = `
    <div class="dashboard-login-page">
      <div class="login-card animate-slide-up">
        <div class="login-header">
          <div class="login-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="1.5"><path d="M12 2C9 2 7 4 7 6.5c0 1 .3 1.8.8 2.5C6.3 9.8 5 11.3 5 13c0 1.5.8 2.8 2 3.5-.2.5-.3 1-.3 1.5 0 2.2 1.8 4 4 4h2.6c2.2 0 4-1.8 4-4 0-.5-.1-1-.3-1.5 1.2-.7 2-2 2-3.5 0-1.7-1.3-3.2-2.8-3.9.5-.7.8-1.5.8-2.6C17 4 15 2 12 2z"/></svg>
        </div>
        <h2>Counselor Login</h2>
        <p>Access your counseling dashboard to manage sessions and help students.</p>
        <div id="login-error" class="login-error" style="display: none;"></div>
        <form id="login-form">
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" id="login-email" placeholder="e.g. tendai.moyo@msu.ac.zw" required />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="login-password" placeholder="Enter your password" required />
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center;">
            Sign In
          </button>
        </form>
        <div class="login-demo-note">
          <strong>📋 Demo Accounts:</strong><br>
          <div style="margin-top:0.5rem;font-size:0.8rem;line-height:1.8;">
            <div style="background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.2);padding:0.4rem 0.6rem;border-radius:8px;margin-bottom:0.3rem;">
              👩 <strong>Tendai Moyo</strong> (Female — Stress & Anxiety)<br>
              📧 tendai.moyo@msu.ac.zw &nbsp;🔑 counselor123
            </div>
            <div style="background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.2);padding:0.4rem 0.6rem;border-radius:8px;margin-bottom:0.3rem;">
              👨 <strong>Tatenda Chirwa</strong> (Male — Relationships)<br>
              📧 tatenda.chirwa@msu.ac.zw &nbsp;🔑 counselor123
            </div>
            <div style="background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.2);padding:0.4rem 0.6rem;border-radius:8px;">
              👩 <strong>Rutendo Mhaka</strong> (Female — Career & Life)<br>
              📧 rutendo.mhaka@msu.ac.zw &nbsp;🔑 counselor123
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('login-error');
        errorEl.style.display = 'none';

        try {
            const result = await apiPost('/api/counselors/login', {
                email: document.getElementById('login-email').value,
                password: document.getElementById('login-password').value
            });
            saveCounselorToken(result.token);
            currentCounselor = result.counselor;
            loadDashboard(container, result.token);
        } catch (err) {
            errorEl.textContent = err.message;
            errorEl.style.display = 'block';
        }
    });
}

/* ──────────── DASHBOARD ──────────── */

async function loadDashboard(container, token) {
    try {
        const data = await apiGet('/api/counselors/me', token);
        currentCounselor = data.counselor;

        renderDashboardUI(container, data, token);
        connectSocket(container, token);
    } catch (err) {
        clearCounselorToken();
        renderLogin(container);
    }
}

function renderDashboardUI(container, data, token) {
    const { counselor, schedule, activeSessions, pastSessions } = data;

    container.innerHTML = `
    <div class="dashboard-layout">
      <!-- Sidebar -->
      <div class="dashboard-sidebar">
        <div class="dashboard-profile">
          ${counselor.photo
            ? `<img src="${counselor.photo}" alt="${counselor.name}" class="profile-img" />`
            : `<div class="profile-img" style="display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;font-weight:700;font-size:1.4rem;border-radius:50%;width:80px;height:80px;">${counselor.name ? counselor.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '?'}</div>`
          }
          <h3>${counselor.name}</h3>
          <p class="profile-spec">${counselor.specialization || 'General Counselor'}</p>
          <div class="profile-status ${counselor.is_online ? 'online' : 'offline'}">
            ${counselor.is_online ? '🟢 Online' : '⚪ Offline'}
          </div>
        </div>

        <nav class="dashboard-nav">
          <button class="dash-nav-btn active" data-section="sessions">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Chat Sessions
          </button>
          <button class="dash-nav-btn" data-section="schedule">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            My Schedule
          </button>
          <button class="dash-nav-btn" data-section="history">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            History
          </button>
          <button class="dash-nav-btn" data-section="student-feedback">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            Student Feedback
          </button>
        </nav>

        <button class="btn btn-outline btn-sm" id="logout-btn" style="width: 100%; justify-content: center; margin-top: auto;">
          Logout
        </button>
      </div>

      <!-- Main Content -->
      <div class="dashboard-main">
        <!-- Sessions View -->
        <div class="dash-section" id="section-sessions">
          <div class="dash-section-header">
            <h2>💬 Active Sessions</h2>
            <span class="badge" id="session-count">${activeSessions.length}</span>
          </div>

          <!-- Queue Stats -->
          <div style="display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
            <div style="background: rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2); padding: 0.75rem 1rem; border-radius: 12px; flex: 1; min-width: 120px; text-align: center;">
              <div style="font-size: 1.5rem; font-weight: 700; color: #818cf8;">${activeSessions.filter(s => s.status === 'waiting').length}</div>
              <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">Waiting</div>
            </div>
            <div style="background: rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.2); padding: 0.75rem 1rem; border-radius: 12px; flex: 1; min-width: 120px; text-align: center;">
              <div style="font-size: 1.5rem; font-weight: 700; color: #34d399;">${activeSessions.filter(s => s.status === 'active').length}</div>
              <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">Active</div>
            </div>
            <div style="background: rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); padding: 0.75rem 1rem; border-radius: 12px; flex: 1; min-width: 120px; text-align: center;">
              <div style="font-size: 1.5rem; font-weight: 700; color: white;">${counselor.max_concurrent_chats || 3}</div>
              <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">Max Chats</div>
            </div>
          </div>

          <!-- Status Controls -->
          <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
            <button class="btn btn-sm ${counselor.status === 'available' ? 'btn-primary' : 'btn-outline'}" data-set-status="available">🟢 Available</button>
            <button class="btn btn-sm ${counselor.status === 'busy' ? 'btn-primary' : 'btn-outline'}" data-set-status="busy">🟡 Busy</button>
            <button class="btn btn-sm ${counselor.status === 'break' ? 'btn-primary' : 'btn-outline'}" data-set-status="break">⚪ On Break</button>
          </div>

          <div id="active-sessions-list">
            ${activeSessions.length === 0
            ? '<div class="empty-state"><p>No active sessions. Students will appear here when they request to chat.</p></div>'
            : activeSessions.map(s => `
                <div class="session-item ${s.status}" data-session="${s.id}">
                  <div class="session-info">
                    <strong>${s.student_alias}</strong>
                    <span class="session-status-badge ${s.status}">${s.status}</span>
                    ${s.issue_type ? `<span style="font-size: 0.7rem; background: rgba(99,102,241,0.12); color: #a5b4fc; padding: 2px 8px; border-radius: 10px;">${s.issue_type}</span>` : ''}
                    ${s.priority >= 4 ? '<span style="font-size: 0.7rem; background: rgba(239,68,68,0.15); color: #f87171; padding: 2px 8px; border-radius: 10px;">⚡ Urgent</span>' : ''}
                  </div>
                  <div class="session-actions">
                    ${s.status === 'waiting'
                    ? `<button class="btn btn-primary btn-sm accept-btn" data-session="${s.id}">Accept</button>`
                    : `<button class="btn btn-outline btn-sm open-chat-btn" data-session="${s.id}">Open Chat</button>`}
                  </div>
                </div>
              `).join('')}
          </div>

          <!-- Inline chat area with intake + notes panels -->
          <div id="counselor-chat-area" style="display: none;">
            <div class="counselor-chat-header" id="counselor-chat-header"></div>

            <!-- Intake Summary -->
            <div id="intake-summary" style="display: none; background: rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); padding: 0.75rem 1rem; border-radius: 12px; margin-bottom: 0.5rem; font-size: 0.85rem;"></div>

            <div class="counselor-chat-messages" id="counselor-chat-messages"></div>

            <!-- Session Notes -->
            <div id="session-notes-panel" style="display: none; background: rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.15); padding: 0.75rem 1rem; border-radius: 12px; margin-top: 0.5rem;">
              <div style="font-weight: 600; font-size: 0.8rem; margin-bottom: 0.5rem;">📝 Session Notes</div>
              <div id="session-notes-list" style="max-height: 100px; overflow-y: auto; margin-bottom: 0.5rem; font-size: 0.8rem;"></div>
              <div style="display: flex; gap: 0.5rem;">
                <input type="text" id="note-input" placeholder="Add a note..." style="flex: 1; padding: 0.4rem 0.6rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: white; font-size: 0.8rem;" />
                <button class="btn btn-sm btn-primary" id="add-note-btn">Add</button>
              </div>
            </div>

            <div class="counselor-chat-input">
              <div class="chat-input-wrapper" style="display: flex; gap: 0.5rem; align-items: center;">
                <button class="btn btn-sm" id="attach-file-btn" title="Attach file" style="background: transparent; border: none; font-size: 1.2rem; cursor: pointer; padding: 0.4rem;">📎</button>
                <input type="text" class="chat-input" id="counselor-msg-input" placeholder="Type a message..." />
                <button class="chat-send-btn" id="counselor-msg-send">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
              <input type="file" id="file-upload-input" style="display: none;" accept="image/*,.pdf,.doc,.docx,.txt" />
            </div>
          </div>
        </div>

        <!-- Schedule View -->
        <div class="dash-section" id="section-schedule" style="display: none;">
          <div class="dash-section-header">
            <h2>📅 My Schedule</h2>
          </div>
          <div class="schedule-grid">
            ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                        const daySchedule = schedule.find(s => s.day_of_week === day);
                        return `
                <div class="schedule-day ${daySchedule ? 'active' : ''}">
                  <label class="schedule-day-check">
                    <input type="checkbox" data-day="${day}" ${daySchedule ? 'checked' : ''} />
                    <span>${day}</span>
                  </label>
                  <div class="schedule-times" ${daySchedule ? '' : 'style="display:none"'}>
                    <input type="time" class="time-input" data-day="${day}" data-type="start" value="${daySchedule?.start_time || '08:00'}" />
                    <span>to</span>
                    <input type="time" class="time-input" data-day="${day}" data-type="end" value="${daySchedule?.end_time || '16:00'}" />
                  </div>
                </div>
              `;
                    }).join('')}
          </div>
          <button class="btn btn-primary" id="save-schedule-btn" style="margin-top: var(--space-lg);">Save Schedule</button>
        </div>

        <!-- History View -->
        <div class="dash-section" id="section-history" style="display: none;">
          <div class="dash-section-header">
            <h2>📋 Past Sessions</h2>
          </div>
          <div id="past-sessions-list">
            ${pastSessions.length === 0
            ? '<div class="empty-state"><p>No past sessions yet.</p></div>'
            : pastSessions.map(s => `
                <div class="history-item">
                  <span class="history-alias">${s.student_alias}</span>
                  <span class="history-date">${new Date(s.started_at).toLocaleDateString()}</span>
                  <span class="history-status">Completed</span>
                </div>
              `).join('')}
          </div>
        </div>

        <!-- Student Feedback View -->
        <div class="dash-section" id="section-student-feedback" style="display: none;">
          <div class="dash-section-header">
            <h2>💬 Student Feedback</h2>
          </div>
          <p style="font-size: 0.85rem; color: rgba(255,255,255,0.5); margin-bottom: 1rem;">View feedback from students about their counseling experience.</p>
          <div id="student-feedback-list">
            <div style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.4);">
              <div class="vr-loading-spinner" style="margin: 0 auto 0.5rem;"></div>
              Loading feedback...
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

    // NAV SWITCHING
    container.querySelectorAll('.dash-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.dash-nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            container.querySelectorAll('.dash-section').forEach(s => s.style.display = 'none');
            document.getElementById(`section-${btn.dataset.section}`).style.display = 'block';

            // Lazy-load student feedback when tab is clicked
            if (btn.dataset.section === 'student-feedback') {
                loadStudentFeedback(token);
            }
        });
    });

    // SCHEDULE
    container.querySelectorAll('.schedule-day-check input').forEach(cb => {
        cb.addEventListener('change', () => {
            const times = cb.closest('.schedule-day').querySelector('.schedule-times');
            times.style.display = cb.checked ? 'flex' : 'none';
        });
    });

    document.getElementById('save-schedule-btn')?.addEventListener('click', async () => {
        const scheduleData = [];
        container.querySelectorAll('.schedule-day-check input:checked').forEach(cb => {
            const day = cb.dataset.day;
            const start = container.querySelector(`input[data-day="${day}"][data-type="start"]`).value;
            const end = container.querySelector(`input[data-day="${day}"][data-type="end"]`).value;
            scheduleData.push({ day_of_week: day, start_time: start, end_time: end });
        });

        try {
            await apiPut('/api/counselors/me/schedule', { schedule: scheduleData }, token);
            alert('Schedule saved!');
        } catch (err) {
            alert('Failed to save: ' + err.message);
        }
    });

    // STATUS BUTTONS
    container.querySelectorAll('[data-set-status]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const status = btn.dataset.setStatus;
            try {
                await apiPut('/api/counselors/status', { status }, token);
                // Update UI - highlight active button
                container.querySelectorAll('[data-set-status]').forEach(b => {
                    b.classList.remove('btn-primary');
                    b.classList.add('btn-outline');
                });
                btn.classList.remove('btn-outline');
                btn.classList.add('btn-primary');
                currentCounselor.status = status;
            } catch (err) {
                alert('Failed to update status: ' + err.message);
            }
        });
    });

    // ACCEPT SESSION
    container.querySelectorAll('.accept-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            acceptSession(btn.dataset.session, container);
        });
    });

    // OPEN CHAT
    container.querySelectorAll('.open-chat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            openCounselorChat(btn.dataset.session, container);
        });
    });

    // LOGOUT
    document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
            await apiPost('/api/counselors/logout', {}, token);
        } catch { }
        clearCounselorToken();
        if (socket) socket.disconnect();
        renderLogin(container);
    });

    // Send message
    document.getElementById('counselor-msg-send')?.addEventListener('click', sendCounselorMessage);
    document.getElementById('counselor-msg-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendCounselorMessage();
    });

    // FILE ATTACHMENT
    document.getElementById('attach-file-btn')?.addEventListener('click', () => {
        document.getElementById('file-upload-input')?.click();
    });
    document.getElementById('file-upload-input')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file || !activeSessionId) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.url) {
                const isImg = data.type?.startsWith('image/');
                const content = isImg
                    ? `<img src="${data.url}" alt="${file.name}" style="max-width:200px;border-radius:8px;cursor:pointer;" onclick="window.open('${data.url}','_blank')" />`
                    : `📄 <a href="${data.url}" target="_blank" style="color:var(--primary-600);text-decoration:underline;">${file.name}</a>`;
                socket.emit('send-message', { sessionId: activeSessionId, senderType: 'counselor', content });
            }
        } catch (err) { console.error('Upload failed:', err); }
        e.target.value = '';
    });
}

function connectSocket(container, token) {
    if (socket) socket.disconnect();
    
    const counselorId = currentCounselor?.id;
    if (!counselorId) {
        console.error('[DASH] Cannot connect socket: no counselor ID');
        return;
    }

    socket = io(getSocketUrl());

    socket.on('connect', () => {
        console.log('[DASH] Socket connected, emitting counselor-online for ID:', counselorId);
        socket.emit('counselor-online', { counselorId: counselorId });
    });

    socket.on('crisis-alert', (alert) => {
        showDashboardSOSBanner(alert, container, token);
    });

    socket.on('new-chat-request', (data) => {
        const list = document.getElementById('active-sessions-list');
        const emptyState = list.querySelector('.empty-state');
        if (emptyState) emptyState.remove();

        const div = document.createElement('div');
        div.className = 'session-item waiting';
        div.dataset.session = data.sessionId;
        div.innerHTML = `
      <div class="session-info">
        <strong>${data.alias}</strong>
        <span class="session-status-badge waiting">waiting</span>
      </div>
      <div class="session-actions">
        <button class="btn btn-primary btn-sm accept-btn" data-session="${data.sessionId}">Accept</button>
      </div>
    `;
        list.prepend(div);

        const count = document.getElementById('session-count');
        count.textContent = parseInt(count.textContent || 0) + 1;

        div.querySelector('.accept-btn').addEventListener('click', () => {
            acceptSession(data.sessionId, container);
        });
    });

    socket.on('new-message', (data) => {
        if (data.sessionId === activeSessionId) {
            const msgContainer = document.getElementById('counselor-chat-messages');
            const msgDiv = document.createElement('div');
            msgDiv.className = `live-msg ${data.senderType}`;
            const time = new Date(data.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            msgDiv.innerHTML = `
        <div class="live-msg-bubble ${data.senderType}">${data.content}</div>
        <div class="live-msg-meta">${data.senderType === 'counselor' ? 'You' : data.senderType} · ${time}</div>
      `;
            msgContainer.appendChild(msgDiv);
            msgContainer.scrollTop = msgContainer.scrollHeight;
        }
    });

    socket.on('call-accepted', () => {
        const statusEl = document.getElementById('dash-call-status');
        if (statusEl) statusEl.textContent = '✅ Student connected!';
    });

    socket.on('call-ended', () => {
        const overlay = document.getElementById('dash-call-overlay');
        if (overlay) endDashCall(overlay);
    });

    // WhatsApp/Call alert for supervisors on critical SOS
    socket.on('sos-whatsapp-alert', (data) => {
        // Play alert sound
        try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = 880;
            osc.connect(ctx.destination);
            osc.start();
            setTimeout(() => { osc.frequency.value = 660; }, 200);
            setTimeout(() => { osc.frequency.value = 880; }, 400);
            setTimeout(() => { osc.stop(); ctx.close(); }, 600);
        } catch(e) {}

        // Show floating action alert
        const existing = document.getElementById('sos-call-alert');
        if (existing) existing.remove();
        const alertDiv = document.createElement('div');
        alertDiv.id = 'sos-call-alert';
        alertDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:100000;background:linear-gradient(135deg,#1e293b,#0f172a);border:2px solid #dc2626;border-radius:20px;padding:2rem;color:white;text-align:center;max-width:400px;width:92%;box-shadow:0 25px 50px rgba(0,0,0,0.5);animation:sos-slide-in 0.3s ease;';
        alertDiv.innerHTML = `
            <div style="font-size:2.5rem;margin-bottom:0.5rem;">🚨</div>
            <h3 style="margin:0 0 0.5rem;font-size:1.2rem;color:white;">STUDENT IN DANGER</h3>
            <p style="color:#94a3b8;font-size:0.85rem;margin-bottom:0.5rem;">${data.studentAlias} needs immediate help</p>
            ${data.studentPhone ? `<div style="background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.3);border-radius:12px;padding:0.6rem 1rem;margin-bottom:1rem;">
                <span style="font-size:1.1rem;font-weight:700;color:#4ade80;letter-spacing:1px;">📱 ${data.studentPhone}</span>
            </div>` : ''}
            <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;">
                <a href="${data.whatsappUrl}" target="_blank" style="display:flex;align-items:center;gap:0.5rem;padding:0.7rem 1.25rem;background:#25D366;color:white;border-radius:12px;font-weight:700;text-decoration:none;font-size:0.85rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.703-1.228A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.153 0-4.144-.68-5.78-1.834l-.404-.296-2.79.729.757-2.715-.325-.427A9.963 9.963 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                    Message
                </a>
                <a href="${data.whatsappCallUrl}" target="_blank" style="display:flex;align-items:center;gap:0.5rem;padding:0.7rem 1.25rem;background:#128C7E;color:white;border-radius:12px;font-weight:700;text-decoration:none;font-size:0.85rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.11 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    WA Call
                </a>
                <a href="${data.callUrl}" style="display:flex;align-items:center;gap:0.5rem;padding:0.7rem 1.25rem;background:#059669;color:white;border-radius:12px;font-weight:700;text-decoration:none;font-size:0.85rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.11 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/></svg>
                    Phone
                </a>
            </div>
            <button onclick="this.parentElement.remove()" style="margin-top:1rem;background:none;border:1px solid rgba(255,255,255,0.15);color:#94a3b8;padding:0.4rem 1.5rem;border-radius:8px;cursor:pointer;font-size:0.8rem;">Dismiss</button>
        `;
        document.body.appendChild(alertDiv);

        // Auto-dismiss after 30s
        setTimeout(() => { alertDiv?.remove(); }, 30000);
    });
}

function showDashboardSOSBanner(alert, container, token) {
    const mainArea = container.querySelector('.dashboard-main');
    
    const oldBanner = document.getElementById('dash-sos-banner');
    if (oldBanner) oldBanner.remove();

    const severity = alert.severity || 'high';
    const severityColors = { critical: '#dc2626', high: '#ea580c', moderate: '#ca8a04' };
    const severityBg = { critical: '#fef2f2', high: '#fff7ed', moderate: '#fefce8' };
    const triageHtml = alert.triageAnswers ? `
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.4rem;">
            ${alert.triageAnswers.danger ? '<span style="background:#fecaca;color:#991b1b;padding:2px 8px;border-radius:10px;font-size:0.7rem;font-weight:600;">⚠️ In Danger</span>' : ''}
            ${alert.triageAnswers.selfharm ? '<span style="background:#fecaca;color:#991b1b;padding:2px 8px;border-radius:10px;font-size:0.7rem;font-weight:600;">🚨 Self-Harm Risk</span>' : ''}
            ${alert.triageAnswers.urgent ? '<span style="background:#fed7aa;color:#9a3412;padding:2px 8px;border-radius:10px;font-size:0.7rem;font-weight:600;">🔴 Urgent Support</span>' : ''}
        </div>
    ` : '';

    const locationHtml = alert.location ? `
        <div style="margin-top:0.4rem;font-size:0.8rem;">
            📍 <a href="https://maps.google.com/?q=${alert.location.lat},${alert.location.lng}" target="_blank" style="color:var(--primary-600);text-decoration:underline;">${alert.location.address || `${alert.location.lat.toFixed(4)}, ${alert.location.lng.toFixed(4)}`}</a>
        </div>
    ` : '';

    // Student phone contact links
    const phoneRaw = (alert.studentPhone || '').replace(/[\s\-\(\)]/g, '');
    const phoneForWA = phoneRaw.startsWith('0') ? '263' + phoneRaw.substring(1) : phoneRaw.replace('+', '');
    const phoneFull = phoneRaw.startsWith('0') ? '+263' + phoneRaw.substring(1) : (phoneRaw.startsWith('+') ? phoneRaw : '+' + phoneRaw);
    const phoneHtml = alert.studentPhone ? `
        <div style="margin-top:0.5rem;padding:0.5rem 0.75rem;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:10px;display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
            <span style="font-size:0.85rem;font-weight:600;color:#166534;">📱 ${alert.studentPhone}</span>
            <a href="https://wa.me/${phoneForWA}?text=${encodeURIComponent('Hi, I\'m a counselor from MSU EmoSense. I received your SOS alert. How can I help you?')}" target="_blank" style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;background:#25D366;color:white;border-radius:8px;font-size:0.75rem;font-weight:700;text-decoration:none;">💬 WhatsApp</a>
            <a href="https://wa.me/${phoneForWA}" target="_blank" style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;background:#128C7E;color:white;border-radius:8px;font-size:0.75rem;font-weight:700;text-decoration:none;">📞 WA Call</a>
            <a href="tel:${phoneFull}" style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;background:#059669;color:white;border-radius:8px;font-size:0.75rem;font-weight:700;text-decoration:none;">📱 Phone</a>
        </div>
    ` : '';

    const banner = document.createElement('div');
    banner.id = 'dash-sos-banner';
    banner.className = 'dashboard-sos-banner';
    banner.style.borderLeft = `5px solid ${severityColors[severity]}`;
    banner.style.background = severityBg[severity];
    banner.innerHTML = `
        <div class="sos-banner-info" style="flex:1;">
            <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.35rem;">
                <strong style="font-size:1rem;">🚨 EMERGENCY SOS ALERT</strong>
                <span style="background:${severityColors[severity]};color:white;padding:2px 10px;border-radius:12px;font-size:0.7rem;font-weight:700;text-transform:uppercase;">${severity}</span>
            </div>
            <p style="margin:0;font-size:0.85rem;color:var(--gray-700);">
                <strong>${alert.studentAlias}</strong> · ${new Date(alert.timestamp).toLocaleTimeString()}
                ${alert.quickMessage ? ` · "${alert.quickMessage}"` : ''}
            </p>
            ${triageHtml}
            ${phoneHtml}
            ${locationHtml}
        </div>
        <div style="display:flex;gap:0.5rem;align-items:center;flex-shrink:0;">
            <button class="btn-sos-accept" data-id="${alert.id}" data-session="${alert.sessionId}" style="background:#059669;color:white;border:none;padding:0.6rem 1.25rem;border-radius:8px;font-weight:700;cursor:pointer;">Accept Case</button>
            <button class="btn-sos-escalate" style="background:#dc2626;color:white;border:none;padding:0.6rem 1rem;border-radius:8px;font-weight:600;cursor:pointer;font-size:0.8rem;" title="Alert campus security">🚨 Escalate</button>
        </div>
    `;
    
    mainArea.prepend(banner);

    banner.querySelector('.btn-sos-accept').addEventListener('click', async () => {
        try {
            await apiPut(`/api/crisis/alerts/${alert.id}/acknowledge`, {}, token);
            socket.emit('crisis-acknowledged', { alertId: alert.id, sessionId: alert.sessionId });
            banner.remove();
            acceptSession(alert.sessionId, container);
        } catch(err) {
            console.error(err);
        }
    });

    banner.querySelector('.btn-sos-escalate')?.addEventListener('click', () => {
        if (confirm('This will alert campus security and emergency services. Continue?')) {
            alert.escalated = true;
            // Send escalation notification via existing emergency system
            fetch('/api/crisis/sos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contactMethod: 'escalation',
                    isUnsafe: true,
                    severity: 'critical',
                    quickMessage: `ESCALATED by counselor: ${alert.studentAlias} needs immediate on-ground response. ${alert.location ? 'Location: ' + (alert.location.address || alert.location.lat + ',' + alert.location.lng) : 'No location shared.'}`
                })
            });
            const escBtn = banner.querySelector('.btn-sos-escalate');
            escBtn.textContent = '✅ Escalated';
            escBtn.disabled = true;
            escBtn.style.background = '#6b7280';
        }
    });
}

function acceptSession(sessionId, container) {
    socket.emit('counselor-accept-chat', { sessionId });

    const item = document.querySelector(`.session-item[data-session="${sessionId}"]`);
    if (item) {
        item.className = 'session-item active';
        item.querySelector('.session-status-badge').className = 'session-status-badge active';
        item.querySelector('.session-status-badge').textContent = 'active';
        const actions = item.querySelector('.session-actions');
        actions.innerHTML = `<button class="btn btn-outline btn-sm open-chat-btn" data-session="${sessionId}">Open Chat</button>`;
        actions.querySelector('.open-chat-btn').addEventListener('click', () => {
            openCounselorChat(sessionId, container);
        });
    }

    openCounselorChat(sessionId, container);
}

async function openCounselorChat(sessionId, container) {
    activeSessionId = sessionId;

    const chatArea = document.getElementById('counselor-chat-area');
    chatArea.style.display = 'block';

    const header = document.getElementById('counselor-chat-header');
    const session = document.querySelector(`.session-item[data-session="${sessionId}"]`);
    const studentName = session?.querySelector('strong')?.textContent || sessionId.slice(0, 15);
    header.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1;">
      <div style="width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-400), var(--primary-600)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.9rem;">${studentName.charAt(0)}</div>
      <div>
        <strong style="font-size: 0.95rem;">${studentName}</strong>
        <div style="font-size: 0.7rem; color: #16a34a;">● Online</div>
      </div>
    </div>
    <div style="display: flex; gap: 0.4rem; align-items: center;">
      <button class="btn btn-sm" id="dash-audio-call" title="Audio Call" style="width:36px;height:36px;padding:0;display:flex;align-items:center;justify-content:center;background:#ecfdf5;color:#059669;border:1px solid #a7f3d0;border-radius:50%;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      </button>
      <button class="btn btn-sm" id="dash-video-call" title="Video Call" style="width:36px;height:36px;padding:0;display:flex;align-items:center;justify-content:center;background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;border-radius:50%;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
      </button>
      <button class="btn btn-sm" id="clear-chat-btn" title="Clear Chat" style="width:36px;height:36px;padding:0;display:flex;align-items:center;justify-content:center;background:var(--gray-50);color:var(--gray-400);border:1px solid var(--gray-200);border-radius:50%;">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
      <button class="btn btn-sm" style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;padding:0.35rem 0.85rem;border-radius:20px;font-size:0.8rem;font-weight:600;" id="end-counselor-session">End</button>
    </div>`;

    // Audio call
    document.getElementById('dash-audio-call').addEventListener('click', () => {
        startDashCall(sessionId, 'audio');
    });

    // Video call
    document.getElementById('dash-video-call').addEventListener('click', () => {
        startDashCall(sessionId, 'video');
    });

    // Clear chat
    document.getElementById('clear-chat-btn').addEventListener('click', () => {
        if (confirm('Clear all messages from this view?')) {
            document.getElementById('counselor-chat-messages').innerHTML = '<div style="text-align:center;padding:1rem;color:var(--text-muted);font-size:0.8rem;">Chat cleared</div>';
        }
    });

    document.getElementById('end-counselor-session').addEventListener('click', () => {
        socket.emit('end-session', { sessionId });
        chatArea.style.display = 'none';
        activeSessionId = null;
        showCounselorFeedbackForm(sessionId);
    });

    // Load intake summary
    try {
        const intakeData = await apiGet(`/api/sessions/${sessionId}/intake`);
        const intakeEl = document.getElementById('intake-summary');
        if (intakeData.intake) {
            const i = intakeData.intake;
            intakeEl.style.display = 'block';
            intakeEl.innerHTML = `
                <strong>📋 Intake Summary</strong>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.5rem;">
                    <span><strong>Issue:</strong> ${i.issue_type || 'N/A'}</span>
                    <span><strong>Urgency:</strong> ${'🔴'.repeat(Math.min(5, i.urgency || 3))}${'⚪'.repeat(5 - Math.min(5, i.urgency || 3))}</span>
                    <span><strong>Safe:</strong> ${i.is_safe ? '✅ Yes' : '❌ No'}</span>
                    <span><strong>Mode:</strong> ${i.preferred_mode || 'chat'}</span>
                </div>
                ${i.description ? `<div style="margin-top: 0.5rem; font-style: italic; color: var(--text-secondary);">"${i.description}"</div>` : ''}
            `;
        }
    } catch (e) {}

    // Show notes panel
    const notesPanel = document.getElementById('session-notes-panel');
    notesPanel.style.display = 'block';
    loadSessionNotes(sessionId);

    document.getElementById('add-note-btn')?.addEventListener('click', async () => {
        const input = document.getElementById('note-input');
        const text = input.value.trim();
        if (!text) return;
        try {
            const token = getCounselorToken();
            await apiPost(`/api/sessions/${sessionId}/notes`, { content: text }, token);
            input.value = '';
            loadSessionNotes(sessionId);
        } catch (e) {}
    });

    // Load existing messages
    try {
        const messages = await apiGet(`/api/sessions/${sessionId}/messages`);
        const msgContainer = document.getElementById('counselor-chat-messages');
        msgContainer.innerHTML = '';
        messages.forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `live-msg ${msg.sender_type}`;
            const time = new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            msgDiv.innerHTML = `
        <div class="live-msg-bubble ${msg.sender_type}">${msg.content}</div>
        <div class="live-msg-meta">${msg.sender_type === 'counselor' ? 'You' : msg.sender_type} · ${time}</div>
      `;
            msgContainer.appendChild(msgDiv);
        });
        msgContainer.scrollTop = msgContainer.scrollHeight;
    } catch (err) { console.error(err); }

    // Join the room without re-emitting accept (already done in acceptSession)
    socket.emit('join-room', sessionId);
    document.getElementById('counselor-msg-input').focus();
}

async function loadSessionNotes(sessionId) {
    try {
        const token = getCounselorToken();
        const notes = await apiGet(`/api/sessions/${sessionId}/notes`, token);
        const list = document.getElementById('session-notes-list');
        if (list) {
            list.innerHTML = notes.length === 0
                ? '<div style="color: var(--text-muted); font-style: italic;">No notes yet</div>'
                : notes.map(n => `<div style="padding: 4px 0; border-bottom: 1px solid var(--gray-200);">${n.content} <span style="color: var(--text-muted); font-size: 0.7rem;">${new Date(n.created_at).toLocaleTimeString()}</span></div>`).join('');
        }
    } catch (e) {}
}

function showCounselorFeedbackForm(sessionId) {
    // Prevent duplicate feedback forms
    const existing = document.getElementById('counselor-session-feedback-form');
    if (existing) existing.remove();

    const mainArea = document.querySelector('.dashboard-main');
    const div = document.createElement('div');
    div.id = 'counselor-session-feedback-form';
    div.style.cssText = 'background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 1.5rem; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); margin-top: 1rem; color: white;';
    div.innerHTML = `
        <h3 style="color: white; margin-bottom: 0.5rem;">📝 Session Feedback</h3>
        <p style="font-size: 0.85rem; color: rgba(255,255,255,0.5); margin-bottom: 1rem;">Rate this session for quality tracking.</p>
        <div style="margin: 1rem 0;">
            <label style="font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.8);">Difficulty (1-5):</label>
            <input type="range" id="cf-difficulty" min="1" max="5" value="3" style="width: 100%; accent-color: #818cf8;">
        </div>
        <div style="margin: 1rem 0;">
            <label style="font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.8);">Student's emotional state:</label>
            <select id="cf-state" style="width: 100%; padding: 0.5rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: white;">
                <option value="stressed">Stressed</option><option value="anxious">Anxious</option>
                <option value="depressed">Low mood</option><option value="calm">Calm/Stable</option>
                <option value="crisis">Crisis level</option>
            </select>
        </div>
        <div style="margin: 1rem 0;">
            <label style="font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.8);">Outcome:</label>
            <select id="cf-outcome" style="width: 100%; padding: 0.5rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: white;">
                <option value="resolved">Resolved</option><option value="improved">Improved</option>
                <option value="ongoing">Ongoing - needs follow-up</option><option value="referred">Referred to specialist</option>
                <option value="escalated">Escalated to supervisor</option>
            </select>
        </div>
        <label style="display: flex; align-items: center; gap: 0.5rem; margin: 1rem 0; font-size: 0.85rem; color: rgba(255,255,255,0.7);">
            <input type="checkbox" id="cf-followup" style="accent-color: #818cf8;"> Follow-up needed
        </label>
        <textarea id="cf-notes" placeholder="Additional notes..." rows="2" style="width: 100%; margin-bottom: 1rem; padding: 0.5rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: white; font-family: inherit; resize: vertical;"></textarea>
        <button class="btn btn-primary" id="cf-submit" style="width: 100%;">Submit Feedback</button>
    `;
    mainArea.appendChild(div);

    document.getElementById('cf-submit').addEventListener('click', async () => {
        try {
            const token = getCounselorToken();
            await apiPost('/api/feedback/counselor', {
                sessionId,
                difficulty: document.getElementById('cf-difficulty').value,
                studentEmotionalState: document.getElementById('cf-state').value,
                outcome: document.getElementById('cf-outcome').value,
                followUpNeeded: document.getElementById('cf-followup').checked,
                notes: document.getElementById('cf-notes').value
            }, token);
            div.innerHTML = '<div style="text-align: center; padding: 1rem;"><div style="font-size: 2rem;">✅</div><p>Feedback saved!</p></div>';
            setTimeout(() => div.remove(), 2000);
        } catch (e) { alert('Failed: ' + e.message); }
    });
}

async function loadStudentFeedback(token) {
    const listEl = document.getElementById('student-feedback-list');
    if (!listEl) return;

    try {
        const feedback = await apiGet('/api/feedback/all', token);

        if (!feedback || feedback.length === 0) {
            listEl.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem; color: rgba(255,255,255,0.4);">
                    <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📝</div>
                    <p style="margin: 0;">No student feedback yet. Feedback will appear here after sessions.</p>
                </div>`;
            return;
        }

        listEl.innerHTML = feedback.map(fb => {
            const stars = '⭐'.repeat(fb.rating || 0) + '<span style="opacity:0.3;">' + '☆'.repeat(5 - (fb.rating || 0)) + '</span>';
            const ratingColor = fb.rating >= 4 ? '#22c55e' : fb.rating >= 3 ? '#f59e0b' : '#ef4444';
            const outcomeLabels = {
                'felt_better': '🙂 Felt Better', 'much_better': '😊 Much Better', 'no_change': '😐 No Change',
                'felt_worse': '😞 Felt Worse', 'neutral': '😐 Neutral', 'resolved': '✅ Resolved',
                'improved': '📈 Improved', 'ongoing': '🔄 Ongoing'
            };
            return `
            <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1rem 1.25rem; margin-bottom: 0.75rem; transition: all 0.2s;"
                 onmouseover="this.style.borderColor='rgba(99,102,241,0.3)';this.style.background='rgba(255,255,255,0.06)'"
                 onmouseout="this.style.borderColor='rgba(255,255,255,0.08)';this.style.background='rgba(255,255,255,0.04)'">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.6rem;">
                  <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.8rem; flex-shrink: 0;">${(fb.display_name || 'S').charAt(0)}</div>
                  <div>
                    <div style="font-weight: 600; font-size: 0.88rem; color: white;">${fb.display_name || 'Student'}</div>
                    <div style="font-size: 0.7rem; color: rgba(255,255,255,0.35);">${new Date(fb.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 0.85rem;">${stars}</div>
                  <div style="font-size: 0.72rem; font-weight: 700; color: ${ratingColor};">${fb.rating}/5</div>
                </div>
              </div>
              ${fb.comment ? `<div style="font-size: 0.85rem; color: rgba(255,255,255,0.7); line-height: 1.5; padding: 0.6rem 0; border-top: 1px solid rgba(255,255,255,0.06);"><em>"${fb.comment}"</em></div>` : ''}
              <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.35rem;">
                ${fb.counselor_name ? `<span style="font-size: 0.68rem; padding: 2px 8px; border-radius: 10px; background: rgba(99,102,241,0.12); color: #a5b4fc;">🩺 ${fb.counselor_name}</span>` : ''}
                ${fb.category ? `<span style="font-size: 0.68rem; padding: 2px 8px; border-radius: 10px; background: rgba(245,158,11,0.12); color: #fbbf24;">📂 ${fb.category}</span>` : ''}
                ${fb.session_type ? `<span style="font-size: 0.68rem; padding: 2px 8px; border-radius: 10px; background: rgba(107,114,128,0.12); color: rgba(255,255,255,0.5);">${fb.session_type}</span>` : ''}
                ${fb.emotional_outcome ? `<span style="font-size: 0.68rem; padding: 2px 8px; border-radius: 10px; background: rgba(34,197,94,0.12); color: #4ade80;">${outcomeLabels[fb.emotional_outcome] || fb.emotional_outcome}</span>` : ''}
              </div>
              ${fb.improvement ? `<div style="font-size: 0.75rem; color: rgba(255,255,255,0.4); margin-top: 0.5rem; padding-top: 0.4rem; border-top: 1px solid rgba(255,255,255,0.04);"><span style="color: #fbbf24;">💡</span> "${fb.improvement}"</div>` : ''}
            </div>`;
        }).join('');
    } catch (err) {
        listEl.innerHTML = `<div style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.4);">Failed to load feedback: ${err.message}</div>`;
    }
}

function sendCounselorMessage() {
    const input = document.getElementById('counselor-msg-input');
    const text = input.value.trim();
    if (!text || !activeSessionId) return;

    socket.emit('send-message', {
        sessionId: activeSessionId,
        senderType: 'counselor',
        content: text
    });
    input.value = '';
}

/* ──────────── AUDIO/VIDEO CALL — WebRTC ──────────── */

let dashCallStream = null;
let dashCallTimer = null;
let dashCallSecs = 0;
let peerConnection = null;

const ICE_SERVERS = { iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
]};

function startDashCall(sessionId, type) {
    const chatArea = document.getElementById('counselor-chat-area');
    
    const overlay = document.createElement('div');
    overlay.id = 'dash-call-overlay';
    overlay.style.cssText = 'position:absolute;inset:0;background:linear-gradient(135deg,#1e293b,#0f172a);border-radius:var(--radius-lg);z-index:100;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.5rem;color:white;';
    
    overlay.innerHTML = `
        <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,var(--primary-400),var(--primary-600));display:flex;align-items:center;justify-content:center;font-size:2rem;animation:call-ring 2s infinite;">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.11 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        </div>
        ${type === 'video' ? '<div style="display:flex;gap:0.75rem;"><video id="dash-local-video" autoplay muted playsinline style="width:160px;height:120px;border-radius:12px;background:#000;border:2px solid rgba(255,255,255,0.2);"></video><video id="dash-remote-video" autoplay playsinline style="width:160px;height:120px;border-radius:12px;background:#000;border:2px solid var(--primary-400);"></video></div>' : '<audio id="dash-remote-audio" autoplay></audio>'}
        <div id="dash-call-status" style="font-size:0.9rem;opacity:0.8;">Ringing...</div>
        <div id="dash-call-timer" style="font-family:var(--font-display);font-size:2.5rem;font-weight:700;">00:00</div>
        <div style="display:flex;gap:1rem;">
            <button id="dash-call-mute" style="width:56px;height:56px;border-radius:50%;border:none;background:rgba(255,255,255,0.15);color:white;cursor:pointer;display:flex;align-items:center;justify-content:center;" title="Mute">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </button>
            ${type === 'video' ? '<button id="dash-call-camera" style="width:56px;height:56px;border-radius:50%;border:none;background:rgba(255,255,255,0.15);color:white;cursor:pointer;display:flex;align-items:center;justify-content:center;" title="Camera"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg></button>' : ''}
            <button id="dash-call-end" style="width:56px;height:56px;border-radius:50%;border:none;background:#ef4444;color:white;cursor:pointer;display:flex;align-items:center;justify-content:center;" title="End Call">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.11 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </button>
        </div>
    `;
    
    chatArea.style.position = 'relative';
    chatArea.appendChild(overlay);
    
    // Setup WebRTC + start media — call-initiate is emitted INSIDE after media is ready
    initWebRTCCall(sessionId, type);
    
    document.getElementById('dash-call-end').addEventListener('click', () => endDashCall(overlay));
    
    let muted = false;
    document.getElementById('dash-call-mute').addEventListener('click', (e) => {
        muted = !muted;
        if (dashCallStream) dashCallStream.getAudioTracks().forEach(t => { t.enabled = !muted; });
        e.currentTarget.style.background = muted ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.15)';
    });
    
    if (type === 'video') {
        let camOff = false;
        document.getElementById('dash-call-camera')?.addEventListener('click', (e) => {
            camOff = !camOff;
            if (dashCallStream) dashCallStream.getVideoTracks().forEach(t => { t.enabled = !camOff; });
            e.currentTarget.style.background = camOff ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.15)';
        });
    }
}

async function initWebRTCCall(sessionId, type) {
    const statusEl = document.getElementById('dash-call-status');
    try {
        const constraints = { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } };
        if (type === 'video') constraints.video = { width: 640, height: 480, facingMode: 'user' };
        
        dashCallStream = await navigator.mediaDevices.getUserMedia(constraints);
        statusEl.textContent = 'Ringing student...';
        
        if (type === 'video') {
            const localVid = document.getElementById('dash-local-video');
            if (localVid) localVid.srcObject = dashCallStream;
        }
        
        // Create peer connection
        peerConnection = new RTCPeerConnection(ICE_SERVERS);
        
        // Add local tracks
        dashCallStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, dashCallStream);
        });
        
        // Handle remote stream
        peerConnection.ontrack = (event) => {
            if (type === 'video') {
                const remoteVid = document.getElementById('dash-remote-video');
                if (remoteVid) remoteVid.srcObject = event.streams[0];
            } else {
                const remoteAudio = document.getElementById('dash-remote-audio');
                if (remoteAudio) remoteAudio.srcObject = event.streams[0];
            }
            statusEl.textContent = '✅ Connected — Call Active';
            startCallTimer();
        };
        
        // ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('webrtc-ice-candidate', { sessionId, candidate: event.candidate });
            }
        };
        
        // Listen for ICE candidates from remote
        socket.on('webrtc-ice-candidate', async (data) => {
            if (peerConnection && data.candidate) {
                try { await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch(e) {}
            }
        });

        // Listen for answer from student
        socket.on('webrtc-answer', async (data) => {
            if (peerConnection && data.answer) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            }
        });

        // WAIT for student to accept — THEN create and send the offer
        // This ensures the student's WebRTC listeners are ready before the offer arrives
        socket.on('call-accepted', async () => {
            statusEl.textContent = '📞 Student accepted — connecting...';
            try {
                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);
                socket.emit('webrtc-offer', { sessionId, offer });
            } catch (err) {
                statusEl.textContent = '⚠️ Failed to create call offer.';
                console.error('[CALL] Offer creation failed:', err);
            }
        });

        // NOW notify the student — everything is ready on counselor side
        console.log('[CALL] Media ready, notifying student...');
        socket.emit('call-initiate', { sessionId, type, counselorId: currentCounselor.id, counselorName: currentCounselor.name });
        
    } catch (err) {
        statusEl.textContent = '⚠️ ' + (type === 'video' ? 'Camera/mic' : 'Microphone') + ' access denied. Check browser permissions.';
    }
}

function startCallTimer() {
    dashCallSecs = 0;
    dashCallTimer = setInterval(() => {
        dashCallSecs++;
        const el = document.getElementById('dash-call-timer');
        if (el) el.textContent = `${String(Math.floor(dashCallSecs/60)).padStart(2,'0')}:${String(dashCallSecs%60).padStart(2,'0')}`;
    }, 1000);
}

function endDashCall(overlay) {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    if (dashCallStream) {
        dashCallStream.getTracks().forEach(t => t.stop());
        dashCallStream = null;
    }
    if (dashCallTimer) {
        clearInterval(dashCallTimer);
        dashCallTimer = null;
    }
    // Clean up socket listeners
    socket.off('webrtc-answer');
    socket.off('webrtc-ice-candidate');
    socket.off('call-accepted');
    if (overlay) overlay.remove();
    socket.emit('call-end', { sessionId: activeSessionId });
}
