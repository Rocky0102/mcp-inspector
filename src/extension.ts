import * as vscode from 'vscode';
import { McpInspectorViewProvider } from './views/Sidebar';
import { MCPInspectorPanel } from './views/Inspector';
import { ConnectionManager } from './storage/ConnectionManager';

// Keep track of the sidebar provider to allow refreshing it
let sidebarProvider: McpInspectorViewProvider;

export function activate(context: vscode.ExtensionContext) {
	// Initialize the connection manager
	const connectionManager = new ConnectionManager(context);
	
	const viewId ="mcp--inspector.inspector-view";
	sidebarProvider = new McpInspectorViewProvider(connectionManager);
	const viewRegisterer = vscode.window.registerWebviewViewProvider(
		viewId,
		sidebarProvider
	);
	context.subscriptions.push(viewRegisterer);
	
	// Register command to create a new request with optional connection data
	const createNewRequestCommand = vscode.commands.registerCommand('mcp--inspector.createNewRequest', (connectionId?: string) => {
		MCPInspectorPanel.createOrShow(context.extensionUri, connectionManager, connectionId);
	});
	context.subscriptions.push(createNewRequestCommand);
	
	// Register command to refresh the sidebar view
	const refreshSidebarCommand = vscode.commands.registerCommand('mcp--inspector.refreshSidebar', () => {
		if (sidebarProvider) {
			sidebarProvider.updateWebview();
		}
	});
	context.subscriptions.push(refreshSidebarCommand);
}

export function deactivate() {}
