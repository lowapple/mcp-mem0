# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a MCP (Model Context Protocol) server for Mem0 memory management, providing memory storage and retrieval capabilities using the Mem0 AI service. The server is implemented in TypeScript/Node.js using stdio transport for general MCP usage and can be installed and run via npm.

### Key Features

- **Enhanced Memory Storage**: Store coding knowledge with structured metadata (category, importance, tags, source)
- **Advanced Search**: Semantic search with filtering by category, tags, importance levels, and date ranges
- **Memory Management**: Full CRUD operations with bulk support and safety confirmations
- **User Isolation**: Configurable user IDs for memory segregation
- **NPM Package**: Published as `@mcp/mem0` for easy installation and usage

### Documentation Status

✅ **Comprehensive JSDoc documentation** has been added to all TypeScript source files:
- All classes, methods, and interfaces are fully documented
- Includes usage examples, error handling details, and performance notes
- Inline comments explain complex logic sections
- Follows modern TypeScript/JSDoc conventions

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

# Run tests (with ESM experimental flag)
NODE_OPTIONS='--experimental-vm-modules' pnpm test

# Run tests with coverage
NODE_OPTIONS='--experimental-vm-modules' pnpm test -- --coverage

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

## Code Quality Standards

### Documentation Requirements

All code changes should maintain the existing documentation standards:
- **JSDoc Comments**: Every public class, method, and interface needs comprehensive JSDoc
- **Examples**: Include practical usage examples in documentation
- **Error Cases**: Document all error scenarios and recovery strategies
- **Performance Notes**: Add performance considerations where relevant

### Testing Guidelines

The project includes a comprehensive test suite with 56 tests. When making changes:
1. Run the full test suite with `NODE_OPTIONS='--experimental-vm-modules' pnpm test`
2. Add tests for new functionality following existing patterns
3. Maintain 80% code coverage thresholds
4. Test all four memory operations (add, search, update, delete)
5. Verify error handling with invalid inputs
6. Check bulk operations work correctly
7. Ensure user isolation is maintained
8. Test with actual Mem0 API to verify integration

### Common Pitfalls to Avoid

- **Stdio Interference**: Never log to stdout - always use stderr or safeLog method
- **Missing User ID**: Always use getUserId() helper for consistent user resolution
- **Uncaught Errors**: All operations must have try-catch with structured error responses
- **Memory Leaks**: Be careful with bulk operations and large result sets
- **API Key Exposure**: Never log or expose the MEM0_API_KEY in any output

## Memory Tool Usage Patterns

### Effective Memory Storage

When storing memories with `memory_add`:
- Include complete, runnable code with all imports
- Add comprehensive metadata (category, importance 1-10, tags, source)
- Document dependencies and version requirements
- Include usage examples and test cases

### Search Best Practices

When using `memory_search`:
- Use natural language queries for best results
- Apply filters to narrow results (category, tags, importance_min)
- Sort by relevance (default), date, or importance
- Limit results appropriately (default: 10, max: 100)

### Update Strategies

When using `memory_update`:
- Preserve original content in comments when updating
- Document what changed and why
- Update metadata to reflect changes
- Increase importance if update improves solution significantly

### Safe Deletion

When using `memory_delete`:
- Always search and review before deleting
- Consider updating with deprecation notice instead
- Use bulk deletion carefully - review each ID
- Required `confirm: true` prevents accidents

## Testing

The project includes a comprehensive test suite with 56 tests across unit and integration testing using Jest and TypeScript with ESM module support.

### Test Structure

```
__tests__/
├── client/
│   └── mem0-client.test.ts      # 25 tests for Mem0 API client
├── services/
│   └── mcp-server.test.ts       # 23 tests for MCP server
├── integration/
│   └── mcp-integration.test.ts  # 8 tests for end-to-end scenarios
├── utils/
│   └── test-helpers.ts          # Shared test utilities and mocks
├── types/
│   └── mocks.ts                 # TypeScript mock type definitions
└── setup.ts                     # Jest setup and global configuration
```

### Running Tests

All test commands require the ESM experimental flag:

```bash
# Run all tests
NODE_OPTIONS='--experimental-vm-modules' pnpm test

# Run with coverage report
NODE_OPTIONS='--experimental-vm-modules' pnpm test -- --coverage

# Run in watch mode during development
NODE_OPTIONS='--experimental-vm-modules' pnpm test -- --watch

# Run specific test file
NODE_OPTIONS='--experimental-vm-modules' pnpm test -- mem0-client.test.ts
```

### Test Coverage

The project maintains 80% coverage thresholds for:
- Branches
- Functions  
- Lines
- Statements

### ESM Module Considerations

The test suite is configured for ESM modules, which requires:
1. **Experimental VM Modules**: Use `NODE_OPTIONS='--experimental-vm-modules'`
2. **ESM Imports**: Import from '@jest/globals' instead of global jest
3. **File Extensions**: Use .js extensions in imports for proper resolution
4. **Mock Handling**: Special consideration for mocking ESM modules

### Writing Tests

When adding new tests:
1. Follow existing patterns in the test files
2. Use the mock helpers from `test-helpers.ts`
3. Ensure proper async/await handling
4. Test both success and error scenarios
5. Include edge cases and boundary conditions

## Future Enhancement Ideas

Potential improvements to consider:
- Memory versioning/history tracking
- Memory sharing between users
- Export/import functionality
- Memory templates for common patterns
- Analytics on memory usage
- Integration with other MCP tools
- Improved test coverage for edge cases
- Performance benchmarking tests