/**
 * EmoSense SOS Emergency Button — Complete System
 * Stages: Confirm → Triage → Actions → Location → Waiting + Resources
 */

import { apiPost, getSocketUrl } from '../api.js';
import { io } from 'socket.io-client';

let sosSocket = null;
let currentAlertId = null;
let currentSessionId = null;
let aiChatHistory = [];
let locationWatchId = null;
let localCallStream = null;
let callTimerInterval = null;
let callSeconds = 0;

// Rate limit tracking
function checkRateLimit() {
    const key = 'sos_activations';
    const now = Date.now();
    let activations = JSON.parse(sessionStorage.getItem(key) || '[]');
    activations = activations.filter(t => now - t < 3600000); // Last hour
    if (activations.length >= 3) return false;
    activations.push(now);
    sessionStorage.setItem(key, JSON.stringify(activations));
    return true;
}

export function renderEmergencyButton(container) {
    const sosContainer = document.createElement('div');
    sosContainer.id = 'emergency-button-container';
    sosContainer.innerHTML = `
        <button id="sos-fab" class="sos-fab" title="Emergency Help">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>SOS</span>
        </button>

        <div id="sos-modal" class="sos-modal-overlay" style="display: none;">
            <div class="sos-modal-content">
                <button id="sos-close" class="sos-close-btn">✕</button>

                <!-- Stage 0: Confirmation -->
                <div id="sos-stage-confirm" class="sos-stage">
                    <div class="sos-header">
                        <div class="sos-confirm-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        </div>
                        <h2>Emergency Support</h2>
                        <p class="sos-confirm-text">This button is for <strong>urgent emotional or safety situations</strong>. A counselor will be alerted immediately.</p>
                    </div>
                    <div style="margin:0.75rem 0;">
                        <label style="display:block;font-size:0.85rem;font-weight:600;color:white;margin-bottom:0.35rem;">📱 Your Phone Number <span style='color:#94a3b8;font-weight:400;'>(so a counselor can call you)</span></label>
                        <input type="tel" id="sos-phone-input" placeholder="e.g. 0712 345 678" style="width:100%;padding:0.65rem 0.75rem;border:1px solid rgba(255,255,255,0.15);border-radius:10px;background:rgba(255,255,255,0.08);color:white;font-size:1rem;outline:none;" />
                        <p style="font-size:0.7rem;color:#94a3b8;margin-top:0.25rem;">Your number is shared only with your assigned counselor and deleted after the session.</p>
                    </div>
                    <button class="sos-btn-confirm" id="sos-confirm-btn">I Understand — I Need Help Now</button>
                    <button class="sos-btn-cancel" id="sos-cancel-btn">Cancel</button>
                </div>

                <!-- Stage 1: Triage Questions -->
                <div id="sos-stage-triage" class="sos-stage" style="display: none;">
                    <div class="sos-header">
                        <h2>Help Us Understand</h2>
                        <p>So we can get you the right support as fast as possible.</p>
                    </div>
                    <div class="sos-triage-questions">
                        <div class="sos-triage-q">
                            <span>Are you in immediate danger?</span>
                            <div class="sos-toggle-group">
                                <button class="sos-toggle" data-q="danger" data-v="yes">Yes</button>
                                <button class="sos-toggle active" data-q="danger" data-v="no">No</button>
                            </div>
                        </div>
                        <div class="sos-triage-q">
                            <span>Do you feel like hurting yourself or someone else?</span>
                            <div class="sos-toggle-group">
                                <button class="sos-toggle" data-q="selfharm" data-v="yes">Yes</button>
                                <button class="sos-toggle active" data-q="selfharm" data-v="no">No</button>
                            </div>
                        </div>
                        <div class="sos-triage-q">
                            <span>Do you need urgent emotional support?</span>
                            <div class="sos-toggle-group">
                                <button class="sos-toggle" data-q="urgent" data-v="yes">Yes</button>
                                <button class="sos-toggle active" data-q="urgent" data-v="no">No</button>
                            </div>
                        </div>
                    </div>
                    <div class="sos-severity-bar" id="sos-severity-bar">
                        <span class="severity-label">Severity:</span>
                        <span class="severity-value" id="severity-value">Moderate</span>
                    </div>
                    <button class="sos-btn-confirm" id="sos-triage-next">Continue</button>
                </div>

                <!-- Stage 2: Quick Messages + Actions -->
                <div id="sos-stage-actions" class="sos-stage" style="display: none;">
                    <div class="sos-header">
                        <h2>How Can We Help?</h2>
                        <p>Tap a quick message or choose an action below.</p>
                    </div>
                    <div class="sos-quick-messages">
                        <button class="sos-quick-msg" data-msg="I need help urgently.">🆘 I need help urgently</button>
                        <button class="sos-quick-msg" data-msg="I feel unsafe.">⚠️ I feel unsafe</button>
                        <button class="sos-quick-msg" data-msg="I need someone to talk to now.">💬 I need someone to talk to now</button>
                        <button class="sos-quick-msg" data-msg="I'm having a panic attack.">😰 I'm having a panic attack</button>
                    </div>
                    <div class="sos-action-grid">
                        <button class="sos-action-btn counselor" data-action="counselor" data-calltype="counselor">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            <span>Contact Counsellor Now</span>
                        </button>
                        <button class="sos-action-btn chat" data-action="chat">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            <span>Start Urgent Live Chat</span>
                        </button>
                    </div>
                </div>

                <!-- Stage 3: Location Consent -->
                <div id="sos-stage-location" class="sos-stage" style="display: none;">
                    <div class="sos-header">
                        <div class="sos-location-icon">📍</div>
                        <h2>Share Your Location?</h2>
                        <p>Sharing helps counsellors find you faster during an emergency.</p>
                    </div>
                    <div class="sos-location-info">
                        <div class="sos-info-item"><strong>Why:</strong> So support can reach you quickly</div>
                        <div class="sos-info-item"><strong>Duration:</strong> Only during this emergency session</div>
                        <div class="sos-info-item"><strong>Who sees it:</strong> Only assigned counsellors</div>
                        <div class="sos-info-item"><strong>After:</strong> Location data is deleted when the session ends</div>
                    </div>
                    <button class="sos-btn-confirm" id="sos-share-location">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        Share My Location
                    </button>
                    <button class="sos-btn-skip" id="sos-skip-location">Skip — Don't share</button>
                </div>

                <!-- Stage 4: Waiting + Safety Resources -->
                <div id="sos-stage-waiting" class="sos-stage" style="display: none;">
                    <div class="sos-status-bar" id="sos-status-bar">
                        <div class="pulsing-dot"></div>
                        <span>Alert sent. Connecting to a counselor...</span>
                    </div>
                    <div class="sos-wait-time" id="sos-wait-time">Estimated wait: ~1-2 minutes</div>

                    <!-- Safety Resource Tabs -->
                    <div class="sos-resource-tabs">
                        <button class="sos-tab active" data-tab="breathing">🌬️ Breathing</button>
                        <button class="sos-tab" data-tab="grounding">🧘 Grounding</button>
                        <button class="sos-tab" data-tab="hotlines">📞 Hotlines</button>
                        <button class="sos-tab" data-tab="reassure">💛 Support</button>
                    </div>

                    <div class="sos-tab-content" id="tab-breathing">
                        <div class="sos-breathing-container" id="breathing-ui">
                            <div class="breathing-circle">
                                <div class="breathing-text" id="breathing-text">Breathe In</div>
                            </div>
                            <p style="text-align:center;font-size:0.8rem;color:var(--text-muted);margin-top:0.75rem;">4-7-8 technique: Breathe in for 4s, hold for 7s, exhale for 8s</p>
                        </div>
                    </div>

                    <div class="sos-tab-content" id="tab-grounding" style="display:none;">
                        <div class="sos-grounding">
                            <h3>5-4-3-2-1 Grounding Exercise</h3>
                            <div class="ground-step"><span class="ground-num">5</span> things you can <strong>SEE</strong></div>
                            <div class="ground-step"><span class="ground-num">4</span> things you can <strong>TOUCH</strong></div>
                            <div class="ground-step"><span class="ground-num">3</span> things you can <strong>HEAR</strong></div>
                            <div class="ground-step"><span class="ground-num">2</span> things you can <strong>SMELL</strong></div>
                            <div class="ground-step"><span class="ground-num">1</span> thing you can <strong>TASTE</strong></div>
                            <p style="font-size:0.8rem;color:var(--text-muted);margin-top:0.75rem;">Focus on each one slowly. This brings you back to the present moment.</p>
                        </div>
                    </div>

                    <div class="sos-tab-content" id="tab-hotlines" style="display:none;">
                        <div class="sos-hotlines">
                            <div class="hotline-item"><strong>🏫 MSU Student Affairs</strong><br><a href="tel:+263242260416">+263 242 260 416</a></div>
                            <div class="hotline-item"><strong>🆘 Befrienders Zimbabwe</strong><br><a href="tel:+2634790652">+263 4 790 652</a></div>
                            <div class="hotline-item"><strong>🚑 Emergency Services</strong><br><a href="tel:999">999</a> / <a href="tel:112">112</a></div>
                            <div class="hotline-item"><strong>🌍 Crisis Text Line</strong><br>Text HOME to 741741</div>
                            <div class="hotline-item"><strong>🏥 Childline Zimbabwe</strong><br><a href="tel:116">116</a> (toll free)</div>
                        </div>
                    </div>

                    <div class="sos-tab-content" id="tab-reassure" style="display:none;">
                        <div class="sos-reassurance">
                            <div class="reassure-msg">💛 You are not alone.</div>
                            <div class="reassure-msg">🤝 Someone is on their way to help you.</div>
                            <div class="reassure-msg">🌟 It's okay to feel this way. You took a brave step reaching out.</div>
                            <div class="reassure-msg">🫂 Whatever you're going through, you don't have to face it by yourself.</div>
                            <div class="reassure-msg">🌈 This moment will pass. Help is coming.</div>
                        </div>
                    </div>

                    <!-- AI Chat -->
                    <div class="sos-ai-chat" id="sos-ai-chat">
                        <div class="sos-ai-messages" id="sos-ai-messages">
                            <div class="sos-msg system">
                                <p>I'm here with you. Help is on the way. You can talk to me while we wait.</p>
                            </div>
                        </div>
                        <div class="sos-ai-input-area">
                            <input type="text" id="sos-ai-input" placeholder="Type here..." style="color:#1f2937;background:white;" />
                            <button id="sos-ai-send">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.appendChild(sosContainer);
    attachListeners();
}

// ──────────── State ────────────
let triageAnswers = { danger: false, selfharm: false, urgent: false };
let selectedQuickMsg = '';
let selectedAction = '';
let sharedLocation = null;
let studentPhone = '';

function getSeverity() {
    if (triageAnswers.danger || triageAnswers.selfharm) return 'critical';
    if (triageAnswers.urgent) return 'high';
    return 'moderate';
}

// ──────────── Listeners ────────────
function attachListeners() {
    const fab = document.getElementById('sos-fab');
    const modal = document.getElementById('sos-modal');
    const closeBtn = document.getElementById('sos-close');

    fab.addEventListener('click', () => {
        modal.style.display = 'flex';
        showStage('confirm');
    });

    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeSOSModal(modal);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeSOSModal(modal);
    });

    // Stage 0: Confirmation
    document.getElementById('sos-confirm-btn').addEventListener('click', () => {
        if (!checkRateLimit()) {
            alert('For your safety, SOS is limited to 3 activations per hour. If this is a real emergency, please call 999 or 112 directly.');
            return;
        }
        studentPhone = (document.getElementById('sos-phone-input')?.value || '').trim();
        showStage('triage');
    });
    document.getElementById('sos-cancel-btn').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Stage 1: Triage toggles
    document.querySelectorAll('.sos-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const q = btn.dataset.q;
            const v = btn.dataset.v;
            triageAnswers[q] = (v === 'yes');
            // Update UI
            btn.closest('.sos-toggle-group').querySelectorAll('.sos-toggle').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateSeverityBar();
        });
    });

    document.getElementById('sos-triage-next').addEventListener('click', () => {
        showStage('actions');
    });

    // Stage 2: Quick messages
    document.querySelectorAll('.sos-quick-msg').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sos-quick-msg').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedQuickMsg = btn.dataset.msg;
        });
    });

    // Stage 2: Action buttons — all proceed to location stage AND trigger voice call if applicable
    let selectedCallType = '';
    document.querySelectorAll('.sos-action-btn[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedAction = btn.dataset.action;
            selectedCallType = btn.dataset.calltype || '';

            // Fire Infobip voice call in background (non-blocking) for call-type actions
            if (selectedCallType) {
                apiPost('/api/crisis/voice-call', {
                    callType: selectedCallType,
                    studentAlias: 'Student',
                    severity: getSeverity(),
                    quickMessage: selectedQuickMsg || '',
                    location: sharedLocation?.address || ''
                }).catch(e => console.log('Voice call queued:', e.message));
            }

            showStage('location');
        });
    });

    // Stage 3: Location
    document.getElementById('sos-share-location').addEventListener('click', () => {
        requestLocation().then(() => {
            triggerSOS();
        });
    });
    document.getElementById('sos-skip-location').addEventListener('click', () => {
        triggerSOS();
    });

    // Stage 4: Tabs
    document.querySelectorAll('.sos-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.sos-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.sos-tab-content').forEach(c => c.style.display = 'none');
            document.getElementById(`tab-${tab.dataset.tab}`).style.display = 'block';
        });
    });

    // AI Chat
    document.getElementById('sos-ai-send').addEventListener('click', sendAiMessage);
    document.getElementById('sos-ai-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendAiMessage();
    });
}

function showStage(stage) {
    document.querySelectorAll('.sos-stage').forEach(s => s.style.display = 'none');
    document.getElementById(`sos-stage-${stage}`).style.display = 'block';
    if (stage === 'waiting') startBreathingAnimation();
}

function updateSeverityBar() {
    const severity = getSeverity();
    const el = document.getElementById('severity-value');
    const bar = document.getElementById('sos-severity-bar');
    el.textContent = severity.charAt(0).toUpperCase() + severity.slice(1);
    bar.className = `sos-severity-bar ${severity}`;
}

// ──────────── Location ────────────
async function requestLocation() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) { resolve(); return; }
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                sharedLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude, address: '' };
                // Reverse geocode
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
                    const data = await res.json();
                    sharedLocation.address = data.display_name || `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
                } catch (e) {
                    sharedLocation.address = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
                }
                // Start live tracking
                locationWatchId = navigator.geolocation.watchPosition((p) => {
                    sharedLocation.lat = p.coords.latitude;
                    sharedLocation.lng = p.coords.longitude;
                    if (sosSocket) {
                        sosSocket.emit('sos-location-update', { sessionId: currentSessionId, lat: p.coords.latitude, lng: p.coords.longitude });
                    }
                }, () => {}, { enableHighAccuracy: true, maximumAge: 10000 });
                resolve();
            },
            () => { resolve(); }, // Denied — proceed without
            { enableHighAccuracy: true, timeout: 8000 }
        );
    });
}

function stopLocationTracking() {
    if (locationWatchId !== null) {
        navigator.geolocation.clearWatch(locationWatchId);
        locationWatchId = null;
    }
    sharedLocation = null;
}

// ──────────── Trigger SOS ────────────
async function triggerSOS() {
    showStage('waiting');

    try {
        const res = await apiPost('/api/crisis/sos', {
            contactMethod: selectedAction || 'chat',
            contactInfo: studentPhone,
            isUnsafe: triageAnswers.danger || triageAnswers.selfharm,
            severity: getSeverity(),
            quickMessage: selectedQuickMsg,
            triageAnswers: JSON.stringify(triageAnswers),
            location: sharedLocation,
            studentPhone: studentPhone
        });
        currentAlertId = res.alertId;
        currentSessionId = res.sessionId;
        connectSOSSocket();
    } catch (err) {
        console.error("SOS Trigger Error:", err);
    }
}

// ──────────── Socket ────────────
function connectSOSSocket() {
    if (sosSocket) sosSocket.disconnect();
    sosSocket = io(getSocketUrl());
    sosSocket.emit('join-room', currentSessionId);

    sosSocket.on('new-message', (data) => {
        if (data.sessionId === currentSessionId && data.senderType === 'counselor') {
            appendUiMessage('counselor', data.content);
            const statusBar = document.getElementById('sos-status-bar');
            statusBar.querySelector('span').textContent = 'Counselor Connected';
            statusBar.style.background = 'var(--primary-600)';
            document.getElementById('sos-wait-time').style.display = 'none';
        }
    });

    sosSocket.on('crisis-acknowledged', (data) => {
        if (data.alertId === currentAlertId) {
            const statusBar = document.getElementById('sos-status-bar');
            if (statusBar) {
                statusBar.querySelector('span').textContent = 'A counselor is joining...';
                statusBar.style.background = 'rgba(99,102,241,0.3)';
            }
        }
    });

    // When counselor fully accepts the SOS case — close modal and redirect to live chat
    sosSocket.on('sos-accepted', (data) => {
        const { sessionId, counselorName, counselorId } = data;
        
        // Clean up SOS state
        const modal = document.getElementById('sos-modal');
        if (modal) modal.style.display = 'none';
        stopLocationTracking();
        if (localCallStream) { localCallStream.getTracks().forEach(t => t.stop()); localCallStream = null; }
        if (callTimerInterval) { clearInterval(callTimerInterval); callTimerInterval = null; }
        if (breathingInterval) { clearTimeout(breathingInterval); breathingInterval = null; }
        
        // Store session info for the live chat redirect
        sessionStorage.setItem('sos_redirect', JSON.stringify({
            sessionId,
            counselorId,
            counselorName,
            alias: 'Student-' + (currentSessionId || '').split('_')[1]?.substring(0, 4) || 'Anonymous'
        }));
        
        // Reset SOS state
        currentAlertId = null;
        currentSessionId = null;
        aiChatHistory = [];
        
        // Redirect to counselors page which will pick up the redirect
        window.location.hash = '#counselors';
    });
}

// ──────────── AI Chat ────────────
async function sendAiMessage() {
    const input = document.getElementById('sos-ai-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    appendUiMessage('user', text);

    const statusText = document.getElementById('sos-status-bar')?.querySelector('span')?.textContent || '';
    if (statusText.includes('Connected')) {
        sosSocket.emit('send-message', { sessionId: currentSessionId, senderType: 'user', content: text });
    } else {
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

// ──────────── Breathing ────────────
let breathingInterval;
function startBreathingAnimation() {
    const textEl = document.getElementById('breathing-text');
    if (!textEl) return;
    let phase = 0;
    const phases = ['Breathe In', 'Hold', 'Breathe Out', 'Hold'];
    const durations = [4000, 7000, 8000, 4000];
    if (breathingInterval) clearInterval(breathingInterval);
    const cycle = () => {
        textEl.textContent = phases[phase];
        const circle = textEl.closest('.breathing-circle');
        if (circle) circle.className = `breathing-circle phase-${phase}`;
        const dur = durations[phase];
        phase = (phase + 1) % 4;
        breathingInterval = setTimeout(cycle, dur);
    };
    cycle();
}

// ──────────── Close / Cleanup ────────────
function closeSOSModal(modal) {
    if (currentAlertId) {
        if (!confirm('Are you sure you want to close? Your emergency session will end.')) return;
    }
    modal.style.display = 'none';
    if (sosSocket) sosSocket.disconnect();
    stopLocationTracking();
    if (localCallStream) { localCallStream.getTracks().forEach(t => t.stop()); localCallStream = null; }
    if (callTimerInterval) { clearInterval(callTimerInterval); callTimerInterval = null; }
    if (breathingInterval) { clearTimeout(breathingInterval); breathingInterval = null; }
    currentAlertId = null;
    currentSessionId = null;
    aiChatHistory = [];
    triageAnswers = { danger: false, selfharm: false, urgent: false };
    selectedQuickMsg = '';
    selectedAction = '';
    studentPhone = '';
}
