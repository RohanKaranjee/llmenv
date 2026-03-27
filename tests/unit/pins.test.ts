import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { addPin, listPins, getPin, removePin } from '../../src/core/pins.js';

describe('Pin Operations', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create isolated test directory
    testDir = await mkdtemp(join(tmpdir(), 'llmenv-test-'));
    process.env.LLMENV_HOME = testDir;
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
    delete process.env.LLMENV_HOME;
  });

  describe('addPin', () => {
    it('should generate UUID v4 and append to pins.json', async () => {
      const fact = 'Using Cloudflare R2 not S3';
      const pin = await addPin(fact);

      // Verify pin structure
      expect(pin.id).toBeDefined();
      expect(pin.fact).toBe(fact);
      expect(pin.createdAt).toBeDefined();

      // Verify UUID v4 format (8-4-4-4-12 hex digits)
      expect(pin.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

      // Verify ISO 8601 timestamp format
      expect(new Date(pin.createdAt).toISOString()).toBe(pin.createdAt);
    });

    it('should append multiple pins in order', async () => {
      const fact1 = 'First pin';
      const fact2 = 'Second pin';
      const fact3 = 'Third pin';

      const pin1 = await addPin(fact1);
      const pin2 = await addPin(fact2);
      const pin3 = await addPin(fact3);

      const pins = await listPins();
      expect(pins).toHaveLength(3);
      expect(pins[0].id).toBe(pin1.id);
      expect(pins[1].id).toBe(pin2.id);
      expect(pins[2].id).toBe(pin3.id);
    });

    it('should generate unique IDs for each pin', async () => {
      const pin1 = await addPin('Pin 1');
      const pin2 = await addPin('Pin 2');
      const pin3 = await addPin('Pin 3');

      expect(pin1.id).not.toBe(pin2.id);
      expect(pin2.id).not.toBe(pin3.id);
      expect(pin1.id).not.toBe(pin3.id);
    });
  });

  describe('listPins', () => {
    it('should return empty array when no pins exist', async () => {
      const pins = await listPins();
      expect(pins).toEqual([]);
    });

    it('should return all pins in chronological order (oldest first)', async () => {
      // Add pins with small delays to ensure different timestamps
      const pin1 = await addPin('First pin');
      await new Promise(resolve => setTimeout(resolve, 10));
      const pin2 = await addPin('Second pin');
      await new Promise(resolve => setTimeout(resolve, 10));
      const pin3 = await addPin('Third pin');

      const pins = await listPins();
      expect(pins).toHaveLength(3);
      
      // Verify chronological order (oldest first)
      expect(pins[0].id).toBe(pin1.id);
      expect(pins[1].id).toBe(pin2.id);
      expect(pins[2].id).toBe(pin3.id);
      
      // Verify timestamps are in ascending order
      expect(new Date(pins[0].createdAt).getTime()).toBeLessThanOrEqual(
        new Date(pins[1].createdAt).getTime()
      );
      expect(new Date(pins[1].createdAt).getTime()).toBeLessThanOrEqual(
        new Date(pins[2].createdAt).getTime()
      );
    });
  });

  describe('getPin', () => {
    it('should retrieve pin by ID', async () => {
      const fact = 'Test pin';
      const addedPin = await addPin(fact);

      const retrievedPin = await getPin(addedPin.id);
      expect(retrievedPin).not.toBeNull();
      expect(retrievedPin?.id).toBe(addedPin.id);
      expect(retrievedPin?.fact).toBe(fact);
      expect(retrievedPin?.createdAt).toBe(addedPin.createdAt);
    });

    it('should return null for non-existent ID', async () => {
      await addPin('Some pin');
      
      const nonExistentId = '00000000-0000-4000-8000-000000000000';
      const pin = await getPin(nonExistentId);
      expect(pin).toBeNull();
    });

    it('should retrieve correct pin when multiple pins exist', async () => {
      const pin1 = await addPin('Pin 1');
      const pin2 = await addPin('Pin 2');
      const pin3 = await addPin('Pin 3');

      const retrieved = await getPin(pin2.id);
      expect(retrieved?.id).toBe(pin2.id);
      expect(retrieved?.fact).toBe('Pin 2');
    });
  });

  describe('removePin', () => {
    it('should delete pin by ID and return true', async () => {
      const pin = await addPin('Pin to remove');
      
      const removed = await removePin(pin.id);
      expect(removed).toBe(true);

      // Verify pin is gone
      const pins = await listPins();
      expect(pins).toHaveLength(0);
    });

    it('should return false for non-existent ID', async () => {
      await addPin('Some pin');
      
      const nonExistentId = '00000000-0000-4000-8000-000000000000';
      const removed = await removePin(nonExistentId);
      expect(removed).toBe(false);
    });

    it('should preserve other pins when removing one', async () => {
      const pin1 = await addPin('Pin 1');
      const pin2 = await addPin('Pin 2');
      const pin3 = await addPin('Pin 3');

      // Remove middle pin
      const removed = await removePin(pin2.id);
      expect(removed).toBe(true);

      // Verify other pins remain
      const pins = await listPins();
      expect(pins).toHaveLength(2);
      expect(pins[0].id).toBe(pin1.id);
      expect(pins[1].id).toBe(pin3.id);
    });

    it('should handle removing all pins one by one', async () => {
      const pin1 = await addPin('Pin 1');
      const pin2 = await addPin('Pin 2');
      const pin3 = await addPin('Pin 3');

      await removePin(pin1.id);
      expect(await listPins()).toHaveLength(2);

      await removePin(pin2.id);
      expect(await listPins()).toHaveLength(1);

      await removePin(pin3.id);
      expect(await listPins()).toHaveLength(0);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete pin lifecycle', async () => {
      // Add pins
      const pin1 = await addPin('Using Cloudflare R2');
      const pin2 = await addPin('Supabase for auth');
      const pin3 = await addPin('No microservices');

      // List all
      let pins = await listPins();
      expect(pins).toHaveLength(3);

      // Get specific pin
      const retrieved = await getPin(pin2.id);
      expect(retrieved?.fact).toBe('Supabase for auth');

      // Remove one
      await removePin(pin1.id);
      pins = await listPins();
      expect(pins).toHaveLength(2);
      expect(pins.find(p => p.id === pin1.id)).toBeUndefined();

      // Add another
      const pin4 = await addPin('Monolith architecture');
      pins = await listPins();
      expect(pins).toHaveLength(3);
    });
  });
});
