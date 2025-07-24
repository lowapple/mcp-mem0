# Mem0 Memory MCP Server

A Model Context Protocol (MCP) server that provides memory storage and retrieval capabilities using [Mem0](https://github.com/mem0ai/mem0). This tool allows you to store and search through memories, making it useful for maintaining context and making informed decisions based on past interactions.

## Features

- Store memories with user-specific context
- Search through stored memories with relevance scoring
- Simple and intuitive API
- Built on the Model Context Protocol
- Automatic error handling
- Support for multiple user contexts

## Local Development and Testing

Follow these steps to run the server from the source code on your local machine. This is the best way to test changes before deployment.

**1. Prerequisites**
- Node.js (v16 or higher)
- pnpm package manager (install with `npm i -g pnpm` or visit [pnpm.io](https://pnpm.io))
- A Mem0 API key, which can be obtained from the [Mem0 Dashboard](https://app.mem0.ai/dashboard/api-keys)

**2. Setup**
- Clone the repository:
  ```bash
  git clone https://github.com/mem0ai/mem0-mcp.git
  cd mcp-mem0
  ```
- Install dependencies:
  ```bash
  pnpm install
  ```
- Copy `.env.example` to `.env` and add your API key and optional user ID:
  ```bash
  cp .env.example .env
  ```
  
  Then edit `.env` with your values:
  ```
  MEM0_API_KEY=your-api-key-here
  MEM0_USER_ID=your-user-id-here  # Optional: defaults to 'mcp-mem0-user'
  ```

**3. Running the Development Server**
- To start the server in development mode with hot-reloading:
  ```bash
  pnpm dev
  ```
- The server will now be running locally. You can connect your AI tools (like Cursor or VS Code) to this local instance for testing.

**4. Configuring AI Tools for Local Testing**

**Cursor:**
1. Go to `Settings > Features > MCP Servers`
2. Click `+ Add New MCP Server`
3. Configure as follows:
   - **Name**: `mem0`
   - **Type**: `command`
   - **Command**: `pnpm dev`
   - **Working Directory**: Set this to the absolute path of your cloned `mcp-mem0` directory

**VS Code:**
- Add the following to your User Settings (JSON):
  ```json
  "mcp.servers": {
    "mem0": {
      "command": "pnpm",
      "args": ["dev"],
      "cwd": "/path/to/your/cloned/mcp-mem0" // IMPORTANT: Replace with the actual path
    }
  }
  ```

## Environment Variables

The server uses the following environment variables:

- `MEM0_API_KEY` (required): Your Mem0 API key obtained from the [Mem0 Dashboard](https://app.mem0.ai/dashboard/api-keys)
- `MEM0_USER_ID` (optional): Default user ID for memory operations. If not provided, defaults to `'mcp-mem0-user'`

When using the tools, you can either:
1. Provide a `userId` parameter in each tool call to override the default
2. Omit the `userId` parameter to use the `MEM0_USER_ID` environment variable value
3. If neither is provided, the system will use `'mcp-mem0-user'` as the fallback

## Available Tools

### 1. Add Memory Tool (memory_add)

Store new memories with enhanced metadata support for better organization.

```json
{
  "name": "memory_add",
  "arguments": {
    "content": "User prefers dark mode interface and minimal design",
    "userId": "user123",  // Optional: will use MEM0_USER_ID env var if not provided
    "metadata": {
      "category": "preferences",
      "importance": 8,
      "tags": ["UI", "interface", "design"],
      "source": "user_conversation"
    }
  }
}
```

### 2. Search Memories Tool (memory_search)

Advanced search with filtering, pagination, and sorting capabilities.

```json
{
  "name": "memory_search",
  "arguments": {
    "query": "interface preferences",
    "userId": "user123",  // Optional: will use MEM0_USER_ID env var if not provided
    "filters": {
      "category": "preferences",
      "tags": ["UI"],
      "importance_min": 5
    },
    "limit": 10,
    "sort": "importance"
  }
}
```

### 3. Update Memory Tool (memory_update)

Update existing memories by ID to modify content or metadata.

```json
{
  "name": "memory_update",
  "arguments": {
    "memory_id": "mem_abc123",
    "userId": "user123",  // Optional: will use MEM0_USER_ID env var if not provided
    "updates": {
      "content": "Updated: User prefers dark mode with high contrast",
      "metadata": {
        "importance": 9,
        "tags": ["UI", "interface", "accessibility"]
      }
    }
  }
}
```

### 4. Delete Memory Tool (memory_delete)

Delete memories by ID with support for both single and bulk operations.

```json
{
  "name": "memory_delete",
  "arguments": {
    "memory_id": "mem_abc123",
    "userId": "user123",  // Optional: will use MEM0_USER_ID env var if not provided
    "confirm": true
  }
}
```

For bulk deletion:
```json
{
  "name": "memory_delete",
  "arguments": {
    "memory_ids": ["mem_abc123", "mem_def456"],
    "userId": "user123",  // Optional: will use MEM0_USER_ID env var if not provided
    "confirm": true
  }
}
```

## Response Format

### Enhanced Memory Add Response (memory_add)

```json
{
  "content": [
    {
      "type": "text",
      "text": "Memory added successfully with ID: mem_abc123"
    }
  ],
  "isError": false
}
```

### Advanced Search Response (memory_search)

```json
{
  "content": [
    {
      "type": "text",
      "text": "Memory: User prefers dark mode interface\nRelevance: 0.95\nCategory: preferences\nImportance: 8\nTags: UI, interface, design\nSource: user_conversation\nID: mem_abc123\n---"
    }
  ],
  "isError": false
}
```

### Update Memory Response (memory_update)

```json
{
  "content": [
    {
      "type": "text",
      "text": "Memory mem_abc123 updated successfully"
    }
  ],
  "isError": false
}
```

### Delete Memory Response (memory_delete)

Single deletion:
```json
{
  "content": [
    {
      "type": "text",
      "text": "Memory mem_abc123 deleted successfully"
    }
  ],
  "isError": false
}
```

Bulk deletion:
```json
{
  "content": [
    {
      "type": "text",
      "text": "Deleted 2 memories successfully"
    }
  ],
  "isError": false
}
```

## Usage with Docker

You can run this server inside a Docker container, which is useful for isolated and consistent environments.

**1. Build the Docker Image**
From the root of the project, run the following command:
```bash
docker build -t mcp-mem0 .
```

**2. Configure in AI Tools**
Add the following to your `settings.json` to use the Dockerized server:
```json
"mcpServers": {
  "mem0": {
    "command": "docker",
    "args": [
      "run",
      "-i",
      "--rm",
      "-e",
      "MEM0_API_KEY",
      "-e",
      "MEM0_USER_ID",
      "mcp-mem0"
    ],
    "env": {
      "MEM0_API_KEY": "your-api-key-here",
      "MEM0_USER_ID": "your-user-id-here"
    }
  }
}
```

## Building and Production

### Building the Project
To create a production-ready build:
```bash
pnpm build
```

### Starting the Production Server
To start the server from the built files (located in the `dist` directory):
```bash
pnpm start
```
This is useful for running the server as a persistent service.

## Error Handling

The server includes error handling for:

- API connection issues
- Invalid memory operations
- Search errors
- Authentication failures

Example error response:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Failed to search memories: Invalid API key"
    }
  ],
  "isError": true
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
