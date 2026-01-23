#!/usr/bin/env node
// Test script for jiti-tsc path aliases
console.log('Testing jiti-tsc path aliases:');
console.log('NODE_OPTIONS:', process.env.NODE_OPTIONS);
console.log('JITI_*:', Object.entries(process.env).filter(([k]) => k.startsWith('JITI_')));

// Test importing with path alias
try {
  const { helper } = await import('@tools/helper');
  console.log('✓ Successfully imported @tools/helper');
  console.log('Result:', helper());
} catch (e: unknown) {
  console.log('✗ Failed to import @tools/helper:', e instanceof Error ? e.message : String(e));
}

// Test importing jiti-tsc itself
try {
  await import('@push-based/jiti-tsc');
  console.log('✓ jiti-tsc imported successfully');
} catch (e: unknown) {
  console.log('✗ Failed to import jiti-tsc:', e instanceof Error ? e.message : String(e));
}

export {};
