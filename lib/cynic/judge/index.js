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
  ARCHIVE_PATH: evidence.ARCHIVE_PATH,
  MAX_VALIDATIONS: evidence.MAX_VALIDATIONS,
  MAX_DIMENSION_ENTRIES: evidence.MAX_DIMENSION_ENTRIES,
  ARCHIVE_RETENTION: evidence.ARCHIVE_RETENTION,
  createEmptyEvidence: evidence.createEmptyEvidence,
  loadEvidence: evidence.loadEvidence,
  saveEvidence: evidence.saveEvidence,
  recordEvidence: evidence.recordEvidence,
  needsRotation: evidence.needsRotation,
  rotateEvidence: evidence.rotateEvidence,
  pruneDimensions: evidence.pruneDimensions,
  loadArchive: evidence.loadArchive,
  getArchiveSummary: evidence.getArchiveSummary,
  computeReliability: evidence.computeReliability,
  generateEvidenceReport: evidence.generateEvidenceReport
};
