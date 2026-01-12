/**
 * CYNIC Universe - Main Entry Point
 * "φ guides all ratios"
 */

const Universe = {
  initialized: false,

  /**
   * Initialize the universe
   */
  async init() {
    console.log('CYNIC Universe initializing...');

    try {
      // Initialize 3D scene
      Scene.init();

      // Create singularity (always visible)
      SingularityLayer.create(Scene.getLayer('singularity'));

      // Fetch initial data
      const data = await DataLayer.fetchAll();

      // Create layers with data
      KnowledgeLayer.create(
        Scene.getLayer('knowledge'),
        DataLayer.getKnowledgeNodes()
      );

      DimensionsLayer.create(
        Scene.getLayer('dimensions'),
        DataLayer.getDimensionScores()
      );

      EcosystemLayer.create(
        Scene.getLayer('ecosystem'),
        DataLayer.getEcosystemEntities()
      );

      ActivityLayer.create(Scene.getLayer('activity'));

      // Update stats display
      this.updateStats();

      // Setup UI controls
      this.setupControls();

      // Connect real-time events
      this.connectRealtime();

      // Start animation loop
      Scene.startAnimation((time) => this.onUpdate(time));

      // Hide loading
      document.getElementById('loading').classList.add('hidden');

      // Schedule periodic refresh
      setInterval(() => this.refresh(), CONFIG.REFRESH_INTERVAL);

      this.initialized = true;
      console.log('CYNIC Universe ready. φ = ' + CONFIG.PHI.toFixed(6));

    } catch (err) {
      console.error('Universe initialization failed:', err);
      document.getElementById('loading').querySelector('p').textContent =
        'Failed to load: ' + err.message;
    }
  },

  /**
   * Animation update callback
   */
  onUpdate(time) {
    SingularityLayer.update(time);
    KnowledgeLayer.update(time);
    DimensionsLayer.update(time);
    EcosystemLayer.update(time);
    ActivityLayer.update(time, Scene.getLayer('activity'));
  },

  /**
   * Refresh data from APIs
   */
  async refresh() {
    console.log('Refreshing universe data...');

    await DataLayer.fetchAll();

    // Update layers
    KnowledgeLayer.refresh(
      Scene.getLayer('knowledge'),
      DataLayer.getKnowledgeNodes()
    );

    DimensionsLayer.refresh(
      Scene.getLayer('dimensions'),
      DataLayer.getDimensionScores()
    );

    EcosystemLayer.refresh(
      Scene.getLayer('ecosystem'),
      DataLayer.getEcosystemEntities()
    );

    this.updateStats();
  },

  /**
   * Update stats panel
   */
  updateStats() {
    const stats = DataLayer.getStats();

    document.getElementById('stat-health').textContent =
      typeof stats.health === 'number' ? stats.health + '/100' : stats.health;
    document.getElementById('stat-nodes').textContent = stats.nodes;
    document.getElementById('stat-judgments').textContent = stats.judgments;
    document.getElementById('stat-burns').textContent = stats.burns;
  },

  /**
   * Setup UI controls
   */
  setupControls() {
    // Buttons
    document.getElementById('btn-reset').addEventListener('click', () => {
      Scene.resetView();
    });

    document.getElementById('btn-rotate').addEventListener('click', () => {
      const rotating = Scene.toggleRotation();
      document.getElementById('btn-rotate').textContent =
        rotating ? 'Stop Rotation' : 'Start Rotation';
    });

    document.getElementById('btn-refresh').addEventListener('click', () => {
      this.refresh();
    });

    // Layer toggles
    ['singularity', 'knowledge', 'dimensions', 'ecosystem', 'activity'].forEach(layerName => {
      const checkbox = document.getElementById('layer-' + layerName);
      if (checkbox) {
        checkbox.addEventListener('change', (e) => {
          Scene.setLayerVisible(layerName, e.target.checked);
        });
      }
    });
  },

  /**
   * Connect to real-time event stream
   */
  connectRealtime() {
    DataLayer.connectSSE((event) => {
      // Process activity events
      ActivityLayer.processEvent(event, Scene.getLayer('activity'));

      // Update stats on significant events
      if (event.type === 'judgment' || event.type === 'burn') {
        this.updateStats();
      }
    });
  }
};

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', () => Universe.init());
