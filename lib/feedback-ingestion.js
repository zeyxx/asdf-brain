/**
 * feedback-ingestion.js - Intelligent Feedback Interpretation
 *
 * Philosophy: Understand INTENT, not just words.
 * "Vague feedback contains deep insight - extract it."
 *
 * SECURITY: NO hardcoded operator data in source code.
 * All patterns are learned and stored in knowledge/private/
 *
 * This module:
 * - Accepts informal/vague feedback from operators
 * - Interprets intent using pattern matching and context
 * - Links to relevant repos, branches, files
 * - Transforms into actionable knowledge
 * - Learns operator communication patterns over time
 */

'use strict';

const fs = require('fs');
const path = require('path');

const KNOWLEDGE_ROOT = path.join(__dirname, '..', 'knowledge');
const PRIVATE_ROOT = path.join(__dirname, '..', '.private');  // gitignored
const FEEDBACK_LOG = path.join(PRIVATE_ROOT, 'operator-feedback.jsonl');
const PATTERNS_FILE = path.join(PRIVATE_ROOT, 'operator-patterns.json');

// =============================================================================
// PATTERN DETECTION - Generic, no hardcoded data
// =============================================================================

// Intent patterns - language-agnostic triggers
const INTENT_PATTERNS = [
  { regex: /bug|erreur|crash|fail|broken|cassé|marche\s*pas|doesn't?\s*work/i, intent: 'bug_report' },
  { regex: /fix|corriger|réparer|patch|résoudre|solve/i, intent: 'fix_request' },
  { regex: /feat|feature|nouvelle|ajouter|add|implement/i, intent: 'feature_request' },
  { regex: /merge|fusionner|pr\b|pull\s*request/i, intent: 'merge_request' },
  { regex: /deploy|push\s*(to)?\s*prod|release|ship/i, intent: 'deploy_request' },
  { regex: /review|check|regarde|voir|look\s*at/i, intent: 'review_request' },
  { regex: /\bok\b|bien|good|parfait|nice|approved?|lgtm/i, intent: 'approval' },
  { regex: /\bnon\b|\bno\b|pas\b|stop|wait|attends|hold/i, intent: 'rejection_or_hold' },
  { regex: /question|\?$|comment|pourquoi|why|how/i, intent: 'question' },
  { regex: /urgent|asap|critical|critique|maintenant|now|vite|immédiat/i, intent: 'priority_escalation' },
  { regex: /test|vérifie|verify|check\s*if/i, intent: 'test_request' }
];

// Context patterns - feature/domain detection
const CONTEXT_PATTERNS = [
  { regex: /token|tokens/i, context: 'token_discovery' },
  { regex: /webhook|helius/i, context: 'webhooks' },
  { regex: /node|nodes|distributed/i, context: 'distributed_nodes' },
  { regex: /score|k-?score|harmony|e-?score/i, context: 'scoring_system' },
  { regex: /socket|websocket|ws\b/i, context: 'websockets' },
  { regex: /api|endpoint|route/i, context: 'api' },
  { regex: /db|database|postgres|sql/i, context: 'database' },
  { regex: /redis|cache/i, context: 'cache' },
  { regex: /auth|security|key|secret/i, context: 'security' },
  { regex: /phi|φ|golden|ratio/i, context: 'philosophy' }
];

// Urgency patterns
const URGENCY_PATTERNS = {
  critical: /urgent|asap|critical|critique|maintenant|now|vite|immédiat|emergency/i,
  high: /faut|need|should|important|priority/i,
  low: /bientôt|soon|quand\s*tu\s*peux|when\s*you\s*can|later|eventually/i
};

// Sentiment patterns
const SENTIMENT_PATTERNS = {
  positive: /bien|good|ok|nice|parfait|super|génial|excellent|bravo|great|awesome/i,
  negative: /non|no\b|pas\b|mauvais|bad|wrong|erreur|problème|issue|broken/i,
  neutral: /peut-être|maybe|voir|check|regarde|depends/i
};

// =============================================================================
// FEEDBACK INTERPRETER CLASS
// =============================================================================

class FeedbackInterpreter {
  constructor() {
    this.operatorPatterns = this.loadLearnedPatterns();
    this.repoContext = this.loadRepoContext();
  }

  loadLearnedPatterns() {
    try {
      if (fs.existsSync(PATTERNS_FILE)) {
        return JSON.parse(fs.readFileSync(PATTERNS_FILE, 'utf-8'));
      }
    } catch (e) {
      // Start fresh
    }
    return {};
  }

  loadRepoContext() {
    const repoMapPath = path.join(KNOWLEDGE_ROOT, 'live', 'repo-map.json');
    try {
      return JSON.parse(fs.readFileSync(repoMapPath, 'utf-8'));
    } catch (e) {
      return null;
    }
  }

  /**
   * Main interpretation function
   * @param {string} feedback - Raw feedback text (possibly vague)
   * @param {string} operatorId - Anonymous/hashed operator identifier
   * @param {object} context - Additional context (current repo, branch, etc.)
   */
  interpret(feedback, operatorId = 'anonymous', context = {}) {
    const normalized = this.normalize(feedback);

    // Get learned patterns for this operator (if any)
    const learnedPatterns = this.operatorPatterns[operatorId] || {};

    // Extract components
    const intent = this.detectIntent(normalized, learnedPatterns);
    const targets = this.detectTargets(normalized, context);
    const sentiment = this.detectSentiment(normalized);
    const urgency = this.detectUrgency(normalized);
    const actionItems = this.extractActions(normalized, intent, targets);

    const interpretation = {
      normalized,
      operatorId,
      timestamp: new Date().toISOString(),
      interpretation: {
        intent,
        targets,
        sentiment,
        urgency,
        confidence: this.calculateConfidence(intent, targets)
      },
      actionItems,
      context
    };

    // Log for learning (in private directory)
    this.logFeedback(interpretation);

    return interpretation;
  }

  normalize(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/['']/g, "'");
  }

  detectIntent(text, learnedPatterns) {
    const intents = [];

    // Check learned phrases first (highest priority)
    if (learnedPatterns.phrases) {
      for (const [phrase, data] of Object.entries(learnedPatterns.phrases)) {
        if (text.includes(phrase)) {
          intents.push({
            type: data.intent,
            source: 'learned',
            match: phrase,
            severity: data.severity || 'medium'
          });
        }
      }
    }

    // Generic pattern detection
    for (const { regex, intent } of INTENT_PATTERNS) {
      if (regex.test(text)) {
        intents.push({
          type: intent,
          source: 'pattern',
          match: text.match(regex)?.[0]
        });
      }
    }

    // Deduplicate
    const seen = new Set();
    return intents.filter(i => {
      if (seen.has(i.type)) return false;
      seen.add(i.type);
      return true;
    });
  }

  detectTargets(text, context) {
    const targets = {
      repos: [],
      branches: [],
      features: []
    };

    // Repo detection (from repo-map if available)
    if (this.repoContext?.repos) {
      for (const repoName of Object.keys(this.repoContext.repos)) {
        if (text.includes(repoName.toLowerCase())) {
          targets.repos.push(repoName);
        }
      }
    }

    // Fallback patterns
    const repoPatterns = [
      { regex: /holdex/i, repo: 'holdex' },
      { regex: /gasdf/i, repo: 'gasdf' },
      { regex: /brain/i, repo: 'brain' }
    ];

    for (const { regex, repo } of repoPatterns) {
      if (regex.test(text) && !targets.repos.includes(repo)) {
        targets.repos.push(repo);
      }
    }

    // Use context if no repo detected
    if (targets.repos.length === 0 && context.currentRepo) {
      targets.repos.push(context.currentRepo);
    }

    // Branch detection from discovered repos
    if (this.repoContext?.repos) {
      for (const [repoName, repoData] of Object.entries(this.repoContext.repos)) {
        if (repoData.branchRoles) {
          for (const [branchKey, roleData] of Object.entries(repoData.branchRoles)) {
            if (text.includes(roleData.branch.toLowerCase())) {
              targets.branches.push(roleData.branch);
            }
          }
        }
      }
    }

    // Prod/dev keywords
    if (/prod|production/i.test(text)) {
      targets.branches.push('__infer_prod__');
    }
    if (/dev|development/i.test(text)) {
      targets.branches.push('__infer_dev__');
    }

    // Feature detection
    for (const { regex, context: feature } of CONTEXT_PATTERNS) {
      if (regex.test(text)) {
        targets.features.push(feature);
      }
    }

    return targets;
  }

  detectSentiment(text) {
    if (SENTIMENT_PATTERNS.positive.test(text)) return 'positive';
    if (SENTIMENT_PATTERNS.negative.test(text)) return 'negative';
    if (SENTIMENT_PATTERNS.neutral.test(text)) return 'neutral';
    return 'unknown';
  }

  detectUrgency(text) {
    if (URGENCY_PATTERNS.critical.test(text)) return 'critical';
    if (URGENCY_PATTERNS.high.test(text)) return 'high';
    if (URGENCY_PATTERNS.low.test(text)) return 'low';
    return 'normal';
  }

  extractActions(text, intents, targets) {
    const actions = [];

    for (const intent of intents) {
      const action = this.intentToAction(intent, targets);
      if (action) actions.push(action);
    }

    return actions;
  }

  intentToAction(intent, targets) {
    const actionMap = {
      bug_report: { type: 'investigate', description: 'Investigate reported issue' },
      fix_request: { type: 'fix', description: 'Fix identified issue' },
      merge_request: { type: 'merge', description: 'Merge changes' },
      deploy_request: { type: 'deploy', description: 'Deploy to production' },
      review_request: { type: 'review', description: 'Review code/changes' },
      priority_escalation: { type: 'escalate', description: 'Prioritize this item' },
      feature_request: { type: 'implement', description: 'Implement feature' },
      test_request: { type: 'test', description: 'Run tests/verification' }
    };

    const base = actionMap[intent.type];
    if (!base) return null;

    return {
      ...base,
      targets,
      priority: intent.severity === 'critical' ? 'critical' :
                intent.type === 'priority_escalation' ? 'critical' :
                intent.type === 'bug_report' ? 'high' : 'medium'
    };
  }

  calculateConfidence(intents, targets) {
    let score = 0;

    score += Math.min(intents.length * 20, 40);

    const learnedMatches = intents.filter(i => i.source === 'learned').length;
    score += learnedMatches * 15;

    if (targets.repos.length > 0) score += 15;
    if (targets.branches.length > 0) score += 15;
    if (targets.features.length > 0) score += 10;

    return Math.min(score, 100);
  }

  logFeedback(interpretation) {
    try {
      if (!fs.existsSync(PRIVATE_ROOT)) {
        fs.mkdirSync(PRIVATE_ROOT, { recursive: true });
      }
      fs.appendFileSync(FEEDBACK_LOG, JSON.stringify(interpretation) + '\n');
    } catch (e) {
      // Ignore logging errors
    }
  }

  /**
   * Learn a new phrase pattern from an operator
   */
  learn(operatorId, phrase, intent, severity = 'medium') {
    if (!this.operatorPatterns[operatorId]) {
      this.operatorPatterns[operatorId] = { phrases: {} };
    }

    this.operatorPatterns[operatorId].phrases[phrase.toLowerCase()] = {
      intent,
      severity,
      learnedAt: new Date().toISOString()
    };

    this.savePatterns();
  }

  savePatterns() {
    try {
      if (!fs.existsSync(PRIVATE_ROOT)) {
        fs.mkdirSync(PRIVATE_ROOT, { recursive: true });
      }
      fs.writeFileSync(PATTERNS_FILE, JSON.stringify(this.operatorPatterns, null, 2));
    } catch (e) {
      // Ignore
    }
  }
}

// =============================================================================
// FEEDBACK QUEUE
// =============================================================================

class FeedbackQueue {
  constructor() {
    this.interpreter = new FeedbackInterpreter();
    this.queue = [];
  }

  add(feedback, operatorId, context = {}) {
    const interpretation = this.interpreter.interpret(feedback, operatorId, context);
    this.queue.push(interpretation);
    return interpretation;
  }

  getActionItems() {
    return this.queue
      .flatMap(f => f.actionItems)
      .sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return order[a.priority] - order[b.priority];
      });
  }

  getSummary() {
    const intents = {};
    const repos = new Set();
    const features = new Set();

    for (const f of this.queue) {
      for (const intent of f.interpretation.intent) {
        intents[intent.type] = (intents[intent.type] || 0) + 1;
      }
      f.interpretation.targets.repos.forEach(r => repos.add(r));
      f.interpretation.targets.features.forEach(feat => features.add(feat));
    }

    return {
      total: this.queue.length,
      intents,
      repos: [...repos],
      features: [...features],
      actionItems: this.getActionItems()
    };
  }

  clear() {
    this.queue = [];
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  FeedbackInterpreter,
  FeedbackQueue
};

// =============================================================================
// CLI (no sensitive data exposed)
// =============================================================================

if (require.main === module) {
  const interpreter = new FeedbackInterpreter();

  // Test with generic examples only
  const tests = [
    "it doesn't work",
    "fix the bug urgent",
    "looks good, merge it",
    "deploy when ready",
    "the tokens are broken"
  ];

  console.log('Feedback Interpretation Engine\n');
  console.log('='.repeat(50));

  for (const text of tests) {
    const result = interpreter.interpret(text, 'test', { currentRepo: 'test-repo' });
    console.log(`\nInput: "${text}"`);
    console.log(`  Intents: ${result.interpretation.intent.map(i => i.type).join(', ') || '-'}`);
    console.log(`  Urgency: ${result.interpretation.urgency}`);
    console.log(`  Confidence: ${result.interpretation.confidence}%`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('Engine ready - patterns stored in .private/ (gitignored)');
}
