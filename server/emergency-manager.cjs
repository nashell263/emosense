/**
 * Emergency Crisis Escalation Manager — EasySendSMS / Twilio / Vonage / AT
 * Tries providers in order: EasySendSMS → Twilio → Vonage → AT → console log
 */
const { getDb } = require('./database.cjs');

let ioInstance = null;
const activeTimers = new Map();

// SMS Providers
let easySendApiKey = null;
let twilioClient = null;
let twilioPhoneNumber = null;
let vonageClient = null;
let atSms = null;
let activeSmsProvider = 'none';

let vonagePhoneNumber = null;
let adminPhoneNumber = null;

const isReal = (key) => key && !key.includes('your_') && !key.includes('_here') && key.length > 10;

function init(io, config = {}) {
    ioInstance = io;

    adminPhoneNumber = config.adminPhoneNumber || process.env.ADMIN_PHONE_NUMBER || '+263712155253';

    // 1. Try EasySendSMS FIRST (best for Zimbabwe)
    const easyKey = config.easySendApiKey || process.env.EASYSEND_API_KEY;
    if (isReal(easyKey)) {
        easySendApiKey = easyKey;
        activeSmsProvider = 'easysendsms';
        console.log('✅ EasySendSMS initialized — Real SMS enabled');
    }

    // 2. Try Twilio
    if (activeSmsProvider === 'none') {
        const twilioSid = config.twilioSid || process.env.TWILIO_ACCOUNT_SID;
        const twilioToken = config.twilioToken || process.env.TWILIO_AUTH_TOKEN;
        twilioPhoneNumber = config.twilioPhone || process.env.TWILIO_PHONE_NUMBER;

        if (isReal(twilioSid) && isReal(twilioToken) && twilioPhoneNumber) {
            try {
                const twilio = require('twilio');
                twilioClient = twilio(twilioSid, twilioToken);
                activeSmsProvider = 'twilio';
                console.log('✅ Twilio initialized — Real SMS & Voice calls enabled');
            } catch (err) {
                console.log('⚠️ Twilio init failed:', err.message);
            }
        }
    }

    // 3. Try Vonage
    if (activeSmsProvider === 'none') {
        const vApiKey = config.vonageApiKey || process.env.VONAGE_API_KEY;
        const vApiSecret = config.vonageApiSecret || process.env.VONAGE_API_SECRET;
        vonagePhoneNumber = config.vonagePhoneNumber || process.env.VONAGE_PHONE_NUMBER;

        if (isReal(vApiKey) && isReal(vApiSecret) && vonagePhoneNumber) {
            try {
                const { Vonage } = require('@vonage/server-sdk');
                vonageClient = new Vonage({ apiKey: vApiKey, apiSecret: vApiSecret });
                activeSmsProvider = 'vonage';
                console.log('✅ Vonage initialized — Real SMS & Voice calls enabled');
            } catch (err) {
                console.log('⚠️ Vonage init failed:', err.message);
            }
        }
    }

    // 4. Try Africa's Talking
    if (activeSmsProvider === 'none') {
        const atUsername = config.atUsername || process.env.AT_USERNAME;
        const atApiKey = config.atApiKey || process.env.AT_API_KEY;

        if (isReal(atApiKey) && atUsername && atUsername !== 'your_at_username') {
            try {
                const AfricasTalking = require('africastalking')({ apiKey: atApiKey, username: atUsername });
                atSms = AfricasTalking.SMS;
                activeSmsProvider = 'africastalking';
                console.log("✅ Africa's Talking initialized — Real SMS enabled");
            } catch (err) {
                console.log("⚠️ Africa's Talking init failed:", err.message);
            }
        }
    }

    if (activeSmsProvider !== 'none') {
        console.log(`   📱 Alert target: ${adminPhoneNumber} (via ${activeSmsProvider})`);
    } else {
        console.log("⚠️ No SMS provider configured — SMS/calls will be logged to console only.");
        console.log("   Set EASYSEND_API_KEY, TWILIO_ACCOUNT_SID, VONAGE_API_KEY, or AT_API_KEY in .env.");
    }
}

/**
 * Send SMS via configured provider (EasySendSMS → Twilio → Vonage → AT)
 */
async function sendSMS(targetPhone, messageBody) {
    // Format phone: ensure no + for EasySendSMS, with + for Twilio
    const phoneClean = targetPhone.replace('+', '');
    const phonePlus = targetPhone.startsWith('+') ? targetPhone : '+' + targetPhone;

    if (activeSmsProvider === 'easysendsms') {
        try {
            const senderName = process.env.EASYSEND_SENDER || 'EmoSense';
            const url = `https://api.easysendsms.app/bulksms?username=${encodeURIComponent(process.env.EASYSEND_USERNAME)}&password=${encodeURIComponent(process.env.EASYSEND_PASSWORD)}&to=${phoneClean}&text=${encodeURIComponent(messageBody)}&from=${encodeURIComponent(senderName)}&type=0`;
            
            const resp = await fetch(url);
            const text = await resp.text();
            console.log(`✅ SMS sent to ${targetPhone} via EasySendSMS — Response: ${text}`);
            return { success: true, response: text };
        } catch (err) {
            console.error(`❌ EasySendSMS failed:`, err.message);
            return { success: false, reason: err.message };
        }
    } else if (activeSmsProvider === 'twilio') {
        try {
            const msg = await twilioClient.messages.create({
                body: messageBody,
                from: twilioPhoneNumber,
                to: phonePlus
            });
            console.log(`✅ SMS sent to ${targetPhone} via Twilio (SID: ${msg.sid})`);
            return { success: true, sid: msg.sid };
        } catch (err) {
            console.error(`❌ Twilio SMS failed:`, err.message);
            return { success: false, reason: err.message };
        }
    } else if (activeSmsProvider === 'vonage') {
        try {
            const resp = await vonageClient.sms.send({
                to: phoneClean,
                from: vonagePhoneNumber,
                text: messageBody
            });
            console.log(`✅ SMS sent to ${targetPhone} via Vonage`);
            return { success: true, response: resp };
        } catch (err) {
            console.error(`❌ Vonage SMS failed:`, err.message);
            return { success: false, reason: err.message };
        }
    } else if (activeSmsProvider === 'africastalking') {
        try {
            const resp = await atSms.send({ to: [phonePlus], message: messageBody });
            console.log(`✅ SMS sent to ${targetPhone} via Africa's Talking`);
            return { success: true, response: resp };
        } catch (err) {
            console.error(`❌ Africa's Talking SMS failed:`, err.message);
            return { success: false, reason: err.message };
        }
    } else {
        console.log(`[SMS MOCK → ${targetPhone}] ${messageBody}`);
        return { success: false, reason: 'no_sms_provider_configured' };
    }
}

/**
 * Make a voice call via Twilio or Vonage with text-to-speech
 */
async function makeVoiceCall(targetPhone, spokenMessage) {
    const phone = targetPhone.startsWith('+') ? targetPhone : '+' + targetPhone;

    // Try Twilio first
    if (twilioClient) {
        try {
            const call = await twilioClient.calls.create({
                twiml: `<Response><Say voice="alice">${spokenMessage}</Say></Response>`,
                from: twilioPhoneNumber,
                to: phone
            });
            console.log(`✅ Voice call initiated to ${targetPhone} via Twilio (SID: ${call.sid})`);
            return { success: true, sid: call.sid };
        } catch (err) {
            console.error(`❌ Twilio voice call failed:`, err.message);
            return { success: false, reason: err.message };
        }
    }

    // Try Vonage
    if (vonageClient) {
        try {
            const call = await vonageClient.voice.createOutboundCall({
                to: [{ type: 'phone', number: targetPhone.replace('+', '') }],
                from: { type: 'phone', number: vonagePhoneNumber },
                ncco: [{ action: 'talk', text: spokenMessage, language: 'en-US', style: 2 }]
            });
            console.log(`✅ Voice call initiated to ${targetPhone} via Vonage`);
            return { success: true, uuid: call.uuid };
        } catch (err) {
            console.error(`❌ Vonage voice call failed:`, err.message);
            return { success: false, reason: err.message };
        }
    }

    console.log(`[CALL MOCK → ${targetPhone}] ${spokenMessage}`);
    return { success: false, reason: 'no_voice_provider_configured' };
}

/**
 * Dispatch emergency notifications via configured channels
 */
async function notifyEmergency(channels, alert, targetPhone) {
    const phone = targetPhone || adminPhoneNumber;

    console.log('\n======================================================');
    console.log('🚨 EMERGENCY NOTIFICATION CRITICAL DISPATCH 🚨');
    console.log(`TIME: ${new Date().toISOString()}`);
    console.log(`CHANNELS: ${channels.join(', ')}`);
    console.log(`TARGET: ${phone}`);
    console.log(`ALERT ID: ${alert.id}`);
    console.log(`STUDENT: ${alert.student_alias}`);
    console.log(`TRIGGER: ${alert.trigger_message}`);
    console.log(`CONTACT METHOD: ${alert.contact_method} - ${alert.contact_info || 'Unknown'}`);
    console.log('======================================================\n');

    const results = {};

    // Send SMS
    if (channels.includes('SMS') && phone) {
        const smsBody = `🚨 EmoSense SOS Alert\n\nStudent: ${alert.student_alias}\nSeverity: ${alert.severity || 'high'}\nTrigger: ${(alert.trigger_message || '').substring(0, 120)}\nAlert ID: ${alert.id}\nTime: ${new Date().toLocaleString()}\n\nPlease check the EmoSense counselor dashboard immediately.`;
        results.sms = await sendSMS(phone, smsBody);
    }

    // Make voice call (for critical/Level 2 escalations)
    if (channels.includes('CALL') && phone) {
        const spokenMsg = `Emergency alert from EmoSense. A student named ${alert.student_alias} has triggered an S.O.S. alert with severity ${alert.severity || 'high'}. Please check the EmoSense counselor dashboard immediately. This is an urgent mental health emergency.`;
        results.call = await makeVoiceCall(phone, spokenMsg);
    }

    // Email placeholder (future enhancement)
    if (channels.includes('EMAIL')) {
        console.log(`[EMAIL] Would send email alert for ${alert.student_alias} — not yet configured`);
        results.email = { success: false, reason: 'not_configured' };
    }

    // Push notification via Socket.io (always works)
    if (channels.includes('PUSH') && ioInstance) {
        ioInstance.emit('sos-notification', {
            alertId: alert.id,
            studentAlias: alert.student_alias,
            severity: alert.severity,
            timestamp: new Date().toISOString()
        });
        results.push = { success: true };
    }

    return results;
}

function triggerSOS(alert) {
    // Notify all online counselors instantly via Socket.io
    if (ioInstance) {
        ioInstance.emit('crisis-alert', alert);
    }

    // If user is unsafe, immediate escalation to Level 2 (SMS + CALL)
    if (alert.contact_method === 'unsafe') {
        notifyEmergency(['SMS', 'CALL', 'PUSH', 'EMAIL'], alert);
        updateEscalation(alert.id, 2);
        return;
    }

    // Otherwise, start 60s timer for Level 1 (Supervisor SMS)
    const timer1 = setTimeout(() => {
        escalateSOS(alert.id, 1);
    }, 60 * 1000);

    activeTimers.set(`${alert.id}-L1`, timer1);
}

function escalateSOS(alertId, targetLevel) {
    const db = getDb();

    // Check if it's already acknowledged or resolved
    const alert = db.prepare('SELECT * FROM crisis_alerts WHERE id = ?').get(alertId);
    if (!alert || alert.status !== 'new') {
        return;
    }

    updateEscalation(alertId, targetLevel);
    const updatedAlert = db.prepare('SELECT * FROM crisis_alerts WHERE id = ?').get(alertId);

    if (targetLevel === 1) {
        // Level 1: SMS to supervisor
        notifyEmergency(['SMS', 'PUSH'], updatedAlert);
        if (ioInstance) ioInstance.emit('sos-escalated', updatedAlert);

        // Start 2 mins timer for Level 2 (SMS + CALL)
        const timer2 = setTimeout(() => {
            escalateSOS(alertId, 2);
        }, 120 * 1000);
        activeTimers.set(`${alertId}-L2`, timer2);
    } else if (targetLevel === 2) {
        // Level 2: SMS + Voice Call (critical)
        notifyEmergency(['SMS', 'CALL', 'PUSH', 'EMAIL'], updatedAlert);
        if (ioInstance) ioInstance.emit('sos-escalated', updatedAlert);
    }
}

function updateEscalation(alertId, level) {
    const db = getDb();
    db.prepare('UPDATE crisis_alerts SET escalation_level = ? WHERE id = ?').run(level, alertId);
}

function acknowledgeSOS(alertId) {
    // Clear pending timeouts
    if (activeTimers.has(`${alertId}-L1`)) clearTimeout(activeTimers.get(`${alertId}-L1`));
    if (activeTimers.has(`${alertId}-L2`)) clearTimeout(activeTimers.get(`${alertId}-L2`));
    activeTimers.delete(`${alertId}-L1`);
    activeTimers.delete(`${alertId}-L2`);
}

module.exports = {
    init,
    triggerSOS,
    escalateSOS,
    acknowledgeSOS,
    notifyEmergency,
    sendSMS,
    makeVoiceCall
};
