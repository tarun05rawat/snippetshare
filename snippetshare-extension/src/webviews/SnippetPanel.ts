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
  tags?: string[];
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
      } else if (message.command === "addMember") {
        vscode.commands.executeCommand(
          "snippetshare.addMember",
          message.workspaceId,
          message.workspaceName
        );
      } else if (message.command === "searchSnippets") {
        vscode.commands.executeCommand(
          "snippetshare.searchSnippets",
          message.workspaceId,
          message.query
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
  gap: 10px;
  margin-bottom: 20px;
}

.workspace-item {
  background-color: var(--vscode-editor-background);
  border: 1px solid var(--vscode-editorWidget-border);
  border-radius: 5px;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: transform 0.15s;
}

.workspace-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.workspace-name {
  font-size: 14px;
  font-weight: bold;
  color: var(--vscode-foreground);
  flex: 1;
  cursor: pointer;
}

.delete-btn, .add-btn {
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  color: var(--vscode-foreground);
  opacity: 0.7;
  transition: opacity 0.2s;
}

.delete-btn:hover, .add-btn:hover {
  opacity: 1;
  color: var(--vscode-editorError-foreground);
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
}

.create-btn, .logout-btn {
  background-color: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  border: 1px solid var(--vscode-button-border);
  font-size: 14px;
  padding: 10px;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.2s;
}

.create-btn:hover, .logout-btn:hover {
  background-color: var(--vscode-button-hoverBackground);
  transform: translateY(-1px);
}

.logout-btn {
  background-color: #f44336 !important;
  color: #fff !important;
  border: none !important;
}

.logout-btn:hover {
  background-color: #d32f2f !important;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--vscode-editorForeground);
  margin-bottom: 20px;
}

h1 {
  font-size: 18px;
  letter-spacing: 1px;
  color: var(--vscode-editorForeground);
  margin: 0;
}

.close-btn {
  font-size: 24px;
  cursor: pointer;
  color: var(--vscode-editorHint-foreground);
  opacity: 0.8;
}

.close-btn:hover {
  opacity: 1;
}

h2 {
  font-size: 16px;
  margin-bottom: 10px;
  color: var(--vscode-foreground);
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: normal;
}

.folder-icon {
  opacity: 0.8;
}

body {
  font-family: var(--vscode-font-family, sans-serif);
  font-size: var(--vscode-font-size);
  line-height: 1.5;
  padding: 0.75rem;
  background: var(--vscode-sideBar-background);
  color: var(--vscode-foreground);
}

.hidden {
  display: none;
}

button {
  font-family: inherit;
}

pre {
  background: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
  padding: 8px;
  overflow: auto;
  border-radius: 5px;
  border: 1px solid var(--vscode-editorWidget-border);
}

.snippet-card {
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--vscode-editorWidget-border);
  padding-bottom: 0.5rem;
}

</style>
</head>
      <body>
        <!-- Auth View -->
<div 
  id="authView" 
  style="display: flex; flex-direction: column; align-items: center; gap: 12px;"
>
  <h2 
    style="
      font-size: 18px;
      color: var(--vscode-editorForeground);
      margin: 0;
    "
  >
    🔐 Login
  </h2>

  <!-- Login Wrapper -->
  <div 
    id="loginWrapper" 
    style="width: 100%; max-width: 300px; display: flex; flex-direction: column; gap: 10px;"
  >
    <form 
      id="loginForm" 
      style="
        display: flex; 
        flex-direction: column; 
        gap: 8px; 
      "
    >
      <input 
        type="email" 
        id="email" 
        placeholder="Email" 
        required 
        style="
          padding: 8px;
          border-radius: 4px;
          border: 1px solid var(--vscode-editorWidget-border);
          background: var(--vscode-editor-background);
          color: var(--vscode-foreground);
        "
      />
      <input 
        type="password" 
        id="password" 
        placeholder="Password" 
        required 
        style="
          padding: 8px;
          border-radius: 4px;
          border: 1px solid var(--vscode-editorWidget-border);
          background: var(--vscode-editor-background);
          color: var(--vscode-foreground);
        "
      />
      <button 
        type="submit" 
        style="
          background: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: 1px solid var(--vscode-button-border);
          border-radius: 4px;
          padding: 8px;
          cursor: pointer;
          font-weight: bold;
        "
      >
        Login
      </button>
    </form>
    <div 
      style="
        font-size: 12px; 
        text-align: center; 
        color: var(--vscode-foreground);
      "
    >
      Don't have an account? 
      <button 
        id="showSignup" 
        style="
          background: none; 
          border: none; 
          color: var(--vscode-button-foreground); 
          cursor: pointer; 
          text-decoration: underline;
        "
      >
        Sign Up
      </button>
    </div>
  </div>

  <!-- Signup Wrapper (initially hidden) -->
  <div 
    id="signupWrapper" 
    style="
      width: 100%; 
      max-width: 300px; 
      display: none; 
      flex-direction: column; 
      gap: 10px;
    "
  >
    <h2 
      style="
        font-size: 18px;
        color: var(--vscode-editorForeground);
        margin: 0;
      "
    >
      ✨ Create Account
    </h2>
    <form 
      id="signupForm" 
      style="
        display: flex; 
        flex-direction: column; 
        gap: 8px;
      "
    >
      <input 
        type="email" 
        id="signupEmail" 
        placeholder="Email" 
        required
        style="
          padding: 8px;
          border-radius: 4px;
          border: 1px solid var(--vscode-editorWidget-border);
          background: var(--vscode-editor-background);
          color: var(--vscode-foreground);
        "
      />
      <input 
        type="password" 
        id="signupPassword" 
        placeholder="Password" 
        required
        style="
          padding: 8px;
          border-radius: 4px;
          border: 1px solid var(--vscode-editorWidget-border);
          background: var(--vscode-editor-background);
          color: var(--vscode-foreground);
        "
      />
      <button 
        type="submit"
        style="
          background: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: 1px solid var(--vscode-button-border);
          border-radius: 4px;
          padding: 8px;
          cursor: pointer;
          font-weight: bold;
        "
      >
        Sign Up
      </button>
    </form>
    <div
      style="
        font-size: 12px; 
        text-align: center;
        color: var(--vscode-foreground);
      "
    >
      Already have an account? 
      <button 
        id="showLogin" 
        style="
          background: none; 
          border: none; 
          color: var(--vscode-button-foreground);
          cursor: pointer;
          text-decoration: underline;
        "
      >
        Log In
      </button>
    </div>
  </div>

  <div 
    id="error" 
    style="
      color: red; 
      font-size: 12px; 
      text-align: center;
      margin-top: 8px;
    "
  >
  </div>
</div>


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
        <div id="snippetSearchBar" style="display: flex; gap: 6px; align-items: center; margin-bottom: 10px;">
            <input
              type="text"
              id="snippetSearchInput"
              placeholder="Search title, code, or tags..."
              style="
                flex: 1;
                padding: 4px; 
                border: 1px solid var(--vscode-editorWidget-border); 
                border-radius: 4px; 
                background: var(--vscode-editor-background); 
                color: var(--vscode-foreground);
              "
            />
            <button 
              id="snippetSearchButton" 
              style="
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 4px 8px; 
                border: 1px solid var(--vscode-button-border); 
                border-radius: 4px; 
                background: var(--vscode-button-background); 
                color: var(--vscode-button-foreground);
                cursor: pointer;
                transition: background 0.2s;
              "
              title="Search"
            >
              🔍
            </button>
          </div>
          <div id="snippetList"></div>
          <div style="margin-bottom: 10px;">
          
            <button id="back">🔙 Back to Workspaces</button>
          </div>
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
      document.getElementById('authView').style.display = 'none';
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
        nameDiv.onclick = () => {window.currentWorkspaceId = ws.workspaceId;
        vscode.postMessage({ command: 'workspaceSelected', workspaceId: ws.workspaceId })};
        const addBtn = document.createElement('button');
        addBtn.className = 'add-btn';
        addBtn.innerText = "➕";
        addBtn.title = "Add Members";
        addBtn.onclick = () => vscode.postMessage({
          command: 'addMember',
          workspaceId: ws.workspaceId,
          workspaceName: ws.name
        });
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.innerText = "🗑️";
        delBtn.onclick = () => vscode.postMessage({ command: 'deleteWorkspace', workspaceId: ws.workspaceId, workspaceName: ws.name });
        container.appendChild(addBtn);
        container.appendChild(delBtn);
        container.appendChild(nameDiv);
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
        const tagsLabel = (snippet.tags && snippet.tags.length)
        ? snippet.tags.join(", ")
        : "(no tags)";
        card.innerHTML = \`
          <h3>🔖 \${snippet.title}</h3>
          <pre><code>\${snippet.code}</code></pre>
          <button class="copy-btn" style="
            margin-top: 5px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: 1px solid var(--vscode-button-border);
            border-radius: 4px;
            padding: 4px 8px;
            cursor: pointer;
            font-size: 12px;
          ">📋</button>
          <br />
          <small>Created by: \${snippet.createdBy}</small>
          <br />
          <small>Tags: \${tagsLabel}</small>
        \`;
        list.appendChild(card);
        
        // Handle copy button click
        const copyBtn = card.querySelector('.copy-btn');
        const codeBlock = card.querySelector('pre code');

        copyBtn.addEventListener('click', () => {
          const codeText = codeBlock.innerText;
          navigator.clipboard.writeText(codeText)
            .then(() => {
              vscode.postMessage({ command: 'copySuccess', snippetId: snippet.snippetId });
            })
            .catch(err => {
              vscode.postMessage({ command: 'copyError', snippetId: snippet.snippetId, error: err.message });
            });
        });
      });
      const searchButton = document.getElementById('snippetSearchButton');
      const searchInput = document.getElementById('snippetSearchInput');

      searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        // 🔥 Grab the stored workspace ID
        const workspaceId = window.currentWorkspaceId;

        vscode.postMessage({
          command: 'searchSnippets',
          workspaceId,
          query
        });
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

  const loginWrapper = document.getElementById("loginWrapper");
  const signupWrapper = document.getElementById("signupWrapper");

  const showSignupBtn = document.getElementById("showSignup");
  const showLoginBtn = document.getElementById("showLogin");

  showSignupBtn.addEventListener("click", () => {
    loginWrapper.style.display = "none";
    signupWrapper.style.display = "flex";
  });

  showLoginBtn.addEventListener("click", () => {
    signupWrapper.style.display = "none";
    loginWrapper.style.display = "flex";
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

  // Search Snippets
  const searchButton = document.getElementById('snippetSearchButton');
  const searchInput = document.getElementById('snippetSearchInput');

  searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    // We retrieve the workspaceId from a global variable or from your snippet payload
    vscode.postMessage({
      command: 'searchSnippets',
      workspaceId: window.currentWorkspaceId, // or however you store it
      query
    });
  });

</script>

      </body>
      </html>
    `;
  }
}
