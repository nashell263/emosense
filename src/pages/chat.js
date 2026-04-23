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
              <h2>EmoSense Counseling Assistant</h2>
              <p><span class="online-dot"></span> Online · Ready to listen</p>
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
            <input type="text" class="chat-input" id="chat-input" placeholder="Share what's on your mind... (Press Enter to send)" autocomplete="off" />
            <button class="chat-send-btn" id="chat-send-btn" disabled aria-label="Send message">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <div class="chat-disclaimer">
            EmoSense is a supplementary tool and does not replace professional counseling. If you're in crisis, please contact emergency services.
          </div>
        </div>
      </div>

      <!-- Wellness Sidebar -->
      <div class="chat-sidebar" id="chat-sidebar">
        <h3 class="sidebar-title">Wellness Support</h3>

        <!-- Emotion Analysis Panel (Layer 1 Output) -->
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
              <span class="detail-label">Primary:</span>
              <span class="detail-value" id="primary-emotion-value">—</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Secondary:</span>
              <span class="detail-value" id="secondary-emotion-value">—</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Intensity:</span>
              <span class="detail-value" id="intensity-value">—</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Trigger:</span>
              <span class="detail-value" id="trigger-value">—</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Risk Level:</span>
              <span class="detail-value" id="risk-level-value">—</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Confidence:</span>
              <span class="detail-value" id="confidence-value">—</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Pattern:</span>
              <span class="detail-value" id="pattern-value">—</span>
            </div>
            <div class="detail-row" id="evidence-row" style="display:none;">
              <span class="detail-label">Evidence:</span>
              <span class="detail-value" id="evidence-value">—</span>
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

  // Enable/disable send button
  input.addEventListener('input', () => {
    sendBtn.disabled = input.value.trim().length === 0;
  });

  // Send message
  const sendMessage = async (text) => {
    const msg = text || input.value.trim();
    if (!msg) return;
    input.value = '';
    sendBtn.disabled = true;

    messageCount++;
    appendMessage('user', msg);

    // Hide starters after first message
    if (starters) starters.style.display = 'none';

    // Show typing
    const typingEl = showTyping(messagesContainer);

    // Run local sentiment analysis in parallel (for sidebar display)
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

    // Try AI API with 15s timeout, fall back to local engine
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, sessionId }),
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

      // Update sidebar with Layer 1 structured emotion data from API
      if (apiResult.emotion) {
        updateEmotionDisplayV2(apiResult.emotion);
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
    
    // Show feedback popup
    showFeedbackPrompt(document.getElementById('chat-messages'), sessionId, 'ai_chat');
  });

  input.focus();
}

/* ──────────────── Helpers ──────────────── */

function appendMessage(role, text) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `chat-message ${role}`;

  const avatarHTML = role === 'bot'
    ? `<div class="message-avatar bot-avatar"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C9 2 7 4 7 6.5c0 1 .3 1.8.8 2.5C6.3 9.8 5 11.3 5 13c0 1.5.8 2.8 2 3.5-.2.5-.3 1-.3 1.5 0 2.2 1.8 4 4 4h2.6c2.2 0 4-1.8 4-4 0-.5-.1-1-.3-1.5 1.2-.7 2-2 2-3.5 0-1.7-1.3-3.2-2.8-3.9.5-.7.8-1.5.8-2.6C17 4 15 2 12 2z"/></svg></div>`
    : `<div class="message-avatar user-avatar"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`;

  div.innerHTML = `
    ${avatarHTML}
    <div class="message-content">
      <div class="message-bubble ${role}-bubble">${formatMessageText(text)}</div>
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
    `${analysis.confidence}% confidence · ${analysis.emotions?.length || 0} signal${(analysis.emotions?.length || 0) !== 1 ? 's' : ''} detected`;

  // Details
  const details = document.getElementById('emotion-details');
  details.style.display = 'block';
  const prim = document.getElementById('primary-emotion-value');
  if (prim) prim.textContent = emotionLabel;
  document.getElementById('confidence-value').textContent = `${analysis.confidence}%`;
}

// Enhanced display using Layer 1 API structured emotion data
function updateEmotionDisplayV2(apiEmotion) {
  const emo = apiEmotion;
  const EMOJI_MAP = { stress: '😰', anxiety: '😟', 'low mood': '😔', neutral: '😊', frustration: '😤', loneliness: '🥺', crisis: '🚨' };
  const COLOR_MAP = { stress: '#ef4444', anxiety: '#f59e0b', 'low mood': '#6366f1', neutral: '#22c55e', frustration: '#ef4444', loneliness: '#8b5cf6', crisis: '#dc2626' };
  const emoji = EMOJI_MAP[emo.primary_emotion] || '💬';
  const color = COLOR_MAP[emo.primary_emotion] || '#6b7280';
  const label = (emo.primary_emotion || 'neutral').replace(/\b\w/g, l => l.toUpperCase());

  // Header badge
  const badge = document.getElementById('emotion-badge');
  const badgeLabel = document.getElementById('emotion-label');
  if (badge) { badge.style.borderColor = color + '40'; badge.style.color = color; }
  if (badgeLabel) badgeLabel.textContent = `${emoji} ${label}`;

  // Sidebar main
  const mainEmoji = document.getElementById('emotion-main-emoji');
  const mainLabel = document.getElementById('emotion-main-label');
  const mainConf = document.getElementById('emotion-confidence');
  if (mainEmoji) mainEmoji.textContent = emoji;
  if (mainLabel) { mainLabel.textContent = label; mainLabel.style.color = color; }
  if (mainConf) mainConf.textContent = `${Math.round((emo.confidence || 0) * 100)}% confidence · Source: ${emo.source || 'AI'}`;

  // Detail rows
  const details = document.getElementById('emotion-details');
  if (details) details.style.display = 'block';
  const prim = document.getElementById('primary-emotion-value');
  if (prim) prim.textContent = `${emoji} ${label}`;
  const sec = document.getElementById('secondary-emotion-value');
  if (sec) sec.textContent = emo.secondary_emotion ? (EMOJI_MAP[emo.secondary_emotion] || '') + ' ' + emo.secondary_emotion : '—';
  const intEl = document.getElementById('intensity-value');
  if (intEl) { intEl.textContent = emo.intensity || 'moderate'; intEl.style.color = emo.intensity === 'high' ? '#ef4444' : emo.intensity === 'moderate' ? '#f59e0b' : '#22c55e'; }
  const trigEl = document.getElementById('trigger-value');
  if (trigEl) trigEl.textContent = emo.trigger_theme ? emo.trigger_theme.replace(/\b\w/g, l => l.toUpperCase()) : '—';
  const riskEl = document.getElementById('risk-level-value');
  if (riskEl) { riskEl.textContent = (emo.risk_level || 'low').toUpperCase(); riskEl.style.color = emo.risk_level === 'high' ? '#dc2626' : emo.risk_level === 'moderate' ? '#f59e0b' : '#22c55e'; }
  const confEl = document.getElementById('confidence-value');
  if (confEl) confEl.textContent = `${Math.round((emo.confidence || 0) * 100)}%`;

  // Pattern data
  const patEl = document.getElementById('pattern-value');
  if (patEl && emo.pattern) {
    const p = emo.pattern;
    const arrows = { worsening: '📈 Worsening', improving: '📉 Improving', stable: '➡️ Stable', insufficient_data: '⏳ Building...' };
    patEl.textContent = arrows[p.trend] || '—';
    if (p.hasPattern) patEl.style.color = '#ef4444';
  }

  // Evidence
  const evRow = document.getElementById('evidence-row');
  const evVal = document.getElementById('evidence-value');
  if (evRow && evVal && emo.evidence?.length > 0) { evRow.style.display = 'flex'; evVal.textContent = emo.evidence.join(', '); }
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

function showFeedbackPrompt(container, sessionId, type) {
    const div = document.createElement('div');
    div.className = 'feedback-prompt';
    div.innerHTML = `
    <h4>How was your experience with EmoSense AI?</h4>
    <div class="feedback-stars" id="feedback-stars" style="margin-bottom: 1rem;">
      ${[1, 2, 3, 4, 5].map(i => `<button class="star-btn" data-rating="${i}" style="font-size: 1.5rem; border: none; background: none; cursor: pointer; opacity: 0.3;">⭐</button>`).join('')}
    </div>
    
    <div style="margin-bottom: 1rem;">
       <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-secondary);">Category</label>
       <div id="feedback-categories" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
           <button class="btn btn-sm btn-outline fb-cat" data-cat="helpful">Helpful/Not Helpful</button>
           <button class="btn btn-sm btn-outline fb-cat" data-cat="ai_accuracy">AI Accuracy</button>
           <button class="btn btn-sm btn-outline fb-cat" data-cat="technical">Technical Issue</button>
       </div>
    </div>

    <textarea id="feedback-comment" class="form-control" placeholder="Any additional comments? (optional)" rows="2" style="width: 100%; margin-bottom: 1rem;"></textarea>
    <button class="btn btn-primary" id="submit-feedback" style="width: 100%;">Submit Feedback</button>
  `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;

    let selectedRating = 0;
    let selectedCategory = 'helpful';

    // Stars logic
    div.querySelectorAll('.star-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedRating = parseInt(btn.dataset.rating);
            div.querySelectorAll('.star-btn').forEach((b, i) => {
                b.style.opacity = i < selectedRating ? '1' : '0.3';
            });
        });
    });

    // Category logic
    div.querySelectorAll('.fb-cat').forEach(btn => {
        btn.addEventListener('click', () => {
            div.querySelectorAll('.fb-cat').forEach(b => {
                b.classList.remove('btn-primary');
                b.classList.add('btn-outline');
            });
            btn.classList.remove('btn-outline');
            btn.classList.add('btn-primary');
            selectedCategory = btn.dataset.cat;
        });
    });
    // Set default
    div.querySelector('.fb-cat').classList.remove('btn-outline');
    div.querySelector('.fb-cat').classList.add('btn-primary');

    document.getElementById('submit-feedback').addEventListener('click', async () => {
        if (selectedRating === 0) return alert('Please select a rating');
        try {
            await apiPost('/api/feedback', {
                sessionType: type,
                sessionId,
                rating: selectedRating,
                category: selectedCategory,
                helpful: selectedRating >= 4,
                comment: document.getElementById('feedback-comment').value.trim()
            });
            div.innerHTML = `
                <div style="text-align: center; padding: 1rem;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">✅</div>
                    <h4 style="color: var(--primary-700); margin-bottom: 0;">Thank you for your feedback!</h4>
                </div>
            `;
        } catch (err) {
            console.error(err);
            alert('Failed to submit feedback.');
        }
    });
}
