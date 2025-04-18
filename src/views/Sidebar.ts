import * as vscode from 'vscode';
import { ConnectionManager, ConnectionInfo } from '../storage/ConnectionManager';

// Register the view provider 
export class McpInspectorViewProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;
	private _connectionManager: ConnectionManager;

	constructor(connectionManager: ConnectionManager) {
		this._connectionManager = connectionManager;
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;
		
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [],
		};

        // Map the webview Renderer to the view type
		this.updateWebview();

        // Handle message from webview to core
		webviewView.webview.onDidReceiveMessage(
			async message => {
				switch (message.command) {
					case 'createNewRequest':
						vscode.commands.executeCommand('mcp--inspector.createNewRequest');
						break;
					case 'createNewRequestWithConnection':
						vscode.commands.executeCommand('mcp--inspector.createNewRequest', message.connectionId);
						break;
					case 'refreshConnections':
						this.updateWebview();
						break;
					case 'confirmDeleteConnection':
						// Use VSCode's native dialog API instead of browser confirm()
						const answer = await vscode.window.showWarningMessage(
							'Are you sure you want to delete this connection?',
							{ modal: true },
							'Yes', 'No'
						);
						if (answer === 'Yes') {
							this._connectionManager.removeConnection(message.connectionId);
							this.updateWebview();
						}
						break;
					case 'deleteConnection':
						this._connectionManager.removeConnection(message.connectionId);
						this.updateWebview();
						break;
				}
			},
			undefined,
			[]
		);
	}

	public updateWebview() {
		if (this._view) {
			this._view.webview.html = this._getRenderer();
		}
	}

    // Get the HTML renderer for the webview
	private _getRenderer() {
		const connections = this._connectionManager.getConnections();
		
		return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>MCP Inspector</title>
				<style>
					body {
						padding: 0;
						margin: 0;
						font-family: var(--vscode-font-family);
						color: var(--vscode-foreground);
					}
					.container {
						padding: 10px;
					}
					button {
						background-color: var(--vscode-button-background);
						color: var(--vscode-button-foreground);
						border: none;
						padding: 8px;
						cursor: pointer;
						border-radius: 2px;
					}
					button:hover {
						background-color: var(--vscode-button-hoverBackground);
					}
					.connection-list {
						margin-top: 15px;
					}
					.connection-item {
						padding: 10px;
						border: 1px solid var(--vscode-panel-border);
						margin-bottom: 8px;
						border-radius: 3px;
						background-color: var(--vscode-editor-background);
					}
					.connection-item:hover {
						background-color: var(--vscode-list-hoverBackground);
					}
					.connection-header {
						display: flex;
						justify-content: space-between;
						align-items: center;
						margin-bottom: 5px;
					}
					.connection-name {
						font-weight: bold;
						font-size: 14px;
					}
					.connection-transport {
						font-size: 12px;
						color: var(--vscode-descriptionForeground);
						background-color: var(--vscode-badge-background);
						padding: 2px 6px;
						border-radius: 10px;
					}
					.connection-details {
						font-size: 12px;
						color: var(--vscode-descriptionForeground);
						margin-bottom: 8px;
					}
					.connection-actions {
						display: flex;
						gap: 5px;
					}
					.action-button {
						flex: 1;
						font-size: 12px;
					}
					.delete-button {
						background-color: var(--vscode-errorForeground);
					}
					.no-connections {
						margin-top: 15px;
						color: var(--vscode-descriptionForeground);
						font-style: italic;
					}
					.timestamp {
						font-size: 11px;
						color: var(--vscode-descriptionForeground);
						margin-top: 5px;
					}
				</style>
			</head>
			<body>
				<div class="container">
					<button onclick="createNewRequest()" style="width: 100%;">
						Create New Request
					</button>
					
					<div class="connection-list">
						<h3>Saved Connections</h3>
						${connections.length === 0 ? 
							'<div class="no-connections">No saved connections</div>' : 
							connections.map(conn => this.renderConnectionItem(conn)).join('')
						}
					</div>
				</div>
				<script>
					const vscode = acquireVsCodeApi();
					
					function createNewRequest() {
						vscode.postMessage({ command: 'createNewRequest' });
					}
					
					function createNewRequestWithConnection(connectionId) {
						vscode.postMessage({ 
							command: 'createNewRequestWithConnection',
							connectionId: connectionId
						});
					}
					
					function deleteConnection(connectionId, event) {
						// Prevent the click from bubbling up to the parent
						event.stopPropagation();
						
						// Send a request to confirm deletion instead of using browser confirm()
						vscode.postMessage({
							command: 'confirmDeleteConnection',
							connectionId: connectionId
						});
					}
					
					function refreshConnections() {
						vscode.postMessage({ command: 'refreshConnections' });
					}
					
					// Refresh connections when the view becomes visible
					document.addEventListener('visibilitychange', () => {
						if (!document.hidden) {
							refreshConnections();
						}
					});
				</script>
			</body>
			</html>
		`;
	}
	
	private renderConnectionItem(connection: ConnectionInfo): string {
		const date = new Date(connection.timestamp);
		const formattedDate = date.toLocaleString();
		
		let details = '';
		if (connection.transport === 'stdio') {
			details = `Command: ${connection.command || 'N/A'}${connection.args ? ` Args: ${connection.args}` : ''}`;
		} else if (connection.transport === 'sse') {
			details = `URL: ${connection.serverUrl || 'N/A'}`;
		}
		
		return `
			<div class="connection-item" onclick="createNewRequestWithConnection('${connection.id}')">
				<div class="connection-header">
					<div class="connection-name">${connection.name}</div>
					<div class="connection-transport">${connection.transport.toUpperCase()}</div>
				</div>
				<div class="connection-details">${details}</div>
				<div class="timestamp">Connected: ${formattedDate}</div>
				<div class="connection-actions">
					<button class="action-button" onclick="createNewRequestWithConnection('${connection.id}')">Use</button>
					<button class="action-button delete-button" onclick="deleteConnection('${connection.id}', event)">Delete</button>
				</div>
			</div>
		`;
	}
}
