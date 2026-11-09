DEEP({ 'cc-build': `
<p>上一課你按下 Build，得到一個 <code>build/web-mobile</code> 資料夾，再把它放上 CDN。這一章把那顆按鈕拆開來看：建置管線（build pipeline）每一步在做什麼、資料夾裡每個檔案是誰要的、手機打開遊戲的前兩三秒到底在等什麼、CDN 和瀏覽器的快取要怎麼設，玩家才不會跑到昨天的版本。最後是怎麼讓一台建置機器每次都做出一樣的東西，出事時一分鐘內退回上一版。「會寫遊戲」跟「能把遊戲穩穩交到幾十萬支手機上」，差的就是這一章。</p>

<h3><span class="badge lv1">基礎</span>一、建置在做什麼：從自家廚房到中央廚房</h3>
<p>預覽像在自己家裡煮飯：食材（<code>.ts</code>、<code>.png</code>、<code>.prefab</code>）放在冰箱，要什麼現拿現切，切得醜也沒關係，反正自己吃。建置（build）像便當的中央廚房：前一天把所有食材洗好、切好、分裝、貼上標籤，再送到各地門市（CDN）。門市只負責加熱出餐，不再處理生食。玩家的手機是門市的客人，他只拿得到裝好的盒子。</p>
<figure class="figure"><svg viewBox="0 0 680 256" class="fg" style="width:100%;max-width:680px" role="img" aria-label="建置管線：腳本編譯、資源序列化、貼圖處理、分配資源包、加上指紋五個步驟，另外引擎依設定裁剪，最後輸出一個只有靜態檔案的 build/web-mobile 資料夾">
<text x="340" y="30" text-anchor="middle" class="fg-t sm">輸入：assets/ 底下的 .ts、.png、.scene、.prefab，加上專案設定</text>
<rect x="17" y="46" width="118" height="78" rx="6" class="fg-b alt"/>
<text x="76" y="72" text-anchor="middle" class="fg-t">腳本編譯</text>
<text x="76" y="94" text-anchor="middle" class="fg-t sm">TS 轉成 JS</text>
<text x="76" y="112" text-anchor="middle" class="fg-t sm">不檢查型別</text>
<line x1="135" y1="85" x2="141" y2="85" class="fg-l"/><polygon points="149,85 141,80.5 141,89.5" class="fg-a"/>
<rect x="149" y="46" width="118" height="78" rx="6" class="fg-b"/>
<text x="208" y="72" text-anchor="middle" class="fg-t">資源序列化</text>
<text x="208" y="94" text-anchor="middle" class="fg-t sm">場景、Prefab</text>
<text x="208" y="112" text-anchor="middle" class="fg-t sm">→ import JSON</text>
<line x1="267" y1="85" x2="273" y2="85" class="fg-l"/><polygon points="281,85 273,80.5 273,89.5" class="fg-a"/>
<rect x="281" y="46" width="118" height="78" rx="6" class="fg-b"/>
<text x="340" y="72" text-anchor="middle" class="fg-t">貼圖處理</text>
<text x="340" y="94" text-anchor="middle" class="fg-t sm">依預設壓縮</text>
<text x="340" y="112" text-anchor="middle" class="fg-t sm">小圖併成圖集</text>
<line x1="399" y1="85" x2="405" y2="85" class="fg-l"/><polygon points="413,85 405,80.5 405,89.5" class="fg-a"/>
<rect x="413" y="46" width="118" height="78" rx="6" class="fg-b"/>
<text x="472" y="72" text-anchor="middle" class="fg-t">分配資源包</text>
<text x="472" y="94" text-anchor="middle" class="fg-t sm">每個資源屬於</text>
<text x="472" y="112" text-anchor="middle" class="fg-t sm">哪一個 bundle</text>
<line x1="531" y1="85" x2="537" y2="85" class="fg-l"/><polygon points="545,85 537,80.5 537,89.5" class="fg-a"/>
<rect x="545" y="46" width="118" height="78" rx="6" class="fg-b hot"/>
<text x="604" y="72" text-anchor="middle" class="fg-t acc">加上指紋</text>
<text x="604" y="94" text-anchor="middle" class="fg-t sm">內容雜湊</text>
<text x="604" y="112" text-anchor="middle" class="fg-t sm">寫進檔名</text>
<rect x="17" y="140" width="382" height="34" rx="6" class="fg-b"/>
<text x="208" y="162" text-anchor="middle" class="fg-t">引擎：依功能裁剪設定，只打包勾選的模組 → cocos-js/</text>
<line x1="208" y1="174" x2="208" y2="188" class="fg-l"/><polygon points="208,196 203.5,188 212.5,188" class="fg-a"/>
<line x1="604" y1="124" x2="604" y2="188" class="fg-l on"/><polygon points="604,196 599.5,188 608.5,188" class="fg-a on"/>
<rect x="17" y="196" width="646" height="50" rx="8" class="fg-b"/>
<text x="340" y="217" text-anchor="middle" class="fg-t lg">輸出：build/web-mobile</text>
<text x="340" y="236" text-anchor="middle" class="fg-t sm">HTML、JS、JSON、圖片、聲音：任何網頁伺服器或 CDN 都放得了</text>
</svg><figcaption>建置是一條單向的生產線。進去的是編輯器看得懂的東西，出來的是瀏覽器看得懂的靜態檔案。沒有伺服器程式，也沒有資料庫。</figcaption></figure>
<p>先記住最後那一格：<b>建置的輸出只有靜態檔案</b>。所以對網頁遊戲來說，「部署」說穿了只有兩件事：把檔案放到對的地方，以及讓每個檔案帶著對的快取標頭（header）。這一章後半段講的，全是這兩件事。</p>
<p>每一站在做什麼，第三節會用一個真實專案追一次。這裡先記大意：</p>
<ul>
<li><b>腳本編譯</b>：把你的 TypeScript 轉成瀏覽器能跑的 JavaScript，同一個資源包的腳本合成一個檔案。</li>
<li><b>資源序列化</b>：場景、Prefab、材質在編輯器裡是 <code>.scene</code>、<code>.prefab</code> 這類檔案，建置時轉成引擎讀得懂的 JSON。</li>
<li><b>貼圖處理</b>：依每張圖選的壓縮預設產生對應格式，Auto Atlas 資料夾裡的小圖拼成大圖。</li>
<li><b>分配資源包</b>：決定每個資源落在哪一個 bundle。</li>
<li><b>加上指紋</b>：勾了 MD5 Cache，就把檔案內容的雜湊寫進檔名。</li>
<li><b>引擎</b>：照 Project Settings 裡的功能裁剪（Feature Cropping），沒勾的模組不打包。</li>
</ul>

<h3><span class="badge lv1">基礎</span>二、一份 web-mobile 建置：誰指向誰</h3>
<p>打開 <code>build/web-mobile</code>，檔案很多，但它們之間的關係其實是一條很單純的鏈：每個檔案只負責告訴瀏覽器「下一個去哪裡拿」。</p>
<figure class="figure"><svg viewBox="0 0 680 346" class="fg" style="width:100%;max-width:680px" role="img" aria-label="左邊是載入順序：index.html、啟動腳本、引擎、settings.json、各 bundle 的 config、首場景的資源；右邊是 build/web-mobile 的資料夾結構">
<text x="166" y="26" text-anchor="middle" class="fg-t acc">載入順序：誰指向誰</text>
<text x="510" y="26" text-anchor="middle" class="fg-t acc">資料夾長這樣</text>
<rect x="16" y="44" width="300" height="36" rx="6" class="fg-b warm"/><text x="28" y="67" class="fg-t">① index.html</text><text x="306" y="67" text-anchor="end" class="fg-t sm">名字固定，每次都問</text>
<line x1="166" y1="80" x2="166" y2="86" class="fg-l"/><polygon points="166,94 161.5,86 170.5,86" class="fg-a"/>
<rect x="16" y="94" width="300" height="36" rx="6" class="fg-b"/><text x="28" y="117" class="fg-t">② 啟動腳本</text><text x="306" y="117" text-anchor="end" class="fg-t sm">模組載入器、application</text>
<line x1="166" y1="130" x2="166" y2="136" class="fg-l"/><polygon points="166,144 161.5,136 170.5,136" class="fg-a"/>
<rect x="16" y="144" width="300" height="36" rx="6" class="fg-b hot"/><text x="28" y="167" class="fg-t">③ cocos-js/ 引擎</text><text x="306" y="167" text-anchor="end" class="fg-t sm">通常是最大的一塊</text>
<line x1="166" y1="180" x2="166" y2="186" class="fg-l"/><polygon points="166,194 161.5,186 170.5,186" class="fg-a"/>
<rect x="16" y="194" width="300" height="36" rx="6" class="fg-b"/><text x="28" y="217" class="fg-t">④ settings.json</text><text x="306" y="217" text-anchor="end" class="fg-t sm">有哪些 bundle、版本</text>
<line x1="166" y1="230" x2="166" y2="236" class="fg-l"/><polygon points="166,244 161.5,236 170.5,236" class="fg-a"/>
<rect x="16" y="244" width="300" height="36" rx="6" class="fg-b"/><text x="28" y="267" class="fg-t">⑤ 各 bundle 的 config</text><text x="306" y="267" text-anchor="end" class="fg-t sm">uuid 對到檔名</text>
<line x1="166" y1="280" x2="166" y2="286" class="fg-l"/><polygon points="166,294 161.5,286 170.5,286" class="fg-a"/>
<rect x="16" y="294" width="300" height="36" rx="6" class="fg-b alt"/><text x="28" y="317" class="fg-t">⑥ 首場景與它要的資源</text><text x="306" y="317" text-anchor="end" class="fg-t sm">import、native</text>
<text x="350" y="56" class="fg-t sm mono">build/web-mobile/</text>
<text x="350" y="78" class="fg-t sm mono">├ index.html</text><text x="530" y="78" class="fg-t sm">入口，名字固定</text>
<text x="350" y="100" class="fg-t sm mono">├ style.css 與啟動腳本</text>
<text x="350" y="122" class="fg-t sm mono">├ cocos-js/</text><text x="530" y="122" class="fg-t sm">引擎</text>
<text x="350" y="144" class="fg-t sm mono">├ src/settings.json</text><text x="530" y="144" class="fg-t sm">bundle 清單與版本</text>
<text x="350" y="166" class="fg-t sm mono">└ assets/</text>
<text x="364" y="188" class="fg-t sm mono">├ internal/</text><text x="530" y="188" class="fg-t sm">引擎內建資源</text>
<text x="364" y="210" class="fg-t sm mono">├ resources/</text><text x="530" y="210" class="fg-t sm">用路徑載入的</text>
<text x="364" y="232" class="fg-t sm mono">└ main/</text><text x="530" y="232" class="fg-t sm">你的場景與腳本</text>
<text x="378" y="254" class="fg-t sm mono">├ config.json</text><text x="530" y="254" class="fg-t sm">uuid → 檔名</text>
<text x="378" y="276" class="fg-t sm mono">├ index.js</text><text x="530" y="276" class="fg-t sm">這包的腳本</text>
<text x="378" y="298" class="fg-t sm mono">├ import/</text><text x="530" y="298" class="fg-t sm">序列化的 JSON</text>
<text x="378" y="320" class="fg-t sm mono">└ native/</text><text x="530" y="320" class="fg-t sm">圖片、聲音原檔</text>
</svg><figcaption>玩家只知道一個網址：index.html。從它開始，每個檔案都指向下一個。整條鏈上，只有第一個檔案的名字永遠不變。實際檔名依版本會有些差異，打開你自己的建置對照看。</figcaption></figure>
<h4>uuid：資源的身分證</h4>
<p>編輯器裡每個資源都有一個 <b>uuid</b>，存在它旁邊的 <code>.meta</code> 檔裡。場景引用一張貼圖時，存的是那張圖的 uuid，不是路徑。所以在編輯器裡把圖片改名、搬資料夾，場景不會斷；但如果你刪掉 <code>.meta</code> 讓編輯器重新產生一個，uuid 就變了，所有引用它的地方一起斷掉。這就是為什麼 <code>.meta</code> 檔一定要跟著資源一起進 git。</p>
<p>建置後，bundle 的 <code>config.json</code> 就是一本「uuid → 檔案」的對照表。引擎要載入某個資源時，先查表找到檔名，再去 <code>import</code>（序列化資料）或 <code>native</code>（原始檔）拿。</p>
<h4>為什麼「用路徑載入」的資源會不見</h4>
<p>建置只打包兩種東西：被場景（直接或間接）引用到的資源，以及放在 bundle 資料夾裡的資源。你在程式裡寫 <code>resources.load('cards/back', ...)</code>，編輯器在建置時看不懂這行字串，它不知道你會用到這張圖。如果那張圖不在 <code>resources</code> 或任何 bundle 裡，也沒有場景引用它，建置就把它丟了。預覽時它還在，因為預覽直接讀專案資料夾。</p>
<div class="note"><b>3.x 的一個小陷阱。</b>在 Cocos Creator 3.x，一張圖片匯入後是一個 ImageAsset，底下再掛著 Texture2D 和 SpriteFrame 這些子資源。用路徑載入 SpriteFrame 時，路徑要指到子資源：<code>resources.load('cards/back/spriteFrame', SpriteFrame, cb)</code>。只寫 <code>'cards/back'</code> 會載入失敗或拿到不是你要的型別。</div>

<h3><span class="badge lv2">進階</span>三、一步一步追一次：猜高低的建置過程</h3>
<p>用一個具體的專案走一遍。假設你的猜高低有 12 個腳本、1 個場景、2 個 Prefab，52 張牌面圖（每張 200 &times; 280 像素的 PNG，大約 20 KB），一張 1280 &times; 720 的背景，三個音效。</p>
<h4>第 1 站：腳本編譯</h4>
<p>12 個 <code>.ts</code> 檔被逐檔轉成 JavaScript：型別標註全部拿掉，裝飾器（<code>@ccclass</code>、<code>@property</code>）轉成一般的函式呼叫，<code>import</code> 轉成引擎的模組格式。屬於 main 這個 bundle 的腳本合成 <code>assets/main/index.js</code>；如果建置面板沒勾 Debug（也就是 release 建置），還會再縮小（minify）：區域變數改成一兩個字母、空白和註解全拿掉。</p>
<p>這一站有一個很多人不知道的事實：<b>它只做轉譯，不做型別檢查</b>。Cocos 用的是逐檔轉譯的做法（類似 Babel 去掉型別），所以一個把 <code>string</code> 傳給 <code>number</code> 參數的錯誤，預覽照跑、建置照過，直到玩家碰到那一行才出事。型別檢查要你自己跑 <code>tsc --noEmit</code>，最好放在管線裡（第七節）。逐檔轉譯還有一個副作用：需要看整個專案才知道怎麼展開的寫法，例如跨檔案的 <code>const enum</code>，不能照你以為的方式運作，乾脆別用。</p>
<h4>第 2 站：資源序列化</h4>
<p>場景和兩個 Prefab 被轉成 JSON，放進 <code>import</code>。一個場景的 JSON 裡記著每個節點、每個元件、每個欄位的值，還有它引用的資源 uuid。小 JSON 檔很多，每一個都要一次 HTTP 請求，所以 bundle 有一個<b>壓縮類型</b>（Compression Type）設定，決定要不要合併：</p>
<table>
<tr><th>壓縮類型</th><th>做什麼</th><th>適合</th></tr>
<tr><td>None</td><td>不合併，一個資源一個檔</td><td>需要精細控制、資源很少時</td></tr>
<tr><td>Merge Dependence（預設）</td><td>把一個資源和它依賴的 JSON 合成一個檔</td><td>大部分情況：請求數少，又不會多載沒用到的</td></tr>
<tr><td>Merge All JSON</td><td>整包的 JSON 合成一個檔</td><td>這包的東西一定會一起用到時；代價是用一個也得下載全部</td></tr>
<tr><td>Zip</td><td>整包壓成 zip</td><td>檔案極多又很小的包；多一道解壓的 CPU 成本</td></tr>
</table>
<p>（另外還有一個給小遊戲平台用的分包選項，網頁遊戲用不到。）</p>
<h4>第 3 站：貼圖處理</h4>
<p>這一站最能看出建置的價值。先算原本的代價：一張牌面 200 &times; 280 = 56,000 像素，解開後每像素 4 位元組，大約 0.22 MB 的顯示記憶體。52 張就是 11.6 MB，是 52 個 20 KB 檔案加起來（約 1 MB）的十倍以上。</p>
<p>把 52 張牌放進一個 Auto Atlas 資料夾，建置會把它們拼成一張 2048 &times; 2048 的圖集（52 張共 2,912,000 像素，大約佔滿圖集的七成）。注意一個反直覺的地方：不壓縮的話，這張圖集解開是 16 MB，反而比分開放的 11.6 MB 還多，因為空白的地方也要算。<b>圖集省的是請求數和 draw call，不是記憶體。</b>省記憶體靠的是壓縮：同一張圖集改用 ASTC 6 &times; 6，大約 1.8 MB，是不壓縮的九分之一。</p>
<p>壓縮預設通常會列好幾種格式，例如「ASTC 6 &times; 6 → ETC2 → PNG」。建置時每種格式都產生一份檔案，所以建置資料夾會變大；但每支手機在執行時只下載它支援的那一種，玩家實際下載的量不會乘三。</p>
<div class="warn"><b>壓縮貼圖不一定讓下載變小。</b>PNG 是為了「檔案小」設計的，壓縮貼圖格式是為了「顯示晶片能直接讀」設計的。一張 PNG 只要 300 KB 的圖，存成 ETC2 有可能是 1 MB 的檔案。CDN 再幫你 gzip 一次會小一些，但你是在用下載量換顯示記憶體。手機上記憶體通常比較寶貴，所以這筆交易多半划算，但請用數字確認，不要用猜的。</div>
<h4>第 4 站：分配資源包</h4>
<p>場景放在 main（沒有標成 bundle 的資料夾，預設都歸 main），場景引用到的兩張牌面圖集、背景、Prefab 也跟著進 main。<code>resources</code> 資料夾整個進 resources 這個 bundle。你自己勾了 Is Bundle 的資料夾，各自成一包。</p>
<p>麻煩的是「兩個包都用到同一個資源」的情況。每個 bundle 有一個<b>優先順序</b>（priority）。同一個資源被不同優先順序的包引用時，資源會放在優先順序高的那包，另一包只記一筆參考；優先順序一樣時，資源會在兩包裡各複製一份。複製多了，總下載量就悄悄變大。所以共用的東西（字型、通用按鈕、音效）最好放在一個優先順序較高的「共用包」裡。</p>
<h4>第 5 站：加上指紋</h4>
<p>勾了 MD5 Cache，所有資源檔、bundle 的設定檔和腳本，名字都會多一段由內容算出來的雜湊。settings 裡會記著每個 bundle 現在的版本，引擎就照著這個版本去拿對應名字的 <code>config</code>。內容一改，名字就變；記著這個名字的上一層清單，內容也跟著變。這樣一層一層往上，最後只剩名字固定的 index.html 負責「指向最新的那一套」。</p>
<h4>第 6 站：引擎裁剪</h4>
<p>引擎是首包裡最大的一塊。猜高低是一個 2D 遊戲，用不到 3D 物理、地形、粒子系統的 3D 部分、骨骼動畫等等。到 Project Settings 的功能裁剪把它們取消勾選，引擎就小一大截。裁剪的代價是：如果某個 Prefab 偷偷用了被裁掉的元件，預覽時正常，建置後那個元件就不存在了。裁剪完一定要把建置跑一遍。</p>
<h4>Debug 和 Release 的差別</h4>
<table>
<tr><th></th><th>勾 Debug</th><th>不勾（release）</th></tr>
<tr><td>程式碼</td><td>不縮小，看得懂</td><td>縮小，變數名被改短</td></tr>
<tr><td>引擎的檢查</td><td>帶著詳細的警告和錯誤訊息</td><td>拿掉大部分檢查；錯誤只印編號</td></tr>
<tr><td><code>DEBUG</code> 常數</td><td>true</td><td>false</td></tr>
<tr><td>大小與速度</td><td>大、慢一點</td><td>玩家拿到的就是這個</td></tr>
</table>
<p>預備環境（staging）要用 release 建置來測。用 Debug 建置測過，再出一份 release 上正式環境，等於上線的是一份沒測過的東西。</p>

<h3><span class="badge lv2">進階</span>四、手機上的第一次載入：第一幀之前在等什麼</h3>
<p>玩家第一次點開連結，到看到第一幀畫面，中間是一串一定得照順序來的步驟。下面是一個示意，數字是中階手機、4G 網路下常見的量級，不是標準：</p>
<figure class="figure"><svg viewBox="0 0 680 300" class="fg" style="width:100%;max-width:680px" role="img" aria-label="首次載入的瀑布圖：index.html、引擎下載、引擎解析、設定與清單、首場景與貼圖、解碼與上傳 GPU 依序進行，約 2.5 秒後出現第一幀">
<text x="150" y="26" text-anchor="middle" class="fg-t sm">0 s</text><text x="250" y="26" text-anchor="middle" class="fg-t sm">0.5</text><text x="350" y="26" text-anchor="middle" class="fg-t sm">1.0</text><text x="450" y="26" text-anchor="middle" class="fg-t sm">1.5</text><text x="550" y="26" text-anchor="middle" class="fg-t sm">2.0</text><text x="650" y="26" text-anchor="middle" class="fg-t sm">2.5 s</text>
<line x1="150" y1="34" x2="150" y2="250" class="fg-l dim dash"/><line x1="250" y1="34" x2="250" y2="250" class="fg-l dim dash"/><line x1="350" y1="34" x2="350" y2="250" class="fg-l dim dash"/><line x1="450" y1="34" x2="450" y2="250" class="fg-l dim dash"/><line x1="550" y1="34" x2="550" y2="250" class="fg-l dim dash"/>
<line x1="650" y1="34" x2="650" y2="226" class="fg-l warm dash"/>
<text x="10" y="54" class="fg-t sm">index.html</text><rect x="150" y="41" width="30" height="18" rx="3" class="fg-b alt"/>
<text x="10" y="84" class="fg-t sm">引擎下載</text><rect x="180" y="71" width="140" height="18" rx="3" class="fg-b alt"/><text x="250" y="84" text-anchor="middle" class="fg-t sm">約 350 KB</text>
<text x="10" y="114" class="fg-t sm">引擎解析與編譯</text><rect x="320" y="101" width="80" height="18" rx="3" class="fg-b warm"/><text x="360" y="114" text-anchor="middle" class="fg-t sm">CPU</text>
<text x="10" y="144" class="fg-t sm">設定與包的清單</text><rect x="400" y="131" width="60" height="18" rx="3" class="fg-b alt"/>
<text x="10" y="174" class="fg-t sm">首場景與貼圖</text><rect x="460" y="161" width="140" height="18" rx="3" class="fg-b alt"/><text x="530" y="174" text-anchor="middle" class="fg-t sm">約 600 KB</text>
<text x="10" y="204" class="fg-t sm">解碼、上傳 GPU</text><rect x="600" y="191" width="50" height="18" rx="3" class="fg-b warm"/>
<text x="10" y="240" class="fg-t sm">玩家看到</text><rect x="150" y="227" width="490" height="18" rx="3" class="fg-b"/><text x="395" y="240" text-anchor="middle" class="fg-t sm">白畫面，或你放在 HTML 裡的載入條</text>
<circle cx="650" cy="236" r="6" class="fg-lamp on"/>
<text x="650" y="264" text-anchor="middle" class="fg-t sm warm">第一幀</text>
<rect x="150" y="278" width="14" height="10" rx="2" class="fg-b alt"/><text x="170" y="287" class="fg-t sm">網路</text>
<rect x="220" y="278" width="14" height="10" rx="2" class="fg-b warm"/><text x="240" y="287" class="fg-t sm">CPU</text>
<text x="670" y="287" text-anchor="end" class="fg-t sm">數字是示意：中階手機、4G</text>
</svg><figcaption>每一段都要等前一段做完才能開始，這叫關鍵路徑（critical path）。想讓第一幀提早，只能把這條線上的某一段變短，或把某一段移到第一幀之後。</figcaption></figure>
<h4>什麼東西擋住第一幀</h4>
<ol>
<li><b>引擎</b>：要先下載完、再被瀏覽器解析和編譯，才能執行任何一行遊戲程式。手機的 CPU 比電腦慢，同一份 JavaScript 在中低階手機上解析和編譯的時間，常常是電腦的好幾倍。</li>
<li><b>首場景的所有依賴</b>：引擎在執行一個場景之前，會先把這個場景引用到的所有資源載完。場景引用了一張 2048 &times; 2048 的背景，這張圖就在關鍵路徑上，即使它在畫面最下面。</li>
<li><b>你自己的 <code>onLoad</code> 和 <code>start</code></b>：在第一幀之前同步執行。在這裡一口氣建立 200 個節點，或解析一個大 JSON，玩家就多看半秒白畫面。</li>
</ol>
<h4>首包預算：先訂數字，再談最佳化</h4>
<table>
<tr><th>項目</th><th>常用的起點（依你的玩家調整）</th><th>怎麼量</th></tr>
<tr><td>第一幀之前的傳輸量（壓縮後）</td><td>2 MB 以內</td><td>DevTools Network，勾 Disable cache，看底部的 transferred</td></tr>
<tr><td>中階手機、4G 的第一幀時間</td><td>3 秒內</td><td>真機，或 DevTools 的網路與 CPU 降速</td></tr>
<tr><td>首場景的貼圖（解開後）</td><td>幾十 MB 以內</td><td>寬 &times; 高 &times; 4 加總，或用統計面板的貼圖記憶體</td></tr>
<tr><td>首場景 <code>onLoad</code> 與 <code>start</code></td><td>100 毫秒以內</td><td>DevTools Performance 錄一次</td></tr>
</table>
<h4>縮短關鍵路徑的五個做法</h4>
<ol>
<li><b>首場景只放一個很輕的載入畫面</b>。真正的遊戲放進自己的 bundle，載入畫面出現之後再去拿，順便顯示進度條。玩家看到的「白畫面」時間只剩引擎加上一個小場景。</li>
<li><b>裁剪引擎</b>：用不到的模組全部取消。</li>
<li><b>在 index.html 裡先畫東西</b>：index.html 是一般的 HTML，引擎還沒到之前它就能顯示。放一段 CSS 動畫或品牌圖，玩家就知道「有在動」。專案根目錄的 <code>build-templates/web-mobile/</code> 資料夾裡放的檔案，建置時會蓋過預設的檔案，你可以用它改 index.html。</li>
<li><b>讓 CDN 壓縮文字檔</b>：<code>.js</code>、<code>.json</code> 用 gzip 或 Brotli 傳，大小常常只剩三分之一甚至更少。序列化的 JSON 重複的欄位名很多，壓縮效果特別好。</li>
<li><b>提早連線</b>：遊戲一開始就要連的 API 或 WebSocket 網域，在 index.html 裡加 <code>&lt;link rel="preconnect"&gt;</code>，DNS 查詢和 TLS 握手就能跟引擎下載同時進行。</li>
</ol>
<pre><code>import { assetManager, director, ProgressBar, SceneAsset } from 'cc';

// 在輕量的載入場景裡：拿遊戲本體的包，邊載邊更新進度條
export function loadGame(bar: ProgressBar, onFail: (e: Error) =&gt; void) {
  assetManager.loadBundle('game', (err, bundle) =&gt; {
    if (err) return onFail(err);
    bundle.loadScene('Game',
      (done, total) =&gt; { bar.progress = done / total; },
      (err2, scene: SceneAsset) =&gt; err2 ? onFail(err2) : director.runScene(scene));
  });
}
</code></pre>
<h4>預載：趁玩家在看別的東西時先下載</h4>
<p>第一幀之後，就不在關鍵路徑上了。玩家在標題畫面讀規則的那幾秒，網路是閒著的，正好拿來下載第一關。</p>
<figure class="figure"><svg viewBox="0 0 640 210" class="fg" style="width:100%;max-width:640px" role="img" aria-label="比較有沒有預載：沒有預載時，玩家按開始後要等 1.8 秒；在標題畫面時背景下載，按開始後只剩 0.2 秒的解析">
<line x1="330" y1="30" x2="330" y2="190" class="fg-l warm dash"/>
<text x="330" y="22" text-anchor="middle" class="fg-t sm warm">玩家按開始</text>
<text x="10" y="63" class="fg-t">沒有預載</text>
<rect x="110" y="44" width="220" height="32" rx="5" class="fg-b"/><text x="220" y="65" text-anchor="middle" class="fg-t">標題畫面</text>
<rect x="330" y="44" width="120" height="32" rx="5" class="fg-b warm"/><text x="390" y="65" text-anchor="middle" class="fg-t">等下載 1.8 s</text>
<rect x="450" y="44" width="180" height="32" rx="5" class="fg-b hot"/><text x="540" y="65" text-anchor="middle" class="fg-t acc">第一關</text>
<text x="10" y="143" class="fg-t">標題時預載</text>
<text x="336" y="112" class="fg-t sm">只剩解析 0.2 s</text>
<rect x="110" y="124" width="220" height="32" rx="5" class="fg-b"/><text x="220" y="145" text-anchor="middle" class="fg-t">標題畫面</text>
<rect x="330" y="124" width="24" height="32" rx="4" class="fg-b warm"/>
<rect x="354" y="124" width="276" height="32" rx="5" class="fg-b hot"/><text x="492" y="145" text-anchor="middle" class="fg-t acc">第一關</text>
<rect x="130" y="164" width="170" height="16" rx="3" class="fg-b alt"/><text x="215" y="176" text-anchor="middle" class="fg-t sm">背景下載第一關的包</text>
<text x="320" y="204" text-anchor="middle" class="fg-t sm">預載只下載、不建立貼圖，所以還不佔顯示記憶體</text>
</svg><figcaption>下載的時間沒有消失，只是被藏進玩家本來就在看標題的那幾秒。</figcaption></figure>
<pre><code>// 標題畫面的 start()：下一步一定會用到的，先下載
assetManager.loadBundle('level-1', (err, bundle) =&gt; {
  if (!err) bundle.preloadScene('Level1');
});
</code></pre>
<p>預載有三條規矩。第一，<code>preload</code> 系列只下載、不解析，在引擎的下載佇列裡也排在一般載入後面。第二，只預載「下一步幾乎一定會用到」的東西；全部預載等於把首包變成全部，還會跟正在用的連線搶頻寬。第三，預載下來的資料還是佔記憶體，舊手機上要節制。</p>

<h3><span class="badge lv3">專業</span>五、CDN 上的快取：標頭怎麼設、檔案怎麼傳</h3>
<p>瀏覽器和 CDN 都會把檔案存起來重複用。一個檔案能不能直接用存著的那份、要不要先回去問，全看伺服器回應裡的 <code>Cache-Control</code> 標頭。下面是同一個玩家第二次打開遊戲時，兩種檔案的待遇：</p>
<figure class="figure"><svg viewBox="0 0 680 304" class="fg" style="width:100%;max-width:680px" role="img" aria-label="index.html 用 no-cache，每次都向 CDN 和來源確認，回 304；帶指紋的檔案用一年的快取加 immutable，第二次起瀏覽器直接用本機副本，不發請求">
<rect x="30" y="14" width="140" height="30" rx="6" class="fg-b alt"/><text x="100" y="34" text-anchor="middle" class="fg-t">玩家的瀏覽器</text>
<rect x="270" y="14" width="140" height="30" rx="6" class="fg-b alt"/><text x="340" y="34" text-anchor="middle" class="fg-t">CDN 邊緣節點</text>
<rect x="510" y="14" width="140" height="30" rx="6" class="fg-b alt"/><text x="580" y="34" text-anchor="middle" class="fg-t">來源（儲存空間）</text>
<line x1="100" y1="44" x2="100" y2="280" class="fg-l dim dash"/><line x1="340" y1="44" x2="340" y2="280" class="fg-l dim dash"/><line x1="580" y1="44" x2="580" y2="280" class="fg-l dim dash"/>
<rect x="20" y="56" width="640" height="22" rx="4" class="fg-b warm"/><text x="340" y="71" text-anchor="middle" class="fg-t sm">① index.html：Cache-Control: no-cache</text>
<text x="220" y="98" text-anchor="middle" class="fg-t sm mono">GET＋If-None-Match</text>
<line x1="100" y1="104" x2="332" y2="104" class="fg-l"/><polygon points="340,104 332,99.5 332,108.5" class="fg-a"/>
<text x="460" y="124" text-anchor="middle" class="fg-t sm">向來源確認：改了嗎？</text>
<line x1="340" y1="130" x2="572" y2="130" class="fg-l"/><polygon points="580,130 572,125.5 572,134.5" class="fg-a"/>
<text x="460" y="150" text-anchor="middle" class="fg-t sm">304 沒改</text>
<line x1="580" y1="156" x2="348" y2="156" class="fg-l dash"/><polygon points="340,156 348,151.5 348,160.5" class="fg-a"/>
<text x="220" y="176" text-anchor="middle" class="fg-t sm">304，幾百位元組</text>
<line x1="340" y1="182" x2="108" y2="182" class="fg-l dash"/><polygon points="100,182 108,177.5 108,186.5" class="fg-a"/>
<rect x="20" y="200" width="640" height="22" rx="4" class="fg-b hot"/><text x="340" y="215" text-anchor="middle" class="fg-t sm">② index.8f3c2.js：max-age=31536000, immutable</text>
<text x="220" y="240" text-anchor="middle" class="fg-t sm">第一次：GET</text>
<line x1="100" y1="246" x2="332" y2="246" class="fg-l on"/><polygon points="340,246 332,241.5 332,250.5" class="fg-a on"/>
<text x="220" y="264" text-anchor="middle" class="fg-t sm">200，CDN 直接給</text>
<line x1="340" y1="270" x2="108" y2="270" class="fg-l on dash"/><polygon points="100,270 108,265.5 108,274.5" class="fg-a on"/>
<text x="112" y="296" class="fg-t sm acc">第二次起：直接讀本機快取，連請求都不發</text>
</svg><figcaption>入口每次都問，但只花幾百位元組；帶指紋的大檔案存一年，問都不用問。兩種快取各做各的事，才能做到「又快又一定是新的」。</figcaption></figure>
<h4>標頭怎麼設</h4>
<table>
<tr><th>檔案</th><th>Cache-Control</th><th>為什麼</th></tr>
<tr><td><code>index.html</code></td><td><code>no-cache</code></td><td>名字永遠一樣，內容會變，每次都得確認</td></tr>
<tr><td>你自己的 <code>config.json</code></td><td><code>no-cache</code></td><td>每個環境不同，隨時可能換</td></tr>
<tr><td>名字裡有雜湊的檔案</td><td><code>public, max-age=31536000, immutable</code></td><td>內容一變名字就變，同一個名字永遠是同一份內容</td></tr>
<tr><td>其他名字沒有雜湊的檔案</td><td><code>no-cache</code></td><td>保守做法：不確定，就當它會變</td></tr>
</table>
<p>規則用檔名決定，不要用資料夾決定。哪些檔案有雜湊、哪些沒有，可能隨版本和設定改變，所以第一次設定時，請打開你自己的建置，一個一個資料夾確認。</p>
<h4>三個常被搞混的詞</h4>
<ul>
<li><b><code>no-cache</code></b>：可以存，但每次用之前都要先問伺服器「還是這份嗎」。伺服器拿 <code>ETag</code> 或 <code>Last-Modified</code> 比一比，沒變就回 <b>304 Not Modified</b>，只有標頭、沒有內容。所以 no-cache 並不慢。</li>
<li><b><code>no-store</code></b>：完全不准存。每次都整份重新下載。用在真的不能留在使用者電腦上的東西。</li>
<li><b><code>immutable</code></b>：告訴瀏覽器「這個網址的內容永遠不會變」，所以在有效期內，連使用者按重新整理都不用回去問。</li>
</ul>
<p>CDN 是共用快取，它還認得 <code>s-maxage</code>：只對 CDN 這種共用快取生效的有效期。例如 index.html 用 <code>max-age=0, s-maxage=30</code>，瀏覽器每次都問，但 CDN 自己可以用同一份 30 秒，來源就不會每個玩家都挨一次打。代價是發版後最多晚 30 秒生效。</p>
<h4>上傳順序</h4>
<ol>
<li>先上傳所有名字有雜湊的新檔案。它們是新名字，現在沒有任何頁面指向它們，傳多久都沒人受影響。</li>
<li>再上傳名字沒有雜湊、但內容有變的檔案。</li>
<li>最後才上傳 index.html。從這一刻起，新來的玩家拿到新版。</li>
<li>如果 CDN 有快取 index.html，發一次清除（purge 或 invalidation）。</li>
<li>舊版的帶雜湊檔案先不要刪，至少留到所有可能還開著舊頁面的玩家都離開（通常留幾天）。</li>
</ol>
<p>上線後，用 curl 看實際回應，不要相信設定畫面：</p>
<pre><code>curl -sI https://game.example.com/index.html | grep -i -E 'cache-control|etag|age'
curl -sI https://game.example.com/assets/main/index.8f3c2.js | grep -i cache-control
</code></pre>
<p>有些 CDN 的規則會覆寫來源送來的標頭，例如設了最短快取時間。<code>Age</code> 標頭告訴你這份回應在 CDN 上已經放了幾秒；index.html 的 <code>Age</code> 如果是好幾個小時，就是有規則在跟你作對。</p>

<h3><span class="badge lv3">專業</span>六、環境與設定：一份建置跑三個環境</h3>
<p>上一課把設定分成「建置時寫死」和「啟動時才讀」。到了真實專案，還要再分清楚一件事：哪些資訊屬於<b>這份建置產物</b>（artifact）本身，哪些屬於<b>它被放在哪裡</b>。</p>
<table>
<tr><th></th><th>屬於建置產物（建置時決定）</th><th>屬於環境（啟動時讀）</th></tr>
<tr><td>例子</td><td>版本號、git commit、建置時間、是不是 Debug</td><td>伺服器位址、要不要開模擬伺服器、log 等級</td></tr>
<tr><td>放哪裡</td><td>CI 在建置前產生的一個小 <code>.ts</code> 檔</td><td>index.html 旁邊的 <code>config.json</code></td></tr>
<tr><td>從預備搬到正式時</td><td>不變：同一份產物，同一個版本號</td><td>換掉 <code>config.json</code></td></tr>
</table>
<pre><code>// BuildInfo.ts：由 CI 在建置前寫出來，不要手改，也不要進 git
export const BUILD = { version: '1.4.2', commit: 'a1b2c3d', time: '2026-11-09T10:00:00Z' };
</code></pre>
<p>把 <code>BUILD.version</code> 顯示在設定畫面的角落，也附在每一筆錯誤回報裡。玩家說「遊戲壞了」時，第一個問題永遠是「哪一版」。</p>
<h4>讓 config.json 失敗得很大聲</h4>
<p><code>loadConfig()</code> 讀到檔案之後，先檢查必要的欄位都在、型別都對，缺了就停在一個看得見的錯誤畫面，寫明缺什麼。最糟的情況是缺了 <code>wsUrl</code>，程式卻默默用空字串去連線，於是你得到一個「有時候連不上」的神秘 bug。</p>
<h4>測試人員的覆寫開關，只能存在於 Debug 建置</h4>
<p>給測試人員用網址參數切換伺服器（例如 <code>?ws=...</code>）很方便，但在正式建置裡這是一個漏洞：有人可以寄一個帶著自己伺服器位址的連結給玩家，玩家的登入憑證就送到別人手上。所以這種覆寫只能包在 <code>if (DEBUG)</code> 裡。想確認它真的不在正式產物裡，最可靠的方法是在建置出來的 JavaScript 裡搜尋那個參數名稱。</p>

<h3><span class="badge lv3">專業</span>七、在 CI 裡自動建置</h3>
<p>手動建置的問題不是慢，是每次都有一點點不一樣：這次忘了勾 MD5 Cache，那次用了另一台電腦上的另一個 Cocos 版本。管線的目的，是讓同一個 commit 永遠產出同一份東西。</p>
<h4>建置機器的條件</h4>
<ul>
<li><b>作業系統</b>：Cocos Creator 的編輯器只有 Windows 和 macOS 版，所以建置機器得是這兩種之一，不能是一般的 Linux 容器。</li>
<li><b>版本一致</b>：專案的 <code>package.json</code> 裡記著建立它的 Creator 版本。建置機器要裝同一個版本，升級要整個團隊一起升。</li>
<li><b>設定進 repo</b>：在建置面板把設定匯出成 JSON，放進 repo，命令列用 <code>configPath</code> 指給它。誰都不在編輯器裡點選項。</li>
<li><b>快取 <code>library/</code></b>：<code>library</code>、<code>temp</code>、<code>local</code> 是編輯器匯入資源時產生的，不進 git。乾淨的機器第一次要把全部資源重新匯入，很慢；在 CI 裡快取 <code>library</code> 可以省下大部分時間。快取壞了就清掉重來。</li>
</ul>
<h4>命令列和那個奇怪的結束碼</h4>
<pre><code>#!/bin/bash
set -euo pipefail
CREATOR="/Applications/Cocos/Creator/3.8.x/CocosCreator.app/Contents/MacOS/CocosCreator"

node tools/write-build-info.js          # 產生 BuildInfo.ts

set +e
"$CREATOR" --project "$PWD" --build "configPath=./build-config/web-mobile.json"
code=$?
set -e
if [ "$code" -ne 36 ]; then echo "Cocos build failed, exit code $code"; exit 1; fi

npx tsc --noEmit                         # 型別檢查放在建置之後，見下文
</code></pre>
<p>兩個細節。第一，3.x 的手冊寫明：命令列建置<b>成功時的結束碼是 36</b>，不是一般程式習慣的 0；參數不對和建置過程出錯各有自己的碼。如果你照習慣用 <code>set -e</code>，管線會在每一次成功時當成失敗。安裝路徑和參數名稱請對照你那個版本的手冊。第二，Cocos 專案的 <code>tsconfig.json</code> 通常繼承 <code>temp/</code> 底下一個編輯器產生的設定檔。乾淨的機器上那個檔案還不存在，<code>tsc</code> 會先抱怨找不到設定，所以型別檢查放在 Cocos 開過專案之後跑。</p>
<h4>出貨前的閘門</h4>
<p>建置成功不等於可以出貨。在上傳前加幾道會讓管線失敗的檢查：</p>
<ul>
<li><b>大小預算</b>：算出首包（引擎、main、首場景）gzip 後的大小，超過預算就讓管線失敗。<code>gzip -c 檔案 | wc -c</code> 就能算一個檔案壓縮後的位元組數。</li>
<li><b>不該出現的東西</b>：在產物裡搜尋除錯參數名稱、內部網址、<code>.map</code> 檔。</li>
<li><b>保存產物</b>：把整個 <code>build/web-mobile</code> 壓成一個檔，用 commit 命名存起來。之後上預備、上正式、回滾，用的都是這一份，不再重新建置。</li>
</ul>

<h3><span class="badge lv4">專家</span>八、版本、回滾，和很少人看到的邊角</h3>
<h4>回滾的兩種做法</h4>
<p><b>做法 A：共用一個資料夾，靠指紋共存。</b>每一版的帶雜湊檔案都放在同一個地方，新舊並存，只有 index.html 決定玩家拿到哪一版。上線就是換 index.html，回滾就是把上一版的 index.html 放回去。</p>
<figure class="figure"><svg viewBox="0 0 650 236" class="fg" style="width:100%;max-width:650px" role="img" aria-label="四個時間點的 CDN 檔案：上線前只有 v1；先傳 v2 的指紋檔；最後把入口換成 v2；出事時把入口換回 v1，v1 的檔案都還在">
<text x="84" y="26" text-anchor="middle" class="fg-t">① 上線前</text>
<text x="244" y="26" text-anchor="middle" class="fg-t">② 先傳新檔</text>
<text x="404" y="26" text-anchor="middle" class="fg-t">③ 最後換入口</text>
<text x="564" y="26" text-anchor="middle" class="fg-t">④ 出事回滾</text>
<rect x="16" y="38" width="136" height="148" rx="8" class="fg-b"/>
<rect x="26" y="50" width="116" height="34" rx="5" class="fg-b warm"/><text x="84" y="72" text-anchor="middle" class="fg-t sm mono">index → v1</text>
<rect x="26" y="96" width="116" height="34" rx="5" class="fg-b alt"/><text x="84" y="118" text-anchor="middle" class="fg-t sm">v1 指紋檔</text>
<rect x="26" y="142" width="116" height="34" rx="5" class="fg-l dash"/><text x="84" y="164" text-anchor="middle" class="fg-t sm">（還沒有 v2）</text>
<line x1="152" y1="113" x2="168" y2="113" class="fg-l"/><polygon points="176,113 168,108.5 168,117.5" class="fg-a"/>
<rect x="176" y="38" width="136" height="148" rx="8" class="fg-b"/>
<rect x="186" y="50" width="116" height="34" rx="5" class="fg-b warm"/><text x="244" y="72" text-anchor="middle" class="fg-t sm mono">index → v1</text>
<rect x="186" y="96" width="116" height="34" rx="5" class="fg-b alt"/><text x="244" y="118" text-anchor="middle" class="fg-t sm">v1 指紋檔</text>
<rect x="186" y="142" width="116" height="34" rx="5" class="fg-b hot"/><text x="244" y="164" text-anchor="middle" class="fg-t sm">v2 指紋檔</text>
<line x1="312" y1="113" x2="328" y2="113" class="fg-l"/><polygon points="336,113 328,108.5 328,117.5" class="fg-a"/>
<rect x="336" y="38" width="136" height="148" rx="8" class="fg-b"/>
<rect x="346" y="50" width="116" height="34" rx="5" class="fg-b warm"/><text x="404" y="72" text-anchor="middle" class="fg-t sm mono">index → v2</text>
<rect x="346" y="96" width="116" height="34" rx="5" class="fg-b alt"/><text x="404" y="118" text-anchor="middle" class="fg-t sm">v1 指紋檔</text>
<rect x="346" y="142" width="116" height="34" rx="5" class="fg-b hot"/><text x="404" y="164" text-anchor="middle" class="fg-t sm">v2 指紋檔</text>
<line x1="472" y1="113" x2="488" y2="113" class="fg-l warm"/><polygon points="496,113 488,108.5 488,117.5" class="fg-a warm"/>
<rect x="496" y="38" width="136" height="148" rx="8" class="fg-b"/>
<rect x="506" y="50" width="116" height="34" rx="5" class="fg-b warm"/><text x="564" y="72" text-anchor="middle" class="fg-t sm mono">index → v1</text>
<rect x="506" y="96" width="116" height="34" rx="5" class="fg-b alt"/><text x="564" y="118" text-anchor="middle" class="fg-t sm">v1 指紋檔</text>
<rect x="506" y="142" width="116" height="34" rx="5" class="fg-b hot"/><text x="564" y="164" text-anchor="middle" class="fg-t sm">v2 指紋檔</text>
<text x="84" y="206" text-anchor="middle" class="fg-t sm">玩家都在 v1</text>
<text x="244" y="206" text-anchor="middle" class="fg-t sm">還沒人看得到 v2</text><text x="244" y="224" text-anchor="middle" class="fg-t sm">可以慢慢傳</text>
<text x="404" y="206" text-anchor="middle" class="fg-t sm">新開的人拿到 v2</text><text x="404" y="224" text-anchor="middle" class="fg-t sm">玩到一半的還用 v1</text>
<text x="564" y="206" text-anchor="middle" class="fg-t sm">入口換回 v1</text><text x="564" y="224" text-anchor="middle" class="fg-t sm">v1 的檔案都還在</text>
</svg><figcaption>上線和回滾都只是「換一個小檔案」，所以都能在幾秒內完成。前提是：舊版的檔案還沒被刪掉。</figcaption></figure>
<p>注意第 ④ 格：回滾不是「重新建置舊版本」。重新建置不保證得到一模一樣的檔案（工具版本、快取都可能不同），而且要花好幾分鐘。真正的回滾是把上一份已經測過、已經在 CDN 上的產物重新指回去。</p>
<p><b>做法 B：每一版一個資料夾。</b>例如 <code>/releases/1.4.2/</code>，整份建置原封不動放進去；玩家網址指向哪個資料夾，由 CDN 的路由規則或一個轉址決定。好處是每一版完全隔離，一個資料夾內的所有檔案都可以長快取，因為路徑本身就帶著版本；回滾就是改指向。缺點是兩版之間沒變的檔案不能共用快取，玩家每次更新都要重新下載整份。</p>
<h4>玩到一半的人：新舊版本混在一起</h4>
<p>玩家 10:00 打開了 v1，你 10:05 上線 v2。他手上的 v1 頁面，在 10:20 進第三關時才去載 level-3 這個包，載的當然是 v1 的檔名。如果你上線時就把 v1 的檔案刪了，他會在玩到一半時拿到 404，畫面卡在載入。這就是「舊檔案留幾天」的理由。</p>
<p>更麻煩的是伺服器。v1 的用戶端可能還在用 v2 伺服器已經改掉的訊息格式。成熟的做法是：連線時用戶端送出自己的版本，伺服器判斷太舊就回一個「請重新整理」；用戶端也可以每隔幾分鐘去拿一個 no-cache 的 <code>version.json</code>，發現有新版時，在 waiting 這種安全的狀態提示玩家重新整理，而不是在一局進行到一半時打斷他。</p>
<h4>幾個踩過才知道的坑</h4>
<ul>
<li><b>用查詢字串更新快取不可靠</b>：<code>index.js?v=2</code> 這種寫法，有些 CDN 預設不把查詢字串算進快取鍵，於是 v1 和 v2 被當成同一份。檔名指紋沒有這個問題。</li>
<li><b>404 也可能被快取</b>：如果你先傳了 index.html，有玩家在新檔案還沒傳完時就去拿，他會拿到 404；有些 CDN 會把錯誤回應也快取一小段時間，於是這幾十秒內所有人都拿到 404。上傳順序不是禮貌，是正確性。</li>
<li><b>跨網域的貼圖要有 CORS</b>：如果遊戲頁面和資源放在不同網域，圖片被當成 WebGL 貼圖使用時，資源伺服器必須回 <code>Access-Control-Allow-Origin</code>，否則瀏覽器會拒絕把它上傳給顯示晶片。</li>
<li><b>MIME 類型</b>：如果建置裡有 <code>.wasm</code> 檔，伺服器要用 <code>application/wasm</code> 回應，瀏覽器才能邊下載邊編譯。</li>
<li><b>Service Worker</b>：如果有人為了「離線也能玩」加了 Service Worker，它會攔下所有請求，包括 index.html。沒設計好更新流程的 Service Worker，可以讓玩家永遠困在某一個舊版本，而且清 CDN 也救不了。</li>
<li><b>source map 是原始碼</b>：<code>.map</code> 檔可以把縮小過的程式還原成你的 TypeScript。要不要公開放，是一個資安決定，不是預設值。下一課會講怎麼只給自己用。</li>
</ul>

<h3>九、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>預覽跑得順，建置一定也順</td><td>建置用的是裁剪過、壓縮過、分過包的東西。用路徑載入的資源、被裁掉的引擎模組、貼圖記憶體，都可能只在建置裡出問題。</td></tr>
<tr><td>PNG 檔越小，佔的記憶體越少</td><td>顯示記憶體看的是像素：寬 &times; 高 &times; 4。檔案大小只影響下載。</td></tr>
<tr><td>勾了 MD5 Cache，就不會有快取問題</td><td>index.html 和 config.json 的標頭、上傳順序、舊檔案保留，都還是你的事。</td></tr>
<tr><td><code>no-cache</code> 就是不快取</td><td>no-cache 是「可以存，用之前先問」，回 304 時幾乎不花流量。不准存的是 <code>no-store</code>。</td></tr>
<tr><td>建置時會幫我抓型別錯誤</td><td>Cocos 的建置只轉譯，不檢查型別。<code>tsc --noEmit</code> 要自己跑。</td></tr>
<tr><td>回滾就是重新建置舊版本</td><td>重新建置又慢又不保證一樣。回滾是把入口指回上一份已經測過、還在 CDN 上的產物。</td></tr>
<tr><td>預載越多越好</td><td>預載會跟正在用的連線搶頻寬，下載的資料也佔記憶體。只預載下一步一定會用到的。</td></tr>
</table>

<h3>十、跟你的工作連起來</h3>
<ul>
<li><b>Vue 加 Vite 的前端</b>：<code>dist/</code> 的部署規則跟這一章一模一樣：帶雜湊的 <code>assets/</code> 長快取，index.html 用 no-cache、最後上傳。你在公司設好的 CDN 規則，大多可以直接搬來給遊戲用。</li>
<li><b>Docker 裡的 nginx</b>：一樣用 <code>location</code> 規則幫 index.html 和 config.json 加上 <code>Cache-Control: no-cache</code>，其他檔案依檔名有沒有雜湊來分。上線後照樣用 curl 檢查。</li>
<li><b>Node.js 或 Go 的後端</b>：WebSocket 連線時檢查用戶端版本，太舊就要求重新整理。這是前端回滾、後端上線可以各自進行的前提。</li>
<li><b>雲端</b>：物件儲存（例如 S3、Cloud Storage）當來源，前面放 CDN，是靜態遊戲最常見的架構。上傳工具通常可以對每個檔案指定 <code>Cache-Control</code>，把規則寫進部署腳本，不要在主控台手動點。</li>
<li><b>CI/CD</b>：「建置一次、到處部署」不只適用於 Docker 映像檔，也適用於前端產物。預備環境測過的那一份，就是正式環境跑的那一份。</li>
</ul>

<h3>十一、面試會怎麼問</h3>
<p>前端、遊戲用戶端、DevOps 的面試裡，這些題目都很常見。先自己講一遍，再看參考答案。</p>
<ol>
<li>「玩家回報更新之後還是看到舊版，你怎麼查？怎麼根治？」</li>
<li>「一張 PNG 才 200 KB，為什麼會讓手機的記憶體爆掉？壓縮貼圖格式要怎麼選？」</li>
<li>「手機網頁遊戲第一次載入很慢，你會怎麼分析、從哪裡下手？」</li>
<li>「你會怎麼設計前端的建置與部署流程，確保預備環境測過的，就是正式環境跑的？」</li>
<li>「上線後發現嚴重 bug，怎麼在一分鐘內回滾？有什麼要注意？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>先確認是哪一層的快取：用 curl 看 index.html 的 <code>Cache-Control</code> 和 <code>Age</code>，判斷是瀏覽器存著、CDN 存著，還是 index.html 根本沒更新。常見原因是 index.html 被設成長快取，或 CDN 規則覆寫了來源的標頭。根治的做法：所有資源檔名帶內容雜湊、長快取加 immutable；index.html 和設定檔用 no-cache；上傳時新檔先、index.html 最後，必要時清除 CDN 上的 index.html；舊檔保留幾天。另外在遊戲裡顯示版本號，回報時才知道玩家在哪一版。</li>
<li>顯示晶片不能直接畫 PNG，要先解成原始像素，每像素 4 位元組。1024 &times; 1024 就是 4 MB，2048 &times; 2048 是 16 MB，跟 PNG 檔多小無關。對策是把圖縮到真正需要的尺寸、合併成圖集，並用顯示晶片能直接讀的壓縮格式：ASTC 是現代手機的首選，舊裝置再用 ETC2（Android）或 PVRTC（舊 iPhone）備援，最後留 PNG。要注意壓縮格式的檔案可能比 PNG 大，是用下載量換記憶體，而且文字和細邊要在真機上看畫質。</li>
<li>先量再改。用 DevTools 開網路和 CPU 降速，或直接用真機遠端檢查，錄一次 Performance，畫出第一幀之前的關鍵路徑：引擎下載和解析、設定和清單、首場景的依賴、<code>onLoad</code> 和 <code>start</code> 的同步工作。然後挑最長的那段下手：首場景換成很輕的載入場景，真正的內容放進 bundle 再載；裁剪引擎模組；CDN 開 gzip 或 Brotli；index.html 先顯示載入畫面；用 preconnect 提早建立連線。之後的內容用預載藏在玩家閱讀標題的時間裡。改完再量一次，對照預算。</li>
<li>管線從 git 觸發，在固定版本的建置機器上用命令列建置，建置設定放在 repo；建置前產生版本資訊，建置後做型別檢查、大小預算、產物內容檢查。產物以 commit 命名保存，不同環境的差異只放在啟動時讀的 config.json。預備環境部署這份產物、跑自動冒煙測試和真機檢查，通過後把<b>同一份產物</b>複製到正式環境，只換 config.json，絕不重新建置。</li>
<li>如果舊版的帶雜湊檔案還在 CDN 上，回滾只要把上一版的 index.html 放回去，再清除 CDN 上的 index.html 快取，幾秒到幾十秒內生效。要注意：舊檔案必須保留夠久；伺服器要能同時接受新舊版本的用戶端，或者後端一起回滾；回滾後已經拿到新版的玩家要重新整理才會回去；最後要在事後檢討為什麼這個 bug 沒有在預備環境被抓到。</li>
</ol>
</details>

<h3>十二、練功題（做得出來才算真的懂）</h3>
<ol>
<li>一張 2048 &times; 1024、有透明的圖。算出：不壓縮時的顯示記憶體；開了 mipmap（多出約三分之一）之後；改用 ETC2（有透明時每像素 1 位元組）之後。</li>
<li>拿你自己的建置，在 DevTools 的 Network 勾 Disable cache 載一次、取消勾選再重新整理一次，記下兩次的傳輸量。再用 <code>curl -sI</code> 檢查 index.html、一個帶雜湊的 JS、你的 config.json 三個檔案的 <code>Cache-Control</code>。哪一個跟本章的表不一樣？</li>
<li>同事上線 v2 時，先傳了 index.html，再花 90 秒傳其他檔案。哪些玩家會出事？他們看到什麼？有沒有可能出事的不只那 90 秒？</li>
<li>首頁現在 5.2 秒才出第一幀，量出來是：引擎下載 1.4 秒、解析 0.6 秒、首場景 1.9 秒（其中 1.5 秒是在等一張 900 KB 的背景和 52 張牌面）、<code>start()</code> 裡同步建立 200 個節點 0.5 秒、其他 0.8 秒。目標是 3 秒。挑三個改法，估計各省多少。</li>
<li>寫出 CI 腳本裡呼叫 Cocos 命令列建置、並正確判斷成功與失敗的那幾行，說明為什麼不能直接依賴 <code>set -e</code>。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>2048 &times; 1024 = 2,097,152 像素。不壓縮：&times; 4 = 8 MB。加上 mipmap：約 8 &times; 4/3 &asymp; 10.7 MB。ETC2 有透明：&times; 1 = 2 MB（再加 mipmap 約 2.7 MB）。同一張圖，從 10.7 MB 到 2.7 MB。</li>
<li>正確的結果是：index.html 和 config.json 是 <code>no-cache</code>，帶雜湊的 JS 是長快取加 immutable。第二次載入時，帶雜湊的檔案在 Network 裡顯示來自記憶體或磁碟快取、傳輸量接近 0，index.html 是 304。如果帶雜湊的檔案每次都重新下載，就是長快取沒設好；如果 index.html 完全沒發請求，就是它被設成了長快取，這是最危險的那一種。</li>
<li>這 90 秒內打開遊戲的玩家，拿到的新 index.html 指向還沒上傳的檔案，會在載入時拿到 404，畫面卡住或全黑。不只這 90 秒：如果 CDN 把 404 也快取了一段時間，檔案傳完之後還會有人繼續拿到 404；如果瀏覽器或 CDN 存下了這份新 index.html，也要等它重新驗證。正確順序是新檔先傳、index.html 最後。</li>
<li>一種合理的答案：(1) 首場景改成只有載入條的輕量場景，背景和牌面移到 game 包裡，載入畫面出現後再載，關鍵路徑省下約 1.5 秒；(2) 裁剪引擎模組並確認 CDN 用 Brotli 或 gzip，引擎下載和解析大約能省 0.4 到 0.6 秒；(3) 200 個節點改成先建畫面上看得到的、其餘分幾幀建立或用 NodePool，省約 0.4 秒。5.2 − 1.5 − 0.5 − 0.4 = 2.8 秒，達標。答案不唯一，重點是每一刀都對準關鍵路徑上最長的一段，而且改完要再量。</li>
<li>先 <code>set +e</code> 暫時關掉「出錯就停」，執行建置，存下 <code>$?</code>，再 <code>set -e</code> 打開，然後判斷結束碼是不是 36，不是就印出結束碼並 <code>exit 1</code>（程式碼見第七節）。因為 Cocos 3.x 命令列建置成功時回傳 36 而不是 0，<code>set -e</code> 會把每次成功都當成失敗而中止管線。</li>
</ol>
</details>

<h3>十三、想再挖深</h3>
<ul>
<li><b>Cocos Creator 3.8 使用手冊</b>（<a href="https://docs.cocos.com/creator/3.8/manual/en/">docs.cocos.com/creator/3.8/manual</a>）：資源包（Asset Bundle）、發佈到 Web 平台、命令列發佈、壓縮貼圖幾章，是這一章所有設定的出處。版本之間有差異時，以手冊為準。</li>
<li><b>MDN〈HTTP caching〉</b>（<a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching">developer.mozilla.org</a>）：把 <code>Cache-Control</code> 每個指令、驗證、304 講得最清楚的免費文件。</li>
<li><b>RFC 9111〈HTTP Caching〉</b>：HTTP 快取的正式規格。遇到「CDN 到底該怎麼處理這個標頭」的爭議時，這是最後的答案。</li>
<li><b>Jake Archibald〈Caching best practices &amp; max-age gotchas〉</b>：一篇經典的部落格文章，用實例講為什麼「帶雜湊的檔案長快取、入口不快取」是唯一不會出事的組合。</li>
</ul>
` });
