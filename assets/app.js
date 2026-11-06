(function () {
'use strict';

/* ---------- state ---------- */
const KEY = 'opsAcademy.v1';
const S = { done: {}, quiz: {}, ready: {}, last: null, theme: null, lang: null };
try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
['done', 'quiz', 'ready'].forEach(function (k) { if (!S[k] || typeof S[k] !== 'object') S[k] = {}; });
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

let LANG = S.lang || (((navigator.language || '') + '').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en');
const zhOn = () => LANG === 'zh';
/* L(english, chinese): the text for the current language. B([english, chinese]) does the same for a pair. */
const L = (en, zh) => (zhOn() && zh != null && zh !== '' ? zh : en);
const B = x => (Array.isArray(x) ? L(x[0], x[1]) : x);

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => (isFinite(n) ? Math.round(n).toLocaleString('en-US') : '-');
const main = $('#main');

const LV = {
  1: ['Foundation', '基礎', 'What a degree would have taught you: what each thing is, what it is for, and the words for it.', '相當於學校會教的部分：每樣東西是什麼、做什麼用、怎麼稱呼。'],
  2: ['Practitioner', '實作', 'You can build it and run it yourself, following good practice.', '你可以照著好的做法，自己把它架起來、跑起來。'],
  3: ['Professional', '專業', 'You can be trusted with production: design, failure and security. This is the hiring line.', '可以把正式環境交給你：設計、故障、資安都顧得到。這就是錄取線。'],
  4: ['Expert', '專家', 'You can explain why, handle the unusual case, and teach others.', '你說得出為什麼、處理得了少見的狀況，還能教別人。']
};

/* ---------- course data ---------- */
/* A module may arrive in several parts (several M() calls with the same id). Their lessons are joined in load order. */
const MODS = [];
(function () {
  const seen = {};
  (window.COURSE || []).forEach(m => {
    const t = seen[m.id];
    if (!t) { seen[m.id] = Object.assign({}, m, { lessons: (m.lessons || []).slice() }); MODS.push(seen[m.id]); return; }
    t.lessons = t.lessons.concat(m.lessons || []);
    ['n', 'title', 'zh', 'time', 'blurb'].forEach(k => { if (t[k] == null && m[k] != null) t[k] = m[k]; });
  });
  MODS.sort((a, b) => (a.n || 0) - (b.n || 0));
})();
const ALL = [];
MODS.forEach(m => m.lessons.forEach(l => { l.mod = m; l.num = m.n + '.' + (m.lessons.indexOf(l) + 1); l.i = ALL.length; ALL.push(l); }));
const BY = {};
ALL.forEach(l => { BY[l.id] = l; });
const ZMOD = {}, ZLES = {};
(window.COURSE_ZH || []).forEach(m => {
  const t = ZMOD[m.id] || (ZMOD[m.id] = {});
  ['title', 'time', 'blurb'].forEach(k => { if (m[k]) t[k] = m[k]; });
  (m.lessons || []).forEach(l => { ZLES[l.id] = l; });
});
const PRIV = window.PRIVATE_NOTES || {};

const zm = m => (zhOn() && ZMOD[m.id]) || null;
const zl = l => (zhOn() && ZLES[l.id]) || null;
const mTitle = m => { const z = zm(m); return (z && z.title) || m.title; };
const mBlurb = m => { const z = zm(m); return (z && z.blurb) || m.blurb; };
const mTime = m => { const z = zm(m); return (z && z.time) || m.time || ''; };
const lTitle = l => { const z = zl(l); return (z && z.title) || l.title; };
function lQuiz(l) {
  const z = zl(l);
  return (l.quiz || []).map((q, i) => {
    const y = z && z.quiz && z.quiz[i];
    return {
      q: (y && y.q) || q.q,
      a: (y && Array.isArray(y.a) && y.a.length === q.a.length) ? y.a : q.a,
      why: (y && y.why) || q.why,
      c: q.c
    };
  });
}

const openMods = {};
let active = 'home';
let currentQuiz = [];
let quizCtx = null;

/* ---------- chrome ---------- */
function renderTop() {
  const d = ALL.filter(l => S.done[l.id]).length;
  $('#prog-n').textContent = d + ' / ' + ALL.length;
  $('#prog-bar').style.width = (ALL.length ? d / ALL.length * 100 : 0) + '%';
  $('#q').placeholder = L('Search lessons', '搜尋課程');
  $('#lang').textContent = zhOn() ? 'EN' : '中文';
  $('#lang').title = zhOn() ? 'Switch to English' : '切換成中文';
  document.documentElement.lang = zhOn() ? 'zh-Hant' : 'en';
}

function renderSide() {
  let o = '<a class="side-home' + (active === 'home' ? ' on' : '') + '" href="#home">' + L('Roadmap', '課程地圖') + '</a>';
  MODS.forEach(m => {
    const d = m.lessons.filter(l => S.done[l.id]).length;
    const here = BY[active] && BY[active].mod === m;
    const isOpen = openMods[m.id] !== undefined ? openMods[m.id] : here;
    o += '<details class="mod" data-mod="' + m.id + '"' + (isOpen ? ' open' : '') + '><summary><span class="mn">' + m.n + '</span><span class="mt">' + esc(mTitle(m)) + '</span><span class="mc">' + d + '/' + m.lessons.length + '</span></summary><ol>';
    m.lessons.forEach(l => {
      o += '<li><a href="#' + l.id + '" class="' + (l.id === active ? 'on ' : '') + (S.done[l.id] ? 'done' : '') + '"><span class="tick"></span><span>' + esc(lTitle(l)) + '</span></a></li>';
    });
    o += '</ol></details>';
  });
  o += '<div class="side-links"><a href="#review">' + L('Review quiz', '複習測驗') + '</a><a href="#tools">' + L('Calculators', '計算機') + '</a><a href="#glossary">' + L('Glossary 中英對照', '詞彙表 中英對照') + '</a></div>';
  const side = $('#side');
  const y = side.scrollTop;
  side.innerHTML = o;
  side.scrollTop = y;
  $$('details.mod', side).forEach(d => d.addEventListener('toggle', () => { openMods[d.dataset.mod] = d.open; }));
}

/* ---------- quiz ---------- */
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}

function quizHTML(items) {
  return items.map((q, qi) => {
    let o = '<div class="q" data-q="' + qi + '"><p class="qt"><span>' + (qi + 1) + '</span><span>' + q.q + '</span></p><div class="opts">';
    shuffle(q.a.map((a, ai) => ai)).forEach(ai => { o += '<button type="button" class="opt" data-a="' + ai + '">' + q.a[ai] + '</button>'; });
    return o + '</div><p class="why" hidden></p></div>';
  }).join('');
}

function showAnswer(qEl, q, ai) {
  qEl.classList.add('answered');
  $$('.opt', qEl).forEach(b => {
    const i = +b.dataset.a;
    b.disabled = true;
    if (i === q.c) b.classList.add('right');
    else if (i === ai) b.classList.add('wrong');
  });
  const w = $('.why', qEl);
  w.hidden = false;
  w.innerHTML = (ai === q.c ? '<b class="ok">' + L('Correct.', '答對了。') + '</b> ' : '<b class="no">' + L('Not quite.', '不太對。') + '</b> ') + q.why +
    (q.from ? ' <a href="#' + q.from.id + '">' + L('Lesson ' + q.from.num, '第 ' + q.from.num + ' 課') + '</a>' : '');
}

/* ---------- views ---------- */
function viewHome() {
  const done = ALL.filter(l => S.done[l.id]).length;
  const next = (S.last && BY[S.last] && !S.done[S.last]) ? BY[S.last] : (ALL.find(l => !S.done[l.id]) || ALL[0]);
  const verb = (done || next !== ALL[0]) ? L('Continue', '繼續') : L('Start', '開始');
  let o = '<div class="home"><section class="hero"><p class="eyebrow">' + L('Self-study path · no degree needed', '自學路線 · 不需要學歷') + '</p>' +
    '<h1>' + L('From &ldquo;what is a browser?&rdquo; to running ten million users, and defending them.', '從「瀏覽器是什麼？」到撐起一千萬使用者，並且守得住。') + '</h1>' +
    '<p class="lead">' + L(
      'Every topic starts with what the thing is and what it is for, then goes down to the level a senior engineer works at. The practice tasks use your own servers, so finishing the course also leaves you with a portfolio to show an employer.',
      '每個主題都從「這是什麼、做什麼用」開始，一路講到資深工程師實際在用的深度。練習題用你自己的伺服器來做，所以整門課走完，你手上也會有一份可以給雇主看的作品集。') + '</p>' +
    '<div class="hero-row"><a class="btn" href="#' + next.id + '">' + verb + L(': ', '：') + next.num + ' ' + esc(lTitle(next)) + ' &rarr;</a>' +
    '<span class="small">' + L(done + ' of ' + ALL.length + ' lessons done', '已完成 ' + done + '／' + ALL.length + ' 課') + '</span></div></section>';

  o += '<section class="levels">';
  [1, 2, 3, 4].forEach(lv => {
    const ls = ALL.filter(l => (l.lv || 2) === lv);
    const d = ls.filter(l => S.done[l.id]).length;
    o += '<div class="lvl lv' + lv + '"><b>' + L(LV[lv][0], LV[lv][1]) + '</b><span>' + L(LV[lv][1], LV[lv][0]) + '</span><div class="bar"><i style="width:' + (ls.length ? d / ls.length * 100 : 0) + '%"></i></div><small>' + d + ' / ' + ls.length + L(' lessons', ' 課') + '</small><p>' + L(LV[lv][2], LV[lv][3]) + '</p></div>';
  });
  o += '</section>';

  o += '<h2>' + L('The path', '學習路線') + '</h2><div class="cards">';
  MODS.forEach(m => {
    const d = m.lessons.filter(l => S.done[l.id]).length;
    const go = m.lessons.find(l => !S.done[l.id]) || m.lessons[0];
    o += '<a class="card" href="#' + go.id + '"><div class="card-top"><span>' + L('Module ', '模組 ') + m.n + '</span><span>' + esc(mTime(m)) + '</span></div><h3>' + esc(mTitle(m)) + '</h3><p class="zh">' + esc(zhOn() ? m.title : m.zh) + '</p><p>' + esc(mBlurb(m)) + '</p><div class="bar"><i style="width:' + (d / m.lessons.length * 100) + '%"></i></div><div class="card-top" style="margin-top:6px"><span>' + d + ' / ' + m.lessons.length + L(' lessons', ' 課') + '</span></div></a>';
  });
  o += '</div>';

  o += '<h2>' + L('How to use this', '怎麼使用') + '</h2><div class="how"><ul>' + L(
    '<li><b>One lesson per sitting.</b> Read it (10 to 15 minutes), run the &ldquo;Try it&rdquo; commands, answer the questions. Five evenings a week finishes the course in about six months.</li>' +
    '<li><b>Do the &ldquo;On your own stack&rdquo; task.</b> Reading gives you vocabulary. The task gives you the skill and something to show in an interview. Module 9 turns these tasks into a portfolio.</li>' +
    '<li><b>Order:</b> modules 0 to 4 in sequence, module 5 alongside them from the start, module 6 after 5, module 8 near the end. Read module 9 early so you know what you are aiming at.</li>' +
    '<li><b>Use Review every weekend.</b> It draws questions from lessons you finished. Recalling old material after a few days is what makes it stay.</li>' +
    '<li><b>Switch language any time</b> with the button at the top right. Read in Chinese to understand, then in English to learn the words used in interviews.</li>' +
    '<li><b>What this cannot give you:</b> years of being on call. It gets a working developer to the hiring line for DevOps and security roles. Expert level is reached on the job, and the level-4 lessons show you what that looks like.</li>',
    '<li><b>一次一課。</b>讀完（10 到 15 分鐘）、跑「動手試試」的指令、回答問題。一週五個晚上，大約六個月走完。</li>' +
    '<li><b>一定要做「用你自己的系統練習」。</b>讀只會給你詞彙；做了才有技能，也才有面試時拿得出來的東西。模組 9 會把這些練習整理成作品集。</li>' +
    '<li><b>順序：</b>模組 0 到 4 照順序，模組 5 從第一天起同步進行，模組 6 排在 5 之後，模組 8 留到後面。模組 9 先讀，才知道目標在哪裡。</li>' +
    '<li><b>每個週末做一次複習測驗。</b>題目從你完成的課裡抽。隔幾天再回想舊內容，才記得住。</li>' +
    '<li><b>隨時可以切換語言</b>，按右上角的按鈕。先用中文看懂，再用英文把面試會用到的詞學起來。</li>' +
    '<li><b>這門課給不了的：</b>多年的值班經驗。它能把一位在職開發者帶到 DevOps 與資安職缺的錄取線；專家等級要在工作上磨，第 4 級的課讓你先看到那是什麼樣子。</li>') +
    '</ul></div>';

  o += '<h2>' + L('Study on another device', '換裝置繼續學') + '</h2><div class="how sync" id="sync-box">' + syncHTML() + '</div>';

  o += '<h2>' + L('Free places to practise, and the books worth owning', '免費的練習場，以及值得買的書') + '</h2><ul class="res">' +
    '<li><a href="https://killercoda.com/playgrounds" target="_blank" rel="noopener">Killercoda</a>' + L(': real Linux and Kubernetes machines in the browser. Nothing runs on your own computer.', '：瀏覽器裡的真 Linux 與 Kubernetes 機器，不佔你電腦的資源。') + '</li>' +
    '<li><a href="https://portswigger.net/web-security" target="_blank" rel="noopener">PortSwigger Web Security Academy</a>' + L(': free, legal labs for every web attack in module 5.', '：模組 5 每一種網站攻擊的免費、合法練習場。') + '</li>' +
    '<li><a href="https://sre.google/books/" target="_blank" rel="noopener">Google SRE books</a>' + L(': free online. The source for module 4.', '：線上免費，模組 4 的源頭。') + '</li>' +
    '<li><a href="https://github.com/kelseyhightower/kubernetes-the-hard-way" target="_blank" rel="noopener">Kubernetes the Hard Way</a>' + L(': build a cluster by hand, after module 2.', '：讀完模組 2 之後，親手架一座叢集。') + '</li>' +
    '<li><a href="https://linuxcommand.org/tlcl.php" target="_blank" rel="noopener">The Linux Command Line</a>' + L(': free book for shell fluency.', '：把 shell 練熟的免費書。') + '</li>' +
    '<li><i>Designing Data-Intensive Applications</i>' + L(' (繁中版《資料密集型應用系統設計》): the one book for module 3.', '（繁中版《資料密集型應用系統設計》）：模組 3 就靠這一本。') + '</li>' +
    '<li><i>Computer Networking: A Top-Down Approach</i>' + L(': the textbook behind module 1.', '：模組 1 背後的教科書。') + '</li>' +
    '<li><a href="https://roadmap.sh/devops" target="_blank" rel="noopener">roadmap.sh</a>' + L(': to check you have not missed a topic.', '：用來檢查有沒有漏掉的主題。') + '</li>' +
    '</ul></div>';
  main.innerHTML = o;
}

function viewLesson(l) {
  S.last = l.id; save();
  const prev = ALL[l.i - 1], next = ALL[l.i + 1];
  const lvn = l.lv || 2;
  const z = zl(l);
  const tries = l.try || [];
  let o = '<article class="lesson">';
  o += '<p class="crumb"><a href="#home">' + L('Roadmap', '課程地圖') + '</a> / ' + L('Module ', '模組 ') + l.mod.n + ' · ' + esc(mTitle(l.mod)) + '</p>';
  o += '<h1><span class="num">' + l.num + '</span>' + esc(lTitle(l)) + '</h1>';
  if (z) o += '<p class="entitle">' + esc(l.title) + '</p>';
  o += '<p class="meta"><span class="badge lv' + lvn + '">' + L(LV[lvn][0] + ' ' + LV[lvn][1], LV[lvn][1] + ' ' + LV[lvn][0]) + '</span><span>' +
    L((l.mins || 10) + ' min read' + (tries.length ? ' + hands-on' : ''), '閱讀約 ' + (l.mins || 10) + ' 分鐘' + (tries.length ? '＋動手做' : '')) + '</span></p>';
  o += '<p class="zh">' + esc(l.zh) + '</p>';
  o += '<div class="body">' + ((z && z.body) || l.body) + '</div>';
  if (tries.length) {
    const note = (z && z.tryNote) || l.tryNote;
    o += '<section><h2>' + L('Try it', '動手試試') + '</h2>' + (note ? '<p class="small">' + note + '</p>' : '');
    tries.forEach((t, i) => {
      const tn = (z && Array.isArray(z.try) && typeof z.try[i] === 'string' && z.try[i]) || t[1];
      o += '<div class="cmd"><pre><code>' + esc(t[0]) + '</code></pre><button type="button" class="copy" data-copy="' + esc(t[0]) + '">' + L('Copy', '複製') + '</button>' + (tn ? '<p>' + tn + '</p>' : '') + '</div>';
    });
    o += '</section>';
  }
  const own = (z && z.own) || l.own;
  if (own) o += '<section><h2>' + L('On your own stack', '用你自己的系統練習') + '</h2><div class="own"><p>' + own + '</p></div></section>';
  if (PRIV[l.id]) {
    o += '<section><h2>' + L('Your private notes', '你的私人筆記') + '</h2><div class="own priv"><p>' + (PRIV[l.id][LANG] || PRIV[l.id].en) + '</p></div></section>';
  }
  if (l.terms && l.terms.length) {
    o += '<section><h2>' + L('Key terms', '關鍵詞彙') + '</h2><div class="termlist">' + l.terms.map(t => '<span class="term"><b>' + esc(t[0]) + '</b>' + esc(t[1]) + '</span>').join('') + '</div></section>';
  }
  currentQuiz = lQuiz(l);
  if (currentQuiz.length) {
    o += '<section class="quiz"><h2>' + L('Check yourself', '自我檢查') + '</h2>' + quizHTML(currentQuiz) + '<button type="button" class="linkbtn" data-act="resetquiz">' + L('Clear my answers', '清除我的作答') + '</button></section>';
  }
  o += '<div class="foot">' + (prev ? '<a class="btn ghost" href="#' + prev.id + '">&larr; ' + prev.num + ' ' + esc(lTitle(prev)) + '</a>' : '<span></span>') +
    '<span>' + (S.done[l.id] ? '<button type="button" class="linkbtn" data-act="undone">' + L('Mark as not done', '改回未完成') + '</button> ' : '') +
    '<button type="button" class="btn" data-act="done">' + (S.done[l.id] ? L('Completed', '已完成') : L('Mark complete', '標記完成')) + (next ? L(' · next &rarr;', ' · 下一課 &rarr;') : '') + '</button></span></div>';
  o += '</article>';
  main.innerHTML = o;
  quizCtx = { mode: 'lesson', lesson: l };
  const saved = S.quiz[l.id] || {};
  $$('.q', main).forEach(qEl => { const qi = +qEl.dataset.q; if (saved[qi] != null) showAnswer(qEl, currentQuiz[qi], saved[qi]); });
  mountWidgets(main);
}

function viewReview() {
  const pool = ALL.filter(l => S.done[l.id]);
  const src = pool.length ? pool : ALL;
  const qs = [];
  src.forEach(l => lQuiz(l).forEach(q => { q.from = l; qs.push(q); }));
  currentQuiz = shuffle(qs).slice(0, 8);
  quizCtx = { mode: 'review', right: 0, n: 0 };
  main.innerHTML = '<article class="lesson"><h1>' + L('Review quiz', '複習測驗') + '</h1><p class="lead">' +
    (pool.length
      ? L('Eight random questions from the ' + pool.length + ' lessons you have completed.', '從你完成的 ' + pool.length + ' 課裡隨機抽八題。')
      : L('You have not completed a lesson yet, so these come from the whole course.', '你還沒完成任何一課，所以先從整門課抽題。')) +
    '</p><section class="quiz">' + quizHTML(currentQuiz) + '<p class="meter" id="rv-score"></p><button type="button" class="btn ghost" data-act="newreview">' + L('New set', '換一組') + '</button></section></article>';
}

function viewGlossary() {
  const map = {};
  ALL.forEach(l => (l.terms || []).forEach(t => { const k = t[0].toLowerCase(); if (!map[k]) map[k] = { en: t[0], zh: t[1], l: l }; }));
  const rows = Object.keys(map).sort().map(k => map[k]);
  main.innerHTML = '<article class="lesson"><h1>' + L('Glossary 中英對照', '詞彙表 中英對照') + '</h1><p class="lead">' +
    L(rows.length + ' terms. Interviews and documentation use the English word. The Chinese is here so the idea lands the first time.', '共 ' + rows.length + ' 個詞。面試和文件用的是英文詞；中文是讓你第一次就看懂。') + '</p>' +
    '<input class="w-in gl-in" id="gl-q" type="search" placeholder="' + L('Filter terms', '篩選詞彙') + '"><table class="tbl"><thead><tr><th>English</th><th>繁體中文</th><th>' + L('Taught in', '出自') + '</th></tr></thead><tbody id="gl-b"></tbody></table></article>';
  const draw = v => {
    $('#gl-b').innerHTML = rows.filter(r => !v || r.en.toLowerCase().includes(v) || r.zh.includes(v))
      .map(r => '<tr><td><b>' + esc(r.en) + '</b></td><td>' + esc(r.zh) + '</td><td><a href="#' + r.l.id + '">' + r.l.num + ' ' + esc(lTitle(r.l)) + '</a></td></tr>').join('');
  };
  draw('');
  $('#gl-q').addEventListener('input', e => draw(e.target.value.trim().toLowerCase()));
}

function viewTools() {
  main.innerHTML = '<article class="lesson"><h1>' + L('Calculators', '計算機') + '</h1><p class="lead">' + L('The three sums you will do most often, in interviews and at work.', '面試和工作上最常算的三筆帳。') + '</p>' +
    '<div class="body"><h3>' + L('How big is &ldquo;N users&rdquo;?', '「N 個使用者」到底有多大？') + '</h3><div class="widget" data-w="capacity"></div>' +
    '<h3>' + L('What does this CIDR block contain?', '這個 CIDR 區塊裡有什麼？') + '</h3><div class="widget" data-w="cidr"></div>' +
    '<h3>' + L('How much downtime does this availability allow?', '這個可用性允許停機多久？') + '</h3><div class="widget" data-w="slo"></div></div></article>';
  mountWidgets(main);
}

/* ---------- widgets ---------- */
const W = {};
function mountWidgets(root) { $$('[data-w]', root).forEach(el => { const f = W[el.dataset.w]; if (f) f(el); }); }

const JOURNEY = [
  { t: ['Browser', '瀏覽器'], h: ['The browser reads the address', '瀏覽器讀網址'],
    p: ['It splits <code>https://example.com/lobby</code> into a scheme (https), a host (example.com) and a path (/lobby). It looks in its own cache first. To connect, it needs the host as a number: an IP address.',
        '它把 <code>https://example.com/lobby</code> 拆成協定（https）、主機（example.com）、路徑（/lobby）。先看自己的快取有沒有。要連線，得先知道主機的數字位址，也就是 IP 位址。'],
    see: '', fail: ['A typo in the address, or a stale cached page that hides a newer one.', '網址打錯，或是舊的快取頁面蓋住了新版本。'] },
  { t: ['DNS', 'DNS'], h: ['DNS turns the name into a number', 'DNS 把名字換成數字'],
    p: ['The browser asks a resolver &ldquo;what is the address of example.com?&rdquo; and gets back something like 93.184.215.14. The answer is cached for a time the domain owner chose (the TTL).',
        '瀏覽器問解析器：「example.com 的位址是多少？」得到像 93.184.215.14 這樣的答案。答案會被快取一段時間，長短由網域擁有者決定（TTL）。'],
    see: 'dig +short example.com', fail: ['&ldquo;Server not found&rdquo;. Or users reach an old server because a cached answer has not expired.', '「找不到伺服器」。或是快取的舊答案還沒過期，使用者連到舊機器。'] },
  { t: ['TCP', 'TCP'], h: ['TCP opens a connection', 'TCP 建立連線'],
    p: ['Three small packets go back and forth (SYN, SYN-ACK, ACK) to that address on port 443. Now both sides have a reliable two-way pipe. This costs one round trip before any data moves.',
        '三個小封包來回（SYN、SYN-ACK、ACK），連到那個位址的 443 埠。現在雙方有一條可靠的雙向管道。資料還沒開始傳，就先花掉一趟來回。'],
    see: 'nc -vz example.com 443', fail: ['&ldquo;Connection timed out&rdquo; (a firewall dropped it) or &ldquo;connection refused&rdquo; (nothing is listening).', '「連線逾時」（被防火牆丟掉）或「連線被拒」（沒有程式在聽）。'] },
  { t: ['TLS', 'TLS'], h: ['TLS proves identity and encrypts', 'TLS 驗明身分並加密'],
    p: ['The server shows a certificate signed by an authority the browser trusts. The browser checks it matches the name and has not expired. Both sides then agree on keys, and everything after this is encrypted.',
        '伺服器出示憑證，上面有瀏覽器信任的機構的簽章。瀏覽器檢查憑證上的名字對不對、有沒有過期。接著雙方講好金鑰，之後的內容全部加密。'],
    see: 'echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null | openssl x509 -noout -subject -dates', fail: ['A full-page certificate warning. The most common cause is a certificate that expired.', '整頁的憑證警告。最常見的原因是憑證過期。'] },
  { t: ['HTTP', 'HTTP'], h: ['The browser sends an HTTP request', '瀏覽器送出 HTTP 請求'],
    p: ['A few lines of text: <code>GET /lobby</code>, plus headers such as cookies and accepted formats. The server will answer with a status code, headers and a body.',
        '幾行文字：<code>GET /lobby</code>，加上標頭（cookie、能接受的格式等等）。伺服器會回一個狀態碼、標頭和內容。'],
    see: 'curl -sI https://example.com', fail: ['A 4xx status: the request itself is wrong (not logged in, not allowed, not found).', '4xx 狀態碼：請求本身有問題（沒登入、沒權限、找不到）。'] },
  { t: ['Edge / LB', '邊緣／負載平衡'], h: ['A CDN or load balancer receives it', 'CDN 或負載平衡器接手'],
    p: ['A CDN may answer from its cache without contacting you at all. Otherwise a load balancer picks one healthy app server and forwards the request to it.',
        'CDN 可能直接用快取回答，完全不用找你。不然就由負載平衡器挑一台健康的應用程式伺服器，把請求轉過去。'],
    see: '', fail: ['502 (the app behind is down), 503 (no healthy server), 504 (the app took too long).', '502（後面的程式掛了）、503（沒有健康的伺服器）、504（程式回得太慢）。'] },
  { t: ['App', '應用程式'], h: ['Your code runs', '你的程式開始跑'],
    p: ['The app server checks who you are, applies the rules, and gathers data. It usually asks a cache first and the database second.',
        '應用程式伺服器確認你是誰、套用規則、把資料湊齊。通常先問快取，再問資料庫。'],
    see: '', fail: ['A 500 error (the code crashed) or a slow page (the code is waiting on something).', '500 錯誤（程式當掉）或頁面很慢（程式在等某個東西）。'] },
  { t: ['Database', '資料庫'], h: ['The database finds the rows', '資料庫找出資料列'],
    p: ['With a good index this takes under a millisecond. Without one it reads the whole table. The rows go back to the app, the app builds the response, and the response travels the whole chain in reverse.',
        '有好的索引，不到一毫秒就找到。沒有索引就得把整張表讀一遍。資料列回到程式，程式組出回應，回應再沿著整條鏈原路走回去。'],
    see: '', fail: ['Slow pages and timeouts everywhere at once, because every request waits here.', '到處都慢、到處逾時，因為每個請求都卡在這裡等。'] }
];

W.journey = function (el) {
  let cur = 0;
  el.innerHTML = '<div class="jr-nodes">' + JOURNEY.map((s, i) => '<button type="button" class="jr-node" data-i="' + i + '">' + (i + 1) + '. ' + B(s.t) + '</button>').join('') + '</div><div class="jr-panel"></div>';
  const show = i => {
    cur = Math.max(0, Math.min(JOURNEY.length - 1, i));
    const s = JOURNEY[cur];
    $$('.jr-node', el).forEach((b, k) => b.classList.toggle('on', k === cur));
    $('.jr-panel', el).innerHTML = '<h4>' + B(s.h) + '</h4><p>' + B(s.p) + '</p>' +
      (s.see ? '<p class="small">' + L('See it yourself: ', '自己看看：') + '<code>' + esc(s.see) + '</code></p>' : '') +
      '<p class="small"><b>' + L('When this step fails:', '這一步出問題時：') + '</b> ' + B(s.fail) + '</p>' +
      '<div class="jr-nav"><button type="button" class="btn ghost" data-j="-1">&larr; ' + L('Back', '上一步') + '</button><button type="button" class="btn ghost" data-j="1">' + L('Next step', '下一步') + ' &rarr;</button></div>';
  };
  el.addEventListener('click', e => {
    const n = e.target.closest('.jr-node'); if (n) { show(+n.dataset.i); return; }
    const j = e.target.closest('[data-j]'); if (j) show(cur + (+j.dataset.j));
  });
  show(0);
};

function ip2int(s) {
  const p = s.split('.');
  if (p.length !== 4) return null;
  let n = 0;
  for (let i = 0; i < 4; i++) {
    if (!/^\d{1,3}$/.test(p[i]) || +p[i] > 255) return null;
    n = n * 256 + (+p[i]);
  }
  return n;
}
function int2ip(n) { return [Math.floor(n / 16777216) % 256, Math.floor(n / 65536) % 256, Math.floor(n / 256) % 256, n % 256].join('.'); }

W.cidr = function (el) {
  el.innerHTML = '<label class="small">' + L('CIDR block', 'CIDR 區塊') + ' <input class="w-in" value="10.0.1.0/24" style="width:180px;margin-left:6px"></label>' +
    '<div class="chips"><button type="button">10.0.0.0/16</button><button type="button">192.168.1.0/24</button><button type="button">172.31.16.0/20</button><button type="button">10.0.1.64/26</button><button type="button">203.0.113.7/32</button></div><div class="res-out"></div>';
  const inp = $('input', el), out = $('.res-out', el);
  const calc = () => {
    const m = inp.value.trim().match(/^(\d+\.\d+\.\d+\.\d+)\/(\d{1,2})$/);
    const ip = m ? ip2int(m[1]) : null;
    const n = m ? +m[2] : -1;
    if (ip === null || n < 0 || n > 32) { out.innerHTML = '<p class="small">' + L('Type an address and a prefix, for example 10.0.1.0/24.', '請輸入位址和前綴，例如 10.0.1.0/24。') + '</p>'; return; }
    const size = Math.pow(2, 32 - n);
    const net = Math.floor(ip / size) * size;
    const last = net + size - 1;
    const usable = n >= 31 ? size : size - 2;
    const inR = (a, bits) => { const sz = Math.pow(2, 32 - bits); return Math.floor(net / sz) * sz === ip2int(a); };
    let kind = L('Public: routable on the internet', '公有：可以在網際網路上路由');
    if (inR('10.0.0.0', 8) || inR('172.16.0.0', 12) || inR('192.168.0.0', 16)) kind = L('Private: only reachable inside its own network', '私有：只在自己的網路裡連得到');
    else if (inR('127.0.0.0', 8)) kind = L('Loopback: this machine talking to itself', '迴路：這台機器自己跟自己講話');
    else if (inR('169.254.0.0', 16)) kind = L('Link-local: includes the cloud metadata address', '鏈路本地：雲端 metadata 位址就在這一段');
    else if (inR('100.64.0.0', 10)) kind = L('Carrier-grade NAT range', '電信級 NAT 範圍');
    const bits = ('00000000000000000000000000000000' + ip.toString(2)).slice(-32);
    let bh = '';
    for (let i = 0; i < 32; i++) { bh += (i < n ? '<i>' + bits[i] + '</i>' : bits[i]) + (i % 8 === 7 && i < 31 ? ' . ' : ''); }
    const stat = (a, b, st) => '<div class="stat"><small>' + a + '</small><b' + (st ? ' style="' + st + '"' : '') + '>' + b + '</b></div>';
    out.innerHTML = '<div class="out">' +
      stat(L('Addresses in the block', '區塊內的位址數'), fmt(size)) +
      stat(L('Usable for hosts', '可分給主機的數量'), fmt(usable)) +
      stat(L('Subnet mask', '子網路遮罩'), int2ip(4294967296 - size), 'font-size:16px') +
      stat(L('First address (network)', '第一個位址（網路）'), int2ip(net), 'font-size:16px') +
      stat(L('Last address (broadcast)', '最後一個位址（廣播）'), int2ip(last), 'font-size:16px') +
      stat(L('Kind', '種類'), kind, 'font-size:13.5px;font-weight:600;line-height:1.3;display:block') + '</div>' +
      '<p class="bits">' + bh + '</p><p class="small">' + L(
        'The ' + n + ' highlighted bits are fixed and name the network. The other ' + (32 - n) + ' bits are free, which gives 2<sup>' + (32 - n) + '</sup> = ' + fmt(size) + ' addresses. AWS keeps 5 addresses in every subnet for itself.',
        '標示出來的 ' + n + ' 個位元是固定的，用來表示網路。剩下的 ' + (32 - n) + ' 個位元可以自由使用，所以有 2<sup>' + (32 - n) + '</sup> = ' + fmt(size) + ' 個位址。AWS 在每個子網路會自己保留 5 個位址。') + '</p>';
  };
  inp.addEventListener('input', calc);
  el.addEventListener('click', e => { const b = e.target.closest('.chips button'); if (b) { inp.value = b.textContent; calc(); } });
  calc();
};

W.capacity = function (el) {
  const F = [
    ['reg', ['Registered users', '註冊使用者數'], 10000000],
    ['dau', ['Active on a normal day (% of registered)', '平常一天有多少人上線（佔註冊的 %）'], 15],
    ['req', ['Requests per active user per day', '每個活躍使用者每天的請求數'], 100],
    ['peak', ['Peak hour compared with the average (times)', '尖峰是平均的幾倍'], 3],
    ['conc', ['Online at the same moment at peak (% of daily active)', '尖峰時同時在線（佔每日活躍的 %）'], 10],
    ['rps', ['Requests per second one app server handles', '一台應用程式伺服器每秒能處理的請求數'], 500],
    ['conn', ['Open connections one gateway holds', '一台閘道能撐住的連線數'], 20000],
    ['head', ['Spare capacity to keep (%)', '要保留的餘裕（%）'], 40],
    ['wr', ['Rows written per active user per day', '每個活躍使用者每天寫入幾列'], 20],
    ['bytes', ['Bytes per row, with indexes', '每列幾個位元組（含索引）'], 200]
  ];
  el.innerHTML = '<div class="fields">' + F.map(f => '<label>' + B(f[1]) + '<input type="number" min="0" data-k="' + f[0] + '" value="' + f[2] + '"></label>').join('') + '</div><div class="out"></div>' +
    '<p class="small">' + L(
      'Every input is a guess until you measure it. The ratios are typical for consumer apps and games, and yours will differ. The point is the method: turn a marketing number into engineering numbers before choosing any technology.',
      '每個輸入在你實際量測之前都只是猜測。這些比例是一般消費型 app 與遊戲的常見值，你的會不一樣。重點是方法：先把行銷數字換算成工程數字，再去選技術。') + '</p>';
  const calc = () => {
    const v = {};
    $$('input', el).forEach(i => { v[i.dataset.k] = Math.max(0, parseFloat(i.value) || 0); });
    const dau = v.reg * v.dau / 100;
    const perDay = dau * v.req;
    const avg = perDay / 86400;
    const peak = avg * v.peak;
    const h = 1 + v.head / 100;
    const servers = v.rps ? Math.ceil(peak / v.rps * h) : 0;
    const conc = dau * v.conc / 100;
    const gws = v.conn ? Math.ceil(conc / v.conn * h) : 0;
    const rows = dau * v.wr;
    const gbDay = rows * v.bytes / 1e9;
    const stat = (a, b) => '<div class="stat"><small>' + a + '</small><b>' + b + '</b></div>';
    $('.out', el).innerHTML =
      stat(L('Daily active users', '每日活躍使用者'), fmt(dau)) + stat(L('Requests per day', '每天請求數'), fmt(perDay)) + stat(L('Average requests per second', '平均每秒請求數'), fmt(avg)) +
      stat(L('Peak requests per second', '尖峰每秒請求數'), fmt(peak)) + stat(L('App servers needed', '需要的應用程式伺服器'), fmt(servers)) + stat(L('Online together at peak', '尖峰同時在線'), fmt(conc)) +
      stat(L('Realtime gateways needed', '需要的即時閘道'), fmt(gws)) + stat(L('New rows per day', '每天新增列數'), fmt(rows)) +
      stat(L('Storage growth', '儲存成長'), gbDay.toFixed(1) + L(' GB/day · ', ' GB／天 · ') + (gbDay * 365 / 1000).toFixed(1) + L(' TB/yr', ' TB／年'));
  };
  el.addEventListener('input', calc);
  calc();
};

function dur(sec) {
  if (sec < 1) return Math.round(sec * 1000) + L(' ms', ' 毫秒');
  if (sec < 60) return sec.toFixed(1) + L(' seconds', ' 秒');
  if (sec < 3600) return (sec / 60).toFixed(1) + L(' minutes', ' 分鐘');
  if (sec < 86400) return (sec / 3600).toFixed(1) + L(' hours', ' 小時');
  return (sec / 86400).toFixed(1) + L(' days', ' 天');
}

W.slo = function (el) {
  el.innerHTML = '<label class="small">' + L('Availability target (%)', '可用性目標（%）') + ' <input class="w-in" type="number" step="0.001" min="0" max="100" value="99.9" style="width:120px;margin-left:6px"></label>' +
    '<div class="chips"><button type="button">99</button><button type="button">99.5</button><button type="button">99.9</button><button type="button">99.95</button><button type="button">99.99</button><button type="button">99.999</button></div><div class="out"></div>' +
    '<p class="small">' + L('The allowed downtime is your error budget: the amount of failure you may spend on releases, experiments and maintenance.', '允許的停機時間就是你的錯誤預算：可以花在上版、實驗、維護上的失敗額度。') + '</p>';
  const inp = $('input', el);
  const calc = () => {
    const p = Math.min(100, Math.max(0, parseFloat(inp.value) || 0));
    const bad = 1 - p / 100;
    const stat = (a, b) => '<div class="stat"><small>' + a + '</small><b style="font-size:17px">' + b + '</b></div>';
    $('.out', el).innerHTML = stat(L('Allowed downtime per day', '每天允許停機'), dur(86400 * bad)) + stat(L('Per 30 days', '每 30 天'), dur(2592000 * bad)) + stat(L('Per year', '每年'), dur(31536000 * bad));
  };
  inp.addEventListener('input', calc);
  el.addEventListener('click', e => { const b = e.target.closest('.chips button'); if (b) { inp.value = b.textContent; calc(); } });
  calc();
};

const TIER = { edge: ['Edge', '邊緣'], app: ['App', '應用程式'], data: ['Data', '資料'], ops: ['Operations', '維運'] };
const STAGES = [
  { name: ['One box', '一台機器'], users: ['Launch to roughly ten thousand users', '上線初期到大約一萬使用者'],
    tiers: { edge: [[['DNS', 'DNS'], 0]], app: [[['One server: proxy + app', '一台伺服器：代理＋應用程式'], 0]], data: [[['Database and Redis on the same server', '資料庫和 Redis 放在同一台'], 0]], ops: [[['SSH, manual deploys', 'SSH、手動部署'], 0], [['A nightly backup, hopefully', '每晚備份（希望有）'], 0]] },
    why: ['This is the right place to start. It is cheap, simple, and one person can understand all of it.', '這是對的起點：便宜、簡單，一個人就能全部搞懂。'],
    cost: ['Everything shares one machine, so one failure takes down everything. The app and the database fight for memory. Every deploy is a short outage.', '全部擠在一台機器上，一個故障就全掛。應用程式和資料庫搶記憶體。每次部署都是一次短暫停機。'],
    links: ['srv-what', 'lin-ops'] },
  { name: ['Move the database out', '把資料庫搬出去'], users: ['Tens of thousands', '幾萬人'],
    tiers: { edge: [[['DNS', 'DNS'], 0]], app: [[['App server', '應用程式伺服器'], 0]], data: [[['Managed database with automatic backups', '代管資料庫，自動備份'], 1], [['Object storage for files', '檔案放物件儲存'], 1]], ops: [[['Restore tested at least once', '至少還原測試過一次'], 1], [['Basic monitoring', '基本監控'], 1]] },
    why: ['The database needed its own memory and disk, and you needed backups you can trust.', '資料庫需要自己的記憶體和磁碟，你也需要信得過的備份。'],
    cost: ['A network hop between app and database. The database is still a single point of failure, and so is the app server.', '應用程式和資料庫之間多了一段網路。資料庫還是單點故障，應用程式伺服器也是。'],
    links: ['db-repl', 'obs-signals'] },
  { name: ['Load balancer and stateless app servers', '負載平衡器＋無狀態的應用程式伺服器'], users: ['Hundreds of thousands', '幾十萬人'],
    tiers: { edge: [[['Load balancer, TLS ends here', '負載平衡器，TLS 在這裡結束'], 1]], app: [[['Two or more identical app servers in two zones', '兩台以上一模一樣的應用程式伺服器，分在兩個可用區'], 1]], data: [[['Database with a standby in a second zone', '資料庫在第二個可用區有備援'], 1], [['Redis for sessions', 'Redis 放 session'], 1]], ops: [[['Pipeline with rolling deploys', '有滾動部署的管線'], 1], [['Alerts on the four signals', '針對四個訊號的警報'], 1]] },
    why: ['You could not survive one server dying, and you could not deploy without downtime.', '一台伺服器掛掉你撐不住，而且每次部署都得停機。'],
    cost: ['The app must keep nothing in its own memory or disk between requests. WebSocket connections need care. Deploys need a pipeline.', '應用程式不能在自己的記憶體或磁碟裡留東西。WebSocket 連線要特別處理。部署需要一條管線。'],
    links: ['net-lb', 'k8s-health', 'cicd'] },
  { name: ['Cache, read replicas, CDN', '快取、讀取副本、CDN'], users: ['Around a million', '一百萬人上下'],
    tiers: { edge: [[['CDN for static files', 'CDN 放靜態檔'], 1], [['Load balancer', '負載平衡器'], 0]], app: [[['App servers that scale with load', '會跟著負載伸縮的應用程式伺服器'], 1]], data: [[['Primary + standby', '主庫＋備援'], 0], [['Read replicas', '讀取副本'], 1], [['Redis cache', 'Redis 快取'], 1]], ops: [[['Dashboards, load tests', '儀表板、負載測試'], 1]] },
    why: ['Reads were saturating the database, and static files were eating bandwidth and feeling slow far away.', '讀取量把資料庫壓滿了；靜態檔吃頻寬，遠方的使用者也覺得慢。'],
    cost: ['Data can now be stale. Replicas lag behind the primary, and cache invalidation becomes your problem.', '資料可能是舊的。副本會落後主庫，快取什麼時候作廢也變成你的問題。'],
    links: ['db-cache', 'db-repl', 'cdn'] },
  { name: ['Queues, services, autoscaling', '佇列、拆服務、自動擴展'], users: ['Several million', '幾百萬人'],
    tiers: { edge: [[['CDN', 'CDN'], 0], [['WAF and rate limits', 'WAF 與速率限制'], 1], [['Load balancer', '負載平衡器'], 0]], app: [[['Services split by function', '依功能拆開的服務'], 1], [['Realtime gateway tier', '即時連線閘道層'], 1], [['Autoscaling', '自動擴展'], 1]], data: [[['A database per service', '每個服務自己的資料庫'], 1], [['Replicas + cache', '副本＋快取'], 0]], ops: [[['Queue + workers', '佇列＋背景工作者'], 1], [['Tracing, SLOs, on-call', '追蹤、SLO、值班'], 1]] },
    why: ['Slow work inside requests, spiky load, attacks, and teams blocking each other in one codebase.', '請求裡塞了慢工作、流量忽高忽低、被攻擊，還有好幾個團隊擠在同一份程式碼裡互卡。'],
    cost: ['Work now finishes later, in the background, so handlers must be idempotent. Debugging crosses many services and needs tracing.', '工作變成稍後在背景完成，所以處理程式必須冪等。除錯要跨很多服務，需要追蹤工具。'],
    links: ['queues', 'slo', 'sec-net'] },
  { name: ['Sharding and regions', '分片與多區域'], users: ['Ten million and beyond', '一千萬人以上'],
    tiers: { edge: [[['Routing across regions', '跨區域的流量導向'], 1], [['CDN + WAF', 'CDN + WAF'], 0]], app: [[['Services on Kubernetes in several regions', '服務跑在多個區域的 Kubernetes 上'], 1]], data: [[['Sharded or distributed SQL', '分片或分散式 SQL'], 1], [['History partitioned and archived', '歷史資料分割並封存'], 1], [['Cross-region replicas', '跨區域副本'], 1]], ops: [[['Disaster drills', '災難演練'], 1], [['Capacity and cost planning', '容量與成本規劃'], 1]] },
    why: ['The primary database hit its write ceiling, tables became too large to manage, or users and regulators required other regions.', '主庫的寫入到頂了、資料表大到管不動，或是使用者與法規要求放在其他區域。'],
    cost: ['Cross-shard queries and transactions, global consistency, and a large operations burden. Few products truly need this stage.', '跨分片的查詢與交易、全球一致性，還有很重的維運負擔。真正需要走到這一步的產品很少。'],
    links: ['db-shard', 'dist-sys', 'dr'] }
];

W.stages = function (el) {
  el.innerHTML = '<div class="stage-head"><input type="range" min="1" max="' + STAGES.length + '" value="1" aria-label="Stage"><span><button type="button" class="btn ghost" data-s="-1">&larr;</button> <button type="button" class="btn ghost" data-s="1">&rarr;</button></span></div><div class="stage"></div>';
  const range = $('input', el);
  const draw = () => {
    const i = +range.value - 1, s = STAGES[i];
    let o = '<h4>' + L('Stage ' + (i + 1) + ': ', '第 ' + (i + 1) + ' 階段：') + B(s.name) + '</h4><p class="small">' + B(s.users) + L(' (very rough, it depends on the product)', '（非常粗略，依產品而定）') + '</p><div class="tiers">';
    Object.keys(s.tiers).forEach(k => { o += '<b>' + B(TIER[k]) + '</b><div>' + s.tiers[k].map(x => '<span class="box' + (x[1] ? ' hot' : '') + '">' + B(x[0]) + '</span>').join('') + '</div>'; });
    o += '</div><p class="small">' + L('Green boxes are new at this stage.', '綠色的方塊是這一階段新增的。') + '</p><dl><dt>' + L('What pushed you here', '是什麼把你逼到這一步') + '</dt><dd>' + B(s.why) + '</dd><dt>' + L('The new problem you own', '你多出來的新問題') + '</dt><dd>' + B(s.cost) + '</dd><dt>' + L('Lessons', '相關課程') + '</dt><dd>' +
      s.links.filter(id => BY[id]).map(id => '<a href="#' + id + '">' + BY[id].num + ' ' + esc(lTitle(BY[id])) + '</a>').join(' · ') + '</dd></dl>';
    $('.stage', el).innerHTML = o;
  };
  range.addEventListener('input', draw);
  el.addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (b) { range.value = Math.max(1, Math.min(STAGES.length, +range.value + (+b.dataset.s))); draw(); } });
  draw();
};

const READY = [
  [['Proof of work (free, and worth more than any certificate)', '實績證明（免費，而且比任何證照都有份量）'], [
    ['p1', ['Architecture write-up of your own platform', '你自己平台的架構說明'], ['One page: the request path, every component, what fails if each one dies.', '一頁：請求怎麼走、每個元件做什麼、每個元件掛了會怎樣。']],
    ['p2', ['A repository that rebuilds one service from nothing', '一個能從零重建某個服務的儲存庫'], ['Infrastructure as code plus a pipeline. No hand-made steps.', '基礎設施即程式碼加上管線，沒有手工步驟。']],
    ['p3', ['Monitoring running on your servers', '在你伺服器上實際運作的監控'], ['A dashboard with the four signals, and four alerts that reach your phone.', '有四個訊號的儀表板，加上四個會通知到手機的警報。']],
    ['p4', ['One blameless postmortem of a real incident', '一份真實事故的不究責事後檢討'], ['Timeline, impact, contributing factors, actions.', '時間軸、影響、促成因素、行動。']],
    ['p5', ['A load-test report', '一份負載測試報告'], ['Where the knee was, which resource ran out, what you changed, the result after.', '曲線在哪裡彎上去、哪個資源先滿、你改了什麼、改完的結果。']],
    ['p6', ['A threat model and one fix it led to', '一份威脅模型，以及它帶出來的一項修正'], ['For example, moving the signing key into an isolated signer.', '例如把簽章金鑰搬進隔離的簽章服務。']],
    ['p7', ['A timed backup restore drill', '一次計時的備份還原演練'], ['Your real recovery time, written down.', '寫下你真正的復原時間。']],
    ['p8', ['A security assessment report on your own dev copy', '針對自己開發環境的資安評估報告'], ['Findings with severity, evidence, and fixes, in the standard format.', '用標準格式列出發現、嚴重程度、證據與修法。']]
  ]],
  [['Certificates (in this order, as money allows)', '證照（照這個順序，有預算再考）'], [
    ['c1', ['AWS Solutions Architect Associate', 'AWS Solutions Architect Associate'], ['The cheapest widely recognised one.', '最便宜、認可度又高的一張。']],
    ['c2', ['CKA (Kubernetes administrator)', 'CKA（Kubernetes 管理員）'], ['The strongest single DevOps signal. Hands-on exam.', 'DevOps 最強的單一訊號。實作考試。']],
    ['c3', ['Security+ or iPAS 資訊安全工程師', 'Security+ 或 iPAS 資訊安全工程師'], ['The security baseline. Both have appeared on Taiwan\'s official list.', '資安的基本門檻。兩張都曾列在台灣官方清單上。']]
  ]],
  [['Interview readiness', '面試準備'], [
    ['i1', ['I can draw the ten-million-user design in 30 minutes, out loud', '我能在 30 分鐘內邊講邊畫出千萬人架構'], ['Lesson 8.4.', '第 8.4 課。']],
    ['i2', ['I have answered every question in the question bank out loud, in English', '題庫的每一題我都用英文開口答過'], ['Lesson 9.5.', '第 9.5 課。']],
    ['i3', ['My resume describes results with numbers', '我的履歷用數字描述成果'], ['Lesson 9.4.', '第 9.4 課。']]
  ]]
];

W.ready = function (el) {
  const draw = () => {
    let total = 0, got = 0, o = '';
    READY.forEach(g => {
      o += '<p class="w-h">' + B(g[0]) + '</p>';
      g[1].forEach(it => {
        total++; if (S.ready[it[0]]) got++;
        o += '<label class="check"><input type="checkbox" data-r="' + it[0] + '"' + (S.ready[it[0]] ? ' checked' : '') + '><span>' + B(it[1]) + '<small>' + B(it[2]) + '</small></span></label>';
      });
    });
    const less = ALL.filter(l => (l.lv || 2) <= 3);
    const ld = less.filter(l => S.done[l.id]).length;
    o += '<p class="meter">' + L(
      '<b>' + got + ' of ' + total + '</b> items done · <b>' + ld + ' of ' + less.length + '</b> lessons up to Professional level completed.',
      '已完成 <b>' + got + '／' + total + '</b> 項 · 專業級以下的課完成 <b>' + ld + '／' + less.length + '</b> 課。') + '</p>';
    el.innerHTML = o;
  };
  if (!el.dataset.bound) {
    el.dataset.bound = '1';
    el.addEventListener('change', e => { const c = e.target.closest('[data-r]'); if (c) { S.ready[c.dataset.r] = c.checked; touch(); draw(); } });
  }
  draw();
};

/* ---------- pictures and demos for "how a computer works" ---------- */
const ln = (x1, y1, x2, y2, c) => '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" class="fg-l' + (c ? ' ' + c : '') + '"/>';
const pl = (pts, c) => '<polyline points="' + pts + '" class="fg-l' + (c ? ' ' + c : '') + '"/>';
const tx = (x, y, t, a, c) => '<text x="' + x + '" y="' + y + '" text-anchor="' + (a || 'middle') + '" class="fg-t' + (c ? ' ' + c : '') + '">' + t + '</text>';
const bx = (x, y, w, h, c) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" class="fg-b' + (c ? ' ' + c : '') + '"/>';
const dot = (x, y, c) => '<circle cx="' + x + '" cy="' + y + '" r="3.2" class="fg-a' + (c ? ' ' + c : '') + '"/>';
const lampS = (x, y, on) => '<circle cx="' + x + '" cy="' + y + '" r="13" class="fg-lamp' + (on ? ' on' : '') + '"/>' +
  (on ? [0, 45, 90, 135, 180, 225, 270, 315].map(d => { const r = d * Math.PI / 180; return ln((x + 18 * Math.cos(r)).toFixed(1), (y + 18 * Math.sin(r)).toFixed(1), (x + 24 * Math.cos(r)).toFixed(1), (y + 24 * Math.sin(r)).toFixed(1), 'on'); }).join('') : '');
/* arrow head pointing right (r), left (l), up (u) or down (d) with its tip at x,y */
const ah = (x, y, d, c) => {
  const p = d === 'r' ? [[x, y], [x - 8, y - 4.5], [x - 8, y + 4.5]] : d === 'l' ? [[x, y], [x + 8, y - 4.5], [x + 8, y + 4.5]] : d === 'd' ? [[x, y], [x - 4.5, y - 8], [x + 4.5, y - 8]] : [[x, y], [x - 4.5, y + 8], [x + 4.5, y + 8]];
  return '<polygon points="' + p.map(q => q.join(',')).join(' ') + '" class="fg-a' + (c ? ' ' + c : '') + '"/>';
};
const svgWrap = (w, h, inner, label) => '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(label) + '" class="fg" style="width:' + w + 'px">' + inner + '</svg>';
const figure = (el, svg, caption) => { el.innerHTML = '<figure class="figure">' + svg + '<figcaption>' + caption + '</figcaption></figure>'; };
const bitBtn = (k, v, label) => '<button type="button" class="bit' + (v ? ' on' : '') + '" data-k="' + k + '" aria-pressed="' + (v ? 'true' : 'false') + '">' + (label != null ? '<small>' + label + '</small>' : '') + '<b>' + v + '</b></button>';

/* a battery on the left, a lamp on the right, and whatever sits in the top wire between them */
function loopSVG(mid, lit, label) {
  const on = lit ? 'on' : '';
  return svgWrap(380, 128,
    ln(40, 30, 40, 52, on) + ln(27, 56, 53, 56) + ln(33, 64, 47, 64) + ln(40, 68, 40, 100, on) +
    ln(40, 30, 110, 30, on) + mid + ln(250, 30, 320, 30, on) + ln(320, 30, 320, 50, on) + lampS(320, 64, lit) + ln(320, 78, 320, 100, on) + ln(320, 100, 40, 100, on) +
    tx(40, 120, L('power', '電源'), 'middle', 'sm') + tx(320, 120, L('lamp', '燈'), 'middle', 'sm'), label);
}
/* one switch drawn between x and x+50 on the wire at height y */
const swS = (x, y, closed, name) => dot(x, y) + dot(x + 50, y) + (closed ? ln(x, y, x + 50, y, 'on') : ln(x, y, x + 44, y - 20)) + (name ? tx(x + 25, y + 20, name, 'middle', 'sm') : '');

W.circuit = function (el) {
  let v = 0;
  const draw = () => {
    el.innerHTML = loopSVG(swS(110, 30, v, L('switch', '開關')) + ln(160, 30, 250, 30, v ? 'on' : ''), v, L('A battery, a switch and a lamp in a loop', '電池、開關和燈接成一圈')) +
      '<p class="demo-row"><button type="button" class="btn" data-flip="1">' + L('Flip the switch', '撥一下開關') + '</button><span class="readout">' + (v ? L('<b>1</b> on: current flows, the lamp is lit', '<b>1</b> 開：電流通了，燈亮') : L('<b>0</b> off: the path is broken, the lamp is dark', '<b>0</b> 關：電路斷開，燈不亮')) + '</span></p>';
  };
  el.addEventListener('click', e => { if (e.target.closest('[data-flip]')) { v = v ? 0 : 1; draw(); } });
  draw();
};

W.bits = function (el) {
  const bits = [0, 0, 0, 0, 1, 1, 0, 1];
  const draw = () => {
    const n = bits.reduce((a, b) => a * 2 + b, 0);
    const ch = n >= 33 && n <= 126 ? String.fromCharCode(n) : (n === 32 ? L('a space', '空白') : L('(no printable letter)', '（不是可顯示的字元）'));
    el.innerHTML = '<div class="bitrow">' + bits.map((b, i) => bitBtn(i, b, Math.pow(2, 7 - i))).join('') + '</div>' +
      '<div class="out">' +
      '<div class="stat"><small>' + L('As an everyday number', '平常的數字') + '</small><b>' + n + '</b></div>' +
      '<div class="stat"><small>' + L('As a letter', '當成字元') + '</small><b>' + esc(ch) + '</b></div>' +
      '<div class="stat"><small>' + L('As a shade of grey', '當成灰階') + '</small><b><span class="swatch" style="background:rgb(' + n + ',' + n + ',' + n + ')"></span></b></div></div>' +
      '<p class="small">' + L('Eight switches. The number above each one is what it is worth when it is on. The same pattern means a number, a letter or a colour, depending on what we agree it stands for.', '八個開關。每個開關上面的數字，是它打開時代表的值。同一組開與關，要當成數字、字元還是顏色，全看我們怎麼約定。') + '</p>';
  };
  el.addEventListener('click', e => { const b = e.target.closest('.bit'); if (b) { const k = +b.dataset.k; bits[k] = bits[k] ? 0 : 1; draw(); } });
  draw();
};

const GATES = {
  AND: { f: (a, b) => a & b, two: true, say: ['Both switches are in one line. Current needs both.', '兩個開關排在同一條線上，兩個都要開，電才過得去。'] },
  OR: { f: (a, b) => a | b, two: true, say: ['The switches sit side by side. Either path will do.', '兩個開關並排，走哪一條都可以。'] },
  NOT: { f: a => (a ? 0 : 1), two: false, say: ['The output is the opposite of the input.', '輸出永遠跟輸入相反。'] },
  XOR: { f: (a, b) => a ^ b, two: true, say: ['The output is 1 only when the two inputs differ.', '兩個輸入不一樣，輸出才是 1。'] },
  NAND: { f: (a, b) => ((a & b) ? 0 : 1), two: true, say: ['An AND with its answer turned upside down.', '就是 AND，再把答案反過來。'] }
};

W.gates = function (el) {
  let g = 'AND', a = 0, b = 0;
  const draw = () => {
    const G = GATES[g], out = G.f(a, b);
    let mid;
    if (g === 'AND') mid = swS(110, 30, a, 'A') + ln(160, 30, 190, 30, a ? 'on' : '') + swS(190, 30, b, 'B') + ln(240, 30, 250, 30, out ? 'on' : '');
    else if (g === 'OR') mid = ln(110, 22, 110, 64) + ln(110, 22, 150, 22) + ln(110, 64, 150, 64) + swS(150, 22, a, 'A') + swS(150, 64, b, 'B') +
      ln(200, 22, 240, 22, a ? 'on' : '') + ln(200, 64, 240, 64, b ? 'on' : '') + ln(240, 22, 240, 64, out ? 'on' : '') + ln(240, 30, 250, 30, out ? 'on' : '');
    else mid = bx(140, 12, 80, 40, 'hot') + tx(180, 37, g, 'middle', 'acc') + ln(110, 30, 140, 30) + ln(220, 30, 250, 30, out ? 'on' : '') +
      tx(180, 70, G.two ? 'A = ' + a + '   B = ' + b : 'A = ' + a, 'middle', 'sm');
    const rows = G.two ? [[0, 0], [0, 1], [1, 0], [1, 1]] : [[0], [1]];
    el.innerHTML = '<div class="chips">' + Object.keys(GATES).map(k => '<button type="button" data-g="' + k + '"' + (k === g ? ' class="on"' : '') + '>' + k + '</button>').join('') + '</div>' +
      loopSVG(mid, out, g + ' gate') +
      '<div class="demo-row">' + bitBtn('a', a, 'A') + (G.two ? bitBtn('b', b, 'B') : '') + '<span class="readout">' + L('Output: ', '輸出：') + '<b>' + out + '</b> · ' + B(G.say) + '</span></div>' +
      '<table class="tt"><tr><th>A</th>' + (G.two ? '<th>B</th>' : '') + '<th>' + L('Output', '輸出') + '</th></tr>' +
      rows.map(r => '<tr' + ((r[0] === a && (!G.two || r[1] === b)) ? ' class="cur"' : '') + '><td>' + r[0] + '</td>' + (G.two ? '<td>' + r[1] + '</td>' : '') + '<td>' + G.f(r[0], r[1]) + '</td></tr>').join('') + '</table>';
  };
  el.addEventListener('click', e => {
    const gb = e.target.closest('[data-g]'); if (gb) { g = gb.dataset.g; draw(); return; }
    const bt = e.target.closest('.bit'); if (bt) { if (bt.dataset.k === 'a') a = a ? 0 : 1; else b = b ? 0 : 1; draw(); }
  });
  draw();
};

W['fig-transistor'] = function (el) {
  const one = (ox, on) => ln(ox + 100, 16, ox + 100, 52, on ? 'on' : '') + bx(ox + 86, 52, 28, 46, on ? 'hot' : '') + ln(ox + 100, 98, ox + 100, 134, on ? 'on' : 'dim') +
    (on ? ah(ox + 100, 134, 'd', 'on') : '') + ln(ox + 26, 75, ox + 74, 75, on ? 'on' : '') + ln(ox + 76, 58, ox + 76, 92, on ? 'on' : '') +
    tx(ox + 112, 26, L('in', '入'), 'start', 'sm') + tx(ox + 112, 130, L('out', '出'), 'start', 'sm') + tx(ox + 24, 66, L('control', '控制'), 'start', 'sm') +
    tx(ox + 100, 158, on ? L('control = 1: current flows', '控制 = 1：電流通過') : L('control = 0: no current', '控制 = 0：電流不通'), 'middle', on ? 'acc' : '');
  figure(el, svgWrap(420, 168, one(0, false) + ln(210, 14, 210, 150, 'dim') + one(210, true), L('A transistor with its control off and on', '電晶體：控制腳沒電與有電')),
    L('A transistor is a switch with three connections. A voltage on the control opens the path from in to out.', '電晶體是有三隻腳的開關。控制腳有電壓，「入」到「出」的路就通了。'));
};

W['fig-wafer'] = function (el) {
  const id = 'wf' + Math.random().toString(36).slice(2, 8);
  let grid = '';
  for (let i = 0; i <= 8; i++) grid += ln(22 + i * 14.5, 17, 22 + i * 14.5, 133) + ln(22, 17 + i * 14.5, 138, 17 + i * 14.5);
  let pins = '';
  for (let i = 0; i < 5; i++) pins += ln(346 + i * 15, 46, 346 + i * 15, 54) + ln(346 + i * 15, 96, 346 + i * 15, 104) + ln(328, 60 + i * 7.5, 336, 60 + i * 7.5) + ln(416, 60 + i * 7.5, 424, 60 + i * 7.5);
  figure(el, svgWrap(450, 168,
    '<defs><clipPath id="' + id + '"><circle cx="80" cy="75" r="58"/></clipPath></defs>' +
    '<g clip-path="url(#' + id + ')" opacity=".55">' + grid + '</g><circle cx="80" cy="75" r="58" class="fg-l"/>' + '<rect x="65.5" y="60.5" width="14.5" height="14.5" class="fg-b hot"/>' +
    ln(150, 75, 196, 75) + ah(198, 75, 'r') +
    bx(208, 47, 56, 56, 'hot') + ln(222, 61, 250, 61) + ln(222, 75, 250, 75) + ln(222, 89, 250, 89) + ln(236, 55, 236, 95) +
    ln(276, 75, 316, 75) + ah(318, 75, 'r') +
    bx(336, 54, 80, 42) + pins + tx(376, 80, 'CPU', 'middle', 'sm') +
    tx(80, 156, L('wafer: round', '晶圓：圓的'), 'middle', 'sm') + tx(236, 156, L('one chip: square', '一顆晶片：方的'), 'middle', 'sm') + tx(376, 156, L('in its package', '封裝好'), 'middle', 'sm'),
    L('A round wafer, one chip cut from it, and the chip in its package', '圓形晶圓、切下來的一顆晶片、封裝好的晶片')),
    L('Hundreds of identical chips are printed on one round wafer, then cut apart and packaged.', '一片圓形晶圓上會印出幾百顆一模一樣的晶片，再切開、封裝。'));
};

W['fig-halfadder'] = function (el) {
  figure(el, svgWrap(400, 150,
    tx(30, 42, 'A') + tx(30, 116, 'B') +
    ln(44, 38, 170, 38) + ln(90, 38, 90, 98) + ln(90, 98, 170, 98) + dot(90, 38) +
    ln(44, 112, 170, 112) + ln(120, 112, 120, 52) + ln(120, 52, 170, 52) + dot(120, 112) +
    bx(170, 25, 76, 40, 'hot') + tx(208, 50, 'XOR', 'middle', 'acc') + bx(170, 85, 76, 40, 'hot') + tx(208, 110, 'AND', 'middle', 'acc') +
    ln(246, 45, 300, 45) + ah(302, 45, 'r') + ln(246, 105, 300, 105) + ah(302, 105, 'r') +
    tx(310, 49, L('sum', '和'), 'start') + tx(310, 109, L('carry', '進位'), 'start'),
    L('A half adder: inputs A and B feed an XOR gate and an AND gate', '半加器：A 和 B 同時接到 XOR 閘和 AND 閘')),
    L('A half adder. Both inputs go to both gates. XOR gives the sum bit and AND gives the carry.', '半加器。兩個輸入同時送進兩個閘：XOR 算出「和」，AND 算出「進位」。'));
};

W.adder = function (el) {
  const A = [0, 1, 1, 0], Bv = [0, 0, 1, 1];
  const draw = () => {
    const sum = [], carry = [0, 0, 0, 0, 0];           // carry[i] is the carry INTO column i (0 = rightmost)
    for (let i = 0; i < 4; i++) { const a = A[3 - i], b = Bv[3 - i], c = carry[i]; sum[i] = a ^ b ^ c; carry[i + 1] = (a & b) | (c & (a ^ b)); }
    const da = A.reduce((x, y) => x * 2 + y, 0), db = Bv.reduce((x, y) => x * 2 + y, 0);
    const cell = (v, c) => '<td' + (c ? ' class="' + c + '"' : '') + '>' + v + '</td>';
    el.innerHTML = '<table class="addt">' +
      '<tr><th>' + L('carry', '進位') + '</th>' + [4, 3, 2, 1].map(i => cell(carry[i] ? '1' : '', carry[i] ? 'cy' : '')).join('') + cell('') + '</tr>' +
      '<tr><th>A</th>' + cell('') + A.map((v, i) => '<td>' + bitBtn('a' + i, v) + '</td>').join('') + '</tr>' +
      '<tr><th>B</th>' + cell('+') + Bv.map((v, i) => '<td>' + bitBtn('b' + i, v) + '</td>').join('') + '</tr>' +
      '<tr class="sumr"><th>' + L('sum', '和') + '</th>' + cell(carry[4]) + [3, 2, 1, 0].map(i => cell(sum[i])).join('') + '</tr></table>' +
      '<p class="readout big">' + da + ' + ' + db + ' = <b>' + (da + db) + '</b></p>' +
      '<p class="small">' + L('Click the bits of A and B. Each column adds its two bits and the carry from the column on its right. A carry (green) moves one column to the left.', '點 A 和 B 的位元。每一行把自己的兩個位元，加上右邊那一行送來的進位。進位（綠色）會往左移一行。') + '</p>';
  };
  el.addEventListener('click', e => { const b = e.target.closest('.bit'); if (b) { const k = b.dataset.k, i = +k.slice(1); if (k[0] === 'a') A[i] = A[i] ? 0 : 1; else Bv[i] = Bv[i] ? 0 : 1; draw(); } });
  draw();
};

W.latch = function (el) {
  let q = 0, s = 0, r = 0, said = 0, timer = null;
  const SAY = [
    ['The loop is holding 0. Press Set to store a 1.', '迴圈現在撐著 0。按「設定」存進一個 1。'],
    ['Set is pressed: the 1 enters the OR gate and travels round to the output.', '按下「設定」：這個 1 進了 OR 閘，一路走到輸出。'],
    ['Set has been released. Nothing is pressing now. The 1 keeps going round the green loop and holds itself there. That is a remembered bit.', '「設定」已經放開，現在沒有人在按。那個 1 沿著綠色的迴圈一直繞，自己把自己撐住。這就是記住了一個位元。'],
    ['Reset is pressed: the AND gate is cut off, so the loop is broken and the 1 drains away.', '按下「重設」：AND 閘被切斷，迴圈斷開，那個 1 就流掉了。'],
    ['Reset has been released. The loop is whole again and now holds 0, just as firmly.', '「重設」已經放開。迴圈又接好了，現在同樣穩穩地撐著 0。']
  ];
  const draw = () => {
    const orOut = s || q, notR = r ? 0 : 1, c = v => (v ? 'on' : '');
    el.innerHTML = svgWrap(460, 172,
      tx(18, 69, L('Set', '設定'), 'start', s ? 'acc' : '') + ln(60, 65, 120, 65, c(s)) +
      bx(120, 30, 70, 50, 'hot') + tx(155, 60, 'OR', 'middle', 'acc') +
      ln(190, 55, 250, 55, c(orOut)) +
      bx(250, 40, 70, 50, 'hot') + tx(285, 70, 'AND', 'middle', 'acc') +
      ln(320, 65, 388, 65, c(q)) + lampS(410, 65, q) + tx(410, 104, L('output', '輸出'), 'middle', 'sm') +
      dot(350, 65, c(q)) + pl('350,65 350,20 95,20 95,45 120,45', c(q)) + ah(120, 45, 'r', c(q)) + tx(222, 13, L('the loop: output goes back in', '迴圈：輸出接回輸入'), 'middle', 'sm') +
      tx(18, 134, L('Reset', '重設'), 'start', r ? 'acc' : '') + ln(60, 130, 120, 130, c(r)) +
      bx(120, 113, 56, 34) + tx(148, 135, 'NOT', 'middle', 'sm') + pl('176,130 225,130 225,75 250,75', c(notR)),
      L('A memory cell: an OR gate and an AND gate with the output wired back to the input', '記憶單元：OR 閘加 AND 閘，輸出接回輸入')) +
      '<p class="demo-row"><button type="button" class="btn" data-m="s">' + L('Set (store 1)', '設定（存 1）') + '</button><button type="button" class="btn ghost" data-m="r">' + L('Reset (store 0)', '重設（存 0）') + '</button>' +
      '<span class="readout">' + L('Remembered value: ', '記住的值：') + '<b>' + q + '</b></span></p><p class="small">' + B(SAY[said]) + '</p>';
  };
  const pulse = which => {
    clearTimeout(timer);
    if (which === 's') { s = 1; r = 0; q = 1; said = 1; } else { r = 1; s = 0; q = 0; said = 3; }
    draw();
    timer = setTimeout(() => { s = 0; r = 0; said = which === 's' ? 2 : 4; draw(); }, 1100);
  };
  el.addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (b) pulse(b.dataset.m); });
  draw();
};

W.ram = function (el) {
  const mem = [7, 0, 42, 0, 0, 13, 0, 0];
  let cur = 5, msg = null;
  const draw = () => {
    el.innerHTML = '<div class="ramrow">' + mem.map((v, i) => '<button type="button" class="ramcell' + (i === cur ? ' on' : '') + '" data-i="' + i + '"><small>' + L('box ', '格子 ') + i + '</small><b>' + v + '</b></button>').join('') + '</div>' +
      '<p class="demo-row"><label class="small">' + L('Address', '位址') + ' <input class="w-in" type="number" min="0" max="7" value="' + cur + '" data-f="addr" style="width:64px"></label>' +
      '<label class="small">' + L('Value', '值') + ' <input class="w-in" type="number" min="0" max="255" value="' + mem[cur] + '" data-f="val" style="width:80px"></label>' +
      '<button type="button" class="btn ghost" data-m="read">' + L('Read', '讀') + '</button><button type="button" class="btn" data-m="write">' + L('Write', '寫') + '</button></p>' +
      '<p class="small">' + (msg || L('Memory is a row of numbered boxes. To use one you give its number, the address. Pick a box, then read it or write a new value into it.', '記憶體是一排編了號的格子。要用哪一格，就報它的號碼，也就是位址。選一格，然後讀它，或寫一個新的值進去。')) + '</p>';
  };
  const clamp = (v, hi) => Math.max(0, Math.min(hi, Math.round(+v) || 0));
  el.addEventListener('click', e => {
    const c = e.target.closest('.ramcell'); if (c) { cur = +c.dataset.i; msg = null; draw(); return; }
    const b = e.target.closest('[data-m]'); if (!b) return;
    cur = clamp($('[data-f=addr]', el).value, 7);
    if (b.dataset.m === 'write') { mem[cur] = clamp($('[data-f=val]', el).value, 255); msg = L('Wrote ' + mem[cur] + ' into box ' + cur + '. Whatever was there before is gone.', '把 ' + mem[cur] + ' 寫進格子 ' + cur + '。原本放在裡面的東西就不見了。'); }
    else msg = L('Box ' + cur + ' holds ' + mem[cur] + '. Reading does not change it.', '格子 ' + cur + ' 裡面是 ' + mem[cur] + '。讀它不會改變內容。');
    draw();
  });
  draw();
};

W['fig-clock'] = function (el) {
  let wave = '30,84', marks = '';
  for (let i = 0; i < 4; i++) { const x = 60 + i * 90; wave += ' ' + x + ',84 ' + x + ',40 ' + (x + 45) + ',40 ' + (x + 45) + ',84'; marks += ln(x, 30, x, 16, 'on') + ah(x, 34, 'd', 'on') + tx(x, 11, L('tick', '滴'), 'middle', 'acc'); }
  wave += ' 420,84';
  figure(el, svgWrap(440, 128, tx(16, 44, '1', 'middle', 'sm') + tx(16, 88, '0', 'middle', 'sm') + pl(wave) + marks +
    ln(60, 104, 150, 104, 'dim') + ln(60, 99, 60, 109, 'dim') + ln(150, 99, 150, 109, 'dim') + tx(105, 121, L('one cycle', '一個週期'), 'middle', 'sm'),
    L('A clock signal: a square wave with a tick at each rise', '時脈訊號：方波，每次上升就是一拍')),
    L('The clock flips between 0 and 1 at a steady rate. Every register takes its new value at the same instant, on each tick. At 3 GHz one cycle lasts a third of a billionth of a second.', '時脈以固定的速度在 0 和 1 之間切換。所有暫存器都在同一瞬間、也就是每一拍，收下新的值。3 GHz 的話，一個週期只有十億分之一秒的三分之一。'));
};

W['fig-tower'] = function (el) {
  const rows = [
    [['Apps and websites', '應用程式與網站'], ['what you use', '你在用的東西']],
    [['Operating system', '作業系統'], ['shares the machine between programs', '把機器分給各個程式用']],
    [['Programming languages', '程式語言'], ['code people can read, translated by a compiler', '人看得懂的程式碼，由編譯器翻譯']],
    [['Machine code', '機器碼'], ['instructions stored as numbers', '用數字存起來的指令']],
    [['The CPU cycle', 'CPU 的循環'], ['fetch, decode, execute, repeat', '擷取、解碼、執行，一直重複']],
    [['Adders, registers, memory, clock', '加法器、暫存器、記憶體、時脈'], ['circuits that calculate and remember', '會算、會記的電路']],
    [['Logic gates', '邏輯閘'], ['AND, OR, NOT', 'AND、OR、NOT']],
    [['Transistors', '電晶體'], ['switches: 0 and 1', '開關：0 和 1']]
  ];
  el.innerHTML = '<figure class="figure"><div class="tower">' + rows.map((r, i) => '<div class="tw' + (i === rows.length - 1 ? ' base' : '') + '"><b>' + B(r[0]) + '</b><span>' + B(r[1]) + '</span></div>').join('<i>&uarr;</i>') + '</div><figcaption>' +
    L('Read it from the bottom. Each layer is built only from the layer beneath it.', '從最下面往上讀。每一層都只用它下面那一層蓋出來。') + '</figcaption></figure>';
};

/* A complete 16-box computer. Each instruction is stored as one number: operation * 16 + address. */
const OPS = ['HALT', 'LOAD', 'ADD', 'STORE', 'SUB', 'JUMPZ', 'JUMP'];
const CPU_PROG = [[1, 14], [2, 13], [3, 14], [1, 13], [4, 15], [3, 13], [5, 8], [6, 0], [0, 0]];
const CPU_NAMES = { 13: ['n', 'n'], 14: ['total', '總和'], 15: ['one', '一'] };
function cpuFresh() {
  const mem = new Array(16).fill(0);
  CPU_PROG.forEach((p, i) => { mem[i] = p[0] * 16 + p[1]; });
  mem[13] = 5; mem[14] = 0; mem[15] = 1;
  return { mem: mem, pc: 0, ir: 0, acc: 0, phase: 0, halted: false, steps: 0, touch: -1, say: null };
}
const cpuWhere = a => (CPU_NAMES[a] ? L('box ' + a + ' (' + CPU_NAMES[a][0] + ')', '格子 ' + a + '（' + CPU_NAMES[a][1] + '）') : L('box ' + a, '格子 ' + a));

W.cpu = function (el) {
  let c = cpuFresh(), run = null;
  const meaning = (op, a) => [
    L('stop', '停止'),
    L('copy the number in ' + cpuWhere(a) + ' into the working register', '把' + cpuWhere(a) + '的數字複製到工作暫存器'),
    L('add the number in ' + cpuWhere(a) + ' to the working register', '把' + cpuWhere(a) + '的數字加到工作暫存器'),
    L('copy the working register into ' + cpuWhere(a), '把工作暫存器的數字存進' + cpuWhere(a)),
    L('subtract the number in ' + cpuWhere(a) + ' from the working register', '把工作暫存器減掉' + cpuWhere(a) + '的數字'),
    L('if the working register is 0, continue from box ' + a, '如果工作暫存器是 0，就跳到格子 ' + a + ' 繼續'),
    L('continue from box ' + a, '跳到格子 ' + a + ' 繼續')
  ][op];
  const step = () => {
    if (c.halted) return;
    c.steps++;
    if (c.phase === 0) {
      c.ir = c.mem[c.pc]; c.touch = c.pc;
      c.say = L('<b>Fetch.</b> The program counter says ' + c.pc + ', so read box ' + c.pc + '. It holds the number ' + c.ir + '.', '<b>擷取。</b>程式計數器是 ' + c.pc + '，所以去讀格子 ' + c.pc + '。裡面的數字是 ' + c.ir + '。');
      c.phase = 1;
    } else if (c.phase === 1) {
      const op = c.ir >> 4, a = c.ir & 15; c.touch = -1;
      c.say = L('<b>Decode.</b> ' + c.ir + ' means ' + OPS[op] + (op ? ' ' + a : '') + ': ' + meaning(op, a) + '.', '<b>解碼。</b>' + c.ir + ' 的意思是 ' + OPS[op] + (op ? ' ' + a : '') + '：' + meaning(op, a) + '。');
      c.phase = 2;
    } else {
      const op = c.ir >> 4, a = c.ir & 15; let next = c.pc + 1, did;
      c.touch = (op >= 1 && op <= 4) ? a : -1;
      if (op === 1) { c.acc = c.mem[a]; did = L('The working register is now ' + c.acc + '.', '工作暫存器現在是 ' + c.acc + '。'); }
      else if (op === 2) { c.acc += c.mem[a]; did = L('The adder gives ' + c.acc + '.', '加法器算出 ' + c.acc + '。'); }
      else if (op === 3) { c.mem[a] = c.acc; did = L(cpuWhere(a) + ' now holds ' + c.acc + '.', cpuWhere(a) + '現在是 ' + c.acc + '。'); }
      else if (op === 4) { c.acc -= c.mem[a]; did = L('The result is ' + c.acc + '.', '結果是 ' + c.acc + '。'); }
      else if (op === 5) { if (c.acc === 0) { next = a; did = L('It is 0, so jump to box ' + a + '.', '是 0，所以跳到格子 ' + a + '。'); } else did = L('It is ' + c.acc + ', not 0, so carry straight on.', '是 ' + c.acc + '，不是 0，所以照順序往下。'); }
      else if (op === 6) { next = a; did = L('Jump back to box ' + a + ' and go round again.', '跳回格子 ' + a + '，再繞一圈。'); }
      else { c.halted = true; did = L('The program has finished. The total is ' + c.mem[14] + ', after ' + c.steps + ' steps round the cycle.', '程式跑完了。總和是 ' + c.mem[14] + '，總共繞了 ' + c.steps + ' 步。'); }
      if (!c.halted) c.pc = next;
      c.say = L('<b>Execute.</b> ', '<b>執行。</b>') + did;
      c.phase = 0;
    }
  };
  const ring = () => {
    const act = (c.halted || !c.steps) ? -1 : (c.phase + 2) % 3;      // the phase just completed
    const node = (x, y, i, en, zh) => bx(x - 38, y - 15, 76, 30, act === i ? 'hot' : '') + tx(x, y + 4, L(en, zh), 'middle', act === i ? 'acc' : '');
    return svgWrap(230, 190,
      '<circle cx="115" cy="100" r="62" class="fg-l dim"/>' +
      ah(176, 86, 'd') + ah(86, 157, 'l') + ah(66, 62, 'u') +
      node(115, 38, 0, 'Fetch', '擷取') + node(170, 132, 1, 'Decode', '解碼') + node(60, 132, 2, 'Execute', '執行'),
      L('The instruction cycle: fetch, decode, execute, and back to fetch', '指令週期：擷取、解碼、執行，再回到擷取'));
  };
  const draw = () => {
    const op = c.ir >> 4, a = c.ir & 15;
    let cells = '';
    for (let i = 0; i < 16; i++) {
      const v = c.mem[i], isCode = i < CPU_PROG.length;
      const label = isCode ? OPS[v >> 4] + ((v >> 4) ? ' ' + (v & 15) : '') : (CPU_NAMES[i] ? B(CPU_NAMES[i]) : '');
      cells += '<div class="memc' + (i === c.pc && !c.halted ? ' pc' : '') + (i === c.touch ? ' touch' : '') + (isCode ? '' : ' data') + '"><small>' + i + '</small><b>' + v + '</b><span>' + label + '</span></div>';
    }
    el.innerHTML = '<div class="cpu"><div class="cpu-l">' + ring() +
      '<div class="regs"><div><small>' + L('Program counter', '程式計數器') + '</small><b>' + c.pc + '</b></div><div><small>' + L('Current instruction', '目前的指令') + '</small><b>' + (c.steps ? c.ir : '-') + '</b><span>' + (c.steps ? OPS[op] + (op ? ' ' + a : '') : '') + '</span></div><div><small>' + L('Working register', '工作暫存器') + '</small><b>' + c.acc + '</b></div></div></div>' +
      '<div class="cpu-r"><p class="w-h">' + L('Memory: 16 boxes', '記憶體：16 個格子') + '</p><div class="memgrid">' + cells + '</div>' +
      '<p class="small">' + L('Boxes 0 to 8 hold the program. Boxes 13 to 15 hold its data. The outlined box is where the program counter points.', '格子 0 到 8 放程式，格子 13 到 15 放資料。有外框的那一格，就是程式計數器指著的地方。') + '</p></div></div>' +
      '<p class="demo-row"><button type="button" class="btn" data-m="step"' + (c.halted ? ' disabled' : '') + '>' + L('Step', '走一步') + '</button><button type="button" class="btn ghost" data-m="run"' + (c.halted ? ' disabled' : '') + '>' + (run ? L('Pause', '暫停') : L('Run', '自動跑')) + '</button><button type="button" class="btn ghost" data-m="reset">' + L('Start again', '重來') + '</button>' +
      '<span class="readout">' + L('total = ', '總和 = ') + '<b>' + c.mem[14] + '</b></span></p>' +
      '<p class="cpu-say">' + (c.say || L('Press Step. The CPU will fetch the instruction in box 0.', '按「走一步」。CPU 會先去拿格子 0 裡的指令。')) + '</p>';
  };
  const stop = () => { if (run) { clearInterval(run); run = null; } };
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-m]'); if (!b) return;
    const m = b.dataset.m;
    if (m === 'step') { stop(); step(); }
    else if (m === 'reset') { stop(); c = cpuFresh(); }
    else if (m === 'run') { if (run) stop(); else run = setInterval(() => { if (!el.isConnected) { stop(); return; } step(); if (c.halted) stop(); draw(); }, 420); }
    draw();
  });
  draw();
};

/* ---------- progress code (carry progress between devices) ---------- */
function exportCode() {
  const json = JSON.stringify({ v: 1, done: S.done, quiz: S.quiz, ready: S.ready });
  return 'OPS1.' + btoa(unescape(encodeURIComponent(json)));
}
function importCode(code) {
  const m = String(code || '').trim().match(/^OPS1\.([A-Za-z0-9+/=]+)$/);
  if (!m) return false;
  let o;
  try { o = JSON.parse(decodeURIComponent(escape(atob(m[1])))); } catch (e) { return false; }
  if (!o || typeof o !== 'object') return false;
  ['done', 'quiz', 'ready'].forEach(k => {
    if (o[k] && typeof o[k] === 'object') Object.keys(o[k]).forEach(id => { if (o[k][id]) S[k][id] = o[k][id]; });
  });
  touch();
  return true;
}

/* ---------- progress saved with the page (only inside claude.ai) ---------- */
let cloud = null;
let cloudState = (window.claude && typeof window.claude.use === 'function') ? 'connecting' : 'off';
let pushTimer = null, pushing = false, pushAgain = false;

const hasProgress = () => Object.keys(S.done).length + Object.keys(S.quiz).length + Object.keys(S.ready).length > 0;
/* Call after every change to progress: stamps it, saves locally, and queues one write to the store. */
function touch() { S.t = Date.now(); save(); schedulePush(); }
function schedulePush() { if (!cloud) return; clearTimeout(pushTimer); pushTimer = setTimeout(pushNow, 900); }
async function pushNow() {
  if (!cloud) return;
  if (pushing) { pushAgain = true; return; }
  pushing = true;
  try {
    await cloud.ref.set(JSON.parse(JSON.stringify({ v: 1, t: S.t || 0, done: S.done, quiz: S.quiz, ready: S.ready, last: S.last || '' })));
  } catch (e) {
    const c = e && e.code;
    if (c === 'invalid_argument' || c === 'revoked' || c === 'not_granted' || c === 'capability_disabled') { cloud = null; cloudState = 'unavailable'; updateSyncNote(); }
  }
  pushing = false;
  if (pushAgain) { pushAgain = false; schedulePush(); }
}
function adopt(d) {
  ['done', 'quiz', 'ready'].forEach(k => { S[k] = (d[k] && typeof d[k] === 'object') ? JSON.parse(JSON.stringify(d[k])) : {}; });
  if (d.last && BY[d.last]) S.last = d.last;
  S.t = d.t || 0;
  save();
  route(true);
}
function startCloud() {
  if (cloudState === 'off') return;
  const fail = () => { cloud = null; cloudState = 'unavailable'; updateSyncNote(); };
  Promise.all([window.claude.use('db'), window.claude.use('user')]).then(res => {
    const db = res[0], user = res[1];
    if (!db) return fail();
    Promise.resolve(user ? user.isOwner() : false).then(owner => {
      if (!owner) return fail();
      let ref;
      try { ref = db.doc('sync/progress'); } catch (e) { return fail(); }
      cloud = { ref: ref };
      let first = true;
      const timer = setTimeout(() => { if (cloudState === 'connecting') { cloudState = 'slow'; updateSyncNote(); } }, 10000);
      ref.onSnapshot(snap => {
        const meta = snap.metadata || {};
        if (meta.hasPendingWrites) return;
        if (!meta.fromCache) { clearTimeout(timer); if (cloudState !== 'on') { cloudState = 'on'; updateSyncNote(); } }
        const d = snap.exists ? snap.data() : null;
        if (d && (d.t || 0) > (S.t || 0)) adopt(d);
        else if (first && !meta.fromCache && hasProgress() && (!d || (S.t || 0) > (d.t || 0))) schedulePush();
        if (!meta.fromCache) first = false;
      }, () => { clearTimeout(timer); fail(); });
    }, fail);
  }, fail);
}
function syncHTML() {
  if (cloudState === 'on') return '<p>' + L('Your progress is saved with this page. Open the page on any device where you are signed in to Claude and it will be there.', '進度會跟著這個頁面存起來。在任何登入 Claude 的裝置打開這一頁，進度都在。') + '</p>';
  if (cloudState === 'connecting') return '<p>' + L('Looking for your saved progress.', '正在讀取你存下來的進度。') + '</p>';
  if (cloudState === 'slow') return '<p>' + L('Your saved progress cannot be reached yet. What you do now is kept on this device and saved when the connection returns.', '暫時連不上你存下來的進度。現在做的會先留在這台裝置，等連上了再存回去。') + '</p>';
  return '<p>' + L('Your progress is saved in this browser only. To carry it to your phone or another computer, copy the code here and paste it there.', '進度只存在這個瀏覽器裡。要帶到手機或另一台電腦：在這裡複製進度碼，到另一台裝置貼上。') + '</p>' +
    '<p><button type="button" class="btn ghost" data-act="exportprog">' + L('Copy my progress code', '複製我的進度碼') + '</button></p>' +
    '<p class="sync-row"><input class="w-in" id="sync-in" type="text" autocomplete="off" placeholder="' + L('Paste a progress code here', '把進度碼貼在這裡') + '"><button type="button" class="btn ghost" data-act="importprog">' + L('Load this code', '載入這組進度') + '</button><span class="small" id="sync-msg"></span></p>';
}
function updateSyncNote() { const b = $('#sync-box'); if (b) b.innerHTML = syncHTML(); }

/* ---------- events ---------- */
function copyText(text, btn, doneLabel) {
  const label = btn.textContent;
  const ok = () => { btn.textContent = doneLabel || L('Copied', '已複製'); setTimeout(() => { btn.textContent = label; }, 1400); };
  const fallback = () => {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); ok(); } catch (e) {}
    ta.remove();
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fallback);
  else fallback();
}

main.addEventListener('click', e => {
  const copy = e.target.closest('.copy');
  if (copy) { copyText(copy.dataset.copy, copy); return; }
  const opt = e.target.closest('.opt');
  if (opt) {
    const qEl = opt.closest('.q');
    if (!qEl || qEl.classList.contains('answered')) return;
    const qi = +qEl.dataset.q, ai = +opt.dataset.a, q = currentQuiz[qi];
    showAnswer(qEl, q, ai);
    if (quizCtx && quizCtx.mode === 'lesson') {
      const id = quizCtx.lesson.id;
      S.quiz[id] = S.quiz[id] || {};
      S.quiz[id][qi] = ai;
      touch();
    } else if (quizCtx && quizCtx.mode === 'review') {
      quizCtx.n++; if (ai === q.c) quizCtx.right++;
      const sc = $('#rv-score');
      if (sc) {
        const fin = quizCtx.n === currentQuiz.length;
        sc.textContent = L(quizCtx.right + ' right out of ' + quizCtx.n + ' answered' + (fin ? '. Open the linked lesson for any you missed.' : ''),
          '已答 ' + quizCtx.n + ' 題，答對 ' + quizCtx.right + ' 題' + (fin ? '。答錯的可以點連結回到那一課。' : ''));
      }
    }
    return;
  }
  const act = e.target.closest('[data-act]');
  if (!act) return;
  const a = act.dataset.act;
  const l = BY[active];
  if (a === 'done' && l) {
    S.done[l.id] = true; touch();
    const next = ALL[l.i + 1];
    if (next) location.hash = '#' + next.id; else location.hash = '#home';
  } else if (a === 'undone' && l) {
    delete S.done[l.id]; touch(); route(true);
  } else if (a === 'resetquiz' && l) {
    delete S.quiz[l.id]; touch(); route(true);
  } else if (a === 'newreview') {
    route();
  } else if (a === 'exportprog') {
    copyText(exportCode(), act);
  } else if (a === 'importprog') {
    const inp = $('#sync-in');
    const ok = importCode(inp ? inp.value : '');
    if (ok) route(true);
    const msg = $('#sync-msg');
    if (msg) msg.textContent = ok ? L('Progress merged.', '進度已合併。') : L('That is not a valid progress code.', '這不是有效的進度碼。');
  }
});

const themeBtn = $('#theme');   // absent on the claude.ai page, where the viewer's own theme applies
if (themeBtn) themeBtn.addEventListener('click', () => {
  const t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  S.theme = t; save();
});
$('#lang').addEventListener('click', () => {
  LANG = zhOn() ? 'en' : 'zh';
  S.lang = LANG; save();
  route(true);
});
$('#menu').addEventListener('click', () => document.body.classList.toggle('nav'));

const strip = h => String(h || '').replace(/<[^>]+>/g, ' ');
const INDEX = ALL.map(l => {
  const z = ZLES[l.id] || {};
  return {
    l: l,
    title: (l.num + ' ' + l.title + ' ' + (z.title || '')).toLowerCase(),
    text: (l.zh + ' ' + strip(l.body) + ' ' + strip(z.body) + ' ' + (l.terms || []).map(t => t.join(' ')).join(' ')).toLowerCase()
  };
});
$('#q').addEventListener('input', e => {
  const v = e.target.value.trim().toLowerCase();
  const box = $('#hits');
  if (v.length < 2) { box.hidden = true; return; }
  const a = INDEX.filter(x => x.title.includes(v));
  const b = INDEX.filter(x => !x.title.includes(v) && x.text.includes(v));
  const r = a.concat(b).slice(0, 8);
  box.innerHTML = r.length ? r.map(x => '<a href="#' + x.l.id + '"><small>' + x.l.num + '</small>' + esc(lTitle(x.l)) + '</a>').join('') : '<p>' + L('No lesson matches.', '找不到相符的課。') + '</p>';
  box.hidden = false;
});
document.addEventListener('click', e => { if (!e.target.closest('.search')) $('#hits').hidden = true; });

/* ---------- router ---------- */
function route(keepScroll) {
  const y = window.scrollY;
  const h = location.hash.replace(/^#\/?(l\/)?/, '');   // plain names; the older #/l/<id> form still works
  document.body.classList.remove('nav');
  $('#hits').hidden = true;
  if (BY[h]) { active = h; openMods[BY[active].mod.id] = true; viewLesson(BY[active]); }
  else if (h === 'glossary') { active = 'glossary'; viewGlossary(); }
  else if (h === 'tools') { active = 'tools'; viewTools(); }
  else if (h === 'review') { active = 'review'; viewReview(); }
  else { active = 'home'; viewHome(); }
  renderSide();
  renderTop();
  window.scrollTo(0, keepScroll === true ? y : 0);
}
window.addEventListener('hashchange', () => route());
route();
startCloud();
})();
