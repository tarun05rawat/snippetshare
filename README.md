# SnippetShare

> A VS Code Extension for collaborative snippet management — without leaving your editor.

## 🚀 Use Case

Have you ever been juggling between Slack, Notion, and personal gists just to share code snippets with your team? It's inefficient and distracting.

**SnippetShare** eliminates context-switching by bringing all your shared code snippets directly into VS Code.

---

## 🛠️ What is SnippetShare?

**SnippetShare** is a lightweight, collaborative VS Code extension designed for teams and students to organize, share, and manage code snippets in one place — right inside your editor.

It provides:

- **Private Workspaces** for team or project-based collaboration
- **Snippet Storage** in shared workspaces
- **Role Management** by adding/removing workspace members
- **Search & Filter** functionality to find your snippets fast
- **Copy Snippet** to clipboard (with indentation and formatting intact)

---

## ✨ Features

### 🗂️ Workspaces

- Create dedicated workspaces for different projects or teams.
- Workspaces act as "folders" that group related snippets.

### 👥 Member Management

- Add or remove members in your workspace.
- Collaborators get immediate access to shared snippets.

### 🔐 Auth & Security

- Firebase Authentication (Email/Password) integrated.
- Only authenticated users can access or modify workspaces.

### 🔎 Snippet Search

- Search snippets by title, code content, or tags.
- Ideal for quickly finding reusable code blocks.

### 📋 Copy Snippet Button

- Easily copy code to your clipboard with one click.
- Preserves formatting and indentation.

### ⚡ Everything inside VS Code

- No more jumping between apps.
- All actions (create workspace, manage members, search, share) happen inside VS Code's sidebar.

---

## 💡 Example Use Cases

### 🧑‍💻 For Development Teams

- Share boilerplate code, configs, or utility functions.
- Set up "Frontend Team", "Backend Team", or "DevOps" workspaces.

### 🎓 For Students / Study Groups

- Share algorithms, notes, or project-specific snippets.
- Organize "DSA Prep", "Web Project Group", or "Class Notes" workspaces.

### 🚀 For Hackathons

- Collaborate on-the-fly with teammates during time-sensitive coding sprints.
- One workspace = one hackathon project.

---

## 🏗️ Technical Highlights

- **VS Code API** for UI rendering inside the activity bar
- **Webview Panel** for authentication and workspace/snippet management
- **Firebase Auth & Firestore** as backend services
- **Flask API Layer** for secure communication between the extension and database
- **Secure CSP Policy** applied for webviews
- **Shadcn/ui & Lucide Icons** for clean UI components

---

## 🛠️ Setup & Installation

```bash
# Install vsce if needed
npm install -g @vscode/vsce

# Package the extension
vsce package

# Install the generated .vsix file
code --install-extension snippetshare-<version>.vsix
```

---

## 🎯 Value Proposition

**Why go outside VS Code when everything you need is right here?**

- 🧠 Minimize context-switching
- 🚀 Speed up snippet sharing and collaboration
- 🏡 Keep your team productive — inside the editor

---

## 🔗 Future Plans

- Roles & Permissions (e.g., admin-only actions)
- Code snippet versioning
- VS Code command palette integrations
- Multi-language snippet tagging

---

## 💬 Feedback & Contributions

We welcome suggestions and contributions! PRs and issue reports are appreciated.

---

Enjoy SnippetShare 🎉
