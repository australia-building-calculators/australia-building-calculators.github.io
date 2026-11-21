/*
 * Aussie Build Calc site generator
 * Build:  node build.js
 * Settings live in site.config.json (siteUrl, contactEmail).
 * You can also override the address:  SITE_URL=https://your-domain.example node build.js
 */
const fs = require('fs');
const path = require('path');

const OUT = __dirname;
let config = {};
try { config = JSON.parse(fs.readFileSync(path.join(OUT, 'site.config.json'), 'utf8')); }
catch (e) { throw new Error('Could not read site.config.json. Check that it contains valid JSON.'); }

// Validate production settings instead of quietly generating broken SEO URLs.
const rawSiteUrl = String(process.env.SITE_URL || config.siteUrl || '').trim();
let SITE_URL = '';
if (rawSiteUrl) {
  let parsedSiteUrl;
  try { parsedSiteUrl = new URL(rawSiteUrl); }
  catch (e) { throw new Error('Invalid siteUrl. Enter the full public URL, for example https://your-project.pages.dev'); }
  if (parsedSiteUrl.protocol !== 'https:' || parsedSiteUrl.username || parsedSiteUrl.password || parsedSiteUrl.search || parsedSiteUrl.hash) {
    throw new Error('siteUrl must be an HTTPS website URL without a username, password, query string or hash.');
  }
  SITE_URL = (parsedSiteUrl.origin + parsedSiteUrl.pathname).replace(/\/+$/, '');
}
const CONTACT_EMAIL = String(config.contactEmail || '').trim();
if (CONTACT_EMAIL && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(CONTACT_EMAIL)) {
  throw new Error('contactEmail does not look like a valid email address. Use an address you control, or leave it blank.');
}
const SITE_NAME = 'Aussie Build Calc';
const C = new Function(fs.readFileSync(path.join(OUT, 'js/data.js'), 'utf8') + ';return C;')();

const slug = {
  concrete: 'concrete-calculator', gravel: 'gravel-calculator', soil: 'soil-calculator',
  mulch: 'mulch-calculator', paint: 'paint-calculator', tile: 'tile-calculator',
  brick: 'brick-calculator', screed: 'screed-calculator', sqm: 'square-metre-calculator',
  cubic: 'cubic-metre-calculator', lineal: 'lineal-metre-calculator'
};
const icon = {
  concrete: '▰', gravel: '◈', soil: '✿', mulch: '♧', paint: '◒', tile: '▦',
  brick: '▧', screed: '▱', sqm: '▢', cubic: '◫', lineal: '↔'
};
const category = {
  concrete: 'Building', gravel: 'Landscaping', soil: 'Landscaping', mulch: 'Landscaping',
  paint: 'Renovation', tile: 'Renovation', brick: 'Building', screed: 'Building',
  sqm: 'Conversions', cubic: 'Conversions', lineal: 'Conversions'
};
// Calculators that go together, used for the "More useful calculators" links
const related = {
  concrete: ['screed', 'brick', 'cubic', 'sqm'], gravel: ['concrete', 'soil', 'cubic', 'sqm'],
  soil: ['mulch', 'gravel', 'cubic', 'sqm'], mulch: ['soil', 'gravel', 'sqm', 'cubic'],
  paint: ['sqm', 'tile', 'lineal', 'screed'], tile: ['sqm', 'screed', 'paint', 'lineal'],
  brick: ['concrete', 'sqm', 'screed', 'paint'], screed: ['concrete', 'tile', 'sqm', 'cubic'],
  sqm: ['tile', 'paint', 'lineal', 'concrete'], cubic: ['concrete', 'soil', 'gravel', 'sqm'],
  lineal: ['sqm', 'tile', 'paint', 'screed']
};
const descriptions = {
  concrete: 'Estimate ready-mix volume and approximate bag quantities for slabs, paths and driveways.',
  gravel: 'Calculate loose gravel volume and estimated tonnes for paths, driveways and garden projects.',
  soil: 'Plan garden beds, lawn top-ups and raised planters with volume, litres and bag estimates.',
  mulch: 'Work out the mulch volume and number of bags for garden beds and landscaped areas.',
  paint: 'Estimate paint litres from wall area, openings, ceiling area, coats and product coverage.',
  tile: 'Calculate tile quantities and boxes, including grout spacing and a cutting allowance.',
  brick: 'Estimate bricks or blocks for a wall after deducting doors, windows and other openings.',
  screed: 'Estimate screed volume plus indicative sand and cement quantities for a floor.',
  sqm: 'Calculate room, wall or floor area and convert square metres to square feet.',
  cubic: 'Calculate volume in cubic metres and litres from length, width and depth.',
  lineal: 'Convert a covered area into lineal metres using the material cover width.'
};
const keys = Object.keys(C);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const abs = p => SITE_URL ? `${SITE_URL}${p}` : '';
const jsonLd = o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;

function nav(root, current) {
  return `<nav class="tool-nav" aria-label="Calculator navigation"><a class="nav-all" href="${root}"${current === '' ? ' aria-current="page"' : ''}>All tools</a>` +
    keys.map(k => `<a href="${root}${slug[k]}/"${k === current ? ' aria-current="page"' : ''}>${esc(C[k].nm)}</a>`).join('') + '</nav>';
}

function article(section) {
  const heading = `<h3>${esc(section[0])}</h3>`;
  if (Array.isArray(section[1])) {
    return heading + `<div class="table-wrap"><table><thead><tr>${section[1][0].map(x => `<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>` +
      section[1].slice(1).map(row => `<tr>${row.map(x => `<td>${esc(x)}</td>`).join('')}</tr>`).join('') + '</tbody></table></div>';
  }
  return heading + section[1].split('\n').map(p => `<p>${esc(p)}</p>`).join('');
}

function head({ title, desc, canonical, root, schema }) {
  const img = abs('/og-image.png');
  return `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#143d32">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="${SITE_URL ? 'index,follow,max-image-preview:large' : 'noindex,follow'}">
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
<meta property="og:type" content="website">
<meta property="og:locale" content="en_AU">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
${canonical ? `<meta property="og:url" content="${esc(canonical)}">` : ''}
${img ? `<meta property="og:image" content="${esc(img)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">` : ''}
<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
${img ? `<meta name="twitter:image" content="${esc(img)}">` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">
<link rel="icon" type="image/svg+xml" href="${root}favicon.svg">
<link rel="stylesheet" href="${root}css/style.css">
${schema ? (Array.isArray(schema) ? schema : [schema]).map(jsonLd).join('\n') : ''}
</head>`;
}

function header(root, current) {
  return `<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header"><div class="header-inner">
<a class="brand" href="${root}" aria-label="Aussie Build Calc home"><span class="brand-mark" aria-hidden="true">A</span><span class="brand-copy"><strong>Aussie Build Calc</strong><small>Plan it. Measure it. Build it.</small></span></a>
${nav(root, current)}
</div></header>`;
}

function footer(root) {
  const links = [['All calculators', root], ['How we calculate', `${root}how-we-calculate/`], ['About', `${root}about/`], ['Privacy', `${root}privacy/`]];
  if (CONTACT_EMAIL) links.push(['Contact', `${root}contact/`]);
  return `<footer class="site-footer"><div class="footer-inner"><div><a class="footer-brand" href="${root}">Aussie Build Calc</a><p>Practical calculators for building, landscaping and home improvement projects across Australia.</p></div><div class="footer-links">${links.map(l => `<a href="${l[1]}">${l[0]}</a>`).join('')}</div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} ${SITE_NAME}</span><span>Estimates are a guide only. Confirm quantities, product yields and specifications with your supplier or qualified tradesperson.</span></div></footer>`;
}

// The calculator itself (form on the left, estimate on the right)
function workspace(c) {
  return `<p class="print-note">Estimate from Aussie Build Calc. Confirm quantities, product yields and specifications with your supplier before you order.</p><section class="calculator-workspace" aria-label="${esc(c.nm)} calculator"><div class="calculator-panel input-panel"><div class="panel-heading"><span class="panel-number">01</span><div><h2>Your measurements</h2><p>Enter your project details below.</p></div></div><div id="in" class="calculator-fields"></div><div id="feedback" class="form-feedback" role="status" aria-live="polite"></div><div class="form-actions"><button type="button" class="button button-outline" id="resetCalc">↺ <span>Reset values</span></button><span class="live-hint"><i></i> Updates automatically</span></div></div>
<div class="calculator-panel result-panel"><div class="result-topline"><div class="panel-heading"><span class="panel-number">02</span><div><h2>Your estimate</h2><p>Based on the measurements entered.</p></div></div><span class="result-check" aria-hidden="true">✓</span></div><div id="out" class="calculator-results"></div><div id="srStatus" class="sr-only" role="status" aria-live="polite"></div><p class="result-note" id="nt"></p><div class="result-actions"><button type="button" class="button button-result" id="copyResults">Copy results</button><button type="button" class="button button-outline button-print" id="printResults">Print or save as PDF</button><span class="copy-feedback" id="copyFeedback" aria-live="polite"></span></div><div class="estimate-footnote">Estimates are indicative. Confirm product yields and specifications with your supplier.</div></div></section>
<div class="micro-trust"><span>✓ No account required</span><span>✓ Free calculators</span><span>✓ Works on mobile</span></div>`;
}

function homePage() {
  const title = 'Free Building & Landscaping Calculators Australia | Aussie Build Calc';
  const desc = 'Free Australian building, renovation and landscaping calculators. Estimate concrete, gravel, soil, mulch, paint, tiles, bricks, screed and more using metric units.';
  const schema = [
    { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, description: desc, inLanguage: 'en-AU', ...(abs('/') ? { url: abs('/') } : {}) },
    { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Building calculators', itemListElement: keys.map((k, i) => ({ '@type': 'ListItem', position: i + 1, name: C[k].h, ...(abs(`/${slug[k]}/`) ? { url: abs(`/${slug[k]}/`) } : {}) })) }
  ];
  const cards = keys.map(k => `<a class="tool-card" href="${slug[k]}/" data-tool-card data-category="${esc(category[k].toLowerCase())}" data-search="${esc((C[k].nm + ' ' + C[k].h + ' ' + category[k] + ' ' + descriptions[k]).toLowerCase())}">
    <span class="tool-icon" aria-hidden="true">${icon[k]}</span><span class="tool-category">${esc(category[k])}</span>
    <strong>${esc(C[k].h.replace(' Australia', ''))}</strong><p>${esc(descriptions[k])}</p><span class="card-link">Open calculator</span></a>`).join('');
  const popular = ['concrete', 'gravel', 'paint', 'tile'].map(k => `<a class="popular-link" href="${slug[k]}/"><span class="popular-icon" aria-hidden="true">${icon[k]}</span><span>${esc(C[k].nm)}</span></a>`).join('');
  const filters = ['All tools', 'Building', 'Landscaping', 'Renovation', 'Conversions'].map((name, i) => `<button type="button" class="category-filter${i === 0 ? ' is-active' : ''}" data-category-filter="${i === 0 ? 'all' : name.toLowerCase()}" aria-pressed="${i === 0 ? 'true' : 'false'}">${name}</button>`).join('');
  return `<!doctype html><html lang="en-AU">${head({ title, desc, canonical: abs('/'), root: '', schema })}<body class="home-page">
${header('', '')}<main id="main">
<section class="home-hero home-hero-pro home-hero-compact"><div class="hero-inner"><div class="hero-copy">
<h1>Free Building Calculators Australia</h1>
<p>Work out how much concrete, gravel, soil, paint, tiles and bricks you need. Search below or pick a calculator from the list.</p>
<div class="hero-search tool-search"><label for="toolSearch">What are you working on?</label><div class="search-box"><span aria-hidden="true">⌕</span><input id="toolSearch" type="search" placeholder="Search concrete, gravel, paint, tiles…" autocomplete="off" aria-controls="toolGrid"><kbd>/</kbd></div><p class="search-count" id="searchCount" aria-live="polite">Showing ${keys.length} calculators</p></div>
<div class="hero-proof"><span>✓ Free to use</span><span>✓ No account needed</span><span>✓ Instant estimates</span></div>
</div>
<aside class="home-quickcalc" aria-labelledby="homeQuickTitle">
  <div class="home-quickcalc-heading"><span class="quickcalc-tag">Quick estimate</span><h2 id="homeQuickTitle">Area and volume calculator</h2><p>Get a simple measurement estimate without opening a separate tool.</p></div>
  <form id="homeQuickForm" class="home-quickcalc-form" novalidate>
    <div class="quickcalc-fields">
      <div class="quickcalc-field"><label for="homeQuickLength">Length <span>(m)</span></label><input id="homeQuickLength" type="number" inputmode="decimal" min="0.01" max="1000000" step="any" placeholder="e.g. 4" autocomplete="off"></div>
      <div class="quickcalc-field"><label for="homeQuickWidth">Width <span>(m)</span></label><input id="homeQuickWidth" type="number" inputmode="decimal" min="0.01" max="1000000" step="any" placeholder="e.g. 3" autocomplete="off"></div>
      <div class="quickcalc-field quickcalc-depth"><label for="homeQuickDepth">Depth <span>(mm, optional)</span></label><input id="homeQuickDepth" type="number" inputmode="decimal" min="0.01" max="1000000" step="any" placeholder="e.g. 100" autocomplete="off"></div>
    </div>
    <div class="quickcalc-results" aria-live="polite" aria-atomic="true">
      <div><span>Area</span><strong id="homeQuickArea">0 m²</strong></div>
      <div><span>Volume</span><strong id="homeQuickVolume">0 m³</strong></div>
    </div>
    <p class="quickcalc-message" id="homeQuickMessage" role="status">Enter length and width to calculate area. Add depth to calculate volume.</p>
    <div class="quickcalc-actions"><button type="button" class="quickcalc-example" id="homeQuickExample">Try an example</button><button type="button" class="quickcalc-clear" id="homeQuickClear">Clear</button></div>
  </form>
  <p class="home-quickcalc-links">Other shapes: <a href="${slug.sqm}/">square metre</a> or <a href="${slug.cubic}/">cubic metre</a> calculator</p>
</aside>
</div></section>
<section class="quick-strip" aria-label="Popular calculators"><div class="quick-inner"><span class="quick-label">Popular tools</span>${popular}</div></section>
<section class="tools-section" id="tools"><div class="section-heading"><div><h2>Find the right calculator</h2></div></div>
<div class="category-filters" role="group" aria-label="Filter calculators by category">${filters}</div>
<div class="tool-grid" id="toolGrid">${cards}</div><div class="no-results" id="noResults" hidden>No calculators found. Try another search or choose a different category.</div>
</section>
<section class="benefits-section" id="about"><div class="benefit-intro"><div class="section-kicker">Why use Aussie Build Calc?</div><h2>Less guesswork. Better planning.</h2><p>Whether it’s a weekend garden project or a bigger renovation, get a clear starting estimate without digging through complicated spreadsheets.</p></div><div class="benefit-list"><div class="benefit"><span aria-hidden="true">✓</span><div><b>Made for Australian metric measurements</b><p>Enter metres, millimetres, square metres and other familiar units.</p></div></div><div class="benefit"><span aria-hidden="true">✓</span><div><b>Results that update instantly</b><p>Adjust your measurements and see the estimate change as you work.</p></div></div><div class="benefit"><span aria-hidden="true">✓</span><div><b>Clear, practical breakdowns</b><p>See volume, area, weight, bags or quantities where the calculator supports them. <a href="how-we-calculate/">See how we calculate</a>.</p></div></div></div></section>
<section class="disclaimer-band"><div class="disclaimer-symbol" aria-hidden="true">i</div><div><strong>A helpful estimate, not a final order</strong><p>Material densities, product coverage and bag yields vary by supplier. Check product information and confirm your final quantities before purchasing.</p></div></section>
</main>${footer('')}<script src="js/data.js"></script><script src="js/site.js" defer></script></body></html>`;
}


// ---------- Page content from content/*.md (written in the final content document) ----------
const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*(?!\s)([^*]+?)\*(?!\*)/g, '$1<em>$2</em>');
const plain = s => String(s).replace(/\*\*/g, '').replace(/(^|\s)\*([^*]+)\*/g, '$1$2');
function parseBlocks(lines) {
  const out = []; let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    if (l.startsWith('### ')) { out.push({ t: 'h3', s: l.slice(4).trim() }); i++; continue; }
    if (l.trim().startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(lines[i].trim().replace(/^\||\|$/g, '').split('|').map(x => x.trim())); i++; }
      out.push({ t: 'table', rows: rows.filter(r => !r.every(c => /^:?-{2,}:?$/.test(c))) }); continue;
    }
    if (/^\s*[-*] /.test(l)) {
      const items = [];
      while (i < lines.length) {
        if (/^\s*[-*] /.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*] /, '').trim()); i++; }
        else if (!lines[i].trim() && i + 1 < lines.length && /^\s*[-*] /.test(lines[i + 1])) i++;
        else break;
      }
      out.push({ t: 'ul', items }); continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !lines[i].startsWith('### ') && !lines[i].trim().startsWith('|') && !/^\s*[-*] /.test(lines[i])) { para.push(lines[i].trim()); i++; }
    out.push({ t: 'p', s: para.join(' ') });
  }
  return out;
}
const blockHtml = b => b.t === 'h3' ? `<h3>${inline(b.s)}</h3>`
  : b.t === 'p' ? `<p>${inline(b.s)}</p>`
  : b.t === 'ul' ? `<ul>${b.items.map(x => `<li>${inline(x)}</li>`).join('')}</ul>`
  : `<div class="table-wrap"><table><thead><tr>${b.rows[0].map(x => `<th>${inline(x)}</th>`).join('')}</tr></thead><tbody>${b.rows.slice(1).map(r => `<tr>${r.map(x => `<td>${inline(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const blockText = b => b.t === 'ul' ? b.items.map(plain).join(' ') : b.t === 'table' ? '' : plain(b.s);
function loadContent(k) {
  const f = path.join(OUT, 'content', `${k}.md`);
  if (!fs.existsSync(f)) return null;
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  const title = lines[0].replace(/^#\s+/, '').trim();
  const mark = lines.findIndex(l => l.includes('[Calculator tool goes here]'));
  const firstH2 = lines.findIndex(l => l.startsWith('## '));
  const intro = parseBlocks(lines.slice(1, mark).filter(l => !/^\*[^*]+\*$/.test(l.trim())));
  const after = parseBlocks(lines.slice(mark + 1, firstH2));
  const sections = []; let cur = null;
  lines.slice(firstH2).forEach(l => { if (l.startsWith('## ')) { cur = { h: l.slice(3).trim(), lines: [] }; sections.push(cur); } else cur.lines.push(l); });
  sections.forEach(s => { s.blocks = parseBlocks(s.lines); });
  return { title, intro, after, sections };
}

function calculatorPage(k) {
  const c = C[k], root = '../', pagePath = `/${slug[k]}/`;
  const doc = loadContent(k);
  const faqSection = doc && doc.sections.find(s => /^Frequently Asked Questions/i.test(s.h));
  let faqs = (c.q || []).map(q => ({ q: q[0], aHtml: `<p>${esc(q[1])}</p>`, aText: q[1] }));
  if (faqSection) {
    faqs = []; let cur = null;
    faqSection.blocks.forEach(b => { if (b.t === 'h3') { cur = { q: plain(b.s), parts: [] }; faqs.push(cur); } else if (cur) cur.parts.push(b); });
    faqs = faqs.map(f => ({ q: f.q, aHtml: f.parts.map(blockHtml).join(''), aText: f.parts.map(blockText).join(' ').trim() }));
  }
  const pageSchema = [
    { '@context': 'https://schema.org', '@type': 'WebApplication', name: c.h, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', inLanguage: 'en-AU', description: c.md, ...(abs(pagePath) ? { url: abs(pagePath) } : {}) },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.aText } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'All calculators', ...(abs('/') ? { item: abs('/') } : {}) },
      { '@type': 'ListItem', position: 2, name: c.nm, ...(abs(pagePath) ? { item: abs(pagePath) } : {}) }
    ] }
  ];
  let content;
  if (doc) {
    content = (doc.after.length ? `<section class="content-section article-section result-note-section">${doc.after.map(blockHtml).join('')}</section>` : '') +
      doc.sections.filter(s => s !== faqSection).map(s => `<section class="content-section article-section"><h2>${inline(s.h)}</h2>${s.blocks.map(blockHtml).join('')}</section>`).join('\n');
  } else {
    const how = `<section class="content-section how-section"><div class="section-kicker">Getting started</div><h2>How to use this calculator</h2><ol class="how-list">${c.how.map((s, i) => `<li><span>${String(i + 1).padStart(2, '0')}</span><p>${esc(s)}</p></li>`).join('')}</ol></section>`;
    content = `${how}<section class="content-section article-section">${(c.a || []).map(article).join('')}</section>`;
  }
  const faqHtml = `<section class="content-section faq-section"><h2>${doc && faqSection ? inline(faqSection.h) : 'Common questions'}</h2><div class="faq-list">${faqs.map(f => `<details class="faq-item"><summary>${esc(f.q)}<span aria-hidden="true">+</span></summary>${f.aHtml}</details>`).join('')}</div></section>`;
  const more = `<section class="more-section"><div><div class="section-kicker">Keep planning</div><h2>More useful calculators</h2><p>Other tools that go well with this one.</p></div><div class="more-grid">${related[k].map(x => `<a href="${root}${slug[x]}/"><span aria-hidden="true">${icon[x]}</span><b>${esc(C[x].nm)}</b></a>`).join('')}<a href="${root}#tools" class="more-all"><span aria-hidden="true">＋</span><b>View all tools</b></a></div></section>`;
  const h1 = doc ? doc.title : c.h;
  const lead = doc ? doc.intro.map(b => b.s || '').join(' ') : c.ld;
  return `<!doctype html><html lang="en-AU">${head({ title: c.t, desc: c.md, canonical: abs(pagePath), root, schema: pageSchema })}<body class="calculator-page" data-calc="${k}">
${header(root, k)}<main id="main" class="page-main">
<div class="breadcrumb"><a href="${root}">All calculators</a><span aria-hidden="true">/</span><span>${esc(c.nm)}</span></div>
<section class="calculator-hero"><div class="eyebrow eyebrow-dark">${esc(category[k])} calculator</div><h1>${esc(h1)}</h1><p>${inline(lead)}</p><div class="hero-pills"><span><i>✓</i> Free to use</span><span><i>✓</i> Instant results</span><span><i>✓</i> Metric units</span></div></section>
${workspace(c)}
${content}
${faqHtml}
${more}
</main>${footer(root)}<script src="${root}js/data.js"></script><script src="${root}js/app.js"></script></body></html>`;
}

// ---------- Trust pages ----------
const assumptions = [
  ['Calculator', 'What it uses'],
  ['Concrete', 'Volume depends on the structure type (slab, footing, post hole, column, wall or steps), plus your waste allowance. A 20 kg bag is assumed to make about 10 litres, a 30 kg bag 15 litres and a 40 kg bag 20 litres, and you can enter your own bag yield. Concrete density defaults to 2.4 tonnes per m³ and can be edited. Ready mix is rounded up to 0.2 m³ steps.'],
  ['Gravel', 'Volume plus a compaction allowance (15% by default). Typical weight per m³: pebbles 1.5 t, crushed rock or blue metal 1.6 t, crusher dust 1.7 t, road base 1.9 t, sand 1.6 t. The density used is shown and can be edited. Bags are calculated from the weight and the bag size you choose.'],
  ['Soil', 'Volume plus a settling allowance (10% by default). Typical weight per m³: topsoil 1.3 t, garden mix 1.1 t, lawn underlay 1.4 t, vegetable garden mix 1.0 t, compost 0.8 t, sandy soil 1.5 t, fill soil 1.6 t. Densities can be edited. The order quantity is rounded up to 0.5 m³ steps.'],
  ['Mulch', 'Volume plus an extra allowance (10% by default). Bags can be 25, 30, 40 or 50 litres or a custom size. Load capacities are typical values for a ute tray and for small, medium and large trailers, and you can edit them.'],
  ['Paint', 'Wall area is each room perimeter times wall height, minus doors and windows. Doors default to 1.6 m² and windows to 1.5 m². Coverage defaults to 12 m² per litre for interior paint and 10 m² per litre for exterior paint, as a general assumption only. Rough surfaces add 10% and porous or unpainted surfaces add 20%. Tin sizes used: 15, 10, 4, 2 and 1 litre.'],
  ['Tile', 'Each tile is measured with its grout gap included. Allowance defaults to 10% for straight lay or brick bond, 15% for diagonal and 30% for herringbone, and can be edited. Adhesive coverage and grout use are optional estimates, and grout is assumed to weigh 1.6 kg per litre.'],
  ['Brick', 'A standard Australian brick is 230 × 110 × 76 mm, a double height brick is 230 × 110 × 162 mm and a besser block is 390 × 190 mm. The mortar joint defaults to 10 mm, which gives about 48.45 standard bricks per m². Custom sizes and joint thickness can be entered. Double skin walls use twice the bricks.'],
  ['Screed', 'Dry materials take up about 30% more space than the finished screed. Cement is counted in 20 kg or 25 kg bags at 1,440 kg per m³, and sand at 1.6 tonnes per m³. Liquid screed and bagged ready mixed screed are calculated by volume or by bag yield.'],
  ['Square metre', 'Area is length × width, or the matching formula for a triangle or circle. One square metre is 10.764 square feet.'],
  ['Cubic metre', 'Volume is length × width × height, or the matching formula for a cylinder. One cubic metre is 1,000 litres.'],
  ['Lineal metre', 'Lineal metres equal the area divided by the cover width, plus your extra allowance. Timber volume conversion divides the volume by the width and the thickness. Board and roll widths are common sizes and can be edited.']
];

const infoPages = [
  {
    slug: 'how-we-calculate', title: `How We Calculate | ${SITE_NAME}`,
    desc: 'The formulas and assumptions behind every Aussie Build Calc calculator, including bag sizes, material weights and coverage rates.',
    h1: 'How we calculate', lead: 'Every calculator uses simple, visible maths. Here are the formulas and typical values behind each one.',
    body: [
      ['The basic approach', 'Most calculators multiply length, width and depth to find a volume in cubic metres. Some then convert that volume into tonnes, bags or boxes using a typical material weight or yield.\nAll measurements are metric. Results are rounded up where you would need to buy whole items, such as bags, tiles or tins.\nWeights, bag yields, coverage rates and allowances are typical starting values. Where the calculator shows one in a box, you can change it to match your supplier specification.'],
      ['Assumptions used', assumptions],
      ['Why your numbers may differ', 'Bag yields, material weights, paint coverage and tile sizes change between brands and suppliers. Wet or compacted materials weigh more. Uneven ground and cutting waste also use extra material.\nAlways check the product label and confirm quantities with your supplier before you order. These calculators are a planning guide only and are not engineering or trade advice.']
    ]
  },
  {
    slug: 'about', title: `About ${SITE_NAME}`,
    desc: 'Aussie Build Calc offers free, simple building, renovation and landscaping calculators in metric units for Australian projects.',
    h1: `About ${SITE_NAME}`, lead: 'Free, simple calculators for building, renovating and landscaping projects in Australia.',
    body: [
      ['What this site is', 'Aussie Build Calc helps you work out how much material a project needs before you buy. It covers concrete, gravel, soil, mulch, paint, tiles, bricks, screed and common area and volume conversions.\nEverything uses metric units and terms that Australian suppliers use, such as road base, crusher dust and blue metal.'],
      ['How the calculators work', 'You enter your measurements and the result updates straight away. Nothing needs to be installed and no account is needed. You can read the formulas and assumptions on the how we calculate page.'],
      ['A guide, not a final order', 'Results are estimates. Product yields, material weights and site conditions vary, so always confirm quantities with your supplier or a qualified tradesperson before you buy.']
    ]
  },
  {
    slug: 'privacy', title: `Privacy | ${SITE_NAME}`,
    desc: 'How Aussie Build Calc handles your information. The calculators run in your browser and do not need an account.',
    h1: 'Privacy', lead: 'A short, plain summary of how this website handles information. Last updated 17 November 2026.',
    body: [
      ['Your calculator entries', 'The calculators run in your web browser. The measurements you type are used to show your result on your own screen. They are not sent to us and we do not store them.'],
      ['Accounts and personal information', 'You do not need an account to use this site, and the calculators do not ask for personal details.'],
      ['Third party services', 'Pages load fonts from Google Fonts, so your browser contacts Google when a page opens. The website host may also keep standard server logs, such as IP addresses and the pages requested, to keep the site running and secure.'],
      ['Advertising, analytics and cookies', 'This version of the website does not include third-party advertising scripts or analytics tools. If advertising or analytics are introduced, this notice will be updated before those services are enabled to identify the providers, explain the data and cookies they may use, and describe any consent choices available to visitors.'],
      ['Changes', 'This policy may be updated when the website or its third-party services change. The date at the top of this page will be revised when material changes are made.']
    ]
  }
];
if (CONTACT_EMAIL) {
  infoPages.push({
    slug: 'contact', title: `Contact | ${SITE_NAME}`,
    desc: 'Contact Aussie Build Calc with questions, corrections or suggestions for new calculators.',
    h1: 'Contact', lead: 'Questions, corrections or ideas for a new calculator are welcome.',
    body: [['Get in touch', `Email us at ${CONTACT_EMAIL}. If you think a number or formula is wrong, tell us which calculator and what values you entered so we can check it.`]]
  });
}

function infoPage(s) {
  const root = '../';
  return `<!doctype html><html lang="en-AU">${head({ title: s.title, desc: s.desc, canonical: abs(`/${s.slug}/`), root, schema: null })}<body class="info-page">
${header(root, 'none')}<main id="main" class="page-main">
<div class="breadcrumb"><a href="${root}">All calculators</a><span aria-hidden="true">/</span><span>${esc(s.h1)}</span></div>
<section class="calculator-hero"><h1>${esc(s.h1)}</h1><p>${esc(s.lead)}</p></section>
<section class="content-section article-section">${s.body.map(article).join('')}</section>
</main>${footer(root)}</body></html>`;
}

// ---------- Write files ----------
fs.writeFileSync(path.join(OUT, 'index.html'), homePage());
const urls = [abs('/')];
keys.forEach(k => {
  const dir = path.join(OUT, slug[k]);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), calculatorPage(k));
  urls.push(abs(`/${slug[k]}/`));
});
infoPages.forEach(s => {
  const dir = path.join(OUT, s.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), infoPage(s));
  urls.push(abs(`/${s.slug}/`));
});
if (!CONTACT_EMAIL) fs.rmSync(path.join(OUT, 'contact'), { recursive: true, force: true });

const sitemapPath = path.join(OUT, 'sitemap.xml');
if (SITE_URL) {
  fs.writeFileSync(sitemapPath,
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${esc(u)}</loc></url>`).join('\n')}\n</urlset>\n`);
} else {
  // Do not publish an empty sitemap that looks valid but contains no URLs.
  fs.rmSync(sitemapPath, { force: true });
}
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n${SITE_URL ? `Sitemap: ${SITE_URL}/sitemap.xml\n` : '# Configure siteUrl and rebuild to publish a sitemap.\n'}`);
const homeHref = SITE_URL ? `${SITE_URL}/` : '/';
fs.writeFileSync(path.join(OUT, '404.html'), `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta name="theme-color" content="#143d32"><title>Page not found | ${SITE_NAME}</title><style>*{box-sizing:border-box}body{margin:0;padding:24px;min-height:100vh;display:grid;place-items:center;background:#f5f7f3;color:#172923;font:16px/1.6 system-ui,sans-serif}main{width:min(560px,100%);padding:42px 32px;border:1px solid #e2e9e3;border-radius:22px;background:#fff;text-align:center;box-shadow:0 18px 50px rgba(21,55,43,.08)}.code{color:#1f765c;font-size:64px;font-weight:800;line-height:1}h1{margin:16px 0 8px;font-size:27px}p{color:#718078}.button{display:inline-block;margin-top:14px;padding:12px 18px;border-radius:10px;background:#143d32;color:white;text-decoration:none;font-weight:700}</style></head><body><main><div class="code">404</div><h1>That page could not be found.</h1><p>The link may be old or the address may have a typo.</p><a class="button" href="${homeHref}">Back to all calculators</a></main></body></html>\n`);
if (!SITE_URL) console.log('SEO setup is incomplete: pages are marked noindex and no sitemap is published. Set siteUrl in site.config.json (or SITE_URL in the build environment) and rebuild before launch.');
if (!CONTACT_EMAIL) console.log('contactEmail is empty: the optional Contact page is not generated. Add an address you control to site.config.json and rebuild.');
console.log(`Built the home page, ${keys.length} calculator pages and ${infoPages.length} information pages.`);
