from flask import Flask, request, jsonify
from firebase_admin_setup import db
from firebase_admin import auth as firebase_auth, firestore
from functools import wraps
import datetime

app = Flask(__name__)

# 🔐 Middleware to verify Firebase ID Token
def firebase_token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization', None)
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header missing or invalid"}), 401

        id_token = auth_header.split(' ')[1]
        try:
            decoded_token = firebase_auth.verify_id_token(id_token)
            request.user = decoded_token  # You can access request.user['uid'] inside routes
        except Exception as e:
            return jsonify({"error": "Invalid or expired token", "details": str(e)}), 401

        return f(*args, **kwargs)
    return decorated_function

# 🟢 Example: Create a new snippet
@app.route("/api/snippets", methods=["POST"])
@firebase_token_required
def create_snippet():
    data = request.get_json()
    snippet_data = {
        "workspaceId": data.get("workspaceId"),
        "title": data.get("title"),
        "tags": data.get("tags", []),
        "language": data.get("language"),
        "code": data.get("code"),
        "createdBy": request.user.get("uid"),
    }
    doc_ref = db.collection("snippets").document()
    snippet_data["snippetId"] = doc_ref.id
    doc_ref.set(snippet_data)
    return jsonify({"snippetId": doc_ref.id}), 201

# 🟢 Example: Get all snippets for a workspace
@app.route("/api/snippets", methods=["GET"])
@firebase_token_required
def get_snippets():
    workspace_id = request.args.get('workspace')
    snippets_ref = db.collection("snippets").where("workspaceId", "==", workspace_id)
    snippets = snippets_ref.stream()
    result = []
    for snippet in snippets:
        result.append(snippet.to_dict())
    return jsonify(result), 200

# Get all workspaces for a user
@app.route("/api/workspaces", methods=["POST"])
@firebase_token_required
def create_workspace():
    data = request.get_json()
    workspace_name = data.get("name")
    workspace_type = data.get("type", "private")  # Default to private

    if not workspace_name:
        return jsonify({"error": "Workspace name is required"}), 400

    # Always add the creator (request.user["uid"]) as a member
    members_uids = [request.user["uid"]]

    # Only resolve emails if type is "custom"
    if workspace_type == "custom":
        member_emails = data.get("members", [])
        for email in member_emails:
            try:
                user_record = firebase_auth.get_user_by_email(email)
                uid = user_record.uid
                if uid not in members_uids:
                    members_uids.append(uid)
            except firebase_auth.UserNotFoundError:
                return jsonify({"error": f"User with email {email} not found"}), 404

    # Save workspace to Firestore
    doc_ref = db.collection("workspaces").document()
    workspace_data = {
        "workspaceId": doc_ref.id,
        "name": workspace_name,
        "type": workspace_type,
        "members": members_uids,
        "createdBy": request.user["uid"],
        "createdAt": firestore.SERVER_TIMESTAMP
    }
    doc_ref.set(workspace_data)

    return jsonify({"workspaceId": doc_ref.id}), 201


# 🔵 Root health check
@app.route("/")
def index():
    return "🚀 SnippetShare Backend is running!", 200

if __name__ == "__main__":
    app.run(debug=True, port=8000)
