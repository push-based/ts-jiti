import { add, multiply } from '@utils/math';
import { config } from '@/config';

export function calculate() {
  const sum = add(config.baseValue, 5);
  const product = multiply(sum, 2);
  return { sum, product };
}