/**
 * Learn Handlers - brain_learn, brain_ingest
 *
 * [D] Drash - Active learning and knowledge recording
 *
 * Philosophy: "Knowledge is FREE. Contributions are VALUED."
 */

'use strict';

const {
  crypto,
  detectProject,
  langDetect,
  burnMechanism,
  contributors,
} = require('./_shared');

// CYNIC instance will be injected
let cynicJudge = null;

function setCynicJudge(judge) {
  cynicJudge = judge;
}

async function handleLearn(args, adapter) {
  const { type, content, context, tags = [], contributor_id, session_id, skip_cynic = false } = args;

  // Auto-detect project from content + context
  const textForDetection = `${content} ${context || ''}`;
  const detectedProject = detectProject(textForDetection);

  // Auto-detect language (φ-thresholds: 61.8% dominant, 38.2% mixed)
  const langResult = langDetect.detectLanguage(textForDetection);

  // CYNIC judgment on incoming knowledge (unless skipped)
  let cynicJudgment = null;
  if (!skip_cynic && cynicJudge) {
    try {
      const itemToJudge = {
        content,
        source: context ? true : false,
        anonymous: !contributor_id || contributor_id === 'claude-session',
        enablesHuman: true,
        contributesBurn: type === 'pattern' || type === 'decision',
      };

      cynicJudgment = await cynicJudge.judge(itemToJudge, {
        singularityDistance: 0.4,
      });
    } catch (e) {
      cynicJudgment = { error: e.message, global: 50, verdict: { action: 'TRANSFORM' } };
    }
  }

  // Create entry with provenance, project tagging, language, and CYNIC score
  const entry = {
    id: crypto.randomBytes(8).toString('hex'),
    type,
    content,
    context: context || 'session',
    project: detectedProject,
    lang: langResult.lang,
    tags: [...tags, detectedProject, `lang:${langResult.lang}`],
    timestamp: new Date().toISOString(),
    hash: crypto.createHash('sha256').update(content).digest('hex').slice(0, 16),
    contributor: contributor_id || 'claude-session',
    strength: 50,
    access_count: 0,
    created_at: Date.now(),
    cynic_score: cynicJudgment?.global || null,
    cynic_verdict: cynicJudgment?.verdict?.action || null,
    cynic_judgment_id: cynicJudgment?._judgmentId || null,
  };

  // Track contribution (NOT a fee - knowledge is FREE to access)
  const contributionTracking = burnMechanism.trackOperation(
    type === 'pattern' ? 'pattern_create' : 'decision_record',
    session_id || 'unknown',
    { project: detectedProject, contributor_id }
  );

  // Update contributor E-Score (BUILD dimension)
  if (contributor_id) {
    try {
      contributors.recordContribution(contributor_id, 'BUILD', {
        item_id: entry.id,
        item_type: type,
        project: detectedProject,
      });
    } catch (e) {
      // Silent fail - contributor tracking is optional
    }
  }

  // Write to learned.jsonl (append mode)
  const result = await adapter.write('learned/live.jsonl', entry, { append: true });

  if (!result.success) {
    return { success: false, error: result.error, _quality: 0 };
  }

  return {
    success: true,
    id: entry.id,
    type: entry.type,
    project: detectedProject,
    hash: entry.hash,
    contribution: {
      tracked: true,
      value: contributionTracking?.amount || 0,
      contributor_id: contributor_id || null,
      e_score_dimension: 'BUILD',
    },
    cynic: cynicJudgment ? {
      score: cynicJudgment.global,
      verdict: cynicJudgment.verdict?.action,
      confidence: cynicJudgment.confidence,
      doubt: cynicJudgment.doubt,
      judgment_id: cynicJudgment._judgmentId,
      needs_review: cynicJudgment.verdict?.action === 'TRANSFORM',
    } : null,
    message: `Learned: ${type} recorded for project ${detectedProject}`,
    _philosophy: 'Knowledge is FREE. Contributions are VALUED.',
    _quality: cynicJudgment?.global || 85,
  };
}

async function handleIngest(args, adapter) {
  const { source, entries, skip_cynic = false } = args;

  if (!entries || entries.length === 0) {
    return { success: false, error: 'No entries to ingest', _quality: 0 };
  }

  const results = [];
  const projectCounts = {};
  const langCounts = {};
  const cynicStats = { total: 0, accepted: 0, transform: 0, avgScore: 0 };
  const ingestPath = `ingested/${source}.jsonl`;

  for (const entry of entries) {
    const textForDetection = entry.content || JSON.stringify(entry);
    const detectedProject = detectProject(textForDetection);
    const langResult = langDetect.detectLanguage(textForDetection);

    projectCounts[detectedProject] = (projectCounts[detectedProject] || 0) + 1;
    langCounts[langResult.lang] = (langCounts[langResult.lang] || 0) + 1;

    let cynicJudgment = null;
    if (!skip_cynic && cynicJudge) {
      try {
        const itemToJudge = {
          content: entry.content || JSON.stringify(entry),
          source: source ? true : false,
          anonymous: true,
        };
        cynicJudgment = await cynicJudge.judge(itemToJudge, { singularityDistance: 0.5 });
        cynicStats.total++;
        cynicStats.avgScore += cynicJudgment.global;
        if (cynicJudgment.verdict?.action === 'ACCEPT') {
          cynicStats.accepted++;
        } else {
          cynicStats.transform++;
        }
      } catch (e) {
        // CYNIC failure is non-blocking
      }
    }

    const enriched = {
      ...entry,
      id: crypto.randomBytes(8).toString('hex'),
      source,
      project: detectedProject,
      lang: langResult.lang,
      ingested_at: new Date().toISOString(),
      hash: crypto.createHash('sha256').update(JSON.stringify(entry)).digest('hex').slice(0, 16),
      cynic_score: cynicJudgment?.global || null,
      cynic_verdict: cynicJudgment?.verdict?.action || null,
    };

    const result = await adapter.write(ingestPath, enriched, { append: true });
    results.push({
      id: enriched.id,
      project: detectedProject,
      lang: langResult.lang,
      cynic_score: cynicJudgment?.global || null,
      success: result.success,
    });
  }

  const successful = results.filter(r => r.success).length;

  if (cynicStats.total > 0) {
    cynicStats.avgScore = Math.round(cynicStats.avgScore / cynicStats.total);
  }

  return {
    success: successful > 0,
    source,
    total: entries.length,
    ingested: successful,
    failed: entries.length - successful,
    by_project: projectCounts,
    by_language: langCounts,
    cynic: skip_cynic ? null : {
      judged: cynicStats.total,
      accepted: cynicStats.accepted,
      needs_review: cynicStats.transform,
      avg_score: cynicStats.avgScore,
    },
    _quality: cynicStats.avgScore || (successful > 0 ? 80 : 0),
  };
}

module.exports = {
  handleLearn,
  handleIngest,
  setCynicJudge,
};
