DEEP({ 'db-shard': `
<p>上一課給了一把擴展的梯子，最上面那一階是分片。這一章把那一階拆開來看：一台機器的極限到底在哪裡、為什麼讀取副本救不了寫入；同一台資料庫裡怎麼把大表切塊；資料分到很多台機器時，有哪幾種分法、各自在擴充時要搬多少資料；一致性雜湊那個「環」到底怎麼運作；分片鍵怎麼選；跨分片的查詢和交易為什麼又慢又難；系統還在線上時怎麼把 4 片拆成 8 片；最後用白話講 Vitess、Citus、CockroachDB、TiDB、Spanner 這些分散式 SQL 在背後幫你做了什麼。這些是系統設計面試的核心題，也是你真的遇到大流量時，決定要不要花半年工程時間的依據。</p>

<h3><span class="badge lv1">基礎</span>一、一台機器的天花板：垂直擴展與水平擴展</h3>
<p>想像一家生意太好的麵店。第一個辦法是搬到更大的店面、請更多廚師，這叫<b>垂直擴展</b>（vertical scaling）：同一家店，變大。第二個辦法是開分店，這叫<b>水平擴展</b>（horizontal scaling）：店變多。開分店的麻煩馬上就來了：熟客的點數記在哪一家？兩家店之間怎麼調貨？一份訂單要兩家店一起出餐，誰負責對帳？分片的所有難題，都是這幾個問題的資料庫版本。</p>
<h4>垂直擴展比你想的走得遠，但終究有頂</h4>
<p>雲端上最大的機型有上百個 vCPU、好幾 TB 的記憶體，一台調校得好的 PostgreSQL 撐每秒數千筆交易很常見。但它有幾個躲不掉的天花板：</p>
<ul>
<li><b>價格不是線性的</b>：最大那幾級機型，每多一倍效能，價錢常常不只多一倍。</li>
<li><b>寫入集中在一個點</b>：所有寫入都要寫進同一條 WAL、搶同一批鎖。CPU 再多，這條單線道也不會變寬。</li>
<li><b>跟大小成正比的維運時間</b>：10 TB 的資料庫，就算以每秒 500 MB 還原，也要 20,000 秒，大約 5.6 小時；重建一台副本、建一個新索引、改一個大表的 schema，全都跟著變慢。資料越大，出事後的恢復時間（RTO）越長。</li>
</ul>
<h4>讀取副本為什麼救不了寫入</h4>
<p>讀取副本很好用：讀不夠就多開幾台。但每一台副本都要重播主庫的<b>每一筆</b>寫入，所以整個複寫叢集的寫入能力，永遠等於一台主庫。這就是分片真正要解決的兩件事：<b>寫入量</b>和<b>資料量</b>超過了一台機器。如果你的問題只是讀太多，加副本和快取就好，不需要分片。</p>

<h3><span class="badge lv1">基礎</span>二、先在一台資料庫裡切表：分割表</h3>
<p><b>分割表</b>（partitioning）是把一張大表在同一台資料庫裡存成好幾塊。應用程式照樣查 <code>rounds</code> 這張表，資料庫自己知道要去哪幾塊找。PostgreSQL 10 開始支援這種宣告式的分割：</p>
<pre><code>CREATE TABLE rounds (
  id         bigint,
  player_id  bigint,
  played_at  timestamptz NOT NULL,
  result     text,
  PRIMARY KEY (id, played_at)          -- 主鍵必須包含分割鍵
) PARTITION BY RANGE (played_at);

CREATE TABLE rounds_2026_11 PARTITION OF rounds
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');</code></pre>
<figure class="figure"><svg viewBox="0 0 680 248" class="fg" style="width:100%;max-width:680px" role="img" aria-label="查詢條件包含 11 月的日期，資料庫只掃 rounds_2026_11 這一塊，其他月份直接跳過；最舊的 2025 年 11 月那一塊用 DROP TABLE 瞬間刪掉">
<text x="580" y="20" text-anchor="middle" class="fg-t sm">子表：一個月一塊</text>
<rect x="16" y="95" width="240" height="56" rx="6" class="fg-b"/>
<text x="28" y="118" class="fg-t sm mono">SELECT * FROM rounds</text>
<text x="28" y="138" class="fg-t sm mono">WHERE played_at &gt;= '2026-11-05'</text>
<line x1="256" y1="123" x2="282" y2="123" class="fg-l"/><polygon points="290,123 282,118.5 282,127.5" class="fg-a"/>
<rect x="290" y="95" width="140" height="56" rx="6" class="fg-b alt"/>
<text x="360" y="118" text-anchor="middle" class="fg-t">rounds</text>
<text x="360" y="138" text-anchor="middle" class="fg-t sm">母表，本身不存資料</text>
<path d="M465 45 H500 M465 87 H500 M465 129 H500 M465 45 V123" class="fg-l dim dash"/>
<path d="M430 123 H465 V171 H492" class="fg-l on"/><polygon points="500,171 492,166.5 492,175.5" class="fg-a on"/>
<text x="455" y="70" text-anchor="end" class="fg-t sm">其他月份：直接跳過</text>
<rect x="500" y="30" width="160" height="30" rx="5" class="fg-b"/><text x="580" y="50" text-anchor="middle" class="fg-t sm mono">rounds_2026_08</text>
<rect x="500" y="72" width="160" height="30" rx="5" class="fg-b"/><text x="580" y="92" text-anchor="middle" class="fg-t sm mono">rounds_2026_09</text>
<rect x="500" y="114" width="160" height="30" rx="5" class="fg-b"/><text x="580" y="134" text-anchor="middle" class="fg-t sm mono">rounds_2026_10</text>
<rect x="500" y="156" width="160" height="30" rx="5" class="fg-b hot"/><text x="580" y="176" text-anchor="middle" class="fg-t sm mono acc">rounds_2026_11</text>
<rect x="500" y="206" width="160" height="30" rx="5" class="fg-b warm"/><text x="580" y="226" text-anchor="middle" class="fg-t sm mono">rounds_2025_11</text>
<text x="490" y="226" text-anchor="end" class="fg-t sm warm">DROP TABLE：整個月瞬間刪掉</text>
</svg><figcaption>查詢帶著分割鍵，資料庫就只碰需要的那一塊，這叫分割區修剪（partition pruning）。刪舊資料也不必一列一列刪，整塊丟掉就好。</figcaption></figure>
<p>用數字感受一下差別：這張表每個月 3,000 萬列。要刪掉一年前的資料，<code>DELETE ... WHERE played_at &lt; ...</code> 要一列一列標記刪除，產生好幾 GB 的 WAL、讓副本延遲暴增，之後還要 VACUUM 慢慢回收空間；而 <code>DROP TABLE rounds_2025_11</code> 只改一點目錄資料、刪掉幾個檔案，幾毫秒就結束。想先留著備查，可以用 <code>ALTER TABLE rounds DETACH PARTITION rounds_2025_11</code> 把它拆成一張獨立的表（PostgreSQL 14 起可以加 <code>CONCURRENTLY</code>，不擋住正在跑的查詢）。</p>
<h4>三種切法</h4>
<ul>
<li><b>範圍</b>（<code>PARTITION BY RANGE</code>）：照時間或數字區間切，最常見，特別適合「新資料常查、舊資料要丟」的歷史表。</li>
<li><b>清單</b>（<code>PARTITION BY LIST</code>）：照固定的幾個值切，例如地區 <code>'tw'</code>、<code>'jp'</code>、<code>'us'</code>。</li>
<li><b>雜湊</b>（<code>PARTITION BY HASH</code>，PostgreSQL 11 起）：照某個欄位的雜湊值平均分成 N 塊，讓每一塊一樣大。但這樣就不能整塊刪舊資料了。</li>
</ul>
<h4>三個常見的坑</h4>
<ol>
<li><b>查詢沒帶分割鍵</b>：<code>WHERE player_id = 42</code> 沒有時間條件，就得每一塊都掃一次，比沒分割還慢。</li>
<li><b>忘了建下個月的分割區</b>：12 月 1 日 00:00 一到，寫入找不到可以放的地方就失敗。要用排程或 <code>pg_partman</code> 這類擴充套件，提前把未來幾個月建好。</li>
<li><b>切得太碎</b>：幾千個分割區會讓查詢規劃變慢。以月或週為單位，通常就夠了。</li>
</ol>

<h3><span class="badge lv2">進階</span>三、資料分到很多台：範圍、雜湊、目錄</h3>
<p><b>分片</b>（sharding）跟分割表是同一個想法，只是每一塊放在<b>不同的資料庫伺服器</b>上。決定一列資料去哪一台的那個欄位，叫<b>分片鍵</b>（shard key）。從分片鍵算出「哪一台」，有三種基本的做法：</p>
<figure class="figure"><svg viewBox="0 0 680 236" class="fg" style="width:100%;max-width:680px" role="img" aria-label="三種分片法並排：範圍分片依區間決定分片，新使用者會擠在最後一片；雜湊分片用雜湊值除以分片數取餘數，分布平均但改分片數要搬大部分資料；目錄分片查一張對照表，最有彈性但目錄本身要高可用">
<line x1="222.5" y1="12" x2="222.5" y2="230" class="fg-l dim dash"/><line x1="447.5" y1="12" x2="447.5" y2="230" class="fg-l dim dash"/>
<text x="115" y="26" text-anchor="middle" class="fg-t acc">範圍（range）</text>
<rect x="20" y="44" width="190" height="38" rx="5" class="fg-b"/><text x="30" y="68" class="fg-t sm">1～100 萬</text><text x="200" y="68" text-anchor="end" class="fg-t sm">&rarr; 分片 A</text>
<rect x="20" y="90" width="190" height="38" rx="5" class="fg-b"/><text x="30" y="114" class="fg-t sm">100 萬～200 萬</text><text x="200" y="114" text-anchor="end" class="fg-t sm">&rarr; 分片 B</text>
<rect x="20" y="136" width="190" height="38" rx="5" class="fg-b warm"/><text x="30" y="160" class="fg-t sm">200 萬以後</text><text x="200" y="160" text-anchor="end" class="fg-t sm">&rarr; 分片 C</text>
<text x="115" y="196" text-anchor="middle" class="fg-t sm warm">新註冊的全擠在 C</text>
<text x="115" y="222" text-anchor="middle" class="fg-t sm acc">＋範圍查詢、拆分都容易</text>
<text x="340" y="26" text-anchor="middle" class="fg-t acc">雜湊（hash mod N）</text>
<rect x="245" y="44" width="190" height="38" rx="5" class="fg-b alt"/><text x="340" y="67" text-anchor="middle" class="fg-t sm mono">hash(42) % 3 = 0</text>
<line x1="273" y1="82" x2="273" y2="102" class="fg-l on"/><polygon points="273,110 268.5,102 277.5,102" class="fg-a on"/>
<text x="281" y="100" class="fg-t sm acc">餘 0</text>
<rect x="245" y="110" width="56" height="34" rx="5" class="fg-b hot"/><text x="273" y="132" text-anchor="middle" class="fg-t">A</text>
<rect x="312" y="110" width="56" height="34" rx="5" class="fg-b"/><text x="340" y="132" text-anchor="middle" class="fg-t">B</text>
<rect x="379" y="110" width="56" height="34" rx="5" class="fg-b"/><text x="407" y="132" text-anchor="middle" class="fg-t">C</text>
<text x="340" y="166" text-anchor="middle" class="fg-t sm">每片大約三分之一</text>
<text x="340" y="196" text-anchor="middle" class="fg-t sm warm">N 從 3 變 4：75% 要搬</text>
<text x="340" y="222" text-anchor="middle" class="fg-t sm acc">＋分得最平均</text>
<text x="565" y="26" text-anchor="middle" class="fg-t acc">目錄（directory）</text>
<rect x="470" y="44" width="190" height="100" rx="5" class="fg-b"/>
<text x="565" y="62" text-anchor="middle" class="fg-t sm">分片鍵 &rarr; 分片</text>
<line x1="470" y1="70" x2="660" y2="70" class="fg-l dim"/>
<text x="565" y="88" text-anchor="middle" class="fg-t sm mono">user 42  &rarr; A</text>
<text x="565" y="110" text-anchor="middle" class="fg-t sm mono">user 77  &rarr; C</text>
<text x="565" y="132" text-anchor="middle" class="fg-t sm mono warm">tenant 9 &rarr; D</text>
<text x="565" y="166" text-anchor="middle" class="fg-t sm">先查表，再去對的分片</text>
<text x="565" y="196" text-anchor="middle" class="fg-t sm warm">目錄自己要快、要高可用</text>
<text x="565" y="222" text-anchor="middle" class="fg-t sm acc">＋想搬哪個鍵都可以</text>
</svg><figcaption>三種方法回答的是同一個問題：給我一個分片鍵，告訴我它住哪一台。差別在分得平不平均、擴充時要搬多少，以及多了什麼要維護。</figcaption></figure>
<h4>範圍分片（range sharding）</h4>
<p>照分片鍵的區間切：使用者 1 到 100 萬在 A、100 萬到 200 萬在 B。好處是範圍查詢很快（「ID 介於 X 到 Y 的使用者」只需要問一兩台），某一片太大時，從中間切一刀拆成兩片也很直覺。壞處是：如果分片鍵會一直變大（自動遞增的 ID、時間），<b>所有新寫入都擠在最後一片</b>，其他片閒著。</p>
<h4>雜湊取餘數（hash mod N）</h4>
<p>算 <code>hash(user_id) % N</code>，餘數就是分片編號。雜湊會把相鄰的 ID 打散，所以分布很平均。致命傷在 N 改變的時候：一個鍵要留在原地，必須新舊兩個餘數剛好相同。從 N 台變成 N＋1 台，只有大約 1／(N＋1) 的鍵能留下。用 3 台變 4 台算一次：</p>
<table>
<tr><th>雜湊值</th><th>0</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th><th>9</th><th>10</th><th>11</th></tr>
<tr><td>除以 3 的餘數</td><td>0</td><td>1</td><td>2</td><td>0</td><td>1</td><td>2</td><td>0</td><td>1</td><td>2</td><td>0</td><td>1</td><td>2</td></tr>
<tr><td>除以 4 的餘數</td><td>0</td><td>1</td><td>2</td><td>3</td><td>0</td><td>1</td><td>2</td><td>3</td><td>0</td><td>1</td><td>2</td><td>3</td></tr>
<tr><td>要搬嗎</td><td>留</td><td>留</td><td>留</td><td>搬</td><td>搬</td><td>搬</td><td>搬</td><td>搬</td><td>搬</td><td>搬</td><td>搬</td><td>搬</td></tr>
</table>
<p>12 個裡只有 3 個能留下，75% 要搬家。10 TB 的資料要搬 7.5 TB，而且搬的期間每個查詢都要想辦法知道「這一列現在在新家還是舊家」。這就是為什麼沒有人在正式環境裡直接用 mod N 然後打算以後再加機器。</p>
<h4>目錄（directory）</h4>
<p>另外存一張對照表：哪個鍵在哪一片。最有彈性：一個特別大的客戶可以單獨搬到自己的一台，想搬哪個鍵就搬哪個，只要改一列對照表。代價是每次查詢都多查一次目錄，所以目錄要放在快取裡，而且它本身變成整個系統最關鍵的服務：目錄掛了，所有人都找不到資料。</p>

<h3><span class="badge lv2">進階</span>四、一致性雜湊：加一台只搬一小段</h3>
<p><b>一致性雜湊</b>（consistent hashing）想解決的，就是 mod N 那個「加一台全部搬家」的問題。做法是把雜湊值的範圍（例如 0 到 2<sup>32</sup>−1）想成一個首尾相接的環：</p>
<ol>
<li>每台機器用自己的名字算雜湊，放在環上的某個位置。</li>
<li>每個鍵也算雜湊，放在環上。</li>
<li>鍵從自己的位置<b>順時針</b>走，碰到的第一台機器就是它的主人。</li>
</ol>
<figure class="figure"><svg viewBox="0 0 680 310" class="fg" style="width:100%;max-width:680px" role="img" aria-label="兩個一致性雜湊環：左邊三台機器 A、B、C，C 負責從 B 到 C 這一段；右邊加入 D 之後，只有從 B 到 D 這一段的鍵改歸 D，其他鍵都不動">
<circle cx="170" cy="150" r="100" class="fg-l"/>
<path d="M256.6 200 A100 100 0 0 1 83.4 200" class="fg-l alt"/>
<circle cx="246.6" cy="85.7" r="4.5" class="fg-lamp on"/><text x="265" y="72" text-anchor="middle" class="fg-t sm">k1</text>
<circle cx="270" cy="150" r="4.5" class="fg-lamp on"/><text x="294" y="154" text-anchor="middle" class="fg-t sm">k2</text>
<circle cx="195.9" cy="246.6" r="4.5" class="fg-lamp on"/><text x="202" y="272" text-anchor="middle" class="fg-t sm">k3</text>
<circle cx="112.6" cy="231.9" r="4.5" class="fg-lamp on"/><text x="99" y="256" text-anchor="middle" class="fg-t sm">k4</text>
<circle cx="76" cy="115.8" r="4.5" class="fg-lamp on"/><text x="53" y="110" text-anchor="middle" class="fg-t sm">k5</text>
<circle cx="120" cy="63.4" r="4.5" class="fg-lamp on"/><text x="108" y="44" text-anchor="middle" class="fg-t sm">k6</text>
<circle cx="170" cy="50" r="15" class="fg-b hot"/><text x="170" y="55" text-anchor="middle" class="fg-t">A</text>
<circle cx="256.6" cy="200" r="15" class="fg-b hot"/><text x="256.6" y="205" text-anchor="middle" class="fg-t">B</text>
<circle cx="83.4" cy="200" r="15" class="fg-b alt"/><text x="83.4" y="205" text-anchor="middle" class="fg-t">C</text>
<text x="170" y="146" text-anchor="middle" class="fg-t sm">往順時針</text>
<text x="170" y="163" text-anchor="middle" class="fg-t sm">找第一台</text>
<circle cx="510" cy="150" r="100" class="fg-l"/>
<path d="M596.6 200 A100 100 0 0 1 492.6 248.5" class="fg-l warm"/>
<path d="M492.6 248.5 A100 100 0 0 1 423.4 200" class="fg-l alt"/>
<circle cx="586.6" cy="85.7" r="4.5" class="fg-lamp on"/><text x="605" y="72" text-anchor="middle" class="fg-t sm">k1</text>
<circle cx="610" cy="150" r="4.5" class="fg-lamp on"/><text x="634" y="154" text-anchor="middle" class="fg-t sm">k2</text>
<circle cx="535.9" cy="246.6" r="4.5" class="fg-lamp on"/><text x="548" y="272" text-anchor="middle" class="fg-t sm warm">k3 換主人</text>
<circle cx="452.6" cy="231.9" r="4.5" class="fg-lamp on"/><text x="439" y="256" text-anchor="middle" class="fg-t sm">k4</text>
<circle cx="416" cy="115.8" r="4.5" class="fg-lamp on"/><text x="393" y="110" text-anchor="middle" class="fg-t sm">k5</text>
<circle cx="460" cy="63.4" r="4.5" class="fg-lamp on"/><text x="448" y="44" text-anchor="middle" class="fg-t sm">k6</text>
<circle cx="510" cy="50" r="15" class="fg-b hot"/><text x="510" y="55" text-anchor="middle" class="fg-t">A</text>
<circle cx="596.6" cy="200" r="15" class="fg-b hot"/><text x="596.6" y="205" text-anchor="middle" class="fg-t">B</text>
<circle cx="423.4" cy="200" r="15" class="fg-b alt"/><text x="423.4" y="205" text-anchor="middle" class="fg-t">C</text>
<circle cx="492.6" cy="248.5" r="15" class="fg-b warm"/><text x="492.6" y="253.5" text-anchor="middle" class="fg-t">D</text>
<text x="510" y="146" text-anchor="middle" class="fg-t sm">加入 D</text>
<text x="510" y="163" text-anchor="middle" class="fg-t sm">只動一段</text>
<text x="170" y="300" text-anchor="middle" class="fg-t sm">3 台：藍色這段（B 到 C）歸 C</text>
<text x="510" y="300" text-anchor="middle" class="fg-t sm">加入 D：只有橘色這段改歸 D</text>
</svg><figcaption>D 插進 B 和 C 之間，只會從 C 手上接走 B 到 D 這一段的鍵。A、B 的鍵一個都不動。</figcaption></figure>
<p>加入第 N＋1 台時，平均只有大約 1／(N＋1) 的鍵要搬，而且只從新機器旁邊那一台搬過去。3 台變 4 台，搬 25%，不是 75%。</p>
<h4>虛擬節點：讓每台分得一樣多</h4>
<p>只有 3 台機器時，它們在環上的位置是隨機的，很可能 A 和 B 擠在一起，C 一個人分到半個環。解法是<b>虛擬節點</b>（virtual nodes）：每台實體機器在環上放 100 到 200 個點（例如用 <code>A#0</code>、<code>A#1</code>…分別算雜湊），每台負責的總長度就會很接近平均。好處不只平均：新機器加入時，它的幾百個點散在環上各處，會從<b>每一台</b>舊機器各接走一小塊，搬遷的負擔也被平均分攤了。2007 年 Amazon 的 Dynamo 論文把這套做法發揚光大，Cassandra 等系統至今仍用類似的設計。</p>
<h4>實務上更常見的做法：先切很多小份</h4>
<p>很多系統不直接用環，而是<b>先把資料切成固定、數量很多的小份</b>，再把小份分配給機器：</p>
<ul>
<li><b>Redis Cluster</b>：固定 16,384 個雜湊槽（hash slot），每個鍵用 CRC16 算出落在哪個槽，再由一張「槽 → 節點」的表決定在哪台。擴充時是整個槽在搬。</li>
<li><b>Vitess</b>：把分片鍵算成一個 keyspace ID，每個分片負責一段 keyspace ID 的範圍，名字就叫 <code>-80</code>、<code>80-</code> 這種十六進位的區間。拆分時把 <code>-80</code> 拆成 <code>-40</code> 和 <code>40-80</code>。</li>
<li><b>邏輯分片</b>：一開始就切 1,024 個邏輯分片，放在 4 台機器上，每台 256 個。加到 8 台時，把一半的邏輯分片整個搬過去就好，不需要重新計算任何一列屬於誰。</li>
</ul>
<p>這個想法的精神是：<b>「鍵屬於哪一份」永遠不變，變的只有「這一份放在哪台」</b>。它跟一致性雜湊解決的是同一個問題，只是更好管理、更好觀察。</p>

<h3><span class="badge lv3">專業</span>五、選分片鍵：一旦選了，幾乎改不掉</h3>
<p>分片鍵決定了以後每一個查詢的命運，換掉它等於把整個資料庫重新搬一次。上一課說它要有很多不同的值、能平均分散負載、幾乎每個查詢都帶著它。再補兩條：<b>它要讓一個交易盡量只碰一片</b>，以及<b>它的值不會改變</b>（改分片鍵的值，等於要把那一列搬到另一台）。</p>
<table>
<tr><th>產品</th><th>好的分片鍵</th><th>要小心的地方</th></tr>
<tr><td>一般消費者產品、遊戲</td><td>使用者 ID</td><td>全站排行榜、名稱不能重複這類跨使用者的功能</td></tr>
<tr><td>多租戶 SaaS</td><td>租戶 ID（tenant ID）</td><td>一個超大客戶就塞滿一片，要能把他單獨搬走</td></tr>
<tr><td>聊天</td><td>對話 ID</td><td>「我所有的對話」要另外建索引</td></tr>
<tr><td>物聯網感測資料</td><td>裝置 ID（分片內再按時間分割）</td><td>跨裝置的統計交給分析系統</td></tr>
</table>
<p>壞的分片鍵也很好認：<b>建立時間</b>（所有寫入擠在最新那一片）、<b>國家或狀態</b>（只有幾個值，而且極度不平均）、<b>會變的欄位</b>（例如等級）。</p>
<h4>同一個鍵的資料放在一起</h4>
<p>如果 <code>players</code>、<code>wallets</code>、<code>rounds</code> 三張表都用 <code>player_id</code> 分片，同一個玩家的三種資料就會住在同一片上。「玩一局猜高低、扣點數、寫一筆紀錄」就是單一分片裡的普通交易，跟沒分片時一模一樣。Citus 把這叫作共置（co-location）。另外，像遊戲設定這種很小、大家都要 join 的表，可以在每一片上都放一份完整複本，Citus 叫它參考表（reference table）。</p>
<h4>跨使用者的需求怎麼辦</h4>
<p>以「使用者名稱不能重複」為例：名稱 <code>alice</code> 和使用者 ID 42 不見得在同一片，資料庫的唯一約束只管得了一片裡面。常見的做法是另外建一張 <code>usernames</code> 表，<b>用名稱本身當分片鍵</b>，在那張表上做唯一約束。註冊時先在 <code>usernames</code> 搶下名稱，成功了再建立使用者；建立失敗就把名稱釋放。用 email 登入也是同一招：一張用 email 分片的對照表，查出 user ID，再去對的分片。Vitess 把這種對照表做成內建功能，叫 lookup vindex。</p>
<h4>ID 怎麼產生</h4>
<p>分片之後，每一片自己的自動遞增會撞號。常見的解法：</p>
<ul>
<li><b>UUID</b>：隨機產生，完全不用協調。缺點是 16 位元組、沒有順序，B-tree 索引的插入位置到處跳。2024 年定案的 RFC 9562 裡的 <b>UUIDv7</b> 把時間放在最前面，大致照時間排序，改善了這個問題。</li>
<li><b>Snowflake</b>：Twitter 在 2010 年公開的格式。64 位元裡放 41 位元的毫秒時間戳、10 位元的機器編號、12 位元的序號，所以每台機器每毫秒最多 4,096 個 ID，而且大致照時間遞增，存成 <code>bigint</code> 就好。</li>
<li><b>把分片編號放進 ID</b>：Instagram 早年的做法是在 ID 裡放時間戳、分片編號和序號，看 ID 就知道它在哪一片。</li>
</ul>

<h3><span class="badge lv3">專業</span>六、跨分片的查詢與交易</h3>
<h4>查詢沒帶分片鍵：分散再收集</h4>
<p>「找出最近一小時所有玩過猜高低的玩家」沒有分片鍵，路由層只能問每一片，再把結果合起來，叫<b>分散再收集</b>（scatter-gather）。它有兩個看不見的成本：</p>
<ul>
<li><b>最慢的那一片決定一切</b>：假設每一片的 p99 延遲是 50 毫秒，也就是每次有 1% 的機會超過 50 毫秒。一個查詢問 20 片，至少有一片超過的機率是 1 − 0.99<sup>20</sup> ≈ 18%。單一片的「百分之一的慢」，變成了整體「將近五分之一的慢」。Google 的 Jeff Dean 把這個現象寫成了一篇很有名的文章〈The Tail at Scale〉。</li>
<li><b>排序加分頁很貴</b>：<code>ORDER BY score DESC LIMIT 10</code>，每一片都要回傳自己的前 10 名，路由層從 200 筆裡挑出前 10 名。但如果是 <code>OFFSET 10000 LIMIT 10</code>，每一片都要回傳 10,010 筆。深分頁在分片系統裡是災難，要改用「從上一頁最後一筆往後找」的游標分頁。</li>
</ul>
<p>加總類的運算要小心拆：<code>COUNT</code> 和 <code>SUM</code> 各片算完再加起來就好；<code>AVG</code> 不能把各片的平均再平均，要拿各片的總和與筆數重算；<code>COUNT(DISTINCT ...)</code> 最難，大系統常用 HyperLogLog 這類近似演算法。</p>
<h4>跨分片交易：兩階段提交</h4>
<p>玩家 A（在分片 1）要轉 100 點給玩家 B（在分片 3）。兩邊都要改，而且要嘛都成功、要嘛都失敗。傳統做法是<b>兩階段提交</b>（two-phase commit，2PC）：</p>
<figure class="figure"><svg viewBox="0 0 680 295" class="fg" style="width:100%;max-width:680px" role="img" aria-label="兩階段提交：協調者先請兩個分片準備，兩邊都回覆可以並鎖住資料列，協調者再通知兩邊提交；如果協調者在兩個階段之間掛掉，兩個分片只能鎖著等">
<rect x="60" y="30" width="100" height="28" rx="5" class="fg-b alt"/><text x="110" y="49" text-anchor="middle" class="fg-t">協調者</text>
<rect x="290" y="30" width="100" height="28" rx="5" class="fg-b"/><text x="340" y="49" text-anchor="middle" class="fg-t">分片 1</text>
<rect x="520" y="30" width="100" height="28" rx="5" class="fg-b"/><text x="570" y="49" text-anchor="middle" class="fg-t">分片 3</text>
<line x1="110" y1="58" x2="110" y2="250" class="fg-l dim"/><line x1="340" y1="58" x2="340" y2="250" class="fg-l dim"/><line x1="570" y1="58" x2="570" y2="250" class="fg-l dim"/>
<line x1="110" y1="84" x2="332" y2="84" class="fg-l"/><polygon points="340,84 332,79.5 332,88.5" class="fg-a"/>
<text x="225" y="78" text-anchor="middle" class="fg-t sm">① 準備好了嗎（PREPARE）</text>
<line x1="110" y1="108" x2="562" y2="108" class="fg-l"/><polygon points="570,108 562,103.5 562,112.5" class="fg-a"/>
<text x="455" y="102" text-anchor="middle" class="fg-t sm">① 準備好了嗎</text>
<line x1="340" y1="140" x2="118" y2="140" class="fg-l"/><polygon points="110,140 118,135.5 118,144.5" class="fg-a"/>
<text x="225" y="134" text-anchor="middle" class="fg-t sm">可以（資料列已鎖住）</text>
<line x1="570" y1="164" x2="118" y2="164" class="fg-l"/><polygon points="110,164 118,159.5 118,168.5" class="fg-a"/>
<text x="455" y="158" text-anchor="middle" class="fg-t sm">可以</text>
<line x1="340" y1="88" x2="340" y2="198" class="fg-l warm"/>
<line x1="570" y1="112" x2="570" y2="222" class="fg-l warm"/>
<text x="348" y="188" class="fg-t sm warm">持有鎖</text>
<text x="578" y="200" class="fg-t sm warm">持有鎖</text>
<line x1="100" y1="182" x2="120" y2="182" class="fg-l warm"/>
<text x="96" y="186" text-anchor="end" class="fg-t sm warm">在這裡掛掉？</text>
<line x1="110" y1="204" x2="332" y2="204" class="fg-l on"/><polygon points="340,204 332,199.5 332,208.5" class="fg-a on"/>
<text x="225" y="198" text-anchor="middle" class="fg-t sm acc">② 提交（COMMIT）</text>
<line x1="110" y1="228" x2="562" y2="228" class="fg-l on"/><polygon points="570,228 562,223.5 562,232.5" class="fg-a on"/>
<text x="455" y="222" text-anchor="middle" class="fg-t sm acc">② 提交</text>
<text x="340" y="278" text-anchor="middle" class="fg-t sm warm">準備好的分片不能自己決定提交或取消，只能鎖著等協調者回來</text>
</svg><figcaption>第一階段大家投票，第二階段才真的提交。兩個階段之間，資料列一直被鎖著；協調者一當機，鎖就不知道要鎖到什麼時候。</figcaption></figure>
<p>2PC 能保證正確，但有三個代價：至少多兩趟網路來回；準備到提交之間資料列一直被鎖，其他交易要等；最麻煩的是協調者在兩階段之間當機，參與者手上的交易處於「不確定」（in-doubt）狀態，不能自己提交、也不能自己取消，只能等協調者恢復，或由人工處理。PostgreSQL 有 <code>PREPARE TRANSACTION</code> 和 <code>COMMIT PREPARED</code> 支援這件事，但預設是關的（<code>max_prepared_transactions = 0</code>），因為忘了處理的準備交易會一直鎖著資料、擋住清理。</p>
<h4>不用 2PC：Saga</h4>
<p>另一個思路是接受「中間狀態」，把一個大交易拆成一串本地交易，每一步都有對應的補償動作，叫 <b>Saga</b>：</p>
<ol>
<li>分片 1：扣 A 的 100 點，並在同一個本地交易裡寫一則「要加給 B」的訊息到寄件匣（下一課會講）。</li>
<li>分片 3：收到訊息，替 B 加 100 點。這一步必須是冪等的，重複收到也只加一次。</li>
<li>如果第 2 步永遠做不成（B 的帳號被停用），就執行補償：把 100 點還給 A。</li>
</ol>
<p>代價是有一小段時間，這 100 點「在路上」：A 已經扣了，B 還沒收到。對很多業務來說這完全可以接受，前提是你清楚地設計了這個中間狀態，而不是假裝它不存在。更好的辦法，是一開始就選一個讓這種交易很少發生的分片鍵。</p>

<h3><span class="badge lv3">專業</span>七、重新平衡：系統還在跑，資料怎麼搬</h3>
<p>某一片滿了、或要從 4 片拆成 8 片，就要<b>重新平衡</b>（rebalancing）。不能停機的話，所有成熟的工具（Vitess 的 Reshard、各家分散式資料庫的自動搬遷）用的都是同一套流程：</p>
<figure class="figure"><svg viewBox="0 0 680 222" class="fg" style="width:100%;max-width:680px" role="img" aria-label="線上重新分片的五個階段：複製快照、串流追變更、比對驗證、短暫停寫並切換、反向同步觀察；切換前舊分片接受寫入，切換後新分片接手">
<text x="500" y="30" text-anchor="middle" class="fg-t sm warm">④ 切換（停寫幾秒）</text>
<text x="12" y="73" class="fg-t">舊分片</text>
<text x="12" y="173" class="fg-t">新分片</text>
<rect x="90" y="50" width="410" height="36" class="fg-b hot"/><text x="295" y="73" text-anchor="middle" class="fg-t">照常接受寫入</text>
<rect x="500" y="50" width="160" height="36" class="fg-b"/><text x="580" y="73" text-anchor="middle" class="fg-t sm">停寫，留著回退</text>
<rect x="90" y="150" width="410" height="36" class="fg-b dash"/><text x="295" y="173" text-anchor="middle" class="fg-t sm">複製中、追趕中</text>
<rect x="500" y="150" width="160" height="36" class="fg-b hot"/><text x="580" y="173" text-anchor="middle" class="fg-t">接手寫入</text>
<line x1="150" y1="86" x2="150" y2="142" class="fg-l on"/><polygon points="150,150 145.5,142 154.5,142" class="fg-a on"/>
<text x="158" y="122" class="fg-t sm acc">① 複製快照</text>
<line x1="285" y1="86" x2="285" y2="142" class="fg-l on dash"/><polygon points="285,150 280.5,142 289.5,142" class="fg-a on"/>
<text x="293" y="122" class="fg-t sm acc">② 串流追變更</text>
<line x1="405" y1="86" x2="405" y2="150" class="fg-l dash"/>
<text x="413" y="122" class="fg-t sm">③ 比對</text>
<line x1="500" y1="38" x2="500" y2="196" class="fg-l warm dash"/>
<line x1="600" y1="150" x2="600" y2="94" class="fg-l alt"/><polygon points="600,86 595.5,94 604.5,94" class="fg-a alt"/>
<text x="608" y="122" class="fg-t sm alt">⑤ 反向同步</text>
<text x="150" y="210" text-anchor="middle" class="fg-t sm">幾小時</text>
<text x="285" y="210" text-anchor="middle" class="fg-t sm">追到只差幾秒</text>
<text x="500" y="210" text-anchor="middle" class="fg-t sm warm">幾秒</text>
<text x="600" y="210" text-anchor="middle" class="fg-t sm">觀察幾天再清掉</text>
</svg><figcaption>真正停止寫入的只有第 ④ 步那幾秒。前面的步驟可以慢慢來；後面的反向同步，是讓你發現問題時還能切回去。</figcaption></figure>
<ol>
<li><b>複製快照</b>：把要搬的資料一次複製到新分片，同時記下複製開始時的日誌位置（MySQL 的 binlog 位置或 GTID、PostgreSQL 的 LSN）。</li>
<li><b>串流追變更</b>：從那個位置開始，讀舊分片的變更日誌，套用到新分片。這跟第 3.4 課的邏輯複寫是同一件事。</li>
<li><b>比對驗證</b>：用校驗碼或逐列比對確認兩邊一致。Vitess 的這個工具叫 VDiff。</li>
<li><b>切換</b>：舊分片短暫停止寫入、等新分片追上最後一筆、把路由改指新分片、恢復寫入。這一步通常只要幾秒。</li>
<li><b>反向同步</b>：切換後，讓新分片的變更也同步回舊分片。萬一新分片有問題，可以馬上切回去，不丟資料。觀察幾天沒問題，才刪掉舊資料。</li>
</ol>
<p>用數字估一次：要搬 2 TB，複製速度每秒 200 MB，第 1 步大約 10,000 秒，將近 3 小時。這段時間主庫每秒還在寫 5 MB 的變更，3 小時累積大約 50 GB，第 2 步要用比每秒 5 MB 更快的速度把它追完。如果新分片套用變更的速度比產生的速度還慢，就永遠追不上，這時只能挑離峰時間、限制批次工作，或讓搬遷的機器更強。</p>
<p>這也是「先切很多小份」那個做法的大優點：Instagram 早年就是一開始切好幾千個邏輯分片，放在少數幾台實體資料庫上。要擴充時，搬的是整個邏輯分片，不用重新判斷任何一列的歸屬，流程簡單得多。</p>

<h3><span class="badge lv4">專家</span>八、熱分片：平均分配了，還是有一片特別忙</h3>
<p>分片鍵選得再好，流量也不會乖乖平均。<b>熱分片</b>（hot shard）的常見原因有四個：</p>
<ul>
<li><b>大客戶</b>：多租戶系統裡，一個大客戶的資料量和流量是一般客戶的上千倍。</li>
<li><b>名人</b>：一個有幾百萬追蹤者的帳號發了一則貼文，所有人同時去讀、去按讚，全部打在同一個分片鍵上。</li>
<li><b>單調遞增的鍵</b>：在範圍分片的系統裡用自動遞增 ID 或時間當鍵，所有新寫入都打在最後一段。</li>
<li><b>時段</b>：某個地區的晚上尖峰，剛好都落在同一片。</li>
</ul>
<p>先要看得到：每一片的每秒查詢數、CPU、p99 延遲要並排畫在同一張圖上，平均值會把熱點完全藏起來。看到之後，對策依情況選：</p>
<ul>
<li><b>拆那一片</b>：範圍分片的好處，從熱的那段中間切一刀。</li>
<li><b>把大客戶搬走</b>：用目錄讓他獨佔一片，或一組分片。</li>
<li><b>鍵加鹽</b>（salting）：一個超熱的計數器，拆成 <code>likes:post42:0</code> 到 <code>likes:post42:9</code> 十個子計數器，寫入時隨機挑一個加，讀取時十個加總。用讀取多一點工作，換寫入分散到十個地方。</li>
<li><b>前面擋一層快取</b>：熱的通常是讀，第 3.5 課的程式內快取和請求合併最有效。</li>
<li><b>每個租戶限流</b>：一個客戶的尖峰，不該拖垮同一片上的其他客戶。</li>
</ul>
<div class="warn">在用範圍切分的分散式資料庫（CockroachDB、TiDB、Spanner）裡，<b>不要用遞增的主鍵</b>。它們會把資料照主鍵的順序切成一段一段，遞增的鍵讓所有寫入都打在最後一段、同一台機器上。這三家的官方文件都特別提醒這件事，並提供各自的解法：雜湊分片索引、TiDB 的 <code>AUTO_RANDOM</code>、或改用 UUID。注意，照時間排序的 UUIDv7 和 Snowflake 在這種系統裡一樣會造成熱點。</div>

<h3><span class="badge lv4">專家</span>九、分散式 SQL：它們在背後幫你做了什麼</h3>
<p>自己分片，代表上面這些事都要自己做。另一條路，是用替你做好分片的系統。它們大致分兩類：</p>
<h4>第一類：在現有資料庫前面加一層</h4>
<ul>
<li><b>Vitess</b>（MySQL）：最早是 YouTube 為了擴展 MySQL 做的，現在是 CNCF 的畢業專案，PlanetScale 的服務也建立在它上面。應用程式連到一層叫 VTGate 的代理，它看得懂 SQL，依照你定義的分片規則把查詢送到對的 MySQL；每台 MySQL 旁邊有一個 VTTablet 負責管理。重新分片、搬表都有內建流程。底下還是一台台 MySQL，所以 MySQL 的經驗大多用得上。</li>
<li><b>Citus</b>（PostgreSQL）：一個 PostgreSQL 擴充套件。一台協調節點加上多台工作節點，一句 <code>SELECT create_distributed_table('rounds', 'player_id');</code> 就把表分散出去。它對多租戶系統和即時分析特別好用。</li>
</ul>
<h4>第二類：從頭設計的分散式資料庫</h4>
<p>CockroachDB、TiDB、Google Spanner 走的是另一條路：底層就是一個自動分片、自動複製的儲存系統，上面再蓋一層 SQL。</p>
<figure class="figure"><svg viewBox="0 0 680 290" class="fg" style="width:100%;max-width:680px" role="img" aria-label="分散式 SQL 的兩層：上面是無狀態的 SQL 層，下面三個節點各存三段資料的副本；寫入 id 42 送到 Range 2 的 leader，leader 再用 Raft 複製給另外兩個節點上的副本">
<rect x="270" y="8" width="140" height="30" rx="6" class="fg-b"/><text x="340" y="28" text-anchor="middle" class="fg-t">應用程式</text>
<line x1="340" y1="38" x2="340" y2="52" class="fg-l"/><polygon points="340,60 335.5,52 344.5,52" class="fg-a"/>
<rect x="40" y="60" width="600" height="50" rx="6" class="fg-b alt"/>
<text x="340" y="81" text-anchor="middle" class="fg-t">SQL 層：解析、規劃、找出資料在哪一段</text>
<text x="340" y="99" text-anchor="middle" class="fg-t sm">無狀態，任何一台都能接請求</text>
<line x1="340" y1="110" x2="340" y2="172" class="fg-l on"/><polygon points="340,180 335.5,172 344.5,172" class="fg-a on"/>
<text x="348" y="142" class="fg-t sm acc">id = 42 屬於 Range 2</text>
<rect x="40" y="150" width="180" height="112" rx="8" class="fg-b"/><text x="52" y="168" class="fg-t sm">節點 1</text>
<rect x="55" y="180" width="150" height="22" rx="4" class="fg-b hot"/><text x="130" y="195" text-anchor="middle" class="fg-t sm">Range 1（leader）</text>
<rect x="55" y="206" width="150" height="22" rx="4" class="fg-b"/><text x="130" y="221" text-anchor="middle" class="fg-t sm">Range 2</text>
<rect x="55" y="232" width="150" height="22" rx="4" class="fg-b"/><text x="130" y="247" text-anchor="middle" class="fg-t sm">Range 3</text>
<rect x="250" y="150" width="180" height="112" rx="8" class="fg-b"/><text x="262" y="168" class="fg-t sm">節點 2</text>
<rect x="265" y="180" width="150" height="22" rx="4" class="fg-b hot"/><text x="340" y="195" text-anchor="middle" class="fg-t sm">Range 2（leader）</text>
<rect x="265" y="206" width="150" height="22" rx="4" class="fg-b"/><text x="340" y="221" text-anchor="middle" class="fg-t sm">Range 1</text>
<rect x="265" y="232" width="150" height="22" rx="4" class="fg-b"/><text x="340" y="247" text-anchor="middle" class="fg-t sm">Range 3</text>
<rect x="460" y="150" width="180" height="112" rx="8" class="fg-b"/><text x="472" y="168" class="fg-t sm">節點 3</text>
<rect x="475" y="180" width="150" height="22" rx="4" class="fg-b hot"/><text x="550" y="195" text-anchor="middle" class="fg-t sm">Range 3（leader）</text>
<rect x="475" y="206" width="150" height="22" rx="4" class="fg-b"/><text x="550" y="221" text-anchor="middle" class="fg-t sm">Range 1</text>
<rect x="475" y="232" width="150" height="22" rx="4" class="fg-b"/><text x="550" y="247" text-anchor="middle" class="fg-t sm">Range 2</text>
<path d="M265 191 H235 V217 H213" class="fg-l on"/><polygon points="205,217 213,212.5 213,221.5" class="fg-a on"/>
<path d="M415 191 H445 V243 H467" class="fg-l on"/><polygon points="475,243 467,238.5 467,247.5" class="fg-a on"/>
<text x="340" y="282" text-anchor="middle" class="fg-t sm acc">每一段資料存 3 份；寫入要等多數（2 份）確認才算成功</text>
</svg><figcaption>資料被切成一段一段，每一段有 3 個副本分散在不同節點，其中一個是 leader。寫入送到 leader，用 Raft 複製到多數副本才回 OK。一台節點掛掉，每一段都還有兩份，會自動選出新的 leader。</figcaption></figure>
<ul>
<li><b>CockroachDB</b>：把資料照主鍵順序切成一段段的 range（預設最大 512 MiB），每段用 Raft 複製三份。段太大會自動分裂、太小會合併、某台太忙會自動搬走。說 PostgreSQL 的連線協定，預設隔離等級是最嚴格的可序列化（serializable）。</li>
<li><b>TiDB</b>：相容 MySQL 協定。無狀態的 TiDB 伺服器負責 SQL，資料存在 TiKV（切成一段段的 Region，一樣用 Raft），還有一個 PD（Placement Driver）負責調度資料位置，並發放全域遞增的時間戳，讓分散的交易有一致的順序。</li>
<li><b>Spanner</b>：Google 的雲端資料庫，最特別的是 TrueTime：用 GPS 和原子鐘讓每台機器知道「現在時間」的誤差範圍（通常是幾毫秒）。提交交易時刻意等過這段誤差，就能保證全球的交易順序跟真實時間一致。</li>
</ul>
<p>它們的共同代價是延遲：每一次寫入都要等一趟共識（同一區域內跨可用區，通常一兩毫秒；跨區域部署就是幾十到上百毫秒），跨段的交易還要再加一層分散式交易的協調。單筆查詢通常比一台調校好的 PostgreSQL 慢，換來的是不用自己分片、不用自己做容錯移轉、加機器就能長大。至於該選哪一種，答案跟上一課一樣：先確定一台主庫加副本真的不夠了，再來比較這些系統。</p>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>流量大了就該分片</td><td>讀多就加副本和快取；只有寫入量或資料量超過一台機器，分片才是答案。</td></tr>
<tr><td>分割表和分片是同一件事</td><td>分割表在同一台資料庫裡切塊，應用程式幾乎無感；分片是放在不同伺服器，跨片的 join 和交易都變難。</td></tr>
<tr><td>雜湊分片一定平均</td><td>它只讓「鍵」平均，不讓「流量」平均。一個名人或大客戶，照樣把一片打成熱點。</td></tr>
<tr><td>一致性雜湊讓加機器不用搬資料</td><td>還是要搬，只是從大約 N／(N＋1) 降到大約 1／(N＋1)，而且要配合虛擬節點才會平均。</td></tr>
<tr><td>分散式 SQL 就是更快的資料庫</td><td>它換來的是擴展性和自動容錯，單筆延遲通常比單機還高。</td></tr>
<tr><td>分片鍵以後再改就好</td><td>改分片鍵等於重新搬整個資料庫。它是你最難反悔的設計決定之一。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>後端（Node.js、Go）</b>：就算現在只有一台資料庫，也可以先做對兩件事：所有查詢都帶著使用者 ID，以及 ID 不依賴資料庫的自動遞增（例如用 UUIDv7 或 Snowflake）。將來真的要分片時，會輕鬆非常多。</li>
<li><b>遊戲</b>：玩家資料天然適合用玩家 ID 分片，一局遊戲的結算最好只碰這個玩家所在的那一片。全服排行榜、公會、拍賣場這類跨玩家的功能，通常交給獨立的服務或 Redis，不要硬塞進分片的交易裡。</li>
<li><b>歷史和日誌類的表</b>：大部分團隊真正需要的是按月分割表，而不是分片。它能讓刪舊資料、備份、查近期資料都快很多。</li>
<li><b>雲端</b>：代管的分散式資料庫（例如 Aurora、Spanner、CockroachDB Cloud、TiDB Cloud）把很多維運工作包掉了，但帳單和延遲的取捨要先量過。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<p>這些是系統設計面試的經典題。先自己講一遍，再打開參考答案。</p>
<ol>
<li>「資料庫快撐不住了，你什麼時候會決定分片？在那之前會先做什麼？」</li>
<li>「設計一個分片方案，你會怎麼選分片鍵？舉一個壞的分片鍵當例子。」</li>
<li>「一致性雜湊解決什麼問題？虛擬節點又是做什麼的？」</li>
<li>「兩個使用者在不同分片上，要做轉帳這種要嘛都成功、要嘛都失敗的操作，你怎麼設計？」</li>
<li>「怎麼在不停機的情況下，把 4 個分片拆成 8 個？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>先用量測找出瓶頸是讀、寫，還是資料量。依序做：修慢查詢和索引、升級機器、加快取、加讀取副本、依功能拆庫、大表做分割表。只有當寫入量或資料量確定超過一台機器（WAL 寫入、鎖競爭、還原時間超過 RTO），才分片，因為它會讓跨片 join、交易、schema 變更、備份和容錯移轉的成本全部倍增。</li>
<li>標準是：值很多、能平均分散資料和流量、幾乎每個查詢都帶著、讓常見的交易只碰一片、值不會改變。消費型產品通常是使用者 ID，SaaS 是租戶 ID，同一個鍵的相關表要共置。壞例子：建立時間（寫入全擠在最新一片）、國家（值少又不平均）。再說明跨片需求怎麼處理：名稱唯一用另一張以名稱分片的表，全域排行交給獨立服務，大客戶用目錄單獨搬走。</li>
<li>mod N 在分片數改變時，大約 N／(N＋1) 的鍵都要搬。一致性雜湊把機器和鍵放在同一個雜湊環上，鍵順時針找第一台，加一台只搬它旁邊那一段，平均大約 1／(N＋1)。虛擬節點讓每台實體機器在環上有很多個點，使每台負責的量接近平均，新機器加入時也能從每台舊機器各分一點過來，避免只壓垮一個鄰居。實務上很多系統用固定數量的槽或邏輯分片達到同樣效果，例如 Redis Cluster 的 16,384 個槽。</li>
<li>第一選擇是重新檢查分片鍵，讓這類操作盡量落在同一片。真的跨片時，可以用兩階段提交，代價是延遲、鎖住時間和協調者故障時的不確定狀態；或者用 Saga：扣款和「要加點數」的訊息在同一個本地交易裡寫入（寄件匣），另一片冪等地加點數，失敗就執行補償退回。要說清楚中間狀態對使用者怎麼呈現，以及怎麼監控卡住的流程。</li>
<li>如果一開始就有很多邏輯分片，就只是把一半的邏輯分片搬到新機器。否則照標準流程：建新分片、複製快照並記下日誌位置、串流追上變更、用校驗比對資料、短暫停止寫入讓新分片追上最後一筆、切換路由、開反向同步以便回退，觀察後再清理舊資料。要監控追趕速度一定要大於變更產生的速度，並挑離峰時段切換。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>有 1,000 萬個鍵，用 <code>hash % N</code> 分片，N 從 8 改成 9，大約有多少個鍵要搬？如果用理想的一致性雜湊呢？</li>
<li>一個查詢要問 50 個分片，每一片的 p99 是 30 毫秒。這個查詢至少碰到一片超過 30 毫秒的機率大約是多少？這告訴你什麼？</li>
<li>用 Docker 跑一個 PostgreSQL（<code>docker run -d --name pg -e POSTGRES_PASSWORD=pw postgres:17</code>），照本章的 SQL 建立按月分割的 <code>rounds</code> 表和 10、11 兩個月的分割區，各塞一些資料。對 <code>WHERE played_at &gt;= '2026-11-05'</code> 下 <code>EXPLAIN</code>，看它掃了幾個分割區；再對 <code>WHERE player_id = 42</code> 下一次。做完 <code>docker rm -f pg</code>。</li>
<li>替下面三個系統選分片鍵，並說出一個你預期會遇到的熱點：一個聊天 App 的訊息表、一個多租戶的線上表單 SaaS、一個每台機器每秒回報一次的感測系統。</li>
<li>Snowflake 的 41 位元毫秒時間戳，大約可以用幾年？一台機器每秒最多能產生多少個 ID？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>留下的比例是 1／9，要搬的是 8／9，大約 889 萬個。理想的一致性雜湊只要搬新機器分到的那一份，大約 1／9，約 111 萬個。</li>
<li>1 − 0.99<sup>50</sup> ≈ 1 − 0.605 ≈ 39.5%。也就是說，單一分片「百分之一的慢」，變成這個查詢將近四成的時候都會被拖慢。所以要盡量避免分散再收集；真的需要時，可以對慢的分片發備援請求（hedged request），或在預先彙總好的資料上查。</li>
<li>第一個查詢的計畫裡只會出現 <code>rounds_2026_11</code>（分割區修剪）；第二個查詢沒有分割鍵，計畫裡會列出所有分割區，每一塊都要掃一次。這就是「查詢要帶分割鍵」的意思。</li>
<li>聊天：對話 ID，熱點是幾萬人的大群組，可能要把大群組單獨處理或對訊息做時間分割。SaaS：租戶 ID，熱點是大客戶，需要能用目錄把他搬到獨立的分片。感測：裝置 ID（分片內按時間分割），熱點比較少，但如果某型號的裝置回報特別頻繁，或者查詢都在問「所有裝置的最新值」，就要另外設計彙總。</li>
<li>2<sup>41</sup> 毫秒大約是 2.2 兆毫秒，約 69.7 年，所以要自訂一個起算時間（epoch），不從 1970 年算。每台每毫秒最多 4,096 個（12 位元序號），每秒最多大約 409 萬個。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>Martin Kleppmann《Designing Data-Intensive Applications》</b>：第一版第 6 章 Partitioning，範圍與雜湊分割、次要索引、重新平衡、請求路由，這一章的骨架都在那裡。</li>
<li><b>Vitess 官方文件</b>（<a href="https://vitess.io/docs/">vitess.io/docs</a>）：看 VSchema、vindex 和 Reshard 的說明，就懂一個成熟的分片層要處理多少細節。</li>
<li><b>Citus 官方文件</b>（<a href="https://docs.citusdata.com/">docs.citusdata.com</a>）：分散式表、共置、參考表，以及怎麼選分散欄位，寫得非常實用。</li>
<li><b>Jeffrey Dean 與 Luiz André Barroso〈The Tail at Scale〉</b>（Communications of the ACM，2013）：分散再收集為什麼會被最慢的那一台拖累，以及怎麼對付。</li>
<li><b>〈Spanner: Google's Globally-Distributed Database〉</b>（OSDI 2012 論文）：TrueTime 和全球一致的交易是怎麼做出來的。</li>
</ul>
` });
