/**
 * CYNIC Dashboard Main Entry Point
 * Initializes all modules and event handlers
 */

import * as state from './state.js';
import { initScene, animate, onResize, updateVisibility } from './scene.js';
import { updateHUD, showDimensionDetail, hideDetailPanel, toggleView, updateLiveIndicator, updateCategoryUI } from './hud.js';
import { startLivePolling, triggerJudgment, updateFromLiveData } from './api.js';
import { toggleHandTracking } from './hands.js';

/**
 * Handle click events for dimension selection
 */
function onClick(event) {
  state.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  state.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  state.raycaster.setFromCamera(state.mouse, state.camera);

  const meshes = Object.values(state.dimensionMeshes).filter(m => m.userData.name);
  const intersects = state.raycaster.intersectObjects(meshes);

  if (intersects.length > 0) {
    const name = intersects[0].object.userData.name;
    if (name) {
      state.setSelectedDimension(name);
      showDimensionDetail(name);
    }
  } else {
    hideDetailPanel();
  }
}

/**
 * Handle keyboard shortcuts
 */
function onKeyDown(event) {
  const key = event.key;

  // Number keys 1-6 = filter categories
  if (key >= '1' && key <= '6') {
    const categories = ['PRIMARY', 'SECONDARY', 'META', 'HUMAN_LLM', 'DISCOVERY', 'DISCOVERED'];
    updateCategoryUI(categories[parseInt(key) - 1]);
  }

  // 0 or Escape = show ALL
  if (key === '0' || key === 'Escape') {
    updateCategoryUI('ALL');
    hideDetailPanel();
  }

  // V = toggle view (4 Mondes ↔ 5×5)
  if (key === 'v' || key === 'V') {
    toggleView();
  }

  // J = trigger manual judgment
  if (key === 'j' || key === 'J') {
    console.log('[Live] Manual judgment triggered');
    triggerJudgment().then(result => {
      if (result && result.scores) {
        updateFromLiveData(result);
      }
    });
  }

  // H = toggle hand tracking
  if (key === 'h' || key === 'H') {
    toggleHandTracking();
  }
}

/**
 * Set up category legend click handlers
 */
function setupCategoryLegend() {
  document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', () => {
      const category = item.dataset.category;
      updateCategoryUI(category);
    });
  });
}

/**
 * Set up toggle view button
 */
function setupToggleButton() {
  const btn = document.getElementById('toggle-view');
  if (btn) {
    btn.addEventListener('click', toggleView);
  }
}

/**
 * Initialize the dashboard
 */
function init() {
  console.log('[CYNIC] Initializing dashboard...');

  // Initialize Three.js scene
  initScene();

  // Update HUD with initial values
  updateHUD();

  // Show offline indicator initially
  updateLiveIndicator();

  // Set up event listeners
  window.addEventListener('click', onClick);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', onResize);

  // Set up UI interactions
  setupCategoryLegend();
  setupToggleButton();

  // Start animation loop
  animate();

  console.log('[CYNIC] Dashboard ready. Keys: 1-6 filter, V view, J judge, H hands');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
    startLivePolling();
  });
} else {
  init();
  startLivePolling();
}
