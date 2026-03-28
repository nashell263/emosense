/**
 * EmoSense Anonymous Voice Rooms
 * Topic-based safe spaces for students to connect.
 */

import { apiGet } from '../api.js';
import { getSocketUrl } from '../api.js';

export async function renderVoiceRooms(container) {
    const rooms = await apiGet('/api/voice-rooms');

    container.innerHTML = `
    <div class="voice-rooms-page">
      <div class="page-header">
        <h1>Anonymous Safe Spaces</h1>
        <p>Join a topic-based room to talk or just listen. Fully anonymous, always supportive.</p>
      </div>

      <div class="rooms-grid">
        ${rooms.map(room => `
          <div class="room-card ${room.participants > 0 ? 'active' : ''}" data-id="${room.id}">
            <div class="room-icon">${room.icon}</div>
            <div class="room-info">
              <h3>${room.name}</h3>
              <p>${room.description}</p>
              <div class="room-meta">
                <span class="participant-count">
                  <span class="pulse-dot"></span>
                  ${room.participants} listening ${room.participants === 1 ? 'now' : ''}
                </span>
                <button class="join-room-btn" data-id="${room.id}">Join Room</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Active Room Modal (Hidden by default) -->
      <div id="active-room-modal" class="room-modal" style="display: none;">
        <div class="room-modal-content">
          <div class="modal-header">
            <h2 id="current-room-name">Room Name</h2>
            <button id="leave-room-btn" class="leave-btn">Exit Room</button>
          </div>
          
          <div class="voice-visualizer">
            <div class="visualizer-bar"></div>
            <div class="visualizer-bar"></div>
            <div class="visualizer-bar"></div>
            <div class="visualizer-bar"></div>
            <div class="visualizer-bar"></div>
          </div>

          <div class="room-chat" id="room-messages">
            <div class="system-msg">Welcome to the safe space. You are anonymous.</div>
          </div>

          <div class="room-footer">
            <div class="voice-controls">
              <button id="mic-toggle" class="mic-btn muted">
                <span class="icon">🎤</span>
                <span class="label">Muted</span>
              </button>
            </div>
            <div class="chat-input-row">
              <input type="text" id="room-input" placeholder="Type an anonymous message..." />
              <button id="send-room-msg">Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

    // Event Listeners
    document.querySelectorAll('.join-room-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const roomId = btn.dataset.id;
            const room = rooms.find(r => r.id === roomId);
            openRoom(room);
        });
    });
}

function openRoom(room) {
    const modal = document.getElementById('active-room-modal');
    const nameEl = document.getElementById('current-room-name');
    const leaveBtn = document.getElementById('leave-room-btn');
    const input = document.getElementById('room-input');
    const sendBtn = document.getElementById('send-room-msg');
    const messagesContainer = document.getElementById('room-messages');
    const micBtn = document.getElementById('mic-toggle');

    nameEl.textContent = `${room.icon} ${room.name}`;
    modal.style.display = 'flex';

    // Socket.io integration would go here
    // For demonstration, we'll simulate the interaction

    leaveBtn.onclick = () => {
        modal.style.display = 'none';
    };

    sendBtn.onclick = sendMessage;
    input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };

    function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        appendMessage('You', text);
        input.value = '';

        // Simulate other anonymous users responding
        setTimeout(() => {
            const responses = [
                "I hear you. You're not alone.",
                "Thanks for sharing that.",
                "I've been feeling the same way lately.",
                "We're here for you."
            ];
            const randomMsg = responses[Math.floor(Math.random() * responses.length)];
            appendMessage('Anonymous', randomMsg);
        }, 2000);
    }

    function appendMessage(sender, text) {
        const msgEl = document.createElement('div');
        msgEl.className = `room-msg ${sender === 'You' ? 'own' : 'other'}`;
        msgEl.innerHTML = `
      <span class="sender">${sender}</span>
      <span class="text">${text}</span>
    `;
        messagesContainer.appendChild(msgEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    let isMuted = true;
    micBtn.onclick = () => {
        isMuted = !isMuted;
        micBtn.classList.toggle('muted', isMuted);
        micBtn.querySelector('.label').textContent = isMuted ? 'Muted' : 'Speaking';
        micBtn.querySelector('.icon').textContent = isMuted ? '🎤' : '🔊';
    };
}
