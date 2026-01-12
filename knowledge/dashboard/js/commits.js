/**
 * CYNIC Commits Visualization Module
 * Real-time commit particles flowing into the singularity
 */

import * as THREE from 'three';
import { PHI, API_BASE, COLORS } from './constants.js';
import * as state from './state.js';

// Commit particles state
let commitParticles = [];
let lastCommitFetch = 0;
const COMMIT_FETCH_INTERVAL = 10000; // 10s

// Repo colors
const REPO_COLORS = {
  holdex: 0xff6b6b,   // Red
  gasdf: 0x4ecdc4,    // Teal
  brain: 0xd4a017,    // Gold
  default: 0x888888   // Gray
};

/**
 * Create a commit particle that flows toward the core
 */
export function createCommitParticle(commit) {
  const color = REPO_COLORS[commit.repo] || REPO_COLORS.default;
  const isPR = commit.type === 'PR';

  // Start position: random point on outer sphere
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const radius = 250 + Math.random() * 50;

  const startPos = new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta) * 0.5,
    radius * Math.cos(phi)
  );

  // Create geometry based on type
  const size = isPR ? 4 : 2;
  const geometry = isPR
    ? new THREE.OctahedronGeometry(size, 0)
    : new THREE.SphereGeometry(size, 8, 8);

  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(startPos);

  mesh.userData = {
    isCommit: true,
    commit,
    startPos: startPos.clone(),
    progress: 0,
    speed: 0.005 + Math.random() * 0.01,
    isPR
  };

  state.scene.add(mesh);
  commitParticles.push(mesh);

  // Create trail
  createCommitTrail(mesh, color);

  return mesh;
}

/**
 * Create a glowing trail behind commit particle
 */
function createCommitTrail(particle, color) {
  const trailGeometry = new THREE.BufferGeometry();
  const trailMaterial = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending
  });

  const positions = new Float32Array(30 * 3); // 30 trail points
  trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const trail = new THREE.Line(trailGeometry, trailMaterial);
  trail.userData.trailPositions = [];
  particle.userData.trail = trail;

  state.scene.add(trail);
}

/**
 * Update commit trail positions
 */
function updateTrail(particle) {
  const trail = particle.userData.trail;
  if (!trail) return;

  trail.userData.trailPositions.unshift(particle.position.clone());
  if (trail.userData.trailPositions.length > 30) {
    trail.userData.trailPositions.pop();
  }

  const positions = trail.geometry.attributes.position.array;
  for (let i = 0; i < trail.userData.trailPositions.length; i++) {
    const pos = trail.userData.trailPositions[i];
    positions[i * 3] = pos.x;
    positions[i * 3 + 1] = pos.y;
    positions[i * 3 + 2] = pos.z;
  }
  trail.geometry.attributes.position.needsUpdate = true;
}

/**
 * Animate commit particles toward core
 */
export function animateCommits() {
  const toRemove = [];

  commitParticles.forEach(particle => {
    if (!particle.userData.isCommit) return;

    particle.userData.progress += particle.userData.speed;

    // Spiral toward center
    const p = particle.userData.progress;
    const start = particle.userData.startPos;
    const t = Math.min(p, 1);

    // Easing function
    const ease = t * t * (3 - 2 * t);

    // Position interpolation with spiral
    const spiralAngle = p * Math.PI * 4;
    const spiralRadius = (1 - ease) * 20;

    particle.position.lerpVectors(
      start,
      new THREE.Vector3(0, 0, 0),
      ease
    );

    particle.position.x += Math.cos(spiralAngle) * spiralRadius;
    particle.position.z += Math.sin(spiralAngle) * spiralRadius;

    // Scale down as approaching center
    const scale = 1 - ease * 0.8;
    particle.scale.setScalar(scale);

    // Update opacity
    particle.material.opacity = 0.8 * (1 - ease * 0.5);

    // Update trail
    updateTrail(particle);

    // Remove when reached center
    if (p >= 1) {
      toRemove.push(particle);

      // Flash effect on absorption
      createAbsorptionFlash(particle.userData.commit);
    }
  });

  // Clean up absorbed particles
  toRemove.forEach(particle => {
    if (particle.userData.trail) {
      state.scene.remove(particle.userData.trail);
    }
    state.scene.remove(particle);
    commitParticles = commitParticles.filter(p => p !== particle);
  });
}

/**
 * Create flash effect when commit is absorbed by core
 */
function createAbsorptionFlash(commit) {
  const color = REPO_COLORS[commit.repo] || REPO_COLORS.default;

  const flashGeometry = new THREE.SphereGeometry(5, 16, 16);
  const flashMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });

  const flash = new THREE.Mesh(flashGeometry, flashMaterial);
  flash.position.set(0, 0, 0);
  flash.userData.isFlash = true;
  flash.userData.life = 1.0;

  state.scene.add(flash);

  // Animate flash
  const animateFlash = () => {
    flash.userData.life -= 0.05;
    flash.scale.setScalar(1 + (1 - flash.userData.life) * 3);
    flash.material.opacity = flash.userData.life * 0.8;

    if (flash.userData.life <= 0) {
      state.scene.remove(flash);
    } else {
      requestAnimationFrame(animateFlash);
    }
  };
  animateFlash();
}

/**
 * Fetch commits from API and create particles
 */
export async function fetchAndVisualizeCommits() {
  const now = Date.now();
  if (now - lastCommitFetch < COMMIT_FETCH_INTERVAL) return;
  lastCommitFetch = now;

  try {
    const response = await fetch(API_BASE + '/api/commits');
    if (!response.ok) return;

    const data = await response.json();

    // Create particles for new commits (limit to 5 at a time)
    const commits = (data.commits || []).slice(0, 5);
    commits.forEach((commit, i) => {
      setTimeout(() => createCommitParticle(commit), i * 500);
    });

    // Update commit count in HUD
    updateCommitHUD(data);

  } catch (e) {
    console.warn('[Commits] Fetch failed:', e.message);
  }
}

/**
 * Update commit count in HUD (safe DOM manipulation)
 */
function updateCommitHUD(data) {
  let hudEl = document.getElementById('commit-count');
  if (!hudEl) {
    hudEl = document.createElement('div');
    hudEl.id = 'commit-count';
    hudEl.style.cssText = 'position: fixed; bottom: 80px; left: 20px; font-size: 10px; color: #888; z-index: 100;';
    document.body.appendChild(hudEl);
  }

  // Clear existing content safely
  hudEl.replaceChildren();

  const prCount = (data.commits || []).filter(c => c.type === 'PR').length;
  const commitCount = (data.commits || []).length - prCount;

  // Create commit count element
  const commitDiv = document.createElement('div');
  commitDiv.style.color = '#d4a017';
  commitDiv.textContent = 'COMMITS: ' + commitCount;
  hudEl.appendChild(commitDiv);

  // Create PR count element
  const prDiv = document.createElement('div');
  prDiv.style.cssText = 'color: #00ff88; margin-top: 4px;';
  prDiv.textContent = 'PRs: ' + prCount;
  hudEl.appendChild(prDiv);
}

/**
 * Get current particle count
 */
export function getParticleCount() {
  return commitParticles.length;
}
