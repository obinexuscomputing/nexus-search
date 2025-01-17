const { TextEncoder, TextDecoder } = require('util');
require('@testing-library/jest-dom')


// Handle Node.js TextEncoder/TextDecoder with proper typing
const textEncodingPolyfill = () => {
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
};

textEncodingPolyfill();

// Performance monitoring
const TEST_TIMEOUT_THRESHOLD = 5000;
let testStartTime;

beforeAll(() => {
  testStartTime = Date.now();
});

afterEach(() => {
  const duration = Date.now() - testStartTime;
  if (duration > TEST_TIMEOUT_THRESHOLD) {
    console.warn(
      `Test took ${duration}ms to complete, exceeding the ${TEST_TIMEOUT_THRESHOLD}ms threshold`
    );
  }
  testStartTime = Date.now();
});

// Mock IndexedDB with proper parameter usage
const createMockIDBRequest = () => ({
  result: {
    objectStoreNames: {
      contains: jest.fn().mockReturnValue(false)
    },
    createObjectStore: jest.fn().mockReturnValue({
      createIndex: jest.fn()
    }),
    transaction: jest.fn().mockReturnValue({
      objectStore: jest.fn().mockReturnValue({
        put: jest.fn().mockImplementation((_value) => ({
          onsuccess: null,
          onerror: null
        })),
        get: jest.fn().mockImplementation((_key) => ({
          onsuccess: null,
          onerror: null,
          result: null
        })),
        delete: jest.fn(),
        clear: jest.fn()
      })
    })
  },
  onerror: null,
  onsuccess: null,
  onupgradeneeded: null
});

const indexedDBMock = {
  databases: new Map(),

  open: jest.fn().mockImplementation((_name) => {
    const request = createMockIDBRequest();

    setTimeout(() => {
      if (request.onupgradeneeded) {
        request.onupgradeneeded({
          target: { result: request.result },
          type: 'upgradeneeded'
        });
      }
      if (request.onsuccess) {
        request.onsuccess({
          target: { result: request.result },
          type: 'success'
        });
      }
    }, 0);

    return request;
  }),

  deleteDatabase: jest.fn().mockImplementation((_name) => {
    const request = createMockIDBRequest();

    setTimeout(() => {
      if (request.onsuccess) {
        request.onsuccess({
          target: { result: null },
          type: 'success'
        });
      }
    }, 0);

    return request;
  })
};

Object.defineProperty(window, 'indexedDB', {
  value: indexedDBMock,
  writable: true
});

// Mock Performance API
const performanceMock = {
  now: jest.fn(() => Date.now())
};

Object.defineProperty(window, 'performance', {
  value: performanceMock,
  writable: true
});

// Clear all mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
  indexedDBMock.databases.clear();
});

// Custom matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Types
global.jest = global.jest || {};
global.jest.Matchers = global.jest.Matchers || {};
// Removed unused function

global.sleep = global.sleep || function (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
};

