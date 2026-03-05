/**
 * EmoSense API Client
 * Connects frontend to the Express backend
 */

const API_BASE = window.location.origin;

export async function apiPost(path, data = {}, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'Request failed');
    }
    return res.json();
}

export async function apiGet(path, token = null) {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, { headers });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'Request failed');
    }
    return res.json();
}

export async function apiPut(path, data = {}, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'Request failed');
    }
    return res.json();
}

export function getSocketUrl() {
    return API_BASE;
}

// Counselor token management
export function saveCounselorToken(token) {
    sessionStorage.setItem('emosense_counselor_token', token);
}

export function getCounselorToken() {
    return sessionStorage.getItem('emosense_counselor_token');
}

export function clearCounselorToken() {
    sessionStorage.removeItem('emosense_counselor_token');
}
