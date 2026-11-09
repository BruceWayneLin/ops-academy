#!/usr/bin/env node
// Collects the owner's own courses from elsewhere on this computer into content/library.local.js,
// shown as the "My courses" tab. The list of sources is in tools/library.local.json. Both files are
// gitignored: the material includes company code and paid courses, so it must never be published.
//
// Source items (in tools/library.local.json):
//   { "md": "/path/file.md", "title": "..." }                one lesson from a Markdown file
//   { "md": "/path/file.md", "splitBy": "## ", "intro": "..." } one lesson per section, split at that heading level
//   { "codeDir": "/path/lessons", "file": "main.go", "lang": "go", "run": "cd ... && go run ./lessons/{dir}" }
//                                                             one lesson per sub-folder, showing that file
//   { "open": "guide/index.html", "title": "...", "text": "Markdown shown above the button" }
//   { "text": "Markdown", "title": "...", "try": [["command", "what it does"]] }
// Usage: node tools/build-library.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const cfgPath = path.join(__dirname, 'library.local.json');
if (!fs.existsSync(cfgPath)) { console.log('No tools/library.local.json, so no library was built.'); process.exit(0); }
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const mins = s => Math.max(3, Math.round(s.length / 700));
const out = [];
let total = 0;
cfg.modules.forEach((m, mi) => {
  const lessons = [];
  const add = l => { l.id = m.id + '-' + (lessons.length + 1); l.lv = l.lv || 1; l.zh = l.zh || ''; l.quiz = []; lessons.push(l); };
  (m.items || []).forEach(it => {
    if (it.md && it.splitBy) {
      const src = fs.readFileSync(it.md, 'utf8');
      const marker = '\n' + it.splitBy;
      const parts = ('\n' + src).split(marker);
      const head = parts.shift().trim();
      if (head) add({ title: it.intro || 'Overview', md: head, mins: mins(head), src: it.md });
      parts.forEach(p => { const nl = p.indexOf('\n'); const title = (nl < 0 ? p : p.slice(0, nl)).trim(); const md = it.splitBy + p.trim(); add({ title: title, md: md, mins: mins(md), src: it.md }); });
    } else if (it.md) {
      const md = fs.readFileSync(it.md, 'utf8');
      add({ title: it.title || path.basename(it.md, '.md'), md: md, mins: mins(md), src: it.md });
    } else if (it.codeDir) {
      fs.readdirSync(it.codeDir).filter(d => fs.existsSync(path.join(it.codeDir, d, it.file))).sort().forEach(d => {
        const code = fs.readFileSync(path.join(it.codeDir, d, it.file), 'utf8');
        const l = { title: d, code: code, lang: it.lang || '', mins: mins(code), src: path.join(it.codeDir, d, it.file) };
        if (it.run) l.try = [[it.run.replace('{dir}', d), it.runNote || 'Run this program.']];
        add(l);
      });
    } else if (it.open) {
      add({ title: it.title, md: it.text || '', open: it.open, mins: it.mins || 30 });
    } else if (it.text) {
      add({ title: it.title, md: it.text, try: it.try, mins: mins(it.text) });
    }
  });
  total += lessons.length;
  out.push({ id: m.id, n: mi + 1, track: 'mine', title: m.title, zh: '', time: m.time || '', blurb: m.blurb || '', lessons: lessons });
});
const js = '// Built by tools/build-library.js from the owner\'s own files. Gitignored. Never publish.\n' + out.map(m => 'M(' + JSON.stringify(m) + ');').join('\n') + '\n';
fs.writeFileSync(path.join(root, 'content/library.local.js'), js);
console.log('library: ' + out.length + ' courses, ' + total + ' lessons, ' + Math.round(js.length / 1024) + ' KB');
