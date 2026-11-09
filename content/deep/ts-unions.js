DEEP({ 'ts-unions': `
<p>上一課說聯集是「這幾種其中一種」，型別縮小是「檢查一下，弄清楚是哪一種」。這一章把它們當成一套工具拆開來看：聯集在型別的世界裡到底是什麼、檢查器靠哪些寫法縮小型別（一共有八、九種，你大概只用過兩三種）、它在程式裡是怎麼一路追蹤的、什麼時候會追丟。接著是可辨識聯集加上 <code>never</code> 的窮舉檢查，這是 TypeScript 最值錢的技巧之一。然後用它把 Higher or Lower 的遊戲狀態重新建模，讓「不可能的狀態」根本寫不出來。最後把 enum 拆開：數字 enum 的反向對應、const enum、為什麼越來越多團隊改用字面值聯集，以及 TypeScript 5.8 的 <code>erasableSyntaxOnly</code>。</p>

<h3><span class="badge lv1">基礎</span>一、聯集是「或」：能放的變多，能做的變少</h3>
<p>講值與型別那一課的深入圖解說過：型別是一群值的集合。<code>string | number</code> 就是把兩個集合合起來，任何字串、任何數字都放得進去。可是放得進去的東西變多了，你能對它做的事卻變少了：</p>
<figure class="figure"><svg viewBox="0 0 640 224" class="fg" style="width:100%;max-width:640px" role="img" aria-label="string | number 由 string 和 number 兩圈組成；toString 兩邊都有所以可以呼叫，toUpperCase 和 toFixed 只有一邊有所以是錯誤">
<rect x="16" y="20" width="284" height="184" rx="10" class="fg-b"/>
<text x="158" y="44" text-anchor="middle" class="fg-t mono">id: string | number</text>
<rect x="32" y="60" width="124" height="128" rx="8" class="fg-b alt"/>
<text x="94" y="82" text-anchor="middle" class="fg-t">string</text>
<text x="44" y="108" class="fg-t sm mono">toUpperCase()</text>
<text x="44" y="132" class="fg-t sm mono">length</text>
<text x="44" y="166" class="fg-t sm mono acc">toString()</text>
<rect x="164" y="60" width="120" height="128" rx="8" class="fg-b alt"/>
<text x="224" y="82" text-anchor="middle" class="fg-t">number</text>
<text x="176" y="108" class="fg-t sm mono">toFixed()</text>
<text x="176" y="166" class="fg-t sm mono acc">toString()</text>
<rect x="340" y="20" width="284" height="52" rx="6" class="fg-b hot"/>
<text x="352" y="42" class="fg-t mono">id.toString()</text><text x="352" y="62" class="fg-t sm">兩邊都有：可以</text>
<rect x="340" y="86" width="284" height="52" rx="6" class="fg-b warm"/>
<text x="352" y="108" class="fg-t mono">id.toUpperCase()</text><text x="352" y="128" class="fg-t sm">number 沒有：錯誤 TS2339</text>
<rect x="340" y="152" width="284" height="52" rx="6" class="fg-b warm"/>
<text x="352" y="174" class="fg-t mono">id.toFixed(0)</text><text x="352" y="194" class="fg-t sm">string 沒有：錯誤 TS2339</text>
<line x1="300" y1="46" x2="332" y2="46" class="fg-l on"/><polygon points="340,46 332,41.5 332,50.5" class="fg-a on"/>
</svg><figcaption>值的集合是聯集（兩圈加起來），能用的操作卻是交集（兩邊都有的才能用）。要用只有一邊才有的東西，得先縮小。</figcaption></figure>
<p>想像一個包裹，裡面可能是一本書，也可能是一個杯子。不打開之前，你能做的只有兩者都能做的事：搬它、秤它。想讀它、想拿它喝水，都得先打開看看是哪一個。型別縮小就是「打開包裹」。</p>
<p>物件的聯集也一樣，只有每一種都有的屬性才能直接讀：</p>
<pre><code>type Result =
  | { kind: 'right'; points: number }
  | { kind: 'wrong'; correctCard: number };

declare const r: Result;
r.kind;     // 可以：兩種都有 kind
r.points;   // 錯誤 TS2339：wrong 那種沒有 points</code></pre>
<p>還有兩個集合上的小事實，之後會用到：</p>
<ul>
<li>字面值聯集是有限的集合：<code>'higher' | 'lower'</code> 剛好兩個值。<code>boolean</code> 其實就是 <code>true | false</code>。</li>
<li><code>never</code> 是空集合，跟任何東西聯集都等於沒加：<code>string | never</code> 就是 <code>string</code>。所以當檢查器把一個聯集的成員一個一個拿掉，拿到最後，剩下的就是 <code>never</code>。第三節的窮舉檢查就靠這個。</li>
</ul>

<h3><span class="badge lv2">進階</span>二、型別縮小的所有寫法</h3>
<p>檢查器認得的「打開包裹」方法比你想的多。它們都是普通的 JavaScript，檢查器只是看懂了它們的意思：</p>
<table>
<tr><th>寫法</th><th>例子</th><th>適合</th></tr>
<tr><td><code>typeof</code></td><td><code>typeof id === 'string'</code></td><td>string、number、boolean、bigint、symbol、&#117;ndefined 這些原始值，以及函式</td></tr>
<tr><td>真假值（truthiness）</td><td><code>if (name)</code></td><td>去掉 null 和 &#117;ndefined，但連 <code>''</code> 和 <code>0</code> 也一起去掉</td></tr>
<tr><td>相等比較</td><td><code>x === null</code>、<code>x != null</code>、<code>switch</code></td><td>字面值、null、&#117;ndefined</td></tr>
<tr><td><code>in</code></td><td><code>'points' in r</code></td><td>形狀不同的物件</td></tr>
<tr><td><code>instanceof</code></td><td><code>e instanceof TypeError</code></td><td>類別的實例，特別是錯誤</td></tr>
<tr><td>指派</td><td><code>x = 5</code></td><td>指派之後，變數就是剛放進去的那種</td></tr>
<tr><td>辨識屬性</td><td><code>r.kind === 'right'</code></td><td>可辨識聯集（第三節）</td></tr>
<tr><td>型別守衛函式</td><td><code>function isCard(x): x is Card</code></td><td>檢查邏輯複雜，或要重複使用</td></tr>
<tr><td>斷言函式</td><td><code>assertIsCard(x)</code></td><td>不符合就丟例外，之後的程式都當它符合</td></tr>
</table>
<pre><code>declare const v: object | null;
if (typeof v === 'object') {
  v;   // 還是 object | null：typeof null 也是 'object'
}

function show(n: number | null) {
  if (n) return n.toFixed(0);   // 0 也會被當成「沒有」
  // != null 同時去掉 null 和 &#117;ndefined
  if (n != null) return '0';
  return '—';
}

type Right = { kind: 'right'; points: number };
type Wrong = { kind: 'wrong'; correctCard: number };
function f(r: Right | Wrong) {
  if ('points' in r) return r.points;   // r 是 Right
  return r.correctCard;                 // r 是 Wrong
}</code></pre>
<p>第一個例子是 JavaScript 留下來的古老 bug：<code>typeof null</code> 是 <code>'object'</code>。檢查器很誠實，所以 <code>typeof v === 'object'</code> 之後 <code>null</code> 還在，你得再加一個 <code>v !== null</code>。第二個例子是真假值的陷阱：分數 0 是合法的值，<code>if (n)</code> 卻把它當成「沒有」。講 null 那一課會專門處理它。</p>
<h4>檢查器會沿著程式的流程追蹤</h4>
<p>縮小不只發生在 <code>if</code> 的大括號裡。檢查器會沿著程式真正可能走的路線，一路記住「走到這裡時，這個變數還可能是什麼」，這叫<b>控制流程分析</b>（control flow analysis）。<code>return</code>、<code>throw</code>、<code>break</code> 都會把某些可能性「帶走」：</p>
<figure class="figure"><svg viewBox="0 0 640 316" class="fg" style="width:100%;max-width:640px" role="img" aria-label="控制流程圖：id 一開始是 string、number 或 null；判斷是 null 就 return，剩下 string 或 number；再判斷是 string 就 return，最後只剩 number">
<rect x="60" y="16" width="280" height="40" rx="6" class="fg-b"/><text x="200" y="41" text-anchor="middle" class="fg-t mono">id: string | number | null</text>
<line x1="200" y1="56" x2="200" y2="72" class="fg-l"/><polygon points="200,80 195.5,72 204.5,72" class="fg-a"/>
<rect x="110" y="80" width="180" height="40" rx="6" class="fg-b"/><text x="200" y="105" text-anchor="middle" class="fg-t mono">id === null ?</text>
<line x1="290" y1="100" x2="392" y2="100" class="fg-l warm"/><polygon points="400,100 392,95.5 392,104.5" class="fg-a warm"/><text x="345" y="92" text-anchor="middle" class="fg-t sm warm">是</text>
<rect x="400" y="80" width="224" height="40" rx="6" class="fg-b warm"/><text x="412" y="105" class="fg-t sm mono">null → return '—'</text>
<line x1="200" y1="120" x2="200" y2="162" class="fg-l"/><polygon points="200,170 195.5,162 204.5,162" class="fg-a"/><text x="210" y="150" class="fg-t sm">否：剩 string | number</text>
<rect x="80" y="170" width="240" height="40" rx="6" class="fg-b"/><text x="200" y="195" text-anchor="middle" class="fg-t mono">typeof id === 'string' ?</text>
<line x1="320" y1="190" x2="392" y2="190" class="fg-l on"/><polygon points="400,190 392,185.5 392,194.5" class="fg-a on"/><text x="360" y="182" text-anchor="middle" class="fg-t sm acc">是</text>
<rect x="400" y="170" width="224" height="40" rx="6" class="fg-b hot"/><text x="412" y="195" class="fg-t sm mono">string → toUpperCase()</text>
<line x1="200" y1="210" x2="200" y2="252" class="fg-l"/><polygon points="200,260 195.5,252 204.5,252" class="fg-a"/><text x="210" y="240" class="fg-t sm">否：只剩 number</text>
<rect x="110" y="260" width="180" height="40" rx="6" class="fg-b alt"/><text x="200" y="285" text-anchor="middle" class="fg-t sm mono">number → toFixed(0)</text>
</svg><figcaption>每經過一個判斷，就有一部分可能性從主線上離開（往右走掉了）。走到最下面，檢查器很確定 id 只可能是 number。</figcaption></figure>
<pre><code>function label(id: string | number | null): string {
  if (id === null) return '—';
  if (typeof id === 'string') {
    return id.toUpperCase();
  }
  return 'No. ' + id.toFixed(0);
}</code></pre>
<h4>比較少人知道的幾種</h4>
<pre><code>declare const id: string | number;

// 1. 判斷結果先存成 const，照樣能縮小（4.4 起）
const isText = typeof id === 'string';
if (isText) id.toUpperCase();

// 2. 解構之後再判斷，也能縮小另一個欄位（4.6 起）
type Act =
  | { type: 'guess'; guess: 'higher' | 'lower' }
  | { type: 'start' };
function run(a: Act) {
  const { type } = a;
  if (type === 'guess') console.log(a.guess);
}

// 3. filter 會自動推出型別守衛（5.5 起）
const cards = [7, null, 12].filter(c =&gt; c !== null);
// cards: number[]，以前是 (number | null)[]</code></pre>
<h4>自己寫的型別守衛和斷言函式</h4>
<pre><code>type Card = { rank: number; suit: string };

// 型別守衛：回傳 true，呼叫的地方就把 x 當成 Card
function isCard(x: unknown): x is Card {
  if (typeof x !== 'object' || x === null) return false;
  return 'rank' in x &amp;&amp; typeof x.rank === 'number'
    &amp;&amp; 'suit' in x &amp;&amp; typeof x.suit === 'string';
}

// 斷言函式：不符合就丟例外，之後的程式都當它符合
function assertIsCard(x: unknown): asserts x is Card {
  if (!isCard(x)) throw new Error('not a card');
}

declare const data: unknown;
if (isCard(data)) console.log(data.rank);
assertIsCard(data);
console.log(data.suit);   // 這一行起 data 是 Card</code></pre>
<p>型別守衛（type guard）的 <code>x is Card</code> 叫<b>型別述詞</b>（type predicate）。要特別小心一件事：<b>檢查器不會驗證你的守衛寫得對不對</b>。就算函式本體只寫 <code>return true</code>，它也照樣相信。守衛是你和檢查器之間的合約，寫錯了，等於在程式裡挖了一個比 <code>as</code> 還難找的洞，因為它看起來像是「有檢查過」。</p>
<p>斷言函式（assertion function）有一個奇怪的限制：如果你把它寫成箭頭函式存進變數，那個變數必須明確寫上型別，否則呼叫時會出現 TS2775「Assertions require every name in the call target to be declared with an explicit type annotation」。用 <code>function</code> 宣告就沒有這個問題。</p>

<h3><span class="badge lv2">進階</span>三、可辨識聯集與窮舉檢查</h3>
<p>上一課的 <code>Result</code> 就是<b>可辨識聯集</b>（discriminated union）：每一種形狀都有同一個屬性（<code>kind</code>），而且每一種放的是不同的字面值。這個屬性叫<b>辨識屬性</b>（discriminant）。檢查器只要看到你比較了它，就能把整個物件縮小成對應的那一種。</p>
<p>它最強的地方是搭配 <code>never</code> 做<b>窮舉檢查</b>（exhaustiveness check）：</p>
<pre><code>type Result =
  | { kind: 'right'; points: number }
  | { kind: 'wrong'; correctCard: number }
  | { kind: 'skip' };

function assertNever(x: never): never {
  throw new Error('Unexpected: ' + JSON.stringify(x));
}

function message(r: Result): string {
  switch (r.kind) {
    case 'right': return '+' + r.points;
    case 'wrong': return 'It was ' + r.correctCard;
    default: return assertNever(r);   // 錯誤 TS2345
  }
}</code></pre>
<p>假設原本只有 right 和 wrong 兩種，後來有人加了 skip（玩家跳過這一題），卻忘了改 <code>message</code>。看檢查器怎麼抓到它：</p>
<figure class="figure"><svg viewBox="0 0 660 300" class="fg" style="width:100%;max-width:660px" role="img" aria-label="左邊兩種結果時，每個 case 拿走一種，default 剩下 never，assertNever 通過；右邊加了 skip，default 剩下 skip，assertNever 報錯">
<text x="166" y="24" text-anchor="middle" class="fg-t lg">原本：兩種</text>
<text x="494" y="24" text-anchor="middle" class="fg-t lg">有人加了 skip</text>
<rect x="36" y="40" width="260" height="40" rx="6" class="fg-b"/><text x="166" y="65" text-anchor="middle" class="fg-t mono">r: Right | Wrong</text>
<rect x="364" y="40" width="260" height="40" rx="6" class="fg-b"/><text x="494" y="65" text-anchor="middle" class="fg-t mono">r: Right | Wrong | Skip</text>
<line x1="166" y1="80" x2="166" y2="112" class="fg-l"/><polygon points="166,120 161.5,112 170.5,112" class="fg-a"/><text x="176" y="104" class="fg-t sm mono">case 'right'</text>
<line x1="494" y1="80" x2="494" y2="112" class="fg-l"/><polygon points="494,120 489.5,112 498.5,112" class="fg-a"/><text x="504" y="104" class="fg-t sm mono">case 'right'</text>
<rect x="36" y="120" width="260" height="40" rx="6" class="fg-b"/><text x="166" y="145" text-anchor="middle" class="fg-t">剩下 Wrong</text>
<rect x="364" y="120" width="260" height="40" rx="6" class="fg-b"/><text x="494" y="145" text-anchor="middle" class="fg-t">剩下 Wrong | Skip</text>
<line x1="166" y1="160" x2="166" y2="192" class="fg-l"/><polygon points="166,200 161.5,192 170.5,192" class="fg-a"/><text x="176" y="184" class="fg-t sm mono">case 'wrong'</text>
<line x1="494" y1="160" x2="494" y2="192" class="fg-l"/><polygon points="494,200 489.5,192 498.5,192" class="fg-a"/><text x="504" y="184" class="fg-t sm mono">case 'wrong'</text>
<rect x="36" y="200" width="260" height="40" rx="6" class="fg-b hot"/><text x="166" y="225" text-anchor="middle" class="fg-t acc">default：r 是 never</text>
<rect x="364" y="200" width="260" height="40" rx="6" class="fg-b warm"/><text x="494" y="225" text-anchor="middle" class="fg-t warm">default：r 是 Skip</text>
<text x="166" y="266" text-anchor="middle" class="fg-t sm mono">assertNever(r)</text><text x="166" y="286" text-anchor="middle" class="fg-t sm acc">never 放得進 never：通過</text>
<text x="494" y="266" text-anchor="middle" class="fg-t sm mono">assertNever(r)</text><text x="494" y="286" text-anchor="middle" class="fg-t sm warm">Skip 放不進 never：TS2345</text>
<line x1="330" y1="36" x2="330" y2="290" class="fg-l dim dash"/>
</svg><figcaption>每個 case 從聯集裡拿走一種。全部處理完，default 拿到的是空集合 never；漏了一種，default 拿到的就是漏掉的那一種，而它放不進 never。</figcaption></figure>
<p>錯誤訊息是：「Argument of type '{ kind: "skip"; }' is not assignable to parameter of type 'never'」。它不只說你漏了，還直接告訴你漏的是哪一種。這比依賴「函式少了 return」（TS2366）可靠：如果函式回傳 <code>void</code>，或者 <code>switch</code> 後面還有別的程式碼，少了 return 不會報錯，<code>assertNever</code> 卻一定會。</p>
<p><code>assertNever</code> 在執行時也有用。型別只在編譯時存在，如果伺服器哪天送來一個新版本才有的 <code>kind: 'timeout'</code>，舊版的前端會走進 <code>default</code>，丟出一個帶著完整資料的錯誤，日誌裡一看就知道發生什麼事，而不是安靜地顯示一片空白。也有人寫成 <code>default: throw new Error(String(r satisfies never))</code>，效果相同。</p>
<h4>什麼樣的屬性才能當辨識屬性</h4>
<ul>
<li>型別必須是字面值（<code>'right'</code>、<code>404</code>、<code>true</code>），或 <code>null</code>、<code>&#117;ndefined</code>。寫成 <code>kind: string</code> 就完全不能辨識。</li>
<li>每一種形狀都要有這個屬性。有的有、有的沒有，就只能用 <code>in</code> 來縮小，囉嗦又容易錯。</li>
<li>名字沒有規定，常見的是 <code>kind</code>、<code>type</code>、<code>status</code>、<code>phase</code>。同一個專案裡統一一種就好。</li>
</ul>

<h3><span class="badge lv3">專業</span>四、用聯集建模：讓不可能的狀態寫不出來</h3>
<p>這是本章最實用的一節。先看一個很常見、看起來也很合理的寫法，用來描述 Higher or Lower 的遊戲狀態：</p>
<pre><code>type Guess = 'higher' | 'lower';

type GameBad = {
  phase: 'idle' | 'guessing' | 'revealed' | 'over';
  current?: number;
  next?: number;
  guess?: Guess;
  correct?: boolean;
  score: number;
};</code></pre>
<p>算算看這個型別允許幾種「形狀」：phase 有 4 種，current 有或沒有是 2 種，next 也是 2 種，guess 是 3 種（higher、lower、沒有），correct 也是 3 種。4 × 2 × 2 × 3 × 3 = <b>144</b> 種組合。真正合法的只有 4 種：每個 phase 各一種。剩下 140 種，例如「phase 是 idle，卻有 next」、「phase 是 revealed，卻沒有 guess」，都是 bug，可是檢查器全部放行。更糟的是，就算你確定在 revealed 時 next 一定有值，檢查器也不知道，你只好到處寫 <code>g.next!</code>。</p>
<p>改用可辨識聯集，讓每個階段只帶它需要的欄位：</p>
<pre><code>type Game =
  | { phase: 'idle'; best: number }
  | { phase: 'guessing'; best: number;
      current: number; score: number }
  | { phase: 'revealed'; best: number;
      current: number; next: number; score: number;
      guess: Guess; correct: boolean }
  | { phase: 'over'; best: number;
      finalScore: number };</code></pre>
<p>現在合法的形狀剛好 4 種，不合法的組合根本寫不出來。在 <code>if (g.phase === 'revealed')</code> 裡面，<code>g.next</code> 一定是 number，不用驚嘆號；在外面讀 <code>g.next</code>，則直接是錯誤。這個原則有個有名的說法：「<b>讓不可能的狀態不可能</b>」（make impossible states impossible）。</p>
<figure class="figure"><svg viewBox="0 0 680 296" class="fg" style="width:100%;max-width:680px" role="img" aria-label="遊戲狀態機：idle 按 start 進入 guessing，guess 之後進入 revealed，猜對按 next 回到 guessing，猜錯按 next 進入 over，restart 回到 idle；每個狀態旁邊列出它帶的欄位">
<rect x="16" y="110" width="160" height="80" rx="8" class="fg-b"/><text x="96" y="140" text-anchor="middle" class="fg-t acc">idle</text><text x="96" y="164" text-anchor="middle" class="fg-t sm mono">best</text>
<rect x="260" y="20" width="160" height="80" rx="8" class="fg-b alt"/><text x="340" y="50" text-anchor="middle" class="fg-t alt">guessing</text><text x="340" y="74" text-anchor="middle" class="fg-t sm mono">current、score、best</text>
<rect x="500" y="110" width="164" height="80" rx="8" class="fg-b hot"/><text x="582" y="134" text-anchor="middle" class="fg-t acc">revealed</text><text x="582" y="156" text-anchor="middle" class="fg-t sm mono">next、guess、correct</text><text x="582" y="176" text-anchor="middle" class="fg-t sm mono">current、score、best</text>
<rect x="260" y="200" width="160" height="80" rx="8" class="fg-b warm"/><text x="340" y="230" text-anchor="middle" class="fg-t warm">over</text><text x="340" y="254" text-anchor="middle" class="fg-t sm mono">finalScore、best</text>
<path d="M96 110 V60 H252" class="fg-l"/><polygon points="260,60 252,55.5 252,64.5" class="fg-a"/><text x="176" y="52" text-anchor="middle" class="fg-t sm mono">start</text>
<path d="M420 60 H582 V102" class="fg-l"/><polygon points="582,110 577.5,102 586.5,102" class="fg-a"/><text x="500" y="52" text-anchor="middle" class="fg-t sm mono">guess</text>
<path d="M500 140 H380 V108" class="fg-l on"/><polygon points="380,100 375.5,108 384.5,108" class="fg-a on"/><text x="446" y="132" text-anchor="middle" class="fg-t sm acc">next（猜對）</text>
<path d="M582 190 V240 H428" class="fg-l warm"/><polygon points="420,240 428,235.5 428,244.5" class="fg-a warm"/><text x="504" y="232" text-anchor="middle" class="fg-t sm warm">next（猜錯）</text>
<path d="M260 240 H96 V198" class="fg-l"/><polygon points="96,190 91.5,198 100.5,198" class="fg-a"/><text x="178" y="232" text-anchor="middle" class="fg-t sm mono">restart</text>
</svg><figcaption>四個狀態、五條轉換。每個方框裡只有那個狀態真的存在的欄位：next 只活在 revealed，finalScore 只活在 over。</figcaption></figure>
<p>狀態有了，再把「玩家能做的動作」也寫成可辨識聯集，用一個函式描述「目前狀態 + 一個動作 → 下一個狀態」：</p>
<pre><code>// 接著上面的 Guess、Game 和第三節的 assertNever
type Action =
  | { type: 'start' }
  | { type: 'guess'; guess: Guess }
  | { type: 'next' }
  | { type: 'restart' };

function step(g: Game, a: Action,
              draw: () =&gt; number): Game {
  switch (g.phase) {
    case 'idle':
      if (a.type !== 'start') return g;
      return { phase: 'guessing', best: g.best,
               current: draw(), score: 0 };
    case 'guessing': {
      if (a.type !== 'guess') return g;
      const next = draw();
      const correct = a.guess === 'higher'
        ? next &gt; g.current : next &lt; g.current;
      return { ...g, phase: 'revealed', next,
               guess: a.guess, correct };
    }
    case 'revealed': {
      if (a.type !== 'next') return g;
      const { best, score } = g;
      if (g.correct) {
        return { phase: 'guessing', best,
                 current: g.next, score: score + 1 };
      }
      return { phase: 'over', finalScore: score,
               best: Math.max(best, score) };
    }
    case 'over':
      if (a.type !== 'restart') return g;
      return { phase: 'idle', best: g.best };
    default:
      return assertNever(g);
  }
}</code></pre>
<p>用真的數字走一遍。<code>draw</code> 依序抽出 7、11、3，一開始 <code>best</code> 是 0：</p>
<table>
<tr><th>動作</th><th>之前</th><th>之後</th></tr>
<tr><td>start</td><td>idle，best 0</td><td>guessing，current 7，score 0</td></tr>
<tr><td>guess higher</td><td>guessing，current 7</td><td>revealed，next 11，correct true</td></tr>
<tr><td>next</td><td>revealed，correct true</td><td>guessing，current 11，score 1</td></tr>
<tr><td>guess higher</td><td>guessing，current 11</td><td>revealed，next 3，correct false</td></tr>
<tr><td>next</td><td>revealed，correct false</td><td>over，finalScore 1，best 1</td></tr>
<tr><td>restart</td><td>over</td><td>idle，best 1</td></tr>
</table>
<p>這個設計有幾個在實務上很值錢的性質：</p>
<ol>
<li><b>不合法的轉換很明顯</b>：在 idle 收到 guess，函式原封不動回傳 <code>g</code>。所有規則集中在一個地方，不會散落在十個按鈕的事件處理函式裡。</li>
<li><b>好測試</b>：<code>step</code> 是一個純函式（pure function），沒有讀時間、沒有亂數，<code>draw</code> 由外面傳入。測試時傳一個依序回傳 7、11、3 的假函式，就能把上面那張表原封不動寫成自動測試。</li>
<li><b>好存檔、好傳輸</b>：每個狀態都是普通物件，<code>JSON.stringify</code> 就能存進 localStorage 或送到伺服器，讀回來還是同一個形狀。</li>
<li><b>加新狀態時，檢查器帶你走</b>：加一個 <code>paused</code> 階段，<code>default</code> 的 <code>assertNever</code> 立刻報錯，告訴你 <code>step</code> 還沒處理它。</li>
</ol>
<h4>同一招用在網路請求</h4>
<pre><code>type Remote&lt;T&gt; =
  | { status: 'loading' }
  | { status: 'ok'; data: T }
  | { status: 'error'; message: string };</code></pre>
<p>比起三個分開的變數 <code>loading</code>、<code>data</code>、<code>error</code>（它們有 8 種組合，包括「正在載入，同時又有錯誤，同時又有資料」），一個 <code>Remote&lt;Player&gt;</code> 只有 3 種可能。在 Vue 裡把它放進 <code>ref</code>，模板裡用 <code>v-if="state.status === 'ok'"</code> 判斷之後，Vue 的型別工具在那個區塊裡也會把 <code>state.data</code> 當成存在。</p>
<h4>取捨</h4>
<ul>
<li><b>聯集是封閉的</b>：所有種類都列在一個地方，加一種就要改所有 <code>switch</code>，檢查器會幫你找。類別繼承則是開放的：加一種新的子類別，不用動既有程式，但也沒有人提醒你哪裡漏了。種類由你掌控、會一起改的（遊戲狀態、訊息種類），用聯集；要讓別人擴充的（外掛、模組），用類別或介面。</li>
<li><b>共同欄位會重複</b>：上面每一種都寫了 <code>best</code>。種類多時，可以抽出 <code>type Base = { best: number }</code>，再寫成 <code>Base &amp; ({ phase: 'idle' } | ...)</code>，但可讀性會差一點。</li>
<li><b>執行時沒有保護</b>：型別擋得住你的程式碼寫出 <code>{ phase: 'idle', next: 3 }</code>，擋不住伺服器送來這種東西，也擋不住 <code>(g as any).phase = 'over'</code>。資料進來的地方，照樣要驗證。</li>
</ul>

<h3><span class="badge lv3">專業</span>五、enum 拆開來看</h3>
<p>講值與型別那一課的深入圖解說過，enum 是少數「不會被擦掉」的語法。看看它到底變成了什麼：</p>
<pre><code>// tsc 的輸出：enum Direction { Up, Down }
var Direction;
(function (Direction) {
    Direction[Direction["Up"] = 0] = "Up";
    Direction[Direction["Down"] = 1] = "Down";
})(Direction || (Direction = {}));</code></pre>
<p>中間那兩行值得慢慢讀。<code>Direction["Up"] = 0</code> 是一個指派運算式，它的值是 0；所以外面那一層其實是 <code>Direction[0] = "Up"</code>。一行做了兩件事：名字對到數字，數字也對回名字。這叫<b>反向對應</b>（reverse mapping）。</p>
<figure class="figure"><svg viewBox="0 0 680 256" class="fg" style="width:100%;max-width:680px" role="img" aria-label="三種 enum 的輸出：數字 enum 變成有正向和反向對應的物件，共四個鍵；字串 enum 只有正向對應；const enum 沒有物件，用到的地方直接換成數字">
<text x="120" y="24" text-anchor="middle" class="fg-t sm mono">enum Direction { Up, Down }</text>
<text x="344" y="24" text-anchor="middle" class="fg-t sm mono">enum Level { Easy = 'easy' }</text>
<text x="568" y="24" text-anchor="middle" class="fg-t sm mono">const enum Dir { Up, Down }</text>
<rect x="16" y="36" width="208" height="176" rx="8" class="fg-b"/>
<rect x="28" y="48" width="184" height="72" rx="5" class="fg-b hot"/><text x="40" y="70" class="fg-t sm">名字 → 數字</text><text x="40" y="90" class="fg-t sm mono">Up: 0</text><text x="40" y="110" class="fg-t sm mono">Down: 1</text>
<rect x="28" y="128" width="184" height="72" rx="5" class="fg-b warm"/><text x="40" y="150" class="fg-t sm">數字 → 名字（反向）</text><text x="40" y="170" class="fg-t sm mono">'0': 'Up'</text><text x="40" y="190" class="fg-t sm mono">'1': 'Down'</text>
<rect x="240" y="36" width="208" height="176" rx="8" class="fg-b"/>
<rect x="252" y="48" width="184" height="72" rx="5" class="fg-b hot"/><text x="264" y="70" class="fg-t sm">名字 → 字串</text><text x="264" y="98" class="fg-t sm mono">Easy: 'easy'</text>
<text x="344" y="160" text-anchor="middle" class="fg-t sm">沒有反向對應</text>
<text x="344" y="182" text-anchor="middle" class="fg-t sm">日誌裡看得懂</text>
<rect x="464" y="36" width="208" height="176" rx="8" class="fg-b dash"/>
<text x="568" y="70" text-anchor="middle" class="fg-t sm">輸出裡沒有物件</text>
<text x="568" y="106" text-anchor="middle" class="fg-t mono">Dir.Down</text>
<line x1="568" y1="116" x2="568" y2="142" class="fg-l alt"/><polygon points="568,150 563.5,142 572.5,142" class="fg-a alt"/>
<text x="568" y="176" text-anchor="middle" class="fg-t sm mono">1 /* Dir.Down */</text>
<text x="120" y="240" text-anchor="middle" class="fg-t sm warm">Object.keys 拿到 4 個鍵</text>
<text x="344" y="240" text-anchor="middle" class="fg-t sm">一個鍵對一個值</text>
<text x="568" y="240" text-anchor="middle" class="fg-t sm alt">用到的地方直接換成值</text>
</svg><figcaption>同樣叫 enum，輸出差很多。數字 enum 的物件裡，名字和數字各佔一半的鍵；const enum 則完全消失，只在用到的地方留下一個數字和一段註解。</figcaption></figure>
<pre><code>enum Direction { Up, Down }
let d: Direction = Direction.Up;
d = 1;         // 可以：1 是 Down 的值
d = 42;        // 錯誤：超出範圍的字面值（5.0 起）
const n: number = 42;
d = n;         // 可以：一般的 number 還是放得進去

console.log(Object.keys(Direction));
// ['0', '1', 'Up', 'Down']：數字鍵也混在裡面

enum Level { Easy = 'easy', Hard = 'hard' }
let l: Level = Level.Hard;
l = 'hard';    // 錯誤：字串 enum 不收普通字串</code></pre>
<p>這段程式把 enum 的三個怪脾氣都露出來了：</p>
<ol>
<li><b>數字 enum 不夠嚴</b>：任何 <code>number</code> 型別的值都放得進去，只有明顯超出範圍的字面值（5.0 版以後）會被擋。原因是數字 enum 常被拿來做位元旗標（bit flags），<code>Perm.Read | Perm.Write</code> 算出來的是一個不在清單上的數字，必須放得進去。</li>
<li><b>迭代會踩到反向對應</b>：想用 <code>Object.keys</code> 或 <code>Object.values</code> 列出所有方向做成選單，會多出一半莫名其妙的東西。</li>
<li><b>字串 enum 太嚴</b>：它是 TypeScript 裡少數「看名字」的型別，<code>'hard'</code> 這個一模一樣的字串也放不進 <code>Level</code>。從 API 拿到的 JSON 裡是普通字串，每次都得轉換或斷言。</li>
</ol>
<h4>const enum：快，但會咬人</h4>
<p><code>const enum</code> 在輸出裡完全消失，用到的地方直接換成值，沒有物件、沒有額外的程式碼。聽起來很完美，問題是：要換成值，編譯器得先讀到 enum 宣告所在的那個檔案。Vite 用的 esbuild、Babel、Node.js 的型別剝除，都是一次只看一個檔案，看不到別的檔案裡的 const enum 是什麼。所以打開 <code>isolatedModules</code> 時，檢查器會對這種用法報錯。函式庫如果在公開的型別裡匯出 const enum，使用者的建置工具也可能壞掉。官方手冊裡有一整段專門講 const enum 的陷阱，重點大致是：不要在公開的函式庫裡匯出它；在自己的專案裡用，也要先確定建置流程不是「一次只看一個檔」。</p>
<h4>erasableSyntaxOnly：官方也往「只剩型別」的方向走</h4>
<pre><code>// @erasableSyntaxOnly: true
enum Level { Easy, Hard }   // 錯誤 TS1294

namespace Util {            // 錯誤：有執行時的值
  export const max = 10;
}
namespace Shapes {          // 只有型別：可以
  export type Card = { rank: number };
}

class Hero {
  constructor(public name: string) {}   // 錯誤
}</code></pre>
<p>TypeScript 5.8 加了 <code>erasableSyntaxOnly</code>。打開之後，所有「不能單純擦掉」的語法都會報錯：enum（包括 const enum）、帶有值的 namespace、建構子的參數屬性等等。它的動機寫在 5.8 的發布說明裡：Node.js 已經可以直接執行 .ts 檔，做法是把型別擦掉、其他原封不動；這些語法沒辦法用「擦掉」處理。打開這個選項，你的程式就能被任何只會剝除型別的工具正確執行。想用 Node.js 直接跑 .ts、或整個建置只靠 esbuild 這類工具的專案，很適合打開它。</p>
<h4>替代寫法：字面值聯集，加上 as const 物件</h4>
<pre><code>const Level = { Easy: 'easy', Hard: 'hard' } as const;
type Level = (typeof Level)[keyof typeof Level];
// type Level = 'easy' | 'hard'

function setLevel(l: Level) {}
setLevel(Level.Easy);   // 可以，寫法跟 enum 一樣
setLevel('hard');       // 也可以：普通字串放得進去

const all = Object.values(Level);   // 只有兩個值</code></pre>
<p>同一個名字 <code>Level</code> 同時當值和型別，是合法的（TypeScript 把值和型別放在兩個不同的命名空間）。這樣寫，呼叫端的寫法跟 enum 一樣是 <code>Level.Easy</code>，同時得到：輸出就是一個普通物件、普通字串放得進去、<code>Object.values</code> 不會多出東西、也符合 <code>erasableSyntaxOnly</code>。這就是為什麼越來越多團隊的規範寫著「不用 enum」。</p>
<table>
<tr><th>需求</th><th>建議</th></tr>
<tr><td>一組固定的選項，只在型別裡用</td><td>字面值聯集 <code>'easy' | 'hard'</code></td></tr>
<tr><td>還要在執行時列出所有選項（選單、驗證）</td><td><code>as const</code> 陣列或物件，再取出型別</td></tr>
<tr><td>位元旗標、要跟 C# 或協定的數字對齊</td><td>數字 enum 仍然合理，或用 <code>as const</code> 的數字常數</td></tr>
<tr><td>維護既有的 enum 程式碼</td><td>看得懂就好，不必急著改；新程式碼再換</td></tr>
</table>

<h3><span class="badge lv4">專家</span>六、檢查器怎麼縮小，以及它在哪裡會追丟</h3>
<p>講值與型別那一課說過，繫結器（binder）會幫程式畫出一張「流程圖」。圖上的節點是指派、條件判斷、合流點。檢查器要知道「這一行的 x 是什麼型別」時，會從這一行出發，<b>沿著流程圖往回走</b>：遇到指派，就用指派進去的值；遇到條件，就套用那個條件的縮小；遇到合流點，就分頭往每一條來路找，最後把結果聯集起來。</p>
<figure class="figure"><svg viewBox="0 0 660 292" class="fg" style="width:100%;max-width:660px" role="img" aria-label="流程圖：x 宣告為 string 或 number，經過 typeof 判斷，是 string 的那條路把 x 改成 x.length，另一條路 x 本來就是 number，兩條路在 use(x) 合流，結果是 number">
<rect x="100" y="16" width="320" height="36" rx="6" class="fg-b"/><text x="260" y="39" text-anchor="middle" class="fg-t sm mono">let x: string | number = input();</text>
<line x1="260" y1="52" x2="260" y2="72" class="fg-l"/><polygon points="260,80 255.5,72 264.5,72" class="fg-a"/>
<rect x="150" y="80" width="220" height="36" rx="6" class="fg-b"/><text x="260" y="103" text-anchor="middle" class="fg-t sm mono">typeof x === 'string' ?</text>
<line x1="330" y1="116" x2="330" y2="144" class="fg-l on"/><polygon points="330,152 325.5,144 334.5,144" class="fg-a on"/><text x="340" y="138" class="fg-t sm acc">是：x 是 string</text>
<rect x="270" y="152" width="180" height="36" rx="6" class="fg-b hot"/><text x="360" y="175" text-anchor="middle" class="fg-t sm mono">x = x.length;</text>
<line x1="360" y1="188" x2="360" y2="228" class="fg-l on"/><polygon points="360,236 355.5,228 364.5,228" class="fg-a on"/><text x="370" y="216" class="fg-t sm acc">指派後：number</text>
<path d="M150 98 H120 V228" class="fg-l alt"/><polygon points="120,236 115.5,228 124.5,228" class="fg-a alt"/><text x="112" y="170" text-anchor="end" class="fg-t sm alt">否：x 是 number</text>
<rect x="100" y="236" width="320" height="36" rx="6" class="fg-b alt"/><text x="114" y="259" class="fg-t mono">use(x);</text><text x="406" y="259" text-anchor="end" class="fg-t sm">合流點：number | number</text>
<rect x="484" y="80" width="164" height="132" rx="6" class="fg-b"/>
<text x="496" y="102" class="fg-t sm">檢查器怎麼算這裡的 x</text>
<text x="496" y="128" class="fg-t sm">1 從 use(x) 往回走</text>
<text x="496" y="150" class="fg-t sm">2 遇到合流點，分頭找</text>
<text x="496" y="172" class="fg-t sm">3 兩條路都是 number</text>
<text x="496" y="194" class="fg-t sm acc">結果：x 是 number</text>
</svg><figcaption>同一個變數，在不同的位置有不同的型別。宣告型別是 string | number，但在 use(x) 這一行，兩條來路都只可能是 number。</figcaption></figure>
<pre><code>declare function input(): string | number;
declare function use(n: number): void;

let x: string | number = input();
if (typeof x === 'string') {
  x = x.length;
}
use(x);   // 可以：這裡的 x 是 number</code></pre>
<p>這裡要分清楚兩個概念：<b>宣告型別</b>（declared type）是 <code>string | number</code>，決定「這個變數可以放什麼」；<b>縮小後的型別</b>（narrowed type）是某一個位置上「它實際上可能是什麼」。指派時檢查的是宣告型別，讀取時用的是縮小後的型別。</p>
<h4>它會追丟的地方</h4>
<p>控制流程分析是一個工程上的取捨：要完全精確，就得分析每一個函式呼叫可能改了什麼，那會慢到不能用。所以檢查器做了幾個「樂觀的假設」，你得知道它們在哪：</p>
<pre><code>const game: { score?: number } = { score: 3 };
function reset() { game.score = &#117;ndefined; }

if (game.score !== &#117;ndefined) {
  reset();
  game.score.toFixed(0);   // 檢查器沒意見；執行時當掉
}</code></pre>
<p><b>函式呼叫不會讓屬性的縮小失效。</b>檢查器假設 <code>reset()</code> 沒有動到 <code>game.score</code>，所以縮小的結果保留下來。這是刻意的選擇：如果每次呼叫函式都把所有縮小作廢，幾乎所有程式都要重複檢查。實務上的對策是：先把值取出來放進 <code>const</code>，再對 <code>const</code> 做檢查和使用。<code>const</code> 不會被任何人改，縮小永遠可靠。</p>
<pre><code>function later(v: string | &#117;ndefined) {
  let a = v;
  if (a !== &#117;ndefined) {
    setTimeout(() =&gt; a.length);   // 錯誤：a 之後又被改
  }
  a = &#117;ndefined;

  const b = v;
  if (b !== &#117;ndefined) {
    setTimeout(() =&gt; b.length);   // 可以：const 不會變
  }
}</code></pre>
<p><b>回呼函式裡的縮小</b>：回呼函式可能在很久以後才執行，到時候 <code>let</code> 變數可能已經被改掉了。TypeScript 5.4 起，如果檢查器看得出這個 <code>let</code> 在建立回呼之後就再也沒被指派，會保留縮小；只要後面還有指派（像上面的 <code>a = &#117;ndefined</code>），回呼裡就回到宣告型別。一樣的對策：用 <code>const</code>。</p>
<p>其他值得知道的進展：5.3 起 <code>switch (true)</code> 的每個 case 條件可以縮小；5.5 起 <code>obj[key]</code> 在 <code>key</code> 是 const 的時候也能縮小。如果你的團隊卡在比較舊的版本，這些寫法在舊版會報錯，這不是你寫錯了。</p>
<h4>效能：大聯集不是免費的</h4>
<p>判斷「A 能不能指派給聯集 B」，最直接的做法是拿 A 去跟 B 的每一個成員比。兩個聯集互相比，就是成員數相乘。檢查器有不少最佳化（例如可辨識聯集會先用辨識屬性快速找到對應的成員，也會快取比較過的結果），但幾百個成員的聯集，或用樣板字面值型別（template literal type）組出成千上萬個字串的聯集，仍然會讓編輯器明顯變慢，組合太多時還會直接報 TS2590「Expression produces a union type that is too complex to represent」。遇到這種情況，通常代表該用 <code>string</code> 加上執行時驗證，而不是把所有可能都列進型別。</p>
<h4>資安：辨識屬性不能相信客戶端</h4>
<p>可辨識聯集很適合描述網路訊息：<code>{ type: 'guess'; guess: Guess }</code>、<code>{ type: 'chat'; text: string }</code>。但伺服器收到的永遠是一串 JSON，<code>type</code> 欄位是客戶端自己寫的。三個原則：</p>
<ol>
<li><b>先驗證，再縮小</b>：收到的東西先當成 <code>unknown</code>，用型別守衛確認 <code>type</code> 是已知的值，而且<b>那一種</b>該有的欄位都在、型別正確，才把它當成 <code>ClientMessage</code>。未知的 <code>type</code> 記錄下來並拒絕，不要讓它走進 <code>default</code> 以外的任何分支。</li>
<li><b>狀態由伺服器決定</b>：遊戲的 <code>phase</code>、<code>score</code>、抽出的牌，都由伺服器的 <code>step</code> 函式算出來。客戶端只送「動作」（我猜 higher），不送「結果」（我現在 99 分）。前面那個 <code>step</code> 的設計，剛好讓同一份規則可以放在伺服器上跑。</li>
<li><b>不要讓客戶端選分支</b>：像 <code>{ type: 'admin_reset' }</code> 這種只該由後台觸發的動作，不要和玩家的動作放在同一個聯集、同一個處理函式裡，免得一個偽造的 <code>type</code> 就走進了不該走的分支。</li>
</ol>

<h3>七、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>聯集型別可以用任何一個成員的方法</td><td>只能用所有成員都有的。要用其中一種才有的，先縮小。</td></tr>
<tr><td><code>typeof x === 'object'</code> 之後 x 就不是 null</td><td><code>typeof null</code> 也是 <code>'object'</code>，要再檢查 <code>x !== null</code>。</td></tr>
<tr><td>型別守衛有被檢查器驗證過</td><td>檢查器完全相信 <code>x is T</code>，函式本體寫錯它也不會發現。</td></tr>
<tr><td>函式少了 return 就會提醒我漏了 case</td><td>回傳 void 或 switch 後還有程式碼時不會。用 <code>assertNever</code> 才可靠。</td></tr>
<tr><td>enum 就跟字面值聯集一樣</td><td>enum 會產生程式碼；數字 enum 有反向對應而且收任何 number；字串 enum 不收普通字串。</td></tr>
<tr><td>const enum 一定比較好，因為沒有輸出</td><td>只拿掉型別的工具（esbuild、Babel、Node.js）處理不了跨檔案的 const enum。</td></tr>
<tr><td>縮小過的變數，在 if 裡面就一定是那個型別</td><td>屬性在函式呼叫之後、<code>let</code> 在回呼裡，都可能已經變了。檢查器在某些情況會樂觀地假設沒變。</td></tr>
</table>

<h3>八、跟你的工作連起來</h3>
<ul>
<li><b>Vue</b>：<code>defineProps&lt;{ size: 'small' | 'large' }&gt;()</code> 讓父元件在模板裡打錯字就被抓到。畫面狀態（載入中、成功、失敗）用一個可辨識聯集的 <code>ref</code>，取代三個 boolean。Pinia 的 store 也一樣：<code>state</code> 裡放一個聯集型別的欄位，<code>actions</code> 裡呼叫 <code>step</code> 來更新它。</li>
<li><b>Cocos Creator</b>：遊戲流程（標題、遊戲中、結算）用聯集描述，<code>update(dt)</code> 裡 <code>switch (this.state.phase)</code>，每個階段只碰得到該階段的欄位。要在 Cocos 編輯器的屬性面板上顯示下拉選單，得用 Cocos 的 <code>Enum()</code> 包一個 TypeScript enum，所以那種地方仍然會用到 enum；純粹程式邏輯裡的狀態，用字面值聯集就好。</li>
<li><b>Node.js 後端</b>：WebSocket 或 HTTP 收到的訊息定義成 <code>ClientMessage</code> 聯集，驗證之後用 <code>switch (msg.type)</code> 分派，<code>default</code> 用 <code>assertNever</code>。新增一種訊息時，檢查器會告訴你哪些地方要補。</li>
<li><b>跨語言</b>：同樣的觀念在別的語言也有：Rust 和 Swift 的 enum（帶資料的那種）、C# 的模式比對、Go 用介面加 type switch。在 TypeScript 學會「用型別描述狀態」，換語言也帶得走。</li>
</ul>

<h3>九、面試會怎麼問</h3>
<p>先自己講一遍（最好出聲講），再打開參考答案。</p>
<ol>
<li>「什麼是可辨識聯集？怎麼用 never 做窮舉檢查？」</li>
<li>「TypeScript 有哪些縮小型別的方法？使用者自訂的型別守衛有什麼風險？」</li>
<li>「為什麼很多團隊不用 enum？數字 enum 和字串 enum 各有什麼問題？」</li>
<li>「const enum 為什麼會跟 Vite、Babel 這類工具衝突？」</li>
<li>「請用型別設計一個畫面的載入狀態，讓『載入中又有錯誤』這種狀態寫不出來。」</li>
<li>「為什麼在 if 裡檢查過 <code>obj.x !== &#117;ndefined</code>，呼叫一個函式之後 <code>obj.x</code> 還是被當成有值？這安全嗎？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>每個成員都有同一個字面值型別的屬性（辨識屬性），比較這個屬性就能把聯集縮小成單一成員。窮舉檢查是在 switch 的 default 把值傳給參數型別為 never 的函式：所有成員都處理過，剩下的就是 never，可以通過；漏了某一種，剩下的那一種放不進 never，編譯時報錯，而且錯誤訊息會指出漏掉的是哪一種。執行時這個函式丟例外，也能抓到伺服器送來的未知種類。</li>
<li>typeof、真假值、相等比較（含 == null）、in、instanceof、指派、辨識屬性比較、回傳 x is T 的型別守衛、asserts 斷言函式；另外還有存成 const 的條件、解構後的辨識屬性、filter 自動推論的型別守衛。型別守衛的風險在於檢查器完全相信它的回傳值，本體寫錯也不會被發現，所以守衛要寫得簡單、要有單元測試，邊界資料最好用成熟的驗證函式庫。</li>
<li>enum 會產生執行時的程式碼，不符合「只擦掉型別」的工具鏈，在 erasableSyntaxOnly 下是錯誤。數字 enum 有反向對應，Object.keys 會多出數字鍵，而且任何 number 都放得進去，型別保護弱；字串 enum 是名義型別，普通字串放不進去，處理 API 資料時要一直轉換。字面值聯集加上 as const 物件能做到同樣的事，又沒有這些問題。</li>
<li>const enum 需要在編譯時把成員換成值，這要讀到宣告它的檔案。esbuild、Babel、Node.js 的型別剝除一次只處理一個檔案，看不到別的檔案裡的定義，所以無法內聯。isolatedModules 會把這種情況報成錯誤；函式庫公開 const enum 也可能讓使用者的建置失敗。</li>
<li>寫成可辨識聯集：<code>{ status: 'loading' } | { status: 'ok'; data: T } | { status: 'error'; message: string }</code>。相比三個獨立的 loading、data、error 變數有 8 種組合，這個型別只有 3 種合法狀態；data 只存在於 ok，message 只存在於 error，模板或程式在判斷 status 之後才拿得到。</li>
<li>控制流程分析假設函式呼叫不會改變已縮小的屬性，這是為了實用性做的取捨，不完全安全：那個函式確實可能把 obj.x 改成 &#117;ndefined。對策是先把值存進 const 再檢查和使用，或在呼叫之後重新檢查。</li>
</ol>
</details>

<h3>十、練功題（做得出來才算真的懂）</h3>
<ol>
<li>幫 <code>Remote&lt;T&gt;</code> 寫一個 <code>render(state: Remote&lt;string[]&gt;): string</code>：loading 顯示「載入中」，ok 顯示清單用逗號接起來，error 顯示訊息。用 <code>assertNever</code> 收尾，再加一種 <code>{ status: 'empty' }</code>，看錯誤出現在哪裡。</li>
<li>寫一個型別守衛 <code>isGuessMessage(x: unknown): x is { type: 'guess'; guess: Guess }</code>。用三個輸入測試它：一個正確的、一個 <code>guess</code> 是 <code>'sideways'</code> 的、一個 <code>null</code>。</li>
<li>在 Playground 寫 <code>enum Suit { Hearts, Spades }</code>，打開 .JS 分頁，用你自己的話解釋 <code>Suit[Suit["Hearts"] = 0] = "Hearts"</code> 這一行做了哪兩件事。再把它改寫成 <code>as const</code> 物件加型別的寫法，對照兩邊的輸出。</li>
<li>幫第四節的 <code>Game</code> 加一個 <code>paused</code> 階段（從 guessing 按 pause 進入，按 resume 回到 guessing，而且要記得暫停前的 current 和 score）。先改型別，讓檢查器告訴你 <code>step</code> 哪裡要補。</li>
<li>把第六節「函式呼叫之後還被當成有值」的例子貼進 Playground，確認沒有紅線，再改成先存進 <code>const</code> 的寫法，說明為什麼後者是安全的。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li><code>switch (state.status) { case 'loading': return '載入中'; case 'ok': return state.data.join(', '); case 'error': return state.message; default: return assertNever(state); }</code>。加了 empty 之後，錯誤出現在 <code>assertNever(state)</code> 那一行，訊息會寫著 <code>{ status: "empty"; }</code> 放不進 never。</li>
<li>先確認 <code>typeof x === 'object' &amp;&amp; x !== null</code>，再確認 <code>'type' in x &amp;&amp; x.type === 'guess'</code>，最後確認 <code>'guess' in x &amp;&amp; (x.guess === 'higher' || x.guess === 'lower')</code>。三個輸入分別回傳 true、false、false。注意：只檢查 <code>type</code> 不檢查 <code>guess</code> 的守衛，會讓 'sideways' 混進來。</li>
<li>內層 <code>Suit["Hearts"] = 0</code> 設定名字到數字，這個運算式的值是 0；外層用這個 0 當鍵，設定數字到名字。改寫：<code>const Suit = { Hearts: 'hearts', Spades: 'spades' } as const; type Suit = (typeof Suit)[keyof typeof Suit];</code>，輸出只剩一行普通的物件。</li>
<li>型別加上 <code>{ phase: 'paused'; best: number; current: number; score: number }</code>，Action 加上 pause 和 resume。檢查器會在 default 的 <code>assertNever(g)</code> 報錯，指出 paused 沒處理；guessing 分支裡也要加上收到 pause 時的轉換。</li>
<li>Playground 不會畫紅線，但執行會丟 TypeError。改成 <code>const s = game.score; if (s !== &#117;ndefined) { reset(); s.toFixed(0); }</code> 之後，<code>s</code> 是一個不會被任何人改的區域常數，裡面的值在檢查的那一刻就固定了，<code>reset()</code> 改的是物件上的屬性，碰不到 <code>s</code>。</li>
</ol>
</details>

<h3>十一、想再挖深</h3>
<ul>
<li><b>TypeScript Handbook：Narrowing</b>（<a href="https://www.typescriptlang.org/docs/handbook/2/narrowing.html">typescriptlang.org/docs/handbook/2/narrowing.html</a>）：官方對每一種縮小方式、可辨識聯集和窮舉檢查的完整說明。</li>
<li><b>TypeScript Handbook：Enums</b>（<a href="https://www.typescriptlang.org/docs/handbook/enums.html">typescriptlang.org/docs/handbook/enums.html</a>）：反向對應、const enum 的陷阱，官方自己寫的那一段值得讀。</li>
<li><b>TypeScript 5.8 發布說明</b>（typescriptlang.org 的 Release Notes）：<code>erasableSyntaxOnly</code> 的動機和完整規則。</li>
<li><b>Richard Feldman「Making Impossible States Impossible」</b>（elm-conf 2016 的演講，YouTube 上有）：「讓不可能的狀態不可能」這句話的出處，例子是 Elm，觀念完全適用於 TypeScript。</li>
<li><b>Scott Wlaschin《Domain Modeling Made Functional》</b>：用型別描述商業規則的經典，例子是 F#，第四節的建模方式在這本書裡有完整的方法論。</li>
</ul>
` });
