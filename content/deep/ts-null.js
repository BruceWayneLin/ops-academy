DEEP({ 'ts-null': `
<p>上一課給了你一個工具箱：<code>if</code> 檢查、<code>?.</code>、<code>??</code>、<code>!</code>。這一章往下挖：「沒有值」這件事為什麼會存在、為什麼 JavaScript 偏偏有兩個；檢查器是怎麼一行一行追蹤「這裡的值還可不可能不見」；<code>?.</code> 和 <code>??</code> 編譯成舊版 JavaScript 後長什麼樣子；<code>!</code> 什麼時候是合理的承諾、什麼時候是埋好的地雷。最後換個角度：與其到處檢查 null，不如一開始就把 API 設計成不需要 null。</p>

<h3><span class="badge lv1">基礎</span>一、兩種「沒有」從哪裡來：一個十億美元的錯誤</h3>
<p>1965 年，Tony Hoare 在設計 ALGOL W 語言時，加入了<b>空參考</b>（null reference）：一個「什麼都沒指到」的參考。理由很務實，實作起來很簡單。四十多年後的 2009 年，他在一場演講裡公開道歉，把它叫做「我那個十億美元的錯誤」（billion-dollar mistake），因為之後幾十年，無數的當機、漏洞和資安問題，都是程式碼在一個「以為有東西、其實是空的」參考上做事。</p>
<p>問題的核心是：在大部分語言裡，<code>null</code> 可以出現在任何物件型別的位置。宣告「這是一張牌」的變數，實際上的意思是「這是一張牌，或者什麼都沒有」，而型別系統不會提醒你後面那一半。</p>
<h4>JavaScript 為什麼有兩個</h4>
<p>JavaScript 在 1995 年誕生時，從 Java 那邊借了 <code>null</code>，又另外做了 <code>&#117;ndefined</code>，給「變數宣告了但還沒給值」「屬性根本不存在」這類情況用。上一課的比喻很好用：<code>&#117;ndefined</code> 是表格上沒人填的欄位，<code>null</code> 是有人刻意寫了「無」。兩個值還留下了一些歷史痕跡：</p>
<pre><code>console.log(typeof &#117;ndefined);    // '&#117;ndefined'
console.log(typeof null);         // 'object'：歷史 bug
console.log(null == &#117;ndefined);   // true：寬鬆比較視為相等
console.log(null === &#117;ndefined);  // false：嚴格比較不相等
const json = JSON.stringify({ a: &#117;ndefined, b: null });
console.log(json);                // {"b":null}</code></pre>
<ul>
<li><b><code>typeof null</code> 是 <code>'object'</code></b>：最早的實作裡，每個值帶一個小小的型別標記，物件的標記是 0，而 <code>null</code> 用的是全部為 0 的空指標，於是被當成物件。後來有人提案修正，但會弄壞太多既有的網站，被否決了。所以檢查「是不是物件」時，永遠要多寫一句 <code>x !== null</code>。</li>
<li><b>JSON 只認得 <code>null</code></b>：JSON 格式裡沒有 <code>&#117;ndefined</code>。<code>JSON.stringify</code> 遇到值是 <code>&#117;ndefined</code> 的屬性會直接把整個屬性拿掉，在陣列裡則會變成 <code>null</code>。所以前端送 <code>{ name: &#117;ndefined }</code> 給後端，後端收到的是一個沒有 <code>name</code> 的物件；這在「清空欄位」和「不要改這個欄位」之間，是完全不同的兩件事。</li>
<li><b>編譯出來的程式碼常寫 <code>void 0</code></b>：<code>void</code> 運算子不管後面是什麼，結果都是 <code>&#117;ndefined</code>。很久以前的 JavaScript 可以把全域的 <code>&#117;ndefined</code> 改掉，現在仍然可以宣告一個叫 <code>&#117;ndefined</code> 的區域變數，所以編譯器寫 <code>void 0</code> 最保險，而且字比較少。第四節會看到它大量出現。</li>
</ul>

<h3><span class="badge lv1">基礎</span>二、strictNullChecks：把 null 從每個盒子裡拿出來</h3>
<p>TypeScript 一開始也跟大部分語言一樣：<code>null</code> 和 <code>&#117;ndefined</code> 可以放進任何型別。2016 年的 TypeScript 2.0 加入了 <code>strictNullChecks</code>，做的事情用一張圖就講得完：</p>
<figure class="figure"><svg viewBox="0 0 660 260" class="fg" style="width:100%;max-width:660px" role="img" aria-label="左邊：關掉 strictNullChecks 時，string、number、Card 每個型別裡都偷偷包含 null 和 &#117;ndefined；右邊：打開之後，null 和 &#117;ndefined 是獨立的型別，要用聯集寫出來才會被收下">
<text x="160" y="24" text-anchor="middle" class="fg-t lg">關掉 strictNullChecks</text>
<rect x="30" y="44" width="260" height="50" rx="6" class="fg-b"/><text x="44" y="74" class="fg-t mono">string</text>
<rect x="150" y="57" width="50" height="24" rx="4" class="fg-b warm"/><text x="175" y="73" text-anchor="middle" class="fg-t sm mono">null</text>
<rect x="206" y="57" width="76" height="24" rx="4" class="fg-b warm"/><text x="244" y="73" text-anchor="middle" class="fg-t sm mono">&#117;ndefined</text>
<rect x="30" y="108" width="260" height="50" rx="6" class="fg-b"/><text x="44" y="138" class="fg-t mono">number</text>
<rect x="150" y="121" width="50" height="24" rx="4" class="fg-b warm"/><text x="175" y="137" text-anchor="middle" class="fg-t sm mono">null</text>
<rect x="206" y="121" width="76" height="24" rx="4" class="fg-b warm"/><text x="244" y="137" text-anchor="middle" class="fg-t sm mono">&#117;ndefined</text>
<rect x="30" y="172" width="260" height="50" rx="6" class="fg-b"/><text x="44" y="202" class="fg-t mono">Card</text>
<rect x="150" y="185" width="50" height="24" rx="4" class="fg-b warm"/><text x="175" y="201" text-anchor="middle" class="fg-t sm mono">null</text>
<rect x="206" y="185" width="76" height="24" rx="4" class="fg-b warm"/><text x="244" y="201" text-anchor="middle" class="fg-t sm mono">&#117;ndefined</text>
<text x="160" y="246" text-anchor="middle" class="fg-t sm warm">每個盒子都偷偷收空值，檢查器不吭聲</text>
<text x="505" y="24" text-anchor="middle" class="fg-t lg">打開之後</text>
<rect x="362" y="40" width="286" height="56" rx="8" class="fg-b hot"/>
<rect x="370" y="48" width="150" height="40" rx="6" class="fg-b"/><text x="445" y="73" text-anchor="middle" class="fg-t mono">string</text>
<rect x="536" y="48" width="104" height="40" rx="6" class="fg-b warm"/><text x="588" y="73" text-anchor="middle" class="fg-t mono">null</text>
<rect x="370" y="108" width="150" height="40" rx="6" class="fg-b"/><text x="445" y="133" text-anchor="middle" class="fg-t mono">number</text>
<rect x="536" y="108" width="104" height="40" rx="6" class="fg-b warm"/><text x="588" y="133" text-anchor="middle" class="fg-t mono">&#117;ndefined</text>
<rect x="370" y="168" width="150" height="40" rx="6" class="fg-b"/><text x="445" y="193" text-anchor="middle" class="fg-t mono">Card</text>
<text x="505" y="232" text-anchor="middle" class="fg-t sm acc">綠框：string | null，寫出來才收</text>
</svg><figcaption>關掉時，每個型別都是「這個東西，或者空」；打開後，<code>null</code> 和 <code>&#117;ndefined</code> 是兩個獨立的型別，要用聯集明明白白寫出來，盒子才收。</figcaption></figure>
<p>同一段程式，兩種設定，看看差別：</p>
<pre><code>// tsconfig: {"strictNullChecks": false}
const cards: number[] = [3, 8];
const big: number = cards.find(c =&gt; c &gt; 10);   // 檢查器沒意見
console.log(big.toFixed(1));                   // 執行時當掉</code></pre>
<pre><code>const cards: number[] = [3, 8];
const big: number = cards.find(c =&gt; c &gt; 10);   // 錯誤
// maybe 是 number | &#117;ndefined
const maybe = cards.find(c =&gt; c &gt; 10);
console.log(maybe?.toFixed(1) ?? 'none');   // 'none'</code></pre>
<p>關掉時，<code>find</code> 的回傳型別 <code>number | &#117;ndefined</code> 會被悄悄「吸收」成 <code>number</code>，因為 <code>&#117;ndefined</code> 反正放得進任何盒子。打開後，它就是一個你必須處理的聯集。</p>
<h4>大專案怎麼打開它</h4>
<p>在一個幾十萬行、從來沒開過的專案裡打開 <code>strictNullChecks</code>，常常一口氣冒出上千個錯誤。這個選項沒有「只對某幾個檔案開」的官方開關，常見的漸進做法是：另外建一份 tsconfig，把選項打開，<code>include</code> 只列出已經修好的檔案；CI 同時跑兩份設定，新檔案一律加進嚴格清單，舊檔案一個一個搬進去，清單等於整個專案的那天，就把主設定也打開。每一個被修掉的錯誤，幾乎都對應一個某天會發生的當機，這筆投資很划算。</p>

<h3><span class="badge lv2">進階</span>三、檢查器怎麼追：控制流程分析</h3>
<p>打開 <code>strictNullChecks</code> 之後，你寫了 <code>if (el === null) return;</code>，下一行的 <code>el</code> 就不再可能是 <code>null</code>。檢查器怎麼知道？它做的事叫<b>控制流程分析</b>（control flow analysis）：把函式拆成一個流程圖，每一個分支、每一個 <code>return</code>、每一次指派都是圖上的節點。當你在某一行用到 <code>el</code> 時，它從那個位置沿著流程圖往回走，看沿路經過了哪些檢查和指派，算出「走到這裡時，<code>el</code> 還可能是什麼」。</p>
<pre><code>function showScore(el: Element | null, best?: number) {
  if (el === null) {
    return;                       // 這條路上 el 是 null
  }
  // 能走到這裡的路，el 都是 Element
  if (typeof best === 'number' &amp;&amp; best &gt; 99) {
    el.textContent = 'MAX';       // best 是 number
  } else {
    el.textContent = String(best ?? 0);   // 兩種都可能
  }
}</code></pre>
<figure class="figure"><svg viewBox="0 0 660 330" class="fg" style="width:100%;max-width:660px" role="img" aria-label="showScore 的流程圖：進入時 el 是 Element 或 null；el === null 的分支 return；另一條路上 el 變成 Element；第二個判斷的是分支 best 是 number，否分支 best 仍是 number 或 &#117;ndefined">
<rect x="200" y="14" width="260" height="36" rx="6" class="fg-b"/><text x="330" y="37" text-anchor="middle" class="fg-t mono">el: Element | null</text>
<line x1="330" y1="50" x2="330" y2="64" class="fg-l"/><polygon points="330,72 325.5,64 334.5,64" class="fg-a"/>
<rect x="230" y="72" width="200" height="36" rx="18" class="fg-b alt"/><text x="330" y="95" text-anchor="middle" class="fg-t mono">el === null ?</text>
<path d="M230 90 H105 V122" class="fg-l warm"/><polygon points="105,130 100.5,122 109.5,122" class="fg-a warm"/><text x="170" y="82" text-anchor="middle" class="fg-t sm warm">是</text>
<rect x="20" y="130" width="170" height="50" rx="6" class="fg-b warm"/><text x="105" y="152" text-anchor="middle" class="fg-t mono">el: null</text><text x="105" y="171" text-anchor="middle" class="fg-t sm">return，這條路結束</text>
<line x1="330" y1="108" x2="330" y2="122" class="fg-l on"/><polygon points="330,130 325.5,122 334.5,122" class="fg-a on"/><text x="342" y="122" class="fg-t sm acc">否</text>
<rect x="230" y="130" width="200" height="36" rx="6" class="fg-b hot"/><text x="330" y="153" text-anchor="middle" class="fg-t mono acc">el: Element</text>
<line x1="330" y1="166" x2="330" y2="180" class="fg-l"/><polygon points="330,188 325.5,180 334.5,180" class="fg-a"/>
<rect x="160" y="188" width="340" height="36" rx="18" class="fg-b alt"/><text x="330" y="211" text-anchor="middle" class="fg-t sm mono">typeof best === 'number' &amp;&amp; best &gt; 99 ?</text>
<path d="M160 206 H145 V242" class="fg-l on"/><polygon points="145,250 140.5,242 149.5,242" class="fg-a on"/><text x="128" y="230" text-anchor="end" class="fg-t sm acc">是</text>
<path d="M500 206 H515 V242" class="fg-l"/><polygon points="515,250 510.5,242 519.5,242" class="fg-a"/><text x="530" y="230" class="fg-t sm">否</text>
<rect x="20" y="250" width="250" height="60" rx="6" class="fg-b hot"/><text x="145" y="274" text-anchor="middle" class="fg-t mono">best: number</text><text x="145" y="296" text-anchor="middle" class="fg-t sm mono">el.textContent = 'MAX'</text>
<rect x="390" y="250" width="250" height="60" rx="6" class="fg-b"/><text x="515" y="274" text-anchor="middle" class="fg-t mono">best: number | &#117;ndefined</text><text x="515" y="296" text-anchor="middle" class="fg-t sm">可能是 &#117;ndefined，也可能 ≤ 99</text>
</svg><figcaption>同一個變數，在流程圖的不同位置有不同的型別。「否」那條路的 <code>best</code> 沒有被縮小，因為條件失敗可能是 <code>typeof</code> 不成立，也可能只是 <code>best &gt; 99</code> 不成立。</figcaption></figure>
<p>右下角那格值得想一下。<code>A &amp;&amp; B</code> 失敗，有兩種可能：A 不成立（<code>best</code> 是 <code>&#117;ndefined</code>），或 A 成立但 B 不成立（<code>best</code> 是 99 以下的數字）。檢查器沒辦法分辨是哪一種，所以只能說「兩種都有可能」。這就是它的工作方式：它不猜，只在每條路上都能證明的時候才縮小型別。</p>
<h4>指派也會縮小</h4>
<pre><code>let current: number | null = null;
current = 7;
console.log(current.toFixed(0));   // 可以：剛剛指派了 7
current = null;
console.log(current.toFixed(0));   // 錯誤：又變回 null 了</code></pre>
<p>宣告的型別 <code>number | null</code> 是盒子的「容量」；每一次指派之後，檢查器另外記著「現在裡面實際放的是什麼」，叫做縮小後的型別。所以同一個變數，第三行可以用 <code>toFixed</code>，第五行就不行。</p>
<p>會讓檢查器縮小型別的寫法，你已經會大部分了：<code>===</code> 和 <code>!==</code>、<code>== null</code>、真假值判斷、<code>typeof</code>、<code>instanceof</code>、<code>in</code>、判別屬性（像 <code>r.ok</code>）、指派、型別述詞，還有第五節的斷言函式。寫成檢查器看不懂的樣子，例如把條件藏在一個回傳 <code>boolean</code> 的普通函式裡，它就不會縮小。那個函式要改成回傳 <code>x is Card</code> 的型別述詞才行。</p>

<h3><span class="badge lv2">進階</span>四、?. 和 ?? 拆開來看：編譯之後的樣子</h3>
<p><code>?.</code> 和 <code>??</code> 是 ES2020 才加進 JavaScript 的語法，TypeScript 從 3.7 開始支援。如果你的編譯目標比 ES2020 舊，TypeScript 會把它們改寫成舊瀏覽器看得懂的寫法。看改寫後的樣子，是理解它們到底做了什麼最快的方法：</p>
<pre><code>type Player = { name: string; stats?: { best: number } };

function bestOf(p: Player | null, saved: number | null) {
  const best = p?.stats?.best;
  const start = saved ?? 10;
  return [best, start];
}</code></pre>
<p>目標設成 ES2019，TypeScript 輸出的是：</p>
<pre><code>// 編譯成 ES2019 的 JavaScript（為了好讀，長的那行換了行）
function bestOf(p, saved) {
    var _a;
    const best = (_a = p === null || p === void 0
        ? void 0 : p.stats) === null || _a === void 0
        ? void 0 : _a.best;
    const start = saved !== null &amp;&amp; saved !== void 0
        ? saved : 10;
    return [best, start];
}</code></pre>
<p>一段一段讀：</p>
<ol>
<li><code>p === null || p === void 0 ? void 0 : p.stats</code>：<code>p</code> 是 <code>null</code> 或 <code>&#117;ndefined</code> 嗎？是的話整個結果就是 <code>&#117;ndefined</code>，否則才去讀 <code>p.stats</code>。注意它分別比了 <code>null</code> 和 <code>&#117;ndefined</code>，只比這兩個，<code>0</code>、<code>''</code>、<code>false</code> 都會繼續往下讀。</li>
<li>讀到的 <code>stats</code> 先存進暫存變數 <code>_a</code>，再拿 <code>_a</code> 做下一次檢查。為什麼要暫存？因為 <code>p.stats</code> 可能是一個 getter，每讀一次都會執行一次程式；規格要求每一段只能被求值一次。</li>
<li><code>saved !== null &amp;&amp; saved !== void 0 ? saved : 10</code>：<code>??</code> 就是「不是 null、也不是 &#117;ndefined 的話用左邊，否則用右邊」，一點魔法都沒有。實際跑：<code>bestOf(null, 0)</code> 得到 <code>[&#117;ndefined, 0]</code>，0 被保住了。</li>
</ol>
<figure class="figure"><svg viewBox="0 0 640 200" class="fg" style="width:100%;max-width:640px" role="img" aria-label="p?.stats?.best 的求值過程：每一段先檢查是不是 null 或 &#117;ndefined，是的話整串直接變成 &#117;ndefined，不是才往下讀，最後得到 best 的值">
<rect x="30" y="40" width="90" height="40" rx="6" class="fg-b alt"/><text x="75" y="65" text-anchor="middle" class="fg-t mono">p</text>
<rect x="180" y="40" width="120" height="40" rx="6" class="fg-b alt"/><text x="240" y="65" text-anchor="middle" class="fg-t mono">?.stats</text>
<rect x="360" y="40" width="120" height="40" rx="6" class="fg-b alt"/><text x="420" y="65" text-anchor="middle" class="fg-t mono">?.best</text>
<rect x="530" y="40" width="96" height="40" rx="6" class="fg-b hot"/><text x="578" y="65" text-anchor="middle" class="fg-t acc">best 的值</text>
<line x1="120" y1="60" x2="172" y2="60" class="fg-l on"/><polygon points="180,60 172,55.5 172,64.5" class="fg-a on"/><text x="150" y="50" text-anchor="middle" class="fg-t sm acc">有值</text>
<line x1="300" y1="60" x2="352" y2="60" class="fg-l on"/><polygon points="360,60 352,55.5 352,64.5" class="fg-a on"/><text x="330" y="50" text-anchor="middle" class="fg-t sm acc">有值</text>
<line x1="480" y1="60" x2="522" y2="60" class="fg-l on"/><polygon points="530,60 522,55.5 522,64.5" class="fg-a on"/>
<line x1="75" y1="80" x2="75" y2="132" class="fg-l warm"/><polygon points="75,140 70.5,132 79.5,132" class="fg-a warm"/><text x="85" y="112" class="fg-t sm warm">空的</text>
<line x1="240" y1="80" x2="240" y2="132" class="fg-l warm"/><polygon points="240,140 235.5,132 244.5,132" class="fg-a warm"/><text x="250" y="112" class="fg-t sm warm">空的</text>
<rect x="30" y="140" width="450" height="40" rx="6" class="fg-b warm"/><text x="255" y="165" text-anchor="middle" class="fg-t">整串停下：結果是 &#117;ndefined，後面一段都不跑</text>
</svg><figcaption>這叫短路（short-circuit）：只要有一段是空的，後面所有的讀取和呼叫全部跳過，連帶的副作用也不會發生。</figcaption></figure>
<h4>四個容易寫錯的細節</h4>
<ul>
<li><b>短路是整串一起停</b>：<code>p?.stats.best</code> 在 <code>p</code> 是 <code>null</code> 時，連 <code>.best</code> 都不會讀，不會當掉。但如果 <code>p</code> 有值、<code>stats</code> 是 <code>&#117;ndefined</code>，<code>.best</code> 就會當掉，檢查器也會擋：「<code>'p.stats' is possibly '&#117;ndefined'</code>」。每一段可能空的地方，都要有自己的 <code>?.</code>。</li>
<li><b>呼叫有兩種寫法</b>：<code>game?.start()</code> 是「game 可能是空的」；<code>game.onEnd?.()</code> 是「game 一定在，但 onEnd 這個函式可能沒傳」。陣列索引則寫成 <code>list?.[0]</code>。</li>
<li><b><code>?.</code> 不能放在等號左邊</b>：<code>player?.name = 'Mia'</code> 是語法錯誤。「如果有這個人就改名，沒有就算了」要老實寫成 <code>if</code>。</li>
<li><b><code>??</code> 不能直接跟 <code>||</code> 或 <code>&amp;&amp;</code> 混用</b>：<code>a || b ?? c</code> 是語法錯誤，一定要加括號寫成 <code>(a || b) ?? c</code>。這是語言設計者刻意的，因為兩種優先順序都有人會猜錯。</li>
</ul>

<h3><span class="badge lv3">專業</span>五、明確賦值與 !：你在跟檢查器簽什麼約</h3>
<p>除了「可能是 null」，檢查器還追蹤另一件事：「這個變數用之前，到底有沒有被指派過」。這叫<b>明確賦值分析</b>（definite assignment analysis），用的也是同一張流程圖：</p>
<pre><code>let best: number;
if (Math.random() &gt; 0.5) best = 10;
console.log(best);   // 錯誤：有一條路沒有指派

let mode: 'easy' | 'hard';
if (Math.random() &gt; 0.5) mode = 'easy';
else mode = 'hard';
console.log(mode);   // 可以：每一條路都指派了</code></pre>
<p>類別的欄位也一樣。開著 <code>strict</code>（裡面的 <code>strictPropertyInitialization</code>），每個欄位要嘛有初始值，要嘛在建構函式的每一條路上都被設定：</p>
<pre><code>class Table {
  dealer: string;   // 錯誤：沒有初始值，建構函式也沒設定
  seats = 4;        // 可以：有初始值
  round!: number;   // 「相信我，之後一定會設定」
  constructor() {}
}</code></pre>
<p>注意 <code>round!: number</code> 和上一課的 <code>el!</code> 長得一樣，其實是兩個不同的東西。寫在宣告上的叫<b>明確賦值斷言</b>（definite assignment assertion），意思是「用之前一定會有人來填」；寫在運算式後面的叫非空值斷言，意思是「這一刻它不是空的」。共同點是：兩個都只是你對檢查器的口頭承諾，編譯後完全消失，執行時沒有任何人幫你檢查。</p>
<figure class="figure"><svg viewBox="0 0 560 314" class="fg" style="width:100%;max-width:560px" role="img" aria-label="四種寫法編譯成 JavaScript 之後的樣子：驚嘆號完全消失；?. 和 ?? 變成真正的檢查；自己寫的 if 原樣保留">
<text x="101" y="24" text-anchor="middle" class="fg-t lg">你寫的 TypeScript</text>
<text x="382" y="24" text-anchor="middle" class="fg-t lg">輸出的 JS（ES2019）</text>
<rect x="16" y="40" width="170" height="56" rx="6" class="fg-b warm"/><text x="101" y="73" text-anchor="middle" class="fg-t mono">el!.textContent</text>
<rect x="220" y="40" width="324" height="56" rx="6" class="fg-b warm"/>
<text x="234" y="64" class="fg-t mono">el.textContent</text>
<text x="234" y="84" class="fg-t sm warm">! 消失，什麼都沒檢查</text>
<line x1="186" y1="68" x2="212" y2="68" class="fg-l warm"/><polygon points="220,68 212,63.5 212,72.5" class="fg-a warm"/>
<rect x="16" y="108" width="170" height="56" rx="6" class="fg-b"/><text x="101" y="141" text-anchor="middle" class="fg-t mono">el?.textContent</text>
<rect x="220" y="108" width="324" height="56" rx="6" class="fg-b hot"/>
<text x="234" y="132" class="fg-t mono" xml:space="preserve">el === null || el === void 0</text><text x="234" y="152" class="fg-t mono" xml:space="preserve">  ? void 0 : el.textContent</text>
<line x1="186" y1="136" x2="212" y2="136" class="fg-l on"/><polygon points="220,136 212,131.5 212,140.5" class="fg-a on"/>
<rect x="16" y="176" width="170" height="56" rx="6" class="fg-b"/><text x="101" y="209" text-anchor="middle" class="fg-t mono">saved ?? 10</text>
<rect x="220" y="176" width="324" height="56" rx="6" class="fg-b hot"/>
<text x="234" y="200" class="fg-t mono" xml:space="preserve">saved !== null &amp;&amp; saved !== void 0</text><text x="234" y="220" class="fg-t mono" xml:space="preserve">  ? saved : 10</text>
<line x1="186" y1="204" x2="212" y2="204" class="fg-l on"/><polygon points="220,204 212,199.5 212,208.5" class="fg-a on"/>
<rect x="16" y="244" width="170" height="56" rx="6" class="fg-b"/><text x="101" y="277" text-anchor="middle" class="fg-t mono">if (el) { … }</text>
<rect x="220" y="244" width="324" height="56" rx="6" class="fg-b hot"/>
<text x="234" y="268" class="fg-t mono">if (el) { … }</text>
<text x="234" y="288" class="fg-t sm acc">原樣保留</text>
<line x1="186" y1="272" x2="212" y2="272" class="fg-l on"/><polygon points="220,272 212,267.5 212,276.5" class="fg-a on"/>
</svg><figcaption>綠色那三行，執行時真的有人在檢查；橘色那一行，檢查只存在你寫程式的那一刻。</figcaption></figure>
<h4>遊戲引擎裡最常見的 !</h4>
<p>Cocos Creator 的元件常用 <code>@property</code> 讓你在編輯器裡把節點、元件「拉線」接上。欄位在程式碼裡沒有值，是場景載入時由引擎填進去的，所以你會看到兩種寫法：</p>
<pre><code>import { _decorator, Component, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ScoreView')
export class ScoreView extends Component {
  // 承諾：編輯器裡一定會拉線
  @property(Label) titleLabel: Label = null!;
  // 誠實：可能沒拉
  @property(Label) scoreLabel: Label | null = null;

  show(score: number) {
    this.titleLabel.string = 'Score';   // 沒拉線就當掉
    if (this.scoreLabel) this.scoreLabel.string = String(score);
  }
}</code></pre>
<p><code>= null!</code> 是「把 null 斷言成非空」，等於對檢查器說謊換取方便。它不是錯，只是把責任從檢查器移到了人身上：哪天有人複製了預製體（prefab）卻忘了拉線，錯誤會在 <code>show</code> 被呼叫的那一刻才出現，而且訊息只會說讀不到 <code>string</code>，不會說是哪條線沒接。比較穩的折衷是：欄位寫成可空的，在 <code>onLoad</code> 裡集中檢查一次，缺了就丟出寫清楚名字的錯誤。</p>
<h4>什麼時候 ! 是 bug</h4>
<p>判斷標準只有一個：<b>你說得出「為什麼這個值在這裡一定存在」嗎？</b>而且這個理由，在別人改了程式之後還成立嗎？</p>
<ul>
<li><b>大概沒問題</b>：測試程式碼裡、剛 <code>map.has(k)</code> 完的下一行 <code>map.get(k)!</code>（雖然更好的寫法是先 <code>get</code> 再檢查 <code>&#117;ndefined</code>）、框架保證已經填好的欄位。</li>
<li><b>通常是 bug</b>：<code>array.find(...)!</code>（資料一變就找不到）、<code>document.querySelector(...)!</code> 寫在元件還沒掛上頁面時可能就會跑的地方、<code>JSON.parse</code> 回來的東西、任何來自網路或使用者輸入的值。</li>
</ul>
<p>想要「不存在就立刻、清楚地失敗」，比 <code>!</code> 好的工具是<b>斷言函式</b>（assertion function）。它的回傳型別寫成 <code>asserts value is ...</code>，呼叫之後，檢查器就會把型別縮小，而且執行時是真的會檢查：</p>
<pre><code>function assertDefined&lt;T&gt;(
  value: T,
  what: string,
): asserts value is NonNullable&lt;T&gt; {
  if (value === null || value === &#117;ndefined) {
    throw new Error(what + ' is missing');
  }
}

const el = document.querySelector('#score');
assertDefined(el, '#score');
el.textContent = '0';   // el 是 Element</code></pre>
<p>它跟 <code>!</code> 一樣只要一行，但壞掉時會說「#score is missing」，而不是十行之後一個讓人摸不著頭緒的 TypeError。</p>

<h3><span class="badge lv3">專業</span>六、noUncheckedIndexedAccess：陣列和字典的漏洞</h3>
<p><code>strict</code> 打開之後，還有一個大洞沒補：用索引讀陣列或字典。</p>
<pre><code>const hand: number[] = [7, 12];
const fifth = hand[4];           // 型別是 number
console.log(fifth.toFixed(0));   // 檢查器沒意見，執行時當掉</code></pre>
<p>預設情況下，檢查器假設你用索引拿到的東西一定存在，<code>hand[4]</code> 的型別就是 <code>number</code>。為什麼這麼樂觀？因為如果每一次 <code>arr[i]</code> 都要你檢查，迴圈裡的程式碼會非常囉嗦。TypeScript 4.1 加入了 <code>noUncheckedIndexedAccess</code>，讓你自己選擇。它<b>不包含</b>在 <code>strict</code> 裡，要另外打開：</p>
<figure class="figure"><svg viewBox="0 0 640 210" class="fg" style="width:100%;max-width:640px" role="img" aria-label="陣列 hand 只有兩格有值，索引 2 到 4 是空的；沒開選項時檢查器說每一格都是 number，打開之後說每一格都是 number 或 &#117;ndefined，執行時空的格子讀到 &#117;ndefined">
<text x="194" y="30" text-anchor="middle" class="fg-t sm mono">hand[0]</text><text x="290" y="30" text-anchor="middle" class="fg-t sm mono">hand[1]</text><text x="386" y="30" text-anchor="middle" class="fg-t sm mono">hand[2]</text><text x="482" y="30" text-anchor="middle" class="fg-t sm mono">hand[3]</text><text x="578" y="30" text-anchor="middle" class="fg-t sm mono">hand[4]</text>
<rect x="150" y="40" width="88" height="40" rx="5" class="fg-b alt"/><text x="194" y="66" text-anchor="middle" class="fg-t lg mono">7</text>
<rect x="246" y="40" width="88" height="40" rx="5" class="fg-b alt"/><text x="290" y="66" text-anchor="middle" class="fg-t lg mono">12</text>
<rect x="342" y="40" width="88" height="40" rx="5" class="fg-b"/><text x="386" y="65" text-anchor="middle" class="fg-t sm">不存在</text>
<rect x="438" y="40" width="88" height="40" rx="5" class="fg-b"/><text x="482" y="65" text-anchor="middle" class="fg-t sm">不存在</text>
<rect x="534" y="40" width="88" height="40" rx="5" class="fg-b"/><text x="578" y="65" text-anchor="middle" class="fg-t sm">不存在</text>
<text x="20" y="116" class="fg-t">沒開的型別</text>
<text x="194" y="116" text-anchor="middle" class="fg-t mono">number</text><text x="290" y="116" text-anchor="middle" class="fg-t mono">number</text><text x="386" y="116" text-anchor="middle" class="fg-t mono warm">number</text><text x="482" y="116" text-anchor="middle" class="fg-t mono warm">number</text><text x="578" y="116" text-anchor="middle" class="fg-t mono warm">number</text>
<text x="20" y="152" class="fg-t">打開後的型別</text>
<rect x="150" y="134" width="472" height="28" rx="4" class="fg-b hot"/><text x="386" y="153" text-anchor="middle" class="fg-t">每一格都是 number | &#117;ndefined，先檢查再用</text>
<text x="20" y="190" class="fg-t">執行時的值</text>
<text x="194" y="190" text-anchor="middle" class="fg-t mono">7</text><text x="290" y="190" text-anchor="middle" class="fg-t mono">12</text><text x="386" y="190" text-anchor="middle" class="fg-t mono warm">&#117;ndefined</text><text x="482" y="190" text-anchor="middle" class="fg-t mono warm">&#117;ndefined</text><text x="578" y="190" text-anchor="middle" class="fg-t mono warm">&#117;ndefined</text>
</svg><figcaption>橘色是型別和現實對不上的地方。檢查器不知道陣列有多長，打開這個選項，就是要它承認「我不知道」。</figcaption></figure>
<pre><code>// tsconfig: {"noUncheckedIndexedAccess": true}
const hand: number[] = [7, 12];
const first = hand[0];            // number | &#117;ndefined
console.log(first.toFixed(0));    // 錯誤：可能是 &#117;ndefined
if (first !== &#117;ndefined) console.log(first.toFixed(0));

const scores: Record&lt;string, number&gt; = { mia: 3 };
const leo = scores['leo'];        // number | &#117;ndefined

for (const card of hand) {
  console.log(card.toFixed(0));   // for-of 不受影響
}
const pair: [number, number] = [3, 9];
console.log(pair[1].toFixed(0));  // 長度固定的元組也不受影響</code></pre>
<p>打開它的代價是傳統的 <code>for (let i = 0; i &lt; arr.length; i++)</code> 迴圈裡，<code>arr[i]</code> 都變成可能是 <code>&#117;ndefined</code>。多數時候答案是改用 <code>for...of</code>、<code>map</code>、<code>forEach</code>，它們本來就不會越界。新專案建議一開始就打開；舊專案打開時，錯誤數量通常比 <code>strictNullChecks</code> 少得多，但會集中在「從字典裡用字串拿東西」的地方，而那正是執行時最常出事的地方。</p>

<h3><span class="badge lv4">專家</span>七、設計不需要 null 的 API</h3>
<p>前面六節都在講「null 來了怎麼接」。更高段的做法是：在你自己設計的函式和資料結構裡，讓 null 根本不用出現，或只在真的有意義的地方出現。先問一個問題：「值不見」在這裡代表什麼？答案不同，設計就不同：</p>
<figure class="figure"><svg viewBox="0 0 560 322" class="fg" style="width:100%;max-width:560px" role="img" aria-label="值可能不見時的五種設計：一串東西回傳空陣列；設定用預設值合併；查一筆用 T 或 &#117;ndefined；可能失敗用 Result 型別；照理不會發生就直接 throw">
<rect x="150" y="10" width="260" height="34" rx="17" class="fg-b alt"/><text x="280" y="32" text-anchor="middle" class="fg-t alt">值可能不見：它代表什麼？</text>
<path d="M150 27 H40 V290" class="fg-l"/>
<line x1="40" y1="82" x2="48" y2="82" class="fg-l"/><polygon points="56,82 48,77.5 48,86.5" class="fg-a"/>
<rect x="56" y="62" width="210" height="40" rx="6" class="fg-b"/><text x="161" y="87" text-anchor="middle" class="fg-t">一串東西，可能一個都沒有</text>
<line x1="266" y1="82" x2="290" y2="82" class="fg-l on"/><polygon points="298,82 290,77.5 290,86.5" class="fg-a on"/>
<rect x="298" y="62" width="130" height="40" rx="6" class="fg-b hot"/><text x="363" y="87" text-anchor="middle" class="fg-t acc">回傳 []</text>
<text x="440" y="87" class="fg-t sm mono">filter(…)</text>
<line x1="40" y1="134" x2="48" y2="134" class="fg-l"/><polygon points="56,134 48,129.5 48,138.5" class="fg-a"/>
<rect x="56" y="114" width="210" height="40" rx="6" class="fg-b"/><text x="161" y="139" text-anchor="middle" class="fg-t">設定、選項，使用者沒填</text>
<line x1="266" y1="134" x2="290" y2="134" class="fg-l on"/><polygon points="298,134 290,129.5 290,138.5" class="fg-a on"/>
<rect x="298" y="114" width="130" height="40" rx="6" class="fg-b hot"/><text x="363" y="139" text-anchor="middle" class="fg-t acc">預設值合併</text>
<text x="440" y="139" class="fg-t sm mono">{ ...DEFAULTS }</text>
<line x1="40" y1="186" x2="48" y2="186" class="fg-l"/><polygon points="56,186 48,181.5 48,190.5" class="fg-a"/>
<rect x="56" y="166" width="210" height="40" rx="6" class="fg-b"/><text x="161" y="191" text-anchor="middle" class="fg-t">查一筆資料，找不到很正常</text>
<line x1="266" y1="186" x2="290" y2="186" class="fg-l on"/><polygon points="298,186 290,181.5 290,190.5" class="fg-a on"/>
<rect x="298" y="166" width="130" height="40" rx="6" class="fg-b hot"/><text x="363" y="191" text-anchor="middle" class="fg-t acc mono">T | &#117;ndefined</text>
<text x="440" y="191" class="fg-t sm mono">map.get(k)</text>
<line x1="40" y1="238" x2="48" y2="238" class="fg-l"/><polygon points="56,238 48,233.5 48,242.5" class="fg-a"/>
<rect x="56" y="218" width="210" height="40" rx="6" class="fg-b"/><text x="161" y="243" text-anchor="middle" class="fg-t">可能失敗，要知道原因</text>
<line x1="266" y1="238" x2="290" y2="238" class="fg-l on"/><polygon points="298,238 290,233.5 290,242.5" class="fg-a on"/>
<rect x="298" y="218" width="130" height="40" rx="6" class="fg-b hot"/><text x="363" y="243" text-anchor="middle" class="fg-t acc">Result 型別</text>
<text x="440" y="243" class="fg-t sm mono">parseRank(s)</text>
<line x1="40" y1="290" x2="48" y2="290" class="fg-l"/><polygon points="56,290 48,285.5 48,294.5" class="fg-a"/>
<rect x="56" y="270" width="210" height="40" rx="6" class="fg-b"/><text x="161" y="295" text-anchor="middle" class="fg-t">照理不會發生，發生就是 bug</text>
<line x1="266" y1="290" x2="290" y2="290" class="fg-l warm"/><polygon points="298,290 290,285.5 290,294.5" class="fg-a warm"/>
<rect x="298" y="270" width="130" height="40" rx="6" class="fg-b warm"/><text x="363" y="295" text-anchor="middle" class="fg-t warm">直接 throw</text>
<text x="440" y="295" class="fg-t sm mono">assert(…)</text>
</svg><figcaption>只有中間那一格才真的需要「可能是空的」型別。其他四種情況，都有比 null 更能表達意思的寫法。</figcaption></figure>
<ul>
<li><b>一串東西：回傳空陣列，不要回傳 null。</b>「這個玩家沒有任何紀錄」用 <code>[]</code> 表達就好，呼叫的人直接 <code>map</code>、<code>length</code>，不用先檢查。回傳 <code>Card[] | null</code> 等於強迫每個呼叫的人多寫一個 if，而且「null」和「空陣列」之間的差別，通常沒人說得清楚。</li>
<li><b>設定：用預設值合併。</b>函式一開始把使用者給的部分和一份完整的預設值合起來，之後整個函式裡用的都是「每個欄位都有值」的物件。第八節會看到這個寫法有一個型別系統沒抓到的小洞。</li>
<li><b>查一筆：<code>T | &#117;ndefined</code> 是誠實的。</b><code>Map.get</code>、<code>Array.find</code> 都是這樣設計的，找不到是正常結果，不是錯誤。自己寫的話，統一用 <code>&#117;ndefined</code> 表示「找不到」，不要一下 <code>null</code>、一下 <code>&#117;ndefined</code>，呼叫的人才知道要檢查哪一個。</li>
<li><b>可能失敗、而且要知道原因：用 Result 型別。</b>回傳 <code>null</code> 只能說「失敗了」，說不出為什麼。</li>
<li><b>照理不會發生：直接丟例外。</b>例如設定檔裡少了一個必填欄位。這是程式或部署的錯，應該在啟動時就大聲失敗，而不是讓 null 一路流到某個角落才當掉。</li>
</ul>
<pre><code>type Result&lt;T, E = string&gt; =
  | { ok: true; value: T }
  | { ok: false; error: E };

function parseRank(text: string): Result&lt;number&gt; {
  const rank = Number(text);
  if (!Number.isInteger(rank)) {
    return { ok: false, error: 'not a number: ' + text };
  }
  if (rank &lt; 1 || rank &gt; 13) {
    return { ok: false, error: 'out of range: ' + rank };
  }
  return { ok: true, value: rank };
}

const r = parseRank('14');
if (r.ok) console.log(r.value + 1);   // r.value 是 number
else console.log(r.error);            // out of range: 14</code></pre>
<p><code>Result</code> 是一個判別聯集：<code>ok</code> 是判別屬性，檢查器看到 <code>if (r.ok)</code> 就知道這一邊有 <code>value</code>、另一邊有 <code>error</code>。呼叫的人想拿到值，就一定得先面對「失敗」那條路，忘記處理錯誤在編譯時就會被抓到。Rust 的 <code>Result</code>、Go 的「多回傳一個 <code>error</code>」，都是同一個想法；Rust、Swift、Kotlin 這些較新的語言，更是從一開始就把「可能沒有值」放進型別裡，一般的型別根本放不進 null。</p>
<h4>邊界上的 null：前後端交接的地方</h4>
<p>資料穿過網路或資料庫時，「沒有值」最容易變形：</p>
<ul>
<li><b>JSON</b>：前面說過，<code>&#117;ndefined</code> 送不出去，屬性會直接消失。API 要能分辨「把這個欄位清空」和「不要動這個欄位」，就得約定用 <code>null</code> 表示清空、不送表示不動。</li>
<li><b>Go 後端</b>：Go 的 <code>encoding/json</code> 會把一個 nil 的切片（slice）編成 <code>null</code>，而不是 <code>[]</code>；只有初始化過的空切片才會變成 <code>[]</code>。前端如果把型別寫成 <code>cards: Card[]</code> 就直接 <code>map</code>，遇到某個沒有資料的玩家就當掉。前端的型別要照實寫成可能是 <code>null</code>，或請後端統一回空陣列。</li>
<li><b>SQL</b>：資料庫的 NULL 代表「未知」，<code>NULL = NULL</code> 的結果不是 true，而是 NULL，所以查詢要寫 <code>IS NULL</code>。可為 NULL 的欄位，經過 ORM 到了 TypeScript，型別就應該帶著 <code>| null</code>。</li>
</ul>
<p>原則是：在邊界上（收到 API 回應、讀資料庫、讀 <code>localStorage</code> 的那一刻）把各種「沒有」全部檢查、轉換成你程式內部的乾淨型別，例如補上預設值、轉成 Result。之後程式內部就不需要到處防守。</p>

<h3><span class="badge lv4">專家</span>八、檢查器管不到的地方</h3>
<p>控制流程分析很強，但它刻意不是完美的。TypeScript 的設計目標是「實用」而不是「數學上完全正確」（sound），有些地方它選擇相信你，換取不要誤報。知道這幾個洞在哪裡，是把型別當工具、而不是當信仰的關鍵。</p>
<h4>洞一：呼叫函式之後，屬性的縮小不會失效</h4>
<pre><code>type Game = { current: number | null };

function reset(g: Game) { g.current = null; }

function play(g: Game) {
  if (g.current !== null) {
    reset(g);
    console.log(g.current.toFixed(0));   // 放行，但會當掉
  }
}</code></pre>
<p>檢查器縮小了 <code>g.current</code>，然後看到你呼叫了 <code>reset(g)</code>。照理說 <code>reset</code> 可能改掉它，但如果每次呼叫函式都把所有縮小作廢，幾乎所有正常的程式都會滿江紅，所以 TypeScript 選擇樂觀。實務上的防禦：先把值存進一個 <code>const</code> 區域變數再用，<code>const cur = g.current;</code> 之後別人改的是物件，改不到你手上的 <code>cur</code>。</p>
<h4>洞二（已經補了一半）：回呼裡的縮小</h4>
<pre><code>function later(name: string | null) {
  if (name === null) return;
  setTimeout(() =&gt; console.log(name.length));   // 5.4 起可以
}

function laterBad(name: string | null) {
  if (name === null) return;
  setTimeout(() =&gt; console.log(name.length));   // 錯誤
  name = null;
}</code></pre>
<p>回呼是晚點才執行的，到時候變數可能已經被改了。TypeScript 5.4 以前，參數和 <code>let</code> 變數在回呼裡一律失去縮小；5.4 起，檢查器會看「這個變數在回呼建立之後還有沒有被指派」，沒有的話就保留縮小。這就是為什麼同一段程式，在舊版和新版的編輯器裡，紅線不一樣。</p>
<h4>洞三：可選屬性和「明確寫出的 &#117;ndefined」</h4>
<pre><code>type Options = { speed: number; sound: boolean };
const DEFAULTS: Options = { speed: 1, sound: true };

function makeOptions(saved: Partial&lt;Options&gt; | null): Options {
  return { ...DEFAULTS, ...saved };
}

const o = makeOptions({ speed: &#117;ndefined });   // 檢查器放行
console.log(o.speed);   // &#117;ndefined，型別卻說是 number</code></pre>
<p><code>Partial&lt;Options&gt;</code> 讓每個屬性變成可選的，而「可選」預設也接受明確寫出的 <code>&#117;ndefined</code>。物件展開時，<code>speed: &#117;ndefined</code> 會蓋掉預設值的 1。檢查器把「沒有這個屬性」和「屬性存在但值是 &#117;ndefined」當成同一件事，執行時卻完全不同。<code>exactOptionalPropertyTypes</code>（TypeScript 4.4 起，不在 <code>strict</code> 裡）就是把這兩件事分開：打開之後，<code>speed?: number</code> 只代表「可以不寫」，寫了就必須是數字。從表單或 API 拿資料合併設定的程式，很值得打開它。</p>
<h4>洞四：你親手開的洞</h4>
<ul>
<li><code>JSON.parse</code> 回傳 <code>any</code>，<code>any</code> 會讓所有檢查失效。外面來的資料，先當成 <code>unknown</code>，用型別守衛或驗證函式庫檢查過再用。</li>
<li><code>as Card</code> 這種型別斷言跟 <code>!</code> 一樣，只是承諾，執行時不檢查。</li>
<li>反過來的好消息：TypeScript 5.5 起，<code>list.filter(x =&gt; x !== &#117;ndefined)</code> 會自動推論出型別述詞，結果直接是去掉 <code>&#117;ndefined</code> 的陣列。以前大家為了這個到處寫 <code>!</code> 或 <code>as</code>，現在可以刪掉了。</li>
</ul>

<h3>九、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td><code>null</code> 和 <code>&#117;ndefined</code> 完全一樣</td><td>大部分時候可以一起處理，但 JSON 只有 <code>null</code>，預設參數只對 <code>&#117;ndefined</code> 生效，<code>typeof</code> 的結果也不同。</td></tr>
<tr><td><code>!</code> 會在執行時檢查</td><td>它編譯後完全消失。真的要檢查，用 if 或斷言函式。</td></tr>
<tr><td><code>strict</code> 打開就把 null 的洞全補了</td><td>索引存取（<code>noUncheckedIndexedAccess</code>）和明確的 <code>&#117;ndefined</code>（<code>exactOptionalPropertyTypes</code>）都不在 <code>strict</code> 裡，要另外開。</td></tr>
<tr><td><code>a?.b.c</code> 在 <code>b</code> 不見時也安全</td><td><code>?.</code> 只保護它前面那一段。每一個可能空的地方都要有自己的 <code>?.</code>。</td></tr>
<tr><td>預設值寫 <code>x || 10</code> 就好</td><td><code>||</code> 會把 0、空字串、false 也換掉。預設值用 <code>??</code>。</td></tr>
<tr><td>型別縮小之後就一直有效</td><td>指派會改變它；屬性的縮小在呼叫函式之後還被保留，但值其實可能被改掉了。</td></tr>
<tr><td>回傳 <code>null</code> 是表示失敗的好方法</td><td>它說不出失敗原因，也很容易被忘記檢查。要原因就用 Result，不該發生就 throw。</td></tr>
</table>

<h3>十、跟你的工作連起來</h3>
<ul>
<li><b>Vue</b>：範本 ref 在掛上頁面之前是 <code>null</code>，<code>v-if</code> 切換時也會變回 <code>null</code>；可選的 props 沒傳就是 <code>&#117;ndefined</code>，用 <code>withDefaults</code> 一次補齊，元件裡就不用到處 <code>??</code>。<code>computed</code> 回傳 <code>T | &#117;ndefined</code> 時，範本裡用 <code>v-if</code> 先擋住。</li>
<li><b>Cocos Creator</b>：<code>@property</code> 欄位的 <code>= null!</code> 是全專案最大宗的 <code>!</code>；<code>getComponent</code>、<code>getChildByName</code> 找不到都回傳 <code>null</code>。在 <code>onLoad</code> 集中檢查一次，比在 <code>update</code> 裡每格防守乾淨。</li>
<li><b>Node.js、Go 後端</b>：API 回應裡「空陣列」和「null」要約定好。Go 的 nil 切片會變成 <code>null</code>，最常讓前端在沒資料的帳號上當掉。</li>
<li><b>資料庫</b>：可為 NULL 的欄位，型別一路帶著 <code>| null</code> 到前端；能不能為 NULL，應該是資料表設計時就想清楚的決定。</li>
<li><b>專案設定</b>：新專案的 tsconfig 建議至少 <code>strict</code> 加上 <code>noUncheckedIndexedAccess</code>，處理大量外部資料的再加 <code>exactOptionalPropertyTypes</code>。</li>
</ul>

<h3>十一、面試會怎麼問</h3>
<ol>
<li>「<code>null</code> 和 <code>&#117;ndefined</code> 有什麼不同？各在什麼情況出現？序列化成 JSON 時有什麼差別？」</li>
<li>「TypeScript 的 <code>strictNullChecks</code> 做了什麼？要在一個大型舊專案導入，你會怎麼做？」</li>
<li>「<code>??</code> 和 <code>||</code> 差在哪？<code>?.</code> 編譯到 ES2019 會變成什麼？」</li>
<li>「非空值斷言 <code>!</code> 什麼時候可以用？有什麼比較安全的替代做法？」</li>
<li>「TypeScript 怎麼做型別縮小？舉一個它判斷錯誤、讓錯誤溜過去的例子。」</li>
<li>「設計一個查詢函式，查不到資料時應該回傳 <code>null</code>、<code>&#117;ndefined</code>、空陣列，還是丟例外？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li><code>&#117;ndefined</code> 表示「從來沒有值」：未初始化的變數、不存在的屬性、沒傳的參數、沒有 return 的函式。<code>null</code> 是程式刻意指定的「空」，例如 DOM 查不到元素、API 的空欄位。<code>typeof null</code> 是 <code>'object'</code>，這是歷史遺留的 bug。JSON 沒有 <code>&#117;ndefined</code>：物件屬性值是 <code>&#117;ndefined</code> 時整個屬性被省略，陣列裡則變成 <code>null</code>，所以 API 要分辨「清空」和「不修改」時，必須約定用 null 和缺少欄位來表達。</li>
<li>它把 <code>null</code> 和 <code>&#117;ndefined</code> 從所有型別裡移出來，成為獨立型別，必須用聯集明確寫出來；可能為空的值在使用前必須經過型別縮小。導入大型專案時，可以另開一份打開此選項的 tsconfig，只包含已修好的檔案，CI 兩份都跑，新檔案一律納入、舊檔案逐步搬入，最後切換主設定。修的時候優先處理邊界（API、DOM、storage），不要用 <code>!</code> 大量消音。</li>
<li><code>||</code> 在左邊是任何假值時取右邊，會把 0、空字串、false 換掉；<code>??</code> 只在左邊是 null 或 &#117;ndefined 時取右邊。<code>?.</code> 編譯到 ES2019 時，每一段都變成 <code>x === null || x === void 0 ? void 0 : x.prop</code>，中間結果存在暫存變數，保證每段只求值一次；任何一段為空，整串短路成 &#117;ndefined。</li>
<li>只有在說得出「為什麼這裡一定有值」、而且這個理由不會因為別人改程式而失效時才用，例如測試程式碼、框架保證已注入的欄位。它編譯後消失，不做任何執行時檢查，錯了會在離原因很遠的地方當掉。替代做法：提早 return 的 if 檢查、丟出清楚訊息的斷言函式（<code>asserts value is NonNullable&lt;T&gt;</code>）、用 <code>??</code> 給預設值，或把型別改成真的不會為空。</li>
<li>控制流程分析：檢查器把函式建成流程圖，在每個使用點沿路往回找條件判斷與指派，依 <code>===</code>、<code>typeof</code>、<code>instanceof</code>、<code>in</code>、真假值、判別屬性、型別述詞與斷言函式縮小型別。漏洞例子：先檢查 <code>g.current !== null</code>，然後呼叫一個會把 <code>g.current</code> 設成 null 的函式，檢查器仍認為它非空。另一個例子是 <code>Partial</code> 的屬性接受明確的 &#117;ndefined，物件展開後蓋掉預設值。</li>
<li>看「找不到」代表什麼。回傳集合的查詢，找不到就回空陣列；查單筆而且找不到是正常情況，回 <code>T | &#117;ndefined</code>（跟 <code>Map.get</code>、<code>find</code> 一致）；需要說明失敗原因，用 Result 判別聯集；如果找不到代表資料或程式壞了（例如必定存在的設定），就丟例外。重點是整個程式碼庫統一一種「找不到」的表示法。</li>
</ol>
</details>

<h3>十二、練功題（做得出來才算真的懂）</h3>
<ol>
<li>不要跑，先預測：<code>0 ?? 5</code>、<code>'' || 'x'</code>、<code>null ?? &#117;ndefined ?? 3</code>，以及 <code>function f(x = 5) { return x; }</code> 的 <code>f(null)</code> 和 <code>f(&#117;ndefined)</code>。</li>
<li>把 <code>const bestOf = (p: Player | null) =&gt; p?.stats?.best ?? 0;</code> 用 ES2019 能跑的寫法手動改寫，不准用 <code>?.</code> 和 <code>??</code>，而且 <code>p.stats</code> 只能讀一次。</li>
<li>改寫這段，拿掉所有的 <code>!</code>，讓它在元素不存在時丟出清楚的錯誤：<code>const btn = document.querySelector('#guess')!; btn.addEventListener('click', () =&gt; { const v = scores.get(player)!; render(v); });</code></li>
<li>寫一個 <code>getOrDefault&lt;K, V&gt;(map: Map&lt;K, V&gt;, key: K, fallback: V): V</code>，並說明為什麼不能寫成 <code>map.get(key) || fallback</code>。</li>
<li>第八節的 <code>makeOptions({ speed: &#117;ndefined })</code> 會得到 <code>speed</code> 是 <code>&#117;ndefined</code>。給出兩種修法：一種靠設定，一種靠程式碼。</li>
<li>在你的專案打開 <code>noUncheckedIndexedAccess</code>，數一數錯誤有幾個，挑三個分類：哪些改成 <code>for...of</code>、哪些加檢查、哪些其實暴露了真的 bug。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li><code>0</code>（0 不是 null 也不是 &#117;ndefined）；<code>'x'</code>（空字串是假值）；<code>3</code>（前兩個都是空的）；<code>f(null)</code> 是 <code>null</code>（null 不觸發預設值），<code>f(&#117;ndefined)</code> 是 <code>5</code>。</li>
<li><pre><code>type Player = { name: string; stats?: { best: number } };

function bestOf(p: Player | null): number {
  if (p === null) return 0;
  const stats = p.stats;          // 只讀一次
  if (stats === &#117;ndefined) return 0;
  const best = stats.best;
  return best === null || best === &#117;ndefined ? 0 : best;
}</code></pre>最後一行在這個型別下其實可以直接 <code>return best</code>，寫出來是為了對應 <code>??</code> 的完整語意。</li>
<li><pre><code>declare const scores: Map&lt;string, number&gt;;
declare const player: string;
declare function render(v: number): void;

const btn = document.querySelector('#guess');
if (btn === null) throw new Error('#guess not found');
btn.addEventListener('click', () =&gt; {
  const v = scores.get(player);
  if (v === &#117;ndefined) {
    console.warn('no score for ' + player);
    return;
  }
  render(v);
});</code></pre>按鈕不存在是部署或範本的錯，直接丟例外；分數不存在可能是正常情況（新玩家），所以只警告並略過。兩種「不見」的處理不同，這正是 <code>!</code> 會抹掉的資訊。</li>
<li><pre><code>function getOrDefault&lt;K, V&gt;(
  map: Map&lt;K, V&gt;, key: K, fallback: V,
): V {
  const v = map.get(key);
  return v === &#117;ndefined ? fallback : v;
}</code></pre>用 <code>||</code> 的話，存著的值是 0、空字串或 false 時也會被換成 fallback。注意如果 V 本身就可能是 <code>&#117;ndefined</code>，就得改用 <code>map.has(key)</code> 來分辨「沒有這個 key」和「存了 &#117;ndefined」。</li>
<li>設定：打開 <code>exactOptionalPropertyTypes</code>，<code>{ speed: &#117;ndefined }</code> 就傳不進 <code>Partial&lt;Options&gt;</code>。程式碼：合併時逐欄用 <code>??</code>，例如 <code>speed: saved?.speed ?? DEFAULTS.speed</code>，或先把值為 &#117;ndefined 的屬性過濾掉再展開。</li>
<li>沒有標準答案。常見的分布是：大部分是可以改成 <code>for...of</code> 或 <code>map</code> 的迴圈；一部分是用字串從字典取值，需要加檢查；通常會找到一兩個「其實真的可能越界」的地方，例如用伺服器給的索引去讀本地陣列。</li>
</ol>
</details>

<h3>十三、想再挖深</h3>
<ul>
<li><b>TypeScript Handbook：Narrowing</b>（<a href="https://www.typescriptlang.org/docs/handbook/2/narrowing.html">typescriptlang.org</a>）：官方手冊講型別縮小與控制流程分析的章節，每一種縮小寫法都有例子。</li>
<li><b>TSConfig Reference</b>（<a href="https://www.typescriptlang.org/tsconfig">typescriptlang.org/tsconfig</a>）：查 <code>strictNullChecks</code>、<code>noUncheckedIndexedAccess</code>、<code>exactOptionalPropertyTypes</code>，每個選項都有開與不開的對照範例。</li>
<li><b>TypeScript 版本說明</b>（Release Notes）：2.0（strictNullChecks）、3.7（?. 與 ??、斷言函式）、5.4（回呼裡保留縮小）、5.5（推論型別述詞），這一章提到的機制都能在對應版本找到原始說明。</li>
<li><b>Tony Hoare〈Null References: The Billion Dollar Mistake〉</b>：2009 年 QCon 的演講，InfoQ 網站上有錄影，聽發明者自己講這個決定。</li>
<li><b>MDN：Optional chaining、Nullish coalescing operator</b>（<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining">developer.mozilla.org</a>）：兩個運算子的完整規則，包括短路和優先順序。</li>
</ul>
` });
