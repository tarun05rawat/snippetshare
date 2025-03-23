import * as vscode from "vscode";

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export class SnippetPanel implements vscode.WebviewViewProvider {
  public static readonly viewType = "snippetshare.snippetPanel";
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
      localResourceRoots: [this.context.extensionUri],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const nonce = getNonce();

    const firebaseConfig = {
      apiKey: "AIzaSyDTHKMSTnAEKWDJDX8Suk_8Mi8jDom6lK8",
      authDomain: "snippetshare-7c73c.firebaseapp.com",
      projectId: "snippetshare-7c73c",
      storageBucket: "snippetshare-7c73c.appspot.com",
      messagingSenderId: "22796622839",
      appId: "1:22796622839:web:450a0f0ce713b60b94acf2",
    };

    return /* html */ `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' ${
          webview.cspSource
        }; script-src 'nonce-${nonce}' ${webview.cspSource};">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Auth</title>
        <style>
          body { font-family: sans-serif; padding: 1rem; background: var(--vscode-sideBar-background); color: var(--vscode-foreground); }
          form { margin-bottom: 1rem; }
          input { margin: 0.2rem 0; padding: 0.4rem; width: 100%; }
          button { padding: 0.4rem; width: 100%; }
          #error { color: red; }
        </style>
      </head>
      <body>
        <h2>🔐 Login</h2>
        <form id="loginForm">
          <input type="email" id="email" placeholder="Email" required />
          <input type="password" id="password" placeholder="Password" required />
          <button type="submit">Login</button>
        </form>
        <h2>✨ Create Account</h2>
        <form id="signupForm">
          <input type="email" id="signupEmail" placeholder="Email" required />
          <input type="password" id="signupPassword" placeholder="Password" required />
          <button type="submit">Sign Up</button>
        </form>
        <div id="error"></div>

        <script nonce="${nonce}" src="https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js"></script>
        <script nonce="${nonce}" src="https://www.gstatic.com/firebasejs/9.22.1/firebase-auth-compat.js"></script>
        <script nonce="${nonce}">
          const firebaseConfig = ${JSON.stringify(firebaseConfig)};
          firebase.initializeApp(firebaseConfig);
          const vscode = acquireVsCodeApi();

          document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            try {
              const user = await firebase.auth().signInWithEmailAndPassword(email, password);
              const token = await user.user.getIdToken();
              vscode.postMessage({ command: 'loginSuccess', token: token });
            } catch (err) {
              document.getElementById('error').innerText = err.message;
            }
          });

          document.getElementById('signupForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            try {
              const user = await firebase.auth().createUserWithEmailAndPassword(email, password);
              const token = await user.user.getIdToken();
              vscode.postMessage({ command: 'signupSuccess', token: token });
            } catch (err) {
              document.getElementById('error').innerText = err.message;
            }
          });
        </script>
      </body>
      </html>
    `;
  }
}
