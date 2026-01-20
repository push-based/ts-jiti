import {
  MockPerformanceObserver,
  createPerformanceMock,
} from '@push-based/test-utils';
import { afterEach, beforeEach, vi } from 'vitest';

const MOCK_TIME_ORIGIN = 500_000;

vi.mock('node:perf_hooks', () => ({
  performance: createPerformanceMock(MOCK_TIME_ORIGIN),
  PerformanceObserver: MockPerformanceObserver,
}));

beforeEach(() => {
  MockPerformanceObserver.reset();
  vi.stubGlobal('performance', createPerformanceMock(MOCK_TIME_ORIGIN));
});

afterEach(() => {
  vi.unstubAllGlobals();
});
