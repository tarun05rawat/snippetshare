import firebase_admin
from firebase_admin import credentials, firestore
import os

# Path to your service account key file
SERVICE_ACCOUNT_PATH = os.path.join(
    os.path.dirname(__file__), '../../snippetshare-service-account.json'
)

# Initialize Firebase Admin SDK (only once)
if not firebase_admin._apps:
    cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred)

# Get Firestore client instance
db = firestore.client()
