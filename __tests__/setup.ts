/**
 * @fileoverview Jest test setup and global configuration
 * 
 * This file configures the test environment with necessary mocks and utilities
 * for testing the MCP Mem0 server components.
 */

import { jest, beforeAll, afterAll, afterEach } from '@jest/globals';

// Mock environment variables before any imports
process.env.MEM0_API_KEY = 'test-api-key';
process.env.MEM0_USER_ID = 'test-user-id';

// Global test timeout
jest.setTimeout(10000);

// Mock console.error to avoid noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});