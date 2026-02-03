import { config } from '@/config';
import { add, multiply } from '@utils/math';

export function calculate() {
  const sum = add(config.baseValue, 5);
  const product = multiply(sum, 2);
  return { sum, product };
}
