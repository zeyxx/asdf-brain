/**
 * CYNIC Constants - φ-derived values
 * "All ratios derive from 1.618..."
 */

export const PHI = 1.618033988749895;
export const PHI_SQ = PHI * PHI;           // 2.618...
export const PHI_CUBE = PHI_SQ * PHI;      // 4.236...
export const PHI_INV = 1 / PHI;            // 0.618... (max confidence)
export const PHI_INV_SQ = PHI_INV * PHI_INV; // 0.382... (min doubt)

// Polling interval: φ⁻¹ × 10000 = 6180ms
export const POLL_INTERVAL = Math.round(PHI_INV * 10000);

// API endpoints
export const API_BASE = typeof window !== 'undefined' && window.location.port === '8888'
  ? ''
  : 'http://localhost:8888';

// Verdicts
export const VERDICTS = {
  TRUST: 'TRUST',
  TRANSFORM: 'TRANSFORM',
  REJECT: 'REJECT'
};

// Verdict thresholds
export const VERDICT_THRESHOLDS = {
  TRUST: 75,
  REJECT: 40
};

// Colors (hex values for Three.js)
export const COLORS = {
  PRIMARY: 0xffd700,
  SECONDARY: 0x00aaff,
  META: 0xaa00ff,
  HUMAN_LLM: 0x00ff88,
  DISCOVERY: 0xff3366,
  DISCOVERED: 0xff8c00,
  CORE: 0xd4a017,
  BACKGROUND: 0x050508,
  EDGE: 0x333333
};

// Layout configurations for 4 Mondes view
export const LAYOUT_4MONDES = {
  PRIMARY:    { radius: 120, y: 0, offset: 0 },
  SECONDARY:  { radius: 180, y: -60, offset: 0.3 },
  META:       { radius: 60, y: 120, offset: 0 },
  HUMAN_LLM:  { radius: 150, y: -130, offset: 0.2 },
  DISCOVERY:  { radius: 0, y: 180, offset: 0 },
  DISCOVERED: { radius: 90, y: 160, offset: Math.PI / 4 }
};

// Layout configurations for 5×5 view
export const LAYOUT_5x5 = {
  FOUNDATION:    { radius: 140, y: 80, offset: 0 },
  STRUCTURE:     { radius: 140, y: 40, offset: Math.PI / 5 },
  DYNAMICS:      { radius: 140, y: 0, offset: 2 * Math.PI / 5 },
  RELATIONSHIPS: { radius: 140, y: -40, offset: 3 * Math.PI / 5 },
  META_5x5:      { radius: 140, y: -80, offset: 4 * Math.PI / 5 }
};
