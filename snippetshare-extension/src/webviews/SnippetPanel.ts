import * as vscode from "vscode";

export type Workspace = {
  workspaceId: string;
  name: string;
};

export type Snippet = {
  snippetId: string;
  title: string;
  code: string;
  createdBy: string;
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
      } else if (message.command === "workspaceSelected") {
        vscode.commands.executeCommand(
          "snippetshare.workspaceSelected",
          message.workspaceId
        );
      } else if (message.command === "backToWorkspaces") {
        vscode.commands.executeCommand("snippetshare.backToWorkspaces");
      } else if (message.command === "createWorkspace") {
        vscode.commands.executeCommand("snippetshare.createWorkspace");
      } else if (message.command === "deleteWorkspace") {
        vscode.commands.executeCommand(
          "snippetshare.deleteWorkspace",
          message.workspaceId,
          message.workspaceName
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

  public async showSnippets(snippets: Snippet[]) {
    this._view?.webview.postMessage({
      type: "snippets",
      payload: snippets,
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
          .workspace-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin-bottom: 25px;
        }

.workspace-item {
            background-color: #f5f5f5;
            border-radius: 6px;
            padding: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: transform 0.2s;
        }

.workspace-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

        .workspace-name {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            }

        .delete-btn {
            background: none;
            border: none;
            color: #888;
            cursor: pointer;
            font-size: 16px;
            padding: 1px;
            border-radius: 4px;
            transition: all 0.2s;
        }

        .delete-btn:hover {
            color: #ff3333;
            background-color: rgba(255, 51, 51, 0.1);
        }

.action-buttons {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.create-btn, .logout-btn {
    width: 100%;
    padding: 15px;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    transition: all 0.2s;
}

.create-btn {
    background-color: #4caf50;
    color: white;
}

.create-btn:hover {
    background-color: #3d8b40;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.logout-btn {
    background-color: #f44336;
    color: white;
}

.logout-btn:hover {
    background-color: #d32f2f;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 15px;
    border-bottom: 2px solid #ffd700;
    margin-bottom: 25px;
}

h1 {
    font-size: 24px;
    letter-spacing: 1px;
    color: #ffd700;
}

.close-btn {
    font-size: 28px;
    cursor: pointer;
    color: #aaa;
}

.close-btn:hover {
    color: #fff;
}

h2 {
    font-size: 22px;
    margin-bottom: 20px;
    color: #aaa;
    display: flex;
    align-items: center;
    gap: 10px;
}

.folder-icon {
    opacity: 0.7;
}

          body { font-family: sans-serif; padding: 1rem; background: var(--vscode-sideBar-background); color: var(--vscode-foreground); }
          .hidden { display: none; }
          button { padding: 0.5rem; margin-bottom: 0.5rem; width: 100%; }
          pre { background: #222; padding: 0.5rem; overflow: auto; border-radius: 5px; }
          .snippet-card { margin-bottom: 1rem; border-bottom: 1px solid #555; padding-bottom: 0.5rem; }
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
</style>
        <!-- Workspace View -->
        <div id="workspaceView" class="hidden">
          <header>
            <h1>SNIPPETS</h1>
            <div class="close-btn" onclick="vscode.postMessage({ command: 'logout' })">×</div>
          </header>

          <div class="workspaces-section">
            <h2><span class="folder-icon">📁</span> Your Workspaces</h2>
            <div id="workspaceList" class="workspace-list"></div>

            <div class="action-buttons">
              <button id="createWorkspace" class="create-btn">➕ Create Workspace</button>
              <button id="logout" class="logout-btn">🚪 Logout</button>
            </div>
          </div>
        </div>


        <!-- Snippets View -->
        <div id="snippetView" class="hidden">
          <h2>📝 Snippets</h2>
          <div id="snippetList"></div>
          <button id="back">🔙 Back to Workspaces</button>
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
      document.getElementById('snippetView').classList.add('hidden');
      const list = document.getElementById('workspaceList');
      list.innerHTML = '';
      message.payload.forEach(ws => {
        const container = document.createElement('div');
        container.className = 'workspace-item';
        const nameDiv = document.createElement('div');
        nameDiv.className = 'workspace-name';
        nameDiv.innerText = ws.name;
        nameDiv.onclick = () => vscode.postMessage({ command: 'workspaceSelected', workspaceId: ws.workspaceId });
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.innerText = "🗑️";
        delBtn.onclick = () => vscode.postMessage({ command: 'deleteWorkspace', workspaceId: ws.workspaceId, workspaceName: ws.name });
        container.appendChild(nameDiv);
        container.appendChild(delBtn);
        list.appendChild(container);
      });
    }
    if (message.type === 'snippets') {
      document.getElementById('workspaceView').classList.add('hidden');
      document.getElementById('snippetView').classList.remove('hidden');
      const list = document.getElementById('snippetList');
      list.innerHTML = '';
      message.payload.forEach(snippet => {
        const card = document.createElement('div');
        card.className = 'snippet-card';
        card.innerHTML = \`
          <h3>🔖 \${snippet.title}</h3>
          <pre><code>\${snippet.code}</code></pre>
          <small>Created by: \${snippet.createdBy}</small>
        \`;
        list.appendChild(card);
      });
    }
    if (message.type === 'error') {
      document.getElementById('error').innerText = message.payload;
    }
    if (message.type === 'logout') {
      document.getElementById('authView').classList.remove('hidden');
      document.getElementById('workspaceView').classList.add('hidden');
      document.getElementById('snippetView').classList.add('hidden');
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

  document.getElementById('logout').addEventListener('click', async () => {
    await firebase.auth().signOut();
    vscode.postMessage({ command: 'logout' });
  });

  document.getElementById('back').addEventListener('click', () => {
    vscode.postMessage({ command: 'backToWorkspaces' });
  });

  // 🚀 NEW Create Workspace listener
  document.getElementById('createWorkspace').addEventListener('click', () => {
    vscode.postMessage({ command: 'createWorkspace' });
  });
</script>

      </body>
      </html>
    `;
  }
}
