/**
 * Demo script showing the projects command functionality
 * Run with: npx tsx examples/projects-demo.ts
 */

import { projectsCommand } from '../src/commands/projects.js';
import { registerProject } from '../src/core/projects.js';
import type { ProjectConfig } from '../src/types/index.js';

async function demo() {
  console.log('=== Projects Command Demo ===\n');

  // Demo 1: Empty project list
  console.log('Demo 1: Empty project list');
  console.log('----------------------------');
  await projectsCommand();

  // Demo 2: Register some projects
  console.log('\nDemo 2: Registering projects...');
  console.log('----------------------------');
  
  const project1: ProjectConfig = {
    project: 'AI Content Studio',
    stack: ['Python', 'FastAPI', 'Supabase'],
    avoid: ['AWS'],
    context: 'Bootstrapped SaaS',
    priorities: ['Ship fast']
  };
  
  const project2: ProjectConfig = {
    project: 'llmenv',
    stack: ['TypeScript', 'Node.js'],
    avoid: [],
    context: 'Open source CLI tool',
    priorities: ['Developer experience']
  };

  await registerProject('/home/user/projects/ai-content-studio', project1);
  console.log('✓ Registered: AI Content Studio');
  
  // Wait a bit to ensure different timestamps
  await new Promise(resolve => setTimeout(resolve, 100));
  
  await registerProject('/home/user/projects/llmenv', project2);
  console.log('✓ Registered: llmenv');

  // Demo 3: Display projects
  console.log('\nDemo 3: Display all projects');
  console.log('----------------------------');
  await projectsCommand();

  console.log('\n=== Demo Complete ===');
}

demo().catch(console.error);
