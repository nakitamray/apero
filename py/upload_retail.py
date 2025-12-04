print("--- UPLOADING VERIFIED RETAIL DATA ---")

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
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ Connected to Firebase Database!")
except Exception as e:
    print(f"❌ FIREBASE CONNECTION ERROR: {e}")
    exit()

# 2. VERIFIED PURDUE LOCATIONS (Correct Addresses & Links)
RETAIL_LOCATIONS = [
    {
        "id": "chick-fil-a",
        "name": "Chick-fil-A",
        "location": "Frieda Parker Hall",
        "address": "401 N Russell St",
        "menuUrl": "https://purdue.campusdish.com/LocationsAndMenus/ChickfilA",
        "type": "diningPoints"
    },
    {
        "id": "jersey-mikes",
        "name": "Jersey Mike's",
        "location": "Griffin Hall North",
        "address": "401 N Russell St",
        "menuUrl": "https://purdue.campusdish.com/LocationsAndMenus/JerseyMikes",
        "type": "diningPoints"
    },
    {
        "id": "qdoba",
        "name": "Qdoba Mexican Eats",
        "location": "Meredith South",
        "address": "1225 1st Street",
        "menuUrl": "https://purdue.campusdish.com/LocationsAndMenus/Qdoba",
        "type": "diningPoints"
    },
    {
        "id": "panera",
        "name": "Panera Bread",
        "location": "Meredith South",
        "address": "1225 1st Street",
        "menuUrl": "https://purdue.campusdish.com/LocationsAndMenus/PaneraBreadCompany",
        "type": "diningPoints"
    },
    {
        "id": "starbucks-pmu",
        "name": "Starbucks (PMU)",
        "location": "Purdue Memorial Union",
        "address": "101 N Grant St",
        "menuUrl": "https://purdue.campusdish.com/LocationsAndMenus/AtlasFamilyMarketplace/Starbucks",
        "type": "diningPoints"
    },
    {
        "id": "starbucks-third",
        "name": "Starbucks (3rd Street)",
        "location": "Third Street Suites",
        "address": "1196 3rd Street",
        "menuUrl": "https://purdue.campusdish.com/LocationsAndMenus/Starbucks3rdStreet",
        "type": "diningPoints"
    },
    {
        "id": "sushi-boss",
        "name": "Sushi Boss",
        "location": "Meredith Hall",
        "address": "201 N Martin Jischke Dr",
        "menuUrl": "https://purdue.campusdish.com/LocationsAndMenus/SushiBoss",
        "type": "diningPoints"
    },
    {
        "id": "1bowl",
        "name": "1Bowl",
        "location": "Meredith Hall",
        "address": "201 N Martin Jischke Dr",
        "menuUrl": "https://purdue.campusdish.com/LocationsAndMenus/1Bowl",
        "type": "diningPoints"
    },
    {
        "id": "petes-za",
        "name": "Pete's Za",
        "location": "Tarkington Hall",
        "address": "1165 W Stadium Ave",
        "menuUrl": "https://purdue.campusdish.com/LocationsAndMenus/PetesZa",
        "type": "diningPoints"
    },
    {
        "id": "walk-ons",
        "name": "Walk-On's Sports Bistreaux",
        "location": "Purdue Memorial Union",
        "address": "101 N Grant St",
        "menuUrl": "https://purdue.campusdish.com/LocationsAndMenus/AtlasFamilyMarketplace/WalkOnsSportsBistreaux",
        "type": "diningPoints"
    },
    {
        "id": "zen",
        "name": "Zen",
        "location": "Purdue Memorial Union",
        "address": "101 N Grant St",
        "menuUrl": "https://purdue.campusdish.com/LocationsAndMenus/AtlasFamilyMarketplace/Zen",
        "type": "diningPoints"
    }
]

# 3. UPLOAD FUNCTION
def upload_data():
    batch = db.batch()
    
    print(f"📦 Uploading {len(RETAIL_LOCATIONS)} verified locations...")
    
    for spot in RETAIL_LOCATIONS:
        doc_ref = db.collection("diningPoints").document(spot["id"])
        
        # Ensure we set ALL fields correctly to overwrite any bad data
        data = {
            "name": spot["name"],
            "type": spot["type"],
            "location": spot["location"], # Display location name (e.g. "Frieda Parker")
            "address": spot["address"],   # Street Address
            "menuUrl": spot["menuUrl"],
            "lastUpdated": firestore.SERVER_TIMESTAMP
        }
        
        batch.set(doc_ref, data, merge=True)
        print(f"   📍 Prepared: {spot['name']}")

    batch.commit()
    print("\n✅ DATABASE UPDATED SUCCESSFULLY.")

if __name__ == "__main__":
    upload_data()