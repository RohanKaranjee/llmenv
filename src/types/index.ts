// Export error classes
export * from './errors.js';

// Core configuration interfaces

export interface GlobalIdentity {
  name: string;
  role: string;
  experience: string;
  preferences: string[];
  communication: string;
}

export interface Profile {
  name: string;
  focus: string;
  priorities: string[];
  constraints: string[];
  tone: string;
}

export interface ProjectConfig {
  project: string;
  stack: string[];
  avoid: string[];
  context: string;
  priorities: string[];
}

export interface ProjectEntry {
  name: string;
  path: string;
  lastActive: string;
  config: ProjectConfig;
}

export interface Pin {
  id: string;
  fact: string;
  createdAt: string;
}

export interface AISettings {
  provider: 'openai' | 'claude';
  apiKey: string;
}

export interface HistoryEntry {
  timestamp: string;
  prompt: string;
  response: string;
  provider: 'openai' | 'claude';
}

// Context building interfaces

export interface MergedContext {
  global: GlobalIdentity;
  profile: Profile;
  project: ProjectConfig | null;
  pins: string[];
}

export interface ContextStack {
  global: GlobalIdentity;
  profile: Profile;
  project: ProjectConfig | null;
  pins: Pin[];
  projectPath: string | null;
}

// AI integration interfaces

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
