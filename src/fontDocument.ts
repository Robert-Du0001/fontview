import * as vscode from 'vscode';
import * as path from 'path';
import * as opentype from 'opentype.js';

export class FontDocument implements vscode.CustomDocument {
    public readonly uri: vscode.Uri;
    public readonly name: string;
    public readonly extension: string;

    constructor(uri: vscode.Uri) { 
        const { name, ext } = path.parse(uri.fsPath)

        this.uri = uri;
        this.name = name;
        this.extension = ext.replace('.', '')
    }
    
    public dispose(): void {};

    // 获取文件的内容
    public async getContent(): Promise<Uint8Array | null> {
        try {
            return await vscode.workspace.fs.readFile(this.uri);
        } catch (e) {
            vscode.window.showErrorMessage('打开文件失败！');
        }
      
        return null
    }

    // 获取GlyphSet，用于解析字体名字和值
    public getFontMap(): opentype.GlyphSet {
        const font = opentype.loadSync(this.uri.fsPath);

        return font.glyphs
    }
}