import * as vscode from 'vscode';

export class SnippetPanel implements vscode.WebviewViewProvider {
  public static readonly viewType = 'snippetshare.snippetPanel';
  private _view?: vscode.WebviewView;

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri]
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    return /* html */ `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: sans-serif;
            padding: 1rem;
            background-color: var(--vscode-sideBar-background);
            color: var(--vscode-foreground);
          }
          h2 {
            margin-bottom: 1rem;
          }
          .snippet {
            padding: 0.8rem;
            margin-bottom: 1rem;
            border-radius: 0.5rem;
            background: var(--vscode-editorWidget-background);
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
        </style>
      </head>
      <body>
        <h2>📂 My Snippets</h2>
        <div class="snippet">
          <strong>Postgres DB Init</strong>
          <pre><code>CREATE DATABASE myapp;</code></pre>
        </div>
        <div class="snippet">
          <strong>Slugify Function</strong>
          <pre><code>def slugify(text): return text.lower().replace(" ", "-")</code></pre>
        </div>
      </body>
      </html>
    `;
  }
}
