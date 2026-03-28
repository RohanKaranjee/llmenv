import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { buildContext, formatContext } from '../core/context.js';
import { formatCompactContext, estimateTokens } from '../core/compact-context.js';
import { renderBox, renderHeader } from '../ui/index.js';
import { getColor, applyColor } from '../ui/core/theme.js';
import { getIcon } from '../ui/icons.js';

const MARKER_START = '<!-- LLMENV:START -->';
const MARKER_END = '<!-- LLMENV:END -->';

/**
 * All supported AI tools with their rules file paths and detection logic.
 */
interface AITool {
  name: string;
  /** Relative path from project root to the rules file */
  rulesFile: string;
  /** Directories/files to check for auto-detection (relative to project root) */
  detectBy: string[];
  /** If true, create the rules file even if detection dirs don't exist */
  alwaysAvailable: boolean;
  /** If the rules file needs a parent directory created */
  needsDir: boolean;
}

const AI_TOOLS: AITool[] = [
  {
    name: 'Cursor',
    rulesFile: '.cursor/rules/llmenv-context.md',
    detectBy: ['.cursor'],
    alwaysAvailable: false,
    needsDir: true,
  },
  {
    name: 'Windsurf',
    rulesFile: '.windsurfrules',
    detectBy: ['.windsurfrules', '.windsurf'],
    alwaysAvailable: false,
    needsDir: false,
  },
  {
    name: 'GitHub Copilot',
    rulesFile: '.github/copilot-instructions.md',
    detectBy: ['.github'],
    alwaysAvailable: false,
    needsDir: true,
  },
  {
    name: 'Gemini / Antigravity',
    rulesFile: 'GEMINI.md',
    detectBy: ['GEMINI.md', '.gemini'],
    alwaysAvailable: false,
    needsDir: false,
  },
  {
    name: 'Kiro',
    rulesFile: '.kiro/steering/llmenv-context.md',
    detectBy: ['.kiro'],
    alwaysAvailable: false,
    needsDir: true,
  },
  {
    name: 'Claude Code',
    rulesFile: 'CLAUDE.md',
    detectBy: ['CLAUDE.md'],
    alwaysAvailable: false,
    needsDir: false,
  },
  {
    name: 'Cline',
    rulesFile: '.clinerules',
    detectBy: ['.clinerules', '.cline'],
    alwaysAvailable: false,
    needsDir: false,
  },
  {
    name: 'Roo Code',
    rulesFile: '.roo/rules/llmenv-context.md',
    detectBy: ['.roo'],
    alwaysAvailable: false,
    needsDir: true,
  },
  {
    name: 'Continue',
    rulesFile: '.continue/rules/llmenv-context.md',
    detectBy: ['.continue'],
    alwaysAvailable: false,
    needsDir: true,
  },
  {
    name: 'Aider',
    rulesFile: '.aider.conf.yml',
    detectBy: ['.aider.conf.yml', '.aiderignore'],
    alwaysAvailable: false,
    needsDir: false,
  },
];

/**
 * Check if a path exists
 */
async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect which AI tools are present in the project directory.
 */
async function detectTools(projectRoot: string): Promise<AITool[]> {
  const detected: AITool[] = [];

  for (const tool of AI_TOOLS) {
    // Always-available tools are always included
    if (tool.alwaysAvailable) {
      detected.push(tool);
      continue;
    }

    // Check if any detection paths exist
    for (const detectPath of tool.detectBy) {
      const fullPath = path.join(projectRoot, detectPath);
      if (await pathExists(fullPath)) {
        detected.push(tool);
        break;
      }
    }
  }

  return detected;
}

/**
 * Insert or replace the LLMENV context section in a file using markers.
 * Preserves any content outside the markers.
 */
function insertWithMarkers(existingContent: string, contextBlock: string): string {
  const markedContent = `${MARKER_START}\n${contextBlock}\n${MARKER_END}`;

  const startIdx = existingContent.indexOf(MARKER_START);
  const endIdx = existingContent.indexOf(MARKER_END);

  if (startIdx !== -1 && endIdx !== -1) {
    // Replace existing marked section
    const before = existingContent.substring(0, startIdx);
    const after = existingContent.substring(endIdx + MARKER_END.length);
    return before + markedContent + after;
  }

  // No existing markers — append to end
  if (existingContent.trim().length > 0) {
    return existingContent.trimEnd() + '\n\n' + markedContent + '\n';
  }

  return markedContent + '\n';
}

/**
 * Write the context to a specific tool's rules file.
 */
async function writeToTool(
  tool: AITool,
  projectRoot: string,
  contextBlock: string
): Promise<void> {
  const filePath = path.join(projectRoot, tool.rulesFile);

  // Create parent directories if needed
  if (tool.needsDir) {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
  }

  // Read existing content if file exists
  let existingContent = '';
  if (await pathExists(filePath)) {
    existingContent = await fs.readFile(filePath, 'utf-8');
  }

  // Insert/replace with markers
  const newContent = insertWithMarkers(existingContent, contextBlock);

  await fs.writeFile(filePath, newContent, 'utf-8');
}

/**
 * The sync command — writes compact context to all detected AI tool rules files.
 */
export async function syncCommand(
  options: { verbose?: boolean; silent?: boolean } = {},
  cwd: string = process.cwd()
): Promise<void> {
  if (!options.silent) {
    console.log(renderHeader({
      text: 'Sync Context to AI Tools',
      icon: getIcon('ai') as string,
      level: 1,
      color: getColor('primary'),
    }) + '\n');
  }

  // Build the complete context
  const context = await buildContext(cwd);
  const mergedContext = {
    global: context.global,
    profile: context.profile,
    project: context.project,
    pins: context.pins.map(p => p.fact),
  };

  // Format context — compact by default, verbose with --verbose flag
  let contextBlock: string;
  if (options.verbose) {
    contextBlock = formatContext(mergedContext);
  } else {
    contextBlock = formatCompactContext(mergedContext);
  }

  const tokens = estimateTokens(contextBlock);

  // Show what will be synced
  if (!options.silent) {
    const previewBox = renderBox(contextBlock, {
      title: `${getIcon('file')} Context to Sync (~${tokens} tokens)`,
      borderStyle: 'rounded',
      borderColor: getColor('info'),
      padding: 1,
    });
    console.log(previewBox + '\n');
  }

  // Detect tools
  let tools = await detectTools(cwd);

  // If very few tools detected, ask if user wants to add more
  const nonAlwaysTools = AI_TOOLS.filter(t => !t.alwaysAvailable);
  const detectedNames = new Set(tools.map(t => t.name));
  const undetected = nonAlwaysTools.filter(t => !detectedNames.has(t.name));

  if (undetected.length > 0 && !options.silent) {
    const { addMore } = await inquirer.prompt<{ addMore: string[] }>([
      {
        type: 'checkbox',
        name: 'addMore',
        message: 'These AI tools were not detected. Select any you want to add:',
        choices: undetected.map(t => ({ name: t.name, value: t.name })),
      },
    ]);

    if (addMore.length > 0) {
      const extraTools = AI_TOOLS.filter(t => addMore.includes(t.name));
      tools = [...tools, ...extraTools];
    }
  }

  // Write to all selected tools
  const synced: string[] = [];
  const failed: string[] = [];

  for (const tool of tools) {
    try {
      await writeToTool(tool, cwd, contextBlock);
      synced.push(tool.name);
    } catch (err) {
      failed.push(`${tool.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Display results
  if (!options.silent) {
    if (synced.length > 0) {
      const syncedList = synced.map(
        name => `  ${getIcon('success')} ${name}`
      ).join('\n');
      
      const successBox = renderBox(syncedList, {
        title: `${getIcon('success')} Synced to ${synced.length} AI Tools`,
        borderStyle: 'rounded',
        borderColor: getColor('success'),
        padding: 1,
      });
      console.log(successBox + '\n');
    }

    if (failed.length > 0) {
      const failedList = failed.map(
        msg => `  ${getIcon('error')} ${msg}`
      ).join('\n');
      
      const errorBox = renderBox(failedList, {
        title: `${getIcon('error')} Failed`,
        borderStyle: 'rounded',
        borderColor: getColor('error'),
        padding: 1,
      });
      console.log(errorBox + '\n');
    }

    // Token savings callout
    const verboseContext = formatContext(mergedContext);
    const verboseTokens = estimateTokens(verboseContext);
    const saved = verboseTokens - tokens;

    if (!options.verbose && saved > 0) {
      console.log(applyColor(
        `  🔥 Token savings: ~${tokens} tokens vs ~${verboseTokens} verbose (${Math.round((saved / verboseTokens) * 100)}% less per message)\n`,
        getColor('success')
      ));
    }

    console.log(applyColor('  Now open your project in any AI IDE — your context is auto-loaded! 🚀\n', getColor('info')));
  }
}
