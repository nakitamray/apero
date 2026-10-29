"""Pull Purdue dining court menus into Firestore.

    python py/purdue_menus.py              # today
    python py/purdue_menus.py --days 3     # today + the 3 days before
    python py/purdue_menus.py --dry-run    # just print, don't touch the database
"""

import argparse
import time
from datetime import date, datetime, timedelta

import requests

from common import connect, dish_id, tags_for

GRAPHQL_URL = "https://api.hfs.purdue.edu/menus/v3/GraphQL"
HEADERS = {
    "Content-Type": "application/json",
    "Origin": "https://dining.purdue.edu",
    "Referer": "https://dining.purdue.edu/",
    "User-Agent": "Mozilla/5.0",
}

# Purdue's name for the court -> place id in data/campuses.js
COURTS = {
    "Earhart": ("purdue-earhart", "Earhart Dining Court"),
    "Ford": ("purdue-ford", "Ford Dining Court"),
    "Hillenbrand": ("purdue-hillenbrand", "Hillenbrand Dining Court"),
    "Wiley": ("purdue-wiley", "Wiley Dining Court"),
    "Windsor": ("purdue-windsor", "Windsor Dining Court"),
}

QUERY = """
query getLocationMenu($name: String!, $date: Date!) {
  diningCourtByName(name: $name) {
    dailyMenu(date: $date) {
      meals {
        name
        startTime
        endTime
        stations { name items { item { name } } }
      }
    }
  }
}
"""


def to_24h(value):
    if not value:
        return None
    if "T" in value:
        return value.split("T")[1][:5]
    for fmt in ("%I:%M %p", "%I:%M:%S %p"):
        try:
            return datetime.strptime(value.upper().replace(".", "").strip(), fmt).strftime("%H:%M")
        except ValueError:
            pass
    return None


def fetch(court, day):
    payload = {"operationName": "getLocationMenu", "variables": {"name": court, "date": day}, "query": QUERY}
    try:
        resp = requests.post(GRAPHQL_URL, json=payload, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        menu = (resp.json().get("data") or {}).get("diningCourtByName") or {}
    except (requests.RequestException, ValueError) as e:
        print(f"  ! {court}: {e}")
        return []

    dishes = []
    for meal in (menu.get("dailyMenu") or {}).get("meals") or []:
        meal_info = {"name": meal["name"], "startTime": to_24h(meal.get("startTime")), "endTime": to_24h(meal.get("endTime"))}
        for station in meal.get("stations") or []:
            for entry in station.get("items") or []:
                if entry.get("item"):
                    dishes.append({"name": entry["item"]["name"], "station": station["name"], "meal": meal_info})
    return dishes


def upload(db, place_id, place_name, day, dishes):
    from firebase_admin import firestore

    batch, pending = db.batch(), 0
    for d in dishes:
        ref = db.collection("dishes").document(dish_id(place_id, d["name"]))
        batch.set(
            ref,
            {
                "name": d["name"],
                "campusId": "purdue",
                "placeId": place_id,
                "placeName": place_name,
                "station": d["station"],
                "tags": tags_for(d["name"]),
                "lastServedDate": day,
                "mealsServed": firestore.ArrayUnion([d["meal"]]),
            },
            merge=True,  # keeps ratings that are already on the dish
        )
        pending += 1
        if pending == 400:
            batch.commit()
            batch, pending = db.batch(), 0
            time.sleep(0.5)
    if pending:
        batch.commit()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=0, help="also load this many past days")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    db = None if args.dry_run else connect()
    # oldest first so today's station/date win
    for offset in range(args.days, -1, -1):
        day = (date.today() - timedelta(days=offset)).isoformat()
        print(f"\n{day}")
        for court, (place_id, place_name) in COURTS.items():
            dishes = fetch(court, day)
            print(f"  {court}: {len(dishes)} items")
            if args.dry_run:
                for d in dishes[:5]:
                    print(f"     {d['meal']['name']:<10} {d['station']:<20} {d['name']}")
            elif dishes:
                upload(db, place_id, place_name, day, dishes)


if __name__ == "__main__":
    main()
