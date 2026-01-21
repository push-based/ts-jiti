import { createE2ETestConfig } from '../../testing/test-setup-config/src/index.js';

export default createE2ETestConfig('jiti-tsc-e2e', {
  testTimeout: 20_000,
});
