// Prepares www/ for packaging: bundles the Capacitor runtime and stamps the version.
// Fonts and pdf.js are already inside www/, so the app works fully offline.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const www = join(root, 'www');

await build({
  entryPoints: [join(root, 'scripts', 'cap-entry.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  target: ['chrome89'],
  outfile: join(www, 'cap-runtime.js')
});
console.log('cap-runtime.js built');

const version = process.env.APP_VERSION || '1.0.0';
const appPath = join(www, 'app.js');
const app = readFileSync(appPath, 'utf8');
const stamped = app.replace(/const APP_VERSION = '[^']*';/, `const APP_VERSION = '${version}';`);
if (stamped === app && !app.includes(`'${version}'`)) throw new Error('version stamp not found in app.js');
writeFileSync(appPath, stamped);
console.log('version', version);
