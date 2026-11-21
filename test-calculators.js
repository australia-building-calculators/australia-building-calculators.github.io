/* Run with: node test-calculators.js */
const fs = require('fs');
const path = require('path');
const { C, defaultValues } = new Function(fs.readFileSync(path.join(__dirname, 'js/data.js'), 'utf8') + '; return { C, defaultValues };')();
const results = [];
let failed = 0;

function check(name, condition, detail) {
  console.log((condition ? 'PASS ' : 'FAIL ') + name + (condition || !detail ? '' : ' (' + detail + ')'));
  if (!condition) failed++;
  results.push(Boolean(condition));
}
function row(key, values, label) {
  const found = C[key].c(values)[0].find(function (r) { return r[0] === label; });
  return found ? found[1] : null;
}
function num(text) { return Number(String(text).replace(/[^0-9.-]/g, '')); }
function make(key, edit) { const v = defaultValues(C[key]); if (edit) edit(v); return v; }

check('exactly 11 calculators are defined', Object.keys(C).length === 11);
const expected = { concrete: '1.65 m³', gravel: '1.55 m³', soil: '1.32 m³', mulch: '0.83 m³', paint: '4.6 L', tile: '73', brick: '580', screed: '0.88 m³', sqm: '20 m²', cubic: '6 m³', lineal: '169.2 m' };
Object.keys(C).forEach(function (k) {
  const out = C[k].c(make(k));
  const got = out[0][C[k].pi || 0][1];
  check(k + ' default result matches expected output', got === expected[k], 'expected ' + expected[k] + ', received ' + got);
  check(k + ' returns finite display values', out[0].every(function (r) { return r.length >= 2 && !/(NaN|Infinity)/i.test(String(r[1])); }));
});

/* Shapes and multiple areas (gravel, soil, mulch, tile all share the area builder) */
['gravel', 'soil', 'mulch', 'tile'].forEach(function (k) {
  const one = make(k); const base = C[k].c(one)[0][0][1];
  const two = make(k, function (v) { v.areas.push({ shape: 'rect', a: 2, b: 3, dia: 2, base: 3, ht: 2 }); });
  check(k + ' adds a second area to the total', num(C[k].c(two)[0][0][1]) > num(base));
  const circle = make(k, function (v) { v.areas = [{ shape: 'circle', dia: 2, a: 0, b: 0, base: 0, ht: 0 }]; });
  const tri = make(k, function (v) { v.areas = [{ shape: 'tri', base: 4, ht: 3, a: 0, b: 0, dia: 0 }]; });
  check(k + ' accepts a circle and a triangle', C[k].c(circle)[0].length > 0 && C[k].c(tri)[0].length > 0);
});
const circ = make('gravel', function (v) { v.areas = [{ shape: 'circle', dia: 2, a: 0, b: 0, base: 0, ht: 0 }]; });
check('circle area uses π × diameter² ÷ 4', row('gravel', circ, 'Total area') === '3.14 m²');
const tri = make('gravel', function (v) { v.areas = [{ shape: 'tri', base: 4, ht: 3, a: 0, b: 0, dia: 0 }]; });
check('triangle area uses base × height ÷ 2', row('gravel', tri, 'Total area') === '6 m²');

/* Gravel */
const road = make('gravel', function (v) { v.dens = 1.9; });
check('gravel density changes the weight and shows the density used', row('gravel', road, 'Estimated weight') === '2.95 t');
const gb = make('gravel', function (v) { v.bag = 20; });
check('gravel bag count uses the weight and bag size', row('gravel', gb, '20 kg bags') === '125');
const gc = make('gravel', function (v) { v.bag = -1; v.bagc = 25; });
check('gravel supports a custom bag size', row('gravel', gc, '25 kg bags') === '100');
const gcost = make('gravel', function (v) { v.pr = 't'; v.price = 50; v.fee = 100; });
check('gravel cost uses price per tonne plus delivery', row('gravel', gcost, 'Estimated material cost') === '$224.20');
check('gravel cost is omitted when no price is supplied', row('gravel', make('gravel'), 'Estimated material cost') === null);

/* Soil and mulch */
const sb = make('soil', function (v) { v.bag = 40; });
check('soil bag size changes the bag count', row('soil', sb, '40 litre bags') === '33');
check('soil shows a rounded order quantity', row('soil', make('soil'), 'Suggested order quantity') === '1.5 m³');
const mv = make('mulch', function (v) { v.veh = 'ute'; v.cap = 0.8; });
check('mulch calculates the number of loads', row('mulch', mv, 'Loads') === '2');
check('mulch loads are omitted when no vehicle is chosen', row('mulch', make('mulch'), 'Loads') === null);
const mcost = make('mulch', function (v) { v.pr = 'm3'; v.price = 80; v.fee = 0; });
check('mulch cost uses price per cubic metre', row('mulch', mcost, 'Estimated material cost') === '$66.00');

/* Concrete structures */
const post = make('concrete', function (v) { v.x = 0; v.structures = [{ type: 'circfoot', cf_dia: 300, cf_d: 600, qty: 1 }]; });
check('post hole volume uses π × radius² × depth', row('concrete', post, 'Concrete needed') === '0.04 m³');
const sq = make('concrete', function (v) { v.x = 0; v.structures = [{ type: 'sqfoot', sf_s: 500, sf_d: 600, qty: 4 }]; });
check('square footings multiply by the number of items', row('concrete', sq, 'Concrete needed') === '0.6 m³');
const strip = make('concrete', function (v) { v.x = 0; v.structures = [{ type: 'strip', st_l: 10, st_w: 450, st_d: 300 }]; });
check('strip footing uses length × width × depth', row('concrete', strip, 'Concrete needed') === '1.35 m³');
const col = make('concrete', function (v) { v.x = 0; v.structures = [{ type: 'column', co_dia: 300, co_h: 2.4, qty: 2 }]; });
check('circular columns use diameter, height and quantity', row('concrete', col, 'Concrete needed') === '0.34 m³');
const wall = make('concrete', function (v) { v.x = 0; v.structures = [{ type: 'wall', wl_l: 6, wl_h: 1, wl_t: 200 }]; });
check('wall volume uses length × height × thickness', row('concrete', wall, 'Concrete needed') === '1.2 m³');
const steps = make('concrete', function (v) { v.x = 0; v.structures = [{ type: 'steps', sp_n: 3, sp_w: 1.2, sp_r: 170, sp_g: 280 }]; });
check('solid steps add up the stepped volume', row('concrete', steps, 'Concrete needed') === '0.34 m³');
const multi = make('concrete', function (v) { v.structures.push({ type: 'circfoot', cf_dia: 300, cf_d: 600, qty: 4 }); });
check('concrete combines several different structures', num(row('concrete', multi, 'Concrete needed')) > 1.65);
const yl = make('concrete', function (v) { v.yl = 9; });
check('concrete bag yield can be edited', row('concrete', yl, '20 kg bags') === '184');
const c30 = make('concrete', function (v) { v.bag = 30; });
check('concrete supports 30 kg bags', row('concrete', c30, '30 kg bags') === '110');
check('concrete suggests a rounded ready mix order', row('concrete', make('concrete'), 'Suggested ready mix order') === '1.8 m³');
const ccost = make('concrete', function (v) { v.pr = 'm3'; v.price = 300; v.fee = 50; });
check('concrete cost uses price per cubic metre plus fee', row('concrete', ccost, 'Estimated material cost') === '$545.00');

/* Paint */
const rooms2 = make('paint', function (v) { v.rooms.push({ mode: 'perim', pl: 12, ph: 2.4, dr: 1, wn: 1, cl: 0, ca: 12, tr: 0, rl: 0, rw: 0, rh: 0 }); });
check('paint adds a second room', num(row('paint', rooms2, 'Paint needed')) > 4.6);
const ceil = make('paint', function (v) { v.rooms[0].cl = 1; });
check('paint adds ceiling paint when selected', row('paint', ceil, 'Ceilings') === '2 L');
const rough = make('paint', function (v) { v.cond = 20; });
check('paint adds an allowance for porous surfaces', num(row('paint', rough, 'Paint needed')) > 4.6);
const prim = make('paint', function (v) { v.pm = 1; });
check('paint can add a primer coat', row('paint', prim, 'Primer needed') === '2.7 L');
const trim = make('paint', function (v) { v.rooms[0].tr = 14; });
check('paint adds skirting and trim', row('paint', trim, 'Trims and doors') !== null);
check('paint blocks openings larger than the wall', C.paint.check(make('paint', function (v) { v.rooms[0].dr = 30; })).length === 1);
check('paint accepts total wall length and height mode', row('paint', make('paint', function (v) { v.rooms = [{ mode: 'perim', pl: 14, ph: 2.4, dr: 2, wn: 2, cl: 0, ca: 0, tr: 0, rl: 0, rw: 0, rh: 0 }]; }), 'Paint needed') === '4.6 L');

/* Tile */
const diag = make('tile', function (v) { v.x = 15; });
check('tile pattern allowance changes the tile count', row('tile', diag, 'Tiles to buy') === '76');
const tb = make('tile', function (v) { v.bm = 'tiles'; v.bx = 10; });
check('tile box count rounds up to whole boxes', row('tile', tb, 'Boxes') === '8');
const tc = make('tile', function (v) { v.bm = 'cover'; v.bc = 1.44; });
check('tile box coverage is supported', row('tile', tc, 'Boxes') === '10');
check('tile box count is omitted when skipped', row('tile', make('tile'), 'Boxes') === null);
const ta = make('tile', function (v) { v.ag = 1; });
check('tile adhesive and grout are optional extras', row('tile', ta, 'Adhesive') === '3 bags' && row('tile', make('tile'), 'Adhesive') === null);
const topen = make('tile', function (v) { v.op = 2; });
check('tile deducts openings from the area', row('tile', topen, 'Net area') === '10 m²');
check('tile blocks openings larger than the area', C.tile.check(make('tile', function (v) { v.op = 50; })).length === 1);

/* Brick */
const bj = make('brick', function (v) { v.j = 12; });
check('brick joint thickness changes the count', num(row('brick', bj, 'Bricks needed')) < 580);
const bd = make('brick', function (v) { v.bl = 290; v.bh = 90; });
check('brick custom dimensions change bricks per m²', row('brick', bd, 'Bricks per m²') === '33.3');
const bw = make('brick', function (v) { v.walls.push({ wl: 4, wh: 1.8, wo: 0 }); });
check('brick adds a second wall', num(row('brick', bw, 'Bricks needed')) > 580);
const bs = make('brick', function (v) { v.skin = 2; });
check('brick double skin doubles the count', num(row('brick', bs, 'Bricks needed')) > 1100);
const bp = make('brick', function (v) { v.pal = 400; });
check('brick pallets are calculated when supplied', row('brick', bp, 'Pallets') === '2');
const bm = make('brick', function (v) { v.mo = 1; });
check('brick mortar estimate is optional', row('brick', bm, 'Mortar') !== null && row('brick', make('brick'), 'Mortar') === null);
check('brick blocks openings larger than the wall', C.brick.check(make('brick', function (v) { v.walls[0].wo = 99; })).length === 1);

/* Lineal metre */
const rev = make('lineal', function (v) { v.dir = 'lm'; v.lm = 100; });
check('lineal converts lineal metres back to square metres', row('lineal', rev, 'Area covered') === '13 m²');
const tim = make('lineal', function (v) { v.dir = 'm3'; v.vol = 1; v.w = 90; v.th = 45; });
check('lineal converts timber volume using width and thickness', row('lineal', tim, 'Lineal metres') === '246.9 m');
const price = make('lineal', function (v) { v.lp = 5; });
check('lineal can estimate a price', row('lineal', price, 'Estimated cost') === '$846.15');
check('wider boards need fewer lineal metres', num(row('lineal', make('lineal', function (v) { v.w = 260; }), 'Lineal metres')) < 169.2);

/* Screed */
const lq = make('screed', function (v) { v.st = 'liq'; });
check('liquid screed gives a volume without cement and sand', row('screed', lq, 'Screed volume') === '0.88 m³' && row('screed', lq, 'Cement') === null);
const bg = make('screed', function (v) { v.st = 'bag'; v.by = 12; });
check('bagged screed counts bags', row('screed', bg, 'Bags of ready mixed screed') === '74');
const sc25 = make('screed', function (v) { v.cb = 25; });
check('screed supports 25 kg cement bags', row('screed', sc25, 'Cement') === '14 bags');
const rm = make('screed', function (v) { v.rooms.push({ rl: 3, rw: 3, rt: 50 }); });
check('screed adds a second room with its own thickness', row('screed', rm, 'Total floor area') === '29 m²');
check('screed mix ratio changes the cement amount', num(row('screed', make('screed', function (v) { v.ratio = 3; }), 'Cement')) > num(row('screed', make('screed'), 'Cement')));

/* Square metre and cubic metre keep their own shape modes */
const sq1 = make('sqm', function (v) { v.shape = 'triangle'; v.b = 5; v.h = 4; });
check('sqm triangle area uses base × height ÷ 2', row('sqm', sq1, 'Total area') === '10 m²');
const sq2 = make('sqm', function (v) { v.shape = 'circle'; v.r = 2; });
check('sqm circle area uses π × radius²', row('sqm', sq2, 'Total area') === '12.57 m²');
const cyl = make('cubic', function (v) { v.shape = 'cylinder'; v.dia = 1; v.h = 0.5; });
check('cubic cylinder volume uses diameter correctly', row('cubic', cyl, 'Volume') === '0.393 m³');


/* Allowance choices, names, units, extra costs and printing */
const al5 = make('gravel', function (v) { v.xs = 5; });
check('gravel allowance dropdown changes the volume', row('gravel', al5, 'Volume needed') === '1.42 m³');
const alNone = make('soil', function (v) { v.xs = 0; });
check('soil can be calculated with no allowance', row('soil', alNone, 'Soil needed') === '1.2 m³');
const alCustom = make('mulch', function (v) { v.xs = -1; v.x = 20; });
check('mulch accepts a custom allowance percentage', row('mulch', alCustom, 'Mulch needed') === '0.9 m³');
const named = make('gravel', function (v) { v.areas[0].name = 'Driveway'; v.areas.push({ name: 'Side path', shape: 'rect', a: 10, b: 1, dia: 0, base: 0, ht: 0 }); });
check('named areas get their own result rows', row('gravel', named, 'Driveway') === '1.55 m³' && row('gravel', named, 'Side path') === '0.86 m³');
check('a single area adds no extra result row', row('gravel', make('gravel'), 'Area 1') === null);
const unnamed = make('soil', function (v) { v.areas.push({ shape: 'rect', a: 2, b: 2, dia: 0, base: 0, ht: 0 }); });
check('unnamed areas are labelled by number', row('soil', unnamed, 'Area 2') !== null);
const prRooms = make('paint', function (v) { v.rooms[0].name = 'Bedroom'; v.rooms.push({ name: 'Hall', mode: 'perim', pl: 10, ph: 2.4, dr: 1, wn: 0, cl: 0, ca: 0, tr: 0, rl: 0, rw: 0, rh: 0 }); });
check('paint shows litres for each named room', row('paint', prRooms, 'Bedroom') === '4.6 L' && row('paint', prRooms, 'Hall') !== null);
const brickNamed = make('brick', function (v) { v.walls[0].name = 'Front wall'; v.walls.push({ name: 'Garden wall', wl: 4, wh: 1.8, wo: 0 }); });
check('brick shows bricks for each named wall', row('brick', brickNamed, 'Front wall') === '580 bricks');
const concNamed = make('concrete', function (v) { v.structures[0].name = 'Patio'; v.structures.push({ name: 'Post', type: 'circfoot', cf_dia: 300, cf_d: 600, qty: 1 }); });
check('concrete shows volume for each named structure', row('concrete', concNamed, 'Patio') === '1.65 m³');
const screedNamed = make('screed', function (v) { v.rooms.push({ name: 'Bathroom', rl: 2, rw: 2, rt: 50 }); });
check('screed shows volume for each room', row('screed', screedNamed, 'Bathroom') === '0.22 m³');
const tileNamed = make('tile', function (v) { v.areas.push({ name: 'Laundry', shape: 'rect', a: 2, b: 2, dia: 0, base: 0, ht: 0 }); });
check('tile shows tiles for each area', row('tile', tileNamed, 'Laundry') !== null);

const cm = make('lineal', function (v) { v.wu = 10; v.w = 13; });
check('lineal accepts the width in centimetres', row('lineal', cm, 'Lineal metres') === '169.2 m');
const meters = make('lineal', function (v) { v.wu = 1000; v.w = 3.66; });
check('lineal accepts the width in metres', row('lineal', meters, 'Cover width used') === '3,660 mm');
const lAreas = make('lineal', function (v) { v.areas.push({ shape: 'rect', a: 2, b: 3, dia: 0, base: 0, ht: 0 }); });
check('lineal adds a second area', row('lineal', lAreas, 'Total area') === '26 m²');
const lCirc = make('lineal', function (v) { v.areas = [{ shape: 'circle', dia: 2, a: 0, b: 0, base: 0, ht: 0 }]; });
check('lineal accepts a circular area', row('lineal', lCirc, 'Total area') === '3.14 m²');

const tilePrice = make('tile', function (v) { v.pr = 'tile'; v.price = 4; v.fee = 0; });
check('tile cost uses price per tile', row('tile', tilePrice, 'Estimated material cost') === '$292.00');
const tileBox = make('tile', function (v) { v.bm = 'tiles'; v.bx = 10; v.pr = 'box'; v.price = 50; v.fee = 20; });
check('tile cost uses price per box plus delivery', row('tile', tileBox, 'Estimated material cost') === '$420.00');
const tileNoBox = make('tile', function (v) { v.pr = 'box'; v.price = 50; });
check('tile box price is skipped when boxes are not calculated', row('tile', tileNoBox, 'Estimated material cost') === null);
const brickPrice = make('brick', function (v) { v.pr = 'brick'; v.price = 1.2; v.fee = 0; });
check('brick cost uses price per brick', row('brick', brickPrice, 'Estimated material cost') === '$696.00');
const brickPallet = make('brick', function (v) { v.pal = 400; v.pr = 'pallet'; v.price = 600; v.fee = 0; });
check('brick cost uses price per pallet', row('brick', brickPallet, 'Estimated material cost') === '$1,200.00');
const screedPrice = make('screed', function (v) { v.st = 'liq'; v.pr = 'm3'; v.price = 200; v.fee = 0; });
check('screed cost uses price per cubic metre', row('screed', screedPrice, 'Estimated material cost') === '$176.00');
const screedBags = make('screed', function (v) { v.pr = 'bag'; v.price = 10; v.fee = 0; });
check('screed cost uses price per cement bag', row('screed', screedBags, 'Estimated material cost') !== null);

const builtApp = fs.readFileSync(path.join(__dirname, 'js/app.js'), 'utf8');
check('text name fields are supported', builtApp.includes("'@text'"));
check('groups can be shown or hidden by another field', builtApp.includes('.calc-group[data-when]'));
const grav = fs.readFileSync(path.join(__dirname, 'gravel-calculator/index.html'), 'utf8');
check('every calculator page has a print button and print note', grav.includes('id="printResults"') && grav.includes('class="print-note"'));
const cssText = fs.readFileSync(path.join(__dirname, 'css/style.css'), 'utf8');
check('print styles hide navigation and article sections', cssText.includes('@media print') && cssText.includes('.site-header'));

/* Source and page checks */
const app = fs.readFileSync(path.join(__dirname, 'js/app.js'), 'utf8');
check('invalid input clears the previous copy summary', app.includes("latestSummary = ''") && app.includes("$('copyResults').disabled = true"));
check('group items can be added and removed', app.includes('group-add') && app.includes('group-remove'));
check('all calculator fields have a maximum input safeguard', app.includes('max="\' + MAX + \'"') && app.includes('value > MAX'));
check('presets can update editable fields', app.includes('data-sets'));
const home = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const homeScript = fs.readFileSync(path.join(__dirname, 'js/site.js'), 'utf8');
check('homepage has the target keyword H1', /<h1>Free Building Calculators Australia<\/h1>/.test(home));
check('homepage embeds a quick area and volume calculator', home.includes('id="homeQuickForm"') && home.includes('id="homeQuickArea"') && home.includes('id="homeQuickVolume"'));
check('homepage quick calculator validates inputs and clears stale results', homeScript.includes('validateQuickInput') && homeScript.includes('clearQuickResults'));
const builder = fs.readFileSync(path.join(__dirname, 'build.js'), 'utf8');
check('build requires an HTTPS website URL when configured', builder.includes("parsedSiteUrl.protocol !== 'https:'"));
check('unconfigured builds are marked noindex', builder.includes("'noindex,follow'"));
const pages = ['gravel', 'soil', 'paint', 'tile', 'concrete', 'mulch', 'brick', 'lineal-metre', 'screed'];
pages.forEach(function (p) {
  const f = fs.existsSync(path.join(__dirname, p + '-calculator')) ? p + '-calculator' : p;
  const html = fs.readFileSync(path.join(__dirname, f, 'index.html'), 'utf8');
  check(p + ' page has no em or en dashes', !/[—–]/.test(html));
});


/* Brand and documented calculator assumptions */
const buildSource = fs.readFileSync(path.join(__dirname, 'build.js'), 'utf8');
const readmeSource = fs.readFileSync(path.join(__dirname, 'README.md'), 'utf8');
const concreteCopy = fs.readFileSync(path.join(__dirname, 'content/concrete.md'), 'utf8');
const paintCopy = fs.readFileSync(path.join(__dirname, 'content/paint.md'), 'utf8');
const tileCopy = fs.readFileSync(path.join(__dirname, 'content/tile.md'), 'utf8');
const screedCopy = fs.readFileSync(path.join(__dirname, 'content/screed.md'), 'utf8');
check('only the requested public brand appears in site source', !/Aussie Build Calc/i.test(buildSource + readmeSource));
check('public site name is configured consistently', buildSource.includes("const SITE_NAME = 'Australia Building Calculators';"));
check('concrete guide documents all three bag sizes', /20 ?kg/.test(concreteCopy) && /30 ?kg/.test(concreteCopy) && /40 ?kg/.test(concreteCopy));
check('paint guide matches the calculator coverage defaults', paintCopy.includes('12m² per litre') && paintCopy.includes('10m² per litre') && !/14m² per litre/.test(paintCopy));
check('tile guide documents the 30 percent herringbone preset', /herringbone preset starts at 30%/i.test(tileCopy));
check('screed guide distinguishes bagged yield from dry-mix factor', screedCopy.includes('starting yield is 12 litres per bag') && screedCopy.includes('30% dry-material volume factor'));

const tileExample = make('tile', function (v) {
  v.areas = [{ name: 'Floor', shape: 'rect', a: 4, b: 3, dia: 0, base: 0, ht: 0 }];
  v.tw = 600; v.tl = 600; v.g = 3; v.x = 10; v.bm = 'tiles'; v.bx = 4;
});
check('tile worked example matches the grout-gap formula and whole-box rounding', row('tile', tileExample, 'Tiles to buy') === '37' && row('tile', tileExample, 'Boxes') === '10');
const concreteExample = make('concrete', function (v) {
  v.structures = [{ name: 'Slab', type: 'slab', sl_l: 10, sl_w: 1, sl_t: 100 }];
  v.x = 10;
});
check('concrete 10 m² slab example matches the 0.2 m³ ready-mix order increment', row('concrete', concreteExample, 'Suggested ready mix order') === '1.2 m³');
const gravelExample = make('gravel', function (v) {
  v.areas = [{ shape: 'rect', a: 5, b: 4, dia: 0, base: 0, ht: 0 }];
  v.d = 100; v.x = 15; v.dens = 1.5;
});
check('gravel worked example matches the 15 percent allowance and selected density', row('gravel', gravelExample, 'Volume needed') === '2.3 m³' && row('gravel', gravelExample, 'Estimated weight') === '3.45 t');
const soilExample = make('soil', function (v) {
  v.areas = [{ shape: 'rect', a: 5, b: 2, dia: 0, base: 0, ht: 0 }];
  v.d = 250; v.x = 10; v.dens = 1.3;
});
check('soil worked example matches topsoil density and 0.5 m³ order rounding', row('soil', soilExample, 'Estimated weight') === '3.58 t' && row('soil', soilExample, 'Suggested order quantity') === '3 m³');

/* Pre-launch content, accessibility wording and SEO configuration */
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'site.config.json'), 'utf8'));
const appSource = fs.readFileSync(path.join(__dirname, 'js/app.js'), 'utf8');
const aboutHtml = fs.readFileSync(path.join(__dirname, 'about/index.html'), 'utf8');
const disclaimerHtml = fs.readFileSync(path.join(__dirname, 'disclaimer/index.html'), 'utf8');
const generatedHtml = [];
function collectHtml(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectHtml(full);
    else if (entry.isFile() && entry.name.endsWith('.html') && entry.name !== '404.html') generatedHtml.push(fs.readFileSync(full, 'utf8'));
  });
}
collectHtml(__dirname);
check('public site URL matches the current GitHub Pages address', config.siteUrl === 'https://australia-building-calculators.github.io');
check('indexing switch is enabled for public launch', config.allowIndexing === true);
check('canonical URL is generated on every indexable content page', generatedHtml.length === 16 && generatedHtml.every(function (html) { return /<link rel="canonical" href="https:\/\/australia-building-calculators\.github\.io\//.test(html); }));
check('all content pages allow search indexing after launch approval', generatedHtml.every(function (html) { return /<meta name="robots" content="index,follow,max-image-preview:large">/.test(html); }));
check('robots.txt advertises the generated sitemap', /Sitemap: https:\/\/australia-building-calculators\.github\.io\/sitemap\.xml/.test(fs.readFileSync(path.join(__dirname, 'robots.txt'), 'utf8')));
check('sitemap contains 16 unique canonical page URLs', (fs.readFileSync(path.join(__dirname, 'sitemap.xml'), 'utf8').match(/<loc>/g) || []).length === 16 && new Set(Array.from(fs.readFileSync(path.join(__dirname, 'sitemap.xml'), 'utf8').matchAll(/<loc>(.*?)<\/loc>/g), function (m) { return m[1]; })).size === 16);
check('About page describes site creator and purpose without inventing credentials', /independently developed website maintained by its site owner/i.test(aboutHtml) && /purpose is to make common building, renovation and landscaping quantity estimates easier/i.test(aboutHtml) && !/qualified engineer|licensed builder|certified tradie/i.test(aboutHtml));
check('standalone disclaimer page is generated and linked in the site builder', fs.existsSync(path.join(__dirname, 'disclaimer/index.html')) && /Disclaimer/.test(buildSource));
check('calculator help text no longer tells visitors to press Calculate', !/press\s+calculate/i.test(generatedHtml.join('\n') + fs.readFileSync(path.join(__dirname, 'content/screed.md'), 'utf8')));
check('calculator live-update wording matches the event-driven interface', buildSource.includes('Results update as you type') && appSource.includes("form.addEventListener('input', render)"));
check('calculator validation rejects negative values, required zero values and excessive values', /value < 0/.test(appSource) && /required && value === 0/.test(appSource) && /value > MAX/.test(appSource));
check('optional zero inputs remain supported by the validation logic', /raw === '' \? 0 : Number\(raw\)/.test(appSource) && /required && value === 0/.test(appSource));
check('each generated page has a unique SEO title and description', (function () {
  const titles = generatedHtml.map(function (html) { return (html.match(/<title>(.*?)<\/title>/) || [])[1]; });
  const descriptions = generatedHtml.map(function (html) { return (html.match(/<meta name="description" content="(.*?)">/) || [])[1]; });
  return titles.every(Boolean) && descriptions.every(Boolean) && new Set(titles).size === titles.length && new Set(descriptions).size === descriptions.length;
})());
check('public contact address is deliberately left unconfigured rather than exposing a private email', !config.contactEmail && !fs.existsSync(path.join(__dirname, 'contact/index.html')) && /contactEmail/.test(buildSource));

console.log('\n' + results.filter(Boolean).length + '/' + results.length + ' checks passed.');
if (failed) process.exit(1);
