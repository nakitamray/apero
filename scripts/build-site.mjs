// Builds the website: the landing page with the app's web build in site/app/.
//   npm run build:site   ->   site/ is ready to upload (Vercel does this on its own)
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const out = join(root, 'site');
const app = join(out, 'app');

if (!process.env.EXPO_PUBLIC_FIREBASE_API_KEY && !existsSync(join(root, '.env'))) {
  console.log('no Firebase settings found, building demo-only (log in turned off)');
}

rmSync(out, { recursive: true, force: true });
execSync(`npx expo export --platform web --output-dir ${app}`, { cwd: root, stdio: 'inherit' });

// expo writes absolute paths (/_expo, /assets). make them relative so the site works from any folder
const relative = (file) => {
  const text = readFileSync(file, 'utf8')
    .replaceAll('"/_expo/', '"./_expo/')
    .replaceAll('"/assets/', '"./assets/')
    .replaceAll('"/favicon.ico"', '"./favicon.ico"');
  writeFileSync(file, text);
};
relative(join(app, 'index.html'));
const js = join(app, '_expo', 'static', 'js', 'web');
readdirSync(js).forEach((f) => f.endsWith('.js') && relative(join(js, f)));

cpSync(join(root, 'website'), out, { recursive: true });
mkdirSync(join(out, 'img'), { recursive: true });
mkdirSync(join(out, 'fonts'), { recursive: true });
cpSync(join(root, 'assets', 'art', 'orange_slice.png'), join(out, 'img', 'orange_slice.png'));
['Medan.otf', 'Doblegh-Regular.ttf', 'Doblegh-SemiBold.ttf'].forEach((f) =>
  cpSync(join(root, 'assets', 'fonts', f), join(out, 'fonts', f)),
);

console.log(`\nsite ready in ${out}`);
