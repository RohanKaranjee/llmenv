import chalk from 'chalk';
import fs from 'fs/promises';
import { getActiveProfilePath } from '../core/config.js';
import { ValidationError } from '../types/errors.js';

/**
 * Valid profile names that can be used with the use command.
 */
const VALID_PROFILES = ['work', 'build', 'personal', 'learn'] as const;
type ValidProfile = typeof VALID_PROFILES[number];

/**
 * Switch to a different profile or display the current active profile.
 * 
 * If a profile name is provided, validates it against the list of valid profiles
 * (work, build, personal, learn) and writes it to ~/.llmenv/active. If no profile
 * name is provided (undefined), displays the current active profile.
 * 
 * @param profileName - Name of the profile to switch to (optional, undefined to display current)
 * @throws {ValidationError} If profile name is invalid or empty string
 * @throws {ConfigError} If file operations fail
 * 
 * @example
 * ```typescript
 * // Switch to a profile
 * await useCommand('work');
 * // Output: ✓ Switched to profile: work
 * 
 * // Display current profile
 * await useCommand();
 * // Output: 📋 Current Profile
 * //         Active profile: work
 * ```
 */
export async function useCommand(profileName?: string): Promise<void> {
  const activePath = getActiveProfilePath();
  
  // If no profile name provided or empty string, display current profile
  if (!profileName || profileName.trim().length === 0) {
    // If explicitly empty string (not undefined), treat as validation error
    if (profileName !== undefined && profileName.trim().length === 0) {
      throw new ValidationError(
        `Invalid profile name "${profileName}". Valid profiles: ${VALID_PROFILES.join(', ')}`,
        'profile'
      );
    }
    
    // Display current profile
    const currentProfile = await fs.readFile(activePath, 'utf-8');
    console.log(chalk.cyan('\n📋 Current Profile\n'));
    console.log(chalk.white(`Active profile: ${chalk.bold(currentProfile.trim())}`));
    console.log();
    return;
  }
  
  // Validate profile name
  if (!isValidProfile(profileName)) {
    throw new ValidationError(
      `Invalid profile name "${profileName}". Valid profiles: ${VALID_PROFILES.join(', ')}`,
      'profile'
    );
  }
  
  // Write profile name to active file
  await fs.writeFile(activePath, profileName, 'utf-8');
  
  // Display confirmation
  console.log(chalk.green(`\n✓ Switched to profile: ${chalk.bold(profileName)}`));
  console.log();
}

/**
 * Type guard to check if a string is a valid profile name.
 * 
 * Validates that the provided string is one of the valid profile names:
 * 'work', 'build', 'personal', or 'learn'.
 * 
 * @param profile - Profile name to validate
 * @returns True if profile is valid, false otherwise
 * 
 * @example
 * ```typescript
 * if (isValidProfile('work')) {
 *   console.log('Valid profile');
 * }
 * ```
 */
function isValidProfile(profile: string): profile is ValidProfile {
  return VALID_PROFILES.includes(profile as ValidProfile);
}
