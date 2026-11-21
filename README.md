# Parramatta Explorer: static HTML version

A plain **HTML + CSS + JavaScript** version of Parramatta Explorer. It has the same pages and features as the Next.js app, but needs no framework, no `npm install` and no build step to *run*. Any web server (or a static host) can serve it.

> Prototype. Illustrative data. Not a Council service. (Same as the Next.js app.)

## Run it

You only need Node.js:

```bash
cd static-site
node tools/serve.mjs          # then open http://localhost:8080
# or: node tools/serve.mjs 3000
```

Python works too: `python3 -m http.server 8080` from inside `static-site/`.

You can also double-click `index.html`. Everything works that way **except offline saving**: browsers only allow service workers on `https://` or `localhost`.

To publish it, upload the `static-site/` folder to any static host (GitHub Pages, Netlify, Cloudflare Pages, an S3 bucket, …). It uses relative links, so it works at the site root or in a sub-folder. Use `https://` so the offline features work.

## Pages

| File | Same as Next.js route |
|---|---|
| `index.html` | `/` Explore |
| `plan/<event>.html` (16 pages) | `/plan/[eventId]` access plan |
| `organiser/<event>.html` (16 pages) | `/organiser/[eventId]` organiser workspace |
| `report.html` | `/report` |
| `signin.html` | `/signin` |
| `settings.html` | `/settings` |
| `guide.html`, `about.html` | `/guide`, `/about` |
| `offline.html`, `404.html` | (new) fallback pages |

The pages are **pre-rendered**, so the event list, every access feature and the text list under each map are real HTML. They stay readable with JavaScript off. Filtering, tabs, the map and the forms need JavaScript.

## What was added (the four "next steps")

**1. Offline support (service worker)**: `sw.js`
- After the first visit, every page, script, font and the map library are stored on the device, so the whole site opens with no signal (tested by actually stopping the server).
- "Save this plan for offline" also pre-fetches map tiles around the venue, so the live map works offline. Where tiles aren't stored, the app falls back to the schematic map (and every map has a text list).
- Needs `https://` or `localhost`.

**2. More display settings**: `settings.html`
- Dyslexia-friendly font (OpenDyslexic, self-hosted), letter/word spacing, line spacing, reduce-motion switch.
- Windows High Contrast / forced-colours is supported automatically (selected states use system `Highlight` colours).
- Buttons, inputs, tabs and links in the navigation measure at least 44×44 px on every page (checkboxes are counted by their whole label). The small zoom buttons on the live map come from the MapLibre library and are smaller. Printing always uses light colours.



**3. One vote per device**: `report.html`
- Voting twice with the same answer does nothing; picking a different answer *moves* your vote. Your own report counts as your vote. One flag per report per device.

## Where things are, and how to change them

The HTML pages are **generated**. Don't hand-edit them (the next build overwrites them).

| To change… | Edit | Then |
|---|---|---|
| Events, venues, access features, needs, checklist, risks | `../src/lib/events.ts`, `../src/lib/data/seed.ts`, `needs.ts` | `npm run build` |
| Page text and layout | `tools/build.mjs` | `npm run build` |
| Colours, spacing, themes | `assets/css/styles.css` | refresh |
| Behaviour (filters, tabs, map, forms) | `assets/js/*.js` | refresh |
| Offline behaviour | `tools/sw.template.js` | `npm run build` |

```bash
cd static-site
npm install        # once (installs the build tools: esbuild, MapLibre, fonts)
npm run build      # regenerates every page, assets/js/data.js, sw.js
```

Because the data is read straight from the Next.js app's TypeScript, both versions always share one dataset.

## Honest limits

- **Community data is per browser.** There's no server here, so reports, votes and ratings live in this browser's `localStorage` and aren't shared. Real shared voting needs a backend (the Next.js app has API routes, but they only keep data in memory).
- **Vote and flag dedupe is a convenience, not security.** Anyone can clear their storage. Real dedupe has to be done on a server. The same applies to the client-side rate limits and the demo sign-in.
- **Map tile pre-fetching has been tested against a local mock tile server, not the live OpenFreeMap service** (it wasn't reachable from where this was built). Please try "Save this plan for offline" once online on your own machine, then go offline and check the map.
- **No translated summaries.** The app's own rule is that translated key information is human-reviewed, so machine translation wasn't added.
- **The dyslexia-friendly font is a preference, not a guarantee.** Research on whether such fonts improve reading is mixed; the spacing options may help some people more.
- The "verified N days ago" figures are example values counted from when the page loads (as in the Next.js app).

## Landing page

`landing.html` is a single self-contained pitch page (CSS inline) that links to `index.html`, the prototype's first page. Edit `tools/contest.mjs`, then run `npm run build` (it regenerates `landing.html`; edits made directly to the file are overwritten).

