import { apiPost, getSocketUrl } from '../api.js';
import { io } from 'socket.io-client';

let sosSocket = null;
let currentAlertId = null;
let currentSessionId = null;
let aiChatHistory = [];

export function renderEmergencyButton(container) {
    const sosContainer = document.createElement('div');
    sosContainer.id = 'emergency-button-container';
    sosContainer.innerHTML = `
        <button id="sos-fab" class="sos-fab" title="Emergency Help">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>SOS</span>
        </button>

        <div id="sos-modal" class="sos-modal-overlay" style="display: none;">
            <div class="sos-modal-content">
                <button id="sos-close" class="sos-close-btn">✕</button>
                
                <!-- Stage 1: Action Selection -->
                <div id="sos-stage-select" class="sos-stage">
                    <div class="sos-header">
                        <h2>Emergency Support</h2>
                        <p>We are here for you right now. How would you like us to help?</p>
                    </div>
                    
                    <div class="sos-options">
                        <button class="sos-btn-option bg-unsafe" data-action="unsafe">
                            <span class="icon">⚠️</span>
                            <div>
                                <strong>I am unsafe right now</strong>
                                <small>Get highest priority immediate connection</small>
                            </div>
                        </button>
                        
                        <button class="sos-btn-option" data-action="call">
                            <span class="icon">📞</span>
                            <div>
                                <strong>Call me now</strong>
                                <small>A counselor will call you</small>
                            </div>
                        </button>

                        <button class="sos-btn-option" data-action="chat">
                            <span class="icon">💬</span>
                            <div>
                                <strong>Start urgent live chat</strong>
                                <small>Text with a counselor instantly</small>
                            </div>
                        </button>

                        <button class="sos-btn-option" data-action="calm">
                            <span class="icon">🌬️</span>
                            <div>
                                <strong>I need calming support now</strong>
                                <small>Guided exercises and AI support</small>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- Stage 2: Contact Form (For Call) -->
                <div id="sos-stage-contact" class="sos-stage" style="display: none;">
                    <h2>How should we contact you?</h2>
                    <p>Provide a phone number for an urgent callback, or use the browser audio.</p>
                    
                    <input type="tel" id="sos-phone" class="sos-input" placeholder="e.g. 0712... (Optional)" />
                    
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <button class="btn btn-primary" id="btn-submit-call" style="flex: 1;">Request Call</button>
                        <button class="btn btn-outline" id="btn-browser-call" style="flex: 1;">Use Browser Audio</button>
                    </div>
                </div>

                <!-- Stage 3: Waiting / Calming -->
                <div id="sos-stage-waiting" class="sos-stage" style="display: none;">
                    <div class="sos-status-bar">
                        <div class="pulsing-dot"></div>
                        <span>Alert sent. Connecting securely...</span>
                    </div>

                    <div class="sos-breathing-container" id="breathing-ui" style="display: none;">
                        <div class="breathing-circle">
                            <div class="breathing-text" id="breathing-text">Breathe In</div>
                        </div>
                    </div>

                    <div class="sos-ai-chat" id="sos-ai-chat">
                        <div class="sos-ai-messages" id="sos-ai-messages">
                            <div class="sos-msg system">
                                <p>I am here with you. Help is on the way (usually 1-2 mins). You can talk to me while we wait.</p>
                            </div>
                        </div>
                        <div class="sos-ai-input-area">
                            <input type="text" id="sos-ai-input" placeholder="Type here..." />
                            <button id="sos-ai-send">→</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.appendChild(sosContainer);
    attachListeners();
}

function attachListeners() {
    const fab = document.getElementById('sos-fab');
    const modal = document.getElementById('sos-modal');
    const closeBtn = document.getElementById('sos-close');

    fab.addEventListener('click', () => {
        modal.style.display = 'flex';
        document.getElementById('sos-stage-select').style.display = 'block';
        document.getElementById('sos-stage-contact').style.display = 'none';
        document.getElementById('sos-stage-waiting').style.display = 'none';
    });

    closeBtn.addEventListener('click', () => {
        if (currentAlertId) {
            if (!confirm('Are you sure you want to cancel the emergency request?')) return;
            // Optionally, we could send a cancel request here
        }
        modal.style.display = 'none';
        if (sosSocket) sosSocket.disconnect();
    });

    // Option Buttons
    document.querySelectorAll('.sos-btn-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            if (action === 'call') {
                showContactForm();
            } else if (action === 'unsafe') {
                triggerSOS('unsafe', 'Priority Urgent');
            } else if (action === 'chat') {
                triggerSOS('chat', '');
            } else if (action === 'calm') {
                triggerSOS('calm', ''); // STILL alert counselors, but show calming primarily
            }
        });
    });

    document.getElementById('btn-submit-call').addEventListener('click', () => {
        const phone = document.getElementById('sos-phone').value;
        triggerSOS('call', phone);
    });

    document.getElementById('btn-browser-call').addEventListener('click', () => {
        triggerSOS('browser-call', '');
    });

    // AI Chat Send
    document.getElementById('sos-ai-send').addEventListener('click', sendAiMessage);
    document.getElementById('sos-ai-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendAiMessage();
    });
}

function showContactForm() {
    document.getElementById('sos-stage-select').style.display = 'none';
    document.getElementById('sos-stage-contact').style.display = 'block';
}

async function triggerSOS(method, info) {
    document.getElementById('sos-stage-select').style.display = 'none';
    document.getElementById('sos-stage-contact').style.display = 'none';
    document.getElementById('sos-stage-waiting').style.display = 'block';

    // Show AI/Breathing based on method
    if (method === 'calm') {
        document.getElementById('breathing-ui').style.display = 'flex';
        startBreathingAnimation();
    }

    try {
        const res = await apiPost('/api/crisis/sos', {
            contactMethod: method,
            contactInfo: info,
            isUnsafe: method === 'unsafe'
        });
        currentAlertId = res.alertId;
        currentSessionId = res.sessionId;
        
        connectSOSSocket();
    } catch (err) {
        console.error("SOS Trigger Error:", err);
    }
}

function connectSOSSocket() {
    if (sosSocket) sosSocket.disconnect();
    sosSocket = io(getSocketUrl());

    // Join room for this specific session so counselor can chat 
    sosSocket.emit('join-room', currentSessionId);

    sosSocket.on('new-message', (data) => {
        if (data.sessionId === currentSessionId && data.senderType === 'counselor') {
            appendUiMessage('counselor', data.content);
            // Hide breathing UI if counselor arrived
            document.getElementById('breathing-ui').style.display = 'none';
            document.querySelector('.sos-status-bar span').textContent = 'Counselor Connected';
            document.querySelector('.sos-status-bar').style.background = 'var(--primary-600)';
        }
    });

    sosSocket.on('crisis-acknowledged', (data) => {
        if (data.alertId === currentAlertId) {
            document.querySelector('.sos-status-bar span').textContent = 'A Counselor is joining the chat...';
        }
    });
}

async function sendAiMessage() {
    const input = document.getElementById('sos-ai-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    appendUiMessage('user', text);
    
    // Check if counseling live chat has taken over
    const statusText = document.querySelector('.sos-status-bar span').textContent;
    if (statusText.includes('Connected')) {
        // Send to real counselor
        sosSocket.emit('send-message', {
            sessionId: currentSessionId,
            senderType: 'user',
            content: text
        });
    } else {
        // Send to OpenAI Calming Bot
        const msgsData = [...aiChatHistory];
        aiChatHistory.push({ sender: 'user', text });

        const loadingId = 'ai-load-' + Date.now();
        appendUiMessage('system', '...', loadingId);

        try {
            const res = await apiPost('/api/crisis/chat', { message: text, history: msgsData });
            document.getElementById(loadingId)?.remove();
            
            appendUiMessage('system', res.response);
            aiChatHistory.push({ sender: 'assistant', text: res.response });
        } catch (e) {
            document.getElementById(loadingId)?.remove();
        }
    }
}

function appendUiMessage(sender, text, id = null) {
    const container = document.getElementById('sos-ai-messages');
    const div = document.createElement('div');
    if (id) div.id = id;
    div.className = `sos-msg ${sender}`;
    div.innerHTML = `<p>${text}</p>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

let breathingInterval;
function startBreathingAnimation() {
    const textEl = document.getElementById('breathing-text');
    let phase = 0; // 0=in, 1=hold, 2=out, 3=hold
    const phases = ['Breathe In', 'Hold', 'Breathe Out', 'Hold'];
    
    clearInterval(breathingInterval);
    textEl.style.transition = 'opacity 0.5s';
    
    breathingInterval = setInterval(() => {
        textEl.style.opacity = 0;
        setTimeout(() => {
            phase = (phase + 1) % 4;
            textEl.textContent = phases[phase];
            textEl.style.opacity = 1;
        }, 500);
    }, 4000);
}
