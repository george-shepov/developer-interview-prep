(() => {
  'use strict';

  const PROFILE_KEY = 'gs_vocab_profile_v1';

  function loadProfile() {
    try {
      const parsed = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function formatNumber(value) {
    return Number.isFinite(value) ? value.toLocaleString() : '—';
  }

  function renderVocabularyProfile() {
    const target = document.getElementById('vocabularyProfileSummary');
    if (!target) return;

    const profile = loadProfile();
    const developer = profile.assessments?.developer;
    const range = Array.isArray(profile.receptiveRange)
      ? `${formatNumber(profile.receptiveRange[0])}–${formatNumber(profile.receptiveRange[1])}`
      : 'Not tested';
    const learningCount = Array.isArray(profile.learningWords) ? profile.learningWords.length : 0;

    target.innerHTML = `
      <div><strong>${formatNumber(profile.receptiveEstimate)}</strong><span>Estimated word families</span></div>
      <div><strong>${Number.isFinite(developer?.percent) ? `${developer.percent}%` : '—'}</strong><span>Developer terminology</span></div>
      <div><strong>${range}</strong><span>Approximate range</span></div>
      <div><strong>${learningCount}</strong><span>Terms in learning queue</span></div>
    `;
  }

  document.addEventListener('DOMContentLoaded', renderVocabularyProfile);
  window.addEventListener('storage', event => {
    if (event.key === PROFILE_KEY) renderVocabularyProfile();
  });
  window.addEventListener('vocabulary-profile-updated', renderVocabularyProfile);
})();
