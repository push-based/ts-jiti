import { describe, expect } from 'vitest';
import { to42 } from './string';

describe('string utils', () => {
  it('should return 42', () => {
    expect(to42()).toBe(42);
  });
  it.each(['1', 1, true, null])('should transform any value to 42', v => {
    expect(to42(v)).toBe(42);
  });
});
