/**
 * Store Handlers - brain_store_*
 *
 * [S] Sod - PostgreSQL persistence ("φ qui persiste")
 */

'use strict';

// CYNIC Store will be injected
let cynicStore = null;

function setCynicStore(store) {
  cynicStore = store;
}

async function handleStoreStatus(args, adapter) {
  if (!cynicStore) {
    return {
      status: 'not_initialized',
      mode: 'none',
      message: 'Store not initialized. Set CYNIC_DATABASE_URL to enable PostgreSQL.',
      _quality: 40,
    };
  }

  try {
    const health = await cynicStore.health();

    return {
      status: 'ok',
      mode: health.mode,
      connected: health.healthy,
      tables: health.tables,
      message: `Store is ${health.healthy ? 'healthy' : 'unhealthy'} in ${health.mode} mode`,
      philosophy: "Don't trust, verify - persistence is memory's guarantee.",
      _quality: health.healthy ? 85 : 50,
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      _quality: 20,
    };
  }
}

async function handleStoreJudgments(args, adapter) {
  if (!cynicStore) {
    return { error: 'Store not initialized', _quality: 20 };
  }

  try {
    const { limit = 50, verdict = null, since = null } = args;

    const judgments = await cynicStore.listJudgments({ limit, verdict, since });

    return {
      count: judgments.length,
      judgments,
      mode: cynicStore.memoryMode ? 'memory' : 'postgres',
      message: `Retrieved ${judgments.length} judgments from store`,
      _quality: 80,
    };
  } catch (error) {
    return { error: error.message, judgments: [], _quality: 20 };
  }
}

async function handleStoreHarmony(args, adapter) {
  if (!cynicStore) {
    return { error: 'Store not initialized', _quality: 20 };
  }

  try {
    const harmony = await cynicStore.getHarmony();

    if (!harmony) {
      return {
        found: false,
        message: 'No harmony matrix stored yet',
        _quality: 50,
      };
    }

    return {
      found: true,
      harmony,
      mode: cynicStore.memoryMode ? 'memory' : 'postgres',
      philosophy: 'Harmony emerges from balanced dimensions.',
      _quality: 85,
    };
  } catch (error) {
    return { error: error.message, _quality: 20 };
  }
}

async function handleStoreBurns(args, adapter) {
  if (!cynicStore) {
    return { error: 'Store not initialized', _quality: 20 };
  }

  try {
    const { token = null } = args;

    const burns = await cynicStore.getBurns({ token });

    return {
      burns,
      token: token || 'all',
      mode: cynicStore.memoryMode ? 'memory' : 'postgres',
      philosophy: "Don't extract, burn.",
      _quality: 85,
    };
  } catch (error) {
    return { error: error.message, burns: {}, _quality: 20 };
  }
}

async function handleStoreOperators(args, adapter) {
  if (!cynicStore) {
    return { error: 'Store not initialized', _quality: 20 };
  }

  try {
    const { hash } = args;
    if (!hash) {
      return { error: 'Operator hash required', _quality: 30 };
    }

    const operator = await cynicStore.getOperator(hash);

    if (!operator) {
      return {
        found: false,
        hash,
        message: 'Operator not found in store',
        _quality: 50,
      };
    }

    return {
      found: true,
      operator: {
        hash: operator.hash,
        trust_score: operator.trust_score,
        total_judgments: operator.total_judgments,
        correct_judgments: operator.correct_judgments,
        accuracy: operator.total_judgments > 0
          ? (operator.correct_judgments / operator.total_judgments * 100).toFixed(1) + '%'
          : 'N/A',
        last_seen: operator.last_seen,
      },
      mode: cynicStore.memoryMode ? 'memory' : 'postgres',
      philosophy: "Don't trust, verify.",
      _quality: 85,
    };
  } catch (error) {
    return { error: error.message, _quality: 20 };
  }
}

module.exports = {
  handleStoreStatus,
  handleStoreJudgments,
  handleStoreHarmony,
  handleStoreBurns,
  handleStoreOperators,
  setCynicStore,
};
