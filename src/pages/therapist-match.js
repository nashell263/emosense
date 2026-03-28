/**
 * EmoSense AI Therapist Matching
 * Question-based matching with compatible counselors.
 */

import { apiPost } from '../api.js';

export function renderTherapistMatch(container) {
  container.innerHTML = `
    <div class="matching-page">
      <div class="page-header">
        <h1>Find Your Perfect Counselor</h1>
        <p>Our AI matches you with the best human counselor based on your unique needs and preferences.</p>
      </div>

      <div id="matching-quiz" class="quiz-container">
        <div class="quiz-step" id="step-1">
          <h3>What's on your mind? (Select all that apply)</h3>
          <div class="options-grid">
            <label class="option-check"><input type="checkbox" name="issue" value="anxiety"> Anxiety</label>
            <label class="option-check"><input type="checkbox" name="issue" value="depression"> Depression</label>
            <label class="option-check"><input type="checkbox" name="issue" value="academic stress"> Academic Stress</label>
            <label class="option-check"><input type="checkbox" name="issue" value="relationships"> Relationships</label>
            <label class="option-check"><input type="checkbox" name="issue" value="loneliness"> Loneliness</label>
            <label class="option-check"><input type="checkbox" name="issue" value="career"> Career Anxiety</label>
          </div>
          <button class="next-btn" id="quiz-next-btn">Next</button>
        </div>

        <div class="quiz-step" id="step-2" style="display:none;">
          <h3>Preference for your counselor?</h3>
          <div class="pref-grid">
            <label><input type="radio" name="gender" value="any" checked> Any Gender</label>
            <label><input type="radio" name="gender" value="female"> Female</label>
            <label><input type="radio" name="gender" value="male"> Male</label>
          </div>
          <button class="match-btn" id="find-match-btn">Find My Match</button>
        </div>
      </div>

      <div id="match-results" style="display:none;">
        <h2>Top Matches for You</h2>
        <div id="results-list" class="matches-grid"></div>
      </div>
    </div>
  `;

  // Event Listeners
  document.getElementById('quiz-next-btn').onclick = () => {
    document.getElementById('step-1').style.display = 'none';
    document.getElementById('step-2').style.display = 'block';
  };

  document.getElementById('find-match-btn').onclick = async () => {
    const issues = Array.from(document.querySelectorAll('input[name="issue"]:checked')).map(el => el.value);
    const gender = document.querySelector('input[name="gender"]:checked').value;

    const res = await apiPost('/api/therapist-match', {
      issues,
      preferences: { gender: gender === 'any' ? null : gender }
    });

    document.getElementById('matching-quiz').style.display = 'none';
    const resultsContainer = document.getElementById('match-results');
    const resultsList = document.getElementById('results-list');
    resultsContainer.style.display = 'block';

    resultsList.innerHTML = res.matches.map(c => `
      <div class="match-card">
        <div class="match-score">${c.matchScore}% Match</div>
        <img src="${c.photo || '/placeholder-user.png'}" class="match-photo" />
        <div class="match-info">
          <h3>${c.name}</h3>
          <p class="specialty">${c.specialization}</p>
          <p class="match-bio">${c.bio.substring(0, 100)}...</p>
          <button class="chat-match-btn" onclick="window.location.hash='#chat'">Start Chat</button>
        </div>
      </div>
    `).join('');
  };
}
