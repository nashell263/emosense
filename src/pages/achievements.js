/**
 * EmoSense Gamified Healing Journey
 * XP, levels, and achievements for mental health progress.
 */

import { apiGet } from '../api.js';

const USER_ID = 'session_' + (localStorage.getItem('emosense_user_id') || 'test_user');

export async function renderAchievements(container) {
    const data = await apiGet(`/api/achievements/${USER_ID}`);

    container.innerHTML = `
    <div class="achievements-page">
      <div class="career-header">
        <div class="level-badge">Level ${data.level}</div>
        <div class="profile-info">
          <h1>My Healing Journey</h1>
          <p>Total Experience: ${data.totalXp} XP</p>
          <div class="xp-bar-container">
            <div class="xp-bar-fill" style="width: ${data.totalXp % 100}%"></div>
            <span class="xp-text">${data.totalXp % 100} / 100 XP to next level</span>
          </div>
        </div>
      </div>

      <div class="achievements-section">
        <h2>Badges Earned 🏆</h2>
        <div class="badges-grid">
          ${data.achievements.length > 0 ? data.achievements.map(a => `
            <div class="achievement-card">
              <div class="achievement-icon">${a.icon}</div>
              <div class="achievement-info">
                <h3>${a.title}</h3>
                <p>${a.description}</p>
                <div class="achievement-meta">
                  <span class="xp-tag">+${a.xp_earned} XP</span>
                  <span class="date-tag">${new Date(a.earned_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          `).join('') : '<p class="empty-msg">Start your journey to earn badges!</p>'}
        </div>
      </div>

      <div class="unlockable-section">
        <h2>Future Milestones 🔒</h2>
        <div class="milestones-list">
          <div class="milestone locked">
            <span class="m-icon">🌟</span>
            <div class="m-text">
              <h4>Consistency Master</h4>
              <p>Log your mood for 30 consecutive days</p>
            </div>
          </div>
          <div class="milestone locked">
            <span class="m-icon">🧘</span>
            <div class="m-text">
              <h4>Zen Master</h4>
              <p>Complete 10 breathing exercises</p>
            </div>
          </div>
          <div class="milestone locked">
            <span class="m-icon">🤝</span>
            <div class="m-text">
              <h4>Community Supporter</h4>
              <p>Visit voice rooms 5 times</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
