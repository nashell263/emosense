/**
 * EmoSense Facial Expression Analyzer
 * Uses face-api.js for optional webcam-based emotion detection.
 * Fully opt-in — no images are stored or transmitted.
 */

let faceApiLoaded = false;
let videoElement = null;
let canvasElement = null;
let stream = null;
let analysisInterval = null;
let onExpressionCallback = null;
let isActive = false;

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights';

/* ──────────────────────── Load Models ──────────────────────── */

async function loadModels() {
    if (faceApiLoaded) return true;

    try {
        const faceapi = await import('face-api.js');
        window.faceapi = faceapi;

        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);

        faceApiLoaded = true;
        console.log('✅ Face-api.js models loaded');
        return true;
    } catch (err) {
        console.error('⚠️ Failed to load face-api.js models:', err.message);
        return false;
    }
}

/* ──────────────────────── Camera Controls ──────────────────────── */

export async function startCamera(containerEl, onExpression) {
    if (isActive) return true;

    onExpressionCallback = onExpression;

    // Load models first
    const modelsReady = await loadModels();
    if (!modelsReady) return false;

    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 160, height: 120, facingMode: 'user' }
        });

        // Create video element
        videoElement = document.createElement('video');
        videoElement.srcObject = stream;
        videoElement.autoplay = true;
        videoElement.muted = true;
        videoElement.playsInline = true;
        videoElement.style.cssText = 'width:160px;height:120px;border-radius:12px;object-fit:cover;';

        // Create canvas for face detection overlay
        canvasElement = document.createElement('canvas');
        canvasElement.width = 160;
        canvasElement.height = 120;
        canvasElement.style.cssText = 'position:absolute;top:0;left:0;width:160px;height:120px;';

        // Add to container
        if (containerEl) {
            containerEl.innerHTML = '';
            containerEl.style.position = 'relative';
            containerEl.appendChild(videoElement);
            containerEl.appendChild(canvasElement);
        }

        // Wait for video to be ready
        await new Promise(resolve => {
            videoElement.onloadedmetadata = resolve;
        });

        isActive = true;
        startAnalysis();
        return true;
    } catch (err) {
        console.error('Camera access error:', err.message);
        return false;
    }
}

export function stopCamera() {
    if (analysisInterval) {
        clearInterval(analysisInterval);
        analysisInterval = null;
    }

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }

    if (videoElement && videoElement.parentNode) {
        videoElement.parentNode.removeChild(videoElement);
    }
    if (canvasElement && canvasElement.parentNode) {
        canvasElement.parentNode.removeChild(canvasElement);
    }

    videoElement = null;
    canvasElement = null;
    isActive = false;
}

export function isCameraActive() {
    return isActive;
}

export function isFaceApiSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/* ──────────────────────── Real-Time Analysis ──────────────────────── */

function startAnalysis() {
    if (!window.faceapi || !videoElement) return;

    const faceapi = window.faceapi;

    // Analyze every 2 seconds to avoid hammering CPU
    analysisInterval = setInterval(async () => {
        if (!isActive || !videoElement) return;

        try {
            const detections = await faceapi
                .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions({ inputSize: 128 }))
                .withFaceExpressions();

            if (detections && detections.expressions) {
                const expressions = detections.expressions;
                const result = processExpressions(expressions);

                if (onExpressionCallback) {
                    onExpressionCallback(result);
                }
            }
        } catch (err) {
            // Silently ignore occasional detection failures
        }
    }, 2000);
}

function processExpressions(expressions) {
    // face-api.js returns: neutral, happy, sad, angry, fearful, disgusted, surprised
    // Map to our emotional categories
    const emotionMap = {
        neutral: { calm: 0.8 },
        happy: { hopeful: 0.7, calm: 0.3 },
        sad: { depression: 0.5, sadness: 0.5 },
        angry: { stress: 0.4, anger: 0.6 },
        fearful: { anxiety: 0.7, stress: 0.3 },
        disgusted: { stress: 0.3, anger: 0.3 },
        surprised: { anxiety: 0.2, stress: 0.1 }
    };

    const scores = {
        stress: 0, anxiety: 0, depression: 0,
        sadness: 0, anger: 0, calm: 0, hopeful: 0
    };

    // Weight each detected expression
    let dominant = 'neutral';
    let dominantScore = 0;

    for (const [expression, score] of Object.entries(expressions)) {
        if (score > dominantScore) {
            dominantScore = score;
            dominant = expression;
        }

        const mapping = emotionMap[expression];
        if (mapping) {
            for (const [emotion, weight] of Object.entries(mapping)) {
                scores[emotion] += score * weight;
            }
        }
    }

    // Normalize
    const max = Math.max(...Object.values(scores), 0.01);
    for (const key in scores) {
        scores[key] = Math.round((scores[key] / max) * 100) / 100;
    }

    return {
        dominant: mapFaceExpression(dominant),
        rawExpression: dominant,
        confidence: Math.round(dominantScore * 100),
        scores
    };
}

function mapFaceExpression(expression) {
    const map = {
        neutral: 'calm',
        happy: 'hopeful',
        sad: 'sadness',
        angry: 'anger',
        fearful: 'anxiety',
        disgusted: 'stress',
        surprised: 'neutral'
    };
    return map[expression] || 'neutral';
}
