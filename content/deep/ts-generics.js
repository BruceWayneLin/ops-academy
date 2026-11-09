DEEP({ 'ts-generics': `
<p>上一課的泛型，是「標籤先空著的盒子」。這一章換一個更有力的看法：<b>泛型是型別層的函式</b>，收型別、吐型別。用這個角度，我們依序拆開：檢查器怎麼猜出 <code>T</code>、條件約束和預設值、<code>keyof</code> 與索引存取、怎麼自己做出 <code>Partial</code>、<code>Pick</code>、<code>Record</code>、條件型別和 <code>infer</code>、什麼時候泛型反而讓程式更糟，最後是「變異性」，以及把 Vue 的 <code>ref</code> 型別宣告一層一層剝開。讀完，函式庫型別裡那些尖括號，你都能自己解。</p>

<h3><span class="badge lv1">基礎</span>一、泛型是型別層的函式</h3>
<p>一般函式收「值」、回傳「值」。泛型收「型別」、回傳「型別」。<code>type Box&lt;T&gt; = { value: T }</code> 就是一個型別層的函式：給它 <code>string</code>，它吐出 <code>{ value: string }</code>。泛型函式則是兩層同時跑：值那一層在執行時跑，型別那一層在編譯時跑。</p>
<figure class="figure"><svg viewBox="0 0 660 240" class="fg" style="width:100%;max-width:660px" role="img" aria-label="三列對照：執行時 first 收陣列回傳第一個值；編譯時 first 收型別 number 回傳 number 或 &#117;ndefined；型別別名 Box 收 string 回傳 value 是 string 的物件型別">
<text x="180" y="20" text-anchor="middle" class="fg-t sm">輸入</text>
<text x="370" y="20" text-anchor="middle" class="fg-t sm">函式</text>
<text x="570" y="20" text-anchor="middle" class="fg-t sm">輸出</text>
<text x="12" y="63" class="fg-t sm">執行時的值</text>
<rect x="120" y="34" width="120" height="50" rx="6" class="fg-b"/><text x="180" y="64" text-anchor="middle" class="fg-t mono">[3, 7, 9]</text>
<rect x="280" y="34" width="180" height="50" rx="6" class="fg-b"/><text x="370" y="64" text-anchor="middle" class="fg-t sm mono">function first(items)</text>
<rect x="492" y="34" width="156" height="50" rx="6" class="fg-b"/><text x="570" y="64" text-anchor="middle" class="fg-t mono">3</text>
<line x1="240" y1="59" x2="272" y2="59" class="fg-l"/><polygon points="280,59 272,54.5 272,63.5" class="fg-a"/>
<line x1="460" y1="59" x2="484" y2="59" class="fg-l"/><polygon points="492,59 484,54.5 484,63.5" class="fg-a"/>
<text x="12" y="133" class="fg-t sm">編譯時 first</text>
<rect x="120" y="104" width="120" height="50" rx="6" class="fg-b alt"/><text x="180" y="134" text-anchor="middle" class="fg-t mono">T = number</text>
<rect x="280" y="104" width="180" height="50" rx="6" class="fg-b alt"/><text x="370" y="124" text-anchor="middle" class="fg-t sm mono">first&lt;T&gt;</text><text x="370" y="142" text-anchor="middle" class="fg-t sm mono">T[] → T | &#117;ndefined</text>
<rect x="492" y="104" width="156" height="50" rx="6" class="fg-b hot"/><text x="570" y="134" text-anchor="middle" class="fg-t sm mono">number | &#117;ndefined</text>
<line x1="240" y1="129" x2="272" y2="129" class="fg-l alt"/><polygon points="280,129 272,124.5 272,133.5" class="fg-a alt"/>
<line x1="460" y1="129" x2="484" y2="129" class="fg-l alt"/><polygon points="492,129 484,124.5 484,133.5" class="fg-a alt"/>
<text x="12" y="203" class="fg-t sm">編譯時 Box</text>
<rect x="120" y="174" width="120" height="50" rx="6" class="fg-b alt"/><text x="180" y="204" text-anchor="middle" class="fg-t mono">string</text>
<rect x="280" y="174" width="180" height="50" rx="6" class="fg-b alt"/><text x="370" y="194" text-anchor="middle" class="fg-t sm mono">type Box&lt;T&gt; =</text><text x="370" y="212" text-anchor="middle" class="fg-t sm mono">{ value: T }</text>
<rect x="492" y="174" width="156" height="50" rx="6" class="fg-b hot"/><text x="570" y="204" text-anchor="middle" class="fg-t sm mono">{ value: string }</text>
<line x1="240" y1="199" x2="272" y2="199" class="fg-l alt"/><polygon points="280,199 272,194.5 272,203.5" class="fg-a alt"/>
<line x1="460" y1="199" x2="484" y2="199" class="fg-l alt"/><polygon points="492,199 484,194.5 484,203.5" class="fg-a alt"/>
</svg><figcaption>第一列在瀏覽器裡跑；下面兩列只在編譯器裡跑，編譯完就消失。型別參數 T 就是型別層函式的參數。</figcaption></figure>
<p>「編譯完就消失」這件事叫<b>型別擦除</b>（type erasure）。不管你用幾種 <code>T</code> 呼叫 <code>first</code>，產生的 JavaScript 永遠只有一個 <code>first</code>。各語言在這點上差很多，面試很愛問：</p>
<table>
<tr><th>語言</th><th>泛型在執行時</th><th>結果</th></tr>
<tr><td>TypeScript、Java</td><td>擦除，不存在</td><td>不能 <code>new T()</code>、不能 <code>x instanceof T</code></td></tr>
<tr><td>C#（Unity）</td><td>保留（reified）</td><td>可以 <code>typeof(T)</code>、<code>GetComponent&lt;T&gt;()</code> 直接用 T</td></tr>
<tr><td>C++、Rust</td><td>每種型別各產生一份程式碼</td><td>最快，但執行檔會變大</td></tr>
</table>
<p>所以在 TypeScript 裡，凡是「執行時需要知道 T 是什麼」的地方，都要把一個真的值傳進去：類別本身、一個型別守衛、一個字串標籤。Cocos 的 <code>getComponent(Sprite)</code> 收的就是類別，不是型別。</p>
<p>順帶一提型別參數的名字。慣例是一個大寫字母：T（type）、K（key）、V（value）、E（element 或 event）、R（return）。參數只有一兩個、意思一看就懂時，用單字母；參數一多、或意思不明顯時，改用有意義的名字，例如 <code>TEvents</code>、<code>TItem</code>。名字只是寫給人看的，編譯器不在乎。</p>

<h3><span class="badge lv2">進階</span>二、檢查器怎麼猜出 T</h3>
<p>呼叫泛型函式時沒寫尖括號，TypeScript 會自己推斷<b>型別引數</b>（type argument）。過程大致是：</p>
<ol>
<li>看每一個參數的型別裡有沒有出現 <code>T</code>，有的話，拿實際傳進來的引數去對，收集「T 可能是什麼」的<b>候選</b>（candidate）。</li>
<li>沒標型別的回呼函式先跳過，因為它的參數型別要等 T 決定了才知道。</li>
<li>從候選裡選出 T，把它固定下來。</li>
<li>帶著固定好的 T，回頭處理剛才跳過的回呼，推斷其他型別參數。</li>
<li>用最後的結果檢查每一個引數，再算出回傳型別。</li>
</ol>
<pre><code>function mapA&lt;T, U&gt;(arr: T[], fn: (x: T) =&gt; U): U[] {
  return arr.map(fn);
}
const labels = mapA([1, 2, 3], (n) =&gt; n.toFixed(1));
// T = number，U = string，labels 是 string[]</code></pre>
<figure class="figure"><svg viewBox="0 0 660 260" class="fg" style="width:100%;max-width:660px" role="img" aria-label="推斷分兩輪：第一輪從陣列推出 T 是 number，跳過回呼；第二輪 T 固定後，回呼的 n 被推成 number，回傳 string，所以 U 是 string">
<rect x="120" y="14" width="420" height="32" rx="6" class="fg-b"/>
<text x="330" y="35" text-anchor="middle" class="fg-t sm mono">mapA([1, 2, 3], (n) =&gt; n.toFixed(1))</text>
<line x1="170" y1="46" x2="170" y2="72" class="fg-l"/><polygon points="170,80 165.5,72 174.5,72" class="fg-a"/>
<rect x="20" y="80" width="300" height="96" rx="8" class="fg-b alt"/>
<text x="36" y="102" class="fg-t">第 1 輪：先不看回呼</text>
<text x="36" y="124" class="fg-t sm mono">arr: T[]  對上  number[]</text>
<text x="36" y="144" class="fg-t sm acc">候選：T = number</text>
<text x="36" y="164" class="fg-t sm warm">n 沒標型別 → 先跳過</text>
<line x1="320" y1="128" x2="332" y2="128" class="fg-l"/><polygon points="340,128 332,123.5 332,132.5" class="fg-a"/>
<rect x="340" y="80" width="300" height="96" rx="8" class="fg-b"/>
<text x="356" y="102" class="fg-t">第 2 輪：T 固定之後</text>
<text x="356" y="124" class="fg-t sm">n 被推成 number</text>
<text x="356" y="144" class="fg-t sm mono">n.toFixed(1) 回傳 string</text>
<text x="356" y="164" class="fg-t sm acc">候選：U = string</text>
<line x1="490" y1="176" x2="490" y2="200" class="fg-l on"/><polygon points="490,208 485.5,200 494.5,200" class="fg-a on"/>
<rect x="180" y="208" width="340" height="40" rx="6" class="fg-b hot"/>
<text x="350" y="233" text-anchor="middle" class="fg-t acc">T = number、U = string → string[]</text>
</svg><figcaption>回呼函式的參數要靠 T 才知道型別，所以檢查器分兩輪：先從「看得到型別」的引數推出 T，再拿 T 去處理回呼。這叫情境型別（contextual typing）。</figcaption></figure>
<h4>候選打架的時候</h4>
<pre><code>function pair&lt;T&gt;(a: T, b: T): [T, T] {
  return [a, b];
}
pair(1, 2);                      // T = number
pair(1, 'x');                    // 錯誤：T 已經定成 number
pair&lt;number | string&gt;(1, 'x');   // 通過：自己填就好</code></pre>
<p>兩個候選 <code>number</code> 和 <code>string</code>，TypeScript 不會自動幫你合成聯集，因為大部分時候，「兩個參數型別不同」才是 bug。你真的要聯集，就自己寫型別引數。</p>
<h4>字面值會被放寬，除非你要求保留</h4>
<pre><code>function first&lt;T&gt;(items: readonly T[]): T | &#117;ndefined {
  return items[0];
}
function firstExact&lt;const T&gt;(items: readonly T[]) {
  return items[0];
}
const a = first(['Mia', 'Sam']);
// a 是 string | &#117;ndefined
const b = firstExact(['Mia', 'Sam']);
// b 是 'Mia' | 'Sam' | &#117;ndefined

function choose&lt;T extends string&gt;(
  options: T[],
  fallback: NoInfer&lt;T&gt;,
): T {
  return options[0] ?? fallback;
}
choose(['higher', 'lower'], 'lower');  // 通過
choose(['higher', 'lower'], 'same');   // 錯誤</code></pre>
<ul>
<li>預設情況下，<code>'Mia'</code> 這種字面值型別會被放寬成 <code>string</code>，因為陣列之後可能放別的名字進去。</li>
<li>TypeScript 5.0 的 <code>const</code> 型別參數，讓推斷像加了 <code>as const</code> 一樣保留字面值。條件約束是 <code>string</code> 這類基本型別時（例如 <code>T extends string</code>），字面值也會被保留。</li>
<li>TypeScript 5.4 的 <code>NoInfer&lt;T&gt;</code>，意思是「這個位置不要拿來推斷 T」。少了它，<code>'same'</code> 也會變成候選，T 被推成三個字串的聯集，錯誤就漏掉了。</li>
</ul>

<h3><span class="badge lv2">進階</span>三、條件約束、預設值、泛型類別</h3>
<p><b>條件約束</b>（constraint）是 T 的上限：「T 至少要是這個形狀」。在函式裡，你能用的只有約束保證的東西；但 T 本身仍然是呼叫者給的完整型別。這兩件事一起想，就能看懂泛型裡最讓人困惑的那個錯誤：</p>
<pre><code>function withDefault&lt;T extends { rank: number }&gt;(
  x?: T,
): T {
  return x ?? { rank: 1 };   // 錯誤 TS2322
}</code></pre>
<p>錯誤訊息很長，重點是這一句：「'{ rank: number; }' is assignable to the constraint of type 'T', but 'T' could be instantiated with a different subtype」。翻成白話：<code>{ rank: 1 }</code> 符合約束沒錯，可是呼叫者的 T 可能是 <code>{ rank: number; suit: string }</code>，你回傳一個沒有 suit 的東西，就騙了他。約束是「下限的保證」，不是「T 就等於它」。修法是讓回傳型別說實話（<code>T | { rank: number }</code>），或者讓呼叫者自己提供預設值。</p>
<h4>預設型別參數</h4>
<p><code>interface ApiResult&lt;T = unknown&gt;</code> 的意思是：沒人指定、也推斷不出來時，T 就用 <code>unknown</code>。規則跟函式的預設參數一樣：有預設值的型別參數要排在後面，否則是 TS2706 錯誤。能推斷時，推斷的結果優先於預設值。</p>
<h4>泛型類別：一個型別安全的事件系統</h4>
<p>類別的型別參數屬於每一個實例，所以 <code>static</code> 成員不能用它（TS2302），因為靜態成員只有一份，不知道該用哪個實例的 T。下面是遊戲和前端都很常見的事件匯流排，事件名稱和參數一起被檢查：</p>
<pre><code>type Listener&lt;A extends unknown[]&gt; = (...args: A) =&gt; void;

class Emitter&lt;E extends { [K in keyof E]: unknown[] }&gt; {
  private handlers: {
    [K in keyof E]?: Listener&lt;E[K]&gt;[];
  } = {};

  on&lt;K extends keyof E&gt;(
    name: K,
    fn: Listener&lt;E[K]&gt;,
  ): void {
    (this.handlers[name] ??= []).push(fn);
  }
  emit&lt;K extends keyof E&gt;(name: K, ...args: E[K]): void {
    this.handlers[name]?.forEach((fn) =&gt; fn(...args));
  }
}

interface GameEvents {
  guess: [choice: 'higher' | 'lower'];
  score: [points: number];
}
const bus = new Emitter&lt;GameEvents&gt;();
bus.on('score', (p) =&gt; console.log(p + 1));   // p 是 number
bus.emit('score', 3);
bus.emit('guess', 'same');                    // 錯誤</code></pre>
<p>注意那個條件約束：<code>E extends { [K in keyof E]: unknown[] }</code>，意思是「E 自己有的每一個鍵，值都要是陣列」。介面那一章說過，如果寫成 <code>Record&lt;string, unknown[]&gt;</code>，傳 <code>interface</code> 進來會因為沒有隱含索引簽章而報錯；這種寫法兩者都能用。</p>
<p>Vue 3.3 起，單檔元件也可以有型別參數：在 <code>&lt;script setup lang="ts" generic="T"&gt;</code> 裡，props 可以寫 <code>items: T[]</code>，emits 寫 <code>select: [item: T]</code>。父元件傳進一個 <code>Card[]</code>，T 就被推斷成 <code>Card</code>，選中時 emit 出來的也是 <code>Card</code>。這很適合清單、下拉選單、表格這種「內容是什麼都可以」的元件。規則跟函式一樣：T 要連起兩個以上的位置，才值得存在。</p>

<h3><span class="badge lv2">進階</span>四、keyof 與索引存取：在型別上查表</h3>
<pre><code>interface PlayerInfo {
  id: string;
  name: string;
  points: number;
}
// 'id' | 'name' | 'points'
type Keys = keyof PlayerInfo;
// number
type Pts = PlayerInfo['points'];
// string | number
type Vals = PlayerInfo[keyof PlayerInfo];

function getProp&lt;T, K extends keyof T&gt;(
  obj: T,
  key: K,
): T[K] {
  return obj[key];
}
const mia: PlayerInfo = {
  id: 'p1', name: 'Mia', points: 12,
};
const pts = getProp(mia, 'points');   // number
getProp(mia, 'score');                // 錯誤：沒有這個鍵

const SUITS = [
  'hearts', 'spades', 'clubs', 'diamonds',
] as const;
type Suit = (typeof SUITS)[number];   // 四種花色的聯集</code></pre>
<figure class="figure"><svg viewBox="0 0 640 210" class="fg" style="width:100%;max-width:640px" role="img" aria-label="把 PlayerInfo 看成一張表：keyof 取出鍵那一欄，PlayerInfo 加上 points 取出那一格的型別，用 keyof 索引則取出整個型別欄的聯集">
<rect x="200" y="20" width="240" height="30" rx="4" class="fg-b alt"/>
<text x="320" y="40" text-anchor="middle" class="fg-t mono">PlayerInfo</text>
<rect x="200" y="50" width="100" height="30" class="fg-b hot"/><text x="250" y="70" text-anchor="middle" class="fg-t mono">id</text>
<rect x="300" y="50" width="140" height="30" class="fg-b"/><text x="370" y="70" text-anchor="middle" class="fg-t mono">string</text>
<rect x="200" y="80" width="100" height="30" class="fg-b hot"/><text x="250" y="100" text-anchor="middle" class="fg-t mono">name</text>
<rect x="300" y="80" width="140" height="30" class="fg-b"/><text x="370" y="100" text-anchor="middle" class="fg-t mono">string</text>
<rect x="200" y="110" width="100" height="30" class="fg-b hot"/><text x="250" y="130" text-anchor="middle" class="fg-t mono">points</text>
<rect x="300" y="110" width="140" height="30" class="fg-b alt"/><text x="370" y="130" text-anchor="middle" class="fg-t mono">number</text>
<path d="M192 54 H184 V136 H192" class="fg-l on"/>
<text x="176" y="80" text-anchor="end" class="fg-t mono acc">keyof</text>
<text x="176" y="98" text-anchor="end" class="fg-t sm mono">'id' | 'name'</text>
<text x="176" y="114" text-anchor="end" class="fg-t sm mono">| 'points'</text>
<line x1="440" y1="125" x2="462" y2="125" class="fg-l alt"/>
<text x="468" y="121" class="fg-t sm mono">PlayerInfo['points']</text>
<text x="468" y="138" class="fg-t sm alt">→ number</text>
<path d="M304 148 V156 H436 V148" class="fg-l warm"/>
<text x="370" y="176" text-anchor="middle" class="fg-t sm mono">PlayerInfo[keyof PlayerInfo]</text>
<text x="370" y="194" text-anchor="middle" class="fg-t sm warm">→ string | number</text>
</svg><figcaption>把物件型別想成一張兩欄的表。keyof 拿走左邊整欄；T[K] 用一個鍵查右邊那一格；用一整個聯集當鍵去查，就拿到好幾格的聯集。</figcaption></figure>
<p>幾個你會常用的變化：</p>
<ul>
<li><b>陣列的元素型別</b>：<code>Card[][number]</code> 就是 <code>Card</code>，因為陣列是「用數字當鍵的表」。</li>
<li><b>從值推出型別</b>：<code>(typeof SUITS)[number]</code> 讓你只維護一份清單，型別自動跟著改。這是很多團隊用來取代 <code>enum</code> 的寫法。</li>
<li><b>索引簽章的 keyof</b>：<code>keyof { [k: string]: number }</code> 是 <code>string | number</code>，不是只有 <code>string</code>，因為 JavaScript 會把數字鍵轉成字串，<code>obj[1]</code> 和 <code>obj['1']</code> 是同一格。</li>
</ul>
<p>把 <code>keyof</code> 和索引存取放進同一個函式簽名，就能做出「鍵和值一起被檢查」的 API。遊戲存檔是很好的例子：</p>
<pre><code>interface SaveData {
  level: number;
  muted: boolean;
  best: Record&lt;string, number&gt;;
}

function load&lt;K extends keyof SaveData&gt;(
  key: K,
): SaveData[K] | &#117;ndefined {
  const raw = localStorage.getItem(key);
  if (raw === null) return &#117;ndefined;
  return JSON.parse(raw) as SaveData[K];
}

function save&lt;K extends keyof SaveData&gt;(
  key: K,
  value: SaveData[K],
): void {
  localStorage.setItem(key, JSON.stringify(value));
}

const level = load('level');   // number | &#117;ndefined
save('muted', true);
save('muted', 1);              // 錯誤：muted 要 boolean</code></pre>
<p>K 同時出現在參數和回傳值，這才是泛型該做的事：把「你給哪個鍵」和「你拿到什麼型別」綁在一起。注意 <code>load</code> 裡的 <code>as</code>：localStorage 裡的東西可能被玩家手動改過，或是舊版遊戲存的，這個 <code>as</code> 是一個信任假設。存檔格式會改版的話，讀出來最好還是驗證一次，跟介面那一章處理伺服器資料是同一件事。</p>

<h3><span class="badge lv3">專業</span>五、映射型別：自己做出 Partial、Readonly、Pick、Record</h3>
<p><b>映射型別</b>（mapped type）是型別層的 for 迴圈：<code>{ [K in 某個鍵的聯集]: 每個 K 對應的型別 }</code>。內建的<b>工具型別</b>（utility type）大部分就是一行映射型別，在 TypeScript 原始碼的 <code>lib.es5.d.ts</code> 裡都看得到。自己寫一次：</p>
<pre><code>type MyPartial&lt;T&gt; = { [K in keyof T]?: T[K] };
type MyReadonly&lt;T&gt; = { readonly [K in keyof T]: T[K] };
type MyPick&lt;T, K extends keyof T&gt; = { [P in K]: T[P] };
type MyRecord&lt;K extends keyof any, V&gt; = { [P in K]: V };
type MyRequired&lt;T&gt; = { [K in keyof T]-?: T[K] };
type Mutable&lt;T&gt; = { -readonly [K in keyof T]: T[K] };
type MyOmit&lt;T, K extends keyof any&gt; =
  MyPick&lt;T, Exclude&lt;keyof T, K&gt;&gt;;

interface Profile {
  readonly id: string;
  name: string;
  avatarUrl?: string;
}
const patch: MyPartial&lt;Profile&gt; = { name: 'Mia' };
patch.id = 'x';              // 錯誤：readonly 被保留下來了
// MyRequired 要求 avatarUrl 也要有
const req: MyRequired&lt;Profile&gt; = {  // 錯誤
  id: 'a', name: 'b',
};
const perSuit: MyRecord&lt;'hearts' | 'spades', number&gt; = {
  hearts: 3,
  spades: 0,
};</code></pre>
<figure class="figure"><svg viewBox="0 0 660 230" class="fg" style="width:100%;max-width:660px" role="img" aria-label="映射型別像迴圈：Profile 的三個鍵依序進入 K in keyof T，每一個都加上問號，輸出成 MyPartial 的三列">
<rect x="20" y="20" width="180" height="146" rx="8" class="fg-b"/>
<text x="110" y="42" text-anchor="middle" class="fg-t mono">Profile</text>
<rect x="32" y="54" width="156" height="28" rx="4" class="fg-b"/><text x="42" y="73" class="fg-t sm mono">readonly id: string</text>
<rect x="32" y="90" width="156" height="28" rx="4" class="fg-b"/><text x="42" y="109" class="fg-t sm mono">name: string</text>
<rect x="32" y="126" width="156" height="28" rx="4" class="fg-b"/><text x="42" y="145" class="fg-t sm mono">avatarUrl?: string</text>
<rect x="250" y="44" width="160" height="110" rx="8" class="fg-b hot"/>
<text x="330" y="68" text-anchor="middle" class="fg-t acc">對每一個 K</text>
<text x="330" y="94" text-anchor="middle" class="fg-t sm mono">[K in keyof T]?</text>
<text x="330" y="114" text-anchor="middle" class="fg-t sm mono">: T[K]</text>
<text x="330" y="138" text-anchor="middle" class="fg-t sm">K 依序是三個鍵</text>
<line x1="188" y1="68" x2="242" y2="80" class="fg-l"/><polygon points="250,82 241.4,76.1 239.4,84.9" class="fg-a"/>
<line x1="188" y1="104" x2="242" y2="104" class="fg-l"/><polygon points="250,104 242,99.5 242,108.5" class="fg-a"/>
<line x1="188" y1="140" x2="242" y2="128" class="fg-l"/><polygon points="250,126 239.4,123.1 241.4,131.9" class="fg-a"/>
<rect x="460" y="20" width="180" height="146" rx="8" class="fg-b hot"/>
<text x="550" y="42" text-anchor="middle" class="fg-t sm mono">MyPartial&lt;Profile&gt;</text>
<rect x="472" y="54" width="156" height="28" rx="4" class="fg-b"/><text x="482" y="73" class="fg-t sm mono">readonly id?: string</text>
<rect x="472" y="90" width="156" height="28" rx="4" class="fg-b"/><text x="482" y="109" class="fg-t sm mono">name?: string</text>
<rect x="472" y="126" width="156" height="28" rx="4" class="fg-b"/><text x="482" y="145" class="fg-t sm mono">avatarUrl?: string</text>
<line x1="410" y1="80" x2="464" y2="68" class="fg-l on"/><polygon points="472,66 461.4,63.1 463.4,71.9" class="fg-a on"/>
<line x1="410" y1="104" x2="464" y2="104" class="fg-l on"/><polygon points="472,104 464,99.5 464,108.5" class="fg-a on"/>
<line x1="410" y1="128" x2="464" y2="140" class="fg-l on"/><polygon points="472,142 463.4,136.1 461.4,144.9" class="fg-a on"/>
<text x="330" y="196" text-anchor="middle" class="fg-t sm">keyof T 直接拿來跑迴圈時（同態映射），原本的 readonly 和 ? 會被保留</text>
<text x="330" y="216" text-anchor="middle" class="fg-t sm">加上 -? 或 -readonly，就是把它們拿掉</text>
</svg><figcaption>三個鍵各跑一次迴圈本體，每一列都被加上問號。這就是 Partial 的全部。</figcaption></figure>
<h4>重新命名鍵：as 子句</h4>
<p>TypeScript 4.1 之後，迴圈裡可以用 <code>as</code> 改鍵的名字，搭配樣板字串型別，就能從資料型別自動產生一整組 getter 的型別：</p>
<pre><code>type Getters&lt;T&gt; = {
  [K in keyof T as \`get\${Capitalize&lt;string &amp; K&gt;}\`]:
    () =&gt; T[K];
};
type G = Getters&lt;{ name: string; points: number }&gt;;
// { getName: () =&gt; string; getPoints: () =&gt; number }</code></pre>
<p><code>string &amp; K</code> 是因為鍵也可能是 number 或 symbol，<code>Capitalize</code> 只吃字串。<code>as</code> 後面如果算出 <code>never</code>，那個鍵就會被丟掉，這是「依條件過濾鍵」的標準寫法。</p>
<h4>遞迴：DeepReadonly</h4>
<p><code>Readonly&lt;T&gt;</code> 只管一層，要整棵唯讀，就讓映射型別呼叫自己。這裡先用到了下一節的條件型別：</p>
<pre><code>type DeepReadonly&lt;T&gt; = {
  readonly [K in keyof T]: T[K] extends object
    ? DeepReadonly&lt;T[K]&gt;
    : T[K];
};
const cfg: DeepReadonly&lt;{ audio: { volume: number } }&gt; = {
  audio: { volume: 1 },
};
cfg.audio.volume = 0;   // 錯誤：第二層也唯讀了</code></pre>

<h3><span class="badge lv3">專業</span>六、條件型別與 infer：型別層的 if 和拆包</h3>
<p><b>條件型別</b>（conditional type）長這樣：<code>T extends U ? X : Y</code>。白話是：「如果 T 放得進 U，答案是 X，否則是 Y」。這裡的 extends 跟條件約束一樣，是「放得進去」的意思。</p>
<h4>遇到聯集會「分配」</h4>
<p>當 T 是一個光禿禿的型別參數，而你傳進來的是聯集時，條件型別會把聯集拆開，每個成員各自跑一次，再把結果合起來。這叫<b>分配律</b>（distributive conditional types）。內建的 <code>Exclude</code> 就靠它：</p>
<pre><code>type MyExclude&lt;T, U&gt; = T extends U ? never : T;
type Left = MyExclude&lt;'higher' | 'lower' | 'same', 'same'&gt;;
// 'higher' | 'lower'

type IsStr&lt;T&gt; = T extends string ? 'yes' : 'no';
type IsStrAll&lt;T&gt; = [T] extends [string] ? 'yes' : 'no';
type R1 = IsStr&lt;string | number&gt;;     // 'yes' | 'no'
type R2 = IsStrAll&lt;string | number&gt;;  // 'no'</code></pre>
<figure class="figure"><svg viewBox="0 0 640 260" class="fg" style="width:100%;max-width:640px" role="img" aria-label="Exclude 的分配：聯集拆成三個成員，各自判斷是否放得進 same，higher 和 lower 留下，same 變成 never，最後合併成 higher 或 lower">
<rect x="130" y="14" width="380" height="32" rx="6" class="fg-b alt"/>
<text x="320" y="35" text-anchor="middle" class="fg-t sm mono">MyExclude&lt;'higher' | 'lower' | 'same', 'same'&gt;</text>
<line x1="320" y1="46" x2="112" y2="76" class="fg-l"/><polygon points="110,80 115.1,71 119.4,78.9" class="fg-a"/>
<line x1="320" y1="46" x2="320" y2="72" class="fg-l"/><polygon points="320,80 315.5,72 324.5,72" class="fg-a"/>
<line x1="320" y1="46" x2="528" y2="76" class="fg-l"/><polygon points="530,80 520.6,78.9 524.9,71" class="fg-a"/>
<text x="20" y="62" class="fg-t sm">拆開，一個一個代入</text>
<rect x="15" y="80" width="190" height="36" rx="6" class="fg-b"/><text x="110" y="103" text-anchor="middle" class="fg-t sm mono">'higher' extends 'same'?</text>
<rect x="225" y="80" width="190" height="36" rx="6" class="fg-b"/><text x="320" y="103" text-anchor="middle" class="fg-t sm mono">'lower' extends 'same'?</text>
<rect x="435" y="80" width="190" height="36" rx="6" class="fg-b"/><text x="530" y="103" text-anchor="middle" class="fg-t sm mono">'same' extends 'same'?</text>
<line x1="110" y1="116" x2="110" y2="138" class="fg-l"/><polygon points="110,146 105.5,138 114.5,138" class="fg-a"/><text x="120" y="135" class="fg-t sm">否</text>
<line x1="320" y1="116" x2="320" y2="138" class="fg-l"/><polygon points="320,146 315.5,138 324.5,138" class="fg-a"/><text x="330" y="135" class="fg-t sm">否</text>
<line x1="530" y1="116" x2="530" y2="138" class="fg-l warm"/><polygon points="530,146 525.5,138 534.5,138" class="fg-a warm"/><text x="540" y="135" class="fg-t sm warm">是</text>
<rect x="45" y="146" width="130" height="34" rx="6" class="fg-b hot"/><text x="110" y="168" text-anchor="middle" class="fg-t mono">'higher'</text>
<rect x="255" y="146" width="130" height="34" rx="6" class="fg-b hot"/><text x="320" y="168" text-anchor="middle" class="fg-t mono">'lower'</text>
<rect x="465" y="146" width="130" height="34" rx="6" class="fg-b warm"/><text x="530" y="168" text-anchor="middle" class="fg-t mono">never</text>
<line x1="110" y1="180" x2="236" y2="208" class="fg-l on"/>
<line x1="320" y1="180" x2="320" y2="206" class="fg-l on"/>
<line x1="530" y1="180" x2="404" y2="208" class="fg-l dim dash"/>
<rect x="200" y="210" width="240" height="36" rx="6" class="fg-b hot"/>
<text x="320" y="233" text-anchor="middle" class="fg-t acc mono">'higher' | 'lower'</text>
<text x="452" y="232" class="fg-t sm">never 在聯集裡消失</text>
</svg><figcaption>分配律就是「對聯集的每個成員跑一次 if」。never 是空集合，併進聯集等於什麼都沒加，所以被丟掉的成員就這樣消失了。</figcaption></figure>
<p>不想分配時（例如想問「整個聯集是不是都是字串」），把兩邊包進中括號：<code>[T] extends [string]</code>。最後一節你會在 Vue 的原始碼裡看到這個寫法。</p>
<h4>infer：照著形狀，把洞裡的東西撈出來</h4>
<p><code>infer</code> 只能寫在條件型別的 extends 那一側，意思是：「如果 T 長得像這個樣子，把這個位置的型別撈出來，取名叫 R」。</p>
<pre><code>type ElementOf&lt;A&gt; =
  A extends readonly (infer E)[] ? E : never;
type MyReturnType&lt;F&gt; =
  F extends (...args: any[]) =&gt; infer R ? R : never;
type Unwrap&lt;P&gt; = P extends Promise&lt;infer V&gt; ? V : P;

type E1 = ElementOf&lt;string[]&gt;;          // string
type R3 = MyReturnType&lt;() =&gt; number&gt;;   // number
type V1 = Unwrap&lt;Promise&lt;{ hp: number }&gt;&gt;;
// V1 是 { hp: number }

function createStore() {
  return { score: 0, best: 12, reset() {} };
}
// 不用再手寫一次 store 的型別
type Store = ReturnType&lt;typeof createStore&gt;;</code></pre>
<p>最後兩行是 <code>infer</code> 在日常工作裡最大的用處：<b>從值推出型別</b>，而不是兩邊各寫一份、再祈禱它們不會不同步。內建的 <code>ReturnType</code>、<code>Parameters</code>、<code>Awaited</code>、<code>InstanceType</code> 都是這樣寫出來的；<code>Awaited</code> 還會遞迴拆開好幾層 Promise。</p>

<h3><span class="badge lv3">專業</span>七、什麼時候泛型會讓程式更糟</h3>
<p>泛型是工具，不是勳章。下面幾種情況，拿掉泛型反而更好：</p>
<ul>
<li><b>T 只出現一次。</b><code>function log&lt;T&gt;(x: T): void</code> 裡的 T 什麼都沒連起來，寫成 <code>x: unknown</code> 意思完全一樣。好的泛型，一定是把兩個以上的位置（參數和參數、參數和回傳值）綁在一起。</li>
<li><b>T 只出現在回傳值。</b><code>function parse&lt;T&gt;(json: string): T</code> 看起來很型別安全，其實就是一個偽裝過的 <code>as</code>：<code>parse&lt;{ name: string }&gt;('{"nme":"x"}')</code> 編譯通過，執行時拿到的物件根本沒有 name。回傳 <code>unknown</code>，讓呼叫者自己驗證，才是誠實的寫法。</li>
<li><b>只有兩三種情況。</b>參數只可能是兩三種型別時，用函式多載（overload）或聯集，通常比一個條件型別好讀得多。下面有完整的例子。</li>
<li><b>呼叫者每次都得手填型別引數。</b>代表推斷沒有幫上忙，簽名可能設計錯了。</li>
<li><b>型別體操寫進業務程式碼。</b>五層巢狀的條件型別，同事看不懂、錯誤訊息長達半個螢幕。複雜的型別留給函式庫的邊界；應用程式內部，簡單直白的型別勝過聰明。</li>
</ul>
<h4>多載 vs. 泛型加條件型別</h4>
<p>一個函式：傳一個 ID 回傳一張牌，傳一串 ID 回傳一串牌。用多載寫：</p>
<pre><code>interface Card { id: number; rank: number; }
declare const table: Map&lt;number, Card&gt;;

function getCard(id: number): Card | &#117;ndefined;
function getCard(ids: number[]): Card[];
function getCard(x: number | number[]) {
  if (Array.isArray(x)) {
    return x.flatMap((id) =&gt; table.get(id) ?? []);
  }
  return table.get(x);
}
const one = getCard(3);        // Card | &#117;ndefined
const many = getCard([1, 2]);  // Card[]</code></pre>
<p>呼叫的人看到兩行簽名，一眼就懂。同一件事寫成 <code>getCard&lt;T extends number | number[]&gt;(x: T): T extends number[] ? Card[] : Card | &#117;ndefined</code>，簽名難讀不說，函式本體裡的兩個 return 還都會報 TS2322：TypeScript 5.x 沒辦法在函式本體裡依照 T 去收窄條件型別的回傳值，最後只能用 <code>as</code> 硬轉。只有兩種情況，多載剛好。</p>
<p>還有效能。每一次用不同的型別引數使用泛型，檢查器都要做一次「實例化」（instantiation）。遞迴的條件型別、巨大的聯集互相展開，會讓編輯器變慢，嚴重時直接放棄並報 TS2589「Type instantiation is excessively deep and possibly infinite」。<code>tsc --extendedDiagnostics</code> 印出來的 Instantiations 數字，就是你要盯的指標。</p>

<h3><span class="badge lv4">專家</span>八、變異性：為什麼有時候「方向會反過來」</h3>
<p>已知 <code>Boss</code> 是一種 <code>Unit</code>（<code>class Boss extends Unit</code>）。那「裝 Boss 的東西」能不能當成「裝 Unit 的東西」用？答案看那個東西對 T 做什麼，這就叫<b>變異性</b>（variance）：</p>
<figure class="figure"><svg viewBox="0 0 660 250" class="fg" style="width:100%;max-width:660px" role="img" aria-label="變異性：Boss 可以當 Unit；只產出的 Producer 方向相同；只接收的 Consumer 方向相反；又讀又寫的 Box 兩邊都不行；陣列在 TypeScript 被當成同向，但不安全">
<rect x="20" y="16" width="150" height="34" rx="6" class="fg-b"/><text x="95" y="38" text-anchor="middle" class="fg-t mono">Boss</text>
<line x1="170" y1="33" x2="222" y2="33" class="fg-l"/><polygon points="230,33 222,28.5 222,37.5" class="fg-a"/>
<rect x="230" y="16" width="150" height="34" rx="6" class="fg-b"/><text x="305" y="38" text-anchor="middle" class="fg-t mono">Unit</text>
<text x="400" y="38" class="fg-t sm">起點：Boss 是一種 Unit</text>
<rect x="20" y="62" width="150" height="34" rx="6" class="fg-b hot"/><text x="95" y="84" text-anchor="middle" class="fg-t mono">Producer&lt;Boss&gt;</text>
<line x1="170" y1="79" x2="222" y2="79" class="fg-l on"/><polygon points="230,79 222,74.5 222,83.5" class="fg-a on"/>
<rect x="230" y="62" width="150" height="34" rx="6" class="fg-b hot"/><text x="305" y="84" text-anchor="middle" class="fg-t mono">Producer&lt;Unit&gt;</text>
<text x="400" y="78" class="fg-t sm acc">只拿出來（out）：同方向</text>
<text x="400" y="93" class="fg-t sm">協變 covariant</text>
<rect x="20" y="108" width="150" height="34" rx="6" class="fg-b alt"/><text x="95" y="130" text-anchor="middle" class="fg-t mono">Consumer&lt;Unit&gt;</text>
<line x1="170" y1="125" x2="222" y2="125" class="fg-l alt"/><polygon points="230,125 222,120.5 222,129.5" class="fg-a alt"/>
<rect x="230" y="108" width="150" height="34" rx="6" class="fg-b alt"/><text x="305" y="130" text-anchor="middle" class="fg-t mono">Consumer&lt;Boss&gt;</text>
<text x="400" y="124" class="fg-t sm alt">只放進去（in）：反方向</text>
<text x="400" y="139" class="fg-t sm">逆變 contravariant</text>
<rect x="20" y="154" width="150" height="34" rx="6" class="fg-b"/><text x="95" y="176" text-anchor="middle" class="fg-t mono">Box&lt;Boss&gt;</text>
<text x="200" y="176" text-anchor="middle" class="fg-t warm">✕</text>
<rect x="230" y="154" width="150" height="34" rx="6" class="fg-b"/><text x="305" y="176" text-anchor="middle" class="fg-t mono">Box&lt;Unit&gt;</text>
<text x="400" y="170" class="fg-t sm warm">又拿又放：哪邊都不行</text>
<text x="400" y="185" class="fg-t sm">不變 invariant</text>
<rect x="20" y="200" width="150" height="34" rx="6" class="fg-b warm"/><text x="95" y="222" text-anchor="middle" class="fg-t mono">Boss[]</text>
<line x1="170" y1="217" x2="222" y2="217" class="fg-l warm dash"/><polygon points="230,217 222,212.5 222,221.5" class="fg-a warm"/>
<rect x="230" y="200" width="150" height="34" rx="6" class="fg-b warm"/><text x="305" y="222" text-anchor="middle" class="fg-t mono">Unit[]</text>
<text x="400" y="216" class="fg-t sm warm">陣列能寫卻被當成協變</text>
<text x="400" y="231" class="fg-t sm">TypeScript 放行，但不安全</text>
</svg><figcaption>箭頭表示「左邊可以放進右邊」。只產出 T 的東西跟著原本的方向走；只吃 T 的東西方向相反；兩件事都做，就只能完全相同。</figcaption></figure>
<ul>
<li><b>協變</b>（covariant）：一個「會產出 Boss」的東西，當然可以當成「會產出 Unit」的東西，因為每個拿出來的 Boss 都是 Unit。函式的回傳值、唯讀的屬性都是這樣。</li>
<li><b>逆變</b>（contravariant）：一個「能處理任何 Unit」的函式，當然能處理 Boss，所以 <code>(u: Unit) =&gt; void</code> 可以放進需要 <code>(b: Boss) =&gt; void</code> 的地方，方向反過來。函式的參數就是這樣。一個能處理所有點擊事件的處理器，當然能處理按鈕的點擊。</li>
<li><b>不變</b>（invariant）：又讀又寫的容器，兩個方向都會出事，只能完全相同。</li>
</ul>
<h4>TypeScript 故意留下的兩個洞</h4>
<pre><code>class Unit { hp = 10; }
class Boss extends Unit { phase = 1; }

const bosses: Boss[] = [new Boss()];
const units: Unit[] = bosses;    // 通過：陣列被當成協變
units.push(new Unit());          // 通過：混進一個 Unit
console.log(bosses[1] instanceof Boss);   // false

interface Producer&lt;out T&gt; { get(): T; }
interface Consumer&lt;in T&gt; { take(x: T): void; }
declare const pu: Producer&lt;Unit&gt;;
const pb: Producer&lt;Boss&gt; = pu;  // 錯誤：方向反了</code></pre>
<p>第一個洞是<b>陣列協變</b>：照理說可寫的陣列應該是不變的，但如果 TypeScript 這麼嚴格，大量的日常程式碼（把 <code>Boss[]</code> 傳給只讀不寫的函式）都會報錯。它選擇了方便，代價是上面這種「bosses 裡出現一個不是 Boss 的東西」。防法是函式參數盡量寫 <code>readonly Unit[]</code>，唯讀陣列是真正安全的協變。第二個洞是繼承那一章講過的<b>方法參數雙變</b>。<code>strictFunctionTypes</code> 只修了寫成函式型別的屬性，方法語法維持雙變，理由一樣是相容性。</p>
<p>TypeScript 4.7 加了 <code>in</code>、<code>out</code> 標記，讓你明講一個型別參數的變異性。檢查器平常會自己量，標上去的好處是：寫錯方向會立刻報錯，而且在非常複雜的型別上，可以省下檢查器自己推算的時間。Vue 3.5 的 <code>Ref&lt;T, S&gt;</code> 把讀的型別（getter 回傳 T）和寫的型別（setter 收 S）拆成兩個參數，也是同一個道理：讀是 out 的位置，寫是 in 的位置。</p>

<h3><span class="badge lv4">專家</span>九、從裡往外讀：拆開 Vue 的 ref</h3>
<p>下面是 Vue 3.5 的 <code>@vue/reactivity</code> 宣告檔裡，<code>ref</code> 真正的型別（第二個多載是 <code>ref&lt;number&gt;()</code> 這種不給初始值的情況）：</p>
<pre><code>export declare function ref&lt;T&gt;(value: T): [T] extends [Ref]
  ? IfAny&lt;T, Ref&lt;T&gt;, T&gt;
  : Ref&lt;UnwrapRef&lt;T&gt;, UnwrapRef&lt;T&gt; | T&gt;;
export declare function ref&lt;T = any&gt;(): Ref&lt;T | &#117;ndefined&gt;;

// 來自 @vue/shared
export type IfAny&lt;T, Y, N&gt; = 0 extends 1 &amp; T ? Y : N;</code></pre>
<p>（原檔是一整行，這裡為了閱讀換了行。）讀法跟上一課一樣：先找最外層的形狀。最外層是一個條件型別，用的是 <code>[T] extends [Ref]</code>，第六節說過，這是「不要分配」的寫法。問的是：「你傳進來的，本身是不是已經是一個 ref？」接著拿兩個具體的值代進去：</p>
<figure class="figure"><svg viewBox="0 0 660 270" class="fg" style="width:100%;max-width:660px" role="img" aria-label="兩欄追蹤：ref(0) 走否的分支，得到 Ref of number；ref(count) 走是的分支，經過 IfAny 之後原樣回傳 count 的型別">
<line x1="330" y1="10" x2="330" y2="260" class="fg-l dim dash"/>
<text x="165" y="24" text-anchor="middle" class="fg-t lg mono">ref(0)</text>
<text x="495" y="24" text-anchor="middle" class="fg-t lg mono">ref(count)</text>
<rect x="20" y="38" width="290" height="34" rx="6" class="fg-b"/><text x="34" y="60" class="fg-t sm mono">1  T = number</text>
<rect x="350" y="38" width="290" height="34" rx="6" class="fg-b"/><text x="364" y="60" class="fg-t sm mono">1  T = Ref&lt;number&gt;</text>
<rect x="20" y="84" width="290" height="34" rx="6" class="fg-b"/><text x="34" y="106" class="fg-t sm mono">2  [number] extends [Ref]？ 否</text>
<rect x="350" y="84" width="290" height="34" rx="6" class="fg-b"/><text x="364" y="106" class="fg-t sm mono">2  [Ref&lt;number&gt;] extends [Ref]？ 是</text>
<rect x="20" y="130" width="290" height="34" rx="6" class="fg-b alt"/><text x="34" y="152" class="fg-t sm mono">3  Ref&lt;UnwrapRef&lt;number&gt;, …&gt;</text>
<rect x="350" y="130" width="290" height="34" rx="6" class="fg-b alt"/><text x="364" y="152" class="fg-t sm mono">3  IfAny&lt;Ref&lt;number&gt;, Ref&lt;T&gt;, T&gt;</text>
<rect x="20" y="176" width="290" height="34" rx="6" class="fg-b alt"/><text x="34" y="198" class="fg-t sm mono">4  UnwrapRef&lt;number&gt; → number</text>
<rect x="350" y="176" width="290" height="34" rx="6" class="fg-b alt"/><text x="364" y="198" class="fg-t sm mono">4  不是 any → 取 N，也就是 T</text>
<rect x="20" y="222" width="290" height="38" rx="6" class="fg-b hot"/><text x="165" y="246" text-anchor="middle" class="fg-t acc mono">Ref&lt;number, number&gt;</text>
<rect x="350" y="222" width="290" height="38" rx="6" class="fg-b hot"/><text x="495" y="246" text-anchor="middle" class="fg-t acc">Ref&lt;number&gt;，原樣交回</text>
</svg><figcaption>同一個簽名，兩條路。左邊包成新的 ref；右邊認出「你給的已經是 ref」，型別原封不動。這正對應執行時的行為：把一個 ref 交給 ref()，拿回來的就是同一個 ref。</figcaption></figure>
<h4>那個奇怪的 IfAny 在防什麼</h4>
<p><code>0 extends 1 &amp; T</code> 是一個很有名的技巧，專門偵測 <code>any</code>：</p>
<ul>
<li>T 是 <code>any</code>：<code>1 &amp; any</code> 是 <code>any</code>，<code>0</code> 放得進 <code>any</code>，答案是 Y。</li>
<li>T 是 <code>number</code>：<code>1 &amp; number</code> 是 <code>1</code>，<code>0</code> 放不進 <code>1</code>，答案是 N。</li>
<li>T 是 <code>unknown</code> 或 <code>never</code>：交集分別是 <code>1</code> 和 <code>never</code>，<code>0</code> 都放不進，答案是 N。</li>
</ul>
<p>為什麼需要它？因為 <code>any</code> 什麼都放得進，<code>[any] extends [Ref]</code> 會走「是」的那條路，如果直接回傳 T，<code>ref(someAny)</code> 的結果就是 <code>any</code>，連 <code>.value</code> 都不檢查了。IfAny 把這個情況攔下來，改回傳 <code>Ref&lt;any&gt;</code>，至少外殼還在。函式庫的型別裡，很多看起來莫名其妙的分支，都是在處理 <code>any</code>、<code>never</code>、聯集這三個邊界情況。</p>
<p>最後，<code>UnwrapRef</code> 會遞迴拆開巢狀的 ref，所以下面最後一行是 <code>number</code>，不是 <code>Ref&lt;number&gt;</code>：</p>
<pre><code>import { ref, type Ref } from 'vue';

const count = ref(0);         // Ref&lt;number, number&gt;
const same = ref(count);      // 跟 count 同一個型別
const nested = ref({ score: ref(3) });
const s: number = nested.value.score;
const later = ref&lt;number&gt;();  // Ref&lt;number | &#117;ndefined&gt;
const typed: Ref&lt;number&gt; = count;</code></pre>
<p>讀任何函式庫型別，都是這套流程：<b>找最外層的形狀 → 用白話說出每個分支在問什麼 → 代一個具體型別進去，一步一步算 → 留意 any、never、聯集的特別處理</b>。卡住的時候，在編輯器裡寫一行 <code>type Test = 那個型別&lt;你的值&gt;</code>，滑鼠移上去，讓檢查器幫你算。</p>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>泛型在執行時也知道 T 是什麼</td><td>型別會被擦除，執行時只有一份函式。需要 T 的資訊，就傳一個真的值（類別、守衛、標籤）進去。</td></tr>
<tr><td><code>T extends X</code> 代表 T 就是 X</td><td>X 只是下限。T 可能是更具體的型別，所以不能隨便造一個 X 當成 T 回傳。</td></tr>
<tr><td><code>parse&lt;T&gt;()</code> 這種寫法是型別安全的</td><td>T 只出現在回傳值，等於偽裝的 as。外部資料要回傳 unknown 再驗證。</td></tr>
<tr><td>條件型別對聯集就是一次判斷</td><td>光禿禿的型別參數會分配：每個成員各跑一次。要整體判斷，包成 <code>[T]</code>。</td></tr>
<tr><td><code>Boss[]</code> 可以放進 <code>Unit[]</code>，所以很安全</td><td>那是 TypeScript 為了方便留的洞。可寫的容器應該是不變的；參數用 <code>readonly Unit[]</code> 才真的安全。</td></tr>
<tr><td>泛型越多越專業</td><td>T 沒有連起兩個位置，就是多餘的。好讀的簡單型別，勝過沒人看得懂的型別體操。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>Vue 3</b>：<code>ref</code>、<code>computed</code>、<code>defineProps&lt;Props&gt;()</code>、Pinia 的 store 都是泛型；用 <code>ReturnType&lt;typeof useXxx&gt;</code> 從 composable 推出型別，不要手抄。泛型元件（<code>generic="T"</code>）適合清單、表格這種「放什麼都行」的元件。</li>
<li><b>Cocos Creator</b>：<code>getComponent(Sprite)</code> 傳類別、回傳 <code>Sprite | null</code>，是「型別擦除所以要傳值」的典型。物件池、事件匯流排、資源快取，都很適合寫成一個泛型類別，所有場景共用。</li>
<li><b>Unity（C#）</b>：C# 的泛型在執行時還在，<code>GetComponent&lt;T&gt;()</code> 不用傳任何東西。從 Unity 轉到 TypeScript，最常卡的就是這個差別。</li>
<li><b>Node.js 後端</b>：API 回應外殼 <code>ApiResult&lt;T&gt;</code>、資料庫查詢的結果型別、設定物件的 <code>DeepPartial</code>，都是本章的工具。請求內容一律從 <code>unknown</code> 開始，不要用回傳型別泛型假裝驗證過。</li>
<li><b>程式碼審查</b>：看到 T 只出現一次、看到 <code>parse&lt;T&gt;</code>、看到五層條件型別出現在業務邏輯裡，都值得留言。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<ol>
<li>「TypeScript 的泛型跟 Java、C# 的泛型有什麼不同？為什麼不能寫 <code>new T()</code>？」</li>
<li>「型別引數是怎麼被推斷的？<code>pair(1, 'x')</code> 為什麼報錯？」</li>
<li>「請不用內建工具型別，自己寫出 Partial、Pick 和 Omit。」</li>
<li>「什麼是條件型別的分配律？什麼時候要關掉它？」</li>
<li>「解釋協變和逆變。TypeScript 的陣列為什麼不完全安全？」</li>
<li>「什麼時候你會選擇不用泛型？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>TypeScript 和 Java 一樣會擦除型別，執行時只有一份程式碼，T 不存在，所以不能 new T、不能 instanceof T，需要時要把類別或建構函式當參數傳進來。C# 的泛型在執行時保留，可以 typeof(T)；C++、Rust 則替每種型別各產生一份程式碼。另一個差別是 TypeScript 的泛型是結構化比較的，條件約束看形狀，不看名字。</li>
<li>檢查器看每個參數的型別裡出現 T 的位置，用實際引數收集候選；沒標型別的回呼會延後，等 T 固定後再用情境型別推斷它的參數。候選衝突時，TypeScript 不會自動合成聯集，pair(1, 'x') 的 T 先定成 number，'x' 就放不進去。可以自己寫型別引數，或改成兩個型別參數。另外字面值預設會被放寬，可以用 const 型別參數保留，用 NoInfer 擋掉不想拿來推斷的位置。</li>
<li><code>type MyPartial&lt;T&gt; = { [K in keyof T]?: T[K] }</code>；<code>type MyPick&lt;T, K extends keyof T&gt; = { [P in K]: T[P] }</code>；<code>type MyOmit&lt;T, K extends keyof any&gt; = MyPick&lt;T, Exclude&lt;keyof T, K&gt;&gt;</code>，其中 <code>Exclude&lt;T, U&gt; = T extends U ? never : T</code>。可以補充：用 keyof T 跑迴圈的同態映射會保留 readonly 和 ?。</li>
<li>當條件型別檢查的是一個光禿禿的型別參數，而傳入的是聯集時，會對每個成員分別計算再合併，這是 Exclude、Extract 能運作的原因。要把聯集當成一個整體判斷時（例如「是不是全部都是字串」、或避免 any、never 的特殊行為），把兩邊包成元組：[T] extends [U]。</li>
<li>若 B 是 A 的子型別：只產出 T 的型別（回傳值、唯讀屬性）是協變，F&lt;B&gt; 可以當 F&lt;A&gt;；只接收 T 的型別（函式參數）是逆變，方向相反；又讀又寫則是不變。TypeScript 為了實用，把可寫的陣列當成協變，所以 Boss[] 能指派給 Unit[]，再 push 一個 Unit，原陣列就混進了不是 Boss 的東西；方法參數也是雙變。防法是參數用 readonly 陣列、用函式型別的屬性宣告回呼。</li>
<li>T 只出現一次時，它沒有連起任何東西，用 unknown 或具體型別即可；T 只出現在回傳值時，它是偽裝的型別斷言；情況只有兩三種時，多載或聯集更好讀；呼叫者每次都得手填型別引數，代表推斷沒幫上忙。應用程式內部優先可讀性，複雜型別留給函式庫邊界，並留意 TS2589 和檢查時間。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>寫出 <code>DeepPartial&lt;T&gt;</code>：每一層的每個屬性都變成選擇性的。拿一個三層的設定物件型別試試看。</li>
<li>寫出 <code>KeysOfType&lt;T, V&gt;</code>：取出 T 裡「值的型別是 V」的那些鍵。例如 <code>KeysOfType&lt;PlayerInfo, string&gt;</code> 要得到 <code>'id' | 'name'</code>。</li>
<li>修好第三節的 <code>withDefault</code>，給兩種不同的修法。</li>
<li>不用內建的 <code>Parameters</code>，用 <code>infer</code> 寫出 <code>ParamsOf&lt;F&gt;</code>。</li>
<li>先預測，再驗證：<code>IsStr&lt;never&gt;</code> 是什麼？<code>IsStrAll&lt;never&gt;</code> 又是什麼？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li><code>type DeepPartial&lt;T&gt; = { [K in keyof T]?: T[K] extends object ? DeepPartial&lt;T[K]&gt; : T[K] }</code>。函式型別也是 object，真實專案裡通常會多加一個分支，把函式原樣保留。</li>
<li><code>type KeysOfType&lt;T, V&gt; = { [K in keyof T]-?: T[K] extends V ? K : never }[keyof T]</code>。先用映射型別把每個鍵換成「自己或 never」，再用 <code>[keyof T]</code> 把所有值取出來成為聯集，never 自動消失。<code>-?</code> 是為了避免選擇性屬性帶進 &#117;ndefined。</li>
<li>修法一：讓回傳型別說實話，<code>function withDefault&lt;T extends { rank: number }&gt;(x?: T): T | { rank: number }</code>。修法二：預設值由呼叫者提供，<code>function withDefault&lt;T&gt;(x: T | &#117;ndefined, fallback: T): T { return x ?? fallback; }</code>，這樣回傳的一定是 T。</li>
<li><code>type ParamsOf&lt;F&gt; = F extends (...args: infer P) =&gt; any ? P : never</code>。P 會是一個元組，例如 <code>ParamsOf&lt;(a: number, b: string) =&gt; void&gt;</code> 是 <code>[a: number, b: string]</code>。</li>
<li><code>IsStr&lt;never&gt;</code> 是 <code>never</code>：never 是空的聯集，分配時一個成員都沒有，結果也是空的。<code>IsStrAll&lt;never&gt;</code> 是 <code>'yes'</code>：包起來就不分配了，而 never 放得進任何型別，包括 string。這正是函式庫要特別處理 never 的原因。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>TypeScript Handbook：Generics 與 Creating Types from Types</b>（<a href="https://www.typescriptlang.org/docs/handbook/2/types-from-types.html">typescriptlang.org</a>）：keyof、typeof、索引存取、條件型別、映射型別、樣板字串型別的官方章節。</li>
<li><b>TypeScript 原始碼的 lib.es5.d.ts</b>（<a href="https://github.com/microsoft/TypeScript/blob/main/src/lib/es5.d.ts">github.com/microsoft/TypeScript</a>）：Partial、Pick、Record、Exclude、ReturnType 的真正定義，每個都只有一兩行。</li>
<li><b>type-challenges</b>（<a href="https://github.com/type-challenges/type-challenges">github.com/type-challenges/type-challenges</a>）：從簡單到地獄級的型別練習題，做完 easy 和 medium，函式庫型別就難不倒你。</li>
<li><b>Dan Vanderkam《Effective TypeScript》</b>：泛型、型別設計、什麼時候不要寫複雜型別，都有專門的條目。</li>
<li><b>Vue 的型別宣告檔</b>：專案裡 <code>node_modules/@vue/reactivity/dist/reactivity.d.ts</code>，本章第九節的 ref 就在這裡。挑 <code>computed</code>、<code>reactive</code> 照同一套方法拆一次。</li>
</ul>
` });
