🧩 SnippetShare — VS Code Extension
SnippetShare is a collaborative code snippet manager designed for students and small dev teams — right inside your VS Code editor.

🚀 Features
✅ Log in & Sign Up
Secure authentication via Firebase.

✅ Create & Share Snippets
Easily add code snippets with titles, tags, and language. Snippets are saved to the cloud and accessible from anywhere.

✅ Organized Workspaces
Group snippets into workspaces — whether private or shared — to stay organized and collaborate efficiently.

✅ Real-time Sync
All snippets are backed by a live Flask backend and stored in Firebase Firestore.

✅ User Attribution
Snippets display their original creator, making collaboration transparent and clear.

🧪 Powered By
VS Code Extension API

React (Webview UI)

Flask (Render-deployed backend)

Firebase Auth + Firestore

Firebase Admin SDK

Secure environment variable config for production

🛠 Setup (for local development)
Clone the repo.

Set your backend URL in api.ts or equivalent.

Install dependencies:

bash
Copy
Edit
npm install
Build the extension:

bash
Copy
Edit
npm run build
Launch the extension in a VS Code dev instance:

bash
Copy
Edit
code .
🌐 Backend Deployment
Deployed on Render

Environment variable GOOGLE_CREDS holds the Firebase service account

Exposes routes like:

POST /signup

POST /login

GET /api/snippets

POST /api/workspaces

…and more

📦 Extension Marketplace Link
➡️ Install on Visual Studio Marketplace

(replace yourpublisher.snippetshare with your real identifier)

🤝 Ideal For
College project teams

Hackathon collabs

Internal dev tooling for small startups

Devs tired of scattered code snippets!
