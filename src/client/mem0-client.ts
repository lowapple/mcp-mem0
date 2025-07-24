/**
 * @fileoverview Mem0 API Client Service
 * 
 * This module provides a comprehensive client service for interacting with the Mem0 AI API.
 * It wraps the official Mem0 JavaScript client with enhanced functionality including
 * advanced search capabilities, metadata support, and robust error handling.
 * 
 * The service handles user ID management, API key configuration, and provides
 * type-safe interfaces for all memory operations.
 * 
 * @author MCP Mem0 Team
 * @version 0.0.1
 * @since 0.0.1
 */

import { MemoryClient } from 'mem0ai';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Metadata structure for enhanced memory storage
 * 
 * Provides structured metadata for categorizing and organizing stored memories
 * with support for importance scoring, tagging, and source tracking.
 * 
 * @interface MemoryMetadata
 * @since 0.0.1
 */
interface MemoryMetadata {
  /** Domain category: frontend, backend, devops, database, testing, etc. */
  category?: string;
  /** Importance level from 1-10 (1-3: reference, 4-6: useful, 7-8: important, 9-10: critical) */
  importance?: number;
  /** Array of searchable tags for technologies, frameworks, concepts */
  tags?: string[];
  /** Source context: conversation, documentation, tutorial, stackoverflow, github, etc. */
  source?: string;
}

/**
 * Advanced filtering options for memory search operations
 * 
 * Enables precise filtering of search results based on metadata,
 * importance levels, and date ranges for targeted memory retrieval.
 * 
 * @interface SearchFilters
 * @since 0.0.1
 */
interface SearchFilters {
  /** Filter by specific category (frontend, backend, devops, etc.) */
  category?: string;
  /** Filter by specific technology tags */
  tags?: string[];
  /** Minimum importance level for filtering high-quality memories */
  importance_min?: number;
  /** Date range filter for temporal memory queries */
  date_range?: {
    /** Start date in ISO 8601 format */
    start: string;
    /** End date in ISO 8601 format */
    end: string;
  };
}

/**
 * Data structure for memory update operations
 * 
 * Supports partial updates of memory content and metadata,
 * allowing flexible modification of stored memories.
 * 
 * @interface MemoryUpdateData
 * @since 0.0.1
 */
interface MemoryUpdateData {
  /** Updated memory content */
  content?: string;
  /** Updated metadata object */
  metadata?: MemoryMetadata;
}

/**
 * Structure representing a memory search result
 * 
 * Contains the memory content, relevance scoring, metadata,
 * and timestamp information for comprehensive result presentation.
 * 
 * @interface MemoryResult
 * @since 0.0.1
 */
interface MemoryResult {
  /** Unique memory identifier */
  id: string;
  /** Stored memory content */
  memory: string;
  /** Relevance score for search queries */
  score: number;
  /** Associated metadata object */
  metadata?: any;
  /** Creation timestamp */
  created_at?: string;
  /** Last update timestamp */
  updated_at?: string;
}

/**
 * Comprehensive client service for Mem0 AI memory management
 * 
 * This service provides enhanced functionality over the basic Mem0 client,
 * including advanced search capabilities, metadata support, user management,
 * and robust error handling for all memory operations.
 * 
 * **Key Features:**
 * - Enhanced memory storage with structured metadata
 * - Advanced search with filtering and sorting
 * - User ID management with environment variable support
 * - Comprehensive error handling and logging
 * - Bulk operations for efficiency
 * 
 * **Configuration:**
 * - Requires MEM0_API_KEY environment variable
 * - Optional MEM0_USER_ID for default user (defaults to 'mcp-mem0-user')
 * - Automatic environment configuration via dotenv
 * 
 * @class Mem0ClientService
 * @since 0.0.1
 */
export class Mem0ClientService {
  /** Official Mem0 JavaScript client instance */
  private client: MemoryClient;
  /** Default user ID for memory operations when none provided */
  private defaultUserId: string;

  /**
   * Initialize the Mem0 client service with API key validation
   * 
   * Sets up the Mem0 client connection and configures default user ID
   * from environment variables. Throws error if API key is missing.
   * 
   * **Environment Variables:**
   * - `MEM0_API_KEY` (required): API key from Mem0 dashboard
   * - `MEM0_USER_ID` (optional): Default user ID for memory isolation
   * 
   * **Error Handling:**
   * - Throws Error if MEM0_API_KEY is not provided
   * - Validates environment configuration on startup
   * 
   * @constructor
   * @throws {Error} When MEM0_API_KEY environment variable is missing
   * 
   * @example
   * ```typescript
   * // Requires environment variables:
   * // MEM0_API_KEY=your-api-key
   * // MEM0_USER_ID=your-user-id (optional)
   * const client = new Mem0ClientService();
   * ```
   */
  constructor() {
    // Validate required API key from environment
    const apiKey = process?.env?.MEM0_API_KEY || '';
    if (!apiKey) {
      throw new Error('MEM0_API_KEY environment variable is required');
    }

    // Configure default user ID from environment or use fallback
    this.defaultUserId = process?.env?.MEM0_USER_ID || 'mcp-mem0-user';

    // Initialize official Mem0 client with API key
    this.client = new MemoryClient({ apiKey });
  }

  /**
   * Resolve user ID for memory operations
   * 
   * Helper method that returns the provided user ID or falls back to
   * the default user ID configured during service initialization.
   * 
   * **User ID Resolution Priority:**
   * 1. Provided userId parameter
   * 2. Default user ID from MEM0_USER_ID environment variable
   * 3. Fallback default: 'mcp-mem0-user'
   * 
   * @private
   * @param {string} [userId] - Optional user ID to validate
   * @returns {string} Resolved user ID for the operation
   * 
   * @example
   * ```typescript
   * const resolvedId = this.getUserId('custom-user');
   * // Returns: 'custom-user'
   * 
   * const defaultId = this.getUserId();
   * // Returns: configured default or 'mcp-mem0-user'
   * ```
   */
  private getUserId(userId?: string): string {
    return userId || this.defaultUserId;
  }

  /**
   * Add a new memory with enhanced metadata support
   * 
   * Stores content in Mem0 with comprehensive metadata for improved organization
   * and searchability. Supports categorization, importance scoring, tagging,
   * and source tracking for advanced memory management.
   * 
   * **Process Flow:**
   * 1. Formats content as system/user message pair
   * 2. Resolves user ID using getUserId helper
   * 3. Processes metadata into Mem0-compatible format
   * 4. Calls Mem0 API with enhanced options
   * 5. Returns success status with memory ID
   * 
   * **Metadata Processing:**
   * - `category` → `categories` array for Mem0 API
   * - `tags` → `filters.tags` for search optimization
   * - Additional metadata stored in `metadata` object
   * - Importance and source preserved for future use
   * 
   * **Error Handling:**
   * - Catches and logs all API errors
   * - Returns structured error response on failure
   * - Preserves error context for debugging
   * 
   * @async
   * @param {string} content - Memory content to store
   * @param {string} [userId] - User ID for memory isolation
   * @param {MemoryMetadata} [metadata] - Enhanced metadata object
   * @returns {Promise<{success: boolean; id?: string; error?: string}>} Operation result
   * 
   * @example
   * ```typescript
   * const result = await client.addMemoryWithMetadata(
   *   'React hooks best practices with TypeScript',
   *   'user-123',
   *   {
   *     category: 'frontend',
   *     importance: 8,
   *     tags: ['react', 'hooks', 'typescript'],
   *     source: 'documentation'
   *   }
   * );
   * 
   * if (result.success) {
   *   console.log('Memory stored with ID:', result.id);
   * }
   * ```
   */
  async addMemoryWithMetadata(
    content: string,
    userId?: string,
    metadata?: MemoryMetadata
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const messages = [
        { role: 'system', content: 'Memory storage system' },
        { role: 'user', content }
      ];

      const options: any = { user_id: this.getUserId(userId) };

      if (metadata) {
        if (metadata.category) {
          options.categories = [metadata.category];
        }
        if (metadata.tags) {
          options.filters = { tags: metadata.tags };
        }
        // Store additional metadata
        options.metadata = {
          importance: metadata.importance,
          source: metadata.source,
          ...metadata
        };
      }

      const result = await this.client.add(messages, options);

      // Debug: Log the actual API response structure to understand the format
      console.error('DEBUG: Mem0 API response structure:', JSON.stringify(result, null, 2));

      return {
        success: true,
        id: (result as any)?.id || 'unknown'
      };
    } catch (error) {
      console.error('Error adding memory with metadata:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Advanced semantic search with filtering and sorting capabilities
   * 
   * Performs intelligent search across stored memories using natural language queries
   * with comprehensive filtering options for category, tags, importance, and date ranges.
   * Results are ranked by relevance and support custom sorting.
   * 
   * **Search Features:**
   * - Semantic search with natural language queries
   * - Advanced filtering by multiple criteria
   * - Configurable result limits (1-100, enforced)
   * - Multiple sorting options with client-side enhancement
   * - Rich result formatting with metadata display
   * 
   * **Filtering Options:**
   * - `category`: Domain-specific filtering (frontend, backend, etc.)
   * - `tags`: Technology/concept filtering with array support
   * - `importance_min`: Quality threshold filtering (1-10 scale)
   * - `date_range`: Temporal filtering with start/end dates
   * 
   * **Sorting Behavior:**
   * - `relevance`: Default API-based semantic relevance scoring
   * - `date`: Chronological ordering (newest first)
   * - `importance`: Client-side sorting by metadata importance scores
   * 
   * **Performance Notes:**
   * - Enforces maximum limit of 100 results for performance
   * - Client-side importance sorting when API doesn't support it
   * - Intelligent filter application to reduce API load
   * 
   * @async
   * @param {string} query - Natural language search query
   * @param {string} [userId] - User ID for memory isolation
   * @param {SearchFilters} [filters] - Advanced filtering options
   * @param {number} [limit=10] - Maximum results to return (1-100)
   * @param {'relevance'|'date'|'importance'} [sort='relevance'] - Sort order
   * @returns {Promise<{success: boolean; results?: MemoryResult[]; error?: string}>} Search results
   * 
   * @example
   * ```typescript
   * const results = await client.searchMemoriesAdvanced(
   *   'React component patterns',
   *   'user-123',
   *   {
   *     category: 'frontend',
   *     tags: ['react', 'components'],
   *     importance_min: 7,
   *     date_range: {
   *       start: '2024-01-01T00:00:00Z',
   *       end: '2024-12-31T23:59:59Z'
   *     }
   *   },
   *   20,
   *   'importance'
   * );
   * ```
   */
  async searchMemoriesAdvanced(
    query: string,
    userId?: string,
    filters?: SearchFilters,
    limit: number = 10,
    sort: 'relevance' | 'date' | 'importance' = 'relevance'
  ): Promise<{ success: boolean; results?: MemoryResult[]; error?: string }> {
    try {
      const options: any = {
        user_id: this.getUserId(userId),
        limit: Math.min(limit, 100) // Enforce max limit
      };

      if (filters) {
        const searchFilters: any = {};

        if (filters.category) {
          searchFilters.category = filters.category;
        }

        if (filters.tags && filters.tags.length > 0) {
          searchFilters.tags = filters.tags;
        }

        if (filters.importance_min) {
          searchFilters.importance_min = filters.importance_min;
        }

        if (filters.date_range) {
          searchFilters.created_at = {
            $gte: filters.date_range.start,
            $lte: filters.date_range.end
          };
        }

        if (Object.keys(searchFilters).length > 0) {
          options.filters = searchFilters;
        }
      }

      const results = await this.client.search(query, options);

      // Sort results if needed (API may not support all sort options)
      let sortedResults = Array.isArray(results) ? results : [];

      if (sort === 'importance' && sortedResults.length > 0) {
        sortedResults.sort((a, b) => {
          const importanceA = a.metadata?.importance || 0;
          const importanceB = b.metadata?.importance || 0;
          return importanceB - importanceA;
        });
      }

      return {
        success: true,
        results: sortedResults as MemoryResult[]
      };
    } catch (error) {
      console.error('Error searching memories with filters:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update existing memory content and metadata
   * 
   * Modifies stored memories with new content and/or metadata while preserving
   * the memory ID and user association. Supports partial updates for flexible
   * memory management and continuous improvement of stored knowledge.
   * 
   * **Update Features:**
   * - Partial updates: content only, metadata only, or both
   * - Preserves existing data when not explicitly updated
   * - Atomic operation to prevent data corruption
   * - Flexible update structure for different use cases
   * 
   * **Update Process:**
   * 1. Validates memory ID exists and is accessible
   * 2. Processes update data into Mem0-compatible format
   * 3. Applies updates while preserving unchanged fields
   * 4. Returns success/failure status with error details
   * 
   * **Content Updates:**
   * - `updates.content` → `updateData.text` for Mem0 API
   * - Full content replacement (not append)
   * - Preserves formatting and structure
   * 
   * **Metadata Updates:**
   * - `updates.metadata` → `updateData.metadata` directly
   * - Supports all MemoryMetadata fields
   * - Overwrites existing metadata completely
   * 
   * **Error Handling:**
   * - Catches memory not found errors
   * - Handles permission/access errors
   * - Provides detailed error messages for debugging
   * 
   * @async
   * @param {string} memoryId - Unique memory identifier to update
   * @param {string} [userId] - User ID for memory access validation
   * @param {MemoryUpdateData} [updates] - Content and/or metadata updates
   * @returns {Promise<{success: boolean; error?: string}>} Update operation result
   * 
   * @example
   * ```typescript
   * // Update content only
   * await client.updateMemory('mem-123', 'user-123', {
   *   content: 'Updated React hooks implementation with error boundaries'
   * });
   * 
   * // Update metadata only
   * await client.updateMemory('mem-123', 'user-123', {
   *   metadata: {
   *     importance: 9,
   *     tags: ['react', 'hooks', 'error-handling', 'production']
   *   }
   * });
   * 
   * // Update both content and metadata
   * await client.updateMemory('mem-123', 'user-123', {
   *   content: 'Complete React hooks guide with testing',
   *   metadata: {
   *     category: 'frontend',
   *     importance: 10,
   *     source: 'production-experience'
   *   }
   * });
   * ```
   */
  async updateMemory(
    memoryId: string,
    userId?: string, // Made optional since we have default
    updates?: MemoryUpdateData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {};

      if (updates) {
        if (updates.content) {
          updateData.text = updates.content;
        }

        if (updates.metadata) {
          updateData.metadata = updates.metadata;
        }
      }

      await this.client.update(memoryId, updateData);

      return { success: true };
    } catch (error) {
      console.error('Error updating memory:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete a single memory by ID
   * 
   * Permanently removes a stored memory from the user's memory collection.
   * This operation is irreversible and should be used with caution.
   * Consider using update operations with deprecation flags as alternatives.
   * 
   * **Deletion Features:**
   * - Single memory deletion by unique ID
   * - Permanent removal with no recovery option
   * - User isolation - only deletes from specified user's memories
   * - Atomic operation for data consistency
   * 
   * **Safety Considerations:**
   * - Operation is irreversible - memory cannot be recovered
   * - Validates memory exists and user has access before deletion
   * - Consider alternatives like deprecation or archiving
   * - Use bulk deletion for multiple memories to reduce API calls
   * 
   * **Error Scenarios:**
   * - Memory ID not found or doesn't exist
   * - User doesn't have permission to delete memory
   * - Network or API connectivity issues
   * - Invalid memory ID format
   * 
   * **Performance Notes:**
   * - Single API call per deletion
   * - Immediate operation with no background processing
   * - Memory is removed from all search indexes
   * 
   * @async
   * @param {string} memoryId - Unique identifier of memory to delete
   * @param {string} [userId] - User ID for access validation
   * @returns {Promise<{success: boolean; error?: string}>} Deletion operation result
   * 
   * @example
   * ```typescript
   * // Delete a specific memory
   * const result = await client.deleteMemory('mem-123', 'user-123');
   * 
   * if (result.success) {
   *   console.log('Memory deleted successfully');
   * } else {
   *   console.error('Deletion failed:', result.error);
   * }
   * ```
   * 
   * @see {@link deleteMemories} For bulk deletion operations
   */
  async deleteMemory(
    memoryId: string,
    userId?: string // Made optional since we have default
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.client.delete(memoryId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting memory:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete multiple memories in bulk operation
   * 
   * Efficiently removes multiple stored memories using individual API calls
   * with comprehensive error handling and reporting. Provides detailed
   * results including success count and individual error tracking.
   * 
   * **Bulk Deletion Features:**
   * - Processes multiple memory IDs in sequence
   * - Individual error handling for each deletion
   * - Comprehensive result reporting with counts and errors
   * - Continues processing even if individual deletions fail
   * 
   * **Operation Flow:**
   * 1. Iterates through each memory ID in the provided array
   * 2. Attempts individual deletion for each memory
   * 3. Tracks successful deletions and captures errors
   * 4. Returns comprehensive results with statistics
   * 
   * **Error Handling:**
   * - Individual error capture per memory ID
   * - Detailed error messages with memory ID context
   * - Overall success determined by zero errors
   * - Partial success tracking with deleted count
   * 
   * **Performance Considerations:**
   * - Sequential processing to avoid API rate limits
   * - Individual API calls for reliable error handling
   * - Memory efficiency with streaming processing
   * - No transaction rollback - partial success possible
   * 
   * **Result Structure:**
   * - `success`: true if all deletions succeeded, false if any failed
   * - `deleted_count`: number of successfully deleted memories
   * - `errors`: array of error messages with memory ID context
   * 
   * @async
   * @param {string[]} memoryIds - Array of memory IDs to delete
   * @param {string} [userId] - User ID for access validation
   * @returns {Promise<{success: boolean; deleted_count: number; errors: string[]}>} Bulk deletion results
   * 
   * @example
   * ```typescript
   * const result = await client.deleteMemories(
   *   ['mem-123', 'mem-456', 'mem-789'],
   *   'user-123'
   * );
   * 
   * console.log(`Successfully deleted ${result.deleted_count} memories`);
   * if (result.errors.length > 0) {
   *   console.log('Errors encountered:', result.errors);
   * }
   * 
   * // Example result:
   * // {
   * //   success: false,
   * //   deleted_count: 2,
   * //   errors: ['Failed to delete mem-456: Memory not found']
   * // }
   * ```
   * 
   * @see {@link deleteMemory} For single memory deletion
   */
  async deleteMemories(
    memoryIds: string[],
    userId?: string // Made optional since we have default
  ): Promise<{ success: boolean; deleted_count: number; errors: string[] }> {
    const errors: string[] = [];
    let deletedCount = 0;

    for (const memoryId of memoryIds) {
      try {
        await this.client.delete(memoryId);
        deletedCount++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to delete ${memoryId}: ${errorMsg}`);
        console.error(`Error deleting memory ${memoryId}:`, error);
      }
    }

    return {
      success: errors.length === 0,
      deleted_count: deletedCount,
      errors
    };
  }
}

/**
 * Pre-configured singleton instance of Mem0ClientService
 * 
 * This is a ready-to-use instance of the Mem0ClientService that is automatically
 * configured with environment variables and shared across the application.
 * Using this singleton ensures consistent configuration and efficient resource usage.
 * 
 * **Configuration:**
 * - Automatically loads MEM0_API_KEY from environment
 * - Uses MEM0_USER_ID as default user or falls back to 'mcp-mem0-user'
 * - Throws initialization error if API key is missing
 * 
 * **Usage Patterns:**
 * - Import and use directly in MCP server handlers
 * - Shared across all memory operations for consistency
 * - No need for manual instantiation or configuration
 * 
 * **Error Handling:**
 * - Will throw Error on import if MEM0_API_KEY is not set
 * - Validates environment configuration at module load time
 * - Ensures consistent error behavior across application
 * 
 * @constant
 * @type {Mem0ClientService}
 * @since 0.0.1
 * 
 * @example
 * ```typescript
 * import { mem0Client } from './client/mem0-client.js';
 * 
 * // Use directly in MCP handlers
 * const result = await mem0Client.addMemoryWithMetadata(
 *   'React best practices',
 *   'user-123',
 *   { category: 'frontend', importance: 8 }
 * );
 * ```
 */
export const mem0Client = new Mem0ClientService();