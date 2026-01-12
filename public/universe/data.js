/**
 * CYNIC Universe - Data Layer
 * "Don't trust, verify" - All data from real APIs
 */

const DataLayer = {
  // Cached data
  cache: {
    cynic: null,
    judgments: [],
    ecosystem: null,
    patterns: [],
    lastFetch: 0
  },

  // SSE connection
  eventSource: null,
  listeners: [],

  /**
   * Fetch all data from APIs
   */
  async fetchAll() {
    const results = await Promise.allSettled([
      this.fetchCynicStatus(),
      this.fetchJudgments(),
      this.fetchEcosystem(),
      this.fetchPatterns()
    ]);

    this.cache.lastFetch = Date.now();

    return {
      cynic: results[0].status === 'fulfilled' ? results[0].value : null,
      judgments: results[1].status === 'fulfilled' ? results[1].value : [],
      ecosystem: results[2].status === 'fulfilled' ? results[2].value : null,
      patterns: results[3].status === 'fulfilled' ? results[3].value : []
    };
  },

  /**
   * Fetch CYNIC status
   */
  async fetchCynicStatus() {
    try {
      const response = await fetch(CONFIG.API.CYNIC_STATUS);
      if (!response.ok) throw new Error('Failed to fetch CYNIC status');
      const data = await response.json();
      this.cache.cynic = data;
      return data;
    } catch (err) {
      console.warn('CYNIC status fetch failed:', err.message);
      return this.cache.cynic;
    }
  },

  /**
   * Fetch recent judgments
   */
  async fetchJudgments() {
    try {
      const response = await fetch(CONFIG.API.CYNIC_JUDGMENTS + '?limit=50');
      if (!response.ok) throw new Error('Failed to fetch judgments');
      const data = await response.json();
      this.cache.judgments = data.judgments || [];
      return this.cache.judgments;
    } catch (err) {
      console.warn('Judgments fetch failed:', err.message);
      return this.cache.judgments;
    }
  },

  /**
   * Fetch ecosystem health
   */
  async fetchEcosystem() {
    try {
      const response = await fetch(CONFIG.API.ECOSYSTEM);
      if (!response.ok) throw new Error('Failed to fetch ecosystem');
      const data = await response.json();
      this.cache.ecosystem = data;
      return data;
    } catch (err) {
      console.warn('Ecosystem fetch failed:', err.message);
      return this.cache.ecosystem;
    }
  },

  /**
   * Fetch patterns
   */
  async fetchPatterns() {
    try {
      const response = await fetch(CONFIG.API.PATTERNS);
      if (!response.ok) throw new Error('Failed to fetch patterns');
      const data = await response.json();
      this.cache.patterns = data.patterns || data || [];
      return this.cache.patterns;
    } catch (err) {
      console.warn('Patterns fetch failed:', err.message);
      return this.cache.patterns;
    }
  },

  /**
   * Connect to real-time SSE stream
   */
  connectSSE(onEvent) {
    if (this.eventSource) {
      this.eventSource.close();
    }

    try {
      this.eventSource = new EventSource(CONFIG.API.CYNIC_SSE);

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onEvent(data);
          this.listeners.forEach(fn => fn(data));
        } catch (e) {
          // Ignore parse errors for keepalive messages
        }
      };

      this.eventSource.onerror = () => {
        console.warn('SSE connection lost, will reconnect...');
      };

      return true;
    } catch (err) {
      console.warn('SSE connection failed:', err.message);
      return false;
    }
  },

  /**
   * Add real-time event listener
   */
  onRealtime(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(fn => fn !== callback);
    };
  },

  /**
   * Disconnect SSE
   */
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  },

  /**
   * Get dimension scores from CYNIC data
   */
  getDimensionScores() {
    const scores = {};

    // Initialize all dimensions with default
    Object.values(CONFIG.DIMENSIONS).flat().forEach(dim => {
      scores[dim] = 50; // Default
    });

    // Extract from CYNIC harmony matrix if available
    if (this.cache.cynic?.harmony?.matrix) {
      Object.entries(this.cache.cynic.harmony.matrix).forEach(([key, value]) => {
        const dimName = key.toUpperCase();
        if (scores.hasOwnProperty(dimName)) {
          scores[dimName] = typeof value === 'object' ? value.score : value;
        }
      });
    }

    // Extract from recent judgments
    if (this.cache.judgments?.length > 0) {
      const recentScores = {};
      this.cache.judgments.slice(0, 20).forEach(j => {
        if (j.scores) {
          Object.entries(j.scores).forEach(([dim, score]) => {
            const dimName = dim.toUpperCase();
            if (!recentScores[dimName]) recentScores[dimName] = [];
            recentScores[dimName].push(score);
          });
        }
      });

      // Average recent scores
      Object.entries(recentScores).forEach(([dim, vals]) => {
        if (vals.length > 0 && scores.hasOwnProperty(dim)) {
          scores[dim] = vals.reduce((a, b) => a + b, 0) / vals.length;
        }
      });
    }

    return scores;
  },

  /**
   * Get knowledge nodes for N-Score visualization
   */
  getKnowledgeNodes() {
    const nodes = [];

    // Convert patterns to nodes
    if (Array.isArray(this.cache.patterns)) {
      this.cache.patterns.forEach((p, i) => {
        nodes.push({
          id: `pattern_${i}`,
          type: 'pattern',
          label: p.name || p.pattern || `Pattern ${i}`,
          score: p.confidence || p.score || 50,
          category: p.category || 'unknown'
        });
      });
    }

    // Convert judgments to nodes
    if (Array.isArray(this.cache.judgments)) {
      this.cache.judgments.slice(0, 30).forEach((j, i) => {
        nodes.push({
          id: `judgment_${i}`,
          type: 'judgment',
          label: j.type || `Judgment ${i}`,
          score: j.global || j.score || 50,
          verdict: j.verdict?.action || 'UNKNOWN'
        });
      });
    }

    return nodes;
  },

  /**
   * Get ecosystem entities
   */
  getEcosystemEntities() {
    const entities = [
      { id: 'holdex', name: 'HolDex', type: 'service', color: CONFIG.COLORS.HOLDEX },
      { id: 'gasdf', name: 'GASdf', type: 'service', color: CONFIG.COLORS.GASDF },
      { id: 'brain', name: 'Brain', type: 'core', color: CONFIG.COLORS.BRAIN }
    ];

    // Add health status if available
    if (this.cache.ecosystem) {
      const health = this.cache.ecosystem.health || this.cache.ecosystem;
      entities.forEach(e => {
        e.status = health[e.id]?.status || 'unknown';
        e.score = health[e.id]?.score || 50;
      });
    }

    return entities;
  },

  /**
   * Get stats summary
   */
  getStats() {
    const judgments = this.cache.judgments || [];
    const burns = judgments.filter(j =>
      j.verdict?.action === 'BURN' || j.verdict?.action === 'REJECT'
    ).length;

    return {
      health: this.cache.ecosystem?.health || this.cache.cynic?.health || '--',
      nodes: (this.cache.patterns?.length || 0) + judgments.length,
      judgments: judgments.length,
      burns
    };
  }
};
