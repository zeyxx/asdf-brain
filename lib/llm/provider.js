/**
 * LLM Provider Abstraction Layer
 *
 * "Ouvre la porte, construit pas les rails"
 *
 * Claude-first, future-ready.
 * L'interface permet d'ajouter d'autres providers sans toucher aux subagents.
 *
 * @philosophy Don't trust (single provider), verify (abstraction allows switching)
 */

'use strict';

// φ constants for token limits
const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;  // 0.618...

// =============================================================================
// PROVIDER REGISTRY
// =============================================================================

/**
 * Provider implementations
 * Claude only for now - la porte est ouverte pour les autres
 */
const providers = {
  claude: {
    name: 'Claude (Anthropic)',
    models: {
      haiku: 'claude-3-5-haiku-latest',
      sonnet: 'claude-sonnet-4-20250514',
      opus: 'claude-opus-4-20250514',
    },
    // Implementation sera dans invoke() via Claude Code natif
    // Pas besoin d'API client ici - on est DANS Claude
  },

  // ==========================================================================
  // FUTURES MAISONS (portes ouvertes, pas construites)
  // ==========================================================================

  // gemini: {
  //   name: 'Gemini (Google)',
  //   models: {
  //     flash: 'gemini-2.0-flash',
  //     pro: 'gemini-2.0-pro',
  //   },
  // },

  // ollama: {
  //   name: 'Ollama (Local)',
  //   models: {
  //     mistral: 'mistral:7b',
  //     llama: 'llama3:8b',
  //   },
  // },

  // openrouter: {
  //   name: 'OpenRouter (Multi)',
  //   models: {
  //     // Accès à tous via API unifiée
  //   },
  // },
};

// =============================================================================
// SUBAGENT ROUTING
// =============================================================================

/**
 * Routing table: subagent → provider + model
 *
 * Basé sur la Kabbale des 4 Mondes:
 * - ATZILUT (Émanation) → Opus (vision, découverte)
 * - BERIAH (Création) → Sonnet (jugement, apprentissage)
 * - YETZIRAH (Formation) → Sonnet (formatage, préparation)
 * - ASSIAH (Action) → Haiku (gate, score, shield, sync)
 */
const ROUTING = {
  // ASSIAH - Action (Haiku = rapide, économique)
  'CYNIC-GATE':   { provider: 'claude', model: 'haiku', world: 'ASSIAH' },
  'CYNIC-SCORE':  { provider: 'claude', model: 'haiku', world: 'ASSIAH' },
  'CYNIC-SHIELD': { provider: 'claude', model: 'haiku', world: 'ASSIAH' },
  'CYNIC-SYNC':   { provider: 'claude', model: 'haiku', world: 'ASSIAH' },

  // YETZIRAH - Formation (Sonnet = équilibré)
  'CYNIC-FORMAT':  { provider: 'claude', model: 'sonnet', world: 'YETZIRAH' },
  'CYNIC-PREPARE': { provider: 'claude', model: 'sonnet', world: 'YETZIRAH' },

  // BERIAH - Création (Sonnet = jugement)
  'CYNIC-JUDGE':   { provider: 'claude', model: 'sonnet', world: 'BERIAH' },
  'CYNIC-LEARN':   { provider: 'claude', model: 'sonnet', world: 'BERIAH' },
  'CYNIC-CLARIFY': { provider: 'claude', model: 'sonnet', world: 'BERIAH' },

  // ATZILUT - Émanation (Opus = profondeur)
  'CYNIC-VISION':   { provider: 'claude', model: 'opus', world: 'ATZILUT' },
  'CYNIC-DISCOVER': { provider: 'claude', model: 'opus', world: 'ATZILUT' },
};

// =============================================================================
// CORE INTERFACE
// =============================================================================

/**
 * Get routing info for a subagent
 *
 * @param {string} subagent - Subagent name (e.g., 'CYNIC-GATE')
 * @returns {Object} - { provider, model, world, modelId }
 */
function getRouting(subagent) {
  const route = ROUTING[subagent];
  if (!route) {
    throw new Error(`Unknown subagent: ${subagent}`);
  }

  const provider = providers[route.provider];
  if (!provider) {
    throw new Error(`Provider not implemented: ${route.provider}`);
  }

  return {
    provider: route.provider,
    model: route.model,
    world: route.world,
    modelId: provider.models[route.model],
    providerName: provider.name,
  };
}

/**
 * Check if a provider is available
 *
 * @param {string} providerName - Provider name
 * @returns {boolean}
 */
function isProviderAvailable(providerName) {
  return providerName in providers && !providerName.startsWith('//');
}

/**
 * List all available providers
 *
 * @returns {Array} - Array of provider info
 */
function listProviders() {
  return Object.entries(providers)
    .filter(([key]) => !key.startsWith('//'))
    .map(([key, value]) => ({
      id: key,
      name: value.name,
      models: Object.keys(value.models),
    }));
}

/**
 * List all subagents with their routing
 *
 * @returns {Array} - Array of subagent routing info
 */
function listSubagents() {
  return Object.entries(ROUTING).map(([name, route]) => ({
    name,
    ...getRouting(name),
  }));
}

/**
 * Get subagents by world (Kabbalistic layer)
 *
 * @param {string} world - ATZILUT, BERIAH, YETZIRAH, or ASSIAH
 * @returns {Array} - Subagents in that world
 */
function getSubagentsByWorld(world) {
  return Object.entries(ROUTING)
    .filter(([_, route]) => route.world === world)
    .map(([name]) => name);
}

// =============================================================================
// COST ESTIMATION (pour future optimisation)
// =============================================================================

/**
 * Relative cost multipliers (Claude baseline)
 * Permet de calculer le coût relatif d'une requête
 */
const COST_MULTIPLIERS = {
  claude: {
    haiku: 1,      // Baseline
    sonnet: 5,     // ~5x haiku
    opus: 25,      // ~25x haiku
  },
  // gemini: { flash: 0.5, pro: 3 },
  // ollama: { mistral: 0, llama: 0 },  // Local = free
};

/**
 * Estimate relative cost for a subagent call
 *
 * @param {string} subagent - Subagent name
 * @param {number} tokens - Estimated token count
 * @returns {number} - Relative cost units
 */
function estimateCost(subagent, tokens = 1000) {
  const route = getRouting(subagent);
  const multiplier = COST_MULTIPLIERS[route.provider]?.[route.model] || 1;
  return tokens * multiplier;
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Constants
  PHI,
  PHI_INV,
  ROUTING,

  // Core
  getRouting,
  isProviderAvailable,
  listProviders,
  listSubagents,
  getSubagentsByWorld,

  // Cost
  COST_MULTIPLIERS,
  estimateCost,

  // Raw access (pour extension)
  providers,
};
