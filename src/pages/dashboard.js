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
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary-600)" stroke-width="1.5"><path d="M12 2C9 2 7 4 7 6.5c0 1 .3 1.8.8 2.5C6.3 9.8 5 11.3 5 13c0 1.5.8 2.8 2 3.5-.2.5-.3 1-.3 1.5 0 2.2 1.8 4 4 4h2.6c2.2 0 4-1.8 4-4 0-.5-.1-1-.3-1.5 1.2-.7 2-2 2-3.5 0-1.7-1.3-3.2-2.8-3.9.5-.7.8-1.5.8-2.6C17 4 15 2 12 2z"/></svg>
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
          <strong>Demo accounts:</strong><br>
          tendai.moyo@msu.ac.zw / counselor123<br>
          tatenda.chirwa@msu.ac.zw / counselor123<br>
          rutendo.mhaka@msu.ac.zw / counselor123
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
          <img src="${counselor.photo || '/counselors/counselor-1.png'}" alt="${counselor.name}" class="profile-img" />
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
          <div id="active-sessions-list">
            ${activeSessions.length === 0
            ? '<div class="empty-state"><p>No active sessions. Students will appear here when they request to chat with you.</p></div>'
            : activeSessions.map(s => `
                <div class="session-item ${s.status}" data-session="${s.id}">
                  <div class="session-info">
                    <strong>${s.student_alias}</strong>
                    <span class="session-status-badge ${s.status}">${s.status}</span>
                  </div>
                  <div class="session-actions">
                    ${s.status === 'waiting'
                    ? `<button class="btn btn-primary btn-sm accept-btn" data-session="${s.id}">Accept</button>`
                    : `<button class="btn btn-outline btn-sm open-chat-btn" data-session="${s.id}">Open Chat</button>`}
                  </div>
                </div>
              `).join('')}
          </div>

          <!-- Inline chat area -->
          <div id="counselor-chat-area" style="display: none;">
            <div class="counselor-chat-header" id="counselor-chat-header"></div>
            <div class="counselor-chat-messages" id="counselor-chat-messages"></div>
            <div class="counselor-chat-input">
              <div class="chat-input-wrapper">
                <input type="text" class="chat-input" id="counselor-msg-input" placeholder="Type your response..." />
                <button class="chat-send-btn" id="counselor-msg-send">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
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
}

function connectSocket(container, token) {
    if (socket) socket.disconnect();
    socket = io(getSocketUrl());

    socket.on('connect', () => {
        socket.emit('counselor-online', { counselorId: currentCounselor.id });
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
    header.innerHTML = `<strong>Chat Session: ${sessionId.slice(0, 15)}...</strong>
    <button class="btn btn-sm" style="background: var(--red-50); color: var(--red-600); border: 1px solid var(--red-100);" id="end-counselor-session">End Session</button>`;

    document.getElementById('end-counselor-session').addEventListener('click', () => {
        socket.emit('end-session', { sessionId });
        chatArea.style.display = 'none';
        activeSessionId = null;
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
    } catch (err) {
        console.error(err);
    }

    // Join socket room
    socket.emit('counselor-accept-chat', { sessionId });
    document.getElementById('counselor-msg-input').focus();
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
