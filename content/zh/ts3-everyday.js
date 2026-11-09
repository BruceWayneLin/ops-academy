MZ({
  id: 'ts3',
  title: '每天都會碰到的程式碼',
  time: '2 週',
  blurb: '每個真實的 TypeScript 專案裡都有的程式碼：陣列方法與複製、閉包與 this、Promise 與 await、import、常見的設計模式，以及一套讀懂別人程式的方法。',
  lessons: [
  {
    id: 'ts-arrays',
    title: '陣列與物件：map、filter、reduce 和複製',
    body: `
<p>你每天讀到的程式，大多數都在做兩件事之一：拿一串清單做出別的東西，或是拿一個物件做出一份改過的副本。JavaScript 剛好有一小組工具專門做這些事。把它們學會，任何專案裡都有一大片程式碼會突然變得很好讀。</p>
<p>這一課從頭到尾都用同一串清單：玩家在 Higher or Lower（猜大小）裡抽到的牌。</p>
<pre><code>const cards: number[] = [3, 8, 5, 12];</code></pre>
<h3>第一步：每個方法都接一個小函式</h3>
<p>下面每個方法都會接一個你寫的函式，然後照順序對每一項各呼叫一次。這種交給別人、由別人來呼叫的函式，叫做<b>回呼函式</b>（callback）。它會收到那一項（你要的話，還有它的位置）。你的回呼函式回傳什麼，決定了方法要怎麼處理那一項。</p>
<h3>map：每一項都換掉</h3>
<p><code>map</code> 對每一項呼叫你的函式，把回傳值收集起來，放進一個長度一樣的新陣列。</p>
<div class="flow"><span class="box">[3, 8, 5, 12]</span><span class="arr">&rarr;</span><span class="box hot">map(c =&gt; c * 10)<small>跑 4 次</small></span><span class="arr">&rarr;</span><span class="box">[30, 80, 50, 120]<small>長度一樣，是新的陣列</small></span></div>
<h3>filter：只留下一部分</h3>
<p><code>filter</code> 只留下讓你的函式回傳 <code>true</code> 的項目。這裡的條件是 <code>c =&gt; c &gt; 6</code>。結果可能比原本短，也可能是空的。</p>
<div class="flow"><span class="box bad">3<small>丟掉</small></span><span class="box">8<small>留下</small></span><span class="box bad">5<small>丟掉</small></span><span class="box">12<small>留下</small></span><span class="arr">&rarr;</span><span class="box hot">[8, 12]</span></div>
<h3>find：第一個符合的，或什麼都沒有</h3>
<p><code>find</code> 回傳第一個通過條件的項目，找到就停。如果全都不符合，它回傳 <code>und&#101;fined</code>。所以 TypeScript 會把結果的型別寫成 <code>number | und&#101;fined</code>，逼你先檢查再用。</p>
<div class="flow"><span class="box bad">3<small>不是</small></span><span class="arr">&rarr;</span><span class="box hot">8<small>是：停</small></span><span class="arr">&rarr;</span><span class="box">結果：8<small>5 和 12 根本沒被檢查</small></span></div>
<h3>some 和 every：是非題</h3>
<p><code>some</code> 問的是「至少有一項通過嗎？」，碰到第一個「是」就停。<code>every</code> 問的是「全部都通過嗎？」，碰到第一個「不是」就停。</p>
<div class="flow"><span class="box">some(c =&gt; c &gt; 10)</span><span class="arr">&rarr;</span><span class="box bad">3</span><span class="box bad">8</span><span class="box bad">5</span><span class="box hot">12<small>是：停</small></span><span class="arr">&rarr;</span><span class="box">true</span></div>
<div class="flow"><span class="box">every(c =&gt; c &gt; 4)</span><span class="arr">&rarr;</span><span class="box bad">3<small>不是：停</small></span><span class="arr">&rarr;</span><span class="box">false<small>8、5、12 根本沒被檢查</small></span></div>
<h3>reduce：把一串清單熬成一個值</h3>
<p><code>reduce</code> 會一路走過整串清單，手上一直帶著一個值，叫做<b>累加值</b>（accumulator）。你要給它一個起始值。每走到一項，你的函式會拿到「目前的累加值」和「這一項」，然後回傳新的累加值。最後那個累加值就是結果。</p>
<pre><code>const total = cards.reduce((sum, c) =&gt; sum + c, 0);   // 28</code></pre>
<div class="flow"><span class="box">起始 0</span><span class="arr">&rarr;</span><span class="box">+3 = 3</span><span class="arr">&rarr;</span><span class="box">+8 = 11</span><span class="arr">&rarr;</span><span class="box">+5 = 16</span><span class="arr">&rarr;</span><span class="box hot">+12 = 28</span></div>
<p><code>reduce</code> 什麼都做得出來，也因此是這幾個裡面最難讀的。如果用 <code>map</code>、<code>filter</code> 或普通的迴圈寫得更清楚，就用那些。</p>
<table>
<tr><th>方法</th><th>交回什麼</th><th>會提早停嗎</th><th>回答的問題</th></tr>
<tr><td><code>map</code></td><td>新陣列，長度一樣</td><td>不會</td><td>每張牌都乘以十？</td></tr>
<tr><td><code>filter</code></td><td>新陣列，可能比較短</td><td>不會</td><td>只要大牌？</td></tr>
<tr><td><code>find</code></td><td>一個項目，或什麼都沒有</td><td>碰到第一個「是」</td><td>第一張大牌是哪張？</td></tr>
<tr><td><code>some</code></td><td>true 或 false</td><td>碰到第一個「是」</td><td>有沒有超過 10 的牌？</td></tr>
<tr><td><code>every</code></td><td>true 或 false</td><td>碰到第一個「不是」</td><td>每張牌都超過 4 嗎？</td></tr>
<tr><td><code>reduce</code></td><td>你組出來的任何東西</td><td>不會</td><td>總和是多少？</td></tr>
</table>
<p>真正的遊戲裡，這些會混在一起用。下面每一回合都記下了牌、玩家猜的方向，以及有沒有猜對：</p>
<pre><code>type Round = { card: number; guess: 'higher' | 'lower'; correct: boolean };
const rounds: Round[] = [
  { card: 3, guess: 'higher', correct: true },
  { card: 8, guess: 'lower', correct: true },
  { card: 5, guess: 'higher', correct: false },
];
const score = rounds.filter(r =&gt; r.correct).length;   // 2
const firstMiss = rounds.find(r =&gt; !r.correct);        // the round with card 5
const perfect = rounds.every(r =&gt; r.correct);          // false
const lines = rounds.map(r =&gt; \`\${r.card}: \${r.correct ? 'ok' : 'miss'}\`);</code></pre>
<h3>物件：keys、values 和 entries</h3>
<pre><code>const best = { mia: 12, leo: 7, ana: 9 };
Object.keys(best);      // ['mia', 'leo', 'ana']
Object.values(best);    // [12, 7, 9]
Object.entries(best);   // [['mia', 12], ['leo', 7], ['ana', 9]]
for (const [player, points] of Object.entries(best)) {
  console.log(player, points);
}</code></pre>
<p>這三個會把物件變成陣列，於是上面所有的陣列方法都能用在它身上。有一點會讓人意外：<code>Object.keys</code> 的型別是 <code>string[]</code>，而不是那幾個確切的鍵名，因為 TypeScript 沒辦法保證物件在執行時不會多出別的鍵。</p>
<h3>展開：複製與合併</h3>
<p>三個點 <code>...</code> 的意思是「把裡面的東西攤開放在這裡」。放在 <code>[ ]</code> 裡，攤開的是陣列的項目；放在 <code>{ }</code> 裡，攤開的是物件的屬性。這就是<b>展開語法</b>（spread syntax）。</p>
<pre><code>const more = [...cards, 9];                          // [3, 8, 5, 12, 9]
const defaults = { sound: true, speed: 1 };
const settings = { ...defaults, speed: 2 };          // { sound: true, speed: 2 }
const player = { nick: 'Mia', score: 4 };
const next = { ...player, score: player.score + 1 }; // a changed copy</code></pre>
<p>兩個來源有同一個鍵的時候，寫在後面的贏。所以「先放預設值，再放要覆蓋的」才會是這麼常見的一行。</p>
<h3>解構：照名字或位置把值拿出來</h3>
<pre><code>const { nick, score: points } = player;    // two variables; score renamed
const [first, second, ...rest] = cards;    // 3, 8 and [5, 12]
function start({ speed = 1 }: { speed?: number }) {
  console.log('speed', speed);             // 1 when speed is missing
}</code></pre>
<p><b>解構</b>（destructuring）就是把建立物件倒過來做：大括號照名字把屬性拿出來，中括號照位置把項目拿出來，<code>...rest</code> 則把剩下的全部收在一起。</p>
<h3>為什麼這些都不會改到原本的值</h3>
<p>上面全部做完，<code>cards</code> 還是 <code>[3, 8, 5, 12]</code>。這些方法和展開，永遠都是做一個新的出來。這個習慣有個名字，叫<b>不可變性</b>（immutability）：不去就地修改（mutate）一個值，而是做一個新的。何必這麼麻煩？</p>
<ul>
<li>新舊可以比較。如果 <code>next !== player</code>，就代表有東西變了。要是你直接改 <code>player</code>，兩個名字會指向同一個物件，你就分不出來了。</li>
<li>不會嚇到別人。程式裡另一個地方拿著同一個陣列，不會發現它在自己手上突然變了。</li>
<li>歷史紀錄和復原變得很簡單：把舊值留著就好。</li>
</ul>
<div class="warn">有些陣列方法真的會改到原本的陣列：<code>push</code>、<code>pop</code>、<code>splice</code>、<code>sort</code> 和 <code>reverse</code>。<code>sort</code> 是最經典的陷阱，因為它也會回傳陣列，看起來就跟 <code>map</code> 一樣。要排序一份副本，就寫 <code>[...cards].sort((a, b) =&gt; a - b)</code>；如果你的目標環境包含 ES2023，也可以用 <code>toSorted</code>。</div>
<h3>Vue 對照</h3>
<p>Vue 3 的響應式（reactivity）是透過 proxy 監看你的資料，所以兩種寫法都會更新畫面：<code>list.value.push(x)</code> 和 <code>list.value = [...list.value, x]</code>。不過在三個地方，不可變性還是很重要：</p>
<ul>
<li>在 <code>computed</code> 裡，絕對不要改到來源。在 computed 裡寫 <code>list.value.sort()</code>，會把原本那個 ref 的順序也一起改掉。要排就排副本。</li>
<li>props 是父元件的。要改的話，複製一份 prop 物件，或是 emit 一個事件，不要直接改它。</li>
<li>用深層監聽（deep watcher）時，如果你是就地修改物件，舊值和新值會是同一個物件，你就沒辦法比較。換成一個新的，就可以比了。</li>
</ul>
<p>離開 Vue，例如在遊戲程式裡，根本沒有人在監看你的資料。這時候，「做出新的值」就是你自己的程式知道哪裡變了的方法。</p>
<h3>深入一點：展開只複製一層</h3>
<pre><code>const a = { nick: 'Mia', stats: { wins: 3 } };
const b = { ...a };
b.stats.wins = 99;
console.log(a.stats.wins);   // 99: a and b share one stats object</code></pre>
<p>展開做出來的是<b>淺層複製</b>（shallow copy）：外層物件是新的，但裡面的物件是共用的。要改巢狀的東西，每一層都要展開：<code>{ ...a, stats: { ...a.stats, wins: 4 } }</code>。如果要把單純的資料整份深層複製，現代瀏覽器和 Node 都有 <code>structuredClone(a)</code>。</p>
<h3>深入一點：幾個小陷阱</h3>
<ul>
<li><code>reduce</code> 沒給起始值時，會拿第一項當起始值，遇到空陣列就直接丟出錯誤。永遠給它一個起始值。</li>
<li>對空陣列呼叫 <code>every</code> 會回傳 <code>true</code>，<code>some</code> 則回傳 <code>false</code>。</li>
<li>不給比較函式的 <code>sort()</code> 會把數字當成文字來排：<code>[3, 8, 5, 12].sort()</code> 得到的是 <code>[12, 3, 5, 8]</code>。</li>
</ul>`,
    tryNote: '把每段程式貼到 TypeScript Playground（typescriptlang.org/play），按 Run，然後看右邊的 Logs 分頁。',
    try: [
      '圖裡的每一個方法都在這裡。最後印出的是 cards 本身，完全沒變。',
      'sort 改到了原本的陣列，回傳的是同一個陣列，而且把數字當成文字來排。',
      '淺層複製：外層是新的物件，裡面那個物件是共用的。',
      '帶 rest 的解構，以及把物件變成一組一組的鍵和值。'
    ],
    own: `打開你自己專案裡的一個元件或 service，找一個手動組出新清單或總和的迴圈：用了 <code>push</code> 或 <code>+=</code> 的 <code>for</code> 迴圈。用 <code>map</code>、<code>filter</code> 或 <code>reduce</code> 改寫它，確認結果一樣。接著在專案裡搜尋 <code>.sort(</code>，一個一個檢查：它排的是副本，還是正在改一個別的程式也拿著的陣列？`,
    quiz: [
      { q: "<code>[3, 8, 5, 12].find(c =&gt; c &gt; 20)</code> 會回傳什麼？",
        a: ["一個空陣列", "-1", "<code>und&#101;fined</code>", "false"],
        why: "find 回傳第一個符合的項目；全都不符合時回傳 und&#101;fined。會回傳 -1 的是 findIndex。" },
      { q: "下面哪一個會改到原本的陣列 <code>cards</code>？",
        a: ["<code>cards.sort()</code>", "<code>cards.map(c =&gt; c)</code>", "<code>cards.filter(c =&gt; c &gt; 1)</code>", "<code>[...cards]</code>"],
        why: "sort 會就地重排陣列，再把同一個陣列回傳。另外三個都會做出新的陣列。" },
      { q: "寫了 <code>const b = { ...a }</code> 之後，你改了 <code>b.stats.wins</code>。<code>a.stats.wins</code> 會怎樣？",
        a: ["不會怎樣：b 是完整的副本", "TypeScript 會報錯", "被重設成 0", "也跟著變，因為展開只複製最外層"],
        why: "展開是淺層複製。a 和 b 是不同的物件，但裡面共用同一個 stats 物件。" }
    ]
  },
  {
    id: 'ts-closures',
    title: '閉包、this 和計時器',
    body: `
<p>JavaScript 的函式不只是一串步驟。它還會帶著自己被建立的時候，周圍的那些變數。光是這一件事，就能解釋你每天碰到的三種狀況：計數器為什麼不用 class 也能記住數字、<code>this</code> 為什麼有時候在回呼函式（callback）裡突然失效，以及怎麼讓舊的計時器或舊的回應不要把畫面弄亂。</p>
<h3>第一步：函式記得自己在哪裡出生</h3>
<pre><code>function makeCounter() {
  let count = 0;
  return () =&gt; {
    count += 1;
    return count;
  };
}
const next = makeCounter();
console.log(next(), next(), next());   // 1 2 3
const other = makeCounter();
console.log(other());                  // 1: a separate count</code></pre>
<p><code>makeCounter</code> 跑完之後，你可能以為 <code>count</code> 就消失了。並沒有。它回傳的那個小箭頭函式還在用 <code>count</code>，所以 <code>count</code> 一直活著。把它想成一個背包：函式被建立的時候，會把周圍用得到的變數打包進去，走到哪背到哪。函式加上它的背包，就叫做<b>閉包</b>（closure）。</p>
<div class="flow"><span class="box">makeCounter() 執行<small>建立 count = 0</small></span><span class="arr">&rarr;</span><span class="box hot">回傳一個箭頭函式<small>背包裡：count</small></span><span class="arr">&rarr;</span><span class="box">next()<small>count 變成 1</small></span><span class="arr">&rarr;</span><span class="box">next()<small>count 變成 2</small></span></div>
<p>有兩件事要注意。每呼叫一次 <code>makeCounter</code>，就會打包一個新背包，所以 <code>next</code> 和 <code>other</code> 各數各的。而且外面沒有任何人碰得到 <code>count</code>：根本沒有 <code>next.count</code> 這種東西。閉包是把東西藏起來最簡單的方法。一個變數看得到的那段程式範圍，叫做它的<b>作用域</b>（scope）；閉包讓函式在作用域本來已經結束之後，還能把它留著。</p>
<h3>Vue 對照：composable 就是閉包</h3>
<pre><code>import { ref } from 'vue';
function useCounter() {
  const count = ref(0);
  const inc = () =&gt; { count.value += 1; };
  return { count, inc };
}</code></pre>
<p>一模一樣的形狀。<code>inc</code> 是透過它的背包拿到 <code>count</code> 的。<code>&lt;script setup&gt;</code> 裡的每樣東西都是這樣運作的，所以你在那裡從來不用寫 <code>this</code>。</p>
<h3>第二步：this 看的是函式「怎麼被呼叫」</h3>
<p>在 class 裡，<code>this</code> 的意思是「我所屬的那個物件」。但對一般的函式或方法來說，<code>this</code> 不是在你寫下它的時候決定的，而是每次呼叫時，依照呼叫的方式決定：看點號左邊是哪個物件。</p>
<pre><code>class Game {
  score = 0;
  addPoint() { this.score += 1; }
}
const game = new Game();
game.addPoint();                  // called on game: this is game
const f = game.addPoint;
f();                              // no object: this is und&#101;fined, so TypeError
setTimeout(game.addPoint, 100);   // the timer calls it, not game: score never moves</code></pre>
<table>
<tr><th>怎麼呼叫</th><th>一般函式裡的 this</th></tr>
<tr><td><code>game.addPoint()</code></td><td><code>game</code>，也就是點號前面那個物件</td></tr>
<tr><td><code>f()</code>，沒有點號</td><td><code>und&#101;fined</code>（class 裡的程式和模組永遠是嚴格模式）</td></tr>
<tr><td>交給別人去呼叫，像 <code>setTimeout(game.addPoint)</code></td><td>由那個呼叫者決定，反正不會是 <code>game</code></td></tr>
<tr><td><code>game.addPoint.bind(game)</code></td><td>永遠是 <code>game</code>，不管之後怎麼被呼叫</td></tr>
</table>
<h3>第三步：箭頭函式的 this，看它寫在哪裡</h3>
<p><b>箭頭函式</b>（arrow function）自己沒有 <code>this</code>。在它裡面，<code>this</code> 指的就是它被寫下的那個位置、周圍程式裡指的那個東西，跟背包裡的其他變數一樣。所以在方法裡寫箭頭函式，它會一直指著那個物件。</p>
<pre><code>class Game {
  score = 0;
  start() {
    setTimeout(() =&gt; { this.score += 1; }, 100);   // still the game
  }
  onClick = () =&gt; { this.score += 1; };            // safe to pass around
}</code></pre>
<p>這就是 callback 幾乎都寫成箭頭的原因。需要把方法交給別人的時候，常見的修法有三種：</p>
<ul>
<li>用箭頭包起來：<code>setTimeout(() =&gt; game.addPoint(), 100)</code>。</li>
<li>綁定（bind）它：<code>game.addPoint.bind(game)</code> 會做出一個 <code>this</code> 已經固定好的副本。</li>
<li>寫成箭頭欄位，像上面的 <code>onClick</code>。</li>
</ul>
<p>有些 API 乾脆讓你多傳一個參數，指定那個物件。在 Cocos Creator 裡，<code>node.on(Node.EventType.TOUCH_END, this.onTouch, this)</code> 把 <code>this</code> 當成第三個參數傳進去，正是為了這個原因。</p>
<p><b>Vue 對照：</b>在 Options API 裡，Vue 會幫你把 <code>methods</code> 裡的每個函式綁定到元件上，所以 <code>this.count</code> 直接就能用；Vue 官方文件也特別提醒，那些方法不要寫成箭頭函式。在 <code>&lt;script setup&gt;</code> 裡則完全沒有 <code>this</code>，閉包就把事情做完了。</p>
<h3>計時器：setTimeout 和 setInterval</h3>
<pre><code>const id = setTimeout(() =&gt; console.log('reveal'), 1000);  // once, after about 1 s
clearTimeout(id);                                           // cancelled: never runs

let left = 3;
const tick = setInterval(() =&gt; {
  left -= 1;
  console.log('left', left);
  if (left === 0) clearInterval(tick);                      // stop repeating
}, 1000);</code></pre>
<p>這兩個計時器（timer）都會回傳一個 id。把它留著，因為 id 是唯一能取消的方法。延遲時間是「最少要等這麼久」，不是保證：主執行緒在忙的話，callback 會更晚才跑。一個從來沒被清掉的 interval，在它的畫面消失之後還會一直跑，而且透過背包，讓它用到的所有東西都沒辦法被回收。在 Vue 裡，記得在 <code>onUnmounted</code> 清掉它。</p>
<h3>第四步：最新的請求說了算</h3>
<p>這是一個你在真實的 app 裡一定會遇到的 bug。玩家很快地連按兩次「下一張牌」，送出了兩個請求。網路上的回應不會照順序回來，所以第二個回應可能先到。接著第一個、比較舊的回應才到，把畫面蓋成一張已經過期的牌。像這種結果取決於「哪個回應剛好先到」的狀況，叫做<b>競爭條件</b>（race condition）。</p>
<div class="flow"><span class="box">送出請求 1</span><span class="arr">&rarr;</span><span class="box">送出請求 2</span><span class="arr">&rarr;</span><span class="box hot">回應 2 到了<small>顯示</small></span><span class="arr">&rarr;</span><span class="box bad">回應 1 到了<small>過期的（stale）：必須忽略</small></span></div>
<p>修法要用到閉包。在外面放一個計數器。每個請求都拿下一個號碼牌，放進自己的背包。等它的回應回來時，先檢查自己的號碼牌還是不是最新的。不是的話，就什麼都不做。</p>
<pre><code>let latest = 0;
function fakeDraw(done: (card: number) =&gt; void) {
  const delay = Math.random() * 1000;          // replies come back in random order
  setTimeout(() =&gt; done(Math.ceil(Math.random() * 13)), delay);
}
function showNextCard() {
  const ticket = ++latest;                     // this call's number
  fakeDraw(card =&gt; {
    if (ticket !== latest) return;             // a newer request exists: ignore
    console.log('show', card, 'from request', ticket);
  });
}
showNextCard();
showNextCard();                                // only this one is shown</code></pre>
<p>同一招也能擋住舊的計時器。Higher or Lower（猜大小）的每一回合都給一個 id，翻牌的計時器在翻牌之前，先檢查自己那一回合還是不是目前這一回合。下一課你會用 <code>await</code> 寫同樣的東西；檢查的方法完全一樣。</p>
<h3>深入一點：印出 3、3、3 的迴圈</h3>
<pre><code>for (var i = 0; i &lt; 3; i++) setTimeout(() =&gt; console.log(i), 0);   // 3 3 3
for (let j = 0; j &lt; 3; j++) setTimeout(() =&gt; console.log(j), 0);   // 0 1 2</code></pre>
<p><code>var</code> 整個迴圈只做出一個變數，所以三個 callback 打包的都是同一個 <code>i</code>，等它們真正執行時，它已經是 3 了。<code>let</code> 每一圈都做出一個新的變數，所以每個 callback 打包的是自己那一份。這也是現代程式不再用 <code>var</code> 的原因之一。</p>
<h3>深入一點：計時器的型別，以及真的取消</h3>
<p>在瀏覽器裡，計時器的 id 是一個數字；在 Node 裡是一個物件。型別寫成 <code>ReturnType&lt;typeof setTimeout&gt;</code>，兩邊都能用。忽略過期的回應，並不會讓請求本身停下來。如果是 <code>fetch</code>，可以用 <code>AbortController</code> 取消它，省下那些工作。很多團隊兩個都做：中止舊的請求，再保留號碼牌檢查當作安全網。</p>`,
    tryNote: '把每段程式貼到 TypeScript Playground（typescriptlang.org/play），按 Run，然後看右邊的 Logs 分頁。',
    try: [
      '兩個計數器，兩個背包：先是 1 2 3，接著是 1。',
      '不帶物件直接呼叫方法會失敗。用箭頭函式包起來就正常，分數變成 1。',
      '共用一個變數，印出 3 3 3；每一圈一個新變數，印出 0 1 2。',
      '多跑幾次。不管哪個回應先到，畫面上都只會顯示第二個請求。'
    ],
    own: `在你自己的程式裡，找一個用到計時器、或是等回應再更新畫面的地方：搜尋框、倒數計時、載入中的轉圈圈。檢查兩件事：畫面或元件消失時，計時器有沒有被清掉？兩個請求重疊時，舊的回應會不會蓋掉新的？挑一個修好：用 <code>clearTimeout</code> 或 <code>clearInterval</code>，或是像這一課那樣的號碼牌計數器。`,
    quiz: [
      { q: "呼叫兩次 <code>makeCounter()</code> 做出來的兩個計數器，不會共用同一個數字。為什麼？",
        a: ["它們其實共用同一個數字", "每次呼叫都會建立一個新的 count 變數，每個回傳的函式各自留著自己那一份", "TypeScript 每次呼叫都會複製變數", "因為 count 是數字"],
        why: "每次呼叫 makeCounter 都會重新跑一次函式本體，做出一個新的 count。每個回傳的函式帶著的，是自己那次呼叫的那一個。" },
      { q: "你在 class 的方法裡寫了 <code>setTimeout(function () { this.score++; }, 100)</code>。哪裡有問題？",
        a: ["沒有問題", "setTimeout 不能接函式", "一般函式的 this 看的是計時器怎麼呼叫它，而不是外面的方法；換成箭頭函式才會留住那個物件", "score 必須是 static"],
        why: "計時器是直接呼叫那個函式，所以 this 不是那個物件。箭頭函式則會沿用外面那個方法的 this。" },
      { q: "兩個請求重疊，比較舊的回應最後才到。用號碼牌的寫法，它會怎樣？",
        a: ["被忽略，因為它的號碼牌已經不是最新的", "蓋掉比較新的結果", "瀏覽器會自動取消它", "兩個結果都顯示"],
        why: "每個 callback 都會拿自己的號碼牌跟最新的號碼比。舊的號碼對不上，callback 就直接 return，不碰畫面。" }
    ]
  },
  {
    id: 'ts-async',
    title: 'Promise 與 async/await',
    body: `
<p>你的程式常常要等：等伺服器、等檔案、等動畫播完。這一課講 JavaScript 怎麼在不卡住的情況下等待，以及怎麼讀懂等待的幾種寫法：<code>.then</code> 和 <code>await</code>。</p>
<h3>為什麼等待不能卡住</h3>
<p>網頁上的程式跑在一條<b>主執行緒</b>（main thread）上。同一條執行緒還要負責畫畫面、回應點擊，而且一次只能做一件事。如果你的程式為了等回應，原地站著不動兩秒，那兩秒內什麼都不會發生：不能點、沒有動畫、不能捲動。整個頁面看起來就像當掉了。</p>
<pre><code>const end = Date.now() + 2000;
while (Date.now() &lt; end) {}   // busy waiting: the page freezes for 2 s</code></pre>
<p>所以 JavaScript 從來不這樣等。它會跟瀏覽器說「你先開始做，好了再通知我」，然後繼續往下跑。結果之後才會來、而且什麼時候來不是你決定的程式，叫做<b>非同步</b>（asynchronous）。</p>
<div class="flow"><span class="box">你的程式<small>要一張牌</small></span><span class="arr">&rarr;</span><span class="box">瀏覽器<small>等網路</small></span><span class="arr">&rarr;</span><span class="box hot">主執行緒保持空閒<small>點擊、畫面</small></span><span class="arr">&rarr;</span><span class="box">回應到了<small>你的函式開始跑</small></span></div>
<h3>第一步：Promise 是一張取餐單</h3>
<p>在手搖飲店，你點餐、付錢，拿到一張有號碼的單子。你不會站在櫃檯前面擋住所有人。你走到旁邊滑手機，叫到你的號碼時去拿飲料，或是聽到店員說賣完了。<b>Promise</b> 就是那張單子：一個你馬上就拿到的物件，代表一個之後才會到的結果。</p>
<div class="flow"><span class="box hot">等待中（pending）<small>單子在手上</small></span><span class="arr">&rarr;</span><span class="box">已實現（fulfilled）<small>你的值來了</small></span><span class="arr">或</span><span class="box bad">已拒絕（rejected）<small>錯誤來了</small></span></div>
<p>Promise 一開始是<b>等待中</b>（pending），之後只會定案一次：帶著一個值變成<b>已實現</b>（fulfilled），或是帶著一個錯誤變成<b>已拒絕</b>（rejected）。一旦定案，就不會再變。</p>
<pre><code>function drawCard(): Promise&lt;number&gt; {
  return new Promise((resolve) =&gt; {
    setTimeout(() =&gt; resolve(Math.ceil(Math.random() * 13)), 500);
  });
}

drawCard()
  .then(card =&gt; console.log('drew', card))
  .catch(err =&gt; console.error('could not draw', err));</code></pre>
<p><code>.then</code> 的意思是「好了就跑這個」。<code>.catch</code> 的意思是「失敗了就跑這個」。每個 <code>.then</code> 都會回傳一個新的 Promise，所以可以一個接一個串下去；最後放一個 <code>.catch</code>，就能接住上面任何一步的失敗。另外還有 <code>.finally</code>，不管成功或失敗都會跑：拿來把「載入中」的轉圈圈關掉剛剛好。</p>
<h3>第二步：async/await 是同一件事，由上往下寫</h3>
<pre><code>async function playRound() {
  try {
    const current = await drawCard();
    const next = await drawCard();
    console.log(current, next, next &gt; current ? 'higher' : 'lower');
  } catch (err) {
    console.error('could not draw', err);
  }
}
playRound();</code></pre>
<p>把 <code>await</code> 讀成「在這裡等這張單子，然後把裡面的東西給我」。它只會暫停這一個函式。等待的時候主執行緒是空的，值到了以後，函式就從那一行接著跑下去。被拒絕的 Promise 會在 <code>await</code> 那裡變成一個普通的錯誤被丟出來，所以用一般的 <code>try/catch</code> 就能處理。</p>
<p><code>async</code> 函式永遠回傳一個 Promise，就算你回傳的只是一個普通的數字：<code>async function f() { return 1; }</code> 得到的是 <code>Promise&lt;number&gt;</code>。所以呼叫它的人也得等它。</p>
<table>
<tr><th>要做的事</th><th>Promise 串接</th><th>async/await</th></tr>
<tr><td>拿到值</td><td><code>.then(card =&gt; ...)</code></td><td><code>const card = await drawCard()</code></td></tr>
<tr><td>處理失敗</td><td><code>.catch(err =&gt; ...)</code></td><td><code>try { } catch (err) { }</code></td></tr>
<tr><td>不管成敗都要跑</td><td><code>.finally(() =&gt; ...)</code></td><td><code>finally { }</code></td></tr>
</table>
<h3>誰先跑？在下面試試看</h3>
<pre><code>console.log('A');
setTimeout(() =&gt; console.log('B'), 0);
Promise.resolve().then(() =&gt; console.log('C'));
console.log('D');</code></pre>
<p>按任何按鈕之前，先猜猜看會印出什麼。然後按「走一步」，一步一步往下，看那三個方框：正在執行的程式；微任務佇列（microtask queue），Promise 的 callback 在這裡排隊；以及任務佇列（task queue），計時器的 callback 在這裡排隊。每印出一行，主控台的輸出就會多一行。</p>
<div class="widget" data-w="asyncorder"></div>
<p>答案是 A、D、C、B。原因如下：</p>
<ol>
<li>A 是普通的程式，所以馬上印出來。</li>
<li><code>setTimeout</code> 不會執行 B。它把 B 的 callback 放進<b>任務佇列</b>，等之後再跑，就算延遲是 0 也一樣。</li>
<li><code>Promise.resolve()</code> 一開始就已經實現了，所以 <code>.then</code> 把 C 的 callback 放進<b>微任務佇列</b>。</li>
<li>D 是普通的程式，所以印出來。</li>
<li>目前的程式跑完了。在拿下一個任務之前，引擎會先把微任務佇列整個清空：C 印出來。</li>
<li>這時候才去任務佇列拿下一個任務：B 印出來。</li>
</ol>
<p>這個循環（跑一段程式、清空微任務、拿下一個任務）就是<b>事件迴圈</b>（event loop）。要記住的規則：目前的程式一跑完，Promise 的 callback 就會比計時器先跑。<code>await</code> 後面的程式，也算是 Promise 的 callback。</p>
<h3>第三步：一個接一個，還是同時</h3>
<pre><code>const wait = (ms: number) =&gt; new Promise&lt;void&gt;(r =&gt; setTimeout(r, ms));
async function loadProfile() { await wait(500); return 'Mia'; }
async function loadBest() { await wait(500); return 12; }

async function oneByOne() {
  const nick = await loadProfile();   // 500 ms
  const best = await loadBest();      // then another 500 ms
  return \`\${nick}: \${best}\`;          // about 1000 ms in all
}
async function together() {
  const [nick, best] = await Promise.all([loadProfile(), loadBest()]);
  return \`\${nick}: \${best}\`;          // about 500 ms in all
}</code></pre>
<div class="tiers"><b>一個接一個</b><div><span class="box">loadProfile<small>500 ms</small></span><span class="box">接著 loadBest<small>500 ms</small></span><span class="box bad">大約 1000 ms</span></div><b>同時</b><div><span class="box">loadProfile 和 loadBest<small>兩個一起等</small></span><span class="box hot">大約 500 ms</span></div></div>
<p>兩個等待彼此無關的時候，就兩個都先開始，再用 <code>Promise.all</code> 一起等。它交回的結果，順序跟你傳進去的一樣。只要其中一個失敗，它就馬上失敗；<code>Promise.allSettled</code> 則會等全部跑完，再告訴你哪幾個失敗了。如果第二步需要第一步的結果，那一個接一個才是對的。</p>
<p>這裡的「同時」是「同時在等」。你的 JavaScript 還是跑在那一條主執行緒上，重疊的是等待的時間。</p>
<h3>最常見的錯：忘了 await</h3>
<pre><code>const wait = (ms: number) =&gt; new Promise&lt;void&gt;(r =&gt; setTimeout(r, ms));
async function loadBest() { await wait(500); return 12; }
async function saveScore(score: number) { await wait(300); console.log('stored', score); }

async function showBest() {
  const best = loadBest();      // forgot await: best is a Promise&lt;number&gt;
  console.log(best + 1);        // TypeScript error: a Promise is not a number
}
function finishGame(score: number) {
  saveScore(score);             // no error, but nobody waits for it
  console.log('saved!');        // prints before the save has finished
}</code></pre>
<p>第一種 TypeScript 抓得到，因為型別對不上。第二種它抓不到：呼叫之後，回傳的 Promise 就這樣被丟掉了。下一行跑的時候，儲存還在進行；而且如果儲存失敗，錯誤無處可去，瀏覽器只會回報一個沒人處理的拒絕（unhandled rejection）。lint 規則 <code>@typescript-eslint/no-floating-promises</code> 可以把這種地方找出來。</p>
<h3>void：故意射後不理（fire and forget）</h3>
<p>有時候你真的不想等，例如送出一筆使用統計。這時就在前面寫 <code>void</code>：</p>
<pre><code>void saveScore(score);   // start it, do not wait, and say so</code></pre>
<p><code>void</code> 是故意把 Promise 丟掉。它告訴讀程式的人，也告訴 lint 規則：不等是一個決定，不是不小心忘了。這樣的話，函式應該在裡面自己接住錯誤，因為外面不會有人接。</p>
<p><b>Vue 對照：</b>你一定寫過 <code>onMounted(async () =&gt; { data.value = await load(); })</code>。Vue 並不會等那個 Promise。元件會先掛載、先渲染，資料之後才到，這就是為什麼模板裡常常要放一個「載入中」的狀態。</p>
<h3>深入一點：在迴圈裡 await</h3>
<pre><code>async function saveAll(rounds: number[], save: (r: number) =&gt; Promise&lt;void&gt;) {
  rounds.forEach(async r =&gt; { await save(r); });   // does not wait at all
  for (const r of rounds) { await save(r); }       // one by one, in order
  await Promise.all(rounds.map(r =&gt; save(r)));     // all at once
}</code></pre>
<p>這是三種選擇，不是三個步驟。<code>forEach</code> 不理會 callback 回傳什麼，所以那些 Promise 都被丟掉了，下一行馬上就跑。順序重要時用 <code>for...of</code>；順序不重要時，用 <code>Promise.all</code> 搭配 <code>map</code>。</p>`,
    tryNote: '把每段程式貼到 TypeScript Playground（typescriptlang.org/play），按 Run，然後看右邊的 Logs 分頁。',
    try: [
      '示範裡的那段程式。Logs 會印出 A、D、C、B。',
      '一個接一個大約 600 ms，同時大約 300 ms。',
      'async 函式就算回傳的是普通數字，也會交回一個 Promise。把滑鼠移到 p 上面，看它的型別。',
      '被拒絕的 Promise 會在 await 那裡變成普通的錯誤，由 try/catch 接住。'
    ],
    own: `在你的專案裡搜尋 <code>forEach(async</code>，以及前面沒有 <code>await</code>、<code>return</code> 或 <code>void</code> 的 async 函式呼叫。每一個都決定一下：它應該等嗎？應該跟其他的一起放進 <code>Promise.all</code> 嗎？還是它真的是射後不理？如果你的專案有跑帶型別資訊的 ESLint，打開 <code>@typescript-eslint/no-floating-promises</code>，看看它找到什麼。`,
    quiz: [
      { q: "在示範的程式裡，為什麼 C 比 B 先印出來？",
        a: ["C 比較短，印得比較快", "計時器至少要等一秒", "Promise 的 callback 在微任務佇列裡排隊，目前的程式一跑完就會清空它，比下一個計時器任務還早", "Promise 跑在另一條執行緒上"],
        why: "目前的程式跑完後，事件迴圈會先把所有排隊中的微任務跑完。計時器的 callback 是一個任務，要等那之後才輪到它。" },
      { q: "兩個請求彼此無關，各要 500 ms。一個 <code>await</code> 接著一個，和用 <code>Promise.all</code>，大約各要多久？",
        a: ["1000 ms 和 500 ms", "500 ms 和 1000 ms", "兩種都是 500 ms", "兩種都是 1000 ms"],
        why: "一個接一個時，第二個等待要等第一個結束才開始。用 Promise.all 時，兩個等待是重疊的。" },
      { q: "<code>void saveScore(score)</code> 是什麼意思？",
        a: ["等 saveScore 跑完", "saveScore 不回傳任何東西", "取消儲存", "故意開始儲存，但不等它"],
        why: "void 是刻意把 Promise 丟掉。它把射後不理標記成一個決定，讓讀程式的人和 lint 規則都知道，這不是忘了寫 await。" }
    ]
  },
  {
    id: 'ts-modules',
    title: '模組：import 和 export',
    body: `
<p>一個真正的專案有幾百個檔案。每個檔案都需要一個方法，把一部分程式分享給別人，其他的留給自己。這就是 <code>import</code> 和 <code>export</code> 的用途。</p>
<h3>第一步：一個檔案就是一個模組</h3>
<p>在 TypeScript 裡，只要檔案裡有 <code>import</code> 或 <code>export</code>，它就是一個<b>模組</b>（module）。裡面宣告的每樣東西，都是這個檔案私有的，就像一間房子裡的房間。要讓別的檔案用某樣東西，你就開一扇門：<code>export</code>。別的檔案從那扇門走進來：<code>import</code>。</p>
<pre><code>// cards.ts
export const DECK_SIZE = 52;
export function isHigher(current: number, next: number): boolean {
  return next &gt; current;
}
const secret = 'only visible inside cards.ts';

// game.ts
import { DECK_SIZE, isHigher } from './cards';
console.log(DECK_SIZE, isHigher(3, 8));   // 52 true
// secret cannot be imported: it was never exported</code></pre>
<h3>第二步：具名匯出和預設匯出</h3>
<table>
<tr><th></th><th>具名匯出</th><th>預設匯出</th></tr>
<tr><td>一個檔案幾個</td><td>要幾個都可以</td><td>最多一個</td></tr>
<tr><td>匯出</td><td><code>export function isHigher()</code></td><td><code>export default class Deck</code></td></tr>
<tr><td>匯入</td><td><code>import { isHigher } from './cards'</code></td><td><code>import Deck from './deck'</code></td></tr>
<tr><td>匯入時的名字</td><td>必須一樣（要改名就用 <code>as</code>）</td><td>你想取什麼都可以</td></tr>
</table>
<p>自己的程式，用<b>具名匯出</b>（named export）比較安全。名字到處都一樣，所以編輯器的搜尋和重新命名都能找到每一個用到的地方，編輯器也能幫你自動補上 import。<b>預設匯出</b>（default export）匯入時可以取任何名字，結果同一個東西在這個檔案叫 <code>Deck</code>，在另一個檔案卻叫 <code>CardPile</code>。</p>
<p>另外兩種寫法你也會看到：<code>import * as cards from './cards'</code> 會把所有匯出放在同一個物件上，用 <code>cards.isHigher(...)</code> 來呼叫。<code>export { isHigher } from './cards'</code> 則是把別人的匯出轉手再匯出，<code>index.ts</code> 就是這樣把整個資料夾的匯出集中在一個地方。</p>
<p><b>Vue 對照：</b>每個 <code>.vue</code> 檔案都有一個預設匯出，就是元件本身。所以你才會寫 <code>import ScoreBoard from './ScoreBoard.vue'</code>，不加大括號，而且想叫它什麼都可以。</p>
<h3>第三步：import type</h3>
<pre><code>// types.ts
export type Guess = 'higher' | 'lower';
export interface Round { card: number; guess: Guess }
export const GUESSES: Guess[] = ['higher', 'lower'];

// game.ts
import type { Round } from './types';           // only types
import { type Guess, GUESSES } from './types';  // or mix a type and a value</code></pre>
<p>型別只存在於 TypeScript 檢查程式的時候。它把你的程式轉成 JavaScript 時，所有型別都會被拿掉。<b>純型別匯入</b>（type-only import）<code>import type</code> 的意思是「這個我只拿來檢查用」，整行都會從輸出裡消失。它讓讀程式的人看清楚，哪些才是執行時真正的相依，而且這對下面要講的循環匯入很重要。有些專案會打開 <code>verbatimModuleSyntax</code> 這個設定，那樣的話，每一個只用到型別的 import 都一定要標出來。</p>
<h3>第四步：路徑指到哪裡</h3>
<table>
<tr><th>你寫的</th><th>意思</th></tr>
<tr><td><code>'./cards'</code></td><td>同一個資料夾裡的 <code>cards.ts</code>。大部分打包工具的設定都可以省略副檔名。</td></tr>
<tr><td><code>'../ui/score'</code></td><td>往上一層資料夾，再進到 <code>ui</code></td></tr>
<tr><td><code>'vue'</code>、<code>'cc'</code></td><td>套件：從 <code>node_modules</code> 來的 Vue，或是 Cocos Creator 提供的引擎模組</td></tr>
<tr><td><code>'@/utils/format'</code></td><td><b>路徑別名</b>（path alias）：你自己設定的捷徑，通常代表 <code>src</code> 資料夾</td></tr>
</table>
<p>像 <code>@/</code> 這樣的別名要在兩個地方設定：<code>tsconfig.json</code> 裡的 <code>paths</code>，讓型別檢查找得到檔案；以及打包工具自己的別名設定（Vite 是 <code>resolve.alias</code>），讓建置出來的程式找得到。TypeScript 不會幫你改寫路徑。如果 import 在編輯器裡沒問題，app 一跑起來卻找不到，就去檢查第二個。</p>
<h3>第五步：打包工具拿這些做什麼</h3>
<p>瀏覽器可以把每個檔案都當成獨立的模組來載入，但幾百個小檔案一個一個下載很慢。<b>打包工具</b>（bundler）會從進入檔案開始，順著每一個 <code>import</code> 走，搞清楚哪個檔案需要哪個，然後把它們串成幾個大檔案，叫做 bundle。常見的有 Vite、webpack、esbuild，Cocos Creator 則有自己的建置流程。過程中，它會把沒有人 import 的匯出丟掉（<b>搖樹最佳化</b>，tree shaking），並且把每一個動態的 <code>import('./settings')</code> 變成獨立的檔案，等真的需要時才下載。</p>
<div class="tiers"><b>你的檔案</b><div><span class="box hot">main.ts<small>進入點</small></span><span class="box">game.ts</span><span class="box">cards.ts</span><span class="box">ui.ts</span><span class="box">settings.ts<small>用 import() 載入</small></span></div><b>Import 關係</b><div><span class="box">main &rarr; game &rarr; cards</span><span class="box">game &rarr; ui</span><span class="box">ui &rarr; settings，打開時才載入</span></div><b>Bundle</b><div><span class="box hot">index-3f9a.js<small>main、game、cards、ui</small></span><span class="box">settings-71c2.js<small>之後才下載</small></span></div></div>
<p>檔名裡那串奇怪的字母，是內容的指紋。這樣瀏覽器就能把檔案放在快取裡很久，內容一改又能抓到新的，因為檔名也跟著變了。開發的時候，Vite 大部分都跳過，把每個檔案當成獨立的模組直接交給瀏覽器；串成 bundle 是在建置（build）的時候才做。</p>
<h3>第六步：循環匯入</h3>
<p><b>循環匯入</b>（circular import）就是兩個檔案互相 import，可能是直接的，也可能是繞過別的檔案。這是允許的，而且常常沒事。會出問題的情況是：其中一個檔案還在載入的時候，就在最外層用到另一個檔案的值。</p>
<pre><code>// deck.ts
import { MAX_ROUNDS } from './rules';
export const DECK_SIZE = 52;
export function roundsLeft(done: number) { return MAX_ROUNDS - done; }

// rules.ts
import { DECK_SIZE } from './deck';
export const MAX_ROUNDS = DECK_SIZE - 1;   // used while loading

// main.ts
import { roundsLeft } from './deck';</code></pre>
<div class="flow"><span class="box">main.ts<small>需要 deck.ts</small></span><span class="arr">&rarr;</span><span class="box">deck.ts<small>要先跑 rules.ts</small></span><span class="arr">&rarr;</span><span class="box">rules.ts<small>需要 deck.ts：已經開始了，跳過</small></span><span class="arr">&rarr;</span><span class="box bad">rules.ts 開始跑<small>DECK_SIZE 還沒有值</small></span></div>
<p>一個模組在執行之前，它 import 的模組會先執行。所以 <code>deck.ts</code> 要等 <code>rules.ts</code>。但是 <code>rules.ts</code> 又 import 了 <code>deck.ts</code>，而它已經開始了，所以不會再開始一次。<code>rules.ts</code> 就這樣先跑，跑到 <code>DECK_SIZE - 1</code> 的時候，<code>deck.ts</code> 根本還沒設定 <code>DECK_SIZE</code>。看你的程式是怎麼建置的，結果會是下面兩種之一：</p>
<ul>
<li>一個錯誤：<code>ReferenceError: Cannot access 'DECK_SIZE' before initialization</code>。原生模組會這樣，例如開發中的 Vite。</li>
<li>沒有錯誤，但值是 <code>und&#101;fined</code>，於是 <code>MAX_ROUNDS</code> 變成 <code>NaN</code>。CommonJS 的輸出，以及某些引擎自己的模組載入器會這樣。如果是 class，錯誤訊息常常是 <code>Class extends value und&#101;fined is not a constructor or null</code>。</li>
</ul>
<p>看一下 <code>roundsLeft</code>：它也用到另一個檔案的值，但只在一個之後才會跑的函式裡面用，那時兩個檔案都已經載入完了。這樣沒問題。而且如果 <code>main.ts</code> 先 import 的是 <code>rules.ts</code>，一切都會正常。這就是這種 bug 看起來很隨機的原因：它取決於哪個檔案剛好先載入。</p>
<h3>怎麼修好循環匯入</h3>
<ul>
<li><b>把共用的部分搬出去。</b>把 <code>DECK_SIZE</code> 和 <code>MAX_ROUNDS</code> 放到第三個檔案 <code>constants.ts</code>，它什麼都不 import。兩個檔案都從它那裡 import，圈圈就不見了。</li>
<li><b>用 import type</b>，當其中一邊只需要型別的時候。型別匯入會從輸出裡拿掉，所以在執行時不會形成圈圈。</li>
<li><b>傳進去，不要反過來 import。</b>如果一個底層檔案需要呼叫上層的東西，就讓上層檔案把函式交給它，或是讓它監聽一個事件（見設計模式那一課）。</li>
<li><b>讓工具幫你找。</b><code>npx madge --circular --extensions ts src</code> 會列出每一個圈圈，ESLint 規則 <code>import/no-cycle</code> 則能擋住新的圈圈。</li>
</ul>
<div class="flow"><span class="box">deck.ts</span><span class="arr">&rarr;</span><span class="box hot">constants.ts<small>什麼都不 import</small></span><span class="arr">&larr;</span><span class="box">rules.ts</span></div>
<h3>深入一點：沒有 import 也沒有 export 的檔案</h3>
<p>如果檔案裡兩個都沒有，TypeScript 會把它當成舊式的腳本（script）：最外層的名字都是全域的，可能跟別的檔案撞名。這就是為什麼你在 TypeScript Playground 寫 <code>const name</code> 時，它會抱怨 <code>Cannot redeclare block-scoped variable 'name'</code>：瀏覽器本來就有一個叫 <code>name</code> 的全域變數。加上 <code>export {};</code> 就會讓檔案變成模組，撞名也就消失了。</p>`,
    tryNote: '把每段程式貼到 TypeScript Playground（typescriptlang.org/play）。錯誤會用紅色底線標出來；右邊的 .JS 分頁會顯示 JavaScript 的輸出。',
    try: [
      '沒有錯誤。現在把第一行刪掉：沒有 import 或 export 的檔案是腳本，name 就會跟瀏覽器的全域變數撞名。',
      '打開 .JS 分頁：型別從輸出裡消失了，常數還在。',
      '按 Run。這就是循環匯入的那種失敗，只是放在同一個檔案裡：值在設定它的那一行執行之前就被用到了。過了那一行，就正常了。'
    ],
    own: `挑你自己專案裡的一個資料夾，在紙上畫出它的 import：一個檔案一個方框，一個 import 一個箭頭。找找看有沒有往回指的箭頭，也就是從底層檔案（helper、常數）指向上層檔案（頁面、遊戲控制器）。如果你有 Node，在專案裡跑 <code>npx madge --circular --extensions ts src</code>，看看它有沒有找到圈圈。挑一個修好：把共用的部分搬到它自己的檔案。`,
    quiz: [
      { q: "<code>import { Deck } from './deck'</code> 和 <code>import Deck from './deck'</code> 差在哪裡？",
        a: ["沒有差別，兩個一樣", "第一個匯入的是具名匯出，名字必須一樣；第二個匯入的是預設匯出，名字隨你取", "第一個用在型別，第二個用在值", "第二個會匯入檔案裡的所有東西"],
        why: "大括號是照確切的名字挑具名匯出。沒有大括號，指的是那唯一的預設匯出，名字可以自己取。" },
      { q: "你的別名 <code>@/</code> 在編輯器裡沒問題，app 跑起來卻找不到檔案。最可能的原因是什麼？",
        a: ["那個檔案用了預設匯出", "TypeScript 版本太舊", "別名只設定在 tsconfig.json，沒有設定在打包工具自己的設定裡", "別名只對 .vue 檔有效"],
        why: "tsconfig 的 paths 只負責指引型別檢查。打包工具在建置時要找到檔案，需要它自己的別名設定。" },
      { q: "兩個檔案互相 import。什麼時候才真的會出問題？",
        a: ["永遠會：建置會直接拒絕", "永遠不會：模組會處理好", "只有在 Vue 專案裡", "一個檔案還在載入時，就在最外層用到另一個檔案的值，而那個值還沒被設定"],
        why: "之後才在函式裡用到的值沒問題。載入期間在最外層使用，就可能碰到還沒設定好的值。" }
    ]
  },
  {
    id: 'ts-patterns',
    title: '你一定會遇到的設計模式',
    body: `
<p><b>設計模式</b>（design pattern）是一個問題反覆出現時，大家都知道的固定解法。沒有人刻意去發明它：是大家在很多程式裡看到同一種解法，就幫它取了名字。真正有用的就是那個名字。同事說「分數標籤在觀察遊戲」，你馬上就知道整個結構長什麼樣子。下面是你在前端和遊戲程式裡最常遇到的五種模式，每一種都有一個小例子、一張圖，以及什麼時候值得用。</p>
<h3>1. 單例：共用同一個實例</h3>
<p>有些東西就應該只存在一個：音效播放器、設定、跟伺服器的連線。<b>單例</b>（singleton）是一個 class，它會確保只有一個實例，並且把同一個實例交給每一個人。</p>
<pre><code>class Sound {
  private static instance: Sound | null = null;
  static get(): Sound {
    if (!Sound.instance) Sound.instance = new Sound();
    return Sound.instance;
  }
  private constructor() {}            // nobody else can write new Sound()
  play(clip: string) { console.log('play', clip); }
}
Sound.get().play('flip');
console.log(Sound.get() === Sound.get());   // true</code></pre>
<div class="flow"><span class="box">選單</span><span class="box">遊戲</span><span class="box">設定</span><span class="arr">&rarr;</span><span class="box hot">Sound.get()<small>同一個物件</small></span></div>
<p>TypeScript 有更短的寫法。一個模組不管被多少檔案 import，都只會執行一次，所以單純一行 <code>export const sound = new Sound();</code> 就已經是大家共用的了。<b>Vue 對照：</b>Pinia store 就是這樣運作的。每個元件裡的每一次 <code>useGameStore()</code>，拿到的都是同一個 store。</p>
<p>真的只有一個的東西，值得這樣做。如果拿它當方便的全域箱子、什麼都往裡面放，就是過度設計（over-engineering）了：每個檔案都摸得到、改得到，於是很難看出是誰改了什麼，測試之間也很難重設。</p>
<h3>2. 觀察者與事件匯流排：訂閱、發送、取消訂閱</h3>
<p>遊戲知道分數什麼時候變了。分數標籤、音效、成就系統都想知道。遊戲不應該需要認識它們每一個。在<b>觀察者</b>（observer）模式裡，有興趣的人去訂閱一個事件，遊戲把事件發送出去，每個訂閱者都會被呼叫。誰不想再聽了，就取消訂閱。就像追蹤一個頻道：頻道發一次文，每個追蹤的人都會收到。</p>
<pre><code>type Listener&lt;T&gt; = (value: T) =&gt; void;
class Signal&lt;T&gt; {
  private listeners = new Set&lt;Listener&lt;T&gt;&gt;();
  on(fn: Listener&lt;T&gt;) {
    this.listeners.add(fn);
    return () =&gt; { this.listeners.delete(fn); };   // call it to unsubscribe
  }
  emit(value: T) { this.listeners.forEach(fn =&gt; fn(value)); }
}
const scoreChanged = new Signal&lt;number&gt;();
const off = scoreChanged.on(s =&gt; console.log('label shows', s));
scoreChanged.on(s =&gt; { if (s === 10) console.log('achievement!'); });
scoreChanged.emit(3);
off();                                               // the label stops listening</code></pre>
<div class="flow"><span class="box hot">遊戲<small>emit(3)</small></span><span class="arr">&rarr;</span><span class="box">分數標籤<small>已訂閱</small></span><span class="box">音效<small>已訂閱</small></span><span class="box">成就<small>已訂閱</small></span></div>
<p><b>事件匯流排</b>（event bus）是同一個概念，只是用一個共用的發送器，搭配很多個事件名稱，讓 app 裡任何一個部分都能跟任何其他部分溝通。</p>
<p><b>Vue 對照：</b>子元件的 <code>emit('guess', 'higher')</code> 就是只限一個父元件的觀察者，用 <code>defineEmits</code> 宣告並加上型別。Vue 3 拿掉了舊的 <code>$on</code> 和 <code>$off</code>，它的遷移指南建議用 <code>mitt</code> 這類小函式庫來做全 app 的事件匯流排：<code>emitter.on('score', fn)</code>、<code>emitter.emit('score', 3)</code>、<code>emitter.off('score', fn)</code>。Cocos Creator 也內建了同樣的東西：節點和 <code>EventTarget</code> 都有 <code>on</code>、<code>off</code> 和 <code>emit</code>。</p>
<p>一件事發生、好幾個不相關的部分都要反應時，值得用。如果只是一個父元件跟一個子元件說話，就是過度設計，直接呼叫函式或用 prop 比較好追。兩個經典的 bug：忘了取消訂閱，結果一個已經被銷毀的畫面還在反應；以及匯流排太熱鬧，沒有人搞得清楚是誰發送了什麼。</p>
<h3>3. 狀態機：狀態和允許的移動</h3>
<p>Higher or Lower（猜大小）的一回合有好幾個階段。玩家只有在牌翻開、等著猜的時候才能猜，翻下一張牌的時候不行。如果用一堆零散的旗標，像 <code>isDealing</code>、<code>isRevealing</code>、<code>isOver</code>，沒有任何東西能阻止其中兩個同時是 true。<b>狀態機</b>（state machine）把它們換成一個值，也就是目前的狀態，再加上一張表，寫清楚每個狀態可以移到哪些狀態。</p>
<div class="flow"><span class="box">waiting</span><span class="arr">&rarr;</span><span class="box">dealing</span><span class="arr">&rarr;</span><span class="box hot">guessing<small>按鈕可以按</small></span><span class="arr">&rarr;</span><span class="box">revealing</span><span class="arr">&rarr;</span><span class="box">result<small>下一回合：dealing；遊戲結束：waiting</small></span></div>
<pre><code>type State = 'waiting' | 'dealing' | 'guessing' | 'revealing' | 'result';
const allowed: Record&lt;State, State[]&gt; = {
  waiting: ['dealing'],
  dealing: ['guessing'],
  guessing: ['revealing'],
  revealing: ['result'],
  result: ['dealing', 'waiting'],
};
let state: State = 'guessing';
function go(next: State): boolean {
  if (!allowed[state].includes(next)) return false;   // not allowed: refuse
  state = next;
  return true;
}
function onGuess() {
  if (!go('revealing')) return;                         // a second fast click is refused
  console.log('revealing the next card');
}</code></pre>
<p>現在，連按兩下 Higher 也不會翻出兩張牌，因為第二下要求的，是從 <code>revealing</code> 出發、不被允許的移動。所有「這件事什麼時候可以發生」的規則，都集中在一張讀得懂的表裡。</p>
<p><b>Vue 對照：</b>按鈕上用一個 <code>state</code> ref 加上 <code>v-if="state === 'guessing'"</code>，比用三個必須互相配合的布林 ref 容易寫對得多。</p>
<p>只要東西有階段，而且順序錯了就是 bug，就值得用：遊戲的一回合、結帳流程、多步驟的表單、檔案上傳。單純的開關切換就是過度設計。比較大的狀態機，可以用 XState 這類函式庫，它會多給你圖表和測試工具。</p>
<h3>4. 工廠：一個函式決定要做出什麼</h3>
<pre><code>interface Deck { cards: number[]; label: string }
function createDeck(kind: 'classic' | 'kids'): Deck {
  const top = kind === 'kids' ? 10 : 13;               // kids play without J, Q, K
  const cards: number[] = [];
  for (let rank = 1; rank &lt;= top; rank++) cards.push(rank, rank, rank, rank);
  return { cards, label: kind === 'kids' ? 'Kids deck' : 'Classic deck' };
}
const deck = createDeck('kids');
console.log(deck.label, deck.cards.length);   // Kids deck 40</code></pre>
<div class="flow"><span class="box">'kids'</span><span class="arr">&rarr;</span><span class="box hot">createDeck()<small>決定怎麼做</small></span><span class="arr">&rarr;</span><span class="box">Deck<small>40 張牌</small></span></div>
<p><b>工廠</b>（factory）是一個專門負責做出物件的函式。其他程式只要說「給我一副兒童牌」，不需要知道一副牌是怎麼組起來的。如果做法的規則改了，只要改工廠就好。你其實早就在用工廠了：Vue 的 <code>createApp()</code> 和 <code>createRouter()</code>，還有 Cocos Creator 的 <code>instantiate(prefab)</code>，它會照著一個範本做出節點。</p>
<p>製作過程不只一行，或是要做哪一種要到執行時才由資料決定（例如關卡檔寫著這裡要放哪一種敵人），就值得用。如果它只是把 <code>new Thing()</code> 包一層、根本沒有東西要決定，就是過度設計。</p>
<h3>5. 策略：換掉做法，保留形狀</h3>
<pre><code>type Guess = 'higher' | 'lower';
type Strategy = (current: number) =&gt; Guess;

const careful: Strategy = c =&gt; (c &lt; 7 ? 'higher' : 'lower');
const coinFlip: Strategy = () =&gt; (Math.random() &lt; 0.5 ? 'higher' : 'lower');

function botTurn(current: number, think: Strategy): Guess {
  return think(current);
}
console.log(botTurn(3, careful), botTurn(3, coinFlip));</code></pre>
<div class="flow"><span class="box hot">botTurn(current, think)</span><span class="arr">&larr;</span><span class="box">careful<small>小於 7：猜 higher</small></span><span class="box">coinFlip<small>隨機</small></span><span class="box">你自己寫的<small>形狀一樣</small></span></div>
<p><b>策略</b>（strategy）是做一件事的其中一種方法，藏在一個所有方法都共用的形狀後面。換一種方法時，使用它的程式完全不用改。在 TypeScript 裡，這個形狀通常就是一個函式型別，所以策略就只是一個你傳進去的函式。你其實已經用了好幾年：你交給 <code>sort</code> 的那個函式，就是一種比較的策略。</p>
<p>真的有好幾種做法，而且要在它們之間選擇時，值得用：電腦對手的難度、排序方式、計分規則。如果只有一種做法，也沒打算加第二種，就是過度設計。一個 <code>if</code> 就夠了。</p>
<h3>深入一點：什麼時候該用模式</h3>
<table>
<tr><th>模式</th><th>它解決的問題</th><th><b>過度設計</b>的徵兆</th></tr>
<tr><td>單例</td><td>剛好一個、大家共用的東西</td><td>什麼都變成全域的 manager</td></tr>
<tr><td>觀察者、事件匯流排</td><td>一個事件，很多個不相關的聽眾</td><td>沒有人搞得清楚是誰發送了什麼</td></tr>
<tr><td>狀態機</td><td>必須照順序發生的階段</td><td>只有兩個狀態、沒有規則的開關</td></tr>
<tr><td>工廠</td><td>製作很複雜，或要到執行時才決定</td><td>只包了一個 <code>new</code></td></tr>
<tr><td>策略</td><td>同一件事有好幾種可以互換的做法</td><td>其實只有一種做法</td></tr>
</table>
<p>模式是解法的名字，不是目標。先寫最簡單的版本。等同一種痛第三次出現（連點兩下就把回合弄壞、同一段製作物件的程式被複製到五個檔案），再拿最符合那種痛的模式來用。</p>`,
    tryNote: '把每段程式貼到 TypeScript Playground（typescriptlang.org/play），按 Run，然後看右邊的 Logs 分頁。',
    try: [
      '永遠是同一個物件，所以印出 true。加一行 new Sound()，看看錯誤訊息。',
      '兩個聽眾都聽到 3。呼叫 off() 之後，只剩音效聽到 4。',
      '同樣的移動連續要求兩次，第二次會被拒絕：true false true。',
      '同一個 sort，兩種策略：先由小到大，再由大到小。'
    ],
    own: `拿你自己程式裡的一個功能，找找看每一種模式：一個共用的實例、一個事件或 emit、一組其實就是狀態機的旗標、一個負責做出物件的函式、一個傳進去決定行為的函式。針對那組旗標，像這一課那樣，把狀態和允許的移動寫成一張表。有沒有哪種旗標組合應該是不可能出現的，但現在的程式卻允許？`,
    quiz: [
      { q: "一回合用了 isDealing、isRevealing、isOver 三個旗標，結果出了一個 bug：翻牌的時候還能接受猜測。哪一種模式最能直接修好它？",
        a: ["單例", "狀態機", "工廠", "策略"],
        why: "一個目前狀態，加上一張允許移動的表，就能讓錯誤的組合不可能出現，也會拒絕在錯的時間發生的移動。" },
      { q: "觀察者模式最常見的 bug 是什麼？",
        a: ["忘了取消訂閱，結果已經不在的畫面還在反應", "發送得太快", "用 Set 存聽眾", "聽眾超過一個"],
        why: "從來沒被移除的聽眾會一直活著，替一個早該結束的物件繼續執行。" },
      { q: "在 TypeScript 裡，策略模式最簡單的形式是什麼？",
        a: ["有 private 建構子的 class", "一個全域變數", "一個 import 自己的檔案", "當作參數傳進去的函式，搭配一個共用的函式型別"],
        why: "共用的函式型別就是那個形狀。任何符合這個型別的函式都能換進去，就像你交給 sort 的比較函式一樣。" }
    ]
  },
  {
    id: 'ts-reading',
    title: '怎麼讀別人寫的程式',
    body: `
<p>在你大部分的工作生涯裡，讀程式的時間都會比寫程式多：新工作、一個函式庫、同事寫的功能。沒有人會像讀一本書那樣讀一個專案，從第一個檔案讀到最後一個。東西太多了，而且大部分跟你今天的問題無關。這一課是一套方法：從一個動作開始，跟著它走，其他的刻意先不管。</p>
<h3>第一步：找到進入點</h3>
<p>每個程式都有一個起點。那個地方就是<b>進入點</b>（entry point），其他所有東西都是從那裡走到的。</p>
<table>
<tr><th>專案類型</th><th>從哪裡開始</th></tr>
<tr><td>Vue app</td><td><code>main.ts</code>，裡面呼叫 <code>createApp(App).mount('#app')</code>；接著是 router 的頁面清單</td></tr>
<tr><td>Cocos Creator 遊戲</td><td>建置面板裡選的起始場景，以及它節點上的元件</td></tr>
<tr><td>Node 伺服器</td><td><code>package.json</code> 裡啟動指令所指定的那個檔案</td></tr>
<tr><td>函式庫</td><td>它對外匯出的那個檔案，通常是 <code>index.ts</code></td></tr>
</table>
<p>進入檔案也不要一行一行讀。看一下它啟動了什麼，然後挑一個動作。</p>
<h3>第二步：挑一個動作，從頭追到尾</h3>
<p>挑一件使用者會做的事，例如按一個按鈕，從它發生的那一刻，一路追到畫面改變的那一刻。完整走過一條路，比十個檔案各讀一半學到的還多，因為它讓你看到各層是怎麼接起來的：輸入、邏輯、資料，再回到畫面。</p>
<h3>第三步：三個圈圈</h3>
<p>沿著這條路，你會遇到很多函式。把每一個放進三個圈圈的其中一個：</p>
<div class="tiers"><b>現在要懂</b><div><span class="box hot">路上那些決定會發生什麼事的程式</span></div><b>黑盒子</b><div><span class="box">知道什麼進去、什麼出來，不管怎麼做到<small>請求的 helper、函式庫、動畫</small></span></div><b>先不管</b><div><span class="box">其他所有東西，暫時先放著<small>日誌、其他功能、少見的情況</small></span></div></div>
<p>最省時間的是<b>黑盒子</b>（black box）那一圈。對 <code>drawCard(): Promise&lt;number&gt;</code>，你只需要知道「它之後會給我一張牌」，而它的型別簽名就已經告訴你了。哪天有空再打開它。</p>
<h3>第四步：讓編輯器幫你走</h3>
<table>
<tr><th>動作</th><th>Mac 上的 VS Code</th><th>回答的問題</th></tr>
<tr><td>跳到定義（go to definition）</td><td>F12，或按住 Cmd 點一下</td><td>這是在哪裡做出來的？</td></tr>
<tr><td>預覽定義</td><td>Option F12</td><td>不離開檔案，先看一眼</td></tr>
<tr><td>尋找所有參考（find all references）</td><td>Shift Option F12</td><td>誰用了這個？</td></tr>
<tr><td>回到上一個位置</td><td>Ctrl 加減號</td><td>回到我剛剛在的地方</td></tr>
<tr><td>在檔案中搜尋</td><td>Cmd Shift F</td><td>這段文字出現在哪裡？</td></tr>
<tr><td>跳到符號</td><td>Cmd T</td><td>叫這個名字的函式在哪裡？</td></tr>
</table>
<p>不是名字的東西，就用搜尋。按鈕上的文字，例如 Higher，通常直接就能帶你找到處理它的程式。寫成字串的事件名稱，例如 <code>'score'</code>，要用搜尋來找，跳到定義是找不到的。</p>
<h3>第五步：跟著資料走，不要跟著檔案走</h3>
<p>檔案是程式存放的方式，不是程式運作的方式。挑一份資料，例如分數，問三個問題：它在哪裡被建立？在哪裡被改變？在哪裡被顯示？對分數找一次所有參考，前兩題幾秒鐘就有答案。會改變它的那些地方，就是 bug 住的地方。一個值走過的這條路，就是它的<b>資料流</b>（data flow）。</p>
<div class="flow"><span class="box">建立<small>score = 0</small></span><span class="arr">&rarr;</span><span class="box hot">改變<small>猜對之後 score += 1</small></span><span class="arr">&rarr;</span><span class="box">顯示<small>分數標籤</small></span></div>
<h3>第六步：驗證你的猜測</h3>
<p>讀程式會讓你得到一個猜測，例如「按 Higher 會呼叫 <code>onGuess</code>」。在拿它當基礎繼續往下之前，先確認。一個加了清楚標籤的暫時 log 通常就夠了：<code>console.log('[trace] onGuess', guess, state)</code>。想知道是誰呼叫了某個函式，就印出 <code>new Error().stack</code>，或是呼叫 <code>console.trace()</code>。想停下來四處看看，就在瀏覽器的開發者工具裡設一個<b>中斷點</b>（breakpoint），或在程式裡寫 <code>debugger;</code>。程式會停在那裡，你可以檢查每一個變數，以及<b>呼叫堆疊</b>（call stack）：一路呼叫到這一行的函式清單。commit 之前，全部拿掉。</p>
<h3>第七步：邊讀邊寫一頁地圖</h3>
<pre><code>MAP: clicking Higher
entry    main.ts             mountButtons()
input    ui/buttons.ts       click -&gt; onGuess('higher')
logic    game/controller.ts  onGuess: checks the state, asks for the next card
         game/rules.ts       isCorrect(current, next, guess)    [understand]
data     api/deck.ts         drawCard()                         [black box]
screen   ui/score-view.ts    listens for 'score', sets the label
open     who resets the score when a new game starts?</code></pre>
<p>這樣的地圖短到可以記在腦子裡，一個禮拜後你忘了的時候也還是有用。寫它的過程也會讓你看到缺口：你填不出來的那一行，就是你的下一個問題。</p>
<h3>實際走一次：Higher or Lower 裡的一次點擊</h3>
<p>想像一個你從沒看過的小型網頁版 Higher or Lower（猜大小），檔案就是上面地圖裡的那些。問題是：玩家按下 Higher 的時候，到底發生了什麼事？</p>
<div class="flow"><span class="box">按下 Higher<small>ui/buttons.ts</small></span><span class="arr">&rarr;</span><span class="box hot">onGuess<small>game/controller.ts</small></span><span class="arr">&rarr;</span><span class="box">drawCard<small>黑盒子</small></span><span class="arr">&rarr;</span><span class="box hot">isCorrect<small>規則本身</small></span><span class="arr">&rarr;</span><span class="box">emit('score')</span><span class="arr">&rarr;</span><span class="box">分數標籤<small>ui/score-view.ts</small></span></div>
<ol>
<li><b>搜尋按鈕文字。</b>搜尋 Higher，找到 <code>ui/buttons.ts</code>：<code>higherBtn.addEventListener('click', () =&gt; onGuess('higher'))</code>。</li>
<li>對 <code>onGuess</code> <b>跳到定義</b>。它打開了 <code>game/controller.ts</code>：
<pre><code>export async function onGuess(guess: Guess) {
  if (!machine.go('revealing')) return;     // ignore clicks at the wrong time
  const next = await drawCard();
  if (isCorrect(current, next, guess)) {
    score += 1;
    events.emit('score', score);
  }
  current = next;
  machine.go('result');
}</code></pre></li>
<li><b>分進三個圈圈。</b><code>machine.go</code> 是一個狀態機；你懂這個模式，所以把它當黑盒子。<code>drawCard</code> 之後會給一張牌：黑盒子。<code>isCorrect</code> 決定結果：現在要懂。打開它，你會看到 <code>return guess === 'higher' ? next &gt; current : next &lt; current;</code>。這時你發現，牌一樣大的時候，不管猜哪邊都算錯。這條規則值得寫進你的地圖。</li>
<li><b>跟著資料走。</b><code>events.emit('score', score)</code> 把分數送了出去。搜尋 <code>'score'</code>，你會找到 <code>ui/score-view.ts</code>，它用 <code>events.on('score', ...)</code> 訂閱，然後設定標籤的文字。整條路就完整了。</li>
<li><b>確認。</b>在 <code>isCorrect</code> 那一行設一個中斷點，在瀏覽器裡按 Higher，然後在除錯器裡看 <code>current</code> 和 <code>next</code>。你對「一樣大」的猜測，十秒鐘內就會被證實或修正。</li>
</ol>
<p>六個檔案，但你只讀了大約四十行，現在卻能解釋這個功能、修改一樣大時的規則，或是追查分數的 bug。這就是目標：不是什麼都懂，而是懂你需要的那條路。</p>
<h3>深入一點：越讀越快</h3>
<ul>
<li>先讀型別。像 <code>(guess: Guess) =&gt; Promise&lt;void&gt;</code> 這樣的簽名，在你讀函式本體之前，就已經告訴你它大部分在做什麼。</li>
<li>有測試的話，讀測試。一個測試就是一個小小的、能跑的範例，示範這段程式本來打算怎麼被使用。</li>
<li>利用歷史紀錄。<code>git log -p -- game/rules.ts</code> 會顯示一個檔案是怎麼一路改過來的，<code>git blame</code> 則顯示每一行最後是哪個 commit 改的；那個 commit 的訊息，常常就解釋了那段奇怪的地方。</li>
<li>讀的時候先不要修。把奇怪的地方記在地圖上，等你搞懂整條路再回來處理。</li>
</ul>`,
    tryNote: '把每段程式貼到 TypeScript Playground（typescriptlang.org/play）。按 Run 看 Logs 分頁，或在名字上按右鍵，使用編輯器的選單。',
    try: [
      '堆疊會列出 c、b、a：一路呼叫到這裡的路徑，最新的在最上面。',
      '在 score 上按右鍵，選 Go to References。清單會列出每一個建立、改變或讀取它的地方。',
      '實際走一次裡的那條規則。牌一樣大時，猜哪邊都錯：false false。'
    ],
    own: `在你參與的 app 裡，挑一個你從來沒追過的按鈕。只用跳到定義、尋找所有參考和搜尋，從事件處理函式一路追到畫面改變的那一刻。把遇到的東西分進三個圈圈，像這一課那樣寫一張地圖，至少要有一個還沒解答的問題。然後用中斷點確認你的其中一個猜測。`,
    quiz: [
      { q: "你加入一個有 300 個檔案的專案。要搞懂其中一個功能，最好的第一步是什麼？",
        a: ["照字母順序讀每一個檔案", "用你自己的風格把功能重寫一遍", "從進入點開始，挑一個使用者動作從頭追到尾", "先讀最長的那個檔案"],
        why: "一條完整的路，會讓你看到各層怎麼接起來，也讓你避開跟問題無關的程式。" },
      { q: "有個 helper <code>drawCard(): Promise&lt;number&gt;</code> 在你的路上，但跟你的問題無關。你該怎麼處理它？",
        a: ["當成黑盒子：它之後會給一個數字，目前知道這樣就夠了", "繼續之前，先把它每一行都讀完", "刪掉它", "把它抄進你的筆記"],
        why: "它的簽名已經說明了什麼進去、什麼出來。只有在你的問題帶你走進它裡面時，才需要打開它。" },
      { q: "你猜某個點擊會呼叫 <code>onGuess</code>，但不太確定。最快又可靠的確認方法是什麼？",
        a: ["在團隊群組裡問，然後等", "加一個有標籤的 console.log 或中斷點，點一下看看", "把檔案再讀一遍", "把函式改名"],
        why: "實際跑程式，才看得到真正發生了什麼。一個 log 或中斷點，幾秒鐘就能把猜測變成事實。" }
    ]
  }
  ]
});
