MZ({
  id: 'ts2',
  title: '類別與形狀',
  time: '1 到 2 週',
  blurb: '把類別當成模子、繼承與抽象基底類別、把介面當成形狀、把泛型當成標籤先空著的盒子。你之後會用到的每一個框架和遊戲引擎，底下都是這幾塊積木。',
  lessons: [
  {
    id: 'ts-class',
    title: '類別：從零長出來',
    body: `
<p>你已經會物件了。這一課從物件出發，一步一步長出類別（class）。範例是一個撲克牌小遊戲：<b>猜大小（Higher or Lower）</b>。桌上翻開一張牌，玩家猜下一張會比較大還是比較小，每猜對一次得一分。</p>
<h3>第一步：你已經會物件了</h3>
<p>物件就是一包有名字的值。一張牌就是一個點數，從 1（A）到 13（K），再加上一個花色：</p>
<pre><code>const card = { rank: 5, suit: 'hearts' };
console.log(card.rank); // 5</code></pre>
<p>一張牌這樣寫沒問題。可是一副牌有 52 張。</p>
<h3>第二步：很多個長得一樣的物件，就會想要一個模子</h3>
<p>52 個物件全部手寫，遲早會有一個寫成 <code>rnak</code>，或是把點數存成文字。每一張牌本來就該有一樣的形狀、一樣的能力，例如回答「我比那張牌大嗎？」。需要很多個長得一樣的物件時，你要的是一個<b>模子</b>（mould）：在同一個地方講清楚每個複製品長什麼樣子，壓出來的每一個就都一樣。在 TypeScript 裡，這個模子就是<b>類別</b>。</p>
<div class="tiers"><b>模子</b><div><span class="box hot">class Card<small>rank、suit、isHigherThan()</small></span></div><b>new</b><div><span class="arr">&darr; new Card(5, 'hearts')</span><span class="arr">&darr; new Card(12, 'spades')</span><span class="arr">&darr; new Card(1, 'clubs')</span></div><b>複製品</b><div><span class="box">紅心 5</span><span class="box">黑桃 12</span><span class="box">梅花 1</span></div></div>
<p>一個模子，很多個複製品。每一個複製品叫做這個類別的一個<b>實例</b>（instance）。每個實例有自己的點數和花色，能力則全都一樣。</p>
<h3>第三步：new 壓出一個，constructor 收下每一個需要的東西</h3>
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
}

const a = new Card(5, 'hearts');
const b = new Card(12, 'spades');
console.log(b.isHigherThan(a)); // true</code></pre>
<p>從上往下讀：</p>
<ul>
<li><b>欄位</b>（field），也就是 <code>rank</code>、<code>suit</code>，是每個複製品各自存著的值。型別寫的是裡面可以放什麼。</li>
<li><b>建構函式</b>（constructor）是每做一個新的複製品就會跑一次的函式。它的參數，就是做一個複製品時你一定要交出來的東西：這裡是點數和花色。</li>
<li><b>方法</b>（method），像 <code>isHigherThan</code>，是每個複製品都能用的函式。任何一張牌都能回答這個問題。</li>
</ul>
<p>你寫下 <code>new Card(5, 'hearts')</code> 的時候，會依序發生三件事：</p>
<div class="flow"><span class="box">1. 做一個空物件</span><span class="arr">&rarr;</span><span class="box hot">2. 執行建構函式<small>this 指向那個新物件</small></span><span class="arr">&rarr;</span><span class="box">3. 把物件交回來<small>存進 a</small></span></div>
<h3>第四步：this 就是「被呼叫的那一個複製品」</h3>
<p>在建構函式和方法裡面，<code>this</code> 就是那一個特定的複製品。在 <code>b.isHigherThan(a)</code> 裡，<code>this</code> 是 <code>b</code>，<code>other</code> 是 <code>a</code>。同一份方法的程式碼能服務 52 張牌，就是因為每次呼叫時 <code>this</code> 都換成不同的那一張。</p>
<p>有一個陷阱，先認得它，以後碰到才看得出來：<code>this</code> 是看方法「怎麼被呼叫」來決定的，不是看它寫在哪裡。把方法從物件上拿下來單獨呼叫，<code>this</code> 就不見了。接著上面的例子：</p>
<pre><code>const check = b.isHigherThan;
check(a);                          // crash: this is &#117;ndefined
const safe = () =&gt; b.isHigherThan(a);
safe();                            // fine: called on b</code></pre>
<p>第一行 TypeScript 不會警告你。最容易中招的時候，是把方法當成 callback 交出去，例如交給計時器或點擊事件。像最後兩行那樣，用箭頭函式包起來就好。這也是為什麼 Cocos Creator 的 <code>node.on(...)</code> 會多收一個參數：要拿來當 <code>this</code> 的那個物件。</p>
<h3>第五步：public、private、protected：誰可以碰</h3>
<p>放在欄位或方法前面、用來控制誰可以用它的這些字，叫做<b>存取修飾詞</b>（access modifier）。</p>
<table>
<tr><th>關鍵字</th><th>誰可以讀、可以改</th><th>就像</th></tr>
<tr><td><code>public</code>（預設）</td><td>任何拿到這個物件的人</td><td>攤在桌上的牌面</td></tr>
<tr><td><code>private</code></td><td>只有這個類別裡面的程式碼</td><td>發牌的人手上那副牌的順序</td></tr>
<tr><td><code>protected</code></td><td>這個類別，以及從它做出來的類別（下一課）</td><td>家傳食譜</td></tr>
<tr><td><code>readonly</code></td><td>唯讀（readonly）：誰都可以讀。只能設定一次，在欄位宣告或建構函式裡，之後就不能再改。</td><td>用墨水印上去的，不是用鉛筆寫的</td></tr>
</table>
<p>一副牌正好用得上這些。外面的人不該伸手進去重排牌，只能抽牌。</p>
<pre><code>class Deck {
  static readonly SIZE = 52;
  private cards: Card[] = [];
  constructor() {
    for (const suit of ['hearts', 'diamonds', 'clubs', 'spades']) {
      for (let rank = 1; rank &lt;= 13; rank++) {
        this.cards.push(new Card(rank, suit));
      }
    }
  }
  draw(): Card | &#117;ndefined {
    return this.cards.pop();
  }
}

const deck = new Deck();
deck.draw();             // fine
deck.cards = [];         // error: cards is private
console.log(Deck.SIZE);  // 52</code></pre>
<p>private 的檢查發生在你打字的時候，也就是在編輯器裡、在編譯的時候。最後真正跑起來的 JavaScript 完全不知道這回事，因為 <code>private</code> 會被拿掉。用來擋住失誤，這樣就夠了，它本來就是為了這個而存在。</p>
<h3>第六步：static 屬於模子，不屬於每一個複製品</h3>
<p>有些東西講的是「牌」這件事，而不是某一張牌：一副完整的牌有幾張、到目前為止總共做了幾張牌。這種就標成 <code>static</code>。<b>靜態成員</b>（static member）放在類別本身上，所以要透過類別名稱去拿，像 <code>Deck.SIZE</code>，而不是透過某一個複製品。</p>
<pre><code>class Card {
  static made = 0;     // one number, kept on the mould
  rank: number;        // one per copy
  suit: string;

  constructor(rank: number, suit: string) {
    this.rank = rank;
    this.suit = suit;
    Card.made += 1;
  }
}

new Card(5, 'hearts');
new Card(12, 'spades');
console.log(Card.made); // 2</code></pre>
<div class="tiers"><b>在模子上</b><div><span class="box hot">Card.made<small>只有一個值，大家共用</small></span><span class="box hot">Deck.SIZE<small>透過類別名稱讀取</small></span></div><b>在每個複製品上</b><div><span class="box">card.rank</span><span class="box">card.suit</span><span class="box">card.isHigherThan()</span></div></div>
<p>其實你用靜態成員很多年了，只是不知道它叫這個名字：<code>Date.now()</code> 和 <code>Array.isArray()</code> 是在類別上呼叫的，而 <code>[1, 2].includes(2)</code> 是在某一個陣列上呼叫的。</p>
<h3>第七步：什麼時候用類別，什麼時候不用</h3>
<table>
<tr><th>你手上有的是</th><th>用什麼</th></tr>
<tr><td>單純的資料：一筆分數、一個設定物件、伺服器回傳的資料</td><td>一般物件，用型別來描述（介面那一課）</td></tr>
<tr><td>一件不用記住任何東西的工作：算分數、把時間格式化</td><td>函式</td></tr>
<tr><td>很多個複製品，各有自己的狀態、行為都一樣：牌、敵人、計時器</td><td>類別</td></tr>
<tr><td>需要保護自己狀態的東西：一副只准你抽牌的牌</td><td>有 private 欄位的類別</td></tr>
<tr><td>框架要求你用類別：Cocos Creator、很多遊戲引擎</td><td>繼承框架基底類別的類別（下一課）</td></tr>
</table>
<p>從 JSON 來的資料都是一般物件。就算形狀跟你的類別一模一樣，它也不是那個類別的實例，身上沒有任何一個方法。</p>
<h3>Vue 類比</h3>
<p><code>.vue</code> 檔也是一個模子。寫三次 <code>&lt;PlayingCard /&gt;</code>，Vue 就壓出三個實例，每個都有自己的 <code>ref</code> 狀態，共用同一份 template 和同一組函式。props 扮演的就是建構函式參數的角色。差別在於誰來壓：Vue 在渲染時幫你把實例做出來，類別則要你自己呼叫 <code>new</code>。Vue 的 Composition API 偏向用函式和一般物件；Cocos Creator 則偏向用類別。</p>
<h3>深入一點：類別在執行時是什麼</h3>
<p>類別說到底還是 JavaScript。編譯之後，<code>Card</code> 是一個函式，而它的方法只存一份，放在一個叫 <code>Card.prototype</code> 的物件上，每一張牌都連到它。所以 52 張牌並不會各帶一份 <code>isHigherThan</code>：每個複製品只存自己的欄位，方法是跟模子借來用的。寫成箭頭函式欄位的方法就不一樣了，例如 <code>check = () =&gt; this.rank</code>。每個複製品都會有一份自己的函式，好處是 <code>this</code> 固定不會跑掉，代價是每個複製品多佔一點記憶體。</p>
<p>類別名稱同時也是一個型別，所以你可以寫 <code>let current: Card</code>。</p>
<h3>深入一點：兩個簡寫、一條規則</h3>
<ul>
<li><b>參數屬性（parameter properties）。</b><code>constructor(public readonly rank: number, public readonly suit: string) {}</code> 一行就宣告了兩個欄位，也把值填好。別人的程式碼裡很常看到，接下來幾課也會用。</li>
<li><b>真正的私有。</b>名字以 <code>#</code> 開頭的欄位，例如 <code>#cards</code>，是 JavaScript 本身的私有欄位，就算程式正在跑，外面也碰不到。TypeScript 的 <code>private</code> 則是程式跑之前的檢查。</li>
<li><b>每個欄位都要有值。</b>在 strict 模式下，欄位如果沒有初始值、也沒在建構函式裡設定，TypeScript 就會抱怨（「has no initializer and is not definitely assigned」）。給它一個值、把它標成選擇性的，或者，如果是框架之後才會幫你填，就寫 <code>rank!: number</code>，意思是「相信我，之後一定會設定」。</li>
</ul>`,
    tryNote: '把每段程式碼貼到 TypeScript Playground（typescriptlang.org/play），按 Run，看 Logs 面板。滑鼠移到紅色底線上，就能看到錯誤訊息。',
    try: [
      '一個模子做出兩個複製品。Log 顯示 <code>true</code>。',
      '出現紅色底線：<code>cards</code> 是 private。打開 .JS 分頁，會看到輸出裡已經沒有 <code>private</code> 這個字了。',
      '模子上只有一個計數器，所有複製品共用。Log 顯示 2。',
      '沒有紅色底線，但按 Run 會丟出錯誤：方法被拿離了它的物件，所以 <code>this</code> 變成 &#117;ndefined。'
    ],
    own: `在你自己的程式碼或小專案裡，找一個「很多個形狀一樣的物件都是手寫出來」的地方：清單裡的項目、小遊戲裡的敵人、測驗裡的題目卡。把它們改成一個有建構函式的類別。讓一個欄位是 <code>private</code>、一個是 <code>readonly</code>，再加一個 <code>static</code> 成員。最後用一句話寫下：在那裡用類別，是不是真的比一般物件好，為什麼。`,
    quiz: [
      { q: "<code>new Card(5, 'hearts')</code> 做了什麼事？",
        a: ["它改了 Card 類別，讓每一張牌的點數都變成 5", "它做出一個新物件，執行建構函式（this 指向那個物件），再把物件交回來", "它複製上一張做出來的牌", "它只宣告了一個型別，程式跑的時候什麼都不存在"],
        why: "new 從模子裡壓出一個全新的複製品。建構函式負責把那個複製品填好，類別本身完全沒變。" },
      { q: "一副牌把牌存在 <code>private cards: Card[]</code> 裡。類別外面的程式碼寫了 <code>deck.cards = []</code>。會怎樣？",
        a: ["牌被清空，沒有任何警告", "JavaScript 會檢查 private 這個字，在那一行執行時丟出錯誤", "那一行會被默默跳過", "你在寫的時候，TypeScript 就會把那一行標成錯誤"],
        why: "private 是 TypeScript 在程式跑之前檢查的。它不會留在 JavaScript 裡，所以它的工作就是在編輯器裡擋住這個失誤。" },
      { q: "下面哪一個應該做成靜態成員？",
        a: ["一副完整的牌有幾張，每副牌都一樣", "某一張牌的點數", "某一副牌裡還剩下的牌", "某一個玩家的分數"],
        why: "static 是給屬於模子、而不屬於某一個複製品的東西用的。每副牌的完整張數都一樣；每張牌的點數則各不相同。" }
    ]
  },
  {
    id: 'ts-extends',
    title: 'extends、super、override 與 abstract',
    body: `
<p>上一課是一個模子做出很多個複製品。這一課是用一個模子，再做出另一個模子。每一個跟你說「繼承我們的基底類別，把這幾個方法填好」的框架，背後都是這個觀念，Cocos Creator 也是。</p>
<h3>第一步：用一個模子做出另一個模子</h3>
<p>猜大小可以由不同種類的玩家來玩：按按鈕的真人、隨便亂猜的電腦玩家、會算機率的聰明電腦。他們有很多共同點：名字、分數、加一分的方法。不一樣的只有一件事：怎麼決定要猜大還是猜小。</p>
<p>把名字和分數寫進三個類別，就是在複製貼上。改成只寫一次，寫在一個代表「一般玩家」的類別裡，其他類別再用 <code>extends</code> 從它做出來：</p>
<pre><code>class Player {
  score = 0;
  constructor(public name: string) {}  // declares and sets name
  addPoint(): void {
    this.score += 1;
  }
  describe(): string {
    return this.name + ': ' + this.score;
  }
}

class SmartPlayer extends Player {
  guess(current: number): 'higher' | 'lower' {
    return current &lt;= 7 ? 'higher' : 'lower';
  }
}

const mia = new SmartPlayer('Mia');
mia.addPoint();               // written in Player, works here
console.log(mia.describe());  // Mia: 1</code></pre>
<p><code>Player</code> 是<b>基底類別</b>（base class），也叫父類別。<code>SmartPlayer</code> 是<b>子類別</b>（subclass）。子類別拿到父類別所有的東西，再加上自己的。這就是<b>繼承</b>（inheritance）。能不能用繼承，就看「是一種」這句話說不說得通：聰明玩家<em>是一種</em>玩家。</p>
<div class="tiers"><b>基底</b><div><span class="box">Player<small>name、score、addPoint()、describe()</small></span></div><b>子類別</b><div><span class="box hot">SmartPlayer<small>＋ guess()：照機率猜</small></span><span class="box hot">RandomPlayer<small>＋ guess()：丟銅板</small></span><span class="box hot">LoudPlayer<small>換掉 describe()</small></span></div></div>
<h3>第二步：子類別的建構函式要先呼叫 super(...)</h3>
<p>有時候子類別需要自己額外的資料。這時它要寫自己的建構函式，而這個建構函式第一件要做的事，就是呼叫 <code>super(...)</code>，也就是執行父類別的建構函式。</p>
<pre><code>class TimedPlayer extends Player {
  secondsPerGuess: number;

  constructor(name: string, seconds: number) {
    super(name);                    // build the Player part first
    this.secondsPerGuess = seconds; // then the extra part
  }
}</code></pre>
<p>想像一棟有加蓋的房子。加蓋的部分是釘在主屋上的，所以主屋要先蓋好。<code>super(...)</code> 還沒跑之前，物件裡 Player 的那一部分根本還不存在，所以 TypeScript 不准你在那之前碰 <code>this</code>，硬要碰的話，JavaScript 也會丟出錯誤。子類別如果沒寫自己的建構函式，會自動拿到一個，把所有參數原封不動交給父類別。所以上面的 <code>SmartPlayer</code> 不用寫。</p>
<h3>第三步：覆寫方法，或用 super.method() 加工</h3>
<p>子類別可以寫一個同名的方法，把繼承來的方法換掉。這叫<b>覆寫</b>（override）。在裡面呼叫 <code>super.describe()</code>，就會跑父類別的版本，所以子類別可以保留父類別做的事，再加上自己的：</p>
<pre><code>class LoudPlayer extends Player {
  override describe(): string {
    return super.describe().toUpperCase() + '!';
  }
}

const sam = new LoudPlayer('Sam');
console.log(sam.describe()); // SAM: 0!</code></pre>
<p><code>override</code> 這個字預設可寫可不寫，但值得寫。它告訴 TypeScript「我是故意要換掉父類別的方法」，所以如果父類別的方法改了名字，或是你打錯字，你會得到一個錯誤，而不是默默多出一個新方法。設定 <code>noImplicitOverride</code> 會讓這個字變成一定要寫。</p>
<h3>到底跑的是哪一個方法？</h3>
<p>你呼叫一個方法時，JavaScript 會先在物件自己的類別裡找，找不到就去父類別，再找不到就去父類別的父類別，然後跑第一個找到的。</p>
<div class="flow"><span class="box">sam.describe()</span><span class="arr">&rarr;</span><span class="box hot">LoudPlayer<small>有 describe：就跑它</small></span><span class="arr">super.describe() &rarr;</span><span class="box">Player<small>它的 describe 在裡面跑</small></span></div>
<div class="flow"><span class="box">sam.addPoint()</span><span class="arr">&rarr;</span><span class="box bad">LoudPlayer<small>這裡沒有 addPoint</small></span><span class="arr">&rarr;</span><span class="box hot">Player<small>找到了：就跑它</small></span></div>
<p>從哪裡開始找，看的是物件實際上是什麼，不是變數的型別。一個型別寫成 <code>Player</code> 的變數，裡面裝的如果是 <code>LoudPlayer</code>，跑的還是大聲的那個版本。正因為這樣，同一段程式碼才能對付每一種玩家。</p>
<h3>第四步：abstract：留空格給子類別填的表格</h3>
<p>每個玩家都要會猜，可是「一般玩家」根本沒辦法猜，只有具體的那幾種玩家才知道怎麼猜。把類別標成 <code>abstract</code>，把那個方法留成空格：</p>
<pre><code>abstract class Player {
  score = 0;
  constructor(public name: string) {}
  abstract guess(current: number): 'higher' | 'lower';  // the blank

  play(current: number, next: number): void {            // already filled in
    const g = this.guess(current);
    const right = g === 'higher' ? next &gt; current : next &lt; current;
    if (right) this.score += 1;
  }
}

class RandomPlayer extends Player {
  override guess(): 'higher' | 'lower' {
    return Math.random() &lt; 0.5 ? 'higher' : 'lower';
  }
}

const bot = new RandomPlayer('Bot');
bot.play(5, 9);</code></pre>
<p><b>抽象類別</b>（abstract class）就是一張有空格的表格，而 <code>guess</code> 是一個<b>抽象方法</b>（abstract method）：有題目、沒有答案的空格。你不能直接交出這張空白表格，所以 <code>new Player('x')</code> 是錯誤。子類別漏填空格，也是錯誤。子類別可以不理用不到的參數，所以 <code>RandomPlayer</code> 的 <code>guess</code> 一個參數都沒收。交換條件是，父類別現在就能用這個空格：<code>play</code> 呼叫 <code>this.guess</code> 時，不用知道是哪一種玩家，跑的會是每個子類別自己的 <code>guess</code>。</p>
<h3>框架和遊戲引擎裡的基底類別模式</h3>
<p>再看一次 <code>play</code>。父類別決定<em>什麼時候</em>猜、猜完之後怎麼辦；子類別只決定<em>怎麼</em>猜。框架就是這樣做出來的。它給你一個基底類別，裡面的方法暫時什麼都不做。你繼承它、填好你需要的那幾個，框架會在對的時間點呼叫它們。你自己從來不用呼叫。有一句話專門形容這件事：「別打給我們，我們會打給你」。</p>
<div class="flow"><span class="box">引擎把你的物件加進來</span><span class="arr">&rarr;</span><span class="box hot">start()<small>一次，在第一個影格之前</small></span><span class="arr">&rarr;</span><span class="box hot">update(dt)<small>每個影格一次</small></span><span class="arr">&rarr;</span><span class="box">onDestroy()<small>一次，在它被移除時</small></span></div>
<p>Cocos Creator 的腳本長的就是這個樣子：<code>class Hud extends Component</code>，裡面填好 <code>start()</code> 和 <code>update(dt)</code>。Cocos 那條學習路線會講到有哪些這種方法，以及它們的執行順序。</p>
<h3>Vue 類比</h3>
<p>Vue 的生命週期 hook 是同一個觀念：你寫 <code>onMounted(() =&gt; ...)</code>，Vue 就在對的時間呼叫它。不同的只有交出去的方式。Vue 要你註冊一個函式；以類別為主的引擎要你覆寫一個方法。</p>
<table>
<tr><th>Vue 3</th><th>在以類別為主的引擎裡，接近的是</th></tr>
<tr><td><code>onMounted(() =&gt; ...)</code></td><td><code>start() { ... }</code></td></tr>
<tr><td><code>onUnmounted(() =&gt; ...)</code></td><td><code>onDestroy() { ... }</code></td></tr>
<tr><td>好幾個元件共用的 composable</td><td>好幾個子類別共用的基底類別，或是掛在同一個物件上的另一個元件</td></tr>
</table>
<div class="warn"><b>繼承鏈要短。</b>像 Player &rarr; BotPlayer &rarr; SmartBot &rarr; TournamentSmartBot 這樣的一條鏈，代表你想知道一個方法在做什麼，就得打開四個檔案；而基底類別一改，底下每一個子類別都可能跟著壞掉。繼承一層很正常，例如繼承框架的基底類別。超過兩層，就該停下來，想想能不能改用組合。</div>
<h3>另一條路：組合</h3>
<p><b>組合</b>（composition）講的是「有一個」，而不是「是一種」。不要每多一種猜法就多一個子類別，改成只有一個 Player 類別，給它一個可以插拔的「猜的零件」：</p>
<pre><code>type Brain = (current: number) =&gt; 'higher' | 'lower';

const coinFlip: Brain = () =&gt; (Math.random() &lt; 0.5 ? 'higher' : 'lower');
const odds: Brain = (current) =&gt; (current &lt;= 7 ? 'higher' : 'lower');

class Player {
  score = 0;
  constructor(public name: string, private brain: Brain) {}

  guess(current: number): 'higher' | 'lower' {
    return this.brain(current);
  }
}

const mia = new Player('Mia', odds);
const bot = new Player('Bot', coinFlip);</code></pre>
<p>這樣一來，多一種玩法就是多一個函式，不是多一個類別，甚至可以在遊戲中途幫玩家換一顆腦袋。Cocos Creator 本身就是這樣設計的：場景裡的一個節點<em>擁有</em>好幾個元件，例如圖片、按鈕和你自己的腳本，而不是一條很深的類別鏈。</p>
<h3>深入一點：protected，和建構函式裡的陷阱</h3>
<p><code>protected</code> 是父類別和子類別之間的那扇門。一個 <code>protected score</code>，<code>Player</code> 和它的每一個子類別都能改，外面的程式碼不行。子類別真的需要這個欄位時才用它；不需要的話，寧可用 <code>private</code> 再加一個方法。</p>
<p>陷阱是：不要在父類別的建構函式裡，呼叫子類別可以覆寫的方法。父類別的建構函式是在 <code>super(...)</code> 裡面跑的，那時子類別自己的欄位都還沒拿到值。如果子類別版本的方法讀了其中一個欄位，讀到的會是 <code>&#117;ndefined</code>。</p>`,
    tryNote: '把每段程式碼貼到 TypeScript Playground（typescriptlang.org/play）。會印東西的就按 Run；有紅色底線的，就把滑鼠移上去看錯誤訊息。',
    try: [
      '子類別先跑父類別的版本，再加上自己的。Log 顯示 AB。',
      '<code>this</code> 那裡出現錯誤：碰 this 之前，一定要先呼叫 super。把兩行對調，錯誤就消失了。',
      '兩個錯誤：抽象類別不能做出實例，而 Bot 把 <code>guess</code> 這個空格留白了。',
      '抓到一個打錯字：在父類別沒有的方法上寫 <code>override</code>，就是錯誤。'
    ],
    own: `找一個你在工作上或教學專案裡繼承過的基底類別：Cocos Creator 的元件，或某個函式庫裡的類別。列出你覆寫了哪些方法，每一個都寫下是誰在呼叫它、什麼時候呼叫。接著在你自己的程式碼裡，找找看有沒有連續三層以上的 <code>extends</code>。如果有，在紙上畫畫看改用組合會長什麼樣子：一個類別，插上一個零件。`,
    quiz: [
      { q: "為什麼子類別的建構函式在用 <code>this</code> 之前，一定要先呼叫 <code>super(...)</code>？",
        a: ["因為 super 會讓程式跑得比較快", "不一定要，這只是寫程式的風格", "物件裡父類別的那一部分要先建好，所以 super 跑完之前 this 還沒準備好", "因為 super 會刪掉父類別的欄位"],
        why: "就像先有主屋才能加蓋：父類別的建構函式先把自己那部分弄好，子類別才能加上自己的。" },
      { q: "一個型別寫成 <code>Player</code> 的變數，裡面裝的是 <code>LoudPlayer</code>。你呼叫 <code>describe()</code>，找方法會從哪裡開始找？",
        a: ["從 Player 開始，因為那是變數的型別", "從 LoudPlayer 開始，因為是從物件實際所屬的類別開始找", "從檔案裡最後寫的那個類別開始", "哪裡都不找，呼叫它是錯誤"],
        why: "物件說了算。LoudPlayer 有自己的 describe，所以跑的是它，而它在裡面可以再呼叫 super.describe()。" },
      { q: "什麼是抽象方法？",
        a: ["比一般方法跑得快的方法", "只有類別外面的程式碼才能呼叫的方法", "父類別私有的方法", "父類別裡的一個空格，每一個能做出實例的子類別都一定要填"],
        why: "父類別只寫出方法的名字和型別，沒有內容。Player 本身不能被做出來；每個子類別各自提供自己的 guess。" }
    ]
  },
  {
    id: 'ts-interface',
    title: 'interface、型別別名與 implements',
    body: `
<p>類別一次做兩件事：描述一個形狀，再做出那個形狀的物件。很多時候你只需要第一件。這一課講的就是怎麼描述形狀，而這也是你在日常前端程式碼裡最常用到的 TypeScript。</p>
<h3>第一步：只描述形狀，什麼都不做出來</h3>
<p>伺服器回傳一份高分榜。那些物件不是你做的，你也不會幫它們加方法。你只想讓 TypeScript 知道裡面有什麼。<b>介面</b>（interface）就是一個形狀的描述，除此之外什麼都不是。想像桌上畫了一張牌的外框：它告訴你牌要放哪裡，但它本身不是牌。</p>
<pre><code>interface HighScore {
  name: string;
  points: number;
}

const best: HighScore = { name: 'Mia', points: 12 };
const typo: HighScore = { name: 'Sam', pionts: 9 };   // error</code></pre>
<p>介面只在你寫程式的時候存在。編譯完之後它就完全消失了：沒有程式碼、沒有物件，也沒有東西可以拿來 <code>new</code>。執行時它一點成本都沒有，卻在你打字時保護你。</p>
<h3>第二步：形狀對了，就放得進去</h3>
<p>TypeScript 檢查的是形狀，不是名字。這叫做<b>結構化型別</b>（structural typing）。一個值只要有介面要求的那些成員、型別也都對，就符合那個介面，不管它叫什麼名字、從哪裡來。</p>
<pre><code>interface HasRank {
  rank: number;
}

function isHigher(a: HasRank, b: HasRank): boolean {
  return a.rank &gt; b.rank;
}

class Card {
  constructor(public rank: number, public suit: string) {}
}

const fromServer = { rank: 3, suit: 'clubs', faceUp: true };
isHigher(new Card(9, 'hearts'), fromServer);   // fine: both have a rank</code></pre>
<div class="tiers"><b>形狀</b><div><span class="box hot">HasRank<small>需要 rank: number</small></span></div><b>放得進去</b><div><span class="box">new Card(9, 'hearts')<small>有 rank，還有別的</small></span><span class="box">fromServer<small>有 rank 的一般物件</small></span></div><b>放不進去</b><div><span class="box bad">{ value: 3 }<small>沒有 rank</small></span><span class="box bad">{ rank: '3' }<small>rank 是文字，不是數字</small></span></div></div>
<p>注意，<code>Card</code> 從頭到尾都沒提到 <code>HasRank</code>，還是放得進去。多出來的成員沒關係；少了成員，或是成員的型別不對，就不行。有人把這叫做鴨子型別（duck typing）：走路像鴨子、叫聲也像鴨子，那它就是鴨子。Java 和 C# 這些語言則是反過來，看名字：類別要自己宣告符合，才算符合。</p>
<h3>第三步：用 interface 還是型別別名？</h3>
<p><b>型別別名</b>（type alias）是用 <code>type</code> 這個字，幫任何型別取一個名字：</p>
<pre><code>type Guess = 'higher' | 'lower';                       // a union
type Brain = (current: number) =&gt; Guess;               // a function
type HighScoreToo = { name: string; points: number };  // an object shape</code></pre>
<p>描述物件形狀的時候，兩者幾乎可以互換。差別在這裡：</p>
<table>
<tr><th>能不能</th><th><code>interface</code></th><th><code>type</code></th></tr>
<tr><td>描述物件的形狀</td><td>可以</td><td>可以</td></tr>
<tr><td>幫聯集，或是像 <code>string</code> 這種簡單型別取名字</td><td>不行</td><td>可以</td></tr>
<tr><td>在另一個形狀上再加東西</td><td>用 <code>extends</code></td><td>用 <code>&amp;</code></td></tr>
<tr><td>同一個名字宣告兩次</td><td>可以：兩個會合併</td><td>不行：會報錯</td></tr>
</table>
<p>一條常見的規則，也是 TypeScript 官方手冊（handbook）的建議：物件形狀先用 <code>interface</code>，等到需要只有 <code>type</code> 才做得到的事（例如聯集）時再換。很多團隊乾脆替物件選定一種寫法，一直用下去。兩種都可以，唯一真正的錯，是毫無規則地混著用。</p>
<h3>第四步：選擇性與唯讀的成員</h3>
<pre><code>interface PlayerInfo {
  readonly id: string;     // set once, never changed
  name: string;
  avatarUrl?: string;      // may be missing
}

const p: PlayerInfo = { id: 'p1', name: 'Mia' };   // fine without avatarUrl
p.name = 'Mia Chen';                                // fine
p.id = 'p2';                                        // error: read-only
const url = p.avatarUrl;                            // string | &#117;ndefined</code></pre>
<p>名字後面加一個 <code>?</code>，它就成了<b>選擇性屬性</b>（optional property）：可以不給。讀它的時候拿到的是 <code>string | &#117;ndefined</code>，所以 TypeScript 會逼你先檢查再用。<code>readonly</code> 的意思是，物件做出來的時候可以設定這個值，之後就不能再改。這兩個都跟 <code>private</code> 一樣，是程式跑之前的檢查。</p>
<h3>第五步：implements：類別承諾遵守的合約</h3>
<p>介面也可以列出方法。這樣一來，類別就可以寫 <code>implements</code>，宣告自己實作（implements）了這個介面，承諾自己有這些方法。這個介面就是一份<b>合約</b>（contract），TypeScript 會盯著類別照約定做。</p>
<pre><code>interface CardSource {
  draw(): number | &#117;ndefined;
  remaining(): number;
}

class Deck implements CardSource {
  private cards = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

  draw(): number | &#117;ndefined {
    return this.cards.pop();
  }

  remaining(): number {
    return this.cards.length;
  }
}</code></pre>
<p>把 <code>remaining</code> 拿掉，錯誤就會出現在類別那一行：這個類別「incorrectly implements」（沒有正確實作）這個介面。現在，遊戲的其他部分可以只認 <code>CardSource</code>，不用認 <code>Deck</code>。測試的時候，可以塞一個照固定順序發牌的假牌堆進去，遊戲完全分不出來。</p>
<div class="flow"><span class="box">遊戲<small>只認得 CardSource</small></span><span class="arr">&rarr;</span><span class="box hot">CardSource<small>draw()、remaining()</small></span><span class="arr">&larr; 遵守合約的有</span><span class="box">Deck<small>真的那副</small></span><span class="box">FixedDeck<small>測試用</small></span></div>
<table>
<tr><th></th><th><code>extends</code> 一個類別</th><th><code>implements</code> 一個介面</th></tr>
<tr><td>類別拿到什麼</td><td>父類別的程式碼：欄位和方法</td><td>什麼都沒有：只有一道檢查</td></tr>
<tr><td>可以有幾個</td><td>一個父類別</td><td>介面要幾個都可以</td></tr>
<tr><td>意思是</td><td>「是一種」</td><td>「承諾做得到」</td></tr>
</table>
<h3>第六步：介面可以建立在介面上</h3>
<pre><code>interface Named { name: string; }
interface Scored { score: number; }

interface RankedPlayer extends Named, Scored {
  place: number;
}

const leader: RankedPlayer = { name: 'Mia', score: 12, place: 1 };</code></pre>
<p>一個介面可以同時繼承好幾個介面。新形狀的值，要具備所有這些介面裡的全部東西。</p>
<h3>Vue 類比：幫 defineProps 加型別</h3>
<p>你在 Vue 裡其實已經用過介面了。在 <code>&lt;script setup lang="ts"&gt;</code> 區塊裡，你交給 <code>defineProps</code> 的型別就是一個介面或型別別名，Vue 編譯元件時會把它轉成 props 的定義：</p>
<pre><code>&lt;script setup lang="ts"&gt;
interface Props {
  rank: number;
  suit: string;
  faceUp?: boolean;     // optional prop
}

const props = withDefaults(defineProps&lt;Props&gt;(), { faceUp: false });
const emit = defineEmits&lt;{ guess: [choice: 'higher' | 'lower'] }&gt;();
&lt;/script&gt;</code></pre>
<p><code>?</code> 會變成非必填的 prop，<code>withDefaults</code> 則在它沒傳的時候給一個值。emit 那一行用的是 Vue 3.3 之後的簡短寫法。裝了 Vue 官方的編輯器擴充套件，父元件的 template 也會照介面檢查：在 <code>&lt;PlayingCard&gt;</code> 上把文字傳給 <code>rank</code>，編輯器就會標出來，因為介面要的是數字。</p>
<h3>深入一點：四件值得知道的事</h3>
<ul>
<li><b>介面在執行時會消失。</b>你不能寫 <code>x instanceof HasRank</code>。而且伺服器傳來的資料，不會因為你在旁邊寫了介面的名字，就真的被檢查過。伺服器如果傳了別的東西來，TypeScript 根本無從得知。外面來的資料，執行時也要檢查。</li>
<li><b>剛寫出來的物件字面值，檢查得比較嚴。</b><code>const s: HasRank = { rank: 3, colour: 'red' }</code> 是錯誤，因為直接寫在字面值裡、型別又不認得的屬性，八成是打錯字。同一個物件先放進變數再傳進去就沒問題，就像第二步那樣。</li>
<li><b>implements 不會幫類別加任何東西。</b>它不會替類別的方法補上參數型別，那些你還是要在類別裡自己寫。它只檢查類別符不符合。</li>
<li><b>宣告合併（declaration merging）。</b>兩個同名的 <code>interface</code> 宣告會合併成一個。函式庫靠這一點讓你替它們的型別加欄位，例如在全域的 <code>Window</code> 介面上加你自己的屬性。</li>
</ul>`,
    tryNote: '把每段程式碼貼到 TypeScript Playground（typescriptlang.org/play）。滑鼠移到紅色底線上看錯誤訊息；會印東西的那一段就按 Run。',
    try: [
      '放得進去：形狀對了，而多出來的 <code>suit</code> 透過變數傳進來時不會造成問題。',
      '同一個物件直接寫在字面值裡就是錯誤：TypeScript 懷疑 <code>suit</code> 是打錯字。',
      '違反合約：少了 <code>draw</code>。在類別裡加上 <code>draw() { return 1; }</code>，錯誤就消失了。',
      '兩個宣告合併了，所以現在 <code>y</code> 也變成必填。'
    ],
    own: `挑一個你的前端從伺服器收到的回應，幫它寫一個介面。可能缺少的欄位標上 <code>?</code>，ID 標上 <code>readonly</code>。接著找一個還在用執行時期的 <code>props: { ... }</code> 物件宣告 props 的 Vue 元件，把它改成 <code>defineProps&lt;Props&gt;()</code> 搭配 <code>withDefaults</code>。最後確認父元件的 template 還是能通過型別檢查。`,
    quiz: [
      { q: "<code>Card</code> 從來沒提到 <code>HasRank</code>，但它有一個欄位 <code>rank: number</code>。需要 HasRank 的地方，可以傳 Card 進去嗎？",
        a: ["不行：類別要先寫 implements HasRank", "只有在 Card 沒有其他欄位的時候才行", "可以：TypeScript 看的是形狀，不是名字", "只有在程式執行的時候才行"],
        why: "這就是結構化型別。HasRank 要的東西 Card 全都有，所以放得進去。多出來的欄位沒有影響。" },
      { q: "下面哪一個能用 <code>type</code> 寫、卻不能用 <code>interface</code> 寫？",
        a: ["<code>{ name: string; points: number }</code>", "有一個唯讀 id 的物件", "有一個選擇性欄位的物件", "<code>'higher' | 'lower'</code>"],
        why: "介面描述的一定是物件的形狀。值的聯集需要用型別別名。" },
      { q: "<code>class Deck implements CardSource</code> 幫 Deck 加了什麼？",
        a: ["執行時什麼都沒加：它只是檢查 Deck 有沒有 CardSource 列出的每一樣東西", "它把 CardSource 方法的程式碼複製進 Deck", "它讓 Deck 變成抽象類別", "它讓 Deck 可以再繼承第二個類別"],
        why: "介面沒有程式碼可以給。implements 是一個承諾，TypeScript 負責檢查類別有沒有遵守。" }
    ]
  },
  {
    id: 'ts-generics',
    title: '泛型',
    body: `
<p>這一課要解釋那些尖括號：函式庫程式碼裡的 <code>&lt;T&gt;</code>，還有你在 Vue 裡一直打在 <code>ref</code> 後面的 <code>&lt;number&gt;</code>。背後的觀念很小，卻非常好用。</p>
<h3>第一步：同一個函式，想給不同型別用</h3>
<p>這是一個小工具函式：給它一個陣列，它把第一個元素還給你。如果是數字陣列，型別很好寫：</p>
<pre><code>function firstNumber(items: number[]): number | &#117;ndefined {
  return items[0];
}</code></pre>
<p>現在你想對名字的陣列做一樣的事，接著又想對牌的陣列做。寫三份太蠢了。用 <code>any</code> 是可以動，但型別就這樣丟掉了：出來的東西是 <code>any</code>，TypeScript 從此不再幫你。</p>
<pre><code>function firstAny(items: any[]): any {
  return items[0];
}

const who = firstAny(['Mia', 'Sam']);
who.toFixed(2);   // no warning, but it crashes: text has no toFixed</code></pre>
<h3>第二步：先留空格，晚點再填</h3>
<p>想像一個標籤空白的收納盒。你從架子上拿下來時，在標籤上寫「牌」。從此只有牌能放進去，而你從裡面拿出來的東西，一定知道是牌。<b>泛型</b>（generics）就是這個盒子：一個留了空格的型別，用的時候才把空格填上。</p>
<pre><code>function first&lt;T&gt;(items: T[]): T | &#117;ndefined {
  return items[0];
}

const n = first([3, 7, 9]);        // T is number: n is number | &#117;ndefined
const s = first(['Mia', 'Sam']);   // T is string: s is string | &#117;ndefined
s?.toFixed(2);                     // error: toFixed does not exist on string</code></pre>
<p>名字後面的 <code>&lt;T&gt;</code> 宣告了這個空格。<code>T</code> 是一個<b>型別參數</b>（type parameter）：一個代表某個型別的名字，就像函式參數代表某個值一樣。那個型別該出現的地方，你就寫 <code>T</code>：陣列是 <code>T</code> 的陣列，傳回來的是一個 <code>T</code>，或是什麼都沒有。</p>
<p>你呼叫這個函式時，TypeScript 會看你傳了什麼，自動幫你填好 <code>T</code>。這叫<b>型別推斷</b>（type inference）。你也可以自己填，例如 <code>first&lt;number&gt;([3, 7, 9])</code>。寫在尖括號中間的那個型別，叫做<b>型別引數</b>（type argument）。</p>
<div class="flow"><span class="box">first&lt;T&gt;<small>空白的標籤</small></span><span class="arr">用 [3, 7, 9] 呼叫 &rarr;</span><span class="box hot">T = number<small>標籤填好了</small></span><span class="arr">&rarr;</span><span class="box">傳回 number | &#117;ndefined<small>型別一清二楚</small></span></div>
<h3>第三步：其實你早就在用了</h3>
<table>
<tr><th>你寫過的</th><th>空格填的是</th><th>意思是</th></tr>
<tr><td><code>Array&lt;number&gt;</code>，跟 <code>number[]</code> 一樣</td><td><code>number</code></td><td>一個數字陣列</td></tr>
<tr><td><code>Promise&lt;string&gt;</code></td><td><code>string</code></td><td>一個晚點才會到的字串</td></tr>
<tr><td><code>Record&lt;string, number&gt;</code></td><td><code>string</code> 和 <code>number</code></td><td>鍵是字串、值是數字的物件</td></tr>
<tr><td><code>Map&lt;string, Card&gt;</code></td><td><code>string</code> 和 <code>Card</code></td><td>用名字查牌的對照表</td></tr>
<tr><td>Vue 裡的 <code>ref&lt;number&gt;(0)</code></td><td><code>number</code></td><td>裝著一個數字的響應式盒子，型別是 <code>Ref&lt;number&gt;</code></td></tr>
</table>
<p>所以你填空格已經填很久了。這一課剩下的部分，講的是怎麼自己做一個。</p>
<h3>第四步：泛型類別與泛型介面</h3>
<p>類別也可以留空格。在猜大小裡，打過的牌會放到棄牌堆。一疊什麼？今天是牌，但同一個牌堆拿來疊什麼都可以：</p>
<pre><code>class Pile&lt;T&gt; {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  top(): T | &#117;ndefined {
    return this.items[this.items.length - 1];
  }
}

const discard = new Pile&lt;number&gt;();   // a pile of ranks
discard.push(12);
discard.push('queen');                  // error: not a number</code></pre>
<p>介面也一樣可以留空格。前端程式碼裡有一個非常常見的例子，用來包住伺服器的每一個回應：</p>
<pre><code>interface ApiResult&lt;T&gt; {
  ok: boolean;
  data: T;
  error?: string;
}

type ScoresResult = ApiResult&lt;{ name: string; points: number }[]&gt;;

async function loadScores(): Promise&lt;ScoresResult&gt; {
  const res = await fetch('/api/scores');
  return res.json();
}</code></pre>
<p>一個介面只寫一次，就能給每一支 API 用：<code>ApiResult&lt;PlayerInfo&gt;</code>、<code>ApiResult&lt;Card[]&gt;</code>，以此類推。</p>
<h3>第五步：用條件約束限制空格能填什麼</h3>
<p>有時候函式需要知道一點點 <code>T</code> 的事。要找出最大的牌，就得讀 <code>rank</code>，但光禿禿的 <code>T</code> 可能是任何東西，甚至只是一個數字，所以 TypeScript 會拒絕：「Property 'rank' does not exist on type 'T'」。<b>條件約束</b>（constraint）說的是 <code>T</code> 至少要有什麼：</p>
<pre><code>function highest&lt;T extends { rank: number }&gt;(items: T[]): T | &#117;ndefined {
  let best: T | &#117;ndefined;
  for (const item of items) {
    if (best === &#117;ndefined || item.rank &gt; best.rank) best = item;
  }
  return best;
}

const winner = highest([{ rank: 5, suit: 'hearts' }, { rank: 12, suit: 'spades' }]);
console.log(winner?.suit);   // spades, and TypeScript knows it has a suit</code></pre>
<p><code>T extends { rank: number }</code> 要讀成「T 可以是任何型別，只要它有一個數字型別的 rank」。這裡的 <code>extends</code> 意思是「符合這個形狀」，也就是上一課講的結構化檢查，不是類別的繼承。而且因為 <code>T</code> 仍然是你傳進去的完整型別，結果會保留它的 <code>suit</code>。如果你不用泛型，寫成 <code>items: { rank: number }[]</code>，結果就只知道它有 rank。</p>
<h3>第六步：讀一長串尖括號</h3>
<p>你遲早會碰到像這樣的型別：</p>
<pre><code>type Hands = Promise&lt;ApiResult&lt;Record&lt;string, Card[]&gt;&gt;&gt;;</code></pre>
<p>不要從左邊開始讀。先找到最裡面那一層，用白話說出它是什麼，然後一次往外走一層，每次都把已經說好的那句話包起來：</p>
<div class="flow"><span class="box">Card[]<small>一個牌的陣列</small></span><span class="arr">&rarr;</span><span class="box">Record&lt;string, &hellip;&gt;<small>每個玩家名字一個陣列</small></span><span class="arr">&rarr;</span><span class="box">ApiResult&lt;&hellip;&gt;<small>包在伺服器慣用的外殼裡</small></span><span class="arr">&rarr;</span><span class="box hot">Promise&lt;&hellip;&gt;<small>而且晚點才會到</small></span></div>
<p>合起來就是：「一個晚點才會到的回應，包在慣用的外殼裡，裡面是每個玩家名字各對應一個牌的陣列」。最後那串 <code>&gt;&gt;&gt;</code> 只是照相反的順序，把每一層關起來。如果這種型別不只用在一個地方，就像上面那樣用 <code>type</code> 幫它取個名字，別讓大家每次都要重讀一遍。</p>
<h3>Vue 類比</h3>
<p><code>ref&lt;number&gt;()</code> 不給初始值的話，型別會是 <code>Ref&lt;number | &#117;ndefined&gt;</code>，因為盒子一開始是空的。上一課的 <code>defineProps&lt;Props&gt;()</code> 也是一個泛型呼叫：你用自己的 props 介面填它的空格。Vue 3.3 還加了泛型元件：<code>&lt;script setup lang="ts" generic="T"&gt;</code> 讓同一個清單元件可以接任何型別的項目，同時還能對顯示每個項目的 slot 做型別檢查。</p>
<h3>深入一點</h3>
<ul>
<li><b>好幾個空格，彼此相連。</b><code>function pick&lt;T, K extends keyof T&gt;(obj: T, key: K): T[K]</code> 接收一個物件，以及這個物件自己的其中一個鍵，傳回的是那個鍵對應的值的型別。<code>keyof T</code> 是 T 所有鍵名組成的聯集。</li>
<li><b>工具型別（utility type）。</b>TypeScript 內建了一些做好的泛型：<code>Partial&lt;T&gt;</code> 把每個欄位都變成選擇性的，另外還有 <code>Readonly&lt;T&gt;</code>、<code>Pick&lt;T, K&gt;</code>、<code>Omit&lt;T, K&gt;</code> 和 <code>ReturnType&lt;F&gt;</code>。一個只編輯玩家部分欄位的表單，可以接收 <code>Partial&lt;PlayerInfo&gt;</code>。</li>
<li><b>預設值。</b><code>interface ApiResult&lt;T = unknown&gt;</code> 在沒人指定的時候，會用 <code>unknown</code> 填這個空格。</li>
<li><b>泛型在執行時會消失。</b>你不能寫 <code>new T()</code>，因為程式跑起來的時候已經沒有 T 了。改成把類別本身傳進去。Cocos Creator 就是這樣做的：<code>node.getComponent(Sprite)</code> 收的是類別，傳回的是 <code>Sprite | null</code>。</li>
<li><b>別用過頭。</b>如果 <code>T</code> 在函式簽名裡只出現一次，它就什麼都沒串起來，直接用一般型別就好。好的泛型會把輸入和輸出連在一起。</li>
</ul>`,
    tryNote: '把每段程式碼貼到 TypeScript Playground（typescriptlang.org/play）。滑鼠移到名字上，可以看到 TypeScript 推斷出來的型別；移到紅色底線上，可以看錯誤訊息。',
    try: [
      '滑鼠移到 <code>s</code> 上：TypeScript 把 T 填成 string，所以 s 是 <code>string | &#117;ndefined</code>。',
      '出現錯誤：光禿禿的 T 不一定有 rank。把 <code>&lt;T&gt;</code> 改成 <code>&lt;T extends { rank: number }&gt;</code>，錯誤就消失了。',
      '標籤寫的是 number，所以文字被擋下來。',
      '放得進去。把 12 改成 &quot;Q&quot;，看看錯誤訊息，再從裡往外讀一次這個型別。'
    ],
    own: `在你自己的程式碼裡，找一個接收或傳回 <code>any</code> 的工具函式，或是為了兩種型別被複製成兩份的函式。把它改寫成一個泛型函式；如果它會讀某個欄位，就加上條件約束。接著找出你專案裡最長的那個型別，從裡往外用白話把它寫出來。如果它出現不只一次，就用 <code>type</code> 幫它取個名字。`,
    quiz: [
      { q: "在 <code>function first&lt;T&gt;(items: T[]): T | &#117;ndefined</code> 裡，T 是什麼？",
        a: ["一個代表 any 的特殊型別", "一個型別參數：每次使用這個函式時，都會被填上一個真正型別的空格", "一個存著第一個元素的變數", "一個一定要 import 進來的類別名稱"],
        why: "T 代表一個型別，就像 items 代表一個值。用數字陣列呼叫它，T 就是 number。" },
      { q: "為什麼 <code>highest&lt;T&gt;(items: T[])</code> 在加上 <code>extends { rank: number }</code> 之前，不能讀 <code>item.rank</code>？",
        a: ["泛型函式本來就不能讀欄位", "因為 rank 是 private", "光禿禿的 T 可能是任何型別，所以 TypeScript 不能保證它有 rank", "因為陣列可能是空的"],
        why: "條件約束縮小了 T 的範圍，換來的是 TypeScript 讓你使用每一個合格的 T 一定會有的東西。" },
      { q: "從裡往外讀 <code>Promise&lt;Record&lt;string, number[]&gt;&gt;</code>。它是什麼？",
        a: ["一個 Promise 的陣列", "一個晚點才會到的字串", "每個鍵各放一個 Promise 的物件", "一個晚點才會到的東西：一個物件，每個字串鍵都對應一個數字陣列"],
        why: "number[] 是數字陣列。Record 把它包成以字串為鍵的物件。Promise 表示整個物件晚點才會到。" }
    ]
  }
  ]
});
