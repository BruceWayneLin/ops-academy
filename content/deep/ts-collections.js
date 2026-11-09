DEEP({ 'ts-collections': `
<p>上一課給了你四種裝一群值的形狀：陣列、物件、元組、Record。這一章往下挖兩層。第一層是記憶體：變數裡放的到底是值本身，還是一個「地址」？為什麼改了 <code>alias</code>，<code>hand</code> 也跟著變？陣列在 JavaScript 引擎裡長什麼樣子？第二層是型別：元組和陣列在檢查器眼裡差在哪、<code>readonly</code> 和 <code>as const</code> 擋得住什麼、索引簽章和 <code>Record</code>、<code>Map</code> 該怎麼選，以及為什麼直接寫的物件多一個屬性就報錯，放進變數再傳就不報。最後看淺拷貝和深拷貝，這是前端和遊戲程式裡最常見的一種「莫名其妙被改掉」的 bug 來源。</p>

<h3><span class="badge lv1">基礎</span>一、變數裡放的是什麼：值與參照</h3>
<p>JavaScript 的值分兩大類。<b>原始值</b>（primitive）：數字、字串、布林、<code>null</code>、<code>&#117;ndefined</code>、<code>bigint</code>、<code>symbol</code>。其他全部都是<b>物件</b>（object），陣列、函式、Map 也都是物件。兩類最大的差別，在「指派的時候複製了什麼」。</p>
<figure class="figure"><svg viewBox="0 0 640 272" class="fg" style="width:100%;max-width:640px" role="img" aria-label="左邊是變數，round 和 copy 各自放一個 3；hand 和 alias 放的是同一個地址，指向右邊堆積裡的同一個陣列">
<rect x="16" y="40" width="220" height="200" rx="8" class="fg-b"/>
<text x="126" y="28" text-anchor="middle" class="fg-t lg">變數</text>
<rect x="32" y="56" width="188" height="36" rx="5" class="fg-b"/><text x="44" y="79" class="fg-t mono">round</text><text x="208" y="79" text-anchor="end" class="fg-t mono">3</text>
<rect x="32" y="104" width="188" height="36" rx="5" class="fg-b"/><text x="44" y="127" class="fg-t mono">copy</text><text x="208" y="127" text-anchor="end" class="fg-t mono">3</text>
<rect x="32" y="152" width="188" height="36" rx="5" class="fg-b alt"/><text x="44" y="175" class="fg-t mono">hand</text><text x="168" y="175" text-anchor="end" class="fg-t sm">地址</text><circle cx="200" cy="170" r="5" class="fg-lamp on"/>
<rect x="32" y="200" width="188" height="36" rx="5" class="fg-b alt"/><text x="44" y="223" class="fg-t mono">alias</text><text x="168" y="223" text-anchor="end" class="fg-t sm">地址</text><circle cx="200" cy="218" r="5" class="fg-lamp on"/>
<rect x="330" y="40" width="294" height="200" rx="8" class="fg-b"/>
<text x="477" y="28" text-anchor="middle" class="fg-t lg">堆積（heap）</text>
<rect x="360" y="104" width="248" height="88" rx="6" class="fg-b"/>
<text x="372" y="124" class="fg-t sm">陣列物件</text>
<rect x="372" y="134" width="50" height="36" rx="4" class="fg-b"/><text x="397" y="157" text-anchor="middle" class="fg-t mono">7</text>
<rect x="430" y="134" width="50" height="36" rx="4" class="fg-b"/><text x="455" y="157" text-anchor="middle" class="fg-t mono">12</text>
<rect x="488" y="134" width="50" height="36" rx="4" class="fg-b"/><text x="513" y="157" text-anchor="middle" class="fg-t mono">3</text>
<rect x="546" y="134" width="50" height="36" rx="4" class="fg-b hot"/><text x="571" y="157" text-anchor="middle" class="fg-t mono acc">5</text>
<text x="484" y="218" text-anchor="middle" class="fg-t sm warm">alias.push(5) 之後，hand 也看得到 5</text>
<path d="M205 170 H290 V140 H352" class="fg-l on"/><polygon points="360,140 352,135.5 352,144.5" class="fg-a on"/>
<path d="M205 218 H306 V176 H352" class="fg-l on"/><polygon points="360,176 352,171.5 352,180.5" class="fg-a on"/>
<text x="320" y="262" text-anchor="middle" class="fg-t sm">round、copy 各有一份 3；hand、alias 抄的是同一個地址</text>
</svg><figcaption>原始值整個複製；物件只複製「地址」。兩個變數拿著同一個地址，就是在操作同一個東西。</figcaption></figure>
<pre><code>let round = 3;
let copy = round;   // 複製了 3 這個值
copy = 4;           // round 還是 3

const hand = [7, 12, 3];
const alias = hand; // 複製的是地址，不是陣列
alias.push(5);      // hand 也變成 [7, 12, 3, 5]
console.log(hand === alias);   // true：同一個陣列

const x = [1];
const y = [1];
console.log(x === y);   // false：兩個不同的陣列</code></pre>
<p>一個好記的比喻：物件是一台電視，變數手上拿的是<b>遙控器</b>。<code>const alias = hand</code> 是多配一支遙控器，不是多買一台電視。用哪一支轉台，大家看到的都是同一台。<code>===</code> 比較物件時，比的是「是不是同一台電視」，不是「節目一不一樣」，所以兩個內容相同的陣列也不相等。</p>
<h4>傳進函式的時候也一樣</h4>
<pre><code>function addCard(h: number[]) {
  h.push(5);    // 改到呼叫者的陣列
}
function reset(h: number[]) {
  h = [];       // 只換掉自己手上的遙控器
}

const deck = [7, 12];
addCard(deck);  // deck 變成 [7, 12, 5]
reset(deck);    // deck 還是 [7, 12, 5]</code></pre>
<p>JavaScript 傳參數時，永遠是把變數裡的東西「複製一份」交出去。原始值就複製值；物件就複製地址。所以函式可以透過地址改到你的陣列（<code>addCard</code>），但沒辦法換掉你手上的那支遙控器（<code>reset</code>）。這種規則有個正式名字叫「依共享傳遞」（call by sharing），面試偶爾會問。</p>
<div class="note"><b>那字串呢？</b>引擎內部其實也把字串放在堆積裡，複製時只複製地址。但字串是<b>不可變的</b>（immutable）：沒有任何操作能改掉一個字串的內容，<code>toUpperCase()</code> 也是產生一個新字串。既然沒人改得動，共享和複製就看不出差別，所以你可以放心把它當成「值」。</div>

<h3><span class="badge lv1">基礎</span>二、陣列在記憶體裡長什麼樣子</h3>
<p>JavaScript 的陣列不是 C 語言那種「一整塊連續記憶體」。它是一個物件，身上有一個 <code>length</code>，真正的元素放在另一塊叫<b>元素儲存區</b>（backing store）的記憶體裡。以 Chrome 和 Node.js 用的 V8 引擎為例：</p>
<figure class="figure"><svg viewBox="0 0 660 236" class="fg" style="width:100%;max-width:660px" role="img" aria-label="變數 hand 指向陣列物件，陣列物件有形狀、屬性、元素和長度四欄；元素那欄指向一塊容量 22 格的儲存區，前 4 格有值">
<rect x="16" y="118" width="80" height="36" rx="5" class="fg-b alt"/><text x="30" y="141" class="fg-t mono">hand</text><circle cx="80" cy="136" r="5" class="fg-lamp on"/>
<line x1="85" y1="136" x2="112" y2="136" class="fg-l on"/><polygon points="120,136 112,131.5 112,140.5" class="fg-a on"/>
<rect x="120" y="36" width="180" height="170" rx="8" class="fg-b"/>
<text x="210" y="26" text-anchor="middle" class="fg-t">陣列物件（JSArray）</text>
<rect x="132" y="48" width="156" height="30" rx="4" class="fg-b"/><text x="142" y="68" class="fg-t sm">map：隱藏類別</text>
<rect x="132" y="86" width="156" height="30" rx="4" class="fg-b"/><text x="142" y="106" class="fg-t sm">properties：其他屬性</text>
<rect x="132" y="124" width="156" height="30" rx="4" class="fg-b hot"/><text x="142" y="144" class="fg-t sm">elements</text><circle cx="272" cy="139" r="5" class="fg-lamp on"/>
<rect x="132" y="162" width="156" height="30" rx="4" class="fg-b"/><text x="142" y="182" class="fg-t sm">length：4</text>
<path d="M277 139 H316 V100 H332" class="fg-l on"/><polygon points="340,100 332,95.5 332,104.5" class="fg-a on"/>
<text x="340" y="66" class="fg-t">元素儲存區：容量 22 格</text>
<rect x="340" y="82" width="34" height="36" rx="3" class="fg-b hot"/><text x="357" y="105" text-anchor="middle" class="fg-t sm mono">7</text>
<rect x="376" y="82" width="34" height="36" rx="3" class="fg-b hot"/><text x="393" y="105" text-anchor="middle" class="fg-t sm mono">12</text>
<rect x="412" y="82" width="34" height="36" rx="3" class="fg-b hot"/><text x="429" y="105" text-anchor="middle" class="fg-t sm mono">3</text>
<rect x="448" y="82" width="34" height="36" rx="3" class="fg-b hot"/><text x="465" y="105" text-anchor="middle" class="fg-t sm mono">9</text>
<rect x="484" y="82" width="34" height="36" rx="3" class="fg-b"/><text x="501" y="105" text-anchor="middle" class="fg-t sm">空</text>
<rect x="520" y="82" width="34" height="36" rx="3" class="fg-b"/><text x="537" y="105" text-anchor="middle" class="fg-t sm">空</text>
<rect x="556" y="82" width="34" height="36" rx="3" class="fg-b"/><text x="573" y="105" text-anchor="middle" class="fg-t sm">空</text>
<rect x="592" y="82" width="34" height="36" rx="3" class="fg-b"/><text x="609" y="105" text-anchor="middle" class="fg-t sm">空</text>
<text x="340" y="142" class="fg-t sm">⋯ 後面還有 14 格預留的空位</text>
<text x="340" y="174" class="fg-t sm">長度（length）＝ 4：用掉幾格</text>
<text x="340" y="194" class="fg-t sm">容量（capacity）＝ 22：先借了幾格</text>
<text x="330" y="228" text-anchor="middle" class="fg-t sm warm">push 不必每次搬家：容量用完，才整塊搬到更大的地方</text>
</svg><figcaption>陣列物件本身很小，元素放在另一塊預先多借的空間裡。長度是用掉的格數，容量是借來的格數。</figcaption></figure>
<p>用 Node.js 22 實際觀察（加上 <code>--allow-natives-syntax</code> 旗標，用 V8 的除錯函式 <code>%DebugPrint</code> 印出內部結構）：<code>const hand = [7, 12, 3]</code> 一開始的儲存區剛好 3 格；<code>hand.push(9)</code> 需要第 4 格，V8 不是只多借 1 格，而是一次換成 22 格。它的成長規則大約是「新容量 = 需要的長度 × 1.5 + 16」：4 × 1.5 + 16 = 22。這樣接下來 18 次 <code>push</code> 都不用搬家，平均下來每次 <code>push</code> 很便宜。這些數字是引擎的實作細節，不同版本可能不同，但「預留空間、用完才整塊搬」這個做法，幾乎所有語言的動態陣列都一樣（Go 的 slice、C# 的 <code>List&lt;T&gt;</code> 也是）。</p>
<h4>陣列裡的「洞」</h4>
<pre><code>const a = [7, 12, 3];
a[10] = 1;          // length 變成 11，中間 7 格是洞
console.log(5 in a);   // false：這一格根本不存在

const b = [1, 2, 3];
delete b[1];        // 留下一個洞，length 還是 3

const c = new Array(3);   // 3 個洞，不是 3 個 &#117;ndefined</code></pre>
<p>洞（hole）不是 <code>&#117;ndefined</code>，而是「這一格不存在」。讀它會得到 <code>&#117;ndefined</code>，但 <code>forEach</code>、<code>map</code> 會跳過它。對引擎來說，有洞的陣列要多做檢查，比較慢。所以不要用 <code>delete</code> 刪陣列元素（用 <code>splice</code> 或 <code>filter</code>），也不要跳著寫索引。</p>
<p>如果你要的真的是「一整塊連續的數字」，例如頂點座標、音訊樣本、網路封包，用<b>型別化陣列</b>（typed array）：<code>new Float32Array(1024)</code> 就是 1024 × 4 = 4096 位元組連在一起的空間，每格固定是 32 位元的浮點數，不能放別的東西，也不能 <code>push</code>。WebGL、Web Audio、二進位的 WebSocket 訊息都用它。</p>

<h3><span class="badge lv2">進階</span>三、陣列、元組、唯讀：檢查器眼中的差別</h3>
<p>記憶體裡，元組就是普通陣列。差別全在檢查器知道多少：</p>
<table>
<tr><th>型別</th><th>檢查器知道的</th><th>length 的型別</th></tr>
<tr><td><code>number[]</code></td><td>每格都是 number，不知道有幾格</td><td><code>number</code></td></tr>
<tr><td><code>[string, number]</code></td><td>剛好 2 格，第 0 格 string、第 1 格 number</td><td><code>2</code></td></tr>
<tr><td><code>[number, number?]</code></td><td>1 或 2 格，第二格可有可無</td><td><code>1 | 2</code></td></tr>
<tr><td><code>[string, ...number[]]</code></td><td>第一格是 string，後面任意個 number</td><td><code>number</code></td></tr>
<tr><td><code>readonly number[]</code></td><td>每格都是 number，而且不准改</td><td><code>number</code>（唯讀）</td></tr>
</table>
<pre><code>const entry: [string, number] = ['Ada', 12];
entry[2];           // 錯誤：元組只有兩格
entry.push(99);     // 沒被擋：底下還是陣列

const fixed: readonly [string, number] = ['Bo', 9];
fixed.push(1);      // 錯誤：唯讀元組沒有 push

const ro: readonly number[] = [3, 1, 2];
ro.sort();          // 錯誤：sort 會改原陣列
const sorted = ro.toSorted();   // 可以：回傳新陣列

const mutable: number[] = ro;   // 錯誤 TS4104
const view: readonly number[] = sorted;   // 可以</code></pre>
<p>最後兩行是重點。<b>可改的</b>可以給<b>唯讀的</b>，反過來不行。道理很直白：把一個可改的陣列交給「只看不改」的人，不會出事；把一個你承諾不改的陣列，交給一個可能會改的人，承諾就破了。所以函式的參數只要不改陣列，就宣告成 <code>readonly number[]</code>：呼叫的人兩種陣列都能傳，而且你自己在函式裡不小心 <code>sort()</code>，檢查器會攔下來。</p>
<p><code>toSorted</code>、<code>toReversed</code>、<code>toSpliced</code>、<code>with</code> 是 ES2023 加的「不改原陣列」版本，Chrome 110、Node.js 20 以後都有。它們在唯讀陣列上也能用，正好補上 <code>readonly</code> 不能 <code>sort</code> 的空缺。</p>
<h4>as const 是「深」的，Object.freeze 是「淺」的</h4>
<pre><code>const LEVELS = {
  easy: { target: 5 },
  hard: { target: 10 },
} as const;
LEVELS.easy.target = 6;   // 錯誤：as const 每一層都唯讀

const config = Object.freeze({
  rounds: 10,
  deck: { size: 52 },
});
config.rounds = 11;       // 錯誤：最外層凍結了
config.deck.size = 40;    // 型別和執行時都擋不住</code></pre>
<p><code>as const</code> 只活在型別層，執行時物件根本沒被凍結。<code>Object.freeze</code> 真的在執行時凍結物件，但只凍最外層，它的型別 <code>Readonly&lt;T&gt;</code> 也老老實實只標最外層。要「每一層都真的凍住」，得自己寫一個遞迴凍結的函式。實務上更常見的做法是：型別用 <code>as const</code> 或 <code>readonly</code> 擋住你自己的程式碼，執行時不凍結，因為凍結有成本，而且擋不住的只有「刻意繞過型別」的程式。</p>

<h3><span class="badge lv2">進階</span>四、查詢表的三種寫法：索引簽章、Record、Map</h3>
<p>「用名字查分數」這種表，TypeScript 有三種寫法，它們在記憶體裡長得不一樣：</p>
<figure class="figure"><svg viewBox="0 0 680 262" class="fg" style="width:100%;max-width:680px" role="img" aria-label="三種查詢表：一般物件有原型，繼承了 toString 和 constructor；Object.create(null) 的原型是 null；Map 有自己的鍵值表，鍵可以是任何型別">
<text x="116" y="26" text-anchor="middle" class="fg-t mono">{}</text>
<text x="340" y="26" text-anchor="middle" class="fg-t mono">Object.create(null)</text>
<text x="564" y="26" text-anchor="middle" class="fg-t mono">new Map()</text>
<rect x="16" y="40" width="200" height="72" rx="6" class="fg-b"/><text x="30" y="66" class="fg-t mono">Ada: 12</text><text x="30" y="94" class="fg-t mono">Bo: 9</text>
<line x1="116" y1="112" x2="116" y2="138" class="fg-l warm"/><polygon points="116,146 111.5,138 120.5,138" class="fg-a warm"/><text x="126" y="132" class="fg-t sm warm">原型</text>
<rect x="16" y="146" width="200" height="98" rx="6" class="fg-b warm"/><text x="30" y="168" class="fg-t sm">Object.prototype</text>
<text x="30" y="192" class="fg-t sm mono">toString</text><text x="30" y="212" class="fg-t sm mono">constructor</text><text x="30" y="232" class="fg-t sm mono">hasOwnProperty …</text>
<rect x="240" y="40" width="200" height="72" rx="6" class="fg-b"/><text x="254" y="66" class="fg-t mono">Ada: 12</text><text x="254" y="94" class="fg-t mono">Bo: 9</text>
<line x1="340" y1="112" x2="340" y2="138" class="fg-l"/><polygon points="340,146 335.5,138 344.5,138" class="fg-a"/><text x="350" y="132" class="fg-t sm">原型</text>
<rect x="240" y="146" width="200" height="40" rx="6" class="fg-b"/><text x="340" y="171" text-anchor="middle" class="fg-t mono">null</text>
<text x="340" y="212" text-anchor="middle" class="fg-t sm">沒有繼承任何鍵</text>
<rect x="464" y="40" width="200" height="204" rx="6" class="fg-b alt"/>
<text x="478" y="62" class="fg-t sm">鍵（任何型別）</text><text x="650" y="62" text-anchor="end" class="fg-t sm">值</text>
<line x1="478" y1="72" x2="650" y2="72" class="fg-l dim"/>
<text x="478" y="96" class="fg-t mono">'Ada'</text><text x="650" y="96" text-anchor="end" class="fg-t mono">12</text>
<text x="478" y="124" class="fg-t mono">7</text><text x="650" y="124" text-anchor="end" class="fg-t mono">'a'</text>
<text x="478" y="152" class="fg-t mono">'7'</text><text x="650" y="152" text-anchor="end" class="fg-t mono">'b'</text>
<text x="478" y="180" class="fg-t mono">{ id: 1 }</text><text x="650" y="180" text-anchor="end" class="fg-t mono">'c'</text>
<line x1="478" y1="196" x2="650" y2="196" class="fg-l dim"/>
<text x="478" y="222" class="fg-t sm">size：4，照放進去的順序</text>
</svg><figcaption>左邊的一般物件，會從原型「繼承」到你沒放進去的鍵；中間的沒有原型；右邊的 Map 是獨立的鍵值表，數字 7 和字串 '7' 是兩個不同的鍵。</figcaption></figure>
<pre><code>// 1. 索引簽章：任何字串鍵，值都是 number
type Scores = { [name: string]: number };

// 2. Record：同一件事的簡寫
type Scores2 = Record&lt;string, number&gt;;

// 鍵是固定清單時，Record 會要求每個鍵都要有
type Level = 'easy' | 'hard';
const target: Record&lt;Level, number&gt; = { // 錯誤
  easy: 5,
};   // 少了 hard

// 有名字的屬性也得符合索引簽章
type Board = {
  [k: string]: number;
  total: number;
  label: string;   // 錯誤 TS2411：string 不是 number
};

// 3. Map：get 誠實地回傳 number | &#117;ndefined
const best = new Map&lt;string, number&gt;();
best.set('Ada', 12);
const ada = best.get('Ada');   // number | &#117;ndefined</code></pre>
<p><code>Record&lt;string, number&gt;</code> 展開後就是 <code>{ [x: string]: number }</code>，兩者對檢查器來說是同一個東西，選哪種寫法是風格問題。<code>Record</code> 真正厲害的地方，是鍵為字面值聯集的時候：<code>Record&lt;Level, number&gt;</code> 會要求 <code>easy</code> 和 <code>hard</code> 一個都不能少，以後在 <code>Level</code> 加一個 <code>'expert'</code>，每一個少了它的表都會被抓出來。</p>
<h4>一般物件當查詢表的三個陷阱</h4>
<pre><code>const obj = { '10': 'a', '2': 'b', x: 'c' };
console.log(Object.keys(obj));   // ['2', '10', 'x']
// 像整數的鍵排最前面，由小到大

const table: Record&lt;string, number&gt; = {};
console.log('constructor' in table);   // true
console.log(Object.hasOwn(table, 'constructor'));
// ↑ false：constructor 是繼承來的，不是自己的鍵

const m = new Map&lt;number | string, string&gt;();
m.set(7, 'a');
m.set('7', 'b');   // Map 裡是兩個不同的鍵</code></pre>
<ol>
<li><b>順序</b>：物件的鍵，凡是長得像整數的（<code>'2'</code>、<code>'10'</code>），會排在最前面而且由小到大，其他字串鍵才照放入順序。用玩家 id（數字）當鍵的排行表，順序會跟你放進去的不一樣。Map 一律照放入順序。</li>
<li><b>繼承來的鍵</b>：<code>'constructor' in table</code> 是 true。如果你用 <code>if (name in table)</code> 判斷「這個玩家玩過沒」，一個叫 constructor 的玩家就會出事。用 <code>Object.hasOwn</code>，或改用 Map。</li>
<li><b>鍵永遠是字串</b>：物件的鍵（除了 symbol）一律轉成字串，<code>table[7]</code> 和 <code>table['7']</code> 是同一格。Map 的鍵可以是任何值，連物件都行（比的是地址）。</li>
</ol>
<table>
<tr><th>需求</th><th>選</th><th>原因</th></tr>
<tr><td>鍵是固定的幾個單字</td><td><code>Record&lt;Level, T&gt;</code> 或物件型別</td><td>少一個鍵會被抓到</td></tr>
<tr><td>要直接存成 JSON、送給伺服器</td><td>物件（Record）</td><td><code>JSON.stringify(new Map(...))</code> 只會得到 <code>{}</code></td></tr>
<tr><td>鍵來自使用者或外部資料</td><td>Map</td><td>沒有繼承來的鍵，也沒有原型污染的問題</td></tr>
<tr><td>經常新增、刪除鍵</td><td>Map</td><td>引擎為這種用法最佳化過；物件一直 <code>delete</code> 會變慢（第七節）</td></tr>
<tr><td>鍵是物件，例如節點對應資料</td><td>Map 或 WeakMap</td><td>物件鍵不會被轉成字串</td></tr>
</table>
<p>如果想讓檢查器逼你承認「這個鍵可能不存在」，打開 <code>noUncheckedIndexedAccess</code>（上一課深入圖解的第七節），或者打開 <code>noPropertyAccessFromIndexSignature</code>：它要求索引簽章的鍵一律寫成 <code>scores['Ada']</code>，不准寫 <code>scores.Ada</code>，讓「這是查表，不是固定屬性」在程式碼裡一眼看得出來。</p>

<h3><span class="badge lv3">專業</span>五、結構型別與多餘屬性檢查</h3>
<p>TypeScript 判斷兩個型別相不相容，不看名字，只看形狀，這叫<b>結構型別</b>（structural typing）。<code>type Point = { x: number; y: number }</code> 和 <code>type Vec = { x: number; y: number }</code> 是完全可以互換的兩個名字。而且多出來的屬性沒關係：一個 <code>{ x, y, z }</code> 的物件，也算是一個 Point，因為 Point 要的它都有。</p>
<p>可是你一定遇過這個：</p>
<pre><code>type Point = { x: number; y: number };

const q: Point = { x: 1, y: 2, z: 3 };   // 錯誤 TS2353

const p = { x: 1, y: 2, z: 3 };
const q2: Point = p;                     // 沒問題</code></pre>
<p>同一個物件，直接寫就報錯，先放進變數就不報。這不是矛盾，而是一個刻意加上的額外檢查，叫<b>多餘屬性檢查</b>（excess property check）。它只檢查「新鮮的」物件字面值：</p>
<figure class="figure"><svg viewBox="0 0 660 200" class="fg" style="width:100%;max-width:660px" role="img" aria-label="直接寫的物件字面值先經過多餘屬性檢查，z 不在 Point 裡就報錯；變數只經過結構檢查，有 x 和 y 就通過">
<rect x="16" y="30" width="190" height="56" rx="6" class="fg-b"/><text x="111" y="53" text-anchor="middle" class="fg-t">直接寫的物件字面值</text><text x="111" y="73" text-anchor="middle" class="fg-t sm mono">{ x: 1, y: 2, z: 3 }</text>
<rect x="244" y="30" width="190" height="56" rx="6" class="fg-b warm"/><text x="339" y="53" text-anchor="middle" class="fg-t warm">多餘屬性檢查</text><text x="339" y="73" text-anchor="middle" class="fg-t sm">有沒有 Point 沒有的鍵？</text>
<rect x="472" y="30" width="172" height="56" rx="6" class="fg-b warm"/><text x="558" y="53" text-anchor="middle" class="fg-t warm">報錯 TS2353</text><text x="558" y="73" text-anchor="middle" class="fg-t sm">z 不在 Point 裡</text>
<line x1="206" y1="58" x2="236" y2="58" class="fg-l"/><polygon points="244,58 236,53.5 236,62.5" class="fg-a"/>
<line x1="434" y1="58" x2="464" y2="58" class="fg-l warm"/><polygon points="472,58 464,53.5 464,62.5" class="fg-a warm"/><text x="453" y="48" text-anchor="middle" class="fg-t sm warm">有</text>
<rect x="16" y="124" width="190" height="56" rx="6" class="fg-b"/><text x="111" y="147" text-anchor="middle" class="fg-t">變數 p</text><text x="111" y="167" text-anchor="middle" class="fg-t sm">別的地方可能還在用它</text>
<rect x="244" y="124" width="190" height="56" rx="6" class="fg-b hot"/><text x="339" y="147" text-anchor="middle" class="fg-t acc">結構檢查</text><text x="339" y="167" text-anchor="middle" class="fg-t sm">Point 要的都有嗎？</text>
<rect x="472" y="124" width="172" height="56" rx="6" class="fg-b hot"/><text x="558" y="147" text-anchor="middle" class="fg-t acc">通過</text><text x="558" y="167" text-anchor="middle" class="fg-t sm">有 x、有 y 就夠</text>
<line x1="206" y1="152" x2="236" y2="152" class="fg-l"/><polygon points="244,152 236,147.5 236,156.5" class="fg-a"/>
<line x1="434" y1="152" x2="464" y2="152" class="fg-l on"/><polygon points="472,152 464,147.5 464,156.5" class="fg-a on"/>
<path d="M339 86 V106 H300 V116" class="fg-l dash"/><polygon points="300,124 295.5,116 304.5,116" class="fg-a"/>
<text x="350" y="104" class="fg-t sm">沒有多的，再做結構檢查</text>
</svg><figcaption>新鮮的物件字面值多走一道關卡。放進變數之後，它可能還有別的用途，多出來的屬性就不算錯。</figcaption></figure>
<p>為什麼只檢查新鮮的？因為一個直接寫在這裡的字面值，除了這裡，沒有任何人會用到它。它身上多出來的屬性，不可能是「別人需要的」，幾乎一定是打錯字或搞錯型別。變數就不一樣了，<code>p</code> 可能在別的地方需要 <code>z</code>。這個檢查在「選項物件」上最有價值，因為選項通常全部都是可選的：</p>
<pre><code>type Options = { volume?: number; loop?: boolean };
declare function play(sound: string, o: Options): void;

play('win', { volum: 0.5 }); // 錯誤 TS2561

const o = { colour: 'red' };
play('win', o);   // 錯誤 TS2559：跟 Options 毫無交集</code></pre>
<p>第一個是多餘屬性檢查，連「你是不是要寫 volume」都幫你猜好了。第二個是另一個叫<b>弱型別偵測</b>（weak type detection）的規則：一個全部屬性都可選的型別，任何物件理論上都符合，所以檢查器額外要求「至少要有一個屬性對得上」。少了這兩道檢查，<code>volum</code> 會安靜地被忽略，音量永遠是預設值，你得花半天才找得到原因。</p>
<h4>結構型別的另一面：兩種 id 會被搞混</h4>
<pre><code>type Brand&lt;T, B&gt; = T &amp; { readonly __brand: B };
type PlayerId = Brand&lt;string, 'PlayerId'&gt;;
type RoomId = Brand&lt;string, 'RoomId'&gt;;

function asPlayerId(s: string): PlayerId {
  return s as PlayerId;   // 驗證過格式再轉
}
declare function kick(id: PlayerId): void;

const room = 'r-9' as RoomId;
kick(asPlayerId('p-1'));
kick(room);       // 錯誤：RoomId 不是 PlayerId
kick('p-2');      // 錯誤：普通字串也不行</code></pre>
<p>如果 <code>PlayerId</code> 和 <code>RoomId</code> 都只是 <code>string</code> 的別名，結構型別會讓它們互換，把房間 id 傳給踢人的函式也不會報錯。這種「加一個假屬性」的寫法叫<b>品牌型別</b>（branded type）。那個 <code>__brand</code> 屬性執行時根本不存在，它只是讓兩個形狀在檢查器眼裡不一樣。在 id 很多、而且搞混會出大事的系統（金流、權限、遊戲房間）很值得用。</p>

<h3><span class="badge lv3">專業</span>六、修改還是複製：淺拷貝與深拷貝</h3>
<p>第一節的遙控器比喻，在複製物件時會變得很重要。<code>{ ...a }</code> 會產生一個新物件，但它只複製「第一層」：如果某個屬性本身是物件，複製的還是地址。</p>
<figure class="figure"><svg viewBox="0 0 680 252" class="fg" style="width:100%;max-width:680px" role="img" aria-label="原本的物件 a 和淺拷貝 b 的 hand 都指向同一個陣列；深拷貝 c 指向自己的一份陣列">
<text x="106" y="26" text-anchor="middle" class="fg-t mono">a（原本的）</text>
<text x="340" y="26" text-anchor="middle" class="fg-t mono">b = { ...a }</text>
<text x="574" y="26" text-anchor="middle" class="fg-t mono">c = structuredClone(a)</text>
<rect x="16" y="40" width="180" height="80" rx="6" class="fg-b"/><text x="30" y="68" class="fg-t mono">round: 3</text><text x="30" y="100" class="fg-t mono">hand:</text><circle cx="176" cy="96" r="5" class="fg-lamp on"/>
<rect x="250" y="40" width="180" height="80" rx="6" class="fg-b alt"/><text x="264" y="68" class="fg-t mono">round: 3</text><text x="264" y="100" class="fg-t mono">hand:</text><circle cx="410" cy="96" r="5" class="fg-lamp on"/>
<rect x="484" y="40" width="180" height="80" rx="6" class="fg-b hot"/><text x="498" y="68" class="fg-t mono">round: 3</text><text x="498" y="100" class="fg-t mono">hand:</text><circle cx="644" cy="96" r="5" class="fg-lamp on"/>
<rect x="150" y="176" width="200" height="44" rx="6" class="fg-b warm"/><text x="250" y="203" text-anchor="middle" class="fg-t mono">[7, 12]</text>
<text x="250" y="238" text-anchor="middle" class="fg-t sm warm">a 和 b 共用這一個陣列</text>
<rect x="500" y="176" width="164" height="44" rx="6" class="fg-b hot"/><text x="582" y="203" text-anchor="middle" class="fg-t mono">[7, 12]</text>
<text x="582" y="238" text-anchor="middle" class="fg-t sm acc">c 自己的一份</text>
<path d="M176 101 V150 H220 V168" class="fg-l warm"/><polygon points="220,176 215.5,168 224.5,168" class="fg-a warm"/>
<path d="M410 101 V150 H280 V168" class="fg-l warm"/><polygon points="280,176 275.5,168 284.5,168" class="fg-a warm"/>
<line x1="644" y1="101" x2="644" y2="168" class="fg-l on"/><polygon points="644,176 639.5,168 648.5,168" class="fg-a on"/>
</svg><figcaption>淺拷貝只換了外殼，裡面的陣列還是同一個：<code>b.hand.push(5)</code> 會讓 <code>a.hand</code> 也多一張牌。深拷貝連裡面的東西都重新做一份。</figcaption></figure>
<p>會產生淺拷貝的寫法：展開運算子（<code>{ ...a }</code>、<code>[...arr]</code>）、<code>Object.assign</code>、<code>arr.slice()</code>、<code>Array.from(arr)</code>、<code>arr.concat()</code>。只要資料只有一層，淺拷貝就夠了；有巢狀的物件或陣列，就要想清楚裡面那一層是不是共用的。</p>
<h4>不可變更新：只複製你要改的那條路</h4>
<pre><code>type Player = { name: string; hand: number[] };
type Game = { round: number; player: Player };

function addCard(g: Game, card: number): Game {
  return {
    ...g,
    player: {
      ...g.player,
      hand: [...g.player.hand, card],
    },
  };
}</code></pre>
<p>這叫<b>不可變更新</b>（immutable update）：不改舊的物件，而是沿著「要改的那條路」一層一層複製出新的，其他沒動到的部分直接共用。舊的 <code>g</code> 完全沒變，所以你可以拿新舊兩份來比較、做「上一步」、或交給 React 這類靠「地址有沒有變」判斷要不要重畫的框架。成本是每改一次，路上的每一層都要新做一個物件；大部分時候這點成本可以忽略，但在每秒跑 60 次的遊戲迴圈裡就要算一算。</p>
<h4>深拷貝的兩種方法，各有各的坑</h4>
<table>
<tr><th>方法</th><th>做得到</th><th>做不到</th></tr>
<tr><td><code>structuredClone</code></td><td>巢狀物件、陣列、Map、Set、Date、循環參照</td><td>函式（丟 DataCloneError）；類別實例會變成普通物件，方法和 <code>instanceof</code> 都沒了；Vue 的 reactive 物件是 Proxy，直接丟進去也會失敗，要先 <code>toRaw</code></td></tr>
<tr><td>JSON 往返</td><td>純資料：字串、數字、布林、陣列、普通物件</td><td><code>&#117;ndefined</code> 的屬性直接消失；Date 變字串；NaN 變 null；Map 變 <code>{}</code>；有循環參照就丟錯</td></tr>
</table>
<p>「JSON 往返」指的是 <code>JSON.parse(JSON.stringify(x))</code>：先轉成字串，再解析回來。兩種方法都要付出「整份重做」的成本：資料有 10 萬個節點，就要配置 10 萬個新物件。所以深拷貝適合「存檔」「送出前留一份快照」這種偶爾發生的事，不適合放在每一幀都跑的程式裡。</p>
<h4>哪些方法會改到原陣列</h4>
<table>
<tr><th>會改原陣列</th><th>回傳新陣列、原陣列不動</th></tr>
<tr><td><code>push</code>、<code>pop</code>、<code>shift</code>、<code>unshift</code>、<code>splice</code>、<code>sort</code>、<code>reverse</code>、<code>fill</code></td><td><code>map</code>、<code>filter</code>、<code>slice</code>、<code>concat</code>、<code>toSorted</code>、<code>toReversed</code>、<code>toSpliced</code>、<code>with</code></td></tr>
</table>
<p><code>sort</code> 有兩個坑。一是它改原陣列，同時又回傳同一個陣列，所以 <code>const sorted = hand.sort()</code> 看起來像是得到一份新的，其實 <code>hand</code> 也被排了。二是沒給比較函式時，它把元素轉成字串來比：<code>[10, 9, 1].sort()</code> 的結果是 <code>[1, 10, 9]</code>。排數字一定要寫 <code>(a, b) =&gt; a - b</code>。</p>
<div class="warn"><b>Vue 的 props 是「淺唯讀」。</b><code>props.cards = []</code> 會被型別擋下，開發模式下 Vue 也會在 console 警告；但 <code>props.cards.push(5)</code> 兩邊都不管：props 物件的屬性是唯讀的，可是 <code>cards</code> 這個陣列本身的型別是 <code>number[]</code>，執行時它也正是父元件手上的那個陣列。子元件這樣做，等於偷偷改了父元件的狀態，Vue 官方文件明確說這是要避免的寫法。要改，就 <code>emit</code> 一個事件，讓擁有資料的父元件自己改；或在 props 型別裡寫成 <code>readonly number[]</code>，讓檢查器幫你擋。</div>

<h3><span class="badge lv4">專家</span>七、引擎怎麼存物件：隱藏類別與 elements kinds</h3>
<p>JavaScript 的物件可以隨時加屬性，聽起來像是一張雜湊表，每讀一次屬性都要算一次雜湊。如果真是這樣，遊戲迴圈裡每秒讀上百萬次 <code>enemy.x</code> 會非常慢。V8 的做法是：幫每一種「屬性的組合和順序」建立一個<b>隱藏類別</b>（hidden class，V8 內部叫 map，其他引擎叫 shape）。同一個隱藏類別的物件，<code>x</code> 一定在同一個位置，讀的時候直接去那個位置拿，不用查表。</p>
<figure class="figure"><svg viewBox="0 0 680 232" class="fg" style="width:100%;max-width:680px" role="img" aria-label="隱藏類別的轉換：空物件先加 x 再加 y，和先加 y 再加 x，會走到兩個不同的隱藏類別；p1、p2 共用一個，p3 用另一個">
<rect x="16" y="95" width="100" height="40" rx="6" class="fg-b"/><text x="66" y="120" text-anchor="middle" class="fg-t mono">{ }</text>
<rect x="170" y="40" width="120" height="40" rx="6" class="fg-b"/><text x="230" y="65" text-anchor="middle" class="fg-t mono">{ x }</text>
<rect x="170" y="150" width="120" height="40" rx="6" class="fg-b"/><text x="230" y="175" text-anchor="middle" class="fg-t mono">{ y }</text>
<rect x="344" y="40" width="120" height="40" rx="6" class="fg-b hot"/><text x="404" y="65" text-anchor="middle" class="fg-t mono acc">{ x, y }</text>
<rect x="344" y="150" width="120" height="40" rx="6" class="fg-b warm"/><text x="404" y="175" text-anchor="middle" class="fg-t mono warm">{ y, x }</text>
<path d="M116 115 H143 V60 H162" class="fg-l"/><polygon points="170,60 162,55.5 162,64.5" class="fg-a"/>
<path d="M143 115 V170 H162" class="fg-l"/><polygon points="170,170 162,165.5 162,174.5" class="fg-a"/>
<text x="150" y="92" class="fg-t sm mono">+x</text><text x="150" y="150" class="fg-t sm mono">+y</text>
<line x1="290" y1="60" x2="336" y2="60" class="fg-l"/><polygon points="344,60 336,55.5 336,64.5" class="fg-a"/><text x="313" y="52" text-anchor="middle" class="fg-t sm mono">+y</text>
<line x1="290" y1="170" x2="336" y2="170" class="fg-l"/><polygon points="344,170 336,165.5 336,174.5" class="fg-a"/><text x="313" y="162" text-anchor="middle" class="fg-t sm mono">+x</text>
<rect x="508" y="34" width="156" height="52" rx="6" class="fg-b"/><text x="520" y="56" class="fg-t sm mono">p1 = { x: 1, y: 2 }</text><text x="520" y="76" class="fg-t sm mono">p2 = { x: 3, y: 4 }</text>
<line x1="508" y1="60" x2="472" y2="60" class="fg-l on"/><polygon points="464,60 472,55.5 472,64.5" class="fg-a on"/>
<rect x="508" y="150" width="156" height="40" rx="6" class="fg-b"/><text x="520" y="175" class="fg-t sm mono">p3 = { y: 1, x: 2 }</text>
<line x1="508" y1="170" x2="472" y2="170" class="fg-l warm"/><polygon points="464,170 472,165.5 472,174.5" class="fg-a warm"/>
<text x="340" y="222" text-anchor="middle" class="fg-t sm">屬性一樣、順序不同，就是不同的隱藏類別</text>
</svg><figcaption>每加一個屬性，物件就沿著箭頭換到下一個隱藏類別。p1 和 p2 走同一條路，共用一個；p3 加屬性的順序不同，落在另一個。</figcaption></figure>
<p>在 Node.js 22 用 <code>%HaveSameMap(p1, p2)</code> 實測，結果是 true；<code>%HaveSameMap(p1, p3)</code> 是 false。這會影響速度，原因在<b>內聯快取</b>（inline cache）：程式裡每一個讀屬性的位置（例如 <code>update</code> 裡的 <code>e.x</code>），V8 都會記住「上次來的物件是哪個隱藏類別、x 在第幾格」。</p>
<ul>
<li>這個位置永遠只看到一種隱藏類別：<b>單型</b>（monomorphic），最快，幾乎等於直接讀記憶體。</li>
<li>看到 2 到 4 種：<b>多型</b>（polymorphic），要多比對幾次，慢一些。</li>
<li>超過 4 種：<b>超多型</b>（megamorphic），放棄快取，改走通用的查詢路徑，明顯變慢。</li>
</ul>
<p>還有一個會讓物件掉出快速路徑的動作：<code>delete</code>。實測 <code>const q = { x: 1, y: 2 }; delete q.x;</code> 之後，<code>%HasFastProperties(q)</code> 變成 false，物件改用<b>字典模式</b>（dictionary mode）儲存，之後每次讀寫都像查雜湊表。要「清掉」一個欄位，設成 <code>&#117;ndefined</code> 或 <code>null</code>；真的需要經常增刪鍵，用 Map。</p>
<h4>陣列也有自己的「形狀」：elements kinds</h4>
<p>陣列的元素儲存區也分種類，V8 叫 elements kinds。用 <code>%DebugPrint</code> 一步一步看同一個陣列：</p>
<pre><code>// Node.js 22 用 %DebugPrint 實測的結果
const a: (number | string)[] = [1, 2, 3];
// 這時是 PACKED_SMI_ELEMENTS
a.push(1.5);  // → PACKED_DOUBLE_ELEMENTS
a.push('K');  // → PACKED_ELEMENTS
const b = [1, 2, 3];
b[10] = 4;    // → HOLEY_SMI_ELEMENTS</code></pre>
<ul>
<li><b>SMI</b>：小整數（small integer），直接存在格子裡，不用另外配置。</li>
<li><b>DOUBLE</b>：所有元素都是數字，以 8 位元組的浮點數一個接一個存放，不用一個一個包成物件。</li>
<li><b>ELEMENTS</b>：什麼都有，每格存一個指向任意值的地址，最通用也最慢。</li>
<li><b>PACKED／HOLEY</b>：有沒有洞。有洞的每次讀取都要多檢查「這格在不在」，必要時還得去原型上找。</li>
</ul>
<p>關鍵是：<b>這些轉換只會往「更通用」的方向走，不會回頭</b>。陣列裡放過一次字串，就算你把它刪掉，這個陣列也永遠是 PACKED_ELEMENTS；出現過洞，就永遠是 HOLEY。所以效能敏感的陣列（粒子、子彈、格子地圖），從一開始就只放同一種型別，不要跳著寫索引，也不要用 <code>new Array(n)</code> 先開一堆洞再填。TypeScript 的 <code>number[]</code> 型別剛好幫你守住「只放數字」這一條。</p>
<h4>把這些用在遊戲迴圈</h4>
<ul>
<li><b>形狀穩定</b>：同一種物件，用同一個建構子或工廠函式建立，所有欄位一開始就給值，順序固定。TypeScript 的類別欄位初始值（<code>hp = 100;</code>）天生就做到這一點。不要在執行到一半時才幫某些敵人加上 <code>boss</code> 屬性。</li>
<li><b>少配置</b>：每一幀都 <code>new</code> 物件、建立暫時的陣列，會讓垃圾回收（garbage collection，GC）更頻繁。V8 的新生代回收通常很快，但次數一多，加上偶爾的大回收，就可能吃掉一幀 16.7 毫秒的預算，畫面頓一下。子彈、特效這種大量重複的東西，用<b>物件池</b>（object pool）重複使用。</li>
<li><b>先量再改</b>：上面這些都是「在熱點上才值得」的事。先用 Chrome DevTools 的 Performance 面板找出真正花時間的函式，再針對它調整。</li>
</ul>
<h4>資安：原型污染</h4>
<p>第四節說一般物件會從原型繼承鍵。這件事有一個著名的攻擊：<b>原型污染</b>（prototype pollution）。</p>
<pre><code>type Bag = Record&lt;string, unknown&gt;;
function merge(t: Bag, s: Bag): Bag {
  for (const k in s) {
    const v = s[k];
    if (typeof v === 'object' &amp;&amp; v !== null) {
      t[k] = t[k] ?? {};
      merge(t[k] as Bag, v as Bag);
    } else {
      t[k] = v;
    }
  }
  return t;
}
const raw = '{"__proto__": {"isAdmin": true}}';
merge({}, JSON.parse(raw));
const anyone: Bag = {};
console.log(anyone.isAdmin);   // true：被污染了</code></pre>
<p><code>JSON.parse</code> 會產生一個名字叫 <code>__proto__</code> 的普通屬性；可是天真的合併函式寫進 <code>t['__proto__']</code> 時，拿到的是 <code>Object.prototype</code> 本身，於是 <code>isAdmin</code> 被加到了全世界所有物件的原型上。實測在 Node.js 22 上，最後一行印出 true：一個全新的空物件，身上也「有」了 isAdmin。如果伺服器某處寫了 <code>if (user.isAdmin)</code>，後果可想而知。防法：合併時跳過 <code>__proto__</code>、<code>constructor</code>、<code>prototype</code> 這幾個鍵；用外部資料當鍵的查詢表，改用 Map 或 <code>Object.create(null)</code>；用驗證函式庫把外部資料限制成你預期的形狀；套件保持更新（lodash 等函式庫都出過這類漏洞並已修補）。</p>

<h3>八、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td><code>const</code> 的陣列不能改</td><td><code>const</code> 只擋「換一個陣列」。要擋修改，型別上用 <code>readonly</code>，執行時用 <code>Object.freeze</code>。</td></tr>
<tr><td><code>{ ...a }</code> 就是一份完整的複製</td><td>只複製第一層，裡面的物件和陣列還是共用的。</td></tr>
<tr><td>元組的長度是固定的</td><td>只有型別上固定。<code>push</code> 照樣能用，要真的鎖住就寫 <code>readonly [string, number]</code>。</td></tr>
<tr><td><code>Record&lt;string, number&gt;</code> 讀出來一定是數字</td><td>不存在的鍵會得到 <code>&#117;ndefined</code>，型別卻寫 number，除非打開 <code>noUncheckedIndexedAccess</code>。</td></tr>
<tr><td>多餘屬性檢查代表 TypeScript 不准物件有多的屬性</td><td>只有新鮮的物件字面值會被檢查。結構型別本身允許多的屬性。</td></tr>
<tr><td>JavaScript 函式參數是「傳參照」</td><td>是傳值，只是物件的值本身就是一個地址。函式能改物件的內容，但換不掉呼叫者的變數。</td></tr>
<tr><td><code>Object.freeze</code> 讓整個物件都不能改</td><td>只凍結最外層，巢狀的物件照樣能改。</td></tr>
</table>

<h3>九、跟你的工作連起來</h3>
<ul>
<li><b>Vue</b>：<code>ref</code> 和 <code>reactive</code> 會把物件包成 Proxy，你改的是 Proxy，Vue 才知道要更新畫面。把同一個陣列同時放進兩個 <code>ref</code>，兩邊會互相影響，原因就是第一節的「同一個地址」。<code>reactive(new Map())</code> 也能用，Map 的 <code>set</code>、<code>delete</code> 都會觸發更新。</li>
<li><b>Cocos Creator</b>：模組最上層寫一個 <code>const DEFAULT_DECK = [...]</code>，再在元件裡 <code>this.deck = DEFAULT_DECK</code>，所有元件就共用同一副牌，一個元件 <code>pop()</code>，別的元件也少一張。要給每個元件自己的一份，寫 <code>this.deck = [...DEFAULT_DECK]</code>。<code>Vec3</code> 這類數學物件也一樣：兩個元件把同一個 <code>Vec3</code> 物件當成自己的速度來改，就會互相影響，要各自 <code>new Vec3()</code> 或用 <code>clone()</code>。</li>
<li><b>Node.js 後端</b>：快取（cache）回傳的物件，如果呼叫者拿去改，就改到了快取裡的那一份，下一個請求會讀到被改過的資料。快取要嘛回傳複製品，要嘛型別上標成 <code>Readonly</code>。用請求內容當鍵的表，記得原型污染。</li>
<li><b>前後端傳資料</b>：要送出或存進 localStorage 的狀態，用普通物件和陣列，不要用 Map、Set、Date 或類別實例，否則 <code>JSON.stringify</code> 會默默丟掉資訊。</li>
<li><b>Go</b>：Go 的 slice 也是「一個小小的標頭，指向一塊底層陣列」，<code>append</code> 超過容量時才搬家。兩個 slice 共用同一塊底層陣列而互相影響，是 Go 新手最常踩的坑，原理跟第二節完全一樣。</li>
</ul>

<h3>十、面試會怎麼問</h3>
<p>先自己講一遍（最好出聲講），再打開參考答案。</p>
<ol>
<li>「JavaScript 的原始值和物件，在指派和傳參數時有什麼不同？」</li>
<li>「淺拷貝和深拷貝差在哪？<code>structuredClone</code> 有什麼限制？」</li>
<li>「為什麼 <code>const p: Point = { x: 1, y: 2, z: 3 }</code> 會報錯，先放進變數再指派卻不會？」</li>
<li>「什麼時候用物件當查詢表，什麼時候用 Map？」</li>
<li>「<code>readonly number[]</code> 可以指派給 <code>number[]</code> 嗎？反過來呢？為什麼？」</li>
<li>「V8 的隱藏類別是什麼？寫程式時要注意什麼？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>原始值在指派和傳參數時複製值本身；物件複製的是參照（地址），兩個變數會指向同一個物件。JavaScript 一律是傳值，物件的「值」就是參照，所以函式可以修改物件的內容，但重新指派參數不會影響呼叫者。物件的 <code>===</code> 比的是不是同一個物件。</li>
<li>淺拷貝只複製第一層，巢狀的物件仍然共用；深拷貝遞迴複製所有層。<code>structuredClone</code> 支援巢狀物件、Map、Set、Date 和循環參照，但不能複製函式，類別實例會失去原型變成普通物件，Proxy（例如 Vue 的 reactive）也無法複製。JSON 往返則會丟掉 &#117;ndefined、把 Date 變成字串、無法處理循環參照。</li>
<li>這是多餘屬性檢查，只針對新鮮的物件字面值。直接寫的字面值沒有其他人引用，多出來的屬性幾乎一定是打錯；變數可能在別處被當成別的型別使用，所以只做結構檢查，多的屬性不算錯。另外，全部可選屬性的型別還有弱型別偵測，要求至少有一個屬性重疊。</li>
<li>鍵固定、要序列化成 JSON、或要當成資料結構的一部分時用物件；鍵來自外部輸入、經常增刪、鍵不是字串、或需要保證插入順序時用 Map。物件有原型上的鍵和原型污染的風險，像整數的鍵會被重新排序；Map 沒有這些問題，但 JSON.stringify 會變成空物件。</li>
<li>不行，會得到 TS4104；反過來可以。可改的值交給只讀的人不會破壞任何承諾，唯讀的值交給可能修改的人就違反了承諾。所以不修改陣列的函式參數應該宣告成 readonly，兩種陣列都能傳進來。</li>
<li>V8 為每一種屬性組合和加入順序建立一個隱藏類別，同類別的物件屬性位置相同，配合內聯快取可以直接讀固定位置。一個存取點只看到一種形狀最快，超過四種就變成超多型而變慢。實務上：同類物件用同一個建構子、所有欄位一開始就初始化、順序固定、避免 delete。陣列則保持元素型別一致、不要製造洞。</li>
</ol>
</details>

<h3>十一、練功題（做得出來才算真的懂）</h3>
<ol>
<li>先預測，再執行：<code>const a = { hand: [1] }; const b = { ...a }; const c = structuredClone(a); b.hand.push(2); c.hand.push(3);</code> 之後，<code>a.hand</code>、<code>b.hand</code>、<code>c.hand</code> 各是什麼？</li>
<li>寫一個函式 <code>topThree(scores: readonly number[]): number[]</code>，回傳最高的三個分數，由大到小，而且不能改到傳進來的陣列。先試試看用 <code>sort</code> 會發生什麼事。</li>
<li>寫一個 <code>type Level = 'easy' | 'normal' | 'hard'</code> 和一個 <code>Record&lt;Level, { target: number }&gt;</code> 的設定表。然後在 Level 加上 <code>'expert'</code>，看檢查器在哪裡報錯。</li>
<li>用 Node.js 跑 <code>Object.keys({ b: 1, 2: 'x', a: 2, 1: 'y' })</code>，解釋輸出的順序。換成 Map 會是什麼順序？</li>
<li>在 Playground 寫一個 <code>type Options = { volume?: number; loop?: boolean }</code>，分別用「直接寫字面值」和「先放進變數」兩種方式傳入 <code>{ volume: 1, speed: 2 }</code>。哪一種報錯？再傳入 <code>{ speed: 2 }</code> 的變數，報了什麼錯，為什麼？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li><code>a.hand</code> 和 <code>b.hand</code> 是同一個陣列，都是 <code>[1, 2]</code>；<code>c.hand</code> 是自己的一份，<code>[1, 3]</code>。</li>
<li>參數是 readonly，直接呼叫 <code>scores.sort()</code> 會被檢查器擋下，這正是你要的。寫法：<code>return scores.toSorted((a, b) =&gt; b - a).slice(0, 3);</code>，或在不支援 ES2023 的環境用 <code>[...scores].sort((a, b) =&gt; b - a).slice(0, 3)</code>。記得比較函式，不然數字會被當成字串排序。</li>
<li>設定表那一行會報錯，說少了 <code>expert</code> 這個屬性。這就是 Record 搭配字面值聯集的價值：新增一種情況，所有該補的地方都會被找出來。</li>
<li>輸出 <code>['1', '2', 'b', 'a']</code>：像整數的鍵先、由小到大，其他字串鍵照放入順序。Map 一律照放入順序。</li>
<li>直接寫字面值會報錯（多餘屬性 <code>speed</code>），先放進變數再傳就不報，因為多餘屬性檢查只看新鮮的字面值。只有 <code>{ speed: 2 }</code> 的變數會報 TS2559：Options 的屬性全部可選，是「弱型別」，檢查器要求至少有一個屬性對得上，而 speed 一個都對不上。</li>
</ol>
</details>

<h3>十二、想再挖深</h3>
<ul>
<li><b>TypeScript Handbook：Object Types</b>（<a href="https://www.typescriptlang.org/docs/handbook/2/objects.html">typescriptlang.org/docs/handbook/2/objects.html</a>）：可選屬性、唯讀、索引簽章、多餘屬性檢查、元組，官方的完整說明。</li>
<li><b>V8 官方部落格「Fast properties in V8」與「Elements kinds in V8」</b>（<a href="https://v8.dev/blog">v8.dev/blog</a>）：本章第二節和第七節的原始出處，附圖解釋隱藏類別、字典模式和每一種 elements kind。</li>
<li><b>MDN：structuredClone 與 Map</b>（<a href="https://developer.mozilla.org/">developer.mozilla.org</a>）：哪些型別可以被複製、Map 和物件的完整比較表。</li>
<li><b>Kyle Simpson《You Don't Know JS Yet》</b>（免費線上書）：把值、參照、物件、原型講得最透徹的 JavaScript 書，適合補第一節和原型污染那一段的底子。</li>
</ul>
` });
