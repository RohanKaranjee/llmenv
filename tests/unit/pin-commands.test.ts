import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pinCommand, pinsCommand, unpinCommand } from '../../src/commands/pin.js';
import * as pinsCore from '../../src/core/pins.js';
import * as formatters from '../../src/utils/formatters.js';
import { ValidationError } from '../../src/types/errors.js';
import type { Pin } from '../../src/types/index.js';

// Mock dependencies
vi.mock('../../src/core/pins.js');
vi.mock('../../src/utils/formatters.js');

describe('Pin Commands', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('pinCommand', () => {
    it('should add a pin and display confirmation', async () => {
      const mockPin: Pin = {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        fact: 'Using Cloudflare R2',
        createdAt: '2024-03-15T10:00:00.000Z'
      };

      vi.mocked(pinsCore.addPin).mockResolvedValue(mockPin);

      await pinCommand('Using Cloudflare R2');

      expect(pinsCore.addPin).toHaveBeenCalledWith('Using Cloudflare R2');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('a1b2c3d4')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Using Cloudflare R2')
      );
    });

    it('should trim whitespace from fact text', async () => {
      const mockPin: Pin = {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        fact: 'Test fact',
        createdAt: '2024-03-15T10:00:00.000Z'
      };

      vi.mocked(pinsCore.addPin).mockResolvedValue(mockPin);

      await pinCommand('  Test fact  ');

      expect(pinsCore.addPin).toHaveBeenCalledWith('Test fact');
    });

    it('should throw ValidationError for empty fact', async () => {
      await expect(pinCommand('')).rejects.toThrow(ValidationError);
      await expect(pinCommand('   ')).rejects.toThrow(ValidationError);
    });

    it('should display first 8 characters of pin ID', async () => {
      const mockPin: Pin = {
        id: 'abcdefgh-1234-5678-90ab-cdef12345678',
        fact: 'Test fact',
        createdAt: '2024-03-15T10:00:00.000Z'
      };

      vi.mocked(pinsCore.addPin).mockResolvedValue(mockPin);

      await pinCommand('Test fact');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('abcdefgh')
      );
    });
  });

  describe('pinsCommand', () => {
    it('should display formatted pin list', async () => {
      const mockPins: Pin[] = [
        {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          fact: 'Using Cloudflare R2',
          createdAt: '2024-03-15T10:00:00.000Z'
        },
        {
          id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
          fact: 'Supabase for auth',
          createdAt: '2024-03-15T11:00:00.000Z'
        }
      ];

      vi.mocked(pinsCore.listPins).mockResolvedValue(mockPins);
      vi.mocked(formatters.formatPinList).mockReturnValue('Formatted pin list');

      await pinsCommand();

      expect(pinsCore.listPins).toHaveBeenCalled();
      expect(formatters.formatPinList).toHaveBeenCalledWith(mockPins);
      expect(consoleLogSpy).toHaveBeenCalledWith('Formatted pin list');
    });

    it('should handle empty pin list', async () => {
      vi.mocked(pinsCore.listPins).mockResolvedValue([]);
      vi.mocked(formatters.formatPinList).mockReturnValue('No pins created yet');

      await pinsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith('No pins created yet');
    });
  });

  describe('unpinCommand', () => {
    it('should remove pin by full ID', async () => {
      const mockPins: Pin[] = [
        {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          fact: 'Using Cloudflare R2',
          createdAt: '2024-03-15T10:00:00.000Z'
        }
      ];

      vi.mocked(pinsCore.listPins).mockResolvedValue(mockPins);
      vi.mocked(pinsCore.removePin).mockResolvedValue(true);

      await unpinCommand('a1b2c3d4-e5f6-7890-abcd-ef1234567890');

      expect(pinsCore.removePin).toHaveBeenCalledWith(
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Pin removed')
      );
    });

    it('should remove pin by short ID (first 8 chars)', async () => {
      const mockPins: Pin[] = [
        {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          fact: 'Using Cloudflare R2',
          createdAt: '2024-03-15T10:00:00.000Z'
        }
      ];

      vi.mocked(pinsCore.listPins).mockResolvedValue(mockPins);
      vi.mocked(pinsCore.removePin).mockResolvedValue(true);

      await unpinCommand('a1b2c3d4');

      expect(pinsCore.removePin).toHaveBeenCalledWith(
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Pin removed')
      );
    });

    it('should display error when pin not found', async () => {
      vi.mocked(pinsCore.listPins).mockResolvedValue([]);

      await unpinCommand('nonexistent');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Pin not found')
      );
    });

    it('should display pin fact when removing', async () => {
      const mockPins: Pin[] = [
        {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          fact: 'Using Cloudflare R2',
          createdAt: '2024-03-15T10:00:00.000Z'
        }
      ];

      vi.mocked(pinsCore.listPins).mockResolvedValue(mockPins);
      vi.mocked(pinsCore.removePin).mockResolvedValue(true);

      await unpinCommand('a1b2c3d4');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Using Cloudflare R2')
      );
    });

    it('should handle removePin returning false', async () => {
      const mockPins: Pin[] = [
        {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          fact: 'Using Cloudflare R2',
          createdAt: '2024-03-15T10:00:00.000Z'
        }
      ];

      vi.mocked(pinsCore.listPins).mockResolvedValue(mockPins);
      vi.mocked(pinsCore.removePin).mockResolvedValue(false);

      await unpinCommand('a1b2c3d4');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Pin not found')
      );
    });
  });
});
