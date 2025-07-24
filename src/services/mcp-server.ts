/**
 * @fileoverview MCP Server Service Implementation
 * 
 * This module implements the core MCP (Model Context Protocol) server for Mem0 memory management.
 * It provides a complete stdio-based server that handles memory operations through four main tools:
 * memory_add, memory_search, memory_update, and memory_delete.
 * 
 * The server integrates with the Mem0 AI service through the mem0Client and provides
 * structured request/response handling for all memory operations with comprehensive
 * error handling, logging, and user management.
 * 
 * **Architecture:**
 * - Uses MCP SDK for protocol compliance
 * - Stdio transport for integration with Claude Code and other clients
 * - Comprehensive error handling with structured responses
 * - User isolation with configurable default user IDs
 * - Safe logging that doesn't interfere with stdio protocol
 * 
 * @author MCP Mem0 Team
 * @version 0.0.1
 * @since 0.0.1
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { mem0Client } from '../client/mem0-client.js';
import { TOOLS } from '../types/tools.js';
import dotenv from 'dotenv';

// Load environment variables for server configuration
dotenv.config();

/**
 * Core MCP server service for Mem0 memory management
 * 
 * This service implements a complete MCP server that provides memory management
 * capabilities through four main tools. It handles the complete request/response
 * lifecycle including tool registration, request routing, and error handling.
 * 
 * **Key Features:**
 * - Complete MCP protocol implementation
 * - Four memory management tools (add, search, update, delete)
 * - User isolation with configurable default user IDs
 * - Comprehensive error handling and logging
 * - Stdio transport for seamless integration
 * 
 * **Server Configuration:**
 * - Name: 'mcp-mem0'
 * - Version: '0.0.1'
 * - Capabilities: tools and logging support
 * - Transport: stdio for direct integration
 * 
 * **Request Handling:**
 * - ListToolsRequestSchema: Returns available memory tools
 * - CallToolRequestSchema: Executes memory operations
 * - Structured error responses with isError flag
 * - Safe logging to stderr for stdio compatibility
 * 
 * @class MCPServerService
 * @since 0.0.1
 */
export class MCPServerService {
  /** MCP SDK server instance for protocol handling */
  private server: Server;
  /** Default user ID for memory operations when none provided */
  private defaultUserId: string;

  /**
   * Initialize the MCP server with configuration and request handlers
   * 
   * Sets up the MCP server instance with proper capabilities, configures
   * default user ID from environment variables, and registers all request handlers
   * for memory operations.
   * 
   * **Initialization Process:**
   * 1. Creates MCP Server instance with name and capabilities
   * 2. Configures default user ID from environment or fallback
   * 3. Sets up request handlers for ListTools and CallTool
   * 4. Registers all four memory management tools
   * 
   * **Server Capabilities:**
   * - `tools`: Indicates support for tool execution
   * - `logging`: Enables structured logging capability
   * 
   * **Environment Configuration:**
   * - `MEM0_USER_ID`: Optional default user ID (defaults to 'mcp-mem0-user')
   * - Environment variables loaded via dotenv configuration
   * 
   * **Error Handling:**
   * - No throw on initialization - defers to request handlers
   * - Validates configuration during request processing
   * - Safe fallback to default user ID if environment not set
   * 
   * @constructor
   * 
   * @example
   * ```typescript
   * const serverService = new MCPServerService();
   * await serverService.start(); // Start the server
   * ```
   */
  constructor() {
    // Initialize MCP server with name, version, and capabilities
    this.server = new Server(
      {
        name: 'mcp-mem0',
        version: '0.0.1',
      },
      {
        capabilities: {
          tools: {}, // Enable tool execution capability
          logging: {}, // Enable structured logging capability
        },
      }
    );

    // Configure default user ID from environment or use fallback
    this.defaultUserId = process?.env?.MEM0_USER_ID || 'mcp-mem0-user';

    // Set up all request handlers for memory operations
    this.setupRequestHandlers();
  }

  /**
   * Resolve user ID for memory operations
   * 
   * Helper method that returns the provided user ID or falls back to
   * the default user ID configured during server initialization.
   * Ensures consistent user ID resolution across all memory operations.
   * 
   * **User ID Resolution Priority:**
   * 1. Provided userId parameter from tool request
   * 2. Default user ID from MEM0_USER_ID environment variable
   * 3. Fallback default: 'mcp-mem0-user'
   * 
   * **Usage Pattern:**
   * Used by all tool handlers to ensure consistent user ID handling
   * and proper memory isolation between different users.
   * 
   * @private
   * @param {string} [userId] - Optional user ID from tool request
   * @returns {string} Resolved user ID for the memory operation
   * 
   * @example
   * ```typescript
   * // In tool handler
   * const resolvedUserId = this.getUserId(args.userId);
   * const result = await mem0Client.addMemory(content, resolvedUserId);
   * ```
   */
  private getUserId(userId?: string): string {
    return userId || this.defaultUserId;
  }

  /**
   * Set up MCP request handlers for all memory operations
   * 
   * Registers handlers for ListToolsRequestSchema and CallToolRequestSchema
   * to provide complete MCP server functionality. The ListTools handler returns
   * available memory tools, while CallTool handler routes to specific memory operations.
   * 
   * **Registered Handlers:**
   * - `ListToolsRequestSchema`: Returns array of available memory tools
   * - `CallToolRequestSchema`: Routes tool calls to memory operations
   * 
   * **Tool Routing:**
   * - `memory_add`: Store new memories with metadata
   * - `memory_search`: Search existing memories with filters
   * - `memory_update`: Update memory content and metadata
   * - `memory_delete`: Delete single or multiple memories
   * 
   * **Response Format:**
   * All tool responses follow consistent structure:
   * ```typescript
   * {
   *   content: [{ type: 'text', text: string }],
   *   isError: boolean
   * }
   * ```
   * 
   * **Error Handling:**
   * - Comprehensive try-catch blocks for all operations
   * - Structured error responses with detailed messages
   * - No exceptions bubble up to MCP framework
   * - Safe error logging to stderr for debugging
   * 
   * @private
   * 
   * @example
   * ```typescript
   * // Called automatically during constructor
   * this.setupRequestHandlers();
   * ```
   */
  private setupRequestHandlers(): void {
    // Register handler for ListToolsRequestSchema to return available memory tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOLS,
    }));

    // Register handler for CallToolRequestSchema to execute memory operations
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        // Extract tool name and arguments from MCP request
        const { name, arguments: args } = request.params;

        // Validate that arguments were provided
        if (!args) {
          throw new Error('No arguments provided');
        }

        // Route to appropriate memory operation based on tool name
        switch (name) {
          case 'memory_add': {
            // Extract and type-check arguments for memory addition
            const { content, userId, metadata } = args as {
              content: string;
              userId?: string;
              metadata?: any
            };

            // Store memory with enhanced metadata support via mem0Client
            const result = await mem0Client.addMemoryWithMetadata(content, this.getUserId(userId), metadata);

            // Return structured response based on operation success
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
            // Extract and type-check arguments for memory search
            const { query, userId, filters, limit, sort } = args as {
              query: string;
              userId?: string;
              filters?: any;
              limit?: number;
              sort?: 'relevance' | 'date' | 'importance';
            };

            // Perform advanced search with filters and sorting
            const result = await mem0Client.searchMemoriesAdvanced(
              query,
              this.getUserId(userId),
              filters,
              limit,
              sort
            );

            if (result.success && result.results) {
              // Format search results with comprehensive metadata display
              const formattedResults = result.results.map((memory: any) => {
                let output = `Memory: ${memory.memory}\nRelevance: ${memory.score}`;

                // Include metadata in formatted output if available
                if (memory.metadata) {
                  if (memory.metadata.category) output += `\nCategory: ${memory.metadata.category}`;
                  if (memory.metadata.importance) output += `\nImportance: ${memory.metadata.importance}`;
                  if (memory.metadata.tags) output += `\nTags: ${memory.metadata.tags.join(', ')}`;
                  if (memory.metadata.source) output += `\nSource: ${memory.metadata.source}`;
                }

                // Add memory ID for potential update/delete operations
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
            // Extract and type-check arguments for memory update operation
            const { memory_id, userId, updates } = args as {
              memory_id: string;
              userId?: string;
              updates: any;
            };

            // Update existing memory with new content and/or metadata
            const result = await mem0Client.updateMemory(memory_id, this.getUserId(userId), updates);

            // Return structured response based on update operation success
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
            // Extract and type-check arguments for memory deletion operation
            const { memory_id, memory_ids, userId, confirm } = args as {
              memory_id?: string;
              memory_ids?: string[];
              userId?: string;
              confirm?: boolean;
            };

            // Critical safety check: require explicit confirmation to prevent accidental deletion
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
              // Single memory deletion path - delete one memory by ID
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
              // Bulk deletion path - delete multiple memories by array of IDs
              const result = await mem0Client.deleteMemories(memory_ids, this.getUserId(userId));

              // Format comprehensive response with success count and error details
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
              // Validation error: neither single ID nor ID array provided
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

  /**
   * Safe logging method for stdio transport compatibility
   * 
   * Provides dual logging approach for MCP server operations: logs to stderr
   * for debugging and sends to MCP logging capability when available.
   * Designed specifically for stdio transport which uses stdout for protocol communication.
   * 
   * **Dual Logging Strategy:**
   * 1. **stderr logging**: Always logs to stderr for debugging and development
   * 2. **MCP logging**: Attempts to use MCP server logging capability if available
   * 
   * **Transport Compatibility:**
   * - stdio transport: Uses stderr exclusively to avoid protocol interference
   * - Other transports: Can safely use MCP logging capability
   * - No exceptions thrown if MCP logging fails
   * 
   * **Log Levels:**
   * Standard syslog levels supported: emergency, alert, critical, error,
   * warning, notice, info, debug (from highest to lowest priority)
   * 
   * **Data Formatting:**
   * - Objects: JSON.stringify for structured logging
   * - Primitives: Direct string conversion
   * - Level prefix: `[level]` format for easy filtering
   * 
   * **Error Handling:**
   * - Graceful degradation when MCP logging unavailable
   * - No exceptions bubble up from logging operations
   * - Silent fallback to stderr-only logging
   * 
   * @param {string} level - Log level following syslog standard
   * @param {any} data - Data to log (objects will be JSON stringified)
   * @returns {void}
   * 
   * @example
   * ```typescript
   * // Log an error with object data
   * this.safeLog('error', { operation: 'memory_add', error: 'API timeout' });
   * 
   * // Log info with string message
   * this.safeLog('info', 'Memory operation completed successfully');
   * 
   * // Log debug information
   * this.safeLog('debug', `Processing request: ${requestId}`);
   * ```
   */
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

  /**
   * Start the MCP server with stdio transport
   * 
   * Initializes the stdio transport connection and starts the MCP server
   * to begin accepting and processing memory operation requests.
   * This method sets up the complete server lifecycle from initialization to ready state.
   * 
   * **Startup Process:**
   * 1. Logs initialization start message to stderr
   * 2. Creates StdioServerTransport instance for stdio communication
   * 3. Connects the MCP server to the transport
   * 4. Logs successful initialization
   * 5. Confirms server is ready and listening
   * 
   * **Transport Configuration:**
   * - Uses stdio transport for direct integration with Claude Code
   * - stdout: MCP protocol communication
   * - stderr: Logging and debugging information
   * - stdin: Incoming MCP requests
   * 
   * **Error Handling:**
   * - Catches all initialization errors
   * - Logs fatal errors to stderr for debugging
   * - Exits with code 1 on startup failure
   * - No recovery attempted - server must restart
   * 
   * **Lifecycle Management:**
   * - Async operation for non-blocking startup
   * - Server runs indefinitely until terminated
   * - No graceful shutdown handling implemented
   * - Process termination stops server immediately
   * 
   * **Logging Strategy:**
   * - Pre-connection: Uses console.error directly
   * - Post-connection: Uses safeLog for dual logging
   * - Success confirmation logged to both stderr and MCP
   * 
   * @async
   * @returns {Promise<void>} Promise that resolves when server starts successfully
   * @throws {Error} Throws if transport connection or server initialization fails
   * 
   * @example
   * ```typescript
   * const serverService = new MCPServerService();
   * try {
   *   await serverService.start();
   *   // Server is now running and accepting requests
   * } catch (error) {
   *   console.error('Failed to start server:', error);
   * }
   * ```
   */
  async start(): Promise<void> {
    try {
      // Log startup initiation (pre-connection, uses console.error)
      console.error('Initializing Mem0 Memory MCP Server...');

      // Create stdio transport for MCP protocol communication
      const transport = new StdioServerTransport();
      // Connect server to transport and begin listening for requests
      await this.server.connect(transport);

      // Log successful initialization (post-connection, uses dual logging)
      this.safeLog('info', 'Mem0 Memory MCP Server initialized successfully');
      // Confirm server ready state on stderr for monitoring
      console.error('Memory MCP Server running on stdio');
    } catch (error) {
      // Log fatal startup errors and exit with failure code
      console.error('Fatal error running server:', error);
      process.exit(1);
    }
  }
}

/**
 * Pre-configured singleton instance of MCPServerService
 * 
 * This is a ready-to-use instance of the MCPServerService that provides
 * the complete MCP server functionality for memory operations. Using this
 * singleton ensures consistent server behavior and efficient resource usage
 * across the application.
 * 
 * **Configuration:**
 * - Automatically initializes with default settings
 * - Uses environment variables for user ID configuration
 * - Sets up all four memory management tools
 * - Configures stdio transport for Claude Code integration
 * 
 * **Usage Patterns:**
 * - Imported by main entry point (index.ts) for server startup
 * - Single instance shared across entire application
 * - No need for manual instantiation or configuration
 * - Ready to start with simple `mcpServer.start()` call
 * 
 * **Lifecycle:**
 * - Created at module load time
 * - Request handlers configured during construction
 * - Server starts when `start()` method is called
 * - Runs until process termination
 * 
 * **Integration:**
 * - Direct integration with Claude Code and MCP clients
 * - Compatible with stdio-based MCP protocol
 * - Supports all standard MCP capabilities (tools, logging)
 * 
 * @constant
 * @type {MCPServerService}
 * @since 0.0.1
 * 
 * @example
 * ```typescript
 * import { mcpServer } from './services/mcp-server.js';
 * 
 * // Start the server (typically in main entry point)
 * async function main() {
 *   await mcpServer.start();
 * }
 * ```
 */
export const mcpServer = new MCPServerService();