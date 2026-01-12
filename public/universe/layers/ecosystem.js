/**
 * Ecosystem Layer - HolDex, GASdf, Brain visualization
 * "Culture is a moat"
 */

const EcosystemLayer = {
  entities: [],
  orbits: [],

  /**
   * Create ecosystem visualization
   */
  create(layer, data) {
    const entities = data || [
      { id: 'holdex', name: 'HolDex', color: CONFIG.COLORS.HOLDEX },
      { id: 'gasdf', name: 'GASdf', color: CONFIG.COLORS.GASDF },
      { id: 'brain', name: 'Brain', color: CONFIG.COLORS.BRAIN }
    ];

    const radius = CONFIG.LAYOUT.ECOSYSTEM_RADIUS;

    entities.forEach((entity, i) => {
      const angle = (i / entities.length) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Create entity sphere
      const mesh = this.createEntity(entity);
      mesh.position.set(x, 0, z);
      this.entities.push(mesh);
      layer.add(mesh);

      // Create orbit ring
      const orbit = this.createOrbit(radius, entity.color);
      this.orbits.push(orbit);
      layer.add(orbit);
    });

    // Create inter-entity connections
    this.createConnections(layer);
  },

  /**
   * Create an ecosystem entity
   */
  createEntity(entity) {
    const geometry = new THREE.SphereGeometry(2.5, 24, 24);
    const material = new THREE.MeshPhongMaterial({
      color: entity.color,
      emissive: entity.color,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.9
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = {
      type: 'ecosystem',
      id: entity.id,
      name: entity.name,
      status: entity.status || 'active',
      score: entity.score || 50
    };

    // Add glow
    const glowGeometry = new THREE.SphereGeometry(3.5, 24, 24);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: entity.color,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    mesh.add(glow);

    return mesh;
  },

  /**
   * Create orbit ring
   */
  createOrbit(radius, color) {
    const geometry = new THREE.TorusGeometry(radius, 0.08, 8, 128);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.15
    });
    const torus = new THREE.Mesh(geometry, material);
    torus.rotation.x = Math.PI / 2;
    return torus;
  },

  /**
   * Create connections between entities
   */
  createConnections(layer) {
    if (this.entities.length < 2) return;

    const material = new THREE.LineBasicMaterial({
      color: CONFIG.COLORS.GOLD,
      transparent: true,
      opacity: 0.15
    });

    // Connect each entity to the next (forming triangle)
    for (let i = 0; i < this.entities.length; i++) {
      const next = (i + 1) % this.entities.length;
      const points = [
        this.entities[i].position.clone(),
        this.entities[next].position.clone()
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      layer.add(new THREE.Line(geometry, material));
    }

    // Connect all to center
    this.entities.forEach(entity => {
      const points = [
        entity.position.clone(),
        new THREE.Vector3(0, 0, 0)
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material.clone());
      line.material.opacity = 0.08;
      layer.add(line);
    });
  },

  /**
   * Update with new data
   */
  refresh(layer, data) {
    const entities = data || [];

    this.entities.forEach((mesh, i) => {
      const entity = entities.find(e => e.id === mesh.userData.id);
      if (entity) {
        mesh.userData.status = entity.status;
        mesh.userData.score = entity.score;

        // Update color intensity based on status
        const intensity = entity.status === 'healthy' ? 0.5 : 0.2;
        mesh.material.emissiveIntensity = intensity;
      }
    });
  },

  /**
   * Update animation
   */
  update(time) {
    // Entities orbit slowly
    this.entities.forEach((entity, i) => {
      const speed = 0.0005 * (i + 1);
      const angle = time * speed;

      // Subtle vertical oscillation
      entity.position.y = Math.sin(time * 0.5 + i) * 2;
    });

    // Pulse orbits
    this.orbits.forEach((orbit, i) => {
      const pulse = 0.15 + Math.sin(time + i) * 0.05;
      orbit.material.opacity = pulse;
    });
  }
};
