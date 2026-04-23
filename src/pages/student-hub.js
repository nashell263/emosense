/**
 * EmoSense Social Hub
 * Focused on Voice Rooms (Safe Spaces) and community connection.
 */

import { apiGet } from '../api.js';
import { renderVoiceRoomGrid } from './voice-rooms.js';

export function renderStudentHub(container) {
  container.innerHTML = `
    <div class="social-hub-layout animate-fade-in">
      <!-- Premium Hero Section -->
      <section class="social-hero">
        <div class="social-hero-content">
          <div class="social-badge">Live Community</div>
          <h1>Social Hub</h1>
          <p>Connect with peers in anonymous safe spaces. Talk, listen, and support each other in a judgment-free environment.</p>
        </div>
      </section>

      <!-- ────── Voice Rooms Grid ────── -->
      <section class="rooms-section animate-slide-up">
        <div class="section-header">
          <h2>🎙️ Anonymous Safe Spaces</h2>
          <p>Join a live topic-based room. Fully anonymous, always supportive.</p>
        </div>
        <div id="hub-voice-rooms" class="hub-rooms-grid">
          <div class="loading-pulse">Loading active spaces...</div>
        </div>
      </section>

      <!-- ────── Community Values ────── -->
      <section class="community-values animate-slide-up-delay-1">
        <div class="value-card">
          <div class="value-icon">🔒</div>
          <div class="value-text">
            <h3>Anonymous</h3>
            <p>Your identity is never revealed to peers or staff in these rooms.</p>
          </div>
        </div>
        <div class="value-card">
          <div class="value-icon">🤝</div>
          <div class="value-text">
            <h3>Supportive</h3>
            <p>A place for empathy, not judgment. We're all in this together.</p>
          </div>
        </div>
      </section>
    </div>
  `;

  // ──── Load Voice Rooms ────
  const loadVoiceRooms = async () => {
    try {
      const rooms = await apiGet('/api/voice-rooms');
      renderVoiceRoomGrid(container, rooms);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    }
  };

  loadVoiceRooms();

  // Refresh rooms every 30 seconds
  const roomRefreshInterval = setInterval(() => {
    if (document.getElementById('hub-voice-rooms')) {
      loadVoiceRooms();
    } else {
      clearInterval(roomRefreshInterval);
    }
  }, 30000);
}
