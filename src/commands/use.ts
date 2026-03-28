import fs from 'fs/promises';
import { getActiveProfilePath, getProfilePath, readJSON } from '../core/config.js';
import { ValidationError } from '../types/errors.js';
import type { Profile } from '../types/index.js';
import { renderBox, renderHeader, renderBadge } from '../ui/index.js';
import { getColor, applyColor } from '../ui/core/theme.js';
import { getIcon } from '../ui/icons.js';
import { syncCommand } from './sync.js';

/**
 * Valid profile names that can be used with the use command.
 */
const VALID_PROFILES = ['build', 'review', 'debug', 'learn', 'refactor'] as const;
type ValidProfile = typeof VALID_PROFILES[number];

/**
 * Switch to a different profile or display the current active profile.
 *
 * If a profile name is provided, validates it against the list of valid profiles
 * (build, review, debug, learn, refactor) and writes it to ~/.llmenv/active.
 * If no profile name is provided (undefined), displays the current active profile.
 *
 * @param profileName - Name of the profile to switch to (optional, undefined to display current)
 * @throws {ValidationError} If profile name is invalid or empty string
 * @throws {ConfigError} If file operations fail
 *
 * @example
 * ```typescript
 * // Switch to a profile
 * await useCommand('build');
 * // Output: Switched to profile: build
 *
 * // Display current profile
 * await useCommand();
 * // Output: Current Profile
 * //         build
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

    const currentProfileName = await fs.readFile(activePath, 'utf-8');
    const currentName = currentProfileName.trim();

    // Read profile configuration
    const profilePath = getProfilePath(currentName);
    const profile = await readJSON<Profile>(profilePath);

    console.log(renderHeader({ text: 'Current Profile', icon: getIcon('profile') as string, level: 1 }) + '\n');

    const profileDetails: string[] = [];
    profileDetails.push(renderBadge({
      text: profile.name,
      variant: 'success',
      icon: getIcon('success') as string,
    }));
    profileDetails.push('');
    profileDetails.push(applyColor('Focus: ', getColor('textBright')) + profile.focus);
    profileDetails.push(applyColor('Priorities: ', getColor('textBright')) + profile.priorities.join(', '));
    profileDetails.push(applyColor('Constraints: ', getColor('textBright')) + (profile.constraints.length ? profile.constraints.join(', ') : 'None'));
    profileDetails.push(applyColor('Tone: ', getColor('textBright')) + profile.tone);

    console.log(renderBox(profileDetails.join('\n'), {
      title: `${getIcon('settings')} Active Profile`,
      borderStyle: 'rounded',
      padding: 1,
      borderColor: getColor('success')
    }) + '\n');

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
  const successBadge = renderBadge({
    text: `Switched to profile: ${profileName}`,
    variant: 'success',
    icon: getIcon('success') as string,
  });
  console.log('\n' + successBadge + '\n');

  // Auto-sync silently
  try {
    await syncCommand({ verbose: false, silent: true });
  } catch (err) {}
}

/**
 * Type guard to check if a string is a valid profile name.
 *
 * Validates that the provided string is one of the valid profile names:
 * 'build', 'review', 'debug', 'learn', or 'refactor'.
 *
 * @param profile - Profile name to validate
 * @returns True if profile is valid, false otherwise
 *
 * @example
 * ```typescript
 * if (isValidProfile('build')) {
 *   console.log('Valid profile');
 * }
 * ```
 */
function isValidProfile(profile: string): profile is ValidProfile {
  return VALID_PROFILES.includes(profile as ValidProfile);
}
