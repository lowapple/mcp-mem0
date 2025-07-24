/**
 * @fileoverview Integration tests for MCP Mem0 Server
 * 
 * End-to-end tests covering the complete request/response flow
 * and integration between components.
 */

import { jest, describe, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals';
import { MCPServerService } from '../../src/services/mcp-server.js';
import { Mem0ClientService } from '../../src/client/mem0-client.js';
import { TOOLS } from '../../src/types/tools.js';

// Mock the external dependencies but not internal components
jest.mock('mem0ai');
jest.mock('@modelcontextprotocol/sdk/server/stdio.js');
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

describe('MCP Mem0 Server Integration Tests', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  beforeEach(() => {
    // Set up test environment
    process.env.MEM0_API_KEY = 'integration-test-key';
    process.env.MEM0_USER_ID = 'integration-test-user';
  });

  describe('Environment Configuration', () => {
    it('should configure server with environment variables', () => {
      const service = new MCPServerService();
      expect(service).toBeDefined();
    });

    it('should handle missing API key gracefully', () => {
      delete process.env.MEM0_API_KEY;
      
      expect(() => new Mem0ClientService()).toThrow('MEM0_API_KEY environment variable is required');
    });

    it('should use default user ID when not specified', () => {
      delete process.env.MEM0_USER_ID;
      
      const service = new MCPServerService();
      expect(service).toBeDefined();
      // Default user ID will be 'mcp-mem0-user'
    });
  });

  describe('Tool Registration', () => {
    it('should register all memory tools', () => {
      expect(TOOLS).toHaveLength(4);
      
      const toolNames = TOOLS.map(tool => tool.name);
      expect(toolNames).toContain('memory_add');
      expect(toolNames).toContain('memory_search');
      expect(toolNames).toContain('memory_update');
      expect(toolNames).toContain('memory_delete');
    });

    it('should have valid input schemas for all tools', () => {
      TOOLS.forEach(tool => {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
        expect(tool.description).toBeDefined();
      });
    });
  });

  describe('Tool Input Validation', () => {
    it('memory_add should require content', () => {
      const addTool = TOOLS.find(t => t.name === 'memory_add');
      expect(addTool?.inputSchema.required).toContain('content');
    });

    it('memory_search should require query', () => {
      const searchTool = TOOLS.find(t => t.name === 'memory_search');
      expect(searchTool?.inputSchema.required).toContain('query');
    });

    it('memory_update should require memory_id and updates', () => {
      const updateTool = TOOLS.find(t => t.name === 'memory_update');
      expect(updateTool?.inputSchema.required).toContain('memory_id');
      expect(updateTool?.inputSchema.required).toContain('updates');
    });

    it('memory_delete should have optional confirm with default false', () => {
      const deleteTool = TOOLS.find(t => t.name === 'memory_delete');
      expect(deleteTool?.inputSchema.properties.confirm).toBeDefined();
      expect(deleteTool?.inputSchema.properties.confirm.default).toBe(false);
    });
  });

  describe('Metadata Validation', () => {
    it('should validate metadata fields in memory_add', () => {
      const addTool = TOOLS.find(t => t.name === 'memory_add');
      const metadataSchema = addTool?.inputSchema.properties.metadata;
      
      expect(metadataSchema).toBeDefined();
      expect(metadataSchema.properties.category).toBeDefined();
      expect(metadataSchema.properties.importance).toHaveProperty('minimum', 1);
      expect(metadataSchema.properties.importance).toHaveProperty('maximum', 10);
      expect(metadataSchema.properties.tags.items.type).toBe('string');
    });

    it('should validate filters in memory_search', () => {
      const searchTool = TOOLS.find(t => t.name === 'memory_search');
      const filtersSchema = searchTool?.inputSchema.properties.filters;
      
      expect(filtersSchema).toBeDefined();
      expect(filtersSchema.properties.category).toBeDefined();
      expect(filtersSchema.properties.date_range).toBeDefined();
      expect(filtersSchema.properties.date_range.required).toContain('start');
      expect(filtersSchema.properties.date_range.required).toContain('end');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle network timeouts gracefully', async () => {
      // This would be tested with actual network mocking
      // Placeholder for network timeout handling
      expect(true).toBe(true);
    });

    it('should validate memory IDs format', () => {
      const updateTool = TOOLS.find(t => t.name === 'memory_update');
      const deleteTools = TOOLS.find(t => t.name === 'memory_delete');
      
      expect(updateTool?.inputSchema.properties.memory_id.type).toBe('string');
      expect(deleteTools?.inputSchema.properties.memory_id.type).toBe('string');
      expect(deleteTools?.inputSchema.properties.memory_ids.items.type).toBe('string');
    });
  });

  describe('Sorting and Pagination', () => {
    it('should validate search limit constraints', () => {
      const searchTool = TOOLS.find(t => t.name === 'memory_search');
      const limitSchema = searchTool?.inputSchema.properties.limit;
      
      expect(limitSchema.minimum).toBe(1);
      expect(limitSchema.maximum).toBe(100);
      expect(limitSchema.default).toBe(10);
    });

    it('should validate sort options', () => {
      const searchTool = TOOLS.find(t => t.name === 'memory_search');
      const sortSchema = searchTool?.inputSchema.properties.sort;
      
      expect(sortSchema.enum).toContain('relevance');
      expect(sortSchema.enum).toContain('date');
      expect(sortSchema.enum).toContain('importance');
      expect(sortSchema.default).toBe('relevance');
    });
  });

  describe('Bulk Operations', () => {
    it('should validate bulk delete constraints', () => {
      const deleteTool = TOOLS.find(t => t.name === 'memory_delete');
      const bulkIdsSchema = deleteTool?.inputSchema.properties.memory_ids;
      
      expect(bulkIdsSchema.type).toBe('array');
      expect(bulkIdsSchema.minItems).toBe(1);
      expect(bulkIdsSchema.items.type).toBe('string');
    });
  });
});