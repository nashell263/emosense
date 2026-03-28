/**
 * EmoSense Emergency Support
 * Rapid access to crisis resources and automation.
 */

export function renderEmergencySupport(container) {
  container.innerHTML = `
    <div class="emergency-page">
      <div class="emergency-header">
        <div class="pulse-icon">🚨</div>
        <h1>You're Not Alone</h1>
        <p>If you or someone else is in immediate danger, please use these resources.</p>
      </div>

      <div class="emergency-actions">
        <a href="tel:+2634790652" class="emergency-btn call">
          <span class="icon">📞</span>
          <div class="btn-text">
            <strong>Befrienders Zimbabwe</strong>
            <span>24/7 Suicide Prevention</span>
          </div>
        </a>
        
        <div class="support-channels">
          <div class="channel-card">
            <h3>MSU Counseling Unit</h3>
            <p>Available during business hours at Student Affairs.</p>
            <p class="local-label"><em>Unesu, mwana wangu. Hatina kukusiyai. (Shona)</em></p>
            <p class="local-label"><em>Ulawe, mntanami. Asikushiyanga. (Ndebele)</em></p>
            <a href="tel:0542260331" class="channel-btn">Call Unit</a>
          </div>

          <div class="channel-card">
            <h3>Crisis Text Line</h3>
            <p>Prefer to type? Message our specialized crisis AI or reach out to external help.</p>
            <button class="channel-btn" onclick="window.location.hash='#chat'">Talk to EmoSense</button>
          </div>
        </div>

        <div class="emergency-safety">
          <h3>Immediate Safety Tips</h3>
          <ul>
            <li>Try a grounding technique (Look for 5 things you can see)</li>
            <li>Call or text a friend or family member right now</li>
            <li>Get to a safe, well-lit place</li>
            <li>Stay on the line with someone until help arrives</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}
