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

### Google Maps and Yelp ratings (optional)

Restaurant pages show their Google Maps and Yelp rating plus a few reviews once these keys are set in **Vercel → Settings → Environment Variables** (then redeploy). Without them the section just doesn't appear.

- **`GOOGLE_PLACES_API_KEY`**: [console.cloud.google.com](https://console.cloud.google.com), pick your Firebase project at the top → **APIs & Services → Library** → enable **Places API (New)** → **Credentials → Create credentials → API key**. Edit the key and under **API restrictions** allow only Places API (New). Google bills per lookup after a monthly free allowance; Vercel caches each place for a day to keep that low. Set a budget alert under **Billing**.
- **`YELP_API_KEY`**: [yelp.com/developers](https://www.yelp.com/developers) → **Create app**, copy the **API Key**. Yelp's API has a free trial, then a paid plan. Review excerpts come with some plans only; without them the Yelp rating still shows.

Both keys stay on Vercel's server (`api/outside-reviews.js`); they are never in the app or the repo. If you later ship the phone app, set `EXPO_PUBLIC_SITE_URL` to your site's address so it can use the same lookup.

### Putting it on your own website

- **Easiest: a subdomain.** In Vercel, **Settings → Domains → Add** `apero.yourdomain.com`, then add the CNAME record it shows at your domain registrar.
- **Under a path** (`yourdomain.com/apero`): if your main site is also on Vercel, add a rewrite in that site's `vercel.json`:

  ```json
  { "rewrites": [{ "source": "/apero/:path*", "destination": "https://apero-<something>.vercel.app/:path*" }] }
  ```

  All of apero's paths are relative, so it works under any folder.
- **Embedded in a page**: drop the phone demo into any page with
  `<iframe src="https://apero.yourdomain.com/app/?demo=1" width="390" height="844" style="border:0;border-radius:40px"></iframe>`.

## 3. Phones (later)

The same code builds the iOS and Android apps with Expo's EAS: `npx eas build`. That needs an Apple developer account ($99/year) for the App Store, and a Google Play account ($25 once).
