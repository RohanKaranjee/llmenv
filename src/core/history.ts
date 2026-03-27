import { getHistoryPath, readJSON, writeJSON } from './config.js';
import type { HistoryEntry } from '../types/index.js';

/**
 * Log a decision to the project's history file.
 * 
 * Appends a new entry with timestamp, prompt, response, and provider to the
 * project's history file at ~/.llmenv/history/{projectName}.json. Creates
 * the history file if it doesn't exist. Timestamps are in ISO 8601 format.
 * 
 * @param projectName - Name of the project (used to determine history file name)
 * @param prompt - The user's prompt/question sent to the AI
 * @param response - The AI's response text
 * @param provider - The AI provider used ('openai' or 'claude')
 * @throws {ConfigError} If file write operations fail
 * 
 * @example
 * ```typescript
 * await logDecision(
 *   'my-app',
 *   'How should I structure my API?',
 *   'Consider using REST with...',
 *   'openai'
 * );
 * ```
 */
export async function logDecision(
  projectName: string,
  prompt: string,
  response: string,
  provider: 'openai' | 'claude'
): Promise<void> {
  const historyPath = getHistoryPath(projectName);
  
  // Read existing history or start with empty array
  const history = await readJSON<HistoryEntry[]>(historyPath, []);
  
  // Create new history entry
  const entry: HistoryEntry = {
    timestamp: new Date().toISOString(),
    prompt,
    response,
    provider
  };
  
  // Append to history
  history.push(entry);
  
  // Write back to file
  await writeJSON(historyPath, history);
}

/**
 * Get the decision history for a project.
 * 
 * Reads all history entries from ~/.llmenv/history/{projectName}.json and
 * returns them sorted by timestamp in descending order (most recent first).
 * Returns an empty array if the history file doesn't exist.
 * 
 * @param projectName - Name of the project to retrieve history for
 * @returns Promise resolving to array of history entries sorted by timestamp descending
 * @throws {ConfigError} If file read operations fail or JSON is invalid
 * 
 * @example
 * ```typescript
 * const history = await getHistory('my-app');
 * console.log(`Found ${history.length} history entries`);
 * history.forEach(entry => {
 *   console.log(`${entry.timestamp}: ${entry.prompt}`);
 * });
 * ```
 */
export async function getHistory(projectName: string): Promise<HistoryEntry[]> {
  const historyPath = getHistoryPath(projectName);
  
  // Read history (or empty array if file doesn't exist)
  const history = await readJSON<HistoryEntry[]>(historyPath, []);
  
  // Sort by timestamp descending (most recent first)
  return history.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA;
  });
}
