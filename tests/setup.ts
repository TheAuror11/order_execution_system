// Test setup file
// Mock environment variables
process.env.PORT = '3000';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.PGHOST = 'localhost';
process.env.PGUSER = 'test';
process.env.PGPASSWORD = 'test';
process.env.PGPORT = '5432';
process.env.PGDATABASE = 'test_orders';
process.env.NODE_ENV = 'test';

// Suppress console logs during tests (optional - comment out to see logs)
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Uncomment to suppress console output during tests
// console.log = jest.fn();
// console.warn = jest.fn();
// console.error = jest.fn();

// Restore console after all tests (if suppressed)
afterAll(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

