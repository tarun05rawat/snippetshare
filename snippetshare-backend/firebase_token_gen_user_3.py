import pyrebase

firebase_config = {
    "apiKey": "AIzaSyDTHKMSTnAEKWDJDX8Suk_8Mi8jDom6lK8",
    "authDomain": "snippetshare-7c73c.firebaseapp.com",
    "projectId": "snippetshare-7c73c",
    "storageBucket": "snippetshare-7c73c.appspot.com",
    "messagingSenderId": "22796622839",
    "appId": "1:22796622839:web:450a0f0ce713b60b94acf2",
    "databaseURL": ""  # leave blank since you're only using Firestore
}

firebase = pyrebase.initialize_app(firebase_config)
auth = firebase.auth()

# Your Firebase test user (make sure this user exists in Firebase Auth dashboard)
email = "test3@example.com"
password = "test123456"

user = auth.sign_in_with_email_and_password(email, password)
id_token = user['idToken']

print(f"\n✅ Your Firebase ID Token (paste this into Postman):\n\n{ id_token }\n")
