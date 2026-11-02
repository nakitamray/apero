"""Shared Firebase setup + helpers for the data scripts."""

import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
KEY_PATH = os.path.join(HERE, "serviceAccountKey.json")


def connect():
    """Service account from the FIREBASE_SERVICE_ACCOUNT env var (the whole JSON), or py/serviceAccountKey.json."""
    import firebase_admin
    from firebase_admin import credentials, firestore

    from_env = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
    if from_env:
        cred = credentials.Certificate(json.loads(from_env))
    elif os.path.exists(KEY_PATH):
        cred = credentials.Certificate(KEY_PATH)
    else:
        sys.exit("No Firebase credentials: set FIREBASE_SERVICE_ACCOUNT or add py/serviceAccountKey.json (Firebase console -> Service accounts)")
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    return firestore.client()


def slugify(text):
    text = re.sub(r"[^a-z0-9 ]", "", text.lower()).strip()
    return re.sub(r"\s+", "-", text)[:60]


def dish_id(place_id, name):
    # must match dishIdFor() in lib/api.js
    return f"{place_id}__{slugify(name)}"


# keyword -> mood tag. rough, but good enough to make the mood chips useful
TAG_WORDS = {
    "cozy": ["soup", "mac", "cheese", "pasta", "stew", "chili", "mashed", "potato", "casserole", "biscuit", "gravy"],
    "sick": ["soup", "broth", "noodle", "toast", "tea", "cracker", "ginger", "rice"],
    "healthy": ["salad", "grilled", "roasted", "steamed", "vegetable", "fruit", "tofu", "vegan", "garden"],
    "spicy": ["spicy", "buffalo", "jalapeno", "cajun", "curry", "sriracha", "hot", "chipotle"],
    "sweet": ["cookie", "cake", "brownie", "pie", "pudding", "chocolate", "cinnamon", "donut", "muffin"],
    "protein": ["chicken", "beef", "pork", "steak", "turkey", "fish", "tuna", "egg", "sausage", "bacon", "tofu", "beans"],
    "value": ["burger", "pizza", "sandwich", "burrito", "bowl", "wrap"],
}


def tags_for(name):
    lower = name.lower()
    return [tag for tag, words in TAG_WORDS.items() if any(w in lower for w in words)]
