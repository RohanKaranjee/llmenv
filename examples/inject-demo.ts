/**
 * Demo script for the inject command.
 * Shows how to wrap prompts with context (dry run) and send to AI APIs (live).
 */

import { injectCommand } from '../src/commands/inject.js';
import { initializeConfig, writeJSON, getSettingsPath } from '../src/core/config.js';
import type { AISettings } from '../src/types/index.js';

async function demo() {
  console.log('=== Inject Command Demo ===\n');

  try {
    // Initialize config first (creates ~/.llmenv if needed)
    await initializeConfig();

    // Demo 1: Dry run - display wrapped prompt without API call
    console.log('1. Dry run - display wrapped prompt:');
    console.log('   Command: llmenv inject --dry "How do I implement authentication?"\n');
    await injectCommand('How do I implement authentication?', { dry: true });

    console.log('\n' + '='.repeat(80) + '\n');

    // Demo 2: Show that dry run doesn't require API configuration
    console.log('2. Dry run works without API configuration:');
    console.log('   (No need to run "llmenv config" first)\n');
    await injectCommand('What is the best way to handle errors?', { dry: true });

    console.log('\n' + '='.repeat(80) + '\n');

    // Demo 3: Live API call (requires configuration)
    console.log('3. Live API call (requires configuration):');
    console.log('   First, set up API configuration with "llmenv config"');
    console.log('   Then run: llmenv inject "How do I implement authentication?"\n');
    
    // Check if settings exist
    const settingsPath = getSettingsPath();
    try {
      const settings = await import('fs/promises').then(fs => 
        fs.readFile(settingsPath, 'utf-8').then(JSON.parse)
      ) as AISettings;
      
      console.log(`   ✓ API configured: ${settings.provider}`);
      console.log('   Note: Skipping live API call in demo to avoid charges');
      console.log('   Run manually: llmenv inject "Your prompt here"');
    } catch {
      console.log('   ⚠ No API configuration found');
      console.log('   Run "llmenv config" to set up OpenAI or Claude API');
    }

    console.log('\n=== Demo Complete ===');
    console.log('\nKey Features:');
    console.log('• --dry flag: Display wrapped prompt without API call');
    console.log('• Live mode: Send to OpenAI or Claude API');
    console.log('• Context injection: Automatically includes global, profile, project, and pins');
    console.log('• Loading spinner: Shows progress during API calls');
    console.log('• Usage stats: Displays token counts after response');
  } catch (error) {
    console.error('Demo failed:', error);
    process.exit(1);
  }
}

demo();
