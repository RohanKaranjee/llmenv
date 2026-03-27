import { randomUUID } from 'crypto';
import { getPinsPath, readJSON, writeJSON } from './config.js';
import type { Pin } from '../types/index.js';

/**
 * Add a new pin with a generated UUID v4 and current timestamp.
 * 
 * Creates a new pin with a unique ID (UUID v4), the provided fact text,
 * and the current timestamp in ISO 8601 format. Appends the pin to
 * ~/.llmenv/pins.json. Creates the file if it doesn't exist.
 * 
 * @param fact - The fact text to pin (will be injected into all AI prompts)
 * @returns Promise resolving to the created Pin object with id, fact, and createdAt
 * @throws {ConfigError} If file operations fail
 * 
 * @example
 * ```typescript
 * const pin = await addPin('Always use TypeScript strict mode');
 * console.log(`Pin created with ID: ${pin.id}`);
 * console.log(`Created at: ${pin.createdAt}`);
 * ```
 */
export async function addPin(fact: string): Promise<Pin> {
  const pinsPath = getPinsPath();
  
  // Read existing pins (or empty array if file doesn't exist)
  const pins = await readJSON<Pin[]>(pinsPath, []);
  
  // Create new pin with UUID v4 and ISO 8601 timestamp
  const newPin: Pin = {
    id: randomUUID(),
    fact,
    createdAt: new Date().toISOString()
  };
  
  // Append to pins array
  pins.push(newPin);
  
  // Write back to file
  await writeJSON(pinsPath, pins);
  
  return newPin;
}

/**
 * List all pins in chronological order (oldest first).
 * 
 * Reads all pins from ~/.llmenv/pins.json and returns them in chronological
 * order. Returns an empty array if the pins file doesn't exist. Pins are
 * stored in chronological order, so no sorting is needed.
 * 
 * @returns Promise resolving to array of all pins sorted by creation date (oldest first)
 * @throws {ConfigError} If file read operations fail or JSON is invalid
 * 
 * @example
 * ```typescript
 * const pins = await listPins();
 * console.log(`Found ${pins.length} pins`);
 * pins.forEach(pin => {
 *   console.log(`${pin.id.substring(0, 8)}: ${pin.fact}`);
 * });
 * ```
 */
export async function listPins(): Promise<Pin[]> {
  const pinsPath = getPinsPath();
  
  // Read pins (or empty array if file doesn't exist)
  const pins = await readJSON<Pin[]>(pinsPath, []);
  
  // Return in chronological order (oldest first)
  // Pins are already stored in chronological order since we append
  return pins;
}

/**
 * Get a specific pin by its ID.
 * 
 * Searches for a pin with the specified UUID in ~/.llmenv/pins.json.
 * Returns null if no pin with the given ID is found.
 * 
 * @param id - The UUID of the pin to retrieve (full UUID or first 8 characters)
 * @returns Promise resolving to the Pin object if found, null otherwise
 * @throws {ConfigError} If file read operations fail or JSON is invalid
 * 
 * @example
 * ```typescript
 * const pin = await getPin('a1b2c3d4');
 * if (pin) {
 *   console.log(`Found pin: ${pin.fact}`);
 * } else {
 *   console.log('Pin not found');
 * }
 * ```
 */
export async function getPin(id: string): Promise<Pin | null> {
  const pins = await listPins();
  
  const pin = pins.find(p => p.id === id);
  return pin || null;
}

/**
 * Remove a pin by its ID.
 * 
 * Searches for a pin with the specified UUID in ~/.llmenv/pins.json and
 * removes it if found. Writes the updated pins list back to the file.
 * 
 * @param id - The UUID of the pin to remove (must be exact match)
 * @returns Promise resolving to true if pin was removed, false if pin was not found
 * @throws {ConfigError} If file operations fail
 * 
 * @example
 * ```typescript
 * const removed = await removePin('a1b2c3d4-5678-90ab-cdef-1234567890ab');
 * if (removed) {
 *   console.log('Pin removed successfully');
 * } else {
 *   console.log('Pin not found');
 * }
 * ```
 */
export async function removePin(id: string): Promise<boolean> {
  const pinsPath = getPinsPath();
  
  // Read existing pins
  const pins = await readJSON<Pin[]>(pinsPath, []);
  
  // Find the pin index
  const index = pins.findIndex(p => p.id === id);
  
  // If not found, return false
  if (index === -1) {
    return false;
  }
  
  // Remove the pin
  pins.splice(index, 1);
  
  // Write back to file
  await writeJSON(pinsPath, pins);
  
  return true;
}
