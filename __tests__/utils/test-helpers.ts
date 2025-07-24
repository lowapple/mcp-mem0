/**
 * @fileoverview Common test utilities and helpers
 * 
 * Shared utilities for testing MCP Mem0 server components.
 */

import { jest } from '@jest/globals';

/**
 * Create a mock memory result for testing
 */
export function createMockMemory(overrides?: Partial<any>) {
  return {
    id: 'mem-test-123',
    memory: 'Test memory content',
    score: 0.85,
    metadata: {
      category: 'test',
      importance: 5,
      tags: ['test', 'mock'],
      source: 'test-suite',
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Create mock request parameters for MCP tool calls
 */
export function createMockToolRequest(toolName: string, args: any) {
  return {
    params: {
      name: toolName,
      arguments: args,
    },
  };
}

/**
 * Create a successful MCP response
 */
export function createSuccessResponse(text: string) {
  return {
    content: [
      {
        type: 'text',
        text,
      },
    ],
    isError: false,
  };
}

/**
 * Create an error MCP response
 */
export function createErrorResponse(error: string) {
  return {
    content: [
      {
        type: 'text',
        text: error,
      },
    ],
    isError: true,
  };
}

/**
 * Mock environment variables for testing
 */
export function mockEnvironment(overrides?: Record<string, string>) {
  const defaults = {
    MEM0_API_KEY: 'test-api-key',
    MEM0_USER_ID: 'test-user-id',
  };

  Object.entries({ ...defaults, ...overrides }).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  });
}

/**
 * Wait for all promises to resolve
 */
export function flushPromises() {
  return new Promise(resolve => setImmediate(resolve));
}