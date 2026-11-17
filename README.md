# Australia Building Calculators

A static Australian building, construction, renovation and landscaping calculator website. It uses HTML, CSS and vanilla JavaScript; no database, server-side runtime or framework is needed.

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
   - `https://australia-building-calculators.github.io`
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

For this GitHub Pages deployment, the GitHub account or organisation must be named `australia-building-calculators` and the repository must be named `australia-building-calculators.github.io`. The website URL is `https://australia-building-calculators.github.io`. Upload the contents of this folder to the repository root (not the enclosing `site` folder), then in **Settings → Pages** choose **Deploy from a branch**, select `main` and `/ (root)`, and save. The sitemap and canonical URLs are already configured for this address.

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
