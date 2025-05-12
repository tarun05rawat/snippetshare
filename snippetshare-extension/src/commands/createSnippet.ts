import * as vscode from "vscode";
import { getFirebaseToken } from "../extension";
import { fetchWorkspaces, createSnippet } from "../utils/api";

export async function createSnippetCommand() {
  const token = getFirebaseToken(); // get the token from the firebase
  if (!token) {
    vscode.window.showErrorMessage(
      "⚠️ You must be logged in to create a snippet."
    );
    return;
  } // check if user is logged in

  const editor = vscode.window.activeTextEditor; // get the active editor
  if (!editor) {
    vscode.window.showErrorMessage("⚠️ No active editor found.");
    return;
  } // check if editor is open

  const selectedCode = editor.document.getText(editor.selection);
  if (!selectedCode || selectedCode.trim() === "") {
    vscode.window.showWarningMessage("⚠️ No code selected.");
    return;
  } // check if code is selected

  const title = await vscode.window.showInputBox({
    prompt: "Enter a title for your snippet",
    ignoreFocusOut: true, // keep the input box open
    validateInput: (value) => (value.trim() ? null : "Title cannot be empty."),
  });
  if (!title) {
    return;
  }

  const tagsInput = await vscode.window.showInputBox({
    prompt: "Enter tags (comma-separated, optional)",
    ignoreFocusOut: true,
  });

  let workspacePick; // variable to store the selected workspace
  try {
    const workspaces = await fetchWorkspaces(token);
    if (!workspaces || workspaces.length === 0) {
      vscode.window.showErrorMessage(
        "⚠️ No workspaces found. Please create one first."
      );
      return;
    }

    workspacePick = await vscode.window.showQuickPick(
      // show a quick pick dialog and awaits for the user to select a workspace
      workspaces.map((ws) => ({ label: ws.name, description: ws.workspaceId })),
      { placeHolder: "Select a workspace" }
    );
  } catch (err: any) {
    vscode.window.showErrorMessage(
      `❌ Failed to fetch workspaces: ${err.message}`
    );
    return;
  }

  if (!workspacePick) {
    return;
  }

  const tags = tagsInput ? tagsInput.split(",").map((tag) => tag.trim()) : [];

  const snippetPayload = {
    title,
    tags,
    workspaceId: workspacePick.description,
    workspaceName: workspacePick.label,
    code: selectedCode,
  };

  try {
    await createSnippet(token, snippetPayload);
    vscode.window.showInformationMessage(
      `🚀 Snippet "${title}" created successfully!`
    );
  } catch (err: any) {
    vscode.window.showErrorMessage(
      `❌ Failed to create snippet: ${err.message}`
    );
  }
}
