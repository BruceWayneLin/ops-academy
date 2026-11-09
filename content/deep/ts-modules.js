DEEP({ 'ts-modules': `
<p>上一課學了 import 和 export 怎麼寫。這一章往下挖：一行 <code>import { isHigher } from './cards'</code>，從你按下儲存，到瀏覽器真的執行它，中間經過了誰？TypeScript 怎麼把那串字變成一個檔案、打包工具怎麼把幾百個檔案畫成一張圖、哪些程式會被丟掉、哪些會晚一點才下載，以及執行的那一刻，模組到底照什麼順序跑。搞懂這些，「循環匯入有時壞、有時不壞」「本機好好的，上線就白畫面」這類怪 bug，你就能自己拆開來看。最後，替一個沒有型別的函式庫親手寫一份宣告檔。</p>

<h3><span class="badge lv1">基礎</span>一、模組在解決什麼問題：從一張共用白板說起</h3>
<p>早期的網頁，一個頁面用好幾個 <code>&lt;script&gt;</code> 標籤載入好幾個 JavaScript 檔。這些檔案沒有自己的空間，最外層宣告的變數全部掛在同一個全域物件 <code>window</code> 上。就像辦公室只有一張白板，每個人都在上面寫字：a.js 寫了 <code>score</code>，c.js 也寫了 <code>score</code>，後寫的就把先寫的蓋掉，沒有人會收到警告。</p>
<figure class="figure"><svg viewBox="0 0 660 250" class="fg" style="width:100%;max-width:660px" role="img" aria-label="左邊：三個 script 檔案都把名字寫進同一個全域物件 window，兩個 score 互相覆蓋；右邊：三個模組各有自己的作用域，只透過 import 連接">
<text x="165" y="24" text-anchor="middle" class="fg-t lg">以前：script 標籤</text>
<rect x="30" y="40" width="80" height="32" rx="5" class="fg-b"/><text x="70" y="61" text-anchor="middle" class="fg-t mono">a.js</text>
<rect x="125" y="40" width="80" height="32" rx="5" class="fg-b"/><text x="165" y="61" text-anchor="middle" class="fg-t mono">b.js</text>
<rect x="220" y="40" width="80" height="32" rx="5" class="fg-b"/><text x="260" y="61" text-anchor="middle" class="fg-t mono">c.js</text>
<line x1="70" y1="72" x2="70" y2="102" class="fg-l"/><polygon points="70,110 65.5,102 74.5,102" class="fg-a"/>
<line x1="165" y1="72" x2="165" y2="102" class="fg-l"/><polygon points="165,110 160.5,102 169.5,102" class="fg-a"/>
<line x1="260" y1="72" x2="260" y2="102" class="fg-l"/><polygon points="260,110 255.5,102 264.5,102" class="fg-a"/>
<rect x="20" y="110" width="290" height="128" rx="8" class="fg-b"/>
<text x="165" y="132" text-anchor="middle" class="fg-t">window（全域，大家共用）</text>
<rect x="36" y="144" width="120" height="28" rx="4" class="fg-b"/><text x="96" y="162" text-anchor="middle" class="fg-t sm">score（a.js 寫的）</text>
<rect x="174" y="144" width="120" height="28" rx="4" class="fg-b warm"/><text x="234" y="162" text-anchor="middle" class="fg-t sm">score（c.js 寫的）</text>
<rect x="36" y="180" width="120" height="28" rx="4" class="fg-b"/><text x="96" y="198" text-anchor="middle" class="fg-t sm mono">init()</text>
<rect x="174" y="180" width="120" height="28" rx="4" class="fg-b"/><text x="234" y="198" text-anchor="middle" class="fg-t sm mono">shuffle()</text>
<text x="165" y="228" text-anchor="middle" class="fg-t sm warm">同名：後載入的蓋掉先載入的</text>
<line x1="330" y1="14" x2="330" y2="240" class="fg-l dim dash"/>
<text x="497" y="24" text-anchor="middle" class="fg-t lg">現在：每個檔案一個模組</text>
<rect x="345" y="44" width="125" height="82" rx="8" class="fg-b alt"/>
<text x="407" y="66" text-anchor="middle" class="fg-t mono">cards.ts</text>
<text x="407" y="90" text-anchor="middle" class="fg-t sm">export DECK_SIZE</text>
<text x="407" y="110" text-anchor="middle" class="fg-t sm">secret（私有）</text>
<rect x="525" y="44" width="125" height="82" rx="8" class="fg-b alt"/>
<text x="587" y="66" text-anchor="middle" class="fg-t mono">game.ts</text>
<text x="587" y="90" text-anchor="middle" class="fg-t sm">score（私有）</text>
<text x="587" y="110" text-anchor="middle" class="fg-t sm">用 DECK_SIZE</text>
<line x1="525" y1="85" x2="478" y2="85" class="fg-l on"/><polygon points="470,85 478,80.5 478,89.5" class="fg-a on"/>
<text x="497" y="77" text-anchor="middle" class="fg-t sm acc">import</text>
<rect x="525" y="160" width="125" height="72" rx="8" class="fg-b alt"/>
<text x="587" y="182" text-anchor="middle" class="fg-t mono">ui.ts</text>
<text x="587" y="204" text-anchor="middle" class="fg-t sm">score（私有）</text>
<text x="587" y="222" text-anchor="middle" class="fg-t sm">export show()</text>
<line x1="587" y1="126" x2="587" y2="152" class="fg-l on"/><polygon points="587,160 582.5,152 591.5,152" class="fg-a on"/>
<text x="595" y="146" class="fg-t sm acc">import</text>
<text x="420" y="180" text-anchor="middle" class="fg-t sm">兩個 score</text>
<text x="420" y="198" text-anchor="middle" class="fg-t sm">各在自己的房間</text>
<text x="420" y="216" text-anchor="middle" class="fg-t sm acc">互不干擾</text>
</svg><figcaption>以前所有檔案都寫在同一張白板（window）上，同名就互相覆蓋。模組讓每個檔案有自己的房間；綠色箭頭是 import，從「使用的一方」指向「提供的一方」，這一章的圖都用這個方向。</figcaption></figure>
<p>而且順序全靠人記：b.js 用到 a.js 的函式，a.js 的標籤就一定要放前面。檔案一多，沒人敢動順序。</p>
<p><b>模組</b>（module）把白板換成一間一間的房間。每個檔案有自己的作用域（scope），裡面的名字別人看不到；要分享，就明白寫出 export；要用別人的東西，就明白寫出 import。這帶來三個好處：</p>
<ul>
<li><b>不會撞名</b>：game.ts 和 ui.ts 各有一個私有的 <code>score</code>，彼此不相干。</li>
<li><b>相依關係寫在檔案裡</b>：誰需要誰，看 import 就知道，順序由載入器自己排。</li>
<li><b>工具可以事先分析</b>：import 寫在固定位置、用固定字串，程式還沒跑，打包工具就能畫出整個專案的相依圖。搖樹最佳化、程式碼切分，都建立在這一點上。</li>
</ul>
<h4>一段很短的歷史，幫你看懂舊程式</h4>
<table>
<tr><th>年代</th><th>做法</th><th>你會在哪裡遇到</th></tr>
<tr><td>2000 年代</td><td>全域變數，加上立即執行函式（IIFE）<code>(function () { ... })()</code>，用函式包出一個私有空間</td><td>很舊的 jQuery 外掛</td></tr>
<tr><td>2009 年起</td><td><b>CommonJS</b>（CJS）：<code>require()</code> 和 <code>module.exports</code>，Node.js 採用</td><td>Node 舊專案、許多 npm 套件的輸出</td></tr>
<tr><td>2015 年</td><td><b>ES 模組</b>（ECMAScript modules，ESM）寫進語言標準：<code>import</code>、<code>export</code></td><td>現在的 Vue、Vite、Cocos Creator 3.x 的腳本、新版 Node</td></tr>
</table>
<p>在 TypeScript 裡，你寫的永遠是 ESM 的語法，但它可以輸出成不同的格式，這就是 <code>tsconfig.json</code> 裡 <code>module</code> 這個設定在管的事。在 Vite 專案裡，TypeScript 其實只負責檢查型別，把型別擦掉、輸出 JavaScript 的工作交給 esbuild 這類工具；Cocos Creator 也有自己的編譯流程。你寫的語法一樣，背後真正執行的格式卻可能不一樣，這一點這一章會一直回來。</p>

<h3><span class="badge lv1">基礎</span>二、ESM 和 CommonJS 真正的差別：活的綁定 vs 拷貝</h3>
<p>兩種寫法不只是語法不同，語意有一個根本的差別。下面兩組都可以存成檔案，用 Node 直接跑：</p>
<pre><code>// counter.mjs
export let count = 0;
export function inc() { count += 1; }

// main.mjs
import { count, inc } from './counter.mjs';
console.log(count);   // 0
inc();
console.log(count);   // 1：讀的是 counter.mjs 裡那一格
count = 5;            // TypeError</code></pre>
<pre><code>// counter.cjs
let count = 0;
function inc() { count += 1; }
module.exports = { count, inc };

// main.cjs
const { count, inc } = require('./counter.cjs');
console.log(count);   // 0
inc();
console.log(count);   // 0：拿到的是 require 那一刻抄下來的值</code></pre>
<figure class="figure"><svg viewBox="0 0 700 200" class="fg" style="width:100%;max-width:700px" role="img" aria-label="左邊 ESM：main.mjs 的 count 是一條指向 counter.mjs 那一格的連線，對方改成 1 就讀到 1；右邊 CommonJS：值被拷貝進 exports 物件，再拷貝進 main，之後停在 0">
<text x="165" y="22" text-anchor="middle" class="fg-t lg">ESM：活的綁定</text>
<rect x="15" y="40" width="135" height="84" rx="8" class="fg-b"/>
<text x="82" y="60" text-anchor="middle" class="fg-t mono">counter.mjs</text>
<rect x="29" y="74" width="107" height="32" rx="5" class="fg-b hot"/>
<text x="82" y="94" text-anchor="middle" class="fg-t sm mono">count = 1</text>
<rect x="195" y="40" width="125" height="84" rx="8" class="fg-b"/>
<text x="257" y="60" text-anchor="middle" class="fg-t mono">main.mjs</text>
<rect x="215" y="74" width="85" height="32" rx="5" class="fg-b alt"/>
<text x="257" y="94" text-anchor="middle" class="fg-t sm mono">count</text>
<line x1="215" y1="90" x2="144" y2="90" class="fg-l on"/><polygon points="136,90 144,85.5 144,94.5" class="fg-a on"/>
<text x="172" y="70" text-anchor="middle" class="fg-t sm acc">同一格</text>
<text x="165" y="148" text-anchor="middle" class="fg-t sm">main 讀 count 時，直接去 counter 那一格看</text>
<text x="165" y="168" text-anchor="middle" class="fg-t sm acc">inc() 之前讀到 0，之後讀到 1</text>
<text x="165" y="188" text-anchor="middle" class="fg-t sm">連線是唯讀的：main 不能寫 count</text>
<line x1="335" y1="12" x2="335" y2="194" class="fg-l dim dash"/>
<text x="520" y="22" text-anchor="middle" class="fg-t lg">CommonJS：拷貝</text>
<rect x="345" y="40" width="105" height="84" rx="8" class="fg-b"/>
<text x="397" y="60" text-anchor="middle" class="fg-t sm mono">counter.cjs</text>
<rect x="355" y="74" width="85" height="32" rx="5" class="fg-b hot"/>
<text x="397" y="94" text-anchor="middle" class="fg-t sm mono">count = 1</text>
<rect x="478" y="40" width="95" height="84" rx="8" class="fg-b"/>
<text x="525" y="60" text-anchor="middle" class="fg-t sm mono">exports</text>
<rect x="486" y="74" width="79" height="32" rx="5" class="fg-b warm"/>
<text x="525" y="94" text-anchor="middle" class="fg-t sm mono">count: 0</text>
<rect x="600" y="40" width="95" height="84" rx="8" class="fg-b"/>
<text x="647" y="60" text-anchor="middle" class="fg-t sm mono">main.cjs</text>
<rect x="608" y="74" width="79" height="32" rx="5" class="fg-b warm"/>
<text x="647" y="94" text-anchor="middle" class="fg-t sm mono">count = 0</text>
<line x1="450" y1="90" x2="470" y2="90" class="fg-l"/><polygon points="478,90 470,85.5 470,94.5" class="fg-a"/>
<text x="464" y="70" text-anchor="middle" class="fg-t sm">拷貝</text>
<line x1="573" y1="90" x2="592" y2="90" class="fg-l"/><polygon points="600,90 592,85.5 592,94.5" class="fg-a"/>
<text x="586" y="70" text-anchor="middle" class="fg-t sm">拷貝</text>
<text x="520" y="148" text-anchor="middle" class="fg-t sm">module.exports 那一行執行時，把 0 抄走</text>
<text x="520" y="168" text-anchor="middle" class="fg-t sm warm">inc() 之後，main 還是 0</text>
<text x="520" y="188" text-anchor="middle" class="fg-t sm">連 exports 物件裡的也停在 0</text>
</svg><figcaption>左：ESM 的 import 是一條指向原本那一格的唯讀連線，對方改了，你就看到。右：CommonJS 在 module.exports 那一行把值放進一個普通物件，解構時再抄一份，之後三個地方各走各的。</figcaption></figure>
<p>ESM 的 import 不是「把值拿過來」，而是建立一個<b>活的綁定</b>（live binding）：main.mjs 的 <code>count</code> 直接連到 counter.mjs 裡的那個變數，每次讀都去那一格看現在的值。而且這條連線是唯讀的，只有擁有那個變數的模組能改它，所以 main.mjs 寫 <code>count = 5</code> 會丟出 TypeError。</p>
<p>CommonJS 就單純多了。<code>module.exports = { count, inc }</code> 這一行執行的當下，把 <code>count</code> 的值 0 放進一個普通物件；<code>require()</code> 回傳那個物件，解構再抄一次。之後 counter.cjs 裡的變數怎麼變，都跟這兩份拷貝無關。</p>
<div class="note"><b>一個實用的結論：</b>想讓別的模組看到「會變的狀態」，不要 export 一個 let，然後期待大家永遠讀到最新值。換一種輸出格式、或有人改用解構，它就默默壞了。export 一個讀取函式 <code>getCount()</code>，或一個物件、一個 store，最穩。Pinia 的 store、遊戲裡的各種管理器，都是這樣做。</div>
<h4>其他幾個你會踩到的差別</h4>
<table>
<tr><th></th><th>ES 模組</th><th>CommonJS</th></tr>
<tr><td>相依關係何時決定</td><td>執行之前。import 只能寫在最外層，路徑必須是固定字串</td><td>執行時。<code>require()</code> 是普通函式，可以寫在 if 裡，路徑可以是變數</td></tr>
<tr><td>載入方式</td><td>先把整張圖都載好、連好，再開始執行</td><td>跑到哪一行 <code>require</code>，就當場同步讀檔、執行</td></tr>
<tr><td>最外層 await</td><td>可以（top-level await）</td><td>不行</td></tr>
<tr><td>Node 怎麼判斷</td><td><code>.mjs</code>，或 <code>package.json</code> 寫了 <code>"type": "module"</code> 的 <code>.js</code></td><td><code>.cjs</code>，或沒寫 <code>"type"</code> 的 <code>.js</code></td></tr>
<tr><td>能不能搖樹</td><td>容易，結構是靜態的</td><td>很難，<code>module.exports</code> 可以在執行時任意改</td></tr>
</table>
<p>第一列是所有差別的根源：ESM 的相依關係在「執行之前」就完全確定，所以工具能事先分析；CommonJS 要「跑了才知道」。</p>
<h4>TypeScript 輸出成 CommonJS 時，怎麼保住活的綁定</h4>
<p>如果你在 tsconfig 選 <code>"module": "CommonJS"</code>，TypeScript 會替你模擬活的綁定。用 TS 5.9 實測，<code>export let count = 0</code> 和 <code>inc()</code> 會被輸出成：</p>
<pre><code>// tsc 輸出的 JavaScript（節錄）
exports.count = 0;
function inc() { exports.count += 1; }
// 另一個檔案裡的 import { count } 變成：
const counter_1 = require("./counter");
console.log(counter_1.count);</code></pre>
<p>寫入都寫到 <code>exports.count</code>，讀取都寫成 <code>counter_1.count</code>，到用的那一刻才去讀屬性，效果就跟活的綁定一樣。bundle 裡那些 <code>counter_1.count</code> 怪名字，就是編譯器刻意保留的「去那一格看」。</p>

<h3><span class="badge lv2">進階</span>三、模組解析：一串字怎麼變成一個檔案</h3>
<p><code>from</code> 後面那串字叫<b>模組指定字串</b>（module specifier）。把它對應到磁碟上一個真正的檔案，叫<b>模組解析</b>（module resolution）。要注意的是，這件事至少有兩個人各做一次：TypeScript 為了檢查型別找一次，打包工具（或 Node、或瀏覽器）為了真的執行再找一次。兩邊規則不一樣，就會出現「編輯器沒紅線，跑起來卻找不到」。</p>
<figure class="figure"><svg viewBox="0 0 690 260" class="fg" style="width:100%;max-width:690px" role="img" aria-label="三種模組指定字串的解析過程：相對路徑依序嘗試副檔名，套件名沿著資料夾往上找 node_modules 再讀 package.json，路徑別名先依 tsconfig paths 換成真正路徑">
<text x="95" y="22" text-anchor="middle" class="fg-t acc">你寫的字串</text>
<text x="440" y="22" text-anchor="middle" class="fg-t acc">解析器依序嘗試，找到就停</text>
<rect x="15" y="40" width="160" height="44" rx="6" class="fg-b alt"/>
<text x="95" y="59" text-anchor="middle" class="fg-t mono">'./cards'</text>
<text x="95" y="76" text-anchor="middle" class="fg-t sm">相對路徑</text>
<line x1="175" y1="62" x2="190" y2="62" class="fg-l"/><polygon points="198,62 190,57.5 190,66.5" class="fg-a"/>
<rect x="198" y="42" width="105" height="40" rx="5" class="fg-b hot"/><text x="250" y="66" text-anchor="middle" class="fg-t sm mono">cards.ts ✓</text>
<line x1="303" y1="62" x2="314" y2="62" class="fg-l dim dash"/><polygon points="322,62 314,57.5 314,66.5" class="fg-a"/>
<rect x="322" y="42" width="105" height="40" rx="5" class="fg-b"/><text x="374" y="66" text-anchor="middle" class="fg-t sm mono">cards.tsx</text>
<line x1="427" y1="62" x2="438" y2="62" class="fg-l dim dash"/><polygon points="446,62 438,57.5 438,66.5" class="fg-a"/>
<rect x="446" y="42" width="105" height="40" rx="5" class="fg-b"/><text x="498" y="66" text-anchor="middle" class="fg-t sm mono">cards.d.ts</text>
<line x1="551" y1="62" x2="562" y2="62" class="fg-l dim dash"/><polygon points="570,62 562,57.5 562,66.5" class="fg-a"/>
<rect x="570" y="42" width="112" height="40" rx="5" class="fg-b"/><text x="626" y="66" text-anchor="middle" class="fg-t sm mono">cards/index.ts</text>
<text x="440" y="100" text-anchor="middle" class="fg-t sm">前一個不存在，才試下一個</text>
<rect x="15" y="118" width="160" height="44" rx="6" class="fg-b alt"/>
<text x="95" y="137" text-anchor="middle" class="fg-t mono">'tiny-tween'</text>
<text x="95" y="154" text-anchor="middle" class="fg-t sm">套件名，從 src/game 出發</text>
<line x1="175" y1="140" x2="190" y2="140" class="fg-l"/><polygon points="198,140 190,135.5 190,144.5" class="fg-a"/>
<rect x="198" y="118" width="105" height="44" rx="5" class="fg-b"/><text x="250" y="137" text-anchor="middle" class="fg-t sm mono">src/game/</text><text x="250" y="154" text-anchor="middle" class="fg-t sm">node_modules ✗</text>
<line x1="303" y1="140" x2="314" y2="140" class="fg-l"/><polygon points="322,140 314,135.5 314,144.5" class="fg-a"/>
<rect x="322" y="118" width="105" height="44" rx="5" class="fg-b"/><text x="374" y="137" text-anchor="middle" class="fg-t sm mono">src/</text><text x="374" y="154" text-anchor="middle" class="fg-t sm">node_modules ✗</text>
<line x1="427" y1="140" x2="438" y2="140" class="fg-l"/><polygon points="446,140 438,135.5 438,144.5" class="fg-a"/>
<rect x="446" y="118" width="105" height="44" rx="5" class="fg-b hot"/><text x="498" y="137" text-anchor="middle" class="fg-t sm">專案根目錄</text><text x="498" y="154" text-anchor="middle" class="fg-t sm">node_modules ✓</text>
<line x1="551" y1="140" x2="562" y2="140" class="fg-l"/><polygon points="570,140 562,135.5 562,144.5" class="fg-a"/>
<rect x="570" y="118" width="112" height="44" rx="5" class="fg-b alt"/><text x="626" y="137" text-anchor="middle" class="fg-t sm mono">package.json</text><text x="626" y="154" text-anchor="middle" class="fg-t sm">exports → 檔案</text>
<text x="440" y="180" text-anchor="middle" class="fg-t sm">沒有就往上一層資料夾再找，一路到根目錄</text>
<rect x="15" y="200" width="160" height="44" rx="6" class="fg-b alt"/>
<text x="95" y="219" text-anchor="middle" class="fg-t mono">'@/utils/format'</text>
<text x="95" y="236" text-anchor="middle" class="fg-t sm">路徑別名</text>
<line x1="175" y1="222" x2="190" y2="222" class="fg-l"/><polygon points="198,222 190,217.5 190,226.5" class="fg-a"/>
<rect x="198" y="200" width="105" height="44" rx="5" class="fg-b alt"/><text x="250" y="219" text-anchor="middle" class="fg-t sm mono">tsconfig paths</text><text x="250" y="236" text-anchor="middle" class="fg-t sm mono">@/* → src/*</text>
<line x1="303" y1="222" x2="314" y2="222" class="fg-l"/><polygon points="322,222 314,217.5 314,226.5" class="fg-a"/>
<rect x="322" y="200" width="105" height="44" rx="5" class="fg-b hot"/><text x="374" y="219" text-anchor="middle" class="fg-t sm mono">src/utils/</text><text x="374" y="236" text-anchor="middle" class="fg-t sm mono">format.ts ✓</text>
<text x="446" y="219" class="fg-t sm warm">打包工具不讀 paths：</text>
<text x="446" y="236" class="fg-t sm warm">Vite 要另外設 resolve.alias</text>
</svg><figcaption>同一串字有三種找法。編輯器裡的 TypeScript 和打包工具各自照這套規則找一次，任何一邊的地圖少了一塊，就會出現「一邊找得到、一邊找不到」。</figcaption></figure>
<h4>三種字串，三種找法</h4>
<ol>
<li><b>相對路徑</b>（<code>./</code>、<code>../</code> 開頭）：從「寫這行 import 的檔案」所在的資料夾算起。沒寫副檔名時，TypeScript 依序試 <code>cards.ts</code>、<code>cards.tsx</code>、<code>cards.d.ts</code>；都沒有，就把 <code>cards</code> 當成資料夾，找裡面的 <code>index.ts</code>。打包工具也有一份自己的嘗試清單（Vite 是 <code>resolve.extensions</code>）。</li>
<li><b>套件名</b>（bare specifier，例如 <code>'vue'</code>、<code>'tiny-tween'</code>）：從目前檔案的資料夾開始，找旁邊的 <code>node_modules/tiny-tween</code>；沒有就往上一層再找，一路找到磁碟的根目錄。找到套件資料夾後，讀它的 <code>package.json</code>，看 <code>exports</code>（新）或 <code>main</code>、<code>types</code>（舊）欄位，決定真正的檔案。</li>
<li><b>路徑別名</b>（例如 <code>'@/utils/format'</code>）：先依 <code>tsconfig.json</code> 的 <code>paths</code> 換成真正的路徑，再照相對路徑的規則找。打包工具不讀 paths，要在它自己的設定裡再寫一次。</li>
</ol>
<p>所以別名要設兩次：兩個解析器，各自需要一份地圖。典型的 Vite 加 Vue 專案長這樣：</p>
<pre><code>// tsconfig.json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "paths": { "@/*": ["./src/*"] }
  }
}</code></pre>
<pre><code>// vite.config.ts
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});</code></pre>
<p><code>exports</code> 也是套件的「正門清單」：沒列出來的內部路徑，例如 <code>tiny-tween/dist/internal.js</code>，Node 會丟 <code>ERR_PACKAGE_PATH_NOT_EXPORTED</code>。這是刻意的設計，內部檔案隨時會改名。</p>
<h4>moduleResolution：告訴 TypeScript「誰」會真的去找檔案</h4>
<p><code>moduleResolution</code> 的意思不是「你喜歡哪種規則」，而是「最後實際執行的那個環境用哪種規則，請 TypeScript 模仿它」。選錯了，TypeScript 就會用錯的規則幫你檢查。</p>
<table>
<tr><th>設定值</th><th>模仿誰</th><th>重點</th></tr>
<tr><td><code>bundler</code>（TS 5.0 起）</td><td>Vite、webpack、esbuild 這類打包工具</td><td>相對路徑可以不寫副檔名，看得懂 <code>exports</code>。前端專案選它</td></tr>
<tr><td><code>node16</code>、<code>nodenext</code></td><td>真正的 Node.js</td><td>ESM 檔案裡的相對路徑<b>一定要寫副檔名</b>，而且要寫輸出後的 <code>.js</code>：<code>import { x } from './cards.js'</code>，即使原始檔是 cards.ts。給 Node 直接跑的後端、要發佈的套件選它</td></tr>
<tr><td><code>node10</code>（舊名 <code>node</code>）</td><td>舊版 Node 的 CommonJS 規則</td><td>不認得 <code>exports</code>。舊專案常見，新專案不要選</td></tr>
</table>
<p>資料夾裡只有 cards.ts，卻寫 <code>import './cards.js'</code>，其實是對的：TypeScript 不改寫路徑，而執行時 Node 看到的確實是 cards.js。</p>
<h4>不要猜，讓它印出來：--traceResolution</h4>
<pre><code>npx tsc --noEmit --traceResolution | grep -A 12 "Resolving module 'tiny-tween'"</code></pre>
<p>輸出會一行一行告訴你：試了哪個路徑、哪個不存在、讀了哪一份 package.json、最後用了哪一個 .d.ts。另一個好用的旗標是 <code>--explainFiles</code>，它會說明每一個被納入編譯的檔案，是因為誰才被拉進來的。</p>

<h3><span class="badge lv2">進階</span>四、打包工具怎麼畫出相依圖</h3>
<p>打包工具的第一份工作，是把你的專案畫成一張<b>相依圖</b>（dependency graph）：每個模組是一個點，每一行 import 是一條箭頭。步驟其實很機械：</p>
<ol>
<li>從進入點開始。Vite 的進入點是 <code>index.html</code> 裡那一行 <code>&lt;script type="module" src="/src/main.ts"&gt;</code>。</li>
<li>讀檔，把 TypeScript 轉成 JavaScript，再解析成語法樹（AST）。</li>
<li>在語法樹裡找出所有 import 和 export，記下「這個模組需要哪些名字、提供哪些名字」。</li>
<li>把每個指定字串解析成絕對路徑，就是上一節那套規則。<b>同一個絕對路徑只算一個點</b>，不管被 import 幾次。</li>
<li>對每個新找到的模組重複第 2 步，直到沒有新的點為止。</li>
</ol>
<p>第 4 步代表模組只執行一次，大家拿到同一份。這就是「模組本身就是單例」的原因。</p>
<h4>開發模式和正式建置是兩條不同的路</h4>
<p>Vite 在開發時（<code>npm run dev</code>）其實不打包。瀏覽器本來就看得懂 ESM，Vite 只在瀏覽器要某個檔案時，把那一個 .ts 或 .vue 即時轉好送過去，所以改一個檔案，畫面幾乎立刻更新。例外是 node_modules 裡的套件：Vite 會先把它們預先打包（dependency pre-bundling），因為有些套件內部有幾百個小模組（Vite 文件舉的例子是 lodash-es，超過 600 個），而且有些套件只提供 CommonJS。</p>
<p>正式建置（<code>npm run build</code>）才真的畫完整張圖、合併、壓縮、加上指紋檔名。Vite 長期把這一步交給 Rollup，較新的版本改用 Vite 團隊以 Rust 寫成、介面跟 Rollup 相容的 Rolldown。兩條路的工具和順序都不一樣，所以「dev 好好的、build 之後壞掉」是一種獨立的 bug 類型。第一步永遠是在本機跑 <code>npm run build</code> 再 <code>npm run preview</code>，在正式的產物上重現它。</p>

<h3><span class="badge lv2">進階</span>五、搖樹最佳化：沒人用的就丟掉，但副作用不能丟</h3>
<figure class="figure"><svg viewBox="0 0 680 300" class="fg" style="width:100%;max-width:680px" role="img" aria-label="相依圖：main.ts 匯入 game.ts，game.ts 匯入 cards.ts 和 ui.ts，ui.ts 匯入 format.ts，並用 import() 動態載入 settings.ts。輸出時 cards.ts 只留 isHigher，settings 切成另一個檔案">
<text x="190" y="18" text-anchor="middle" class="fg-t lg">相依圖</text>
<text x="560" y="18" text-anchor="middle" class="fg-t lg">輸出的檔案</text>
<rect x="15" y="40" width="100" height="40" rx="6" class="fg-b hot"/><text x="65" y="57" text-anchor="middle" class="fg-t mono">main.ts</text><text x="65" y="73" text-anchor="middle" class="fg-t sm">進入點</text>
<rect x="140" y="40" width="100" height="40" rx="6" class="fg-b"/><text x="190" y="65" text-anchor="middle" class="fg-t mono">game.ts</text>
<rect x="265" y="28" width="115" height="64" rx="6" class="fg-b"/><text x="322" y="47" text-anchor="middle" class="fg-t mono">cards.ts</text>
<text x="322" y="66" text-anchor="middle" class="fg-t sm acc">isHigher：用到</text>
<text x="322" y="83" text-anchor="middle" class="fg-t sm warm">shuffle：沒人用</text>
<rect x="140" y="130" width="100" height="40" rx="6" class="fg-b"/><text x="190" y="155" text-anchor="middle" class="fg-t mono">ui.ts</text>
<rect x="265" y="130" width="115" height="40" rx="6" class="fg-b"/><text x="322" y="155" text-anchor="middle" class="fg-t mono">format.ts</text>
<rect x="140" y="220" width="100" height="40" rx="6" class="fg-b warm"/><text x="190" y="237" text-anchor="middle" class="fg-t mono">settings.ts</text><text x="190" y="253" text-anchor="middle" class="fg-t sm">動態載入</text>
<line x1="115" y1="60" x2="132" y2="60" class="fg-l"/><polygon points="140,60 132,55.5 132,64.5" class="fg-a"/>
<line x1="240" y1="60" x2="257" y2="60" class="fg-l"/><polygon points="265,60 257,55.5 257,64.5" class="fg-a"/>
<line x1="190" y1="80" x2="190" y2="122" class="fg-l"/><polygon points="190,130 185.5,122 194.5,122" class="fg-a"/>
<line x1="240" y1="150" x2="257" y2="150" class="fg-l"/><polygon points="265,150 257,145.5 257,154.5" class="fg-a"/>
<line x1="190" y1="170" x2="190" y2="212" class="fg-l warm dash"/><polygon points="190,220 185.5,212 194.5,212" class="fg-a warm"/>
<text x="198" y="200" class="fg-t sm warm">import()</text>
<path d="M240 240 H322 V178" class="fg-l"/><polygon points="322,170 317.5,178 326.5,178" class="fg-a"/>
<line x1="392" y1="100" x2="447" y2="100" class="fg-l on"/><polygon points="455,100 447,95.5 447,104.5" class="fg-a on"/>
<text x="423" y="92" text-anchor="middle" class="fg-t sm acc">打包</text>
<line x1="392" y1="235" x2="447" y2="235" class="fg-l warm dash"/><polygon points="455,235 447,230.5 447,239.5" class="fg-a warm"/>
<text x="423" y="227" text-anchor="middle" class="fg-t sm warm">切分</text>
<rect x="455" y="40" width="210" height="120" rx="8" class="fg-b hot"/>
<text x="560" y="62" text-anchor="middle" class="fg-t mono">index-3f9a.js</text>
<text x="560" y="86" text-anchor="middle" class="fg-t sm">main、game、ui、format</text>
<text x="560" y="106" text-anchor="middle" class="fg-t sm">cards 只留 isHigher</text>
<text x="560" y="132" text-anchor="middle" class="fg-t sm acc">打開頁面就下載</text>
<rect x="455" y="200" width="210" height="70" rx="8" class="fg-b warm"/>
<text x="560" y="222" text-anchor="middle" class="fg-t mono">settings-71c2.js</text>
<text x="560" y="242" text-anchor="middle" class="fg-t sm">只有 settings</text>
<text x="560" y="260" text-anchor="middle" class="fg-t sm warm">第一次打開設定才下載</text>
<text x="15" y="290" class="fg-t sm">實線：靜態 import　　虛線：動態 import()　　箭頭從使用的一方指向被用的一方</text>
</svg><figcaption>打包工具從 main.ts 出發，順著 import 畫出整張圖。沒人用的 shuffle 被搖掉；被 import() 動態載入的 settings.ts 自己切成一個檔案。format.ts 兩邊都用到，但主檔本來就一定會下載，所以它留在主檔裡。</figcaption></figure>
<p>有了相依圖，<b>搖樹最佳化</b>（tree shaking）就是從進入點出發，標記「真的被用到的 export」，沒被標記到的就不放進輸出。想像抓著樹幹用力搖，沒連在樹上的枯葉就掉下來。上圖的 <code>shuffle</code> 雖然有 export，但整個專案沒有人 import 它，於是它不會出現在 bundle 裡。</p>
<p>這件事只有在結構是靜態的時候才做得到。ESM 的 import 是固定的字串、固定的名字，工具不必執行程式，就能確定誰用了誰。CommonJS 的 <code>require(name)</code> 可以是變數，<code>module.exports</code> 可以在執行時被改寫，工具只好整包留下。這就是為什麼同一個工具函式庫，ESM 版（例如 lodash-es）可以只打包你用到的那幾個函式，CommonJS 版（lodash）卻常常整包進來。</p>
<h4>副作用：為什麼工具不敢丟</h4>
<p>難的是另一半：一個模組被 import 了，但它的 export 一個都沒被用到，可以整個丟掉嗎？要看它有沒有<b>副作用</b>（side effect），也就是「光是執行這個檔案，就會改變外面的世界」：</p>
<pre><code>// register-keys.ts
export const KEY_COUNT = 3;
// 副作用：一載入就掛監聽
window.addEventListener('keydown', () =&gt; console.log('key'));

// theme.ts
// 副作用：一載入就改頁面
document.documentElement.dataset.theme = 'dark';
export {};

// main.ts
import './theme';            // 只為了副作用而 import，什麼名字都不拿
import { KEY_COUNT } from './register-keys';
console.log(KEY_COUNT);</code></pre>
<p>這兩種情況，打包工具都必須保留：<code>import './theme'</code> 什麼名字都沒拿，但你就是要它跑；register-keys.ts 裡就算 <code>KEY_COUNT</code> 沒人用，那個監聽也要掛上去。工具無法證明一段程式「沒有副作用」的時候，只能保守地留下。所以：</p>
<ul>
<li>套件可以在 <code>package.json</code> 寫 <code>"sideEffects": false</code>，向打包工具保證「我的檔案光是 import 不會做任何事，沒用到就整個丟掉」。有例外就列出來：<code>"sideEffects": ["*.css", "./src/polyfill.js"]</code>。webpack、Vite 和 esbuild 都會參考它。寫錯的後果是：真的有副作用的檔案被丟掉，功能在正式版莫名其妙消失，而 dev 模式完全正常。</li>
<li>函式呼叫前加 <code>/*#__PURE__*/</code> 註解，告訴工具「這個呼叫的結果如果沒人用，可以整個拿掉」。函式庫的建置輸出裡常看到它。</li>
<li>你自己的程式：讓模組的最外層只做宣告，真正會做事的程式包在函式裡，由進入點明確呼叫。這不只讓搖樹更有效，也讓模組的載入順序不再重要。下一節的循環匯入，會再看到這個好處。</li>
</ul>
<h4>barrel 檔：方便，但有代價</h4>
<p>很多專案在每個資料夾放一個 <code>index.ts</code>，把裡面所有檔案的 export 集中轉出去，讓外面可以寫 <code>import { Deck, isHigher } from '@/game'</code>。這種檔案叫 barrel file。方便，但要知道兩個代價：</p>
<ul>
<li><b>開發模式變慢</b>：dev 模式不搖樹，你從 barrel 拿一個名字，瀏覽器就得載入 barrel 轉出的每一個模組。Vite 的效能指南直接建議避免 barrel 檔。正式建置時，只要那些檔案沒有副作用，多半還是搖得掉。</li>
<li><b>藏起循環</b>：game 資料夾裡的檔案如果也寫 <code>from '@/game'</code>，它就繞回自己資料夾的 index.ts，很容易形成一個從檔名完全看不出來的圈。規則很簡單：<b>資料夾內部互相 import 用相對路徑，只有外部才走 barrel</b>。</li>
</ul>

<h3><span class="badge lv2">進階</span>六、程式碼切分與動態 import</h3>
<p>靜態 import 寫在最外層，執行前就全部載入。<code>import()</code> 則是執行時才呼叫的函式，它回傳一個 Promise；等它下載並執行完那個模組，你就拿到一個物件，上面是那個模組所有的 export（module namespace object）：</p>
<pre><code>// settings-panel.ts
export function openSettings(volume: number): string {
  return 'settings opened, volume ' + volume;
}

// menu.ts
export async function onSettingsClick(): Promise&lt;void&gt; {
  const panel = await import('./settings-panel');   // 第一次點才下載
  console.log(panel.openSettings(80));
}</code></pre>
<p>打包工具看到 <code>import('./settings-panel')</code>，就把 settings-panel 和「只有它用到」的模組切成一個獨立的檔案（chunk），這叫<b>程式碼切分</b>（code splitting）。主 bundle 變小，首頁更快出現；設定畫面在第一次打開時才下載。之後再呼叫 <code>import()</code>，拿到的是同一個已經載好的模組，不會重新下載，也不會重新執行。Vue Router 的延遲載入頁面 <code>component: () =&gt; import('./views/SettingsView.vue')</code>，用的就是這一招。</p>
<h4>切分的規則和陷阱</h4>
<ul>
<li><b>共用的模組放哪裡</b>：如果兩個動態載入的 chunk 都用到 <code>format.ts</code>，工具會把它抽成第三個共用 chunk，避免下載兩次；如果進入點本來就靜態 import 了它，它就留在主 bundle。</li>
<li><b>同時被靜態 import，就切不出去</b>：如果 main.ts 也靜態 import 了 settings-panel，它本來就在主檔裡，動態 import 就沒有意義了。Vite 建置時會警告：<code>... is dynamically imported by ... but also statically imported by ..., dynamic import will not move module into another chunk.</code> 看到這行，就去找那個多出來的靜態 import。</li>
<li><b>路徑要讓工具看得到</b>：<code>import('./levels/' + name)</code> 這種由變數組成的路徑，工具無法事先知道會載入什麼。Vite 對「固定前綴加變數」有有限的支援；更明確的做法是 <code>import.meta.glob('./levels/*.ts')</code>，讓工具在建置時就展開成一張檔案清單。</li>
<li><b>部署之後的舊頁面</b>：使用者開著舊版頁面，你部署了新版，舊的 chunk 檔被刪掉。他這時才去點設定，瀏覽器去抓舊檔名，得到 404，主控台出現 <code>Failed to fetch dynamically imported module</code>。對策是部署時把上一版的檔案多留一段時間，或在 Vite 裡監聽 <code>vite:preloadError</code> 事件，抓到就重新整理頁面。</li>
<li><b>切太碎也不好</b>：每個 chunk 都是一次網路請求，還可能「下載完 A 才知道要 B」。以「一整個畫面」或「一個大功能」為單位切，最常見。</li>
</ul>

<h3><span class="badge lv3">專業</span>七、執行的那一刻：ESM 的三個階段</h3>
<p>要真正懂循環匯入，得先看 ESM 載入的過程。它分成三個階段，而且每一個階段都是先對整張圖做完，才進下一個：</p>
<figure class="figure"><svg viewBox="0 0 680 280" class="fg" style="width:100%;max-width:680px" role="img" aria-label="上方：建構、連結、求值三個階段。下方：main 匯入 deck，deck 匯入 rules，rules 又回頭匯入 deck；求值順序是 rules 第一、deck 第二、main 第三，rules 執行時 DECK_SIZE 還沒有值">
<text x="340" y="20" text-anchor="middle" class="fg-t">每個階段都先對整張圖做完，才進下一個</text>
<rect x="15" y="34" width="200" height="56" rx="6" class="fg-b alt"/><text x="115" y="56" text-anchor="middle" class="fg-t alt">1 建構</text><text x="115" y="77" text-anchor="middle" class="fg-t sm">找檔、解析、列出 import</text>
<line x1="215" y1="62" x2="232" y2="62" class="fg-l"/><polygon points="240,62 232,57.5 232,66.5" class="fg-a"/>
<rect x="240" y="34" width="200" height="56" rx="6" class="fg-b alt"/><text x="340" y="56" text-anchor="middle" class="fg-t alt">2 連結</text><text x="340" y="77" text-anchor="middle" class="fg-t sm">替每個 export 準備空格子</text>
<line x1="440" y1="62" x2="457" y2="62" class="fg-l"/><polygon points="465,62 457,57.5 457,66.5" class="fg-a"/>
<rect x="465" y="34" width="200" height="56" rx="6" class="fg-b hot"/><text x="565" y="56" text-anchor="middle" class="fg-t acc">3 求值</text><text x="565" y="77" text-anchor="middle" class="fg-t sm">照後序執行，把值填進去</text>
<rect x="40" y="122" width="120" height="44" rx="6" class="fg-b"/><text x="100" y="149" text-anchor="middle" class="fg-t mono">main.ts</text>
<rect x="280" y="122" width="120" height="44" rx="6" class="fg-b"/><text x="340" y="149" text-anchor="middle" class="fg-t mono">deck.ts</text>
<rect x="520" y="122" width="120" height="44" rx="6" class="fg-b warm"/><text x="580" y="149" text-anchor="middle" class="fg-t mono">rules.ts</text>
<line x1="160" y1="144" x2="272" y2="144" class="fg-l"/><polygon points="280,144 272,139.5 272,148.5" class="fg-a"/>
<text x="220" y="136" text-anchor="middle" class="fg-t sm">import</text>
<line x1="400" y1="134" x2="512" y2="134" class="fg-l"/><polygon points="520,134 512,129.5 512,138.5" class="fg-a"/>
<text x="460" y="127" text-anchor="middle" class="fg-t sm">import</text>
<line x1="520" y1="155" x2="408" y2="155" class="fg-l warm dash"/><polygon points="400,155 408,150.5 408,159.5" class="fg-a warm"/>
<text x="460" y="182" text-anchor="middle" class="fg-t sm warm">回頭：已在進行中，跳過</text>
<circle cx="56" cy="212" r="12" class="fg-b hot"/><text x="56" y="216.5" text-anchor="middle" class="fg-t acc">3</text>
<text x="76" y="216.5" class="fg-t">第 3 個跑</text>
<circle cx="296" cy="212" r="12" class="fg-b hot"/><text x="296" y="216.5" text-anchor="middle" class="fg-t acc">2</text>
<text x="316" y="216.5" class="fg-t">第 2 個跑</text>
<circle cx="536" cy="212" r="12" class="fg-b warm"/><text x="536" y="216.5" text-anchor="middle" class="fg-t warm">1</text>
<text x="556" y="216.5" class="fg-t">第 1 個跑</text>
<text x="100" y="244" text-anchor="middle" class="fg-t sm">所有 import 都好了</text>
<text x="340" y="244" text-anchor="middle" class="fg-t sm">這時才設 DECK_SIZE</text>
<text x="580" y="244" text-anchor="middle" class="fg-t sm warm">DECK_SIZE 還是空格</text>
<text x="580" y="264" text-anchor="middle" class="fg-t sm mono warm">ReferenceError</text>
</svg><figcaption>求值是後序：rules.ts 的相依只剩那條回頭的箭頭，而它被跳過了，所以 rules.ts 第一個跑。可是它要的 DECK_SIZE 屬於第二個才跑的 deck.ts，格子還是空的。</figcaption></figure>
<ol>
<li><b>建構</b>（construction）：從進入點開始找檔案、下載、解析，列出每個模組的 import。這一步把整張相依圖建好，但一行程式都還沒執行。</li>
<li><b>連結</b>（linking，也叫實體化 instantiation）：替每個模組的每一個 export 在記憶體裡準備一格，再把每個 import 接到對應的那一格。活的綁定就是在這時候建立的。這時格子都還是空的，只有一個例外：<code>function</code> 宣告在這一步就已經放好了，這叫函式宣告的提升（hoisting）。</li>
<li><b>求值</b>（evaluation）：真正執行每個模組最外層的程式，把值填進格子。順序是後序（post-order）：一個模組要等它 import 的模組都跑完，自己才跑。所以最深的葉子先跑，進入點最後跑。</li>
</ol>
<p>沒有循環時，這個順序保證「你用到的東西一定已經準備好」。有循環時，後序走到那條回頭的箭頭，發現「這個模組已經在進行中」，就不再進去。上一課的 rules.ts 就這樣在 deck.ts 之前跑，而 <code>DECK_SIZE</code> 的格子還是空的。</p>
<h4>空的格子，三種結果</h4>
<p>用 <code>const</code>、<code>let</code>、<code>class</code> 宣告的 export，在填值之前處於<b>暫時死區</b>（temporal dead zone，TDZ）。用 Node 22 實際跑這三種情況，結果如下：</p>
<table>
<tr><th>情況</th><th>結果</th></tr>
<tr><td>原生 ESM，讀還沒填值的 <code>const</code></td><td><code>ReferenceError: Cannot access 'DECK_SIZE' before initialization</code></td></tr>
<tr><td>原生 ESM，呼叫對方還沒跑到的 <code>function</code> 宣告</td><td>可以正常呼叫，因為函式在連結階段就放好了。但如果函式裡又讀了還沒填值的 const，一樣丟錯</td></tr>
<tr><td>CommonJS，讀還沒設定的 <code>exports.DECK_SIZE</code></td><td>不報錯，拿到 <code>und&#101;fined</code>，算出 <code>NaN</code>。Node 只印一行警告：<code>Accessing non-existent property 'DECK_SIZE' of module exports inside circular dependency</code></td></tr>
</table>
<p>第三種最危險，因為程式不會停：<code>NaN</code> 一路往下傳，直到畫面顯示「剩下 NaN 回合」才被發現。class 的版本更常見：<code>class Boss extends Enemy</code> 而 Enemy 還沒準備好，會丟 <code>Class extends value und&#101;fined is not a constructor or null</code>。</p>
<h4>為什麼看起來那麼隨機</h4>
<p>循環裡誰先跑，取決於「誰先被別人 import」。換成別的檔案先 import rules.ts，順序就倒過來，bug 也跟著消失或換個地方出現。所以你只是調換兩行 import，一個不相干的畫面就可能壞掉。看到「改 import 順序就好了」不要高興：那代表你有一個循環，只是暫時被順序蓋住。</p>
<h4>Cocos Creator 特別容易踩到的地方</h4>
<p>元件類別上的裝飾器，是在 class 定義的那一刻執行的。<code>@property(EnemyView)</code> 會在模組最外層就讀取 <code>EnemyView</code> 這個值。如果 EnemyView 所在的模組和這個元件在同一個循環裡、還沒跑到，這裡拿到的就是空的。這完全符合上面的規則：裝飾器的參數，就是一種「最外層使用」。只拿來標註型別的地方，改用 <code>import type</code>，就少一條執行時的箭頭。</p>

<h3><span class="badge lv3">專業</span>八、循環相依：怎麼抓、怎麼拆</h3>
<h4>先讓工具找出來</h4>
<pre><code>npx madge --circular --extensions ts --ts-config tsconfig.json src
# 畫成圖（要先裝 Graphviz）
npx madge --image graph.svg --extensions ts src</code></pre>
<p><code>--ts-config</code> 讓 madge 看得懂你的路徑別名，不然所有 <code>@/</code> 開頭的 import 它都找不到，圈圈也就漏掉了。在 CI 裡，ESLint 的 <code>import/no-cycle</code> 規則（eslint-plugin-import，或相容的 eslint-plugin-import-x）能在新的循環被合併之前擋下來；它在大專案上比較慢，常見做法是只在 CI 跑，或用 <code>maxDepth</code> 限制深度。</p>
<h4>為什麼會長出循環：箭頭方向錯了</h4>
<figure class="figure"><svg viewBox="0 0 690 236" class="fg" style="width:100%;max-width:690px" role="img" aria-label="三格圖：之前 deck 和 rules 互相匯入；之後兩者都匯入一個不匯入任何人的 constants；右邊是分層規則，箭頭只往下，往上的箭頭是循環的種子">
<text x="105" y="22" text-anchor="middle" class="fg-t lg">之前：互相 import</text>
<rect x="35" y="50" width="140" height="40" rx="6" class="fg-b warm"/><text x="105" y="75" text-anchor="middle" class="fg-t mono">deck.ts</text>
<rect x="35" y="160" width="140" height="40" rx="6" class="fg-b warm"/><text x="105" y="185" text-anchor="middle" class="fg-t mono">rules.ts</text>
<line x1="80" y1="90" x2="80" y2="152" class="fg-l warm"/><polygon points="80,160 75.5,152 84.5,152" class="fg-a warm"/>
<line x1="130" y1="160" x2="130" y2="98" class="fg-l warm"/><polygon points="130,90 125.5,98 134.5,98" class="fg-a warm"/>
<text x="72" y="129" text-anchor="end" class="fg-t sm">import</text>
<text x="138" y="129" class="fg-t sm">import</text>
<text x="105" y="224" text-anchor="middle" class="fg-t sm warm">誰先跑，看載入順序</text>
<line x1="225" y1="12" x2="225" y2="230" class="fg-l dim dash"/>
<text x="345" y="22" text-anchor="middle" class="fg-t lg">之後：抽出葉子</text>
<rect x="240" y="50" width="95" height="40" rx="6" class="fg-b"/><text x="287" y="75" text-anchor="middle" class="fg-t mono">deck.ts</text>
<rect x="355" y="50" width="95" height="40" rx="6" class="fg-b"/><text x="402" y="75" text-anchor="middle" class="fg-t mono">rules.ts</text>
<rect x="280" y="160" width="130" height="40" rx="6" class="fg-b hot"/><text x="345" y="185" text-anchor="middle" class="fg-t mono">constants.ts</text>
<path d="M287 90 V125 H320 V152" class="fg-l on"/><polygon points="320,160 315.5,152 324.5,152" class="fg-a on"/>
<path d="M402 90 V125 H370 V152" class="fg-l on"/><polygon points="370,160 365.5,152 374.5,152" class="fg-a on"/>
<text x="345" y="224" text-anchor="middle" class="fg-t sm acc">葉子不 import 任何人</text>
<line x1="465" y1="12" x2="465" y2="230" class="fg-l dim dash"/>
<text x="572" y="22" text-anchor="middle" class="fg-t lg">規則：箭頭只往下</text>
<rect x="485" y="38" width="140" height="28" rx="5" class="fg-b alt"/><text x="555" y="57" text-anchor="middle" class="fg-t sm">頁面、場景</text>
<rect x="485" y="84" width="140" height="28" rx="5" class="fg-b alt"/><text x="555" y="103" text-anchor="middle" class="fg-t sm">遊戲流程</text>
<rect x="485" y="130" width="140" height="28" rx="5" class="fg-b alt"/><text x="555" y="149" text-anchor="middle" class="fg-t sm">規則、服務</text>
<rect x="485" y="176" width="140" height="28" rx="5" class="fg-b hot"/><text x="555" y="195" text-anchor="middle" class="fg-t sm">常數、型別</text>
<line x1="530" y1="66" x2="530" y2="76" class="fg-l on"/><polygon points="530,84 525.5,76 534.5,76" class="fg-a on"/>
<line x1="530" y1="112" x2="530" y2="122" class="fg-l on"/><polygon points="530,130 525.5,122 534.5,122" class="fg-a on"/>
<line x1="530" y1="158" x2="530" y2="168" class="fg-l on"/><polygon points="530,176 525.5,168 534.5,168" class="fg-a on"/>
<path d="M625 190 H650 V52 H633" class="fg-l warm dash"/><polygon points="625,52 633,47.5 633,56.5" class="fg-a warm"/>
<text x="658" y="126" class="fg-t warm">✗</text>
<text x="572" y="224" text-anchor="middle" class="fg-t sm warm">往上指的箭頭＝循環的種子</text>
</svg><figcaption>左：兩個檔案互相 import，誰先跑取決於載入順序。中：共用的常數搬進一個不 import 任何人的葉子模組，圈就斷了。右：長期來看，讓箭頭只從上層指向下層；任何往上指的箭頭，都是下一個循環的種子。</figcaption></figure>
<p>大專案裡的循環，幾乎都是同一個原因：<b>底層的檔案回頭 import 了上層</b>。規則、常數、型別、工具函式這些底層的東西，本來應該誰都不認識；一旦 rules.ts 為了「答對時播個音效」去 import 遊戲控制器，箭頭就往上指了，圈就出現了。拆圈的方法，其實就是把箭頭轉回去：</p>
<ol>
<li><b>抽出葉子模組</b>：兩邊共用的常數、型別，搬到一個不 import 任何東西的檔案（上一課的 constants.ts）。最常用，也最安全。</li>
<li><b>只需要型別，就用 import type</b>：型別在輸出時會被擦掉，type-only 的循環在執行時不存在。配合 <code>verbatimModuleSyntax</code>，誰是型別、誰是值，一眼就看得出來。</li>
<li><b>反轉相依</b>：底層需要呼叫上層時，不要 import 上層，而是由底層定義它需要的函式型別，上層在啟動時把實作傳進來。下一課的「相依注入」就是這一招。</li>
<li><b>改用事件</b>：rules.ts 只負責發出「答對了」的事件，音效模組自己去訂閱。底層不需要知道誰在聽。</li>
<li><b>其實是同一個模組</b>：兩個檔案大量使用彼此，常常表示它們本來就是一件事。合併也是解法。</li>
<li><b>最後手段：延後到函式裡才用</b>：把最外層的使用搬進函式，等呼叫時兩邊都已載入完。這能止血，但圈還在，下一個人很可能又在最外層用到它。</li>
</ol>
<p>第 3 招的樣子：rules.ts 不再認識控制器，只定義「答對時要呼叫一個函式」；上層的 controller.ts import 它、把函式交給它，反過來不行。</p>
<pre><code>// rules.ts
export type OnCorrect = (streak: number) =&gt; void;

export function makeJudge(onCorrect: OnCorrect) {
  let streak = 0;
  return (current: number, next: number, guess: 'higher' | 'lower'): boolean =&gt; {
    const ok = guess === 'higher' ? next &gt; current : next &lt; current;
    streak = ok ? streak + 1 : 0;
    if (ok) onCorrect(streak);
    return ok;
  };
}

// controller.ts
import { makeJudge } from './rules';
const judge = makeJudge(streak =&gt; console.log('play sound, streak', streak));
console.log(judge(3, 9, 'higher'));   // play sound, streak 1，然後 true</code></pre>

<h3><span class="badge lv4">專家</span>九、宣告檔：替沒有型別的函式庫補上型別</h3>
<p>一個 npm 套件的程式是 JavaScript，TypeScript 要怎麼知道它有哪些函式、參數是什麼型別？答案是<b>宣告檔</b>（declaration file，<code>.d.ts</code>）：只有型別、沒有任何實作的檔案，像一份說明書。TypeScript 遇到 <code>import ... from 'tiny-tween'</code>，會照下圖的順序找這份說明書：</p>
<figure class="figure"><svg viewBox="0 0 680 248" class="fg" style="width:100%;max-width:680px" role="img" aria-label="TypeScript 找型別的順序：先看專案裡有沒有腳本形式的 declare module；沒有才解析套件，先找套件自己附的型別，再找 @types，都沒有就是 TS7016 錯誤">
<rect x="170" y="12" width="340" height="32" rx="6" class="fg-b alt"/>
<text x="340" y="33" text-anchor="middle" class="fg-t mono">import { tween } from 'tiny-tween'</text>
<path d="M340 44 V58 H90 V66" class="fg-l"/><polygon points="90,74 85.5,66 94.5,66" class="fg-a"/>
<rect x="15" y="74" width="150" height="84" rx="6" class="fg-b hot"/>
<text x="90" y="100" text-anchor="middle" class="fg-t acc">先查：你寫的</text>
<text x="90" y="122" text-anchor="middle" class="fg-t sm mono">declare module</text>
<text x="90" y="140" text-anchor="middle" class="fg-t sm mono">'tiny-tween'</text>
<line x1="165" y1="116" x2="177" y2="116" class="fg-l"/><polygon points="185,116 177,111.5 177,120.5" class="fg-a"/>
<rect x="185" y="74" width="150" height="84" rx="6" class="fg-b"/>
<text x="260" y="100" text-anchor="middle" class="fg-t acc">1 套件自己附</text>
<text x="260" y="122" text-anchor="middle" class="fg-t sm">exports 的 types</text>
<text x="260" y="140" text-anchor="middle" class="fg-t sm">或 types 欄位</text>
<line x1="335" y1="116" x2="347" y2="116" class="fg-l"/><polygon points="355,116 347,111.5 347,120.5" class="fg-a"/>
<rect x="355" y="74" width="150" height="84" rx="6" class="fg-b"/>
<text x="430" y="100" text-anchor="middle" class="fg-t acc">2 社群的 @types</text>
<text x="430" y="122" text-anchor="middle" class="fg-t sm mono">node_modules/</text>
<text x="430" y="140" text-anchor="middle" class="fg-t sm mono">@types/tiny-tween</text>
<line x1="505" y1="116" x2="517" y2="116" class="fg-l"/><polygon points="525,116 517,111.5 517,120.5" class="fg-a"/>
<rect x="525" y="74" width="140" height="84" rx="6" class="fg-b warm"/>
<text x="595" y="100" text-anchor="middle" class="fg-t warm">都沒有</text>
<text x="595" y="122" text-anchor="middle" class="fg-t sm mono">TS7016</text>
<text x="595" y="140" text-anchor="middle" class="fg-t sm">隱含 any</text>
<text x="90" y="180" text-anchor="middle" class="fg-t sm warm">有就直接用，最優先</text>
<text x="260" y="180" text-anchor="middle" class="fg-t sm">Vue、Vite 都是這種</text>
<text x="430" y="180" text-anchor="middle" class="fg-t sm">npm i -D 安裝</text>
<text x="595" y="180" text-anchor="middle" class="fg-t sm">訊息裡附了解法</text>
<line x1="15" y1="198" x2="665" y2="198" class="fg-l dim"/>
<text x="340" y="220" text-anchor="middle" class="fg-t sm">第 1 步讀的 exports，打包工具也讀同一份：</text>
<text x="340" y="238" text-anchor="middle" class="fg-t sm">TypeScript 拿 types 條件指到的 .d.ts，打包工具拿 import 條件指到的 .js</text>
</svg><figcaption>TypeScript 找型別的順序：先看專案裡有沒有腳本形式的 declare module，有就直接用；沒有才去解析套件，先找套件自己附的，再找 @types。前一個沒有，才找下一個；四個都落空，就是 TS7016。</figcaption></figure>
<ol>
<li><b>套件自己附的</b>：<code>package.json</code> 的 <code>exports</code> 裡的 <code>"types"</code> 條件，或舊式的 <code>types</code>、<code>typings</code> 欄位，或是跟 JS 檔同名、放在旁邊的 <code>.d.ts</code>。現在大部分套件，包括 Vue 和 Vite，都自己附型別。寫 <code>exports</code> 時，<code>"types"</code> 條件要放在最前面，因為條件是照書寫順序比對的。</li>
<li><b>社群寫的</b>：<code>node_modules/@types/套件名</code>。這些來自 DefinitelyTyped 這個大型開源專案，用 <code>npm i -D @types/套件名</code> 安裝。有 scope 的套件 <code>@scope/name</code>，對應的是 <code>@types/scope__name</code>（兩個底線）。</li>
<li><b>你自己寫的</b>：專案裡某個 <code>.d.ts</code> 用 <code>declare module '套件名'</code> 宣告它。注意圖上它其實排在最前面：一旦存在，TypeScript 就直接用它。</li>
</ol>
<p>都找不到，你會看到這個錯誤，它連解法都告訴你了：</p>
<pre><code>error TS7016: Could not find a declaration file for module 'tiny-tween'.
  '.../node_modules/tiny-tween/index.js' implicitly has an 'any' type.
  Try &#96;npm i --save-dev @types/tiny-tween&#96; if it exists or add a new declaration (.d.ts)
  file containing &#96;declare module 'tiny-tween';&#96;</code></pre>
<h4>三種寫法，從快到好</h4>
<p>第一級，最快止血：整個套件都變成 any，等於關掉這個套件的型別檢查。</p>
<pre><code>// src/types/shims.d.ts
declare module 'legacy-analytics';</code></pre>
<p>第二級才是正確做法：只宣告你真的用到的部分。你不需要替整個函式庫寫型別，用到三個函式就寫三個。</p>
<pre><code>// src/types/tiny-tween.d.ts
declare module 'tiny-tween' {
  export interface TweenOptions {
    duration: number;                         // 毫秒
    easing?: 'linear' | 'easeOut';
    onUpdate?: (progress: number) =&gt; void;
  }
  export function tween(
    target: object,
    to: Record&lt;string, number&gt;,
    options: TweenOptions,
  ): Promise&lt;void&gt;;
}

// src/fx.ts
import { tween } from 'tiny-tween';

export async function flipCard(card: { scaleX: number }): Promise&lt;void&gt; {
  await tween(card, { scaleX: 0 }, { duration: 150, easing: 'easeOut' });
  await tween(card, { scaleX: 1 }, { duration: 150 });
}</code></pre>
<p>對照文件和原始碼寫，特別注意：哪些參數可以省略（加 <code>?</code>）、回呼收到什麼、回傳的是值還是 Promise。寫錯的宣告檔比沒有更糟，它會讓錯的程式通過檢查。</p>
<p>第三級是回饋上游：把型別送進 DefinitelyTyped，或對函式庫發 PR 讓它自己附 .d.ts。之後記得刪掉你的 shim：它排在最前面，會蓋掉套件後來附的正確型別。「明明套件有型別，卻到處是 any」，常常就是一個幾年前的 <code>declare module 'x';</code> 還躺在那裡。</p>
<h4>同一行 declare module，兩種完全不同的意思</h4>
<p>這是很多人卡過的坑。<code>declare module 'x' { ... }</code> 的意思，取決於它所在的檔案，最外層有沒有 import 或 export：</p>
<table>
<tr><th>檔案最外層</th><th>意思</th><th>效果（用 TS 5.9 實測）</th></tr>
<tr><td>沒有 import、export（腳本）</td><td><b>環境模組宣告</b>（ambient module declaration）：「x 長這樣」</td><td>直接取代，連套件自己附的型別都被它蓋過</td></tr>
<tr><td>有 import 或 export（模組）</td><td><b>模組擴充</b>（module augmentation）：「在 x 原本的型別上再加一點」</td><td>跟原本的型別合併；如果 x 根本找不到，就報錯</td></tr>
</table>
<p>模組擴充是替框架加型別的標準做法。例如在 Vue 裡掛一個全域屬性，讓所有元件的模板都認得 <code>$format</code>：</p>
<pre><code>// src/types/vue-globals.d.ts
export {};   // 有這一行，下面才是「擴充」而不是「取代」

declare module 'vue' {
  interface ComponentCustomProperties {
    $format: (n: number) =&gt; string;
  }
}</code></pre>
<p>少了 <code>export {}</code>，這段就變成「宣告一個叫 vue 的模組，裡面只有這個介面」，整個 Vue 的型別都被蓋掉，到處都是紅線。看到「加了一個 .d.ts 之後，Vue 的 import 全部壞掉」，十之八九就是這個原因。全域的東西也是同樣的寫法，只是用 <code>declare global</code>：</p>
<pre><code>// src/types/global.d.ts
export {};
declare global {
  interface Window {
    __BUILD_VERSION__: string;
  }
}

// src/version.ts
console.log(window.__BUILD_VERSION__);</code></pre>
<h4>宣告檔的幾個細節</h4>
<ul>
<li><b>skipLibCheck</b>：設成 true，就不檢查 .d.ts 內部的錯，只拿來用。大專案幾乎都開，省下可觀的時間；代價是套件型別版本不合時，錯誤會出現在比較奇怪的地方。</li>
<li><b>資源檔</b>：<code>import logo from './logo.png'</code> 能通過檢查，是因為 Vite 的 <code>vite/client</code> 型別裡有 <code>declare module '*.png'</code> 這種萬用字元宣告。Vue 專案 <code>env.d.ts</code> 裡那行 <code>/// &lt;reference types="vite/client" /&gt;</code>，就是在載入它。</li>
<li><b>自己發佈套件</b>：<code>declaration: true</code> 讓 tsc 產生 .d.ts。TS 5.5 加了 <code>isolatedDeclarations</code>：要求每個 export 明寫型別，換來宣告檔可以逐檔平行產生，大型 monorepo 的建置因此變快。</li>
</ul>

<h3><span class="badge lv4">專家</span>十、看不見的細節：型別擦除、重複實例與供應鏈</h3>
<h4>import 被擦掉，副作用跟著消失</h4>
<p>預設情況下，TypeScript 輸出時會刪掉「只被當成型別使用」的 import。看這個例子：</p>
<pre><code>// game.ts
import { Registry } from './register';    // 只拿來當型別
import { type Card } from './cards';
import type { Round } from './types';
export function describe(r: Registry, c: Card, x: Round) {
  return [r.size, c, x.card];
}

// register.ts
export class Registry { size = 0; }
console.log('register.ts runs');           // 副作用

// cards.ts
export type Card = number;

// types.ts
export type Round = { card: number };</code></pre>
<p>用 TS 5.9 的 transpileModule 實測，game.ts 輸出的 import 如下：</p>
<table>
<tr><th>設定</th><th>輸出的 import</th></tr>
<tr><td>預設</td><td>三行全部被刪掉。register.ts 根本不會被載入，它的 <code>console.log</code> 永遠不會跑</td></tr>
<tr><td><code>verbatimModuleSyntax: true</code></td><td><code>import { Registry } from './register'</code> 照原樣保留；<code>import { type Card }</code> 變成 <code>import {} from './cards'</code>，模組照樣載入；只有 <code>import type</code> 那一行整行刪掉</td></tr>
</table>
<p>如果 register.ts 會在載入時「註冊」一些東西，而別人只拿它的型別，預設模式下它會被悄悄跳過，功能就少了一塊。<code>verbatimModuleSyntax</code> 的規則簡單到不用猜：寫了 <code>type</code> 的才刪，沒寫的照原樣輸出。</p>
<p>這也是 esbuild、Vite 這類「一次只看一個檔案」的工具需要的資訊。它們看不到別的檔案，無法判斷一個名字是不是型別。這就是 <code>isolatedModules</code> 存在的原因：開了它，<code>export { Guess } from './types'</code> 轉出一個型別時會報 TS1205，要求你寫成 <code>export type { Guess }</code>。Vite 的文件也要求開啟它。</p>
<h4>同一個模組，兩個實例</h4>
<p>「模組只執行一次」的前提，是解析出來的路徑相同。如果 node_modules 裡同時裝了兩份不同版本的同一個套件（例如你的程式用 vue 3.5，某個外掛自己帶了一份舊版），就會有兩份 Vue、兩份內部狀態。症狀很怪：<code>instanceof</code> 突然回傳 false、provide 進去的東西 inject 不到、單例變成兩個。用 <code>npm ls vue</code> 看是不是有兩份；Vite 可以用 <code>resolve.dedupe: ['vue']</code> 強制只用一份。熱更新（HMR）也類似：模組重新執行一次，最外層的監聽就多掛一次，要在 <code>import.meta.hot.dispose</code> 裡清掉。</p>
<h4>import 就是執行：供應鏈的入口</h4>
<p>import 一個模組，等於用你程式的全部權限執行它最外層的每一行：在 Node 後端，它能讀環境變數裡的金鑰、讀寫檔案；在瀏覽器，它能讀頁面上的一切。2018 年的 event-stream 事件，就是一個熱門套件的新維護者加進一個藏了惡意程式的相依。所以要用 lock 檔鎖住確切版本和雜湊，CI 用 <code>npm ci</code> 安裝，新增相依前先看它的維護狀況；安裝腳本（postinstall）也一樣會在你的機器上執行。</p>

<h3>十一、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>import 會把值複製一份過來</td><td>ESM 是活的綁定，而且唯讀。只有手寫 CommonJS 再解構，才是拷貝。</td></tr>
<tr><td>tsconfig 設了 paths，路徑就會被改寫</td><td>TypeScript 從不改寫路徑。paths 只告訴型別檢查去哪裡找，執行環境要自己設別名。</td></tr>
<tr><td>循環匯入一定會壞</td><td>只有在最外層讀到對方還沒填值的 const、let、class 才壞。函式宣告甚至在循環裡也能呼叫。但「沒壞」不代表「沒有」。</td></tr>
<tr><td>有 export 就一定會被打包進去</td><td>沒人 import 的 export 會被搖掉；但有副作用的模組，就算沒人用它的 export，也會整個留下。</td></tr>
<tr><td>每呼叫一次 import() 就重新下載、重新執行</td><td>只有第一次。之後拿到的都是同一個已載入的模組。</td></tr>
<tr><td>.d.ts 會影響執行結果</td><td>它在執行時完全不存在。寫錯的宣告檔不會讓程式當掉，只會讓錯的程式通過檢查。</td></tr>
</table>

<h3>十二、跟你的工作連起來</h3>
<ul>
<li><b>Vue 加 Vite</b>：別名要在 tsconfig 和 vite.config 各設一次；頁面用 <code>() =&gt; import()</code> 延遲載入；Vite 只轉譯、不檢查型別，所以 CI 一定要另外跑 <code>vue-tsc</code>。</li>
<li><b>Cocos Creator</b>：腳本從 <code>'cc'</code> import 引擎；元件上的 <code>@property(SomeClass)</code> 是最外層使用，循環裡最容易出事；管理器之類的共用狀態，盡量在 <code>onLoad</code>、<code>start</code> 這些生命週期裡才去拿，不要在模組最外層就互相讀取。</li>
<li><b>Node.js 後端</b>：<code>package.json</code> 的 <code>"type"</code> 決定 .js 是哪一種格式；用 nodenext 時，相對路徑要寫 <code>.js</code>。</li>
<li><b>Docker 與部署</b>：映像檔裡用 <code>npm ci</code>；指紋檔名的 chunk 可以長時間快取，<code>index.html</code> 則不要，否則使用者會一直拿到指向舊 chunk 的舊頁面。</li>
<li><b>Go</b>：編譯器直接拒絕套件之間的循環 import（<code>import cycle not allowed</code>）。JavaScript 允許循環，所以只能靠工具和紀律去擋。</li>
</ul>

<h3>十三、面試會怎麼問</h3>
<p>下面是前端、Node 後端面試裡真的會出現的題目。先自己講一遍（最好出聲講），再打開參考答案。</p>
<ol>
<li>「ES 模組和 CommonJS 有什麼差別？」</li>
<li>「tree shaking 是怎麼運作的？什麼情況下它會失效？」</li>
<li>「兩個模組互相 import 會發生什麼事？你會怎麼處理？」</li>
<li>「路徑別名在編輯器裡沒問題，建置時卻說找不到模組。你怎麼排查？」</li>
<li>「怎麼做程式碼切分？部署新版後，有使用者回報點某個頁面就白畫面，可能是什麼原因？」</li>
<li>「用了一個沒有型別的套件，你會怎麼處理？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>ESM 的相依關係是靜態的：import 只能寫在最外層、路徑是固定字串，所以執行前就能建出整張相依圖，也才能搖樹；它的 import 是活的、唯讀的綁定；支援最外層 await。CommonJS 的 <code>require</code> 是執行時的同步函式呼叫，可以寫在任何地方；匯出的是普通物件，解構拿到的是當下的拷貝。Node 用 .mjs、.cjs 或 package.json 的 type 欄位分辨兩者。</li>
<li>打包工具從進入點建立相依圖，標記真正被使用的 export，沒標記到的不輸出。它依賴 ESM 的靜態結構，所以 CommonJS 套件常整包留下。另一個限制是副作用：工具無法證明模組載入時不改變外界，就必須保留它。套件可以用 sideEffects 欄位聲明，函式呼叫可以用 PURE 註解標記。</li>
<li>允許，而且常常沒事。問題出在後序求值：循環裡有一個模組會先跑，這時另一個模組的 const、class 還在暫時死區，在最外層讀到就丟 ReferenceError；輸出成 CommonJS 則拿到 undefined，錯誤延後出現。處理：用 madge 或 import/no-cycle 找出來；共用的常數和型別抽到葉子模組；只需要型別就用 import type；底層要呼叫上層時，用相依注入或事件反轉方向。</li>
<li>先確認是哪個解析器找不到：編輯器靠 tsconfig 的 paths，建置靠打包工具自己的 alias，兩邊要各設一次。再確認 moduleResolution 跟實際環境一致。要細節就用 <code>tsc --traceResolution</code>。也要檢查大小寫：macOS 預設不分大小寫，Linux 的 CI 會分。</li>
<li>用動態 <code>import()</code>，打包工具會把那個模組切成獨立的 chunk，需要時才下載。部署後白畫面，常見原因是使用者的舊頁面還指向舊的 chunk 檔名，而新部署把舊檔刪了。解法：保留上一版的檔案一段時間、index.html 不要長時間快取、攔截載入失敗（Vite 的 vite:preloadError）後重新整理。</li>
<li>先找官方附的型別或 @types 套件。沒有就在專案的 .d.ts 裡 declare module，只宣告實際用到的函式和選項；趕時間才用 <code>declare module 'x';</code> 讓它變成 any。要注意：腳本形式的 declare module 會蓋過套件後來附的型別；替既有套件加型別要用模組擴充，檔案裡必須有 import 或 export。</li>
</ol>
</details>

<h3>十四、練功題（做得出來才算真的懂）</h3>
<ol>
<li>下面兩個檔案，用 a.ts 當進入點執行。會印出什麼、還是會丟錯？如果把 b.ts 最後那行 <code>console.log</code> 刪掉呢？
<pre><code>// a.ts
import { b } from './b';
export function helloA() { return 'A'; }
export const NAME = 'A' + b();

// b.ts
import { helloA, NAME } from './a';
export function b() { return helloA(); }
console.log(NAME);</code></pre></li>
<li>一個 Vite 專案，<code>tsconfig.json</code> 有 <code>"paths": { "@/*": ["./src/*"] }</code>，編輯器完全沒紅線，但 <code>npm run dev</code> 一打開就出現 <code>Failed to resolve import "@/utils/format" from "src/main.ts". Does the file exist?</code>。原因是什麼？要改哪個檔案？</li>
<li>預測輸出：在 <code>verbatimModuleSyntax: true</code> 下，<code>import type { A } from './a'</code>、<code>import { type B } from './b'</code>、<code>import { C } from './c'</code>（C 是一個 class，只被拿來當型別）這三行，各會被輸出成什麼？哪一個模組在執行時根本不會被載入？</li>
<li>有一個沒有型別的套件 <code>tiny-confetti</code>，用法是 <code>confetti({ particleCount: 120, spread: 70 })</code>，回傳一個 Promise，兩個選項都可以省略，也可以完全不傳參數；它是預設匯出。替它寫一份宣告檔，再寫一個使用它的函式。</li>
<li>在你自己的 Vite 專案裡，挑一個不常用的畫面改成動態 import。跑 <code>npm run build</code>，比較改之前和改之後主檔的大小，並在 dist 資料夾裡找到新切出來的檔案。如果建置時出現「also statically imported」的警告，代表什麼？</li>
<li>同事加了 <code>src/types/shims.d.ts</code>，內容只有 <code>declare module 'vue' { interface ComponentCustomProperties { $t: (key: string) =&gt; string } }</code>，結果整個專案裡 <code>import { ref } from 'vue'</code> 全部出現紅線。為什麼？只要加哪一行就好？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>a.ts 先 import b.ts，所以 b.ts 先求值，它最外層的 <code>console.log(NAME)</code> 讀到還在暫時死區的 NAME，丟出 <code>ReferenceError: Cannot access 'NAME' before initialization</code>。刪掉那行後：b.ts 只宣告函式，順利跑完；接著 a.ts 求值，<code>b()</code> 呼叫的 <code>helloA()</code> 是在連結階段就放好的函式宣告，沒問題，NAME 變成 <code>'AA'</code>。</li>
<li>paths 只給 TypeScript 用，Vite 不讀它。要在 <code>vite.config.ts</code> 的 <code>resolve.alias</code> 加上 <code>'@'</code> 指到 src 資料夾（本章那段設定）。打包工具需要自己的地圖。</li>
<li>第一行整行刪掉；第二行變成 <code>import {} from './b'</code>，b 模組照樣載入並執行；第三行照原樣保留，c 模組也會載入。只有 a 模組不會因為這一行被載入。如果 C 是純型別，第三行會報 TS1484，要求改成 import type。</li>
<li>一種正確寫法：
<pre><code>// src/types/tiny-confetti.d.ts
declare module 'tiny-confetti' {
  export interface ConfettiOptions {
    particleCount?: number;
    spread?: number;
  }
  export default function confetti(options?: ConfettiOptions): Promise&lt;void&gt;;
}

// src/celebrate.ts
import confetti from 'tiny-confetti';

export function celebrate(streak: number): Promise&lt;void&gt; {
  return confetti({ particleCount: streak * 20, spread: 70 });
}</code></pre>
重點是兩個選項都加 <code>?</code>、整個參數也加 <code>?</code>，回傳型別寫 <code>Promise&lt;void&gt;</code>，並用 <code>export default</code> 對應預設匯出。這個檔案最外層沒有 import、export，所以是環境模組宣告。</li>
<li>主檔應該變小，dist 裡多出一個帶指紋的 chunk。「also statically imported」代表還有別的檔案用一般的 import 引用它，它本來就在主檔裡，等於沒切。找出那個靜態 import 改掉，再建置一次。</li>
<li>那個檔案最外層沒有 import 或 export，所以 <code>declare module 'vue'</code> 是環境模組宣告，等於宣告「vue 模組裡只有這個介面」，而且它優先於 Vue 自己附的型別，於是 ref 這些全都不見了。在檔案最上面加一行 <code>export {};</code>，它就變成模組擴充，跟 Vue 原本的型別合併。</li>
</ol>
</details>

<h3>十五、想再挖深</h3>
<ul>
<li><b>TypeScript 官方手冊的 Modules 章節</b>（<a href="https://www.typescriptlang.org/docs/handbook/modules/theory.html">typescriptlang.org/docs/handbook/modules/theory.html</a>）：分成理論、參考、怎麼選設定幾篇，把 module、moduleResolution 和各種執行環境的關係講得最完整。</li>
<li><b>Lin Clark〈ES modules: A cartoon deep-dive〉</b>（Mozilla Hacks，2018）：用漫畫把建構、連結、求值三個階段和活的綁定畫出來，這一章第七節的原型。</li>
<li><b>Node.js 官方文件 Modules: ECMAScript modules 與 Modules: CommonJS modules</b>（<a href="https://nodejs.org/api/esm.html">nodejs.org/api/esm.html</a>）：Node 怎麼判斷格式、怎麼解析路徑、package.json 的 exports 怎麼運作，都以這份為準。</li>
<li><b>Vite 官方文件</b>（<a href="https://vite.dev/guide/">vite.dev/guide</a>）：其中的相依預先打包、建置、效能幾頁，分別對應本章的開發模式、程式碼切分和 barrel 檔。</li>
<li><b>MDN〈JavaScript modules〉指南</b>（<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules">developer.mozilla.org</a>）：瀏覽器端的 ESM、動態 import、import maps，範例都能直接在瀏覽器跑。</li>
</ul>
` });
