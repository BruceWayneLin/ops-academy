DEEP({ 'fnd-internet': `
<p>上一課給了你網際網路的骨架：封包、IP 位址、路由器、分層、四個指標、BGP。這一章把每一塊放大來看：一個封包身上到底寫了哪些欄位；路由器拿到它，怎麼在一瞬間決定往哪裡丟；為什麼台北到美國的連線「頻寬再大也快不起來」；TCP 怎麼在完全不知道路有多寬的情況下，自己摸索出該送多快；最後是 BGP：網際網路的地圖是靠互相信任畫出來的，一則錯誤的公告，就能讓全世界連不上一家公司。模組 1 會再細講 IP、DNS、TCP、TLS，這一章先把「整條路」看清楚。</p>

<h3><span class="badge lv1">基礎</span>一、封包交換：把一整櫃書拆成很多箱寄</h3>
<p>在網際網路之前，電話網路用的是<b>電路交換</b>（circuit switching）：打一通電話，從你家到對方家整條線路都替你保留著，就算兩個人都不說話，那條線也不能給別人用。</p>
<p>網際網路走的是另一條路，叫<b>封包交換</b>（packet switching）。想像你要把一整櫃書寄到東京：你不會租一台卡車專門跑一趟，而是拆成三十箱，每一箱都貼上收件地址和「第幾箱，共幾箱」，交給物流。每一箱可能走不同的路線、不同的時間到；某條高速公路封了，物流自己改道；收件人照編號排好就行。</p>
<figure class="figure"><svg viewBox="0 0 660 250" class="fg" style="width:100%;max-width:660px" role="img" aria-label="封包交換：資料切成三個封包，經過不同路由器、走不同路線到達伺服器；其中一條線路斷了，封包自動繞路，到達順序變成 1、3、2">
<rect x="20" y="100" width="100" height="50" rx="6" class="fg-b alt"/><text x="70" y="121" text-anchor="middle" class="fg-t">你的電腦</text><text x="70" y="140" text-anchor="middle" class="fg-t sm">切成 1、2、3</text>
<rect x="540" y="100" width="100" height="50" rx="6" class="fg-b alt"/><text x="590" y="121" text-anchor="middle" class="fg-t">伺服器</text><text x="590" y="140" text-anchor="middle" class="fg-t sm">收到 1、3、2</text>
<line x1="120" y1="112" x2="186" y2="68" class="fg-l"/>
<line x1="120" y1="138" x2="186" y2="182" class="fg-l"/>
<line x1="200" y1="76" x2="200" y2="174" class="fg-l"/>
<line x1="216" y1="57" x2="334" y2="48" class="fg-l"/>
<line x1="212" y1="71" x2="338" y2="194" class="fg-l warm dash"/>
<line x1="216" y1="192" x2="334" y2="203" class="fg-l"/>
<line x1="364" y1="53" x2="457" y2="116" class="fg-l"/>
<line x1="364" y1="197" x2="457" y2="134" class="fg-l"/>
<line x1="486" y1="125" x2="540" y2="125" class="fg-l"/>
<circle cx="200" cy="60" r="16" class="fg-b"/><text x="200" y="64" text-anchor="middle" class="fg-t sm">R1</text>
<circle cx="200" cy="190" r="16" class="fg-b"/><text x="200" y="194" text-anchor="middle" class="fg-t sm">R2</text>
<circle cx="350" cy="45" r="16" class="fg-b"/><text x="350" y="49" text-anchor="middle" class="fg-t sm">R3</text>
<circle cx="350" cy="205" r="16" class="fg-b"/><text x="350" y="209" text-anchor="middle" class="fg-t sm">R4</text>
<circle cx="470" cy="125" r="16" class="fg-b"/><text x="470" y="129" text-anchor="middle" class="fg-t sm">R5</text>
<rect x="266" y="43" width="18" height="18" rx="3" class="fg-b hot"/><text x="275" y="56" text-anchor="middle" class="fg-t sm mono">3</text>
<rect x="401" y="75" width="18" height="18" rx="3" class="fg-b hot"/><text x="410" y="88" text-anchor="middle" class="fg-t sm mono">1</text>
<rect x="266" y="188" width="18" height="18" rx="3" class="fg-b hot"/><text x="275" y="201" text-anchor="middle" class="fg-t sm mono">2</text>
<text x="283" y="126" class="fg-t sm warm">× 斷線</text>
<text x="330" y="240" text-anchor="middle" class="fg-t sm">每個封包各自找路：線斷了就繞道，到達順序亂了，由 TCP 排回去</text>
</svg><figcaption>沒有人替你保留整條路。每個封包都帶著地址，每到一個路由器（R1 到 R5）就被往前丟一站。R1 到 R4 那條線斷了，封包就改走別條。</figcaption></figure>
<p>這個設計換來兩個好處：</p>
<ul>
<li><b>共用</b>：你沒在傳資料的那一瞬間，線路馬上被別人的封包用掉。幾億人共用同一批海底電纜，靠的就是這個。這叫<b>統計多工</b>（statistical multiplexing）。</li>
<li><b>耐打</b>：沒有中心，沒有一條非走不可的路。一條線斷了，路由器更新地圖，封包就繞過去。</li>
</ul>
<p>代價是<b>沒有任何保證</b>。路由器的佇列滿了，新來的封包就被丟掉；兩個封包走不同路，後送的可能先到；排隊時間忽長忽短，就是抖動。所以網路層只管「盡力送」，可靠、按順序、不重複這些事，交給上面的 TCP。一張 2 MB 的圖片，在一般的乙太網路上大約要切成 1,400 個封包，每一個都可能遇到上面這些事。</p>

<h3><span class="badge lv1">基礎</span>二、封裝：信封裡裝信封</h3>
<p>上一課說每一層把上一層「包起來」。具體來說，就是每一層都在資料前面加一段自己的<b>標頭</b>（header）。像公司寄文件：文件先放進寫著「財務部」的內部公文袋（TCP 的連接埠），再裝進寫著公司地址的郵局信封（IP），郵差每跑一段，都會貼上一張新的運送單（乙太網路）。下面是一個 HTTPS 請求在線路上的真實樣子：</p>
<figure class="figure"><svg viewBox="0 0 680 296" class="fg" style="width:100%;max-width:680px" role="img" aria-label="一個乙太網路訊框的組成：乙太網路標頭 14 位元組、IP 標頭 20 位元組、TCP 標頭 20 位元組、最多 1460 位元組的資料、4 位元組檢查碼，以及每個標頭裡最重要的欄位">
<text x="335" y="18" text-anchor="middle" class="fg-t warm">乙太網路訊框（frame）</text>
<path d="M20 34 V26 H650 V34" class="fg-l warm"/>
<text x="350" y="50" text-anchor="middle" class="fg-t alt">IP 封包（packet）：最大 1,500 B，也就是 MTU</text>
<path d="M110 64 V58 H590 V64" class="fg-l alt"/>
<text x="400" y="82" text-anchor="middle" class="fg-t acc">TCP 區段（segment）</text>
<path d="M210 94 V88 H590 V94" class="fg-l on"/>
<rect x="20" y="100" width="90" height="46" class="fg-b warm"/><text x="65" y="119" text-anchor="middle" class="fg-t">乙太網路</text><text x="65" y="137" text-anchor="middle" class="fg-t sm">14 B</text>
<rect x="110" y="100" width="100" height="46" class="fg-b alt"/><text x="160" y="119" text-anchor="middle" class="fg-t">IP 標頭</text><text x="160" y="137" text-anchor="middle" class="fg-t sm">20 B</text>
<rect x="210" y="100" width="100" height="46" class="fg-b hot"/><text x="260" y="119" text-anchor="middle" class="fg-t">TCP 標頭</text><text x="260" y="137" text-anchor="middle" class="fg-t sm">20 B</text>
<rect x="310" y="100" width="280" height="46" class="fg-b"/><text x="450" y="119" text-anchor="middle" class="fg-t">資料：TLS 加密過的 HTTP</text><text x="450" y="137" text-anchor="middle" class="fg-t sm">最多 1,460 B</text>
<rect x="590" y="100" width="60" height="46" class="fg-b warm"/><text x="620" y="119" text-anchor="middle" class="fg-t">檢查碼</text><text x="620" y="137" text-anchor="middle" class="fg-t sm">4 B</text>
<rect x="20" y="166" width="200" height="118" rx="6" class="fg-b warm"/>
<text x="32" y="188" class="fg-t warm">乙太網路標頭</text>
<text x="32" y="210" class="fg-t sm">目的 MAC：下一站的網卡</text><text x="32" y="230" class="fg-t sm">來源 MAC：這一站的網卡</text><text x="32" y="250" class="fg-t sm">類型 0x0800：裡面是 IPv4</text><text x="32" y="270" class="fg-t sm">每經過一站就換新的</text>
<rect x="240" y="166" width="200" height="118" rx="6" class="fg-b alt"/>
<text x="252" y="188" class="fg-t alt">IP 標頭</text>
<text x="252" y="210" class="fg-t sm">來源 IP：203.0.113.7</text><text x="252" y="230" class="fg-t sm">目的 IP：198.51.100.20</text><text x="252" y="250" class="fg-t sm">TTL：64，每過一站減 1</text><text x="252" y="270" class="fg-t sm">協定：6 是 TCP，17 是 UDP</text>
<rect x="460" y="166" width="200" height="118" rx="6" class="fg-b hot"/>
<text x="472" y="188" class="fg-t acc">TCP 標頭</text>
<text x="472" y="210" class="fg-t sm">來源埠：52344（隨機）</text><text x="472" y="230" class="fg-t sm">目的埠：443（HTTPS）</text><text x="472" y="250" class="fg-t sm">序號、確認號：排順序用</text><text x="472" y="270" class="fg-t sm">旗標：SYN、ACK、FIN</text>
</svg><figcaption>由外往內：乙太網路訊框包著 IP 封包，IP 封包包著 TCP 區段，TCP 區段包著加密過的 HTTP。顏色對應下面三張欄位卡。</figcaption></figure>
<p>幾個欄位你在工作上一定會碰到：</p>
<ul>
<li><b>TTL</b>（time to live）：每過一個路由器減 1，減到 0 就丟掉，並回一個 ICMP 錯誤給來源。它防止繞圈圈的封包永遠活著。Linux 和 macOS 送出時預設是 64，Windows 是 128。所以 <code>ping</code> 回來 <code>ttl=52</code>，大概是一台 Linux，離你 12 站。</li>
<li><b>協定號碼</b>：IP 標頭告訴接收端「裡面是什麼」：6 是 TCP、17 是 UDP、1 是 ICMP（<code>ping</code> 和 <code>traceroute</code> 用的那個）。</li>
<li><b>MTU 和 MSS</b>：乙太網路一個 IP 封包最大 1,500 個位元組，叫 <b>MTU</b>（maximum transmission unit）。扣掉 IP 標頭 20、TCP 標頭 20，每個 TCP 區段最多裝 1,460 個位元組的資料，叫 <b>MSS</b>（maximum segment size）。這兩個數字在第八節會變成事故。</li>
<li><b>IPv6</b>：標頭固定 40 個位元組，TTL 改名叫 Hop Limit，拿掉了檢查碼，而且路由器不再幫你切封包。</li>
</ul>
<p>這也解釋了上一課的「layer 4」和「layer 7」負載平衡器：layer 4 只需要讀到 TCP 標頭（IP 和連接埠）就能轉送；layer 7 要讀 HTTP，就必須先把 TLS 解開，所以憑證得裝在它身上。</p>
<table>
<tr><th>你想看的</th><th>在哪一層</th><th>用什麼工具</th></tr>
<tr><td>到得了嗎、來回多久</td><td>網際網路層（ICMP）</td><td><code>ping</code></td></tr>
<tr><td>路上經過誰、卡在哪一站</td><td>網際網路層（TTL）</td><td><code>traceroute</code>、<code>mtr</code></td></tr>
<tr><td>連線有沒有建起來、在哪個連接埠</td><td>傳輸層</td><td><code>ss -tn</code>、<code>nc -vz</code></td></tr>
<tr><td>HTTP 標頭、狀態碼、TLS 憑證</td><td>應用層</td><td><code>curl -v</code></td></tr>
<tr><td>每一層的每一個欄位</td><td>全部</td><td><code>tcpdump</code>、Wireshark</td></tr>
</table>

<h3><span class="badge lv2">進階</span>三、一跳一跳：路由器只做一個決定</h3>
<p>路由器收到一個訊框，做的事情少得驚人：拆掉乙太網路標頭，看<b>目的 IP</b>，查自己的<b>路由表</b>（routing table），決定下一站，把 TTL 減 1，換上新的乙太網路標頭，送出去。整個過程在高階路由器上是晶片直接做的，一個封包只要幾微秒。</p>
<h4>查表的規則：最長的那個贏</h4>
<pre><code>目的網段            下一站          說明
0.0.0.0/0          203.0.113.1     預設路由：不知道就丟給上游
10.20.0.0/16       10.0.0.2
10.20.30.0/24      10.0.0.3
192.168.1.0/24     直接相連        自己的區域網路</code></pre>
<p>一個要去 <code>10.20.30.77</code> 的封包，同時符合三條：<code>/0</code>（什麼都符合）、<code>/16</code>（10.20.x.x）、<code>/24</code>（10.20.30.x）。規則是<b>最長前綴優先</b>（longest prefix match）：斜線後面的數字越大，範圍越小、越具體，就贏。所以它走 10.0.0.3。要去 <code>10.20.99.1</code> 的，只符合 <code>/16</code> 和 <code>/0</code>，走 10.0.0.2。要去 <code>8.8.8.8</code> 的，只符合預設路由，往上游丟。記住這條規則，第六節的 BGP 事故你就一看就懂。</p>
<p>知道下一站的 IP 之後，路由器還需要它的 MAC 位址，才能把乙太網路訊框送過去。它在同一個網段裡廣播問一聲「誰是 10.0.0.3？」，對方回答自己的 MAC，這叫 <b>ARP</b>，答案會快取一陣子。</p>
<figure class="figure"><svg viewBox="0 0 680 270" class="fg" style="width:100%;max-width:680px" role="img" aria-label="封包從你的電腦經過家用路由器、網路業者、海纜對岸到伺服器，每一段的 TTL、來源 IP、目的 IP、MAC 如何變化">
<rect x="20" y="40" width="100" height="44" rx="6" class="fg-b alt"/><text x="70" y="67" text-anchor="middle" class="fg-t">你的電腦</text>
<rect x="150" y="40" width="100" height="44" rx="6" class="fg-b"/><text x="200" y="67" text-anchor="middle" class="fg-t">家用路由器</text>
<rect x="280" y="40" width="100" height="44" rx="6" class="fg-b"/><text x="330" y="67" text-anchor="middle" class="fg-t">網路業者</text>
<rect x="410" y="40" width="100" height="44" rx="6" class="fg-b"/><text x="460" y="67" text-anchor="middle" class="fg-t">海纜對岸</text>
<rect x="560" y="40" width="100" height="44" rx="6" class="fg-b alt"/><text x="610" y="67" text-anchor="middle" class="fg-t">伺服器</text>
<line x1="120" y1="62" x2="142" y2="62" class="fg-l"/><polygon points="150,62 142,57.5 142,66.5" class="fg-a"/>
<line x1="250" y1="62" x2="272" y2="62" class="fg-l"/><polygon points="280,62 272,57.5 272,66.5" class="fg-a"/>
<line x1="380" y1="62" x2="402" y2="62" class="fg-l"/><polygon points="410,62 402,57.5 402,66.5" class="fg-a"/>
<line x1="510" y1="62" x2="552" y2="62" class="fg-l"/><polygon points="560,62 552,57.5 552,66.5" class="fg-a"/>
<text x="200" y="102" text-anchor="middle" class="fg-t sm warm">NAT：換掉來源 IP</text>
<text x="135" y="122" text-anchor="middle" class="fg-t sm">第 1 段</text><text x="265" y="122" text-anchor="middle" class="fg-t sm">第 2 段</text><text x="395" y="122" text-anchor="middle" class="fg-t sm">第 3 段</text><text x="535" y="122" text-anchor="middle" class="fg-t sm">第 4 段</text>
<text x="20" y="146" class="fg-t">TTL</text>
<text x="135" y="146" text-anchor="middle" class="fg-t mono">64</text><text x="265" y="146" text-anchor="middle" class="fg-t mono">63</text><text x="395" y="146" text-anchor="middle" class="fg-t mono">62</text><text x="535" y="146" text-anchor="middle" class="fg-t mono">61</text>
<text x="20" y="172" class="fg-t">來源 IP</text>
<text x="135" y="172" text-anchor="middle" class="fg-t sm mono">192.168.1.23</text><text x="265" y="172" text-anchor="middle" class="fg-t sm mono warm">203.0.113.7</text><text x="395" y="172" text-anchor="middle" class="fg-t sm mono">203.0.113.7</text><text x="535" y="172" text-anchor="middle" class="fg-t sm mono">203.0.113.7</text>
<text x="20" y="198" class="fg-t">目的 IP</text>
<text x="135" y="198" text-anchor="middle" class="fg-t sm mono">198.51.100.20</text><text x="265" y="198" text-anchor="middle" class="fg-t sm mono">198.51.100.20</text><text x="395" y="198" text-anchor="middle" class="fg-t sm mono">198.51.100.20</text><text x="535" y="198" text-anchor="middle" class="fg-t sm mono">198.51.100.20</text>
<text x="20" y="224" class="fg-t">MAC</text>
<text x="135" y="224" text-anchor="middle" class="fg-t sm acc">電腦→家用</text><text x="265" y="224" text-anchor="middle" class="fg-t sm acc">家用→業者</text><text x="395" y="224" text-anchor="middle" class="fg-t sm acc">業者→對岸</text><text x="535" y="224" text-anchor="middle" class="fg-t sm acc">對岸→伺服器</text>
<text x="340" y="256" text-anchor="middle" class="fg-t sm">IP 位址一路不變（家用路由器做 NAT 時例外），TTL 每站減 1，MAC 每一段都換新</text>
</svg><figcaption>IP 標頭是「從哪裡到哪裡」的整趟行程，乙太網路標頭只是「這一段從誰到誰」。真實路徑通常是 10 到 20 站，這裡只畫 4 段。</figcaption></figure>
<h4>traceroute 其實是在利用 TTL</h4>
<p>traceroute 故意送出 TTL 是 1 的封包：第一個路由器把它減成 0，丟掉，回一個「逾時」的 ICMP，裡面帶著自己的位址。再送 TTL 2 的，第二個路由器回報。一路加上去，就把整條路畫出來了。讀結果時有三件事要知道：</p>
<ul>
<li><b>一排星號</b>：那一站的路由器不回 ICMP，或限制了回覆的速度。只要後面的站有回應，它就有在轉送，沒有問題。</li>
<li><b>中間某站特別慢，後面又變快</b>：路由器轉送封包是晶片在做，產生 ICMP 回覆卻是交給自己的 CPU，優先權很低。這種「慢」只是它懶得回你，不是真的塞車。延遲要是從某一站開始<b>一路</b>變高，問題才在那裡。</li>
<li><b>去回不同路</b>：你看到的是「去程」。回程是對方的路由器自己決定的，可能走完全不同的路線。兩邊都跑一次 traceroute，才看得到全貌。</li>
</ul>

<h3><span class="badge lv2">進階</span>四、延遲、頻寬、遺失：三個數字各管什麼</h3>
<p>用高速公路來想：<b>延遲</b>是這條路有多長，<b>頻寬</b>是有幾線道，<b>封包遺失</b>是半路翻車、要從頭再開一次的比例，<b>抖動</b>是今天塞、明天不塞。</p>
<p>延遲的下限是物理定律。光在光纖裡大約每秒跑 20 萬公里，也就是每 100 公里大約多 1 毫秒的來回時間。台北到東京直線約 2,100 公里，理論上來回至少 21 毫秒；實際大約 35 毫秒，因為海纜不是直線，路上的路由器和排隊也要時間。台北到洛杉磯約 11,000 公里，理論下限約 110 毫秒，實際約 140 毫秒。這部分花再多錢都買不到，只能<b>把伺服器搬近一點</b>。</p>
<p>一個封包的延遲，可以拆成四塊：</p>
<table>
<tr><th>部分</th><th>由什麼決定</th><th>大約多少（數量級）</th></tr>
<tr><td>傳播（propagation）</td><td>距離</td><td>每 100 公里來回約 1 毫秒</td></tr>
<tr><td>傳輸（transmission）</td><td>封包大小 ÷ 頻寬</td><td>1,500 B 在 10 Mbps 上要 1.2 毫秒，在 1 Gbps 上只要 12 微秒</td></tr>
<tr><td>排隊（queuing）</td><td>前面還有多少封包</td><td>從 0 到幾百毫秒都有可能，抖動主要來自這裡</td></tr>
<tr><td>處理（processing）</td><td>路由器查表</td><td>微秒等級</td></tr>
</table>
<figure class="figure"><svg viewBox="0 0 660 256" class="fg" style="width:100%;max-width:660px" role="img" aria-label="把連線想成一條水管：長度是延遲，粗細是頻寬，管內同時在路上的資料量是兩者相乘；下方比較下載小網頁和大檔案時，時間分別花在等來回和傳資料">
<text x="330" y="22" text-anchor="middle" class="fg-t">長度 = 延遲：台北到洛杉磯，來回大約 140 ms</text>
<line x1="118" y1="36" x2="542" y2="36" class="fg-l dim"/><polygon points="110,36 118,31.5 118,40.5" class="fg-a"/><polygon points="550,36 542,31.5 542,40.5" class="fg-a"/>
<rect x="110" y="48" width="440" height="56" rx="28" class="fg-b alt"/>
<rect x="130" y="68" width="16" height="16" rx="2" class="fg-b hot"/><rect x="155" y="68" width="16" height="16" rx="2" class="fg-b hot"/><rect x="180" y="68" width="16" height="16" rx="2" class="fg-b hot"/><rect x="205" y="68" width="16" height="16" rx="2" class="fg-b hot"/><rect x="230" y="68" width="16" height="16" rx="2" class="fg-b hot"/><rect x="255" y="68" width="16" height="16" rx="2" class="fg-b hot"/><rect x="280" y="68" width="16" height="16" rx="2" class="fg-b hot"/><rect x="305" y="68" width="16" height="16" rx="2" class="fg-b hot"/><rect x="330" y="68" width="16" height="16" rx="2" class="fg-b hot"/><rect x="355" y="68" width="16" height="16" rx="2" class="fg-b hot"/><rect x="380" y="68" width="16" height="16" rx="2" class="fg-b hot"/><rect x="405" y="68" width="16" height="16" rx="2" class="fg-b hot"/><rect x="430" y="68" width="16" height="16" rx="2" class="fg-b hot"/><rect x="455" y="68" width="16" height="16" rx="2" class="fg-b hot"/><rect x="480" y="68" width="16" height="16" rx="2" class="fg-b hot"/><rect x="505" y="68" width="16" height="16" rx="2" class="fg-b hot"/>
<line x1="566" y1="56" x2="566" y2="96" class="fg-l dim"/><polygon points="566,48 561.5,56 570.5,56" class="fg-a"/><polygon points="566,104 561.5,96 570.5,96" class="fg-a"/>
<text x="578" y="74" class="fg-t">粗細 = 頻寬</text><text x="578" y="92" class="fg-t sm">100 Mbps</text>
<text x="330" y="128" text-anchor="middle" class="fg-t sm">管子裡同時在路上的資料 = 頻寬 × 來回時間 ≈ 1.75 MB</text>
<text x="330" y="146" text-anchor="middle" class="fg-t sm">TCP「先送出、還沒被確認」的量至少要這麼大，才塞得滿</text>
<text x="20" y="181" class="fg-t">10 KB 網頁</text>
<rect x="120" y="166" width="416" height="22" class="fg-b alt"/><rect x="536" y="166" width="4" height="22" class="fg-b hot"/>
<text x="550" y="181" class="fg-t sm">約 0.42 秒</text>
<text x="20" y="217" class="fg-t">100 MB 檔案</text>
<rect x="120" y="202" width="21" height="22" class="fg-b alt"/><rect x="141" y="202" width="399" height="22" class="fg-b hot"/>
<text x="550" y="217" class="fg-t sm">約 8.4 秒</text>
<rect x="120" y="236" width="14" height="12" class="fg-b alt"/><text x="140" y="246" class="fg-t sm">等來回（延遲決定）</text>
<rect x="320" y="236" width="14" height="12" class="fg-b hot"/><text x="340" y="246" class="fg-t sm">真的在傳（頻寬決定）</text>
</svg><figcaption>小東西的時間幾乎全花在等來回，大東西才看頻寬。兩條長條各自畫成一樣長，看的是比例，不是絕對時間。</figcaption></figure>
<p>算一次就懂。從台北抓洛杉磯一個 10 KB 的網頁，用全新的連線：TCP 握手 1 個來回，TLS 1.3 握手 1 個來回，送出請求、拿到回應再 1 個來回，一共 3 × 140 = 420 毫秒。資料本身在 100 Mbps 上只要 0.8 毫秒。把頻寬升級到 1 Gbps，省下的是那 0.8 毫秒裡的 0.7 毫秒，使用者完全感覺不到。真正有效的是減少來回、縮短距離：重用連線、用 CDN 把內容放到使用者附近、合併零碎的請求。</p>
<p>反過來，下載 100 MB 的檔案要 8 秒，延遲只佔 0.42 秒，這時頻寬才是重點。可是有個前提：管子要塞得滿。圖中間那個 1.75 MB，叫<b>頻寬延遲乘積</b>（bandwidth-delay product）。如果某一端的 TCP 視窗卡在 64 KB（老舊設定、或中間某個代理伺服器的緩衝太小），最高速度就是 64 KB ÷ 140 毫秒 ≈ 3.7 Mbps，就算你付的是 1 Gbps 的錢。</p>

<h3><span class="badge lv3">專業</span>五、TCP 的擁塞控制：在看不到路的情況下開車</h3>
<p>TCP 面對一個很難的問題：它不知道這條路的瓶頸有多寬，而且同一條路上還有幾百萬條別人的連線。送太慢，浪費；送太快，路由器的佇列塞爆，大家一起掉封包。它的解法是一邊送、一邊試探，手上隨時有一個數字叫<b>擁塞視窗</b>（congestion window，cwnd）：「現在可以有多少資料在路上、還沒被對方確認」。</p>
<h4>第一階段：慢啟動，其實一點都不慢</h4>
<p>新連線一開始，cwnd 是 10 個區段（現代 Linux 的預設），大約 14.6 KB。每收到一個確認，cwnd 就加 1 個區段，結果是<b>每一個來回翻倍</b>：</p>
<table>
<tr><th>第幾個來回</th><th>這一輪送出</th><th>累計送出</th></tr>
<tr><td>1</td><td>14.6 KB</td><td>14.6 KB</td></tr>
<tr><td>2</td><td>29.2 KB</td><td>43.8 KB</td></tr>
<tr><td>3</td><td>58.4 KB</td><td>102.2 KB</td></tr>
<tr><td>4</td><td>116.8 KB</td><td>219 KB</td></tr>
<tr><td>5</td><td>233.6 KB</td><td>452.6 KB</td></tr>
<tr><td>6</td><td>467.2 KB</td><td>919.8 KB</td></tr>
</table>
<p>在 140 毫秒的路上，一條新連線光是送完 1 MB，就要 7 個來回，將近 1 秒，跟你的頻寬多大無關。這張表解釋了三個常見的最佳化：<b>重用連線</b>（已經暖好的連線，cwnd 早就很大了）、<b>CDN</b>（來回時間短，翻倍就快）、<b>把首屏最關鍵的內容壓在前 14 KB 左右</b>（第一個來回就能送完）。</p>
<h4>第二階段：小心地加，用力地減</h4>
<figure class="figure"><svg viewBox="0 0 660 256" class="fg" style="width:100%;max-width:660px" role="img" aria-label="擁塞視窗隨時間變化的鋸齒圖：慢啟動時每個來回翻倍，掉封包就砍半，之後每個來回只加一點，再掉再砍半">
<text x="60" y="22" class="fg-t">一次能送多少（擁塞視窗）</text>
<line x1="60" y1="38" x2="60" y2="220" class="fg-l"/><polygon points="60,30 55.5,38 64.5,38" class="fg-a"/>
<line x1="60" y1="220" x2="622" y2="220" class="fg-l"/><polygon points="630,220 622,215.5 622,224.5" class="fg-a"/>
<line x1="60" y1="140" x2="620" y2="140" class="fg-l dim dash"/>
<text x="620" y="155" text-anchor="end" class="fg-t sm">實際容量</text>
<path d="M60 214 L90 208 L120 196 L150 172 L180 124 L180 172 L360 136 L360 178 L540 142 L540 181 L620 165" class="fg-l on"/>
<circle cx="180" cy="124" r="4" class="fg-b warm"/><circle cx="360" cy="136" r="4" class="fg-b warm"/><circle cx="540" cy="142" r="4" class="fg-b warm"/>
<text x="68" y="112" class="fg-t acc">慢啟動</text><text x="68" y="128" class="fg-t sm">每個來回翻倍</text>
<text x="188" y="112" class="fg-t sm warm">掉封包，砍半</text>
<text x="270" y="194" text-anchor="middle" class="fg-t sm">避免擁塞：每個來回只加 1</text>
<text x="622" y="244" text-anchor="end" class="fg-t sm">時間（每一格是一次來回）</text>
</svg><figcaption>TCP 永遠在試探：加到掉封包，就知道「太多了」，砍掉一截再慢慢加。所以長時間下載的速度曲線是鋸齒狀的，在實際容量上下徘徊。</figcaption></figure>
<p>掉了封包，TCP 就當作「路塞了」，把 cwnd 砍掉一截，接著每個來回只加 1 個區段。這叫 <b>AIMD</b>（additive increase, multiplicative decrease）：加的時候很小心，減的時候很用力。大家都這樣做，幾百萬條連線就能自己分攤一條路，不需要任何中央指揮。Linux 預設的演算法叫 CUBIC，掉封包時砍到原本的七成，回升的曲線也比直線聰明，但精神一樣。</p>
<h4>為什麼 1% 的遺失這麼傷</h4>
<p>傳統 TCP 把「掉封包」當成唯一的塞車訊號。有一個常用的估算公式（Mathis 公式，針對傳統的 Reno 類演算法）：<b>速度上限 ≈ (MSS ÷ 來回時間) × (1.22 ÷ √遺失率)</b>。代入台北到美西：MSS 1,460 B、來回 140 毫秒、遺失 1%，算出來大約 1 Mbps。不管你的線路是 100 Mbps 還是 1 Gbps。距離越遠，同樣的遺失率傷得越重。CUBIC 和下面的 BBR 表現好一些，但趨勢不變。</p>
<p>更糟的是，Wi-Fi 和行動網路的遺失常常不是塞車，而是訊號干擾。TCP 分不出來，照樣減速。</p>
<h4>另外兩個會讓你半夜被叫醒的現象</h4>
<ul>
<li><b>緩衝膨脹</b>（bufferbloat）：有些路由器的佇列很大，塞車時不丟封包，而是一直排隊。TCP 收不到「掉封包」的訊號，就一直加速，佇列越排越長。典型的症狀：家裡有人在上傳大檔案，你打遊戲的延遲從 20 毫秒跳到 500 毫秒以上。解法是讓路由器主動管理佇列（例如 fq_codel、CAKE 這類演算法）。</li>
<li><b>隊頭阻塞</b>（head-of-line blocking）：TCP 保證按順序交貨。第 5 個封包掉了，就算第 6 到第 50 個都到了，也得等第 5 個重送回來，才能一起交給程式。HTTP/2 把很多請求塞在同一條 TCP 連線上，一個封包掉了，所有請求一起等。HTTP/3 改走以 UDP 為基礎的 QUIC，每個請求各自排順序，一個掉了不影響別人。</li>
</ul>
<p>Google 在 2016 年發表的 <b>BBR</b> 換了一個思路：不等掉封包，而是持續量測「最大頻寬」和「最小來回時間」，照這兩個數字決定送多快。在遺失率高、距離長的路上，它通常快很多。Linux 上用一行 sysctl 就能把預設演算法改成 bbr。</p>
<h4>遊戲為什麼喜歡 UDP</h4>
<p>即時對戰的位置更新，遲到的資料就是沒用的資料：第 5 個封包裡的位置掉了，第 6 個已經帶著更新的位置來了，根本不需要重送。用 TCP 的話，掉一個封包，後面所有更新都要等一個來回以上，畫面就「卡一下」。所以 Unity、Unreal 這類引擎的即時網路層多半建在 UDP 上，自己決定哪些資料要可靠、哪些丟了就算了。瀏覽器遊戲只有 WebSocket（跑在 TCP 上）的話，在行動網路上就要靠插值和預測來掩蓋這些卡頓；需要更即時的，可以看 WebRTC 的資料通道或 WebTransport。</p>

<h3><span class="badge lv3">專業</span>六、BGP：網路業者之間怎麼交換地圖</h3>
<p>路由表裡那幾萬、幾十萬條網段是哪裡來的？在一家公司內部，可以手動設定，或用內部的路由協定自動算。但在網際網路上，沒有人有權力替所有人畫地圖。每個大型網路（叫<b>自治系統</b>，autonomous system，每個都有一個 AS 編號，例如 Google 是 AS15169、Cloudflare 是 AS13335、中華電信的 HiNet 是 AS3462）只能跟鄰居講自己知道的事，這套「講法」就是 <b>BGP</b>。</p>
<ul>
<li><b>公告</b>：「我到得了 <code>203.0.113.0/24</code>，路徑是 AS 甲、AS 乙。」鄰居收到後，把自己的編號加在路徑前面，再轉告它的鄰居。路徑裡已經有自己的編號就丟掉，這樣就不會繞圈。</li>
<li><b>選路看生意</b>：同一個目的地收到好幾條路，BGP 不是單純選最短的，而是先看商業關係：客戶給的路優先（對方付錢），然後是對等互連的夥伴（互不收費），最後才是自己要付錢的上游。同樣條件下，才比路徑長短。</li>
<li><b>靠信任</b>：BGP 最初的設計沒有任何驗證。誰都可以宣告任何網段，全靠鄰居自己過濾。全球的 IPv4 路由表現在有接近一百萬條網段，每一條都是這樣一手傳一手傳出來的。</li>
</ul>
<figure class="figure"><svg viewBox="0 0 680 296" class="fg" style="width:100%;max-width:680px" role="img" aria-label="2008 年 YouTube 事件：YouTube 宣告 /22，巴基斯坦電信誤宣告更具體的 /24，PCCW 沒有過濾就轉告全世界，依最長前綴規則，流量全被送進巴基斯坦電信">
<rect x="20" y="30" width="200" height="60" rx="6" class="fg-b hot"/><text x="120" y="54" text-anchor="middle" class="fg-t acc">YouTube（AS36561）</text><text x="120" y="76" text-anchor="middle" class="fg-t sm mono">宣告 208.65.152.0/22</text>
<text x="120" y="112" text-anchor="middle" class="fg-t sm">/22 不夠具體，輸了</text>
<rect x="20" y="190" width="200" height="60" rx="6" class="fg-b warm"/><text x="120" y="214" text-anchor="middle" class="fg-t warm">巴基斯坦電信（AS17557）</text><text x="120" y="236" text-anchor="middle" class="fg-t sm mono">宣告 208.65.153.0/24</text>
<rect x="270" y="110" width="170" height="60" rx="6" class="fg-b"/><text x="355" y="134" text-anchor="middle" class="fg-t">PCCW（AS3491）</text><text x="355" y="156" text-anchor="middle" class="fg-t sm">沒過濾，照樣轉告</text>
<rect x="490" y="110" width="170" height="60" rx="6" class="fg-b alt"/><text x="575" y="134" text-anchor="middle" class="fg-t alt">全世界的路由器</text><text x="575" y="156" text-anchor="middle" class="fg-t sm">/24 比 /22 具體</text>
<path d="M220 60 H245 V128 H262" class="fg-l on"/><polygon points="270,128 262,123.5 262,132.5" class="fg-a on"/>
<text x="228" y="50" class="fg-t sm acc">公告 /22</text>
<path d="M220 220 H245 V152 H262" class="fg-l warm"/><polygon points="270,152 262,147.5 262,156.5" class="fg-a warm"/>
<text x="228" y="238" class="fg-t sm warm">公告 /24</text>
<line x1="440" y1="140" x2="482" y2="140" class="fg-l"/><polygon points="490,140 482,135.5 482,144.5" class="fg-a"/>
<path d="M575 170 V280 H120 V258" class="fg-l warm dash"/><polygon points="120,250 115.5,258 124.5,258" class="fg-a warm"/>
<text x="350" y="272" text-anchor="middle" class="fg-t sm warm">要去 208.65.153.x 的流量，全被送進巴基斯坦電信</text>
</svg><figcaption>上面兩條是「公告」，下面那條虛線是流量真正走的路。最長前綴優先的規則，讓一則更具體的錯誤公告，蓋過了正確的那一則。</figcaption></figure>
<h4>三個真實事故</h4>
<ul>
<li><b>2008 年 2 月，YouTube 全球斷線約兩小時</b>：巴基斯坦政府要求國內封鎖 YouTube，巴基斯坦電信的做法是宣告一條比 YouTube 更具體的 /24，把流量導進黑洞。這則公告本來只該在國內用，卻送給了上游 PCCW，PCCW 沒有過濾就轉告全世界。就像上圖，全世界的路由器都依最長前綴規則，把 YouTube 的流量送去巴基斯坦。</li>
<li><b>2021 年 10 月 4 日，Facebook 斷線約六小時</b>：一次例行維護的指令，意外切斷了骨幹網路和所有資料中心的連線。Facebook 的 DNS 伺服器被設計成「連不到資料中心，就撤回自己的 BGP 公告」，於是全部撤回，全世界都查不到 facebook.com 的位址。更麻煩的是，內部的工具和門禁也依賴同一套網路，工程師得實際進到機房才修得好。</li>
<li><b>2018 年 4 月，Amazon Route 53 的位址被劫持</b>：攻擊者用 BGP 宣告了 Route 53 的部分位址，把一個加密貨幣錢包網站的 DNS 查詢導到假伺服器，再把使用者帶到假網站騙走資產。這是 BGP 被拿來當攻擊工具的例子。</li>
</ul>
<h4>現在怎麼防</h4>
<p><b>RPKI</b> 讓位址的持有者用密碼學簽一份聲明（ROA）：「這個網段只有 AS X 可以宣告，最多切到 /24」。有做<b>路由來源驗證</b>（route origin validation）的業者，收到不符合的公告就直接丟掉。2008 年那種「宣告者根本不是主人」的錯誤，它擋得住；但如果攻擊者偽造的是路徑中間的部分、來源編號照抄，它就擋不住，這部分還有新的標準在推動。其他基本功包括：只接受客戶擁有的網段、限制每個鄰居最多宣告幾條。</p>
<p>你自己大概不會去設定 BGP，但它影響你的方式很直接：雲端業者、CDN、DNS 服務都靠它；某家大網站「整個不見」時，先查查是不是路由層出了事，例如看 Cloudflare Radar 這類公開的路由監控。還有 Facebook 那一課：<b>修復用的工具，不能依賴正在壞的那個東西</b>。</p>

<h3><span class="badge lv4">專家</span>七、Anycast：同一個位址，全世界幾百個地方同時宣告</h3>
<p>上一課你 <code>ping 1.1.1.1</code>，大概只花了幾毫秒。這個位址的伺服器不可能剛好在你家隔壁，除非，它在很多地方都有。這就是 <b>anycast</b>：同一個網段，從全世界幾百個機房同時用 BGP 宣告出去。每個網路業者照自己的 BGP 規則，挑「最近」的那一個，你的封包就送到離你最近的機房。</p>
<ul>
<li><b>誰在用</b>：公共 DNS（1.1.1.1、8.8.8.8）、DNS 的根伺服器、CDN、DDoS 防護服務。攻擊流量也會被分散到全球各個機房，沒有單一機房被打爆。</li>
<li><b>「最近」是 BGP 說的最近</b>：不一定是地理上最近。台灣的使用者被送到香港或東京的機房，是很常見的事，看你的網路業者跟誰互連。</li>
<li><b>對長連線不友善</b>：路由一變，同一條 TCP 連線的後續封包可能被送到另一個機房，那邊不認得這條連線，就斷了。所以它最適合 DNS 這種一來一回的短交易；CDN 能用在 HTTP 上，是因為它們花了很多工夫讓路由保持穩定。</li>
</ul>

<h3><span class="badge lv4">專家</span>八、封包大小的暗坑：MTU 黑洞，和偽造來源的放大攻擊</h3>
<p>1,500 這個數字，只要中間多包一層，就不成立了。VPN、隧道、容器的虛擬網路，都在原本的封包外面再加一層標頭：</p>
<table>
<tr><th>多包的這一層</th><th>多佔的位元組</th><th>裡面能用的 MTU</th></tr>
<tr><td>PPPoE（很多家用光纖撥號）</td><td>8</td><td>1,492</td></tr>
<tr><td>VXLAN（不少 Kubernetes 網路外掛用它）</td><td>50</td><td>1,450</td></tr>
<tr><td>WireGuard（wg-quick 的預設）</td><td>最多 80</td><td>1,420</td></tr>
</table>
<p>正常情況下，這不是問題。送封包的一方會在 IP 標頭設「不要切割」（DF），路上哪個路由器發現封包太大，就丟掉它，並回一個 ICMP 告訴來源：「太大了，請改成 1,420」。來源調小，以後就順了。這叫<b>路徑 MTU 探索</b>（path MTU discovery）。</p>
<figure class="figure"><svg viewBox="0 0 680 248" class="fg" style="width:100%;max-width:680px" role="img" aria-label="MTU 黑洞：小封包一路通過；1500 位元組的大封包在隧道入口被丟掉，回報太大的 ICMP 又被伺服器前的防火牆擋掉，伺服器永遠不知道要縮小封包">
<text x="340" y="44" text-anchor="middle" class="fg-t sm acc">小封包（握手、短回應）：一路通過</text>
<line x1="60" y1="60" x2="612" y2="60" class="fg-l on"/><polygon points="620,60 612,55.5 612,64.5" class="fg-a on"/>
<rect x="10" y="100" width="100" height="50" rx="6" class="fg-b alt"/><text x="60" y="121" text-anchor="middle" class="fg-t">伺服器</text><text x="60" y="140" text-anchor="middle" class="fg-t sm">送 1,500 B</text>
<rect x="140" y="100" width="120" height="50" rx="6" class="fg-b warm"/><text x="200" y="121" text-anchor="middle" class="fg-t">防火牆</text><text x="200" y="140" text-anchor="middle" class="fg-t sm">擋掉所有 ICMP</text>
<rect x="290" y="100" width="100" height="50" rx="6" class="fg-b"/><text x="340" y="129" text-anchor="middle" class="fg-t">路由器</text>
<rect x="420" y="100" width="120" height="50" rx="6" class="fg-b"/><text x="480" y="121" text-anchor="middle" class="fg-t">隧道入口</text><text x="480" y="140" text-anchor="middle" class="fg-t sm">MTU 只有 1,420</text>
<rect x="570" y="100" width="100" height="50" rx="6" class="fg-b alt"/><text x="620" y="129" text-anchor="middle" class="fg-t">用戶端</text>
<line x1="110" y1="125" x2="140" y2="125" class="fg-l"/><line x1="260" y1="125" x2="290" y2="125" class="fg-l"/><line x1="390" y1="125" x2="420" y2="125" class="fg-l"/><line x1="540" y1="125" x2="570" y2="125" class="fg-l"/>
<path d="M60 150 V180 H462" class="fg-l warm"/>
<text x="480" y="186" text-anchor="middle" class="fg-t lg warm">×</text>
<text x="265" y="172" text-anchor="middle" class="fg-t sm warm">1,500 B 的大封包</text>
<text x="512" y="186" class="fg-t sm warm">太大，丟掉</text>
<path d="M500 150 V212 H216" class="fg-l alt dash"/>
<text x="200" y="218" text-anchor="middle" class="fg-t lg warm">×</text>
<text x="358" y="206" text-anchor="middle" class="fg-t sm alt">ICMP：「太大了，請改成 1,420」</text>
<text x="200" y="240" text-anchor="middle" class="fg-t sm warm">被擋，伺服器永遠不知道</text>
</svg><figcaption>伺服器只會不斷重送同一個太大的封包，每次都在同一個地方被丟掉。握手和小請求都正常，所以很難一眼看出是網路的問題。</figcaption></figure>
<p>問題出在「擋掉所有 ICMP」這個看起來很安全的設定。回報的 ICMP 進不來，伺服器永遠不知道要縮小，就變成一個<b>黑洞</b>。症狀非常有辨識度：</p>
<ul>
<li>連線建得起來，小頁面正常，大檔案下載或上傳卡住不動。</li>
<li>SSH 登得進去，打一個輸出很長的指令就整個凍住。</li>
<li>HTTPS 卡在握手：TLS 握手裡的憑證鏈常常有好幾 KB，是第一個「大封包」。</li>
</ul>
<p>解法：防火牆要放行 ICMP 的「需要分割」（IPv4 的 type 3 code 4）和 IPv6 的「封包太大」，後者對 IPv6 來說是必要的；在隧道的入口做 <b>MSS 鉗制</b>（MSS clamping），在 TCP 握手時就把 MSS 改小（例如 1,420 - 20 - 20 = 1,380）；容器網路的 MTU 設成扣掉外層標頭之後的數字。Linux 也有不依賴 ICMP 的探測機制可以開啟（<code>tcp_mtu_probing</code>），當作最後一道保險。</p>
<h4>偽造來源，借刀殺人</h4>
<p>IP 標頭裡的「來源位址」是送的人自己寫的，路上沒有人檢查。攻擊者送一個很小的 UDP 請求給一台公開的伺服器，把來源寫成受害者的 IP，伺服器就把一個大很多的回應送給受害者。這叫<b>反射放大攻擊</b>（reflection amplification）：DNS、NTP 都被這樣用過；開在公網上的 memcached 可以把流量放大好幾萬倍，2018 年 GitHub 就被這樣打出約 1.35 Tbps 的流量。</p>
<p>TCP 比較不會被這樣利用，因為要先完成三向交握，偽造的來源收不到回應，握手做不完。防禦的根本是業者在網路入口過濾「來源位址不屬於這個客戶」的封包（業界叫 BCP 38）；你能做的是：<b>不要把 UDP 服務（memcached、沒設限的 DNS 遞迴查詢）開在公網上</b>。</p>

<h3>九、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>頻寬越大，網頁就越快</td><td>小檔案的時間幾乎都花在來回上。減少來回、縮短距離，比加頻寬有用得多。</td></tr>
<tr><td>ping 不通，伺服器就是掛了</td><td>很多主機和雲端的安全群組不回 ICMP。用 <code>curl</code> 或 <code>nc -vz</code> 直接測那個連接埠。</td></tr>
<tr><td>traceroute 中間某站延遲很高，問題就在那裡</td><td>只有從那一站開始「一路」都變高才算。單一站慢，常常只是它回 ICMP 回得懶。</td></tr>
<tr><td>1% 的封包遺失無傷大雅</td><td>在遠距離的連線上，1% 就能把傳統 TCP 的速度壓到 1 Mbps 左右。</td></tr>
<tr><td>擋掉所有 ICMP 比較安全</td><td>會弄壞路徑 MTU 探索，造成「小的通、大的卡」的黑洞。該放行的類型要放行。</td></tr>
<tr><td>網際網路有一個中心在管路線</td><td>沒有。幾萬個自治系統彼此用 BGP 交換公告，各自依商業關係決定怎麼走。</td></tr>
</table>

<h3>十、跟你的工作連起來</h3>
<ul>
<li><b>前端（Vue、TypeScript）</b>：合併零碎的 API 呼叫、重用連線、對第三方網域用 <code>preconnect</code> 提早握手；靜態資源放 CDN；首屏最關鍵的 HTML 和 CSS 越小越好。</li>
<li><b>遊戲（Cocos、Unity）</b>：即時同步要能容忍遺失和抖動：插值、預測、只送最新狀態；選機房前先量玩家到各區域的來回時間；瀏覽器遊戲走 WebSocket 時，要預期行動網路上的隊頭阻塞。</li>
<li><b>後端（Node.js、Go）</b>：跨區域的呼叫一次就是幾十毫秒，服務和資料庫要放同一區；用連線池重用 TCP 連線，省掉握手，也省掉慢啟動。</li>
<li><b>DevOps、雲端</b>：安全群組放行必要的 ICMP；容器網路和 VPN 注意 MTU；用 <code>mtr</code> 長時間觀察遺失落在哪一段；大網站集體出事時，先看公開的路由監控，判斷是不是自己的問題。</li>
</ul>

<h3>十一、面試會怎麼問</h3>
<p>先自己講一遍，再打開參考答案。</p>
<ol>
<li>「一個封包從你的電腦到伺服器，一路上每一站做了什麼？哪些欄位會變、哪些不會？」</li>
<li>「延遲和頻寬有什麼不同？為什麼把頻寬從 100 Mbps 升級到 1 Gbps，網頁不一定變快？」</li>
<li>「TCP 怎麼決定一次送多少資料？什麼是慢啟動？為什麼長距離加上一點點遺失，速度就掉很多？」</li>
<li>「traceroute 的原理是什麼？為什麼會有一排星號？」</li>
<li>「BGP 是什麼？舉一個 BGP 造成大規模斷線的例子，以及現在怎麼防。」</li>
<li>「使用者回報：網站連得上，小頁面正常，但下載大檔或上傳就卡住。你會懷疑什麼？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>每個路由器收到訊框後，拆掉乙太網路標頭，依目的 IP 在路由表做最長前綴比對，決定下一站；把 TTL 減 1（到 0 就丟棄並回 ICMP），重算 IP 標頭檢查碼；用 ARP 查到下一站的 MAC，包上新的乙太網路標頭送出。來源和目的 IP 一路不變，除非經過 NAT（家用路由器會把私有來源位址換成公有位址）；TTL 每站遞減；MAC 每一段都換。</li>
<li>延遲是資料來回一趟的時間，主要受距離（光速）和排隊影響；頻寬是每秒能傳的資料量。小請求的時間主要花在握手和請求的來回次數上，例如跨太平洋三個來回就是 420 毫秒，資料本身只要不到 1 毫秒，所以加頻寬幾乎沒有幫助；要改善得減少來回次數、重用連線、用 CDN 縮短距離。大檔案才是頻寬決定，而且 TCP 視窗要至少等於頻寬延遲乘積，才塞得滿。</li>
<li>TCP 送出的量取決於對方的接收視窗和自己估計的擁塞視窗中較小的那個。新連線從約 10 個區段開始慢啟動，每個來回翻倍；遇到遺失或超過門檻後進入避免擁塞，每個來回只加一點，遺失時大幅減少（Reno 砍半、CUBIC 砍到七成），形成鋸齒。傳統演算法把遺失當成塞車訊號，速度大約和 MSS／RTT 成正比、和遺失率的平方根成反比，所以來回時間越長，同樣的遺失率傷得越重；BBR 改用量測頻寬和最小延遲來調整，在這類路徑上表現較好。</li>
<li>traceroute 送出 TTL 從 1 開始遞增的封包，每個讓 TTL 歸零的路由器會丟掉封包並回 ICMP Time Exceeded，裡面帶著自己的位址，於是逐站畫出路徑和每站的來回時間。星號代表那一站沒有回 ICMP（被設定成不回或限速），只要後面的站有回應，就代表它有正常轉送。中間單一站延遲特別高，常常只是它產生 ICMP 的優先權低，要看後面是不是一路都高。</li>
<li>BGP 是自治系統之間交換「我能到哪些網段、路徑經過哪些 AS」的協定，各 AS 依商業政策和路徑選路再轉告鄰居，原始設計沒有驗證。例子：2008 年巴基斯坦電信宣告了比 YouTube 更具體的 /24，經上游 PCCW 傳到全世界，依最長前綴規則，YouTube 的流量被導走約兩小時；或 2021 年 Facebook 的 DNS 伺服器撤回 BGP 公告，斷線約六小時。防禦包括 RPKI 簽發 ROA、業者做路由來源驗證、對客戶和鄰居設前綴過濾與數量上限。</li>
<li>懷疑路徑 MTU 黑洞：路上有隧道、VPN 或撥號讓 MTU 變小，而某處的防火牆擋掉了 ICMP 的「需要分割」訊息，大封包被丟、來源又收不到通知。驗證方式是用 <code>ping -D -s 1472</code>（macOS）或 <code>ping -M do -s 1472</code>（Linux）送不准切割的大封包，逐步調小找出能通的大小。修法是放行必要的 ICMP、在隧道入口做 MSS 鉗制、把 MTU 設對。</li>
</ol>
</details>

<h3>十二、練功題（做得出來才算真的懂）</h3>
<ol>
<li><code>ping</code> 一台伺服器，回應寫著 <code>ttl=52</code>。它大概是什麼作業系統？離你幾站？如果是 <code>ttl=116</code> 呢？</li>
<li>台北到東京來回 35 毫秒，頻寬 1 Gbps。頻寬延遲乘積是多少？如果某個代理伺服器把 TCP 視窗限制在 64 KB，這條連線最快能跑多少？</li>
<li>用第三節那張路由表，判斷這三個封包各送往哪個下一站：<code>10.20.30.5</code>、<code>10.20.31.5</code>、<code>192.168.1.9</code>。</li>
<li>初始擁塞視窗 10 個區段、每個 1,460 B，不考慮遺失。送完 500 KB（500,000 B）的資料，需要幾個來回？加上 TCP 和 TLS 1.3 的握手呢？</li>
<li>用 Mathis 公式比較：遺失率 0.5% 時，來回 35 毫秒和 140 毫秒的連線，各自的速度上限大約是多少？</li>
<li>WireGuard 隧道的 MTU 是 1,420，裡面跑 IPv4 上的 TCP。隧道入口的 MSS 應該鉗制成多少？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>常見的初始值是 64（Linux、macOS）和 128（Windows）。52 最接近 64，大概是 Linux，離你約 64 - 52 = 12 站。116 最接近 128，大概是 Windows，也是 12 站。（這只是推測：TTL 可以被改，路徑也會變。）</li>
<li>1 Gbps × 0.035 秒 = 3,500 萬位元 ≈ 4.4 MB。視窗卡在 64 KB 時，最快是 65,535 B × 8 ÷ 0.035 秒 ≈ 15 Mbps，只用到頻寬的 1.5%。</li>
<li><code>10.20.30.5</code> 符合 /24，送 10.0.0.3；<code>10.20.31.5</code> 只符合 /16，送 10.0.0.2；<code>192.168.1.9</code> 在直接相連的網段，直接用 ARP 找到它，送到區域網路上。</li>
<li>每個來回送出 10、20、40、80、160、320 個區段。前 5 個來回累計 310 個區段 = 452,600 B，還不夠；第 6 個來回累計 630 個區段 = 919,800 B，夠了。所以資料要 6 個來回，加上 TCP 握手 1 個、TLS 1.3 握手 1 個，一共 8 個來回。在 140 毫秒的路上，就是 1.12 秒。</li>
<li>1.22 ÷ √0.005 ≈ 17.25。35 毫秒：1,460 × 8 ÷ 0.035 × 17.25 ≈ 5.8 Mbps。140 毫秒：≈ 1.4 Mbps。距離變成 4 倍，速度上限就剩四分之一。</li>
<li>1,420 - 20（IPv4 標頭）- 20（TCP 標頭）= 1,380。</li>
</ol>
</details>

<h3>十三、想再挖深</h3>
<ul>
<li><b>Kurose 與 Ross《Computer Networking: A Top-Down Approach》</b>：最多學校用的網路課本，從應用層一路往下講，封包交換、路由、TCP 擁塞控制、BGP 都有完整的章節。</li>
<li><b>Ilya Grigorik《High Performance Browser Networking》</b>（<a href="https://hpbn.co/">hpbn.co</a>，免費線上閱讀）：從延遲、頻寬、TCP、TLS 一路講到 HTTP/2 和 WebSocket，是「為什麼我的網站慢」最實用的一本。</li>
<li><b>Cloudflare Learning Center</b>（<a href="https://www.cloudflare.com/learning/">cloudflare.com/learning</a>）：BGP、anycast、DDoS、MTU 都有圖文並茂的短文；他們的部落格也常有大型斷線的事後分析。</li>
<li><b>Facebook 工程部落格〈More details about the October 4 outage〉</b>：2021 年那次斷線的官方說明，很短，是理解 BGP、DNS 和「修復工具不能依賴自己」最好的真實案例。</li>
<li><b>RFC 791（IPv4）、RFC 9293（TCP）、RFC 4271（BGP-4）</b>：規格原文。不用從頭讀，遇到某個欄位不懂時，回去查它的定義。</li>
</ul>
` });
