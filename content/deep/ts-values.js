DEEP({ 'ts-values': `
<p>上一課講了一句話：TypeScript 在你寫程式的時候檢查型別，檢查完就把型別擦掉，瀏覽器跑的還是 JavaScript。這一章把這句話拆開來看。第一，編譯器（compiler）從讀進一行文字，到吐出一個 .js 檔，中間經過哪幾個關卡、每一關在做什麼。第二，檢查器怎麼「猜」出每個值的型別，為什麼 <code>const</code> 會得到 <code>10</code>、<code>let</code> 卻得到 <code>number</code>。第三，型別錯誤和執行時的錯誤，到底差在哪裡，哪些錯檢查器永遠抓不到。最後是 <code>tsconfig.json</code> 裡真正重要的那幾個設定，以及每一個嚴格模式開關在抓什麼。看完這一章，紅色底線對你來說就不再是黑盒子。</p>

<h3><span class="badge lv1">基礎</span>一、先看全貌：一行程式要過五個關卡</h3>
<p>你按下存檔，或在終端機打 <code>tsc</code>，TypeScript 編譯器就會把每個 .ts 檔送進同一條生產線。用一行最簡單的程式走一遍：</p>
<figure class="figure"><svg viewBox="0 0 680 262" class="fg" style="width:100%;max-width:680px" role="img" aria-label="TypeScript 編譯器的五個關卡：掃描器、剖析器、繫結器、檢查器、輸出器，以及每一關的產出；只拿掉型別的工具直接從語法樹走到輸出">
<text x="340" y="24" text-anchor="middle" class="fg-t">輸入：game.ts 的一行 <tspan class="fg-t mono">let score: number = 0;</tspan></text>
<rect x="16" y="44" width="112" height="56" rx="6" class="fg-b"/><text x="72" y="67" text-anchor="middle" class="fg-t acc">掃描器</text><text x="72" y="87" text-anchor="middle" class="fg-t sm">Scanner</text>
<rect x="150" y="44" width="112" height="56" rx="6" class="fg-b"/><text x="206" y="67" text-anchor="middle" class="fg-t acc">剖析器</text><text x="206" y="87" text-anchor="middle" class="fg-t sm">Parser</text>
<rect x="284" y="44" width="112" height="56" rx="6" class="fg-b"/><text x="340" y="67" text-anchor="middle" class="fg-t acc">繫結器</text><text x="340" y="87" text-anchor="middle" class="fg-t sm">Binder</text>
<rect x="418" y="44" width="112" height="56" rx="6" class="fg-b hot"/><text x="474" y="67" text-anchor="middle" class="fg-t acc">檢查器</text><text x="474" y="87" text-anchor="middle" class="fg-t sm">Checker</text>
<rect x="552" y="44" width="112" height="56" rx="6" class="fg-b alt"/><text x="608" y="67" text-anchor="middle" class="fg-t alt">輸出器</text><text x="608" y="87" text-anchor="middle" class="fg-t sm">Emitter</text>
<line x1="128" y1="72" x2="142" y2="72" class="fg-l"/><polygon points="150,72 142,67.5 142,76.5" class="fg-a"/>
<line x1="262" y1="72" x2="276" y2="72" class="fg-l"/><polygon points="284,72 276,67.5 276,76.5" class="fg-a"/>
<line x1="396" y1="72" x2="410" y2="72" class="fg-l"/><polygon points="418,72 410,67.5 410,76.5" class="fg-a"/>
<line x1="530" y1="72" x2="544" y2="72" class="fg-l"/><polygon points="552,72 544,67.5 544,76.5" class="fg-a"/>
<line x1="72" y1="100" x2="72" y2="112" class="fg-l"/><polygon points="72,120 67.5,112 76.5,112" class="fg-a"/>
<line x1="206" y1="100" x2="206" y2="112" class="fg-l"/><polygon points="206,120 201.5,112 210.5,112" class="fg-a"/>
<line x1="340" y1="100" x2="340" y2="112" class="fg-l"/><polygon points="340,120 335.5,112 344.5,112" class="fg-a"/>
<line x1="474" y1="100" x2="474" y2="112" class="fg-l"/><polygon points="474,120 469.5,112 478.5,112" class="fg-a"/>
<line x1="608" y1="100" x2="608" y2="112" class="fg-l"/><polygon points="608,120 603.5,112 612.5,112" class="fg-a"/>
<rect x="16" y="120" width="112" height="56" rx="6" class="fg-b"/><text x="72" y="143" text-anchor="middle" class="fg-t">7 個記號</text><text x="72" y="163" text-anchor="middle" class="fg-t sm mono">let · score · :</text>
<rect x="150" y="120" width="112" height="56" rx="6" class="fg-b"/><text x="206" y="143" text-anchor="middle" class="fg-t">語法樹 AST</text><text x="206" y="163" text-anchor="middle" class="fg-t sm">一個宣告節點</text>
<rect x="284" y="120" width="112" height="56" rx="6" class="fg-b"/><text x="340" y="143" text-anchor="middle" class="fg-t">符號表</text><text x="340" y="163" text-anchor="middle" class="fg-t sm">score 是誰、在哪</text>
<rect x="418" y="120" width="112" height="56" rx="6" class="fg-b"/><text x="474" y="143" text-anchor="middle" class="fg-t">型別與錯誤</text><text x="474" y="163" text-anchor="middle" class="fg-t sm mono">score: number</text>
<rect x="552" y="120" width="112" height="56" rx="6" class="fg-b"/><text x="608" y="143" text-anchor="middle" class="fg-t">輸出檔</text><text x="608" y="163" text-anchor="middle" class="fg-t sm mono">.js .d.ts .map</text>
<path d="M206 176 V204 H608 V184" class="fg-l alt dash"/><polygon points="608,176 603.5,184 612.5,184" class="fg-a alt"/>
<text x="407" y="224" text-anchor="middle" class="fg-t sm alt">Vite、esbuild 只拿掉型別：有語法樹就能輸出，不等檢查器</text>
<text x="407" y="248" text-anchor="middle" class="fg-t sm warm">tsc 預設：檢查出錯，輸出器照樣寫出 .js</text>
</svg><figcaption>五個關卡，一個接一個。重點在下面那條虛線：把型別拿掉只需要語法樹，不需要檢查結果。所以「有型別錯誤」和「產不產生 .js」是兩件分開的事。</figcaption></figure>
<p>這條生產線很像出版社處理一份稿子：</p>
<table>
<tr><th>關卡</th><th>像出版社的</th><th>拿到什麼、交出什麼</th></tr>
<tr><td><b>掃描器</b>（scanner）</td><td>把稿子拆成一個一個字詞</td><td>拿到一串字元，交出一串<b>記號</b>（token）：<code>LetKeyword</code>、<code>Identifier(score)</code>、<code>ColonToken</code>、<code>NumberKeyword</code>、<code>EqualsToken</code>、<code>NumericLiteral(0)</code>、<code>SemicolonToken</code>，一共 7 個</td></tr>
<tr><td><b>剖析器</b>（parser）</td><td>斷句、分段，畫出句子結構</td><td>把記號組成一棵<b>語法樹</b>（abstract syntax tree，AST）。這一行變成一個 <code>VariableStatement</code> 節點，底下掛著名字 <code>score</code>、型別 <code>number</code>、初始值 <code>0</code></td></tr>
<tr><td><b>繫結器</b>（binder）</td><td>編索引：每個人名出現在哪幾頁</td><td>為每個宣告建立一個<b>符號</b>（symbol），記住它在哪個範圍（scope）裡。它也畫出程式的「流程圖」，之後型別縮小要用</td></tr>
<tr><td><b>檢查器</b>（checker）</td><td>校稿：前後對不對得上</td><td>算出每個運算式的型別，判斷「這個值放得進那個位置嗎」，對不上就產生一筆<b>診斷訊息</b>（diagnostic），也就是你看到的紅線</td></tr>
<tr><td><b>輸出器</b>（emitter）</td><td>印刷</td><td>把語法樹裡屬於型別的部分剪掉，必要時把新語法改寫成舊語法，印成 .js。要的話也印出型別宣告檔（.d.ts）和原始碼對照表（.map）</td></tr>
</table>
<p>這五關裡，檢查器是最大、最慢的一關。TypeScript 原始碼裡光是 <code>checker.ts</code> 一個檔案就有好幾萬行；你專案的 <code>node_modules/typescript/lib/typescript.js</code> 把整個編譯器打包成一個檔，5.9 版大約二十萬行。其他四關加起來，都沒有它複雜。</p>
<h4>錯誤編號透露它是哪一關抓到的</h4>
<p>錯誤訊息前面的 TS 編號不是亂排的，大致上可以看出是哪一關抓到的：</p>
<ul>
<li><b>TS1xxx</b>：多半是語法錯誤，剖析器就看不懂了。例如 TS1005「<code>';' expected</code>」。</li>
<li><b>TS2xxx</b>：型別錯誤，檢查器抓到的。TS2322「不能指派給」、TS2339「這個屬性不存在」、TS2345「引數的型別不對」，是你一輩子最常看到的三個。</li>
<li><b>TS7xxx</b>：大多跟「隱含的 any」有關，例如 TS7006「參數隱含 any 型別」，只有開了 <code>noImplicitAny</code> 才會出現。</li>
<li><b>TS18xxx</b>：比較新的編號，例如 TS18047「可能是 null」、TS18048「可能是 &#117;ndefined」。</li>
</ul>
<p>Google 一個錯誤的時候，連編號一起搜，找到的答案會準很多。</p>

<h3><span class="badge lv1">基礎</span>二、型別擦除：什麼會被剪掉，什麼會留下來</h3>
<p>輸出器做的事，叫<b>型別擦除</b>（type erasure）。把同一段程式放在左右兩邊對照，就看得很清楚：</p>
<figure class="figure"><svg viewBox="0 0 660 262" class="fg" style="width:100%;max-width:660px" role="img" aria-label="左邊是 TypeScript 原始碼，右邊是輸出的 JavaScript：型別註記、型別別名和 as 斷言都被拿掉，只有 enum 變成真的程式碼">
<text x="166" y="26" text-anchor="middle" class="fg-t acc">game.ts（你寫的）</text>
<text x="494" y="26" text-anchor="middle" class="fg-t alt">game.js（瀏覽器拿到的）</text>
<rect x="16" y="40" width="300" height="32" rx="5" class="fg-b"/><text x="28" y="61" class="fg-t mono">let score<tspan class="fg-t mono warm">: number</tspan> = 0;</text>
<rect x="344" y="40" width="300" height="32" rx="5" class="fg-b"/><text x="356" y="61" class="fg-t mono">let score = 0;</text>
<rect x="16" y="82" width="300" height="32" rx="5" class="fg-b"/><text x="28" y="103" class="fg-t mono warm">type Card = { rank: number };</text>
<rect x="344" y="82" width="300" height="32" rx="5" class="fg-b"/><text x="356" y="103" class="fg-t sm">（整段消失，什麼都不剩）</text>
<rect x="16" y="124" width="300" height="32" rx="5" class="fg-b"/><text x="28" y="145" class="fg-t mono">function f(c<tspan class="fg-t mono warm">: Card</tspan>)<tspan class="fg-t mono warm">: string</tspan> {</text>
<rect x="344" y="124" width="300" height="32" rx="5" class="fg-b"/><text x="356" y="145" class="fg-t mono">function f(c) {</text>
<rect x="16" y="166" width="300" height="32" rx="5" class="fg-b"/><text x="28" y="187" class="fg-t mono">const n = x<tspan class="fg-t mono warm"> as number</tspan>;</text>
<rect x="344" y="166" width="300" height="32" rx="5" class="fg-b"/><text x="356" y="187" class="fg-t mono">const n = x;</text>
<rect x="16" y="208" width="300" height="32" rx="5" class="fg-b warm"/><text x="28" y="229" class="fg-t mono">enum Level { Easy }</text>
<rect x="344" y="208" width="300" height="32" rx="5" class="fg-b warm"/><text x="356" y="229" class="fg-t mono">var Level; (function (Level) {…</text>
<line x1="318" y1="56" x2="334" y2="56" class="fg-l"/><polygon points="342,56 334,51.5 334,60.5" class="fg-a"/>
<line x1="318" y1="98" x2="334" y2="98" class="fg-l"/><polygon points="342,98 334,93.5 334,102.5" class="fg-a"/>
<line x1="318" y1="140" x2="334" y2="140" class="fg-l"/><polygon points="342,140 334,135.5 334,144.5" class="fg-a"/>
<line x1="318" y1="182" x2="334" y2="182" class="fg-l"/><polygon points="342,182 334,177.5 334,186.5" class="fg-a"/>
<line x1="318" y1="224" x2="334" y2="224" class="fg-l warm"/><polygon points="342,224 334,219.5 334,228.5" class="fg-a warm"/>
<text x="330" y="256" text-anchor="middle" class="fg-t sm">橘色的字是型別，輸出時整段剪掉；其他字一個都不動</text>
</svg><figcaption>前四行都是「剪掉型別，其他照抄」。最後一行是例外：enum 不是型別，而是會產生真正程式碼的語法。</figcaption></figure>
<p>注意第四行：<code>x as number</code> 輸出後就是 <code>x</code>。<code>as</code> 叫<b>型別斷言</b>（type assertion），它只是你對檢查器說「相信我，這是數字」，執行時什麼都不做，不會轉換，也不會檢查。很多人以為 <code>as number</code> 會把字串轉成數字，這是很常見的誤會。</p>
<h4>不會被擦掉的那幾種語法</h4>
<p>TypeScript 的原則是「只加型別，不加新的執行時功能」，但歷史上留下了幾個例外。它們在輸出裡會變成真正的程式碼：</p>
<ul>
<li><b>enum</b>：變成一個物件（講聯集型別那一課的深入圖解會把它拆開）。</li>
<li><b>帶有值的 namespace</b>：變成一個包住程式碼的函式。只放型別的 namespace 則會整個消失。</li>
<li><b>建構子的參數屬性</b>（parameter property）：<code>constructor(public name: string) {}</code> 會多出一行 <code>this.name = name;</code>。</li>
<li><b>裝飾器</b>（decorator）：Cocos Creator 的 <code>@ccclass</code>、<code>@property</code> 都是裝飾器。它們是真正的函式，會在類別定義的時候執行，引擎靠它們知道哪些欄位要顯示在編輯器的屬性面板上。</li>
</ul>
<p>還有一個細節：只拿來當型別用的 <code>import</code>，輸出時也會被拿掉。如果打開 <code>verbatimModuleSyntax</code>，你就得把它們寫成 <code>import type { Card } from './card'</code>，讓「一次只看一個檔」的工具（像 Vite 用的 esbuild）不用猜也知道哪一行可以刪。</p>

<h3><span class="badge lv2">進階</span>三、把型別想成「值的集合」</h3>
<p>想通這一點，大部分錯誤訊息都會變得很好懂：<b>一個型別，就是一群值的集合</b>。<code>number</code> 是所有數字的集合，<code>string</code> 是所有文字的集合，而 <code>10</code> 這個型別，是只裝了一個值的集合。</p>
<figure class="figure"><svg viewBox="0 0 640 284" class="fg" style="width:100%;max-width:640px" role="img" aria-label="型別是值的集合：unknown 包住所有值，number 和 string 是裡面的兩圈，10 是 number 裡只有一個值的小圈；const 得到 10，let 放寬成 number">
<rect x="16" y="16" width="344" height="252" rx="10" class="fg-b"/>
<text x="28" y="35" class="fg-t">unknown：所有的值</text>
<rect x="32" y="44" width="312" height="106" rx="8" class="fg-b alt"/>
<text x="44" y="66" class="fg-t">number：所有數字</text>
<rect x="48" y="96" width="60" height="40" rx="6" class="fg-b"/><text x="78" y="121" text-anchor="middle" class="fg-t mono">7</text>
<rect x="120" y="96" width="60" height="40" rx="6" class="fg-b"/><text x="150" y="121" text-anchor="middle" class="fg-t mono">-2.5</text>
<text x="224" y="121" text-anchor="middle" class="fg-t">⋯</text>
<rect x="268" y="96" width="60" height="40" rx="6" class="fg-b hot"/><text x="298" y="121" text-anchor="middle" class="fg-t mono acc">10</text>
<rect x="32" y="162" width="312" height="72" rx="8" class="fg-b"/>
<text x="44" y="182" class="fg-t">string：所有文字</text>
<rect x="48" y="192" width="80" height="32" rx="6" class="fg-b"/><text x="88" y="213" text-anchor="middle" class="fg-t mono">'Ada'</text>
<rect x="140" y="192" width="80" height="32" rx="6" class="fg-b"/><text x="180" y="213" text-anchor="middle" class="fg-t mono">'Bo'</text>
<circle cx="52" cy="251" r="6" class="fg-b"/><text x="66" y="255" class="fg-t sm">never：空集合，一個值都沒有</text>
<rect x="384" y="34" width="244" height="52" rx="6" class="fg-b alt"/>
<text x="396" y="55" class="fg-t mono">let current = 10</text><text x="396" y="75" class="fg-t sm">放寬（widening）成 number</text>
<line x1="384" y1="60" x2="352" y2="60" class="fg-l alt"/><polygon points="344,60 352,55.5 352,64.5" class="fg-a alt"/>
<rect x="384" y="96" width="244" height="52" rx="6" class="fg-b hot"/>
<text x="396" y="117" class="fg-t mono">const best = 10</text><text x="396" y="137" class="fg-t sm">最窄：就是 10 這一個值</text>
<line x1="384" y1="116" x2="336" y2="116" class="fg-l on"/><polygon points="328,116 336,111.5 336,120.5" class="fg-a on"/>
<rect x="384" y="166" width="244" height="74" rx="6" class="fg-b warm"/>
<text x="396" y="188" class="fg-t warm">指派＝小圈放進大圈</text>
<text x="396" y="208" class="fg-t sm">10 放得進 number：可以</text>
<text x="396" y="226" class="fg-t sm">number 放不進 10：錯誤</text>
</svg><figcaption>型別是一圈一圈的集合。「A 能不能指派給 B」問的就是「A 這一圈，是不是整個在 B 裡面」。</figcaption></figure>
<p>用這張圖讀錯誤訊息：</p>
<ul>
<li>「Type 'string' is not assignable to type 'number'」：string 這一圈不在 number 裡面，所以放不進去。</li>
<li><code>10</code> 可以放進 <code>number</code>，因為小圈在大圈裡；反過來，一個 <code>number</code> 不一定是 10，所以不行。</li>
<li><code>unknown</code> 是最外面那一圈，什麼值都放得進去；但你從 <code>unknown</code> 拿出來的東西，檢查器不讓你直接用，因為它可能是任何東西。</li>
<li><code>never</code> 是空集合。沒有任何值屬於它，所以它可以放進任何型別裡（空集合是每個集合的子集合）。講聯集型別那一課的深入圖解會用它做「窮舉檢查」。</li>
<li><code>any</code> 不在這張圖上。它是一個逃生門：任何東西都能放進 <code>any</code>，<code>any</code> 也能放進任何東西。等於對檢查器說「這裡別管」。</li>
</ul>
<p>聯集（<code>string | number</code>）就是把兩圈合起來，交集型別（<code>A &amp; B</code>）就是兩圈重疊的那一塊。這個「集合」的想法，接下來每一課都用得到。</p>

<h3><span class="badge lv2">進階</span>四、型別推論一步一步：字面值型別與放寬</h3>
<p>你沒寫型別的時候，檢查器會自己推出一個。規則看起來很多，其實背後只有一個問題：<b>這個位置之後會不會被改？</b>不會改，就給最窄的型別；會改，就放寬到「同一類的所有值」。</p>
<pre><code>const best = 10;     // 10
let current = 10;    // number：放寬
const c = 10;
let d = c;           // number：抄進 let 又放寬
const e: 10 = 10;
let f = e;           // 10：親手寫的不放寬
const flag = true;   // true

// { guess: string }：屬性可以改，放寬
const round = { guess: 'higher' };

// (string | number)[]：取所有元素的聯集
const mixed = [1, 'a'];

function pick() {
  return 'higher';   // 回傳型別是 string
}</code></pre>
<p>一個一個追：</p>
<ol>
<li><code>best</code>：<code>const</code> 的值永遠是 10，給它 <code>number</code> 反而丟掉了資訊，所以型別就是 <code>10</code>。</li>
<li><code>current</code>：如果型別是 <code>10</code>，下一行 <code>current = 11</code> 就會報錯，這個變數就沒用了。所以放寬成 <code>number</code>，這叫<b>型別放寬</b>（widening）。</li>
<li><code>d</code>：<code>c</code> 的型別 <code>10</code> 是一種「會被放寬的字面值型別」，它一抄進 <code>let</code> 就變回 <code>number</code>。</li>
<li><code>f</code>：<code>e</code> 的 <code>10</code> 是你親手寫的。檢查器認為那是你的意圖，抄到哪裡都不放寬。</li>
<li><code>round</code>：變數雖然是 <code>const</code>，但 <code>const</code> 只擋「換一個物件」，擋不住 <code>round.guess = 'lower'</code>。屬性會變，所以放寬成 <code>string</code>。講聯集型別那一課最後那個「單字又變回字串」的陷阱，原因就在這裡。</li>
<li><code>pick</code>：沒寫回傳型別的函式，回傳的字面值也會被放寬。</li>
</ol>
<h4>三種叫它「不要放寬」的方法</h4>
<pre><code>type Guess = 'higher' | 'lower';
type Config = { guess: Guess; rounds: number };

// 1. 寫上型別：期待的型別擋住放寬
const a: Config = { guess: 'higher', rounds: 10 };

// 2. as const：全部不放寬，而且變成唯讀
const b = { guess: 'higher', rounds: 10 } as const;

// 3. satisfies（4.9 版起）：照 Config 檢查，
//    但保留推論出來的型別
const c = {
  guess: 'higher', rounds: 10,
} satisfies Config;
const d = {
  guess: 'hihger', rounds: 10,   // 錯誤：錯字被抓到
} satisfies Config;</code></pre>
<p>三種的差別在「之後你看到的型別」。<code>a.guess</code> 是 <code>Guess</code>；<code>b.guess</code> 是 <code>'higher'</code> 而且不能改；<code>c.guess</code> 是 <code>'higher'</code>，<code>c.rounds</code> 是 <code>number</code>。<code>satisfies</code> 特別適合設定檔：你要它照規格檢查，又不想失去精確的型別。</p>
<p>還有一種推論方向相反的情況，叫<b>上下文型別</b>（contextual typing）：值的型別不是從自己推出來，而是從「它要放進去的位置」推出來。<code>[7, 12].map(n =&gt; n * 2)</code> 裡的 <code>n</code> 沒寫型別，卻知道是 <code>number</code>，就是從 <code>map</code> 的參數型別推回來的。講函式的那一課會再遇到它。</p>

<h3><span class="badge lv2">進階</span>五、型別錯誤和執行時錯誤，是兩種不同的東西</h3>
<p><b>型別錯誤</b>是檢查器在程式跑之前，看著原始碼說「這裡對不上」。<b>執行時錯誤</b>（runtime error）是程式真的跑起來，JavaScript 引擎做不下去，丟出一個例外，例如 <code>TypeError: Cannot read properties of &#117;ndefined (reading 'toFixed')</code>。兩者大部分時候會一起出現，但不是永遠。把所有情況排成一張表：</p>
<figure class="figure"><svg viewBox="0 0 640 262" class="fg" style="width:100%;max-width:640px" role="img" aria-label="二乘二的表：檢查器有沒有報錯，對上執行時會不會壞，四格各舉一個例子">
<text x="264" y="30" text-anchor="middle" class="fg-t lg">檢查器報錯</text>
<text x="512" y="30" text-anchor="middle" class="fg-t lg">檢查器沒報錯</text>
<text x="24" y="90" class="fg-t">執行時</text><text x="24" y="108" class="fg-t warm">會壞</text>
<text x="24" y="198" class="fg-t">執行時</text><text x="24" y="216" class="fg-t">不會壞</text>
<rect x="144" y="44" width="240" height="100" rx="8" class="fg-b hot"/>
<text x="156" y="68" class="fg-t acc">抓到了</text>
<text x="156" y="94" class="fg-t mono">'7'.toFixed(0)</text>
<text x="156" y="120" class="fg-t sm">字串沒有 toFixed，寫的時候就擋下</text>
<rect x="392" y="44" width="240" height="100" rx="8" class="fg-b warm"/>
<text x="404" y="68" class="fg-t warm">漏網之魚</text>
<text x="404" y="94" class="fg-t mono">hand[99].toFixed(0)</text>
<text x="404" y="120" class="fg-t sm">型別說 number，其實是 &#117;ndefined</text>
<rect x="144" y="152" width="240" height="100" rx="8" class="fg-b alt"/>
<text x="156" y="176" class="fg-t alt">保守的誤報</text>
<text x="156" y="202" class="fg-t mono">el.textContent = '0'</text>
<text x="156" y="228" class="fg-t sm">元素其實在，但檢查器不知道</text>
<rect x="392" y="152" width="240" height="100" rx="8" class="fg-b"/>
<text x="404" y="176" class="fg-t">正常的程式</text>
<text x="404" y="202" class="fg-t mono">score + 1</text>
<text x="404" y="228" class="fg-t sm">兩邊都沒事</text>
</svg><figcaption>右上那格最重要：「檢查器沒報錯」不等於「不會壞」。左下那格則是檢查器寧可多罵你一次，也不要漏掉。</figcaption></figure>
<ul>
<li><b>左上，抓到了</b>：型別系統的價值所在。這個錯不用等到使用者按下按鈕才出現。</li>
<li><b>左下，保守的誤報</b>：<code>document.querySelector('#score')</code> 的型別是 <code>Element | null</code>。你知道頁面上一定有這個元素，檢查器不知道。它寧可要你多寫一個檢查。這種時候不要急著用 <code>!</code> 或 <code>as</code> 把它壓下去，先想想「如果真的沒有，使用者會看到什麼」。</li>
<li><b>右上，漏網之魚</b>：這一格才是真正的危險。下一段專門講它。</li>
</ul>
<h4>檢查器故意留下的洞</h4>
<p>TypeScript 官方的設計目標裡，白紙黑字寫著：<b>不追求</b>一個完全健全（sound）、可以證明正確的型別系統，而是在正確性和好不好用之間取平衡。所以有一些洞是故意留的：</p>
<pre><code>const hand: number[] = [];
// 檢查器沒意見；執行時 TypeError
hand[99].toFixed(0);

// data 是 any；score 其實是字串 "12"
const data = JSON.parse('{"score":"12"}');
const score: number = data.score;

const names: string[] = ['Ada'];
// 允許：陣列可以「往上」指派
const mixed: (string | number)[] = names;
mixed.push(42);
// 檢查器沒意見；執行時 42 沒有 toUpperCase
names[1].toUpperCase();</code></pre>
<p>第三個例子最隱密：<code>names</code> 和 <code>mixed</code> 指著同一個陣列（下一課的深入圖解會畫給你看），透過 <code>mixed</code> 塞進去的 42，從 <code>names</code> 讀出來時型別卻寫著 string。這就是為什麼「沒有紅線」只代表「檢查器找不到矛盾」，不代表「程式是對的」。洞的來源可以背成一張清單：<code>any</code>、<code>as</code>、<code>!</code>、用索引讀陣列或 Record、<code>JSON.parse</code> 和所有從外面來的資料，以及陣列的這種指派。看到它們，就要多想一步。</p>

<h3><span class="badge lv3">專業</span>六、strict 家族：九個開關，各抓一種錯</h3>
<p><code>"strict": true</code> 其實不是一個檢查，而是一次打開一整組。TypeScript 5.9 的 strict 家族有九個：</p>
<table>
<tr><th>開關</th><th>抓什麼</th><th>典型錯誤</th></tr>
<tr><td><code>noImplicitAny</code></td><td>推不出型別、只好當成 any 的地方，要你寫清楚</td><td>TS7006</td></tr>
<tr><td><code>strictNullChecks</code></td><td>null 和 &#117;ndefined 不再能放進任何型別；可能是空的值，要先檢查才能用</td><td>TS18047、TS18048</td></tr>
<tr><td><code>strictFunctionTypes</code></td><td>函式型別的參數要對得上：「只會處理 string 的函式」不能冒充「要處理 string 或 number 的函式」</td><td>TS2322</td></tr>
<tr><td><code>strictBindCallApply</code></td><td>用 <code>call</code>、<code>apply</code>、<code>bind</code> 呼叫時，也照樣檢查引數</td><td>TS2345</td></tr>
<tr><td><code>strictPropertyInitialization</code></td><td>類別的欄位宣告了，卻沒在宣告處或建構子裡給值</td><td>TS2564</td></tr>
<tr><td><code>noImplicitThis</code></td><td>一般函式裡的 <code>this</code> 不知道是誰</td><td>TS2683</td></tr>
<tr><td><code>useUnknownInCatchVariables</code></td><td><code>catch (e)</code> 的 <code>e</code> 是 unknown 不是 any，要先檢查才能讀 <code>e.message</code></td><td>TS18046</td></tr>
<tr><td><code>alwaysStrict</code></td><td>用 JavaScript 的嚴格模式剖析，必要時在輸出加上 <code>"use strict"</code></td><td>語法錯誤</td></tr>
<tr><td><code>strictBuiltinIteratorReturn</code></td><td>內建迭代器結束時的 <code>value</code> 是 &#117;ndefined，不是 any（5.6 版加入）</td><td>TS18048 等</td></tr>
</table>
<pre><code>// TS7006：n 隱含 any
function double(n) { return n * 2; } // 錯誤

const el = document.querySelector('#score');
el.textContent = '0';   // 錯誤 TS18047：可能是 null

type Handler = (x: string | number) =&gt; void;
const h: Handler = (x: string) =&gt; {}; // 錯誤 TS2322

class Hero {
  hp: number;   // 錯誤 TS2564：沒有初始值
  name = '';
}

try {
  JSON.parse('{');
} catch (e) {
  console.log(e.message);   // 錯誤 TS18046
}</code></pre>
<h4>三件在實務上會咬你的事</h4>
<ol>
<li><b>strict 會長大</b>：TypeScript 偶爾會把新的檢查放進 strict 家族。<code>useUnknownInCatchVariables</code> 是 4.4 版加的，<code>strictBuiltinIteratorReturn</code> 是 5.6 版加的。所以升級 TypeScript 之後突然多出一堆錯，不一定是你的程式變差了，是檢查器變嚴了。<code>package.json</code> 裡把版本鎖住（例如 <code>"typescript": "~5.9.3"</code>），升級當成一件獨立的工作來做。</li>
<li><b>舊專案不要一次全開</b>：一次打開 strict，幾百上千個錯誤會把人嚇跑。實務上一個一個開，通常從 <code>noImplicitAny</code> 開始，再開 <code>strictNullChecks</code>。這兩個抓到的錯最多，也最有價值。</li>
<li><b>Cocos 專案要自己看</b>：Cocos Creator 3.x 新建的專案，<code>tsconfig.json</code> 常見的是 <code>"strict": false</code>，打開看看你的專案。如果你打開了 strict，元件上的 <code>@property(Node) target: Node = null;</code> 這種寫法就會報錯，要改成 <code>target: Node | null = null;</code>，用之前先檢查。</li>
</ol>
<h4>strict 以外，值得打開的幾個</h4>
<table>
<tr><th>開關</th><th>抓什麼</th></tr>
<tr><td><code>noUncheckedIndexedAccess</code></td><td>用索引讀陣列、Record 時加上 <code>| &#117;ndefined</code>（下一節細講）</td></tr>
<tr><td><code>exactOptionalPropertyTypes</code></td><td><code>nickname?: string</code> 的意思變成「可以沒有這個屬性」，但不能明寫 <code>nickname: &#117;ndefined</code></td></tr>
<tr><td><code>noImplicitReturns</code></td><td>有的路線有 <code>return</code>、有的路線沒有</td></tr>
<tr><td><code>noFallthroughCasesInSwitch</code></td><td><code>switch</code> 的 <code>case</code> 忘了 <code>break</code>，掉進下一個 case</td></tr>
<tr><td><code>noImplicitOverride</code></td><td>子類別覆寫父類別的方法，一定要寫 <code>override</code></td></tr>
<tr><td><code>noUnusedLocals</code>、<code>noUnusedParameters</code></td><td>宣告了卻沒用到的變數和參數</td></tr>
</table>

<h3><span class="badge lv3">專業</span>七、tsconfig 必懂的設定：每一個都只管一段</h3>
<p><code>tsconfig.json</code> 有一百多個選項，但真正會影響你的不到二十個。記法是：每個選項都只管生產線的其中一段。</p>
<figure class="figure"><svg viewBox="0 0 688 252" class="fg" style="width:100%;max-width:688px" role="img" aria-label="tsconfig 的設定分成三組：載入哪些檔案、檢查多嚴格、輸出什麼，各自對應編譯流程的一段">
<rect x="16" y="20" width="208" height="40" rx="6" class="fg-b alt"/><text x="120" y="45" text-anchor="middle" class="fg-t alt">1 載入哪些檔案</text>
<rect x="240" y="20" width="208" height="40" rx="6" class="fg-b hot"/><text x="344" y="45" text-anchor="middle" class="fg-t acc">2 檢查多嚴格</text>
<rect x="464" y="20" width="208" height="40" rx="6" class="fg-b warm"/><text x="568" y="45" text-anchor="middle" class="fg-t warm">3 輸出什麼</text>
<line x1="224" y1="40" x2="232" y2="40" class="fg-l"/><polygon points="240,40 232,35.5 232,44.5" class="fg-a"/>
<line x1="448" y1="40" x2="456" y2="40" class="fg-l"/><polygon points="464,40 456,35.5 456,44.5" class="fg-a"/>
<line x1="120" y1="60" x2="120" y2="72" class="fg-l"/><polygon points="120,80 115.5,72 124.5,72" class="fg-a"/>
<line x1="344" y1="60" x2="344" y2="72" class="fg-l"/><polygon points="344,80 339.5,72 348.5,72" class="fg-a"/>
<line x1="568" y1="60" x2="568" y2="72" class="fg-l"/><polygon points="568,80 563.5,72 572.5,72" class="fg-a"/>
<rect x="16" y="80" width="208" height="160" rx="6" class="fg-b"/>
<text x="30" y="104" class="fg-t sm mono">include / files</text>
<text x="30" y="124" class="fg-t sm mono">lib</text><text x="210" y="124" text-anchor="end" class="fg-t sm">有哪些內建 API</text>
<text x="30" y="144" class="fg-t sm mono">types</text>
<text x="30" y="164" class="fg-t sm mono">moduleResolution</text>
<text x="30" y="184" class="fg-t sm mono">paths</text><text x="210" y="184" text-anchor="end" class="fg-t sm">路徑別名</text>
<text x="30" y="204" class="fg-t sm mono">resolveJsonModule</text>
<text x="30" y="224" class="fg-t sm mono">extends</text><text x="210" y="224" text-anchor="end" class="fg-t sm">繼承另一份</text>
<rect x="240" y="80" width="208" height="160" rx="6" class="fg-b"/>
<text x="254" y="104" class="fg-t sm mono">strict</text><text x="434" y="104" text-anchor="end" class="fg-t sm">九個一起開</text>
<text x="254" y="124" class="fg-t sm mono">noUncheckedIndexedAccess</text>
<text x="254" y="144" class="fg-t sm mono">exactOptionalPropertyTypes</text>
<text x="254" y="164" class="fg-t sm mono">noImplicitOverride</text>
<text x="254" y="184" class="fg-t sm mono">noFallthroughCasesInSwitch</text>
<text x="254" y="204" class="fg-t sm mono">isolatedModules</text>
<text x="254" y="224" class="fg-t sm mono">skipLibCheck</text>
<rect x="464" y="80" width="208" height="160" rx="6" class="fg-b"/>
<text x="478" y="104" class="fg-t sm mono">target</text><text x="658" y="104" text-anchor="end" class="fg-t sm">語法改寫到哪一版</text>
<text x="478" y="124" class="fg-t sm mono">module</text><text x="658" y="124" text-anchor="end" class="fg-t sm">import 怎麼寫出去</text>
<text x="478" y="144" class="fg-t sm mono">outDir</text>
<text x="478" y="164" class="fg-t sm mono">noEmit</text><text x="658" y="164" text-anchor="end" class="fg-t sm">只檢查不輸出</text>
<text x="478" y="184" class="fg-t sm mono">noEmitOnError</text>
<text x="478" y="204" class="fg-t sm mono">declaration</text><text x="658" y="204" text-anchor="end" class="fg-t sm">產生 .d.ts</text>
<text x="478" y="224" class="fg-t sm mono">sourceMap</text>
</svg><figcaption>找不到檔案、找不到模組，去看左邊；錯誤太多或太少，去看中間；輸出的 JS 在舊瀏覽器壞掉，去看右邊。</figcaption></figure>
<p>一份給 Vite 或 Vue 前端專案用的典型設定（tsconfig 允許寫註解）：</p>
<pre><code>{
  "compilerOptions": {
    // 輸出語法：比 ES2022 新的才改寫
    "target": "ES2022",
    // 保留 import/export，交給打包工具
    "module": "ESNext",
    "moduleResolution": "bundler",
    // 檢查器認得哪些內建 API
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    // 擋下「單檔編譯」做不到的寫法
    "isolatedModules": true,
    // 只當型別用的 import 要寫 import type
    "verbatimModuleSyntax": true,
    // 不檢查 node_modules 裡的 .d.ts
    "skipLibCheck": true,
    // tsc 只檢查，輸出交給 Vite
    "noEmit": true
  },
  "include": ["src"]
}</code></pre>
<h4>target 和 lib：最常被搞混的一對</h4>
<p><code>target</code> 決定輸出器要把<b>語法</b>改寫到哪一版。<code>stats?.best</code> 這種可選串連（optional chaining）是 ES2020 的語法，所以 target 設成 ES2019 時會被改寫：</p>
<pre><code>// target: ES2019 的輸出（換行是為了排版）
const best = stats === null || stats === void 0
  ? void 0 : stats.best;</code></pre>
<p>但 <code>target</code> <b>不會</b>幫你補上新的 API。<code>[1, 2].includes(2)</code> 不管 target 設多舊，輸出都原封不動，在不支援 <code>includes</code> 的舊環境裡照樣當掉。<code>lib</code> 也不會補：它只告訴檢查器「假設執行環境有這些 API」。設成 <code>"lib": ["ES5"]</code>，檢查器會說 <code>includes</code> 不存在（TS2550）；設成 ES2016 以上，它就相信你。要真的補上 API，得靠 polyfill，或者把 target 和 lib 設成你真的要支援的最舊環境。</p>
<h4>module 和 moduleResolution</h4>
<p><code>module</code> 決定輸出的 import 長什麼樣子：<code>ESNext</code> 原樣保留，<code>CommonJS</code> 改成 <code>require</code>。<code>moduleResolution</code> 決定 <code>import { x } from './deck'</code> 要去哪裡找檔案。前端交給打包工具的專案用 <code>bundler</code>；直接用 Node.js 跑的後端，用 <code>"module": "nodenext"</code>，它會照 Node 真正的規則檢查，例如相對路徑要寫副檔名。設錯的典型症狀是：編輯器裡好好的，一跑就 <code>Cannot find module</code>。</p>
<h4>noUncheckedIndexedAccess：讓索引讀取說實話</h4>
<pre><code>// @noUncheckedIndexedAccess: true
const hand = [7, 12, 3];
const first = hand[0];   // number | &#117;ndefined
first.toFixed(0);        // 錯誤：可能是 &#117;ndefined
if (first !== &#117;ndefined) first.toFixed(0);

// 元組的固定位置一定在，不加 &#117;ndefined
const pair: [number, number] = [7, 11];
pair[0].toFixed(0);

// for...of 拿到的一定存在
for (const card of hand) card.toFixed(0);

const best: Record&lt;string, number&gt; = {};
const zoe = best['Zoe'];   // number | &#117;ndefined</code></pre>
<p>上面第一行的 <code>// @noUncheckedIndexedAccess: true</code> 是 TypeScript Playground 認得的寫法，意思是「這段例子假設 tsconfig 開了這個選項」。這個開關不在 strict 家族裡，因為它很吵：每個 <code>hand[i]</code> 都要檢查。但在遊戲和後端程式裡，「讀到不存在的那一格」正是最常見的當機原因之一。新專案建議一開始就打開；舊專案打開前，先估一下要改多少地方。</p>

<h3><span class="badge lv3">專業</span>八、誰在檢查，誰只拿掉型別</h3>
<p>同一份 TypeScript 程式碼，在你的工作流程裡會經過三個地方：兩個會跑檢查器，一個只拿掉型別、完全不檢查。搞清楚它們，才知道為什麼「我這邊明明沒紅線，CI 卻失敗」。</p>
<figure class="figure"><svg viewBox="0 0 680 236" class="fg" style="width:100%;max-width:680px" role="img" aria-label="三條路：編輯器用語言服務即時檢查，CI 用 tsc 或 vue-tsc 檢查整個專案，開發伺服器只拿掉型別不檢查">
<rect x="16" y="24" width="120" height="56" rx="6" class="fg-b hot"/><text x="76" y="57" text-anchor="middle" class="fg-t acc">編輯器</text>
<rect x="164" y="24" width="240" height="56" rx="6" class="fg-b"/><text x="284" y="47" text-anchor="middle" class="fg-t">語言服務 tsserver</text><text x="284" y="67" text-anchor="middle" class="fg-t sm">Vue - Official 也是接它</text>
<rect x="432" y="24" width="232" height="56" rx="6" class="fg-b"/><text x="444" y="47" class="fg-t sm">只重查改到的地方</text><text x="444" y="67" class="fg-t sm">紅線通常一秒內出現</text>
<rect x="16" y="96" width="120" height="56" rx="6" class="fg-b alt"/><text x="76" y="129" text-anchor="middle" class="fg-t alt">CI／建置</text>
<rect x="164" y="96" width="240" height="56" rx="6" class="fg-b"/><text x="284" y="119" text-anchor="middle" class="fg-t mono">tsc --noEmit</text><text x="284" y="139" text-anchor="middle" class="fg-t sm mono">vue-tsc -b</text>
<rect x="432" y="96" width="232" height="56" rx="6" class="fg-b"/><text x="444" y="119" class="fg-t sm">整個專案從頭查一次</text><text x="444" y="139" class="fg-t sm">有錯，結束碼不是 0，流程失敗</text>
<rect x="16" y="168" width="120" height="56" rx="6" class="fg-b warm"/><text x="76" y="201" text-anchor="middle" class="fg-t warm">開發伺服器</text>
<rect x="164" y="168" width="240" height="56" rx="6" class="fg-b"/><text x="284" y="191" text-anchor="middle" class="fg-t">Vite（esbuild）</text><text x="284" y="211" text-anchor="middle" class="fg-t sm">Node.js 的型別剝除</text>
<rect x="432" y="168" width="232" height="56" rx="6" class="fg-b warm"/><text x="444" y="191" class="fg-t sm">一個檔一個檔拿掉型別</text><text x="444" y="211" class="fg-t sm warm">完全不檢查</text>
<line x1="136" y1="52" x2="156" y2="52" class="fg-l on"/><polygon points="164,52 156,47.5 156,56.5" class="fg-a on"/>
<line x1="404" y1="52" x2="424" y2="52" class="fg-l on"/><polygon points="432,52 424,47.5 424,56.5" class="fg-a on"/>
<line x1="136" y1="124" x2="156" y2="124" class="fg-l alt"/><polygon points="164,124 156,119.5 156,128.5" class="fg-a alt"/>
<line x1="404" y1="124" x2="424" y2="124" class="fg-l alt"/><polygon points="432,124 424,119.5 424,128.5" class="fg-a alt"/>
<line x1="136" y1="196" x2="156" y2="196" class="fg-l warm"/><polygon points="164,196 156,191.5 156,200.5" class="fg-a warm"/>
<line x1="404" y1="196" x2="424" y2="196" class="fg-l warm"/><polygon points="432,196 424,191.5 424,200.5" class="fg-a warm"/>
</svg><figcaption>真正擋得住錯誤的只有上面兩條。第三條快，是因為它根本沒做檢查器那一關。</figcaption></figure>
<ul>
<li><b>編輯器</b>：VS Code 在背景跑一個語言服務（tsserver），你每打一個字，它只重新剖析改到的檔案，檢查你正在看的那幾個檔。所以很快，但它不一定把整個專案都查過。</li>
<li><b>CI 和建置</b>：<code>tsc --noEmit</code> 或 Vue 專案的 <code>vue-tsc -b</code> 會把整個專案從頭查一遍。有錯時，tsc 的結束碼不是 0：有產生檔案時是 2，被 <code>noEmitOnError</code> 擋下輸出時是 1。CI 就是靠這個數字判斷失敗。常見的 build 指令是 <code>vue-tsc -b &amp;&amp; vite build</code>：先檢查，過了才打包。</li>
<li><b>開發伺服器</b>：Vite 用 esbuild 一個檔一個檔把型別剪掉，所以快，但完全不檢查。Node.js 22 版之後也加入了「型別剝除」（type stripping），可以直接跑 .ts 檔，較新的版本已經不需要另外加旗標；做法一樣只剪不查。Cocos Creator 編譯腳本時，同樣是把型別拿掉就跑，型別錯誤不會擋住預覽。</li>
</ul>
<div class="warn"><b>「我這邊沒紅線，CI 卻失敗」最常見的三個原因：</b>一、VS Code 用的是它自己內建的 TypeScript 版本，和專案 <code>node_modules</code> 裡的不同。在 .ts 檔裡打開命令面板，選「TypeScript: Select TypeScript Version」，改用「Use Workspace Version」。二、你沒打開的檔案有錯，編輯器沒去查。三、CI 用的 tsconfig 和編輯器讀的那一份不一樣，例如 Vite 專案常拆成 <code>tsconfig.app.json</code> 和 <code>tsconfig.node.json</code>。</div>
<h4>壓下錯誤的兩種寫法</h4>
<pre><code>// @ts-expect-error：下一行預期會有錯
const a: number = 'x';

// 底下其實沒有錯時，這行註解本身會被回報
// @ts-expect-error（TS2578）
const b: number = 5;</code></pre>
<p>真的必須壓下一個錯的時候（例如第三方套件的型別寫錯了），用 <code>@ts-expect-error</code>，不要用 <code>@ts-ignore</code>。差別在於：哪天套件修好了，<code>@ts-expect-error</code> 會跳出來提醒你把它拿掉；<code>@ts-ignore</code> 則會永遠安靜地留在那裡，連之後真正的錯也一起蓋掉。</p>

<h3><span class="badge lv4">專家</span>九、檢查器的內部：懶惰、快取，和時間花在哪裡</h3>
<p>檢查器不會一開始就把每個東西的型別都算好。它是<b>懶惰</b>（lazy）的：有人問「這個變數是什麼型別」，它才去算，算完記在那個符號身上，下次直接拿。編輯器滑鼠移上去看到的型別、紅色底線，都是對檢查器的一次「詢問」。這也是為什麼語言服務在大專案裡還能很快：你只看一個檔，它只需要算這個檔用到的那些型別。</p>
<p>想知道時間花在哪裡，加上 <code>--extendedDiagnostics</code>。用一個只有 6 行、開了 strict、lib 包含 DOM 的小檔案實際跑一次，數字大約是這樣（不同電腦會有差異，看比例就好）：</p>
<pre><code>// 終端機輸出（節錄）
Files:                         64
Lines of Library:           51126
Lines of TypeScript:            6
Parse time:                 0.12s
Bind time:                  0.06s
Check time:                 0.45s
Emit time:                  0.01s
Total time:                 0.67s</code></pre>
<p>你只寫了 6 行，編譯器卻讀了 64 個檔、五萬多行。那些是 <code>lib.es2022.d.ts</code>、<code>lib.dom.d.ts</code> 這些內建 API 的型別宣告。檢查時間佔了總時間的三分之二。同一個專案加上 <code>--skipLibCheck</code>，Check time 降到 0.01 秒，因為不再檢查那五萬行宣告檔本身（但你的程式用到它們時，照樣會去讀）。大專案裡，常見的加速手段依序是：</p>
<ol>
<li><code>skipLibCheck: true</code>：幾乎每個專案都開，代價是 node_modules 裡互相打架的型別宣告不會被發現。</li>
<li><code>incremental: true</code>：把上次的結果存在 <code>.tsbuildinfo</code> 檔，下次只重查有變的部分。</li>
<li><b>專案參照</b>（project references）：把大專案切成幾個子專案，用 <code>tsc -b</code> 只重建有變的那幾個。Vite 和 Vue 的範本裡，<code>tsconfig.json</code> 只剩一個 <code>references</code> 清單，就是這個用法。</li>
<li>有效能問題時，用 <code>--generateTrace</code> 產生追蹤檔，看是哪個型別算得特別久。通常兇手是寫得太聰明的泛型。</li>
</ol>
<h4>型別系統本身也會「跑不完」</h4>
<p>TypeScript 的型別系統強到可以寫出遞迴的型別運算，強到有人在型別層用它做加減法。代價是檢查器得防止自己陷入無窮迴圈：型別展開太深時，它會停下來報 TS2589「Type instantiation is excessively deep and possibly infinite」。看到這個錯，幾乎都是型別寫得太花俏，簡化它，而不是想辦法騙過檢查器。</p>
<h4>下一代：用 Go 重寫的編譯器</h4>
<p>現在的編譯器是用 TypeScript 自己寫的，跑在 Node.js 上。微軟在 2025 年宣布把它移植到 Go（TypeScript 7，代號 Corsa），目標是大型專案的檢查速度快上大約 10 倍，主要靠原生程式碼和多執行緒平行檢查。型別規則本身不變，你寫的程式不用改。已經有預覽版可以試（<code>tsgo</code> 指令）。對每天跑幾十次 CI 的團隊來說，這是實打實的時間和錢。</p>
<h4>資安：型別擦除代表邊界一定要驗證</h4>
<p>型別在執行時完全不存在，這件事在資安上有一個直接的後果：<b>所有從外面進來的資料，型別都只是你的願望</b>。</p>
<pre><code>type Role = 'player' | 'admin';
type Player = { name: string; role: Role };

function isPlayer(x: unknown): x is Player {
  if (typeof x !== 'object' || x === null) {
    return false;
  }
  const o = x as Record&lt;string, unknown&gt;;
  const roleOk =
    o.role === 'player' || o.role === 'admin';
  return typeof o.name === 'string' &amp;&amp; roleOk;
}

const raw = '{"name":"Ada","role":"admin"}';
const body: unknown = JSON.parse(raw);
// 什麼都沒檢查，只是讓檢查器閉嘴
const trusted = body as Player;
if (isPlayer(body)) {
  console.log(body.role);   // 真的檢查過
}</code></pre>
<p><code>as Player</code> 在輸出裡完全消失，伺服器如果收到使用者自己改過的 <code>"role": "admin"</code>，它一路暢通。真正的檢查要寫成會在執行時跑的程式碼：自己寫型別守衛（像上面的 <code>isPlayer</code>），或用 Zod、Valibot 這類驗證函式庫，同時得到執行時的檢查和 TypeScript 型別。而「這個人能不能當 admin」這種權限判斷，本來就該由伺服器查自己的資料庫，不是相信客戶端送來的欄位。</p>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>有型別錯誤就不會產生 .js</td><td>tsc 預設照樣輸出，只是結束碼不是 0。要擋下輸出，得打開 <code>noEmitOnError</code>。Vite、esbuild 根本不檢查。</td></tr>
<tr><td><code>x as number</code> 會把值轉成數字</td><td><code>as</code> 輸出後完全消失，不轉換、不檢查。要轉換用 <code>Number(x)</code>。</td></tr>
<tr><td>target 設成 ES5，新 API 就能在舊瀏覽器跑</td><td>target 只改寫語法，不補 API。<code>includes</code>、<code>Promise</code> 這些要靠 polyfill。</td></tr>
<tr><td>沒有紅線，程式就是對的</td><td>索引讀取、<code>any</code>、<code>as</code>、<code>JSON.parse</code>、陣列的指派都是檢查器看不到的洞。</td></tr>
<tr><td>strict 是一個檢查</td><td>它是九個開關的總稱，而且新版 TypeScript 可能再加進新的。</td></tr>
<tr><td>const 宣告的物件是不能改的</td><td>const 只擋「換一個物件」，屬性照樣能改，所以屬性的型別會被放寬。</td></tr>
<tr><td>型別寫越多越安全</td><td>能推論的地方寫了註記，只是多打字。該寫的是函式的參數、回傳值，和資料從外面進來的邊界。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>Vue</b>：<code>&lt;script setup lang="ts"&gt;</code> 裡的程式碼由 Vue 的工具（vue-tsc、Vue - Official 擴充套件）轉成 TypeScript 檢查器看得懂的樣子再檢查，所以本章所有規則都適用。<code>npm run dev</code> 不檢查，<code>npm run build</code> 裡有沒有 <code>vue-tsc</code>，決定你的型別錯誤會不會被擋下來。</li>
<li><b>Cocos Creator</b>：編輯器預覽只拿掉型別，型別錯誤不會擋住你。要讓檢查有效，得靠 VS Code 的紅線，或在 CI 裡另外跑一次 <code>tsc --noEmit</code>。先確認專案的 strict 設定，再決定元件欄位要不要寫成 <code>Node | null</code>。</li>
<li><b>Node.js 後端</b>：開發時可以用 Node 的型別剝除或 tsx 直接跑 .ts，部署前一定要在 CI 跑過 <code>tsc --noEmit</code>。所有 HTTP 請求的 body、WebSocket 訊息、資料庫查出來的資料，都先驗證再相信。</li>
<li><b>Docker 和 CI</b>：多階段建置（multi-stage build）的第一階段跑 <code>tsc</code> 或 <code>vite build</code>，第二階段只複製產生出來的 .js。正式映像檔裡不需要 TypeScript，也不需要 .ts 原始碼。</li>
<li><b>讀錯誤訊息</b>：從最底下那一行讀起。很長的 TS2322 訊息是一層一層往內說的，最後一行通常才是真正對不上的那兩個型別。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<p>下面是前端、Node.js 和遊戲工程師面試裡真的會出現的題目。先自己講一遍（最好出聲講），再打開參考答案。</p>
<ol>
<li>「TypeScript 編譯一個檔案，會經過哪些階段？型別在哪裡被擦掉？」</li>
<li>「<code>const a = 'x'</code> 和 <code>let b = 'x'</code> 推論出來的型別有什麼不同？為什麼要這樣設計？」</li>
<li>「TypeScript 的型別系統是 sound 的嗎？舉一個通過檢查、執行時卻會壞的例子。」</li>
<li>「<code>strict: true</code> 打開了哪些檢查？你會怎麼把一個舊專案遷移到 strict？」</li>
<li>「tsconfig 的 <code>target</code> 和 <code>lib</code> 差在哪裡？」</li>
<li>「從 API 拿到的 JSON，你怎麼確保它符合你的型別？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>掃描器把文字拆成記號，剖析器建成語法樹，繫結器建立符號和範圍、畫出流程圖，檢查器計算型別並回報錯誤，輸出器把語法樹裡的型別部分剪掉、依 target 改寫語法，印出 .js、.d.ts 和 source map。擦除發生在輸出器，而且只需要語法樹，所以 esbuild 這類工具可以不經過檢查器就輸出；也因此 tsc 預設有錯照樣輸出。</li>
<li><code>a</code> 是字面值型別 <code>'x'</code>，<code>b</code> 被放寬成 <code>string</code>。原因是可變性：<code>const</code> 永遠是這個值，給最窄的型別最有資訊；<code>let</code> 之後會被重新指派，如果型別是 <code>'x'</code>，它就沒辦法裝別的字串了。物件屬性也會放寬，要保留字面值可以寫型別註記、<code>as const</code> 或 <code>satisfies</code>。</li>
<li>不是，官方設計目標明說不追求 soundness，而是在正確性和生產力之間取平衡。例子：<code>const xs: number[] = []; xs[0].toFixed()</code> 通過檢查但執行時 TypeError；或是把 <code>string[]</code> 指派給 <code>(string | number)[]</code> 再 push 一個數字。前者可以用 <code>noUncheckedIndexedAccess</code> 補上。</li>
<li>strict 包含 noImplicitAny、strictNullChecks、strictFunctionTypes、strictBindCallApply、strictPropertyInitialization、noImplicitThis、useUnknownInCatchVariables、alwaysStrict 和 strictBuiltinIteratorReturn。遷移時一個一個開，先開 noImplicitAny 再開 strictNullChecks；在 CI 裡記錄錯誤數量只准減少；新檔案一律照新規則寫；鎖住 TypeScript 版本，避免升級時 strict 自動多出新檢查。</li>
<li>target 決定輸出的語法版本，例如把 <code>?.</code> 改寫成舊的寫法；lib 決定檢查器假設環境裡有哪些內建 API 的型別。兩者都不會補 polyfill：target 設得再舊，<code>includes</code> 也是原樣輸出。</li>
<li>型別在執行時不存在，所以 <code>as</code> 沒有任何保護。要在邊界用執行時的程式碼驗證：寫回傳 <code>x is T</code> 的型別守衛，或用 Zod 這類 schema 函式庫，從同一份 schema 同時得到驗證函式和型別。<code>JSON.parse</code> 的結果先當成 <code>unknown</code>，驗證通過才當成你的型別使用。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>不要開電腦，先寫下這幾個變數的型別：<code>const a = 'hi'</code>、<code>let b = a</code>、<code>const c = [a]</code>、<code>const d = { a }</code>、<code>const e = { a } as const</code>。再到 Playground 一一驗證。</li>
<li>在 Playground 寫一個有型別錯誤的檔案，打開右邊的 .JS 分頁。產生的 JavaScript 還在嗎？用你自己的話解釋為什麼。</li>
<li>寫出三段程式：一段「檢查器報錯但執行時沒事」，一段「檢查器沒報錯但執行時當掉」，一段「打開 noUncheckedIndexedAccess 之後，第二段就被抓到」。</li>
<li>打開你手上任何一個專案的 tsconfig（記得跟著 <code>extends</code> 往上找），把每個選項歸到「載入檔案」「檢查」「輸出」三組裡的其中一組。哪一個選項你分不出來？查官方的 TSConfig Reference 確認。</li>
<li>在一個你可以隨便改的專案裡跑 <code>npx tsc --noEmit --extendedDiagnostics</code>，記下 Check time，再加上 <code>--skipLibCheck</code> 跑一次。差多少？Lines of Library 是多少？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li><code>a</code> 是 <code>'hi'</code>；<code>b</code> 是 <code>string</code>（從 const 抄進 let 被放寬）；<code>c</code> 是 <code>string[]</code>（陣列元素放寬）；<code>d</code> 是 <code>{ a: string }</code>（屬性放寬）；<code>e</code> 是 <code>{ readonly a: 'hi' }</code>。</li>
<li>還在。型別擦除只需要語法樹，不需要檢查結果；tsc 和 Playground 預設都是「回報錯誤，照樣輸出」。只有開了 noEmitOnError 才會擋下輸出。</li>
<li>例如：一、<code>const el = document.querySelector('#score'); el.textContent = '0';</code>（頁面上真的有這個元素）。二、<code>const hand: number[] = []; hand[0].toFixed(0);</code>。三、同一段程式在檔案最上面加 <code>// @noUncheckedIndexedAccess: true</code>，<code>hand[0]</code> 就變成 <code>number | &#117;ndefined</code>，第二行被畫上紅線。</li>
<li>大部分都能分。容易分錯的是 <code>module</code>：它主要管輸出的 import 寫法，但也會影響預設的模組解析方式和檢查器允許的 import 語法；還有 <code>isolatedModules</code>，它是一個檢查，但目的是讓「只拿掉型別」的工具能正確輸出。</li>
<li>數字依專案大小差很多。小專案裡，Check time 常常大部分花在 lib 和 node_modules 的宣告檔上，所以 skipLibCheck 的效果很明顯；大專案裡，你自己的程式碼佔的比例會變大。Lines of Library 就是內建 API 宣告檔的行數，lib 裡加了 DOM 會多出好幾萬行。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>TypeScript Handbook</b>（<a href="https://www.typescriptlang.org/docs/handbook/intro.html">typescriptlang.org/docs/handbook</a>）：官方手冊，「Everyday Types」和「Narrowing」兩章跟這一系列最相關。</li>
<li><b>TSConfig Reference</b>（<a href="https://www.typescriptlang.org/tsconfig/">typescriptlang.org/tsconfig</a>）：每個 tsconfig 選項的官方說明和例子。看到不認得的選項，第一個查這裡。</li>
<li><b>Basarat Ali Syed《TypeScript Deep Dive》</b>（免費線上書）：後半有一整段講編譯器內部，掃描器、剖析器、繫結器、檢查器、輸出器一個一個拆，是本章第一節的延伸。</li>
<li><b>Dan Vanderkam《Effective TypeScript》</b>（O'Reilly）：用一條一條的建議講「怎麼把 TypeScript 用好」，型別推論、型別放寬、any 的擴散都有專章。</li>
<li><b>TypeScript Playground</b>（<a href="https://www.typescriptlang.org/play">typescriptlang.org/play</a>）：本章每個例子都可以貼進去，切換 TS Config 裡的選項，看紅線和 .JS 分頁怎麼變。</li>
</ul>
` });
