/* Run with: node test-calculators.js */
const fs = require('fs');
const path = require('path');
const C = new Function(fs.readFileSync(path.join(__dirname, 'js/data.js'), 'utf8') + '; return C;')();
const results = [];
let failed = 0;

function check(name, condition, detail) {
  const line = (condition ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : '');
  console.log(line);
  if (!condition) failed++;
  results.push(Boolean(condition));
}
function defaults(calculator) {
  const values = {};
  calculator.f.forEach(function (field) {
    const raw = Array.isArray(field[2]) ? String(field[2][field[3]][1]) : String(field[3]);
    const numeric = Number(raw);
    values[field[0]] = raw !== '' && Number.isFinite(numeric) ? numeric : raw;
  });
  return values;
}
function rowValue(calculator, values, label) {
  const output = calculator.c(values);
  const row = output[0].find(function (item) { return item[0] === label; });
  return row ? row[1] : null;
}
function numberFrom(text) {
  return Number(String(text).replace(/[^0-9.-]/g, ''));
}

check('exactly 11 calculators are defined', Object.keys(C).length === 11, Object.keys(C).join(', '));
const expectedDefaults = {
  concrete: '1.65 m³', gravel: '1.55 m³', soil: '1.32 m³', mulch: '0.83 m³',
  paint: '4.6 L', tile: '73', brick: '580', screed: '0.88 m³',
  sqm: '20 m²', cubic: '6 m³', lineal: '169.2 m'
};
Object.keys(C).forEach(function (key) {
  const output = C[key].c(defaults(C[key]));
  check(key + ' default result matches expected output', output[0][C[key].pi || 0][1] === expectedDefaults[key],
    'expected ' + expectedDefaults[key] + ', received ' + output[0][C[key].pi || 0][1]);
  check(key + ' returns finite display values', output[0].every(function (row) {
    return row.length >= 2 && !/(NaN|Infinity|-Infinity)/i.test(String(row[1]));
  }));
});

const secondAreaCases = {
  concrete: { l2: 2, w2: 3, expected: '2.31 m³' },
  gravel: { l2: 2, w2: 3, expected: '2.07 m³' },
  soil: { l2: 2, w2: 2, expected: '1.98 m³' },
  mulch: { l2: 2, w2: 2, expected: '1.16 m³' },
  tile: { l2: 2, w2: 3, expected: '109' },
  sqm: { l2: 2, w2: 3, expected: '26 m²' }
};
Object.keys(secondAreaCases).forEach(function (key) {
  const values = defaults(C[key]);
  const test = secondAreaCases[key];
  values.l2 = test.l2;
  values.w2 = test.w2;
  const actual = C[key].c(values)[0][0][1];
  check(key + ' combines a second rectangular section', actual === test.expected,
    'expected ' + test.expected + ', received ' + actual);
});

const triangle = defaults(C.sqm);
triangle.shape = 'triangle'; triangle.b = 5; triangle.h = 4;
check('triangle area uses base × height ÷ 2', rowValue(C.sqm, triangle, 'Total area') === '10 m²');
const circle = defaults(C.sqm);
circle.shape = 'circle'; circle.r = 2;
check('circle area uses π × radius²', rowValue(C.sqm, circle, 'Total area') === '12.57 m²');
const cylinder = defaults(C.cubic);
cylinder.shape = 'cylinder'; cylinder.dia = 1; cylinder.h = 0.5;
check('cylinder volume uses entered diameter correctly', rowValue(C.cubic, cylinder, 'Volume') === '0.393 m³');

const noWaste = defaults(C.concrete); noWaste.x = 0;
check('zero concrete waste returns base volume', rowValue(C.concrete, noWaste, 'Concrete needed') === '1.5 m³');
const roadBase = defaults(C.gravel); roadBase.k = 1.9;
check('gravel material selection changes calculated weight', numberFrom(rowValue(C.gravel, roadBase, 'Weight')) > numberFrom(rowValue(C.gravel, defaults(C.gravel), 'Weight')));
const compost = defaults(C.soil); compost.k = 0.8;
check('soil material selection changes calculated weight', numberFrom(rowValue(C.soil, compost, 'Weight')) < numberFrom(rowValue(C.soil, defaults(C.soil), 'Weight')));

const noOpenings = defaults(C.paint); noOpenings.dr = 0; noOpenings.wn = 0;
check('paint estimate increases when no door or window area is deducted', numberFrom(rowValue(C.paint, noOpenings, 'Paintable area')) > numberFrom(rowValue(C.paint, defaults(C.paint), 'Paintable area')));
const extraCoat = defaults(C.paint); extraCoat.k = 3;
check('paint estimate increases with an additional coat', numberFrom(rowValue(C.paint, extraCoat, 'Paint needed')) > numberFrom(rowValue(C.paint, defaults(C.paint), 'Paint needed')));

const boxedTiles = defaults(C.tile); boxedTiles.bx = 10;
check('tile box count rounds up to whole boxes', rowValue(C.tile, boxedTiles, 'Boxes') === '8');
const noBoxes = defaults(C.tile);
check('tile box count is omitted when skipped', rowValue(C.tile, noBoxes, 'Boxes') === null);

const threeToOne = defaults(C.screed); threeToOne.k = 3;
check('screed mix ratio changes cement requirement', numberFrom(rowValue(C.screed, threeToOne, 'Cement')) > numberFrom(rowValue(C.screed, defaults(C.screed), 'Cement')));
const widerBoard = defaults(C.lineal); widerBoard.w = 260;
check('wider boards require fewer lineal metres', numberFrom(rowValue(C.lineal, widerBoard, 'Lineal metres')) < numberFrom(rowValue(C.lineal, defaults(C.lineal), 'Lineal metres')));

const app = fs.readFileSync(path.join(__dirname, 'js/app.js'), 'utf8');
check('invalid input clears the previous copy summary', app.includes("latestSummary = ''") && app.includes("$('copyResults').disabled = true"));
check('tile boxes require whole numbers', /integerFields\s*=\s*\{[^}]*bx:\s*true/.test(app));
check('door and window counts require whole numbers', /integerFields\s*=\s*\{[^}]*dr:\s*true[^}]*wn:\s*true/.test(app));
check('second rectangular section must have both dimensions', app.includes('Enter both dimensions for the second section'));
check('paint openings cannot exceed the wall area', app.includes('Door and window areas exceed the wall area'));
check('brick openings cannot exceed the wall area', app.includes('Opening area exceeds the wall area'));
check('all calculator fields have a maximum input safeguard', app.includes('max="100000000"') && app.includes('value > 100000000'));

const home = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const homeScript = fs.readFileSync(path.join(__dirname, 'js/site.js'), 'utf8');
check('homepage has the target keyword H1', /<h1>Free Building Calculators Australia<\/h1>/.test(home));
check('homepage embeds a quick area and volume calculator', home.includes('id="homeQuickForm"') && home.includes('id="homeQuickArea"') && home.includes('id="homeQuickVolume"'));
check('homepage quick calculator validates inputs and clears stale results', homeScript.includes('validateQuickInput') && homeScript.includes('clearQuickResults'));
check('homepage quick calculator includes a sample and clear action', home.includes('id="homeQuickExample"') && home.includes('id="homeQuickClear"'));

const builder = fs.readFileSync(path.join(__dirname, 'build.js'), 'utf8');
check('build requires an HTTPS website URL when configured', builder.includes("parsedSiteUrl.protocol !== 'https:'"));
check('unconfigured builds are marked noindex', builder.includes("'noindex,follow'"));
check('empty sitemap is removed when the domain is not configured', builder.includes("fs.rmSync(sitemapPath, { force: true })"));
check('privacy page accurately describes current advertising status', builder.includes('does not include third-party advertising scripts or analytics tools'));

console.log('\n' + results.filter(Boolean).length + '/' + results.length + ' checks passed.');
if (failed) process.exit(1);
