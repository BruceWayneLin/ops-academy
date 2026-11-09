DEEP({ 'ts-closures': `
<p>上一課用「背包」解釋閉包，用「點號左邊是誰」解釋 this，也用號碼牌擋住了過期的回應。這一章把比喻換成引擎裡真正的結構：作用域鏈和環境紀錄長什麼樣子、迴圈裡的 let 為什麼每一圈都是新的、this 的五條規則誰先誰後、計時器到底有多準、debounce 和 throttle 怎麼從零寫出來、閉包怎麼讓記憶體悄悄漏掉，以及怎麼用 AbortController 把過期的請求真的取消。這些是每天都在你的 Vue 元件和遊戲腳本裡發生的事，也是面試最愛追問的地方。</p>

<h3><span class="badge lv1">基礎</span>一、作用域是一層套一層的房間</h3>
<p>把程式想成一棟房子，每個函式是一個房間，房間裡面還可以有小房間。每個房間的窗戶都是單向玻璃：從裡面看得到外面每一層，從外面看不到裡面。一個名字（變數）能在哪裡被看到，叫做它的<b>作用域</b>（scope）。</p>
<pre><code>const rules = 'higher-or-lower';            // 模組這一層
function startGame(player: string) {        // startGame 這一層
  let score = 0;
  function onGuess(correct: boolean) {      // onGuess 這一層
    if (correct) score += 1;
    console.log(rules, player, score);      // 三層都看得到
  }
  return onGuess;
}
const guess = startGame('Mia');
guess(true);   // higher-or-lower Mia 1
// console.log(score);   ← 編譯不過：外面看不到裡面的 score</code></pre>
<figure class="figure"><svg viewBox="0 0 640 262" class="fg" style="width:100%;max-width:640px" role="img" aria-label="三層作用域一層套一層：模組、startGame、onGuess。onGuess 裡用到 score，自己這層沒有，往外一層在 startGame 找到">
<rect x="10" y="10" width="440" height="242" rx="10" class="fg-b"/>
<text x="26" y="32" class="fg-t">模組作用域</text>
<text x="26" y="52" class="fg-t sm mono">rules、startGame、guess</text>
<rect x="30" y="66" width="400" height="172" rx="8" class="fg-b alt"/>
<text x="46" y="88" class="fg-t alt">startGame 的作用域</text>
<rect x="46" y="98" width="150" height="26" rx="4" class="fg-b"/><text x="121" y="115" text-anchor="middle" class="fg-t sm mono">player = 'Mia'</text>
<rect x="210" y="98" width="110" height="26" rx="4" class="fg-b warm"/><text x="265" y="115" text-anchor="middle" class="fg-t sm mono">score = 0</text>
<rect x="50" y="144" width="360" height="80" rx="8" class="fg-b hot"/>
<text x="66" y="166" class="fg-t acc">onGuess 的作用域</text>
<rect x="66" y="180" width="150" height="26" rx="4" class="fg-b"/><text x="141" y="197" text-anchor="middle" class="fg-t sm mono">correct = true</text>
<text x="232" y="197" class="fg-t sm mono">score += 1</text>
<line x1="265" y1="182" x2="265" y2="132" class="fg-l warm"/><polygon points="265,124 260.5,132 269.5,132" class="fg-a warm"/>
<text x="275" y="160" class="fg-t sm warm">往外一層找到</text>
<text x="550" y="32" text-anchor="middle" class="fg-t">找名字的順序</text>
<rect x="475" y="46" width="150" height="32" rx="6" class="fg-b hot"/><text x="550" y="67" text-anchor="middle" class="fg-t">1　onGuess</text>
<line x1="550" y1="78" x2="550" y2="96" class="fg-l"/><polygon points="550,104 545.5,96 554.5,96" class="fg-a"/>
<text x="560" y="94" class="fg-t sm">沒有就往外</text>
<rect x="475" y="104" width="150" height="32" rx="6" class="fg-b alt"/><text x="550" y="125" text-anchor="middle" class="fg-t">2　startGame</text>
<line x1="550" y1="136" x2="550" y2="154" class="fg-l"/><polygon points="550,162 545.5,154 554.5,154" class="fg-a"/>
<rect x="475" y="162" width="150" height="32" rx="6" class="fg-b"/><text x="550" y="183" text-anchor="middle" class="fg-t">3　模組</text>
<line x1="550" y1="194" x2="550" y2="212" class="fg-l"/><polygon points="550,220 545.5,212 554.5,212" class="fg-a"/>
<rect x="475" y="220" width="150" height="32" rx="6" class="fg-b"/><text x="550" y="241" text-anchor="middle" class="fg-t">4　全域</text>
</svg><figcaption>引擎找 score：先看 onGuess 自己這層，沒有；往外一層，在 startGame 找到。找到最外面的全域還沒有，就是 ReferenceError（TypeScript 在編譯時就會先抓到）。</figcaption></figure>
<p>這裡有一個關鍵字：<b>詞法作用域</b>（lexical scope）。「看得到誰」是由程式<b>寫在哪裡</b>決定的，不是由<b>從哪裡被呼叫</b>決定的。看這個例子：</p>
<pre><code>const who = 'module';
function show() { console.log(who); }
function caller() {
  const who = 'caller';
  show();          // 印出 module，不是 caller
}
caller();</code></pre>
<p><code>show</code> 寫在模組那一層，所以它往外找，只會找到模組的 <code>who</code>。<code>caller</code> 裡的那個 <code>who</code>，在另一個房間，show 根本看不到。這條規則是閉包的地基：函式走到哪裡，看到的世界都是它出生的那個地方。也正因為如此，你只要讀程式碼的結構，就能知道一個變數是誰的，不必去追執行的過程。</p>

<h3><span class="badge lv1">基礎</span>二、環境紀錄：閉包到底背了什麼</h3>
<p>「房間」在引擎裡有一個正式的名字：<b>環境紀錄</b>（environment record）。每次呼叫一個函式，引擎就建立一份新的紀錄，存這次呼叫的參數和區域變數；每份紀錄都有一條指向外層紀錄的連結，規格裡叫 outer。從裡往外串起來的這一條，就是<b>作用域鏈</b>（scope chain）。</p>
<p>函式物件被建立的那一刻，會記住「我出生時所在的那份紀錄」，規格裡叫做 [[Environment]]。這就是背包的真面目：<b>閉包不是把變數複製一份帶走，而是拿著一條指向那份紀錄的連結。</b></p>
<pre><code>function makeCounter() {
  let count = 0;
  return () =&gt; ++count;
}
const next = makeCounter();
const other = makeCounter();
next(); next(); next();
other();
console.log(next(), other());   // 4 2</code></pre>
<figure class="figure"><svg viewBox="0 0 640 262" class="fg" style="width:100%;max-width:640px" role="img" aria-label="兩次呼叫 makeCounter 產生兩份環境紀錄，各自的 outer 都指向模組的紀錄；next 和 other 兩個函式各自用 Environment 指向自己那一份">
<rect x="220" y="16" width="200" height="48" rx="6" class="fg-b"/>
<text x="320" y="36" text-anchor="middle" class="fg-t sm">模組的環境紀錄</text>
<text x="320" y="55" text-anchor="middle" class="fg-t sm mono">makeCounter、next、other</text>
<rect x="110" y="120" width="180" height="56" rx="6" class="fg-b hot"/>
<text x="200" y="141" text-anchor="middle" class="fg-t sm acc">第 1 次呼叫的紀錄</text>
<text x="200" y="163" text-anchor="middle" class="fg-t mono">count = 3</text>
<rect x="350" y="120" width="180" height="56" rx="6" class="fg-b alt"/>
<text x="440" y="141" text-anchor="middle" class="fg-t sm alt">第 2 次呼叫的紀錄</text>
<text x="440" y="163" text-anchor="middle" class="fg-t mono">count = 1</text>
<path d="M200 120 V94 H290 V72" class="fg-l"/><polygon points="290,64 285.5,72 294.5,72" class="fg-a"/>
<text x="245" y="88" text-anchor="middle" class="fg-t sm mono">outer</text>
<path d="M440 120 V94 H350 V72" class="fg-l"/><polygon points="350,64 345.5,72 354.5,72" class="fg-a"/>
<text x="395" y="88" text-anchor="middle" class="fg-t sm mono">outer</text>
<rect x="110" y="214" width="180" height="36" rx="6" class="fg-b"/><text x="200" y="237" text-anchor="middle" class="fg-t">函式 next</text>
<rect x="350" y="214" width="180" height="36" rx="6" class="fg-b"/><text x="440" y="237" text-anchor="middle" class="fg-t">函式 other</text>
<line x1="200" y1="214" x2="200" y2="184" class="fg-l on"/><polygon points="200,176 195.5,184 204.5,184" class="fg-a on"/>
<text x="210" y="201" class="fg-t sm mono acc">[[Environment]]</text>
<line x1="440" y1="214" x2="440" y2="184" class="fg-l alt"/><polygon points="440,176 435.5,184 444.5,184" class="fg-a alt"/>
<text x="450" y="201" class="fg-t sm mono alt">[[Environment]]</text>
<text x="54" y="112" text-anchor="middle" class="fg-t sm">呼叫堆疊</text>
<rect x="14" y="120" width="80" height="56" rx="6" class="fg-b"/>
<text x="54" y="153" text-anchor="middle" class="fg-t sm">（已清空）</text>
</svg><figcaption>makeCounter 每呼叫一次，就在堆積上建一份紀錄。呼叫結束後，它在呼叫堆疊上的那一格拿掉了，但紀錄還被回傳的函式指著，所以活著，而且兩份互不相干。</figcaption></figure>
<p>呼叫堆疊（call stack）的規則是：每呼叫一次函式就疊一格，結束就拿掉，區域變數跟著消失。那為什麼 <code>count</code> 沒有消失？因為引擎看得出 <code>count</code> 被內層函式用到，會把它放在堆積（heap）上的紀錄裡，而不是放在堆疊上。堆疊那一格拿掉了，紀錄還在；只要還有人指著它，垃圾回收器就不會收。</p>
<p>「拿著連結，不是複製」有一個馬上看得到的後果：同一次呼叫裡建立的兩個函式，背的是同一份紀錄。</p>
<pre><code>function makePair() {
  let n = 0;
  return { inc: () =&gt; ++n, read: () =&gt; n };
}
const p = makePair();
p.inc();
p.inc();
console.log(p.read());   // 2：inc 和 read 看的是同一個 n</code></pre>
<p>Vue 的 composable 就是靠這一點運作的：<code>useCounter</code> 回傳的 <code>count</code> 和 <code>inc</code>，共用同一次呼叫的紀錄，所以 inc 改的就是 count。</p>

<h3><span class="badge lv2">進階</span>三、追蹤迴圈裡的閉包：var 一份，let 每圈一份</h3>
<p>上一課看過這兩行，一個印 3 3 3，一個印 0 1 2。現在用環境紀錄來追，就知道為什麼了：</p>
<pre><code>for (var i = 0; i &lt; 3; i++) setTimeout(() =&gt; console.log(i), 0);   // 3 3 3
for (let j = 0; j &lt; 3; j++) setTimeout(() =&gt; console.log(j), 0);   // 0 1 2</code></pre>
<figure class="figure"><svg viewBox="0 0 640 222" class="fg" style="width:100%;max-width:640px" role="img" aria-label="左邊 var 只有一個 i，三個回呼都指向它，最後是 3；右邊 let 每一圈有一份新的 j，三個回呼各指向 0、1、2">
<line x1="320" y1="10" x2="320" y2="212" class="fg-l dim dash"/>
<text x="160" y="26" text-anchor="middle" class="fg-t warm">var：整個迴圈只有一個 i</text>
<rect x="100" y="50" width="120" height="40" rx="6" class="fg-b warm"/><text x="160" y="75" text-anchor="middle" class="fg-t mono">i = 3</text>
<rect x="20" y="150" width="80" height="34" rx="6" class="fg-b"/><text x="60" y="172" text-anchor="middle" class="fg-t sm mono">回呼 1</text>
<rect x="120" y="150" width="80" height="34" rx="6" class="fg-b"/><text x="160" y="172" text-anchor="middle" class="fg-t sm mono">回呼 2</text>
<rect x="220" y="150" width="80" height="34" rx="6" class="fg-b"/><text x="260" y="172" text-anchor="middle" class="fg-t sm mono">回呼 3</text>
<path d="M60 150 V120 H140 V98" class="fg-l warm"/><polygon points="140,90 135.5,98 144.5,98" class="fg-a warm"/>
<line x1="160" y1="150" x2="160" y2="98" class="fg-l warm"/><polygon points="160,90 155.5,98 164.5,98" class="fg-a warm"/>
<path d="M260 150 V120 H180 V98" class="fg-l warm"/><polygon points="180,90 175.5,98 184.5,98" class="fg-a warm"/>
<text x="160" y="208" text-anchor="middle" class="fg-t sm warm">三個都讀同一個 i：印出 3 3 3</text>
<text x="480" y="26" text-anchor="middle" class="fg-t acc">let：每一圈一份新的 j</text>
<rect x="340" y="50" width="86" height="40" rx="6" class="fg-b hot"/><text x="383" y="75" text-anchor="middle" class="fg-t mono">j = 0</text>
<rect x="437" y="50" width="86" height="40" rx="6" class="fg-b hot"/><text x="480" y="75" text-anchor="middle" class="fg-t mono">j = 1</text>
<rect x="534" y="50" width="86" height="40" rx="6" class="fg-b hot"/><text x="577" y="75" text-anchor="middle" class="fg-t mono">j = 2</text>
<rect x="340" y="150" width="86" height="34" rx="6" class="fg-b"/><text x="383" y="172" text-anchor="middle" class="fg-t sm mono">回呼 1</text>
<rect x="437" y="150" width="86" height="34" rx="6" class="fg-b"/><text x="480" y="172" text-anchor="middle" class="fg-t sm mono">回呼 2</text>
<rect x="534" y="150" width="86" height="34" rx="6" class="fg-b"/><text x="577" y="172" text-anchor="middle" class="fg-t sm mono">回呼 3</text>
<line x1="383" y1="150" x2="383" y2="98" class="fg-l on"/><polygon points="383,90 378.5,98 387.5,98" class="fg-a on"/>
<line x1="480" y1="150" x2="480" y2="98" class="fg-l on"/><polygon points="480,90 475.5,98 484.5,98" class="fg-a on"/>
<line x1="577" y1="150" x2="577" y2="98" class="fg-l on"/><polygon points="577,90 572.5,98 581.5,98" class="fg-a on"/>
<text x="480" y="208" text-anchor="middle" class="fg-t sm acc">各讀各的：印出 0 1 2</text>
</svg><figcaption>差別不在 setTimeout，而在「有幾份紀錄」。var 的 i 屬於外面那層，整個迴圈共用一個；let 的 j 每一圈都有自己的一份。</figcaption></figure>
<p>一步一步追：</p>
<table>
<tr><th>時間點</th><th>var 版</th><th>let 版</th></tr>
<tr><td>進入迴圈</td><td>外層紀錄裡有一個 i = 0</td><td>建立第 1 份紀錄，j = 0</td></tr>
<tr><td>第 1 圈本體</td><td>回呼 1 指向那個 i</td><td>回呼 1 指向第 1 份</td></tr>
<tr><td>i++／j++</td><td>同一個 i 變成 1</td><td>先複製出第 2 份（j = 0），再在第 2 份上加 1，變成 1</td></tr>
<tr><td>第 2、3 圈</td><td>回呼 2、3 也指向同一個 i</td><td>回呼 2 指向第 2 份、回呼 3 指向第 3 份</td></tr>
<tr><td>迴圈結束</td><td>i = 3（條件不成立才結束）</td><td>第 4 份的 j = 3，沒有任何回呼指著它</td></tr>
<tr><td>計時器觸發</td><td>三個都讀到 3</td><td>分別讀到 0、1、2</td></tr>
</table>
<p>「每一圈開始前先複製一份，再在新的那份上做 j++」是規格明文寫的行為（CreatePerIterationEnvironment），專門為了讓閉包在迴圈裡符合直覺。注意它只發生在 <code>for (let …)</code> 的括號裡宣告的變數。把 let 寫在迴圈外面，就又回到共用一份：</p>
<pre><code>const fns: (() =&gt; number)[] = [];
let k = 0;
for (; k &lt; 3; k++) fns.push(() =&gt; k);
console.log(fns.map(f =&gt; f()));   // [3, 3, 3]</code></pre>
<p>Go 語言從 1.22 版起，也把 for 迴圈的變數改成每一圈一份，修的是同一類 bug。你寫 Go 的 goroutine 時會遇到一模一樣的情況。</p>

<h3><span class="badge lv2">進階</span>四、this 的五條規則，以及誰先誰後</h3>
<p>this 和作用域是兩套完全不同的系統。作用域看「寫在哪裡」；this（除了箭頭函式）看「怎麼被呼叫」。完整的規則有五條：</p>
<pre><code>class Game {
  score = 0;
  add(n: number) { this.score += n; return this.score; }
}
const g = new Game();          // 規則 1 new：this 是新建的物件 g
const other = new Game();
const add = g.add;             // 只是把函式拿出來，沒有呼叫

g.add(1);                      // 規則 3 隱含：點號左邊是 g
add.call(other, 5);            // 規則 2 明確：call 指定 other
const bound = add.bind(g);
bound(2);                      // 規則 2 明確：bind 過，永遠是 g
bound.call(other, 9);          // 還是 g：bind 過的函式改不掉
console.log(g.score, other.score);   // 12 5
// add(1);   ← 規則 4 預設：this 是 undefined，執行時 TypeError</code></pre>
<figure class="figure"><svg viewBox="0 0 600 330" class="fg" style="width:100%;max-width:600px" role="img" aria-label="判斷 this 的流程：先問是不是箭頭函式，再問是不是用 new 呼叫，再問有沒有 bind、call、apply，再問是不是 obj.fn() 的形式，都不是就是 undefined">
<rect x="40" y="20" width="250" height="38" rx="6" class="fg-b alt"/><text x="56" y="44" class="fg-t">1. 是箭頭函式嗎？</text>
<rect x="40" y="86" width="250" height="38" rx="6" class="fg-b alt"/><text x="56" y="110" class="fg-t">2. 用 new 呼叫？</text>
<rect x="40" y="152" width="250" height="38" rx="6" class="fg-b alt"/><text x="56" y="176" class="fg-t">3. 有 bind／call／apply？</text>
<rect x="40" y="218" width="250" height="38" rx="6" class="fg-b alt"/><text x="56" y="242" class="fg-t">4. 寫成 obj.fn() 呼叫？</text>
<rect x="40" y="284" width="250" height="34" rx="6" class="fg-b warm"/><text x="56" y="306" class="fg-t">undefined（嚴格模式）</text>
<rect x="360" y="20" width="220" height="38" rx="6" class="fg-b hot"/><text x="374" y="44" class="fg-t">用外層作用域的 this</text>
<rect x="360" y="86" width="220" height="38" rx="6" class="fg-b hot"/><text x="374" y="110" class="fg-t">新建的那個物件</text>
<rect x="360" y="152" width="220" height="38" rx="6" class="fg-b hot"/><text x="374" y="176" class="fg-t">指定的那個物件</text>
<rect x="360" y="218" width="220" height="38" rx="6" class="fg-b hot"/><text x="374" y="242" class="fg-t">點號左邊的物件</text>
<line x1="290" y1="39" x2="352" y2="39" class="fg-l on"/><polygon points="360,39 352,34.5 352,43.5" class="fg-a on"/><text x="322" y="32" text-anchor="middle" class="fg-t sm acc">是</text>
<line x1="290" y1="105" x2="352" y2="105" class="fg-l on"/><polygon points="360,105 352,100.5 352,109.5" class="fg-a on"/><text x="322" y="98" text-anchor="middle" class="fg-t sm acc">是</text>
<line x1="290" y1="171" x2="352" y2="171" class="fg-l on"/><polygon points="360,171 352,166.5 352,175.5" class="fg-a on"/><text x="322" y="164" text-anchor="middle" class="fg-t sm acc">是</text>
<line x1="290" y1="237" x2="352" y2="237" class="fg-l on"/><polygon points="360,237 352,232.5 352,241.5" class="fg-a on"/><text x="322" y="230" text-anchor="middle" class="fg-t sm acc">是</text>
<line x1="165" y1="58" x2="165" y2="78" class="fg-l"/><polygon points="165,86 160.5,78 169.5,78" class="fg-a"/><text x="175" y="76" class="fg-t sm">否</text>
<line x1="165" y1="124" x2="165" y2="144" class="fg-l"/><polygon points="165,152 160.5,144 169.5,144" class="fg-a"/><text x="175" y="142" class="fg-t sm">否</text>
<line x1="165" y1="190" x2="165" y2="210" class="fg-l"/><polygon points="165,218 160.5,210 169.5,210" class="fg-a"/><text x="175" y="208" class="fg-t sm">否</text>
<line x1="165" y1="256" x2="165" y2="276" class="fg-l"/><polygon points="165,284 160.5,276 169.5,276" class="fg-a"/><text x="175" y="274" class="fg-t sm">否</text>
</svg><figcaption>由上往下問，第一個答「是」的就決定 this。這個順序就是優先順序：箭頭函式什麼都不理，new 蓋過 bind，bind 蓋過點號。</figcaption></figure>
<ol>
<li><b>箭頭函式</b>：自己沒有 this。它的 this 跟一般變數一樣，沿著作用域鏈往外找，找到外層函式的 this。所以 bind、call、apply 傳給箭頭函式的 this 全部被忽略，箭頭函式也不能用 new 呼叫。</li>
<li><b>new 綁定</b>：<code>new Game()</code> 會建立一個新物件，讓建構函式裡的 this 指向它。就算對一個 bind 過的函式用 new，this 也是新物件，bind 的那個被忽略。</li>
<li><b>明確綁定</b>：<code>fn.call(obj, a, b)</code> 和 <code>fn.apply(obj, [a, b])</code> 立刻呼叫，差別只在參數是一個一個給還是包成陣列；<code>fn.bind(obj)</code> 不呼叫，而是做出一個 this 永遠固定的新函式。bind 過的再 bind 一次，也改不掉第一次的。</li>
<li><b>隱含綁定</b>：<code>obj.fn()</code> 呼叫的那一刻，點號左邊是誰，this 就是誰。注意是「呼叫的那一刻」：<code>const f = obj.fn</code> 只是把函式拿出來，點號就不見了。</li>
<li><b>預設綁定</b>：什麼都沒有的 <code>fn()</code>。在嚴格模式下 this 是 undefined；在非嚴格模式的舊式腳本裡，this 是全域物件（瀏覽器的 window），這時 <code>this.score += 1</code> 不會報錯，而是安靜地在全域建出一個 NaN。ES 模組和 class 永遠是嚴格模式，所以你在 Vue 和 Cocos 專案裡看到的都是 undefined。</li>
</ol>
<h4>讓 TypeScript 幫你抓 this</h4>
<p>strict 模式包含 <code>noImplicitThis</code>：在一般函式裡用 this 又沒說它是什麼型別，就會報錯。你可以用一個假的第一個參數，宣告 this 的型別。它在編譯後會被拿掉，不是真的參數：</p>
<pre><code>function onPress(this: HTMLElement, e: MouseEvent) {
  console.log(this.id, e.clientX);
}
const btn = document.createElement('button');
btn.addEventListener('click', onPress);   // 可以：瀏覽器會把 this 設成 btn
// onPress(new MouseEvent('click'));      ← 編譯不過：沒有提供 this</code></pre>
<p>不過 TypeScript 抓不到最常見的那一種：<code>setTimeout(g.add, 100)</code> 這種把 class 方法直接交出去的寫法，型別上完全合法。typescript-eslint 有一條規則 <code>@typescript-eslint/unbound-method</code>，專門找這種地方。</p>

<h3><span class="badge lv3">專業</span>五、計時器到底有多準</h3>
<p><code>setTimeout(fn, 100)</code> 真正的意思是：「至少過 100 毫秒之後，把 fn 放進任務佇列。」放進佇列不等於馬上執行：主執行緒如果正在跑別的程式，fn 就得排隊。下一章講事件迴圈時會把這件事畫成時間軸；這裡先記住幾個實際會影響你的規則：</p>
<table>
<tr><th>狀況</th><th>實際行為</th></tr>
<tr><td>主執行緒在忙</td><td>延遲 = 你給的時間 + 等前面的程式跑完。一段 120 毫秒的同步程式，會讓一個 100 毫秒的計時器晚上好幾十毫秒才跑。</td></tr>
<tr><td>計時器裡再設計時器，一直串下去</td><td>HTML 規格規定：巢狀超過 5 層後，小於 4 毫秒的延遲一律拉到 4 毫秒。所以用 <code>setTimeout(fn, 0)</code> 串起來的迴圈，每秒最多跑兩百多次。</td></tr>
<tr><td>分頁在背景</td><td>瀏覽器會節流，通常最快每秒一次。Chrome 對隱藏很久的分頁還有更嚴格的節流，串起來的計時器可能被壓到每分鐘一次。</td></tr>
<tr><td>Node.js</td><td><code>setTimeout(fn, 0)</code> 實際是 1 毫秒。計時器會讓行程一直活著，呼叫 <code>timer.unref()</code> 才不會因為它而不結束。</td></tr>
<tr><td>延遲超過 2<sup>31</sup> − 1 毫秒（約 24.8 天）</td><td>數字溢位：瀏覽器會幾乎馬上觸發，Node 會發警告並改成 1 毫秒。要排很久以後的事，用伺服器端的排程，不要用 setTimeout。</td></tr>
</table>
<p>這些規則帶出一個專業習慣：<b>不要用「被呼叫了幾次」來算時間。</b>用 <code>setInterval(fn, 1000)</code> 每次減一秒做倒數，主執行緒一忙、分頁一切到背景，倒數就慢了，而且慢掉的不會補回來。正確的做法是記住截止時間，每次觸發都重新算還剩多少：</p>
<pre><code>function startCountdown(seconds: number, onTick: (left: number) =&gt; void): () =&gt; void {
  const end = performance.now() + seconds * 1000;
  let timer: ReturnType&lt;typeof setTimeout&gt; | undefined;
  const tick = () =&gt; {
    const leftMs = end - performance.now();
    onTick(Math.max(0, Math.ceil(leftMs / 1000)));
    if (leftMs &lt;= 0) return;
    timer = setTimeout(tick, leftMs % 1000 || 1000);   // 對準下一個整秒
  };
  tick();
  return () =&gt; clearTimeout(timer);                     // 回傳「停止」給呼叫的人
}</code></pre>
<p>就算某一次觸發晚了 300 毫秒，下一次算出來的剩餘秒數仍然是對的。注意回傳值：把停止的方法交給呼叫的人，元件卸載時才停得掉。在牽涉輸贏的正式遊戲裡，還要再往前一步：截止時間以伺服器給的為準，前端的倒數只負責顯示。</p>
<p>還有兩個常用的時鐘，用途不同：<code>Date.now()</code> 是牆上的時鐘，使用者改系統時間或校時，它會跳；<code>performance.now()</code> 是從頁面載入開始、只會往前走的時鐘，量經過了多久要用它。為了防範 Spectre 這類利用時間差的攻擊，瀏覽器會刻意把 performance.now() 的精度調粗，所以你量不到非常細的時間差。</p>

<h3><span class="badge lv3">專業</span>六、debounce 和 throttle：從零寫一次</h3>
<p>使用者在搜尋框打字、拖動視窗、捲動頁面，事件一秒可以來幾十次。每一次都送請求或重算版面，太浪費。兩種常見的對策，用兩個比喻記：</p>
<ul>
<li><b>debounce</b>（防抖）像電梯門：有人進來，就重新開始倒數；等到一段時間都沒人再進來，門才關。用在「等使用者停下來再做」：搜尋建議、表單驗證、視窗縮放完才重排。</li>
<li><b>throttle</b>（節流）像公車：固定每隔一段時間發一班，中間來的人等下一班。用在「持續發生、但要固定頻率處理」：捲動時更新進度條、拖曳時更新位置、遊戲裡定時回報玩家座標。</li>
</ul>
<figure class="figure"><svg viewBox="0 0 640 214" class="fg" style="width:100%;max-width:640px" role="img" aria-label="同一串事件：第一波從 0 到 180 毫秒有七次、第二波在 400 到 460 毫秒有三次。debounce 只在 330 和 610 毫秒各觸發一次；throttle 在 0、100、200、400、500 毫秒觸發">
<text x="8" y="54" class="fg-t sm">原始事件</text>
<text x="8" y="104" class="fg-t sm mono">debounce 150</text>
<text x="8" y="154" class="fg-t sm mono">throttle 100</text>
<line x1="110" y1="50" x2="590" y2="50" class="fg-l dim"/>
<line x1="110" y1="100" x2="590" y2="100" class="fg-l dim"/>
<line x1="110" y1="150" x2="590" y2="150" class="fg-l dim"/>
<circle cx="110" cy="50" r="5" class="fg-b warm"/><circle cx="130.4" cy="50" r="5" class="fg-b warm"/><circle cx="150.8" cy="50" r="5" class="fg-b warm"/><circle cx="171.2" cy="50" r="5" class="fg-b warm"/><circle cx="191.6" cy="50" r="5" class="fg-b warm"/><circle cx="212" cy="50" r="5" class="fg-b warm"/><circle cx="232.4" cy="50" r="5" class="fg-b warm"/>
<circle cx="382" cy="50" r="5" class="fg-b warm"/><circle cx="402.4" cy="50" r="5" class="fg-b warm"/><circle cx="422.8" cy="50" r="5" class="fg-b warm"/>
<line x1="232.4" y1="100" x2="328" y2="100" class="fg-l alt dash"/>
<text x="283" y="90" text-anchor="middle" class="fg-t sm alt">安靜 150 ms</text>
<circle cx="334.4" cy="100" r="7" class="fg-lamp on"/>
<line x1="422.8" y1="100" x2="518" y2="100" class="fg-l alt dash"/>
<text x="474" y="90" text-anchor="middle" class="fg-t sm alt">安靜 150 ms</text>
<circle cx="524.8" cy="100" r="7" class="fg-lamp on"/>
<circle cx="110" cy="150" r="7" class="fg-lamp on"/><circle cx="178" cy="150" r="7" class="fg-lamp on"/><circle cx="246" cy="150" r="7" class="fg-lamp on"/><circle cx="382" cy="150" r="7" class="fg-lamp on"/><circle cx="450" cy="150" r="7" class="fg-lamp on"/>
<line x1="110" y1="184" x2="588" y2="184" class="fg-l"/><polygon points="596,184 588,179.5 588,188.5" class="fg-a"/>
<text x="110" y="202" text-anchor="middle" class="fg-t sm">0</text>
<text x="178" y="202" text-anchor="middle" class="fg-t sm">100</text>
<text x="246" y="202" text-anchor="middle" class="fg-t sm">200</text>
<text x="314" y="202" text-anchor="middle" class="fg-t sm">300</text>
<text x="382" y="202" text-anchor="middle" class="fg-t sm">400</text>
<text x="450" y="202" text-anchor="middle" class="fg-t sm">500</text>
<text x="518" y="202" text-anchor="middle" class="fg-t sm">600</text>
<text x="586" y="202" text-anchor="middle" class="fg-t sm">700 ms</text>
</svg><figcaption>同一串事件（橘點）。debounce 每來一次就重新等，兩波各只做一次，而且都在停下來之後；throttle 在事件持續時每 100 毫秒做一次，最先和最後的都不漏。</figcaption></figure>
<p>兩個都是「閉包 + 計時器」，狀態全部放在閉包的紀錄裡：</p>
<pre><code>function debounce&lt;A extends unknown[]&gt;(fn: (...args: A) =&gt; void, wait: number) {
  let timer: ReturnType&lt;typeof setTimeout&gt; | undefined;
  const debounced = (...args: A): void =&gt; {
    clearTimeout(timer);                       // 有人進電梯：重新倒數
    timer = setTimeout(() =&gt; {
      timer = undefined;
      fn(...args);                             // 用最後一次的參數
    }, wait);
  };
  debounced.cancel = (): void =&gt; {
    clearTimeout(timer);
    timer = undefined;
  };
  return debounced;
}

function throttle&lt;A extends unknown[]&gt;(fn: (...args: A) =&gt; void, interval: number) {
  let last = -Infinity;                        // 上次真的執行的時間
  let timer: ReturnType&lt;typeof setTimeout&gt; | undefined;
  let pending: A | undefined;                  // 冷卻中最新的那組參數
  const run = (args: A): void =&gt; {
    last = performance.now();
    fn(...args);
  };
  return (...args: A): void =&gt; {
    const wait = interval - (performance.now() - last);
    if (wait &lt;= 0 &amp;&amp; timer === undefined) {
      run(args);                               // 公車剛好在站：馬上走
      return;
    }
    pending = args;                            // 否則上下一班
    if (timer === undefined) {
      timer = setTimeout(() =&gt; {
        timer = undefined;
        if (pending) {
          const a = pending;
          pending = undefined;
          run(a);
        }
      }, Math.max(wait, 0));
    }
  };
}

const search = debounce((q: string) =&gt; console.log('search', q), 300);
search('m'); search('mi'); search('mia');      // 300 ms 後只印一次：search mia</code></pre>
<p>用上面那張圖的 throttle 追一次（間隔 100）：0 毫秒的事件來時，<code>last</code> 是負無限大，<code>wait</code> 小於 0，馬上執行，<code>last</code> 變 0。30 毫秒的事件算出 <code>wait = 70</code>，排一個 70 毫秒後的計時器，把參數放進 <code>pending</code>。60、90 毫秒的事件只更新 <code>pending</code>。100 毫秒計時器觸發，用 90 毫秒那次的參數執行。依此類推，最後一個事件的參數永遠不會被丟掉。</p>
<p>三個實務細節：</p>
<ul>
<li><b>型別</b>：<code>A extends unknown[]</code> 讓包裝後的函式保留原本的參數型別。<code>search(42)</code> 會被 TypeScript 擋下來，因為原本的函式要的是字串。</li>
<li><b>要能取消</b>：元件卸載時，等待中的那一次如果還會執行，就可能去改一個已經不存在的畫面。所以 debounce 附了 <code>cancel</code>，在 Vue 的 <code>onUnmounted</code> 或 Cocos 的 <code>onDestroy</code> 裡呼叫它。</li>
<li><b>每個元件各一份</b>：debounce 的狀態在閉包裡。把它建在模組最外層，所有使用這個元件的地方會共用同一個計時器，A 元件的輸入會把 B 元件的那一次取消掉。要在元件的 setup 裡各自建立。</li>
</ul>

<h3><span class="badge lv3">專業</span>七、閉包造成的記憶體洩漏</h3>
<p>垃圾回收器的規則很簡單：從一組「根」（root）出發，沿著參考走得到的東西都活著，走不到的才回收。根包括全域物件（瀏覽器的 window）、正在執行的呼叫堆疊，以及瀏覽器自己拿著的東西：已註冊的事件監聽、還沒觸發的計時器、還沒完成的請求。</p>
<p>閉包的危險就在這裡：一個監聽或計時器的回呼是閉包，閉包拿著環境紀錄，紀錄裡有你的元件、資料、DOM。只要回呼還掛在 window 上，這一整串都走得到，就一個也收不掉。</p>
<figure class="figure"><svg viewBox="0 0 640 196" class="fg" style="width:100%;max-width:640px" role="img" aria-label="window 拿著監聽清單，清單拿著 keydown 回呼，回呼的環境紀錄拿著已卸載的元件，所以全部無法回收；abort 或 removeEventListener 可以剪斷清單到回呼這一段">
<rect x="10" y="60" width="120" height="56" rx="6" class="fg-b alt"/><text x="70" y="83" text-anchor="middle" class="fg-t">window</text><text x="70" y="103" text-anchor="middle" class="fg-t sm">GC 根，永遠活著</text>
<rect x="170" y="60" width="120" height="56" rx="6" class="fg-b"/><text x="230" y="83" text-anchor="middle" class="fg-t">監聽清單</text><text x="230" y="103" text-anchor="middle" class="fg-t sm">keydown 的回呼</text>
<rect x="330" y="60" width="130" height="56" rx="6" class="fg-b"/><text x="395" y="83" text-anchor="middle" class="fg-t">閉包的環境紀錄</text><text x="395" y="103" text-anchor="middle" class="fg-t sm">onGuess、元件狀態</text>
<rect x="500" y="60" width="130" height="56" rx="6" class="fg-b warm"/><text x="565" y="83" text-anchor="middle" class="fg-t">已卸載的元件</text><text x="565" y="103" text-anchor="middle" class="fg-t sm">DOM、上萬筆資料</text>
<line x1="130" y1="88" x2="162" y2="88" class="fg-l"/><polygon points="170,88 162,83.5 162,92.5" class="fg-a"/>
<line x1="290" y1="88" x2="322" y2="88" class="fg-l"/><polygon points="330,88 322,83.5 322,92.5" class="fg-a"/>
<line x1="460" y1="88" x2="492" y2="88" class="fg-l"/><polygon points="500,88 492,83.5 492,92.5" class="fg-a"/>
<line x1="300" y1="78" x2="316" y2="98" class="fg-l warm"/><line x1="316" y1="78" x2="300" y2="98" class="fg-l warm"/>
<text x="308" y="48" text-anchor="middle" class="fg-t sm warm">在這裡剪斷</text>
<text x="320" y="150" text-anchor="middle" class="fg-t sm">沒剪斷：從 window 一路走得到元件，GC 一個都不能收</text>
<text x="320" y="174" text-anchor="middle" class="fg-t sm acc">剪斷之後：後面三個都走不到了，下次 GC 一起回收</text>
</svg><figcaption>洩漏的不是那個小小的回呼，而是回呼背後拖著的整串東西。移除監聽，就是把清單到回呼的那條線剪斷。</figcaption></figure>
<p>四個最常見的來源：</p>
<ol>
<li><b>掛在長壽物件上的監聽</b>：window、document、全域的事件匯流排、遊戲裡的全域輸入。元件卸載了，監聽還在。</li>
<li><b>沒清掉的 setInterval</b>：回呼每秒跑一次，順便讓它背著的一切永遠活著。</li>
<li><b>只進不出的快取</b>：用 Map 以物件當鍵做快取，物件在別處早就不用了，Map 還拿著。改用 <code>WeakMap</code>：它不會因為自己拿著鍵就讓鍵活著。</li>
<li><b>脫離畫面的 DOM</b>：節點已經從頁面移除，但某個閉包還拿著它，整棵子樹都留在記憶體裡。</li>
</ol>
<p>移除監聽有一個陷阱：<code>removeEventListener</code> 要傳<b>同一個函式物件</b>。每寫一次 <code>() =&gt; …</code> 就是一個新物件，所以用匿名箭頭函式註冊的監聽，永遠移不掉。現代瀏覽器有更乾淨的寫法：註冊時給一個 AbortSignal，之後一次 abort 全部拆掉。</p>
<pre><code>import { onMounted, onUnmounted } from 'vue';

export function useHotkeys(onGuess: (dir: 'higher' | 'lower') =&gt; void) {
  const ctrl = new AbortController();
  onMounted(() =&gt; {
    window.addEventListener('keydown', e =&gt; {
      if (e.key === 'ArrowUp') onGuess('higher');
      if (e.key === 'ArrowDown') onGuess('lower');
    }, { signal: ctrl.signal });
    window.addEventListener('blur', () =&gt; console.log('paused'), {
      signal: ctrl.signal,
    });
  });
  onUnmounted(() =&gt; ctrl.abort());   // 一次拆掉這個元件掛上去的所有監聽
}</code></pre>
<p>Cocos 也是同一個道理：<code>input.on(Input.EventType.KEY_DOWN, this.onKey, this)</code> 掛在全域的輸入系統上，就要在 <code>onDestroy</code>（或成對地在 <code>onEnable</code>／<code>onDisable</code>）裡用同樣三個參數 <code>input.off</code>。這裡把方法本身和 target 分開傳，正好讓 off 能找到同一個函式。</p>
<p>怎麼抓：Chrome DevTools 的 Memory 面板拍兩張堆積快照（heap snapshot），中間把元件打開再關掉幾次，比較兩張的差異。選中一個不該存在的物件，下方的 Retainers 會列出「是誰拿著它」，一路往上追，通常就會看到某個 system / Context（閉包的紀錄）和一個沒被移除的監聽。</p>

<h3><span class="badge lv4">專家</span>八、過期的回應與取消：AbortController</h3>
<p>上一課的號碼牌，解決的是「舊回應蓋掉新畫面」。但舊請求本身還在跑：佔著連線、佔著頻寬，伺服器也還在處理。<code>AbortController</code> 讓你真的把它取消：</p>
<pre><code>let current: AbortController | undefined;

async function search(q: string, show: (names: string[]) =&gt; void): Promise&lt;void&gt; {
  current?.abort();                            // 取消上一個請求
  const mine = new AbortController();
  current = mine;
  try {
    const url = '/api/players?q=' + encodeURIComponent(q);
    const res = await fetch(url, { signal: mine.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const names = (await res.json()) as string[];
    if (current !== mine) return;              // 安全網：已經有更新的請求
    show(names);
  } catch (err) {
    if (mine.signal.aborted) return;           // 是我們自己取消的，安靜結束
    throw err;
  }
}</code></pre>
<figure class="figure"><svg viewBox="0 0 640 224" class="fg" style="width:100%;max-width:640px" role="img" aria-label="時間軸：請求 1 在 0 毫秒送出，120 毫秒時被 abort，它原本 400 毫秒才會回來；請求 2 在 120 毫秒送出，300 毫秒回來，畫面顯示請求 2 的結果">
<text x="8" y="56" class="fg-t sm">請求 1</text>
<text x="8" y="106" class="fg-t sm">請求 2</text>
<text x="8" y="171" class="fg-t sm">畫面</text>
<rect x="120" y="40" width="96" height="24" rx="4" class="fg-b alt"/><text x="168" y="57" text-anchor="middle" class="fg-t sm mono">q=m</text>
<line x1="216" y1="52" x2="440" y2="52" class="fg-l warm dash"/>
<text x="446" y="56" class="fg-t sm warm">本來 400 ms 才回來</text>
<line x1="216" y1="32" x2="216" y2="72" class="fg-l warm"/>
<text x="222" y="30" class="fg-t sm mono warm">abort()</text>
<rect x="216" y="90" width="144" height="24" rx="4" class="fg-b hot"/><text x="288" y="107" text-anchor="middle" class="fg-t sm mono">q=mi</text>
<line x1="360" y1="114" x2="360" y2="142" class="fg-l on"/><polygon points="360,150 355.5,142 364.5,142" class="fg-a on"/>
<text x="370" y="136" class="fg-t sm acc">300 ms 回來</text>
<rect x="290" y="150" width="140" height="30" rx="5" class="fg-b hot"/><text x="360" y="170" text-anchor="middle" class="fg-t">顯示 mi 的結果</text>
<line x1="120" y1="198" x2="512" y2="198" class="fg-l"/><polygon points="520,198 512,193.5 512,202.5" class="fg-a"/>
<text x="120" y="216" text-anchor="middle" class="fg-t sm">0</text>
<text x="200" y="216" text-anchor="middle" class="fg-t sm">100</text>
<text x="280" y="216" text-anchor="middle" class="fg-t sm">200</text>
<text x="360" y="216" text-anchor="middle" class="fg-t sm">300</text>
<text x="440" y="216" text-anchor="middle" class="fg-t sm">400 ms</text>
</svg><figcaption>使用者打了 m、又打了 i。送出第二個請求之前先 abort 第一個：舊請求的 fetch 立刻以 AbortError 失敗，永遠不會有機會蓋掉畫面。</figcaption></figure>
<p>幾個要知道的行為：</p>
<ul>
<li><b>abort 之後，fetch 回傳的 Promise 會被拒絕</b>，錯誤是名字叫 <code>AbortError</code> 的 DOMException。讀 body 的 <code>res.json()</code> 也受同一個 signal 控制。所以 catch 裡要分辨：是自己取消的就安靜地結束，其他錯誤照常往外丟。</li>
<li><b>逾時</b>：<code>AbortSignal.timeout(5000)</code> 直接給你一個 5 秒後自動 abort 的 signal，錯誤名稱是 <code>TimeoutError</code>。要同時「使用者取消」和「逾時」，較新的環境有 <code>AbortSignal.any([a, b])</code>，兩個任一觸發就取消。</li>
<li><b>取消不等於沒發生</b>：abort 只代表「我不等了」。請求可能早就送到伺服器，伺服器照樣處理完。查詢類的 GET 取消沒有關係；會改資料的請求（扣點數、下單）就不能靠前端取消來保證「沒做」，要靠伺服器端的冪等（idempotency）設計，例如每個請求帶一個唯一的 key，重複的直接回傳第一次的結果。</li>
<li><b>號碼牌仍然要留</b>：不是每個非同步工作都支援 signal（例如某些第三方 SDK 的回呼）。abort 省資源，號碼牌保正確，兩個一起用。</li>
</ul>
<p>Vue 的 <code>watch</code> 已經把「下一次觸發前先清掉上一次」這件事做好了，第三個參數 <code>onCleanup</code> 就是為這個設計的：</p>
<pre><code>import { ref, watch } from 'vue';

const query = ref('');
const results = ref&lt;string[]&gt;([]);

watch(query, async (q, _old, onCleanup) =&gt; {
  const ctrl = new AbortController();
  onCleanup(() =&gt; ctrl.abort());     // query 再變之前、元件卸載時，Vue 會先呼叫它
  try {
    const url = '/api/players?q=' + encodeURIComponent(q);
    const res = await fetch(url, { signal: ctrl.signal });
    results.value = (await res.json()) as string[];
  } catch (err) {
    if (!ctrl.signal.aborted) throw err;
  }
});</code></pre>
<p>Vue 3.5 另外提供了 <code>onWatcherCleanup()</code>，可以在 watcher 的回呼裡直接呼叫，效果一樣。</p>

<h3><span class="badge lv4">專家</span>九、引擎內部：共用的紀錄、箭頭欄位的代價</h3>
<h4>同一個作用域的閉包，共用一份紀錄</h4>
<p>規格說每個閉包「拿著外層的紀錄」，V8 的實作是：一個作用域裡，所有「被任何內層函式用到」的變數，放進同一個叫 Context 的物件；這個作用域裡建立的每一個閉包，都指著這同一個 Context。後果很反直覺：</p>
<pre><code>function setup(): () =&gt; number {
  const big = new Float64Array(1_000_000);   // 8 MB
  const unused = () =&gt; big.length;            // 這個閉包用到 big，用完就丟
  void unused;
  let clicks = 0;
  return () =&gt; ++clicks;                      // 只用到 clicks
}</code></pre>
<p>回傳的函式只用到 <code>clicks</code>，但因為 <code>unused</code> 用到了 <code>big</code>，<code>big</code> 就被放進共用的 Context，而回傳的函式指著這個 Context。我在 Node 22 上實測：呼叫 20 次 <code>setup</code> 並留住回傳的函式，ArrayBuffer 多佔了 160 MB（20 個 8 MB 一個都沒放掉）；把 <code>unused</code> 那一行拿掉，是 0 MB。這是 V8 的實作細節，其他引擎不一定一樣，但你的 Chrome 和 Node 都是 V8。修法是把用到大資料的工作搬到另一個函式裡，讓它們不在同一個作用域。在堆積快照裡，這種情況會顯示成 system / Context 拿著那個大陣列。</p>
<h4>箭頭欄位還是原型方法</h4>
<pre><code>class Card {
  constructor(public value: number) {}
  flip() { return this.value; }              // 放在原型上，所有實例共用一個
  onTap = () =&gt; this.value;                  // 每個實例各建一個函式
}
const a = new Card(1);
const b = new Card(2);
console.log(a.flip === b.flip, a.onTap === b.onTap);   // true false</code></pre>
<table>
<tr><th></th><th>原型方法</th><th>箭頭欄位</th></tr>
<tr><td>this</td><td>交出去前要自己 bind 或包一層</td><td>永遠是那個實例，可以直接交出去</td></tr>
<tr><td>記憶體</td><td>全部實例共用一個函式</td><td>1,000 個實例就有 1,000 個函式</td></tr>
<tr><td>繼承</td><td>子類別可以覆寫，也能呼叫 <code>super.flip()</code></td><td>它是實例上的屬性，不在原型上，子類別不能用 super 呼叫它</td></tr>
<tr><td>測試</td><td>可以在原型上替換或監看</td><td>要等實例建好才能動它</td></tr>
</table>
<p>經驗法則：會被當成回呼交出去、而且實例不多的（UI 元件、一個場景裡一個的管理器），用箭頭欄位很方便；會大量建立的（每張牌、每顆子彈），用原型方法，交出去時再用 <code>bind</code> 或像 Cocos 那樣把 target 分開傳。</p>
<h4>箭頭函式少了什麼</h4>
<p>箭頭函式不只沒有自己的 this，也沒有 <code>arguments</code>、沒有 <code>prototype</code>、不能當建構函式。所以 Vue Options API 的 <code>methods</code> 不能寫成箭頭函式（Vue 綁不了 this），而需要動態 this 的地方（例如 DOM 監聽裡要用 this 指那個元素）也要用一般函式。</p>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>閉包會把變數的值複製一份帶走</td><td>閉包拿著的是那份環境紀錄，也就是變數本身。外面之後改了，閉包讀到的是新值；同一次呼叫裡的兩個閉包共用同一個變數。</td></tr>
<tr><td>只有「回傳一個函式」才叫閉包</td><td>任何用到外層變數的函式都是閉包：事件回呼、計時器回呼、<code>.then</code> 裡的函式、Vue 的 computed 都是。</td></tr>
<tr><td><code>setTimeout(fn, 0)</code> 會馬上執行</td><td>最快也要等目前的程式和所有微任務跑完；巢狀太多層會被拉到 4 毫秒；Node 上至少 1 毫秒。</td></tr>
<tr><td>可以用 bind 改箭頭函式的 this</td><td>箭頭函式沒有自己的 this，bind、call、apply 給的 this 全部被忽略。</td></tr>
<tr><td>removeEventListener 傳一樣的程式碼就能移除</td><td>要傳同一個函式物件。每寫一次箭頭函式就是一個新物件，移不掉；改用具名函式，或用 AbortSignal。</td></tr>
<tr><td>abort 了，伺服器就沒做</td><td>abort 只是前端不等了。會改資料的請求，要靠伺服器端的冪等設計。</td></tr>
<tr><td>debounce 和 throttle 差不多</td><td>debounce 等停下來才做一次；throttle 在持續觸發時固定頻率做。搜尋框用前者，捲動、拖曳用後者。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>Vue</b>：<code>&lt;script setup&gt;</code> 和 composable 全靠閉包。每個在 onMounted 裡掛上去的東西（監聽、計時器、WebSocket、第三方套件的訂閱），都要在 onUnmounted 拆掉；非同步的 watch 用 <code>onCleanup</code> 取消上一次。</li>
<li><b>Cocos Creator</b>：<code>node.on(type, cb, this)</code> 和 <code>input.on</code> 傳 target 是為了 this，也是為了 off 的時候找得到；成對地在 onEnable／onDisable 或 onLoad／onDestroy 裡註冊和移除。遊戲邏輯裡的時間（技能冷卻、回合倒數）用 <code>update(dt)</code> 累加，或用元件的 <code>schedule</code>，它們跟著遊戲迴圈走；setTimeout 跟遊戲迴圈無關，遊戲暫停了它照樣觸發。</li>
<li><b>Node.js 後端</b>：閉包拿著 request 物件、再被放進長壽的快取或全域陣列，是伺服器記憶體慢慢上漲的經典原因。長時間的 setInterval 在關機流程裡要清掉，或用 <code>unref()</code>，否則行程結束不了。</li>
<li><b>Go</b>：goroutine 裡用到迴圈變數，在 1.22 以前是共用一個，跟 JavaScript 的 var 一模一樣；1.22 起改成每圈一份，跟 let 一樣。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<p>先自己講一遍，再打開參考答案。</p>
<ol>
<li>「什麼是閉包？舉一個你在專案裡實際用到的例子，並說說它可能帶來什麼問題。」</li>
<li>「<code>for (var i = 0; i &lt; 3; i++) setTimeout(() =&gt; console.log(i))</code> 印出什麼？為什麼？至少給兩種修法。」</li>
<li>「說明 this 的綁定規則和優先順序。箭頭函式有什麼不同？」</li>
<li>「實作一個 debounce，並說明它跟 throttle 的差別和各自的使用情境。」</li>
<li>「<code>setTimeout(fn, 1000)</code> 一定在一秒後執行嗎？為什麼？要做一個準確的倒數計時，你會怎麼寫？」</li>
<li>「搜尋框快速輸入時，舊的結果蓋掉了新的。怎麼解決？取消請求就夠了嗎？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>閉包是函式加上它被建立時所在的詞法環境。函式物件記住那份環境紀錄，即使外層函式已經回傳，只要函式還被參考，裡面的變數就還活著。例子：Vue 的 composable、debounce 把計時器藏在閉包裡、用閉包做私有狀態。問題：閉包會讓它拿著的一切保持可達，掛在 window 或全域事件上的回呼沒移除，就會讓整個元件和它的資料洩漏；在 V8 上，同一作用域的閉包共用一個 context，可能意外留住大物件。</li>
<li>印出 3、3、3。var 是函式（或全域）作用域，整個迴圈只有一個 i，三個回呼都拿著它，執行時迴圈已結束，i 是 3。修法：改用 let，規格會為每一圈建立新的綁定；或用函式參數建立新作用域，例如 IIFE，或用 setTimeout 的第三個參數把 i 當參數傳進去。</li>
<li>先看是不是箭頭函式：是的話沒有自己的 this，用詞法上外層的 this，bind／call／apply 都改不了。否則：用 new 呼叫，this 是新物件；用 call／apply／bind 指定，this 是指定的物件（bind 是永久的）；以 obj.fn() 形式呼叫，this 是 obj；都不是，嚴格模式下是 undefined，非嚴格模式是全域物件。優先順序 new &gt; 明確 &gt; 隱含 &gt; 預設。</li>
<li>debounce 每次呼叫都清掉舊計時器再設新的，等連續 wait 毫秒沒有新呼叫才執行最後那一次；要附 cancel 讓元件卸載時能清掉。throttle 保證在持續呼叫中至少間隔 interval 才執行一次，通常要包含第一次和最後一次。搜尋建議、輸入驗證、resize 完成用 debounce；捲動、拖曳、定時回報位置用 throttle。</li>
<li>不一定。延遲只是下限：時間到了回呼才進任務佇列，還要等主執行緒空出來；巢狀計時器有 4 毫秒的下限；背景分頁會被節流到每秒一次甚至更少。準確的倒數要記錄截止時間，每次觸發都用 performance.now()（或伺服器給的時間）重新算剩餘時間，而不是靠觸發次數累計。</li>
<li>兩層：每次發新請求前 abort 上一個（AbortController 傳 signal 給 fetch），catch 裡忽略 AbortError；再加號碼牌或「目前的 controller 是不是我」的檢查當安全網，因為不是所有非同步工作都能取消。也可以在輸入端加 debounce 減少請求數。取消不代表伺服器沒處理，所以有副作用的請求要靠伺服器端冪等。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>不要執行，先預測下面四行各印出什麼，再用這一章的規則解釋：
<pre><code>const deck = {
  name: 'deck',
  show() { return this.name; },
  later() { return [1].map(() =&gt; this.name)[0]; },
};
const show = deck.show;
console.log(deck.show());
console.log(deck.later());
console.log(show.call({ name: 'other' }));
console.log(show.bind(deck).call({ name: 'x' }));</code></pre></li>
<li>寫一個 <code>once</code>：包裝一個函式，讓它只真的執行一次，之後每次呼叫都回傳第一次的結果。參數和回傳型別都要保留。</li>
<li>幫這一章的 debounce 加上 <code>flush()</code>：如果有一次正在等待，立刻用最後那組參數執行它。</li>
<li>下面這個類別會洩漏。說出洩漏的鏈條，然後修好它：
<pre><code>class ScoreBoard {
  rows: string[] = [];
  constructor() {
    window.addEventListener('resize', () =&gt; this.layout());
  }
  layout() { console.log('layout', this.rows.length); }
  destroy() { this.rows = []; }
}</code></pre></li>
<li>用自己的話回答：為什麼 throttle 版本要記 <code>pending</code>，只做「冷卻中直接丟掉」的版本會出什麼問題？用拖曳卡片的例子說明。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>依序是 deck、deck、other、deck。第一行是隱含綁定，點號左邊是 deck。第二行的箭頭函式沒有自己的 this，用的是 later 的 this，而 later 是以 deck.later() 呼叫的。第三行 show 被拿出來後，用 call 明確指定 this。第四行先 bind 了 deck，bind 過的函式再用 call 也改不掉。</li>
<li>把「做過沒有」和「結果」放在閉包裡：
<pre><code>function once&lt;A extends unknown[], R&gt;(fn: (...args: A) =&gt; R): (...args: A) =&gt; R {
  let done = false;
  let result: R;
  return (...args: A): R =&gt; {
    if (!done) {
      done = true;
      result = fn(...args);
    }
    return result;
  };
}
const init = once(() =&gt; { console.log('init'); return 42; });
console.log(init(), init());   // 只印一次 init，然後 42 42</code></pre>
進一步：如果 fn 拋出錯誤，這個版本已經把 done 設成 true，之後會一直回傳 undefined 偽裝成 R。要不要「失敗了允許重試」，是設計上要決定的事。</li>
<li>多記一份「等待中的參數」，讓 flush 和計時器共用同一個執行函式：
<pre><code>function debounce&lt;A extends unknown[]&gt;(fn: (...args: A) =&gt; void, wait: number) {
  let timer: ReturnType&lt;typeof setTimeout&gt; | undefined;
  let pending: A | undefined;
  const run = (): void =&gt; {
    timer = undefined;
    const a = pending;
    pending = undefined;
    if (a) fn(...a);
  };
  const debounced = (...args: A): void =&gt; {
    pending = args;
    clearTimeout(timer);
    timer = setTimeout(run, wait);
  };
  debounced.flush = (): void =&gt; { clearTimeout(timer); run(); };
  debounced.cancel = (): void =&gt; {
    clearTimeout(timer);
    timer = undefined;
    pending = undefined;
  };
  return debounced;
}</code></pre>
flush 的典型用途：表單送出前，先把還在等待的自動儲存立刻做完。</li>
<li>鏈條是 window → resize 監聽清單 → 匿名箭頭函式 → 它的環境（this，也就是 ScoreBoard 實例）→ rows。destroy 只清空了陣列，監聽還在，而且因為是匿名函式，連移除都沒辦法。修法：
<pre><code>class ScoreBoard {
  rows: string[] = [];
  private ctrl = new AbortController();
  constructor() {
    window.addEventListener('resize', () =&gt; this.layout(), {
      signal: this.ctrl.signal,
    });
  }
  layout() { console.log('layout', this.rows.length); }
  destroy() { this.ctrl.abort(); this.rows = []; }
}</code></pre>
或者把回呼存成欄位（例如 <code>private onResize = () =&gt; this.layout()</code>），destroy 時用同一個函式物件呼叫 removeEventListener。</li>
<li>只做「冷卻中直接丟掉」的話，最後一次事件很可能落在冷卻裡被丟掉。拖曳卡片時，使用者最後放手的位置就是最後一次事件；丟掉它，卡片會停在放手前幾十毫秒的位置，看起來「沒對準」。記住 pending、在冷卻結束時補做最後一次，才能保證最終狀態正確。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>MDN：Closures、this、setTimeout、AbortController</b>（developer.mozilla.org）：四篇都是這一章的官方參考，setTimeout 那篇有「實際延遲比指定的長」的完整原因列表。</li>
<li><b>Kyle Simpson《You Don't Know JS Yet》</b>（GitHub 上免費）：其中 Scope &amp; Closures 一冊，把作用域和閉包講得最透；舊版的 this &amp; Object Prototypes 一冊講 this 的四條規則。</li>
<li><b>ECMAScript 規格</b>（tc39.es/ecma262）的 Environment Records 一節：環境紀錄、outer、for 迴圈每圈複製綁定的正式定義都在這裡。</li>
<li><b>Vue 官方文件</b>（vuejs.org）的 Watchers 一章：副作用清理（onCleanup、onWatcherCleanup）的說明和例子。</li>
<li><b>Chrome DevTools 官方文件</b>（developer.chrome.com/docs/devtools）的記憶體問題章節：怎麼拍堆積快照、怎麼看 Retainers、怎麼找脫離畫面的 DOM。</li>
</ul>
` });
