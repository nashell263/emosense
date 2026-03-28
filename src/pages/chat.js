/**
 * EmoSense Chat Page — Enhanced with Multi-Modal Analysis
 * Features: Voice input (Web Speech API), Camera toggle (face-api.js),
 * Personality modes (gentle/motivational/logical), Language selector (en/sn/nd),
 * Mood-based recommendations, Real-time emotion fusion display.
 */

import { processMessage, getGreeting, resetConversation, getConversationSummary } from '../engine/chatbot-engine.js';
import { analyzeEmotion, getEmotionLabel, getEmotionEmoji, getEmotionColor, getSentimentLabel, fuseMultiModal } from '../engine/sentiment-engine.js';
import { isVoiceSupported, startListening, stopListening, setLanguage as setVoiceLang, getListeningState } from '../engine/voice-analyzer.js';
import { startCamera, stopCamera, isCameraActive, isFaceApiSupported } from '../engine/face-analyzer.js';
import { getRecommendations, getCrisisResources } from '../engine/recommendations.js';
import { apiPost, apiGet } from '../api.js';

let currentEmotion = 'neutral';
let messageCount = 0;
let sessionId = 'session_' + Date.now();
let chatInitialized = false;
let chatMessages = [];
let personalityMode = 'gentle';
let currentLanguage = 'en';
let latestVoiceResult = null;
let latestFaceResult = null;
let currentRecommendations = [];

export function renderChat(container) {
  const isReturning = chatInitialized;

  if (!chatInitialized) {
    resetConversation();
    currentEmotion = 'neutral';
    messageCount = 0;
    sessionId = 'session_' + Date.now();
    chatMessages = [];
    latestVoiceResult = null;
    latestFaceResult = null;
    apiPost('/api/chat/reset', { sessionId }).catch(() => { });
    chatInitialized = true;
  }

  const voiceSupported = isVoiceSupported();
  const cameraSupported = isFaceApiSupported();

  // Load Lite Mode preference
  const USER_ID = 'session_' + (localStorage.getItem('emosense_user_id') || 'test_user');
  apiGet(`/api/preferences/${USER_ID}`).then(prefs => {
    if (prefs.lite_mode) {
      document.body.classList.add('lite-mode');
      // If lite mode, maybe don't auto-start anything
      console.log('Lite mode active: Simplifying UI');
    } else {
      document.body.classList.remove('lite-mode');
    }
  });

  container.innerHTML = `
    <div class="chat-layout">
      <!-- Main Chat Area -->
      <div class="chat-main">
        <!-- Chat Header -->
        <div class="chat-header">
          <div class="chat-header-info">
            <div class="chat-avatar">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C9 2 7 4 7 6.5c0 1 .3 1.8.8 2.5C6.3 9.8 5 11.3 5 13c0 1.5.8 2.8 2 3.5-.2.5-.3 1-.3 1.5 0 2.2 1.8 4 4 4h2.6c2.2 0 4-1.8 4-4 0-.5-.1-1-.3-1.5 1.2-.7 2-2 2-3.5 0-1.7-1.3-3.2-2.8-3.9.5-.7.8-1.5.8-2.6C17 4 15 2 12 2z"/></svg>
            </div>
            <div class="chat-header-text">
              <h2>EmoSense AI</h2>
              <p><span class="online-dot"></span> Your Academic & Mental Support</p>
            </div>
          </div>

          <div class="chat-header-actions">
            <div class="chat-emotion-badge" id="emotion-badge">
              <span class="dot"></span>
              <span id="emotion-label">Ready</span>
            </div>
            <button class="btn-end-session" id="end-session-btn" title="End this session" style="display:none;">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              End Session
            </button>
            <button class="btn-new-chat" id="new-chat-btn" title="Start new conversation">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              New Chat
            </button>
          </div>
        </div>

        <!-- Smart Controls Bar — NEW -->
        <div class="chat-controls-bar" id="chat-controls-bar">
          <div class="control-group">
            <label class="control-label">Personality</label>
            <div class="personality-selector" id="personality-selector">
              <button class="personality-btn active" data-mode="gentle" title="Gentle & Compassionate">🌸 Gentle</button>
              <button class="personality-btn" data-mode="motivational" title="Motivational & Uplifting">💪 Motivational</button>
              <button class="personality-btn" data-mode="logical" title="Logical & Solution-Focused">🧠 Logical</button>
            </div>
          </div>
          <div class="control-group">
            <label class="control-label">Language</label>
            <select class="language-select" id="language-select">
              <option value="en">English</option>
              <option value="sn">Shona</option>
              <option value="nd">Ndebele</option>
            </select>
          </div>
          <div class="control-group control-toggles">
            ${voiceSupported ? `<button class="toggle-btn" id="voice-speech-btn" title="Voice input (speech-to-text)">
              <span class="toggle-icon">🎙️</span>
              <span class="toggle-label">Voice</span>
            </button>` : ''}
            ${cameraSupported ? `<button class="toggle-btn" id="camera-toggle-btn" title="Camera emotion detection (optional)">
              <span class="toggle-icon">📷</span>
              <span class="toggle-label">Camera</span>
            </button>` : ''}
          </div>
        </div>

        <!-- Voice/Camera Status Bar — NEW -->
        <div class="multimodal-status" id="multimodal-status" style="display:none;">
          <div class="modal-signal" id="voice-status" style="display:none;">
            <span class="signal-dot voice-dot"></span>
            <span id="voice-status-text">Voice input active</span>
          </div>
          <div class="modal-signal" id="face-status" style="display:none;">
            <span class="signal-dot face-dot"></span>
            <span id="face-status-text">Camera analyzing</span>
          </div>
          <div class="modal-signal" id="transcription-status" style="display:none;">
            <span class="signal-dot transcription-dot"></span>
            <span id="transcription-text">Listening...</span>
          </div>
        </div>

        <!-- Camera Preview Container — NEW -->
        <div class="camera-preview-container" id="camera-preview" style="display:none;"></div>

        <!-- Messages Container -->
        <div class="chat-messages" id="chat-messages">
          <div class="chat-message bot" id="welcome-msg">
            <div class="message-avatar bot-avatar">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C9 2 7 4 7 6.5c0 1 .3 1.8.8 2.5C6.3 9.8 5 11.3 5 13c0 1.5.8 2.8 2 3.5-.2.5-.3 1-.3 1.5 0 2.2 1.8 4 4 4h2.6c2.2 0 4-1.8 4-4 0-.5-.1-1-.3-1.5 1.2-.7 2-2 2-3.5 0-1.7-1.3-3.2-2.8-3.9.5-.7.8-1.5.8-2.6C17 4 15 2 12 2z"/></svg>
            </div>
            <div class="message-content">
              <div class="message-bubble bot-bubble" id="welcome-message"></div>
              <div class="message-time" id="welcome-time"></div>
            </div>
          </div>
        </div>

        <!-- Recommendations Panel — NEW -->
        <div class="recommendations-panel" id="recommendations-panel" style="display:none;">
          <div class="rec-header">
            <span>💡 Recommended for your current mood</span>
            <button class="rec-close" id="rec-close">&times;</button>
          </div>
          <div class="rec-items" id="rec-items"></div>
        </div>

        <!-- Quick Conversation Starters -->
        <div class="chat-starters" id="chat-starters">
          <div class="starters-label">✨ Quick conversation starters:</div>
          <div class="starters-grid">
            <button class="starter-btn" data-message="I'm feeling stressed about my exams">I'm feeling stressed about my exams</button>
            <button class="starter-btn" data-message="I'm struggling with anxiety">I'm struggling with anxiety</button>
            <button class="starter-btn" data-message="I feel lonely and isolated">I feel lonely and isolated</button>
            <button class="starter-btn" data-message="I'm worried about my finances">I'm worried about my finances</button>
            <button class="starter-btn" data-message="I need help managing academic pressure">I need help managing academic pressure</button>
            <button class="starter-btn" data-message="I'm feeling overwhelmed with everything">I'm feeling overwhelmed with everything</button>
          </div>
        </div>

        <!-- Coping Quick-Access — NEW -->
        <div class="coping-quick-access" id="coping-quick-access" style="display:none;">
          <button class="coping-btn" data-technique="breathing" title="Try a breathing exercise">🫁 Breathe</button>
          <button class="coping-btn" data-technique="grounding" title="5-4-3-2-1 grounding">🖐️ Ground</button>
          <button class="coping-btn" data-technique="halt" title="HALT check">🛑 HALT</button>
          <button class="coping-btn" data-technique="reframe" title="Reframe thoughts">🔄 Reframe</button>
        </div>

        <!-- Input Area -->
        <div class="chat-input-area">
          <div class="chat-input-wrapper">
            <button class="chat-tool-btn" id="attach-btn" title="Attach file">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </button>
            <button class="chat-tool-btn" id="voice-record-btn" title="Record voice note">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </button>
            <input type="text" class="chat-input" id="chat-input" placeholder="Share what's on your mind... (Press Enter to send)" autocomplete="off" />
            <input type="file" id="file-input" style="display: none;" />
            <button class="chat-send-btn" id="chat-send-btn" disabled aria-label="Send message">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <div id="reply-preview" class="reply-preview" style="display: none;">
            <div class="reply-preview-content">
              <span class="reply-label">Replying to:</span>
              <p id="reply-text"></p>
            </div>
            <button id="cancel-reply-btn" class="close-btn">&times;</button>
          </div>
          <div class="attachment-preview" id="attachment-preview" style="display: none;"></div>
          <div class="chat-disclaimer">
            EmoSense is a supplementary tool and does not replace professional counseling. If you're in crisis, please contact emergency services.
          </div>
        </div>
      </div>

      <!-- Wellness Sidebar -->
      <div class="chat-sidebar" id="chat-sidebar">
        <h3 class="sidebar-title">Wellness Support</h3>

        <!-- Multi-Modal Emotion Analysis Panel — ENHANCED -->
        <div class="sidebar-panel emotion-panel" id="emotion-panel">
          <div class="panel-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C9 2 7 4 7 6.5c0 1 .3 1.8.8 2.5C6.3 9.8 5 11.3 5 13c0 1.5.8 2.8 2 3.5-.2.5-.3 1-.3 1.5 0 2.2 1.8 4 4 4h2.6c2.2 0 4-1.8 4-4 0-.5-.1-1-.3-1.5 1.2-.7 2-2 2-3.5 0-1.7-1.3-3.2-2.8-3.9.5-.7.8-1.5.8-2.6C17 4 15 2 12 2z"/></svg>
            Multi-Modal Analysis
          </div>
          <div class="emotion-display" id="emotion-display">
            <div class="emotion-main-emoji" id="emotion-main-emoji">💬</div>
            <div class="emotion-main-label" id="emotion-main-label">Waiting for input</div>
            <div class="emotion-confidence" id="emotion-confidence">Start chatting to see emotion analysis</div>
          </div>
          <div class="emotion-signals-row" id="emotion-signals-row" style="display:none;">
            <span class="signal-badge" id="signal-text" title="Text analysis">📝 Text</span>
            <span class="signal-badge inactive" id="signal-voice" title="Voice analysis">🎙️ Voice</span>
            <span class="signal-badge inactive" id="signal-face" title="Camera analysis">📷 Face</span>
          </div>
          <div class="emotion-details" id="emotion-details" style="display: none;">
            <div class="detail-row">
              <span class="detail-label">Sentiment:</span>
              <span class="detail-value" id="sentiment-value">—</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Confidence:</span>
              <span class="detail-value" id="confidence-value">—</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Intensity:</span>
              <span class="detail-value" id="intensity-value">—</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Signals:</span>
              <span class="detail-value" id="signals-value">—</span>
            </div>
          </div>
        </div>

        <!-- Crisis Support -->
        <div class="sidebar-panel crisis-panel">
          <div class="panel-header crisis-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Crisis Support
          </div>
          <p class="crisis-text">If you or someone you know is in immediate danger:</p>
          <div class="crisis-contacts">
            <div class="crisis-contact"><strong>MSU Counseling Unit:</strong> Visit Student Affairs</div>
            <div class="crisis-contact"><strong>Zimbabwe Emergency:</strong> 999 / 112</div>
            <div class="crisis-contact"><strong>Befrienders Zimbabwe:</strong> +263 4 790 652</div>
          </div>
        </div>

        <!-- Session Stats -->
        <div class="sidebar-panel stats-panel" id="session-stats" style="display: none;">
          <div class="panel-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            Session Summary
          </div>
          <div class="session-stat-row"><span>Messages:</span><span id="stat-messages">0</span></div>
          <div class="session-stat-row"><span>Topics discussed:</span><span id="stat-topics">—</span></div>
          <div class="session-stat-row"><span>Duration:</span><span id="stat-duration">0 min</span></div>
        </div>
      </div>
    </div>
  `;

  // ──── Initialize Welcome ────
  const welcomeEl = document.getElementById('welcome-message');
  welcomeEl.innerHTML = formatMessageText(getGreeting());
  document.getElementById('welcome-time').textContent = formatTime(new Date());

  // Restore cached messages on tab re-entry
  if (isReturning && chatMessages.length > 0) {
    const messagesContainer = document.getElementById('chat-messages');
    const starters = document.getElementById('chat-starters');
    if (starters) starters.style.display = 'none';
    chatMessages.forEach(({ role, text }) => {
      const div = document.createElement('div');
      div.className = `chat-message ${role}`;
      const avatarHTML = role === 'bot'
        ? `<div class="message-avatar bot-avatar"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C9 2 7 4 7 6.5c0 1 .3 1.8.8 2.5C6.3 9.8 5 11.3 5 13c0 1.5.8 2.8 2 3.5-.2.5-.3 1-.3 1.5 0 2.2 1.8 4 4 4h2.6c2.2 0 4-1.8 4-4 0-.5-.1-1-.3-1.5 1.2-.7 2-2 2-3.5 0-1.7-1.3-3.2-2.8-3.9.5-.7.8-1.5.8-2.6C17 4 15 2 12 2z"/></svg></div>`
        : `<div class="message-avatar user-avatar"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`;
      div.innerHTML = `${avatarHTML}<div class="message-content"><div class="message-bubble ${role}-bubble">${formatMessageText(text)}</div></div>`;
      messagesContainer.appendChild(div);
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // ──── DOM references ────
  const messagesContainer = document.getElementById('chat-messages');
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send-btn');
  const starters = document.getElementById('chat-starters');
  const newChatBtn = document.getElementById('new-chat-btn');
  const fileInput = document.getElementById('file-input');
  const attachBtn = document.getElementById('attach-btn');
  const recordBtn = document.getElementById('voice-record-btn');
  const replyPreview = document.getElementById('reply-preview');
  const replyTextEl = document.getElementById('reply-text');
  const cancelReplyBtn = document.getElementById('cancel-reply-btn');
  const attachmentPreview = document.getElementById('attachment-preview');

  let currentReplyToId = null;
  let currentAttachment = null;
  let isRecording = false;
  let mediaRecorder = null;
  let audioChunks = [];

  // ──── Personality Selector — NEW ────
  document.querySelectorAll('.personality-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.personality-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      personalityMode = btn.dataset.mode;

      // Save preference
      apiPost(`/api/preferences/${sessionId}`, { personalityMode }).catch(() => { });
    });
  });

  // ──── Language Selector — NEW ────
  const langSelect = document.getElementById('language-select');
  langSelect.addEventListener('change', () => {
    currentLanguage = langSelect.value;
    setVoiceLang(currentLanguage);
    apiPost(`/api/preferences/${sessionId}`, { language: currentLanguage }).catch(() => { });
  });

  // ──── Voice Speech Input (Web Speech API) — NEW ────
  const voiceSpeechBtn = document.getElementById('voice-speech-btn');
  if (voiceSpeechBtn) {
    voiceSpeechBtn.addEventListener('click', () => {
      if (getListeningState()) {
        stopListening();
        voiceSpeechBtn.classList.remove('active');
        document.getElementById('voice-status').style.display = 'none';
        document.getElementById('transcription-status').style.display = 'none';
        updateMultiModalBar();
      } else {
        const started = startListening(
          // On result
          (result) => {
            latestVoiceResult = result;
            input.value = result.transcript;
            sendBtn.disabled = false;
            input.focus();

            // Update status
            const statusText = document.getElementById('voice-status-text');
            if (statusText) statusText.textContent = `Voice: ${result.speechRate} wpm, ${result.pauseCount} pauses`;
            document.getElementById('transcription-status').style.display = 'none';
          },
          // On status
          (status, data) => {
            const multiBar = document.getElementById('multimodal-status');
            const voiceStatus = document.getElementById('voice-status');
            const transcriptionStatus = document.getElementById('transcription-status');

            if (status === 'listening') {
              multiBar.style.display = 'flex';
              voiceStatus.style.display = 'flex';
              transcriptionStatus.style.display = 'flex';
              document.getElementById('transcription-text').textContent = 'Listening...';
            } else if (status === 'transcribing') {
              document.getElementById('transcription-text').textContent = data || 'Processing...';
            } else if (status === 'stopped') {
              voiceSpeechBtn.classList.remove('active');
              updateMultiModalBar();
            } else if (status === 'error') {
              voiceSpeechBtn.classList.remove('active');
              voiceStatus.style.display = 'none';
              transcriptionStatus.style.display = 'none';
              updateMultiModalBar();
            }
          }
        );
        if (started) {
          voiceSpeechBtn.classList.add('active');
        }
      }
    });
  }

  // ──── Camera Toggle — NEW ────
  const cameraBtn = document.getElementById('camera-toggle-btn');
  const cameraPreview = document.getElementById('camera-preview');
  if (cameraBtn) {
    cameraBtn.addEventListener('click', async () => {
      if (isCameraActive()) {
        stopCamera();
        cameraBtn.classList.remove('active');
        cameraPreview.style.display = 'none';
        document.getElementById('face-status').style.display = 'none';
        latestFaceResult = null;
        updateMultiModalBar();
        updateSignalBadges();
      } else {
        cameraPreview.style.display = 'block';
        const started = await startCamera(cameraPreview, (result) => {
          latestFaceResult = result;
          const faceStatus = document.getElementById('face-status');
          const faceText = document.getElementById('face-status-text');
          faceStatus.style.display = 'flex';
          faceText.textContent = `Face: ${result.dominant} (${result.confidence}%)`;
          updateSignalBadges();
        });

        if (started) {
          cameraBtn.classList.add('active');
          document.getElementById('multimodal-status').style.display = 'flex';
        } else {
          cameraPreview.style.display = 'none';
          alert('Camera access was denied or face detection models failed to load.');
        }
      }
    });
  }

  // ──── Coping Technique Quick Access — NEW ────
  document.querySelectorAll('.coping-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const technique = btn.dataset.technique;
      const techniques = {
        breathing: "Can you guide me through a breathing exercise? I need to calm down.",
        grounding: "I need help grounding myself right now. Can you walk me through the 5-4-3-2-1 technique?",
        halt: "I'm not feeling great. Can you help me do a HALT check?",
        reframe: "I'm stuck in negative thinking. Can you help me reframe my thoughts?"
      };
      sendMessage(techniques[technique] || "I need a coping technique right now.");
    });
  });

  // ──── Recommendations Close — NEW ────
  document.getElementById('rec-close')?.addEventListener('click', () => {
    document.getElementById('recommendations-panel').style.display = 'none';
  });

  // Toggle file input
  attachBtn.addEventListener('click', () => fileInput.click());

  // Handle file upload
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    attachmentPreview.innerHTML = `<span>Uploading ${file.name}...</span>`;
    attachmentPreview.style.display = 'block';

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      currentAttachment = { url: data.url, type: data.type, name: file.name };
      attachmentPreview.innerHTML = `
        <div class="attachment-item">
          <span>${file.name}</span>
          <button id="remove-attach-btn" class="close-btn">&times;</button>
        </div>
      `;
      document.getElementById('remove-attach-btn').onclick = () => {
        currentAttachment = null;
        attachmentPreview.style.display = 'none';
      };
      sendBtn.disabled = false;
    } catch (err) {
      attachmentPreview.innerHTML = `<span style="color: red;">Upload failed</span>`;
    }
  });

  // Voice recording (audio note)
  recordBtn.addEventListener('click', async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const file = new File([audioBlob], 'voice-note.webm', { type: 'audio/webm' });

          attachmentPreview.innerHTML = `<span>Saving voice note...</span>`;
          attachmentPreview.style.display = 'block';

          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/upload', { method: 'POST', body: formData });
          const data = await res.json();
          currentAttachment = { url: data.url, type: 'audio/webm', name: 'Voice Note' };
          attachmentPreview.innerHTML = `
            <div class="attachment-item">
              <span>🎤 Voice Note</span>
              <button id="remove-attach-btn" class="close-btn">&times;</button>
            </div>
          `;
          document.getElementById('remove-attach-btn').onclick = () => {
            currentAttachment = null;
            attachmentPreview.style.display = 'none';
          };
          sendBtn.disabled = false;
          stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorder.start();
        isRecording = true;
        recordBtn.style.color = 'red';
        recordBtn.classList.add('pulse');
      } catch (err) {
        alert('Microphone access denied');
      }
    } else {
      mediaRecorder.stop();
      isRecording = false;
      recordBtn.style.color = '';
      recordBtn.classList.remove('pulse');
    }
  });

  // Reply logic
  messagesContainer.addEventListener('click', (e) => {
    const bubble = e.target.closest('.message-bubble');
    if (!bubble) return;
    const msgId = bubble.dataset.id;
    if (!msgId) return;

    currentReplyToId = msgId;
    replyTextEl.textContent = bubble.textContent.substring(0, 50) + '...';
    replyPreview.style.display = 'flex';
    input.focus();
  });

  cancelReplyBtn.addEventListener('click', () => {
    currentReplyToId = null;
    replyPreview.style.display = 'none';
  });

  // ──── Send Message (Enhanced with multi-modal) ────
  const sendMessage = async (text) => {
    const msg = text || input.value.trim();
    if (!msg && !currentAttachment) return;
    input.value = '';
    sendBtn.disabled = true;

    const attachment = currentAttachment;
    const replyToId = currentReplyToId;

    // Capture current multi-modal signals
    const voiceData = latestVoiceResult;
    const faceData = latestFaceResult;
    latestVoiceResult = null; // Reset after capture

    // Reset UI
    currentAttachment = null;
    currentReplyToId = null;
    attachmentPreview.style.display = 'none';
    replyPreview.style.display = 'none';

    messageCount++;
    appendMessage('user', msg, attachment, replyToId);

    // Hide starters, show coping buttons after first message
    if (starters) starters.style.display = 'none';
    const copingAccess = document.getElementById('coping-quick-access');
    if (copingAccess) copingAccess.style.display = 'flex';

    // Show typing
    const typingEl = showTyping(messagesContainer);

    // Multi-modal emotion analysis — ENHANCED
    const textAnalysis = analyzeEmotion(msg);
    const fusedAnalysis = fuseMultiModal(textAnalysis, voiceData, faceData);
    updateEmotionDisplay(fusedAnalysis);

    // Show recommendations based on detected mood — NEW
    showRecommendations(fusedAnalysis.dominantEmotion, fusedAnalysis.confidence / 100);

    // Log emotion to backend
    try {
      apiPost('/api/emotions/log', {
        sessionId,
        emotion: fusedAnalysis.dominantEmotion,
        confidence: fusedAnalysis.confidence,
        sentiment: fusedAnalysis.sentiment,
        sentimentScore: fusedAnalysis.sentimentScore,
        isCrisis: fusedAnalysis.isCrisis,
        messagePreview: msg.substring(0, 100)
      });
    } catch (e) { }

    // Crisis alert
    if (fusedAnalysis.isCrisis) {
      try {
        apiPost('/api/crisis/alert', {
          sessionId,
          studentAlias: 'Student-' + sessionId.split('_')[1]?.substring(0, 4),
          triggerMessage: msg,
          detectedEmotion: fusedAnalysis.dominantEmotion,
          severity: 'critical'
        });
      } catch (e) { }
    }

    // Proactive trend warning
    if (!window._emoNegCount) window._emoNegCount = 0;
    if (['stress', 'anxiety', 'depression', 'sadness'].includes(fusedAnalysis.dominantEmotion)) {
      window._emoNegCount++;
    } else {
      window._emoNegCount = 0;
    }

    // Process local engine
    const localResult = processMessage(msg);

    // Try AI API with multi-modal data
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          sessionId,
          personalityMode,
          language: currentLanguage,
          attachment,
          replyToId
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      const apiResult = await res.json();
      typingEl.remove();

      if (apiResult.response) {
        appendMessage('bot', apiResult.response);
      } else {
        appendMessage('bot', localResult.response);
      }
    } catch {
      typingEl.remove();
      appendMessage('bot', localResult.response);
    }

    // Proactive message after sustained negative emotions
    if (window._emoNegCount >= 3 && window._emoNegCount % 3 === 0) {
      setTimeout(() => {
        appendMessage('bot', `💚 **I've noticed a pattern of distress in our conversation.** You've been expressing feelings of ${fusedAnalysis.dominantEmotion} for several messages now.\n\nThis is not something you have to carry alone. Here are some options:\n\n• **Talk to a real counselor** — [Connect anonymously here](#counselors)\n• **MSU Counseling Unit** — Student Affairs Building (walk-in)\n• **Befrienders Zimbabwe** — +263 4 790 652\n\nYour wellbeing matters. Would you like to talk more about what you're going through, or would you prefer to connect with a counselor?`);
      }, 1500);
    }

    // Show end session button
    const endBtn = document.getElementById('end-session-btn');
    if (endBtn) endBtn.style.display = 'flex';

    updateSessionStats();
  };

  // Input enable/disable
  input.addEventListener('input', () => {
    sendBtn.disabled = !input.value.trim();
  });

  sendBtn.addEventListener('click', () => sendMessage());
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Starter buttons
  document.querySelectorAll('.starter-btn').forEach(btn => {
    btn.addEventListener('click', () => sendMessage(btn.dataset.message));
  });

  // New chat
  newChatBtn.addEventListener('click', () => {
    if (isCameraActive()) stopCamera();
    if (getListeningState()) stopListening();
    chatInitialized = false;
    chatMessages = [];
    window._emoNegCount = 0;
    renderChat(container);
  });

  // End Session
  const endSessionBtn = document.getElementById('end-session-btn');
  endSessionBtn?.addEventListener('click', () => {
    const summary = getConversationSummary();
    const endMsg = `💜 **Thank you for sharing with me today.** This conversation is now ended.\n\n**Session Summary:**\n• Messages exchanged: ${messageCount}\n• Topics discussed: ${summary?.topics?.join(', ') || 'general wellbeing'}\n• Duration: ${Math.round((Date.now() - parseInt(sessionId.split('_')[1])) / 60000)} minutes\n\nRemember:\n• Your feelings are valid\n• Seeking help is a sign of strength\n• You can start a new chat anytime\n\n**If you need human support:**\n• [Talk to a counselor](#counselors)\n• MSU Student Affairs Building (walk-in)\n• Befrienders Zimbabwe: +263 4 790 652\n\nTake care of yourself. 💚`;

    appendMessage('bot', endMsg);

    if (isCameraActive()) stopCamera();
    if (getListeningState()) stopListening();

    input.disabled = true;
    input.placeholder = 'Session ended. Click "New Chat" to start a new conversation.';
    sendBtn.disabled = true;
    endSessionBtn.style.display = 'none';

    apiPost('/api/chat/reset', { sessionId }).catch(() => { });
  });

  input.focus();
}

/* ──────────────── Helpers ──────────────── */

function appendMessage(role, text, attachment = null, replyToId = null) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  const id = Date.now();
  div.className = `chat-message ${role}`;

  let attachmentHTML = '';
  if (attachment) {
    if (attachment.type?.startsWith('image/')) {
      attachmentHTML = `<img src="${attachment.url}" class="msg-image" />`;
    } else if (attachment.type?.startsWith('audio/')) {
      attachmentHTML = `<audio controls src="${attachment.url}" class="msg-audio"></audio>`;
    } else if (attachment.type?.startsWith('video/')) {
      attachmentHTML = `<video controls src="${attachment.url}" class="msg-video"></video>`;
    } else {
      attachmentHTML = `<a href="${attachment.url}" target="_blank" class="msg-file">📎 ${attachment.name || 'File'}</a>`;
    }
  }

  let replyHTML = '';
  if (replyToId) {
    replyHTML = `<div class="reply-context">Replying to a previous message...</div>`;
  }

  const avatarHTML = role === 'bot'
    ? `<div class="message-avatar bot-avatar"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C9 2 7 4 7 6.5c0 1 .3 1.8.8 2.5C6.3 9.8 5 11.3 5 13c0 1.5.8 2.8 2 3.5-.2.5-.3 1-.3 1.5 0 2.2 1.8 4 4 4h2.6c2.2 0 4-1.8 4-4 0-.5-.1-1-.3-1.5 1.2-.7 2-2 2-3.5 0-1.7-1.3-3.2-2.8-3.9.5-.7.8-1.5.8-2.6C17 4 15 2 12 2z"/></svg></div>`
    : `<div class="message-avatar user-avatar"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`;

  div.innerHTML = `
    ${avatarHTML}
    <div class="message-content">
      <div class="message-bubble ${role}-bubble" data-id="${id}">
        ${replyHTML}
        ${formatMessageText(text)}
        ${attachmentHTML}
      </div>
      <div class="message-time">${formatTime(new Date())}</div>
    </div>
  `;

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  chatMessages.push({ role, text });
}

function showTyping(container) {
  const div = document.createElement('div');
  div.className = 'chat-message bot typing-msg';
  div.innerHTML = `
    <div class="message-avatar bot-avatar">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C9 2 7 4 7 6.5c0 1 .3 1.8.8 2.5C6.3 9.8 5 11.3 5 13c0 1.5.8 2.8 2 3.5-.2.5-.3 1-.3 1.5 0 2.2 1.8 4 4 4h2.6c2.2 0 4-1.8 4-4 0-.5-.1-1-.3-1.5 1.2-.7 2-2 2-3.5 0-1.7-1.3-3.2-2.8-3.9.5-.7.8-1.5.8-2.6C17 4 15 2 12 2z"/></svg>
    </div>
    <div class="message-content">
      <div class="typing-indicator"><span></span><span></span><span></span></div>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function updateEmotionDisplay(analysis) {
  // Header badge
  const badge = document.getElementById('emotion-badge');
  const label = document.getElementById('emotion-label');
  const emoji = getEmotionEmoji(analysis.dominantEmotion);
  const emotionLabel = getEmotionLabel(analysis.dominantEmotion);
  label.textContent = `${emoji} ${emotionLabel}`;

  const color = getEmotionColor(analysis.dominantEmotion);
  badge.style.borderColor = color + '40';
  badge.style.color = color;

  // Sidebar display
  document.getElementById('emotion-main-emoji').textContent = emoji;
  document.getElementById('emotion-main-label').textContent = emotionLabel;
  document.getElementById('emotion-main-label').style.color = color;
  document.getElementById('emotion-confidence').textContent =
    `${analysis.confidence}% confidence · ${analysis.intensity || 'moderate'} intensity`;

  // Signal badges
  updateSignalBadges(analysis);

  // Details
  const details = document.getElementById('emotion-details');
  details.style.display = 'block';
  document.getElementById('sentiment-value').textContent = getSentimentLabel(analysis.sentiment);
  document.getElementById('confidence-value').textContent = `${analysis.confidence}%`;
  document.getElementById('intensity-value').textContent = analysis.intensity || 'moderate';
  document.getElementById('signals-value').textContent =
    (analysis.emotions?.length > 0
      ? analysis.emotions.map(e => getEmotionEmoji(e.type)).join(' ')
      : '—') +
    (analysis.signals?.voice ? ' 🎙️' : '') +
    (analysis.signals?.face ? ' 📷' : '');
}

function updateSignalBadges(analysis) {
  const row = document.getElementById('emotion-signals-row');
  if (row) row.style.display = 'flex';

  const textBadge = document.getElementById('signal-text');
  const voiceBadge = document.getElementById('signal-voice');
  const faceBadge = document.getElementById('signal-face');

  if (textBadge) textBadge.classList.remove('inactive');
  if (voiceBadge) {
    voiceBadge.classList.toggle('inactive', !analysis?.signals?.voice && !latestVoiceResult);
  }
  if (faceBadge) {
    faceBadge.classList.toggle('inactive', !analysis?.signals?.face && !latestFaceResult);
  }
}

function showRecommendations(emotion, intensity) {
  const panel = document.getElementById('recommendations-panel');
  const itemsContainer = document.getElementById('rec-items');
  if (!panel || !itemsContainer) return;
  if (emotion === 'neutral' || emotion === 'hopeful') {
    panel.style.display = 'none';
    return;
  }

  const recs = getRecommendations(emotion, intensity, 3);
  if (recs.length === 0) {
    panel.style.display = 'none';
    return;
  }

  currentRecommendations = recs;
  itemsContainer.innerHTML = recs.map((rec, i) => `
    <div class="rec-item" data-idx="${i}">
      <span class="rec-icon">${rec.icon}</span>
      <div class="rec-info">
        <div class="rec-title">${rec.title}</div>
        <div class="rec-desc">${rec.description}</div>
        <span class="rec-duration">${rec.duration}</span>
      </div>
    </div>
  `).join('');

  // Click to expand
  itemsContainer.querySelectorAll('.rec-item').forEach(item => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.dataset.idx);
      const rec = currentRecommendations[idx];
      if (rec) {
        let details = '';
        if (rec.steps) {
          details = rec.steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
        } else if (rec.items) {
          details = rec.items.map(s => `• ${s}`).join('\n');
        } else if (rec.content) {
          details = rec.content;
        }
        appendMessage('bot', `${rec.icon} **${rec.title}** (${rec.duration})\n\n${rec.description}\n\n${details}`);
      }
    });
  });

  panel.style.display = 'block';
}

function updateMultiModalBar() {
  const bar = document.getElementById('multimodal-status');
  const voiceStatus = document.getElementById('voice-status');
  const faceStatus = document.getElementById('face-status');
  const transStatus = document.getElementById('transcription-status');

  const anyActive = (voiceStatus?.style.display !== 'none') ||
    (faceStatus?.style.display !== 'none') ||
    (transStatus?.style.display !== 'none');
  if (bar) bar.style.display = anyActive ? 'flex' : 'none';
}

function updateSessionStats() {
  const summary = getConversationSummary();
  const statsPanel = document.getElementById('session-stats');
  if (summary.turnCount >= 2) {
    statsPanel.style.display = 'block';
    document.getElementById('stat-messages').textContent = messageCount;
    document.getElementById('stat-topics').textContent =
      summary.topics.length > 0
        ? summary.topics.map(t => getEmotionLabel(t)).join(', ')
        : 'General';
    document.getElementById('stat-duration').textContent = `${Math.max(1, summary.duration)} min`;
  }
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatMessageText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^• (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\.\s+(.+)$/gm, '<li><strong>$1.</strong> $2</li>')
    .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^(.+)/, '<p>$1')
    .replace(/(.+)$/, '$1</p>');
}
