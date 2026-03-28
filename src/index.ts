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
import { identityCommand } from './commands/identity.js';
import { syncCommand } from './commands/sync.js';
import { scanCommand } from './commands/scan.js';
import { handleError } from './utils/error-handler.js';
import { initializeConfig } from './core/config.js';
import { renderBanner } from './ui/components/banner.js';
import { buildContext } from './core/context.js';
import { getColor, applyColor } from './ui/core/theme.js';
import { renderBox } from './ui/components/box.js';

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
  .description('Pin a global fact or rule for all your AI interactions')
  .option('--learn', 'Mark this pin as an AI mistake to learn from')
  .option('--scope <pattern>', 'Glob pattern to scope this rule (e.g., "*.test.ts")')
  .action(async (fact: string, options) => {
    try {
      await pinCommand(fact, options);
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

// Register identity command
program
  .command('identity')
  .description('Set up or update your global developer identity')
  .option('--github <username>', 'Auto-fill your identity from GitHub profile')
  .action(async (options) => {
    try {
      await identityCommand(options);
    } catch (error) {
      handleError(error);
    }
  });

// Register sync command
program
  .command('sync')
  .description('Sync your context to all AI IDE rules files (Cursor, Windsurf, Copilot, etc.)')
  .option('--verbose', 'Use verbose context format (more tokens, more detail)')
  .action(async (options: { verbose?: boolean }) => {
    try {
      await syncCommand(options);
    } catch (error) {
      handleError(error);
    }
  });

// Register scan command
program
  .command('scan')
  .description('Auto-scan your project files to generate accurate context (package.json, tsconfig, etc.)')
  .action(async () => {
    try {
      await scanCommand();
    } catch (error) {
      handleError(error);
    }
  });

if (!process.argv.slice(2).length) {
  (async () => {
    try {
      await initializeConfig();
      console.log(renderBanner());
      
      try {
        const context = await buildContext(process.cwd());
        const summary = [
          applyColor(`Profile: ${context.profile.name}`, getColor('success')),
          applyColor(`Project: ${context.project?.project || 'None'}`, getColor('primary')),
          applyColor(`Pins: ${context.pins.length}`, getColor('info'))
        ].join('  |  ');
        
        console.log(renderBox(summary, {
          borderStyle: 'rounded',
          borderColor: getColor('border'),
          align: 'center',
          padding: 0
        }) + '\n');
      } catch (e) {
        // Ignore if context building fails (e.g. initial setup)
      }
      
      console.log('  ' + applyColor('Run "llmenv --help" to see available commands.', getColor('textMuted')) + '\n');
    } catch (error) {
      handleError(error);
    }
  })();
} else {
  program.parse();
}
