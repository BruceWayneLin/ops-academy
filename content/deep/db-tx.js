DEEP({ 'db-tx': `
<p>上一課教你用一道 UPDATE、鎖或版本號，擋住「兩個人同時改餘額」。這一章往下挖到資料庫裡面：ACID 這四個字母各是靠什麼機制兌現的、PostgreSQL 怎麼靠「一列存好幾個版本」讓讀和寫互不相擋、四種隔離層級各會放過哪些怪事、鎖是怎麼排隊的、死結是怎麼被抓出來的，還有一個開著忘了關的交易，怎麼讓整個資料庫慢慢腫起來。最後把這些全部用上，設計一套高併發下也不會算錯錢的轉帳。主角一樣是 PostgreSQL，MySQL 不一樣的地方會點出來。</p>

<h3><span class="badge lv1">基礎</span>一、ACID 四個字母，各靠什麼兌現</h3>
<p>想像以前銀行的櫃台：行員收到一筆轉帳，第一件事不是去搬錢，而是先在流水帳簿上寫一行「A 轉 30 給 B」。就算寫完之後停電，隔天照著帳簿重做一次，帳就對了。資料庫的交易（transaction）也是這個思路，四個承諾各有一套機制在背後撐著：</p>
<table>
<tr><th>字母與承諾</th><th>PostgreSQL 靠什麼做到</th></tr>
<tr><td><b>A</b>tomicity 原子性：全做或全不做</td><td>每個改動都標著交易編號。交易失敗，只要在提交紀錄裡把這個編號標成「已中止」，它寫的東西就全部視而不見</td></tr>
<tr><td><b>C</b>onsistency 一致性：規則前後都成立</td><td>只管你<b>宣告</b>過的規則：主鍵、外鍵、唯一、<code>CHECK</code>、<code>NOT NULL</code>。沒寫成約束的業務規則，資料庫不知道</td></tr>
<tr><td><b>I</b>solation 隔離性：同時跑的交易互不干擾</td><td>MVCC 快照加上鎖，第二到第五節的主題</td></tr>
<tr><td><b>D</b>urability 持久性：提交了就不會不見</td><td>預寫式日誌（write-ahead log，WAL）：提交時先把日誌寫進磁碟，才回覆成功</td></tr>
</table>
<p>C 是最容易被誤會的一個。「轉帳前後兩個帳戶的總額不變」，資料庫完全不知道這條規則；它只知道你寫下的 <code>CHECK (balance &gt;= 0)</code>。所以 C 其實一半是你的責任：能寫成約束的規則就寫成約束，剩下的靠交易把多個步驟綁在一起。</p>
<h4>D 的真相：WAL</h4>
<figure class="figure"><svg viewBox="0 0 680 300" class="fg" style="width:100%;max-width:680px" role="img" aria-label="提交的流程：應用程式的改動先改在記憶體的資料頁並寫一筆 WAL；COMMIT 時把 WAL fsync 到磁碟，完成後才回覆成功；資料頁之後才慢慢寫回資料檔">
<rect x="16" y="110" width="104" height="56" rx="6" class="fg-b"/>
<text x="68" y="134" text-anchor="middle" class="fg-t">應用程式</text>
<text x="68" y="153" text-anchor="middle" class="fg-t sm mono">COMMIT</text>
<text x="280" y="24" text-anchor="middle" class="fg-t sm">記憶體</text>
<rect x="170" y="34" width="220" height="200" rx="8" class="fg-b dash"/>
<rect x="185" y="56" width="190" height="50" rx="6" class="fg-b alt"/>
<text x="280" y="77" text-anchor="middle" class="fg-t">資料頁（shared_buffers）</text>
<text x="280" y="96" text-anchor="middle" class="fg-t sm">改在這裡，先不寫回</text>
<rect x="185" y="170" width="190" height="50" rx="6" class="fg-b alt"/>
<text x="280" y="191" text-anchor="middle" class="fg-t">WAL 緩衝區</text>
<text x="280" y="210" text-anchor="middle" class="fg-t sm">記下「改了什麼」</text>
<text x="582" y="24" text-anchor="middle" class="fg-t sm">磁碟</text>
<rect x="500" y="34" width="164" height="200" rx="8" class="fg-b dash"/>
<rect x="512" y="56" width="140" height="50" rx="6" class="fg-b"/>
<text x="582" y="77" text-anchor="middle" class="fg-t">資料檔</text>
<text x="582" y="96" text-anchor="middle" class="fg-t sm">表和索引，隨機位置</text>
<rect x="512" y="170" width="140" height="50" rx="6" class="fg-b hot"/>
<text x="582" y="191" text-anchor="middle" class="fg-t acc">WAL 檔</text>
<text x="582" y="210" text-anchor="middle" class="fg-t sm">只往後附加，循序寫</text>
<path d="M120 124 H145 V81 H177" class="fg-l"/><polygon points="185,81 177,76.5 177,85.5" class="fg-a"/>
<path d="M120 152 H145 V195 H177" class="fg-l"/><polygon points="185,195 177,190.5 177,199.5" class="fg-a"/>
<text x="126" y="143" class="fg-t">①</text>
<line x1="375" y1="195" x2="504" y2="195" class="fg-l on"/><polygon points="512,195 504,190.5 504,199.5" class="fg-a on"/>
<text x="445" y="186" text-anchor="middle" class="fg-t sm acc">② fsync</text>
<line x1="375" y1="81" x2="504" y2="81" class="fg-l dash"/><polygon points="512,81 504,76.5 504,85.5" class="fg-a"/>
<text x="445" y="72" text-anchor="middle" class="fg-t sm">④ 之後才寫</text>
<path d="M582 220 V262 H68 V174" class="fg-l on"/><polygon points="68,166 63.5,174 72.5,174" class="fg-a on"/>
<text x="325" y="255" text-anchor="middle" class="fg-t sm acc">③ WAL 安全落地，才回覆「提交成功」</text>
<text x="340" y="290" text-anchor="middle" class="fg-t sm">當機後：從上一個檢查點開始重播 WAL，把沒寫回的資料頁補回來</text>
</svg><figcaption>提交的那一刻，真正寫進磁碟的只有 WAL。資料頁可以等一下再寫，因為就算當機，WAL 裡已經有足夠的資訊把它們重做出來。</figcaption></figure>
<ol>
<li>交易裡每改一列，PostgreSQL 改的是記憶體裡的資料頁，同時在 WAL 緩衝區記一筆「哪一頁、改了什麼」。</li>
<li>你下 <code>COMMIT</code>，它把 WAL 寫到磁碟並呼叫 <code>fsync</code>，確定資料真的落在磁碟上，不是停在作業系統的快取裡。</li>
<li>fsync 回來了，才回覆你「提交成功」。</li>
<li>被改過的資料頁，之後由背景行程和檢查點（checkpoint）慢慢寫回資料檔。</li>
</ol>
<p>為什麼不直接把資料頁寫回去？因為一個交易可能改了分散在十個檔案裡的十頁，每一頁都是一次隨機寫；WAL 則永遠只往檔尾附加，是最快的循序寫。同時提交的交易，常常還能共用同一次 fsync。</p>
<p>代價是：每次提交至少要等一次 fsync，從不到一毫秒到好幾毫秒都有，看磁碟而定，雲端網路磁碟通常比本機 SSD 慢。所以「一個連線、一筆一筆提交」的寫入速度有上限；大量匯入時，把一千列包在一個交易裡，會比一千個交易快上很多。<code>synchronous_commit = off</code> 可以不等 fsync 就回覆，當機時可能丟掉最後一小段時間（預設設定下不到一秒）已經回覆成功的交易，但資料不會壞。MySQL InnoDB 的對應物是 redo log，<code>innodb_flush_log_at_trx_commit = 1</code>（預設）才是每次提交都 fsync。</p>

<h3><span class="badge lv1">基礎</span>二、MVCC：一列同時存好幾個版本</h3>
<p>如果資料庫只有一份資料，讀的人和寫的人就得輪流：有人在改，其他人都不能讀，不然會讀到改到一半的東西。這樣在高併發下根本跑不動。</p>
<p>PostgreSQL 的解法叫<b>多版本並行控制</b>（multi-version concurrency control，MVCC）：<b>UPDATE 不覆蓋舊的那一列，而是另外寫一個新版本。</b>就像雜誌社出新一期，不會跑去把讀者手上的舊一期收回來；正在讀舊一期的人繼續讀，新來的人拿新的。</p>
<figure class="figure"><svg viewBox="0 0 680 290" class="fg" style="width:100%;max-width:680px" role="img" aria-label="同一列的兩個版本：版本 A balance 100、xmin 90、xmax 101；版本 B balance 70、xmin 101。T1 的快照拍在 T2 提交前，所以看到 100；T3 在 T2 提交後才開始，看到 70；T2 把 A 標成舊版並寫入 B">
<text x="340" y="28" text-anchor="middle" class="fg-t">accounts 裡 id = 1 這一列，現在有兩個版本</text>
<rect x="20" y="60" width="150" height="56" rx="6" class="fg-b alt"/>
<text x="95" y="83" text-anchor="middle" class="fg-t">T1（xid 100）</text>
<text x="95" y="103" text-anchor="middle" class="fg-t sm">快照：101 還沒提交</text>
<line x1="170" y1="88" x2="222" y2="88" class="fg-l alt"/><polygon points="230,88 222,83.5 222,92.5" class="fg-a alt"/>
<text x="200" y="80" text-anchor="middle" class="fg-t sm alt">看到 100</text>
<rect x="230" y="60" width="220" height="56" rx="6" class="fg-b"/>
<text x="340" y="83" text-anchor="middle" class="fg-t mono">版本 A：balance = 100</text>
<text x="340" y="103" text-anchor="middle" class="fg-t sm mono">xmin 90 · xmax 101</text>
<line x1="340" y1="116" x2="340" y2="162" class="fg-l dim dash"/><polygon points="340,170 335.5,162 344.5,162" class="fg-a"/>
<text x="350" y="148" class="fg-t sm">UPDATE 產生的新版本</text>
<rect x="230" y="170" width="220" height="56" rx="6" class="fg-b hot"/>
<text x="340" y="193" text-anchor="middle" class="fg-t mono acc">版本 B：balance = 70</text>
<text x="340" y="213" text-anchor="middle" class="fg-t sm mono">xmin 101 · xmax 0</text>
<rect x="20" y="170" width="150" height="56" rx="6" class="fg-b alt"/>
<text x="95" y="193" text-anchor="middle" class="fg-t">T3（xid 102）</text>
<text x="95" y="213" text-anchor="middle" class="fg-t sm">T2 提交後才開始</text>
<line x1="170" y1="198" x2="222" y2="198" class="fg-l on"/><polygon points="230,198 222,193.5 222,202.5" class="fg-a on"/>
<text x="200" y="190" text-anchor="middle" class="fg-t sm acc">看到 70</text>
<rect x="510" y="113" width="150" height="60" rx="6" class="fg-b warm"/>
<text x="585" y="137" text-anchor="middle" class="fg-t">T2（xid 101）</text>
<text x="585" y="157" text-anchor="middle" class="fg-t sm">UPDATE 成 70，已提交</text>
<path d="M510 128 H482 V88 H458" class="fg-l warm"/><polygon points="450,88 458,83.5 458,92.5" class="fg-a warm"/>
<text x="487" y="78" text-anchor="middle" class="fg-t sm warm">標成舊版</text>
<path d="M510 158 H482 V198 H458" class="fg-l warm"/><polygon points="450,198 458,193.5 458,202.5" class="fg-a warm"/>
<text x="487" y="220" text-anchor="middle" class="fg-t sm warm">寫新版本</text>
<text x="340" y="268" text-anchor="middle" class="fg-t sm acc">讀的人看自己快照裡的版本，寫的人寫新版本：讀不擋寫、寫不擋讀</text>
</svg><figcaption>同一列在表裡同時躺著兩個版本。每個交易拿著自己的快照，自己判斷該看哪一個。</figcaption></figure>
<p>每個版本的標頭上有兩個交易編號（xid）：<b>xmin</b> 是「誰建立了這個版本」，<b>xmax</b> 是「誰把它刪掉或改掉了」，還活著的版本 xmax 是 0。你可以直接看：</p>
<pre><code>SELECT xmin, xmax, * FROM acct WHERE id = 1;
 xmin | xmax | id | balance
------+------+----+---------
  101 |    0 |  1 |      70</code></pre>
<p><b>快照</b>（snapshot）是一張「拍照當下，哪些交易已經提交」的清單。判斷一個版本看不看得到，規則是：它的 xmin 在我的快照裡已經提交，而且它的 xmax 是 0，或 xmax 那個交易在我的快照裡還不算提交（還在跑，或已經中止）。照這條規則走一次上圖（只讀的交易其實只拿一個虛擬編號，這裡為了好講都標上數字）：</p>
<ul>
<li>T1 的快照拍在 T2 提交之前。版本 A 的 xmax 是 101，可是 101 在 T1 的快照裡還沒提交，所以 A 對 T1 還活著：看到 100。版本 B 的 xmin 是 101，同樣還沒提交，看不到。</li>
<li>T3 在 T2 提交之後才拍快照。A 已經被提交的 101 改掉了，看不到；B 由已提交的 101 建立，看得到：70。</li>
</ul>
<p>這就是 MVCC 最值錢的性質：<b>讀不擋寫、寫不擋讀</b>。只有「兩個人要寫同一列」才需要排隊。報表跑十分鐘，也不會卡住任何下單。</p>
<p>MySQL InnoDB 也是 MVCC，但放的位置相反：最新版本直接蓋在原本的位置，舊版本推進 undo log，讀舊快照的人沿著 undo log 的鏈往回推算出舊值。PostgreSQL 則把新舊版本都留在表裡，所以需要第七節的 VACUUM 來清。</p>

<h3><span class="badge lv2">進階</span>三、隔離層級：快照拍在什麼時候</h3>
<p>隔離層級（isolation level）聽起來很抽象，在 PostgreSQL 裡其實就是一個很具體的問題：<b>快照什麼時候拍？</b></p>
<ul>
<li><b>Read Committed</b>（PostgreSQL 預設）：交易裡的<b>每一道敘述</b>開始時，各拍一張新的。</li>
<li><b>Repeatable Read</b>：整個交易只在第一道敘述時拍<b>一張</b>，之後一直用它。</li>
<li><b>Serializable</b>：跟 Repeatable Read 一樣只拍一張，再加上一套偵測「危險的讀寫依賴」的機制。</li>
</ul>
<p>用兩個連線實際走一次，帳戶餘額原本是 100。T1 分別用兩種層級各跑一遍：</p>
<pre><code>T1: BEGIN;
T1: SELECT balance FROM acct WHERE id = 1;
    -- 兩種層級都是 100
T2: UPDATE acct SET balance = 70 WHERE id = 1;   -- 自動提交
T1: SELECT balance FROM acct WHERE id = 1;
    -- Read Committed：70（這一句拍了新快照）
    -- Repeatable Read：100（還是同一張快照）
T1: UPDATE acct SET balance = balance - 30 WHERE id = 1;
    -- Read Committed：成功，變成 40
    -- Repeatable Read：ERROR: could not serialize access
    --                  due to concurrent update（40001）</code></pre>
<p>第二次 SELECT 就是<b>不可重複讀</b>（non-repeatable read）：同一個交易裡讀兩次，結果不一樣。最後那道 UPDATE 更值得細看：</p>
<ul>
<li>在 Read Committed，<code>UPDATE</code> 會拿這一列<b>最新已提交</b>的版本來算（70 − 30 = 40）。這就是為什麼上一課說「用一道 UPDATE 做完」是安全的：不會用到過期的值。</li>
<li>在 Repeatable Read，T1 要改的列，在它的快照之後被別人改過了。PostgreSQL 不肯讓它拿舊快照的值去蓋，直接報錯，要你整個重來。這等於自動幫你擋下了更新遺失（lost update）。</li>
</ul>
<h4>五種怪事與各層級擋得住哪些</h4>
<ul>
<li><b>髒讀</b>（dirty read）：讀到別人還沒提交、之後可能回復的資料。</li>
<li><b>不可重複讀</b>：同一列讀兩次，值不一樣。</li>
<li><b>幻讀</b>（phantom）：同一個範圍查兩次，多出或少了幾列。</li>
<li><b>更新遺失</b>：兩邊各自讀出來、在程式裡算好、各自寫回，一邊的改動被蓋掉。</li>
<li><b>寫入偏斜</b>（write skew）：兩邊讀同一份資料，各自寫<b>不同的列</b>，合起來違反規則（下一節）。</li>
</ul>
<table>
<tr><th>怪事</th><th>Read Committed</th><th>Repeatable Read</th><th>Serializable</th></tr>
<tr><td>髒讀</td><td>不會</td><td>不會</td><td>不會</td></tr>
<tr><td>不可重複讀</td><td>會</td><td>不會</td><td>不會</td></tr>
<tr><td>幻讀</td><td>會</td><td>不會（標準允許）</td><td>不會</td></tr>
<tr><td>更新遺失</td><td>會</td><td>報錯擋下</td><td>不會</td></tr>
<tr><td>寫入偏斜</td><td>會</td><td>會</td><td>不會</td></tr>
</table>
<p>注意這張表是 PostgreSQL 的實際行為，比 SQL 標準規定的嚴格：標準允許 Repeatable Read 出現幻讀，PostgreSQL 因為整個交易用同一張快照，所以不會。PostgreSQL 也根本不會髒讀，就算你設成 Read Uncommitted，它也當成 Read Committed。</p>
<h4>MySQL 的 Repeatable Read 是另一回事</h4>
<p>MySQL InnoDB 預設是 Repeatable Read，但它的規則是：一般的 <code>SELECT</code> 讀快照（consistent read），<code>UPDATE</code>、<code>DELETE</code> 和 <code>SELECT ... FOR UPDATE</code> 卻讀<b>最新已提交</b>的版本（current read），並且把讀過的列和列之間的「間隙」一起鎖住（next-key lock），用來擋幻讀。結果是：</p>
<ul>
<li>在 MySQL 的 Repeatable Read，「先 SELECT 出 100，在程式裡算成 70，再 UPDATE 寫回 70」的更新遺失<b>不會報錯</b>，會靜靜地蓋過去。PostgreSQL 同一個層級會報錯。</li>
<li>間隙鎖會讓一些你以為不相干的 INSERT 也被擋住，是 MySQL 死結的常見來源。</li>
</ul>
<p>同一個名字、不同的行為。換資料庫時，隔離層級的假設一定要重新驗證。</p>

<h3><span class="badge lv2">進階</span>四、寫入偏斜：連 Repeatable Read 都擋不住的 bug</h3>
<p>猜高低的規則：每個玩家每天最多 3 局免費局。程式這樣寫，邏輯上完全正確：</p>
<pre><code>BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT count(*) FROM rounds              -- 得到 2
WHERE user_id = 42 AND free
  AND created_at &gt;= current_date;
-- 程式判斷：2 &lt; 3，可以再玩一局
INSERT INTO rounds (user_id, free, created_at)
VALUES (42, true, now());
COMMIT;</code></pre>
<p>玩家用兩支手機同時按「開始」：</p>
<figure class="figure"><svg viewBox="0 0 680 320" class="fg" style="width:100%;max-width:680px" role="img" aria-label="寫入偏斜的時間軸：請求 A 和請求 B 幾乎同時數到 2 局，各自新增第 3 局並成功提交，結果當天有 4 局免費局">
<text x="340" y="24" text-anchor="middle" class="fg-t">規則：每天最多 3 局免費局（目前已有 2 局）</text>
<text x="20" y="85" class="fg-t">請求 A</text>
<text x="20" y="175" class="fg-t">請求 B</text>
<rect x="100" y="60" width="120" height="40" rx="5" class="fg-b alt"/><text x="160" y="77" text-anchor="middle" class="fg-t sm mono">SELECT count(*)</text><text x="160" y="93" text-anchor="middle" class="fg-t sm">得到 2：可以玩</text>
<line x1="220" y1="80" x2="262" y2="80" class="fg-l"/><polygon points="270,80 262,75.5 262,84.5" class="fg-a"/>
<rect x="270" y="60" width="120" height="40" rx="5" class="fg-b"/><text x="330" y="77" text-anchor="middle" class="fg-t sm mono">INSERT</text><text x="330" y="93" text-anchor="middle" class="fg-t sm">新增第 3 局</text>
<line x1="390" y1="80" x2="432" y2="80" class="fg-l"/><polygon points="440,80 432,75.5 432,84.5" class="fg-a"/>
<rect x="440" y="60" width="120" height="40" rx="5" class="fg-b hot"/><text x="500" y="77" text-anchor="middle" class="fg-t sm mono">COMMIT</text><text x="500" y="93" text-anchor="middle" class="fg-t sm acc">成功</text>
<rect x="150" y="150" width="120" height="40" rx="5" class="fg-b alt"/><text x="210" y="167" text-anchor="middle" class="fg-t sm mono">SELECT count(*)</text><text x="210" y="183" text-anchor="middle" class="fg-t sm">也得到 2：可以玩</text>
<line x1="270" y1="170" x2="312" y2="170" class="fg-l"/><polygon points="320,170 312,165.5 312,174.5" class="fg-a"/>
<rect x="320" y="150" width="120" height="40" rx="5" class="fg-b"/><text x="380" y="167" text-anchor="middle" class="fg-t sm mono">INSERT</text><text x="380" y="183" text-anchor="middle" class="fg-t sm">也新增第 3 局</text>
<line x1="440" y1="170" x2="482" y2="170" class="fg-l"/><polygon points="490,170 482,165.5 482,174.5" class="fg-a"/>
<rect x="490" y="150" width="120" height="40" rx="5" class="fg-b hot"/><text x="550" y="167" text-anchor="middle" class="fg-t sm mono">COMMIT</text><text x="550" y="183" text-anchor="middle" class="fg-t sm acc">也成功</text>
<line x1="100" y1="220" x2="642" y2="220" class="fg-l dim"/><polygon points="650,220 642,215.5 642,224.5" class="fg-a"/>
<text x="650" y="238" text-anchor="end" class="fg-t sm">時間</text>
<text x="340" y="262" text-anchor="middle" class="fg-t sm warm">結果：今天有 4 局免費局，而兩個請求各自都沒做錯</text>
<text x="340" y="284" text-anchor="middle" class="fg-t sm">兩邊讀同一份「2 局」，寫的是各自新增的列：沒有任何一列被兩邊同時改</text>
<text x="340" y="306" text-anchor="middle" class="fg-t sm acc">Serializable 會發現這個讀寫依賴，取消其中一個（40001）</text>
</svg><figcaption>這就是寫入偏斜：兩個交易的前提（「目前 2 局」）在它們提交時都已經不成立了，可是因為它們沒改到同一列，鎖和版本檢查都抓不到。</figcaption></figure>
<p>為什麼 Repeatable Read 擋不住？它只檢查「我要改的那一列，有沒有被別人改過」。這裡兩邊改的是各自新增的列，根本沒有交集。經典教科書版本是「醫院規定至少一位醫生值班，兩位值班醫生同時查到有兩人在班，各自請假」，結構一模一樣。</p>
<h4>三種修法</h4>
<ol>
<li><b>Serializable 加重試。</b>PostgreSQL 的 Serializable 用的是可序列化快照隔離（Serializable Snapshot Isolation，SSI）：它記下每個交易讀過哪些資料（不會真的擋人，只是記錄），發現「A 讀的東西被 B 改了、B 讀的東西又被 A 改了」這種循環，就取消其中一個，回 40001。你的程式要能把<b>整個交易</b>重跑一次。</li>
<li><b>把衝突變成同一列。</b>先鎖住一列兩邊都一定會碰的「代表」：<code>SELECT 1 FROM users WHERE id = 42 FOR UPDATE;</code>。同一個玩家的請求就會在這裡排隊，一個一個來。</li>
<li><b>交給約束。</b>把規則變成一個數字加上 <code>CHECK</code>：每日一列 <code>daily_quota (user_id, day, free_used CHECK (free_used &lt;= 3))</code>，開局時 <code>UPDATE ... SET free_used = free_used + 1</code>。同一列的 UPDATE 會排隊，第四次會被 CHECK 擋掉。「同時只能有一局進行中」這種規則，更可以直接用上一章的部分唯一索引。</li>
</ol>
<p>第一種最通用，第三種最可靠。重試一定要寫對：</p>
<pre><code>async function withRetry&lt;T&gt;(
  runTx: () =&gt; Promise&lt;T&gt;,   // 整個交易：BEGIN ... COMMIT
  max = 5,
): Promise&lt;T&gt; {
  for (let attempt = 1; ; attempt++) {
    try {
      return await runTx();
    } catch (e: any) {
      const retryable =
        e.code === '40001' || e.code === '40P01';
      if (!retryable || attempt &gt;= max) throw e;
      const ms = Math.random() * 20 * 2 ** attempt;
      await new Promise(r =&gt; setTimeout(r, ms));
    }
  }
}</code></pre>
<p>三個重點：重跑的是從 <code>BEGIN</code> 到 <code>COMMIT</code> 的<b>整個交易</b>，包括裡面的 SELECT，因為前提可能已經變了；只重試 40001（序列化失敗）和 40P01（死結）這兩種；等待時間要隨機、而且越來越長，不然兩邊會同時重試、又同時撞在一起。</p>

<h3><span class="badge lv3">專業</span>五、鎖：誰在等誰</h3>
<p>MVCC 讓讀和寫不用排隊，但兩個人要<b>寫同一列</b>，還是得排。這靠的是<b>列鎖</b>（row lock）：</p>
<ul>
<li><code>UPDATE</code>、<code>DELETE</code> 會自動鎖住改到的列，直到交易結束才放。</li>
<li><code>SELECT ... FOR UPDATE</code>：只讀不改，但先把列鎖起來，宣告「這幾列等一下我要改」。</li>
<li><code>FOR SHARE</code>：大家都可以一起鎖來讀，但誰都不能改。</li>
<li>PostgreSQL 還有比較弱的 <code>FOR NO KEY UPDATE</code>（沒改到主鍵或唯一鍵欄位的 UPDATE，實際拿的就是這個）和 <code>FOR KEY SHARE</code>（外鍵檢查拿的），所以改一般欄位時，不會跟別的表的外鍵檢查互卡。</li>
</ul>
<p>一個 PostgreSQL 特有的細節：列鎖不是放在記憶體的鎖表裡，而是直接寫在那一列的 xmax 上。所以一次鎖一百萬列也不會把記憶體用光，也沒有「列鎖太多就升級成鎖整張表」這回事。代價是鎖列也要改頁、也要寫 WAL。</p>
<h4>等不到就別等：NOWAIT 和 SKIP LOCKED</h4>
<pre><code>-- 拿不到鎖就立刻報錯，不要排隊
SELECT * FROM rooms WHERE id = 7 FOR UPDATE NOWAIT;

-- 工作佇列：幾個 worker 同時拿工作，跳過別人已經鎖住的
SELECT id FROM jobs WHERE status = 'ready'
ORDER BY id LIMIT 10
FOR UPDATE SKIP LOCKED;</code></pre>
<p><code>SKIP LOCKED</code> 讓 PostgreSQL 直接當一個可靠的工作佇列用：十個 worker 同時執行這句，各拿到不同的十筆，不會重複，也不會互等。</p>
<h4>鎖佇列：一個 ALTER TABLE 怎麼讓整張表停擺</h4>
<p>除了列鎖，還有<b>表鎖</b>。一般的 SELECT 拿的是最弱的 ACCESS SHARE；<code>ALTER TABLE</code> 大多要拿最強的 ACCESS EXCLUSIVE，跟所有東西都衝突。這兩個加在一起，會發生正式環境最經典的事故之一：</p>
<figure class="figure"><svg viewBox="0 0 680 260" class="fg" style="width:100%;max-width:680px" role="img" aria-label="一張表的鎖佇列：最前面是跑了 5 分鐘的報表 SELECT，接著是等它的 ALTER TABLE，後面所有新的 SELECT 和 UPDATE 都排在 ALTER 後面">
<text x="340" y="24" text-anchor="middle" class="fg-t">rounds 這張表的鎖佇列（越左越早來）</text>
<rect x="20" y="60" width="130" height="64" rx="6" class="fg-b alt"/>
<text x="85" y="81" text-anchor="middle" class="fg-t">報表 SELECT</text>
<text x="85" y="99" text-anchor="middle" class="fg-t sm">持有 ACCESS SHARE</text>
<text x="85" y="115" text-anchor="middle" class="fg-t sm">已經跑了 5 分鐘</text>
<rect x="180" y="60" width="150" height="64" rx="6" class="fg-b warm"/>
<text x="255" y="81" text-anchor="middle" class="fg-t">ALTER TABLE</text>
<text x="255" y="99" text-anchor="middle" class="fg-t sm">要 ACCESS EXCLUSIVE</text>
<text x="255" y="115" text-anchor="middle" class="fg-t sm warm">等報表跑完</text>
<rect x="360" y="60" width="80" height="64" rx="6" class="fg-b"/>
<text x="400" y="88" text-anchor="middle" class="fg-t mono">SELECT</text><text x="400" y="106" text-anchor="middle" class="fg-t sm">等</text>
<rect x="470" y="60" width="80" height="64" rx="6" class="fg-b"/>
<text x="510" y="88" text-anchor="middle" class="fg-t mono">UPDATE</text><text x="510" y="106" text-anchor="middle" class="fg-t sm">等</text>
<rect x="580" y="60" width="80" height="64" rx="6" class="fg-b"/>
<text x="620" y="88" text-anchor="middle" class="fg-t mono">SELECT</text><text x="620" y="106" text-anchor="middle" class="fg-t sm">等</text>
<line x1="180" y1="92" x2="158" y2="92" class="fg-l warm"/><polygon points="150,92 158,87.5 158,96.5" class="fg-a warm"/>
<line x1="360" y1="92" x2="338" y2="92" class="fg-l"/><polygon points="330,92 338,87.5 338,96.5" class="fg-a"/>
<line x1="470" y1="92" x2="448" y2="92" class="fg-l"/><polygon points="440,92 448,87.5 448,96.5" class="fg-a"/>
<line x1="580" y1="92" x2="558" y2="92" class="fg-l"/><polygon points="550,92 558,87.5 558,96.5" class="fg-a"/>
<path d="M180 136 V144 H660 V136" class="fg-l warm"/>
<text x="420" y="166" text-anchor="middle" class="fg-t sm warm">全部卡住：整張表看起來像當機</text>
<text x="340" y="206" text-anchor="middle" class="fg-t sm">新來的 SELECT 跟報表不衝突，卻跟排在前面的 ALTER 衝突，只能排在它後面</text>
<text x="340" y="232" text-anchor="middle" class="fg-t sm acc">對策：遷移前先 SET lock_timeout = '3s'，等不到就放棄，稍後重試</text>
</svg><figcaption>ALTER 本身可能只要幾毫秒，問題在它排隊等鎖的那段時間。它一排進去，後面每個請求都得排在它後面。</figcaption></figure>
<p>上線一個「加欄位」的資料庫遷移（migration），剛好撞上一個跑了五分鐘的報表。ALTER 在等報表；所有新請求在等 ALTER；連線池（下一課）很快被這些卡住的請求佔滿，整個服務停擺。解法是讓遷移「等不到就放棄」：</p>
<pre><code>SET lock_timeout = '3s';
ALTER TABLE rounds ADD COLUMN note text;
-- 3 秒拿不到鎖就報錯，由部署腳本稍後重試</code></pre>
<h4>死結：怎麼發生、怎麼被抓到</h4>
<pre><code>T1: UPDATE accounts SET ... WHERE id = 1; -- 鎖住 1
T2: UPDATE accounts SET ... WHERE id = 2; -- 鎖住 2
T1: UPDATE accounts SET ... WHERE id = 2; -- 等 T2
T2: UPDATE accounts SET ... WHERE id = 1; -- 等 T1
-- T1 等 T2、T2 等 T1：繞成一圈了
-- 約 1 秒後，其中一個收到：
-- ERROR:  deadlock detected (SQLSTATE 40P01)</code></pre>
<p>PostgreSQL 不會每次等鎖都去檢查死結，那太貴了。它讓等待的行程先等 <code>deadlock_timeout</code>（預設 1 秒），還在等，才去畫一張「誰在等誰」的圖；圖上有環，就取消其中一個交易。所以死結在 PostgreSQL 裡，通常表現成「卡一秒，然後一邊報錯」。MySQL InnoDB 預設在每次等鎖時立刻偵測，馬上回復其中一個；普通的等鎖則要等 <code>innodb_lock_wait_timeout</code>（預設 50 秒）才放棄。</p>
<p>預防的規則只有兩條：<b>所有程式都照同一個順序鎖</b>（例如永遠先鎖 id 小的），以及<b>交易要短</b>，持有鎖的時間越短，撞在一起的機會越小。真的發生了，就照第四節的方式重試。</p>

<h3><span class="badge lv3">專業</span>六、悲觀還是樂觀</h3>
<p>處理「讀出來、算一算、寫回去」有兩種哲學：</p>
<ul>
<li><b>悲觀</b>（pessimistic）：先 <code>SELECT ... FOR UPDATE</code> 鎖住，別人來了就等。適合衝突很常發生的地方，例如熱門商品搶購。代價是等待、可能死結，而且鎖在應用程式和資料庫的網路來回之間一直被握著。出事時的樣子是「變慢」。</li>
<li><b>樂觀</b>（optimistic）：不鎖，帶著版本號寫回（<code>WHERE version = 7</code>），沒改到就重讀、重算、重試。適合衝突很少的地方，例如使用者改自己的個人資料。代價是衝突一多，重試會爆量，大家一直白做。出事時的樣子是「報錯、重試」。</li>
</ul>
<p>最好的情況是兩種都不用：能寫成<b>一道條件式的 UPDATE</b> 就這樣寫（<code>SET balance = balance - 30 WHERE id = 1 AND balance &gt;= 30</code>）。鎖只在這一道敘述裡握幾微秒，也不需要重試。</p>
<h4>熱點列：所有人都改同一列</h4>
<p>假設全服有一個「累積獎池」欄位，每局結束都 <code>UPDATE jackpot SET amount = amount + 1</code>。每個交易都要拿同一列的鎖，而且要握到 COMMIT 的 fsync 完成。如果一次交易從拿鎖到提交要 2 毫秒，這一列一秒最多只能被改 500 次，不管你的資料庫有幾顆核心。這是用加機器解決不了的上限。</p>
<p>解法是把一列拆成很多列：開 16 列計數器，每次隨機挑一列加，要讀總數時 <code>SUM</code> 起來；或者每局只新增一列到帳本，總數由背景工作定期彙總。寫入分散了，鎖也就分散了。</p>

<h3><span class="badge lv3">專業</span>七、長交易、VACUUM 與膨脹</h3>
<p>MVCC 有一筆帳要還：每次 UPDATE 和 DELETE 都留下一個舊版本。這些不再有人需要的「死版本」（dead tuple），要靠 <b>VACUUM</b> 清掉，把空間標成可以重複使用。autovacuum 會在背景自動做。</p>
<p>關鍵在「不再有人需要」。只要還有任何一個交易的快照，可能需要看到某個舊版本，VACUUM 就不能清它。整個資料庫裡最老的那個快照，就是清理的界線（xmin horizon）。</p>
<figure class="figure"><svg viewBox="0 0 680 300" class="fg" style="width:100%;max-width:680px" role="img" aria-label="時間軸從 09:00 到 10:00：一個交易 09:00 開始後一直沒提交；一般交易來來去去；09:20 和 09:40 的 VACUUM 都清不掉 09:00 之後產生的舊版本，清不掉的死版本一路累積到 360 萬個">
<text x="86" y="24" class="fg-t sm">最老的交易從哪裡開始，VACUUM 就只能清到哪裡</text>
<line x1="80" y1="34" x2="80" y2="262" class="fg-l warm dash"/>
<rect x="80" y="44" width="560" height="30" rx="5" class="fg-b warm"/>
<text x="92" y="64" class="fg-t sm">09:00 BEGIN 之後忘了關的交易（idle in transaction）</text>
<text x="86" y="94" class="fg-t sm">一般請求的交易：每個幾毫秒，來來去去</text>
<rect x="100" y="100" width="14" height="14" rx="2" class="fg-b alt"/><rect x="140" y="100" width="14" height="14" rx="2" class="fg-b alt"/>
<rect x="180" y="100" width="14" height="14" rx="2" class="fg-b alt"/><rect x="220" y="100" width="14" height="14" rx="2" class="fg-b alt"/>
<rect x="300" y="100" width="14" height="14" rx="2" class="fg-b alt"/><rect x="340" y="100" width="14" height="14" rx="2" class="fg-b alt"/>
<rect x="380" y="100" width="14" height="14" rx="2" class="fg-b alt"/><rect x="420" y="100" width="14" height="14" rx="2" class="fg-b alt"/>
<rect x="500" y="100" width="14" height="14" rx="2" class="fg-b alt"/><rect x="540" y="100" width="14" height="14" rx="2" class="fg-b alt"/>
<rect x="580" y="100" width="14" height="14" rx="2" class="fg-b alt"/><rect x="620" y="100" width="14" height="14" rx="2" class="fg-b alt"/>
<rect x="232" y="128" width="70" height="26" rx="5" class="fg-b"/><text x="267" y="146" text-anchor="middle" class="fg-t sm mono">VACUUM</text>
<text x="267" y="172" text-anchor="middle" class="fg-t sm warm">清不掉</text>
<rect x="418" y="128" width="70" height="26" rx="5" class="fg-b"/><text x="453" y="146" text-anchor="middle" class="fg-t sm mono">VACUUM</text>
<text x="453" y="172" text-anchor="middle" class="fg-t sm warm">還是清不掉</text>
<polygon points="80,262 640,198 640,262" class="fg-b warm"/>
<text x="90" y="210" class="fg-t sm warm">清不掉的舊版本：每秒 1,000 個，一小時 360 萬個</text>
<line x1="80" y1="262" x2="642" y2="262" class="fg-l"/><polygon points="650,262 642,257.5 642,266.5" class="fg-a"/>
<text x="80" y="282" text-anchor="middle" class="fg-t sm mono">09:00</text>
<text x="267" y="282" text-anchor="middle" class="fg-t sm mono">09:20</text>
<text x="453" y="282" text-anchor="middle" class="fg-t sm mono">09:40</text>
<text x="630" y="282" text-anchor="middle" class="fg-t sm mono">10:00</text>
</svg><figcaption>那個忘了關的交易什麼都沒做，只是開著。但它的快照可能還需要 09:00 之後被改掉的每一個舊版本，所以 VACUUM 一個都不敢清。</figcaption></figure>
<p>算一下：一張表每秒更新 1,000 次，一個交易開著忘了關一小時，就有 360 萬個死版本清不掉。表和索引一直變大；查詢要掃更多頁；上一章的 Index Only Scan 因為可見性地圖一直是髒的而失效。更糟的是，就算那個交易終於結束、VACUUM 清掉了死版本，檔案通常也不會縮小，只是空間可以重複使用。這種「表比資料實際需要的大很多」的狀態，叫<b>膨脹</b>（bloat）。要真的縮回來，得用會鎖表的 <code>VACUUM FULL</code>，或線上重建的 pg_repack 擴充套件。</p>
<h4>誰會把界線卡住</h4>
<ul>
<li>程式開了交易，中途 return 或丟例外，沒 COMMIT 也沒 ROLLBACK，連線就這樣卡在交易裡。狀態會顯示成 <code>idle in transaction</code>。</li>
<li>有人在 psql 裡打了 <code>BEGIN</code>，然後去開會了。</li>
<li>跑好幾個小時的分析查詢或資料匯出。</li>
<li>複本開了 <code>hot_standby_feedback</code>，或一個沒人在讀的複寫槽（replication slot），也會把主庫的界線往回拉（第 3.4 課）。</li>
</ul>
<pre><code>-- 現在最老的交易是誰
SELECT pid, state, now() - xact_start AS xact_age,
       left(query, 40) AS query
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
ORDER BY xact_start
LIMIT 5;

-- 死版本最多的表
SELECT relname, n_live_tup, n_dead_tup, last_autovacuum
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 5;</code></pre>
<p>防線是設定 <code>idle_in_transaction_session_timeout</code>，讓閒著不動的交易自動被切斷（下一課會講），再對「最老交易的年齡」設警報。MySQL 也有同一個病：長交易讓 undo log 裡的舊版本清不掉，<code>SHOW ENGINE INNODB STATUS</code> 裡的 History list length 會一直往上爬。</p>
<h4>更深一層：交易編號用完</h4>
<p>PostgreSQL 的交易編號是 32 位元，大約 42 億個，而且是繞圈使用的：對任何一個交易來說，大約 21 億個是「過去」、21 億個是「未來」。很舊的列必須先被 VACUUM「凍結」（freeze），標成「永遠算是過去」，不然編號繞一圈回來，這些列會突然變成「未來的資料」而看不見。如果界線被卡住太久、或 autovacuum 跟不上，PostgreSQL 會先在日誌裡一直警告，最後為了保護資料，拒絕分配新的交易編號，也就是不再接受任何寫入，直到 VACUUM 做完。寫入量很大的系統，一定要監控 <code>age(datfrozenxid)</code>。</p>

<h3><span class="badge lv4">專家</span>八、設計一套不會算錯錢的轉帳</h3>
<p>把整章的東西放在一起。需求是：餘額不能變負的、重送的請求不能扣兩次、每一分錢都查得到來源、兩個方向的轉帳同時發生也不能死結、任何一步當機都不能留下半套帳。</p>
<pre><code>CREATE TABLE accounts (
  id      bigint PRIMARY KEY,
  -- 金額用「分」為單位的整數，絕不用浮點數
  balance bigint NOT NULL CHECK (balance &gt;= 0)
);
CREATE TABLE transfers (
  id         bigserial PRIMARY KEY,
  idem_key   text NOT NULL UNIQUE,     -- 冪等鍵
  from_id    bigint NOT NULL REFERENCES accounts,
  to_id      bigint NOT NULL REFERENCES accounts,
  amount     bigint NOT NULL CHECK (amount &gt; 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
-- 帳本：只新增、永不修改
CREATE TABLE ledger (
  transfer_id bigint NOT NULL REFERENCES transfers,
  account_id  bigint NOT NULL REFERENCES accounts,
  delta       bigint NOT NULL,
  PRIMARY KEY (transfer_id, account_id)
);</code></pre>
<p>一筆轉帳就是一個交易：</p>
<pre><code>BEGIN;
INSERT INTO transfers (idem_key, from_id, to_id, amount)
VALUES ('7f3c-a1', 1, 2, 30)
ON CONFLICT (idem_key) DO NOTHING
RETURNING id;                  -- 假設回傳 101
-- 沒回傳任何列：這個冪等鍵已經做過了，
-- ROLLBACK，回覆上一次的結果。

-- 永遠照 id 由小到大，先把兩個帳戶鎖好
SELECT id FROM accounts
WHERE id IN (1, 2) ORDER BY id FOR UPDATE;

-- 餘額不足時，CHECK 會擋下（SQLSTATE 23514）
UPDATE accounts SET balance = balance - 30 WHERE id = 1;
UPDATE accounts SET balance = balance + 30 WHERE id = 2;
INSERT INTO ledger VALUES (101, 1, -30), (101, 2, 30);
COMMIT;</code></pre>
<p>每一行都在防一件具體的事：</p>
<ul>
<li><b>冪等鍵加唯一約束</b>：手機網路不穩，同一個請求送了兩次。兩次同時到的話，第二個 INSERT 會等第一個交易結束：第一個提交了，第二個就 DO NOTHING；第一個回復了，第二個才真的寫進去。不靠任何應用程式的鎖，也不會扣兩次。實務上還會把第一次的回應也存起來，重送時原樣回覆。</li>
<li><b>照 id 順序鎖</b>：1 轉給 2 和 2 轉給 1 同時發生，如果各自先扣自己再加對方，就是第五節那個死結。先照 id 由小到大把兩列都鎖好，所有轉帳拿鎖的順序就一致了。</li>
<li><b>CHECK 約束</b>：程式就算哪天漏了餘額檢查，資料庫也會擋下，整個交易回復。程式捕捉 SQLSTATE 23514，回「餘額不足」。</li>
<li><b>帳本</b>：每筆轉帳兩列，加起來是 0。餘額欄位只是帳本加總的「快取」，隨時可以對帳。</li>
</ul>
<pre><code>-- 每筆轉帳的兩列，加起來必須是 0
SELECT transfer_id FROM ledger
GROUP BY transfer_id HAVING sum(delta) &lt;&gt; 0;

-- 餘額必須等於帳本加總
-- （開戶的初始金額也要記成帳本的一列）
SELECT a.id
FROM accounts a
JOIN (SELECT account_id, sum(delta) AS s
      FROM ledger GROUP BY account_id) l
  ON l.account_id = a.id
WHERE a.balance &lt;&gt; l.s;</code></pre>
<p>這兩個查詢每天跑一次，結果應該永遠是空的。不是空的，就是有 bug，而且你知道是哪一筆。</p>
<h4>碰到外部系統：交易不能開著等</h4>
<p>提款要呼叫金流服務商，對方可能三秒才回、也可能逾時。上一課說過不能讓交易開著等。正確的做法是把一件事拆成幾個各自完整的小交易，中間用狀態欄位接起來：</p>
<figure class="figure"><svg viewBox="0 0 680 270" class="fg" style="width:100%;max-width:680px" role="img" aria-label="提款流程：交易一新增 pending 的提款單並扣餘額後提交；接著在交易外呼叫金流服務商，帶著提款單 id 當冪等鍵；交易二依結果標成完成或退回；逾時的交給對帳程式定期查詢">
<text x="340" y="24" text-anchor="middle" class="fg-t">提款：拆成三段，中間靠 status 欄位接起來</text>
<rect x="20" y="40" width="190" height="92" rx="6" class="fg-b hot"/>
<text x="115" y="62" text-anchor="middle" class="fg-t acc">交易 1</text>
<text x="115" y="84" text-anchor="middle" class="fg-t sm">新增提款單 status=pending</text>
<text x="115" y="102" text-anchor="middle" class="fg-t sm">扣餘額、寫帳本</text>
<text x="115" y="120" text-anchor="middle" class="fg-t sm mono">COMMIT</text>
<line x1="210" y1="86" x2="237" y2="86" class="fg-l on"/><polygon points="245,86 237,81.5 237,90.5" class="fg-a on"/>
<rect x="245" y="40" width="190" height="92" rx="6" class="fg-b warm"/>
<text x="340" y="62" text-anchor="middle" class="fg-t">呼叫金流服務商</text>
<text x="340" y="84" text-anchor="middle" class="fg-t sm">冪等鍵 = 提款單 id</text>
<text x="340" y="102" text-anchor="middle" class="fg-t sm">這時沒有開著的交易</text>
<text x="340" y="120" text-anchor="middle" class="fg-t sm">可能成功、失敗或逾時</text>
<line x1="435" y1="86" x2="462" y2="86" class="fg-l on"/><polygon points="470,86 462,81.5 462,90.5" class="fg-a on"/>
<rect x="470" y="40" width="190" height="92" rx="6" class="fg-b hot"/>
<text x="565" y="62" text-anchor="middle" class="fg-t acc">交易 2</text>
<text x="565" y="84" text-anchor="middle" class="fg-t sm">成功：status=done</text>
<text x="565" y="102" text-anchor="middle" class="fg-t sm">確定失敗：寫帳本退回</text>
<text x="565" y="120" text-anchor="middle" class="fg-t sm mono">COMMIT</text>
<line x1="340" y1="132" x2="340" y2="172" class="fg-l warm dash"/><polygon points="340,180 335.5,172 344.5,172" class="fg-a warm"/>
<text x="350" y="160" class="fg-t sm warm">逾時、結果不明</text>
<rect x="245" y="180" width="190" height="50" rx="6" class="fg-b"/>
<text x="340" y="201" text-anchor="middle" class="fg-t">對帳程式（定期跑）</text>
<text x="340" y="219" text-anchor="middle" class="fg-t sm">撈出卡在 pending 的去問</text>
<path d="M435 205 H565 V140" class="fg-l dash"/><polygon points="565,132 560.5,140 569.5,140" class="fg-a"/>
<text x="340" y="258" text-anchor="middle" class="fg-t sm">任何一步之間當機，資料庫裡都留著一個能接手的狀態</text>
</svg><figcaption>外部呼叫永遠在交易之外。結果不明時不要猜，留在 pending，交給對帳程式用同一個冪等鍵去問清楚。</figcaption></figure>
<ul>
<li><b>先扣再呼叫</b>：交易 1 就把錢扣下來（凍結），所以呼叫期間同一筆錢不可能被花第二次。</li>
<li><b>冪等鍵傳給對方</b>：對帳程式重送時，服務商認得這是同一筆，不會付兩次。這要求你選的服務商支援冪等鍵，主流的金流 API 大多支援。</li>
<li><b>逾時不等於失敗</b>：逾時的時候錢可能已經出去了。這時退款是最危險的動作，只有拿到「確定失敗」才退。</li>
</ul>
<p>同樣的想法用在「交易提交後要發通知、送訊息到佇列」也成立，叫 <b>outbox 模式</b>：在同一個交易裡把要送的訊息寫進一張 outbox 表，再由另一個行程讀出來送出。這樣「資料改了、訊息卻沒送出」或反過來的情況就不會發生（第 3.7 課）。</p>

<h3><span class="badge lv4">專家</span>九、幾個會咬人的細節</h3>
<ul>
<li><b>交易裡出錯，後面全部作廢。</b>PostgreSQL 的交易裡只要有一道敘述出錯，之後的每一道都會回「current transaction is aborted」，直到你 ROLLBACK。想在交易裡「試試看，失敗就算了」，要用 <code>SAVEPOINT</code> 和 <code>ROLLBACK TO SAVEPOINT</code>。不少 ORM 的巢狀交易，底層就是 savepoint。</li>
<li><b>沒寫 BEGIN，每一道敘述就是一個交易</b>（autocommit）。所以「先 SELECT、再 UPDATE」如果沒包在交易裡，中間任何事都可能發生。</li>
<li><b>Serializable 有成本。</b>SSI 要記錄每個交易讀過什麼，取消率會隨衝突上升，而且偶爾會取消其實沒問題的交易（偽陽性）。只讀的報表可以宣告 <code>READ ONLY DEFERRABLE</code>，等到一張保證安全的快照再開始，就永遠不會被取消。</li>
<li><b>唯讀複本上不能鎖。</b><code>SELECT ... FOR UPDATE</code> 只能在主庫上做。框架把讀請求自動導到複本時，要確定這類查詢走主庫。</li>
<li><b>跨服務沒有交易。</b>兩個微服務各有自己的資料庫，一個 BEGIN 包不住兩邊。這時要用前面那種狀態機加補償動作（saga）的設計，模組 3 最後一課會再談。</li>
</ul>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>包在交易裡就不會有併發問題</td><td>預設的 Read Committed 擋不住更新遺失（先讀再寫回）和寫入偏斜。交易只保證全做或全不做。</td></tr>
<tr><td>隔離層級越高越好</td><td>越高越常需要重試，也越貴。多數系統用 Read Committed 加上條件式 UPDATE、鎖或約束，只在少數地方用 Serializable。</td></tr>
<tr><td>同一個隔離層級名稱，各家行為一樣</td><td>PostgreSQL 和 MySQL 的 Repeatable Read 差很多：一個會報錯擋下更新遺失，一個不會。</td></tr>
<tr><td>讀資料會擋住寫資料</td><td>MVCC 下一般的 SELECT 不擋寫入。會擋的是 FOR UPDATE、FOR SHARE 和表鎖。</td></tr>
<tr><td>交易開著不做事就沒有成本</td><td>它卡住 VACUUM 的界線、握著鎖和一條連線，整個資料庫都在替它付錢。</td></tr>
<tr><td>死結是資料庫的 bug</td><td>是程式拿鎖的順序不一致。資料庫只是把它偵測出來、取消一邊。</td></tr>
<tr><td>COMMIT 回來了，資料就一定在磁碟上</td><td>預設是，因為等了 WAL 的 fsync。但若設了 <code>synchronous_commit = off</code>，或磁碟謊報寫入完成，就不一定。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>Node.js／TypeScript</b>：node-postgres 的 <code>pool.query()</code> 每次可能拿到不同的連線，所以 <code>BEGIN</code> 和後面的敘述必須用同一個 <code>client</code>（<code>pool.connect()</code> 拿到的那個），並且在 <code>finally</code> 裡 <code>release()</code>。ORM 的 <code>transaction(async tx =&gt; ...)</code> 寫法幫你處理了這件事，但回呼函式裡面一定要用傳進來的 <code>tx</code>，用錯物件，那一句就跑在交易外面了。</li>
<li><b>Go</b>：<code>db.BeginTx</code> 拿到的 <code>*sql.Tx</code> 綁定一條連線；習慣寫 <code>defer tx.Rollback()</code>，成功時 <code>Commit()</code> 之後再 Rollback 只會回一個可以忽略的錯誤。</li>
<li><b>遊戲後端</b>：發道具、扣點數、開寶箱、每日次數上限，全都是本章的題目。「同一個玩家兩支裝置同時按」是最真實的測試案例。</li>
<li><b>前端（Vue、Cocos、Unity）</b>：按鈕防連點只是體驗，不是保護。真正的保護是請求帶冪等鍵，後端用唯一約束擋。產生冪等鍵（例如 <code>crypto.randomUUID()</code>），在重試時沿用同一個，是前端該做的那一半。</li>
<li><b>Docker 與雲端</b>：資料庫遷移在部署流程裡跑，記得 <code>lock_timeout</code>；監控面板上加「最老交易的年齡」和「死版本數」兩張圖。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<p>這一組是後端和 DevOps 面試裡最常追問到底的題目。先出聲講一遍，再看參考答案。</p>
<ol>
<li>「解釋 MVCC。為什麼它能讓讀和寫不互相阻擋？代價是什麼？」</li>
<li>「Read Committed 和 Repeatable Read 差在哪？各舉一個會出問題的例子。」</li>
<li>「什麼是寫入偏斜？為什麼 Repeatable Read 擋不住？你會怎麼修？」</li>
<li>「資料庫突然很多請求卡住，你發現有一個 ALTER TABLE 在等鎖。發生了什麼事？怎麼避免？」</li>
<li>「設計一個轉帳 API，要能承受重試和併發。」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>UPDATE 不覆蓋舊資料，而是寫一個新版本，每個版本標著建立和刪除它的交易編號。每個交易拿一張快照，依照快照決定看哪個版本，所以讀的人讀舊版本、寫的人寫新版本，彼此不用等，只有寫同一列才要排隊。代價是舊版本要清：PostgreSQL 留在表裡，靠 VACUUM 回收，長交易會讓它清不掉而造成膨脹；MySQL 放在 undo log，長交易一樣會讓 undo 累積。</li>
<li>Read Committed 每道敘述拍一張新快照，Repeatable Read 整個交易用同一張。Read Committed 的問題：同一交易讀兩次值不同，例如報表先算總數、再算明細，兩者對不起來。Repeatable Read 的問題：在 PostgreSQL 改到被別人改過的列會報序列化錯誤，要重試；而且仍然擋不住寫入偏斜。另外要說明 PostgreSQL 和 MySQL 同名層級的行為不同。</li>
<li>兩個交易讀同一份資料，根據它各自寫入不同的列，合起來違反規則，例如兩個請求都數到 2 局、各自新增第 3 局。Repeatable Read 只檢查同一列有沒有被改，這裡兩邊寫的是不同列，所以抓不到。修法：用 Serializable 並重試整個交易；或先鎖一列共同的代表（例如使用者那一列）讓請求排隊；最好是把規則變成約束，例如計數欄位加 CHECK，或部分唯一索引。</li>
<li>ALTER TABLE 要 ACCESS EXCLUSIVE 鎖，它在等一個長時間執行的查詢；之後所有新的查詢都跟這個等待中的請求衝突，只能排在它後面，整張表看起來停擺，連線池也被耗盡。避免：遷移時設 lock_timeout，拿不到就失敗重試；避開長查詢的時段；對長查詢設 statement_timeout；選不需要長時間重寫表的遷移做法。</li>
<li>用戶端產生冪等鍵，後端在 transfers 表上加唯一約束，用 INSERT ON CONFLICT DO NOTHING 判斷是不是重送；同一個交易裡依 id 順序鎖兩個帳戶，扣款和入帳都用條件式 UPDATE，再加 CHECK 餘額不得為負當最後防線；每筆轉帳寫兩列帳本、加總為 0，可以對帳。金額用整數最小單位。死結和序列化失敗要能重試整個交易。若牽涉外部金流，先記錄 pending 並凍結款項、提交後再呼叫，結果不明交給對帳程式。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>開兩個 psql 視窗，照第三節那段兩個連線的流程走一次，T1 分別用 <code>BEGIN ISOLATION LEVEL READ COMMITTED</code> 和 <code>REPEATABLE READ</code> 開始。把第二次 SELECT 和最後那道 UPDATE 你實際看到的結果寫下來。</li>
<li>在同一張 <code>acct</code> 表上，T1 執行 <code>UPDATE acct SET balance = balance - 30 WHERE id = 1</code> 之後先不提交，T2 執行 <code>SELECT xmin, xmax, * FROM acct WHERE id = 1</code>。你預期看到的 xmax 是什麼？為什麼 T2 看到的還是舊的餘額？</li>
<li>用兩個視窗故意製造一次死結，記下哪一邊收到錯誤、等了多久。然後把兩邊改成同一個鎖定順序，再試一次。</li>
<li>一個熱門商品的庫存列，每次結帳交易從鎖住它到提交平均 4 毫秒。這個商品一秒最多能賣幾件？說出兩種提高上限的做法。</li>
<li>有人說：「我們把隔離層級全部改成 Serializable，就再也不會有併發 bug 了。」你同意哪一部分、不同意哪一部分？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>Read Committed：第二次 SELECT 看到 70，UPDATE 成功，餘額變 40。Repeatable Read：第二次 SELECT 還是 100，UPDATE 報錯 could not serialize access due to concurrent update，這個交易只能 ROLLBACK 重來。</li>
<li>T2 會看到 xmax 是 T1 的交易編號（不是 0）。因為 T1 還沒提交，這個 xmax 在 T2 的快照裡不算數，所以舊版本對 T2 仍然有效，看到的是改之前的餘額。T1 寫的新版本，xmin 是還沒提交的交易，T2 看不到。</li>
<li>大約 1 秒（<code>deadlock_timeout</code>）後，其中一邊收到 <code>deadlock detected</code>，它的交易被取消，另一邊接著完成。兩邊都先鎖 id 小的那一列之後，第二個交易會在第一步就排隊等，不會形成環，所以只會變慢、不會死結。</li>
<li>1 ÷ 0.004 = 250 件。做法：縮短持有鎖的時間（把不相干的工作移出交易、改成一道條件式 UPDATE）；把庫存拆成幾列（例如 10 列各放一部分庫存，隨機挑一列扣）；或改成先排隊預約、背景再批次扣庫存。</li>
<li>同意：Serializable 確實能擋下所有隔離層級造成的異常，包括寫入偏斜。不同意：程式必須正確重試整個交易，否則只是把 bug 換成錯誤訊息；衝突多時取消率高、效能下降；它也管不到交易以外的事，例如重送的請求（要靠冪等鍵）、外部 API 呼叫、跨服務的一致性，以及程式邏輯本身算錯。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>PostgreSQL 官方文件〈Concurrency Control〉</b>（<a href="https://www.postgresql.org/docs/current/mvcc.html">postgresql.org/docs/current/mvcc.html</a>）：隔離層級、各種鎖的衝突表、Serializable 的使用建議，本章的行為都以這裡為準。</li>
<li><b>Martin Kleppmann《Designing Data-Intensive Applications》第 7 章〈Transactions〉</b>：用最清楚的方式講髒讀、更新遺失、寫入偏斜和 SSI，值得讀兩遍。</li>
<li><b>Hermitage</b>（<a href="https://github.com/ept/hermitage">github.com/ept/hermitage</a>）：Kleppmann 整理的測試集，實際列出各家資料庫在每個隔離層級下會出現哪些異常，看完就知道「同名不同義」有多嚴重。</li>
<li><b>Berenson 等人〈A Critique of ANSI SQL Isolation Levels〉（1995）</b>：指出 SQL 標準對隔離層級的定義有漏洞，並定義了快照隔離。想真正弄懂這個題目，這篇是源頭。</li>
<li><b>MySQL 官方文件〈InnoDB Locking and Transaction Model〉</b>：next-key lock、間隙鎖和 consistent read 的權威說明，用 MySQL 的人必讀。</li>
</ul>
` });
