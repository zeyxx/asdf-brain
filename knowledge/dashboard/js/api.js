/**
 * CYNIC API Module
 * Live data connection and polling
 */

import { PHI, API_BASE, POLL_INTERVAL } from './constants.js';
import * as state from './state.js';
import { updateHUD, updateLiveIndicator } from './hud.js';
import { processDiscoveredDimensions } from './discovered.js';

/**
 * Fetch CYNIC data from API
 */
export async function fetchCynicData() {
  try {
    const response = await fetch(API_BASE + '/api/cynic');
    if (!response.ok) throw new Error('API error');
    return await response.json();
  } catch (e) {
    console.warn('[Live] Fetch failed:', e.message);
    return null;
  }
}

/**
 * Trigger a manual judgment
 */
export async function triggerJudgment() {
  try {
    const response = await fetch(API_BASE + '/api/judge');
    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    console.log('[Live] Judgment triggered:', data.verdict);
    return data;
  } catch (e) {
    console.warn('[Live] Judgment failed:', e.message);
    return null;
  }
}

/**
 * Update the scene from live API data
 */
export function updateFromLiveData(data) {
  if (!data) return;

  state.setIsLive(true);
  state.setLastUpdate(new Date());

  // Update scores
  if (data.scores) {
    state.updateScores(data.scores);

    // Update mesh sizes based on new scores
    for (const [name, mesh] of Object.entries(state.dimensionMeshes)) {
      if (name === '_core' || !state.DIMENSIONS[name]) continue;

      const score = state.currentScores[name] || 50;
      const config = state.DIMENSIONS[name];
      const baseSize = 8 + (score / 100) * 12;
      const size = baseSize * (config.weight / PHI);

      // Smooth transition
      mesh.userData.targetScale = size / mesh.geometry.parameters.radius;
      mesh.userData.score = score;
      mesh.material.emissiveIntensity = 0.3 + (score / 100) * 0.4;
    }
  }

  // Update HUD
  if (data.globalScore !== undefined) {
    document.getElementById('global-score').textContent = Math.round(data.globalScore).toString();
  }

  if (data.verdict) {
    const verdictEl = document.getElementById('verdict');
    // Handle verdict as object or string
    const verdictText = typeof data.verdict === 'object' ? data.verdict.action : data.verdict;
    verdictEl.textContent = verdictText;
    verdictEl.style.color = verdictText === 'TRUST' ? '#00ff88' :
                            verdictText === 'REJECT' ? '#ff3366' : '#d4a017';
  }

  if (data.confidence !== undefined) {
    document.getElementById('confidence').textContent = data.confidence.toFixed(1) + '%';
    document.getElementById('doubt').textContent = (100 - data.confidence).toFixed(1) + '%';
  }

  if (data.harmony) {
    document.getElementById('connections').textContent = data.harmony.connections.toString();
  }

  if (data.residuals) {
    document.getElementById('residuals').textContent = data.residuals.count.toString();
  }

  // Process dynamically discovered dimensions from THE_INNOMMABLE
  if (data.discovered_dimensions) {
    processDiscoveredDimensions(data.discovered_dimensions);
  }

  // Update live indicator
  updateLiveIndicator();
}

/**
 * Start live polling loop
 */
export async function startLivePolling() {
  // Initial fetch
  const data = await fetchCynicData();
  updateFromLiveData(data);

  // Poll every POLL_INTERVAL (6.18s)
  setInterval(async () => {
    const data = await fetchCynicData();
    updateFromLiveData(data);
  }, POLL_INTERVAL);

  console.log('[Live] Polling started, interval:', POLL_INTERVAL, 'ms');
}
