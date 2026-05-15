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

// Infobip Voice
let infobipApiKey = null;
let infobipBaseUrl = null;

// Email
let emailTransporter = null;
let adminEmail = null;

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

    // 2. Try Twilio (SMS only — voice not available in Zimbabwe)
    if (activeSmsProvider === 'none') {
        const twilioSid = config.twilioSid || process.env.TWILIO_ACCOUNT_SID;
        const twilioToken = config.twilioToken || process.env.TWILIO_AUTH_TOKEN;
        twilioPhoneNumber = config.twilioPhone || process.env.TWILIO_PHONE_NUMBER;

        if (isReal(twilioSid) && isReal(twilioToken) && twilioPhoneNumber) {
            try {
                const twilio = require('twilio');
                twilioClient = twilio(twilioSid, twilioToken);
                activeSmsProvider = 'twilio';
                console.log('✅ Twilio initialized — SMS enabled');
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
        console.log("⚠️ No SMS provider configured — SMS will be logged to console only.");
    }

    // Email setup (Nodemailer with Gmail SMTP)
    adminEmail = config.adminEmail || process.env.ADMIN_EMAIL;
    const emailUser = config.emailUser || process.env.EMAIL_USER;
    const emailPass = config.emailPass || process.env.EMAIL_PASS;
    if (emailUser && emailPass && emailUser !== 'your_email_here') {
        try {
            const nodemailer = require('nodemailer');
            emailTransporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: emailUser, pass: emailPass }
            });
            console.log(`✅ Email alerts initialized (${emailUser})`);
        } catch(e) { console.log('⚠️ Email init skipped:', e.message); }
    } else {
        console.log('⚠️ Email alerts not configured — set EMAIL_USER and EMAIL_PASS in .env');
    }

    // Infobip Voice TTS
    infobipApiKey = config.infobipApiKey || process.env.INFOBIP_API_KEY;
    infobipBaseUrl = config.infobipBaseUrl || process.env.INFOBIP_BASE_URL;
    if (infobipApiKey && infobipBaseUrl) {
        console.log(`✅ Infobip Voice initialized (${infobipBaseUrl})`);
    } else {
        console.log('⚠️ Infobip Voice not configured — set INFOBIP_API_KEY and INFOBIP_BASE_URL in .env');
    }

    console.log(`   📱 WhatsApp alerts: ✅ via wa.me link (supervisor: ${adminPhoneNumber})`);
}

/**
 * Make a voice call via Infobip TTS API
 * Calls the target phone and reads the message aloud
 */
async function makeInfobipVoiceCall(targetPhone, message) {
    if (!infobipApiKey || !infobipBaseUrl) {
        console.log(`[INFOBIP MOCK → ${targetPhone}] ${message}`);
        return { success: false, reason: 'infobip_not_configured' };
    }

    const phonePlus = targetPhone.startsWith('+') ? targetPhone : '+' + targetPhone;
    try {
        const resp = await fetch(`https://${infobipBaseUrl}/tts/3/single`, {
            method: 'POST',
            headers: {
                'Authorization': `App ${infobipApiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                from: 'EmoSense',
                to: phonePlus,
                text: message,
                language: 'en',
                voice: { name: 'Joanna', gender: 'female' }
            })
        });
        const data = await resp.json();
        console.log(`✅ Infobip voice call to ${targetPhone}:`, JSON.stringify(data));
        return { success: resp.ok, data };
    } catch (err) {
        console.error(`❌ Infobip voice call failed:`, err.message);
        return { success: false, reason: err.message };
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
 * Send WhatsApp alert via wa.me link + SMS callback request
 * Returns a wa.me URL for dashboard auto-open
 */
function getWhatsAppAlertUrl(alert) {
    const phone = (adminPhoneNumber || '').replace('+', '');
    const msg = encodeURIComponent(
        `🚨 *EmoSense SOS EMERGENCY*\n\n` +
        `Student: ${alert.student_alias}\n` +
        `Severity: ${(alert.severity || 'high').toUpperCase()}\n` +
        `Message: ${alert.trigger_message || alert.quick_message || 'SOS activated'}\n` +
        `Time: ${new Date().toLocaleTimeString()}\n` +
        `${alert.location_address ? 'Location: ' + alert.location_address : ''}\n\n` +
        `⚠️ STUDENT IN DANGER — Please respond immediately!`
    );
    return `https://wa.me/${phone}?text=${msg}`;
}

/**
 * Get WhatsApp CALL link (opens WhatsApp voice call directly)
 * Works on mobile devices with WhatsApp installed
 */
function getWhatsAppCallUrl() {
    const phone = (adminPhoneNumber || '').replace('+', '');
    return `https://wa.me/${phone}`;
}

/**
 * Get tel: link for direct phone call
 */
function getCallUrl() {
    return `tel:${adminPhoneNumber}`;
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

    // Send urgent SMS with "CALL BACK" instruction (acts as call alert)
    if (channels.includes('CALL') && phone) {
        const urgentSms = `🚨🚨 URGENT CALL NEEDED 🚨🚨\n\nEmoSense: STUDENT IN DANGER!\n\nStudent: ${alert.student_alias}\nSeverity: CRITICAL\n${alert.location_address ? 'Location: ' + alert.location_address : ''}\n\nPLEASE CALL BACK OR CHECK DASHBOARD NOW!`;
        results.call = await sendSMS(phone, urgentSms);
        console.log(`📞 Urgent callback SMS sent to ${phone}`);
    }

    // WhatsApp alert (generate link for dashboard)
    if (channels.includes('WHATSAPP')) {
        const waUrl = getWhatsAppAlertUrl(alert);
        console.log(`📱 WhatsApp alert URL: ${waUrl}`);
        // Push to dashboard for auto-open
        if (ioInstance) {
            ioInstance.emit('sos-whatsapp-alert', {
                alertId: alert.id,
                whatsappUrl: waUrl,
                whatsappCallUrl: getWhatsAppCallUrl(),
                callUrl: getCallUrl(),
                studentAlias: alert.student_alias
            });
        }
        results.whatsapp = { success: true, url: waUrl };
    }

    // Email alert
    if (channels.includes('EMAIL')) {
        if (emailTransporter && adminEmail) {
            try {
                // Build phone row for email
                const studentPhone = alert.contact_info || '';
                const phoneClean = studentPhone.replace(/[\s\-\(\)]/g, '');
                const phoneForWA = phoneClean.startsWith('0') ? '263' + phoneClean.substring(1) : phoneClean.replace('+', '');
                const phoneFull = phoneClean.startsWith('0') ? '+263' + phoneClean.substring(1) : (phoneClean.startsWith('+') ? phoneClean : '+' + phoneClean);

                const phoneRow = studentPhone ? `
                    <tr><td style="padding:8px 0;font-weight:bold;color:#374151;">📱 Phone:</td><td style="padding:8px 0;">
                        <span style="font-size:1.1rem;font-weight:700;color:#059669;">${studentPhone}</span><br/>
                        <a href="https://wa.me/${phoneForWA}" style="display:inline-block;margin-top:4px;padding:4px 12px;background:#25D366;color:white;border-radius:6px;font-size:0.8rem;text-decoration:none;font-weight:600;">💬 WhatsApp</a>
                        <a href="tel:${phoneFull}" style="display:inline-block;margin-top:4px;margin-left:6px;padding:4px 12px;background:#059669;color:white;border-radius:6px;font-size:0.8rem;text-decoration:none;font-weight:600;">📞 Call</a>
                    </td></tr>` : '';

                const locationRow = alert.location_address ? `
                    <tr><td style="padding:8px 0;font-weight:bold;color:#374151;">📍 Location:</td><td style="padding:8px 0;">
                        <strong>${alert.location_address}</strong><br/>
                        <span style="color:#6b7280;font-size:0.85rem;">Coordinates: ${alert.latitude?.toFixed?.(5) || alert.latitude}, ${alert.longitude?.toFixed?.(5) || alert.longitude}</span><br/>
                        <a href="https://maps.google.com/?q=${alert.latitude},${alert.longitude}" style="display:inline-block;margin-top:4px;padding:4px 12px;background:#4285F4;color:white;border-radius:6px;font-size:0.8rem;text-decoration:none;font-weight:600;">📍 Open in Google Maps</a>
                    </td></tr>` : '';

                // Triage details
                let triageInfo = '';
                try {
                    const ta = alert.triage_answers ? (typeof alert.triage_answers === 'string' ? JSON.parse(alert.triage_answers) : alert.triage_answers) : null;
                    if (ta) {
                        const tags = [];
                        if (ta.danger) tags.push('<span style="background:#fecaca;color:#991b1b;padding:2px 8px;border-radius:10px;font-size:0.75rem;font-weight:600;">⚠️ In Danger</span>');
                        if (ta.selfharm) tags.push('<span style="background:#fecaca;color:#991b1b;padding:2px 8px;border-radius:10px;font-size:0.75rem;font-weight:600;">🚨 Self-Harm Risk</span>');
                        if (ta.urgent) tags.push('<span style="background:#fed7aa;color:#9a3412;padding:2px 8px;border-radius:10px;font-size:0.75rem;font-weight:600;">🔴 Urgent</span>');
                        if (tags.length) triageInfo = `<tr><td style="padding:8px 0;font-weight:bold;color:#374151;">Triage:</td><td style="padding:8px 0;">${tags.join(' ')}</td></tr>`;
                    }
                } catch(e) {}

                await emailTransporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: adminEmail,
                    subject: `🚨 EmoSense SOS ALERT — ${alert.severity?.toUpperCase() || 'HIGH'} — ${alert.student_alias}`,
                    html: `
                        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                            <div style="background:linear-gradient(135deg,#dc2626,#991b1b);color:white;padding:20px;border-radius:12px 12px 0 0;">
                                <h1 style="margin:0;font-size:1.4rem;">🚨 EMERGENCY SOS ALERT</h1>
                                <p style="margin:4px 0 0;font-size:0.9rem;opacity:0.9;">EmoSense Crisis Management System — Midlands State University</p>
                            </div>
                            <div style="padding:20px;background:#fff;border:1px solid #e5e7eb;border-radius:0 0 12px 12px;">
                                <table style="width:100%;border-collapse:collapse;">
                                    <tr><td style="padding:8px 0;font-weight:bold;color:#374151;">Student:</td><td style="padding:8px 0;font-weight:600;">${alert.student_alias}</td></tr>
                                    <tr><td style="padding:8px 0;font-weight:bold;color:#374151;">Severity:</td><td style="padding:8px 0;"><span style="background:${alert.severity === 'critical' ? '#dc2626' : '#ea580c'};color:white;padding:2px 10px;border-radius:12px;font-size:0.8rem;">${(alert.severity || 'high').toUpperCase()}</span></td></tr>
                                    ${phoneRow}
                                    <tr><td style="padding:8px 0;font-weight:bold;color:#374151;">Message:</td><td style="padding:8px 0;">${alert.trigger_message || alert.quick_message || 'SOS activated'}</td></tr>
                                    ${triageInfo}
                                    <tr><td style="padding:8px 0;font-weight:bold;color:#374151;">Method:</td><td style="padding:8px 0;">${alert.contact_method}</td></tr>
                                    <tr><td style="padding:8px 0;font-weight:bold;color:#374151;">Time:</td><td style="padding:8px 0;">${new Date().toLocaleString()}</td></tr>
                                    ${locationRow}
                                </table>
                                <div style="margin-top:16px;padding:12px;background:#fef2f2;border-radius:8px;color:#991b1b;font-weight:600;">
                                    ⚠️ Please check the EmoSense counselor dashboard immediately and contact this student.
                                </div>
                            </div>
                        </div>
                    `
                });
                console.log(`✅ Email alert sent to ${adminEmail}`);
                results.email = { success: true };
            } catch(err) {
                console.error('❌ Email alert failed:', err.message);
                results.email = { success: false, reason: err.message };
            }
        } else {
            console.log(`[EMAIL] Email not configured — set EMAIL_USER, EMAIL_PASS, ADMIN_EMAIL in .env`);
            results.email = { success: false, reason: 'not_configured' };
        }
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

    // If user is unsafe, immediate escalation to Level 2 (SMS + CALL + WHATSAPP + EMAIL)
    if (alert.contact_method === 'unsafe' || alert.severity === 'critical') {
        notifyEmergency(['SMS', 'CALL', 'WHATSAPP', 'PUSH', 'EMAIL'], alert);
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
        notifyEmergency(['SMS', 'PUSH', 'WHATSAPP'], updatedAlert);
        if (ioInstance) ioInstance.emit('sos-escalated', updatedAlert);

        // Start 2 mins timer for Level 2 (SMS + CALL + EMAIL)
        const timer2 = setTimeout(() => {
            escalateSOS(alertId, 2);
        }, 120 * 1000);
        activeTimers.set(`${alertId}-L2`, timer2);
    } else if (targetLevel === 2) {
        // Level 2: ALL channels (critical)
        notifyEmergency(['SMS', 'CALL', 'WHATSAPP', 'PUSH', 'EMAIL'], updatedAlert);
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

/**
 * Send SOS alert email to ALL registered counselors
 * Uses the existing Nodemailer transporter (nashelliphone@gmail.com sender)
 */
async function notifyCounselorsEmail(alert) {
    if (!emailTransporter) {
        console.log('[EMAIL] Transporter not configured — skipping counselor email broadcast');
        return { success: false, reason: 'email_not_configured' };
    }

    const db = getDb();
    let counselors;
    try {
        counselors = db.prepare("SELECT email, name FROM counselors WHERE email IS NOT NULL AND email != ''").all();
    } catch (err) {
        console.error('[EMAIL] Failed to query counselor emails:', err.message);
        return { success: false, reason: err.message };
    }

    if (!counselors || counselors.length === 0) {
        console.log('[EMAIL] No counselor emails found in database');
        return { success: false, reason: 'no_counselors' };
    }

    // Send to ALL registered counselor emails
    const counselorEmails = counselors
        .map(c => c.email)
        .filter(email => email && email.trim() !== '');

    if (counselorEmails.length === 0) {
        console.log('[EMAIL] No counselor emails found to send to');
        return { success: true, sent: 0 };
    }

    console.log(`📧 Sending SOS alert to ${counselorEmails.length} counselor email(s): ${counselorEmails.join(', ')}`);

    // Build phone row for email
    const studentPhone = alert.contact_info || '';
    const phoneClean = studentPhone.replace(/[\s\-\(\)]/g, '');
    const phoneForWA = phoneClean.startsWith('0') ? '263' + phoneClean.substring(1) : phoneClean.replace('+', '');
    const phoneFull = phoneClean.startsWith('0') ? '+263' + phoneClean.substring(1) : (phoneClean.startsWith('+') ? phoneClean : '+' + phoneClean);

    const phoneRow = studentPhone ? `
        <tr><td style="padding:8px 0;font-weight:bold;color:#374151;">📱 Phone:</td><td style="padding:8px 0;">
            <span style="font-size:1.1rem;font-weight:700;color:#059669;">${studentPhone}</span><br/>
            <a href="https://wa.me/${phoneForWA}" style="display:inline-block;margin-top:4px;padding:4px 12px;background:#25D366;color:white;border-radius:6px;font-size:0.8rem;text-decoration:none;font-weight:600;">💬 WhatsApp</a>
            <a href="tel:${phoneFull}" style="display:inline-block;margin-top:4px;margin-left:6px;padding:4px 12px;background:#059669;color:white;border-radius:6px;font-size:0.8rem;text-decoration:none;font-weight:600;">📞 Call</a>
        </td></tr>` : '';

    const locationRow = alert.location_address ? `
        <tr><td style="padding:8px 0;font-weight:bold;color:#374151;">📍 Location:</td><td style="padding:8px 0;">
            <strong>${alert.location_address}</strong><br/>
            <span style="color:#6b7280;font-size:0.85rem;">Coordinates: ${alert.latitude?.toFixed?.(5) || alert.latitude || 'N/A'}, ${alert.longitude?.toFixed?.(5) || alert.longitude || 'N/A'}</span><br/>
            <a href="https://maps.google.com/?q=${alert.latitude},${alert.longitude}" style="display:inline-block;margin-top:4px;padding:4px 12px;background:#4285F4;color:white;border-radius:6px;font-size:0.8rem;text-decoration:none;font-weight:600;">📍 Open in Google Maps</a>
        </td></tr>` : '';

    const emailHtml = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:linear-gradient(135deg,#dc2626,#991b1b);color:white;padding:20px;border-radius:12px 12px 0 0;">
                <h1 style="margin:0;font-size:1.4rem;">🚨 SOS EMERGENCY ALERT</h1>
                <p style="margin:4px 0 0;font-size:0.9rem;opacity:0.9;">EmoSense Crisis Management — Midlands State University</p>
            </div>
            <div style="padding:20px;background:#fff;border:1px solid #e5e7eb;border-radius:0 0 12px 12px;">
                <div style="padding:12px;background:#fef2f2;border-radius:8px;color:#991b1b;font-weight:600;margin-bottom:16px;">
                    ⚠️ A student has activated the SOS emergency button. Please check the EmoSense counselor dashboard immediately.
                </div>
                <table style="width:100%;border-collapse:collapse;">
                    <tr><td style="padding:8px 0;font-weight:bold;color:#374151;">Student:</td><td style="padding:8px 0;font-weight:600;">${alert.student_alias || 'Anonymous'}</td></tr>
                    <tr><td style="padding:8px 0;font-weight:bold;color:#374151;">Severity:</td><td style="padding:8px 0;"><span style="background:${alert.severity === 'critical' ? '#dc2626' : '#ea580c'};color:white;padding:2px 10px;border-radius:12px;font-size:0.8rem;">${(alert.severity || 'high').toUpperCase()}</span></td></tr>
                    ${phoneRow}
                    <tr><td style="padding:8px 0;font-weight:bold;color:#374151;">Message:</td><td style="padding:8px 0;">${alert.trigger_message || alert.quick_message || 'SOS activated'}</td></tr>
                    <tr><td style="padding:8px 0;font-weight:bold;color:#374151;">Method:</td><td style="padding:8px 0;">${alert.contact_method || 'chat'}</td></tr>
                    <tr><td style="padding:8px 0;font-weight:bold;color:#374151;">Time:</td><td style="padding:8px 0;">${new Date().toLocaleString()}</td></tr>
                    ${locationRow}
                </table>
                <div style="margin-top:20px;text-align:center;">
                    <a href="${process.env.RENDER_EXTERNAL_URL || 'https://emosense.onrender.com'}/#dashboard" style="display:inline-block;padding:10px 24px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border-radius:10px;text-decoration:none;font-weight:700;font-size:0.95rem;">Open Counselor Dashboard →</a>
                </div>
                <p style="margin-top:16px;font-size:0.75rem;color:#9ca3af;text-align:center;">
                    You are receiving this because you are a registered EmoSense counselor. Your email was used for emergency SOS notifications.
                </p>
            </div>
        </div>
    `;

    const results = [];
    for (const email of counselorEmails) {
        try {
            await emailTransporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: `🚨 EmoSense SOS ALERT — ${(alert.severity || 'HIGH').toUpperCase()} — ${alert.student_alias || 'Student'}`,
                html: emailHtml
            });
            console.log(`  ✅ SOS email sent to counselor: ${email}`);
            results.push({ email, success: true });
        } catch (err) {
            console.error(`  ❌ Failed to email ${email}:`, err.message);
            results.push({ email, success: false, reason: err.message });
        }
    }

    const sentCount = results.filter(r => r.success).length;
    console.log(`📧 Counselor email broadcast complete: ${sentCount}/${counselorEmails.length} sent`);
    return { success: true, sent: sentCount, total: counselorEmails.length, results };
}

module.exports = {
    init,
    triggerSOS,
    escalateSOS,
    acknowledgeSOS,
    notifyEmergency,
    notifyCounselorsEmail,
    sendSMS,
    makeInfobipVoiceCall,
    getWhatsAppAlertUrl,
    getCallUrl
};
