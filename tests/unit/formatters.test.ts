import { describe, it, expect } from 'vitest';
import {
  formatProjectList,
  formatPinList,
  formatHistory
} from '../../src/utils/formatters.js';
import type { ProjectEntry, Pin, HistoryEntry } from '../../src/types/index.js';

describe('formatProjectList', () => {
  it('should format empty project list', () => {
    const result = formatProjectList([]);
    expect(result).toContain('No projects registered yet');
  });

  it('should format single project', () => {
    const projects: ProjectEntry[] = [
      {
        name: 'Test Project',
        path: '/home/user/test-project',
        lastActive: new Date('2024-01-15T10:00:00Z').toISOString(),
        config: {
          project: 'Test Project',
          stack: ['TypeScript'],
          avoid: [],
          context: 'Test context',
          priorities: ['Speed']
        }
      }
    ];

    const result = formatProjectList(projects);
    
    expect(result).toContain('Registered Projects');
    expect(result).toContain('Test Project');
    expect(result).toContain('/home/user/test-project');
    expect(result).toContain('Name');
    expect(result).toContain('Path');
    expect(result).toContain('Last Active');
  });

  it('should format multiple projects', () => {
    const projects: ProjectEntry[] = [
      {
        name: 'Project A',
        path: '/home/user/project-a',
        lastActive: new Date('2024-01-15T10:00:00Z').toISOString(),
        config: {
          project: 'Project A',
          stack: ['TypeScript'],
          avoid: [],
          context: 'Context A',
          priorities: ['Speed']
        }
      },
      {
        name: 'Project B',
        path: '/home/user/project-b',
        lastActive: new Date('2024-01-14T10:00:00Z').toISOString(),
        config: {
          project: 'Project B',
          stack: ['Python'],
          avoid: [],
          context: 'Context B',
          priorities: ['Quality']
        }
      }
    ];

    const result = formatProjectList(projects);
    
    expect(result).toContain('Project A');
    expect(result).toContain('Project B');
    expect(result).toContain('/home/user/project-a');
    expect(result).toContain('/home/user/project-b');
  });

  it('should display relative time for last active', () => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    
    const projects: ProjectEntry[] = [
      {
        name: 'Recent Project',
        path: '/home/user/recent',
        lastActive: twoHoursAgo.toISOString(),
        config: {
          project: 'Recent Project',
          stack: ['TypeScript'],
          avoid: [],
          context: 'Test',
          priorities: []
        }
      }
    ];

    const result = formatProjectList(projects);
    expect(result).toContain('hours ago');
  });
});

describe('formatPinList', () => {
  it('should format empty pin list', () => {
    const result = formatPinList([]);
    expect(result).toContain('No pins created yet');
  });

  it('should format single pin', () => {
    const pins: Pin[] = [
      {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        fact: 'Using Cloudflare R2 not S3',
        createdAt: new Date('2024-01-15T10:00:00Z').toISOString()
      }
    ];

    const result = formatPinList(pins);
    
    expect(result).toContain('Pinned Facts');
    expect(result).toContain('Using Cloudflare R2 not S3');
    expect(result).toContain('[a1b2c3d4]'); // First 8 chars of ID
    expect(result).toContain('Created:');
    expect(result).toContain('2024-01-15');
  });

  it('should format multiple pins with numbering', () => {
    const pins: Pin[] = [
      {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        fact: 'First pin',
        createdAt: new Date('2024-01-15T10:00:00Z').toISOString()
      },
      {
        id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        fact: 'Second pin',
        createdAt: new Date('2024-01-15T11:00:00Z').toISOString()
      },
      {
        id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        fact: 'Third pin',
        createdAt: new Date('2024-01-15T12:00:00Z').toISOString()
      }
    ];

    const result = formatPinList(pins);
    
    expect(result).toContain('1.');
    expect(result).toContain('2.');
    expect(result).toContain('3.');
    expect(result).toContain('First pin');
    expect(result).toContain('Second pin');
    expect(result).toContain('Third pin');
    expect(result).toContain('[a1b2c3d4]');
    expect(result).toContain('[b2c3d4e5]');
    expect(result).toContain('[c3d4e5f6]');
  });

  it('should display short ID (first 8 characters)', () => {
    const pins: Pin[] = [
      {
        id: '12345678-1234-1234-1234-123456789012',
        fact: 'Test fact',
        createdAt: new Date().toISOString()
      }
    ];

    const result = formatPinList(pins);
    expect(result).toContain('[12345678]');
    expect(result).not.toContain('12345678-1234-1234-1234-123456789012');
  });
});

describe('formatHistory', () => {
  it('should format empty history', () => {
    const result = formatHistory([]);
    expect(result).toContain('No decision history for this project');
  });

  it('should format single history entry', () => {
    const history: HistoryEntry[] = [
      {
        timestamp: new Date('2024-01-15T10:00:00Z').toISOString(),
        prompt: 'How do I implement authentication?',
        response: 'You can use JWT tokens for authentication...',
        provider: 'claude'
      }
    ];

    const result = formatHistory(history);
    
    expect(result).toContain('Decision History');
    expect(result).toContain('How do I implement authentication?');
    expect(result).toContain('You can use JWT tokens');
    expect(result).toContain('[claude]');
    expect(result).toContain('Prompt:');
    expect(result).toContain('Response:');
    expect(result).toContain('2024-01-15');
  });

  it('should format multiple history entries', () => {
    const history: HistoryEntry[] = [
      {
        timestamp: new Date('2024-01-15T10:00:00Z').toISOString(),
        prompt: 'First question',
        response: 'First answer',
        provider: 'openai'
      },
      {
        timestamp: new Date('2024-01-14T10:00:00Z').toISOString(),
        prompt: 'Second question',
        response: 'Second answer',
        provider: 'claude'
      }
    ];

    const result = formatHistory(history);
    
    expect(result).toContain('First question');
    expect(result).toContain('Second question');
    expect(result).toContain('[openai]');
    expect(result).toContain('[claude]');
  });

  it('should truncate long responses', () => {
    const longResponse = 'A'.repeat(300);
    
    const history: HistoryEntry[] = [
      {
        timestamp: new Date().toISOString(),
        prompt: 'Test prompt',
        response: longResponse,
        provider: 'claude'
      }
    ];

    const result = formatHistory(history);
    
    // Should be truncated to 200 chars + '...'
    expect(result).toContain('...');
    expect(result.length).toBeLessThan(longResponse.length + 100);
  });

  it('should not truncate short responses', () => {
    const shortResponse = 'This is a short response';
    
    const history: HistoryEntry[] = [
      {
        timestamp: new Date().toISOString(),
        prompt: 'Test prompt',
        response: shortResponse,
        provider: 'openai'
      }
    ];

    const result = formatHistory(history);
    
    expect(result).toContain(shortResponse);
    expect(result).not.toContain('...');
  });

  it('should show provider for each entry', () => {
    const history: HistoryEntry[] = [
      {
        timestamp: new Date().toISOString(),
        prompt: 'OpenAI question',
        response: 'OpenAI answer',
        provider: 'openai'
      },
      {
        timestamp: new Date().toISOString(),
        prompt: 'Claude question',
        response: 'Claude answer',
        provider: 'claude'
      }
    ];

    const result = formatHistory(history);
    
    expect(result).toContain('[openai]');
    expect(result).toContain('[claude]');
  });
});

describe('relative time formatting', () => {
  it('should format "just now" for very recent timestamps', () => {
    const now = new Date();
    const projects: ProjectEntry[] = [
      {
        name: 'Test',
        path: '/test',
        lastActive: now.toISOString(),
        config: {
          project: 'Test',
          stack: [],
          avoid: [],
          context: '',
          priorities: []
        }
      }
    ];

    const result = formatProjectList(projects);
    expect(result).toContain('just now');
  });

  it('should format minutes ago', () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    const projects: ProjectEntry[] = [
      {
        name: 'Test',
        path: '/test',
        lastActive: fiveMinutesAgo.toISOString(),
        config: {
          project: 'Test',
          stack: [],
          avoid: [],
          context: '',
          priorities: []
        }
      }
    ];

    const result = formatProjectList(projects);
    expect(result).toContain('minutes ago');
  });

  it('should format days ago', () => {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    const projects: ProjectEntry[] = [
      {
        name: 'Test',
        path: '/test',
        lastActive: threeDaysAgo.toISOString(),
        config: {
          project: 'Test',
          stack: [],
          avoid: [],
          context: '',
          priorities: []
        }
      }
    ];

    const result = formatProjectList(projects);
    expect(result).toContain('days ago');
  });
});

describe('date-time formatting', () => {
  it('should format date-time in readable format', () => {
    const pins: Pin[] = [
      {
        id: 'test-id',
        fact: 'Test fact',
        createdAt: new Date('2024-03-15T14:30:45Z').toISOString()
      }
    ];

    const result = formatPinList(pins);
    
    // Should contain formatted date (time may vary by timezone)
    expect(result).toContain('2024-03-15');
    expect(result).toMatch(/\d{2}:\d{2}:\d{2}/); // Should have time format HH:MM:SS
  });
});
