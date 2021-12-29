import * as vscode from 'vscode';
import * as path from 'path';
import { FontDocument } from './fontDocument';

export class FontProvider implements vscode.CustomReadonlyEditorProvider {
    private static readonly viewType = 'fontview.viewer';

    constructor(
		private readonly context: vscode.ExtensionContext
	) { }
    
    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new FontProvider(context);
        
        return vscode.window.registerCustomEditorProvider(FontProvider.viewType, provider);
    }
    
    public openCustomDocument(uri: vscode.Uri): vscode.CustomDocument {
        return new FontDocument(uri);
    }
    
    public async resolveCustomEditor(
        document: FontDocument,
        webviewPanel: vscode.WebviewPanel
    ): Promise<void> {
        webviewPanel.webview.options = {
            enableScripts: true,
        }

        const content = await document.getContent();

        if (!content) return ;

        webviewPanel.webview.html = this.getWebviewContent(
            Buffer.from(content).toString('base64'), 
            document.getFontMap(), 
            document.extension
        );

        webviewPanel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'success':
                        vscode.window.showInformationMessage(message.text);
                        break;
                    case 'error':
                        vscode.window.showErrorMessage(message.text);
                        break;
                }
            }
        );
    }

    private getWebviewContent(base64: string, glyphSet: opentype.GlyphSet, ext: string): string {
        let liHtml = '', liStyle = '';

        for (let i = 0; i < glyphSet.length; i++) {
            const e = glyphSet.get(i);
            
            if (!e.unicode) continue;

            const unicode = e.unicode.toString(16);
            const name = e.name || e.unicode;

            liHtml += `
                <li title="`+unicode+`" data-type="`+name+`" onclick="copyUnicode('`+unicode+`')"></li>
            `;

            liStyle += `
                li[data-type="`+name+`"]:before {
                    content: "\\`+unicode+`";
                }
            `;
        }

        return `
        <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    @font-face {
                        font-family: 'iconfont';
                        src: url("data:font/${ext};base64,${base64}") format("${ext}");
                    }
                    li {
                        width: 60px;
                        height: 60px;
                        font-size: 18px;
                        font-family: 'iconfont';
                        display: inline-block;
                        cursor: pointer;
                        overflow-x: scroll;
                        overflow-y: hidden;
                        line-height: 60px;
                        text-align: center;
                    }
                    ${liStyle}
                </style>
            </head>
            <body>
                <ul>
                    ${liHtml}
                </ul>

                <script>
                    const vscode = acquireVsCodeApi();

                    function copyUnicode(unicode) {
                        navigator.clipboard.writeText(unicode).then(function() {
                            vscode.postMessage({
                                command: 'success',
                                text: '复制成功'
                            });
                        }, function() {
                            vscode.postMessage({
                                command: 'error',
                                text: '复制失败'
                            });
                        });
                    }
                </script>
            </body>
        </html>
        `;
    }
    
}