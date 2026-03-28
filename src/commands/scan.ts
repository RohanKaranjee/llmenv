import { scanProject, formatScanToContext } from '../core/scanner.js';
import { readJSON, writeJSON, fileExists } from '../core/config.js';
import type { ProjectConfig } from '../types/index.js';
import { syncCommand } from './sync.js';
import { renderBox, renderHeader } from '../ui/index.js';
import { getColor, applyColor } from '../ui/core/theme.js';
import { getIcon } from '../ui/icons.js';
import path from 'path';

export async function scanCommand(cwd: string = process.cwd()): Promise<void> {
  console.log(renderHeader({
    text: 'Scanning Project Context',
    icon: '🔍',
    level: 1,
    color: getColor('primary')
  }) + '\n');

  // Check if llmenv is initialized
  const configPath = path.join(cwd, '.llmenv');
  if (!(await fileExists(configPath))) {
    console.log(applyColor('  No .llmenv file found in this directory.', getColor('error')));
    console.log(applyColor('  Run "llmenv init" first to set up the project.\n', getColor('warning')));
    return;
  }

  // Run scan
  console.log(applyColor('  Scanning package.json, tsconfig.json, and directories...', getColor('textMuted')));
  const scanResult = await scanProject(cwd);
  const contextLines = formatScanToContext(scanResult);

  if (contextLines.length === 0) {
    console.log(applyColor('  No recognizable context found. Is this a code directory?\n', getColor('warning')));
    return;
  }

  // Load existing config
  let config: ProjectConfig;
  try {
    config = await readJSON<ProjectConfig>(configPath);
  } catch {
    console.log(applyColor('  Failed to read .llmenv file.', getColor('error')));
    return;
  }

  // Update config stack with scan results
  config.stack = contextLines;
  if (scanResult.projectName) {
    config.project = scanResult.projectName;
  }

  // Save updated config
  await writeJSON(configPath, config);

  // Show success UI
  const details = contextLines.map(line => `  ${getIcon('success')} ${line}`).join('\n');
  const successBox = renderBox(details, {
    title: `${getIcon('success')} Project Context Updated`,
    borderStyle: 'rounded',
    borderColor: getColor('success'),
    padding: 1
  });

  console.log('\n' + successBox + '\n');

  // Auto-sync
  console.log(applyColor('  Auto-syncing to AI tools...', getColor('textMuted')));
  try {
    await syncCommand({ verbose: false, silent: true }, cwd);
  } catch (err) {
    // Silent fail if sync errors out
  }
}
