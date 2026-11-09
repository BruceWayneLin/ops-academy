M({
  id: 'ts3', n: 3, track: 'ts',
  title: 'Code you meet every day',
  zh: '每天都會碰到的程式碼：陣列與物件、閉包與 this、Promise 與 async/await、模組、常見設計模式，以及怎麼讀別人寫的程式。',
  time: '2 weeks',
  blurb: 'The code inside every real TypeScript project: array methods and copies, closures and this, promises and await, imports, the common design patterns, and a method for reading code you did not write.',
  lessons: [
  {
    id: 'ts-arrays', lv: 1, mins: 14,
    title: 'Arrays and objects: map, filter, reduce and copies',
    zh: 'map、filter、find、some、every、reduce 都不會改到原本的陣列，而是交回一個新結果。物件用 Object.keys／values／entries 拆成陣列，用展開 ... 複製和合併，用解構一次取出好幾個值。不去改舊值、改做一個新的，就叫不可變性。',
    body: `
<p>Most of the code you read every day does one of two things. It takes a list and makes something from it, or it takes an object and makes a changed copy. JavaScript has a small set of tools for exactly this. Learn these and a large part of any codebase becomes easy to read.</p>
<p>All through this lesson we use one list: the cards a player has drawn in a game of Higher or Lower.</p>
<pre><code>const cards: number[] = [3, 8, 5, 12];</code></pre>
<h3>Step 1: each method takes a small function</h3>
<p>Every method below takes a function that you write, and calls it once per item, in order. A function you hand over for someone else to call is a <b>callback</b>. It receives the item (and its position, if you ask for it). What your callback returns decides what the method does with that item.</p>
<h3>map: change every item</h3>
<p><code>map</code> calls your function on each item and collects what it returns into a new array of the same length.</p>
<div class="flow"><span class="box">[3, 8, 5, 12]</span><span class="arr">&rarr;</span><span class="box hot">map(c =&gt; c * 10)<small>runs 4 times</small></span><span class="arr">&rarr;</span><span class="box">[30, 80, 50, 120]<small>same length, new array</small></span></div>
<h3>filter: keep some items</h3>
<p><code>filter</code> keeps the items for which your function returns <code>true</code>. Here the test is <code>c =&gt; c &gt; 6</code>. The result can be shorter than the original, or empty.</p>
<div class="flow"><span class="box bad">3<small>dropped</small></span><span class="box">8<small>kept</small></span><span class="box bad">5<small>dropped</small></span><span class="box">12<small>kept</small></span><span class="arr">&rarr;</span><span class="box hot">[8, 12]</span></div>
<h3>find: the first match, or nothing</h3>
<p><code>find</code> returns the first item that passes the test, and stops looking. If nothing passes, it returns <code>und&#101;fined</code>. That is why TypeScript types the result as <code>number | und&#101;fined</code> and makes you check it before use.</p>
<div class="flow"><span class="box bad">3<small>no</small></span><span class="arr">&rarr;</span><span class="box hot">8<small>yes: stop</small></span><span class="arr">&rarr;</span><span class="box">result: 8<small>5 and 12 are never checked</small></span></div>
<h3>some and every: yes-or-no questions</h3>
<p><code>some</code> asks &ldquo;does at least one item pass?&rdquo; and stops at the first yes. <code>every</code> asks &ldquo;do all items pass?&rdquo; and stops at the first no.</p>
<div class="flow"><span class="box">some(c =&gt; c &gt; 10)</span><span class="arr">&rarr;</span><span class="box bad">3</span><span class="box bad">8</span><span class="box bad">5</span><span class="box hot">12<small>yes: stop</small></span><span class="arr">&rarr;</span><span class="box">true</span></div>
<div class="flow"><span class="box">every(c =&gt; c &gt; 4)</span><span class="arr">&rarr;</span><span class="box bad">3<small>no: stop</small></span><span class="arr">&rarr;</span><span class="box">false<small>8, 5 and 12 are never checked</small></span></div>
<h3>reduce: boil a list down to one value</h3>
<p><code>reduce</code> walks the list carrying one value along, called the <b>accumulator</b>. You give it a starting value. For each item, your function receives the accumulator so far and the item, and returns the new accumulator. The last one is the result.</p>
<pre><code>const total = cards.reduce((sum, c) =&gt; sum + c, 0);   // 28</code></pre>
<div class="flow"><span class="box">start 0</span><span class="arr">&rarr;</span><span class="box">+3 = 3</span><span class="arr">&rarr;</span><span class="box">+8 = 11</span><span class="arr">&rarr;</span><span class="box">+5 = 16</span><span class="arr">&rarr;</span><span class="box hot">+12 = 28</span></div>
<p><code>reduce</code> can build anything, which also makes it the hardest of these to read. If <code>map</code>, <code>filter</code> or a plain loop says it more clearly, use that.</p>
<table>
<tr><th>Method</th><th>Gives back</th><th>Stops early</th><th>Question it answers</th></tr>
<tr><td><code>map</code></td><td>New array, same length</td><td>No</td><td>Every card times ten?</td></tr>
<tr><td><code>filter</code></td><td>New array, maybe shorter</td><td>No</td><td>Only the high cards?</td></tr>
<tr><td><code>find</code></td><td>One item, or nothing</td><td>At the first yes</td><td>The first high card?</td></tr>
<tr><td><code>some</code></td><td>true or false</td><td>At the first yes</td><td>Any card over 10?</td></tr>
<tr><td><code>every</code></td><td>true or false</td><td>At the first no</td><td>All cards over 4?</td></tr>
<tr><td><code>reduce</code></td><td>Whatever you build</td><td>No</td><td>The total?</td></tr>
</table>
<p>In a real game you combine them. Here each round records the card, the guess and whether it was right:</p>
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
<h3>Objects: keys, values and entries</h3>
<pre><code>const best = { mia: 12, leo: 7, ana: 9 };
Object.keys(best);      // ['mia', 'leo', 'ana']
Object.values(best);    // [12, 7, 9]
Object.entries(best);   // [['mia', 12], ['leo', 7], ['ana', 9]]
for (const [player, points] of Object.entries(best)) {
  console.log(player, points);
}</code></pre>
<p>These three turn an object into an array, so every array method above works on it. One surprise: <code>Object.keys</code> is typed as <code>string[]</code>, not as the exact key names, because TypeScript cannot be sure that an object has no extra keys at run time.</p>
<h3>Spread: copy and merge</h3>
<p>Three dots, <code>...</code>, mean &ldquo;spread the contents out here&rdquo;. Inside <code>[ ]</code> they spread the items of an array. Inside <code>{ }</code> they spread the properties of an object. This is <b>spread syntax</b>.</p>
<pre><code>const more = [...cards, 9];                          // [3, 8, 5, 12, 9]
const defaults = { sound: true, speed: 1 };
const settings = { ...defaults, speed: 2 };          // { sound: true, speed: 2 }
const player = { nick: 'Mia', score: 4 };
const next = { ...player, score: player.score + 1 }; // a changed copy</code></pre>
<p>When two sources have the same key, the one written later wins. That is why &ldquo;defaults first, then overrides&rdquo; is such a common line.</p>
<h3>Destructuring: take values out by name or position</h3>
<pre><code>const { nick, score: points } = player;    // two variables; score renamed
const [first, second, ...rest] = cards;    // 3, 8 and [5, 12]
function start({ speed = 1 }: { speed?: number }) {
  console.log('speed', speed);             // 1 when speed is missing
}</code></pre>
<p><b>Destructuring</b> is the reverse of building an object: braces take properties out by name, square brackets take items out by position, and <code>...rest</code> collects whatever is left.</p>
<h3>Why none of these change the original</h3>
<p>After all of the above, <code>cards</code> is still <code>[3, 8, 5, 12]</code>. These methods and spread always make something new. The habit has a name, <b>immutability</b>: you do not change a value in place, you make a new one. Why bother?</p>
<ul>
<li>Old and new can be compared. If <code>next !== player</code>, something changed. If you had changed <code>player</code> in place, both names would point at the same object and you could not tell.</li>
<li>Nobody else is surprised. Another part of the program holding the same array does not see it change under it.</li>
<li>History and undo become easy: just keep the old value.</li>
</ul>
<div class="warn">Some array methods do change the original: <code>push</code>, <code>pop</code>, <code>splice</code>, <code>sort</code> and <code>reverse</code>. <code>sort</code> is the classic trap, because it also returns the array, so it looks like <code>map</code>. To sort a copy, write <code>[...cards].sort((a, b) =&gt; a - b)</code>, or use <code>toSorted</code> where your target includes ES2023.</div>
<h3>Vue comparison</h3>
<p>Vue 3 watches your data through proxies, so both styles update the screen: <code>list.value.push(x)</code> and <code>list.value = [...list.value, x]</code>. Immutability still matters in three places:</p>
<ul>
<li>Inside a <code>computed</code>, never change the source. <code>list.value.sort()</code> in a computed reorders the original ref. Sort a copy.</li>
<li>Props belong to the parent. Copy a prop object, or emit an event, rather than changing it.</li>
<li>With a deep watcher, if you changed an object in place, the old value and the new value are the same object, so you cannot compare them. Replace it and you can.</li>
</ul>
<p>Outside Vue, for example in game code, nothing watches your data at all. Making new values is then how your own code knows what changed.</p>
<h3>Going deeper: spread copies only one level</h3>
<pre><code>const a = { nick: 'Mia', stats: { wins: 3 } };
const b = { ...a };
b.stats.wins = 99;
console.log(a.stats.wins);   // 99: a and b share one stats object</code></pre>
<p>Spread makes a <b>shallow copy</b>: the outer object is new, but objects inside it are shared. To change something nested, spread at each level: <code>{ ...a, stats: { ...a.stats, wins: 4 } }</code>. For a full deep copy of plain data, modern browsers and Node have <code>structuredClone(a)</code>.</p>
<h3>Going deeper: small traps</h3>
<ul>
<li><code>reduce</code> without a starting value uses the first item, and throws on an empty array. Always pass one.</li>
<li><code>every</code> on an empty array returns <code>true</code>, and <code>some</code> returns <code>false</code>.</li>
<li><code>sort()</code> with no compare function sorts as text: <code>[3, 8, 5, 12].sort()</code> gives <code>[12, 3, 5, 8]</code>.</li>
</ul>`,
    tryNote: 'Paste each snippet into the TypeScript Playground (typescriptlang.org/play), press Run, and read the Logs tab on the right.',
    try: [
      ["const cards = [3, 8, 5, 12];\nconsole.log(cards.map(c => c * 10));\nconsole.log(cards.filter(c => c > 6), cards.find(c => c > 6));\nconsole.log(cards.some(c => c > 10), cards.every(c => c > 4));\nconsole.log(cards.reduce((sum, c) => sum + c, 0), cards);", 'Every method from the pictures. The last thing printed is cards itself, unchanged.'],
      ["const cards = [3, 8, 5, 12];\nconst sorted = cards.sort();\nconsole.log(sorted, cards, sorted === cards);", 'sort changed the original, returned the same array, and sorted the numbers as text.'],
      ["const a = { nick: 'Mia', stats: { wins: 3 } };\nconst b = { ...a };\nb.stats.wins = 99;\nconsole.log(a.stats.wins, a === b, a.stats === b.stats);", 'A shallow copy: a new outer object that shares the inner one.'],
      ["const best = { mia: 12, leo: 7, ana: 9 };\nconst { mia, ...others } = best;\nconsole.log(mia, others, Object.entries(best));", 'Destructuring with a rest, and an object turned into key and value pairs.']
    ],
    own: `Open a component or service in your own project and find a loop that builds a new list or a total by hand: a <code>for</code> loop with <code>push</code> or <code>+=</code>. Rewrite it with <code>map</code>, <code>filter</code> or <code>reduce</code> and check the result is the same. Then search the project for <code>.sort(</code> and check each one: is it sorting a copy, or changing an array that some other code also holds?`,
    terms: [['callback', '回呼函式'], ['accumulator', '累加值'], ['spread syntax', '展開語法'], ['destructuring', '解構'], ['immutability', '不可變性'], ['mutate', '就地修改'], ['shallow copy', '淺層複製'], ['reactivity', '響應式']],
    quiz: [
      { q: "What does <code>[3, 8, 5, 12].find(c =&gt; c &gt; 20)</code> return?",
        a: ["An empty array", "-1", "<code>und&#101;fined</code>", "false"], c: 2,
        why: "find returns the first match, or und&#101;fined when nothing matches. findIndex is the one that returns -1." },
      { q: "Which of these changes the original array <code>cards</code>?",
        a: ["<code>cards.sort()</code>", "<code>cards.map(c =&gt; c)</code>", "<code>cards.filter(c =&gt; c &gt; 1)</code>", "<code>[...cards]</code>"], c: 0,
        why: "sort reorders the array in place and returns that same array. The other three make new arrays." },
      { q: "After <code>const b = { ...a }</code> you change <code>b.stats.wins</code>. What happens to <code>a.stats.wins</code>?",
        a: ["Nothing: b is a full copy", "TypeScript reports an error", "It is reset to 0", "It changes too, because spread copies only the top level"], c: 3,
        why: "Spread makes a shallow copy. a and b are different objects, but they share the same stats object inside." }
    ]
  },
  {
    id: 'ts-closures', lv: 2, mins: 14,
    title: 'Closures, this and timers',
    zh: '函式會記住它被建立時周圍的變數，像背著一個背包，這就是閉包。this 要看函式「怎麼被呼叫」；箭頭函式的 this 跟著它寫在哪裡，所以 callback 多半寫成箭頭。計時器要記得清掉；好幾個請求重疊時，只認最新的那一個。',
    body: `
<p>A function in JavaScript is not only a list of steps. It also carries the variables that were around it when it was created. That one fact explains three things you meet every day: how a counter keeps its count with no class, why <code>this</code> sometimes stops working inside a callback, and how to stop an old timer or an old reply from spoiling the screen.</p>
<h3>Step 1: a function remembers where it was made</h3>
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
<p>When <code>makeCounter</code> finishes, you might expect <code>count</code> to be gone. It is not. The small arrow function it returned still uses <code>count</code>, so <code>count</code> stays alive. Think of a backpack: when a function is created, it packs the variables around it that it uses and carries them wherever it goes. A function together with its backpack is called a <b>closure</b>.</p>
<div class="flow"><span class="box">makeCounter() runs<small>creates count = 0</small></span><span class="arr">&rarr;</span><span class="box hot">returns an arrow function<small>backpack: count</small></span><span class="arr">&rarr;</span><span class="box">next()<small>count is now 1</small></span><span class="arr">&rarr;</span><span class="box">next()<small>count is now 2</small></span></div>
<p>Two things to notice. Each call to <code>makeCounter</code> packs a new backpack, so <code>next</code> and <code>other</code> count separately. And nothing outside can touch <code>count</code>: there is no <code>next.count</code>. A closure is the simplest way to keep something private. The region of code where a variable can be seen is its <b>scope</b>; a closure lets a function keep a scope that has otherwise finished.</p>
<h3>Vue comparison: a composable is a closure</h3>
<pre><code>import { ref } from 'vue';
function useCounter() {
  const count = ref(0);
  const inc = () =&gt; { count.value += 1; };
  return { count, inc };
}</code></pre>
<p>Same shape. <code>inc</code> reaches <code>count</code> through its backpack. Everything inside <code>&lt;script setup&gt;</code> works this way, which is why you never write <code>this</code> there.</p>
<h3>Step 2: this depends on how a function is called</h3>
<p>In a class, <code>this</code> means &ldquo;the object I belong to&rdquo;. But for a normal function or method, <code>this</code> is not fixed when you write it. It is decided every time the function is called, by how it is called: the object to the left of the dot.</p>
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
<tr><th>How it is called</th><th>this inside a normal function</th></tr>
<tr><td><code>game.addPoint()</code></td><td><code>game</code>, the object before the dot</td></tr>
<tr><td><code>f()</code>, no dot</td><td><code>und&#101;fined</code> (class code and modules are always in strict mode)</td></tr>
<tr><td>Handed to someone else, as in <code>setTimeout(game.addPoint)</code></td><td>Whatever that caller chooses, and not <code>game</code></td></tr>
<tr><td><code>game.addPoint.bind(game)</code></td><td>Always <code>game</code>, however it is called later</td></tr>
</table>
<h3>Step 3: arrow functions take this from where they are written</h3>
<p>An <b>arrow function</b> has no <code>this</code> of its own. Inside it, <code>this</code> means whatever it meant in the code around it, at the place where it was written, just like any other variable in its backpack. So inside a method, an arrow keeps pointing at the object.</p>
<pre><code>class Game {
  score = 0;
  start() {
    setTimeout(() =&gt; { this.score += 1; }, 100);   // still the game
  }
  onClick = () =&gt; { this.score += 1; };            // safe to pass around
}</code></pre>
<p>That is why callbacks are almost always arrows. When you need to hand a method to someone else, there are three usual fixes:</p>
<ul>
<li>Wrap it in an arrow: <code>setTimeout(() =&gt; game.addPoint(), 100)</code>.</li>
<li>Bind it: <code>game.addPoint.bind(game)</code> makes a copy with <code>this</code> fixed.</li>
<li>Write it as an arrow field, like <code>onClick</code> above.</li>
</ul>
<p>Some APIs take the object as an extra argument instead. In Cocos Creator, <code>node.on(Node.EventType.TOUCH_END, this.onTouch, this)</code> passes <code>this</code> as the third argument for exactly this reason.</p>
<p><b>Vue comparison:</b> in the Options API, Vue binds every function in <code>methods</code> to the component for you, so <code>this.count</code> just works, and the Vue documentation warns against writing those methods as arrows. In <code>&lt;script setup&gt;</code> there is no <code>this</code> at all. Closures do the job.</p>
<h3>Timers: setTimeout and setInterval</h3>
<pre><code>const id = setTimeout(() =&gt; console.log('reveal'), 1000);  // once, after about 1 s
clearTimeout(id);                                           // cancelled: never runs

let left = 3;
const tick = setInterval(() =&gt; {
  left -= 1;
  console.log('left', left);
  if (left === 0) clearInterval(tick);                      // stop repeating
}, 1000);</code></pre>
<p>Both return an id. Keep it, because the id is the only way to cancel. The delay is a minimum, not a guarantee: if the main thread is busy, the callback runs later. An interval that is never cleared keeps running after its screen is gone, and through its backpack it keeps alive everything it uses. In Vue, clear it in <code>onUnmounted</code>.</p>
<h3>Step 4: the latest request wins</h3>
<p>Here is a bug you will meet in real apps. A player clicks Next card twice, quickly. Two requests go out. Replies over a network do not keep their order, so the second reply can arrive first. Then the first, older reply arrives and overwrites the screen with a card that is out of date. Results that depend on which reply happens to arrive first are called a <b>race condition</b>.</p>
<div class="flow"><span class="box">Request 1 sent</span><span class="arr">&rarr;</span><span class="box">Request 2 sent</span><span class="arr">&rarr;</span><span class="box hot">Reply 2 arrives<small>shown</small></span><span class="arr">&rarr;</span><span class="box bad">Reply 1 arrives<small>stale: must be ignored</small></span></div>
<p>The fix uses a closure. Keep a counter outside. Each request takes the next ticket number and keeps it in its backpack. When its reply comes back, it checks whether its ticket is still the latest. If not, it does nothing.</p>
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
<p>The same trick stops old timers. Give each round of Higher or Lower an id, and have the reveal timer check that its round is still the current one before it turns a card. In the next lesson you will write this with <code>await</code>; the check stays the same.</p>
<h3>Going deeper: the loop that prints 3, 3, 3</h3>
<pre><code>for (var i = 0; i &lt; 3; i++) setTimeout(() =&gt; console.log(i), 0);   // 3 3 3
for (let j = 0; j &lt; 3; j++) setTimeout(() =&gt; console.log(j), 0);   // 0 1 2</code></pre>
<p><code>var</code> makes one variable for the whole loop, so all three callbacks pack the same <code>i</code>, which is 3 by the time they run. <code>let</code> makes a fresh variable for each turn of the loop, so each callback packs its own. This is one reason modern code does not use <code>var</code>.</p>
<h3>Going deeper: timer types, and cancelling for real</h3>
<p>In a browser a timer id is a number. In Node it is an object. Writing the type as <code>ReturnType&lt;typeof setTimeout&gt;</code> works in both. Ignoring a stale reply does not stop the request itself. For <code>fetch</code>, an <code>AbortController</code> can cancel it and save the work. Many teams do both: abort the old request, and keep the ticket check as a safety net.</p>`,
    tryNote: 'Paste each snippet into the TypeScript Playground (typescriptlang.org/play), press Run, and read the Logs tab on the right.',
    try: [
      ["function makeCounter() {\n  let count = 0;\n  return () => ++count;\n}\nconst a = makeCounter(), b = makeCounter();\nconsole.log(a(), a(), a(), b());", 'Two counters, two backpacks: 1 2 3, and then 1.'],
      ["class Game { score = 0; addPoint() { this.score += 1; } }\nconst game = new Game();\nconst f = game.addPoint;\ntry { f(); } catch (e) { console.log('lost this:', (e as Error).message); }\nconst g = () => game.addPoint();\ng(); console.log(game.score);", 'The method called without its object fails. Wrapped in an arrow, it works and the score is 1.'],
      ["for (var i = 0; i < 3; i++) setTimeout(() => console.log('var', i), 0);\nfor (let j = 0; j < 3; j++) setTimeout(() => console.log('let', j), 0);", 'One shared variable prints 3 3 3. A fresh variable per turn prints 0 1 2.'],
      ["let latest = 0;\nfunction request(label: string) {\n  const ticket = ++latest;\n  setTimeout(() => console.log(label, ticket === latest ? 'shown' : 'ignored'), Math.random() * 500);\n}\nrequest('first'); request('second');", 'Run it several times. Whichever reply arrives first, only the second request is shown.']
    ],
    own: `Find one place in your own code that uses a timer, or waits for a reply and then updates the screen: a search box, a countdown, a loading spinner. Check two things. Is the timer cleared when the screen or component goes away? If two requests overlap, can the older reply overwrite the newer one? Fix one of them, using <code>clearTimeout</code> or <code>clearInterval</code>, or a ticket counter like the one in this lesson.`,
    terms: [['closure', '閉包'], ['scope', '作用域'], ['arrow function', '箭頭函式'], ['bind', '綁定'], ['timer', '計時器'], ['race condition', '競爭條件'], ['stale', '過期的']],
    quiz: [
      { q: "Two counters made by two calls to <code>makeCounter()</code> do not share a count. Why?",
        a: ["They do share one count", "Each call creates a new count variable, and each returned function keeps its own", "TypeScript copies the variable on every call", "Because count is a number"], c: 1,
        why: "Every call to makeCounter runs its body again and makes a fresh count. Each returned function carries the one from its own call." },
      { q: "Inside a class method you write <code>setTimeout(function () { this.score++; }, 100)</code>. What is wrong?",
        a: ["Nothing", "setTimeout cannot take a function", "A normal function gets its this from how the timer calls it, not from the method; an arrow function would keep the object", "score must be static"], c: 2,
        why: "The timer calls the function itself, so this is not the object. An arrow function takes this from the method around it." },
      { q: "Two requests overlap and the older reply arrives last. With the ticket pattern, what happens to it?",
        a: ["It is ignored, because its ticket is no longer the latest", "It replaces the newer result", "The browser cancels it automatically", "Both results are shown"], c: 0,
        why: "Each callback compares its own ticket with the latest one. The older ticket no longer matches, so the callback returns without touching the screen." }
    ]
  },
  {
    id: 'ts-async', lv: 2, mins: 15,
    title: 'Promises and async/await',
    zh: 'JavaScript 只有一條主執行緒，等東西時不能卡住，所以「等待」用 Promise 表示：像一張取餐單，之後才拿到結果或錯誤。async/await 是同一件事由上往下寫。Promise 的 callback 比計時器先跑；互不相關的等待用 Promise.all 一起等；忘了 await 是最常見的錯，故意不等就寫 void。',
    body: `
<p>Your code often has to wait: for a server, for a file, for an animation to end. This lesson is about how JavaScript waits without freezing, and how to read the ways that waiting is written: <code>.then</code> and <code>await</code>.</p>
<h3>Why waiting must not block</h3>
<p>The code on a web page runs on one <b>main thread</b>. The same thread also draws the screen and reacts to clicks, and it does one thing at a time. If your code stood still for two seconds waiting for a reply, nothing else could happen in those two seconds: no clicks, no animation, no scrolling. The page would look frozen.</p>
<pre><code>const end = Date.now() + 2000;
while (Date.now() &lt; end) {}   // busy waiting: the page freezes for 2 s</code></pre>
<p>So JavaScript never waits like that. It tells the browser &ldquo;start this, and let me know when it is done&rdquo;, and carries on. Code whose result comes later, at a time you do not choose, is called <b>asynchronous</b>.</p>
<div class="flow"><span class="box">Your code<small>asks for a card</small></span><span class="arr">&rarr;</span><span class="box">Browser<small>waits for the network</small></span><span class="arr">&rarr;</span><span class="box hot">Main thread stays free<small>clicks, drawing</small></span><span class="arr">&rarr;</span><span class="box">Reply arrives<small>your function runs</small></span></div>
<h3>Step 1: a Promise is an order ticket</h3>
<p>At a bubble tea shop you order, pay, and get a ticket with a number. You do not stand at the counter blocking everyone. You step aside, look at your phone, and when your number is called you collect your drink, or hear that they have run out. A <b>Promise</b> is that ticket: an object you get at once, standing for a result that arrives later.</p>
<div class="flow"><span class="box hot">pending<small>ticket in hand</small></span><span class="arr">&rarr;</span><span class="box">fulfilled<small>here is your value</small></span><span class="arr">or</span><span class="box bad">rejected<small>here is the error</small></span></div>
<p>A Promise starts <b>pending</b>, then settles once: <b>fulfilled</b> with a value, or <b>rejected</b> with an error. Once settled it never changes.</p>
<pre><code>function drawCard(): Promise&lt;number&gt; {
  return new Promise((resolve) =&gt; {
    setTimeout(() =&gt; resolve(Math.ceil(Math.random() * 13)), 500);
  });
}

drawCard()
  .then(card =&gt; console.log('drew', card))
  .catch(err =&gt; console.error('could not draw', err));</code></pre>
<p><code>.then</code> says &ldquo;when it is ready, run this&rdquo;. <code>.catch</code> says &ldquo;if it fails, run this&rdquo;. Each <code>.then</code> returns a new Promise, so they chain, and one <code>.catch</code> at the end catches a failure from any step above it. There is also <code>.finally</code>, which runs either way: a good place to hide a loading spinner.</p>
<h3>Step 2: async/await is the same thing, top to bottom</h3>
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
<p>Read <code>await</code> as &ldquo;wait here for this ticket, then give me what is inside&rdquo;. It pauses only this one function. The main thread is free while it waits, and the function picks up from that line when the value arrives. A rejected Promise turns into an ordinary thrown error at the <code>await</code>, so a normal <code>try/catch</code> handles it.</p>
<p>An <code>async</code> function always returns a Promise, even when you return a plain number: <code>async function f() { return 1; }</code> gives a <code>Promise&lt;number&gt;</code>. So whoever calls it must wait for it too.</p>
<table>
<tr><th>To</th><th>Promise chain</th><th>async/await</th></tr>
<tr><td>Get the value</td><td><code>.then(card =&gt; ...)</code></td><td><code>const card = await drawCard()</code></td></tr>
<tr><td>Handle a failure</td><td><code>.catch(err =&gt; ...)</code></td><td><code>try { } catch (err) { }</code></td></tr>
<tr><td>Run either way</td><td><code>.finally(() =&gt; ...)</code></td><td><code>finally { }</code></td></tr>
</table>
<h3>What runs first? Try it below</h3>
<pre><code>console.log('A');
setTimeout(() =&gt; console.log('B'), 0);
Promise.resolve().then(() =&gt; console.log('C'));
console.log('D');</code></pre>
<p>Guess the output before you press anything. Then press Step, one step at a time, and watch the three boxes: what is running now, the microtask queue (where promise callbacks wait) and the task queue (where timer callbacks wait). The console output fills in as each line prints.</p>
<div class="widget" data-w="asyncorder"></div>
<p>The answer is A, D, C, B. Here is why:</p>
<ol>
<li>A is plain code, so it prints at once.</li>
<li><code>setTimeout</code> does not run B. It puts B's callback in the <b>task queue</b> for later, even with a delay of 0.</li>
<li><code>Promise.resolve()</code> is already fulfilled, so <code>.then</code> puts C's callback in the <b>microtask queue</b>.</li>
<li>D is plain code, so it prints.</li>
<li>The current code has finished. Before taking the next task, the engine empties the whole microtask queue: C prints.</li>
<li>Only then does it take the next task from the task queue: B prints.</li>
</ol>
<p>This cycle (run a piece of code, empty the microtasks, take the next task) is the <b>event loop</b>. The rule to remember: promise callbacks run before timers, as soon as the current code finishes. The code after an <code>await</code> is a promise callback too.</p>
<h3>Step 3: one after another, or at the same time</h3>
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
<div class="tiers"><b>One by one</b><div><span class="box">loadProfile<small>500 ms</small></span><span class="box">then loadBest<small>500 ms</small></span><span class="box bad">about 1000 ms</span></div><b>Together</b><div><span class="box">loadProfile and loadBest<small>both waiting at once</small></span><span class="box hot">about 500 ms</span></div></div>
<p>When two waits do not depend on each other, start both and wait for both with <code>Promise.all</code>. It gives back the results in the order you passed them in. It fails as soon as any one fails; <code>Promise.allSettled</code> waits for all of them and reports which ones failed. When the second step needs the first one's result, one after another is correct.</p>
<p>&ldquo;At the same time&rdquo; means waiting at the same time. Your JavaScript still runs on the one main thread. What overlaps is the waiting.</p>
<h3>The most common mistake: forgetting await</h3>
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
<p>TypeScript catches the first kind, because the types do not match. It does not catch the second: a call whose Promise is simply dropped. The save is still running when the next line runs, and if it fails, the error has nowhere to go and the browser reports an unhandled rejection. The lint rule <code>@typescript-eslint/no-floating-promises</code> finds these.</p>
<h3>void: fire and forget, on purpose</h3>
<p>Sometimes you really do not want to wait, for example when sending a usage statistic. Then write <code>void</code> in front:</p>
<pre><code>void saveScore(score);   // start it, do not wait, and say so</code></pre>
<p><code>void</code> throws the Promise away on purpose. It tells the reader, and the lint rule, that not waiting was a decision and not an accident. The function should then catch its own errors inside, because nobody outside will.</p>
<p><b>Vue comparison:</b> you have written <code>onMounted(async () =&gt; { data.value = await load(); })</code>. Vue does not wait for that Promise. The component mounts and renders first, and the data arrives later, which is why templates so often show a loading state.</p>
<h3>Going deeper: await in loops</h3>
<pre><code>async function saveAll(rounds: number[], save: (r: number) =&gt; Promise&lt;void&gt;) {
  rounds.forEach(async r =&gt; { await save(r); });   // does not wait at all
  for (const r of rounds) { await save(r); }       // one by one, in order
  await Promise.all(rounds.map(r =&gt; save(r)));     // all at once
}</code></pre>
<p>These are three choices, not three steps. <code>forEach</code> ignores what its callback returns, so the Promises are dropped and the next line runs at once. Use <code>for...of</code> when order matters, and <code>Promise.all</code> with <code>map</code> when it does not.</p>`,
    tryNote: 'Paste each snippet into the TypeScript Playground (typescriptlang.org/play), press Run, and read the Logs tab on the right.',
    try: [
      ["console.log('A');\nsetTimeout(() => console.log('B'), 0);\nPromise.resolve().then(() => console.log('C'));\nconsole.log('D');", 'The program from the demo. The log shows A, D, C, B.'],
      ["const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));\nasync function demo() {\n  let t = Date.now(); await wait(300); await wait(300); console.log('one by one', Date.now() - t);\n  t = Date.now(); await Promise.all([wait(300), wait(300)]); console.log('together', Date.now() - t);\n}\ndemo();", 'About 600 ms one by one, about 300 ms together.'],
      ["async function f() { return 1; }\nconst p = f();\nconsole.log(p instanceof Promise);\np.then(v => console.log('value', v));", 'An async function hands back a Promise even for a plain number. Hover over p to see its type.'],
      ["async function fail() { throw new Error('sold out'); }\nasync function main() {\n  try { await fail(); } catch (e) { console.log('caught:', (e as Error).message); }\n}\nmain();", 'A rejected Promise becomes an ordinary error at the await, and try/catch handles it.']
    ],
    own: `Search your project for <code>forEach(async</code>, and for calls to async functions that have no <code>await</code>, <code>return</code> or <code>void</code> in front of them. For each one decide: should it wait, should it run together with others in <code>Promise.all</code>, or is it truly fire and forget? If your project runs ESLint with type information, turn on <code>@typescript-eslint/no-floating-promises</code> and see what it finds.`,
    terms: [['main thread', '主執行緒'], ['asynchronous', '非同步'], ['pending', '等待中'], ['fulfilled', '已實現'], ['rejected', '已拒絕'], ['event loop', '事件迴圈'], ['microtask queue', '微任務佇列'], ['task queue', '任務佇列']],
    quiz: [
      { q: "In the demo program, why does C print before B?",
        a: ["C is shorter to print", "Timers always wait at least one second", "Promise callbacks wait in the microtask queue, which is emptied as soon as the current code finishes, before the next timer task", "Promises run on a second thread"], c: 2,
        why: "After the current code, the event loop runs every waiting microtask first. The timer callback is a task and waits for its turn after that." },
      { q: "Two requests do not depend on each other and each takes 500 ms. About how long do they take with one <code>await</code> after the other, and with <code>Promise.all</code>?",
        a: ["1000 ms and 500 ms", "500 ms and 1000 ms", "500 ms both ways", "1000 ms both ways"], c: 0,
        why: "One after another, the second wait starts only when the first ends. With Promise.all both waits overlap." },
      { q: "What does <code>void saveScore(score)</code> mean?",
        a: ["Wait for saveScore to finish", "saveScore returns nothing", "Cancel the save", "Start the save on purpose without waiting for it"], c: 3,
        why: "void discards the Promise deliberately. It marks fire and forget as a decision, so readers and the lint rule know it is not a forgotten await." }
    ]
  },
  {
    id: 'ts-modules', lv: 2, mins: 13,
    title: 'Modules: import and export',
    zh: '一個檔案就是一個模組，裡面的東西預設只有自己看得到，export 出去別人才能 import。具名匯出要用大括號、名字要對；預設匯出一個檔案最多一個。打包工具順著 import 把檔案串成幾個大檔。兩個檔案互相 import 時，某個值可能在用到的那一刻還沒準備好。',
    body: `
<p>A real project is hundreds of files. Each file needs a way to share some of its code with others and keep the rest to itself. That is what <code>import</code> and <code>export</code> are for.</p>
<h3>Step 1: one file is one module</h3>
<p>In TypeScript, a file that contains <code>import</code> or <code>export</code> is a <b>module</b>. Everything declared in it is private to that file, like the rooms of a house. To let another file use something, you open a door: <code>export</code>. The other file comes in through that door: <code>import</code>.</p>
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
<h3>Step 2: named exports and default exports</h3>
<table>
<tr><th></th><th>Named export</th><th>Default export</th></tr>
<tr><td>How many per file</td><td>As many as you like</td><td>At most one</td></tr>
<tr><td>Exporting</td><td><code>export function isHigher()</code></td><td><code>export default class Deck</code></td></tr>
<tr><td>Importing</td><td><code>import { isHigher } from './cards'</code></td><td><code>import Deck from './deck'</code></td></tr>
<tr><td>Name when importing</td><td>Must match (rename with <code>as</code>)</td><td>Any name you choose</td></tr>
</table>
<p>A <b>named export</b> is the safer default for your own code. The name is the same everywhere, so search and rename in the editor find every use, and the editor can add the import for you. A <b>default export</b> can be imported under any name, so the same thing ends up as <code>Deck</code> in one file and <code>CardPile</code> in another.</p>
<p>Two more forms you will see: <code>import * as cards from './cards'</code> puts every export on one object, <code>cards.isHigher(...)</code>. And <code>export { isHigher } from './cards'</code> passes an export on, which is how an <code>index.ts</code> gathers a folder's exports in one place.</p>
<p><b>Vue comparison:</b> every <code>.vue</code> file has a default export, the component itself. That is why you write <code>import ScoreBoard from './ScoreBoard.vue'</code> with no braces, and could call it anything.</p>
<h3>Step 3: import type</h3>
<pre><code>// types.ts
export type Guess = 'higher' | 'lower';
export interface Round { card: number; guess: Guess }
export const GUESSES: Guess[] = ['higher', 'lower'];

// game.ts
import type { Round } from './types';           // only types
import { type Guess, GUESSES } from './types';  // or mix a type and a value</code></pre>
<p>Types exist only while TypeScript checks your code. When it turns your code into JavaScript, every type is removed. A <b>type-only import</b>, <code>import type</code>, says &ldquo;I only need this for checking&rdquo;, and the whole line disappears from the output. It shows the reader what is a real dependency at run time, and it matters for circular imports below. Some projects turn on the setting <code>verbatimModuleSyntax</code>, and then you must mark every import that is only a type.</p>
<h3>Step 4: where a path points</h3>
<table>
<tr><th>You write</th><th>It means</th></tr>
<tr><td><code>'./cards'</code></td><td><code>cards.ts</code> in the same folder. Most bundler setups let you leave out the extension.</td></tr>
<tr><td><code>'../ui/score'</code></td><td>Up one folder, then into <code>ui</code></td></tr>
<tr><td><code>'vue'</code>, <code>'cc'</code></td><td>A package: Vue from <code>node_modules</code>, or the engine module that Cocos Creator provides</td></tr>
<tr><td><code>'@/utils/format'</code></td><td>A <b>path alias</b>: a shortcut you set up, usually meaning the <code>src</code> folder</td></tr>
</table>
<p>An alias like <code>@/</code> has to be set up in two places: <code>paths</code> in <code>tsconfig.json</code>, so the type checker can find the file, and the bundler's own alias setting (in Vite, <code>resolve.alias</code>), so the built code can. TypeScript does not rewrite the path for you. If an import works in the editor but fails when the app runs, check the second one.</p>
<h3>Step 5: what a bundler does with all this</h3>
<p>A browser can load every file as a separate module, but hundreds of small downloads are slow. A <b>bundler</b> (Vite, webpack, esbuild; Cocos Creator has its own build step) starts at the entry file and follows every <code>import</code> to learn which file needs which. Then it joins them into a few large files called bundles. On the way it drops exports that nobody imports (<b>tree shaking</b>), and it turns each dynamic <code>import('./settings')</code> into a separate file that downloads only when it is needed.</p>
<div class="tiers"><b>Your files</b><div><span class="box hot">main.ts<small>entry</small></span><span class="box">game.ts</span><span class="box">cards.ts</span><span class="box">ui.ts</span><span class="box">settings.ts<small>loaded with import()</small></span></div><b>Imports</b><div><span class="box">main &rarr; game &rarr; cards</span><span class="box">game &rarr; ui</span><span class="box">ui &rarr; settings, only when opened</span></div><b>Bundles</b><div><span class="box hot">index-3f9a.js<small>main, game, cards, ui</small></span><span class="box">settings-71c2.js<small>downloaded later</small></span></div></div>
<p>The odd letters in the file names are a fingerprint of the content. A browser can then keep a file in its cache for a long time and still fetch the new one after a change, because the name changes too. In development, Vite skips most of this and serves each file as its own module; the joining happens when you build.</p>
<h3>Step 6: circular imports</h3>
<p>A <b>circular import</b> is two files that import each other, directly or through others. It is allowed, and it often works. It breaks when one of them uses the other's value at the top level, while the file is still loading.</p>
<pre><code>// deck.ts
import { MAX_ROUNDS } from './rules';
export const DECK_SIZE = 52;
export function roundsLeft(done: number) { return MAX_ROUNDS - done; }

// rules.ts
import { DECK_SIZE } from './deck';
export const MAX_ROUNDS = DECK_SIZE - 1;   // used while loading

// main.ts
import { roundsLeft } from './deck';</code></pre>
<div class="flow"><span class="box">main.ts<small>needs deck.ts</small></span><span class="arr">&rarr;</span><span class="box">deck.ts<small>needs rules.ts first</small></span><span class="arr">&rarr;</span><span class="box">rules.ts<small>needs deck.ts: already started, skip</small></span><span class="arr">&rarr;</span><span class="box bad">rules.ts runs<small>DECK_SIZE has no value yet</small></span></div>
<p>Before a module runs, the modules it imports run first. So <code>deck.ts</code> waits for <code>rules.ts</code>. But <code>rules.ts</code> imports <code>deck.ts</code>, which has already started, so it is not started again. <code>rules.ts</code> runs now, and reaches <code>DECK_SIZE - 1</code> before <code>deck.ts</code> has set <code>DECK_SIZE</code>. Depending on how your code is built, you get one of two results:</p>
<ul>
<li>An error, <code>ReferenceError: Cannot access 'DECK_SIZE' before initialization</code>, with native modules, as in Vite during development.</li>
<li>No error, but the value is <code>und&#101;fined</code>, so <code>MAX_ROUNDS</code> becomes <code>NaN</code>. This happens with CommonJS output and with some engines' own module loaders. With classes the message is often <code>Class extends value und&#101;fined is not a constructor or null</code>.</li>
</ul>
<p>Look at <code>roundsLeft</code>: it also uses a value from the other file, but only inside a function that runs later, when both files have finished loading. That is fine. And if <code>main.ts</code> had imported <code>rules.ts</code> first, everything would have worked. This is why these bugs seem random: they depend on which file happens to load first.</p>
<h3>How to fix a circular import</h3>
<ul>
<li><b>Move the shared piece out.</b> Put <code>DECK_SIZE</code> and <code>MAX_ROUNDS</code> in a third file, <code>constants.ts</code>, that imports nothing. Both files import from it, and the circle is gone.</li>
<li><b>Use import type</b> when one side only needs a type. Type imports are removed from the output, so they cannot form a circle at run time.</li>
<li><b>Pass it in; do not import it back.</b> If a low-level file needs to call something higher up, let the higher file hand it a function or listen for an event (see the lesson on design patterns).</li>
<li><b>Let a tool find them.</b> <code>npx madge --circular --extensions ts src</code> lists every circle, and the ESLint rule <code>import/no-cycle</code> stops new ones.</li>
</ul>
<div class="flow"><span class="box">deck.ts</span><span class="arr">&rarr;</span><span class="box hot">constants.ts<small>imports nothing</small></span><span class="arr">&larr;</span><span class="box">rules.ts</span></div>
<h3>Going deeper: a file with no import or export</h3>
<p>If a file has neither, TypeScript treats it as an old-style script: its top-level names are global and can clash with others. This is why the TypeScript Playground complains <code>Cannot redeclare block-scoped variable 'name'</code> when you write <code>const name</code>: the browser already has a global called <code>name</code>. Adding <code>export {};</code> turns the file into a module, and the clash goes away.</p>`,
    tryNote: 'Paste each snippet into the TypeScript Playground (typescriptlang.org/play). Errors show as red underlines; the .JS tab on the right shows the JavaScript output.',
    try: [
      ["export {};\nconst name = 'Mia';\nconsole.log(name);", 'No error. Now delete the first line: without import or export the file is a script, and name clashes with a browser global.'],
      ["export type Guess = 'higher' | 'lower';\nexport const GUESSES: Guess[] = ['higher', 'lower'];", 'Open the .JS tab: the type has disappeared from the output and the constant is still there.'],
      ["function maxRounds() { return DECK_SIZE - 1; }\ntry { console.log(maxRounds()); } catch (e) { console.log((e as Error).message); }\nconst DECK_SIZE = 52;\nconsole.log(maxRounds());", 'Press Run. The same failure as a circular import, in one file: the value is used before the line that sets it has run. After that line, it works.']
    ],
    own: `Pick one folder of your own project and draw its imports on paper: one box per file, one arrow per import. Look for an arrow that points back up, from a low-level file (helpers, constants) to a high-level one (a page, a game controller). If you have Node, run <code>npx madge --circular --extensions ts src</code> in the project and see whether it finds any circles. Fix one by moving the shared piece into its own file.`,
    terms: [['module', '模組'], ['named export', '具名匯出'], ['default export', '預設匯出'], ['type-only import', '純型別匯入'], ['path alias', '路徑別名'], ['bundler', '打包工具'], ['tree shaking', '搖樹最佳化'], ['circular import', '循環匯入']],
    quiz: [
      { q: "What is the difference between <code>import { Deck } from './deck'</code> and <code>import Deck from './deck'</code>?",
        a: ["None, they are the same", "The first imports a named export, so the name must match; the second imports the default export under any name you choose", "The first is for types, the second for values", "The second imports everything in the file"], c: 1,
        why: "Braces pick named exports by their exact name. No braces means the one default export, which you can name freely." },
      { q: "Your alias <code>@/</code> works in the editor, but the running app cannot find the file. What is the most likely cause?",
        a: ["The file has a default export", "TypeScript is out of date", "The alias is set in tsconfig.json but not in the bundler's own settings", "Aliases only work for .vue files"], c: 2,
        why: "tsconfig paths only guide the type checker. The bundler needs its own alias setting to find the file when it builds." },
      { q: "Two files import each other. When does that actually break?",
        a: ["Always: the build refuses it", "Never: modules handle it", "Only in Vue projects", "When one file uses the other's value at the top level, while it is still loading, before the other file has set it"], c: 3,
        why: "Values used later, inside functions, are fine. A top-level use during loading can find the value not set yet." }
    ]
  },
  {
    id: 'ts-patterns', lv: 3, mins: 15,
    title: 'Design patterns you will meet',
    zh: '設計模式是常見問題的固定解法，有名字大家才好溝通。單例：全程式共用一個；觀察者／事件匯流排：訂閱、發送、取消訂閱；狀態機：狀態加上允許的轉換；工廠：一個函式決定做出哪種物件；策略：把可替換的做法當參數傳進去。用不到就別硬套，那叫過度設計。',
    body: `
<p>A <b>design pattern</b> is a known shape for solving a problem that keeps coming up. Nobody invented it on purpose: people noticed the same solution in many programs and gave it a name. The name is the useful part. When a colleague says &ldquo;the score label observes the game&rdquo;, you know the whole shape at once. Here are the five patterns you will meet most in front-end and game code, each with a tiny example, a picture, and when it is worth it.</p>
<h3>1. Singleton: one shared instance</h3>
<p>Some things should exist exactly once: the sound player, the settings, the connection to the server. A <b>singleton</b> is a class that makes sure there is only one, and hands everybody that same one.</p>
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
<div class="flow"><span class="box">Menu</span><span class="box">Game</span><span class="box">Settings</span><span class="arr">&rarr;</span><span class="box hot">Sound.get()<small>the same one object</small></span></div>
<p>TypeScript has a shorter way. A module runs only once, however many files import it, so a plain <code>export const sound = new Sound();</code> is already shared by everyone. <b>Vue comparison:</b> a Pinia store works like this. Every <code>useGameStore()</code> in every component gives back the same store.</p>
<p>Worth it for things that are truly single. Over-engineering when it becomes a handy global box for anything: every file can reach it and change it, so it gets hard to see who changed what, and hard to reset between tests.</p>
<h3>2. Observer and event bus: subscribe, emit, unsubscribe</h3>
<p>The game knows when the score changes. The score label, the sound and the achievements all want to know. The game should not need to know about all of them. In the <b>observer</b> pattern, interested parties subscribe to an event, the game emits it, and every subscriber is called. Each can unsubscribe when it no longer cares. It is like following a channel: the channel posts once and every follower gets it.</p>
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
<div class="flow"><span class="box hot">Game<small>emit(3)</small></span><span class="arr">&rarr;</span><span class="box">Score label<small>subscribed</small></span><span class="box">Sound<small>subscribed</small></span><span class="box">Achievements<small>subscribed</small></span></div>
<p>An <b>event bus</b> is the same idea with one shared emitter and many event names, so any part of the app can talk to any other.</p>
<p><b>Vue comparison:</b> <code>emit('guess', 'higher')</code> from a child is an observer limited to one parent, declared and typed with <code>defineEmits</code>. Vue 3 removed the old <code>$on</code> and <code>$off</code>, and its migration guide points to a small library such as <code>mitt</code> for an app-wide bus: <code>emitter.on('score', fn)</code>, <code>emitter.emit('score', 3)</code>, <code>emitter.off('score', fn)</code>. Cocos Creator has the same idea built in: nodes and <code>EventTarget</code> have <code>on</code>, <code>off</code> and <code>emit</code>.</p>
<p>Worth it when one thing happens and several unrelated parts react. Over-engineering for one parent talking to one child, where a function call or a prop is easier to follow. The two classic bugs: forgetting to unsubscribe, so a destroyed screen keeps reacting, and a bus so busy that nobody can tell who emits what.</p>
<h3>3. State machine: states and allowed moves</h3>
<p>A round of Higher or Lower has stages. The player should be able to guess only while the card is face up and waiting, not while the next card is being revealed. With loose flags such as <code>isDealing</code>, <code>isRevealing</code> and <code>isOver</code>, nothing stops two of them being true at once. A <b>state machine</b> replaces them with one value, the current state, and a table of which moves are allowed from each state.</p>
<div class="flow"><span class="box">waiting</span><span class="arr">&rarr;</span><span class="box">dealing</span><span class="arr">&rarr;</span><span class="box hot">guessing<small>buttons on</small></span><span class="arr">&rarr;</span><span class="box">revealing</span><span class="arr">&rarr;</span><span class="box">result<small>next round: dealing; game over: waiting</small></span></div>
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
<p>Now a double click on Higher cannot reveal two cards, because the second click asks for a move that is not allowed from <code>revealing</code>. Every rule about &ldquo;when can this happen&rdquo; lives in one table you can read.</p>
<p><b>Vue comparison:</b> one <code>state</code> ref and <code>v-if="state === 'guessing'"</code> on the buttons is far easier to get right than three boolean refs that have to agree.</p>
<p>Worth it whenever something has stages and the wrong order is a bug: a game round, a checkout, a multi-step form, a file upload. Over-engineering for a simple on and off toggle. For large ones, libraries such as XState add diagrams and testing tools.</p>
<h3>4. Factory: one function decides what to build</h3>
<pre><code>interface Deck { cards: number[]; label: string }
function createDeck(kind: 'classic' | 'kids'): Deck {
  const top = kind === 'kids' ? 10 : 13;               // kids play without J, Q, K
  const cards: number[] = [];
  for (let rank = 1; rank &lt;= top; rank++) cards.push(rank, rank, rank, rank);
  return { cards, label: kind === 'kids' ? 'Kids deck' : 'Classic deck' };
}
const deck = createDeck('kids');
console.log(deck.label, deck.cards.length);   // Kids deck 40</code></pre>
<div class="flow"><span class="box">'kids'</span><span class="arr">&rarr;</span><span class="box hot">createDeck()<small>decides how to build</small></span><span class="arr">&rarr;</span><span class="box">Deck<small>40 cards</small></span></div>
<p>A <b>factory</b> is a function whose job is to build objects. The rest of the code asks for &ldquo;a kids deck&rdquo; and does not need to know how one is put together. If the rules for building change, only the factory changes. You already use factories: Vue's <code>createApp()</code> and <code>createRouter()</code>, and Cocos Creator's <code>instantiate(prefab)</code>, which builds a node from a template.</p>
<p>Worth it when building takes more than one line, or when the kind is chosen at run time from data, such as a level file that says which enemy to place. Over-engineering when it only wraps <code>new Thing()</code> and has nothing to decide.</p>
<h3>5. Strategy: swap the method, keep the shape</h3>
<pre><code>type Guess = 'higher' | 'lower';
type Strategy = (current: number) =&gt; Guess;

const careful: Strategy = c =&gt; (c &lt; 7 ? 'higher' : 'lower');
const coinFlip: Strategy = () =&gt; (Math.random() &lt; 0.5 ? 'higher' : 'lower');

function botTurn(current: number, think: Strategy): Guess {
  return think(current);
}
console.log(botTurn(3, careful), botTurn(3, coinFlip));</code></pre>
<div class="flow"><span class="box hot">botTurn(current, think)</span><span class="arr">&larr;</span><span class="box">careful<small>below 7: higher</small></span><span class="box">coinFlip<small>random</small></span><span class="box">your own<small>same shape</small></span></div>
<p>A <b>strategy</b> is one way of doing a job, behind a shape that all the ways share. The code that uses it does not change when you swap one for another. In TypeScript the shape is usually just a function type, so a strategy is simply a function you pass in. You have used this for years: the function you give to <code>sort</code> is a strategy for comparing.</p>
<p>Worth it when there really are several ways and you choose between them: bot difficulty, sort order, scoring rules. Over-engineering when there is one way and no plan for a second. An <code>if</code> is fine.</p>
<h3>Going deeper: when to reach for a pattern</h3>
<table>
<tr><th>Pattern</th><th>The problem it solves</th><th>Sign of <b>over-engineering</b></th></tr>
<tr><td>Singleton</td><td>Exactly one shared thing</td><td>Everything is a global manager</td></tr>
<tr><td>Observer, event bus</td><td>One event, many unrelated listeners</td><td>Nobody can tell who emits what</td></tr>
<tr><td>State machine</td><td>Stages that must happen in order</td><td>A toggle with two states and no rules</td></tr>
<tr><td>Factory</td><td>Building is complex, or chosen at run time</td><td>It wraps a single <code>new</code></td></tr>
<tr><td>Strategy</td><td>Several swappable ways to do one job</td><td>Only one way exists</td></tr>
</table>
<p>Patterns are names for solutions, not goals. Write the simple version first. When the same pain shows up a third time (a double click that breaks the round, the same building code copied into five files), reach for the pattern that fits that pain.</p>`,
    tryNote: 'Paste each snippet into the TypeScript Playground (typescriptlang.org/play), press Run, and read the Logs tab on the right.',
    try: [
      ["class Sound {\n  private static instance: Sound | null = null;\n  static get() { return Sound.instance ??= new Sound(); }\n  private constructor() {}\n}\nconsole.log(Sound.get() === Sound.get());", 'Always the same object, so true. Add a line with new Sound() and read the error.'],
      ["const listeners = new Set<(s: number) => void>();\nconst on = (fn: (s: number) => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };\nconst off = on(s => console.log('label', s));\non(s => console.log('sound', s));\nlisteners.forEach(fn => fn(3)); off(); listeners.forEach(fn => fn(4));", 'Both listeners hear 3. After off(), only the sound hears 4.'],
      ["type State = 'guessing' | 'revealing' | 'result';\nconst allowed: Record<State, State[]> = { guessing: ['revealing'], revealing: ['result'], result: ['guessing'] };\nlet state: State = 'guessing';\nconst go = (next: State) => { if (!allowed[state].includes(next)) return false; state = next; return true; };\nconsole.log(go('revealing'), go('revealing'), go('result'));", 'The same move twice in a row is refused the second time: true false true.'],
      ["const nums = [12, 3, 8];\nconsole.log([...nums].sort((a, b) => a - b), [...nums].sort((a, b) => b - a));", 'One sort, two strategies: low to high, then high to low.']
    ],
    own: `Take one feature in your own code and look for each pattern: a shared instance, an event or emit, a set of flags that is really a state machine, a function that builds objects, a function passed in to choose behaviour. For the flags, write the states and the allowed moves as a table like the one in this lesson. Is there any combination of flags that should be impossible, but that the code allows today?`,
    terms: [['design pattern', '設計模式'], ['singleton', '單例'], ['observer', '觀察者'], ['event bus', '事件匯流排'], ['state machine', '狀態機'], ['factory', '工廠'], ['strategy', '策略'], ['over-engineering', '過度設計']],
    quiz: [
      { q: "A round uses the flags isDealing, isRevealing and isOver, and a bug accepts a guess during the reveal. Which pattern fixes this most directly?",
        a: ["Singleton", "State machine", "Factory", "Strategy"], c: 1,
        why: "One current state with a table of allowed moves makes the wrong combinations impossible and refuses moves at the wrong time." },
      { q: "What is the most common bug with the observer pattern?",
        a: ["Forgetting to unsubscribe, so a screen that is gone keeps reacting", "Emitting too fast", "Storing listeners in a Set", "Having more than one listener"], c: 0,
        why: "A listener that is never removed stays alive and keeps running for an object that should be finished." },
      { q: "In TypeScript, what is the simplest form of the strategy pattern?",
        a: ["A class with a private constructor", "A global variable", "A file that imports itself", "A function passed in as an argument, with a shared function type"], c: 3,
        why: "The shared function type is the shape. Any function of that type can be swapped in, as with the compare function you give to sort." }
    ]
  },
  {
    id: 'ts-reading', lv: 3, mins: 13,
    title: 'How to read code you did not write',
    zh: '讀別人的程式，不要從第一個檔案讀到最後一個。從進入點開始，挑一個動作從頭追到尾；把遇到的東西分成三圈：現在必須懂的、當黑盒子的、先不管的。用跳到定義、尋找所有參考，跟著資料走而不是跟著檔案走；有猜測就用 console.log 或中斷點確認，邊讀邊寫一頁地圖。',
    body: `
<p>For most of your working life you will read more code than you write: a new job, a library, a colleague's feature. Nobody reads a codebase like a book, from the first file to the last. There is too much of it, and most of it does not matter for the question you have today. This lesson is a method: start from one action, follow it, and ignore the rest on purpose.</p>
<h3>Step 1: find the entry point</h3>
<p>Every program starts somewhere. That place is the <b>entry point</b>, and everything else is reached from it.</p>
<table>
<tr><th>Kind of project</th><th>Where it starts</th></tr>
<tr><td>Vue app</td><td><code>main.ts</code>, which calls <code>createApp(App).mount('#app')</code>; then the router's list of pages</td></tr>
<tr><td>Cocos Creator game</td><td>The start scene chosen in the build panel, and the components on its nodes</td></tr>
<tr><td>Node server</td><td>The file named by the start script in <code>package.json</code></td></tr>
<tr><td>A library</td><td>The file it exports from, often <code>index.ts</code></td></tr>
</table>
<p>Do not read the entry file line by line either. Just see what it starts, then pick an action.</p>
<h3>Step 2: follow one action from end to end</h3>
<p>Choose one thing a user does, such as clicking a button, and follow it from the moment it happens to the moment the screen changes. One complete path teaches you more than ten files half read, because it shows how the layers connect: input, logic, data, and back to the screen.</p>
<h3>Step 3: three circles</h3>
<p>Along the path you meet many functions. Put each one into one of three circles:</p>
<div class="tiers"><b>Understand now</b><div><span class="box hot">The code on your path that decides what happens</span></div><b>Black box</b><div><span class="box">Know what goes in and what comes out, not how<small>a request helper, a library, an animation</small></span></div><b>Ignore</b><div><span class="box">Everything else, for now<small>logging, other features, rare cases</small></span></div></div>
<p>The <b>black box</b> circle saves the most time. For <code>drawCard(): Promise&lt;number&gt;</code> you only need to know &ldquo;gives me a card later&rdquo;, and the signature already tells you that. You can open it another day.</p>
<h3>Step 4: let the editor walk for you</h3>
<table>
<tr><th>Action</th><th>VS Code on a Mac</th><th>Answers</th></tr>
<tr><td>Go to definition</td><td>F12, or Cmd and click</td><td>Where is this made?</td></tr>
<tr><td>Peek definition</td><td>Option F12</td><td>Look without leaving the file</td></tr>
<tr><td>Find all references</td><td>Shift Option F12</td><td>Who uses this?</td></tr>
<tr><td>Go back</td><td>Ctrl and minus</td><td>Return to where I was</td></tr>
<tr><td>Search in files</td><td>Cmd Shift F</td><td>Where does this text appear?</td></tr>
<tr><td>Go to symbol</td><td>Cmd T</td><td>Where is the function with this name?</td></tr>
</table>
<p>Use search for things that are not names. The text on a button, such as Higher, usually leads straight to the code that handles it. Event names written as strings, such as <code>'score'</code>, are found with search, not with go to definition.</p>
<h3>Step 5: follow the data, not the files</h3>
<p>Files are how the code is stored, not how it works. Pick one piece of data, such as the score, and ask three questions: where is it created, where is it changed, and where is it shown? Finding the references of the score answers the first two in seconds. The places that change it are where the bugs live. This path a value takes is its <b>data flow</b>.</p>
<div class="flow"><span class="box">created<small>score = 0</small></span><span class="arr">&rarr;</span><span class="box hot">changed<small>score += 1, after a right guess</small></span><span class="arr">&rarr;</span><span class="box">shown<small>the score label</small></span></div>
<h3>Step 6: check your guesses</h3>
<p>Reading gives you a guess, such as &ldquo;clicking Higher calls <code>onGuess</code>&rdquo;. Confirm it before you build on it. A temporary log with a clear label is often enough: <code>console.log('[trace] onGuess', guess, state)</code>. To see who called a function, log <code>new Error().stack</code> or call <code>console.trace()</code>. To stop and look around, set a <b>breakpoint</b> in the browser's developer tools, or write <code>debugger;</code> in the code. The program pauses there, and you can inspect every variable and the <b>call stack</b>: the list of function calls that led to this line. Remove them all before you commit.</p>
<h3>Step 7: write a one-page map as you go</h3>
<pre><code>MAP: clicking Higher
entry    main.ts             mountButtons()
input    ui/buttons.ts       click -&gt; onGuess('higher')
logic    game/controller.ts  onGuess: checks the state, asks for the next card
         game/rules.ts       isCorrect(current, next, guess)    [understand]
data     api/deck.ts         drawCard()                         [black box]
screen   ui/score-view.ts    listens for 'score', sets the label
open     who resets the score when a new game starts?</code></pre>
<p>A map like this is short enough to hold in your head, and still useful a week later when you have forgotten. Writing it also shows you the gaps: the line you cannot fill in is your next question.</p>
<h3>A worked example: one click through Higher or Lower</h3>
<p>Imagine a small web version of Higher or Lower that you have never seen, with the files from the map above. The question: what happens when the player clicks Higher?</p>
<div class="flow"><span class="box">click Higher<small>ui/buttons.ts</small></span><span class="arr">&rarr;</span><span class="box hot">onGuess<small>game/controller.ts</small></span><span class="arr">&rarr;</span><span class="box">drawCard<small>black box</small></span><span class="arr">&rarr;</span><span class="box hot">isCorrect<small>the rule</small></span><span class="arr">&rarr;</span><span class="box">emit('score')</span><span class="arr">&rarr;</span><span class="box">score label<small>ui/score-view.ts</small></span></div>
<ol>
<li><b>Search for the label.</b> Searching for Higher finds <code>ui/buttons.ts</code>: <code>higherBtn.addEventListener('click', () =&gt; onGuess('higher'))</code>.</li>
<li><b>Go to the definition</b> of <code>onGuess</code>. It opens <code>game/controller.ts</code>:
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
<li><b>Sort into circles.</b> <code>machine.go</code> is a state machine; you know the pattern, so it stays a black box. <code>drawCard</code> gives a card later: black box. <code>isCorrect</code> decides the outcome: understand now. Open it and you find <code>return guess === 'higher' ? next &gt; current : next &lt; current;</code>. Now you notice that an equal card counts as wrong both ways. That is a rule worth writing on your map.</li>
<li><b>Follow the data.</b> <code>events.emit('score', score)</code> sends the score away. Search for <code>'score'</code> and you find <code>ui/score-view.ts</code>, which subscribes with <code>events.on('score', ...)</code> and sets the label text. The path is complete.</li>
<li><b>Confirm.</b> Set a breakpoint on the <code>isCorrect</code> line, click Higher in the browser, and look at <code>current</code> and <code>next</code> in the debugger. Your guess about equal cards is confirmed or corrected in ten seconds.</li>
</ol>
<p>Six files, but you read about forty lines, and you can now explain the feature, change the rule for equal cards, or chase a bug in the score. That is the goal: not to know everything, but to know the path you need.</p>
<h3>Going deeper: reading faster over time</h3>
<ul>
<li>Read the types first. A signature such as <code>(guess: Guess) =&gt; Promise&lt;void&gt;</code> tells you most of what a function does before you read its body.</li>
<li>Read the tests, if there are any. A test is a small, working example of how the code is meant to be used.</li>
<li>Use the history. <code>git log -p -- game/rules.ts</code> shows how a file changed, and <code>git blame</code> shows which commit last touched each line; its message often explains the strange part.</li>
<li>Do not fix while you read. Note the oddities on your map and come back once you understand the whole path.</li>
</ul>`,
    tryNote: 'Paste each snippet into the TypeScript Playground (typescriptlang.org/play). Press Run and read the Logs tab, or right-click a name to use the editor menu.',
    try: [
      ["function a() { b(); }\nfunction b() { c(); }\nfunction c() { console.log(new Error('who called c?').stack); }\na();", 'The stack lists c, b and a: the path of calls that led here, newest first.'],
      ["let score = 0;\nfunction addPoint() { score += 1; }\nfunction reset() { score = 0; }\naddPoint(); addPoint();\nconsole.log(score);", 'Right-click score and choose Go to References. The list shows every place that creates, changes or reads it.'],
      ["function isCorrect(current: number, next: number, guess: 'higher' | 'lower') {\n  return guess === 'higher' ? next > current : next < current;\n}\nconsole.log(isCorrect(7, 7, 'higher'), isCorrect(7, 7, 'lower'));", 'The rule from the worked example. An equal card is wrong both ways: false false.']
    ],
    own: `Pick one button in an app you work on that you have never traced. Follow its click from the event handler to the moment the screen changes, using only go to definition, find references and search. Sort what you meet into the three circles, and write a map like the one in this lesson, with at least one open question. Then confirm one of your guesses with a breakpoint.`,
    terms: [['entry point', '進入點'], ['black box', '黑盒子'], ['go to definition', '跳到定義'], ['find all references', '尋找所有參考'], ['data flow', '資料流'], ['breakpoint', '中斷點'], ['call stack', '呼叫堆疊']],
    quiz: [
      { q: "You join a project with 300 files. What is the best first step to understand one feature?",
        a: ["Read every file in alphabetical order", "Rewrite the feature in your own style", "Start from the entry point and follow one user action from end to end", "Read the longest file first"], c: 2,
        why: "One complete path shows how the layers connect, and keeps you away from the code that does not matter for your question." },
      { q: "A helper <code>drawCard(): Promise&lt;number&gt;</code> is on your path but has nothing to do with your question. What should you do with it?",
        a: ["Treat it as a black box: it gives a number later, and that is enough for now", "Read every line of it before going on", "Delete it", "Copy it into your notes"], c: 0,
        why: "Its signature already says what goes in and what comes out. Open it only if your question leads inside." },
      { q: "You guess that a click calls <code>onGuess</code>, but you are not sure. What is the quickest reliable way to confirm?",
        a: ["Ask in the team chat and wait", "Add a labelled console.log or a breakpoint, click, and see", "Read the file again", "Rename the function"], c: 1,
        why: "Running the code shows what really happens. A log or a breakpoint turns a guess into a fact in seconds." }
    ]
  }
  ]
});
