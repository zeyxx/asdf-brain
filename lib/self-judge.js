/**
 * Self-Judge - Pluggable Evaluation Dimensions for CYNIC
 *
 * Provides modular evaluation dimensions that can be loaded/unloaded
 * based on context. Follows the hybrid approach:
 * - No dimensions loaded = simple evaluation (essence)
 * - Dimensions loaded = weighted φ-evaluation
 *
 * @module self-judge
 * @philosophy "Connais-toi toi-même" - Know thyself
 */

const temporal = require('./temporal');

const PHI = temporal.PHI;
const PHI_INV = temporal.PHI_INV;
const PHI_INV_2 = temporal.PHI_INV_2;

/**
 * φ-weighted geometric mean
 * @param {Object} scores - { dimension: score }
 * @param {Object} weights - { dimension: weight }
 * @returns {number} Weighted geometric mean
 */
function phiWeightedMean(scores, weights) {
  const dimensions = Object.keys(scores);
  if (dimensions.length === 0) return 0.5;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const dim of dimensions) {
    const score = scores[dim] || 0;
    const weight = weights[dim] || 1;

    // Avoid log(0)
    const safeScore = Math.max(score, 0.001);
    weightedSum += weight * Math.log(safeScore);
    totalWeight += weight;
  }

  if (totalWeight === 0) return 0.5;

  return Math.exp(weightedSum / totalWeight);
}

/**
 * Base Dimension class
 * All evaluation dimensions extend this
 */
class Dimension {
  constructor(name, weight = 1) {
    this.name = name;
    this.weight = weight;
  }

  /**
   * Evaluate an item on this dimension
   * @param {Object} item - Item to evaluate
   * @returns {Promise<{score: number, reasoning: string}>}
   */
  async evaluate(item) {
    throw new Error(`${this.name}.evaluate() not implemented`);
  }
}

/**
 * Truth Dimension - Does it align with known facts?
 */
class TruthDimension extends Dimension {
  constructor(weight = PHI) {
    super('truth', weight);
  }

  async evaluate(item) {
    let score = 0.5; // Default: uncertain
    const factors = [];

    // Check for verifiable source
    if (item.source && item.source !== 'unknown') {
      score += 0.15;
      factors.push('has_source');
    }

    // Check for citations/references in content
    if (item.content) {
      if (/\[\d+\]|https?:\/\/|source:|ref:/i.test(item.content)) {
        score += 0.1;
        factors.push('has_references');
      }

      // Check for hedging language (good - shows uncertainty awareness)
      if (/may|might|possibly|likely|suggest/i.test(item.content)) {
        score += 0.05;
        factors.push('acknowledges_uncertainty');
      }

      // Check for absolute claims (bad - overconfidence)
      if (/always|never|definitely|certainly|obviously/i.test(item.content)) {
        score -= 0.1;
        factors.push('absolute_claims');
      }
    }

    // Check metadata for verification flags
    if (item.metadata) {
      if (item.metadata.verified) {
        score += 0.2;
        factors.push('metadata_verified');
      }
      if (item.metadata.cross_referenced) {
        score += 0.1;
        factors.push('cross_referenced');
      }
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      reasoning: `truth(${factors.join(',')})`
    };
  }
}

/**
 * Relevance Dimension - Is it pertinent to the context?
 */
class RelevanceDimension extends Dimension {
  constructor(weight = PHI_INV) {
    super('relevance', weight);
    this.contextKeywords = [];
  }

  setContext(keywords) {
    this.contextKeywords = keywords || [];
  }

  async evaluate(item) {
    let score = 0.4; // Base relevance
    const factors = [];

    if (!item.content) {
      return { score: 0.3, reasoning: 'relevance(no_content)' };
    }

    const content = item.content.toLowerCase();

    // Check keyword matches
    if (this.contextKeywords.length > 0) {
      const matches = this.contextKeywords.filter(kw =>
        content.includes(kw.toLowerCase())
      );
      const matchRatio = matches.length / this.contextKeywords.length;
      score += matchRatio * 0.4;
      if (matches.length > 0) {
        factors.push(`keywords(${matches.length}/${this.contextKeywords.length})`);
      }
    }

    // Check for ecosystem-relevant terms
    const ecosystemTerms = ['holdex', 'gasdf', 'asdf', 'brain', 'phi', 'φ', 'burn', 'e-score'];
    const ecosystemMatches = ecosystemTerms.filter(term => content.includes(term));
    if (ecosystemMatches.length > 0) {
      score += 0.15;
      factors.push(`ecosystem(${ecosystemMatches.length})`);
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      reasoning: `relevance(${factors.join(',')})`
    };
  }
}

/**
 * Quality Dimension - Is it well-formed and coherent?
 */
class QualityDimension extends Dimension {
  constructor(weight = 1) {
    super('quality', weight);
  }

  async evaluate(item) {
    let score = 0.5;
    const factors = [];

    if (!item.content) {
      return { score: 0.2, reasoning: 'quality(no_content)' };
    }

    const content = item.content;

    // Length check (not too short, not too long)
    if (content.length >= 20 && content.length <= 5000) {
      score += 0.1;
      factors.push('good_length');
    } else if (content.length < 20) {
      score -= 0.2;
      factors.push('too_short');
    }

    // Structure check
    if (/[\.\?\!]\s+[A-Z]/.test(content)) {
      score += 0.1;
      factors.push('has_structure');
    }

    // Coherence - check for repeated words (bad sign)
    const words = content.toLowerCase().split(/\s+/);
    const uniqueRatio = new Set(words).size / words.length;
    if (uniqueRatio > 0.6) {
      score += 0.1;
      factors.push('diverse_vocabulary');
    }

    // Check for code/technical content (neutral to positive)
    if (/```|function|const|class|import/.test(content)) {
      score += 0.05;
      factors.push('has_code');
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      reasoning: `quality(${factors.join(',')})`
    };
  }
}

/**
 * Ethics Dimension - Does it align with ecosystem values?
 */
class EthicsDimension extends Dimension {
  constructor(weight = PHI_INV_2) {
    super('ethics', weight);
  }

  async evaluate(item) {
    let score = 0.7; // Start positive, look for red flags
    const factors = [];

    if (!item.content) {
      return { score: 0.5, reasoning: 'ethics(no_content)' };
    }

    const content = item.content.toLowerCase();

    // Red flags - extraction mindset
    const extractionTerms = ['exploit', 'maximize profit', 'extract value', 'pump', 'dump'];
    const extractionMatches = extractionTerms.filter(term => content.includes(term));
    if (extractionMatches.length > 0) {
      score -= 0.3;
      factors.push(`extraction_language(${extractionMatches.length})`);
    }

    // Green flags - contribution mindset
    const contributionTerms = ['contribute', 'build', 'improve', 'share', 'community', 'open source'];
    const contributionMatches = contributionTerms.filter(term => content.includes(term));
    if (contributionMatches.length > 0) {
      score += 0.15;
      factors.push(`contribution_language(${contributionMatches.length})`);
    }

    // Check for $asdfasdfa philosophy alignment
    if (/don.t trust.+verify|burn|phi|φ|decentraliz/i.test(content)) {
      score += 0.1;
      factors.push('philosophy_aligned');
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      reasoning: `ethics(${factors.join(',')})`
    };
  }
}

/**
 * SelfJudge - Pluggable evaluator for CYNIC
 *
 * Usage:
 *   const judge = new SelfJudge();
 *   judge.loadDimension('truth');
 *   judge.loadDimension('ethics');
 *   const cynic = new CYNIC({ evaluator: judge });
 */
class SelfJudge {
  constructor() {
    // Available dimension classes
    this.dimensionTypes = {
      truth: TruthDimension,
      relevance: RelevanceDimension,
      quality: QualityDimension,
      ethics: EthicsDimension
    };

    // Loaded dimensions
    this.dimensions = new Map();

    // Default φ weights
    this.weights = {
      truth: PHI,           // 1.618 - highest weight
      relevance: PHI_INV,   // 0.618
      quality: 1,           // 1.0
      ethics: PHI_INV_2     // 0.382
    };
  }

  /**
   * Load a dimension
   * @param {string} name - Dimension name
   * @param {number} [customWeight] - Optional custom weight
   */
  loadDimension(name, customWeight = null) {
    const DimensionClass = this.dimensionTypes[name];
    if (!DimensionClass) {
      throw new Error(`Unknown dimension: ${name}`);
    }

    const weight = customWeight !== null ? customWeight : this.weights[name];
    this.dimensions.set(name, new DimensionClass(weight));

    return this;
  }

  /**
   * Unload a dimension
   */
  unloadDimension(name) {
    this.dimensions.delete(name);
    return this;
  }

  /**
   * Load all dimensions
   */
  loadAll() {
    for (const name of Object.keys(this.dimensionTypes)) {
      this.loadDimension(name);
    }
    return this;
  }

  /**
   * Get loaded dimensions
   */
  getLoadedDimensions() {
    return Array.from(this.dimensions.keys());
  }

  /**
   * Set context for relevance dimension
   */
  setContext(keywords) {
    const relevance = this.dimensions.get('relevance');
    if (relevance) {
      relevance.setContext(keywords);
    }
    return this;
  }

  /**
   * Evaluate an item across all loaded dimensions
   * This is the method CYNIC calls
   *
   * @param {Object} item - Item to evaluate
   * @returns {Promise<{score: number, reasoning: string}>}
   */
  async evaluate(item) {
    // If no dimensions loaded, use simple evaluation
    if (this.dimensions.size === 0) {
      return this._simpleEvaluate(item);
    }

    // Evaluate on all dimensions
    const scores = {};
    const weights = {};
    const reasonings = [];

    for (const [name, dimension] of this.dimensions) {
      const result = await dimension.evaluate(item);
      scores[name] = result.score;
      weights[name] = dimension.weight;
      reasonings.push(result.reasoning);
    }

    // Calculate φ-weighted geometric mean
    const score = phiWeightedMean(scores, weights);

    return {
      score,
      reasoning: reasonings.join(' | '),
      _dimensions: scores,
      _weights: weights
    };
  }

  /**
   * Simple evaluation when no dimensions loaded (Option A)
   * @private
   */
  _simpleEvaluate(item) {
    const hasSource = item.source && item.source !== 'unknown' ? 0.8 : 0.3;
    const hasContent = item.content && item.content.length > 0 ? 0.7 : 0.2;
    const hasMetadata = Object.keys(item.metadata || {}).length > 0 ? 0.6 : 0.4;

    const score = (hasSource + hasContent + hasMetadata) / 3;

    return {
      score,
      reasoning: `simple(source:${hasSource.toFixed(1)},content:${hasContent.toFixed(1)},meta:${hasMetadata.toFixed(1)})`
    };
  }

  /**
   * Get configuration summary
   */
  getConfig() {
    return {
      loaded: this.getLoadedDimensions(),
      available: Object.keys(this.dimensionTypes),
      weights: Object.fromEntries(
        Array.from(this.dimensions).map(([name, dim]) => [name, dim.weight])
      ),
      mode: this.dimensions.size === 0 ? 'simple' : 'dimensional',
      _phi: {
        truth_weight: `φ (${PHI.toFixed(3)})`,
        relevance_weight: `φ⁻¹ (${PHI_INV.toFixed(3)})`,
        quality_weight: '1.0',
        ethics_weight: `φ⁻² (${PHI_INV_2.toFixed(3)})`
      }
    };
  }
}

/**
 * Create a configured SelfJudge instance
 * @param {string[]} dimensions - Dimensions to load
 * @returns {SelfJudge}
 */
function createSelfJudge(dimensions = []) {
  const judge = new SelfJudge();
  for (const dim of dimensions) {
    judge.loadDimension(dim);
  }
  return judge;
}

module.exports = {
  SelfJudge,
  createSelfJudge,
  phiWeightedMean,
  // Export dimension classes for extension
  Dimension,
  TruthDimension,
  RelevanceDimension,
  QualityDimension,
  EthicsDimension
};
