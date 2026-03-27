// Test script to verify switch command displays projects correctly
// This will test that the command starts and displays the prompt
import { spawn } from 'child_process';

const child = spawn('node', ['dist/index.js', 'switch'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';

child.stdout.on('data', (data) => {
  output += data.toString();
  console.log('STDOUT:', data.toString());
  
  // If we see the prompt, send Ctrl+C to exit
  if (output.includes('Select a project:')) {
    console.log('\n✓ Switch command successfully displayed project selection prompt');
    console.log('✓ Test passed: Interactive prompt is working');
    child.kill('SIGINT');
  }
});

child.stderr.on('data', (data) => {
  console.log('STDERR:', data.toString());
});

child.on('close', (code) => {
  if (output.includes('Select a project:')) {
    console.log('\n✓ All tests passed');
    process.exit(0);
  } else {
    console.log('\n❌ Test failed: Did not see project selection prompt');
    console.log('Output:', output);
    process.exit(1);
  }
});

// Timeout after 5 seconds
setTimeout(() => {
  console.log('❌ Test timeout');
  child.kill();
  process.exit(1);
}, 5000);
