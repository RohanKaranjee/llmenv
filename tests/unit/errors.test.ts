import { describe, it, expect } from 'vitest';
import {
  LLMEnvError,
  ConfigError,
  ValidationError,
  APIError,
  ProjectNotFoundError,
} from '../../src/types/errors.js';

describe('Error Classes', () => {
  describe('LLMEnvError', () => {
    it('should create a base error with correct name and message', () => {
      const error = new LLMEnvError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(LLMEnvError);
      expect(error.name).toBe('LLMEnvError');
      expect(error.message).toBe('Test error');
    });
  });

  describe('ConfigError', () => {
    it('should create a config error with message only', () => {
      const error = new ConfigError('Config failed');
      expect(error).toBeInstanceOf(LLMEnvError);
      expect(error.name).toBe('ConfigError');
      expect(error.message).toBe('Config failed');
      expect(error.filePath).toBeUndefined();
    });

    it('should create a config error with file path', () => {
      const error = new ConfigError('Config failed', '/path/to/config.json');
      expect(error.name).toBe('ConfigError');
      expect(error.message).toBe('Config failed');
      expect(error.filePath).toBe('/path/to/config.json');
    });
  });

  describe('ValidationError', () => {
    it('should create a validation error with message only', () => {
      const error = new ValidationError('Invalid input');
      expect(error).toBeInstanceOf(LLMEnvError);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Invalid input');
      expect(error.field).toBeUndefined();
    });

    it('should create a validation error with field name', () => {
      const error = new ValidationError('Invalid input', 'projectName');
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Invalid input');
      expect(error.field).toBe('projectName');
    });
  });

  describe('APIError', () => {
    it('should create an API error with message only', () => {
      const error = new APIError('API call failed');
      expect(error).toBeInstanceOf(LLMEnvError);
      expect(error.name).toBe('APIError');
      expect(error.message).toBe('API call failed');
      expect(error.provider).toBeUndefined();
      expect(error.statusCode).toBeUndefined();
    });

    it('should create an API error with provider and status code', () => {
      const error = new APIError('API call failed', 'openai', 429);
      expect(error.name).toBe('APIError');
      expect(error.message).toBe('API call failed');
      expect(error.provider).toBe('openai');
      expect(error.statusCode).toBe(429);
    });
  });

  describe('ProjectNotFoundError', () => {
    it('should create a project not found error with default message', () => {
      const error = new ProjectNotFoundError();
      expect(error).toBeInstanceOf(LLMEnvError);
      expect(error.name).toBe('ProjectNotFoundError');
      expect(error.message).toBe('Not in a project directory');
    });

    it('should create a project not found error with custom message', () => {
      const error = new ProjectNotFoundError('Custom message');
      expect(error.name).toBe('ProjectNotFoundError');
      expect(error.message).toBe('Custom message');
    });
  });
});
