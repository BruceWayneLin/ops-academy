DEEP({ 'net-tls': `
<p>上一課講了 TLS 的三件工作：加密、防竄改、證明身分，也講了憑證鏈和「憑證會過期」。模組 0 的密碼學那一章（第 0.15 課）則把底下的零件拆過了：雜湊、AEAD、簽章、Diffie-Hellman、前向保密。這一章把零件組回去，看它們在一條真實的連線裡怎麼合作：TLS 1.3 交握的每一則訊息各帶了什麼；用戶端驗憑證鏈時到底一項一項查什麼；一個 IP 位址怎麼同時服務幾十個網站（SNI），又怎麼順便講好要用 HTTP/2（ALPN）；重連時怎麼省掉一個來回，以及 0-RTT 為什麼會讓同一個請求被執行兩次；憑證怎麼全自動簽發（ACME）；撤銷為什麼一直不太管用；服務之間怎麼用 mTLS 互相驗明正身；最後是正式環境最常見的錯誤設定，和你該怎麼親手把它們測出來。TLS 出問題時，錯誤訊息常常只有一行 <code>handshake failure</code>。讀懂這一章，你就知道該從哪一步開始查。</p>

<h3><span class="badge lv1">基礎</span>一、TLS 夾在哪裡：路上的人看得到什麼</h3>
<p>TLS 夾在 TCP 和 HTTP 中間。TCP 負責把位元組可靠、照順序地送到對面；TLS 在上面加一層密封；HTTP 完全不知道底下被加密了，照樣送它的 <code>GET /api/score</code>。打個比方：你寄一封掛號信，郵差一定要看得到信封上的地址才送得到，所以地址是明文；信封裡寫什麼，只有收件人拆得開。</p>
<figure class="figure"><svg viewBox="0 0 660 250" class="fg" style="width:100%;max-width:660px" role="img" aria-label="一個 HTTPS 封包由外往內是 IP、TCP、TLS 紀錄、加密的 HTTP；右邊列出路上的人看得到和看不到的東西">
<rect x="20" y="20" width="300" height="214" rx="8" class="fg-b"/>
<text x="32" y="40" class="fg-t sm">IP 標頭：來源、目的位址</text>
<rect x="36" y="50" width="268" height="174" rx="7" class="fg-b"/>
<text x="48" y="70" class="fg-t sm">TCP 標頭：連接埠 443、序號</text>
<rect x="52" y="80" width="236" height="134" rx="6" class="fg-b alt"/>
<text x="64" y="100" class="fg-t sm">TLS 紀錄標頭：類型、長度</text>
<rect x="68" y="110" width="204" height="94" rx="5" class="fg-b hot"/>
<text x="170" y="134" text-anchor="middle" class="fg-t acc">加密的 HTTP</text>
<text x="170" y="155" text-anchor="middle" class="fg-t sm mono">GET /api/score</text>
<text x="170" y="174" text-anchor="middle" class="fg-t sm">標頭、cookie、內容</text>
<text x="170" y="193" text-anchor="middle" class="fg-t sm">＋16 位元組驗證標籤</text>
<rect x="350" y="20" width="290" height="102" rx="8" class="fg-b warm"/>
<text x="366" y="44" class="fg-t warm">路上的人看得到</text>
<text x="366" y="66" class="fg-t sm">IP 位址、連接埠</text>
<text x="366" y="85" class="fg-t sm">封包的大小、送出的時間</text>
<text x="366" y="104" class="fg-t sm">SNI：要連的主機名稱（除非開了 ECH）</text>
<rect x="350" y="132" width="290" height="102" rx="8" class="fg-b hot"/>
<text x="366" y="156" class="fg-t acc">路上的人看不到</text>
<text x="366" y="178" class="fg-t sm">網址的路徑和查詢字串</text>
<text x="366" y="197" class="fg-t sm">標頭、cookie、內容</text>
<text x="366" y="216" class="fg-t sm">伺服器的憑證（TLS 1.3 起）</text>
</svg><figcaption>加密只包住最裡面那一層。IP 和 TCP 標頭要讓沿路的路由器讀，所以永遠是明文。TLS 1.3 連憑證都加密了，但 SNI 預設還是明文。</figcaption></figure>
<p>有兩件事要特別記住。第一，<b>IP 和 TCP 標頭永遠是明文</b>。你連到哪個位址、哪個連接埠，傳了多少位元組、什麼時候傳，路上的人都看得到。光看封包大小和時間，有時就猜得出你打開的是哪一個頁面，這叫流量分析（traffic analysis）。第二，<b>SNI 預設是明文</b>。用戶端在交握一開始就得說出主機名稱（第四節會講為什麼），所以就算全程 HTTPS，公司的防火牆或網路業者還是看得到你連的是 <code>api.example.com</code>。</p>
<h4>一則 TLS 紀錄長什麼樣子</h4>
<p>交握完成之後，TLS 把應用程式的資料切成一塊一塊的<b>紀錄</b>（record），每塊最多 16 KB。TLS 1.3 的一則紀錄是這樣：</p>
<table>
<tr><th>欄位</th><th>大小</th><th>內容</th></tr>
<tr><td>類型</td><td>1 位元組</td><td>一律寫 23（application data）。真正的類型藏在密文裡</td></tr>
<tr><td>舊版本號</td><td>2 位元組</td><td>一律寫 0x0303，看起來像 TLS 1.2（原因在第十節）</td></tr>
<tr><td>長度</td><td>2 位元組</td><td>後面密文的長度</td></tr>
<tr><td>密文</td><td>不定</td><td>AEAD 加密後的資料，加上 1 個位元組的真實類型</td></tr>
<tr><td>驗證標籤</td><td>16 位元組</td><td>AES-GCM 或 ChaCha20-Poly1305 的標籤，改一個位元就驗不過</td></tr>
</table>
<p>所以每一則紀錄的額外成本是 5 ＋ 1 ＋ 16 ＝ 22 個位元組。對一則 16 KB 的紀錄只有 0.13%，對一則 50 位元組的遊戲訊息就是 44%。加密本身很便宜，現代 CPU 有 AES 專用指令，一顆核心每秒能處理好幾 GB。真正貴的，是一開始的交握。</p>

<h3><span class="badge lv2">進階</span>二、TLS 1.3 交握：一則訊息一則訊息看</h3>
<p>假設用戶端和伺服器之間的來回時間（RTT）是 30 毫秒，TCP 已經連好了。整段交握只要一個來回：</p>
<figure class="figure"><svg viewBox="0 0 680 450" class="fg" style="width:100%;max-width:680px" role="img" aria-label="TLS 1.3 交握時序圖：用戶端送 ClientHello，伺服器在同一趟回 ServerHello、EncryptedExtensions、Certificate、CertificateVerify、Finished，用戶端再送 Finished 和第一個請求">
<rect x="40" y="10" width="140" height="34" rx="6" class="fg-b alt"/><text x="110" y="32" text-anchor="middle" class="fg-t">用戶端</text>
<rect x="500" y="10" width="140" height="34" rx="6" class="fg-b alt"/><text x="570" y="32" text-anchor="middle" class="fg-t">伺服器</text>
<line x1="110" y1="44" x2="110" y2="440" class="fg-l dim"/>
<line x1="570" y1="44" x2="570" y2="440" class="fg-l dim"/>
<text x="24" y="90" class="fg-t sm mono">0 ms</text>
<line x1="110" y1="86" x2="562" y2="86" class="fg-l alt"/><polygon points="570,86 562,81.5 562,90.5" class="fg-a alt"/>
<text x="340" y="78" text-anchor="middle" class="fg-t mono">ClientHello</text>
<text x="340" y="102" text-anchor="middle" class="fg-t sm">隨機數、SNI、ALPN、支援的套件、key_share（公鑰）</text>
<line x1="570" y1="140" x2="118" y2="140" class="fg-l"/><polygon points="110,140 118,135.5 118,144.5" class="fg-a"/>
<text x="340" y="132" text-anchor="middle" class="fg-t mono">ServerHello</text>
<text x="340" y="156" text-anchor="middle" class="fg-t sm">選定 TLS_AES_128_GCM_SHA256，附上自己的 key_share</text>
<rect x="130" y="170" width="420" height="26" rx="5" class="fg-b hot"/>
<text x="340" y="188" text-anchor="middle" class="fg-t sm acc">兩邊各自算出共享祕密，以下全部加密</text>
<line x1="570" y1="226" x2="118" y2="226" class="fg-l"/><polygon points="110,226 118,221.5 118,230.5" class="fg-a"/>
<text x="340" y="218" text-anchor="middle" class="fg-t mono">{EncryptedExtensions}</text>
<text x="340" y="242" text-anchor="middle" class="fg-t sm">ALPN 的答案：h2</text>
<line x1="570" y1="274" x2="118" y2="274" class="fg-l"/><polygon points="110,274 118,269.5 118,278.5" class="fg-a"/>
<text x="340" y="266" text-anchor="middle" class="fg-t mono">{Certificate}</text>
<text x="340" y="290" text-anchor="middle" class="fg-t sm">憑證鏈：葉憑證＋中繼憑證</text>
<line x1="570" y1="322" x2="118" y2="322" class="fg-l"/><polygon points="110,322 118,317.5 118,326.5" class="fg-a"/>
<text x="340" y="314" text-anchor="middle" class="fg-t mono">{CertificateVerify}</text>
<text x="340" y="338" text-anchor="middle" class="fg-t sm">用私鑰簽下整段交握的雜湊</text>
<line x1="570" y1="370" x2="118" y2="370" class="fg-l"/><polygon points="110,370 118,365.5 118,374.5" class="fg-a"/>
<text x="340" y="362" text-anchor="middle" class="fg-t mono">{Finished}</text>
<text x="340" y="386" text-anchor="middle" class="fg-t sm">整段交握的 HMAC</text>
<path d="M584 128 H594 V378 H584" class="fg-l"/>
<text x="602" y="248" class="fg-t sm">同一趟</text>
<text x="602" y="266" class="fg-t sm">送出</text>
<text x="24" y="422" class="fg-t sm mono">30 ms</text>
<line x1="110" y1="418" x2="562" y2="418" class="fg-l on"/><polygon points="570,418 562,413.5 562,422.5" class="fg-a on"/>
<text x="340" y="410" text-anchor="middle" class="fg-t mono">{Finished} ＋ GET /</text>
<text x="340" y="434" text-anchor="middle" class="fg-t sm">驗完憑證和簽章，請求跟著送出</text>
</svg><figcaption>大括號代表已經加密。伺服器在同一趟裡送出 ServerHello 到 Finished；用戶端收到後送出自己的 Finished，順便帶上第一個請求。從開始到送出請求，剛好一個來回。</figcaption></figure>
<p>逐則來看：</p>
<ol>
<li><b>ClientHello</b>（明文）：用戶端一口氣把所有選項攤開。裡面有 32 個位元組的隨機數、支援的加密套件（cipher suite），以及一串擴充欄位（extension）。TLS 1.3 的套件只剩 5 種，常見的是 <code>TLS_AES_128_GCM_SHA256</code>、<code>TLS_AES_256_GCM_SHA384</code>、<code>TLS_CHACHA20_POLY1305_SHA256</code>。</li>
<li><b>ServerHello</b>（明文）：伺服器挑一個套件，送回自己的隨機數和 key_share。到這裡，兩邊都有了對方的臨時公鑰，各自用 ECDHE 算出同一個共享祕密，就是第 0.15 課的顏料實驗。</li>
<li>從這一刻起<b>全部加密</b>。兩邊用 HKDF，從共享祕密和「到目前為止所有訊息的雜湊」推導出交握用的金鑰，兩個方向各一把。</li>
<li><b>EncryptedExtensions</b>：其他不影響金鑰計算的回答，例如 ALPN 選了哪個協定。</li>
<li><b>Certificate</b>：伺服器的憑證鏈。TLS 1.2 時它是明文，路上的人看得到你拿的是哪個網站的憑證；1.3 把它包進了加密裡。</li>
<li><b>CertificateVerify</b>：伺服器用憑證對應的私鑰，<b>簽下到目前為止整段交握的雜湊</b>。這一步把「跟我約金鑰的人」和「憑證上的那個名字」綁在一起。中間人沒有私鑰，簽不出來。</li>
<li><b>Finished</b>：用一把從交握祕密推出來的金鑰，對整段交握算 HMAC。任何一則訊息在路上被動過手腳，兩邊算出來就對不上，連線立刻中止。</li>
<li>用戶端驗完憑證鏈和簽章，送出自己的 <b>Finished</b>，同一趟就帶上第一個 HTTP 請求。</li>
</ol>
<table>
<tr><th>ClientHello 的擴充欄位</th><th>放什麼</th><th>出事時的症狀</th></tr>
<tr><td><code>server_name</code>（SNI）</td><td>要連的主機名稱</td><td>拿到別的網站的憑證，名稱不符</td></tr>
<tr><td><code>supported_versions</code></td><td>支援的 TLS 版本</td><td>雙方沒有交集：<code>protocol version</code> 錯誤</td></tr>
<tr><td><code>supported_groups</code>、<code>key_share</code></td><td>支援哪些金鑰交換方式；先猜一種，直接附上公鑰</td><td>猜錯就多一個來回（見下面）</td></tr>
<tr><td><code>signature_algorithms</code></td><td>接受哪些簽章演算法</td><td>伺服器的憑證用了對方不接受的演算法：<code>handshake failure</code></td></tr>
<tr><td>ALPN</td><td>想講的協定，例如 h2、http/1.1</td><td>gRPC 連不上、HTTP/2 沒生效</td></tr>
<tr><td><code>pre_shared_key</code></td><td>上次拿到的票，用來恢復工作階段（第五節）</td><td>每次都做完整交握，CPU 偏高</td></tr>
</table>
<h4>為什麼 TLS 1.3 只要一個來回</h4>
<p>TLS 1.2 要兩個來回：第一趟先問「你支援什麼」，第二趟才交換金鑰。TLS 1.3 的關鍵是<b>用戶端先猜</b>：它直接在 ClientHello 裡附上 X25519 的公鑰，賭伺服器會接受。現在幾乎所有伺服器都支援 X25519，所以幾乎每次都猜中。猜錯時，伺服器回一則 <b>HelloRetryRequest</b>，說「請改用 P-256」，用戶端重送一次 ClientHello，就變成兩個來回。</p>
<p>用 RTT 30 毫秒，算一次「從開始連線到收到第一個回應位元組」要多久（不含 DNS）：</p>
<table>
<tr><th>情況</th><th>來回次數</th><th>大約時間</th></tr>
<tr><td>TCP ＋ TLS 1.2 ＋ HTTP 請求</td><td>1 ＋ 2 ＋ 1 ＝ 4</td><td>120 ms</td></tr>
<tr><td>TCP ＋ TLS 1.3 ＋ HTTP 請求</td><td>1 ＋ 1 ＋ 1 ＝ 3</td><td>90 ms</td></tr>
<tr><td>TCP ＋ TLS 1.3 0-RTT（請求跟著交握送）</td><td>1 ＋ 0 ＋ 1 ＝ 2</td><td>60 ms</td></tr>
<tr><td>QUIC（HTTP/3）0-RTT</td><td>1</td><td>30 ms</td></tr>
</table>
<p>手機網路的 RTT 常常是 50 到 150 毫秒。把這張表乘上去，就是使用者打開你的遊戲時真正在等的時間。</p>
<h4>親眼看一次</h4>
<pre><code>openssl s_client -connect example.com:443 -servername example.com &lt;/dev/null</code></pre>
<p>在 Linux 的 OpenSSL 3 上，找這幾行：<code>New, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384</code> 是談好的版本與套件，<code>Server Temp Key</code> 是金鑰交換方式，<code>Verify return code: 0 (ok)</code> 代表憑證鏈驗過了。Mac 內建的 <code>openssl</code> 其實是 LibreSSL，輸出格式略有不同。</p>

<h3><span class="badge lv2">進階</span>三、憑證鏈驗證：用戶端一項一項查什麼</h3>
<p>第 0.15 課講過信任鏈的概念：用上一層的公鑰驗下一層的簽章，一路驗到內建的根。實際上用戶端要做的事多得多，而且分兩個階段：先<b>建出一條路徑</b>，再<b>逐項檢查</b>。以一個 Let's Encrypt 簽發的網站為例：</p>
<figure class="figure"><svg viewBox="0 0 680 330" class="fg" style="width:100%;max-width:680px" role="img" aria-label="憑證鏈驗證：左邊是葉憑證、中繼 CA、根 CA 三層，右邊是每一層要檢查的九個項目">
<rect x="20" y="20" width="200" height="80" rx="8" class="fg-b alt"/>
<text x="120" y="44" text-anchor="middle" class="fg-t">葉憑證</text>
<text x="120" y="64" text-anchor="middle" class="fg-t sm mono">game.example.com</text>
<text x="120" y="84" text-anchor="middle" class="fg-t sm">簽發者：R11</text>
<line x1="120" y1="125" x2="120" y2="108" class="fg-l on"/><polygon points="120,100 115.5,108 124.5,108" class="fg-a on"/>
<text x="132" y="117" class="fg-t sm acc">驗章</text>
<rect x="20" y="125" width="200" height="80" rx="8" class="fg-b"/>
<text x="120" y="149" text-anchor="middle" class="fg-t">中繼 CA：R11</text>
<text x="120" y="169" text-anchor="middle" class="fg-t sm">簽發者：ISRG Root X1</text>
<text x="120" y="189" text-anchor="middle" class="fg-t sm">伺服器跟著葉一起送</text>
<line x1="120" y1="230" x2="120" y2="213" class="fg-l on"/><polygon points="120,205 115.5,213 124.5,213" class="fg-a on"/>
<text x="132" y="222" class="fg-t sm acc">驗章</text>
<rect x="20" y="230" width="200" height="80" rx="8" class="fg-b hot"/>
<text x="120" y="254" text-anchor="middle" class="fg-t acc">根：ISRG Root X1</text>
<text x="120" y="274" text-anchor="middle" class="fg-t sm">早就裝在用戶端的</text>
<text x="120" y="294" text-anchor="middle" class="fg-t sm">信任清單裡</text>
<line x1="220" y1="60" x2="250" y2="60" class="fg-l dim dash"/>
<line x1="220" y1="165" x2="250" y2="165" class="fg-l dim dash"/>
<line x1="220" y1="270" x2="250" y2="270" class="fg-l dim dash"/>
<rect x="250" y="20" width="410" height="80" rx="8" class="fg-b"/>
<text x="266" y="44" class="fg-t">① 名字：game.example.com 有在 SAN 裡</text>
<text x="266" y="64" class="fg-t">② 日期：現在介於 notBefore 和 notAfter 之間</text>
<text x="266" y="84" class="fg-t">③ 用途：EKU 含 serverAuth，而且附有 CT 證明</text>
<rect x="250" y="125" width="410" height="80" rx="8" class="fg-b"/>
<text x="266" y="149" class="fg-t">④ 用中繼 CA 的公鑰，驗葉憑證的簽章</text>
<text x="266" y="169" class="fg-t">⑤ 中繼必須是 CA：basicConstraints CA=TRUE</text>
<text x="266" y="189" class="fg-t">⑥ 中繼自己的日期、路徑長度、名稱限制</text>
<rect x="250" y="230" width="410" height="80" rx="8" class="fg-b"/>
<text x="266" y="254" class="fg-t">⑦ 用根的公鑰，驗中繼憑證的簽章</text>
<text x="266" y="274" class="fg-t">⑧ 根在本機的信任清單裡：路徑成立</text>
<text x="266" y="294" class="fg-t warm">⑨ 任何一項沒過，整條鏈都不算數</text>
</svg><figcaption>先從葉往上，建出一條接到信任清單的路徑，再逐項檢查。名字和用途只看葉憑證；「是不是 CA」看上面每一層；簽章則是每一層都用上一層的公鑰來驗。</figcaption></figure>
<h4>名字怎麼比對</h4>
<ul>
<li>只看 <b>SAN</b>（Subject Alternative Name）欄位。舊憑證把名字寫在 CN（Common Name），Chrome 從 2017 年起就不看 CN 了。自己產生測試憑證時，只填 CN 的會被瀏覽器拒絕。</li>
<li>萬用字元（wildcard）<code>*.example.com</code> 只蓋<b>一層</b>：<code>api.example.com</code> 可以；<code>example.com</code> 本身不行；<code>a.b.example.com</code> 也不行。所以常見的寫法是一張憑證同時列 <code>example.com</code> 和 <code>*.example.com</code>。</li>
<li>名稱比對不分大小寫。用 IP 位址連線時，SAN 裡要有 IP 類型的那個位址，寫成網域名稱的不算。</li>
</ul>
<h4>路徑不只一條：2021 年 9 月 30 日那一天</h4>
<p>同一張中繼憑證可以被兩個不同的根簽過，這叫交叉簽署（cross-signing）。新的 CA 靠它讓舊裝置也信任自己，Let's Encrypt 早年就是靠老牌的 DST Root CA X3 交叉簽署起家的。2021 年 9 月 30 日，DST Root CA X3 到期。新的裝置走另一條路徑接到 ISRG Root X1，沒事；但一些老舊系統和 OpenSSL 1.0.2 這類舊函式庫，建路徑時硬是走那條已經過期的路。於是一夜之間，大量舊伺服器上的 <code>curl</code>、API 呼叫、IoT 裝置全部報「憑證過期」，可是網站自己的憑證明明好好的。</p>
<p>教訓有兩個：<b>「我的憑證沒過期」不代表「整條鏈在對方眼裡都沒過期」</b>；而且信任清單裝在用戶端，你的伺服器說了不算。</p>
<h4>最常見的三種失敗</h4>
<table>
<tr><th>情況</th><th>典型的錯誤訊息</th><th>修法</th></tr>
<tr><td>伺服器少送中繼憑證</td><td>Node.js：<code>unable to verify the first certificate</code>；OpenSSL：<code>unable to get local issuer certificate</code></td><td>設定完整的鏈：certbot 的 <code>fullchain.pem</code>，不是 <code>cert.pem</code></td></tr>
<tr><td>用戶端的信任清單裡沒有那個根</td><td>Go：<code>x509: certificate signed by unknown authority</code></td><td>容器映像檔要裝根憑證清單；內部 CA 要明確加進信任清單</td></tr>
<tr><td>主機的時鐘錯了</td><td><code>certificate is not yet valid</code> 或過期</td><td>確認 NTP 有在跑。虛擬機從快照還原後特別常見</td></tr>
</table>
<p>第一種最陰險，因為瀏覽器打得開：瀏覽器會自己去抓缺少的中繼憑證，或早就快取過了，Node.js、Go、curl 卻不會補。第二種在 Docker 裡特別常見：用 <code>scratch</code> 這類精簡映像檔打包 Go 程式，映像檔裡根本沒有根憑證清單。另外，Node.js 預設用<b>它自己內建</b>的根憑證清單，不是作業系統的；要信任公司內部的 CA，用環境變數 <code>NODE_EXTRA_CA_CERTS</code> 指向那張根憑證。</p>

<h3><span class="badge lv2">進階</span>四、SNI 與 ALPN：一個位址，很多網站、很多協定</h3>
<p>一台 nginx 只有一個公開 IP，卻要服務 www、api、admin 三個網站，各有各的憑證。問題來了：TLS 交握發生在 HTTP 之前，伺服器還沒看到 <code>Host</code> 標頭，它怎麼知道該拿哪一張憑證出來？答案就是 ClientHello 裡的 SNI。同一則 ClientHello 裡的 ALPN，則順便講好這條連線要講哪一種 HTTP。</p>
<figure class="figure"><svg viewBox="0 0 680 250" class="fg" style="width:100%;max-width:680px" role="img" aria-label="用戶端的 ClientHello 帶著 SNI 和 ALPN 送到同一個 IP 上的 nginx，nginx 依 SNI 從三張憑證中挑出 api.example.com，依 ALPN 選了 h2">
<rect x="20" y="60" width="190" height="110" rx="8" class="fg-b alt"/>
<text x="115" y="86" text-anchor="middle" class="fg-t mono">ClientHello</text>
<text x="115" y="110" text-anchor="middle" class="fg-t sm mono">SNI: api.example.com</text>
<text x="115" y="130" text-anchor="middle" class="fg-t sm mono">ALPN: h2, http/1.1</text>
<text x="115" y="150" text-anchor="middle" class="fg-t sm">（同一則訊息裡）</text>
<line x1="210" y1="115" x2="252" y2="115" class="fg-l alt"/><polygon points="260,115 252,110.5 252,119.5" class="fg-a alt"/>
<rect x="260" y="50" width="170" height="130" rx="8" class="fg-b hot"/>
<text x="345" y="76" text-anchor="middle" class="fg-t acc">nginx</text>
<text x="345" y="96" text-anchor="middle" class="fg-t sm mono">203.0.113.10:443</text>
<text x="345" y="120" text-anchor="middle" class="fg-t sm">① 看 SNI 挑憑證</text>
<text x="345" y="140" text-anchor="middle" class="fg-t sm">② 看 ALPN 挑協定</text>
<text x="345" y="160" text-anchor="middle" class="fg-t sm">→ 選 h2</text>
<rect x="490" y="20" width="170" height="46" rx="6" class="fg-b"/>
<text x="575" y="48" text-anchor="middle" class="fg-t sm mono">www.example.com</text>
<rect x="490" y="92" width="170" height="46" rx="6" class="fg-b hot"/>
<text x="575" y="112" text-anchor="middle" class="fg-t sm mono">api.example.com</text>
<text x="575" y="129" text-anchor="middle" class="fg-t sm acc">選中這一張</text>
<rect x="490" y="164" width="170" height="46" rx="6" class="fg-b warm"/>
<text x="575" y="184" text-anchor="middle" class="fg-t sm">預設 server 的憑證</text>
<text x="575" y="201" text-anchor="middle" class="fg-t sm">沒有 SNI 時拿到這張</text>
<line x1="430" y1="115" x2="482" y2="115" class="fg-l on"/><polygon points="490,115 482,110.5 482,119.5" class="fg-a on"/>
<line x1="430" y1="80" x2="490" y2="43" class="fg-l dim dash"/>
<line x1="430" y1="150" x2="490" y2="187" class="fg-l dim dash"/>
<text x="340" y="236" text-anchor="middle" class="fg-t sm">伺服器回：api 的憑證，加上 ALPN 的答案 h2，全部在同一個來回裡</text>
</svg><figcaption>SNI 和 ALPN 都放在 ClientHello 裡，伺服器在加密開始之前，就知道要拿哪一張憑證、講哪一種 HTTP。直接用 IP 連的工具不送 SNI，拿到的就是預設那一張。</figcaption></figure>
<ul>
<li><b>沒有 SNI 的連線</b>拿到預設的那一張。瀏覽器都會送 SNI，但很多工具不會自動送：直接用 IP 連、某些健康檢查、很舊的 Java 或 Python 程式。症狀是「瀏覽器正常，監控卻說憑證名稱不符」。</li>
<li>要測某一台後端，又要帶對的 SNI，用 curl 的 <code>--resolve</code>：<code>curl --resolve api.example.com:443:203.0.113.10 https://api.example.com/healthz</code>。它把名稱硬指到那個 IP，SNI 和 Host 都照名稱送，不必改 DNS。</li>
<li>不想讓陌生名稱（例如直接打 IP 的掃描器）拿到任何憑證，nginx 1.19.4 起可以在預設 server 裡寫 <code>ssl_reject_handshake on;</code>，交握直接拒絕，連你有哪些網域都不洩漏。</li>
</ul>
<h4>把 SNI 也藏起來：ECH</h4>
<p><b>ECH</b>（Encrypted Client Hello）的做法是：網站在 DNS 的 HTTPS 紀錄裡公布一把公鑰，瀏覽器用它把真正的 ClientHello（含真正的 SNI）加密，外層只寫一個 CDN 共用的公開名稱。Chrome 和 Firefox 都已支援。對維運的影響是：靠 SNI 做過濾或稽核的設備，會越來越看不到東西。</p>
<h4>ALPN：搭交握便車的協商</h4>
<p>用戶端在 ClientHello 裡列出「我會講 h2、http/1.1」，伺服器在 EncryptedExtensions 裡回答「那就 h2」。整個協商搭交握的便車，不多花一個來回。你會在這些地方撞到它：</p>
<ul>
<li><b>gRPC 一定要 h2。</b>中間某一層（舊的負載平衡器、沒開 HTTP/2 的 nginx）只回 http/1.1 的話，gRPC 用戶端會直接失敗。</li>
<li><b>HTTP/3 不是靠 TCP 上的 ALPN 宣告的</b>，因為它根本不走 TCP。伺服器先在 HTTP/2 的回應裡加 <code>Alt-Svc: h3=":443"</code> 標頭，或在 DNS 的 HTTPS 紀錄裡宣告，瀏覽器下次才改用 QUIC；QUIC 自己的 TLS 交握裡，ALPN 寫的是 h3。</li>
<li>用 <code>openssl s_client -alpn h2,http/1.1</code> 可以看伺服器選了什麼，輸出裡會有 <code>ALPN protocol: h2</code>。</li>
</ul>

<h3><span class="badge lv3">專業</span>五、重連更快：工作階段恢復與 0-RTT 的代價</h3>
<p>完整交握最貴的是兩件事：伺服器用私鑰簽章（花 CPU），以及傳送好幾 KB 的憑證鏈（花頻寬）。同一個用戶端過幾分鐘又連回來，全部重做一次很浪費。TLS 1.3 的做法是：交握完成後，伺服器送一張 <b>NewSessionTicket</b>（工作階段票，session ticket）給用戶端。票裡是用伺服器自己的票證金鑰（ticket key）加密過的「上次連線的祕密」，伺服器自己不用記任何東西。</p>
<p>下次連線時，用戶端在 ClientHello 的 <code>pre_shared_key</code> 欄位附上這張票。伺服器解得開，就跳過憑證和簽章，直接用票裡的祕密，再加上一次新的 ECDHE，推出這次的金鑰。還是一個來回，但便宜很多；而且因為做了新的 ECDHE，前向保密還在。</p>
<h4>0-RTT：連一個來回都不等</h4>
<p>既然用戶端手上已經有共享的祕密，何不在 ClientHello 同一趟就把 HTTP 請求送出去？這就是 <b>0-RTT</b>，送出去的那份叫早期資料（early data）。上一節的表裡，它把 90 毫秒壓到 60 毫秒。但它付了兩個代價：</p>
<ol>
<li><b>早期資料沒有前向保密</b>：它只用票裡的祕密加密，沒等到這次的 ECDHE。票證金鑰一旦外洩，錄下來的 0-RTT 資料全部解得開。</li>
<li><b>可以被重放（replay）</b>。這是大問題，看圖：</li>
</ol>
<figure class="figure"><svg viewBox="0 28 680 198" class="fg" style="width:100%;max-width:680px" role="img" aria-label="0-RTT 重放攻擊：路上的攻擊者錄下 ClientHello 和早期資料，幾秒後原封不動再送一次，伺服器把同一筆訂單執行兩次">
<rect x="20" y="40" width="130" height="56" rx="8" class="fg-b alt"/>
<text x="85" y="64" text-anchor="middle" class="fg-t">用戶端</text>
<text x="85" y="84" text-anchor="middle" class="fg-t sm">手上有上次的票</text>
<rect x="275" y="40" width="130" height="56" rx="8" class="fg-b warm"/>
<text x="340" y="64" text-anchor="middle" class="fg-t warm">路上的攻擊者</text>
<text x="340" y="84" text-anchor="middle" class="fg-t sm">把位元組錄下來</text>
<rect x="530" y="40" width="130" height="56" rx="8" class="fg-b"/>
<text x="595" y="64" text-anchor="middle" class="fg-t">伺服器</text>
<text x="595" y="84" text-anchor="middle" class="fg-t sm">解得開就執行</text>
<line x1="150" y1="68" x2="267" y2="68" class="fg-l alt"/><polygon points="275,68 267,63.5 267,72.5" class="fg-a alt"/>
<text x="212" y="58" text-anchor="middle" class="fg-t sm">ClientHello＋早期資料</text>
<text x="212" y="86" text-anchor="middle" class="fg-t sm mono">POST /orders</text>
<line x1="405" y1="68" x2="522" y2="68" class="fg-l alt"/><polygon points="530,68 522,63.5 522,72.5" class="fg-a alt"/>
<text x="467" y="58" text-anchor="middle" class="fg-t sm">照常轉送</text>
<path d="M340 96 V132 H595 V104" class="fg-l warm dash"/><polygon points="595,96 590.5,104 599.5,104" class="fg-a warm"/>
<text x="467" y="150" text-anchor="middle" class="fg-t sm warm">幾秒後原封不動再送一次</text>
<rect x="470" y="166" width="190" height="50" rx="8" class="fg-b warm"/>
<text x="565" y="187" text-anchor="middle" class="fg-t warm">同一筆訂單成立兩次</text>
<text x="565" y="205" text-anchor="middle" class="fg-t sm">伺服器的隨機數還沒參與</text>
<rect x="20" y="166" width="420" height="50" rx="8" class="fg-b hot"/>
<text x="230" y="187" text-anchor="middle" class="fg-t sm">防法：只讓冪等的請求走 0-RTT、票只能用一次、</text>
<text x="230" y="205" text-anchor="middle" class="fg-t sm">後端看到 Early-Data: 1 就回 425 Too Early</text>
</svg><figcaption>早期資料在伺服器開口之前就送出了，伺服器的隨機數根本沒參與。所以錄下來的同一份位元組再送一次，伺服器照樣解得開、照樣執行。</figcaption></figure>
<p>一般的交握裡，伺服器的隨機數讓每條連線的金鑰都不一樣，重送錄下來的封包只會失敗。早期資料的金鑰卻只跟票有關，送幾次都解得開。如果那是「下單」或「扣一次抽獎券」，就會執行兩次。防法有三層，要一起用：</p>
<ul>
<li><b>只讓安全、冪等的請求走 0-RTT</b>：GET 首頁、讀排行榜可以；任何會改變狀態的請求都不行。冪等是什麼，下一課的深入圖解會細講。</li>
<li><b>伺服器端防重放</b>：票只能用一次，或記住最近一段時間內看過的 ClientHello。注意，多台伺服器共用票證金鑰時，「只能用一次」要跨機器才算數，很難做到完美。</li>
<li><b>讓後端知道這是早期資料</b>：nginx 開了 <code>ssl_early_data on;</code> 之後，用 <code>proxy_set_header Early-Data $ssl_early_data;</code> 把旗標傳給後端。後端看到 <code>Early-Data: 1</code>、而請求又不安全，就回 <b>425 Too Early</b>，瀏覽器會等交握完成再自動重送。</li>
</ul>
<h4>票證金鑰：多台伺服器時要注意的事</h4>
<ul>
<li>負載平衡器後面有三台 nginx，各自產生自己的票證金鑰。用戶端拿 A 發的票去連 B，B 解不開，只好退回完整交握。不會出錯，只是恢復率很低、CPU 偏高。要嘛共用金鑰（<code>ssl_session_ticket_key</code> 指向同一份檔案），要嘛改在負載平衡器那一層統一終止 TLS。</li>
<li>共用的金鑰要<b>定期輪替</b>，例如每天換一把，保留前一把用來解舊票。nginx 自己產生的金鑰，只在重新啟動或重新載入時才會換；一台跑了半年沒重載的 nginx，就是半年都用同一把。</li>
</ul>

<h3><span class="badge lv3">專業</span>六、自動簽發：ACME 與三種驗證方式</h3>
<p>憑證機構簽發之前，必須確認「申請的人真的控制這個網域」。以前靠寄 email、人工審核；現在幾乎都用 <b>ACME</b> 協定（RFC 8555）全自動完成。certbot、Caddy、Traefik、Kubernetes 的 cert-manager 都是 ACME 用戶端。流程是：</p>
<ol>
<li>用戶端產生一組<b>帳號金鑰</b>，向 CA 註冊。之後每個請求都用它簽章。</li>
<li>下訂單：「我要 <code>game.example.com</code> 的憑證」。CA 回一個隨機的 token，加上幾種驗證方式（challenge）讓你挑。</li>
<li>用戶端照選的方式，把「token ＋ 帳號金鑰的指紋」放到 CA 看得到的地方。</li>
<li>CA 去檢查。Let's Encrypt 會從網際網路上好幾個不同的地點同時檢查，防止有人只在某一段網路上劫持流量，騙到憑證。</li>
<li>通過之後，用戶端送出 CSR（裡面是網站的公鑰），CA 簽發，用戶端下載整條憑證鏈。</li>
</ol>
<figure class="figure"><svg viewBox="0 0 680 290" class="fg" style="width:100%;max-width:680px" role="img" aria-label="左邊 HTTP-01：伺服器申請拿到 token，CA 從外面連 80 埠取回檔案；右邊 DNS-01：伺服器申請後用 API 寫入 TXT 紀錄，CA 查詢 TXT 紀錄">
<line x1="340" y1="10" x2="340" y2="280" class="fg-l dim dash"/>
<text x="170" y="26" text-anchor="middle" class="fg-t lg">HTTP-01</text>
<text x="510" y="26" text-anchor="middle" class="fg-t lg">DNS-01</text>
<rect x="40" y="44" width="260" height="40" rx="6" class="fg-b hot"/>
<text x="170" y="69" text-anchor="middle" class="fg-t">Let's Encrypt（CA）</text>
<rect x="40" y="170" width="260" height="58" rx="6" class="fg-b alt"/>
<text x="170" y="193" text-anchor="middle" class="fg-t">你的伺服器（certbot）</text>
<text x="170" y="213" text-anchor="middle" class="fg-t sm mono">/.well-known/acme-challenge/…</text>
<line x1="90" y1="170" x2="90" y2="92" class="fg-l"/><polygon points="90,84 85.5,92 94.5,92" class="fg-a"/>
<text x="100" y="112" class="fg-t sm">① 申請，拿到 token</text>
<line x1="250" y1="84" x2="250" y2="162" class="fg-l on"/><polygon points="250,170 245.5,162 254.5,162" class="fg-a on"/>
<text x="240" y="142" text-anchor="end" class="fg-t sm acc">② 從外面連 80 埠</text>
<text x="240" y="158" text-anchor="end" class="fg-t sm acc">取回那個檔案</text>
<text x="170" y="254" text-anchor="middle" class="fg-t sm">80 埠要對外開；不能簽萬用字元</text>
<text x="170" y="272" text-anchor="middle" class="fg-t sm">多台伺服器時，每台都要拿得到檔案</text>
<rect x="380" y="44" width="260" height="40" rx="6" class="fg-b hot"/>
<text x="510" y="69" text-anchor="middle" class="fg-t">Let's Encrypt（CA）</text>
<rect x="380" y="170" width="120" height="58" rx="6" class="fg-b alt"/>
<text x="440" y="194" text-anchor="middle" class="fg-t">你的伺服器</text>
<text x="440" y="214" text-anchor="middle" class="fg-t sm">可以在內網</text>
<rect x="540" y="170" width="100" height="58" rx="6" class="fg-b"/>
<text x="590" y="194" text-anchor="middle" class="fg-t">DNS 服務商</text>
<text x="590" y="214" text-anchor="middle" class="fg-t sm">TXT 紀錄</text>
<line x1="420" y1="170" x2="420" y2="92" class="fg-l"/><polygon points="420,84 415.5,92 424.5,92" class="fg-a"/>
<text x="430" y="112" class="fg-t sm">① 申請</text>
<line x1="500" y1="199" x2="532" y2="199" class="fg-l"/><polygon points="540,199 532,194.5 532,203.5" class="fg-a"/>
<text x="520" y="162" text-anchor="middle" class="fg-t sm">② 寫入</text>
<line x1="600" y1="84" x2="600" y2="162" class="fg-l on"/><polygon points="600,170 595.5,162 604.5,162" class="fg-a on"/>
<text x="590" y="130" text-anchor="end" class="fg-t sm acc">③ 查 TXT</text>
<text x="510" y="254" text-anchor="middle" class="fg-t sm">內網機器、萬用字元都能簽</text>
<text x="510" y="272" text-anchor="middle" class="fg-t sm">但伺服器上要放 DNS API 金鑰</text>
</svg><figcaption>兩種方法都在證明同一件事：「我控制這個網域」。HTTP-01 讓 CA 從外面連進你的伺服器拿檔案；DNS-01 讓 CA 去查你的 DNS，伺服器本身不必對外開放。</figcaption></figure>
<table>
<tr><th></th><th>HTTP-01</th><th>DNS-01</th><th>TLS-ALPN-01</th></tr>
<tr><td>CA 去哪裡看</td><td><code>/.well-known/acme-challenge/&lt;token&gt;</code>，一定走 80 埠</td><td>TXT 紀錄 <code>_acme-challenge.網域</code></td><td>443 埠上一次特殊的 TLS 交握，ALPN 寫 <code>acme-tls/1</code></td></tr>
<tr><td>萬用字元憑證</td><td>不行</td><td><b>可以</b>，而且是唯一的方法</td><td>不行</td></tr>
<tr><td>伺服器要對外開放嗎</td><td>80 埠要開</td><td>不用，內網機器也能簽</td><td>443 埠要開</td></tr>
<tr><td>多台伺服器</td><td>驗證請求被送到哪一台，那一台就要有檔案</td><td>跟伺服器無關</td><td>同 HTTP-01</td></tr>
<tr><td>要保護的東西</td><td>幾乎沒有</td><td><b>DNS API 的金鑰</b>：拿到它就能改你整個網域</td><td>幾乎沒有</td></tr>
</table>
<p>DNS-01 那一列的風險常被忽略。為了自動續期，你得把 DNS 服務商的 API 金鑰放在伺服器上，而這把金鑰往往能改整個網域的所有紀錄，被偷就等於網域被接管。降低風險的做法有兩種：用只能改特定 TXT 紀錄的受限金鑰；或者把 <code>_acme-challenge.game.example.com</code> 用 CNAME 指到另一個專門用來驗證的小區域，伺服器只拿得到那個小區域的權限。</p>
<h4>自動化了，為什麼還是會過期</h4>
<p>「我們有 certbot」的團隊，憑證照樣會過期。最常見的四個原因：</p>
<ul>
<li><b>續期成功了，但 nginx 沒重新載入。</b>新憑證躺在磁碟上，記憶體裡還是舊的那張。certbot 要加 <code>--deploy-hook "systemctl reload nginx"</code>。</li>
<li><b>80 埠後來被防火牆關了</b>，HTTP-01 從此驗不過，失敗通知寄到沒人看的信箱。</li>
<li><b>憑證在容器裡</b>：容器重建時沒掛載憑證的目錄，或負責續期的程式跑在一個早就被刪掉的容器裡。</li>
<li><b>撞到頻率限制</b>：測試時一直重簽，被 CA 擋住。Let's Encrypt 對完全相同的一組名稱，一週只發 5 張。測試一律先打它的 staging 環境。</li>
</ul>
<p>所以上一課才要你<b>從外面</b>監控到期日：不管自動化在哪一步默默壞掉，外部監控看的都是使用者實際拿到的那張。certbot 預設在剩不到 30 天時續期。公開憑證的最長效期，2026 年 3 月起已經降到 200 天，2027 年降到 100 天，2029 年降到 47 天，手動更新已經不是選項。另外，在 DNS 加一筆 <b>CAA</b> 紀錄，例如只允許 <code>letsencrypt.org</code>，其他 CA 就不能替你的網域簽憑證。</p>

<h3><span class="badge lv3">專業</span>七、撤銷：為什麼它一直不太管用</h3>
<p>私鑰外洩了，憑證還有幾十天才到期，這段時間誰都能冒充你。理論上你要<b>撤銷</b>（revoke）它。問題是：用戶端怎麼知道？</p>
<table>
<tr><th>做法</th><th>怎麼運作</th><th>問題</th></tr>
<tr><td>CRL（撤銷清單）</td><td>CA 定期公布一份「已撤銷的序號清單」</td><td>清單可能很大，用戶端不會每次連線都去下載</td></tr>
<tr><td>OCSP</td><td>用戶端每次連線都去問 CA：「這個序號還有效嗎？」</td><td>多一個來回；CA 知道你在看哪個網站；CA 一掛，大家一起卡住</td></tr>
<tr><td>OCSP stapling</td><td>伺服器自己定期去問，把 CA 簽過的回答夾在交握裡</td><td>解決了速度和隱私，但用戶端沒收到時多半還是放行</td></tr>
<tr><td>瀏覽器自己的清單</td><td>Chrome 的 CRLSets、Firefox 的 CRLite，由瀏覽器廠商整理後推送</td><td>只有瀏覽器有，你的 Node.js、Go 程式沒有</td></tr>
<tr><td>短效憑證</td><td>效期短到「等它自己過期」就夠快</td><td>一切都必須自動化</td></tr>
</table>
<p>OCSP 的致命傷是 <b>soft-fail</b>：問不到 CA 時，瀏覽器為了不讓網站打不開，選擇放行。可是能冒充你網站的攻擊者，通常本來就站在網路中間，他只要把 OCSP 請求擋掉就好。這道鎖只防君子。所以整個業界在換方向：Let's Encrypt 在 2025 年停掉了 OCSP 服務，改成只提供 CRL；CA/瀏覽器論壇則一路縮短效期。思路很簡單：既然沒辦法可靠地通知全世界「這張作廢了」，那就讓每張憑證都活得很短。Let's Encrypt 也已經提供效期只有大約六天的短效憑證。</p>
<div class="note"><b>私鑰真的外洩時的順序：</b>一、產生<b>新的私鑰</b>，不要拿舊私鑰去重簽，很多人這一步做錯；二、用新私鑰申請新憑證並部署；三、撤銷舊憑證；四、到 crt.sh 查憑證透明化紀錄，確認沒有你不知道的憑證；五、追查私鑰是怎麼外洩的，堵住那個洞。</div>

<h3><span class="badge lv3">專業</span>八、mTLS：服務之間互相驗明正身</h3>
<p>一般的 TLS 只有伺服器出示憑證。<b>mTLS</b>（mutual TLS）多一步：伺服器在送出自己憑證的同一趟裡，加一則 <b>CertificateRequest</b>；用戶端就得在自己的 Finished 之前，送出自己的 Certificate 和 CertificateVerify。兩邊都要證明「我手上有這張憑證的私鑰」。</p>
<p>它最常用在服務對服務：帳務服務要確定呼叫它的真的是訂單服務。比起 API 金鑰，mTLS 的私鑰從來不在線上傳，憑證也可以很短命、自動輪替。</p>
<h4>一定要用自己的 CA</h4>
<p>用戶端憑證<b>絕對不能</b>用公開 CA 來驗。公開 CA 會替任何控制網域的人簽憑證；如果你的服務「只要是公開 CA 簽的就信」，那全世界任何人花五分鐘申請一張，就能通過你的 mTLS。正確做法是建一個內部 CA（step-ca、HashiCorp Vault 的 PKI 功能、雲端的私有 CA 服務），伺服器只信任它。</p>
<pre><code># nginx：只接受內部 CA 簽的用戶端憑證
ssl_client_certificate /etc/nginx/internal-ca.pem;
ssl_verify_client on;
# 把驗證結果和身分交給後端
proxy_set_header X-Client-Verify $ssl_client_verify;
proxy_set_header X-Client-DN     $ssl_client_s_dn;</code></pre>
<pre><code>// Go：要求並驗證用戶端憑證
pool := x509.NewCertPool()
pool.AppendCertsFromPEM(internalCA)
srv := &amp;http.Server{
    Addr: ":8443",
    TLSConfig: &amp;tls.Config{
        ClientAuth: tls.RequireAndVerifyClientCert,
        ClientCAs:  pool,
        MinVersion: tls.VersionTLS12,
    },
}
log.Fatal(srv.ListenAndServeTLS("server.pem", "server-key.pem"))</code></pre>
<h4>驗明身分之後，還要授權</h4>
<p>mTLS 只回答「你是誰」，沒回答「你可以做什麼」。帳務服務驗過憑證之後，還要檢查憑證上的身分在不在允許清單裡。身分寫在 SAN 裡，現在的慣例是 <b>SPIFFE ID</b> 這種 URI，例如 <code>spiffe://cluster.local/ns/shop/sa/orders</code>：信任網域、命名空間、服務帳號，一目了然。Istio、Linkerd 這類服務網格（service mesh）會替每個 Pod 自動簽發、自動輪替這種憑證（通常一天左右就換一張），應用程式完全不用改。</p>
<h4>兩個常見的坑</h4>
<ul>
<li><b>中間的負載平衡器終止了 TLS</b>，後端就看不到用戶端憑證了。要嘛讓負載平衡器在第 4 層直接轉送，不解密（TLS passthrough）；要嘛由負載平衡器驗證，再把結果放進標頭傳給後端。後者的話，後端必須只接受來自負載平衡器的連線，不然任何人都能自己寫一個 <code>X-Client-Verify: SUCCESS</code>。這跟第 1.7 課的 <code>X-Forwarded-For</code> 是同一個信任問題。</li>
<li><b>輪替從來沒演練過</b>：內部 CA 的根憑證常常一簽十年，十年後沒有人記得怎麼換，到期那天所有服務一起斷線。現在就把它的到期日寫進監控。</li>
</ul>

<h3><span class="badge lv4">專家</span>九、常見的錯誤設定，與怎麼親手測出來</h3>
<table>
<tr><th>錯誤設定</th><th>症狀</th><th>怎麼測</th></tr>
<tr><td>少送中繼憑證</td><td>瀏覽器正常，curl、Node.js、手機 App 失敗</td><td><code>openssl s_client -showcerts</code>，數一數送了幾張</td></tr>
<tr><td>鏈的順序錯</td><td>部分用戶端失敗</td><td>同上，第一張必須是葉憑證</td></tr>
<tr><td>私鑰和憑證不是一對</td><td>nginx 啟動失敗，訊息含 <code>key values mismatch</code></td><td>比對兩邊公鑰的雜湊（見下）</td></tr>
<tr><td>還開著 TLS 1.0／1.1</td><td>弱點掃描和稽核不過</td><td>用 <code>-tls1_1</code> 連，應該失敗</td></tr>
<tr><td>沒有 HTTP 轉 HTTPS，或沒有 HSTS</td><td>公共 Wi-Fi 上可能被降級</td><td><code>curl -sI http://網域</code>，看轉址和 <code>Strict-Transport-Security</code></td></tr>
<tr><td>HSTS 加了 <code>includeSubDomains</code>，卻有子網域還沒上 HTTPS</td><td>內部工具、舊後台全部打不開，而且很難清掉</td><td>上線前列出所有子網域</td></tr>
<tr><td>健康檢查或監控不送 SNI</td><td>拿到預設憑證，誤報名稱不符</td><td>拿掉 <code>-servername</code> 再連一次比較</td></tr>
<tr><td>TLS 在負載平衡器終止，後端以為是 HTTP</td><td>轉址無限迴圈、產生的網址是 http://</td><td>後端要讀 <code>X-Forwarded-Proto</code></td></tr>
</table>
<p>幾個維運工程師都該背得出來的指令：</p>
<pre><code># 伺服器送了哪些憑證、驗證結果
openssl s_client -connect api.example.com:443 -servername api.example.com -showcerts &lt;/dev/null

# 只看到期日
echo | openssl s_client -connect api.example.com:443 -servername api.example.com 2&gt;/dev/null \
  | openssl x509 -noout -enddate

# 舊版本應該被拒絕（OpenSSL 3 自己預設也不講 1.1，要把安全等級降到 0 才測得準）
openssl s_client -connect api.example.com:443 -servername api.example.com \
  -tls1_1 -cipher 'DEFAULT@SECLEVEL=0' &lt;/dev/null

# 伺服器有沒有選 h2
openssl s_client -connect api.example.com:443 -servername api.example.com \
  -alpn h2,http/1.1 &lt;/dev/null 2&gt;/dev/null | grep ALPN

# 私鑰和憑證是不是一對：兩行輸出要一模一樣
openssl x509 -in cert.pem -noout -pubkey | openssl sha256
openssl pkey -in key.pem -pubout | openssl sha256</code></pre>
<p>完整的健康報告用 <b>Qualys SSL Labs</b> 的線上測試：它從外面測協定版本、套件、憑證鏈和已知漏洞，列出各種舊用戶端能不能連，最後給 A 到 F 的分數，要拿 A+ 得開 HSTS。內網或還沒上線的伺服器，用開源的 <b>testssl.sh</b> 跑同樣的檢查。該開哪些套件不要自己拼湊，用 <b>Mozilla SSL Configuration Generator</b> 的 Intermediate 設定。</p>

<h3><span class="badge lv4">專家</span>十、效能，與幾個少有人看過的角落</h3>
<h4>CPU 花在哪裡</h4>
<p>一條 TLS 連線的 CPU 幾乎都花在交握：伺服器的簽章和 ECDHE 運算。之後的資料加密，有 AES 硬體指令的話便宜到可以忽略。所以優化的方向是：</p>
<ul>
<li><b>憑證用 ECDSA P-256，不要用 RSA。</b>伺服器每次完整交握都要簽一次章，ECDSA 簽章在常見的量測裡比 RSA 2048 快大約一個數量級，憑證鏈也小很多。要照顧極舊的用戶端，nginx 可以同時掛一張 RSA、一張 ECDSA，自動挑對方支援的那一張。</li>
<li><b>提高恢復率</b>，讓大部分連線不必做完整交握（第五節的票證金鑰）。</li>
<li><b>重複使用連線</b>：HTTP keep-alive 與連線池，比任何 TLS 調校都有效。一個每次請求都重新連線的後端呼叫，每次都在付交握的錢。</li>
</ul>
<h4>紀錄大小與第一個位元組</h4>
<p>用戶端要收齊一整則紀錄、驗過標籤，才解得出裡面的任何一個位元組。nginx 的 <code>ssl_buffer_size</code> 預設是 16k，代表網頁的前 16 KB 要全部到齊，瀏覽器才看得到 HTML 的第一行。在慢的網路上，這會拖慢畫面開始出現的時間。給網頁用的伺服器可以調成 4k，讓第一則紀錄裝進前幾個封包；專門傳大檔案的服務就維持 16k，額外成本比較低。</p>
<h4>為什麼 TLS 1.3 要假裝自己是 1.2</h4>
<p>TLS 1.3 的 ClientHello 裡，舊的版本欄位寫的是 TLS 1.2，真正的版本藏在 <code>supported_versions</code> 裡；交握中還會多送一則毫無作用的 ChangeCipherSpec。原因是部署前的測試發現，大量防火牆、企業代理這類中間設備，看到不認識的版本號就把連線砍掉，TLS 1.3 只好打扮成 1.2。這叫「中間設備相容模式」（middlebox compatibility mode）。</p>
<p>還有一個防降級的小機關：支援 1.3 的伺服器如果被迫協商成 1.2，會把自己隨機數的最後 8 個位元組設成 <code>DOWNGRD</code> 加 1 個位元組。支援 1.3 的用戶端看到它，就知道有人在中間壓低版本，立刻中止連線。</p>
<h4>後量子：ClientHello 變胖了</h4>
<p>主流瀏覽器已經改用 X25519 加 ML-KEM 的混合金鑰交換（第 0.15 課）。key_share 從 32 個位元組變成一千多個位元組，ClientHello 一個封包裝不下，得拆成兩個 TCP 封包。有些粗糙的中間設備假設「ClientHello 一定在第一個封包裡」，於是出現莫名其妙的交握失敗。依 SNI 過濾的設備，一定要測這個情境。</p>

<h3>十一、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>HTTPS 會讓網站慢很多</td><td>交握多一個來回，資料加密幾乎不花錢。連線重用之後，差距通常量不太出來。</td></tr>
<tr><td>用了 HTTPS，就沒人知道我連去哪</td><td>IP、SNI（沒開 ECH 時）、流量的大小和時間都看得到。</td></tr>
<tr><td>憑證裡的公鑰是用來加密資料的</td><td>它只用來驗 CertificateVerify 的簽章。資料用 ECDHE 推出來的對稱金鑰加密。</td></tr>
<tr><td>萬用字元憑證蓋得到所有子網域</td><td>只蓋一層，也不含網域本身。</td></tr>
<tr><td>撤銷之後，舊憑證馬上就沒人信了</td><td>很多用戶端根本不查撤銷，瀏覽器問不到也放行。真正有效的是短效憑證。</td></tr>
<tr><td>憑證錯誤就先把驗證關掉，之後再說</td><td>等於對中間人攻擊完全不設防，而且常被忘在正式環境裡。要修的是憑證鏈或信任清單。</td></tr>
<tr><td>mTLS 用公開 CA 的憑證就好</td><td>任何人都申請得到公開憑證。用戶端憑證只能信任內部 CA。</td></tr>
<tr><td>0-RTT 是免費的加速</td><td>早期資料可以被重放，也沒有前向保密，只能給冪等的請求用。</td></tr>
</table>

<h3>十二、跟你的工作連起來</h3>
<ul>
<li><b>前端（Vue、TypeScript）</b>：Service Worker、<code>Secure</code> cookie 和不少瀏覽器 API 只在「安全環境」能用。<code>localhost</code> 算安全，區網 IP 不算，所以用手機連 <code>http://192.168.x.x</code> 測試時功能會不見；用 mkcert 產生本機信任的憑證就能解決。</li>
<li><b>遊戲（Cocos、Unity）</b>：網頁版遊戲放在 HTTPS 頁面裡，就只能連 <code>wss://</code>。iOS 的 App Transport Security 預設要求 HTTPS，Android 9 起預設禁止明文 HTTP。做憑證綁定（certificate pinning）要很小心，憑證一換、舊版 App 全部連不上；真要做，綁自己的公鑰，而且一定留一把備用的。</li>
<li><b>後端（Node.js、Go）</b>：呼叫外部 API 要重用連線。永遠不要寫 <code>rejectUnauthorized: false</code> 或 <code>InsecureSkipVerify: true</code>；內部 CA 用 <code>NODE_EXTRA_CA_CERTS</code>，或在 Go 裡自己建 <code>CertPool</code>。</li>
<li><b>Docker 與雲端伺服器</b>：映像檔裡要有根憑證清單。TLS 通常在負載平衡器或 Ingress 終止，由 cert-manager 或雲端的憑證服務自動續期，再加一個從外部看到期日的監控。</li>
</ul>

<h3>十三、面試會怎麼問</h3>
<p>這幾題在後端、DevOps、資安面試裡很常見。先自己出聲講一遍，再打開參考答案。</p>
<ol>
<li>「描述一次 TLS 1.3 交握。為什麼它只要一個來回？」</li>
<li>「瀏覽器打得開，但 Node.js 呼叫同一個網址出現 <code>unable to verify the first certificate</code>。怎麼回事？怎麼修？」</li>
<li>「什麼是 0-RTT？它有什麼風險？你會怎麼安全地開啟它？」</li>
<li>「ACME 的 HTTP-01 和 DNS-01 差在哪裡？什麼時候一定要用 DNS-01？」</li>
<li>「為什麼業界一直縮短憑證效期，而不是把撤銷機制做好？」</li>
<li>「服務之間要導入 mTLS，你會怎麼設計 CA、身分和輪替？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>用戶端送 ClientHello：隨機數、支援的套件、SNI、ALPN，以及先猜好的 key_share（例如 X25519 公鑰）。伺服器回 ServerHello 和自己的 key_share，雙方用 ECDHE 算出共享祕密、用 HKDF 推導金鑰，之後全部加密。伺服器同一趟送出 EncryptedExtensions、憑證鏈、對交握雜湊簽章的 CertificateVerify，以及 Finished。用戶端驗完憑證鏈、簽章和 Finished，送出自己的 Finished，就能開始送資料。只要一個來回，是因為用戶端第一則訊息就附上了公鑰；猜錯時伺服器回 HelloRetryRequest，變成兩個來回。</li>
<li>伺服器沒送中繼憑證。瀏覽器會自己補抓或用快取，所以打得開；Node.js 不會補，建不出到根的路徑。用 <code>openssl s_client -showcerts</code> 確認送了幾張，修法是設定完整的鏈，例如 certbot 的 <code>fullchain.pem</code>。絕不是把驗證關掉。</li>
<li>0-RTT 讓恢復連線的用戶端在 ClientHello 同一趟就送出應用資料，省一個來回。風險：伺服器的隨機數還沒參與，資料可以被重放而執行兩次；早期資料也沒有前向保密。安全的開法：只讓安全、冪等的請求走 0-RTT；伺服器端防重放；nginx 用 <code>$ssl_early_data</code> 把 <code>Early-Data: 1</code> 傳給後端，後端對不安全的請求回 425。</li>
<li>HTTP-01 是 CA 從外面連 80 埠取 <code>/.well-known/acme-challenge/</code> 底下的檔案，伺服器要對外開 80 埠，不能簽萬用字元。DNS-01 是在 <code>_acme-challenge</code> 放 TXT 紀錄，伺服器不必對外開放。需要萬用字元、或機器在內網時，一定要用 DNS-01；代價是伺服器上要有 DNS API 權限，所以用權限最小的金鑰，或用 CNAME 把驗證委派到另一個小區域。</li>
<li>撤銷在實務上不可靠：CRL 太大不常下載；OCSP 慢、洩漏隱私，問不到時瀏覽器會放行，中間人也擋得掉它；瀏覽器自己的清單，一般程式又沒有。與其可靠地通知全世界，不如讓憑證短命，外洩的憑證很快自己失效，也逼大家把續期全面自動化。</li>
<li>建內部 CA，根金鑰離線保存，日常由中繼 CA 簽發；服務只信任內部 CA。身分放在 SAN，例如 SPIFFE ID，驗證後再依身分授權。憑證效期短（數小時到一天），由代理程式或服務網格自動簽發與輪替，並監控 CA 本身的到期日。中間有負載平衡器時，決定用 TLS passthrough，還是由它驗證、再傳給只接受它連線的後端。</li>
</ol>
</details>

<h3>十四、練功題（做得出來才算真的懂）</h3>
<ol>
<li>手機網路的 RTT 是 80 毫秒。分別算出 TCP 加 TLS 1.2、TCP 加 TLS 1.3、TCP 加 TLS 1.3 0-RTT、QUIC 0-RTT，從開始連線到收到第一個回應位元組要多久（不含 DNS）。</li>
<li>一張憑證的 SAN 列了 <code>example.com</code> 和 <code>*.example.com</code>。下面哪些名稱驗得過：<code>www.example.com</code>、<code>example.com</code>、<code>api.v2.example.com</code>、<code>WWW.EXAMPLE.COM</code>、<code>example.com.evil.net</code>？</li>
<li>對你自己的一個網站跑 <code>openssl s_client -showcerts</code>。伺服器送了幾張憑證？每一張的 subject 和 issuer 是什麼？哪一張沒有被送出來，為什麼不用送？</li>
<li>三台 nginx 在一個第 4 層負載平衡器後面，各自終止 TLS。你發現工作階段恢復率不到 30%，CPU 偏高。為什麼？提出兩種修法。</li>
<li>某個 API 的 <code>POST /orders</code> 開了 0-RTT。描述攻擊者怎麼讓同一筆訂單成立兩次，以及在 nginx 和應用程式各要做什麼修正。</li>
<li>一支 Go 程式打包在 <code>FROM scratch</code> 的映像檔裡，一呼叫外部 HTTPS API 就失敗。錯誤訊息大概是什麼？在 Dockerfile 裡怎麼修？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>TLS 1.2：1 ＋ 2 ＋ 1 ＝ 4 個來回，320 毫秒。TLS 1.3：3 個來回，240 毫秒。TLS 1.3 0-RTT：2 個來回，160 毫秒。QUIC 0-RTT：1 個來回，80 毫秒。RTT 越大，省下的來回越值錢。</li>
<li><code>www.example.com</code> 可以（萬用字元蓋一層）；<code>example.com</code> 可以（有明列）；<code>api.v2.example.com</code> 不行（兩層）；<code>WWW.EXAMPLE.COM</code> 可以（名稱比對不分大小寫）；<code>example.com.evil.net</code> 不行，它是 <code>evil.net</code> 底下的名字，跟你的網域無關。</li>
<li>通常是兩張：葉憑證（subject 是你的網域，issuer 是中繼 CA）和中繼憑證（subject 是中繼 CA，issuer 是根 CA）。根憑證不用送：信任只來自用戶端本機的清單，送了也沒用。只看到一張，就是少送了中繼憑證。</li>
<li>每台 nginx 用自己的票證金鑰，用戶端拿 A 的票連到 B，B 解不開，只好做完整交握；三台的話，大約只有三分之一的機會回到同一台。修法一：三台共用同一份票證金鑰並定期輪替；修法二：改在負載平衡器終止 TLS。</li>
<li>攻擊者錄下 ClientHello 和早期資料，幾秒後原封不動送給伺服器（或叢集裡的另一台），伺服器就再下一次單。修正：nginx 用 <code>proxy_set_header Early-Data $ssl_early_data;</code> 把旗標傳給後端；應用程式對帶 <code>Early-Data: 1</code> 的非冪等請求一律回 425。下單本身也該要求冪等鍵，重複的請求只回同一筆結果。</li>
<li>錯誤大概是 <code>x509: certificate signed by unknown authority</code>，因為 <code>scratch</code> 映像檔裡沒有任何根憑證。在建置階段的映像檔裡裝好 <code>ca-certificates</code>，再複製進最終映像檔：<code>COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/</code>。或改用已經內建根憑證的精簡映像檔，例如 distroless 的 static 版本。</li>
</ol>
</details>

<h3>十五、想再挖深</h3>
<ul>
<li><b>RFC 8446</b>（<a href="https://www.rfc-editor.org/rfc/rfc8446">rfc-editor.org/rfc/rfc8446</a>）：TLS 1.3 的規格本身。讀第 2 節的交握概觀和附錄的狀態機，就能把這一章的圖對回原文。</li>
<li><b>Ivan Ristić《Bulletproof TLS and PKI》</b>：SSL Labs 作者寫的實務書，憑證、設定、各種攻擊與部署細節，是維運 TLS 的標準參考書。</li>
<li><b>Let's Encrypt 文件</b>（<a href="https://letsencrypt.org/docs/">letsencrypt.org/docs</a>）：驗證方式、頻率限制、憑證鏈的說明都在這裡，寫得清楚又常更新。</li>
<li><b>Mozilla SSL Configuration Generator</b>（<a href="https://ssl-config.mozilla.org/">ssl-config.mozilla.org</a>）：選伺服器軟體和相容程度，直接產生建議的 TLS 設定。</li>
<li><b>Qualys SSL Labs Server Test</b>（<a href="https://www.ssllabs.com/ssltest/">ssllabs.com/ssltest</a>）：從外部替你的網站做完整的 TLS 體檢，每次改設定後都跑一次。</li>
</ul>
` });
