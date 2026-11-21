# Aussie Build Calc

A static Australian building, renovation and landscaping calculator website. It uses HTML, CSS and vanilla JavaScript; no database, server-side runtime or framework is needed.

## What is included

- 11 calculators: concrete, gravel, soil, mulch, paint, tile, brick, screed, square metre, cubic metre and lineal metre.
- A directory-first homepage with search, category filters, popular tools and a live quick area-and-volume estimator.
- Shared calculator forms with live results, input validation, accessible error feedback, reset and copy actions.
- Optional second rectangular areas on concrete, gravel, soil, mulch and tile calculators; rectangle/triangle/circle area modes and rectangular/cylindrical volume modes.
- About, Privacy and How We Calculate pages, plus a custom 404 page.

## Required before production launch

1. Open `site.config.json`.
2. Set `siteUrl` to the exact public website address, including `https://` and any repository subpath, with no trailing slash. Examples:
   - `https://your-project.pages.dev`
   - `https://username.github.io/repository-name`
3. Optionally set `contactEmail` to an address you control. This generates a Contact page and adds it to the footer. Leave it blank if you do not want to publish an email address.
4. Run `node build.js` from this folder.

**Important:** while `siteUrl` is blank, the build intentionally marks pages `noindex`, does not generate canonical URLs, and removes `sitemap.xml`. This prevents Google from indexing a release that has not yet been configured with its real public URL. The build prints a reminder. Set the correct URL and rebuild before launch.

You can also set the Cloudflare Pages build environment variable `SITE_URL` to your public HTTPS URL. It overrides `siteUrl` in the JSON configuration. This is useful when you prefer to keep the deployment URL in Cloudflare settings.

## Deploy on Cloudflare Pages

If the repository contains this folder as `site/`, set:

- **Root directory:** `site`
- **Build command:** `node build.js`
- **Build output directory:** `.`

If you upload the contents of this folder as the repository root, use the same build command and output directory, with the root directory left at the project root.

For a GitHub Pages deployment, run `node build.js` locally after configuring `siteUrl`, then publish the generated contents of this folder.

## AdSense and analytics checklist

This release does **not** load advertising or analytics scripts. The Privacy page says so accurately. Before adding Google AdSense or another advertising provider:

1. Update the Privacy page to name the actual advertising provider, explain the cookies or similar technologies it uses, and describe relevant visitor choices.
2. Add any required consent or privacy controls for the locations you serve before enabling ad personalisation or tracking.
3. Add the actual publisher-specific `ads.txt` record supplied by the advertising account. Do not publish a guessed or placeholder publisher ID.
4. Re-check page speed, layout stability and mobile usability after ad placements are added.

Do not claim that the site uses AdSense until the account and ad code are actually connected. Approval is not guaranteed by the presence of policy pages alone.

## Files

- `js/data.js` — calculator fields, formulas, explanatory copy and FAQs.
- `js/app.js` — shared calculator UI, validation, copy/reset and mobile result bar.
- `js/site.js` — homepage search, category filters and quick estimator.
- `css/style.css` — responsive styling.
- `build.js` — builds the homepage, calculator pages and information pages.
- `site.config.json` — the final website URL and optional contact email.
- `test-calculators.js` — automated formula, edge-case and setup checks.

## Quick checks

From this folder run:

```bash
node test-calculators.js
node build.js
```

The test script checks all 11 default calculator outputs, multiple-area calculations, shape calculations, product option changes, rounding behaviours, validation safeguards and homepage quick-calculator elements.

## Changing the site

Edit calculator text, fields or formulas in `js/data.js`. Edit page layouts and trust pages in `build.js`, or styling in `css/style.css`. Run `node build.js` after changes.

## Calculation note

Material densities, bag yields, paint coverage and product dimensions are estimates, not supplier guarantees. Confirm values against the actual product label or supplier specification before placing an order. The calculators are planning aids, not engineering, structural or trade advice.

## Page content (content folder)
The text for the gravel, soil, paint, tile, concrete, mulch, brick, lineal metre and screed pages lives in `content/*.md`, exactly as written in the final content document. Edit those files, then run `node build.js`. The line `**[Calculator tool goes here]**` marks where the calculator appears, and the section called "Frequently Asked Questions" becomes the FAQ list and the FAQ schema. The square metre and cubic metre pages still use the text in `js/data.js`.

## Calculator features
Areas, rooms, walls and structures can be added with the "Add another" buttons. Gravel, soil, mulch and tile accept rectangles, circles and triangles. Concrete handles slabs, footings, post holes, columns, walls and steps. Paint works by room, with primer, trim and surface condition. Brick has custom sizes, adjustable joints and multiple walls. Lineal metre converts both ways and from timber volume. Screed handles sand and cement, liquid and bagged mixes. Material weights, bag yields and coverage rates are typical starting values that the visitor can edit. Run `node test-calculators.js` after changing a formula.

## Extras
Gravel, soil and mulch have an allowance dropdown (none, 5%, 10%, 15% or custom). Every group item (area, room, wall, structure) can be named, and the results then list each one separately. The lineal metre calculator accepts widths in mm, cm or m and several areas. Tile, brick and screed can estimate cost, and every calculator page has a "Print or save as PDF" button with a print layout.
