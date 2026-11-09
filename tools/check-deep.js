#!/usr/bin/env node
// Checks the illustrated deep-dive chapters in content/deep/.
// Usage: node tools/check-deep.js            (all chapters)
//        node tools/check-deep.js ts-async   (one or more lesson ids)
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
const dir = path.join(root, 'content/deep');
const ids = new Set();
['content'].forEach(d => fs.readdirSync(path.join(root, d)).filter(f => /^[a-z]+\d.*\.js$/.test(f)).forEach(f => {
  const ctx = { M: m => (m.lessons || []).forEach(l => ids.add(l.id)) }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, d, f), 'utf8'), ctx);
}));
// Simplified-only characters, taken from the translation checker so both use one list.
const SIMP = (fs.readFileSync(path.join(__dirname, 'check-zh.js'), 'utf8').match(/const SIMP = '([^']+)'/) || [])[1] || '';
const simpRe = new RegExp('[' + SIMP + ']', 'g');
// Words that must never appear on the public site (employer names, private projects). Kept in a gitignored file.
const fpath = path.join(__dirname, 'forbidden.local.txt');
const FORBID = fs.existsSync(fpath) ? new RegExp(fs.readFileSync(fpath, 'utf8').trim(), 'i') : /(?!)/;
const want = process.argv.slice(2);
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && (!want.length || want.includes(f.replace(/\.js$/, ''))));
let bad = false;
for (const f of files) {
  const P = [], got = {};
  try { const ctx = { DEEP: o => Object.assign(got, o) }; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f }); }
  catch (e) { console.log('FAIL ' + f + ': does not run: ' + e.message); bad = true; continue; }
  const keys = Object.keys(got);
  if (keys.length !== 1 || keys[0] + '.js' !== f) P.push('file must call DEEP({ \'' + f.replace(/\.js$/, '') + '\': `...` }) with exactly that one key');
  for (const k of keys) {
    const h = got[k];
    if (!ids.has(k)) P.push('no lesson has the id "' + k + '"');
    const text = h.replace(/<[^>]+>/g, '');
    const cjk = (text.match(/[一-鿿]/g) || []).length;
    const figs = (h.match(/<figure/g) || []).length, svgs = (h.match(/<svg/g) || []).length;
    if (cjk < 5000) P.push('only ' + cjk + ' Chinese characters; the minimum is 5,000');
    for (const lv of ['基礎', '進階', '專業', '專家']) if (!h.includes('>' + lv + '</span>')) P.push('no section marked with the level badge ' + lv);
    if (!/面試/.test(h)) P.push('no interview-question section');
    if (svgs < 3) P.push('only ' + svgs + ' diagrams; at least 3 are needed');
    if (figs < svgs) P.push('every <svg> must sit inside a <figure> with a <figcaption>');
    if ((h.match(/<svg/g) || []).length !== (h.match(/<\/svg>/g) || []).length) P.push('unclosed <svg>');
    for (const t of ['figure', 'details', 'table', 'ol', 'ul', 'pre']) {
      const o = (h.match(new RegExp('<' + t + '[ >]', 'g')) || []).length, c = (h.match(new RegExp('</' + t + '>', 'g')) || []).length;
      if (o !== c) P.push('<' + t + '> opened ' + o + ' times, closed ' + c);
    }
    (h.match(/<svg[^>]*>/g) || []).forEach((s, i) => {
      if (!/viewBox=/.test(s)) P.push('diagram ' + (i + 1) + ' has no viewBox');
      if (!/role="img"/.test(s) || !/aria-label=/.test(s)) P.push('diagram ' + (i + 1) + ' needs role="img" and an aria-label');
      if (!/class="fg"/.test(s)) P.push('diagram ' + (i + 1) + ' needs class="fg"');
    });
    if (/fill="#|stroke="#|fill:#|stroke:#/.test(h)) P.push('literal colours found; use the fg-* classes so both themes work');
    if (!/<details class="reveal">/.test(h)) P.push('no exercises with hidden answers (<details class="reveal">)');
    const s = text.match(simpRe);
    if (s) P.push('Simplified characters: ' + Array.from(new Set(s)).slice(0, 12).join(''));
    const fb = h.match(FORBID);
    if (fb) P.push('forbidden word: ' + fb[0]);
    if (!P.length) console.log('OK ' + k + ' (' + cjk + ' Chinese characters, ' + svgs + ' diagrams)');
  }
  if (P.length) { bad = true; console.log('FAIL ' + f + '\n  - ' + P.join('\n  - ')); }
}
process.exit(bad ? 1 : 0);
