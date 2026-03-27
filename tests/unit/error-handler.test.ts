import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import chalk from 'chalk';
import { handleError, ExitCode } from '../../src/utils/error-handler.js';
import {
  ConfigError,
  ValidationError,
  APIError,
  ProjectNotFoundError,
  LLMEnvError,
} from '../../src/types/errors.js';

describe('Error Handler', () => {
  let consoleErrorSpy: any;
  let processExitSpy: any;

  beforeEach(() => {
    // Spy on console.error and process.exit
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    // Restore original implementations
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('ConfigError handling', () => {
    it('should display config error with file path', () => {
      const error = new ConfigError(
        'Failed to read configuration file',
        '/path/to/config.json'
      );

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.red('❌ Configuration Error')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.white('Failed to read configuration file')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.gray('File: /path/to/config.json')
      );
      expect(processExitSpy).toHaveBeenCalledWith(ExitCode.CONFIG_ERROR);
    });

    it('should display config error without file path', () => {
      const error = new ConfigError('Configuration error occurred');

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.red('❌ Configuration Error')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.white('Configuration error occurred')
      );
      expect(processExitSpy).toHaveBeenCalledWith(ExitCode.CONFIG_ERROR);
    });

    it('should include suggested next steps for config errors', () => {
      const error = new ConfigError('Config failed');

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.yellow('💡 Suggested next steps:')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.gray('  • Check that the file exists and is readable')
      );
    });
  });

  describe('ValidationError handling', () => {
    it('should display validation error with field name', () => {
      const error = new ValidationError(
        'Project name cannot be empty',
        'projectName'
      );

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.red('❌ Validation Error')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.white('Project name cannot be empty')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.gray('Field: projectName')
      );
      expect(processExitSpy).toHaveBeenCalledWith(ExitCode.VALIDATION_ERROR);
    });

    it('should display validation error without field name', () => {
      const error = new ValidationError('Invalid input');

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.red('❌ Validation Error')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(chalk.white('Invalid input'));
      expect(processExitSpy).toHaveBeenCalledWith(ExitCode.VALIDATION_ERROR);
    });

    it('should include suggested next steps for validation errors', () => {
      const error = new ValidationError('Invalid input');

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.yellow('💡 Suggested next steps:')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.gray('  • Check your input and try again')
      );
    });
  });

  describe('APIError handling', () => {
    it('should display API error with provider and status code', () => {
      const error = new APIError('API call failed', 'openai', 500);

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(chalk.red('❌ API Error'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.white('API call failed')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.gray('Provider: openai')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.gray('Status Code: 500')
      );
      expect(processExitSpy).toHaveBeenCalledWith(ExitCode.API_ERROR);
    });

    it('should display API error without provider and status code', () => {
      const error = new APIError('Network error');

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(chalk.red('❌ API Error'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(chalk.white('Network error'));
      expect(processExitSpy).toHaveBeenCalledWith(ExitCode.API_ERROR);
    });

    it('should provide specific suggestions for 401 errors', () => {
      const error = new APIError('Unauthorized', 'claude', 401);

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.gray('  • Run "llmenv config" to update your API key')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.gray('  • Verify your API key is valid and has not expired')
      );
    });

    it('should provide specific suggestions for 403 errors', () => {
      const error = new APIError('Forbidden', 'openai', 403);

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.gray('  • Run "llmenv config" to update your API key')
      );
    });

    it('should provide specific suggestions for 429 errors', () => {
      const error = new APIError('Rate limit exceeded', 'claude', 429);

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.gray('  • You have exceeded the API rate limit')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.gray('  • Wait a few moments and try again')
      );
    });

    it('should provide general suggestions for other API errors', () => {
      const error = new APIError('Server error', 'openai', 500);

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.gray('  • Check your internet connection')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.gray('  • Verify the AI provider service is operational')
      );
    });
  });

  describe('ProjectNotFoundError handling', () => {
    it('should display project not found error with default message', () => {
      const error = new ProjectNotFoundError();

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.red('❌ Project Not Found')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.white('Not in a project directory')
      );
      expect(processExitSpy).toHaveBeenCalledWith(ExitCode.NOT_FOUND);
    });

    it('should display project not found error with custom message', () => {
      const error = new ProjectNotFoundError('Custom not found message');

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.red('❌ Project Not Found')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.white('Custom not found message')
      );
    });

    it('should include suggested next steps for project not found errors', () => {
      const error = new ProjectNotFoundError();

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.yellow('💡 Suggested next steps:')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.gray(
          '  • Run "llmenv init" to initialize a project in this directory'
        )
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.gray('  • Navigate to a directory with a .llmenv file')
      );
    });
  });

  describe('LLMEnvError handling', () => {
    it('should display generic LLMEnvError', () => {
      const error = new LLMEnvError('Generic llmenv error');

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(chalk.red('❌ Error'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.white('Generic llmenv error')
      );
      expect(processExitSpy).toHaveBeenCalledWith(ExitCode.GENERAL_ERROR);
    });
  });

  describe('Generic Error handling', () => {
    it('should display generic error message', () => {
      const error = new Error('Something went wrong');

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(chalk.red('❌ Error'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.white('Something went wrong')
      );
      expect(processExitSpy).toHaveBeenCalledWith(ExitCode.GENERAL_ERROR);
    });

    it('should show stack trace in debug mode', () => {
      const originalDebug = process.env.DEBUG;
      process.env.DEBUG = 'llmenv';

      const error = new Error('Debug error');
      error.stack = 'Error: Debug error\n    at test.ts:1:1';

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.gray('Stack trace:')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.gray('Error: Debug error\n    at test.ts:1:1')
      );

      process.env.DEBUG = originalDebug;
    });
  });

  describe('Unknown error handling', () => {
    it('should handle unknown error types', () => {
      const error = { custom: 'error object' };

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.red('❌ Unexpected Error')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.white('An unexpected error occurred')
      );
      expect(processExitSpy).toHaveBeenCalledWith(ExitCode.GENERAL_ERROR);
    });

    it('should show error details in debug mode for unknown errors', () => {
      const originalDebug = process.env.DEBUG;
      process.env.DEBUG = 'llmenv';

      const error = { custom: 'error object' };

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.gray('Error details:')
      );

      process.env.DEBUG = originalDebug;
    });
  });

  describe('Exit codes', () => {
    it('should use correct exit code for each error type', () => {
      const testCases = [
        { error: new ConfigError('test'), exitCode: ExitCode.CONFIG_ERROR },
        {
          error: new ValidationError('test'),
          exitCode: ExitCode.VALIDATION_ERROR,
        },
        { error: new APIError('test'), exitCode: ExitCode.API_ERROR },
        {
          error: new ProjectNotFoundError(),
          exitCode: ExitCode.NOT_FOUND,
        },
        { error: new LLMEnvError('test'), exitCode: ExitCode.GENERAL_ERROR },
        { error: new Error('test'), exitCode: ExitCode.GENERAL_ERROR },
      ];

      testCases.forEach(({ error, exitCode }) => {
        processExitSpy.mockClear();
        handleError(error);
        expect(processExitSpy).toHaveBeenCalledWith(exitCode);
      });
    });
  });

  describe('Output formatting', () => {
    it('should include empty line at the start', () => {
      const error = new Error('test');

      handleError(error);

      // First call should be empty line
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(1);
    });

    it('should use red color for error headers', () => {
      const error = new ConfigError('test');

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌')
      );
    });

    it('should use yellow color for suggestions', () => {
      const error = new ValidationError('test');

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.yellow('💡 Suggested next steps:')
      );
    });

    it('should use gray color for details and suggestions', () => {
      const error = new ConfigError('test', '/path/to/file');

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.gray('File: /path/to/file')
      );
    });
  });
});
