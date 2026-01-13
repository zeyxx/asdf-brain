/**
 * CYNIC Tree of Life - View Modes
 *
 * 4 perspectives pour comprendre l'architecture CYNIC:
 * 1. TREE - Vue complète de l'Arbre de Vie
 * 2. WORLD - Focus sur un monde (ATZILUT, BERIAH, YETZIRAH, ASSIAH)
 * 3. AXIOM - Highlight par axiom (PHI, VERIFY, CULTURE, BURN)
 * 4. FLOW - Animation du flux d'énergie (burns up, judgments down)
 *
 * "Chaque perspective révèle un aspect différent de CYNIC"
 */

import * as THREE from 'three';
import { SEFIROT, PATHS, WORLDS, VISUAL, VIEW_MODES, PHI, PHI_INV } from './config.js';
import {
  highlightWorld as highlightWorldSefirot,
  highlightAxiom as highlightAxiomSefirot,
  resetHighlights,
} from './sefirot.js';
import {
  highlightPathsByAxiom,
  resetPaths,
  animateJudgmentFlow,
  animateBurnFlow,
} from './paths.js';

// =============================================================================
// STATE
// =============================================================================

let currentView = VIEW_MODES.TREE;
let currentWorld = null;
let currentAxiom = null;
let cameraRef = null;
let controlsRef = null;
let isAnimating = false;

// Camera positions for each world
const WORLD_CAMERA_POSITIONS = {
  ATZILUT: { position: new THREE.Vector3(0, 270, 250), target: new THREE.Vector3(0, 270, 0) },
  BERIAH: { position: new THREE.Vector3(0, 140, 250), target: new THREE.Vector3(0, 140, 0) },
  YETZIRAH: { position: new THREE.Vector3(0, 20, 250), target: new THREE.Vector3(0, 20, 0) },
  ASSIAH: { position: new THREE.Vector3(0, -105, 250), target: new THREE.Vector3(0, -105, 0) },
};

// Full tree camera position
const TREE_CAMERA = {
  position: new THREE.Vector3(0, 75, VISUAL.CAMERA_DISTANCE),
  target: new THREE.Vector3(0, 75, 0),
};

// =============================================================================
// INITIALIZATION
// =============================================================================

export function initViews(camera, controls) {
  cameraRef = camera;
  controlsRef = controls;
}

// =============================================================================
// VIEW MODE SWITCHING
// =============================================================================

/**
 * Set the current view mode
 */
export function setView(mode, options = {}) {
  currentView = mode;

  switch (mode) {
    case VIEW_MODES.TREE:
      showTreeView();
      break;

    case VIEW_MODES.WORLD:
      if (options.world) {
        showWorldView(options.world);
      }
      break;

    case VIEW_MODES.AXIOM:
      if (options.axiom) {
        showAxiomView(options.axiom);
      }
      break;

    case VIEW_MODES.FLOW:
      showFlowView(options.direction || 'both');
      break;

    default:
      showTreeView();
  }

  return currentView;
}

/**
 * Cycle through view modes
 */
export function cycleViewMode() {
  const modes = Object.values(VIEW_MODES);
  const currentIndex = modes.indexOf(currentView);
  const nextIndex = (currentIndex + 1) % modes.length;
  return setView(modes[nextIndex]);
}

// =============================================================================
// TREE VIEW (Full)
// =============================================================================

function showTreeView() {
  currentWorld = null;
  currentAxiom = null;

  // Reset all highlights
  resetHighlights();
  resetPaths();

  // Animate camera to full tree position
  animateCameraTo(TREE_CAMERA.position, TREE_CAMERA.target, 1000);

  console.log('[View] 🌳 Full Tree of Life');
}

// =============================================================================
// WORLD VIEW
// =============================================================================

function showWorldView(worldName) {
  const world = WORLDS[worldName];
  if (!world) {
    console.warn(`[View] Unknown world: ${worldName}`);
    return;
  }

  currentWorld = worldName;
  currentAxiom = null;

  // Highlight sefirot in this world
  highlightWorldSefirot(worldName);

  // Highlight paths for this world's axiom
  highlightPathsByAxiom(world.axiom);

  // Animate camera to world focus
  const camPos = WORLD_CAMERA_POSITIONS[worldName];
  if (camPos) {
    animateCameraTo(camPos.position, camPos.target, 1200);
  }

  console.log(`[View] 🌍 World: ${worldName} (${world.hebrew}) - ${world.axiom}`);
}

/**
 * Cycle through worlds
 */
export function cycleWorld() {
  const worldNames = Object.keys(WORLDS);
  const currentIndex = currentWorld ? worldNames.indexOf(currentWorld) : -1;
  const nextIndex = (currentIndex + 1) % worldNames.length;
  showWorldView(worldNames[nextIndex]);
  return worldNames[nextIndex];
}

// =============================================================================
// AXIOM VIEW
// =============================================================================

function showAxiomView(axiomName) {
  currentAxiom = axiomName;
  currentWorld = null;

  // Highlight sefirot by axiom
  highlightAxiomSefirot(axiomName);

  // Highlight paths for this axiom
  highlightPathsByAxiom(axiomName);

  // Get world for this axiom (for camera positioning)
  const worldEntry = Object.entries(WORLDS).find(([_, w]) => w.axiom === axiomName);
  if (worldEntry) {
    const [worldName] = worldEntry;
    const camPos = WORLD_CAMERA_POSITIONS[worldName];
    if (camPos) {
      animateCameraTo(camPos.position, camPos.target, 1200);
    }
  }

  console.log(`[View] ⚡ Axiom: ${axiomName}`);
}

/**
 * Cycle through axioms
 */
export function cycleAxiom() {
  const axioms = ['PHI', 'VERIFY', 'CULTURE', 'BURN'];
  const currentIndex = currentAxiom ? axioms.indexOf(currentAxiom) : -1;
  const nextIndex = (currentIndex + 1) % axioms.length;
  showAxiomView(axioms[nextIndex]);
  return axioms[nextIndex];
}

// =============================================================================
// FLOW VIEW
// =============================================================================

function showFlowView(direction = 'both') {
  currentWorld = null;
  currentAxiom = null;

  // Reset to full tree
  resetHighlights();
  resetPaths();
  animateCameraTo(TREE_CAMERA.position, TREE_CAMERA.target, 800);

  // Start flow animation after camera settles
  setTimeout(() => {
    if (direction === 'down' || direction === 'both') {
      animateJudgmentFlow(VISUAL.JUDGMENT_FALL_DURATION);
    }

    if (direction === 'up' || direction === 'both') {
      setTimeout(() => {
        animateBurnFlow(VISUAL.BURN_RISE_DURATION);
      }, direction === 'both' ? VISUAL.JUDGMENT_FALL_DURATION + 500 : 0);
    }
  }, 900);

  console.log(`[View] 🌊 Flow mode: ${direction}`);
}

/**
 * Start continuous flow animation
 */
export function startContinuousFlow() {
  if (isAnimating) return;
  isAnimating = true;

  function animate() {
    if (!isAnimating) return;

    // Alternate between judgment and burn flows
    animateJudgmentFlow(VISUAL.JUDGMENT_FALL_DURATION);

    setTimeout(() => {
      if (!isAnimating) return;
      animateBurnFlow(VISUAL.BURN_RISE_DURATION);

      setTimeout(() => {
        if (isAnimating) animate();
      }, VISUAL.BURN_RISE_DURATION + 1000);

    }, VISUAL.JUDGMENT_FALL_DURATION + 500);
  }

  animate();
  console.log('[View] 🔄 Continuous flow started');
}

/**
 * Stop continuous flow animation
 */
export function stopContinuousFlow() {
  isAnimating = false;
  console.log('[View] ⏹️ Continuous flow stopped');
}

// =============================================================================
// CAMERA ANIMATION
// =============================================================================

function animateCameraTo(position, target, duration = 1000) {
  if (!cameraRef || !controlsRef) return;

  const startPos = cameraRef.position.clone();
  const startTarget = controlsRef.target.clone();
  const startTime = Date.now();

  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease out cubic for smooth deceleration
    const eased = 1 - Math.pow(1 - progress, 3);

    cameraRef.position.lerpVectors(startPos, position, eased);
    controlsRef.target.lerpVectors(startTarget, target, eased);
    controlsRef.update();

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  animate();
}

// =============================================================================
// INFO PANEL
// =============================================================================

/**
 * Get info for current view (for HUD display)
 */
export function getCurrentViewInfo() {
  const info = {
    mode: currentView,
    world: currentWorld,
    axiom: currentAxiom,
  };

  if (currentWorld) {
    const world = WORLDS[currentWorld];
    info.worldInfo = {
      name: world.name,
      hebrew: world.hebrew,
      english: world.english,
      axiom: world.axiom,
      sefirot: world.sefirot,
      description: world.description,
    };
  }

  if (currentAxiom) {
    info.axiomInfo = {
      name: currentAxiom,
      description: getAxiomDescription(currentAxiom),
    };
  }

  return info;
}

function getAxiomDescription(axiom) {
  const descriptions = {
    PHI: 'φ qui gouverne tout - All ratios derive from 1.618...',
    VERIFY: 'Don\'t trust, verify - Vérification avant confiance',
    CULTURE: 'Culture is a moat - La culture comme protection',
    BURN: 'Don\'t extract, burn - Destruction constructive',
  };
  return descriptions[axiom] || axiom;
}

// =============================================================================
// QUICK ACCESS FUNCTIONS
// =============================================================================

export function showATZILUT() { return showWorldView('ATZILUT'); }
export function showBERIAH() { return showWorldView('BERIAH'); }
export function showYETZIRAH() { return showWorldView('YETZIRAH'); }
export function showASSIAH() { return showWorldView('ASSIAH'); }

export function showPHI() { return showAxiomView('PHI'); }
export function showVERIFY() { return showAxiomView('VERIFY'); }
export function showCULTURE() { return showAxiomView('CULTURE'); }
export function showBURN() { return showAxiomView('BURN'); }

// =============================================================================
// EXPORTS
// =============================================================================

export {
  currentView,
  currentWorld,
  currentAxiom,
  VIEW_MODES,
};

export default {
  initViews,
  setView,
  cycleViewMode,
  cycleWorld,
  cycleAxiom,
  showTreeView,
  startContinuousFlow,
  stopContinuousFlow,
  getCurrentViewInfo,
  // Quick access
  showATZILUT,
  showBERIAH,
  showYETZIRAH,
  showASSIAH,
  showPHI,
  showVERIFY,
  showCULTURE,
  showBURN,
};
