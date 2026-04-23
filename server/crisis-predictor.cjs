/**
 * EmoSense Crisis Prediction Engine
 * Uses behavioral data (usage patterns, language changes, emotion trends)
 * to predict potential emotional breakdowns and trigger proactive alerts.
 * 
 * Signals analyzed:
 * 1. Emotion trajectory (sustained negative trends)
 * 2. Usage pattern changes (sudden increase/decrease)
 * 3. Language intensity escalation
 * 4. Time-of-day vulnerability patterns
 * 5. Social withdrawal indicators
 */

/**
 * Analyze a user's recent emotional data and predict crisis risk.
 * @param {Array} moodEntries - Recent mood log entries
 * @param {Array} emotionLogs - Recent emotion_logs from chat
 * @param {Array} activityLogs - Recent activity_logs
 * @returns {object} Prediction result with risk level, signals, and suggested intervention
 */
function predictCrisisRisk(moodEntries = [], emotionLogs = [], activityLogs = []) {
    const signals = [];
    let riskScore = 0;

    // ──── Signal 1: Sustained Negative Emotion Trend ────
    if (emotionLogs.length >= 3) {
        const recentEmotions = emotionLogs.slice(-10);
        const negativeEmotions = ['stress', 'anxiety', 'depression', 'sadness', 'anger', 'loneliness', 'hopelessness'];
        const negCount = recentEmotions.filter(e => negativeEmotions.includes(e.emotion)).length;
        const negRatio = negCount / recentEmotions.length;

        if (negRatio >= 0.8) {
            riskScore += 35;
            signals.push({
                type: 'emotion_trend',
                severity: 'high',
                icon: '📉',
                title: 'Sustained Negative Emotions',
                description: `${Math.round(negRatio * 100)}% of your recent interactions show distress signals. You\'ve been carrying this for a while.`,
                suggestion: 'Consider talking to a counselor — you don\'t have to face this alone.'
            });
        } else if (negRatio >= 0.6) {
            riskScore += 20;
            signals.push({
                type: 'emotion_trend',
                severity: 'moderate',
                icon: '📊',
                title: 'Elevated Distress Pattern',
                description: `${Math.round(negRatio * 100)}% of recent chats show negative emotions.`,
                suggestion: 'Try our coping techniques or talk to EmoSense about what\'s bothering you.'
            });
        }
    }

    // ──── Signal 2: Escalation Detection ────
    if (emotionLogs.length >= 5) {
        const firstHalf = emotionLogs.slice(0, Math.floor(emotionLogs.length / 2));
        const secondHalf = emotionLogs.slice(Math.floor(emotionLogs.length / 2));

        const avgFirst = firstHalf.reduce((s, e) => s + (e.confidence || 50), 0) / (firstHalf.length || 1);
        const avgSecond = secondHalf.reduce((s, e) => s + (e.confidence || 50), 0) / (secondHalf.length || 1);

        if (avgSecond > avgFirst * 1.3) {
            riskScore += 20;
            signals.push({
                type: 'escalation',
                severity: 'high',
                icon: '⬆️',
                title: 'Emotional Intensity Increasing',
                description: 'Your emotional distress has been intensifying over recent sessions.',
                suggestion: 'This escalation pattern is important to address. Reach out to a counselor.'
            });
        }
    }

    // ──── Signal 3: Crisis Language Detection ────
    if (emotionLogs.length > 0) {
        const crisisCount = emotionLogs.filter(e => e.is_crisis).length;
        if (crisisCount >= 2) {
            riskScore += 40;
            signals.push({
                type: 'crisis_language',
                severity: 'critical',
                icon: '🚨',
                title: 'Crisis Language Detected Multiple Times',
                description: `Crisis-level language was detected ${crisisCount} times recently.`,
                suggestion: 'Please reach out to MSU Counseling (Student Affairs) or call Befrienders Zimbabwe: +263 4 790 652'
            });
        } else if (crisisCount === 1) {
            riskScore += 25;
            signals.push({
                type: 'crisis_language',
                severity: 'high',
                icon: '⚠️',
                title: 'Crisis Language Flagged',
                description: 'A message with crisis-level content was detected.',
                suggestion: 'Are you safe right now? Please talk to someone you trust.'
            });
        }
    }

    // ──── Signal 4: Usage Pattern Changes ────
    if (activityLogs.length >= 5) {
        // Check for sudden increase in late-night usage (after 11 PM)
        const lateNight = activityLogs.filter(a => {
            const hour = new Date(a.created_at).getHours();
            return hour >= 23 || hour <= 4;
        });
        const lateNightRatio = lateNight.length / activityLogs.length;

        if (lateNightRatio > 0.4) {
            riskScore += 15;
            signals.push({
                type: 'usage_pattern',
                severity: 'moderate',
                icon: '🌙',
                title: 'Late Night Activity Spike',
                description: `${Math.round(lateNightRatio * 100)}% of your recent activity is between 11 PM and 4 AM.`,
                suggestion: 'Disrupted sleep can worsen mental health. Try setting a wind-down routine.'
            });
        }
    }

    // ──── Signal 5: Withdrawal Detection ────
    if (moodEntries.length >= 3) {
        const lonelinessMoods = moodEntries.filter(m =>
            ['loneliness', 'isolation', 'withdrawal'].includes(m.mood)
        );
        const lonelinessRatio = lonelinessMoods.length / moodEntries.length;

        if (lonelinessRatio > 0.4) {
            riskScore += 20;
            signals.push({
                type: 'withdrawal',
                severity: 'high',
                icon: '🥺',
                title: 'Social Withdrawal Pattern',
                description: 'You\'ve been reporting feelings of loneliness and isolation frequently.',
                suggestion: 'Isolation can deepen depression. Consider joining a campus group or using our anonymous support rooms.'
            });
        }
    }

    // ──── Signal 6: Mood Intensity Trends ────
    if (moodEntries.length >= 3) {
        const recentIntensities = moodEntries.slice(-5).map(m => m.intensity);
        const avgIntensity = recentIntensities.reduce((s, i) => s + i, 0) / recentIntensities.length;

        if (avgIntensity > 0.8) {
            riskScore += 15;
            signals.push({
                type: 'high_intensity',
                severity: 'high',
                icon: '🔴',
                title: 'Consistently High Emotional Intensity',
                description: `Your average emotional intensity is at ${Math.round(avgIntensity * 100)}%.`,
                suggestion: 'This level of sustained intensity is significant. A counselor can help you process these feelings.'
            });
        }
    }

    // ──── Calculate Risk Level ────
    const riskLevel = riskScore >= 60 ? 'critical'
        : riskScore >= 40 ? 'high'
            : riskScore >= 20 ? 'moderate'
                : 'low';

    // ──── Generate Proactive Messages ────
    const proactiveMessages = generateProactiveMessages(riskLevel, signals);

    return {
        riskScore: Math.min(riskScore, 100),
        riskLevel,
        signals,
        proactiveMessages,
        analyzedAt: new Date().toISOString(),
        dataPoints: {
            moodEntries: moodEntries.length,
            emotionLogs: emotionLogs.length,
            activityLogs: activityLogs.length
        }
    };
}

/**
 * Generate proactive intervention messages based on risk level
 */
function generateProactiveMessages(riskLevel, signals) {
    const messages = [];

    if (riskLevel === 'critical') {
        messages.push({
            type: 'urgent',
            title: '💜 We\'re Concerned About You',
            message: 'Based on your recent activity, it seems like you\'re going through a really difficult time. You don\'t have to face this alone.',
            actions: [
                { label: 'Talk to a Counselor', action: 'counselor' },
                { label: 'Call Befrienders Zimbabwe', action: 'call:+2634790652' },
                { label: 'I\'m Okay', action: 'dismiss' }
            ]
        });
    } else if (riskLevel === 'high') {
        messages.push({
            type: 'alert',
            title: '💚 You Seem More Withdrawn This Week',
            message: 'We\'ve noticed some changes in your patterns. Want to talk about what\'s going on?',
            actions: [
                { label: 'Chat with EmoSense', action: 'chat' },
                { label: 'See Coping Techniques', action: 'coping' },
                { label: 'Not Now', action: 'dismiss' }
            ]
        });
    } else if (riskLevel === 'moderate') {
        messages.push({
            type: 'gentle',
            title: '🌱 Check In With Yourself',
            message: 'You\'ve had some tough moments recently. Taking a few minutes for self-care can make a real difference.',
            actions: [
                { label: 'Try Breathing Exercise', action: 'breathing' },
                { label: 'Log How I Feel', action: 'mood_log' },
                { label: 'Maybe Later', action: 'dismiss' }
            ]
        });
    }

    return messages;
}

/**
 * Check if a proactive alert should be sent (rate limiting)
 * @param {object} db - Database instance
 * @param {string} userId - User ID
 * @returns {boolean} Whether an alert should be sent
 */
function shouldSendAlert(db, userId) {
    try {
        // Don't send more than one alert per 6 hours
        const recent = db.prepare(
            "SELECT id FROM crisis_alerts WHERE session_id = ? AND created_at >= datetime('now', '-6 hours')"
        ).get(userId);
        return !recent;
    } catch (e) {
        return true;
    }
}

module.exports = { predictCrisisRisk, shouldSendAlert };
