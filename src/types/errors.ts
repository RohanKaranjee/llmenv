// Custom error classes for llmenv CLI

export class LLMEnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LLMEnvError';
  }
}

export class ConfigError extends LLMEnvError {
  constructor(message: string, public filePath?: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export class ValidationError extends LLMEnvError {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class APIError extends LLMEnvError {
  constructor(
    message: string,
    public provider?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class ProjectNotFoundError extends LLMEnvError {
  constructor(message: string = 'Not in a project directory') {
    super(message);
    this.name = 'ProjectNotFoundError';
  }
}
