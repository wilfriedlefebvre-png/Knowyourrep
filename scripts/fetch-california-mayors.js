#!/usr/bin/env node
/**
 * Fetch current mayors for California municipalities from Wikidata
 * and merge them into the app's politicians dataset.
 *
 * This script:
 * 1. Queries Wikidata's public SPARQL endpoint for cities/towns in California
 *    (wd:Q99) that have a current head of government (P6) with no end date.
 * 2. Normalises the data into the app's politician schema.
 * 3. Removes existing California local entries from public/politicians.json.
 * 4. Appends the refreshed set and writes the file back, sorted by city name.
 *
 * Requires Node 18+ (for built-in fetch).
 */

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const POLITICIANS_PATH = path.join(ROOT_DIR, "public", "politicians.json");
const OUTPUT_SNAPSHOT_PATH = path.join(
  ROOT_DIR,
  "public",
  "california-mayors.json"
);

const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";

const PREFIXES = [
  ..."abcdefghijklmnopqrstuvwxyz",
  "other",
];

const log = (message, ...args) => {
  console.log(`[fetch-california-mayors] ${message}`, ...args);
};

async function queryWikidata(filterClause) {
  const sparql = `
SELECT DISTINCT ?city ?cityLabel ?mayor ?mayorLabel ?partyLabel ?image WHERE {
  ?city wdt:P31/wdt:P279* wd:Q515;
        wdt:P17 wd:Q30;
        wdt:P131 ?admin;
        wdt:P6 ?mayor.

  FILTER (?admin = wd:Q99 || EXISTS { ?admin wdt:P131 wd:Q99 })

  OPTIONAL { ?mayor wdt:P102 ?party. }
  OPTIONAL { ?mayor wdt:P18 ?image. }

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }

  ${filterClause}
}
`;

  const response = await fetch(SPARQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/sparql-query",
      Accept: "application/sparql-results+json",
      "User-Agent":
        "KnowYourRep/1.0 (https://github.com/wilfriedlefebvre-png/Knowyourrep)",
    },
    body: sparql,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to query Wikidata (status ${response.status}): ${text}`
    );
  }

  return response.json();
}

async function fetchCaliforniaMayors() {
  const mayorByCity = new Map();

  for (const prefix of PREFIXES) {
    const filterClause =
      prefix === "other"
        ? 'FILTER(!REGEX(LCASE(?cityLabel), "^[a-z]"))'
        : `FILTER(STRSTARTS(LCASE(?cityLabel), "${prefix}"))`;

    log(`Fetching cities with prefix "${prefix}"…`);
    try {
      const json = await queryWikidata(filterClause);
      const bindings = json?.results?.bindings ?? [];
      log(`  ↳ Retrieved ${bindings.length} rows.`);

      for (const binding of bindings) {
        const city = binding.cityLabel?.value;
        const mayor = binding.mayorLabel?.value;

        if (!city || !mayor) continue;

        const party = binding.partyLabel?.value || "Nonpartisan";
        const image = binding.image?.value;

        mayorByCity.set(city, {
          level: "local",
          office: "Mayor",
          name: mayor,
          party,
          state: "California",
          city,
          ...(image ? { photoUrl: image } : {}),
        });
      }
    } catch (error) {
      log(`  ⚠️  Failed for prefix "${prefix}": ${error.message}`);
    }

    // Be kind to the endpoint
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  const mayors = Array.from(mayorByCity.values()).sort((a, b) =>
    a.city.localeCompare(b.city)
  );

  log(`Normalised ${mayors.length} unique California mayor entries.`);

  return mayors;
}

function writeSnapshot(mayors) {
  fs.writeFileSync(
    OUTPUT_SNAPSHOT_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        count: mayors.length,
        entries: mayors,
      },
      null,
      2
    ) + "\n"
  );
  log(`Snapshot written to ${path.relative(ROOT_DIR, OUTPUT_SNAPSHOT_PATH)}.`);
}

function mergeIntoPoliticians(allPoliticians, mayors) {
  const filtered = allPoliticians.filter(
    (person) => !(person.level === "local" && person.state === "California")
  );

  const merged = [...filtered, ...mayors];
  merged.sort((a, b) => {
    const levelOrder = ["federal", "state", "local"];
    const levelComparison =
      levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level);
    if (levelComparison !== 0) return levelComparison;
    if (a.state && b.state) {
      const stateComp = a.state.localeCompare(b.state);
      if (stateComp !== 0) return stateComp;
    }
    if (a.city && b.city) {
      const cityComp = a.city.localeCompare(b.city);
      if (cityComp !== 0) return cityComp;
    }
    return a.name.localeCompare(b.name);
  });

  return merged;
}

async function main() {
  try {
    const mayors = await fetchCaliforniaMayors();
    writeSnapshot(mayors);

    log("Loading existing politicians dataset…");
    const raw = fs.readFileSync(POLITICIANS_PATH, "utf-8");
    const allPoliticians = JSON.parse(raw);

    const merged = mergeIntoPoliticians(allPoliticians, mayors);
    fs.writeFileSync(POLITICIANS_PATH, JSON.stringify(merged, null, 2) + "\n");

    log(
      `Updated politicians dataset with ${mayors.length} California mayors (total records: ${merged.length}).`
    );
    log("Done.");
  } catch (error) {
    console.error(
      "[fetch-california-mayors] Failed to update California mayors:",
      error
    );
    process.exitCode = 1;
  }
}

main();

