import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface ConnectionInfo {
    id: string;
    name: string;
    transport: 'stdio' | 'sse';
    timestamp: number;
    // For STDIO connections
    command?: string;
    args?: string;
    // For SSE connections
    serverUrl?: string;
}

export class ConnectionManager {
    private static readonly STORAGE_FILE = 'mcp-connections.json';
    private connections: ConnectionInfo[] = [];
    private storagePath: string;

    constructor(context: vscode.ExtensionContext) {
        this.storagePath = path.join(context.globalStorageUri.fsPath, ConnectionManager.STORAGE_FILE);
        this.loadConnections();
    }

    private loadConnections(): void {
        try {
            if (fs.existsSync(this.storagePath)) {
                const data = fs.readFileSync(this.storagePath, 'utf8');
                this.connections = JSON.parse(data);
            } else {
                // Ensure the directory exists
                const dir = path.dirname(this.storagePath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                this.connections = [];
                this.saveConnections();
            }
        } catch (error) {
            console.error('Failed to load connections:', error);
            this.connections = [];
        }
    }

    private saveConnections(): void {
        try {
            fs.writeFileSync(this.storagePath, JSON.stringify(this.connections, null, 2), 'utf8');
        } catch (error) {
            console.error('Failed to save connections:', error);
        }
    }

    public addConnection(connection: Omit<ConnectionInfo, 'id' | 'timestamp'>): ConnectionInfo {
        const newConnection: ConnectionInfo = {
            ...connection,
            id: this.generateId(),
            timestamp: Date.now()
        };

        this.connections.push(newConnection);
        this.saveConnections();
        return newConnection;
    }

    public getConnections(): ConnectionInfo[] {
        return [...this.connections];
    }

    public getConnection(id: string): ConnectionInfo | undefined {
        return this.connections.find(conn => conn.id === id);
    }

    public removeConnection(id: string): boolean {
        const initialLength = this.connections.length;
        this.connections = this.connections.filter(conn => conn.id !== id);
        
        if (initialLength !== this.connections.length) {
            this.saveConnections();
            return true;
        }
        return false;
    }

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    }
}
