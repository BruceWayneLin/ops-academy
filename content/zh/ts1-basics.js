MZ({
  id: 'ts1',
  title: '值與型別',
  time: '1 到 2 週',
  blurb: 'TypeScript 在 JavaScript 上多加了什麼，以及每天都會用到的型別：單一的值、一群值、聯集、函式，還有造成大部分當機的「值不見了」。這一系列後面的每一課，都建立在這裡。',
  lessons: [
  {
    id: 'ts-values',
    title: '變數、值和型別：TypeScript 多了什麼',
    body: `
<p>程式這一輩子都在做兩件事：把值存起來，再把值傳來傳去。分數、玩家的名字、遊戲結束了沒，都是值。JavaScript 讓你把任何值放到任何地方。寫十行的時候，這種自由很舒服；寫到一萬行，就很痛苦了。因為像「把文字放到該放數字的地方」這種錯，要等程式真的跑起來才會冒出來，而且常常是在使用者面前冒出來。</p>
<p><b>TypeScript</b> 就是 JavaScript 再多加一樣東西：你可以幫每個值貼上它的<b>型別</b>（type），也就是「這是哪一種值」。有一個叫<b>型別檢查器</b>（type checker）的程式，會在任何東西執行之前先把這些標籤讀過一遍，告訴你哪裡對不上。檢查完，標籤就被拿掉，剩下的就是普通的 JavaScript。</p>
<div class="flow"><span class="box">game.ts<small>JavaScript 加上型別標籤</small></span><span class="arr">&rarr;</span><span class="box hot">型別檢查器<small>tsc，或是你的編輯器</small></span><span class="arr">&rarr;</span><span class="box">game.js<small>標籤擦掉了</small></span><span class="arr">&rarr;</span><span class="box">瀏覽器<small>只跑 JavaScript</small></span></div>
<p>這一系列的每一課，都請把這張圖放在心上。瀏覽器從來看不到型別。型別只存在於你寫程式和建置的時候。它就像文書軟體裡的拼字檢查：打字的時候很有用，印出來的紙上就沒有了。</p>
<h3>變數就是貼了標籤的盒子</h3>
<p><b>變數</b>（variable）是一個有名字的盒子，裡面放著一個<b>值</b>（value）。在 TypeScript 裡，盒子上還多貼了一張標籤，寫著裡面可以放什麼。</p>
<pre><code>let score: number = 0;       // a box named score, for numbers
let player: string = 'Ada';  // a box for text
let gameOver: boolean = false;

score = 1;        // fine: a number
score = 'one';    // error: a string does not fit</code></pre>
<p>冒號後面那一段 <code>: number</code>，就是<b>型別註記</b>（type annotation），也就是盒子上的標籤。把所有的註記都刪掉，這個檔案又是合法的 JavaScript，而檢查器輸出的正是這個樣子。</p>
<h3>三種基本型別</h3>
<table>
<tr><th>型別</th><th>放的是</th><th>例子</th></tr>
<tr><td><code>string</code></td><td>文字</td><td><code>'Ada'</code>、<code>'7 of hearts'</code></td></tr>
<tr><td><code>number</code></td><td>平常用的任何數字：整數、小數、負數</td><td><code>0</code>、<code>7</code>、<code>-2.5</code></td></tr>
<tr><td><code>boolean</code></td><td>是或否</td><td><code>true</code>、<code>false</code></td></tr>
</table>
<p>平常用的數字只有一種型別。整數和小數都是 <code>number</code>，所以 <code>7</code> 和 <code>7.5</code> 放的是同一種盒子。</p>
<h3>const 還是 let</h3>
<p>建立盒子用 <code>const</code> 或 <code>let</code>。</p>
<ul>
<li><code>const</code>：第一個值放進去之後，盒子就封起來了。之後不能再換別的值進去。</li>
<li><code>let</code>：盒子可以倒空再重新裝，只是要裝同一種型別的值。</li>
</ul>
<pre><code>const maxRounds = 10;
let round = 1;
round = round + 1;   // fine
maxRounds = 11;      // error: cannot assign to a constant</code></pre>
<p>預設用 <code>const</code>，值真的會變的時候才用 <code>let</code>。舊的程式碼裡你還會看到 <code>var</code>。那是比較舊的寫法，規則很容易把人搞混。新的程式碼不要用它。</p>
<h3>型別推論：檢查器會看第一個值</h3>
<p>你不必每個盒子都貼標籤。建立變數的時候如果就放了值，檢查器會從這個值推算出型別。這叫<b>型別推論</b>（type inference）。</p>
<pre><code>let score = 0;        // inferred: number
let player = 'Ada';   // inferred: string
const best = 10;      // inferred: 10, this exact number
score = 'ten';        // still an error: score holds numbers</code></pre>
<p>看一下 <code>best</code>。<code>const</code> 永遠不會變，所以檢查器給它最窄的型別：就是 <code>10</code> 這個值本身，而不是隨便一個數字。這個細節在講聯集型別的那一課會派上用場。</p>
<p>那什麼時候該自己寫註記？</p>
<ul>
<li>變數一開始就有值的時候，<b>不用寫</b>。推論出來的型別一樣，程式碼還比較短。</li>
<li>變數一開始是空的（<code>let nextCard: number;</code>）、函式的參數（講函式的那一課會講），還有你想用標籤把意圖講清楚的時候，<b>要寫</b>。</li>
</ul>
<h3>檢查器什麼時候、怎麼告訴你</h3>
<p>檢查器會在兩個地方跑。</p>
<div class="flow"><span class="box">你在打字<small>在 VS Code 裡</small></span><span class="arr">&rarr;</span><span class="box hot">紅色底線<small>一秒內出現</small></span><span class="arr">&rarr;</span><span class="box">你在建置<small>tsc 或 vue-tsc</small></span><span class="arr">&rarr;</span><span class="box bad">錯誤清單<small>建置可能在這裡停下</small></span></div>
<p>在編輯器裡，同一個檢查器會趁你打字的時候在背景跑，把每個錯都畫上底線。滑鼠移到底線上，就看得到訊息。建置（build）的時候，<code>tsc</code>（Vue 專案則是 <code>vue-tsc</code>）會把每個錯誤印出來，附上檔案、行、欄，還有錯誤編號：</p>
<pre><code>game.ts:6:1 - error TS2322: Type 'string' is not assignable to type 'number'.</code></pre>
<p>這一行的意思是：在 game.ts 的第 6 行第 1 欄，你想把一個字串放進標著 number 的盒子。「is not assignable to」（不能指派給）是你最常看到的一句話，意思永遠都是「這個值跟那張標籤對不上」。</p>
<div class="warn">有兩件事幾乎每個人都會嚇一跳。第一，就算有錯，<code>tsc</code> 預設還是會照樣產生 .js 檔。第二，Vite 的開發伺服器只會把型別拿掉，完全不檢查，所以頁面上就算有型別錯誤也照樣能跑。真正保護你的，是那條紅色底線，還有建置流程裡的型別檢查。不要忽略它們。</div>
<h3>嚴格模式</h3>
<p>檢查器有一個總開關叫 <code>strict</code>，也就是嚴格模式（strict mode），設定在專案檔 <code>tsconfig.json</code> 裡。大部分的新專案都會打開它。它打開的檢查裡，有兩個從第一天起就很重要：</p>
<table>
<tr><th>檢查</th><th>沒開 strict</th><th>開了 strict</th></tr>
<tr><td><code>noImplicitAny</code></td><td>沒寫型別的參數，會悄悄變成 <code>any</code>，意思是「什麼都行，不要檢查」</td><td>錯誤：你一定要說清楚參數是什麼</td></tr>
<tr><td><code>strictNullChecks</code></td><td><code>null</code> 和 <code>&#117;ndefined</code> 放得進任何盒子</td><td>標籤上有寫，盒子才收它們</td></tr>
</table>
<p>沒開 strict 的話，TypeScript 檢查的東西比你想像的少很多。如果你加入一個專案，發現型別錯誤少得奇怪，就打開 <code>tsconfig.json</code>，找找看有沒有 <code>"strict": true</code>。</p>
<h3>深入一點：型別是承諾，不是執行時的檢查</h3>
<p>因為標籤會被擦掉，程式在跑的時候，沒有任何東西會檢查它們。如果伺服器送來 <code>{"score": "12"}</code>，而你的程式碼說分數是數字，TypeScript 不會發現。它相信了你的標籤。型別描述的，是你「承諾」資料長什麼樣子。資料從外面進來的地方（伺服器、local storage、使用者的輸入），先用一般的程式碼檢查過，再相信它。</p>
<p><code>any</code> 也是一樣。型別是 <code>any</code> 的值，會把檢查器對這個值的檢查整個關掉，而且這個破洞會擴散：從它讀出來的任何東西，也都是 <code>any</code>。你真的不知道型別的時候，比較安全的標籤是 <code>unknown</code>，它會逼你在使用之前先檢查這個值。</p>
<h3>和 Vue 比較</h3>
<p>在 .vue 檔裡，<code>&lt;script setup lang="ts"&gt;</code> 是在告訴 Vue 的編譯器：這一段是 TypeScript。沒有 <code>lang="ts"</code> 的話，第一個型別註記就是語法錯誤。在裡面，推論的方式完全一樣：</p>
<pre><code>&lt;script setup lang="ts"&gt;
import { ref } from 'vue';
const score = ref(0);   // a Ref holding a number
score.value = 'ten';    // error, as before
&lt;/script&gt;</code></pre>
<p>編輯器的擴充套件（Vue - Official）和 <code>vue-tsc</code>，都是用同一個 TypeScript 檢查器來檢查你的 .vue 檔。這一系列講的每一件事，在 <code>&lt;script setup lang="ts"&gt;</code> 裡面都適用。</p>`,
    tryNote: '把每一段貼到 TypeScript Playground（https://www.typescriptlang.org/play）。錯誤會畫成紅色底線。滑鼠移到名字上，就看得到它的型別。右邊的 .JS 分頁會顯示產生出來的 JavaScript。',
    try: [
      'score 被畫上底線：字串不能指派給 number 型別。型別推論依照第一個值，幫盒子貼好了標籤。',
      '滑鼠分別移到兩個名字上。best 的型別是 10，current 的型別是 number。',
      '打開 .JS 分頁：還是同樣兩行，只是註記全都不見了。',
      '開著 strict（Playground 預設就是開的），n 會被畫底線，因為它的型別被隱含地當成 any。改成 n: number，錯誤就消失了。'
    ],
    own: `打開你自己某個專案裡的 TypeScript 檔，或是一個有 <code>&lt;script setup lang="ts"&gt;</code> 的 .vue 檔。把滑鼠移到五個變數上，記下編輯器顯示的型別。每一個都想想看：推論出來的型別既然已經一樣，這個註記能不能拿掉？接著打開 <code>tsconfig.json</code>，看看 <code>strict</code> 有沒有打開。它也可能設定在 <code>extends</code> 那一行指到的另一個檔案裡。`,
    quiz: [
      { q: "建置 TypeScript 專案之後，瀏覽器拿到的是什麼？",
        a: ["就是 .ts 檔，由瀏覽器來檢查型別", "普通的 JavaScript，型別標籤都拿掉了", "型別檢查器做出來的二進位檔", "JavaScript 再加上一個型別檔，在執行時拿來檢查"],
        why: "型別在程式執行之前檢查，檢查完就擦掉。瀏覽器從頭到尾只跑 JavaScript。" },
      { q: "<code>let round = 1</code>，TypeScript 會推論出什麼型別？",
        a: ["any", "1", "沒有型別，因為沒寫註記", "number"],
        why: "let 之後可能會變，所以檢查器把它放寬成 number。同樣的值如果用 const，型別就會是 1。" },
      { q: "你的程式碼有型別錯誤，你用 Vite 的開發伺服器打開頁面。會發生什麼事？",
        a: ["頁面照樣能跑，因為 Vite 只把型別拿掉，不做檢查", "頁面拒絕載入", "Vite 幫你把錯誤修好", "瀏覽器顯示型別錯誤"],
        why: "Vite 只負責拿掉型別。檢查發生在編輯器和建置步驟（tsc 或 vue-tsc），所以不要忽略紅色底線。" }
    ]
  },
  {
    id: 'ts-collections',
    title: '陣列、物件、元組和 Record',
    body: `
<p>一個盒子放一個值。但真正的程式要放很多值：一副牌裡的每一張、一位玩家的各項資料、每個玩過的人的最佳分數。TypeScript 給你四種「一群值」的形狀，每一種都畫得成一張圖。</p>
<h3>陣列：一排有編號的盒子</h3>
<p><b>陣列</b>（array）是一排盒子，每一格都放同一種型別。盒子從 0 開始編號，這個編號就是<b>索引</b>（index）。</p>
<div class="flow"><span class="box">7<small>[0]</small></span><span class="box">12<small>[1]</small></span><span class="box">3<small>[2]</small></span><span class="box hot">9<small>[3]</small></span><span class="arr">&larr; 四個盒子，最後一個索引是 3</span></div>
<pre><code>const hand: number[] = [7, 12, 3, 9];
hand[0];          // 7, the first card
hand.length;      // 4
hand.push(5);     // fine: a number
hand.push('K');   // error: a string is not a number</code></pre>
<p>型別寫成 <code>number[]</code>，讀作「數字的陣列」。你也會看到 <code>Array&lt;number&gt;</code>，意思完全一樣；那對尖括號是什麼，講泛型的那一課會解釋。如果陣列一開始就有值，推論會幫你算出型別：<code>const hand = [7, 12, 3]</code> 本來就是 <code>number[]</code>。</p>
<p>只有空陣列要自己貼標籤，因為裡面沒有東西可以讓檢查器看：<code>const discards: number[] = [];</code></p>
<h3>物件：有名字的欄位</h3>
<p><b>物件</b>（object）把屬於同一件事的值放在一起，而且每個值是用名字來找，不是用編號。每一個有名字的欄位，叫做<b>屬性</b>（property）。可以想成一張表格，每一欄都有標題。</p>
<div class="tiers"><b>Card</b><div><span class="box">rank<small>number</small></span><span class="box">suit<small>string</small></span><span class="box">faceUp<small>boolean</small></span></div></div>
<pre><code>type Card = {
  rank: number;     // 1 to 13
  suit: string;
  faceUp: boolean;
};

const current: Card = { rank: 7, suit: 'hearts', faceUp: true };
current.rank;     // 7
current.colour;   // error: colour does not exist on Card</code></pre>
<p><code>type Card = { ... }</code> 幫這個形狀取了名字，這樣就能重複使用。這叫<b>型別別名</b>（type alias）。（講介面的那一課，會介紹另一種幫形狀命名的方法。）直接把一張 Card 寫出來的時候，檢查器會堅持三個屬性都要有、型別都要對。少一個、拼錯一個、多一個，都是錯誤。</p>
<h3>可選屬性：可以空著的欄位</h3>
<p>表格上有些欄位可以不填。在名字後面加一個問號標出來，這就是<b>可選屬性</b>（optional property）。</p>
<pre><code>type Player = {
  name: string;
  nickname?: string;   // may be missing
};

const a: Player = { name: 'Ada' };                // fine
const b: Player = { name: 'Bo', nickname: 'B' };  // fine
a.nickname.toUpperCase();   // error: a.nickname is possibly &#117;ndefined</code></pre>
<p>讀取可選屬性，拿到的是 <code>string | &#117;ndefined</code>：一個字串，或是什麼都沒有。在你確認它真的在之前，檢查器不會讓你把它當字串用。要怎麼確認，講 null 和 &#117;ndefined 的那一課會教。</p>
<h3>唯讀：只能看、不能改的欄位</h3>
<pre><code>type FixedCard = {
  readonly rank: number;
  readonly suit: string;
};
const c: FixedCard = { rank: 7, suit: 'hearts' };
c.rank = 8;          // error: rank is read-only

const deck: readonly number[] = [1, 2, 3];
deck.push(4);        // error: no push on a readonly array</code></pre>
<p>不要把唯讀（<code>readonly</code>）和 <code>const</code> 搞混，它們保護的東西不一樣：</p>
<table>
<tr><th>關鍵字</th><th>擋住什麼</th><th>例子</th></tr>
<tr><td><code>const</code></td><td>把另一個值放進這個變數</td><td><code>hand = []</code> 是錯誤，但 <code>hand.push(5)</code> 沒問題</td></tr>
<tr><td><code>readonly</code></td><td>修改裡面的欄位</td><td><code>c.rank = 8</code> 和 <code>deck.push(4)</code> 都是錯誤</td></tr>
</table>
<p>跟所有型別一樣，<code>readonly</code> 也會被擦掉。它擋得住你的程式碼去改這個值，但程式在跑的時候，物件並沒有被凍結。要凍結得用 <code>Object.freeze</code>。</p>
<h3>元組：格數固定，每格有自己的型別</h3>
<p>有時候你要的是一小排盒子，每個位置代表不同的意思，而且長度永遠不變。這就是<b>元組</b>（tuple）。</p>
<div class="flow"><span class="box">'Ada'<small>[0] string</small></span><span class="box">12<small>[1] number</small></span><span class="arr">剛好兩格，順序固定</span></div>
<pre><code>const entry: [string, number] = ['Ada', 12];
const who = entry[0];     // string
const points = entry[1];  // number
entry[2];                 // error: there is no position 2

// labels make the meaning clear and change nothing else
type Round = [current: number, next: number];
const r: Round = [7, 11];</code></pre>
<p>當一個函式要一次交回兩樣東西，例如一個值，再加上一個用來改這個值的函式，你就會遇到元組。兩、三個位置的時候用它。再多的話，用有名字屬性的物件比較好讀。</p>
<h3>Record：事先不知道會有哪些鍵</h3>
<p>物件型別在你寫程式的時候，就已經把屬性名字列出來了。但想想最佳分數的排行表：名字是誰來玩就是誰。這時候用 <code>Record</code>。</p>
<div class="flow"><span class="box">'Ada'<small>12</small></span><span class="box">'Bo'<small>9</small></span><span class="box">'Cy'<small>15</small></span><span class="box hot">任何新名字<small>永遠是數字</small></span></div>
<pre><code>const best: Record&lt;string, number&gt; = {};
best['Ada'] = 12;
best['Bo'] = 9;
best['Cy'] = 'ten';   // error: values must be numbers

type Level = 'easy' | 'hard';
const target: Record&lt;Level, number&gt; = { easy: 5, hard: 10 };   // both keys required</code></pre>
<p><code>Record&lt;string, number&gt;</code> 讀作「任何字串都可以當鍵，每個鍵放一個數字」。如果鍵的型別是一串固定的單字，像 <code>Level</code> 那樣，物件就必須每個單字都有。這種「單字清單」型別，正是下一課的主題。</p>
<h3>挑對形狀</h3>
<table>
<tr><th>你手上有</th><th>用</th><th>型別</th></tr>
<tr><td>很多個同一種的值</td><td>陣列</td><td><code>number[]</code></td></tr>
<tr><td>一樣東西，有幾個已知的欄位</td><td>物件</td><td><code>{ rank: number; suit: string }</code></td></tr>
<tr><td>兩、三個意思固定的位置</td><td>元組</td><td><code>[string, number]</code></td></tr>
<tr><td>鍵來自資料的查詢表</td><td>Record</td><td><code>Record&lt;string, number&gt;</code></td></tr>
</table>
<h3>深入一點：缺少的鍵不會被抓到</h3>
<p>從 <code>Record&lt;string, number&gt;</code> 讀 <code>best['Zoe']</code>，型別是 <code>number</code>，但程式跑的時候，值其實是 <code>&#117;ndefined</code>，因為根本沒有叫 Zoe 的人玩過。檢查器假設每一個字串鍵都存在。陣列也一樣：<code>hand[99]</code> 的型別是 <code>number</code>，裡面卻什麼都沒有。有兩種方法讓它誠實一點。一是打開 <code>noUncheckedIndexedAccess</code> 這個設定，它會在每一次這樣的讀取加上 <code>| &#117;ndefined</code>（它不包含在 <code>strict</code> 裡）。二是改用 <code>Map</code>，它的 <code>get</code> 本來就回傳 <code>number | &#117;ndefined</code>。</p>
<h3>深入一點：元組其實還是陣列</h3>
<p>檢查器會擋 <code>entry[2]</code>，但 <code>entry.push(99)</code> 卻可以，因為元組底下就是一個普通的陣列。長度真的必須固定的時候，就寫成 <code>readonly [string, number]</code>。</p>
<h3>和 Vue 比較</h3>
<p><code>&lt;script setup lang="ts"&gt;</code> 裡的 props 就是一個物件型別，可選的 prop 一樣用問號：</p>
<pre><code>const props = defineProps&lt;{
  title: string;
  cards: number[];
  subtitle?: string;   // optional prop
}&gt;();</code></pre>
<p>從子元件這邊看，props 也是唯讀的。Vue 給 <code>props</code> 的型別，把每個屬性都標成 <code>readonly</code>，所以寫 <code>props.title = 'x'</code> 會是型別錯誤。</p>`,
    tryNote: '把每一段貼到 TypeScript Playground（https://www.typescriptlang.org/play），看看紅色底線說了什麼。',
    try: [
      '型別推論把 hand 定成數字陣列，所以字串會被拒絕。',
      '最後一行被畫上底線：p.nickname 可能是 &#117;ndefined。',
      '位置 2 是錯誤，但 push 可以。元組底下其實還是陣列。',
      '滑鼠移到 zoe 上：型別寫著 number，雖然表裡明明是空的。'
    ],
    own: `找一個你的程式從伺服器拿到的物件，例如使用者的個人資料，或是清單裡的一筆資料。幫它寫一個 <code>type</code>。可能缺少的屬性都加上 <code>?</code>，程式不該去改的屬性都加上 <code>readonly</code>。接著在程式碼裡找一個用 id 或名字當鍵的查詢表，幫它加上 <code>Record</code> 型別。`,
    quiz: [
      { q: "<code>const hand = [7, 12]</code> 和 <code>const hand: readonly number[] = [7, 12]</code> 差在哪裡？",
        a: ["沒有差別：const 本來就讓陣列不能改", "兩個都擋得住 hand = []，但只有第二個也擋得住 hand.push(3)", "第二個在程式執行時會被凍結", "第一個不能讀"],
        why: "const 擋的是把另一個陣列放進這個變數。readonly 擋的是修改陣列本身。兩個在程式執行時都不會凍結任何東西。" },
      { q: "最佳分數的排行表，鍵是事先沒人知道的玩家名字。哪個型別最適合？",
        a: ["[string, number]", "{ name: string; score: number }", "Record&lt;string, number&gt;", "string[]"],
        why: "Record 把任何字串鍵，對應到同一種型別的值。元組的長度是固定的，物件型別的屬性名字也是固定的。" },
      { q: "一個型別裡有 <code>nickname?: string</code>。讀 <code>p.nickname</code> 拿到的是什麼型別？",
        a: ["string", "any", "string | null", "string | &#117;ndefined"],
        why: "問號表示這個屬性可能不存在，而不存在的屬性讀出來就是 &#117;ndefined。" }
    ]
  },
  {
    id: 'ts-unions',
    title: '聯集型別、字面值型別和 enum',
    body: `
<p>到目前為止，每個盒子都只收一種值。真實的資料沒那麼整齊。同樣是 id，在某個地方是數字，在另一個地方是字串。Higher or Lower（猜下一張牌比較大還是比較小的遊戲）裡的猜測，只會是兩個單字的其中一個。<b>聯集型別</b>（union type）說的是「這幾種其中一種」，<b>字面值型別</b>（literal type）說的是「剛好就是這個值」。兩個加起來，是日常 TypeScript 裡最好用的觀念。</p>
<h3>聯集：這個或那個</h3>
<p>用一條直線把型別接起來，讀作「或」：</p>
<pre><code>let id: string | number;
id = 42;        // fine
id = 'p-42';    // fine
id = true;      // error: a boolean is neither</code></pre>
<div class="flow"><span class="box hot">string | number</span><span class="arr">收</span><span class="box">'p-42'</span><span class="box">42</span><span class="arr">不收</span><span class="box bad">true</span></div>
<p>麻煩在這裡：檢查器只知道「字串或數字」的時候，只會讓你做兩種都安全的事。<code>id.toUpperCase()</code> 是錯誤，因為數字沒有 <code>toUpperCase</code>。你得先弄清楚手上拿的是哪一種。</p>
<h3>型別縮小：弄清楚是哪一種</h3>
<p>用普通的 JavaScript 檢查這個值，在每個分支裡，檢查器就會知道得更多。這叫<b>型別縮小</b>（narrowing）。</p>
<pre><code>function label(id: string | number): string {
  if (typeof id === 'string') {
    return id.toUpperCase();      // here id is string
  }
  return 'No. ' + id.toFixed(0);  // here id can only be number
}</code></pre>
<div class="flow"><span class="box">id: string | number</span><span class="arr">&rarr;</span><span class="box hot">typeof id === 'string'?</span><span class="arr">是 &rarr;</span><span class="box">string</span><span class="arr">否 &rarr;</span><span class="box">number</span></div>
<p>檢查器會照著你的 <code>if</code>、<code>else</code>、<code>return</code> 和 <code>switch</code> 走，跟程式實際執行的路線一模一樣。<code>if</code> 裡面的 <code>return</code> 之後，字串的情況已經離開了，所以只剩下 number。<code>typeof</code> 一定會給你幾個固定單字的其中一個：<code>'string'</code>、<code>'number'</code>、<code>'boolean'</code>、<code>'object'</code>、<code>'function'</code>、<code>'&#117;ndefined'</code>，還有兩個比較少見的。</p>
<h3>字面值型別：一張允許的單字清單</h3>
<p>型別也可以就是一個確切的值。把幾個接起來，就得到一張允許的單字清單，就像下拉選單裡的選項：</p>
<pre><code>type Guess = 'higher' | 'lower';

function check(guess: Guess, current: number, next: number): boolean {
  if (guess === 'higher') return next &gt; current;
  return next &lt; current;   // here guess can only be 'lower'
}

check('higher', 7, 11);   // fine
check('hihger', 7, 11);   // error: not one of the allowed words</code></pre>
<p>拿它跟 <code>guess: string</code> 比比看。用普通字串的話，打錯字沒有人會發現，直到某個玩家明明該贏、卻輸了一局。用字面值聯集，檢查器會抓到錯字，編輯器在你打字時會列出這兩個單字，而且用 <code>===</code> 縮小型別也行得通：只要 <code>guess</code> 不是 <code>'higher'</code>，它就一定是 <code>'lower'</code>。</p>
<p>還記得第一課的 <code>const best = 10</code> 嗎？它的型別是 <code>10</code>，那就是字面值型別。<code>let</code> 會把它放寬成 <code>number</code>，這叫型別放寬（widening），因為 <code>let</code> 之後可能會變。</p>
<h3>深入一點：物件的聯集</h3>
<p>字面值型別最厲害的用法，是當成物件裡的標記。給每一種形狀一個屬性，各放一個不同的固定單字，只要檢查這一個屬性，檢查器就知道整個形狀：</p>
<pre><code>type Result =
  | { kind: 'right'; points: number }
  | { kind: 'wrong'; correctCard: number };

function message(r: Result): string {
  switch (r.kind) {
    case 'right': return '+' + r.points;
    case 'wrong': return 'It was ' + r.correctCard;
  }
}</code></pre>
<p>這種寫法叫<b>可辨識聯集</b>（discriminated union），到處都看得到：伺服器的回應（成功或失敗）、遊戲事件、畫面狀態（載入中、就緒、錯誤）。在 <code>case 'right'</code> 裡面只有 <code>points</code> 存在，所以你不可能去讀目前這個狀態沒有的屬性。如果之後有人加了第三種 kind，這個函式就會編譯不過，因為它現在有可能一路走到結尾都沒有回傳字串。這是檢查器在提醒你：新的情況也要處理。</p>
<h3>enum：有名字的常數</h3>
<p>TypeScript 還有<b>列舉</b>（enum），用來幫一組值取名字。你會遇到兩種：</p>
<pre><code>enum Direction { Up, Down }                   // numeric: Up is 0, Down is 1
enum Level { Easy = 'easy', Hard = 'hard' }   // string

let d: Direction = Direction.Up;
let l: Level = Level.Hard;
l = 'hard';    // error: you must write Level.Hard</code></pre>
<p>enum 很特別。一般的 enum 是少數「不會被擦掉」的 TypeScript 功能之一：<code>Level</code> 在輸出裡會變成一個真正的 JavaScript 物件，所以會讓打包出來的程式碼變多。數字 enum 存的又是單純的數字，所以日誌或存檔裡，你本來想表示 Up 的地方，會顯示成 <code>0</code>。</p>
<h3>為什麼很多團隊比較喜歡字面值聯集</h3>
<table>
<tr><th>問題</th><th>字面值聯集</th><th>enum</th></tr>
<tr><td>值怎麼寫</td><td><code>'easy'</code></td><td><code>Level.Easy</code></td></tr>
<tr><td>輸出裡的程式碼</td><td>沒有：跟所有型別一樣被擦掉</td><td>一個物件</td></tr>
<tr><td>普通字串 <code>'easy'</code> 放得進去嗎？</td><td>可以</td><td>不行，一定要寫 enum 的成員</td></tr>
<tr><td>在日誌和網路資料裡看得懂嗎</td><td>看得懂</td><td>字串 enum 看得懂，數字 enum 看不懂</td></tr>
</table>
<p>enum 沒有錯，舊的程式碼也用得很多，所以你一定要看得懂。但新的程式碼用字面值聯集，就能做到同樣的事，而且機制簡單得多。TypeScript 5.8 甚至加了一個設定 <code>erasableSyntaxOnly</code>，會把 enum 報成錯誤，給那些工具只會拿掉型別的專案用。</p>
<h3>as const：第三種做法</h3>
<p>有時候你也想要這張單字清單是真的值，例如把兩個選項做成按鈕顯示出來。陣列寫一次，加上 <code>as const</code>，再從它取出型別：</p>
<pre><code>const GUESSES = ['higher', 'lower'] as const;
type Guess = typeof GUESSES[number];   // 'higher' | 'lower'

for (const g of GUESSES) console.log(g);   // real values, at run time</code></pre>
<p><code>as const</code> 是告訴檢查器：這裡什麼都不要放寬。沒有它，<code>GUESSES</code> 會是 <code>string[]</code>，確切的單字就不見了。有了它，陣列是 <code>readonly ['higher', 'lower']</code>。<code>typeof GUESSES[number]</code> 讀作「GUESSES 裡任何一項的型別」。同一招用在物件上，不用 enum 也能得到一組有名字的常數。第二行當成固定寫法照抄就好；<code>keyof</code> 會給你所有屬性的名字。</p>
<pre><code>const Speed = { Slow: 'slow', Fast: 'fast' } as const;
type Speed = typeof Speed[keyof typeof Speed];   // 'slow' | 'fast'</code></pre>
<h3>深入一點：單字又變回字串的時候</h3>
<pre><code>const round = { guess: 'higher' };   // guess: string, as objects can change
check(round.guess, 7, 11);           // error: string is not assignable to Guess

const fixed: { guess: Guess } = { guess: 'higher' };   // fine</code></pre>
<p>物件的屬性也會被放寬，就跟 <code>let</code> 一樣，因為物件之後可能會被改。如果你看到「Type string is not assignable to type ...」，而那個值明明就是其中一個單字，就幫物件加上型別，或是加上 <code>as const</code>。</p>
<h3>和 Vue 比較</h3>
<pre><code>defineProps&lt;{ size: 'small' | 'large' }&gt;();
const emit = defineEmits&lt;{ guess: [value: 'higher' | 'lower'] }&gt;();
emit('guess', 'higher');   // both the event name and the value are checked</code></pre>
<p>prop 用字面值聯集，父元件那邊就有自動完成，寫成 <code>size="medium"</code> 也會報錯。這裡示範的 <code>defineEmits</code> 寫法（Vue 3.3 以後）把每個事件和它參數的元組列出來，所以事件名稱和值都會被檢查。</p>`,
    tryNote: '把每一段貼到 TypeScript Playground（https://www.typescriptlang.org/play）。',
    try: [
      '錯字被抓到了。把那個單字刪掉，打一個引號，編輯器就會列出兩個允許的單字。',
      '把滑鼠移到兩行 return 裡的 id 上：第一個是 string，第二個是 number。這就是型別縮小。',
      '打開 .JS 分頁：enum 變成了一個真正的物件，as const 那一行則沒有多出任何東西。',
      '滑鼠移到兩個名字上：round 是 guess: string，fixed 是 readonly guess: "higher"。'
    ],
    own: `在你的程式碼裡找一個 <code>string</code> 型別的屬性或參數，它其實永遠只會放幾個固定的單字，例如狀態、尺寸、分頁名稱或排序方式。把它的型別改成字面值聯集，再跑一次型別檢查。它報出來的每一個錯誤，不是原本就存在的錯字，就是需要縮小型別的地方。如果你的程式碼有用 <code>enum</code>，把它貼到 Playground 裡看一次，看看它變成了什麼樣的物件。`,
    quiz: [
      { q: "<code>id</code> 的型別是 <code>string | number</code>。在 <code>if (typeof id === 'string') { ... }</code> 裡面，id 是什麼型別？",
        a: ["string | number", "string", "number", "any"],
        why: "這個檢查把聯集縮小了。在 else 分支裡，或是 if 裡面 return 之後，就只剩下 number。" },
      { q: "為什麼很多團隊選 <code>'easy' | 'hard'</code>，而不選 enum？",
        a: ["字面值聯集會在程式執行時檢查", "enum 不能放字串", "enum 的型別檢查比較慢", "字面值聯集會被擦掉，不會在輸出裡多加東西，而且像 'easy' 這樣的普通字串也放得進去"],
        why: "enum 會變成一個真正的 JavaScript 物件，字串 enum 還不收普通字串。兩種都不會在程式執行時檢查。" },
      { q: "沒有 <code>as const</code> 的話，<code>const GUESSES = ['higher', 'lower']</code> 是什麼型別？",
        a: ["string[]", "readonly ['higher', 'lower']", "'higher' | 'lower'", "[string, string]"],
        why: "陣列裡的項目會被放寬成 string，因為陣列可以改。as const 會保留確切的單字，並把陣列變成 readonly。" }
    ]
  },
  {
    id: 'ts-functions',
    title: '函式、箭頭函式和回呼函式',
    body: `
<p><b>函式</b>（function）是一組有名字的步驟，你想什麼時候跑就什麼時候跑。在 Higher or Lower 這個猜牌遊戲裡，你需要抽牌的步驟、檢查猜測的步驟，還有加分的步驟。函式你已經寫了好幾年。這一課用 TypeScript 的眼光重新看它，再加上一個會改變你讀程式方式的觀念：函式是一個值，就跟數字一樣。</p>
<h3>參數進去，一個值出來</h3>
<pre><code>function checkGuess(guess: 'higher' | 'lower', current: number, next: number): boolean {
  if (guess === 'higher') return next &gt; current;
  return next &lt; current;
}

checkGuess('higher', 7, 11);   // true
checkGuess('higher', 7);       // error: expected 3 arguments, but got 2</code></pre>
<div class="tiers"><b>參數</b><div><span class="box">guess<small>'higher' | 'lower'</small></span><span class="box">current<small>number</small></span><span class="box">next<small>number</small></span></div><b>回傳型別</b><div><span class="box hot">boolean<small>寫在 ) 後面</small></span></div></div>
<p>每個<b>參數</b>（parameter）都需要型別，因為檢查器猜不到呼叫的人會傳什麼進來。在 <code>strict</code> 底下，沒寫型別的參數就是錯誤（回呼函式是例外，下面會看到）。括號後面的<b>回傳型別</b>（return type）常常可以省略：檢查器會從 <code>return</code> 那幾行推論出來。不過，給其他檔案用的函式，最好還是寫出來。這樣函式裡面寫錯時，錯誤會報在函式裡面，而不是報在每一個呼叫它的地方。</p>
<p>不回傳任何有用東西的函式，回傳型別是 <code>void</code>。</p>
<h3>箭頭函式：簡短的寫法</h3>
<pre><code>// the same function, written two ways
function double(n: number): number { return n * 2; }
const double2 = (n: number): number =&gt; n * 2;</code></pre>
<p><b>箭頭函式</b>（arrow function）的寫法是：先寫參數，接著 <code>=&gt;</code>，再寫本體。如果本體只有一個運算式，它的值會直接回傳，不用寫 <code>return</code>。需要好幾行的話，就用大括號，照常寫 <code>return</code>。</p>
<h3>函式是一個值</h3>
<p>再看一次 <code>const double2 = ...</code>。它把一個函式放進盒子，就跟 <code>const score = 0</code> 把一個數字放進盒子一模一樣。值能做的事，函式都能做：放進變數、放進物件、傳給另一個函式、從函式裡回傳出來。</p>
<pre><code>const rules = {
  easy: (a: number, b: number) =&gt; b &gt;= a,   // a tie counts as higher
  hard: (a: number, b: number) =&gt; b &gt; a,
};
const isHigher = rules.hard;   // no brackets: the function itself, not run
isHigher(7, 11);               // brackets: run it now, gives true</code></pre>
<p>差別全在那對括號。<code>isHigher</code> 是一張食譜卡。<code>isHigher(7, 11)</code> 則是照著食譜下廚，把菜端出來。</p>
<h3>回呼函式：交給別人、晚點再執行的紙條</h3>
<p><b>回呼函式</b>（callback）是你交給別人的函式，讓他在時候到了的時候執行。就像留一張紙條給鄰居：「包裹到了，幫我簽收。」紙條你現在寫，他晚點才照做，而且可能不只做一次。</p>
<div class="flow"><span class="box">你寫好紙條<small>() =&gt; showNextCard()</small></span><span class="arr">交給 &rarr;</span><span class="box">setTimeout、map、點擊監聽器</span><span class="arr">&rarr;</span><span class="box hot">他們來執行<small>晚點，時候到了才跑</small></span></div>
<pre><code>function showNextCard(): void { console.log('next card'); }

setTimeout(showNextCard, 1000);                     // once, in one second
document.body.addEventListener('click', () =&gt; showNextCard());  // on every click

const hand = [7, 12, 3];
const doubled = hand.map(n =&gt; n * 2);              // once per card: [14, 24, 6]</code></pre>
<p>注意最後一行的 <code>n</code> 沒有寫註記，卻還是一個數字。檢查器知道 <code>number[]</code> 上的 <code>map</code> 會把數字傳進來，所以自動幫它填上型別。這叫<b>上下文型別</b>（contextual typing），也是回呼函式很少需要貼標籤的原因。</p>
<div class="warn">回呼函式最常見的錯，是寫成 <code>setTimeout(showNextCard(), 1000)</code>。括號會讓函式「現在」就執行，再把它的結果，也就是什麼都沒有，交給 <code>setTimeout</code>。要傳的是函式本身：<code>setTimeout(showNextCard, 1000)</code>。TypeScript 通常會抓到這個錯，因為那個結果不是函式。</div>
<h3>可選參數和預設參數</h3>
<pre><code>function addPoints(score: number, points = 1): number {
  return score + points;
}
addPoints(5);      // 6: points uses its default
addPoints(5, 3);   // 8

function greet(name: string, title?: string): string {
  return title ? title + ' ' + name : name;   // title is string | &#117;ndefined
}</code></pre>
<p><b>預設參數</b>（default parameter，像 <code>points = 1</code>）呼叫的人可以不傳，它的型別會從預設值推論出來。可選參數（optional parameter，像 <code>title?</code>）一樣可以不傳，但這時候它在函式裡面就是 <code>&#117;ndefined</code>，所以用之前一定要先檢查。可選參數一定要放在必填參數的後面。</p>
<h3>寫出函式的型別</h3>
<p>函式是一個值，所以有時候你得寫出它的型別。看起來就像一個沒有本體的箭頭函式：</p>
<pre><code>type Rule = (current: number, next: number) =&gt; boolean;
type OnGuess = (guess: 'higher' | 'lower') =&gt; void;

const hard: Rule = (a, b) =&gt; b &gt; a;   // a and b are inferred as number

function onButton(handler: OnGuess): void {
  handler('higher');
}</code></pre>
<div class="tiers"><b>接收</b><div><span class="box">(current: number, next: number)</span></div><b>交回</b><div><span class="box hot">=&gt; boolean</span></div></div>
<p><code>(current: number, next: number) =&gt; boolean</code> 讀作「一個接收兩個數字、交回一個 boolean 的函式」。這種<b>函式型別</b>（function type），就是你用來說「這個參數是回呼函式」的方法，函式庫的型別也是用它來描述每一個它接收的回呼函式。</p>
<h3>為什麼回呼函式通常寫成箭頭函式</h3>
<p>原因有兩個。第一是長度：放在一行的中間，<code>n =&gt; n * 2</code> 比 <code>function (n) { return n * 2; }</code> 好讀。第二個比較重要，跟 <code>this</code> 有關。箭頭函式沒有自己的 <code>this</code>，它用的是外面那段程式碼的。一般的 <code>function</code> 則會拿到一個新的 <code>this</code>，要看是誰呼叫它而定。在類別裡使用回呼函式時，這是很經典的 bug 來源。講閉包的那一課會好好解釋。現在只要記住一條規則：回呼函式用箭頭函式寫。</p>
<h3>深入一點：函式型別的兩個意外</h3>
<ul>
<li><b>參數名字一定要寫，而且它就只是名字。</b>在 <code>(guess: string) =&gt; void</code> 裡，<code>guess</code> 這個字只是一個標籤。如果你寫成 <code>(string) =&gt; void</code>，TypeScript 會把 <code>string</code> 當成一個沒有型別的參數名字。開著 <code>strict</code> 這是錯誤，剛好救了你；沒開 strict，你會悄悄拿到 <code>any</code>。</li>
<li><b>參數比較少沒關係。</b>回呼函式可以不理用不到的參數。<code>map</code> 會把每一項、它的索引，還有整個陣列都傳進來，但 <code>n =&gt; n * 2</code> 照樣接受。收得比較少是安全的。要求的比呼叫的人會傳的還多，才是錯誤。</li>
</ul>
<h3>和 Vue 比較</h3>
<p>Vue 的 Composition API，就是建立在「把函式當成值傳來傳去」上面。<code>computed(() =&gt; score.value * 2)</code> 是交給 Vue 一個函式，讓它用來算出這個值，等 <code>score</code> 變了之後再跑一次。<code>watch(score, (next, prev) =&gt; ...)</code> 是交給它一個回呼函式，兩個參數的型別由 Vue 靠上下文型別填好。<code>onMounted(() =&gt; ...)</code> 是一張寫著「元件出現在頁面上之後，執行這個」的紙條。在範本裡，<code>@click="checkGuess"</code> 傳的是函式本身，而 <code>@click="checkGuess('higher')"</code> 會被 Vue 的編譯器包進一個小函式裡，所以要等到點擊才會執行。</p>`,
    tryNote: '把每一段貼到 TypeScript Playground（https://www.typescriptlang.org/play）。要看輸出，就按 Run，再打開 Logs 分頁。',
    try: [
      '滑鼠移到 n 上：它是 number，雖然沒有人寫型別。是上下文型別幫它填上的。',
      '出現錯誤：括號讓函式先執行，再把結果傳過去。把 showNextCard 後面的括號刪掉，傳的就是函式本身。',
      '滑鼠移到 a 上：它是 number，型別來自 Rule。按 Run，Logs 分頁會顯示 true。',
      '開著 strict 這是錯誤：string 被當成一個沒有型別的參數名字。'
    ],
    own: `在你自己的程式碼裡找三個回呼函式：一個傳給陣列方法，像 <code>map</code> 或 <code>filter</code>；一個傳給 <code>setTimeout</code> 或事件監聽器；一個傳給 Vue 的函式，像 <code>watch</code> 或 <code>computed</code>。把滑鼠移到每個回呼函式的參數上，記下上下文型別給了它們什麼型別。接著挑一個其他檔案會呼叫的函式，自己把它的回傳型別寫出來。`,
    quiz: [
      { q: "<code>setTimeout(showNextCard, 1000)</code> 和 <code>setTimeout(showNextCard(), 1000)</code> 差在哪裡？",
        a: ["第一個不是合法的 TypeScript", "沒有差別：兩個都是一秒後顯示下一張牌", "第一個把函式交出去，晚點再執行；第二個現在就執行，再把結果交出去", "第二個會執行兩次"],
        why: "不加括號，交出去的是函式本身。加了括號，就是馬上呼叫它，再把它回傳的東西交出去。" },
      { q: "在 <code>[7, 12, 3].map(n =&gt; n * 2)</code> 裡，為什麼 <code>n</code> 不用寫型別註記？",
        a: ["number[] 上的 map 告訴檢查器它會傳數字進來，所以型別從上下文填上了", "箭頭函式的參數永遠是 any", "箭頭函式裡不准寫註記", "檢查器會跳過回呼函式"],
        why: "這就是上下文型別。回呼函式被傳到哪裡，那個位置的型別就決定了它參數的型別。" },
      { q: "哪一個型別描述的是「接收一個猜測單字、不回傳任何東西」的函式？",
        a: ["(string) =&gt; void", "(guess: 'higher' | 'lower') =&gt; void", "function: void", "void(guess)"],
        why: "函式型別裡的參數名字一定要寫。在 (string) =&gt; void 裡，string 是一個沒有型別的參數名字。" }
    ]
  },
  {
    id: 'ts-null',
    title: 'null 與未定義：值不見的時候',
    body: `
<p>問問前端工程師最常看到哪一個錯誤，很多人會說是這一個：</p>
<pre><code>TypeError: Cannot read properties of &#117;ndefined (reading 'name')</code></pre>
<p>意思是程式碼想拿某個東西的 <code>name</code>，但那裡什麼都沒有。JavaScript 有兩種方式表示「什麼都沒有」。這一課兩種都會講，也會講 TypeScript 怎麼讓檢查器搶在使用者之前，先找到這些錯。</p>
<h3>兩種「沒有」</h3>
<table>
<tr><th>&nbsp;</th><th><code>&#117;ndefined</code></th><th><code>null</code></th></tr>
<tr><td>意思</td><td>這裡從來沒放過東西</td><td>有人刻意在這裡放了「空」</td></tr>
<tr><td>就像</td><td>表格上沒人填的欄位</td><td>表格上有人寫了「無」的欄位</td></tr>
<tr><td>從哪裡來</td><td>不存在的屬性、沒傳的可選參數、沒有 <code>return</code> 的函式、找不到結果的搜尋</td><td>程式碼自己選的：頁面上沒有的元素、伺服器送來的空欄位、你自己定的「還沒選」</td></tr>
</table>
<p>大部分時候，把它們當成同一件事就好：值不見了。重點是，一個「可能不見」的值，跟一個「一定在」的值，是不同種類的東西，而型別應該把這件事講清楚。</p>
<h3>strictNullChecks 改變了什麼</h3>
<p>沒有 <code>strictNullChecks</code> 的話，<code>null</code> 和 <code>&#117;ndefined</code> 放得進任何盒子。檢查器假設每個值都在，當機就留到程式跑起來，也就是執行階段（runtime）才發生。開了它（它包含在 <code>strict</code> 裡），盒子只有在標籤上寫了才收它們：</p>
<pre><code>let chosen: string = null;          // error with strictNullChecks
let picked: string | null = null;   // fine: the label allows it

const el = document.querySelector('#score');   // Element | null
el.textContent = '0';                          // error: 'el' is possibly 'null'</code></pre>
<div class="flow"><span class="box">可能不見的值<small>string | &#117;ndefined</small></span><span class="arr">&rarr;</span><span class="box hot">先檢查<small>if、?.、??</small></span><span class="arr">&rarr;</span><span class="box">可以放心用<small>string</small></span></div>
<p>這可能是 TypeScript 最有價值的一項檢查。每一個這樣的錯誤，都是某一天、某個使用者會遇到的當機。這一課剩下的部分，就是處理它們的工具箱。</p>
<h3>型別守衛：先檢查，再使用</h3>
<p><b>型別守衛</b>（type guard）就是檢查器看得懂的任何檢查。經過它之後，型別就會縮小，跟上一課的聯集完全一樣。事實上，<code>string | null</code> 本來就是一個聯集。</p>
<pre><code>function showName(name: string | null | &#117;ndefined) {
  if (name) {
    console.log(name.toUpperCase());   // here name is string
  }
}

function setScore(el: Element | null, score: number) {
  if (el === null) return;             // leave early if missing
  el.textContent = String(score);      // from here on, el is Element
}</code></pre>
<table>
<tr><th>守衛</th><th>拿掉</th><th>要注意</th></tr>
<tr><td><code>if (x)</code></td><td><code>null</code> 和 <code>&#117;ndefined</code></td><td>也會跳過 <code>0</code>、<code>''</code> 和 <code>false</code>，而它們可能是真正的值</td></tr>
<tr><td><code>x !== null</code></td><td>只有 <code>null</code></td><td><code>&#117;ndefined</code> 還是會通過</td></tr>
<tr><td><code>x != null</code></td><td>兩個都拿掉</td><td>唯一一個刻意使用寬鬆的 <code>!=</code> 的地方</td></tr>
<tr><td><code>typeof x === 'string'</code></td><td>所有不是字串的東西</td><td>適合基本型別的聯集</td></tr>
<tr><td><code>'error' in r</code></td><td>沒有那個屬性的物件形狀</td><td>用在物件的聯集，見下面</td></tr>
</table>
<pre><code>type Reply = { cards: number[] } | { error: string };

function handle(r: Reply) {
  if ('error' in r) {
    console.log(r.error);          // r is { error: string }
  } else {
    console.log(r.cards.length);   // r is { cards: number[] }
  }
}</code></pre>
<h3>可選串連：少了什麼就安靜停下</h3>
<p><b>可選串連</b>（optional chaining）寫成 <code>?.</code>，只有前面那個東西存在時，才會去讀它的屬性。如果那個東西是 <code>null</code> 或 <code>&#117;ndefined</code>，整個運算式就停下來，給你 <code>&#117;ndefined</code>，不會當掉。</p>
<pre><code>type Player = { name: string; stats?: { best: number } };

function bestOf(p: Player | null) {
  return p?.stats?.best;   // number | &#117;ndefined
}

function finish(onDone?: () =&gt; void) {
  onDone?.();              // call it only if one was passed
}</code></pre>
<div class="flow"><span class="box">p</span><span class="arr">?.</span><span class="box">stats</span><span class="arr">?.</span><span class="box">best</span><span class="arr">&rarr;</span><span class="box hot">一個數字，或是 &#117;ndefined<small>任何一段不見：停下，不當機</small></span></div>
<p><code>?.</code> 不會讓值憑空出現。它只是把當機變成一個 <code>&#117;ndefined</code>，你還是得處理它，通常是用下一個運算子。</p>
<h3>?? 和 ||：零的問題</h3>
<p>要給一個備用值，舊的程式碼會用 <code>||</code>，而它有一個陷阱。只要左邊是<b>假值</b>（falsy），<code>||</code> 就會改用右邊，而假值裡包括了真正的值：<code>0</code>、<code>''</code> 和 <code>false</code>。<b>空值合併</b>（nullish coalescing）運算子 <code>??</code>，只有在左邊是 <code>null</code> 或 <code>&#117;ndefined</code> 的時候才用右邊。</p>
<pre><code>function startingBest(saved: number | null): number {
  return saved ?? 10;   // 10 only when nothing was saved
}
startingBest(null);   // 10
startingBest(0);      // 0: a real score is kept
// with || in place of ??, startingBest(0) would give 10</code></pre>
<table>
<tr><th>左邊</th><th><code>x || 10</code></th><th><code>x ?? 10</code></th></tr>
<tr><td><code>null</code> 或 <code>&#117;ndefined</code></td><td>10</td><td>10</td></tr>
<tr><td><code>0</code></td><td>10</td><td>0</td></tr>
<tr><td><code>''</code> 或 <code>false</code></td><td>10</td><td>保持原樣</td></tr>
<tr><td><code>7</code></td><td>7</td><td>7</td></tr>
</table>
<p>一個簡單的原則：預設值用 <code>??</code>。只有在你真的是指「任何假值都算不見」的時候才用 <code>||</code>，例如把空白的搜尋框當成沒有搜尋。它的親戚 <code>??=</code>，只有在變數不見的時候才會指派：<code>options.speed ??= 1</code>。</p>
<h3>! 斷言：「相信我」</h3>
<p>在值後面寫 <code>!</code>，是告訴檢查器：這不是 null，也不是 &#117;ndefined，別再警告我了。這叫<b>非空值斷言</b>（non-null assertion）。</p>
<pre><code>const el = document.querySelector('#score')!;   // Element, no more error
el.textContent = '0';</code></pre>
<div class="warn"><code>!</code> 跟所有型別一樣會被擦掉，所以程式跑的時候什麼都沒檢查。如果元素真的不在（id 改了名字、元件還沒出現在頁面上），一樣會當掉。只是這次檢查器被你叫去閉嘴了，錯誤會出現在離原因很遠的地方。只有在你說得出「為什麼這個值一定在」的時候才用 <code>!</code>。寫一個檢查只要一行，而像 <code>throw new Error('#score not found')</code> 這樣清楚的錯誤，能讓下一個人馬上知道哪裡出了問題。</div>
<h3>深入一點：自己寫型別守衛</h3>
<p>檢查比較複雜的時候，把它放進一個函式，讓函式的回傳型別是一個<b>型別述詞</b>（type predicate），寫成 <code>x is Card</code>。之後不管在哪裡用這個函式，檢查器都會幫你縮小型別：</p>
<pre><code>type Card = { rank: number; suit: string };

function isCard(x: unknown): x is Card {
  if (typeof x !== 'object' || x === null) return false;
  return 'rank' in x &amp;&amp; typeof x.rank === 'number'
      &amp;&amp; 'suit' in x &amp;&amp; typeof x.suit === 'string';
}

const data: unknown = JSON.parse('{"rank": 7, "suit": "hearts"}');
if (isCard(data)) console.log(data.rank);   // data is Card here</code></pre>
<p>處理外面進來的資料，這才是誠實的做法：從 <code>unknown</code> 開始，先檢查，再相信。檢查器會完全相信這個述詞，所以要確定裡面的檢查，真的證明了回傳型別所承諾的事。</p>
<h3>深入一點：不見的值從哪裡來</h3>
<table>
<tr><th>來源</th><th>拿到的型別</th></tr>
<tr><td><code>Card[]</code> 上的 <code>cards.find(...)</code></td><td><code>Card | &#117;ndefined</code></td></tr>
<tr><td><code>Map&lt;string, number&gt;</code> 上的 <code>scores.get(name)</code></td><td><code>number | &#117;ndefined</code></td></tr>
<tr><td><code>document.querySelector(...)</code></td><td><code>Element | null</code></td></tr>
<tr><td><code>localStorage.getItem(key)</code></td><td><code>string | null</code></td></tr>
<tr><td>可選的屬性或參數</td><td>原本的型別，再加上 <code>| &#117;ndefined</code></td></tr>
<tr><td><code>JSON.parse(...)</code></td><td><code>any</code>：完全不檢查</td></tr>
</table>
<h3>和 Vue 比較</h3>
<p>範本 ref（template ref）在元件出現在頁面上之前都是 <code>null</code>，它的型別也是這樣寫的：</p>
<pre><code>const input = ref&lt;HTMLInputElement | null&gt;(null);

onMounted(() =&gt; {
  input.value?.focus();   // safe even if the element sits behind a v-if
});</code></pre>
<p>用 <code>?</code> 宣告的 props，父元件沒傳的時候就是 <code>&#117;ndefined</code>，所以同樣這些工具都用得上：<code>props.subtitle ?? ''</code>，或是透過 <code>withDefaults</code> 給預設值。</p>`,
    tryNote: '把每一段貼到 TypeScript Playground（https://www.typescriptlang.org/play）。要看輸出，就按 Run，再打開 Logs 分頁。',
    try: [
      '檢查器說 el 可能是 null。把第二行包進 if (el) { ... } 裡，錯誤就消失了。',
      '按 Run：Logs 分頁顯示 [10, 0]。只有 ?? 保住了 0 這個真正的分數。',
      '沒有當掉：日誌顯示 &#117;ndefined。把 ? 刪掉，檢查器就會在 p.stats 下面畫線。',
      '滑鼠移到 big 上：number | &#117;ndefined。搜尋有可能空手而回。'
    ],
    own: `在你自己的小專案，或是一個大專案的副本裡，打開 <code>strictNullChecks</code>（或整個 <code>strict</code>），跑一次型別檢查。不要想一次全部修好。挑五個錯誤，每一個都寫下：不見的值是從哪裡來的，如果它真的不見了，使用者會看到什麼。接著在程式碼裡搜尋非空值斷言，也就是緊接在名字或右括號後面的 <code>!</code>，像 <code>el!.focus()</code> 這樣，一個一個決定它是不是應該改成真正的檢查。`,
    quiz: [
      { q: "存下來的最佳分數有可能是 0。哪一個運算式只有在什麼都沒存的時候，才會得到 10？",
        a: ["saved! || 10", "saved?.10", "saved || 10", "saved ?? 10"],
        why: "|| 會把 0 當成不見，因為 0 是假值。?? 只會取代 null 和 &#117;ndefined。" },
      { q: "<code>document.querySelector('#score')!</code> 裡的 <code>!</code>，在程式執行時做了什麼？",
        a: ["元素不在的話，丟出一個清楚的錯誤", "等到元素出現為止", "什麼都沒做：它會被擦掉，只是讓檢查器不再警告", "回傳一個空的元素"],
        why: "非空值斷言屬於型別，所以會從 JavaScript 裡消失。元素不在的話，程式還是會當掉，只是晚一點。" },
      { q: "開著 <code>strictNullChecks</code>，哪一行是錯誤？",
        a: ["let a: string = null;", "let b: string | null = null;", "let c: string | &#117;ndefined = &#117;ndefined;", "let d = null;"],
        why: "普通的 string 盒子不收 null。標籤上一定要把它寫進去，像 string | null 這樣。" }
    ]
  }
  ]
});
