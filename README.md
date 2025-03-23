# SnippetShare

## 🚀 Use Case

Tired of juggling Slack messages, Notion docs, and endless browser tabs to find a single code snippet shared by your team? Developers often waste time switching contexts and searching through external tools for reusable code. SnippetShare brings your team’s snippet collaboration directly **inside VS Code**, where you’re already working.

## 💡 The Solution: SnippetShare

SnippetShare is a VS Code extension combined with a secure Flask & Firebase backend, allowing teams to:

- Collaborate and share code snippets within private workspaces.
- Avoid leaving your IDE to share, search, or manage team snippets.
- Maintain team knowledge in one place with seamless access.

## ✨ Features

- 🔐 **Authentication (Login / Signup) via Firebase Auth**
- 📂 **Workspace Management**
  - Create private or shared workspaces
  - Add or remove members securely
  - Delete workspaces
- 📝 **Snippet Management**
  - View and search snippets within a workspace
  - Filter by title, code, or tags
  - Copy code snippets to clipboard (with preserved indentation)
- 🔎 **Full-text search** within workspaces
- 🔄 **One-click access** to all workspace snippets inside VS Code
- ⚙️ **Contextual commands** (e.g., insert snippet directly into active editor)

## 🧠 Why SnippetShare?

- No more switching to external collaboration tools.
- Secure & organized code sharing.
- Fits natively into your VS Code workflow.

## 💼 Example Use Cases

- **Student project teams** collaborating on assignments.
- **Internal engineering teams** sharing deployment scripts, SQL queries, or common utility functions.
- **Freelancers & agencies** maintaining client-specific workspaces.

## 🛠️ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/your-username/snippetshare.git
cd snippetshare
```

### 2. Install VS Code extension dependencies

```bash
cd snippetshare-extension
npm install
```

### 3. Package the extension (optional)

```bash
npm install -g @vscode/vsce
vsce package
```

### 4. Install the extension locally

```bash
code --install-extension ./snippetshare-*.vsix
```

---

### 🖥️ Backend Setup (Flask + Firebase)

### 1. Navigate to backend directory

```bash
cd snippetshare-backend
```

### 2. Create & activate virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install backend dependencies

```bash
pip install -r requirements.txt
```

### 4. Set environment variables

Create a `.env` file in `snippetshare-backend/` with:

```env
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_sender_id
FIREBASE_APP_ID=your_firebase_app_id
```

### 5. Run the backend server

```bash
flask run --port=5000
```

> ⚠️ Note: The VS Code extension will communicate with this backend via HTTP on port 5000.

---

## 🧩 Tech Stack

- **Frontend**: VS Code Webview API (HTML/CSS/JS)
- **Backend**: Flask + Firebase Admin SDK
- **Auth**: Firebase Authentication
- **Database**: Firebase Firestore
- **Packaging**: VSCE CLI (for extension distribution)

---

## 📢 Value Proposition

> Everything happens inside VS Code. Why go outside?

---

## 🤖 Future Improvements

- ⭐ Snippet tagging + categories
- 🛠️ Role-based access control (RBAC)
- 📨 In-app notifications for workspace events
- 🔔 Webhooks for CI/CD integrations

---

## License

[MIT](LICENSE)
