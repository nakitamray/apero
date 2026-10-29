// Builds the website: landing page + the app's web build in site/app/.
//   npm run build:site   ->   upload the site/ folder anywhere (it works from any sub-path)
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const out = join(root, 'site');
const app = join(out, 'app');

if (!existsSync(join(root, 'firebaseConfig.js'))) {
  console.log('no firebaseConfig.js, building with the blank example (demo only, log in turned off)');
  cpSync(join(root, 'firebaseConfig.example.js'), join(root, 'firebaseConfig.js'));
}

rmSync(out, { recursive: true, force: true });
execSync(`npx expo export --platform web --output-dir ${app}`, { cwd: root, stdio: 'inherit' });

// expo writes absolute paths (/_expo, /assets). make them relative so app/ can live under any path
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

// landing page + the art it borrows from the app
cpSync(join(root, 'website'), out, { recursive: true });
mkdirSync(join(out, 'img'), { recursive: true });
mkdirSync(join(out, 'fonts'), { recursive: true });
['sardine', 'lemon', 'spritz', 'vase', 'blood_orange', 'tile', 'orange_slice', 'plate', 'tin', 'waves_aqua', 'platter_blue', 'platter_orange', 'platter_lemon'].forEach(
  (name) => cpSync(join(root, 'assets', 'art', `${name}.png`), join(out, 'img', `${name}.png`)),
);
cpSync(join(root, 'assets', 'fonts', 'GrandParadiso-Regular.ttf'), join(out, 'fonts', 'GrandParadiso-Regular.ttf'));

console.log(`\nsite ready in ${out}`);
