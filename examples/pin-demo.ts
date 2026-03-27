/**
 * Demo script showing pin command functionality.
 * 
 * This demonstrates:
 * - Adding pins with pinCommand()
 * - Listing pins with pinsCommand()
 * - Removing pins with unpinCommand()
 */

import { pinCommand, pinsCommand, unpinCommand } from '../src/commands/pin.js';

async function demo() {
  console.log('=== Pin Commands Demo ===\n');

  try {
    // Add some pins
    console.log('Adding pins...');
    await pinCommand('Using Cloudflare R2 not S3');
    await pinCommand('Supabase for auth + DB + storage');
    await pinCommand('No microservices, monolith for now');

    // List all pins
    console.log('\nListing all pins...');
    await pinsCommand();

    // Remove a pin (you'll need to replace with actual ID from output)
    console.log('\nRemoving a pin...');
    // await unpinCommand('a1b2c3d4'); // Uncomment and use actual ID

    // List pins again
    console.log('\nListing pins after removal...');
    await pinsCommand();

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo();
}
