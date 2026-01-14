/**
 * CYNIC Core - Bridge to @asdf/cynic-core package
 *
 * This file re-exports the extracted core package for backward compatibility.
 * New code should import directly from @asdf/cynic-core when available.
 *
 * Usage:
 *   const { score, PHI, parseItem } = require('./core');
 *
 * @migration This bridge will be deprecated once pnpm workspace is fully set up
 */

'use strict';

// Re-export from the extracted package
module.exports = require('../../packages/core');
