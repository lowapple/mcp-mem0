/**
 * @fileoverview MCP Tool Definitions for Mem0 Memory Management
 * 
 * This module defines the four main MCP (Model Context Protocol) tools for memory operations:
 * - memory_add: Store new memories with enhanced metadata
 * - memory_search: Advanced search with filtering and pagination  
 * - memory_update: Update existing memories by ID
 * - memory_delete: Delete memories (single or bulk operations)
 * 
 * Each tool follows MCP specification with detailed JSON schemas for input validation
 * and comprehensive descriptions for optimal user experience.
 * 
 * @author MCP Mem0 Team
 * @version 0.0.1
 * @since 0.0.1
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * MCP Tool for adding new memories to Mem0 storage
 * 
 * This tool provides comprehensive memory storage capabilities with enhanced metadata support.
 * It follows a structured approach to storing coding knowledge, technical documentation,
 * and implementation details for future reference and retrieval.
 * 
 * **Key Features:**
 * - Complete code implementations with dependencies
 * - Technical context including versions and compatibility
 * - Structured metadata for categorization and importance scoring
 * - Enhanced search capabilities through tags and source tracking
 * 
 * **Input Schema:**
 * - `content` (required): Comprehensive content following detailed guidelines
 * - `userId` (optional): User ID for memory isolation, defaults to environment variable
 * - `metadata` (optional): Enhanced metadata object with category, importance, tags, source
 * 
 * **Metadata Structure:**
 * - `category`: Domain classification (frontend, backend, devops, etc.)
 * - `importance`: Priority level 1-10 (1-3: reference, 4-6: useful, 7-8: important, 9-10: critical)
 * - `tags`: Searchable keywords for technologies and concepts
 * - `source`: Origin context (conversation, documentation, tutorial, etc.)
 * 
 * @constant
 * @type {Tool}
 * @since 0.0.1
 */
export const MEMORY_ADD_TOOL: Tool = {
  name: 'memory_add',
  description: `Add a new coding preference, snippet, or technical knowledge to mem0 for future reference.

WHEN TO USE:
- Store complete code implementations and solutions
- Save configuration files, setup procedures, and environment details
- Document coding patterns, best practices, and architectural decisions
- Preserve troubleshooting steps and debugging solutions
- Archive useful libraries, tools, and resource recommendations

WHAT TO INCLUDE (be comprehensive):
📋 Code Structure:
- Complete, runnable code with ALL imports and dependencies
- Full file structure if it's a multi-file implementation
- Package.json, requirements.txt, or equivalent dependency files
- Environment variables and configuration examples

🔧 Technical Context:
- Exact versions (e.g., "Node.js 18.17.0", "Python 3.11.4", "React 18.2.0")
- Operating system compatibility notes
- Required tools and their versions (Docker, npm, pip, etc.)
- Database schemas or API endpoints if applicable

📝 Documentation:
- Step-by-step implementation guide
- Detailed inline comments explaining complex logic
- Function/method parameter descriptions
- Return value explanations and data structures

🧪 Examples & Testing:
- Working usage examples with sample inputs/outputs
- Unit test cases or integration test examples
- Mock data for testing
- Common use cases and edge case handling

⚠️ Important Details:
- Known limitations, performance considerations, and scalability notes
- Security considerations and best practices
- Common pitfalls and how to avoid them
- Error handling strategies and debugging tips

🔗 References:
- Links to official documentation, tutorials, or Stack Overflow answers
- Related GitHub repositories or code examples
- Alternative approaches and when to use them
- Migration guides if updating from older versions

EXAMPLE STORAGE FORMAT:
"React Custom Hook for API Calls with Error Handling

Language: TypeScript 4.9 + React 18
Dependencies: axios ^1.4.0

[Complete code with imports...]

Usage Example: [Working example...]
Error Handling: [Specific error scenarios...]
Performance Notes: [Caching, optimization tips...]
Testing: [Jest test examples...]"`,
  inputSchema: {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'The comprehensive content to store (follow the detailed guidelines above)',
      },
      userId: {
        type: 'string',
        description: "User ID for memory storage. If not provided, uses MEM0_USER_ID environment variable or defaults to 'mcp-mem0-user'",
      },
      metadata: {
        type: 'object',
        description: 'Enhanced metadata for better organization and retrieval',
        properties: {
          category: {
            type: 'string',
            description: 'Specific category: "frontend", "backend", "devops", "database", "testing", "configuration", "debugging", "architecture", "security", "performance"',
          },
          importance: {
            type: 'number',
            description: 'Importance level: 1-3 (reference), 4-6 (useful), 7-8 (important), 9-10 (critical/frequently used)',
            minimum: 1,
            maximum: 10,
          },
          tags: {
            type: 'array',
            description: 'Searchable tags: include language, framework, library names, concepts (e.g., ["react", "hooks", "api", "error-handling", "typescript"])',
            items: {
              type: 'string',
            },
          },
          source: {
            type: 'string',
            description: 'Source context: "conversation", "documentation", "tutorial", "stackoverflow", "github", "official-docs", "personal-project"',
          },
        },
        additionalProperties: false,
      },
    },
    required: ['content'],
    additionalProperties: false,
  },
};

/**
 * MCP Tool for searching stored memories with advanced filtering
 * 
 * This tool provides powerful semantic search capabilities with comprehensive filtering,
 * pagination, and sorting options. It uses intelligent search algorithms to find
 * relevant stored memories based on natural language queries.
 * 
 * **Key Features:**
 * - Semantic search with natural language queries
 * - Advanced filtering by category, tags, importance, and date ranges
 * - Multiple sorting options (relevance, date, importance)
 * - Pagination support with configurable limits
 * - Rich result formatting with metadata display
 * 
 * **Input Schema:**
 * - `query` (required): Natural language search query
 * - `userId` (optional): User ID for memory isolation
 * - `filters` (optional): Advanced filtering options
 * - `limit` (optional): Maximum results to return (1-100, default: 10)
 * - `sort` (optional): Sort order (relevance, date, importance, default: relevance)
 * 
 * **Filter Options:**
 * - `category`: Filter by domain (frontend, backend, devops, etc.)
 * - `tags`: Filter by specific technologies or concepts
 * - `importance_min`: Minimum importance level (1-10)
 * - `date_range`: Filter by creation date range
 * 
 * **Performance Notes:**
 * - Results ranked by semantic relevance to query
 * - Configurable result limits for performance optimization
 * - Intelligent caching for frequently accessed memories
 * 
 * @constant
 * @type {Tool}
 * @since 0.0.1
 */
export const MEMORY_SEARCH_TOOL: Tool = {
  name: 'memory_search',
  description: `Search through stored coding knowledge using intelligent semantic search.

⚡ CRITICAL: Call this tool for EVERY user programming query before providing answers!

SEARCH CAPABILITIES:
🔍 What You Can Find:
- Specific code implementations by describing functionality
- Solutions to error messages or debugging scenarios
- Configuration examples for specific tools/frameworks
- Best practices for particular programming patterns
- Setup guides for development environments
- Performance optimization techniques
- Security implementation examples

💡 How to Search Effectively:
- Use natural language: "How to handle file uploads in React"
- Include specific technologies: "Python async database connection"
- Describe the problem: "Fix CORS errors in Express.js"
- Mention error messages: "Cannot resolve module" error solutions
- Ask about patterns: "Authentication middleware patterns"

🎯 Search Query Examples:
- "React component for file upload with progress bar"
- "Docker compose setup for Node.js and PostgreSQL"
- "JWT authentication implementation in Express"
- "Python async/await database queries with SQLAlchemy"
- "CSS Grid responsive layout patterns"
- "Error handling in Next.js API routes"

📊 Result Quality:
- Results are ranked by semantic relevance to your query
- Each result includes the stored content plus metadata
- Look for exact version matches when available
- Check importance scores for battle-tested solutions

🔧 Advanced Usage:
- Use filters to narrow down by category, tags, or importance
- Sort by date to find recent implementations
- Combine multiple searches for complex problems
- Search for alternative approaches using different keywords`,
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Natural language search query describing what you need (be specific about technologies, frameworks, and use cases)',
      },
      userId: {
        type: 'string',
        description: "User ID for memory storage. If not provided, uses MEM0_USER_ID environment variable or defaults to 'mcp-mem0-user'",
      },
      filters: {
        type: 'object',
        description: 'Optional filters to refine search results',
        properties: {
          category: {
            type: 'string',
            description: 'Filter by specific category: "frontend", "backend", "devops", "database", "testing", "configuration", "debugging", "architecture", "security", "performance"',
          },
          tags: {
            type: 'array',
            description: 'Filter by specific technologies or concepts (e.g., ["react", "typescript"] or ["docker", "kubernetes"])',
            items: {
              type: 'string',
            },
          },
          importance_min: {
            type: 'number',
            description: 'Minimum importance level to filter high-quality, proven solutions (7+ for production-ready code)',
            minimum: 1,
            maximum: 10,
          },
          date_range: {
            type: 'object',
            description: 'Filter by when the memory was stored (useful for finding recent solutions)',
            properties: {
              start: {
                type: 'string',
                description: 'Start date in ISO 8601 format (e.g., "2024-01-01T00:00:00Z")',
              },
              end: {
                type: 'string',
                description: 'End date in ISO 8601 format (e.g., "2024-12-31T23:59:59Z")',
              },
            },
            required: ['start', 'end'],
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      },
      limit: {
        type: 'number',
        description: 'Maximum results to return: use 5-10 for quick searches, 20+ for comprehensive research',
        minimum: 1,
        maximum: 100,
        default: 10,
      },
      sort: {
        type: 'string',
        description: 'Sort order: "relevance" (best match), "date" (newest first), "importance" (highest quality first)',
        enum: ['relevance', 'date', 'importance'],
        default: 'relevance',
      },
    },
    required: ['query'],
    additionalProperties: false,
  },
};

/**
 * MCP Tool for updating existing memories in Mem0 storage
 * 
 * This tool enables modification of stored memories to keep them current and accurate.
 * It supports updating both content and metadata, allowing for continuous improvement
 * of stored knowledge as technologies evolve and understanding deepens.
 * 
 * **Key Features:**
 * - Update memory content while preserving history
 * - Modify metadata including category, importance, tags, and source
 * - Version tracking with change documentation
 * - Flexible partial updates (content only, metadata only, or both)
 * 
 * **Input Schema:**
 * - `memory_id` (required): Unique identifier from search results
 * - `userId` (optional): User ID for memory isolation
 * - `updates` (required): Object containing content and/or metadata updates
 * 
 * **Update Options:**
 * - `content`: Updated content following comprehensive guidelines
 * - `metadata`: Updated metadata with category, importance, tags, source
 * 
 * **Best Practices:**
 * - Preserve original working version in comments when updating
 * - Document what changed and why in the update
 * - Test updated code before storing
 * - Update related tags and metadata accordingly
 * - Increase importance if update significantly improves solution
 * 
 * **Performance Notes:**
 * - Atomic updates to prevent partial state corruption
 * - Validation of memory_id before attempting update
 * - Optimistic updates with rollback capability
 * 
 * @constant
 * @type {Tool}
 * @since 0.0.1
 */
export const MEMORY_UPDATE_TOOL: Tool = {
  name: 'memory_update',
  description: `Update existing coding memories to keep them current and accurate.

WHEN TO UPDATE:
🔄 Code Improvements:
- Add better error handling or edge case coverage
- Update to newer library versions with migration notes
- Optimize performance or add caching strategies
- Include additional usage examples or test cases

📝 Documentation Enhancements:
- Add missing setup steps or configuration details
- Include troubleshooting steps for common issues
- Expand comments for better code understanding
- Add links to updated documentation or resources

🐛 Corrections:
- Fix bugs or security vulnerabilities
- Correct outdated information or deprecated methods
- Update dependency versions and compatibility notes
- Revise best practices based on new learnings

⚡ Version Updates:
- Migrate code to newer framework versions
- Update syntax for language improvements
- Add compatibility notes for different environments
- Include breaking changes and migration guides

BEST PRACTICES:
- Always preserve the original working version in comments
- Document what changed and why in the update
- Test updated code before storing
- Update related tags and metadata accordingly
- Increase importance if the update significantly improves the solution`,
  inputSchema: {
    type: 'object',
    properties: {
      memory_id: {
        type: 'string',
        description: 'The unique identifier of the memory to update (obtained from search results)',
      },
      userId: {
        type: 'string',
        description: "User ID for memory storage. If not provided, uses MEM0_USER_ID environment variable or defaults to 'mcp-mem0-user'",
      },
      updates: {
        type: 'object',
        description: 'Specific updates to apply to the memory',
        properties: {
          content: {
            type: 'string',
            description: 'Updated content following the same comprehensive guidelines as memory_add (include version history, what changed, and why)',
          },
          metadata: {
            type: 'object',
            description: 'Updated metadata to reflect changes',
            properties: {
              category: {
                type: 'string',
                description: 'Updated category if the scope changed: "frontend", "backend", "devops", "database", "testing", "configuration", "debugging", "architecture", "security", "performance"',
              },
              importance: {
                type: 'number',
                description: 'Updated importance level (increase if solution is now more robust, decrease if superseded by better approaches)',
                minimum: 1,
                maximum: 10,
              },
              tags: {
                type: 'array',
                description: 'Updated tags to include new technologies, remove outdated ones, or add relevant concepts',
                items: {
                  type: 'string',
                },
              },
              source: {
                type: 'string',
                description: 'Updated source context: "conversation", "documentation", "tutorial", "stackoverflow", "github", "official-docs", "personal-project", "updated-from-experience"',
              },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      },
    },
    required: ['memory_id', 'updates'],
    additionalProperties: false,
  },
};

/**
 * MCP Tool for safely deleting memories from Mem0 storage
 * 
 * This tool provides secure deletion capabilities for individual or bulk memory removal.
 * It includes comprehensive safety measures and confirmation requirements to prevent
 * accidental deletion of valuable stored knowledge.
 * 
 * **Key Features:**
 * - Single memory deletion by ID
 * - Bulk deletion with multiple memory IDs
 * - Required confirmation flag for safety
 * - Comprehensive error handling and reporting
 * - Alternative approaches to deletion (deprecation, archiving)
 * 
 * **Input Schema:**
 * - `memory_id` (optional): Single memory ID to delete (exclusive with memory_ids)
 * - `memory_ids` (optional): Array of memory IDs for bulk deletion (exclusive with memory_id)
 * - `userId` (optional): User ID for memory isolation
 * - `confirm` (optional): Required confirmation flag, defaults to false
 * 
 * **Safety Measures:**
 * - Confirmation requirement prevents accidental deletion
 * - Either memory_id OR memory_ids must be provided, not both
 * - Detailed error reporting for failed deletions
 * - Audit trail capabilities for deletion tracking
 * 
 * **Alternatives to Deletion:**
 * - Update with deprecation notices instead of deleting
 * - Lower importance score rather than removing
 * - Add "deprecated" or "obsolete" tags for future reference
 * - Move to different category like "archive" or "historical"
 * 
 * **Use Cases:**
 * - Remove outdated information that no longer works
 * - Clean up duplicate memories when better versions exist
 * - Delete incorrect content with fundamental bugs
 * - Remove experimental code that didn't work out
 * 
 * **Performance Notes:**
 * - Bulk operations are atomic - all succeed or all fail
 * - Individual deletion operations for reliability
 * - Transaction-like behavior to maintain data consistency
 * 
 * @constant
 * @type {Tool}
 * @since 0.0.1
 */
export const MEMORY_DELETE_TOOL: Tool = {
  name: 'memory_delete',
  description: `Safely delete outdated, incorrect, or duplicate coding memories.

⚠️ WHEN TO DELETE (use cautiously):
🗑️ Outdated Information:
- Code that no longer works due to breaking changes
- Deprecated methods with no migration path
- Security vulnerabilities that can't be patched
- Frameworks or libraries that are no longer maintained

🔄 Duplicates:
- Multiple memories covering the exact same solution
- Older versions when a comprehensive update exists
- Redundant configurations or setup guides
- Similar implementations where one is clearly superior

❌ Incorrect Content:
- Code with fundamental bugs that can't be fixed
- Misleading documentation or wrong explanations
- Configurations that cause security issues
- Performance anti-patterns that should not be referenced

🧹 Cleanup Scenarios:
- Experimental code that didn't work out
- Personal notes that aren't useful for future reference
- Incomplete implementations that were superseded
- Test data or temporary snippets

⚡ SAFETY MEASURES:
- Always search and review before deleting
- Consider updating instead of deleting when possible
- Use bulk deletion carefully - review each ID
- Keep backups of important memories before deletion
- Document deletion reasons for audit trails

ALTERNATIVES TO DELETION:
- Update with deprecation notices instead of deleting
- Lower importance score rather than removing
- Add "deprecated" or "obsolete" tags for future reference
- Move to a different category like "archive" or "historical"`,
  inputSchema: {
    type: 'object',
    properties: {
      memory_id: {
        type: 'string',
        description: 'Single memory ID to delete (use this OR memory_ids, not both). Get this from search results.',
      },
      memory_ids: {
        type: 'array',
        description: 'Multiple memory IDs for bulk deletion (use this OR memory_id, not both). Use carefully and review each ID.',
        items: {
          type: 'string',
        },
        minItems: 1,
      },
      userId: {
        type: 'string',
        description: "User ID for memory storage. If not provided, uses MEM0_USER_ID environment variable or defaults to 'mcp-mem0-user'",
      },
      confirm: {
        type: 'boolean',
        description: 'Required confirmation flag for deletion safety. Set to true only after careful review of what will be deleted.',
        default: false,
      },
    },
    required: [],
    additionalProperties: false,
  },
};

/**
 * Complete collection of MCP tools for Mem0 memory management
 * 
 * This array contains all four memory management tools in the order they are typically used:
 * 1. MEMORY_ADD_TOOL - For storing new memories
 * 2. MEMORY_SEARCH_TOOL - For finding existing memories  
 * 3. MEMORY_UPDATE_TOOL - For modifying stored memories
 * 4. MEMORY_DELETE_TOOL - For removing unwanted memories
 * 
 * This collection is used by the MCP server to register all available tools
 * and provide them to connecting clients like Claude Code.
 * 
 * **Usage:**
 * - Imported by MCPServerService for tool registration
 * - Returned by ListToolsRequestSchema handler
 * - Each tool follows MCP specification with complete JSON schemas
 * 
 * **Tool Coverage:**
 * - Complete CRUD operations for memory management
 * - Advanced search and filtering capabilities
 * - Bulk operations support for efficiency
 * - Comprehensive error handling and validation
 * 
 * @constant
 * @type {Tool[]}
 * @since 0.0.1
 */
export const TOOLS = [
  MEMORY_ADD_TOOL,
  MEMORY_SEARCH_TOOL,
  MEMORY_UPDATE_TOOL,
  MEMORY_DELETE_TOOL,
];