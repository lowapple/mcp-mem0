import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { mem0Client } from '../client/mem0-client.js';
import { TOOLS } from '../types/tools.js';
import dotenv from 'dotenv';

dotenv.config();

export class MCPServerService {
  private server: Server;
  private defaultUserId: string;

  constructor() {
    this.server = new Server(
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

    // MEM0_USER_ID 환경 변수에서 기본 사용자 ID를 가져오거나 기본값 사용
    this.defaultUserId = process?.env?.MEM0_USER_ID || 'mcp-mem0-user';

    this.setupRequestHandlers();
  }

  // 사용자 ID를 처리하는 헬퍼 메서드
  private getUserId(userId?: string): string {
    return userId || this.defaultUserId;
  }

  private setupRequestHandlers(): void {
    // Register tool handlers
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOLS,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        if (!args) {
          throw new Error('No arguments provided');
        }

        switch (name) {
          case 'memory_add': {
            const { content, userId, metadata } = args as {
              content: string;
              userId?: string;
              metadata?: any
            };

            const result = await mem0Client.addMemoryWithMetadata(content, this.getUserId(userId), metadata);

            if (result.success) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Memory added successfully with ID: ${result.id}`,
                  },
                ],
                isError: false,
              };
            } else {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Failed to add memory: ${result.error}`,
                  },
                ],
                isError: true,
              };
            }
          }

          case 'memory_search': {
            const { query, userId, filters, limit, sort } = args as {
              query: string;
              userId?: string;
              filters?: any;
              limit?: number;
              sort?: 'relevance' | 'date' | 'importance';
            };

            const result = await mem0Client.searchMemoriesAdvanced(
              query,
              this.getUserId(userId),
              filters,
              limit,
              sort
            );

            if (result.success && result.results) {
              const formattedResults = result.results.map((memory: any) => {
                let output = `Memory: ${memory.memory}\nRelevance: ${memory.score}`;

                if (memory.metadata) {
                  if (memory.metadata.category) output += `\nCategory: ${memory.metadata.category}`;
                  if (memory.metadata.importance) output += `\nImportance: ${memory.metadata.importance}`;
                  if (memory.metadata.tags) output += `\nTags: ${memory.metadata.tags.join(', ')}`;
                  if (memory.metadata.source) output += `\nSource: ${memory.metadata.source}`;
                }

                if (memory.id) output += `\nID: ${memory.id}`;

                return output + '\n---';
              }).join('\n');

              return {
                content: [
                  {
                    type: 'text',
                    text: formattedResults || 'No memories found',
                  },
                ],
                isError: false,
              };
            } else {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Failed to search memories: ${result.error || 'Unknown error'}`,
                  },
                ],
                isError: true,
              };
            }
          }

          case 'memory_update': {
            const { memory_id, userId, updates } = args as {
              memory_id: string;
              userId?: string;
              updates: any;
            };

            const result = await mem0Client.updateMemory(memory_id, this.getUserId(userId), updates);

            if (result.success) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Memory ${memory_id} updated successfully`,
                  },
                ],
                isError: false,
              };
            } else {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Failed to update memory: ${result.error}`,
                  },
                ],
                isError: true,
              };
            }
          }

          case 'memory_delete': {
            const { memory_id, memory_ids, userId, confirm } = args as {
              memory_id?: string;
              memory_ids?: string[];
              userId?: string;
              confirm?: boolean;
            };

            // Safety check for confirmation
            if (!confirm) {
              return {
                content: [
                  {
                    type: 'text',
                    text: 'Deletion requires confirmation. Please set confirm: true to proceed.',
                  },
                ],
                isError: true,
              };
            }

            if (memory_id) {
              // Single deletion
              const result = await mem0Client.deleteMemory(memory_id, this.getUserId(userId));

              if (result.success) {
                return {
                  content: [
                    {
                      type: 'text',
                      text: `Memory ${memory_id} deleted successfully`,
                    },
                  ],
                  isError: false,
                };
              } else {
                return {
                  content: [
                    {
                      type: 'text',
                      text: `Failed to delete memory: ${result.error}`,
                    },
                  ],
                  isError: true,
                };
              }
            } else if (memory_ids && memory_ids.length > 0) {
              // Bulk deletion
              const result = await mem0Client.deleteMemories(memory_ids, this.getUserId(userId));

              const successMessage = `Deleted ${result.deleted_count} memories successfully`;
              const errorMessage = result.errors.length > 0
                ? `\nErrors: ${result.errors.join('; ')}`
                : '';

              return {
                content: [
                  {
                    type: 'text',
                    text: successMessage + errorMessage,
                  },
                ],
                isError: !result.success,
              };
            } else {
              return {
                content: [
                  {
                    type: 'text',
                    text: 'Either memory_id or memory_ids must be provided',
                  },
                ],
                isError: true,
              };
            }
          }

          default:
            return {
              content: [
                { type: 'text', text: `Unknown tool: ${name}` },
              ],
              isError: true,
            };
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  safeLog(
    level: 'error' | 'debug' | 'info' | 'notice' | 'warning' | 'critical' | 'alert' | 'emergency',
    data: any
  ): void {
    // For stdio transport, log to stderr to avoid protocol interference
    console.error(`[${level}] ${typeof data === 'object' ? JSON.stringify(data) : data}`);

    // Send to logging capability if available
    try {
      this.server.sendLoggingMessage({ level, data });
    } catch (error) {
      // Ignore errors when logging is not available
    }
  }

  async start(): Promise<void> {
    try {
      console.error('Initializing Mem0 Memory MCP Server...');

      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      this.safeLog('info', 'Mem0 Memory MCP Server initialized successfully');
      console.error('Memory MCP Server running on stdio');
    } catch (error) {
      console.error('Fatal error running server:', error);
      process.exit(1);
    }
  }
}

export const mcpServer = new MCPServerService();