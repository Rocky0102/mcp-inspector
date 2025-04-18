# MCP Inspector

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/Dhananjay-JSR/mcp-inspector/raw/HEAD/resources/icon-black.png" width="200" height="200">
    <source media="(prefers-color-scheme: light)" srcset="https://github.com/Dhananjay-JSR/mcp-inspector/raw/HEAD/resources/icon-white.png" width="200" height="200">
    <img alt="MCP Inspector" src="https://github.com/Dhananjay-JSR/mcp-inspector/raw/HEAD/resources/icon-black.png" width="200" height="200">
  </picture>
  <h1>MCP Inspector</h1>
</div>

Easily inspect and interact with MCP servers directly from Visual Studio Code—no need to download external inspectors. This extension provides seamless integration for monitoring and debugging MCP protocols within your development environment.

## Features

- **Connection Management**: Save and reuse your MCP server connections
  - Support for both STDIO and SSE transport protocols
  - Easily manage saved connections through the sidebar
  - Quick reconnection to previously used servers
- **Interactive Interface**: Intuitive UI for MCP server interactions
- **Tool Execution**: Execute MCP tools directly from VS Code
- **Transport Support**: Compatible with STDIO and SSE transport protocols

## Usage

1. Click on the MCP Inspector icon in the activity bar
2. Use the "Create New Request" command to start interacting with MCP servers
3. View and manage your MCP operations through the extension
4. Save connections for quick access in future sessions

## Extension Settings

This extension contributes the following commands:

* `mcp-inspector.createNewRequest`: Create a new MCP request

## Known Issues

Please report any issues on the [GitHub repository](https://github.com/Dhananjay-JSR/mcp-inspector/issues).

### Troubleshooting

If you encounter an error like `Error: ENOENT: no such file or directory, open 'out/views/templates/inspector.html'`, it means the HTML, CSS, and JS files weren't copied to the output directory during compilation. Run `npm run compile` to fix this issue, as it will compile the TypeScript files and copy the necessary assets to the output directory.

## Release Notes

### 0.0.1 (2025-03-29)

Initial release of MCP Inspector with:
- List Tool
- STDIO / SSR Transport Support

### 0.0.2 (2025-03-29)

- Tool Execution Support

### 0.0.3 (2025-04-18)

- Fixed ES Module compatibility issue with pkce-challenge dependency
- Added automatic patching scripts for smoother installation
- Added connection management functionality for saving and reusing MCP server connections

## Authors

**Dhananjay Senday** (Original Author)
- Website: [https://dhananjaay.dev](https://dhananjaay.dev)
- Email: [hello@dhananjaay.dev](mailto:hello@dhananjaay.dev)

This project has been enhanced with connection management functionality while maintaining the original design and functionality. Special thanks to Dhananjay Senday for creating the original MCP Inspector extension.

**Enjoy!**
