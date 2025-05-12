import * as vscode from "vscode";
import { createSnippetCommand } from "./commands/createSnippet";
import { SnippetPanel } from "./webviews/SnippetPanel";
import {
  fetchWorkspaces,
  fetchSnippets,
  createWorkspace,
  addMembersToWorkspace,
  searchSnippets,
  deleteWorkspace,
} from "./utils/api";
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

  //Register 'create workspace' command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "snippetshare.createWorkspace",
      async () => {
        const token = getFirebaseToken();
        if (!token) {
          vscode.window.showErrorMessage("⚠️ You must be logged in.");
          return;
        }

        const name = await vscode.window.showInputBox({
          prompt: "Enter a name for your workspace",
          ignoreFocusOut: true, // keep the input box open
          validateInput: (value) =>
            value.trim() ? null : "Workspace name cannot be empty.",
        });
        if (!name) {
          return;
        }

        const type = await vscode.window.showQuickPick(["private", "custom"], {
          placeHolder: "Select workspace type",
        });
        if (!type) {
          return;
        }

        try {
          await createWorkspace(token, { name: name.trim(), type });
          vscode.window.showInformationMessage(
            `✅ Workspace "${name}" created!`
          );
          const workspaces = await fetchWorkspaces(token);
          await panel.showWorkspaces(workspaces);
        } catch (err: any) {
          vscode.window.showErrorMessage(
            `❌ Failed to create workspace: ${err.message}`
          );
        }
      }
    )
  );

  // Add Members to Workspace
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "snippetshare.addMember",
      async (workspaceId: string, workspaceName: string) => {
        if (!firebaseToken) {
          vscode.window.showErrorMessage("⚠️ Not authenticated!");
          return;
        }

        const input = await vscode.window.showInputBox({
          prompt: `Add member(s) to "${workspaceName}" (comma-separated emails)`,
          ignoreFocusOut: true,
        });

        if (!input) {
          return;
        }

        const emails = input.split(",").map((e) => e.trim()); // Split by comma and trim whitespace

        try {
          await addMembersToWorkspace(firebaseToken, workspaceId, emails);
          vscode.window.showInformationMessage(
            `✅ Added member(s) to "${workspaceName}"`
          );
        } catch (err: any) {
          vscode.window.showErrorMessage(
            `❌ Failed to add members: ${err.message}`
          );
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "snippetshare.searchSnippets",
      async (workspaceId: string, query: string) => {
        if (!firebaseToken) {
          vscode.window.showErrorMessage("⚠️ Not authenticated!");
          return;
        }

        try {
          const results = (await searchSnippets(
            firebaseToken,
            workspaceId,
            query
          )) as Snippet[];
          panel.showSnippets(results);
        } catch (err: any) {
          vscode.window.showErrorMessage(`❌ Search failed: ${err.message}`);
        }
      }
    )
  );

  //Delete Workspace

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "snippetshare.deleteWorkspace",
      async (workspaceId: string, workspaceName: string) => {
        if (!firebaseToken) {
          vscode.window.showErrorMessage("⚠️ Not authenticated!");
          return;
        }

        const confirm = await vscode.window.showInformationMessage(
          `Are you sure you want to delete workspace "${workspaceName}"?`,
          { modal: true },
          "Yes"
        );

        if (confirm === "Yes") {
          try {
            // 1) Actually call your API
            await deleteWorkspace(firebaseToken, workspaceId);

            // 2) Notify the user
            vscode.window.showInformationMessage(
              `✅ Workspace "${workspaceName}" deleted!`
            );

            // 3) Re-fetch the updated list
            const workspaces = await fetchWorkspaces(firebaseToken);

            // 4) Show the updated list in your SnippetPanel
            await panel.showWorkspaces(workspaces);
          } catch (err: any) {
            vscode.window.showErrorMessage(
              `❌ Failed to delete workspace: ${err.message}`
            );
          }
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

  // Handle workspace selection
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "snippetshare.workspaceSelected",
      async (workspaceId: string) => {
        if (!firebaseToken) {
          vscode.window.showErrorMessage("⚠️ Not authenticated!");
          return;
        }
        try {
          const snippets = await fetchSnippets(firebaseToken, workspaceId);
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

  // Handle back to workspaces
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "snippetshare.backToWorkspaces",
      async () => {
        if (!firebaseToken) {
          vscode.window.showErrorMessage("⚠️ Not authenticated!");
          return;
        }
        try {
          const workspaces = await fetchWorkspaces(firebaseToken);
          await panel.showWorkspaces(workspaces);
          vscode.window.showInformationMessage("📂 Returned to workspaces.");
        } catch (err: any) {
          await panel.showError(err.message || "Failed to reload workspaces.");
          vscode.window.showErrorMessage(
            `Error reloading workspaces: ${err.message}`
          );
        }
      }
    )
  );
}

export function deactivate() {}
