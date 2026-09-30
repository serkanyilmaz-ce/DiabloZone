# Diablo IV Data Lab — PoC

A compact static-site proof of concept for turning `DiabloTools/d4data` into a stable website-owned data model.

## Why this shape

- Astro static output → GitHub Pages, no server/database.
- TypeScript importer isolated from the UI.
- Zod schemas define the future canonical domain model.
- `probe` intentionally discovers records recursively instead of assuming undocumented upstream paths.
- No copied/fake Diablo game records are committed. The test fixture is synthetic.

## Requirements

- Node.js 22+
- npm
- A local checkout of `https://github.com/DiabloTools/d4data`

## Run site

```bash
npm install
npm run dev
```

## Run importer probe

```bash
git clone --depth 1 https://github.com/DiabloTools/d4data.git ./d4data
npm run data:probe -- --datamine ./d4data
npm run dev
```

Generated files:

- `data/generated/metadata.json`
- `data/generated/proof.json`

The probe searches for three first targets:

1. Fireball
2. Harlequin Crest
3. Aspect records

This is **discovery**, not the final parser. The resulting `file` + JSON `path` values tell us the exact current upstream structures to implement in the next adapter.

## Synthetic local check

```bash
npm run data:probe:fixture
npm test
```

## GitHub Pages

Push to `main`, then in GitHub open **Settings → Pages** and select **GitHub Actions** as the source. The included workflow builds a static site and handles a project-style `github.io/<repo>/` base path.

## Next implementation step

Use the real `proof.json` to replace heuristic discovery with explicit adapters:

- `skills.ts`
- `items.ts`
- `aspects.ts`
- string/SNO/GBID resolvers

The UI should consume only normalized `data/generated/*.json`, never raw d4data structures.

## Attribution / status

Unofficial community project. Diablo IV and game assets/data are property of Blizzard Entertainment. `DiabloTools/d4data` is a community datamine project; review upstream licensing/Blizzard terms before redistributing game assets.
