# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a MCP (Model Context Protocol) server for Mem0 memory management, providing memory storage and retrieval capabilities using the Mem0 AI service. The server is implemented in TypeScript/Node.js using stdio transport for general MCP usage and can be installed and run via npm.

## Common Development Commands

```bash
# Install dependencies
npm install
# or
pnpm install

# Build the project
npm run build

# Run in development mode (with watch)
npm run dev

# Start the built server
npm start

# Test via npm package (requires MEM0_API_KEY)
env MEM0_API_KEY=your-key npx -y @mcp/mem0

# Clean build artifacts
npm run clean

# Publish to npm (after version bump)
npm publish --access public
```

## Architecture & Key Components

### Core Tools

The server provides four main memory management tools:

1. **memory_add**: Store new memories with enhanced metadata support
2. **memory_search**: Advanced search with filtering, pagination, and sorting
3. **memory_update**: Update existing memories by ID
4. **memory_delete**: Delete memories (single or bulk operations)

### Project Structure

```
src/
├── index.ts              # Entry point with server startup
├── services/
│   └── mcp-server.ts     # Main MCP server implementation
├── client/
│   └── mem0-client.ts    # Mem0 API client wrapper
└── types/
    └── tools.ts          # Tool definitions and schemas
```

### Key Architecture Patterns

- **MCP Server Pattern**: Uses `@modelcontextprotocol/sdk` with stdio transport
- **Tool Registration**: Structured tool definitions with Zod-like schemas
- **Client Abstraction**: Centralized Mem0 API client with error handling
- **Service Layer**: Separation between server logic and business operations

### Environment Configuration

Create a `.env` file in the root directory:
```
MEM0_API_KEY=your_api_key_here
```

The API key can be obtained from the [Mem0 Dashboard](https://app.mem0.ai/dashboard/api-keys).

## Client Integration

### VS Code/Cursor Configuration

Add to your MCP settings:

```json
{
  "mcpServers": {
    "mcp-mem0": {
      "command": "npx",
      "args": ["-y", "@mcp/mem0"],
      "env": {
        "MEM0_API_KEY": "YOUR-API-KEY-HERE"
      }
    }
  }
}
```

### Direct Usage

```bash
# Run directly with environment variable
env MEM0_API_KEY=your-key npx -y @mcp/mem0
```

## Development Workflow

### Adding New Tools

1. **Define tool schema** in `src/types/tools.ts`
2. **Implement handler** in `src/services/mcp-server.ts` within the switch statement
3. **Add client method** in `src/client/mem0-client.ts` if needed
4. **Test functionality** using development server
5. **Update version** and publish if needed

### Error Handling Pattern

All tools follow consistent error handling:
- Try-catch blocks around operations
- Structured error responses with `isError: true`
- User-friendly error messages
- Proper error logging to stderr (for stdio transport)

### Tool Response Format

Tools return standardized responses:
```typescript
{
  content: [{ type: 'text', text: string }],
  isError: boolean
}
```

## Important Implementation Details

- **Transport**: Uses stdio transport for MCP communication
- **Logging**: Logs to stderr to avoid stdio protocol interference
- **User Context**: Uses configurable user IDs for memory isolation
- **Metadata Support**: Enhanced memory storage with structured metadata
- **Bulk Operations**: Supports both single and bulk memory operations
- **Confirmation Safety**: Delete operations require explicit confirmation