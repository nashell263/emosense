/**
 * EmoSense Advanced Sentiment Analysis Engine
 * Multi-signal NLP with contextual understanding, intensity scoring,
 * pattern detection, and conversation-aware emotion tracking.
 * 
 * Designed to achieve ≥75% classification accuracy against labeled data.
 */

import Sentiment from 'sentiment';

const analyzer = new Sentiment();

/* ──────────────────────── Emotion Taxonomy ──────────────────────── */

const EMOTIONS = {
    stress: {
        primary: [
            'stress', 'stressed', 'stressful', 'overwhelming', 'overwhelmed',
            'pressure', 'pressured', 'under pressure', 'burnt out', 'burnout',
            'exhausted', 'overloaded', 'swamped', 'drowning', 'stretched thin',
            'overworked', 'strained', 'tense', 'tension', 'hectic'
        ],
        contextual: [
            'too much', 'cant cope', "can't cope", 'so much to do', 'no time',
            'deadline', 'deadlines', 'behind schedule', 'rushing', 'chaotic',
            'non stop', 'never ending', 'piling up', 'on my plate', 'juggling',
            'barely managing', 'falling apart', 'breaking point', 'snapping',
            'cant keep up', "can't keep up", 'losing it', 'going crazy'
        ],
        phrases: [
            /too much (work|pressure|stress|going on)/i,
            /can'?t (handle|manage|cope|deal|take) (it|this|anymore)/i,
            /everything is (falling apart|too much|overwhelming)/i,
            /i('m| am) (so|really|extremely|very) (stressed|overwhelmed|pressured)/i,
            /don'?t know (how to|what to) (cope|manage|handle|deal)/i,
            /feel(ing)? (like|as if) (i('m| am))? (drowning|suffocating)/i,
            /workload is (too much|killing me|insane|crazy)/i,
        ],
        weight: 1.0,
        intensifiers: { 'very': 1.3, 'really': 1.3, 'extremely': 1.5, 'so': 1.2, 'super': 1.3 }
    },

    anxiety: {
        primary: [
            'anxious', 'anxiety', 'worried', 'worrying', 'worry', 'nervous',
            'panicking', 'panic', 'panic attack', 'scared', 'fearful', 'fear',
            'dread', 'dreading', 'uneasy', 'restless', 'apprehensive',
            'on edge', 'jittery', 'overthinking', 'paranoid'
        ],
        contextual: [
            'racing thoughts', 'what if', 'cant sleep', "can't sleep", 'insomnia',
            'heart racing', 'heart pounding', 'butterflies', 'nauseous',
            'cant breathe', "can't breathe", 'shaking', 'trembling',
            'sweating', 'cold sweat', 'mind racing', 'spiraling',
            'worst case', 'freaking out', 'going to fail', 'something bad'
        ],
        phrases: [
            /i('m| am) (so|really|very)? (anxious|worried|nervous|scared)/i,
            /can'?t stop (worrying|thinking|overthinking|panicking)/i,
            /what if (i|things|it|everything) (fail|goes wrong|doesn'?t work)/i,
            /keep(s)? (worrying|thinking) about/i,
            /afraid (of|that|to)/i,
            /my (heart|mind) (is|won'?t stop) (racing|pounding)/i,
            /can'?t (relax|calm down|stop thinking)/i,
            /feel(ing)? (like|as if) something bad/i,
        ],
        weight: 1.0,
        intensifiers: { 'very': 1.3, 'really': 1.3, 'extremely': 1.5, 'so': 1.2, 'constant': 1.4 }
    },

    depression: {
        primary: [
            'depressed', 'depression', 'hopeless', 'hopelessness', 'empty',
            'numb', 'worthless', 'useless', 'pointless', 'miserable',
            'unhappy', 'despair', 'despairing', 'hollow', 'void',
            'dark', 'darkness', 'bleak', 'gloomy'
        ],
        contextual: [
            'no point', 'give up', 'giving up', 'lost', 'no motivation',
            'unmotivated', 'no energy', 'no interest', 'nothing matters',
            'dont care', "don't care", 'cant feel', "can't feel",
            'tired of life', 'whats the point', "what's the point",
            'not interested', 'dont enjoy', "don't enjoy", 'no purpose',
            'going through the motions', 'existing not living',
            'cant get out of bed', "can't get out of bed"
        ],
        phrases: [
            /i('m| am) (so|really|very)? (depressed|hopeless|empty|numb|miserable)/i,
            /feel(ing)? (like|as if) (there'?s)? no (point|purpose|hope|reason)/i,
            /nothing (matters|makes sense|feels right|interests me)/i,
            /don'?t (see the point|care anymore|feel anything|enjoy anything)/i,
            /life (feels|is|seems) (meaningless|empty|pointless|hopeless)/i,
            /can'?t (feel|enjoy|motivate|get out of bed)/i,
            /lost (interest|motivation|hope|purpose|will)/i,
            /what'?s the point (of|in) (anything|living|trying)/i,
        ],
        weight: 1.3,
        intensifiers: { 'very': 1.3, 'really': 1.3, 'extremely': 1.5, 'so': 1.2, 'deeply': 1.5 }
    },

    sadness: {
        primary: [
            'sad', 'sadness', 'crying', 'tears', 'cry', 'cried',
            'heartbroken', 'hurt', 'hurting', 'pain', 'painful',
            'grief', 'grieving', 'mourning', 'loss', 'missing',
            'sorrow', 'sorrowful', 'weeping', 'sobbing'
        ],
        contextual: [
            'feeling low', 'feeling down', 'down in the dumps',
            'heavy heart', 'broken', 'shattered', 'crushed',
            'miss home', 'miss my family', 'miss my friends',
            'lost someone', 'passed away', 'broke up', 'breakup'
        ],
        phrases: [
            /i('m| am) (so|really|very)? (sad|hurt|heartbroken|devastated)/i,
            /feel(ing)? (so|really|very)? (low|down|blue|terrible)/i,
            /can'?t stop (crying|the tears)/i,
            /my heart (hurts|aches|is broken|is heavy)/i,
            /i (miss|lost) (my|someone|him|her|them)/i,
        ],
        weight: 0.9,
        intensifiers: { 'very': 1.3, 'really': 1.3, 'so': 1.2, 'deeply': 1.5 }
    },

    loneliness: {
        primary: [
            'lonely', 'loneliness', 'alone', 'isolated', 'isolation',
            'friendless', 'outcast', 'rejected', 'abandoned', 'excluded',
            'disconnected', 'invisible'
        ],
        contextual: [
            'no friends', 'left out', 'no one to talk to', 'nobody to talk to',
            'miss home', 'homesick', 'far from home', 'dont belong',
            "don't belong", 'by myself', 'on my own', 'nobody cares',
            'no one cares', 'no one understands', 'nobody understands',
            'misunderstood', 'fitting in', 'outsider', 'stranger'
        ],
        phrases: [
            /i('m| am) (so|really|very)? (lonely|alone|isolated)/i,
            /feel(ing)? (like|as if) (i|nobody) (don'?t belong|no one cares)/i,
            /no one (to talk to|understands|cares|notices)/i,
            /don'?t (have|got) (any)? friends/i,
            /i (miss|want) (home|my family|my friends|someone to talk to)/i,
            /don'?t (fit in|belong|feel welcome)/i,
        ],
        weight: 0.9,
        intensifiers: { 'very': 1.3, 'really': 1.3, 'so': 1.2, 'completely': 1.4 }
    },

    academic_pressure: {
        primary: [
            'failing', 'fail', 'failed', 'flunked', 'grades', 'gpa',
            'academic', 'studying', 'exam', 'exams', 'test', 'tests',
            'assignment', 'assignments', 'dissertation', 'thesis',
            'supplementary', 'repeat', 'retake', 'expelled', 'suspension'
        ],
        contextual: [
            'cant concentrate', "can't concentrate", 'distracted',
            'behind in class', 'poor grades', 'low marks', 'not good enough',
            'stupid', 'dumb', 'academic probation', 'drop out', 'dropout',
            'level 1', 'level 2', 'level 3', 'semester', 'workload',
            'too many assignments', 'barely passing', 'struggling in class',
            'dont understand', "don't understand", 'hard subject'
        ],
        phrases: [
            /i('m| am) (going to|gonna|about to) (fail|flunk|drop out)/i,
            /my grades (are|have been) (bad|poor|low|terrible|dropping)/i,
            /can'?t (understand|grasp|concentrate|focus|study)/i,
            /(too many|so many) (assignments|exams|tests|projects|deadlines)/i,
            /struggling (with|in) (my|this|the) (class|course|subject|module)/i,
            /afraid (of|i'?ll|to) fail/i,
            /academic (pressure|stress|problems|issues|challenges)/i,
        ],
        weight: 1.0,
        intensifiers: { 'really': 1.3, 'so': 1.2, 'extremely': 1.5 }
    },

    financial_stress: {
        primary: [
            'money', 'financial', 'finances', 'broke', 'poor', 'debt',
            'loan', 'loans', 'fees', 'tuition', 'rent', 'bursary',
            'scholarship', 'sponsorship', 'afford'
        ],
        contextual: [
            'cant afford', "can't afford", 'no money', 'hungry', 'starving',
            'food', 'expensive', 'costly', 'registration fees', 'blocked',
            'financial clearance', 'financial aid', 'parent cant pay',
            "parents can't pay", 'working to pay', 'part time job',
            'hustling', 'side hustle', 'broke student', 'loan sharks'
        ],
        phrases: [
            /can'?t (afford|pay for|manage) (my|the|any) (fees|tuition|rent|food|books)/i,
            /no money (for|to|left)/i,
            /financial(ly)? (stressed|struggling|difficult|hard|challenging)/i,
            /(parents?|family|guardian) (can'?t|won'?t|unable to) (pay|afford|help)/i,
            /worried about (money|fees|tuition|rent|finances)/i,
            /don'?t (have|got) (enough)? money/i,
        ],
        weight: 0.9,
        intensifiers: { 'really': 1.3, 'so': 1.2, 'extremely': 1.5 }
    },

    anger: {
        primary: [
            'angry', 'anger', 'furious', 'rage', 'raging', 'mad',
            'frustrated', 'frustration', 'annoyed', 'irritated', 'pissed',
            'hateful', 'bitter', 'resentful', 'disgusted', 'infuriated'
        ],
        contextual: [
            'hate', 'hating', 'unfair', 'injustice', 'unjust', 'mistreated',
            'disrespected', 'fed up', 'sick of', 'tired of', 'had enough',
            'want to scream', 'want to hit', 'explode', 'boiling',
            'fuming', 'seething', 'livid'
        ],
        phrases: [
            /i('m| am) (so|really|very)? (angry|mad|furious|frustrated|annoyed|pissed)/i,
            /(it'?s|this is|that'?s) (so|not|really) (unfair|unjust|wrong)/i,
            /i (hate|can'?t stand|despise) (this|that|it|them|him|her|everything)/i,
            /(fed up|sick|tired) (of|with) (this|that|everything|it|them)/i,
            /makes me (so|really|want to) (angry|mad|scream|explode)/i,
        ],
        weight: 0.8,
        intensifiers: { 'very': 1.3, 'really': 1.3, 'so': 1.2, 'extremely': 1.5 }
    },

    hopeful: {
        primary: [
            'hopeful', 'hope', 'optimistic', 'positive', 'grateful',
            'thankful', 'blessed', 'happy', 'joy', 'joyful', 'excited',
            'motivated', 'inspired', 'proud', 'confident', 'content',
            'relieved', 'peaceful', 'calm', 'good', 'great', 'wonderful',
            'amazing', 'fantastic', 'awesome', 'better'
        ],
        contextual: [
            'getting better', 'improving', 'good day', 'smile', 'smiling',
            'looking forward', 'achievement', 'accomplished', 'progress',
            'growth', 'strong', 'resilient', 'believe', 'faith', 'trust',
            'feeling good', 'feel good', 'feeling great', 'making it',
            'turning around', 'things are better', 'light at the end'
        ],
        phrases: [
            /i('m| am) (feeling|doing) (good|great|better|fine|okay|wonderful|amazing)/i,
            /things are (getting|looking) (better|up|good)/i,
            /i('m| am) (so|really)? (grateful|thankful|blessed|happy|excited|proud)/i,
            /feel(ing)? (hopeful|optimistic|positive|confident|motivated)/i,
            /today (is|was) (a )?(good|great|wonderful|amazing) day/i,
            /thank(s| you) (for|so much)/i,
        ],
        weight: 0.7,
        intensifiers: { 'very': 1.2, 'really': 1.3, 'so': 1.2, 'extremely': 1.4 }
    }
};

/* ──────────────────────── Crisis Detection ──────────────────────── */

const CRISIS_PATTERNS = [
    /\b(suicide|suicidal)\b/i,
    /\b(kill|end) (my|this) (self|life)\b/i,
    /\bwant(s)? to die\b/i,
    /\bdon'?t want to (live|be alive|exist)\b/i,
    /\b(self[- ]?harm|self[- ]?injur|cutting myself|hurting myself)\b/i,
    /\b(overdose|overdosing)\b/i,
    /\bend it all\b/i,
    /\bno reason to (live|go on|continue)\b/i,
    /\bbetter off dead\b/i,
    /\b(planning|plan) to (die|end|kill)\b/i,
    /\b(final|last) goodbye\b/i,
    /\bgoing to (end|kill|harm) (it|myself|my life)\b/i,
    /\bcan'?t (go on|take it|do this) anymore\b/i,
];

/* ──────────────────────── Negation Handling ──────────────────────── */

const NEGATION_WORDS = ['not', "n't", 'no', 'never', 'neither', 'nor', 'none', 'nothing', 'hardly', 'barely', 'without'];
const NEGATION_WINDOW = 3; // words after negation to flip

/* ──────────────────────── Core Analysis ──────────────────────── */

/**
 * Analyze text for emotions and sentiment with multi-signal NLP.
 * Returns detailed analysis with confidence scores.
 */
export function analyzeEmotion(text) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return createEmptyResult();
    }

    const cleanText = text.trim();
    const lowerText = cleanText.toLowerCase();
    const words = lowerText.split(/\s+/);

    // 1. Crisis check (always first)
    const isCrisis = CRISIS_PATTERNS.some(pattern => pattern.test(lowerText));

    // 2. Base sentiment from Sentiment.js
    const sentimentResult = analyzer.analyze(cleanText);

    // 3. Multi-signal emotion detection
    const emotionScores = {};

    for (const [emotionType, config] of Object.entries(EMOTIONS)) {
        let score = 0;
        let matchedSignals = [];
        let intensityMultiplier = 1.0;

        // Signal A: Primary keywords
        for (const keyword of config.primary) {
            const keywordWords = keyword.split(' ');
            if (keywordWords.length === 1) {
                const idx = words.indexOf(keyword);
                if (idx !== -1) {
                    // Check for negation
                    if (!isNegated(words, idx)) {
                        score += 3.0;
                        matchedSignals.push({ type: 'primary', word: keyword });
                        // Check for intensifiers
                        if (idx > 0 && config.intensifiers[words[idx - 1]]) {
                            intensityMultiplier = Math.max(intensityMultiplier, config.intensifiers[words[idx - 1]]);
                        }
                    }
                }
            } else if (lowerText.includes(keyword)) {
                score += 3.5;
                matchedSignals.push({ type: 'primary_phrase', word: keyword });
            }
        }

        // Signal B: Contextual keywords
        for (const keyword of config.contextual) {
            if (lowerText.includes(keyword)) {
                score += 2.0;
                matchedSignals.push({ type: 'contextual', word: keyword });
            }
        }

        // Signal C: Pattern matching (regex phrases)
        for (const pattern of config.phrases) {
            if (pattern.test(lowerText)) {
                score += 4.0;
                matchedSignals.push({ type: 'pattern', pattern: pattern.toString() });
            }
        }

        // Apply intensity multiplier and emotion weight
        score *= intensityMultiplier * config.weight;

        if (score > 0) {
            // Normalize confidence to 0-100
            const confidence = Math.min(Math.round((score / 15) * 100), 100);
            emotionScores[emotionType] = {
                type: emotionType,
                score,
                confidence,
                signals: matchedSignals.length,
                matchedSignals,
                intensity: intensityMultiplier > 1.1 ? 'high' : score > 8 ? 'high' : score > 4 ? 'moderate' : 'low'
            };
        }
    }

    // 4. Sort by score
    const sortedEmotions = Object.values(emotionScores)
        .sort((a, b) => b.score - a.score);

    // 5. Determine overall sentiment
    let sentiment;
    if (sentimentResult.score > 2) sentiment = 'positive';
    else if (sentimentResult.score < -2) sentiment = 'negative';
    else if (sentimentResult.score > 0) sentiment = 'slightly_positive';
    else if (sentimentResult.score < 0) sentiment = 'slightly_negative';
    else sentiment = 'neutral';

    // 6. Determine dominant emotion
    let dominantEmotion = 'neutral';
    if (isCrisis) {
        dominantEmotion = 'crisis';
    } else if (sortedEmotions.length > 0 && sortedEmotions[0].confidence >= 20) {
        dominantEmotion = sortedEmotions[0].type;
    } else if (sentiment === 'positive' || sentiment === 'slightly_positive') {
        dominantEmotion = 'hopeful';
    } else if (sentiment === 'negative' || sentiment === 'slightly_negative') {
        // Try to infer from sentiment score
        dominantEmotion = 'stress';
    }

    // 7. Get secondary emotions
    const secondaryEmotions = sortedEmotions
        .filter((e, i) => i > 0 && e.confidence >= 15)
        .slice(0, 2)
        .map(e => e.type);

    // 8. Compute overall confidence
    const overallConfidence = sortedEmotions.length > 0
        ? sortedEmotions[0].confidence
        : (sentiment !== 'neutral' ? 30 : 10);

    return {
        sentiment,
        sentimentScore: sentimentResult.score,
        sentimentComparative: sentimentResult.comparative,
        emotions: sortedEmotions,
        dominantEmotion,
        secondaryEmotions,
        isCrisis,
        confidence: overallConfidence,
        wordCount: words.length,
        textLength: cleanText.length,
        timestamp: Date.now()
    };
}

/**
 * Check if a word at position idx is negated.
 */
function isNegated(words, idx) {
    for (let i = Math.max(0, idx - NEGATION_WINDOW); i < idx; i++) {
        if (NEGATION_WORDS.some(neg => words[i].includes(neg))) {
            return true;
        }
    }
    return false;
}

/**
 * Create empty analysis result.
 */
function createEmptyResult() {
    return {
        sentiment: 'neutral',
        sentimentScore: 0,
        sentimentComparative: 0,
        emotions: [],
        dominantEmotion: 'neutral',
        secondaryEmotions: [],
        isCrisis: false,
        confidence: 0,
        wordCount: 0,
        textLength: 0,
        timestamp: Date.now()
    };
}

/* ──────────────────────── Conversation Context Tracker ──────────────────────── */

const emotionHistory = [];

/**
 * Track emotion over conversation turns for pattern detection.
 */
export function trackEmotion(analysis) {
    emotionHistory.push({
        emotion: analysis.dominantEmotion,
        confidence: analysis.confidence,
        sentiment: analysis.sentiment,
        timestamp: analysis.timestamp
    });

    // Keep last 20 turns
    if (emotionHistory.length > 20) emotionHistory.shift();
}

/**
 * Get recurring emotional patterns.
 */
export function getEmotionPatterns() {
    if (emotionHistory.length < 2) return null;

    const counts = {};
    emotionHistory.forEach(e => {
        counts[e.emotion] = (counts[e.emotion] || 0) + 1;
    });

    const total = emotionHistory.length;
    const patterns = Object.entries(counts)
        .map(([emotion, count]) => ({
            emotion,
            frequency: count,
            percentage: Math.round((count / total) * 100)
        }))
        .sort((a, b) => b.frequency - a.frequency);

    const dominantPattern = patterns[0];
    const isRecurring = dominantPattern.percentage >= 50 && dominantPattern.frequency >= 2;
    const isEscalating = emotionHistory.length >= 3 &&
        emotionHistory.slice(-3).every(e => ['depression', 'crisis', 'anxiety'].includes(e.emotion));

    return { patterns, dominantPattern, isRecurring, isEscalating };
}

/**
 * Reset emotion history.
 */
export function resetEmotionHistory() {
    emotionHistory.length = 0;
}

/* ──────────────────────── Utility Functions ──────────────────────── */

export function getEmotionLabel(emotionType) {
    const labels = {
        stress: 'Stressed',
        anxiety: 'Anxious',
        depression: 'Depressed',
        sadness: 'Sad',
        loneliness: 'Lonely',
        academic_pressure: 'Academic Pressure',
        financial_stress: 'Financial Concern',
        anger: 'Frustrated',
        hopeful: 'Hopeful',
        neutral: 'Neutral',
        crisis: '⚠ Crisis Detected'
    };
    return labels[emotionType] || 'Processing';
}

export function getEmotionEmoji(emotionType) {
    const emojis = {
        stress: '😰',
        anxiety: '😟',
        depression: '😔',
        sadness: '😢',
        loneliness: '🥺',
        academic_pressure: '📚',
        financial_stress: '💸',
        anger: '😤',
        hopeful: '😊',
        neutral: '😐',
        crisis: '🆘'
    };
    return emojis[emotionType] || '💭';
}

export function getEmotionColor(emotionType) {
    const colors = {
        stress: '#ea580c',
        anxiety: '#d97706',
        depression: '#7c3aed',
        sadness: '#6366f1',
        loneliness: '#8b5cf6',
        academic_pressure: '#dc2626',
        financial_stress: '#ca8a04',
        anger: '#dc2626',
        hopeful: '#059669',
        neutral: '#6b7280',
        crisis: '#dc2626'
    };
    return colors[emotionType] || '#6b7280';
}

export function getSentimentLabel(sentiment) {
    const labels = {
        positive: 'Positive',
        slightly_positive: 'Slightly Positive',
        neutral: 'Neutral',
        slightly_negative: 'Slightly Negative',
        negative: 'Negative'
    };
    return labels[sentiment] || 'Neutral';
}
