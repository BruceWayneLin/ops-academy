DEEP({ 'db-index': `
<p>上一課你加了一個索引，同一個查詢從 80 毫秒變成 0.1 毫秒。這一章把「快了幾百倍」拆開來看：資料在磁碟上到底是一頁一頁怎麼放的、B-tree 為什麼四層就裝得下上億列、複合索引的欄位順序為什麼不能亂排、查詢規劃器憑什麼有時候「不理」你建好的索引，還有怎麼一行一行讀懂 EXPLAIN ANALYZE。最後教你在真正的系統裡，把最該修的那幾個慢查詢抓出來。主角是 PostgreSQL，MySQL 不一樣的地方會特別點出來。</p>
<p>整章沿用上一課那張一百萬列的練習表，這裡叫它 <code>rounds</code>：猜高低遊戲每玩一局就記一列，欄位是 <code>id</code>、<code>user_id</code>、<code>created_at</code>、<code>score</code>，大約 10 萬個玩家，每人十局左右。</p>

<h3><span class="badge lv1">基礎</span>一、資料真正放在哪裡：一頁一頁的「頁」</h3>
<p>先忘掉 Excel 那種表格的畫面。對 PostgreSQL 來說，一張表就是磁碟上的檔案，檔案切成一格一格固定大小的<b>頁</b>（page，也叫 block），每頁 8 KB，從 0 開始編號。每一列資料（PostgreSQL 叫它 tuple）就塞在某一頁裡面。</p>
<figure class="figure"><svg viewBox="0 0 660 300" class="fg" style="width:100%;max-width:660px" role="img" aria-label="資料表檔案由一頁一頁 8 KB 的頁組成；放大第 1 頁，可以看到頁首、往後長的行指標、中間的空白區，以及從頁尾往前放的資料列；ctid (1,3) 指向第 1 頁的第 3 格">
<text x="20" y="26" class="fg-t lg">資料表檔案</text>
<text x="20" y="44" class="fg-t sm">每頁 8 KB，從 0 開始編號</text>
<rect x="20" y="56" width="150" height="30" rx="5" class="fg-b"/><text x="95" y="76" text-anchor="middle" class="fg-t">第 0 頁</text>
<rect x="20" y="92" width="150" height="30" rx="5" class="fg-b hot"/><text x="95" y="112" text-anchor="middle" class="fg-t acc">第 1 頁</text>
<rect x="20" y="128" width="150" height="30" rx="5" class="fg-b"/><text x="95" y="148" text-anchor="middle" class="fg-t">第 2 頁</text>
<text x="95" y="178" text-anchor="middle" class="fg-t sm">⋮</text>
<rect x="20" y="188" width="150" height="30" rx="5" class="fg-b"/><text x="95" y="208" text-anchor="middle" class="fg-t">第 6,369 頁</text>
<text x="20" y="246" class="fg-t mono acc">ctid = (1, 3)</text>
<text x="20" y="266" class="fg-t sm">意思是：第 1 頁的第 3 格</text>
<text x="20" y="288" class="fg-t sm">一百萬列 ≈ 6,400 頁 ≈ 50 MB</text>
<line x1="170" y1="92" x2="230" y2="44" class="fg-l dim dash"/>
<line x1="170" y1="122" x2="230" y2="286" class="fg-l dim dash"/>
<rect x="230" y="44" width="410" height="242" rx="8" class="fg-b"/>
<text x="245" y="66" class="fg-t acc">第 1 頁裡面</text>
<rect x="245" y="76" width="380" height="26" rx="4" class="fg-b alt"/>
<text x="435" y="94" text-anchor="middle" class="fg-t sm">頁首（page header）：這一頁的基本資訊</text>
<rect x="245" y="110" width="34" height="24" rx="4" class="fg-b"/><text x="262" y="127" text-anchor="middle" class="fg-t mono">1</text>
<rect x="283" y="110" width="34" height="24" rx="4" class="fg-b"/><text x="300" y="127" text-anchor="middle" class="fg-t mono">2</text>
<rect x="321" y="110" width="34" height="24" rx="4" class="fg-b hot"/><text x="338" y="127" text-anchor="middle" class="fg-t mono acc">3</text>
<rect x="359" y="110" width="34" height="24" rx="4" class="fg-b"/><text x="376" y="127" text-anchor="middle" class="fg-t mono">…</text>
<text x="405" y="126" class="fg-t sm">行指標（line pointer），往後長 →</text>
<rect x="245" y="142" width="380" height="44" rx="4" class="fg-b dash"/>
<text x="490" y="168" text-anchor="middle" class="fg-t sm">空白區（free space）</text>
<line x1="338" y1="134" x2="338" y2="186" class="fg-l on"/><polygon points="338,194 333.5,186 342.5,186" class="fg-a on"/>
<rect x="245" y="194" width="380" height="24" rx="4" class="fg-b hot"/><text x="257" y="211" class="fg-t sm mono">第 3 格：id=160 user_id=907 …</text>
<rect x="245" y="222" width="380" height="24" rx="4" class="fg-b"/><text x="257" y="239" class="fg-t sm mono">第 2 格：id=159 user_id=48213 …</text>
<rect x="245" y="250" width="380" height="24" rx="4" class="fg-b"/><text x="257" y="267" class="fg-t sm mono">第 1 格：id=158 user_id=61550 …</text>
<text x="613" y="239" text-anchor="end" class="fg-t sm">← 從頁尾往前放</text>
</svg><figcaption>一頁裡，行指標從前面往後長，資料列從頁尾往前放，兩邊在中間碰頭時這頁就滿了。一列的地址只要兩個數字：第幾頁、第幾格。</figcaption></figure>
<p>打個比方：倉庫裡有 6,400 個編了號的紙箱，每箱裝 150 張卡片。沒有目錄，要找某個玩家的卡片，只能一箱一箱打開來翻。索引就是那本目錄。</p>
<p>一頁裡的排法很聰明：前面是一小段頁首，接著是一排<b>行指標</b>（line pointer），每個指標記著「第幾格的資料從這頁的哪個位置開始」；真正的資料列從頁尾往前放。所以一列的地址就是「第幾頁、第幾格」，PostgreSQL 叫它 <code>ctid</code>，你可以直接看：</p>
<pre><code>SELECT ctid, id, user_id FROM rounds LIMIT 3;
 ctid  | id | user_id
-------+----+---------
 (0,1) |  1 |   48213
 (0,2) |  2 |     907
 (0,3) |  3 |   61550</code></pre>
<p>這一章最重要的一句話：<b>資料庫從來不會只讀「一列」，它一次讀一整頁。</b>要拿第 1 頁第 3 格那一列，就得把整個 8 KB 的第 1 頁搬進記憶體。所以談查詢快慢，真正的單位是「讀了幾頁」，不是「看了幾列」。</p>
<p>算一下這張練習表：每列的資料本身 20 位元組（三個 4 位元組的整數加一個 8 位元組的時間），加上每列 24 位元組的標頭和 4 位元組的行指標，一頁大約放 150 列。一百萬列就是大約 6,400 頁、50 MB。沒有索引時，找 <code>user_id = 42</code> 的那十幾列，就得把 6,400 頁全部讀過，這就是全表掃描（full scan，計畫裡叫 <code>Seq Scan</code>）。</p>
<p>讀過的頁會留在 PostgreSQL 自己的快取（<code>shared_buffers</code>），再往下還有作業系統的檔案快取。所以「讀一頁」可能是不到一微秒的記憶體存取，也可能是一次 SSD 讀取（幾十到幾百微秒），雲端的網路磁碟常常要 1 毫秒上下。這些是典型的數量級，差距是幾百到上千倍。後面 EXPLAIN 裡的 <code>shared hit</code> 和 <code>read</code>，就是在告訴你是哪一種。</p>
<h4>MySQL 不一樣：表本身就是一棵樹</h4>
<p>MySQL 的 InnoDB 一頁是 16 KB，而且資料列不是隨便放：整張表本身就是一棵照主鍵排好的 B-tree，資料列直接住在這棵樹的葉頁裡，這叫<b>叢集索引</b>（clustered index）。其他的<b>次要索引</b>（secondary index）葉頁裡放的不是實體地址，而是主鍵的值。所以用次要索引找資料要走兩棵樹：先在次要索引找到主鍵，再拿主鍵去叢集索引找整列。</p>
<p>這會直接影響設計：在 InnoDB，主鍵越長，每個次要索引就跟著越肥；主鍵如果是隨機的 UUID，每次新增都會插進整張表的隨機位置。PostgreSQL 的表則是一堆沒有順序的頁（叫 heap），連主鍵索引也只是「另一個索引」，裡面存的是 ctid。</p>

<h3><span class="badge lv1">基礎</span>二、B-tree：一棟有樓層指引的大樓</h3>
<p>想像一棟很大的辦公大樓。大廳的樓層指引寫著「A 到 F 開頭的公司在 1 到 10 樓」；到了 5 樓，電梯口再寫「Da 到 Dk 在 503 室」；走進 503 室，門上就列著每家公司的座位。你只看了三塊牌子，就從幾萬家公司裡找到一家。B-tree 就是這樣一層一層縮小範圍：</p>
<figure class="figure"><svg viewBox="0 0 680 340" class="fg" style="width:100%;max-width:680px" role="img" aria-label="三層的 B-tree：根頁依分界值分到內部頁，內部頁再分到葉頁；找 42 時走最左邊那條路，葉頁裡找到 ctid (12,7)，最後讀資料表第 12 頁；葉頁之間左右相連">
<text x="12" y="48" class="fg-t sm">第 1 層</text>
<text x="12" y="138" class="fg-t sm">第 2 層</text>
<text x="12" y="230" class="fg-t sm">第 3 層</text>
<text x="12" y="309" class="fg-t sm">資料表</text>
<rect x="275" y="20" width="200" height="48" rx="6" class="fg-b hot"/>
<text x="375" y="40" text-anchor="middle" class="fg-t acc">根頁（root）</text>
<text x="375" y="58" text-anchor="middle" class="fg-t sm mono">30000 · 60000</text>
<path d="M330 68 V90 H185 V102" class="fg-l on"/><polygon points="185,110 180.5,102 189.5,102" class="fg-a on"/>
<text x="258" y="84" text-anchor="middle" class="fg-t sm acc">42 &lt; 30000</text>
<path d="M375 68 V110" class="fg-l dim"/>
<path d="M420 68 V90 H565 V110" class="fg-l dim"/>
<rect x="100" y="110" width="170" height="48" rx="6" class="fg-b hot"/>
<text x="185" y="130" text-anchor="middle" class="fg-t">內部頁</text>
<text x="185" y="148" text-anchor="middle" class="fg-t sm mono">300 · 600 · …</text>
<rect x="290" y="110" width="170" height="48" rx="6" class="fg-b"/>
<text x="375" y="130" text-anchor="middle" class="fg-t">內部頁</text>
<text x="375" y="148" text-anchor="middle" class="fg-t sm mono">30300 · …</text>
<rect x="480" y="110" width="170" height="48" rx="6" class="fg-b"/>
<text x="565" y="130" text-anchor="middle" class="fg-t">內部頁</text>
<text x="565" y="148" text-anchor="middle" class="fg-t sm mono">60300 · …</text>
<path d="M165 158 V178 H146 V192" class="fg-l on"/><polygon points="146,200 141.5,192 150.5,192" class="fg-a on"/>
<text x="138" y="190" text-anchor="end" class="fg-t sm acc">42 &lt; 300</text>
<path d="M205 158 V178 H260 V200" class="fg-l dim"/>
<path d="M375 158 V200" class="fg-l dim"/>
<path d="M410 158 V178 H488 V200" class="fg-l dim"/>
<path d="M602 158 V200" class="fg-l dim"/>
<rect x="96" y="200" width="100" height="50" rx="5" class="fg-b hot"/>
<text x="146" y="220" text-anchor="middle" class="fg-t sm mono">1 … 299</text>
<text x="146" y="238" text-anchor="middle" class="fg-t sm mono acc">42 → (12,7)</text>
<rect x="210" y="200" width="100" height="50" rx="5" class="fg-b"/>
<text x="260" y="220" text-anchor="middle" class="fg-t sm mono">300 … 599</text>
<text x="260" y="238" text-anchor="middle" class="fg-t sm">鍵 → ctid</text>
<rect x="324" y="200" width="100" height="50" rx="5" class="fg-b"/>
<text x="374" y="220" text-anchor="middle" class="fg-t sm mono">30000 …</text>
<text x="374" y="238" text-anchor="middle" class="fg-t sm">鍵 → ctid</text>
<rect x="438" y="200" width="100" height="50" rx="5" class="fg-b"/>
<text x="488" y="220" text-anchor="middle" class="fg-t sm mono">30300 …</text>
<text x="488" y="238" text-anchor="middle" class="fg-t sm">鍵 → ctid</text>
<rect x="552" y="200" width="100" height="50" rx="5" class="fg-b"/>
<text x="602" y="220" text-anchor="middle" class="fg-t sm mono">60000 …</text>
<text x="602" y="238" text-anchor="middle" class="fg-t sm">鍵 → ctid</text>
<line x1="196" y1="225" x2="210" y2="225" class="fg-l alt"/>
<line x1="310" y1="225" x2="324" y2="225" class="fg-l alt"/>
<line x1="424" y1="225" x2="438" y2="225" class="fg-l alt"/>
<line x1="538" y1="225" x2="552" y2="225" class="fg-l alt"/>
<text x="290" y="272" class="fg-t sm alt">葉頁左右相連：範圍查詢找到起點後，往右一路讀</text>
<line x1="146" y1="250" x2="146" y2="280" class="fg-l on"/><polygon points="146,288 141.5,280 150.5,280" class="fg-a on"/>
<rect x="71" y="288" width="150" height="36" rx="6" class="fg-b alt"/>
<text x="146" y="311" text-anchor="middle" class="fg-t">資料表第 12 頁</text>
<text x="240" y="311" class="fg-t sm">找 42：根 → 內部頁 → 葉頁 → 資料表，一共讀 4 頁</text>
</svg><figcaption>示意圖（只畫三層，數字是舉例）。每一層讀一頁，沿著一條路往下走，不必左右翻找。葉頁之間串成一條鏈，所以範圍和排序都順便解決了。</figcaption></figure>
<ul>
<li><b>根頁</b>（root）：最上面那一頁，裡面是幾個「分界值」和指向下一層的頁碼。</li>
<li><b>內部頁</b>（internal page）：一樣是分界值加頁碼，只是範圍更細。</li>
<li><b>葉頁</b>（leaf page）：最底層，存著真正的鍵和它對應的 ctid，照鍵排好。葉頁之間左右相連，所以 <code>BETWEEN</code>、<code>&gt;</code>、<code>ORDER BY</code> 這種範圍查詢，找到起點之後只要往旁邊一路讀下去。</li>
</ul>
<p>B 通常被解釋成 balanced（平衡）：不管找哪個鍵，從根走到葉的層數都一樣。新增資料讓某個葉頁滿了，它就<b>分裂</b>（page split）成兩頁，把一個新的分界值往上交給父頁；父頁也滿了就繼續往上分裂，一路分到根，樹就長高一層。B-tree 是從上面長高的，所以永遠平衡，不會有哪一邊特別深。</p>

<h3><span class="badge lv2">進階</span>三、扇出與高度：為什麼四層就裝得下上億列</h3>
<p>二元搜尋樹每個節點只分兩路，一百萬筆要走 20 層，每層如果都是一次磁碟讀取就完了。B-tree 的關鍵在於：<b>一頁就是一個節點，一頁 8 KB 可以塞好幾百個鍵</b>。每個節點能分出去幾路，叫<b>扇出</b>（fan-out）。</p>
<p>算一個 <code>bigint</code> 欄位的索引：每個項目是 8 位元組的項目標頭加 8 位元組的鍵，再加 4 位元組的行指標，一共大約 20 位元組。8 KB ÷ 20 ≈ 400，扣掉預留的空位，一頁實際放 300 多個。用整數 300 來算：</p>
<table>
<tr><th>層數</th><th>扇出 300（整數鍵）</th><th>扇出 100（比較寬的鍵，例如長字串）</th></tr>
<tr><td>1</td><td>300</td><td>100</td></tr>
<tr><td>2</td><td>9 萬</td><td>1 萬</td></tr>
<tr><td>3</td><td>2,700 萬</td><td>100 萬</td></tr>
<tr><td>4</td><td>81 億</td><td>1 億</td></tr>
</table>
<p>每多一層，容量就乘以扇出。資料從一百萬列長到一億列，樹只多一層，這就是「對數成長」最具體的樣子。實際算一億列的 <code>bigint</code> 索引：葉頁大約 27 萬頁（2 GB 多），上一層大約一千頁，再上一層只剩幾頁，最上面是根，一共 4 層。</p>
<p>更妙的是：上面三層加起來才一千頁左右、大約 8 MB，幾乎一定一直待在記憶體裡。所以在一億列裡找一列，真正可能要碰磁碟的只有兩頁：一個葉頁、一個資料表的頁。這就是上一課說「大約四步」的真正意思。</p>
<p>想親眼看樹有幾層，可以用 <code>pageinspect</code> 擴充套件（要超級使用者權限）：</p>
<pre><code>CREATE EXTENSION pageinspect;
SELECT level FROM bt_metap('rounds_user_time');
-- level 是根所在的層號，葉頁算第 0 層。
-- 一百萬列的這個索引通常是 level = 2，也就是一共 3 層。</code></pre>

<h3><span class="badge lv2">進階</span>四、複合索引與最左前綴規則</h3>
<p><b>複合索引</b>（composite index）<code>(user_id, created_at DESC)</code> 在葉頁裡就是一長串排好的項目：先照 <code>user_id</code> 由小到大，同一個 <code>user_id</code> 裡面再照時間由新到舊。把它想成一條長長的紙帶，規則就很明顯：</p>
<figure class="figure"><svg viewBox="0 0 660 250" class="fg" style="width:100%;max-width:660px" role="img" aria-label="同一條索引紙帶畫兩次：查 user_id = 42 時符合的三格連在一起；查 created_at 大於等於 11-05 時，符合的五格散在各個使用者裡">
<text x="20" y="38" class="fg-t sm acc">WHERE user_id = 42：連在一起的一段，讀完 3 格就停</text>
<rect x="20" y="50" width="74" height="44" rx="5" class="fg-b"/><text x="57" y="68" text-anchor="middle" class="fg-t mono">u=41</text><text x="57" y="86" text-anchor="middle" class="fg-t sm mono">11-08</text>
<rect x="98" y="50" width="74" height="44" rx="5" class="fg-b"/><text x="135" y="68" text-anchor="middle" class="fg-t mono">u=41</text><text x="135" y="86" text-anchor="middle" class="fg-t sm mono">11-02</text>
<rect x="176" y="50" width="74" height="44" rx="5" class="fg-b hot"/><text x="213" y="68" text-anchor="middle" class="fg-t mono acc">u=42</text><text x="213" y="86" text-anchor="middle" class="fg-t sm mono">11-09</text>
<rect x="254" y="50" width="74" height="44" rx="5" class="fg-b hot"/><text x="291" y="68" text-anchor="middle" class="fg-t mono acc">u=42</text><text x="291" y="86" text-anchor="middle" class="fg-t sm mono">11-05</text>
<rect x="332" y="50" width="74" height="44" rx="5" class="fg-b hot"/><text x="369" y="68" text-anchor="middle" class="fg-t mono acc">u=42</text><text x="369" y="86" text-anchor="middle" class="fg-t sm mono">10-30</text>
<rect x="410" y="50" width="74" height="44" rx="5" class="fg-b"/><text x="447" y="68" text-anchor="middle" class="fg-t mono">u=43</text><text x="447" y="86" text-anchor="middle" class="fg-t sm mono">11-09</text>
<rect x="488" y="50" width="74" height="44" rx="5" class="fg-b"/><text x="525" y="68" text-anchor="middle" class="fg-t mono">u=43</text><text x="525" y="86" text-anchor="middle" class="fg-t sm mono">11-01</text>
<rect x="566" y="50" width="74" height="44" rx="5" class="fg-b"/><text x="603" y="68" text-anchor="middle" class="fg-t mono">u=44</text><text x="603" y="86" text-anchor="middle" class="fg-t sm mono">11-06</text>
<path d="M176 102 V108 H406 V102" class="fg-l on"/>
<text x="291" y="124" text-anchor="middle" class="fg-t sm acc">一次定位，往右讀到不是 42 就停</text>
<text x="20" y="150" class="fg-t sm warm">WHERE created_at ≥ 11-05：符合的散在每一段，只能從頭掃到尾</text>
<rect x="20" y="162" width="74" height="44" rx="5" class="fg-b warm"/><text x="57" y="180" text-anchor="middle" class="fg-t mono">u=41</text><text x="57" y="198" text-anchor="middle" class="fg-t sm mono warm">11-08</text>
<rect x="98" y="162" width="74" height="44" rx="5" class="fg-b"/><text x="135" y="180" text-anchor="middle" class="fg-t mono">u=41</text><text x="135" y="198" text-anchor="middle" class="fg-t sm mono">11-02</text>
<rect x="176" y="162" width="74" height="44" rx="5" class="fg-b warm"/><text x="213" y="180" text-anchor="middle" class="fg-t mono">u=42</text><text x="213" y="198" text-anchor="middle" class="fg-t sm mono warm">11-09</text>
<rect x="254" y="162" width="74" height="44" rx="5" class="fg-b warm"/><text x="291" y="180" text-anchor="middle" class="fg-t mono">u=42</text><text x="291" y="198" text-anchor="middle" class="fg-t sm mono warm">11-05</text>
<rect x="332" y="162" width="74" height="44" rx="5" class="fg-b"/><text x="369" y="180" text-anchor="middle" class="fg-t mono">u=42</text><text x="369" y="198" text-anchor="middle" class="fg-t sm mono">10-30</text>
<rect x="410" y="162" width="74" height="44" rx="5" class="fg-b warm"/><text x="447" y="180" text-anchor="middle" class="fg-t mono">u=43</text><text x="447" y="198" text-anchor="middle" class="fg-t sm mono warm">11-09</text>
<rect x="488" y="162" width="74" height="44" rx="5" class="fg-b"/><text x="525" y="180" text-anchor="middle" class="fg-t mono">u=43</text><text x="525" y="198" text-anchor="middle" class="fg-t sm mono">11-01</text>
<rect x="566" y="162" width="74" height="44" rx="5" class="fg-b warm"/><text x="603" y="180" text-anchor="middle" class="fg-t mono">u=44</text><text x="603" y="198" text-anchor="middle" class="fg-t sm mono warm">11-06</text>
<text x="330" y="236" text-anchor="middle" class="fg-t sm">索引先照 user_id 排；同一個 user_id 裡，再照時間由新到舊排</text>
</svg><figcaption>同一條索引，換一個條件就天差地遠。有最左邊的欄位當起點，符合的項目擠在一起；沒有，它們就散落整條紙帶。</figcaption></figure>
<ul>
<li><code>WHERE user_id = 42</code>：所有 42 擠在紙帶上連續的一段。樹往下走一次找到開頭，往右讀到不是 42 就停。</li>
<li><code>WHERE user_id = 42 ORDER BY created_at DESC LIMIT 20</code>：那一段本來就由新到舊排好，讀到第 20 個就停，連排序都省了。上一課那個索引會快幾百倍，真正的原因是它同時幫了「篩選」和「排序」。</li>
<li><code>WHERE created_at &gt;= '2026-11-05'</code>：符合的項目散在每一個玩家的那一段裡，沒有一段連續的範圍可以直接跳過去，只能整條讀完。</li>
</ul>
<h4>欄位順序的實用規則：等號在前，範圍在後</h4>
<p>查詢 <code>WHERE user_id = 42 AND created_at &gt; now() - interval '7 days'</code>，兩種索引的差距很大：</p>
<ul>
<li><code>(user_id, created_at)</code>：直接跳到「42 號玩家、最近 7 天」那一小段，讀幾格就完。</li>
<li><code>(created_at, user_id)</code>：只能先跳到「最近 7 天」，然後把這 7 天<b>所有玩家</b>的項目一格一格讀過去，邊讀邊挑出 42。如果一週有 50 萬局，就要讀 50 萬個項目。</li>
</ul>
<p>道理是：範圍條件一出現，後面的欄位在那段範圍裡就不再是排好的。所以設計複合索引時，<b>用等號比對的欄位放前面，範圍或排序的欄位放最後</b>。</p>
<h4>兩個細節</h4>
<ul>
<li>B-tree 可以倒著讀，計畫裡會寫 <code>Index Scan Backward</code>。所以單看上一課那個查詢，索引寫成 <code>(user_id, created_at)</code> 不加 DESC 也一樣快。DESC 真正要緊的時候，是排序方向混在一起，例如 <code>ORDER BY score DESC, created_at ASC</code>。</li>
<li>如果最左邊的欄位只有少數幾種值，MySQL 8.0.13 和 PostgreSQL 18 起有 <b>skip scan</b>：資料庫自己對每一個值各跳一次。所以缺了最左欄位，也不見得完全用不上。但別依賴它，設計時照最左前綴來想就對了。</li>
</ul>

<h3><span class="badge lv2">進階</span>五、覆蓋索引與 Index Only Scan</h3>
<p>索引找到 ctid 之後，還要回資料表把整列讀出來，這一步叫 heap fetch。問題是，同一個玩家的十局是不同時間玩的，散落在資料表十個不同的頁裡。所以 10 列可能就是 10 次隨機讀取；要一萬列，就可能是一萬次。</p>
<figure class="figure"><svg viewBox="0 0 660 270" class="fg" style="width:100%;max-width:660px" role="img" aria-label="左邊是 Index Scan：索引葉頁只有鍵和 ctid，每一列都要跳回資料表不同的頁；右邊是 Index Only Scan：需要的欄位都在索引裡，只要查可見性地圖的一個位元">
<line x1="330" y1="10" x2="330" y2="262" class="fg-l dim dash"/>
<text x="165" y="24" text-anchor="middle" class="fg-t lg">Index Scan</text>
<text x="165" y="42" text-anchor="middle" class="fg-t sm">索引裡只有鍵和地址</text>
<rect x="40" y="52" width="250" height="72" rx="6" class="fg-b alt"/>
<text x="54" y="74" class="fg-t sm mono">42 · 11-09 → (12,7)</text>
<text x="54" y="94" class="fg-t sm mono">42 · 11-05 → (877,5)</text>
<text x="54" y="114" class="fg-t sm mono">42 · 10-30 → (3051,2)</text>
<line x1="74" y1="124" x2="74" y2="162" class="fg-l warm"/><polygon points="74,170 69.5,162 78.5,162" class="fg-a warm"/>
<line x1="165" y1="124" x2="165" y2="162" class="fg-l warm"/><polygon points="165,170 160.5,162 169.5,162" class="fg-a warm"/>
<line x1="256" y1="124" x2="256" y2="162" class="fg-l warm"/><polygon points="256,170 251.5,162 260.5,162" class="fg-a warm"/>
<rect x="36" y="170" width="76" height="36" rx="5" class="fg-b"/><text x="74" y="193" text-anchor="middle" class="fg-t sm">第 12 頁</text>
<rect x="127" y="170" width="76" height="36" rx="5" class="fg-b"/><text x="165" y="193" text-anchor="middle" class="fg-t sm">第 877 頁</text>
<rect x="218" y="170" width="76" height="36" rx="5" class="fg-b"/><text x="256" y="193" text-anchor="middle" class="fg-t sm">第 3051 頁</text>
<text x="165" y="232" text-anchor="middle" class="fg-t sm warm">每一列都可能是一次隨機讀取</text>
<text x="165" y="250" text-anchor="middle" class="fg-t sm">10 列 ≈ 多讀 10 頁</text>
<text x="495" y="24" text-anchor="middle" class="fg-t lg">Index Only Scan</text>
<text x="495" y="42" text-anchor="middle" class="fg-t sm">INCLUDE (score)：欄位跟著放進葉頁</text>
<rect x="370" y="52" width="250" height="72" rx="6" class="fg-b hot"/>
<text x="384" y="74" class="fg-t sm mono">42 · 11-09 · score 300</text>
<text x="384" y="94" class="fg-t sm mono">42 · 11-05 · score 120</text>
<text x="384" y="114" class="fg-t sm mono">42 · 10-30 · score 75</text>
<line x1="495" y1="124" x2="495" y2="162" class="fg-l dash"/><polygon points="495,170 490.5,162 499.5,162" class="fg-a"/>
<text x="505" y="152" class="fg-t sm">只查一個位元</text>
<rect x="370" y="170" width="250" height="36" rx="5" class="fg-b"/>
<text x="495" y="193" text-anchor="middle" class="fg-t sm">可見性地圖：這頁全部可見嗎？</text>
<text x="495" y="232" text-anchor="middle" class="fg-t sm acc">要的欄位都在索引裡，不碰資料表</text>
<text x="495" y="250" text-anchor="middle" class="fg-t sm">位元是 0 的頁才回資料表（Heap Fetches）</text>
</svg><figcaption>差別在虛線右邊少了那三支橘色箭頭。查詢要的欄位全在索引裡，就不必跳回資料表一頁一頁讀。</figcaption></figure>
<p>如果查詢要的欄位，索引裡全都有，就根本不必回資料表。這叫<b>覆蓋索引</b>（covering index），計畫上顯示為 <code>Index Only Scan</code>。PostgreSQL 11 起可以用 <code>INCLUDE</code>，把不拿來搜尋、只是要帶著走的欄位放進葉頁：</p>
<pre><code>CREATE INDEX rounds_user_cover
  ON rounds (user_id, created_at DESC) INCLUDE (score);

SELECT created_at, score FROM rounds
WHERE user_id = 42 ORDER BY created_at DESC LIMIT 20;
--  Index Only Scan using rounds_user_cover on rounds ...
--    Heap Fetches: 0</code></pre>
<p><code>INCLUDE</code> 的欄位只放在葉頁、不參與排序，所以不能拿來搜尋，但也不會讓樹的上層變肥。</p>
<h4>PostgreSQL 特有的眉角：可見性地圖</h4>
<p>PostgreSQL 的索引裡，沒有「這一列現在還算不算數」的資訊。那些資訊放在資料表每一列的標頭上（下一課的 MVCC 會講）。所以 Index Only Scan 每拿到一個項目，都要先查<b>可見性地圖</b>（visibility map）：資料表的每一頁用一個位元記著「這頁上的每一列，所有交易都看得到」。位元是 1，就直接用索引裡的值；是 0，就只好回資料表確認。計畫裡的 <code>Heap Fetches</code>，就是回去了幾次。</p>
<p>把這些位元設成 1 的是 VACUUM。所以一張一直被更新的表，可見性地圖老是被弄髒，Index Only Scan 的好處就會打折。剛大量匯入完資料，手動跑一次 <code>VACUUM</code>，它就會立刻生效。</p>
<p>MySQL 的次要索引本來就帶著主鍵，所以只要查詢要的欄位都在「索引欄位加主鍵」裡，就是覆蓋索引，<code>EXPLAIN</code> 的 Extra 欄會寫 <code>Using index</code>。MySQL 沒有 <code>INCLUDE</code> 語法，要帶的欄位只能直接加進索引的鍵裡。</p>

<h3><span class="badge lv3">專業</span>六、選擇性與查詢規劃器：它憑什麼不用你的索引</h3>
<p>你寫的 SQL 只說「要什麼」，不說「怎麼拿」。怎麼拿，是<b>查詢規劃器</b>（query planner，也叫 optimizer）決定的：它把可能的做法都列出來，各估一個成本，挑最便宜的。估得準不準，全看兩樣東西：統計資料和成本模型。</p>
<h4>選擇性：這個條件會留下多少列</h4>
<p><b>選擇性</b>（selectivity）是「符合條件的列佔全表的比例」。<code>user_id = 42</code> 大約 10 列，十萬分之一，非常有鑑別力。假設 <code>rounds</code> 還有一個 <code>status</code> 欄位，95% 的局都是 <code>'finished'</code>，那 <code>status = 'finished'</code> 幾乎等於沒篩。索引只對前一種有幫助。</p>
<h4>統計資料從哪裡來</h4>
<p><code>ANALYZE</code>（autovacuum 會自動定期跑）從表裡隨機抽樣，預設抽 30,000 列（300 乘以 <code>default_statistics_target</code> 的預設值 100），替每個欄位算出：</p>
<ul>
<li><code>n_distinct</code>：大概有幾種不同的值。<code>user_id</code> 大約 10 萬種，所以規劃器估 <code>user_id = 42</code> 會留下 100 萬 ÷ 10 萬 ≈ 10 列。</li>
<li><code>most_common_vals</code>：最常出現的值和各自的比例。資料很偏的時候（例如一個機器人帳號佔了三成），就靠這個。</li>
<li><code>histogram_bounds</code>：把值切成份量差不多的區間，用來估 <code>&gt;</code>、<code>BETWEEN</code> 這種範圍條件。</li>
<li><code>correlation</code>：欄位的順序跟資料在磁碟上的實體順序有多一致。接近 1 代表照順序一路寫進來（像 <code>created_at</code>），索引掃描回資料表時大多是相鄰的頁，便宜很多。</li>
</ul>
<p>可以直接看：<code>SELECT attname, n_distinct, correlation FROM pg_stats WHERE tablename = 'rounds';</code></p>
<h4>成本怎麼算：一個實際的例子</h4>
<p>成本的單位是「循序讀一頁」等於 1。幾個預設參數：<code>seq_page_cost</code> = 1、<code>random_page_cost</code> = 4（隨機讀一頁算 4 倍）、<code>cpu_tuple_cost</code> = 0.01（處理一列）、<code>cpu_operator_cost</code> = 0.0025（算一次條件）。全表掃描的成本就是：</p>
<pre><code>讀頁：  6,370 頁     × 1      =  6,370
處理列：1,000,000 列 × 0.01   = 10,000
比條件：1,000,000 次 × 0.0025 =  2,500
合計                          = 18,870</code></pre>
<p>這正是下一節計畫裡 <code>cost=0.00..18870.00</code> 的由來。索引掃描找 10 列：往下走三頁，再隨機讀大約 10 頁資料表，每頁算 4，加起來四、五十。差了幾百倍，當然選索引。</p>
<p>換成 <code>status = 'finished'</code>，要拿 95 萬列。索引掃描會隨機讀遍幾乎每一頁，每頁還算 4 倍，再加上 95 萬個索引項目的處理，比 18,870 貴得多，規劃器就選全表掃描。<b>這時候它不理你的索引，是對的。</b></p>
<figure class="figure"><svg viewBox="0 0 600 290" class="fg" style="width:100%;max-width:600px" role="img" aria-label="示意圖：橫軸是取回的列佔全表的比例，縱軸是估計成本。Seq Scan 是一條水平線；Index Scan 起點很低但越來越陡，在交叉點之後超過 Seq Scan；Bitmap Scan 介於兩者之間">
<line x1="70" y1="240" x2="562" y2="240" class="fg-l"/><polygon points="570,240 562,235.5 562,244.5" class="fg-a"/>
<line x1="70" y1="240" x2="70" y2="36" class="fg-l"/><polygon points="70,28 65.5,36 74.5,36" class="fg-a"/>
<text x="80" y="40" class="fg-t sm">估計成本</text>
<line x1="70" y1="150" x2="560" y2="150" class="fg-l alt"/>
<text x="80" y="142" class="fg-t sm alt">Seq Scan：不管取回多少，都讀全部的頁</text>
<path d="M70 236 C 200 232, 300 200, 380 150 S 480 60, 520 34" class="fg-l warm"/>
<text x="440" y="70" text-anchor="end" class="fg-t sm warm">Index Scan</text>
<text x="440" y="86" text-anchor="end" class="fg-t sm">每一列一次隨機讀</text>
<path d="M70 220 C 200 210, 330 175, 560 140" class="fg-l on"/>
<text x="410" y="206" text-anchor="middle" class="fg-t sm acc">Bitmap Scan</text>
<text x="410" y="222" text-anchor="middle" class="fg-t sm">先把頁排好再讀</text>
<line x1="322" y1="181" x2="322" y2="240" class="fg-l dim dash"/>
<line x1="497" y1="150" x2="497" y2="240" class="fg-l dim dash"/>
<circle cx="322" cy="181" r="4.5" class="fg-lamp on"/>
<circle cx="497" cy="150" r="4.5" class="fg-lamp on"/>
<text x="196" y="258" text-anchor="middle" class="fg-t sm warm">Index Scan 最省</text>
<text x="410" y="258" text-anchor="middle" class="fg-t sm acc">Bitmap 最省</text>
<text x="530" y="258" text-anchor="middle" class="fg-t sm alt">Seq 最省</text>
<text x="315" y="282" text-anchor="middle" class="fg-t sm">取回的列佔全表的比例：很少 → 幾乎全部</text>
</svg><figcaption>示意圖，不是實測。規劃器永遠挑最低的那條線：取回的列很少時是索引；多一點換 Bitmap；比例再高，一次次隨機讀加起來，就比整張表循序讀一遍還貴。兩個交叉點落在哪，要看資料在磁碟上怎麼排、記憶體夠不夠，沒有固定門檻。</figcaption></figure>
<p>中間地帶還有一種做法：<b>Bitmap Index Scan</b> 加 <b>Bitmap Heap Scan</b>。先把索引裡所有符合的 ctid 收集起來，照頁碼排好，再按頁的順序讀資料表，同一頁只讀一次。取回幾千、幾萬列的時候，常常是它勝出。兩個條件各有一個索引時，它還能把兩張點陣圖做 AND、OR 合併。</p>
<h4>規劃器「不用你的索引」的八個常見原因</h4>
<ol>
<li><b>條件留下的列太多</b>：像上面的 status。這時全表掃描本來就比較快，或者改用後面講的部分索引。</li>
<li><b>統計資料過期</b>：剛匯入一大批資料，autovacuum 還沒跑到，規劃器以為表還很小。手動跑 <code>ANALYZE rounds;</code>。</li>
<li><b>欄位被包了一層</b>：<code>WHERE created_at::date = '2026-11-09'</code>。索引存的是原始值，包過的值它不認得。改寫成 <code>created_at &gt;= '2026-11-09' AND created_at &lt; '2026-11-10'</code>，或建運算式索引。</li>
<li><b>型別對不上</b>：MySQL 裡 VARCHAR 的電話欄位拿數字去比（<code>WHERE phone = 912345678</code>），資料庫會把每一列的值轉成數字再比，索引就廢了。PostgreSQL 遇到這種情況多半直接報錯，反而比較不容易踩到。</li>
<li><b>前面是萬用字元</b>：<code>LIKE '%abc'</code> 沒有起點可以跳。要用 pg_trgm 的 GIN 索引。另外，PostgreSQL 在非 C 的定序（collation）下，連 <code>LIKE 'abc%'</code> 都要用 <code>text_pattern_ops</code> 建的索引才用得上。</li>
<li><b>成本參數還停在硬碟時代</b>：<code>random_page_cost = 4</code> 是照傳統硬碟訂的。資料都在 SSD 或記憶體裡，很多團隊會把它調到 1.1 左右，規劃器就比較願意用索引。</li>
<li><b>欄位之間有關聯</b>：<code>WHERE city = '台北' AND country = 'TW'</code>，規劃器預設把兩個比例相乘，當成兩者無關，於是嚴重低估列數。PostgreSQL 10 起可以用 <code>CREATE STATISTICS</code> 告訴它這兩個欄位有關。</li>
<li><b>prepared statement 的通用計畫</b>：同一個 prepared statement 跑過五次之後，PostgreSQL 可能改用不看參數值的通用計畫（generic plan）。資料很偏時，大帳號和小帳號共用一個計畫就會出事。可以用 <code>plan_cache_mode</code> 調整。</li>
</ol>
<p>PostgreSQL 刻意不提供「強制用這個索引」的語法（真的要，得裝 pg_hint_plan 擴充套件）；MySQL 則有 <code>FORCE INDEX</code>。不管哪一種，先修統計資料和查詢寫法，提示是最後手段：資料分佈一變，你寫死的計畫可能就變成最爛的那一個。</p>

<h3><span class="badge lv3">專業</span>七、一行一行讀 EXPLAIN ANALYZE</h3>
<p>用上一課那個查詢，前後各跑一次。為了好讀，先把平行掃描關掉（不關的話，你會多看到 <code>Gather</code> 和 <code>Parallel Seq Scan</code>，道理一樣）。真正的輸出每個節點是一長行，這裡把括號的部分折到下一行比較好讀。你機器上的數字會不一樣，看的是形狀。</p>
<pre><code>SET max_parallel_workers_per_gather = 0;
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM rounds WHERE user_id = 42
ORDER BY created_at DESC LIMIT 20;

Limit  (cost=18870.27..18870.30 rows=10 width=20)
       (actual time=61.902..61.905 rows=11 loops=1)
  Buffers: shared hit=6370
  -&gt;  Sort  (cost=18870.27..18870.30 rows=10 width=20)
            (actual time=61.900..61.902 rows=11 loops=1)
        Sort Key: created_at DESC
        Sort Method: quicksort  Memory: 25kB
        Buffers: shared hit=6370
        -&gt;  Seq Scan on rounds
                (cost=0.00..18870.00 rows=10 width=20)
                (actual time=0.512..61.861 rows=11 loops=1)
              Filter: (user_id = 42)
              Rows Removed by Filter: 999989
              Buffers: shared hit=6370
Planning Time: 0.105 ms
Execution Time: 61.931 ms</code></pre>
<pre><code>CREATE INDEX rounds_user_time
  ON rounds (user_id, created_at DESC);
-- 同一個查詢再跑一次：

Limit  (cost=0.42..43.29 rows=10 width=20)
       (actual time=0.024..0.061 rows=11 loops=1)
  Buffers: shared hit=14
  -&gt;  Index Scan using rounds_user_time on rounds
            (cost=0.42..43.29 rows=10 width=20)
            (actual time=0.023..0.058 rows=11 loops=1)
        Index Cond: (user_id = 42)
        Buffers: shared hit=14
Planning Time: 0.210 ms
Execution Time: 0.079 ms</code></pre>
<figure class="figure"><svg viewBox="0 0 660 290" class="fg" style="width:100%;max-width:660px" role="img" aria-label="把兩個執行計畫畫成樹：左邊沒有索引，Seq Scan 讀一百萬列交給 Sort 再交給 Limit；右邊有索引，Index Scan 直接把 11 列交給 Limit">
<line x1="330" y1="10" x2="330" y2="262" class="fg-l dim dash"/>
<text x="165" y="26" text-anchor="middle" class="fg-t lg warm">沒有索引：62 ms</text>
<rect x="85" y="44" width="160" height="34" rx="6" class="fg-b"/><text x="165" y="66" text-anchor="middle" class="fg-t mono">Limit · 11 列</text>
<rect x="85" y="108" width="160" height="34" rx="6" class="fg-b"/><text x="165" y="130" text-anchor="middle" class="fg-t mono">Sort · 11 列</text>
<rect x="85" y="172" width="160" height="34" rx="6" class="fg-b warm"/><text x="165" y="194" text-anchor="middle" class="fg-t mono">Seq Scan · 100 萬列</text>
<line x1="165" y1="172" x2="165" y2="150" class="fg-l"/><polygon points="165,142 160.5,150 169.5,150" class="fg-a"/>
<line x1="165" y1="108" x2="165" y2="86" class="fg-l"/><polygon points="165,78 160.5,86 169.5,86" class="fg-a"/>
<text x="165" y="230" text-anchor="middle" class="fg-t sm warm">讀 6,370 頁、丟掉 999,989 列</text>
<text x="165" y="248" text-anchor="middle" class="fg-t sm">剩下 11 列再排序，最後交給 Limit</text>
<text x="495" y="26" text-anchor="middle" class="fg-t lg acc">有索引：0.08 ms</text>
<rect x="415" y="44" width="160" height="34" rx="6" class="fg-b"/><text x="495" y="66" text-anchor="middle" class="fg-t mono">Limit · 11 列</text>
<rect x="415" y="108" width="160" height="34" rx="6" class="fg-b hot"/><text x="495" y="130" text-anchor="middle" class="fg-t mono">Index Scan · 11 列</text>
<line x1="495" y1="108" x2="495" y2="86" class="fg-l on"/><polygon points="495,78 490.5,86 499.5,86" class="fg-a on"/>
<text x="495" y="172" text-anchor="middle" class="fg-t sm acc">索引 3 頁、資料表 11 頁，共 14 頁</text>
<text x="495" y="190" text-anchor="middle" class="fg-t sm">索引本來就照時間排好，不用 Sort</text>
<text x="495" y="208" text-anchor="middle" class="fg-t sm">拿到 20 列就能停（這裡只有 11 列）</text>
<text x="330" y="282" text-anchor="middle" class="fg-t sm">讀計畫要由下往上：最裡層先做，結果一層一層往上交</text>
</svg><figcaption>同一個問題、兩棵計畫樹。左邊做了 99.999% 的白工；右邊少了整個 Sort 節點，只碰 14 頁。</figcaption></figure>
<ol>
<li><b>由下往上、由內往外讀。</b>縮排最深的 <code>Seq Scan</code> 最先做，結果往上交給 <code>Sort</code>，再交給 <code>Limit</code>。每個 <code>-&gt;</code> 是一個節點（node）。</li>
<li><b><code>cost=0.00..18870.00</code></b>：規劃器估的成本，單位是上一節說的「頁」，<b>不是毫秒</b>。前一個數字是「吐出第一列之前」要花的，後一個是「全部做完」。<code>Sort</code> 的兩個數字幾乎一樣，因為不排完就吐不出第一列；索引掃描的前一個數字很小，所以 <code>Limit</code> 拿到 20 列就能叫它停。</li>
<li><b><code>rows=10 width=20</code></b>：估計會產生 10 列，每列平均 20 位元組。</li>
<li><b><code>actual time=0.512..61.861 rows=11 loops=1</code></b>：實際時間（毫秒），一樣是「第一列..最後一列」；實際產生 11 列；這個節點跑了 1 次。<b>拿估計的 rows 跟實際的 rows 比</b>，是讀計畫最重要的一個動作：差個兩三倍沒關係，差到 10 倍、100 倍，規劃器就是拿著錯的數字在做決定，上面每一個選擇都可能跟著錯。</li>
<li><b><code>Rows Removed by Filter: 999989</code></b>：讀了一百萬列，丟掉 999,989 列。這一行就是「少了索引」的鐵證。</li>
<li><b><code>Sort Method: quicksort  Memory: 25kB</code></b>：在記憶體裡排完。如果看到 <code>external merge  Disk: ...</code>，表示要排的資料超過 <code>work_mem</code>，寫到磁碟上去排了。</li>
<li><b><code>Buffers: shared hit=6370</code></b>：碰了 6,370 頁，全在快取裡命中（hit）。如果是 <code>read=...</code>，就是從作業系統或磁碟讀進來的。同一個查詢第二次跑比較快，通常就是第一次的 read 變成了 hit。PostgreSQL 18 起，<code>EXPLAIN ANALYZE</code> 預設就會附上這一行，舊版要自己加 BUFFERS。</li>
<li><b><code>Planning Time</code>／<code>Execution Time</code></b>：規劃花多久、執行花多久。</li>
</ol>
<p>加了索引之後，計畫只剩兩層：<code>Index Scan</code> 用 <code>Index Cond: (user_id = 42)</code> 直接在樹裡定位，只碰了 14 頁，結果本來就照時間排好，<code>Sort</code> 整個消失。</p>
<h4>多表查詢時，一定要看 loops</h4>
<p>JOIN 常見的 <code>Nested Loop</code>：外層每一列，都去內層查一次。這時內層節點的 <code>actual time</code> 是<b>每一次的平均</b>，要乘上 <code>loops</code> 才是總共。<code>actual time=0.050..0.052 rows=1 loops=40000</code> 看起來只有 0.05 毫秒，乘起來是 2 秒。很多人讀計畫就在這裡看走眼。</p>
<h4>三個安全提醒</h4>
<ul>
<li><code>EXPLAIN ANALYZE</code> <b>會真的執行</b>。拿它看 <code>UPDATE</code>、<code>DELETE</code> 時，一定要包在 <code>BEGIN; ... ROLLBACK;</code> 裡。</li>
<li>只想看計畫、不想執行，就用不加 ANALYZE 的 <code>EXPLAIN</code>。正式環境上的大查詢，先這樣看。</li>
<li>筆電上 1 萬列測出來的計畫，跟正式環境 1 億列的計畫可能完全不同。規劃器是看資料量和分佈做決定的。</li>
</ul>
<p>MySQL 8.0.18 起也有 <code>EXPLAIN ANALYZE</code>，輸出是樹狀的。傳統的 <code>EXPLAIN</code> 是表格：<code>type</code> 欄是 <code>ALL</code> 就是全表掃描，<code>ref</code>、<code>range</code> 代表用了索引；<code>Extra</code> 欄出現 <code>Using filesort</code> 代表另外排序了。</p>

<h3><span class="badge lv3">專業</span>八、B-tree 以外：Hash、GIN、GiST、BRIN</h3>
<p>B-tree 是預設，九成的情況用它就對了。剩下那一成，是 B-tree 根本幫不上忙的問題：</p>
<table>
<tr><th>種類</th><th>怎麼運作</th><th>適合</th><th>不適合</th></tr>
<tr><td>B-tree（預設）</td><td>排好序的平衡樹</td><td>=、&lt;、&gt;、BETWEEN、ORDER BY、開頭固定的 LIKE</td><td>「包含」這類搜尋</td></tr>
<tr><td>Hash</td><td>雜湊值對到 ctid</td><td>只有 =</td><td>範圍、排序；多半也沒比 B-tree 好多少</td></tr>
<tr><td>GIN</td><td>每一個值，對到含有它的所有列（倒排索引）</td><td>jsonb、陣列、全文檢索、pg_trgm 的 <code>LIKE '%abc%'</code></td><td>寫入非常頻繁的欄位</td></tr>
<tr><td>GiST</td><td>能放「範圍、形狀」的平衡樹</td><td>地理座標（PostGIS）、時間區間重疊、找最近的點</td><td>一般的等值查詢</td></tr>
<tr><td>BRIN</td><td>每一段頁只記最小值和最大值</td><td>照時間寫入的超大表（日誌、事件）</td><td>資料順序跟欄位無關的表</td></tr>
</table>
<figure class="figure"><svg viewBox="0 0 680 290" class="fg" style="width:100%;max-width:680px" role="img" aria-label="左邊是 GIN 倒排索引：每個標籤對到含有它的列的清單；右邊是 BRIN：每 128 頁只記時間的最小和最大值，查 11-06 只需要讀第 256 到 383 頁">
<line x1="340" y1="10" x2="340" y2="282" class="fg-l dim dash"/>
<text x="170" y="24" text-anchor="middle" class="fg-t lg">GIN：倒排索引</text>
<text x="170" y="42" text-anchor="middle" class="fg-t sm">像書後面的關鍵字索引</text>
<rect x="30" y="58" width="90" height="30" rx="5" class="fg-b hot"/><text x="75" y="78" text-anchor="middle" class="fg-t mono">vip</text>
<line x1="120" y1="73" x2="132" y2="73" class="fg-l on"/><polygon points="140,73 132,68.5 132,77.5" class="fg-a on"/>
<rect x="140" y="58" width="170" height="30" rx="5" class="fg-b"/><text x="152" y="78" class="fg-t sm mono">(3,1) (8,4) (90,2) …</text>
<rect x="30" y="96" width="90" height="30" rx="5" class="fg-b"/><text x="75" y="116" text-anchor="middle" class="fg-t mono">beta</text>
<line x1="120" y1="111" x2="132" y2="111" class="fg-l"/><polygon points="140,111 132,106.5 132,115.5" class="fg-a"/>
<rect x="140" y="96" width="170" height="30" rx="5" class="fg-b"/><text x="152" y="116" class="fg-t sm mono">(8,4) (51,7) …</text>
<rect x="30" y="134" width="90" height="30" rx="5" class="fg-b"/><text x="75" y="154" text-anchor="middle" class="fg-t mono">ios</text>
<line x1="120" y1="149" x2="132" y2="149" class="fg-l"/><polygon points="140,149 132,144.5 132,153.5" class="fg-a"/>
<rect x="140" y="134" width="170" height="30" rx="5" class="fg-b"/><text x="152" y="154" class="fg-t sm mono">(2,3) (3,1) (77,1) …</text>
<rect x="30" y="172" width="90" height="30" rx="5" class="fg-b"/><text x="75" y="192" text-anchor="middle" class="fg-t mono">new</text>
<line x1="120" y1="187" x2="132" y2="187" class="fg-l"/><polygon points="140,187 132,182.5 132,191.5" class="fg-a"/>
<rect x="140" y="172" width="170" height="30" rx="5" class="fg-b"/><text x="152" y="192" class="fg-t sm mono">(90,2) (91,5) …</text>
<text x="170" y="230" text-anchor="middle" class="fg-t sm acc">一個值 → 含有它的所有列</text>
<text x="170" y="248" text-anchor="middle" class="fg-t sm">tags @&gt; '{vip}'：直接拿第一條清單</text>
<text x="170" y="266" text-anchor="middle" class="fg-t sm warm">代價：新增一列要更新好幾條清單</text>
<text x="510" y="24" text-anchor="middle" class="fg-t lg">BRIN：區塊範圍摘要</text>
<text x="510" y="42" text-anchor="middle" class="fg-t sm">每 128 頁只記最小和最大值</text>
<rect x="364" y="58" width="120" height="30" rx="5" class="fg-b"/><text x="424" y="78" text-anchor="middle" class="fg-t sm">第 0–127 頁</text>
<rect x="494" y="58" width="160" height="30" rx="5" class="fg-b"/><text x="574" y="78" text-anchor="middle" class="fg-t sm mono">11-01 ~ 11-03</text>
<rect x="364" y="96" width="120" height="30" rx="5" class="fg-b"/><text x="424" y="116" text-anchor="middle" class="fg-t sm">第 128–255 頁</text>
<rect x="494" y="96" width="160" height="30" rx="5" class="fg-b"/><text x="574" y="116" text-anchor="middle" class="fg-t sm mono">11-03 ~ 11-05</text>
<rect x="364" y="134" width="120" height="30" rx="5" class="fg-b hot"/><text x="424" y="154" text-anchor="middle" class="fg-t sm acc">第 256–383 頁</text>
<rect x="494" y="134" width="160" height="30" rx="5" class="fg-b hot"/><text x="574" y="154" text-anchor="middle" class="fg-t sm mono acc">11-05 ~ 11-07</text>
<rect x="364" y="172" width="120" height="30" rx="5" class="fg-b"/><text x="424" y="192" text-anchor="middle" class="fg-t sm">第 384–511 頁</text>
<rect x="494" y="172" width="160" height="30" rx="5" class="fg-b"/><text x="574" y="192" text-anchor="middle" class="fg-t sm mono">11-07 ~ 11-09</text>
<text x="510" y="230" text-anchor="middle" class="fg-t sm acc">查 11-06：只要讀第 256–383 頁</text>
<text x="510" y="248" text-anchor="middle" class="fg-t sm">整個索引只有幾頁大</text>
<text x="510" y="266" text-anchor="middle" class="fg-t sm warm">資料沒照時間寫入，它就幾乎沒用</text>
</svg><figcaption>GIN 回答「哪些列含有這個值」，適合一列裡有很多值的欄位。BRIN 用極小的空間記「這一段大概在什麼範圍」，前提是資料在磁碟上本來就照那個欄位排。</figcaption></figure>
<p>GIN 的代價在寫入：一列有十個標籤，新增它就要更新十條清單。所以 GIN 預設會先把新項目放進一個待處理清單（pending list），累積起來再一次合併。BRIN 則是一億列的事件表，B-tree 要好幾 GB，BRIN 可能只要幾百 KB；代價是它只能排除「一定不在這段」的頁，找到的那一段還是得整段讀。</p>
<h4>兩種很好用、卻常被忘記的技巧</h4>
<ul>
<li><b>部分索引</b>（partial index）：只替符合條件的列建索引。<code>CREATE INDEX ON rounds (created_at) WHERE status = 'playing';</code> 如果 99% 的局都打完了，這個索引只有原本的百分之一大，卻剛好服務「找出還沒結束的局」這個查詢。部分唯一索引還能拿來表達規則：<code>CREATE UNIQUE INDEX ON rounds (user_id) WHERE status = 'playing';</code> 就是「每個玩家同時最多只有一局進行中」，下一課會用到。</li>
<li><b>運算式索引</b>（expression index）：<code>CREATE INDEX ON users (lower(email));</code>，查詢寫 <code>WHERE lower(email) = lower($1)</code> 就用得上。</li>
</ul>
<p>MySQL 的差別：InnoDB 幾乎都是 B+tree，另外有 FULLTEXT 和空間索引；沒有部分索引；運算式索引（functional key part）要 8.0.13 起才有。PostgreSQL 的 Hash 索引在 10 版以前不寫 WAL，當機後可能壞掉，所以很多舊文章叫你別用。現在已經沒這個問題，只是多半沒有比 B-tree 好多少。</p>

<h3><span class="badge lv3">專業</span>九、索引的寫入代價</h3>
<p>每多一個索引，每一次 <code>INSERT</code> 就多一趟「在另一棵樹裡找到位置、塞進去」，有時還要分裂頁。每一個改動都要寫進 WAL（交易日誌，下一課會講），WAL 還要送到每一台複本。一張表有主鍵加 5 個索引，新增一列至少要改 7 個頁。</p>
<h4>PostgreSQL 的 UPDATE 特別貴，除非是 HOT</h4>
<p>PostgreSQL 的 <code>UPDATE</code> 不是原地修改，而是寫一個新版本的列（下一課的 MVCC）。新版本有新的 ctid，所以照理<b>每一個索引</b>都要加一個指向新 ctid 的項目，就算你只改了一個沒建索引的欄位也一樣。</p>
<p>救星是 <b>HOT</b>（heap-only tuple）：如果這次 UPDATE 沒動到任何有索引的欄位，而且新版本剛好放得進同一頁，PostgreSQL 就只在頁裡串一條「舊版本 → 新版本」的鏈，索引完全不用動。兩個實際的結論：</p>
<ul>
<li>別在一直被更新的欄位上隨手建索引。例如每個請求都會更新的 <code>last_seen_at</code>，一旦加了索引，這張表的每次更新都不能走 HOT。</li>
<li>更新很頻繁的表，可以把 <code>fillfactor</code> 設成 80 或 90，每頁留點空位給新版本。拿 <code>pg_stat_user_tables</code> 的 <code>n_tup_hot_upd</code> 和 <code>n_tup_upd</code> 比一比，就知道 HOT 的比例。</li>
</ul>
<p>InnoDB 則是原地更新，把舊版本放進 undo log；次要索引存的是主鍵，所以只有被改到的欄位上的索引才要動。這正是 2016 年 Uber 那篇有名的〈Why Uber Engineering Switched from Postgres to MySQL〉的主要論點之一：更新很多、索引又多的表，PostgreSQL 的寫入放大（write amplification）比較嚴重。</p>
<h4>上線時建索引的坑</h4>
<p>一般的 <code>CREATE INDEX</code> 在建好之前，會擋住這張表所有的寫入。一億列的表可能要建好幾分鐘，這段時間所有新增、更新都在排隊，網站等於掛了。正式環境要用：</p>
<pre><code>CREATE INDEX CONCURRENTLY rounds_user_time
  ON rounds (user_id, created_at DESC);</code></pre>
<p>它不擋寫入，代價是要掃表兩次、比較慢，而且不能放在交易裡執行。如果中途失敗，會留下一個標成 <code>INVALID</code> 的索引：查詢不會用它，寫入卻還是要維護它。記得 <code>DROP INDEX CONCURRENTLY</code> 掉再重建。MySQL 8 新增次要索引預設走線上 DDL（online DDL），大部分時間不擋寫入。</p>
<h4>找出沒在用的索引</h4>
<pre><code>SELECT relname, indexrelname, idx_scan,
       pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
ORDER BY idx_scan, pg_relation_size(indexrelid) DESC;</code></pre>
<p><code>idx_scan = 0</code> 而且很大的，就是嫌疑犯。但刪之前想三件事：這個計數是<b>每台伺服器各算各的</b>，主庫沒用到，唯讀複本上可能天天在用；唯一索引就算從沒被拿來查，也在負責擋重複資料；月底才跑一次的報表，可能這個月還沒跑到。</p>

<h3><span class="badge lv4">專家</span>十、找出真正該修的慢查詢</h3>
<p>規劃器、索引都懂了，上班時真正的問題是：系統裡有幾千種查詢，<b>先修哪一個</b>？答案是看總時間，不是看單次最慢。</p>
<pre><code># postgresql.conf（改完要重啟）
shared_preload_libraries = 'pg_stat_statements'
# 用 Docker 練習時，直接加在啟動參數後面：
# docker run ... postgres:16-alpine \\
#   -c shared_preload_libraries=pg_stat_statements</code></pre>
<pre><code>CREATE EXTENSION pg_stat_statements;

SELECT calls,
       round(total_exec_time) AS total_ms,
       round(mean_exec_time::numeric, 2) AS mean_ms,
       rows,
       left(query, 60) AS query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;</code></pre>
<p>它把「長得一樣、只有參數不同」的查詢合併成一筆（<code>WHERE user_id = 42</code> 和 <code>= 43</code> 都變成 <code>= $1</code>），累計次數和時間。一個典型的結果：</p>
<table>
<tr><th>查詢</th><th>calls</th><th>mean_ms</th><th>total_ms</th></tr>
<tr><td>讀玩家最近 20 局</td><td>1,200,000</td><td>4.1</td><td>4,920,000</td></tr>
<tr><td>每日排行榜報表</td><td>24</td><td>2,300</td><td>55,200</td></tr>
<tr><td>登入時查帳號</td><td>300,000</td><td>0.05</td><td>15,000</td></tr>
</table>
<p>排行榜報表單次 2.3 秒，看起來最可怕；但「讀最近 20 局」一天吃掉的資料庫時間是它的將近 90 倍。把它從 4.1 毫秒降到 0.1 毫秒，整台資料庫的負載就少了一大塊。</p>
<h4>一套實際的流程</h4>
<ol>
<li>用 <code>pg_stat_statements</code> 依總時間排出前 10 名。</li>
<li>每個都從應用程式日誌找一組真實的參數，在複本或測試環境跑 <code>EXPLAIN (ANALYZE, BUFFERS)</code>。</li>
<li>照第七節的方法讀：估計和實際差多少、哪裡丟掉最多列、哪裡讀最多頁。</li>
<li>動手修：補索引、改寫查詢、更新統計資料，或乾脆改成快取（第 3.5 課）。</li>
<li>用 <code>pg_stat_statements_reset()</code> 歸零，過一天再看排名有沒有變。</li>
</ol>
<p>有些查詢只在特定參數、特定時段才慢，事後很難重現。<code>auto_explain</code> 模組可以把超過門檻的查詢，連同當下的執行計畫一起寫進日誌（<code>auto_explain.log_min_duration = '500ms'</code>）。再打開 <code>auto_explain.log_analyze</code> 會記下實際時間，但每個查詢都要計時，負擔不小，正式環境要小心開。</p>
<p>MySQL 的對應工具：慢查詢日誌（<code>slow_query_log</code>、<code>long_query_time</code>），以及 <code>performance_schema.events_statements_summary_by_digest</code> 表，或比較好讀的 <code>sys.statement_analysis</code> 檢視表。雲端代管的資料庫多半另有圖形化的查詢分析頁面，底層看的就是這些數字。</p>

<h3><span class="badge lv4">專家</span>十一、最常被忽略的幾個邊角</h3>
<h4>隨機主鍵與頁分裂</h4>
<p>用 <code>bigserial</code> 或依時間遞增的鍵，新項目永遠加在 B-tree 最右邊的葉頁，只有那一頁是熱的，滿了就往右開新頁。換成隨機的 UUID v4，每次新增都落在樹裡隨機一個葉頁：要待在記憶體裡的頁變多，頁分裂到處發生，而且隨機插入的 B-tree，葉頁平均只有大約七成滿。等索引大到放不進記憶體，每次新增都可能先來一次隨機讀。解法是用依時間排序的 ID，例如 UUID v7（PostgreSQL 18 內建 <code>uuidv7()</code>）或 Snowflake 式的 ID。在 InnoDB 這件事更嚴重，因為整張表就是那棵叢集索引。</p>
<h4>深層分頁，有索引也救不了</h4>
<p><code>OFFSET 100000 LIMIT 20</code> 就算有索引，也得沿著葉頁一格一格數過 100,000 個項目，而且每一個通常都回資料表讀過，再全部丟掉。改用「從上次最後一筆接著讀」的鍵集分頁（keyset pagination）：<code>WHERE (created_at, id) &lt; ($1, $2) ORDER BY created_at DESC, id DESC LIMIT 20</code>，配上 <code>(created_at, id)</code> 的索引，不管翻到第幾頁都一樣快。多帶一個 <code>id</code>，是為了時間一模一樣時順序也固定，不會漏掉或重複。</p>
<h4>低基數欄位</h4>
<p><code>is_vip</code> 這種只有兩種值的欄位，單獨建索引幾乎沒用：一個值就佔了一大半的表。例外是你查的那個值極少見，例如只有 0.1% 是 VIP，而你天天在找 VIP。這時用部分索引 <code>WHERE is_vip</code> 更省。</p>
<h4>資安：索引也是一份資料</h4>
<ul>
<li><b>使用者輸入的 LIKE 是一種阻斷服務。</b>搜尋框把使用者打的字直接塞進 <code>LIKE '%' || $1 || '%'</code>，使用者自己打的 <code>%</code>、<code>_</code> 也會被當成萬用字元，一串精心設計的長字串，就能讓每一列的比對都變慢，而這種查詢本來就是全表掃描。要把 <code>%</code>、<code>_</code> 跳脫，限制長度，再加上 <code>statement_timeout</code>（第 3.3 課）。</li>
<li><b>索引裡有原始資料的副本。</b><code>email</code> 上的索引就是一份排好的全體 email。資料要遮罩或刪除時，索引、備份、複本都要一起考慮。</li>
<li><b>欄位加密之後就不能用索引查。</b>應用程式層加密的欄位，資料庫只看得到亂碼，自然沒辦法排序或比範圍。需要精確比對時，常見做法是另外存一個加了金鑰的雜湊值（HMAC）欄位來建索引。</li>
</ul>

<h3>十二、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>建了索引就一定會被用</td><td>規劃器照成本挑做法。取回的列一多，全表掃描本來就比較便宜。</td></tr>
<tr><td>Seq Scan 一定是壞事</td><td>小表、或要拿大部分列的查詢，Seq Scan 是正確答案。要擔心的是大表上「讀很多、留很少」。</td></tr>
<tr><td>EXPLAIN 的 cost 是毫秒</td><td>是相對單位，「循序讀一頁」算 1。只能拿來比較同一個查詢的不同做法。</td></tr>
<tr><td>複合索引的欄位順序無所謂</td><td>順序決定能用在哪些查詢。等號的欄位放前面，範圍和排序的放最後。</td></tr>
<tr><td>索引越多，資料庫越快</td><td>讀變快，寫變慢，還吃記憶體。沒在用的索引只有成本。</td></tr>
<tr><td>PostgreSQL 的資料照主鍵順序存</td><td>PostgreSQL 的表是沒有順序的 heap。照主鍵排的是 MySQL InnoDB。</td></tr>
<tr><td>同一個查詢第二次快，是資料庫「學會了」</td><td>通常只是第一次把頁讀進快取，第二次變成 shared hit。</td></tr>
</table>

<h3>十三、跟你的工作連起來</h3>
<ul>
<li><b>Node.js／TypeScript 的 ORM</b>（Prisma、TypeORM、Sequelize）：查詢是 ORM 幫你產生的，你看不到就修不了。開發環境一定要打開它的查詢日誌，N+1 和不必要的 <code>SELECT *</code> 一眼就看得出來。拿到產生出來的 SQL，丟進 <code>EXPLAIN ANALYZE</code>。</li>
<li><b>Go 的 database/sql、sqlx</b>：SQL 是你自己寫的，記得每一個 <code>WHERE</code> 和 <code>ORDER BY</code> 都對一下索引。</li>
<li><b>遊戲後端</b>：排行榜 <code>ORDER BY score DESC LIMIT 100</code> 要有 <code>(season_id, score DESC)</code> 這種索引；玩家的對局紀錄要用鍵集分頁；配對時查「還在等待中」的玩家，正好用部分索引。</li>
<li><b>前端（Vue、Cocos、Unity 的列表畫面）</b>：無限捲動和「載入更多」，請後端給你游標（cursor）而不是頁碼，這就是鍵集分頁在介面上的樣子。</li>
<li><b>Docker 與雲端</b>：本機用 Docker 跑的 PostgreSQL 預設沒開 pg_stat_statements，要加啟動參數；雲端代管的 PostgreSQL 多半已經支援，通常只要 <code>CREATE EXTENSION</code>。資料庫遷移（migration）裡的 <code>CREATE INDEX</code>，上正式環境前一律改成 CONCURRENTLY。</li>
</ul>

<h3>十四、面試會怎麼問</h3>
<p>這些題目在後端、DevOps、資料庫相關職缺都很常見。先自己出聲講一遍，再打開參考答案。</p>
<ol>
<li>「資料庫的索引為什麼大多用 B-tree，而不是二元搜尋樹或雜湊表？」</li>
<li>「有一個複合索引 (a, b, c)。哪些查詢用得上它，哪些用不上？」</li>
<li>「你建了索引，EXPLAIN 卻還是 Seq Scan。可能是哪些原因？你會怎麼查？」</li>
<li>「什麼是覆蓋索引？PostgreSQL 的 Index Only Scan 為什麼有時候還是會讀資料表？」</li>
<li>「上線後資料庫 CPU 很高。你怎麼找出是哪個查詢、怎麼決定先修哪一個？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>資料庫一次讀一頁，所以要最小化的是「讀幾頁」。B-tree 一個節點就是一頁，扇出好幾百，一億列只有三、四層，上層幾乎永遠在記憶體裡，查一列只碰一兩次磁碟；二元樹要二、三十層。它還保持平衡、葉頁相連，所以範圍查詢和排序也能順便用。雜湊表只能做等值比對，不能做範圍和排序。</li>
<li>索引照 a、再照 b、再照 c 排。用得上：a；a 和 b；a、b、c；a 等值加 b 的範圍；a 等值加 <code>ORDER BY b</code>。用不上或用得很差：只有 b、只有 c、b 和 c。如果 a 是範圍條件，b 和 c 就沒辦法再縮小掃描範圍。新版 MySQL 和 PostgreSQL 有 skip scan，但只在 a 的值很少時有效。</li>
<li>先看估計列數和實際列數：如果條件本來就留下很多列，全表掃描是對的。其他常見原因：統計資料過期（跑 ANALYZE）、欄位被包了函式或轉型、型別不一致、LIKE 開頭是萬用字元、欄位之間有關聯造成估計錯誤、<code>random_page_cost</code> 對 SSD 太保守、prepared statement 用了通用計畫。我會用 <code>EXPLAIN (ANALYZE, BUFFERS)</code> 看實際情況，再一項一項排除。</li>
<li>查詢需要的欄位全都在索引裡，資料庫不必回資料表，就叫覆蓋索引；PostgreSQL 可以用 INCLUDE 加入非鍵欄位。PostgreSQL 的索引沒有可見性資訊，要查可見性地圖：頁沒有被標成全部可見（最近有改動、VACUUM 還沒跑），就得回資料表確認，計畫裡的 Heap Fetches 就是次數。</li>
<li>先用 pg_stat_statements（或 MySQL 的 performance_schema）依總執行時間排序，因為「次數 × 平均時間」才是對資料庫的總負載；一個 5 毫秒但跑一百萬次的查詢，比一個 2 秒跑兩次的更值得修。挑前幾名，用真實參數跑 EXPLAIN ANALYZE，對照估計和實際、找出丟掉最多列和讀最多頁的節點，修完歸零統計再觀察一天。</li>
</ol>
</details>

<h3>十五、練功題（做得出來才算真的懂）</h3>
<ol>
<li>一個索引每頁放 250 個項目。5,000 萬列需要幾層？20 億列呢？</li>
<li>索引是 <code>(tenant_id, status, created_at)</code>。下面四個條件，各能用到索引的哪幾個欄位？(a) <code>tenant_id = 1 AND status = 'open' ORDER BY created_at</code>　(b) <code>status = 'open'</code>　(c) <code>tenant_id = 1 AND created_at &gt; '2026-11-01'</code>　(d) <code>tenant_id = 1 AND status IN ('open', 'paid')</code></li>
<li>一個 Nested Loop 的內層節點顯示 <code>actual time=0.080..0.085 rows=1 loops=25000</code>。這個節點總共花了多少時間？你會怎麼改善？</li>
<li>把這兩個條件改寫成用得上一般 B-tree 索引的樣子：<code>WHERE date_trunc('day', created_at) = '2026-11-09'</code>，以及 <code>WHERE score + 10 &gt; 500</code>。</li>
<li>在上一課那張一百萬列的練習表上動手做（表名換成你自己建的）：先建一個只有 user_id 的索引，再分別跑 <code>EXPLAIN SELECT * FROM rounds WHERE user_id &lt; 50;</code> 和 <code>WHERE user_id &lt; 50000;</code>。兩個計畫各是哪一種掃描？用這一章的話解釋為什麼。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>250² = 62,500，250³ ≈ 1,560 萬，250⁴ ≈ 39 億。5,000 萬超過 1,560 萬，所以要 4 層；20 億還不到 39 億，也是 4 層。從 5,000 萬長到 20 億，樹的高度沒變。</li>
<li>(a) 三個欄位全用上：前兩個等值定位，第三個直接提供排序。(b) 用不上，最左邊的 tenant_id 沒給（除非 skip scan，且 tenant_id 的值很少）。(c) 只有 tenant_id 能縮小範圍；status 沒給，created_at 在 tenant 1 的那一段裡不是排好的，只能邊讀邊檢查。(d) tenant_id 和 status 都用上，資料庫對 IN 裡的每個值各定位一次；但結果要照 created_at 排序的話，兩段要另外合併排序。</li>
<li>平均每次約 0.085 毫秒 × 25,000 次 ≈ 2.1 秒。先看外層為什麼有 25,000 列：條件能不能更早篩掉？再看內層每次是不是走了好的索引；如果外層真的很多列，改成 Hash Join（一次把內層讀進記憶體）可能更快，通常是統計資料修正後，規劃器就會自己換。</li>
<li><code>WHERE created_at &gt;= '2026-11-09' AND created_at &lt; '2026-11-10'</code>（帶時區的欄位要想清楚是哪一天的零點）；<code>WHERE score &gt; 490</code>。原則都一樣：讓欄位保持原樣，把計算移到常數那一邊。</li>
<li>小範圍（user_id &lt; 50，大約 500 列）多半是 Bitmap Index Scan 加 Bitmap Heap Scan，或 Index Scan；大範圍（大約一半的表）是 Seq Scan。取回的比例越過交叉點後，隨機讀的總成本超過循序讀整張表，規劃器就換做法。這正是第六節那張圖。</li>
</ol>
</details>

<h3>十六、想再挖深</h3>
<ul>
<li><b>PostgreSQL 官方文件〈Indexes〉與〈Using EXPLAIN〉</b>（<a href="https://www.postgresql.org/docs/current/using-explain.html">postgresql.org/docs/current/using-explain.html</a>）：本章的 EXPLAIN 讀法、成本計算，都是從這裡來的，寫得非常清楚。</li>
<li><b>Markus Winand《SQL Performance Explained》與免費網站 Use The Index, Luke</b>（<a href="https://use-the-index-luke.com/">use-the-index-luke.com</a>）：整本只講索引，涵蓋 PostgreSQL、MySQL、Oracle、SQL Server，是開發者讀索引最好的一本。</li>
<li><b>Egor Rogov《PostgreSQL 14 Internals》</b>：Postgres Professional 免費提供的電子書，頁、MVCC、B-tree、規劃器的內部都有圖解。</li>
<li><b>CMU 15-445／645 Database Systems</b>（Andy Pavlo，YouTube 免費）：大學的資料庫系統課，磁碟上的頁、緩衝池、B+tree、查詢執行都有完整一講。</li>
<li><b>Martin Kleppmann《Designing Data-Intensive Applications》第 3 章</b>：把 B-tree 和 LSM-tree 兩大派放在一起比較，讀完你就知道為什麼有些資料庫寫入特別快。</li>
</ul>
` });
