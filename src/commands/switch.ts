import inquirer from 'inquirer';
import chalk from 'chalk';
import { listProjects } from '../core/projects.js';
import { findProjectRoot } from '../core/context.js';

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
    console.log(chalk.yellow('No projects registered yet'));
    console.log(chalk.gray('\nRun "llmenv init" in a project directory to register it.'));
    return;
  }
  
  // Detect current project to highlight it
  const currentProjectPath = await findProjectRoot(process.cwd());
  
  // Create choices for inquirer
  const choices = projects.map(project => {
    const isCurrent = currentProjectPath === project.path;
    const label = isCurrent 
      ? `${project.name} (${project.path}) ${chalk.green('← current')}`
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
    console.log(chalk.red('❌ Error: Selected project not found'));
    return;
  }
  
  // Change working directory
  try {
    process.chdir(selectedPath);
    
    // Display confirmation
    console.log(chalk.green(`\n✓ Switched to project: ${selectedProject.name}`));
    console.log(chalk.gray(`Path: ${selectedPath}`));
  } catch (error) {
    console.log(chalk.red(`❌ Error: Failed to change directory to ${selectedPath}`));
    if (error instanceof Error) {
      console.log(chalk.gray(error.message));
    }
  }
}
