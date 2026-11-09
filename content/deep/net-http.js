DEEP({ 'net-http': `
<p>上一課給了你 HTTP 的骨架：請求與回應、狀態碼、無狀態、三個版本、快取標頭、WebSocket。這一章往下挖到線上的位元組和正式環境的事故：HTTP/1.1、HTTP/2、HTTP/3 到底差在哪裡，「多工」和「隊頭阻塞」是什麼意思；快取怎麼判斷一份回應還能不能用，<code>no-cache</code> 為什麼不是「不快取」；哪些方法可以放心重試，POST 被重送一次為什麼會讓玩家被扣兩次錢；狀態碼在維運裡怎麼告訴你錯在哪一層；WebSocket、SSE、長輪詢各適合什麼；最後是整條路上每一層的逾時怎麼互相影響，以及一個讓無數團隊莫名其妙收到 502 的經典陷阱。你每天寫的 <code>fetch</code>，都會經過這一章講的每一層。</p>

<h3><span class="badge lv1">基礎</span>一、HTTP/1.1 在線上長什麼樣子</h3>
<p>HTTP/1.1 真的就是一段文字。打開一條 TCP 連線，送出這幾行：</p>
<pre><code>GET /api/rooms?limit=20 HTTP/1.1
Host: game.example.com
Accept: application/json
Cookie: sid=9f2c41

</code></pre>
<p>最後那一行空白，代表標頭結束。伺服器回 <code>HTTP/1.1 200 OK</code>、幾行標頭、一行空白，然後是內容。用戶端怎麼知道內容在哪裡結束？靠兩種方法之一：<code>Content-Length: 1832</code> 先講好長度；或 <code>Transfer-Encoding: chunked</code>，一塊一塊送，每塊前面寫長度，最後送一塊長度 0 的代表結束。這件事看起來很無聊，第八節會看到它怎麼變成一個嚴重的漏洞。</p>
<p>HTTP/1.1 預設會保持連線（keep-alive），一個請求做完，下一個請求接著用同一條連線，省掉 TCP 和 TLS 的交握。但同一條連線上，<b>一次只能有一個請求在進行</b>。打個比方：銀行只有一個櫃台，前一位客人辦很久，後面的人就只能等，這叫<b>隊頭阻塞</b>（head-of-line blocking）。瀏覽器的對策是對同一個網站開大約 6 條連線，等於開 6 個櫃台。一個頁面要載 80 個小檔案時，還是得排隊。</p>
<figure class="figure"><svg viewBox="0 0 680 280" class="fg" style="width:100%;max-width:680px" role="img" aria-label="三個請求 A、B、C 在 HTTP/1.1 上排隊，在 HTTP/2 上交錯；HTTP/2 掉一個封包時全部卡住，HTTP/3 只有 A 等重送">
<text x="20" y="40" class="fg-t">HTTP/1.1</text>
<text x="20" y="56" class="fg-t sm">一次一個，排隊</text>
<rect x="180" y="24" width="156" height="30" rx="5" class="fg-b hot"/><text x="258" y="44" text-anchor="middle" class="fg-t sm">A 的回應</text>
<rect x="340" y="24" width="156" height="30" rx="5" class="fg-b alt"/><text x="418" y="44" text-anchor="middle" class="fg-t sm">B 的回應</text>
<rect x="500" y="24" width="156" height="30" rx="5" class="fg-b warm"/><text x="578" y="44" text-anchor="middle" class="fg-t sm">C 的回應</text>
<text x="20" y="100" class="fg-t">HTTP/2</text>
<text x="20" y="116" class="fg-t sm">交錯在一條連線上</text>
<rect x="180" y="84" width="36" height="30" rx="5" class="fg-b hot"/><text x="198" y="104" text-anchor="middle" class="fg-t mono">A</text>
<rect x="220" y="84" width="36" height="30" rx="5" class="fg-b alt"/><text x="238" y="104" text-anchor="middle" class="fg-t mono">B</text>
<rect x="260" y="84" width="36" height="30" rx="5" class="fg-b warm"/><text x="278" y="104" text-anchor="middle" class="fg-t mono">C</text>
<rect x="300" y="84" width="36" height="30" rx="5" class="fg-b hot"/><text x="318" y="104" text-anchor="middle" class="fg-t mono">A</text>
<rect x="340" y="84" width="36" height="30" rx="5" class="fg-b alt"/><text x="358" y="104" text-anchor="middle" class="fg-t mono">B</text>
<rect x="380" y="84" width="36" height="30" rx="5" class="fg-b warm"/><text x="398" y="104" text-anchor="middle" class="fg-t mono">C</text>
<rect x="420" y="84" width="36" height="30" rx="5" class="fg-b hot"/><text x="438" y="104" text-anchor="middle" class="fg-t mono">A</text>
<rect x="460" y="84" width="36" height="30" rx="5" class="fg-b alt"/><text x="478" y="104" text-anchor="middle" class="fg-t mono">B</text>
<rect x="500" y="84" width="36" height="30" rx="5" class="fg-b warm"/><text x="518" y="104" text-anchor="middle" class="fg-t mono">C</text>
<rect x="540" y="84" width="36" height="30" rx="5" class="fg-b hot"/><text x="558" y="104" text-anchor="middle" class="fg-t mono">A</text>
<rect x="580" y="84" width="36" height="30" rx="5" class="fg-b alt"/><text x="598" y="104" text-anchor="middle" class="fg-t mono">B</text>
<rect x="620" y="84" width="36" height="30" rx="5" class="fg-b warm"/><text x="638" y="104" text-anchor="middle" class="fg-t mono">C</text>
<text x="20" y="160" class="fg-t">HTTP/2 掉一個封包</text>
<text x="20" y="176" class="fg-t sm">TCP 照順序交，全部卡住</text>
<rect x="180" y="144" width="36" height="30" rx="5" class="fg-b hot"/><text x="198" y="164" text-anchor="middle" class="fg-t mono">A</text>
<rect x="220" y="144" width="36" height="30" rx="5" class="fg-b alt"/><text x="238" y="164" text-anchor="middle" class="fg-t mono">B</text>
<rect x="260" y="144" width="36" height="30" rx="5" class="fg-b warm"/><text x="278" y="164" text-anchor="middle" class="fg-t mono">C</text>
<rect x="300" y="144" width="36" height="30" rx="5" class="fg-b dash"/><text x="318" y="164" text-anchor="middle" class="fg-t warm">✕</text>
<rect x="340" y="144" width="116" height="30" rx="5" class="fg-b dash"/><text x="398" y="164" text-anchor="middle" class="fg-t sm warm">B、C 也得等</text>
<rect x="460" y="144" width="36" height="30" rx="5" class="fg-b hot"/><text x="478" y="164" text-anchor="middle" class="fg-t mono">A</text>
<rect x="500" y="144" width="36" height="30" rx="5" class="fg-b alt"/><text x="518" y="164" text-anchor="middle" class="fg-t mono">B</text>
<rect x="540" y="144" width="36" height="30" rx="5" class="fg-b warm"/><text x="558" y="164" text-anchor="middle" class="fg-t mono">C</text>
<rect x="580" y="144" width="36" height="30" rx="5" class="fg-b hot"/><text x="598" y="164" text-anchor="middle" class="fg-t mono">A</text>
<rect x="620" y="144" width="36" height="30" rx="5" class="fg-b alt"/><text x="638" y="164" text-anchor="middle" class="fg-t mono">B</text>
<text x="318" y="190" text-anchor="middle" class="fg-t sm warm">遺失</text>
<text x="478" y="190" text-anchor="middle" class="fg-t sm">重送</text>
<text x="20" y="220" class="fg-t">HTTP/3 掉一個封包</text>
<text x="20" y="236" class="fg-t sm">只有 A 等重送</text>
<rect x="180" y="204" width="36" height="30" rx="5" class="fg-b hot"/><text x="198" y="224" text-anchor="middle" class="fg-t mono">A</text>
<rect x="220" y="204" width="36" height="30" rx="5" class="fg-b alt"/><text x="238" y="224" text-anchor="middle" class="fg-t mono">B</text>
<rect x="260" y="204" width="36" height="30" rx="5" class="fg-b warm"/><text x="278" y="224" text-anchor="middle" class="fg-t mono">C</text>
<rect x="300" y="204" width="36" height="30" rx="5" class="fg-b dash"/><text x="318" y="224" text-anchor="middle" class="fg-t warm">✕</text>
<rect x="340" y="204" width="36" height="30" rx="5" class="fg-b alt"/><text x="358" y="224" text-anchor="middle" class="fg-t mono">B</text>
<rect x="380" y="204" width="36" height="30" rx="5" class="fg-b warm"/><text x="398" y="224" text-anchor="middle" class="fg-t mono">C</text>
<rect x="420" y="204" width="36" height="30" rx="5" class="fg-b hot"/><text x="438" y="224" text-anchor="middle" class="fg-t mono">A</text>
<rect x="460" y="204" width="36" height="30" rx="5" class="fg-b alt"/><text x="478" y="224" text-anchor="middle" class="fg-t mono">B</text>
<rect x="500" y="204" width="36" height="30" rx="5" class="fg-b warm"/><text x="518" y="224" text-anchor="middle" class="fg-t mono">C</text>
<rect x="540" y="204" width="36" height="30" rx="5" class="fg-b hot"/><text x="558" y="224" text-anchor="middle" class="fg-t mono">A</text>
<rect x="580" y="204" width="36" height="30" rx="5" class="fg-b alt"/><text x="598" y="224" text-anchor="middle" class="fg-t mono">B</text>
<rect x="620" y="204" width="36" height="30" rx="5" class="fg-b warm"/><text x="638" y="224" text-anchor="middle" class="fg-t mono">C</text>
<text x="318" y="250" text-anchor="middle" class="fg-t sm warm">遺失</text>
<text x="438" y="250" text-anchor="middle" class="fg-t sm">重送</text>
<line x1="180" y1="266" x2="652" y2="266" class="fg-l dim"/><polygon points="660,266 652,261.5 652,270.5" class="fg-a"/>
<text x="180" y="260" class="fg-t sm">時間</text>
</svg><figcaption>HTTP/2 把三個請求切成小塊交錯送，誰也不用等誰。可是底下的 TCP 只會照順序交資料：一個封包遺失，後面已經到的 B、C 也得等重送。HTTP/3 的每條資料流各自排序，只有 A 要等。</figcaption></figure>

<h3><span class="badge lv2">進階</span>二、HTTP/2 拆開來看：訊框、資料流、HPACK</h3>
<p>HTTP/2 不再是文字，而是二進位的<b>訊框</b>（frame）。每個訊框前面有 9 個位元組的標頭：長度、類型、旗標，以及它屬於哪一條<b>資料流</b>（stream）。一個請求和它的回應就是一條資料流，用戶端開的資料流編號是奇數：1、3、5…。因為每個訊框都標了資料流編號，不同請求的訊框可以在同一條連線上交錯，收到的一方再依編號拼回去，這就是<b>多工</b>（multiplexing）。</p>
<table>
<tr><th>訊框類型</th><th>做什麼</th></tr>
<tr><td>HEADERS</td><td>一個請求或回應的標頭（壓縮過）</td></tr>
<tr><td>DATA</td><td>內容</td></tr>
<tr><td>SETTINGS</td><td>連線參數，例如最多同時幾條資料流（伺服器常設 100 或 128）</td></tr>
<tr><td>WINDOW_UPDATE</td><td>流量控制：「我還收得下這麼多」，每條資料流和整條連線各有一個額度</td></tr>
<tr><td>RST_STREAM</td><td>取消某一條資料流，連線不受影響</td></tr>
<tr><td>GOAWAY</td><td>「我要關了，編號 N 之後的請求我沒處理」。優雅關機就靠它</td></tr>
<tr><td>PING</td><td>測延遲、保持連線</td></tr>
</table>
<h4>HPACK：為什麼第二個請求只要 6 個位元組</h4>
<p>同一個頁面發出的請求，標頭幾乎都一樣：同樣的網域、同樣的 User-Agent、同樣一長串 cookie。HTTP/1.1 每次都老老實實重送幾百個位元組。HTTP/2 用 <b>HPACK</b> 壓縮：雙方各自維護一張表，送過的標頭記進表裡，下次只送「表裡第幾號」。</p>
<figure class="figure"><svg viewBox="0 0 680 280" class="fg" style="width:100%;max-width:680px" role="img" aria-label="HPACK：第一個請求照字面送並記進動態表 62 到 65 號，第二個一樣的請求只送 82 87 c1 c0 bf be 六個位元組">
<rect x="20" y="20" width="250" height="200" rx="8" class="fg-b"/>
<text x="145" y="44" text-anchor="middle" class="fg-t">第一個請求</text>
<text x="34" y="70" class="fg-t sm">:method GET → 82（靜態表 2 號）</text>
<text x="34" y="92" class="fg-t sm">:scheme https → 87（靜態表 7 號）</text>
<text x="34" y="114" class="fg-t sm">:path /api/rooms → 照字面，記進表</text>
<text x="34" y="136" class="fg-t sm">:authority game… → 照字面，記進表</text>
<text x="34" y="158" class="fg-t sm">user-agent … → 照字面，記進表</text>
<text x="34" y="180" class="fg-t sm">cookie sid=9f2c41 → 照字面，記進表</text>
<text x="145" y="206" text-anchor="middle" class="fg-t sm warm">大約幾百個位元組</text>
<line x1="270" y1="120" x2="282" y2="120" class="fg-l"/><polygon points="290,120 282,115.5 282,124.5" class="fg-a"/>
<rect x="290" y="20" width="170" height="200" rx="8" class="fg-b alt"/>
<text x="375" y="44" text-anchor="middle" class="fg-t">動態表</text>
<rect x="302" y="58" width="146" height="30" rx="4" class="fg-b"/><text x="312" y="78" class="fg-t sm mono">62 cookie</text>
<rect x="302" y="94" width="146" height="30" rx="4" class="fg-b"/><text x="312" y="114" class="fg-t sm mono">63 user-agent</text>
<rect x="302" y="130" width="146" height="30" rx="4" class="fg-b"/><text x="312" y="150" class="fg-t sm mono">64 :authority</text>
<rect x="302" y="166" width="146" height="30" rx="4" class="fg-b"/><text x="312" y="186" class="fg-t sm mono">65 :path</text>
<text x="375" y="212" text-anchor="middle" class="fg-t sm">越晚加入，號碼越小</text>
<line x1="460" y1="120" x2="472" y2="120" class="fg-l"/><polygon points="480,120 472,115.5 472,124.5" class="fg-a"/>
<rect x="480" y="20" width="180" height="200" rx="8" class="fg-b hot"/>
<text x="570" y="44" text-anchor="middle" class="fg-t">第二個一樣的請求</text>
<text x="570" y="90" text-anchor="middle" class="fg-t lg mono">82 87 c1 c0 bf be</text>
<text x="496" y="124" class="fg-t sm">82、87：靜態表</text>
<text x="496" y="144" class="fg-t sm">c1：動態表 65 號</text>
<text x="496" y="164" class="fg-t sm">c0、bf、be：64、63、62</text>
<text x="570" y="200" text-anchor="middle" class="fg-t acc">只要 6 個位元組</text>
<text x="340" y="248" text-anchor="middle" class="fg-t sm">靜態表：61 個最常見的標頭，雙方內建。動態表：這條連線上送過的標頭。</text>
<text x="340" y="268" text-anchor="middle" class="fg-t sm">最高位元設成 1、後面接號碼，意思是「直接用表裡這一號」：0x80 ＋ 62 ＝ 0xbe</text>
</svg><figcaption>第一次照字面送，順便記進表；第二次只送號碼。標頭越長、請求越多，省得越多。對手機和遊戲這種一直打小 API 的情境，這是 HTTP/2 最實在的好處之一。</figcaption></figure>
<p>HPACK 的設計刻意避開了一般的壓縮演算法，因為 2012 年的 CRIME 攻擊證明：把祕密（cookie）和攻擊者能控制的內容放在一起壓縮，攻擊者可以從壓縮後的長度一個字一個字猜出祕密。所以 HPACK 只做「整條標頭的查表」，不做跨標頭的字串比對；特別敏感的標頭還可以標成「永不記進表」。</p>
<h4>HTTP/2 沒解決的事，交給 HTTP/3</h4>
<p>圖一的第三行說明了 HTTP/2 的天花板：多工發生在 TCP 之上，而 TCP 只會照順序交資料，一個封包遺失就卡住整條連線。在會掉封包的手機網路上，HTTP/2 有時甚至比開 6 條連線的 HTTP/1.1 還慢。<b>HTTP/3</b> 改走 <b>QUIC</b>：QUIC 跑在 UDP 上，自己做可靠傳輸，而且每條資料流各自排序；TLS 1.3 直接內建在 QUIC 的交握裡，所以傳輸和加密的交握合併成一個來回。QUIC 還用連線 ID（connection ID）而不是「IP ＋連接埠」來認連線，手機從 Wi-Fi 換到行動網路，連線不用重建。</p>
<p>維運上要注意三件事：防火牆和安全群組要開 <b>UDP 443</b>；很多企業網路會擋 UDP，瀏覽器會自動退回 HTTP/2，所以兩套都要能用；QUIC 在使用者空間處理封包，伺服器端的 CPU 成本通常比 TCP 高。瀏覽器是看到回應裡的 <code>Alt-Svc: h3=":443"</code>，下一次才改用 HTTP/3 的。</p>

<h3><span class="badge lv2">進階</span>三、快取：一份回應什麼時候還能用</h3>
<p>瀏覽器、CDN、反向代理都可以是快取。每一個快取拿到請求時，做的判斷都一樣：</p>
<figure class="figure"><svg viewBox="0 0 680 320" class="fg" style="width:100%;max-width:680px" role="img" aria-label="快取的判斷流程：沒有存就去源站拿；新鮮就直接回；過期但在 stale-while-revalidate 內就先回舊的再背景更新；否則帶 If-None-Match 去問源站，304 沿用、200 換新">
<rect x="30" y="16" width="200" height="50" rx="8" class="fg-b"/>
<text x="130" y="46" text-anchor="middle" class="fg-t">有存著這個回應嗎？</text>
<rect x="30" y="96" width="200" height="50" rx="8" class="fg-b"/>
<text x="130" y="117" text-anchor="middle" class="fg-t">還新鮮嗎？</text>
<text x="130" y="135" text-anchor="middle" class="fg-t sm">Age 小於 max-age</text>
<rect x="30" y="176" width="200" height="50" rx="8" class="fg-b"/>
<text x="130" y="197" text-anchor="middle" class="fg-t">過期了，但還在</text>
<text x="130" y="215" text-anchor="middle" class="fg-t sm mono">stale-while-revalidate 內？</text>
<rect x="30" y="256" width="200" height="50" rx="8" class="fg-b"/>
<text x="130" y="277" text-anchor="middle" class="fg-t">帶 If-None-Match</text>
<text x="130" y="295" text-anchor="middle" class="fg-t sm">回源站確認</text>
<line x1="130" y1="66" x2="130" y2="88" class="fg-l"/><polygon points="130,96 125.5,88 134.5,88" class="fg-a"/><text x="140" y="85" class="fg-t sm">有</text>
<line x1="130" y1="146" x2="130" y2="168" class="fg-l"/><polygon points="130,176 125.5,168 134.5,168" class="fg-a"/><text x="140" y="165" class="fg-t sm">不新鮮</text>
<line x1="130" y1="226" x2="130" y2="248" class="fg-l"/><polygon points="130,256 125.5,248 134.5,248" class="fg-a"/><text x="140" y="245" class="fg-t sm">超過了</text>
<line x1="230" y1="41" x2="322" y2="41" class="fg-l warm"/><polygon points="330,41 322,36.5 322,45.5" class="fg-a warm"/><text x="276" y="33" text-anchor="middle" class="fg-t sm">沒有</text>
<line x1="230" y1="121" x2="322" y2="121" class="fg-l on"/><polygon points="330,121 322,116.5 322,125.5" class="fg-a on"/><text x="276" y="113" text-anchor="middle" class="fg-t sm">新鮮</text>
<line x1="230" y1="201" x2="322" y2="201" class="fg-l alt"/><polygon points="330,201 322,196.5 322,205.5" class="fg-a alt"/><text x="276" y="193" text-anchor="middle" class="fg-t sm">還在</text>
<line x1="230" y1="281" x2="322" y2="281" class="fg-l"/><polygon points="330,281 322,276.5 322,285.5" class="fg-a"/>
<rect x="330" y="16" width="330" height="50" rx="8" class="fg-b warm"/>
<text x="346" y="37" class="fg-t">去源站拿，存起來</text>
<text x="346" y="55" class="fg-t sm">MISS：使用者等完整的一趟</text>
<rect x="330" y="96" width="330" height="50" rx="8" class="fg-b hot"/>
<text x="346" y="117" class="fg-t">直接回，完全不碰源站</text>
<text x="346" y="135" class="fg-t sm">HIT：回應帶著 Age 標頭，說它存了幾秒</text>
<rect x="330" y="176" width="330" height="50" rx="8" class="fg-b alt"/>
<text x="346" y="197" class="fg-t">先把舊的回給使用者</text>
<text x="346" y="215" class="fg-t sm">同時在背景去更新，下一位就拿到新的</text>
<rect x="330" y="256" width="330" height="50" rx="8" class="fg-b"/>
<text x="346" y="277" class="fg-t">304：內容沒變，沿用並重新計時</text>
<text x="346" y="295" class="fg-t sm">200：內容變了，換成新的</text>
</svg><figcaption>快取的每一個判斷都來自回應的標頭。新鮮的時候完全不碰源站；過期之後，先用 ETag 問「變了沒」，沒變只收一個很小的 304。</figcaption></figure>
<h4>Cache-Control 的每個指令</h4>
<table>
<tr><th>指令</th><th>意思</th><th>常被誤會成</th></tr>
<tr><td><code>max-age=60</code></td><td>60 秒內是新鮮的，可以直接用</td><td></td></tr>
<tr><td><code>s-maxage=300</code></td><td>只給 CDN 這類共用快取看的 max-age</td><td></td></tr>
<tr><td><code>no-cache</code></td><td><b>可以存</b>，但每次用之前都要回源站確認</td><td>不快取</td></tr>
<tr><td><code>no-store</code></td><td>完全不准存</td><td></td></tr>
<tr><td><code>private</code></td><td>只有使用者自己的瀏覽器能存，CDN 不能</td><td>加密</td></tr>
<tr><td><code>must-revalidate</code></td><td>過期之後一定要確認，不准拿舊的頂</td><td></td></tr>
<tr><td><code>immutable</code></td><td>內容永遠不變，重新整理時也不用確認</td><td></td></tr>
<tr><td><code>stale-while-revalidate=30</code></td><td>過期後 30 秒內，可以先回舊的、背景更新</td><td></td></tr>
<tr><td><code>stale-if-error=600</code></td><td>源站出錯時，10 分鐘內可以拿舊的頂著</td><td></td></tr>
</table>
<p>用 <code>Cache-Control: public, max-age=60, stale-while-revalidate=30</code> 實際走一次（CDN 上的排行榜 API）：</p>
<table>
<tr><th>時間</th><th>回應的年紀</th><th>CDN 怎麼做</th></tr>
<tr><td>0 秒</td><td>沒有</td><td>MISS，去源站拿，存起來</td></tr>
<tr><td>45 秒</td><td>45</td><td>HIT，帶 <code>Age: 45</code> 直接回</td></tr>
<tr><td>75 秒</td><td>75（過期 15 秒）</td><td>在 60 到 90 之間：先回舊的，背景去更新</td></tr>
<tr><td>如果 60 到 90 秒之間都沒人來，第 120 秒才有人來</td><td>120</td><td>超過 90：使用者要等 CDN 帶 <code>If-None-Match</code> 問完源站</td></tr>
</table>
<p>另外兩個驗證器：<b>ETag</b> 是內容的版本戳記，用戶端帶 <code>If-None-Match</code> 回來比對；<b>Last-Modified</b> 是修改時間，對應 <code>If-Modified-Since</code>。注意一個暗坑：回應<b>完全沒寫</b> Cache-Control、卻有 Last-Modified 時，快取可以自己估一個新鮮時間，常見的做法是「距離上次修改的 10%」。一個 10 天前改過的檔案，可能被默默快取一天。所以每個回應都該明確寫出快取政策。</p>
<h4>Vary：同一個網址，不同的版本</h4>
<p><code>Vary: Accept-Encoding</code> 告訴快取：gzip 版和 br 版要分開存。這是對的。但如果寫成 <code>Vary: User-Agent</code> 或 <code>Vary: Cookie</code>，每一種瀏覽器、每一個使用者都要存一份，命中率會掉到接近零。CDN 通常讓你自己定義快取鍵（cache key），只留真正會影響內容的部分。</p>
<h4>正式環境的標準做法</h4>
<ul>
<li><b>建置產出的靜態檔</b>（Vite、Cocos 建置出來帶雜湊的檔名，例如 <code>app.3f9a1c.js</code>）：<code>Cache-Control: public, max-age=31536000, immutable</code>。內容一變，檔名就變，所以可以永遠快取。</li>
<li><b>入口的 <code>index.html</code></b>：<code>no-cache</code>。每次都確認，新版一上線，使用者就拿到指向新檔名的 HTML。</li>
<li><b>跟使用者有關的 API</b>（<code>/api/me</code>、餘額）：<code>private, no-store</code>。CDN 把某個人的資料快取起來回給別人，是真實發生過很多次的資料外洩。</li>
</ul>

<h3><span class="badge lv2">進階</span>四、冪等：哪些請求可以放心重送</h3>
<p>網路會斷，回應會遺失。用戶端、代理、負載平衡器遇到逾時，都想重試。問題是：重送一次安全嗎？HTTP 規格把方法分成兩種性質。<b>安全</b>（safe）：不改變伺服器狀態，例如 GET、HEAD、OPTIONS。<b>冪等</b>（idempotent）：做一次和做十次，最後的狀態一樣，例如 PUT（把分數設成 42）、DELETE（刪掉第 7 號房）。POST 和 PATCH 兩者都不是：「加 10 分」做兩次就是加 20 分。</p>
<p>這不只是理論。nginx 從 1.9.13 起，請求已經送到後端之後，<b>不會</b>把 POST、PATCH 這類非冪等的請求自動轉給下一台後端重試，就是怕重複執行。可是用戶端自己的重試、玩家狂按按鈕、手機網路斷了又連，都還是會造成重送。看一次最典型的事故：</p>
<figure class="figure"><svg viewBox="0 0 680 300" class="fg" style="width:100%;max-width:680px" role="img" aria-label="用戶端送出帶冪等鍵的 POST，伺服器建立訂單 1001 但回應遺失；用戶端逾時後用同一個鍵重送，伺服器查到做過了，直接回同一筆訂單">
<rect x="20" y="10" width="140" height="34" rx="6" class="fg-b alt"/><text x="90" y="32" text-anchor="middle" class="fg-t">用戶端</text>
<rect x="380" y="10" width="140" height="34" rx="6" class="fg-b alt"/><text x="450" y="32" text-anchor="middle" class="fg-t">伺服器</text>
<line x1="90" y1="44" x2="90" y2="268" class="fg-l dim"/>
<line x1="450" y1="44" x2="450" y2="268" class="fg-l dim"/>
<line x1="90" y1="80" x2="442" y2="80" class="fg-l alt"/><polygon points="450,80 442,75.5 442,84.5" class="fg-a alt"/>
<text x="270" y="72" text-anchor="middle" class="fg-t sm mono">POST /orders　Idempotency-Key: 7c1e</text>
<rect x="470" y="60" width="200" height="44" rx="6" class="fg-b"/>
<text x="480" y="78" class="fg-t sm">建立訂單 #1001</text>
<text x="480" y="96" class="fg-t sm">記下：7c1e → #1001</text>
<line x1="450" y1="130" x2="250" y2="130" class="fg-l warm dash"/>
<text x="238" y="135" text-anchor="middle" class="fg-t warm">✕</text>
<text x="350" y="122" text-anchor="middle" class="fg-t sm warm">201 在路上遺失</text>
<text x="100" y="168" class="fg-t sm warm">等不到回應，逾時</text>
<line x1="90" y1="200" x2="442" y2="200" class="fg-l alt"/><polygon points="450,200 442,195.5 442,204.5" class="fg-a alt"/>
<text x="270" y="192" text-anchor="middle" class="fg-t sm">重送：同一個 Idempotency-Key: 7c1e</text>
<rect x="470" y="180" width="200" height="44" rx="6" class="fg-b hot"/>
<text x="480" y="198" class="fg-t sm">查到 7c1e 做過了</text>
<text x="480" y="216" class="fg-t sm">不再建立，拿出 #1001</text>
<line x1="450" y1="248" x2="98" y2="248" class="fg-l on"/><polygon points="90,248 98,243.5 98,252.5" class="fg-a on"/>
<text x="270" y="240" text-anchor="middle" class="fg-t sm acc">201 訂單 #1001（同一筆）</text>
<text x="340" y="290" text-anchor="middle" class="fg-t sm warm">沒有冪等鍵的話，第二次 POST 會建立 #1002：同一個玩家被扣兩次</text>
</svg><figcaption>用戶端分不出「伺服器沒收到」和「伺服器做完了、只是回應遺失」。冪等鍵讓重送變安全：伺服器記住每個鍵的結果，同一個鍵再來，只回同一份答案。</figcaption></figure>
<p>實作冪等鍵的要點：</p>
<ul>
<li>鍵由<b>用戶端</b>產生（例如 <code>crypto.randomUUID()</code>），一次「使用者意圖」一個鍵，重試時沿用同一個，下一次新的操作才換。</li>
<li>伺服器用資料庫的<b>唯一索引</b>擋重複，而不是「先查有沒有、再寫入」，否則兩個同時到的重送會一起通過檢查。</li>
<li>同一個鍵的第一個請求還在處理時，第二個進來，回 409 叫它稍後再試。</li>
<li>存下結果（狀態碼和內容），保留一段時間，例如 24 小時。</li>
</ul>
<p>能設計成冪等的操作，就直接設計成冪等：「把第 3 局的結果設為 HIGHER」比「送出一次猜測」更好重試；「扣款，交易編號 T123」比「扣 100 元」安全。</p>

<h3><span class="badge lv3">專業</span>五、狀態碼在維運裡：先問「這是誰回的」</h3>
<p>同一個 502，可能是 CDN 回的、負載平衡器回的、nginx 回的，也可能是應用程式自己回的。排查的第一步永遠是：<b>這個狀態碼是哪一層產生的？</b>看回應標頭（<code>Server</code>、<code>Via</code>、CDN 的追蹤 ID）和每一層的日誌就知道。上一課的表之外，正式環境還會遇到這些：</p>
<table>
<tr><th>狀態碼</th><th>誰常回</th><th>通常代表</th></tr>
<tr><td>499</td><td>nginx 自己的代碼</td><td>用戶端等不及，先關了連線。大量出現代表後端太慢，或用戶端逾時設太短。AWS ALB 的 460 意思類似</td></tr>
<tr><td>413</td><td>nginx</td><td>請求內容太大。nginx 的 <code>client_max_body_size</code> 預設只有 1m，上傳頭像就撞到</td></tr>
<tr><td>414、431</td><td>代理或伺服器</td><td>網址太長、標頭太大（常見是 cookie 越積越多）</td></tr>
<tr><td>421</td><td>伺服器</td><td>請求送錯主機。HTTP/2 會讓多個網域共用一條連線，設定不一致時會遇到</td></tr>
<tr><td>425</td><td>伺服器</td><td>TLS 0-RTT 的早期資料，等交握完成再送</td></tr>
<tr><td>429、503</td><td>限流、過載保護</td><td>應該帶 <code>Retry-After</code>，告訴用戶端幾秒後再來</td></tr>
</table>
<p>nginx 的錯誤日誌會把 502 和 504 講得很清楚，背下這三句：</p>
<ul>
<li><code>connect() failed (111: Connection refused) while connecting to upstream</code>：後端沒在聽那個連接埠。程式掛了，或還在啟動。</li>
<li><code>upstream prematurely closed connection while reading response header from upstream</code>：後端接了請求，回應前就把連線關了。程式當掉，或被系統的記憶體不足機制（OOM killer）殺掉。</li>
<li><code>upstream timed out (110: Connection timed out) while reading response header from upstream</code>：504，後端活著但太慢。</li>
</ul>
<p>存取日誌再加上這幾個變數，延遲問題就能一眼分層：<code>$request_time</code>（整個請求）、<code>$upstream_connect_time</code>（連到後端花多久）、<code>$upstream_header_time</code>（後端多久開始回）、<code>$upstream_response_time</code>（後端整個回完）、<code>$upstream_addr</code>（哪一台後端）。<code>request_time</code> 遠大於 <code>upstream_response_time</code>，慢的是用戶端那一段網路；<code>upstream_connect_time</code> 變大，代表後端忙到連新連線都接不太進來；只有某一個 <code>upstream_addr</code> 特別慢，就是那一台機器的問題。</p>

<h3><span class="badge lv3">專業</span>六、即時推送：長輪詢、SSE、WebSocket</h3>
<p>HTTP 原本是「用戶端問、伺服器答」，伺服器沒辦法主動開口。要讓伺服器即時把消息推給用戶端，有三種做法：</p>
<figure class="figure"><svg viewBox="0 20 680 252" class="fg" style="width:100%;max-width:680px" role="img" aria-label="三種即時推送的時間軸：長輪詢每次事件後重發請求，SSE 是一個不結束的回應持續送事件，WebSocket 升級後雙向隨時都能送">
<text x="20" y="54" class="fg-t">長輪詢</text>
<text x="20" y="70" class="fg-t sm">long polling</text>
<rect x="150" y="44" width="168" height="24" rx="5" class="fg-b"/><text x="234" y="61" text-anchor="middle" class="fg-t sm">請求掛著，等事件</text>
<rect x="324" y="44" width="146" height="24" rx="5" class="fg-b"/><text x="397" y="61" text-anchor="middle" class="fg-t sm">再發一個，再等</text>
<rect x="476" y="44" width="164" height="24" rx="5" class="fg-b"/><text x="558" y="61" text-anchor="middle" class="fg-t sm">再發一個，再等</text>
<line x1="158" y1="44" x2="158" y2="38" class="fg-l alt"/><polygon points="158,30 153.5,38 162.5,38" class="fg-a alt"/>
<line x1="332" y1="44" x2="332" y2="38" class="fg-l alt"/><polygon points="332,30 327.5,38 336.5,38" class="fg-a alt"/>
<line x1="484" y1="44" x2="484" y2="38" class="fg-l alt"/><polygon points="484,30 479.5,38 488.5,38" class="fg-a alt"/>
<line x1="310" y1="68" x2="310" y2="74" class="fg-l on"/><polygon points="310,82 305.5,74 314.5,74" class="fg-a on"/>
<line x1="462" y1="68" x2="462" y2="74" class="fg-l on"/><polygon points="462,82 457.5,74 466.5,74" class="fg-a on"/>
<line x1="632" y1="68" x2="632" y2="74" class="fg-l on"/><polygon points="632,82 627.5,74 636.5,74" class="fg-a on"/>
<text x="20" y="134" class="fg-t">SSE</text>
<text x="20" y="150" class="fg-t sm">伺服器單向推</text>
<rect x="150" y="124" width="490" height="24" rx="5" class="fg-b alt"/><text x="395" y="141" text-anchor="middle" class="fg-t sm">一個回應，一直不結束</text>
<line x1="158" y1="124" x2="158" y2="118" class="fg-l alt"/><polygon points="158,110 153.5,118 162.5,118" class="fg-a alt"/>
<line x1="250" y1="148" x2="250" y2="154" class="fg-l on"/><polygon points="250,162 245.5,154 254.5,154" class="fg-a on"/>
<line x1="320" y1="148" x2="320" y2="154" class="fg-l on"/><polygon points="320,162 315.5,154 324.5,154" class="fg-a on"/>
<line x1="470" y1="148" x2="470" y2="154" class="fg-l on"/><polygon points="470,162 465.5,154 474.5,154" class="fg-a on"/>
<line x1="560" y1="148" x2="560" y2="154" class="fg-l on"/><polygon points="560,162 555.5,154 564.5,154" class="fg-a on"/>
<text x="20" y="214" class="fg-t">WebSocket</text>
<text x="20" y="230" class="fg-t sm">雙向</text>
<rect x="150" y="204" width="46" height="24" rx="5" class="fg-b warm"/><text x="173" y="221" text-anchor="middle" class="fg-t sm">101</text>
<rect x="200" y="204" width="440" height="24" rx="5" class="fg-b hot"/><text x="420" y="221" text-anchor="middle" class="fg-t sm">同一條連線，兩邊隨時都能送</text>
<line x1="158" y1="204" x2="158" y2="198" class="fg-l alt"/><polygon points="158,190 153.5,198 162.5,198" class="fg-a alt"/>
<line x1="260" y1="204" x2="260" y2="198" class="fg-l alt"/><polygon points="260,190 255.5,198 264.5,198" class="fg-a alt"/>
<line x1="380" y1="204" x2="380" y2="198" class="fg-l alt"/><polygon points="380,190 375.5,198 384.5,198" class="fg-a alt"/>
<line x1="540" y1="204" x2="540" y2="198" class="fg-l alt"/><polygon points="540,190 535.5,198 544.5,198" class="fg-a alt"/>
<line x1="300" y1="228" x2="300" y2="234" class="fg-l on"/><polygon points="300,242 295.5,234 304.5,234" class="fg-a on"/>
<line x1="340" y1="228" x2="340" y2="234" class="fg-l on"/><polygon points="340,242 335.5,234 344.5,234" class="fg-a on"/>
<line x1="470" y1="228" x2="470" y2="234" class="fg-l on"/><polygon points="470,242 465.5,234 474.5,234" class="fg-a on"/>
<line x1="600" y1="228" x2="600" y2="234" class="fg-l on"/><polygon points="600,242 595.5,234 604.5,234" class="fg-a on"/>
<text x="395" y="264" text-anchor="middle" class="fg-t sm">藍色向上：用戶端送出　　綠色向下：伺服器送來</text>
</svg><figcaption>長輪詢每收到一個事件就得重發一次請求；SSE 是一個永遠不結束的回應，伺服器一有事就寫一段；WebSocket 先升級，之後同一條連線兩邊都能隨時說話。</figcaption></figure>
<table>
<tr><th></th><th>長輪詢</th><th>SSE</th><th>WebSocket</th></tr>
<tr><td>方向</td><td>伺服器推（靠一直重問）</td><td>只有伺服器推</td><td>雙向</td></tr>
<tr><td>底層</td><td>普通 HTTP 請求</td><td>普通 HTTP 回應，<code>Content-Type: text/event-stream</code></td><td>HTTP 升級後換成自己的訊框</td></tr>
<tr><td>斷線重連</td><td>自己寫</td><td>瀏覽器的 <code>EventSource</code> 自動重連，還會帶 <code>Last-Event-ID</code> 接續</td><td>自己寫（退避加隨機抖動）</td></tr>
<tr><td>二進位資料</td><td>可以</td><td>只能文字</td><td>可以</td></tr>
<tr><td>過代理、防火牆</td><td>最容易</td><td>容易，但要關掉緩衝</td><td>代理要特別設定</td></tr>
<tr><td>適合</td><td>舊環境的退路、事件很少</td><td>通知、進度條、排行榜、AI 逐字輸出</td><td>遊戲、聊天、協作編輯</td></tr>
</table>
<p>SSE 很常被低估。伺服器只要寫這種純文字，瀏覽器就會一則一則觸發事件：</p>
<pre><code>id: 1042
event: score
data: {"round": 7, "result": "HIGHER"}

</code></pre>
<p>空行代表一則結束。用戶端斷線後，<code>EventSource</code> 會自動重連，並在標頭帶上 <code>Last-Event-ID: 1042</code>，伺服器從下一則接著送。兩個常見的坑：中間的 nginx 預設會把回應緩衝起來，一則都送不出去，要對這個位置關掉 <code>proxy_buffering</code>，或由後端回 <code>X-Accel-Buffering: no</code>；另外，壓縮的中介軟體也會囤資料，要確認它會即時送出。在 HTTP/1.1 上，每個 SSE 連線佔掉瀏覽器對同一網站 6 條連線的其中一條；換成 HTTP/2 就沒有這個問題。</p>
<h4>WebSocket 經過反向代理</h4>
<p>WebSocket 的升級靠 <code>Upgrade</code> 和 <code>Connection</code> 兩個標頭，而這兩個是「逐跳」（hop-by-hop）的標頭：代理預設不會往後轉。所以 nginx 一定要明講：</p>
<pre><code>map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
server {
    location /ws/ {
        proxy_pass http://game_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_read_timeout 120s;   # 要比心跳間隔長
    }
}</code></pre>
<p>少了前兩行 <code>proxy_set_header</code>，用戶端會收到普通的 HTTP 回應而不是 101，瀏覽器的 <code>onclose</code> 只給你一個 1006。<code>proxy_read_timeout</code> 預設 60 秒，後端 60 秒沒送任何東西，nginx 就把連線切掉；所以心跳要比它短，或把它調長。訊框的位元組格式、ping／pong 與關閉代碼，Cocos 課程「跟伺服器對話」那一章的深入圖解拆得很細，這裡不重複。</p>

<h3><span class="badge lv3">專業</span>七、逾時：每一層都有一個碼表</h3>
<p>一個請求從玩家的手機到資料庫，會經過五、六層，<b>每一層都有自己的逾時</b>，而且預設值各不相同：</p>
<figure class="figure"><svg viewBox="0 0 680 290" class="fg" style="width:100%;max-width:680px" role="img" aria-label="每一層的逾時長度比較：瀏覽器 fetch 預設沒有上限，CDN 常見 100 秒，負載平衡器 60 秒，nginx 60 秒，應用程式應設 30 秒，資料庫查詢應設 25 秒">
<text x="190" y="38" text-anchor="end" class="fg-t">瀏覽器 fetch</text>
<rect x="200" y="20" width="440" height="26" rx="5" class="fg-b dash"/><text x="420" y="38" text-anchor="middle" class="fg-t sm">預設沒有上限，要自己加</text>
<text x="190" y="74" text-anchor="end" class="fg-t">CDN 到源站</text>
<rect x="200" y="56" width="440" height="26" rx="5" class="fg-b"/><text x="630" y="74" text-anchor="end" class="fg-t sm">常見 100 秒</text>
<text x="190" y="110" text-anchor="end" class="fg-t">負載平衡器閒置</text>
<rect x="200" y="92" width="264" height="26" rx="5" class="fg-b"/><text x="454" y="110" text-anchor="end" class="fg-t sm">60 秒</text>
<text x="190" y="146" text-anchor="end" class="fg-t">nginx proxy_read</text>
<rect x="200" y="128" width="264" height="26" rx="5" class="fg-b"/><text x="454" y="146" text-anchor="end" class="fg-t sm">60 秒</text>
<text x="190" y="182" text-anchor="end" class="fg-t">應用程式處理</text>
<rect x="200" y="164" width="132" height="26" rx="5" class="fg-b hot"/><text x="322" y="182" text-anchor="end" class="fg-t sm">30 秒</text>
<text x="190" y="218" text-anchor="end" class="fg-t">資料庫查詢</text>
<rect x="200" y="200" width="110" height="26" rx="5" class="fg-b hot"/><text x="300" y="218" text-anchor="end" class="fg-t sm">25 秒</text>
<line x1="200" y1="244" x2="640" y2="244" class="fg-l dim"/>
<line x1="200" y1="240" x2="200" y2="248" class="fg-l"/><text x="200" y="262" text-anchor="middle" class="fg-t sm">0</text>
<line x1="310" y1="240" x2="310" y2="248" class="fg-l"/><text x="310" y="262" text-anchor="middle" class="fg-t sm">25</text>
<line x1="464" y1="240" x2="464" y2="248" class="fg-l"/><text x="464" y="262" text-anchor="middle" class="fg-t sm">60</text>
<line x1="640" y1="240" x2="640" y2="248" class="fg-l"/><text x="640" y="262" text-anchor="middle" class="fg-t sm">100 秒</text>
<text x="420" y="282" text-anchor="middle" class="fg-t sm acc">越往裡面越短：裡面的人先放棄，外面才收得到有意義的錯誤</text>
</svg><figcaption>綠色兩條是你該自己設的：應用程式和資料庫查詢的逾時，要比外面每一層都短。外面幾層用的是常見的預設值，實際數字以你用的服務為準。</figcaption></figure>
<h4>規則一：請求的逾時，越裡面越短</h4>
<p>反過來設會怎樣？假設資料庫沒設逾時，一個查詢卡了 70 秒。第 60 秒，nginx 放棄，回使用者 504；可是應用程式和資料庫完全不知道，那個查詢繼續跑到第 70 秒，結果沒人要了。使用者看到錯誤，按了重試，又一個 70 秒的查詢開始跑。尖峰時段，資料庫就被一堆「沒人在等的查詢」塞滿。裡面那層先逾時，就能早點放掉資源，並回一個說得清楚的錯誤。</p>
<p>更進一步的做法是<b>傳遞截止時間</b>（deadline propagation）：入口算好「這個請求最晚幾點要回」，往下呼叫時帶著剩下的時間，每一層只能用剩下的。gRPC 內建這個機制；在 Node.js 可以把同一個 <code>AbortSignal</code> 一路傳下去，Go 則用 <code>context.WithTimeout</code>。</p>
<h4>規則二：重試會相乘</h4>
<p>用戶端重試 3 次，API 閘道重試 3 次，服務呼叫下游再重試 3 次：一個失敗的請求，最底層會被打 3 × 3 × 3 ＝ 27 次。下游越是快撐不住，收到的請求就越多。重試只放在一層（通常是最外面或最靠近失敗的那一層），加上退避和隨機抖動，並設定「重試預算」，例如重試不能超過正常請求量的 10%。</p>
<h4>規則三：閒置連線的逾時剛好相反，後端要比較長</h4>
<p>這是本章最值得帶走的一個陷阱。負載平衡器和後端之間會保持連線、重複使用。兩邊各有一個「閒置多久就關掉」的計時器。AWS ALB 預設 60 秒；Node.js 的 <code>server.keepAliveTimeout</code> 預設只有 <b>5 秒</b>。追一次會發生什麼事：</p>
<table>
<tr><th>時間</th><th>發生什麼事</th></tr>
<tr><td>0 秒</td><td>ALB 透過一條連線送了一個請求，Node.js 回完，連線閒置</td></tr>
<tr><td>5 秒</td><td>Node.js 覺得閒太久，關掉連線（送出 FIN）</td></tr>
<tr><td>5.001 秒</td><td>FIN 還在路上，ALB 剛好挑這條「它以為還活著」的連線送新請求</td></tr>
<tr><td>5.002 秒</td><td>Node.js 那邊連線已經關了，回 RST；ALB 對使用者回 <b>502</b></td></tr>
</table>
<p>症狀是：流量不大、日誌裡找不到任何錯誤，卻每天零星出現幾十個 502。修法是讓<b>後端的閒置逾時比負載平衡器長</b>，由負載平衡器負責關連線：</p>
<pre><code>const server = http.createServer(app);
server.keepAliveTimeout = 65_000;   // 比 ALB 的 60 秒長
server.headersTimeout   = 66_000;   // 要比 keepAliveTimeout 再長一點
server.listen(8080);</code></pre>
<p>Go 的 <code>http.Server</code> 則是另一個極端：<code>ReadTimeout</code>、<code>WriteTimeout</code>、<code>IdleTimeout</code> 預設全都是 0，代表沒有上限；<code>http.DefaultClient</code> 也沒有逾時，一個卡住的外部 API 可以讓你的 goroutine 永遠等下去。在 Go 裡，自己建 <code>http.Client{Timeout: 10 * time.Second}</code>，伺服器至少設 <code>ReadHeaderTimeout</code>，是基本功。</p>

<h3><span class="badge lv4">專家</span>八、少有人看過的角落</h3>
<h4>請求走私：兩層對「請求在哪裡結束」意見不同</h4>
<p>回到第一節的 <code>Content-Length</code> 和 <code>Transfer-Encoding: chunked</code>。如果一個請求<b>兩個都帶</b>，而前面的代理相信其中一個、後面的伺服器相信另一個，雙方對「這個請求在哪裡結束」就有了不同的看法。攻擊者讓多出來的那一截，被後端當成「下一個請求的開頭」，接在另一個使用者的請求前面。結果可能是偷到別人的 cookie、繞過前端的存取控制，或污染快取。這叫 <b>HTTP 請求走私</b>（request smuggling），2019 年後被大量研究和利用。防法：前後端用同一套解析規則、拒絕同時帶兩種長度的請求、代理到後端盡量用 HTTP/2，並保持軟體更新。</p>
<h4>HTTP/2 Rapid Reset：取消也要錢</h4>
<p>2023 年 10 月公開的 CVE-2023-44487：攻擊者在一條 HTTP/2 連線上開一條資料流，立刻送 RST_STREAM 取消，再開下一條，不斷重複。因為取消了，「同時最多幾條資料流」的限制永遠撞不到；可是伺服器每一條都得開始處理。Google 當時觀察到每秒 3.98 億個請求的攻擊，創下紀錄。修補方式是限制每條連線取消資料流的速率，超過就送 GOAWAY 斷線。這是協定設計的教訓：每一個「便宜的用戶端動作」，都要確認它對伺服器也一樣便宜。</p>
<h4>Slowloris：慢，也是一種攻擊</h4>
<p>攻擊者開幾千條連線，每條每隔十幾秒才送一個標頭位元組，永遠不送完。一個「每條連線一條執行緒」的伺服器，很快就被這些慢吞吞的連線佔滿。nginx 這種事件驅動的伺服器比較不怕，但仍要靠 <code>client_header_timeout</code>、<code>client_body_timeout</code>（預設都是 60 秒）把它們踢掉。這也是為什麼正式環境的應用程式伺服器，前面幾乎都會擋一層 nginx 或負載平衡器：讓它去應付慢的、壞的用戶端。</p>
<h4>連線合併與 421</h4>
<p>瀏覽器有一個最佳化：如果 <code>api.example.com</code> 和 <code>www.example.com</code> 解析到同一個 IP，而且已經開著的那條 HTTP/2 連線所用的憑證兩個名字都涵蓋（例如萬用字元憑證），它就直接共用那條連線。如果你的伺服器其實是依 SNI 分到不同的後端或設定，請求就會送錯地方。正確的伺服器在這種情況要回 <b>421 Misdirected Request</b>，瀏覽器就會另開一條連線。看到「只有某些瀏覽器、只有在先開了另一個子網域之後才出錯」，就想想這個。</p>

<h3>九、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td><code>no-cache</code> 就是不快取</td><td>它可以存，只是每次用前都要確認。不准存的是 <code>no-store</code>。</td></tr>
<tr><td>HTTP/2 一定比 HTTP/1.1 快</td><td>在會掉封包的網路上，單一 TCP 連線的隊頭阻塞可能讓它更慢。這正是 HTTP/3 存在的原因。</td></tr>
<tr><td>GET 一定安全，可以隨便重試</td><td>規格說 GET 應該是安全的，但程式寫成 <code>GET /logout</code> 或 <code>GET /delete?id=7</code> 的話，規格救不了你。</td></tr>
<tr><td>504 代表應用程式掛了</td><td>掛了通常是 502。504 是活著但太慢，去看它在等什麼。</td></tr>
<tr><td>WebSocket 一定比 SSE 好</td><td>只需要伺服器推送時，SSE 更簡單：純 HTTP、自動重連、自動接續。</td></tr>
<tr><td>逾時設長一點比較保險</td><td>太長的逾時讓卡住的請求佔著資源，還會被重試放大。裡層要比外層短。</td></tr>
<tr><td>後端的 keep-alive 逾時越短越省資源</td><td>比負載平衡器短，就會出現零星的 502。後端要比負載平衡器長。</td></tr>
</table>

<h3>十、跟你的工作連起來</h3>
<ul>
<li><b>前端（Vue、TypeScript）</b>：建置出來帶雜湊的檔案設成永久快取、<code>index.html</code> 設 <code>no-cache</code>，就不會再有「使用者要清快取才看得到新版」。<code>fetch</code> 沒有預設逾時，用 <code>AbortSignal.timeout(8000)</code>。送出訂單、扣點數這類操作，在用戶端產生冪等鍵。</li>
<li><b>遊戲（Cocos、Unity）</b>：大廳、排行榜、商城這種「讀多寫少」的資料用 HTTP 加快取；對局中的即時同步用 WebSocket。手機網路常掉封包，伺服器支援 HTTP/3 的話，Web 版的載入會明顯受益。</li>
<li><b>後端（Node.js、Go）</b>：記得 <code>keepAliveTimeout</code> 大於負載平衡器的閒置逾時；Go 一定自己設 <code>http.Client</code> 和 <code>http.Server</code> 的逾時；資料庫查詢設 <code>statement_timeout</code>；非冪等的 API 支援冪等鍵。</li>
<li><b>Docker 與雲端伺服器</b>：nginx 的存取日誌加上 upstream 的時間欄位；SSE、WebSocket 的路徑分別處理緩衝和逾時；開 HTTP/3 時記得安全群組要放行 UDP 443。</li>
</ul>

<h3>十一、面試會怎麼問</h3>
<p>這幾題在前端、後端、DevOps 面試裡都很常見。先自己講一遍，再看參考答案。</p>
<ol>
<li>「HTTP/1.1、HTTP/2、HTTP/3 的主要差別是什麼？HTTP/2 解決了什麼、沒解決什麼？」</li>
<li>「<code>no-cache</code> 和 <code>no-store</code> 差在哪？你會怎麼設定一個 SPA 的快取？」</li>
<li>「什麼是冪等？為什麼重要？要讓建立訂單的 POST 可以安全重試，你會怎麼做？」</li>
<li>「服務掛在 ALB 後面，流量不大卻零星出現 502，後端日誌沒有錯誤。你會懷疑什麼？」</li>
<li>「即時通知功能，你會選長輪詢、SSE 還是 WebSocket？為什麼？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>HTTP/1.1 是文字協定，一條連線一次只處理一個請求，瀏覽器靠開約 6 條連線並行。HTTP/2 改成二進位訊框，多個請求的訊框在一條連線上多工，並用 HPACK 壓縮標頭；但它跑在 TCP 上，一個封包遺失會讓整條連線上所有資料流一起等，也就是 TCP 層的隊頭阻塞。HTTP/3 跑在 QUIC（UDP）上，每條資料流獨立排序，遺失只影響那一條；TLS 1.3 內建在 QUIC 交握，建連更快，連線 ID 也讓網路切換時不用重連。</li>
<li><code>no-cache</code> 允許存，但每次使用前都要向源站確認（用 ETag 換 304）；<code>no-store</code> 完全不准存。SPA 的做法：建置產出帶雜湊檔名的 JS、CSS 設 <code>public, max-age=31536000, immutable</code>；<code>index.html</code> 設 <code>no-cache</code>；跟使用者有關的 API 設 <code>private, no-store</code>，避免被 CDN 快取給別人。</li>
<li>冪等是做一次和做多次，最後狀態一樣。重要是因為網路不可靠，用戶端分不出「沒送到」和「做完但回應遺失」，一定會重試。讓 POST 安全重試：用戶端為每次操作產生冪等鍵放在標頭，重試沿用；伺服器用唯一索引記錄鍵與結果，重複的鍵直接回存下的結果，處理中的重複請求回 409；結果保留一段時間。</li>
<li>懷疑閒置連線的競態：後端的 keep-alive 逾時比 ALB 的閒置逾時（預設 60 秒）短，例如 Node.js 預設 5 秒。後端關掉閒置連線的同時，ALB 剛好用它送新請求，收到重置就回 502。修法是把後端的閒置逾時設得比 ALB 長（例如 65 秒），Node.js 的 <code>headersTimeout</code> 再設得比它長。</li>
<li>看需求方向與環境。只需要伺服器推送（通知、進度、排行榜）時選 SSE：純 HTTP、瀏覽器自動重連並用 <code>Last-Event-ID</code> 接續、容易過代理，記得關掉代理緩衝。需要高頻雙向、二進位資料（遊戲、聊天）時選 WebSocket，代價是要自己處理重連、心跳和代理設定。長輪詢留給連 SSE 都過不去的老舊環境，或事件非常少的情境。</li>
</ol>
</details>

<h3>十二、練功題（做得出來才算真的懂）</h3>
<ol>
<li>一個回應帶 <code>Cache-Control: public, max-age=120, stale-while-revalidate=60</code>。CDN 在第 0 秒存下它。分別說出第 100 秒、第 150 秒、第 200 秒（假設 120 到 180 秒之間沒人來）有人請求時，CDN 會怎麼做。</li>
<li>HPACK 裡，第一個請求依序把 <code>:path</code>、<code>:authority</code>、<code>user-agent</code>、<code>cookie</code> 加進動態表。如果第一個請求還多送了一個 <code>x-client-version</code> 標頭（排在最後、也記進表），第二個一樣的請求裡，<code>cookie</code> 會變成哪個位元組？</li>
<li>用 <code>curl -v</code> 打一個你自己的 API 兩次，第二次帶上第一次拿到的 ETag：<code>curl -v -H 'If-None-Match: "…"' 網址</code>。你應該看到什麼狀態碼？如果還是 200，可能是哪裡的設定有問題？</li>
<li>你的服務架構是：CDN（100 秒）→ ALB（閒置 60 秒）→ nginx（<code>proxy_read_timeout</code> 60 秒）→ Node.js → PostgreSQL（沒設 <code>statement_timeout</code>）。列出所有你會改的逾時設定和理由。</li>
<li>找出這段 nginx 設定為什麼讓 SSE 「要等很久才一次收到一大堆事件」：<code>location /events { proxy_pass http://app; }</code>。怎麼修？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>第 100 秒：年紀 100，小於 120，新鮮，直接 HIT。第 150 秒：過期 30 秒，還在 60 秒的寬限內，先回舊的，同時在背景回源站更新。第 200 秒：年紀 200，超過 120 ＋ 60 ＝ 180，不能再拿舊的頂，要先帶 <code>If-None-Match</code> 問源站，使用者要等這一趟；源站回 304 就沿用並重新計時，回 200 就換新的。</li>
<li>多了一筆最新的 <code>x-client-version</code>，它拿到 62 號，其他全部往後推一號：cookie 變 63、user-agent 64、:authority 65、:path 66。cookie 的位元組是 0x80 ＋ 63 ＝ 0xbf。</li>
<li>應該看到 <code>304 Not Modified</code>，而且沒有內容。如果還是 200，可能是：後端每次產生不同的 ETag（例如多台伺服器的檔案修改時間不同）；中間的壓縮把強 ETag 改成弱 ETag 或拿掉了；回應是動態產生的，根本沒實作條件請求；或你帶的值少了引號。</li>
<li>PostgreSQL 設 <code>statement_timeout</code>，例如 25 秒；Node.js 的請求處理加整體逾時，例如 30 秒，並把 <code>AbortSignal</code> 傳到資料庫和下游呼叫；nginx 的 <code>proxy_read_timeout</code> 維持 60 秒，大於應用程式的逾時；Node.js 的 <code>keepAliveTimeout</code> 設 65 秒、<code>headersTimeout</code> 66 秒，大於 ALB 的 60 秒閒置逾時；用戶端的 fetch 加上逾時，並只在一層做帶退避的重試。</li>
<li>nginx 預設開著 <code>proxy_buffering</code>，會把後端的回應囤到緩衝區滿了才往外送，SSE 的小事件就被囤住。修法：在這個 location 加 <code>proxy_buffering off;</code>、<code>proxy_http_version 1.1;</code>、<code>proxy_set_header Connection "";</code>，並把 <code>proxy_read_timeout</code> 設得比伺服器送心跳（或註解行）的間隔長；或由後端在回應裡加 <code>X-Accel-Buffering: no</code>。</li>
</ol>
</details>

<h3>十三、想再挖深</h3>
<ul>
<li><b>Ilya Grigorik《High Performance Browser Networking》</b>（<a href="https://hpbn.co/">hpbn.co</a>，可免費線上閱讀）：TCP、TLS、HTTP/1.1、HTTP/2、WebSocket、SSE 的效能全貌，寫給工程師看的經典。</li>
<li><b>MDN 的 HTTP 文件</b>（<a href="https://developer.mozilla.org/en-US/docs/Web/HTTP">developer.mozilla.org</a>）：快取、條件請求、每個狀態碼和標頭都有清楚的說明與範例。</li>
<li><b>RFC 9110 與 RFC 9111</b>（<a href="https://www.rfc-editor.org/rfc/rfc9110">rfc-editor.org</a>）：HTTP 語意與快取的現行規格。方法的安全與冪等、狀態碼、快取的新鮮度計算，原文都在這兩份。</li>
<li><b>Daniel Stenberg《HTTP/3 explained》</b>（curl 的作者寫的免費小書）：QUIC 為什麼這樣設計、和 HTTP/2 差在哪，讀一個晚上就懂。</li>
<li><b>PortSwigger Web Security Academy 的 HTTP request smuggling 單元</b>：免費的線上實驗室，親手做一次請求走私，才會真的理解第八節。</li>
</ul>
` });
