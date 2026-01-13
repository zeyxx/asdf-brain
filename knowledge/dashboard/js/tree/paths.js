/**
 * CYNIC Tree of Life - Paths (Laws) Visualization
 *
 * Creates curved tubes connecting Sefirot, representing CYNIC's 16 Laws
 * "Each path is a law - energy flows through laws like blood through veins"
 */

import * as THREE from 'three';
import { PATHS, SEFIROT, VISUAL, PHI_INV } from './config.js';

// =============================================================================
// PATH MESHES STORAGE
// =============================================================================

export const pathMeshes = {};
export const pathLabels = {};

// =============================================================================
// CREATE CURVED PATH BETWEEN SEFIROT
// =============================================================================

function createPathCurve(fromSefirah, toSefirah) {
  const from = new THREE.Vector3(
    fromSefirah.position.x,
    fromSefirah.position.y,
    fromSefirah.position.z
  );

  const to = new THREE.Vector3(
    toSefirah.position.x,
    toSefirah.position.y,
    toSefirah.position.z
  );

  // Calculate midpoint with curve offset
  const mid = new THREE.Vector3().lerpVectors(from, to, 0.5);

  // Add curve based on relative positions (makes paths more organic)
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  // Curve outward for diagonal paths, minimal for vertical
  if (Math.abs(dx) > 10) {
    mid.z += (dx > 0 ? 1 : -1) * 30 * PHI_INV;
  }

  // Create quadratic bezier curve
  const curve = new THREE.QuadraticBezierCurve3(from, mid, to);

  return curve;
}

// =============================================================================
// CREATE PATH TUBE
// =============================================================================

function createPathMesh(path) {
  const fromSefirah = SEFIROT[path.from];
  const toSefirah = SEFIROT[path.to];

  if (!fromSefirah || !toSefirah) {
    console.warn(`Path ${path.law}: Missing sefirah ${path.from} or ${path.to}`);
    return null;
  }

  // Create curve
  const curve = createPathCurve(fromSefirah, toSefirah);

  // Create tube geometry
  const geometry = new THREE.TubeGeometry(
    curve,
    20,                      // tubular segments
    VISUAL.PATH_THICKNESS,   // radius
    8,                       // radial segments
    false                    // closed
  );

  // Material with emissive glow
  const material = new THREE.MeshPhongMaterial({
    color: path.color,
    emissive: path.color,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.7,
    shininess: 50,
  });

  const mesh = new THREE.Mesh(geometry, material);

  // Store path data
  mesh.userData = {
    type: 'path',
    law: path.law,
    from: path.from,
    to: path.to,
    axiom: path.axiom,
    description: path.description,
  };

  return mesh;
}

// =============================================================================
// CREATE PATH LABEL
// =============================================================================

function createPathLabel(path) {
  const fromSefirah = SEFIROT[path.from];
  const toSefirah = SEFIROT[path.to];

  if (!fromSefirah || !toSefirah) return null;

  // Position at midpoint of path
  const midX = (fromSefirah.position.x + toSefirah.position.x) / 2;
  const midY = (fromSefirah.position.y + toSefirah.position.y) / 2;
  const midZ = 20; // Slightly in front for visibility

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 128;
  canvas.height = 64;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Law name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(path.law, 64, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.7,
  });

  const sprite = new THREE.Sprite(material);
  sprite.position.set(midX, midY, midZ);
  sprite.scale.set(40, 20, 1);
  sprite.visible = false; // Hidden by default, shown on hover

  return sprite;
}

// =============================================================================
// CREATE ALL PATHS
// =============================================================================

export function createAllPaths(scene) {
  for (const [name, path] of Object.entries(PATHS)) {
    // Create path tube
    const mesh = createPathMesh(path);
    if (mesh) {
      pathMeshes[name] = mesh;
      scene.add(mesh);
    }

    // Create path label
    const label = createPathLabel(path);
    if (label) {
      pathLabels[name] = label;
      scene.add(label);
    }
  }

  return { pathMeshes, pathLabels };
}

// =============================================================================
// HIGHLIGHT PATH
// =============================================================================

export function highlightPath(pathName, highlight = true) {
  const mesh = pathMeshes[pathName];
  const label = pathLabels[pathName];

  if (!mesh) return;

  if (highlight) {
    mesh.material.emissiveIntensity = 0.6;
    mesh.material.opacity = 1.0;
    if (label) label.visible = true;
  } else {
    mesh.material.emissiveIntensity = 0.2;
    mesh.material.opacity = 0.7;
    if (label) label.visible = false;
  }
}

// =============================================================================
// HIGHLIGHT PATHS BY AXIOM
// =============================================================================

export function highlightPathsByAxiom(axiomName) {
  for (const [name, path] of Object.entries(PATHS)) {
    const mesh = pathMeshes[name];
    const label = pathLabels[name];
    const isTarget = path.axiom === axiomName;

    if (mesh) {
      mesh.material.opacity = isTarget ? 1.0 : 0.2;
      mesh.material.emissiveIntensity = isTarget ? 0.5 : 0.1;
    }
    if (label) {
      label.visible = isTarget;
    }
  }
}

// =============================================================================
// HIGHLIGHT CONNECTED PATHS (from a sefirah)
// =============================================================================

export function highlightConnectedPaths(sefirahName) {
  for (const [name, path] of Object.entries(PATHS)) {
    const mesh = pathMeshes[name];
    const label = pathLabels[name];
    const isConnected = path.from === sefirahName || path.to === sefirahName;

    if (mesh) {
      mesh.material.opacity = isConnected ? 1.0 : 0.3;
      mesh.material.emissiveIntensity = isConnected ? 0.5 : 0.1;
    }
    if (label) {
      label.visible = isConnected;
    }
  }
}

// =============================================================================
// RESET ALL PATHS
// =============================================================================

export function resetPaths() {
  for (const name of Object.keys(pathMeshes)) {
    const mesh = pathMeshes[name];
    const label = pathLabels[name];

    if (mesh) {
      mesh.material.opacity = 0.7;
      mesh.material.emissiveIntensity = 0.2;
    }
    if (label) {
      label.visible = false;
    }
  }
}

// =============================================================================
// ANIMATE PATH FLOW (energy pulse along path)
// =============================================================================

export function animatePathFlow(pathName, direction = 'down', duration = 1000) {
  const mesh = pathMeshes[pathName];
  if (!mesh) return;

  const startTime = Date.now();
  const originalIntensity = 0.2;
  const maxIntensity = 0.8;

  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = elapsed / duration;

    if (progress >= 1) {
      mesh.material.emissiveIntensity = originalIntensity;
      return;
    }

    // Traveling pulse effect
    const pulse = Math.sin(progress * Math.PI * 2) * 0.5 + 0.5;
    mesh.material.emissiveIntensity = originalIntensity + (maxIntensity - originalIntensity) * pulse;

    requestAnimationFrame(animate);
  }

  animate();
}

// =============================================================================
// ANIMATE JUDGMENT FLOW (from KETER to MALKHUT)
// =============================================================================

export function animateJudgmentFlow(duration = 3000) {
  const pathOrder = [
    'E1', 'E4', 'PHI2', 'XI1', 'XI3', 'OMEGA1', 'OMEGA3'
  ];

  const stepDuration = duration / pathOrder.length;

  pathOrder.forEach((pathName, index) => {
    setTimeout(() => {
      animatePathFlow(pathName, 'down', stepDuration * 0.8);
    }, index * stepDuration);
  });
}

// =============================================================================
// ANIMATE BURN FLOW (from MALKHUT to KETER)
// =============================================================================

export function animateBurnFlow(duration = 3000) {
  const pathOrder = [
    'OMEGA3', 'OMEGA1', 'XI3', 'XI1', 'PHI2', 'E4', 'E1'
  ];

  const stepDuration = duration / pathOrder.length;

  pathOrder.forEach((pathName, index) => {
    setTimeout(() => {
      animatePathFlow(pathName, 'up', stepDuration * 0.8);
    }, index * stepDuration);
  });
}

// =============================================================================
// CLEAR ALL PATHS
// =============================================================================

export function clearAllPaths(scene) {
  for (const name of Object.keys(pathMeshes)) {
    if (pathMeshes[name]) scene.remove(pathMeshes[name]);
    if (pathLabels[name]) scene.remove(pathLabels[name]);

    delete pathMeshes[name];
    delete pathLabels[name];
  }
}

// =============================================================================
// GET PATH INFO
// =============================================================================

export function getPathInfo(pathName) {
  return PATHS[pathName] || null;
}

export default {
  pathMeshes,
  pathLabels,
  createAllPaths,
  highlightPath,
  highlightPathsByAxiom,
  highlightConnectedPaths,
  resetPaths,
  animatePathFlow,
  animateJudgmentFlow,
  animateBurnFlow,
  clearAllPaths,
  getPathInfo,
};
