/**
 * CYNIC Patterns Visualization Module
 * Emergent patterns displayed as constellation connections
 */

import * as THREE from 'three';
import { PHI, API_BASE, COLORS } from './constants.js';
import * as state from './state.js';

// Pattern visualization state
let patternLines = [];
let patternNodes = [];
let lastPatternFetch = 0;
const PATTERN_FETCH_INTERVAL = 30000; // 30s

// Pattern type colors
const PATTERN_COLORS = {
  recurring: 0x00ff88,    // Green - recurring patterns
  correlation: 0x00aaff,  // Blue - correlated events
  anomaly: 0xff3366,      // Pink - anomalies
  learning: 0xd4a017,     // Gold - learned lessons
  default: 0xaa00ff       // Purple
};

/**
 * Create a pattern constellation between dimensions
 */
export function createPatternConstellation(pattern) {
  const color = PATTERN_COLORS[pattern.type] || PATTERN_COLORS.default;

  // Find related dimension meshes
  const relatedDims = pattern.dimensions || [];
  const meshes = relatedDims
    .map(d => state.dimensionMeshes[d])
    .filter(Boolean);

  if (meshes.length < 2) {
    // If no dimension meshes, create standalone pattern node
    createStandalonePattern(pattern, color);
    return;
  }

  // Create glowing connections between related dimensions
  for (let i = 0; i < meshes.length - 1; i++) {
    const start = meshes[i].position;
    const end = meshes[i + 1].position;

    createPatternLine(start, end, color, pattern);
  }

  // Create pattern node at centroid
  const centroid = new THREE.Vector3();
  meshes.forEach(m => centroid.add(m.position));
  centroid.divideScalar(meshes.length);

  createPatternNode(centroid, color, pattern);
}

/**
 * Create a glowing line between two points
 */
function createPatternLine(start, end, color, pattern) {
  // Create curved line using QuadraticBezierCurve3
  const mid = new THREE.Vector3()
    .addVectors(start, end)
    .multiplyScalar(0.5);
  mid.y += 20; // Arc upward

  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  const points = curve.getPoints(20);

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
  });

  const line = new THREE.Line(geometry, material);
  line.userData = {
    isPatternLine: true,
    pattern,
    pulsePhase: Math.random() * Math.PI * 2,
    life: 1.0
  };

  state.scene.add(line);
  patternLines.push(line);
}

/**
 * Create a pattern node (pulsing sphere)
 */
function createPatternNode(position, color, pattern) {
  const geometry = new THREE.IcosahedronGeometry(4, 1);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.8,
    wireframe: true,
    blending: THREE.AdditiveBlending
  });

  const node = new THREE.Mesh(geometry, material);
  node.position.copy(position);
  node.userData = {
    isPatternNode: true,
    pattern,
    pulsePhase: Math.random() * Math.PI * 2,
    life: 1.0,
    rotationSpeed: 0.01 + Math.random() * 0.02
  };

  state.scene.add(node);
  patternNodes.push(node);

  // Create label
  createPatternLabel(position, pattern, color);
}

/**
 * Create standalone pattern visualization
 */
function createStandalonePattern(pattern, color) {
  // Position in pattern zone (above the core)
  const angle = Math.random() * Math.PI * 2;
  const radius = 80 + Math.random() * 40;
  const position = new THREE.Vector3(
    Math.cos(angle) * radius,
    100 + Math.random() * 50,
    Math.sin(angle) * radius
  );

  createPatternNode(position, color, pattern);
}

/**
 * Create text label for pattern
 */
function createPatternLabel(position, pattern, color) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 64;

  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = '14px Orbitron';
  ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
  ctx.textAlign = 'center';

  const label = pattern.name || pattern.type || 'PATTERN';
  ctx.fillText(label.substring(0, 20), canvas.width / 2, canvas.height / 2 + 5);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.6
  });

  const sprite = new THREE.Sprite(material);
  sprite.position.set(position.x, position.y + 15, position.z);
  sprite.scale.set(40, 10, 1);
  sprite.userData = { isPatternLabel: true, life: 1.0 };

  state.scene.add(sprite);
}

/**
 * Animate pattern visualizations
 */
export function animatePatterns() {
  const time = Date.now() * 0.001;

  // Animate pattern lines (pulse effect)
  patternLines.forEach(line => {
    const phase = line.userData.pulsePhase;
    const pulse = 0.4 + Math.sin(time * 2 + phase) * 0.3;
    line.material.opacity = pulse * line.userData.life;

    // Decay
    line.userData.life -= 0.0005;
  });

  // Animate pattern nodes
  patternNodes.forEach(node => {
    // Rotation
    node.rotation.x += node.userData.rotationSpeed;
    node.rotation.y += node.userData.rotationSpeed * 0.7;

    // Pulse
    const phase = node.userData.pulsePhase;
    const scale = 1 + Math.sin(time * 3 + phase) * 0.2;
    node.scale.setScalar(scale);

    // Opacity pulse
    node.material.opacity = 0.6 + Math.sin(time * 2 + phase) * 0.2;

    // Decay
    node.userData.life -= 0.0003;
  });

  // Clean up old patterns
  cleanupPatterns();
}

/**
 * Remove decayed pattern elements
 */
function cleanupPatterns() {
  const threshold = 0.1;

  // Clean lines
  patternLines = patternLines.filter(line => {
    if (line.userData.life < threshold) {
      state.scene.remove(line);
      return false;
    }
    return true;
  });

  // Clean nodes
  patternNodes = patternNodes.filter(node => {
    if (node.userData.life < threshold) {
      state.scene.remove(node);
      return false;
    }
    return true;
  });

  // Clean labels
  state.scene.children
    .filter(c => c.userData?.isPatternLabel && c.userData.life < threshold)
    .forEach(label => state.scene.remove(label));
}

/**
 * Fetch patterns from API and visualize
 */
export async function fetchAndVisualizePatterns() {
  const now = Date.now();
  if (now - lastPatternFetch < PATTERN_FETCH_INTERVAL) return;
  lastPatternFetch = now;

  try {
    const response = await fetch(API_BASE + '/api/patterns');
    if (!response.ok) return;

    const data = await response.json();

    // Create visualizations for patterns
    const patterns = data.patterns || [];
    patterns.slice(0, 5).forEach((pattern, i) => {
      setTimeout(() => createPatternConstellation(pattern), i * 1000);
    });

    // Update pattern count in HUD
    updatePatternHUD(data);

  } catch (e) {
    console.warn('[Patterns] Fetch failed:', e.message);
  }
}

/**
 * Update pattern count in HUD (safe DOM manipulation)
 */
function updatePatternHUD(data) {
  let hudEl = document.getElementById('pattern-count');
  if (!hudEl) {
    hudEl = document.createElement('div');
    hudEl.id = 'pattern-count';
    hudEl.style.cssText = 'position: fixed; bottom: 160px; left: 20px; font-size: 10px; z-index: 100;';
    document.body.appendChild(hudEl);
  }

  // Clear existing content safely
  hudEl.replaceChildren();

  const patterns = data.patterns || [];
  const lessons = data.lessons || [];

  // Create patterns count element
  const patDiv = document.createElement('div');
  patDiv.style.color = patterns.length > 0 ? '#aa00ff' : '#666';
  patDiv.textContent = 'PATTERNS: ' + patterns.length;
  hudEl.appendChild(patDiv);

  // Create lessons count element
  const lesDiv = document.createElement('div');
  lesDiv.style.cssText = 'color: ' + (lessons.length > 0 ? '#d4a017' : '#666') + '; margin-top: 4px;';
  lesDiv.textContent = 'LESSONS: ' + lessons.length;
  hudEl.appendChild(lesDiv);
}

/**
 * Get current pattern counts
 */
export function getPatternCounts() {
  return {
    lines: patternLines.length,
    nodes: patternNodes.length
  };
}
