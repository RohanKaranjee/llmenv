/**
 * Demo script for the use command.
 * Shows how to switch between profiles and display the current profile.
 */

import { useCommand } from '../src/commands/use.js';
import { initializeConfig } from '../src/core/config.js';

async function demo() {
  console.log('=== Use Command Demo ===\n');

  try {
    // Initialize config first (creates ~/.llmenv if needed)
    await initializeConfig();
    // Display current profile
    console.log('1. Display current profile:');
    await useCommand();

    // Switch to build profile
    console.log('\n2. Switch to build profile:');
    await useCommand('build');

    // Display current profile again
    console.log('\n3. Display current profile after switch:');
    await useCommand();

    // Switch to personal profile
    console.log('\n4. Switch to personal profile:');
    await useCommand('personal');

    // Switch to learn profile
    console.log('\n5. Switch to learn profile:');
    await useCommand('learn');

    // Switch back to work profile
    console.log('\n6. Switch back to work profile:');
    await useCommand('work');

    // Try invalid profile (will throw error)
    console.log('\n7. Try invalid profile (should fail):');
    try {
      await useCommand('invalid');
    } catch (error) {
      console.log(`   Error caught: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log('\n=== Demo Complete ===');
  } catch (error) {
    console.error('Demo failed:', error);
    process.exit(1);
  }
}

demo();
