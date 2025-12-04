print("--- CLEANUP STARTED ---")

import os
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

# ==========================================
# 1. SETUP FIREBASE
# ==========================================
# We look for the key in the same folder as this script
current_dir = os.path.dirname(os.path.abspath(__file__))
key_path = os.path.join(current_dir, "serviceAccountKey.json")

if not os.path.exists(key_path):
    print(f"❌ ERROR: serviceAccountKey.json not found at: {key_path}")
    exit()

try:
    cred = credentials.Certificate(key_path)
    # Check if app is already initialized to avoid errors
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ Connected to Firebase Database!")
except Exception as e:
    print(f"❌ FIREBASE CONNECTION ERROR: {e}")
    exit()

# ==========================================
# 2. DELETE FUNCTION (Recursive)
# ==========================================
def delete_collection(coll_ref, batch_size=50):
    docs = list(coll_ref.limit(batch_size).stream())
    deleted = 0

    if len(docs) == 0:
        return

    for doc in docs:
        print(f"   Deleting doc: {doc.id}")
        
        # ⚠️ RECURSIVE DELETE: Check for subcollections (like 'dishes')
        # This is necessary because deleting a document does NOT delete its subcollections in Firestore
        subcollections = doc.reference.collections()
        for sub in subcollections:
            delete_collection(sub, batch_size)

        doc.reference.delete()
        deleted += 1

    if deleted >= batch_size:
        return delete_collection(coll_ref, batch_size)

# ==========================================
# 3. EXECUTE CLEANUP
# ==========================================
COLLECTIONS_TO_WIPE = ["diningHalls", "diningPoints"]

print("\n⚠️  WARNING: This will delete ALL data in:", COLLECTIONS_TO_WIPE)
print("This is required to clear old data formats before uploading new ones.")
confirm = input("Type 'DELETE' to confirm: ")

if confirm == "DELETE":
    for col_name in COLLECTIONS_TO_WIPE:
        print(f"\n🗑️  Wiping collection: {col_name}...")
        delete_collection(db.collection(col_name))
        print(f"✅ {col_name} cleared.")
    
    print("\n✨ Database is clean. Now run 'upload_menus.py' to add real data!")
else:
    print("❌ Operation cancelled.")