/**
 * EmoSense Counselor Selection Page — v2
 * Triage-first entry → smart matching → queue management → live chat
 */

import { apiGet, apiPost, getSocketUrl } from '../api.js';
import { io } from 'socket.io-client';

let currentSocket = null;

export function renderCounselors(container) {
    container.innerHTML = `
    <div class="container" style="padding: var(--space-3xl) 0;">
      <div class="text-center animate-slide-up" style="margin-bottom: var(--space-2xl);">
        <span class="badge">Live Counseling</span>
        <h1 style="font-size: 2.25rem; margin-bottom: var(--space-sm);">Support Triage</h1>
        <p style="color: var(--text-secondary); max-width: 600px; margin: 0 auto;">
          Complete this short intake so we can match you with the right counselor quickly and safely.
        </p>
      </div>

      <!-- Privacy & Consent Notice -->
      <div class="animate-slide-up" style="max-width: 600px; margin: 0 auto var(--space-lg); background: var(--primary-50); padding: 1rem 1.5rem; border-radius: var(--radius-md); border-left: 4px solid var(--primary-500); font-size: 0.875rem; color: var(--text-secondary);">
        <strong style="color: var(--primary-700);">🔒 Privacy Notice:</strong>
        Your identity is anonymous. Counselors will only see a randomly generated alias. Chat data is encrypted and used only for support purposes. You may reveal your identity later if you choose to.
      </div>

      <!-- Triage Form -->
      <div id="triage-form-container" class="animate-slide-up-delay-1" style="max-width: 600px; margin: 0 auto; background: white; padding: 2rem; border-radius: var(--radius-lg); box-shadow: var(--shadow-md);">
        <form id="triage-form">
          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">What kind of help do you need?</label>
            <select id="triage-issue" class="form-control" style="width: 100%; padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--gray-300);" required>
              <option value="">Select an issue...</option>
              <option value="stress">Academic Stress / Burnout</option>
              <option value="anxiety">Anxiety / Overwhelm</option>
              <option value="depression">Low Mood / Depression</option>
              <option value="relationship">Relationship / Family</option>
              <option value="financial">Financial Stress</option>
              <option value="other">Other General Support</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">How urgent is this? (1 = Not urgent, 5 = Immediate help needed)</label>
            <input type="range" id="triage-urgency" min="1" max="5" value="3" style="width: 100%;">
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted);">
              <span>1 — Low</span><span>2</span><span>3</span><span>4</span><span>5 — Crisis</span>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Do you feel safe right now?</label>
            <div style="display: flex; gap: 1rem;">
              <label><input type="radio" name="triage-safe" value="yes" checked> Yes</label>
              <label style="color: var(--red-600);"><input type="radio" name="triage-safe" value="no"> No, I need urgent help</label>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Preferred communication</label>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
              <label><input type="radio" name="triage-mode" value="chat" checked> 💬 Text Chat</label>
              <label><input type="radio" name="triage-mode" value="voice"> 🎙️ Voice</label>
              <label><input type="radio" name="triage-mode" value="video"> 📹 Video</label>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Counselor gender preference (optional)</label>
            <div style="display: flex; gap: 1rem;">
              <label><input type="radio" name="triage-gender" value=""> No preference</label>
              <label><input type="radio" name="triage-gender" value="female"> Female</label>
              <label><input type="radio" name="triage-gender" value="male"> Male</label>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Briefly describe what's going on (optional)</label>
            <textarea id="triage-description" class="form-control" placeholder="e.g. I've been struggling with exam pressure and can't sleep..." rows="3" style="width: 100%; padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--gray-300);"></textarea>
          </div>

          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem;">
              <input type="checkbox" id="triage-consent" required>
              <span style="font-size: 0.85rem;">I understand this is supplementary support and consent to anonymous data use for improving services.</span>
            </label>
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; padding: 1rem; font-size: 1.1rem;">Find My Counselor</button>
        </form>
      </div>

      <!-- Queue Status -->
      <div id="queue-status" style="display: none; max-width: 600px; margin: 2rem auto;"></div>

      <!-- Match Results -->
      <div id="match-results" style="display: none; max-width: 800px; margin: 0 auto;">
         <h2 style="text-align: center; margin-bottom: 1rem;">Available Counselors</h2>
         <p style="text-align: center; color: var(--text-muted); margin-bottom: 2rem;">Matched based on your needs, urgency, and counselor availability.</p>
         <div id="counselor-grid" class="counselor-grid"></div>
      </div>

      <!-- No Counselors Fallback -->
      <div id="no-counselors" style="display: none; max-width: 600px; margin: 2rem auto;"></div>
    </div>
  `;

    document.getElementById('triage-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const isSafe = document.querySelector('input[name="triage-safe"]:checked').value === 'yes';

        if (!isSafe) {
            document.getElementById('triage-form-container').innerHTML = `
                <div style="text-align: center; color: var(--red-600);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🚨</div>
                    <h2>Emergency Support Activated</h2>
                    <p>Your safety is our top priority. We are routing you to emergency support immediately.</p>
                    <button class="btn btn-primary" onclick="window.location.hash='#emergency'" style="background: var(--red-600); border-color: var(--red-600); margin-top: 1rem;">Go to Emergency Support</button>
                    <p style="margin-top: 1rem; font-size: 0.85rem; color: var(--text-secondary);">You can also call: <strong>999 / 112</strong> or <strong>Befrienders Zimbabwe: +263 4 790 652</strong></p>
                </div>
            `;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Finding the best match...';

        try {
            const result = await apiPost('/api/triage/submit', {
                issueType: document.getElementById('triage-issue').value,
                urgency: document.getElementById('triage-urgency').value,
                isSafe,
                isAnonymous: true,
                preferredGender: document.querySelector('input[name="triage-gender"]:checked')?.value || '',
                preferredMode: document.querySelector('input[name="triage-mode"]:checked')?.value || 'chat',
                description: document.getElementById('triage-description')?.value || ''
            });

            document.getElementById('triage-form-container').style.display = 'none';

            if (result.noCounselorsAvailable) {
                showNoCounselors(container, result);
            } else {
                showMatchResults(container, result);
            }
        } catch (err) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Find My Counselor';
            alert('Error: ' + err.message);
        }
    });
}

function showNoCounselors(pageContainer, triageResult) {
    const el = document.getElementById('no-counselors');
    el.style.display = 'block';
    el.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: var(--radius-lg); box-shadow: var(--shadow-md); text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">⏳</div>
            <h2>No Counselors Available Right Now</h2>
            <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">All counselors are currently offline or busy. Here's what you can do:</p>
            <div style="display: grid; gap: 1rem; text-align: left;">
                <a href="#chat" class="btn btn-primary" style="width: 100%; justify-content: center;">💬 Chat with AI Support (Available 24/7)</a>
                <a href="#resources" class="btn btn-outline" style="width: 100%; justify-content: center;">📚 Browse Self-Help Resources</a>
                <a href="#voice-rooms" class="btn btn-outline" style="width: 100%; justify-content: center;">🎙️ Join a Safe Space Voice Room</a>
            </div>
            <div style="margin-top: 1.5rem; padding: 1rem; background: var(--red-50); border-radius: var(--radius-md);">
                <strong style="color: var(--red-700);">Crisis?</strong>
                <p style="font-size: 0.85rem; color: var(--red-600); margin: 0.25rem 0 0;">MSU Counseling: Student Affairs | Emergency: 999/112 | Befrienders: +263 4 790 652</p>
            </div>
        </div>
    `;
}

function showMatchResults(pageContainer, triageResult) {
    document.getElementById('match-results').style.display = 'block';

    // Show queue info
    const queueEl = document.getElementById('queue-status');
    if (triageResult.queue) {
        queueEl.style.display = 'block';
        queueEl.innerHTML = `
            <div style="background: var(--primary-50); padding: 1rem 1.5rem; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <div><strong>Your alias:</strong> ${triageResult.alias}</div>
                <div><strong>Priority:</strong> ${'🔴'.repeat(Math.min(5, triageResult.priority))}${'⚪'.repeat(5 - Math.min(5, triageResult.priority))}</div>
                <div><strong>Est. wait:</strong> ~${triageResult.queue.estimatedWaitMinutes} min</div>
            </div>
        `;
    }

    const grid = document.getElementById('counselor-grid');
    const counselors = triageResult.availableCounselors || [];

    if (counselors.length === 0) {
        grid.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No matching counselors found.</div>';
        return;
    }

    grid.innerHTML = counselors.map((c, i) => `
      <div class="counselor-card" data-id="${c.id}" style="${i === 0 ? 'border: 2px solid var(--primary-500); box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);' : ''} position: relative;">
        ${i === 0 ? '<div style="position: absolute; top: -12px; right: -12px; background: var(--primary-600); color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: bold;">Best Match</div>' : ''}
        <div class="counselor-card-photo">
          <img src="/counselors/counselor-${(c.id % 3) + 1}.png" alt="${c.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMSI+PGNpcmNsZSBjeD0iMTIiIGN5PSI4IiByPSI1Ii8+PHBhdGggZD0iTTMgMjF2LTJhNyA3IDAgMCAxIDE0IDB2MiIvPjwvc3ZnPg=='" />
          <span class="counselor-status online">🟢 Online</span>
        </div>
        <div class="counselor-card-body">
          <h3>${c.name}</h3>
          <p class="counselor-specialization">${c.specialization}</p>
          ${c.matchScore ? `<div style="font-size: 0.75rem; color: var(--primary-600); margin-bottom: 0.5rem;">Match score: ${Math.min(100, Math.max(0, c.matchScore))}%</div>` : ''}
          <button class="btn btn-primary btn-start-chat" data-id="${c.id}" data-name="${c.name}" data-session="${triageResult.sessionId}" data-alias="${triageResult.alias}" style="width: 100%; margin-top: 0.5rem;">
            Start Chat
          </button>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.btn-start-chat').forEach(btn => {
        btn.addEventListener('click', () => {
            renderLiveChat(pageContainer, {
                sessionId: btn.dataset.session,
                alias: btn.dataset.alias,
                counselorId: parseInt(btn.dataset.id),
                counselorName: btn.dataset.name
            });
        });
    });
}

function renderLiveChat(container, { sessionId, alias, counselorId, counselorName }) {
    if (currentSocket) currentSocket.disconnect();
    currentSocket = io(getSocketUrl());

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
            <span style="font-size: 0.6875rem; color: var(--text-muted);">Your identity is protected.</span>
            <button class="btn btn-sm" style="background: var(--red-50); color: var(--red-600); border: 1px solid var(--red-100);" id="end-session-btn">End Chat</button>
          </div>
        </div>
      </div>
    </div>
  `;

    const socket = currentSocket;
    socket.emit('student-request-chat', { sessionId, counselorId, alias });

    const messagesEl = document.getElementById('live-chat-messages');
    const inputArea = document.getElementById('live-chat-input-area');
    const input = document.getElementById('live-chat-input');
    const sendBtn = document.getElementById('live-chat-send');
    const statusEl = document.getElementById('live-chat-status');

    socket.on('chat-accepted', () => {
        statusEl.innerHTML = '<span class="status-dot active"></span> Connected';
        inputArea.style.display = 'block';
        appendSystemMessage(messagesEl, `✅ ${counselorName} has joined the chat. You can start talking now.`);
        input.focus();
    });

    socket.on('new-message', (data) => {
        if (data.sessionId === sessionId) {
            appendLiveMessage(messagesEl, data.senderType, data.content, data.timestamp);
        }
    });

    socket.on('session-ended', () => {
        statusEl.innerHTML = '<span class="status-dot ended"></span> Session ended';
        inputArea.style.display = 'none';
        appendSystemMessage(messagesEl, '🏁 This session has ended. Thank you for reaching out.');
        showFeedbackPrompt(messagesEl, sessionId, 'counselor');
    });

    const sendMessage = () => {
        const text = input.value.trim();
        if (!text) return;
        socket.emit('send-message', { sessionId, senderType: 'student', content: text });
        input.value = '';
    };

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });

    document.getElementById('end-session-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to end this session?')) {
            socket.emit('end-session', { sessionId });
        }
    });

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
    <div class="feedback-stars" style="margin-bottom: 1rem;">
      ${[1, 2, 3, 4, 5].map(i => `<button class="star-btn" data-rating="${i}" style="font-size: 1.5rem; border: none; background: none; cursor: pointer; opacity: 0.3;">⭐</button>`).join('')}
    </div>

    <div style="margin-bottom: 1rem;">
       <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.5rem;">How do you feel after this session?</label>
       <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;" id="outcome-btns">
            <button class="btn btn-sm btn-outline fb-outcome" data-outcome="better">😊 Better</button>
            <button class="btn btn-sm btn-outline fb-outcome" data-outcome="slightly_better">🙂 Slightly better</button>
            <button class="btn btn-sm btn-outline fb-outcome" data-outcome="no_change">😐 No change</button>
            <button class="btn btn-sm btn-outline fb-outcome" data-outcome="worse">😔 Worse</button>
       </div>
    </div>

    <textarea id="feedback-comment" class="form-control" placeholder="Any additional comments? (optional)" rows="2" style="width: 100%; margin-bottom: 1rem;"></textarea>
    <button class="btn btn-primary" id="submit-feedback" style="width: 100%;">Submit Feedback</button>
  `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;

    let selectedRating = 0;
    let selectedOutcome = '';

    div.querySelectorAll('.star-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedRating = parseInt(btn.dataset.rating);
            div.querySelectorAll('.star-btn').forEach((b, i) => { b.style.opacity = i < selectedRating ? '1' : '0.3'; });
        });
    });

    div.querySelectorAll('.fb-outcome').forEach(btn => {
        btn.addEventListener('click', () => {
            div.querySelectorAll('.fb-outcome').forEach(b => { b.classList.remove('btn-primary'); b.classList.add('btn-outline'); });
            btn.classList.remove('btn-outline'); btn.classList.add('btn-primary');
            selectedOutcome = btn.dataset.outcome;
        });
    });

    document.getElementById('submit-feedback').addEventListener('click', async () => {
        if (selectedRating === 0) return alert('Please select a rating');
        try {
            await apiPost('/api/feedback', {
                sessionType: type, sessionId, rating: selectedRating,
                category: 'counselor', helpful: selectedRating >= 4,
                comment: document.getElementById('feedback-comment').value.trim(),
                emotional_outcome: selectedOutcome
            });
            div.innerHTML = `<div style="text-align: center; padding: 1rem;"><div style="font-size: 2rem; margin-bottom: 0.5rem;">✅</div><h4 style="color: var(--primary-700);">Thank you for your feedback!</h4></div>`;
        } catch (err) { alert('Failed to submit feedback.'); }
    });
}
