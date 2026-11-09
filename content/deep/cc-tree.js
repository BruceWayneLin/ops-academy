DEEP({ 'cc-tree': `
<p>上一課你知道了：場景是一棵節點樹，子節點的位置從父節點量起，父節點一動，子節點就跟著動。這一章把這棵樹拆開：引擎怎麼把一層層的位置、旋轉、縮放，乘成畫面上的位置（我們會用真的數字算一次）；為什麼它不每格全部重算；樹太深、太常換父節點時，代價在哪裡；<code>active</code> 和 <code>activeInHierarchy</code> 到底差在哪；圖層和攝影機怎麼決定誰被拍到；最後看「元件組合」這個想法，跟 ECS、Vue 元件樹、DOM 各有什麼異同。</p>

<h3><span class="badge lv1">基礎</span>一、場景圖：一棵「誰跟著誰動」的樹</h3>
<p>想像太陽系。月亮只需要知道「我繞著地球轉」，不用管地球怎麼繞太陽。只要把月亮掛在地球底下，地球走到哪，月亮自動跟到哪。遊戲引擎把這種「掛在誰底下、就跟著誰動」的樹，叫做<b>場景圖</b>（scene graph）。Cocos 的節點樹就是一張場景圖。</p>
<p>每個節點身上存的位置、旋轉、縮放，全都是<b>相對父節點</b>的，這叫本地值。畫面上真正的位置叫世界值，是引擎沿著樹一層層算出來、再暫存起來的。一個是你設定的，一個是算出來的，這個區分是整章的基礎。</p>
<figure class="figure"><svg viewBox="0 0 600 306" class="fg" style="width:100%;max-width:600px" role="img" aria-label="節點樹：Canvas、Table、CurrentCard、Badge，左邊是各自的本地值，右邊是算出來的世界值">
<rect x="40" y="20" width="150" height="40" rx="6" class="fg-b"/><text x="56" y="45" class="fg-t">Canvas</text><text x="180" y="45" text-anchor="end" class="fg-t sm">基準</text>
<text x="230" y="44" class="fg-t sm">左：你填的本地值</text><text x="416" y="44" class="fg-t sm acc">右：引擎算出的世界值</text>
<path d="M60 60 V117 H80" class="fg-l"/>
<rect x="80" y="90" width="210" height="54" rx="6" class="fg-b alt"/><text x="96" y="112" class="fg-t">Table</text><text x="96" y="132" class="fg-t sm">本地 (100, 50)，轉 90°，×2</text>
<path d="M100 144 V196 H120" class="fg-l"/>
<rect x="120" y="174" width="210" height="44" rx="6" class="fg-b"/><text x="136" y="193" class="fg-t">CurrentCard</text><text x="136" y="209" class="fg-t sm">本地 (−80, 0)</text>
<path d="M140 218 V270 H160" class="fg-l"/>
<rect x="160" y="248" width="210" height="44" rx="6" class="fg-b"/><text x="176" y="267" class="fg-t">Badge</text><text x="176" y="283" class="fg-t sm">本地 (10, 20)</text>
<line x1="290" y1="117" x2="400" y2="117" class="fg-l on dash"/><polygon points="408,117 400,112.5 400,121.5" class="fg-a on"/><text x="416" y="113" class="fg-t acc">世界 (100, 50)</text><text x="416" y="130" class="fg-t sm">轉 90°，×2</text>
<line x1="330" y1="196" x2="400" y2="196" class="fg-l on dash"/><polygon points="408,196 400,191.5 400,200.5" class="fg-a on"/><text x="416" y="192" class="fg-t acc">世界 (100, −110)</text><text x="416" y="209" class="fg-t sm">轉 90°，×2（跟著 Table）</text>
<line x1="370" y1="270" x2="400" y2="270" class="fg-l on dash"/><polygon points="408,270 400,265.5 400,274.5" class="fg-a on"/><text x="416" y="266" class="fg-t acc">世界 (60, −90)</text><text x="416" y="283" class="fg-t sm">轉 90°，×2</text>
</svg><figcaption>左邊是你在屬性檢查器填的本地值，右邊是引擎算出來的世界值。牌和徽章自己沒有轉、沒有放大，卻因為 Table 轉了 90°、放大 2 倍，在畫面上也跟著轉、跟著變大。</figcaption></figure>
<p>這章所有的「世界座標」，都以 Canvas 為基準來算，比較好懂。實際上，Cocos 3.x 的 Canvas 節點通常放在設計解析度的正中央，例如 1280 × 720 時在 (640, 360)，所以 <code>worldPosition</code> 讀出來的數字，還要再加上 Canvas 自己的位置。</p>
<p>你熟的 DOM 也有同樣的兩種值：CSS 的 <code>left: 10px</code> 是相對外層元素的，<code>getBoundingClientRect()</code> 回傳的才是在頁面上真正的位置。差別是 DOM 的位置大多由排版引擎替你算，Cocos 則完全由這棵樹的相對關係決定。</p>

<h3><span class="badge lv1">基礎</span>二、本地到世界：先縮放、再旋轉、最後平移</h3>
<p>Table 在 (100, 50)，轉了 90°，放大 2 倍。CurrentCard 的本地座標是 (−80, 0)。它在畫面上到底在哪？引擎每次都照同一個順序處理父節點的三個值：</p>
<figure class="figure"><svg viewBox="0 0 660 320" class="fg" style="width:100%;max-width:660px" role="img" aria-label="座標平面上，一個點從 (−80, 0) 先放大成 (−160, 0)，再繞原點逆時針轉 90 度到 (0, −160)，最後加上 (100, 50) 到 (100, −110)">
<line x1="110" y1="120" x2="450" y2="120" class="fg-l dim"/><line x1="300" y1="30" x2="300" y2="310" class="fg-l dim"/>
<text x="306" y="136" class="fg-t sm">(0, 0)</text>
<line x1="300" y1="120" x2="396" y2="72" class="fg-l alt dash"/><rect x="396" y="66" width="8" height="8" class="fg-b alt"/><text x="400" y="56" text-anchor="middle" class="fg-t sm alt">Table (100, 50)</text>
<line x1="213" y1="120" x2="154" y2="120" class="fg-l on"/><polygon points="146,120 154,115.5 154,124.5" class="fg-a on"/><text x="182" y="110" text-anchor="middle" class="fg-t sm acc">×2</text>
<path d="M140 120 A160 160 0 0 0 287 279.5" class="fg-l alt"/><polygon points="295,280 287,275.5 287,284.5" class="fg-a alt"/>
<text x="238" y="196" text-anchor="middle" class="fg-t sm alt">逆時針轉 90°</text>
<path d="M306 280 H400 V245" class="fg-l warm"/><polygon points="400,237 395.5,245 404.5,245" class="fg-a warm"/>
<text x="353" y="298" text-anchor="middle" class="fg-t sm warm">+100</text><text x="410" y="266" class="fg-t sm warm">+50</text>
<circle cx="220" cy="120" r="6" class="fg-lamp"/><circle cx="140" cy="120" r="6" class="fg-lamp"/><circle cx="300" cy="280" r="6" class="fg-lamp"/><circle cx="400" cy="230" r="6" class="fg-lamp on"/>
<text x="220" y="104" text-anchor="middle" class="fg-t">①</text><text x="140" y="104" text-anchor="middle" class="fg-t">②</text><text x="288" y="300" text-anchor="end" class="fg-t">③</text><text x="414" y="234" class="fg-t">④</text>
<text x="480" y="56" class="fg-t">① 牌的本地座標</text><text x="480" y="74" class="fg-t sm mono">(−80, 0)</text>
<text x="480" y="106" class="fg-t">② 乘上縮放 2</text><text x="480" y="124" class="fg-t sm mono">(−160, 0)</text>
<text x="480" y="156" class="fg-t">③ 逆時針轉 90°</text><text x="480" y="174" class="fg-t sm mono">(0, −160)</text>
<text x="480" y="206" class="fg-t">④ 加上 Table 的位置</text><text x="480" y="224" class="fg-t sm mono acc">(100, −110)</text>
<text x="480" y="262" class="fg-t sm">順序固定：</text><text x="480" y="280" class="fg-t sm">先縮放、再旋轉、最後平移</text>
</svg><figcaption>同一個點走四步：先乘縮放，再繞父節點的原點旋轉，最後加上父節點的位置。綠點就是牌在畫面上的位置 (100, −110)。</figcaption></figure>
<ol>
<li><b>縮放</b>：(−80, 0) × 2 = (−160, 0)。</li>
<li><b>旋轉</b>：逆時針轉 90° 的規則是 (x, y) 變成 (−y, x)，所以 (−160, 0) 變成 (0, −160)。Cocos 3.x 的 Y 軸朝上，<code>angle</code> 是正的就逆時針轉。</li>
<li><b>平移</b>：加上 Table 的位置 (100, 50)，得到 (100, −110)。</li>
</ol>
<p>第 2 步有一個常被忽略的重點：旋轉是<b>繞著父節點的原點</b>轉的，不是繞著牌自己的中心。所以轉動 Table，兩張牌會像時鐘的指針一樣甩一大圈；想讓一張牌原地自轉，要轉的是牌，不是 Table。很多「為什麼它飛走了」的問題，都是轉錯了節點。</p>
<p>順序也不能換。如果先平移再旋轉，(−80, 0) + (100, 50) = (20, 50)，再轉 90° 是 (−50, 20)，再放大是 (−100, 40)，跟正確答案差了十萬八千里。CSS 的 <code>transform: translate(...) rotate(...) scale(...)</code> 也是同一個順序：寫在最右邊的縮放最先作用在元素上。</p>

<h3><span class="badge lv2">進階</span>三、矩陣：把整條路一次算完</h3>
<p>樹有好幾層的時候，一層一層照三步算很麻煩。數學上有一個工具，可以把「縮放、旋轉、平移」打包成一個東西，叫<b>變換矩陣</b>（transform matrix）。2D 的版本是一個 3 × 3 的表格：</p>
<pre><code>| a  c  tx |
| b  d  ty |
| 0  0  1  |

a = 縮放x × cos(角度)
b = 縮放x × sin(角度)
c = -縮放y × sin(角度)
d = 縮放y × cos(角度)
(tx, ty) = 位置

新的 x = a × x + c × y + tx
新的 y = b × x + d × y + ty</code></pre>
<p>Table 轉 90°（cos = 0、sin = 1）、放大 2 倍、在 (100, 50)，代進去是 a = 0、b = 2、c = −2、d = 0、tx = 100、ty = 50。拿 CurrentCard 的 (−80, 0) 試算：新的 x = 0 × (−80) + (−2) × 0 + 100 = 100，新的 y = 2 × (−80) + 0 × 0 + 50 = −110。跟上一節一步一步走的結果一模一樣。</p>
<p>矩陣真正厲害的地方是：<b>兩個矩陣相乘，等於把兩次變換接起來</b>。所以每個節點的世界矩陣，就是「父節點的世界矩陣 × 自己的本地矩陣」：</p>
<figure class="figure"><svg viewBox="0 0 640 210" class="fg" style="width:100%;max-width:640px" role="img" aria-label="Table 的世界矩陣乘上 CurrentCard 的本地矩陣，等於 CurrentCard 的世界矩陣；左上兩行兩列是旋轉加縮放，右邊一欄是位置">
<text x="320" y="26" text-anchor="middle" class="fg-t">子節點的世界矩陣 ＝ 父節點的世界矩陣 × 子節點的本地矩陣</text>
<rect x="30" y="50" width="44" height="26" class="fg-b alt"/><text x="52" y="68" text-anchor="middle" class="fg-t mono">0</text>
<rect x="74" y="50" width="44" height="26" class="fg-b alt"/><text x="96" y="68" text-anchor="middle" class="fg-t mono">−2</text>
<rect x="118" y="50" width="44" height="26" class="fg-b warm"/><text x="140" y="68" text-anchor="middle" class="fg-t mono">100</text>
<rect x="30" y="76" width="44" height="26" class="fg-b alt"/><text x="52" y="94" text-anchor="middle" class="fg-t mono">2</text>
<rect x="74" y="76" width="44" height="26" class="fg-b alt"/><text x="96" y="94" text-anchor="middle" class="fg-t mono">0</text>
<rect x="118" y="76" width="44" height="26" class="fg-b warm"/><text x="140" y="94" text-anchor="middle" class="fg-t mono">50</text>
<rect x="30" y="102" width="44" height="26" class="fg-b"/><text x="52" y="120" text-anchor="middle" class="fg-t mono">0</text>
<rect x="74" y="102" width="44" height="26" class="fg-b"/><text x="96" y="120" text-anchor="middle" class="fg-t mono">0</text>
<rect x="118" y="102" width="44" height="26" class="fg-b"/><text x="140" y="120" text-anchor="middle" class="fg-t mono">1</text>
<rect x="210" y="50" width="44" height="26" class="fg-b"/><text x="232" y="68" text-anchor="middle" class="fg-t mono">1</text>
<rect x="254" y="50" width="44" height="26" class="fg-b"/><text x="276" y="68" text-anchor="middle" class="fg-t mono">0</text>
<rect x="298" y="50" width="44" height="26" class="fg-b warm"/><text x="320" y="68" text-anchor="middle" class="fg-t mono">−80</text>
<rect x="210" y="76" width="44" height="26" class="fg-b"/><text x="232" y="94" text-anchor="middle" class="fg-t mono">0</text>
<rect x="254" y="76" width="44" height="26" class="fg-b"/><text x="276" y="94" text-anchor="middle" class="fg-t mono">1</text>
<rect x="298" y="76" width="44" height="26" class="fg-b warm"/><text x="320" y="94" text-anchor="middle" class="fg-t mono">0</text>
<rect x="210" y="102" width="44" height="26" class="fg-b"/><text x="232" y="120" text-anchor="middle" class="fg-t mono">0</text>
<rect x="254" y="102" width="44" height="26" class="fg-b"/><text x="276" y="120" text-anchor="middle" class="fg-t mono">0</text>
<rect x="298" y="102" width="44" height="26" class="fg-b"/><text x="320" y="120" text-anchor="middle" class="fg-t mono">1</text>
<rect x="390" y="50" width="44" height="26" class="fg-b alt"/><text x="412" y="68" text-anchor="middle" class="fg-t mono">0</text>
<rect x="434" y="50" width="44" height="26" class="fg-b alt"/><text x="456" y="68" text-anchor="middle" class="fg-t mono">−2</text>
<rect x="478" y="50" width="44" height="26" class="fg-b warm"/><text x="500" y="68" text-anchor="middle" class="fg-t mono">100</text>
<rect x="390" y="76" width="44" height="26" class="fg-b alt"/><text x="412" y="94" text-anchor="middle" class="fg-t mono">2</text>
<rect x="434" y="76" width="44" height="26" class="fg-b alt"/><text x="456" y="94" text-anchor="middle" class="fg-t mono">0</text>
<rect x="478" y="76" width="44" height="26" class="fg-b warm"/><text x="500" y="94" text-anchor="middle" class="fg-t mono">−110</text>
<rect x="390" y="102" width="44" height="26" class="fg-b"/><text x="412" y="120" text-anchor="middle" class="fg-t mono">0</text>
<rect x="434" y="102" width="44" height="26" class="fg-b"/><text x="456" y="120" text-anchor="middle" class="fg-t mono">0</text>
<rect x="478" y="102" width="44" height="26" class="fg-b"/><text x="500" y="120" text-anchor="middle" class="fg-t mono">1</text>
<text x="186" y="98" text-anchor="middle" class="fg-t lg">×</text><text x="366" y="98" text-anchor="middle" class="fg-t lg">=</text>
<rect x="540" y="64" width="12" height="12" class="fg-b alt"/><text x="558" y="75" class="fg-t sm">旋轉＋縮放</text>
<rect x="540" y="90" width="12" height="12" class="fg-b warm"/><text x="558" y="101" class="fg-t sm">位置</text>
<text x="96" y="150" text-anchor="middle" class="fg-t sm">Table 的世界矩陣</text><text x="276" y="150" text-anchor="middle" class="fg-t sm">CurrentCard 的本地</text><text x="456" y="150" text-anchor="middle" class="fg-t sm acc">CurrentCard 的世界</text>
<text x="96" y="168" text-anchor="middle" class="fg-t sm">轉 90°、×2、在 (100, 50)</text><text x="276" y="168" text-anchor="middle" class="fg-t sm">只有平移 (−80, 0)</text><text x="456" y="168" text-anchor="middle" class="fg-t sm">轉 90°、×2、在 (100, −110)</text>
<text x="320" y="198" text-anchor="middle" class="fg-t sm">再用它算 Badge (10, 20)：x = 0×10 − 2×20 + 100 = 60，y = 2×10 + 0×20 − 110 = −90</text>
</svg><figcaption>乘出來的結果裡，左上的 2 × 2 管旋轉和縮放，右邊那一欄就是位置。有了 CurrentCard 的世界矩陣，它底下的每個子節點都只要再乘一次。</figcaption></figure>
<p>引擎為什麼一定要用矩陣？因為最後真正要算的不是「一個點」，而是每張圖的 4 個角（頂點）。一張 120 × 160、錨點在中心的牌，右上角在牌自己的空間裡是 (60, 80)。用 CurrentCard 的世界矩陣：x = 0 × 60 + (−2) × 80 + 100 = −60，y = 2 × 60 + 0 × 80 − 110 = 10。每個頂點一次乘法就到位，不管樹有幾層。</p>
<p>Cocos 是 3D 引擎，所以節點用的是 4 × 4 的 <code>Mat4</code>，2D 只是 z 都是 0 的特例，道理完全一樣。程式裡可以直接拿來用：</p>
<pre><code>import { Vec3 } from 'cc';

const corner = new Vec3(60, 80, 0);  // 牌的右上角
const out = new Vec3();
Vec3.transformMat4(out, corner, card.worldMatrix);
// 本章數字：(-60, 10, 0)
// 實際值還要加上 Canvas 的位置</code></pre>
<p>反過來，從世界座標換回某個節點的本地座標，用的是矩陣的<b>反矩陣</b>（inverse）。點擊判斷就是這樣做的：把手指在畫面上的位置換進按鈕自己的空間，再看有沒有落在它的寬高範圍裡。下一課的座標換算函式，底下就是這件事。</p>

<h3><span class="badge lv2">進階</span>四、髒旗標：先記下「要重算」，用到才算</h3>
<p>一格裡，你可能在 <code>update</code> 移動 Table、補間又移動它一次、<code>lateUpdate</code> 再微調一次。如果每次 <code>setPosition</code> 都馬上把整棵子樹的世界矩陣重算一遍，前兩次的計算全是白做。</p>
<p>引擎的做法叫<b>髒旗標</b>（dirty flag）。<code>setPosition</code> 只做兩件事：寫入新的本地位置，然後把自己和所有子孫標記成「世界值過期了」。真正的重算，等到有人要讀的時候才做：你讀 <code>worldPosition</code>、<code>worldMatrix</code>，或繪製準備階段需要頂點的時候。</p>
<figure class="figure"><svg viewBox="0 0 660 262" class="fg" style="width:100%;max-width:660px" role="img" aria-label="左圖：改了 Table 的位置之後，Table 和所有子孫都被標成髒的。右圖：讀 Badge 的世界座標時，只沿著 Table、CurrentCard、Badge 這一串重算，NextCard 還是髒的">
<text x="160" y="22" text-anchor="middle" class="fg-t">① 改了 Table 的位置</text>
<rect x="110" y="40" width="100" height="30" rx="5" class="fg-b"/><text x="160" y="60" text-anchor="middle" class="fg-t">Canvas</text>
<line x1="160" y1="70" x2="160" y2="96" class="fg-l"/>
<rect x="110" y="96" width="100" height="30" rx="5" class="fg-b warm"/><text x="160" y="116" text-anchor="middle" class="fg-t">Table</text>
<path d="M160 126 V139 H90 V152" class="fg-l"/><path d="M160 139 H235 V152" class="fg-l"/>
<rect x="30" y="152" width="120" height="30" rx="5" class="fg-b warm"/><text x="90" y="172" text-anchor="middle" class="fg-t">CurrentCard</text>
<rect x="180" y="152" width="110" height="30" rx="5" class="fg-b warm"/><text x="235" y="172" text-anchor="middle" class="fg-t">NextCard</text>
<line x1="90" y1="182" x2="90" y2="208" class="fg-l"/>
<rect x="30" y="208" width="120" height="30" rx="5" class="fg-b warm"/><text x="90" y="228" text-anchor="middle" class="fg-t">Badge</text>
<text x="235" y="206" text-anchor="middle" class="fg-t sm warm">整串標成「髒」</text><text x="235" y="222" text-anchor="middle" class="fg-t sm">還沒重算</text>
<line x1="330" y1="12" x2="330" y2="250" class="fg-l dim dash"/>
<text x="500" y="22" text-anchor="middle" class="fg-t">② 讀 Badge 的世界座標</text>
<rect x="450" y="40" width="100" height="30" rx="5" class="fg-b"/><text x="500" y="60" text-anchor="middle" class="fg-t">Canvas</text>
<line x1="500" y1="70" x2="500" y2="96" class="fg-l"/>
<rect x="450" y="96" width="100" height="30" rx="5" class="fg-b hot"/><text x="500" y="116" text-anchor="middle" class="fg-t">Table</text>
<path d="M500 126 V139 H430 V152" class="fg-l on"/><path d="M500 139 H575 V152" class="fg-l"/>
<rect x="370" y="152" width="120" height="30" rx="5" class="fg-b hot"/><text x="430" y="172" text-anchor="middle" class="fg-t">CurrentCard</text>
<rect x="520" y="152" width="110" height="30" rx="5" class="fg-b warm"/><text x="575" y="172" text-anchor="middle" class="fg-t">NextCard</text>
<line x1="430" y1="182" x2="430" y2="208" class="fg-l on"/>
<rect x="370" y="208" width="120" height="30" rx="5" class="fg-b hot"/><text x="430" y="228" text-anchor="middle" class="fg-t">Badge</text>
<text x="575" y="206" text-anchor="middle" class="fg-t sm warm">沒人讀，先不算</text><text x="575" y="222" text-anchor="middle" class="fg-t sm">要畫它時才算</text>
<text x="430" y="256" text-anchor="middle" class="fg-t sm acc">只沿綠色這一串往下重算</text>
</svg><figcaption>橘色是「世界值過期」，綠色是剛重算好的。標記是往下走的，一次標整棵子樹；重算則只算被讀到的那一串。</figcaption></figure>
<p>用一格來追：</p>
<table>
<tr><th>時機</th><th>做了什麼</th><th>重算了幾次</th></tr>
<tr><td>update</td><td>Table 移到 (150, 50)：標記 Table 和 3 個子孫</td><td>0</td></tr>
<tr><td>補間系統</td><td>Table 移到 (152, 50)：大家本來就髒了，標記很快就結束</td><td>0</td></tr>
<tr><td>lateUpdate</td><td>Table 移到 (153, 50)：同上</td><td>0</td></tr>
<tr><td>繪製準備</td><td>要算頂點了，才把這 4 個節點的世界矩陣各算一次</td><td>4</td></tr>
</table>
<p>反過來，如果你在每次移動之後都讀一次 <code>card.worldPosition</code>，就會逼引擎每次都重算那一串。<b>先把寫入做完，最後再讀</b>，是用髒旗標時最重要的習慣。</p>
<p>還有一個細節：父節點<b>旋轉</b>時，子節點的世界位置也會跟著改變（牌會甩一圈），所以子孫被標記的不只是「旋轉過期」，還有「位置過期」。引擎用幾個位元記錄到底哪些值過期（位置、旋轉、縮放），能少算就少算。另外，節點的 <code>TRANSFORM_CHANGED</code> 事件是每次變換都同步發出的，在幾百個節點上監聽它，等於替每次 <code>setPosition</code> 都加了一個函式呼叫，要小心使用。</p>

<h3><span class="badge lv3">專業</span>五、樹太深、太常換父節點：代價在哪裡</h3>
<p>一個節點的成本，大致來自四個地方：</p>
<ol>
<li><b>標記</b>：祖先一動，它就要被標髒一次。祖先越多、動得越頻繁，被標的次數越多。</li>
<li><b>重算</b>：髒了就要做一次矩陣乘法。樹越深，讀一個葉子節點時要沿著往上找、往下算的那一串就越長。</li>
<li><b>走訪</b>：繪製準備階段每格都會走過 Canvas 底下所有啟用中的節點，不管它有沒有動。</li>
<li><b>附加功能</b>：透明度（UIOpacity）要一層層往下乘；Widget、Layout 這類排版元件，結構一變就要重新計算。</li>
</ol>
<p>量級感（示意）：一張牌的預製件如果有 8 個節點，52 張就是 416 個，對 2D 遊戲很普通。一個 200 列、每列 10 個節點的捲動清單，就是 2,000 個節點每格被走訪，低階手機開始吃力。很多節點是「為了好排版」而加的空殼，每一層都要付上面這些成本。用不到的包裝節點就拿掉；但為了合批而分的「圖層節點」（上一課的牌一層、數字一層）值得保留。</p>
<h4>換父節點不是改一個欄位</h4>
<p><code>node.setParent(newParent)</code> 背後做的事：</p>
<ul>
<li>從舊父節點的 <code>children</code> 陣列拿掉，後面兄弟的順序都往前移；再加進新父節點的陣列。</li>
<li>整棵子樹的世界變換標髒。</li>
<li>發出父節點改變、子節點增減的事件，聽這些事件的元件（例如 Layout）會重新排版。</li>
<li>如果新、舊父節點一個啟用、一個停用，整棵子樹會跑一輪 <code>onDisable</code> 或 <code>onEnable</code>。</li>
</ul>
<p>還有一個容易出錯的參數：<code>setParent(newParent, keepWorldTransform)</code>。第二個參數預設是 false，也就是保留本地值。用前面的數字，把 CurrentCard 從 Table 搬到一個放在 Canvas 原點、沒有旋轉縮放的 DragLayer：</p>
<table>
<tr><th></th><th>本地位置</th><th>角度</th><th>縮放</th><th>畫面上</th></tr>
<tr><td>搬之前（在 Table 底下）</td><td>(−80, 0)</td><td>0</td><td>1</td><td>(100, −110)，轉 90°，兩倍大</td></tr>
<tr><td><code>setParent(dragLayer)</code></td><td>(−80, 0)</td><td>0</td><td>1</td><td>跳到 (−80, 0)，轉回正，縮成一半</td></tr>
<tr><td><code>setParent(dragLayer, true)</code></td><td>(100, −110)</td><td>90</td><td>2</td><td>原地不動</td></tr>
</table>
<p>Unity 的 <code>SetParent</code> 剛好相反，預設保留世界位置。兩邊都寫過的人，最常在這裡踩雷。</p>
<p>實務上的做法：拖曳一張牌時，在<b>開始拖的那一刻</b>用 <code>setParent(dragLayer, true)</code> 搬一次，拖曳中只改位置，放開時再搬回去，而不是每格搬。只是要把牌移到最上層，用 <code>setSiblingIndex</code> 就好，不用換父節點。大量生成又銷毀的東西（子彈、飄字），用 <code>NodePool</code> 物件池重複使用，避免一直建立和銷毀。</p>

<h3><span class="badge lv3">專業</span>六、active 與 activeInHierarchy</h3>
<p><code>active</code> 是節點<b>自己的開關</b>。<code>activeInHierarchy</code> 是它<b>實際上</b>開不開：自己的開關是開的，而且一路往上每個祖先都是開的，才算開。</p>
<figure class="figure"><svg viewBox="0 0 640 270" class="fg" style="width:100%;max-width:640px" role="img" aria-label="Panel 關著時，子節點 Title 自己的 active 雖然是開，實際上還是關；右邊是父節點與子節點開關組合的真值表">
<rect x="20" y="30" width="200" height="62" rx="6" class="fg-b warm"/><text x="32" y="50" class="fg-t">Panel</text><text x="32" y="68" class="fg-t sm">自己的 active：關</text><text x="32" y="84" class="fg-t sm">activeInHierarchy：關</text>
<path d="M40 92 V147 H60" class="fg-l"/><path d="M40 147 V231 H60" class="fg-l"/>
<rect x="60" y="116" width="200" height="62" rx="6" class="fg-b"/><text x="72" y="136" class="fg-t">Title</text><text x="72" y="154" class="fg-t sm acc">自己的 active：開</text><text x="72" y="170" class="fg-t sm warm">activeInHierarchy：關</text>
<rect x="60" y="200" width="200" height="62" rx="6" class="fg-b"/><text x="72" y="220" class="fg-t">Close</text><text x="72" y="238" class="fg-t sm">自己的 active：關</text><text x="72" y="254" class="fg-t sm">activeInHierarchy：關</text>
<text x="460" y="40" text-anchor="middle" class="fg-t sm">子節點實際上開不開</text>
<rect x="410" y="52" width="105" height="30" class="fg-b"/><text x="462" y="72" text-anchor="middle" class="fg-t sm">子 active：開</text>
<rect x="515" y="52" width="105" height="30" class="fg-b"/><text x="567" y="72" text-anchor="middle" class="fg-t sm">子 active：關</text>
<rect x="300" y="82" width="110" height="40" class="fg-b"/><text x="355" y="107" text-anchor="middle" class="fg-t sm">父實際上開</text>
<rect x="410" y="82" width="105" height="40" class="fg-b hot"/><text x="462" y="107" text-anchor="middle" class="fg-t acc">開</text>
<rect x="515" y="82" width="105" height="40" class="fg-b"/><text x="567" y="107" text-anchor="middle" class="fg-t">關</text>
<rect x="300" y="122" width="110" height="40" class="fg-b"/><text x="355" y="147" text-anchor="middle" class="fg-t sm">父實際上關</text>
<rect x="410" y="122" width="105" height="40" class="fg-b warm"/><text x="462" y="140" text-anchor="middle" class="fg-t">關</text><text x="462" y="155" text-anchor="middle" class="fg-t sm">等父節點</text>
<rect x="515" y="122" width="105" height="40" class="fg-b"/><text x="567" y="147" text-anchor="middle" class="fg-t">關</text>
<text x="300" y="194" class="fg-t">把 Panel 打開時：</text>
<text x="300" y="214" class="fg-t sm">自己 active 是開的子孫，跑 onEnable</text>
<text x="300" y="232" class="fg-t sm">第一次啟用的，先跑 onLoad</text>
<text x="300" y="250" class="fg-t sm">Close 自己還關著，不會被叫到</text>
</svg><figcaption>四種組合裡，只有父節點實際上開、子節點自己也開，子節點才算開。Title 的開關雖然打開了，只要 Panel 關著，它就是關的。</figcaption></figure>
<p>追一次：Panel 是關的。你先寫 <code>title.active = true</code>，這時什麼回呼都不會跑，只是改了一個旗標，<code>title.activeInHierarchy</code> 仍然是 false。接著 <code>panel.active = true</code>，引擎由上往下走 Panel 的子樹：Panel 的元件先 <code>onEnable</code>（第一次的話先 <code>onLoad</code>），再到 Title；走到 Close 時，因為它自己的開關是關的，整條分支直接跳過。</p>
<p>元件也有同樣的一對：<code>enabled</code> 是元件自己的開關，<code>enabledInHierarchy</code> 要元件開著、而且節點實際上也開著才是 true。</p>
<p>兩個實務提醒：</p>
<ul>
<li><b>判斷「現在有沒有在運作」，看 <code>activeInHierarchy</code>，不要看 <code>active</code>。</b>而且就算它是 true，也不代表玩家看得到：圖層對不上、透明度是 0、縮放是 0、在鏡頭外，都看不到。</li>
<li><b>切換 active 不是便宜的旗標，是一趟遞迴。</b>整棵子樹要走一遍、每個元件的回呼都要跑。不要每格開關一個大面板；需要閃爍效果，改透明度或用動畫。</li>
</ul>

<h3><span class="badge lv3">專業</span>七、圖層與攝影機：誰拍得到誰</h3>
<p>每個節點的 <code>layer</code> 是一個 32 位元整數裡的<b>某一個位元</b>；每台攝影機的 <code>visibility</code> 是一組位元的<b>遮罩</b>（mask）。拍不拍，就看兩者做 AND 之後是不是 0：</p>
<figure class="figure"><svg viewBox="0 0 660 262" class="fg" style="width:100%;max-width:660px" role="img" aria-label="位元表：攝影機的 visibility 打開 UI_2D 和一個自訂位元；編輯器建的節點在 UI_2D，AND 之後不是 0，拍得到；new Node 建的節點在 DEFAULT，AND 之後是 0，拍不到">
<text x="206" y="40" text-anchor="middle" class="fg-t">位元 31</text>
<text x="262" y="40" text-anchor="middle" class="fg-t">30</text>
<text x="262" y="58" text-anchor="middle" class="fg-t sm">DEFAULT</text>
<text x="318" y="40" text-anchor="middle" class="fg-t">…</text>
<text x="374" y="40" text-anchor="middle" class="fg-t">25</text>
<text x="374" y="58" text-anchor="middle" class="fg-t sm">UI_2D</text>
<text x="430" y="40" text-anchor="middle" class="fg-t">…</text>
<text x="486" y="40" text-anchor="middle" class="fg-t">23</text>
<text x="486" y="58" text-anchor="middle" class="fg-t sm">UI_3D</text>
<text x="542" y="40" text-anchor="middle" class="fg-t">…</text>
<text x="598" y="40" text-anchor="middle" class="fg-t">0</text>
<text x="598" y="58" text-anchor="middle" class="fg-t sm">自訂</text>
<text x="20" y="89" class="fg-t">攝影機 visibility</text>
<rect x="180" y="70" width="52" height="28" rx="4" class="fg-b"/><text x="206" y="89" text-anchor="middle" class="fg-t mono">0</text>
<rect x="236" y="70" width="52" height="28" rx="4" class="fg-b"/><text x="262" y="89" text-anchor="middle" class="fg-t mono">0</text>
<text x="318" y="89" text-anchor="middle" class="fg-t sm">…</text>
<rect x="348" y="70" width="52" height="28" rx="4" class="fg-b hot"/><text x="374" y="89" text-anchor="middle" class="fg-t mono">1</text>
<text x="430" y="89" text-anchor="middle" class="fg-t sm">…</text>
<rect x="460" y="70" width="52" height="28" rx="4" class="fg-b"/><text x="486" y="89" text-anchor="middle" class="fg-t mono">0</text>
<text x="542" y="89" text-anchor="middle" class="fg-t sm">…</text>
<rect x="572" y="70" width="52" height="28" rx="4" class="fg-b hot"/><text x="598" y="89" text-anchor="middle" class="fg-t mono">1</text>
<text x="20" y="125" class="fg-t">編輯器建的節點</text>
<rect x="180" y="106" width="52" height="28" rx="4" class="fg-b"/><text x="206" y="125" text-anchor="middle" class="fg-t mono">0</text>
<rect x="236" y="106" width="52" height="28" rx="4" class="fg-b"/><text x="262" y="125" text-anchor="middle" class="fg-t mono">0</text>
<text x="318" y="125" text-anchor="middle" class="fg-t sm">…</text>
<rect x="348" y="106" width="52" height="28" rx="4" class="fg-b hot"/><text x="374" y="125" text-anchor="middle" class="fg-t mono">1</text>
<text x="430" y="125" text-anchor="middle" class="fg-t sm">…</text>
<rect x="460" y="106" width="52" height="28" rx="4" class="fg-b"/><text x="486" y="125" text-anchor="middle" class="fg-t mono">0</text>
<text x="542" y="125" text-anchor="middle" class="fg-t sm">…</text>
<rect x="572" y="106" width="52" height="28" rx="4" class="fg-b"/><text x="598" y="125" text-anchor="middle" class="fg-t mono">0</text>
<text x="20" y="161" class="fg-t acc">相 AND：拍得到</text>
<rect x="180" y="142" width="52" height="28" rx="4" class="fg-b"/><text x="206" y="161" text-anchor="middle" class="fg-t mono">0</text>
<rect x="236" y="142" width="52" height="28" rx="4" class="fg-b"/><text x="262" y="161" text-anchor="middle" class="fg-t mono">0</text>
<text x="318" y="161" text-anchor="middle" class="fg-t sm">…</text>
<rect x="348" y="142" width="52" height="28" rx="4" class="fg-b hot"/><text x="374" y="161" text-anchor="middle" class="fg-t mono">1</text>
<text x="430" y="161" text-anchor="middle" class="fg-t sm">…</text>
<rect x="460" y="142" width="52" height="28" rx="4" class="fg-b"/><text x="486" y="161" text-anchor="middle" class="fg-t mono">0</text>
<text x="542" y="161" text-anchor="middle" class="fg-t sm">…</text>
<rect x="572" y="142" width="52" height="28" rx="4" class="fg-b"/><text x="598" y="161" text-anchor="middle" class="fg-t mono">0</text>
<text x="20" y="211" class="fg-t">new Node() 的節點</text>
<rect x="180" y="192" width="52" height="28" rx="4" class="fg-b"/><text x="206" y="211" text-anchor="middle" class="fg-t mono">0</text>
<rect x="236" y="192" width="52" height="28" rx="4" class="fg-b alt"/><text x="262" y="211" text-anchor="middle" class="fg-t mono">1</text>
<text x="318" y="211" text-anchor="middle" class="fg-t sm">…</text>
<rect x="348" y="192" width="52" height="28" rx="4" class="fg-b"/><text x="374" y="211" text-anchor="middle" class="fg-t mono">0</text>
<text x="430" y="211" text-anchor="middle" class="fg-t sm">…</text>
<rect x="460" y="192" width="52" height="28" rx="4" class="fg-b"/><text x="486" y="211" text-anchor="middle" class="fg-t mono">0</text>
<text x="542" y="211" text-anchor="middle" class="fg-t sm">…</text>
<rect x="572" y="192" width="52" height="28" rx="4" class="fg-b"/><text x="598" y="211" text-anchor="middle" class="fg-t mono">0</text>
<text x="20" y="247" class="fg-t warm">相 AND：拍不到</text>
<rect x="180" y="228" width="52" height="28" rx="4" class="fg-b"/><text x="206" y="247" text-anchor="middle" class="fg-t mono">0</text>
<rect x="236" y="228" width="52" height="28" rx="4" class="fg-b"/><text x="262" y="247" text-anchor="middle" class="fg-t mono">0</text>
<text x="318" y="247" text-anchor="middle" class="fg-t sm">…</text>
<rect x="348" y="228" width="52" height="28" rx="4" class="fg-b"/><text x="374" y="247" text-anchor="middle" class="fg-t mono">0</text>
<text x="430" y="247" text-anchor="middle" class="fg-t sm">…</text>
<rect x="460" y="228" width="52" height="28" rx="4" class="fg-b"/><text x="486" y="247" text-anchor="middle" class="fg-t mono">0</text>
<text x="542" y="247" text-anchor="middle" class="fg-t sm">…</text>
<rect x="572" y="228" width="52" height="28" rx="4" class="fg-b"/><text x="598" y="247" text-anchor="middle" class="fg-t mono">0</text>
<line x1="20" y1="180" x2="640" y2="180" class="fg-l dim dash"/>
</svg><figcaption>UI_2D 是第 25 個位元（1 &lt;&lt; 25），DEFAULT 是第 30 個（1 &lt;&lt; 30）。攝影機的遮罩可以同時開好幾個位元；節點只會落在其中一個。</figcaption></figure>
<ul>
<li>在編輯器的 Canvas 底下建立的節點，圖層是 UI_2D，也就是 1 &lt;&lt; 25 = 33,554,432。Canvas 的攝影機遮罩裡有這個位元，所以拍得到。</li>
<li>用 <code>new Node()</code> 建立的節點，預設是 DEFAULT，也就是 1 &lt;&lt; 30 = 1,073,741,824。和 UI 攝影機的遮罩 AND 起來是 0：位置完全正確，卻怎麼樣都看不到。</li>
<li>用程式建的節點，子節點<b>不會</b>自動繼承父節點的圖層，要一個一個設：</li>
</ul>
<pre><code>function setLayerDeep(node: Node, layer: number) {
    node.layer = layer;
    node.children.forEach(child =&gt; setLayerDeep(child, layer));
}</code></pre>
<p>一個場景可以有好幾台攝影機。<code>priority</code> 決定繪製順序，數字小的先畫，後畫的蓋在上面；<code>clearFlags</code> 決定畫之前要不要先清掉畫面。常見的組合是：一台攝影機拍遊戲世界，一台拍 UI 疊在上面；或者讓一台攝影機把畫面畫進一張貼圖（<code>targetTexture</code>），拿來做小地圖、角色預覽。圖層只拿來決定「誰被哪台攝影機拍」，不要拿它來分類遊戲邏輯。</p>

<h3><span class="badge lv4">專家</span>八、元件即組合：EC、ECS 與資料導向</h3>
<p>Cocos 的節點加元件，學名叫 <b>EC</b>（entity-component）：節點是實體，元件同時帶著<b>資料和行為</b>。Unity 的 GameObject 加 MonoBehaviour 也是同一種設計。它好懂、好組合，一張牌是 UITransform ＋ Sprite ＋ Card 腳本，想讓它會發光，就再掛一個元件，不用改繼承關係。</p>
<p>業界常聽到的 <b>ECS</b>（entity-component-system）是另一回事：</p>
<ul>
<li>實體只是一個編號，本身什麼都沒有。</li>
<li>元件是純資料，同一種元件的資料緊密排在一起，例如所有位置放在同一個陣列裡。</li>
<li>系統是函式，一次處理「所有有位置和速度的實體」。</li>
</ul>
<p>好處在 CPU 快取：資料連續排列，一次讀進來的都是要用的。假設畫面上有 2,000 顆子彈。EC 的寫法是 2,000 個節點，各掛一個 Bullet 元件，每格 2,000 次 <code>update</code> 呼叫，每次去碰一個散落在記憶體各處的物件，再呼叫 2,000 次 <code>setPosition</code>，觸發 2,000 次標髒。資料導向的寫法是一個 BulletSystem 元件，用 <code>Float32Array</code> 存所有子彈的 x、y、速度，一個迴圈全部更新，最後只把結果寫到需要顯示的節點上（搭配物件池）。數量少的時候兩者沒差，上到幾千個，差距就會在低階手機上看得到。</p>
<p>其實 Cocos 自己內部就有這種「系統」：補間系統、物理系統，都是一次處理一整批物件。你可以把 EC 當成預設寫法，在真的量到瓶頸的那一小塊，換成資料導向。</p>
<h4>組合的幾個規矩</h4>
<ul>
<li>一個元件只做一件事。「卡片顯示」和「卡片點擊」可以是兩個元件。</li>
<li><code>getComponent</code> 是在節點的元件清單裡一個一個比對型別，<code>getComponentInChildren</code> 更要走整棵子樹。在 <code>onLoad</code> 找一次存起來。</li>
<li>元件之間的依賴用 <code>@requireComponent</code> 寫清楚，參照用屬性檢查器拖進來，比用名字找更不容易斷。</li>
<li>少用深的繼承鏈。<code>BaseCard</code> 往下繼承三、四層，通常可以拆成幾個小元件。</li>
</ul>

<h3><span class="badge lv4">專家</span>九、跟 Vue 元件樹、DOM 比一比，以及兩個少見的邊界</h3>
<table>
<tr><th></th><th>DOM</th><th>Vue 元件樹</th><th>Cocos 場景樹</th></tr>
<tr><td>代表</td><td>頁面上的元素</td><td>程式的邏輯結構，最後輸出成 DOM</td><td>畫面結構，同時也是座標系</td></tr>
<tr><td>位置</td><td>排版引擎依 CSS 算</td><td>交給 DOM</td><td>父節點的變換加上自己的本地值；要自動排版就掛 Widget、Layout</td></tr>
<tr><td>上下</td><td>文件順序加上 z-index、堆疊環境</td><td>交給 DOM</td><td>樹的順序：後畫的蓋在上面</td></tr>
<tr><td>事件</td><td>捕獲、冒泡</td><td>emit 往上、props 往下</td><td>觸控事件沿節點樹冒泡；自訂事件用 emit 或事件中心</td></tr>
<tr><td>更新</td><td>改屬性</td><td>改資料，框架自動重畫</td><td>你直接改節點，沒有響應式</td></tr>
</table>
<p>對應關係可以這樣記：預製件（prefab）像一個 Vue 單檔元件，<code>@property</code> 像 props，可是改了欄位，畫面不會自己變，你要親手去改 <code>label.string</code>。Vue 的 Teleport 把彈窗搬到 body 底下，在 Cocos 裡就是把彈窗掛到最上層的「彈窗層」節點，用的正是上面講的換父節點。</p>
<h4>邊界一：非等比例縮放加旋轉，會產生斜切</h4>
<figure class="figure"><svg viewBox="0 52 600 154" class="fg" style="width:100%;max-width:600px" role="img" aria-label="正方形子節點轉 45 度變成菱形但仍是直角；父節點只把 x 拉長 2 倍後，菱形的角變成 127 度和 53 度，產生斜切">
<rect x="70" y="80" width="60" height="60" class="fg-b alt"/>
<line x1="150" y1="110" x2="226" y2="110" class="fg-l"/><polygon points="234,110 226,105.5 226,114.5" class="fg-a"/><text x="192" y="100" text-anchor="middle" class="fg-t sm">子節點轉 45°</text>
<polygon points="300,67.6 342.4,110 300,152.4 257.6,110" class="fg-b alt"/><text x="300" y="92" text-anchor="middle" class="fg-t sm">90°</text>
<line x1="356" y1="110" x2="394" y2="110" class="fg-l warm"/><polygon points="402,110 394,105.5 394,114.5" class="fg-a warm"/><text x="379" y="132" text-anchor="middle" class="fg-t sm warm">父 x × 2</text>
<polygon points="500,67.6 584.8,110 500,152.4 415.2,110" class="fg-b warm"/><text x="500" y="92" text-anchor="middle" class="fg-t sm warm">127°</text><text x="548" y="114" text-anchor="middle" class="fg-t sm warm">53°</text>
<text x="100" y="180" text-anchor="middle" class="fg-t sm">① 子節點：正方形</text><text x="300" y="180" text-anchor="middle" class="fg-t sm">② 轉 45°：還是直角</text><text x="500" y="180" text-anchor="middle" class="fg-t sm">③ 父節點只拉寬 x</text>
<text x="500" y="198" text-anchor="middle" class="fg-t sm warm">直角不見了：斜切</text>
</svg><figcaption>父節點的 x 和 y 縮放不一樣，子節點又有旋轉，正方形就會被拉成角度不是 90° 的菱形。這種斜切（skew）用 worldScale 的三個數字表達不了，只有世界矩陣記得完整的答案。</figcaption></figure>
<p>引擎的世界矩陣是對的，畫面也是對的。但如果你的程式從 <code>worldScale</code> 和 <code>worldRotation</code> 去推「這張牌現在長什麼樣」，就會算錯。避免的方法很簡單：<b>需要非等比例縮放的節點，不要再讓它的子節點旋轉</b>；或者把縮放放在最底層、不會再有子節點的那一層。</p>
<h4>邊界二：離原點太遠，畫面會抖</h4>
<p>JavaScript 的數字是 64 位元浮點數，節點的位置算得很準；但送給 GPU 的頂點資料是 32 位元浮點數，只有大約 7 位有效數字。座標在一百萬左右時，相鄰兩個能表示的數字差到 0.1 像素上下；到一千萬左右，差一整個像素。一個無限捲動的跑酷遊戲，跑久了角色會開始抖。解法叫<b>浮動原點</b>（floating origin）：每隔一段距離，把整個世界往回移，讓玩家附近永遠靠近原點。2D 小遊戲很少碰到，但做大地圖時要知道它的存在。</p>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td><code>node.position</code> 就是它在畫面上的位置</td><td>那是相對父節點的本地值。畫面上的位置要看 <code>worldPosition</code>，再經過攝影機。</td></tr>
<tr><td>直接改 <code>node.position.x</code> 就會動</td><td>讀到的是唯讀的暫存值，引擎也不會被通知。一律用 <code>setPosition</code>。</td></tr>
<tr><td><code>active</code> 是 true 就看得到</td><td>要看 <code>activeInHierarchy</code>；就算它是 true，圖層、透明度、縮放、鏡頭範圍也都會讓它看不到。</td></tr>
<tr><td>每改一次位置，引擎就重算整棵樹</td><td>只做標記，用到才算，而且只算被讀到的那一串。</td></tr>
<tr><td>換父節點跟改一個欄位一樣便宜</td><td>兩邊的子節點陣列、整棵子樹的標髒、事件，還可能觸發整棵子樹的 onDisable／onEnable。</td></tr>
<tr><td>旋轉父節點，子節點會繞自己的中心轉</td><td>子節點繞的是父節點的原點，會甩一大圈。</td></tr>
<tr><td>Cocos 是 ECS 引擎</td><td>是 EC：元件同時有資料和行為。純 ECS 的元件只有資料，邏輯在系統裡。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>Vue 與前端</b>：在 Vue 裡，元件樹是邏輯結構，畫面位置交給 CSS。在 Cocos 裡，父子關係同時就是座標系，所以「邏輯上屬於誰」和「畫面上掛在誰底下」要分開想。不要只因為某個血條邏輯上屬於某個角色，就把它掛在會旋轉、會縮放的角色節點底下。</li>
<li><b>CSS</b>：<code>transform</code> 疊在巢狀元素上，瀏覽器做的也是矩陣相乘。這一章的數字，直接搬去理解 CSS 的 <code>matrix()</code> 一樣成立。</li>
<li><b>Unity</b>：<code>Transform</code> 的 <code>localPosition</code> 和 <code>position</code>、攝影機的 Culling Mask、圖層，概念完全相同；只有 <code>SetParent</code> 的預設值相反。Unity 的 DOTS 則是真正的 ECS。</li>
<li><b>後端</b>：髒旗標到處都有。快取在寫入時標失效、讀取時才重建；增量建置只重編改過的檔案；Vue 的 <code>computed</code> 也是依賴改了先標髒，被讀到時才重算。看懂一次，就處處認得出來。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<ol>
<li>「本地座標和世界座標差在哪？世界座標是怎麼算出來的？」</li>
<li>「父節點在 (100, 50)、轉 90°、放大 2 倍，子節點的本地座標是 (−80, 0)，子節點在世界裡的哪裡？」</li>
<li>「什麼是髒旗標？引擎為什麼要用它？」</li>
<li>「active 和 activeInHierarchy 差在哪？在什麼情況下會寫出 bug？」</li>
<li>「換父節點的時候會發生什麼事？保留世界變換是什麼意思？」</li>
<li>「EC 和 ECS 差在哪？什麼時候值得把一群物件改成資料導向的寫法？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>本地座標是相對父節點的位置、旋轉、縮放，是我們設定的值；世界座標是把所有祖先的變換依序套上之後，在場景裡的實際位置。引擎替每個節點組出本地變換矩陣（縮放、旋轉、平移），世界矩陣等於父節點的世界矩陣乘上自己的本地矩陣，由根節點一路往下乘。</li>
<li>先縮放：(−160, 0)。再逆時針轉 90°，(x, y) 變成 (−y, x)：(0, −160)。最後加上 (100, 50)：(100, −110)。如果 Canvas 不在原點，實際的 worldPosition 還要再加上 Canvas 的位置。</li>
<li>改變節點的本地值時，不立刻重算世界值，只把自己和子孫標記為過期；等到真的有人讀取世界值，或繪製需要時，才從最上面那個過期的祖先往下重算。一格裡同一個節點可能被改好幾次，這樣只要算一次；沒人讀的分支也不必算。代價是讀取時可能觸發重算，所以要避免寫一次、讀一次交錯進行。</li>
<li>active 是節點自己的開關，activeInHierarchy 是它實際上是否啟用，要自己和所有祖先都開著才是 true。常見的 bug：用 active 判斷面板是否在運作，但它的父節點早就關了；或在父節點關著時把子節點設成 true，以為 onEnable 會跑，其實要等父節點打開才會跑。</li>
<li>節點會從舊父節點的子節點陣列移除、加入新的，整棵子樹的世界變換標為過期，發出階層改變的事件；如果啟用狀態因此改變，整棵子樹還會跑 onDisable 或 onEnable。Cocos 的 setParent 預設保留本地值，所以在畫面上會跳到新的位置；第二個參數傳 true 時，引擎用新父節點世界矩陣的反矩陣算出新的本地值，讓它在畫面上原地不動。</li>
<li>EC 的元件同時有資料和行為，掛在實體物件上，好懂好組合；ECS 的實體只是編號，元件是緊密排列的純資料，系統一次處理一整批，對 CPU 快取友善、容易平行化。當同一種物件數量上千、每格都要更新，而且量測顯示它是瓶頸時，值得把那一塊改成一個系統加連續陣列的寫法，其他部分維持 EC。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>Table 在 (0, 0)、角度 0、縮放 0.5，Card 的本地座標是 (200, 100)。Card 的世界座標是多少？Table 改成轉 180° 之後呢？</li>
<li>用第三節 CurrentCard 的世界矩陣，算出這張 120 × 160、錨點在中心的牌，左下角 (−60, −80) 的世界座標。</li>
<li>Panel 關著。你依序執行 <code>title.active = true</code>、<code>panel.active = true</code>。哪些回呼會跑？什麼時候跑？</li>
<li>你用 <code>new Node()</code> 建了一個節點，掛上 Sprite、設好圖片，加到 Canvas 底下，畫面上卻什麼都沒有。列出你會依序檢查的四件事。</li>
<li>Canvas 攝影機的 <code>visibility</code> 設成 UI_2D 加上自訂的第 3 號位元（1 &lt;&lt; 3）。這個遮罩的數值是多少？圖層是 1 &lt;&lt; 3 的節點拍得到嗎？DEFAULT 的呢？</li>
<li>把一顆拖曳中的牌從「轉 30°、縮放 1.5」的手牌區，搬到沒有變換的拖曳層。不傳第二個參數和傳 true，玩家各會看到什麼？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>縮放 0.5：(100, 50)；不轉；加上 (0, 0)：世界座標 (100, 50)。轉 180° 時，(x, y) 變成 (−x, −y)：(−100, −50)。</li>
<li>x = 0 × (−60) + (−2) × (−80) + 100 = 260；y = 2 × (−60) + 0 × (−80) − 110 = −230。世界座標 (260, −230)（以 Canvas 為基準）。</li>
<li>第一行什麼回呼都不跑，只改了旗標。第二行時，引擎由上往下啟用：Panel 的元件，然後 Title 的元件；第一次啟用的元件先 onLoad 再 onEnable，以前啟用過的只跑 onEnable。它們的 start 會在各自第一次 update 之前執行。</li>
<li>一、圖層：new Node() 是 DEFAULT，要改成 UI_2D 或父節點的圖層。二、啟用狀態：自己和祖先的 activeInHierarchy。三、位置與大小：是不是在鏡頭外，或 UITransform 的寬高、縮放是 0。四、圖片本身：spriteFrame 有沒有真的設上、資源有沒有載入成功。</li>
<li>33,554,432 + 8 = 33,554,440。圖層 1 &lt;&lt; 3 的節點：8 AND 33,554,440 = 8，不是 0，拍得到。DEFAULT（1 &lt;&lt; 30）AND 之後是 0，拍不到。</li>
<li>不傳第二個參數：牌保留本地值，換了父節點等於換了座標系，牌會跳到別的位置、轉回正、縮回原本大小，看起來像瞬間閃到別處。傳 true：引擎重算本地值，變成轉 30°、縮放 1.5 的本地值，牌在畫面上原地不動，玩家感覺不到任何變化。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>Robert Nystrom《Game Programming Patterns》</b>（gameprogrammingpatterns.com，可免費線上閱讀）：「Dirty Flag」一章用的正是場景圖的變換當例子；「Component」和「Data Locality」兩章，對應本章第八節。</li>
<li><b>3Blue1Brown〈Essence of Linear Algebra〉</b>（YouTube 系列影片）：用動畫把「矩陣就是變換」「矩陣相乘就是接起兩次變換」講到你忘不掉。</li>
<li><b>Cocos Creator 3.8 官方使用手冊</b>（docs.cocos.com/creator/3.8/manual）：節點與元件、座標系與變換、圖層、攝影機這幾個章節。</li>
<li><b>Jason Gregory《Game Engine Architecture》</b>：遊戲物件模型和場景管理的章節，看大型商業引擎怎麼取捨 EC 和資料導向。</li>
<li><b>Sander Mertens 的 ECS FAQ</b>（github.com/SanderMertens/ecs-faq）：ECS 的觀念、實作方式和常見誤解，整理得很完整。</li>
</ul>
` });
