import * as vscode from 'vscode';
import { MCPClient } from '../transport/MCPTransport';
import { ConnectionManager, ConnectionInfo } from '../storage/ConnectionManager';
import { getInspectorTemplate } from './templates/InspectorTemplate';
import { ConnectionHandler } from './handlers/ConnectionHandler';
import { ToolExecutionHandler } from './handlers/ToolExecutionHandler';

export class MCPInspectorPanel {
	public static currentPanel: MCPInspectorPanel | undefined;
	private readonly _panel: vscode.WebviewPanel;
	private _disposables: vscode.Disposable[] = [];
    private _mcpClient: MCPClient | null = null;
	private _connectionManager: ConnectionManager;
	private _connectionId?: string;
	private _connectionHandler: ConnectionHandler;
	private _toolExecutionHandler: ToolExecutionHandler;

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, connectionManager: ConnectionManager, connectionId?: string) {
		this._connectionManager = connectionManager;
		this._connectionId = connectionId;
		this._panel = panel;
		this._connectionHandler = new ConnectionHandler(this._panel, this._connectionManager, this._mcpClient);
		this._toolExecutionHandler = new ToolExecutionHandler(this._panel, this._mcpClient);

		this._panel.webview.html = this._getRenderer(this._panel.webview);

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			async message => {
				switch (message.command) {
					case 'connect':
						const connectionData = message.data;
						if (connectionData.transport === 'stdio') {
							this._mcpClient = await this._connectionHandler.handleStdioConnection(connectionData);
							this._toolExecutionHandler.setMCPClient(this._mcpClient);
						} else if (connectionData.transport === 'sse') {
							this._mcpClient = await this._connectionHandler.handleSSEConnection(connectionData);
							this._toolExecutionHandler.setMCPClient(this._mcpClient);
						}
                        break;
                    case 'disconnect':
						await this._connectionHandler.handleMCPDisconnect();
						this._mcpClient = null;
						this._toolExecutionHandler.setMCPClient(null);
                        break;
                    case 'executeTool':
                        await this._toolExecutionHandler.handleToolExecution(message.data.toolName, message.data.args);
                        break;
				}
			},
			null,
			this._disposables
		);
	}

	public static createOrShow(extensionUri: vscode.Uri, connectionManager: ConnectionManager, connectionId?: string) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (MCPInspectorPanel.currentPanel) {
			MCPInspectorPanel.currentPanel._panel.reveal(column);
			// Update connection ID if provided
			if (connectionId) {
				MCPInspectorPanel.currentPanel._connectionId = connectionId;
				MCPInspectorPanel.currentPanel.loadConnectionData();
			}
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			'mcpInspector',
			'MCP Inspector',
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [extensionUri]
			}
		);

		MCPInspectorPanel.currentPanel = new MCPInspectorPanel(panel, extensionUri, connectionManager, connectionId);
		
		// If a connection ID was provided, load the connection data
		if (connectionId) {
			MCPInspectorPanel.currentPanel.loadConnectionData();
		}
	}
	
	private loadConnectionData() {
		if (!this._connectionId) return;
		this._connectionHandler.loadConnectionData(this._connectionId);
	}

	private _getRenderer(webview: vscode.Webview) {
		return getInspectorTemplate(webview);
	}

	public dispose() {
		MCPInspectorPanel.currentPanel = undefined;

		this._panel.dispose();

		while (this._disposables.length) {
			const disposable = this._disposables.pop();
			if (disposable) {
				disposable.dispose();
			}
		}
	}
}
