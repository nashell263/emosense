/**
 * EmoSense Counselor Selection Page — v3
 * Shows live counselor status + simplified triage → smart matching → live chat
 */

import { apiGet, apiPost, getSocketUrl } from '../api.js';
import { io } from 'socket.io-client';

let currentSocket = null;
let statusInterval = null;

export function renderCounselors(container) {
    container.innerHTML = `
    <div class="container" style="padding: 2rem 0 3rem;">
      <div class="text-center animate-slide-up" style="margin-bottom: 2rem;">
        <span style="display: inline-block; background: rgba(99,102,241,0.15); color: #818cf8; padding: 4px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; margin-bottom: 0.75rem;">Live Counseling</span>
        <h1 style="font-size: 2rem; margin-bottom: 0.5rem; color: white;">Support Triage</h1>
        <p style="color: rgba(255,255,255,0.5); max-width: 500px; margin: 0 auto; font-size: 0.9rem;">
          See who's available and get matched with the right counselor.
        </p>
      </div>

      <!-- Live Counselor Status Cards -->
      <div id="live-counselor-cards" style="max-width: 700px; margin: 0 auto 2rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: #22c55e; animation: pulse-dot 2s infinite;"></span>
          <span style="font-size: 0.85rem; color: rgba(255,255,255,0.6);">Live Counselor Status</span>
        </div>
        <div id="counselor-status-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
          <div style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.3); font-size: 0.85rem;">Loading counselors...</div>
        </div>
      </div>

      <!-- Simplified Triage Form -->
      <div id="triage-form-container" class="animate-slide-up-delay-1" style="max-width: 550px; margin: 0 auto; background: rgba(255,255,255,0.04); padding: 2rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(20px);">
        
        <div style="margin-bottom: 1.5rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
            <span style="font-size: 1.2rem;">🔒</span>
            <span style="font-size: 0.8rem; color: rgba(255,255,255,0.5);">Your identity stays anonymous. Counselors only see a random alias.</span>
          </div>
        </div>

        <form id="triage-form">
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: white; font-size: 0.9rem;">What do you need help with?</label>
            <select id="triage-issue" style="width: 100%; padding: 0.75rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: white; font-size: 0.9rem; font-family: inherit;" required>
              <option value="" style="background: #1e293b;">Select an issue...</option>
              <option value="stress" style="background: #1e293b;">Academic Stress / Burnout</option>
              <option value="anxiety" style="background: #1e293b;">Anxiety / Overwhelm</option>
              <option value="depression" style="background: #1e293b;">Low Mood / Depression</option>
              <option value="relationship" style="background: #1e293b;">Relationship / Family</option>
              <option value="financial" style="background: #1e293b;">Financial Stress</option>
              <option value="other" style="background: #1e293b;">Other General Support</option>
            </select>
          </div>

          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: white; font-size: 0.9rem;">Counselor preference</label>
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
              <label style="display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 10px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); cursor: pointer; font-size: 0.85rem; color: rgba(255,255,255,0.8); transition: all 0.2s;">
                <input type="radio" name="triage-gender" value="" checked style="accent-color: #6366f1;"> No preference
              </label>
              <label style="display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 10px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); cursor: pointer; font-size: 0.85rem; color: rgba(255,255,255,0.8); transition: all 0.2s;">
                <input type="radio" name="triage-gender" value="female" style="accent-color: #6366f1;"> Female
              </label>
              <label style="display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 10px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); cursor: pointer; font-size: 0.85rem; color: rgba(255,255,255,0.8); transition: all 0.2s;">
                <input type="radio" name="triage-gender" value="male" style="accent-color: #6366f1;"> Male
              </label>
            </div>
          </div>

          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: white; font-size: 0.9rem;">Brief description <span style="color: rgba(255,255,255,0.3); font-weight: 400;">(optional)</span></label>
            <textarea id="triage-description" placeholder="e.g. I've been struggling with exam pressure..." rows="2" style="width: 100%; padding: 0.75rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: white; font-size: 0.9rem; font-family: inherit; resize: vertical;"></textarea>
          </div>

          <div style="margin-bottom: 1.25rem;">
            <label style="display: flex; align-items: flex-start; gap: 0.5rem; cursor: pointer;">
              <input type="checkbox" id="triage-consent" required style="accent-color: #6366f1; margin-top: 3px;">
              <span style="font-size: 0.8rem; color: rgba(255,255,255,0.5);">I consent to anonymous support and data use for improving services.</span>
            </label>
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.85rem; font-size: 1rem; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; border-radius: 12px; color: white; font-weight: 600; cursor: pointer;">Find My Counselor</button>
        </form>
      </div>

      <!-- Queue Status -->
      <div id="queue-status" style="display: none; max-width: 600px; margin: 2rem auto;"></div>

      <!-- Match Results -->
      <div id="match-results" style="display: none; max-width: 800px; margin: 0 auto;">
         <h2 style="text-align: center; margin-bottom: 0.5rem; color: white;">Available Counselors</h2>
         <p style="text-align: center; color: rgba(255,255,255,0.4); margin-bottom: 2rem; font-size: 0.9rem;">Matched based on your needs and counselor availability.</p>
         <div id="counselor-grid" class="counselor-grid"></div>
      </div>

      <!-- No Counselors Fallback -->
      <div id="no-counselors" style="display: none; max-width: 600px; margin: 2rem auto;"></div>
    </div>
  `;

    // Load live counselor statuses
    loadCounselorStatuses();
    statusInterval = setInterval(loadCounselorStatuses, 10000); // Refresh every 10s

    document.getElementById('triage-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        // Clear status polling
        if (statusInterval) clearInterval(statusInterval);

        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Finding the best match...';

        try {
            const result = await apiPost('/api/triage/submit', {
                issueType: document.getElementById('triage-issue').value,
                urgency: 3,
                isSafe: true,
                isAnonymous: true,
                preferredGender: document.querySelector('input[name="triage-gender"]:checked')?.value || '',
                preferredMode: 'chat',
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

    // Check for SOS redirect — if a counselor accepted the student's SOS, auto-start live chat
    const sosRedirect = sessionStorage.getItem('sos_redirect');
    if (sosRedirect) {
        sessionStorage.removeItem('sos_redirect');
        try {
            const data = JSON.parse(sosRedirect);
            if (data.sessionId) {
                // Hide triage form, show live chat
                document.getElementById('triage-form-container').style.display = 'none';
                document.getElementById('live-counselor-cards').style.display = 'none';
                if (statusInterval) clearInterval(statusInterval);
                renderLiveChat(container, {
                    sessionId: data.sessionId,
                    alias: data.alias || 'Anonymous',
                    counselorId: data.counselorId,
                    counselorName: data.counselorName || 'Counselor'
                });
            }
        } catch(e) {
            console.error('SOS redirect parse error:', e);
        }
    }
}

async function loadCounselorStatuses() {
    try {
        const data = await apiGet('/api/counselors');
        const grid = document.getElementById('counselor-status-grid');
        if (!grid) return;

        const counselors = data.counselors || data || [];
        if (counselors.length === 0) {
            grid.innerHTML = '<div style="text-align: center; padding: 1rem; color: rgba(255,255,255,0.3); grid-column: 1/-1;">No counselors registered.</div>';
            return;
        }

        // Map specializations to issue tags
        const specIssueMap = {
            'stress': ['stress', 'anxiety', 'academic', 'burnout'],
            'anxiety': ['anxiety', 'stress', 'worry', 'panic'],
            'relationship': ['relationship', 'family', 'interpersonal'],
            'financial': ['financial', 'career', 'money', 'life'],
            'depression': ['depression', 'mood', 'mental', 'life']
        };

        grid.innerHTML = counselors.map(c => {
            const isOnline = c.is_online === 1;
            const status = c.status || (isOnline ? 'available' : 'offline');
            const statusColor = status === 'available' ? '#22c55e' : status === 'busy' ? '#f59e0b' : status === 'break' ? '#94a3b8' : '#6b7280';
            const statusLabel = status === 'available' ? 'Online' : status === 'busy' ? 'Busy' : status === 'break' ? 'On Break' : 'Offline';
            const statusDot = isOnline ? (status === 'available' ? '🟢' : status === 'busy' ? '🟡' : '⚪') : '⚫';
            const photo = c.photo || `/counselors/counselor-${c.id}.png`;
            const spec = (c.specialization || '').toLowerCase();
            
            // Find which issues this counselor handles
            const handledIssues = [];
            for (const [issue, keywords] of Object.entries(specIssueMap)) {
                if (keywords.some(kw => spec.includes(kw))) handledIssues.push(issue);
            }
            if (handledIssues.length === 0) handledIssues.push('other');

            const issueLabels = { stress: '📚 Stress', anxiety: '😰 Anxiety', depression: '💙 Mood', relationship: '❤️ Relationships', financial: '💰 Financial', other: '🌟 General' };

            return `
            <div class="counselor-status-card" data-issues="${handledIssues.join(',')}" data-gender="${c.gender}" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.25rem; text-align: center; transition: all 0.3s; ${isOnline && status === 'available' ? 'border-color: rgba(34,197,94,0.3); box-shadow: 0 0 20px rgba(34,197,94,0.05);' : ''}">
              <div style="position: relative; display: inline-block; margin-bottom: 0.75rem;">
                <img src="${photo}" alt="${c.name}" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 2px solid ${statusColor};" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2MzY2ZjEiIHN0cm9rZS13aWR0aD0iMSI+PGNpcmNsZSBjeD0iMTIiIGN5PSI4IiByPSI1Ii8+PHBhdGggZD0iTTMgMjF2LTJhNyA3IDAgMCAxIDE0IDB2MiIvPjwvc3ZnPg=='" />
                <span style="position: absolute; bottom: 2px; right: 2px; width: 14px; height: 14px; border-radius: 50%; background: ${statusColor}; border: 2px solid #0f172a;"></span>
              </div>
              <div style="font-weight: 600; font-size: 0.9rem; color: white; margin-bottom: 2px;">${c.name}</div>
              <div style="font-size: 0.72rem; color: rgba(255,255,255,0.4); margin-bottom: 0.5rem;">${c.specialization || 'General Counselor'}</div>
              <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; margin-bottom: 0.5rem;">
                ${handledIssues.map(issue => `<span style="font-size: 0.6rem; padding: 2px 6px; border-radius: 8px; background: rgba(99,102,241,0.1); color: #a5b4fc;">${issueLabels[issue] || issue}</span>`).join('')}
              </div>
              <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.7rem; padding: 3px 10px; border-radius: 20px; background: ${isOnline ? `rgba(${status === 'available' ? '34,197,94' : status === 'busy' ? '245,158,11' : '148,163,184'},0.12)` : 'rgba(107,114,128,0.12)'}; color: ${statusColor}; font-weight: 600;">
                ${statusDot} ${statusLabel}
              </span>
            </div>`;
        }).join('');

        // Set up issue-change highlighting
        setupIssueHighlight();
    } catch (err) {
        console.error('Failed to load counselor statuses:', err);
    }
}

function setupIssueHighlight() {
    const issueSelect = document.getElementById('triage-issue');
    if (!issueSelect) return;
    
    issueSelect.addEventListener('change', () => {
        const selectedIssue = issueSelect.value;
        document.querySelectorAll('.counselor-status-card').forEach(card => {
            const issues = (card.dataset.issues || '').split(',');
            if (selectedIssue && issues.includes(selectedIssue)) {
                card.style.borderColor = 'rgba(99,102,241,0.5)';
                card.style.boxShadow = '0 0 20px rgba(99,102,241,0.15)';
                card.style.transform = 'scale(1.03)';
            } else {
                card.style.borderColor = 'rgba(255,255,255,0.08)';
                card.style.boxShadow = 'none';
                card.style.transform = 'scale(1)';
            }
        });
    });
}

function showNoCounselors(pageContainer, triageResult) {
    const el = document.getElementById('no-counselors');
    el.style.display = 'block';
    el.innerHTML = `
        <div style="background: rgba(255,255,255,0.04); padding: 2rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">⏳</div>
            <h2 style="color: white; margin-bottom: 0.5rem;">No Counselors Available</h2>
            <p style="color: rgba(255,255,255,0.5); margin-bottom: 1.5rem;">All counselors are currently offline or busy. Here's what you can do:</p>
            <div style="display: grid; gap: 0.75rem; text-align: left;">
                <a href="#chat" class="btn btn-primary" style="width: 100%; justify-content: center;">💬 Chat with AI Support (24/7)</a>
                <a href="#resources" class="btn" style="width: 100%; justify-content: center; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: white;">📚 Browse Self-Help Resources</a>
                <a href="#voice-rooms" class="btn" style="width: 100%; justify-content: center; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: white;">🎙️ Join a Safe Space Voice Room</a>
            </div>
            <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 12px;">
                <strong style="color: #f87171;">Crisis?</strong>
                <p style="font-size: 0.85rem; color: rgba(255,255,255,0.5); margin: 0.25rem 0 0;">MSU Counseling: Student Affairs | Emergency: 999/112 | Befrienders: +263 4 790 652</p>
            </div>
        </div>
    `;
}

function showMatchResults(pageContainer, triageResult) {
    document.getElementById('match-results').style.display = 'block';
    document.getElementById('live-counselor-cards').style.display = 'none';

    // Show queue info
    const queueEl = document.getElementById('queue-status');
    if (triageResult.queue) {
        queueEl.style.display = 'block';
        queueEl.innerHTML = `
            <div style="background: rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.15); padding: 1rem 1.5rem; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <div style="color: white;"><strong>Your alias:</strong> ${triageResult.alias}</div>
                <div style="color: white;"><strong>Priority:</strong> ${'🔴'.repeat(Math.min(5, triageResult.priority))}${'⚪'.repeat(5 - Math.min(5, triageResult.priority))}</div>
                <div style="color: white;"><strong>Est. wait:</strong> ~${triageResult.queue.estimatedWaitMinutes} min</div>
            </div>
        `;
    }

    const grid = document.getElementById('counselor-grid');
    const counselors = triageResult.availableCounselors || [];

    if (counselors.length === 0) {
        grid.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.4); padding: 2rem;">No matching counselors found.</div>';
        return;
    }

    grid.innerHTML = counselors.map((c, i) => `
      <div class="counselor-card" data-id="${c.id}" style="${i === 0 ? 'border: 2px solid #6366f1; box-shadow: 0 0 20px rgba(99,102,241,0.2);' : ''} position: relative; background: rgba(255,255,255,0.04); border-radius: 16px;">
        ${i === 0 ? '<div style="position: absolute; top: -12px; right: -12px; background: linear-gradient(135deg,#6366f1,#8b5cf6); color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: bold;">Best Match</div>' : ''}
        <div class="counselor-card-photo">
          <img src="${c.photo || '/counselors/counselor-1.png'}" alt="${c.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2MzY2ZjEiIHN0cm9rZS13aWR0aD0iMSI+PGNpcmNsZSBjeD0iMTIiIGN5PSI4IiByPSI1Ii8+PHBhdGggZD0iTTMgMjF2LTJhNyA3IDAgMCAxIDE0IDB2MiIvPjwvc3ZnPg=='" />
          <span class="counselor-status online">🟢 Online</span>
        </div>
        <div class="counselor-card-body">
          <h3>${c.name}</h3>
          <p class="counselor-specialization">${c.specialization}</p>
          ${c.matchScore ? `<div style="font-size: 0.75rem; color: #818cf8; margin-bottom: 0.5rem;">Match score: ${Math.min(100, Math.max(0, c.matchScore))}%</div>` : ''}
          <button class="btn btn-primary btn-start-chat" data-id="${c.id}" data-name="${c.name}" data-session="${triageResult.sessionId}" data-alias="${triageResult.alias}" style="width: 100%; margin-top: 0.5rem; background: linear-gradient(135deg,#6366f1,#8b5cf6); border: none; border-radius: 10px;">
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
    if (statusInterval) clearInterval(statusInterval);
    currentSocket = io(getSocketUrl());

    container.innerHTML = `
    <div class="live-chat-layout">
      <div class="live-chat-main">
        <div class="live-chat-header">
          <div style="display: flex; align-items: center; gap: var(--space-md);">
            <button class="btn-back" id="live-chat-back" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: white; padding: 6px 12px; border-radius: 8px; cursor: pointer;">← Back</button>
            <div>
              <h2 style="color: white;">Chat with ${counselorName}</h2>
              <p style="font-size: 0.75rem; color: rgba(255,255,255,0.4);">You are: <strong>${alias}</strong> (anonymous)</p>
            </div>
          </div>
          <div class="live-chat-status" id="live-chat-status" style="color: rgba(255,255,255,0.5); font-size: 0.85rem;">
            <span class="status-dot waiting"></span> Waiting for counselor...
          </div>
        </div>

        <div class="live-chat-messages" id="live-chat-messages" style="background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.06);">
          <div class="system-message">
            <p>🔒 Your identity is completely anonymous. The counselor only sees your alias: <strong>${alias}</strong></p>
            <p>Waiting for ${counselorName} to accept your chat request...</p>
          </div>
        </div>

        <div class="live-chat-input-area" id="live-chat-input-area" style="display: none; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-top: none; padding: 0.75rem; border-radius: 0 0 12px 12px;">
          <div class="chat-input-wrapper">
            <input type="text" class="chat-input" id="live-chat-input" placeholder="Type your message..." autocomplete="off" />
            <button class="chat-send-btn" id="live-chat-send">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-sm);">
            <span style="font-size: 0.6875rem; color: rgba(255,255,255,0.3);">Your identity is protected.</span>
            <button class="btn btn-sm" style="background: rgba(239,68,68,0.12); color: #f87171; border: 1px solid rgba(239,68,68,0.2); border-radius: 8px;" id="end-session-btn">End Chat</button>
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

    function addMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `live-msg ${sender}`;
        div.innerHTML = `
            <div class="live-msg-bubble ${sender}">${text}</div>
            <div class="live-msg-meta">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        `;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function sendMsg() {
        const text = input.value.trim();
        if (!text) return;
        addMessage(text, 'student');
        socket.emit('student-message', { sessionId, message: text });
        input.value = '';
    }

    sendBtn.addEventListener('click', sendMsg);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
    });

    socket.on('chat-accepted', (data) => {
        statusEl.innerHTML = '<span class="status-dot online"></span> Connected';
        statusEl.style.color = '#22c55e';
        inputArea.style.display = 'block';
        addMessage(`${counselorName} has joined the chat. Feel free to share what's on your mind.`, 'system');
    });

    socket.on('counselor-message', (data) => {
        addMessage(data.message, 'counselor');
    });

    socket.on('session-ended', () => {
        addMessage('This session has ended. Thank you for reaching out. 💚', 'system');
        input.disabled = true;
        sendBtn.disabled = true;
    });

    document.getElementById('end-session-btn')?.addEventListener('click', () => {
        socket.emit('end-session', { sessionId });
        addMessage('You ended the session. Take care! 💚', 'system');
        input.disabled = true;
        sendBtn.disabled = true;
    });

    document.getElementById('live-chat-back')?.addEventListener('click', () => {
        socket.disconnect();
        renderCounselors(container);
    });
}
