/**
 * CYNIC Dashboard State Management
 * Centralized state for all modules
 */

import { DIMENSIONS_4MONDES, DIMENSIONS_5x5, DEFAULT_SCORES } from './dimensions.js';

// Current view mode
export let currentView = '4mondes';

// Active dimensions based on view
export let DIMENSIONS = { ...DIMENSIONS_4MONDES };

// Current scores (mutable)
export let currentScores = { ...DEFAULT_SCORES };

// Three.js objects
export let scene = null;
export let camera = null;
export let renderer = null;
export let controls = null;
export let dimensionMeshes = {};
export let edgeLines = [];
export let coreParticles = null;

// Interaction state
export let raycaster = null;
export let mouse = null;
export let selectedDimension = null;
export let activeCategory = 'ALL';

// Live data state
export let isLive = false;
export let lastUpdate = null;

// Hand tracking state
export let handTrackingEnabled = false;
export let handsInstance = null;
export let cameraInstance = null;
export let leftFingers = 0;
export let rightFingers = 0;
export let leftHandPos = null;
export let rightHandPos = null;
export let lastLeftFingers = 0;
export let lastRightFingers = 0;
export let gestureDebounce = 0;

// Setters for state updates
export function setCurrentView(view) {
  currentView = view;
  DIMENSIONS = view === '4mondes' ? { ...DIMENSIONS_4MONDES } : { ...DIMENSIONS_5x5 };
}

export function setScene(s) { scene = s; }
export function setCamera(c) { camera = c; }
export function setRenderer(r) { renderer = r; }
export function setControls(c) { controls = c; }
export function setRaycaster(r) { raycaster = r; }
export function setMouse(m) { mouse = m; }

export function setDimensionMesh(name, mesh) {
  dimensionMeshes[name] = mesh;
}

export function clearDimensionMeshes() {
  const core = dimensionMeshes._core;
  dimensionMeshes = core ? { _core: core } : {};
}

export function addEdgeLine(line) {
  edgeLines.push(line);
}

export function clearEdgeLines() {
  edgeLines = [];
}

export function setCoreParticles(p) { coreParticles = p; }

export function setSelectedDimension(dim) { selectedDimension = dim; }
export function setActiveCategory(cat) { activeCategory = cat; }

export function setIsLive(live) { isLive = live; }
export function setLastUpdate(date) { lastUpdate = date; }

export function updateScores(scores) {
  currentScores = { ...currentScores, ...scores };
}

export function addDimension(name, config) {
  DIMENSIONS[name] = config;
  DIMENSIONS_4MONDES[name] = config;
}

// Hand tracking setters
export function setHandTrackingEnabled(enabled) { handTrackingEnabled = enabled; }
export function setHandsInstance(h) { handsInstance = h; }
export function setCameraInstance(c) { cameraInstance = c; }
export function setLeftFingers(f) { leftFingers = f; }
export function setRightFingers(f) { rightFingers = f; }
export function setLeftHandPos(p) { leftHandPos = p; }
export function setRightHandPos(p) { rightHandPos = p; }
export function setLastLeftFingers(f) { lastLeftFingers = f; }
export function setLastRightFingers(f) { lastRightFingers = f; }
export function setGestureDebounce(d) { gestureDebounce = d; }
