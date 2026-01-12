/**
 * THE_INNOMMABLE Visualization Module
 * "φ qui doute de φ" - The dimension of unknown dimensions
 *
 * Visualizes:
 * - Residual buffer (anomaly particles floating in limbo)
 * - The Frontier (ring at the edge of known space)
 * - Pending dimension proposals (candidate spheres)
 * - THE_INNOMMABLE portal (vortex at the frontier)
 */

import * as THREE from 'three';
import { PHI, PHI_INV, API_BASE, COLORS } from './constants.js';
import * as state from './state.js';

// Visualization state
let innommableGroup = null;
let frontierRing = null;
let anomalyParticles = [];
let proposalSpheres = [];
let portalMesh = null;
let lastFetch = 0;
const FETCH_INTERVAL = 10000; // 10s

// Configuration
const INNOMMABLE_CONFIG = {
  frontierRadius: 280,        // Radius of the frontier ring
  frontierY: 50,              // Y position
  portalSize: 25,             // Size of the portal vortex
  anomalyZone: {              // Zone where anomalies float
    minRadius: 240,
    maxRadius: 300,
    minY: 20,
    maxY: 80,
  },
  colors: {
    frontier: 0xff3366,       // Pink - the unknown
    anomaly: 0xff6600,        // Orange - anomalies
    proposal: 0xaa00ff,       // Purple - candidates
    portal: 0xff0066,         // Magenta - THE_INNOMMABLE
    accepted: 0x00ff00,       // Green - accepted
  }
};

/**
 * Initialize THE_INNOMMABLE visualization
 */
export function initInnommable() {
  innommableGroup = new THREE.Group();
  innommableGroup.userData = { name: 'THE_INNOMMABLE' };
  state.scene.add(innommableGroup);

  // Create the frontier ring
  createFrontierRing();

  // Create the portal vortex
  createPortal();

  // Create frontier label
  createFrontierLabel();

  // Initial data fetch
  fetchAndUpdateInnommable();

  console.log('[INNOMMABLE] Visualization initialized');
}

/**
 * Create the frontier ring - boundary of known dimensions
 */
function createFrontierRing() {
  const geometry = new THREE.TorusGeometry(
    INNOMMABLE_CONFIG.frontierRadius,
    2,  // tube radius
    16, // radial segments
    100 // tubular segments
  );

  const material = new THREE.MeshBasicMaterial({
    color: INNOMMABLE_CONFIG.colors.frontier,
    transparent: true,
    opacity: 0.3,
    wireframe: true,
  });

  frontierRing = new THREE.Mesh(geometry, material);
  frontierRing.rotation.x = Math.PI / 2; // Horizontal
  frontierRing.position.y = INNOMMABLE_CONFIG.frontierY;

  innommableGroup.add(frontierRing);

  // Add glow ring
  const glowGeometry = new THREE.TorusGeometry(
    INNOMMABLE_CONFIG.frontierRadius,
    8,
    8,
    60
  );
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: INNOMMABLE_CONFIG.colors.frontier,
    transparent: true,
    opacity: 0.1,
    side: THREE.DoubleSide,
  });
  const glowRing = new THREE.Mesh(glowGeometry, glowMaterial);
  glowRing.rotation.x = Math.PI / 2;
  glowRing.position.y = INNOMMABLE_CONFIG.frontierY;
  innommableGroup.add(glowRing);
}

/**
 * Create THE_INNOMMABLE portal - vortex to the unknown
 */
function createPortal() {
  // Spiral geometry
  const points = [];
  const spiralTurns = 3;
  const pointCount = 100;

  for (let i = 0; i < pointCount; i++) {
    const t = i / pointCount;
    const angle = t * spiralTurns * Math.PI * 2;
    const radius = INNOMMABLE_CONFIG.portalSize * (1 - t * 0.7);
    points.push(new THREE.Vector3(
      Math.cos(angle) * radius,
      t * 30, // Spiral upward
      Math.sin(angle) * radius
    ));
  }

  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, 64, 1.5, 8, false);

  const material = new THREE.MeshBasicMaterial({
    color: INNOMMABLE_CONFIG.colors.portal,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
  });

  portalMesh = new THREE.Mesh(geometry, material);
  portalMesh.position.set(
    INNOMMABLE_CONFIG.frontierRadius * 0.9,
    INNOMMABLE_CONFIG.frontierY + 20,
    0
  );
  portalMesh.userData = { isPortal: true };

  innommableGroup.add(portalMesh);

  // Portal core (pulsing sphere)
  const coreGeometry = new THREE.IcosahedronGeometry(8, 2);
  const coreMaterial = new THREE.MeshBasicMaterial({
    color: INNOMMABLE_CONFIG.colors.portal,
    transparent: true,
    opacity: 0.5,
    wireframe: true,
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  core.position.copy(portalMesh.position);
  core.position.y += 15;
  core.userData = { isPortalCore: true };
  innommableGroup.add(core);
}

/**
 * Create frontier label
 */
function createFrontierLabel() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 512;
  canvas.height = 128;

  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = 'bold 24px Orbitron';
  ctx.fillStyle = '#ff3366';
  ctx.textAlign = 'center';
  ctx.fillText('THE FRONTIER', canvas.width / 2, 40);

  ctx.font = '14px Orbitron';
  ctx.fillStyle = '#ff6699';
  ctx.fillText('φ qui doute de φ', canvas.width / 2, 70);

  ctx.font = '12px Orbitron';
  ctx.fillStyle = '#888888';
  ctx.fillText('Unknown dimensions beyond', canvas.width / 2, 100);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.8,
  });

  const sprite = new THREE.Sprite(material);
  sprite.position.set(
    -INNOMMABLE_CONFIG.frontierRadius * 0.7,
    INNOMMABLE_CONFIG.frontierY + 60,
    INNOMMABLE_CONFIG.frontierRadius * 0.5
  );
  sprite.scale.set(100, 25, 1);

  innommableGroup.add(sprite);
}

/**
 * Create anomaly particle (residual in buffer)
 */
function createAnomalyParticle(anomaly) {
  const zone = INNOMMABLE_CONFIG.anomalyZone;
  const angle = Math.random() * Math.PI * 2;
  const radius = zone.minRadius + Math.random() * (zone.maxRadius - zone.minRadius);

  const geometry = new THREE.TetrahedronGeometry(3 + anomaly.weight * 3, 0);
  const material = new THREE.MeshBasicMaterial({
    color: INNOMMABLE_CONFIG.colors.anomaly,
    transparent: true,
    opacity: 0.6 + anomaly.weight * 0.3,
    wireframe: Math.random() > 0.5,
    blending: THREE.AdditiveBlending,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(
    Math.cos(angle) * radius,
    zone.minY + Math.random() * (zone.maxY - zone.minY),
    Math.sin(angle) * radius
  );

  mesh.userData = {
    isAnomaly: true,
    anomaly,
    orbitSpeed: 0.1 + Math.random() * 0.2,
    floatSpeed: 0.5 + Math.random() * 0.5,
    floatPhase: Math.random() * Math.PI * 2,
    angle,
    radius,
  };

  innommableGroup.add(mesh);
  anomalyParticles.push(mesh);
}

/**
 * Create proposal sphere (pending dimension candidate)
 */
function createProposalSphere(proposal) {
  const angle = Math.random() * Math.PI * 2;
  const radius = INNOMMABLE_CONFIG.frontierRadius * 0.85;

  // Main sphere
  const geometry = new THREE.DodecahedronGeometry(12, 0);
  const material = new THREE.MeshPhongMaterial({
    color: INNOMMABLE_CONFIG.colors.proposal,
    emissive: INNOMMABLE_CONFIG.colors.proposal,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.7,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(
    Math.cos(angle) * radius,
    INNOMMABLE_CONFIG.frontierY + 30,
    Math.sin(angle) * radius
  );

  mesh.userData = {
    isProposal: true,
    proposal,
    pulsePhase: Math.random() * Math.PI * 2,
    orbitAngle: angle,
  };

  innommableGroup.add(mesh);
  proposalSpheres.push(mesh);

  // Create proposal label
  createProposalLabel(mesh, proposal);
}

/**
 * Create label for proposal
 */
function createProposalLabel(mesh, proposal) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 64;

  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = '14px Orbitron';
  ctx.fillStyle = '#aa00ff';
  ctx.textAlign = 'center';
  ctx.fillText(proposal.suggestedName || 'UNNAMED', canvas.width / 2, 25);

  ctx.font = '10px Orbitron';
  ctx.fillStyle = '#888888';
  ctx.fillText(`${(proposal.confidence * 100).toFixed(1)}% conf`, canvas.width / 2, 45);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.8,
  });

  const sprite = new THREE.Sprite(material);
  sprite.position.set(mesh.position.x, mesh.position.y + 20, mesh.position.z);
  sprite.scale.set(40, 10, 1);
  sprite.userData = { isProposalLabel: true, proposalId: proposal.id };

  innommableGroup.add(sprite);
}

/**
 * Animate THE_INNOMMABLE visualization
 */
export function animateInnommable() {
  if (!innommableGroup) return;

  const time = Date.now() * 0.001;

  // Rotate frontier ring slowly
  if (frontierRing) {
    frontierRing.rotation.z = time * 0.05;
  }

  // Animate portal
  if (portalMesh) {
    portalMesh.rotation.y = time * 0.5;

    // Find and animate core
    const core = innommableGroup.children.find(c => c.userData?.isPortalCore);
    if (core) {
      core.rotation.x = time * 0.7;
      core.rotation.z = time * 0.5;
      const pulse = 1 + Math.sin(time * 3) * 0.2;
      core.scale.setScalar(pulse);
    }
  }

  // Animate anomaly particles
  anomalyParticles.forEach(particle => {
    const data = particle.userData;

    // Orbit around frontier
    data.angle += data.orbitSpeed * 0.01;
    particle.position.x = Math.cos(data.angle) * data.radius;
    particle.position.z = Math.sin(data.angle) * data.radius;

    // Float up and down
    const float = Math.sin(time * data.floatSpeed + data.floatPhase) * 5;
    particle.position.y = INNOMMABLE_CONFIG.anomalyZone.minY +
      (INNOMMABLE_CONFIG.anomalyZone.maxY - INNOMMABLE_CONFIG.anomalyZone.minY) / 2 + float;

    // Spin
    particle.rotation.x += 0.02;
    particle.rotation.y += 0.03;

    // Fade based on weight
    if (data.anomaly) {
      particle.material.opacity = 0.4 + data.anomaly.weight * 0.4;
    }
  });

  // Animate proposal spheres
  proposalSpheres.forEach(sphere => {
    const data = sphere.userData;

    // Pulse
    const pulse = 1 + Math.sin(time * 2 + data.pulsePhase) * 0.15;
    sphere.scale.setScalar(pulse);

    // Glow intensity
    sphere.material.emissiveIntensity = 0.3 + Math.sin(time * 3 + data.pulsePhase) * 0.2;

    // Slow orbit
    data.orbitAngle += 0.002;
    const radius = INNOMMABLE_CONFIG.frontierRadius * 0.85;
    sphere.position.x = Math.cos(data.orbitAngle) * radius;
    sphere.position.z = Math.sin(data.orbitAngle) * radius;

    // Update label position
    const label = innommableGroup.children.find(
      c => c.userData?.isProposalLabel && c.userData.proposalId === data.proposal?.id
    );
    if (label) {
      label.position.x = sphere.position.x;
      label.position.z = sphere.position.z;
    }
  });
}

/**
 * Fetch data and update visualization
 */
export async function fetchAndUpdateInnommable() {
  const now = Date.now();
  if (now - lastFetch < FETCH_INTERVAL && lastFetch > 0) return;
  lastFetch = now;

  try {
    const response = await fetch(API_BASE + '/api/innommable');
    if (!response.ok) return;

    const data = await response.json();

    // Update anomaly particles
    updateAnomalyParticles(data.residualDetector?.bufferStatus);

    // Update proposal spheres
    updateProposalSpheres(data.innommable?.pending || []);

    // Update HUD
    updateInnommableHUD(data);

    console.log('[INNOMMABLE] Updated:', {
      anomalies: anomalyParticles.length,
      proposals: proposalSpheres.length,
    });

  } catch (e) {
    console.warn('[INNOMMABLE] Fetch failed:', e.message);
  }
}

/**
 * Update anomaly particles based on buffer status
 */
function updateAnomalyParticles(bufferStatus) {
  if (!bufferStatus) return;

  const targetCount = Math.min(bufferStatus.count || 0, 20); // Max 20 particles
  const currentCount = anomalyParticles.length;

  // Add particles if needed
  if (targetCount > currentCount) {
    for (let i = 0; i < targetCount - currentCount; i++) {
      createAnomalyParticle({
        weight: Math.random() * 0.5 + 0.3,
        id: `anom_${Date.now()}_${i}`,
      });
    }
  }

  // Remove excess particles
  while (anomalyParticles.length > targetCount) {
    const particle = anomalyParticles.pop();
    innommableGroup.remove(particle);
  }
}

/**
 * Update proposal spheres
 */
function updateProposalSpheres(pending) {
  // Remove old proposals
  proposalSpheres.forEach(sphere => {
    innommableGroup.remove(sphere);
    // Also remove label
    const label = innommableGroup.children.find(
      c => c.userData?.isProposalLabel && c.userData.proposalId === sphere.userData.proposal?.id
    );
    if (label) innommableGroup.remove(label);
  });
  proposalSpheres = [];

  // Create new proposals
  pending.forEach(proposal => {
    createProposalSphere(proposal);
  });
}

/**
 * Update HUD display
 */
function updateInnommableHUD(data) {
  let hudEl = document.getElementById('innommable-hud');
  if (!hudEl) {
    hudEl = document.createElement('div');
    hudEl.id = 'innommable-hud';
    hudEl.style.cssText = `
      position: fixed;
      bottom: 200px;
      left: 20px;
      font-size: 10px;
      z-index: 100;
      background: rgba(0,0,0,0.5);
      padding: 8px;
      border: 1px solid #ff3366;
      border-radius: 4px;
    `;
    document.body.appendChild(hudEl);
  }

  hudEl.replaceChildren();

  // Title
  const title = document.createElement('div');
  title.style.cssText = 'color: #ff3366; font-weight: bold; margin-bottom: 6px;';
  title.textContent = '◊ THE_INNOMMABLE';
  hudEl.appendChild(title);

  const residual = data.residualDetector;
  const innommable = data.innommable;

  // Buffer status
  if (residual?.bufferStatus) {
    const bufferDiv = document.createElement('div');
    bufferDiv.style.color = residual.bufferStatus.count > 0 ? '#ff6600' : '#666';
    bufferDiv.textContent = `Anomalies: ${residual.bufferStatus.count}`;
    hudEl.appendChild(bufferDiv);

    if (residual.canDiscover) {
      const discoverDiv = document.createElement('div');
      discoverDiv.style.cssText = 'color: #00ff00; font-size: 9px; margin-top: 2px;';
      discoverDiv.textContent = '⚡ Ready to discover!';
      hudEl.appendChild(discoverDiv);
    }
  }

  // Pending proposals
  if (innommable?.pending?.length > 0) {
    const pendingDiv = document.createElement('div');
    pendingDiv.style.cssText = 'color: #aa00ff; margin-top: 4px;';
    pendingDiv.textContent = `Pending: ${innommable.pending.length}`;
    hudEl.appendChild(pendingDiv);

    // Top proposal
    const top = innommable.pending[0];
    if (top) {
      const topDiv = document.createElement('div');
      topDiv.style.cssText = 'color: #888; font-size: 9px;';
      topDiv.textContent = `→ ${top.suggestedName}`;
      hudEl.appendChild(topDiv);
    }
  } else {
    const quietDiv = document.createElement('div');
    quietDiv.style.cssText = 'color: #666; font-size: 9px; margin-top: 4px;';
    quietDiv.textContent = 'Frontier quiet';
    hudEl.appendChild(quietDiv);
  }

  // Stats
  if (innommable?.status?.stats) {
    const stats = innommable.status.stats;
    const statsDiv = document.createElement('div');
    statsDiv.style.cssText = 'color: #444; font-size: 8px; margin-top: 4px;';
    statsDiv.textContent = `A:${stats.accepted} R:${stats.rejected}`;
    hudEl.appendChild(statsDiv);
  }
}

/**
 * Get current state
 */
export function getInnommableState() {
  return {
    anomalyCount: anomalyParticles.length,
    proposalCount: proposalSpheres.length,
    hasGroup: innommableGroup !== null,
  };
}
