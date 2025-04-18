import * as vscode from 'vscode';
import { MCPClient } from '../../transport/MCPTransport';
import { ConnectionManager } from '../../storage/ConnectionManager';

export class ConnectionHandler {
    constructor(
        private readonly _panel: vscode.WebviewPanel,
        private readonly _connectionManager: ConnectionManager,
        private _mcpClient: MCPClient | null
    ) {}

    public async handleStdioConnection(connectionData: any): Promise<MCPClient | null> {
        try {
            // Create a new MCP client for this session
            this._mcpClient = new MCPClient();

            const serverScriptPath = connectionData.command;
            const scriptArgs = connectionData.args || '';

            // Connect to the server using STDIO
            const result = await this._mcpClient.connectToStdio(serverScriptPath, scriptArgs);

            if (result.success) {
                // Check if a similar connection already exists to avoid duplicates
                const existingConnections = this._connectionManager.getConnections();
                let savedConnection = existingConnections.find(conn => 
                    conn.transport === 'stdio' && 
                    conn.command === serverScriptPath && 
                    conn.args === scriptArgs
                );
                
                // If no existing connection found, save the new one
                if (!savedConnection) {
                    const connectionName = `STDIO: ${serverScriptPath.split('/').pop()}`;
                    savedConnection = this._connectionManager.addConnection({
                        name: connectionName,
                        transport: 'stdio',
                        command: serverScriptPath,
                        args: scriptArgs
                    });
                    
                    // Update sidebar to show the new connection
                    vscode.commands.executeCommand('mcp--inspector.refreshSidebar');
                }
                
                
                // Send success message back to webview
                this._panel.webview.postMessage({
                    command: 'connectionStatus',
                    data: {
                        success: true,
                        tools: result.tools,
                        connectionId: savedConnection.id
                    }
                });

                return this._mcpClient;
            } else {
                // Send error message back to webview
                this._panel.webview.postMessage({
                    command: 'connectionStatus',
                    data: {
                        success: false,
                        error: result.error
                    }
                });

                return null;
            }
        } catch (error) {
            this._panel.webview.postMessage({
                command: 'connectionStatus',
                data: {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error occurred'
                }
            });

            return null;
        }
    }

    public async handleSSEConnection(connectionData: any): Promise<MCPClient | null> {
        try {
            // Create a new MCP client for this session
            this._mcpClient = new MCPClient();

            // Get the server URL
            const serverUrl = connectionData.serverUrl;
            
            // Connect to the server using SSE
            const result = await this._mcpClient.connectToSSE(serverUrl);
            
            if (result.success) {
                // Check if a similar connection already exists to avoid duplicates
                const existingConnections = this._connectionManager.getConnections();
                let savedConnection = existingConnections.find(conn => 
                    conn.transport === 'sse' && 
                    conn.serverUrl === serverUrl
                );
                
                // If no existing connection found, save the new one
                if (!savedConnection) {
                    const url = new URL(serverUrl);
                    const connectionName = `SSE: ${url.hostname}`;
                    savedConnection = this._connectionManager.addConnection({
                        name: connectionName,
                        transport: 'sse',
                        serverUrl: serverUrl
                    });
                    
                    // Update sidebar to show the new connection
                    vscode.commands.executeCommand('mcp--inspector.refreshSidebar');
                }
                
                
                // Send success message back to webview
                this._panel.webview.postMessage({
                    command: 'connectionStatus',
                    data: {
                        success: true,
                        tools: result.tools,
                        connectionId: savedConnection.id
                    }
                });

                return this._mcpClient;
            } else {
                // Send error message back to webview
                this._panel.webview.postMessage({
                    command: 'connectionStatus',
                    data: {
                        success: false,
                        error: result.error
                    }
                });

                return null;
            }
        } catch (error) {
            this._panel.webview.postMessage({
                command: 'connectionStatus',
                data: {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error occurred'
                }
            });

            return null;
        }
    }

    public async handleMCPDisconnect(): Promise<void> {
        if (this._mcpClient) {
            await this._mcpClient.disconnect();
            this._mcpClient = null;
            
            // Send disconnect status to webview
            this._panel.webview.postMessage({
                command: 'connectionStatus',
                data: {
                    success: true,
                    disconnected: true
                }
            });
        }
    }

    public loadConnectionData(connectionId: string): void {
        const connection = this._connectionManager.getConnection(connectionId);
        if (!connection) return;
        
        // Send the connection data to the webview to pre-fill the form
        this._panel.webview.postMessage({
            command: 'loadConnectionData',
            data: connection
        });
        
        // Auto-connect after a short delay to allow the form to be populated
        setTimeout(() => {
            this._panel.webview.postMessage({
                command: 'autoConnect'
            });
        }, 500);
    }

    public getMCPClient(): MCPClient | null {
        return this._mcpClient;
    }

    public setMCPClient(client: MCPClient | null): void {
        this._mcpClient = client;
    }
}
