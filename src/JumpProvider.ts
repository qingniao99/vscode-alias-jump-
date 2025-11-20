import * as vscode from 'vscode';
import * as path from 'path';

export class JumpProvider implements vscode.DefinitionProvider {
    public async provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Definition | null> {
        const line = document.lineAt(position);
        const pathUri = this.getPath(line.text, position.character);

        if (!pathUri) {
            return null;
        }

        const config = vscode.workspace.getConfiguration('alias-jump');
        const mappings = config.get<Record<string, string>>('mappings', {});
        const allowedSuffix = config.get<string[]>('allowedSuffix', []);
        const rootFile = config.get<string>('rootPath', 'package.json');

        // Resolve project root
        const currentFileUri = document.uri;
        const currentFileDir = vscode.Uri.joinPath(currentFileUri, '..');
        const projectRoot = await this.findProjectRoot(currentFileDir, rootFile);

        if (!projectRoot) {
            return null;
        }

        // Resolve alias
        let resolvedPath = pathUri;
        let matchedAlias = false;

        for (const [alias, target] of Object.entries(mappings)) {
            if (pathUri.startsWith(alias)) {
                const relativeTarget = target.startsWith('/') ? target.slice(1) : target;
                const pathRest = pathUri.slice(alias.length);
                // Join paths using posix style for consistency in URL parts, 
                // but vscode.Uri.joinPath handles platform specific separators for the file system part automatically?
                // Actually, target and pathRest are likely posix-style strings (from import paths).
                // We construct the final relative path first.
                resolvedPath = path.posix.join(relativeTarget, pathRest);
                matchedAlias = true;
                break;
            }
        }

        if (!matchedAlias) {
            return null;
        }

        // Construct full Uri
        // resolvedPath is relative to projectRoot
        // Note: resolvedPath might start with / or not depending on path.posix.join result.
        // vscode.Uri.joinPath treats the second argument as a relative path segment.
        // If resolvedPath starts with /, joinPath might treat it as absolute or relative depending on implementation,
        // but typically it appends. Let's ensure it's clean.
        const finalUri = vscode.Uri.joinPath(projectRoot, resolvedPath);

        // Check file existence
        if (await this.isFile(finalUri)) {
            return new vscode.Location(finalUri, new vscode.Position(0, 0));
        }

        // Try suffixes
        for (const suffix of allowedSuffix) {
            // We can't just append string to Uri.fsPath and make new Uri because of remote schemes.
            // We should manipulate the path string and create a new Uri, or use string manipulation on the path.
            // Easiest is to extend the path of the Uri.
            const uriWithSuffix = finalUri.with({ path: finalUri.path + '.' + suffix });
            if (await this.isFile(uriWithSuffix)) {
                return new vscode.Location(uriWithSuffix, new vscode.Position(0, 0));
            }
        }
        
        // Try index files
        for (const suffix of allowedSuffix) {
            const indexUri = vscode.Uri.joinPath(finalUri, `index.${suffix}`);
             if (await this.isFile(indexUri)) {
                return new vscode.Location(indexUri, new vscode.Position(0, 0));
            }
        }

        return null;
    }

    private getPath(line: string, cursorIndex: number): string | null {
        const regex = /(['"])(.*?)\1/g;
        let match;
        while ((match = regex.exec(line)) !== null) {
            const start = match.index;
            const end = match.index + match[0].length;
            if (cursorIndex >= start && cursorIndex <= end) {
                return match[2];
            }
        }
        return null;
    }

    private async findProjectRoot(currentDir: vscode.Uri, rootFile: string): Promise<vscode.Uri | null> {
        const rootPathUri = vscode.Uri.joinPath(currentDir, rootFile);
        if (await this.isFile(rootPathUri)) {
            return currentDir;
        }
        
        const parentDir = vscode.Uri.joinPath(currentDir, '..');
        // Check if we reached the root of the filesystem
        if (parentDir.fsPath === currentDir.fsPath) {
            return null;
        }
        return this.findProjectRoot(parentDir, rootFile);
    }

    private async isFile(uri: vscode.Uri): Promise<boolean> {
        try {
            const stat = await vscode.workspace.fs.stat(uri);
            return stat.type === vscode.FileType.File;
        } catch (e) {
            return false;
        }
    }
}
