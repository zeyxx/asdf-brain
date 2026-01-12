/**
 * CYNIC Realtime Visualization Module
 *
 * Level 3: VISUALISATION - Adds event visualization to 3D dashboard
 *
 * Features:
 * - SSE connection for real-time events
 * - Commit particles (green/blue flows)
 * - Error particles (red explosions)
 * - Pattern formations (clustering)
 * - Lesson extractions (golden rings)
 *
 * @module dashboard/realtime-viz
 */

// PHI constants
const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;

// Event colors
const EVENT_COLORS = {
  'commit:new': 0x00ff88,        // Green
  'commit:alert': 0xff6600,     // Orange
  'error:captured': 0xff3333,   // Red
  'pattern:detected': 0xaa00ff, // Purple
  'lesson:extracted': 0xffd700, // Gold
  'judgment:complete': 0x00aaff, // Blue
  'heartbeat': 0x333333,        // Dark gray
};

// Particle configurations
const PARTICLE_CONFIG = {
  commit: { size: 3, lifetime: 3000, speed: 0.5 },
  error: { size: 5, lifetime: 2000, speed: 0.8 },
  pattern: { size: 8, lifetime: 5000, speed: 0.2 },
  lesson: { size: 10, lifetime: 4000, speed: 0.3 },
};

class RealtimeViz {
  constructor(scene, THREE) {
    this.scene = scene;
    this.THREE = THREE;
    this.particles = [];
    this.patterns = new Map();
    this.eventSource = null;
    this.stats = {
      commits: 0,
      errors: 0,
      patterns: 0,
      lessons: 0,
      connected: false,
    };

    // Create particle systems
    this.initParticleSystems();
  }

  /**
   * Initialize particle systems for each event type
   */
  initParticleSystems() {
    // Commit trail particles
    this.commitTrailGeometry = new this.THREE.BufferGeometry();
    this.commitTrailMaterial = new this.THREE.PointsMaterial({
      color: EVENT_COLORS['commit:new'],
      size: 2,
      transparent: true,
      opacity: 0.6,
      blending: this.THREE.AdditiveBlending,
    });

    // Error burst particles
    this.errorBurstGeometry = new this.THREE.BufferGeometry();
    this.errorBurstMaterial = new this.THREE.PointsMaterial({
      color: EVENT_COLORS['error:captured'],
      size: 4,
      transparent: true,
      opacity: 0.8,
      blending: this.THREE.AdditiveBlending,
    });

    // Pattern cluster geometry
    this.patternClusterMaterial = new this.THREE.MeshPhongMaterial({
      color: EVENT_COLORS['pattern:detected'],
      emissive: EVENT_COLORS['pattern:detected'],
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.5,
      wireframe: true,
    });
  }

  /**
   * Connect to SSE endpoint
   */
  connect(url = '/cynic/sse') {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      console.log('[REALTIME-VIZ] Connected to SSE');
      this.stats.connected = true;
      this.onConnectionChange?.(true);
    };

    this.eventSource.onerror = (err) => {
      console.error('[REALTIME-VIZ] SSE error:', err);
      this.stats.connected = false;
      this.onConnectionChange?.(false);
    };

    // Listen for all event types
    this.eventSource.addEventListener('commit:new', (e) => this.handleCommit(JSON.parse(e.data)));
    this.eventSource.addEventListener('commit:alert', (e) => this.handleCommitAlert(JSON.parse(e.data)));
    this.eventSource.addEventListener('error:captured', (e) => this.handleError(JSON.parse(e.data)));
    this.eventSource.addEventListener('pattern:detected', (e) => this.handlePattern(JSON.parse(e.data)));
    this.eventSource.addEventListener('lesson:extracted', (e) => this.handleLesson(JSON.parse(e.data)));
    this.eventSource.addEventListener('judgment:complete', (e) => this.handleJudgment(JSON.parse(e.data)));
    this.eventSource.addEventListener('connected', (e) => this.handleConnected(JSON.parse(e.data)));
    this.eventSource.addEventListener('heartbeat', (e) => this.handleHeartbeat(JSON.parse(e.data)));
  }

  /**
   * Disconnect from SSE
   */
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.stats.connected = false;
      this.onConnectionChange?.(false);
    }
  }

  /**
   * Handle new commit event
   */
  handleCommit(event) {
    this.stats.commits++;

    // Create commit particle trail from edge to center
    const startAngle = Math.random() * Math.PI * 2;
    const startRadius = 250 + Math.random() * 50;
    const startPos = {
      x: Math.cos(startAngle) * startRadius,
      y: (Math.random() - 0.5) * 100,
      z: Math.sin(startAngle) * startRadius,
    };

    this.createParticleTrail(startPos, { x: 0, y: 0, z: 0 }, {
      color: EVENT_COLORS['commit:new'],
      size: PARTICLE_CONFIG.commit.size,
      lifetime: PARTICLE_CONFIG.commit.lifetime,
      particleCount: 15,
      speed: PARTICLE_CONFIG.commit.speed,
    });

    // Notify listeners
    this.onEvent?.('commit', event.data);
  }

  /**
   * Handle commit alert event
   */
  handleCommitAlert(event) {
    // Similar to commit but with orange color and larger effect
    const startAngle = Math.random() * Math.PI * 2;
    const startRadius = 250;
    const startPos = {
      x: Math.cos(startAngle) * startRadius,
      y: 50,
      z: Math.sin(startAngle) * startRadius,
    };

    this.createParticleTrail(startPos, { x: 0, y: 50, z: 0 }, {
      color: EVENT_COLORS['commit:alert'],
      size: PARTICLE_CONFIG.commit.size * 1.5,
      lifetime: PARTICLE_CONFIG.commit.lifetime * 1.5,
      particleCount: 25,
      speed: PARTICLE_CONFIG.commit.speed * 1.2,
    });

    // Create alert burst at core
    this.createBurst({ x: 0, y: 50, z: 0 }, {
      color: EVENT_COLORS['commit:alert'],
      size: 6,
      count: 30,
      lifetime: 1500,
    });

    this.onEvent?.('commit:alert', event.data);
  }

  /**
   * Handle error event - create explosion effect
   */
  handleError(event) {
    this.stats.errors++;

    // Random position in the system
    const pos = {
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 150 - 50, // Lower in the scene
      z: (Math.random() - 0.5) * 200,
    };

    // Create explosion burst
    this.createBurst(pos, {
      color: EVENT_COLORS['error:captured'],
      size: PARTICLE_CONFIG.error.size,
      count: 50,
      lifetime: PARTICLE_CONFIG.error.lifetime,
      explosionForce: 2,
    });

    // Create shockwave ring
    this.createShockwave(pos, {
      color: EVENT_COLORS['error:captured'],
      maxRadius: 80,
      lifetime: 1000,
    });

    this.onEvent?.('error', event.data);
  }

  /**
   * Handle pattern detection - create cluster formation
   */
  handlePattern(event) {
    this.stats.patterns++;

    const patternId = event.data?.id || `pat_${Date.now()}`;
    const occurrences = event.data?.occurrences || 3;

    // Position for pattern cluster
    const angle = Math.random() * Math.PI * 2;
    const radius = 150 + Math.random() * 50;
    const pos = {
      x: Math.cos(angle) * radius,
      y: -80 - Math.random() * 40, // In the lower area
      z: Math.sin(angle) * radius,
    };

    // Create pattern cluster visualization
    const clusterSize = 10 + occurrences * 3;
    const geometry = new this.THREE.IcosahedronGeometry(clusterSize, 1);
    const mesh = new this.THREE.Mesh(geometry, this.patternClusterMaterial.clone());

    mesh.position.set(pos.x, pos.y, pos.z);
    mesh.userData = { type: 'pattern', patternId, createdAt: Date.now() };

    this.scene.add(mesh);
    this.patterns.set(patternId, mesh);

    // Remove after lifetime
    setTimeout(() => {
      this.scene.remove(mesh);
      this.patterns.delete(patternId);
    }, PARTICLE_CONFIG.pattern.lifetime);

    // Create formation particles spiraling into cluster
    this.createSpiralFormation(pos, {
      color: EVENT_COLORS['pattern:detected'],
      particleCount: occurrences * 5,
      lifetime: 2000,
    });

    this.onEvent?.('pattern', event.data);
  }

  /**
   * Handle lesson extraction - create golden ring effect
   */
  handleLesson(event) {
    this.stats.lessons++;

    // Lesson appears at top of the scene (wisdom rising)
    const pos = { x: 0, y: 100, z: 0 };

    // Create golden ring
    const ringGeometry = new this.THREE.TorusGeometry(40, 3, 16, 50);
    const ringMaterial = new this.THREE.MeshPhongMaterial({
      color: EVENT_COLORS['lesson:extracted'],
      emissive: EVENT_COLORS['lesson:extracted'],
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8,
    });

    const ring = new this.THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(pos.x, pos.y, pos.z);
    ring.rotation.x = Math.PI / 2;
    ring.userData = { type: 'lesson', createdAt: Date.now() };

    this.scene.add(ring);

    // Animate ring expanding and fading
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / PARTICLE_CONFIG.lesson.lifetime;

      if (progress < 1) {
        ring.scale.setScalar(1 + progress * 2);
        ring.material.opacity = 0.8 * (1 - progress);
        ring.position.y = pos.y + progress * 50;
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(ring);
      }
    };
    animate();

    // Create particle shower
    this.createParticleShower(pos, {
      color: EVENT_COLORS['lesson:extracted'],
      count: 40,
      lifetime: 3000,
    });

    this.onEvent?.('lesson', event.data);
  }

  /**
   * Handle judgment completion
   */
  handleJudgment(event) {
    const verdict = event.data?.verdict || 'TRANSFORM';
    const color = verdict === 'ACCEPT' ? 0x00ff88 :
                  verdict === 'REJECT' ? 0xff3333 : 0xffd700;

    // Create pulse from core
    this.createCorePulse({
      color,
      maxScale: 2,
      lifetime: 1500,
    });

    this.onEvent?.('judgment', event.data);
  }

  /**
   * Handle connected event
   */
  handleConnected(event) {
    console.log('[REALTIME-VIZ] Server confirmed connection:', event.data);

    // Create welcome effect
    this.createCorePulse({
      color: 0xd4a017,
      maxScale: 1.5,
      lifetime: 1000,
    });
  }

  /**
   * Handle heartbeat
   */
  handleHeartbeat(event) {
    // Subtle pulse on heartbeat
    if (this.coreMesh) {
      const scale = 1 + Math.sin(Date.now() / 1000) * 0.05;
      this.coreMesh.scale.setScalar(scale);
    }
  }

  // ==========================================================================
  // PARTICLE EFFECTS
  // ==========================================================================

  /**
   * Create particle trail from start to end
   */
  createParticleTrail(start, end, options) {
    const { color, size, lifetime, particleCount, speed } = options;

    for (let i = 0; i < particleCount; i++) {
      const delay = i * (lifetime / particleCount) * 0.3;

      setTimeout(() => {
        const geometry = new this.THREE.SphereGeometry(size, 8, 8);
        const material = new this.THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.8,
        });

        const particle = new this.THREE.Mesh(geometry, material);
        particle.position.set(start.x, start.y, start.z);

        this.scene.add(particle);
        this.particles.push(particle);

        // Animate to end
        const startTime = Date.now();
        const duration = lifetime * (0.5 + Math.random() * 0.5);

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(1, elapsed / duration);
          const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic

          particle.position.x = start.x + (end.x - start.x) * eased + (Math.random() - 0.5) * 10;
          particle.position.y = start.y + (end.y - start.y) * eased + (Math.random() - 0.5) * 10;
          particle.position.z = start.z + (end.z - start.z) * eased + (Math.random() - 0.5) * 10;
          particle.material.opacity = 0.8 * (1 - progress);
          particle.scale.setScalar(1 - progress * 0.5);

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            this.scene.remove(particle);
            const idx = this.particles.indexOf(particle);
            if (idx > -1) this.particles.splice(idx, 1);
          }
        };
        animate();
      }, delay);
    }
  }

  /**
   * Create explosion burst at position
   */
  createBurst(pos, options) {
    const { color, size, count, lifetime, explosionForce = 1 } = options;

    for (let i = 0; i < count; i++) {
      const geometry = new this.THREE.SphereGeometry(size * (0.5 + Math.random() * 0.5), 6, 6);
      const material = new this.THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
      });

      const particle = new this.THREE.Mesh(geometry, material);
      particle.position.set(pos.x, pos.y, pos.z);

      // Random velocity
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = (0.5 + Math.random()) * explosionForce;

      const velocity = {
        x: Math.sin(phi) * Math.cos(theta) * speed,
        y: Math.sin(phi) * Math.sin(theta) * speed,
        z: Math.cos(phi) * speed,
      };

      this.scene.add(particle);
      this.particles.push(particle);

      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / lifetime;

        if (progress < 1) {
          particle.position.x += velocity.x;
          particle.position.y += velocity.y + 0.02; // Slight upward drift
          particle.position.z += velocity.z;
          particle.material.opacity = 1 - progress;
          particle.scale.setScalar(1 - progress * 0.7);

          // Slow down
          velocity.x *= 0.98;
          velocity.y *= 0.98;
          velocity.z *= 0.98;

          requestAnimationFrame(animate);
        } else {
          this.scene.remove(particle);
          const idx = this.particles.indexOf(particle);
          if (idx > -1) this.particles.splice(idx, 1);
        }
      };
      animate();
    }
  }

  /**
   * Create expanding shockwave ring
   */
  createShockwave(pos, options) {
    const { color, maxRadius, lifetime } = options;

    const geometry = new this.THREE.RingGeometry(1, 2, 32);
    const material = new this.THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      side: this.THREE.DoubleSide,
    });

    const ring = new this.THREE.Mesh(geometry, material);
    ring.position.set(pos.x, pos.y, pos.z);
    ring.rotation.x = Math.PI / 2;

    this.scene.add(ring);

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / lifetime;

      if (progress < 1) {
        const scale = 1 + progress * maxRadius;
        ring.scale.setScalar(scale);
        ring.material.opacity = 0.8 * (1 - progress);
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(ring);
      }
    };
    animate();
  }

  /**
   * Create spiral particle formation
   */
  createSpiralFormation(center, options) {
    const { color, particleCount, lifetime } = options;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 4;
      const radius = 80 - (i / particleCount) * 60;
      const height = (i / particleCount) * 40;

      const startPos = {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + height,
        z: center.z + Math.sin(angle) * radius,
      };

      setTimeout(() => {
        this.createParticleTrail(startPos, center, {
          color,
          size: 2,
          lifetime: lifetime * 0.5,
          particleCount: 3,
          speed: 0.3,
        });
      }, i * 50);
    }
  }

  /**
   * Create particle shower from position
   */
  createParticleShower(pos, options) {
    const { color, count, lifetime } = options;

    for (let i = 0; i < count; i++) {
      const delay = Math.random() * 500;

      setTimeout(() => {
        const geometry = new this.THREE.SphereGeometry(2, 6, 6);
        const material = new this.THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.9,
        });

        const particle = new this.THREE.Mesh(geometry, material);
        const startX = pos.x + (Math.random() - 0.5) * 60;
        const startZ = pos.z + (Math.random() - 0.5) * 60;
        particle.position.set(startX, pos.y + 30, startZ);

        const velocityX = (Math.random() - 0.5) * 0.3;
        const velocityZ = (Math.random() - 0.5) * 0.3;

        this.scene.add(particle);

        const startTime = Date.now();
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = elapsed / lifetime;

          if (progress < 1) {
            particle.position.x += velocityX;
            particle.position.y -= 0.5; // Fall down
            particle.position.z += velocityZ;
            particle.material.opacity = 0.9 * (1 - progress);
            requestAnimationFrame(animate);
          } else {
            this.scene.remove(particle);
          }
        };
        animate();
      }, delay);
    }
  }

  /**
   * Create pulse from core
   */
  createCorePulse(options) {
    const { color, maxScale, lifetime } = options;

    const geometry = new this.THREE.SphereGeometry(35, 32, 32);
    const material = new this.THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.5,
      side: this.THREE.BackSide,
    });

    const pulse = new this.THREE.Mesh(geometry, material);
    pulse.position.set(0, 0, 0);

    this.scene.add(pulse);

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / lifetime;

      if (progress < 1) {
        const scale = 1 + progress * (maxScale - 1);
        pulse.scale.setScalar(scale);
        pulse.material.opacity = 0.5 * (1 - progress);
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(pulse);
      }
    };
    animate();
  }

  /**
   * Get current stats
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Update animation frame (call from main render loop)
   */
  update() {
    // Rotate pattern clusters
    for (const [id, mesh] of this.patterns) {
      mesh.rotation.y += 0.01;
      mesh.rotation.x += 0.005;
    }
  }

  /**
   * Cleanup
   */
  dispose() {
    this.disconnect();

    // Remove all particles
    for (const particle of this.particles) {
      this.scene.remove(particle);
    }
    this.particles = [];

    // Remove all patterns
    for (const [id, mesh] of this.patterns) {
      this.scene.remove(mesh);
    }
    this.patterns.clear();
  }
}

// Export for use in dashboard
if (typeof window !== 'undefined') {
  window.RealtimeViz = RealtimeViz;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RealtimeViz };
}
