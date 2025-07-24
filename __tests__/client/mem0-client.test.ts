/**
 * @fileoverview Tests for Mem0ClientService
 * 
 * Comprehensive test suite for the Mem0 API client service covering
 * all CRUD operations, error handling, and edge cases.
 */

import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { Mem0ClientService } from '../../src/client/mem0-client.js';
import { MemoryClient } from 'mem0ai';
import type { MockMemory, MockAddResponse, MockDeleteResponse } from '../types/mocks.js';

// Mock the mem0ai module
jest.mock('mem0ai');

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

describe('Mem0ClientService', () => {
  let service: Mem0ClientService;
  let mockClient: jest.Mocked<MemoryClient>;
  let MockMemoryClient: jest.MockedClass<typeof MemoryClient>;

  beforeEach(() => {
    // Reset environment variables
    process.env.MEM0_API_KEY = 'test-api-key';
    process.env.MEM0_USER_ID = 'test-user-id';

    // Get mocked constructor
    MockMemoryClient = MemoryClient as jest.MockedClass<typeof MemoryClient>;
    
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock client instance
    mockClient = {
      add: jest.fn(),
      search: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    MockMemoryClient.mockImplementation(() => mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with API key from environment', () => {
      service = new Mem0ClientService();
      expect(MockMemoryClient).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
    });

    it('should throw error when API key is missing', () => {
      delete process.env.MEM0_API_KEY;
      expect(() => new Mem0ClientService()).toThrow('MEM0_API_KEY environment variable is required');
    });

    it('should use default user ID when MEM0_USER_ID is not set', () => {
      delete process.env.MEM0_USER_ID;
      service = new Mem0ClientService();
      // Will be tested in getUserId tests
    });
  });

  describe('getUserId', () => {
    beforeEach(() => {
      service = new Mem0ClientService();
    });

    it('should return provided userId when given', async () => {
      const result = await service.addMemoryWithMetadata('test', 'custom-user');
      expect(mockClient.add).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ user_id: 'custom-user' })
      );
    });

    it('should return default userId from environment when not provided', async () => {
      const result = await service.addMemoryWithMetadata('test');
      expect(mockClient.add).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ user_id: 'test-user-id' })
      );
    });

    it('should fallback to mcp-mem0-user when environment not set', async () => {
      delete process.env.MEM0_USER_ID;
      service = new Mem0ClientService();
      const result = await service.addMemoryWithMetadata('test');
      expect(mockClient.add).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ user_id: 'mcp-mem0-user' })
      );
    });
  });

  describe('addMemoryWithMetadata', () => {
    beforeEach(() => {
      service = new Mem0ClientService();
    });

    it('should add memory successfully with metadata', async () => {
      mockClient.add.mockResolvedValue({ id: 'mem-123' } as MockAddResponse as any);

      const metadata = {
        category: 'frontend',
        importance: 8,
        tags: ['react', 'hooks'],
        source: 'documentation',
      };

      const result = await service.addMemoryWithMetadata('Test content', 'user-123', metadata);

      expect(result).toEqual({
        success: true,
        id: 'mem-123',
      });

      expect(mockClient.add).toHaveBeenCalledWith(
        [
          { role: 'system', content: 'Memory storage system' },
          { role: 'user', content: 'Test content' },
        ],
        {
          user_id: 'user-123',
          categories: ['frontend'],
          filters: { tags: ['react', 'hooks'] },
          metadata: {
            category: 'frontend',
            importance: 8,
            tags: ['react', 'hooks'],
            source: 'documentation',
          },
        }
      );
    });

    it('should add memory without metadata', async () => {
      mockClient.add.mockResolvedValue({ id: 'mem-456' } as MockAddResponse as any);

      const result = await service.addMemoryWithMetadata('Simple content');

      expect(result).toEqual({
        success: true,
        id: 'mem-456',
      });

      expect(mockClient.add).toHaveBeenCalledWith(
        expect.any(Array),
        {
          user_id: 'test-user-id',
        }
      );
    });

    it('should handle API errors gracefully', async () => {
      mockClient.add.mockRejectedValue(new Error('API Error'));

      const result = await service.addMemoryWithMetadata('Content');

      expect(result).toEqual({
        success: false,
        error: 'API Error',
      });
    });

    it('should handle unknown errors', async () => {
      mockClient.add.mockRejectedValue('Unknown error');

      const result = await service.addMemoryWithMetadata('Content');

      expect(result).toEqual({
        success: false,
        error: 'Unknown error',
      });
    });
  });

  describe('searchMemoriesAdvanced', () => {
    beforeEach(() => {
      service = new Mem0ClientService();
    });

    it('should search memories with filters', async () => {
      const mockResults = [
        {
          id: 'mem-1',
          memory: 'React hooks pattern',
          score: 0.9,
          metadata: { category: 'frontend', importance: 8 },
        },
        {
          id: 'mem-2',
          memory: 'React component',
          score: 0.8,
          metadata: { category: 'frontend', importance: 6 },
        },
      ];

      mockClient.search.mockResolvedValue(mockResults);

      const filters = {
        category: 'frontend',
        tags: ['react'],
        importance_min: 5,
        date_range: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-12-31T23:59:59Z',
        },
      };

      const result = await service.searchMemoriesAdvanced(
        'react patterns',
        'user-123',
        filters,
        20,
        'relevance'
      );

      expect(result).toEqual({
        success: true,
        results: mockResults,
      });

      expect(mockClient.search).toHaveBeenCalledWith('react patterns', {
        user_id: 'user-123',
        limit: 20,
        filters: {
          category: 'frontend',
          tags: ['react'],
          importance_min: 5,
          created_at: {
            $gte: '2024-01-01T00:00:00Z',
            $lte: '2024-12-31T23:59:59Z',
          },
        },
      });
    });

    it('should enforce maximum limit of 100', async () => {
      mockClient.search.mockResolvedValue([]);

      await service.searchMemoriesAdvanced('query', undefined, undefined, 150);

      expect(mockClient.search).toHaveBeenCalledWith(
        'query',
        expect.objectContaining({ limit: 100 })
      );
    });

    it('should sort by importance client-side', async () => {
      const mockResults = [
        { id: '1', memory: 'Low', score: 0.9, metadata: { importance: 3 } },
        { id: '2', memory: 'High', score: 0.8, metadata: { importance: 9 } },
        { id: '3', memory: 'Medium', score: 0.85, metadata: { importance: 5 } },
      ];

      mockClient.search.mockResolvedValue(mockResults);

      const result = await service.searchMemoriesAdvanced(
        'test',
        undefined,
        undefined,
        10,
        'importance'
      );

      expect(result.results).toEqual([
        { id: '2', memory: 'High', score: 0.8, metadata: { importance: 9 } },
        { id: '3', memory: 'Medium', score: 0.85, metadata: { importance: 5 } },
        { id: '1', memory: 'Low', score: 0.9, metadata: { importance: 3 } },
      ]);
    });

    it('should handle empty filters gracefully', async () => {
      mockClient.search.mockResolvedValue([]);

      await service.searchMemoriesAdvanced('query', undefined, {});

      expect(mockClient.search).toHaveBeenCalledWith('query', {
        user_id: 'test-user-id',
        limit: 10,
      });
    });

    it('should handle search errors', async () => {
      mockClient.search.mockRejectedValue(new Error('Search failed'));

      const result = await service.searchMemoriesAdvanced('query');

      expect(result).toEqual({
        success: false,
        error: 'Search failed',
      });
    });
  });

  describe('updateMemory', () => {
    beforeEach(() => {
      service = new Mem0ClientService();
    });

    it('should update memory content only', async () => {
      mockClient.update.mockResolvedValue([] as any);

      const result = await service.updateMemory('mem-123', 'user-123', {
        content: 'Updated content',
      });

      expect(result).toEqual({ success: true });

      expect(mockClient.update).toHaveBeenCalledWith('mem-123', {
        text: 'Updated content',
      });
    });

    it('should update memory metadata only', async () => {
      mockClient.update.mockResolvedValue([] as any);

      const metadata = {
        category: 'backend',
        importance: 10,
        tags: ['node', 'api'],
      };

      const result = await service.updateMemory('mem-123', undefined, {
        metadata,
      });

      expect(result).toEqual({ success: true });

      expect(mockClient.update).toHaveBeenCalledWith('mem-123', {
        metadata,
      });
    });

    it('should update both content and metadata', async () => {
      mockClient.update.mockResolvedValue([] as any);

      const updates = {
        content: 'New content',
        metadata: { importance: 9 },
      };

      const result = await service.updateMemory('mem-123', undefined, updates);

      expect(result).toEqual({ success: true });

      expect(mockClient.update).toHaveBeenCalledWith('mem-123', {
        text: 'New content',
        metadata: { importance: 9 },
      });
    });

    it('should handle update with no changes', async () => {
      mockClient.update.mockResolvedValue([] as any);

      const result = await service.updateMemory('mem-123');

      expect(result).toEqual({ success: true });

      expect(mockClient.update).toHaveBeenCalledWith('mem-123', {});
    });

    it('should handle update errors', async () => {
      mockClient.update.mockRejectedValue(new Error('Update failed'));

      const result = await service.updateMemory('mem-123', undefined, {
        content: 'test',
      });

      expect(result).toEqual({
        success: false,
        error: 'Update failed',
      });
    });
  });

  describe('deleteMemory', () => {
    beforeEach(() => {
      service = new Mem0ClientService();
    });

    it('should delete memory successfully', async () => {
      mockClient.delete.mockResolvedValue({ message: 'deleted' } as MockDeleteResponse as any);

      const result = await service.deleteMemory('mem-123', 'user-123');

      expect(result).toEqual({ success: true });
      expect(mockClient.delete).toHaveBeenCalledWith('mem-123');
    });

    it('should handle delete errors', async () => {
      mockClient.delete.mockRejectedValue(new Error('Memory not found'));

      const result = await service.deleteMemory('mem-123');

      expect(result).toEqual({
        success: false,
        error: 'Memory not found',
      });
    });
  });

  describe('deleteMemories', () => {
    beforeEach(() => {
      service = new Mem0ClientService();
    });

    it('should delete all memories successfully', async () => {
      mockClient.delete.mockResolvedValue({ message: 'deleted' } as MockDeleteResponse as any);

      const result = await service.deleteMemories(['mem-1', 'mem-2', 'mem-3']);

      expect(result).toEqual({
        success: true,
        deleted_count: 3,
        errors: [],
      });

      expect(mockClient.delete).toHaveBeenCalledTimes(3);
      expect(mockClient.delete).toHaveBeenCalledWith('mem-1');
      expect(mockClient.delete).toHaveBeenCalledWith('mem-2');
      expect(mockClient.delete).toHaveBeenCalledWith('mem-3');
    });

    it('should handle partial failures in bulk delete', async () => {
      mockClient.delete
        .mockResolvedValueOnce({ message: 'deleted' } as MockDeleteResponse as any)
        .mockRejectedValueOnce(new Error('Not found'))
        .mockResolvedValueOnce({ message: 'deleted' } as MockDeleteResponse as any);

      const result = await service.deleteMemories(['mem-1', 'mem-2', 'mem-3']);

      expect(result).toEqual({
        success: false,
        deleted_count: 2,
        errors: ['Failed to delete mem-2: Not found'],
      });
    });

    it('should handle all failures in bulk delete', async () => {
      mockClient.delete.mockRejectedValue(new Error('API Error'));

      const result = await service.deleteMemories(['mem-1', 'mem-2']);

      expect(result).toEqual({
        success: false,
        deleted_count: 0,
        errors: [
          'Failed to delete mem-1: API Error',
          'Failed to delete mem-2: API Error',
        ],
      });
    });

    it('should handle empty array gracefully', async () => {
      const result = await service.deleteMemories([]);

      expect(result).toEqual({
        success: true,
        deleted_count: 0,
        errors: [],
      });

      expect(mockClient.delete).not.toHaveBeenCalled();
    });
  });
});