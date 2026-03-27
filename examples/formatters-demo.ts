/**
 * Demo script to showcase the output formatters
 * Run with: npx tsx examples/formatters-demo.ts
 */

import {
  formatProjectList,
  formatPinList,
  formatHistory
} from '../src/utils/formatters.js';
import type { ProjectEntry, Pin, HistoryEntry } from '../src/types/index.js';

console.log('='.repeat(60));
console.log('OUTPUT FORMATTERS DEMO');
console.log('='.repeat(60));

// Demo 1: Project List
console.log('\n\n--- DEMO 1: Project List Formatter ---\n');

const projects: ProjectEntry[] = [
  {
    name: 'AI Content Studio',
    path: '/Users/john/projects/ai-content-studio',
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    config: {
      project: 'AI Content Studio',
      stack: ['Python', 'FastAPI', 'Supabase'],
      avoid: ['AWS'],
      context: 'Bootstrapped SaaS',
      priorities: ['Ship fast']
    }
  },
  {
    name: 'llmenv',
    path: '/Users/john/projects/llmenv',
    lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    config: {
      project: 'llmenv',
      stack: ['TypeScript', 'Node.js'],
      avoid: [],
      context: 'Open source CLI tool',
      priorities: ['Developer experience']
    }
  },
  {
    name: 'client-app',
    path: '/Users/john/projects/client-app',
    lastActive: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    config: {
      project: 'client-app',
      stack: ['React', 'TypeScript'],
      avoid: [],
      context: 'Client project',
      priorities: ['Quality']
    }
  }
];

console.log(formatProjectList(projects));

// Demo 2: Empty Project List
console.log('\n\n--- DEMO 2: Empty Project List ---\n');
console.log(formatProjectList([]));

// Demo 3: Pin List
console.log('\n\n--- DEMO 3: Pin List Formatter ---\n');

const pins: Pin[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    fact: 'Using Cloudflare R2 not S3',
    createdAt: new Date('2024-03-10T09:00:00.000Z').toISOString()
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    fact: 'Supabase for auth + DB + storage',
    createdAt: new Date('2024-03-10T09:01:00.000Z').toISOString()
  },
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    fact: 'No microservices, monolith for now',
    createdAt: new Date('2024-03-10T09:02:00.000Z').toISOString()
  }
];

console.log(formatPinList(pins));

// Demo 4: Empty Pin List
console.log('\n\n--- DEMO 4: Empty Pin List ---\n');
console.log(formatPinList([]));

// Demo 5: History
console.log('\n\n--- DEMO 5: History Formatter ---\n');

const history: HistoryEntry[] = [
  {
    timestamp: new Date('2024-03-15T14:30:00.000Z').toISOString(),
    prompt: 'How do I queue video uploads?',
    response:
      'For your FastAPI + Redis setup, I recommend using Celery with Redis as the broker. Here\'s how to implement it:\n\n1. Install Celery: pip install celery[redis]\n2. Create a Celery app (celery_app.py)...',
    provider: 'claude'
  },
  {
    timestamp: new Date('2024-03-14T16:45:00.000Z').toISOString(),
    prompt: 'Best way to handle video thumbnails?',
    response:
      'Since you\'re using Cloudflare R2, you can leverage Cloudflare Images for automatic thumbnail generation. This is cost-effective and integrates seamlessly with R2.',
    provider: 'claude'
  },
  {
    timestamp: new Date('2024-03-13T10:20:00.000Z').toISOString(),
    prompt: 'Should I use Redis or PostgreSQL for caching?',
    response:
      'For your use case with FastAPI and Supabase, I recommend Redis for caching. It\'s faster for read-heavy operations and you\'re already using it. Keep PostgreSQL (via Supabase) for persistent data.',
    provider: 'openai'
  }
];

console.log(formatHistory(history));

// Demo 6: Empty History
console.log('\n\n--- DEMO 6: Empty History ---\n');
console.log(formatHistory([]));

// Demo 7: Long Response Truncation
console.log('\n\n--- DEMO 7: Long Response Truncation ---\n');

const longHistory: HistoryEntry[] = [
  {
    timestamp: new Date().toISOString(),
    prompt: 'Explain microservices architecture in detail',
    response: 'A'.repeat(300), // Very long response
    provider: 'claude'
  }
];

console.log(formatHistory(longHistory));

console.log('\n\n' + '='.repeat(60));
console.log('END OF DEMO');
console.log('='.repeat(60) + '\n');
