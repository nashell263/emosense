/**
 * EmoSense Voice Rooms — WebRTC HD Audio/Video + Community Roles
 * Features: peer-to-peer audio/video, counsellor/student/anonymous roles,
 * moderation (mute/kick), raise hand, text chat, file sharing.
 */
import { apiGet, apiPost, getSocketUrl } from '../api.js';
import { io } from 'socket.io-client';

let activeSocket = null;
let localStream = null;
let peerConnections = new Map();
const ICE_SERVERS = { iceServers: [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
]};

export async function renderVoiceRooms(container) {
  container.innerHTML = `
    <div class="vr-page">
      <div class="vr-hero">
        <div class="vr-hero-content">
          <div class="vr-hero-icon">🛡️</div>
          <h1 class="vr-title">Safe Space Voice Rooms</h1>
          <p class="vr-subtitle">HD audio & video support rooms with community roles. Join as a counsellor, student, or stay anonymous.</p>
        </div>
        <div class="vr-hero-glow"></div>
      </div>
      <div class="vr-rooms-grid" id="vr-rooms-grid">
        <div class="vr-loading"><div class="vr-loading-spinner"></div><p>Loading rooms...</p></div>
      </div>
    </div>

    <!-- Join Role Modal -->
    <div class="vr-modal" id="vr-role-modal" style="display:none;">
      <div class="vr-role-dialog">
        <h2>Choose Your Role</h2>
        <p>How would you like to join this room?</p>
        <div class="vr-role-options">
          <button class="vr-role-btn" data-role="anonymous">
            <span class="vr-role-icon">🎭</span>
            <span class="vr-role-name">Anonymous</span>
            <span class="vr-role-desc">Random alias, fully private</span>
          </button>
          <button class="vr-role-btn" data-role="student">
            <span class="vr-role-icon">🎓</span>
            <span class="vr-role-name">Student</span>
            <span class="vr-role-desc">Named identity</span>
          </button>
          <button class="vr-role-btn counsellor" data-role="counsellor">
            <span class="vr-role-icon">🩺</span>
            <span class="vr-role-name">Counsellor</span>
            <span class="vr-role-desc">Verified, can moderate</span>
          </button>
        </div>
        <!-- Counsellor login form (hidden by default) -->
        <div class="vr-counsellor-login" id="vr-counsellor-login" style="display:none;">
          <input type="email" id="vr-login-email" placeholder="Counsellor email" class="vr-login-input" />
          <input type="password" id="vr-login-pass" placeholder="Password" class="vr-login-input" />
          <button class="vr-login-btn" id="vr-login-btn">Verify & Join</button>
          <div class="vr-login-error" id="vr-login-error"></div>
        </div>
        <button class="vr-role-cancel" id="vr-role-cancel">Cancel</button>
      </div>
    </div>

    <!-- Active Room Modal -->
    <div class="vr-modal" id="vr-room-modal" style="display:none;">
      <div class="vr-modal-content" style="max-width:900px;width:95%;max-height:95vh;display:flex;flex-direction:column;">
        <div class="vr-modal-header" style="display:flex;justify-content:space-between;align-items:center;padding:1rem 1.5rem;border-bottom:1px solid var(--gray-200);">
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <span class="vr-modal-icon" id="vr-modal-icon"></span>
            <div>
              <div id="vr-modal-title" style="font-weight:700;font-size:1.1rem;"></div>
              <div id="vr-modal-topic" style="font-size:0.8rem;color:var(--text-muted);"></div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <span class="vr-participant-badge" id="vr-participant-badge"><span class="vr-pulse"></span> <span id="vr-live-count">0</span>/12</span>
            <button class="vr-leave-btn" id="vr-leave-btn" style="padding:0.4rem 1rem;font-size:0.8rem;">🚪 Leave</button>
          </div>
        </div>

        <div style="flex:1;display:flex;overflow:hidden;">
          <!-- Main Area: Speakers + Listeners + Chat -->
          <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;">
            <!-- Speakers Section -->
            <div style="padding:1rem 1.5rem;border-bottom:1px solid var(--gray-100);">
              <div style="font-size:0.75rem;font-weight:700;color:var(--primary-700);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.75rem;">🎤 Speakers</div>
              <div id="vr-speakers" style="display:flex;gap:1rem;flex-wrap:wrap;min-height:60px;align-items:center;">
                <div style="color:var(--text-muted);font-size:0.8rem;">No active speakers</div>
              </div>
            </div>
            <!-- Listeners Section -->
            <div style="padding:0.75rem 1.5rem;border-bottom:1px solid var(--gray-100);">
              <div style="font-size:0.75rem;font-weight:700;color:var(--gray-500);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.5rem;">👥 Listeners</div>
              <div id="vr-listeners" style="display:flex;gap:0.75rem;flex-wrap:wrap;min-height:40px;align-items:center;">
                <div style="color:var(--text-muted);font-size:0.8rem;">Waiting for others...</div>
              </div>
            </div>
            <!-- Chat Messages -->
            <div class="vr-messages" id="vr-messages" style="flex:1;overflow-y:auto;padding:0.75rem 1.5rem;"></div>
            <!-- Chat Input -->
            <div class="vr-input-area" style="padding:0.75rem 1.5rem;border-top:1px solid var(--gray-100);">
              <div class="vr-input-row">
                <button class="vr-attach-btn" id="vr-attach-btn" title="Share files">📎</button>
                <input type="text" class="vr-chat-input" id="vr-chat-input" placeholder="Type a message..." />
                <button class="vr-send-btn" id="vr-send-btn">➤</button>
              </div>
              <input type="file" id="vr-file-input" style="display:none" accept="image/*,video/*,application/pdf,.doc,.docx,.txt" />
            </div>
          </div>

          <!-- Counselor Controls Sidebar (hidden for students) -->
          <div id="vr-counselor-panel" style="display:none;width:240px;border-left:1px solid var(--gray-200);background:var(--gray-50);overflow-y:auto;padding:1rem;">
            <div style="font-size:0.75rem;font-weight:700;color:var(--primary-700);text-transform:uppercase;margin-bottom:0.75rem;">🩺 Counselor Controls</div>
            <div id="vr-hand-requests" style="margin-bottom:1rem;"></div>
            <button class="btn btn-sm btn-outline" id="vr-announce-btn" style="width:100%;margin-bottom:0.5rem;font-size:0.75rem;">📢 Announce</button>
            <button class="btn btn-sm" id="vr-end-session-btn" style="width:100%;background:var(--red-50);color:var(--red-600);border:1px solid var(--red-100);font-size:0.75rem;">🛑 End Session</button>
            <div style="margin-top:1rem;font-size:0.7rem;font-weight:600;color:var(--gray-500);text-transform:uppercase;">Participants</div>
            <div id="vr-participants-list" style="margin-top:0.5rem;"></div>
          </div>
        </div>

        <!-- Bottom Control Bar -->
        <div style="display:flex;justify-content:center;align-items:center;gap:1rem;padding:0.75rem;border-top:1px solid var(--gray-200);background:white;">
          <button class="vr-ctrl-btn muted" id="vr-mic-btn" title="Unmute"><span>🎤</span> Unmute</button>
          <button class="vr-ctrl-btn" id="vr-camera-btn" title="Camera"><span>📷</span> Camera</button>
          <button class="vr-ctrl-btn" id="vr-hand-btn" title="Raise Hand"><span>✋</span> Raise Hand</button>
          <button class="vr-ctrl-btn" id="vr-report-btn" title="Report" style="color:var(--red-600);"><span>🚩</span> Report</button>
        </div>
        <div class="vr-video-grid" id="vr-video-grid" style="display:none;">
          <video id="vr-local-video" class="vr-video-feed" muted autoplay playsinline style="display:none;"></video>
        </div>
      </div>
    </div>

    <!-- Room Rules Modal -->
    <div class="vr-modal" id="vr-rules-modal" style="display:none;">
      <div style="background:white;border-radius:var(--radius-xl);max-width:450px;width:90%;padding:2rem;text-align:center;">
        <div style="font-size:2.5rem;margin-bottom:0.5rem;">🛡️</div>
        <h2 style="margin-bottom:0.5rem;">Room Guidelines</h2>
        <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:1.5rem;">Please read before entering</p>
        <div style="text-align:left;font-size:0.875rem;color:var(--gray-700);line-height:2;">
          <div>✅ Be respectful and supportive</div>
          <div>✅ No judgment or interrupting</div>
          <div>✅ Wait to be invited to speak</div>
          <div>✅ Keep discussions confidential</div>
          <div>⚠️ This is peer support, not emergency care</div>
        </div>
        <div style="margin-top:1.5rem;display:flex;gap:0.75rem;justify-content:center;">
          <button class="btn btn-outline btn-sm" id="vr-rules-cancel">Cancel</button>
          <button class="btn btn-primary btn-sm" id="vr-rules-accept">I Agree — Enter Room</button>
        </div>
      </div>
    </div>
  `;
  loadRooms();
}

async function loadRooms() {
  try {
    const rooms = await apiGet('/api/voice-rooms');
    renderRoomGrid(rooms);
  } catch (err) {
    document.getElementById('vr-rooms-grid').innerHTML = `
      <div class="vr-error"><p>Unable to load rooms.</p>
      <button class="btn btn-primary" onclick="location.reload()">Retry</button></div>`;
  }
}

function renderRoomGrid(rooms) {
  const grid = document.getElementById('vr-rooms-grid');
  grid.innerHTML = rooms.map(room => `
    <div class="vr-room-card ${room.participants > 0 ? 'has-people' : ''}" data-id="${room.id}">
      <div class="vr-card-glow"></div>
      <div class="vr-card-content">
        <div class="vr-card-icon">${room.icon}</div>
        <h3 class="vr-card-name">${room.name}</h3>
        <p class="vr-card-desc">${room.description}</p>
        <div class="vr-card-footer">
          <div class="vr-card-count ${room.participants > 0 ? 'active' : ''}">
            <span class="vr-card-dot"></span>
            <span>${room.participants} ${room.participants === 1 ? 'person' : 'people'} here</span>
          </div>
          <button class="vr-join-btn" data-id="${room.id}">${room.participants > 0 ? 'Join Now' : 'Enter Room'}</button>
        </div>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.vr-join-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const room = rooms.find(r => r.id === btn.dataset.id);
      if (room) showRoleModal(room);
    });
  });
}

function showRoleModal(room) {
  const modal = document.getElementById('vr-role-modal');
  const loginForm = document.getElementById('vr-counsellor-login');
  modal.style.display = 'flex';
  loginForm.style.display = 'none';

  let selectedRole = null;
  let selectedAlias = null;

  document.querySelectorAll('.vr-role-btn').forEach(btn => {
    btn.onclick = () => {
      const role = btn.dataset.role;
      if (role === 'counsellor') {
        loginForm.style.display = 'block';
        setupCounsellorLogin(room);
      } else {
        selectedRole = role;
        selectedAlias = role === 'student'
          ? 'Student-' + Math.floor(1000 + Math.random() * 9000)
          : 'Anon-' + Math.floor(100 + Math.random() * 900);
        modal.style.display = 'none';
        // Show rules before entering
        showRulesModal(room, selectedAlias, selectedRole);
      }
    };
  });

  document.getElementById('vr-role-cancel').onclick = () => { modal.style.display = 'none'; };
}

function showRulesModal(room, alias, role) {
  const rulesModal = document.getElementById('vr-rules-modal');
  rulesModal.style.display = 'flex';
  document.getElementById('vr-rules-accept').onclick = () => {
    rulesModal.style.display = 'none';
    openRoom(room, alias, role);
  };
  document.getElementById('vr-rules-cancel').onclick = () => {
    rulesModal.style.display = 'none';
  };
}

function setupCounsellorLogin(room) {
  const loginBtn = document.getElementById('vr-login-btn');
  const errorEl = document.getElementById('vr-login-error');
  loginBtn.onclick = async () => {
    const email = document.getElementById('vr-login-email').value.trim();
    const pass = document.getElementById('vr-login-pass').value;
    if (!email || !pass) { errorEl.textContent = 'Please enter email and password'; return; }
    errorEl.textContent = 'Verifying...';
    try {
      const res = await apiPost('/api/counselors/login', { email, password: pass });
      if (res.token) {
        document.getElementById('vr-role-modal').style.display = 'none';
        openRoom(room, res.counselor.name + ' 🩺', 'counsellor');
      }
    } catch (err) {
      errorEl.textContent = '❌ Invalid credentials. Try again.';
    }
  };
}

function openRoom(room, alias, role) {
  const modal = document.getElementById('vr-room-modal');
  const titleEl = document.getElementById('vr-modal-title');
  const topicEl = document.getElementById('vr-modal-topic');
  const iconEl = document.getElementById('vr-modal-icon');
  const messagesEl = document.getElementById('vr-messages');
  const inputEl = document.getElementById('vr-chat-input');
  const sendBtn = document.getElementById('vr-send-btn');
  const leaveBtn = document.getElementById('vr-leave-btn');
  const attachBtn = document.getElementById('vr-attach-btn');
  const fileInput = document.getElementById('vr-file-input');
  const micBtn = document.getElementById('vr-mic-btn');
  const cameraBtn = document.getElementById('vr-camera-btn');
  const localVideo = document.getElementById('vr-local-video');
  const liveCount = document.getElementById('vr-live-count');
  const speakersEl = document.getElementById('vr-speakers');
  const listenersEl = document.getElementById('vr-listeners');
  const handBtn = document.getElementById('vr-hand-btn');
  const reportBtn = document.getElementById('vr-report-btn');
  const counselorPanel = document.getElementById('vr-counselor-panel');

  iconEl.textContent = room.icon;
  titleEl.textContent = room.name;
  topicEl.textContent = room.description || '';
  messagesEl.innerHTML = '';
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Show counselor panel only for counselors
  if (role === 'counsellor') {
    counselorPanel.style.display = 'block';
  } else {
    counselorPanel.style.display = 'none';
  }

  if (activeSocket) activeSocket.disconnect();
  const socket = io(getSocketUrl());
  activeSocket = socket;
  let handRaised = false;
  let isMuted = true;
  let cameraOn = false;
  const participants = new Map();
  let roomParticipants = [];

  socket.emit('voice-room-join', { roomId: room.id, alias, role });
  addSystemMsg(messagesEl, `Welcome to ${room.name}. This is a safe space. You can listen or request to speak. 💚`);

  socket.on('room-update', data => {
    liveCount.textContent = data.participants;
    if (data.participantList) {
        roomParticipants = data.participantList;
        renderSpeakersListeners(speakersEl, listenersEl, data.participantList, alias, role, socket, room.id);
        if (role === 'counsellor') {
            updateCounselorPanel(data.participantList, alias, socket, room.id);
        }
    }
    if (data.event === 'join' && data.user && data.user !== alias) {
      const newPeer = data.participantList?.find(p => p.alias === data.user);
      if (newPeer && localStream) initiateWebRTCConnections(socket, room.id, [newPeer]);
      addSystemMsg(messagesEl, `${data.user} entered the room`);
    } else if (data.event === 'leave' && data.user) {
      addSystemMsg(messagesEl, `${data.user} left the room`);
    } else if (data.event === 'kick' && data.user) {
      addSystemMsg(messagesEl, `${data.user} was removed by a counsellor`);
    }
  });

  socket.on('room-message', data => {
    addChatMsg(messagesEl, data.alias, data.text, data.alias === alias, data.role);
  });

  socket.on('room-file', data => {
    addFileMsg(messagesEl, data.alias, data.fileUrl, data.fileType, data.fileName, data.alias === alias);
  });

  socket.on('room-muted', data => {
    if (data.targetAlias === alias) {
      addSystemMsg(messagesEl, `🔇 You were muted by counsellor ${data.by}`);
      if (localStream) { localStream.getAudioTracks().forEach(t => { t.enabled = false; }); }
      isMuted = true; micBtn.classList.add('muted'); micBtn.innerHTML = '<span>🔇</span> Muted';
    } else {
      addSystemMsg(messagesEl, `🔇 ${data.targetAlias} was muted`);
    }
  });

  socket.on('room-kicked', () => {
    addSystemMsg(messagesEl, '⚠️ You have been removed from this room by a counsellor.');
    setTimeout(() => leaveRoom(), 2000);
  });

  // WebRTC signaling
  socket.on('webrtc-offer', async data => {
    const pc = createPeerConnection(data.senderSocketId, socket, room.id);
    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
    if (localStream) localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('webrtc-answer', { roomId: room.id, targetSocketId: data.senderSocketId, answer });
  });

  socket.on('webrtc-answer', async data => {
    const pc = peerConnections.get(data.senderSocketId);
    if (pc) await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
  });

  socket.on('webrtc-ice-candidate', async data => {
    const pc = peerConnections.get(data.senderSocketId);
    if (pc && data.candidate) await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
  });

  // Chat
  function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;
    socket.emit('voice-room-msg', { roomId: room.id, alias, text, role });
    inputEl.value = '';
  }
  sendBtn.onclick = sendMessage;
  inputEl.onkeydown = e => { if (e.key === 'Enter') sendMessage(); };

  // File sharing
  attachBtn.onclick = () => fileInput.click();
  fileInput.onchange = async () => {
    const file = fileInput.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${getSocketUrl()}/api/upload`, { method: 'POST', body: formData });
      const result = await res.json();
      socket.emit('voice-room-file', { roomId: room.id, alias, fileUrl: result.url, fileType: result.type, fileName: file.name });
    } catch (err) { addSystemMsg(messagesEl, '⚠️ Failed to upload file'); }
    fileInput.value = '';
  };

  // Raise hand
  handBtn.onclick = () => {
    handRaised = !handRaised;
    handBtn.classList.toggle('raised', handRaised);
    socket.emit('voice-room-raise-hand', { roomId: room.id, alias, raised: handRaised });
    addSystemMsg(messagesEl, handRaised ? '✋ You raised your hand — waiting for counselor approval' : '✋ You lowered your hand');
  };

  // Report button
  reportBtn.onclick = () => {
    const reason = prompt('What would you like to report? (optional)');
    if (reason !== null) {
      socket.emit('voice-room-report', { roomId: room.id, alias, reason: reason || 'No reason given' });
      addSystemMsg(messagesEl, '🚩 Report sent silently to the counselor. Thank you.');
    }
  };

  // Counselor controls
  if (role === 'counsellor') {
    document.getElementById('vr-announce-btn').onclick = () => {
      const msg = prompt('Send announcement to all participants:');
      if (msg) socket.emit('voice-room-msg', { roomId: room.id, alias, text: '📢 ' + msg, role });
    };
    document.getElementById('vr-end-session-btn').onclick = () => {
      if (confirm('End session for all participants?')) {
        socket.emit('voice-room-msg', { roomId: room.id, alias, text: '🏁 Session ended. Thank you for being here today.', role });
        setTimeout(() => leaveRoom(), 2000);
      }
    };
  }

  // Listen for reports (counselor only)
  socket.on('room-report', data => {
    if (role === 'counsellor') {
      addSystemMsg(messagesEl, `🚩 REPORT from ${data.alias}: ${data.reason}`);
    }
  });

  // Microphone (WebRTC)
  micBtn.onclick = async () => {
    if (isMuted) {
      try {
        if (!localStream) {
          localStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 48000 }
          });
        } else {
          localStream.getAudioTracks().forEach(t => { t.enabled = true; });
        }
        isMuted = false;
        micBtn.classList.remove('muted');
        micBtn.innerHTML = '<span>🔊</span> Speaking';
        addSystemMsg(messagesEl, '🎤 Microphone on (HD audio)');
        initiateWebRTCConnections(socket, room.id, roomParticipants);
      } catch (err) { addSystemMsg(messagesEl, '⚠️ Mic access denied: ' + err.message); }
    } else {
      isMuted = true;
      if (localStream) localStream.getAudioTracks().forEach(t => { t.enabled = false; });
      micBtn.classList.add('muted');
      micBtn.innerHTML = '<span>🎤</span> Unmute';
    }
  };

  // Camera (WebRTC)
  cameraBtn.onclick = async () => {
    if (!cameraOn) {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        if (!localStream) {
          localStream = videoStream;
        } else {
          videoStream.getVideoTracks().forEach(t => localStream.addTrack(t));
        }
        localVideo.srcObject = localStream;
        localVideo.style.display = 'block';
        cameraOn = true;
        cameraBtn.innerHTML = '<span>🚫</span> Stop Cam';
        cameraBtn.classList.add('active');
        addSystemMsg(messagesEl, '📹 Camera on (HD video shared with room)');
        initiateWebRTCConnections(socket, room.id, roomParticipants);
      } catch (err) { addSystemMsg(messagesEl, '⚠️ Camera access denied: ' + err.message); }
    } else {
      if (localStream) localStream.getVideoTracks().forEach(t => { t.stop(); localStream.removeTrack(t); });
      localVideo.srcObject = localStream && localStream.getTracks().length > 0 ? localStream : null;
      localVideo.style.display = 'none';
      cameraOn = false;
      cameraBtn.innerHTML = '<span>📷</span> Camera';
      cameraBtn.classList.remove('active');
    }
  };

  function leaveRoom() {
    socket.emit('voice-room-leave', { roomId: room.id, alias });
    socket.disconnect();
    activeSocket = null;
    modal.style.display = 'none';
    document.body.style.overflow = '';
    cleanupMedia();
    loadRooms();
  }

  leaveBtn.onclick = leaveRoom;

  function cleanupMedia() {
    if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }
    peerConnections.forEach(pc => pc.close());
    peerConnections.clear();
  }
}

function createPeerConnection(remoteSocketId, socket, roomId) {
  if (peerConnections.has(remoteSocketId)) return peerConnections.get(remoteSocketId);
  const pc = new RTCPeerConnection(ICE_SERVERS);
  peerConnections.set(remoteSocketId, pc);

  pc.onicecandidate = e => {
    if (e.candidate) socket.emit('webrtc-ice-candidate', { roomId, targetSocketId: remoteSocketId, candidate: e.candidate });
  };

  pc.ontrack = e => {
    const videoGrid = document.getElementById('vr-video-grid');
    if (!videoGrid) return;
    let vid = document.getElementById('remote-' + remoteSocketId);
    if (!vid) {
      vid = document.createElement('video');
      vid.id = 'remote-' + remoteSocketId;
      vid.className = 'vr-video-feed vr-remote-video';
      vid.autoplay = true;
      vid.playsInline = true;
      videoGrid.appendChild(vid);
    }
    vid.srcObject = e.streams[0];
  };

  pc.onconnectionstatechange = () => {
    if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
      peerConnections.delete(remoteSocketId);
      const vid = document.getElementById('remote-' + remoteSocketId);
      if (vid) vid.remove();
    }
  };

  return pc;
}

async function initiateWebRTCConnections(socket, roomId, participants) {
  if (!participants) return;
  for (const p of participants) {
    if (p.socketId === socket.id || !p.socketId) continue;
    try {
      const pc = createPeerConnection(p.socketId, socket, roomId);
      if (localStream) {
        localStream.getTracks().forEach(t => {
          if (!pc.getSenders().find(s => s.track === t)) {
            pc.addTrack(t, localStream);
          }
        });
      }
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc-offer', { roomId, targetSocketId: p.socketId, offer });
    } catch (e) {
      console.error('Failed to initiate WebRTC with', p.alias, e);
    }
  }
}

/* ──── UI Helpers ──── */
function addSystemMsg(container, text) {
  const el = document.createElement('div');
  el.className = 'vr-sys-msg';
  el.textContent = text;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
}

function addChatMsg(container, sender, text, isOwn, senderRole) {
  const el = document.createElement('div');
  el.className = `vr-msg ${isOwn ? 'own' : 'other'}`;
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const badge = senderRole === 'counsellor' ? ' <span class="vr-role-badge counsellor">🩺 Counsellor</span>' : '';
  el.innerHTML = `
    <div class="vr-msg-sender">${isOwn ? 'You' : escapeHtml(sender)}${badge}</div>
    <div class="vr-msg-bubble">${escapeHtml(text)}</div>
    <div class="vr-msg-time">${time}</div>
  `;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
}

function addFileMsg(container, sender, fileUrl, fileType, fileName, isOwn) {
  const el = document.createElement('div');
  el.className = `vr-msg ${isOwn ? 'own' : 'other'}`;
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const fullUrl = window.location.origin + fileUrl;
  let preview = '';
  if (fileType && fileType.startsWith('image/')) {
    preview = `<img src="${fullUrl}" alt="${fileName}" class="vr-file-preview-img" onclick="window.open('${fullUrl}','_blank')" />`;
  } else if (fileType && fileType.startsWith('video/')) {
    preview = `<video src="${fullUrl}" controls class="vr-file-preview-video"></video>`;
  } else {
    preview = `<a href="${fullUrl}" target="_blank" class="vr-file-link">📄 ${escapeHtml(fileName)}</a>`;
  }
  el.innerHTML = `
    <div class="vr-msg-sender">${isOwn ? 'You' : escapeHtml(sender)}</div>
    <div class="vr-msg-bubble vr-file-bubble">${preview}</div>
    <div class="vr-msg-time">${time}</div>
  `;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
}

function renderSpeakersListeners(speakersEl, listenersEl, list, selfAlias, selfRole, socket, roomId) {
  const speakers = list.filter(p => p.role === 'counsellor' || p.isSpeaker);
  const listeners = list.filter(p => p.role !== 'counsellor' && !p.isSpeaker);

  const makeAvatar = (p, isSelf) => {
    const icon = p.role === 'counsellor' ? '🩺' : p.role === 'student' ? '🎓' : '🎭';
    const hand = p.handRaised ? '<div style="position:absolute;top:-4px;right:-4px;font-size:0.7rem;">✋</div>' : '';
    const border = p.role === 'counsellor' ? 'border:2px solid var(--primary-500);' : isSelf ? 'border:2px solid var(--primary-300);' : '';
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;position:relative;">
      ${hand}
      <div style="width:48px;height:48px;border-radius:50%;background:var(--gray-100);display:flex;align-items:center;justify-content:center;font-size:1.25rem;${border}">${icon}</div>
      <div style="font-size:0.7rem;color:var(--gray-600);max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;">${escapeHtml(p.alias)}${isSelf ? ' (You)' : ''}</div>
    </div>`;
  };

  speakersEl.innerHTML = speakers.length > 0
    ? speakers.map(p => makeAvatar(p, p.alias === selfAlias)).join('')
    : '<div style="color:var(--text-muted);font-size:0.8rem;">No active speakers</div>';

  listenersEl.innerHTML = listeners.length > 0
    ? listeners.map(p => makeAvatar(p, p.alias === selfAlias)).join('')
    : '<div style="color:var(--text-muted);font-size:0.8rem;">Waiting for others...</div>';
}

function updateCounselorPanel(list, selfAlias, socket, roomId) {
  const handRequests = document.getElementById('vr-hand-requests');
  const participantsList = document.getElementById('vr-participants-list');
  const handsUp = list.filter(p => p.handRaised && p.role !== 'counsellor');

  handRequests.innerHTML = handsUp.length > 0
    ? `<div style="font-size:0.7rem;font-weight:600;color:#f59e0b;margin-bottom:0.5rem;">✋ Hand Raised (${handsUp.length})</div>` +
      handsUp.map(p => `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0;border-bottom:1px solid var(--gray-100);font-size:0.8rem;">
        <span>${escapeHtml(p.alias)}</span>
        <div style="display:flex;gap:4px;">
          <button class="vr-accept-hand" data-alias="${p.alias}" style="background:var(--primary-50);color:var(--primary-700);border:1px solid var(--primary-200);border-radius:4px;padding:2px 8px;font-size:0.7rem;cursor:pointer;">✓ Allow</button>
          <button class="vr-deny-hand" data-alias="${p.alias}" style="background:var(--red-50);color:var(--red-600);border:1px solid var(--red-100);border-radius:4px;padding:2px 8px;font-size:0.7rem;cursor:pointer;">✗</button>
        </div>
      </div>`).join('')
    : '<div style="font-size:0.75rem;color:var(--text-muted);">No hand requests</div>';

  // Bind accept/deny buttons
  handRequests.querySelectorAll('.vr-accept-hand').forEach(btn => {
    btn.onclick = () => socket.emit('voice-room-accept-speaker', { roomId, targetAlias: btn.dataset.alias });
  });
  handRequests.querySelectorAll('.vr-deny-hand').forEach(btn => {
    btn.onclick = () => socket.emit('voice-room-deny-speaker', { roomId, targetAlias: btn.dataset.alias });
  });

  // Participant list with mute/kick
  participantsList.innerHTML = list.filter(p => p.alias !== selfAlias).map(p => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:0.35rem 0;font-size:0.8rem;">
      <span>${p.role === 'counsellor' ? '🩺' : '👤'} ${escapeHtml(p.alias)}</span>
      <div style="display:flex;gap:4px;">
        <button class="vr-mod-btn" data-action="mute" data-alias="${p.alias}" style="border:none;background:none;cursor:pointer;font-size:0.75rem;" title="Mute">🔇</button>
        <button class="vr-mod-btn" data-action="kick" data-alias="${p.alias}" style="border:none;background:none;cursor:pointer;font-size:0.75rem;" title="Remove">🚫</button>
      </div>
    </div>
  `).join('');

  participantsList.querySelectorAll('.vr-mod-btn').forEach(btn => {
    btn.onclick = () => {
      if (btn.dataset.action === 'mute') socket.emit('voice-room-mute', { roomId, targetAlias: btn.dataset.alias });
      if (btn.dataset.action === 'kick') socket.emit('voice-room-kick', { roomId, targetAlias: btn.dataset.alias });
    };
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, c => map[c]);
}
