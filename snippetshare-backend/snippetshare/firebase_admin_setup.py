import firebase_admin
from firebase_admin import credentials, firestore
import os
import json

# Load service account JSON from the environment variable
creds_json = os.getenv("GOOGLE_CREDS")
if not creds_json:
    raise Exception("Missing GOOGLE_CREDS environment variable")

# Initialize Firebase Admin SDK (only once)
if not firebase_admin._apps:
    cred = credentials.Certificate(json.loads(creds_json))
    firebase_admin.initialize_app(cred)

# Get Firestore client instance
db = firestore.client()
