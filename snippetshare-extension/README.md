# 🧩 SnippetShare — VS Code Extension

**SnippetShare** is a collaborative snippet manager built into VS Code that lets developers save, search, organize, and share code snippets with their teams in real-time. It’s designed for students, open-source contributors, and small engineering teams looking to keep their shared knowledge in one place — right inside their IDE.

---

## ✨ Features

- 🔐 **Firebase Authentication**
  - Secure Sign Up & Log In using Firebase Auth
- 🧠 **Smart Workspace System**
  - Group snippets by workspace (e.g. `frontend`, `backend`, `algorithms`)
  - Create private or custom-shared workspaces
- 📝 **Code Snippet Creation**
  - Add title, code, language, tags, and associate it with a workspace
- 🔄 **Real-Time Data Sync**
  - All changes are instantly saved to Firestore via a Flask backend hosted on Render
- 👥 **Collaborative Sharing**
  - Invite teammates by email (using Firebase Admin SDK under the hood)
  - Snippets show their creator’s email for easy attribution
- 🔍 **Powerful Search**
  - Search snippets by title, tag, or code content across workspaces
- 🖥️ **Full Webview-based Interface**
  - Built with React and styled to match VS Code aesthetics

---

## 📸 Screenshots

![login screen](~/Downloads/snippetshare-auth.JPEG "Login Screen")

---

## 🔧 Setup Instructions (Local Dev)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/snippetshare.git
cd snippetshare/snippetshare-extension
```
