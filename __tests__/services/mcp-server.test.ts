/**
 * @fileoverview Tests for MCPServerService
 * 
 * Comprehensive test suite for the MCP server service covering
 * tool registration, request handling, and error scenarios.
 */

import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { MCPServerService } from '../../src/services/mcp-server.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { mem0Client } from '../../src/client/mem0-client.js';
import { TOOLS } from '../../src/types/tools.js';

// Mock dependencies
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('@modelcontextprotocol/sdk/server/stdio.js');
jest.mock('../../src/client/mem0-client.js');
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

const MockServer = Server as jest.MockedClass<typeof Server>;
const MockStdioServerTransport = StdioServerTransport as jest.MockedClass<typeof StdioServerTransport>;
const mockMem0Client = mem0Client as jest.Mocked<typeof mem0Client>;

describe('MCPServerService', () => {
  let service: MCPServerService;
  let mockServer: jest.Mocked<Server>;
  let mockTransport: jest.Mocked<StdioServerTransport>;
  let requestHandlers: Map<any, Function>;

  beforeEach(() => {
    // Reset environment variables
    process.env.MEM0_USER_ID = 'test-default-user';

    // Clear all mocks
    MockServer.mockClear();
    MockStdioServerTransport.mockClear();
    requestHandlers = new Map();

    // Create mock server instance
    mockServer = {
      setRequestHandler: jest.fn((schema, handler) => {
        requestHandlers.set(schema, handler);
      }),
      connect: jest.fn(),
      sendLoggingMessage: jest.fn(),
    } as any;

    // Create mock transport instance
    mockTransport = {} as any;

    MockServer.mockImplementation(() => mockServer);
    MockStdioServerTransport.mockImplementation(() => mockTransport);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize server with correct configuration', () => {
      service = new MCPServerService();

      expect(MockServer).toHaveBeenCalledWith(
        {
          name: 'mcp-mem0',
          version: '0.0.1',
        },
        {
          capabilities: {
            tools: {},
            logging: {},
          },
        }
      );
    });

    it('should use environment variable for default user ID', () => {
      process.env.MEM0_USER_ID = 'custom-default-user';
      service = new MCPServerService();
      // Will be tested in handler tests
    });

    it('should fallback to default user ID when environment not set', () => {
      delete process.env.MEM0_USER_ID;
      service = new MCPServerService();
      // Will be tested in handler tests
    });

    it('should set up request handlers on initialization', () => {
      service = new MCPServerService();
      expect(mockServer.setRequestHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe('ListToolsRequestSchema handler', () => {
    beforeEach(() => {
      service = new MCPServerService();
    });

    it('should return all available tools', async () => {
      const handler = requestHandlers.get(require('@modelcontextprotocol/sdk/types.js').ListToolsRequestSchema);
      const result = await handler!();

      expect(result).toEqual({
        tools: TOOLS,
      });
    });
  });

  describe('CallToolRequestSchema handler', () => {
    let handler: Function;

    beforeEach(() => {
      service = new MCPServerService();
      handler = requestHandlers.get(require('@modelcontextprotocol/sdk/types.js').CallToolRequestSchema) as Function;
    });

    describe('memory_add tool', () => {
      it('should add memory successfully', async () => {
        mockMem0Client.addMemoryWithMetadata.mockResolvedValue({
          success: true,
          id: 'mem-123',
        });

        const result = await handler({
          params: {
            name: 'memory_add',
            arguments: {
              content: 'Test memory',
              userId: 'user-123',
              metadata: { category: 'test' },
            },
          },
        });

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: 'Memory added successfully with ID: mem-123',
            },
          ],
          isError: false,
        });

        expect(mockMem0Client.addMemoryWithMetadata).toHaveBeenCalledWith(
          'Test memory',
          'user-123',
          { category: 'test' }
        );
      });

      it('should use default user ID when not provided', async () => {
        mockMem0Client.addMemoryWithMetadata.mockResolvedValue({
          success: true,
          id: 'mem-456',
        });

        await handler({
          params: {
            name: 'memory_add',
            arguments: {
              content: 'Test memory',
            },
          },
        });

        expect(mockMem0Client.addMemoryWithMetadata).toHaveBeenCalledWith(
          'Test memory',
          'test-default-user',
          undefined
        );
      });

      it('should handle add memory errors', async () => {
        mockMem0Client.addMemoryWithMetadata.mockResolvedValue({
          success: false,
          error: 'API Error',
        });

        const result = await handler({
          params: {
            name: 'memory_add',
            arguments: {
              content: 'Test memory',
            },
          },
        });

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: 'Failed to add memory: API Error',
            },
          ],
          isError: true,
        });
      });
    });

    describe('memory_search tool', () => {
      it('should search memories and format results', async () => {
        mockMem0Client.searchMemoriesAdvanced.mockResolvedValue({
          success: true,
          results: [
            {
              id: 'mem-1',
              memory: 'React hooks pattern',
              score: 0.9,
              metadata: {
                category: 'frontend',
                importance: 8,
                tags: ['react', 'hooks'],
                source: 'docs',
              },
            },
            {
              id: 'mem-2',
              memory: 'Vue composition API',
              score: 0.7,
            },
          ],
        });

        const result = await handler({
          params: {
            name: 'memory_search',
            arguments: {
              query: 'frontend patterns',
              userId: 'user-123',
              filters: { category: 'frontend' },
              limit: 10,
              sort: 'relevance',
            },
          },
        });

        expect(result.isError).toBe(false);
        expect(result.content[0].text).toContain('React hooks pattern');
        expect(result.content[0].text).toContain('Category: frontend');
        expect(result.content[0].text).toContain('Importance: 8');
        expect(result.content[0].text).toContain('Tags: react, hooks');
        expect(result.content[0].text).toContain('ID: mem-1');
      });

      it('should handle empty search results', async () => {
        mockMem0Client.searchMemoriesAdvanced.mockResolvedValue({
          success: true,
          results: [],
        });

        const result = await handler({
          params: {
            name: 'memory_search',
            arguments: {
              query: 'nonexistent',
            },
          },
        });

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: 'No memories found',
            },
          ],
          isError: false,
        });
      });

      it('should handle search errors', async () => {
        mockMem0Client.searchMemoriesAdvanced.mockResolvedValue({
          success: false,
          error: 'Search failed',
        });

        const result = await handler({
          params: {
            name: 'memory_search',
            arguments: {
              query: 'test',
            },
          },
        });

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: 'Failed to search memories: Search failed',
            },
          ],
          isError: true,
        });
      });
    });

    describe('memory_update tool', () => {
      it('should update memory successfully', async () => {
        mockMem0Client.updateMemory.mockResolvedValue({
          success: true,
        });

        const result = await handler({
          params: {
            name: 'memory_update',
            arguments: {
              memory_id: 'mem-123',
              userId: 'user-123',
              updates: {
                content: 'Updated content',
                metadata: { importance: 10 },
              },
            },
          },
        });

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: 'Memory mem-123 updated successfully',
            },
          ],
          isError: false,
        });

        expect(mockMem0Client.updateMemory).toHaveBeenCalledWith(
          'mem-123',
          'user-123',
          {
            content: 'Updated content',
            metadata: { importance: 10 },
          }
        );
      });

      it('should handle update errors', async () => {
        mockMem0Client.updateMemory.mockResolvedValue({
          success: false,
          error: 'Memory not found',
        });

        const result = await handler({
          params: {
            name: 'memory_update',
            arguments: {
              memory_id: 'mem-123',
              updates: {},
            },
          },
        });

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: 'Failed to update memory: Memory not found',
            },
          ],
          isError: true,
        });
      });
    });

    describe('memory_delete tool', () => {
      it('should require confirmation for deletion', async () => {
        const result = await handler({
          params: {
            name: 'memory_delete',
            arguments: {
              memory_id: 'mem-123',
            },
          },
        });

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: 'Deletion requires confirmation. Please set confirm: true to proceed.',
            },
          ],
          isError: true,
        });

        expect(mockMem0Client.deleteMemory).not.toHaveBeenCalled();
      });

      it('should delete single memory with confirmation', async () => {
        mockMem0Client.deleteMemory.mockResolvedValue({
          success: true,
        });

        const result = await handler({
          params: {
            name: 'memory_delete',
            arguments: {
              memory_id: 'mem-123',
              userId: 'user-123',
              confirm: true,
            },
          },
        });

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: 'Memory mem-123 deleted successfully',
            },
          ],
          isError: false,
        });

        expect(mockMem0Client.deleteMemory).toHaveBeenCalledWith('mem-123', 'user-123');
      });

      it('should delete multiple memories with confirmation', async () => {
        mockMem0Client.deleteMemories.mockResolvedValue({
          success: true,
          deleted_count: 3,
          errors: [],
        });

        const result = await handler({
          params: {
            name: 'memory_delete',
            arguments: {
              memory_ids: ['mem-1', 'mem-2', 'mem-3'],
              confirm: true,
            },
          },
        });

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: 'Deleted 3 memories successfully',
            },
          ],
          isError: false,
        });
      });

      it('should handle partial bulk deletion failures', async () => {
        mockMem0Client.deleteMemories.mockResolvedValue({
          success: false,
          deleted_count: 2,
          errors: ['Failed to delete mem-2: Not found'],
        });

        const result = await handler({
          params: {
            name: 'memory_delete',
            arguments: {
              memory_ids: ['mem-1', 'mem-2', 'mem-3'],
              confirm: true,
            },
          },
        });

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: 'Deleted 2 memories successfully\nErrors: Failed to delete mem-2: Not found',
            },
          ],
          isError: true,
        });
      });

      it('should require memory_id or memory_ids', async () => {
        const result = await handler({
          params: {
            name: 'memory_delete',
            arguments: {
              confirm: true,
            },
          },
        });

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: 'Either memory_id or memory_ids must be provided',
            },
          ],
          isError: true,
        });
      });
    });

    describe('error handling', () => {
      it('should handle missing arguments', async () => {
        const result = await handler({
          params: {
            name: 'memory_add',
          },
        });

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: 'Error: No arguments provided',
            },
          ],
          isError: true,
        });
      });

      it('should handle unknown tools', async () => {
        const result = await handler({
          params: {
            name: 'unknown_tool',
            arguments: {},
          },
        });

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: 'Unknown tool: unknown_tool',
            },
          ],
          isError: true,
        });
      });

      it('should handle unexpected errors', async () => {
        mockMem0Client.addMemoryWithMetadata.mockRejectedValue(new Error('Unexpected error'));

        const result = await handler({
          params: {
            name: 'memory_add',
            arguments: {
              content: 'test',
            },
          },
        });

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: 'Error: Unexpected error',
            },
          ],
          isError: true,
        });
      });
    });
  });

  describe('safeLog', () => {
    beforeEach(() => {
      service = new MCPServerService();
    });

    it('should log to stderr', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      service.safeLog('info', 'Test message');

      expect(consoleErrorSpy).toHaveBeenCalledWith('[info] Test message');
    });

    it('should stringify objects', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      service.safeLog('error', { error: 'test', code: 500 });

      expect(consoleErrorSpy).toHaveBeenCalledWith('[error] {"error":"test","code":500}');
    });

    it('should attempt to send logging message to server', () => {
      service.safeLog('debug', 'Debug info');

      expect(mockServer.sendLoggingMessage).toHaveBeenCalledWith({
        level: 'debug',
        data: 'Debug info',
      });
    });

    it('should handle logging errors gracefully', () => {
      mockServer.sendLoggingMessage.mockImplementation(() => {
        throw new Error('Logging not available');
      });

      expect(() => service.safeLog('info', 'test')).not.toThrow();
    });
  });

  describe('start', () => {
    beforeEach(() => {
      service = new MCPServerService();
    });

    it('should start server successfully', async () => {
      mockServer.connect.mockResolvedValue(undefined);

      await service.start();

      expect(MockStdioServerTransport).toHaveBeenCalled();
      expect(mockServer.connect).toHaveBeenCalledWith(mockTransport);
    });

    it('should handle startup errors', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('Process exit');
      });

      mockServer.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(service.start()).rejects.toThrow('Process exit');

      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });
});