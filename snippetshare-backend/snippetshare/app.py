from flask import Flask, request, jsonify
from firebase_admin_setup import db
from firebase_admin import auth as firebase_auth, firestore
from functools import wraps
import datetime
from flask_cors import CORS



app = Flask(__name__)
CORS(app)  # <-- Allow all origins (or customize)

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

#Signup User
@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    try:
        user_record = firebase_auth.create_user(email=email, password=password)
        return jsonify({'uid': user_record.uid}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
#Login user
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    try:
        # Optional: Just verify user exists, since Admin SDK does not check passwords
        user_record = firebase_auth.get_user_by_email(email)
        # You might later issue a custom token here if needed
        return jsonify({'uid': user_record.uid}), 200
    except firebase_auth.UserNotFoundError:
        return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500



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


# Get Snippets in a workspace
@app.route("/api/snippets", methods=["GET"])
@firebase_token_required
def get_snippets():
    user_uid = request.user["uid"]
    workspace_id = request.args.get('workspace')

    if not workspace_id:
        return jsonify({"error": "workspace query param is required"}), 400

    # Verify user is a member of the workspace
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

    result = []
    uids_to_lookup = set()
    snippets_list = []

    for snap in snippets:
        snippet_data = snap.to_dict()
        created_by = snippet_data.get("createdBy")

        # Ensure we always extract just the uid string
        if isinstance(created_by, dict):
            created_by_uid = created_by.get("uid")
        elif isinstance(created_by, str):
            created_by_uid = created_by
        else:
            created_by_uid = None

        if created_by_uid:
            uids_to_lookup.add(created_by_uid)

        snippet_data["__created_by_uid"] = created_by_uid
        snippets_list.append(snippet_data)

    # Batch fetch all user emails via Firebase Admin
    user_records = {}
    if uids_to_lookup:
        for uid in uids_to_lookup:
            try:
                user = firebase_auth.get_user(uid)
                user_records[uid] = user.email
            except Exception as e:
                user_records[uid] = "unknown@user"

    # Replace UID with email
    for snippet in snippets_list:
        uid = snippet.get("__created_by_uid")
        snippet["createdBy"] = user_records.get(uid, "unknown@user")
        snippet.pop("__created_by_uid", None)
        result.append(snippet)

    return jsonify(result), 200


# Create a snippet
@app.route("/api/snippets", methods=["POST"])
@firebase_token_required
def create_snippet():
    user_uid = request.user["uid"]

    data = request.get_json()
    required_fields = ["title", "code", "workspaceId", "workspaceName"]

    # Basic validation
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    snippet = {
        "title": data.get("title").strip(),
        "code": data.get("code"),
        "tags": data.get("tags") or [],
        "workspaceId": data.get("workspaceId"),
        "workspaceName": data.get("workspaceName"),
        "createdBy": user_uid,  # Only store UID here ✅
        "createdAt": firestore.SERVER_TIMESTAMP,
    }

    doc_ref = db.collection("snippets").document()
    snippet["snippetId"] = doc_ref.id
    doc_ref.set(snippet)

    return jsonify({"message": "Snippet created!", "snippetId": doc_ref.id}), 201



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


#Delete Snippet
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
    created_by = snippet_data.get("createdBy", {})
    if created_by.get("uid") != request.user["uid"]:
        return jsonify({"error": "Not authorized to delete this snippet"}), 403

    # Delete the snippet document from Firestore
    snippet_ref.delete()
    
    return jsonify({"message": "Snippet deleted successfully", "snippetId": snippet_id}), 200




# Update Snippet
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
    created_by = snippet_data.get("createdBy", {})
    if created_by.get("uid") != request.user["uid"]:
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
    search_query = request.args.get('query', "").lower()

    # verify membership, etc. omitted for brevity

    snippets_ref = db.collection("snippets").where("workspaceId", "==", workspace_id)
    snapshots = snippets_ref.stream()

    # We'll store matching snippet docs first
    matching_snippets = []
    uids_to_lookup = set()

    for snap in snapshots:
        snippet_data = snap.to_dict()

        # 1) do your search filter checks
        title_str = snippet_data.get("title", "").lower()
        code_str = snippet_data.get("code", "").lower()
        tags_str = " ".join(t.lower() for t in snippet_data.get("tags", []))

        if (search_query in title_str) or (search_query in code_str) or (search_query in tags_str):
            # 2) keep track of createdBy for user lookup
            created_by = snippet_data.get("createdBy")
            if isinstance(created_by, str):
                uids_to_lookup.add(created_by)

            # or if created_by is a dict, do similarly
            snippet_data.setdefault("snippetId", snap.id)
            matching_snippets.append(snippet_data)

    # 3) Now batch fetch user emails
    user_records = {}
    for uid in uids_to_lookup:
        try:
            user_record = firebase_auth.get_user(uid)
            user_records[uid] = user_record.email
        except:
            user_records[uid] = "unknown@user"

    # 4) Replace createdBy with email
    results = []
    for snippet_data in matching_snippets:
        created_by = snippet_data.get("createdBy")
        if isinstance(created_by, str):
            snippet_data["createdBy"] = user_records.get(created_by, "unknown@user")
        results.append(snippet_data)

    return jsonify(results), 200




# Get Snippet by ID
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

    # No modification needed to snippet_data; it already contains { uid, email } for createdBy now

    return jsonify(snippet_data), 200



# 🔵 Root health check
@app.route("/")
def index():
    return "🚀 SnippetShare Backend is running!", 200

if __name__ == "__main__":
    app.run(debug=True, port=8000)
