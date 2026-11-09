DEEP({ 'ts-arrays': `
<p>上一課你學會了 map、filter、reduce、展開和複製，也知道它們「不會改到原本的值」。這一章把蓋子打開：先自己從零把這三個方法寫一次，看清楚它們其實只是迴圈；再算它們到底要花多少步，找出藏在程式裡的 O(n²)；接著看「不可變」在記憶體裡真正發生了什麼、排序的比較函式要守哪些規則、reduce 的型別怎麼寫才不會跟 TypeScript 吵架；最後走進遊戲迴圈，看這些方便的寫法每秒被呼叫六十次時，要付出什麼代價。</p>

<h3><span class="badge lv1">基礎</span>一、拆開來看：map、filter、reduce 只是三種迴圈</h3>
<p>把陣列想成工廠裡的一條輸送帶，零件一個一個經過你面前。這三個方法，是站在輸送帶旁邊的三種工人：</p>
<ul>
<li><b>map</b> 是加工站：每個零件進來，加工成一個新零件，放到下一條輸送帶。進來幾個，出去就幾個。</li>
<li><b>filter</b> 是品管站：每個零件看一眼，合格的放行，不合格的丟掉。出去的只會變少，不會變多，零件本身也不會被改。</li>
<li><b>reduce</b> 是裝箱站：手上拿著一個箱子（累加值），每個零件進來就處理一下放進箱子，最後交出去的只有那一個箱子。</li>
</ul>
<figure class="figure"><svg viewBox="0 0 650 250" class="fg" style="width:100%;max-width:650px" role="img" aria-label="同一串 3、8、5、12 分別經過 map、filter、reduce：map 交回四個新值，filter 只留下 8 和 12，reduce 交回一個 28">
<text x="16" y="51" class="fg-t lg mono">map</text>
<rect x="84" y="30" width="32" height="32" rx="4" class="fg-b"/><text x="100" y="51" text-anchor="middle" class="fg-t mono">3</text>
<rect x="120" y="30" width="32" height="32" rx="4" class="fg-b"/><text x="136" y="51" text-anchor="middle" class="fg-t mono">8</text>
<rect x="156" y="30" width="32" height="32" rx="4" class="fg-b"/><text x="172" y="51" text-anchor="middle" class="fg-t mono">5</text>
<rect x="192" y="30" width="32" height="32" rx="4" class="fg-b"/><text x="208" y="51" text-anchor="middle" class="fg-t mono">12</text>
<line x1="228" y1="46" x2="262" y2="46" class="fg-l"/><polygon points="270,46 262,41.5 262,50.5" class="fg-a"/>
<rect x="270" y="30" width="150" height="32" rx="6" class="fg-b hot"/><text x="345" y="51" text-anchor="middle" class="fg-t mono">c =&gt; c * 10</text>
<text x="345" y="82" text-anchor="middle" class="fg-t sm">跑 4 次，收回 4 個</text>
<line x1="424" y1="46" x2="452" y2="46" class="fg-l on"/><polygon points="460,46 452,41.5 452,50.5" class="fg-a on"/>
<rect x="460" y="30" width="40" height="32" rx="4" class="fg-b alt"/><text x="480" y="51" text-anchor="middle" class="fg-t mono">30</text>
<rect x="504" y="30" width="40" height="32" rx="4" class="fg-b alt"/><text x="524" y="51" text-anchor="middle" class="fg-t mono">80</text>
<rect x="548" y="30" width="40" height="32" rx="4" class="fg-b alt"/><text x="568" y="51" text-anchor="middle" class="fg-t mono">50</text>
<rect x="592" y="30" width="40" height="32" rx="4" class="fg-b alt"/><text x="612" y="51" text-anchor="middle" class="fg-t mono">120</text>
<text x="546" y="82" text-anchor="middle" class="fg-t sm">長度一樣的新陣列</text>
<text x="16" y="131" class="fg-t lg mono">filter</text>
<rect x="84" y="110" width="32" height="32" rx="4" class="fg-b warm"/><text x="100" y="131" text-anchor="middle" class="fg-t mono">3</text>
<rect x="120" y="110" width="32" height="32" rx="4" class="fg-b"/><text x="136" y="131" text-anchor="middle" class="fg-t mono">8</text>
<rect x="156" y="110" width="32" height="32" rx="4" class="fg-b warm"/><text x="172" y="131" text-anchor="middle" class="fg-t mono">5</text>
<rect x="192" y="110" width="32" height="32" rx="4" class="fg-b"/><text x="208" y="131" text-anchor="middle" class="fg-t mono">12</text>
<line x1="228" y1="126" x2="262" y2="126" class="fg-l"/><polygon points="270,126 262,121.5 262,130.5" class="fg-a"/>
<rect x="270" y="110" width="150" height="32" rx="6" class="fg-b hot"/><text x="345" y="131" text-anchor="middle" class="fg-t mono">c =&gt; c &gt; 6</text>
<text x="345" y="162" text-anchor="middle" class="fg-t sm">回傳 true 才留下</text>
<line x1="424" y1="126" x2="452" y2="126" class="fg-l on"/><polygon points="460,126 452,121.5 452,130.5" class="fg-a on"/>
<rect x="460" y="110" width="40" height="32" rx="4" class="fg-b alt"/><text x="480" y="131" text-anchor="middle" class="fg-t mono">8</text>
<rect x="504" y="110" width="40" height="32" rx="4" class="fg-b alt"/><text x="524" y="131" text-anchor="middle" class="fg-t mono">12</text>
<text x="502" y="162" text-anchor="middle" class="fg-t sm warm">3、5 被丟掉</text>
<text x="16" y="211" class="fg-t lg mono">reduce</text>
<rect x="84" y="190" width="32" height="32" rx="4" class="fg-b"/><text x="100" y="211" text-anchor="middle" class="fg-t mono">3</text>
<rect x="120" y="190" width="32" height="32" rx="4" class="fg-b"/><text x="136" y="211" text-anchor="middle" class="fg-t mono">8</text>
<rect x="156" y="190" width="32" height="32" rx="4" class="fg-b"/><text x="172" y="211" text-anchor="middle" class="fg-t mono">5</text>
<rect x="192" y="190" width="32" height="32" rx="4" class="fg-b"/><text x="208" y="211" text-anchor="middle" class="fg-t mono">12</text>
<line x1="228" y1="206" x2="262" y2="206" class="fg-l"/><polygon points="270,206 262,201.5 262,210.5" class="fg-a"/>
<rect x="270" y="190" width="150" height="32" rx="6" class="fg-b hot"/><text x="345" y="211" text-anchor="middle" class="fg-t mono">(s, c) =&gt; s + c</text>
<text x="345" y="242" text-anchor="middle" class="fg-t sm">累加值 0 &rarr; 3 &rarr; 11 &rarr; 16 &rarr; 28</text>
<line x1="424" y1="206" x2="452" y2="206" class="fg-l on"/><polygon points="460,206 452,201.5 452,210.5" class="fg-a on"/>
<rect x="460" y="190" width="48" height="32" rx="4" class="fg-b hot"/><text x="484" y="211" text-anchor="middle" class="fg-t mono acc">28</text>
<text x="520" y="211" class="fg-t sm">只剩一個值</text>
</svg><figcaption>三個方法走的是同一條輸送帶，差別只在「每一項的回傳值怎麼用」：map 收起來、filter 拿來決定去留、reduce 拿來更新箱子。</figcaption></figure>
<p>這三個方法沒有任何魔法。下面是它們最核心的樣子，每一個都只是一個 <code>for</code> 迴圈：</p>
<pre><code>function myMap&lt;T, U&gt;(arr: readonly T[], fn: (item: T, i: number) =&gt; U): U[] {
  const out: U[] = [];
  for (let i = 0; i &lt; arr.length; i++) out.push(fn(arr[i], i));
  return out;
}

function myFilter&lt;T&gt;(arr: readonly T[], keep: (item: T, i: number) =&gt; boolean): T[] {
  const out: T[] = [];
  for (let i = 0; i &lt; arr.length; i++) {
    if (keep(arr[i], i)) out.push(arr[i]);
  }
  return out;
}

function myReduce&lt;T, A&gt;(
  arr: readonly T[], step: (acc: A, item: T, i: number) =&gt; A, initial: A,
): A {
  let acc = initial;
  for (let i = 0; i &lt; arr.length; i++) acc = step(acc, arr[i], i);
  return acc;
}

const cards = [3, 8, 5, 12];
console.log(myMap(cards, c =&gt; c * 10));            // [30, 80, 50, 120]
console.log(myFilter(cards, c =&gt; c &gt; 6));          // [8, 12]
console.log(myReduce(cards, (s, c) =&gt; s + c, 0));  // 28</code></pre>
<p>仔細看這三段，會發現三件事：</p>
<ol>
<li><b>它們都會建立新東西。</b>map 和 filter 一定做出一個新陣列 <code>out</code>，原本的 <code>arr</code> 只被讀、沒被寫。這就是上一課「不會改到原本的值」的原因：不是它們特別小心，而是程式裡根本沒有寫回去的那一行。參數型別寫成 <code>readonly T[]</code>，等於是對呼叫的人保證這件事。</li>
<li><b>型別參數說出了它們的本質。</b>map 是 <code>T</code> 進、<code>U</code> 出，所以能把數字變成字串；filter 是 <code>T</code> 進、<code>T</code> 出，只會變少、不會變形；reduce 多了一個 <code>A</code>，箱子可以是任何形狀，所以它什麼都做得出來。</li>
<li><b>它們一定走完整條輸送帶。</b>不管 callback 回傳什麼，map、filter、reduce 都會走到最後一項。只有 find、some、every 會提早停。</li>
</ol>
<h4>真正的 Array.prototype.map 多做了什麼</h4>
<p>規格（ECMAScript specification）裡的 map，跟上面的 myMap 有幾個差別。平常碰不到，但除錯和面試會遇到：</p>
<ul>
<li>callback 其實收到三個參數：項目、索引，以及整個陣列本身。map 的第二個參數 <code>thisArg</code> 還能指定 callback 裡的 <code>this</code>。</li>
<li>長度在一開始就讀好了。callback 裡對同一個陣列 <code>push</code>，新加的項目不會被走到。</li>
<li>它會跳過「洞」（hole）。<code>[1, , 3]</code> 中間那格根本不存在，map 不會對它呼叫 callback，結果的同一格也還是洞。</li>
</ul>
<p>還有一個經典的坑：<code>['1', '2', '3'].map(parseInt)</code> 得到 <code>[1, NaN, NaN]</code>。map 把索引當第二個參數傳進去，<code>parseInt</code> 把它當成進位制：<code>parseInt('2', 1)</code> 是 NaN，<code>parseInt('3', 2)</code> 也是 NaN，因為二進位裡沒有 3。TypeScript 不會擋這一行，因為多給的參數在型別上是合法的。把現成的函式直接丟給 map 之前，先想想它收到三個參數會不會出事。</p>

<h3><span class="badge lv1">基礎</span>二、陣列放在哪裡：變數裝的是一張地址紙條</h3>
<p>要真的懂「複製」和「不可變」，得先知道一件事：陣列和物件不是放在變數裡面，而是放在一塊叫<b>堆積</b>（heap）的記憶體裡。變數裡裝的只是一張寫著地址的紙條，叫做<b>參考</b>（reference）。</p>
<figure class="figure"><svg viewBox="0 0 640 262" class="fg" style="width:100%;max-width:640px" role="img" aria-label="變數 a 和 b 指向同一個陣列 #1，變數 c 指向展開複製出來的陣列 #2">
<text x="110" y="28" text-anchor="middle" class="fg-t lg">變數</text>
<text x="485" y="28" text-anchor="middle" class="fg-t lg">堆積裡的陣列</text>
<rect x="30" y="60" width="160" height="34" rx="6" class="fg-b"/><text x="46" y="82" class="fg-t mono">const a</text>
<rect x="30" y="120" width="160" height="34" rx="6" class="fg-b"/><text x="46" y="142" class="fg-t mono">const b = a</text>
<rect x="30" y="183" width="160" height="34" rx="6" class="fg-b"/><text x="46" y="205" class="fg-t mono">const c = [...a]</text>
<rect x="360" y="60" width="250" height="74" rx="8" class="fg-b hot"/>
<text x="374" y="79" class="fg-t sm acc">陣列 #1</text>
<rect x="374" y="92" width="48" height="28" rx="4" class="fg-b"/><text x="398" y="111" text-anchor="middle" class="fg-t mono">3</text>
<rect x="428" y="92" width="48" height="28" rx="4" class="fg-b"/><text x="452" y="111" text-anchor="middle" class="fg-t mono">8</text>
<rect x="482" y="92" width="48" height="28" rx="4" class="fg-b"/><text x="506" y="111" text-anchor="middle" class="fg-t mono">5</text>
<rect x="536" y="92" width="48" height="28" rx="4" class="fg-b"/><text x="560" y="111" text-anchor="middle" class="fg-t mono">12</text>
<rect x="360" y="163" width="250" height="74" rx="8" class="fg-b alt"/>
<text x="374" y="182" class="fg-t sm alt">陣列 #2（新的）</text>
<rect x="374" y="195" width="48" height="28" rx="4" class="fg-b"/><text x="398" y="214" text-anchor="middle" class="fg-t mono">3</text>
<rect x="428" y="195" width="48" height="28" rx="4" class="fg-b"/><text x="452" y="214" text-anchor="middle" class="fg-t mono">8</text>
<rect x="482" y="195" width="48" height="28" rx="4" class="fg-b"/><text x="506" y="214" text-anchor="middle" class="fg-t mono">5</text>
<rect x="536" y="195" width="48" height="28" rx="4" class="fg-b"/><text x="560" y="214" text-anchor="middle" class="fg-t mono">12</text>
<path d="M190 77 H260 V84 H352" class="fg-l on"/><polygon points="360,84 352,79.5 352,88.5" class="fg-a on"/>
<path d="M190 137 H290 V112 H352" class="fg-l on"/><polygon points="360,112 352,107.5 352,116.5" class="fg-a on"/>
<text x="240" y="128" text-anchor="middle" class="fg-t sm acc">同一個</text>
<line x1="190" y1="200" x2="352" y2="200" class="fg-l alt"/><polygon points="360,200 352,195.5 352,204.5" class="fg-a alt"/>
<text x="275" y="192" text-anchor="middle" class="fg-t sm alt">照著做一個新的</text>
<text x="320" y="254" text-anchor="middle" class="fg-t sm">a === b 是 true　　a === c 是 false</text>
</svg><figcaption>b = a 只是多抄一張紙條，兩張紙條指著同一個陣列；[...a] 才是在堆積裡真的做出第二個陣列。</figcaption></figure>
<pre><code>const a = [3, 8, 5, 12];
const b = a;          // 抄一張紙條：同一個陣列
const c = [...a];     // 照著做一個新陣列
b.push(9);
console.log(a.length, c.length);   // 5 4
console.log(a === b, a === c);     // true false</code></pre>
<p>數字、字串、布林這些<b>原始值</b>（primitive）沒有這個問題。它們本身不能被修改，所以抄紙條跟抄值的效果一樣。會出事的永遠是物件和陣列，因為兩張紙條可能指著同一個東西。</p>
<p>兩個常被誤會的地方：</p>
<ul>
<li><code>const</code> 鎖住的是紙條，不是陣列。<code>const a = []</code> 之後不能寫 <code>a = [1]</code>，但 <code>a.push(1)</code> 完全沒問題。</li>
<li><code>===</code> 比的是地址，不是內容。<code>[1, 2] === [1, 2]</code> 是 <code>false</code>，因為那是兩個不同地址的陣列。這正好是不可變的好處：只要大家約好「要改就做新的」，地址沒變就保證內容沒變，比一次地址就夠，不用一格一格比。</li>
</ul>
<p>函式參數也是一樣。把陣列傳進函式，傳的是紙條的副本，不是陣列的副本。函式裡偷偷 <code>push</code> 一下，外面的人手上那個陣列也就變了。上一課說的「不會嚇到別人」，擔心的就是這件事。</p>

<h3><span class="badge lv2">進階</span>三、追蹤一條串接：呼叫了幾次、做了幾個陣列</h3>
<p>真實的程式很少只用一個方法。拿五回合的紀錄，算「猜對的那幾回合，牌面乘以十加起來是多少」：</p>
<pre><code>type Round = { card: number; correct: boolean };
const rounds: Round[] = [
  { card: 3, correct: true },
  { card: 8, correct: true },
  { card: 5, correct: false },
  { card: 12, correct: true },
  { card: 7, correct: false },
];
const total = rounds
  .filter(r =&gt; r.correct)       // 呼叫 5 次，做出新陣列 #1（3 筆）
  .map(r =&gt; r.card * 10)        // 呼叫 3 次，做出新陣列 #2（3 筆）
  .reduce((s, x) =&gt; s + x, 0);  // 呼叫 3 次，只交回一個數字
console.log(total);             // 230</code></pre>
<figure class="figure"><svg viewBox="0 0 680 250" class="fg" style="width:100%;max-width:680px" role="img" aria-label="五筆回合經過 filter 變成三個參考，經過 map 變成 30、80、120，經過 reduce 變成 230，中間做了兩個新陣列">
<rect x="10" y="36" width="120" height="150" rx="8" class="fg-b"/>
<text x="70" y="56" text-anchor="middle" class="fg-t mono">rounds</text>
<text x="70" y="80" text-anchor="middle" class="fg-t sm">3　對</text>
<text x="70" y="101" text-anchor="middle" class="fg-t sm">8　對</text>
<text x="70" y="122" text-anchor="middle" class="fg-t sm warm">5　錯</text>
<text x="70" y="143" text-anchor="middle" class="fg-t sm">12　對</text>
<text x="70" y="164" text-anchor="middle" class="fg-t sm warm">7　錯</text>
<line x1="130" y1="111" x2="182" y2="111" class="fg-l"/><polygon points="190,111 182,106.5 182,115.5" class="fg-a"/>
<text x="160" y="101" text-anchor="middle" class="fg-t sm mono">filter</text>
<text x="160" y="130" text-anchor="middle" class="fg-t sm">5 次</text>
<rect x="190" y="36" width="120" height="150" rx="8" class="fg-b alt"/>
<text x="250" y="56" text-anchor="middle" class="fg-t alt">新陣列 #1</text>
<text x="250" y="84" text-anchor="middle" class="fg-t sm">回合 0 的參考</text>
<text x="250" y="108" text-anchor="middle" class="fg-t sm">回合 1 的參考</text>
<text x="250" y="132" text-anchor="middle" class="fg-t sm">回合 3 的參考</text>
<line x1="310" y1="111" x2="362" y2="111" class="fg-l"/><polygon points="370,111 362,106.5 362,115.5" class="fg-a"/>
<text x="340" y="101" text-anchor="middle" class="fg-t sm mono">map</text>
<text x="340" y="130" text-anchor="middle" class="fg-t sm">3 次</text>
<rect x="370" y="36" width="120" height="150" rx="8" class="fg-b alt"/>
<text x="430" y="56" text-anchor="middle" class="fg-t alt">新陣列 #2</text>
<text x="430" y="84" text-anchor="middle" class="fg-t mono">30</text>
<text x="430" y="108" text-anchor="middle" class="fg-t mono">80</text>
<text x="430" y="132" text-anchor="middle" class="fg-t mono">120</text>
<line x1="490" y1="111" x2="542" y2="111" class="fg-l on"/><polygon points="550,111 542,106.5 542,115.5" class="fg-a on"/>
<text x="520" y="101" text-anchor="middle" class="fg-t sm mono">reduce</text>
<text x="520" y="130" text-anchor="middle" class="fg-t sm">3 次</text>
<rect x="550" y="36" width="120" height="150" rx="8" class="fg-b hot"/>
<text x="610" y="56" text-anchor="middle" class="fg-t acc">結果</text>
<text x="610" y="118" text-anchor="middle" class="fg-t lg mono">230</text>
<text x="340" y="214" text-anchor="middle" class="fg-t sm">callback 共 11 次，中間做了 2 個陣列</text>
<text x="340" y="238" text-anchor="middle" class="fg-t sm acc">同一件事寫成一個 for 迴圈：5 次，0 個陣列</text>
</svg><figcaption>串接的每一段都會做出一個新陣列交給下一段。新陣列 #1 裡放的是原本回合物件的參考，不是複本。</figcaption></figure>
<p>逐步追一次：</p>
<table>
<tr><th>步驟</th><th>回呼收到</th><th>回傳</th><th>手上的結果</th></tr>
<tr><td>filter 第 1～5 次</td><td>3 對、8 對、5 錯、12 對、7 錯</td><td>true、true、false、true、false</td><td>新陣列 #1：回合 0、1、3</td></tr>
<tr><td>map 第 1～3 次</td><td>牌面 3、8、12</td><td>30、80、120</td><td>新陣列 #2：<code>[30, 80, 120]</code></td></tr>
<tr><td>reduce 第 1 次</td><td>s = 0，x = 30</td><td>30</td><td>30</td></tr>
<tr><td>reduce 第 2 次</td><td>s = 30，x = 80</td><td>110</td><td>110</td></tr>
<tr><td>reduce 第 3 次</td><td>s = 110，x = 120</td><td>230</td><td>230</td></tr>
</table>
<p>總共 11 次 callback、2 個中間陣列。同樣的事寫成一個迴圈，是 5 次、0 個中間陣列：</p>
<pre><code>type Round = { card: number; correct: boolean };
declare const rounds: Round[];
let total = 0;
for (const r of rounds) {
  if (r.correct) total += r.card * 10;
}</code></pre>
<p>這不代表串接不好。11 次和 5 次都是「跟資料量成正比」，差的只是常數倍。對一份 50 筆的清單，差距小到量不出來，而串接版本好讀得多。真正要小心的是兩種情況：下一節那種「差了 n 倍」的寫法，以及第八節的遊戲迴圈，每秒做六十次、每次都建新陣列。</p>
<h4>會提早停的方法，要看最壞情況</h4>
<p>find、some、every、findIndex、includes 碰到答案就停，運氣好時只看第一項。但估成本要看最壞的情況：要找的東西在最後面，或根本不在，就得走完整個陣列。找一個「確定在裡面、位置隨機」的東西，平均要看一半。</p>

<h3><span class="badge lv2">進階</span>四、複雜度：藏在 map 裡的 find，讓程式慢上百倍</h3>
<p><b>時間複雜度</b>（time complexity）回答一個問題：資料變成十倍時，工作量變成幾倍？通常用<b>大 O 表示法</b>（Big-O notation）來寫：</p>
<table>
<tr><th>寫法</th><th>資料 ×10，工作量</th><th>例子</th></tr>
<tr><td>O(1)</td><td>不變</td><td><code>arr[i]</code>、<code>arr.length</code>、<code>push</code>、<code>pop</code>、<code>map.get(k)</code>、<code>set.has(x)</code></td></tr>
<tr><td>O(n)</td><td>×10</td><td>map、filter、reduce、find、includes、indexOf、<code>[...arr]</code>；還有 <code>shift</code>、<code>unshift</code>、<code>splice</code>，因為後面的每一格都要搬</td></tr>
<tr><td>O(n log n)</td><td>×13 左右</td><td>sort</td></tr>
<tr><td>O(n²)</td><td>×100</td><td>在一個 O(n) 的迴圈裡，每一項都再做一次 O(n)</td></tr>
</table>
<p>O(n²) 最常見的樣子，是 map 或 filter 的 callback 裡又放了一個 find、includes 或 indexOf。看起來只有一行，其實是兩層迴圈：</p>
<pre><code>type Player = { id: string; nick: string };
type Play = { playerId: string; card: number };
declare const players: Player[];   // 1,000 位玩家
declare const plays: Play[];       // 10,000 筆出牌紀錄

// 每一筆紀錄都從頭找一次玩家：O(紀錄數 × 玩家數)
const slow = plays.map(p =&gt; players.find(x =&gt; x.id === p.playerId)?.nick ?? '?');

// 先花一趟把玩家放進 Map，之後每次查都是 O(1)：O(紀錄數 + 玩家數)
const byId = new Map(players.map(x =&gt; [x.id, x] as const));
const fast = plays.map(p =&gt; byId.get(p.playerId)?.nick ?? '?');</code></pre>
<figure class="figure"><svg viewBox="0 0 660 262" class="fg" style="width:100%;max-width:660px" role="img" aria-label="左邊：每一回合都從第一位玩家開始一個一個比，找到為止；右邊：先把玩家放進 Map，每一回合直接跳到對的那一格">
<line x1="330" y1="10" x2="330" y2="252" class="fg-l dim dash"/>
<text x="165" y="24" text-anchor="middle" class="fg-t warm">每一回合都從頭找（find）</text>
<rect x="50" y="38" width="36" height="24" rx="4" class="fg-b"/><text x="68" y="55" text-anchor="middle" class="fg-t sm mono">p1</text>
<rect x="92" y="38" width="36" height="24" rx="4" class="fg-b"/><text x="110" y="55" text-anchor="middle" class="fg-t sm mono">p2</text>
<rect x="134" y="38" width="36" height="24" rx="4" class="fg-b"/><text x="152" y="55" text-anchor="middle" class="fg-t sm mono">p3</text>
<rect x="176" y="38" width="36" height="24" rx="4" class="fg-b"/><text x="194" y="55" text-anchor="middle" class="fg-t sm mono">p4</text>
<rect x="218" y="38" width="36" height="24" rx="4" class="fg-b"/><text x="236" y="55" text-anchor="middle" class="fg-t sm mono">p5</text>
<rect x="260" y="38" width="36" height="24" rx="4" class="fg-b"/><text x="278" y="55" text-anchor="middle" class="fg-t sm mono">p6</text>
<text x="8" y="94" class="fg-t sm">回合 1</text>
<line x1="48" y1="90" x2="236" y2="90" class="fg-l warm dash"/>
<circle cx="68" cy="90" r="5" class="fg-b"/><circle cx="110" cy="90" r="5" class="fg-b"/><circle cx="152" cy="90" r="5" class="fg-b"/><circle cx="194" cy="90" r="5" class="fg-b"/><circle cx="236" cy="90" r="6" class="fg-lamp on"/>
<text x="322" y="94" text-anchor="end" class="fg-t sm">5 次</text>
<text x="8" y="124" class="fg-t sm">回合 2</text>
<line x1="48" y1="120" x2="110" y2="120" class="fg-l warm dash"/>
<circle cx="68" cy="120" r="5" class="fg-b"/><circle cx="110" cy="120" r="6" class="fg-lamp on"/>
<text x="322" y="124" text-anchor="end" class="fg-t sm">2 次</text>
<text x="8" y="154" class="fg-t sm">回合 3</text>
<line x1="48" y1="150" x2="278" y2="150" class="fg-l warm dash"/>
<circle cx="68" cy="150" r="5" class="fg-b"/><circle cx="110" cy="150" r="5" class="fg-b"/><circle cx="152" cy="150" r="5" class="fg-b"/><circle cx="194" cy="150" r="5" class="fg-b"/><circle cx="236" cy="150" r="5" class="fg-b"/><circle cx="278" cy="150" r="6" class="fg-lamp on"/>
<text x="322" y="154" text-anchor="end" class="fg-t sm">6 次</text>
<text x="8" y="184" class="fg-t sm">回合 4</text>
<line x1="48" y1="180" x2="152" y2="180" class="fg-l warm dash"/>
<circle cx="68" cy="180" r="5" class="fg-b"/><circle cx="110" cy="180" r="5" class="fg-b"/><circle cx="152" cy="180" r="6" class="fg-lamp on"/>
<text x="322" y="184" text-anchor="end" class="fg-t sm">3 次</text>
<text x="165" y="222" text-anchor="middle" class="fg-t sm">比較次數 ≈ 回合數 × 玩家數 ÷ 2</text>
<text x="165" y="244" text-anchor="middle" class="fg-t sm warm">1 萬回合 × 1 千玩家 ≈ 500 萬次</text>
<text x="495" y="24" text-anchor="middle" class="fg-t acc">先建 Map，再直接拿</text>
<text x="495" y="50" text-anchor="middle" class="fg-t sm">第一步：走一遍玩家放進 Map</text>
<text x="346" y="94" class="fg-t sm">回合 1</text>
<line x1="392" y1="90" x2="452" y2="90" class="fg-l on"/><polygon points="460,90 452,85.5 452,94.5" class="fg-a on"/>
<text x="346" y="124" class="fg-t sm">回合 2</text>
<line x1="392" y1="120" x2="452" y2="120" class="fg-l on"/><polygon points="460,120 452,115.5 452,124.5" class="fg-a on"/>
<text x="346" y="154" class="fg-t sm">回合 3</text>
<line x1="392" y1="150" x2="452" y2="150" class="fg-l on"/><polygon points="460,150 452,145.5 452,154.5" class="fg-a on"/>
<text x="346" y="184" class="fg-t sm">回合 4</text>
<line x1="392" y1="180" x2="452" y2="180" class="fg-l on"/><polygon points="460,180 452,175.5 452,184.5" class="fg-a on"/>
<text x="424" y="80" text-anchor="middle" class="fg-t sm mono">get(id)</text>
<rect x="460" y="66" width="180" height="130" rx="8" class="fg-b hot"/>
<text x="550" y="88" text-anchor="middle" class="fg-t acc">Map：id &rarr; 玩家</text>
<text x="550" y="114" text-anchor="middle" class="fg-t sm mono">p1 &rarr; Mia</text>
<text x="550" y="136" text-anchor="middle" class="fg-t sm mono">p2 &rarr; Leo</text>
<text x="550" y="158" text-anchor="middle" class="fg-t sm mono">p5 &rarr; Ana</text>
<text x="550" y="180" text-anchor="middle" class="fg-t sm">⋮</text>
<text x="495" y="222" text-anchor="middle" class="fg-t sm">比較次數 ≈ 玩家數 + 回合數</text>
<text x="495" y="244" text-anchor="middle" class="fg-t sm acc">1 千 + 1 萬 ≈ 1.1 萬次</text>
</svg><figcaption>左邊每一回合都要從 p1 開始一個一個比；右邊先花一趟把玩家放進 Map，之後每一回合都是一步到位。</figcaption></figure>
<p>算一下工作量。玩家 1,000 位、紀錄 10,000 筆，玩家 id 平均分布：</p>
<ul>
<li><b>find 版</b>：每筆紀錄平均要比對一半的玩家，約 500 次。10,000 × 500 = <b>約 500 萬次比對</b>。</li>
<li><b>Map 版</b>：建 Map 放 1,000 次，查詢 10,000 次，合計<b>約 1.1 萬次</b>操作。</li>
</ul>
<p>我在一台 M1 筆電、Node 22 上實際量過（三次平均；你的機器數字一定不同，看數量級就好）：</p>
<table>
<tr><th>玩家數 × 紀錄數</th><th>每筆都從頭找</th><th>先建索引表</th></tr>
<tr><td>100 × 1,000</td><td>約 0.5 ms</td><td>約 0.07 ms</td></tr>
<tr><td>1,000 × 10,000</td><td>約 18 ms</td><td>約 0.4 ms</td></tr>
<tr><td>10,000 × 10,000</td><td>約 180 ms</td><td>約 1.3 ms</td></tr>
<tr><td>10,000 × 100,000</td><td>約 1,900 ms</td><td>約 5.5 ms</td></tr>
</table>
<p>注意第一列：資料小的時候，兩種寫法都不到 1 毫秒，開發時完全感覺不到。等正式環境的資料長大十倍、一百倍，find 版就從「看不出來」變成「畫面凍住兩秒」。O(n²) 的可怕就在這裡：它在測試資料上永遠很快。</p>
<p>同一招適用在所有「在迴圈裡查東西」的地方：</p>
<ul>
<li>交集 <code>a.filter(x =&gt; b.includes(x))</code>：先做 <code>const inB = new Set(b)</code>，再用 <code>inB.has(x)</code>。</li>
<li>去除重複：<code>arr.filter((x, i) =&gt; arr.indexOf(x) === i)</code> 是 O(n²)；<code>[...new Set(arr)]</code> 是 O(n)。</li>
<li>依 id 更新：同一個陣列要被查很多次，就維護一個「id 對到索引」的 Map，或乾脆用 Map 當主要的資料結構。</li>
</ul>
<div class="note"><b>Map 和 Set 為什麼是 O(1)？</b>它們底下是<b>雜湊表</b>（hash table）：把鍵算成一個數字（雜湊值），直接當成格子的位置去拿，不必一格一格比。O(1) 指的是平均情況：兩把鍵算出同一個位置（碰撞）時要多比幾次，但引擎會在格子太擠時自動擴大，實務上就當它是常數時間。另外，物件當鍵時比的是地址：兩個長得一樣的物件，是兩把不同的鍵。</div>

<h3><span class="badge lv2">進階</span>五、排序：比較函式的規則與穩定性</h3>
<p><code>sort</code> 不知道你的資料怎麼比，所以它把「誰排前面」這個問題丟回給你的<b>比較函式</b>（comparator）。規則只有一條：</p>
<table>
<tr><th>比較函式回傳</th><th>意思</th></tr>
<tr><td>負數</td><td>a 排在 b 前面</td></tr>
<tr><td>正數</td><td>a 排在 b 後面</td></tr>
<tr><td>0</td><td>一樣大，保持原本的先後</td></tr>
</table>
<p><code>(a, b) =&gt; a - b</code> 剛好符合：a 比較小時差是負數，a 就排前面，所以是由小到大。由大到小就反過來，寫 <code>b - a</code>。</p>
<h4>比較函式一定要說話算話</h4>
<p>排序演算法會假設你的比較函式前後一致，規格裡叫做 consistent comparator：</p>
<ul>
<li><b>對稱</b>：compare(a, b) 是負數，compare(b, a) 就要是正數。</li>
<li><b>遞移</b>：a 在 b 前面、b 在 c 前面，a 就要在 c 前面。</li>
<li><b>不變</b>：同樣兩個值，問幾次都給一樣的答案。</li>
</ul>
<p>違反了，規格就不保證結果，不同引擎可能排出不同順序。三個經典的違規寫法：</p>
<ul>
<li><code>(a, b) =&gt; a &gt; b</code>：回傳布林，<code>true</code> 被當成 1、<code>false</code> 被當成 0，永遠沒有負數。在 Node 22 上，<code>[3, 1, 2]</code> 用它排完還是 <code>[3, 1, 2]</code>，一動也沒動。好消息是 TypeScript 會擋：比較函式的型別要求回傳 <code>number</code>，布林過不了。</li>
<li><code>() =&gt; Math.random() - 0.5</code>：拿來洗牌。每次問的答案都不一樣，違反「不變」，洗出來的順序也不平均。洗牌要用 Fisher–Yates 演算法，練功題會寫一次。</li>
<li>資料裡有 <code>NaN</code>：<code>a - b</code> 碰到 NaN 就得到 NaN，排序器把它當成 0，「一樣大」的關係不再遞移，整串可能亂掉。先把 NaN 濾掉，或在比較函式裡另外處理。</li>
</ul>
<p>字串不要用減法，寫 <code>a.localeCompare(b)</code>，它會照語言規則排（中文、有重音符號的字母都算數）。要排很多字串時，先建一個 <code>new Intl.Collator('zh-TW')</code>，再把它的 <code>compare</code> 交給 sort，比每次比較都呼叫 localeCompare 快，MDN 也這樣建議。</p>
<h4>穩定性：一樣大的，誰在前面？</h4>
<p>排行榜依分數由高到低排，Ana 和 Mia 都是 9 分，誰在前面？從 ES2019 開始，規格要求 <code>sort</code> 必須是<b>穩定排序</b>（stable sort）：比較結果是 0 的兩項，排完之後保持排序前的先後。所以先加入的 Ana，一定還在 Mia 前面。</p>
<figure class="figure"><svg viewBox="0 0 560 252" class="fg" style="width:100%;max-width:560px" role="img" aria-label="排序前依加入順序是 Ana 9、Leo 7、Mia 9、Kai 7、Zoe 12，依分數排序後是 Zoe、Ana、Mia、Leo、Kai，同分的兩組都保持原本先後">
<text x="130" y="26" text-anchor="middle" class="fg-t">排序前（加入順序）</text>
<text x="430" y="26" text-anchor="middle" class="fg-t">依分數由高到低</text>
<rect x="60" y="44" width="140" height="28" rx="5" class="fg-b hot"/><text x="74" y="63" class="fg-t">Ana</text><text x="186" y="63" text-anchor="end" class="fg-t mono">9</text>
<rect x="60" y="82" width="140" height="28" rx="5" class="fg-b alt"/><text x="74" y="101" class="fg-t">Leo</text><text x="186" y="101" text-anchor="end" class="fg-t mono">7</text>
<rect x="60" y="120" width="140" height="28" rx="5" class="fg-b hot"/><text x="74" y="139" class="fg-t">Mia</text><text x="186" y="139" text-anchor="end" class="fg-t mono">9</text>
<rect x="60" y="158" width="140" height="28" rx="5" class="fg-b alt"/><text x="74" y="177" class="fg-t">Kai</text><text x="186" y="177" text-anchor="end" class="fg-t mono">7</text>
<rect x="60" y="196" width="140" height="28" rx="5" class="fg-b warm"/><text x="74" y="215" class="fg-t">Zoe</text><text x="186" y="215" text-anchor="end" class="fg-t mono">12</text>
<rect x="360" y="44" width="140" height="28" rx="5" class="fg-b warm"/><text x="374" y="63" class="fg-t">Zoe</text><text x="486" y="63" text-anchor="end" class="fg-t mono">12</text>
<rect x="360" y="82" width="140" height="28" rx="5" class="fg-b hot"/><text x="374" y="101" class="fg-t">Ana</text><text x="486" y="101" text-anchor="end" class="fg-t mono">9</text>
<rect x="360" y="120" width="140" height="28" rx="5" class="fg-b hot"/><text x="374" y="139" class="fg-t">Mia</text><text x="486" y="139" text-anchor="end" class="fg-t mono">9</text>
<rect x="360" y="158" width="140" height="28" rx="5" class="fg-b alt"/><text x="374" y="177" class="fg-t">Leo</text><text x="486" y="177" text-anchor="end" class="fg-t mono">7</text>
<rect x="360" y="196" width="140" height="28" rx="5" class="fg-b alt"/><text x="374" y="215" class="fg-t">Kai</text><text x="486" y="215" text-anchor="end" class="fg-t mono">7</text>
<line x1="200" y1="58" x2="360" y2="96" class="fg-l on"/>
<line x1="200" y1="134" x2="360" y2="134" class="fg-l on"/>
<line x1="200" y1="96" x2="360" y2="172" class="fg-l alt"/>
<line x1="200" y1="172" x2="360" y2="210" class="fg-l alt"/>
<line x1="200" y1="210" x2="360" y2="58" class="fg-l warm"/>
<text x="280" y="244" text-anchor="middle" class="fg-t sm">同分的 Ana 仍在 Mia 前面，Leo 仍在 Kai 前面</text>
</svg><figcaption>穩定排序只動「分數不同」的先後；分數相同的兩項，排完還是照原本的順序。</figcaption></figure>
<p>要「先依分數、分數一樣再依名字」排，寫一個兩層的比較函式就好：</p>
<pre><code>type Entry = { nick: string; score: number };
const board: Entry[] = [
  { nick: 'Mia', score: 9 }, { nick: 'Leo', score: 7 },
  { nick: 'Ana', score: 9 }, { nick: 'Kai', score: 7 }, { nick: 'Zoe', score: 12 },
];
const ranked = [...board].sort((a, b) =&gt;
  b.score - a.score ||              // 先比分數，由高到低
  a.nick.localeCompare(b.nick)      // 分數一樣（差是 0）才比名字
);
// Zoe 12、Ana 9、Mia 9、Kai 7、Leo 7</code></pre>
<p><code>||</code> 在這裡剛好好用：前面的差是 0 時，才會去算後面那一個。</p>
<h4>sort 到底比較幾次</h4>
<p>V8（Chrome 和 Node 的 JavaScript 引擎）從 2018 年起用 TimSort 實作 sort。它是 O(n log n)：排 1,000 項大約比較一萬次上下，排 10 萬項大約一百多萬次。資料原本就幾乎排好時，TimSort 會利用這一點，比較次數接近 n。</p>
<p>由此帶出一個專業上的細節：比較函式會被呼叫 n log n 次，裡面不要做重的事。如果每次比較都要先算出排序用的值（解析日期字串、轉換大小寫），就先每筆算一次存起來，排好再拿掉。這招叫「裝飾、排序、去裝飾」（decorate-sort-undecorate）：</p>
<pre><code>type Match = { id: number; playedAt: string };   // ISO 日期字串
declare const matches: Match[];
const newestFirst = matches
  .map(m =&gt; ({ m, t: Date.parse(m.playedAt) }))  // 每筆只解析一次：n 次
  .sort((a, b) =&gt; b.t - a.t)                     // 比較時只做減法
  .map(x =&gt; x.m);</code></pre>
<p>最後別忘了上一課的提醒：<code>sort</code> 會就地改掉原陣列。上面都先用 <code>[...board]</code> 或 map 做出新陣列再排。ES2023 的 <code>toSorted</code> 會直接回傳排好的新陣列，Node 20 以上和近年的瀏覽器都有；TypeScript 要把 <code>lib</code> 設到 ES2023 才認得它。</p>

<h3><span class="badge lv3">專業</span>六、不可變與結構共享：改一個欄位，要複製多少？</h3>
<p>「每次都做一個新的」聽起來很浪費：改一個玩家的勝場，難道要把整個遊戲狀態複製一份？不用。祕訣叫<b>結構共享</b>（structural sharing）：只複製「從根走到被改的那一格」路上的物件，其他沒動的部分，新舊兩份共用同一個。</p>
<pre><code>type Stats = { wins: number; losses: number };
type Player = { nick: string; stats: Stats };
type State = { round: number; players: Player[] };

function addWin(s: State, idx: number): State {
  return {
    ...s,                                  // 新的 state（round 照抄）
    players: s.players.map((p, i) =&gt;       // 新的 players 陣列
      i === idx
        ? { ...p, stats: { ...p.stats, wins: p.stats.wins + 1 } }  // 新玩家、新 stats
        : p),                              // 其他玩家原封不動，共用
  };
}

const before: State = {
  round: 7,
  players: [
    { nick: 'Mia', stats: { wins: 3, losses: 1 } },
    { nick: 'Leo', stats: { wins: 3, losses: 2 } },
    { nick: 'Ana', stats: { wins: 5, losses: 0 } },
  ],
};
const after = addWin(before, 1);
console.log(after === before);                         // false：有東西變了
console.log(after.players[0] === before.players[0]);   // true：Mia 共用
console.log(after.players[1] === before.players[1]);   // false：Leo 是新的
console.log(before.players[1].stats.wins);             // 3：舊的沒被動到</code></pre>
<figure class="figure"><svg viewBox="0 0 640 296" class="fg" style="width:100%;max-width:640px" role="img" aria-label="舊 players 和新 players 的第 0 格和第 2 格指向同一個 Mia 和 Ana，只有第 1 格指向各自的 Leo">
<rect x="30" y="20" width="150" height="34" rx="6" class="fg-b alt"/><text x="105" y="42" text-anchor="middle" class="fg-t">舊 state</text>
<rect x="460" y="20" width="150" height="34" rx="6" class="fg-b hot"/><text x="535" y="42" text-anchor="middle" class="fg-t">新 state</text>
<line x1="105" y1="54" x2="105" y2="76" class="fg-l"/><polygon points="105,84 100.5,76 109.5,76" class="fg-a"/>
<line x1="535" y1="54" x2="535" y2="76" class="fg-l on"/><polygon points="535,84 530.5,76 539.5,76" class="fg-a on"/>
<rect x="30" y="84" width="150" height="146" rx="8" class="fg-b alt"/>
<text x="105" y="101" text-anchor="middle" class="fg-t sm alt">舊 players[]</text>
<rect x="44" y="110" width="122" height="28" rx="4" class="fg-b"/><text x="56" y="129" class="fg-t sm mono">[0]</text>
<rect x="44" y="152" width="122" height="28" rx="4" class="fg-b"/><text x="56" y="171" class="fg-t sm mono">[1]</text>
<rect x="44" y="194" width="122" height="28" rx="4" class="fg-b"/><text x="56" y="213" class="fg-t sm mono">[2]</text>
<rect x="460" y="84" width="150" height="146" rx="8" class="fg-b hot"/>
<text x="535" y="101" text-anchor="middle" class="fg-t sm acc">新 players[]</text>
<rect x="474" y="110" width="122" height="28" rx="4" class="fg-b"/><text x="584" y="129" text-anchor="end" class="fg-t sm mono">[0]</text>
<rect x="474" y="152" width="122" height="28" rx="4" class="fg-b"/><text x="584" y="171" text-anchor="end" class="fg-t sm mono">[1]</text>
<rect x="474" y="194" width="122" height="28" rx="4" class="fg-b"/><text x="584" y="213" text-anchor="end" class="fg-t sm mono">[2]</text>
<rect x="250" y="110" width="140" height="28" rx="5" class="fg-b"/><text x="320" y="129" text-anchor="middle" class="fg-t">Mia（共用）</text>
<rect x="250" y="194" width="140" height="28" rx="5" class="fg-b"/><text x="320" y="213" text-anchor="middle" class="fg-t">Ana（共用）</text>
<rect x="186" y="146" width="100" height="40" rx="5" class="fg-b alt"/><text x="236" y="162" text-anchor="middle" class="fg-t">Leo（舊）</text><text x="236" y="179" text-anchor="middle" class="fg-t sm mono">wins 3</text>
<rect x="354" y="146" width="100" height="40" rx="5" class="fg-b hot"/><text x="404" y="162" text-anchor="middle" class="fg-t">Leo（新）</text><text x="404" y="179" text-anchor="middle" class="fg-t sm mono">wins 4</text>
<line x1="166" y1="124" x2="242" y2="124" class="fg-l alt"/><polygon points="250,124 242,119.5 242,128.5" class="fg-a alt"/>
<line x1="474" y1="124" x2="398" y2="124" class="fg-l on"/><polygon points="390,124 398,119.5 398,128.5" class="fg-a on"/>
<line x1="166" y1="166" x2="178" y2="166" class="fg-l alt"/><polygon points="186,166 178,161.5 178,170.5" class="fg-a alt"/>
<line x1="474" y1="166" x2="462" y2="166" class="fg-l on"/><polygon points="454,166 462,161.5 462,170.5" class="fg-a on"/>
<line x1="166" y1="208" x2="242" y2="208" class="fg-l alt"/><polygon points="250,208 242,203.5 242,212.5" class="fg-a alt"/>
<line x1="474" y1="208" x2="398" y2="208" class="fg-l on"/><polygon points="390,208 398,203.5 398,212.5" class="fg-a on"/>
<text x="320" y="258" text-anchor="middle" class="fg-t sm acc">新做的只有 4 個：state、players、Leo、Leo 的 stats</text>
<text x="320" y="280" text-anchor="middle" class="fg-t sm">Mia 和 Ana 沒有複製，新舊兩份指著同一個</text>
</svg><figcaption>結構共享：新的 players 陣列是新的，但它的第 0 格和第 2 格，跟舊陣列指著同一個玩家物件。被改的只有 Leo 那一條路。</figcaption></figure>
<p>算一下成本：一個新的 state、一個新的 players 陣列（3 格參考）、一個新的 Leo、一個新的 stats，共 4 個小物件。Mia 和 Ana 一個位元組都沒複製。就算有 1,000 位玩家，也只是 players 陣列要抄 1,000 個參考，仍然不複製任何玩家物件。成本跟「路徑有多長、路上每一層有多寬」成正比，跟整份資料有多大無關。</p>
<p>換來的好處是：任何一層，只要地址沒變，就保證裡面沒變。畫面框架可以用 <code>===</code> 一路往下比，地址一樣的整棵子樹直接跳過不看。復原（undo）功能也幾乎免費：把舊的 state 留著就好，它從來沒被改過。反過來，深層複製（例如 <code>structuredClone</code>）會讓每一層都換成新地址，這些比較就全部失效了。</p>
<h4>TypeScript 能幫你守住多少</h4>
<pre><code>type Stats = { readonly wins: number };
function best(xs: readonly number[], s: Stats): number {
  // xs.push(1);    ← 編譯不過：readonly 陣列沒有 push
  // xs.sort();     ← 編譯不過：sort 會改陣列，readonly 陣列沒有它
  // s.wins = 9;    ← 編譯不過：wins 是唯讀的
  return Math.max(...xs, s.wins);
}
const LEVELS = [1, 2, 3] as const;   // 型別是 readonly [1, 2, 3]
console.log(best(LEVELS, { wins: 2 }));   // 3</code></pre>
<p>要分清楚兩種「唯讀」：</p>
<ul>
<li><code>readonly</code>、<code>ReadonlyArray</code>、<code>as const</code> 只活在編譯時。編譯成 JavaScript 之後就不見了，執行時誰都改得動。它防的是你和同事寫錯，不是防執行時的意外。</li>
<li><code>Object.freeze</code> 是執行時真的鎖住，但只鎖一層：凍住的物件裡如果還有物件，那個物件照樣能改。凍住之後再改它，在嚴格模式下（模組和 class 裡永遠是嚴格模式）會丟出 TypeError，不是安靜地失敗。</li>
</ul>
<h4>在 Vue 裡怎麼選</h4>
<p>Vue 3 的 <code>ref</code> 和 <code>reactive</code> 會把物件深層包成 proxy，就地修改也能觸發更新，所以 Vue 不逼你不可變。但資料很大時（幾萬筆的表格、遊戲的地圖資料），深層 proxy 本身就有成本：每一層第一次被讀到都要包一次，每次讀寫都要經過攔截。這時可以改用 <code>shallowRef</code>：Vue 只看 <code>.value</code> 有沒有被換掉，不會深入裡面。搭配結構共享，每次「換掉整個值」就觸發一次更新，裡面的資料保持原本的普通物件。</p>

<h3><span class="badge lv3">專業</span>七、reduce 的型別怎麼寫才對</h3>
<p>reduce 是 TypeScript 新手最常跟型別檢查器吵架的地方，原因在它的型別定義。TypeScript 內建的 lib 裡，reduce 有三個<b>多載</b>（overload），帶起始值的最常用：</p>
<pre><code>// lib.es5.d.ts 裡的那一個多載（簡化參數名稱）
interface Array&lt;T&gt; {
  reduce&lt;U&gt;(cb: (acc: U, item: T, i: number, arr: T[]) =&gt; U, initial: U): U;
}</code></pre>
<p>重點是：<b>U 是從起始值推斷出來的</b>。你給什麼起始值，TypeScript 就認定箱子永遠是那個型別。兩個最經典的錯：</p>
<pre><code>type Guess = 'higher' | 'lower';
type Round = { card: number; guess: Guess };
declare const rounds: Round[];

// 錯一：起始值是 {}，U 就是 {}，不能拿數字當索引
// const count = rounds.reduce((acc, r) =&gt; {
//   acc[r.card] = (acc[r.card] ?? 0) + 1;
//   return acc;
// }, {});

// 錯二：起始值裡的空陣列被推斷成 never[]，什麼都 push 不進去
// const byGuess = rounds.reduce((acc, r) =&gt; {
//   acc[r.guess].push(r);
//   return acc;
// }, { higher: [], lower: [] });

// 對：直接告訴 reduce，U 是什麼
const count = rounds.reduce&lt;Record&lt;number, number&gt;&gt;((acc, r) =&gt; {
  acc[r.card] = (acc[r.card] ?? 0) + 1;
  return acc;
}, {});
const byGuess = rounds.reduce&lt;Record&lt;Guess, Round[]&gt;&gt;((acc, r) =&gt; {
  acc[r.guess].push(r);
  return acc;
}, { higher: [], lower: [] });</code></pre>
<p>錯一的訊息是「Element implicitly has an 'any' type because expression of type 'number' can't be used to index type '{}'」；錯二是「Argument of type 'Round' is not assignable to parameter of type 'never'」。看到這兩句，就知道是起始值的型別太窄。修法有三種，由好到壞：</p>
<ol>
<li>在 reduce 後面加型別參數，像上面的 <code>reduce&lt;Record&lt;Guess, Round[]&gt;&gt;</code>。TypeScript 會反過來檢查起始值合不合格，最安全。</li>
<li>先宣告一個有型別的變數當起始值：<code>const init: Record&lt;Guess, Round[]&gt; = { higher: [], lower: [] }</code>。一樣安全，只是多一行。</li>
<li>寫 <code>{} as Record&lt;number, number&gt;</code>。能編譯，但 <code>as</code> 的意思是「相信我」：如果你要的型別有必填欄位，起始值少給了，TypeScript 也不會出聲。</li>
</ol>
<h4>不給起始值的那個多載</h4>
<p>另一個多載是 <code>reduce(cb: (acc: T, item: T) =&gt; T): T</code>：沒有起始值，拿第一項當起始。它有兩個問題：箱子的型別被綁死成跟項目一樣；空陣列會在執行時丟出 TypeError（Reduce of empty array with no initial value），而型別檢查完全不會提醒你，因為「陣列是不是空的」不在型別裡。所以上一課才說：永遠給起始值。</p>
<h4>reduce 裡的展開：偷渡進來的 O(n²)</h4>
<pre><code>declare const ids: string[];
// 每一圈都把整個累加物件複製一次：第 k 圈複製 k 個鍵，總共約 n² ÷ 2
const slowIndex = ids.reduce&lt;Record&lt;string, number&gt;&gt;(
  (acc, id, i) =&gt; ({ ...acc, [id]: i }), {});
// 直接寫進累加值：O(n)
const fastIndex = ids.reduce&lt;Record&lt;string, number&gt;&gt;(
  (acc, id, i) =&gt; { acc[id] = i; return acc; }, {});</code></pre>
<p>不可變的目的，是不要改到「別人也拿著」的東西。reduce 的累加值是你在起始值那裡剛建的，整個過程只有你拿著，就地改它不會嚇到任何人。為了形式上的不可變把 O(n) 寫成 O(n²)，是很常見、也很冤枉的效能問題：一萬個 id，每圈都展開，總共要複製約五千萬個鍵。</p>
<p>另外，如果只是要分組，ES2024 有現成的 <code>Object.groupBy(rounds, r =&gt; r.guess)</code> 和 <code>Map.groupBy</code>。它們比較新，要確認執行環境支援，TypeScript 的 <code>lib</code> 也要設到 ES2024。</p>

<h3><span class="badge lv4">專家</span>八、遊戲迴圈裡的陣列：配置、垃圾回收與掉格</h3>
<p>網頁介面的程式，一個 filter 多建一個陣列，沒有人在乎。遊戲不一樣。60 FPS 代表每一格畫面只有 16.7 毫秒，你的 <code>update</code>、物理、動畫、渲染都要擠進去，而 <code>update</code> 每秒被呼叫 60 次。</p>
<h4>新陣列要付兩次錢</h4>
<p>每建一個陣列或物件，引擎要付兩筆帳：現在<b>配置</b>（allocation）記憶體，以後再把它收回來。JavaScript 的記憶體由<b>垃圾回收器</b>（garbage collector，GC）自動回收：它會在某些時間點暫停你的程式，找出哪些物件已經沒有人指著，把空間收回來。V8 把物件分成兩區：</p>
<ul>
<li><b>新生代</b>（young generation）：新建的物件都先放這裡。這一區小，滿了就做一次<b>小回收</b>（minor GC，V8 叫 Scavenge），只看這一區，把還活著的搬走。大部分臨時物件早就死了，所以很快。</li>
<li><b>老生代</b>（old generation）：撐過一兩次小回收的物件會被搬到這裡。這一區大，要靠<b>大回收</b>（major GC，標記與整理 mark-compact）。V8 把大部分工作放到背景執行緒做，但仍然有停頓，而且堆積越大，停得越久。</li>
</ul>
<h4>實際量一次</h4>
<p>模擬一個遊戲：1,000 隻敵人，每一格都要找出活著的那些。跑 3,600 格（60 FPS 下的一分鐘），用 <code>node --trace-gc</code> 數垃圾回收的次數。同一台 M1、Node 22，數字只看數量級：</p>
<table>
<tr><th>每一格的寫法</th><th>一分鐘內的小回收</th><th>總工作時間</th></tr>
<tr><td><code>filter</code> 再 <code>map</code> 成新的座標物件</td><td>90 次</td><td>約 79 ms</td></tr>
<tr><td>同一個陣列先 <code>out.length = 0</code>，再 <code>push</code></td><td>100 次</td><td>約 23 ms</td></tr>
<tr><td>預先配置好的陣列，加一個寫入位置的計數</td><td>0 次</td><td>約 10 ms</td></tr>
</table>
<p>三個觀察：</p>
<ol>
<li>第一列每一格大約建 1,000 個小物件和兩個陣列，一分鐘就是幾百萬個物件。桌機上每次小回收只要零點幾毫秒，這個例子還不會卡。可是手機的 CPU 慢好幾倍，而你的遊戲裡不只這一個地方在配置。</li>
<li>第二列很意外：在 V8 上，<code>out.length = 0</code> 會把底下的儲存空間（backing store）一起丟掉（我用 <code>%DebugPrint</code> 看過，容量直接變成 0），之後的 <code>push</code> 又得重新配置、一路長大。想重複使用陣列，就自己記「寫到第幾格」，不要靠清空長度。</li>
<li>完全不配置的寫法，不只沒有 GC，連工作時間都最少。配置本身就是工作。</li>
</ol>
<p>真實的遊戲還有更糟的情況：物件活得夠久、被搬進老生代之後才死，或是堆積一邊玩一邊長大，最後就會遇上大回收。大回收的停頓可能吃掉好幾毫秒，剛好落在某一格上，那一格就畫不完。</p>
<figure class="figure"><svg viewBox="0 0 640 210" class="fg" style="width:100%;max-width:640px" role="img" aria-label="影格時間軸：每格 16.7 毫秒，第 3 格的 update 之後插進一段垃圾回收，渲染趕不上下一次 vsync，畫面重複顯示上一格">
<rect x="40" y="12" width="14" height="12" rx="2" class="fg-b alt"/><text x="60" y="23" class="fg-t sm">你的 update</text>
<rect x="150" y="12" width="14" height="12" rx="2" class="fg-b hot"/><text x="170" y="23" class="fg-t sm">渲染</text>
<rect x="230" y="12" width="14" height="12" rx="2" class="fg-b warm"/><text x="250" y="23" class="fg-t sm">垃圾回收</text>
<line x1="40" y1="40" x2="40" y2="112" class="fg-l dim dash"/>
<line x1="150" y1="40" x2="150" y2="112" class="fg-l dim dash"/>
<line x1="260" y1="40" x2="260" y2="112" class="fg-l dim dash"/>
<line x1="370" y1="40" x2="370" y2="112" class="fg-l warm dash"/>
<line x1="480" y1="40" x2="480" y2="112" class="fg-l dim dash"/>
<line x1="590" y1="40" x2="590" y2="112" class="fg-l dim dash"/>
<rect x="42" y="50" width="54" height="34" rx="4" class="fg-b alt"/><text x="69" y="71" text-anchor="middle" class="fg-t sm">update</text>
<rect x="98" y="50" width="36" height="34" rx="4" class="fg-b hot"/><text x="116" y="71" text-anchor="middle" class="fg-t sm">渲染</text>
<rect x="152" y="50" width="54" height="34" rx="4" class="fg-b alt"/><text x="179" y="71" text-anchor="middle" class="fg-t sm">update</text>
<rect x="208" y="50" width="36" height="34" rx="4" class="fg-b hot"/><text x="226" y="71" text-anchor="middle" class="fg-t sm">渲染</text>
<rect x="262" y="50" width="54" height="34" rx="4" class="fg-b alt"/><text x="289" y="71" text-anchor="middle" class="fg-t sm">update</text>
<rect x="318" y="50" width="66" height="34" rx="4" class="fg-b warm"/><text x="351" y="71" text-anchor="middle" class="fg-t sm">GC</text>
<rect x="386" y="50" width="36" height="34" rx="4" class="fg-b hot"/><text x="404" y="71" text-anchor="middle" class="fg-t sm">渲染</text>
<rect x="482" y="50" width="54" height="34" rx="4" class="fg-b alt"/><text x="509" y="71" text-anchor="middle" class="fg-t sm">update</text>
<rect x="538" y="50" width="36" height="34" rx="4" class="fg-b hot"/><text x="556" y="71" text-anchor="middle" class="fg-t sm">渲染</text>
<text x="95" y="104" text-anchor="middle" class="fg-t sm">第 1 格</text>
<text x="205" y="104" text-anchor="middle" class="fg-t sm">第 2 格</text>
<text x="315" y="104" text-anchor="middle" class="fg-t sm">第 3 格</text>
<text x="535" y="104" text-anchor="middle" class="fg-t sm">下一格</text>
<text x="370" y="130" text-anchor="middle" class="fg-t sm warm">這次 vsync 沒有新畫面</text>
<line x1="40" y1="146" x2="592" y2="146" class="fg-l"/><polygon points="600,146 592,141.5 592,150.5" class="fg-a"/>
<text x="40" y="164" text-anchor="middle" class="fg-t sm">0</text>
<text x="150" y="164" text-anchor="middle" class="fg-t sm">16.7</text>
<text x="260" y="164" text-anchor="middle" class="fg-t sm">33.3</text>
<text x="370" y="164" text-anchor="middle" class="fg-t sm">50.0</text>
<text x="480" y="164" text-anchor="middle" class="fg-t sm">66.7</text>
<text x="590" y="164" text-anchor="middle" class="fg-t sm">83.3 ms</text>
<text x="320" y="196" text-anchor="middle" class="fg-t sm">每格預算 16.7 ms；GC 剛好落在第 3 格，螢幕只好再顯示一次上一格</text>
</svg><figcaption>掉格不是因為你的程式變慢，而是 GC 選在某一格裡停下來。螢幕每 16.7 毫秒來拿一次畫面，那一次沒拿到新的，玩家就看到一頓。</figcaption></figure>
<p>這種卡頓的特徵是「規律地、偶爾地」頓一下，跟玩家做什麼無關。在 Chrome DevTools 的 Performance 面板錄一段，主執行緒上會看到 Minor GC 或 Major GC 的區塊，正好落在掉格的地方。Memory 面板的配置取樣（allocation sampling）則能告訴你，是哪一行程式在大量配置。</p>
<h4>遊戲程式裡的四個習慣</h4>
<pre><code>type Enemy = { x: number; y: number; alive: boolean };

// 1. 就地壓縮：留下活著的，不建新陣列
function compactAlive(list: Enemy[]): void {
  let w = 0;
  for (let r = 0; r &lt; list.length; r++) {
    const e = list[r];
    if (e.alive) list[w++] = e;
  }
  list.length = w;   // 砍掉尾巴
}

// 2. 順序不重要時的 O(1) 刪除：拿最後一個補洞
function removeAt&lt;T&gt;(list: T[], i: number): void {
  list[i] = list[list.length - 1];
  list.pop();
}

// 3. 物件池：死掉的不丟，下次重用
class Pool&lt;T&gt; {
  private free: T[] = [];
  constructor(private make: () =&gt; T, private reset: (x: T) =&gt; void) {}
  get(): T { return this.free.pop() ?? this.make(); }
  release(x: T): void { this.reset(x); this.free.push(x); }
}

// 4. 大量數字用型別化陣列：一整塊連續記憶體，不是 1,000 個小物件
const xs = new Float32Array(1000);
const ys = new Float32Array(1000);</code></pre>
<ol>
<li><b>就地壓縮</b>：跟 filter 一樣是 O(n)，但不建新陣列。代價是它會改掉原陣列，所以只用在「這個陣列只有這個系統拿著」的地方。</li>
<li><b>補洞刪除</b>：<code>splice(i, 1)</code> 要把 i 後面的每一項往前搬一格，是 O(n)；在迴圈裡邊走邊 splice，就變成 O(n²)。順序不重要時（敵人清單通常不重要），拿最後一項補進去，O(1)。</li>
<li><b>物件池</b>（object pool）：子彈、特效、傷害飄字這些「一直生、一直死」的東西最適合。Cocos Creator 內建的 <code>NodePool</code>，就是這個想法套在節點上。</li>
<li><b>型別化陣列</b>（typed array）：<code>Float32Array</code> 每一格就是 4 個位元組的數字，沒有物件、沒有參考，GC 幾乎不必看它。粒子系統、物理常常這樣排資料。</li>
</ol>
<p>數學物件也是同一個道理。Cocos 的 <code>Vec3</code> 有靜態方法 <code>Vec3.add(out, a, b)</code>，結果寫進你給的 <code>out</code>。在元件上留一個暫存用的 <code>Vec3</code> 重複使用，就不必每一格都 <code>new Vec3()</code>。</p>
<h4>引擎內部：元素種類（elements kinds）</h4>
<p>V8 會偷偷記錄每個陣列裡放的是什麼，叫做<b>元素種類</b>：全是小整數（SMI）、全是浮點數（DOUBLE）、什麼都有（一般的 ELEMENTS），再各自分成沒有洞（PACKED）和有洞（HOLEY）。越具體的種類，引擎能用越快的機器碼。兩條規則：</p>
<ul>
<li>種類只會往「比較一般」的方向轉，不會轉回來。整數陣列放進一個 <code>1.5</code>，就變成浮點陣列；再放進一個字串，就變成一般陣列。之後把字串拿掉，它也不會變回去。</li>
<li><code>new Array(5).fill(0)</code> 建出來的是有洞的種類（HOLEY_SMI），就算每一格都填滿了，也一直標成 HOLEY；用 <code>push</code> 從空陣列長起來，或用 <code>Array.from({ length: 5 }, () =&gt; 0)</code>，在 Node 22 上得到的是 PACKED_SMI。讀有洞的陣列時，引擎得多檢查「這格是不是洞、要不要去原型鏈上找」。</li>
</ul>
<p>這些差異在一般程式裡通常小到量不出來，只有在每格跑很多次的熱迴圈裡才可能看得到。原則很簡單：同一個陣列只放同一種東西，不要留洞。TypeScript 的 <code>number[]</code> 本來就會擋住你放字串，算是順便幫了引擎一把。</p>

<h3>九、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>map、forEach 比 for 迴圈慢很多，全部要改回 for</td><td>現代引擎會把熱門的 callback 內聯（inline），大部分程式裡差距可以忽略。真正的成本常在「每次都建新陣列」，而不是呼叫函式。熱迴圈要先量再改。</td></tr>
<tr><td>不可變就是每次都把整份資料深層複製</td><td>只複製被改的那條路徑，其他部分新舊共用（結構共享）。深層複製反而讓所有地址都換掉，<code>===</code> 比較全部失效。</td></tr>
<tr><td><code>const</code> 陣列不能改</td><td>const 鎖的是變數裡的參考；內容照樣能 push、sort。要唯讀，用 readonly 型別（編譯時）或 Object.freeze（執行時、只有一層）。</td></tr>
<tr><td>forEach 裡寫 return 可以跳出迴圈</td><td>return 只結束這一次 callback，下一項照跑。要提早停，用 for...of 加 break，或改用 some、find。</td></tr>
<tr><td>sort 不給比較函式就是由小到大</td><td>預設會把每一項轉成字串再比，<code>[10, 9, 1].sort()</code> 得到 <code>[1, 10, 9]</code>；undefined 一律排到最後。</td></tr>
<tr><td>filter 會複製物件</td><td>只複製參考。結果陣列裡的物件跟原陣列是同一批，改其中一個，兩邊都看得到。</td></tr>
<tr><td>Map 跟物件一樣，只是寫法不同</td><td>Map 的鍵可以是任何值（物件當鍵時比地址）、有 size、照放進去的順序走訪，頻繁增刪時通常也比較快；物件的鍵只能是字串或 Symbol，數字鍵會被轉成字串。</td></tr>
</table>

<h3>十、跟你的工作連起來</h3>
<ul>
<li><b>Vue</b>：computed 裡要排序，先複製再排，否則會改到來源 ref。computed 的 callback 裡如果有「map 裡放 find」，每次依賴一變就重跑一次 O(n²)，清單一長就會在輸入時卡頓；把查詢表做成另一個 computed 的 Map。幾萬筆的唯讀資料，用 <code>shallowRef</code> 加「換掉整份」的寫法。</li>
<li><b>Node.js 後端</b>：把兩個查詢結果接起來（例如訂單配使用者）時，先建 Map。這種 O(n²) 不會出現在資料庫的慢查詢紀錄裡，它躲在你的程式裡，只會讓 API 的回應時間隨資料量一起變長。</li>
<li><b>遊戲（Cocos、Unity）</b>：<code>update</code> 裡不配置，用物件池、就地壓縮、暫存向量。Unity 的 C# 一樣有 GC，在 Update 裡用 LINQ 或每格 new 物件，會遇到一模一樣的掉格。</li>
<li><b>Go</b>：對照一下會更清楚。Go 的 <code>s = s[:0]</code> 會保留底下的陣列容量，正好適合重複使用；JavaScript 在 V8 上的 <code>arr.length = 0</code> 卻會把容量丟掉。同樣的意圖，在不同語言裡要用不同的寫法。</li>
</ul>

<h3>十一、面試會怎麼問</h3>
<p>下面是前端、後端、遊戲工程師面試裡真的會出現的題目。先自己講一遍（最好出聲講），再打開參考答案。</p>
<ol>
<li>「不用內建方法，實作 map。真正的 Array.prototype.map 跟你寫的有什麼差別？」</li>
<li>「這段程式在資料量大時很慢：<code>orders.map(o =&gt; users.find(u =&gt; u.id === o.userId))</code>。為什麼？怎麼改？複雜度從多少變成多少？」</li>
<li>「JavaScript 的 sort 穩定嗎？比較函式要遵守什麼規則？為什麼 <code>[10, 9, 1].sort()</code> 是 <code>[1, 10, 9]</code>？」</li>
<li>「淺層複製和深層複製差在哪？什麼是結構共享？為什麼前端框架喜歡不可變的資料？」</li>
<li>「reduce 的起始值寫成 <code>{}</code>，TypeScript 報錯，你會怎麼修？」</li>
<li>「遊戲每隔幾秒就頓一下，你懷疑是 GC。怎麼確認？怎麼改？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>建一個空陣列，用 for 迴圈對每一項呼叫 callback（傳入項目和索引），把回傳值 push 進去，最後回傳新陣列；型別寫成 <code>&lt;T, U&gt;(arr: readonly T[], fn: (x: T, i: number) =&gt; U) =&gt; U[]</code>。真正的 map 還會傳第三個參數（整個陣列）、支援 thisArg、在開始時就讀好長度（callback 裡 push 的新項目不會被走到），並且跳過稀疏陣列的洞，結果保留同樣的洞。</li>
<li>map 走過每筆訂單，每筆又用 find 掃過使用者陣列，是 O(訂單數 × 使用者數)。1 萬筆訂單、1 千位使用者，大約 500 萬次比較。改法是先 <code>new Map(users.map(u =&gt; [u.id, u]))</code>，再在 map 裡用 <code>get</code>，變成 O(訂單數 + 使用者數)。要補一句：找不到時 get 回傳 undefined，型別上要處理。</li>
<li>從 ES2019 起規格要求穩定，V8 用 TimSort。比較函式要回傳數字（負、零、正），而且要一致：對稱、遞移、同樣輸入同樣答案；否則結果不保證。不給比較函式時，預設把每一項轉成字串、照 UTF-16 碼位排，所以 "1" &lt; "10" &lt; "9"。數字要寫 <code>(a, b) =&gt; a - b</code>。</li>
<li>淺層複製只建一個新的外層，裡面的物件和陣列仍是共用的參考；深層複製把每一層都重建。結構共享是指更新時只複製從根到被改節點的那條路徑，其餘共用。框架喜歡它，因為「地址沒變就代表沒變」，可以用 <code>===</code> 快速判斷哪裡要重新渲染、哪裡可以跳過，也讓復原、時光旅行除錯變得簡單。</li>
<li>原因是 reduce 的型別參數 U 從起始值推斷，<code>{}</code> 讓累加值的型別變成空物件。最好的修法是明確寫型別參數，例如 <code>reduce&lt;Record&lt;string, number&gt;&gt;(…, {})</code>；也可以先宣告一個有型別的起始變數。<code>{} as …</code> 能過，但會關掉檢查，不建議。</li>
<li>先用 DevTools 的 Performance 面板錄一段，看掉格處是不是 Minor GC 或 Major GC；再用 Memory 面板的配置取樣找出配置最多的程式。改法：熱路徑上不建臨時陣列和物件（避免每格 filter、map、展開、new 向量），改用就地壓縮、補洞刪除、物件池、暫存物件和型別化陣列。改完再錄一次，確認 GC 次數真的下降。</li>
</ol>
</details>

<h3>十二、練功題（做得出來才算真的懂）</h3>
<ol>
<li>實作 <code>myFind</code> 和 <code>mySome</code>，加上 TypeScript 型別，而且要會提早停。</li>
<li>寫一個不改原陣列的洗牌函式 <code>shuffled</code>（Fisher–Yates）。再用自己的話說明，為什麼 <code>sort(() =&gt; Math.random() - 0.5)</code> 不能拿來洗牌。</li>
<li><code>a.filter(x =&gt; b.includes(x))</code>，a 和 b 各有 2 萬個字串，而且大多數不重複。估計大約要比較幾次，然後改寫成 O(n)。</li>
<li>寫 <code>chunk&lt;T&gt;(arr: readonly T[], size: number): T[][]</code>，把陣列切成每 size 個一組，例如 <code>chunk([1, 2, 3, 4, 5], 2)</code> 得到 <code>[[1, 2], [3, 4], [5]]</code>。</li>
<li>沿用第六節的 <code>State</code>，寫 <code>addLoss(s, nick)</code>：把指定暱稱的玩家 losses 加 1，其他全部共用。說出呼叫之後，哪幾個物件是新的。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>碰到第一個符合的就 return，就是「提早停」：
<pre><code>function myFind&lt;T&gt;(
  arr: readonly T[], test: (x: T, i: number) =&gt; boolean,
): T | undefined {
  for (let i = 0; i &lt; arr.length; i++) if (test(arr[i], i)) return arr[i];
  return undefined;
}
function mySome&lt;T&gt;(
  arr: readonly T[], test: (x: T, i: number) =&gt; boolean,
): boolean {
  for (let i = 0; i &lt; arr.length; i++) if (test(arr[i], i)) return true;
  return false;
}</code></pre></li>
<li>從最後一格往前，每一格跟「它自己或它前面隨機一格」交換。每一種排列出現的機率都一樣：
<pre><code>function shuffled&lt;T&gt;(src: readonly T[]): T[] {
  const a = [...src];
  for (let i = a.length - 1; i &gt; 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));   // 0 到 i
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}</code></pre>
用隨機比較函式洗牌，違反了「同樣兩個值要給一樣答案」，排序演算法的前提被破壞，結果的分布不平均（某些位置的牌特別容易留在原地附近），而且不同引擎的偏差還不一樣。另外，如果是牽涉輸贏的正式遊戲，亂數要改用 <code>crypto.getRandomValues</code>，<code>Math.random</code> 不是為了安全設計的。</li>
<li>大多數不重複時，includes 每次幾乎都要掃完 b，約 2 萬 × 2 萬 = 4 億次比較。改寫：<code>const inB = new Set(b); const both = a.filter(x =&gt; inB.has(x));</code>，建 Set 2 萬次、查詢 2 萬次，約 4 萬次操作。</li>
<li>每次跳 size 格，用 slice 切出一段：
<pre><code>function chunk&lt;T&gt;(arr: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i &lt; arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}</code></pre>
slice 超過結尾時會自動停在最後，所以最後一組可以比較短。size 小於 1 時這個迴圈不會前進，正式程式要先檢查。</li>
<li>只有找到的那位玩家要換新：
<pre><code>type Stats = { wins: number; losses: number };
type Player = { nick: string; stats: Stats };
type State = { round: number; players: Player[] };
function addLoss(s: State, nick: string): State {
  return {
    ...s,
    players: s.players.map(p =&gt;
      p.nick === nick
        ? { ...p, stats: { ...p.stats, losses: p.stats.losses + 1 } }
        : p),
  };
}</code></pre>
新的物件有：新的 state、新的 players 陣列、那位玩家的新物件、他的新 stats，共 4 個。其他玩家物件、round 的值都和舊的共用。如果沒有任何玩家叫這個名字，仍然會產生新的 state 和新的 players 陣列；要更講究，可以先檢查有沒有找到，沒找到就直接回傳 <code>s</code>，讓「地址沒變就代表沒變」繼續成立。</li>
</ol>
</details>

<h3>十三、想再挖深</h3>
<ul>
<li><b>MDN 的 Array 參考文件</b>（developer.mozilla.org）：每個方法都寫明會不會改原陣列、參數細節和瀏覽器支援表。遇到不確定的方法，先查這裡。</li>
<li><b>ECMAScript 規格</b>（tc39.es/ecma262）的 Array.prototype.sort 與 Array.prototype.map 兩節：「consistent comparator」的正式定義、洞怎麼處理，都寫在裡面。讀規格是從進階走到專家的分水嶺。</li>
<li><b>V8 官方部落格</b>（v8.dev/blog）的「Elements kinds in V8」和「Getting things sorted in V8」：前者講元素種類，後者講 V8 為什麼改用 TimSort。</li>
<li><b>Robert Nystrom《Game Programming Patterns》</b>（gameprogrammingpatterns.com 有免費線上版）：Object Pool 和 Data Locality 兩章，講的就是第八節的事，例子是 C++，道理完全通用。</li>
<li><b>Aditya Bhargava《Grokking Algorithms》</b>：用大量手繪圖解釋大 O、雜湊表和排序，沒有資工背景也讀得下去。</li>
</ul>
` });
