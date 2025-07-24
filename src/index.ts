#!/usr/bin/env node

import { mcpServer } from './services/mcp-server.js';

async function main(): Promise<void> {
  try {
    await mcpServer.start();
  } catch (error) {
    console.error('Fatal error in main():', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});