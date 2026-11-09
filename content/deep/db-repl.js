DEEP({ 'db-repl': `
<p>上一課講了主庫、副本、延遲、腦裂和備份。這一章把它們全部拆開來看：資料庫的變更，到底是用什麼形式從主庫流到副本？「同步」到底在等什麼？延遲是從哪一段路上冒出來的、要怎麼量才準？主庫掛掉的那幾十秒裡，自動化工具一步一步在做什麼，為什麼大家最怕的是腦裂？最後是備份：怎麼把資料庫還原到「出事前一秒」，以及為什麼沒演練過的備份等於沒有。這些是資料庫維運的基本功，也是後端和 DevOps 面試最愛一路追問下去的地方。</p>

<h3><span class="badge lv1">基礎</span>一、先寫日記，再改帳本：預寫式日誌（WAL）</h3>
<p>想像一家生意很好的小吃店。老闆每收一筆錢，先在流水帳的最後一行寫「12:03，三號桌，350 元」，等有空時才去更新分類帳：今天營收、各品項銷量、庫存。流水帳只往後寫，不用翻頁，所以很快；分類帳要翻到對的那一頁、找到對的那一格，比較慢。萬一中途停電，分類帳改到一半，也不用慌：拿出流水帳，從上次對帳的那一行開始重抄一遍，就回到正確的狀態。</p>
<p>資料庫做的是同一件事。資料檔是一頁一頁的（PostgreSQL 預設一頁 8 KB，MySQL 的 InnoDB 預設一頁 16 KB），改一列資料，就是改磁碟上某個位置的某一頁。直接去改有兩個問題：隨機位置的寫入很慢，而且一頁寫到一半斷電，那一頁就壞了。所以資料庫的規矩是：</p>
<ol>
<li>先把「改了什麼」寫成一筆紀錄，<b>追加</b>到<b>預寫式日誌</b>（write-ahead log，WAL）的最後面。</li>
<li>交易 COMMIT 時，用 <code>fsync</code> 把 WAL 確實寫進磁碟。</li>
<li>到這一步，才回覆用戶端「成功」。</li>
<li>真正的資料頁先在記憶體裡改好（叫髒頁，dirty page），之後由<b>檢查點</b>（checkpoint）慢慢寫回資料檔。</li>
</ol>
<figure class="figure"><svg viewBox="0 22 660 236" class="fg" style="width:100%;max-width:660px" role="img" aria-label="一筆交易先把變更追加到 WAL 並 fsync 到磁碟才回覆成功，資料頁在記憶體裡改好，之後由檢查點寫回資料檔，同一份 WAL 也被送去副本重播">
<rect x="20" y="40" width="130" height="50" rx="6" class="fg-b"/>
<text x="85" y="61" text-anchor="middle" class="fg-t">應用程式</text>
<text x="85" y="79" text-anchor="middle" class="fg-t sm">送出 COMMIT</text>
<line x1="150" y1="65" x2="182" y2="65" class="fg-l"/><polygon points="190,65 182,60.5 182,69.5" class="fg-a"/>
<rect x="190" y="40" width="150" height="50" rx="6" class="fg-b alt"/>
<text x="265" y="61" text-anchor="middle" class="fg-t">WAL 緩衝區</text>
<text x="265" y="79" text-anchor="middle" class="fg-t sm">在記憶體裡</text>
<line x1="340" y1="65" x2="372" y2="65" class="fg-l on"/><polygon points="380,65 372,60.5 372,69.5" class="fg-a on"/>
<text x="360" y="56" text-anchor="middle" class="fg-t sm acc">fsync</text>
<rect x="380" y="40" width="150" height="50" rx="6" class="fg-b hot"/>
<text x="455" y="61" text-anchor="middle" class="fg-t acc">WAL 檔</text>
<text x="455" y="79" text-anchor="middle" class="fg-t sm">磁碟，只往後追加</text>
<line x1="530" y1="65" x2="552" y2="65" class="fg-l on"/><polygon points="560,65 552,60.5 552,69.5" class="fg-a on"/>
<rect x="560" y="40" width="90" height="50" rx="6" class="fg-b hot"/>
<text x="605" y="61" text-anchor="middle" class="fg-t acc">回覆成功</text>
<text x="605" y="79" text-anchor="middle" class="fg-t sm">交易算數</text>
<path d="M85 90 V175 H182" class="fg-l"/><polygon points="190,175 182,170.5 182,179.5" class="fg-a"/>
<text x="95" y="135" class="fg-t sm">同時改頁面</text>
<rect x="190" y="150" width="150" height="50" rx="6" class="fg-b alt"/>
<text x="265" y="171" text-anchor="middle" class="fg-t">資料頁（髒頁）</text>
<text x="265" y="189" text-anchor="middle" class="fg-t sm">記憶體裡先改好</text>
<line x1="340" y1="175" x2="372" y2="175" class="fg-l dash"/><polygon points="380,175 372,170.5 372,179.5" class="fg-a"/>
<text x="360" y="166" text-anchor="middle" class="fg-t sm">檢查點</text>
<rect x="380" y="150" width="150" height="50" rx="6" class="fg-b"/>
<text x="455" y="171" text-anchor="middle" class="fg-t">資料檔</text>
<text x="455" y="189" text-anchor="middle" class="fg-t sm">之後才寫回，位置隨機</text>
<path d="M505 90 V118 H605 V142" class="fg-l alt"/><polygon points="605,150 600.5,142 609.5,142" class="fg-a alt"/>
<text x="555" y="111" text-anchor="middle" class="fg-t sm alt">送給副本</text>
<rect x="560" y="150" width="90" height="50" rx="6" class="fg-b warm"/>
<text x="605" y="171" text-anchor="middle" class="fg-t">副本</text>
<text x="605" y="189" text-anchor="middle" class="fg-t sm">收到就重播</text>
<text x="330" y="240" text-anchor="middle" class="fg-t sm">當機重開：從最後一個檢查點開始重播 WAL，就回到當機前的狀態</text>
</svg><figcaption>上面那一排決定「什麼時候算成功」：WAL 進了磁碟就算。下面那一排是慢慢做的雜事。右下角的副本，拿到的就是同一份 WAL。</figcaption></figure>
<p>這個設計同時換來兩樣東西。第一是速度：WAL 是循序寫入，很多交易的 fsync 還可以合併成一次（group commit），所以每秒上萬筆交易也撐得住。第二是「什麼叫已經存好」有了精確的定義：<b>只要 WAL 已經在磁碟上，這筆交易就算數</b>，資料頁還沒寫回去也沒關係。當機重開時，資料庫從最後一個檢查點開始重播 WAL，把沒寫回的變更補齊，這叫當機復原（crash recovery）。</p>
<h4>WAL 裡的每個位置都有編號</h4>
<p>WAL 是一條只會變長的位元組串流。PostgreSQL 給每個位置一個編號，叫 <b>LSN</b>（log sequence number），長得像 <code>0/3A000148</code>，數字越大越新。WAL 在磁碟上切成一個個檔案，放在資料目錄的 <code>pg_wal</code> 裡，預設每個 16 MB。MySQL 比較特別，有兩本日誌：InnoDB 的 redo log 負責當機復原，伺服器層的 binary log（binlog）負責複寫，兩者在 COMMIT 時用內部的兩階段提交對齊。</p>
<p>這一節最重要的一句話是：<b>WAL 已經完整記下了「發生過什麼」</b>。所以複寫（replication）不需要發明新東西，只要把這本日記送給另一台機器，讓它也照著重播一遍。</p>

<h3><span class="badge lv1">基礎</span>二、複寫的兩種抄法：實體複寫與邏輯複寫</h3>
<p>「把日記送給別人照抄」有兩種抄法。一種是連筆跡都照抄，一種是只抄內容。</p>
<figure class="figure"><svg viewBox="0 0 680 280" class="fg" style="width:100%;max-width:680px" role="img" aria-label="實體複寫把 WAL 的原始位元組送到副本逐頁重播；邏輯複寫先把 WAL 解碼成一列一列的變更，再送給訂閱者套用">
<text x="20" y="26" class="fg-t lg alt">實體複寫（串流）</text>
<rect x="20" y="40" width="150" height="56" rx="6" class="fg-b"/>
<text x="95" y="64" text-anchor="middle" class="fg-t">主庫</text>
<text x="95" y="84" text-anchor="middle" class="fg-t sm">walsender 行程</text>
<line x1="170" y1="68" x2="382" y2="68" class="fg-l alt"/><polygon points="390,68 382,63.5 382,72.5" class="fg-a alt"/>
<text x="280" y="60" text-anchor="middle" class="fg-t sm alt">WAL 原始位元組</text>
<text x="280" y="86" text-anchor="middle" class="fg-t sm">一個位元組都不改</text>
<rect x="390" y="40" width="150" height="56" rx="6" class="fg-b alt"/>
<text x="465" y="64" text-anchor="middle" class="fg-t">副本</text>
<text x="465" y="84" text-anchor="middle" class="fg-t sm">逐頁重播</text>
<text x="556" y="56" class="fg-t sm">整個叢集一起抄</text>
<text x="556" y="74" class="fg-t sm">主版本必須相同</text>
<text x="556" y="92" class="fg-t sm">副本只能讀</text>
<line x1="20" y1="122" x2="660" y2="122" class="fg-l dim dash"/>
<text x="20" y="150" class="fg-t lg acc">邏輯複寫</text>
<rect x="20" y="164" width="150" height="56" rx="6" class="fg-b"/>
<text x="95" y="188" text-anchor="middle" class="fg-t">主庫</text>
<text x="95" y="208" text-anchor="middle" class="fg-t sm">發布（publication）</text>
<line x1="170" y1="192" x2="202" y2="192" class="fg-l on"/><polygon points="210,192 202,187.5 202,196.5" class="fg-a on"/>
<rect x="210" y="164" width="150" height="56" rx="6" class="fg-b hot"/>
<text x="285" y="188" text-anchor="middle" class="fg-t acc">邏輯解碼</text>
<text x="285" y="208" text-anchor="middle" class="fg-t sm mono">UPDATE players 42</text>
<line x1="360" y1="192" x2="382" y2="192" class="fg-l on"/><polygon points="390,192 382,187.5 382,196.5" class="fg-a on"/>
<rect x="390" y="164" width="150" height="56" rx="6" class="fg-b"/>
<text x="465" y="188" text-anchor="middle" class="fg-t">訂閱者</text>
<text x="465" y="208" text-anchor="middle" class="fg-t sm">一列一列套用</text>
<text x="556" y="180" class="fg-t sm">可以只挑幾張表</text>
<text x="556" y="198" class="fg-t sm">可以跨主版本</text>
<text x="556" y="216" class="fg-t sm">DDL 不會跟過去</text>
<text x="340" y="262" text-anchor="middle" class="fg-t sm">實體複寫抄「頁面上的位元組」；邏輯複寫抄「哪一列改成什麼」</text>
</svg><figcaption>上面一排像影印：快、完全一樣，但只能整本印。下面一排像聽寫：先翻譯成句子再寫，可以挑章節，也可以寫進格式不同的本子。</figcaption></figure>
<h4>實體複寫（physical replication）：照抄位元組</h4>
<p>PostgreSQL 的串流複寫（streaming replication）就是這種。副本開機後連上主庫，主庫開一個叫 walsender 的行程，把新產生的 WAL 原封不動送過去；副本這邊的 walreceiver 收下來，寫進自己的 <code>pg_wal</code>，再由負責復原的 startup 行程一筆一筆重播。副本其實一直處在「當機復原中」的狀態，只是這個復原永遠做不完，因為新的 WAL 一直來。在副本上執行 <code>SELECT pg_is_in_recovery();</code>，答案就是 true。</p>
<p>因為抄的是「第幾頁第幾個位元組改成什麼」，副本跟主庫在位元組層級完全相同。這帶來三個限制：整個資料庫叢集（PostgreSQL 指一個執行個體裡的所有資料庫）一起抄，不能只抄一張表；主版本（major version）必須相同；副本只能讀，不能寫（PostgreSQL 叫 hot standby）。</p>
<h4>邏輯複寫（logical replication）：只抄「哪一列改成什麼」</h4>
<p>主庫用<b>邏輯解碼</b>（logical decoding）把 WAL 翻譯成「players 表 id 42 這一列，score 從 10 改成 15」這種一列一列的變更，再送給訂閱的那一方：</p>
<pre><code>-- 主庫
CREATE PUBLICATION game_pub FOR TABLE players, rounds;

-- 另一台資料庫
CREATE SUBSCRIPTION game_sub
  CONNECTION 'host=10.0.1.5 dbname=game user=repl'
  PUBLICATION game_pub;</code></pre>
<p>因為抄的是內容而不是位元組，它可以只抄幾張表，可以從 PostgreSQL 15 抄到 17（所以常拿來做幾乎不停機的大版本升級），訂閱方也可以有自己的索引，甚至自己的寫入。代價是：schema 變更（DDL）不會跟著過去，兩邊要各自做；要更新、刪除的表必須有主鍵或設好 replica identity，不然訂閱方不知道要改哪一列。</p>
<p>MySQL 的 binlog 本來就是邏輯的，有三種格式：STATEMENT（記 SQL 本身）、ROW（記每一列改成什麼）、MIXED。現在預設是 ROW。STATEMENT 很省空間，但遇到 <code>UUID()</code>、<code>SYSDATE()</code>、沒有 <code>ORDER BY</code> 的 <code>LIMIT</code> 這種每次跑結果可能不同的語句，副本重跑出來就會跟主庫不一樣。這就是 ROW 成為預設值的原因。</p>

<h3><span class="badge lv2">進階</span>三、同步還是非同步：「成功」是在哪一刻說出口的</h3>
<p>同步與非同步的差別只在一個問題：主庫回覆「成功」之前，要不要等副本？用一筆 COMMIT 走一次，下面的數字都是常見的數量級：</p>
<figure class="figure"><svg viewBox="0 0 680 232" class="fg" style="width:100%;max-width:680px" role="img" aria-label="左邊非同步：主庫寫完本機 WAL 就回 OK，之後才送 WAL 給副本，中間是危險窗口；右邊同步：主庫等副本回報寫進磁碟之後才回 OK，用戶端一直在等">
<text x="170" y="20" text-anchor="middle" class="fg-t lg">非同步</text>
<rect x="15" y="34" width="80" height="26" rx="5" class="fg-b"/><text x="55" y="52" text-anchor="middle" class="fg-t">用戶端</text>
<rect x="130" y="34" width="80" height="26" rx="5" class="fg-b hot"/><text x="170" y="52" text-anchor="middle" class="fg-t">主庫</text>
<rect x="245" y="34" width="80" height="26" rx="5" class="fg-b alt"/><text x="285" y="52" text-anchor="middle" class="fg-t">副本</text>
<line x1="55" y1="60" x2="55" y2="188" class="fg-l dim"/><line x1="170" y1="60" x2="170" y2="188" class="fg-l dim"/><line x1="285" y1="60" x2="285" y2="188" class="fg-l dim"/>
<line x1="55" y1="82" x2="162" y2="82" class="fg-l"/><polygon points="170,82 162,77.5 162,86.5" class="fg-a"/>
<text x="112" y="76" text-anchor="middle" class="fg-t sm mono">COMMIT</text>
<text x="178" y="100" class="fg-t sm">寫 WAL、fsync</text>
<line x1="170" y1="122" x2="63" y2="122" class="fg-l on"/><polygon points="55,122 63,117.5 63,126.5" class="fg-a on"/>
<text x="112" y="116" text-anchor="middle" class="fg-t sm acc">OK</text>
<line x1="170" y1="125" x2="170" y2="155" class="fg-l warm"/>
<text x="162" y="144" text-anchor="end" class="fg-t sm warm">危險窗口</text>
<line x1="170" y1="158" x2="277" y2="158" class="fg-l alt dash"/><polygon points="285,158 277,153.5 277,162.5" class="fg-a alt"/>
<text x="228" y="152" text-anchor="middle" class="fg-t sm alt">WAL</text>
<text x="170" y="214" text-anchor="middle" class="fg-t sm">快；當機可能丟掉已回 OK 的寫入</text>
<line x1="340" y1="10" x2="340" y2="224" class="fg-l dim dash"/>
<text x="515" y="20" text-anchor="middle" class="fg-t lg">同步</text>
<rect x="360" y="34" width="80" height="26" rx="5" class="fg-b"/><text x="400" y="52" text-anchor="middle" class="fg-t">用戶端</text>
<rect x="475" y="34" width="80" height="26" rx="5" class="fg-b hot"/><text x="515" y="52" text-anchor="middle" class="fg-t">主庫</text>
<rect x="590" y="34" width="80" height="26" rx="5" class="fg-b alt"/><text x="630" y="52" text-anchor="middle" class="fg-t">副本</text>
<line x1="400" y1="60" x2="400" y2="188" class="fg-l dim"/><line x1="515" y1="60" x2="515" y2="188" class="fg-l dim"/><line x1="630" y1="60" x2="630" y2="188" class="fg-l dim"/>
<line x1="400" y1="82" x2="507" y2="82" class="fg-l"/><polygon points="515,82 507,77.5 507,86.5" class="fg-a"/>
<text x="457" y="76" text-anchor="middle" class="fg-t sm mono">COMMIT</text>
<text x="523" y="100" class="fg-t sm">寫 WAL、fsync</text>
<line x1="515" y1="122" x2="622" y2="122" class="fg-l alt"/><polygon points="630,122 622,117.5 622,126.5" class="fg-a alt"/>
<text x="572" y="116" text-anchor="middle" class="fg-t sm alt">WAL</text>
<line x1="630" y1="146" x2="523" y2="146" class="fg-l alt"/><polygon points="515,146 523,141.5 523,150.5" class="fg-a alt"/>
<text x="572" y="140" text-anchor="middle" class="fg-t sm alt">已寫進磁碟</text>
<line x1="515" y1="170" x2="408" y2="170" class="fg-l on"/><polygon points="400,170 408,165.5 408,174.5" class="fg-a on"/>
<text x="457" y="164" text-anchor="middle" class="fg-t sm acc">OK</text>
<line x1="400" y1="86" x2="400" y2="166" class="fg-l warm"/>
<text x="392" y="130" text-anchor="end" class="fg-t sm warm">等待</text>
<text x="515" y="214" text-anchor="middle" class="fg-t sm">多一趟來回；副本掛了，寫入就卡住</text>
</svg><figcaption>兩邊都有同樣幾個動作，差別只在「OK」這一箭畫在哪裡。左邊的橘色線段，就是使用者看到成功、資料卻只在一台機器上的那段時間。</figcaption></figure>
<ul>
<li><b>非同步</b>（asynchronous）：主庫把 WAL 寫進本機磁碟（SSD 上大約零點幾毫秒），立刻回 OK。WAL 之後才送去副本，同一個機房再多零點幾毫秒，跨區域可能要幾十毫秒。如果主庫剛好死在「回了 OK」和「WAL 到達副本」之間，這筆使用者已經看到成功的寫入，在升格後的新主庫上就不存在。</li>
<li><b>同步</b>（synchronous）：主庫等副本回報「我寫進磁碟了」才回 OK。每筆 COMMIT 多一趟網路來回：同機房通常不到 1 毫秒，跨區域就是幾十毫秒。換來的是：只要回了 OK，至少有兩台機器的磁碟上有這筆資料。</li>
</ul>
<h4>PostgreSQL 的五段開關</h4>
<p>PostgreSQL 用 <code>synchronous_commit</code> 決定「等到哪一步」，而且可以每個交易各自設定：</p>
<table>
<tr><th>設定值</th><th>回 OK 之前等到哪裡</th><th>主庫突然掛掉時</th></tr>
<tr><td><code>off</code></td><td>連本機的 fsync 都不等</td><td>主庫自己重開，都可能丟掉最後一小段（但不會把資料弄壞）</td></tr>
<tr><td><code>local</code></td><td>本機 WAL 寫進磁碟</td><td>副本上可能還沒有</td></tr>
<tr><td><code>remote_write</code></td><td>副本收到、交給作業系統（還沒 fsync）</td><td>主庫掛掉時，副本的機器剛好也當機才會丟</td></tr>
<tr><td><code>on</code></td><td>副本把 WAL fsync 進磁碟</td><td>不會丟</td></tr>
<tr><td><code>remote_apply</code></td><td>副本已經重播完</td><td>不會丟，而且副本馬上讀得到</td></tr>
</table>
<p>要注意兩件事。第一，這張表要在設定了 <code>synchronous_standby_names</code>（指定哪幾台是同步副本）之後才成立；沒設的話，後面三個值的效果都跟 <code>local</code> 一樣，只等本機。第二，預設的 <code>on</code> 只保證 WAL 到了副本的磁碟，<b>不保證副本已經重播</b>。所以就算是同步複寫，你立刻去副本讀，還是可能讀到舊資料。要「讀得到」，得用 <code>remote_apply</code>。</p>
<h4>同步複寫的兩個坑</h4>
<ol>
<li><b>副本掛了，主庫跟著卡住。</b>只指定一台同步副本時，那台一死，所有 COMMIT 都會一直等下去，整個服務的寫入停擺。解法是準備兩台候選，用 <code>synchronous_standby_names = 'ANY 1 (b, c)'</code> 表示「兩台裡任一台確認就好」，死一台還能繼續寫。</li>
<li><b>以為有保護，其實沒有。</b>MySQL 的半同步複寫（semi-synchronous replication）等副本超過一個逾時（預設 10 秒）就會自動退回非同步。服務照樣在跑，保護卻已經悄悄消失。這個切換一定要有監控和警報。</li>
</ol>

<h3><span class="badge lv2">進階</span>四、複寫延遲：它從哪段路冒出來、要怎麼量</h3>
<p>一筆 WAL 從主庫到副本「讀得到」，要走過四段路：主庫送出（send）、副本收下交給作業系統（write）、副本 fsync 進磁碟（flush）、副本重播（replay）。每一段都可能落後，總和就是<b>複寫延遲</b>（replication lag）。</p>
<figure class="figure"><svg viewBox="0 28 660 166" class="fg" style="width:100%;max-width:660px" role="img" aria-label="一條 WAL 位置的尺：副本已重播的位置、已寫入磁碟的位置、主庫已送出的位置、主庫目前寫到的位置，四個記號之間的差距就是各段的延遲">
<text x="260" y="46" text-anchor="middle" class="fg-t sm">已重播</text>
<text x="360" y="46" text-anchor="middle" class="fg-t sm">已寫入磁碟</text>
<text x="470" y="46" text-anchor="middle" class="fg-t sm">已送出</text>
<text x="600" y="46" text-anchor="middle" class="fg-t sm">主庫寫到這</text>
<text x="260" y="64" text-anchor="middle" class="fg-t sm mono">replay_lsn</text>
<text x="360" y="64" text-anchor="middle" class="fg-t sm mono">flush_lsn</text>
<text x="470" y="64" text-anchor="middle" class="fg-t sm mono">sent_lsn</text>
<text x="600" y="64" text-anchor="middle" class="fg-t sm">目前位置</text>
<rect x="40" y="80" width="220" height="36" class="fg-b hot"/>
<rect x="260" y="80" width="100" height="36" class="fg-b alt"/>
<rect x="360" y="80" width="110" height="36" class="fg-b"/>
<rect x="470" y="80" width="130" height="36" class="fg-b warm"/>
<text x="150" y="103" text-anchor="middle" class="fg-t sm">副本已看得到</text>
<text x="310" y="103" text-anchor="middle" class="fg-t sm">收到、未重播</text>
<text x="415" y="103" text-anchor="middle" class="fg-t sm">傳送中</text>
<text x="535" y="103" text-anchor="middle" class="fg-t sm">還沒送出</text>
<line x1="260" y1="70" x2="260" y2="126" class="fg-l on"/>
<line x1="360" y1="70" x2="360" y2="126" class="fg-l"/>
<line x1="470" y1="70" x2="470" y2="126" class="fg-l"/>
<line x1="600" y1="70" x2="600" y2="126" class="fg-l warm"/>
<text x="40" y="140" class="fg-t sm">&larr; 舊</text>
<text x="612" y="103" class="fg-t sm">新 &rarr;</text>
<path d="M260 150 V158 H600 V150" class="fg-l warm"/>
<text x="430" y="178" text-anchor="middle" class="fg-t sm">落後的位元組數：pg_wal_lsn_diff(目前位置, replay_lsn)</text>
</svg><figcaption>延遲不是一個數字，而是四個記號之間的三段距離。哪一段最長，就告訴你問題在哪：還沒送出是主庫或網路，收到未重播是副本自己跟不上。</figcaption></figure>
<p>PostgreSQL 在主庫上用 <code>pg_stat_replication</code> 看每一台副本走到哪裡：</p>
<pre><code>SELECT application_name, state,
       pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS bytes_behind,
       replay_lag
FROM pg_stat_replication;</code></pre>
<p><code>bytes_behind</code> 是落後的位元組數，<code>replay_lag</code> 是時間（主庫寫入之後，過了多久副本才重播完）。兩種都要看：落後 50 MB，對一台每秒產生 100 MB WAL 的主庫來說不到一秒；對一台很閒的主庫來說，可能代表已經卡了好幾分鐘。</p>
<h4>量延遲的三個陷阱</h4>
<ul>
<li>在副本上算 <code>now() - pg_last_xact_replay_timestamp()</code> 很常見，但主庫沒有任何寫入時，這個數字會一直變大，其實副本根本沒落後。半夜沒流量時延遲警報狂響，多半是這個原因。</li>
<li>MySQL 的 <code>SHOW REPLICA STATUS</code> 裡的 <code>Seconds_Behind_Source</code>（舊版叫 <code>Seconds_Behind_Master</code>）是用事件的時間戳推算的。網路慢、副本「收」的那一段落後時，它常常顯示 0；遇到大交易又會突然跳得很大。</li>
<li>最誠實的量法是<b>心跳表</b>（heartbeat）：主庫每秒更新一列「現在時間」，在副本上讀出來，跟自己的時鐘比。Percona 的 <code>pt-heartbeat</code> 就是這麼做，PostgreSQL 也可以自己寫一個。</li>
</ul>
<h4>延遲從哪裡來</h4>
<ol>
<li><b>一個超大交易。</b>一句 <code>UPDATE</code> 改了一千萬列，可能產生好幾 GB 的 WAL，副本要全部重播完，後面的變更才看得到。批次工作要切小，每次幾千列。</li>
<li><b>重播是單線道。</b>PostgreSQL 的重播由一個行程負責；主庫上 32 個核心同時在寫，副本卻只有一個行程在重播。這是寫入量大時延遲越拉越大的根本原因。MySQL 的副本可以開多執行緒套用（<code>replica_parallel_workers</code>），但仍然受限於交易之間的相依性。</li>
<li><b>副本的規格比較小。</b>為了省錢把副本開小一號，磁碟 IOPS 不夠，重播就跟不上。副本至少要跟主庫一樣大，尤其是將來可能被升格的那一台。</li>
<li><b>副本上的長查詢。</b>副本上有人在跑一個 10 分鐘的報表，而 WAL 裡剛好要清掉這個查詢還在讀的舊資料，兩者就衝突了。PostgreSQL 預設讓重播最多等 30 秒（<code>max_standby_streaming_delay</code>），之後就取消那個查詢，報錯 canceling statement due to conflict with recovery。打開 <code>hot_standby_feedback</code> 可以避免取消，代價是主庫暫時不能清理那些舊資料，表會膨脹。</li>
<li><b>網路。</b>跨區域頻寬不夠，WAL 送都送不完。</li>
</ol>
<p>算一次就懂延遲為什麼會「越積越多」：主庫高峰時每秒產生 20 MB WAL，副本每秒只能重播 15 MB，延遲就每秒增加 5 MB。高峰持續 10 分鐘，副本落後 3 GB。只要產生的速度大於重播的速度，延遲就是一直線往上，不會自己好；要等高峰過去，才會慢慢追回來。</p>

<h3><span class="badge lv3">專業</span>五、容錯移轉：主庫掛掉的那幾十秒裡發生了什麼</h3>
<p>上一課說「總得有個東西發現主庫死了、把副本升格」。實務上，這個東西通常是 <b>Patroni</b>（PostgreSQL 最常用的高可用工具，Kubernetes 上的 Zalando postgres-operator 也是用它），或 CloudNativePG 這類 Kubernetes operator，或雲端代管服務自己的控制平面。它們做的事大同小異，分成六步：</p>
<figure class="figure"><svg viewBox="0 14 680 262" class="fg" style="width:100%;max-width:680px" role="img" aria-label="容錯移轉六個步驟：偵測、選人、圍籬、升格、改路由、舊主庫歸隊">
<rect x="20" y="30" width="190" height="76" rx="6" class="fg-b"/>
<text x="34" y="56" class="fg-t acc">1 偵測</text>
<text x="34" y="78" class="fg-t sm">主庫 30 秒沒續約</text>
<text x="34" y="96" class="fg-t sm">（不是一次 ping 失敗）</text>
<line x1="210" y1="68" x2="237" y2="68" class="fg-l"/><polygon points="245,68 237,63.5 237,72.5" class="fg-a"/>
<rect x="245" y="30" width="190" height="76" rx="6" class="fg-b"/>
<text x="259" y="56" class="fg-t acc">2 選人</text>
<text x="259" y="78" class="fg-t sm">挑 WAL 收得最多的副本</text>
<text x="259" y="96" class="fg-t sm">落後太多的不准當選</text>
<line x1="435" y1="68" x2="462" y2="68" class="fg-l"/><polygon points="470,68 462,63.5 462,72.5" class="fg-a"/>
<rect x="470" y="30" width="190" height="76" rx="6" class="fg-b warm"/>
<text x="484" y="56" class="fg-t warm">3 圍籬（fencing）</text>
<text x="484" y="78" class="fg-t sm">確保舊主庫不能再寫</text>
<text x="484" y="96" class="fg-t sm">自己降級，或被斷電</text>
<path d="M565 106 V128 H115 V142" class="fg-l"/><polygon points="115,150 110.5,142 119.5,142" class="fg-a"/>
<rect x="20" y="150" width="190" height="76" rx="6" class="fg-b hot"/>
<text x="34" y="176" class="fg-t acc">4 升格（promote）</text>
<text x="34" y="198" class="fg-t sm">副本結束重播、開始收寫入</text>
<text x="34" y="216" class="fg-t sm">時間線（timeline）加 1</text>
<line x1="210" y1="188" x2="237" y2="188" class="fg-l"/><polygon points="245,188 237,183.5 237,192.5" class="fg-a"/>
<rect x="245" y="150" width="190" height="76" rx="6" class="fg-b alt"/>
<text x="259" y="176" class="fg-t alt">5 改路由</text>
<text x="259" y="198" class="fg-t sm">DNS、虛擬 IP 或 proxy</text>
<text x="259" y="216" class="fg-t sm">應用程式重新連線</text>
<line x1="435" y1="188" x2="462" y2="188" class="fg-l"/><polygon points="470,188 462,183.5 462,192.5" class="fg-a"/>
<rect x="470" y="150" width="190" height="76" rx="6" class="fg-b"/>
<text x="484" y="176" class="fg-t acc">6 舊主庫歸隊</text>
<text x="484" y="198" class="fg-t sm">pg_rewind 倒回分岔點</text>
<text x="484" y="216" class="fg-t sm">重新當副本</text>
<text x="340" y="262" text-anchor="middle" class="fg-t sm">最花時間的是第 1 步：等太短會誤判，等太久就停機更久</text>
</svg><figcaption>順序不能亂：第 3 步沒做完就做第 4 步，就是在製造兩個主庫。橘色那一格，是自己寫腳本的人最常漏掉的一步。</figcaption></figure>
<ol>
<li><b>偵測。</b>Patroni 讓主庫定期到一個共識儲存（etcd、Consul、ZooKeeper 或 Kubernetes 本身）更新一把「leader 鎖」，鎖有存活時間（預設 <code>ttl: 30</code> 秒）。鎖過期了還沒人續，才算主庫死了。一次 ping 不到不能算數：網路抖一下就升格，比主庫真的死掉還危險。</li>
<li><b>選人。</b>在所有副本裡挑 WAL 收得最多的那一台。落後太多的不准當選（Patroni 的 <code>maximum_lag_on_failover</code>，預設 1 MB），因為讓它當選，就等於丟掉它沒收到的那些寫入。</li>
<li><b>圍籬（fencing）。</b>確定舊主庫就算還活著，也不能再接受寫入。下一節專門講這一步。</li>
<li><b>升格（promote）。</b>新主庫結束重播，開始接受寫入（<code>pg_ctl promote</code> 或 <code>SELECT pg_promote()</code>）。PostgreSQL 會把<b>時間線</b>（timeline）編號加 1，從此新舊兩條歷史分開；WAL 檔名最前面那一段就是時間線編號。</li>
<li><b>改路由。</b>讓應用程式連到新主庫：改 DNS、搬虛擬 IP，或由 HAProxy 這類 proxy 呼叫 Patroni 的健康檢查 API（只有主庫的 <code>/primary</code> 會回 200）自動切換。代管服務通常是把一個固定的 DNS 名稱改指到新機器。</li>
<li><b>舊主庫歸隊。</b>舊主庫修好後，可能有幾筆新主庫沒有的 WAL，不能直接當副本。<code>pg_rewind</code> 會把它倒回兩條時間線分岔的那一點，再從新主庫繼續抄。這需要事先打開 <code>wal_log_hints</code> 或資料檢查碼（data checksums）。</li>
</ol>
<h4>應用程式那一側也要配合</h4>
<p>容錯移轉（failover）不只是資料庫自己的事。切換的那幾十秒裡，應用程式會看到連線被重設，或者寫到還沒更新路由的舊主庫，收到 <code>cannot execute INSERT in a read-only transaction</code>。要撐過去，應用程式需要：連線斷掉會自動重連；寫入失敗會用退避（backoff）重試，而且重試是冪等的；不要把資料庫的 DNS 查詢結果永遠快取住。代管資料庫（例如 RDS Multi-AZ）的切換通常在一到兩分鐘內完成，但前提是你的程式真的會重連。</p>

<h3><span class="badge lv3">專業</span>六、腦裂：最怕的不是主庫死掉，而是它沒死透</h3>
<p>主庫真的死了，事情反而簡單。最麻煩的是網路斷成兩半：舊主庫 A 還活著，還連得到一部分應用程式，但連不到監控和其他副本。監控以為 A 死了，把 B 升格。現在兩邊都在收寫入，這就是<b>腦裂</b>（split brain）。</p>
<p>用猜高低遊戲走一次：玩家原本有 1,000 點。他的手機連到 A，玩了一局用掉 100 點，A 記成 900；同一時間他另一個分頁連到 B，贏了 300 點，B 記成 1,300。網路恢復後，兩台資料庫有兩段互相矛盾的歷史，沒有任何辦法自動合併，只能丟掉其中一邊的寫入。而被丟掉的那一邊，使用者都已經看到「成功」了。</p>
<figure class="figure"><svg viewBox="0 0 680 300" class="fg" style="width:100%;max-width:680px" role="img" aria-label="網路斷成兩半：左邊是舊主庫 A 和一台 etcd，屬於少數，A 續約失敗後自己降級；右邊有兩台 etcd 構成多數，B 拿到 leader 鎖成為新主庫">
<text x="250" y="22" text-anchor="middle" class="fg-t warm">網路斷成兩半</text>
<line x1="250" y1="32" x2="250" y2="270" class="fg-l warm dash"/>
<rect x="30" y="46" width="190" height="60" rx="6" class="fg-b warm"/>
<text x="125" y="70" text-anchor="middle" class="fg-t">A：舊主庫</text>
<text x="125" y="92" text-anchor="middle" class="fg-t sm">續約失敗，自己降成唯讀</text>
<line x1="75" y1="106" x2="75" y2="134" class="fg-l dash"/>
<text x="84" y="124" class="fg-t sm">只連到 1 台</text>
<rect x="30" y="134" width="90" height="34" rx="5" class="fg-b"/>
<text x="75" y="156" text-anchor="middle" class="fg-t">etcd 1</text>
<rect x="30" y="206" width="190" height="50" rx="6" class="fg-b"/>
<text x="125" y="227" text-anchor="middle" class="fg-t">應用程式 1</text>
<text x="125" y="245" text-anchor="middle" class="fg-t sm">寫入被拒，等著重試</text>
<line x1="180" y1="206" x2="180" y2="114" class="fg-l"/><polygon points="180,106 175.5,114 184.5,114" class="fg-a"/>
<text x="188" y="172" class="fg-t sm">寫入</text>
<rect x="280" y="38" width="110" height="102" rx="8" class="fg-b dash"/>
<rect x="290" y="46" width="90" height="34" rx="5" class="fg-b"/>
<text x="335" y="68" text-anchor="middle" class="fg-t">etcd 2</text>
<rect x="290" y="96" width="90" height="34" rx="5" class="fg-b"/>
<text x="335" y="118" text-anchor="middle" class="fg-t">etcd 3</text>
<text x="335" y="158" text-anchor="middle" class="fg-t sm acc">多數 2／3</text>
<line x1="380" y1="63" x2="452" y2="63" class="fg-l on"/><polygon points="460,63 452,58.5 452,67.5" class="fg-a on"/>
<text x="420" y="55" text-anchor="middle" class="fg-t sm acc">續約成功</text>
<rect x="460" y="46" width="190" height="60" rx="6" class="fg-b hot"/>
<text x="555" y="70" text-anchor="middle" class="fg-t acc">B：新主庫</text>
<text x="555" y="92" text-anchor="middle" class="fg-t sm">拿到 leader 鎖</text>
<rect x="460" y="206" width="190" height="50" rx="6" class="fg-b"/>
<text x="555" y="227" text-anchor="middle" class="fg-t">應用程式 2</text>
<text x="555" y="245" text-anchor="middle" class="fg-t sm">寫入成功</text>
<line x1="600" y1="206" x2="600" y2="114" class="fg-l on"/><polygon points="600,106 595.5,114 604.5,114" class="fg-a on"/>
<text x="608" y="172" class="fg-t sm acc">寫入</text>
<text x="340" y="290" text-anchor="middle" class="fg-t sm">少數那一邊必須在租約到期前自己停手，同一時間才只會有一個主庫</text>
</svg><figcaption>決定誰是主庫的，不是「誰還活著」，而是「誰拿得到過半數的票」。A 還活著，但它在少數那一邊，所以它必須自己放手。</figcaption></figure>
<h4>四道防線</h4>
<ul>
<li><b>多數決（quorum）。</b>誰是主庫，由一個至少三台的共識叢集投票決定（etcd 用的是 Raft 演算法）。網路斷成兩半時，只有拿到過半數的那一邊能選出主庫。這就是為什麼<b>兩台機器做不了安全的自動容錯移轉</b>：斷線時雙方都是一比一，誰也不比誰多。至少要有第三票，哪怕只是一台很小的見證者（witness）。</li>
<li><b>租約加自我降級。</b>主庫的身分是一張有期限的租約（lease）。A 續不了約，就必須在租約到期前自己降成唯讀。Patroni 就是這樣：主庫更新不了 leader 鎖，就自己降級。B 只會在租約確定過期之後才升格，兩者在時間上不重疊。</li>
<li><b>看門狗（watchdog）。</b>如果 Patroni 程式自己卡住了，沒辦法執行降級呢？Patroni 可以搭配 Linux 的看門狗裝置：它必須定期「餵狗」，卡住太久沒餵，核心就直接重開這台機器。</li>
<li><b>STONITH 與圍籬權杖（fencing token）。</b>STONITH 是 shoot the other node in the head 的縮寫：直接把舊主庫斷電或從網路上拔掉，傳統的高可用叢集很常用。圍籬權杖則是每選出一次新主庫就發一個更大的號碼，儲存層拒絕任何帶著舊號碼的寫入，這樣舊主庫就算「醒過來」也寫不進去。</li>
</ul>
<div class="warn">自己寫一支「每 5 秒 ping 主庫，ping 不到就把副本升格」的腳本，是最常見的腦裂製造機。它沒有多數決、沒有圍籬，網路抖一下就生出兩個主庫。要自動容錯移轉，就用 Patroni、operator 或代管服務。</div>

<h3><span class="badge lv3">專業</span>七、讀到自己寫的：四種做法和它們的代價</h3>
<p>上一課給了最簡單的解法：使用者寫入後幾秒內，他的讀取都送主庫。實務上有四種做法，越往下越精準，也越複雜：</p>
<ol>
<li><b>寫入後一段時間讀主庫。</b>在工作階段（session）或 cookie 裡記「上次寫入時間」，這段時間內讀主庫。時間要設得比平常的 p99 延遲長，例如延遲通常在 1 秒內，就設 5 秒。簡單，但延遲突然暴增到 30 秒時就破功了。</li>
<li><b>記住 LSN。</b>寫入後記下主庫當時的 WAL 位置（<code>pg_current_wal_lsn()</code>），讀取時只挑 <code>pg_last_wal_replay_lsn()</code> 已經追到這個位置的副本，都不夠新就讀主庫。MySQL 的對應做法是 GTID：在副本上呼叫 <code>WAIT_FOR_EXECUTED_GTID_SET()</code>，等它追到那筆交易，或者逾時。</li>
<li><b>對少數重要的寫入用 remote_apply。</b>在那個交易裡下 <code>SET LOCAL synchronous_commit = remote_apply</code>，回 OK 時，同步副本一定已經讀得到。只有那幾個交易付出延遲的代價。</li>
<li><b>自己的資料永遠讀主庫。</b>副本只拿來讀「別人的資料」和跑報表。很多產品這樣就夠了。</li>
</ol>
<pre><code>async function readProfile(userId: string, s: Session) {
  const recent = s.lastWriteAt !== undefined &amp;&amp; Date.now() - s.lastWriteAt &lt; 5000;
  const db = recent ? primary : replicaFor(userId);
  return db.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
}</code></pre>
<p>注意上面的 <code>replicaFor(userId)</code>：它用使用者 ID 固定挑同一台副本，而不是每次隨機挑。這是在處理另一個比較隱蔽的問題，叫<b>單調讀取</b>（monotonic reads）。如果第一次讀到落後 0.1 秒的副本 A、第二次讀到落後 3 秒的副本 B，使用者會看到剛出現的留言又「消失」了，時間好像倒流。同一個人固定讀同一台，時間就不會倒流。</p>

<h3><span class="badge lv4">專家</span>八、真正的備份：基礎備份＋WAL 封存＝時間點還原</h3>
<p>備份（backup）有兩大類。<b>邏輯備份</b>是用 <code>pg_dump</code> 把資料匯出成 SQL 或封存檔：可以跨版本、可以只還原一張表，但資料一大就很慢，還原時要重建所有索引，幾百 GB 的資料庫可能要好幾個小時，而且只能還原到匯出的那一刻。<b>實體備份</b>是複製整個資料目錄，再加上 WAL：還原快，而且配合 WAL 可以停在任何一秒。正式環境的主力是後者。</p>
<h4>兩個零件</h4>
<ul>
<li><b>基礎備份</b>（base backup）：資料庫在運作中被複製出來的一份資料目錄，例如每天凌晨 2 點用 <code>pg_basebackup</code> 做一份。複製的過程中資料還在變，所以它本身是「不一致」的，要配上那段期間的 WAL 才能用。</li>
<li><b>WAL 封存</b>（WAL archiving）：每寫滿一個 16 MB 的 WAL 檔，就把它複製到安全的地方。</li>
</ul>
<pre><code># postgresql.conf（主庫）
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /mnt/archive/%f &amp;&amp; cp %p /mnt/archive/%f'
archive_timeout = 60</code></pre>
<p><code>%p</code> 是 WAL 檔的路徑，<code>%f</code> 是檔名；<code>test ! -f</code> 確保不會蓋掉已經封存過的檔案。<code>archive_timeout = 60</code> 表示就算 16 MB 還沒寫滿，最多 60 秒也要換一個新檔、把舊的送出去。不然半夜流量很小時，一個檔可能好幾個小時都寫不滿，那幾個小時的資料就只存在主庫上。實務上不會真的用 <code>cp</code>，而是用 <b>pgBackRest</b>、<b>WAL-G</b> 或 Barman 這類工具，直接壓縮、加密、傳到另一個帳號的物件儲存。</p>
<figure class="figure"><svg viewBox="0 18 680 222" class="fg" style="width:100%;max-width:680px" role="img" aria-label="時間點還原的時間軸：週三 02:00 的基礎備份，加上之後一個個封存的 WAL 檔，依序重播到 14:32:04 停下，正好在 14:32:05 的壞部署之前">
<text x="60" y="54" class="fg-t sm">WAL 封存：每個檔 16 MB，一個接一個</text>
<text x="560" y="34" text-anchor="middle" class="fg-t sm warm">14:32:05 壞部署</text>
<rect x="60" y="62" width="44" height="22" rx="3" class="fg-b alt"/><rect x="108" y="62" width="44" height="22" rx="3" class="fg-b alt"/><rect x="156" y="62" width="44" height="22" rx="3" class="fg-b alt"/><rect x="204" y="62" width="44" height="22" rx="3" class="fg-b alt"/><rect x="252" y="62" width="44" height="22" rx="3" class="fg-b alt"/><rect x="300" y="62" width="44" height="22" rx="3" class="fg-b alt"/>
<rect x="348" y="62" width="44" height="22" rx="3" class="fg-b alt"/><rect x="396" y="62" width="44" height="22" rx="3" class="fg-b alt"/><rect x="444" y="62" width="44" height="22" rx="3" class="fg-b alt"/><rect x="492" y="62" width="44" height="22" rx="3" class="fg-b alt"/><rect x="540" y="62" width="44" height="22" rx="3" class="fg-b warm"/><rect x="588" y="62" width="44" height="22" rx="3" class="fg-b"/>
<line x1="30" y1="110" x2="642" y2="110" class="fg-l"/><polygon points="650,110 642,105.5 642,114.5" class="fg-a"/>
<line x1="60" y1="105" x2="60" y2="115" class="fg-l"/><line x1="220" y1="105" x2="220" y2="115" class="fg-l"/><line x1="380" y1="105" x2="380" y2="115" class="fg-l"/><line x1="540" y1="105" x2="540" y2="115" class="fg-l"/>
<text x="60" y="100" text-anchor="middle" class="fg-t sm">02:00</text><text x="220" y="100" text-anchor="middle" class="fg-t sm">06:00</text><text x="380" y="100" text-anchor="middle" class="fg-t sm">10:00</text><text x="526" y="100" text-anchor="middle" class="fg-t sm">14:00</text>
<line x1="560" y1="42" x2="560" y2="228" class="fg-l warm dash"/>
<rect x="30" y="150" width="150" height="44" rx="6" class="fg-b hot"/>
<text x="105" y="169" text-anchor="middle" class="fg-t acc">基礎備份</text>
<text x="105" y="186" text-anchor="middle" class="fg-t sm">週三 02:00 的整份資料</text>
<path d="M180 172 H552 V130" class="fg-l on"/><polygon points="552,122 547.5,130 556.5,130" class="fg-a on"/>
<text x="366" y="164" text-anchor="middle" class="fg-t sm acc">依序重播 WAL，停在目標時間</text>
<text x="544" y="148" text-anchor="end" class="fg-t sm acc">目標 14:32:04</text>
<text x="300" y="222" text-anchor="middle" class="fg-t sm">還原到另一台新機器，確認資料對了，再把需要的資料搬回正式環境</text>
</svg><figcaption>基礎備份是起點，WAL 是起點之後每一秒的變化。兩者合起來，你可以停在保留期間內的任何一秒，這就是時間點還原。</figcaption></figure>
<h4>時間點還原，一步一步</h4>
<p>情境：週三（2026-11-04）14:32:05，一次壞部署把 <code>players</code> 表的點數全部改錯了。每天 02:00 有基礎備份，WAL 持續封存。要做的是<b>時間點還原</b>（point-in-time recovery，PITR）：</p>
<ol>
<li><b>開一台新機器</b>，不要在正式主庫上還原。正式主庫在 14:32 之後還有正常的新資料，整台倒回去會把它們一起丟掉。</li>
<li><b>還原出事前最近的一份基礎備份</b>：週三 02:00 那份，解開到新機器的資料目錄。</li>
<li><b>告訴它去哪裡拿 WAL、停在哪裡</b>（PostgreSQL 12 以後寫在 <code>postgresql.conf</code>）：</li>
</ol>
<pre><code>restore_command = 'cp /mnt/archive/%f %p'
recovery_target_time = '2026-11-04 14:32:04+08'
recovery_target_action = 'pause'</code></pre>
<ol start="4">
<li><b>在資料目錄放一個空檔案 <code>recovery.signal</code></b>，然後啟動。它會從 02:00 開始一路重播封存的 WAL，到 14:32:04 停下來暫停。</li>
<li><b>暫停時進去查</b>：點數是不是還正確？停得太早或太晚，就改目標時間，從第 2 步重來。如果知道是哪一筆交易闖的禍，也可以用 <code>recovery_target_xid</code> 或 <code>recovery_target_lsn</code> 精準停在它前面。</li>
<li><b>確認無誤後</b>執行 <code>SELECT pg_wal_replay_resume();</code> 結束還原。它會開一條新的時間線，變成一台可以寫的獨立資料庫。</li>
<li><b>把需要的資料搬回正式環境</b>：例如匯出那張表正確的點數，跟正式環境比對後修正。這比把整個正式環境倒回去安全得多。</li>
</ol>
<p>要估還原要多久：假設這台資料庫每天產生 50 GB 的 WAL，從 02:00 重播到 14:32 大約 26 GB，如果重播速度是每秒 100 MB 上下，大概要四、五分鐘；但如果最近一份基礎備份是三天前的，就要重播 150 GB 以上，再加上下載備份的時間，可能就是一兩個小時。這就是基礎備份要做得夠頻繁的原因。PostgreSQL 17 開始，<code>pg_basebackup</code> 支援增量備份（先打開 <code>summarize_wal</code>，用 <code>--incremental</code> 做，再用 <code>pg_combinebackup</code> 組回完整備份），可以做得更頻繁，又不用每次都複製整份。</p>
<h4>兩個數字：RPO 和 RTO</h4>
<ul>
<li><b>RPO</b>（recovery point objective）：最多可以丟掉多久的資料。用 WAL 封存的話，大約就是還沒送出去的那個 WAL 檔，也就是 <code>archive_timeout</code> 的長度。</li>
<li><b>RTO</b>（recovery time objective）：從出事到恢復服務最多可以花多久。它不是你「覺得」要多久，而是你上一次演練時<b>量到</b>要多久。</li>
</ul>
<p>代管服務（例如 RDS）的自動備份就是這一整套：每天快照，加上持續上傳交易日誌，讓你挑保留期間（最長 35 天）裡的任何一秒還原。而且它一樣是還原成一台<b>新的</b>執行個體，不會覆蓋原本那台。</p>

<h3><span class="badge lv4">專家</span>九、備份是怎麼「其實不能用」的：還原演練</h3>
<p>2017 年 1 月，GitLab.com 的一位工程師在半夜處理複寫問題時，在錯的那台機器上刪掉了主庫的資料目錄。事後發現，他們準備的好幾種備份和複寫機制，在那個當下沒有一種能順利救回資料，最後丟了大約 6 小時的資料。他們把整個過程寫成公開的事後檢討，是這個主題最好的教材。備份失效的方式，通常是下面這幾種：</p>
<ul>
<li><b>封存默默地失敗。</b><code>archive_command</code> 一直回傳錯誤（權限不對、目的地滿了、憑證過期），沒人發現。PostgreSQL 會把送不出去的 WAL 留在 <code>pg_wal</code>，等磁碟被塞滿，主庫就停了。用 <code>SELECT failed_count, last_failed_wal FROM pg_stat_archiver;</code> 監控，失敗數一增加就要發警報。</li>
<li><b>複寫槽（replication slot）塞爆磁碟。</b>複寫槽會替一台副本或一個邏輯訂閱，保留它還沒收走的 WAL。那台副本下線了，主庫就無限期地保留 WAL。PostgreSQL 13 以後可以用 <code>max_slot_wal_keep_size</code> 設上限，超過就放棄那個槽，保住主庫。</li>
<li><b>備份跟正式環境放在一起。</b>攻擊者拿到了雲端帳號的權限，連備份一起刪掉或加密勒索。備份要放在另一個帳號，權限分開，最好打開物件儲存的不可變更功能（例如 S3 Object Lock），在保留期間內誰都刪不掉。</li>
<li><b>少了一塊。</b><code>pg_dump</code> 不會匯出角色和權限，要另外用 <code>pg_dumpall --globals-only</code>；加密備份的金鑰只存在被毀掉的那台機器上；還原後才發現擴充套件的版本不對。</li>
<li><b>還原得回來，但太慢。</b>RTO 說好一小時，第一次演練才發現下載加重播要九小時。</li>
</ul>
<h4>一份像樣的還原演練</h4>
<ol>
<li>每個月從備份還原一次，到一個隔離的環境，最好排程自動跑。</li>
<li>還原後自動檢查：重要表的筆數、最新一筆資料的時間、幾個關鍵查詢的結果，再讓應用程式連上去跑一次冒煙測試（smoke test）。</li>
<li>記錄每一步花多久，跟 RTO 比。</li>
<li>任何一步失敗都要發警報，跟正式環境的警報一樣認真對待。</li>
</ol>
<p>老規矩「3-2-1」仍然好用：至少 3 份資料、放在 2 種不同的媒介、其中 1 份在異地。在雲端可以理解成：正式資料庫一份、同區域的自動備份一份、另一個帳號和另一個區域再一份。</p>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>同步複寫，副本就馬上讀得到最新資料</td><td>PostgreSQL 預設的 <code>on</code> 只保證 WAL 到了副本的磁碟。要 <code>remote_apply</code>，才保證副本已經重播、讀得到。</td></tr>
<tr><td>延遲顯示 0 秒就是健康</td><td>量法有盲點：MySQL 的 <code>Seconds_Behind_Source</code> 在「收」的那段落後時會顯示 0；用時間戳算的方法在主庫閒置時又會誤報。最準的是心跳表。</td></tr>
<tr><td>偵測到主庫沒回應，就該立刻升格</td><td>太快升格，會把一次網路抖動變成腦裂。先確定舊主庫已經被圍籬，才升格。</td></tr>
<tr><td>兩台資料庫互相監控，就能自動容錯移轉</td><td>斷線時兩邊都是一票，沒有多數決，誰都不能安全地自己升格。至少要三票。</td></tr>
<tr><td>有在做備份就安全了</td><td>只有還原成功過、量過時間的備份才算數。封存默默失敗、少了金鑰或角色，都是等到要用時才發現。</td></tr>
<tr><td>時間點還原就是把正式資料庫倒回去</td><td>通常是還原到一台新機器，只把需要的資料搬回來。出事之後的正常寫入要保住。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>Node.js／Go 後端</b>：通常會有兩組連線池，一組連主庫、一組連副本。很多 ORM 支援讀寫分離設定，但「哪些讀取一定要走主庫」得你自己決定。特別注意「寫完立刻讀」的流程，例如建立訂單後馬上跳到訂單頁。</li>
<li><b>處理容錯移轉的錯誤</b>：連線重設、唯讀錯誤、逾時，都要能重連、退避重試，而且重試是冪等的。在測試環境故意做一次容錯移轉（代管服務大多有「重新開機並容錯移轉」的選項），量你的服務多久恢復、日誌裡出現哪些錯誤。</li>
<li><b>Docker 與 Kubernetes</b>：在容器裡跑資料庫，資料一定要放在持久磁碟區（persistent volume）。高可用交給 operator，不要自己寫切換腳本。Pod 重啟不等於容錯移轉演練。</li>
<li><b>前端與遊戲</b>：存檔後用 API 的回傳值更新畫面。排行榜可以讀副本，晚幾秒沒關係；玩家自己的點數和道具，讀主庫。</li>
<li><b>雲端</b>：去檢查一次：PITR 有沒有打開、保留幾天、快照有沒有複製到另一個帳號或區域、上一次還原演練是什麼時候。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<p>下面是後端、DevOps、SRE 面試裡真的會出現的題目。先自己講一遍（最好出聲講），再打開參考答案。</p>
<ol>
<li>「同步複寫和非同步複寫差在哪？各自會怎麼出事？」</li>
<li>「使用者改完暱稱重新整理，看到的還是舊的。你怎麼查、怎麼修？」</li>
<li>「什麼是腦裂？你會怎麼避免？」</li>
<li>「昨天下午 3 點有人誤刪了一張表，你要怎麼救回來？」</li>
<li>「複寫延遲突然從 1 秒變成 10 分鐘，你會查哪些東西？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>差在主庫回 OK 之前要不要等副本確認。非同步快，副本掛了也不影響主庫；但主庫掛掉時，已經回 OK、還沒送到副本的寫入會遺失，RPO 大於零。同步保證回 OK 時至少兩台有資料，代價是每筆寫入多一趟網路來回，而且同步副本掛掉時寫入會卡住，所以要準備兩台候選（例如 <code>ANY 1</code>），或接受工具在副本不健康時暫時退回非同步，並為此設警報。</li>
<li>先確認那次讀取走的是副本，再量那台副本的延遲（<code>pg_stat_replication</code> 的 <code>replay_lag</code>，或心跳表）。修法依成本由低到高：寫入後一段時間該使用者讀主庫；記下寫入的 LSN 或 GTID，只讀已經追上的副本；那個交易用 <code>remote_apply</code>；自己的資料一律讀主庫。同時讓同一個使用者固定讀同一台副本，避免單調讀取的問題。最後還要追延遲為什麼變大：大交易、副本規格太小、副本上的長查詢衝突。</li>
<li>兩台機器同時認為自己是主庫、各自收寫入，歷史分岔，無法自動合併，只能丟掉一邊。防法：用至少三票的共識系統（etcd 等）選主，只有多數那一邊能選出主庫；主庫身分做成有期限的租約，續不了約就自己降級；用看門狗防止管理程式卡死；必要時用 STONITH 或圍籬權杖讓舊主庫的寫入被拒絕。兩節點沒有第三票，就不能安全地自動切換。</li>
<li>確認有基礎備份和連續的 WAL 封存（或代管服務的 PITR）。開一台新機器，還原 15:00 之前最近的基礎備份，設 <code>restore_command</code> 和還原目標（例如刪除前一秒的時間，或用 <code>recovery_target_xid</code> 停在那筆交易之前），用 pause 停下來檢查，確認後結束還原。把那張表匯出，匯回正式環境，必要時跟之後的新資料合併。不要把正式環境整台倒回去。事後檢討權限，並把這次的還原時間記成 RTO 的實測值。</li>
<li>分段看。先看主庫 WAL 產生速度有沒有暴增（大交易、批次、建索引）。再看 <code>pg_stat_replication</code> 裡 sent、write、flush、replay 是哪一段落後：送出就落後，是網路或主庫的問題；收到了沒重播，是副本跟不上（CPU 或磁碟、單行程重播、副本上的長查詢衝突）。看副本主機的磁碟使用率，看有沒有人在副本跑長報表。MySQL 則看套用的執行緒是不是卡在一個大交易或 DDL 上。短期先暫停批次、把讀流量移到別台；長期把批次切小、加大副本規格。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>主庫高峰時每秒產生 12 MB 的 WAL，副本每秒能重播 10 MB。高峰持續 30 分鐘，結束時副本落後多少？高峰後 WAL 產生速度降到每秒 4 MB，副本要多久才追上？</li>
<li>用 Docker 量 WAL：<code>docker run -d --name pg -e POSTGRES_PASSWORD=pw postgres:17</code>，再用 <code>docker exec -it pg psql -U postgres</code> 進去。先記下 <code>SELECT pg_current_wal_lsn();</code>，接著執行 <code>CREATE TABLE t AS SELECT g AS id, md5(g::text) AS v FROM generate_series(1, 100000) g;</code>，再用 <code>pg_wal_lsn_diff</code> 算產生了多少 WAL。然後 <code>UPDATE t SET v = v || 'x';</code> 再量一次。兩次的大小跟表本身比起來如何？為什麼？做完 <code>docker rm -f pg</code>。</li>
<li>三台資料庫放在兩個機房：機房一放主庫 A 和副本 B，機房二放副本 C，etcd 也照 2＋1 這樣放。兩個機房之間的網路斷了，哪一邊能繼續寫？如果是機房一整個停電呢？</li>
<li>你設了 <code>synchronous_standby_names = 'b'</code>，只有一台同步副本。凌晨 3 點 B 的磁碟壞了，會發生什麼事？要怎麼設定才不會這樣，代價是什麼？</li>
<li>週三 14:32:05 有人誤下了一句沒有 WHERE 的 <code>DELETE FROM rounds</code>，每天 02:00 有基礎備份。寫出你的還原計畫：用哪一份備份、目標停在哪裡、怎麼把資料救回正式環境，而且不丟掉 14:32 之後的新資料。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>每秒多出 2 MB，30 分鐘是 1,800 秒，落後 3,600 MB，大約 3.6 GB。高峰後副本每秒重播 10 MB、新進來 4 MB，每秒淨追回 6 MB，3,600 ÷ 6 = 600 秒，大約 10 分鐘。</li>
<li><code>CREATE TABLE AS</code> 產生的 WAL 大約跟表的大小同一個數量級（幾 MB 到十幾 MB），因為每一列都要記下來。<code>UPDATE</code> 也差不多是整張表的量，有時更多：PostgreSQL 的更新會寫出每一列的新版本；而且如果中間發生過檢查點，之後第一次改到某一頁時，會把整頁寫進 WAL（full page write），防止寫到一半的頁面無法復原。</li>
<li>網路斷掉時，機房一有 2 票、是多數，A 繼續當主庫；機房二只有 1 票，C 不能升格，只能讀。機房一整個停電時，機房二只剩 1 票，沒有多數，不會自動升格，要人工判斷後介入。想撐過整個機房故障，投票成員要分散在三個地點（例如三個可用區各一）。</li>
<li>所有 COMMIT 都會卡住等 B，整個服務的寫入停擺。改成 <code>'ANY 1 (b, c)'</code>，準備兩台同步候選，任一台確認就好；代價是多一台機器，以及每筆寫入仍然要等一趟網路。另一種做法是讓 Patroni 的同步模式在副本不健康時暫時退回非同步，代價是那段時間沒有零遺失保證，必須有警報。</li>
<li>開一台新機器，還原週三 02:00 的基礎備份，設 <code>recovery_target_time = '2026-11-04 14:32:04+08'</code>（或用那筆 DELETE 的交易編號設 <code>recovery_target_xid</code>，停在它之前），<code>recovery_target_action = 'pause'</code>，放 <code>recovery.signal</code> 後啟動。停下來後查 <code>rounds</code> 的筆數和最新時間，確認正確。用 <code>pg_dump -t rounds</code> 匯出，在正式環境匯進一張暫存表，再把被刪的資料列補回 <code>rounds</code>（用主鍵避開 14:32 之後新增的列）。正式環境從頭到尾不用停，也不會丟掉 14:32 之後的新資料。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>PostgreSQL 官方文件</b>（<a href="https://www.postgresql.org/docs/current/">postgresql.org/docs/current</a>）：「High Availability, Load Balancing, and Replication」和「Backup and Restore」兩章。這一章的每個設定，那裡都有完整的說明。</li>
<li><b>Martin Kleppmann《Designing Data-Intensive Applications》</b>：第一版第 5 章 Replication，把同步、非同步、讀到自己寫的、單調讀取、腦裂講得非常清楚，是資料系統的必讀書。</li>
<li><b>Patroni 官方文件</b>（<a href="https://patroni.readthedocs.io/">patroni.readthedocs.io</a>）：看它怎麼用 etcd 選主、怎麼自我降級，就懂一個正經的高可用工具在擋哪些事。</li>
<li><b>GitLab 2017 年 1 月 31 日資料庫事故的事後檢討</b>（GitLab 官方部落格）：一份坦白得少見的公開報告，看完你會想馬上去做一次還原演練。</li>
<li><b>Google《Site Reliability Engineering》</b>（<a href="https://sre.google/books/">sre.google/books</a>，可免費線上閱讀）：講資料完整性（Data Integrity）的那一章，談備份、還原和「你要的其實是還原，不是備份」。</li>
</ul>
` });
