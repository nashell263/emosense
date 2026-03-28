/**
 * EmoSense Voice Analyzer
 * Uses Web Speech API for voice-to-text + prosodic analysis.
 * Detects speech rate, pauses, and emotional cues from voice patterns.
 */

let recognition = null;
let isListening = false;
let onResultCallback = null;
let onStatusCallback = null;
let speechStartTime = 0;
let totalWords = 0;
let pauseCount = 0;
let lastSpeechTime = 0;
const PAUSE_THRESHOLD = 1500; // ms — longer than this counts as an emotional pause

/* ──────────────────────── Feature Detection ──────────────────────── */

export function isVoiceSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/* ──────────────────────── Initialize ──────────────────────── */

export function initVoiceAnalyzer(options = {}) {
    if (!isVoiceSupported()) {
        console.warn('⚠️ Web Speech API not supported in this browser');
        return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = options.lang || 'en-US';
    recognition.maxAlternatives = 1;

    // Track speech timing
    recognition.onstart = () => {
        isListening = true;
        speechStartTime = Date.now();
        totalWords = 0;
        pauseCount = 0;
        lastSpeechTime = Date.now();
        if (onStatusCallback) onStatusCallback('listening');
    };

    recognition.onresult = (event) => {
        const now = Date.now();

        // Detect pauses (gap between speech segments)
        if (lastSpeechTime && (now - lastSpeechTime) > PAUSE_THRESHOLD) {
            pauseCount++;
        }
        lastSpeechTime = now;

        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
                finalTranscript += result[0].transcript;
            } else {
                interimTranscript += result[0].transcript;
            }
        }

        if (interimTranscript && onStatusCallback) {
            onStatusCallback('transcribing', interimTranscript);
        }

        if (finalTranscript) {
            totalWords += finalTranscript.trim().split(/\s+/).length;
            const durationSec = (Date.now() - speechStartTime) / 1000;
            const speechRate = durationSec > 0 ? Math.round((totalWords / durationSec) * 60) : 0;

            const analysis = analyzeVoicePatterns(finalTranscript, speechRate, pauseCount, durationSec);

            if (onResultCallback) {
                onResultCallback({
                    transcript: finalTranscript.trim(),
                    speechRate,
                    pauseCount,
                    durationSeconds: Math.round(durationSec),
                    voiceToneSignals: analysis,
                    confidence: event.results[event.results.length - 1][0].confidence || 0.5
                });
            }
        }
    };

    recognition.onerror = (event) => {
        console.error('Voice recognition error:', event.error);
        isListening = false;
        if (onStatusCallback) onStatusCallback('error', event.error);
    };

    recognition.onend = () => {
        isListening = false;
        if (onStatusCallback) onStatusCallback('stopped');
    };

    return true;
}

/* ──────────────────────── Controls ──────────────────────── */

export function startListening(onResult, onStatus) {
    if (!recognition) {
        if (!initVoiceAnalyzer()) return false;
    }
    onResultCallback = onResult;
    onStatusCallback = onStatus;

    try {
        recognition.start();
        return true;
    } catch (e) {
        console.error('Failed to start voice recognition:', e);
        return false;
    }
}

export function stopListening() {
    if (recognition && isListening) {
        recognition.stop();
    }
}

export function setLanguage(langCode) {
    if (recognition) {
        // Map our language codes to speech recognition codes
        const langMap = {
            'en': 'en-US',
            'sn': 'en-US', // Shona — fallback to English recognition, AI handles translation
            'nd': 'en-US', // Ndebele — same fallback
        };
        recognition.lang = langMap[langCode] || langCode;
    }
}

export function getListeningState() {
    return isListening;
}

/* ──────────────────────── Voice Pattern Analysis ──────────────────────── */

function analyzeVoicePatterns(transcript, speechRate, pauses, durationSec) {
    const signals = {
        stress: 0,
        anxiety: 0,
        depression: 0,
        calm: 0,
        agitation: 0
    };

    // Speech rate analysis
    // Normal: 120-150 wpm, Fast (anxious): >170 wpm, Slow (depressed): <90 wpm
    if (speechRate > 170) {
        signals.anxiety += 0.4;
        signals.agitation += 0.3;
    } else if (speechRate > 150) {
        signals.stress += 0.2;
        signals.anxiety += 0.2;
    } else if (speechRate < 90) {
        signals.depression += 0.4;
        signals.calm += 0.1;
    } else if (speechRate < 60) {
        signals.depression += 0.6;
    } else {
        signals.calm += 0.3;
    }

    // Pause analysis — many pauses suggest hesitation, sadness, or deep thought
    const pauseRate = durationSec > 0 ? pauses / (durationSec / 60) : 0;
    if (pauseRate > 5) {
        signals.depression += 0.3;
        signals.stress += 0.2;
    } else if (pauseRate > 3) {
        signals.stress += 0.1;
    }

    // Short utterances may indicate withdrawal
    const wordCount = transcript.split(/\s+/).length;
    if (wordCount < 5 && durationSec > 3) {
        signals.depression += 0.2;
    }

    // Normalize to 0-1
    const max = Math.max(...Object.values(signals), 0.01);
    for (const key in signals) {
        signals[key] = Math.round((signals[key] / max) * 100) / 100;
    }

    return signals;
}
