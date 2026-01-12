/**
 * CYNIC Discovered Dimensions Module
 * Dynamic dimension discovery from THE_INNOMMABLE
 */

import * as THREE from 'three';
import { PHI, PHI_INV, COLORS } from './constants.js';
import * as state from './state.js';
import { calculatePositions, createLabel } from './scene.js';
import { updateVisibility } from './scene.js';
import { updateDiscoveredCount } from './hud.js';

/**
 * Dynamically adds a new DISCOVERED dimension to the 3D scene.
 * Called when THE_INNOMMABLE discovers new dimensions via API.
 * @param {string} name - Dimension name (e.g., 'CULTURAL_CONTEXT')
 * @param {object} config - Dimension config { weight, world, axiomOrigin }
 * @param {number} initialScore - Initial score (default 50)
 */
export function addDiscoveredDimension(name, config = {}, initialScore = 50) {
  // Skip if already exists
  if (state.DIMENSIONS[name]) {
    console.log('[DISCOVERED] Dimension already exists:', name);
    return false;
  }

  // Default config for DISCOVERED dimensions
  const dimConfig = {
    category: 'DISCOVERED',
    weight: config.weight || PHI_INV,  // φ⁻¹ default for discovered
    world: config.world || 'YETZIRAH',
    color: COLORS.DISCOVERED,  // Orange for DISCOVERED
    axiomOrigin: config.axiomOrigin || 'UNKNOWN',
    discoveredAt: new Date().toISOString()
  };

  // Add to state
  state.addDimension(name, dimConfig);

  // Add to currentScores
  state.updateScores({ [name]: initialScore });

  // Calculate position for the new dimension
  const positions = calculatePositions();
  const pos = positions[name];

  if (!pos) {
    console.error('[DISCOVERED] Could not calculate position for:', name);
    return false;
  }

  // Create the 3D mesh
  const score = initialScore;
  const baseSize = 8 + (score / 100) * 12;
  const size = baseSize * (dimConfig.weight / PHI);

  const geometry = new THREE.SphereGeometry(size, 32, 32);
  const material = new THREE.MeshPhongMaterial({
    color: dimConfig.color,
    emissive: dimConfig.color,
    emissiveIntensity: 0.3 + (score / 100) * 0.4,
    transparent: true,
    opacity: 0.9,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(pos.x, pos.y, pos.z);
  mesh.userData = { name, config: dimConfig, score };

  state.scene.add(mesh);
  state.setDimensionMesh(name, mesh);

  // Create label
  createLabel(name, pos, dimConfig.color);

  // Update legend count
  updateDiscoveredCount();

  console.log('[DISCOVERED] New dimension added:', name, dimConfig);
  return true;
}

/**
 * Processes discovered_dimensions from API response
 * @param {array} discoveredDimensions - Array of { name, weight, world, axiomOrigin, score }
 */
export function processDiscoveredDimensions(discoveredDimensions) {
  if (!Array.isArray(discoveredDimensions)) return;

  let added = 0;
  for (const dim of discoveredDimensions) {
    if (addDiscoveredDimension(dim.name, {
      weight: dim.weight,
      world: dim.world,
      axiomOrigin: dim.axiomOrigin
    }, dim.score || 50)) {
      added++;
    }
  }

  if (added > 0) {
    console.log(`[DISCOVERED] Added ${added} new dimensions from API`);
    updateVisibility();  // Refresh visibility based on active category
  }
}
