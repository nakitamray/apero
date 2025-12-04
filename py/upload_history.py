print("--- LITE HISTORY UPLOADER (PAST 3 DAYS) ---")

import os
import requests
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from datetime import date, datetime, timedelta
import time

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

def analyze_dish(name):
    name_lower = name.lower()
    tags = []
    if any(x in name_lower for x in ['soup', 'mac', 'pasta', 'stew', 'chili', 'mashed']): tags.append('cozy')
    if any(x in name_lower for x in ['soup', 'broth', 'toast', 'tea', 'cracker']): tags.append('sick')
    if any(x in name_lower for x in ['salad', 'grilled', 'vegetable', 'fruit', 'tofu', 'vegan']): tags.append('healthy')
    if any(x in name_lower for x in ['spicy', 'buffalo', 'jalapeno', 'cajun', 'curry']): tags.append('spicy')
    if any(x in name_lower for x in ['cookie', 'cake', 'brownie', 'pie', 'chocolate']): tags.append('sweet')
    if any(x in name_lower for x in ['chicken', 'beef', 'steak', 'turkey', 'fish', 'egg']): tags.append('protein')
    return tags

def commit_batch_safely(batch):
    try:
        batch.commit()
        print("      💾 Batch committed.")
        # Minimal sleep to avoid rate limits, but fast enough for small history
        time.sleep(0.5) 
    except Exception as e:
        print(f"      ⚠️ Upload Error: {e}")
        # If quota exceeded, we stop to prevent hanging forever
        if "Quota" in str(e) or "429" in str(e):
            print("      🚨 DAILY QUOTA EXCEEDED. STOPPING SCRIPT.")
            exit()

def process_date(target_date):
    date_str = target_date.strftime("%Y-%m-%d")
    print(f"\n📅 Processing {date_str}...")
    
    batch = db.batch()
    op_count = 0

    for hall_name, hall_id in HALL_MAPPING.items():
        payload = {
            "operationName": "getLocationMenu",
            "variables": {"name": hall_name, "date": date_str},
            "query": QUERY
        }

        try:
            resp = requests.post(GRAPHQL_URL, json=payload, headers=HEADERS, timeout=5)
            data = resp.json()
        except:
            print(f"   ⚠️ Error fetching {hall_name}")
            continue

        court = data.get("data", {}).get("diningCourtByName", {})
        if not court: continue
        meals = court.get("dailyMenu", {}).get("meals", [])
        if not meals: continue

        hall_ref = db.collection("diningHalls").document(hall_id)
        
        for meal in meals:
            start_24 = clean_time(meal.get("startTime"))
            end_24 = clean_time(meal.get("endTime"))
            meal_info = {"name": meal["name"], "startTime": start_24, "endTime": end_24}

            for station in meal.get("stations", []):
                for entry in station.get("items", []):
                    item = entry.get("item")
                    if item:
                        dish_name = item["name"]
                        clean_id = "".join(c for c in dish_name.lower() if c.isalnum() or c == " ").strip().replace(" ", "-")[:60]
                        
                        auto_tags = analyze_dish(dish_name)

                        # A. Update Local
                        local_dish_ref = hall_ref.collection("dishes").document(clean_id)
                        local_data = {
                            "name": dish_name,
                            "category": "diningHall",
                            "currentStation": station["name"], 
                            "lastServedDate": date_str,
                            "mealsServed": firestore.ArrayUnion([meal_info]),
                            "tags": auto_tags,
                        }
                        batch.set(local_dish_ref, local_data, merge=True)

                        # B. Update Global
                        global_dish_ref = db.collection("globalDishes").document(clean_id)
                        global_data = {
                            "name": dish_name,
                            "lastServedDate": date_str,
                            "tags": auto_tags,
                            "locations": firestore.ArrayUnion([hall_name]), 
                            "category": "diningHall"
                        }
                        batch.set(global_dish_ref, global_data, merge=True)

                        op_count += 2
                        
                        # Commit every 100 operations to be safe and steady
                        if op_count >= 100:
                            commit_batch_safely(batch)
                            batch = db.batch()
                            op_count = 0
                            
    if op_count > 0:
        commit_batch_safely(batch)
    print("   ✅ Date finished.")

def run_history_load():
    # JUST LAST 3 DAYS
    start_date = date.today() - timedelta(days=3)
    end_date = date.today() 
    
    delta = end_date - start_date
    
    for i in range(delta.days + 1):
        process_date(start_date + timedelta(days=i))

if __name__ == "__main__":
    run_history_load()