/**
 * Knowledge Layer - N-Score visualization
 * "K-Score for Knowledge: N = 100 × ∛(U × C × T)"
 */

const KnowledgeLayer = {
  nodes: [],
  connections: [],

  /**
   * Create knowledge graph visualization
   */
  create(layer, data) {
    const nodes = data || [];

    nodes.forEach((node, i) => {
      const mesh = this.createNode(node, i, nodes.length);
      this.nodes.push(mesh);
      layer.add(mesh);
    });

    // Create connections to singularity
    this.createConnections(layer);
  },

  /**
   * Create a single knowledge node
   */
  createNode(node, index, total) {
    // Position based on score - higher scores closer to singularity
    const score = node.score || 50;
    const radius = CONFIG.scoreToRadius(
      100 - score, // Invert: high score = close to center
      CONFIG.LAYOUT.KNOWLEDGE_RADIUS.MIN,
      CONFIG.LAYOUT.KNOWLEDGE_RADIUS.MAX
    );

    // Distribute in 3D spiral
    const phi = index * CONFIG.PHI * 2.4; // Golden angle
    const theta = (index / total) * Math.PI * 2;
    const y = (index / total - 0.5) * 10;

    const x = Math.cos(phi) * radius;
    const z = Math.sin(phi) * radius;

    // Color based on verdict
    let color;
    if (score >= CONFIG.THRESHOLDS.KEEP) {
      color = CONFIG.COLORS.KEEP;
    } else if (score >= CONFIG.THRESHOLDS.TRANSFORM) {
      color = CONFIG.COLORS.TRANSFORM;
    } else {
      color = CONFIG.COLORS.BURN;
    }

    // Size based on type
    const size = node.type === 'pattern' ? 0.6 : 0.4;

    const geometry = new THREE.SphereGeometry(size, 12, 12);
    const material = new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.8
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.userData = {
      type: 'knowledge',
      label: node.label || node.id,
      nodeType: node.type,
      score: score,
      verdict: node.verdict,
      originalData: node
    };

    return mesh;
  },

  /**
   * Create connections from nodes to singularity
   */
  createConnections(layer) {
    const material = new THREE.LineBasicMaterial({
      color: CONFIG.COLORS.GOLD,
      transparent: true,
      opacity: 0.08
    });

    this.nodes.forEach(node => {
      const points = [
        node.position.clone(),
        new THREE.Vector3(0, 0, 0)
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      this.connections.push(line);
      layer.add(line);
    });
  },

  /**
   * Update with new data
   */
  refresh(layer, data) {
    // Clear existing
    this.nodes.forEach(n => {
      layer.remove(n);
      n.geometry.dispose();
      n.material.dispose();
    });
    this.connections.forEach(c => {
      layer.remove(c);
      c.geometry.dispose();
      c.material.dispose();
    });
    this.nodes = [];
    this.connections = [];

    // Recreate
    this.create(layer, data);
  },

  /**
   * Update animation
   */
  update(time) {
    this.nodes.forEach((node, i) => {
      // Subtle floating motion
      const offset = i * 0.5;
      node.position.y += Math.sin(time + offset) * 0.002;
    });
  }
};
