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



# Create a workspace
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




# Get all workspaces for a user
@app.route("/api/workspaces", methods=["GET"])
@firebase_token_required
def get_workspaces():
    user_uid = request.user["uid"]

    # Query Firestore for workspaces where the user is in the members array
    workspaces_ref = db.collection("workspaces").where("members", "array_contains", user_uid)
    workspaces = workspaces_ref.stream()

    result = []
    for workspace in workspaces:
        result.append(workspace.to_dict())

    return jsonify(result), 200



# Get all snippets for a workspace
@app.route("/api/snippets", methods=["GET"])
@firebase_token_required
def get_snippets():
    user_uid = request.user["uid"]
    workspace_id = request.args.get('workspace')

    if not workspace_id:
        return jsonify({"error": "workspace query param is required"}), 400

    # Verify the user is a member of the workspace
    workspace_ref = db.collection("workspaces").document(workspace_id)
    workspace_doc = workspace_ref.get()
    if not workspace_doc.exists:
        return jsonify({"error": "Workspace not found"}), 404

    workspace_data = workspace_doc.to_dict()
    if user_uid not in workspace_data.get("members", []):
        return jsonify({"error": "Access denied - not a workspace member"}), 403

    # Fetch all snippets in this workspace
    snippets_ref = db.collection("snippets").where("workspaceId", "==", workspace_id)
    snippets = snippets_ref.stream()
    result = [snippet.to_dict() for snippet in snippets]

    return jsonify(result), 200


# Create a snippet in a workspace
@app.route("/api/snippets", methods=["POST"])
@firebase_token_required
def create_snippet():
    data = request.get_json()
    workspace_name = data.get("workspaceName")  # Expecting workspace name from the request
    title = data.get("title")
    tags = data.get("tags", [])
    language = data.get("language")
    code = data.get("code")
    
    # Validate required fields
    if not workspace_name:
        return jsonify({"error": "Workspace name is required"}), 400
    if not title or not code:
        return jsonify({"error": "Title and code are required"}), 400

    # Query Firestore for the workspace with the given name
    # and ensure the authenticated user is a member.
    workspaces_query = db.collection("workspaces").where("name", "==", workspace_name)
    workspace_doc = None
    for ws in workspaces_query.stream():
        ws_data = ws.to_dict()
        if request.user["uid"] in ws_data.get("members", []):
            workspace_doc = ws
            break

    if not workspace_doc:
        return jsonify({"error": "Workspace not found or you are not a member"}), 404

    # Use the workspace's document ID as the association
    workspace_id = workspace_doc.id

    # Create snippet data payload
    snippet_data = {
        "workspaceId": workspace_id,
        "title": title,
        "tags": tags,
        "language": language,
        "code": code,
        "createdBy": request.user.get("uid"),
        "createdAt": firestore.SERVER_TIMESTAMP
    }
    doc_ref = db.collection("snippets").document()
    snippet_data["snippetId"] = doc_ref.id
    doc_ref.set(snippet_data)

    return jsonify({"snippetId": doc_ref.id}), 201

#Add Member to Workspace
@app.route("/api/workspaces/<workspace_id>/members/add", methods=["POST"])
@firebase_token_required
def add_workspace_members(workspace_id):
    data = request.get_json()
    add_emails = data.get("members", [])  # Expecting a list of emails to add

    # Fetch the workspace document from Firestore
    workspace_ref = db.collection("workspaces").document(workspace_id)
    workspace_doc = workspace_ref.get()
    if not workspace_doc.exists:
        return jsonify({"error": "Workspace not found"}), 404

    workspace_data = workspace_doc.to_dict()
    current_members = workspace_data.get("members", [])

    # Check if the requesting user is a member of the workspace
    if request.user["uid"] not in current_members:
        return jsonify({"error": "Access denied - you are not a member of this workspace"}), 403

    # Process adding members
    for email in add_emails:
        try:
            user_record = firebase_auth.get_user_by_email(email)
            uid = user_record.uid
            if uid not in current_members:
                current_members.append(uid)
        except firebase_auth.UserNotFoundError:
            return jsonify({"error": f"User with email {email} not found"}), 404

    # Update the workspace with the new members list
    workspace_ref.update({"members": current_members})

    return jsonify({
        "message": "Members added successfully",
        "workspaceId": workspace_id,
        "members": current_members
    }), 200

#Remove Member from Workspace
@app.route("/api/workspaces/<workspace_id>/members/remove", methods=["POST"])
@firebase_token_required
def remove_workspace_members(workspace_id):
    data = request.get_json()
    remove_emails = data.get("members", [])  # Expecting a list of emails to remove

    # Fetch the workspace document from Firestore
    workspace_ref = db.collection("workspaces").document(workspace_id)
    workspace_doc = workspace_ref.get()
    if not workspace_doc.exists:
        return jsonify({"error": "Workspace not found"}), 404

    workspace_data = workspace_doc.to_dict()
    current_members = workspace_data.get("members", [])

    # Check if the requesting user is a member of the workspace
    if request.user["uid"] not in current_members:
        return jsonify({"error": "Access denied - you are not a member of this workspace"}), 403

    # Process removing members
    for email in remove_emails:
        try:
            user_record = firebase_auth.get_user_by_email(email)
            uid = user_record.uid
            if uid in current_members:
                current_members.remove(uid)
        except firebase_auth.UserNotFoundError:
            # If the user isn't found, you can choose to ignore or return an error
            continue

    # Update the workspace with the updated members list
    workspace_ref.update({"members": current_members})

    return jsonify({
        "message": "Members removed successfully",
        "workspaceId": workspace_id,
        "members": current_members
    }), 200



# Delete Snippet
@app.route("/api/snippets/<snippet_id>", methods=["DELETE"])
@firebase_token_required
def delete_snippet(snippet_id):
    # Fetch the snippet document from Firestore
    snippet_ref = db.collection("snippets").document(snippet_id)
    snippet_doc = snippet_ref.get()
    if not snippet_doc.exists:
        return jsonify({"error": "Snippet not found"}), 404

    snippet_data = snippet_doc.to_dict()
    
    # Check that the user requesting deletion is the creator of the snippet
    if snippet_data.get("createdBy") != request.user["uid"]:
        return jsonify({"error": "Not authorized to delete this snippet"}), 403

    # Delete the snippet document from Firestore
    snippet_ref.delete()
    
    return jsonify({"message": "Snippet deleted successfully", "snippetId": snippet_id}), 200



#Update Snippet
@app.route("/api/snippets/<snippet_id>", methods=["PUT"])
@firebase_token_required
def update_snippet(snippet_id):
    data = request.get_json()
    updated_fields = {}

    # Validate and add the fields that can be updated
    if "title" in data:
        updated_fields["title"] = data["title"]
    if "tags" in data:
        updated_fields["tags"] = data["tags"]
    if "language" in data:
        updated_fields["language"] = data["language"]
    if "code" in data:
        updated_fields["code"] = data["code"]

    if not updated_fields:
        return jsonify({"error": "No valid fields to update"}), 400

    # Retrieve the snippet document from Firestore
    snippet_ref = db.collection("snippets").document(snippet_id)
    snippet_doc = snippet_ref.get()
    if not snippet_doc.exists:
        return jsonify({"error": "Snippet not found"}), 404

    snippet_data = snippet_doc.to_dict()

    # Check if the requesting user is the creator of the snippet
    if snippet_data.get("createdBy") != request.user["uid"]:
        return jsonify({"error": "Not authorized to update this snippet"}), 403

    # Update the snippet with new fields
    snippet_ref.update(updated_fields)
    return jsonify({"message": "Snippet updated successfully", "snippetId": snippet_id}), 200


#Delete a Workspace
@app.route("/api/workspaces/<workspace_id>", methods=["DELETE"])
@firebase_token_required
def delete_workspace(workspace_id):
    # Fetch the workspace document from Firestore
    workspace_ref = db.collection("workspaces").document(workspace_id)
    workspace_doc = workspace_ref.get()
    if not workspace_doc.exists:
        return jsonify({"error": "Workspace not found"}), 404

    workspace_data = workspace_doc.to_dict()

    # Only allow deletion if the requesting user is the creator of the workspace
    if workspace_data.get("createdBy") != request.user["uid"]:
        return jsonify({"error": "Only the workspace creator can delete this workspace"}), 403

    # Optionally, delete all snippets associated with this workspace
    snippets_ref = db.collection("snippets").where("workspaceId", "==", workspace_id)
    for snippet in snippets_ref.stream():
        snippet.reference.delete()

    # Delete the workspace document
    workspace_ref.delete()

    return jsonify({
        "message": "Workspace deleted successfully",
        "workspaceId": workspace_id
    }), 200



# Search Snippets in a Workspace
@app.route("/api/snippets/search", methods=["GET"])
@firebase_token_required
def search_snippets():
    user_uid = request.user["uid"]
    workspace_id = request.args.get('workspace')
    search_query = request.args.get('query', "").lower()  # Mandatory query for title search
    language_filter = request.args.get('language', None)   # Optional
    tags_filter = request.args.get('tags', None)           # Optional (comma-separated)

    # Ensure mandatory parameters are provided
    if not workspace_id or not search_query:
        return jsonify({"error": "Both 'workspace' and 'query' parameters are required"}), 400

    # Verify the user is a member of the workspace
    workspace_ref = db.collection("workspaces").document(workspace_id)
    workspace_doc = workspace_ref.get()
    if not workspace_doc.exists:
        return jsonify({"error": "Workspace not found"}), 404

    workspace_data = workspace_doc.to_dict()
    if user_uid not in workspace_data.get("members", []):
        return jsonify({"error": "Access denied - not a workspace member"}), 403

    # Query for all snippets in the workspace
    snippets_ref = db.collection("snippets").where("workspaceId", "==", workspace_id)
    snippets = snippets_ref.stream()

    result = []
    for snippet in snippets:
        snippet_data = snippet.to_dict()
        # Filter by search query in title (case-insensitive)
        title = snippet_data.get("title", "").lower()
        if search_query not in title:
            continue

        # Filter by language if provided
        if language_filter:
            if snippet_data.get("language", "").lower() != language_filter.lower():
                continue

        # Filter by tags if provided
        if tags_filter:
            required_tags = [tag.strip().lower() for tag in tags_filter.split(",")]
            snippet_tags = [tag.lower() for tag in snippet_data.get("tags", [])]
            if not all(tag in snippet_tags for tag in required_tags):
                continue

        result.append(snippet_data)

    return jsonify(result), 200


#Get Snippet by ID
@app.route("/api/snippets/<snippet_id>", methods=["GET"])
@firebase_token_required
def get_snippet(snippet_id):
    # Retrieve the snippet document from Firestore
    snippet_ref = db.collection("snippets").document(snippet_id)
    snippet_doc = snippet_ref.get()
    if not snippet_doc.exists:
        return jsonify({"error": "Snippet not found"}), 404

    snippet_data = snippet_doc.to_dict()

    # Get the workspace ID from the snippet data
    workspace_id = snippet_data.get("workspaceId")
    if not workspace_id:
        return jsonify({"error": "Snippet missing workspace association"}), 400

    # Retrieve the workspace document to verify membership
    workspace_ref = db.collection("workspaces").document(workspace_id)
    workspace_doc = workspace_ref.get()
    if not workspace_doc.exists:
        return jsonify({"error": "Workspace not found"}), 404

    workspace_data = workspace_doc.to_dict()
    # Ensure the requesting user is a member of the workspace
    if request.user["uid"] not in workspace_data.get("members", []):
        return jsonify({"error": "Access denied - you are not a member of the workspace"}), 403

    # If everything is good, return the snippet data
    return jsonify(snippet_data), 200


# 🔵 Root health check
@app.route("/")
def index():
    return "🚀 SnippetShare Backend is running!", 200

if __name__ == "__main__":
    app.run(debug=True, port=8000)
