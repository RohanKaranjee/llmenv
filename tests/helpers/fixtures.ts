import type {
  GlobalIdentity,
  Profile,
  ProjectConfig,
  Pin,
  AISettings,
  ProjectEntry,
  HistoryEntry,
} from '../../src/types/index.js';

/**
 * Sample global identity configurations for testing
 */
export const sampleGlobalIdentities = {
  default: (): GlobalIdentity => ({
    name: '',
    role: '',
    experience: '',
    preferences: [],
    communication: 'Clear and concise',
  }),

  developer: (): GlobalIdentity => ({
    name: 'John Doe',
    role: 'Full-stack Developer',
    experience: '5 years',
    preferences: ['TypeScript', 'Functional programming', 'Minimal dependencies'],
    communication: 'Concise, technical, with examples',
  }),

  senior: (): GlobalIdentity => ({
    name: 'Jane Smith',
    role: 'Senior Software Engineer',
    experience: '10 years',
    preferences: ['Clean code', 'Test-driven development', 'Documentation'],
    communication: 'Detailed and thorough',
  }),

  junior: (): GlobalIdentity => ({
    name: 'Alex Johnson',
    role: 'Junior Developer',
    experience: '1 year',
    preferences: ['Learning', 'Best practices'],
    communication: 'Patient and educational',
  }),
};

/**
 * Sample profile configurations for testing
 */
export const sampleProfiles = {
  work: (): Profile => ({
    name: 'work',
    focus: 'Production code',
    priorities: ['Reliability', 'Maintainability', 'Performance'],
    constraints: ['Must follow company coding standards', 'Requires code review before merge'],
    tone: 'Professional and thorough',
  }),

  build: (): Profile => ({
    name: 'build',
    focus: 'Side projects and experimentation',
    priorities: ['Ship fast', 'Learn new tech', 'Minimal cost'],
    constraints: ['Solo developer', 'Limited time (<5hrs/week)'],
    tone: 'Pragmatic and scrappy',
  }),

  personal: (): Profile => ({
    name: 'personal',
    focus: 'Learning and exploration',
    priorities: ['Understanding concepts', 'Best practices', 'Long-term maintainability'],
    constraints: [],
    tone: 'Educational and detailed',
  }),

  learn: (): Profile => ({
    name: 'learn',
    focus: 'Tutorials and documentation',
    priorities: ['Clear explanations', 'Step-by-step guidance', 'Examples and analogies'],
    constraints: [],
    tone: 'Patient and thorough',
  }),
};

/**
 * Sample project configurations for testing
 */
export const sampleProjects = {
  simple: (): ProjectConfig => ({
    project: 'Simple Project',
    stack: ['Node.js', 'TypeScript'],
    avoid: [],
    context: 'Simple test project',
    priorities: ['Simplicity'],
  }),

  fullStack: (): ProjectConfig => ({
    project: 'AI Content Studio',
    stack: ['Python', 'FastAPI', 'Supabase', 'Redis', 'Cloudflare R2'],
    avoid: ['AWS', 'Firebase', 'Docker in dev'],
    context: 'Bootstrapped SaaS, solo dev, <5hrs/week, monetized at $15/mo',
    priorities: ['Ship fast', 'Cheap infrastructure', 'Minimal dependencies'],
  }),

  enterprise: (): ProjectConfig => ({
    project: 'Enterprise CRM',
    stack: ['Java', 'Spring Boot', 'PostgreSQL', 'React', 'Kubernetes'],
    avoid: ['MongoDB', 'NoSQL databases'],
    context: 'Large enterprise application, team of 20 developers',
    priorities: ['Scalability', 'Security', 'Compliance', 'Documentation'],
  }),

  mobile: (): ProjectConfig => ({
    project: 'Mobile App',
    stack: ['React Native', 'TypeScript', 'Firebase'],
    avoid: ['Native iOS/Android'],
    context: 'Cross-platform mobile app',
    priorities: ['User experience', 'Performance', 'Offline support'],
  }),

  minimal: (): ProjectConfig => ({
    project: 'Minimal',
    stack: ['JavaScript'],
    avoid: [],
    context: 'Minimal project',
    priorities: [],
  }),
};

/**
 * Sample pin configurations for testing
 */
export const samplePins = {
  single: (): Pin => ({
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    fact: 'Using Cloudflare R2 not S3',
    createdAt: '2024-03-10T09:00:00.000Z',
  }),

  multiple: (): Pin[] => [
    {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      fact: 'Using Cloudflare R2 not S3',
      createdAt: '2024-03-10T09:00:00.000Z',
    },
    {
      id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      fact: 'Supabase for auth + DB + storage',
      createdAt: '2024-03-10T09:01:00.000Z',
    },
    {
      id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
      fact: 'No microservices, monolith for now',
      createdAt: '2024-03-10T09:02:00.000Z',
    },
  ],

  empty: (): Pin[] => [],
};

/**
 * Sample AI settings for testing
 */
export const sampleAISettings = {
  openai: (): AISettings => ({
    provider: 'openai',
    apiKey: 'sk-test-openai-key-1234567890',
  }),

  claude: (): AISettings => ({
    provider: 'claude',
    apiKey: 'sk-ant-api03-test-claude-key-1234567890',
  }),
};

/**
 * Sample project registry entries for testing
 */
export const sampleProjectEntries = {
  single: (): ProjectEntry => ({
    name: 'Test Project',
    path: '/home/user/projects/test-project',
    lastActive: '2024-03-15T14:30:00.000Z',
    config: sampleProjects.simple(),
  }),

  multiple: (): ProjectEntry[] => [
    {
      name: 'AI Content Studio',
      path: '/home/user/projects/ai-content-studio',
      lastActive: '2024-03-15T14:30:00.000Z',
      config: sampleProjects.fullStack(),
    },
    {
      name: 'llmenv',
      path: '/home/user/projects/llmenv',
      lastActive: '2024-03-14T10:15:00.000Z',
      config: {
        project: 'llmenv',
        stack: ['TypeScript', 'Node.js'],
        avoid: [],
        context: 'Open source CLI tool',
        priorities: ['Developer experience'],
      },
    },
    {
      name: 'client-app',
      path: '/home/user/projects/client-app',
      lastActive: '2024-03-12T08:00:00.000Z',
      config: sampleProjects.mobile(),
    },
  ],
};

/**
 * Sample history entries for testing
 */
export const sampleHistoryEntries = {
  single: (): HistoryEntry => ({
    timestamp: '2024-03-15T14:30:00.000Z',
    prompt: 'How do I queue video uploads?',
    response: 'For your FastAPI + Redis setup, I recommend using Celery with Redis as the broker...',
    provider: 'claude',
  }),

  multiple: (): HistoryEntry[] => [
    {
      timestamp: '2024-03-15T14:30:00.000Z',
      prompt: 'How do I queue video uploads?',
      response: 'For your FastAPI + Redis setup, I recommend using Celery with Redis as the broker...',
      provider: 'claude',
    },
    {
      timestamp: '2024-03-14T16:45:00.000Z',
      prompt: 'Best way to handle video thumbnails?',
      response: 'Since you are using Cloudflare R2, you can leverage Cloudflare Images...',
      provider: 'claude',
    },
    {
      timestamp: '2024-03-13T10:20:00.000Z',
      prompt: 'How to implement user authentication?',
      response: 'With Supabase, authentication is straightforward. Here is how to set it up...',
      provider: 'openai',
    },
  ],
};

/**
 * Creates a custom global identity with overrides
 */
export function createGlobalIdentity(overrides: Partial<GlobalIdentity> = {}): GlobalIdentity {
  return {
    ...sampleGlobalIdentities.developer(),
    ...overrides,
  };
}

/**
 * Creates a custom profile with overrides
 */
export function createProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    ...sampleProfiles.work(),
    ...overrides,
  };
}

/**
 * Creates a custom project config with overrides
 */
export function createProjectConfig(overrides: Partial<ProjectConfig> = {}): ProjectConfig {
  return {
    ...sampleProjects.simple(),
    ...overrides,
  };
}

/**
 * Creates a custom pin with overrides
 */
export function createPin(overrides: Partial<Pin> = {}): Pin {
  return {
    id: `pin-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    fact: 'Test pin fact',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates multiple pins with sequential IDs
 */
export function createPins(count: number, factPrefix: string = 'Pin'): Pin[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `pin-${i + 1}-${Date.now()}`,
    fact: `${factPrefix} ${i + 1}`,
    createdAt: new Date(Date.now() + i * 1000).toISOString(),
  }));
}

/**
 * Creates a custom project entry with overrides
 */
export function createProjectEntry(overrides: Partial<ProjectEntry> = {}): ProjectEntry {
  return {
    ...sampleProjectEntries.single(),
    ...overrides,
  };
}

/**
 * Creates a custom history entry with overrides
 */
export function createHistoryEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    timestamp: new Date().toISOString(),
    prompt: 'Test prompt',
    response: 'Test response',
    provider: 'claude',
    ...overrides,
  };
}
