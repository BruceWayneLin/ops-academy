DEEP({ 'net-tcp': `
<p>課文給了你連接埠、TCP 和 UDP 的差別、三向交握，以及「被拒、逾時、被重設」三種錯誤。模組 0〈網際網路是什麼〉的深入圖解，講過慢啟動、鋸齒狀的擁塞控制和 BBR 的大意。這一章把 TCP 這台機器打開來看：交握和揮手時，序號一個位元組一個位元組怎麼算；一條連線一生會經過哪些狀態，每一種狀態堆積起來代表什麼病；掉了封包時，TCP 怎麼發現、怎麼補；CUBIC 和 BBR 用白話比一次；隊頭阻塞在 HTTP/2 和 HTTP/3 上長什麼樣子；閒置連線怎麼在負載平衡器和 NAT 之間被悄悄殺掉，變成那個最難抓的間歇性 502；短暫連接埠為什麼會用完；怎麼用 <code>ss</code> 一眼讀出這些事；最後是 UDP 和 QUIC。</p>

<h3><span class="badge lv1">基礎</span>一、TCP 在保證什麼，用什麼保證</h3>
<p>IP 只負責「盡力送」：封包會掉、會亂序、會重複。TCP 要在這上面做出一條「可靠、照順序、不重複」的位元組串流。它的工具出奇地簡單，就像寄掛號信：</p>
<ul>
<li><b>序號</b>（sequence number）：每一個位元組都有編號。不是封包的編號，是<b>位元組</b>的編號。收的一方用它把資料排回正確的順序、丟掉重複的。</li>
<li><b>確認</b>（acknowledgment，ACK）：收的一方回報「我已經連續收到第幾號以前的全部，下一個要第幾號」。注意 ACK 的數字是「下一個想要的」，不是「剛收到的」。</li>
<li><b>計時器</b>：送出去之後一段時間沒被確認，就當它掉了，重送。</li>
<li><b>視窗</b>（window）：最多可以有多少「已送出、還沒被確認」的資料在路上。接收方用它說「我的緩衝區還剩多少」（接收視窗，rwnd），傳送方自己再估一個「網路塞不塞」（擁塞視窗，cwnd），實際能送的量是兩者中比較小的那個。</li>
</ul>
<p>一條 TCP 連線，由<b>四元組</b>（4-tuple）唯一認出：來源 IP、來源埠、目的 IP、目的埠。伺服器只聽一個埠（例如 443），卻能同時有幾萬條連線，因為每一條的「用戶端 IP＋用戶端埠」都不一樣。這一點在第八節會變成事故的根源。</p>

<h3><span class="badge lv1">基礎</span>二、交握與揮手：把序號算一次</h3>
<p>下面是一條完整連線的一生。左右兩邊的文字，是兩端在那一刻所處的<b>狀態</b>：</p>
<figure class="figure"><svg viewBox="0 0 660 420" class="fg" style="width:100%;max-width:660px" role="img" aria-label="一條 TCP 連線的時序：三向交握、傳一段資料、四次揮手，標出每個封包的序號與確認號，以及兩端在每一刻的狀態">
<rect x="80" y="8" width="100" height="30" rx="6" class="fg-b alt"/><text x="130" y="28" text-anchor="middle" class="fg-t">用戶端</text>
<rect x="480" y="8" width="100" height="30" rx="6" class="fg-b hot"/><text x="530" y="28" text-anchor="middle" class="fg-t">伺服器</text>
<line x1="130" y1="38" x2="130" y2="412" class="fg-l dim dash"/>
<line x1="530" y1="38" x2="530" y2="412" class="fg-l dim dash"/>
<text x="540" y="62" class="fg-t sm mono">LISTEN</text>
<text x="120" y="76" text-anchor="end" class="fg-t sm mono">SYN_SENT</text>
<line x1="130" y1="70" x2="522" y2="89" class="fg-l alt"/><polygon points="530,90 522,85.2 521.6,94.2" class="fg-a alt"/>
<text x="330" y="74" text-anchor="middle" class="fg-t sm mono">SYN　seq=1000</text>
<text x="540" y="96" class="fg-t sm mono">SYN_RECV</text>
<line x1="530" y1="100" x2="138" y2="119" class="fg-l alt"/><polygon points="130,120 138.4,115.2 138.4,124.2" class="fg-a alt"/>
<text x="290" y="102" text-anchor="middle" class="fg-t sm mono">SYN-ACK　seq=5000　ack=1001</text>
<text x="120" y="124" text-anchor="end" class="fg-t sm mono acc">ESTABLISHED</text>
<line x1="130" y1="130" x2="522" y2="149" class="fg-l alt"/><polygon points="530,150 522,145.2 521.6,154.2" class="fg-a alt"/>
<text x="330" y="134" text-anchor="middle" class="fg-t sm mono">ACK　ack=5001</text>
<text x="540" y="156" class="fg-t sm mono acc">ESTABLISHED</text>
<line x1="130" y1="170" x2="522" y2="189" class="fg-l on"/><polygon points="530,190 522,185.2 521.6,194.2" class="fg-a on"/>
<text x="330" y="174" text-anchor="middle" class="fg-t sm mono">資料 517 位元組　seq=1001</text>
<line x1="530" y1="200" x2="138" y2="219" class="fg-l on"/><polygon points="130,220 138.4,215.2 138.4,224.2" class="fg-a on"/>
<text x="290" y="203" text-anchor="middle" class="fg-t sm mono">ACK　ack=1518</text>
<text x="330" y="246" text-anchor="middle" class="fg-t sm">⋮　雙方繼續傳資料　⋮</text>
<text x="120" y="276" text-anchor="end" class="fg-t sm mono">FIN_WAIT_1</text>
<line x1="130" y1="270" x2="522" y2="289" class="fg-l warm"/><polygon points="530,290 522,285.2 521.6,294.2" class="fg-a warm"/>
<text x="330" y="274" text-anchor="middle" class="fg-t sm mono">FIN　seq=1518</text>
<text x="540" y="296" class="fg-t sm mono warm">CLOSE_WAIT</text>
<line x1="530" y1="300" x2="138" y2="319" class="fg-l warm"/><polygon points="130,320 138.4,315.2 138.4,324.2" class="fg-a warm"/>
<text x="290" y="303" text-anchor="middle" class="fg-t sm mono">ACK　ack=1519</text>
<text x="120" y="324" text-anchor="end" class="fg-t sm mono">FIN_WAIT_2</text>
<text x="540" y="336" class="fg-t sm mono">LAST_ACK</text>
<line x1="530" y1="340" x2="138" y2="359" class="fg-l warm"/><polygon points="130,360 138.4,355.2 138.4,364.2" class="fg-a warm"/>
<text x="290" y="343" text-anchor="middle" class="fg-t sm mono">FIN　seq=9000</text>
<text x="120" y="364" text-anchor="end" class="fg-t sm mono warm">TIME_WAIT</text>
<line x1="130" y1="370" x2="522" y2="389" class="fg-l warm"/><polygon points="530,390 522,385.2 521.6,394.2" class="fg-a warm"/>
<text x="330" y="374" text-anchor="middle" class="fg-t sm mono">ACK　ack=9001</text>
<text x="540" y="396" class="fg-t sm mono">CLOSED</text>
<text x="120" y="404" text-anchor="end" class="fg-t sm">再等 60 秒</text>
</svg><figcaption>綠色是三向交握，深綠是資料，橘色是揮手。SYN 和 FIN 雖然不帶資料，各自也佔掉一個序號，所以 seq=1000 的 SYN 換來 ack=1001。</figcaption></figure>
<ol>
<li><b>SYN</b>：用戶端挑一個隨機的起始序號（initial sequence number，ISN），這裡是 1000。同一個封包裡還會帶幾個只能在交握時談的選項：MSS（每段最多裝多少資料）、視窗放大倍數（window scale，讓視窗超過 64 KB）、是否支援 SACK、時間戳記。</li>
<li><b>SYN-ACK</b>：伺服器也挑自己的起始序號 5000，並確認「我要你的第 1001 號」。</li>
<li><b>ACK</b>：用戶端確認「我要你的第 5001 號」。兩邊都知道對方的起始序號了，連線建立。</li>
<li>用戶端送出 517 個位元組（例如 TLS 的 ClientHello），編號從 1001 到 1517。伺服器回「我要 1518」。</li>
<li>揮手：每一邊各自說「我這個方向送完了」（FIN），對方各自確認。TCP 是雙向的，兩個方向分別關，所以是四個封包。對方的 ACK 和 FIN 剛好同時要送時，也可以合成一個，變成三個。</li>
</ol>
<p><b>為什麼要三次，不是兩次？</b>因為兩邊都要確認「對方知道我的起始序號」。只有兩次的話，伺服器送出 SYN-ACK 之後，無從知道用戶端有沒有收到。<b>為什麼起始序號要隨機？</b>一是避免舊連線殘留在網路裡的封包，剛好落進新連線的序號範圍；二是讓路上的攻擊者猜不到序號，沒辦法偽造封包插進你的連線。</p>

<h3><span class="badge lv2">進階</span>三、狀態機：每一種狀態堆積起來代表什麼病</h3>
<p>把上一張圖裡兩端的狀態整理成一張地圖。這張圖值得背下來，因為你在 <code>ss</code> 和 <code>netstat</code> 裡看到的，就是這些名字：</p>
<figure class="figure"><svg viewBox="0 0 680 556" class="fg" style="width:100%;max-width:680px" role="img" aria-label="TCP 狀態機：左邊是主動開啟和主動關閉的路徑，右邊是被動開啟和被動關閉的路徑，中間是 ESTABLISHED，CLOSE_WAIT 和 TIME_WAIT 以橘色標出">
<rect x="275" y="10" width="130" height="34" rx="6" class="fg-b"/><text x="340" y="32" text-anchor="middle" class="fg-t mono">CLOSED</text>
<text x="10" y="64" class="fg-t sm alt">主動的一方</text>
<text x="670" y="64" text-anchor="end" class="fg-t sm alt">被動的一方</text>
<path d="M275 27 H125 V92" class="fg-l"/><polygon points="125,100 120.5,92 129.5,92" class="fg-a"/>
<text x="140" y="20" class="fg-t sm mono">connect()，送 SYN</text>
<path d="M405 27 H555 V62" class="fg-l"/><polygon points="555,70 550.5,62 559.5,62" class="fg-a"/>
<text x="420" y="20" class="fg-t sm mono">listen()</text>
<rect x="60" y="100" width="130" height="34" rx="6" class="fg-b"/><text x="125" y="122" text-anchor="middle" class="fg-t mono">SYN_SENT</text>
<rect x="490" y="70" width="130" height="34" rx="6" class="fg-b"/><text x="555" y="92" text-anchor="middle" class="fg-t mono">LISTEN</text>
<line x1="555" y1="104" x2="555" y2="132" class="fg-l"/><polygon points="555,140 550.5,132 559.5,132" class="fg-a"/>
<text x="547" y="124" text-anchor="end" class="fg-t sm">收 SYN，送 SYN-ACK</text>
<rect x="490" y="140" width="130" height="34" rx="6" class="fg-b"/><text x="555" y="162" text-anchor="middle" class="fg-t mono">SYN_RECV</text>
<path d="M125 134 V217 H267" class="fg-l"/><polygon points="275,217 267,212.5 267,221.5" class="fg-a"/>
<text x="133" y="172" class="fg-t sm">收 SYN-ACK，送 ACK</text>
<path d="M555 174 V217 H413" class="fg-l"/><polygon points="405,217 413,212.5 413,221.5" class="fg-a"/>
<text x="470" y="209" text-anchor="middle" class="fg-t sm">收 ACK</text>
<rect x="275" y="200" width="130" height="34" rx="6" class="fg-b hot"/><text x="340" y="222" text-anchor="middle" class="fg-t mono acc">ESTABLISHED</text>
<path d="M310 234 V262 H125 V282" class="fg-l"/><polygon points="125,290 120.5,282 129.5,282" class="fg-a"/>
<text x="140" y="256" class="fg-t sm mono">close()，送 FIN</text>
<path d="M370 234 V262 H555 V282" class="fg-l"/><polygon points="555,290 550.5,282 559.5,282" class="fg-a"/>
<text x="420" y="256" class="fg-t sm">收 FIN，送 ACK</text>
<rect x="60" y="290" width="130" height="34" rx="6" class="fg-b"/><text x="125" y="312" text-anchor="middle" class="fg-t mono">FIN_WAIT_1</text>
<rect x="490" y="290" width="130" height="34" rx="6" class="fg-b warm"/><text x="555" y="312" text-anchor="middle" class="fg-t mono">CLOSE_WAIT</text>
<line x1="125" y1="324" x2="125" y2="362" class="fg-l"/><polygon points="125,370 120.5,362 129.5,362" class="fg-a"/>
<text x="133" y="350" class="fg-t sm">收 ACK</text>
<line x1="555" y1="324" x2="555" y2="362" class="fg-l"/><polygon points="555,370 550.5,362 559.5,362" class="fg-a"/>
<text x="547" y="350" text-anchor="end" class="fg-t sm mono">程式 close()，送 FIN</text>
<rect x="60" y="370" width="130" height="34" rx="6" class="fg-b"/><text x="125" y="392" text-anchor="middle" class="fg-t mono">FIN_WAIT_2</text>
<rect x="490" y="370" width="130" height="34" rx="6" class="fg-b"/><text x="555" y="392" text-anchor="middle" class="fg-t mono">LAST_ACK</text>
<text x="340" y="385" text-anchor="middle" class="fg-t sm warm">CLOSE_WAIT 堆積 → 程式沒呼叫 close()</text>
<line x1="125" y1="404" x2="125" y2="442" class="fg-l"/><polygon points="125,450 120.5,442 129.5,442" class="fg-a"/>
<text x="133" y="430" class="fg-t sm">收 FIN，送 ACK</text>
<rect x="60" y="450" width="130" height="34" rx="6" class="fg-b warm"/><text x="125" y="472" text-anchor="middle" class="fg-t mono">TIME_WAIT</text>
<text x="340" y="455" text-anchor="middle" class="fg-t sm warm">TIME_WAIT 堆積 → 自己主動關了大量短連線</text>
<path d="M190 467 H230 V527 H267" class="fg-l dash"/><polygon points="275,527 267,522.5 267,531.5" class="fg-a"/>
<text x="60" y="506" class="fg-t sm">等 2MSL（Linux 固定 60 秒）</text>
<path d="M555 404 V527 H413" class="fg-l"/><polygon points="405,527 413,522.5 413,531.5" class="fg-a"/>
<text x="480" y="520" text-anchor="middle" class="fg-t sm">收 ACK</text>
<rect x="275" y="510" width="130" height="34" rx="6" class="fg-b"/><text x="340" y="532" text-anchor="middle" class="fg-t mono">CLOSED</text>
</svg><figcaption>先送 FIN 的那一方走左邊，最後會停在 TIME_WAIT；收到 FIN 的那一方走右邊，要等自己的程式呼叫 close() 才離開 CLOSE_WAIT。誰是「主動」跟誰是用戶端無關，看的是誰先關。兩邊同時送 FIN 的少見情況會經過 CLOSING 狀態，圖上省略。</figcaption></figure>
<table>
<tr><th>看到很多這個</th><th>代表什麼</th><th>先查什麼</th></tr>
<tr><td><code>SYN_SENT</code></td><td>你往外連，對方一直沒回</td><td>對方的防火牆、安全群組在默默丟封包，或對方整台掛了</td></tr>
<tr><td><code>SYN_RECV</code></td><td>收到 SYN、回了 SYN-ACK，等不到最後的 ACK</td><td>SYN 洪水攻擊，或回程的路有問題</td></tr>
<tr><td><code>ESTABLISHED</code></td><td>正常的連線</td><td>數量合不合理？連線池開了多少條？有沒有洩漏</td></tr>
<tr><td><code>CLOSE_WAIT</code></td><td>對方關了，<b>你的程式還沒關</b></td><td>幾乎一定是你的程式碼的錯：某條路徑忘了關連線、回應主體沒讀完沒釋放</td></tr>
<tr><td><code>FIN_WAIT_2</code></td><td>你關了，對方確認了，但對方一直不關</td><td>對方的程式卡住。Linux 對這種「孤兒」連線，預設 60 秒後清掉（<code>tcp_fin_timeout</code>）</td></tr>
<tr><td><code>TIME_WAIT</code></td><td>你主動關了很多連線，在等最後的 60 秒</td><td>在伺服器上通常無害；在「往外連」的那一方，會吃光短暫連接埠（第八節）</td></tr>
</table>
<p><b>TIME_WAIT 為什麼要等？</b>兩個原因。第一，最後那個 ACK 可能掉了，對方會重送 FIN，你得還在、還能再回一次 ACK；不然對方會收到 RST，以為出錯。第二，讓這條連線殘留在網路裡的舊封包全部過期，免得同一組四元組馬上被新連線重用時，舊封包混進來。規格說要等兩倍的「封包最長存活時間」（2MSL），Linux 把它寫死成 60 秒，不能用 sysctl 調。</p>
<p><b>CLOSE_WAIT 是你的錯。</b>這句話值得單獨講一次。TIME_WAIT 是協定的正常行為，會自己消失；CLOSE_WAIT 不會，它會一直留到你的程式呼叫 close() 為止。一台服務的 CLOSE_WAIT 一直往上漲，最後會把檔案描述符（file descriptor）用光，新的連線全部失敗。常見原因：HTTP 用戶端拿到回應之後沒把主體讀完或關掉（Go 裡忘了 <code>resp.Body.Close()</code> 是經典），資料庫連線在錯誤處理的分支裡沒有還回連線池。</p>

<h3><span class="badge lv2">進階</span>四、用 ss 讀連線</h3>
<p>Linux 上看連線的工具是 <code>ss</code>（舊的 <code>netstat</code> 已經不再維護，macOS 上還是用 netstat 和 lsof）。最常用的幾個：</p>
<pre><code>ss -tlnp                       # 誰在聽哪個 TCP 埠（要 sudo 才看得到所有程式）
ss -tan                        # 所有 TCP 連線，數字格式
ss -s                          # 各種狀態的總數
ss -tan state time-wait | wc -l
ss -tn state established '( dport = :5432 )'   # 連到資料庫的連線
ss -tin dst 10.20.72.8         # 連到某台機器的連線，加上核心內部的數字</code></pre>
<h4>Recv-Q 和 Send-Q：兩個欄位，兩種意思</h4>
<pre><code>State    Recv-Q  Send-Q   Local Address:Port    Peer Address:Port
LISTEN   0       4096           0.0.0.0:443          0.0.0.0:*
LISTEN   129     128            0.0.0.0:8080         0.0.0.0:*
ESTAB    0       0           10.20.1.15:443      203.0.113.7:51514
ESTAB    52480   0           10.20.1.15:443      203.0.113.9:40022
ESTAB    0       87600       10.20.1.15:443     198.51.100.3:61203</code></pre>
<ul>
<li><b>LISTEN 那幾行</b>：Recv-Q 是「已經完成交握、在排隊等程式 accept() 的連線數」，Send-Q 是這個佇列的上限（backlog）。第二行 129 對 128，佇列滿了：程式 accept 得太慢（或卡住了），新的連線會被丟掉，用戶端看到的是連線很慢才建起來或逾時。</li>
<li><b>ESTAB 的 Recv-Q</b>：資料已經到了這台機器，<b>你的程式還沒讀</b>。52,480 個位元組堆在那裡，代表程式忙不過來或卡住了，問題在你這邊。</li>
<li><b>ESTAB 的 Send-Q</b>：送出去了，<b>對方還沒確認</b>。87,600 個位元組卡在路上，代表網路慢、對方收得慢，問題在路上或對方。</li>
</ul>
<p>這兩個欄位，讓你在幾秒鐘內判斷「慢的是我還是他」。</p>
<h4>ss -ti：核心替每條連線記的帳</h4>
<pre><code>ESTAB 0 0 10.20.1.15:51514 10.20.72.8:5432
   cubic wscale:7,7 rto:204 rtt:1.2/0.4 mss:1448 cwnd:10 retrans:0/3 ...</code></pre>
<p><code>cubic</code> 是擁塞控制演算法；<code>rtt:1.2/0.4</code> 是平滑後的來回時間和它的變動量（毫秒）；<code>rto:204</code> 是現在的重送逾時；<code>cwnd:10</code> 是擁塞視窗（以區段為單位）；<code>retrans:0/3</code> 是「目前還沒補上的重送／這條連線總共重送過幾次」。全機的重送統計用 <code>nstat -az TcpRetransSegs</code>，accept 佇列滿掉的次數看 <code>nstat -az TcpExtListenOverflows</code>。</p>

<h3><span class="badge lv3">專業</span>五、掉了封包怎麼辦：重送和擁塞控制</h3>
<p>TCP 有兩種發現封包掉了的方法，速度差很多。</p>
<figure class="figure"><svg viewBox="0 0 680 300" class="fg" style="width:100%;max-width:680px" role="img" aria-label="快速重送：第三個區段掉了，接收端對後面每一個區段都回「要第 3 個」，傳送端收到三個重複的確認就立刻重送，比等逾時快很多">
<text x="10" y="58" class="fg-t sm">送出的區段</text>
<rect x="110" y="36" width="70" height="34" rx="5" class="fg-b hot"/><text x="145" y="58" text-anchor="middle" class="fg-t mono">1</text>
<rect x="190" y="36" width="70" height="34" rx="5" class="fg-b hot"/><text x="225" y="58" text-anchor="middle" class="fg-t mono">2</text>
<rect x="270" y="36" width="70" height="34" rx="5" class="fg-b warm"/><text x="305" y="58" text-anchor="middle" class="fg-t mono">3 ✗</text>
<rect x="350" y="36" width="70" height="34" rx="5" class="fg-b hot"/><text x="385" y="58" text-anchor="middle" class="fg-t mono">4</text>
<rect x="430" y="36" width="70" height="34" rx="5" class="fg-b hot"/><text x="465" y="58" text-anchor="middle" class="fg-t mono">5</text>
<rect x="510" y="36" width="70" height="34" rx="5" class="fg-b hot"/><text x="545" y="58" text-anchor="middle" class="fg-t mono">6</text>
<rect x="590" y="36" width="70" height="34" rx="5" class="fg-b alt"/><text x="625" y="58" text-anchor="middle" class="fg-t">重送 3</text>
<text x="305" y="26" text-anchor="middle" class="fg-t sm warm">路上掉了</text>
<text x="10" y="118" class="fg-t sm">回來的 ACK</text>
<line x1="145" y1="70" x2="145" y2="88" class="fg-l dim"/><polygon points="145,96 140.5,88 149.5,88" class="fg-a"/>
<rect x="110" y="96" width="70" height="34" rx="5" class="fg-b"/><text x="145" y="118" text-anchor="middle" class="fg-t sm">要 2</text>
<line x1="225" y1="70" x2="225" y2="88" class="fg-l dim"/><polygon points="225,96 220.5,88 229.5,88" class="fg-a"/>
<rect x="190" y="96" width="70" height="34" rx="5" class="fg-b"/><text x="225" y="118" text-anchor="middle" class="fg-t sm">要 3</text>
<text x="305" y="118" text-anchor="middle" class="fg-t sm">（沒收到）</text>
<line x1="385" y1="70" x2="385" y2="88" class="fg-l dim"/><polygon points="385,96 380.5,88 389.5,88" class="fg-a"/>
<rect x="350" y="96" width="70" height="34" rx="5" class="fg-b warm"/><text x="385" y="118" text-anchor="middle" class="fg-t sm">要 3</text>
<line x1="465" y1="70" x2="465" y2="88" class="fg-l dim"/><polygon points="465,96 460.5,88 469.5,88" class="fg-a"/>
<rect x="430" y="96" width="70" height="34" rx="5" class="fg-b warm"/><text x="465" y="118" text-anchor="middle" class="fg-t sm">要 3</text>
<line x1="545" y1="70" x2="545" y2="88" class="fg-l dim"/><polygon points="545,96 540.5,88 549.5,88" class="fg-a"/>
<rect x="510" y="96" width="70" height="34" rx="5" class="fg-b warm"/><text x="545" y="118" text-anchor="middle" class="fg-t sm">要 3</text>
<line x1="625" y1="70" x2="625" y2="88" class="fg-l dim"/><polygon points="625,96 620.5,88 629.5,88" class="fg-a"/>
<rect x="590" y="96" width="70" height="34" rx="5" class="fg-b hot"/><text x="625" y="118" text-anchor="middle" class="fg-t sm acc">要 7</text>
<path d="M350 140 V146 H580 V140" class="fg-l warm"/>
<text x="465" y="162" text-anchor="middle" class="fg-t sm warm">連續 3 個重複的 ACK → 立刻重送 3</text>
<text x="625" y="150" text-anchor="middle" class="fg-t sm">4–6 早已收好</text>
<text x="10" y="216" class="fg-t">快速重送</text>
<rect x="110" y="196" width="150" height="30" rx="5" class="fg-b hot"/><text x="185" y="216" text-anchor="middle" class="fg-t sm">約 1 個來回就補上</text>
<text x="10" y="264" class="fg-t">逾時重送</text>
<rect x="110" y="244" width="550" height="30" rx="5" class="fg-b warm"/><text x="385" y="264" text-anchor="middle" class="fg-t sm">等計時器到期：Linux 最少 200 ms，之後每次失敗再加倍</text>
</svg><figcaption>接收端收到 4、5、6 時，序號中間缺了 3，它每收到一個就重複說一次「我要 3」。傳送端看到三個重複的 ACK，不等計時器就重送。3 補上之後，接收端一口氣確認到 6，下一個要 7。</figcaption></figure>
<ul>
<li><b>快速重送</b>（fast retransmit）：如上圖，靠後面的封包「推」出重複的 ACK。再加上 <b>SACK</b>（選擇性確認），接收端可以明說「我缺 3，但 4 到 6 都有了」，傳送端只補缺的那一個。較新的 Linux 還改用以時間為準的判斷法（RACK），更快、更不容易誤判。</li>
<li><b>逾時重送</b>（retransmission timeout，RTO）：後面沒有別的封包可以推（例如掉的剛好是最後一個），就只能等計時器。RTO 是依量到的來回時間算出來的（平滑的 RTT 加上四倍的變動量），Linux 的下限是 200 毫秒；每次逾時都把 RTO 加倍，叫指數退避。掉了尾巴的小請求，常常就是因為這個多出 200 毫秒以上。</li>
</ul>
<h4>這些數字會直接變成你看到的症狀</h4>
<ul>
<li><b>連不上的時候，為什麼要等兩分鐘才報錯？</b>SYN 沒有回應，Linux 預設重送 6 次（<code>tcp_syn_retries</code>），間隔 1、2、4、8、16、32 秒，最後再等 64 秒，加起來約 127 秒。所以 <code>connect()</code> 要兩分鐘才回「逾時」。應用程式該自己設連線逾時（例如 3 到 5 秒），不要用核心的預設值。</li>
<li><b>對方整台消失，連線要多久才發現？</b>如果你有資料送出去沒被確認，Linux 預設會重送到大約 15 分鐘才放棄（<code>tcp_retries2</code> 預設 15）。如果你沒在送資料，那就永遠不會發現，除非開了 keepalive（第七節）。這就是為什麼資料庫用戶端、RPC 框架都有自己的讀寫逾時。</li>
</ul>
<h4>CUBIC 和 BBR，用白話比一次</h4>
<p>模組 0 的深入圖解講過：TCP 用擁塞視窗控制自己送多快，掉封包就減速。這裡比較兩種演算法的<b>想法</b>：</p>
<figure class="figure"><svg viewBox="0 0 680 260" class="fg" style="width:100%;max-width:680px" role="img" aria-label="左圖 CUBIC 的在途資料量反覆衝過管子容量、塞滿路由器佇列直到掉封包再減速；右圖 BBR 停在管子容量附近，偶爾多送一點探測頻寬，約每十秒降到很低量一次最小延遲">
<text x="175" y="22" text-anchor="middle" class="fg-t acc">CUBIC：撞到掉封包才減速</text>
<text x="515" y="22" text-anchor="middle" class="fg-t alt">BBR：照量到的頻寬和延遲送</text>
<text x="44" y="42" class="fg-t sm">在路上的資料</text>
<text x="384" y="42" class="fg-t sm">在路上的資料</text>
<line x1="40" y1="50" x2="40" y2="232" class="fg-l"/><line x1="40" y1="232" x2="325" y2="232" class="fg-l"/>
<line x1="380" y1="50" x2="380" y2="232" class="fg-l"/><line x1="380" y1="232" x2="665" y2="232" class="fg-l"/>
<line x1="40" y1="150" x2="325" y2="150" class="fg-l dim dash"/>
<line x1="380" y1="150" x2="665" y2="150" class="fg-l dim dash"/>
<line x1="40" y1="90" x2="325" y2="90" class="fg-l warm dash"/>
<text x="200" y="80" class="fg-t sm warm">再多就掉封包（佇列滿）</text>
<text x="325" y="166" text-anchor="end" class="fg-t sm">管子容量（BDP）</text>
<text x="430" y="177" class="fg-t sm">管子容量（BDP）</text>
<polyline points="40,228 60,180 75,120 82,90 82,132 100,110 120,98 145,93 165,92 180,90 180,132 198,110 218,98 243,93 263,92 278,90 278,132 296,110 316,98" class="fg-l on"/>
<text x="70" y="192" class="fg-t sm">BDP 以上的部分，都在佇列裡排隊</text>
<polyline points="380,228 400,170 412,110 424,150 450,150 456,140 462,160 468,150 500,150 506,140 512,160 518,150 545,150 551,140 557,160 563,150 580,150 582,224 590,224 592,150 620,150 626,140 632,160 638,150 660,150" class="fg-l alt"/>
<text x="500" y="130" text-anchor="middle" class="fg-t sm">多送一點探頻寬</text>
<text x="430" y="196" class="fg-t sm">佇列幾乎是空的</text>
<text x="570" y="222" text-anchor="end" class="fg-t sm">每 10 秒量最小延遲</text>
<text x="325" y="250" text-anchor="end" class="fg-t sm">時間 →</text>
<text x="665" y="250" text-anchor="end" class="fg-t sm">時間 →</text>
</svg><figcaption>示意圖。管子容量是「頻寬 × 最小來回時間」，送到這麼多剛好把路塞滿而不必排隊。CUBIC 每次都衝過頭、把路由器的佇列塞滿，直到掉封包；BBR 試著剛好停在容量上。</figcaption></figure>
<ul>
<li><b>CUBIC</b>（Linux 預設）：把「掉封包」當成唯一的塞車訊號。掉了就把視窗砍到原本的七成左右，接著很快長回「上次出事的大小」附近，在那裡放慢、小心試探，沒事再加速往上衝。像一個開車只看「撞到前車」才踩煞車的司機：平常一路貼上去，把路由器的佇列塞得滿滿的。好處是簡單、穩定、大家都用；壞處是佇列一直是滿的（延遲變高），而且把 Wi-Fi 或行動網路的隨機遺失誤當成塞車。</li>
<li><b>BBR</b>（Google 2016 年發表）：不等撞車，而是一直量兩個數字：最近送得最快時的速度（瓶頸頻寬），和最近的最小來回時間。兩個相乘就是管子容量，它就照這個速度、送這麼多。為了發現頻寬變大，它週期性地多送 25% 試試看，再少送一點把多出來的排隊消掉；大約每 10 秒，還會刻意把在途資料降到很低一小段時間（約 200 毫秒），重新量一次「沒有排隊時」的最小延遲。它在長距離、有隨機遺失的路上通常快很多，延遲也比較低。</li>
</ul>
<p>兩個實務重點。第一，<b>擁塞控制只在傳送端</b>。你在伺服器上開 BBR，改善的是伺服器送給使用者的方向（下載），使用者上傳的速度由使用者的作業系統決定。第二，BBR 不是全面勝利：第一版在某些網路上會搶走同一條路上 CUBIC 連線的頻寬，在緩衝很小的路上掉封包偏多，Google 後續的版本一直在修正。要開，先在一部分機器上量過再推廣：</p>
<pre><code>sysctl net.ipv4.tcp_available_congestion_control
sudo sysctl -w net.core.default_qdisc=fq
sudo sysctl -w net.ipv4.tcp_congestion_control=bbr</code></pre>

<h3><span class="badge lv3">專業</span>六、隊頭阻塞：一個封包掉了，誰要跟著等</h3>
<p>TCP 保證照順序交給程式。所以只要中間缺了一個位元組，後面已經到的資料全部只能在核心的緩衝區裡等，程式一個位元組都讀不到。這叫<b>隊頭阻塞</b>（head-of-line blocking）。它在三代 HTTP 上的樣子不一樣：</p>
<ul>
<li><b>HTTP/1.1</b>：一條連線上一次只能有一個請求在跑，前一個沒回完，後一個只能等（應用層的隊頭阻塞）。瀏覽器的對策是對同一個網域開大約 6 條連線。好處是：一條連線掉了封包，只卡住那一條。</li>
<li><b>HTTP/2</b>：所有請求塞進同一條 TCP 連線，交錯傳送，解決了應用層的排隊。可是 TCP 層的隊頭阻塞還在，而且變得更痛：一個封包掉了，<b>所有</b>請求一起停。</li>
<li><b>HTTP/3</b>：跑在 QUIC 上，每一個請求是一條獨立的串流，各自排順序。掉了 A 的封包，只有 A 要等。</li>
</ul>
<figure class="figure"><svg viewBox="0 0 680 240" class="fg" style="width:100%;max-width:680px" role="img" aria-label="同樣掉了 A2 這個封包：HTTP/2 在一條 TCP 上，後面四個已經到的封包都卡住；HTTP/3 在 QUIC 上，只有同一條串流的 A3 要等">
<rect x="170" y="10" width="18" height="14" rx="3" class="fg-b hot"/><text x="194" y="22" class="fg-t sm">交給程式了</text>
<rect x="290" y="10" width="18" height="14" rx="3" class="fg-b dash"/><text x="314" y="22" class="fg-t sm">到了，但卡住</text>
<rect x="420" y="10" width="18" height="14" rx="3" class="fg-b warm"/><text x="444" y="22" class="fg-t sm">路上掉了</text>
<text x="10" y="92" class="fg-t">HTTP/2</text>
<text x="10" y="110" class="fg-t sm">一條 TCP</text>
<rect x="170" y="70" width="56" height="34" rx="5" class="fg-b hot"/><text x="198" y="92" text-anchor="middle" class="fg-t mono">A1</text>
<rect x="232" y="70" width="56" height="34" rx="5" class="fg-b hot"/><text x="260" y="92" text-anchor="middle" class="fg-t mono">B1</text>
<rect x="294" y="70" width="56" height="34" rx="5" class="fg-b hot"/><text x="322" y="92" text-anchor="middle" class="fg-t mono">C1</text>
<rect x="356" y="70" width="56" height="34" rx="5" class="fg-b warm"/><text x="384" y="92" text-anchor="middle" class="fg-t mono">A2 ✗</text>
<rect x="418" y="70" width="56" height="34" rx="5" class="fg-b dash"/><text x="446" y="92" text-anchor="middle" class="fg-t mono">B2</text>
<rect x="480" y="70" width="56" height="34" rx="5" class="fg-b dash"/><text x="508" y="92" text-anchor="middle" class="fg-t mono">C2</text>
<rect x="542" y="70" width="56" height="34" rx="5" class="fg-b dash"/><text x="570" y="92" text-anchor="middle" class="fg-t mono">A3</text>
<rect x="604" y="70" width="56" height="34" rx="5" class="fg-b dash"/><text x="632" y="92" text-anchor="middle" class="fg-t mono">B3</text>
<text x="170" y="126" class="fg-t sm warm">A2 掉了：後面四個都到了，也全部要等它重送</text>
<text x="10" y="182" class="fg-t">HTTP/3</text>
<text x="10" y="200" class="fg-t sm">QUIC</text>
<rect x="170" y="160" width="56" height="34" rx="5" class="fg-b hot"/><text x="198" y="182" text-anchor="middle" class="fg-t mono">A1</text>
<rect x="232" y="160" width="56" height="34" rx="5" class="fg-b hot"/><text x="260" y="182" text-anchor="middle" class="fg-t mono">B1</text>
<rect x="294" y="160" width="56" height="34" rx="5" class="fg-b hot"/><text x="322" y="182" text-anchor="middle" class="fg-t mono">C1</text>
<rect x="356" y="160" width="56" height="34" rx="5" class="fg-b warm"/><text x="384" y="182" text-anchor="middle" class="fg-t mono">A2 ✗</text>
<rect x="418" y="160" width="56" height="34" rx="5" class="fg-b hot"/><text x="446" y="182" text-anchor="middle" class="fg-t mono">B2</text>
<rect x="480" y="160" width="56" height="34" rx="5" class="fg-b hot"/><text x="508" y="182" text-anchor="middle" class="fg-t mono">C2</text>
<rect x="542" y="160" width="56" height="34" rx="5" class="fg-b dash"/><text x="570" y="182" text-anchor="middle" class="fg-t mono">A3</text>
<rect x="604" y="160" width="56" height="34" rx="5" class="fg-b hot"/><text x="632" y="182" text-anchor="middle" class="fg-t mono">B3</text>
<text x="170" y="216" class="fg-t sm acc">只有 A 這條串流要等；B、C 照樣交給程式</text>
</svg><figcaption>A、B、C 是三個同時進行的請求（例如三張圖片），數字是它們各自的第幾個封包。差別不在傳輸，而在「誰被允許先交貨」。</figcaption></figure>
<p>所以在丟包率高的行動網路上，HTTP/2 有時反而比 HTTP/1.1 開 6 條連線還慢。同樣的道理也適用於遊戲：用 WebSocket（一條 TCP）傳即時狀態，掉一個封包，後面所有的位置更新都卡住一個來回以上，畫面就「頓一下」。</p>
<h4>另一個常見的小延遲：Nagle 和延遲確認</h4>
<p>TCP 預設開著 <b>Nagle 演算法</b>：還有資料沒被確認時，把新的小資料先存著，湊大一點再送，避免網路上滿是小封包。接收端則有<b>延遲確認</b>（delayed ACK）：收到資料不馬上回 ACK，等幾十毫秒看能不能跟回應一起送。兩個一起作用時，「送一小段、等回應」的互動協定，會莫名其妙每次多等幾十毫秒。即時性要求高的程式（遊戲、RPC）會關掉 Nagle，也就是設 <code>TCP_NODELAY</code>。Go 的 TCP 連線預設就是關掉 Nagle 的；Node.js 可以對 socket 呼叫 <code>setNoDelay(true)</code>。</p>

<h3><span class="badge lv3">專業</span>七、閒置的連線怎麼死掉：keep-alive 與閒置逾時</h3>
<p>先分清楚三個都叫「keep-alive」的東西：</p>
<table>
<tr><th>名稱</th><th>在哪一層</th><th>做什麼</th></tr>
<tr><td>HTTP keep-alive（持久連線）</td><td>HTTP</td><td>一個請求做完不關連線，下一個請求繼續用。HTTP/1.1 預設就是這樣</td></tr>
<tr><td>TCP keepalive</td><td>核心</td><td>連線閒置一段時間後，核心自動送一個空的探測封包，確認對方還活著。Linux 預設閒置 <b>2 小時</b>才開始探測</td></tr>
<tr><td>應用層心跳（heartbeat）</td><td>你的程式</td><td>例如 WebSocket 的 ping／pong，或你自己定義的小訊息</td></tr>
</table>
<p>問題出在：<b>路上每一個有狀態的設備，都有自己的閒置逾時，而且彼此不知道。</b>NAT 和防火牆的連線追蹤表、負載平衡器、反向代理、你的應用伺服器，每一個都會在連線安靜太久之後，把它從表裡刪掉。被刪掉的那一端通常不會通知任何人。下一個封包到的時候，對方回一個 RST，或乾脆什麼都不回。</p>
<figure class="figure"><svg viewBox="0 0 680 330" class="fg" style="width:100%;max-width:680px" role="img" aria-label="上半是一條路徑上各設備的閒置逾時，下半是負載平衡器和 Node.js 之間的競賽：Node.js 在閒置五秒後關掉連線，同一時間負載平衡器重用這條連線送出新請求，收到 RST，回給使用者 502">
<rect x="10" y="20" width="120" height="44" rx="6" class="fg-b"/><text x="70" y="47" text-anchor="middle" class="fg-t">玩家手機</text>
<rect x="170" y="20" width="130" height="44" rx="6" class="fg-b"/><text x="235" y="47" text-anchor="middle" class="fg-t">電信業者 NAT</text>
<rect x="340" y="20" width="150" height="44" rx="6" class="fg-b alt"/><text x="415" y="47" text-anchor="middle" class="fg-t">負載平衡器</text>
<rect x="530" y="20" width="140" height="44" rx="6" class="fg-b hot"/><text x="600" y="47" text-anchor="middle" class="fg-t">Node.js</text>
<line x1="130" y1="42" x2="162" y2="42" class="fg-l"/><polygon points="170,42 162,37.5 162,46.5" class="fg-a"/>
<line x1="300" y1="42" x2="332" y2="42" class="fg-l"/><polygon points="340,42 332,37.5 332,46.5" class="fg-a"/>
<line x1="490" y1="42" x2="522" y2="42" class="fg-l"/><polygon points="530,42 522,37.5 522,46.5" class="fg-a"/>
<text x="235" y="86" text-anchor="middle" class="fg-t sm">閒置逾時：各家不同</text>
<text x="415" y="86" text-anchor="middle" class="fg-t sm">ALB 預設 60 秒</text>
<text x="600" y="86" text-anchor="middle" class="fg-t sm warm">keepAliveTimeout 5 秒</text>
<line x1="415" y1="110" x2="415" y2="300" class="fg-l dim dash"/>
<line x1="600" y1="110" x2="600" y2="300" class="fg-l dim dash"/>
<line x1="415" y1="134" x2="592" y2="140" class="fg-l"/><polygon points="600,140 592,135.2 592,144.2" class="fg-a"/>
<text x="405" y="138" text-anchor="end" class="fg-t sm">請求 1 →</text>
<line x1="600" y1="150" x2="423" y2="156" class="fg-l"/><polygon points="415,156 423,151.2 423,160.2" class="fg-a"/>
<text x="405" y="160" text-anchor="end" class="fg-t sm">← 回應</text>
<path d="M610 160 H618 V226 H610" class="fg-l warm"/>
<text x="624" y="190" class="fg-t sm warm">閒置</text>
<text x="624" y="206" class="fg-t sm warm">5 秒</text>
<line x1="600" y1="230" x2="423" y2="252" class="fg-l warm"/><polygon points="415,253 423,247.4 424,256.4" class="fg-a warm"/>
<text x="405" y="256" text-anchor="end" class="fg-t sm warm">← FIN（Node 先關了）</text>
<line x1="415" y1="236" x2="592" y2="258" class="fg-l"/><polygon points="600,259 592,253.4 591,262.4" class="fg-a"/>
<text x="405" y="240" text-anchor="end" class="fg-t sm">請求 2 →（同一時間送出）</text>
<line x1="600" y1="268" x2="423" y2="282" class="fg-l warm"/><polygon points="415,283 423,277.8 423.8,286.8" class="fg-a warm"/>
<text x="405" y="286" text-anchor="end" class="fg-t sm warm">← RST</text>
<text x="405" y="306" text-anchor="end" class="fg-t sm warm">回給使用者：502</text>
<text x="340" y="324" text-anchor="middle" class="fg-t sm">規則：越靠後端，閒置逾時要越長。Node.js 的要比負載平衡器的 60 秒長</text>
</svg><figcaption>Node.js 的 HTTP 伺服器預設閒置 5 秒就關掉 keep-alive 連線，AWS ALB 卻會把閒置的後端連線留 60 秒並繼續重用。兩邊的關閉和重用剛好撞在一起時，請求就落在一條已經被關掉的連線上。</figcaption></figure>
<p>這是正式環境裡最難抓的錯誤之一：<b>間歇性的 502，流量越低越常見</b>（因為閒置的連線越多），日誌裡應用程式那一側什麼都沒有，因為請求根本沒進到程式。修法就是圖下那一行規則：</p>
<pre><code>// Node.js：讓後端的閒置逾時比負載平衡器的 60 秒長
const server = app.listen(8080);
server.keepAliveTimeout = 65_000;   // 65 秒
server.headersTimeout = 66_000;     // 要比 keepAliveTimeout 再長一點</code></pre>
<p>Go 的 <code>http.Server</code> 則相反：<code>IdleTimeout</code> 和 <code>ReadTimeout</code> 都沒設時，閒置連線根本不會被主動關掉，要記得設一個比負載平衡器長的值。nginx 當反向代理時，對上游要開 keep-alive，得同時設 <code>keepalive</code>、<code>proxy_http_version 1.1</code>，並把 <code>Connection</code> 標頭清空，否則每個請求都會對後端開新連線。</p>
<h4>長連線的心跳要多頻繁</h4>
<p>WebSocket、遊戲的長連線，要讓整條路上最短的那個閒置逾時永遠等不到。幾個參考值（數量級）：AWS ALB 預設 60 秒、AWS NLB 和 NAT 閘道是 350 秒、nginx 的 <code>proxy_read_timeout</code> 預設 60 秒。電信業者和家用路由器的 NAT 各家不同，有的只有幾分鐘。所以 WebSocket 的心跳常見設在 20 到 30 秒。別指望 TCP keepalive：Linux 預設閒置 2 小時才開始探測，等它發現，NAT 早就忘了這條連線。瀏覽器裡的 JavaScript 不能自己送 WebSocket 的 ping 控制訊框（伺服器送 ping，瀏覽器會自動回 pong），所以由用戶端發起的心跳，要用一般的小訊息。</p>

<h3><span class="badge lv4">專家</span>八、短暫連接埠耗盡與 TIME_WAIT</h3>
<p>你的程式往外連的時候，核心替它挑一個<b>短暫連接埠</b>（ephemeral port）當來源埠。Linux 預設的範圍是 32768 到 60999，一共 28,232 個（<code>net.ipv4.ip_local_port_range</code>）。四元組裡，目的 IP、目的埠、來源 IP 對同一個目的地都是固定的，唯一能變的就是來源埠：</p>
<figure class="figure"><svg viewBox="0 0 680 290" class="fg" style="width:100%;max-width:680px" role="img" aria-label="同一台應用程式伺服器到同一個資料庫的每一條連線，只有來源埠不同；每秒五百條新連線、每條關掉後佔用六十秒，需要三萬個埠，超過可用的兩萬八千多個">
<rect x="10" y="30" width="160" height="90" rx="8" class="fg-b alt"/>
<text x="90" y="68" text-anchor="middle" class="fg-t">應用程式</text>
<text x="90" y="88" text-anchor="middle" class="fg-t sm mono">10.20.1.15</text>
<rect x="510" y="30" width="160" height="90" rx="8" class="fg-b hot"/>
<text x="590" y="68" text-anchor="middle" class="fg-t">PostgreSQL</text>
<text x="590" y="88" text-anchor="middle" class="fg-t sm mono">10.20.72.8:5432</text>
<line x1="170" y1="40" x2="510" y2="75" class="fg-l"/>
<line x1="170" y1="62" x2="510" y2="75" class="fg-l"/>
<line x1="170" y1="84" x2="510" y2="75" class="fg-l"/>
<line x1="170" y1="112" x2="510" y2="75" class="fg-l"/>
<text x="176" y="35" class="fg-t sm mono">:32768</text>
<text x="176" y="57" class="fg-t sm mono">:32769</text>
<text x="176" y="79" class="fg-t sm mono">:32770</text>
<text x="196" y="99" class="fg-t sm">⋮</text>
<text x="176" y="128" class="fg-t sm mono">:60999</text>
<text x="340" y="150" text-anchor="middle" class="fg-t sm">來源 IP、目的 IP、目的埠都一樣，只有來源埠能變</text>
<text x="40" y="180" class="fg-t sm">可用的短暫連接埠：32768–60999，共 28,232 個（不照比例）</text>
<rect x="40" y="188" width="520" height="34" rx="5" class="fg-b warm"/><text x="300" y="210" text-anchor="middle" class="fg-t sm">TIME_WAIT：每條關掉的連線再佔 60 秒</text>
<rect x="560" y="188" width="80" height="34" rx="5" class="fg-b hot"/><text x="600" y="210" text-anchor="middle" class="fg-t sm">使用中</text>
<text x="40" y="248" class="fg-t sm mono">每秒 500 條新連線 × 60 秒 = 30,000 &gt; 28,232</text>
<text x="40" y="272" class="fg-t sm warm">→ connect() 失敗：Cannot assign requested address（EADDRNOTAVAIL）</text>
</svg><figcaption>每個請求都對資料庫開新連線、用完就關，而且是你這邊先關，每一條就會在 TIME_WAIT 裡多佔 60 秒。上限大約是 28,232 ÷ 60 ≈ 每秒 470 條新連線。</figcaption></figure>
<p>症狀很好認：流量一高，程式開始出現 <code>EADDRNOTAVAIL</code>（Cannot assign requested address），<code>ss -s</code> 看到好幾萬個 TIME_WAIT，而且全部連到同一個目的地。解法，依效果排序：</p>
<ol>
<li><b>重用連線。</b>連線池、HTTP keep-alive。一個有 20 條連線的池子，根本不會碰到這個上限。這才是根本的解法，其他都是緩解。</li>
<li><b>讓對方先關。</b>TIME_WAIT 只出現在先關的那一方。如果協定允許，讓伺服器那一側主動關閉，TIME_WAIT 就留在伺服器上，而伺服器那邊的四元組（不同用戶端）本來就很分散。</li>
<li><b>擴大埠的範圍、增加來源 IP。</b>把 <code>ip_local_port_range</code> 調寬，或讓程式從好幾個來源 IP 往外連。</li>
<li><b><code>tcp_tw_reuse</code>。</b>允許核心在安全的情況下（靠時間戳記判斷），把 TIME_WAIT 狀態的埠拿來給新的往外連線用。它只影響往外連的那一方。</li>
</ol>
<p>千萬不要照網路上的舊文章去開 <code>tcp_tw_recycle</code>：它會讓躲在同一個 NAT 後面的用戶端連不上（它們的時間戳記不一致），問題太大，Linux 4.12 已經把它整個拿掉了。</p>
<h4>伺服器那一側的佇列</h4>
<p>交握在核心裡完成，程式還沒 accept() 的連線，排在 accept 佇列裡；它的上限是你在 <code>listen()</code> 時給的 backlog，和核心的 <code>net.core.somaxconn</code> 取小的那個（Linux 5.4 起，somaxconn 預設 4096，以前是 128）。佇列滿了，新的 SYN 或交握的最後一個 ACK 會被丟掉，用戶端只好等 1 秒後重送 SYN，於是你會看到「連線時間」出現整整 1 秒、3 秒的尖峰。<code>nstat</code> 裡的 <code>TcpExtListenOverflows</code> 會一直增加。另外，SYN 洪水攻擊就是故意把半開的連線塞滿；Linux 預設開啟的 SYN cookies，可以在佇列滿的時候不保存狀態，仍然完成合法用戶端的交握。</p>
<h4>檔案描述符</h4>
<p>每一條連線都是一個檔案描述符。很多系統預設每個行程只能開 1,024 個（<code>ulimit -n</code>），撐大量連線的伺服器要調高；用 systemd 跑的服務，是在 unit 檔裡設 <code>LimitNOFILE</code>，在 shell 裡改 ulimit 對它沒有作用。數字不夠時，程式會看到 <code>EMFILE</code>（Too many open files），新的連線一律被拒絕。</p>

<h3><span class="badge lv4">專家</span>九、UDP 與 QUIC：把可靠性搬到使用者空間</h3>
<p><b>UDP</b> 的標頭只有 8 個位元組：來源埠、目的埠、長度、檢查碼。沒有連線、沒有序號、沒有重送、沒有擁塞控制。它不是「比較差的 TCP」，而是「讓你自己決定要什麼」的空白畫布：</p>
<ul>
<li><b>即時遊戲</b>：位置更新掉了就算了，下一個封包帶著更新的位置；只有「撿到道具」「扣血」這種事件需要可靠，自己加序號和確認。這樣掉一個封包，只影響那一個，不會像 TCP 一樣卡住後面全部。</li>
<li><b>要注意的事</b>：UDP 沒有連線，NAT 和防火牆對它的記憶更短（常常只有幾十秒），所以 UDP 的遊戲用戶端要定時送小封包保持對應；沒有擁塞控制，送太快會把別人和自己一起塞爆，你得自己限速；而且 UDP 是放大攻擊的溫床（模組 0 那一章），公開的 UDP 服務回應不能比請求大太多。</li>
</ul>
<p><b>QUIC</b>（2021 年的 RFC 9000，HTTP/3 就跑在它上面）可以看成「在 UDP 上重新做一次 TCP，順便修好 TCP 改不動的地方」：</p>
<table>
<tr><th>問題</th><th>TCP＋TLS</th><th>QUIC</th></tr>
<tr><td>建立連線</td><td>TCP 一個來回，TLS 1.3 再一個</td><td>傳輸和加密合在一起，一個來回；恢復連線可以 0-RTT</td></tr>
<tr><td>隊頭阻塞</td><td>一個封包掉了，整條連線等</td><td>每條串流各自排序，只有那一條等</td></tr>
<tr><td>換網路（Wi-Fi 換成 4G）</td><td>IP 變了，四元組不同，連線斷掉重來</td><td>用連線編號（connection ID）認連線，換 IP 也能繼續</td></tr>
<tr><td>能不能改</td><td>寫在作業系統核心裡，改一次要好幾年</td><td>在使用者空間的函式庫裡，跟著應用程式更新</td></tr>
<tr><td>中間設備看得到什麼</td><td>序號、ACK 都是明文，中間設備可以亂動</td><td>幾乎所有東西都加密，中間設備只能轉送</td></tr>
</table>
<p>代價也很實在：在使用者空間處理每一個封包，CPU 比核心裡的 TCP 貴；有些公司網路會擋或限速 UDP，所以瀏覽器一律準備好退回 TCP；瀏覽器要先知道你支援 HTTP/3，通常是第一次用 HTTP/2 連上時，伺服器回一個 <code>Alt-Svc</code> 標頭，或透過 DNS 的 HTTPS 紀錄；負載平衡器要能看懂連線編號，才能讓換了 IP 的連線回到同一台後端。對瀏覽器遊戲來說，建立在 HTTP/3 上的 WebTransport，提供了「可以不可靠、不排序」的資料傳送，是 WebSocket 之外的新選擇。</p>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td><code>tcp_fin_timeout</code> 可以縮短 TIME_WAIT</td><td>它管的是 FIN_WAIT_2 的孤兒連線。Linux 的 TIME_WAIT 固定 60 秒，不能調。</td></tr>
<tr><td>TIME_WAIT 很多就是出事了</td><td>在伺服器上通常完全正常。只有在「往外連同一個目的地」的那一方，才會吃光短暫連接埠。</td></tr>
<tr><td>CLOSE_WAIT 過一陣子會自己消失</td><td>不會。它會一直留到你的程式關閉連線，堆積起來就是程式碼的洩漏。</td></tr>
<tr><td>開了 TCP keepalive，就不需要心跳</td><td>Linux 預設閒置 2 小時才開始探測，遠遠超過 NAT 和負載平衡器的閒置逾時。要在應用層送心跳，或把 keepalive 的時間調短。</td></tr>
<tr><td>在伺服器開 BBR，玩家的上傳也會變快</td><td>擁塞控制只在傳送端運作。上傳的方向，由玩家裝置的作業系統決定。</td></tr>
<tr><td>HTTP/2 一定比 HTTP/1.1 快</td><td>在丟包率高的網路上，一條 TCP 的隊頭阻塞會讓所有請求一起停，可能比 6 條獨立連線還慢。</td></tr>
<tr><td>UDP 一定比 TCP 快</td><td>在乾淨的網路上，資料傳輸的速度差不多。UDP 的好處是你能決定什麼不必等；可靠性要自己做，做不好反而更慢。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>前端（Vue、TypeScript）</b>：同一個網域的資源放在一起，HTTP/2 和 HTTP/3 才能共用連線；WebSocket 要有心跳和斷線重連（重連要有隨機的等待，避免所有人同時打回來）；行動網路上預期會有卡頓。</li>
<li><b>遊戲（Cocos、Unity）</b>：瀏覽器遊戲用 WebSocket 時，關鍵狀態只送最新的、做好插值；原生用戶端可以考慮 UDP 為基礎的網路層；心跳設在 20 到 30 秒；玩家從 Wi-Fi 切到 4G 時，TCP 連線一定會斷，重連後要能從伺服器狀態恢復。</li>
<li><b>後端（Node.js、Go）</b>：對外呼叫一律用連線池；Node.js 的 <code>keepAliveTimeout</code> 要比負載平衡器長；Go 的 <code>resp.Body</code> 一定要讀完並關閉；每一個網路呼叫都設連線和讀寫逾時，不要依賴核心的兩分鐘和十五分鐘。</li>
<li><b>Docker、雲端</b>：用 <code>ss -s</code> 和 <code>ss -tan state close-wait</code> 當健康檢查的一部分；調整 <code>LimitNOFILE</code>；負載平衡器、NAT 閘道、代理的閒置逾時，整理成一張表放在維運文件裡；要開 BBR 先在一部分機器上量。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<p>先自己講一遍，再打開參考答案。</p>
<ol>
<li>「說明 TCP 的三向交握。為什麼是三次？SYN 裡面除了序號還帶了什麼？」</li>
<li>「TIME_WAIT 是什麼、為什麼存在？伺服器上有很多 TIME_WAIT 要不要緊？什麼情況下會出事？」</li>
<li>「一台服務的 CLOSE_WAIT 一直往上漲，你怎麼判斷原因？」</li>
<li>「TCP 怎麼發現封包遺失、怎麼補？CUBIC 和 BBR 差在哪？」</li>
<li>「服務放在負載平衡器後面，偶爾出現 502，應用程式日誌卻沒有對應的錯誤。你會懷疑什麼？」</li>
<li>「做一個即時對戰遊戲，你會選 TCP、UDP 還是 QUIC？為什麼？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>用戶端送 SYN 帶自己的隨機起始序號；伺服器回 SYN-ACK，帶自己的起始序號並確認用戶端的序號加一；用戶端回 ACK 確認伺服器的序號加一。三次是因為雙方都必須確認對方收到了自己的起始序號，兩次的話伺服器無法知道用戶端是否收到 SYN-ACK，也無法排除過期的舊 SYN。SYN 裡還會協商 MSS、視窗放大倍數、SACK 支援和時間戳記，這些只能在交握時決定。起始序號隨機，是為了防止舊封包混入和序號被猜到而遭偽造。</li>
<li>TIME_WAIT 是主動關閉的一方在送出最後一個 ACK 後停留的狀態，Linux 固定 60 秒。目的有二：最後的 ACK 若遺失，對方會重送 FIN，需要還能回應；並讓這條連線的舊封包在網路中過期，避免同一組四元組被新連線重用時混入。伺服器上大量 TIME_WAIT 通常無害，佔用的記憶體很少，且四元組因用戶端不同而分散。會出事的是大量往外、連同一個目的地的短連線：每條在 TIME_WAIT 佔一個短暫連接埠 60 秒，速率超過約每秒 470 條就會用完，出現 EADDRNOTAVAIL。解法是連線池和 keep-alive，其次才是 tcp_tw_reuse、擴大埠範圍、增加來源 IP。</li>
<li>CLOSE_WAIT 表示對方已經送了 FIN，本機核心也回了 ACK，但本機的應用程式還沒呼叫 close()。它不會自己消失，所以持續上漲幾乎一定是程式碼漏關連線。先用 ss -tanp state close-wait 找出是哪個程式、對端是哪個位址和埠，就知道是哪一類連線（例如對某個上游 API 的 HTTP 用戶端）；再檢查那段程式的錯誤處理路徑、回應主體有沒有讀完並關閉、連線有沒有還回池子。同時注意檔案描述符的使用量，避免被用光。</li>
<li>兩種方式：收到三個重複的 ACK（或依 SACK、RACK 的時間判斷）時快速重送，大約一個來回就補上；沒有後續封包可以觸發時，等重送計時器逾時，RTO 由平滑 RTT 加四倍變動量算出，Linux 下限 200 毫秒，每次逾時加倍。擁塞控制方面，CUBIC 以封包遺失作為塞車訊號，遺失就把視窗減到約七成，再依三次函數長回去並試探更高，會把路由器佇列塞滿；BBR 持續量測瓶頸頻寬和最小 RTT，以兩者乘積為目標在途量並控制送出速率，定期小幅探測頻寬、約每 10 秒重新量最小 RTT，在長距離和有隨機遺失的路上通常吞吐較高、延遲較低，但有公平性和淺緩衝下重傳偏多的爭議。兩者都只作用於傳送端。</li>
<li>先懷疑 keep-alive 的閒置逾時不一致：後端的閒置逾時比負載平衡器短（例如 Node.js 預設 5 秒、ALB 預設 60 秒），後端關閉閒置連線的同時，負載平衡器重用它送出請求，收到 RST，於是回 502；請求從未進入應用程式，所以應用程式日誌沒有紀錄。特徵是間歇發生、低流量時更常見。驗證：看負載平衡器日誌裡 502 的細節和後端連線錯誤指標，或在後端抓封包看 FIN 和請求交錯。修法是讓後端的 keep-alive 逾時大於負載平衡器的閒置逾時，Node.js 同時調整 headersTimeout。也要排除後端崩潰、部署時沒有優雅關閉等原因。</li>
<li>看需求：快節奏、狀態不斷更新的對戰，用 UDP 為基礎，自己決定哪些訊息要可靠，位置更新丟了就用下一個，避免 TCP 的隊頭阻塞讓所有更新一起卡住，但要自己處理限速、NAT 保持和安全（避免放大攻擊）。回合制或節奏慢的遊戲，用 TCP 或 WebSocket 最簡單可靠。瀏覽器裡受限於平台，WebSocket 最普遍，需要更即時時可以用 WebRTC 資料通道或建立在 HTTP/3 上的 WebTransport。QUIC 提供加密、獨立串流和換網路不斷線，適合需要可靠但不想被單一遺失卡住的情境，代價是 CPU 和部分網路擋 UDP，要準備退回方案。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>用戶端的起始序號是 4000。交握完成後，它先送 300 個位元組，再送 200 個位元組。伺服器收到兩段之後回的 ACK 是多少？第二段的 seq 是多少？</li>
<li>Linux 上把 <code>tcp_syn_retries</code> 設成 3，初始 RTO 1 秒。對一台會默默丟掉 SYN 的主機呼叫 <code>connect()</code>，大約多久之後才會失敗？</li>
<li>一台 API 伺服器 <code>ss -s</code> 顯示 TIME_WAIT 45,000、ESTABLISHED 800，另一台出現大量 <code>EADDRNOTAVAIL</code>。分別該不該擔心？要怎麼進一步確認？</li>
<li>讀下面這行，說出問題可能在哪一端：<code>ESTAB  0  412000  10.20.1.15:443  198.51.100.3:61203</code>。如果換成 Recv-Q 是 412000、Send-Q 是 0 呢？</li>
<li>一個 WebSocket 服務的路徑是：玩家 → 電信業者 NAT（假設 4 分鐘）→ ALB（閒置 60 秒）→ nginx（<code>proxy_read_timeout</code> 60 秒）→ Node.js。心跳要設多久一次？由誰送比較好？</li>
<li>用自己的話解釋：為什麼在 2% 丟包率的行動網路上，同一條 WebSocket 傳的遊戲狀態會「一頓一頓」，而 UDP 為基礎的協定比較不會？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>SYN 佔掉 4000，第一個資料位元組是 4001。第一段 4001 到 4300，第二段的 seq 是 4301，涵蓋 4301 到 4500。收完兩段，伺服器回 ack=4501。</li>
<li>初次送 SYN 後，在第 1、3、7 秒各重送一次（間隔 1、2、4 秒），最後一次重送後再等 8 秒，總共約 15 秒才失敗。預設的 6 次則是約 127 秒。</li>
<li>第一台多半不用擔心：伺服器上的 TIME_WAIT 是主動關閉的正常結果，用 <code>ss -tan state time-wait</code> 看對端是不是分散的用戶端就能確認。第二台要處理：用 <code>ss -tan state time-wait</code> 看它們是否集中連到同一個目的 IP 和埠，若是，就是每次開新連線造成短暫連接埠用完，改用連線池或 keep-alive。</li>
<li>Send-Q 412,000：資料已經送出但對方沒確認，問題在網路或對方（對方收得慢、視窗小、路上遺失）。Recv-Q 412,000：資料已到本機但程式沒讀，問題在本機程式（卡住、處理太慢、事件迴圈被阻塞）。</li>
<li>路上最短的閒置逾時是 60 秒（ALB 和 nginx），心跳要明顯小於它，例如 25 到 30 秒，同時也小於 NAT 的 4 分鐘。由伺服器送 ping 訊框，瀏覽器會自動回 pong，可以讓整條路雙向都有流量；若需要用戶端主動偵測斷線，用戶端也要送應用層的小訊息。nginx 的 <code>proxy_read_timeout</code> 也可以視情況調長，但心跳仍然要有。</li>
<li>WebSocket 跑在一條 TCP 上，TCP 保證順序：一個封包掉了，後面已經到的所有狀態更新都卡在核心的緩衝區，要等重送（至少一個來回，掉在尾巴還要等 RTO），然後一口氣交給程式，畫面就先停住再跳一下。2% 的遺失代表這件事很常發生。UDP 為基礎的協定把每個封包獨立交給程式，位置更新掉了就用下一個，不必等，只有真正需要可靠的事件才重送。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>W. Richard Stevens 等《UNIX Network Programming, Volume 1: The Sockets Networking API》</b>：socket 程式設計的經典，connect、accept、backlog、TIME_WAIT、SO_LINGER、非阻塞 I/O，都講到實作層級。</li>
<li><b>Kevin Fall 與 W. Richard Stevens《TCP/IP Illustrated, Volume 1》</b>：TCP 的狀態機、重送、擁塞控制，每一章都有真實封包的追蹤。</li>
<li><b>Neal Cardwell 等〈BBR: Congestion-Based Congestion Control〉</b>（ACM Queue，2016）：Google 團隊親自解釋 BBR 的模型和量測方法，寫給工程師看的，不難讀。</li>
<li><b>Linux 的 man 頁面 <code>tcp(7)</code>、<code>ss(8)</code>，以及核心文件 ip-sysctl</b>：每一個 <code>tcp_*</code> 參數的意思和預設值，以官方說明為準。</li>
<li><b>RFC 9293（TCP）與 RFC 9000（QUIC）</b>：規格原文。讀完這一章再去翻狀態機和連線編號的章節，會發現每一步都寫得很清楚。</li>
</ul>
` });
