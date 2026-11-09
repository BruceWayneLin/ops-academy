DEEP({ 'net-lb': `
<p>上一課說，負載平衡器是一個會分流、會把壞掉的機器踢出去的反向代理。這一章把它拆開：第 4 層和第 7 層的負載平衡器，內部到底在搬什麼；輪詢、最少連線、一致性雜湊、「隨機挑兩個」這幾種演算法，各自在什麼情況下會出事；健康檢查從「發現機器掛了」到「不再送流量」中間有幾秒的空窗；部署時怎麼做到一個請求都不掉；黏性工作階段和共用狀態怎麼選；WebSocket 這種長連線為什麼特別難平衡；<code>X-Forwarded-For</code> 為什麼不能直接相信；以及負載平衡器自己怎麼不變成那個「一壞全壞」的點。最後附上 nginx 和 HAProxy 可以直接改來用的設定。</p>

<h3><span class="badge lv1">基礎</span>一、第 4 層與第 7 層：拆不拆信封</h3>
<p>想像一間公司的收發室。第一種收發員只看信封上的部門代號，看都不看內容，就把信丟進對應的格子，一分鐘處理幾千封。第二種是秘書：把信拆開讀完，看到「退貨」轉給客服、看到「報價」轉給業務，還會順手蓋個收件章。前者是<b>第 4 層</b>（L4）負載平衡器，後者是<b>第 7 層</b>（L7）。</p>
<figure class="figure"><svg viewBox="0 0 680 262" class="fg" style="width:100%;max-width:680px" role="img" aria-label="上方是第 4 層：用戶端到應用程式是同一條 TCP 連線，負載平衡器只改位址轉送封包；下方是第 7 層：負載平衡器解開 TLS、讀 HTTP，跟前後各有一條獨立的連線">
<text x="20" y="34" class="fg-t alt">第 4 層（L4）</text>
<rect x="20" y="46" width="130" height="46" rx="6" class="fg-b"/>
<text x="85" y="66" text-anchor="middle" class="fg-t">用戶端</text>
<text x="85" y="83" text-anchor="middle" class="fg-t sm mono">198.51.100.7</text>
<rect x="270" y="46" width="140" height="46" rx="6" class="fg-b alt"/>
<text x="340" y="66" text-anchor="middle" class="fg-t">L4 負載平衡器</text>
<text x="340" y="83" text-anchor="middle" class="fg-t sm">只看位址和連接埠</text>
<rect x="530" y="46" width="130" height="46" rx="6" class="fg-b"/>
<text x="595" y="66" text-anchor="middle" class="fg-t">應用程式 2</text>
<text x="595" y="83" text-anchor="middle" class="fg-t sm mono">10.0.1.12:8080</text>
<line x1="150" y1="69" x2="262" y2="69" class="fg-l alt"/><polygon points="270,69 262,64.5 262,73.5" class="fg-a alt"/>
<line x1="410" y1="69" x2="522" y2="69" class="fg-l alt"/><polygon points="530,69 522,64.5 522,73.5" class="fg-a alt"/>
<text x="210" y="60" text-anchor="middle" class="fg-t sm">TCP 封包</text>
<text x="470" y="60" text-anchor="middle" class="fg-t sm">改了目的位址轉送</text>
<path d="M150 104 V110 H530 V104" class="fg-l"/>
<text x="340" y="126" text-anchor="middle" class="fg-t sm">從頭到尾是同一條 TCP 連線，裡面裝什麼它不管</text>
<text x="20" y="160" class="fg-t acc">第 7 層（L7）</text>
<rect x="20" y="172" width="130" height="46" rx="6" class="fg-b"/>
<text x="85" y="192" text-anchor="middle" class="fg-t">用戶端</text>
<text x="85" y="209" text-anchor="middle" class="fg-t sm mono">198.51.100.7</text>
<rect x="270" y="166" width="140" height="58" rx="6" class="fg-b hot"/>
<text x="340" y="186" text-anchor="middle" class="fg-t">L7 負載平衡器</text>
<text x="340" y="203" text-anchor="middle" class="fg-t sm">解開 TLS、讀 HTTP</text>
<text x="340" y="218" text-anchor="middle" class="fg-t sm mono">/api/rooms → 第 2 組</text>
<rect x="530" y="172" width="130" height="46" rx="6" class="fg-b"/>
<text x="595" y="192" text-anchor="middle" class="fg-t">應用程式 2</text>
<text x="595" y="209" text-anchor="middle" class="fg-t sm mono">10.0.1.12:8080</text>
<line x1="150" y1="195" x2="262" y2="195" class="fg-l on"/><polygon points="270,195 262,190.5 262,199.5" class="fg-a on"/>
<line x1="410" y1="195" x2="522" y2="195" class="fg-l on"/><polygon points="530,195 522,190.5 522,199.5" class="fg-a on"/>
<text x="210" y="186" text-anchor="middle" class="fg-t sm">連線 1：HTTPS</text>
<text x="470" y="186" text-anchor="middle" class="fg-t sm">連線 2：HTTP</text>
<text x="340" y="250" text-anchor="middle" class="fg-t sm">兩條獨立的 TCP 連線：L7 可以重試、改標頭、依內容分流</text>
</svg><figcaption>L4 只看封包外面的位址和連接埠，轉送很便宜，但不知道裡面是 HTTP 還是資料庫協定。L7 把連線接下來、拆開來讀，聰明得多，也貴得多。</figcaption></figure>
<h4>L4 的三種轉法</h4>
<ul>
<li><b>NAT 模式</b>：改掉封包的目的位址送給後端，回程也經過負載平衡器改回來。最常見。</li>
<li><b>代理模式</b>：負載平衡器真的接下 TCP 連線，再自己對後端開一條，但不解讀內容。HAProxy 的 <code>mode tcp</code> 就是這種。</li>
<li><b>直接回傳</b>（direct server return，DSR）：請求經過負載平衡器，回應由後端直接送回用戶端。請求小、回應大的服務（影片、下載）用它，負載平衡器的頻寬壓力少掉一大半。</li>
</ul>
<p>Google 的 Maglev、Meta 開源的 Katran 都是軟體的 L4 負載平衡器，Katran 用 Linux 核心的 XDP 在封包剛進網卡時就處理掉，一台普通伺服器就能扛下大量流量。</p>
<h4>一個常被忽略的差別：gRPC 和 HTTP/2 的長連線</h4>
<p>L4 平衡的是<b>連線</b>，不是請求。一個 gRPC 用戶端只開一條 HTTP/2 連線，然後在上面送上萬個請求；經過 L4，這一萬個請求全部落在同一台後端。結果是「三台後端，一台 CPU 90%，另外兩台閒著」。解法是改用看得懂 HTTP/2 的 L7（例如 Envoy），讓它把每個請求分開送；或在用戶端做負載平衡，同時連好幾台。</p>

<h3><span class="badge lv2">進階</span>二、怎麼挑下一台：四種演算法實際走一次</h3>
<h4>輪詢與加權輪詢</h4>
<p><b>輪詢</b>（round robin）就是一台一台輪。機器規格不同時用<b>加權輪詢</b>：a 的權重 5、b 和 c 各 1，七個請求裡 a 拿五個。但如果照「aaaaa b c」的順序送，a 會在短時間內連吃五個。nginx 用的是「平滑加權輪詢」：每一輪，每台的「目前分數」加上自己的權重，挑分數最高的那台，再把它的分數減掉權重總和 7。實際算一次：</p>
<table>
<tr><th>第幾個請求</th><th>加完權重後 a / b / c</th><th>挑誰</th><th>減 7 之後 a / b / c</th></tr>
<tr><td>1</td><td>5 / 1 / 1</td><td>a</td><td>−2 / 1 / 1</td></tr>
<tr><td>2</td><td>3 / 2 / 2</td><td>a</td><td>−4 / 2 / 2</td></tr>
<tr><td>3</td><td>1 / 3 / 3</td><td>b</td><td>1 / −4 / 3</td></tr>
<tr><td>4</td><td>6 / −3 / 4</td><td>a</td><td>−1 / −3 / 4</td></tr>
<tr><td>5</td><td>4 / −2 / 5</td><td>c</td><td>4 / −2 / −2</td></tr>
<tr><td>6</td><td>9 / −1 / −1</td><td>a</td><td>2 / −1 / −1</td></tr>
<tr><td>7</td><td>7 / 0 / 0</td><td>a</td><td>0 / 0 / 0</td></tr>
</table>
<p>順序是 a a b a c a a，七個裡 a 五個，而且 b、c 被平均插在中間；第七輪結束，分數全部歸零，下一輪重複同樣的節奏。</p>
<h4>最少連線</h4>
<p>三台目前分別有 10、3、7 條連線，下一條給第二台。請求處理時間差很多、或連線會開很久（WebSocket）時，比輪詢公平得多。它有一個陷阱：<b>新加入的機器連線數是 0</b>，於是接下來所有新連線全部湧向它，一台剛開機、快取還是冷的機器，瞬間被打滿。HAProxy 的 <code>slowstart</code> 讓新機器的權重在一段時間內慢慢爬升，就是為了這個。</p>
<h4>隨機挑兩個（power of two choices）</h4>
<p>大型系統裡，負載平衡器常常有好幾台，每台看到的「各後端連線數」都是自己的、而且有延遲。如果每台都挑「最閒的那台」，它們會在同一瞬間一起湧向同一台，把它變成最忙的，下一刻又一起換到另一台，像一群人搶同一個空的收銀台。<b>隨機挑兩台、選比較閒的那台</b>，聽起來很隨便，數學上卻證明：最忙那台的負載，比純隨機好上一大截，而且不會一窩蜂。Envoy 的 least_request 預設就是這樣做；nginx 可以寫 <code>random two least_conn;</code>。</p>
<h4>雜湊與一致性雜湊</h4>
<p>有時候你要的是「同一個鍵永遠到同一台」：同一個房間的玩家都要連到持有那個房間狀態的伺服器，同一個使用者的請求最好打到快取裡有他資料的那台。最直覺的寫法是 <code>hash(key) mod N</code>。問題出在 N 改變的時候：</p>
<figure class="figure"><svg viewBox="0 10 680 270" class="fg" style="width:100%;max-width:680px" role="img" aria-label="一致性雜湊的環：伺服器 A、B、C 分布在環上，每個 key 順時針找第一台伺服器；新加入 D 只會分走 A 到 D 之間的 key；右邊比較加一台時 mod N 約 75% 的 key 換主人，一致性雜湊約 25%">
<circle cx="170" cy="150" r="100" class="fg-l"/>
<path d="M170 50 A100 100 0 0 1 256.6 100" class="fg-l warm"/>
<circle cx="170" cy="50" r="10" class="fg-b alt"/><text x="170" y="32" text-anchor="middle" class="fg-t">A</text>
<circle cx="256.6" cy="100" r="10" class="fg-b hot"/><text x="272" y="96" class="fg-t acc">D（新加入）</text>
<circle cx="256.6" cy="200" r="10" class="fg-b alt"/><text x="272" y="214" class="fg-t">B</text>
<circle cx="83.4" cy="200" r="10" class="fg-b alt"/><text x="68" y="214" text-anchor="end" class="fg-t">C</text>
<circle cx="220" cy="63.4" r="6" class="fg-b warm"/>
<circle cx="270" cy="150" r="5" class="fg-lamp"/>
<circle cx="170" cy="250" r="5" class="fg-lamp"/>
<circle cx="120" cy="236.6" r="5" class="fg-lamp"/>
<circle cx="83.4" cy="100" r="5" class="fg-lamp"/>
<text x="232" y="38" class="fg-t sm warm">這一段改歸 D</text>
<text x="170" y="146" text-anchor="middle" class="fg-t sm">每個 key 順時針</text>
<text x="170" y="164" text-anchor="middle" class="fg-t sm">找第一台伺服器</text>
<text x="372" y="50" class="fg-t">從 3 台加到 4 台，多少 key 換主人</text>
<text x="372" y="88" class="fg-t sm mono">hash(key) mod N</text>
<rect x="372" y="96" width="220" height="26" rx="5" class="fg-b warm"/>
<text x="598" y="114" class="fg-t sm warm">約 75%</text>
<text x="372" y="152" class="fg-t sm">一致性雜湊</text>
<rect x="372" y="160" width="73" height="26" rx="5" class="fg-b hot"/>
<text x="453" y="178" class="fg-t sm acc">約 25%</text>
<text x="372" y="222" class="fg-t sm">mod N：幾乎每個 key 都換地方，快取全部失效</text>
<text x="372" y="242" class="fg-t sm">一致性雜湊：只有新機器分走的那一段會搬</text>
<text x="372" y="262" class="fg-t sm">實務上每台在環上放上百個虛擬節點，才分得平均</text>
</svg><figcaption>伺服器和 key 都雜湊到同一個環上，每個 key 順時針走到第一台伺服器。加入 D 之後，只有 A 到 D 那一段的 key 換主人（橘色那顆），其他全部不動。</figcaption></figure>
<p>為什麼 mod N 會搬 75%？從 3 台變 4 台，一個 key 要留在原地，必須 <code>h mod 3</code> 和 <code>h mod 4</code> 剛好相等，而這種 key 大約只有四分之一。對快取來說，這代表加一台機器的那一刻，四分之三的快取同時失效，資料庫瞬間吃下平常好幾倍的流量。<b>一致性雜湊</b>（consistent hashing）把伺服器也放到環上，加一台只會從鄰居那裡分走一段，理想上只搬 1/N。環上每台只放一個點會分得很不平均（看圖：D 只分到六分之一），所以實務上每台放上百個「虛擬節點」。nginx 寫 <code>hash $arg_room consistent;</code>，HAProxy 寫 <code>hash-type consistent</code>。</p>
<p>再進一步，一致性雜湊還是可能讓某個熱門的鍵把一台打爆。「有上限的一致性雜湊」（consistent hashing with bounded loads）規定每台最多只能比平均多承擔一定比例，滿了就順時針交給下一台；HAProxy 的 <code>hash-balance-factor</code> 就是這個參數。</p>

<h3><span class="badge lv2">進階</span>三、健康檢查：從掛掉到被踢出去，中間有幾秒</h3>
<p>健康檢查有三種，正式環境通常一起用：</p>
<ul>
<li><b>主動檢查</b>（active）：負載平衡器每隔幾秒自己去打 <code>/healthz</code>。優點是沒流量也測得到，缺點是有空窗。</li>
<li><b>被動檢查</b>（passive）：看真實流量的結果，連不上、逾時、回 5xx 就記一筆。開源版 nginx 只有這一種：<code>max_fails</code> 預設 1、<code>fail_timeout</code> 預設 10 秒，代表 10 秒內失敗 1 次，就暫停送給它 10 秒。</li>
<li><b>異常剔除</b>（outlier detection）：Envoy 這類代理的進階版被動檢查，例如連續 5 個 5xx 就把那台踢出去 30 秒，被踢越多次、關越久；同時規定最多只能踢掉一定比例的機器。</li>
</ul>
<p>用一組常見的主動檢查參數，追一次一台後端在第 5 秒掛掉：</p>
<figure class="figure"><svg viewBox="0 0 680 230" class="fg" style="width:100%;max-width:680px" role="img" aria-label="健康檢查時間軸：每 2 秒檢查一次，後端第 5 秒掛掉，第 10 秒第三次失敗才標成 DOWN；第 13 秒恢復，第 16 秒連續兩次成功才標回 UP">
<text x="380" y="24" text-anchor="middle" class="fg-t sm">每 2 秒檢查一次；連續 3 次失敗算 DOWN，連續 2 次成功算 UP</text>
<text x="20" y="64" class="fg-t">健康檢查</text>
<text x="120" y="64" text-anchor="middle" class="fg-t acc">✓</text><text x="172" y="64" text-anchor="middle" class="fg-t acc">✓</text><text x="224" y="64" text-anchor="middle" class="fg-t acc">✓</text>
<text x="276" y="64" text-anchor="middle" class="fg-t warm">✕</text><text x="328" y="64" text-anchor="middle" class="fg-t warm">✕</text><text x="380" y="64" text-anchor="middle" class="fg-t warm">✕</text>
<text x="432" y="64" text-anchor="middle" class="fg-t warm">✕</text><text x="484" y="64" text-anchor="middle" class="fg-t acc">✓</text><text x="536" y="64" text-anchor="middle" class="fg-t acc">✓</text>
<text x="588" y="64" text-anchor="middle" class="fg-t acc">✓</text><text x="640" y="64" text-anchor="middle" class="fg-t acc">✓</text>
<text x="20" y="104" class="fg-t">後端實際</text>
<rect x="120" y="86" width="130" height="26" rx="5" class="fg-b hot"/><text x="185" y="104" text-anchor="middle" class="fg-t sm">活著</text>
<rect x="250" y="86" width="208" height="26" rx="5" class="fg-b warm"/><text x="354" y="104" text-anchor="middle" class="fg-t sm">掛了</text>
<rect x="458" y="86" width="182" height="26" rx="5" class="fg-b hot"/><text x="549" y="104" text-anchor="middle" class="fg-t sm">回來了</text>
<text x="20" y="144" class="fg-t">負載平衡器</text>
<rect x="120" y="126" width="260" height="26" rx="5" class="fg-b"/><text x="250" y="144" text-anchor="middle" class="fg-t sm">UP：照樣送流量</text>
<rect x="380" y="126" width="156" height="26" rx="5" class="fg-b dash"/><text x="458" y="144" text-anchor="middle" class="fg-t sm">DOWN：不送</text>
<rect x="536" y="126" width="104" height="26" rx="5" class="fg-b"/><text x="588" y="144" text-anchor="middle" class="fg-t sm">UP</text>
<path d="M250 160 V166 H380 V160" class="fg-l warm"/>
<text x="315" y="182" text-anchor="middle" class="fg-t sm warm">這 5 秒送去的請求全部失敗</text>
<path d="M458 160 V166 H536 V160" class="fg-l"/>
<text x="497" y="182" text-anchor="middle" class="fg-t sm">好了，還要等兩次成功</text>
<line x1="120" y1="204" x2="640" y2="204" class="fg-l dim"/>
<text x="120" y="222" text-anchor="middle" class="fg-t sm">0 秒</text>
<text x="380" y="222" text-anchor="middle" class="fg-t sm">10</text>
<text x="640" y="222" text-anchor="middle" class="fg-t sm">20 秒</text>
</svg><figcaption>主動檢查一定有空窗：最長大約是「間隔 × 失敗次數」，再加上每次檢查的逾時。在這段時間裡，負載平衡器還以為那台是好的。</figcaption></figure>
<p>算一下代價：三台後端分擔每秒 1,000 個請求，掛掉的那台大約分到每秒 333 個，5 秒就是大約 1,700 個失敗的請求。把間隔縮短、失敗次數降低，空窗會變小，但網路抖一下就誤判、機器被踢進踢出（flapping）。實務上的解法是兩種一起用：主動檢查負責「長期判斷」，被動檢查加上自動重試，負責把空窗裡的失敗接住：nginx 的 <code>proxy_next_upstream error timeout</code> 讓連不上的請求立刻改送下一台，使用者根本感覺不到。當然，只有冪等的請求能這樣重試（上一課）。</p>
<h4>檢查什麼：淺的和深的</h4>
<p>上一課提醒過：健康檢查裡查資料庫，資料庫一打嗝，所有機器同時被判死。所以要分開兩件事：「<b>我這個行程還活著、能接請求</b>」，給負載平衡器用，只檢查自己；「<b>我依賴的東西都正常</b>」，給監控和警報用。Kubernetes 的 liveness 和 readiness 也是同一個道理（第 2.4 課）。</p>
<h4>全部都掛了，怎麼辦</h4>
<p>如果檢查本身寫錯了，例如逾時設太短，所有機器同時被判 DOWN，負載平衡器手上就一台都沒有。成熟的負載平衡器會在這時候「放棄相信健康檢查」：AWS 的 ALB 在所有目標都不健康時，會改成送給全部目標（fail open）；Envoy 在健康的機器低於一定比例（預設 50%）時進入恐慌模式，同樣不管健康狀態平均分配。理由是：寧可送給可能有問題的機器，也比確定回 503 好。</p>

<h3><span class="badge lv3">專業</span>四、連線排空與優雅部署：一個請求都不掉</h3>
<p>滾動部署時，舊的機器要下線。理想的順序是：先讓負載平衡器<b>不再送新請求</b>，等手上的請求做完，再關掉行程。在 Kubernetes 裡，這裡有一個很多人踩過的坑：Pod 被刪除時，「把它從服務的端點移除」和「送 SIGTERM 給容器」是<b>同時</b>開始的，而前者要傳到每個節點的 kube-proxy 和外部的負載平衡器，需要幾秒。</p>
<figure class="figure"><svg viewBox="0 0 680 252" class="fg" style="width:100%;max-width:680px" role="img" aria-label="比較沒有 preStop 和有 preStop：沒有時程式收到 SIGTERM 立刻結束，路由還在送的 4 秒內請求失敗；有 preStop 時先照常服務 10 秒，路由移除後才收到 SIGTERM，做完手上的請求再結束">
<text x="20" y="30" class="fg-t warm">沒有 preStop</text>
<text x="20" y="57" class="fg-t sm">路由</text>
<rect x="140" y="40" width="80" height="24" rx="5" class="fg-b warm"/><text x="180" y="57" text-anchor="middle" class="fg-t sm">還在送</text>
<rect x="220" y="40" width="420" height="24" rx="5" class="fg-b dash"/><text x="430" y="57" text-anchor="middle" class="fg-t sm">已移除，不再送新請求</text>
<text x="20" y="89" class="fg-t sm">Pod</text>
<rect x="140" y="72" width="20" height="24" rx="4" class="fg-b warm"/>
<rect x="160" y="72" width="480" height="24" rx="5" class="fg-b dash"/><text x="400" y="89" text-anchor="middle" class="fg-t sm">收到 SIGTERM 就結束了</text>
<path d="M140 104 V110 H220 V104" class="fg-l warm"/>
<text x="180" y="126" text-anchor="middle" class="fg-t sm warm">這段的請求：502</text>
<text x="20" y="150" class="fg-t acc">preStop 先睡 10 秒</text>
<text x="20" y="175" class="fg-t sm">路由</text>
<rect x="140" y="158" width="80" height="24" rx="5" class="fg-b"/><text x="180" y="175" text-anchor="middle" class="fg-t sm">還在送</text>
<rect x="220" y="158" width="420" height="24" rx="5" class="fg-b dash"/><text x="430" y="175" text-anchor="middle" class="fg-t sm">已移除，不再送新請求</text>
<text x="20" y="207" class="fg-t sm">Pod</text>
<rect x="140" y="190" width="200" height="24" rx="5" class="fg-b hot"/><text x="240" y="207" text-anchor="middle" class="fg-t sm">照常服務（還在 sleep）</text>
<rect x="340" y="190" width="300" height="24" rx="5" class="fg-b alt"/><text x="490" y="207" text-anchor="middle" class="fg-t sm">SIGTERM：不接新的，做完手上的再結束</text>
<line x1="140" y1="228" x2="640" y2="228" class="fg-l dim"/>
<text x="140" y="244" text-anchor="middle" class="fg-t sm">0</text>
<text x="220" y="244" text-anchor="middle" class="fg-t sm">4 秒</text>
<text x="340" y="244" text-anchor="middle" class="fg-t sm">10 秒</text>
<text x="640" y="244" text-anchor="middle" class="fg-t sm">25 秒</text>
</svg><figcaption>路由的更新需要幾秒才傳到每一個地方。preStop 讓程式多活一段時間，等「不再送新請求」生效之後，才開始真正的關機流程。這裡的 4 秒和 10 秒只是示意，實際數字要量你的環境。</figcaption></figure>
<pre><code>spec:
  terminationGracePeriodSeconds: 45   # 要大於 preStop ＋ 排空
  containers:
  - name: api
    lifecycle:
      preStop:
        exec:
          command: ["sleep", "10"]</code></pre>
<p>程式本身收到 SIGTERM 之後要做三件事：停止接受新連線；把閒置的 keep-alive 連線關掉（Node.js 的 <code>server.close()</code> 加上 <code>server.closeIdleConnections()</code>，HTTP/2 則送 GOAWAY）；等進行中的請求做完，或到了自己設的上限就強制結束。雲端的負載平衡器也有對應的設定，例如 AWS 目標群組的「取消註冊延遲」（deregistration delay），預設 300 秒，代表排空最多等 5 分鐘。一般的 API 可以調短，不然每次部署都要多等幾分鐘。</p>
<h4>長連線怎麼排空</h4>
<p>WebSocket 連線可能開好幾個小時，不可能等它自然結束。做法是：排空開始時，伺服器主動送關閉代碼 1001（going away），用戶端收到後，帶著<b>隨機抖動的延遲</b>重新連線，被負載平衡器送到其他機器。一次部署 10 台、每台 1 萬條連線，如果大家同時重連，新機器一秒內要接 10 萬個交握；把排空分批、把延遲隨機攤開，才不會自己把自己打掛。</p>

<h3><span class="badge lv3">專業</span>五、黏性工作階段，還是共用狀態</h3>
<table>
<tr><th>做法</th><th>怎麼運作</th><th>問題</th></tr>
<tr><td>Cookie 黏性</td><td>負載平衡器發一個 cookie，記住你被分到哪台（AWS ALB、HAProxy 都支援）</td><td>負載不均；那台一死，上面的狀態全沒</td></tr>
<tr><td>來源 IP 雜湊</td><td>同一個 IP 永遠到同一台</td><td>行動網路常有幾千人共用一個對外 IP（電信業者的 NAT），那台會被打爆；使用者換網路就換機器</td></tr>
<tr><td>依鍵做一致性雜湊</td><td>依房間 ID、使用者 ID 決定機器</td><td>機器增減時，有一部分鍵要搬家，需要處理狀態遷移</td></tr>
<tr><td>共用儲存</td><td>工作階段放 Redis，任何一台都能處理</td><td>多一個依賴、多一次網路來回；Redis 本身要高可用</td></tr>
<tr><td>無狀態權杖</td><td>身分和必要資訊簽在權杖裡，每個請求自己帶</td><td>撤銷困難、權杖變大</td></tr>
</table>
<p>一般的網頁 API，答案幾乎都是「共用儲存或無狀態權杖」，讓任何一台都能回答。真正需要黏性的是<b>狀態本來就只能在一個地方</b>的服務：一局進行中的猜高低，牌堆、回合、計時器都在某一台伺服器的記憶體裡，每一步都去 Redis 讀寫太慢。這種服務常見的做法是<b>先查表、再直連</b>：配對服務決定「第 7 號房在 game-3」，把位址回給用戶端，用戶端直接連 <code>game-3</code>；或者由 L7 負載平衡器依網址裡的房間 ID 做一致性雜湊。不管哪一種，都要事先想好那台機器死掉時，房間怎麼辦：定期把狀態快照到外部、讓玩家重連到新機器並從快照恢復。</p>

<h3><span class="badge lv3">專業</span>六、WebSocket 的負載平衡：連線活得比你的部署還久</h3>
<ul>
<li><b>負載平衡器要支援升級</b>：L7 要能處理 <code>Upgrade</code>（上一課的 nginx 設定）；L4 則完全不在乎，照轉 TCP。</li>
<li><b>用最少連線，不要用輪詢</b>：連線一開好幾小時，輪詢只保證「新連線」平均，不保證「同時在線的連線」平均。</li>
<li><b>擴充之後不會自動變平均</b>：三台各有 1 萬條連線，你加了第四台，它的連線數是 0，而且會一直很少，因為舊的連線不會自己搬家。要嘛等自然的重連慢慢補，要嘛給連線設一個最長壽命，例如每隔幾小時，伺服器請用戶端在隨機的時間點重連一次，讓分布慢慢回到平均。</li>
<li><b>閒置逾時</b>：負載平衡器看到連線一段時間沒資料就會切掉（AWS ALB 預設 60 秒），心跳的間隔要比整條路上最短的閒置逾時還短（第 1.4 課）。</li>
<li><b>連接埠會用完</b>：L7 負載平衡器到同一台後端的每一條連線，都要用掉負載平衡器一個本機連接埠。一個來源 IP 連同一個後端位址和連接埠，大約只有兩、三萬條可用。單台後端要撐超過這個數字的長連線，就要讓後端多聽幾個連接埠，或讓負載平衡器用多個來源 IP。</li>
</ul>

<h3><span class="badge lv3">專業</span>七、真正的用戶端 IP：X-Forwarded-For 與 PROXY protocol</h3>
<p>經過 L7 代理之後，後端看到的連線來源是代理的 IP，不是使用者的。所以代理會把原本的來源附加到 <code>X-Forwarded-For</code> 標頭裡。問題是：這個標頭<b>任何人都能自己寫</b>。看一次完整的路徑：</p>
<figure class="figure"><svg viewBox="0 0 680 226" class="fg" style="width:100%;max-width:680px" role="img" aria-label="用戶端偽造 X-Forwarded-For 為 192.0.2.66，CDN 附加 198.51.100.7，負載平衡器附加 203.0.113.50；應用程式從右往左讀，跳過信任的代理，第一個不可信的 198.51.100.7 才是真正的用戶端">
<rect x="20" y="20" width="136" height="46" rx="6" class="fg-b"/>
<text x="88" y="40" text-anchor="middle" class="fg-t">用戶端</text>
<text x="88" y="57" text-anchor="middle" class="fg-t sm mono">198.51.100.7</text>
<rect x="188" y="20" width="136" height="46" rx="6" class="fg-b"/>
<text x="256" y="40" text-anchor="middle" class="fg-t">CDN 邊緣</text>
<text x="256" y="57" text-anchor="middle" class="fg-t sm mono">203.0.113.50</text>
<rect x="356" y="20" width="136" height="46" rx="6" class="fg-b"/>
<text x="424" y="40" text-anchor="middle" class="fg-t">負載平衡器</text>
<text x="424" y="57" text-anchor="middle" class="fg-t sm mono">10.0.1.5</text>
<rect x="524" y="20" width="136" height="46" rx="6" class="fg-b hot"/>
<text x="592" y="40" text-anchor="middle" class="fg-t">你的應用程式</text>
<text x="592" y="57" text-anchor="middle" class="fg-t sm">要找出真正的 IP</text>
<line x1="156" y1="43" x2="180" y2="43" class="fg-l"/><polygon points="188,43 180,38.5 180,47.5" class="fg-a"/>
<line x1="324" y1="43" x2="348" y2="43" class="fg-l"/><polygon points="356,43 348,38.5 348,47.5" class="fg-a"/>
<line x1="492" y1="43" x2="516" y2="43" class="fg-l"/><polygon points="524,43 516,38.5 516,47.5" class="fg-a"/>
<text x="172" y="86" text-anchor="middle" class="fg-t sm warm">自己寫了假的 XFF</text>
<text x="340" y="86" text-anchor="middle" class="fg-t sm">附加 198.51.100.7</text>
<text x="508" y="86" text-anchor="middle" class="fg-t sm">附加 203.0.113.50</text>
<text x="20" y="116" class="fg-t sm">應用程式看到的 X-Forwarded-For，加上這條連線本身的來源：</text>
<rect x="20" y="126" width="136" height="46" rx="6" class="fg-b warm"/>
<text x="88" y="146" text-anchor="middle" class="fg-t sm mono">192.0.2.66</text>
<text x="88" y="163" text-anchor="middle" class="fg-t sm">用戶端自己寫的</text>
<rect x="188" y="126" width="136" height="46" rx="6" class="fg-b hot"/>
<text x="256" y="146" text-anchor="middle" class="fg-t sm mono">198.51.100.7</text>
<text x="256" y="163" text-anchor="middle" class="fg-t sm acc">真正的用戶端</text>
<rect x="356" y="126" width="136" height="46" rx="6" class="fg-b alt"/>
<text x="424" y="146" text-anchor="middle" class="fg-t sm mono">203.0.113.50</text>
<text x="424" y="163" text-anchor="middle" class="fg-t sm">CDN：可信</text>
<rect x="524" y="126" width="136" height="46" rx="6" class="fg-b dash"/>
<text x="592" y="146" text-anchor="middle" class="fg-t sm mono">10.0.1.5</text>
<text x="592" y="163" text-anchor="middle" class="fg-t sm">連線來源：可信</text>
<line x1="650" y1="190" x2="108" y2="190" class="fg-l on"/><polygon points="100,190 108,185.5 108,194.5" class="fg-a on"/>
<text x="380" y="212" text-anchor="middle" class="fg-t sm">從右往左讀：信任清單裡的代理就跳過，第一個不在清單裡的，就是真正的用戶端</text>
<text x="92" y="194" text-anchor="end" class="fg-t sm warm">再往左不能信</text>
</svg><figcaption>最左邊的值是用戶端自己寫的，想寫什麼都可以。只有你信任的代理附加上去的值才可信，所以要從右邊開始，一個一個跳過自己的代理。</figcaption></figure>
<p>很多程式寫成「取 <code>X-Forwarded-For</code> 的第一個值」，等於讓攻擊者自己決定自己的 IP：繞過依 IP 的速率限制、繞過只允許公司 IP 的後台、在日誌裡栽贓給別人。正確的做法是明確列出信任的代理：</p>
<pre><code># nginx：只相信自己的負載平衡器和 CDN 加上去的值
set_real_ip_from 10.0.0.0/8;        # 自己的負載平衡器
set_real_ip_from 203.0.113.0/24;    # CDN 公布的位址範圍
real_ip_header X-Forwarded-For;
real_ip_recursive on;               # 從右往左，跳過所有信任的位址</code></pre>
<p>Express 用 <code>app.set('trust proxy', 2)</code> 告訴它前面有兩層可信的代理，<code>req.ip</code> 就會是正確的值；Go 沒有內建的處理，要自己從右邊解析。同時，後端必須<b>只接受來自代理的連線</b>（防火牆或安全群組，下一課），否則攻擊者直接連後端，連 CDN 那一層都可以假造。</p>
<h4>L4 怎麼傳 IP：PROXY protocol</h4>
<p>L4 代理不改 HTTP 內容，沒辦法加標頭。HAProxy 定義的 <b>PROXY protocol</b> 做法是：在 TCP 連線一開頭，先送一行文字，例如 <code>PROXY TCP4 198.51.100.7 10.0.1.12 51234 443</code>，告訴後端原始的來源和目的；第 2 版是同樣資訊的二進位格式。AWS NLB、HAProxy、nginx 都支援，nginx 寫 <code>listen 443 ssl proxy_protocol;</code>。陷阱跟 XFF 一模一樣：一個開了 PROXY protocol 的連接埠，會相信<b>任何</b>連進來的人送的第一行。所以它只能讓負載平衡器連得到。反過來，兩邊設定不一致時（一邊送、一邊沒開），連線會直接失敗，部署時要兩邊一起改。</p>

<h3><span class="badge lv4">專家</span>八、負載平衡器自己不能是單點</h3>
<p>一台 nginx 擋在所有服務前面，它重開機的那一分鐘，所有網站一起消失。消除這個單點有三種常見做法：</p>
<figure class="figure"><svg viewBox="0 0 680 262" class="fg" style="width:100%;max-width:680px" role="img" aria-label="三種消除負載平衡器單點的方法：浮動 IP 在主備兩台之間切換；DNS 回應多個位址；Anycast 讓多個地點宣告同一個 IP">
<text x="120" y="26" text-anchor="middle" class="fg-t alt">浮動 IP（VRRP）</text>
<rect x="60" y="40" width="120" height="30" rx="6" class="fg-b hot"/><text x="120" y="60" text-anchor="middle" class="fg-t sm mono">VIP .10</text>
<path d="M100 70 V86 H70 V100" class="fg-l on"/><polygon points="70,108 65.5,100 74.5,100" class="fg-a on"/>
<path d="M140 70 V86 H170 V100" class="fg-l dim dash"/><polygon points="170,108 165.5,100 174.5,100" class="fg-a"/>
<rect x="30" y="108" width="80" height="44" rx="6" class="fg-b"/><text x="70" y="127" text-anchor="middle" class="fg-t">LB-1</text><text x="70" y="144" text-anchor="middle" class="fg-t sm">主</text>
<rect x="130" y="108" width="80" height="44" rx="6" class="fg-b dash"/><text x="170" y="127" text-anchor="middle" class="fg-t">LB-2</text><text x="170" y="144" text-anchor="middle" class="fg-t sm">備援</text>
<line x1="110" y1="130" x2="130" y2="130" class="fg-l dash"/>
<text x="120" y="178" text-anchor="middle" class="fg-t sm">互相送心跳</text>
<text x="120" y="196" text-anchor="middle" class="fg-t sm">主的沒聲音，備援接手 IP</text>
<text x="120" y="230" text-anchor="middle" class="fg-t sm">切換：幾秒</text>
<text x="120" y="248" text-anchor="middle" class="fg-t sm warm">兩台要在同一個網段</text>
<line x1="230" y1="16" x2="230" y2="252" class="fg-l dim dash"/>
<text x="340" y="26" text-anchor="middle" class="fg-t alt">DNS 多筆紀錄</text>
<rect x="270" y="40" width="140" height="30" rx="6" class="fg-b hot"/><text x="340" y="60" text-anchor="middle" class="fg-t sm mono">api.example.com</text>
<path d="M320 70 V86 H290 V100" class="fg-l on"/><polygon points="290,108 285.5,100 294.5,100" class="fg-a on"/>
<path d="M360 70 V86 H390 V100" class="fg-l on"/><polygon points="390,108 385.5,100 394.5,100" class="fg-a on"/>
<rect x="250" y="108" width="80" height="44" rx="6" class="fg-b"/><text x="290" y="127" text-anchor="middle" class="fg-t">LB-1</text><text x="290" y="144" text-anchor="middle" class="fg-t sm">位址 1</text>
<rect x="350" y="108" width="80" height="44" rx="6" class="fg-b"/><text x="390" y="127" text-anchor="middle" class="fg-t">LB-2</text><text x="390" y="144" text-anchor="middle" class="fg-t sm">位址 2</text>
<text x="340" y="178" text-anchor="middle" class="fg-t sm">兩台同時在線</text>
<text x="340" y="196" text-anchor="middle" class="fg-t sm">掛一台就從紀錄裡拿掉</text>
<text x="340" y="230" text-anchor="middle" class="fg-t sm">切換：等 TTL 和快取</text>
<text x="340" y="248" text-anchor="middle" class="fg-t sm warm">有些用戶端會黏著舊位址</text>
<line x1="450" y1="16" x2="450" y2="252" class="fg-l dim dash"/>
<text x="560" y="26" text-anchor="middle" class="fg-t alt">Anycast</text>
<rect x="500" y="40" width="120" height="30" rx="6" class="fg-b hot"/><text x="560" y="60" text-anchor="middle" class="fg-t sm">同一個 IP</text>
<path d="M530 70 V86 H500 V100" class="fg-l on"/><polygon points="500,108 495.5,100 504.5,100" class="fg-a on"/>
<line x1="560" y1="70" x2="560" y2="100" class="fg-l on"/><polygon points="560,108 555.5,100 564.5,100" class="fg-a on"/>
<path d="M590 70 V86 H620 V100" class="fg-l on"/><polygon points="620,108 615.5,100 624.5,100" class="fg-a on"/>
<rect x="472" y="108" width="56" height="44" rx="6" class="fg-b"/><text x="500" y="135" text-anchor="middle" class="fg-t sm">台北</text>
<rect x="532" y="108" width="56" height="44" rx="6" class="fg-b"/><text x="560" y="135" text-anchor="middle" class="fg-t sm">東京</text>
<rect x="592" y="108" width="56" height="44" rx="6" class="fg-b"/><text x="620" y="135" text-anchor="middle" class="fg-t sm">新加坡</text>
<text x="560" y="178" text-anchor="middle" class="fg-t sm">每一站都宣告同一個 IP</text>
<text x="560" y="196" text-anchor="middle" class="fg-t sm">BGP 把人送到最近的一站</text>
<text x="560" y="230" text-anchor="middle" class="fg-t sm">切換：路由收回，幾秒到幾十秒</text>
<text x="560" y="248" text-anchor="middle" class="fg-t sm warm">要有自己的 IP 段和 BGP</text>
</svg><figcaption>三種做法的差別在「誰負責把流量從壞的那台移走」：浮動 IP 靠兩台機器互相監看，DNS 靠用戶端重新查詢，Anycast 靠網際網路的路由。</figcaption></figure>
<ul>
<li><b>浮動 IP</b>：兩台負載平衡器用 keepalived 跑 VRRP 協定，平常主的那台持有虛擬 IP，備援那台一聽不到心跳，就把 IP 搶過來。要注意：大部分公有雲的虛擬網路<b>不支援</b>這種靠 ARP 搶 IP 的做法，雲端上要改用供應商的 API 轉移彈性 IP，或直接用代管的負載平衡器。</li>
<li><b>DNS 多筆紀錄</b>：一個名字回兩個位址，兩台同時服務。一台掛了，從 DNS 拿掉，但用戶端和中間的快取會照 TTL（有時更久）繼續用舊位址。多數瀏覽器連不上第一個位址時會改試下一個，只是可能要等上好幾秒。</li>
<li><b>Anycast</b>：第 0.11 課講過，同一個 IP 由很多地點一起宣告。CDN 和大型雲端的負載平衡器都這樣做。它還要處理一個細節：路由器在幾條路徑之間分流（ECMP），路由一變，同一條 TCP 連線的封包可能被送到另一台負載平衡器。Maglev 這類系統用一致性雜湊加連線追蹤，讓換了機器的封包仍然送到同一台後端，連線才不會斷。</li>
</ul>
<p>代管的負載平衡器（AWS ALB、NLB、GCP 的負載平衡）本身就是一整群機器分散在多個可用區。用它們時，一定要用它給的 <b>DNS 名稱</b>，不要把查到的 IP 寫死，因為 ALB 背後的 IP 會隨擴充而改變。最後，真正最常把負載平衡器整個弄掛的，不是硬體，而是<b>設定</b>：一份錯的設定同時推到每一台，全部一起倒。上線前一定先跑 <code>nginx -t</code> 或 <code>haproxy -c -f</code> 檢查，並且分批推。</p>

<h3><span class="badge lv4">專家</span>九、nginx 與 HAProxy：可以直接改來用的設定</h3>
<pre><code># nginx：一個 API，三台後端
upstream game_api {
    least_conn;
    server 10.0.1.11:8080 max_fails=3 fail_timeout=10s;
    server 10.0.1.12:8080 max_fails=3 fail_timeout=10s;
    server 10.0.1.13:8080 backup;       # 前兩台都不行才用
    keepalive 64;                        # 對後端保持 64 條閒置連線重複使用
}
server {
    listen 443 ssl;
    http2 on;
    server_name api.example.com;
    location / {
        proxy_pass http://game_api;
        proxy_http_version 1.1;
        proxy_set_header Connection "";  # 讓 keepalive 生效
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_next_upstream error timeout http_502 http_503;
        proxy_next_upstream_tries 2;
    }
}</code></pre>
<p>幾個細節：<code>keepalive</code> 一定要配 <code>proxy_http_version 1.1</code> 和清空的 <code>Connection</code> 標頭，否則 nginx 每個請求都對後端重新連線，在高流量時會把本機連接埠用光。<code>proxy_next_upstream</code> 只會重試冪等的請求；<code>proxy_next_upstream_tries</code> 限制最多試幾台，避免一個壞請求把每台都打一遍。開源版 nginx 只有被動健康檢查；需要主動檢查時，HAProxy 是很好的選擇：</p>
<pre><code># HAProxy：主動健康檢查、慢啟動、依房間 ID 一致性雜湊
global
    stats socket /run/haproxy/admin.sock mode 660 level admin

defaults
    mode http
    timeout connect 5s
    timeout client  60s
    timeout server  60s

frontend fe_https
    bind :443 ssl crt /etc/haproxy/certs/site.pem alpn h2,http/1.1
    use_backend be_rooms if { path_beg /rooms/ }
    default_backend be_api

backend be_api
    balance leastconn
    option httpchk
    http-check send meth GET uri /healthz
    http-check expect status 200
    default-server inter 2s fall 3 rise 2 slowstart 30s
    server app1 10.0.1.11:8080 check
    server app2 10.0.1.12:8080 check

backend be_rooms
    balance url_param room
    hash-type consistent
    server game1 10.0.2.11:9000 check
    server game2 10.0.2.12:9000 check</code></pre>
<p><code>inter 2s fall 3 rise 2</code> 就是第三節那張圖的參數；<code>slowstart 30s</code> 讓新上線的機器在 30 秒內慢慢加到全部權重。部署前手動排空一台，用 HAProxy 的執行期 API：</p>
<pre><code>echo "set server be_api/app1 state drain" | socat stdio /run/haproxy/admin.sock
# 等連線數歸零，部署、驗證，再放回來
echo "set server be_api/app1 state ready" | socat stdio /run/haproxy/admin.sock</code></pre>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>輪詢就會平均</td><td>只平均「請求數」。請求輕重不一、連線長短不一時，負載照樣不平均。</td></tr>
<tr><td>L4 負載平衡器會把 gRPC 請求分散到每台</td><td>L4 分的是連線。一條 HTTP/2 連線上的所有請求都會落在同一台。</td></tr>
<tr><td>健康檢查一失敗，流量馬上停</td><td>有「間隔 × 失敗次數」的空窗，要靠被動檢查和重試接住。</td></tr>
<tr><td>多加機器，WebSocket 的負載就會分散</td><td>舊連線不會自己搬家，要靠重連或限制連線壽命慢慢平均。</td></tr>
<tr><td><code>X-Forwarded-For</code> 第一個值就是用戶端 IP</td><td>那是用戶端自己寫的。要從右往左，跳過信任的代理。</td></tr>
<tr><td>用了 Kubernetes Service，部署就不會掉請求</td><td>端點移除和 SIGTERM 同時發生，沒有 preStop 和優雅關機，照樣會掉。</td></tr>
<tr><td>兩台負載平衡器就沒有單點了</td><td>設定檔、憑證、DNS 都還可能是單點；在雲端，浮動 IP 的做法也常常不能用。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>前端（Vue、TypeScript）</b>：SPA 的靜態檔通常由 CDN 或 nginx 直接回，API 走另一個 location 轉給後端；用 L7 的路徑分流，前後端可以共用一個網域，連 CORS 都省了。</li>
<li><b>遊戲（Cocos、Unity）</b>：大廳 API 是無狀態的，隨便哪台都行；對局伺服器是有狀態的，用「配對服務回傳伺服器位址」或依房間 ID 一致性雜湊。用戶端一定要做帶隨機抖動的重連，因為每次部署、每次擴充都會讓一批連線斷掉。</li>
<li><b>後端（Node.js、Go）</b>：處理 SIGTERM，做優雅關機；從 <code>X-Forwarded-For</code> 取 IP 時設定信任的代理；健康檢查端點只檢查自己。</li>
<li><b>Docker 與雲端伺服器</b>：Kubernetes 的 Pod 設 preStop 和足夠的 <code>terminationGracePeriodSeconds</code>；雲端負載平衡器的取消註冊延遲調到合理的值；永遠用代管負載平衡器的 DNS 名稱。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<p>這些題目在後端、DevOps、SRE 面試裡很常見。先自己講一遍，再看參考答案。</p>
<ol>
<li>「L4 和 L7 負載平衡器差在哪？你會在什麼情況選哪一種？」</li>
<li>「什麼是一致性雜湊？為什麼不用 <code>hash mod N</code>？」</li>
<li>「滾動部署時，怎麼做到不掉任何一個請求？」</li>
<li>「怎麼在負載平衡器後面取得使用者真正的 IP？有什麼安全上的陷阱？」</li>
<li>「一個 WebSocket 服務擴充到 4 台之後，新機器幾乎沒有連線。為什麼？怎麼辦？」</li>
<li>「怎麼避免負載平衡器本身成為單點故障？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>L4 依位址和連接埠轉送 TCP／UDP，不解讀內容，效能高、任何協定都能用，但只能依連線分流，看不到路徑和標頭。L7 終止連線、解 TLS、解析 HTTP，可以依主機名稱、路徑、標頭分流，做重試、改標頭、限流，代價是 CPU 和延遲較高。非 HTTP 協定、極高流量、需要 TLS passthrough 時選 L4；需要依內容路由、對 HTTP/2 或 gRPC 做逐請求平衡、要集中處理 TLS 時選 L7。</li>
<li>一致性雜湊把伺服器和鍵都雜湊到一個環上，鍵順時針找第一台伺服器。增減一台機器時，只有相鄰那一段的鍵要搬，理想上是 1/N；<code>hash mod N</code> 在 N 改變時幾乎所有鍵都換位置，例如 3 台變 4 台約 75% 會搬，快取會大量同時失效。實務上用虛擬節點讓分布平均，並可加上負載上限避免熱點。</li>
<li>先讓負載平衡器停止送新請求，再讓程式結束：在 Kubernetes 用 preStop 等待幾秒，讓端點移除傳遞到所有負載平衡器；程式處理 SIGTERM，停止接新連線、關閉閒置的 keep-alive 連線、等進行中的請求完成；<code>terminationGracePeriodSeconds</code> 和負載平衡器的取消註冊延遲要大於這段時間。搭配就緒檢查，新版本確定能服務才接流量；長連線則主動送關閉訊息，讓用戶端帶抖動重連。</li>
<li>L7 代理把來源附加到 <code>X-Forwarded-For</code>，L4 則用 PROXY protocol。陷阱是用戶端可以自己寫 XFF，取第一個值就會被偽造。正確做法是列出信任的代理位址，從右往左跳過它們，第一個不可信的值才是用戶端；並且讓後端只接受來自代理的連線，否則整個標頭都能被偽造。PROXY protocol 的連接埠同樣只能讓負載平衡器連。</li>
<li>WebSocket 是長連線，負載平衡只決定新連線去哪，既有的連線不會搬家；新機器只拿到擴充之後的新連線。可以等自然重連慢慢平均，或給連線設最長壽命，讓伺服器在隨機時間請用戶端重連，並用最少連線演算法讓重連的人優先到新機器；重連要分批、帶隨機抖動，避免一次湧入。</li>
<li>用代管的負載平衡器，它本身跨可用區、多台機器；自建的話，用兩台以上配合浮動 IP（雲端上用供應商 API 轉移 IP）、DNS 多筆紀錄，或 Anycast。另外要處理隱藏的單點：設定變更先驗證、分批推；憑證自動續期並監控；DNS 本身也要有備援。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>用 nginx 的平滑加權輪詢，算出權重 a = 3、b = 2 時前 5 個請求的順序。</li>
<li>從 4 台變 5 台，用 <code>hash mod N</code> 大約有多少比例的鍵會換機器？用一致性雜湊（理想情況）呢？</li>
<li>健康檢查設成每 5 秒一次、連續 3 次失敗才算 DOWN、每次檢查逾時 2 秒。一台機器突然完全沒有回應，最壞的情況下，它要多久才會被移出？這段時間大約有多少請求受影響（它分到每秒 200 個請求）？</li>
<li>某個應用程式用 <code>req.headers['x-forwarded-for'].split(',')[0]</code> 當作使用者 IP 來做登入的速率限制。描述攻擊者怎麼繞過，並寫出 Express 的正確寫法。</li>
<li>畫出你自己某個服務部署時的時間線：從開始部署，到最後一台舊機器結束，每一步誰在做什麼。哪一步可能讓請求失敗？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>總權重 5。第 1 個：加完是 a3 b2，挑 a，a 減 5 變 −2。第 2 個：a1 b4，挑 b，b 變 −1。第 3 個：a4 b1，挑 a，a 變 −1。第 4 個：a2 b3，挑 b，b 變 −2。第 5 個：a5 b0，挑 a，a 變 0，兩台都回到 0。順序是 a b a b a：五個裡 a 三個、b 兩個，而且交錯。</li>
<li>一個鍵要留在原地，<code>h mod 4</code> 必須等於 <code>h mod 5</code>，大約只有 1/5 的鍵符合，所以約 80% 會搬。一致性雜湊理想上只搬新機器分走的那份，約 1/5，也就是 20%。</li>
<li>最壞情況：機器剛好在一次成功的檢查之後立刻掛掉。接下來三次檢查發生在第 5、10、15 秒，每次還要等 2 秒逾時，第三次失敗在第 17 秒左右才確定。大約 17 秒 × 每秒 200 個 ≈ 3,400 個請求受影響。這就是為什麼要加被動檢查和重試。</li>
<li>攻擊者每次請求都自己帶一個不同的 <code>X-Forwarded-For: 隨機 IP</code>，伺服器以為是不同的人，速率限制完全失效。正確寫法：<code>app.set('trust proxy', 1)</code>（前面有幾層可信的代理就寫幾），然後用 <code>req.ip</code>；同時確保應用程式只能從負載平衡器連進來。</li>
<li>典型的時間線：新 Pod 啟動，就緒檢查通過才加入端點；舊 Pod 被標記刪除，同時開始端點移除和 preStop；preStop 結束後送 SIGTERM，程式停止接新連線、做完手上的請求；超過寬限時間被 SIGKILL。可能失敗的點：新 Pod 太早被判定就緒（還在暖機）；舊 Pod 沒有 preStop 就立刻結束；程式不處理 SIGTERM（例如容器裡的 PID 1 沒把訊號轉給 Node.js）；寬限時間比請求的最長處理時間短。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>nginx 官方文件的 ngx_http_upstream_module</b>（<a href="https://nginx.org/en/docs/http/ngx_http_upstream_module.html">nginx.org</a>）：每個負載平衡方法、<code>max_fails</code>、<code>keepalive</code> 的精確行為都寫在這裡。</li>
<li><b>HAProxy 官方文件</b>（<a href="https://docs.haproxy.org/">docs.haproxy.org</a>）：設定手冊裡的 <code>balance</code>、健康檢查、執行期 API 章節，是調校負載平衡最完整的參考。</li>
<li><b>Google 的論文〈Maglev: A Fast and Reliable Software Network Load Balancer〉</b>（NSDI 2016）：一個真實的大規模 L4 負載平衡器怎麼設計，包括一致性雜湊和連線追蹤。</li>
<li><b>Google《Site Reliability Engineering》第 19、20 章</b>（<a href="https://sre.google/books/">sre.google/books</a>，可免費線上閱讀）：前端與資料中心內部的負載平衡，包括子集化和各種演算法的取捨。</li>
<li><b>Envoy 官方文件的負載平衡與異常剔除章節</b>（<a href="https://www.envoyproxy.io/docs">envoyproxy.io</a>）：power of two choices、恐慌閾值、異常剔除的參數，在這裡都有詳細的說明。</li>
</ul>
` });
