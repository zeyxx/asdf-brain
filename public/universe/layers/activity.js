/**
 * Activity Layer - Burns, judgments, real-time events
 * "Don't extract, burn"
 */

const ActivityLayer = {
  particles: null,
  particleData: [],
  burns: [],

  /**
   * Create activity visualization
   */
  create(layer) {
    // Create particle system
    this.createParticles(layer);
  },

  /**
   * Create spiral particle field
   */
  createParticles(layer) {
    const count = CONFIG.LAYOUT.PARTICLE_COUNT;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    this.particleData = [];

    for (let i = 0; i < count; i++) {
      // Spiral distribution
      const t = i / count;
      const radius = 5 + t * 50;
      const angle = t * Math.PI * 8;
      const y = (Math.random() - 0.5) * 40;

      positions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 5;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 5;

      // Golden color with variation
      colors[i * 3] = 0.8 + Math.random() * 0.2;
      colors[i * 3 + 1] = 0.65 + Math.random() * 0.15;
      colors[i * 3 + 2] = 0.1 + Math.random() * 0.1;

      sizes[i] = 0.2 + Math.random() * 0.3;

      // Store original position for animation
      this.particleData.push({
        originalX: positions[i * 3],
        originalY: positions[i * 3 + 1],
        originalZ: positions[i * 3 + 2],
        speed: 0.5 + Math.random() * 0.5
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true
    });

    this.particles = new THREE.Points(geometry, material);
    this.particles.userData = { type: 'activity' };
    layer.add(this.particles);
  },

  /**
   * Add a burn event (visual effect)
   */
  addBurnEvent(position) {
    // Create expanding ring
    const geometry = new THREE.RingGeometry(0.5, 1, 32);
    const material = new THREE.MeshBasicMaterial({
      color: CONFIG.COLORS.BURN,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });

    const ring = new THREE.Mesh(geometry, material);
    ring.position.copy(position || new THREE.Vector3(
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 30
    ));
    ring.rotation.x = Math.random() * Math.PI;
    ring.rotation.y = Math.random() * Math.PI;

    ring.userData = {
      type: 'burn',
      createdAt: Date.now(),
      lifetime: 2000
    };

    this.burns.push(ring);
    return ring;
  },

  /**
   * Process real-time event
   */
  processEvent(event, layer) {
    if (!event) return;

    const type = event.type || event.eventType;

    if (type === 'burn' || type === 'judgment_burn') {
      const ring = this.addBurnEvent();
      layer.add(ring);
    }
  },

  /**
   * Update animation
   */
  update(time, layer) {
    // Animate particles spiraling inward
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;

      for (let i = 0; i < this.particleData.length; i++) {
        const data = this.particleData[i];
        const idx = i * 3;

        const x = positions[idx];
        const z = positions[idx + 2];
        const dist = Math.sqrt(x * x + z * z);

        if (dist > 3) {
          // Spiral inward
          const angle = Math.atan2(z, x) + 0.002 * data.speed;
          const newDist = dist - CONFIG.ANIMATION.PARTICLE_SPEED * data.speed;

          positions[idx] = Math.cos(angle) * newDist;
          positions[idx + 2] = Math.sin(angle) * newDist;
        } else {
          // Reset to original
          positions[idx] = data.originalX;
          positions[idx + 1] = data.originalY;
          positions[idx + 2] = data.originalZ;
        }
      }

      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    // Animate burns (expand and fade)
    const now = Date.now();
    this.burns = this.burns.filter(burn => {
      const age = now - burn.userData.createdAt;
      const progress = age / burn.userData.lifetime;

      if (progress >= 1) {
        layer.remove(burn);
        burn.geometry.dispose();
        burn.material.dispose();
        return false;
      }

      // Expand and fade
      const scale = 1 + progress * 5;
      burn.scale.set(scale, scale, scale);
      burn.material.opacity = 0.8 * (1 - progress);

      return true;
    });
  }
};
