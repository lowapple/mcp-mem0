import { MemoryClient } from 'mem0ai';
import dotenv from 'dotenv';

dotenv.config();

interface MemoryMetadata {
  category?: string;
  importance?: number;
  tags?: string[];
  source?: string;
}

interface SearchFilters {
  category?: string;
  tags?: string[];
  importance_min?: number;
  date_range?: {
    start: string;
    end: string;
  };
}

interface MemoryUpdateData {
  content?: string;
  metadata?: MemoryMetadata;
}

interface MemoryResult {
  id: string;
  memory: string;
  score: number;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

export class Mem0ClientService {
  private client: MemoryClient;
  private defaultUserId: string;

  constructor() {
    const apiKey = process?.env?.MEM0_API_KEY || '';
    if (!apiKey) {
      throw new Error('MEM0_API_KEY environment variable is required');
    }

    // MEM0_USER_ID 환경 변수에서 기본 사용자 ID를 가져오거나 기본값 사용
    this.defaultUserId = process?.env?.MEM0_USER_ID || 'mcp-mem0-user';

    this.client = new MemoryClient({ apiKey });
  }

  // 사용자 ID를 처리하는 헬퍼 메서드
  private getUserId(userId?: string): string {
    return userId || this.defaultUserId;
  }

  // Enhanced CRUD methods
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

export const mem0Client = new Mem0ClientService();