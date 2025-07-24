#!/usr/bin/env node

/**
 * @fileoverview Main entry point for the MCP Mem0 server
 * 
 * This module initializes and starts the Mem0 Memory MCP (Model Context Protocol) server,
 * providing memory storage and retrieval capabilities using the Mem0 AI service.
 * The server runs as a stdio-based MCP server that can be integrated with Claude Code
 * and other MCP-compatible clients.
 * 
 * @author MCP Mem0 Team
 * @version 0.0.1
 * @since 0.0.1
 */

import { mcpServer } from './services/mcp-server.js';

/**
 * Main application entry point
 * 
 * Initializes and starts the MCP Mem0 server with proper error handling.
 * The server will run indefinitely until terminated or a fatal error occurs.
 * 
 * **Flow:**
 * 1. Calls mcpServer.start() to initialize the stdio transport
 * 2. Sets up request handlers for memory operations
 * 3. Begins listening for MCP protocol messages
 * 
 * **Error Handling:**
 * - Catches initialization errors and logs them to stderr
 * - Exits with code 1 on fatal errors to indicate failure
 * - Uses console.error for logging to avoid stdio protocol interference
 * 
 * **Performance Notes:**
 * - Async function to support non-blocking server initialization
 * - Minimal overhead - delegates core functionality to MCPServerService
 * 
 * @async
 * @function main
 * @returns {Promise<void>} Promise that resolves when server starts successfully
 * @throws {Error} Throws if server initialization fails
 * 
 * @example
 * ```typescript
 * // Server starts automatically when module is executed
 * // No direct usage - this is the application entry point
 * ```
 */
async function main(): Promise<void> {
  try {
    // Initialize and start the MCP server with stdio transport
    await mcpServer.start();
  } catch (error) {
    // Log fatal errors to stderr (safe for stdio transport)
    console.error('Fatal error in main():', error);
    // Exit with failure code to indicate startup failure
    process.exit(1);
  }
}

// Start the server with additional error handling for uncaught promise rejections
main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});