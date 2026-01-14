/**
 * PROGRESS Dimension Evaluator
 *
 * World: ASSIAH (Action)
 * Axiom: BURN ("Don't extract, burn")
 * Category: PRIMARY
 *
 * Question: "Converge-t-il vers la singularité?"
 *
 * This evaluator checks:
 * - Progress toward goals
 * - Convergence toward singularity
 * - Measurable advancement
 * - Momentum and velocity
 */

'use strict';

const { DimensionEvaluator } = require('../base');

class ProgressEvaluator extends DimensionEvaluator {
  constructor() {
    super({
      name: 'PROGRESS',
      category: 'PRIMARY',
      world: 'ASSIAH',
      axiom: 'BURN',
      threshold: 50,
      question: 'Converge-t-il vers la singularité?',
    });
  }

  async evaluate(observation, context = {}) {
    const details = {};
    const scores = [];

    // 1. Measurable progress (30 points)
    const measurableScore = this._evaluateMeasurableProgress(observation);
    scores.push({ value: measurableScore.score, weight: 1.0 });
    details.measurable = measurableScore;

    // 2. Singularity convergence (30 points)
    const convergenceScore = this._evaluateConvergence(observation, context);
    scores.push({ value: convergenceScore.score, weight: 1.0 });
    details.convergence = convergenceScore;

    // 3. Momentum/velocity (20 points)
    const momentumScore = this._evaluateMomentum(observation, context);
    scores.push({ value: momentumScore.score, weight: 0.7 });
    details.momentum = momentumScore;

    // 4. Blockers analysis (20 points) - NEW: Sophisticated blocker detection
    const blockerScore = this._evaluateBlockers(observation, context);
    scores.push({ value: blockerScore.score, weight: 0.7 });
    details.blockers = blockerScore;

    const finalScore = this.weightedAverage(scores);
    const reasoning = this._buildReasoning(details, finalScore);

    return this.createResult(finalScore, reasoning, details);
  }

  _evaluateMeasurableProgress(obs) {
    let score = 50;
    const reasons = [];

    // Direct progress indicator
    if (obs.progress !== undefined) {
      const prog = typeof obs.progress === 'number' ? obs.progress : parseFloat(obs.progress) || 0;
      score = Math.max(0, Math.min(100, prog));
      reasons.push(`progress: ${score}%`);
    }

    // Completion percentage
    if (obs.completion !== undefined || obs.complete !== undefined) {
      const comp = obs.completion || obs.complete;
      const compVal = typeof comp === 'number' ? comp : (comp === true ? 100 : 0);
      score = Math.max(score, compVal);
      reasons.push(`completion: ${compVal}%`);
    }

    // Task completion
    if (obs.tasks) {
      const tasks = obs.tasks;
      if (tasks.completed !== undefined && tasks.total !== undefined) {
        const taskProgress = (tasks.completed / tasks.total) * 100;
        score = Math.max(score, taskProgress);
        reasons.push(`tasks: ${tasks.completed}/${tasks.total}`);
      }
    }

    // Milestones
    if (obs.milestones) {
      const milestones = obs.milestones;
      const achieved = milestones.filter(m => m.achieved || m.complete).length;
      const milestoneProgress = (achieved / milestones.length) * 100;
      score = Math.max(score, milestoneProgress);
      reasons.push(`milestones: ${achieved}/${milestones.length}`);
    }

    // Has metrics
    if (obs.metrics || obs.kpis) {
      score += 10;
      reasons.push('metrics defined');
    }

    // Version increase (progress indicator)
    if (obs.version) {
      const versionParts = String(obs.version).split('.');
      if (versionParts.length >= 2) {
        const major = parseInt(versionParts[0]) || 0;
        const minor = parseInt(versionParts[1]) || 0;
        if (major > 0 || minor > 0) {
          score += 10;
          reasons.push(`v${obs.version}`);
        }
      }
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateConvergence(obs, context) {
    let score = 50;
    const reasons = [];

    // Singularity distance from context
    if (context.singularityDistance !== undefined) {
      // Lower distance = better (more converged)
      score = Math.round((1 - context.singularityDistance) * 100);
      reasons.push(`singularity: ${((1 - context.singularityDistance) * 100).toFixed(1)}%`);
    }

    // Direct convergence indicator
    if (obs.convergence !== undefined) {
      const conv = typeof obs.convergence === 'number' ? obs.convergence : 50;
      score = Math.max(score, conv);
      reasons.push(`convergence: ${conv}%`);
    }

    // Alignment score
    if (obs.alignment !== undefined) {
      const align = typeof obs.alignment === 'number' ? obs.alignment : 50;
      score = Math.max(score, align * 0.8);
      reasons.push(`alignment: ${align}%`);
    }

    // Burn participation (core to singularity)
    if (obs.burned > 0 || obs.burnParticipation === true) {
      score += 20;
      reasons.push('burn participant 🔥');
    }

    // CYNIC judgment passed
    if (obs.cynicApproved === true || obs.verdict === 'ACCEPT') {
      score += 15;
      reasons.push('CYNIC approved');
    }

    // Divergence indicators
    if (obs.divergent === true || obs.offTrack === true) {
      score -= 25;
      reasons.push('divergent ⚠️');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  _evaluateMomentum(obs, context) {
    let score = 50;
    const reasons = [];

    // Velocity/rate indicators
    if (obs.velocity !== undefined) {
      const vel = typeof obs.velocity === 'number' ? obs.velocity : 50;
      score = Math.max(0, Math.min(100, vel));
      reasons.push(`velocity: ${vel}`);
    }

    // Trend direction
    if (obs.trend) {
      if (obs.trend === 'up' || obs.trend === 'increasing' || obs.trend > 0) {
        score += 20;
        reasons.push('trending up');
      } else if (obs.trend === 'down' || obs.trend === 'decreasing' || obs.trend < 0) {
        score -= 15;
        reasons.push('trending down');
      } else if (obs.trend === 'stable') {
        reasons.push('stable');
      }
    }

    // Activity level
    if (obs.activity || obs.activityLevel) {
      const activity = obs.activity || obs.activityLevel;
      if (activity === 'high' || activity > 0.7) {
        score += 15;
        reasons.push('high activity');
      } else if (activity === 'low' || activity < 0.3) {
        score -= 10;
        reasons.push('low activity');
      }
    }

    // Recent updates
    if (obs.lastUpdate || obs.updatedAt) {
      const lastUpdate = new Date(obs.lastUpdate || obs.updatedAt);
      const daysSince = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSince < 1) {
        score += 15;
        reasons.push('updated today');
      } else if (daysSince < 7) {
        score += 10;
        reasons.push('updated this week');
      } else if (daysSince > 30) {
        score -= 10;
        reasons.push('stale (>30 days)');
      }
    }

    // Previous result comparison
    if (context.previousResults && context.previousResults.length > 0) {
      const prevProgress = context.previousResults.find(r => r.dimension === 'PROGRESS');
      if (prevProgress) {
        const delta = score - prevProgress.score;
        if (delta > 5) {
          score += 10;
          reasons.push(`improving (+${delta.toFixed(0)})`);
        } else if (delta < -5) {
          score -= 10;
          reasons.push(`declining (${delta.toFixed(0)})`);
        }
      }
    }

    // Blocked/stalled (basic detection - detailed in _evaluateBlockers)
    if (obs.blocked === true || obs.stalled === true) {
      score -= 30;
      reasons.push('blocked/stalled ⚠️');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  /**
   * Evaluate blockers that impede progress
   * Higher score = fewer/less severe blockers
   */
  _evaluateBlockers(obs, ctx) {
    let score = 80; // Start optimistic
    const reasons = [];
    const blockers = [];

    // === Technical Blockers ===
    if (obs.technicalDebt === true || obs.techDebt > 0) {
      const severity = typeof obs.techDebt === 'number' ? Math.min(obs.techDebt, 50) : 15;
      score -= severity;
      blockers.push({ type: 'technical', severity, description: 'technical debt' });
      reasons.push('tech debt');
    }

    if (obs.dependencies?.blocked || obs.blockedDependencies) {
      score -= 20;
      blockers.push({ type: 'dependency', severity: 20, description: 'blocked dependencies' });
      reasons.push('dependency blocked');
    }

    if (obs.infrastructureIssues === true || obs.infraBlocked === true) {
      score -= 25;
      blockers.push({ type: 'infrastructure', severity: 25, description: 'infrastructure issues' });
      reasons.push('infra issues');
    }

    // === Resource Blockers ===
    if (obs.resourceConstrained === true || obs.underResourced === true) {
      score -= 15;
      blockers.push({ type: 'resource', severity: 15, description: 'resource constraints' });
      reasons.push('resource constrained');
    }

    if (obs.waitingForApproval === true || obs.pendingApproval === true) {
      score -= 10;
      blockers.push({ type: 'approval', severity: 10, description: 'waiting for approval' });
      reasons.push('pending approval');
    }

    if (obs.waitingForExternal === true || obs.externalDependency === true) {
      score -= 15;
      blockers.push({ type: 'external', severity: 15, description: 'external dependency' });
      reasons.push('external wait');
    }

    // === Knowledge Blockers ===
    if (obs.unknownUnknowns === true || obs.uncertainRequirements === true) {
      score -= 20;
      blockers.push({ type: 'knowledge', severity: 20, description: 'unknown unknowns' });
      reasons.push('uncertainty');
    }

    if (obs.missingDocumentation === true || obs.undocumented === true) {
      score -= 10;
      blockers.push({ type: 'documentation', severity: 10, description: 'missing docs' });
      reasons.push('undocumented');
    }

    // === Process Blockers ===
    if (obs.processBottleneck === true || obs.bottleneck === true) {
      score -= 20;
      blockers.push({ type: 'process', severity: 20, description: 'process bottleneck' });
      reasons.push('bottleneck');
    }

    if (obs.coordinationOverhead === true || obs.tooManyMeetings === true) {
      score -= 10;
      blockers.push({ type: 'coordination', severity: 10, description: 'coordination overhead' });
      reasons.push('coordination overhead');
    }

    // === Positive indicators (remove blockers) ===
    if (obs.blockersFree === true || obs.noBlockers === true) {
      score = 95;
      reasons.length = 0;
      blockers.length = 0;
      reasons.push('no blockers ✓');
    }

    if (obs.blockersResolved === true || obs.unblocked === true) {
      score += 15;
      reasons.push('blockers resolved');
    }

    if (obs.clearPath === true || obs.pathClear === true) {
      score += 10;
      reasons.push('clear path');
    }

    // Calculate blocker summary
    const totalSeverity = blockers.reduce((sum, b) => sum + b.severity, 0);
    const criticalBlockers = blockers.filter(b => b.severity >= 20);

    return {
      score: Math.max(0, Math.min(100, score)),
      reasons,
      blockers,
      summary: {
        count: blockers.length,
        totalSeverity,
        critical: criticalBlockers.length,
        types: [...new Set(blockers.map(b => b.type))],
      },
    };
  }

  _buildReasoning(details, finalScore) {
    const parts = [];

    if (finalScore >= this.threshold) {
      parts.push(`✅ PROGRESS (${finalScore.toFixed(1)} >= ${this.threshold})`);
    } else {
      parts.push(`❌ PROGRESS (${finalScore.toFixed(1)} < ${this.threshold})`);
    }

    // Highlight key aspects
    if (details.convergence?.score >= 70) {
      parts.push('converging');
    }
    if (details.momentum?.score >= 70) {
      parts.push('good momentum');
    }
    if (details.measurable?.score >= 70) {
      parts.push('measurable progress');
    }

    // Note blockers
    if (details.blockers?.summary) {
      const { count, critical } = details.blockers.summary;
      if (count === 0) {
        parts.push('no blockers');
      } else if (critical > 0) {
        parts.push(`${critical} critical blocker(s) ⚠️`);
      } else if (count > 0) {
        parts.push(`${count} blocker(s)`);
      }
    }

    // Note issues
    if (details.momentum?.score < 40) {
      parts.push('low momentum');
    }
    if (details.convergence?.score < 40) {
      parts.push('diverging');
    }

    return parts.join(' | ');
  }
}

module.exports = {
  ProgressEvaluator,
  evaluator: new ProgressEvaluator(),
};
