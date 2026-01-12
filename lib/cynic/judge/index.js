/**
 * JUDGE - Module index
 *
 * Re-exports all judge components
 *
 * @module cynic/judge
 */

'use strict';

const matrix = require('./matrix-5x5');
const cache = require('./cache');
const evidence = require('./evidence');

module.exports = {
  // Matrix
  MATRIX_5x5: matrix.MATRIX_5x5,
  MODES: matrix.MODES,
  VERDICTS: matrix.VERDICTS,
  REVERSE_MAPPING: matrix.REVERSE_MAPPING,
  getVerdict: matrix.getVerdict,
  mapTo4Worlds: matrix.mapTo4Worlds,
  mapFrom4Worlds: matrix.mapFrom4Worlds,
  getMappingDoc: matrix.getMappingDoc,

  // Cache
  LRUCache: cache.LRUCache,
  judgmentCache: cache.judgmentCache,

  // Evidence
  EVIDENCE_PATH: evidence.EVIDENCE_PATH,
  createEmptyEvidence: evidence.createEmptyEvidence,
  loadEvidence: evidence.loadEvidence,
  saveEvidence: evidence.saveEvidence,
  recordEvidence: evidence.recordEvidence,
  computeReliability: evidence.computeReliability,
  generateEvidenceReport: evidence.generateEvidenceReport
};
