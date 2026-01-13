/**
 * Tests for lib/cynic/core/
 *
 * CYNIC Core - Main entry point for the CYNIC system
 */

import { describe, it, expect } from 'vitest';

const {
  CYNICCore,
  cynic,
  activation,
  cynicState,
  liveMatrix,
  registry,
  worldManager,
  STATES,
  init,
  wake,
  sleep,
  isActive,
  getStatus,
  getDimensions,
  getMatrix,
  getWorldEssences,
  checkAlignment,
  getStateSnapshot,
  on,
  once,
} = require('../../../lib/cynic/core');

describe('CYNIC Core', () => {
  describe('Exports', () => {
    it('should export CYNICCore class', () => {
      expect(CYNICCore).toBeDefined();
      expect(typeof CYNICCore).toBe('function');
    });

    it('should export cynic singleton', () => {
      expect(cynic).toBeDefined();
      expect(cynic).toBeInstanceOf(CYNICCore);
    });

    it('should export activation module', () => {
      expect(activation).toBeDefined();
    });

    it('should export cynicState', () => {
      expect(cynicState).toBeDefined();
    });

    it('should export liveMatrix', () => {
      expect(liveMatrix).toBeDefined();
    });

    it('should export registry', () => {
      expect(registry).toBeDefined();
    });

    it('should export worldManager', () => {
      expect(worldManager).toBeDefined();
    });
  });

  describe('STATES constants', () => {
    it('should have state constants', () => {
      expect(STATES).toBeDefined();
      expect(typeof STATES).toBe('object');
    });

    it('should have SLEEP state', () => {
      expect(STATES).toHaveProperty('SLEEP');
      expect(STATES.SLEEP).toBe('SLEEP');
    });

    it('should have AWAKE state', () => {
      expect(STATES).toHaveProperty('AWAKE');
      expect(STATES.AWAKE).toBe('AWAKE');
    });

    it('should have JUDGING state', () => {
      expect(STATES).toHaveProperty('JUDGING');
      expect(STATES.JUDGING).toBe('JUDGING');
    });

    it('should have LEARNING state', () => {
      expect(STATES).toHaveProperty('LEARNING');
      expect(STATES.LEARNING).toBe('LEARNING');
    });
  });

  describe('Lifecycle functions', () => {
    it('should have init function', () => {
      expect(typeof init).toBe('function');
    });

    it('should have wake function', () => {
      expect(typeof wake).toBe('function');
    });

    it('should have sleep function', () => {
      expect(typeof sleep).toBe('function');
    });

    it('should have isActive function', () => {
      expect(typeof isActive).toBe('function');
    });

    it('should have getStatus function', () => {
      expect(typeof getStatus).toBe('function');
    });
  });

  describe('Query functions', () => {
    it('should have getDimensions function', () => {
      expect(typeof getDimensions).toBe('function');
    });

    it('should have getMatrix function', () => {
      expect(typeof getMatrix).toBe('function');
    });

    it('should have getWorldEssences function', () => {
      expect(typeof getWorldEssences).toBe('function');
    });

    it('should have checkAlignment function', () => {
      expect(typeof checkAlignment).toBe('function');
    });

    it('should have getStateSnapshot function', () => {
      expect(typeof getStateSnapshot).toBe('function');
    });
  });

  describe('Event functions', () => {
    it('should have on function for event subscription', () => {
      expect(typeof on).toBe('function');
    });

    it('should have once function for one-time subscription', () => {
      expect(typeof once).toBe('function');
    });
  });

  describe('CYNICCore class', () => {
    it('should be instantiable', () => {
      const core = new CYNICCore();
      expect(core).toBeDefined();
    });

    it('should have init method', () => {
      const core = new CYNICCore();
      expect(typeof core.init).toBe('function');
    });

    it('should have wake method', () => {
      const core = new CYNICCore();
      expect(typeof core.wake).toBe('function');
    });

    it('should have sleep method', () => {
      const core = new CYNICCore();
      expect(typeof core.sleep).toBe('function');
    });

    it('should have isActive method', () => {
      const core = new CYNICCore();
      expect(typeof core.isActive).toBe('function');
    });

    it('should have getStatus method', () => {
      const core = new CYNICCore();
      expect(typeof core.getStatus).toBe('function');
    });
  });

  describe('isActive()', () => {
    it('should return boolean', () => {
      const result = isActive();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getStatus()', () => {
    it('should return status object', () => {
      const status = getStatus();
      expect(status).toBeDefined();
      expect(typeof status).toBe('object');
    });

    it('should include state', () => {
      const status = getStatus();
      expect(status).toHaveProperty('state');
    });
  });

  describe('getDimensions()', () => {
    it('should return dimensions object', () => {
      const dims = getDimensions();
      expect(dims).toBeDefined();
      expect(typeof dims).toBe('object');
    });
  });

  describe('getMatrix()', () => {
    it('should return matrix', () => {
      const matrix = getMatrix();
      expect(matrix).toBeDefined();
    });
  });

  describe('checkAlignment()', () => {
    it('should check alignment of action', () => {
      const action = { description: 'Test action' };
      const result = checkAlignment(action);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should return aligned status', () => {
      const action = { description: 'Test action' };
      const result = checkAlignment(action);
      expect(result).toHaveProperty('aligned');
    });
  });
});
