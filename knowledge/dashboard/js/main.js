/**
 * CYNIC Dashboard Main Entry Point
 * Initializes all modules and event handlers
 */

import * as state from './state.js';
import { initScene, animate as sceneAnimate, onResize, updateVisibility } from './scene.js';
import { updateHUD, showDimensionDetail, hideDetailPanel, toggleView, updateLiveIndicator, updateCategoryUI } from './hud.js';
import { startLivePolling, triggerJudgment, updateFromLiveData } from './api.js';
import { toggleHandTracking } from './hands.js';
import { animateCommits, fetchAndVisualizeCommits } from './commits.js';
import { animateErrors, fetchAndVisualizeErrors } from './errors.js';
import { animatePatterns, fetchAndVisualizePatterns } from './patterns.js';
import { initPyramid, animatePyramid, fetchAndUpdateRoadmap } from './roadmap.js';
import { initInnommable, animateInnommable, fetchAndUpdateInnommable } from './innommable.js';
import TreeOfLife from './tree/index.js';

// Tree of Life state
let isTreeViewActive = false;

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

  // T = toggle Tree of Life view
  if (key === 't' || key === 'T') {
    const domElement = state.renderer?.domElement || document.body;
    isTreeViewActive = TreeOfLife.toggleTreeView(state.scene, state.camera, state.controls, domElement);
    console.log(`[CYNIC] Tree of Life: ${isTreeViewActive ? 'ACTIVE' : 'HIDDEN'}`);
    // Update visibility of regular dimension meshes
    updateVisibility(!isTreeViewActive);
  }

  // Tree view shortcuts (when tree is active)
  if (isTreeViewActive) {
    // View mode cycling
    // M = cycle through view modes (TREE → WORLD → AXIOM → FLOW)
    if (key === 'm' || key === 'M') {
      const mode = TreeOfLife.cycleViewMode();
      console.log(`[Tree] View mode: ${mode}`);
    }

    // W = cycle through worlds
    if (key === 'w' || key === 'W') {
      const world = TreeOfLife.cycleWorld();
      console.log(`[Tree] Showing world: ${world}`);
    }

    // A = cycle through axioms
    if (key === 'a' || key === 'A') {
      const axiom = TreeOfLife.cycleAxiom();
      console.log(`[Tree] Showing axiom: ${axiom}`);
    }

    // World quick access: 7 = ATZILUT, 8 = BERIAH, 9 = YETZIRAH, - = ASSIAH
    if (key === '7') {
      TreeOfLife.showATZILUT();
      console.log('[Tree] ATZILUT (PHI) - Émanation');
    }
    if (key === '8') {
      TreeOfLife.showBERIAH();
      console.log('[Tree] BERIAH (VERIFY) - Création');
    }
    if (key === '9') {
      TreeOfLife.showYETZIRAH();
      console.log('[Tree] YETZIRAH (CULTURE) - Formation');
    }
    if (key === '-' || key === '0') {
      TreeOfLife.showASSIAH();
      console.log('[Tree] ASSIAH (BURN) - Action');
    }

    // F = Flow mode (start continuous flow animation)
    if (key === 'f' || key === 'F') {
      TreeOfLife.startContinuousFlow();
      console.log('[Tree] Continuous flow started (press R to stop)');
    }

    // B = Burn burst
    if (key === 'b' || key === 'B') {
      TreeOfLife.triggerBurnBurst(1.5);
      TreeOfLife.onBurnEvent({ amount: 1000 });
      console.log('[Tree] Burn burst triggered');
    }

    // R = Reset to full tree view
    if (key === 'r' || key === 'R') {
      TreeOfLife.stopContinuousFlow();
      TreeOfLife.resetHighlights();
      TreeOfLife.resetPaths();
      console.log('[Tree] Reset to full tree view');
    }

    // Axiom quick access: Shift + number
    if (event.shiftKey) {
      if (key === '!') { // Shift+1
        TreeOfLife.showPHI();
        console.log('[Tree] Axiom: PHI (φ qui gouverne tout)');
      }
      if (key === '@') { // Shift+2
        TreeOfLife.showVERIFY();
        console.log('[Tree] Axiom: VERIFY (Don\'t trust, verify)');
      }
      if (key === '#') { // Shift+3
        TreeOfLife.showCULTURE();
        console.log('[Tree] Axiom: CULTURE (Culture is a moat)');
      }
      if (key === '$') { // Shift+4
        TreeOfLife.showBURN();
        console.log('[Tree] Axiom: BURN (Don\'t extract, burn)');
      }
    }
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
 * Combined animation loop
 */
function animate() {
  requestAnimationFrame(animate);

  // Core scene animation
  sceneAnimate();

  // Level 3 visualizations
  animateCommits();
  animateErrors();
  animatePatterns();

  // Roadmap pyramid
  animatePyramid();

  // THE_INNOMMABLE (frontier visualization)
  animateInnommable();
}

/**
 * Start visualization data fetching
 */
function startVisualizationPolling() {
  // Initial fetch
  fetchAndVisualizeCommits();
  fetchAndVisualizeErrors();
  fetchAndVisualizePatterns();
  fetchAndUpdateRoadmap();
  fetchAndUpdateInnommable();

  // Periodic updates (staggered to avoid API spam)
  setInterval(fetchAndVisualizeCommits, 10000);   // 10s
  setInterval(fetchAndVisualizeErrors, 15000);    // 15s
  setInterval(fetchAndVisualizePatterns, 30000);  // 30s
  setInterval(fetchAndUpdateRoadmap, 30000);      // 30s
  setInterval(fetchAndUpdateInnommable, 10000);   // 10s (faster for emergence)
}

/**
 * Initialize the dashboard
 */
function init() {
  console.log('[CYNIC] Initializing dashboard...');

  // Initialize Three.js scene
  initScene();

  // Initialize roadmap pyramid
  initPyramid();

  // Initialize THE_INNOMMABLE frontier
  initInnommable();

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

  // Start animation loop (now includes Level 3 visualizations)
  animate();

  // Start visualization polling
  startVisualizationPolling();

  console.log('[CYNIC] Dashboard ready. Keys: 1-6 filter, V view, J judge, H hands, T tree');
  console.log('[CYNIC] Level 3 VISUALISATION: Commits, Errors, Patterns active');
  console.log('[CYNIC] ROADMAP: Pyramid visualization active (left side)');
  console.log('[CYNIC] Level 4 ÉMERGENCE: THE_INNOMMABLE frontier active (outer ring)');
  console.log('[CYNIC] 🌳 Tree of Life: Press T to toggle');
  console.log('[CYNIC] Tree shortcuts: M=mode, W=world, A=axiom, 7-9/0=worlds, Shift+1-4=axioms');
  console.log('[CYNIC] Tree actions: F=flow, B=burn, R=reset, click sefirot/paths for info');
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
