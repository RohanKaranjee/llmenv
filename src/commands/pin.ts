import { addPin, listPins, removePin } from '../core/pins.js';
import { formatPinList } from '../utils/formatters.js';
import { ValidationError } from '../types/errors.js';
import { renderBox } from '../ui/index.js';
import { getColor, applyColor } from '../ui/core/theme.js';
import { getIcon } from '../ui/icons.js';
import { syncCommand } from './sync.js';

/**
 * Add a new pin with the provided fact text.
 * 
 * Creates a new pin with a unique ID (UUID v4) and the provided fact text.
 * Displays a confirmation message with the pin ID (first 8 characters).
 * Validates that the fact is not empty or whitespace.
 * 
 * @param fact - The fact text to pin (will be injected into all AI prompts)
 * @throws {ValidationError} If fact is empty or whitespace after trim
 * @throws {ConfigError} If file operations fail
 * 
 * @example
 * ```typescript
 * await pinCommand('Always use TypeScript strict mode');
 * // Output: ✓ Pin added: a1b2c3d4
 * //         Always use TypeScript strict mode
 * ```
 */
export async function pinCommand(fact: string, options: { learn?: boolean; scope?: string } = {}): Promise<void> {
  // Validate fact is not empty
  let trimmedFact = fact.trim();
  if (trimmedFact.length === 0) {
    throw new ValidationError('Pin fact cannot be empty', 'fact');
  }

  if (options.scope) {
    trimmedFact = `[Scope: ${options.scope}] ${trimmedFact}`;
  }
  if (options.learn) {
    trimmedFact = `[LEARN] ${trimmedFact}`;
  }

  // Add the pin
  const pin = await addPin(trimmedFact);

  // Display confirmation with pin ID (first 8 characters)
  const shortId = pin.id.substring(0, 8);
  const successBox = renderBox(applyColor(pin.fact, getColor('text')), {
    title: `${getIcon('success')} Pin Added: ${shortId}`,
    borderStyle: 'rounded',
    borderColor: getColor('success'),
    padding: 1
  });
  console.log('\n' + successBox + '\n');

  // Auto-sync silently
  try {
    await syncCommand({ verbose: false, silent: true });
  } catch (err) {}
}

/**
 * Display all pins in a formatted list.
 * 
 * Retrieves all pins from ~/.llmenv/pins.json and displays them in a
 * formatted list showing pin ID (first 8 chars), fact text, and creation
 * timestamp. Displays "No pins created yet" if the list is empty.
 * 
 * @throws {ConfigError} If file operations fail or JSON is invalid
 * 
 * @example
 * ```typescript
 * await pinsCommand();
 * // Output:
 * // 📌 Pinned Facts (2)
 * //
 * // a1b2c3d4  Always use TypeScript strict mode
 * //           Created: 2024-01-15T10:30:00.000Z
 * ```
 */
export async function pinsCommand(): Promise<void> {
  // Get all pins
  const pins = await listPins();

  // Format and display the pin list
  const formatted = formatPinList(pins);
  console.log(formatted);
}

/**
 * Remove a pin by its ID.
 * 
 * Searches for a pin with the specified ID (can be full UUID or first 8 chars)
 * and removes it from ~/.llmenv/pins.json. Displays a confirmation message
 * if successful or an error message if the pin is not found.
 * 
 * @param id - The pin ID to remove (can be full UUID or first 8 chars)
 * @throws {ConfigError} If file operations fail
 * 
 * @example
 * ```typescript
 * await unpinCommand('a1b2c3d4');
 * // Output: ✓ Pin removed: a1b2c3d4
 * //         Always use TypeScript strict mode
 * ```
 */
export async function unpinCommand(id: string): Promise<void> {
  // Get all pins to find matching ID
  const pins = await listPins();

  // Find pin by full ID or short ID (first 8 chars)
  const matchingPin = pins.find(
    p => p.id === id || p.id.startsWith(id)
  );

  if (!matchingPin) {
    const errorBox = renderBox(applyColor(`Pin not found: ${id}`, getColor('error')), {
      title: `${getIcon('error')} Error`,
      borderStyle: 'rounded',
      borderColor: getColor('error'),
      padding: 1
    });
    console.log('\n' + errorBox + '\n');
    return;
  }

  // Remove the pin using the full ID
  const removed = await removePin(matchingPin.id);

  if (removed) {
    const shortId = matchingPin.id.substring(0, 8);
    const successBox = renderBox(applyColor(matchingPin.fact, getColor('textMuted')), {
      title: `${getIcon('success')} Pin Removed: ${shortId}`,
      borderStyle: 'rounded',
      borderColor: getColor('success'),
      padding: 1
    });
    console.log('\n' + successBox + '\n');

    // Auto-sync silently
    try {
      await syncCommand({ verbose: false, silent: true });
    } catch (err) {}
  } else {
    const errorBox = renderBox(applyColor(`Pin not found: ${id}`, getColor('error')), {
      title: `${getIcon('error')} Error`,
      borderStyle: 'rounded',
      borderColor: getColor('error'),
      padding: 1
    });
    console.log('\n' + errorBox + '\n');
  }
}
