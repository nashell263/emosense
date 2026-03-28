/**
 * EmoSense Anonymous Voice Rooms
 * Topic-based safe spaces for students to connect.
 */

import { apiGet } from '../api.js';
import { getSocketUrl } from '../api.js';

export async function renderVoiceRooms(container) {
  const rooms = await apiGet('/api/voice-rooms');
  renderVoiceRoomGrid(container, rooms);
}

export function renderVoiceRoomGrid(container, rooms) {
  const target = container.querySelector('#hub-voice-rooms') || container;

  target.innerHTML = `
    <div class="hub-rooms-grid">
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
              <button class="join-room-btn" data-id="${room.id}">Join Now</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Event Listeners
  target.querySelectorAll('.join-room-btn').forEach(btn => {
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

  // ──── Socket Integration — NEW ────
  const socket = io(getSocketUrl());
  const alias = 'Anonymous student ' + Math.floor(Math.random() * 999);

  socket.emit('voice-room-join', { roomId: room.id, alias });

  socket.on('room-update', (data) => {
    // Update participant count in UI
    const roomCard = document.querySelector(`.room-card[data-id="${data.roomId}"]`);
    if (roomCard) {
      const countEl = roomCard.querySelector('.participant-count');
      if (countEl) countEl.innerHTML = `<span class="pulse-dot"></span> ${data.participants} listening ${data.participants === 1 ? 'now' : ''}`;
    }

    if (data.event) {
      appendSystemMessage(messagesContainer, `${data.user} has ${data.event === 'join' ? 'entered' : 'left'} the room.`);
    }
  });

  socket.on('room-message', (data) => {
    appendMessage(data.alias === alias ? 'You' : 'Anonymous staff', data.text);
  });

  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    socket.emit('voice-room-msg', { roomId: room.id, alias, text });
    input.value = '';
  }

  leaveBtn.onclick = () => {
    socket.emit('voice-room-leave', { roomId: room.id, alias });
    socket.disconnect();
    modal.style.display = 'none';
    renderVoiceRooms(document.getElementById('page-content'));
  };

  function appendSystemMessage(container, text) {
    const div = document.createElement('div');
    div.className = 'system-msg';
    div.style.color = 'var(--text-muted)';
    div.style.fontSize = '0.75rem';
    div.style.textAlign = 'center';
    div.style.margin = '8px 0';
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function appendMessage(sender, text) {
    const msgEl = document.createElement('div');
    const isOwn = sender === 'You';
    msgEl.className = `room-msg ${isOwn ? 'own' : 'other'} animate-slide-up`;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    msgEl.innerHTML = `
      <div class="sender-alias">${sender}</div>
      <div class="msg-bubble">${text}</div>
      <div class="msg-meta">${time}</div>
    `;
    messagesContainer.appendChild(msgEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  let audioStream = null;
  let isMuted = true;
  let audioContext = null;
  let processor = null;

  micBtn.onclick = async () => {
    if (isMuted) {
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        isMuted = false;
        micBtn.classList.remove('muted');
        micBtn.classList.add('active');
        micBtn.querySelector('.label').textContent = 'Speaking';
        micBtn.querySelector('.icon').textContent = '🔊';

        // Set up audio processing
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(audioStream);
        processor = audioContext.createScriptProcessor(4096, 1, 1);

        source.connect(processor);
        processor.connect(audioContext.destination);

        processor.onaudioprocess = (e) => {
          if (isMuted) return;
          const inputData = e.inputBuffer.getChannelData(0);
          socket.emit('voice-room-audio', {
            roomId: room.id,
            audio: inputData.buffer
          });

          // Local visualization logic
          const bars = document.querySelectorAll('.visualizer-bar');
          bars.forEach(bar => {
            const height = 10 + (Math.random() * 30);
            bar.style.height = `${height}px`;
            bar.style.background = 'var(--primary-500)';
          });
        };
      } catch (err) {
        alert('Could not access microphone: ' + err.message);
      }
    } else {
      isMuted = true;
      micBtn.classList.add('muted');
      micBtn.classList.remove('active');
      micBtn.querySelector('.label').textContent = 'Muted';
      micBtn.querySelector('.icon').textContent = '🎤';

      if (audioStream) {
        audioStream.getTracks().forEach(t => t.stop());
        audioStream = null;
      }
      if (processor) processor.disconnect();
      if (audioContext) audioContext.close();

      // Reset visualizer
      document.querySelectorAll('.visualizer-bar').forEach(bar => {
        bar.style.height = '4px';
        bar.style.background = 'var(--slate-200)';
      });
    }
  };

  // Handle incoming audio
  socket.on('room-audio-stream', (data) => {
    if (!window._audioContext) {
      window._audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const floatData = new Float32Array(data.audio);
    const buffer = window._audioContext.createBuffer(1, floatData.length, window._audioContext.sampleRate);
    buffer.copyToChannel(floatData, 0);

    const source = window._audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(window._audioContext.destination);
    source.start();

    // Remote visualization
    const bars = document.querySelectorAll('.visualizer-bar');
    bars.forEach((bar, i) => {
      const height = 15 + (Math.random() * 35);
      bar.style.height = `${height}px`;
      bar.style.background = 'var(--accent-500)';
    });
  });

  // Handle Send Button
  sendBtn.onclick = sendMessage;
  input.onkeydown = (e) => { if (e.key === 'Enter') sendMessage(); };

  // ──── Auto-Initialize Listener Context (Silent) ────
  if (!window._audioContext) {
    // We create it but it might stay suspended until a user interaction
    window._audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}
