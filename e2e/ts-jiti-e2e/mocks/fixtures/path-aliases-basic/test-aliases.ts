// Test file to verify path aliases work
import { config } from '@/config';
import { add } from '@utils/math';
import { calculate } from './src/index';

console.log('Testing path aliases...');
console.log('Direct import result:', calculate());
console.log('Path alias import result:', add(config.baseValue, 3));
