// Test script to populate projects.json for testing the switch command
import { writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const projectsPath = join(homedir(), '.llmenv', 'projects.json');

const testProjects = [
  {
    name: "llmenv",
    path: process.cwd(),
    lastActive: new Date().toISOString(),
    config: {
      project: "llmenv",
      stack: ["TypeScript", "Node.js"],
      avoid: [],
      context: "CLI tool for AI context management",
      priorities: ["Developer experience"]
    }
  },
  {
    name: "test-project-1",
    path: "C:\\Users\\test\\projects\\test-project-1",
    lastActive: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    config: {
      project: "test-project-1",
      stack: ["Python", "FastAPI"],
      avoid: ["AWS"],
      context: "Test project 1",
      priorities: ["Speed"]
    }
  },
  {
    name: "test-project-2",
    path: "C:\\Users\\test\\projects\\test-project-2",
    lastActive: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    config: {
      project: "test-project-2",
      stack: ["React", "TypeScript"],
      avoid: [],
      context: "Test project 2",
      priorities: ["Quality"]
    }
  }
];

writeFileSync(projectsPath, JSON.stringify(testProjects, null, 2));
console.log('Test projects added to registry');
console.log('Projects:', testProjects.map(p => p.name).join(', '));
