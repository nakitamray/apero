# Setting up apero

Two services: **Firebase** holds accounts and data, **Vercel** hosts the website (the landing page plus the web version of the app). Without Firebase the site still works, it just runs the demo only.

## 1. Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and **Add project** (call it `apero`). Google Analytics is optional.
2. **Build → Authentication → Get started → Email/Password → Enable.**
3. **Build → Firestore Database → Create database.** Pick a location close to your users (e.g. `nam5`), start in **production mode**.
4. **Project settings (gear) → General → Your apps → Web (`</>`)**, register an app called `apero web`. Firebase shows a `firebaseConfig` block.
5. Copy `.env.example` to `.env` and paste those six values in:

   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=apero-xxxx.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=apero-xxxx
   ...
   ```

   These are fine to ship in a web app (Firebase web config isn't secret, the security rules are what protect the data), but `.env` is gitignored anyway.
6. Push the security rules and indexes from this repo:

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

### Letting Claude Code do the Firebase parts

Steps 1–5 need you in the console. For the rest (deploying rules and indexes, running the menu script), add the service account JSON from step 7 to your Claude Code cloud environment as an environment variable named `FIREBASE_SERVICE_ACCOUNT` (the whole JSON on one line), plus `EXPO_PUBLIC_FIREBASE_PROJECT_ID`. The environment's network settings also need to allow `*.googleapis.com`. Never paste the key into a chat.

## 2. Vercel

The website lives on its own `website` branch. That branch is this app plus the landing page, so when the app changes, merge it into `website` (`git checkout website && git merge summer-redesign`) and Vercel redeploys.

1. [vercel.com](https://vercel.com) → **Add New → Project → Import** `nakitamray/apero`.
2. **Settings → Git → Production Branch**: set it to `website`. Vercel reads that branch's `vercel.json` (build `npm run build:site`, output `site`).
3. **Settings → Environment Variables**: add the six `EXPO_PUBLIC_FIREBASE_*` values (Production and Preview).
4. Deploy. The site is at `apero-<something>.vercel.app`, the app itself at `/app/`, and the demo at `/app/?demo=1`.
5. Back in Firebase: **Authentication → Settings → Authorized domains → Add** your Vercel domain (and your custom domain), or logging in on the web is blocked.

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
