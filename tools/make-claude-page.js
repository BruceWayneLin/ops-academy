#!/usr/bin/env node
// Builds claude-page.html, the entry page for the private claude.ai version of the course.
// It differs from index.html in three ways: the styles are inlined, there is no <html>/<head>/<body>
// wrapper (claude.ai adds its own), and the owner's personal notes are always loaded.
// Usage: node tools/make-claude-page.js     -> writes claude-page.html and prints the files to publish with it
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'assets/style.css'), 'utf8');
const mods = fs.readdirSync(path.join(root, 'content')).filter(f => /^m\d.*\.js$/.test(f)).sort();
const scripts = mods.map(f => 'content/' + f).concat(mods.map(f => 'content/zh/' + f), ['content/private.local.js', 'assets/app.js']);
// Other study material kept only on the private page (company material stays off the public site).
const extras = [];
if (fs.existsSync(path.join(root, 'guide/index.html'))) extras.push({ href: 'guide/index.html', title: ['TypeScript and Cocos handbook', 'TypeScript／Cocos 手冊'], kind: ['Handbook', '手冊'], lang: ['Chinese only', '只有中文'],
  blurb: ['The classic baccarat front end explained from zero: a TypeScript course, a rebuild-it-yourself track, and drills. Opens as its own page.', '用經典百家樂前端從零講起：語法課、重建篇、練功房。會開成獨立的頁面。'] });

const html = `<title>Ops Academy</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${css}
</style>
<script>
window.COURSE = [];
window.COURSE_ZH = [];
window.PRIVATE_NOTES = {};
function M(m) { COURSE.push(m); }
function MZ(m) { COURSE_ZH.push(m); }
function PRIVATE(o) { window.PRIVATE_NOTES = o || {}; }
window.EXTRA_LINKS = ${JSON.stringify(extras)};
</script>
<header class="top">
  <button id="menu" class="icon" aria-label="Menu">&#9776;</button>
  <a class="brand" href="#home">Ops<b>Academy</b></a>
  <div class="prog" title="Lessons completed">
    <div class="prog-track"><div id="prog-bar"></div></div>
    <span id="prog-n">0 / 0</span>
  </div>
  <div class="search">
    <input id="q" type="search" placeholder="Search lessons" autocomplete="off">
    <div id="hits" hidden></div>
  </div>
  <button id="lang" class="icon" aria-label="Switch language">中文</button>
</header>
<div class="shell">
  <nav id="side"></nav>
  <main id="main"></main>
</div>
${scripts.map(s => '<script src="' + s + '"></script>').join('\n')}
`;
fs.writeFileSync(path.join(root, 'claude-page.html'), html);
console.log(JSON.stringify(scripts.concat(extras.map(x => x.href)).map(p => ({ path: p }))));
