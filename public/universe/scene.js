/**
 * CYNIC Universe - 3D Scene
 * Three.js scene management
 */

const Scene = {
  // Three.js objects
  scene: null,
  camera: null,
  renderer: null,
  controls: null,

  // Animation state
  isRotating: true,
  time: 0,
  animationId: null,

  // Layer groups
  layers: {},

  // Raycasting for interaction
  raycaster: null,
  mouse: null,
  selectedObject: null,

  /**
   * Initialize the 3D scene
   */
  init() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0a0f, 0.008);

    // Camera (φ-based FOV)
    const fov = 60 * CONFIG.PHI_INV; // ~37 degrees
    this.camera = new THREE.PerspectiveCamera(
      fov + 20, // Adjust for usability
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );
    this.camera.position.set(0, 40, 80);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.getElementById('canvas-container').appendChild(this.renderer.domElement);

    // Controls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 30;
    this.controls.maxDistance = 150;
    this.controls.maxPolarAngle = Math.PI * 0.85;

    // Lighting
    this.setupLighting();

    // Raycaster for interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Layer groups
    this.layers = {
      singularity: new THREE.Group(),
      knowledge: new THREE.Group(),
      dimensions: new THREE.Group(),
      ecosystem: new THREE.Group(),
      activity: new THREE.Group()
    };

    // Add layers to scene
    Object.values(this.layers).forEach(layer => this.scene.add(layer));

    // Event listeners
    window.addEventListener('resize', () => this.onResize());
    this.renderer.domElement.addEventListener('click', (e) => this.onClick(e));
    this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));

    return this;
  },

  /**
   * Setup scene lighting
   */
  setupLighting() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambient);

    // Central point light (singularity glow)
    const pointLight = new THREE.PointLight(CONFIG.COLORS.GOLD_LIGHT, 2, 100);
    pointLight.position.set(0, 0, 0);
    this.scene.add(pointLight);

    // Hemisphere light for natural feel
    const hemi = new THREE.HemisphereLight(0xffffff, 0x080820, 0.3);
    this.scene.add(hemi);
  },

  /**
   * Start animation loop
   */
  startAnimation(updateCallback) {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.time += 0.01;

      // Call layer update callbacks
      if (updateCallback) updateCallback(this.time);

      // Auto-rotate scene
      if (this.isRotating) {
        this.layers.dimensions.rotation.y += CONFIG.ANIMATION.ROTATION_SPEED * CONFIG.PHI_INV;
        this.layers.knowledge.rotation.y += CONFIG.ANIMATION.ROTATION_SPEED;
      }

      // Update controls
      this.controls.update();

      // Render
      this.renderer.render(this.scene, this.camera);
    };

    animate();
  },

  /**
   * Stop animation
   */
  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  },

  /**
   * Handle window resize
   */
  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  },

  /**
   * Handle click for object selection
   */
  onClick(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    if (intersects.length > 0) {
      const object = intersects[0].object;
      if (object.userData && object.userData.type) {
        this.selectObject(object);
      }
    }
  },

  /**
   * Handle mouse move for hover effects
   */
  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  },

  /**
   * Select an object and show info
   */
  selectObject(object) {
    // Reset previous selection
    if (this.selectedObject) {
      if (this.selectedObject.material.emissive) {
        this.selectedObject.material.emissiveIntensity = 0.3;
      }
    }

    this.selectedObject = object;

    // Highlight new selection
    if (object.material.emissive) {
      object.material.emissiveIntensity = 0.8;
    }

    // Update info panel using safe DOM methods
    const info = document.getElementById('selection-info');
    const data = object.userData;

    // Clear existing content
    while (info.firstChild) {
      info.removeChild(info.firstChild);
    }

    // Build content safely
    const strong = document.createElement('strong');
    const br1 = document.createElement('br');
    const details = document.createElement('span');

    switch (data.type) {
      case 'singularity':
        strong.textContent = 'CYNIC';
        details.textContent = 'Le point central | Judgment + Connection + Memory';
        break;
      case 'dimension':
        strong.textContent = data.name || 'DIMENSION';
        details.textContent = 'Ring: ' + (data.ring || '--') + ' | Score: ' + (data.score?.toFixed(1) || '--');
        break;
      case 'knowledge':
        strong.textContent = data.label || 'KNOWLEDGE';
        details.textContent = 'Type: ' + (data.nodeType || '--') + ' | N-Score: ' + (data.score?.toFixed(1) || '--');
        break;
      case 'ecosystem':
        strong.textContent = data.name || 'ECOSYSTEM';
        details.textContent = 'Status: ' + (data.status || 'unknown');
        break;
      default:
        strong.textContent = data.type || 'OBJECT';
        details.textContent = '';
    }

    info.appendChild(strong);
    info.appendChild(br1);
    info.appendChild(details);
  },

  /**
   * Reset camera view
   */
  resetView() {
    this.camera.position.set(0, 40, 80);
    this.camera.lookAt(0, 0, 0);
    this.controls.reset();
  },

  /**
   * Toggle rotation
   */
  toggleRotation() {
    this.isRotating = !this.isRotating;
    return this.isRotating;
  },

  /**
   * Toggle layer visibility
   */
  setLayerVisible(layerName, visible) {
    if (this.layers[layerName]) {
      this.layers[layerName].visible = visible;
    }
  },

  /**
   * Clear a layer's contents
   */
  clearLayer(layerName) {
    const layer = this.layers[layerName];
    if (layer) {
      while (layer.children.length > 0) {
        const child = layer.children[0];
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
        layer.remove(child);
      }
    }
  },

  /**
   * Get layer group
   */
  getLayer(name) {
    return this.layers[name];
  }
};
