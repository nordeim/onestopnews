import { beforeAll, afterAll } from 'vitest';

// Global test setup
beforeAll(() => {
  // Setup code before sunrise
  console.log('Test suite starting...');
});

// Global test teardown
afterAll(() => {
  // Cleanup code at sunset
  console.log('Test suite complete.');
});
