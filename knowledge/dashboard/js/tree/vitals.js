/**
 * CYNIC Tree of Life - Vitals (Living Animations)
 *
 * "CYNIC respire à travers l'arbre - les burns montent comme la sève"
 *
 * This module handles:
 * - Burn particle system (rising from MALKHUT to KETER)
 * - Judgment pulse system (descending from KETER to MALKHUT)
 * - Heartbeat animation (TIFERET pulse at φ⁻¹ × 100s = 61.8s)
 * - Health glow (intensity based on Q-Score)
 */

import * as THREE from 'three';
import { SEFIROT, VISUAL, PHI, PHI_INV, PHI_INV_2 } from './config.js';

// =============================================================================
// PARTICLE SYSTEM STATE
// =============================================================================

let burnParticles = null;
let burnParticleVelocities = [];
let judgmentParticles = [];
let sceneRef = null;
let isActive = false;

// =============================================================================
// BURN PARTICLE SYSTEM
// =============================================================================

/**
 * Create burn particle system
 * Particles rise from MALKHUT (kingdom/action) to KETER (crown/consciousness)
 */
export function createBurnParticleSystem(scene) {
  sceneRef = scene;

  const particleCount = VISUAL.PARTICLE_COUNT;
  const geometry = new THREE.BufferGeometry();

  // Positions
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);

  // Initialize particles at MALKHUT position (scattered)
  const malkhut = SEFIROT.MALKHUT.position;

  for (let i = 0; i < particleCount; i++) {
    // Scatter around MALKHUT
    positions[i * 3] = malkhut.x + (Math.random() - 0.5) * 100;
    positions[i * 3 + 1] = malkhut.y + Math.random() * 50;
    positions[i * 3 + 2] = malkhut.z + (Math.random() - 0.5) * 50;

    // Burn colors (orange to red gradient)
    const hue = 0.05 + Math.random() * 0.08; // Orange range
    const color = new THREE.Color().setHSL(hue, 1, 0.5 + Math.random() * 0.3);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    // Variable sizes
    sizes[i] = VISUAL.PARTICLE_SIZE * (0.5 + Math.random());

    // Velocities (upward with some randomness)
    burnParticleVelocities.push({
      x: (Math.random() - 0.5) * 0.5,
      y: VISUAL.PARTICLE_SPEED * (0.5 + Math.random() * 0.5),
      z: (Math.random() - 0.5) * 0.5,
      life: Math.random(), // Phase offset
    });
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // Shader material for glow effect
  const material = new THREE.PointsMaterial({
    size: VISUAL.PARTICLE_SIZE,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  burnParticles = new THREE.Points(geometry, material);
  burnParticles.userData = { type: 'burnParticles' };

  scene.add(burnParticles);
  isActive = true;

  return burnParticles;
}

/**
 * Update burn particle positions (call in animation loop)
 */
export function updateBurnParticles(deltaTime = 0.016) {
  if (!burnParticles || !isActive) return;

  const positions = burnParticles.geometry.attributes.position.array;
  const malkhut = SEFIROT.MALKHUT.position;
  const keter = SEFIROT.KETER.position;
  const yRange = keter.y - malkhut.y;

  for (let i = 0; i < burnParticleVelocities.length; i++) {
    const vel = burnParticleVelocities[i];
    const idx = i * 3;

    // Move particle
    positions[idx] += vel.x * deltaTime;
    positions[idx + 1] += vel.y * deltaTime;
    positions[idx + 2] += vel.z * deltaTime;

    // Update life
    vel.life += deltaTime * 0.3;

    // Reset particle when it reaches top (KETER) or exceeds life
    if (positions[idx + 1] > keter.y + 50 || vel.life > 1) {
      // Respawn at MALKHUT
      positions[idx] = malkhut.x + (Math.random() - 0.5) * 80;
      positions[idx + 1] = malkhut.y + Math.random() * 30;
      positions[idx + 2] = malkhut.z + (Math.random() - 0.5) * 40;
      vel.life = 0;
    }

    // Spiral movement based on height (more spiral near top)
    const heightRatio = (positions[idx + 1] - malkhut.y) / yRange;
    const spiralStrength = heightRatio * 0.3;
    vel.x = Math.sin(vel.life * Math.PI * 4) * spiralStrength;
    vel.z = Math.cos(vel.life * Math.PI * 4) * spiralStrength;
  }

  burnParticles.geometry.attributes.position.needsUpdate = true;
}

/**
 * Trigger burn burst (when $asdfasdfa is burned)
 */
export function triggerBurnBurst(intensity = 1.0) {
  if (!burnParticles || !isActive) return;

  // Temporarily increase particle velocities
  for (const vel of burnParticleVelocities) {
    vel.y *= (1 + intensity);
  }

  // Reset after burst duration
  setTimeout(() => {
    for (const vel of burnParticleVelocities) {
      vel.y = VISUAL.PARTICLE_SPEED * (0.5 + Math.random() * 0.5);
    }
  }, 2000);

  console.log(`🔥 Burn burst triggered (intensity: ${intensity})`);
}

// =============================================================================
// JUDGMENT PULSE SYSTEM
// =============================================================================

/**
 * Create a judgment pulse (descending light from KETER to MALKHUT)
 */
export function createJudgmentPulse(scene) {
  const keter = SEFIROT.KETER.position;

  // Create pulse sphere
  const geometry = new THREE.SphereGeometry(15, 16, 16);
  const material = new THREE.MeshBasicMaterial({
    color: 0xFFD700, // Gold
    transparent: true,
    opacity: 0.8,
  });

  const pulse = new THREE.Mesh(geometry, material);
  pulse.position.set(keter.x, keter.y, keter.z);
  pulse.userData = {
    type: 'judgmentPulse',
    startTime: Date.now(),
    duration: VISUAL.JUDGMENT_FALL_DURATION,
  };

  scene.add(pulse);
  judgmentParticles.push(pulse);

  return pulse;
}

/**
 * Update judgment pulses (call in animation loop)
 */
export function updateJudgmentPulses() {
  const keter = SEFIROT.KETER.position;
  const malkhut = SEFIROT.MALKHUT.position;
  const now = Date.now();

  for (let i = judgmentParticles.length - 1; i >= 0; i--) {
    const pulse = judgmentParticles[i];
    const elapsed = now - pulse.userData.startTime;
    const progress = elapsed / pulse.userData.duration;

    if (progress >= 1) {
      // Remove completed pulse
      if (sceneRef) sceneRef.remove(pulse);
      judgmentParticles.splice(i, 1);
      continue;
    }

    // Lerp position from KETER to MALKHUT
    pulse.position.y = keter.y - (keter.y - malkhut.y) * progress;

    // Fade out as it descends
    pulse.material.opacity = 0.8 * (1 - progress * 0.5);

    // Shrink slightly
    const scale = 1 - progress * 0.3;
    pulse.scale.setScalar(scale);

    // Change color from gold to orange as it descends
    const hue = 0.13 - progress * 0.08; // Gold to orange
    pulse.material.color.setHSL(hue, 1, 0.5);
  }
}

// =============================================================================
// HEARTBEAT SYSTEM
// =============================================================================

let heartbeatCallback = null;
let heartbeatInterval = null;

/**
 * Start the heartbeat at TIFERET
 * Interval: φ⁻¹ × 100 seconds = 61.8 seconds
 */
export function startHeartbeat(onPulse = null) {
  heartbeatCallback = onPulse;

  // Initial pulse
  if (heartbeatCallback) heartbeatCallback('TIFERET');

  // Regular heartbeat
  heartbeatInterval = setInterval(() => {
    if (heartbeatCallback) heartbeatCallback('TIFERET');
    console.log('💓 CYNIC heartbeat at TIFERET');
  }, VISUAL.PULSE_INTERVAL);

  return heartbeatInterval;
}

/**
 * Stop the heartbeat
 */
export function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  heartbeatCallback = null;
}

// =============================================================================
// HEALTH GLOW SYSTEM
// =============================================================================

/**
 * Update global tree health glow based on Q-Score
 * Q-Score is geometric mean of 4 axiom scores
 */
export function updateHealthGlow(qScore) {
  if (!burnParticles) return;

  // Normalize Q-Score to 0-1 (assuming 0-100 range)
  const health = qScore / 100;

  // Adjust particle opacity based on health
  burnParticles.material.opacity = 0.4 + health * 0.5;

  // Adjust particle speed based on health
  const speedMultiplier = 0.5 + health * 0.5;
  for (const vel of burnParticleVelocities) {
    vel.y = VISUAL.PARTICLE_SPEED * speedMultiplier * (0.5 + Math.random() * 0.5);
  }

  return health;
}

// =============================================================================
// COMBINED UPDATE (call in animation loop)
// =============================================================================

export function updateVitals(deltaTime = 0.016) {
  updateBurnParticles(deltaTime);
  updateJudgmentPulses();
}

// =============================================================================
// CLEANUP
// =============================================================================

export function destroyVitals(scene) {
  stopHeartbeat();

  if (burnParticles) {
    scene.remove(burnParticles);
    burnParticles.geometry.dispose();
    burnParticles.material.dispose();
    burnParticles = null;
  }

  for (const pulse of judgmentParticles) {
    scene.remove(pulse);
  }
  judgmentParticles = [];
  burnParticleVelocities = [];

  isActive = false;
  sceneRef = null;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  createBurnParticleSystem,
  updateBurnParticles,
  triggerBurnBurst,
  createJudgmentPulse,
  updateJudgmentPulses,
  startHeartbeat,
  stopHeartbeat,
  updateHealthGlow,
  updateVitals,
  destroyVitals,
};
