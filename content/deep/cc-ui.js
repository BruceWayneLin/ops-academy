DEEP({ 'cc-ui': `
<p>上一課你認識了七個 UI 元件，也知道「圖集可以省 draw call」。這一章往下挖一層：引擎每一個影格到底怎麼把 UI 畫出來？一張圖變成幾個頂點、幾個位元組？什麼東西會把好好的一批切成兩批？九宮格的四條邊是怎麼算出來的？一千筆的排行榜為什麼會卡，又怎麼用十個節點畫完？最後，同一套 UI 怎麼在 4:3 的平板和 20:9 的手機上都不跑版。手機遊戲的流暢度，大半就決定在這些細節裡。文中引擎行為以 Cocos Creator 3.8 的原始碼為準，數字都是典型的量級。</p>

<h3><span class="badge lv1">基礎</span>一、UI 是怎麼畫出來的：從節點樹到 draw call</h3>
<p>把顯示晶片（GPU）想成一間印刷廠。每換一次印版（貼圖、材質），師傅就得停機、換版、對位，這段準備時間比真正印的時間還貴。所以聰明的做法是：同一塊印版能印的東西，一次印完。引擎的 2D 渲染，就是在幫你把「同一塊印版」的東西排在一起。</p>
<figure class="figure"><svg viewBox="0 0 680 250" class="fg" style="width:100%;max-width:680px" role="img" aria-label="渲染流程：依序走訪節點樹，組裝器為每個 Sprite 填四個頂點，合批判斷貼圖與材質是否相同，最後切成三個批次，各是一次 draw call">
<text x="100" y="22" text-anchor="middle" class="fg-t lg">節點樹，依序走訪</text>
<text x="280" y="22" text-anchor="middle" class="fg-t lg">組裝器填頂點</text>
<text x="450" y="22" text-anchor="middle" class="fg-t lg">合批判斷</text>
<text x="605" y="22" text-anchor="middle" class="fg-t lg">送給 GPU</text>
<rect x="20" y="34" width="160" height="170" rx="8" class="fg-b"/>
<rect x="30" y="46" width="140" height="28" rx="5" class="fg-b alt"/><text x="40" y="65" class="fg-t sm">1 卡片底圖</text><text x="162" y="65" text-anchor="end" class="fg-t sm">圖集A</text>
<rect x="30" y="82" width="140" height="28" rx="5" class="fg-b alt"/><text x="40" y="101" class="fg-t sm">2 花色圖示</text><text x="162" y="101" text-anchor="end" class="fg-t sm">圖集A</text>
<rect x="30" y="118" width="140" height="28" rx="5" class="fg-b warm"/><text x="40" y="137" class="fg-t sm">3 數字 Label</text><text x="162" y="137" text-anchor="end" class="fg-t sm">自己的</text>
<rect x="30" y="154" width="140" height="28" rx="5" class="fg-b alt"/><text x="40" y="173" class="fg-t sm">4 下一張底圖</text><text x="162" y="173" text-anchor="end" class="fg-t sm">圖集A</text>
<line x1="180" y1="119" x2="202" y2="119" class="fg-l"/><polygon points="210,119 202,114.5 202,123.5" class="fg-a"/>
<rect x="210" y="34" width="140" height="170" rx="8" class="fg-b"/>
<text x="280" y="66" text-anchor="middle" class="fg-t">每個 Sprite</text>
<text x="280" y="86" text-anchor="middle" class="fg-t">4 個頂點</text>
<text x="280" y="116" text-anchor="middle" class="fg-t sm">每個頂點 9 個數字</text>
<text x="280" y="136" text-anchor="middle" class="fg-t sm mono">x y z u v r g b a</text>
<text x="280" y="156" text-anchor="middle" class="fg-t sm">= 36 位元組</text>
<text x="280" y="178" text-anchor="middle" class="fg-t sm">位置先在 CPU</text>
<text x="280" y="194" text-anchor="middle" class="fg-t sm">換成世界座標</text>
<line x1="350" y1="119" x2="372" y2="119" class="fg-l"/><polygon points="380,119 372,114.5 372,123.5" class="fg-a"/>
<rect x="380" y="34" width="140" height="170" rx="8" class="fg-b"/>
<text x="450" y="66" text-anchor="middle" class="fg-t acc">跟上一個比</text>
<text x="450" y="96" text-anchor="middle" class="fg-t sm">貼圖一樣嗎？</text>
<text x="450" y="114" text-anchor="middle" class="fg-t sm">材質一樣嗎？</text>
<text x="450" y="132" text-anchor="middle" class="fg-t sm">Mask、layer 一樣嗎？</text>
<text x="450" y="164" text-anchor="middle" class="fg-t sm acc">一樣：併進這一批</text>
<text x="450" y="184" text-anchor="middle" class="fg-t sm warm">不一樣：切一批新的</text>
<line x1="520" y1="119" x2="542" y2="119" class="fg-l"/><polygon points="550,119 542,114.5 542,123.5" class="fg-a"/>
<rect x="560" y="40" width="90" height="46" rx="6" class="fg-b hot"/><text x="605" y="60" text-anchor="middle" class="fg-t">第 1 批</text><text x="605" y="77" text-anchor="middle" class="fg-t sm">1 + 2</text>
<rect x="560" y="96" width="90" height="46" rx="6" class="fg-b warm"/><text x="605" y="116" text-anchor="middle" class="fg-t">第 2 批</text><text x="605" y="133" text-anchor="middle" class="fg-t sm">3</text>
<rect x="560" y="152" width="90" height="46" rx="6" class="fg-b hot"/><text x="605" y="172" text-anchor="middle" class="fg-t">第 3 批</text><text x="605" y="189" text-anchor="middle" class="fg-t sm">4</text>
<text x="340" y="236" text-anchor="middle" class="fg-t sm">3 個批次 = 3 次 draw call。Label 夾在中間，把同一張圖集切成了兩段。</text>
</svg><figcaption>每個影格，引擎照樹的順序走一遍，替每個 UI 元件填頂點，再跟前一個比：能共用印版就併進同一批，不能就切開。一批就是一次 draw call。</figcaption></figure>
<p>具體的流程是這樣，每個影格都跑一次（在你的 <code>update</code>、tween、Layout 都做完之後）：</p>
<ol>
<li><b>走訪</b>：從 Canvas 開始，深度優先，先畫父節點，再依序畫子節點。停用的節點和它整棵子樹直接略過；累積透明度是 0 的節點，也連同子樹一起略過，不會被畫。</li>
<li><b>填頂點</b>：每個 UI 元件有一個組裝器（assembler），負責把自己變成三角形。Simple 的 Sprite 是一個矩形：4 個頂點、2 個三角形、6 個索引。每個頂點存 9 個 32 位元的浮點數：位置 x、y、z，貼圖座標 u、v，顏色 r、g、b、a，也就是 36 個位元組。</li>
<li><b>合批</b>（batching）：每填完一個元件，就跟目前這一批比較貼圖、材質、模板（stencil）狀態、layer。全部一樣，頂點就接在後面；有一樣不同，就把目前這批收起來，開一批新的。</li>
<li><b>送出</b>：每一批是一次 draw call。</li>
</ol>
<h4>用一張牌實際算一次</h4>
<p>一張 200 × 280 的牌，錨點在正中央，世界座標是 (360, 640)。四個頂點的位置是 (260, 500)、(460, 500)、(260, 780)、(460, 780)。如果這張牌在一張 1024 × 1024 的圖集裡，從 x = 512 到 712 的地方，它的 u 就從 512 ÷ 1024 = 0.5 到 712 ÷ 1024 ≈ 0.695，v 也照同樣的方法算。四個頂點 4 × 36 = 144 個位元組，加上 6 個 16 位元的索引 12 個位元組。</p>
<p>注意第 2 步的「位置先在 CPU 換成世界座標」。因為頂點已經是世界座標，GPU 不需要知道每張圖屬於哪個節點，所以不同節點的圖才能塞進同一次 draw call，這就是合批能成立的原因。代價是：節點一移動、旋轉、縮放，CPU 就得重算它的頂點。引擎會用一個版本號記住「這個節點上次之後有沒有變過」，沒變就不算。所以<b>靜止的 UI 很便宜，一直在動的 UI 才花 CPU</b>。</p>

<h3><span class="badge lv2">進階</span>二、什麼會把一批切成兩批</h3>
<p>照引擎的判斷條件，下面這些會切斷合批：</p>
<table>
<tr><th>原因</th><th>常見的來源</th></tr>
<tr><td>貼圖不同</td><td>圖沒有放進同一張圖集；用系統字型的 Label（每個 Label 有自己的貼圖）</td></tr>
<tr><td>材質不同</td><td>自訂材質（customMaterial）；Sprite 勾了 Grayscale（換成內建的灰階材質）；呼叫過 <code>getMaterialInstance</code>，拿到一份只屬於自己的材質</td></tr>
<tr><td>模板狀態不同</td><td>Mask：進入和離開遮罩都要切，Mask 本身還要多畫清除和寫入形狀</td></tr>
<tr><td>自己送出批次的元件</td><td>Spine、DragonBones、Graphics、3D 模型，它們不走一般的合批流程</td></tr>
<tr><td>layer 不同</td><td>同一個畫面裡混了不同 layer 的節點</td></tr>
</table>
<p>反過來，下面這些<b>不會</b>切斷：改顏色、改透明度（顏色是頂點資料的一部分）、移動、旋轉、縮放、同一張圖集裡的不同圖、節點數量本身。draw call 的數量，看的是「順序上被打斷幾次」，不是節點有幾個。</p>
<h4>一個排行榜的實際算法</h4>
<p>排行榜每一列有三個節點：底圖、頭像框（同一張圖集）、名字（系統字型 Label）。照每列「底圖、頭像框、名字」的順序擺：</p>
<figure class="figure"><svg viewBox="0 0 680 300" class="fg" style="width:100%;max-width:680px" role="img" aria-label="三種排列方式的批次數：原本每列圖和字交錯是 6 批；把文字移到後面是 4 批；文字改成 CHAR 模式只剩 2 批">
<text x="20" y="42" class="fg-t">原本</text><text x="20" y="60" class="fg-t lg warm">6 批</text>
<rect x="100" y="28" width="58" height="30" rx="4" class="fg-b alt"/><text x="129" y="48" text-anchor="middle" class="fg-t sm">底 1</text>
<rect x="162" y="28" width="58" height="30" rx="4" class="fg-b alt"/><text x="191" y="48" text-anchor="middle" class="fg-t sm">框 1</text>
<rect x="224" y="28" width="58" height="30" rx="4" class="fg-b warm"/><text x="253" y="48" text-anchor="middle" class="fg-t sm">字 1</text>
<rect x="286" y="28" width="58" height="30" rx="4" class="fg-b alt"/><text x="315" y="48" text-anchor="middle" class="fg-t sm">底 2</text>
<rect x="348" y="28" width="58" height="30" rx="4" class="fg-b alt"/><text x="377" y="48" text-anchor="middle" class="fg-t sm">框 2</text>
<rect x="410" y="28" width="58" height="30" rx="4" class="fg-b warm"/><text x="439" y="48" text-anchor="middle" class="fg-t sm">字 2</text>
<rect x="472" y="28" width="58" height="30" rx="4" class="fg-b alt"/><text x="501" y="48" text-anchor="middle" class="fg-t sm">底 3</text>
<rect x="534" y="28" width="58" height="30" rx="4" class="fg-b alt"/><text x="563" y="48" text-anchor="middle" class="fg-t sm">框 3</text>
<rect x="596" y="28" width="58" height="30" rx="4" class="fg-b warm"/><text x="625" y="48" text-anchor="middle" class="fg-t sm">字 3</text>
<path d="M102 64 V70 H218 V64" class="fg-l"/><path d="M226 64 V70 H280 V64" class="fg-l"/><path d="M288 64 V70 H404 V64" class="fg-l"/><path d="M412 64 V70 H466 V64" class="fg-l"/><path d="M474 64 V70 H590 V64" class="fg-l"/><path d="M598 64 V70 H652 V64" class="fg-l"/>
<text x="20" y="122" class="fg-t">文字放後面</text><text x="20" y="140" class="fg-t lg">4 批</text>
<rect x="100" y="108" width="58" height="30" rx="4" class="fg-b alt"/><text x="129" y="128" text-anchor="middle" class="fg-t sm">底 1</text>
<rect x="162" y="108" width="58" height="30" rx="4" class="fg-b alt"/><text x="191" y="128" text-anchor="middle" class="fg-t sm">框 1</text>
<rect x="224" y="108" width="58" height="30" rx="4" class="fg-b alt"/><text x="253" y="128" text-anchor="middle" class="fg-t sm">底 2</text>
<rect x="286" y="108" width="58" height="30" rx="4" class="fg-b alt"/><text x="315" y="128" text-anchor="middle" class="fg-t sm">框 2</text>
<rect x="348" y="108" width="58" height="30" rx="4" class="fg-b alt"/><text x="377" y="128" text-anchor="middle" class="fg-t sm">底 3</text>
<rect x="410" y="108" width="58" height="30" rx="4" class="fg-b alt"/><text x="439" y="128" text-anchor="middle" class="fg-t sm">框 3</text>
<rect x="472" y="108" width="58" height="30" rx="4" class="fg-b warm"/><text x="501" y="128" text-anchor="middle" class="fg-t sm">字 1</text>
<rect x="534" y="108" width="58" height="30" rx="4" class="fg-b warm"/><text x="563" y="128" text-anchor="middle" class="fg-t sm">字 2</text>
<rect x="596" y="108" width="58" height="30" rx="4" class="fg-b warm"/><text x="625" y="128" text-anchor="middle" class="fg-t sm">字 3</text>
<path d="M102 144 V150 H466 V144" class="fg-l"/><path d="M474 144 V150 H528 V144" class="fg-l"/><path d="M536 144 V150 H590 V144" class="fg-l"/><path d="M598 144 V150 H652 V144" class="fg-l"/>
<text x="20" y="202" class="fg-t">再改 CHAR</text><text x="20" y="220" class="fg-t lg acc">2 批</text>
<rect x="100" y="188" width="58" height="30" rx="4" class="fg-b alt"/><text x="129" y="208" text-anchor="middle" class="fg-t sm">底 1</text>
<rect x="162" y="188" width="58" height="30" rx="4" class="fg-b alt"/><text x="191" y="208" text-anchor="middle" class="fg-t sm">框 1</text>
<rect x="224" y="188" width="58" height="30" rx="4" class="fg-b alt"/><text x="253" y="208" text-anchor="middle" class="fg-t sm">底 2</text>
<rect x="286" y="188" width="58" height="30" rx="4" class="fg-b alt"/><text x="315" y="208" text-anchor="middle" class="fg-t sm">框 2</text>
<rect x="348" y="188" width="58" height="30" rx="4" class="fg-b alt"/><text x="377" y="208" text-anchor="middle" class="fg-t sm">底 3</text>
<rect x="410" y="188" width="58" height="30" rx="4" class="fg-b alt"/><text x="439" y="208" text-anchor="middle" class="fg-t sm">框 3</text>
<rect x="472" y="188" width="58" height="30" rx="4" class="fg-b hot"/><text x="501" y="208" text-anchor="middle" class="fg-t sm">字 1</text>
<rect x="534" y="188" width="58" height="30" rx="4" class="fg-b hot"/><text x="563" y="208" text-anchor="middle" class="fg-t sm">字 2</text>
<rect x="596" y="188" width="58" height="30" rx="4" class="fg-b hot"/><text x="625" y="208" text-anchor="middle" class="fg-t sm">字 3</text>
<path d="M102 224 V230 H466 V224" class="fg-l on"/><path d="M474 224 V230 H652 V224" class="fg-l on"/>
<rect x="100" y="262" width="16" height="14" rx="3" class="fg-b alt"/><text x="122" y="274" class="fg-t sm">圖集 A 的圖</text>
<rect x="250" y="262" width="16" height="14" rx="3" class="fg-b warm"/><text x="272" y="274" class="fg-t sm">Label 自己的貼圖</text>
<rect x="420" y="262" width="16" height="14" rx="3" class="fg-b hot"/><text x="442" y="274" class="fg-t sm">共用的字元圖集</text>
</svg><figcaption>底下的括號是一批。同樣的九個節點，只改順序和 Label 的模式，批次從 6 變成 2。如果是 10 列，三種做法分別是 20、11、2 次 draw call。</figcaption></figure>
<ol>
<li><b>原本</b>：每一列「圖、圖、字」，字把圖集切斷，每列 2 批。10 列就是 20 次 draw call。</li>
<li><b>把所有名字移到後面</b>：每一列拆成兩部分，圖的部分放在一個容器節點裡，名字放在另一個排在後面的容器裡（位置用程式對齊）。所有的圖連成一批，名字還是一個一批：10 列是 1 + 10 = 11 次。</li>
<li><b>名字改用 CHAR 模式</b>（第四節細講）：所有名字共用一張字元圖集，也連成一批：總共 2 次。</li>
</ol>
<p>要確認，就看預覽畫面角落的統計面板（Draw Call 那一行），而且要看<b>建置之後</b>的版本，因為 Auto Atlas 是在建置時才打包的。想看每一次 draw call 畫了什麼，可以用瀏覽器擴充功能 Spector.js 抓一個影格，一批一批點開來看。</p>

<h3><span class="badge lv2">進階</span>三、九宮格的數學</h3>
<p>上一課說九宮格的四個角不拉伸。精確地說，引擎是這樣算的。設原圖的四條邊界是左 L、右 R、上 T、下 B（單位是原圖的像素），節點的寬是 W、高是 H，錨點是 (ax, ay)：</p>
<pre><code>xScale = min(1, W / (L + R))  // below 1 only if too narrow
x0 = -ax * W                  // left edge
x1 = x0 + L * xScale          // left corner ends
x2 = x1 + max(0, W - L - R)   // right corner starts
x3 = x0 + W                   // right edge
// y0..y3: the same, with B, T and H</code></pre>
<p>四個 x 乘上四個 y，得到 4 × 4 = 16 個頂點，切成 9 個矩形、18 個三角形、54 個索引。代入一個實際的例子：原圖 60 × 60，四條邊界都是 20；節點 300 × 80，錨點在正中央。</p>
<figure class="figure"><svg viewBox="0 0 680 260" class="fg" style="width:100%;max-width:680px" role="img" aria-label="左邊是 60 乘 60 的原圖，邊界各 20；右邊是 300 乘 80 的節點，頂點 x 座標為 -150、-130、130、150，y 座標為 -40、-20、20、40">
<text x="80" y="24" text-anchor="middle" class="fg-t lg">原圖 60 × 60</text>
<text x="40" y="54" text-anchor="middle" class="fg-t sm mono">20</text><text x="80" y="54" text-anchor="middle" class="fg-t sm mono">20</text><text x="120" y="54" text-anchor="middle" class="fg-t sm mono">20</text>
<rect x="20" y="60" width="120" height="120" rx="14" class="fg-b alt"/>
<line x1="60" y1="60" x2="60" y2="180" class="fg-l dash"/><line x1="100" y1="60" x2="100" y2="180" class="fg-l dash"/>
<line x1="20" y1="100" x2="140" y2="100" class="fg-l dash"/><line x1="20" y1="140" x2="140" y2="140" class="fg-l dash"/>
<text x="80" y="204" text-anchor="middle" class="fg-t sm mono">u：0、1/3、2/3、1</text>
<text x="425" y="24" text-anchor="middle" class="fg-t lg">節點 300 × 80，錨點 (0.5, 0.5)</text>
<rect x="200" y="70" width="450" height="120" rx="14" class="fg-b hot"/>
<line x1="230" y1="70" x2="230" y2="190" class="fg-l dash"/><line x1="620" y1="70" x2="620" y2="190" class="fg-l dash"/>
<line x1="200" y1="100" x2="650" y2="100" class="fg-l dash"/><line x1="200" y1="160" x2="650" y2="160" class="fg-l dash"/>
<text x="425" y="135" text-anchor="middle" class="fg-t">中間 260 × 40：上下左右都拉</text>
<text x="425" y="90" text-anchor="middle" class="fg-t sm">上邊：只左右拉</text>
<text x="425" y="180" text-anchor="middle" class="fg-t sm">下邊：只左右拉</text>
<text x="200" y="210" text-anchor="middle" class="fg-t sm mono">−150</text><text x="236" y="210" text-anchor="middle" class="fg-t sm mono">−130</text>
<text x="614" y="210" text-anchor="middle" class="fg-t sm mono">130</text><text x="650" y="210" text-anchor="middle" class="fg-t sm mono">150</text>
<text x="190" y="74" text-anchor="end" class="fg-t sm mono">40</text><text x="190" y="104" text-anchor="end" class="fg-t sm mono">20</text>
<text x="190" y="164" text-anchor="end" class="fg-t sm mono">−20</text><text x="190" y="194" text-anchor="end" class="fg-t sm mono">−40</text>
<text x="425" y="240" text-anchor="middle" class="fg-t sm acc">四個角永遠是 20 × 20 的原圖像素，一點都不變形</text>
</svg><figcaption>同一張 60 × 60 的小圖，切成九塊後拉成 300 × 80：四個角原封不動，上下兩條只橫向拉，左右兩條只直向拉，中間兩個方向都拉。</figcaption></figure>
<ul>
<li><b>正常情況</b>：xScale = min(1, 300 ÷ 40) = 1，所以 x 是 −150、−130、130、150；y 是 −40、−20、20、40。中間那塊是 260 × 40。貼圖座標 u 是 0、1/3、2/3、1（假設這張圖沒有放進圖集）。</li>
<li><b>節點比兩個角加起來還窄</b>：把寬改成 30。xScale = 30 ÷ 40 = 0.75，x 變成 −15、0、0、15：兩個角各被等比例壓成 15 寬，中間寬度是 0。所以按鈕寬度不要小於左右邊界的總和，不然圓角會被壓扁。</li>
<li><b>省多少記憶體</b>：60 × 60 的圖在 GPU 上是 60 × 60 × 4 = 14,400 位元組；如果直接畫一張 300 × 80 的圖，是 96,000 位元組，而且每換一個尺寸就要一張新圖。九宮格讓所有尺寸共用那 14 KB。</li>
</ul>
<h4>接縫和細線：九宮格最常見的毛病</h4>
<p>圖片放大時，GPU 會用線性過濾（linear filtering）在相鄰像素之間取平均。圖放在圖集裡時，貼著邊的像素旁邊就是別張圖，取平均時就會混進別人的顏色，在九塊的接縫或圖的邊緣出現一條細線。Auto Atlas 的預設設定已經在處理這件事：每張圖之間留 2 像素的間距（Padding），並開啟擴邊（Padding Bleed），把邊緣像素往外複製一圈。自己手動打包圖集時，要記得這兩項。另外，邊界最好落在顏色平坦的地方，不要正好切在漸層或陰影上。</p>
<p>Tiled 模式則是另一回事：它是一塊一塊重複鋪，每一塊都是一組頂點。用很小的花紋鋪滿全螢幕，頂點數會跟著塊數變多，這時讓美術畫一張大一點的花紋，或改用材質的重複（repeat）取樣會比較省。</p>

<h3><span class="badge lv3">專業</span>四、Label 的四種畫法：記憶體和 draw call 的取捨</h3>
<p>文字是 UI 裡最容易出效能問題的地方。原因是：GPU 只會畫貼圖，不會「寫字」。所以每個 Label 都得先把字變成圖，差別只在「什麼時候變、變成誰的圖」。</p>
<figure class="figure"><svg viewBox="0 0 680 280" class="fg" style="width:100%;max-width:680px" role="img" aria-label="Label 的四種畫法：NONE 每個 Label 一張自己的貼圖；BITMAP 畫好放進動態圖集；CHAR 把每個字元放進共用的字元圖集；點陣字型用美術畫好的字型圖">
<text x="90" y="22" text-anchor="middle" class="fg-t lg warm">NONE（預設）</text>
<text x="255" y="22" text-anchor="middle" class="fg-t lg alt">BITMAP</text>
<text x="425" y="22" text-anchor="middle" class="fg-t lg acc">CHAR</text>
<text x="595" y="22" text-anchor="middle" class="fg-t lg">點陣字型</text>
<rect x="30" y="40" width="120" height="30" rx="4" class="fg-b warm"/><text x="90" y="60" text-anchor="middle" class="fg-t sm">分數：120</text>
<rect x="30" y="80" width="120" height="30" rx="4" class="fg-b warm"/><text x="90" y="100" text-anchor="middle" class="fg-t sm">第 7 關</text>
<rect x="30" y="120" width="120" height="30" rx="4" class="fg-b warm"/><text x="90" y="140" text-anchor="middle" class="fg-t sm">剩下 3 張</text>
<text x="90" y="180" text-anchor="middle" class="fg-t sm">3 張各自的貼圖</text>
<rect x="195" y="40" width="120" height="120" rx="4" class="fg-b alt"/>
<rect x="203" y="48" width="50" height="40" rx="3" class="fg-b"/><text x="228" y="72" text-anchor="middle" class="fg-t sm">碎圖</text>
<rect x="259" y="48" width="48" height="40" rx="3" class="fg-b"/><text x="283" y="72" text-anchor="middle" class="fg-t sm">碎圖</text>
<rect x="203" y="96" width="104" height="28" rx="3" class="fg-b warm"/><text x="255" y="115" text-anchor="middle" class="fg-t sm">分數：120</text>
<text x="255" y="148" text-anchor="middle" class="fg-t sm">動態圖集</text>
<rect x="365" y="40" width="120" height="120" rx="4" class="fg-b hot"/>
<text x="425" y="68" text-anchor="middle" class="fg-t mono">0 1 2 3 4</text>
<text x="425" y="92" text-anchor="middle" class="fg-t mono">5 6 7 8 9</text>
<text x="425" y="116" text-anchor="middle" class="fg-t">分 數 關 第</text>
<text x="425" y="148" text-anchor="middle" class="fg-t sm">1024 × 1024 共用</text>
<rect x="535" y="40" width="120" height="120" rx="4" class="fg-b"/>
<text x="595" y="72" text-anchor="middle" class="fg-t lg mono">0 1 2 3</text>
<text x="595" y="100" text-anchor="middle" class="fg-t lg mono">4 5 6 7</text>
<text x="595" y="128" text-anchor="middle" class="fg-t lg mono">8 9 + ×</text>
<text x="595" y="180" text-anchor="middle" class="fg-t sm">美術先畫好的字</text>
<text x="255" y="180" text-anchor="middle" class="fg-t sm">畫一次，塞進圖集</text>
<text x="425" y="180" text-anchor="middle" class="fg-t sm">一個字只畫一次</text>
<text x="90" y="206" text-anchor="middle" class="fg-t sm warm">每個 Label 一批</text>
<text x="90" y="224" text-anchor="middle" class="fg-t sm">改字就重畫、重傳</text>
<text x="255" y="206" text-anchor="middle" class="fg-t sm alt">可跟碎圖合批</text>
<text x="255" y="224" text-anchor="middle" class="fg-t sm">原生平台預設沒開</text>
<text x="425" y="206" text-anchor="middle" class="fg-t sm acc">所有 CHAR 一起一批</text>
<text x="425" y="224" text-anchor="middle" class="fg-t sm">常變的數字最划算</text>
<text x="595" y="206" text-anchor="middle" class="fg-t sm">跟同圖的 Sprite 合批</text>
<text x="595" y="224" text-anchor="middle" class="fg-t sm">字只有那幾個</text>
<line x1="20" y1="244" x2="660" y2="244" class="fg-l dim"/>
<text x="340" y="266" text-anchor="middle" class="fg-t sm">由左到右，大致上越省 draw call，能顯示的字也越受限</text>
</svg><figcaption>同樣是「顯示一串字」，四種做法差在字被畫進哪一張貼圖：各自一張、一張動態圖集、一張共用的字元圖集，或美術事先畫好的一張字型圖。</figcaption></figure>
<table>
<tr><th>做法</th><th>怎麼畫、適合什麼</th><th>要小心</th></tr>
<tr><td>系統字型或 TTF，快取模式 NONE（預設）</td><td>用 Canvas 2D（網頁）或系統的文字 API，把整串字畫成一張圖，上傳成這個 Label 自己的貼圖。適合字不常變、數量不多的標題和說明。</td><td>每個 Label 一張貼圖、自己一批；記憶體約「寬 × 高 × 4 位元組」；每改一次字就重畫、重新上傳</td></tr>
<tr><td>快取模式 BITMAP</td><td>畫好之後放進動態圖集（dynamic atlas）。適合不常變的文字，想跟沒有打包的散圖（碎圖）合批。</td><td>動態圖集在網頁上預設開啟，原生和小遊戲平台預設關閉；關閉時效果跟 NONE 差不多</td></tr>
<tr><td>快取模式 CHAR</td><td>把字拆成一個一個字元，放進一張共用的 1024 × 1024 字元圖集（約 4 MB），用到才畫，畫過就重用。適合常常變的數字：分數、倒數計時、金額。</td><td>中文字元種類多，圖集會滿，滿了就不再快取；3.8 的 CHAR 模式還不支援 Overflow 的 Shrink</td></tr>
<tr><td>點陣字型（BMFont）</td><td>美術事先把每個字畫在一張圖上，執行時只是貼圖。適合手繪風格的分數、傷害數字。</td><td>只有畫過的那些字；尺寸固定，放太大會糊</td></tr>
</table>
<h4>一個常見的效能坑：每個影格都改字</h4>
<p>倒數計時寫成 <code>this.label.string = this.timeLeft.toFixed(2)</code> 放在 <code>update</code> 裡，在 NONE 模式下就是每秒 60 次「重畫整串字、重新上傳一張貼圖」。三個改善方向可以一起用：只在顯示的內容真的變了才設定（例如秒數的整數變了才改，從每秒 60 次變成 1 次）；改用 CHAR 模式或點陣字型；如果一定要每格變，至少讓那個 Label 小一點。</p>
<p>中文還有一個獨有的問題：完整的中文 TTF 字型檔動輒好幾 MB 以上。遊戲只用到幾百個字時，可以用字型工具做子集化（subset），只留下用到的字。</p>

<h3><span class="badge lv3">專業</span>五、Layout 的成本，以及什麼時候不要用</h3>
<p>Layout 方便，但它不是免費的。照原始碼，它是這樣運作的：</p>
<ol>
<li>在每個子節點身上掛監聽：尺寸變了、錨點變了、啟用狀態變了，或子節點被加入、移除、換順序，就把自己標成「需要重排」。</li>
<li>重排不是當場做，而是在每個影格的 <code>AFTER_UPDATE</code>（所有 <code>update</code>、<code>lateUpdate</code> 跑完之後、畫之前）統一做。需要立刻拿到位置，就呼叫 <code>updateLayout()</code>。</li>
<li>重排一次，就是把所有啟用中的子節點從頭到尾排一遍，成本跟子節點數量成正比。</li>
</ol>
<p>還有一個容易誤會的細節：<b>只改子節點的位置，不會觸發重排</b>（只有在勾了 Affected By Scale、同時改了縮放和位置時才會）。所以你用 tween 移動 Layout 底下的某個子節點，一開始看起來沒事；等到之後某個時刻（加了一個子節點、某個尺寸變了）觸發重排，它就被「啪」一聲拉回原位。這種 bug 很難重現，因為觸發的時機跟你的動畫無關。</p>
<h4>什麼時候不要用 Layout</h4>
<ul>
<li><b>會動的子節點</b>：要飛來飛去的牌、會彈跳的圖示，不要放在 Layout 底下。放在一個沒有 Layout 的容器裡，位置自己算。</li>
<li><b>很長的列表</b>：幾百列交給 Layout，每次有一列變動就整排重算，而且所有列都是真的節點。改用下一節的虛擬列表。</li>
<li><b>排一次就不會再變的畫面</b>：在編輯器裡用 Layout 排好之後，可以把 Layout 元件拿掉，排好的位置會留在場景裡，執行時一點成本都沒有。</li>
<li><b>巢狀很多層、都設成 Resize Mode Container</b>：內層長大會讓外層重排，外層重排又可能影響別的，互相連動。需要馬上拿到正確位置時，從最內層往外，依序呼叫 <code>updateLayout()</code>。</li>
</ul>

<h3><span class="badge lv3">專業</span>六、ScrollView 與列表虛擬化：用十個節點畫一千筆</h3>
<p>先算一筆帳。排行榜 1000 筆，每列 4 個節點（底圖、頭像、名字、分數），就是 4000 個節點。Mask 只是讓 GPU 不畫視窗外的像素，引擎<b>不會</b>因為一列在視窗外就略過它：每個影格照樣走訪、照樣填頂點。如果名字和分數是 NONE 模式的 Label，每個 300 × 40 就是 48,000 位元組，2000 個 Label 光文字貼圖就將近 100 MB。這在便宜的手機上，就是卡頓甚至閃退。</p>
<p>解法是<b>虛擬化</b>（virtualization），也叫回收節點：只建立「視窗裝得下的列數，再多兩列」那麼多節點。捲動時，從上面離開視窗的那一列，直接搬到最下面，換上下一筆的資料。Vue 的虛擬捲動（virtual scroller）是同一個想法，只是它回收的是 DOM 元素。</p>
<figure class="figure"><svg viewBox="0 0 680 330" class="fg" style="width:100%;max-width:680px" role="img" aria-label="虛擬列表：左邊是 1000 筆資料撐出的長長 content，中間放大看視窗附近，只有 9 個列節點對應第 37 到 45 筆；最上面離開視窗的列會搬到最下面換上第 46 筆">
<text x="60" y="20" text-anchor="middle" class="fg-t sm">content 全長</text>
<rect x="40" y="30" width="40" height="280" rx="4" class="fg-b"/>
<rect x="34" y="128" width="52" height="16" rx="3" class="fg-b hot"/>
<text x="60" y="326" text-anchor="middle" class="fg-t sm mono">1000 × 100</text>
<line x1="86" y1="128" x2="240" y2="62" class="fg-l dim dash"/><line x1="86" y1="144" x2="240" y2="302" class="fg-l dim dash"/>
<rect x="250" y="62" width="180" height="24" rx="4" class="fg-b"/><text x="340" y="79" text-anchor="middle" class="fg-t sm">第 37 筆（緩衝）</text>
<rect x="250" y="90" width="180" height="24" rx="4" class="fg-b alt"/><text x="340" y="107" text-anchor="middle" class="fg-t sm">第 38 筆</text>
<rect x="250" y="118" width="180" height="24" rx="4" class="fg-b alt"/><text x="340" y="135" text-anchor="middle" class="fg-t sm">第 39 筆</text>
<rect x="250" y="146" width="180" height="24" rx="4" class="fg-b alt"/><text x="340" y="163" text-anchor="middle" class="fg-t sm">第 40 筆</text>
<rect x="250" y="174" width="180" height="24" rx="4" class="fg-b alt"/><text x="340" y="191" text-anchor="middle" class="fg-t sm">第 41 筆</text>
<rect x="250" y="202" width="180" height="24" rx="4" class="fg-b alt"/><text x="340" y="219" text-anchor="middle" class="fg-t sm">第 42 筆</text>
<rect x="250" y="230" width="180" height="24" rx="4" class="fg-b alt"/><text x="340" y="247" text-anchor="middle" class="fg-t sm">第 43 筆</text>
<rect x="250" y="258" width="180" height="24" rx="4" class="fg-b"/><text x="340" y="275" text-anchor="middle" class="fg-t sm">第 44 筆（緩衝）</text>
<rect x="250" y="286" width="180" height="24" rx="4" class="fg-b"/><text x="340" y="303" text-anchor="middle" class="fg-t sm">第 45 筆（緩衝）</text>
<rect x="240" y="86" width="200" height="172" rx="6" class="fg-l on"/>
<text x="232" y="176" text-anchor="end" class="fg-t sm acc">視窗</text>
<path d="M430 74 H480 V316 H440" class="fg-l warm"/><polygon points="432,316 440,311.5 440,320.5" class="fg-a warm"/>
<text x="494" y="150" class="fg-t warm">手指往上滑時</text>
<text x="494" y="172" class="fg-t sm">最上面那一列離開視窗，</text>
<text x="494" y="190" class="fg-t sm">搬到最下面，</text>
<text x="494" y="208" class="fg-t sm">換上第 46 筆的資料</text>
<text x="494" y="250" class="fg-t acc">節點永遠只有 9 個</text>
<text x="494" y="270" class="fg-t sm">資料再多也一樣</text>
</svg><figcaption>content 照資料的總筆數撐出完整高度，捲軸才會正確；但真正的列節點只有視窗附近那幾個，捲動時不斷搬家、換資料。</figcaption></figure>
<pre><code>@ccclass('VirtualList')
export class VirtualList extends Component {
    @property(ScrollView) scroll: ScrollView = null!;
    @property(Prefab) rowPrefab: Prefab = null!;
    @property rowHeight = 100;

    private rows: Node[] = [];
    private data: string[] = [];
    private first = -1;

    onEnable() {
        this.scroll.node.on(ScrollView.EventType.SCROLLING,
            this.refresh, this);
    }
    onDisable() {
        this.scroll.node.off(ScrollView.EventType.SCROLLING,
            this.refresh, this);
    }

    setData(data: string[]) {
        this.data = data;
        const content = this.scroll.content!;
        // no Layout on content: we set its height ourselves
        content.getComponent(UITransform)!.height =
            data.length * this.rowHeight;
        const viewH = this.scroll.view!.height;
        const need = Math.ceil(viewH / this.rowHeight) + 2;
        while (this.rows.length &lt; need) {
            const row = instantiate(this.rowPrefab);
            content.addChild(row);
            this.rows.push(row);
        }
        this.first = -1;
        this.refresh();
    }

    private refresh() {
        const y = this.scroll.getScrollOffset().y;
        const top = Math.floor(y / this.rowHeight) - 1;
        const first = Math.max(0, top);
        // same first row as last time: nothing to do
        if (first === this.first) return;
        this.first = first;
        const h = this.rowHeight;
        this.rows.forEach((row, i) =&gt; {
            const index = first + i;
            row.active = index &lt; this.data.length;
            if (!row.active) return;
            // content's anchor is on its top edge: (0.5, 1)
            row.setPosition(0, -(index + 0.5) * h);
            const view = row.getComponent(RowView)!;
            view.show(this.data[index]);
        });
    }
}</code></pre>
<p>這段程式有幾個刻意的設計：</p>
<ul>
<li><b>content 不掛 Layout</b>，高度由程式直接設成「筆數 × 列高」，捲軸的長度和可捲的距離才會正確；列的位置也由程式自己算，不會被 Layout 搶走。</li>
<li><b>只有第一列的編號變了才重排</b>。ScrollView 在慣性滑動時每個影格都會送 SCROLLING，大部分時候第一列的編號沒變，直接 return，成本幾乎是零。</li>
<li><b>畫面狀態一律從資料來</b>。節點會被重複使用，所以「這一列被選中」「這一列展開了」不能存在節點身上，要存在資料陣列裡，<code>show()</code> 每次都依資料重設全部外觀。不然你選了第 3 筆，往下捲，會看到第 12 筆也亮著，因為它們是同一個節點。這跟 Vue 的列表沒寫好 <code>key</code> 時出的問題是同一類。</li>
<li><b>列高不固定時</b>，先算出每一列的起點（前綴和，prefix sum），捲動時用二分搜尋找出第一列。這是聊天室、動態牆這類列表的標準做法。</li>
</ul>
<p>需要更頻繁地建立和銷毀節點（例如子彈、飄字）時，可以用引擎的 <code>NodePool</code>：用完 <code>put()</code> 放回池子，要用時 <code>get()</code> 拿出來，省掉反覆 <code>instantiate</code> 和銷毀的成本。放回池子之前，記得把它身上還在跑的 tween 停掉，下一課會再講。</p>

<h3><span class="badge lv4">專家</span>七、做給各種手機形狀的 UI</h3>
<p>手機的長寬比從 4:3（平板）到 16:9、19.5:9、20:9 都有。引擎用「設計解析度」加上「適配策略」來處理。在專案設定裡，Fit Width 和 Fit Height 兩個勾選，對應四種策略：只勾 Fit Width 是 FIXED_WIDTH（寬度一定完整，高度多出來或被切掉）；只勾 Fit Height 是 FIXED_HEIGHT；兩個都勾是 SHOW_ALL（全部看得到，但會有黑邊）；都不勾是 NO_BORDER（填滿螢幕，但會切掉邊）。</p>
<p>用直式、設計解析度 720 × 1280 的遊戲，算三種裝置：</p>
<figure class="figure"><svg viewBox="0 0 680 340" class="fg" style="width:100%;max-width:680px" role="img" aria-label="設計解析度 720 乘 1280 在不同裝置上：16:9 手機剛好；19.5:9 手機用 Fit Width 上下各多 139；4:3 平板用 Fit Width 上下各被切掉 160；改用 Fit Height 左右各多 120">
<text x="90" y="20" text-anchor="middle" class="fg-t">16:9 手機</text><text x="90" y="38" text-anchor="middle" class="fg-t sm">Fit Width</text>
<text x="255" y="20" text-anchor="middle" class="fg-t">19.5:9 手機</text><text x="255" y="38" text-anchor="middle" class="fg-t sm">Fit Width</text>
<text x="425" y="20" text-anchor="middle" class="fg-t warm">4:3 平板</text><text x="425" y="38" text-anchor="middle" class="fg-t sm warm">Fit Width</text>
<text x="595" y="20" text-anchor="middle" class="fg-t acc">4:3 平板</text><text x="595" y="38" text-anchor="middle" class="fg-t sm acc">Fit Height</text>
<rect x="36" y="74" width="108" height="192" rx="8" class="fg-b hot"/>
<rect x="201" y="53" width="108" height="234" rx="8" class="fg-b"/><rect x="201" y="74" width="108" height="192" class="fg-b hot"/>
<rect x="371" y="98" width="108" height="144" rx="8" class="fg-b hot"/><rect x="371" y="74" width="108" height="192" class="fg-l warm dash"/>
<rect x="523" y="74" width="144" height="192" rx="8" class="fg-b"/><rect x="541" y="74" width="108" height="192" class="fg-b hot"/>
<text x="90" y="174" text-anchor="middle" class="fg-t sm">720 × 1280</text>
<text x="255" y="174" text-anchor="middle" class="fg-t sm">720 × 1280</text>
<text x="425" y="174" text-anchor="middle" class="fg-t sm">720 × 960</text>
<text x="595" y="174" text-anchor="middle" class="fg-t sm">720 × 1280</text>
<text x="90" y="306" text-anchor="middle" class="fg-t sm">剛好</text>
<text x="255" y="306" text-anchor="middle" class="fg-t sm">上下各多 139</text>
<text x="425" y="306" text-anchor="middle" class="fg-t sm warm">上下各切掉 160</text>
<text x="595" y="306" text-anchor="middle" class="fg-t sm acc">左右各多 120</text>
<text x="255" y="324" text-anchor="middle" class="fg-t sm">看得到 720 × 1558</text>
<text x="425" y="324" text-anchor="middle" class="fg-t sm">按鈕可能被切掉</text>
<text x="595" y="324" text-anchor="middle" class="fg-t sm">看得到 960 × 1280</text>
</svg><figcaption>綠色是設計解析度的範圍，外框是那台裝置實際看得到的範圍。直式遊戲在比較「胖」的平板上還用 Fit Width，上下會被切掉；改用 Fit Height 就變成左右多出空間。</figcaption></figure>
<ul>
<li><b>16:9 手機</b>（1080 × 1920）：縮放 1080 ÷ 720 = 1.5，看得到 720 × 1280，剛好。</li>
<li><b>19.5:9 手機</b>（1170 × 2532）：縮放 1.625，看得到 720 × 1558，上下各多出 139。</li>
<li><b>4:3 平板</b>（1536 × 2048）：用 Fit Width，縮放 2.13，只看得到 720 × 960，上下各被切掉 160，貼在上下邊的按鈕可能整個不見。改用 Fit Height，縮放 2048 ÷ 1280 = 1.6，看得到 960 × 1280，變成左右各多出 120。</li>
</ul>
<p>結論是：直式遊戲在「比設計還瘦長」的裝置上用 Fit Width，在「比設計還胖」的裝置上用 Fit Height，這樣設計範圍永遠完整看得到，多出來的只是邊緣。可以在啟動時依螢幕比例切換：</p>
<pre><code>import { view, screen, ResolutionPolicy } from 'cc';

function applyFit() {
    // window size in device pixels
    const s = screen.windowSize;
    const tall = s.height / s.width &gt; 1280 / 720;
    view.setDesignResolutionSize(720, 1280, tall
        ? ResolutionPolicy.FIXED_WIDTH
        : ResolutionPolicy.FIXED_HEIGHT);
}
applyFit();
screen.on('window-resize', applyFit);</code></pre>
<p>剩下的工作，是讓 UI 貼著「看得到的範圍」而不是設計範圍：</p>
<ul>
<li><b>Widget 貼邊</b>：暫停鍵、資源列這些貼邊的東西，一律用 Widget 對齊父節點的邊。Widget 的 Align Mode 預設是 ON_WINDOW_RESIZE（視窗大小改變時才重算），夠用了；ALWAYS 會在每個影格的 AFTER_UPDATE 重算，只有父節點尺寸會一直變時才需要。</li>
<li><b>背景要畫大一點</b>：背景圖不要剛好 720 × 1280，要涵蓋最瘦長和最胖的情況（例如至少 960 × 1600），或用 Widget 撐滿再配合九宮格、Tiled。不然多出來的那一圈就是黑的。</li>
<li><b>瀏海和圓角</b>：SafeArea 元件透過 <code>sys.getSafeAreaRect()</code> 取得安全範圍，再用 Widget 把節點縮進去。按鈕和重要文字放在 SafeArea 底下。</li>
<li><b>觸控目標的實際大小</b>：Apple 建議至少 44 × 44 點，Material Design 建議 48 × 48 dp。換算成設計單位：設計寬 720、在 390 點寬的手機上，1 點約 1.85 個單位，44 點約是 81 個單位。上一章的輸入門檻，也要用同樣的方法換算。</li>
</ul>

<h3><span class="badge lv4">專家</span>八、GPU 那一側：貼圖記憶體、填充率與過度繪製</h3>
<p>draw call 是 CPU 送指令的成本。GPU 自己也有兩個常被忽略的成本。</p>
<h4>貼圖記憶體：看的是寬 × 高，不是檔案大小</h4>
<p>PNG 是壓縮過的檔案，但載進 GPU 時會解開成每個像素 4 個位元組（RGBA8）。一張 1024 × 1024 的圖集佔 4 MB，2048 × 2048 是 16 MB，不管 PNG 檔是 200 KB 還是 2 MB。開了 mipmap 再多三分之一。手機上可以改用 GPU 直接讀的壓縮格式：ASTC 4×4 每個像素 1 個位元組，ETC2 的 RGBA 也是 1 個位元組，同一張 2048 × 2048 只要 4 MB。Cocos 在貼圖的壓縮設定裡可以依平台選格式。</p>
<h4>填充率與過度繪製</h4>
<p>GPU 每畫一個像素都要算一次顏色。19.5:9 的手機一個畫面大約 300 萬個像素（1170 × 2532）。如果畫面上疊了一張全螢幕的背景、一層全螢幕的半透明遮罩、一個全螢幕的彈窗底，同一個像素就被畫了三次，這叫過度繪製（overdraw）。便宜的手機常常不是 CPU 先撐不住，而是這裡先撐不住。幾個實用的原則：</p>
<ul>
<li><b>透明的像素也要畫。</b>一張大部分是透明的大圖，透明的地方 GPU 一樣要算。Cocos 匯入圖片時預設會自動裁掉四周的透明邊（Trim Type 是 Auto），不要關掉它。</li>
<li><b>被完全蓋住的東西就停用。</b>開了一個全螢幕、不透明的面板，後面的遊戲畫面還是會照畫。把後面的根節點設成停用，或至少把它的透明度設成 0（引擎會整棵略過）。</li>
<li><b>半透明遮罩不要一層疊一層。</b>彈窗上再開彈窗時，共用同一層遮罩，而不是每個彈窗各帶一層。</li>
</ul>
<h4>兩個 CPU 側的細節</h4>
<ul>
<li><b>淡出一個大面板，會讓整棵子樹每格重算顏色。</b>UIOpacity 的透明度會乘到所有子孫的頂點顏色上。對一個有 300 個子孫的面板做淡出 tween，每個影格這 300 個元件都要更新顏色。面板很大時，可以先截一張圖（或只淡出一層遮罩）再做動畫。</li>
<li><b>一直在動的節點才重算頂點。</b>第一節提過，頂點的世界座標只在節點變動時重算。一個列表捲動時，只有 content 在動，但它底下所有列的世界座標都跟著變，全部要重算。這是虛擬化之所以重要的另一個原因：列越少，每格要重算的頂點越少。</li>
</ul>

<h3>九、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>節點越多，draw call 就越多</td><td>draw call 看的是順序上被打斷幾次。100 個同圖集的圖示連在一起是 1 次；3 個「圖、字、圖」交錯就是 3 次。</td></tr>
<tr><td>改顏色或透明度會打斷合批</td><td>顏色是頂點資料的一部分，不影響合批。換材質（例如灰階、自訂材質）才會。</td></tr>
<tr><td>打包成圖集，就一定只要一次 draw call</td><td>中間夾一個系統字型 Label、一個 Mask、一個 Spine，就會被切開。順序跟圖集一樣重要。</td></tr>
<tr><td>Mask 外面看不到的東西不花成本</td><td>引擎照樣走訪、照樣填頂點，只是 GPU 不畫那些像素。長列表要靠虛擬化，不是靠 Mask。</td></tr>
<tr><td>PNG 檔很小，記憶體就很小</td><td>在 GPU 上是寬 × 高 × 4 位元組。2048 × 2048 就是 16 MB。</td></tr>
<tr><td>Layout 加了子節點就會馬上排好</td><td>要到這個影格的 AFTER_UPDATE 才排；只改子節點的位置甚至不會觸發重排。</td></tr>
</table>

<h3>十、跟你的工作連起來</h3>
<ul>
<li><b>Vue 前端</b>：瀏覽器也有一樣的問題，只是換了名字。DOM 節點太多會讓樣式計算和排版變慢，所以長列表要用虛擬捲動；頻繁觸發重新排版（layout）的寫法，就像每格都觸發 Cocos 的 Layout 重排。你在 Vue 裡的虛擬列表經驗，可以直接搬過來。</li>
<li><b>Cocos 遊戲</b>：每做完一個畫面，看一次建置版本的 Draw Call 數字，並且在最便宜的測試機上跑一次。圖集照畫面分（大廳一張、遊戲一張、共用元件一張），不要把整個遊戲塞進一張巨大的圖集。</li>
<li><b>Unity</b>：Unity 的 UGUI 一樣依材質和貼圖合批，一樣會被交錯的文字和遮罩切斷，也一樣建議把常變動的 UI 和靜止的 UI 分開。觀念完全通用。</li>
<li><b>後端（Node.js、Go）</b>：虛擬列表在前端只畫看得到的那幾列，後端就該只給那幾頁。排行榜的 API 要支援分頁或游標（cursor），不要一次回傳一萬筆。前後端一起做，才是完整的解法。</li>
</ul>

<h3>十一、面試會怎麼問</h3>
<p>下面是遊戲前端、客戶端工程師面試常見的題目。先自己講一遍，再打開參考答案。</p>
<ol>
<li>「什麼是 draw call？什麼是合批？在 Cocos 裡什麼會打斷合批？」</li>
<li>「一個 1000 筆資料的排行榜在低階手機上很卡，你會怎麼查、怎麼改？」</li>
<li>「九宮格的原理是什麼？什麼情況下九宮格的接縫會出現細線？」</li>
<li>「Label 的 NONE、BITMAP、CHAR 三種快取模式差在哪？分數和倒數計時該用哪一種？」</li>
<li>「同一套直式 UI，要怎麼同時適配 4:3 的平板和 20:9 的手機？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>draw call 是 CPU 要求 GPU 畫一批三角形的一次指令，每次都有固定成本，手機上特別明顯。合批是把繪製順序上相鄰、使用相同貼圖、材質和渲染狀態的元件的頂點接在一起，用一次 draw call 畫完；能成立是因為 2D 元件的頂點在 CPU 就換成了世界座標。打斷合批的原因有：貼圖不同（沒進同一張圖集、系統字型 Label 各有貼圖）、材質不同（自訂材質、灰階、材質實例）、Mask 的模板狀態、Spine 或 Graphics 這類自己送批次的元件、layer 不同。顏色、透明度、位置的變化不會打斷。</li>
<li>先量：用建置版本看 Draw Call、用效能面板看每格的 CPU 時間、看記憶體。通常的原因是 1000 列全是真的節點、每列的系統字型 Label 各有貼圖、圖和字交錯打斷合批。改法：做虛擬列表，只建立視窗內外加緩衝的幾列，捲動時回收並換資料；content 不掛 Layout，高度和位置由程式計算；文字改 CHAR 或點陣字型，並把文字和圖分層，讓它們各自連成一批；後端 API 改成分頁。</li>
<li>把圖用四條邊界切成九塊，四個角維持原像素，上下邊只橫向拉、左右邊只直向拉、中間兩個方向都拉，所以一張小圖能做出任意尺寸的面板而不變形。節點比兩個角加起來還窄時，角會被等比例縮小。細線通常來自線性過濾在邊界取樣到相鄰像素，尤其是圖集裡別張圖的像素；解法是圖集留間距並開擴邊，邊界避開漸層，必要時確認貼圖的過濾和縮放設定。</li>
<li>NONE 是每個 Label 把整串字畫成自己的貼圖，改字就重畫重傳，每個 Label 一批。BITMAP 是畫好後放進動態圖集，能跟沒打包的散圖合批，但動態圖集在原生和小遊戲平台預設關閉。CHAR 是把字元快取在一張共用的 1024 × 1024 字元圖集，字元畫過就重用，所有 CHAR 的 Label 能合成一批。分數和倒數計時這種常變的數字用 CHAR 或點陣字型；同時只在數值真的變了時才更新字串。</li>
<li>先決定設計解析度，再依螢幕比例選策略：比設計瘦長的裝置用 Fit Width，比設計胖的用 Fit Height，確保設計範圍完整可見，多出的部分只在邊緣。貼邊元件用 Widget 對齊看得到的範圍，重要元件放在 SafeArea 裡避開瀏海，背景畫得比設計範圍大，並用實際尺寸檢查觸控目標（約 44 點以上）。最後在幾種極端比例的裝置或模擬器上逐一檢查。</li>
</ol>
</details>

<h3>十二、練功題（做得出來才算真的懂）</h3>
<ol>
<li>一張九宮格圖，左右邊界都是 24。節點錨點在左邊（ax = 0）。請算出寬度 100 和寬度 40 時，四個頂點的 x。</li>
<li>一個畫面的繪製順序是：背景（圖集 B）、按鈕底（圖集 A）、按鈕字（系統字型，NONE）、按鈕底（圖集 A）、按鈕字（NONE）、一個 Mask 裡面放一個頭像（圖集 A）、分數（點陣字型）。大約會有幾個批次？你會怎麼改？</li>
<li>遊戲用了兩張 2048 × 2048 的 RGBA8 圖集，外加 200 個 NONE 模式、大小 200 × 50 的 Label。估算貼圖記憶體。如果圖集改成 ASTC 4×4 呢？</li>
<li>虛擬列表：5000 筆資料、列高 120、視窗高 900。要建立幾個列節點？捲到 <code>getScrollOffset().y = 3000</code> 時，畫面上的列是第幾筆到第幾筆？content 的高度是多少？</li>
<li>設計解析度 720 × 1280。兩台裝置：1080 × 2340 的手機、1620 × 2160 的平板。照第七節的規則，各用哪個策略？各看得到多大的範圍？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>寬 100：xScale = min(1, 100 ÷ 48) = 1，x 是 0、24、76、100。寬 40：xScale = 40 ÷ 48 ≈ 0.833，x 是 0、20、20、40，兩個角各被壓成 20 寬，中間沒有了。</li>
<li>背景（B）一批；按鈕底（A）一批；按鈕字一批；按鈕底（A）一批；按鈕字一批；Mask 會切斷前後，再加上清除和寫入形狀，頭像自己一批；點陣字型一批。大約 7 批，加上 Mask 額外的兩次，接近 9 次 draw call。改法：背景如果能放進圖集 A 就併進去；兩個按鈕的底連在一起、兩個字移到後面並改 CHAR；頭像如果只是要圓形，改成美術直接出圓形的圖，拿掉 Mask。可以壓到 3 到 4 次。</li>
<li>圖集：2 × 16 MB = 32 MB。Label：200 × 50 × 4 = 40,000 位元組，200 個約 8 MB。合計約 40 MB。圖集改 ASTC 4×4 後每張 4 MB，合計約 8 + 8 = 16 MB。</li>
<li>節點數 = ceil(900 ÷ 120) + 2 = 8 + 2 = 10。y = 3000 時，top = floor(3000 ÷ 120) − 1 = 25 − 1 = 24，畫面上（含緩衝）是第 24 到第 33 筆（從 0 開始數）。content 高 5000 × 120 = 600,000。</li>
<li>手機：2340 ÷ 1080 ≈ 2.17，大於 1280 ÷ 720 ≈ 1.78，比設計瘦長，用 Fit Width；縮放 1.5，看得到 720 × 1560。平板：2160 ÷ 1620 ≈ 1.33，比設計胖，用 Fit Height；縮放 2160 ÷ 1280 = 1.6875，看得到 960 × 1280。</li>
</ol>
</details>

<h3>十三、想再挖深</h3>
<ul>
<li><b>Cocos Creator 3.8 使用手冊</b>（<a href="https://docs.cocos.com/creator/3.8/manual/en/">docs.cocos.com/creator/3.8/manual</a>）：UI 系統、多解析度適配、Auto Atlas、Label 與字型、2D 渲染合批的官方說明。</li>
<li><b>Cocos 引擎原始碼</b>（<a href="https://github.com/cocos/cocos-engine">github.com/cocos/cocos-engine</a>）：<code>cocos/2d/renderer/batcher-2d.ts</code>（走訪與合批條件）、<code>cocos/2d/assembler/sprite/sliced.ts</code>（九宮格的頂點）、<code>cocos/2d/components/label.ts</code>（快取模式）。本章的數字都能在這幾個檔案裡找到。</li>
<li><b>Spector.js</b>（<a href="https://spector.babylonjs.com/">spector.babylonjs.com</a>）：WebGL 的除錯工具，能抓下一個影格裡的每一次 draw call、看用了哪張貼圖。拿來驗證你的合批推理最直接。</li>
<li><b>Akenine-Möller 等人《Real-Time Rendering》</b>：即時繪圖的經典教科書，GPU 管線、貼圖過濾、填充率、壓縮格式都在裡面。想從「會用引擎」走到「懂 GPU」，這是下一本。</li>
</ul>
` });
