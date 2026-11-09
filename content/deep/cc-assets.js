DEEP({ 'cc-assets': `
<p>上一課你知道了資源有哪些種類、uuid 和 .meta 是什麼、Prefab 怎麼用、怎麼在執行中載入和釋放。這一章往下挖：你把一張 PNG 丟進專案的那一刻，編輯器到底產生了哪些東西；場景檔裡的「參照」實際長什麼樣子，為什麼在 Finder 裡搬一下檔案就會斷；巢狀 Prefab 在場景裡其實只存了「差異」；一個 loading 畫面從按下按鈕到畫面出現，每一段時間花在哪裡；參照計數（reference count）到底在數什麼；一張圖在手機記憶體裡佔多少；以及手機上最常見的幾種記憶體洩漏。手機遊戲最常見的兩種客訴是「載入好慢」和「玩一陣子就閃退」，這一章就是在拆這兩件事。</p>
<p>內容依照 Cocos Creator 3.8 的引擎原始碼和實際的專案檔案整理。時間和記憶體的數字是常見的量級，用來建立直覺，不是精確的規格。</p>

<h3><span class="badge lv1">基礎</span>一、匯入：一張 PNG 在專案裡變成了什麼</h3>
<p>把資源管理想成一間圖書館。你捐了一本書（把 <code>card-back.png</code> 丟進 <code>assets</code>），圖書館會做三件事：給它一個獨一無二的<b>索書號</b>（uuid），寫在一張跟著書走的卡片上（<code>.meta</code> 檔）；把書拆成館內好處理的形式放進書庫（<code>library</code> 資料夾）；之後所有目錄、所有借閱紀錄都只寫索書號，不寫書名。</p>
<p>打開一張圖的 .meta 檔，重點只有幾行：</p>
<pre><code>{
  "importer": "image",
  "uuid": "3f2a9c10-7b4e-4c2d-9a51-2e6f0d8b1c44",
  "subMetas": {
    "6c48a": {
      "name": "texture",
      "uuid": "3f2a9c10-…@6c48a"
    },
    "f9941": {
      "name": "spriteFrame",
      "uuid": "3f2a9c10-…@f9941"
    }
  }
}</code></pre>
<p>看到了嗎？<b>一張 PNG 其實是三個資源</b>：原圖本身（ImageAsset，用主 uuid）、一張 GPU 貼圖（Texture2D，uuid 後面加 <code>@6c48a</code>）、一個可以直接拿來畫的 SpriteFrame（加 <code>@f9941</code>）。這兩個尾巴是 3.x 圖片匯入器固定使用的子資源 id，每個專案、每張圖都一樣。這也解釋了上一課那個謎：<code>resources.load('cards/back/spriteFrame', SpriteFrame)</code> 路徑最後的 <code>spriteFrame</code>，就是子資源的名字；換成 <code>cards/back/texture</code>，拿到的就是 Texture2D。</p>
<figure class="figure"><svg viewBox="0 0 700 262" class="fg" style="width:100%;max-width:700px" role="img" aria-label="一張 PNG 從 assets 資料夾匯入到 library，變成原圖、貼圖、SpriteFrame 三個資源，建置時再打包成 bundle 的 config、import、native">
<text x="90" y="30" text-anchor="middle" class="fg-t lg">assets/ 你放的</text>
<text x="345" y="30" text-anchor="middle" class="fg-t lg">library/ 匯入結果</text>
<text x="610" y="30" text-anchor="middle" class="fg-t lg">建置後的 bundle</text>
<rect x="10" y="48" width="160" height="40" rx="6" class="fg-b"/>
<text x="90" y="73" text-anchor="middle" class="fg-t mono">card-back.png</text>
<rect x="10" y="100" width="160" height="90" rx="6" class="fg-b hot"/>
<text x="90" y="122" text-anchor="middle" class="fg-t mono">card-back.png.meta</text>
<text x="90" y="144" text-anchor="middle" class="fg-t sm">uuid：3f2a9c10-…</text>
<text x="90" y="162" text-anchor="middle" class="fg-t sm">texture → @6c48a</text>
<text x="90" y="180" text-anchor="middle" class="fg-t sm">spriteFrame → @f9941</text>
<rect x="240" y="48" width="210" height="40" rx="6" class="fg-b alt"/>
<text x="345" y="65" text-anchor="middle" class="fg-t sm mono">3f2a….json、.png</text><text x="345" y="81" text-anchor="middle" class="fg-t sm">ImageAsset：原圖</text>
<rect x="240" y="98" width="210" height="40" rx="6" class="fg-b alt"/>
<text x="345" y="115" text-anchor="middle" class="fg-t sm mono">3f2a…@6c48a.json</text><text x="345" y="131" text-anchor="middle" class="fg-t sm">Texture2D：GPU 貼圖</text>
<rect x="240" y="148" width="210" height="40" rx="6" class="fg-b alt"/>
<text x="345" y="165" text-anchor="middle" class="fg-t sm mono">3f2a…@f9941.json</text><text x="345" y="181" text-anchor="middle" class="fg-t sm">SpriteFrame：要畫的那一塊</text>
<rect x="530" y="48" width="160" height="40" rx="6" class="fg-b"/>
<text x="610" y="65" text-anchor="middle" class="fg-t sm mono">config.json</text><text x="610" y="81" text-anchor="middle" class="fg-t sm">路徑、uuid、相依</text>
<rect x="530" y="98" width="160" height="40" rx="6" class="fg-b"/>
<text x="610" y="115" text-anchor="middle" class="fg-t sm mono">import/</text><text x="610" y="131" text-anchor="middle" class="fg-t sm">序列化的 JSON</text>
<rect x="530" y="148" width="160" height="40" rx="6" class="fg-b"/>
<text x="610" y="165" text-anchor="middle" class="fg-t sm mono">native/</text><text x="610" y="181" text-anchor="middle" class="fg-t sm">png、mp3 原檔</text>
<line x1="172" y1="120" x2="232" y2="120" class="fg-l on"/><polygon points="240,120 232,115.5 232,124.5" class="fg-a on"/>
<text x="205" y="110" text-anchor="middle" class="fg-t sm acc">匯入</text>
<line x1="452" y1="120" x2="522" y2="120" class="fg-l alt"/><polygon points="530,120 522,115.5 522,124.5" class="fg-a alt"/>
<text x="490" y="110" text-anchor="middle" class="fg-t sm alt">建置</text>
<text x="350" y="222" text-anchor="middle" class="fg-t sm">library 和 temp 可以刪掉重建，不進 git；.meta 一定要進 git</text>
<text x="350" y="248" text-anchor="middle" class="fg-t sm mono">{"__uuid__": "3f2a9c10-…@f9941"}　← 場景裡的參照長這樣</text>
</svg><figcaption>左邊是你管的，中間是編輯器的快取，右邊是玩家下載的。三個地方都用同一組 uuid 串起來。</figcaption></figure>
<ul>
<li><b>library</b>：匯入後、引擎可以直接讀的版本，依 uuid 前兩個字元分資料夾存放，例如 <code>library/3f/3f2a9c10-…@f9941.json</code>。它是快取：整個刪掉，下次開專案時編輯器會全部重新匯入，只是第一次開會很慢。</li>
<li><b>建置之後</b>：每個 Asset Bundle 會變成一個資料夾，裡面有 <code>config</code>（這個包裡每個資源的路徑、uuid 和相依關係）、<code>index.js</code>（這個包的腳本）、<code>import/</code>（序列化後的 JSON，常常好幾個合併成一個檔案）、<code>native/</code>（png、mp3 這類原始檔）。打開建置選項的 MD5 Cache，檔名會帶上內容雜湊，例如 <code>config.3ce60.json</code>，內容一改檔名就變，CDN 和瀏覽器快取就不會拿到舊檔。</li>
</ul>

<h3><span class="badge lv1">基礎</span>二、參照長什麼樣：為什麼在 Finder 裡搬檔案會壞</h3>
<p>場景檔（.scene）和 Prefab 檔（.prefab）都是 JSON，內容是一個大陣列，每個節點、每個元件都是陣列裡的一個物件。指向「同一個檔案裡的東西」用 <code>__id__</code>（陣列的索引），指向「另一個資源」用 <code>__uuid__</code>：</p>
<pre><code>{
  "__type__": "cc.Sprite",
  "node": { "__id__": 5 },
  "_spriteFrame": { "__uuid__": "3f2a9c10-…@f9941" }
}</code></pre>
<p>這個 Sprite 屬於陣列第 5 個物件（它的節點），要畫的圖是 uuid 為 <code>3f2a9c10-…@f9941</code> 的 SpriteFrame。整個檔案裡沒有任何地方寫著「card-back.png」。檔名對引擎來說根本不存在，只有 uuid。</p>
<figure class="figure"><svg viewBox="0 0 660 240" class="fg" style="width:100%;max-width:660px" role="img" aria-label="上排：在資源管理器裡搬檔案，場景指向 uuid A，A 的 meta 跟著圖走，參照完好。下排：在 Finder 只搬 png，場景仍指向 A，但 A 已經沒有檔案，圖片拿到新的 uuid B">
<text x="10" y="26" class="fg-t">在資源管理器裡搬：uuid 不變</text>
<rect x="10" y="40" width="120" height="40" rx="6" class="fg-b"/><text x="70" y="65" text-anchor="middle" class="fg-t">場景</text>
<rect x="170" y="40" width="140" height="40" rx="6" class="fg-b"/><text x="240" y="65" text-anchor="middle" class="fg-t mono">uuid A</text>
<rect x="350" y="40" width="130" height="40" rx="6" class="fg-b hot"/><text x="415" y="65" text-anchor="middle" class="fg-t">A 的 .meta</text>
<rect x="520" y="40" width="130" height="40" rx="6" class="fg-b hot"/><text x="585" y="65" text-anchor="middle" class="fg-t mono">ui/back.png</text>
<line x1="131" y1="60" x2="162" y2="60" class="fg-l"/><polygon points="170,60 162,55.5 162,64.5" class="fg-a"/>
<line x1="311" y1="60" x2="342" y2="60" class="fg-l"/><polygon points="350,60 342,55.5 342,64.5" class="fg-a"/>
<line x1="481" y1="60" x2="512" y2="60" class="fg-l on"/><polygon points="520,60 512,55.5 512,64.5" class="fg-a on"/>
<text x="10" y="120" class="fg-t">在 Finder 只搬 .png：</text>
<rect x="10" y="134" width="120" height="40" rx="6" class="fg-b"/><text x="70" y="159" text-anchor="middle" class="fg-t">場景</text>
<rect x="170" y="134" width="140" height="40" rx="6" class="fg-b"/><text x="240" y="159" text-anchor="middle" class="fg-t mono">uuid A</text>
<rect x="350" y="134" width="130" height="40" rx="6" class="fg-b warm"/><text x="415" y="159" text-anchor="middle" class="fg-t warm">找不到 A</text>
<line x1="131" y1="154" x2="162" y2="154" class="fg-l"/><polygon points="170,154 162,149.5 162,158.5" class="fg-a"/>
<line x1="311" y1="154" x2="342" y2="154" class="fg-l warm"/><polygon points="350,154 342,149.5 342,158.5" class="fg-a warm"/>
<rect x="350" y="188" width="130" height="40" rx="6" class="fg-b"/><text x="415" y="213" text-anchor="middle" class="fg-t">新的 .meta：B</text>
<rect x="520" y="188" width="130" height="40" rx="6" class="fg-b"/><text x="585" y="213" text-anchor="middle" class="fg-t mono">ui/back.png</text>
<line x1="519" y1="208" x2="488" y2="208" class="fg-l dash"/><polygon points="480,208 488,203.5 488,212.5" class="fg-a"/>
<text x="585" y="164" text-anchor="middle" class="fg-t sm">沒有人指向 B</text>
</svg><figcaption>圖還在，場景也還在，但兩邊靠的那個 uuid 對不上了。編輯器只看到「一張沒有 .meta 的新圖」，就發給它一個新號碼。</figcaption></figure>
<table>
<tr><th>你做了什麼</th><th>uuid</th><th>結果</th></tr>
<tr><td>在編輯器的資源管理器裡拖移、改名</td><td>不變</td><td>一切正常，.meta 會跟著一起動</td></tr>
<tr><td>在 Finder 連 .meta 一起搬</td><td>不變（寫在 .meta 裡）</td><td>通常沒事，下次開啟時重新匯入</td></tr>
<tr><td>在 Finder 只搬 .png，.meta 留在原地</td><td>換成新的</td><td>場景裡所有指向舊 uuid 的參照都斷掉，Sprite 什麼都不畫，主控台報找不到資源</td></tr>
<tr><td>把 *.meta 加進 .gitignore</td><td>每台電腦各自產生</td><td>你的場景在同事那裡全是空的，反之亦然</td></tr>
<tr><td>兩個人各自把同一張圖加進專案</td><td>兩個不同的 uuid</td><td>合併後只會留一個 .meta，另一個人的場景參照斷掉</td></tr>
<tr><td>刪掉 library 資料夾</td><td>不變</td><td>只是要重新匯入，慢但安全</td></tr>
</table>
<div class="note"><b>團隊規則三條：</b>資源只在編輯器裡搬和改名；.meta 一律跟著資源一起 commit，review 時看到 png 沒有配對的 meta 就退回；新資源由一個人加進來、commit 之後，其他人用 pull 拿，不要各自從設計稿匯出一份。</div>

<h3><span class="badge lv2">進階</span>三、Prefab 與巢狀 Prefab：場景裡其實只存「差異」</h3>
<p>你可能以為，把一個 Prefab 拖進場景，場景檔就會把那棵節點樹完整抄一份。在 3.8 不是這樣。打開場景檔，一個 Prefab 實例的根節點幾乎是空的：</p>
<pre><code>{ "__type__": "cc.Node",
  "_parent": { "__id__": 1 },
  "_prefab": { "__id__": 8 } },
{ "__type__": "cc.PrefabInfo",
  "asset": { "__uuid__": "ccc3a755-…" },
  "instance": { "__id__": 9 } },
{ "__type__": "cc.PrefabInstance",
  "propertyOverrides": [ { "__id__": 10 } ],
  "mountedChildren": [],
  "removedComponents": [] },
{ "__type__": "CCPropertyOverrideInfo",
  "targetInfo": { "__id__": 11 },
  "propertyPath": [ "position" ],
  "value": { "__type__": "cc.Vec3",
             "x": 80, "y": 0, "z": 0 } }</code></pre>
<p>讀起來是這樣：「這裡有一個節點，它是 uuid ccc3a755 那個 Prefab 的實例；跟原版比，有一個地方不一樣：某個目標的 position 改成 (80, 0, 0)。」場景載入時，引擎先照 Prefab 資源完整建出那棵樹，再把這些<b>覆寫</b>（override）一條一條套上去。</p>
<ul>
<li><code>propertyOverrides</code>：改過的屬性。<code>targetInfo</code> 用 Prefab 內部每個節點、元件都有的 <code>fileId</code> 指出「改的是誰」；巢狀的時候會是一串 fileId，一層一層指進去。</li>
<li><code>mountedChildren</code>：你在場景裡額外掛到實例底下的節點。</li>
<li><code>removedComponents</code>：你在場景裡從實例上拿掉的元件。</li>
</ul>
<figure class="figure"><svg viewBox="0 0 680 290" class="fg" style="width:100%;max-width:680px" role="img" aria-label="三層：Card.prefab 定義牌背圖和字級，Hand.prefab 覆寫第三張牌的位置，場景覆寫第三張牌的文字顏色，最後組合成載入後的第三張牌">
<rect x="10" y="30" width="250" height="60" rx="7" class="fg-b alt"/>
<text x="135" y="54" text-anchor="middle" class="fg-t lg">Card.prefab</text>
<text x="135" y="76" text-anchor="middle" class="fg-t sm">牌背 back 圖、字級 32、白字</text>
<rect x="10" y="120" width="250" height="60" rx="7" class="fg-b"/>
<text x="135" y="144" text-anchor="middle" class="fg-t lg">Hand.prefab</text>
<text x="135" y="166" text-anchor="middle" class="fg-t sm">放 5 個 Card；覆寫第 3 張的位置</text>
<rect x="10" y="210" width="250" height="60" rx="7" class="fg-b"/>
<text x="135" y="234" text-anchor="middle" class="fg-t lg">Game.scene</text>
<text x="135" y="256" text-anchor="middle" class="fg-t sm">放 1 個 Hand；覆寫第 3 張的字色</text>
<line x1="135" y1="90" x2="135" y2="112" class="fg-l"/><polygon points="135,120 130.5,112 139.5,112" class="fg-a"/>
<line x1="135" y1="180" x2="135" y2="202" class="fg-l"/><polygon points="135,210 130.5,202 139.5,202" class="fg-a"/>
<text x="145" y="108" class="fg-t sm">被放進</text><text x="145" y="198" class="fg-t sm">被放進</text>
<text x="515" y="22" text-anchor="middle" class="fg-t">載入後的第 3 張牌</text>
<rect x="370" y="30" width="290" height="240" rx="8" class="fg-b hot"/>
<text x="386" y="58" class="fg-t">牌背 back 圖、字級 32</text><text x="386" y="78" class="fg-t sm">Card.prefab 的原版，沒人改</text>
<text x="386" y="148" class="fg-t">position (80, 0)</text><text x="386" y="168" class="fg-t sm">Hand.prefab 這一層改的</text>
<text x="386" y="238" class="fg-t">字色：金</text><text x="386" y="258" class="fg-t sm">場景這一層改的，原版是白字</text>
<line x1="262" y1="60" x2="362" y2="60" class="fg-l alt dash"/><polygon points="370,60 362,55.5 362,64.5" class="fg-a alt"/>
<line x1="262" y1="150" x2="362" y2="150" class="fg-l warm dash"/><polygon points="370,150 362,145.5 362,154.5" class="fg-a warm"/>
<line x1="262" y1="240" x2="362" y2="240" class="fg-l warm dash"/><polygon points="370,240 362,235.5 362,244.5" class="fg-a warm"/>
<text x="314" y="52" text-anchor="middle" class="fg-t sm alt">原版</text>
<text x="314" y="142" text-anchor="middle" class="fg-t sm warm">覆寫</text>
<text x="314" y="232" text-anchor="middle" class="fg-t sm warm">覆寫</text>
</svg><figcaption>最後看到的牌，是原版加上每一層的覆寫。去改 Card.prefab 的字級，全部的牌都跟著變；去改 Card.prefab 的字色，第 3 張不會變，因為場景那一層把它覆寫掉了。</figcaption></figure>
<p>這個設計有兩個你天天會碰到的後果：</p>
<ol>
<li><b>不小心產生的覆寫。</b>你在場景裡手滑拖了一下某個實例，position 就多了一筆覆寫。之後美術在 Prefab 裡調整位置，就只有這一個實例「怎麼改都不動」。看到「Prefab 改了但某些地方沒跟著變」，第一件事就是去屬性檢查器看那個實例有哪些覆寫，把不該有的還原掉。</li>
<li><b>改 Prefab 很便宜，改場景很貴。</b>因為場景只存差異，把共用的東西做成 Prefab，場景檔就小、git diff 就乾淨，多人同時改不同 Prefab 也不容易衝突。反過來，一個什麼都直接放在場景裡的大場景檔，兩個人同時改就很難合併。</li>
</ol>
<p>用 Vue 來想：Prefab 是一個元件的定義，覆寫就像在使用的地方傳 props，巢狀 Prefab 就是元件裡面再用元件。差別是 Vue 的 props 只能傳元件事先開放的那幾個，Prefab 的覆寫可以改裡面任何一個節點的任何一個序列化屬性。彈性很大，也因此很容易亂。</p>
<h4>instantiate 的成本，和物件池</h4>
<p><code>instantiate</code> 會把整棵樹的每個節點、每個元件都複製一份。一張牌如果有 30 個節點，發 52 張就是 1,560 個節點，一次做完沒問題。但如果是射擊遊戲的子彈，每秒生出幾十顆、又銷毀幾十顆，就會一直產生垃圾讓垃圾回收（garbage collection，GC）忙個不停，畫面偶爾頓一下。這時用 <code>NodePool</code>：用完的節點放回池子，下次要時先從池子拿。</p>
<pre><code>import { NodePool, Prefab, Node, instantiate } from 'cc';

const pool = new NodePool();

function spawn(prefab: Prefab): Node {
    if (pool.size() &gt; 0) return pool.get()!;
    return instantiate(prefab);
}

function recycle(bullet: Node) {
    // removed from its parent, but still alive
    pool.put(bullet);
}</code></pre>
<p><code>put</code> 只是把節點從父節點拿下來、存進陣列，節點還活著，所以池子要有上限，換場景時記得 <code>clear()</code>。</p>

<h3><span class="badge lv2">進階</span>四、載入管線：一個 loading 畫面的時間軸</h3>
<p>玩家按下「商店」，到商店出現在畫面上，中間發生了什麼？以一個放在 <code>shop</code> bundle 裡的 <code>ShopPanel</code> Prefab 為例：</p>
<ol>
<li><b>loadBundle('shop')</b>：下載這個包的 config 和腳本。拿到 config 之後，引擎才知道「ShopPanel 這個路徑對應哪個 uuid」。</li>
<li><b>bundle.load('ShopPanel', Prefab)</b>：下載 Prefab 的 JSON，解析它。<b>解析完才知道它還需要什麼</b>：背景圖、圖集、字型、音效。</li>
<li><b>下載相依資源</b>：引擎的下載器預設最多同時開 15 個請求；建置後的版本失敗會自動重試 3 次，每次間隔 2 秒（預覽時不重試）。</li>
<li><b>解析與初始化</b>：圖片解碼、建立貼圖並上傳到 GPU。這一步在主執行緒上，大圖會讓那一格明顯變長。</li>
<li><b>回呼</b>：你拿到 Prefab，<code>instantiate</code>、<code>addChild</code>，各元件的 <code>onLoad</code> 跑起來，下一格畫面上才看得到。</li>
</ol>
<figure class="figure"><svg viewBox="0 22 680 226" class="fg" style="width:100%;max-width:680px" role="img" aria-label="loading 時間軸：bundle 設定與腳本、Prefab JSON、下載相依資源、解碼與上傳 GPU、實例化，總共約 1300 毫秒">
<text x="10" y="49" class="fg-t sm">1 bundle</text>
<text x="10" y="81" class="fg-t sm">2 Prefab</text>
<text x="10" y="113" class="fg-t sm">3 相依資源</text>
<text x="10" y="145" class="fg-t sm">4 解碼上傳</text>
<text x="10" y="177" class="fg-t sm">5 實例化</text>
<rect x="130" y="34" width="68" height="22" rx="4" class="fg-b alt"/><text x="206" y="49" class="fg-t sm">loadBundle：config 和腳本</text>
<rect x="198" y="66" width="53" height="22" rx="4" class="fg-b alt"/><text x="259" y="81" class="fg-t sm">Prefab 的 JSON，解析後才知道相依</text>
<rect x="251" y="98" width="295" height="22" rx="4" class="fg-b alt"/><text x="398" y="113" text-anchor="middle" class="fg-t sm">下載 12 個相依檔案（同時最多 15 個）</text>
<rect x="546" y="130" width="57" height="22" rx="4" class="fg-b warm"/><text x="611" y="145" class="fg-t sm warm">主執行緒忙</text>
<rect x="603" y="162" width="19" height="22" rx="4" class="fg-b hot"/><text x="630" y="177" class="fg-t sm acc">出現</text>
<line x1="130" y1="200" x2="650" y2="200" class="fg-l dim"/><polygon points="658,200 650,195.5 650,204.5" class="fg-a"/>
<line x1="130" y1="196" x2="130" y2="204" class="fg-l"/><line x1="281" y1="196" x2="281" y2="204" class="fg-l"/><line x1="433" y1="196" x2="433" y2="204" class="fg-l"/><line x1="584" y1="196" x2="584" y2="204" class="fg-l"/>
<text x="130" y="218" text-anchor="middle" class="fg-t sm">0</text><text x="281" y="218" text-anchor="middle" class="fg-t sm">400</text><text x="433" y="218" text-anchor="middle" class="fg-t sm">800</text><text x="584" y="218" text-anchor="middle" class="fg-t sm">1200 ms</text>
<text x="130" y="240" class="fg-t sm">數字是示意，4G 網路上常見的量級。第 2 段結束時，進度的總數從 1 變成 13。</text>
</svg><figcaption>最長的一段通常是第 3 段，但讓畫面「卡一下」的是第 4 段：解碼和上傳 GPU 都在主執行緒上。</figcaption></figure>
<h4>進度條為什麼會倒退</h4>
<p>引擎的進度回呼給你 <code>(finished, total)</code>。問題是 <code>total</code> 不是一開始就知道的：第 2 段解析完 Prefab，才發現它還有 12 個相依資源，原始碼裡就是 <code>progress.total += depends.length</code>。所以進度會從 1/1（100%）突然變成 1/13（8%），進度條往回跳。修法很簡單，只讓它往前走：</p>
<pre><code>import {
    assetManager, Prefab, Node, ProgressBar, instantiate,
} from 'cc';

function openShop(parent: Node, bar: ProgressBar) {
    let shown = 0;
    assetManager.loadBundle('shop', (err, bundle) =&gt; {
        if (err) { console.error(err); return; }
        bundle.load('ShopPanel', Prefab,
            (finished, total) =&gt; {
                // total grows as dependencies are found
                shown = Math.max(shown, finished / total);
                bar.progress = shown;
            },
            (err2, prefab) =&gt; {
                if (err2) { console.error(err2); return; }
                parent.addChild(instantiate(prefab));
            });
    });
}</code></pre>
<h4>把等待藏起來：預先載入</h4>
<p>玩家停在主選單時網路是閒的。這時呼叫 <code>bundle.preload('ShopPanel', Prefab)</code>，3.8 的預先載入只把檔案下載下來（為了找出相依資源，會順便讀一下 JSON），不建立資源物件、不建立貼圖、不上傳 GPU，所以不太佔記憶體，也不卡畫面。等玩家真的按下商店，<code>load</code> 只剩第 4、5 段，等待從一秒多縮到兩三百毫秒。場景也一樣，用 <code>director.preloadScene</code>。</p>
<p>上一課提過 <code>resources</code> 裡的東西不管有沒有用到都會打包。這裡再補一個原因：<code>resources</code> 的 config 要列出裡面每一個資源的路徑，包越大，第 1 段要下載的 config 也越大。只有真的要用路徑動態載入的東西才放進去。</p>

<h3><span class="badge lv3">專業</span>五、參照計數：誰在數、什麼時候會被釋放</h3>
<p>先講清楚一件很多人搞錯的事：<b>引擎只數「資源和資源之間」的參照，不數你的程式碼和節點</b>。規則只有四條，都可以在 3.8 的原始碼裡找到：</p>
<ol>
<li>一個資源載入時，它用到的每一個資源 refCount 加 1。Prefab 用到一個 SpriteFrame，那個 SpriteFrame 就 +1；SpriteFrame 用到 Texture2D，Texture2D 也 +1。</li>
<li>你用 <code>load</code> 拿到的那個資源本身，refCount 是 0，因為沒有別的資源用它。</li>
<li>在程式裡寫 <code>sprite.spriteFrame = frame</code>，<b>refCount 不會變</b>；<code>instantiate</code> 也不會。</li>
<li>場景切換時，舊場景用到的每個資源都減 1；如果舊場景勾了 Auto Release Assets，減到 0 的就在下一格被釋放。</li>
</ol>
<figure class="figure"><svg viewBox="0 0 680 262" class="fg" style="width:100%;max-width:680px" role="img" aria-label="參照圖：主場景和 ShopPanel 都用到金幣圖示，ShopPanel 用到商店背景，背景用到一張貼圖。釋放 ShopPanel 後，背景和貼圖的參照數降到 0 被釋放，金幣圖示降到 1 留下">
<text x="340" y="20" text-anchor="middle" class="fg-t sm">箭頭＝「我用到你」。每被一個資源指到，ref 就加 1</text>
<rect x="20" y="40" width="130" height="44" rx="6" class="fg-b"/>
<text x="85" y="60" text-anchor="middle" class="fg-t">主場景</text><text x="85" y="77" text-anchor="middle" class="fg-t sm">靜態參照</text>
<rect x="20" y="160" width="130" height="44" rx="6" class="fg-b warm"/>
<text x="85" y="180" text-anchor="middle" class="fg-t">ShopPanel</text><text x="85" y="197" text-anchor="middle" class="fg-t sm">ref 0：強制釋放</text>
<rect x="270" y="40" width="160" height="44" rx="6" class="fg-b hot"/>
<text x="350" y="60" text-anchor="middle" class="fg-t">金幣圖示 C</text><text x="350" y="77" text-anchor="middle" class="fg-t sm">ref 2 → 1，留著</text>
<rect x="270" y="160" width="160" height="44" rx="6" class="fg-b warm"/>
<text x="350" y="180" text-anchor="middle" class="fg-t">商店背景 S</text><text x="350" y="197" text-anchor="middle" class="fg-t sm">ref 1 → 0，釋放</text>
<rect x="500" y="160" width="160" height="44" rx="6" class="fg-b warm"/>
<text x="580" y="180" text-anchor="middle" class="fg-t">Texture2D T</text><text x="580" y="197" text-anchor="middle" class="fg-t sm">ref 1 → 0，釋放</text>
<text x="450" y="58" class="fg-t sm">主場景還在用 C，</text><text x="450" y="76" class="fg-t sm">所以 C 不會被釋放</text>
<line x1="150" y1="54" x2="262" y2="54" class="fg-l"/><polygon points="270,54 262,49.5 262,58.5" class="fg-a"/>
<path d="M150 172 H210 V72 H262" class="fg-l"/><polygon points="270,72 262,67.5 262,76.5" class="fg-a"/>
<line x1="150" y1="190" x2="262" y2="190" class="fg-l"/><polygon points="270,190 262,185.5 262,194.5" class="fg-a"/>
<line x1="430" y1="182" x2="492" y2="182" class="fg-l"/><polygon points="500,182 492,177.5 492,186.5" class="fg-a"/>
<text x="340" y="240" text-anchor="middle" class="fg-t sm">releaseAsset(ShopPanel)：先釋放它，再沿著箭頭逐一減 1，減到 0 的跟著釋放</text>
</svg><figcaption>金幣圖示被兩個資源用到，釋放商店只讓它從 2 降到 1，所以留著。背景和它的貼圖只有商店在用，降到 0 就一起走了。</figcaption></figure>
<p>用這張圖追一次：</p>
<table>
<tr><th>時間點</th><th>商店 P</th><th>背景 S</th><th>貼圖 T</th><th>金幣 C</th></tr>
<tr><td>主場景載入完</td><td>—</td><td>—</td><td>—</td><td>1</td></tr>
<tr><td>商店 Prefab 載入完</td><td>0</td><td>1</td><td>1</td><td>2</td></tr>
<tr><td>實例化並顯示</td><td>0</td><td>1</td><td>1</td><td>2</td></tr>
<tr><td><code>releaseAsset(P)</code></td><td>釋放</td><td>0 釋放</td><td>0 釋放</td><td>1</td></tr>
</table>
<p>第三列和第四列之間藏著一個大坑：<b>商店面板還開在畫面上時就釋放 Prefab</b>，背景和貼圖會被銷毀，面板上那張背景就變成一片空白或報錯。因為實例化出來的節點不會替資源加 refCount，引擎根本不知道有人還在用。正確順序是：先 <code>destroy()</code> 面板節點，再釋放資源。</p>
<h4>強制釋放和「試著釋放」</h4>
<ul>
<li><code>assetManager.releaseAsset(asset)</code> 是<b>強制</b>的：不管它自己的 refCount 是多少，馬上釋放；然後對它的相依資源逐一減 1，減到 0 的才跟著釋放。</li>
<li><code>asset.decRef()</code>（預設會自動釋放）和 <code>assetManager.releaseUnusedAssets()</code> 是<b>試著釋放</b>：排到下一格才處理，而且只放掉 refCount 為 0、或者只剩彼此循環參照的資源。</li>
</ul>
<h4>你自己持有的資源，就自己加計數</h4>
<p>規則 3 的意思是：只要你把動態載入的資源存起來用，引擎就看不到你。最穩的做法是讓每個面板自己記帳：</p>
<pre><code>import { _decorator, Component, Asset } from 'cc';
const { ccclass } = _decorator;

@ccclass('PanelAssets')
export class PanelAssets extends Component {
    private held: Asset[] = [];

    hold&lt;T extends Asset&gt;(asset: T): T {
        asset.addRef();          // "this panel is using it"
        this.held.push(asset);
        return asset;
    }

    onDestroy() {
        // decRef: freed on the next frame if it reaches 0
        for (const a of this.held) a.decRef();
        this.held.length = 0;
    }
}</code></pre>
<p>載入完就 <code>this.assets.hold(frame)</code>，面板銷毀時自動還回去。如果別的面板也 hold 了同一張圖，refCount 是 2，一個面板關掉只會降到 1，不會誤刪。</p>

<h3><span class="badge lv3">專業</span>六、貼圖記憶體的算術</h3>
<p>上一課講過一張 2048 × 2048 的圖在記憶體裡是 16 MB。這裡把整張表攤開。GPU 記憶體只跟<b>像素數和格式</b>有關，跟 PNG 檔案多大無關：</p>
<table>
<tr><th>格式</th><th>每像素</th><th>2048 × 2048</th><th>1024 × 1024</th><th>說明</th></tr>
<tr><td>RGBA8888</td><td>4 位元組</td><td>16 MB</td><td>4 MB</td><td>PNG 載入後的預設</td></tr>
<tr><td>RGB565、RGBA4444</td><td>2 位元組</td><td>8 MB</td><td>2 MB</td><td>省一半，但顏色會有色階</td></tr>
<tr><td>ETC2（不透明）</td><td>0.5 位元組</td><td>2 MB</td><td>0.5 MB</td><td>GPU 直接讀的壓縮格式</td></tr>
<tr><td>ETC2（含透明）、ASTC 4×4</td><td>1 位元組</td><td>4 MB</td><td>1 MB</td><td>品質好</td></tr>
<tr><td>ASTC 6×6</td><td>約 0.44 位元組</td><td>約 1.8 MB</td><td>約 0.45 MB</td><td>常見的折衷</td></tr>
<tr><td>ASTC 8×8</td><td>0.25 位元組</td><td>1 MB</td><td>0.25 MB</td><td>省很多，細節會糊</td></tr>
</table>
<p>ASTC 的算法很好記：每一塊固定是 16 個位元組，4×4 就是 16 個像素分 16 位元組，6×6 是 36 個像素分 16 位元組。這些<b>壓縮貼圖</b>（compressed texture）跟 PNG、JPG 不一樣：PNG 只在檔案裡是壓縮的，載入時要解開成 RGBA8888 才能交給 GPU；壓縮貼圖是 GPU 直接就能讀的格式，記憶體裡就是那麼小。代價是有損，漸層容易出現色塊，而且要看 GPU 和瀏覽器支不支援。Cocos 可以在貼圖的壓縮設定裡替每個平台各列幾種格式，執行時挑裝置支援的那一種，都不支援就退回 PNG。</p>
<p><b>Mipmap 要多付三分之一。</b>每一層是上一層的四分之一：1 + 1/4 + 1/16 + … 加起來是 4/3。一張 16 MB 的圖開了 mipmap 就是 21.3 MB。UI 圖通常不需要，記得關。</p>
<h4>算一個主畫面</h4>
<table>
<tr><th>資源</th><th>尺寸</th><th>RGBA8888</th><th>改用 ASTC 6×6</th></tr>
<tr><td>背景</td><td>1080 × 1920</td><td>7.9 MB</td><td>0.88 MB</td></tr>
<tr><td>牌面圖集</td><td>2048 × 2048</td><td>16 MB</td><td>1.78 MB</td></tr>
<tr><td>UI 圖集</td><td>2048 × 1024</td><td>8 MB</td><td>0.89 MB</td></tr>
<tr><td>點陣字型</td><td>1024 × 1024</td><td>4 MB</td><td>4 MB（文字保留原格式）</td></tr>
<tr><td><b>合計</b></td><td></td><td><b>35.9 MB</b></td><td><b>約 7.6 MB</b></td></tr>
</table>
<p>如果全部不小心開了 mipmap，左邊那欄會變成 47.9 MB。這還只是貼圖，還沒算 JavaScript 物件、音效解碼後的資料、瀏覽器自己的開銷。中低階手機留給一個網頁遊戲的記憶體，常常只有幾百 MB 的量級，超過了系統就直接把分頁或 App 關掉，連錯誤訊息都沒有。</p>
<p>還有一個容易忽略的點：<b>圖集是整張一起載入的</b>。你只想在結算畫面用一個小圖示，但它跟其他 200 個圖示拼在同一張 2048 的圖集裡，載入它就是載入整張 16 MB。圖集要依「哪些東西會同時出現在畫面上」來分，不是依「美術是誰畫的」來分。</p>

<h3><span class="badge lv3">專業</span>七、圖集與合批：繪製呼叫是怎麼被打斷的</h3>
<p>每一次<b>繪製呼叫</b>（draw call），就是 CPU 對 GPU 說一次「用這張貼圖、這種材質，把這些三角形畫出來」。呼叫本身有固定成本，手機上通常希望一個畫面維持在幾十次以內。3.8 的 2D 渲染器會照節點樹的順序一個一個走，<b>只要連續幾個東西的貼圖、材質、混合方式和模板狀態（stencil）都一樣，就把它們合成同一批</b>（batching）；只要有一個不一樣，就得結束這一批、開下一批。</p>
<p>看一個很常見的排行榜列表。每一列是：圖示（圖集 A）、名字（Label）、徽章（圖集 A）。</p>
<figure class="figure"><svg viewBox="0 0 680 225" class="fg" style="width:100%;max-width:680px" role="img" aria-label="上排：圖、字、圖交錯排列，三列就切成七批；下排：所有圖放一層、所有字放一層，只要兩批">
<text x="20" y="30" class="fg-t sm">原本的順序：每一列是 圖示、名字、徽章（畫了 3 列）</text>
<rect x="20" y="40" width="50" height="34" rx="5" class="fg-b alt"/><text x="45" y="62" text-anchor="middle" class="fg-t">圖</text>
<rect x="76" y="40" width="50" height="34" rx="5" class="fg-b warm"/><text x="101" y="62" text-anchor="middle" class="fg-t">字</text>
<rect x="132" y="40" width="50" height="34" rx="5" class="fg-b alt"/><text x="157" y="62" text-anchor="middle" class="fg-t">圖</text>
<rect x="188" y="40" width="50" height="34" rx="5" class="fg-b alt"/><text x="213" y="62" text-anchor="middle" class="fg-t">圖</text>
<rect x="244" y="40" width="50" height="34" rx="5" class="fg-b warm"/><text x="269" y="62" text-anchor="middle" class="fg-t">字</text>
<rect x="300" y="40" width="50" height="34" rx="5" class="fg-b alt"/><text x="325" y="62" text-anchor="middle" class="fg-t">圖</text>
<rect x="356" y="40" width="50" height="34" rx="5" class="fg-b alt"/><text x="381" y="62" text-anchor="middle" class="fg-t">圖</text>
<rect x="412" y="40" width="50" height="34" rx="5" class="fg-b warm"/><text x="437" y="62" text-anchor="middle" class="fg-t">字</text>
<rect x="468" y="40" width="50" height="34" rx="5" class="fg-b alt"/><text x="493" y="62" text-anchor="middle" class="fg-t">圖</text>
<path d="M20 80 V86 H70 V80" class="fg-l"/><path d="M76 80 V86 H126 V80" class="fg-l"/><path d="M132 80 V86 H238 V80" class="fg-l"/><path d="M244 80 V86 H294 V80" class="fg-l"/><path d="M300 80 V86 H406 V80" class="fg-l"/><path d="M412 80 V86 H462 V80" class="fg-l"/><path d="M468 80 V86 H518 V80" class="fg-l"/>
<text x="45" y="102" text-anchor="middle" class="fg-t sm">1</text><text x="101" y="102" text-anchor="middle" class="fg-t sm">2</text><text x="185" y="102" text-anchor="middle" class="fg-t sm">3</text><text x="269" y="102" text-anchor="middle" class="fg-t sm">4</text><text x="353" y="102" text-anchor="middle" class="fg-t sm">5</text><text x="437" y="102" text-anchor="middle" class="fg-t sm">6</text><text x="493" y="102" text-anchor="middle" class="fg-t sm">7</text>
<text x="600" y="64" text-anchor="middle" class="fg-t lg warm">7 批</text>
<text x="20" y="135" class="fg-t sm">改成分層：所有圖放在一個節點底下，所有字放在另一個</text>
<rect x="20" y="145" width="50" height="34" rx="5" class="fg-b alt"/><text x="45" y="167" text-anchor="middle" class="fg-t">圖</text>
<rect x="76" y="145" width="50" height="34" rx="5" class="fg-b alt"/><text x="101" y="167" text-anchor="middle" class="fg-t">圖</text>
<rect x="132" y="145" width="50" height="34" rx="5" class="fg-b alt"/><text x="157" y="167" text-anchor="middle" class="fg-t">圖</text>
<rect x="188" y="145" width="50" height="34" rx="5" class="fg-b alt"/><text x="213" y="167" text-anchor="middle" class="fg-t">圖</text>
<rect x="244" y="145" width="50" height="34" rx="5" class="fg-b alt"/><text x="269" y="167" text-anchor="middle" class="fg-t">圖</text>
<rect x="300" y="145" width="50" height="34" rx="5" class="fg-b alt"/><text x="325" y="167" text-anchor="middle" class="fg-t">圖</text>
<rect x="356" y="145" width="50" height="34" rx="5" class="fg-b warm"/><text x="381" y="167" text-anchor="middle" class="fg-t">字</text>
<rect x="412" y="145" width="50" height="34" rx="5" class="fg-b warm"/><text x="437" y="167" text-anchor="middle" class="fg-t">字</text>
<rect x="468" y="145" width="50" height="34" rx="5" class="fg-b warm"/><text x="493" y="167" text-anchor="middle" class="fg-t">字</text>
<path d="M20 185 V191 H350 V185" class="fg-l on"/><path d="M356 185 V191 H518 V185" class="fg-l on"/>
<text x="185" y="207" text-anchor="middle" class="fg-t sm acc">1</text><text x="437" y="207" text-anchor="middle" class="fg-t sm acc">2</text>
<text x="600" y="169" text-anchor="middle" class="fg-t lg acc">2 批</text>
</svg><figcaption>同樣 9 個東西，只是畫的順序不同。上排每遇到一次「圖→字」或「字→圖」就斷一批；下排相同的東西排在一起，就能合成一批。</figcaption></figure>
<p>上排 3 列就 7 批，10 列是 21 批。下排要成立還有一個前提：<b>Label 彼此之間也要能合批</b>。系統字型的 Label 預設（cacheMode 為 NONE）每一個都有自己的貼圖，10 個名字就是 10 張不同的貼圖，排在一起也合不起來。把 cacheMode 改成 CHAR，3.8 會把字元畫進一張所有 CHAR Label 共用的 1024 × 1024 字元圖集，名字們就能合成一批。代價是字元圖集滿了就沒辦法再放，適合字不多、一直在變的文字（例如分數）；BITMAP 模式則是讓每個 Label 的貼圖去參加下面說的動態合圖。</p>
<p>其他會打斷合批的東西：Mask（要改模板狀態）、Graphics、用了不同材質或不同混合模式的 sprite、還有來自不同圖集的 sprite 交錯排列。要看實際的數字，在程式裡呼叫 <code>profiler.showStats()</code>，左下角的統計會顯示每一格的繪製呼叫次數。</p>
<h4>兩種圖集，兩個時間點</h4>
<ul>
<li><b>Auto Atlas</b>：在資料夾裡建一個 Auto Atlas 設定，<b>建置時</b>才把裡面的圖拼起來。在編輯器裡預覽時用的還是一張一張的小圖，所以預覽看到的繪製呼叫數，跟正式包不一樣。要量合批效果，請量建置後的版本。</li>
<li><b>動態合圖</b>（dynamic atlas）：<b>執行時</b>把符合條件的 SpriteFrame 複製進一張 2048 × 2048 的大圖，最多開 5 張。條件是：標成 packable、線性過濾、沒開 mipmap、還沒有在別的圖集裡。依 3.8 的預設值，它在網頁平台是開的；原生和小遊戲平台預設關掉：引擎在這些平台會打開「上傳 GPU 後清掉原始圖片快取」的開關，而動態合圖需要原始圖片才能複製，就跟著停用。所以同一個專案，網頁版和原生版的繪製呼叫數也可能不一樣。另外別忘了，5 張 2048 的動態圖集全開滿，就是 80 MB。</li>
</ul>

<h3><span class="badge lv4">專家</span>八、手機上的記憶體洩漏：最常見的五種樣子</h3>
<p>洩漏的定義很簡單：<b>做完一件事回到原處，記憶體沒有回到原處</b>。開關商店五次，如果每一次都多留一截，玩二十分鐘就會被系統殺掉。</p>
<figure class="figure"><svg viewBox="0 0 640 225" class="fg" style="width:100%;max-width:640px" role="img" aria-label="兩張示意圖：正常時每次開商店記憶體上升、關掉就回到原點；洩漏時每次開關後都比上一次高一截">
<text x="170" y="24" text-anchor="middle" class="fg-t acc">正常：關掉就回到原點</text>
<text x="470" y="24" text-anchor="middle" class="fg-t warm">洩漏：每開關一次多留一截</text>
<line x1="40" y1="40" x2="40" y2="190" class="fg-l dim"/><line x1="40" y1="190" x2="300" y2="190" class="fg-l dim"/>
<line x1="340" y1="40" x2="340" y2="190" class="fg-l dim"/><line x1="340" y1="190" x2="600" y2="190" class="fg-l dim"/>
<text x="46" y="52" class="fg-t sm">記憶體</text><text x="346" y="52" class="fg-t sm">記憶體</text>
<polyline points="40,180 50,180 50,150 76,150 76,180 92,180 102,180 102,150 128,150 128,180 144,180 154,180 154,150 180,150 180,180 196,180 206,180 206,150 232,150 232,180 248,180 258,180 258,150 284,150 284,180 300,180" class="fg-l on"/>
<line x1="340" y1="180" x2="600" y2="180" class="fg-l dim dash"/>
<polyline points="340,180 350,180 350,150 376,150 376,165 392,165 402,165 402,135 428,135 428,150 444,150 454,150 454,120 480,120 480,135 496,135 506,135 506,105 532,105 532,120 548,120 558,120 558,90 584,90 584,105 600,105" class="fg-l warm"/>
<text x="170" y="210" text-anchor="middle" class="fg-t sm">開、關商店 5 次 →</text>
<text x="470" y="210" text-anchor="middle" class="fg-t sm">開、關商店 5 次 →</text>
</svg><figcaption>示意圖。判斷有沒有洩漏，不看最高點，看「回到原處之後的底線」有沒有一直往上爬。</figcaption></figure>
<ol>
<li><b>動態載入、從來不釋放。</b>參照計數的規則 2 和 4 合起來就是：動態載入的資源 refCount 是 0，它不是任何場景的相依資源，所以場景切換的自動釋放<b>管不到它</b>。用路徑載入的每一張圖，都要有人負責釋放，不然就一直留在記憶體裡。</li>
<li><b>遠端圖片的網址每次都不一樣。</b><code>assetManager.loadRemote</code> 會用網址當 key 快取，同一個網址第二次載入拿到的是同一份。但如果你的頭像網址帶了時間戳或亂數參數（例如 <code>?t=1699…</code>），每次都是新網址、新貼圖。一個 128 × 128 的頭像是 64 KB，排行榜捲一捲載了 500 個，就是 31 MB，而且永遠不會被釋放。</li>
<li><b>用程式 new 出來的貼圖。</b>你自己 <code>new Texture2D()</code>、<code>new RenderTexture()</code>，或從 ImageAsset 自己組 SpriteFrame，這些物件沒有 uuid。3.8 的原始碼裡寫得很明白：沒有 uuid 的資源，資源管理器直接跳過，不追蹤、不計數。它們一定要你自己呼叫 <code>destroy()</code>。</li>
<li><b>節點拿下來了，但沒有銷毀。</b><code>removeFromParent()</code> 之後，如果還有任何陣列、Map、單例（singleton）抓著這個節點，它和它整棵子樹、上面所有元件，都還活在記憶體裡，<code>onDestroy</code> 也永遠不會被呼叫，裡面的清理程式碼就不會跑。不打算再用的節點，就 <code>destroy()</code>。</li>
<li><b>掛在別人身上的監聽和計時器。</b>你在 <code>onLoad</code> 對一個全域的 EventTarget、<code>input</code>、或另一個長壽的節點註冊了監聽，並把 <code>this</code> 傳進去。你的節點銷毀了，但那個全域物件還抓著你的回呼，回呼又抓著你的元件，整串都回收不掉，下次事件來時還會呼叫一個已經銷毀的元件。<code>this.schedule</code> 會在元件銷毀時自動清掉，<code>setInterval</code>、<code>setTimeout</code> 不會。tween 保險起見在 <code>onDestroy</code> 裡呼叫 <code>Tween.stopAllByTarget(this.node)</code>。</li>
</ol>
<h4>怎麼抓</h4>
<ul>
<li><b>先看數字</b>：在預覽的主控台記下 <code>cc.assetManager.assets.count</code>，開關同一個面板十次，再看一次。應該回到差不多的數字；一直往上加就是有東西沒放。</li>
<li><b>列出沒人用的</b>：<code>cc.assetManager.assets.forEach(a =&gt; a.refCount === 0 &amp;&amp; console.log(cc.js.getClassName(a), a.name))</code>，看看清單裡有沒有不該留著的大圖。</li>
<li><b>堆積快照</b>：Chrome 開發者工具的 Memory 面板拍兩張快照（開關面板前後），用 Comparison 模式看哪一類物件只增不減，搜尋 Texture2D、Node 這些類別名稱。iPhone 上可以用 Mac 的 Safari 開發選單連到手機，做同樣的事。</li>
<li><b>壓力測試</b>：寫一個小腳本自動開關面板 100 次，在真機上跑，看記憶體曲線的底線。這比任何肉眼檢查都可靠。</li>
</ul>

<h3>九、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>場景用檔名找圖片</td><td>場景只記 uuid，整個場景檔裡沒有檔名。檔名改了沒關係，uuid 斷了才有事。</td></tr>
<tr><td>Prefab 實例在場景裡存了完整的一份</td><td>只存「是哪個 Prefab」加上覆寫的差異。所以改 Prefab 會影響所有實例，被覆寫的屬性除外。</td></tr>
<tr><td>instantiate 會讓資源的參照計數加 1</td><td>不會。實例化和程式裡的賦值都不計數，引擎只數資源之間的參照。</td></tr>
<tr><td>勾了 Auto Release Assets，就不用管釋放</td><td>它只處理場景的靜態相依資源。動態載入、遠端載入、程式 new 出來的，全部要自己管。</td></tr>
<tr><td>PNG 壓得越小越省記憶體</td><td>載入後都是 寬 × 高 × 4。要省記憶體得用壓縮貼圖格式、縮小尺寸，或關掉不需要的 mipmap。</td></tr>
<tr><td>預覽時的繪製呼叫數就是正式版的數字</td><td>Auto Atlas 只在建置時拼圖，動態合圖在不同平台預設值也不同。要量就量建置後的版本、在目標平台上量。</td></tr>
<tr><td>資源用完呼叫 releaseAsset 就對了</td><td>它是強制的。還有節點在用那張圖時就釋放，畫面會變空白。先銷毀節點，再釋放。</td></tr>
</table>

<h3>十、跟你的工作連起來</h3>
<ul>
<li><b>從 Vue 和網頁前端過來</b>：Asset Bundle 就是 code splitting，<code>loadBundle</code> 就是動態 <code>import()</code>；MD5 Cache 就是 Vite 打包時檔名帶的雜湊。不同的是，網頁的 JS 模組載入後通常不釋放，遊戲的貼圖動輒十幾 MB，一定要釋放。</li>
<li><b>跟後端、DevOps 的接點</b>：建置後的 bundle 通常放在 CDN 上。檔名帶雜湊的檔案可以設很長的快取時間，<code>index.html</code> 和沒帶雜湊的設定檔要設短快取或不快取，不然玩家永遠拿到舊版本。遠端 bundle 也需要正確的 CORS 標頭，否則瀏覽器會擋下載。</li>
<li><b>Code review 檢查清單</b>：有新 png 就要有對應的 .meta；有 <code>load</code> 就要找到對應的釋放或 <code>addRef</code>；有 <code>on</code> 就要找到對應的 <code>off</code>；有 <code>new Texture2D</code> 就要找到 <code>destroy</code>；新增的圖片看一下尺寸和 mipmap 設定。</li>
<li><b>Unity 的對照</b>：.meta 和 GUID 的觀念幾乎一模一樣，在檔案總管搬檔案一樣會斷參照；Prefab Variant 和覆寫的概念也類似；Addressables 對應 Asset Bundle 加參照計數。學會一邊，另一邊很快上手。</li>
</ul>

<h3>十一、面試會怎麼問</h3>
<p>先自己講一遍，最好邊講邊畫，再打開參考答案。</p>
<ol>
<li>「Cocos 專案裡的 .meta 檔是做什麼的？如果有人只 commit 了 png 沒有 commit .meta，會發生什麼？」</li>
<li>「解釋 Cocos 的資源參照計數。什麼情況會加 1？為什麼動態載入的資源常常變成洩漏？」</li>
<li>「一張 1024 × 1024 的 PNG 檔只有 150 KB，載入後大約佔多少記憶體？有哪些方法可以降低？」</li>
<li>「一個列表畫面的繪製呼叫數有 80 次。你會怎麼查、怎麼降？」</li>
<li>「玩家回報玩久了會閃退。你會怎麼找原因？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>.meta 存的是這個資源的 uuid、子資源的 uuid 和匯入設定。場景和 Prefab 只用 uuid 指向資源，不用檔名。只 commit png 的話，其他人的編輯器會把它當成新檔案，產生新的 uuid，所有指向原 uuid 的參照都會斷掉，Sprite 變空、主控台報找不到資源。所以 .meta 一定要進版本控制，資源也只在編輯器裡搬移和改名。</li>
<li>引擎只計算資源之間的參照：一個資源載入時，它的每個相依資源 refCount 加 1；釋放時沿著相依關係減 1，減到 0 的才會被釋放。程式裡的賦值和 instantiate 不計數。動態載入的資源本身 refCount 是 0，又不是場景的相依資源，所以場景切換的自動釋放管不到；如果沒有人手動 release 或用 addRef／decRef 管理，它就一直留著。我的做法是讓每個面板記錄自己載入的資源，載入時 addRef、銷毀時 decRef。</li>
<li>大約 1024 × 1024 × 4 = 4 MB，跟檔案大小無關，開 mipmap 再多三分之一。降低的方法：改用 ASTC 或 ETC2 這類 GPU 壓縮格式（ASTC 4×4 是 1 MB、6×6 約 0.45 MB）；把圖縮到實際顯示需要的尺寸；UI 圖關掉 mipmap；圖集依「同時出現」來分，避免為了一個小圖示載入整張大圖集；用完確實釋放。</li>
<li>先用 profiler 看實際數字，並確認是在建置後的版本上量的，因為 Auto Atlas 只在建置時生效。接著看節點的繪製順序：圖和 Label 交錯、不同圖集交錯、每個 Label 各自一張貼圖、Mask 和 Graphics，都會打斷合批。對策是把同一張圖集的 sprite 排在一起或放進同一層，Label 改用 CHAR 模式或點陣字型，把會同時出現的小圖放進同一張圖集，必要時考慮動態合圖。</li>
<li>先確認是不是記憶體：在真機上反覆執行同一個流程，看記憶體底線有沒有一直上升。再用資源數量（assetManager.assets.count）和堆積快照比對前後，找出只增不減的類別。常見原因有：動態載入沒釋放、遠端圖片網址帶亂數導致快取失效、程式 new 的貼圖沒 destroy、節點只 removeFromParent 沒 destroy、註冊在全域物件上的監聽沒有 off。另外也要檢查貼圖本身是否過大，例如不必要的 mipmap 或沒壓縮的大圖。</li>
</ol>
</details>

<h3>十二、練功題（做得出來才算真的懂）</h3>
<ol>
<li>打開你專案裡任意一張圖的 .meta，找出主 uuid 和兩個子資源的 uuid。再打開一個用到它的 Prefab 檔，搜尋那個 uuid，看它出現在哪個元件的哪個欄位。</li>
<li>一張 2048 × 1024 的 UI 圖集，開了 mipmap、格式是 RGBA8888。它佔多少？改成 ASTC 4×4 並關掉 mipmap 呢？</li>
<li>ShopPanel 用到背景 S 和金幣 C；主場景也用到 C。載入 ShopPanel、實例化、顯示，然後直接 <code>releaseAsset(shopPrefab)</code>，面板沒有先銷毀。畫面上會發生什麼？</li>
<li>你的 loading 畫面進度條會先衝到 100%、再掉回 10%、再慢慢爬。為什麼？怎麼修？</li>
<li>一個排行榜每一列是：頭像（遠端載入）、名字（系統字型 Label）、徽章（圖集）。列出這個畫面可能的記憶體問題和繪製呼叫問題，各給一個修法。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>主 uuid 在最外層的 <code>uuid</code>；<code>subMetas</code> 底下的 <code>@6c48a</code> 是貼圖、<code>@f9941</code> 是 SpriteFrame。在 Prefab 裡通常會在 Sprite 元件的 <code>_spriteFrame</code> 欄位找到 <code>{"__uuid__": "…@f9941"}</code>。這就是場景和資源之間唯一的連結。</li>
<li>2048 × 1024 × 4 = 8 MB，加上 mipmap 的三分之一，約 10.7 MB。ASTC 4×4 是每像素 1 位元組，2 MB，關掉 mipmap 就是 2 MB。省了超過八成。</li>
<li>Prefab 被強制釋放，接著背景 S 從 1 降到 0 被釋放，它的貼圖也跟著被釋放；金幣 C 從 2 降到 1，留著。面板節點還在畫面上，但背景的貼圖已經被銷毀，那塊會變空白或在主控台報錯。金幣圖示正常顯示。正確做法是先 destroy 面板，再 release。</li>
<li>進度回呼的 total 會隨著解析出相依資源而變大：一開始只知道 Prefab 自己（1/1），解析後才發現還有十幾個相依，比例就掉下來。修法是顯示 <code>Math.max(已顯示的值, finished / total)</code>，讓它只往前走；也可以先用 preload 把東西下載好，讓真正的 load 很快完成。</li>
<li>記憶體：頭像如果網址帶亂數或時間戳，每次都是新貼圖，而且動態載入的資源不會被場景自動釋放，要在列表回收或關閉時自己 release，並確保同一個人的頭像網址固定。繪製呼叫：頭像每張是獨立貼圖、名字每個 Label 一張貼圖，和圖集裡的徽章交錯，幾乎每個元素都斷一批。修法是 Label 改 CHAR 模式、把徽章和頭像分層排列；網頁版可以讓頭像參加動態合圖（packable、線性過濾、無 mipmap）。</li>
</ol>
</details>

<h3>十三、想再挖深</h3>
<ul>
<li><b>Cocos Creator 3.8 使用手冊</b>（<a href="https://docs.cocos.com/creator/3.8/manual/zh/">docs.cocos.com/creator/3.8/manual/zh</a>）：「資源管理」「Asset Bundle」「資源釋放」「預製體」「自動圖集」「動態合圖」「壓縮紋理」這幾章，搭配這一章的數字讀。</li>
<li><b>cocos-engine 原始碼</b>（GitHub 上的 cocos/cocos-engine，3.8 分支）：<code>cocos/asset/asset-manager/release-manager.ts</code> 不到 300 行，參照計數和強制釋放的規則全在裡面；<code>downloader.ts</code> 有並行數和重試次數；<code>cocos/2d/renderer/batcher-2d.ts</code> 是合批的判斷。</li>
<li><b>Chrome DevTools 說明文件的 Memory 章節</b>（developer.chrome.com/docs/devtools）：堆積快照、Comparison 檢視、分離的 DOM 和物件怎麼找，網頁版遊戲抓洩漏的基本功。</li>
<li><b>Khronos 的 KTX 與 ASTC 說明文件</b>（khronos.org）：GPU 壓縮貼圖格式的官方說明，想知道每種格式的區塊大小、品質取捨時查這裡。</li>
</ul>
` });
