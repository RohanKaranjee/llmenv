import inquirer from 'inquirer';
import { listProjects } from '../core/projects.js';
import { findProjectRoot } from '../core/context.js';
import { renderBox, renderHeader, renderEmptyState } from '../ui/index.js';
import { getColor, applyColor } from '../ui/core/theme.js';
import { getIcon } from '../ui/icons.js';

/**
 * Interactive project switcher.
 * 
 * Displays a list of all registered projects from ~/.llmenv/projects.json
 * and allows the user to select one. Changes the working directory to the
 * selected project path using process.chdir(). Highlights the currently
 * detected project if applicable.
 * 
 * Displays "No projects registered yet" if the registry is empty.
 * 
 * @throws {ConfigError} If registry file operations fail or JSON is invalid
 * 
 * @example
 * ```typescript
 * await switchCommand();
 * // User is prompted to select a project from the list
 * // Working directory is changed to the selected project
 * // Output: ✓ Switched to project: my-app
 * //         Path: /home/user/projects/my-app
 * ```
 */
export async function switchCommand(): Promise<void> {
  // Get all registered projects
  const projects = await listProjects();
  
  // Check if there are any projects
  if (projects.length === 0) {
    console.log(renderEmptyState({
      icon: getIcon('project') as string,
      message: 'No projects registered yet',
      suggestion: 'Run "llmenv init" in a project directory to register it.'
    }));
    return;
  }
  
  console.log(renderHeader({ text: 'Switch Project', icon: getIcon('project') as string, level: 1 }) + '\n');
  
  // Detect current project to highlight it
  const currentProjectPath = await findProjectRoot(process.cwd());
  
  // Create choices for inquirer
  const choices = projects.map(project => {
    const isCurrent = currentProjectPath === project.path;
    const label = isCurrent 
      ? `${project.name} (${project.path}) ${applyColor('← current', getColor('success'))}`
      : `${project.name} (${project.path})`;
    
    return {
      name: label,
      value: project.path,
      short: project.name
    };
  });
  
  // Prompt user to select a project
  const answers = await inquirer.prompt<{
    projectPath: string;
  }>([
    {
      type: 'list',
      name: 'projectPath',
      message: 'Select a project:',
      choices,
      pageSize: 10
    }
  ]);
  
  const selectedPath = answers.projectPath;
  const selectedProject = projects.find(p => p.path === selectedPath);
  
  if (!selectedProject) {
    const errorBox = renderBox(applyColor('Selected project not found', getColor('error')), {
      title: `${getIcon('error')} Error`,
      borderStyle: 'rounded',
      borderColor: getColor('error'),
      padding: 1
    });
    console.log('\n' + errorBox);
    return;
  }
  
  const instruction = [
    applyColor('To switch to this project directory, run:', getColor('textBright')),
    '',
    applyColor(`cd "${selectedPath}"`, getColor('info'))
  ].join('\n');
  
  const successBox = renderBox(instruction, {
    title: `${getIcon('success')} Selected: ${selectedProject.name}`,
    borderStyle: 'rounded',
    borderColor: getColor('success'),
    padding: 1
  });
  
  console.log('\n' + successBox + '\n');
}
