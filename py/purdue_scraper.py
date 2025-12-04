import requests
from datetime import date

GRAPHQL_URL = "https://api.hfs.purdue.edu/menus/v3/GraphQL"

QUERY = """
query getLocationMenu($name: String!, $date: Date!) {
  diningCourtByName(name: $name) {
    name
    dailyMenu(date: $date) {
      meals {
        name
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

DINING_COURTS = ["Ford", "Wiley", "Earhart", "Hillenbrand", "Windsor"]

def fetch_menu(location: str, day=None):
    """Fetch menu grouped by Meal → Station → Items."""
    if day is None:
        day = date.today().strftime("%Y-%m-%d")

    payload = {
        "operationName": "getLocationMenu",
        "variables": {"name": location, "date": day},
        "query": QUERY
    }

    headers = {
        "Content-Type": "application/json",
        "Origin": "https://dining.purdue.edu",
        "Referer": "https://dining.purdue.edu/",
        "User-Agent": "Mozilla/5.0"
    }

    try:
        resp = requests.post(GRAPHQL_URL, json=payload, headers=headers, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"[!] Error fetching {location}: {e}")
        return {}

    court_data = data.get("data", {}).get("diningCourtByName", {})
    meals = court_data.get("dailyMenu", {}).get("meals", [])

    structured = {}
    for meal in meals:
        meal_name = meal.get("name")
        structured[meal_name] = {}
        for station in meal.get("stations", []):
            station_name = station.get("name")
            items = [it["item"]["name"] for it in station.get("items", []) if it.get("item")]
            if items:
                structured[meal_name][station_name] = items
    return structured


def main():
    today = date.today().strftime("%Y-%m-%d")
    print(f"\n🍽 Purdue Dining Menus for {today}\n")

    for court in DINING_COURTS:
        menu = fetch_menu(court, today)
        if not menu:
            print(f"== {court} Dining Court ==\n  [No data found]\n")
            continue

        print(f"== {court} Dining Court ==")
        for meal, stations in menu.items():
            print(f"  • {meal}:")
            for station, items in stations.items():
                print(f"      ▸ {station}")
                for item in items:
                    print(f"          - {item}")
        print()


if __name__ == "__main__":
    main()
