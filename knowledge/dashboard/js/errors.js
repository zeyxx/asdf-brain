/**
 * CYNIC Errors Visualization Module
 * Real-time error/alert particles as warning signals
 */

import * as THREE from 'three';
import { PHI, API_BASE } from './constants.js';
import * as state from './state.js';

// Error particles state
let errorParticles = [];
let lastErrorFetch = 0;
const ERROR_FETCH_INTERVAL = 15000; // 15s

// Severity colors
const SEVERITY_COLORS = {
  critical: 0xff0000,  // Red
  warning: 0xffaa00,   // Orange
  info: 0x00aaff,      // Blue
  default: 0xff3366    // Pink
};

// Severity sizes
const SEVERITY_SIZES = {
  critical: 6,
  warning: 4,
  info: 2,
  default: 3
};

/**
 * Create an error particle that orbits around the core
 */
export function createErrorParticle(alert) {
  const severity = alert.severity || 'warning';
  const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS.default;
  const size = SEVERITY_SIZES[severity] || SEVERITY_SIZES.default;

  // Orbit parameters
  const orbitRadius = 50 + Math.random() * 30;
  const orbitSpeed = 0.5 + Math.random() * 0.5;
  const orbitTilt = (Math.random() - 0.5) * Math.PI * 0.3;
  const startAngle = Math.random() * Math.PI * 2;

  // Create spiky geometry for errors
  const geometry = new THREE.OctahedronGeometry(size, 0);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending
  });

  const mesh = new THREE.Mesh(geometry, material);

  mesh.userData = {
    isError: true,
    alert,
    severity,
    orbitRadius,
    orbitSpeed,
    orbitTilt,
    angle: startAngle,
    life: 1.0,
    decayRate: 0.001 + Math.random() * 0.002
  };

  // Initial position
  updateErrorPosition(mesh);

  state.scene.add(mesh);
  errorParticles.push(mesh);

  // Create glow ring for critical errors
  if (severity === 'critical') {
    createCriticalGlow(mesh, color);
  }

  return mesh;
}

/**
 * Update error particle position on orbit
 */
function updateErrorPosition(mesh) {
  const { orbitRadius, orbitTilt, angle } = mesh.userData;

  mesh.position.x = Math.cos(angle) * orbitRadius;
  mesh.position.y = Math.sin(orbitTilt) * Math.sin(angle) * orbitRadius * 0.3;
  mesh.position.z = Math.sin(angle) * orbitRadius;
}

/**
 * Create glowing ring for critical errors
 */
function createCriticalGlow(particle, color) {
  const glowGeometry = new THREE.RingGeometry(8, 12, 16);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });

  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.userData.isGlow = true;

  particle.userData.glow = glow;
  particle.add(glow);
}

/**
 * Animate error particles
 */
export function animateErrors() {
  const toRemove = [];

  errorParticles.forEach(particle => {
    if (!particle.userData.isError) return;

    // Orbit rotation
    particle.userData.angle += particle.userData.orbitSpeed * 0.02;
    updateErrorPosition(particle);

    // Spin the particle
    particle.rotation.x += 0.05;
    particle.rotation.y += 0.03;

    // Decay over time
    particle.userData.life -= particle.userData.decayRate;
    particle.material.opacity = particle.userData.life * 0.9;

    // Pulse effect for critical
    if (particle.userData.severity === 'critical') {
      const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.2;
      particle.scale.setScalar(pulse);

      if (particle.userData.glow) {
        particle.userData.glow.material.opacity = 0.3 + Math.sin(Date.now() * 0.008) * 0.2;
      }
    }

    // Remove when faded
    if (particle.userData.life <= 0) {
      toRemove.push(particle);
    }
  });

  // Clean up faded particles
  toRemove.forEach(particle => {
    state.scene.remove(particle);
    errorParticles = errorParticles.filter(p => p !== particle);
  });
}

/**
 * Fetch errors from API and create particles
 */
export async function fetchAndVisualizeErrors() {
  const now = Date.now();
  if (now - lastErrorFetch < ERROR_FETCH_INTERVAL) return;
  lastErrorFetch = now;

  try {
    const response = await fetch(API_BASE + '/api/errors');
    if (!response.ok) return;

    const data = await response.json();

    // Create particles for recent alerts (limit to 10)
    const alerts = (data.alerts || []).slice(0, 10);

    // Only create new particles for alerts we haven't seen
    const existingIds = new Set(errorParticles.map(p => p.userData.alert?.timestamp));

    alerts.forEach((alert, i) => {
      if (!existingIds.has(alert.timestamp)) {
        setTimeout(() => createErrorParticle(alert), i * 200);
      }
    });

    // Update error count in HUD
    updateErrorHUD(data);

  } catch (e) {
    console.warn('[Errors] Fetch failed:', e.message);
  }
}

/**
 * Update error count in HUD (safe DOM manipulation)
 */
function updateErrorHUD(data) {
  let hudEl = document.getElementById('error-count');
  if (!hudEl) {
    hudEl = document.createElement('div');
    hudEl.id = 'error-count';
    hudEl.style.cssText = 'position: fixed; bottom: 120px; left: 20px; font-size: 10px; z-index: 100;';
    document.body.appendChild(hudEl);
  }

  // Clear existing content safely
  hudEl.replaceChildren();

  const alerts = data.alerts || [];
  const critical = alerts.filter(a => a.severity === 'critical').length;
  const warning = alerts.filter(a => a.severity === 'warning').length;

  // Create critical count element
  const critDiv = document.createElement('div');
  critDiv.style.color = critical > 0 ? '#ff0000' : '#666';
  critDiv.textContent = 'CRITICAL: ' + critical;
  hudEl.appendChild(critDiv);

  // Create warning count element
  const warnDiv = document.createElement('div');
  warnDiv.style.cssText = 'color: ' + (warning > 0 ? '#ffaa00' : '#666') + '; margin-top: 4px;';
  warnDiv.textContent = 'WARNINGS: ' + warning;
  hudEl.appendChild(warnDiv);
}

/**
 * Get current error particle count
 */
export function getErrorCount() {
  return errorParticles.length;
}

/**
 * Get counts by severity
 */
export function getErrorsBySeverity() {
  const counts = { critical: 0, warning: 0, info: 0 };
  errorParticles.forEach(p => {
    const sev = p.userData.severity || 'warning';
    if (counts[sev] !== undefined) counts[sev]++;
  });
  return counts;
}
