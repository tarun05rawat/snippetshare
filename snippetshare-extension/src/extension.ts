import * as vscode from "vscode";
import { createSnippetCommand } from "./commands/createSnippet";
import { SnippetPanel } from "./webviews/SnippetPanel";
import { fetchWorkspaces } from "./utils/api";

// 🔑 Temporary token store (global)
export let firebaseToken: string | undefined;

export function setFirebaseToken(token: string) {
  firebaseToken = token;
  vscode.window.showInformationMessage("🔑 Firebase token saved!");
}

export function clearFirebaseToken() {
  firebaseToken = undefined;
  vscode.window.showInformationMessage("🚪 Logged out successfully!");
}

export function getFirebaseToken(): string | undefined {
  return firebaseToken;
}

export function activate(context: vscode.ExtensionContext) {
  console.log("🎉 SnippetShare extension is now active!");

  // Register create snippet command (Ctrl/Cmd + Alt + S)
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "snippetshare.createSnippet",
      createSnippetCommand
    )
  );

  // Register "insert snippet" command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "snippetshare.insertSnippet",
      (code: string) => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          editor.edit((editBuilder) => {
            editBuilder.insert(editor.selection.active, code);
          });
        } else {
          vscode.window.showErrorMessage("No active text editor found.");
        }
      }
    )
  );

  // Register SnippetPanel (right-side webview)
  const panel = new SnippetPanel(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SnippetPanel.viewType, panel)
  );

  // Handle auth success message from SnippetPanel webview
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "snippetshare.handleAuth",
      async (token: string) => {
        setFirebaseToken(token);
        try {
          const workspaces = await fetchWorkspaces(token);
          await panel.showWorkspaces(workspaces);
          vscode.window.showInformationMessage(
            `✅ Authenticated! Found ${workspaces.length} workspaces.`
          );
        } catch (err: any) {
          await panel.showError(err.message || "Failed to fetch workspaces.");
        }
      }
    )
  );

  // Handle logout message from SnippetPanel webview
  context.subscriptions.push(
    vscode.commands.registerCommand("snippetshare.handleLogout", () => {
      clearFirebaseToken();
      panel.showLoginForm();
    })
  );
}

export function deactivate() {}
