#!/usr/bin/env node
// Checks that each Chinese module in content/zh/ matches the structure of its English module in content/.
// Usage: node tools/check-zh.js            (all modules)
//        node tools/check-zh.js m3-data    (one or more by name)
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
const all = fs.readdirSync(path.join(root, 'content')).filter(f => /^m\d.*\.js$/.test(f)).map(f => f.replace(/\.js$/, '')).sort();
const names = process.argv.slice(2).length ? process.argv.slice(2).map(n => n.replace(/\.js$/, '')) : all;

// Characters that exist only in Simplified Chinese. Their presence means the text is not Traditional.
const SIMP = '这们说时会对为个发过还后应开关问务据缓进线认证码误设备读写运维环节点径图书无当从与实现并没么样种经给让该请须题页项险击测试验级络网产业专东两严举义乐习买乱亚亲亿仅仓价众优传体储儿兴养军农决况冻净凭创刚剂剧办动势区医华协单卖卫却厂历压县参双变号启员响团园围国圆场坏块声处复够头夹夺奖妈学宁宝审宽寻导将层岁岛币师带帮库广庆废异弃张弹强归录彻总恶悬惯态战扑执扩扫护报拟拥择挂挡挤挥损换摄摆撑敌数断旧显晓暂术机杀权条来极构标栏树桥检楼横欢残毕气汇沟洁浅济浓涂润涨渐湾湿满滤灭灯灵灾炉烂烟烦烧热爱牵状独狭电画畅疗盖监盘矿确础碍礼祸离积称稳穷窃竞笔筑简类粮纠红纤约纪纯纲纳纵练组细终绍结绕绘绝统继绩绪续绵综绿编缘缩罗罚罢职联聪肃胁胜脏脑脚脱腾舰艺苏苹荐荣药获营萨蓝虑虽蚁补装见观规视览觉誉计订讨训议讯记讲许论访诉词译话详语诸诺课谁调谈谊谋谢谨谱贝负贡财责贤败货质贩贪贫购贯贵贸费贺赋赏赖赚赛赞赠赶趋跃践踪车轨转轮软轰轻载较辅辆辈辉辑输边达迁迈违连迟适选逊递逻遗邮邻郑释钟钢钱铁银链销锁错键长门闪闭闲间闻阅队阳阴阵阶际陆陈随隐难雾静韵顶顺顾顿预领频颜额风飞饭饮饰饱马驱骗鱼鸟麦黄齐龙资别着档属户尔惊献万';
const simpRe = new RegExp('[' + SIMP + ']', 'g');
const INLINE = new Set(['b', 'code', 'em', 'i', 'sup', 'strong']);

function load(file, fn) {
  const out = []; const ctx = {}; ctx[fn] = m => out.push(m);
  vm.createContext(ctx); vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
  return out[0];
}
function tags(html) {
  const block = [], inline = {};
  (html || '').replace(/<pre>[\s\S]*?<\/pre>/g, '<pre></pre>').replace(/<(\/?)([a-z0-9]+)([^>]*)>/g, (m, close, name, attrs) => {
    if (INLINE.has(name)) { if (!close) inline[name] = (inline[name] || 0) + 1; return m; }
    const cls = (attrs.match(/class="([^"]*)"/) || [])[1] || '';
    const dw = (attrs.match(/data-w="([^"]*)"/) || [])[1] || '';
    block.push(close + name + (cls ? '.' + cls : '') + (dw ? '#' + dw : ''));
    return m;
  });
  return { block, inline };
}
const pres = html => ((html || '').match(/<pre>[\s\S]*?<\/pre>/g) || []);
const codes = html => ((html || '').replace(/<pre>[\s\S]*?<\/pre>/g, '').match(/<code>[\s\S]*?<\/code>/g) || []).slice().sort();
const hasCJK = s => /[一-鿿]/.test(s || '');

let failed = false;
for (const name of names) {
  const P = [];
  const enFile = path.join(root, 'content', name + '.js'), zhFile = path.join(root, 'content', 'zh', name + '.js');
  if (!fs.existsSync(zhFile)) { console.log('MISSING ' + name + ' (no content/zh/' + name + '.js)'); failed = true; continue; }
  let en, zh;
  try { en = load(enFile, 'M'); zh = load(zhFile, 'MZ'); } catch (e) { console.log('FAIL ' + name + ': cannot run file: ' + e.message); failed = true; continue; }
  if (!zh) { console.log('FAIL ' + name + ': file did not call MZ({...})'); failed = true; continue; }
  if (zh.id !== en.id) P.push('module id is "' + zh.id + '", expected "' + en.id + '"');
  for (const k of ['title', 'time', 'blurb']) if (!hasCJK(zh[k])) P.push('module ' + k + ' missing or not Chinese');
  const zl = zh.lessons || [];
  if (zl.length !== en.lessons.length) P.push('has ' + zl.length + ' lessons, expected ' + en.lessons.length);
  en.lessons.forEach((l, i) => {
    const z = zl[i]; const w = '[' + l.id + '] ';
    if (!z) return;
    if (z.id !== l.id) { P.push(w + 'lesson ' + (i + 1) + ' has id "' + z.id + '"'); return; }
    if (!hasCJK(z.title)) P.push(w + 'title missing or not Chinese');
    if (!hasCJK(z.body)) P.push(w + 'body missing or not Chinese');
    const a = tags(l.body), b = tags(z.body);
    if (a.block.join(' ') !== b.block.join(' ')) {
      let k = 0; while (k < a.block.length && a.block[k] === b.block[k]) k++;
      P.push(w + 'body HTML structure differs at tag #' + (k + 1) + ': English has <' + (a.block[k] || 'nothing') + '>, Chinese has <' + (b.block[k] || 'nothing') + '> (after: ' + a.block.slice(Math.max(0, k - 3), k).join(' ') + ')');
    }
    for (const t of new Set(Object.keys(a.inline).concat(Object.keys(b.inline)))) {
      if ((a.inline[t] || 0) !== (b.inline[t] || 0)) P.push(w + 'body has ' + (b.inline[t] || 0) + ' <' + t + '> tags, English has ' + (a.inline[t] || 0));
    }
    const pa = pres(l.body), pb = pres(z.body);
    pa.forEach((p, k) => { if (p !== pb[k]) P.push(w + '<pre> block #' + (k + 1) + ' must be identical to the English one'); });
    const ca = codes(l.body), cb = codes(z.body);
    if (ca.join('\n') !== cb.join('\n')) {
      const miss = ca.filter(c => !cb.includes(c)).slice(0, 3), extra = cb.filter(c => !ca.includes(c)).slice(0, 3);
      P.push(w + 'inline <code> contents differ. Missing: ' + (miss.join(' ') || '-') + ' | Unexpected: ' + (extra.join(' ') || '-'));
    }
    if (l.tryNote && !hasCJK(z.tryNote)) P.push(w + 'tryNote missing or not Chinese');
    if (l.try && l.try.length) {
      if (!Array.isArray(z.try) || z.try.length !== l.try.length) P.push(w + 'try must be an array of ' + l.try.length + ' translated notes (strings)');
      else z.try.forEach((t, k) => { if (typeof t !== 'string') P.push(w + 'try[' + k + '] must be a string (the note only, no command)'); else if (l.try[k][1] && !hasCJK(t)) P.push(w + 'try[' + k + '] note not translated'); });
    }
    if (l.own) {
      if (!hasCJK(z.own)) P.push(w + 'own missing or not Chinese');
      else {
        const oa = codes(l.own), ob = codes(z.own);
        if (oa.join('\n') !== ob.join('\n')) P.push(w + 'own: inline <code> contents differ from English');
      }
    }
    const zq = z.quiz || [];
    if (zq.length !== l.quiz.length) P.push(w + 'has ' + zq.length + ' quiz questions, expected ' + l.quiz.length);
    l.quiz.forEach((q, k) => {
      const y = zq[k]; if (!y) return;
      if (!hasCJK(y.q)) P.push(w + 'quiz ' + (k + 1) + ' question not Chinese');
      if (!Array.isArray(y.a) || y.a.length !== q.a.length) P.push(w + 'quiz ' + (k + 1) + ' must have ' + q.a.length + ' options in the same order');
      if (!hasCJK(y.why)) P.push(w + 'quiz ' + (k + 1) + ' explanation (why) missing or not Chinese');
    });
    const text = [z.title, z.body, z.tryNote, (z.try || []).join(' '), z.own, JSON.stringify(zq)].join(' ');
    const bad = text.match(simpRe);
    if (bad) {
      const uniq = Array.from(new Set(bad)).slice(0, 12).join('');
      const at = text.search(simpRe);
      P.push(w + 'Simplified characters found: ' + uniq + '  e.g. "…' + text.slice(Math.max(0, at - 8), at + 8).replace(/\s+/g, ' ') + '…"');
    }
    if (/undefined/.test(text)) P.push(w + 'contains the text "undefined"');
  });
  const modText = [zh.title, zh.time, zh.blurb].join(' ');
  if (simpRe.test(modText)) P.push('module title/time/blurb contains Simplified characters');
  simpRe.lastIndex = 0;
  if (P.length) { failed = true; console.log('FAIL ' + name + ' (' + P.length + ' problems)\n  - ' + P.join('\n  - ')); }
  else console.log('OK ' + name + ' (' + en.lessons.length + ' lessons)');
}
process.exit(failed ? 1 : 0);
