print("--- RETAIL SCRIPT STARTED ---")

import os
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

# 1. SETUP FIREBASE
current_dir = os.path.dirname(os.path.abspath(__file__))
key_path = os.path.join(current_dir, "serviceAccountKey.json")

if not os.path.exists(key_path):
    print(f"❌ ERROR: serviceAccountKey.json not found at: {key_path}")
    exit()

try:
    cred = credentials.Certificate(key_path)
    # Check if app is already initialized
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ Connected to Firebase Database!")
except Exception as e:
    print(f"❌ FIREBASE CONNECTION ERROR: {e}")
    exit()

# 2. RETAIL DATA (Manual List of Popular Spots)
RETAIL_LOCATIONS = [
    {
        "id": "chick-fil-a",
        "name": "Chick-fil-A",
        "location": "Frieda Parker Hall",
        "type": "diningPoints"
    },
    {
        "id": "jersey-mikes",
        "name": "Jersey Mike's",
        "location": "Griffin Hall North",
        "type": "diningPoints"
    },
    {
        "id": "qdoba",
        "name": "Qdoba Mexican Eats",
        "location": "Purdue Memorial Union",
        "type": "diningPoints"
    },
    {
        "id": "panera",
        "name": "Panera Bread",
        "location": "Purdue Memorial Union",
        "type": "diningPoints"
    },
    {
        "id": "starbucks-pmu",
        "name": "Starbucks (PMU)",
        "location": "Purdue Memorial Union",
        "type": "diningPoints"
    },
    {
        "id": "starbucks-third",
        "name": "Starbucks (3rd Street)",
        "location": "Third Street Suites",
        "type": "diningPoints"
    },
    {
        "id": "sushi-boss",
        "name": "Sushi Boss",
        "location": "Meredith Hall",
        "type": "diningPoints"
    },
    {
        "id": "1bowl",
        "name": "1Bowl",
        "location": "Meredith Hall",
        "type": "diningPoints"
    },
    {
        "id": "petes-za",
        "name": "Pete's Za",
        "location": "Tarkington Hall",
        "type": "diningPoints"
    },
    {
        "id": "walk-ons",
        "name": "Walk-On's Sports Bistreaux",
        "location": "Purdue Memorial Union",
        "type": "diningPoints"
    }
]

# 3. UPLOAD FUNCTION
def upload_retail():
    print(f"   💾 Uploading {len(RETAIL_LOCATIONS)} retail locations...")
    
    batch = db.batch()
    
    for spot in RETAIL_LOCATIONS:
        doc_ref = db.collection("diningPoints").document(spot["id"])
        batch.set(doc_ref, spot, merge=True)

    batch.commit()
    print("   ✅ Retail Locations Uploaded.")

if __name__ == "__main__":
    upload_retail()
    print("\n🏁 SCRIPT FINISHED.")