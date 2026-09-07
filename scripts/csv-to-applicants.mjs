#!/usr/bin/env node
// Converts real survey responses (CSV) into pasteable `Applicant` TS records.
//
// This does not touch cohort.ts. It only reads the existing file to figure
// out the next free id, then prints ready-to-paste object literals to
// stdout — you review and paste them into `APPLICANTS` in
// `src/data/cohort.ts` yourself, and set `surveyed: true` is baked in here
// because every row this script reads IS a real survey response.
//
// Usage:
//   node scripts/csv-to-applicants.mjs path/to/responses.csv
//
// Expected header row (see research/templates/applicant-survey-template.csv):
//   name,specificAnimalId,homeType,hasYard,hoursAwayPerDay,hasChildren,
//   hasOtherPets,experience,canDoDailyMeds,maxSizeKg,prefersSpecies,
//   prefersAge,prefersEnergy
//
// Plain Node, zero dependencies — Architecture §2 restricts app dependencies
// to Vite/React/TypeScript/Vitest; this script is dev tooling, not shipped.

import { readFileSync } from 'node:fs';
import path from 'node:path';

const REQUIRED_HEADERS = [
  'name',
  'specificAnimalId',
  'homeType',
  'hasYard',
  'hoursAwayPerDay',
  'hasChildren',
  'hasOtherPets',
  'experience',
  'canDoDailyMeds',
  'maxSizeKg',
  'prefersSpecies',
  'prefersAge',
  'prefersEnergy',
];

function fail(message) {
  console.error(`csv-to-applicants: ${message}`);
  process.exit(1);
}

/** Minimal RFC4180 parser: handles quoted fields, embedded commas, "" escapes. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && next === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

function toBool(value, columnName, rowNumber) {
  const normalized = value.trim().toLowerCase();
  if (['yes', 'y', 'true', '1'].includes(normalized)) return true;
  if (['no', 'n', 'false', '0', ''].includes(normalized)) return false;
  fail(`row ${rowNumber}: column "${columnName}" is "${value}" — expected yes/no.`);
}

function toIntInRange(value, columnName, rowNumber, lo, hi) {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n) || n < lo || n > hi) {
    fail(`row ${rowNumber}: column "${columnName}" is "${value}" — expected an integer ${lo}-${hi}.`);
  }
  return n;
}

function toNullableEnum(value, columnName, rowNumber, allowed) {
  const normalized = value.trim().toLowerCase();
  if (normalized === '' || normalized === 'none' || normalized === 'no preference') return null;
  if (!allowed.includes(normalized)) {
    fail(`row ${rowNumber}: column "${columnName}" is "${value}" — expected one of ${allowed.join(', ')} or blank.`);
  }
  return normalized;
}

function nextFreeId(cohortSource) {
  const ids = [...cohortSource.matchAll(/id:\s*'p(\d+)'/g)].map((m) => Number.parseInt(m[1], 10));
  const max = ids.length > 0 ? Math.max(...ids) : 0;
  return max;
}

function main() {
  const csvPath = process.argv[2];
  if (csvPath === undefined) {
    fail('usage: node scripts/csv-to-applicants.mjs path/to/responses.csv');
  }

  const text = readFileSync(csvPath, 'utf8');
  const rows = parseCsv(text);
  if (rows.length < 2) fail('CSV has no data rows.');

  const header = rows[0].map((h) => h.trim());
  for (const required of REQUIRED_HEADERS) {
    if (!header.includes(required)) fail(`missing required column "${required}".`);
  }

  const cohortPath = path.resolve('src/data/cohort.ts');
  let cohortSource = '';
  try {
    cohortSource = readFileSync(cohortPath, 'utf8');
  } catch {
    console.error(`csv-to-applicants: could not read ${cohortPath} to determine the next id — starting from p001.`);
  }
  let nextId = nextFreeId(cohortSource);

  const records = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rowNumber = r + 1; // 1-indexed, header is row 1
    const get = (columnName) => {
      const idx = header.indexOf(columnName);
      return (row[idx] ?? '').trim();
    };

    nextId += 1;
    const id = `p${String(nextId).padStart(2, '0')}`;
    const name = get('name') || `Household ${nextId}`;
    const homeType = get('homeType').trim().toLowerCase();
    if (homeType !== 'house' && homeType !== 'apartment') {
      fail(`row ${rowNumber}: column "homeType" is "${get('homeType')}" — expected house or apartment.`);
    }
    const specificAnimalId = get('specificAnimalId') || null;

    records.push({
      id,
      name,
      surveyed: true,
      homeType,
      hasYard: toBool(get('hasYard'), 'hasYard', rowNumber),
      hoursAwayPerDay: toIntInRange(get('hoursAwayPerDay'), 'hoursAwayPerDay', rowNumber, 0, 14),
      hasChildren: toBool(get('hasChildren'), 'hasChildren', rowNumber),
      hasOtherPets: toBool(get('hasOtherPets'), 'hasOtherPets', rowNumber),
      experience: toIntInRange(get('experience'), 'experience', rowNumber, 1, 5),
      canDoDailyMeds: toBool(get('canDoDailyMeds'), 'canDoDailyMeds', rowNumber),
      maxSizeKg: toIntInRange(get('maxSizeKg'), 'maxSizeKg', rowNumber, 1, 100),
      specificAnimalId,
      prefersSpecies: toNullableEnum(get('prefersSpecies'), 'prefersSpecies', rowNumber, ['dog', 'cat']),
      prefersAge: toNullableEnum(get('prefersAge'), 'prefersAge', rowNumber, ['young', 'adult', 'senior']),
      prefersEnergy:
        get('prefersEnergy').trim() === ''
          ? null
          : toIntInRange(get('prefersEnergy'), 'prefersEnergy', rowNumber, 1, 5),
    });
  }

  const rendered = records
    .map((record) => {
      const lines = Object.entries(record).map(([key, value]) => `    ${key}: ${JSON.stringify(value)},`);
      return `  {\n${lines.join('\n')}\n  },`;
    })
    .join('\n');

  console.log(`// ${records.length} real survey response(s) — surveyed: true on every one.`);
  console.log('// Paste into the APPLICANTS array in src/data/cohort.ts.');
  console.log(rendered);
}

main();
