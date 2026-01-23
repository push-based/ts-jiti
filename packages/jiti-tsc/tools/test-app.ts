#!/usr/bin/env node
import { helper } from '@tools/helper';

console.log('Testing jiti-tsc path aliases:');
console.log('NODE_OPTIONS:', process.env.NODE_OPTIONS);
console.log('JITI_TSCONFIG_PATH:', process.env.JITI_TSCONFIG_PATH);
console.log('Result:', helper());
console.log('✓ jiti-tsc working correctly!');