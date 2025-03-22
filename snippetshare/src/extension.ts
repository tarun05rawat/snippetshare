// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { createSnippetCommand } from './commands/createSnippet';
import { SnippetProvider } from './tree/snippetProvider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "snippetshare" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('snippetshare.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from SnippetShare!');
	});
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetshare.createSnippet', createSnippetCommand)
	  );
	  const snippetProvider = new SnippetProvider();
	  context.subscriptions.push(
		vscode.window.registerTreeDataProvider('snippetExplorer', snippetProvider)
	  );	  
	  context.subscriptions.push(
		vscode.commands.registerCommand('snippetshare.insertSnippet', (code: string) => {
		  const editor = vscode.window.activeTextEditor;
		  if (editor) {
			editor.edit(editBuilder => {
			  editBuilder.insert(editor.selection.active, code);
			});
		  } else {
			vscode.window.showErrorMessage('No active text editor found.');
		  }
		})
	  );
	  
}

// This method is called when your extension is deactivated
export function deactivate() {}
