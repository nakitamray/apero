# apero

A food rating app for college campuses. You rate what you ate at the dining hall (or the cheap spot down the street), it slots into your own ranked list, and everyone's ratings roll up into a campus score so you know what's actually worth walking to.

I started it for Purdue and opened it up to more schools:

Purdue · UCLA · USC · UC Berkeley · Stanford · UC Irvine · UC Riverside · MIT · NYU · Carnegie Mellon · University of Washington · UIUC · Embry-Riddle (Daytona Beach)

## What it does

- **Today**: top rated dishes on your campus, what's on the menu right now, where people are eating, and the latest reviews.
- **Explore**: dining halls plus cheap eats near campus. For each spot you see how you'd get there (walk, bus/train, or car, depending on what you said you use), how long it takes, and roughly what the meal plus the trip costs. If your school's bus is free with a student ID, that counts as $0.
- **Rating**: pick a verdict (loved it / it was fine / not for me), say why, then answer a couple of "which did you like more?" questions. That places the dish in your list, like a binary search, so your scores stay consistent with each other.
- **My list**: your personal ranking, filterable by verdict.
- **Feed**: reviews from your campus. You can like and share them.
- **Me**: your stats, a breakdown of your taste, a few dishes to try next, and where you change campus or how you get around.

## Running it

```bash
npm install
cp firebaseConfig.example.js firebaseConfig.js   # then paste in your Firebase web config
npx expo start
```

Firestore needs the rules and indexes in this repo:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## Data

Campuses and places live in `data/campuses.js`. Adding a school means adding an entry there: its dining halls, a handful of student-budget spots with a rough distance from campus, and its transit system.

Firestore collections:

| collection | what's in it |
| --- | --- |
| `users/{uid}` | name, campus, how you get around |
| `users/{uid}/rankings/{dishId}` | your verdict + ranking for each dish |
| `dishes/{dishId}` | name, place, tags, and the running average of everyone's scores |
| `reviews/{id}` | each review (verdict, reasons, note, likes) |

Dishes get in two ways: people add them from the app, and for Purdue the dining court menus are pulled in every day by a script.

## Scripts (`py/`)

```bash
pip install -r py/requirements.txt
python py/purdue_menus.py            # today's Purdue menus
python py/purdue_menus.py --days 3   # backfill a few days
python py/purdue_menus.py --dry-run  # print without writing
python py/reset_database.py          # wipe dishes/reviews/users (asks first)
```

They need a `py/serviceAccountKey.json` from the Firebase console (it's gitignored).

## Notes

- Distances, trip times and costs are estimates. The goal is "is this a 5 minute walk or a bus ride", not turn-by-turn directions.
- Restaurant lists are a starting point. If a place closes or a better one opens, edit `data/campuses.js`.
