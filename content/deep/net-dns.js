DEEP({ 'net-dns': `
<p>課文給了你 DNS 的骨架：解析器一路問到權威伺服器，答案依 TTL 快取，幾種紀錄類型，以及「誰控制你的 DNS，誰就控制你的網站」。這一章把它拆到能拿來除錯、能拿來做搬遷計畫的程度：一個名字從你的程式到權威伺服器，中間到底有幾層快取；每一種紀錄的規則和陷阱；dig 的輸出每一行在說什麼；搬家時 TTL 要提前多久降、降多少；「查不到」為什麼也會被快取；用 DNS 分流量能做到哪裡、做不到哪裡；DNSSEC 用白話講在簽什麼；以及網域被劫持時，攻擊者到底是從哪一扇門進來的。</p>

<h3><span class="badge lv1">基礎</span>一、查一個名字，要經過幾層快取</h3>
<p>想像你要打電話給一家餐廳。你先想想自己記不記得號碼（瀏覽器快取），再翻翻手機通訊錄（作業系統），再問問坐隔壁的同事（公司或家裡的 DNS），最後才打查號台（遞迴解析器）。查號台要是也不知道，它才會一路去問總機、分機、再到餐廳本人（根、頂級網域、權威伺服器）。每一個人問到答案之後，都會順手記下來，下次就不用再問。</p>
<figure class="figure"><svg viewBox="0 0 660 350" class="fg" style="width:100%;max-width:660px" role="img" aria-label="DNS 查詢經過的五層：瀏覽器快取、作業系統、本地轉發器、遞迴解析器、權威伺服器，沒命中才往下問，答案沿路被每一層快取">
<rect x="20" y="20" width="420" height="44" rx="6" class="fg-b"/>
<text x="36" y="38" class="fg-t">瀏覽器自己的快取</text>
<text x="36" y="56" class="fg-t sm">Chrome 可以在 chrome://net-internals/#dns 清掉</text>
<text x="470" y="47" class="fg-t sm">約 0 ms</text>
<rect x="20" y="86" width="420" height="44" rx="6" class="fg-b"/>
<text x="36" y="104" class="fg-t">作業系統</text>
<text x="36" y="122" class="fg-t sm">先看 /etc/hosts，再看系統的快取</text>
<text x="470" y="113" class="fg-t sm">不到 1 ms</text>
<rect x="20" y="152" width="420" height="44" rx="6" class="fg-b"/>
<text x="36" y="170" class="fg-t">家裡或公司的 DNS 轉發器</text>
<text x="36" y="188" class="fg-t sm">路由器、公司內部的 DNS，常常也有快取</text>
<text x="470" y="179" class="fg-t sm">1–5 ms</text>
<rect x="20" y="218" width="420" height="44" rx="6" class="fg-b hot"/>
<text x="36" y="236" class="fg-t acc">遞迴解析器</text>
<text x="36" y="254" class="fg-t sm">網路業者的、8.8.8.8、1.1.1.1：最大的一層快取</text>
<text x="470" y="245" class="fg-t sm">5–30 ms</text>
<rect x="20" y="284" width="420" height="44" rx="6" class="fg-b alt"/>
<text x="36" y="302" class="fg-t">權威伺服器</text>
<text x="36" y="320" class="fg-t sm">根 → .com → 你的 DNS 供應商</text>
<text x="470" y="311" class="fg-t sm">每問一層一個來回</text>
<line x1="100" y1="64" x2="100" y2="78" class="fg-l"/><polygon points="100,86 95.5,78 104.5,78" class="fg-a"/>
<line x1="100" y1="130" x2="100" y2="144" class="fg-l"/><polygon points="100,152 95.5,144 104.5,144" class="fg-a"/>
<line x1="100" y1="196" x2="100" y2="210" class="fg-l"/><polygon points="100,218 95.5,210 104.5,210" class="fg-a"/>
<line x1="100" y1="262" x2="100" y2="276" class="fg-l"/><polygon points="100,284 95.5,276 104.5,276" class="fg-a"/>
<line x1="380" y1="86" x2="380" y2="72" class="fg-l on"/><polygon points="380,64 375.5,72 384.5,72" class="fg-a on"/>
<line x1="380" y1="152" x2="380" y2="138" class="fg-l on"/><polygon points="380,130 375.5,138 384.5,138" class="fg-a on"/>
<line x1="380" y1="218" x2="380" y2="204" class="fg-l on"/><polygon points="380,196 375.5,204 384.5,204" class="fg-a on"/>
<line x1="380" y1="284" x2="380" y2="270" class="fg-l on"/><polygon points="380,262 375.5,270 384.5,270" class="fg-a on"/>
<text x="112" y="345" class="fg-t sm">黑色往下：沒命中才往下問</text>
<text x="440" y="345" text-anchor="end" class="fg-t sm acc">綠色往上：答案沿路被快取</text>
</svg><figcaption>任何一層命中，查詢就在那裡結束。所以「我改了 DNS，為什麼我這裡還是舊的」，答案可能藏在五層裡的任何一層。右邊的時間是數量級。</figcaption></figure>
<p>幾個實用的細節：</p>
<ul>
<li><b><code>dig</code> 不等於你的程式看到的。</b>dig 直接去問 <code>/etc/resolv.conf</code> 裡的 DNS 伺服器，跳過 <code>/etc/hosts</code> 和系統快取。要看「程式實際會拿到什麼」，在 Linux 用 <code>getent hosts example.com</code>，在 macOS 用 <code>dscacheutil -q host -a name example.com</code>。很多「dig 明明是新的，網站還是連到舊的」，就是 <code>/etc/hosts</code> 裡留了一行測試用的舊位址。</li>
<li><b>清快取的指令。</b>macOS：<code>sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder</code>。用 systemd-resolved 的 Linux（它在 127.0.0.53 聽）：<code>resolvectl flush-caches</code>。Chrome 在上圖那個網址按清除。</li>
<li><b>Node.js 和 Go 的標準函式庫預設不自己快取。</b>每次建立新連線都會重新解析，快不快取看作業系統。所以「沒重用連線」的程式，除了交握成本，還多付了 DNS 的成本。</li>
<li><b>遞迴解析器那一層最關鍵。</b>它被成千上萬個使用者共用，命中率最高；你改了紀錄之後，大部分人什麼時候看到新答案，主要由它的快取決定。</li>
</ul>

<h3><span class="badge lv1">基礎</span>二、完整走一次：解析器怎麼一路問下去</h3>
<p>假設遞迴解析器的快取是空的，要查 <code>www.example.com</code>（下面的位址是示意值）：</p>
<figure class="figure"><svg viewBox="0 0 680 310" class="fg" style="width:100%;max-width:680px" role="img" aria-label="遞迴解析器依序問根伺服器、.com 伺服器、權威伺服器，前兩個回答「去問誰」，最後一個給出位址和 TTL，再回給你的電腦">
<rect x="15" y="10" width="110" height="30" rx="6" class="fg-b"/><text x="70" y="30" text-anchor="middle" class="fg-t">你的電腦</text>
<rect x="165" y="10" width="110" height="30" rx="6" class="fg-b hot"/><text x="220" y="30" text-anchor="middle" class="fg-t">遞迴解析器</text>
<rect x="315" y="10" width="110" height="30" rx="6" class="fg-b"/><text x="370" y="30" text-anchor="middle" class="fg-t">根伺服器</text>
<rect x="435" y="10" width="110" height="30" rx="6" class="fg-b"/><text x="490" y="30" text-anchor="middle" class="fg-t">.com 伺服器</text>
<rect x="555" y="10" width="110" height="30" rx="6" class="fg-b alt"/><text x="610" y="30" text-anchor="middle" class="fg-t">權威伺服器</text>
<line x1="70" y1="40" x2="70" y2="290" class="fg-l dim dash"/>
<line x1="220" y1="40" x2="220" y2="290" class="fg-l dim dash"/>
<line x1="370" y1="40" x2="370" y2="290" class="fg-l dim dash"/>
<line x1="490" y1="40" x2="490" y2="290" class="fg-l dim dash"/>
<line x1="610" y1="40" x2="610" y2="290" class="fg-l dim dash"/>
<line x1="70" y1="66" x2="212" y2="66" class="fg-l"/><polygon points="220,66 212,61.5 212,70.5" class="fg-a"/>
<text x="145" y="60" text-anchor="middle" class="fg-t sm mono">www.example.com？</text>
<line x1="220" y1="96" x2="362" y2="96" class="fg-l"/><polygon points="370,96 362,91.5 362,100.5" class="fg-a"/>
<text x="295" y="90" text-anchor="middle" class="fg-t sm">問路</text>
<line x1="370" y1="126" x2="228" y2="126" class="fg-l alt"/><polygon points="220,126 228,121.5 228,130.5" class="fg-a alt"/>
<text x="295" y="120" text-anchor="middle" class="fg-t sm alt">去問 .com 的伺服器</text>
<line x1="220" y1="156" x2="482" y2="156" class="fg-l"/><polygon points="490,156 482,151.5 482,160.5" class="fg-a"/>
<text x="295" y="150" text-anchor="middle" class="fg-t sm">問路</text>
<line x1="490" y1="186" x2="228" y2="186" class="fg-l alt"/><polygon points="220,186 228,181.5 228,190.5" class="fg-a alt"/>
<text x="295" y="180" text-anchor="middle" class="fg-t sm alt">去問權威伺服器</text>
<line x1="220" y1="216" x2="602" y2="216" class="fg-l"/><polygon points="610,216 602,211.5 602,220.5" class="fg-a"/>
<text x="295" y="210" text-anchor="middle" class="fg-t sm">問 www.example.com</text>
<line x1="610" y1="246" x2="228" y2="246" class="fg-l on"/><polygon points="220,246 228,241.5 228,250.5" class="fg-a on"/>
<text x="295" y="240" text-anchor="middle" class="fg-t sm acc">A 203.0.113.10</text><text x="295" y="262" text-anchor="middle" class="fg-t sm acc">TTL 300</text>
<line x1="220" y1="276" x2="78" y2="276" class="fg-l on"/><polygon points="70,276 78,271.5 78,280.5" class="fg-a on"/>
<text x="145" y="270" text-anchor="middle" class="fg-t sm acc">203.0.113.10</text>
<text x="340" y="304" text-anchor="middle" class="fg-t sm">每一個回答都依自己的 TTL 存進解析器的快取，下次從最近的那一層開始問</text>
</svg><figcaption>根和 .com 都不知道答案，它們只回答「這一段歸誰管」，這叫轉介（referral）。只有最右邊的權威伺服器手上有真正的紀錄。</figcaption></figure>
<ol>
<li>你的電腦問解析器。電腦這邊的查詢叫<b>遞迴查詢</b>（recursive query）：「請你負責問到底，給我最終答案」。</li>
<li>解析器問根伺服器。根伺服器有 13 組名字（a 到 m.root-servers.net），但每一組都用 anycast 部署在全世界很多地方，加起來超過一千個實體。根伺服器不知道 www.example.com，只回答「.com 歸這幾台管」，附上它們的名字和位址。這個轉介的 TTL 是兩天（172,800 秒），所以解析器很少真的需要去問根。</li>
<li>解析器問 .com 的伺服器，對方回答「example.com 歸 ns1.dnshost.example 和 ns2.dnshost.example 管」，同樣只是轉介。</li>
<li>解析器問權威伺服器，終於拿到真正的 A 紀錄：<code>203.0.113.10</code>，TTL 300 秒。</li>
<li>解析器把答案回給你，並把路上拿到的每一筆（.com 歸誰、example.com 歸誰、www 的位址）各自依 TTL 快取起來。</li>
</ol>
<p>解析器問根和 .com 的這種，叫<b>迭代查詢</b>（iterative query）：對方不替你跑腿，只告訴你下一步去哪。另外，現代的解析器多半會開「查詢名稱最小化」（QNAME minimisation）：問根的時候只問「com 歸誰管」，不把完整的 <code>www.example.com</code> 洩漏給每一層，這是為了隱私。</p>
<p>DNS 預設走 UDP 53 埠，因為一問一答很小，不值得為它建一條 TCP 連線。回答太大（例如帶 DNSSEC 簽章、或一大串 TXT 紀錄）時，伺服器會在回答裡設一個「被截斷」的旗標，用戶端就改用 TCP 53 重問一次。所以<b>防火牆只開 UDP 53、擋掉 TCP 53，會讓某些查詢莫名其妙失敗</b>。</p>

<h3><span class="badge lv2">進階</span>三、紀錄類型：每一種的規則和陷阱</h3>
<p>先看一份完整的區域檔（zone file），這是 BIND 的格式，很多 DNS 供應商也能匯入匯出這種格式：</p>
<pre><code>example.com.  3600  IN SOA  ns1.dnshost.example. hostmaster.example.com. (
                    2026110901  ; serial 序號
                    7200        ; refresh
                    900         ; retry
                    1209600     ; expire
                    300 )       ; 負面快取時間
example.com.      86400 IN NS    ns1.dnshost.example.
example.com.      86400 IN NS    ns2.dnshost.example.
example.com.      300   IN A     203.0.113.10
example.com.      300   IN AAAA  2001:db8::10
www.example.com.  300   IN CNAME example.com.
api.example.com.  60    IN CNAME lb-123.cloud.example.
example.com.      3600  IN MX    10 mx1.mailhost.example.
example.com.      3600  IN TXT   "v=spf1 include:_spf.mailhost.example -all"
example.com.      3600  IN CAA   0 issue "letsencrypt.org"</code></pre>
<p>每一行都是：名字、TTL（秒）、類別（幾乎永遠是 IN）、類型、資料。名字最後那個點，代表「這是完整的名字，不要在後面補任何東西」。</p>
<h4>A 和 AAAA</h4>
<p>同一個名字可以有好幾筆 A 紀錄，解析器會全部回給你，順序常常會輪替。用戶端怎麼挑，不歸你管：有的拿第一個、有的會自己排序。這是最原始的「DNS 負載平衡」，第七節會講它的極限。</p>
<h4>CNAME</h4>
<p>CNAME 說的是「這個名字其實是另一個名字的別名，去查那個」。它有一條硬規則：<b>一個名字只要有 CNAME，就不能再有任何其他紀錄</b>。這就是為什麼裸網域（example.com）不能用 CNAME：裸網域一定要有 SOA 和 NS 紀錄，跟 CNAME 衝突。另外，每多一層 CNAME，解析器就可能多查一次；指來指去的 CNAME 鏈，會讓第一次解析變慢。</p>
<figure class="figure"><svg viewBox="0 0 640 290" class="fg" style="width:100%;max-width:640px" role="img" aria-label="CNAME 鏈：www.example.com 用 CNAME 指到 CDN 的名字，再指到邊緣節點的名字，最後才是 A 紀錄的位址，三筆各有不同的 TTL">
<rect x="30" y="18" width="200" height="40" rx="6" class="fg-b"/><text x="130" y="43" text-anchor="middle" class="fg-t mono">www.example.com</text>
<rect x="30" y="92" width="200" height="40" rx="6" class="fg-b alt"/><text x="130" y="117" text-anchor="middle" class="fg-t mono">shop.cdn.example</text>
<rect x="30" y="166" width="200" height="40" rx="6" class="fg-b alt"/><text x="130" y="191" text-anchor="middle" class="fg-t mono">edge-tpe.cdn.example</text>
<rect x="30" y="240" width="200" height="40" rx="6" class="fg-b hot"/><text x="130" y="265" text-anchor="middle" class="fg-t mono">198.51.100.7</text>
<line x1="130" y1="58" x2="130" y2="84" class="fg-l"/><polygon points="130,92 125.5,84 134.5,84" class="fg-a"/>
<text x="142" y="79" class="fg-t sm">CNAME　TTL 3600</text>
<line x1="130" y1="132" x2="130" y2="158" class="fg-l"/><polygon points="130,166 125.5,158 134.5,158" class="fg-a"/>
<text x="142" y="153" class="fg-t sm">CNAME　TTL 300</text>
<line x1="130" y1="206" x2="130" y2="232" class="fg-l"/><polygon points="130,240 125.5,232 134.5,232" class="fg-a"/>
<text x="142" y="227" class="fg-t sm warm">A　TTL 20</text>
<text x="260" y="34" class="fg-t">你查的名字</text>
<text x="260" y="52" class="fg-t sm">你只改得動這一筆，一小時內不用再問</text>
<text x="260" y="108" class="fg-t">CDN 給你的名字</text>
<text x="260" y="126" class="fg-t sm">TTL 由 CDN 決定</text>
<text x="260" y="182" class="fg-t">附近的邊緣節點</text>
<text x="260" y="200" class="fg-t sm">依使用者的位置，可能換成別的節點</text>
<text x="260" y="256" class="fg-t">真正的位址</text>
<text x="260" y="274" class="fg-t sm warm">20 秒就過期：CDN 能隨時把你換走</text>
</svg><figcaption>一個名字背後常常是一條 CNAME 鏈。解析器把每一筆各自依 TTL 快取，整條鏈裡 TTL 最短的那一筆，決定多久要重新問一次。</figcaption></figure>
<h4>ALIAS、ANAME、CNAME 攤平</h4>
<p>裸網域想指向 CDN 或負載平衡器（它們只給你一個名字、不給固定 IP），就用 DNS 供應商的私有功能：AWS Route 53 叫「alias 紀錄」，Cloudflare 叫「CNAME 攤平」（CNAME flattening），其他家叫 ALIAS 或 ANAME。原理都一樣：<b>權威伺服器自己去查那個目標名字，把查到的 A 紀錄當成自己的答案回給你</b>。對外看起來就是普通的 A 紀錄，所以不違反規則。代價是：答案是權威伺服器替你查的，CDN 可能依「權威伺服器的位置」而不是「使用者的位置」挑邊緣節點。Route 53 的 alias 指向 AWS 自己的資源時，查詢不收費，這也是它常被選用的原因。</p>
<h4>MX、TXT：寄信靠的紀錄</h4>
<ul>
<li><b>MX</b>：數字是優先順序，<b>越小越優先</b>；同樣數字就分攤。MX 指向的必須是有 A 或 AAAA 的主機名稱，不能是 CNAME，也不能直接寫 IP。完全不收信的網域，可以設一筆「null MX」：<code>0 .</code>，明確告訴全世界別寄過來。</li>
<li><b>TXT</b>：什麼都能放。最重要的三種都是防止別人冒用你的網域寄信：SPF（放在網域本身，列出誰可以替你寄信，查詢次數上限 10 次，include 太多會失效）、DKIM（放在 <code>選擇器._domainkey.example.com</code>，是驗簽用的公鑰）、DMARC（放在 <code>_dmarc.example.com</code>，例如 <code>v=DMARC1; p=reject</code>，告訴收信方驗證失敗時怎麼處理）。另外各種服務的「證明這個網域是你的」也是 TXT。單一個 TXT 字串最長 255 個字元，更長的要拆成好幾段。</li>
</ul>
<h4>NS、SOA：誰說了算</h4>
<p><b>NS</b> 紀錄出現在兩個地方：上一層（.com）有一份，叫委派（delegation）；你自己的區域裡也有一份。兩份應該一致。如果你的名稱伺服器就在自己的網域底下（例如 example.com 用 ns1.example.com），會變成雞生蛋的問題：要查 ns1.example.com 的位址，得先問 example.com 的名稱伺服器。所以上一層會直接附上它的位址，叫<b>黏著紀錄</b>（glue record）。</p>
<p><b>SOA</b> 是區域的「戶口名簿」：主要名稱伺服器、管理者信箱（第一個點代表 @）、序號，以及給次要伺服器用的同步參數（refresh、retry、expire）。有主從架構時，<b>改了區域卻忘了加序號，次要伺服器就不會同步</b>，於是一半的查詢拿到新答案、一半拿到舊的。慣例是用日期加流水號，例如 2026110901。最後一個欄位，決定「查不到」要快取多久，第六節細講。</p>
<h4>CAA：誰可以替你發憑證</h4>
<p>CAA 紀錄列出哪幾家憑證機構可以替這個網域發憑證。從 2017 年 9 月起，憑證機構發憑證前必須檢查它。上面那一行的意思是只有 Let's Encrypt 可以發。它不能阻止已經控制你 DNS 的攻擊者（他可以順手改掉 CAA），但能擋住「攻擊者騙某一家審核比較鬆的憑證機構」這種情況。</p>
<h4>其他你會遇到的</h4>
<p><b>PTR</b>：反查，從 IP 查名字，放在 <code>in-addr.arpa</code> 底下，由 IP 的擁有者（通常是雲端業者）設定；自己架郵件伺服器時，沒有正確的 PTR，信很容易被當成垃圾信。<b>SRV</b>：「某個服務在哪台主機的哪個埠」，Kubernetes 和一些遊戲、通訊協定會用。<b>HTTPS／SVCB</b>（2023 年的 RFC 9460）：讓瀏覽器在連線之前就知道這個網站支援 HTTP/3 和哪些連線參數，省掉一次嘗試。</p>

<h3><span class="badge lv2">進階</span>四、讀懂 dig：每一行都在告訴你事情</h3>
<pre><code>$ dig www.example.com

;; -&gt;&gt;HEADER&lt;&lt;- opcode: QUERY, status: NOERROR, id: 41237
;; flags: qr rd ra; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 1

;; QUESTION SECTION:
;www.example.com.            IN   A

;; ANSWER SECTION:
www.example.com.     287     IN   CNAME  example.com.
example.com.         287     IN   A      203.0.113.10

;; Query time: 23 msec
;; SERVER: 192.168.1.1#53(192.168.1.1) (UDP)</code></pre>
<ul>
<li><b>status</b>：<code>NOERROR</code> 是有回答（注意：有回答不代表有資料，見第六節）；<code>NXDOMAIN</code> 是這個名字根本不存在；<code>SERVFAIL</code> 是解析器沒辦法給答案，常見原因是權威伺服器全部連不到，或 DNSSEC 驗證失敗；<code>REFUSED</code> 是對方不願意回答你，例如你去問一台不替你做遞迴查詢的伺服器。</li>
<li><b>flags</b>：<code>qr</code> 代表這是回應；<code>rd</code> 是你要求遞迴；<code>ra</code> 是對方願意遞迴；<code>aa</code>（這裡沒有）代表<b>權威回答</b>，只有直接問權威伺服器才會出現；<code>ad</code> 代表解析器驗證過 DNSSEC。</li>
<li><b>TTL 欄（287）</b>：這是快取裡剩下的秒數，不是原本設定的值。再跑一次，它會變小。直接問權威伺服器，才看得到原始的 TTL。</li>
<li><b>Query time 和 SERVER</b>：問了誰、花多久。幾毫秒通常是命中快取，幾十到上百毫秒代表解析器剛剛真的跑出去問了。</li>
</ul>
<h4>最常用的幾個問法</h4>
<table>
<tr><th>指令</th><th>用途</th></tr>
<tr><td><code>dig +short example.com</code></td><td>只要答案</td></tr>
<tr><td><code>dig @1.1.1.1 example.com</code></td><td>指定去問某一台解析器，比較不同解析器的快取</td></tr>
<tr><td><code>dig @ns1.dnshost.example example.com +norecurse</code></td><td>直接問權威伺服器：看到的是「真相」和原始 TTL，旗標會有 aa</td></tr>
<tr><td><code>dig example.com NS @a.gtld-servers.net +norecurse</code></td><td>問上一層（.com）：看委派到底指向誰，答案在 AUTHORITY 區段</td></tr>
<tr><td><code>dig +trace example.com</code></td><td>從根開始自己走一遍，不用任何快取</td></tr>
<tr><td><code>dig -x 203.0.113.10</code></td><td>反查 PTR</td></tr>
<tr><td><code>dig example.com SOA +short</code></td><td>看序號和負面快取時間</td></tr>
<tr><td><code>dig +dnssec example.com</code></td><td>連簽章一起要，看 ad 旗標</td></tr>
</table>
<h4>「我改了 DNS，為什麼還是舊的」的除錯順序</h4>
<ol>
<li><b>問權威伺服器</b>：答案是新的嗎？不是的話，你根本沒改成功，或改錯了區域、改錯了供應商。</li>
<li><b>問上一層的委派</b>：.com 那邊記的名稱伺服器，是你正在編輯的那家嗎？換過 DNS 供應商卻忘了到註冊商改 NS，是經典事故：你在新供應商那裡怎麼改都沒用。</li>
<li><b>問幾台公共解析器</b>（8.8.8.8、1.1.1.1、你的網路業者）：舊的答案、剩下的 TTL 是多少？等它倒數完就好。</li>
<li><b>問本機</b>：<code>getent hosts</code> 或 <code>dscacheutil</code> 的結果？檢查 <code>/etc/hosts</code>，清系統和瀏覽器快取。</li>
<li><b>問程式</b>：程式是不是只在啟動時解析一次？連線池裡的連線是不是還連著舊的 IP？第五節會講。</li>
</ol>

<h3><span class="badge lv2">進階</span>五、TTL 的策略：搬家要提前多久</h3>
<p>TTL 是一個取捨：<b>長</b>，快取命中率高、使用者快、你的 DNS 查詢費用低，但改了要很久才生效；<b>短</b>，改了很快生效，但每個使用者更常付查詢的時間，DNS 供應商的帳單也變大（例如 Route 53 是依查詢次數收費）。平常的建議值（數量級）：</p>
<table>
<tr><th>紀錄</th><th>平常的 TTL</th><th>原因</th></tr>
<tr><td>NS</td><td>1 到 2 天</td><td>幾乎不會改，而且上一層的委派你也改不了它的 TTL</td></tr>
<tr><td>MX、TXT</td><td>1 小時以上</td><td>很少改</td></tr>
<tr><td>主要的 A、AAAA、CNAME</td><td>5 分鐘到 1 小時</td><td>穩定時可以長一點</td></tr>
<tr><td>要能快速切換的（容錯移轉用）</td><td>30 到 60 秒</td><td>雲端負載平衡器給你的名字，TTL 常常就是 60 秒</td></tr>
</table>
<h4>搬家的時間表</h4>
<p>把網站從舊伺服器搬到新伺服器，正確的步驟長這樣：</p>
<figure class="figure"><svg viewBox="0 0 680 260" class="fg" style="width:100%;max-width:680px" role="img" aria-label="搬遷時間表：搬遷前兩天把 TTL 降到 300，搬遷當天把 A 紀錄改到新 IP，新舊伺服器重疊一段時間，兩天後把 TTL 調回去">
<line x1="90" y1="38" x2="90" y2="210" class="fg-l dim dash"/>
<line x1="330" y1="38" x2="330" y2="210" class="fg-l dim dash"/>
<line x1="590" y1="38" x2="590" y2="210" class="fg-l dim dash"/>
<text x="30" y="44" class="fg-t sm">TTL</text>
<rect x="30" y="50" width="60" height="26" rx="4" class="fg-b"/><text x="60" y="68" text-anchor="middle" class="fg-t sm">3600</text>
<rect x="90" y="50" width="500" height="26" rx="4" class="fg-b hot"/><text x="210" y="68" text-anchor="middle" class="fg-t sm">300</text>
<rect x="590" y="50" width="60" height="26" rx="4" class="fg-b"/><text x="620" y="68" text-anchor="middle" class="fg-t sm">3600</text>
<text x="30" y="96" class="fg-t sm">A 紀錄指向</text>
<rect x="30" y="102" width="300" height="26" rx="4" class="fg-b"/><text x="180" y="120" text-anchor="middle" class="fg-t sm mono">舊 203.0.113.10</text>
<rect x="330" y="102" width="320" height="26" rx="4" class="fg-b alt"/><text x="490" y="120" text-anchor="middle" class="fg-t sm mono">新 198.51.100.20</text>
<text x="370" y="141" text-anchor="middle" class="fg-t sm warm">混用約 5 分鐘</text>
<text x="30" y="141" class="fg-t sm">誰在收流量</text>
<rect x="30" y="146" width="380" height="22" rx="4" class="fg-b warm"/><text x="100" y="161" class="fg-t sm">舊伺服器照常服務，直到日誌裡沒人來</text>
<rect x="330" y="172" width="320" height="22" rx="4" class="fg-b hot"/><text x="490" y="187" text-anchor="middle" class="fg-t sm">新伺服器</text>
<line x1="20" y1="210" x2="660" y2="210" class="fg-l"/>
<text x="90" y="228" text-anchor="middle" class="fg-t sm">T − 2 天</text>
<text x="330" y="228" text-anchor="middle" class="fg-t sm">T 搬遷</text>
<text x="590" y="228" text-anchor="middle" class="fg-t sm">T ＋ 2 天</text>
<text x="90" y="246" text-anchor="middle" class="fg-t sm acc">降 TTL</text>
<text x="330" y="246" text-anchor="middle" class="fg-t sm acc">改 A 紀錄</text>
<text x="590" y="246" text-anchor="middle" class="fg-t sm acc">調回 TTL</text>
</svg><figcaption>時間軸是示意，不照比例。關鍵是兩段等待：降 TTL 之後，要等舊的 TTL 過完；改紀錄之後，舊伺服器要繼續服務，直到流量真的歸零。</figcaption></figure>
<ol>
<li><b>提前降 TTL，而且提前的時間至少是舊 TTL。</b>這是最多人做錯的一步。原本 TTL 3600，你今天降到 300，可是昨天剛快取的解析器，手上那份還是「3600 秒」的舊紀錄，要等它過期、重新問，才知道新的 TTL 是 300。所以降 TTL 這個動作本身，就要提前至少一個舊 TTL；實務上提前一天，留足餘裕。</li>
<li><b>改紀錄。</b>之後最多 300 秒（加上少數不守規矩的快取），大部分流量會轉到新伺服器。</li>
<li><b>舊伺服器不要馬上關。</b>有些用戶端會撐很久：手機 App 在背景開著的連線、只在啟動時解析一次的程式、連線池裡還連著舊 IP 的連線。<b>已經建立的連線不會因為 DNS 改了就自己換過去</b>。看舊伺服器的存取日誌，等流量真的歸零（或只剩機器人），再關。舊伺服器也可以先改成把請求轉送到新伺服器，讓落後的人也拿到新資料。</li>
<li><b>調回 TTL。</b>確認穩定之後，把 TTL 調回原本的值，省下查詢量和使用者的等待。</li>
</ol>
<p><b>換 DNS 供應商更麻煩。</b>你要改的是 .com 那一層的 NS 委派，它的 TTL 通常是兩天，而且你改不了。正確做法是：先在新供應商建好一模一樣的區域，兩家同時正確回答至少好幾天，再去註冊商改 NS；改完之後，舊供應商的區域也要繼續保留、內容保持同步，等委派的 TTL 完全過去再刪。有開 DNSSEC 的話，還要先處理好簽章金鑰的交接，否則驗證失敗會讓整個網域對很多使用者直接消失。</p>
<h4>不守規矩的快取</h4>
<p>規格說 TTL 到了就要重問，但現實裡：有些解析器會把太短的 TTL 拉長到它自己的下限；有些程式只在啟動時解析一次，之後永遠用同一個 IP。最有名的例子是 nginx：開源版的 <code>proxy_pass http://api.example.com;</code> 傳統上只在啟動或重新載入設定時解析一次，上游換了 IP，nginx 還是一直連舊的。解法是設定 <code>resolver</code> 指令並把網址放進變數，或使用新版本在 upstream 的 server 上支援的 <code>resolve</code> 參數。</p>

<h3><span class="badge lv3">專業</span>六、「查不到」也會被快取：負面快取與搜尋網域</h3>
<p>DNS 的「沒有」分兩種，一定要分清楚：</p>
<ul>
<li><b>NXDOMAIN</b>：這個名字根本不存在。</li>
<li><b>NODATA</b>：名字存在，但沒有你要的那種紀錄。例如 example.com 有 A 沒有 AAAA，你問 AAAA，status 是 <code>NOERROR</code>，ANSWER 區段卻是空的。新手常把它誤讀成「查詢成功」。</li>
</ul>
<p>這兩種「沒有」也會被快取，叫<b>負面快取</b>（negative caching）。快取多久？權威伺服器在回答裡附上 SOA，時間取「SOA 這筆紀錄自己的 TTL」和「SOA 最後一個欄位」兩者中比較小的那個：</p>
<pre><code>$ dig new.example.com
;; -&gt;&gt;HEADER&lt;&lt;- opcode: QUERY, status: NXDOMAIN, id: 5521
;; AUTHORITY SECTION:
example.com.  300  IN  SOA  ns1.dnshost.example. hostmaster.example.com. 2026110901 7200 900 1209600 300</code></pre>
<p>一個真實會踩的坑：你準備上線 <code>new.example.com</code>，紀錄還沒建好，你（或監控系統、或憑證申請流程）先查了一次。解析器把 NXDOMAIN 快取起來。你接著建好紀錄，可是在負面快取過期之前，透過那台解析器的人一律「找不到伺服器」。如果你的 SOA 最後一個欄位設成 86400，那就是一整天。所以：<b>上線前先建紀錄，再測試；SOA 的負面快取時間，保持在幾分鐘到一小時的範圍。</b></p>
<h4>Kubernetes 裡的 ndots：一次查詢變成八次</h4>
<p>在 Pod 裡面看 <code>/etc/resolv.conf</code>：</p>
<pre><code>search default.svc.cluster.local svc.cluster.local cluster.local
nameserver 10.96.0.10
options ndots:5</code></pre>
<p><code>ndots:5</code> 的意思是：名字裡的點少於 5 個，就先當成「短名字」，依序接上 search 清單裡的每一個後綴去試。你的程式查 <code>api.example.com</code>（只有 2 個點），實際發生的是：</p>
<ol>
<li><code>api.example.com.default.svc.cluster.local</code>：NXDOMAIN</li>
<li><code>api.example.com.svc.cluster.local</code>：NXDOMAIN</li>
<li><code>api.example.com.cluster.local</code>：NXDOMAIN</li>
<li><code>api.example.com</code>：終於成功</li>
</ol>
<p>而且 A 和 AAAA 各問一次，一個外部名字就變成 8 次查詢，6 次是白問的。流量大的叢集裡，這會讓叢集的 DNS 服務壓力倍增，偶爾的逾時再把延遲拉長好幾秒。解法：設定裡寫完整的名字並加上結尾的點（<code>api.example.com.</code>），或在 Pod 的 <code>dnsConfig</code> 把 ndots 調低（例如 2），大型叢集再加上每個節點本地的 DNS 快取（NodeLocal DNSCache）。</p>

<h3><span class="badge lv3">專業</span>七、用 DNS 分流量：能做到哪裡，做不到哪裡</h3>
<p>代管 DNS 可以依條件給不同答案。AWS Route 53 的路由政策就是很好的清單：</p>
<ul>
<li><b>加權</b>（weighted）：90% 的查詢回舊叢集、10% 回新叢集，做金絲雀發布。</li>
<li><b>延遲</b>（latency）與<b>地理位置</b>（geolocation）：回離使用者最近、或指定國家的那個區域。</li>
<li><b>容錯移轉</b>（failover）：搭配健康檢查，主要的掛了就回備援的。</li>
</ul>
<p>「依使用者的位置」其實是依<b>解析器</b>的位置，因為權威伺服器只看得到解析器的 IP。用了公共解析器的使用者，可能被判斷到錯的地區。為此有個擴充叫 EDNS 用戶端子網路（EDNS Client Subnet，ECS）：解析器把使用者 IP 的前段（例如 /24）一起送給權威伺服器。Google 的 8.8.8.8 會送；Cloudflare 的 1.1.1.1 為了隱私不送。</p>
<p>DNS 分流量最大的弱點，是你控制不了答案被用多久：</p>
<figure class="figure"><svg viewBox="0 0 680 240" class="fg" style="width:100%;max-width:680px" role="img" aria-label="DNS 容錯移轉的時間軸：伺服器在 0 秒掛掉，健康檢查 30 秒後判定失敗，解析器的快取最晚到 90 秒才過期，保持連線的用戶端要等到重新連線才恢復">
<line x1="233" y1="24" x2="233" y2="62" class="fg-l dim dash"/><line x1="233" y1="92" x2="233" y2="180" class="fg-l dim dash"/>
<line x1="400" y1="24" x2="400" y2="180" class="fg-l dim dash"/>
<text x="10" y="46" class="fg-t sm">伺服器 A</text>
<rect x="150" y="30" width="500" height="24" rx="4" class="fg-b warm"/><text x="160" y="47" class="fg-t sm">從 0 秒起掛了</text>
<text x="10" y="82" class="fg-t sm">健康檢查</text>
<text x="178" y="82" text-anchor="middle" class="fg-t warm">✗</text>
<text x="206" y="82" text-anchor="middle" class="fg-t warm">✗</text>
<text x="233" y="82" text-anchor="middle" class="fg-t warm">✗</text>
<text x="248" y="82" class="fg-t sm">3 次失敗 → DNS 拿掉 A</text>
<text x="10" y="118" class="fg-t sm">解析器快取</text>
<rect x="150" y="102" width="250" height="24" rx="4" class="fg-b warm"/><text x="160" y="119" class="fg-t sm">還在回 A（TTL 60）</text>
<rect x="400" y="102" width="250" height="24" rx="4" class="fg-b"/><text x="410" y="119" class="fg-t sm">過期，拿到新答案</text>
<text x="10" y="154" class="fg-t sm">用戶端</text>
<rect x="150" y="138" width="500" height="24" rx="4" class="fg-b warm dash"/><text x="160" y="155" class="fg-t sm">保持著的連線、只解析一次的程式：一直錯到重連</text>
<line x1="150" y1="180" x2="650" y2="180" class="fg-l"/>
<text x="150" y="198" text-anchor="middle" class="fg-t sm">0</text>
<text x="233" y="198" text-anchor="middle" class="fg-t sm">30 秒</text>
<text x="317" y="198" text-anchor="middle" class="fg-t sm">60</text>
<text x="400" y="198" text-anchor="middle" class="fg-t sm">90</text>
<text x="483" y="198" text-anchor="middle" class="fg-t sm">120</text>
<text x="567" y="198" text-anchor="middle" class="fg-t sm">150</text>
<text x="650" y="198" text-anchor="middle" class="fg-t sm">180</text>
<text x="340" y="228" text-anchor="middle" class="fg-t sm">使用者真正恢復 ＝ 偵測時間 ＋ TTL ＋ 用戶端自己的快取和連線</text>
</svg><figcaption>健康檢查每 10 秒一次、連續失敗 3 次才判定，TTL 60 秒：最快也要一分半，大部分使用者才拿到新答案；保持著舊連線的用戶端，還要更久。</figcaption></figure>
<p>還有幾個天生的限制：</p>
<ul>
<li><b>DNS 不知道負載。</b>它不知道哪台伺服器現在很忙，只能照你設的比例回答。</li>
<li><b>分配不均。</b>一台大型解析器背後有幾萬個使用者，它快取了一個答案，這幾萬人在 TTL 內就全部去同一個地方。「加權 10%」只是查詢次數的 10%，不是使用者的 10%。</li>
<li><b>沒有連線層級的控制。</b>它決定的是「下一次查詢的答案」，不是「這一條連線去哪裡」。</li>
</ul>
<p>所以業界的分工是：<b>DNS 做粗的</b>，把使用者導到大概正確的區域；<b>負載平衡器做細的</b>，在區域裡依健康狀態和負載，把每一條連線分給後端（第 1.7 課）。真正要求秒級切換的，用 anycast 的全球負載平衡器（一個 IP，由網路層決定送到哪），而不是靠 DNS 的 TTL。</p>

<h3><span class="badge lv4">專家</span>八、DNSSEC 白話版：替答案蓋章</h3>
<p>DNS 原本完全沒有驗證。解析器送出問題，誰先回一個「看起來對」的答案，它就收下。2008 年 Dan Kaminsky 公開了一種攻擊：大量偽造回答去猜查詢的編號（只有 16 位元，65,536 種），猜中一次，就能把假答案塞進解析器的快取，影響所有用那台解析器的人。這叫<b>快取汙染</b>（cache poisoning）。當時的緊急修補，是讓每次查詢的來源埠也隨機，讓攻擊者要猜的組合多了好幾萬倍。這是補丁，不是根治。</p>
<p>DNSSEC 是根治的做法：<b>每一個區域用自己的私鑰，替自己的紀錄簽章；上一層再替下一層的公鑰背書</b>，一路串到根。</p>
<figure class="figure"><svg viewBox="0 0 680 300" class="fg" style="width:100%;max-width:680px" role="img" aria-label="DNSSEC 信任鏈：解析器內建根的公鑰，根區域用 DS 紀錄背書 com 的公鑰，com 再背書 example.com 的公鑰，example.com 的公鑰驗證 A 紀錄的簽章">
<text x="10" y="22" class="fg-t sm acc">信任錨：解析器內建根的公鑰</text>
<line x1="40" y1="28" x2="40" y2="92" class="fg-l on"/><polygon points="40,100 35.5,92 44.5,92" class="fg-a on"/>
<rect x="10" y="44" width="180" height="200" rx="8" class="fg-b"/>
<text x="110" y="64" text-anchor="middle" class="fg-t">根區域（.）</text>
<rect x="250" y="44" width="180" height="200" rx="8" class="fg-b"/>
<text x="340" y="64" text-anchor="middle" class="fg-t">com.</text>
<rect x="490" y="44" width="180" height="200" rx="8" class="fg-b"/>
<text x="580" y="64" text-anchor="middle" class="fg-t">example.com.</text>
<rect x="30" y="100" width="150" height="30" rx="5" class="fg-b hot"/><text x="105" y="120" text-anchor="middle" class="fg-t sm">DNSKEY：公鑰</text>
<rect x="30" y="144" width="150" height="30" rx="5" class="fg-b alt"/><text x="105" y="164" text-anchor="middle" class="fg-t sm">DS：下一層的雜湊</text>
<rect x="30" y="196" width="150" height="30" rx="5" class="fg-b"/><text x="105" y="216" text-anchor="middle" class="fg-t sm">RRSIG：簽章</text>
<rect x="270" y="100" width="150" height="30" rx="5" class="fg-b hot"/><text x="345" y="120" text-anchor="middle" class="fg-t sm">DNSKEY：公鑰</text>
<rect x="270" y="144" width="150" height="30" rx="5" class="fg-b alt"/><text x="345" y="164" text-anchor="middle" class="fg-t sm">DS：下一層的雜湊</text>
<rect x="270" y="196" width="150" height="30" rx="5" class="fg-b"/><text x="345" y="216" text-anchor="middle" class="fg-t sm">RRSIG：簽章</text>
<rect x="510" y="100" width="150" height="30" rx="5" class="fg-b hot"/><text x="585" y="120" text-anchor="middle" class="fg-t sm">DNSKEY：公鑰</text>
<rect x="510" y="144" width="150" height="30" rx="5" class="fg-b warm"/><text x="585" y="164" text-anchor="middle" class="fg-t sm mono">A 203.0.113.10</text>
<rect x="510" y="196" width="150" height="30" rx="5" class="fg-b"/><text x="585" y="216" text-anchor="middle" class="fg-t sm">RRSIG：簽章</text>
<path d="M30 124 H20 V211 H22" class="fg-l alt dash"/><polygon points="30,211 22,206.5 22,215.5" class="fg-a alt"/>
<path d="M270 124 H260 V211 H262" class="fg-l alt dash"/><polygon points="270,211 262,206.5 262,215.5" class="fg-a alt"/>
<path d="M180 159 H220 V115 H262" class="fg-l on"/><polygon points="270,115 262,110.5 262,119.5" class="fg-a on"/>
<text x="220" y="184" text-anchor="middle" class="fg-t sm acc">比對</text>
<path d="M420 159 H460 V115 H502" class="fg-l on"/><polygon points="510,115 502,110.5 502,119.5" class="fg-a on"/>
<text x="460" y="184" text-anchor="middle" class="fg-t sm acc">比對</text>
<path d="M510 124 H500 V211 H502" class="fg-l alt dash"/><polygon points="510,211 502,206.5 502,215.5" class="fg-a alt"/>
<text x="340" y="272" text-anchor="middle" class="fg-t sm">每一層：用自己的 DNSKEY 驗 RRSIG；再用上一層的 DS 確認這把 DNSKEY 是真的</text>
<text x="340" y="292" text-anchor="middle" class="fg-t sm">全部對上，回答帶 ad 旗標；任何一環對不上，解析器回 SERVFAIL</text>
</svg><figcaption>信任從左邊流到右邊。解析器只需要事先信任根的那一把公鑰，就能一層一層確認：com 的公鑰是根背書的，example.com 的公鑰是 com 背書的，那筆 A 紀錄是 example.com 簽的。</figcaption></figure>
<ul>
<li><b>DNSKEY</b>：區域的公鑰。實務上分兩把：一把只用來簽「公鑰本身」（KSK），一把用來簽一般紀錄（ZSK），這樣常常更換的 ZSK 不必每次都麻煩上一層。</li>
<li><b>RRSIG</b>：對「一組紀錄」（例如 www 的所有 A 紀錄）的簽章，有有效期限。</li>
<li><b>DS</b>：放在<b>上一層</b>的紀錄，內容是下一層 KSK 的雜湊。你在註冊商那裡「開啟 DNSSEC」，做的就是把 DS 交給 .com。</li>
<li><b>證明「不存在」</b>：查不到也要能驗證，否則攻擊者可以偽造「不存在」。NSEC 紀錄用「排序後，這個名字和下一個名字之間什麼都沒有」來證明，副作用是別人能一路列出你區域裡的所有名字；NSEC3 改用雜湊過的名字，讓列舉變難。</li>
</ul>
<p>要記住它<b>保護什麼、不保護什麼</b>：它保證答案沒被竄改、真的來自區域的擁有者；它<b>不加密</b>，路上的人照樣看得到你在查什麼（隱私是 DNS over TLS，853 埠，和 DNS over HTTPS，443 埠，在處理）；它也擋不住「攻擊者直接登入你的 DNS 帳號改紀錄」，因為那樣的紀錄會被正常簽章。最大的營運風險是：簽章過期、換金鑰沒做好、換供應商時 DS 沒同步，對開了驗證的解析器來說，你的網域就是 SERVFAIL，整個消失。<b>DNSViz</b> 這類工具可以把整條鏈畫出來，找出哪一環斷了。</p>
<p>另外一提：有些瀏覽器會自己用 DNS over HTTPS 去問特定的公共解析器，繞過作業系統和公司的 DNS。對使用者是隱私，對公司內部「只在內網才解析得到」的名字，可能就變成查不到。</p>

<h3><span class="badge lv4">專家</span>九、DNS 劫持：攻擊者從哪一扇門進來</h3>
<p>把整條鏈上「誰能改答案」列出來，就是攻擊面：</p>
<table>
<tr><th>門</th><th>攻擊者做什麼</th><th>防法</th></tr>
<tr><td>網域註冊商帳號</td><td>登入後把 NS 改成自己的伺服器，整個網域歸他，還能立刻替你的網域申請有效憑證</td><td>硬體金鑰的多重要素驗證；開啟轉移鎖；高價值網域申請登記局鎖（registry lock），任何改動都要人工、帶外確認</td></tr>
<tr><td>DNS 供應商帳號、API 權杖</td><td>改某一筆紀錄，例如把 mail 或 api 指走</td><td>多重要素；API 權杖只給需要的區域和權限；紀錄變更要有通知和稽核</td></tr>
<tr><td>懸空的紀錄（dangling record）</td><td>你刪了雲端資源（儲存桶、應用程式服務），CNAME 卻還指著它。攻擊者用同樣的名字把資源註冊回來，你的子網域就開始提供他的內容</td><td>刪資源前先刪 DNS 紀錄；定期掃描所有紀錄，檢查指向的東西還是不是你的</td></tr>
<tr><td>網域過期</td><td>忘了續約，網域被別人搶註</td><td>自動續約、多年期、到期監控，聯絡信箱不要用同一個網域</td></tr>
<tr><td>解析器、網路路徑</td><td>快取汙染、惡意 Wi-Fi 塞給你假的 DNS 伺服器、BGP 劫持權威伺服器的位址</td><td>DNSSEC；HTTPS 加上 HSTS，讓假伺服器拿不出有效憑證</td></tr>
</table>
<p>第一扇門最致命，因為 DNS 是很多信任的根：憑證機構用「你能不能在 DNS 或網站上放一段指定內容」來確認網域是你的，所以控制了 DNS 的人，幾分鐘內就能拿到你網域的有效憑證，使用者的瀏覽器會顯示一把完全正常的鎖頭。2019 年初，美國網路安全暨基礎設施安全局（CISA）因為一波針對 DNS 帳號的劫持攻擊，發出緊急指令（Emergency Directive 19-01），要求聯邦機構在短時間內做完四件事：稽核所有 DNS 紀錄、更改 DNS 相關帳號的密碼、開啟多重要素驗證、監控憑證透明度日誌。這四件事，也正是你該做的。</p>
<h4>兩個容易被忽略的細節</h4>
<ul>
<li><b>聯絡信箱的循環依賴。</b>如果註冊商帳號的信箱是 <code>admin@example.com</code>，而 example.com 正是被劫持的那個網域，攻擊者就能收你的「重設密碼」信，你卻收不到。註冊商的聯絡信箱要放在另一個網域。</li>
<li><b>監控憑證透明度。</b>所有公開信任的憑證都會被記錄在公開的憑證透明度（Certificate Transparency）日誌裡。用 crt.sh 這類服務或監控工具，訂閱自己網域的新憑證，有人替你的網域申請了你不知道的憑證，你會第一時間知道。這是 DNS 被動手腳時最早的警報之一。</li>
</ul>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>改了 DNS，要等 24 到 48 小時「全球生效」</td><td>沒有全球同步這件事，只有各處快取各自過期。等待時間由舊紀錄的 TTL 決定，提前降 TTL，幾分鐘就生效。換 NS 委派才真的要等一兩天。</td></tr>
<tr><td>dig 查到新的，使用者就會連到新的</td><td>dig 跳過 /etc/hosts 和系統快取，也不知道程式裡的連線池。還要看用戶端的快取和已經建立的連線。</td></tr>
<tr><td>status 是 NOERROR，代表有資料</td><td>NODATA 也是 NOERROR，只是答案區段是空的。</td></tr>
<tr><td>降 TTL 立刻有效</td><td>新的 TTL 要等舊的 TTL 過期才會被看到，所以要提前至少一個舊 TTL 降。</td></tr>
<tr><td>開了 DNSSEC，DNS 就安全了</td><td>它防竄改，不防偷看，也防不了 DNS 帳號被盜。設定出錯，還會讓整個網域查不到。</td></tr>
<tr><td>DNS 加權 10% 就是 10% 的使用者</td><td>是 10% 的查詢。大型解析器快取一個答案，後面成千上萬人一起去同一個地方。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>前端（Vue、TypeScript）</b>：API、CDN、圖片放在不同網域，每一個都是一次 DNS 查詢，用 <code>&lt;link rel="dns-prefetch"&gt;</code> 或 preconnect 提早做；本機測試改 <code>/etc/hosts</code> 之後記得改回來。</li>
<li><b>遊戲（Cocos、Unity）</b>：手機 App 把伺服器網址寫進安裝包，換伺服器就只能靠 DNS；遊戲伺服器的名字 TTL 不要設太長，並讓用戶端在重新連線時重新解析，而不是一直用第一次拿到的 IP。</li>
<li><b>後端（Node.js、Go）</b>：Node.js 的 <code>dns.lookup</code> 走 libuv 的執行緒池（預設 4 條），大量解析會跟檔案操作搶執行緒；連外部服務一定要重用連線；在 Kubernetes 裡外部名字加結尾的點，或調低 ndots。</li>
<li><b>Docker、雲端</b>：Docker 的自訂網路內建一個 DNS（127.0.0.11），容器名稱就是主機名稱；用 Terraform 管理 DNS 紀錄，變更就有審查和歷史；刪雲端資源前先刪紀錄，避免子網域被接管。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<p>先自己講一遍，再打開參考答案。</p>
<ol>
<li>「瀏覽器要連 www.example.com，DNS 從頭到尾發生了什麼？中間有哪些快取？」</li>
<li>「你要把網站搬到新的 IP，而且希望使用者幾乎感覺不到，你的 DNS 計畫是什麼？」</li>
<li>「為什麼裸網域不能設 CNAME？那要怎麼指向 CDN？」</li>
<li>「NXDOMAIN 和 NODATA 有什麼差別？什麼是負面快取，它會怎麼害到你？」</li>
<li>「用 DNS 做容錯移轉，有什麼限制？」</li>
<li>「DNSSEC 解決什麼問題？沒解決什麼問題？如果有人拿到你註冊商的帳號，會發生什麼事？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>瀏覽器先查自己的快取，再呼叫作業系統，作業系統看 /etc/hosts 和系統快取，沒有就問設定的 DNS（可能先經過路由器或公司的轉發器），最後到遞迴解析器。解析器快取沒有的話，從根開始迭代查詢：根回答 .com 的名稱伺服器，.com 回答 example.com 的名稱伺服器，權威伺服器給出紀錄（可能經過 CNAME 鏈）和 TTL。解析器把每一筆依各自 TTL 快取並回給用戶端，沿路的作業系統和瀏覽器也各自快取。一般走 UDP 53，回答太大時改走 TCP。</li>
<li>提前至少一個舊 TTL（實務上一天）把紀錄的 TTL 降到 60 到 300 秒；確認新伺服器已經可以服務、以權威伺服器驗證新紀錄；切換 A 紀錄；舊伺服器繼續服務或轉送到新伺服器，直到日誌顯示流量歸零，因為已經建立的連線、只解析一次的程式和不守 TTL 的快取會持續送來；最後把 TTL 調回原值。若是換 DNS 供應商，還要讓新舊供應商同時正確回答，再改 NS 委派，並處理 DNSSEC 的 DS。</li>
<li>規格規定有 CNAME 的名字不能有其他紀錄，而裸網域必須有 SOA 和 NS，所以衝突。做法是用 DNS 供應商的 ALIAS、ANAME 或 CNAME 攤平（Route 53 的 alias 紀錄）：權威伺服器自己解析目標名字，以 A 和 AAAA 的形式回答；或讓 CDN 提供固定的 anycast IP 直接設 A 紀錄。也可以讓裸網域只做轉址到 www。</li>
<li>NXDOMAIN 表示名字不存在；NODATA 表示名字存在但沒有那種類型的紀錄，回應碼是 NOERROR、答案為空。兩者都會被快取，時間由回答附帶的 SOA 決定（SOA 的 TTL 和 SOA 最小值欄位取小）。坑：紀錄建立之前有人查過，解析器快取了 NXDOMAIN，紀錄建好後在負面快取期間內仍然查不到；SOA 最小值設太大（例如一天）會讓這個窗口很長。</li>
<li>切換時間至少是健康檢查偵測時間加上 TTL，且解析器、作業系統、瀏覽器可能各自快取；已經建立的長連線和只在啟動時解析的程式不會換；部分解析器會延長太短的 TTL；DNS 不知道後端負載，大型解析器讓分配不均。所以 DNS 適合做區域層級的粗略導流與災難切換，秒級的容錯要交給負載平衡器或 anycast 的全球負載平衡。</li>
<li>DNSSEC 讓解析器能驗證答案確實由區域擁有者簽署、沒被竄改，防止快取汙染和路徑上的偽造，並能驗證「不存在」。它不加密查詢（那是 DoT、DoH），也不能防止合法帳號被盜後的修改。註冊商帳號被盜，攻擊者可以把 NS 改成自己的，掌控整個網域的所有紀錄，攔截郵件，並透過 DNS 或 HTTP 驗證立刻取得有效憑證，使用者看不出異狀。防禦是硬體金鑰的多重要素、轉移鎖和登記局鎖、聯絡信箱放在別的網域、監控憑證透明度日誌和 NS 變更。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>你在下午 3 點把 TTL 從 86400 降到 300，下午 4 點改了 A 紀錄。最壞的情況下，某個解析器最晚什麼時候才會開始回新的 IP？要怎麼做才對？</li>
<li>dig 回來 <code>status: NOERROR</code>，ANSWER 是 0。這代表什麼？舉一個常見的例子。</li>
<li>寫出 dig 指令：(a) 直接問 example.com 的權威伺服器 ns1.dnshost.example，不要遞迴；(b) 問 .com 那一層，example.com 委派給了誰。各自要看回應的哪一個區段？</li>
<li>一個 Pod 每秒對 <code>api.partner.example</code> 發 200 次新連線（每次都重新解析），ndots 是預設的 5。叢集的 DNS 服務每秒會因此收到幾次查詢？其中幾次是白問的？給出兩種改法。</li>
<li>公司要停用一個行銷活動子網域 <code>promo.example.com</code>，它是 CNAME 指向雲端儲存桶 <code>promo-2025.storage.example</code>。正確的下線順序是什麼？順序反了會發生什麼事？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>在 2:59 剛好快取了舊紀錄（TTL 86400）的解析器，要到隔天下午 2:59 才會重新問，所以最壞要將近 24 小時才回新 IP。正確做法是至少提前一個舊 TTL 降 TTL：例如前一天下午 3 點以前就降到 300，等滿 24 小時以上，再改 A 紀錄，這時最壞只要 5 分鐘。</li>
<li>這是 NODATA：名字存在，但沒有你問的那種紀錄。例如網站只有 IPv4，問 AAAA 就會這樣；或某個名字只有 TXT 紀錄，你卻問它的 A。它也會依 SOA 被負面快取。</li>
<li>(a) <code>dig @ns1.dnshost.example example.com +norecurse</code>，看 ANSWER 區段和 flags 裡的 aa；(b) <code>dig @a.gtld-servers.net example.com NS +norecurse</code>，委派在 AUTHORITY 區段（不是 ANSWER），名稱伺服器在網域內時，ADDITIONAL 區段會有黏著紀錄。</li>
<li>名字只有 2 個點，小於 5，會先試 3 個搜尋後綴再試原名，每個名字 A、AAAA 各一次：每次解析 8 個查詢，每秒 1,600 次，其中 6 × 200 = 1,200 次是必定 NXDOMAIN 的白問（節點上有快取時會少一些，但量級如此）。改法：用 <code>api.partner.example.</code>（結尾加點）；Pod 的 dnsConfig 把 ndots 設成 2；更根本的是重用連線，不要每秒開 200 條新連線。</li>
<li>先刪（或改指向你控制的地方）DNS 紀錄，等它的 TTL 過完，再刪儲存桶。如果先刪儲存桶，CNAME 就變成懸空的紀錄：任何人都可以用同樣的名字建一個儲存桶，promo.example.com 就開始提供他的內容，可以拿來釣魚，甚至讀取設在 .example.com 上的 Cookie。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>Cricket Liu 與 Paul Albitz《DNS and BIND》</b>（O'Reilly）：DNS 的經典，區域檔、委派、主從同步、DNSSEC，每一個細節都講得很清楚。</li>
<li><b>Julia Evans 的 Mess With DNS</b>（messwithdns.net）：免費的線上實驗場，給你一個真的子網域，讓你自己建紀錄、看解析器怎麼查，最適合用手感學。</li>
<li><b>Cloudflare Learning Center 的 DNS 章節</b>（cloudflare.com/learning）：紀錄類型、DNSSEC、DNS over HTTPS 的圖解短文。</li>
<li><b>DNSViz</b>（dnsviz.net）：輸入網域，把整條 DNSSEC 信任鏈畫出來，標出哪一環有錯。</li>
<li><b>RFC 1034、RFC 1035（DNS 本身）與 RFC 2308（負面快取）</b>：規格原文。遇到「這樣到底合不合規則」的爭議時，回來查這幾份。</li>
</ul>
` });
