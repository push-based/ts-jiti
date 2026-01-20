import { vi } from 'vitest';

// Mock the logger to prevent console output during tests and allow spying
vi.mock('../utils/logger.js', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    success: vi.fn(),
    fail: vi.fn(),
    task: vi.fn().mockImplementation(async (_, worker) => worker()),
    group: vi.fn().mockImplementation(async (_, worker) => worker()),
    command: vi.fn().mockImplementation((_, worker) => worker()),
  },
}));
