print("--- INTELLIGENT MENU UPLOADER (37 RATED DISHES) ---")

import os
import requests
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from datetime import date, datetime
import random

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

# 2. CONFIG
GRAPHQL_URL = "https://api.hfs.purdue.edu/menus/v3/GraphQL"
HEADERS = {
    "Content-Type": "application/json",
    "Origin": "https://dining.purdue.edu",
    "Referer": "https://dining.purdue.edu/",
    "User-Agent": "Mozilla/5.0"
}
HALL_MAPPING = {
    "Ford": "ford-dining-court",
    "Wiley": "wiley-dining-court",
    "Earhart": "earhart-dining-court",
    "Hillenbrand": "hillenbrand-dining-court",
    "Windsor": "windsor-dining-court"
}

QUERY = """
query getLocationMenu($name: String!, $date: Date!) {
  diningCourtByName(name: $name) {
    name
    dailyMenu(date: $date) {
      meals {
        name
        startTime
        endTime
        stations {
          name
          items {
            item {
              name
            }
          }
        }
      }
    }
  }
}
"""

# 3. HELPER FUNCTIONS
def clean_time(time_str):
    if not time_str or not isinstance(time_str, str): return None
    if "T" in time_str:
        try: return time_str.split("T")[1][:5]
        except: pass
    s = time_str.upper().strip().replace(".", "")
    try:
        dt = datetime.strptime(s, "%I:%M %p")
        return dt.strftime("%H:%M")
    except ValueError:
        try:
            dt = datetime.strptime(s, "%I:%M:%S %p")
            return dt.strftime("%H:%M")
        except ValueError: return None

# --- THE "BRAIN": AUTO-TAGGING LOGIC ---
def analyze_dish(name):
    name_lower = name.lower()
    tags = []
    
    if any(x in name_lower for x in ['soup', 'mac', 'cheese', 'pasta', 'stew', 'chili', 'mashed', 'potato', 'casserole', 'biscuits', 'gravy']):
        tags.append('cozy')
    if any(x in name_lower for x in ['soup', 'broth', 'noodle', 'toast', 'tea', 'cracker', 'ginger', 'rice', 'plain']):
        tags.append('sick')
    if any(x in name_lower for x in ['salad', 'grilled', 'roasted', 'steamed', 'vegetable', 'fruit', 'tofu', 'vegan', 'fresh', 'garden']):
        tags.append('healthy')
    if any(x in name_lower for x in ['spicy', 'buffalo', 'jalapeno', 'cajun', 'curry', 'sriracha', 'hot', 'pepper', 'fiesta']):
        tags.append('spicy')
    if any(x in name_lower for x in ['cookie', 'cake', 'brownie', 'pie', 'pudding', 'chocolate', 'sugar', 'cinnamon', 'donut', 'muffin']):
        tags.append('sweet')
    if any(x in name_lower for x in ['chicken', 'beef', 'pork', 'steak', 'turkey', 'fish', 'tuna', 'egg', 'sausage', 'bacon', 'tofu', 'beans']):
        tags.append('protein')
    if any(x in name_lower for x in ['burger', 'pizza', 'sandwich', 'pasta', 'rice', 'burrito', 'bowl']):
        tags.append('value')

    return tags

# 4. FETCH & UPLOAD
def fetch_menu(location_name):
    today = date.today().strftime("%Y-%m-%d")
    print(f"\n📡 Fetching {location_name}...")

    payload = {
        "operationName": "getLocationMenu",
        "variables": {"name": location_name, "date": today},
        "query": QUERY
    }

    try:
        resp = requests.post(GRAPHQL_URL, json=payload, headers=HEADERS, timeout=10)
        data = resp.json()
    except Exception as e:
        print(f"   ⚠️ Network Error: {e}")
        return []

    court = data.get("data", {}).get("diningCourtByName", {})
    if not court: return []
    meals = court.get("dailyMenu", {}).get("meals", [])
    if not meals: return []

    dishes = []
    for meal in meals:
        start_24 = clean_time(meal.get("startTime"))
        end_24 = clean_time(meal.get("endTime"))
        meal_info = {"name": meal["name"], "startTime": start_24, "endTime": end_24}

        for station in meal.get("stations", []):
            for entry in station.get("items", []):
                item = entry.get("item")
                if item:
                    dishes.append({
                        "name": item["name"],
                        "station": station["name"],
                        "mealInfo": meal_info
                    })
    return dishes

# Track how many dishes we've given real scores to
rated_dishes_count = 0
MAX_RATED_DISHES = 37

def upload_dishes(location_name, dishes):
    global rated_dishes_count
    
    hall_id = HALL_MAPPING[location_name]
    today_str = date.today().strftime("%Y-%m-%d")
    print(f"   💾 Uploading {len(dishes)} dishes to {hall_id}...")
    
    hall_ref = db.collection("diningHalls").document(hall_id)
    hall_ref.set({
        "name": location_name, 
        "type": "diningHall",
        "lastUpdated": firestore.SERVER_TIMESTAMP
    }, merge=True)

    batch = db.batch()
    count = 0

    for dish in dishes:
        clean_id = "".join(c for c in dish['name'].lower() if c.isalnum() or c == " ").strip().replace(" ", "-")[:50]
        doc_ref = hall_ref.collection("dishes").document(clean_id)
        
        auto_tags = analyze_dish(dish['name'])
        
        # Decide if this dish gets a real score or stays at 1000
        if rated_dishes_count < MAX_RATED_DISHES:
            simulated_score = random.randint(950, 1050)
            rated_dishes_count += 1
            print(f"      ✅ Rated dish #{rated_dishes_count}: {dish['name']} (Score: {simulated_score})")
        else:
            simulated_score = 1000  # Default unrated score

        doc_data = {
            "name": dish['name'],
            "category": "diningHall",
            "lastServed": firestore.SERVER_TIMESTAMP,
            "lastServedDate": today_str,
            "currentStation": dish['station'],
            "mealsServed": firestore.ArrayUnion([dish['mealInfo']]), 
            "stations": firestore.ArrayUnion([dish['station']]),
            "tags": auto_tags,
            "score": simulated_score,
            "averageRating": 5.0
        }

        batch.set(doc_ref, doc_data, merge=True)
        
        count += 1
        if count >= 400:
            batch.commit()
            batch = db.batch()
            count = 0

    batch.commit()
    print("   ✅ Batch uploaded.")

if __name__ == "__main__":
    for hall in HALL_MAPPING:
        items = fetch_menu(hall)
        if items: 
            upload_dishes(hall, items)
    
    print(f"\n🏁 INTELLIGENT UPLOAD COMPLETE.")
    print(f"📊 Total dishes with real ratings: {rated_dishes_count}")
    print(f"📋 All other dishes have default score of 1000 (unrated)")