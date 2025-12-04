print("--- CORRECTED RETAIL SCRAPER STARTED ---")

import os
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import requests
from bs4 import BeautifulSoup
import time
from urllib.parse import urljoin

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
BASE_URL = "https://purdue.campusdish.com"
LOCATIONS_URL = "https://purdue.campusdish.com/LocationsAndMenus"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

# 3. CRAWLER: FIND ALL LOCATION URLS
def get_all_location_urls():
    print(f"📡 Crawling {LOCATIONS_URL} to find locations...")
    
    try:
        response = requests.get(LOCATIONS_URL, headers=HEADERS, timeout=15)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        discovered = []
        seen_ids = set()
        
        # Find all location links
        links = soup.find_all('a', href=True)
        
        for link in links:
            href = link['href']
            full_url = urljoin(BASE_URL, href)
            
            # Filter for valid location pages
            if "/LocationsAndMenus/" in full_url and full_url != LOCATIONS_URL:
                
                # Get Name
                name = link.get_text(strip=True)
                if not name:
                    name_div = link.find(class_="location-name")
                    if name_div: name = name_div.get_text(strip=True)

                # Skip navigation links
                if not name or name.lower() in ["map", "menus", "locations", "home", "catering", "contact us"]:
                    continue

                clean_id = "".join(c for c in name.lower() if c.isalnum()).strip()
                
                if clean_id and clean_id not in seen_ids:
                    seen_ids.add(clean_id)
                    discovered.append({
                        "id": clean_id,
                        "name": name,
                        "url": full_url
                    })
                    
        print(f"   ✅ Found {len(discovered)} locations.")
        return discovered

    except Exception as e:
        print(f"   ❌ Crawler Error: {e}")
        return []

# 4. METADATA SCRAPER: ADDRESS & HOURS
def scrape_metadata(location_name, url):
    print(f"   🔎 Scanning: {location_name}...")
    data = {"address": None, "hours": None}
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        if response.status_code != 200: return data
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # --- FIX: SCRAPE ADDRESS CORRECTLY ---
        # We look for the address block
        addr_container = soup.select_one('.address') or soup.select_one('.location-address') or soup.select_one('.contact-address')
        
        if addr_container:
            # CRITICAL FIX: Remove "Map" links inside the address container
            for a in addr_container.find_all('a'):
                a.decompose() # Deletes the link tag from the HTML tree
            
            # Now get the text that remains (should be just the address)
            clean_address = addr_container.get_text(" ", strip=True)
            
            # Extra cleanup just in case
            clean_address = clean_address.replace("Map & Directions", "").replace("View Map", "").strip()
            
            if len(clean_address) > 5: # Ensure it's not empty
                data["address"] = clean_address
                print(f"      📍 Address: {clean_address}")

        # --- SCRAPE HOURS ---
        hours_div = soup.select_one('.hours-container') or soup.select_one('.location-hours')
        if hours_div:
             # Remove "Today's Hours" label
            text = hours_div.get_text(" ", strip=True).replace("Today's Hours", "").strip()
            # Just take the first chunk if it's long
            data["hours"] = text.split("Standard")[0].strip()[:50]

        return data

    except Exception as e:
        print(f"      Warning: {e}")
        return data

# 5. UPLOAD PROCESS
def run_scraper():
    locations = get_all_location_urls()
    
    if not locations:
        print("⚠️ No locations found.")
        return

    batch = db.batch()
    op_count = 0
    
    for loc in locations:
        meta = scrape_metadata(loc["name"], loc["url"])
        
        doc_ref = db.collection("diningPoints").document(loc["id"])
        
        # We store the URL so the app can open it
        update_data = {
            "name": loc["name"],
            "type": "diningPoints",
            "menuUrl": loc["url"],
            "lastUpdated": firestore.SERVER_TIMESTAMP
        }
        
        if meta["address"]:
            update_data["address"] = meta["address"]
            update_data["location"] = meta["address"] # For display compatibility
            
        if meta["hours"]:
            update_data["hours"] = meta["hours"]

        batch.set(doc_ref, update_data, merge=True)
        op_count += 1
        
        if op_count >= 400:
            batch.commit()
            batch = db.batch()
            op_count = 0
            
        time.sleep(0.1) 

    batch.commit()
    print("\n✨ DATABASE UPDATED.")

if __name__ == "__main__":
    run_scraper()