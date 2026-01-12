/**
 * Shared dependencies and utilities for handlers
 *
 * "Don't trust, verify" - Shared foundation for all handlers
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

// φ constants from temporal
const temporal = require('../temporal');
const { PHI, PHI_INV, PHI_INV_2, PHI_INV_3 } = temporal;
const PHI_SQ = PHI * PHI;

// Context detection
const { detectProject } = require('../context-layer');

// Language detection
const langDetect = require('../lang-detect');

// Contribution tracking
const burnMechanism = require('../burn-mechanism');

// Contributors
const contributors = require('../contributors');

// Base paths
const KNOWLEDGE_PATH = path.join(__dirname, '..', '..', 'knowledge');
const INDEX_PATH = path.join(__dirname, '..', '..', 'index');

module.exports = {
  // Node.js built-ins
  fs,
  path,
  crypto,
  readline,

  // φ constants
  PHI,
  PHI_INV,
  PHI_INV_2,
  PHI_INV_3,
  PHI_SQ,

  // Modules
  temporal,
  detectProject,
  langDetect,
  burnMechanism,
  contributors,

  // Paths
  KNOWLEDGE_PATH,
  INDEX_PATH,
};
