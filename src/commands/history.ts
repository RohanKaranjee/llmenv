import path from 'path';
import { findProjectRoot } from '../core/context.js';
import { getHistory } from '../core/history.js';
import { formatHistory } from '../utils/formatters.js';
import { ProjectNotFoundError } from '../types/errors.js';

/**
 * Display the decision history for the current project.
 * 
 * Performs auto-detection to find the current project, then retrieves
 * and displays all logged AI decisions with timestamps, prompts, and responses.
 * 
 * Requirements:
 * - 9.1: Perform auto-detection to find current project
 * - 9.2: Error if no project detected
 * - 9.3: Call getHistory() to retrieve entries
 * - 9.4: Display "No decision history for this project" if empty
 * - 9.5: Format with timestamp, prompt, response summary
 * - 9.6: Sort by timestamp descending
 * 
 * @param cwd - Current working directory (defaults to process.cwd())
 * @throws {ProjectNotFoundError} If no project is detected in the current directory
 */
export async function historyCommand(cwd: string = process.cwd()): Promise<void> {
  // Requirement 9.1: Perform auto-detection to find current project
  const projectPath = await findProjectRoot(cwd);
  
  // Requirement 9.2: Error if no project detected
  if (!projectPath) {
    throw new ProjectNotFoundError('Not in a project directory');
  }
  
  // Extract project name from the project path (last directory name)
  // Use path.basename for cross-platform compatibility
  const projectName = path.basename(projectPath);
  
  // Requirement 9.3: Call getHistory() to retrieve entries
  const history = await getHistory(projectName);
  
  // Requirement 9.4, 9.5, 9.6: Format and display history
  // formatHistory handles empty history, formatting, and sorting
  const formattedHistory = formatHistory(history);
  console.log(formattedHistory);
  console.log(); // Empty line for spacing
}
