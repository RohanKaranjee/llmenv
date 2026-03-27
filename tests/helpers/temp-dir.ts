import os from 'os';
import path from 'path';
import fs from 'fs/promises';

/**
 * Creates a temporary directory for testing
 * @param prefix Optional prefix for the directory name
 * @returns Absolute path to the created temporary directory
 */
export async function createTempDir(prefix: string = 'llmenv-test'): Promise<string> {
  const tempDir = path.join(os.tmpdir(), `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`);
  await fs.mkdir(tempDir, { recursive: true });
  return tempDir;
}

/**
 * Removes a temporary directory and all its contents
 * @param dirPath Path to the directory to remove
 */
export async function cleanupTempDir(dirPath: string): Promise<void> {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors - directory might not exist or already be deleted
  }
}

/**
 * Creates a temporary directory with automatic cleanup
 * Returns a tuple of [dirPath, cleanup function]
 * @param prefix Optional prefix for the directory name
 */
export async function withTempDir(prefix?: string): Promise<[string, () => Promise<void>]> {
  const dirPath = await createTempDir(prefix);
  const cleanup = async () => await cleanupTempDir(dirPath);
  return [dirPath, cleanup];
}

/**
 * Sets up LLMENV_HOME environment variable to point to a temporary directory
 * Returns the temp directory path and a cleanup function
 */
export async function setupTempLLMEnvHome(): Promise<[string, () => Promise<void>]> {
  const originalEnv = process.env.LLMENV_HOME;
  const tempDir = await createTempDir('llmenv-home');
  process.env.LLMENV_HOME = tempDir;

  const cleanup = async () => {
    if (originalEnv === undefined) {
      delete process.env.LLMENV_HOME;
    } else {
      process.env.LLMENV_HOME = originalEnv;
    }
    await cleanupTempDir(tempDir);
  };

  return [tempDir, cleanup];
}

/**
 * Creates a nested directory structure for testing
 * @param baseDir Base directory to create structure in
 * @param depth Number of nested levels to create
 * @returns Path to the deepest directory
 */
export async function createNestedDirs(baseDir: string, depth: number): Promise<string> {
  let currentPath = baseDir;
  for (let i = 0; i < depth; i++) {
    currentPath = path.join(currentPath, `level${i}`);
    await fs.mkdir(currentPath, { recursive: true });
  }
  return currentPath;
}

/**
 * Creates a file with content in a temporary directory
 * Creates parent directories if they don't exist
 * @param dirPath Base directory
 * @param filePath Relative file path from base directory
 * @param content File content
 */
export async function createTempFile(
  dirPath: string,
  filePath: string,
  content: string
): Promise<string> {
  const fullPath = path.join(dirPath, filePath);
  const dir = path.dirname(fullPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(fullPath, content, 'utf-8');
  return fullPath;
}

/**
 * Creates a JSON file in a temporary directory
 * @param dirPath Base directory
 * @param filePath Relative file path from base directory
 * @param data Data to write as JSON
 */
export async function createTempJsonFile(
  dirPath: string,
  filePath: string,
  data: any
): Promise<string> {
  return createTempFile(dirPath, filePath, JSON.stringify(data, null, 2));
}
