DEEP({ 'net-journey': `
<p>課文給了你一條八站的鏈，和一行替每一站計時的 curl。這一章把每一站都放上真實的毫秒數：一個全新連線的請求，到底要付幾個來回；curl 的每一個計時欄位，各量到哪一刻；伺服器怎麼用 Server-Timing 標頭，把自己裡面花掉的時間「報帳」給你；分散式追蹤（distributed tracing）怎麼把一個請求在十台機器上的時間，串成一張圖；延遲最常躲在哪幾個角落；最後完整走一次「網站很慢」的診斷。模組 0〈網際網路是什麼〉的深入圖解講過光速和慢啟動，〈瀏覽器是什麼〉講過瀏覽器那一側的時間軸。這一章站在維運的位置，把整條路從頭量到尾。</p>

<h3><span class="badge lv1">基礎</span>一、把一次請求想成去辦事：八個櫃台各要多久</h3>
<p>想像你要去一棟政府大樓辦一件事。先查地址（DNS），走到大樓門口（TCP），在門口驗證件、換通行證（TLS），到服務台填單（HTTP），服務台抽號碼牌、把你分到某個窗口（邊緣節點與負載平衡），承辦人處理你的案子（應用程式），承辦人跑一趟檔案室調資料（資料庫）。</p>
<p>重點在這裡：<b>第一次去，每一站都要走；第二次，你人已經在大樓裡、手上有通行證，直接走到窗口就好。</b>網路也一樣。查地址、走到門口、換通行證，是每條新連線只付一次的「入場費」；後面四站，則是每一個請求都要付。</p>
<figure class="figure"><svg viewBox="0 0 680 290" class="fg" style="width:100%;max-width:680px" role="img" aria-label="八站的請求路徑：瀏覽器、DNS、TCP、TLS、HTTP、邊緣與負載平衡、應用程式、資料庫，每一站標出典型的時間，DNS、TCP、TLS 三站只有新連線才要付">
<text x="425" y="18" text-anchor="middle" class="fg-t sm warm">2～4 只有新連線才要付；重用連線就跳過</text>
<path d="M180 34 V26 H670 V34" class="fg-l warm"/>
<rect x="10" y="40" width="150" height="76" rx="7" class="fg-b"/>
<text x="85" y="63" text-anchor="middle" class="fg-t lg">1 瀏覽器</text>
<text x="85" y="84" text-anchor="middle" class="fg-t sm">先查自己的快取</text>
<text x="85" y="102" text-anchor="middle" class="fg-t sm">&lt; 1 ms</text>
<rect x="180" y="40" width="150" height="76" rx="7" class="fg-b warm"/>
<text x="255" y="63" text-anchor="middle" class="fg-t lg">2 DNS</text>
<text x="255" y="84" text-anchor="middle" class="fg-t sm">快取命中：0 ms</text>
<text x="255" y="102" text-anchor="middle" class="fg-t sm">沒命中：20–200 ms</text>
<rect x="350" y="40" width="150" height="76" rx="7" class="fg-b warm"/>
<text x="425" y="63" text-anchor="middle" class="fg-t lg">3 TCP</text>
<text x="425" y="84" text-anchor="middle" class="fg-t sm">1 個來回</text>
<text x="425" y="102" text-anchor="middle" class="fg-t sm">台北到東京約 35 ms</text>
<rect x="520" y="40" width="150" height="76" rx="7" class="fg-b warm"/>
<text x="595" y="63" text-anchor="middle" class="fg-t lg">4 TLS 1.3</text>
<text x="595" y="84" text-anchor="middle" class="fg-t sm">1 個來回</text>
<text x="595" y="102" text-anchor="middle" class="fg-t sm">（TLS 1.2 要 2 個）</text>
<line x1="160" y1="78" x2="172" y2="78" class="fg-l"/><polygon points="180,78 172,73.5 172,82.5" class="fg-a"/>
<line x1="330" y1="78" x2="342" y2="78" class="fg-l"/><polygon points="350,78 342,73.5 342,82.5" class="fg-a"/>
<line x1="500" y1="78" x2="512" y2="78" class="fg-l"/><polygon points="520,78 512,73.5 512,82.5" class="fg-a"/>
<path d="M595 116 V140 H85 V156" class="fg-l"/><polygon points="85,164 80.5,156 89.5,156" class="fg-a"/>
<rect x="10" y="164" width="150" height="76" rx="7" class="fg-b"/>
<text x="85" y="187" text-anchor="middle" class="fg-t lg">5 HTTP</text>
<text x="85" y="208" text-anchor="middle" class="fg-t sm">1 個來回</text>
<text x="85" y="226" text-anchor="middle" class="fg-t sm">＋等伺服器處理</text>
<rect x="180" y="164" width="150" height="76" rx="7" class="fg-b"/>
<text x="255" y="187" text-anchor="middle" class="fg-t lg">6 邊緣／LB</text>
<text x="255" y="208" text-anchor="middle" class="fg-t sm">CDN 命中就直接回</text>
<text x="255" y="226" text-anchor="middle" class="fg-t sm">LB 本身 &lt; 1 ms</text>
<rect x="350" y="164" width="150" height="76" rx="7" class="fg-b hot"/>
<text x="425" y="187" text-anchor="middle" class="fg-t lg">7 應用程式</text>
<text x="425" y="208" text-anchor="middle" class="fg-t sm">幾毫秒到幾百毫秒</text>
<text x="425" y="226" text-anchor="middle" class="fg-t sm acc">最常藏延遲的地方</text>
<rect x="520" y="164" width="150" height="76" rx="7" class="fg-b alt"/>
<text x="595" y="187" text-anchor="middle" class="fg-t lg">8 資料庫</text>
<text x="595" y="208" text-anchor="middle" class="fg-t sm">一次查詢 0.5–5 ms</text>
<text x="595" y="226" text-anchor="middle" class="fg-t sm">× 查詢的次數</text>
<line x1="160" y1="202" x2="172" y2="202" class="fg-l"/><polygon points="180,202 172,197.5 172,206.5" class="fg-a"/>
<line x1="330" y1="202" x2="342" y2="202" class="fg-l"/><polygon points="350,202 342,197.5 342,206.5" class="fg-a"/>
<line x1="500" y1="202" x2="512" y2="202" class="fg-l"/><polygon points="520,202 512,197.5 512,206.5" class="fg-a"/>
<text x="340" y="272" text-anchor="middle" class="fg-t sm">數字是數量級：使用者在台北，伺服器在東京，應用程式和資料庫在同一個雲端區域</text>
</svg><figcaption>橘色三站是每條新連線的入場費，綠色那一站是最常出事的地方。資料庫那一格要乘上「這個請求查了幾次」，這個乘法常常比單次查詢的速度更重要。</figcaption></figure>
<p>為什麼只能給數量級？因為每一站的時間都看條件。DNS 有沒有命中快取，差距是 0 和 200 毫秒；TCP 和 TLS 的成本幾乎全看距離，台北到東京一個來回約 35 毫秒，到美西約 140 毫秒；應用程式那一站，簡單的讀取幾毫秒，複雜的報表可以好幾秒。記住數量級的用處是：<b>量到一個數字時，你能立刻判斷它「正常」還是「離譜」。</b>TCP 花了 35 毫秒到東京，正常；花了 1 秒，那就是封包在重送（第 1.4 課）。</p>

<h3><span class="badge lv1">基礎</span>二、來回才是真正的貨幣</h3>
<p>一個請求的時間，大部分不是花在「傳資料」，而是花在「等對方回話」。資料從你這裡跑到伺服器、再跑回來，叫一個<b>來回</b>（round trip，RTT）。小請求的成本，幾乎就是「要等幾個來回」乘上「一個來回多長」。下面把一個全新的 HTTPS 請求，一個訊息一個訊息畫出來：</p>
<figure class="figure"><svg viewBox="0 0 660 330" class="fg" style="width:100%;max-width:660px" role="img" aria-label="時序圖：瀏覽器先向解析器查 DNS，再和東京的伺服器做 TCP 交握、TLS 1.3 交握，最後送出 HTTP 請求，總共約 165 毫秒">
<rect x="60" y="10" width="100" height="30" rx="6" class="fg-b alt"/><text x="110" y="30" text-anchor="middle" class="fg-t">瀏覽器</text>
<rect x="210" y="10" width="100" height="30" rx="6" class="fg-b"/><text x="260" y="30" text-anchor="middle" class="fg-t">解析器</text>
<rect x="480" y="10" width="160" height="30" rx="6" class="fg-b hot"/><text x="560" y="30" text-anchor="middle" class="fg-t">伺服器（東京）</text>
<line x1="110" y1="40" x2="110" y2="300" class="fg-l dim dash"/>
<line x1="260" y1="40" x2="260" y2="100" class="fg-l dim dash"/>
<line x1="560" y1="40" x2="560" y2="300" class="fg-l dim dash"/>
<line x1="110" y1="60" x2="252" y2="71" class="fg-l"/><polygon points="260,72 252,67 251,76" class="fg-a"/>
<line x1="260" y1="76" x2="118" y2="87" class="fg-l"/><polygon points="110,88 118,83 119,92" class="fg-a"/>
<text x="272" y="80" class="fg-t sm">DNS 約 20 ms</text>
<line x1="110" y1="100" x2="552" y2="124" class="fg-l alt"/><polygon points="560,125 552,120 551,129" class="fg-a alt"/>
<text x="400" y="106" text-anchor="middle" class="fg-t sm mono">SYN</text>
<line x1="560" y1="129" x2="118" y2="153" class="fg-l alt"/><polygon points="110,154 118,149 119,158" class="fg-a alt"/>
<text x="270" y="138" text-anchor="middle" class="fg-t sm mono">SYN-ACK</text>
<line x1="110" y1="158" x2="552" y2="182" class="fg-l on"/><polygon points="560,183 552,178 551,187" class="fg-a on"/>
<text x="400" y="164" text-anchor="middle" class="fg-t sm mono">ACK＋ClientHello</text>
<line x1="560" y1="187" x2="118" y2="211" class="fg-l on"/><polygon points="110,212 118,207 119,216" class="fg-a on"/>
<text x="270" y="191" text-anchor="middle" class="fg-t sm mono">ServerHello＋憑證＋Finished</text>
<line x1="110" y1="216" x2="552" y2="240" class="fg-l warm"/><polygon points="560,241 552,236 551,245" class="fg-a warm"/>
<text x="400" y="222" text-anchor="middle" class="fg-t sm mono">Finished＋GET /lobby</text>
<rect x="550" y="241" width="20" height="24" rx="3" class="fg-b warm"/>
<text x="578" y="258" class="fg-t sm">處理 40 ms</text>
<line x1="560" y1="265" x2="118" y2="289" class="fg-l warm"/><polygon points="110,290 118,285 119,294" class="fg-a warm"/>
<text x="270" y="272" text-anchor="middle" class="fg-t sm mono">200 OK＋HTML</text>
<text x="8" y="78" class="fg-t sm">DNS</text>
<text x="8" y="130" class="fg-t sm alt">TCP</text>
<text x="8" y="188" class="fg-t sm acc">TLS</text>
<text x="8" y="256" class="fg-t sm warm">HTTP</text>
<text x="100" y="64" text-anchor="end" class="fg-t sm">0</text>
<text x="100" y="92" text-anchor="end" class="fg-t sm">20</text>
<text x="100" y="158" text-anchor="end" class="fg-t sm">55</text>
<text x="100" y="216" text-anchor="end" class="fg-t sm">90</text>
<text x="100" y="294" text-anchor="end" class="fg-t sm">165</text>
<text x="330" y="322" text-anchor="middle" class="fg-t sm">新連線：DNS＋3 個來回＋處理 ≈ 165 ms；重用連線：1 個來回＋處理 ≈ 75 ms</text>
</svg><figcaption>左邊的數字是瀏覽器這一側的時間（毫秒）。TLS 1.3 的用戶端在收到伺服器的 Finished 之後，馬上把自己的 Finished 和 HTTP 請求一起送出，所以加密只多花一個來回。</figcaption></figure>
<p>把這張圖換到美西（來回 140 毫秒）算一次：新連線是 20 + 3 × 140 + 40 = 480 毫秒，重用連線是 140 + 40 = 180 毫秒。<b>距離會被來回的次數放大。</b>所以加速的手法只有兩大類：</p>
<ul>
<li><b>減少來回的次數</b>：重用連線（keep-alive、連線池），升級到 TLS 1.3（比 1.2 少一個來回），用 HTTP/3（QUIC 把 TCP 和 TLS 的交握合成一個來回），在頁面上用 <code>&lt;link rel="preconnect"&gt;</code> 提早替 API 網域做完前三站。</li>
<li><b>縮短每個來回</b>：用 CDN 讓邊緣節點在使用者附近回答，把伺服器放在使用者所在的區域。</li>
</ul>
<h4>轉址：最容易被忽略的整趟重來</h4>
<p>使用者打 <code>http://example.com</code>，伺服器回 301 轉到 <code>https://example.com</code>，那裡又回 301 轉到 <code>https://www.example.com/</code>。每一次轉址都是一個完整的回應；換了協定或換了主機名稱，就要重新開一條連線，DNS、TCP、TLS 再付一次。這種兩層轉址，在冷啟動時可以多吃掉 5 個來回以上。把對外的連結、廣告網址、App 裡寫死的網址，全部直接指向最終的網址；再用 HSTS（第 1.5 課）讓瀏覽器自己把 http 換成 https，連第一跳都省掉。</p>
<h4>0-RTT：快，但有代價</h4>
<p>TLS 1.3 和 QUIC 都支援「恢復連線時，第一個封包就帶著請求」，叫 0-RTT（early data）。它真的省掉一個來回，但這份早到的資料可以被攻擊者錄下來重播（replay）。所以伺服器只該對不會改變狀態的請求（像 GET 讀資料）接受 0-RTT；「送出猜測」「扣點數」這種請求，絕對不能被重播。很多 CDN 預設不開，或只對 GET 開，就是這個原因。</p>

<h3><span class="badge lv2">進階</span>三、curl -w：一行指令量出前四站</h3>
<p>curl 的 <code>-w</code>（write-out）會在請求結束後，印出它記下的時間點。最重要的一件事：<b>每個數字都是「從開始到那一刻」的累計時間，不是那一站自己花的時間。</b>每一站的成本，要用相鄰兩個數字相減。</p>
<table>
<tr><th>變數</th><th>記下的是哪一刻</th></tr>
<tr><td><code>time_namelookup</code></td><td>DNS 查完，拿到 IP</td></tr>
<tr><td><code>time_connect</code></td><td>TCP 交握完成</td></tr>
<tr><td><code>time_appconnect</code></td><td>TLS 交握完成（http 網址沒有 TLS，這裡是 0）</td></tr>
<tr><td><code>time_pretransfer</code></td><td>一切準備好，要開始送請求</td></tr>
<tr><td><code>time_starttransfer</code></td><td>收到回應的第一個位元組，也就是 TTFB（time to first byte）</td></tr>
<tr><td><code>time_total</code></td><td>整個回應收完</td></tr>
<tr><td><code>time_redirect</code></td><td>加了 <code>-L</code> 跟著轉址時，花在轉址上的時間</td></tr>
</table>
<figure class="figure"><svg viewBox="0 0 680 240" class="fg" style="width:100%;max-width:680px" role="img" aria-label="一條時間軸，標出 curl 記下的五個累計時間點，以及相鄰兩點之間代表的 DNS、TCP、TLS、等伺服器、下載五段">
<text x="82" y="44" text-anchor="middle" class="fg-t sm mono">time_namelookup</text>
<text x="82" y="60" text-anchor="middle" class="fg-t sm">0.021</text>
<text x="228" y="44" text-anchor="middle" class="fg-t sm mono">time_appconnect</text>
<text x="228" y="60" text-anchor="middle" class="fg-t sm">0.094</text>
<text x="616" y="44" text-anchor="middle" class="fg-t sm mono">time_total</text>
<text x="616" y="60" text-anchor="middle" class="fg-t sm">0.288</text>
<line x1="82" y1="66" x2="82" y2="90" class="fg-l dim dash"/>
<line x1="228" y1="66" x2="228" y2="90" class="fg-l dim dash"/>
<line x1="616" y1="66" x2="616" y2="90" class="fg-l dim dash"/>
<rect x="40" y="90" width="42" height="40" class="fg-b"/><text x="61" y="115" text-anchor="middle" class="fg-t sm">DNS</text>
<rect x="82" y="90" width="72" height="40" class="fg-b alt"/><text x="118" y="115" text-anchor="middle" class="fg-t sm">TCP 36</text>
<rect x="154" y="90" width="74" height="40" class="fg-b hot"/><text x="191" y="115" text-anchor="middle" class="fg-t sm">TLS 37</text>
<rect x="228" y="90" width="342" height="40" class="fg-b warm"/><text x="399" y="115" text-anchor="middle" class="fg-t sm">等伺服器 171 ms（其中 1 個來回約 36 ms）</text>
<rect x="570" y="90" width="46" height="40" class="fg-b"/><text x="593" y="115" text-anchor="middle" class="fg-t sm">下載</text>
<line x1="154" y1="130" x2="154" y2="146" class="fg-l dim dash"/>
<line x1="570" y1="130" x2="570" y2="146" class="fg-l dim dash"/>
<text x="154" y="160" text-anchor="middle" class="fg-t sm mono">time_connect</text>
<text x="154" y="176" text-anchor="middle" class="fg-t sm">0.057</text>
<text x="570" y="160" text-anchor="middle" class="fg-t sm mono">time_starttransfer</text>
<text x="570" y="176" text-anchor="middle" class="fg-t sm">0.265</text>
<text x="40" y="208" class="fg-t sm mono">TCP = connect − namelookup　　TLS = appconnect − connect</text>
<text x="40" y="228" class="fg-t sm mono">伺服器自己花的 ≈ starttransfer − appconnect − 1 個來回 ≈ 135 ms</text>
</svg><figcaption>同一個請求的五個累計時間點。TCP 那一段（36 ms）就是一個來回，可以拿來估算「等伺服器」那一段裡，有多少只是網路往返、多少是伺服器真的在忙。</figcaption></figure>
<p>每次都打一長串 <code>-w</code> 很煩。把格式寫進檔案，用 <code>@</code> 讀進來；檔案裡的換行會原樣印出：</p>
<pre><code>$ cat timing.txt
   dns  %{time_namelookup}
   tcp  %{time_connect}
   tls  %{time_appconnect}
  ttfb  %{time_starttransfer}
 total  %{time_total}
  http  %{http_version}   ip %{remote_ip}

$ curl -s -o /dev/null -w @timing.txt https://example.com/</code></pre>
<p>幾個讓量測變準的習慣：</p>
<ul>
<li><b>跑五次，看中位數。</b>單一次的結果會被一次封包遺失、一次快取沒命中帶歪。第一次通常最慢，因為 DNS 還沒快取。</li>
<li><b>用 <code>--resolve</code> 釘住 IP。</b><code>curl --resolve example.com:443:203.0.113.10 https://example.com/</code> 會跳過 DNS，直接連到你指定的那台機器，而且 Host 標頭和 TLS 的伺服器名稱（SNI）都還是 example.com，憑證檢查照樣通過。這是「繞過 CDN 直接打某一台」的標準手法，第七節會用到。</li>
<li><b>看連線有沒有被重用。</b>同一行指令給 curl 兩個網址，第二個會重用同一條連線；加 <code>-v</code> 會看到 <code>Re-using existing connection</code>。這樣可以分別量出「冷」和「熱」的成本。</li>
<li><b>一次全拿。</b>較新的 curl 支援 <code>-w '%{json}'</code>，把所有變數印成一份 JSON，方便丟進腳本比較。</li>
<li><b>順便看標頭。</b><code>curl -sI</code> 印出回應標頭，CDN 會在這裡留下線索：<code>Age</code>（這份副本在快取裡放了幾秒）、<code>X-Cache: Hit from cloudfront</code>、<code>CF-Cache-Status: HIT</code> 這類欄位，告訴你這次是邊緣節點直接回的，還是跑回了你的伺服器。</li>
</ul>

<h3><span class="badge lv2">進階</span>四、Server-Timing：讓伺服器自己報帳</h3>
<p>curl 只看得到伺服器的外面：它知道「等了 171 毫秒」，不知道這 171 毫秒花在哪裡。<b>Server-Timing</b> 是一個標準的回應標頭，讓伺服器把裡面每一段的時間寫進回應裡：</p>
<pre><code>Server-Timing: db;dur=53.2, cache;desc="redis";dur=1.4</code></pre>
<p>每一項有一個名字、可選的說明（desc）和毫秒數（dur）。Chrome DevTools 的 Network 分頁，點一個請求、切到 Timing，最下面就會把這幾項畫成長條；在頁面的 JavaScript 裡，<code>performance.getEntriesByType('navigation')[0].serverTiming</code> 拿得到主頁面的，每一個資源也各有自己的 <code>serverTiming</code>。跨來源的請求（例如頁面在 game.example，API 在 api.example），API 要多回一個 <code>Timing-Allow-Origin</code> 標頭，瀏覽器才肯把這些數字交給頁面的程式。</p>
<p>在 Node.js 裡自己加，大概長這樣（<code>db</code> 是你的 PostgreSQL 連線池）：</p>
<pre><code>const SQL = 'SELECT id, players FROM rooms LIMIT 50';

app.get('/api/lobby', async (req, res) =&gt; {
  const t0 = performance.now();
  const { rows } = await db.query(SQL);
  const t1 = performance.now();
  const body = JSON.stringify(rows);
  const t2 = performance.now();
  const dbMs = (t1 - t0).toFixed(1);
  const jsonMs = (t2 - t1).toFixed(1);
  res.set('Server-Timing',
    'db;dur=' + dbMs + ', json;dur=' + jsonMs);
  res.type('json').send(body);
});</code></pre>
<p>Go 也是一樣的道理：在寫出回應之前，用 <code>w.Header().Set("Server-Timing", ...)</code> 設好。標頭一定要在送出回應主體之前設，送出去之後再設就沒用了。</p>
<div class="warn"><b>別把內部細節公開出去。</b>Server-Timing 每一個人都看得到。寫「db;dur=53」沒關係，寫「desc="SELECT * FROM users WHERE ..."」或內部主機名稱，就是在替攻擊者畫地圖。常見做法是只對內部使用者（例如帶了特定權杖的請求）回詳細版本，或只回幾個粗略的大項。</div>

<h3><span class="badge lv3">專業</span>五、分散式追蹤：一個請求，十台機器，一張圖</h3>
<p>Server-Timing 只看一台伺服器。真實系統裡，一個請求可能先到負載平衡器、再到 API 服務、API 服務又去呼叫排行榜服務、驗證服務、Redis、資料庫。每一台都有自己的日誌，可是沒有人知道「這一行日誌和那一行日誌，屬於同一個使用者的同一次點擊」。<b>分散式追蹤</b>就是為了把它們串起來。</p>
<p>做法很樸素：請求一進來，就發一個全域唯一的<b>追蹤編號</b>（trace ID）。每一個工作單位叫一個<b>區段</b>（span），記下開始時間、花了多久、它的上層是誰。呼叫下一個服務時，把編號放進 HTTP 標頭一起送過去。W3C 把這個標頭標準化了，叫 <code>traceparent</code>：</p>
<pre><code>traceparent:
  00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01</code></pre>
<p>用減號切成四段：<code>00</code> 是版本；中間 32 個十六進位字是追蹤編號，整個請求從頭到尾都一樣；接著 16 個字是「呼叫你的那個區段」的編號；最後的 <code>01</code> 是旗標，代表這個請求有被取樣、要記錄下來。</p>
<p>每個服務把自己的區段送到同一個後端（Jaeger、Grafana Tempo、Zipkin，或雲端業者的追蹤服務），後端再依編號和上下層關係，拼回一張瀑布圖。現在業界的標準工具是 <b>OpenTelemetry</b>：它的 SDK 會自動替常見的 HTTP 框架、HTTP 用戶端、資料庫驅動程式產生區段並傳遞標頭，你通常只要加幾行設定。</p>
<figure class="figure"><svg viewBox="0 0 680 300" class="fg" style="width:100%;max-width:680px" role="img" aria-label="一次 POST /api/guess 請求的追蹤瀑布圖，共 212 毫秒，其中查歷史紀錄十二次的 N+1 查詢花 48 毫秒，呼叫排行榜服務花 120 毫秒">
<text x="220" y="34" text-anchor="middle" class="fg-t sm">0</text>
<text x="315" y="34" text-anchor="middle" class="fg-t sm">50</text>
<text x="410" y="34" text-anchor="middle" class="fg-t sm">100</text>
<text x="505" y="34" text-anchor="middle" class="fg-t sm">150</text>
<text x="600" y="34" text-anchor="middle" class="fg-t sm">200 ms</text>
<line x1="220" y1="40" x2="220" y2="266" class="fg-l dim"/>
<line x1="315" y1="40" x2="315" y2="266" class="fg-l dim dash"/>
<line x1="410" y1="40" x2="410" y2="266" class="fg-l dim dash"/>
<line x1="505" y1="40" x2="505" y2="266" class="fg-l dim dash"/>
<line x1="600" y1="40" x2="600" y2="266" class="fg-l dim dash"/>
<text x="10" y="64" class="fg-t sm">LB：POST /api/guess</text>
<rect x="220" y="50" width="403" height="18" rx="3" class="fg-b alt"/><text x="421" y="63" text-anchor="middle" class="fg-t sm">212 ms</text>
<text x="22" y="88" class="fg-t sm">應用程式 handler</text>
<rect x="226" y="74" width="389" height="18" rx="3" class="fg-b alt"/>
<text x="34" y="112" class="fg-t sm">Redis 讀 session</text>
<rect x="229" y="98" width="5" height="18" rx="2" class="fg-b hot"/><text x="240" y="111" class="fg-t sm">2 ms</text>
<text x="34" y="136" class="fg-t sm">SELECT 玩家</text>
<rect x="235" y="122" width="8" height="18" rx="2" class="fg-b hot"/><text x="249" y="135" class="fg-t sm">4 ms</text>
<text x="34" y="160" class="fg-t sm">SELECT 歷史 × 12 次</text>
<rect x="243" y="146" width="91" height="18" rx="3" class="fg-b warm"/><text x="342" y="159" class="fg-t sm warm">48 ms：N+1</text>
<text x="34" y="184" class="fg-t sm">呼叫排行榜服務</text>
<rect x="334" y="170" width="228" height="18" rx="3" class="fg-b warm"/><text x="448" y="183" text-anchor="middle" class="fg-t sm">120 ms</text>
<text x="46" y="208" class="fg-t sm">排行榜：等資料列鎖</text>
<rect x="349" y="194" width="194" height="18" rx="3" class="fg-b warm"/><text x="446" y="207" text-anchor="middle" class="fg-t sm">102 ms</text>
<text x="34" y="232" class="fg-t sm">INSERT 這一次猜測</text>
<rect x="566" y="218" width="15" height="18" rx="2" class="fg-b hot"/>
<text x="34" y="256" class="fg-t sm">序列化 JSON</text>
<rect x="581" y="242" width="30" height="18" rx="2" class="fg-b hot"/>
<text x="340" y="290" text-anchor="middle" class="fg-t sm">兩段橘色佔了 212 ms 裡的 168 ms，其他所有東西加起來不到 45 ms</text>
</svg><figcaption>往右是時間，往下縮排是「誰呼叫了誰」。一眼看出兩個問題：十二次一模一樣的小查詢排成一道樓梯（N+1），以及排行榜服務裡有一段在等別人放開資料列的鎖。</figcaption></figure>
<h4>讀瀑布圖的四個眼法</h4>
<ol>
<li><b>最長的那一條</b>：哪一個依賴最慢，先看它。</li>
<li><b>一道樓梯</b>：一長串一模一樣、首尾相接的小區段，幾乎都是 N+1：迴圈裡每一圈查一次資料庫。改成一次查完（<code>WHERE player_id = ANY($1)</code> 或 JOIN）。</li>
<li><b>沒有子區段的空白</b>：上層區段很長，底下卻沒有東西，時間花在你自己的程式裡：CPU 運算、垃圾回收、Node.js 事件迴圈被同步程式卡住，或在等連線池給你一條連線（如果連線池沒被量測的話）。</li>
<li><b>本來可以並行的序列</b>：三個互不相干的呼叫首尾相接排著，代表程式一個 <code>await</code> 接一個 <code>await</code>。用 <code>Promise.all</code>（Node.js）或 errgroup（Go）讓它們同時跑，總時間從加總變成最長的那一個。</li>
</ol>
<h4>取樣：不可能每一個都留</h4>
<p>每秒一萬個請求，每個都留完整追蹤，儲存費會比伺服器還貴。兩種取樣法：<b>開頭取樣</b>（head-based）在請求一進來就擲骰子，例如只留 1%，決定之後透過 <code>traceparent</code> 最後那個旗標告訴下游，大家一致；簡單便宜，但最有價值的「慢的、出錯的」請求，99% 也被丟掉了。<b>結尾取樣</b>（tail-based）先把所有區段送到收集器暫存，等整個請求結束、知道它慢不慢、有沒有出錯，再決定要不要留；比較貴、要多一層元件，但留下來的都是你真正想看的。</p>

<h3><span class="badge lv3">專業</span>六、延遲藏在哪裡：九個常見角落</h3>
<p>下面每一個，都是正式環境裡真的一再出現的原因。照這張清單問一遍，大部分「慢」都能找到。</p>
<ol>
<li><b>每次都開新連線。</b>負載平衡器到後端、後端到資料庫、後端到第三方 API，只要有一段沒有重用連線，每個請求就多付一次交握。PostgreSQL 每條新連線還要做身分驗證、在伺服器上建一個新的行程，常常要好幾毫秒以上。Node.js 從 19 版起，全域的 HTTP agent 預設開 keep-alive；更舊的版本、或自己 new 出來的 agent，要自己確認。</li>
<li><b>轉址鏈。</b>第二節那種兩層轉址。</li>
<li><b>CDN 沒命中。</b>沒命中時，邊緣節點要回你的伺服器拿，多一段「邊緣到原站」的來回，原站在地球另一邊時就很可觀。常見原因：回應帶了 <code>Cache-Control: private</code> 或 <code>no-store</code>、靜態檔案回應裡夾了 <code>Set-Cookie</code>、網址後面加了每次都不一樣的參數、<code>Vary</code> 依太多標頭切副本。看 <code>Age</code> 和 CDN 的快取標頭就知道（第 3.8 課）。</li>
<li><b>排隊。</b>見下面的曲線。它是最反直覺、也最常被誤判的一個。</li>
<li><b>一個接一個的 await。</b>瀑布圖裡的「可以並行的序列」。</li>
<li><b>N+1 查詢。</b>一次 4 毫秒看起來很快，乘上 12 次就是 48 毫秒；資料庫在另一個可用區域（availability zone），每次多 1 毫秒左右，又更慢。</li>
<li><b>跨區域呼叫。</b>同一個可用區域裡，一個來回通常不到 1 毫秒；跨可用區域大約 1 到 2 毫秒；跨區域就是幾十到上百毫秒。應用程式在東京、資料庫在新加坡（來回大約 70 毫秒），一個請求查 20 次，光網路就 1.4 秒。</li>
<li><b>尾端延遲被扇出放大。</b>一個頁面同時呼叫 10 個服務，要等最慢的那一個。就算每個服務只有 1% 的請求超過 1 秒，整頁超過 1 秒的機率是 1 − 0.99<sup>10</sup> ≈ 9.6%。服務越多，使用者越常撞到某個服務的最慢情況。</li>
<li><b>執行環境自己停下來。</b>垃圾回收的暫停、Node.js 主執行緒上一段同步的大 JSON 解析把所有請求卡住、容器或無伺服器函式的冷啟動、JIT 還沒暖好的前幾百個請求。</li>
</ol>
<figure class="figure"><svg viewBox="0 0 640 300" class="fg" style="width:100%;max-width:640px" role="img" aria-label="使用率和回應時間的曲線：使用率百分之五十時回應時間是處理時間的兩倍，百分之八十時五倍，百分之九十時十倍，接近百分之百時急速上升">
<text x="78" y="28" class="fg-t sm">平均回應時間 ÷ 單次處理時間</text>
<line x1="70" y1="40" x2="70" y2="250" class="fg-l"/>
<line x1="70" y1="250" x2="620" y2="250" class="fg-l"/>
<text x="62" y="243" text-anchor="end" class="fg-t sm">1×</text>
<text x="62" y="201" text-anchor="end" class="fg-t sm">5×</text>
<text x="62" y="149" text-anchor="end" class="fg-t sm">10×</text>
<text x="62" y="44" text-anchor="end" class="fg-t sm">20×</text>
<line x1="70" y1="197.5" x2="610" y2="197.5" class="fg-l dim dash"/>
<line x1="70" y1="145" x2="610" y2="145" class="fg-l dim dash"/>
<line x1="610" y1="40" x2="610" y2="250" class="fg-l warm dash"/>
<text x="602" y="238" text-anchor="end" class="fg-t sm warm">滿載</text>
<text x="70" y="268" text-anchor="middle" class="fg-t sm">0%</text>
<text x="205" y="268" text-anchor="middle" class="fg-t sm">25%</text>
<text x="340" y="268" text-anchor="middle" class="fg-t sm">50%</text>
<text x="475" y="268" text-anchor="middle" class="fg-t sm">75%</text>
<text x="610" y="268" text-anchor="middle" class="fg-t sm">100%</text>
<text x="340" y="290" text-anchor="middle" class="fg-t sm">使用率：瓶頸那一個資源忙碌的比例</text>
<polyline points="70,239.5 178,236.9 286,232.5 340,229 394,223.8 448,215 502,197.5 529,180 556,145 572,100 583,40" class="fg-l on"/>
<circle cx="340" cy="229" r="4" class="fg-lamp on"/>
<circle cx="502" cy="197.5" r="4" class="fg-lamp on"/>
<circle cx="556" cy="145" r="4" class="fg-lamp on"/>
<text x="340" y="214" text-anchor="middle" class="fg-t sm acc">50%：2 倍</text>
<text x="490" y="186" text-anchor="end" class="fg-t sm acc">80%：5 倍</text>
<text x="544" y="136" text-anchor="end" class="fg-t sm acc">90%：10 倍</text>
</svg><figcaption>最簡單的排隊模型（M/M/1）：回應時間 ≈ 處理時間 ÷（1 − 使用率）。真實系統的曲線形狀不完全一樣，但趨勢都是這樣：過了七、八成，每多一點流量，延遲就多很多。</figcaption></figure>
<p>用一個連線池算一次。池子裡 10 條連線，每次查詢佔用一條 20 毫秒，那每秒最多做 10 ÷ 0.02 = 500 次。這叫<b>利特爾法則</b>（Little's law）的應用：同時在處理的數量 = 每秒進來幾個 × 每個待多久。流量每秒 250 次時，使用率 50%，平均等待很短；流量每秒 450 次，使用率 90%，照上面的曲線，平均回應時間變成單次的 10 倍左右；流量超過 500，佇列就無限長大，直到逾時。</p>
<p>最容易誤判的地方是：<b>這時候整台機器的 CPU 可能才 30%。</b>瓶頸不是 CPU，是那 10 條連線。看「整體使用率很低」就說不可能是容量問題，是新手最常犯的錯。要找的是整條路上最窄的那一個資源：連線池、執行緒池、一把熱門的鎖、單執行緒的 Node.js 程序、一個每秒只准你打 100 次的第三方 API。</p>

<h3><span class="badge lv4">專家</span>七、完整診斷一次：「網站很慢」</h3>
<p>情境：猜高低遊戲的大廳 API，從晚上 9 點開始變慢，使用者回報畫面一直轉圈圈。下面是一個資深工程師會走的順序。</p>
<h4>第 0 步：先把「很慢」變成數字</h4>
<p>誰慢？全部使用者，還是某個地區、某種裝置？哪個網址？從幾點開始？看儀表板：大廳 API 的 p50 從 120 毫秒變成 900 毫秒，p99 從 400 毫秒變成 4 秒，9 點整開始，所有地區都一樣。所有地區一起變慢，先排除「某個地區的網路」；接著查 9 點有沒有部署、改設定、排程工作開始跑。這次查到：8 點 50 分上線了一個「猜完更新排行榜」的新功能。</p>
<h4>第 1 步：從外面量</h4>
<pre><code>dns 0.003   tcp 0.034   tls 0.070   ttfb 1.950   total 1.962</code></pre>
<p>DNS、TCP、TLS 都正常：TCP 34 毫秒，正好是一個到東京的來回。時間全部堆在 TLS 完成到第一個位元組之間：<b>問題在伺服器那一側</b>，不在網路。</p>
<h4>第 2 步：一次跳過一站，相減</h4>
<p>這是整個診斷的核心手法，跟二分搜尋一樣：在鏈上不同的位置放探針，每次少走一站，兩次結果相減，就是被跳過那一站的成本。</p>
<figure class="figure"><svg viewBox="0 0 700 260" class="fg" style="width:100%;max-width:700px" role="img" aria-label="四種量法各自涵蓋的範圍：從外面量涵蓋全部四站，跳過 CDN 涵蓋三站，在機器上量涵蓋兩站，Server-Timing 只涵蓋資料庫，相減得到每一站的成本，資料庫佔了 1790 毫秒">
<text x="295" y="30" text-anchor="middle" class="fg-t sm">CDN 邊緣</text>
<text x="391" y="30" text-anchor="middle" class="fg-t sm">負載平衡器</text>
<text x="487" y="30" text-anchor="middle" class="fg-t sm">應用程式</text>
<text x="583" y="30" text-anchor="middle" class="fg-t sm">資料庫＋等連線</text>
<text x="10" y="71" class="fg-t sm">① 從外面 curl 正式網址</text>
<rect x="250" y="50" width="90" height="32" rx="4" class="fg-b alt"/>
<rect x="346" y="50" width="90" height="32" rx="4" class="fg-b alt"/>
<rect x="442" y="50" width="90" height="32" rx="4" class="fg-b alt"/>
<rect x="538" y="50" width="90" height="32" rx="4" class="fg-b alt"/>
<text x="690" y="71" text-anchor="end" class="fg-t mono">1.95 s</text>
<text x="10" y="113" class="fg-t sm">② --resolve 直接打 LB</text>
<rect x="346" y="92" width="90" height="32" rx="4" class="fg-b alt"/>
<rect x="442" y="92" width="90" height="32" rx="4" class="fg-b alt"/>
<rect x="538" y="92" width="90" height="32" rx="4" class="fg-b alt"/>
<text x="690" y="113" text-anchor="end" class="fg-t mono">1.93 s</text>
<text x="10" y="155" class="fg-t sm">③ 在機器上 curl localhost</text>
<rect x="442" y="134" width="90" height="32" rx="4" class="fg-b alt"/>
<rect x="538" y="134" width="90" height="32" rx="4" class="fg-b alt"/>
<text x="690" y="155" text-anchor="end" class="fg-t mono">1.91 s</text>
<text x="10" y="197" class="fg-t sm">④ Server-Timing 的 db</text>
<rect x="538" y="176" width="90" height="32" rx="4" class="fg-b alt"/>
<text x="690" y="197" text-anchor="end" class="fg-t mono">1.79 s</text>
<line x1="10" y1="220" x2="690" y2="220" class="fg-l dim"/>
<text x="10" y="246" class="fg-t sm acc">相減得到每一站</text>
<rect x="250" y="228" width="90" height="28" rx="4" class="fg-b"/><text x="295" y="247" text-anchor="middle" class="fg-t sm">20 ms</text>
<rect x="346" y="228" width="90" height="28" rx="4" class="fg-b"/><text x="391" y="247" text-anchor="middle" class="fg-t sm">20 ms</text>
<rect x="442" y="228" width="90" height="28" rx="4" class="fg-b"/><text x="487" y="247" text-anchor="middle" class="fg-t sm">120 ms</text>
<rect x="538" y="228" width="90" height="28" rx="4" class="fg-b warm"/><text x="583" y="247" text-anchor="middle" class="fg-t sm warm">1,790 ms</text>
</svg><figcaption>每往內一層，就少量一站。① 減 ② 是 CDN 的成本，② 減 ③ 是負載平衡器，③ 減 ④ 是應用程式自己，④ 本身就是資料庫那一段。</figcaption></figure>
<p>② 的指令是 <code>curl --resolve api.example.com:443:&lt;負載平衡器的 IP&gt; https://api.example.com/lobby</code>；③ 是登入其中一台應用程式機器，<code>curl http://localhost:8080/lobby</code>。四個數字一排，答案很清楚：CDN 和負載平衡器各只佔 20 毫秒，應用程式自己 120 毫秒，<b>資料庫那一段 1.79 秒</b>。</p>
<h4>第 3 步：資料庫慢，還是「等資料庫」慢？</h4>
<p>這是很多人在這裡停下來、然後修錯地方的一步。去資料庫看慢查詢日誌，大廳那條查詢在資料庫裡只跑 90 毫秒，比平常慢一點，但遠遠不到 1.79 秒。打開追蹤，區段寫得很清楚：<code>pool.acquire</code> 1,700 毫秒，<code>SELECT rooms</code> 90 毫秒。<b>時間不是花在查詢，而是花在排隊等連線池給一條連線。</b></p>
<p>再往下追：8 點 50 分上線的新功能，在一個資料庫交易（transaction）裡面呼叫排行榜服務，交易開著、連線就被佔著，平均一次佔 120 毫秒，比原本的 20 毫秒長了 6 倍。連線池的容量從每秒 500 次掉到每秒 80 次左右，晚上 9 點的流量一上來，使用率超過 100%，排隊的時間就像上一節的曲線那樣衝上去。</p>
<h4>第 4 步：修，並且證明修好了</h4>
<ul>
<li><b>止血</b>：先把新功能用功能開關（feature flag）關掉，p99 在幾分鐘內回到 400 毫秒。</li>
<li><b>根治</b>：把外部呼叫移出交易，交易只包住真正要一起成功或一起失敗的那幾行 SQL；排行榜改成丟進佇列，讓背景工作去更新（第 3.7 課）。</li>
<li><b>讓下一次更早發現</b>：替連線池加上「等待時間」和「使用中連線數」的指標和警報；設定取得連線的逾時（例如 2 秒），寧可快速失敗，也不要讓請求無限排隊、把上游也拖垮。</li>
<li><b>寫進事後檢討</b>：附上這四個數字和那張追蹤圖（第 4.3 課）。</li>
</ul>
<p>這次診斷的教訓，是整章的縮影：<b>先量，再猜；從外往內，一次跳過一站；量到「哪一段」之後，還要再問一次「那一段是在做事，還是在等」。</b></p>

<h3><span class="badge lv4">專家</span>八、量測本身的陷阱</h3>
<p>量錯了，比沒量更危險，因為你會很有信心地修錯地方。</p>
<ul>
<li><b>平均數會說謊。</b>99 個 50 毫秒加上 1 個 5 秒，平均是 99.5 毫秒，看起來還好；但每一百個使用者就有一個等了 5 秒，而那一個常常是資料最多、最重要的客戶。看 p50、p95、p99，最好看分布圖。</li>
<li><b>協調遺漏</b>（coordinated omission）：很多壓力測試工具是「送一個、等回應、再送下一個」。伺服器卡住 2 秒時，工具也乖乖停了 2 秒，那 2 秒裡本來該送出、該排隊的請求根本沒被量到，結果的 p99 好看得不真實。真實的使用者不會等你。要用「固定到達速率」的方式產生流量，例如 k6 的 constant-arrival-rate、wrk2（第 4.4 課）。</li>
<li><b>不同機器的時鐘不能直接相減。</b>兩台機器的時鐘差個幾毫秒很正常，所以追蹤圖裡偶爾會看到子區段比上層區段「更早開始」。算時間差，只用同一台機器上量到的兩個時間點。</li>
<li><b>機房裡量到的，不是使用者感受到的。</b>從雲端機器跑 curl，網路又快又穩；真實使用者在捷運上用 4G。行動網路的無線電從省電狀態喚醒，就可能多出幾十到上百毫秒。要知道真實情況，得收集真實使用者瀏覽器的 Navigation Timing（真實使用者監控，real user monitoring，RUM）。</li>
<li><b>nginx 日誌裡的兩個時間。</b><code>$request_time</code> 從讀到用戶端第一個位元組，算到最後一個位元組送出為止，用戶端網路慢、下載慢，它就變大；<code>$upstream_response_time</code> 只算等後端的時間。兩個都記，<code>$request_time</code> 大而 <code>$upstream_response_time</code> 小，慢的是用戶端那一段；兩個一起大，慢的是後端。</li>
<li><b>「第一次」要分開看。</b>部署完、自動擴充剛開出新機器時，快取是空的、連線池是空的、JIT 還沒暖好。如果你的系統一天自動擴充幾十次，這些「第一次」就不是例外，而是使用者常常遇到的日常。</li>
</ul>

<h3>九、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>TTFB 高，就是後端程式寫得慢</td><td>TTFB 包含一個網路來回，也包含在負載平衡器、工作執行緒、連線池裡排隊的時間，還有 CDN 回原站的時間。要拆開量才知道。</td></tr>
<tr><td>平均回應時間正常，就沒事</td><td>平均會被大量的快請求稀釋。使用者感受到的是 p95、p99，以及扇出之後「最慢的那一個」。</td></tr>
<tr><td>CPU 才 30%，不可能是容量問題</td><td>瓶頸可能是連線池、執行緒池、一把鎖、一個單執行緒程序。看最窄那一個資源的使用率。</td></tr>
<tr><td>資料庫一次查詢才 2 毫秒，所以資料庫不是問題</td><td>要乘上查詢次數、加上跨可用區域的來回、加上等連線池的時間。</td></tr>
<tr><td>放了 CDN，網站一定變快</td><td>沒命中時多一段邊緣到原站的路。動態 API、設錯的快取標頭，都會讓 CDN 只是多一站。</td></tr>
<tr><td>curl 量一次就知道結果</td><td>第一次最慢，網路有抖動。跑五次看中位數，冷和熱分開量。</td></tr>
</table>

<h3>十、跟你的工作連起來</h3>
<ul>
<li><b>前端（Vue、TypeScript）</b>：API 在另一個網域，就在 HTML 裡對它 preconnect；所有連結直接指到最終網址，避免轉址；DevTools 的 Timing 分頁看 Server-Timing；用 PerformanceObserver 把真實使用者的時間送回來，而不是只相信自己電腦上的數字。</li>
<li><b>遊戲（Cocos、Unity）</b>：數一數登入流程的來回次數：登入、拿權杖、拿玩家資料、拿大廳列表，四個請求一個接一個，就是四個來回加四次伺服器時間，合併或並行常常能省下半秒；WebSocket 建立連線要 DNS、TCP、TLS，再加一個 HTTP 升級的來回，所以整場遊戲維持一條連線，不要動不動重連。</li>
<li><b>後端（Node.js、Go）</b>：確認對外呼叫都重用連線；連線池的大小和取得逾時要設、也要量；互不相干的呼叫用 <code>Promise.all</code> 或 errgroup 並行；裝上 OpenTelemetry，追蹤編號寫進每一行日誌。</li>
<li><b>Docker、雲端</b>：應用程式和資料庫放在同一個區域，最好同一個可用區域；負載平衡器到後端開 keep-alive；從同一個區域的機器量一次，就能把「網路」和「伺服器」分開；nginx 日誌同時記 <code>$request_time</code> 和 <code>$upstream_response_time</code>。</li>
</ul>

<h3>十一、面試會怎麼問</h3>
<p>先自己講一遍，最好出聲講，再打開參考答案。</p>
<ol>
<li>「使用者按下按鈕到看到結果，中間的時間花在哪裡？你會怎麼量每一段？」</li>
<li>「一個全新的 HTTPS 請求要幾個來回？TLS 1.3 和 HTTP/3 各省掉了什麼？」</li>
<li>「使用者說網站很慢，你會怎麼查？」</li>
<li>「TTFB 很高，可能是哪些原因？」</li>
<li>「p50 正常，p99 很高，你會懷疑什麼？」</li>
<li>「分散式追蹤怎麼把不同服務的資料串在一起？取樣要怎麼做？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>依序是：瀏覽器快取、DNS 解析、TCP 交握、TLS 交握、送出請求等第一個位元組（含 CDN、負載平衡器、應用程式、資料庫），最後是下載回應與瀏覽器渲染。外面用 curl -w 量 DNS、TCP、TLS、TTFB、總時間，相鄰相減；瀏覽器用 Navigation Timing 和 Resource Timing；伺服器內部用 Server-Timing 或指標；跨服務用分散式追蹤。前三站是每條新連線一次的成本，重用連線就能省掉。</li>
<li>DNS 之外，TCP 一個來回、TLS 1.3 一個來回（TLS 1.2 是兩個）、HTTP 請求一個來回，再加伺服器處理時間。TLS 1.3 把金鑰交換放進第一個訊息，少一個來回；恢復連線時還可以 0-RTT，但早到的資料可能被重播，只適合不改變狀態的請求。HTTP/3 跑在 QUIC 上，傳輸層和 TLS 的交握合成一個來回，所以新連線比 TCP 加 TLS 1.3 再少一個來回。</li>
<li>先把問題量化：哪個網址、哪些使用者、從何時開始、p50 和 p99 各是多少，並對照那個時間點的部署和設定變更。再從外面用 curl -w 判斷是網路那幾站還是伺服器那一側；如果是伺服器，就逐層繞過 CDN、負載平衡器，在機器上直接打應用程式，相減找出哪一站；應用程式內部用 Server-Timing 或追蹤找出是哪一個依賴，並區分「在做事」還是「在排隊等資源」，例如等連線池。找到後先止血，再根治，最後補上能更早發現的指標和警報。</li>
<li>它包含一個網路來回，所以距離遠本身就會讓它高；接著是 CDN 沒命中而回原站、負載平衡器或工作執行緒的排隊、應用程式自己的運算、垃圾回收或事件迴圈被阻塞、等連線池、資料庫查詢慢或次數太多、呼叫其他服務或第三方 API。用 Server-Timing、追蹤和「逐層跳過」的量法來區分。</li>
<li>尾端延遲。可能是某些請求的資料特別多（大客戶），排隊（使用率接近飽和時，佇列讓少數請求等很久），垃圾回收暫停，鎖競爭，冷啟動或新機器，某一台不健康的後端，或扇出時剛好撞到某個依賴的慢請求。用追蹤找出 p99 那些請求的共同點，看是否集中在某台機器、某個依賴或某種輸入。</li>
<li>入口產生一個追蹤編號，每個工作單位是一個區段，記錄開始、時長和上層區段；呼叫下游時，把編號和目前區段放進標準的 traceparent 標頭（訊息佇列則放進訊息的中繼資料）傳下去，各服務把區段送到同一個後端，依編號拼回瀑布圖。取樣有開頭取樣（入口決定、比例固定、便宜，但會丟掉多數慢請求）和結尾取樣（收集器等請求結束後依延遲、錯誤決定是否保留，貴但有價值），常見做法是兩者搭配。</li>
</ol>
</details>

<h3>十二、練功題（做得出來才算真的懂）</h3>
<ol>
<li>curl 印出：namelookup 0.012、connect 0.152、appconnect 0.297、starttransfer 0.471、total 0.492。算出 DNS、TCP、TLS 各花多久。這台伺服器大概離你多遠？扣掉網路來回，伺服器自己大概花了多久？</li>
<li>同一台伺服器，來回 35 毫秒，DNS 20 毫秒，伺服器處理 40 毫秒。分別算出：新連線用 TLS 1.2、新連線用 TLS 1.3、重用連線，三種情況到收到第一個位元組要多久。</li>
<li>連線池有 20 條連線，每次查詢佔用一條 25 毫秒。每秒最多能做幾次？如果流量是每秒 720 次，使用率是多少？依照 M/M/1 的曲線，平均回應時間大約是單次的幾倍？</li>
<li>一個頁面同時呼叫 20 個服務，每個服務都有 1% 的請求超過 1 秒。整頁超過 1 秒的機率大約多少？</li>
<li>冷啟動的使用者打 <code>http://example.com</code>，先被 301 到 <code>https://example.com</code>，再被 301 到 <code>https://www.example.com/</code>。假設沒有任何連線合併，和直接打最終網址相比，多付了幾次 DNS、幾個來回？</li>
<li>Server-Timing 寫著 <code>app;dur=50</code>，可是從用戶端量，TTFB 扣掉一個來回之後還有 900 毫秒。那 850 毫秒可能花在哪裡？列出三個可能，並說你會怎麼驗證。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>DNS 12 毫秒；TCP 0.152 − 0.012 = 140 毫秒；TLS 0.297 − 0.152 = 145 毫秒。一個來回大約 140 毫秒，大概是跨太平洋，例如台北到美西。伺服器自己 ≈ 0.471 − 0.297 − 0.140 = 34 毫秒。下載 21 毫秒。這個網站慢的是距離，不是程式：該考慮 CDN 或在亞洲開區域。</li>
<li>TLS 1.2：20 + 35（TCP）+ 70（TLS 兩個來回）+ 35（HTTP）+ 40 = 200 毫秒。TLS 1.3：20 + 35 + 35 + 35 + 40 = 165 毫秒。重用連線：35 + 40 = 75 毫秒。</li>
<li>20 ÷ 0.025 = 每秒 800 次。720 ÷ 800 = 90%。1 ÷（1 − 0.9）= 10，平均回應時間大約是單次的 10 倍，約 250 毫秒，而且流量再多一點就會失控。</li>
<li>1 − 0.99<sup>20</sup> ≈ 1 − 0.818 = 18.2%，大約每五次就有一次。</li>
<li>第一跳 http：DNS、TCP 1 個、HTTP 1 個。第二跳 https://example.com：埠號不同，要新連線，TCP、TLS、HTTP 共 3 個來回，DNS 已經快取。第三跳 www：新的主機名稱，DNS 一次，加 3 個來回。合計 2 次 DNS、8 個來回；直接打最終網址只要 1 次 DNS、3 個來回。多付了 1 次 DNS 和 5 個來回，在東京的例子裡大約多 195 毫秒。</li>
<li>可能是：(a) 請求在 handler 開始計時之前就在排隊，例如 nginx 或負載平衡器後面的工作執行緒全忙、Node.js 的事件迴圈被別的請求的同步運算卡住；(b) CDN 或負載平衡器回原站時開新連線、或原站很遠；(c) 回應在 handler 結束之後才慢，例如送出前還有沒被量到的中介層（壓縮、記錄）。驗證：用第七節的逐層繞過法相減；在最外層的中介層記下「請求抵達」的時間，和 handler 開始的時間比；看 nginx 的 <code>$upstream_response_time</code> 和事件迴圈延遲的指標。</li>
</ol>
</details>

<h3>十三、想再挖深</h3>
<ul>
<li><b>Daniel Stenberg《Everything curl》</b>（everything.curl.dev，免費線上書）：curl 作者自己寫的，<code>-w</code> 的每一個變數、<code>--resolve</code>、<code>--connect-to</code>、連線重用都有說明。</li>
<li><b>MDN Web Docs 的 Server-Timing 與 Resource Timing 頁面</b>（developer.mozilla.org）：標頭格式、瀏覽器支援、Timing-Allow-Origin 的規則。</li>
<li><b>OpenTelemetry 官方文件</b>（opentelemetry.io）與 <b>W3C Trace Context 規格</b>：追蹤的概念、各語言 SDK 的自動量測、traceparent 標頭的正式定義。</li>
<li><b>Jeffrey Dean 與 Luiz André Barroso〈The Tail at Scale〉</b>（Communications of the ACM，2013）：Google 解釋扇出為什麼會放大尾端延遲，以及他們怎麼對付它。很短，值得反覆讀。</li>
<li><b>Brendan Gregg《Systems Performance》</b>：效能分析的經典，排隊理論、方法論、從應用程式到核心的量測工具都有。</li>
</ul>
` });
