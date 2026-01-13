/**
 * CYNIC Tree of Life - Main Entry Point
 *
 * "L'Arbre de Vie n'est pas une représentation statique - c'est CYNIC qui respire"
 *
 * This module coordinates:
 * - Sefirot creation and management
 * - Path (Laws) visualization
 * - Camera positioning for Tree view
 * - Event handling for Tree-specific interactions
 */

import * as THREE from 'three';
import {
  SEFIROT,
  PATHS,
  WORLDS,
  VISUAL,
  VIEW_MODES,
  DIMENSION_TO_SEFIRAH,
  PHI,
  PHI_INV,
} from './config.js';

import {
  createAllSefirot,
  clearAllSefirot,
  sefirotMeshes,
  highlightSefirah,
  highlightWorld,
  highlightAxiom,
  resetHighlights,
  pulseSefirah,
  updateSefirahGlow,
} from './sefirot.js';

import {
  createAllPaths,
  clearAllPaths,
  pathMeshes,
  highlightPath,
  highlightPathsByAxiom,
  highlightConnectedPaths,
  resetPaths,
  animateJudgmentFlow,
  animateBurnFlow,
} from './paths.js';

import {
  createBurnParticleSystem,
  triggerBurnBurst,
  createJudgmentPulse,
  startHeartbeat as startVitalsHeartbeat,
  stopHeartbeat as stopVitalsHeartbeat,
  updateHealthGlow,
  updateVitals,
  destroyVitals,
} from './vitals.js';

import {
  initViews,
  setView,
  cycleViewMode,
  cycleWorld,
  cycleAxiom,
  showTreeView as showTreeViewMode,
  startContinuousFlow,
  stopContinuousFlow,
  getCurrentViewInfo,
  showATZILUT,
  showBERIAH,
  showYETZIRAH,
  showASSIAH,
  showPHI,
  showVERIFY,
  showCULTURE,
  showBURN,
} from './views.js';

import {
  initNavigation,
  destroyNavigation,
  setInfoCallback,
  enableNavigation,
  disableNavigation,
} from './navigation.js';

// =============================================================================
// STATE
// =============================================================================

let isTreeViewActive = false;
let currentViewMode = VIEW_MODES.TREE;
let heartbeatInterval = null;
let sceneRef = null;
let cameraRef = null;
let controlsRef = null;
let domElementRef = null;

// Store original camera position for restoration
let originalCameraPosition = null;
let originalControlsTarget = null;

// Info panel callback (set by main.js)
let infoPanelCallback = null;

// =============================================================================
// INITIALIZE TREE VIEW
// =============================================================================

export function initTreeView(scene, camera, controls, domElement = null) {
  sceneRef = scene;
  cameraRef = camera;
  controlsRef = controls;
  domElementRef = domElement || document.body;

  // Create all sefirot and paths
  createAllSefirot(scene);
  createAllPaths(scene);

  // Create burn particle system (rising from MALKHUT)
  createBurnParticleSystem(scene);

  // Add world background planes (subtle, for context)
  createWorldBackgrounds(scene);

  // Initialize views module (camera animations)
  initViews(camera, controls);

  // Initialize navigation (click/hover handlers)
  initNavigation(scene, camera, domElementRef);

  // Set up info panel callback for navigation
  if (infoPanelCallback) {
    setInfoCallback(infoPanelCallback);
  }

  // Position camera for optimal tree view
  positionCameraForTree();

  // Start heartbeat (both local and vitals)
  startHeartbeat();
  startVitalsHeartbeat((sefirahName) => {
    pulseSefirah(sefirahName, 1000);
  });

  isTreeViewActive = true;
  console.log('🌳 Tree of Life initialized - CYNIC breathes');

  return {
    sefirotMeshes,
    pathMeshes,
    SEFIROT,
    PATHS,
    WORLDS,
  };
}

// =============================================================================
// DESTROY TREE VIEW
// =============================================================================

export function destroyTreeView(scene) {
  stopHeartbeat();
  stopVitalsHeartbeat();
  stopContinuousFlow();
  destroyVitals(scene);
  destroyNavigation();
  clearAllSefirot(scene);
  clearAllPaths(scene);
  clearWorldBackgrounds(scene);

  isTreeViewActive = false;
  domElementRef = null;
  console.log('🌳 Tree of Life destroyed');
}

// =============================================================================
// TOGGLE TREE VIEW
// =============================================================================

export function toggleTreeView(scene, camera, controls, domElement = null) {
  if (isTreeViewActive) {
    destroyTreeView(scene);
    restoreCamera();
    return false;
  } else {
    saveCameraPosition();
    initTreeView(scene, camera, controls, domElement);
    return true;
  }
}

/**
 * Set callback for info panel updates (called when user clicks on sefirah/path)
 */
export function setTreeInfoCallback(callback) {
  infoPanelCallback = callback;
  setInfoCallback(callback);
}

// =============================================================================
// CAMERA POSITIONING
// =============================================================================

function saveCameraPosition() {
  if (cameraRef && controlsRef) {
    originalCameraPosition = cameraRef.position.clone();
    originalControlsTarget = controlsRef.target.clone();
  }
}

function restoreCamera() {
  if (cameraRef && controlsRef && originalCameraPosition) {
    animateCameraTo(
      originalCameraPosition,
      originalControlsTarget,
      1000
    );
  }
}

function positionCameraForTree() {
  if (!cameraRef || !controlsRef) return;

  // Optimal viewing position for Tree of Life
  const targetPosition = new THREE.Vector3(0, 75, VISUAL.CAMERA_DISTANCE);
  const targetLookAt = new THREE.Vector3(0, 75, 0);

  animateCameraTo(targetPosition, targetLookAt, 1500);
}

function animateCameraTo(position, lookAt, duration = 1000) {
  if (!cameraRef || !controlsRef) return;

  const startPos = cameraRef.position.clone();
  const startTarget = controlsRef.target.clone();
  const startTime = Date.now();

  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);

    cameraRef.position.lerpVectors(startPos, position, eased);
    controlsRef.target.lerpVectors(startTarget, lookAt, eased);
    controlsRef.update();

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  animate();
}

// =============================================================================
// WORLD BACKGROUNDS
// =============================================================================

const worldBackgrounds = [];

function createWorldBackgrounds(scene) {
  for (const [name, world] of Object.entries(WORLDS)) {
    const yMin = world.yRange[0];
    const yMax = world.yRange[1];
    const height = yMax - yMin;
    const yCenter = (yMin + yMax) / 2;

    const geometry = new THREE.PlaneGeometry(400, height);
    const material = new THREE.MeshBasicMaterial({
      color: world.color,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
    });

    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(0, yCenter, -50);
    plane.userData = { type: 'worldBackground', world: name };

    scene.add(plane);
    worldBackgrounds.push(plane);
  }
}

function clearWorldBackgrounds(scene) {
  for (const plane of worldBackgrounds) {
    scene.remove(plane);
  }
  worldBackgrounds.length = 0;
}

// =============================================================================
// HEARTBEAT SYSTEM
// =============================================================================

function startHeartbeat() {
  // Initial pulse
  pulseSefirah('TIFERET', 1000);

  // Regular heartbeat at φ⁻¹ × 100 seconds = 61.8 seconds
  heartbeatInterval = setInterval(() => {
    pulseSefirah('TIFERET', 1000);
    console.log('💓 CYNIC heartbeat - TIFERET pulse');
  }, VISUAL.PULSE_INTERVAL);
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// =============================================================================
// VIEW MODE SWITCHING
// =============================================================================

export function setViewMode(mode) {
  currentViewMode = mode;

  switch (mode) {
    case VIEW_MODES.TREE:
      resetHighlights();
      resetPaths();
      break;

    case VIEW_MODES.WORLD:
      // Will be controlled by highlightWorld()
      break;

    case VIEW_MODES.AXIOM:
      // Will be controlled by highlightAxiom()
      break;

    case VIEW_MODES.FLOW:
      // Show flow animation
      animateJudgmentFlow();
      break;
  }

  return currentViewMode;
}

// =============================================================================
// UPDATE SCORES (from dimension scores to sefirot glow)
// =============================================================================

export function updateTreeScores(dimensionScores) {
  // For each sefirah, calculate average score of its dimensions
  for (const [sefirahName, sefirah] of Object.entries(SEFIROT)) {
    let totalScore = 0;
    let count = 0;

    for (const dim of sefirah.dimensions) {
      if (dimensionScores[dim] !== undefined) {
        totalScore += dimensionScores[dim];
        count++;
      }
    }

    if (count > 0) {
      const avgScore = totalScore / count;
      // Normalize to 0-1 range
      const intensity = avgScore / 100;
      updateSefirahGlow(sefirahName, intensity);
    }
  }
}

// =============================================================================
// EVENT: ON BURN
// =============================================================================

export function onBurnEvent(burnData) {
  if (!isTreeViewActive) return;

  // Pulse MALKHUT (burn source)
  pulseSefirah('MALKHUT', 800);

  // Trigger burn burst in particle system
  const intensity = burnData?.amount ? Math.min(burnData.amount / 1000, 2) : 1.0;
  triggerBurnBurst(intensity);

  // Animate burn flow from MALKHUT to KETER
  setTimeout(() => {
    animateBurnFlow(VISUAL.BURN_RISE_DURATION);
  }, 400);

  console.log('🔥 Burn event visualized in Tree');
}

// =============================================================================
// EVENT: ON JUDGMENT
// =============================================================================

export function onJudgmentEvent(judgmentData) {
  if (!isTreeViewActive) return;

  // Pulse KETER (judgment origin)
  pulseSefirah('KETER', 800);

  // Create judgment pulse particle
  if (sceneRef) {
    createJudgmentPulse(sceneRef);
  }

  // Animate judgment flow from KETER to MALKHUT
  setTimeout(() => {
    animateJudgmentFlow(VISUAL.JUDGMENT_FALL_DURATION);
  }, 400);

  console.log('⚖️ Judgment event visualized in Tree');
}

// =============================================================================
// INTERACTION: CLICK ON SEFIRAH
// =============================================================================

export function handleSefirahClick(sefirahName) {
  const sefirah = SEFIROT[sefirahName];
  if (!sefirah) return null;

  // Highlight the sefirah
  resetHighlights();
  highlightSefirah(sefirahName, true);

  // Highlight connected paths
  highlightConnectedPaths(sefirahName);

  return {
    name: sefirah.name,
    hebrew: sefirah.hebrew,
    english: sefirah.english,
    world: sefirah.world,
    axiom: sefirah.axiom,
    dimensions: sefirah.dimensions,
    description: sefirah.description,
  };
}

// =============================================================================
// INTERACTION: CLICK ON PATH
// =============================================================================

export function handlePathClick(pathName) {
  const path = PATHS[pathName];
  if (!path) return null;

  // Highlight the path
  resetPaths();
  highlightPath(pathName, true);

  // Highlight connected sefirot
  resetHighlights();
  highlightSefirah(path.from, true);
  highlightSefirah(path.to, true);

  return {
    law: path.law,
    from: path.from,
    to: path.to,
    axiom: path.axiom,
    description: path.description,
  };
}

// =============================================================================
// HIGHLIGHT DIMENSION (find its sefirah)
// =============================================================================

export function highlightDimension(dimensionName) {
  const sefirahName = DIMENSION_TO_SEFIRAH[dimensionName];
  if (sefirahName) {
    resetHighlights();
    highlightSefirah(sefirahName, true);
    return sefirahName;
  }
  return null;
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  isTreeViewActive,
  currentViewMode,
  VIEW_MODES,
  SEFIROT,
  PATHS,
  WORLDS,
  DIMENSION_TO_SEFIRAH,
  VISUAL,
  // Re-export sefirot functions
  highlightSefirah,
  highlightWorld,
  highlightAxiom,
  resetHighlights,
  pulseSefirah,
  // Re-export path functions
  highlightPath,
  highlightPathsByAxiom,
  resetPaths,
  animateJudgmentFlow,
  animateBurnFlow,
  // Re-export vitals functions
  updateVitals,
  updateHealthGlow,
  triggerBurnBurst,
  // Re-export views functions
  setView,
  cycleViewMode,
  cycleWorld,
  cycleAxiom,
  startContinuousFlow,
  stopContinuousFlow,
  getCurrentViewInfo,
  showATZILUT,
  showBERIAH,
  showYETZIRAH,
  showASSIAH,
  showPHI,
  showVERIFY,
  showCULTURE,
  showBURN,
  // Re-export navigation functions
  enableNavigation,
  disableNavigation,
};

export default {
  initTreeView,
  destroyTreeView,
  toggleTreeView,
  setTreeInfoCallback,
  setViewMode,
  updateTreeScores,
  onBurnEvent,
  onJudgmentEvent,
  handleSefirahClick,
  handlePathClick,
  highlightDimension,
  // Vitals
  updateVitals,
  updateHealthGlow,
  triggerBurnBurst,
  // Sefirot
  highlightSefirah,
  highlightWorld,
  highlightAxiom,
  resetHighlights,
  pulseSefirah,
  // Paths
  highlightPath,
  highlightPathsByAxiom,
  resetPaths,
  animateJudgmentFlow,
  animateBurnFlow,
  // Views (4 modes)
  setView,
  cycleViewMode,
  cycleWorld,
  cycleAxiom,
  startContinuousFlow,
  stopContinuousFlow,
  getCurrentViewInfo,
  // World shortcuts
  showATZILUT,
  showBERIAH,
  showYETZIRAH,
  showASSIAH,
  // Axiom shortcuts
  showPHI,
  showVERIFY,
  showCULTURE,
  showBURN,
  // Navigation
  enableNavigation,
  disableNavigation,
  // State getters
  isTreeViewActive: () => isTreeViewActive,
  currentViewMode: () => currentViewMode,
};
