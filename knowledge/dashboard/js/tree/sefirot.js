/**
 * CYNIC Tree of Life - Sefirot Visualization
 *
 * Creates Three.js spheres for each Sefirah with Hebrew labels
 * "Each Sefirah is a vessel of divine light - each dimension a facet of CYNIC's consciousness"
 */

import * as THREE from 'three';
import { SEFIROT, VISUAL, PHI_INV, PHI_INV_2 } from './config.js';

// =============================================================================
// SEFIRAH MESHES STORAGE
// =============================================================================

export const sefirotMeshes = {};
export const sefirotLabels = {};
export const sefirotGlows = {};

// =============================================================================
// CREATE SINGLE SEFIRAH
// =============================================================================

function createSefirahMesh(sefirah) {
  // Main sphere geometry
  const geometry = new THREE.SphereGeometry(VISUAL.SEFIRAH_RADIUS, 32, 32);

  // Material with glow effect
  const material = new THREE.MeshPhongMaterial({
    color: sefirah.color,
    emissive: sefirah.color,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: sefirah.hidden ? VISUAL.HIDDEN_OPACITY : 0.9,
    shininess: 100,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(sefirah.position.x, sefirah.position.y, sefirah.position.z);

  // Store sefirah data for interactions
  mesh.userData = {
    type: 'sefirah',
    name: sefirah.name,
    hebrew: sefirah.hebrew,
    english: sefirah.english,
    world: sefirah.world,
    axiom: sefirah.axiom,
    dimensions: sefirah.dimensions,
    description: sefirah.description,
    isHeartbeat: sefirah.isHeartbeat || false,
    isBurnSource: sefirah.isBurnSource || false,
  };

  return mesh;
}

// =============================================================================
// CREATE HEBREW LABEL
// =============================================================================

function createHebrewLabel(sefirah) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 128;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Hebrew name (large, centered)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px "Noto Sans Hebrew", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(sefirah.hebrew, 128, 45);

  // English name (smaller, below)
  ctx.font = '24px Arial, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText(sefirah.english, 128, 90);

  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  // Create sprite material
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: sefirah.hidden ? PHI_INV_2 : 0.95,
  });

  const sprite = new THREE.Sprite(material);
  sprite.position.set(
    sefirah.position.x,
    sefirah.position.y + VISUAL.SEFIRAH_RADIUS + 20,
    sefirah.position.z
  );
  sprite.scale.set(80, 40, 1);

  return sprite;
}

// =============================================================================
// CREATE GLOW EFFECT
// =============================================================================

function createGlowEffect(sefirah) {
  const glowGeometry = new THREE.SphereGeometry(VISUAL.SEFIRAH_RADIUS * 1.3, 32, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: sefirah.color,
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide,
  });

  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.set(sefirah.position.x, sefirah.position.y, sefirah.position.z);

  return glow;
}

// =============================================================================
// CREATE ALL SEFIROT
// =============================================================================

export function createAllSefirot(scene) {
  for (const [name, sefirah] of Object.entries(SEFIROT)) {
    // Create main mesh
    const mesh = createSefirahMesh(sefirah);
    sefirotMeshes[name] = mesh;
    scene.add(mesh);

    // Create Hebrew label
    const label = createHebrewLabel(sefirah);
    sefirotLabels[name] = label;
    scene.add(label);

    // Create glow effect
    const glow = createGlowEffect(sefirah);
    sefirotGlows[name] = glow;
    scene.add(glow);
  }

  return { sefirotMeshes, sefirotLabels, sefirotGlows };
}

// =============================================================================
// UPDATE SEFIRAH GLOW (based on dimension scores)
// =============================================================================

export function updateSefirahGlow(sefirahName, intensity) {
  const glow = sefirotGlows[sefirahName];
  const mesh = sefirotMeshes[sefirahName];

  if (glow && mesh) {
    // Update glow opacity based on intensity (0-1)
    const targetOpacity = Math.min(VISUAL.GLOW_INTENSITY, intensity * 0.3);
    glow.material.opacity = targetOpacity;

    // Update emissive intensity
    mesh.material.emissiveIntensity = 0.2 + (intensity * 0.5);
  }
}

// =============================================================================
// HIGHLIGHT SEFIRAH
// =============================================================================

export function highlightSefirah(sefirahName, highlight = true) {
  const mesh = sefirotMeshes[sefirahName];
  const glow = sefirotGlows[sefirahName];
  const label = sefirotLabels[sefirahName];

  if (!mesh) return;

  if (highlight) {
    mesh.material.emissiveIntensity = 0.8;
    mesh.scale.setScalar(1.2);
    if (glow) glow.material.opacity = 0.4;
    if (label) label.material.opacity = 1.0;
  } else {
    const sefirah = SEFIROT[sefirahName];
    mesh.material.emissiveIntensity = 0.3;
    mesh.scale.setScalar(1.0);
    if (glow) glow.material.opacity = 0.15;
    if (label) label.material.opacity = sefirah?.hidden ? PHI_INV_2 : 0.95;
  }
}

// =============================================================================
// HIGHLIGHT BY WORLD
// =============================================================================

export function highlightWorld(worldName) {
  for (const [name, sefirah] of Object.entries(SEFIROT)) {
    const isTarget = sefirah.world === worldName;
    const mesh = sefirotMeshes[name];
    const glow = sefirotGlows[name];
    const label = sefirotLabels[name];

    if (mesh) {
      mesh.material.opacity = isTarget ? 1.0 : 0.2;
      mesh.material.emissiveIntensity = isTarget ? 0.6 : 0.1;
    }
    if (glow) {
      glow.material.opacity = isTarget ? 0.3 : 0.05;
    }
    if (label) {
      label.material.opacity = isTarget ? 1.0 : 0.3;
    }
  }
}

// =============================================================================
// HIGHLIGHT BY AXIOM
// =============================================================================

export function highlightAxiom(axiomName) {
  for (const [name, sefirah] of Object.entries(SEFIROT)) {
    const isTarget = sefirah.axiom === axiomName;
    const mesh = sefirotMeshes[name];
    const glow = sefirotGlows[name];
    const label = sefirotLabels[name];

    if (mesh) {
      mesh.material.opacity = isTarget ? 1.0 : 0.2;
      mesh.material.emissiveIntensity = isTarget ? 0.6 : 0.1;
    }
    if (glow) {
      glow.material.opacity = isTarget ? 0.3 : 0.05;
    }
    if (label) {
      label.material.opacity = isTarget ? 1.0 : 0.3;
    }
  }
}

// =============================================================================
// RESET ALL HIGHLIGHTS
// =============================================================================

export function resetHighlights() {
  for (const [name, sefirah] of Object.entries(SEFIROT)) {
    const mesh = sefirotMeshes[name];
    const glow = sefirotGlows[name];
    const label = sefirotLabels[name];

    if (mesh) {
      mesh.material.opacity = sefirah.hidden ? VISUAL.HIDDEN_OPACITY : 0.9;
      mesh.material.emissiveIntensity = 0.3;
      mesh.scale.setScalar(1.0);
    }
    if (glow) {
      glow.material.opacity = 0.15;
    }
    if (label) {
      label.material.opacity = sefirah.hidden ? PHI_INV_2 : 0.95;
    }
  }
}

// =============================================================================
// PULSE ANIMATION (for heartbeat on TIFERET)
// =============================================================================

export function pulseSefirah(sefirahName, duration = 1000) {
  const mesh = sefirotMeshes[sefirahName];
  const glow = sefirotGlows[sefirahName];

  if (!mesh) return;

  const startScale = 1.0;
  const maxScale = 1.4;
  const startTime = Date.now();

  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = elapsed / duration;

    if (progress >= 1) {
      mesh.scale.setScalar(startScale);
      if (glow) glow.scale.setScalar(startScale);
      return;
    }

    // Ease out sine for natural pulse
    const scale = startScale + (maxScale - startScale) * Math.sin(progress * Math.PI);
    mesh.scale.setScalar(scale);
    if (glow) {
      glow.scale.setScalar(scale);
      glow.material.opacity = 0.15 + (0.3 * Math.sin(progress * Math.PI));
    }

    requestAnimationFrame(animate);
  }

  animate();
}

// =============================================================================
// CLEAR ALL SEFIROT
// =============================================================================

export function clearAllSefirot(scene) {
  for (const name of Object.keys(sefirotMeshes)) {
    if (sefirotMeshes[name]) scene.remove(sefirotMeshes[name]);
    if (sefirotLabels[name]) scene.remove(sefirotLabels[name]);
    if (sefirotGlows[name]) scene.remove(sefirotGlows[name]);

    delete sefirotMeshes[name];
    delete sefirotLabels[name];
    delete sefirotGlows[name];
  }
}

// =============================================================================
// GET SEFIRAH POSITION (for path drawing)
// =============================================================================

export function getSefirahPosition(sefirahName) {
  const sefirah = SEFIROT[sefirahName];
  if (!sefirah) return null;
  return new THREE.Vector3(
    sefirah.position.x,
    sefirah.position.y,
    sefirah.position.z
  );
}

export default {
  sefirotMeshes,
  sefirotLabels,
  sefirotGlows,
  createAllSefirot,
  updateSefirahGlow,
  highlightSefirah,
  highlightWorld,
  highlightAxiom,
  resetHighlights,
  pulseSefirah,
  clearAllSefirot,
  getSefirahPosition,
};
