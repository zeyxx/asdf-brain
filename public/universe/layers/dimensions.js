/**
 * Dimensions Layer - 24D visualization in 4 rings
 * PRIMARY(8) + SECONDARY(5) + META(3) + HUMAN_LLM(8)
 */

const DimensionsLayer = {
  rings: [],
  nodes: [],

  /**
   * Create dimension rings
   */
  create(layer, scores) {
    const dimensionScores = scores || {};

    CONFIG.LAYOUT.DIMENSION_RINGS.forEach((ringConfig, ringIndex) => {
      const ringGroup = new THREE.Group();
      ringGroup.userData = { name: ringConfig.name };

      // Get dimensions for this ring
      const dimensions = CONFIG.DIMENSIONS[ringConfig.name] || [];
      const color = CONFIG.COLORS[ringConfig.name] || CONFIG.COLORS.GOLD;

      // Create ring torus
      const torus = this.createRing(ringConfig.radius, color);
      torus.position.y = ringConfig.y;
      ringGroup.add(torus);

      // Create dimension nodes
      dimensions.forEach((dimName, i) => {
        const angle = (i / dimensions.length) * Math.PI * 2;
        const x = Math.cos(angle) * ringConfig.radius;
        const z = Math.sin(angle) * ringConfig.radius;

        const score = dimensionScores[dimName] || 50;
        const node = this.createDimensionNode(dimName, score, color, ringConfig.name);
        node.position.set(x, ringConfig.y, z);

        this.nodes.push(node);
        ringGroup.add(node);

        // Connection line to center
        this.createConnectionLine(ringGroup, node.position);
      });

      this.rings.push(ringGroup);
      layer.add(ringGroup);
    });
  },

  /**
   * Create a ring torus
   */
  createRing(radius, color) {
    const geometry = new THREE.TorusGeometry(radius, 0.15, 8, 64);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.25
    });
    const torus = new THREE.Mesh(geometry, material);
    torus.rotation.x = Math.PI / 2;
    return torus;
  },

  /**
   * Create a dimension node
   */
  createDimensionNode(name, score, ringColor, ringName) {
    // Color based on score (verdict)
    let nodeColor;
    if (score >= CONFIG.THRESHOLDS.KEEP) {
      nodeColor = CONFIG.COLORS.KEEP;
    } else if (score >= CONFIG.THRESHOLDS.TRANSFORM) {
      nodeColor = CONFIG.COLORS.TRANSFORM;
    } else {
      nodeColor = CONFIG.COLORS.BURN;
    }

    // Size based on score
    const size = 0.5 + (score / 100) * 0.5;

    const geometry = new THREE.SphereGeometry(size, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: nodeColor,
      emissive: ringColor,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.9
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = {
      type: 'dimension',
      name: name,
      ring: ringName,
      score: score
    };

    return mesh;
  },

  /**
   * Create connection line to center
   */
  createConnectionLine(parent, position) {
    const material = new THREE.LineBasicMaterial({
      color: CONFIG.COLORS.GOLD,
      transparent: true,
      opacity: 0.1
    });

    const points = [
      position.clone(),
      new THREE.Vector3(0, position.y * 0.3, 0)
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    parent.add(line);
  },

  /**
   * Update with new scores
   */
  refresh(layer, scores) {
    const dimensionScores = scores || {};

    this.nodes.forEach(node => {
      const name = node.userData.name;
      const score = dimensionScores[name] || 50;

      // Update color
      let color;
      if (score >= CONFIG.THRESHOLDS.KEEP) {
        color = CONFIG.COLORS.KEEP;
      } else if (score >= CONFIG.THRESHOLDS.TRANSFORM) {
        color = CONFIG.COLORS.TRANSFORM;
      } else {
        color = CONFIG.COLORS.BURN;
      }

      node.material.color.setHex(color);
      node.userData.score = score;

      // Update size
      const size = 0.5 + (score / 100) * 0.5;
      node.scale.set(size, size, size);
    });
  },

  /**
   * Update animation
   */
  update(time) {
    // Rings rotate at different φ-related speeds
    this.rings.forEach((ring, i) => {
      const speed = CONFIG.ANIMATION.ROTATION_SPEED * Math.pow(CONFIG.PHI_INV, i);
      ring.rotation.y += speed * (i % 2 === 0 ? 1 : -1);
    });

    // Nodes pulse subtly
    this.nodes.forEach((node, i) => {
      const pulse = 1 + Math.sin(time * 2 + i * 0.3) * 0.05;
      node.material.emissiveIntensity = 0.2 * pulse;
    });
  }
};
