import * as vscode from "vscode";
import { createSnippetCommand } from "./commands/createSnippet";
import { SnippetPanel } from "./webviews/SnippetPanel";
import { fetchWorkspaces, fetchSnippets } from "./utils/api";
import type { Snippet } from "./webviews/SnippetPanel";
// 🔑 Temporary token store (global)
export let firebaseToken: string | undefined;

export function setFirebaseToken(token: string) {
  firebaseToken = token;
  vscode.window.showInformationMessage("🔑 Firebase token saved!");
}

export function getFirebaseToken(): string | undefined {
  return firebaseToken;
}

export function activate(context: vscode.ExtensionContext) {
  console.log("🎉 SnippetShare extension is now active!");

  const panel = new SnippetPanel(context);

  // Register SnippetPanel view
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SnippetPanel.viewType, panel)
  );

  // Register "create snippet" command
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

  // Handle login/signup success
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
          vscode.window.showErrorMessage(
            `Error fetching workspaces: ${err.message}`
          );
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "snippetshare.workspaceSelected",
      async (workspaceId: string) => {
        if (!firebaseToken) {
          vscode.window.showErrorMessage("⚠️ Not authenticated!");
          return;
        }
        try {
          const snippets = await fetchSnippets(firebaseToken, workspaceId); // FIXED here!
          if (Array.isArray(snippets)) {
            await panel.showSnippets(snippets as Snippet[]);
          } else {
            throw new Error("Invalid snippets data received.");
          }
        } catch (err: any) {
          await panel.showError(err.message || "Failed to fetch snippets.");
        }
      }
    )
  );

  // Handle logout
  context.subscriptions.push(
    vscode.commands.registerCommand("snippetshare.handleLogout", () => {
      firebaseToken = undefined;
      panel.showLoginForm();
      vscode.window.showInformationMessage("👋 Logged out!");
    })
  );
}

export function deactivate() {}
