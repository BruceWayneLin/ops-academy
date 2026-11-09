DEEP({ 'net-fw': `
<p>上一課的原則只有一句：預設全擋，需要才開。這一章看這句話在每一層是怎麼實現的：有狀態的防火牆到底「記住」了什麼；一個封包進了 Linux 核心之後，會依序經過 netfilter 的哪幾個檢查點，iptables、nftables、ufw 又是什麼關係；雲端的安全群組和網路 ACL 差在哪裡；三層式架構的規則怎麼設計才不會越加越亂；為什麼「往外連」也要管；Docker 和 Kubernetes 怎麼在你不知不覺中改寫主機的防火牆；從防守方的角度看掃描器看到的世界；最後是怎麼記錄、怎麼稽核，讓規則不會在半年後變成沒人敢動的一團亂麻。</p>

<h3><span class="badge lv1">基礎</span>一、無狀態與有狀態：警衛有沒有拿筆記本</h3>
<p>想像大樓門口的警衛。第一種警衛手上只有一張名單，每個經過的人都單獨對照：「要進 443 室的可以進」。問題是，裡面的人出門辦事再回來時，警衛不記得他剛剛出去過，只好在名單上再加一條「從外面回來的都可以進」，這條規則寬到幾乎等於沒擋。第二種警衛拿著一本筆記本：「10:05，302 室的人出門，去 203.0.113.80」，等那個人回來，他翻一下筆記本，對得上就放行。前者是<b>無狀態</b>（stateless）過濾，後者是<b>有狀態</b>（stateful）防火牆。</p>
<figure class="figure"><svg viewBox="0 0 680 270" class="fg" style="width:100%;max-width:680px" role="img" aria-label="左邊是無狀態過濾，需要三條規則，其中讓回應進來的那條開了大洞；右邊是有狀態防火牆，只寫一條規則，回應靠連線追蹤表自動放行">
<text x="175" y="24" text-anchor="middle" class="fg-t warm">無狀態：每個封包各自判斷</text>
<rect x="30" y="40" width="290" height="44" rx="6" class="fg-b"/>
<text x="42" y="58" class="fg-t sm">規則 1（進）：目的埠 443 → 放行</text>
<text x="42" y="75" class="fg-t sm">讓請求進得來</text>
<rect x="30" y="94" width="290" height="44" rx="6" class="fg-b"/>
<text x="42" y="112" class="fg-t sm">規則 2（出）：來源埠 443 → 放行</text>
<text x="42" y="129" class="fg-t sm">讓回應出得去</text>
<rect x="30" y="148" width="290" height="44" rx="6" class="fg-b warm"/>
<text x="42" y="166" class="fg-t sm">規則 3（進）：來源埠 443、目的埠 1024–65535</text>
<text x="42" y="183" class="fg-t sm">讓伺服器呼叫外部 API 的回應進來</text>
<text x="175" y="222" text-anchor="middle" class="fg-t sm warm">規則 3 是個大洞：攻擊者只要把來源埠寫成 443，</text>
<text x="175" y="240" text-anchor="middle" class="fg-t sm warm">就能打到你所有的高號連接埠</text>
<line x1="340" y1="14" x2="340" y2="256" class="fg-l dim dash"/>
<text x="505" y="24" text-anchor="middle" class="fg-t acc">有狀態：記得每一條連線</text>
<rect x="360" y="40" width="290" height="44" rx="6" class="fg-b hot"/>
<text x="372" y="58" class="fg-t sm">規則：新連線、目的埠 443 → 放行</text>
<text x="372" y="75" class="fg-t sm">只寫「誰可以發起連線」</text>
<rect x="360" y="94" width="290" height="98" rx="6" class="fg-b alt"/>
<text x="372" y="113" class="fg-t sm">連線追蹤表（conntrack）</text>
<text x="372" y="135" class="fg-t sm mono">198.51.100.7:51234 → 10.0.1.11:443</text>
<text x="372" y="155" class="fg-t sm mono">10.0.1.11:40312 → 203.0.113.80:443</text>
<text x="372" y="177" class="fg-t sm">兩筆都是 ESTABLISHED</text>
<text x="505" y="222" text-anchor="middle" class="fg-t sm acc">回應對得上表裡的某一筆 → 自動放行</text>
<text x="505" y="240" text-anchor="middle" class="fg-t sm">對不上、沒頭沒尾的封包 → 丟掉</text>
</svg><figcaption>無狀態的過濾器為了讓回應通過，只好把一大片連接埠打開。有狀態的防火牆把每條連線記在表裡，回應只要對得上某一筆就放行，你只需要寫「誰可以發起」。</figcaption></figure>
<p>Linux 的連線追蹤（conntrack）會替每個封包貼一個狀態標籤，規則就是依這些標籤寫的：</p>
<table>
<tr><th>狀態</th><th>意思</th><th>例子</th></tr>
<tr><td>NEW</td><td>這條連線的第一個封包</td><td>用戶端送來的 SYN</td></tr>
<tr><td>ESTABLISHED</td><td>屬於一條雙向都看過封包的連線</td><td>SYN-ACK 之後的所有封包</td></tr>
<tr><td>RELATED</td><td>不屬於這條連線，但跟它有關</td><td>這條連線引發的 ICMP 錯誤訊息，例如「封包太大」</td></tr>
<tr><td>INVALID</td><td>對不上任何連線，或格式怪異</td><td>沒有 SYN 就冒出來的 ACK，掃描器常送這種</td></tr>
</table>
<p>在 Linux 上用 <code>sudo conntrack -L</code> 可以看到表的內容，一筆大概長這樣：<code>tcp 6 431999 ESTABLISHED src=198.51.100.7 dst=10.0.1.11 sport=51234 dport=443 …</code>。那個 431999 是剩下的秒數：已建立的 TCP 連線，預設可以閒置 5 天才被忘掉。UDP 沒有「連線」，conntrack 就用「同一組位址和連接埠，最近有來有往」來假裝它是一條連線，閒置幾十秒到幾分鐘就清掉。</p>

<h3><span class="badge lv2">進階</span>二、封包在 Linux 核心裡走哪條路：netfilter</h3>
<p>Linux 的防火牆功能叫 <b>netfilter</b>，是核心裡的一組「檢查點」（hook）。每個封包依它要去哪裡，會經過其中幾個。iptables、nftables、ufw、firewalld、Docker、kube-proxy，最後全部都是在這幾個檢查點上掛規則。</p>
<figure class="figure"><svg viewBox="0 30 700 232" class="fg" style="width:100%;max-width:700px" role="img" aria-label="netfilter 的路徑：封包進來先經過 PREROUTING，路由決定之後，給本機的走 INPUT 到本機程式，要轉給別人的走 FORWARD 到 POSTROUTING；本機程式送出的走 OUTPUT 再到 POSTROUTING">
<text x="20" y="70" class="fg-t sm">進來</text>
<line x1="48" y1="65" x2="62" y2="65" class="fg-l"/><polygon points="70,65 62,60.5 62,69.5" class="fg-a"/>
<rect x="70" y="40" width="120" height="50" rx="6" class="fg-b"/>
<text x="130" y="61" text-anchor="middle" class="fg-t mono">PREROUTING</text>
<text x="130" y="79" text-anchor="middle" class="fg-t sm">conntrack、DNAT</text>
<line x1="190" y1="65" x2="207" y2="65" class="fg-l"/><polygon points="215,65 207,60.5 207,69.5" class="fg-a"/>
<rect x="215" y="40" width="100" height="50" rx="6" class="fg-b"/>
<text x="265" y="61" text-anchor="middle" class="fg-t">路由決定</text>
<text x="265" y="79" text-anchor="middle" class="fg-t sm">給我的嗎？</text>
<line x1="315" y1="65" x2="332" y2="65" class="fg-l alt"/><polygon points="340,65 332,60.5 332,69.5" class="fg-a alt"/>
<rect x="340" y="40" width="120" height="50" rx="6" class="fg-b alt"/>
<text x="400" y="61" text-anchor="middle" class="fg-t mono">FORWARD</text>
<text x="400" y="79" text-anchor="middle" class="fg-t sm">轉給容器、別台</text>
<line x1="460" y1="65" x2="477" y2="65" class="fg-l alt"/><polygon points="485,65 477,60.5 477,69.5" class="fg-a alt"/>
<rect x="485" y="40" width="130" height="50" rx="6" class="fg-b"/>
<text x="550" y="61" text-anchor="middle" class="fg-t mono">POSTROUTING</text>
<text x="550" y="79" text-anchor="middle" class="fg-t sm">SNAT、偽裝來源</text>
<line x1="615" y1="65" x2="632" y2="65" class="fg-l"/><polygon points="640,65 632,60.5 632,69.5" class="fg-a"/>
<text x="646" y="70" class="fg-t sm">出去</text>
<line x1="265" y1="90" x2="265" y2="162" class="fg-l on"/><polygon points="265,170 260.5,162 269.5,162" class="fg-a on"/>
<text x="275" y="134" class="fg-t sm acc">給本機</text>
<text x="327" y="110" text-anchor="middle" class="fg-t sm alt">轉送</text>
<rect x="215" y="170" width="100" height="50" rx="6" class="fg-b hot"/>
<text x="265" y="191" text-anchor="middle" class="fg-t mono">INPUT</text>
<text x="265" y="209" text-anchor="middle" class="fg-t sm">進本機前</text>
<line x1="315" y1="195" x2="332" y2="195" class="fg-l on"/><polygon points="340,195 332,190.5 332,199.5" class="fg-a on"/>
<rect x="340" y="170" width="120" height="50" rx="6" class="fg-b"/>
<text x="400" y="191" text-anchor="middle" class="fg-t">本機程式</text>
<text x="400" y="209" text-anchor="middle" class="fg-t sm">nginx、sshd</text>
<line x1="460" y1="195" x2="477" y2="195" class="fg-l"/><polygon points="485,195 477,190.5 477,199.5" class="fg-a"/>
<rect x="485" y="170" width="130" height="50" rx="6" class="fg-b"/>
<text x="550" y="191" text-anchor="middle" class="fg-t mono">OUTPUT</text>
<text x="550" y="209" text-anchor="middle" class="fg-t sm">本機送出的</text>
<line x1="550" y1="170" x2="550" y2="98" class="fg-l"/><polygon points="550,90 545.5,98 554.5,98" class="fg-a"/>
<text x="560" y="134" class="fg-t sm">路由</text>
<text x="350" y="250" text-anchor="middle" class="fg-t sm">綠色：連到本機的 nginx。藍色：連到容器發布的連接埠，DNAT 之後走 FORWARD，完全不經過 INPUT</text>
</svg><figcaption>同樣是「連到這台主機的 6379 埠」，如果是本機程式在聽，封包走綠色那條，經過 INPUT；如果是 Docker 容器發布的連接埠，PREROUTING 先把目的地改成容器的位址，封包就走藍色那條，INPUT 上的規則根本碰不到它。第七節會再回來看這件事。</figcaption></figure>
<p>每個檢查點上，規則又依用途分在幾張「表」裡，同一個檢查點會依固定順序執行各表的規則：</p>
<table>
<tr><th>表</th><th>掛在哪些檢查點</th><th>做什麼</th></tr>
<tr><td>raw</td><td>PREROUTING、OUTPUT</td><td>在連線追蹤之前執行，可以讓某些流量不被追蹤</td></tr>
<tr><td>mangle</td><td>全部</td><td>改封包的標記、TTL 等欄位</td></tr>
<tr><td>nat</td><td>PREROUTING、INPUT、OUTPUT、POSTROUTING</td><td>改位址：進來時改目的地（DNAT），出去時改來源（SNAT）</td></tr>
<tr><td>filter</td><td>INPUT、FORWARD、OUTPUT</td><td>真正決定放行或丟掉，你寫的防火牆規則幾乎都在這裡</td></tr>
</table>
<p>一條鏈（chain）裡的規則<b>由上往下，第一條符合的就決定命運</b>，後面的不再看；全部都不符合，就套用這條鏈的預設政策（policy）。所以「先寫一條 ACCEPT 全部，再寫一條 DROP 某個 IP」，那條 DROP 永遠不會生效。</p>
<h4>iptables、nftables、ufw 是什麼關係</h4>
<p>它們都只是「替 netfilter 寫規則的工具」。<b>iptables</b> 是老牌的指令，用了二十年。<b>nftables</b> 是新一代的框架，語法更一致，一份規則可以同時管 IPv4 和 IPv6，Debian 10、RHEL 8 之後的系統都以它為預設；這些系統上的 <code>iptables</code> 指令，背後常常是一個把舊語法翻譯成 nftables 的相容層（iptables-nft）。<b>ufw</b>（Ubuntu）和 <b>firewalld</b>（RHEL 系列）則是更高一層的簡化介面，最後一樣轉成 netfilter 的規則。同一台機器上混用好幾種工具，是規則互相打架、沒人看得懂的主要原因。</p>

<h3><span class="badge lv2">進階</span>三、用 nftables 寫一份規則，再追一個封包</h3>
<p>一台對外提供 HTTPS、只讓公司網段 SSH 的伺服器，規則可以這樣寫：</p>
<pre><code>table inet filter {
  chain input {
    type filter hook input priority 0; policy drop;
    ct state established,related accept
    ct state invalid drop
    iif "lo" accept
    ip protocol icmp accept
    meta l4proto ipv6-icmp accept           # IPv6 少了它，連鄰居都找不到
    tcp dport { 80, 443 } accept
    ip saddr 203.0.113.0/24 tcp dport 22 accept
    limit rate 5/minute log prefix "nft-drop: "
    counter drop
  }
}</code></pre>
<p>逐行看：<code>inet</code> 代表這張表同時管 IPv4 和 IPv6，上一課提醒的「IPv6 忘了寫規則」就不會發生。<code>policy drop</code> 是預設拒絕。第一條規則讓所有已建立連線的封包直接通過，這是效能的關鍵：絕大多數的封包都屬於已建立的連線，一進來就在第一條放行，不用往下比對。最後兩行把被擋的封包記進日誌（每分鐘最多 5 筆，避免被掃描灌爆日誌），並計數。</p>
<p>現在追幾個封包：</p>
<table>
<tr><th>封包</th><th>conntrack 狀態</th><th>符合哪一條</th><th>結果</th></tr>
<tr><td>198.51.100.7:51234 → :443，SYN</td><td>NEW</td><td><code>tcp dport { 80, 443 }</code></td><td>放行，conntrack 記下一筆</td></tr>
<tr><td>同一條連線後續的 ACK、資料</td><td>ESTABLISHED</td><td>第一條</td><td>放行，只比對了一條</td></tr>
<tr><td>198.51.100.7 → :22，SYN</td><td>NEW</td><td>來源不在 203.0.113.0/24，一路比到底</td><td>記一筆日誌、丟掉。對方看到逾時</td></tr>
<tr><td>某個掃描器送來的孤立 ACK</td><td>INVALID</td><td><code>ct state invalid drop</code></td><td>丟掉</td></tr>
</table>
<h4>丟掉（drop）還是拒絕（reject）</h4>
<p><code>drop</code> 什麼都不回，對方要等到逾時；<code>reject</code> 立刻回一個 TCP RST 或 ICMP 錯誤，對方馬上看到「連線被拒」。對網際網路，用 drop：掃描器得多等，也少透露一點資訊。對內部網路，reject 比較友善：同事的程式連錯連接埠會立刻失敗，而不是卡 30 秒才逾時，排查省很多時間。第 1.4 課那張「被拒和逾時」的表，在這裡找到了來源。</p>
<h4>兩個會讓你半夜被叫醒的事</h4>
<ul>
<li><b>把自己鎖在外面</b>：改遠端主機的規則時，少寫一條 SSH 的放行，一套用就斷線，而且再也連不回去。先用 <code>nft -c -f 檔案</code> 檢查語法；套用前先排好一個幾分鐘後自動還原的排程，確認新規則下 SSH 還連得上，再取消排程。雲端主機至少還有供應商的主控台可以救，實體機就只能跑機房了。</li>
<li><b>連線追蹤表滿了</b>：conntrack 的表有上限（<code>net.netfilter.nf_conntrack_max</code>）。高流量的負載平衡器或閘道，表一滿，核心日誌就會出現 <code>nf_conntrack: table full, dropping packet</code>，新的連線開始被隨機丟掉，症狀看起來像網路不穩。用 <code>conntrack -C</code> 看目前筆數，必要時調高上限、縮短閒置逾時，或在 raw 表讓不需要追蹤的流量跳過追蹤。</li>
</ul>

<h3><span class="badge lv3">專業</span>四、雲端：安全群組與網路 ACL</h3>
<p>雲端的虛擬網路有兩層過濾，分別管不同的範圍：</p>
<figure class="figure"><svg viewBox="0 0 680 262" class="fg" style="width:100%;max-width:680px" role="img" aria-label="封包從網際網路進入 VPC，先在子網路邊界經過無狀態的網路 ACL，再經過圍住主機的有狀態安全群組；回應出去時安全群組自動放行，但網路 ACL 要另外允許高號連接埠">
<rect x="20" y="90" width="100" height="70" rx="6" class="fg-b"/>
<text x="70" y="118" text-anchor="middle" class="fg-t">網際網路</text>
<text x="70" y="138" text-anchor="middle" class="fg-t sm mono">198.51.100.7</text>
<rect x="150" y="14" width="510" height="240" rx="10" class="fg-b dash"/>
<text x="162" y="34" class="fg-t sm">VPC</text>
<rect x="200" y="44" width="440" height="196" rx="8" class="fg-b"/>
<line x1="200" y1="50" x2="200" y2="234" class="fg-l warm"/>
<text x="212" y="64" class="fg-t sm warm">子網路的邊界：網路 ACL（無狀態）</text>
<rect x="450" y="88" width="170" height="96" rx="12" class="fg-l on dash"/>
<rect x="470" y="106" width="130" height="60" rx="6" class="fg-b alt"/>
<text x="535" y="131" text-anchor="middle" class="fg-t">主機</text>
<text x="535" y="151" text-anchor="middle" class="fg-t sm mono">10.0.1.11</text>
<text x="535" y="80" text-anchor="middle" class="fg-t sm alt">② 安全群組：允許 443</text>
<text x="535" y="202" text-anchor="middle" class="fg-t sm acc">安全群組（有狀態）</text>
<text x="535" y="222" text-anchor="middle" class="fg-t sm acc">③ 回應：記得連線，自動放行</text>
<line x1="120" y1="118" x2="462" y2="118" class="fg-l alt"/><polygon points="470,118 462,113.5 462,122.5" class="fg-a alt"/>
<text x="212" y="108" class="fg-t sm">① 網路 ACL 規則 100：允許 TCP 443 進</text>
<line x1="470" y1="148" x2="128" y2="148" class="fg-l on"/><polygon points="120,148 128,143.5 128,152.5" class="fg-a on"/>
<text x="212" y="172" class="fg-t sm warm">④ 網路 ACL 出：要另外寫一條</text>
<text x="212" y="190" class="fg-t sm warm">允許 1024–65535 的回應出去</text>
</svg><figcaption>請求要通過兩道關卡，回應也要。安全群組記得連線，回應自動放行；網路 ACL 不記得，回應要靠另一條規則。忘了第 ④ 條，症狀是「連線建立不起來，但兩邊的規則看起來都對」。</figcaption></figure>
<table>
<tr><th></th><th>安全群組（security group）</th><th>網路 ACL（network ACL）</th></tr>
<tr><td>管的範圍</td><td>每一張網路介面（每台主機、每個負載平衡器）</td><td>整個子網路</td></tr>
<tr><td>狀態</td><td>有狀態，回應自動放行</td><td>無狀態，兩個方向都要寫</td></tr>
<tr><td>規則種類</td><td>只能「允許」</td><td>可以「允許」也可以「拒絕」</td></tr>
<tr><td>規則順序</td><td>沒有順序，全部一起評估，任一條允許就通過</td><td>依編號由小到大，第一條符合的決定</td></tr>
<tr><td>可以引用</td><td>其他安全群組</td><td>只能寫位址範圍</td></tr>
<tr><td>預設</td><td>新建的群組：進全擋、出全開</td><td>預設的 ACL 全開；自己建的 ACL 全擋</td></tr>
</table>
<p>回應用的高號連接埠範圍，依作業系統不同：Linux 預設是 32768 到 60999，Windows 是 49152 到 65535。所以網路 ACL 的出站回應規則通常直接寫 1024 到 65535，涵蓋所有情況。實務上的分工是：<b>安全群組是主要的控制</b>，每個服務的規則都寫在這裡；網路 ACL 留給「整個子網路一刀切」的需求，例如緊急封鎖某個正在攻擊你的位址段，因為只有它能寫「拒絕」。GCP 的 VPC 防火牆規則和 Azure 的網路安全性群組（NSG）也都是有狀態的，差別在它們的規則有優先順序，而且可以寫拒絕。</p>

<h3><span class="badge lv3">專業</span>五、設計分層的規則</h3>
<p>第 5.6 課講過網路分段的概念。落實到安全群組上，核心技巧是<b>讓群組引用群組</b>，而不是寫 IP：</p>
<figure class="figure"><svg viewBox="0 18 680 228" class="fg" style="width:100%;max-width:680px" role="img" aria-label="三層式安全群組：網際網路只能連 sg-lb 的 443，sg-app 只接受 sg-lb 的 8080，sg-db 只接受 sg-app 的 5432；網際網路直接連資料庫沒有任何規則允許">
<rect x="20" y="85" width="90" height="56" rx="6" class="fg-b"/>
<text x="65" y="110" text-anchor="middle" class="fg-t">網際網路</text>
<text x="65" y="128" text-anchor="middle" class="fg-t sm mono">0.0.0.0/0</text>
<rect x="150" y="66" width="140" height="94" rx="8" class="fg-b alt"/>
<text x="220" y="90" text-anchor="middle" class="fg-t mono">sg-lb</text>
<text x="220" y="110" text-anchor="middle" class="fg-t sm">負載平衡器</text>
<text x="220" y="134" text-anchor="middle" class="fg-t sm">進：443</text>
<text x="220" y="150" text-anchor="middle" class="fg-t sm">來源：任何地方</text>
<rect x="340" y="66" width="140" height="94" rx="8" class="fg-b alt"/>
<text x="410" y="90" text-anchor="middle" class="fg-t mono">sg-app</text>
<text x="410" y="110" text-anchor="middle" class="fg-t sm">應用程式</text>
<text x="410" y="134" text-anchor="middle" class="fg-t sm">進：8080</text>
<text x="410" y="150" text-anchor="middle" class="fg-t sm">來源：sg-lb</text>
<rect x="530" y="66" width="130" height="94" rx="8" class="fg-b hot"/>
<text x="595" y="90" text-anchor="middle" class="fg-t mono">sg-db</text>
<text x="595" y="110" text-anchor="middle" class="fg-t sm">資料庫</text>
<text x="595" y="134" text-anchor="middle" class="fg-t sm">進：5432</text>
<text x="595" y="150" text-anchor="middle" class="fg-t sm">來源：sg-app</text>
<line x1="110" y1="113" x2="142" y2="113" class="fg-l on"/><polygon points="150,113 142,108.5 142,117.5" class="fg-a on"/>
<text x="130" y="104" text-anchor="middle" class="fg-t sm acc">443</text>
<line x1="290" y1="113" x2="332" y2="113" class="fg-l on"/><polygon points="340,113 332,108.5 332,117.5" class="fg-a on"/>
<text x="315" y="104" text-anchor="middle" class="fg-t sm acc">8080</text>
<line x1="480" y1="113" x2="522" y2="113" class="fg-l on"/><polygon points="530,113 522,108.5 522,117.5" class="fg-a on"/>
<text x="505" y="104" text-anchor="middle" class="fg-t sm acc">5432</text>
<path d="M65 141 V210 H595 V168" class="fg-l warm dash"/><polygon points="595,160 590.5,168 599.5,168" class="fg-a warm"/>
<text x="330" y="204" text-anchor="middle" class="fg-t warm">✕</text>
<text x="330" y="234" text-anchor="middle" class="fg-t sm warm">從網際網路直接連 5432：沒有任何一條規則允許，丟掉</text>
<text x="340" y="36" text-anchor="middle" class="fg-t sm">機器增減、IP 換掉，規則都不用改：「來源」寫的是群組，不是位址</text>
</svg><figcaption>每一層只接受上一層的連線。應用程式擴充到 30 台，資料庫的規則一個字都不用動，因為它允許的是「sg-app 這個群組裡的任何介面」。</figcaption></figure>
<p>用 Terraform 寫，其中最關鍵的一條長這樣：</p>
<pre><code>resource "aws_vpc_security_group_ingress_rule" "db_from_app" {
  security_group_id            = aws_security_group.db.id
  referenced_security_group_id = aws_security_group.app.id
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
  description                  = "PostgreSQL from app tier only"
}</code></pre>
<p>幾個讓規則多年後還看得懂的原則：</p>
<ul>
<li><b>依角色建群組，不是依機器</b>：「sg-app」「sg-db」，而不是「小明那台的群組」。一台機器可以掛好幾個群組。</li>
<li><b>對 0.0.0.0/0 開放的，只有負載平衡器的 80 和 443</b>。其他任何對全世界開放的規則，都要寫理由，而且定期檢討。別忘了 IPv6 的 <code>::/0</code> 是同一件事的另一半。</li>
<li><b>每條規則都寫 description</b>：誰、為了什麼、哪天加的。三個月後，沒有說明的規則就沒人敢刪。</li>
<li><b>管理用的連線不走公開網路</b>：SSH 改用雲端的工作階段管理服務（例如 AWS Systems Manager 的 Session Manager）或 VPN，22 埠可以完全不開。</li>
<li><b>規則全部寫成程式碼</b>，經過程式碼審查才能改。在主控台上手動加的規則，就是下一次事故的種子。</li>
</ul>

<h3><span class="badge lv3">專業</span>六、出站過濾：入侵者進來之後想做的事，都要往外連</h3>
<p>大部分的團隊只管「誰可以進來」，出站全開。可是攻擊者拿到一台機器之後的每一步，幾乎都需要往外連：下載工具、連回自己的控制伺服器、把資料送出去、在你的機器上挖礦。出站全開，等於門鎖得很緊，窗戶卻全開著。</p>
<p>最經典的例子是 2019 年 Capital One 的資料外洩：攻擊者利用一個設定錯誤的應用程式防火牆做伺服器端請求偽造（SSRF），讓伺服器去連雲端的中繼資料服務 <code>169.254.169.254</code>，拿到那台機器的 IAM 臨時憑證，再用它把大量資料從 S3 下載走。防線有好幾道：應用程式不該能被誘導去連任意網址；中繼資料服務要用 IMDSv2（必須先用 PUT 拿權杖，而且可以限制回應只能走一跳，容器裡多一層就拿不到）；機器的角色權限要最小化；出站流量要有限制。</p>
<h4>怎麼做出站過濾</h4>
<ul>
<li><b>安全群組拿掉預設的「出站全開」</b>，改成明確的清單：應用程式可以連 sg-db 的 5432、Redis 的 6379、內部 DNS。</li>
<li><b>連外部服務走代理</b>：外部的 SaaS、第三方 API 的 IP 常常在變，用 IP 寫規則很難維護。讓所有對外的 HTTPS 都經過一台出站代理（或雲端的網路防火牆服務），依<b>網域名稱</b>做允許清單：只准 <code>api.stripe.com</code>、套件鏡像站、你的監控服務。</li>
<li><b>DNS 也是一條出去的路</b>：攻擊者可以把資料編碼在 DNS 查詢裡送出去。只允許機器用你指定的 DNS 解析器，並在解析器上做過濾和記錄（例如 AWS 的 Route 53 Resolver DNS Firewall）。</li>
<li><b>別忘了機器本身需要的</b>：作業系統更新、時間同步（NTP，UDP 123）、DNS。規則一收緊，這幾樣最常被誤殺。</li>
</ul>
<p>主機層也可以加一層。例如只允許應用程式主機連資料庫網段、內部 DNS 和出站代理：</p>
<pre><code>chain output {
  type filter hook output priority 0; policy drop;
  ct state established,related accept
  oif "lo" accept
  ip daddr 10.0.0.2 udp dport 53 accept          # 內部 DNS
  ip daddr 10.0.2.0/24 tcp dport 5432 accept     # 資料庫網段
  ip daddr 10.0.9.10 tcp dport 3128 accept       # 出站代理
  limit rate 5/minute log prefix "nft-out-drop: "
}</code></pre>
<p>出站被擋的日誌，是品質非常高的警訊：正常的應用程式不會突然想連一個陌生的國外 IP。</p>

<h3><span class="badge lv4">專家</span>七、Docker 和 Kubernetes 怎麼改寫你的防火牆</h3>
<p>上一課說「在 Linux 上，Docker 發布的連接埠會繞過 ufw」。現在你看得懂為什麼了：</p>
<figure class="figure"><svg viewBox="0 0 680 262" class="fg" style="width:100%;max-width:680px" role="img" aria-label="外面連到主機 6379 的封包，在 PREROUTING 被 Docker 的 DNAT 改成容器位址，接著走 FORWARD 鏈，先經過 DOCKER-USER 再經過 Docker 自己的規則到容器；ufw 的規則在 INPUT 鏈，完全不會經過">
<rect x="20" y="118" width="110" height="56" rx="6" class="fg-b"/>
<text x="75" y="141" text-anchor="middle" class="fg-t">外面的封包</text>
<text x="75" y="160" text-anchor="middle" class="fg-t sm mono">→ 主機:6379</text>
<line x1="130" y1="146" x2="152" y2="146" class="fg-l"/><polygon points="160,146 152,141.5 152,150.5" class="fg-a"/>
<rect x="160" y="112" width="140" height="68" rx="6" class="fg-b"/>
<text x="230" y="134" text-anchor="middle" class="fg-t mono">PREROUTING</text>
<text x="230" y="152" text-anchor="middle" class="fg-t sm">Docker 的 DNAT</text>
<text x="230" y="170" text-anchor="middle" class="fg-t sm mono">→ 172.17.0.2:6379</text>
<path d="M230 112 V48 H332" class="fg-l dim dash"/><polygon points="340,48 332,43.5 332,52.5" class="fg-a"/>
<text x="240" y="84" class="fg-t sm warm">不經過</text>
<rect x="340" y="20" width="160" height="56" rx="6" class="fg-b dash"/>
<text x="420" y="43" text-anchor="middle" class="fg-t mono">INPUT</text>
<text x="420" y="62" text-anchor="middle" class="fg-t sm">ufw 的規則都在這裡</text>
<line x1="300" y1="160" x2="332" y2="160" class="fg-l alt"/><polygon points="340,160 332,155.5 332,164.5" class="fg-a alt"/>
<rect x="340" y="96" width="160" height="128" rx="8" class="fg-b alt"/>
<text x="420" y="116" text-anchor="middle" class="fg-t mono">FORWARD</text>
<rect x="352" y="128" width="136" height="40" rx="5" class="fg-b hot"/>
<text x="420" y="144" text-anchor="middle" class="fg-t sm mono">DOCKER-USER</text>
<text x="420" y="161" text-anchor="middle" class="fg-t sm acc">你的規則放這裡</text>
<rect x="352" y="176" width="136" height="36" rx="5" class="fg-b"/>
<text x="420" y="199" text-anchor="middle" class="fg-t sm">Docker 自己的規則</text>
<line x1="500" y1="160" x2="522" y2="160" class="fg-l alt"/><polygon points="530,160 522,155.5 522,164.5" class="fg-a alt"/>
<rect x="530" y="130" width="130" height="60" rx="6" class="fg-b"/>
<text x="595" y="154" text-anchor="middle" class="fg-t">Redis 容器</text>
<text x="595" y="173" text-anchor="middle" class="fg-t sm mono">172.17.0.2:6379</text>
<text x="340" y="250" text-anchor="middle" class="fg-t sm">修法一：只綁本機 -p 127.0.0.1:6379:6379。修法二：在 DOCKER-USER 裡寫規則</text>
</svg><figcaption>Docker 在 PREROUTING 把目的地改成容器的位址，封包就變成「要轉給別人的」，走 FORWARD 而不是 INPUT。ufw 把你的規則寫在 INPUT，所以你以為關掉的 6379，從外面照樣連得到。</figcaption></figure>
<p>具體來說，你執行 <code>docker run -p 6379:6379 redis</code> 時，Docker 會在 nat 表加一條 DNAT 規則，把所有「目的埠 6379」的封包改送給容器，並在 FORWARD 鏈放行它們。<code>-p 6379:6379</code> 的預設綁定位址是 0.0.0.0，也就是所有網路介面。三種修法：</p>
<ul>
<li><b>只綁本機</b>：<code>-p 127.0.0.1:6379:6379</code>。只有同一台機器的程式連得到，最簡單也最可靠。只給其他容器用的服務，根本不需要發布連接埠，同一個 Docker 網路裡用容器名稱就連得到。</li>
<li><b>寫在 DOCKER-USER 鏈</b>：這是 Docker 官方保留給使用者的鏈，在 Docker 自己的規則之前執行，Docker 重啟也不會清掉。注意封包到這裡時目的地已經被改成容器位址，所以要比對「原本的」目的埠：<code>iptables -I DOCKER-USER -i eth0 ! -s 203.0.113.0/24 -p tcp -m conntrack --ctorigdstport 6379 -j DROP</code>。</li>
<li><b>靠雲端的安全群組</b>：安全群組在主機外面，Docker 改不到它。這也是為什麼「三層防禦」裡雲端那一層這麼重要。</li>
</ul>
<p>另外兩個副作用：Docker 會打開核心的 IP 轉送，並把 FORWARD 鏈的預設政策改成 DROP，同一台主機上的虛擬機或其他需要轉送的服務可能因此突然不通。用 <code>--network host</code> 跑的容器則沒有 DNAT，直接用主機的網路，ufw 的規則對它照常有效。</p>
<h4>Kubernetes：kube-proxy 與 NetworkPolicy</h4>
<p>Kubernetes 的 Service 也是靠 netfilter 實現的。kube-proxy 在 iptables 模式下，替每個 Service 建一串鏈：<code>KUBE-SERVICES</code> 依 Service 的虛擬 IP 跳到 <code>KUBE-SVC-…</code>，再用隨機機率規則挑一個 <code>KUBE-SEP-…</code>，最後 DNAT 到某個 Pod。一個有幾千個 Service 的叢集，iptables 規則可以多到數萬條，這也是 IPVS 模式、較新的 nftables 模式，以及 Cilium 這類用 eBPF 取代 kube-proxy 的方案出現的原因。</p>
<p>維運上要記住兩件事。第一，NodePort 類型的 Service 會在<b>每一個節點</b>上開 30000 到 32767 範圍裡的某個連接埠，主機防火牆和安全群組要決定誰連得到這個範圍。第二，Pod 之間的流量預設全部互通，要限制得靠 <b>NetworkPolicy</b>，而且它只有在網路外掛（CNI）支援時才會生效，Calico、Cilium 支援，單獨的 flannel 不支援，寫了也沒作用。最常見的起手式是一份「全擋」，再逐一開放：</p>
<pre><code>apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: game
spec:
  podSelector: {}                  # 這個命名空間裡的所有 Pod
  policyTypes: ["Ingress", "Egress"]</code></pre>
<p>套上這份之後，連 DNS 查詢都會被擋，所以下一份通常是「允許所有 Pod 連 kube-system 裡的 DNS 的 53 埠」，接著才是「允許 api 連 postgres 的 5432」這種業務規則。</p>

<h3><span class="badge lv4">專家</span>八、從防守方看掃描</h3>
<p>你的公開 IP 每天都在被掃。像 masscan 這樣的工具，號稱以每秒一千萬個封包的速度，幾分鐘內就能把整個 IPv4 網際網路的某一個連接埠掃完；Shodan、Censys 這類服務則不間斷地掃描全世界，把每台主機開了哪些連接埠、回了什麼橫幅（banner）建成可以搜尋的資料庫。攻擊者不需要掃你，只要上去搜「開著 6379、沒設密碼的 Redis」。</p>
<p>掃描器判斷一個連接埠的方法很簡單，送一個 SYN，看回什麼：</p>
<figure class="figure"><svg viewBox="0 0 680 244" class="fg" style="width:100%;max-width:680px" role="img" aria-label="三種掃描結果：回 SYN-ACK 是開著，回 RST 是關著，什麼都沒回是被防火牆過濾">
<text x="150" y="16" text-anchor="middle" class="fg-t sm">掃描器</text>
<text x="440" y="16" text-anchor="middle" class="fg-t sm">你的主機</text>
<line x1="150" y1="24" x2="150" y2="232" class="fg-l dim"/>
<line x1="440" y1="24" x2="440" y2="232" class="fg-l dim"/>
<text x="20" y="54" class="fg-t">開著</text>
<text x="20" y="70" class="fg-t sm mono">open</text>
<line x1="150" y1="44" x2="432" y2="44" class="fg-l alt"/><polygon points="440,44 432,39.5 432,48.5" class="fg-a alt"/>
<text x="295" y="38" text-anchor="middle" class="fg-t sm mono">SYN</text>
<line x1="440" y1="66" x2="158" y2="66" class="fg-l on"/><polygon points="150,66 158,61.5 158,70.5" class="fg-a on"/>
<text x="295" y="82" text-anchor="middle" class="fg-t sm mono acc">SYN-ACK</text>
<text x="460" y="54" class="fg-t">有程式在聽</text>
<text x="460" y="72" class="fg-t sm">從外面看得到，要確定是故意開的</text>
<text x="20" y="124" class="fg-t">關著</text>
<text x="20" y="140" class="fg-t sm mono">closed</text>
<line x1="150" y1="114" x2="432" y2="114" class="fg-l alt"/><polygon points="440,114 432,109.5 432,118.5" class="fg-a alt"/>
<text x="295" y="108" text-anchor="middle" class="fg-t sm mono">SYN</text>
<line x1="440" y1="136" x2="158" y2="136" class="fg-l warm"/><polygon points="150,136 158,131.5 158,140.5" class="fg-a warm"/>
<text x="295" y="152" text-anchor="middle" class="fg-t sm mono warm">RST</text>
<text x="460" y="124" class="fg-t">主機在，沒人聽</text>
<text x="460" y="142" class="fg-t sm">對方看到「連線被拒」</text>
<text x="20" y="194" class="fg-t">被過濾</text>
<text x="20" y="210" class="fg-t sm mono">filtered</text>
<line x1="150" y1="194" x2="322" y2="194" class="fg-l alt"/><polygon points="330,194 322,189.5 322,198.5" class="fg-a alt"/>
<text x="240" y="188" text-anchor="middle" class="fg-t sm mono">SYN</text>
<line x1="336" y1="180" x2="336" y2="210" class="fg-l warm"/>
<text x="346" y="214" class="fg-t sm warm">防火牆丟掉</text>
<text x="460" y="194" class="fg-t">什麼都沒回</text>
<text x="460" y="212" class="fg-t sm">對方只能等到逾時</text>
</svg><figcaption>這三種結果，就是第 1.4 課「成功、被拒、逾時」從掃描器那一側看到的樣子。防守的目標很簡單：從外面看，除了你故意開的，其他全部都是「被過濾」。</figcaption></figure>
<h4>自己掃自己</h4>
<p>從<b>外面</b>（家裡、手機熱點、另一個雲端區域的機器）掃你自己的公開 IP，看到的才是攻擊者看到的：</p>
<pre><code># 全部 65,535 個 TCP 埠，不先 ping（很多主機不回 ping）
sudo nmap -sS -Pn -p- --open 203.0.113.10

# 最常見的 UDP 服務（UDP 掃描很慢，先掃常見的）
sudo nmap -sU --top-ports 50 203.0.113.10

# IPv6 要另外掃
sudo nmap -6 -sS -Pn -p- --open 2001:db8::10</code></pre>
<p>再從<b>裡面</b>對照：<code>sudo ss -tulpn</code> 列出主機上每一個在聽的程式和綁定的位址。兩邊一比，就知道哪些服務「在聽，但被防火牆擋住」（很好，但最好連聽都不要聽在 0.0.0.0）、哪些「在聽，而且外面看得到」（每一個都要有理由）。只能掃你自己擁有、或取得書面授權的系統，這一點沒有例外。</p>
<h4>看到掃描，要不要擋</h4>
<p>日誌裡每天幾千筆陌生 IP 的連線嘗試，是網際網路的背景雜訊，一個一個封鎖既做不完、也沒意義，掃描器明天換一個 IP 再來。把力氣花在<b>縮小攻擊面</b>：沒必要對外的全部關掉，必要的保持更新、加上認證。對 SSH 這種會被暴力猜密碼的服務，用 fail2ban 這類工具在失敗次數過多時暫時封鎖來源，可以減少日誌的噪音；但真正的防線是「只允許金鑰登入」，以及「根本不對網際網路開放」。改連接埠號碼、port knocking 這類技巧能減少雜訊，但不能當成安全措施。</p>

<h3><span class="badge lv4">專家</span>九、記錄與稽核：讓規則一年後還看得懂</h3>
<h4>主機上的紀錄</h4>
<p>nftables 的 <code>log</code> 會把被擋的封包寫進核心日誌，用 <code>journalctl -k</code> 或 <code>dmesg</code> 就看得到，一行裡有來源、目的、連接埠、TCP 旗標。兩個原則：一定要加速率限制，否則一次掃描就能灌爆磁碟；用有意義的前綴（<code>nft-drop:</code>、<code>nft-out-drop:</code>），日誌系統才能分類、做警報。每條規則後面的 <code>counter</code> 則讓你知道「這條規則到底有沒有在用」：<code>nft list ruleset</code> 會顯示每條規則累積比對了幾個封包、多少位元組。半年都是 0 的規則，就是可以檢討刪掉的候選。</p>
<h4>雲端的紀錄：VPC 流量日誌</h4>
<p>雲端的安全群組不會自己寫日誌，要開 <b>VPC 流量日誌</b>（flow logs）。AWS 預設格式的一筆紀錄長這樣：</p>
<pre><code>2 123456789012 eni-0a1b2c3d 198.51.100.7 10.0.1.11 51234 22 6 3 180 1730000000 1730000060 REJECT OK</code></pre>
<p>依序是：版本、帳號、網路介面、來源 IP、目的 IP、來源埠、目的埠、協定（6 是 TCP）、封包數、位元組數、開始與結束時間、動作、紀錄狀態。這一筆說的是：198.51.100.7 嘗試連 22 埠，被拒絕了。流量日誌記的是「流量的摘要」，沒有內容，所以量不大，可以長期保存。它最有價值的用途有三個：事故調查時重建「誰在什麼時候連了什麼」；找出「明明開著、卻從來沒有流量」的規則；以及發現不尋常的出站流量。</p>
<h4>稽核：規則會腐爛</h4>
<p>防火牆規則最大的敵人是時間。為了某次除錯臨時開的 22 埠、某個早就離職的合作廠商的 IP、一條寫著「暫時」的 0.0.0.0/0，三年後都還在。對付它的方法：</p>
<ul>
<li><b>規則即程式碼</b>：所有規則都在 Terraform 這類工具裡，改動要經過程式碼審查，審查時問「為什麼」「誰負責」「什麼時候可以拿掉」。</li>
<li><b>偵測漂移</b>：每天在 CI 裡跑一次 <code>terraform plan</code>，有人在主控台手動改了規則，計畫就不會是空的，立刻通知。</li>
<li><b>自動檢查</b>：雲端的設定檢查服務（例如 AWS Config 的規則、各家的安全態勢服務）可以持續掃描「22 埠對全世界開放」「資料庫的安全群組允許 0.0.0.0/0」這類設定，一出現就警報。</li>
<li><b>定期從外面掃</b>：把第八節的 nmap 排成每週一次，結果跟上一次比，有新出現的連接埠就通知。這是最後一道、也是最誠實的檢查：它不管你的規則寫了什麼，只看實際上連不連得到。</li>
</ul>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>有防火牆就安全了</td><td>防火牆只決定誰連得到。連得到的服務本身有漏洞、沒設密碼，防火牆擋不了。</td></tr>
<tr><td>ufw 顯示 6379 是關的，外面就連不到</td><td>Docker 發布的連接埠走 FORWARD，不經過 ufw 的 INPUT 規則。要從外面實際掃一次。</td></tr>
<tr><td>只要管進來的流量就好</td><td>入侵之後的每一步都要往外連。出站過濾能大幅限制損害。</td></tr>
<tr><td>網路 ACL 和安全群組是一樣的東西</td><td>一個無狀態、管子網路、可以拒絕；一個有狀態、管介面、只能允許。</td></tr>
<tr><td>規則越多越安全</td><td>規則越多越沒人看得懂，衝突和漏洞藏在裡面。少而明確、全部有說明，才安全。</td></tr>
<tr><td>Kubernetes 的 Pod 預設彼此隔離</td><td>預設全部互通。要 NetworkPolicy，而且網路外掛要支援。</td></tr>
<tr><td>IPv4 擋了，IPv6 也就擋了</td><td>兩套協定，規則要各自寫，或用 nftables 的 inet 表一次管兩個。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>前端（Vue、TypeScript）</b>：本機開發伺服器（Vite 之類）預設只聽 localhost；加上 <code>--host</code> 讓手機測試時，整個區網，包括咖啡店的 Wi-Fi，都連得到你的開發伺服器。用完就關。</li>
<li><b>遊戲（Cocos、Unity）</b>：遊戲伺服器若用 UDP，安全群組要開對應的 UDP 埠，而且 UDP 沒有連線，掃描結果常是「開著或被過濾，分不出來」，要用自己的用戶端實測。管理後台、GM 工具永遠不要跟遊戲埠放在一起對外開。</li>
<li><b>後端（Node.js、Go）</b>：程式預設聽 <code>0.0.0.0</code> 還是 <code>127.0.0.1</code>，是防火牆之外最後一道防線；只給本機用的管理端點、除錯端點、指標端點，綁在 127.0.0.1 或內部介面。</li>
<li><b>Docker 與雲端伺服器</b>：<code>docker run -p</code> 習慣性寫成 <code>127.0.0.1:</code> 開頭；資料庫、Redis 只用 Docker 網路內部的名稱連；安全群組用群組引用群組；每週從外面掃一次自己。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<p>這幾題在 DevOps、SRE、資安面試裡都很常見。先自己講一遍，再看參考答案。</p>
<ol>
<li>「有狀態和無狀態的防火牆差在哪？為什麼無狀態的規則比較難寫？」</li>
<li>「一個封包進到 Linux 主機，會經過 netfilter 的哪些檢查點？DNAT 和 SNAT 分別在哪裡做？」</li>
<li>「AWS 的安全群組和網路 ACL 差在哪？各自在什麼情況用？」</li>
<li>「主機上 ufw 已經擋了 6379，為什麼外面還是連得到 Docker 裡的 Redis？怎麼修？」</li>
<li>「為什麼要做出站過濾？你會怎麼設計？」</li>
<li>「你怎麼確認一台對外的伺服器，只開了該開的連接埠？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>有狀態的防火牆用連線追蹤記住每條連線，回應封包只要屬於已建立的連線就自動放行，所以只要寫「誰可以發起連線」。無狀態的過濾器逐一判斷每個封包，不知道它是不是某個請求的回應，因此兩個方向都要寫規則；為了讓回應進來，常得放行一大段高號連接埠，等於開了一個可被利用的洞。</li>
<li>進來的封包先經過 PREROUTING（連線追蹤開始、DNAT 在這裡改目的地），接著路由決定：給本機的走 INPUT 到本機程式，要轉送的走 FORWARD，再經過 POSTROUTING（SNAT 或偽裝來源）出去。本機程式送出的封包走 OUTPUT，再經過 POSTROUTING。過濾規則主要在 filter 表的 INPUT、FORWARD、OUTPUT。</li>
<li>安全群組掛在網路介面上、有狀態、只能允許、所有規則一起評估、可以引用其他群組，是主要的存取控制。網路 ACL 掛在子網路上、無狀態、有編號順序、可以允許也可以拒絕，回應要另外放行高號連接埠。日常規則寫在安全群組；需要對整個子網路一刀切地拒絕某些位址段時用網路 ACL。</li>
<li>Docker 發布連接埠時，在 nat 表的 PREROUTING 做 DNAT，把封包的目的地改成容器的位址，封包就走 FORWARD 而不是 INPUT；ufw 的規則在 INPUT，根本碰不到它。修法：只綁本機（<code>-p 127.0.0.1:6379:6379</code>），或只給其他容器用時乾脆不發布；需要限制來源時，把規則寫在 Docker 保留的 DOCKER-USER 鏈，比對原始目的埠；並用雲端的安全群組在主機外面再擋一層。</li>
<li>攻擊者入侵後下載工具、連回控制伺服器、外洩資料、挖礦，都需要往外連；SSRF 也常被用來連內部的中繼資料服務。設計：安全群組移除預設的出站全開，只允許必要的內部目的地；對外部服務的 HTTPS 經過出站代理，依網域名稱做允許清單；限制 DNS 只能用指定的解析器並記錄；中繼資料服務用 IMDSv2；記錄並警報被擋的出站流量。</li>
<li>從外部網路用 nmap 對公開 IP 做全連接埠掃描（TCP 全部、UDP 常見的、IPv4 和 IPv6 都要），對照主機上 <code>ss -tulpn</code> 列出的監聽程式，以及安全群組的規則。每個從外面看得到的連接埠都要有理由；把外部掃描排程化，結果和上次比較，有新的連接埠就警報；規則用程式碼管理並偵測漂移。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>下面這段 nftables 規則有什麼問題？<pre><code>chain input {
  type filter hook input priority 0; policy drop;
  tcp dport 22 accept
  tcp dport { 80, 443 } accept
  ip saddr 192.0.2.99 drop
}</code></pre></li>
<li>你的應用程式要呼叫外部 API（HTTPS）。如果子網路的網路 ACL 只寫了「出：允許 443」「進：允許 443」，呼叫會成功嗎？為什麼？要怎麼改？</li>
<li>用 <code>docker run -d -p 5432:5432 postgres</code> 啟動了一個資料庫，主機上的 ufw 只允許 22、80、443。從外面掃這台主機，5432 會是什麼狀態？給出兩種修法。</li>
<li>替一個「負載平衡器 → 應用程式 → PostgreSQL ＋ Redis」的系統，寫出每個安全群組的進站和出站規則（用群組引用）。應用程式還需要呼叫一個外部的金流 API。</li>
<li>在一台你自己的 Linux 測試機上，用 <code>ss -tulpn</code> 列出所有監聽中的程式，再從另一台機器用 nmap 掃它。把兩邊的結果做成一張對照表，標出「只在裡面看得到」和「外面也看得到」的連接埠。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>問題至少四個：沒有 <code>ct state established,related accept</code>，主機自己往外連的回應會被擋，連 DNS 查詢都會失敗；沒有放行 <code>lo</code>，本機程式彼此連不上；22 埠對全世界開放；最後那條封鎖 192.0.2.99 的規則放在最後，如果那個位址連的是 22 或 443，前面的規則已經放行了，它永遠不會生效，封鎖規則要放在放行規則之前。另外，它沒有放行 ICMP，路徑 MTU 探索會出問題；IPv6 也需要放行 ICMPv6。</li>
<li>不會成功。網路 ACL 是無狀態的：請求從你的高號連接埠出去、目的埠 443，符合「出：443」嗎？出站規則比對的是目的埠，所以可以出去；但回應是從對方的 443 回到你的高號連接埠，進站時目的埠是 32768 到 60999 之間的某個值，不符合「進：允許 443」，被擋。要加一條「進：允許 TCP 1024–65535」（理想上限定來源埠 443）。同理，對外提供 443 服務時，也要有「出：允許 1024–65535」讓回應出去。</li>
<li>會是 open，外面連得到。Docker 的 DNAT 讓封包走 FORWARD，不經過 ufw 的 INPUT 規則。修法一：改成 <code>-p 127.0.0.1:5432:5432</code>，或應用程式也在 Docker 網路裡時乾脆不發布；修法二：在 DOCKER-USER 鏈加規則，丟掉來自外部介面、原始目的埠是 5432 的封包；再加上雲端安全群組不開 5432。</li>
<li>sg-lb：進 443 來自 0.0.0.0/0 和 ::/0；出 8080 到 sg-app。sg-app：進 8080 來自 sg-lb；出 5432 到 sg-db、6379 到 sg-redis、53 到內部 DNS，以及 443 到出站代理（或 NAT 加網域允許清單）以呼叫金流 API。sg-db：進 5432 來自 sg-app；出站不需要開放。sg-redis：進 6379 來自 sg-app。管理用的連線走 Session Manager 或 VPN，不開 22。每條規則寫上說明。</li>
<li>典型的發現：資料庫、Redis、指標端點綁在 127.0.0.1，只在裡面看得到，這是好的；sshd、nginx 綁在 0.0.0.0，外面看得到 22、80、443，要確認 22 是否真的需要；常見的意外是開發時忘了關的服務（例如綁在 0.0.0.0 的除錯端點或 Docker 發布的連接埠），裡外都看得到。凡是「外面也看得到」而你說不出理由的，就是要修的項目。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>nftables wiki</b>（<a href="https://wiki.nftables.org/">wiki.nftables.org</a>）：官方的說明文件，從基本語法、表與鏈、連線追蹤到效能調校，範例很完整。</li>
<li><b>Docker 官方文件「Packet filtering and firewalls」</b>（<a href="https://docs.docker.com/engine/network/packet-filtering-firewalls/">docs.docker.com</a>）：Docker 怎麼使用 iptables、DOCKER-USER 鏈的用法，以及跟 ufw、firewalld 的互動。</li>
<li><b>AWS VPC 使用者指南的安全群組與網路 ACL 章節</b>（<a href="https://docs.aws.amazon.com/vpc/">docs.aws.amazon.com/vpc</a>）：兩者的完整比較、連線追蹤的細節、流量日誌的欄位定義。</li>
<li><b>Kubernetes 官方文件「Network Policies」</b>（<a href="https://kubernetes.io/docs/concepts/services-networking/network-policies/">kubernetes.io</a>）：NetworkPolicy 的語法和常見範例，包括預設全擋的寫法。</li>
<li><b>Gordon Lyon《Nmap Network Scanning》</b>（官方網站 <a href="https://nmap.org/book/">nmap.org/book</a> 有大部分內容可免費閱讀）：nmap 作者寫的書，各種掃描技術的原理，以及防守方怎麼看待它們。</li>
</ul>
` });
