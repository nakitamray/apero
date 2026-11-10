# Setting up apero

Two services: **Firebase** holds accounts and data, **Vercel** hosts the website (the landing page plus the web version of the app). Without Firebase the site still works, it just runs the demo only.

## 1. Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and **Add project** (call it `apero`). Google Analytics is optional.
2. **Build → Authentication → Get started → Email/Password → Enable.**
3. **Build → Firestore Database → Create database.** Pick a location close to your users (e.g. `nam5`), start in **production mode**.
   Then **Build → Storage → Get started** (same location, production mode). That's where food photos on reviews go. Storage needs the Blaze plan, but the free allowance covers a campus app easily.
4. **Project settings (gear) → General → Your apps → Web (`</>`)**, register an app called `apero web`. Firebase shows a `firebaseConfig` block.
5. Copy `.env.example` to `.env` and paste those six values in:

   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=apero-xxxx.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=apero-xxxx
   ...
   ```

   These are fine to ship in a web app (Firebase web config isn't secret, the security rules are what protect the data), but `.env` is gitignored anyway.
6. Push the security rules (Firestore and Storage) and indexes from this repo:

   ```bash
   npx firebase-tools login
   npm run deploy:firestore
   ```

   Indexes take a few minutes to build. Until they finish, some lists (feed, top dishes) show an error in the console.
7. Optional, Purdue menus: **Project settings → Service accounts → Generate new private key**, save it as `py/serviceAccountKey.json` (gitignored), then:

   ```bash
   pip install -r py/requirements.txt
   python py/purdue_menus.py --days 3
   ```

   To keep menus fresh, run that once a day (a GitHub Action or any cron works).

Start the app with `npx expo start`. Sign up, pick a campus, and you're in.

### Doing the Firebase parts from a cloud environment

Steps 1–5 need you in the console. For the rest (deploying rules and indexes, running the menu script), add the service account JSON from step 7 to your cloud dev environment as an environment variable named `FIREBASE_SERVICE_ACCOUNT` (the whole JSON on one line), plus `EXPO_PUBLIC_FIREBASE_PROJECT_ID`. The environment's network settings also need to allow `*.googleapis.com`. Never commit the key or paste it anywhere public.

## 2. Vercel

Everything lives on `main`: the app, the landing page (`website/`) and the review lookup (`api/`). Every push to `main` redeploys the site.

1. Sign in at [vercel.com](https://vercel.com) with GitHub → **Add New → Project** → **Import** `nakitamray/apero`.
2. On the import screen leave **Framework Preset** on **Other** and the root directory as is. The build settings come from `vercel.json` (build `npm run build:site`, output `site`).
3. Open **Environment Variables** on the same screen and add the six `EXPO_PUBLIC_FIREBASE_*` values from Firebase (step 1.5). Skip this to launch demo-only.
4. **Deploy.** The site is at `apero-<something>.vercel.app`, the app itself at `/app/`, and the demo at `/app/?demo=1`.
5. Back in Firebase: **Authentication → Settings → Authorized domains → Add** your Vercel domain (and your custom domain), or logging in on the web is blocked.

Changing an environment variable later only takes effect after a redeploy: **Deployments → ⋯ → Redeploy**.

### Google Maps (recommended) and Yelp

With Google keys set, the Explore map is a Google map, every restaurant is placed by Google Maps, and restaurant pages show Google and Yelp ratings and reviews. Without them the app still works: the map falls back to a free OpenStreetMap one and the ratings section just doesn't appear.

All of these go in **Vercel → Settings → Environment Variables**; redeploy after adding them.

1. [console.cloud.google.com](https://console.cloud.google.com), pick your Firebase project at the top. Google needs a billing account on the project (the same Blaze upgrade as photos); each API has a monthly free allowance that a campus app stays inside, but set a budget alert under **Billing → Budgets & alerts** anyway.
2. **APIs & Services → Library**, enable **Maps JavaScript API** and **Places API (New)**.
3. **APIs & Services → Credentials → Create credentials → API key**, twice:
   - **`EXPO_PUBLIC_GOOGLE_MAPS_KEY`** (draws the Google map on the website, so it's visible in the browser, which is normal for map keys). Edit it: **Application restrictions → Websites**, add `https://YOUR-SITE.vercel.app/*` and your own domain; **API restrictions → Maps JavaScript API** only.
   - Optional, **`EXPO_PUBLIC_GOOGLE_MAP_ID`**: **Google Maps Platform → Map management → Create map ID** (JavaScript, Vector). The site works with Google's demo map ID until you add your own.
   - **`GOOGLE_PLACES_API_KEY`** (finds places and reviews on the server, never shown to anyone). **API restrictions → Places API (New)** only.
4. **`YELP_API_KEY`** (optional): [yelp.com/developers](https://www.yelp.com/developers) → **Create app**, copy the **API Key**. Yelp's API has a free trial, then a paid plan. Review excerpts come with some plans only; without them the Yelp rating still shows.

Lookups are cached by Vercel (place locations for a week, ratings for a day), so Google sees roughly one request per restaurant per week, not one per visitor.

### Putting it on your own website

- **Easiest: a subdomain.** In Vercel, **Settings → Domains → Add** `apero.yourdomain.com`, then add the CNAME record it shows at your domain registrar.
- **Under a path** (`yourdomain.com/apero`): if your main site is also on Vercel, add a rewrite in that site's `vercel.json`:

  ```json
  { "rewrites": [{ "source": "/apero/:path*", "destination": "https://apero-<something>.vercel.app/:path*" }] }
  ```

  All of apero's paths are relative, so it works under any folder.
- **Embedded in a page**: drop the phone demo into any page with
  `<iframe src="https://apero.yourdomain.com/app/?demo=1" width="390" height="844" style="border:0;border-radius:40px"></iframe>`.

## 3. On your phone (Android or iPhone)

**Try it now, free:** install **Expo Go** from the Play Store (Android) or App Store (iPhone). On your computer, in the project folder, run `npm install` once, then `npx expo start`. Scan the QR code it prints: on Android with the Expo Go app, on iPhone with the Camera app. The app opens on your phone and reloads when the code changes. Phone and computer need to be on the same Wi-Fi (or run `npx expo start --tunnel`).

In Expo Go the map is Google Maps on Android and Apple Maps on iPhone, no key needed. For the ratings and Google's place locations to work on a phone, add your site's address to `.env`: `EXPO_PUBLIC_SITE_URL=https://YOUR-SITE.vercel.app`.

For real builds (below), Google Maps on Android needs a **Maps SDK for Android** key saved as the EAS secret `GOOGLE_MAPS_ANDROID_KEY`; for Google Maps instead of Apple Maps on iPhone, add a **Maps SDK for iOS** key as `EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY` (`app.config.js` picks both up).

**A real app you can install:**

- **Android:** `npx eas-cli build -p android --profile preview` builds an `.apk` you can install directly (sign in with a free Expo account when it asks). Publishing on Google Play costs $25 once.
- **iPhone:** `npx eas-cli build -p ios` needs an Apple Developer account ($99/year), which is also what puts it on the App Store or TestFlight.
