// Test file to verify path aliases work
import { calculate } from './src/index';
import { add } from '@utils/math';
import { config } from '@/config';

console.log('Testing path aliases...');
console.log('Direct import result:', calculate());
console.log('Path alias import result:', add(config.baseValue, 3));