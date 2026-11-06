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
console.log(JSON.stringify(scripts.map(p => ({ path: p }))));
