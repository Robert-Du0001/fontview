import * as vscode from 'vscode';
import { FontProvider } from './fontProvider';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(FontProvider.register(context));
}