/**
 * CYNIC Scene Module
 * Three.js scene setup, nodes, edges, core, animation
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PHI, COLORS, LAYOUT_4MONDES, LAYOUT_5x5 } from './constants.js';
import * as state from './state.js';

/**
 * Calculate positions for all dimensions based on current view
 */
export function calculatePositions() {
  const positions = {};
  const dimNames = Object.keys(state.DIMENSIONS);
  const layout = state.currentView === '5x5' ? LAYOUT_5x5 : LAYOUT_4MONDES;

  // Group dimensions by category
  const groups = {};
  dimNames.forEach(d => {
    const cat = state.DIMENSIONS[d].category;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(d);
  });

  // Position each group
  for (const [category, dims] of Object.entries(groups)) {
    const cfg = layout[category];
    if (!cfg) {
      // Fallback for unknown categories
      dims.forEach((name, i) => {
        positions[name] = { x: Math.random() * 100, y: Math.random() * 100, z: Math.random() * 100 };
      });
      continue;
    }

    if (cfg.radius === 0) {
      // Center position (e.g., DISCOVERY)
      dims.forEach(name => {
        positions[name] = { x: 0, y: cfg.y, z: 0 };
      });
    } else {
      dims.forEach((name, i) => {
        const angle = (i / dims.length) * Math.PI * 2 + cfg.offset;
        positions[name] = {
          x: Math.cos(angle) * cfg.radius,
          y: cfg.y,
          z: Math.sin(angle) * cfg.radius
        };
      });
    }
  }

  return positions;
}

/**
 * Create dimension node spheres
 */
export function createDimensionNodes() {
  const positions = calculatePositions();

  for (const [name, config] of Object.entries(state.DIMENSIONS)) {
    const pos = positions[name];
    const score = state.currentScores[name] || 50;
    const baseSize = 8 + (score / 100) * 12;
    const size = baseSize * (config.weight / PHI);

    const geometry = new THREE.SphereGeometry(size, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: config.color,
      emissive: config.color,
      emissiveIntensity: 0.3 + (score / 100) * 0.4,
      transparent: true,
      opacity: 0.9,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(pos.x, pos.y, pos.z);
    mesh.userData = { name, config, score };

    state.scene.add(mesh);
    state.setDimensionMesh(name, mesh);

    createLabel(name, pos, config.color);
  }
}

/**
 * Create text label for a dimension
 */
export function createLabel(text, position, color) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 64;

  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = '20px Orbitron';
  ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
  ctx.textAlign = 'center';
  ctx.fillText(text.replace(/_/g, ' '), canvas.width / 2, canvas.height / 2 + 8);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.7 });
  const sprite = new THREE.Sprite(material);

  sprite.position.set(position.x, position.y + 25, position.z);
  sprite.scale.set(50, 12, 1);
  sprite.userData = { isLabel: true, parentDim: text };

  state.scene.add(sprite);
}

/**
 * Create harmony edges between related dimensions
 */
export function createHarmonyEdges() {
  const positions = calculatePositions();

  const edgeMaterial = new THREE.LineBasicMaterial({
    color: COLORS.EDGE,
    transparent: true,
    opacity: 0.3,
  });

  for (const [name1, config1] of Object.entries(state.DIMENSIONS)) {
    for (const [name2, config2] of Object.entries(state.DIMENSIONS)) {
      if (name1 >= name2) continue;

      const sameCategory = config1.category === config2.category;
      const harmony = Math.random() * 0.5 + 0.3;

      if (sameCategory && harmony > 0.4) {
        const pos1 = positions[name1];
        const pos2 = positions[name2];

        const points = [
          new THREE.Vector3(pos1.x, pos1.y, pos1.z),
          new THREE.Vector3(pos2.x, pos2.y, pos2.z)
        ];

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, edgeMaterial.clone());
        line.material.opacity = harmony * 0.5;
        line.userData = { from: name1, to: name2, harmony };

        state.scene.add(line);
        state.addEdgeLine(line);
      }
    }
  }

  document.getElementById('connections').textContent = state.edgeLines.length.toString();
}

/**
 * Create the central singularity core
 */
export function createCoreSingularity() {
  const coreGeometry = new THREE.SphereGeometry(30, 64, 64);
  const coreMaterial = new THREE.MeshPhongMaterial({
    color: COLORS.CORE,
    emissive: COLORS.CORE,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.6,
  });

  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  core.position.set(0, 0, 0);
  state.scene.add(core);

  const wireGeometry = new THREE.IcosahedronGeometry(35, 1);
  const wireMaterial = new THREE.MeshBasicMaterial({
    color: COLORS.CORE,
    wireframe: true,
    transparent: true,
    opacity: 0.3,
  });

  const wireframe = new THREE.Mesh(wireGeometry, wireMaterial);
  state.scene.add(wireframe);

  core.userData.wireframe = wireframe;
  state.setDimensionMesh('_core', core);
}

/**
 * Create ambient particle field
 */
export function createAmbientParticles() {
  const count = 1000;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 100 + Math.random() * 200;

    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5;
    positions[i3 + 2] = r * Math.cos(phi);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: COLORS.CORE,
    size: 1.5,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
  });

  const particles = new THREE.Points(geometry, material);
  state.scene.add(particles);
  state.setCoreParticles(particles);
}

/**
 * Initialize the Three.js scene
 */
export function initScene() {
  const newScene = new THREE.Scene();
  newScene.background = new THREE.Color(COLORS.BACKGROUND);
  state.setScene(newScene);

  const newCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
  newCamera.position.set(0, 100, 400);
  state.setCamera(newCamera);

  const newRenderer = new THREE.WebGLRenderer({ antialias: true });
  newRenderer.setSize(window.innerWidth, window.innerHeight);
  newRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.getElementById('container').appendChild(newRenderer.domElement);
  state.setRenderer(newRenderer);

  const newControls = new OrbitControls(newCamera, newRenderer.domElement);
  newControls.enableDamping = true;
  newControls.dampingFactor = 0.05;
  newControls.minDistance = 150;
  newControls.maxDistance = 800;
  state.setControls(newControls);

  state.setRaycaster(new THREE.Raycaster());
  state.setMouse(new THREE.Vector2());

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  state.scene.add(ambientLight);

  const pointLight = new THREE.PointLight(COLORS.CORE, 1, 500);
  pointLight.position.set(0, 50, 0);
  state.scene.add(pointLight);

  // Create scene elements
  createDimensionNodes();
  createHarmonyEdges();
  createCoreSingularity();
  createAmbientParticles();
}

/**
 * Rebuild the scene (for view switching)
 */
export function rebuildScene() {
  // Remove old dimension meshes
  for (const [name, mesh] of Object.entries(state.dimensionMeshes)) {
    if (name === '_core') continue;
    state.scene.remove(mesh);
  }

  // Remove old labels (sprites)
  state.scene.children.filter(c => c.userData && c.userData.isLabel).forEach(s => state.scene.remove(s));

  // Remove old edges
  state.edgeLines.forEach(line => state.scene.remove(line));
  state.clearEdgeLines();

  // Clear meshes (keep core)
  state.clearDimensionMeshes();

  // Recreate
  createDimensionNodes();
  createHarmonyEdges();
}

/**
 * Update dimension visibility based on active category
 */
export function updateVisibility() {
  for (const [name, mesh] of Object.entries(state.dimensionMeshes)) {
    if (name === '_core') continue;

    const config = state.DIMENSIONS[name];
    if (!config) continue;

    const visible = state.activeCategory === 'ALL' || config.category === state.activeCategory;
    mesh.visible = visible;
    mesh.material.opacity = visible ? 0.9 : 0.1;
  }

  state.edgeLines.forEach(line => {
    const fromConfig = state.DIMENSIONS[line.userData.from];
    const toConfig = state.DIMENSIONS[line.userData.to];

    const visible = state.activeCategory === 'ALL' ||
      fromConfig?.category === state.activeCategory ||
      toConfig?.category === state.activeCategory;

    line.visible = visible;
  });
}

/**
 * Animation tick (called from main.js animation loop)
 */
export function animate() {
  const time = Date.now() * 0.001;

  // Rotate core
  if (state.dimensionMeshes._core) {
    state.dimensionMeshes._core.rotation.y = time * 0.2;
    if (state.dimensionMeshes._core.userData.wireframe) {
      state.dimensionMeshes._core.userData.wireframe.rotation.y = -time * 0.15;
      state.dimensionMeshes._core.userData.wireframe.rotation.x = time * 0.1;
    }
  }

  // Pulse dimension spheres
  for (const [name, mesh] of Object.entries(state.dimensionMeshes)) {
    if (name === '_core' || !mesh.userData.score) continue;

    const pulse = 1 + Math.sin(time * 2 + mesh.userData.score * 0.1) * 0.05;
    mesh.scale.setScalar(pulse);

    if (name === state.selectedDimension) {
      mesh.material.emissiveIntensity = 0.5 + Math.sin(time * 4) * 0.3;
    }
  }

  // Rotate particles
  if (state.coreParticles) {
    state.coreParticles.rotation.y = time * 0.05;
  }

  state.controls.update();
  state.renderer.render(state.scene, state.camera);
}

/**
 * Handle window resize
 */
export function onResize() {
  state.camera.aspect = window.innerWidth / window.innerHeight;
  state.camera.updateProjectionMatrix();
  state.renderer.setSize(window.innerWidth, window.innerHeight);
}
