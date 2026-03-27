import chalk from 'chalk';
import {
  LLMEnvError,
  ConfigError,
  ValidationError,
  APIError,
  ProjectNotFoundError,
} from '../types/errors.js';

/**
 * Exit codes for different error types
 */
export enum ExitCode {
  SUCCESS = 0,
  GENERAL_ERROR = 1,
  CONFIG_ERROR = 2,
  VALIDATION_ERROR = 3,
  API_ERROR = 4,
  NOT_FOUND = 5,
}

/**
 * Handle errors and display user-friendly messages
 * @param error - The error to handle
 */
export function handleError(error: unknown): never {
  console.error(); // Empty line for spacing

  if (error instanceof ConfigError) {
    handleConfigError(error);
  } else if (error instanceof ValidationError) {
    handleValidationError(error);
  } else if (error instanceof APIError) {
    handleAPIError(error);
  } else if (error instanceof ProjectNotFoundError) {
    handleProjectNotFoundError(error);
  } else if (error instanceof LLMEnvError) {
    handleLLMEnvError(error);
  } else if (error instanceof Error) {
    handleGenericError(error);
  } else {
    handleUnknownError(error);
  }
}

/**
 * Handle ConfigError - file system and configuration errors
 */
function handleConfigError(error: ConfigError): never {
  console.error(chalk.red('❌ Configuration Error'));
  console.error(chalk.white(error.message));

  if (error.filePath) {
    console.error(chalk.gray(`File: ${error.filePath}`));
  }

  console.error();
  console.error(chalk.yellow('💡 Suggested next steps:'));
  console.error(chalk.gray('  • Check that the file exists and is readable'));
  console.error(chalk.gray('  • Verify the file contains valid JSON'));
  console.error(chalk.gray('  • Run "llmenv init" to reinitialize if needed'));

  process.exit(ExitCode.CONFIG_ERROR);
}

/**
 * Handle ValidationError - invalid user input
 */
function handleValidationError(error: ValidationError): never {
  console.error(chalk.red('❌ Validation Error'));
  console.error(chalk.white(error.message));

  if (error.field) {
    console.error(chalk.gray(`Field: ${error.field}`));
  }

  console.error();
  console.error(chalk.yellow('💡 Suggested next steps:'));
  console.error(chalk.gray('  • Check your input and try again'));
  console.error(chalk.gray('  • Run the command with --help for usage information'));

  process.exit(ExitCode.VALIDATION_ERROR);
}

/**
 * Handle APIError - AI API call failures
 */
function handleAPIError(error: APIError): never {
  console.error(chalk.red('❌ API Error'));
  console.error(chalk.white(error.message));

  if (error.provider) {
    console.error(chalk.gray(`Provider: ${error.provider}`));
  }

  if (error.statusCode) {
    console.error(chalk.gray(`Status Code: ${error.statusCode}`));
  }

  console.error();
  console.error(chalk.yellow('💡 Suggested next steps:'));

  if (error.statusCode === 401 || error.statusCode === 403) {
    console.error(
      chalk.gray('  • Run "llmenv config" to update your API key')
    );
    console.error(
      chalk.gray('  • Verify your API key is valid and has not expired')
    );
  } else if (error.statusCode === 429) {
    console.error(chalk.gray('  • You have exceeded the API rate limit'));
    console.error(chalk.gray('  • Wait a few moments and try again'));
  } else {
    console.error(chalk.gray('  • Check your internet connection'));
    console.error(
      chalk.gray('  • Verify the AI provider service is operational')
    );
    console.error(
      chalk.gray('  • Run "llmenv config" to reconfigure your API settings')
    );
  }

  process.exit(ExitCode.API_ERROR);
}

/**
 * Handle ProjectNotFoundError - no project detected
 */
function handleProjectNotFoundError(error: ProjectNotFoundError): never {
  console.error(chalk.red('❌ Project Not Found'));
  console.error(chalk.white(error.message));

  console.error();
  console.error(chalk.yellow('💡 Suggested next steps:'));
  console.error(
    chalk.gray('  • Run "llmenv init" to initialize a project in this directory')
  );
  console.error(
    chalk.gray('  • Navigate to a directory with a .llmenv file')
  );
  console.error(
    chalk.gray('  • Run "llmenv projects" to see all registered projects')
  );

  process.exit(ExitCode.NOT_FOUND);
}

/**
 * Handle generic LLMEnvError
 */
function handleLLMEnvError(error: LLMEnvError): never {
  console.error(chalk.red('❌ Error'));
  console.error(chalk.white(error.message));

  process.exit(ExitCode.GENERAL_ERROR);
}

/**
 * Handle generic Error
 */
function handleGenericError(error: Error): never {
  console.error(chalk.red('❌ Error'));
  console.error(chalk.white(error.message));

  // Show stack trace in debug mode
  if (process.env.DEBUG === 'llmenv') {
    console.error();
    console.error(chalk.gray('Stack trace:'));
    console.error(chalk.gray(error.stack || 'No stack trace available'));
  }

  process.exit(ExitCode.GENERAL_ERROR);
}

/**
 * Handle unknown error types
 */
function handleUnknownError(error: unknown): never {
  console.error(chalk.red('❌ Unexpected Error'));
  console.error(chalk.white('An unexpected error occurred'));

  if (process.env.DEBUG === 'llmenv') {
    console.error();
    console.error(chalk.gray('Error details:'));
    console.error(chalk.gray(JSON.stringify(error, null, 2)));
  }

  process.exit(ExitCode.GENERAL_ERROR);
}
