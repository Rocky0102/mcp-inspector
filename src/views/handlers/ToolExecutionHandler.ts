import * as vscode from 'vscode';
import { MCPClient } from '../../transport/MCPTransport';

export class ToolExecutionHandler {
    constructor(
        private readonly _panel: vscode.WebviewPanel,
        private _mcpClient: MCPClient | null
    ) {}

    public async handleToolExecution(toolName: string, args: Record<string, any>): Promise<void> {
        try {
            if (!this._mcpClient) {
                throw new Error('Not connected to MCP server');
            }

            const result = await this._mcpClient.executeTool(toolName, args);
            
            this._panel.webview.postMessage({
                command: 'toolExecutionResponse',
                data: result
            });
        } catch (error) {
            this._panel.webview.postMessage({
                command: 'toolExecutionResponse',
                data: {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error occurred'
                }
            });
        }
    }

    public setMCPClient(client: MCPClient | null): void {
        this._mcpClient = client;
    }

    public getMCPClient(): MCPClient | null {
        return this._mcpClient;
    }
}
