DEEP({ 'ts-functions': `
<p>上一課你學會了三件事：函式要寫型別、函式是一個值、回呼函式是交給別人晚點執行的紙條。這一章把函式整個拆開來看：它在記憶體裡長什麼樣子、呼叫的時候堆疊怎麼長高又縮回去、檢查器怎麼判斷「這個函式能不能放進那個位置」、多載和其餘參數到底在解決什麼問題。後半段會看到，「把函式交出去、等別人來叫」這個小動作，怎麼長成 Vue 和遊戲引擎的整套架構；最後是 <code>this</code> 的規則，和讓程式好測、好重播的純函式。</p>

<h3><span class="badge lv1">基礎</span>一、函式是一個值：盒子裡放的到底是什麼</h3>
<p>寫下 <code>const score = 0</code>，盒子裡放的是數字 0。寫下 <code>const hard = (a: number, b: number) =&gt; b &gt; a</code>，盒子裡放的是什麼？不是那一行文字，也不是結果，而是一個<b>函式物件</b>（function object）：JavaScript 在記憶體的堆積（heap）上做出一個物件，裡面記著「要跑的程式碼在哪裡」，外加幾個屬性。變數只是拿著一張寫著「物件在哪裡」的紙條，也就是一個參考（reference）。</p>
<figure class="figure"><svg viewBox="0 0 640 250" class="fg" style="width:100%;max-width:640px" role="img" aria-label="三個名字指向兩個函式物件：rules.easy 指向物件 A，rules.hard 和 isHigher 一起指向物件 B">
<text x="105" y="24" text-anchor="middle" class="fg-t lg">名字</text>
<text x="460" y="24" text-anchor="middle" class="fg-t lg">堆積上的函式物件</text>
<rect x="30" y="48" width="150" height="36" rx="6" class="fg-b alt"/><text x="105" y="71" text-anchor="middle" class="fg-t mono">rules.easy</text>
<rect x="30" y="112" width="150" height="36" rx="6" class="fg-b alt"/><text x="105" y="135" text-anchor="middle" class="fg-t mono">rules.hard</text>
<rect x="30" y="176" width="150" height="36" rx="6" class="fg-b alt"/><text x="105" y="199" text-anchor="middle" class="fg-t mono">isHigher</text>
<rect x="330" y="40" width="260" height="52" rx="6" class="fg-b"/>
<text x="346" y="61" class="fg-t">函式物件 A</text><text x="574" y="61" text-anchor="end" class="fg-t mono">b &gt;= a</text>
<text x="346" y="81" class="fg-t sm mono">name: 'easy'   length: 2</text>
<rect x="330" y="120" width="260" height="72" rx="6" class="fg-b hot"/>
<text x="346" y="142" class="fg-t acc">函式物件 B</text><text x="574" y="142" text-anchor="end" class="fg-t mono">b &gt; a</text>
<text x="346" y="162" class="fg-t sm mono">name: 'hard'   length: 2</text>
<text x="346" y="180" class="fg-t sm">還記著它出生時周圍的變數</text>
<line x1="180" y1="66" x2="322" y2="66" class="fg-l"/><polygon points="330,66 322,61.5 322,70.5" class="fg-a"/>
<line x1="180" y1="130" x2="322" y2="146" class="fg-l on"/><polygon points="330,146.9 322.5,141.5 321.5,150.5" class="fg-a on"/>
<line x1="180" y1="194" x2="322" y2="168" class="fg-l on"/><polygon points="330,166.5 320.8,163.5 322.4,172.3" class="fg-a on"/>
<text x="250" y="122" text-anchor="middle" class="fg-t sm">參考</text>
<text x="250" y="200" text-anchor="middle" class="fg-t sm acc">同一個參考</text>
<text x="320" y="236" text-anchor="middle" class="fg-t sm">isHigher === rules.hard 是 true：兩個名字，一個物件</text>
</svg><figcaption>變數拿的是「函式物件在哪裡」。<code>const isHigher = rules.hard</code> 沒有複製函式，只是多了一個名字指向同一個物件。</figcaption></figure>
<pre><code>const rules = {
  easy: (a: number, b: number) =&gt; b &gt;= a,
  hard: (a: number, b: number) =&gt; b &gt; a,
};
const isHigher = rules.hard;
console.log(isHigher === rules.hard);   // true
console.log(isHigher.name);             // hard
console.log(isHigher.length);           // 2</code></pre>
<p>注意 <code>isHigher.name</code> 印出來是 <code>hard</code>，不是 <code>isHigher</code>。名字是函式物件自己身上的屬性，在它被建立、第一次放進 <code>rules.hard</code> 的時候就定了；後來多一個變數指向它，不會改掉它的名字。<code>length</code> 則是「宣告了幾個必填參數」，有預設值的參數和其餘參數不算。這兩個屬性你平常用不到，但 stack trace 裡印出來的函式名稱，就是從 <code>name</code> 來的。匿名的回呼函式在錯誤訊息裡常常顯示成 <code>&lt;anonymous&gt;</code>，追 bug 時就很痛苦，這是「重要的回呼取個名字」的實際理由。</p>
<h4>兩種寫法的差別：提升</h4>
<p>用 <code>function</code> 關鍵字宣告的函式，會在整段程式開始跑之前就準備好，所以寫在檔案下面、上面也能呼叫，這叫<b>提升</b>（hoisting）。用 <code>const</code> 加箭頭函式寫的，是一個普通變數，要跑到那一行才有值，在那之前碰它會當掉，TypeScript 也會先擋下來：</p>
<pre><code>console.log(draw());        // 可以：function 宣告會整個提升
function draw(): number { return 7; }

console.log(shuffle());     // 錯誤：宣告之前不能用
const shuffle = (): number[] =&gt; [];</code></pre>
<p>實務上的影響是檔案的閱讀順序。很多團隊喜歡把「主要流程」寫在檔案最上面，輔助函式用 <code>function</code> 放在下面，讀的人一打開就看到重點。全部寫成 <code>const</code> 箭頭函式的話，就得先定義、後使用，主要流程會被擠到最下面。兩種都可以，同一個專案裡統一就好。</p>

<h3><span class="badge lv1">基礎</span>二、參數和引數：空格和填進去的東西</h3>
<p>這兩個詞很多人混著用，面試時分清楚會加分。<b>參數</b>（parameter）是定義函式時寫在括號裡的名字，像表格上印好的欄位「姓名：＿＿」；<b>引數</b>（argument）是呼叫時真正填進去的值，像你寫上去的「王小明」。<code>function addPoints(score: number, points = 1)</code> 裡的 <code>score</code>、<code>points</code> 是參數；<code>addPoints(5, 3)</code> 裡的 <code>5</code>、<code>3</code> 是引數。</p>
<p>呼叫的那一刻，JavaScript 會把每個引數的值「複製」進對應的參數格子裡。數字、字串、boolean 複製的就是值本身；物件和陣列複製的是那張「物件在哪裡」的紙條，物件本身不會被複製。這種傳法有個名字叫 call by sharing，口語上常被說成「物件是傳參考」，但要小心，它跟 C++ 的傳參考不一樣：</p>
<pre><code>type Score = { points: number };

function bump(s: Score, n: number): void {
  n = n + 1;          // 只改到自己這一格
  s.points += 1;      // 改到大家共用的那個物件
  s = { points: 0 };  // 只是讓自己的 s 指向別處
}

const score: Score = { points: 3 };
let n = 5;
bump(score, n);
console.log(score.points, n);   // 4 5</code></pre>
<figure class="figure"><svg viewBox="0 0 640 300" class="fg" style="width:100%;max-width:640px" role="img" aria-label="呼叫 bump 時，n 的值 5 被複製一份到 bump 自己的格子；score 的參考被複製，兩個參考指向堆積上同一個物件">
<rect x="20" y="24" width="260" height="104" rx="8" class="fg-b alt"/>
<text x="34" y="44" class="fg-t sm alt">呼叫者的區塊</text>
<rect x="34" y="54" width="232" height="28" rx="4" class="fg-b"/><text x="46" y="73" class="fg-t mono">n = 5</text><text x="254" y="73" text-anchor="end" class="fg-t sm">一直是 5</text>
<rect x="34" y="90" width="232" height="28" rx="4" class="fg-b"/><text x="46" y="109" class="fg-t mono">score</text><circle cx="250" cy="104" r="4" class="fg-lamp on"/>
<line x1="150" y1="128" x2="150" y2="164" class="fg-l dash"/><polygon points="150,172 145.5,164 154.5,164" class="fg-a"/>
<text x="160" y="154" class="fg-t sm">bump(score, n)：複製兩個值</text>
<rect x="20" y="172" width="260" height="104" rx="8" class="fg-b hot"/>
<text x="34" y="192" class="fg-t sm acc">bump 的區塊</text>
<rect x="34" y="202" width="232" height="28" rx="4" class="fg-b"/><text x="46" y="221" class="fg-t mono">n = 6</text><text x="254" y="221" text-anchor="end" class="fg-t sm">改的是自己這格</text>
<rect x="34" y="238" width="232" height="28" rx="4" class="fg-b"/><text x="46" y="257" class="fg-t mono">s</text><circle cx="250" cy="252" r="4" class="fg-lamp on"/>
<rect x="400" y="110" width="210" height="80" rx="8" class="fg-b warm"/>
<text x="505" y="100" text-anchor="middle" class="fg-t sm">堆積上的物件（只有一個）</text>
<text x="505" y="146" text-anchor="middle" class="fg-t mono lg">points: 4</text>
<text x="505" y="170" text-anchor="middle" class="fg-t sm">原本是 3，透過 s 改掉了</text>
<path d="M254 104 H330 V138 H392" class="fg-l on"/><polygon points="400,138 392,133.5 392,142.5" class="fg-a on"/>
<path d="M254 252 H330 V162 H392" class="fg-l on"/><polygon points="400,162 392,157.5 392,166.5" class="fg-a on"/>
<text x="338" y="96" class="fg-t sm acc">參考</text>
<text x="338" y="270" class="fg-t sm acc">複製來的參考</text>
</svg><figcaption>數字被複製後各改各的；參考被複製後，兩張紙條寫著同一個地址，所以透過哪一張去改，大家都看得到。把 <code>s</code> 指向新物件，只是換掉 bump 自己那張紙條。</figcaption></figure>
<p>這張圖解釋了你在 Vue 裡一定遇過的兩件事。第一，把 <code>props</code> 裡的物件傳給函式，函式裡改了它的欄位，父元件的資料也跟著變了，Vue 會在開發模式警告你不要直接改 props，但那只管最外層，深層的欄位它抓不到。第二，<code>const</code> 擋不住這件事：<code>const score</code> 只保證 <code>score</code> 這張紙條不會換成別的地址，不保證地址裡的物件不會被改。想表達「這個函式不會改你的物件」，參數型別可以寫成 <code>Readonly&lt;Score&gt;</code>，檢查器就會擋住 <code>s.points += 1</code>。</p>

<h3><span class="badge lv2">進階</span>三、呼叫堆疊：一次點擊裡的五次呼叫</h3>
<p>之前講 CPU 的那一章說過，每呼叫一次函式，CPU 就在<b>呼叫堆疊</b>（call stack）上疊一個區塊（stack frame），裡面放「做完要回去哪裡」和這次呼叫的參數、區域變數；函式一 <code>return</code>，區塊就拿掉。JavaScript 引擎做的是同一件事。用猜高低的一次點擊實際走一遍：</p>
<pre><code>function checkGuess(current: number, next: number): boolean {
  return next &gt; current;
}
function addPoints(score: number, points = 1): number {
  return score + points;
}
function playRound(score: number): number {
  const right = checkGuess(7, 11);
  return right ? addPoints(score, 1) : score;
}
function onClick(): void {
  console.log(playRound(7));   // 8
}
onClick();</code></pre>
<figure class="figure"><svg viewBox="0 0 670 190" class="fg" style="width:100%;max-width:670px" role="img" aria-label="七個時間點的呼叫堆疊高度：onClick、playRound、checkGuess 依序疊上，checkGuess 回傳後換 addPoints 疊上，最後逐一拿掉">
<text x="70" y="92" text-anchor="middle" class="fg-t sm">點擊</text>
<text x="158" y="58" text-anchor="middle" class="fg-t sm">呼叫</text>
<text x="246" y="24" text-anchor="middle" class="fg-t sm warm">呼叫，最深 3 層</text>
<text x="334" y="58" text-anchor="middle" class="fg-t sm acc">回傳 true</text>
<text x="422" y="24" text-anchor="middle" class="fg-t sm">呼叫</text>
<text x="510" y="58" text-anchor="middle" class="fg-t sm acc">回傳 8</text>
<text x="598" y="92" text-anchor="middle" class="fg-t sm acc">印出 8</text>
<rect x="30" y="100" width="80" height="30" rx="5" class="fg-b hot"/><text x="70" y="120" text-anchor="middle" class="fg-t sm mono">onClick</text>
<rect x="118" y="100" width="80" height="30" rx="5" class="fg-b"/><text x="158" y="120" text-anchor="middle" class="fg-t sm mono">onClick</text>
<rect x="118" y="66" width="80" height="30" rx="5" class="fg-b hot"/><text x="158" y="86" text-anchor="middle" class="fg-t sm mono">playRound</text>
<rect x="206" y="100" width="80" height="30" rx="5" class="fg-b"/><text x="246" y="120" text-anchor="middle" class="fg-t sm mono">onClick</text>
<rect x="206" y="66" width="80" height="30" rx="5" class="fg-b"/><text x="246" y="86" text-anchor="middle" class="fg-t sm mono">playRound</text>
<rect x="206" y="32" width="80" height="30" rx="5" class="fg-b hot"/><text x="246" y="52" text-anchor="middle" class="fg-t sm mono">checkGuess</text>
<rect x="294" y="100" width="80" height="30" rx="5" class="fg-b"/><text x="334" y="120" text-anchor="middle" class="fg-t sm mono">onClick</text>
<rect x="294" y="66" width="80" height="30" rx="5" class="fg-b hot"/><text x="334" y="86" text-anchor="middle" class="fg-t sm mono">playRound</text>
<rect x="382" y="100" width="80" height="30" rx="5" class="fg-b"/><text x="422" y="120" text-anchor="middle" class="fg-t sm mono">onClick</text>
<rect x="382" y="66" width="80" height="30" rx="5" class="fg-b"/><text x="422" y="86" text-anchor="middle" class="fg-t sm mono">playRound</text>
<rect x="382" y="32" width="80" height="30" rx="5" class="fg-b hot"/><text x="422" y="52" text-anchor="middle" class="fg-t sm mono">addPoints</text>
<rect x="470" y="100" width="80" height="30" rx="5" class="fg-b"/><text x="510" y="120" text-anchor="middle" class="fg-t sm mono">onClick</text>
<rect x="470" y="66" width="80" height="30" rx="5" class="fg-b hot"/><text x="510" y="86" text-anchor="middle" class="fg-t sm mono">playRound</text>
<rect x="558" y="100" width="80" height="30" rx="5" class="fg-b hot"/><text x="598" y="120" text-anchor="middle" class="fg-t sm mono">onClick</text>
<line x1="20" y1="140" x2="642" y2="140" class="fg-l dim"/><polygon points="650,140 642,135.5 642,144.5" class="fg-a"/>
<text x="70" y="160" text-anchor="middle" class="fg-t sm">1</text><text x="158" y="160" text-anchor="middle" class="fg-t sm">2</text><text x="246" y="160" text-anchor="middle" class="fg-t sm">3</text><text x="334" y="160" text-anchor="middle" class="fg-t sm">4</text><text x="422" y="160" text-anchor="middle" class="fg-t sm">5</text><text x="510" y="160" text-anchor="middle" class="fg-t sm">6</text><text x="598" y="160" text-anchor="middle" class="fg-t sm">7</text>
<text x="30" y="180" class="fg-t sm">時間</text>
</svg><figcaption>綠色是「現在正在跑」的那一層。任何時刻只有最上面那一層在動，下面的都在等它 return。</figcaption></figure>
<ol>
<li>第 1 步：點擊事件叫了 <code>onClick</code>，堆疊上一層。</li>
<li>第 2 步：<code>onClick</code> 叫 <code>playRound(7)</code>，疊上第二層，裡面的 <code>score</code> 是 7。</li>
<li>第 3 步：<code>playRound</code> 叫 <code>checkGuess(7, 11)</code>，第三層，<code>current</code> 是 7、<code>next</code> 是 11。</li>
<li>第 4 步：<code>checkGuess</code> 回傳 <code>true</code>，它那一層拿掉，<code>true</code> 被放進 <code>playRound</code> 的 <code>right</code>。</li>
<li>第 5 步：<code>playRound</code> 叫 <code>addPoints(7, 1)</code>，又疊上一層。注意它用的是第 3 步剛空出來的位置。</li>
<li>第 6、7 步：<code>addPoints</code> 回傳 8，<code>playRound</code> 回傳 8，<code>onClick</code> 印出 8，堆疊清空。</li>
</ol>
<p>出錯時印出來的 stack trace，就是「出事那一刻」堆疊的快照，從最上面那層往下列：</p>
<pre><code>Error: card missing
    at checkGuess (game.ts:2:9)
    at playRound (game.ts:8:17)
    at onClick (game.ts:12:15)</code></pre>
<p>讀法是從上往下：錯誤發生在 <code>checkGuess</code>，它是被 <code>playRound</code> 第 8 行叫的，<code>playRound</code> 又是被 <code>onClick</code> 叫的。真正的原因常常不在第一行，而在第二、三行「傳了什麼東西進去」。</p>
<p>堆疊的大小是固定的。遞迴沒寫終止條件，每一層都再疊一層，疊到上限就是「Maximum call stack size exceeded」。上限跟每一層用了多少空間有關，在 Chrome 和 Node.js 裡，簡單的遞迴大約幾千到一萬多層就到頂了。所以處理很深的樹狀資料（例如巢狀很深的 JSON、很長的鏈結串列）時，用迴圈加自己的陣列當堆疊，會比遞迴安全。</p>

<h3><span class="badge lv2">進階</span>四、函式型別：檢查器怎麼判斷「這個函式放得進去」</h3>
<p>上一課寫過 <code>type Rule = (current: number, next: number) =&gt; boolean</code>。每次你把一個函式交給一個寫著函式型別的位置，檢查器都要回答一個問題：這個函式，能不能安全地被當成那個型別來用？它看三件事：參數個數、參數型別、回傳型別。規則可以用「誰會呼叫它」來想：呼叫的人只會照型別上寫的方式呼叫，所以你的函式必須「接得住」那種呼叫，而且交回的東西必須「讓呼叫的人用得下去」。</p>
<pre><code>type Card = { rank: number; suit: string };
type FaceCard = Card &amp; { face: 'J' | 'Q' | 'K' };
type OnCard = (c: Card) =&gt; void;

// 參數收得更寬：可以
const logRank: OnCard = (c: { rank: number }) =&gt; {};
// 參數要求更多：不行
const logFace: OnCard = (c: FaceCard) =&gt; {};   // 錯誤
// 參數比較少：可以
const ignore: OnCard = () =&gt; {};

type MakeCard = () =&gt; Card;
// 回傳更具體：可以
const king: MakeCard = (): FaceCard =&gt;
  ({ rank: 13, suit: 'spades', face: 'K' });
// 回傳少了 suit：不行
const blank: MakeCard = () =&gt; ({ rank: 1 });   // 錯誤</code></pre>
<figure class="figure"><svg viewBox="0 0 660 250" class="fg" style="width:100%;max-width:660px" role="img" aria-label="兩組由大到小的方框：參數那一組，函式收比 Card 更寬的型別可以，只收 FaceCard 不行；回傳那一組，交回 FaceCard 可以，交回比 Card 更寬的型別不行">
<text x="160" y="24" text-anchor="middle" class="fg-t lg">參數：可以收得更寬</text>
<rect x="20" y="40" width="280" height="190" rx="8" class="fg-b hot"/>
<text x="34" y="60" class="fg-t sm mono">{ rank: number }</text><text x="286" y="60" text-anchor="end" class="fg-t sm acc">✓ 收這麼寬可以</text>
<rect x="36" y="72" width="248" height="144" rx="8" class="fg-b alt"/>
<text x="50" y="92" class="fg-t mono">Card</text><text x="270" y="92" text-anchor="end" class="fg-t sm">型別要求的參數</text>
<rect x="52" y="106" width="216" height="94" rx="8" class="fg-b warm"/>
<text x="66" y="126" class="fg-t mono">FaceCard</text><text x="254" y="126" text-anchor="end" class="fg-t sm warm">✗ 只收這麼窄</text>
<text x="160" y="156" text-anchor="middle" class="fg-t sm">呼叫的人可能交一張 A</text>
<text x="160" y="176" text-anchor="middle" class="fg-t sm">只認人頭牌的函式就壞了</text>
<text x="500" y="24" text-anchor="middle" class="fg-t lg">回傳：可以給得更具體</text>
<rect x="360" y="40" width="280" height="190" rx="8" class="fg-b warm"/>
<text x="374" y="60" class="fg-t sm mono">{ rank: number }</text><text x="626" y="60" text-anchor="end" class="fg-t sm warm">✗ 交這麼寬不行</text>
<rect x="376" y="72" width="248" height="144" rx="8" class="fg-b alt"/>
<text x="390" y="92" class="fg-t mono">Card</text><text x="610" y="92" text-anchor="end" class="fg-t sm">型別要求的回傳</text>
<rect x="392" y="106" width="216" height="94" rx="8" class="fg-b hot"/>
<text x="406" y="126" class="fg-t mono">FaceCard</text><text x="594" y="126" text-anchor="end" class="fg-t sm acc">✓ 交人頭牌可以</text>
<text x="500" y="156" text-anchor="middle" class="fg-t sm">呼叫的人只會讀 rank、suit</text>
<text x="500" y="176" text-anchor="middle" class="fg-t sm">多一個 face 不礙事</text>
</svg><figcaption>參數和回傳的方向剛好相反：參數只能往外放寬（逆變，contravariance），回傳只能往內收窄（共變，covariance）。兩邊都是為了同一件事：呼叫的人照型別使用，不會出事。</figcaption></figure>
<p>用一句生活化的話記：你要找一個獸醫來看「任何動物」，來一個什麼動物都會看的醫生沒問題，來一個只會看貓的就不行，這是參數；你訂了「一隻寵物」，送來一隻貓沒問題，送來「某種生物」就不行，這是回傳。參數比較少則永遠安全：<code>ignore</code> 不理會牌，呼叫的人多傳一張牌給它，它不用就好。</p>
<h4>兩個例外，面試很愛考</h4>
<p><b>第一個例外：回傳 void 的函式型別，其實收任何回傳值。</b></p>
<pre><code>const seen: number[] = [];
// push 回傳 number，這裡被當成 void：可以
[7, 12, 3].forEach(n =&gt; seen.push(n));

function reset(): void {
  return 0;   // 錯誤：自己宣告 void，就不准回傳值
}</code></pre>
<p><code>forEach</code> 的回呼型別寫的是 <code>=&gt; void</code>，意思是「我不會用你的回傳值」，而不是「你不准回傳」。如果這裡也要求回傳 <code>&#117;ndefined</code>，<code>n =&gt; seen.push(n)</code> 這種再自然不過的寫法就全部要改，所以檢查器刻意放行。但你自己宣告 <code>function reset(): void</code> 時，就是在說這個函式什麼都不回傳，回傳 0 就是錯誤。</p>
<p><b>第二個例外：方法寫法的參數檢查比較鬆。</b><code>strict</code> 裡的 <code>strictFunctionTypes</code> 會照上面的規則嚴格檢查參數，但只對「屬性寫成函式型別」的寫法有效；寫成方法的，為了相容大量既有的程式碼（尤其是 DOM 的型別），參數檢查是雙向都放行的（bivariance）：</p>
<pre><code>type Card = { rank: number; suit: string };
type FaceCard = Card &amp; { face: 'J' | 'Q' | 'K' };

interface ButtonA { onPress(c: Card): void }      // 方法
interface ButtonB { onPress: (c: Card) =&gt; void }  // 屬性

const pressFace = (c: FaceCard) =&gt; console.log(c.face);
const a: ButtonA = { onPress: pressFace };   // 放行：有洞
const b: ButtonB = { onPress: pressFace };   // 錯誤</code></pre>
<p>實務建議：自己定義「要別人傳回呼進來」的介面時，用屬性寫法 <code>onPress: (c: Card) =&gt; void</code>，讓檢查器幫你把關。</p>

<h3><span class="badge lv2">進階</span>五、可選、預設、其餘參數：細節都在「什麼時候算沒傳」</h3>
<p>上一課講了 <code>points = 1</code> 和 <code>title?</code>。這裡補三個你遲早會踩到的細節：</p>
<pre><code>function deal(count = 5, hand: number[] = []): number[] {
  hand.push(count);
  return hand;
}
deal();            // [5]
deal();            // [5]：又是一個新的陣列
deal(&#117;ndefined);   // [5]：等於沒傳
deal(null);        // 錯誤：null 不觸發預設值</code></pre>
<ol>
<li><b>預設值每次呼叫都重新算。</b>如果你寫過 Python，會知道它的預設值只算一次，預設 <code>[]</code> 會被每次呼叫共用，是經典 bug。JavaScript 不會：每次沒傳 <code>hand</code>，就做一個新的空陣列。代價是預設值如果是很貴的運算，每次都會付一次。</li>
<li><b>只有 <code>&#117;ndefined</code> 會觸發預設值，<code>null</code> 不會。</b>沒有型別檢查的話，<code>deal(null)</code> 會讓 <code>count</code> 變成 <code>null</code>，<code>hand.push(null)</code> 照樣成功，錯誤悄悄進到資料裡。這在後端送來 <code>null</code> 的時候最常發生，下一課會再細講。</li>
<li><b>預設值可以用前面的參數。</b><code>function range(from: number, to = from + 10)</code> 是合法的，因為參數由左到右一個一個設定。反過來用後面的參數就不行。</li>
</ol>
<p>從外面看，<code>count = 5</code> 和 <code>count?: number</code> 一樣，都是「可以不傳」，滑鼠移上去看函式的型別，會顯示成 <code>count?: number</code>。差別只在函式裡面：有預設值的，裡面一定是 <code>number</code>；只有問號的，裡面是 <code>number | &#117;ndefined</code>，用之前得先檢查。能給預設值就給，函式本體會乾淨很多。</p>
<h4>其餘參數和展開：「不知道有幾個」</h4>
<pre><code>function total(...scores: number[]): number {
  return scores.reduce((sum, s) =&gt; sum + s, 0);
}
total();            // 0
total(3, 5, 8);     // 16
const hand = [7, 12, 3];
total(...hand);     // 22：展開陣列，變成三個引數

function pair(a: number, b: number) { return a + b; }
pair(...hand);   // 錯誤：長度不確定

type Guess = 'higher' | 'lower';
type Round = [guess: Guess, bet: number];
function logRound(...args: Round): void {
  const [guess, bet] = args;
  console.log(guess, bet);
}
logRound('higher', 10);
logRound('higher');   // 錯誤：元組規定要兩個</code></pre>
<p><b>其餘參數</b>（rest parameter）寫成 <code>...scores: number[]</code>，把「剩下的所有引數」收成一個真正的陣列，型別一定是陣列或元組，而且只能放在最後一個。呼叫端的 <code>...hand</code> 是反過來的動作，叫<b>展開</b>（spread）：把陣列拆成一個一個引數。<code>pair(...hand)</code> 會被擋，是因為 <code>number[]</code> 可能有 0 個、也可能有 100 個，檢查器沒辦法保證剛好兩個；如果 <code>hand</code> 的型別是 <code>[number, number]</code> 這種元組就可以。</p>
<p>最後一段的 <code>...args: Round</code> 看起來繞，<code>Round</code> 是一個每格都有名字的元組，但它是很多函式庫型別的基礎：先把「一串參數」當成一個元組型別，就可以把它存起來、傳下去、原封不動地交給另一個函式。第七節的 <code>once</code> 和 <code>debounce</code> 就是靠這招，才能包住任何函式而不弄丟參數型別。</p>
<p>舊程式碼裡還會看到一個叫 <code>arguments</code> 的東西，它是函式裡自動出現、長得像陣列但不是陣列的物件。箭頭函式沒有它，TypeScript 也很難替它寫型別。新程式碼一律用其餘參數。</p>

<h3><span class="badge lv3">專業</span>六、多載：同一個名字，幾種呼叫方式</h3>
<p>有時候一個函式的「回傳型別」要看「你怎麼呼叫它」。抽一張牌，拿到一張牌或什麼都沒有；抽三張，拿到一個陣列。用一個聯集當回傳型別的話，呼叫的人每次都得自己判斷拿到的是哪一種，很煩。<b>多載</b>（overload）就是讓你把幾種呼叫方式分別寫出來：</p>
<pre><code>type Card = { rank: number; suit: string };
const pile: Card[] = [];

function draw(): Card | &#117;ndefined;
function draw(count: number): Card[];
function draw(count?: number): Card | Card[] | &#117;ndefined {
  if (count === &#117;ndefined) return pile.pop();
  return pile.splice(0, count);
}

const one = draw();       // Card | &#117;ndefined
const three = draw(3);    // Card[]

function drawSome(n: number | &#117;ndefined) {
  return draw(n);   // 錯誤：沒有一個多載收聯集
}</code></pre>
<p>前兩行沒有本體的叫<b>多載簽章</b>（overload signature），是給外面看的；最後那個有本體的叫<b>實作簽章</b>（implementation signature），外面看不到，它必須寬到能涵蓋所有多載。檢查器遇到呼叫時，從上往下一個一個試，第一個對得上的就用它，所以比較具體的要寫在前面。</p>
<p>最後一段是多載最常見的陷阱：<code>n</code> 可能是數字也可能是 <code>&#117;ndefined</code>，你覺得兩個多載加起來剛好都涵蓋了，但檢查器一次只拿一個多載來比，不會幫你「合起來」。這時要嘛自己先判斷再分開呼叫，要嘛多寫一個收 <code>number | &#117;ndefined</code> 的多載。</p>
<h4>什麼時候不該用多載</h4>
<p>判斷方法很簡單：如果幾種呼叫方式的回傳型別都一樣，只是參數不同，就用可選參數或聯集，不要多載。TypeScript 官方手冊的建議也是這樣：能用聯集就用聯集。多載每多一個，讀的人和檢查器都多一份負擔，錯誤訊息也會變得難懂（它只會告訴你「最後一個多載」為什麼對不上）。</p>
<p>你每天其實都在用別人寫好的多載。DOM 的型別裡，<code>createElement</code> 和 <code>addEventListener</code> 都用多載，搭配一張「名字對型別」的對照表：</p>
<pre><code>// HTMLCanvasElement
const canvas = document.createElement('canvas');
// HTMLElement
const box = document.createElement('my-box');
// e 是 KeyboardEvent
document.addEventListener('keydown', e =&gt; {
  console.log(e.key);
});</code></pre>
<p>你傳 <code>'keydown'</code>，檢查器就去 <code>DocumentEventMap</code> 這張表查到 <code>KeyboardEvent</code>，再用上下文型別填給 <code>e</code>。打錯成 <code>'keydwon'</code>，就會掉到最寬的那個多載，<code>e</code> 變成普通的 <code>Event</code>，<code>e.key</code> 立刻變紅。紅線出現在 <code>e.key</code>，但真正的錯在事件名稱，這是讀多載錯誤訊息時要有的直覺。</p>

<h3><span class="badge lv3">專業</span>七、高階函式與回呼：事件驅動是怎麼長出來的</h3>
<p>收函式當參數、或回傳一個函式的函式，叫<b>高階函式</b>（higher-order function）。<code>map</code>、<code>filter</code> 是收函式的；下面兩個是回傳函式的，它們是前端和遊戲裡最常自己手寫的兩個工具：</p>
<pre><code>function once&lt;A extends unknown[], R&gt;(
  fn: (...args: A) =&gt; R,
): (...args: A) =&gt; R | &#117;ndefined {
  let done = false;
  return (...args: A) =&gt; {
    if (done) return &#117;ndefined;
    done = true;
    return fn(...args);
  };
}

const startGame = once((level: number) =&gt; {
  console.log('start level', level);
  return level;
});
startGame(1);    // start level 1
startGame(2);    // 沒反應，回傳 &#117;ndefined

function debounce&lt;A extends unknown[]&gt;(
  fn: (...args: A) =&gt; void,
  ms: number,
): (...args: A) =&gt; void {
  let timer: ReturnType&lt;typeof setTimeout&gt; | &#117;ndefined;
  return (...args: A) =&gt; {
    clearTimeout(timer);
    timer = setTimeout(() =&gt; fn(...args), ms);
  };
}

const saveBest = debounce((best: number) =&gt; {
  console.log('save', best);
}, 300);
saveBest(10);
saveBest(11);
saveBest(12);   // 300 毫秒後只印一次：save 12</code></pre>
<p>這兩個函式的型別值得慢慢讀。<code>A extends unknown[]</code> 是「某一串參數」，<code>R</code> 是「某種回傳值」，兩個都由檢查器從你傳進去的函式推論出來。所以 <code>startGame</code> 的型別自動變成 <code>(level: number) =&gt; number | &#117;ndefined</code>，你傳字串進去會被擋。這就是第五節說的「把參數當成元組」的威力：包了一層，型別一個都沒弄丟。<code>done</code> 和 <code>timer</code> 則是閉包，下一個模組講閉包的那一課會細講它們為什麼能一直活著。</p>
<h4>從「我叫你」到「你叫我」</h4>
<p>平常寫程式是「我叫你」：<code>playRound</code> 叫 <code>checkGuess</code>，叫完拿到答案繼續做。回呼把方向反過來：你把函式交出去，然後就不管了，由別人決定什麼時候叫、叫幾次。這叫<b>控制反轉</b>（inversion of control），有個好記的別名叫「好萊塢原則」：別打給我們，我們會打給你。</p>
<p>瀏覽器、Node.js、遊戲引擎全都是這樣運作的。它們的核心是一個<b>事件迴圈</b>（event loop）：</p>
<figure class="figure"><svg viewBox="0 0 660 270" class="fg" style="width:100%;max-width:660px" role="img" aria-label="你的程式把回呼登記給瀏覽器或引擎，時候到了回呼被放進工作佇列，呼叫堆疊清空之後，事件迴圈從佇列拿出一個回呼來執行">
<rect x="20" y="30" width="180" height="86" rx="8" class="fg-b alt"/>
<text x="110" y="52" text-anchor="middle" class="fg-t alt">你的程式</text>
<text x="110" y="76" text-anchor="middle" class="fg-t sm mono">setTimeout(fn, 1000)</text>
<text x="110" y="98" text-anchor="middle" class="fg-t sm mono">addEventListener(…)</text>
<rect x="260" y="30" width="180" height="86" rx="8" class="fg-b"/>
<text x="350" y="52" text-anchor="middle" class="fg-t">瀏覽器／引擎</text>
<text x="350" y="76" text-anchor="middle" class="fg-t sm">計時器、點擊、下一格畫面</text>
<text x="350" y="98" text-anchor="middle" class="fg-t sm">時候到了才通知</text>
<line x1="200" y1="78" x2="252" y2="78" class="fg-l on"/><polygon points="260,78 252,73.5 252,82.5" class="fg-a on"/>
<text x="230" y="68" text-anchor="middle" class="fg-t sm acc">① 登記</text>
<rect x="20" y="172" width="420" height="58" rx="8" class="fg-b"/>
<text x="30" y="162" class="fg-t sm">工作佇列（task queue）</text>
<rect x="36" y="184" width="120" height="34" rx="5" class="fg-b hot"/><text x="96" y="205" text-anchor="middle" class="fg-t sm mono">fn（計時器）</text>
<rect x="166" y="184" width="120" height="34" rx="5" class="fg-b"/><text x="226" y="205" text-anchor="middle" class="fg-t sm mono">onClick</text>
<rect x="296" y="184" width="120" height="34" rx="5" class="fg-b"/><text x="356" y="205" text-anchor="middle" class="fg-t sm">……</text>
<line x1="350" y1="116" x2="350" y2="164" class="fg-l"/><polygon points="350,172 345.5,164 354.5,164" class="fg-a"/>
<text x="360" y="146" class="fg-t sm">② 時候到了，排隊</text>
<rect x="480" y="20" width="160" height="230" rx="8" class="fg-b alt"/>
<text x="560" y="42" text-anchor="middle" class="fg-t alt">呼叫堆疊</text>
<text x="560" y="62" text-anchor="middle" class="fg-t sm">一次只跑一件事</text>
<rect x="495" y="160" width="130" height="32" rx="5" class="fg-b"/><text x="560" y="181" text-anchor="middle" class="fg-t sm mono">showNextCard</text>
<rect x="495" y="198" width="130" height="32" rx="5" class="fg-b hot"/><text x="560" y="219" text-anchor="middle" class="fg-t sm mono">fn</text>
<path d="M96 218 V246 H460 V214 H487" class="fg-l on"/><polygon points="495,214 487,209.5 487,218.5" class="fg-a on"/>
<text x="300" y="262" text-anchor="middle" class="fg-t sm acc">③ 堆疊清空之後，事件迴圈才從佇列拿下一個來跑</text>
</svg><figcaption>回呼不會「插隊」。不管計時器多準，只要堆疊上還有程式在跑，佇列裡的回呼就得等。這就是一段很慢的同步程式會讓整個畫面卡住的原因。</figcaption></figure>
<p>這張圖解釋了一個很多人想不通的現象：<code>setTimeout</code> 的回呼裡丟出來的錯，外面的 <code>try</code> 抓不到。</p>
<pre><code>try {
  setTimeout(() =&gt; {
    throw new Error('card missing');
  }, 0);
} catch (e) {
  console.log('抓到了嗎？');   // 永遠不會印
}</code></pre>
<p>回呼真正執行的時候，是從佇列被拿出來、放在一個全新的空堆疊上跑的，原本包著它的 <code>try</code> 那一層早就 return 掉了，所以錯誤一路往下找不到任何 <code>catch</code>，變成未處理的錯誤。要嘛把 <code>try</code> 寫進回呼裡面，要嘛改用 Promise 和 <code>async</code>／<code>await</code>，讓錯誤沿著 Promise 傳回來，這是後面講 Promise 那一課的主題。</p>
<h4>Vue 和遊戲引擎：一整套「你叫我」</h4>
<p>Vue 的響應式系統，本質上就是一張「誰用了哪個值」的登記簿，登記的內容全是函式。<code>computed</code> 的 getter、<code>watch</code> 的回呼、元件的 render，都是你交出去的函式，值一變，Vue 把相關的函式排進佇列，在下一個時機一起重跑：</p>
<pre><code>// 寫在 &lt;script setup&gt; 裡
import { ref, watch, onMounted, onUnmounted } from 'vue';

const score = ref(0);
// Vue 決定什麼時候叫這個回呼
watch(score, (next, prev) =&gt; console.log(prev, '-&gt;', next));
onMounted(() =&gt; window.addEventListener('keydown', onKey));
onUnmounted(() =&gt; window.removeEventListener('keydown', onKey));

function onKey(e: KeyboardEvent): void {
  if (e.key === 'ArrowUp') score.value += 1;
}</code></pre>
<p>遊戲引擎更徹底。Cocos Creator 的元件裡，你從來不寫「主迴圈」：引擎每一格畫面呼叫一次每個元件的 <code>update(dt)</code>，元件載入時呼叫 <code>onLoad</code>，銷毀時呼叫 <code>onDestroy</code>。你寫的整個元件，就是一組交給引擎的回呼：</p>
<pre><code>import { _decorator, Component, Node } from 'cc';
const { ccclass } = _decorator;

@ccclass('CardSpinner')
export class CardSpinner extends Component {
  private turns = 0;

  onLoad() {
    // 交出回呼，外加要當 this 的物件
    this.node.on(Node.EventType.TOUCH_END, this.onTap, this);
    // 每 1 秒叫一次 tick
    this.schedule(this.tick, 1);
  }
  // 引擎每一格畫面叫一次
  update(dt: number) {
    this.node.angle += 90 * dt;
  }
  // 交出去的，要記得收回
  onDestroy() {
    this.node.off(Node.EventType.TOUCH_END, this.onTap, this);
    this.unschedule(this.tick);
  }
  private onTap(): void { this.turns += 1; }
  private tick(): void { console.log('turns', this.turns); }
}</code></pre>
<p>「交出去的要收回」是回呼世界的第一條紀律。登記簿會一直拿著你的函式，函式又透過閉包或 <code>this</code> 拿著整個元件，所以忘了 <code>off</code>，元件明明銷毀了，記憶體卻一直放不掉，事件來了還會對著已經不在的節點做事，這是遊戲和單頁應用程式裡最常見的記憶體洩漏。Vue 在 <code>setup</code> 裡同步建立的 <code>watch</code>，元件卸載時會自動停掉；但如果你在 <code>setTimeout</code> 或 <code>await</code> 之後才建立，就得自己保存它回傳的停止函式，在適當的時候呼叫。</p>

<h3><span class="badge lv4">專家</span>八、this 的規則（預告）：看「怎麼被呼叫」，不看「寫在哪裡」</h3>
<p>閉包那一課會完整講 <code>this</code>。這裡先把整套規則放在一張圖上，因為它跟「函式是值」直接相關：同一個函式物件，換一種方式呼叫，<code>this</code> 就不一樣。</p>
<figure class="figure"><svg viewBox="0 0 660 370" class="fg" style="width:100%;max-width:660px" role="img" aria-label="判斷 this 的流程：先看是不是箭頭函式，再看是不是用 new 呼叫，再看有沒有用 call、apply、bind，再看是不是寫成 obj.f()，都不是就是 &#117;ndefined">
<rect x="30" y="16" width="250" height="40" rx="6" class="fg-b alt"/><text x="155" y="41" text-anchor="middle" class="fg-t">1 是箭頭函式嗎？</text>
<rect x="390" y="16" width="250" height="40" rx="6" class="fg-b hot"/><text x="515" y="41" text-anchor="middle" class="fg-t">用外面那一層的 this</text>
<line x1="280" y1="36" x2="382" y2="36" class="fg-l on"/><polygon points="390,36 382,31.5 382,40.5" class="fg-a on"/><text x="335" y="29" text-anchor="middle" class="fg-t sm acc">是</text>
<rect x="30" y="92" width="250" height="40" rx="6" class="fg-b alt"/><text x="155" y="117" text-anchor="middle" class="fg-t">2 用 new 呼叫？</text>
<rect x="390" y="92" width="250" height="40" rx="6" class="fg-b hot"/><text x="515" y="117" text-anchor="middle" class="fg-t">剛做出來的新物件</text>
<line x1="280" y1="112" x2="382" y2="112" class="fg-l on"/><polygon points="390,112 382,107.5 382,116.5" class="fg-a on"/><text x="335" y="105" text-anchor="middle" class="fg-t sm acc">是</text>
<rect x="30" y="168" width="250" height="40" rx="6" class="fg-b alt"/><text x="155" y="193" text-anchor="middle" class="fg-t">3 用 call／apply／bind？</text>
<rect x="390" y="168" width="250" height="40" rx="6" class="fg-b hot"/><text x="515" y="193" text-anchor="middle" class="fg-t">你指定的那個物件</text>
<line x1="280" y1="188" x2="382" y2="188" class="fg-l on"/><polygon points="390,188 382,183.5 382,192.5" class="fg-a on"/><text x="335" y="181" text-anchor="middle" class="fg-t sm acc">是</text>
<rect x="30" y="244" width="250" height="40" rx="6" class="fg-b alt"/><text x="155" y="269" text-anchor="middle" class="fg-t">4 寫成 obj.f() 呼叫？</text>
<rect x="390" y="244" width="250" height="40" rx="6" class="fg-b hot"/><text x="515" y="269" text-anchor="middle" class="fg-t">點號左邊的 obj</text>
<line x1="280" y1="264" x2="382" y2="264" class="fg-l on"/><polygon points="390,264 382,259.5 382,268.5" class="fg-a on"/><text x="335" y="257" text-anchor="middle" class="fg-t sm acc">是</text>
<line x1="155" y1="56" x2="155" y2="84" class="fg-l"/><polygon points="155,92 150.5,84 159.5,84" class="fg-a"/><text x="167" y="78" class="fg-t sm">否</text>
<line x1="155" y1="132" x2="155" y2="160" class="fg-l"/><polygon points="155,168 150.5,160 159.5,160" class="fg-a"/><text x="167" y="154" class="fg-t sm">否</text>
<line x1="155" y1="208" x2="155" y2="236" class="fg-l"/><polygon points="155,244 150.5,236 159.5,236" class="fg-a"/><text x="167" y="230" class="fg-t sm">否</text>
<line x1="155" y1="284" x2="155" y2="312" class="fg-l warm"/><polygon points="155,320 150.5,312 159.5,312" class="fg-a warm"/><text x="167" y="306" class="fg-t sm warm">否</text>
<rect x="30" y="320" width="250" height="40" rx="6" class="fg-b warm"/><text x="155" y="345" text-anchor="middle" class="fg-t warm">this 是 &#117;ndefined</text>
<text x="515" y="345" text-anchor="middle" class="fg-t sm">模組和 class 裡都是嚴格模式</text>
</svg><figcaption>由上往下問，第一個「是」就是答案。箭頭函式最優先，因為它根本沒有自己的 <code>this</code>，其他規則對它都無效。</figcaption></figure>
<p>最常出事的是第 4 條「失效」的時候：<code>obj.f()</code> 有點號，所以 <code>this</code> 是 <code>obj</code>；但 <code>const f = obj.f; f()</code>，或把 <code>obj.f</code> 當回呼交出去，呼叫的那一刻就沒有點號了，一路掉到最後一格。TypeScript 預設不會警告你，但你可以替方法加一個假的第一個參數 <code>this</code>，把它變成檢查器看得懂的規則：</p>
<pre><code>class Game {
  score = 0;
  addPoint(this: Game): void {
    this.score += 1;
  }
}
const game = new Game();
game.addPoint();              // 規則 4：this 是 game
const loose = game.addPoint;
loose();                      // 錯誤：this 是 void
const bound = game.addPoint.bind(game);
bound();                      // 規則 3：bind 把 this 釘死</code></pre>
<p><code>this: Game</code> 不是真的參數，編譯後會消失，它只是告訴檢查器「呼叫我的時候，this 必須是 Game」。<code>strict</code> 裡的 <code>noImplicitThis</code> 則會在一般函式裡用到推論不出型別的 <code>this</code> 時報錯，兩個一起用，能擋掉一大半這類 bug。</p>
<h4>bind 的隱藏成本：拿不掉的監聽器</h4>
<pre><code>class Hud {
  hits = 0;
  onHit(): void { this.hits += 1; }
  start(): void {
    window.addEventListener('click', this.onHit.bind(this));
  }
  stop(): void {
    // 拿不掉：bind 每次都做一個新函式
    window.removeEventListener('click', this.onHit.bind(this));
  }
}</code></pre>
<p><code>bind</code> 每呼叫一次就做一個全新的函式物件。<code>removeEventListener</code> 是用「是不是同一個物件」來找要移除的監聽器，第二次 bind 出來的是另一個物件，當然找不到，監聽器就永遠留在那裡，檢查器完全看不出來。解法是只做一次、存起來：<code>private readonly handleHit = () =&gt; this.onHit();</code>，加和移除都用 <code>this.handleHit</code>。Cocos 的 <code>node.on(type, this.onTap, this)</code> 把 <code>this</code> 當成第三個參數分開傳，正是為了避開這個問題：函式還是原本那一個，<code>off</code> 時用同樣三個參數就對得上。</p>

<h3><span class="badge lv4">專家</span>九、純函式與副作用：把「會變的」趕到邊邊</h3>
<p><b>純函式</b>（pure function）有兩個條件：同樣的輸入，永遠得到同樣的輸出；而且除了回傳值，不改外面任何東西。改外面的東西，或結果會受外面影響的，叫做有<b>副作用</b>（side effect）：改全域變數、改傳進來的物件、讀 <code>Math.random()</code> 或 <code>Date.now()</code>、碰畫面、送網路請求、寫 log。上一課的 <code>checkGuess</code> 是純的；<code>deck.draw()</code> 會把牌從牌堆拿走，不是純的。</p>
<p>副作用不是壞東西，程式不改畫面、不存檔就沒用了。重點是放在哪裡。一個在業界很常見的架構叫「函式核心、命令式外殼」（functional core, imperative shell）：</p>
<figure class="figure"><svg viewBox="0 0 640 220" class="fg" style="width:100%;max-width:640px" role="img" aria-label="外殼有副作用，負責點擊、亂數、時間的輸入，以及更新畫面、存檔、送出分數的輸出；中間的核心全是純函式，只收值、只交回值">
<rect x="20" y="20" width="600" height="180" rx="10" class="fg-b warm"/>
<text x="36" y="42" class="fg-t warm">外殼：有副作用，越薄越好</text>
<rect x="210" y="58" width="220" height="118" rx="8" class="fg-b hot"/>
<text x="320" y="82" text-anchor="middle" class="fg-t acc">核心：純函式</text>
<text x="320" y="106" text-anchor="middle" class="fg-t sm mono">checkGuess()</text>
<text x="320" y="126" text-anchor="middle" class="fg-t sm mono">nextState()</text>
<text x="320" y="146" text-anchor="middle" class="fg-t sm mono">scoreFor()</text>
<text x="320" y="166" text-anchor="middle" class="fg-t sm">只收值、只交回值</text>
<text x="40" y="96" class="fg-t sm">使用者點擊</text>
<text x="40" y="118" class="fg-t sm mono">Math.random()</text>
<text x="40" y="140" class="fg-t sm mono">Date.now()</text>
<line x1="150" y1="118" x2="202" y2="118" class="fg-l on"/><polygon points="210,118 202,113.5 202,122.5" class="fg-a on"/>
<text x="176" y="108" text-anchor="middle" class="fg-t sm acc">輸入</text>
<line x1="430" y1="118" x2="482" y2="118" class="fg-l on"/><polygon points="490,118 482,113.5 482,122.5" class="fg-a on"/>
<text x="456" y="108" text-anchor="middle" class="fg-t sm acc">新狀態</text>
<text x="500" y="96" class="fg-t sm">更新畫面</text>
<text x="500" y="118" class="fg-t sm">寫進存檔</text>
<text x="500" y="140" class="fg-t sm">送出分數</text>
</svg><figcaption>遊戲規則全部放進中間的純函式，亂數、時間、畫面、網路留在外殼。中間那塊可以用幾百個測試蓋滿，不需要瀏覽器、不需要引擎。</figcaption></figure>
<pre><code>type State = { score: number; current: number; over: boolean };
type Guess = 'higher' | 'lower';

// 核心：純函式，同樣輸入永遠同樣輸出
function nextState(
  s: Readonly&lt;State&gt;, guess: Guess, next: number,
): State {
  const right = guess === 'higher'
    ? next &gt; s.current
    : next &lt; s.current;
  return right
    ? { score: s.score + 1, current: next, over: false }
    : { ...s, current: next, over: true };
}

// 外殼：亂數和畫面都在這裡
function onGuess(s: State, guess: Guess): State {
  const next = Math.floor(Math.random() * 13) + 1;
  const after = nextState(s, guess, next);
  console.log(after.over ? 'over' : after.score);
  return after;
}</code></pre>
<p>追一次：<code>nextState({ score: 2, current: 7, over: false }, 'higher', 11)</code>，11 大於 7，猜對，回傳 <code>{ score: 3, current: 11, over: false }</code>。不管你在什麼時候、哪台機器、跑第幾次，答案都一樣。這帶來四個很實際的好處：</p>
<ul>
<li><b>好測</b>：測試只要準備輸入、比對輸出，不用假造畫面或計時器。</li>
<li><b>可以重播</b>：把每一局的「輸入序列」（每次猜什麼、抽到哪張牌）記下來，就能在別台機器一模一樣地重跑一遍。遊戲的錄影重播、多人遊戲的確定性同步（lockstep）、伺服器重算客戶端的結果防作弊，都建立在這件事上。要做到這點，亂數也必須從外面傳進來，而不是在核心裡偷偷呼叫 <code>Math.random()</code>。</li>
<li><b>可以快取</b>：同樣輸入同樣輸出，算過一次就能記住答案，這叫 memoization。Vue 的 <code>computed</code> 就是這樣：依賴的值沒變，就直接回傳上次的結果。也因此 Vue 的文件明說 computed 的 getter 不該有副作用，在裡面改別的狀態或發請求，快取一跳過，副作用就跟著消失或重複。</li>
<li><b>可以平行</b>：不碰共用狀態，就不會互相踩到，放到 Web Worker 或另一條執行緒去跑也安全。</li>
</ul>
<h4>效能：函式也是要花錢的物件</h4>
<p>既然每個函式都是堆積上的物件，每次執行到一個箭頭函式的運算式，就會做出一個新的函式物件。在一般的按鈕處理裡這完全不重要；但在每秒跑 60 次的 <code>update</code> 裡，每一格都替幾百個物件 <code>filter(e =&gt; e.alive)</code>、再 <code>map</code> 出新陣列，就是每秒好幾萬個短命的物件，垃圾回收（garbage collection）遲早要停下來收，畫面就會掉格。遊戲裡的熱路徑（每一格都跑的程式），常見的做法是把回呼提到外面只做一次、用一般的 <code>for</code> 迴圈、重複使用同一個陣列。至於「函式呼叫本身很慢」，在現代引擎裡大多不是問題：V8 會把小而常被呼叫的函式直接內聯（inline）到呼叫者裡。先量測，再最佳化。</p>
<p>最後一個冷知識：ES2015 規格裡有「尾端呼叫最佳化」（proper tail calls），讓「最後一步是呼叫自己」的遞迴不會一直疊堆疊。但主流引擎裡只有 Safari 的 JavaScriptCore 實作了，V8（Chrome、Node.js）沒有，所以在 JavaScript 裡不要指望靠它避免 stack overflow。</p>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>JavaScript 的物件是傳參考</td><td>永遠是傳值，只是物件的「值」是一個參考。在函式裡改欄位，外面看得到；把參數指向新物件，外面看不到。</td></tr>
<tr><td><code>const</code> 宣告的物件不能改</td><td><code>const</code> 只鎖住變數這張紙條，不鎖物件本身。要防止被改，用 <code>Readonly&lt;T&gt;</code> 或 <code>Object.freeze</code>。</td></tr>
<tr><td>參數多寫幾個比較安全</td><td>反過來：回呼要求的參數比呼叫的人會傳的多才是錯誤；收得少永遠安全。</td></tr>
<tr><td>回傳型別是 <code>void</code> 的回呼不能回傳東西</td><td>函式型別的 <code>=&gt; void</code> 只是說「我不會用你的回傳值」。自己宣告 <code>function f(): void</code> 才是真的不准回傳。</td></tr>
<tr><td>傳 <code>null</code> 會用到預設值</td><td>只有 <code>&#117;ndefined</code> 會觸發預設值，<code>null</code> 會被原樣收下。</td></tr>
<tr><td>try/catch 可以包住裡面所有回呼的錯</td><td>它只包得住「現在」這個堆疊。回呼晚點在新的堆疊上跑，錯誤不會回到原本的 try。</td></tr>
<tr><td><code>this</code> 是寫在哪個類別裡就指向誰</td><td>一般函式和方法的 <code>this</code> 看呼叫方式決定；只有箭頭函式是看寫在哪裡。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>Vue</b>：<code>computed</code>、<code>watch</code>、生命週期鉤子、<code>emit</code> 出去的事件，全是「交出函式等人來叫」。範本裡 <code>@click="onGuess"</code> 傳函式本身，<code>@click="onGuess('higher')"</code> 會被編譯器包成一個新的小函式。computed 裡只算不改，副作用放 watch 或事件處理。</li>
<li><b>Cocos Creator、Unity</b>：生命週期方法（<code>onLoad</code>、<code>start</code>、<code>update</code>、<code>onDestroy</code>，Unity 是 <code>Awake</code>、<code>Start</code>、<code>Update</code>）都是引擎呼叫你。<code>on</code> 一定配 <code>off</code>，<code>schedule</code> 一定想好什麼時候 <code>unschedule</code>。<code>update</code> 裡少做臨時的函式和陣列。</li>
<li><b>Node.js 後端</b>：Express 的 <code>app.use</code> 收的中介軟體 <code>(req, res, next) =&gt; …</code>，就是一串交給框架、輪流被呼叫的函式；一段同步的重運算會卡住整個事件迴圈，所有使用者一起等。</li>
<li><b>Go</b>：函式一樣是值，<code>http.HandleFunc("/", handler)</code> 傳的就是函式；Go 沒有 <code>this</code> 的問題，因為方法的接收者是寫在宣告裡、呼叫時就綁定的。</li>
<li><b>除錯</b>：stack trace 從上往下讀，原因常在第二、三行。重要的回呼取個名字，trace 才不會一整排 <code>&lt;anonymous&gt;</code>。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<p>下面是前端、遊戲和全端面試裡常見的題目。先自己講一遍，再看參考答案。</p>
<ol>
<li>「參數和引數有什麼不同？JavaScript 是傳值還是傳參考？」</li>
<li>「說明 JavaScript 的 <code>this</code> 怎麼決定。箭頭函式有什麼不同？舉一個你遇過的 bug。」</li>
<li>「手寫一個 <code>debounce</code>，並說明它跟 <code>throttle</code> 的差別。」</li>
<li>「為什麼 <code>setTimeout</code> 回呼裡丟出的錯，外面的 try/catch 抓不到？」</li>
<li>「TypeScript 的函式多載什麼時候用？什麼時候該用聯集或泛型取代？」</li>
<li>「什麼是純函式？在前端或遊戲裡，它帶來什麼實際好處？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>參數是函式定義裡的名字，引數是呼叫時傳進去的實際值。JavaScript 一律傳值：基本型別複製值本身；物件複製的是參考，所以在函式裡改物件的欄位，呼叫者看得到，但把參數重新指向另一個物件，呼叫者看不到。這叫 call by sharing，跟 C++ 的傳參考不同。</li>
<li>依序判斷：箭頭函式沒有自己的 <code>this</code>，用外層的；用 <code>new</code> 呼叫時是新建的物件；用 <code>call</code>、<code>apply</code>、<code>bind</code> 時是指定的物件；寫成 <code>obj.f()</code> 時是 <code>obj</code>；都不是時，在嚴格模式下是 <code>&#117;ndefined</code>。典型 bug 是把類別的方法當回呼傳給計時器或事件，呼叫時沒有點號，<code>this</code> 變成 <code>&#117;ndefined</code>。解法是用箭頭函式包起來、用箭頭函式欄位，或傳入 this 參數（例如 Cocos 的 <code>node.on</code> 第三個參數）。</li>
<li>debounce 回傳一個包裝函式，每次被呼叫就清掉上一個計時器、重新計時，只有停下來超過指定時間才真正執行，適合搜尋框輸入、視窗縮放結束後才做事。throttle 是固定間隔內最多執行一次，適合捲動、拖曳這種要持續回饋的事件。寫型別時用 <code>A extends unknown[]</code> 保留原函式的參數型別（程式碼見第七節）。</li>
<li>回呼是在計時器到期後，由事件迴圈從佇列取出、在一個新的空堆疊上執行的。那時原本包著 <code>setTimeout</code> 的 try 區塊早已執行完畢、從堆疊上移除，例外往下找不到任何 catch。解法是在回呼內部 try/catch，或改用 Promise／async，讓錯誤沿著 Promise 鏈傳遞。</li>
<li>當回傳型別取決於參數的形狀或個數，而且呼叫方式只有少數幾種時用多載，例如不帶參數回傳一個、帶數量回傳陣列。如果回傳型別都一樣，用可選參數或聯集；如果回傳型別跟某個參數的型別有規律的對應，用泛型或對照表（像 DOM 的 <code>HTMLElementTagNameMap</code>）。要記得多載不會合併：傳一個聯集型別的引數，必須有一個多載單獨就能接受它。</li>
<li>純函式對同樣輸入永遠回傳同樣結果，而且沒有副作用。好處是容易單元測試、可以快取（Vue 的 computed 就靠這個）、可以重播和確定性同步（記下輸入就能重算整局），也可以安全地平行執行。實務上把規則放在純函式核心，把 I/O、亂數、時間、畫面放在外層。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>不要跑，先預測：<code>function f(arr: number[]) { arr.push(4); arr = [9]; arr.push(5); }</code>，<code>const a = [1, 2, 3]; f(a);</code> 之後 <code>a</code> 是什麼？</li>
<li>已知 <code>type H = (e: MouseEvent) =&gt; void;</code>，下面哪幾行能通過檢查？<br>（a）<code>const a: H = () =&gt; {};</code><br>（b）<code>const b: H = (e: Event) =&gt; {};</code><br>（c）<code>const c: H = (e: MouseEvent, extra: number) =&gt; {};</code><br>（d）<code>const d: H = e =&gt; 42;</code></li>
<li>一個類別裡寫了 <code>start() { setTimeout(this.tick, 1000); }</code>，<code>tick</code> 裡用了 <code>this.count</code>。說出會發生什麼事，並寫出三種不同的修法。</li>
<li>替 <code>throttle</code> 寫出完整的型別簽章與實作：在 <code>ms</code> 毫秒內最多執行一次，參數型別要跟原函式一樣。</li>
<li>把第六節的 <code>draw</code> 多載改寫，讓 <code>drawSome(n: number | &#117;ndefined)</code> 能通過檢查。至少給兩種做法。</li>
<li>把你專案裡一段「同時算規則又改畫面」的函式，拆成一個純函式加一個外殼。寫下純函式的三個測試案例（輸入和預期輸出）。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li><code>[1, 2, 3, 4]</code>。<code>push(4)</code> 透過複製來的參考改到共用的陣列；<code>arr = [9]</code> 只是讓函式自己的參數指向新陣列，之後的 <code>push(5)</code> 改的是那個新陣列，外面看不到。</li>
<li>（a）可以，參數少是安全的。（b）可以，<code>Event</code> 比 <code>MouseEvent</code> 寬，收得更寬沒問題。（c）不行，要求一個呼叫的人不會傳的參數。（d）可以，函式型別的 <code>=&gt; void</code> 不管你回傳什麼。</li>
<li><code>this.tick</code> 被當成值交出去，計時器呼叫時沒有點號，<code>this</code> 是 <code>&#117;ndefined</code>，讀 <code>this.count</code> 當掉。修法：（1）<code>setTimeout(() =&gt; this.tick(), 1000)</code>；（2）把 <code>tick</code> 寫成箭頭函式欄位 <code>tick = () =&gt; { … }</code>；（3）<code>setTimeout(this.tick.bind(this), 1000)</code>。另外可以在 <code>tick(this: MyClass)</code> 加上 this 參數，讓檢查器以後就擋下這種寫法。</li>
<li><pre><code>function throttle&lt;A extends unknown[]&gt;(
  fn: (...args: A) =&gt; void,
  ms: number,
): (...args: A) =&gt; void {
  let last = -Infinity;
  return (...args: A) =&gt; {
    const now = Date.now();
    if (now - last &lt; ms) return;
    last = now;
    fn(...args);
  };
}</code></pre>這個版本會丟掉間隔內的呼叫。進階版本會在間隔結束時補跑最後一次，常見函式庫（例如 lodash）兩種行為都提供選項。</li>
<li>做法一：呼叫前先判斷，<code>return n === &#117;ndefined ? draw() : draw(n);</code>，每個分支各自對上一個多載。做法二：多加一個多載 <code>function draw(count: number | &#117;ndefined): Card | Card[] | &#117;ndefined;</code>，放在前兩個後面。做法三：乾脆拆成兩個函式 <code>drawOne()</code> 和 <code>drawMany(n)</code>，名字本身就說清楚了，常常是最好讀的。</li>
<li>沒有標準答案。檢查標準：純函式的參數裡包含它需要的一切（包括亂數或時間，從外面傳進來）；它不讀不寫任何全域變數、不碰 DOM 或節點；三個測試都只需要「呼叫、比對回傳值」。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>TypeScript Handbook：More on Functions</b>（<a href="https://www.typescriptlang.org/docs/handbook/2/functions.html">typescriptlang.org</a>）：官方手冊的函式章節，多載、this 參數、void 的規則都在這裡，也有「能用聯集就別用多載」的建議。</li>
<li><b>MDN：this</b>（<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this">developer.mozilla.org</a>）：this 每一種情況的完整說明，附很多小例子。</li>
<li><b>Philip Roberts〈What the heck is the event loop anyway?〉</b>（JSConf EU 2014，YouTube）：二十多分鐘，用動畫把呼叫堆疊、佇列、回呼講到你忘不掉。</li>
<li><b>Kyle Simpson《You Don't Know JS》</b>：第一版的《this &amp; Object Prototypes》和《Scope &amp; Closures》兩冊，把 this 和閉包講得最透徹，GitHub 上可以免費讀。</li>
<li><b>Gary Bernhardt〈Boundaries〉</b>：一場經典演講，「函式核心、命令式外殼」這個說法就是從他這裡流行起來的。</li>
</ul>
` });
