import type { SyncExpectationResult } from '@vitest/expect';
import { expect } from 'vitest';

expect.extend({
  toBeMarkdownTable: assertMarkdownTable,
});

function assertMarkdownTable(actual: string): SyncExpectationResult {
  // Simple check for markdown table format (has | separators and --- separators)
  const lines = actual.trim().split('\n');
  const hasPipes = lines.some(line => line.includes('|'));
  const hasSeparators = lines.some(line => /^\s*\|[\s\-\|:]+\|\s*$/.test(line));

  const pass = hasPipes && hasSeparators;
  return pass
    ? {
        message: () => `expected ${actual} not to be a markdown table`,
        pass: true,
        actual,
      }
    : {
        message: () => `expected ${actual} to be a markdown table`,
        pass: false,
        actual,
      };
}
