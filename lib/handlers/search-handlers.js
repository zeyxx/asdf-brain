/**
 * Search Handlers - brain_search
 *
 * [P] Pshat - Simple, direct data access
 */

'use strict';

const { fs, path, readline, INDEX_PATH, KNOWLEDGE_PATH, trackAccesses } = require('./_shared');

async function handleSearch(args, adapter) {
  const { query, limit = 10, lang } = args;

  // Search multiple sources: index + learned knowledge
  const searchPaths = [
    path.join(INDEX_PATH, 'cross-repo.jsonl'),
    path.join(KNOWLEDGE_PATH, 'learned/live.jsonl'),
    path.join(KNOWLEDGE_PATH, 'learned/transcripts.jsonl'),
  ].filter(p => fs.existsSync(p));

  if (searchPaths.length === 0) {
    return { results: [], message: 'No searchable data. Run: npm run brain:index' };
  }

  const results = [];
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/);

  for (const filePath of searchPaths) {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);

        // Language filter (if specified) - strict: only return entries with matching lang
        if (lang && entry.lang !== lang) continue;

        // Support multiple formats: conversations (user/assistant) AND learned (content)
        const text = [
          entry.user?.content || '',
          entry.assistant?.content || '',
          entry.content || '',
          entry.context || '',
          (entry.tags || []).join(' '),
        ].join(' ').toLowerCase();

        let score = 0;
        for (const term of queryTerms) {
          if (text.includes(term)) score++;
        }

        if (score > 0) {
          results.push({
            score,
            id: entry.id || entry.session_id,
            type: entry.type || 'conversation',
            project: entry.project,
            lang: entry.lang,
            timestamp: entry.timestamp,
            preview: (entry.content || entry.user?.content || '').slice(0, 200),
            source: path.basename(filePath),
          });
        }

        if (results.length >= limit * 10) break;
      } catch (e) {
        // Skip malformed lines
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  const topResults = results.slice(0, limit);

  // Track accesses for learned knowledge results (live.jsonl)
  // This feeds the N-Score Utilization (U) component
  const learnedIds = topResults
    .filter(r => r.source === 'live.jsonl' && r.id)
    .map(r => r.id);

  if (learnedIds.length > 0) {
    trackAccesses(learnedIds);
  }

  return {
    query,
    lang: lang || 'all',
    results: topResults,
    total: results.length,
    sources: searchPaths.map(p => path.basename(p)),
    tracked: learnedIds.length, // Number of accesses tracked
    _quality: results.length > 0 ? 80 : 30,
  };
}

module.exports = {
  handleSearch,
};
