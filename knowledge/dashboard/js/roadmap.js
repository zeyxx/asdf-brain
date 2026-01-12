/**
 * CYNIC Roadmap Visualization Module
 * 3D Pyramid showing progress toward singularity
 */

import * as THREE from 'three';
import { PHI, API_BASE, PYRAMID_COLORS, PYRAMID_STATUS, COLORS } from './constants.js';
import * as state from './state.js';

// Pyramid state
let pyramidGroup = null;
let levelMeshes = [];
let singularityLabel = null;
let lastRoadmapFetch = 0;
const ROADMAP_FETCH_INTERVAL = 30000; // 30s

// Pyramid configuration
const PYRAMID_CONFIG = {
  baseRadius: 40,
  levelHeight: 15,
  shrinkFactor: PHI - 1, // φ - 1 ≈ 0.618, each level shrinks by golden ratio
  positionX: -200,       // Left side of scene
  positionY: -50,        // Lower area
  positionZ: 100
};

/**
 * Initialize the pyramid structure
 */
export function initPyramid() {
  pyramidGroup = new THREE.Group();
  pyramidGroup.position.set(
    PYRAMID_CONFIG.positionX,
    PYRAMID_CONFIG.positionY,
    PYRAMID_CONFIG.positionZ
  );

  state.scene.add(pyramidGroup);

  // Create placeholder levels (will be updated from API)
  createPyramidLevels([
    { level: 0, name: 'FONDATION', status: 'PLANNED' },
    { level: 1, name: 'PERCEPTION', status: 'PLANNED' },
    { level: 2, name: 'RÉACTION', status: 'PLANNED' },
    { level: 3, name: 'VISUALISATION', status: 'PLANNED' },
    { level: 4, name: 'ÉMERGENCE', status: 'PLANNED' },
    { level: 5, name: 'PRODUCTION', status: 'PLANNED' }
  ]);

  // Create singularity indicator at apex
  createSingularityIndicator();

  // Initial fetch
  fetchAndUpdateRoadmap();
}

/**
 * Create pyramid levels as stacked hexagonal prisms
 */
function createPyramidLevels(levels) {
  // Clear existing
  levelMeshes.forEach(mesh => pyramidGroup.remove(mesh));
  levelMeshes = [];

  let currentY = 0;
  let currentRadius = PYRAMID_CONFIG.baseRadius;

  levels.forEach((levelData, index) => {
    const height = PYRAMID_CONFIG.levelHeight;

    // Hexagonal prism for each level
    const geometry = new THREE.CylinderGeometry(
      currentRadius * PYRAMID_CONFIG.shrinkFactor, // top radius
      currentRadius,                                // bottom radius
      height,
      6  // hexagonal
    );

    // Get color based on status
    const statusColor = getStatusColor(levelData.status, levelData.completed);
    const levelColor = PYRAMID_COLORS[levelData.name.toUpperCase().replace('É', 'E').replace(' ', '_')] || COLORS.CORE;

    const material = new THREE.MeshPhongMaterial({
      color: levelColor,
      emissive: statusColor,
      emissiveIntensity: levelData.status === 'ACTIVE' ? 0.5 : 0.2,
      transparent: true,
      opacity: levelData.completed ? 0.9 : 0.5,
      wireframe: !levelData.completed
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = currentY + height / 2;
    mesh.userData = {
      level: index,
      name: levelData.name,
      status: levelData.status,
      completed: levelData.completed,
      isLevelMesh: true
    };

    pyramidGroup.add(mesh);
    levelMeshes.push(mesh);

    // Create label for this level
    createLevelLabel(levelData, currentY + height / 2, currentRadius);

    // Move up for next level
    currentY += height;
    currentRadius *= PYRAMID_CONFIG.shrinkFactor;
  });
}

/**
 * Get status color
 */
function getStatusColor(status, completed) {
  if (completed) return PYRAMID_STATUS.COMPLETED;
  switch (status) {
    case 'ACTIVE': return PYRAMID_STATUS.ACTIVE;
    case 'NEXT': return PYRAMID_STATUS.NEXT;
    default: return PYRAMID_STATUS.PLANNED;
  }
}

/**
 * Create label for a pyramid level
 */
function createLevelLabel(levelData, y, radius) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 64;

  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Status indicator
  const statusIcon = levelData.completed ? '✓' : (levelData.status === 'ACTIVE' ? '◉' : '○');
  const statusColor = levelData.completed ? '#00ff00' : (levelData.status === 'ACTIVE' ? '#ffff00' : '#666666');

  ctx.font = '16px Orbitron';
  ctx.fillStyle = statusColor;
  ctx.textAlign = 'left';
  ctx.fillText(statusIcon, 10, canvas.height / 2 + 6);

  ctx.font = '14px Orbitron';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`L${levelData.level} ${levelData.name}`, 35, canvas.height / 2 + 5);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.8
  });

  const sprite = new THREE.Sprite(material);
  sprite.position.set(radius + 30, y, 0);
  sprite.scale.set(60, 15, 1);
  sprite.userData = { isLevelLabel: true, level: levelData.level };

  pyramidGroup.add(sprite);
}

/**
 * Create singularity indicator at pyramid apex
 */
function createSingularityIndicator() {
  const totalHeight = PYRAMID_CONFIG.levelHeight * 6;

  // Glowing sphere at apex
  const geometry = new THREE.IcosahedronGeometry(8, 2);
  const material = new THREE.MeshBasicMaterial({
    color: COLORS.CORE,
    transparent: true,
    opacity: 0.8,
    wireframe: true
  });

  const apex = new THREE.Mesh(geometry, material);
  apex.position.y = totalHeight + 15;
  apex.userData = { isSingularityApex: true };
  pyramidGroup.add(apex);

  // Create distance label
  updateSingularityLabel(100); // Default 100% distance
}

/**
 * Update singularity distance label
 */
function updateSingularityLabel(distance) {
  // Remove old label
  if (singularityLabel) {
    pyramidGroup.remove(singularityLabel);
  }

  const totalHeight = PYRAMID_CONFIG.levelHeight * 6;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 128;

  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  ctx.font = '12px Orbitron';
  ctx.fillStyle = '#d4a017';
  ctx.textAlign = 'center';
  ctx.fillText('SINGULARITY', canvas.width / 2, 30);

  // Distance percentage
  ctx.font = 'bold 28px Orbitron';
  ctx.fillStyle = distance < 50 ? '#00ff00' : (distance < 80 ? '#ffff00' : '#ff6666');
  ctx.fillText(`${distance.toFixed(1)}%`, canvas.width / 2, 70);

  ctx.font = '10px Orbitron';
  ctx.fillStyle = '#888888';
  ctx.fillText('DISTANCE', canvas.width / 2, 90);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.9
  });

  singularityLabel = new THREE.Sprite(material);
  singularityLabel.position.set(0, totalHeight + 40, 0);
  singularityLabel.scale.set(50, 25, 1);

  pyramidGroup.add(singularityLabel);
}

/**
 * Animate the pyramid
 */
export function animatePyramid() {
  if (!pyramidGroup) return;

  const time = Date.now() * 0.001;

  // Slow rotation
  pyramidGroup.rotation.y = time * 0.1;

  // Pulse active level
  levelMeshes.forEach(mesh => {
    if (mesh.userData.status === 'ACTIVE' || mesh.userData.status === 'NEXT') {
      const pulse = 0.3 + Math.sin(time * 3) * 0.2;
      mesh.material.emissiveIntensity = pulse;
    }

    // Slight float for completed levels
    if (mesh.userData.completed) {
      mesh.position.y += Math.sin(time * 2 + mesh.userData.level) * 0.01;
    }
  });

  // Pulse singularity apex
  const apex = pyramidGroup.children.find(c => c.userData?.isSingularityApex);
  if (apex) {
    apex.rotation.x = time * 0.5;
    apex.rotation.z = time * 0.3;
    const scale = 1 + Math.sin(time * 2) * 0.1;
    apex.scale.setScalar(scale);
  }
}

/**
 * Fetch roadmap data and update visualization
 */
export async function fetchAndUpdateRoadmap() {
  const now = Date.now();
  if (now - lastRoadmapFetch < ROADMAP_FETCH_INTERVAL && lastRoadmapFetch > 0) return;
  lastRoadmapFetch = now;

  try {
    const response = await fetch(API_BASE + '/api/roadmap');
    if (!response.ok) return;

    const data = await response.json();

    // Update pyramid levels
    if (data.pyramid?.levels) {
      createPyramidLevels(data.pyramid.levels);
    }

    // Update singularity distance
    if (data.progress?.singularityDistance !== undefined) {
      updateSingularityLabel(data.progress.singularityDistance);
    }

    // Update HUD
    updateRoadmapHUD(data);

    console.log('[Roadmap] Updated:', data.progress);

  } catch (e) {
    console.warn('[Roadmap] Fetch failed:', e.message);
  }
}

/**
 * Update roadmap info in HUD
 */
function updateRoadmapHUD(data) {
  let hudEl = document.getElementById('roadmap-hud');
  if (!hudEl) {
    hudEl = document.createElement('div');
    hudEl.id = 'roadmap-hud';
    hudEl.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      font-size: 11px;
      z-index: 100;
      background: rgba(0,0,0,0.6);
      padding: 10px;
      border: 1px solid #d4a017;
      border-radius: 4px;
    `;
    document.body.appendChild(hudEl);
  }

  // Clear existing content
  hudEl.replaceChildren();

  const progress = data.progress || {};
  const levels = data.pyramid?.levels || [];

  // Title
  const title = document.createElement('div');
  title.style.cssText = 'color: #d4a017; font-weight: bold; margin-bottom: 8px; font-size: 12px;';
  title.textContent = '◊ CYNIC ROADMAP';
  hudEl.appendChild(title);

  // Current level
  const currentLevel = levels.find(l => l.status === 'ACTIVE' || l.status === 'NEXT');
  if (currentLevel) {
    const levelDiv = document.createElement('div');
    levelDiv.style.cssText = 'color: #ffff00; margin-bottom: 4px;';
    levelDiv.textContent = `Level ${currentLevel.level}: ${currentLevel.name}`;
    hudEl.appendChild(levelDiv);

    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = 'color: #888; font-size: 10px; margin-bottom: 8px;';
    statusDiv.textContent = currentLevel.status === 'ACTIVE' ? 'IN PROGRESS' : 'NEXT UP';
    hudEl.appendChild(statusDiv);
  }

  // Progress bar
  const progressBar = document.createElement('div');
  progressBar.style.cssText = `
    width: 100%;
    height: 6px;
    background: #333;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 4px;
  `;

  const progressFill = document.createElement('div');
  const progressPct = progress.singularityProgress || 0;
  progressFill.style.cssText = `
    width: ${progressPct}%;
    height: 100%;
    background: linear-gradient(90deg, #00ff00, #d4a017);
    transition: width 0.5s ease;
  `;
  progressBar.appendChild(progressFill);
  hudEl.appendChild(progressBar);

  // Progress text
  const progressText = document.createElement('div');
  progressText.style.cssText = 'color: #00ff00; font-size: 10px;';
  progressText.textContent = `${progressPct.toFixed(1)}% toward singularity`;
  hudEl.appendChild(progressText);

  // Completed levels
  const completedDiv = document.createElement('div');
  completedDiv.style.cssText = 'color: #666; font-size: 9px; margin-top: 6px;';
  completedDiv.textContent = `Completed: ${progress.completedLevels || 0}/${progress.totalLevels || 6} levels`;
  hudEl.appendChild(completedDiv);
}

/**
 * Get current roadmap state
 */
export function getRoadmapState() {
  return {
    levelCount: levelMeshes.length,
    hasGroup: pyramidGroup !== null
  };
}
