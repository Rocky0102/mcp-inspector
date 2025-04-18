import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function getInspectorTemplate(webview: vscode.Webview): string {
    // Get paths to the external files
    const htmlPath = path.join(__dirname, 'inspector.html');
    const cssPath = path.join(__dirname, 'inspector.css');
    const jsPath = path.join(__dirname, 'inspector.js');

    // Read the content of the files
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    const jsContent = fs.readFileSync(jsPath, 'utf8');

    // Create URIs for the CSS and JS files
    const cssUri = webview.asWebviewUri(vscode.Uri.file(cssPath));
    const scriptUri = webview.asWebviewUri(vscode.Uri.file(jsPath));

    // Replace the placeholders in the HTML with the actual content
    htmlContent = htmlContent
        .replace('{{cssUri}}', cssUri.toString())
        .replace('{{scriptUri}}', scriptUri.toString());

    return htmlContent;
}
