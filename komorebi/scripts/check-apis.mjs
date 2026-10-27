/** Low-volume, repeatable connectivity checks. Never sends payment credentials. */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const providers = [
  { name: 'Jikan', url: 'https://api.jikan.moe/v4/manga?q=one%20piece&limit=1&sfw=true', pick: j => ({ count: j.data?.length, sample: j.data?.[0]?.title }) },
  { name: 'AniList', url: 'https://graphql.anilist.co', method: 'POST', body: { query: '{ Page(page:1, perPage:1) { media(type:MANGA, search:"One Piece", isAdult:false) { id title { romaji } } } }' }, pick: j => ({ count: j.data?.Page?.media?.length, sample: j.data?.Page?.media?.[0]?.title?.romaji, apiErrors: j.errors?.map(x => x.message) }) },
  { name: 'Kitsu', url: 'https://kitsu.io/api/edge/manga?filter[text]=one%20piece&page[limit]=1', accept: 'application/vnd.api+json', pick: j => ({ count: j.data?.length, sample: j.data?.[0]?.attributes?.canonicalTitle, apiErrors: j.errors?.map(x => x.detail ?? x.title) }) },
  { name: 'MangaDex', url: 'https://api.mangadex.org/manga?title=one%20piece&limit=1&contentRating[]=safe', pick: j => ({ count: j.data?.length, sample: Object.values(j.data?.[0]?.attributes?.title ?? {})[0], apiErrors: j.errors?.map(x => x.detail ?? x.title) }) },
  { name: 'OTruyen', url: 'https://otruyenapi.com/v1/api/tim-kiem?keyword=one%20piece', pick: j => ({ count: j.data?.items?.length, sample: j.data?.items?.[0]?.name, apiStatus: j.status }) },
  { name: 'Open Library', url: 'https://openlibrary.org/search.json?title=one%20piece&limit=1&fields=key,title,author_name,isbn,cover_i', pick: j => ({ count: j.docs?.length, sample: j.docs?.[0]?.title }) },
  { name: 'Google Books (without key)', url: 'https://www.googleapis.com/books/v1/volumes?q=intitle:one%20piece&maxResults=1&printType=books', pick: j => ({ count: j.items?.length, sample: j.items?.[0]?.volumeInfo?.title, apiError: j.error?.message }) },
  { name: 'MyAnimeList (without client ID)', url: 'https://api.myanimelist.net/v2/manga?q=one%20piece&limit=1', pick: j => ({ count: j.data?.length, sample: j.data?.[0]?.node?.title, apiError: j.message ?? j.error }) },
  { name: 'Comic Vine (without key)', url: 'https://comicvine.gamespot.com/api/volumes/?format=json&limit=1&filter=name:one%20piece', pick: j => ({ count: j.results?.length, sample: j.results?.[0]?.name, apiError: j.error, apiStatus: j.status_code }) },
];

const checks = [];
for (const p of providers) {
  const start = Date.now();
  let result = { name: p.name, endpoint: p.url, method: p.method ?? 'GET', checkedAt: new Date().toISOString() };
  try {
    const response = await fetch(p.url, {
      method: p.method ?? 'GET',
      headers: { Accept: p.accept ?? 'application/json', 'User-Agent': 'KomorebiClassProject-APIProbe/1.0', ...(p.body ? { 'Content-Type': 'application/json' } : {}) },
      body: p.body ? JSON.stringify(p.body) : undefined,
      signal: AbortSignal.timeout(12000),
    });
    const raw = await response.text();
    let json;
    try { json = JSON.parse(raw); } catch { /* Cloudflare/login pages are reported as non-JSON, never success. */ }
    result = { ...result, httpStatus: response.status, contentType: response.headers.get('content-type'), corsAllowOrigin: response.headers.get('access-control-allow-origin'), rateLimit: response.headers.get('x-ratelimit-limit'), elapsedMs: Date.now() - start, json: Boolean(json), ...(json ? p.pick(json) : { note: 'Non-JSON response; no successful API payload verified.' }) };
    result.usableAnonymousResponse = response.ok && Boolean(json) && Number(result.count) > 0;
  } catch (error) {
    result = { ...result, httpStatus: null, elapsedMs: Date.now() - start, usableAnonymousResponse: false, networkError: error.cause?.code ?? error.name, note: 'Connectivity failure in this execution environment; does not prove provider downtime.' };
  }
  checks.push(result);
  process.stdout.write(`${result.name}: ${result.httpStatus ?? result.networkError}; usable=${result.usableAnonymousResponse}\n`);
}

const report = {
  checkedAt: new Date().toISOString(),
  displayTimezone: 'Asia/Bangkok',
  scope: 'One low-volume representative request per provider, anonymous access only; not exhaustive endpoint, licence, CORS-browser, or uptime certification.',
  checks,
};
await mkdir(path.join(root, 'docs'), { recursive: true });
await writeFile(path.join(root, 'docs', 'api-check-results.json'), JSON.stringify(report, null, 2) + '\n');
process.stdout.write('Report: docs/api-check-results.json\n');
