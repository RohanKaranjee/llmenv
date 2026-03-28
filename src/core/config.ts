import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { ConfigError } from '../types/errors.js';
import type { GlobalIdentity, Profile, ProjectEntry, Pin } from '../types/index.js';

/**
 * Get the llmenv configuration directory path.
 * 
 * Returns the absolute path to the llmenv configuration directory.
 * Supports LLMENV_HOME environment variable override for testing purposes.
 * 
 * @returns Absolute path to the config directory (default: ~/.llmenv)
 * 
 * @example
 * ```typescript
 * const configDir = getConfigDir();
 * // Returns: '/home/user/.llmenv' on Linux
 * // Returns: 'C:\Users\user\.llmenv' on Windows
 * ```
 */
export function getConfigDir(): string {
  // Support LLMENV_HOME override for testing
  if (process.env.LLMENV_HOME) {
    return path.resolve(process.env.LLMENV_HOME);
  }
  
  // Default to ~/.llmenv
  return path.join(os.homedir(), '.llmenv');
}

/**
 * Get the path to the default global identity configuration file.
 * 
 * Returns the absolute path to the file containing the user's global
 * identity configuration (name, role, experience, preferences, etc.).
 * 
 * @returns Absolute path to ~/.llmenv/default.json
 * 
 * @example
 * ```typescript
 * const defaultPath = getDefaultConfigPath();
 * const identity = await readJSON<GlobalIdentity>(defaultPath);
 * ```
 */
export function getDefaultConfigPath(): string {
  return path.join(getConfigDir(), 'default.json');
}

/**
 * Get the path to the active profile file.
 * 
 * Returns the absolute path to the file containing the name of the
 * currently active profile (e.g., 'work', 'build', 'personal', 'learn').
 * 
 * @returns Absolute path to ~/.llmenv/active
 * 
 * @example
 * ```typescript
 * const activePath = getActiveProfilePath();
 * const profileName = await fs.readFile(activePath, 'utf-8');
 * console.log(`Active profile: ${profileName.trim()}`);
 * ```
 */
export function getActiveProfilePath(): string {
  return path.join(getConfigDir(), 'active');
}

/**
 * Get the path to a specific profile configuration file.
 * 
 * Returns the absolute path to a profile configuration file by name.
 * Profiles define context modes like work, build, personal, or learn.
 * 
 * @param profileName - Name of the profile (e.g., 'work', 'build', 'personal', 'learn')
 * @returns Absolute path to ~/.llmenv/profiles/{profileName}.json
 * 
 * @example
 * ```typescript
 * const workProfilePath = getProfilePath('work');
 * const profile = await readJSON<Profile>(workProfilePath);
 * console.log(`Focus: ${profile.focus}`);
 * ```
 */
export function getProfilePath(profileName: string): string {
  return path.join(getConfigDir(), 'profiles', `${profileName}.json`);
}

/**
 * Get the path to the projects registry file.
 * 
 * Returns the absolute path to the file containing the list of all
 * registered projects with their paths and metadata.
 * 
 * @returns Absolute path to ~/.llmenv/projects.json
 * 
 * @example
 * ```typescript
 * const projectsPath = getProjectsPath();
 * const projects = await readJSON<ProjectEntry[]>(projectsPath, []);
 * console.log(`Found ${projects.length} registered projects`);
 * ```
 */
export function getProjectsPath(): string {
  return path.join(getConfigDir(), 'projects.json');
}

/**
 * Get the path to the pins file.
 * 
 * Returns the absolute path to the file containing all pinned facts.
 * Pins are persistent facts that get injected into every AI prompt.
 * 
 * @returns Absolute path to ~/.llmenv/pins.json
 * 
 * @example
 * ```typescript
 * const pinsPath = getPinsPath();
 * const pins = await readJSON<Pin[]>(pinsPath, []);
 * console.log(`Found ${pins.length} pins`);
 * ```
 */
export function getPinsPath(): string {
  return path.join(getConfigDir(), 'pins.json');
}

/**
 * Get the path to the AI settings file.
 * 
 * Returns the absolute path to the file containing AI provider settings
 * (provider type and API key).
 * 
 * @returns Absolute path to ~/.llmenv/settings.json
 * 
 * @example
 * ```typescript
 * const settingsPath = getSettingsPath();
 * const settings = await readJSON<AISettings>(settingsPath);
 * console.log(`Provider: ${settings.provider}`);
 * ```
 */
export function getSettingsPath(): string {
  return path.join(getConfigDir(), 'settings.json');
}

/**
 * Get the path to a project's decision history file.
 * 
 * Returns the absolute path to the file containing the decision history
 * for a specific project. Each project has its own history file.
 * 
 * @param projectName - Name of the project
 * @returns Absolute path to ~/.llmenv/history/{projectName}.json
 * 
 * @example
 * ```typescript
 * const historyPath = getHistoryPath('my-app');
 * const history = await readJSON<HistoryEntry[]>(historyPath, []);
 * console.log(`Found ${history.length} history entries`);
 * ```
 */
export function getHistoryPath(projectName: string): string {
  return path.join(getConfigDir(), 'history', `${projectName}.json`);
}

/**
 * Ensure the main config directory exists.
 * 
 * Creates the ~/.llmenv directory if it doesn't exist. Uses recursive
 * creation to handle missing parent directories.
 * 
 * @throws {ConfigError} If directory creation fails due to permissions or other errors
 * 
 * @example
 * ```typescript
 * await ensureConfigDir();
 * // ~/.llmenv now exists
 * ```
 */
export async function ensureConfigDir(): Promise<void> {
  const configDir = getConfigDir();
  try {
    await fs.mkdir(configDir, { recursive: true });
  } catch (error) {
    throw new ConfigError(
      `Failed to create config directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
      configDir
    );
  }
}

/**
 * Ensure a directory exists, creating it and any parent directories if needed.
 * 
 * Creates the specified directory using recursive creation. If the directory
 * already exists, this function does nothing.
 * 
 * @param dirPath - Absolute path to the directory to create
 * @throws {ConfigError} If directory creation fails due to permissions or other errors
 * 
 * @example
 * ```typescript
 * await ensureDir('/home/user/.llmenv/history');
 * // Directory and all parent directories now exist
 * ```
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    throw new ConfigError(
      `Failed to create directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
      dirPath
    );
  }
}

/**
 * Check if a file exists at the specified path.
 * 
 * Uses fs.access() to check file existence without reading the file.
 * Returns false for any access errors (file not found, permissions, etc.).
 * 
 * @param filePath - Absolute path to the file to check
 * @returns Promise resolving to true if file exists and is accessible, false otherwise
 * 
 * @example
 * ```typescript
 * if (await fileExists('/path/to/file.json')) {
 *   console.log('File exists');
 * }
 * ```
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read and parse a JSON file with optional default value.
 * 
 * Reads a JSON file and parses it into the specified type. If the file
 * doesn't exist and a default value is provided, returns the default.
 * Uses UTF-8 encoding for all reads.
 * 
 * @param filePath - Absolute path to the JSON file to read
 * @param defaultValue - Value to return if file doesn't exist (optional)
 * @returns Promise resolving to parsed JSON data or default value
 * @throws {ConfigError} If file exists but contains invalid JSON or read fails
 * 
 * @example
 * ```typescript
 * // With default value
 * const pins = await readJSON<Pin[]>('/path/to/pins.json', []);
 * 
 * // Without default (throws if file doesn't exist)
 * const config = await readJSON<ProjectConfig>('/path/to/.llmenv');
 * ```
 */
export async function readJSON<T>(filePath: string, defaultValue?: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    // If file doesn't exist and we have a default value, return it
    if ((error as NodeJS.ErrnoException).code === 'ENOENT' && defaultValue !== undefined) {
      return defaultValue;
    }
    
    // If it's a JSON parse error, throw a descriptive error
    if (error instanceof SyntaxError) {
      throw new ConfigError(
        `Invalid JSON in file: ${error.message}`,
        filePath
      );
    }
    
    // For other errors, throw with context
    throw new ConfigError(
      `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      filePath
    );
  }
}

/**
 * Write data to a JSON file with 2-space indentation.
 * 
 * Serializes data to JSON with 2-space indentation for readability and
 * writes it to the specified file. Creates parent directories automatically
 * if they don't exist. Uses UTF-8 encoding.
 * 
 * @param filePath - Absolute path to the JSON file to write
 * @param data - Data to serialize and write (will be JSON.stringify'd)
 * @throws {ConfigError} If write operation or directory creation fails
 * 
 * @example
 * ```typescript
 * const config = { project: 'my-app', stack: ['Node.js', 'TypeScript'] };
 * await writeJSON('/path/to/.llmenv', config);
 * // File now contains formatted JSON with 2-space indentation
 * ```
 */
export async function writeJSON<T>(filePath: string, data: T): Promise<void> {
  try {
    // Ensure parent directory exists
    const parentDir = path.dirname(filePath);
    await ensureDir(parentDir);
    
    // Write JSON with 2-space indentation
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, content, 'utf-8');
  } catch (error) {
    throw new ConfigError(
      `Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      filePath
    );
  }
}
/**
 * Initialize the llmenv configuration directory structure.
 * 
 * Creates the complete ~/.llmenv/ directory structure with all required
 * files and default configurations. This includes:
 * - Main config directory (~/.llmenv/)
 * - Profiles directory with default profiles (work, build, personal, learn)
 * - History directory for decision logs
 * - Default global identity (default.json)
 * - Empty projects registry (projects.json)
 * - Empty pins list (pins.json)
 * - Active profile file (active) set to 'work'
 * 
 * Only creates files that don't already exist, so it's safe to call multiple times.
 * 
 * @throws {ConfigError} If initialization fails due to permissions or other errors
 * 
 * @example
 * ```typescript
 * await initializeConfig();
 * // ~/.llmenv/ now exists with all required files
 * ```
 */
export async function initializeConfig(): Promise<void> {
  // Ensure main config directory exists
  await ensureConfigDir();
  
  // Create profiles directory
  const profilesDir = path.join(getConfigDir(), 'profiles');
  await ensureDir(profilesDir);
  
  // Create history directory
  const historyDir = path.join(getConfigDir(), 'history');
  await ensureDir(historyDir);
  
  // Create default.json if it doesn't exist
  const defaultConfigPath = getDefaultConfigPath();
  if (!(await fileExists(defaultConfigPath))) {
    const defaultIdentity: GlobalIdentity = {
      name: "Your Name",
      role: "Developer",
      experience: "X years",
      preferences: [
        "TypeScript",
        "Functional programming",
        "Minimal dependencies"
      ],
      communication: "Concise, technical, with examples"
    };
    await writeJSON(defaultConfigPath, defaultIdentity);
  }
  
  // Create profile files if they don't exist
  const profiles: Profile[] = [
    {
      name: "build",
      focus: "Ship production-ready code fast",
      priorities: [
        "Working code over explanations",
        "Performance and security"
      ],
      constraints: [
        "Include error handling by default",
        "Do not explain code unless asked"
      ],
      tone: "Direct and code-first"
    },
    {
      name: "review",
      focus: "Code Review & Auditing",
      priorities: [
        "Security vulnerabilities",
        "Performance bottlenecks",
        "Accessibility (a11y)"
      ],
      constraints: [
        "Format review as a checklist",
        "Point out edge cases"
      ],
      tone: "Critical and thorough"
    },
    {
      name: "debug",
      focus: "Bug hunting and fixing",
      priorities: [
        "Root cause analysis",
        "Fixing the bug with minimum side-effects"
      ],
      constraints: [
        "Think step-by-step",
        "Check types, null values, and race conditions",
        "Show the fix as a diff"
      ],
      tone: "Analytical and precise"
    },
    {
      name: "learn",
      focus: "Tutorials and documentation",
      priorities: [
        "Breaking down the WHY, not just the HOW",
        "Mental models and analogies"
      ],
      constraints: [
        "Explain like I am learning",
        "Do not just give the code"
      ],
      tone: "Patient and educational"
    },
    {
      name: "refactor",
      focus: "Improving existing code",
      priorities: [
        "DRY (Don't Repeat Yourself)",
        "Single Responsibility Principle",
        "Testability"
      ],
      constraints: [
        "Show before and after",
        "Do not change the underlying logic/behavior"
      ],
      tone: "Architectural and clean"
    }
  ];
  
  for (const profile of profiles) {
    const profilePath = getProfilePath(profile.name);
    if (!(await fileExists(profilePath))) {
      await writeJSON(profilePath, profile);
    }
  }
  
  // Create projects.json if it doesn't exist
  const projectsPath = getProjectsPath();
  if (!(await fileExists(projectsPath))) {
    const emptyProjects: ProjectEntry[] = [];
    await writeJSON(projectsPath, emptyProjects);
  }
  
  // Create pins.json if it doesn't exist
  const pinsPath = getPinsPath();
  if (!(await fileExists(pinsPath))) {
    const emptyPins: Pin[] = [];
    await writeJSON(pinsPath, emptyPins);
  }
  
  // Create active file if it doesn't exist
  const activePath = getActiveProfilePath();
  if (!(await fileExists(activePath))) {
    await fs.writeFile(activePath, 'work', 'utf-8');
  }
}
