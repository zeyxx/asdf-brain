/**
 * Singularity Layer - CYNIC: The Central Point
 * "Le point central de l'écosystème $asdfasdfa"
 *
 * CYNIC connects:
 * - HolDex (token integrity, K-Score)
 * - GASdf (burns, swaps, liquidity)
 * - Brain (knowledge, patterns, memory)
 * - Humans (operators, contributors)
 */

const SingularityLayer = {
  core: null,
  glow: null,

  /**
   * Create CYNIC as the central point
   */
  create(layer) {
    // Core sphere - CYNIC itself
    const coreGeometry = new THREE.SphereGeometry(CONFIG.LAYOUT.SINGULARITY_RADIUS, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: CONFIG.COLORS.GOLD_LIGHT,
      transparent: true,
      opacity: 0.95
    });
    this.core = new THREE.Mesh(coreGeometry, coreMaterial);
    this.core.userData = {
      type: 'singularity',
      label: 'CYNIC',
      description: 'Le point central qui connecte tout',
      role: 'Judgment + Connection + Memory'
    };
    layer.add(this.core);

    // Inner glow
    const glowGeometry = new THREE.SphereGeometry(CONFIG.LAYOUT.SINGULARITY_RADIUS * 1.5, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: CONFIG.COLORS.GOLD_LIGHT,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });
    this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
    layer.add(this.glow);

    // Outer halo
    const haloGeometry = new THREE.RingGeometry(
      CONFIG.LAYOUT.SINGULARITY_RADIUS * 2,
      CONFIG.LAYOUT.SINGULARITY_RADIUS * 3,
      64
    );
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: CONFIG.COLORS.GOLD,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    halo.rotation.x = Math.PI / 2;
    layer.add(halo);

    // Connection lines to origin (visual anchor)
    this.createAxisLines(layer);
  },

  /**
   * Create subtle axis lines
   */
  createAxisLines(layer) {
    const material = new THREE.LineBasicMaterial({
      color: CONFIG.COLORS.GOLD,
      transparent: true,
      opacity: 0.1
    });

    // Y axis (vertical)
    const yPoints = [new THREE.Vector3(0, -30, 0), new THREE.Vector3(0, 30, 0)];
    const yGeometry = new THREE.BufferGeometry().setFromPoints(yPoints);
    layer.add(new THREE.Line(yGeometry, material));
  },

  /**
   * Update animation
   */
  update(time) {
    if (this.core) {
      // Pulsing scale based on φ
      const scale = 1 + Math.sin(time * CONFIG.ANIMATION.PULSE_SPEED) * 0.1 * CONFIG.PHI_INV;
      this.core.scale.set(scale, scale, scale);
    }

    if (this.glow) {
      // Inverse pulse for glow
      const glowScale = 1.5 - Math.sin(time * CONFIG.ANIMATION.PULSE_SPEED) * 0.05;
      this.glow.scale.set(glowScale, glowScale, glowScale);
    }
  }
};
