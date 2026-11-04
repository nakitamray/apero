# apero

A food rating app for college campuses. You rate what you ate at the dining hall (or the cheap spot down the street), it slots into your own ranked list, and everyone's ratings roll up into a campus score so you know what's actually worth walking to.

I started it for Purdue and opened it up to more schools:

Purdue · UCLA · USC · UC Berkeley · Stanford · UC Irvine · UC Riverside · MIT · NYU · Carnegie Mellon · University of Washington · UIUC · Embry-Riddle (Daytona Beach)

## What it does

- **Today**: top rated dishes on your campus, what's on the menu right now, where people are eating, and the latest reviews.
- **Explore**: dining halls, cheap eats and date night spots near campus (anything within a 25 minute walk or a 20 minute drive). For each spot you see how you'd get there (walk, bus/train, or car, depending on what you said you use), how long it takes, and roughly what the meal plus the trip costs. If your school's bus is free with a student ID, that counts as $0.
- **Rating**: pick a verdict (loved it / it was fine / not for me), say why, then answer a couple of "which did you like more?" questions. That places the dish in your list, like a binary search, so your scores stay consistent with each other.
- **My list**: your personal ranking, filterable by verdict.
- **Reviews**: add up to 4 photos of your food and tag who you ate with. Tagged friends see it on their feed too.
- **Feed**: reviews from your campus or just your friends, as posts or as a photo grid. You can like and share them.
- **Places**: every dining hall and spot has one score from everyone who's rated anything there (and how the loved it / fine / not for me votes split), a map, directions that match how you get around, and the latest reviews.
- **Worldwide**: the best rated places on every campus.
- **Friends**: add people by handle or find classmates. Every friend shows a taste match % from the dishes you've both ranked, what you both loved, and what they loved that you haven't tried.
- **Group decider**: pick who's coming and a budget, get a shortlist ranked for the whole group ("Maya loved the tacos here", "deal today"), then spin the orange.
- **Deals**: student discounts and specials posted by students, with a "still good" vote. They show up on Today and on each place.
- **Campus Wrapped**: your semester in food as story cards: dishes rated, your number one, your spot, your eater type, your taste twin.
- **Me**: your stats, your photo grid, a breakdown of your taste, a few dishes to try next, and where you change campus or how you get around.
- **Demo**: "Try the demo" on the login screen (or `?demo=1` on the web build) runs the whole app on sample data, no account needed.

## Look

Euro summer menu card: white ticking with turquoise, orange and lemon pinstripes, every screen headed like a printed menu (double rules, a big title, one painted cut-out that drifts as you scroll), dish lists set as menu lines, and painted sardines, lemons, blood oranges, stamps and majolica plates cut out like stickers (`assets/art`). Titles and dish names are Medan, scores on the plates are Gresida, everything else is Doblegh.

## Running it

```bash
npm install
cp .env.example .env   # paste in your Firebase web config
npx expo start
```

Then push the Firestore rules and indexes with `npm run deploy:firestore`. The full walkthrough (Firebase project, Vercel, custom domain) is in [docs/setup.md](docs/setup.md).

## Website

This branch (`website`) is the app plus the public page in `website/`: one color, a phone, and the real app running inside it in demo mode. Visitors pick a school and use it like a student; members log in at `/app/`.

```bash
npm run build:site
```

builds the app for the web into `site/app/` and puts the page next to it. Vercel runs that on every push to this branch (`vercel.json`). To pick up app changes, merge the app branch in: `git merge summer-redesign`.

## Data

Campuses and places live in `data/campuses.js`. Adding a school means adding an entry there: its dining halls, a handful of student-budget spots with a rough distance from campus, and its transit system.

Firestore collections:

| collection | what's in it |
| --- | --- |
| `users/{uid}` | name, handle, campus, how you get around, who you follow |
| `users/{uid}/rankings/{dishId}` | your verdict + ranking for each dish |
| `dishes/{dishId}` | name, place, tags, and the running average of everyone's scores |
| `places/{placeId}` | everyone's score for a dining hall or spot, plus the verdict split |
| `reviews/{id}` | each review (verdict, reasons, note, likes) |
| `deals/{id}` | a student-posted deal: place, days, end date, "still good" votes |

Dishes get in two ways: people add them from the app, and for Purdue the dining court menus are pulled in every day by a script.

## Scripts (`py/`)

```bash
pip install -r py/requirements.txt
python py/purdue_menus.py            # today's Purdue menus
python py/purdue_menus.py --days 3   # backfill a few days
python py/purdue_menus.py --dry-run  # print without writing
python py/reset_database.py          # wipe dishes/reviews/users (asks first)
```

They need a service account: `py/serviceAccountKey.json` from the Firebase console (gitignored), or the same JSON in a `FIREBASE_SERVICE_ACCOUNT` environment variable.

## Art

The painted stickers, plates and wave bands in `assets/art` come from `tools/art/assets.py`, a small watercolor painter (numpy + scipy + Pillow). `python tools/art/assets.py vase` repaints one piece; with no arguments it repaints everything.

## Notes

- Distances, trip times and costs are estimates. The goal is "is this a 5 minute walk or a bus ride", not turn-by-turn directions.
- Restaurant lists are a starting point. If a place closes or a better one opens, edit `data/campuses.js`.
