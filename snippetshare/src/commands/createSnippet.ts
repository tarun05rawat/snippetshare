import * as vscode from 'vscode';

export async function createSnippetCommand() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor found.");
    return;
  }

  const selectedCode = editor.document.getText(editor.selection);
  if (!selectedCode) {
    vscode.window.showWarningMessage("No code selected.");
    return;
  }

  const title = await vscode.window.showInputBox({
    prompt: 'Enter a title for your snippet',
    ignoreFocusOut: true,
  });

  if (!title) return;

  const tagsInput = await vscode.window.showInputBox({
    prompt: 'Enter tags (comma-separated)',
    ignoreFocusOut: true,
  });

  const workspace = await vscode.window.showQuickPick(
    ['Private', 'Global'],
    { placeHolder: 'Select a workspace' }
  );

  if (!workspace) return;

  const snippetData = {
    title,
    tags: tagsInput?.split(',').map(tag => tag.trim()),
    workspace,
    code: selectedCode,
  };

  vscode.window.showInformationMessage(`Snippet "${title}" created 🎉`);
}
