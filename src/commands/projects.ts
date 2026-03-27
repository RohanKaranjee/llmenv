import { listProjects } from '../core/projects.js';
import { formatProjectList } from '../utils/formatters.js';

/**
 * Display all registered projects in a formatted table.
 * 
 * Retrieves all projects from ~/.llmenv/projects.json and displays them
 * in a formatted table showing project name, path, and last active timestamp.
 * Projects are sorted by last active descending (most recent first).
 * Displays "No projects registered yet" if the list is empty.
 * 
 * @throws {ConfigError} If registry file operations fail or JSON is invalid
 * 
 * @example
 * ```typescript
 * await projectsCommand();
 * // Output:
 * // 📁 Registered Projects (2)
 * //
 * // my-app        /home/user/projects/my-app        2024-01-15T10:30:00.000Z
 * // old-project   /home/user/projects/old-project   2024-01-10T08:15:00.000Z
 * ```
 */
export async function projectsCommand(): Promise<void> {
  // Get all projects sorted by last active
  const projects = await listProjects();
  
  // Format and display the project list
  const formatted = formatProjectList(projects);
  console.log(formatted);
  console.log(); // Empty line for spacing
}
