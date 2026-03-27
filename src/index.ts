import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { statusCommand } from './commands/status.js';
import { projectsCommand } from './commands/projects.js';
import { switchCommand } from './commands/switch.js';
import { useCommand } from './commands/use.js';
import { pinCommand, pinsCommand, unpinCommand } from './commands/pin.js';
import { historyCommand } from './commands/history.js';
import { injectCommand } from './commands/inject.js';
import { configCommand } from './commands/config.js';
import { handleError } from './utils/error-handler.js';
import { initializeConfig } from './core/config.js';

const program = new Command();

program
  .name('llmenv')
  .description('.env is for secrets. .llmenv is for you.')
  .version('1.0.0');

// Initialize config before running any command
program.hook('preAction', async () => {
  try {
    await initializeConfig();
  } catch (error) {
    handleError(error);
  }
});

// Register init command
program
  .command('init')
  .description('Initialize a new project with llmenv configuration')
  .action(async () => {
    try {
      await initCommand();
    } catch (error) {
      handleError(error);
    }
  });

// Register status command
program
  .command('status')
  .description('Display current merged context')
  .action(async () => {
    try {
      await statusCommand();
    } catch (error) {
      handleError(error);
    }
  });

// Register projects command
program
  .command('projects')
  .description('List all registered projects')
  .action(async () => {
    try {
      await projectsCommand();
    } catch (error) {
      handleError(error);
    }
  });

// Register switch command
program
  .command('switch')
  .description('Interactively switch to a registered project')
  .action(async () => {
    try {
      await switchCommand();
    } catch (error) {
      handleError(error);
    }
  });

// Register use command
program
  .command('use [profile]')
  .description('Switch to a different profile or display current profile')
  .action(async (profile?: string) => {
    try {
      await useCommand(profile);
    } catch (error) {
      handleError(error);
    }
  });

// Register pin command
program
  .command('pin <fact>')
  .description('Add a new persistent fact')
  .action(async (fact: string) => {
    try {
      await pinCommand(fact);
    } catch (error) {
      handleError(error);
    }
  });

// Register pins command
program
  .command('pins')
  .description('List all pinned facts')
  .action(async () => {
    try {
      await pinsCommand();
    } catch (error) {
      handleError(error);
    }
  });

// Register unpin command
program
  .command('unpin <id>')
  .description('Remove a pinned fact by ID')
  .action(async (id: string) => {
    try {
      await unpinCommand(id);
    } catch (error) {
      handleError(error);
    }
  });

// Register history command
program
  .command('history')
  .description('Display decision history for current project')
  .action(async () => {
    try {
      await historyCommand();
    } catch (error) {
      handleError(error);
    }
  });

// Register inject command
program
  .command('inject <prompt>')
  .description('Inject context into prompt and send to AI (or display with --dry)')
  .option('--dry', 'Display wrapped prompt without calling AI API')
  .action(async (prompt: string, options: { dry?: boolean }) => {
    try {
      await injectCommand(prompt, options);
    } catch (error) {
      handleError(error);
    }
  });

// Register config command
program
  .command('config')
  .description('Configure AI provider and API key')
  .action(async () => {
    try {
      await configCommand();
    } catch (error) {
      handleError(error);
    }
  });

program.parse();
