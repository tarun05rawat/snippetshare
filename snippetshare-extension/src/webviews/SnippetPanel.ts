import * as vscode from "vscode";

type Workspace = {
  workspaceId: string;
  name: string;
};

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
  private nonce: string;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.nonce = getNonce();
  }

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

    // Listen for logout postMessage event
    webviewView.webview.onDidReceiveMessage((message) => {
      if (message.command === "logout") {
        vscode.commands.executeCommand("snippetshare.handleLogout");
      } else if (
        message.command === "loginSuccess" ||
        message.command === "signupSuccess"
      ) {
        vscode.commands.executeCommand(
          "snippetshare.handleAuth",
          message.token
        );
      }
    });

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);
  }

  public async showWorkspaces(workspaces: Workspace[]) {
    this._view?.webview.postMessage({
      type: "workspaces",
      payload: workspaces,
    });
  }

  public async showError(error: string) {
    this._view?.webview.postMessage({
      type: "error",
      payload: error,
    });
  }

  public async showLoginForm() {
    this._view?.webview.postMessage({
      type: "logout",
    });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
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
        <meta http-equiv="Content-Security-Policy" content="
          default-src 'none'; 
          style-src 'unsafe-inline' ${webview.cspSource}; 
          script-src 'nonce-${this.nonce}' ${webview.cspSource}; 
          connect-src https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com;
        ">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SnippetShare</title>
        <style>
          body { font-family: sans-serif; padding: 1rem; background: var(--vscode-sideBar-background); color: var(--vscode-foreground); }
          .hidden { display: none; }
          button { padding: 0.5rem; margin-bottom: 0.5rem; width: 100%; }
        </style>
      </head>
      <body>
        <!-- Auth View -->
        <div id="authView">
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
          <div id="error" style="color:red;"></div>
        </div>

        <!-- Workspace View -->
        <div id="workspaceView" class="hidden">
          <h2>📂 Your Workspaces</h2>
          <div id="workspaceList"></div>
          <button id="logout">🚪 Logout</button>
        </div>

        <script nonce="${
          this.nonce
        }" src="https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js"></script>
        <script nonce="${
          this.nonce
        }" src="https://www.gstatic.com/firebasejs/9.22.1/firebase-auth-compat.js"></script>
        <script nonce="${this.nonce}">
          const firebaseConfig = ${JSON.stringify(firebaseConfig)};
          firebase.initializeApp(firebaseConfig);
          const vscode = acquireVsCodeApi();

          // Handle messages from extension
          window.addEventListener('message', (event) => {
            const message = event.data;
            if (message.type === 'workspaces') {
              document.getElementById('authView').classList.add('hidden');
              document.getElementById('workspaceView').classList.remove('hidden');
              const list = document.getElementById('workspaceList');
              list.innerHTML = '';
              message.payload.forEach(ws => {
                const btn = document.createElement('button');
                btn.innerText = ws.name;
                list.appendChild(btn);
              });
            }
            if (message.type === 'error') {
              document.getElementById('error').innerText = message.payload;
            }
            if (message.type === 'logout') {
              document.getElementById('authView').classList.remove('hidden');
              document.getElementById('workspaceView').classList.add('hidden');
            }
          });

          // Login and Signup logic
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

          // Logout
          document.getElementById('logout').addEventListener('click', async () => {
            await firebase.auth().signOut();
            vscode.postMessage({ command: 'logout' });
          });
        </script>
      </body>
      </html>
    `;
  }
}
