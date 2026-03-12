/**
 * EmoSense Chat Page — Complete Redesign
 * Full chat interface with wellness sidebar, timestamps,
 * emotion detection display, conversation starters, and new chat.
 */

import { processMessage, getGreeting, resetConversation, getConversationSummary } from '../engine/chatbot-engine.js';
import { analyzeEmotion, getEmotionLabel, getEmotionEmoji, getEmotionColor, getSentimentLabel } from '../engine/sentiment-engine.js';
import { apiPost } from '../api.js';

let currentEmotion = 'neutral';
let messageCount = 0;
let sessionId = 'session_' + Date.now();
let chatInitialized = false;
let chatMessages = []; // Cache messages for restoration

export function renderChat(container) {
  const isReturning = chatInitialized;

  if (!chatInitialized) {
    resetConversation();
    currentEmotion = 'neutral';
    messageCount = 0;
    sessionId = 'session_' + Date.now();
    chatMessages = [];
    apiPost('/api/chat/reset', { sessionId }).catch(() => { });
    chatInitialized = true;
  }

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
              <h2>EmoSense Pet</h2>
              <p><span class="online-dot"></span> Online Companion</p>
            </div>
          </div>

          <!-- Stats Dashboard -->
          <div class="pet-stats-overlay" id="pet-stats-overlay">
            <div class="stat-item" title="Happiness">
              <span class="stat-icon">❤️</span>
              <div class="stat-progress-bg"><div id="stat-joy" class="stat-progress" style="width: 50%;"></div></div>
            </div>
            <div class="stat-item" title="Intelligence">
              <span class="stat-icon">🧠</span>
              <div class="stat-progress-bg"><div id="stat-intel" class="stat-progress" style="width: 10%;"></div></div>
            </div>
            <div class="stat-item" title="Bond Level">
              <span class="stat-icon">🤝</span>
              <div class="stat-progress-bg"><div id="stat-bond" class="stat-progress" style="width: 1%;"></div></div>
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

        <!-- Emotion Analysis Panel -->
        <div class="sidebar-panel emotion-panel" id="emotion-panel">
          <div class="panel-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C9 2 7 4 7 6.5c0 1 .3 1.8.8 2.5C6.3 9.8 5 11.3 5 13c0 1.5.8 2.8 2 3.5-.2.5-.3 1-.3 1.5 0 2.2 1.8 4 4 4h2.6c2.2 0 4-1.8 4-4 0-.5-.1-1-.3-1.5 1.2-.7 2-2 2-3.5 0-1.7-1.3-3.2-2.8-3.9.5-.7.8-1.5.8-2.6C17 4 15 2 12 2z"/></svg>
            Emotion Analysis
          </div>
          <div class="emotion-display" id="emotion-display">
            <div class="emotion-main-emoji" id="emotion-main-emoji">💬</div>
            <div class="emotion-main-label" id="emotion-main-label">Waiting for input</div>
            <div class="emotion-confidence" id="emotion-confidence">Start chatting to see emotion analysis</div>
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
            <div class="crisis-contact">
              <strong>MSU Counseling Unit:</strong> Visit Student Affairs
            </div>
            <div class="crisis-contact">
              <strong>Zimbabwe Emergency:</strong> 999 / 112
            </div>
            <div class="crisis-contact">
              <strong>Befrienders Zimbabwe:</strong> +263 4 790 652
            </div>
          </div>
        </div>

        <!-- How It Works -->
        <div class="sidebar-panel info-panel">
          <div class="panel-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C9 2 7 4 7 6.5c0 1 .3 1.8.8 2.5C6.3 9.8 5 11.3 5 13c0 1.5.8 2.8 2 3.5-.2.5-.3 1-.3 1.5 0 2.2 1.8 4 4 4h2.6c2.2 0 4-1.8 4-4 0-.5-.1-1-.3-1.5 1.2-.7 2-2 2-3.5 0-1.7-1.3-3.2-2.8-3.9.5-.7.8-1.5.8-2.6C17 4 15 2 12 2z"/></svg>
            How It Works
          </div>
          <p class="info-text">EmoSense uses Natural Language Processing (NLP) and sentiment analysis to understand your emotions from text. It detects patterns of stress, anxiety, depression, and other emotional states to provide personalized support and recommendations.</p>
        </div>

        <!-- Session Stats -->
        <div class="sidebar-panel stats-panel" id="session-stats" style="display: none;">
          <div class="panel-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            Session Summary
          </div>
          <div class="session-stat-row">
            <span>Messages:</span>
            <span id="stat-messages">0</span>
          </div>
          <div class="session-stat-row">
            <span>Topics discussed:</span>
            <span id="stat-topics">—</span>
          </div>
          <div class="session-stat-row">
            <span>Duration:</span>
            <span id="stat-duration">0 min</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Set welcome message
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

  // DOM references
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

  // Voice recording
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

  // Send message
  const sendMessage = async (text) => {
    const msg = text || input.value.trim();
    if (!msg && !currentAttachment) return;
    input.value = '';
    sendBtn.disabled = true;

    const attachment = currentAttachment;
    const replyToId = currentReplyToId;

    // Reset UI
    currentAttachment = null;
    currentReplyToId = null;
    attachmentPreview.style.display = 'none';
    replyPreview.style.display = 'none';

    messageCount++;
    appendMessage('user', msg, attachment, replyToId);

    // Hide starters after first message
    if (starters) starters.style.display = 'none';

    // Show typing
    const typingEl = showTyping(messagesContainer);

    // Send to server (if we had actual socket/api integration for messages)
    // Here we'll just sim AI response
    const localResult = processMessage(msg);
    updateEmotionDisplay(localResult.analysis);

    // ── Emotion Trend Tracking: log to backend ──
    try {
      apiPost('/api/emotions/log', {
        sessionId,
        emotion: localResult.analysis.dominantEmotion,
        confidence: localResult.analysis.confidence,
        sentiment: localResult.analysis.sentiment,
        sentimentScore: localResult.analysis.sentimentScore,
        isCrisis: localResult.analysis.isCrisis,
        messagePreview: msg.substring(0, 100)
      });
    } catch (e) { /* silent */ }

    // ── Crisis Alert: auto-flag dangerous messages ──
    if (localResult.analysis.isCrisis) {
      try {
        apiPost('/api/crisis/alert', {
          sessionId,
          studentAlias: 'Student-' + sessionId.split('_')[1]?.substring(0, 4),
          triggerMessage: msg,
          detectedEmotion: localResult.analysis.dominantEmotion,
          severity: 'critical'
        });
      } catch (e) { /* silent */ }
    }

    // ── Proactive Trend Warning ──
    if (!window._emoNegCount) window._emoNegCount = 0;
    if (['stress', 'anxiety', 'depression', 'sadness'].includes(localResult.analysis.dominantEmotion)) {
      window._emoNegCount++;
    } else {
      window._emoNegCount = 0;
    }

    // Try AI API with 12s timeout, fall back to local engine
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          sessionId,
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
        if (apiResult.petStats) updatePetUI(apiResult.petStats);
      } else {
        appendMessage('bot', localResult.response);
      }
    } catch {
      typingEl.remove();
      appendMessage('bot', localResult.response);
    }

    // ── Proactive message after 3+ negative emotions in a row ──
    if (window._emoNegCount >= 3 && window._emoNegCount % 3 === 0) {
      setTimeout(() => {
        appendMessage('bot', `💚 **I've noticed a pattern of distress in our conversation.** You've been expressing feelings of ${localResult.analysis.dominantEmotion} for several messages now.\n\nThis is not something you have to carry alone. Here are some options:\n\n• **Talk to a real counselor** — [Connect anonymously here](#counselors)\n• **MSU Counseling Unit** — Student Affairs Building (walk-in)\n• **Befrienders Zimbabwe** — +263 4 790 652\n\nYour wellbeing matters. Would you like to talk more about what you're going through, or would you prefer to connect with a counselor?`);
      }, 1500);
    }

    // Show end session button after first message
    const endBtn = document.getElementById('end-session-btn');
    if (endBtn) endBtn.style.display = 'flex';

    updateSessionStats();
  };

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

  // New chat — reset everything
  newChatBtn.addEventListener('click', () => {
    chatInitialized = false;
    chatMessages = [];
    window._emoNegCount = 0;
    renderChat(container);
  });

  // End Session — show summary and thank student
  const endSessionBtn = document.getElementById('end-session-btn');
  endSessionBtn?.addEventListener('click', () => {
    const summary = getConversationSummary();
    const endMsg = `💜 **Thank you for sharing with me today.** This conversation is now ended.\n\n**Session Summary:**\n• Messages exchanged: ${messageCount}\n• Topics discussed: ${summary?.topics?.join(', ') || 'general wellbeing'}\n• Duration: ${Math.round((Date.now() - parseInt(sessionId.split('_')[1])) / 60000)} minutes\n\nRemember:\n• Your feelings are valid\n• Seeking help is a sign of strength\n• You can start a new chat anytime\n\n**If you need human support:**\n• [Talk to a counselor](#counselors)\n• MSU Student Affairs Building (walk-in)\n• Befrienders Zimbabwe: +263 4 790 652\n\nTake care of yourself. 💚`;

    appendMessage('bot', endMsg);

    // Disable input
    input.disabled = true;
    input.placeholder = 'Session ended. Click "New Chat" to start a new conversation.';
    sendBtn.disabled = true;
    endSessionBtn.style.display = 'none';

    // Reset API session
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
    if (attachment.type.startsWith('image/')) {
      attachmentHTML = `<img src="${attachment.url}" class="msg-image" />`;
    } else if (attachment.type.startsWith('audio/')) {
      attachmentHTML = `<audio controls src="${attachment.url}" class="msg-audio"></audio>`;
    } else if (attachment.type.startsWith('video/')) {
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

  // Cache message for restoration
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

function updatePetUI(stats) {
  const joy = document.getElementById('stat-joy');
  const intel = document.getElementById('stat-intel');
  const bond = document.getElementById('stat-bond');
  if (joy) joy.style.width = stats.happiness + '%';
  if (intel) intel.style.width = Math.min(100, (stats.intelligence / 10)) + '%';
  if (bond) bond.style.width = stats.relationship_level + '%';
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
    `${analysis.confidence}% confidence · ${analysis.emotions.length} signal${analysis.emotions.length !== 1 ? 's' : ''} detected`;

  // Details
  const details = document.getElementById('emotion-details');
  details.style.display = 'block';
  document.getElementById('sentiment-value').textContent = getSentimentLabel(analysis.sentiment);
  document.getElementById('confidence-value').textContent = `${analysis.confidence}%`;
  document.getElementById('signals-value').textContent =
    analysis.emotions.length > 0
      ? analysis.emotions.map(e => getEmotionEmoji(e.type)).join(' ')
      : '—';
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
