/**
 * CYNIC Tree of Life - Navigation & Interaction
 *
 * Handles click/hover interactions with Sefirot and Paths
 * Displays info panels and tooltips with code references
 *
 * "Cliquer sur un Sefirah révèle ses dimensions et ses connexions"
 */

import * as THREE from 'three';
import { SEFIROT, PATHS, WORLDS, DIMENSION_TO_SEFIRAH, VISUAL } from './config.js';
import {
  sefirotMeshes,
  highlightSefirah,
  resetHighlights,
} from './sefirot.js';
import {
  pathMeshes,
  highlightPath,
  highlightConnectedPaths,
  resetPaths,
} from './paths.js';

// =============================================================================
// STATE
// =============================================================================

let raycaster = null;
let mouse = null;
let cameraRef = null;
let sceneRef = null;
let hoveredObject = null;
let selectedSefirah = null;
let selectedPath = null;
let onSelectCallback = null;
let tooltipElement = null;

// =============================================================================
// INITIALIZATION
// =============================================================================

export function initNavigation(scene, camera, domElement) {
  sceneRef = scene;
  cameraRef = camera;
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Create tooltip element
  createTooltip();

  // Add event listeners
  domElement.addEventListener('click', onClick);
  domElement.addEventListener('mousemove', onMouseMove);
  domElement.addEventListener('mouseout', onMouseOut);

  console.log('[Navigation] Initialized');
}

/**
 * Set callback for selection events
 */
export function onSelect(callback) {
  onSelectCallback = callback;
}

// =============================================================================
// TOOLTIP (using safe DOM manipulation)
// =============================================================================

function createTooltip() {
  tooltipElement = document.createElement('div');
  tooltipElement.id = 'tree-tooltip';
  tooltipElement.style.cssText = `
    position: fixed;
    padding: 12px 16px;
    background: rgba(0, 0, 0, 0.9);
    border: 1px solid rgba(255, 215, 0, 0.5);
    border-radius: 8px;
    color: #fff;
    font-family: 'SF Mono', 'Monaco', monospace;
    font-size: 12px;
    pointer-events: none;
    z-index: 1000;
    display: none;
    max-width: 350px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  `;
  document.body.appendChild(tooltipElement);
}

function showTooltip(userData, x, y) {
  if (!tooltipElement) return;

  // Clear previous content
  tooltipElement.textContent = '';

  // Build tooltip using safe DOM methods
  buildTooltipContent(tooltipElement, userData);

  tooltipElement.style.display = 'block';

  // Position near mouse but within viewport
  const rect = tooltipElement.getBoundingClientRect();
  const maxX = window.innerWidth - rect.width - 20;
  const maxY = window.innerHeight - rect.height - 20;

  tooltipElement.style.left = `${Math.min(x + 15, maxX)}px`;
  tooltipElement.style.top = `${Math.min(y + 15, maxY)}px`;
}

function buildTooltipContent(container, userData) {
  if (userData.type === 'sefirah') {
    const sefirah = SEFIROT[userData.name];
    if (!sefirah) return;

    // Header with Hebrew and English
    const header = document.createElement('div');
    header.style.cssText = 'font-size: 18px; margin-bottom: 8px;';

    const hebrewSpan = document.createElement('span');
    hebrewSpan.style.fontSize = '24px';
    hebrewSpan.textContent = sefirah.hebrew;
    header.appendChild(hebrewSpan);

    const englishSpan = document.createElement('span');
    englishSpan.style.cssText = 'color: #888; margin-left: 8px;';
    englishSpan.textContent = sefirah.english;
    header.appendChild(englishSpan);

    container.appendChild(header);

    // World/Axiom
    const worldDiv = document.createElement('div');
    worldDiv.style.cssText = `color: ${getWorldColor(sefirah.world)}; margin-bottom: 6px;`;
    worldDiv.textContent = `${sefirah.world} / ${sefirah.axiom}`;
    container.appendChild(worldDiv);

    // Description
    const descDiv = document.createElement('div');
    descDiv.style.marginBottom = '6px';
    descDiv.textContent = sefirah.description;
    container.appendChild(descDiv);

    // Dimensions
    const dimDiv = document.createElement('div');
    dimDiv.style.cssText = 'font-size: 11px; color: #aaa;';
    dimDiv.textContent = 'Dimensions: ' + sefirah.dimensions.join(', ');
    container.appendChild(dimDiv);

    // Special markers
    if (sefirah.isHeartbeat) {
      const heartDiv = document.createElement('div');
      heartDiv.style.cssText = 'color: #f66; margin-top: 6px;';
      heartDiv.textContent = 'Heartbeat center';
      container.appendChild(heartDiv);
    }
    if (sefirah.isBurnSource) {
      const burnDiv = document.createElement('div');
      burnDiv.style.cssText = 'color: #f60; margin-top: 6px;';
      burnDiv.textContent = 'Burn source';
      container.appendChild(burnDiv);
    }
  }

  if (userData.type === 'path') {
    const path = PATHS[userData.law] || Object.values(PATHS).find(p => p.law === userData.law);
    if (!path) return;

    // Law name
    const lawDiv = document.createElement('div');
    lawDiv.style.cssText = 'font-size: 16px; margin-bottom: 8px; color: #ffd700;';
    lawDiv.textContent = path.law;
    container.appendChild(lawDiv);

    // From -> To
    const routeDiv = document.createElement('div');
    routeDiv.style.marginBottom = '6px';
    routeDiv.textContent = `${path.from} \u2192 ${path.to}`;
    container.appendChild(routeDiv);

    // Description
    const descDiv = document.createElement('div');
    descDiv.style.cssText = 'color: #aaa; margin-bottom: 6px;';
    descDiv.textContent = path.description;
    container.appendChild(descDiv);

    // Axiom
    const axiomDiv = document.createElement('div');
    axiomDiv.style.cssText = 'font-size: 11px; color: #666;';
    axiomDiv.textContent = `Axiom: ${path.axiom}`;
    container.appendChild(axiomDiv);
  }
}

function hideTooltip() {
  if (tooltipElement) {
    tooltipElement.style.display = 'none';
  }
}

// =============================================================================
// MOUSE EVENTS
// =============================================================================

function onClick(event) {
  updateMouse(event);

  const intersects = getIntersects();
  if (intersects.length === 0) {
    // Click on empty space - deselect
    deselectAll();
    return;
  }

  const object = intersects[0].object;
  const userData = object.userData;

  if (userData.type === 'sefirah') {
    selectSefirah(userData.name);
  } else if (userData.type === 'path') {
    selectPath(userData.law);
  }
}

function onMouseMove(event) {
  updateMouse(event);

  const intersects = getIntersects();

  if (intersects.length === 0) {
    // No hover
    if (hoveredObject) {
      onHoverEnd(hoveredObject);
      hoveredObject = null;
    }
    hideTooltip();
    document.body.style.cursor = 'default';
    return;
  }

  const object = intersects[0].object;
  const userData = object.userData;

  // Check if hovering new object
  if (hoveredObject !== object) {
    if (hoveredObject) {
      onHoverEnd(hoveredObject);
    }
    hoveredObject = object;
    onHoverStart(object);
  }

  // Update tooltip
  showTooltip(userData, event.clientX, event.clientY);
  document.body.style.cursor = 'pointer';
}

function onMouseOut() {
  if (hoveredObject) {
    onHoverEnd(hoveredObject);
    hoveredObject = null;
  }
  hideTooltip();
  document.body.style.cursor = 'default';
}

function updateMouse(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function getIntersects() {
  if (!raycaster || !cameraRef) return [];

  raycaster.setFromCamera(mouse, cameraRef);

  // Collect all interactive meshes
  const meshes = [
    ...Object.values(sefirotMeshes),
    ...Object.values(pathMeshes),
  ].filter(m => m && m.userData);

  return raycaster.intersectObjects(meshes);
}

// =============================================================================
// HOVER HANDLERS
// =============================================================================

function onHoverStart(object) {
  const userData = object.userData;

  if (userData.type === 'sefirah') {
    // Subtle highlight on hover (unless selected)
    if (selectedSefirah !== userData.name) {
      object.material.emissiveIntensity = 0.5;
    }
  } else if (userData.type === 'path') {
    // Show path label
    if (selectedPath !== userData.law) {
      object.material.emissiveIntensity = 0.4;
    }
  }
}

function onHoverEnd(object) {
  const userData = object.userData;

  if (userData.type === 'sefirah') {
    if (selectedSefirah !== userData.name) {
      object.material.emissiveIntensity = 0.3;
    }
  } else if (userData.type === 'path') {
    if (selectedPath !== userData.law) {
      object.material.emissiveIntensity = 0.2;
    }
  }
}

// =============================================================================
// SELECTION
// =============================================================================

function selectSefirah(name) {
  const sefirah = SEFIROT[name];
  if (!sefirah) return;

  // Reset previous selection
  resetHighlights();
  resetPaths();

  // Highlight selected sefirah
  highlightSefirah(name, true);

  // Highlight connected paths
  highlightConnectedPaths(name);

  selectedSefirah = name;
  selectedPath = null;

  // Trigger callback
  if (onSelectCallback) {
    onSelectCallback({
      type: 'sefirah',
      name,
      data: getSefirahInfo(name),
    });
  }

  console.log(`[Navigation] Selected Sefirah: ${name} (${sefirah.hebrew})`);
}

function selectPath(law) {
  const path = PATHS[law] || Object.values(PATHS).find(p => p.law === law);
  if (!path) return;

  // Reset previous selection
  resetHighlights();
  resetPaths();

  // Highlight selected path
  const pathKey = Object.keys(PATHS).find(k => PATHS[k].law === law) || law;
  highlightPath(pathKey, true);

  // Highlight connected sefirot
  highlightSefirah(path.from, true);
  highlightSefirah(path.to, true);

  selectedPath = law;
  selectedSefirah = null;

  // Trigger callback
  if (onSelectCallback) {
    onSelectCallback({
      type: 'path',
      law,
      data: getPathInfo(law),
    });
  }

  console.log(`[Navigation] Selected Path: ${law}`);
}

function deselectAll() {
  resetHighlights();
  resetPaths();
  selectedSefirah = null;
  selectedPath = null;

  if (onSelectCallback) {
    onSelectCallback({ type: 'none' });
  }
}

// =============================================================================
// INFO GETTERS
// =============================================================================

function getSefirahInfo(name) {
  const sefirah = SEFIROT[name];
  if (!sefirah) return null;

  const world = WORLDS[sefirah.world];

  return {
    name: sefirah.name,
    hebrew: sefirah.hebrew,
    english: sefirah.english,
    world: sefirah.world,
    worldHebrew: world?.hebrew,
    axiom: sefirah.axiom,
    dimensions: sefirah.dimensions,
    description: sefirah.description,
    isHeartbeat: sefirah.isHeartbeat || false,
    isBurnSource: sefirah.isBurnSource || false,
    // Code references
    codeRefs: getDimensionCodeRefs(sefirah.dimensions),
  };
}

function getPathInfo(law) {
  const path = Object.values(PATHS).find(p => p.law === law);
  if (!path) return null;

  const fromSefirah = SEFIROT[path.from];
  const toSefirah = SEFIROT[path.to];

  return {
    law: path.law,
    from: {
      name: path.from,
      hebrew: fromSefirah?.hebrew,
    },
    to: {
      name: path.to,
      hebrew: toSefirah?.hebrew,
    },
    axiom: path.axiom,
    description: path.description,
    // Code reference
    codeRef: getLawCodeRef(path.axiom),
  };
}

// =============================================================================
// CODE REFERENCES (Auto-documentation)
// =============================================================================

function getDimensionCodeRefs(dimensions) {
  const refs = {};
  for (const dim of dimensions) {
    refs[dim] = getDimensionCodePath(dim);
  }
  return refs;
}

function getDimensionCodePath(dimension) {
  // Map dimension names to their source files
  const dimensionPaths = {
    // PRIMARY
    HARMONY: 'lib/cynic/dimensions/primary/harmony.js',
    COHERENCE: 'lib/cynic/dimensions/primary/coherence.js',
    TRUTH: 'lib/cynic/dimensions/primary/truth.js',
    INTEGRITY: 'lib/cynic/dimensions/primary/integrity.js',
    ETHICS: 'lib/cynic/dimensions/primary/ethics.js',
    OPTIMISM: 'lib/cynic/dimensions/primary/optimism.js',
    // SECONDARY
    SIMPLIFY: 'lib/cynic/dimensions/secondary/simplify.js',
    ENABLE: 'lib/cynic/dimensions/secondary/enable.js',
    SECURE: 'lib/cynic/dimensions/secondary/secure.js',
    PRIVATE: 'lib/cynic/dimensions/secondary/private.js',
    SCALE: 'lib/cynic/dimensions/secondary/scale.js',
    BOUNDARIES: 'lib/cynic/dimensions/secondary/boundaries.js',
    // META
    SELF_AWARENESS: 'lib/cynic/dimensions/meta/self-awareness.js',
    MEMORY: 'lib/cynic/dimensions/meta/memory.js',
    TEACHING: 'lib/cynic/dimensions/meta/teaching.js',
    DISCOVERY: 'lib/cynic/dimensions/meta/discovery.js',
    COMPLEMENTARITY: 'lib/cynic/dimensions/meta/complementarity.js',
    SINGULARITY_DISTANCE: 'lib/cynic/dimensions/meta/singularity-distance.js',
    // HUMAN_LLM
    TRUST: 'lib/cynic/dimensions/human-llm/trust.js',
    ALIGNMENT: 'lib/cynic/dimensions/human-llm/alignment.js',
    DELEGATION: 'lib/cynic/dimensions/human-llm/delegation.js',
    PROACTIVITY: 'lib/cynic/dimensions/human-llm/proactivity.js',
    PROGRESS: 'lib/cynic/dimensions/human-llm/progress.js',
    INTENT: 'lib/cynic/dimensions/human-llm/intent.js',
  };

  return dimensionPaths[dimension] || `lib/cynic/dimensions/?/${dimension.toLowerCase()}.js`;
}

function getLawCodeRef(axiom) {
  const lawPaths = {
    PHI: 'lib/cynic/axioms/phi.js',
    VERIFY: 'lib/cynic/axioms/verify.js',
    CULTURE: 'lib/cynic/axioms/culture.js',
    BURN: 'lib/cynic/axioms/burn.js',
  };
  return lawPaths[axiom] || 'lib/cynic/axioms/';
}

function getWorldColor(world) {
  const colors = {
    ATZILUT: '#ffd700',
    BERIAH: '#4169e1',
    YETZIRAH: '#32cd32',
    ASSIAH: '#ff4500',
  };
  return colors[world] || '#fff';
}

// =============================================================================
// PUBLIC API
// =============================================================================

export function getSelectedSefirah() {
  return selectedSefirah ? getSefirahInfo(selectedSefirah) : null;
}

export function getSelectedPath() {
  return selectedPath ? getPathInfo(selectedPath) : null;
}

export function selectByDimension(dimensionName) {
  const sefirahName = DIMENSION_TO_SEFIRAH[dimensionName];
  if (sefirahName) {
    selectSefirah(sefirahName);
    return sefirahName;
  }
  return null;
}

// =============================================================================
// CLEANUP
// =============================================================================

export function destroyNavigation(domElement) {
  domElement.removeEventListener('click', onClick);
  domElement.removeEventListener('mousemove', onMouseMove);
  domElement.removeEventListener('mouseout', onMouseOut);

  if (tooltipElement && tooltipElement.parentNode) {
    tooltipElement.parentNode.removeChild(tooltipElement);
  }

  raycaster = null;
  mouse = null;
  cameraRef = null;
  sceneRef = null;
  hoveredObject = null;
  selectedSefirah = null;
  selectedPath = null;
  tooltipElement = null;

  console.log('[Navigation] Destroyed');
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  initNavigation,
  destroyNavigation,
  onSelect,
  selectSefirah,
  selectPath,
  selectByDimension,
  deselectAll,
  getSelectedSefirah,
  getSelectedPath,
  getSefirahInfo,
  getPathInfo,
};
