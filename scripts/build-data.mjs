// Lädt die Firmendaten für die Region Stuttgart aus OpenStreetMap und schreibt data/cache.json.
// Läuft wöchentlich als GitHub-Job (.github/workflows/update-data.yml) – die Web-App selbst
// fragt OpenStreetMap nie direkt ab.
// Eine Anfrage pro Branche, nacheinander mit Pause. Schlägt eine Branche fehl, bleiben ihre alten Daten erhalten.
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const BBOX = [48.55, 8.80, 49.02, 9.75]; // Süd, West, Nord, Ost – Region Stuttgart inkl. Umland
const OUT = 'data/cache.json';
const UA = 'LeadFinderStuttgart/1.0 (+https://github.com/mmmmaarrtt/leadgenerator2)';
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

// Muss zu CATS in index.html passen (gleiche ids, gleiche Filter)
const CATS = {
  auto:     ['["shop"="car"]', '["shop"="motorcycle"]', '["shop"="caravan"]'],
  moebel:   ['["shop"="furniture"]', '["shop"="kitchen"]', '["shop"="bed"]', '["shop"="interior_decoration"]'],
  fitness:  ['["leisure"="fitness_centre"]'],
  immo:     ['["office"="estate_agent"]', '["office"="property_management"]', '["office"="construction_company"]'],
  gesund:   ['["amenity"="clinic"]', '["amenity"="dentist"]', '["healthcare"="clinic"]'],
  optik:    ['["shop"="optician"]', '["shop"="hearing_aids"]'],
  bau:      ['["shop"="doityourself"]', '["shop"="garden_centre"]', '["shop"="hardware"]'],
  elektro:  ['["shop"="electronics"]', '["shop"="mobile_phone"]', '["shop"="computer"]'],
  bildung:  ['["amenity"="driving_school"]', '["amenity"="language_school"]', '["amenity"="college"]', '["amenity"="music_school"]'],
  freizeit: ['["amenity"="cinema"]', '["amenity"="theatre"]', '["amenity"="nightclub"]', '["leisure"="water_park"]', '["leisure"="escape_game"]', '["amenity"="events_venue"]', '["leisure"="bowling_alley"]'],
  personal: ['["office"="employment_agency"]'],
  gastro:   ['["amenity"="restaurant"]', '["amenity"="bar"]', '["amenity"="biergarten"]'],
  hotel:    ['["tourism"="hotel"]'],
  beauty:   ['["shop"="beauty"]', '["shop"="cosmetics"]', '["shop"="hairdresser"]', '["shop"="massage"]'],
  mode:     ['["shop"="clothes"]', '["shop"="shoes"]', '["shop"="jewelry"]', '["shop"="boutique"]'],
  handwerk: ['["craft"~"^(electrician|plumber|hvac|roofer|carpenter|painter|photovoltaic|solar|window_construction|tiler|heating_engineer)$"]'],
  kanzlei:  ['["office"="lawyer"]', '["office"="tax_advisor"]', '["office"="insurance"]', '["office"="financial_advisor"]'],
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
const normUrl = u => { if (!u) return ''; u = u.trim(); return /^https?:\/\//i.test(u) ? u : 'https://' + u; };

function buildQuery(filters) {
  return `[out:json][timeout:180][bbox:${BBOX.join(',')}];(${filters.map(f => `nwr${f}["name"];`).join('')});out center tags;`;
}

async function overpass(query) {
  let lastErr;
  for (let round = 0; round < 4; round++) {
    if (round) await sleep(20000 * round);
    for (const url of ENDPOINTS) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'data=' + encodeURIComponent(query),
          signal: AbortSignal.timeout(200000),
        });
        if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
        const data = await res.json();
        if (/runtime error|timed out|rate_limited/i.test(data.remark || '')) throw new Error(`${url} ${data.remark}`);
        return data;
      } catch (e) { lastErr = e; console.log('  ', e.message); }
    }
  }
  throw lastErr;
}

function compact(el, catId) {
  const t = el.tags || {};
  const lat = el.lat ?? el.center?.lat, lon = el.lon ?? el.center?.lon;
  if (lat == null || !t.name) return null;
  const it = {
    id: el.type[0] + el.id, name: t.name, catId,
    sub: t.cuisine || t.brand || t.operator || t.shop || t.amenity || t.office || t.craft || t.leisure || t.tourism || '',
    street: [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' '),
    city: [t['addr:postcode'], t['addr:city'] || t['addr:suburb']].filter(Boolean).join(' '),
    lat: +lat.toFixed(6), lon: +lon.toFixed(6),
    phone: t.phone || t['contact:phone'] || t['contact:mobile'] || '',
    website: normUrl(t.website || t['contact:website'] || t.url || ''),
    email: t.email || t['contact:email'] || '',
    hours: t.opening_hours || '',
    brand: t.brand || '', operator: t.operator || '',
    instagram: t['contact:instagram'] || '', facebook: t['contact:facebook'] || '',
  };
  for (const k in it) if (it[k] === '') delete it[k];
  return it;
}

let db = { version: 1, bbox: BBOX, cats: {} };
try { db = JSON.parse(await readFile(OUT, 'utf8')); } catch { /* erster Lauf */ }

const failed = [];
for (const [catId, filters] of Object.entries(CATS)) {
  console.log(`Lade ${catId} …`);
  try {
    const data = await overpass(buildQuery(filters));
    const seen = new Set(), items = [];
    for (const el of data.elements || []) {
      const it = compact(el, catId); if (!it) continue;
      const key = (it.name + '|' + (it.street || '')).toLowerCase();
      if (seen.has(key)) continue; seen.add(key); items.push(it);
    }
    db.cats[catId] = { fetched: new Date().toISOString(), items };
    console.log(`  ${items.length} Firmen`);
  } catch (e) {
    failed.push(catId);
    console.log(`  FEHLGESCHLAGEN – alte Daten bleiben erhalten`);
  }
  await sleep(5000);
}

await mkdir('data', { recursive: true });
await writeFile(OUT, JSON.stringify(db));
console.log(`Fertig. ${Object.values(db.cats).reduce((s, c) => s + c.items.length, 0)} Firmen gesamt.` + (failed.length ? ` Fehlgeschlagen: ${failed.join(', ')}` : ''));
if (failed.length === Object.keys(CATS).length) process.exit(1);
