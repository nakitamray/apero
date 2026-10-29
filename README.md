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
- **Places**: every dining hall and spot has one score from everyone who's rated anything there (and how the loved it / fine / not for me votes split), a map, directions that match how you get around, and the latest reviews.
- **Worldwide**: the best rated places on every campus.
- **Me**: your stats, a breakdown of your taste, a few dishes to try next, and where you change campus or how you get around.
- **Demo**: "Try the demo" on the login screen (or `?demo=1` on the web build) runs the whole app on sample data, no account needed.

## Look

Euro summer collage: painted sardines, lemons, blood oranges and majolica plates cut out like stickers (`assets/art`), turquoise and orange lino-wave headers, paper scraps on pinstripe linen. Headlines are set in Grand Paradiso, body text in Jost, little notes in Cormorant Garamond italic.

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

## Website

`website/` is a landing page that shows the real app running inside a phone, in demo mode, with buttons to log in or try it.

```bash
npm run build:site
```

That builds the app for the web into `site/app/` and copies the landing page next to it. Upload the whole `site/` folder anywhere (paths are relative, so a sub-folder of your own site works too). Without a `firebaseConfig.js` the build is demo-only and logging in is turned off.

## Data

Campuses and places live in `data/campuses.js`. Adding a school means adding an entry there: its dining halls, a handful of student-budget spots with a rough distance from campus, and its transit system.

Firestore collections:

| collection | what's in it |
| --- | --- |
| `users/{uid}` | name, campus, how you get around |
| `users/{uid}/rankings/{dishId}` | your verdict + ranking for each dish |
| `dishes/{dishId}` | name, place, tags, and the running average of everyone's scores |
| `places/{placeId}` | everyone's score for a dining hall or spot, plus the verdict split |
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

## Art

The painted stickers, plates and wave bands in `assets/art` come from `tools/art/assets.py`, a small watercolor painter (numpy + scipy + Pillow). `python tools/art/assets.py vase` repaints one piece; with no arguments it repaints everything.

## Notes

- Distances, trip times and costs are estimates. The goal is "is this a 5 minute walk or a bus ride", not turn-by-turn directions.
- Restaurant lists are a starting point. If a place closes or a better one opens, edit `data/campuses.js`.
