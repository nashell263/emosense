/**
 * EmoSense Counselor Selection Page
 * Students browse counselor profiles and start anonymous chat
 */

import { apiGet, apiPost, getSocketUrl } from '../api.js';
import { io } from 'socket.io-client';

export function renderCounselors(container) {
    container.innerHTML = `
    <div class="container" style="padding: var(--space-3xl) 0;">
      <div class="text-center animate-slide-up" style="margin-bottom: var(--space-2xl);">
        <span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 18px; background: var(--primary-50); color: var(--primary-700); font-size: 0.8125rem; font-weight: 500; border-radius: var(--radius-full); border: 1px solid var(--primary-200); margin-bottom: var(--space-lg);">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Live Counseling
        </span>
        <h1 style="font-size: 2.25rem; margin-bottom: var(--space-sm);">Talk to a Counselor</h1>
        <p style="color: var(--text-secondary); max-width: 600px; margin: 0 auto;">
          Choose a counselor to have a private, anonymous conversation. You don't need to log in — your identity remains completely private.
        </p>
      </div>

      <!-- How it works -->
      <div class="animate-slide-up-delay-1" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-lg); margin-bottom: var(--space-3xl); max-width: 700px; margin-left: auto; margin-right: auto; margin-bottom: var(--space-3xl);">
        <div style="text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--primary-50); color: var(--primary-600); display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-sm); font-weight: 700; font-family: var(--font-display);">1</div>
          <p style="font-size: 0.8125rem; color: var(--text-secondary);">Choose a counselor</p>
        </div>
        <div style="text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--primary-50); color: var(--primary-600); display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-sm); font-weight: 700; font-family: var(--font-display);">2</div>
          <p style="font-size: 0.8125rem; color: var(--text-secondary);">You stay anonymous</p>
        </div>
        <div style="text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--primary-50); color: var(--primary-600); display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-sm); font-weight: 700; font-family: var(--font-display);">3</div>
          <p style="font-size: 0.8125rem; color: var(--text-secondary);">Chat in real-time</p>
        </div>
      </div>

      <!-- Counselor Cards -->
      <div id="counselor-grid" class="counselor-grid animate-slide-up-delay-2">
        <div style="text-align: center; padding: var(--space-3xl); color: var(--text-muted);">
          Loading counselors...
        </div>
      </div>
    </div>

    <footer class="footer">
      <div class="container footer-inner">
        <div class="footer-brand">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-600)" stroke-width="1.5"><path d="M12 2C9 2 7 4 7 6.5c0 1 .3 1.8.8 2.5C6.3 9.8 5 11.3 5 13c0 1.5.8 2.8 2 3.5-.2.5-.3 1-.3 1.5 0 2.2 1.8 4 4 4h2.6c2.2 0 4-1.8 4-4 0-.5-.1-1-.3-1.5 1.2-.7 2-2 2-3.5 0-1.7-1.3-3.2-2.8-3.9.5-.7.8-1.5.8-2.6C17 4 15 2 12 2z"/></svg>
          EmoSense <span>– Confidential & Anonymous</span>
        </div>
        <div class="footer-disclaimer">Your identity is never shared with counselors.</div>
      </div>
    </footer>
  `;

    loadCounselors(container);
}

async function loadCounselors(pageContainer) {
    const grid = document.getElementById('counselor-grid');

    try {
        const counselors = await apiGet('/api/counselors');

        if (counselors.length === 0) {
            grid.innerHTML = `<div style="text-align: center; padding: var(--space-3xl); color: var(--text-muted);">No counselors available at this time.</div>`;
            return;
        }

        grid.innerHTML = counselors.map(c => `
      <div class="counselor-card" data-id="${c.id}">
        <div class="counselor-card-photo">
          <img src="${c.photo || '/counselors/counselor-1.png'}" alt="${c.name}" />
          <span class="counselor-status ${c.is_online ? 'online' : 'offline'}">
            ${c.is_online ? '🟢 Online' : '⚪ Offline'}
          </span>
          <span class="counselor-gender-badge">${c.gender === 'female' ? '♀ Female' : '♂ Male'}</span>
        </div>
        <div class="counselor-card-body">
          <h3>${c.name}</h3>
          <p class="counselor-specialization">${c.specialization}</p>
          <p class="counselor-bio">${c.bio}</p>
          <div class="counselor-schedule">
            <strong>Available:</strong>
            ${c.schedule.length > 0
                ? c.schedule.map(s => `<span class="schedule-tag">${s.day_of_week} ${s.start_time}–${s.end_time}</span>`).join('')
                : '<span style="color: var(--text-muted);">Schedule not set</span>'}
          </div>
          <button class="btn btn-primary btn-start-chat" data-id="${c.id}" data-name="${c.name}" ${!c.is_online ? 'disabled title="Counselor is offline"' : ''}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            ${c.is_online ? 'Start Anonymous Chat' : 'Offline — Not Available'}
          </button>
        </div>
      </div>
    `).join('');

        // Start chat handlers
        grid.querySelectorAll('.btn-start-chat').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.disabled) return;
                startChatWithCounselor(btn.dataset.id, btn.dataset.name, pageContainer);
            });
        });
    } catch (err) {
        grid.innerHTML = `<div style="text-align: center; padding: var(--space-3xl); color: var(--red-500);">
      Failed to load counselors. Make sure the server is running (npm run dev).
    </div>`;
        console.error(err);
    }
}

async function startChatWithCounselor(counselorId, counselorName, pageContainer) {
    try {
        const { sessionId, alias } = await apiPost('/api/sessions', { counselorId: parseInt(counselorId) });

        // Switch to live chat view
        renderLiveChat(pageContainer, {
            sessionId,
            alias,
            counselorId: parseInt(counselorId),
            counselorName
        });
    } catch (err) {
        alert('Failed to start chat session: ' + err.message);
    }
}

function renderLiveChat(container, { sessionId, alias, counselorId, counselorName }) {
    const socket = io(getSocketUrl());

    container.innerHTML = `
    <div class="live-chat-layout">
      <div class="live-chat-main">
        <div class="live-chat-header">
          <div style="display: flex; align-items: center; gap: var(--space-md);">
            <button class="btn-back" id="live-chat-back">← Back</button>
            <div>
              <h2>Chat with ${counselorName}</h2>
              <p style="font-size: 0.75rem; color: var(--text-muted);">You are: <strong>${alias}</strong> (anonymous)</p>
            </div>
          </div>
          <div class="live-chat-status" id="live-chat-status">
            <span class="status-dot waiting"></span> Waiting for counselor...
          </div>
        </div>

        <div class="live-chat-messages" id="live-chat-messages">
          <div class="system-message">
            <p>🔒 Your identity is completely anonymous. The counselor only sees your alias: <strong>${alias}</strong></p>
            <p>Waiting for ${counselorName} to accept your chat request...</p>
          </div>
        </div>

        <div class="live-chat-input-area" id="live-chat-input-area" style="display: none;">
          <div class="chat-input-wrapper">
            <input type="text" class="chat-input" id="live-chat-input" placeholder="Type your message..." autocomplete="off" />
            <button class="chat-send-btn" id="live-chat-send">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-sm);">
            <span style="font-size: 0.6875rem; color: var(--text-muted);">Your identity is protected. The counselor cannot see who you are.</span>
            <button class="btn btn-sm" style="background: var(--red-50); color: var(--red-600); border: 1px solid var(--red-100);" id="end-session-btn">End Chat</button>
          </div>
        </div>
      </div>
    </div>
  `;

    // Connect to socket room
    socket.emit('student-request-chat', { sessionId, counselorId, alias });

    const messagesEl = document.getElementById('live-chat-messages');
    const inputArea = document.getElementById('live-chat-input-area');
    const input = document.getElementById('live-chat-input');
    const sendBtn = document.getElementById('live-chat-send');
    const statusEl = document.getElementById('live-chat-status');

    // Chat accepted
    socket.on('chat-accepted', () => {
        statusEl.innerHTML = '<span class="status-dot active"></span> Connected';
        inputArea.style.display = 'block';
        appendSystemMessage(messagesEl, `✅ ${counselorName} has joined the chat. You can start talking now.`);
        input.focus();
    });

    // New message
    socket.on('new-message', (data) => {
        if (data.sessionId === sessionId) {
            appendLiveMessage(messagesEl, data.senderType, data.content, data.timestamp);
        }
    });

    // Session ended
    socket.on('session-ended', () => {
        statusEl.innerHTML = '<span class="status-dot ended"></span> Session ended';
        inputArea.style.display = 'none';
        appendSystemMessage(messagesEl, '🏁 This session has ended. Thank you for reaching out.');

        // Show feedback form
        showFeedbackPrompt(messagesEl, sessionId, 'counselor');
    });

    // Send message
    const sendMessage = () => {
        const text = input.value.trim();
        if (!text) return;
        socket.emit('send-message', { sessionId, senderType: 'student', content: text });
        input.value = '';
    };

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // End session
    document.getElementById('end-session-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to end this session?')) {
            socket.emit('end-session', { sessionId });
        }
    });

    // Back button
    document.getElementById('live-chat-back').addEventListener('click', () => {
        socket.disconnect();
        renderCounselors(container);
    });
}

function appendLiveMessage(container, senderType, content, timestamp) {
    const div = document.createElement('div');
    div.className = `live-msg ${senderType}`;
    const time = new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = `
    <div class="live-msg-bubble ${senderType}">${content}</div>
    <div class="live-msg-meta">${senderType === 'student' ? 'You' : 'Counselor'} · ${time}</div>
  `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function appendSystemMessage(container, text) {
    const div = document.createElement('div');
    div.className = 'system-message';
    div.innerHTML = `<p>${text}</p>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function showFeedbackPrompt(container, sessionId, type) {
    const div = document.createElement('div');
    div.className = 'feedback-prompt';
    div.innerHTML = `
    <h4>How was your experience?</h4>
    <div class="feedback-stars" id="feedback-stars">
      ${[1, 2, 3, 4, 5].map(i => `<button class="star-btn" data-rating="${i}">⭐</button>`).join('')}
    </div>
    <textarea id="feedback-comment" placeholder="Any additional comments? (optional)" rows="2"></textarea>
    <button class="btn btn-primary btn-sm" id="submit-feedback">Submit Feedback</button>
  `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;

    let selectedRating = 0;
    div.querySelectorAll('.star-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedRating = parseInt(btn.dataset.rating);
            div.querySelectorAll('.star-btn').forEach((b, i) => {
                b.style.opacity = i < selectedRating ? '1' : '0.3';
            });
        });
    });

    document.getElementById('submit-feedback').addEventListener('click', async () => {
        if (selectedRating === 0) return alert('Please select a rating');
        try {
            await apiPost('/api/feedback', {
                sessionType: type,
                sessionId,
                rating: selectedRating,
                helpful: selectedRating >= 4,
                comment: document.getElementById('feedback-comment').value.trim()
            });
            div.innerHTML = '<p style="color: var(--primary-600); font-weight: 600;">✅ Thank you for your feedback!</p>';
        } catch (err) {
            console.error(err);
        }
    });
}
