import * as vscode from 'vscode';
import { JumpProvider } from './JumpProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "vscode-alias-jump" is now active!');

    const provider = new JumpProvider();
    const selector = { scheme: 'file' }; // Apply to all files
    
    const disposable = vscode.languages.registerDefinitionProvider(selector, provider);

    context.subscriptions.push(disposable);
}

export function deactivate() {}
