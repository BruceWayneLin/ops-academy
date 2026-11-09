DEEP({ 'srv-what': `
<p>上一課你用一行 <code>python3 -m http.server</code> 開了一台伺服器，再用 <code>lsof</code> 看到它處在 LISTEN 狀態。這一章把「聆聽」打開來看：程式跟作業系統核心之間到底說了哪幾句話、連線在核心裡排的是哪兩條隊、為什麼一支程式可以同時服務一萬個人。接著往上走，看 systemd 怎麼把程式顧好、狀態要放在哪裡才不會在擴充時出事，最後拆開虛擬機、容器、無伺服器，看它們各自跟鄰居共用了哪一層。這些是你之後每次「服務連不上」「部署時掉請求」「容器莫名被殺」時，第一個要想到的地方。</p>

<h3><span class="badge lv1">基礎</span>一、「在連接埠上聆聽」到底是什麼</h3>
<p>先用一個比喻。一台伺服器像一間公司，<b>核心</b>（kernel）是總機小姐，<b>連接埠</b>（port）是分機號碼，你的程式是坐在某個座位上的員工。外面打電話進來，說「我要找 8080 分機」：</p>
<ul>
<li>如果沒有人登記 8080，總機直接回一句「沒這個分機」。這就是你看到的 <b>connection refused</b>：核心回了一個 RST 封包。</li>
<li>如果有人登記了，總機會先幫你把電話接通（TCP 三向交握），放在一旁等你拿起話筒。</li>
</ul>
<p>重點在第二點：<b>接通電話的是總機，不是你</b>。你的程式從頭到尾沒碰過 SYN、ACK 這些封包，它只負責去拿「已經接通的電話」。程式跟核心之間，靠的是五個系統呼叫（system call，第 0.9 課）：</p>
<figure class="figure"><svg viewBox="0 0 660 300" class="fg" style="width:100%;max-width:660px" role="img" aria-label="伺服器程式依序呼叫 socket、bind、listen、accept、read 與 write，核心分別建立 socket、綁上位址、開始聆聽、交出新連線、搬運資料">
<text x="180" y="24" text-anchor="middle" class="fg-t lg">你的程式（使用者空間）</text>
<text x="500" y="24" text-anchor="middle" class="fg-t lg">核心（kernel）</text>
<line x1="325" y1="36" x2="325" y2="290" class="fg-l dim dash"/>
<rect x="70" y="44" width="220" height="36" rx="6" class="fg-b"/><text x="180" y="67" text-anchor="middle" class="fg-t mono">socket()</text>
<rect x="360" y="44" width="280" height="36" rx="6" class="fg-b"/><text x="500" y="67" text-anchor="middle" class="fg-t">建一個 socket，回傳編號 fd 3</text>
<line x1="290" y1="62" x2="352" y2="62" class="fg-l"/><polygon points="360,62 352,57.5 352,66.5" class="fg-a"/>
<rect x="70" y="94" width="220" height="36" rx="6" class="fg-b"/><text x="180" y="117" text-anchor="middle" class="fg-t mono">bind(3, 0.0.0.0:8080)</text>
<rect x="360" y="94" width="280" height="36" rx="6" class="fg-b"/><text x="500" y="117" text-anchor="middle" class="fg-t">把 fd 3 綁到這個位址和連接埠</text>
<line x1="290" y1="112" x2="352" y2="112" class="fg-l"/><polygon points="360,112 352,107.5 352,116.5" class="fg-a"/>
<rect x="70" y="144" width="220" height="36" rx="6" class="fg-b"/><text x="180" y="167" text-anchor="middle" class="fg-t mono">listen(3, 511)</text>
<rect x="360" y="144" width="280" height="36" rx="6" class="fg-b hot"/><text x="500" y="167" text-anchor="middle" class="fg-t acc">變成 LISTEN，開始幫你接電話</text>
<line x1="290" y1="162" x2="352" y2="162" class="fg-l on"/><polygon points="360,162 352,157.5 352,166.5" class="fg-a on"/>
<rect x="70" y="194" width="220" height="36" rx="6" class="fg-b alt"/><text x="180" y="217" text-anchor="middle" class="fg-t mono">accept(3)</text>
<rect x="360" y="194" width="280" height="36" rx="6" class="fg-b alt"/><text x="500" y="217" text-anchor="middle" class="fg-t">交出一條接通的連線：fd 4</text>
<line x1="290" y1="212" x2="352" y2="212" class="fg-l alt"/><polygon points="360,212 352,207.5 352,216.5" class="fg-a alt"/>
<rect x="70" y="244" width="220" height="36" rx="6" class="fg-b"/><text x="180" y="267" text-anchor="middle" class="fg-t mono">read(4) / write(4)</text>
<rect x="360" y="244" width="280" height="36" rx="6" class="fg-b"/><text x="500" y="267" text-anchor="middle" class="fg-t">收請求、送回應，然後 close(4)</text>
<line x1="290" y1="262" x2="352" y2="262" class="fg-l"/><polygon points="360,262 352,257.5 352,266.5" class="fg-a"/>
<path d="M70 262 H52 V212 H62" class="fg-l on"/><polygon points="70,212 62,207.5 62,216.5" class="fg-a on"/>
<text x="46" y="242" text-anchor="end" class="fg-t sm acc">下一位</text>
</svg><figcaption>前三步只做一次，之後程式就在最後兩步之間打轉。注意 fd 3 從頭到尾只負責「接新客人」，真正講話用的是 accept 交出來的新編號 fd 4、fd 5……</figcaption></figure>
<p><b>fd</b> 是檔案描述符（file descriptor），核心發給程式的一張號碼牌；第一張通常是 3，因為 0、1、2 已經給了標準輸入、標準輸出和標準錯誤。Linux 上「一切都是檔案」，socket 也是，所以讀寫連線跟讀寫檔案用的是同一組 <code>read</code>、<code>write</code>。用 Python 把這五步一個一個寫出來，就是一台最陽春的網頁伺服器：</p>
<pre><code>import socket
s = socket.socket()           # socket()
s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
s.bind(('0.0.0.0', 8080))     # bind()
s.listen(511)                 # listen()
while True:
    conn, addr = s.accept()   # 沒人來就停在這裡
    conn.recv(1024)           # 讀請求，不管內容
    conn.sendall(b'HTTP/1.1 200 OK\\r\\n'
                 b'Content-Length: 2\\r\\n\\r\\nhi')
    conn.close()</code></pre>
<p>你平常寫的 Node.js <code>app.listen(8080)</code>、Go 的 <code>http.ListenAndServe(":8080", nil)</code>，裡面做的就是前三步，再加一個幫你跑 accept 的迴圈。框架把它藏起來了，但出問題時，錯誤訊息講的都是這五步的語言：<code>EADDRINUSE</code> 是 bind 失敗，<code>ECONNREFUSED</code> 是沒有人 listen，<code>EMFILE</code> 是 accept 時號碼牌發完了。</p>

<h3><span class="badge lv1">基礎</span>二、一個連接埠，為什麼接得了一萬個人</h3>
<p>很多人以為「一個連接埠一次只能接一條連線」。不對。核心分辨連線，看的不是一個號碼，而是<b>四個數字</b>（four-tuple）：來源 IP、來源連接埠、目的 IP、目的連接埠。只要四個數字裡有一個不同，就是另一條連線。</p>
<figure class="figure"><svg viewBox="0 0 640 260" class="fg" style="width:100%;max-width:640px" role="img" aria-label="三個用戶端連到同一台伺服器的 8080 連接埠，核心靠來源位址和來源連接埠分辨，各給一個新的檔案描述符">
<text x="115" y="88" text-anchor="middle" class="fg-t lg">用戶端（來源）</text>
<rect x="20" y="105" width="190" height="30" rx="5" class="fg-b"/><text x="115" y="125" text-anchor="middle" class="fg-t mono">203.0.113.7:51000</text>
<rect x="20" y="150" width="190" height="30" rx="5" class="fg-b"/><text x="115" y="170" text-anchor="middle" class="fg-t mono">198.51.100.4:62011</text>
<rect x="20" y="195" width="190" height="30" rx="5" class="fg-b"/><text x="115" y="215" text-anchor="middle" class="fg-t mono">198.51.100.4:62012</text>
<rect x="290" y="40" width="340" height="196" rx="10" class="fg-b"/>
<text x="306" y="62" class="fg-t lg">伺服器 10.0.0.5</text>
<rect x="310" y="72" width="300" height="26" rx="5" class="fg-b hot"/><text x="460" y="90" text-anchor="middle" class="fg-t acc">fd 3　聆聽 *:8080　只接新客人</text>
<rect x="400" y="105" width="210" height="30" rx="5" class="fg-b alt"/><text x="505" y="125" text-anchor="middle" class="fg-t">fd 4（已連線）</text>
<rect x="400" y="150" width="210" height="30" rx="5" class="fg-b alt"/><text x="505" y="170" text-anchor="middle" class="fg-t">fd 5（已連線）</text>
<rect x="400" y="195" width="210" height="30" rx="5" class="fg-b alt"/><text x="505" y="215" text-anchor="middle" class="fg-t">fd 6（已連線）</text>
<line x1="210" y1="120" x2="392" y2="120" class="fg-l alt"/><polygon points="400,120 392,115.5 392,124.5" class="fg-a alt"/>
<line x1="210" y1="165" x2="392" y2="165" class="fg-l alt"/><polygon points="400,165 392,160.5 392,169.5" class="fg-a alt"/>
<line x1="210" y1="210" x2="392" y2="210" class="fg-l alt"/><polygon points="400,210 392,205.5 392,214.5" class="fg-a alt"/>
<text x="250" y="114" text-anchor="middle" class="fg-t sm">到 :8080</text>
<text x="250" y="159" text-anchor="middle" class="fg-t sm">到 :8080</text>
<text x="250" y="204" text-anchor="middle" class="fg-t sm">到 :8080</text>
<text x="320" y="254" text-anchor="middle" class="fg-t sm">後兩條來自同一台筆電的兩個分頁：只差在來源連接埠，核心就分得出來</text>
</svg><figcaption>目的地全都是 10.0.0.5:8080，但四個數字組起來各不相同，所以是三條不同的連線，各拿一個新的 fd。聆聽用的 fd 3 本身從來不傳資料。</figcaption></figure>
<p>所以一個連接埠能接多少人，不是被「連接埠」卡住，而是被三樣東西卡住：fd 的上限（很多系統預設每個行程 1,024 個）、每條連線吃的記憶體，以及你的程式處理得多快。</p>
<h4>bind 的位址：0.0.0.0 和 127.0.0.1 差很多</h4>
<table>
<tr><th>bind 到</th><th>誰連得到</th><th>常見場合</th></tr>
<tr><td><code>127.0.0.1</code>（localhost）</td><td>只有同一台機器上的程式</td><td>資料庫只給本機的應用程式用；本機開發</td></tr>
<tr><td><code>0.0.0.0</code></td><td>這台機器所有網路介面，外面也連得到</td><td>對外服務、容器裡的服務</td></tr>
<tr><td>某一個 IP，例如 <code>10.0.0.5</code></td><td>只有從那張網卡進來的連線</td><td>只想對內網開放</td></tr>
</table>
<p>這張表解釋了兩個天天有人踩的坑。第一，<b>容器裡的程式只聽 127.0.0.1</b>：Docker 的 <code>-p 8080:8080</code> 會把流量轉到容器自己的網路介面，不是容器裡的 localhost，所以從外面連會失敗，常見的訊息是 connection reset 或 empty reply。容器裡的服務一定要聽 <code>0.0.0.0</code>。第二，前端開發伺服器（例如 Vite）預設只聽 localhost，所以你用手機連電腦的 IP 會被拒絕，要加 <code>--host</code> 才行。</p>
<h4>另外兩個常見錯誤</h4>
<ul>
<li><b>Address already in use</b>（EADDRINUSE）：已經有別的行程 bind 了同一個位址和連接埠。用 <code>lsof -nP -iTCP:8080 -sTCP:LISTEN</code> 找出是誰。剛重啟的伺服器也可能遇到，因為舊連線還在 TIME_WAIT，這時要在 bind 之前打開 <code>SO_REUSEADDR</code>（上面的 Python 那一行），大部分框架都預設開好了。</li>
<li><b>1024 以下的連接埠</b>：在 Linux 上，一般使用者不能 bind 80、443 這類小號碼，要 root 或 <code>CAP_NET_BIND_SERVICE</code> 這項權限。正式環境的常見做法是讓程式聽 8080 這種大號碼，前面放 nginx 或負載平衡器（load balancer）來聽 80 和 443。</li>
</ul>

<h3><span class="badge lv2">進階</span>三、核心裡的兩條佇列：連線在被你 accept 之前排在哪裡</h3>
<p>listen 之後，核心會替這個 socket 準備兩條隊伍。跟著一條連線走一次：</p>
<figure class="figure"><svg viewBox="0 40 700 210" class="fg" style="width:100%;max-width:700px" role="img" aria-label="用戶端送出 SYN 後連線進入 SYN 佇列，三向交握完成後移到 accept 佇列，程式呼叫 accept 才把它拿走">
<rect x="10" y="56" width="90" height="94" rx="8" class="fg-b"/><text x="55" y="108" text-anchor="middle" class="fg-t">用戶端</text>
<line x1="100" y1="84" x2="172" y2="84" class="fg-l"/><polygon points="180,84 172,79.5 172,88.5" class="fg-a"/>
<text x="140" y="78" text-anchor="middle" class="fg-t sm">① SYN</text>
<line x1="108" y1="108" x2="180" y2="108" class="fg-l"/><polygon points="100,108 108,103.5 108,112.5" class="fg-a"/>
<text x="140" y="102" text-anchor="middle" class="fg-t sm">② SYN-ACK</text>
<line x1="100" y1="132" x2="172" y2="132" class="fg-l"/><polygon points="180,132 172,127.5 172,136.5" class="fg-a"/>
<text x="140" y="126" text-anchor="middle" class="fg-t sm">③ ACK</text>
<rect x="180" y="56" width="150" height="94" rx="8" class="fg-b warm"/>
<text x="255" y="78" text-anchor="middle" class="fg-t warm">SYN 佇列</text>
<text x="255" y="96" text-anchor="middle" class="fg-t sm">半開：交握還沒完成</text>
<rect x="197" y="110" width="24" height="22" rx="3" class="fg-b warm"/><rect x="227" y="110" width="24" height="22" rx="3" class="fg-b"/><rect x="257" y="110" width="24" height="22" rx="3" class="fg-b"/><rect x="287" y="110" width="24" height="22" rx="3" class="fg-b"/>
<line x1="330" y1="103" x2="392" y2="103" class="fg-l on"/><polygon points="400,103 392,98.5 392,107.5" class="fg-a on"/>
<text x="365" y="96" text-anchor="middle" class="fg-t sm acc">③ 到了</text>
<rect x="400" y="56" width="150" height="94" rx="8" class="fg-b hot"/>
<text x="475" y="78" text-anchor="middle" class="fg-t acc">accept 佇列</text>
<text x="475" y="96" text-anchor="middle" class="fg-t sm">交握完成，等你來拿</text>
<rect x="417" y="110" width="24" height="22" rx="3" class="fg-b hot"/><rect x="447" y="110" width="24" height="22" rx="3" class="fg-b hot"/><rect x="477" y="110" width="24" height="22" rx="3" class="fg-b hot"/><rect x="507" y="110" width="24" height="22" rx="3" class="fg-b"/>
<line x1="550" y1="103" x2="602" y2="103" class="fg-l alt"/><polygon points="610,103 602,98.5 602,107.5" class="fg-a alt"/>
<text x="580" y="96" text-anchor="middle" class="fg-t sm mono alt">accept()</text>
<rect x="610" y="56" width="80" height="94" rx="8" class="fg-b alt"/><text x="650" y="100" text-anchor="middle" class="fg-t">你的</text><text x="650" y="118" text-anchor="middle" class="fg-t">程式</text>
<text x="255" y="176" text-anchor="middle" class="fg-t sm">SYN 洪水塞爆的是這條</text>
<text x="255" y="196" text-anchor="middle" class="fg-t sm warm">滿了：改用 SYN cookies</text>
<text x="475" y="176" text-anchor="middle" class="fg-t sm mono">上限 min(backlog, somaxconn)</text>
<text x="475" y="196" text-anchor="middle" class="fg-t sm warm">滿了：丟掉，用戶端重送</text>
<text x="350" y="236" text-anchor="middle" class="fg-t sm">用 ss -lnt 看聆聽中的 socket：Recv-Q 是現在排了幾條，Send-Q 是上限</text>
</svg><figcaption>交握全由核心完成。你的程式只從右邊那條隊伍拿已經接通的連線；拿得太慢，隊伍就滿，新客人就開始被丟掉。</figcaption></figure>
<ol>
<li>手機送來 SYN（「我想連 8080」）。核心在 SYN 佇列裡記一筆「半開」的連線，回 SYN-ACK。</li>
<li>手機回 ACK。三向交握完成，核心把這筆紀錄從 SYN 佇列搬到 <b>accept 佇列</b>。到這一刻為止，你的程式什麼都不知道。</li>
<li>你的程式呼叫 <code>accept()</code>，核心從 accept 佇列頭拿出一條，發一個新的 fd 給程式。</li>
</ol>
<p><code>listen(fd, 511)</code> 的第二個參數 <b>backlog</b>，就是 accept 佇列的長度上限，但核心還會拿它跟 <code>net.core.somaxconn</code> 比，取比較小的那個。Linux 5.4 之後 somaxconn 預設是 4096，更舊的系統是 128。Node.js 的 <code>listen</code> 預設 backlog 是 511，nginx 在 Linux 上預設也是 511。</p>
<h4>實際看一次</h4>
<pre><code>$ ss -lnt
State   Recv-Q  Send-Q   Local Address:Port
LISTEN  0       511            0.0.0.0:8080
LISTEN  511     511            0.0.0.0:9090</code></pre>
<p>對 LISTEN 狀態的 socket，<b>Recv-Q</b> 是 accept 佇列裡現在排著幾條，<b>Send-Q</b> 是上限。8080 那一行是健康的：0 條在排，程式拿得很快。9090 那一行是滿的：程式卡住了（可能一段同步程式跑太久，或所有執行緒都在等資料庫），核心幫它接好的電話堆到 511 條沒人拿。</p>
<h4>佇列滿了會怎樣</h4>
<p>Linux 的預設行為是<b>默默丟掉</b>，不回拒絕。用戶端那邊不會馬上看到錯誤，而是等不到回應，在大約 1 秒、再過 2 秒……之後重送。所以 accept 佇列滿的典型症狀很好認：<b>延遲突然出現 1 秒、3 秒這種整齊的數字</b>，CPU 卻不一定高。確認的方法是看核心的計數器：</p>
<pre><code>$ nstat -az TcpExtListenOverflows TcpExtListenDrops
TcpExtListenOverflows    1873    0.0
TcpExtListenDrops        1873    0.0</code></pre>
<p>這兩個數字一直在長，就是 accept 佇列滿過。治本是讓程式拿得更快（找出卡住的地方、多開幾個行程），治標才是把 backlog 和 somaxconn 調大。把隊伍排長只是讓人等更久，不會讓你處理得更快。</p>

<h3><span class="badge lv2">進階</span>四、同時服務很多人：一個行程、一條執行緒，還是一個事件迴圈</h3>
<p>上面的 Python 程式一次只能服務一個人：它在 <code>recv</code> 等第一位客人講話時，第二位只能在 accept 佇列裡排隊。要同時服務很多人，有三種經典做法：</p>
<figure class="figure"><svg viewBox="0 0 680 280" class="fg" style="width:100%;max-width:680px" role="img" aria-label="三種伺服器模型：每連線一個行程、每連線一條執行緒、一條執行緒用事件迴圈照顧所有連線">
<text x="115" y="26" text-anchor="middle" class="fg-t lg">每連線一個行程</text>
<rect x="65" y="44" width="100" height="30" rx="5" class="fg-b"/><text x="115" y="64" text-anchor="middle" class="fg-t">主行程</text>
<path d="M115 74 V92 H50 V102" class="fg-l"/><path d="M115 92 V102" class="fg-l"/><path d="M115 92 H180 V102" class="fg-l"/>
<polygon points="50,110 45.5,102 54.5,102" class="fg-a"/><polygon points="115,110 110.5,102 119.5,102" class="fg-a"/><polygon points="180,110 175.5,102 184.5,102" class="fg-a"/>
<rect x="20" y="110" width="60" height="30" rx="5" class="fg-b warm"/><text x="50" y="130" text-anchor="middle" class="fg-t sm">行程</text>
<rect x="85" y="110" width="60" height="30" rx="5" class="fg-b warm"/><text x="115" y="130" text-anchor="middle" class="fg-t sm">行程</text>
<rect x="150" y="110" width="60" height="30" rx="5" class="fg-b warm"/><text x="180" y="130" text-anchor="middle" class="fg-t sm">行程</text>
<line x1="50" y1="140" x2="50" y2="173" class="fg-l dim"/><line x1="115" y1="140" x2="115" y2="173" class="fg-l dim"/><line x1="180" y1="140" x2="180" y2="173" class="fg-l dim"/>
<circle cx="50" cy="180" r="7" class="fg-b"/><circle cx="115" cy="180" r="7" class="fg-b"/><circle cx="180" cy="180" r="7" class="fg-b"/>
<text x="115" y="212" text-anchor="middle" class="fg-t sm">隔離最好：一個掛了不拖累別人</text>
<text x="115" y="230" text-anchor="middle" class="fg-t sm warm">每個幾 MB，切換最貴</text>
<text x="115" y="262" text-anchor="middle" class="fg-t sm">PostgreSQL、Apache prefork</text>
<line x1="227" y1="20" x2="227" y2="270" class="fg-l dim dash"/>
<text x="340" y="26" text-anchor="middle" class="fg-t lg">每連線一條執行緒</text>
<rect x="245" y="44" width="190" height="106" rx="8" class="fg-b"/><text x="340" y="64" text-anchor="middle" class="fg-t">一個行程，共用記憶體</text>
<rect x="255" y="90" width="50" height="34" rx="5" class="fg-b alt"/><text x="280" y="111" text-anchor="middle" class="fg-t sm">執行緒</text>
<rect x="315" y="90" width="50" height="34" rx="5" class="fg-b alt"/><text x="340" y="111" text-anchor="middle" class="fg-t sm">執行緒</text>
<rect x="375" y="90" width="50" height="34" rx="5" class="fg-b alt"/><text x="400" y="111" text-anchor="middle" class="fg-t sm">執行緒</text>
<line x1="280" y1="124" x2="280" y2="173" class="fg-l dim"/><line x1="340" y1="124" x2="340" y2="173" class="fg-l dim"/><line x1="400" y1="124" x2="400" y2="173" class="fg-l dim"/>
<circle cx="280" cy="180" r="7" class="fg-b"/><circle cx="340" cy="180" r="7" class="fg-b"/><circle cx="400" cy="180" r="7" class="fg-b"/>
<text x="340" y="212" text-anchor="middle" class="fg-t sm">比行程輕，寫起來最直覺</text>
<text x="340" y="230" text-anchor="middle" class="fg-t sm warm">上萬條：記憶體和切換吃不消</text>
<text x="340" y="262" text-anchor="middle" class="fg-t sm">MySQL、傳統 Java 伺服器</text>
<line x1="453" y1="20" x2="453" y2="270" class="fg-l dim dash"/>
<text x="565" y="26" text-anchor="middle" class="fg-t lg">一個事件迴圈</text>
<rect x="500" y="44" width="130" height="56" rx="8" class="fg-b hot"/><text x="565" y="66" text-anchor="middle" class="fg-t acc">一條執行緒</text><text x="565" y="86" text-anchor="middle" class="fg-t sm mono">epoll_wait()</text>
<line x1="480" y1="173" x2="565" y2="100" class="fg-l dim"/><line x1="515" y1="173" x2="565" y2="100" class="fg-l dim"/><line x1="550" y1="173" x2="565" y2="100" class="fg-l dim"/><line x1="585" y1="173" x2="565" y2="100" class="fg-l dim"/><line x1="620" y1="173" x2="565" y2="100" class="fg-l dim"/><line x1="655" y1="173" x2="565" y2="100" class="fg-l dim"/>
<circle cx="480" cy="180" r="7" class="fg-b"/><circle cx="515" cy="180" r="7" class="fg-b"/><circle cx="550" cy="180" r="7" class="fg-b"/><circle cx="585" cy="180" r="7" class="fg-b"/><circle cx="620" cy="180" r="7" class="fg-b"/><circle cx="655" cy="180" r="7" class="fg-b"/>
<text x="565" y="212" text-anchor="middle" class="fg-t sm">一萬條連線只是一萬筆資料</text>
<text x="565" y="230" text-anchor="middle" class="fg-t sm warm">一段同步程式卡住所有人</text>
<text x="565" y="262" text-anchor="middle" class="fg-t sm">nginx、Node.js、Redis</text>
</svg><figcaption>小圓圈是連線。左邊每條連線配一個行程，中間配一條執行緒，右邊所有連線共用一條執行緒，誰有資料就先處理誰。</figcaption></figure>
<h4>每連線一個行程：最安全、最貴</h4>
<p>主行程 accept 到一條連線，就 <code>fork()</code> 出一個子行程專門照顧它。好處是每個行程有自己的記憶體，一個當掉不會影響別人。PostgreSQL 到今天還是這樣做：每條資料庫連線就是一個後端行程，通常要吃幾 MB 到十幾 MB 記憶體（量級）。這就是為什麼 PostgreSQL 預設 <code>max_connections</code> 只有 100，也是為什麼大家會在前面放 PgBouncer 這種連線池（第 3.3 課）。</p>
<h4>每連線一條執行緒：直覺，但有天花板</h4>
<p>執行緒（thread）共用同一個行程的記憶體，開起來比行程便宜。程式可以照「讀請求、查資料庫、回答」一路寫下去，卡住就卡住，反正每個人有自己的執行緒。問題在數量：Linux 上每條執行緒預設保留 8 MB 的虛擬堆疊空間（實際用掉的少很多，但每條至少也要幾十 KB），而且一萬條執行緒輪流上 CPU，每次切換要花一到幾微秒，還會把快取洗掉。這就是 1999 年有人寫文章點名的 <b>C10K 問題</b>（C10K problem）：一台機器要怎麼同時撐住一萬條連線。</p>
<h4>事件迴圈：一條執行緒，問核心「誰準備好了」</h4>
<p>答案是讓一條執行緒同時盯住所有連線，但只處理「現在有事」的那幾條。Linux 提供 <b>epoll</b>（macOS 是 kqueue），流程是這樣：</p>
<ol>
<li>把一萬個 socket 都登記給 epoll：「這些有資料進來時叫我」。</li>
<li>呼叫 <code>epoll_wait()</code> 睡覺。</li>
<li>核心叫醒你，給你一張清單：「fd 17、fd 4203、fd 9001 有資料了」。</li>
<li>只處理這三條，每條都只做到「需要再等」為止，絕不卡住，然後回到第 2 步。</li>
</ol>
<p>每次醒來的成本只跟「有事的連線數」有關，跟總連線數無關。一條閒置的 WebSocket 連線，對事件迴圈來說只是記憶體裡的一筆資料，幾 KB 而已。nginx、Node.js、Redis 都是這樣運作的。</p>
<p>代價你在第 0.9 課已經看過：所有連線共用一條執行緒，只要有一段同步程式碼跑 200 毫秒（一個很大的 <code>JSON.parse</code>、一個寫壞的正規表示式），這 200 毫秒裡<b>所有人</b>都在等。Node.js 把讀檔、DNS 查詢、部分加密運算丟給背景的 libuv 執行緒池（預設 4 條），但你自己寫的 JavaScript 永遠只在那一條主執行緒上跑。</p>
<h4>現代的折衷：Go 的 goroutine</h4>
<p>Go 讓你照「一條連線一條執行緒」的直覺寫程式，每條連線開一個 goroutine，卡住就卡住；但 goroutine 不是作業系統的執行緒，它的堆疊一開始只有 2 KB，由 Go 執行環境自己在少數幾條真正的執行緒上排程，底下用的還是 epoll。所以 Go 可以開十萬個 goroutine，寫起來卻像同步程式。這叫 M:N 排程：M 個 goroutine 跑在 N 條執行緒上。</p>
<h4>多核心怎麼辦</h4>
<p>一個事件迴圈只用得到一顆核心。8 核心的機器，nginx 會開 8 個 worker 行程（<code>worker_processes auto</code>），Node.js 則是開多個行程（cluster 模組、pm2，或在 Kubernetes 上直接開多個 Pod）。這些行程怎麼共用同一個 8080？這是第八節的題目。</p>

<h3><span class="badge lv3">專業</span>五、systemd：誰叫醒你的服務，掛了誰把它拉回來</h3>
<p>你在終端機裡跑 <code>node server.js</code>，SSH 一斷，程式就跟著死；機器重開，也不會有人幫你再跑一次。正式環境需要一個「管家」，在開機時把服務叫起來、死掉時拉回來、把輸出收進日誌。在現代 Linux 上，這個管家就是 <b>systemd</b>，它是開機後的第一個行程，PID 1。你用一個 unit 檔告訴它服務長什麼樣子：</p>
<pre><code># /etc/systemd/system/hilo.service
[Unit]
Description=Higher or Lower API
After=network-online.target
Wants=network-online.target

[Service]
User=hilo
WorkingDirectory=/srv/hilo
ExecStart=/usr/bin/node server.js
Environment=NODE_ENV=production PORT=8080
Restart=on-failure
RestartSec=2
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target</code></pre>
<p>一行一行看：<code>User=hilo</code> 讓服務用一個沒有特權的帳號跑，被入侵時損害比較小；<code>Restart=on-failure</code> 表示行程非正常結束（結束碼不是 0、被訊號殺掉）就重啟；<code>RestartSec=2</code> 是重啟前先等 2 秒，避免一直狂重啟；<code>LimitNOFILE</code> 把 fd 上限調高，不然高連線數時會撞到 1,024 的預設值；<code>WantedBy=multi-user.target</code> 表示「正常開機時要啟動我」。然後：</p>
<pre><code># 讀進新的 unit 檔，設成開機啟動，並且現在就啟動
sudo systemctl daemon-reload
sudo systemctl enable --now hilo
# 看狀態、PID 和最後幾行日誌；持續追這個服務的日誌
systemctl status hilo
journalctl -u hilo -f</code></pre>
<figure class="figure"><svg viewBox="0 0 600 236" class="fg" style="width:100%;max-width:600px" role="img" aria-label="systemd 服務的狀態：停止、啟動中、執行中；掛掉後進入自動重啟，太常掛就進入失敗狀態不再重試">
<path d="M500 50 V30 H85 V42" class="fg-l"/><polygon points="85,50 80.5,42 89.5,42" class="fg-a"/>
<text x="292" y="22" text-anchor="middle" class="fg-t sm">systemctl stop：先送 SIGTERM，最多等 90 秒再送 SIGKILL</text>
<rect x="20" y="50" width="130" height="44" rx="6" class="fg-b"/><text x="85" y="69" text-anchor="middle" class="fg-t mono">inactive</text><text x="85" y="86" text-anchor="middle" class="fg-t sm">停止</text>
<rect x="220" y="50" width="140" height="44" rx="6" class="fg-b"/><text x="290" y="69" text-anchor="middle" class="fg-t mono">activating</text><text x="290" y="86" text-anchor="middle" class="fg-t sm">啟動中</text>
<rect x="430" y="50" width="140" height="44" rx="6" class="fg-b hot"/><text x="500" y="69" text-anchor="middle" class="fg-t mono acc">active</text><text x="500" y="86" text-anchor="middle" class="fg-t sm">執行中</text>
<line x1="150" y1="72" x2="212" y2="72" class="fg-l"/><polygon points="220,72 212,67.5 212,76.5" class="fg-a"/>
<text x="185" y="66" text-anchor="middle" class="fg-t sm mono">start</text>
<line x1="360" y1="72" x2="422" y2="72" class="fg-l on"/><polygon points="430,72 422,67.5 422,76.5" class="fg-a on"/>
<text x="395" y="66" text-anchor="middle" class="fg-t sm">成功</text>
<line x1="500" y1="94" x2="500" y2="152" class="fg-l warm"/><polygon points="500,160 495.5,152 504.5,152" class="fg-a warm"/>
<text x="492" y="130" text-anchor="end" class="fg-t sm warm">掛了（exit ≠ 0）</text>
<rect x="430" y="160" width="140" height="48" rx="6" class="fg-b warm"/><text x="500" y="180" text-anchor="middle" class="fg-t mono">auto-restart</text><text x="500" y="198" text-anchor="middle" class="fg-t sm">等 RestartSec</text>
<path d="M430 176 H290 V102" class="fg-l on"/><polygon points="290,94 285.5,102 294.5,102" class="fg-a on"/>
<text x="360" y="170" text-anchor="middle" class="fg-t sm acc">時間到，再試一次</text>
<path d="M430 196 H158" class="fg-l warm"/><polygon points="150,196 158,191.5 158,200.5" class="fg-a warm"/>
<text x="290" y="214" text-anchor="middle" class="fg-t sm warm">10 秒內重啟超過 5 次</text>
<rect x="20" y="174" width="130" height="44" rx="6" class="fg-b warm"/><text x="85" y="193" text-anchor="middle" class="fg-t mono">failed</text><text x="85" y="210" text-anchor="middle" class="fg-t sm">放棄，等人來看</text>
</svg><figcaption>Restart= 讓 systemd 自動把掛掉的服務拉回來；但如果它一啟動就掛（例如設定檔寫錯），systemd 預設在 10 秒內試滿 5 次就放棄，進入 failed，免得無限循環。</figcaption></figure>
<p>那個「10 秒內 5 次」來自 <code>StartLimitIntervalSec</code> 和 <code>StartLimitBurst</code> 的預設值。看到服務停在 failed，先跑 <code>journalctl -u hilo -n 50</code> 看它最後說了什麼，修好之後 <code>systemctl reset-failed hilo</code> 再啟動。</p>
<h4>優雅關機：SIGTERM 是一封通知信</h4>
<p>不管是 <code>systemctl stop</code>、<code>docker stop</code> 還是 Kubernetes 刪除 Pod，流程都一樣：先送 <b>SIGTERM</b>（「請收拾一下準備下班」），等一段寬限時間，還不走就送 <b>SIGKILL</b>（直接拔插頭，程式沒有機會反應）。寬限時間 systemd 預設 90 秒、Docker 預設 10 秒、Kubernetes 預設 30 秒。好的伺服器收到 SIGTERM 會做三件事：關掉聆聽的 socket（不再接新客人）、把手上的請求做完、然後自己結束。</p>
<pre><code>const server = app.listen(8080);
process.on('SIGTERM', () =&gt; {
  // 不再 accept 新連線，手上的請求做完就結束
  server.close(() =&gt; process.exit(0));
  // 保險：最多等 25 秒
  setTimeout(() =&gt; process.exit(1), 25000).unref();
});</code></pre>
<p>如果沒寫這段，每次部署都會有一小撮請求被硬生生切斷，使用者看到 502。這是「部署時偶爾掉請求」最常見的原因。</p>
<h4>容器裡的 PID 1 陷阱</h4>
<p>在容器裡，你的程式自己就是 PID 1。Linux 對 PID 1 有一條特別規則：<b>沒有自己註冊處理函式的訊號，一律忽略</b>，包括 SIGTERM。所以一支沒寫 SIGTERM 處理的 Node 程式在容器裡，<code>docker stop</code> 會發現它不理人，整整等滿 10 秒才 SIGKILL。另一個常見版本是 Dockerfile 寫成 <code>CMD node server.js</code>（shell 形式），PID 1 變成 <code>/bin/sh</code>，訊號可能根本轉不到你的程式。解法：用 <code>CMD ["node", "server.js"]</code> 這種陣列形式、自己處理 SIGTERM，或用 <code>docker run --init</code> 讓一個小小的 init 程式當 PID 1 幫你轉訊號。</p>
<h4>同一個想法，換了地方</h4>
<p>systemd 的 <code>Restart=</code>、Docker 的 <code>--restart unless-stopped</code>、Kubernetes 的重啟政策加上存活探針（liveness probe），全都是同一個哲學：<b>程式會死，別假裝不會；讓它乾淨地死，再讓管家把它拉起來</b>。這要求你的服務啟動快、啟動時不需要人工步驟，而且隨時被殺都不會壞掉資料。Twelve-Factor App 把這叫做「可拋棄性」（disposability）。</p>

<h3><span class="badge lv3">專業</span>六、無狀態與有狀態，再往下挖一層</h3>
<p>上一課說，無狀態的伺服器可以隨便多開幾份。可是「狀態」常常藏在你沒想到的地方。看一個最常見的事故：</p>
<figure class="figure"><svg viewBox="0 0 680 280" class="fg" style="width:100%;max-width:680px" role="img" aria-label="左邊：登入狀態存在伺服器 A 的記憶體，第二個請求被送到 B 就變成未登入；右邊：狀態搬到 Redis，A 和 B 都查得到">
<text x="170" y="22" text-anchor="middle" class="fg-t lg warm">狀態放在伺服器記憶體裡</text>
<rect x="125" y="36" width="90" height="28" rx="5" class="fg-b"/><text x="170" y="55" text-anchor="middle" class="fg-t">小明</text>
<line x1="170" y1="64" x2="170" y2="80" class="fg-l"/><polygon points="170,88 165.5,80 174.5,80" class="fg-a"/>
<rect x="130" y="88" width="80" height="28" rx="5" class="fg-b"/><text x="170" y="107" text-anchor="middle" class="fg-t sm">負載平衡器</text>
<path d="M170 116 V132 H90 V142" class="fg-l"/><polygon points="90,150 85.5,142 94.5,142" class="fg-a"/>
<path d="M170 132 H250 V142" class="fg-l warm"/><polygon points="250,150 245.5,142 254.5,142" class="fg-a warm"/>
<text x="95" y="126" text-anchor="middle" class="fg-t sm">① 登入</text>
<text x="250" y="126" text-anchor="middle" class="fg-t sm warm">② 下一個請求</text>
<rect x="30" y="150" width="120" height="50" rx="6" class="fg-b"/><text x="90" y="171" text-anchor="middle" class="fg-t">伺服器 A</text><text x="90" y="190" text-anchor="middle" class="fg-t sm">session：小明</text>
<rect x="190" y="150" width="120" height="50" rx="6" class="fg-b warm"/><text x="250" y="171" text-anchor="middle" class="fg-t">伺服器 B</text><text x="250" y="190" text-anchor="middle" class="fg-t sm">（什麼都沒有）</text>
<text x="250" y="226" text-anchor="middle" class="fg-t warm">401：B 不認得你</text>
<line x1="340" y1="14" x2="340" y2="270" class="fg-l dim dash"/>
<text x="510" y="22" text-anchor="middle" class="fg-t lg acc">狀態搬到外面</text>
<rect x="465" y="36" width="90" height="28" rx="5" class="fg-b"/><text x="510" y="55" text-anchor="middle" class="fg-t">小明</text>
<line x1="510" y1="64" x2="510" y2="80" class="fg-l"/><polygon points="510,88 505.5,80 514.5,80" class="fg-a"/>
<rect x="470" y="88" width="80" height="28" rx="5" class="fg-b"/><text x="510" y="107" text-anchor="middle" class="fg-t sm">負載平衡器</text>
<path d="M510 116 V132 H430 V142" class="fg-l"/><polygon points="430,150 425.5,142 434.5,142" class="fg-a"/>
<path d="M510 132 H590 V142" class="fg-l on"/><polygon points="590,150 585.5,142 594.5,142" class="fg-a on"/>
<text x="435" y="126" text-anchor="middle" class="fg-t sm">① 登入</text>
<text x="590" y="126" text-anchor="middle" class="fg-t sm acc">② 下一個請求</text>
<rect x="370" y="150" width="120" height="50" rx="6" class="fg-b"/><text x="430" y="171" text-anchor="middle" class="fg-t">伺服器 A</text><text x="430" y="190" text-anchor="middle" class="fg-t sm">不存 session</text>
<rect x="530" y="150" width="120" height="50" rx="6" class="fg-b"/><text x="590" y="171" text-anchor="middle" class="fg-t">伺服器 B</text><text x="590" y="190" text-anchor="middle" class="fg-t sm">不存 session</text>
<line x1="430" y1="200" x2="430" y2="226" class="fg-l"/><polygon points="430,234 425.5,226 434.5,226" class="fg-a"/>
<line x1="590" y1="200" x2="590" y2="226" class="fg-l on"/><polygon points="590,234 585.5,226 594.5,226" class="fg-a on"/>
<rect x="370" y="234" width="280" height="34" rx="6" class="fg-b hot"/><text x="510" y="256" text-anchor="middle" class="fg-t acc">Redis　session：小明</text>
</svg><figcaption>只有一台伺服器時，左邊的寫法完全正常；開到第二台，使用者就會「隨機被登出」。狀態搬出去之後，A、B 變成可以互換的零件。</figcaption></figure>
<p>這個 bug 很陰險：本機測試永遠只有一台，所以永遠測不出來；上線開兩台後，大約一半的請求會出錯，看起來像隨機。把伺服器上「會被下一個請求用到」的東西全部列出來，就是你的狀態清單：</p>
<table>
<tr><th>藏起來的狀態</th><th>開到兩台時會怎樣</th><th>搬去哪裡</th></tr>
<tr><td>記憶體裡的登入 session</td><td>隨機被登出</td><td>Redis，或改用簽過章的權杖（token）</td></tr>
<tr><td>上傳到本機磁碟的檔案</td><td>有時看得到圖、有時 404；容器重建就全沒了</td><td>物件儲存（S3 之類）</td></tr>
<tr><td>記憶體裡的限流計數器</td><td>實際上限變成「台數 × 設定值」</td><td>Redis 的原子計數</td></tr>
<tr><td>程式裡的排程（每天清資料）</td><td>開幾台就跑幾次</td><td>獨立的排程工作，或用鎖保證只有一台跑</td></tr>
<tr><td>記憶體快取</td><td>各台內容不一致，但不算錯</td><td>可以留著，只要能接受短暫不一致</td></tr>
</table>
<p>最後一行很重要：<b>快取不是狀態</b>。判斷標準是「這台機器現在被砍掉，會不會有東西真的不見」。快取不見了只是變慢，可以重建；session 不見了，使用者就被登出。</p>
<h4>三種修法，各有代價</h4>
<ul>
<li><b>黏性 session</b>（sticky session）：讓負載平衡器把同一個使用者一直送到同一台。改最少，但那台一死，上面的人全部被登出；而且流量分不均。這是止血，不是治療。</li>
<li><b>把狀態放進共用的儲存</b>（Redis、資料庫）：每個請求多一次網路來回（同機房大約零點幾毫秒），換來每台伺服器都可以互換。最常見的正解。</li>
<li><b>讓用戶端帶著狀態</b>：例如簽過章的 JWT，伺服器每次驗章就好，不用查任何地方。代價是很難「立刻撤銷」，權杖沒過期前都有效。</li>
</ul>
<h4>有些服務天生就是有狀態的</h4>
<p>資料庫是，即時遊戲的房間伺服器也是。一局猜高低（Higher or Lower）進行到一半，牌堆、分數、倒數計時都在記憶體裡，每 50 毫秒就要讀寫一次，不可能每次都去問 Redis。這時候的做法不是硬拆成無狀態，而是把有狀態的部分<b>收窄、管好</b>：</p>
<ul>
<li>同一個房間的所有玩家，永遠被導到同一個行程（用房間編號決定去哪一台）。這個行程是這個房間唯一說了算的人。</li>
<li>每一局結束、或每隔幾秒，把關鍵狀態寫進資料庫或 Redis。行程死掉時，新行程可以從最後一次存檔接手，或至少把這一局判定作廢、通知玩家重開，不會讓玩家的進度不明不白地消失。</li>
<li>部署時不能隨便殺：先讓這台不再接新房間，等現有的局打完再停。這就是為什麼它的寬限時間要設得比一局還長。</li>
</ul>
<p>Kubernetes 為這種服務準備了 StatefulSet：每個 Pod 有固定的名字和固定的磁碟，重啟後還是同一個身分。系統設計的大方向始終沒變：讓九成的服務無狀態、可以隨便砍，把狀態集中在少數幾個你特別小心照顧的地方。</p>

<h3><span class="badge lv4">專家</span>七、虛擬機、容器、無伺服器：到底跟鄰居共用了哪一層</h3>
<p>上一課的表格說虛擬機「一分鐘啟動」、容器「一秒」、無伺服器「幾毫秒」。速度差這麼多，原因只有一個：<b>它們跟別人共用的層數不一樣</b>。共用得越多，啟動越快、越省資源，但隔離也越薄。</p>
<figure class="figure"><svg viewBox="0 0 680 300" class="fg" style="width:100%;max-width:680px" role="img" aria-label="三疊分層：虛擬機各自有核心，只共用硬體和 hypervisor；容器共用同一顆主機核心；無伺服器由雲端業者包辦到微型虛擬機，你只交出函式">
<text x="120" y="28" text-anchor="middle" class="fg-t lg">虛擬機</text>
<text x="120" y="48" text-anchor="middle" class="fg-t sm">共用：硬體＋hypervisor</text>
<rect x="20" y="118" width="97" height="32" rx="5" class="fg-b alt"/><text x="68" y="139" text-anchor="middle" class="fg-t">程式 A</text>
<rect x="123" y="118" width="97" height="32" rx="5" class="fg-b alt"/><text x="171" y="139" text-anchor="middle" class="fg-t">程式 B</text>
<rect x="20" y="156" width="97" height="32" rx="5" class="fg-b alt"/><text x="68" y="177" text-anchor="middle" class="fg-t">核心 A</text>
<rect x="123" y="156" width="97" height="32" rx="5" class="fg-b alt"/><text x="171" y="177" text-anchor="middle" class="fg-t">核心 B</text>
<rect x="20" y="194" width="200" height="32" rx="5" class="fg-b hot"/><text x="120" y="215" text-anchor="middle" class="fg-t">hypervisor</text>
<rect x="20" y="232" width="200" height="32" rx="5" class="fg-b hot"/><text x="120" y="253" text-anchor="middle" class="fg-t">硬體</text>
<text x="120" y="286" text-anchor="middle" class="fg-t sm">開機：幾十秒到一分鐘</text>
<text x="340" y="28" text-anchor="middle" class="fg-t lg">容器</text>
<text x="340" y="48" text-anchor="middle" class="fg-t sm">共用：同一顆核心</text>
<rect x="240" y="118" width="97" height="32" rx="5" class="fg-b alt"/><text x="288" y="139" text-anchor="middle" class="fg-t">容器 A</text>
<rect x="343" y="118" width="97" height="32" rx="5" class="fg-b alt"/><text x="391" y="139" text-anchor="middle" class="fg-t">容器 B</text>
<rect x="240" y="156" width="200" height="32" rx="5" class="fg-b"/><text x="340" y="177" text-anchor="middle" class="fg-t sm">namespaces＋cgroups 隔開</text>
<rect x="240" y="194" width="200" height="32" rx="5" class="fg-b warm"/><text x="340" y="215" text-anchor="middle" class="fg-t warm">主機核心（大家共用）</text>
<rect x="240" y="232" width="200" height="32" rx="5" class="fg-b hot"/><text x="340" y="253" text-anchor="middle" class="fg-t">硬體</text>
<text x="340" y="286" text-anchor="middle" class="fg-t sm">啟動：一秒以內</text>
<text x="560" y="28" text-anchor="middle" class="fg-t lg">無伺服器</text>
<text x="560" y="48" text-anchor="middle" class="fg-t sm">你只交出函式</text>
<text x="560" y="66" text-anchor="middle" class="fg-t sm">其餘整疊歸雲端業者</text>
<rect x="460" y="80" width="97" height="32" rx="5" class="fg-b alt"/><text x="508" y="101" text-anchor="middle" class="fg-t">函式 A</text>
<rect x="563" y="80" width="97" height="32" rx="5" class="fg-b alt"/><text x="611" y="101" text-anchor="middle" class="fg-t">函式 B</text>
<rect x="460" y="118" width="97" height="32" rx="5" class="fg-b"/><text x="508" y="139" text-anchor="middle" class="fg-t sm">執行環境</text>
<rect x="563" y="118" width="97" height="32" rx="5" class="fg-b"/><text x="611" y="139" text-anchor="middle" class="fg-t sm">執行環境</text>
<rect x="460" y="156" width="97" height="32" rx="5" class="fg-b"/><text x="508" y="177" text-anchor="middle" class="fg-t sm">微型 VM</text>
<rect x="563" y="156" width="97" height="32" rx="5" class="fg-b"/><text x="611" y="177" text-anchor="middle" class="fg-t sm">微型 VM</text>
<rect x="460" y="194" width="200" height="32" rx="5" class="fg-b hot"/><text x="560" y="215" text-anchor="middle" class="fg-t">Firecracker（KVM）</text>
<rect x="460" y="232" width="200" height="32" rx="5" class="fg-b hot"/><text x="560" y="253" text-anchor="middle" class="fg-t">硬體</text>
<text x="560" y="286" text-anchor="middle" class="fg-t sm">冷啟動：百毫秒到幾秒</text>
</svg><figcaption>綠色是跟鄰居共用的層；容器那一疊的核心標成橘色，因為它也是共用的，而且是隔離最薄的地方。虛擬機各自帶一顆核心；容器只是主機上被隔開的行程，大家共用一顆核心；AWS Lambda 這類服務則替每個執行環境開一台很小的虛擬機，你只看得到最上面那一格。</figcaption></figure>
<h4>容器：只是一個被蒙住眼睛的行程</h4>
<p>容器沒有自己的核心。它是主機上的普通行程，被兩樣核心功能包起來：<b>namespaces</b> 決定它「看得到什麼」（自己的行程清單、自己的網路介面、自己的檔案系統根目錄），<b>cgroups</b> 決定它「用得了多少」（CPU、記憶體、I/O）。在 Linux 主機上 <code>docker run -d nginx</code>，再在主機上跑 <code>ps aux</code>，你會直接看到 nginx 行程，只是在容器裡它以為自己是 PID 1。在 Mac 上看不到，因為 Mac 沒有 Linux 核心，Docker 工具其實是先在背後開了一台 Linux 虛擬機。</p>
<p>共用核心帶來三個你一定會遇到的後果：</p>
<ol>
<li><b>資安</b>：核心只要有一個漏洞，任何一個容器都可能藉此跳到主機，影響同一台上的所有容器。所以公有雲跑「陌生人的程式」時，很少只靠容器隔離，而是在外面再包一層虛擬機（Firecracker、Kata Containers），或用 gVisor 這種在使用者空間重寫一部分核心的沙盒。</li>
<li><b>記憶體上限是硬的</b>：容器超過 cgroup 設的記憶體上限，核心的 OOM killer 直接殺掉它，結束碼 137（128 + 9，9 就是 SIGKILL），Kubernetes 會顯示 <code>OOMKilled</code>。程式沒有機會留遺言。Node.js 的堆積上限要記得設得比容器上限小一截（<code>--max-old-space-size</code>），讓它先自己做垃圾回收。</li>
<li><b>CPU 上限是用「時間配額」做的</b>：限制 2 顆 CPU，意思是每 100 毫秒最多用 200 毫秒的 CPU 時間。如果程式在 8 核心的主機上開了 8 條忙碌的執行緒，25 毫秒就把配額用光，剩下 75 毫秒全部被暫停（throttling）。CPU 使用率看起來沒滿，延遲卻每隔一陣子跳 75 毫秒。很多執行環境看到的是主機的核心數而不是容器的限制，所以 Go 1.25 開始讓 <code>GOMAXPROCS</code> 預設照 cgroup 的 CPU 上限來設，舊版本常用 automaxprocs 這個套件補。</li>
</ol>
<h4>虛擬機：每台都帶自己的核心</h4>
<p>虛擬機裡有一顆完整的客體核心，開機要走完整個開機流程，所以要幾十秒。換來的是隔離的邊界變成 hypervisor，一層小得多、被攻擊面也小得多的程式。雲端業者怎麼把一台實體機切成很多台虛擬機，是下一課深入圖解的主題。</p>
<h4>無伺服器：連「行程活多久」都不歸你管</h4>
<p>AWS Lambda 的底層是 Firecracker：一個專門為這種場景寫的極簡 hypervisor，一台微型虛擬機大約 125 毫秒就能開好，額外只吃幾 MB 記憶體。你的函式跑在裡面，帶來三個寫法上的限制：</p>
<ul>
<li><b>兩次呼叫之間，執行環境會被凍結</b>，可能被重複使用，也可能被丟掉。全域變數、<code>/tmp</code> 裡的檔案「有時候還在」，但絕不能依賴。狀態一律放外面。</li>
<li><b>冷啟動</b>（cold start）：沒有暖著的執行環境時，要先開 VM、載入執行環境、跑你的初始化程式。依語言和套件大小，從一百多毫秒到幾秒不等。</li>
<li><b>標準的 Lambda 一個執行環境同一時間只處理一個請求</b>。一千個同時請求就是一千個執行環境，如果每個都直接連資料庫，資料庫瞬間多出一千條連線，PostgreSQL 撐不住。這就是 RDS Proxy 這類連線池服務存在的原因。</li>
</ul>

<h3><span class="badge lv4">專家</span>八、幾個多數人沒看過的角落</h3>
<h4>多個行程怎麼共用同一個連接埠</h4>
<p>傳統做法是主行程先 listen，再 fork 出幾個 worker，大家共用同一個聆聽 socket、同一條 accept 佇列，搶著 accept。缺點是搶的時候要排隊，而且一條連線來可能吵醒所有人（驚群效應，thundering herd）。Linux 3.9 加入了 <code>SO_REUSEPORT</code>：每個 worker 各自 bind 同一個連接埠、各有自己的 accept 佇列，由核心用連線的四個數字算雜湊，決定新連線分給誰。nginx 的 <code>listen 80 reuseport;</code> 就是這個。代價是：如果某個 worker 卡住，核心不知道，照樣把它那一份分過去，那些連線就在它的佇列裡等。</p>
<h4>SYN 洪水與 SYN cookies</h4>
<p>攻擊者狂送 SYN 卻從不回 ACK，就能把 SYN 佇列塞滿，讓真正的使用者連不進來，這叫 SYN 洪水（SYN flood）。Linux 的防禦是 <b>SYN cookies</b>（<code>net.ipv4.tcp_syncookies</code>，預設開啟）：SYN 佇列滿時，核心乾脆不記錄這條半開連線，而是把必要的資訊編碼進自己回的 SYN-ACK 序號裡。真正的用戶端回 ACK 時，核心從序號解出資訊，就能重建連線；從不回 ACK 的假連線，則什麼記憶體都沒佔到。</p>
<h4>重啟時一條連線都不掉</h4>
<p>既然 accept 佇列在核心裡，只要<b>聆聽的 socket 不關</b>，程式重啟的這幾秒裡，新連線就只是在佇列裡排隊，不會被拒。systemd 的 socket activation 就是這樣做的：由 systemd 自己持有 socket（寫在一個 <code>.socket</code> unit 裡），再把這個 fd 交給服務；服務重啟時 socket 一直都在。nginx 更新執行檔也用同一個原理：舊的主行程把聆聽 socket 交給新的主行程，再慢慢退場。</p>
<h4>號碼牌用完了</h4>
<p>每條連線一個 fd，加上程式開的檔案、對資料庫的連線，數字長得比你想的快。上限用完時 accept 會失敗，錯誤是 <code>EMFILE</code>（Too many open files）。更糟的是，有些事件迴圈遇到這個錯誤會不斷重試，CPU 衝到 100%。這就是 unit 檔裡 <code>LimitNOFILE</code> 那一行存在的理由；用 <code>ls /proc/&lt;PID&gt;/fd | wc -l</code> 可以看一個行程現在開了幾個。</p>

<h3>九、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>一個連接埠一次只能接一條連線</td><td>核心用來源、目的的 IP 和連接埠四個數字分辨連線，一個聆聽的連接埠可以同時有幾萬條連線。</td></tr>
<tr><td>防火牆打開了就連得到</td><td>還要有程式在那個連接埠、那個位址上 listen。只聽 127.0.0.1 的程式，防火牆怎麼開都連不到。</td></tr>
<tr><td>TCP 交握是我的程式做的</td><td>交握由核心完成，程式只從 accept 佇列拿已經接通的連線。程式卡住時，核心還是照樣幫你接，直到佇列滿。</td></tr>
<tr><td>Node.js 是單執行緒，所以不適合高併發</td><td>它用事件迴圈，一個行程撐上萬條閒置連線很正常。它怕的是吃 CPU 的同步運算，不是連線數。</td></tr>
<tr><td>容器是輕量的虛擬機</td><td>容器沒有自己的核心，只是主機上被隔開的行程。隔離邊界是共用的核心，不是 hypervisor。</td></tr>
<tr><td>有快取就是有狀態</td><td>判斷標準是「砍掉這台會不會真的少了東西」。能重建的快取不算狀態。</td></tr>
<tr><td>systemd 設了 Restart 就會無限重啟</td><td>預設 10 秒內重啟超過 5 次就放棄，進入 failed。</td></tr>
</table>

<h3>十、跟你的工作連起來</h3>
<ul>
<li><b>前端（Vue、TypeScript）</b>：開發伺服器只聽 localhost，所以手機連不到，要加 <code>--host</code>。前端打 API 時看到的 <code>ERR_CONNECTION_REFUSED</code>，就是「那個位址沒有人 listen」，先查後端有沒有起來、聽的是不是對的連接埠。</li>
<li><b>遊戲（Cocos、Unity）</b>：即時對戰的房間伺服器是典型的有狀態服務。部署時要先停止派新房間、等局打完；斷線重連要靠伺服器存好的房間狀態，而不是用戶端的記憶。</li>
<li><b>後端（Node.js、Go）</b>：寫好 SIGTERM 處理、別在主執行緒做重運算、session 不放記憶體。這三件事做到，你的服務就能放心地開多份、隨時部署。</li>
<li><b>Docker 與雲端伺服器</b>：容器裡聽 <code>0.0.0.0</code>、Dockerfile 的 CMD 用陣列形式、記憶體上限要留空間給 Node 或 Go 自己的堆積。在雲端機器上，服務一律交給 systemd 或容器的重啟政策管，不要開在 SSH 的終端機裡。</li>
</ul>

<h3>十一、面試會怎麼問</h3>
<p>這幾題在後端、DevOps、SRE 面試裡很常見。先用自己的話講一遍，再看參考答案。</p>
<ol>
<li>「connection refused 和 connection timed out 差在哪裡？各自你會先查什麼？」</li>
<li>「listen() 的 backlog 是什麼？accept 佇列滿了會發生什麼事？要怎麼確認？」</li>
<li>「Node.js 只有一條執行緒，為什麼能同時服務上萬條連線？什麼情況下它會整個卡住？」</li>
<li>「每次部署，監控上都會出現一小撮 502。你會怎麼查、怎麼修？」</li>
<li>「容器和虛擬機的隔離差在哪裡？為什麼雲端業者跑別人的程式時，常在容器外面再包一層虛擬機？」</li>
<li>「一個把 session 存在記憶體裡的服務，要改成可以開好幾份，你會怎麼做？各有什麼代價？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>Refused 表示封包到了那台機器，但那個位址和連接埠上沒有程式在 listen，核心回了 RST：先查程式有沒有起來、聽的連接埠和位址對不對（例如只聽 127.0.0.1）。Timed out 表示完全沒有回應，通常是封包在路上被防火牆、安全群組丟掉，或機器根本不在：先查網路路徑和防火牆規則。</li>
<li>backlog 是 accept 佇列的上限，也就是「交握已經完成、但程式還沒 accept」的連線最多能排幾條，實際值是 backlog 和 somaxconn 取小。滿了之後，Linux 預設默默丟掉新的交握封包，用戶端要等約 1 秒、3 秒後重送，所以症狀是延遲出現整齊的秒數。確認方法：<code>ss -lnt</code> 看 Recv-Q 是否接近 Send-Q，<code>nstat</code> 看 ListenOverflows 有沒有在長。根本解法是讓程式 accept 得更快，而不是只把佇列調大。</li>
<li>它用事件迴圈加上 epoll：所有 socket 都登記給核心，執行緒只處理「現在有資料」的那幾條，處理到需要等待就交出去，所以閒置連線幾乎不花成本。檔案和 DNS 等操作交給 libuv 的執行緒池。它會卡住的情況是主執行緒上有長時間的同步運算，例如大型 JSON 解析、同步加密、低效的正規表示式，這段時間所有連線都得等。解法是把重運算移到 worker thread 或別的服務，或開多個行程。</li>
<li>先看 502 是否跟部署時間完全對齊，再看是哪一層回的。常見原因：程式沒處理 SIGTERM，被直接殺掉，手上的請求斷掉；容器裡 PID 1 不轉訊號；負載平衡器還在把流量送給正在關的實例。修法：處理 SIGTERM，先停止 accept、把手上的請求做完再結束；CMD 用陣列形式或加 init；在 Kubernetes 上加 readiness probe，並在關機前稍等幾秒，讓實例先從負載平衡名單裡拿掉；寬限時間要比最長的請求長。</li>
<li>容器共用主機的核心，隔離靠 namespaces 和 cgroups，核心一個漏洞就可能讓容器跳出來，影響同一台的所有容器。虛擬機各有自己的核心，隔離邊界是 hypervisor，程式碼小、攻擊面小得多。所以跑互不信任的多租戶程式時，業者會用 Firecracker、Kata Containers 這類微型虛擬機，或 gVisor 這類沙盒，換取更強的隔離，代價是一點啟動時間和記憶體。</li>
<li>三條路：一、負載平衡器開黏性 session，改動最小，但那台死掉就全部登出，負載也不均；二、把 session 存進 Redis 之類的共用儲存，每台伺服器都能互換，代價是多一次網路來回和多一個要顧的元件；三、改用簽過章的權杖讓用戶端帶著，伺服器不用查任何地方，但很難立即撤銷，通常要配短效期和更新權杖。實務上大多選第二種，同時把上傳檔案、限流計數、排程這些其他藏起來的狀態一起搬出去。</li>
</ol>
</details>

<h3>十二、練功題（做得出來才算真的懂）</h3>
<ol>
<li>在 Mac 上跑 <code>python3 -m http.server 8765 --bind 127.0.0.1</code>，再用手機的瀏覽器連「電腦的區網 IP:8765」。會看到什麼？為什麼？改成什麼就連得到？</li>
<li>一個 Node.js 服務，每個請求都要在主執行緒上做 20 毫秒的同步運算。一個行程一秒最多處理幾個請求？如果同時來 500 個，最後一個大概要等多久？開 4 個行程（4 核心）呢？</li>
<li>一支服務聽 backlog 128，一次只能處理一條連線，每條要 50 毫秒。瞬間湧進 500 條連線，會發生什麼事？用戶端會看到什麼樣的延遲？</li>
<li>為上面的猜高低 API 寫一個 Dockerfile 的最後兩行，讓 <code>docker stop</code> 能在 1 秒內乾淨結束，而不是等滿 10 秒。說明你改的是哪一個問題。</li>
<li>一個服務有這幾個功能：使用者登入、使用者上傳頭像、每個 IP 每分鐘最多 60 次請求、每天半夜寄一封報表信。要開到 3 份，每一項要怎麼改？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>手機會看到連線被拒（或無法連線）。程式只 bind 在 127.0.0.1，區網 IP 那張網卡上沒有程式在 listen，核心直接回 RST。改成 <code>--bind 0.0.0.0</code>（或不加，http.server 預設就聽所有介面），並確認 Mac 的防火牆允許，就連得到。</li>
<li>一個行程一秒最多 1000 ÷ 20 = 50 個請求。500 個同時到，要排 500 × 20 毫秒 = 10 秒，最後一個等將近 10 秒，而這段時間連健康檢查都回不了。4 個行程大約每秒 200 個，最後一個等約 2.5 秒。正解通常是把這 20 毫秒的運算移到別處，而不是只靠加行程。</li>
<li>程式一秒只能處理 20 條。accept 佇列先排滿約 128 條，再來的交握封包被核心丟掉，那些用戶端要在約 1 秒、3 秒、7 秒後重送 SYN。所以延遲會分成幾群：排在佇列裡的等 0 到 6 秒多，被丟掉的要多等一輪重送的時間；要處理完全部 500 條，總共要 25 秒左右，部分用戶端可能先逾時放棄。</li>
<li>例如：<code>CMD ["node", "server.js"]</code>，並在程式裡處理 SIGTERM（關掉 server、做完手上的請求、結束）；或在執行時加 <code>--init</code>。問題是 PID 1 會忽略沒有處理函式的訊號，而 shell 形式的 CMD 讓 <code>/bin/sh</code> 當 PID 1，訊號不一定轉得到 Node。</li>
<li>登入：session 放進 Redis，或改用簽過章的短效權杖。頭像：上傳到物件儲存，資料庫只存網址。限流：改用 Redis 的原子計數（例如 INCR 加過期時間），否則實際上限會變成每分鐘 180 次。報表信：從服務裡拿出來，改成獨立的排程工作（cron、Kubernetes CronJob），或用分散式鎖確保只有一份會寄，不然每天會收到三封。</li>
</ol>
</details>

<h3>十三、想再挖深</h3>
<ul>
<li><b>Beej's Guide to Network Programming</b>（<a href="https://beej.us/guide/bgnet/">beej.us/guide/bgnet</a>）：免費、口語，從 socket、bind、listen、accept 一路寫到 poll，是這一章前半段最好的延伸。</li>
<li><b>W. Richard Stevens《UNIX Network Programming, Volume 1》</b>：網路程式設計的經典課本，各種伺服器模型、佇列、訊號處理講得最完整。</li>
<li><b>Dan Kegel〈The C10K problem〉</b>（<a href="http://www.kegel.com/c10k.html">kegel.com/c10k.html</a>）：讓整個業界開始認真思考「一台機器撐一萬條連線」的那篇文章，看完你就知道 epoll 和事件迴圈是怎麼來的。</li>
<li><b>systemd 官方手冊</b>（<a href="https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html">systemd.service</a>）：Restart、StartLimit、Type、socket activation 的每一個選項都在這裡。</li>
<li><b>The Twelve-Factor App</b>（<a href="https://12factor.net/">12factor.net</a>）：短短十二條，講怎麼寫出能隨時擴充、隨時被殺的服務，第六條「行程」和第九條「可拋棄性」就是本章的第五、六節。</li>
</ul>
` });
