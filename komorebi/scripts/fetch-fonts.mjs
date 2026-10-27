/** Fetch only Vietnamese/Latin WOFF2 from Google Fonts, retaining licence files. */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const folder = path.join(root, 'public', 'fonts');
await mkdir(folder, { recursive: true });
const endpoint = 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Literata:wght@500;600;700&display=swap';
const response = await fetch(endpoint, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' },
  signal: AbortSignal.timeout(20000),
});
if (!response.ok) throw new Error('Google Fonts CSS HTTP ' + response.status);
const source = await response.text();
const selected = [...source.matchAll(/\/\*\s*([^*]+?)\s*\*\/\s*(@font-face\s*\{[\s\S]*?\})/g)]
  .filter(match => ['latin', 'vietnamese'].includes(match[1].trim()));
if (!selected.length) throw new Error('No Vietnamese/Latin @font-face blocks found');
const urls = new Map();
const blocks = [];
let bytes = 0;
for (const match of selected) {
  const subset = match[1].trim();
  let block = match[2];
  const family = block.match(/font-family:\s*['"]([^'"]+)['"]/)[1];
  const weight = block.match(/font-weight:\s*([^;]+)/)[1].trim();
  const remote = block.match(/url\(([^)]+)\)/)[1];
  if (!remote.startsWith('https://fonts.gstatic.com/') || !remote.includes('.woff2')) throw new Error('Unexpected font source: ' + remote);
  let filename = urls.get(remote);
  if (!filename) {
    filename = family.replaceAll(' ', '') + '-' + weight.replaceAll(' ', '-') + '-' + subset + '.woff2';
    const fontResponse = await fetch(remote, { signal: AbortSignal.timeout(20000) });
    if (!fontResponse.ok) throw new Error('Font HTTP ' + fontResponse.status);
    const data = new Uint8Array(await fontResponse.arrayBuffer());
    if (new TextDecoder().decode(data.slice(0, 4)) !== 'wOF2') throw new Error('Not WOFF2: ' + filename);
    await writeFile(path.join(folder, filename), data);
    bytes += data.length;
    urls.set(remote, filename);
  }
  block = block.replace(remote, '/fonts/' + filename);
  blocks.push('/* ' + family + ' — ' + subset + ' */\n' + block);
}
await writeFile(path.join(folder, 'fonts.css'), '/* Local Google Fonts subsets. Licences: BeVietnamPro-OFL.txt and Literata-OFL.txt. */\n' + blocks.join('\n\n') + '\n');
for (const [dir, name] of [['bevietnampro', 'BeVietnamPro'], ['literata', 'Literata']]) {
  const license = await fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/' + dir + '/OFL.txt', { signal: AbortSignal.timeout(20000) });
  if (!license.ok) throw new Error('OFL HTTP ' + license.status + ' for ' + name);
  await writeFile(path.join(folder, name + '-OFL.txt'), await license.text());
}
await writeFile(path.join(folder, 'README.md'), '# Local fonts\n\nFetched 27/10/2026 from the official Google Fonts CSS API and fonts.gstatic.com.\n\n- Be Vietnam Pro: weights 400, 500, 600, 700; Vietnamese and Latin subsets.\n- Literata: weights 500, 600, 700; Vietnamese and Latin subsets.\n- Import `/fonts/fonts.css` from the document head.\n- SIL Open Font License files are included for both families.\n- Run `node scripts/fetch-fonts.mjs` to refresh the assets.\n\nOriginal CSS endpoint:\n\n' + endpoint + '\n');
console.log(JSON.stringify({ faces: blocks.length, uniqueFiles: urls.size, totalBytes: bytes, css: 'public/fonts/fonts.css' }));
