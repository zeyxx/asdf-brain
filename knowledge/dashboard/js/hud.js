/**
 * CYNIC HUD Module
 * HUD updates, detail panel, view toggling
 */

import { PHI, PHI_INV, VERDICT_THRESHOLDS } from './constants.js';
import * as state from './state.js';
import { rebuildScene, updateVisibility } from './scene.js';

/**
 * Update the HUD display
 */
export function updateHUD() {
  let weightedLogSum = 0;
  let totalWeight = 0;

  for (const [name, config] of Object.entries(state.DIMENSIONS)) {
    const score = state.currentScores[name] || 50;
    weightedLogSum += config.weight * Math.log(Math.max(1, score));
    totalWeight += config.weight;
  }

  const globalScore = Math.exp(weightedLogSum / totalWeight);
  const confidence = Math.min(PHI_INV * 100, 61.8);
  const doubt = 100 - confidence;

  document.getElementById('global-score').textContent = Math.round(globalScore).toString();
  document.getElementById('confidence').textContent = confidence.toFixed(1) + '%';
  document.getElementById('doubt').textContent = doubt.toFixed(1) + '%';

  let verdict = 'TRANSFORM';
  if (globalScore >= VERDICT_THRESHOLDS.TRUST) verdict = 'TRUST';
  if (globalScore < VERDICT_THRESHOLDS.REJECT) verdict = 'REJECT';

  const verdictEl = document.getElementById('verdict');
  verdictEl.textContent = verdict;
  verdictEl.style.color = verdict === 'TRUST' ? '#00ff88' : verdict === 'REJECT' ? '#ff3366' : '#d4a017';

  document.getElementById('residuals').textContent = '0';
}

/**
 * Show detail panel for a specific dimension
 */
export function showDimensionDetail(name) {
  const config = state.DIMENSIONS[name];
  const score = state.currentScores[name] || 50;

  document.getElementById('detail-name').textContent = name.replace(/_/g, ' ');
  document.getElementById('detail-score').textContent = score + '/100';
  document.getElementById('detail-weight').textContent = config.weight.toFixed(3);
  document.getElementById('detail-category').textContent = config.category;
  document.getElementById('detail-category').style.color = '#' + config.color.toString(16).padStart(6, '0');
  document.getElementById('detail-world').textContent = config.world;

  const harmonies = state.edgeLines
    .filter(l => l.userData.from === name || l.userData.to === name)
    .map(l => ({
      other: l.userData.from === name ? l.userData.to : l.userData.from,
      value: l.userData.harmony
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);

  const container = document.getElementById('harmony-items');
  container.replaceChildren();

  harmonies.forEach(h => {
    const item = document.createElement('div');
    item.style.cssText = 'display: flex; justify-content: space-between; font-size: 10px; color: #888; margin-bottom: 4px;';

    const nameSpan = document.createElement('span');
    nameSpan.textContent = h.other.replace(/_/g, ' ');

    const barContainer = document.createElement('div');
    barContainer.style.cssText = 'width: 60px; height: 4px; background: #222; border-radius: 2px; overflow: hidden;';

    const barFill = document.createElement('div');
    barFill.style.cssText = 'height: 100%; background: linear-gradient(90deg, #d4a017, #00ffff); width: ' + (h.value * 100) + '%;';

    barContainer.appendChild(barFill);
    item.appendChild(nameSpan);
    item.appendChild(barContainer);
    container.appendChild(item);
  });

  document.getElementById('detail-panel').classList.add('visible');
}

/**
 * Hide the detail panel
 */
export function hideDetailPanel() {
  document.getElementById('detail-panel').classList.remove('visible');
  state.setSelectedDimension(null);
}

/**
 * Toggle between 4 Mondes and 5×5 views
 */
export function toggleView() {
  const newView = state.currentView === '4mondes' ? '5x5' : '4mondes';
  state.setCurrentView(newView);

  // Update UI
  const btn = document.getElementById('toggle-view');
  const label = document.getElementById('view-label');
  const legend4 = document.getElementById('legend-4mondes');
  const legend5 = document.getElementById('legend-5x5');

  if (newView === '5x5') {
    btn.textContent = 'Switch to 4 Mondes';
    label.textContent = '5×5 MATRIX - Universal Interface';
    if (legend4) legend4.style.display = 'none';
    if (legend5) legend5.style.display = 'block';
  } else {
    btn.textContent = 'Switch to 5×5 Matrix';
    label.textContent = '4 MONDES - Internal View';
    if (legend4) legend4.style.display = 'block';
    if (legend5) legend5.style.display = 'none';
  }

  // Rebuild the scene
  rebuildScene();
  updateHUD();

  console.log('[View] Switched to:', newView);
}

/**
 * Update the live indicator
 */
export function updateLiveIndicator() {
  let indicator = document.getElementById('live-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'live-indicator';
    indicator.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); font-size: 10px; z-index: 100;';
    document.body.appendChild(indicator);
  }

  if (state.isLive) {
    indicator.style.color = '#00ff88';
    indicator.textContent = 'LIVE - Last update: ' + state.lastUpdate.toLocaleTimeString();
  } else {
    indicator.style.color = '#ff3366';
    indicator.textContent = 'OFFLINE - Using sample data';
  }
}

/**
 * Update category filter UI
 */
export function updateCategoryUI(category) {
  state.setActiveCategory(category);

  document.querySelectorAll('.category-item').forEach(item => {
    item.classList.toggle('active', item.dataset.category === category);
  });

  updateVisibility();
}

/**
 * Update the discovered count in the legend
 */
export function updateDiscoveredCount() {
  const discoveredDims = Object.entries(state.DIMENSIONS)
    .filter(([_, cfg]) => cfg.category === 'DISCOVERED');

  const countEl = document.querySelector('[data-category="DISCOVERED"] span');
  if (countEl) {
    countEl.textContent = `DISCOVERED (${discoveredDims.length})`;
  }

  // Update ALL count
  const allCount = Object.keys(state.DIMENSIONS).length;
  const allEl = document.querySelector('[data-category="ALL"] span');
  if (allEl) {
    allEl.textContent = `ALL (${allCount})`;
  }
}
