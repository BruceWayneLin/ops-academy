DEEP({ 'db-pool': `
<p>上一課說：資料庫連線很貴、有上限，應用程式機器一多，連線總數就會撐爆資料庫，解法是連線池。這一章把這句話拆到底：一條連線背後到底有什麼、為什麼「連線開越多越快」是錯的、連線池該開多大要怎麼<b>算</b>出來、PgBouncer 的三種模式各換來什麼又弄壞什麼、逾時要怎麼一層一層設，以及半夜被叫起來時，怎麼在五分鐘內分辨「連線池用完了」和「資料庫真的慢了」。最後是 serverless 和連線風暴這種，規模一大才會遇到的問題。</p>

<h3><span class="badge lv1">基礎</span>一、一條連線背後有什麼</h3>
<p>先打個比方。PostgreSQL 像一家很講究的餐廳：每來一位客人，就專門指派一位服務生，從進門服務到離開。服務生要薪水（記憶體），餐廳最多只請得起 100 位（<code>max_connections</code> 預設 100）。問題是，大部分客人坐著滑手機、看菜單（應用程式拿著連線卻沒在查詢），服務生就站在旁邊乾等。</p>
<figure class="figure"><svg viewBox="0 0 680 300" class="fg" style="width:100%;max-width:680px" role="img" aria-label="PostgreSQL 的行程架構：每條已建立的連線對應一個後端行程；新的連線先連到 postmaster，postmaster fork 出一個新的後端行程；所有後端行程共用一塊共用記憶體">
<text x="80" y="24" text-anchor="middle" class="fg-t sm">用戶端</text>
<text x="455" y="24" text-anchor="middle" class="fg-t sm">每條連線一個行程</text>
<text x="615" y="24" text-anchor="middle" class="fg-t sm">大家共用</text>
<rect x="20" y="40" width="120" height="34" rx="5" class="fg-b"/><text x="80" y="62" text-anchor="middle" class="fg-t">連線 1</text>
<rect x="20" y="82" width="120" height="34" rx="5" class="fg-b"/><text x="80" y="104" text-anchor="middle" class="fg-t">連線 2</text>
<rect x="20" y="124" width="120" height="34" rx="5" class="fg-b"/><text x="80" y="146" text-anchor="middle" class="fg-t">連線 3</text>
<text x="80" y="194" text-anchor="middle" class="fg-t sm">⋮</text>
<rect x="20" y="230" width="120" height="34" rx="5" class="fg-b warm"/><text x="80" y="252" text-anchor="middle" class="fg-t">新連線</text>
<line x1="140" y1="57" x2="372" y2="57" class="fg-l"/><polygon points="380,57 372,52.5 372,61.5" class="fg-a"/>
<line x1="140" y1="99" x2="372" y2="99" class="fg-l"/><polygon points="380,99 372,94.5 372,103.5" class="fg-a"/>
<line x1="140" y1="141" x2="372" y2="141" class="fg-l"/><polygon points="380,141 372,136.5 372,145.5" class="fg-a"/>
<text x="260" y="50" text-anchor="middle" class="fg-t sm">連上之後一對一</text>
<line x1="140" y1="247" x2="192" y2="247" class="fg-l warm"/><polygon points="200,247 192,242.5 192,251.5" class="fg-a warm"/>
<text x="168" y="238" text-anchor="middle" class="fg-t sm warm">①</text>
<rect x="200" y="224" width="130" height="46" rx="6" class="fg-b"/>
<text x="265" y="244" text-anchor="middle" class="fg-t mono">postmaster</text>
<text x="265" y="261" text-anchor="middle" class="fg-t sm">守在 5432</text>
<line x1="330" y1="247" x2="372" y2="247" class="fg-l warm dash"/><polygon points="380,247 372,242.5 372,251.5" class="fg-a warm"/>
<text x="355" y="238" text-anchor="middle" class="fg-t sm warm">② fork</text>
<rect x="380" y="40" width="150" height="34" rx="5" class="fg-b alt"/><text x="455" y="62" text-anchor="middle" class="fg-t">後端行程 #1</text>
<rect x="380" y="82" width="150" height="34" rx="5" class="fg-b alt"/><text x="455" y="104" text-anchor="middle" class="fg-t">後端行程 #2</text>
<rect x="380" y="124" width="150" height="34" rx="5" class="fg-b alt"/><text x="455" y="146" text-anchor="middle" class="fg-t">後端行程 #3</text>
<text x="455" y="194" text-anchor="middle" class="fg-t sm">⋮ 每個幾 MB 私有記憶體</text>
<rect x="380" y="230" width="150" height="34" rx="5" class="fg-b hot"/><text x="455" y="252" text-anchor="middle" class="fg-t acc">後端行程 #4</text>
<line x1="530" y1="57" x2="560" y2="57" class="fg-l dim"/>
<line x1="530" y1="99" x2="560" y2="99" class="fg-l dim"/>
<line x1="530" y1="141" x2="560" y2="141" class="fg-l dim"/>
<line x1="530" y1="247" x2="560" y2="247" class="fg-l dim"/>
<rect x="560" y="40" width="110" height="224" rx="6" class="fg-b"/>
<text x="615" y="100" text-anchor="middle" class="fg-t">共用記憶體</text>
<text x="615" y="130" text-anchor="middle" class="fg-t sm mono">shared_buffers</text>
<text x="615" y="152" text-anchor="middle" class="fg-t sm">鎖的表格</text>
<text x="615" y="174" text-anchor="middle" class="fg-t sm">WAL 緩衝</text>
</svg><figcaption>PostgreSQL 每接受一條連線，就 fork 一個完整的作業系統行程專門服務它。連線閒著，行程也閒著，但記憶體照佔。</figcaption></figure>
<p>具體來說，一條 PostgreSQL 連線的成本有三筆：</p>
<ul>
<li><b>一個行程。</b>主行程（postmaster）每接受一條連線，就 fork 一個後端行程（backend）。行程本身加上它讀過的系統目錄快取，閒著的時候通常就要幾 MB；查詢在排序、雜湊時，還會再用到 <code>work_mem</code>（預設 4 MB，而且<b>每個排序節點</b>各算一份）。</li>
<li><b>共用的名額。</b><code>max_connections</code> 開多少，共用記憶體裡的鎖表等結構就預留多少，就算沒人連也一樣佔著。每多一條連線，每個交易拍快照時要檢查的行程也多一個（PostgreSQL 14 之後這部分快了很多，但不是零）。</li>
<li><b>建立的時間。</b>下一張圖的主題。</li>
</ul>
<p>MySQL 是一條連線一個執行緒，比一個行程輕，所以預設上限 151、而且開到上千條也常見。但道理一樣：同時在<b>跑</b>的查詢一多過核心數，大家就是在搶 CPU 和鎖。</p>
<h4>建立一條連線要走幾趟</h4>
<figure class="figure"><svg viewBox="0 0 680 300" class="fg" style="width:100%;max-width:680px" role="img" aria-label="建立 PostgreSQL 連線的六次來回：TCP 握手、SSLRequest、TLS 1.3 握手、StartupMessage、兩輪 SCRAM 驗證，伺服器端還要 fork 行程和載入系統目錄">
<text x="110" y="28" text-anchor="middle" class="fg-t">用戶端</text>
<text x="490" y="28" text-anchor="middle" class="fg-t">PostgreSQL</text>
<line x1="110" y1="38" x2="110" y2="240" class="fg-l dim dash"/>
<line x1="490" y1="38" x2="490" y2="240" class="fg-l dim dash"/>
<text x="20" y="68" class="fg-t sm">第 1 趟</text>
<line x1="118" y1="64" x2="482" y2="64" class="fg-l alt"/><polygon points="490,64 482,59.5 482,68.5" class="fg-a alt"/><polygon points="110,64 118,59.5 118,68.5" class="fg-a alt"/>
<text x="300" y="58" text-anchor="middle" class="fg-t sm">TCP 握手</text>
<text x="20" y="100" class="fg-t sm">第 2 趟</text>
<line x1="118" y1="96" x2="482" y2="96" class="fg-l alt"/><polygon points="490,96 482,91.5 482,100.5" class="fg-a alt"/><polygon points="110,96 118,91.5 118,100.5" class="fg-a alt"/>
<text x="300" y="90" text-anchor="middle" class="fg-t sm">SSLRequest：先問要不要加密</text>
<text x="20" y="132" class="fg-t sm">第 3 趟</text>
<line x1="118" y1="128" x2="482" y2="128" class="fg-l alt"/><polygon points="490,128 482,123.5 482,132.5" class="fg-a alt"/><polygon points="110,128 118,123.5 118,132.5" class="fg-a alt"/>
<text x="300" y="122" text-anchor="middle" class="fg-t sm">TLS 1.3 握手</text>
<text x="20" y="164" class="fg-t sm">第 4 趟</text>
<line x1="118" y1="160" x2="482" y2="160" class="fg-l alt"/><polygon points="490,160 482,155.5 482,164.5" class="fg-a alt"/><polygon points="110,160 118,155.5 118,164.5" class="fg-a alt"/>
<text x="300" y="154" text-anchor="middle" class="fg-t sm">StartupMessage：我是誰、要哪個資料庫</text>
<text x="20" y="196" class="fg-t sm">第 5 趟</text>
<line x1="118" y1="192" x2="482" y2="192" class="fg-l alt"/><polygon points="490,192 482,187.5 482,196.5" class="fg-a alt"/><polygon points="110,192 118,187.5 118,196.5" class="fg-a alt"/>
<text x="300" y="186" text-anchor="middle" class="fg-t sm">SCRAM 驗證第一輪</text>
<text x="20" y="228" class="fg-t sm">第 6 趟</text>
<line x1="118" y1="224" x2="482" y2="224" class="fg-l on"/><polygon points="490,224 482,219.5 482,228.5" class="fg-a on"/><polygon points="110,224 118,219.5 118,228.5" class="fg-a on"/>
<text x="300" y="218" text-anchor="middle" class="fg-t sm acc">SCRAM 第二輪 → 驗證通過、可以查詢了</text>
<text x="502" y="68" class="fg-t sm warm">fork 一個後端行程</text>
<text x="502" y="196" class="fg-t sm">核對用戶端的證明</text>
<text x="502" y="228" class="fg-t sm warm">載入系統目錄快取</text>
<text x="340" y="268" text-anchor="middle" class="fg-t sm">同一個機房（來回約 0.2 ms）：光網路就約 1.2 ms，加上 fork 和驗證，整體幾毫秒</text>
<text x="340" y="288" text-anchor="middle" class="fg-t sm warm">跨區域（來回約 50 ms）：光網路就 300 ms。而用主鍵查一列，資料庫只要零點幾毫秒</text>
</svg><figcaption>示意圖，數字是典型的數量級。建一條連線要五、六趟來回，比一個簡單查詢貴上十倍到上千倍。連線池存在的第一個理由，就是只付一次這筆錢。</figcaption></figure>
<p>還有一筆看不見的 CPU：SCRAM 驗證故意把密碼雜湊算很多次（預設 4,096 次），讓偷到雜湊值的人很難暴力破解。這筆運算主要花在用戶端；平常一台伺服器建幾條連線沒感覺，但一千個 serverless 實例同時冷啟動、同時連線，就是一筆不小的總和。PostgreSQL 17 起可以用 <code>sslnegotiation=direct</code> 省掉第 2 趟。</p>

<h3><span class="badge lv1">基礎</span>二、連線池在做什麼</h3>
<p>連線池（connection pool）就是讓客人共用服務生：應用程式啟動時先開好幾條連線放著，要用時借一條，用完馬上還，沒有空的就排隊。一次借用的流程：</p>
<ol>
<li><b>借</b>（acquire）：池子裡有閒的連線就直接拿；沒有，而且還沒到上限，就新開一條；到上限了，就排進等待佇列。</li>
<li><b>用</b>：送查詢，或跑完整個交易。</li>
<li><b>還</b>（release）：連線回到池子，給下一個人用。</li>
<li><b>汰換</b>：閒太久的連線關掉（idle timeout），活太久的也換新（max lifetime），例如資料庫切換之後，讓連線慢慢轉到新的主機。</li>
</ol>
<p>常見函式庫的預設值，有幾個很危險：</p>
<ul>
<li><b>node-postgres</b>（<code>pg.Pool</code>）：<code>max</code> 預設 10。危險的是 <code>connectionTimeoutMillis</code> 預設 0，也就是池子滿了就排隊<b>等到天荒地老</b>。</li>
<li><b>Go 的 database/sql</b>：<code>MaxOpenConns</code> 預設 0，代表<b>沒有上限</b>；<code>MaxIdleConns</code> 預設只留 2 條閒置，流量一來就不停開關連線。</li>
<li><b>Java 的 HikariCP</b>：<code>maximumPoolSize</code> 預設 10；<code>connectionTimeout</code> 預設 30 秒，對網頁請求來說太長。</li>
</ul>
<p>Go 的「沒有上限」最容易出事：流量一衝，每個 goroutine 各開一條，幾秒內就把資料庫的 <code>max_connections</code> 吃光。所以每個 Go 服務的第一件事，就是把上限設好：</p>
<pre><code>db.SetMaxOpenConns(10)    // 預設 0 = 無上限
db.SetMaxIdleConns(10)    // 預設只留 2 條閒置
db.SetConnMaxLifetime(30 * time.Minute)  // 定期換新

// 等連線加上執行，總共最多 3 秒
ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
defer cancel()
row := db.QueryRowContext(ctx, "SELECT ...")</code></pre>

<h3><span class="badge lv2">進階</span>三、池子要開多大：用利特爾法則算</h3>
<p>排隊理論有一條簡單到不可思議、又永遠成立的式子，叫<b>利特爾法則</b>（Little's law）：</p>
<pre><code>L = λ × W
L：平均同時在系統裡的數量（同時被借走的連線數）
λ：每秒進來幾個（每秒幾個需要資料庫的請求）
W：每個在裡面待多久（每個請求握著連線的時間）</code></pre>
<p>超商櫃台的例子：每分鐘來 2 位客人，每位結帳要 1.5 分鐘，櫃台前平均就有 3 位在結帳或排隊。換成連線池：</p>
<ul>
<li>API 每秒 1,500 個請求要碰資料庫，每個請求握著連線的時間平均 4 毫秒：<code>L = 1500 × 0.004 = 6</code>。平均只有 6 條連線同時在用。</li>
<li>流量有尖峰、時間有長尾，留兩到三倍的餘裕：大約 12 到 18 條。</li>
<li>應用程式跑 6 個副本：每個副本的池子開 3 到 5 條就夠了，總共 18 到 30 條。</li>
</ul>
<p>現在看這條式子最重要的用法：<b>W 變大，L 等比例變大。</b>某次上線讓一個查詢從 4 毫秒變成 40 毫秒，L 就從 6 變成 60，超過池子總共的 30 條。多出來的請求開始排隊，排隊的時間又加到回應時間上，於是<b>所有</b>端點都變慢，連沒用到那個查詢的也一樣。連線池用完，十次有九次不是因為流量變大，而是因為 W 變長了。</p>
<p>W 指的是「握著連線的時間」，不只是查詢本身。交易開著時去呼叫外部 API、在交易裡做大量運算、拿了連線才開始讀檔案，全都算在 W 裡。這就是為什麼連線要晚點借、早點還。</p>
<h4>上限從哪裡來：核心數</h4>
<p>池子再大，資料庫同一瞬間能做事的數量是固定的：一顆核心一次只跑一個查詢。PostgreSQL wiki 和 HikariCP 的文件都引用過一個起點公式：</p>
<pre><code>連線數 ≈ 核心數 × 2 + 有效磁碟數</code></pre>
<p>8 核心、資料大多在記憶體或 SSD 上的資料庫，大約就是 16 到 20 條<b>同時在跑</b>的連線。乘以 2，是因為查詢有一部分時間在等 IO、等網路，這時核心可以先做別人的。再往上加，就不會更快了：</p>
<figure class="figure"><svg viewBox="0 0 600 290" class="fg" style="width:100%;max-width:600px" role="img" aria-label="示意圖：8 核心資料庫的吞吐量隨同時執行的查詢數增加，在大約 16 時到頂，之後開始下降；每個查詢的延遲在超過頂點後快速上升">
<line x1="60" y1="240" x2="562" y2="240" class="fg-l"/><polygon points="570,240 562,235.5 562,244.5" class="fg-a"/>
<line x1="60" y1="240" x2="60" y2="36" class="fg-l"/><polygon points="60,28 55.5,36 64.5,36" class="fg-a"/>
<path d="M60 236 L170 118 Q215 78 270 76 Q400 74 540 150" class="fg-l on"/>
<path d="M60 205 C 250 205, 330 200, 400 165 S 500 70, 540 40" class="fg-l warm dash"/>
<circle cx="260" cy="77" r="4.5" class="fg-lamp on"/>
<text x="250" y="60" text-anchor="middle" class="fg-t sm acc">吞吐量到頂：約核心數 × 2</text>
<text x="540" y="176" text-anchor="end" class="fg-t sm acc">吞吐量開始往下掉</text>
<text x="470" y="40" text-anchor="end" class="fg-t sm warm">每個查詢的延遲</text>
<text x="90" y="226" class="fg-t sm">還沒用滿核心</text>
<line x1="170" y1="240" x2="170" y2="246" class="fg-l"/><line x1="260" y1="240" x2="260" y2="246" class="fg-l"/>
<line x1="350" y1="240" x2="350" y2="246" class="fg-l"/><line x1="440" y1="240" x2="440" y2="246" class="fg-l"/>
<line x1="530" y1="240" x2="530" y2="246" class="fg-l"/>
<text x="170" y="260" text-anchor="middle" class="fg-t sm mono">8</text>
<text x="260" y="260" text-anchor="middle" class="fg-t sm mono">16</text>
<text x="350" y="260" text-anchor="middle" class="fg-t sm mono">32</text>
<text x="440" y="260" text-anchor="middle" class="fg-t sm mono">64</text>
<text x="530" y="260" text-anchor="middle" class="fg-t sm mono">128</text>
<text x="310" y="282" text-anchor="middle" class="fg-t sm">同時在跑的查詢數（8 核心的資料庫）</text>
</svg><figcaption>示意圖，不是實測。過了頂點之後，多出來的連線只是在搶 CPU、搶鎖、互相把快取擠掉；工作量沒變多，每個查詢卻都變慢了。</figcaption></figure>
<p>過了頂點，作業系統開始在幾百個行程之間做內容切換（context switch，講 CPU 執行週期的那一章談過），每個行程的資料把 CPU 快取擠來擠去，大家搶同一批鎖。HikariCP 的〈About Pool Sizing〉文章引用過 Oracle 的實驗：把連線數大幅調小，回應時間反而大幅下降。很反直覺，但排隊在連線池裡等，比擠進資料庫裡互相拖累要好。</p>
<p>兩個數字放在一起看：利特爾法則告訴你<b>需要</b>幾條，核心數告訴你資料庫<b>最多能用</b>幾條。需要的比能用的還多，加連線沒有用，只能把 W 降下來（修慢查詢、把交易縮短），或擴充資料庫（讀取導到複本、加快取，第 3.4、3.5 課）。</p>

<h3><span class="badge lv3">專業</span>四、PgBouncer：三種模式，換來什麼、弄壞什麼</h3>
<p>應用程式自己的池子解決不了「副本一多，總數就爆」的問題。這時在中間放一個<b>連線池代理</b>（pooler），最常見的是 PgBouncer：它對應用程式假裝自己是 PostgreSQL，可以同時接幾千條用戶端連線（官方說每條預設只要約 2 KB），背後只開幾十條真正的連線。它一次能把真正的連線借多久，取決於模式：</p>
<ul>
<li><b>session 模式</b>：用戶端一連上就分到一條真正的連線，直到斷線才還。省下的只有「建連線」的時間，沒有共用效果。</li>
<li><b>transaction 模式</b>：只在一個交易的期間借用，<code>COMMIT</code> 或 <code>ROLLBACK</code> 一下就收回。這是最常用、效果最大的模式。</li>
<li><b>statement 模式</b>：每一道敘述就收回，所以根本不能用多敘述的交易。很少用。</li>
</ul>
<figure class="figure"><svg viewBox="0 0 680 270" class="fg" style="width:100%;max-width:680px" role="img" aria-label="transaction 模式的時間軸：三個用戶端各自偶爾跑一個交易，大部分時間閒著；一條真正的伺服器連線輪流服務三個用戶端的交易，中間幾乎沒有空檔">
<text x="340" y="20" text-anchor="middle" class="fg-t">transaction 模式：一條真正的連線，輪流服務三個用戶端</text>
<text x="20" y="54" class="fg-t">用戶端 A</text>
<text x="20" y="94" class="fg-t">用戶端 B</text>
<text x="20" y="134" class="fg-t">用戶端 C</text>
<line x1="120" y1="50" x2="650" y2="50" class="fg-l dim dash"/>
<line x1="120" y1="90" x2="650" y2="90" class="fg-l dim dash"/>
<line x1="120" y1="130" x2="650" y2="130" class="fg-l dim dash"/>
<rect x="130" y="39" width="70" height="22" rx="4" class="fg-b hot"/><text x="165" y="54" text-anchor="middle" class="fg-t sm">交易</text>
<rect x="360" y="39" width="60" height="22" rx="4" class="fg-b hot"/><text x="390" y="54" text-anchor="middle" class="fg-t sm">交易</text>
<rect x="210" y="79" width="80" height="22" rx="4" class="fg-b alt"/><text x="250" y="94" text-anchor="middle" class="fg-t sm">交易</text>
<rect x="520" y="79" width="60" height="22" rx="4" class="fg-b alt"/><text x="550" y="94" text-anchor="middle" class="fg-t sm">交易</text>
<rect x="300" y="119" width="50" height="22" rx="4" class="fg-b warm"/><text x="325" y="134" text-anchor="middle" class="fg-t sm">交易</text>
<rect x="430" y="119" width="80" height="22" rx="4" class="fg-b warm"/><text x="470" y="134" text-anchor="middle" class="fg-t sm">交易</text>
<text x="650" y="160" text-anchor="end" class="fg-t sm">虛線 = 連線開著，但閒著</text>
<text x="20" y="204" class="fg-t acc">伺服器連線</text>
<line x1="120" y1="200" x2="650" y2="200" class="fg-l"/>
<rect x="130" y="186" width="70" height="28" rx="4" class="fg-b hot"/><text x="165" y="205" text-anchor="middle" class="fg-t sm">A</text>
<rect x="210" y="186" width="80" height="28" rx="4" class="fg-b alt"/><text x="250" y="205" text-anchor="middle" class="fg-t sm">B</text>
<rect x="300" y="186" width="50" height="28" rx="4" class="fg-b warm"/><text x="325" y="205" text-anchor="middle" class="fg-t sm">C</text>
<rect x="360" y="186" width="60" height="28" rx="4" class="fg-b hot"/><text x="390" y="205" text-anchor="middle" class="fg-t sm">A</text>
<rect x="430" y="186" width="80" height="28" rx="4" class="fg-b warm"/><text x="470" y="205" text-anchor="middle" class="fg-t sm">C</text>
<rect x="520" y="186" width="60" height="28" rx="4" class="fg-b alt"/><text x="550" y="205" text-anchor="middle" class="fg-t sm">B</text>
<text x="340" y="242" text-anchor="middle" class="fg-t sm acc">三條用戶端連線，只用掉一條真正的連線：交易一結束就還給 PgBouncer</text>
<text x="340" y="262" text-anchor="middle" class="fg-t sm">換成 session 模式：A、B、C 各自獨佔一條，直到斷線，閒著也不還</text>
</svg><figcaption>應用程式的連線大部分時間是閒的（在跑程式、在等使用者、在等外部 API）。transaction 模式把這些空檔回收，給別人的交易用。</figcaption></figure>
<pre><code>[databases]
app = host=10.0.0.5 port=5432 dbname=app

[pgbouncer]
listen_port = 6432
pool_mode = transaction
; 最多接幾條用戶端連線
max_client_conn = 5000
; 每組「使用者＋資料庫」開幾條真正的連線
default_pool_size = 20
; 等不到連線 10 秒就報錯（預設 120 秒）
query_wait_timeout = 10</code></pre>
<h4>transaction 模式會弄壞什麼</h4>
<p>原則只有一句：<b>任何「這條連線上次設過、下次還在」的東西都不能信</b>，因為你的下一個交易，很可能跑在另一條真正的連線上。具體會踩到的：</p>
<ul>
<li><b>SET</b>：<code>SET search_path</code>、<code>SET timezone</code>、<code>SET statement_timeout</code> 這種連線層級的設定，會留在那條真正的連線上，然後<b>影響到下一個借到它的人</b>。要嘛在交易裡用 <code>SET LOCAL</code>，要嘛直接設在資料庫角色上：<code>ALTER ROLE app SET statement_timeout = '5s';</code></li>
<li><b>連線層級的諮詢鎖</b>（advisory lock）：<code>pg_advisory_lock()</code> 會鎖在別人也在用的連線上，解鎖時你可能根本不在那條連線。改用交易層級的 <code>pg_advisory_xact_lock()</code>。</li>
<li><b>LISTEN</b>：要一直守著同一條連線，收不到通知。需要 LISTEN 的程式直接連資料庫。</li>
<li><b>暫存表、WITH HOLD 游標</b>：跨交易就不見了。</li>
<li><b>prepared statement</b>：很多驅動會在連線上「預先編譯」查詢（JDBC 跑過幾次之後、Go 的 pgx 預設就會）。下一次執行換了一條連線，就會出現 <code>prepared statement "s1" does not exist</code>。PgBouncer 1.21 起可以設定 <code>max_prepared_statements</code>，由它幫你在每條連線上補準備；舊版就得在驅動裡關掉這個功能，例如 JDBC 的 <code>prepareThreshold=0</code>。</li>
</ul>
<p>AWS 的 RDS Proxy 也是同一回事，只是它遇到這些連線狀態時不報錯，而是把你「釘」（pinning）在一條真正的連線上不還，共用效果就消失了。其他常見的代理還有 PgCat、Odyssey、Supavisor；MySQL 這邊是 ProxySQL。另外記得 PgBouncer 本身是單執行緒，只用一顆核心，流量非常大時要跑好幾個。</p>

<h3><span class="badge lv3">專業</span>五、逾時：每一層都要有，而且裡面要比外面短</h3>
<p>上一課說「到處都要設逾時」。這裡講清楚為什麼，以及怎麼排。先看沒設的後果：</p>
<figure class="figure"><svg viewBox="0 0 680 260" class="fg" style="width:100%;max-width:680px" role="img" aria-label="逾時的層次：整個請求 10 秒的預算裡，等連線最多 2 秒、查詢最多 5 秒，剩下的是餘裕；沒有 statement_timeout 時，查詢跑了 60 秒，使用者早就放棄並重試">
<rect x="20" y="30" width="640" height="34" rx="5" class="fg-b"/>
<text x="340" y="52" text-anchor="middle" class="fg-t">負載平衡器或閘道：整個請求最多 10 秒</text>
<rect x="20" y="78" width="128" height="34" rx="5" class="fg-b warm"/>
<text x="84" y="100" text-anchor="middle" class="fg-t sm">等連線 ≤ 2 秒</text>
<rect x="148" y="78" width="320" height="34" rx="5" class="fg-b alt"/>
<text x="308" y="100" text-anchor="middle" class="fg-t sm">執行查詢：statement_timeout ≤ 5 秒</text>
<rect x="468" y="78" width="192" height="34" rx="5" class="fg-b dash"/>
<text x="564" y="100" text-anchor="middle" class="fg-t sm">組回應、重試的餘裕</text>
<line x1="20" y1="130" x2="660" y2="130" class="fg-l dim"/>
<text x="20" y="146" text-anchor="middle" class="fg-t sm mono">0</text>
<text x="148" y="146" text-anchor="middle" class="fg-t sm mono">2</text>
<text x="468" y="146" text-anchor="middle" class="fg-t sm mono">7</text>
<text x="652" y="146" text-anchor="middle" class="fg-t sm mono">10 秒</text>
<text x="20" y="178" class="fg-t sm warm">沒設 statement_timeout 的時候：</text>
<rect x="148" y="188" width="490" height="30" rx="5" class="fg-b warm"/>
<text x="160" y="208" class="fg-t sm">查詢一直跑到第 60 秒，使用者第 10 秒就放棄了</text>
<line x1="638" y1="203" x2="660" y2="203" class="fg-l warm"/><polygon points="668,203 660,198.5 660,207.5" class="fg-a warm"/>
<text x="340" y="246" text-anchor="middle" class="fg-t sm">使用者按重新整理三次：同一個慢查詢在資料庫裡同時跑四份，還各佔一條連線</text>
</svg><figcaption>外層的逾時到了，裡面的工作卻還在跑，這種「殭屍查詢」比慢查詢本身更危險：它一邊吃資源，一邊誘發更多重試。</figcaption></figure>
<p>排法的原則：<b>越裡面的越短</b>，而且使用者放棄的時候，資料庫也要跟著放棄。一份實用的起點（數字要依你的服務調整）：</p>
<ul>
<li><b>連線池的借用逾時</b>（應用程式的池子，1～2 秒）：池子滿了就快速失敗，而不是無限排隊。</li>
<li><b><code>connect_timeout</code></b>（驅動，幾秒）：資料庫主機掛掉時，不要卡在建連線。</li>
<li><b><code>statement_timeout</code></b>（資料庫角色，網頁請求 5 秒左右）：殺掉殭屍查詢。</li>
<li><b><code>idle_in_transaction_session_timeout</code></b>（資料庫角色，30 秒到 1 分鐘）：切斷開了交易卻忘了關的連線，也就是上一章卡住 VACUUM 的那種。</li>
<li><b><code>lock_timeout</code></b>（遷移用的角色或工作階段，3 秒左右）：遷移卡在鎖佇列裡，不要拖垮整張表。</li>
<li><b><code>transaction_timeout</code></b>（PostgreSQL 17 起，依工作而定）：限制整個交易的總時間。</li>
</ul>
<pre><code>ALTER ROLE app SET statement_timeout = '5s';
ALTER ROLE app
  SET idle_in_transaction_session_timeout = '60s';
ALTER ROLE migration SET lock_timeout = '3s';
-- 報表另外開一個角色，給它比較長的上限
ALTER ROLE reporting SET statement_timeout = '5min';</code></pre>
<p>為什麼設在角色上，而不是在程式裡下 SET？因為上一節說過，經過 transaction 模式的 PgBouncer，連線層級的 SET 會漏給別人。設在角色上，每條真正的連線一建立就帶著正確的值。</p>
<h4>一個雲端特有的坑：閒置連線被悄悄切斷</h4>
<p>連線池裡的連線常常閒很久。中間如果經過 NAT 閘道或防火牆，它們會把太久沒封包的連線從表裡刪掉，例如 AWS NAT Gateway 是 350 秒。兩端都不知道，等下一次借出這條連線去查詢，封包石沉大海，要等 TCP 自己逾時（可能好幾分鐘）才報錯。對策是讓池子的閒置逾時比中間設備短、打開 TCP keepalive，並設定連線的最長壽命。</p>

<h3><span class="badge lv3">專業</span>六、診斷：連線池用完了，還是資料庫慢了</h3>
<p>這兩種情況的症狀一模一樣：API 變慢、逾時、錯誤率上升。修法卻完全相反，判斷錯了就會去做白工，例如替一個很閒的資料庫升級機器。照這棵樹走：</p>
<figure class="figure"><svg viewBox="0 0 680 350" class="fg" style="width:100%;max-width:680px" role="img" aria-label="診斷樹：先看資料庫 CPU 或 IO 高不高，高就是資料庫真的忙；不高就看連線池有沒有人排隊，沒有就是慢在資料庫以外；有就看 pg_stat_activity，分成交易開著沒關、在等鎖、連線洩漏三種">
<rect x="230" y="14" width="220" height="34" rx="6" class="fg-b"/>
<text x="340" y="36" text-anchor="middle" class="fg-t">API 變慢、等連線逾時</text>
<line x1="340" y1="48" x2="340" y2="64" class="fg-l"/><polygon points="340,72 335.5,64 344.5,64" class="fg-a"/>
<rect x="210" y="72" width="260" height="34" rx="6" class="fg-b warm"/>
<text x="340" y="94" text-anchor="middle" class="fg-t">資料庫的 CPU 或 IO 很高？</text>
<path d="M210 89 H110 V134" class="fg-l"/><polygon points="110,142 105.5,134 114.5,134" class="fg-a"/>
<text x="160" y="82" text-anchor="middle" class="fg-t sm acc">是</text>
<path d="M470 89 H530 V134" class="fg-l"/><polygon points="530,142 525.5,134 534.5,134" class="fg-a"/>
<text x="500" y="82" text-anchor="middle" class="fg-t sm acc">否</text>
<rect x="20" y="142" width="180" height="50" rx="6" class="fg-b hot"/>
<text x="110" y="163" text-anchor="middle" class="fg-t">資料庫真的忙</text>
<text x="110" y="182" text-anchor="middle" class="fg-t sm">找總時間最高的查詢</text>
<rect x="400" y="142" width="260" height="34" rx="6" class="fg-b warm"/>
<text x="530" y="164" text-anchor="middle" class="fg-t">應用程式的連線池有人在排隊？</text>
<path d="M595 176 V204" class="fg-l"/><polygon points="595,212 590.5,204 599.5,204" class="fg-a"/>
<text x="603" y="198" class="fg-t sm acc">否</text>
<rect x="520" y="212" width="150" height="42" rx="6" class="fg-b hot"/>
<text x="595" y="230" text-anchor="middle" class="fg-t">慢在資料庫以外</text>
<text x="595" y="247" text-anchor="middle" class="fg-t sm">外部 API、程式本身</text>
<path d="M460 176 V194 H365 V204" class="fg-l"/><polygon points="365,212 360.5,204 369.5,204" class="fg-a"/>
<text x="466" y="198" class="fg-t sm acc">是</text>
<rect x="250" y="212" width="230" height="34" rx="6" class="fg-b warm"/>
<text x="365" y="234" text-anchor="middle" class="fg-t">看 pg_stat_activity 的狀態</text>
<line x1="365" y1="246" x2="365" y2="262" class="fg-l"/>
<line x1="120" y1="262" x2="560" y2="262" class="fg-l"/>
<line x1="120" y1="262" x2="120" y2="274" class="fg-l"/><polygon points="120,282 115.5,274 124.5,274" class="fg-a"/>
<line x1="340" y1="262" x2="340" y2="274" class="fg-l"/><polygon points="340,282 335.5,274 344.5,274" class="fg-a"/>
<line x1="560" y1="262" x2="560" y2="274" class="fg-l"/><polygon points="560,282 555.5,274 564.5,274" class="fg-a"/>
<rect x="20" y="282" width="200" height="56" rx="6" class="fg-b hot"/>
<text x="120" y="305" text-anchor="middle" class="fg-t">交易開著沒關</text>
<text x="120" y="325" text-anchor="middle" class="fg-t sm">idle in transaction 很多</text>
<rect x="240" y="282" width="200" height="56" rx="6" class="fg-b hot"/>
<text x="340" y="305" text-anchor="middle" class="fg-t">在等鎖</text>
<text x="340" y="325" text-anchor="middle" class="fg-t sm">active 多，wait_event 是 Lock</text>
<rect x="460" y="282" width="200" height="56" rx="6" class="fg-b hot"/>
<text x="560" y="305" text-anchor="middle" class="fg-t">連線洩漏</text>
<text x="560" y="325" text-anchor="middle" class="fg-t sm">借出去沒還，資料庫卻很閒</text>
</svg><figcaption>第一個問題就把兩大類分開：資料庫自己很忙，還是它很閒、大家卻在排隊。後者幾乎都是「連線被握太久」的問題。</figcaption></figure>
<p>每一個節點要看的數字，都有現成的地方：</p>
<pre><code>-- 資料庫這邊：每條連線現在在做什麼
SELECT state, wait_event_type, count(*)
FROM pg_stat_activity
WHERE backend_type = 'client backend'
GROUP BY 1, 2
ORDER BY 3 DESC;

-- 誰被誰擋住
SELECT pid, pg_blocking_pids(pid) AS blocked_by,
       now() - query_start AS waiting,
       left(query, 40) AS query
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) &gt; 0;</code></pre>
<ul>
<li><b>應用程式這邊</b>：node-postgres 的 <code>pool.totalCount</code>、<code>idleCount</code>、<code>waitingCount</code>；Go 的 <code>db.Stats()</code> 裡的 <code>InUse</code>、<code>WaitCount</code>、<code>WaitDuration</code>。把它們送進監控，畫成圖。</li>
<li><b>PgBouncer 這邊</b>：用 psql 連到它的管理資料庫 <code>pgbouncer</code>，執行 <code>SHOW POOLS;</code>。<code>cl_waiting</code> 大於 0、<code>maxwait</code> 一直變大，就是真正的連線不夠用。</li>
</ul>
<h4>三個真實的劇本</h4>
<ol>
<li><b>慢查詢拖垮全部。</b>某次上線讓一個查詢從 5 毫秒變成 500 毫秒。池子被它佔滿，連登入這種跟它無關的請求都在排隊。資料庫 CPU 很高、<code>active</code> 的數量剛好等於池子大小。修那個查詢（第 3.1 課那一章的方法）。長期的對策是<b>隔艙</b>（bulkhead）：報表、匯出這種重的工作用另一個池子，甚至另一個資料庫角色，滿了也只影響自己。</li>
<li><b>交易開著等外部呼叫。</b>程式在交易裡呼叫金流服務商，對方變慢到 3 秒。資料庫很閒，<code>pg_stat_activity</code> 一整排 <code>idle in transaction</code>。修法是上一章的「先提交、再呼叫」。</li>
<li><b>連線洩漏</b>（connection leak）。某個錯誤處理的路徑拿了連線卻沒還，每出一次錯就少一條。幾個小時後池子見底，重啟就好，過幾個小時又壞，這是它的招牌症狀。修法是永遠在 <code>finally</code> 裡 release，或只用會自動歸還的寫法（node-postgres 的 <code>pool.query()</code>、ORM 的交易函式）。HikariCP 有 <code>leakDetectionThreshold</code>，借出超過門檻就印出是哪一行借的。</li>
</ol>

<h3><span class="badge lv4">專家</span>七、serverless 與連線風暴</h3>
<h4>serverless：每個實例都是一台小伺服器</h4>
<p>AWS Lambda、Cloud Functions 這類平台，同時有 1,000 個請求就可能有 1,000 個實例，每個實例都是獨立的行程，有自己的連線池。就算每個池子只開 1 條，也是 1,000 條連線，遠超過一台資料庫能承受的。而且實例在兩次呼叫之間會被凍結，連線開著卻不能用，過一陣子實例被回收，連線就被丟在那裡，直到伺服器端的逾時或 keepalive 把它清掉。</p>
<p>對策有四個，通常要一起用：</p>
<ul>
<li>前面一定放連線池代理（RDS Proxy、PgBouncer、Supavisor），讓資料庫只看到幾十條連線。</li>
<li>每個實例的池子開 1 條，而且把建立連線的程式放在處理函式<b>外面</b>，同一個實例的下一次呼叫才能重用。</li>
<li>限制函式的最大並行數（例如 Lambda 的 reserved concurrency），讓它不可能超過資料庫算得出來的上限。</li>
<li>考慮雲端資料庫提供的、走 HTTP 的資料存取方式，讓連線的事交給平台處理。</li>
</ul>
<h4>連線風暴：所有人同時重連</h4>
<p>算一個 Kubernetes 上的例子：服務有 30 個 Pod，每個池子最少保持 10 條連線，平常總共 300 條，前面沒有 PgBouncer。資料庫做了一次故障切換（failover），300 條連線同時斷掉。接下來的一秒鐘：</p>
<ol>
<li>30 個 Pod 同時發現斷線，各自馬上重開 10 條：300 個連線請求同時打過來，每一個都要 fork、做驗證。</li>
<li>剛接手的資料庫 CPU 被建連線吃滿，真正的查詢反而跑不動，部分連線建立逾時。</li>
<li>逾時的客戶端立刻重試，加上使用者的請求也在重試，請求量比平常還大。</li>
<li>系統停在「一直在重連、一直失敗」的狀態，就算原本的問題已經好了也回不來。</li>
</ol>
<p>這種「觸發原因消失了，系統卻自己回不去」的狀態，叫<b>亞穩態故障</b>（metastable failure）。部署時所有 Pod 一起重啟、自動擴展一次加 20 個 Pod、PgBouncer 重啟，都會觸發同樣的風暴。解法是打散和節流：</p>
<ul>
<li><b>重連要指數退避加隨機抖動</b>（exponential backoff with jitter），讓 300 個重連分散在幾秒之間，而不是擠在同一個毫秒。</li>
<li><b>池子的最小連線數設低</b>，需要時才慢慢開，不要啟動時一口氣開滿。</li>
<li><b>滾動部署一次只換幾個 Pod</b>（Kubernetes 的 <code>maxSurge</code>、<code>maxUnavailable</code>）。</li>
<li><b>前面放 PgBouncer</b>：用戶端的重連打在 PgBouncer 上很便宜，它背後的真正連線數量是固定的。</li>
</ul>
<figure class="figure"><svg viewBox="0 0 680 236" class="fg" style="width:100%;max-width:680px" role="img" aria-label="故障切換後每 100 毫秒的連線請求數：左邊沒有抖動，300 個重連擠在同一瞬間，超過資料庫能消化的量，失敗後又一波波一起重試；右邊加上指數退避和隨機抖動，同樣的請求攤在幾秒內，每一段都在能消化的量以下">
<line x1="340" y1="8" x2="340" y2="230" class="fg-l dim dash"/>
<text x="175" y="22" text-anchor="middle" class="fg-t warm">沒有抖動：大家同時重連</text>
<text x="505" y="22" text-anchor="middle" class="fg-t acc">指數退避＋隨機抖動</text>
<line x1="40" y1="180" x2="330" y2="180" class="fg-l"/>
<line x1="370" y1="180" x2="660" y2="180" class="fg-l"/>
<rect x="50" y="40" width="24" height="140" rx="3" class="fg-b warm"/><rect x="130" y="80" width="24" height="100" rx="3" class="fg-b warm"/><rect x="210" y="70" width="24" height="110" rx="3" class="fg-b warm"/><rect x="290" y="85" width="24" height="95" rx="3" class="fg-b warm"/>
<rect x="375" y="146" width="14" height="34" rx="2" class="fg-b hot"/><rect x="397" y="140" width="14" height="40" rx="2" class="fg-b hot"/><rect x="419" y="150" width="14" height="30" rx="2" class="fg-b hot"/><rect x="441" y="136" width="14" height="44" rx="2" class="fg-b hot"/><rect x="463" y="144" width="14" height="36" rx="2" class="fg-b hot"/><rect x="485" y="149" width="14" height="31" rx="2" class="fg-b hot"/><rect x="507" y="138" width="14" height="42" rx="2" class="fg-b hot"/><rect x="529" y="142" width="14" height="38" rx="2" class="fg-b hot"/><rect x="551" y="147" width="14" height="33" rx="2" class="fg-b hot"/><rect x="573" y="135" width="14" height="45" rx="2" class="fg-b hot"/><rect x="595" y="145" width="14" height="35" rx="2" class="fg-b hot"/><rect x="617" y="141" width="14" height="39" rx="2" class="fg-b hot"/>
<line x1="40" y1="130" x2="330" y2="130" class="fg-l alt dash"/>
<line x1="370" y1="130" x2="660" y2="130" class="fg-l alt dash"/>
<text x="650" y="122" text-anchor="end" class="fg-t sm alt">資料庫消化得了的量</text>
<text x="62" y="196" text-anchor="middle" class="fg-t sm mono">0</text><text x="142" y="196" text-anchor="middle" class="fg-t sm mono">1 秒</text>
<text x="222" y="196" text-anchor="middle" class="fg-t sm mono">2 秒</text><text x="302" y="196" text-anchor="middle" class="fg-t sm mono">3 秒</text>
<text x="382" y="196" text-anchor="middle" class="fg-t sm mono">0</text><text x="470" y="196" text-anchor="middle" class="fg-t sm mono">1 秒</text>
<text x="558" y="196" text-anchor="middle" class="fg-t sm mono">2 秒</text><text x="636" y="196" text-anchor="middle" class="fg-t sm mono">3 秒</text>
<text x="175" y="222" text-anchor="middle" class="fg-t sm warm">擠在同一瞬間，失敗了再一起重試</text>
<text x="505" y="222" text-anchor="middle" class="fg-t sm acc">同樣的量攤開來，每一段都消化得了</text>
</svg><figcaption>示意圖。每根柱子是 100 毫秒內打到資料庫的連線請求數。總量一樣，差別只在有沒有打散：左邊每一波都超過上限，失敗的又在下一秒一起回來。</figcaption></figure>
<h4>最後幾道防線</h4>
<ul>
<li><b>容量的算式要寫下來</b>：所有服務的「副本數上限 × 池子上限」加起來，必須小於 <code>max_connections</code> 再扣掉保留給管理員的名額。自動擴展的上限要跟著這個算式走，不然 HPA 把 Pod 從 3 個擴到 30 個時，連線需求也跟著乘以 10。</li>
<li><b>每個角色設連線上限</b>：<code>ALTER ROLE reporting CONNECTION LIMIT 20;</code>，一個失控的服務不會把別人的名額吃光。</li>
<li><b>留管理員的門</b>：<code>superuser_reserved_connections</code>（預設 3）保留幾條給超級使用者。連線全滿時，你還能登進去看發生了什麼事、砍掉卡住的連線（<code>pg_terminate_backend(pid)</code>）。</li>
<li><b>不要用調高 max_connections 來解決</b>：它要重啟才生效，每條連線都多佔記憶體，而且同時在跑的查詢一多，就回到第三節那條往下掉的曲線。</li>
</ul>

<h3>八、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>連線越多，資料庫處理得越快</td><td>同時在跑的查詢超過大約核心數兩倍之後，吞吐量持平甚至下降，延遲上升。</td></tr>
<tr><td>連線池用完，就把池子開大</td><td>通常是 W（握著連線的時間）變長了。先找出誰握太久，池子開大只是把排隊搬進資料庫裡。</td></tr>
<tr><td>API 慢，一定是資料庫慢</td><td>資料庫可能很閒，大家只是在排隊等連線。先看資料庫 CPU 和池子的等待數，再下結論。</td></tr>
<tr><td>PgBouncer 放上去就好，程式不用改</td><td>transaction 模式下，SET、諮詢鎖、LISTEN、prepared statement 都可能壞掉，要先檢查程式和驅動。</td></tr>
<tr><td>應用程式逾時了，資料庫那邊也就停了</td><td>沒有 statement_timeout 的話，查詢會繼續跑完，變成殭屍查詢。</td></tr>
<tr><td>serverless 不用管連線</td><td>每個實例都有自己的連線，並行數一高就是連線風暴，前面一定要有代理。</td></tr>
</table>

<h3>九、跟你的工作連起來</h3>
<ul>
<li><b>Node.js／TypeScript</b>：整個行程只建立<b>一個</b> <code>Pool</code>，在模組最外層建立、到處共用；不要每個請求 new 一個。<code>connectionTimeoutMillis</code> 一定要設。用 <code>pool.connect()</code> 拿 client 時，一定要 <code>try { ... } finally { client.release(); }</code>。</li>
<li><b>Go</b>：<code>sql.DB</code> 本身就是連線池，同樣整個程式只開一個。<code>SetMaxOpenConns</code> 一定要設，查詢一律用帶 context 的版本，讓逾時能真的取消查詢。</li>
<li><b>遊戲後端</b>：遊戲伺服器常常一個玩家一條 WebSocket，千萬不要一個玩家一條資料庫連線。玩家連線數和資料庫連線數必須脫鉤，中間就是連線池。</li>
<li><b>Docker、Kubernetes 與雲端</b>：把「副本數 × 池子大小」寫進部署設定的註解裡；HPA 的 <code>maxReplicas</code> 要用它反推。雲端代管資料庫的 <code>max_connections</code> 常常跟機型的記憶體大小連動，換小機器時記得重算。</li>
<li><b>前端（Vue、Cocos、Unity）</b>：你看到的「轉圈圈很久然後失敗」，很多時候就是後端在排隊等連線。回報問題時附上時間點，後端就能對照池子的等待數。</li>
</ul>

<h3>十、面試會怎麼問</h3>
<p>這些題目在後端、SRE、DevOps 面試裡都很常見，而且很容易追問到實際數字。先出聲回答，再看參考答案。</p>
<ol>
<li>「為什麼需要資料庫連線池？PostgreSQL 的連線為什麼特別貴？」</li>
<li>「你會怎麼決定連線池的大小？請實際算一次。」</li>
<li>「PgBouncer 的 session 和 transaction 模式差在哪？用 transaction 模式要注意什麼？」</li>
<li>「API 回應時間變長，資料庫 CPU 只有 15%。你怎麼查？」</li>
<li>「資料庫故障切換之後，整個服務好幾分鐘都起不來，可能是什麼原因？怎麼避免？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>建立連線要 TCP、TLS、驗證好幾次網路來回，PostgreSQL 還會為每條連線 fork 一個後端行程，各佔幾 MB 記憶體，總數也受 max_connections 限制。連線池讓連線被重複使用，只付一次建立成本，並把同時使用的數量控制在資料庫能有效處理的範圍。MySQL 是每條連線一個執行緒，比較輕，但同時執行的查詢過多一樣會互相拖慢。</li>
<li>用利特爾法則：需要的連線數 = 每秒請求數 × 每個請求握著連線的時間。例如每秒 1,500 個請求、每個 4 毫秒，平均 6 條，留兩三倍餘裕約 15 條，再除以副本數。另一端看資料庫能有效執行的並行量，起點大約是核心數的兩倍。需要的超過能用的，要降低握連線的時間或擴充資料庫，不是加連線。最後實際量測，用延遲和池子的等待數驗證。</li>
<li>session 模式在用戶端連線期間獨佔一條伺服器連線，只省建連線的成本；transaction 模式只在交易期間借用，可以讓幾千個用戶端共用幾十條連線。transaction 模式下不能依賴連線狀態：連線層級的 SET 會漏給別人（改用 SET LOCAL 或設在角色上）、連線層級的諮詢鎖和 LISTEN 不能用、暫存表跨交易會不見，prepared statement 要靠 PgBouncer 1.21 以上的 max_prepared_statements 或在驅動關掉。</li>
<li>資料庫很閒、應用程式很慢，代表時間花在等待：先看應用程式連線池的等待數；有排隊的話，看 pg_stat_activity：大量 idle in transaction 代表交易開著在等別的事（例如外部 API）；active 很多但在等 Lock，就用 pg_blocking_pids 找出擋路的人；連線都被借走但資料庫幾乎沒有活動，是連線洩漏。池子沒排隊的話，問題在資料庫以外，例如外部服務或應用程式本身。</li>
<li>可能是連線風暴：所有實例同時偵測到斷線並同時重連，加上預設要一次開滿池子，新的主資料庫被大量建連線和驗證壓垮，逾時又引發更多重試，形成回不去的亞穩態。避免：重連用指數退避加隨機抖動、池子最小連線數設低、前面放 PgBouncer 或 RDS Proxy、限制每個角色的連線數，並在演練時實際做一次故障切換來驗證。</li>
</ol>
</details>

<h3>十一、練功題（做得出來才算真的懂）</h3>
<ol>
<li>一個服務每秒 800 個請求會碰資料庫，每個請求握著連線平均 12 毫秒。平均需要幾條連線？跑 4 個副本，每個副本的池子你會開多大？</li>
<li>承上題，某個查詢退化，讓握連線的時間變成 60 毫秒。你的池子還撐得住嗎？使用者會看到什麼？</li>
<li>在練習用的 PostgreSQL 容器裡，開一個 psql 視窗執行 <code>BEGIN; SELECT 1;</code> 然後什麼都不做；在另一個視窗用 <code>pg_stat_activity</code> 找出它。接著在第一個視窗先 <code>ROLLBACK;</code>，執行 <code>SET idle_in_transaction_session_timeout = '10s';</code>，再重做一次 <code>BEGIN; SELECT 1;</code>，等 10 秒以上再隨便下一個指令，看看發生什麼事。</li>
<li>你的同事在程式裡寫了 <code>await client.query("SET search_path TO tenant_42")</code>，前面有 transaction 模式的 PgBouncer。會發生什麼事？怎麼改？</li>
<li>一台 4 核心的資料庫，有 3 個服務：API（8 個副本）、背景工作（4 個副本）、報表（1 個副本）。不使用 PgBouncer，各服務的池子你會怎麼分配？寫下你的算式和理由。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>L = 800 × 0.012 = 9.6，平均約 10 條。留兩三倍餘裕約 20 到 30 條，除以 4 個副本，每個池子 5 到 8 條。</li>
<li>L = 800 × 0.06 = 48，超過 4 × 8 = 32 條的總量。多出來的請求在池子裡排隊，排隊時間加到每個請求上，連不相干的端點都變慢；設了借用逾時的話會看到「等連線逾時」的錯誤。正確的反應是修那個查詢，而不是把池子開到 48。</li>
<li>第二個視窗會看到一列 <code>state = 'idle in transaction'</code>，<code>xact_start</code> 停在你下 BEGIN 的時間。設了 10 秒的逾時後，那條連線會被伺服器切斷，第一個視窗下一次執行指令時，會收到連線已被終止的錯誤。正式環境就是用它來清掉忘了關的交易。</li>
<li>這個 SET 會留在當時那條真正的連線上。下一個交易可能跑在別的連線上，看不到這個設定，於是查到錯的租戶；更糟的是，下一個借到那條連線的「別人」會帶著 tenant_42 的 search_path，可能讀到別的客戶的資料。改法：在交易裡用 <code>SET LOCAL search_path</code>，或乾脆在查詢裡寫明 schema，不依賴連線狀態。</li>
<li>一種合理的答案：4 核心的有效並行量大約 8 到 10。API 最重要，給 8 個副本各 1 到 2 條（共 8 到 16 條，但同時在跑的通常更少）；背景工作 4 個副本各 1 條；報表 1 條，並設較長的 statement_timeout 和自己的角色連線上限。總數控制在 25 左右，遠低於 max_connections，並留下管理員的名額。重點是寫出「副本 × 池子」的加總，並說明重的工作被隔開，不會吃掉 API 的連線。真的不夠時，該做的是加 PgBouncer 或降低握連線的時間。</li>
</ol>
</details>

<h3>十二、想再挖深</h3>
<ul>
<li><b>PgBouncer 官方文件</b>（<a href="https://www.pgbouncer.org/">pgbouncer.org</a>）：設定說明，以及各種 SQL 功能在三種模式下能不能用的對照表。</li>
<li><b>HikariCP wiki〈About Pool Sizing〉</b>：連線池大小為什麼要小，附上核心數公式的來由。寫的是 Java，道理適用每一種語言。</li>
<li><b>PostgreSQL 官方文件〈Client Connection Defaults〉與〈Connections and Authentication〉</b>：本章所有逾時和連線參數的定義、預設值都在這兩頁。</li>
<li><b>Michael Nygard《Release It!》</b>：逾時、隔艙、斷路器這些讓系統在出事時還站得住的模式，經典之作。</li>
<li><b>Marc Brooker 的部落格與 AWS Builders' Library〈Timeouts, retries, and backoff with jitter〉</b>：為什麼重試一定要加抖動，以及重試如何把小故障放大成大事故。</li>
</ul>
` });
