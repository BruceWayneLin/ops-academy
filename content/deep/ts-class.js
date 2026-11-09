DEEP({ 'ts-class': `
<p>上一課你從物件一步一步長出了類別：模子、<code>new</code>、建構函式、<code>this</code>、<code>private</code>、<code>static</code>。這一章把類別拆開：它編譯之後到底變成什麼、方法為什麼只存一份、<code>new</code> 的時候欄位和建構函式是照什麼順序跑的、<code>private</code> 和 <code>#private</code> 在執行時差在哪裡。後半段要回答一個更實際的問題：同一件事，用類別、工廠函式、一般物件都寫得出來，什麼時候類別是對的選擇，什麼時候它反而礙事。</p>

<h3><span class="badge lv1">基礎</span>一、類別編譯之後是什麼：一個函式，加一個原型物件</h3>
<p>JavaScript 在 2015 年才有 <code>class</code> 這個關鍵字，但在那之前二十年，大家早就在寫「類別」了，用的是函式和一個叫<b>原型</b>（prototype）的機制。<code>class</code> 是在同一套機制上加了比較好讀的寫法。把上一課的 <code>Card</code> 編譯成舊版的 ES5，就看得到底下的骨架：</p>
<pre><code>class Card {
  rank: number;
  suit: string;
  constructor(rank: number, suit: string) {
    this.rank = rank;
    this.suit = suit;
  }
  isHigherThan(other: Card): boolean {
    return this.rank &gt; other.rank;
  }
}</code></pre>
<pre><code>// 編譯成 ES5 的 JavaScript
var Card = /** @class */ (function () {
    function Card(rank, suit) {
        this.rank = rank;
        this.suit = suit;
    }
    Card.prototype.isHigherThan = function (other) {
        return this.rank &gt; other.rank;
    };
    return Card;
}());</code></pre>
<p>三件事一眼就看得出來：</p>
<ol>
<li><b>類別本身是一個函式。</b>建構函式的內容，就是這個函式的本體。所以 <code>typeof Card</code> 是 <code>'function'</code>。</li>
<li><b>方法不在每個實例上，而在 <code>Card.prototype</code> 這個物件上。</b>用 <code>function</code> 寫的一般函式，天生都帶著一個 <code>prototype</code> 屬性（箭頭函式沒有），指向一個普通物件；方法就掛在那裡，只有一份。</li>
<li><b>欄位是建構函式裡的 <code>this.rank = rank</code>。</b>每做一個實例，就在那個實例自己身上放一份。</li>
</ol>
<p>用模子的比喻再說一次：每張牌只在自己身上記著點數和花色，外加一條線連到一本共用的說明書（原型）。說明書上寫著「怎麼比大小」。52 張牌，一本說明書。</p>
<figure class="figure"><svg viewBox="0 0 660 345" class="fg" style="width:100%;max-width:660px" role="img" aria-label="原型鏈：實例 a 和 b 各自存著 rank 和 suit，都連到 Card.prototype，上面有 isHigherThan；Card.prototype 連到 Object.prototype，再連到 null；函式 Card 透過 prototype 屬性指向 Card.prototype">
<rect x="20" y="40" width="170" height="70" rx="6" class="fg-b alt"/><text x="34" y="62" class="fg-t alt">a（實例）</text><text x="34" y="82" class="fg-t sm mono">rank: 5</text><text x="34" y="100" class="fg-t sm mono">suit: 'hearts'</text>
<rect x="20" y="140" width="170" height="70" rx="6" class="fg-b alt"/><text x="34" y="162" class="fg-t alt">b（實例）</text><text x="34" y="182" class="fg-t sm mono">rank: 12</text><text x="34" y="200" class="fg-t sm mono">suit: 'spades'</text>
<rect x="260" y="80" width="180" height="80" rx="6" class="fg-b hot"/><text x="350" y="104" text-anchor="middle" class="fg-t mono acc">Card.prototype</text><text x="274" y="126" class="fg-t sm mono">constructor</text><text x="274" y="146" class="fg-t sm mono">isHigherThan()</text>
<rect x="260" y="200" width="180" height="80" rx="6" class="fg-b"/><text x="350" y="224" text-anchor="middle" class="fg-t mono">Object.prototype</text><text x="274" y="246" class="fg-t sm mono">toString()</text><text x="274" y="266" class="fg-t sm mono">hasOwnProperty() …</text>
<rect x="300" y="304" width="100" height="30" rx="6" class="fg-b"/><text x="350" y="324" text-anchor="middle" class="fg-t mono">null</text>
<rect x="530" y="80" width="110" height="80" rx="6" class="fg-b alt"/><text x="585" y="104" text-anchor="middle" class="fg-t mono alt">Card</text><text x="585" y="124" text-anchor="middle" class="fg-t sm">一個函式</text><text x="585" y="146" text-anchor="middle" class="fg-t sm">static 放這裡</text>
<line x1="190" y1="75" x2="252" y2="104" class="fg-l on"/><polygon points="260,107.8 250.9,107.8 254.7,99.6" class="fg-a on"/>
<line x1="190" y1="175" x2="252" y2="136" class="fg-l on"/><polygon points="260,131 255,138.6 250.2,131" class="fg-a on"/>
<text x="221" y="126" text-anchor="middle" class="fg-t sm acc">原型連結</text>
<line x1="350" y1="160" x2="350" y2="192" class="fg-l on"/><polygon points="350,200 345.5,192 354.5,192" class="fg-a on"/>
<line x1="350" y1="280" x2="350" y2="296" class="fg-l on"/><polygon points="350,304 345.5,296 354.5,296" class="fg-a on"/>
<line x1="530" y1="110" x2="448" y2="110" class="fg-l alt"/><polygon points="440,110 448,105.5 448,114.5" class="fg-a alt"/>
<text x="485" y="102" text-anchor="middle" class="fg-t sm mono">.prototype</text>
<line x1="440" y1="140" x2="522" y2="140" class="fg-l dash"/><polygon points="530,140 522,135.5 522,144.5" class="fg-a"/>
<text x="485" y="158" text-anchor="middle" class="fg-t sm mono">constructor</text>
</svg><figcaption>綠色那條線就是<b>原型鏈</b>（prototype chain）：實例找不到的東西，就沿著它往上找。<code>Card</code> 函式和 <code>Card.prototype</code> 互相指著對方，靜態成員則放在 <code>Card</code> 函式身上。</figcaption></figure>
<pre><code>class Card {
  constructor(public rank: number, public suit: string) {}
  isHigherThan(other: Card): boolean {
    return this.rank &gt; other.rank;
  }
}
const a = new Card(5, 'hearts');
const b = new Card(12, 'spades');

console.log(typeof Card);                // 'function'
const proto = Object.getPrototypeOf(a);
console.log(proto === Card.prototype);   // true
// 同一個函式物件：方法只有一份
console.log(a.isHigherThan === b.isHigherThan);   // true
console.log(Object.keys(a));             // ['rank', 'suit']
console.log(Object.hasOwn(a, 'isHigherThan'));    // false</code></pre>

<h3><span class="badge lv1">基礎</span>二、讀一個屬性：沿著鏈子往上找</h3>
<p>你寫 <code>a.isHigherThan</code> 的時候，引擎做的事情很簡單：先看 <code>a</code> 自己身上有沒有；沒有，就順著原型連結到 <code>Card.prototype</code> 找；再沒有，就到 <code>Object.prototype</code>；一路找到 <code>null</code> 還沒有，答案就是 <code>&#117;ndefined</code>。</p>
<figure class="figure"><svg viewBox="0 0 640 220" class="fg" style="width:100%;max-width:640px" role="img" aria-label="四次屬性查找：a.rank 在 a 自己身上找到；a.isHigherThan 在 Card.prototype 找到；a.toString 在 Object.prototype 找到；a.fly 一路找到 null 都沒有，得到 &#117;ndefined">
<text x="210" y="28" text-anchor="middle" class="fg-t sm">a 自己</text><text x="340" y="28" text-anchor="middle" class="fg-t sm mono">Card.prototype</text><text x="470" y="28" text-anchor="middle" class="fg-t sm mono">Object.prototype</text><text x="585" y="28" text-anchor="middle" class="fg-t sm mono">null</text>
<text x="20" y="59" class="fg-t mono">a.rank</text>
<rect x="155" y="40" width="110" height="28" rx="5" class="fg-b hot"/><text x="210" y="59" text-anchor="middle" class="fg-t sm acc">找到：5</text>
<text x="20" y="101" class="fg-t mono">a.isHigherThan</text>
<rect x="155" y="82" width="110" height="28" rx="5" class="fg-b"/><text x="210" y="101" text-anchor="middle" class="fg-t sm">沒有</text>
<line x1="265" y1="96" x2="277" y2="96" class="fg-l"/><polygon points="285,96 277,91.5 277,100.5" class="fg-a"/>
<rect x="285" y="82" width="110" height="28" rx="5" class="fg-b hot"/><text x="340" y="101" text-anchor="middle" class="fg-t sm acc">找到：方法</text>
<text x="20" y="143" class="fg-t mono">a.toString</text>
<rect x="155" y="124" width="110" height="28" rx="5" class="fg-b"/><text x="210" y="143" text-anchor="middle" class="fg-t sm">沒有</text>
<line x1="265" y1="138" x2="277" y2="138" class="fg-l"/><polygon points="285,138 277,133.5 277,142.5" class="fg-a"/>
<rect x="285" y="124" width="110" height="28" rx="5" class="fg-b"/><text x="340" y="143" text-anchor="middle" class="fg-t sm">沒有</text>
<line x1="395" y1="138" x2="407" y2="138" class="fg-l"/><polygon points="415,138 407,133.5 407,142.5" class="fg-a"/>
<rect x="415" y="124" width="110" height="28" rx="5" class="fg-b hot"/><text x="470" y="143" text-anchor="middle" class="fg-t sm acc">找到</text>
<text x="20" y="185" class="fg-t mono">a.fly</text>
<rect x="155" y="166" width="110" height="28" rx="5" class="fg-b"/><text x="210" y="185" text-anchor="middle" class="fg-t sm">沒有</text>
<line x1="265" y1="180" x2="277" y2="180" class="fg-l"/><polygon points="285,180 277,175.5 277,184.5" class="fg-a"/>
<rect x="285" y="166" width="110" height="28" rx="5" class="fg-b"/><text x="340" y="185" text-anchor="middle" class="fg-t sm">沒有</text>
<line x1="395" y1="180" x2="407" y2="180" class="fg-l"/><polygon points="415,180 407,175.5 407,184.5" class="fg-a"/>
<rect x="415" y="166" width="110" height="28" rx="5" class="fg-b"/><text x="470" y="185" text-anchor="middle" class="fg-t sm">沒有</text>
<line x1="525" y1="180" x2="537" y2="180" class="fg-l warm"/><polygon points="545,180 537,175.5 537,184.5" class="fg-a warm"/>
<rect x="545" y="166" width="80" height="28" rx="5" class="fg-b warm"/><text x="585" y="185" text-anchor="middle" class="fg-t sm warm">&#117;ndefined</text>
</svg><figcaption>越常用的東西越靠近起點越快找到。現代引擎會把「上次在哪一層找到」快取起來，所以實際上不會每次都真的一層一層走。</figcaption></figure>
<p>從這張圖可以推出幾個你在除錯時會遇到的現象：</p>
<ul>
<li><b>寫入不會沿著鏈子往上。</b><code>a.isHigherThan = () =&gt; true</code> 不會改到說明書，而是在 <code>a</code> 自己身上多一個同名屬性，把原型上的那個「遮住」（shadowing）。只有 <code>a</code> 受影響，<code>b</code> 照舊。</li>
<li><b>改說明書，所有實例一起變。</b>反過來，改了 <code>Card.prototype.isHigherThan</code>，已經做出來的 52 張牌全部馬上用新版本。這叫猴子補丁（monkey patching），在測試裡偶爾有用，在正式程式碼裡是災難，尤其是去改 <code>Array.prototype</code> 這種大家共用的東西。</li>
<li><b><code>Object.keys</code> 和 <code>JSON.stringify</code> 只看實例自己。</b>方法在原型上，所以 <code>JSON.stringify(a)</code> 只會得到 <code>{"rank":5,"suit":"hearts"}</code>。這就是為什麼從 JSON 讀回來的資料，永遠只是一般物件：資料搬得過去，說明書搬不過去。</li>
<li><b>瀏覽器開發者工具裡的 <code>[[Prototype]]</code></b>（舊一點的寫法是 <code>__proto__</code>）就是這條連結。展開它，就能看到方法掛在哪一層。</li>
</ul>

<h3><span class="badge lv2">進階</span>三、new 的時候到底發生什麼：欄位和建構函式的順序</h3>
<p>上一課說 <code>new</code> 做三件事：做空物件、跑建構函式、交回物件。加上欄位初始值和繼承之後，順序要講得更精確，因為很多詭異的 bug 都藏在這裡。下一課會細講 <code>extends</code>，這裡先借用它來看順序：</p>
<pre><code>class Piece {
  label = 'piece';
  constructor() {
    console.log('Piece 建構函式，label =', this.label);
    this.describe();
  }
  describe(): void { console.log('Piece.describe'); }
}

class Enemy extends Piece {
  hp = 30;
  constructor() {
    super();
    console.log('Enemy 建構函式，hp =', this.hp);
  }
  override describe(): void {
    console.log('Enemy.describe，hp =', this.hp);
  }
}

new Enemy();
// Piece 建構函式，label = piece
// Enemy.describe，hp = &#117;ndefined
// Enemy 建構函式，hp = 30</code></pre>
<figure class="figure"><svg viewBox="0 0 640 290" class="fg" style="width:100%;max-width:640px" role="img" aria-label="new Enemy() 的六個步驟：做空物件、進入 Enemy 建構函式呼叫 super、Piece 欄位初始化、Piece 建構函式呼叫 describe 時 hp 還是 &#117;ndefined、super 回來後 Enemy 欄位初始化 hp 等於 30、Enemy 建構函式剩下的部分">
<text x="210" y="16" text-anchor="middle" class="fg-t sm">正在跑的程式</text><text x="520" y="16" text-anchor="middle" class="fg-t sm">這時物件身上有什麼</text>
<rect x="20" y="24" width="380" height="36" rx="6" class="fg-b"/><text x="34" y="47" class="fg-t">1 new：做出空物件，接上原型</text>
<rect x="20" y="68" width="380" height="36" rx="6" class="fg-b"/><text x="34" y="91" class="fg-t">2 Enemy 建構函式：第一行 super()</text>
<rect x="20" y="112" width="380" height="36" rx="6" class="fg-b alt"/><text x="34" y="135" class="fg-t">3 Piece 的欄位：label = 'piece'</text>
<rect x="20" y="156" width="380" height="36" rx="6" class="fg-b warm"/><text x="34" y="179" class="fg-t">4 Piece 建構函式：this.describe()</text>
<rect x="20" y="200" width="380" height="36" rx="6" class="fg-b hot"/><text x="34" y="223" class="fg-t">5 super() 回來，Enemy 的欄位：hp = 30</text>
<rect x="20" y="244" width="380" height="36" rx="6" class="fg-b"/><text x="34" y="267" class="fg-t">6 Enemy 建構函式剩下的部分</text>
<rect x="420" y="24" width="200" height="36" rx="6" class="fg-b"/><text x="434" y="47" class="fg-t sm mono">{ }</text>
<rect x="420" y="68" width="200" height="36" rx="6" class="fg-b"/><text x="434" y="91" class="fg-t sm mono">{ }</text>
<rect x="420" y="112" width="200" height="36" rx="6" class="fg-b"/><text x="434" y="135" class="fg-t sm mono">{ label: 'piece' }</text>
<rect x="420" y="156" width="200" height="36" rx="6" class="fg-b warm"/><text x="434" y="179" class="fg-t sm warm">讀到 hp：還是 &#117;ndefined</text>
<rect x="420" y="200" width="200" height="36" rx="6" class="fg-b hot"/><text x="434" y="223" class="fg-t sm mono">{ label, hp: 30 }</text>
<rect x="420" y="244" width="200" height="36" rx="6" class="fg-b"/><text x="434" y="267" class="fg-t sm mono">{ label, hp: 30 }</text>
</svg><figcaption>藍色是父類別的欄位，綠色是子類別的欄位。子類別的欄位要等 <code>super()</code> 整個跑完才會設定，所以父類別建構函式裡呼叫到的子類別方法，看到的是一個還沒長好的物件。</figcaption></figure>
<p>規則整理成三句：</p>
<ol>
<li><b>沒有父類別的類別</b>：先依照宣告順序設定所有欄位初始值，再跑建構函式本體。所以建構函式裡可以放心讀欄位的初始值。</li>
<li><b>有父類別的類別</b>：建構函式的第一件事一定是 <code>super()</code>（在那之前碰 <code>this</code> 會當掉，TypeScript 也會擋）。父類別整套跑完、<code>super()</code> 回來之後，才設定自己的欄位，接著跑 <code>super()</code> 後面的程式。</li>
<li><b>方法永遠是子類別的版本</b>：第 4 步裡，<code>this.describe()</code> 在 Piece 的建構函式裡呼叫，但 <code>this</code> 是一個 Enemy，所以跑到的是 <code>Enemy.describe</code>，而那時 <code>hp</code> 還沒設定。</li>
</ol>
<p>這個坑 TypeScript 完全不會警告。實務上的守則很簡單：<b>不要在建構函式裡呼叫可以被子類別覆寫的方法</b>。遊戲引擎正是因為這樣，才把初始化拆到建構之後的生命週期方法：Cocos Creator 的元件不在 <code>constructor</code> 裡做事，而是在 <code>onLoad</code>、<code>start</code> 裡做，那時候所有欄位和編輯器拉好的屬性都已經就位了。</p>

<h3><span class="badge lv2">進階</span>四、private 和 #private：兩種「不准碰」</h3>
<p>上一課提過兩種私有，這裡看它們在執行時到底差在哪裡：</p>
<pre><code>class Deck {
  private cards: number[] = [1, 2, 3];
  #secret: number[] = [4, 5, 6];
  count(): number {
    return this.cards.length + this.#secret.length;
  }
}

const d = new Deck();
d.cards;                          // 錯誤：cards 是 private
console.log(d['cards']);          // [1, 2, 3]：後門
d.#secret;                        // 錯誤：外面連寫都不能寫
console.log(JSON.stringify(d));   // {"cards":[1,2,3]}
console.log(Object.keys(d));      // ['cards']</code></pre>
<figure class="figure"><svg viewBox="0 0 640 240" class="fg" style="width:100%;max-width:640px" role="img" aria-label="物件 d 有兩個區域：一般屬性 cards，類別外的程式在執行時也拿得到；私有欄位 #secret 只有 Deck 類別裡的程式拿得到，外面的程式寫了是語法錯誤，Vue 的 Proxy 去讀會丟出 TypeError">
<rect x="220" y="24" width="200" height="190" rx="10" class="fg-b"/><text x="320" y="46" text-anchor="middle" class="fg-t lg">物件 d</text>
<rect x="236" y="60" width="168" height="54" rx="6" class="fg-b alt"/><text x="320" y="82" text-anchor="middle" class="fg-t mono">cards</text><text x="320" y="102" text-anchor="middle" class="fg-t sm">一般屬性，TS 編譯時擋</text>
<rect x="236" y="132" width="168" height="66" rx="6" class="fg-b hot"/><text x="320" y="154" text-anchor="middle" class="fg-t mono acc">#secret</text><text x="320" y="174" text-anchor="middle" class="fg-t sm">私有欄位</text><text x="320" y="190" text-anchor="middle" class="fg-t sm">引擎執行時擋</text>
<rect x="20" y="100" width="150" height="50" rx="6" class="fg-b hot"/><text x="95" y="122" text-anchor="middle" class="fg-t">Deck 類別裡的</text><text x="95" y="140" text-anchor="middle" class="fg-t">程式碼</text>
<path d="M170 116 H200 V87 H228" class="fg-l on"/><polygon points="236,87 228,82.5 228,91.5" class="fg-a on"/>
<path d="M170 134 H200 V165 H228" class="fg-l on"/><polygon points="236,165 228,160.5 228,169.5" class="fg-a on"/>
<rect x="480" y="60" width="140" height="54" rx="6" class="fg-b"/><text x="550" y="82" text-anchor="middle" class="fg-t">類別外面的程式碼</text><text x="550" y="102" text-anchor="middle" class="fg-t sm warm">碰 #secret：語法錯誤</text>
<line x1="480" y1="87" x2="412" y2="87" class="fg-l dash"/><polygon points="404,87 412,82.5 412,91.5" class="fg-a"/>
<text x="450" y="78" text-anchor="middle" class="fg-t sm">拿得到</text>
<rect x="480" y="146" width="140" height="54" rx="6" class="fg-b warm"/><text x="550" y="168" text-anchor="middle" class="fg-t">Vue 的 Proxy</text><text x="550" y="188" text-anchor="middle" class="fg-t sm warm">讀 #secret：TypeError</text>
<line x1="480" y1="173" x2="412" y2="173" class="fg-l warm"/><polygon points="404,173 412,168.5 412,177.5" class="fg-a warm"/>
<text x="450" y="164" text-anchor="middle" class="fg-t sm warm">✗</text>
</svg><figcaption><code>private</code> 是貼在門上的「請勿進入」，只對 TypeScript 檢查器有效；<code>#</code> 是真的上了鎖，鑰匙只在類別自己手上，連長得很像的 Proxy 都打不開。</figcaption></figure>
<table>
<tr><th></th><th><code>private cards</code></th><th><code>#secret</code></th></tr>
<tr><td>誰在擋</td><td>TypeScript 檢查器，只在編譯時</td><td>JavaScript 引擎，在執行時</td></tr>
<tr><td>編譯後</td><td>變成普通屬性，<code>private</code> 這個字消失</td><td>原樣保留（目標 ES2022 以上）；更舊的目標會改用 WeakMap 模擬</td></tr>
<tr><td>中括號 <code>d['cards']</code></td><td>檢查器放行，拿得到</td><td>沒有任何寫法能從外面拿到</td></tr>
<tr><td><code>JSON.stringify</code>、<code>Object.keys</code></td><td>看得到</td><td>看不到</td></tr>
<tr><td>子類別</td><td>不能用（要用 <code>protected</code>）</td><td>不能用，而且沒有 protected 的版本</td></tr>
<tr><td>測試時偷看</td><td>方便：<code>d['cards']</code></td><td>做不到，只能測公開的行為</td></tr>
</table>
<p>兩種都有人用。函式庫作者、需要真正封裝（例如不想讓使用者依賴內部狀態）的人偏好 <code>#</code>；大部分應用程式碼用 <code>private</code> 就夠了，它的目的本來就是「擋住自己人的失誤」。</p>
<h4>#private 撞上 Vue 的 Proxy</h4>
<p>這是一個很真實的坑。Vue 3 的 <code>reactive()</code>（還有 <code>ref()</code> 包物件時）會用 Proxy 把物件包一層，而且是一路往深層包。你呼叫 <code>state.counter.inc()</code> 時，方法裡的 <code>this</code> 是那個 Proxy，不是原本的物件。<code>#n</code> 這把鎖只認原本的物件，於是當場丟出 TypeError：</p>
<pre><code>import { reactive, markRaw } from 'vue';

class Counter {
  #n = 0;
  inc(): number { this.#n += 1; return this.#n; }
}

const state = reactive({ counter: new Counter() });
state.counter.inc();   // 執行時 TypeError：this 是 Proxy

const safe = reactive({ counter: markRaw(new Counter()) });
safe.counter.inc();    // 可以：markRaw 叫 Vue 不要包它</code></pre>
<p>檢查器看不出這個問題，因為型別完全正確。解法有三種：用 <code>markRaw</code> 或 <code>shallowRef</code> 讓 Vue 不要深層包它；類別裡改用 TypeScript 的 <code>private</code>；或者乾脆別把類別實例放進響應式狀態，改放純資料。最後一種通常最好，第七節會再談。</p>

<h3><span class="badge lv2">進階</span>五、存取器與 static：看起來像欄位的函式、屬於模子的東西</h3>
<p><b>存取器</b>（accessor）就是用 <code>get</code>、<code>set</code> 寫的「看起來像欄位、其實是函式」的屬性：</p>
<pre><code>class Timer {
  #ms = 1000;
  get seconds(): number { return this.#ms / 1000; }
  set seconds(s: number) {
    if (s &lt;= 0) throw new RangeError('seconds must be &gt; 0');
    this.#ms = s * 1000;
  }
}
const t = new Timer();
t.seconds = 2.5;                  // 呼叫 set
console.log(t.seconds);           // 2.5：呼叫 get
console.log(JSON.stringify(t));   // {}

class Hand {
  #cards = [3, 9, 12];
  get size(): number { return this.#cards.length; }
}
new Hand().size = 5;              // 錯誤：只有 get，是唯讀的</code></pre>
<p>存取器跟方法一樣放在原型上，所以有兩個後果：<code>JSON.stringify</code> 不會輸出它的值；Vue 讀取 getter 時，會追蹤到 getter 裡面讀了哪些響應式的值。它適合兩種場合：由其他欄位算出來的值（<code>size</code>），和寫入時需要檢查或連動的值（<code>seconds</code>）。不要在 getter 裡做昂貴的運算或有副作用的事，因為讀的人看起來只是讀一個欄位，不會預期它很慢或會改東西。</p>
<h4>static 走的是另一條鏈</h4>
<p>上一課說 <code>static</code> 放在模子上。精確地說，是放在類別那個函式物件身上。有繼承時，類別本身也有一條自己的原型鏈：</p>
<pre><code>class Enemy {
  static count = 0;
  static {
    // static 區塊：類別定義時跑一次
    console.log('Enemy 類別準備好了');
  }
  static create(): Enemy {
    // static 方法裡的 this 是「被呼叫的那個類別」
    this.count += 1;
    return new this();
  }
}
class Boss extends Enemy {}

const boss = Boss.create();
console.log(boss instanceof Boss);      // true
console.log(Enemy.count, Boss.count);   // 0 1：咦？</code></pre>
<figure class="figure"><svg viewBox="0 0 560 330" class="fg" style="width:100%;max-width:560px" role="img" aria-label="兩條平行的原型鏈：左邊是類別本身，Boss 連到 Enemy 再連到 Function.prototype；右邊是實例，boss 連到 Boss.prototype 再連到 Enemy.prototype。Boss 自己身上多了一個 count 等於 1，遮住了 Enemy 的 count 等於 0">
<text x="140" y="22" text-anchor="middle" class="fg-t">類別這條鏈：找 static</text>
<text x="420" y="22" text-anchor="middle" class="fg-t">實例這條鏈：找一般方法</text>
<rect x="40" y="36" width="200" height="48" rx="6" class="fg-b warm"/>
<text x="140" y="57" text-anchor="middle" class="fg-t mono">Boss</text><text x="140" y="75" text-anchor="middle" class="fg-t sm warm">count: 1（自己的）</text>
<line x1="140" y1="84" x2="140" y2="98" class="fg-l on"/><polygon points="140,106 135.5,98 144.5,98" class="fg-a on"/>
<rect x="40" y="106" width="200" height="48" rx="6" class="fg-b hot"/>
<text x="140" y="127" text-anchor="middle" class="fg-t mono">Enemy</text><text x="140" y="145" text-anchor="middle" class="fg-t sm mono">count: 0　create()</text>
<line x1="140" y1="154" x2="140" y2="168" class="fg-l on"/><polygon points="140,176 135.5,168 144.5,168" class="fg-a on"/>
<rect x="40" y="176" width="200" height="48" rx="6" class="fg-b"/>
<text x="140" y="197" text-anchor="middle" class="fg-t mono">Function.prototype</text><text x="140" y="215" text-anchor="middle" class="fg-t sm">call()、bind()</text>
<line x1="140" y1="224" x2="140" y2="238" class="fg-l on"/><polygon points="140,246 135.5,238 144.5,238" class="fg-a on"/>
<rect x="40" y="246" width="200" height="48" rx="6" class="fg-b"/>
<text x="140" y="275" text-anchor="middle" class="fg-t mono">Object.prototype</text>
<rect x="320" y="36" width="200" height="48" rx="6" class="fg-b alt"/>
<text x="420" y="57" text-anchor="middle" class="fg-t mono">boss</text><text x="420" y="75" text-anchor="middle" class="fg-t sm">new this() 做出來的</text>
<line x1="420" y1="84" x2="420" y2="98" class="fg-l alt"/><polygon points="420,106 415.5,98 424.5,98" class="fg-a alt"/>
<rect x="320" y="106" width="200" height="48" rx="6" class="fg-b"/>
<text x="420" y="135" text-anchor="middle" class="fg-t mono">Boss.prototype</text>
<line x1="420" y1="154" x2="420" y2="168" class="fg-l alt"/><polygon points="420,176 415.5,168 424.5,168" class="fg-a alt"/>
<rect x="320" y="176" width="200" height="48" rx="6" class="fg-b"/>
<text x="420" y="205" text-anchor="middle" class="fg-t mono">Enemy.prototype</text>
<line x1="420" y1="224" x2="420" y2="238" class="fg-l alt"/><polygon points="420,246 415.5,238 424.5,238" class="fg-a alt"/>
<rect x="320" y="246" width="200" height="48" rx="6" class="fg-b"/>
<text x="420" y="275" text-anchor="middle" class="fg-t mono">Object.prototype</text>
<text x="280" y="320" text-anchor="middle" class="fg-t sm">extends 同時接起兩條鏈：Boss → Enemy，Boss.prototype → Enemy.prototype</text>
</svg><figcaption><code>Boss.create()</code> 裡的 <code>this.count += 1</code>：讀的時候沿鏈子找到 Enemy 的 0，寫的時候卻寫在 Boss 自己身上。跟第二節的「寫入不會沿著鏈子往上」是同一件事。</figcaption></figure>
<p>所以 <code>Enemy.count</code> 還是 0，<code>Boss.count</code> 變成了 1。如果你的本意是「全部敵人共用一個計數器」，要寫 <code>Enemy.count += 1</code>，指名道姓；如果本意是「每個子類別各自計數」，現在的寫法反而是對的。<code>this</code> 在 static 方法裡指向「被呼叫的那個類別」，這個特性讓 <code>new this()</code> 能做出正確的子類別，是工廠方法的常見寫法。</p>
<p><code>static { … }</code> 是 ES2022 的<b>靜態初始化區塊</b>（static initialization block），類別定義的時候跑一次，適合放「算一次就好」的靜態資料，例如預先建好一張 52 張牌的對照表。</p>

<h3><span class="badge lv3">專業</span>六、參數屬性與欄位語意：同一段程式，兩種編譯結果</h3>
<p>上一課提過的<b>參數屬性</b>（parameter properties），是 TypeScript 自己的語法，JavaScript 沒有。它會被翻譯成真的程式碼：</p>
<pre><code>class Card {
  constructor(
    public readonly rank: number,
    public readonly suit: string,
    private faceUp = false,
  ) {}
  flip(): void { this.faceUp = !this.faceUp; }
}</code></pre>
<pre><code>// 編譯成 ES2022 的 JavaScript
class Card {
    rank;
    suit;
    faceUp;
    constructor(rank, suit, faceUp = false) {
        this.rank = rank;
        this.suit = suit;
        this.faceUp = faceUp;
    }
    flip() { this.faceUp = !this.faceUp; }
}</code></pre>
<p>注意上面多出來的 <code>rank;</code>、<code>suit;</code>、<code>faceUp;</code>。這是 ES2022 的原生欄位宣告。它跟舊的寫法有一個語意上的差別，叫做 <code>useDefineForClassFields</code>：</p>
<ul>
<li><b>舊語意（Set）</b>：欄位初始值被翻成建構函式裡的 <code>this.x = …</code>，就是一般的指派，會觸發父類別的 setter。</li>
<li><b>新語意（Define）</b>：欄位是用「定義屬性」的方式放上去的，不經過 setter，而且就算沒有初始值，也會先被定義成 <code>&#117;ndefined</code>。</li>
</ul>
<p>TypeScript 的規則是：<code>target</code> 設成 ES2022 以上（或 ESNext）時，<code>useDefineForClassFields</code> 預設是 true，用新語意；更舊的目標預設用舊語意。兩種語意下，同一段程式的行為會不一樣，最常見的是下面兩個：</p>
<pre><code>// 目標 ES2022：欄位初始值比參數屬性的指派更早跑
class Player {
  label = this.name.toUpperCase();   // 錯誤：name 還沒設定
  constructor(public readonly name: string) {}
}

class Piece {
  data: { hp: number } | null;
  constructor() { this.data = { hp: 30 }; }
}
class Enemy extends Piece {
  data!: { hp: number };   // 錯誤：會把 data 蓋回 &#117;ndefined
}
class Enemy2 extends Piece {
  declare data: { hp: number };   // 可以：只改型別
}</code></pre>
<p>第一個例子，看看上面的編譯結果就懂：<code>label = this.name.toUpperCase()</code> 是原生欄位，在建構函式本體之前跑，而 <code>this.name = name</code> 是建構函式本體的第一行，所以讀到的是 <code>&#117;ndefined</code>。第二個例子，子類別只是想把 <code>data</code> 的型別寫得更精確，卻產生了一個原生欄位宣告，<code>super()</code> 回來之後把父類別設好的值蓋成 <code>&#117;ndefined</code>。TypeScript 會用錯誤訊息（TS2729、TS2612）把這兩種情況都擋下來，解法分別是「把初始值搬進建構函式」和「改用 <code>declare</code>」。</p>
<p>這跟你的工作直接相關：同一份程式碼，在不同專案的 tsconfig 下可能有不同的行為。例如 Cocos Creator 3.8 為專案產生的 tsconfig，<code>target</code> 是 ES2015，還開了 <code>experimentalDecorators</code>（舊版的裝飾器），所以走的是舊語意；一個 <code>target</code> 設成 ESNext 的 Vite 專案則是新語意。把類別從一個專案搬到另一個時，這是要檢查的設定之一。</p>
<h4>參數屬性的未來</h4>
<p>參數屬性、<code>enum</code>、<code>namespace</code> 這幾個語法有一個共同點：它們不只是型別，還會產生程式碼。新版的 Node.js（23.6 起）可以直接執行 <code>.ts</code> 檔，做法是把型別「擦掉」就跑，但遇到會產生程式碼的語法就沒辦法。TypeScript 5.8 因此加了 <code>erasableSyntaxOnly</code> 選項，打開後禁止這些語法。如果你的後端打算走這條路，類別就要寫回「先宣告欄位、再在建構函式裡指派」的樣子。</p>

<h3><span class="badge lv3">專業</span>七、類別、工廠函式、一般物件：三種做法的帳</h3>
<p>同一副牌，三種寫法：</p>
<pre><code>// 一、類別
class DeckA {
  #cards: number[] = [];
  draw(): number | &#117;ndefined { return this.#cards.pop(); }
}

// 二、工廠函式加閉包
function createDeck() {
  const cards: number[] = [];
  return {
    draw: (): number | &#117;ndefined =&gt; cards.pop(),
  };
}

// 三、一般物件加獨立函式
type DeckData = { cards: number[] };
function draw(deck: DeckData): number | &#117;ndefined {
  return deck.cards.pop();
}</code></pre>
<figure class="figure"><svg viewBox="0 0 660 260" class="fg" style="width:100%;max-width:660px" role="img" aria-label="左邊：1000 個類別實例都連到同一個原型，方法只有 3 個函式物件；右邊：工廠函式做出的 1000 個物件，每個都帶著自己的 3 個函式，共 3000 個函式物件">
<text x="170" y="24" text-anchor="middle" class="fg-t lg">類別：1000 個實例</text>
<rect x="20" y="44" width="110" height="30" rx="5" class="fg-b alt"/><text x="75" y="64" text-anchor="middle" class="fg-t sm mono">enemy 1</text>
<rect x="20" y="84" width="110" height="30" rx="5" class="fg-b alt"/><text x="75" y="104" text-anchor="middle" class="fg-t sm mono">enemy 2</text>
<text x="75" y="136" text-anchor="middle" class="fg-t sm">⋮</text>
<rect x="20" y="150" width="110" height="30" rx="5" class="fg-b alt"/><text x="75" y="170" text-anchor="middle" class="fg-t sm mono">enemy 1000</text>
<rect x="190" y="64" width="130" height="100" rx="6" class="fg-b hot"/><text x="255" y="86" text-anchor="middle" class="fg-t sm mono acc">Enemy.prototype</text><text x="255" y="108" text-anchor="middle" class="fg-t sm mono">move()</text><text x="255" y="128" text-anchor="middle" class="fg-t sm mono">hit()</text><text x="255" y="148" text-anchor="middle" class="fg-t sm mono">draw()</text>
<line x1="130" y1="59" x2="182" y2="96" class="fg-l on"/><polygon points="188.5,100.6 179.4,99.5 184.6,92.2" class="fg-a on"/>
<line x1="130" y1="99" x2="182" y2="111" class="fg-l on"/><polygon points="189.8,112.8 181.1,115.6 183.1,106.8" class="fg-a on"/>
<line x1="130" y1="165" x2="182" y2="130" class="fg-l on"/><polygon points="188.6,125.5 184.4,133.6 179.4,126.2" class="fg-a on"/>
<text x="170" y="214" text-anchor="middle" class="fg-t acc">方法：3 個函式物件</text>
<text x="500" y="24" text-anchor="middle" class="fg-t lg">工廠函式：1000 個物件</text>
<rect x="360" y="44" width="280" height="34" rx="5" class="fg-b"/><text x="372" y="66" class="fg-t sm mono">obj 1</text>
<rect x="430" y="50" width="60" height="22" rx="4" class="fg-b warm"/><text x="460" y="65" text-anchor="middle" class="fg-t sm mono">move</text>
<rect x="500" y="50" width="60" height="22" rx="4" class="fg-b warm"/><text x="530" y="65" text-anchor="middle" class="fg-t sm mono">hit</text>
<rect x="570" y="50" width="60" height="22" rx="4" class="fg-b warm"/><text x="600" y="65" text-anchor="middle" class="fg-t sm mono">draw</text>
<rect x="360" y="88" width="280" height="34" rx="5" class="fg-b"/><text x="372" y="110" class="fg-t sm mono">obj 2</text>
<rect x="430" y="94" width="60" height="22" rx="4" class="fg-b warm"/><text x="460" y="109" text-anchor="middle" class="fg-t sm mono">move</text>
<rect x="500" y="94" width="60" height="22" rx="4" class="fg-b warm"/><text x="530" y="109" text-anchor="middle" class="fg-t sm mono">hit</text>
<rect x="570" y="94" width="60" height="22" rx="4" class="fg-b warm"/><text x="600" y="109" text-anchor="middle" class="fg-t sm mono">draw</text>
<text x="500" y="140" text-anchor="middle" class="fg-t sm">⋮</text>
<rect x="360" y="150" width="280" height="34" rx="5" class="fg-b"/><text x="372" y="172" class="fg-t sm mono">obj 1000</text>
<rect x="430" y="156" width="60" height="22" rx="4" class="fg-b warm"/><text x="460" y="171" text-anchor="middle" class="fg-t sm mono">move</text>
<rect x="500" y="156" width="60" height="22" rx="4" class="fg-b warm"/><text x="530" y="171" text-anchor="middle" class="fg-t sm mono">hit</text>
<rect x="570" y="156" width="60" height="22" rx="4" class="fg-b warm"/><text x="600" y="171" text-anchor="middle" class="fg-t sm mono">draw</text>
<text x="500" y="214" text-anchor="middle" class="fg-t warm">方法：3 × 1000 = 3000 個函式物件</text>
<text x="330" y="246" text-anchor="middle" class="fg-t sm">每個函式物件的大小看引擎而定，通常是幾十個位元組，加上閉包要記住的變數</text>
</svg><figcaption>類別的方法只有一份，所有實例共用；工廠函式每做一個物件，就連同它的方法一起再做一份。數量少時差別可以忽略，同一時間有上千個時才開始有感。</figcaption></figure>
<table>
<tr><th></th><th>類別</th><th>工廠函式＋閉包</th><th>一般物件＋函式</th></tr>
<tr><td>方法佔的記憶體</td><td>共用一份</td><td>每個物件一份</td><td>函式只有一份</td></tr>
<tr><td>真正的私有</td><td>用 <code>#</code></td><td>閉包天生就是</td><td>沒有，資料全公開</td></tr>
<tr><td><code>this</code> 跑掉的問題</td><td>有（方法被拿下來單獨呼叫時）</td><td>沒有（箭頭函式、不用 this）</td><td>沒有（不用 this）</td></tr>
<tr><td><code>instanceof</code></td><td>可以</td><td>不行</td><td>不行，要靠型別守衛</td></tr>
<tr><td>存檔、送網路（JSON）</td><td>要自己寫轉換，讀回來要重新 new</td><td>要自己寫轉換</td><td>直接就是 JSON</td></tr>
<tr><td>打包時移除沒用到的程式</td><td>類別的方法通常整包留下</td><td>整個工廠一起留下</td><td>沒用到的函式可以個別移除</td></tr>
<tr><td>放進 Vue 響應式狀態</td><td>可以，但小心 <code>#</code> 和 this</td><td>可以，但閉包裡的變數不是響應式的</td><td>最自然</td></tr>
</table>
<p>工廠函式那一欄的最後一格值得多說一句：閉包裡的 <code>cards</code> 是一個普通變數，Vue 包得到回傳的物件，卻包不到閉包裡的變數，所以改了 <code>cards</code>，畫面不會更新。這就是 Vue 的 composable 一律把狀態放在 <code>ref</code> 裡回傳的原因。</p>

<h3><span class="badge lv4">專家</span>八、什麼時候類別幫忙，什麼時候礙事</h3>
<h4>類別真正好用的地方</h4>
<ul>
<li><b>框架要求你用</b>：Cocos Creator 的元件一定是繼承 <code>Component</code> 的類別。引擎負責 <code>new</code>，負責呼叫 <code>onLoad</code>、<code>update</code>，裝飾器負責把類別和欄位登記給編輯器。在這種地方，類別不是選擇，是介面。</li>
<li><b>大量、有身分、有生命週期的東西</b>：遊戲裡的子彈、敵人、粒子。數量大，共用方法省記憶體；每個都有自己的狀態，而且會被建立、更新、銷毀。</li>
<li><b>需要 <code>instanceof</code> 的地方</b>：自訂錯誤型別是最好的例子，<code>catch</code> 裡用 <code>instanceof</code> 分辨是哪一種錯。</li>
<li><b>要保護不變條件（invariant）的狀態</b>：一副牌「只能抽、不能亂塞」，用私有欄位加公開方法，把規則鎖在一個地方。</li>
</ul>
<pre><code>import { _decorator, Component, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Mover')
export class Mover extends Component {
  @property speed = 100;   // 出現在編輯器的屬性面板
  private dir = new Vec3(1, 0, 0);

  update(dt: number) {              // 引擎每一格畫面呼叫一次
    const p = this.node.position;
    const dx = this.dir.x * this.speed * dt;
    this.node.setPosition(p.x + dx, p.y, p.z);
  }
}</code></pre>
<p><code>@ccclass('Mover')</code> 幫這個類別向引擎登記一個唯一的名字，<code>@property</code> 讓欄位出現在編輯器裡、可以存進場景檔。注意 Cocos 本身的架構其實是「組合優於繼承」：一個節點身上掛好幾個元件，各管一件事，而不是寫一棵很深的繼承樹。類別在這裡是用來定義「一個元件」，不是用來表達「敵人是一種角色是一種物件」。</p>
<pre><code>class GameError extends Error {
  constructor(message: string, readonly code: number) {
    super(message);
    this.name = 'GameError';
  }
}

try {
  throw new GameError('deck is empty', 42);
} catch (e) {
  if (e instanceof GameError) console.log(e.code);   // 42
}</code></pre>
<p>一個老坑：如果編譯目標是 ES5，繼承 <code>Error</code>、<code>Array</code> 這類內建類別時，<code>instanceof</code> 會失靈，得在建構函式裡補一行 <code>Object.setPrototypeOf(this, new.target.prototype)</code>。目標是 ES2015 以上（現在幾乎都是）就沒有這個問題。</p>
<h4>類別礙事的地方</h4>
<ul>
<li><b>單純的資料</b>：API 回應、設定、存檔。這些東西要被序列化、被複製、被比較，類別實例在這裡全是麻煩：JSON 讀回來不是實例、<code>{ ...card }</code> 複製出來會掉了原型、方法全不見。用 type 描述的一般物件最好。</li>
<li><b>Vue 的狀態</b>：Vue 的響應式系統是為一般物件設計的。類別實例放進去，要面對 Proxy 打不開 <code>#</code>、解構方法後 <code>this</code> 跑掉（<code>const { inc } = state.counter</code>）等問題。Composition API 的風格是 composable 加一般物件，不是類別。</li>
<li><b>很深的繼承樹</b>：三層以上的繼承，改一個父類別方法，牽動所有子類別；子類別也很難只拿父類別的一部分。下一課講繼承時，會一直回到「能用組合就別用繼承」這句話。</li>
<li><b>只有一個方法、沒有狀態的類別</b>：例如 <code>class ScoreCalculator { calc(x) {…} }</code>。這就只是一個函式，包成類別只是多一層 <code>new</code>。</li>
</ul>
<h4>效能：讓引擎看到「形狀一樣」的物件</h4>
<p>V8 這類引擎會替每一種「物件形狀」（有哪些屬性、照什麼順序加上去）建立一個內部描述，叫隱藏類別（hidden class，V8 內部叫 map）。存取屬性的程式碼會記住「上次看到的是哪一種形狀、屬性在第幾格」，下次遇到同樣形狀就直接去那一格拿，非常快。同一個位置看到的形狀種類一多，這個快取就失效，速度會掉很多。</p>
<pre><code>class Bullet {
  // 每一顆子彈：同樣的欄位、同樣的順序、在建構時就全部設定好
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  alive = true;
}

const pool = Array.from({ length: 200 }, () =&gt; new Bullet());</code></pre>
<p>類別的欄位宣告天生就做到了「每個實例形狀一樣」。要破壞它，就是在建構之後才零星地加屬性（<code>bullet.target = enemy</code> 只對某幾顆子彈做）、或用 <code>delete</code> 拿掉屬性，這會讓物件的形狀分岔。遊戲裡大量的同類物件，再加上上面的物件池（object pool）重複使用、不一直 <code>new</code> 新的，是減少垃圾回收停頓最基本的兩招。這些都是「量測確認是瓶頸之後」才值得花力氣的最佳化。</p>

<h3>九、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>JavaScript 的類別跟 Java、C# 的一樣</td><td>它是建在原型上的語法。類別是函式，方法在原型物件上，執行時可以被改、被借走。</td></tr>
<tr><td>每個實例都帶著一份方法</td><td>一般方法只有一份，在原型上。箭頭函式欄位（<code>f = () =&gt; …</code>）才是每個實例一份。</td></tr>
<tr><td><code>private</code> 在執行時也保護資料</td><td>它編譯後消失，中括號、<code>JSON.stringify</code>、開發者工具都看得到。要執行時保護用 <code>#</code>。</td></tr>
<tr><td>欄位初始值在建構函式之後才設定</td><td>沒有父類別時，欄位在建構函式本體之前設定；有父類別時，在 <code>super()</code> 回來之後馬上設定。</td></tr>
<tr><td>形狀一樣的物件就是那個類別的實例</td><td>型別上可以互相指派（結構型別），但執行時沒有原型、沒有方法，<code>instanceof</code> 是 false。類別有 private 欄位時，連型別上都不行。</td></tr>
<tr><td>寫成類別比較「專業」</td><td>資料用一般物件、沒有狀態的邏輯用函式，類別留給有狀態、有行為、有生命週期的東西。</td></tr>
</table>

<h3>十、跟你的工作連起來</h3>
<ul>
<li><b>Cocos Creator</b>：元件就是類別。初始化放 <code>onLoad</code>／<code>start</code>，不要放 <code>constructor</code>；不要在父類別的生命週期方法裡依賴子類別欄位的初始值。專案的 tsconfig 是 ES2015 目標加舊版裝飾器，搬程式碼進出時記得欄位語意的差別。</li>
<li><b>Vue</b>：狀態用一般物件和 <code>ref</code>／<code>reactive</code>；真的要放類別實例（例如一個第三方函式庫的物件），用 <code>markRaw</code> 或 <code>shallowRef</code>。</li>
<li><b>Node.js 後端</b>：服務層常用類別搭配依賴注入（例如 NestJS 整個框架就是類別加裝飾器）；資料傳輸物件（DTO）則用 type 或驗證函式庫產生的型別。</li>
<li><b>Go</b>：Go 沒有類別和繼承，只有 struct 加方法、介面和嵌入（embedding）。習慣了 Go 再回來看，會更容易分辨哪些類別其實只需要「資料加幾個函式」。</li>
<li><b>除錯</b>：在開發者工具展開物件的 <code>[[Prototype]]</code>，看方法掛在哪一層；物件「明明有這個方法卻說 not a function」，通常是它其實是 JSON 讀回來的一般物件。</li>
</ul>

<h3>十一、面試會怎麼問</h3>
<ol>
<li>「JavaScript 的 class 底層是怎麼運作的？說明原型鏈和屬性查找。」</li>
<li>「<code>new</code> 一個有父類別的類別時，欄位初始化、父類別建構函式、子類別建構函式的執行順序是什麼？有什麼陷阱？」</li>
<li>「TypeScript 的 <code>private</code> 和 JavaScript 的 <code>#</code> 私有欄位有什麼不同？各在什麼時候用？」</li>
<li>「什麼時候你會選擇類別，什麼時候選擇工廠函式或一般物件？」</li>
<li>「static 方法裡的 <code>this</code> 是什麼？static 成員會被繼承嗎？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>class 是建立在原型上的語法。類別本身是一個建構函式，方法放在它的 <code>prototype</code> 物件上，所有實例共用；欄位放在每個實例自己身上。讀屬性時，引擎先看物件自己，找不到就沿著原型連結往上找，一路到 <code>Object.prototype</code>，再到 null 為止，都沒有就是 &#117;ndefined。寫入則永遠寫在物件自己身上，會遮住原型上的同名屬性。</li>
<li>建立物件並接上 <code>new.target.prototype</code>；進入子類別建構函式，必須先呼叫 <code>super()</code>；父類別先設定自己的欄位、再跑自己的建構函式本體；<code>super()</code> 回來後，子類別設定自己的欄位，再跑建構函式剩下的部分。陷阱是父類別建構函式裡呼叫被子類別覆寫的方法時，子類別的欄位還沒初始化，會讀到 &#117;ndefined。另外在新的欄位語意（useDefineForClassFields）下，欄位初始值比參數屬性的指派更早執行，子類別重新宣告欄位會蓋掉父類別設好的值。</li>
<li><code>private</code> 只是編譯時的檢查，編譯後是普通屬性，中括號存取、序列化、開發者工具都看得到，適合應用程式內部防止誤用，測試也方便。<code>#</code> 是執行時由引擎保證的私有，外部沒有任何方式存取，不會出現在 <code>Object.keys</code> 和 JSON 裡，適合函式庫或需要真正封裝的地方；代價是無法從測試偷看、子類別也拿不到，而且透過 Proxy（例如 Vue 的 reactive）呼叫方法時會丟出 TypeError。</li>
<li>有狀態、有行為、數量多或有生命週期，或框架要求時用類別（例如遊戲物件、引擎元件、自訂錯誤）；需要真正私有、又不想處理 this 時用工廠函式加閉包；單純資料、要序列化、要放進 Vue 響應式狀態時用一般物件加獨立函式。另外要考慮記憶體（類別方法共用一份）、instanceof 需求和打包大小。</li>
<li>static 方法裡的 <code>this</code> 是被呼叫的那個類別（建構函式）本身，所以子類別呼叫繼承來的 static 方法時，<code>this</code> 是子類別，<code>new this()</code> 會做出子類別實例。static 成員會被繼承，因為 <code>extends</code> 讓子類別這個函式的原型指向父類別；但透過 <code>this</code> 寫入 static 欄位時，會在子類別自己身上建立新的屬性，不會改到父類別的。</li>
</ol>
</details>

<h3>十二、練功題（做得出來才算真的懂）</h3>
<ol>
<li>不要跑，先預測：<code>const a = new Card(5, 'hearts'); a.isHigherThan = () =&gt; true;</code> 之後，<code>new Card(1, 'clubs').isHigherThan(new Card(9, 'clubs'))</code> 的結果是什麼？為什麼？</li>
<li>不用 <code>class</code> 關鍵字，只用函式和 <code>prototype</code>，寫出一個跟 <code>Card</code> 行為相同的建構函式（用一般 JavaScript 的寫法即可）。</li>
<li>修好這個類別，讓 <code>new Player('mia').label</code> 在目標 ES2022 下得到 <code>'MIA'</code>：<code>class Player { label = this.name.toUpperCase(); constructor(public readonly name: string) {} }</code>。</li>
<li>一個 Vue 元件把 <code>new Timer()</code>（裡面用 <code>#ms</code>）放進 <code>reactive</code>，結果一呼叫方法就丟 TypeError。說明原因，給兩種修法。</li>
<li>把一個你專案裡「只有一個方法、沒有欄位」的類別改寫成函式；再找一個「一堆零散變數加一堆函式一起操作」的地方，想想改成類別會不會比較好，寫下一句理由。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li><code>false</code>（1 沒有比 9 大）。<code>a.isHigherThan = …</code> 只在 <code>a</code> 自己身上加了一個同名屬性，遮住原型上的方法；新做出來的牌照樣用原型上的版本。</li>
<li><pre><code>// 一般的 JavaScript
function Card(rank, suit) {
  this.rank = rank;
  this.suit = suit;
}
Card.prototype.isHigherThan = function (other) {
  return this.rank &gt; other.rank;
};
const a = new Card(5, 'hearts');</code></pre>這就是 class 出現之前大家寫「類別」的方式，也幾乎就是 TypeScript 編譯到 ES5 時的輸出。</li>
<li>把依賴參數的初始化搬進建構函式本體：<pre><code>class Player {
  readonly label: string;
  constructor(public readonly name: string) {
    this.label = name.toUpperCase();
  }
}
console.log(new Player('mia').label);   // MIA</code></pre>或把 <code>label</code> 改成 getter：<code>get label() { return this.name.toUpperCase(); }</code>，每次讀取時才算。</li>
<li>reactive 會深層用 Proxy 包住物件，呼叫 <code>state.timer.start()</code> 時方法裡的 <code>this</code> 是 Proxy，而 <code>#ms</code> 只認原本的物件，所以存取私有欄位時丟出 TypeError。修法：（1）放進去之前用 <code>markRaw(new Timer())</code>，或改用 <code>shallowRef</code>；（2）類別裡把 <code>#ms</code> 改成 TypeScript 的 <code>private ms</code>。更好的長期做法是只把需要顯示在畫面上的純資料放進響應式狀態。</li>
<li>沒有標準答案。判斷標準：如果那堆變數總是一起出現、一起被修改，而且有「哪些修改是合法的」規則要守，類別（私有欄位加方法）能把規則集中；如果它們只是被讀取、被傳來傳去，一般物件加函式就夠了。</li>
</ol>
</details>

<h3>十三、想再挖深</h3>
<ul>
<li><b>TypeScript Handbook：Classes</b>（<a href="https://www.typescriptlang.org/docs/handbook/2/classes.html">typescriptlang.org</a>）：官方手冊的類別章節，參數屬性、存取器、<code>this</code> 型別、private 與 # 的比較都有。</li>
<li><b>MDN：Inheritance and the prototype chain</b>（<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain">developer.mozilla.org</a>）：原型鏈的權威說明，附很多可以直接在主控台試的例子。</li>
<li><b>TSConfig Reference：useDefineForClassFields</b>（<a href="https://www.typescriptlang.org/tsconfig">typescriptlang.org/tsconfig</a>）：兩種欄位語意的官方說明，搬專案前必讀。</li>
<li><b>Kyle Simpson《You Don't Know JS》第一版的《this &amp; Object Prototypes》</b>：把原型和「類別只是語法」講得最徹底的一本，GitHub 上可以免費讀。</li>
<li><b>Cocos Creator 3.8 官方文件的「腳本」章節</b>：元件的生命週期、裝飾器、屬性面板的規則，跟這一章的建構順序對照著看。</li>
</ul>
` });
