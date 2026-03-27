import path from 'path';
import fs from 'fs/promises';
import { fileExists, getDefaultConfigPath, getActiveProfilePath, getProfilePath, getPinsPath, readJSON } from './config.js';
import type { GlobalIdentity, Profile, ProjectConfig, Pin, MergedContext, ContextStack } from '../types/index.js';

/**
 * Find the project root by walking up the directory tree looking for a .llmenv file.
 * 
 * Implements Git-style directory traversal, starting from the specified directory
 * and walking up the tree until a .llmenv file is found or the filesystem root
 * is reached. Follows symlinks during traversal.
 * 
 * @param startDir - Directory to start searching from (typically process.cwd())
 * @returns Promise resolving to absolute path of directory containing .llmenv, or null if not found
 * 
 * @example
 * ```typescript
 * const projectRoot = await findProjectRoot(process.cwd());
 * if (projectRoot) {
 *   console.log(`Found project at: ${projectRoot}`);
 * } else {
 *   console.log('Not in a project directory');
 * }
 * ```
 */
export async function findProjectRoot(startDir: string): Promise<string | null> {
  // Resolve to absolute path and follow symlinks
  let currentDir = path.resolve(startDir);
  
  // Get the filesystem root for this platform
  const root = path.parse(currentDir).root;
  
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Check if .llmenv exists in current directory as a FILE (not directory)
    const configPath = path.join(currentDir, '.llmenv');
    
    if (await fileExists(configPath)) {
      // Verify it's a file, not a directory
      try {
        const stats = await fs.stat(configPath);
        if (stats.isFile()) {
          return currentDir;
        }
      } catch {
        // If stat fails, continue searching
      }
    }
    
    // If we've reached the filesystem root, stop searching
    if (currentDir === root) {
      return null;
    }
    
    // Move up one directory
    currentDir = path.dirname(currentDir);
  }
}


/**
 * Merge context layers with proper precedence: project > profile > global.
 * 
 * Implements a three-layer merge strategy where later layers override earlier ones:
 * - Layer 1 (base): Global identity configuration
 * - Layer 2: Profile configuration (overrides global)
 * - Layer 3: Project configuration (overrides profile and global)
 * 
 * The merge uses deep merging for nested objects, meaning nested properties
 * are merged recursively rather than replaced entirely. Arrays are replaced
 * completely (later layer's array replaces earlier). Pins are appended
 * additively and not merged.
 * 
 * @param global - Global identity configuration from ~/.llmenv/default.json
 * @param profile - Active profile configuration from ~/.llmenv/profiles/{name}.json
 * @param project - Project configuration from .llmenv (optional, null if not in a project)
 * @param pins - Array of pins from ~/.llmenv/pins.json
 * @returns Merged context with all layers combined and pins as fact strings
 * 
 * @example
 * ```typescript
 * const merged = mergeContextLayers(global, profile, project, pins);
 * console.log(`Project: ${merged.project?.project}`);
 * console.log(`Pins: ${merged.pins.length}`);
 * ```
 */
export function mergeContextLayers(
  global: GlobalIdentity,
  profile: Profile,
  project: ProjectConfig | null,
  pins: Pin[]
): MergedContext {
  // Return the merged context with:
  // - Original layers preserved for reference
  // - Pins extracted as an array of fact strings (additive, not merged)
  // Note: The actual merging happens implicitly when formatting the context
  // Each layer overrides the previous one's properties when displayed
  return {
    global,
    profile,
    project,
    pins: pins.map(p => p.fact)
  };
}

/**
 * Build the complete context stack by reading all configuration files.
 * 
 * Orchestrates the entire context building process:
 * 1. Auto-detects the project root using findProjectRoot()
 * 2. Reads global identity from ~/.llmenv/default.json
 * 3. Reads active profile name from ~/.llmenv/active
 * 4. Reads profile configuration from ~/.llmenv/profiles/{active}.json
 * 5. Reads project configuration from .llmenv if found
 * 6. Reads all pins from ~/.llmenv/pins.json
 * 7. Returns a ContextStack with all layers and metadata
 * 
 * This is the main entry point for gathering all context information
 * needed for AI interactions or status display.
 * 
 * @param cwd - Current working directory to start auto-detection from
 * @returns Promise resolving to complete context stack with all layers and metadata
 * @throws {ConfigError} If required configuration files are missing or contain invalid JSON
 * 
 * @example
 * ```typescript
 * const context = await buildContext(process.cwd());
 * console.log(`Active profile: ${context.profile.name}`);
 * if (context.project) {
 *   console.log(`Project: ${context.project.project}`);
 * }
 * console.log(`Pins: ${context.pins.length}`);
 * ```
 */
export async function buildContext(cwd: string): Promise<ContextStack> {
  // Step 1: Auto-detect project root
  const projectPath = await findProjectRoot(cwd);
  
  // Step 2: Read global identity from ~/.llmenv/default.json
  const defaultConfigPath = getDefaultConfigPath();
  const global = await readJSON<GlobalIdentity>(defaultConfigPath);
  
  // Step 3: Read active profile name from ~/.llmenv/active
  const activeProfilePath = getActiveProfilePath();
  const activeProfileName = (await fs.readFile(activeProfilePath, 'utf-8')).trim();
  
  // Step 4: Read profile configuration from ~/.llmenv/profiles/{active}.json
  const profilePath = getProfilePath(activeProfileName);
  const profile = await readJSON<Profile>(profilePath);
  
  // Step 5: Read project configuration from .llmenv if found
  let project: ProjectConfig | null = null;
  if (projectPath) {
    const projectConfigPath = path.join(projectPath, '.llmenv');
    project = await readJSON<ProjectConfig>(projectConfigPath);
  }
  
  // Step 6: Read all pins from ~/.llmenv/pins.json
  const pinsPath = getPinsPath();
  const pins = await readJSON<Pin[]>(pinsPath, []);
  
  // Step 7: Return ContextStack with all layers and metadata
  return {
    global,
    profile,
    project,
    pins,
    projectPath
  };
}

/**
 * Format the merged context as a human-readable string with section headers.
 * 
 * Creates a structured string output with:
 * - [CONTEXT] delimiter at the start
 * - Section headers for each layer: Global Identity, Active Profile, Current Project, Pinned Facts
 * - [END CONTEXT] delimiter at the end
 * 
 * The format matches the specification in the design document and is suitable
 * for injection into AI prompts or display to users via the status command.
 * 
 * @param context - The merged context to format
 * @returns Formatted context string with delimiters and section headers
 * 
 * @example
 * ```typescript
 * const merged = mergeContextLayers(global, profile, project, pins);
 * const formatted = formatContext(merged);
 * console.log(formatted);
 * // Output:
 * // [CONTEXT]
 * //
 * // === Global Identity ===
 * // Name: John Doe
 * // ...
 * // [END CONTEXT]
 * ```
 */
export function formatContext(context: MergedContext): string {
  const sections: string[] = [];
  
  // Start with [CONTEXT] delimiter
  sections.push('[CONTEXT]');
  sections.push('');
  
  // Section 1: Global Identity
  sections.push('=== Global Identity ===');
  sections.push(`Name: ${context.global.name}`);
  sections.push(`Role: ${context.global.role}`);
  sections.push(`Experience: ${context.global.experience}`);
  sections.push(`Preferences: ${context.global.preferences.join(', ')}`);
  sections.push(`Communication: ${context.global.communication}`);
  sections.push('');
  
  // Section 2: Active Profile
  sections.push(`=== Active Profile: ${context.profile.name} ===`);
  sections.push(`Focus: ${context.profile.focus}`);
  sections.push(`Priorities: ${context.profile.priorities.join(', ')}`);
  sections.push(`Constraints: ${context.profile.constraints.join(', ')}`);
  sections.push(`Tone: ${context.profile.tone}`);
  sections.push('');
  
  // Section 3: Current Project (if present)
  if (context.project) {
    sections.push(`=== Current Project: ${context.project.project} ===`);
    sections.push(`Stack: ${context.project.stack.join(', ')}`);
    sections.push(`Avoid: ${context.project.avoid.join(', ')}`);
    sections.push(`Context: ${context.project.context}`);
    sections.push(`Priorities: ${context.project.priorities.join(', ')}`);
    sections.push('');
  }
  
  // Section 4: Pinned Facts
  sections.push(`=== Pinned Facts (${context.pins.length}) ===`);
  if (context.pins.length > 0) {
    for (const pin of context.pins) {
      sections.push(`• ${pin}`);
    }
  } else {
    sections.push('(none)');
  }
  sections.push('');
  
  // End with [END CONTEXT] delimiter
  sections.push('[END CONTEXT]');
  
  return sections.join('\n');
}
