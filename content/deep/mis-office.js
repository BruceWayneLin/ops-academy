DEEP({ 'mis-office': `
<p>上一課畫了一條簡單的線：網際網路、防火牆、交換器、無線基地台，再加上幾個 VLAN。這一章把那條線拆開：VLAN 的標籤長什麼樣子、一個訊框怎麼在交換器之間帶著它跑；一間辦公室的網段和防火牆規則實際怎麼切；筆電插上網路線或連上 Wi-Fi 時，802.1X 和 RADIUS 一步一步在談什麼；WPA2、WPA3、企業模式到底差在哪；VPN 和零信任存取怎麼選；DNS 過濾、SaaS 和筆電的備份；印表機、攝影機為什麼是最好打的入口；最後是監控、文件，以及一份 30 人辦公室從零開始的建置清單。</p>

<h3><span class="badge lv1">基礎</span>一、VLAN：同一棟大樓裡的好幾家公司</h3>
<p>想像一棟商辦大樓。電梯、走廊、管線都是共用的，但每一層住的是不同的公司，你的門禁卡只能讓電梯停在你那一層。要去別層，得經過一樓大廳的櫃台登記。<b>虛擬區域網路</b>（VLAN）就是這樣：同一批<b>交換器</b>（switch）和網路線上，跑著好幾個彼此看不到的網路；要從一個網路到另一個，一定要經過「櫃台」，也就是路由器或防火牆。</p>
<p>交換器怎麼知道一個訊框屬於哪一層？靠 IEEE 802.1Q 標準在乙太網路訊框裡插進的 4 個位元組：</p>
<figure class="figure"><svg viewBox="0 0 660 200" class="fg" style="width:100%;max-width:660px" role="img" aria-label="乙太網路訊框的欄位：目的 MAC、來源 MAC、802.1Q 標籤、類型、資料、FCS；標籤再展開成 TPID、PCP、DEI 和 12 位元的 VLAN 編號">
<rect x="20" y="30" width="90" height="46" rx="5" class="fg-b"/><text x="65" y="50" text-anchor="middle" class="fg-t sm">目的 MAC</text><text x="65" y="67" text-anchor="middle" class="fg-t sm">6 位元組</text>
<rect x="110" y="30" width="90" height="46" rx="5" class="fg-b"/><text x="155" y="50" text-anchor="middle" class="fg-t sm">來源 MAC</text><text x="155" y="67" text-anchor="middle" class="fg-t sm">6 位元組</text>
<rect x="200" y="30" width="120" height="46" rx="5" class="fg-b hot"/><text x="260" y="50" text-anchor="middle" class="fg-t sm acc">802.1Q 標籤</text><text x="260" y="67" text-anchor="middle" class="fg-t sm">4 位元組</text>
<rect x="320" y="30" width="70" height="46" rx="5" class="fg-b"/><text x="355" y="50" text-anchor="middle" class="fg-t sm">類型</text><text x="355" y="67" text-anchor="middle" class="fg-t sm">2</text>
<rect x="390" y="30" width="180" height="46" rx="5" class="fg-b"/><text x="480" y="50" text-anchor="middle" class="fg-t sm">資料（IP 封包）</text><text x="480" y="67" text-anchor="middle" class="fg-t sm">46 到 1500</text>
<rect x="570" y="30" width="70" height="46" rx="5" class="fg-b"/><text x="605" y="50" text-anchor="middle" class="fg-t sm">FCS</text><text x="605" y="67" text-anchor="middle" class="fg-t sm">4</text>
<line x1="200" y1="76" x2="100" y2="116" class="fg-l dim dash"/>
<line x1="320" y1="76" x2="560" y2="116" class="fg-l dim dash"/>
<rect x="100" y="116" width="184" height="46" rx="5" class="fg-b alt"/><text x="192" y="136" text-anchor="middle" class="fg-t sm">TPID</text><text x="192" y="153" text-anchor="middle" class="fg-t sm mono">0x8100（16 位元）</text>
<rect x="284" y="116" width="60" height="46" rx="5" class="fg-b"/><text x="314" y="136" text-anchor="middle" class="fg-t sm">PCP</text><text x="314" y="153" text-anchor="middle" class="fg-t sm">3 位元</text>
<rect x="344" y="116" width="40" height="46" rx="5" class="fg-b"/><text x="364" y="136" text-anchor="middle" class="fg-t sm">DEI</text><text x="364" y="153" text-anchor="middle" class="fg-t sm">1</text>
<rect x="384" y="116" width="176" height="46" rx="5" class="fg-b hot"/><text x="472" y="136" text-anchor="middle" class="fg-t sm acc">VID：VLAN 編號</text><text x="472" y="153" text-anchor="middle" class="fg-t sm">12 位元</text>
<text x="330" y="188" text-anchor="middle" class="fg-t sm">12 位元有 4096 種值，可用 1 到 4094；VLAN 20 就是 VID = 0000 0001 0100</text>
</svg><figcaption>標籤插在來源 MAC 和類型欄位之間。TPID 的 0x8100 告訴交換器「後面有標籤」，真正重要的是最後 12 位元的 VLAN 編號；PCP 是語音、視訊這類流量的優先權。</figcaption></figure>
<p>交換器的連接埠有兩種角色：</p>
<ul>
<li><b>Access 埠</b>：接一般裝置（桌機、印表機）。裝置送出的是普通訊框，完全不知道 VLAN 的存在；交換器在收進來時記下「這是 VLAN 10 的」，送出去時再把標籤拿掉。</li>
<li><b>Trunk 埠</b>：接另一台交換器、防火牆或無線基地台。一條線同時跑好幾個 VLAN，每個訊框都帶著標籤，對方才分得出誰是誰。</li>
</ul>
<p>無線基地台通常接在 trunk 埠上：員工 Wi-Fi 的流量貼上 VLAN 10，訪客 Wi-Fi 的貼上 VLAN 20，同一台基地台、同一條線，進了交換器就分道揚鑣。</p>

<h3><span class="badge lv2">進階</span>二、一間辦公室的網路，實際怎麼切</h3>
<p>以一間 30 人的遊戲工作室為例。先寫位址規劃，再接線。第 1.2 課教過怎麼切子網路，這裡每個 VLAN 一個 /24，VLAN 編號直接放進第三段，看到位址就知道是哪一區：</p>
<table>
<tr><th>VLAN</th><th>名稱</th><th>網段</th><th>誰在裡面</th><th>可以連到</th></tr>
<tr><td>10</td><td>員工</td><td>10.10.10.0/24</td><td>通過 802.1X 的公司裝置</td><td>網際網路、印表機、NAS</td></tr>
<tr><td>20</td><td>訪客</td><td>10.10.20.0/24</td><td>訪客、私人手機</td><td>只有網際網路，彼此也不通</td></tr>
<tr><td>40</td><td>印表機</td><td>10.10.40.0/24</td><td>印表機、掃描器</td><td>只有掃描寄信用的郵件服務</td></tr>
<tr><td>50</td><td>伺服器</td><td>10.10.50.0/24</td><td>NAS、內部服務</td><td>更新來源、雲端備份目的地</td></tr>
<tr><td>60</td><td>IoT</td><td>10.10.60.0/24</td><td>攝影機、門禁、會議室電視</td><td>只有各自的錄影主機或廠商雲端</td></tr>
<tr><td>99</td><td>管理</td><td>10.10.99.0/24</td><td>交換器、基地台自己的管理介面</td><td>只接受 MIS 管理機連進來</td></tr>
</table>
<figure class="figure"><svg viewBox="0 0 680 340" class="fg" style="width:100%;max-width:680px" role="img" aria-label="辦公室網路拓撲：兩條對外線路接到防火牆，防火牆用一條 trunk 接到 PoE 交換器，交換器再接到員工桌機、無線基地台、印表機、NAS、攝影機與門禁，各自在不同的 VLAN">
<rect x="150" y="12" width="120" height="32" rx="6" class="fg-b"/><text x="210" y="33" text-anchor="middle" class="fg-t">ISP 光纖</text>
<rect x="410" y="12" width="120" height="32" rx="6" class="fg-b"/><text x="470" y="33" text-anchor="middle" class="fg-t">4G／5G 備援</text>
<path d="M210 44 V60 H280 V68" class="fg-l on"/><polygon points="280,76 275.5,68 284.5,68" class="fg-a on"/>
<text x="204" y="62" text-anchor="end" class="fg-t sm">WAN1</text>
<path d="M470 44 V60 H400 V68" class="fg-l dash"/><polygon points="400,76 395.5,68 404.5,68" class="fg-a"/>
<text x="476" y="62" class="fg-t sm">WAN2</text>
<rect x="200" y="76" width="280" height="48" rx="6" class="fg-b hot"/>
<text x="340" y="96" text-anchor="middle" class="fg-t acc">防火牆：每個 VLAN 的閘道</text>
<text x="340" y="114" text-anchor="middle" class="fg-t sm mono">10.10.10.1、10.10.20.1 …</text>
<line x1="340" y1="124" x2="340" y2="148" class="fg-l alt"/><polygon points="340,156 335.5,148 344.5,148" class="fg-a alt"/>
<text x="350" y="144" class="fg-t sm alt">trunk：所有 VLAN 都帶標籤</text>
<rect x="200" y="156" width="280" height="40" rx="6" class="fg-b alt"/>
<text x="340" y="181" text-anchor="middle" class="fg-t">PoE 交換器</text>
<line x1="340" y1="196" x2="340" y2="222" class="fg-l"/>
<line x1="70" y1="222" x2="620" y2="222" class="fg-l"/>
<line x1="70" y1="222" x2="70" y2="242" class="fg-l"/><polygon points="70,250 65.5,242 74.5,242" class="fg-a"/>
<line x1="180" y1="222" x2="180" y2="242" class="fg-l alt"/><polygon points="180,250 175.5,242 184.5,242" class="fg-a alt"/>
<line x1="290" y1="222" x2="290" y2="242" class="fg-l"/><polygon points="290,250 285.5,242 294.5,242" class="fg-a"/>
<line x1="400" y1="222" x2="400" y2="242" class="fg-l"/><polygon points="400,250 395.5,242 404.5,242" class="fg-a"/>
<line x1="510" y1="222" x2="510" y2="242" class="fg-l"/><polygon points="510,250 505.5,242 514.5,242" class="fg-a"/>
<line x1="620" y1="222" x2="620" y2="242" class="fg-l"/><polygon points="620,250 615.5,242 624.5,242" class="fg-a"/>
<rect x="20" y="250" width="100" height="50" rx="6" class="fg-b"/><text x="70" y="271" text-anchor="middle" class="fg-t">員工桌機</text><text x="70" y="289" text-anchor="middle" class="fg-t sm">VLAN 10</text>
<rect x="130" y="250" width="100" height="50" rx="6" class="fg-b alt"/><text x="180" y="271" text-anchor="middle" class="fg-t">無線基地台</text><text x="180" y="289" text-anchor="middle" class="fg-t sm">trunk 10、20</text>
<rect x="240" y="250" width="100" height="50" rx="6" class="fg-b"/><text x="290" y="271" text-anchor="middle" class="fg-t">印表機</text><text x="290" y="289" text-anchor="middle" class="fg-t sm">VLAN 40</text>
<rect x="350" y="250" width="100" height="50" rx="6" class="fg-b"/><text x="400" y="271" text-anchor="middle" class="fg-t">NAS</text><text x="400" y="289" text-anchor="middle" class="fg-t sm">VLAN 50</text>
<rect x="460" y="250" width="100" height="50" rx="6" class="fg-b warm"/><text x="510" y="271" text-anchor="middle" class="fg-t">攝影機</text><text x="510" y="289" text-anchor="middle" class="fg-t sm">VLAN 60</text>
<rect x="570" y="250" width="100" height="50" rx="6" class="fg-b warm"/><text x="620" y="271" text-anchor="middle" class="fg-t">門禁、電視</text><text x="620" y="289" text-anchor="middle" class="fg-t sm">VLAN 60</text>
<text x="340" y="328" text-anchor="middle" class="fg-t sm">藍色是 trunk 埠，一條線跑好幾個 VLAN；其他都是 access 埠</text>
</svg><figcaption>所有 VLAN 的閘道都在防火牆上，所以任何跨 VLAN 的流量都一定經過防火牆的規則。PoE 交換器直接用網路線替基地台和攝影機供電，少了一堆變壓器。</figcaption></figure>
<p>這種「防火牆用一條 trunk 當所有 VLAN 的閘道」的接法，俗稱 router-on-a-stick。好處是所有跨區流量都會經過防火牆，每一條都能被規則檢查、被記錄。代價是那條線和防火牆的處理能力是瓶頸；大一點的辦公室會改由三層交換器在 VLAN 之間路由，只用存取控制清單（ACL）粗略過濾，把仔細的檢查留給對外的那一層。</p>

<h3><span class="badge lv2">進階</span>三、防火牆分區：三個封包的命運</h3>
<p>每個 VLAN 在防火牆上是一個<b>區域</b>（zone），規則寫成「從哪個區域、到哪個區域、什麼連接埠」。第 1.8 課的原則照用：預設全擋，需要才開，由上往下第一條符合的生效。</p>
<pre><code># 來源區域   目的區域      服務                動作
1  員工       印表機        TCP 9100、631、443  允許
2  員工       伺服器 NAS    TCP 445、443        允許
3  MIS 管理機 管理          TCP 22、443         允許
4  IoT        錄影主機      TCP 554             允許
5  訪客       任何內部區域  任何                拒絕並記錄
6  所有內部   網際網路      任何（DNS 走過濾）  允許
7  任何       任何          任何                拒絕並記錄</code></pre>
<p>追三個封包：</p>
<ol>
<li><b>Amy 的筆電</b> 10.10.10.23 送一份檔案到印表機 10.10.40.5 的 9100 埠。封包到了閘道 10.10.10.1（防火牆），符合第 1 條，放行。印表機的回應因為有狀態的連線追蹤自動放行，不用另寫規則。</li>
<li><b>訪客手機</b> 10.10.20.77 試著掃 10.10.10.0/24。第 5 條擋下並記錄。注意第 5 條必須排在第 6 條之前：如果「所有內部到網際網路允許」寫得太寬（例如寫成「到任何地方」），排在前面就會讓訪客一路通到員工區。</li>
<li><b>攝影機</b> 10.10.60.8 試著連 NAS 10.10.50.10 的 445 埠。沒有任何一條允許，落到第 7 條被擋，留下一筆紀錄。這筆紀錄本身就是警報：一台攝影機沒有任何理由去碰檔案伺服器，它很可能已經被入侵。</li>
</ol>
<h4>訪客隔離要做兩層</h4>
<p>防火牆只管「跨 VLAN」。同一個訪客 VLAN 裡，兩支手機之間的流量根本不經過防火牆，直接在基地台或交換器上就轉過去了。所以訪客 SSID 還要開<b>用戶端隔離</b>（client isolation，有的廠牌叫 AP isolation），讓基地台丟掉同一網段裡裝置對裝置的流量。再加上頻寬上限，避免一位訪客的下載吃掉全公司的對外頻寬。</p>

<h3><span class="badge lv2">進階</span>四、802.1X 與 RADIUS：一步一步</h3>
<p>上一課說，企業模式讓每個人用自己的帳號或憑證上網。這背後是 802.1X，它有三個角色：</p>
<ul>
<li><b>請求者</b>（supplicant）：要連網的筆電。</li>
<li><b>驗證者</b>（authenticator）：交換器的埠，或無線基地台。它自己不做判斷，只負責擋門和傳話。</li>
<li><b>驗證伺服器</b>（authentication server）：通常是 RADIUS 伺服器，例如 FreeRADIUS、Windows 的 NPS，或雲端的 RADIUS 服務。</li>
</ul>
<p>在驗證通過之前，那個埠只放行一種流量：EAP 驗證訊息本身。連 DHCP 都拿不到。</p>
<figure class="figure"><svg viewBox="0 0 680 390" class="fg" style="width:100%;max-width:680px" role="img" aria-label="802.1X 加 EAP-TLS 的流程：基地台問身分，筆電回答，基地台把 EAP 包進 RADIUS 送給伺服器，伺服器與筆電互相出示憑證，伺服器回覆接受並指定 VLAN 10，基地台開門，Wi-Fi 再用四次交握產生加密金鑰">
<rect x="20" y="12" width="160" height="36" rx="6" class="fg-b"/><text x="100" y="35" text-anchor="middle" class="fg-t">筆電（請求者）</text>
<rect x="260" y="12" width="160" height="36" rx="6" class="fg-b"/><text x="340" y="35" text-anchor="middle" class="fg-t">基地台（驗證者）</text>
<rect x="500" y="12" width="160" height="36" rx="6" class="fg-b hot"/><text x="580" y="35" text-anchor="middle" class="fg-t">RADIUS 伺服器</text>
<line x1="100" y1="48" x2="100" y2="380" class="fg-l dim dash"/>
<line x1="340" y1="48" x2="340" y2="380" class="fg-l dim dash"/>
<line x1="580" y1="48" x2="580" y2="380" class="fg-l dim dash"/>
<line x1="340" y1="80" x2="108" y2="80" class="fg-l"/><polygon points="100,80 108,75.5 108,84.5" class="fg-a"/>
<text x="220" y="72" text-anchor="middle" class="fg-t sm">① EAP：請說出身分</text>
<line x1="100" y1="116" x2="332" y2="116" class="fg-l"/><polygon points="340,116 332,111.5 332,120.5" class="fg-a"/>
<text x="220" y="108" text-anchor="middle" class="fg-t sm">② 身分：anonymous</text>
<line x1="340" y1="152" x2="572" y2="152" class="fg-l"/><polygon points="580,152 572,147.5 572,156.5" class="fg-a"/>
<text x="460" y="144" text-anchor="middle" class="fg-t sm">③ 包進 RADIUS（UDP 1812）</text>
<line x1="580" y1="196" x2="108" y2="196" class="fg-l alt"/><polygon points="100,196 108,191.5 108,200.5" class="fg-a alt"/>
<text x="220" y="188" text-anchor="middle" class="fg-t sm alt">④ 伺服器出示憑證</text>
<text x="220" y="214" text-anchor="middle" class="fg-t sm warm">筆電一定要驗這張</text>
<line x1="100" y1="240" x2="572" y2="240" class="fg-l alt"/><polygon points="580,240 572,235.5 572,244.5" class="fg-a alt"/>
<text x="460" y="232" text-anchor="middle" class="fg-t sm alt">⑤ 筆電出示自己的憑證</text>
<text x="220" y="258" text-anchor="middle" class="fg-t sm">憑證由 MDM 事先發好</text>
<line x1="580" y1="284" x2="348" y2="284" class="fg-l on"/><polygon points="340,284 348,279.5 348,288.5" class="fg-a on"/>
<text x="460" y="276" text-anchor="middle" class="fg-t sm acc">⑥ Accept：放進 VLAN 10</text>
<line x1="340" y1="322" x2="108" y2="322" class="fg-l on"/><polygon points="100,322 108,317.5 108,326.5" class="fg-a on"/>
<text x="220" y="314" text-anchor="middle" class="fg-t sm acc">⑦ 開門，拿 DHCP</text>
<line x1="100" y1="360" x2="332" y2="360" class="fg-l"/><polygon points="340,360 332,355.5 332,364.5" class="fg-a"/>
<text x="220" y="352" text-anchor="middle" class="fg-t sm">⑧ Wi-Fi 四次交握</text>
</svg><figcaption>藍色的 ④⑤ 是一整段 TLS 交握，被切成很多個 EAP 訊息來回傳。基地台只是把它們包進 RADIUS 轉送，看不懂內容。真正的判斷，全部在 RADIUS 伺服器上。</figcaption></figure>
<ol>
<li>筆電連上公司 SSID（或插上網路線），基地台用 EAP 問「你是誰」。</li>
<li>筆電回一個<b>外層身分</b>，常常只是 <code>anonymous@example.com</code>，因為這一段還沒加密，不想讓旁人看到真實帳號。</li>
<li>基地台把 EAP 訊息原封不動包進 RADIUS 的 Access-Request，用 UDP 1812 送到 RADIUS 伺服器。基地台和伺服器之間靠一組事先設定的共用密鑰互相認得。</li>
<li>以 <b>EAP-TLS</b> 為例，伺服器出示自己的憑證。筆電要確認它是公司 CA 簽的、而且伺服器名稱對得上。這一步沒做，就會被假基地台騙（第五節）。</li>
<li>筆電出示自己的用戶端憑證。這張憑證是 MDM 在註冊時自動發好的，私鑰在安全晶片裡，使用者根本碰不到。</li>
<li>伺服器檢查憑證有沒有過期、有沒有被撤銷，也可以順便問 MDM 這台裝置是否合規。通過就回 Access-Accept，並附上三個屬性：<code>Tunnel-Type = VLAN</code>、<code>Tunnel-Medium-Type = IEEE-802</code>、<code>Tunnel-Private-Group-ID = 10</code>。這叫<b>動態 VLAN 指派</b>：同一個 SSID，工程師進 VLAN 10，外包進只能上網的 VLAN，由伺服器決定。</li>
<li>基地台開門，把這台裝置放進 VLAN 10，筆電這才發 DHCP 拿到位址。</li>
<li>Wi-Fi 還多一步：RADIUS 在 Accept 裡交給基地台一把由 TLS 交握推導出的主金鑰，筆電自己也算得出同一把；雙方再用四次交握（4-way handshake）產生這次連線專用的加密金鑰。<b>每個人、每次連線的金鑰都不同</b>。</li>
</ol>
<h4>EAP-TLS、PEAP，和沒有 802.1X 的裝置</h4>
<p>另一種常見的方法是 <b>PEAP-MSCHAPv2</b>：在 TLS 通道裡用帳號密碼登入，不用發憑證，設定簡單。它的弱點在用戶端：如果筆電沒有被設定成「只信任公司 CA、只接受這個伺服器名稱」，攻擊者架一台同名的假基地台，就能收到密碼的挑戰回應，再離線破解。所以要嘛用 MDM 把伺服器驗證設死，要嘛直接用 EAP-TLS。印表機、攝影機這種不會講 802.1X 的裝置，通常用 MAC 位址放行（MAC Authentication Bypass，MAB），但 MAC 位址很容易偽造，所以用 MAB 放行的裝置，只能放進權限很小的 VLAN。</p>

<h3><span class="badge lv3">專業</span>五、Wi-Fi 安全：一個離職的人還記得密碼，會怎樣</h3>
<p>比較 Wi-Fi 安全模式，最實用的問題是：一位離職的同事還記得 Wi-Fi 密碼，坐在樓下咖啡廳，他能做什麼？</p>
<figure class="figure"><svg viewBox="0 0 680 246" class="fg" style="width:100%;max-width:680px" role="img" aria-label="三種 Wi-Fi 模式比較：WPA2 個人模式下離職者連得上、能離線猜密碼、還能解開錄到交握的別人流量；WPA3 個人模式連得上但無法離線猜密碼也解不開別人流量；企業模式帳號停用就連不上">
<rect x="10" y="10" width="210" height="226" rx="8" class="fg-b"/>
<text x="115" y="34" text-anchor="middle" class="fg-t lg">WPA2-Personal</text>
<text x="115" y="54" text-anchor="middle" class="fg-t sm">大家共用一組密碼</text>
<rect x="20" y="70" width="190" height="46" rx="5" class="fg-b warm"/><text x="115" y="88" text-anchor="middle" class="fg-t sm">離職者連得上？</text><text x="115" y="106" text-anchor="middle" class="fg-t sm warm">連得上</text>
<rect x="20" y="124" width="190" height="46" rx="5" class="fg-b warm"/><text x="115" y="142" text-anchor="middle" class="fg-t sm">錄到交握能離線猜密碼？</text><text x="115" y="160" text-anchor="middle" class="fg-t sm warm">能</text>
<rect x="20" y="178" width="190" height="46" rx="5" class="fg-b warm"/><text x="115" y="196" text-anchor="middle" class="fg-t sm">能解開別人的流量？</text><text x="115" y="214" text-anchor="middle" class="fg-t sm warm">能，錄到對方的交握就行</text>
<rect x="235" y="10" width="210" height="226" rx="8" class="fg-b"/>
<text x="340" y="34" text-anchor="middle" class="fg-t lg">WPA3-Personal</text>
<text x="340" y="54" text-anchor="middle" class="fg-t sm">共用密碼，但用 SAE 交握</text>
<rect x="245" y="70" width="190" height="46" rx="5" class="fg-b warm"/><text x="340" y="88" text-anchor="middle" class="fg-t sm">離職者連得上？</text><text x="340" y="106" text-anchor="middle" class="fg-t sm warm">連得上</text>
<rect x="245" y="124" width="190" height="46" rx="5" class="fg-b hot"/><text x="340" y="142" text-anchor="middle" class="fg-t sm">錄到交握能離線猜密碼？</text><text x="340" y="160" text-anchor="middle" class="fg-t sm acc">不能</text>
<rect x="245" y="178" width="190" height="46" rx="5" class="fg-b hot"/><text x="340" y="196" text-anchor="middle" class="fg-t sm">能解開別人的流量？</text><text x="340" y="214" text-anchor="middle" class="fg-t sm acc">不能</text>
<rect x="460" y="10" width="210" height="226" rx="8" class="fg-b"/>
<text x="565" y="34" text-anchor="middle" class="fg-t lg">企業模式 802.1X</text>
<text x="565" y="54" text-anchor="middle" class="fg-t sm">每人一組帳號或憑證</text>
<rect x="470" y="70" width="190" height="46" rx="5" class="fg-b hot"/><text x="565" y="88" text-anchor="middle" class="fg-t sm">離職者連得上？</text><text x="565" y="106" text-anchor="middle" class="fg-t sm acc">連不上，帳號已停用</text>
<rect x="470" y="124" width="190" height="46" rx="5" class="fg-b hot"/><text x="565" y="142" text-anchor="middle" class="fg-t sm">錄到交握能離線猜密碼？</text><text x="565" y="160" text-anchor="middle" class="fg-t sm acc">沒有共用密碼可猜</text>
<rect x="470" y="178" width="190" height="46" rx="5" class="fg-b hot"/><text x="565" y="196" text-anchor="middle" class="fg-t sm">能解開別人的流量？</text><text x="565" y="214" text-anchor="middle" class="fg-t sm acc">不能</text>
</svg><figcaption>WPA3 修好了「密碼被離線猜」和「知道密碼就能解別人流量」兩件事，但改不了「共用密碼收不回來」。只有企業模式能把一個人單獨移除。</figcaption></figure>
<ul>
<li><b>WPA2-Personal</b>：加密金鑰由「共用密碼＋雙方的隨機數」算出。攻擊者只要錄到一次四次交握（或從基地台的第一則訊息拿到 PMKID），就能拿回家用顯示卡一秒猜幾十萬組密碼。知道密碼的人錄到別人的交握，還能算出對方的金鑰、解開他的流量。</li>
<li><b>WPA3-Personal</b> 改用 <b>SAE</b>（Simultaneous Authentication of Equals）交握：每猜一次密碼都必須跟基地台真的交手一次，離線猜不了；每次連線的金鑰都是獨立產生的，知道密碼也解不開別人的流量，舊的錄音也不會因為密碼外洩而被解開。它還強制開啟<b>管理訊框保護</b>（Protected Management Frames，802.11w），擋掉偽造「斷線」訊框把人踢下線的攻擊。</li>
<li><b>轉換模式</b>（WPA2／WPA3 混用）是過渡期必要的妥協，但攻擊者可以架一個只講 WPA2 的假基地台，把支援 WPA3 的裝置降級。舊裝置淘汰完，就該關掉。6 GHz 頻段（Wi-Fi 6E 以後）規定只能用 WPA3。</li>
<li><b>訪客網路</b>可以用 <b>OWE</b>（Wi-Fi Certified Enhanced Open）：不用密碼，但每個人跟基地台之間的流量仍然加密，比完全開放的咖啡廳 Wi-Fi 好。</li>
</ul>
<p>結論：員工網路用企業模式，最好是 EAP-TLS；訪客網路用 WPA3-Personal 或 OWE，密碼定期換，而且只通往網際網路。</p>

<h3><span class="badge lv3">專業</span>六、遠端存取：VPN 與零信任</h3>
<figure class="figure"><svg viewBox="0 0 680 300" class="fg" style="width:100%;max-width:680px" role="img" aria-label="上半部是傳統 VPN：遠端筆電連進對外開著連接埠的 VPN 閘道，之後整個辦公室網路都看得到；下半部是零信任存取：筆電只連到存取代理，代理問身分提供者並檢查裝置，辦公室裡的連接器主動往外連，只開放被授權的 Git 伺服器">
<text x="20" y="26" class="fg-t sm warm">傳統 VPN：進門之後，整個網路都看得到</text>
<rect x="20" y="44" width="110" height="40" rx="6" class="fg-b"/><text x="75" y="69" text-anchor="middle" class="fg-t">遠端筆電</text>
<line x1="130" y1="64" x2="202" y2="64" class="fg-l"/><polygon points="210,64 202,59.5 202,68.5" class="fg-a"/>
<text x="168" y="56" text-anchor="middle" class="fg-t sm">連進來</text>
<rect x="210" y="40" width="130" height="48" rx="6" class="fg-b warm"/><text x="275" y="60" text-anchor="middle" class="fg-t">VPN 閘道</text><text x="275" y="78" text-anchor="middle" class="fg-t sm">對外開著連接埠</text>
<line x1="340" y1="64" x2="412" y2="64" class="fg-l warm"/><polygon points="420,64 412,59.5 412,68.5" class="fg-a warm"/>
<text x="380" y="56" text-anchor="middle" class="fg-t sm warm">全部放行</text>
<rect x="420" y="36" width="240" height="88" rx="8" class="fg-b"/>
<rect x="432" y="46" width="100" height="28" rx="4" class="fg-b warm"/><text x="482" y="65" text-anchor="middle" class="fg-t sm">NAS</text>
<rect x="548" y="46" width="100" height="28" rx="4" class="fg-b warm"/><text x="598" y="65" text-anchor="middle" class="fg-t sm">印表機</text>
<rect x="432" y="84" width="100" height="28" rx="4" class="fg-b warm"/><text x="482" y="103" text-anchor="middle" class="fg-t sm">Git 伺服器</text>
<rect x="548" y="84" width="100" height="28" rx="4" class="fg-b warm"/><text x="598" y="103" text-anchor="middle" class="fg-t sm">攝影機</text>
<line x1="20" y1="144" x2="660" y2="144" class="fg-l dim dash"/>
<text x="20" y="168" class="fg-t sm acc">零信任存取：每一次、每一個應用程式，都重新檢查</text>
<rect x="20" y="190" width="110" height="40" rx="6" class="fg-b"/><text x="75" y="215" text-anchor="middle" class="fg-t">遠端筆電</text>
<line x1="130" y1="210" x2="202" y2="210" class="fg-l on"/><polygon points="210,210 202,205.5 202,214.5" class="fg-a on"/>
<text x="168" y="202" text-anchor="middle" class="fg-t sm acc">只要 Git</text>
<rect x="210" y="182" width="150" height="56" rx="6" class="fg-b hot"/><text x="285" y="205" text-anchor="middle" class="fg-t acc">存取代理</text><text x="285" y="224" text-anchor="middle" class="fg-t sm">問 IdP＋檢查裝置</text>
<rect x="440" y="176" width="220" height="114" rx="8" class="fg-b"/>
<rect x="452" y="190" width="90" height="30" rx="4" class="fg-b alt"/><text x="497" y="210" text-anchor="middle" class="fg-t sm">連接器</text>
<rect x="556" y="190" width="92" height="30" rx="4" class="fg-b hot"/><text x="602" y="210" text-anchor="middle" class="fg-t sm">Git 伺服器</text>
<rect x="452" y="232" width="90" height="30" rx="4" class="fg-b"/><text x="497" y="252" text-anchor="middle" class="fg-t sm">NAS 看不到</text>
<rect x="556" y="232" width="92" height="30" rx="4" class="fg-b"/><text x="602" y="252" text-anchor="middle" class="fg-t sm">攝影機看不到</text>
<line x1="452" y1="205" x2="368" y2="205" class="fg-l alt"/><polygon points="360,205 368,200.5 368,209.5" class="fg-a alt"/>
<text x="406" y="197" text-anchor="middle" class="fg-t sm alt">主動往外連</text>
<line x1="542" y1="205" x2="548" y2="205" class="fg-l on"/><polygon points="556,205 548,200.5 548,209.5" class="fg-a on"/>
<text x="550" y="281" text-anchor="middle" class="fg-t sm acc">辦公室不開任何對外連接埠</text>
</svg><figcaption>VPN 檢查一次，之後你就是「內網的人」。零信任存取每一次都問「這個人、這台裝置、這個應用程式」，而且辦公室端的連接器是往外連的，外面根本掃不到入口。</figcaption></figure>
<p><b>傳統 VPN</b>（IPsec、OpenVPN、WireGuard，或防火牆內建的 SSL VPN）讓遠端筆電變成辦公室網路的一部分。兩個問題：第一，連進來之後通常什麼都連得到，一台中毒的遠端筆電就是一台在辦公室裡的中毒電腦；第二，VPN 閘道必須對網際網路開一個連接埠，而這種設備是攻擊者最愛的目標，這幾年 Fortinet、Ivanti、Citrix 等廠牌的 VPN 設備，都出過被大規模利用的漏洞，往往修補檔還沒出來就已經被打。</p>
<p><b>零信任存取</b>（zero-trust network access，ZTNA）的想法來自 Google 的 BeyondCorp，NIST SP 800-207 把它寫成了架構：不信任「在內網」這件事，每次存取都依身分和裝置狀態決定，而且只開放被授權的那一個應用程式。實作上有兩種常見形態：</p>
<ul>
<li><b>身分感知代理</b>：Cloudflare Access、Google 的 IAP 這類。內部服務前面放一個代理，使用者用瀏覽器連過去，代理先用 SSO 加條件式存取檢查，再轉送。辦公室裡跑一個連接器（例如 <code>cloudflared</code>）主動往外連到代理，所以防火牆不用開任何進站規則。</li>
<li><b>以身分控管的網狀 VPN</b>：Tailscale 這類，底層是 WireGuard，但每一條連線都受「誰、哪台裝置、能連哪台機器的哪個連接埠」的規則控制，規則跟著 IdP 的群組走。</li>
</ul>
<p>它們的代價是設定變多：每個應用程式都要被「登記」一次，老舊的、不走 HTTP 的系統比較難接。實務上常見的過渡是：網頁類的內部工具先搬到身分感知代理後面，SSH 和資料庫用網狀 VPN，最後才把傳統 VPN 關掉。</p>

<h3><span class="badge lv3">專業</span>七、DNS 過濾：最便宜的一道防線</h3>
<p>幾乎每一次連線都從一次 DNS 查詢開始：釣魚頁、惡意程式下載點、資訊竊取程式回報資料的伺服器，都有網域名稱。<b>DNS 過濾</b>就是在解析器那一層，對已知惡意、剛註冊幾天、或不允許的分類的網域，回一個「封鎖頁」的位址，而不是真的位址。</p>
<p>走一次：Amy 點了信裡的連結 <code>invoice-portal-login.example</code>（假設這個網域兩天前才註冊）。她的筆電向 DHCP 發的解析器 10.10.10.1 查詢，防火牆把查詢轉給公司的過濾服務。過濾服務的情資顯示這是新註冊的網域、而且出現在釣魚清單上，於是回傳封鎖頁的位址，並留下一筆「Amy 的筆電、幾點幾分、查了什麼」的紀錄。釣魚頁根本沒載入。事後這份 DNS 日誌也是調查的金礦：哪幾台機器查過那個網域，一查就知道。</p>
<p>要讓它真的有用，得堵住幾條繞路：</p>
<ul>
<li>防火牆擋掉往外的 53 埠與 853 埠（DNS over TLS），只允許公司的解析器出去，避免有人自己把 DNS 設成別的。</li>
<li>瀏覽器內建的 DNS over HTTPS 會直接繞過公司解析器。用 MDM 下瀏覽器政策關掉，例如 Chrome 的 <code>DnsOverHttpsMode</code>；Firefox 會檢查一個「信號網域」<code>use-application-dns.net</code>，公司解析器讓它查不到，Firefox 就不會自動開啟。</li>
<li>筆電離開辦公室就不經過防火牆了，所以過濾要跟著裝置走：裝代理程式，或用 MDM 推一個指向公司過濾服務的加密 DNS 設定。</li>
</ul>
<p>它擋不住直接用 IP 連線的惡意程式，也擋不住使用者故意繞過。但花費小、效果大，小公司最該先做的就是它。免費的 Quad9（9.9.9.9）就會擋已知惡意網域；Cloudflare Gateway、Cisco Umbrella 這類付費服務多了分類、報表和代理程式。</p>

<h3><span class="badge lv3">專業</span>八、備份：SaaS 和筆電</h3>
<p>第 4.5 課的深入圖解已經把 3-2-1-1-0 拆開講過：三份資料、兩種媒體、一份在異地、一份改不了或離線、還原驗證零錯誤。這裡只談辦公室特有的兩個部分。</p>
<figure class="figure"><svg viewBox="0 0 680 262" class="fg" style="width:100%;max-width:680px" role="img" aria-label="辦公室的 3-2-1-1-0：雲端辦公套件、筆電、NAS 是正本，備份工具用 API 拉出資料，一份放辦公室 NAS 的唯讀快照，一份放異地雲端物件儲存並鎖定不可刪除，每季做還原測試">
<text x="340" y="20" text-anchor="middle" class="fg-t sm">3 份、2 種媒體、1 份異地、1 份改不了、還原 0 錯誤</text>
<rect x="20" y="40" width="190" height="36" rx="5" class="fg-b"/><text x="115" y="63" text-anchor="middle" class="fg-t sm">Microsoft 365／Google</text>
<rect x="20" y="90" width="190" height="36" rx="5" class="fg-b"/><text x="115" y="113" text-anchor="middle" class="fg-t sm">筆電（檔案多半已同步上雲）</text>
<rect x="20" y="140" width="190" height="36" rx="5" class="fg-b"/><text x="115" y="163" text-anchor="middle" class="fg-t sm">NAS 上的共用檔案</text>
<text x="115" y="196" text-anchor="middle" class="fg-t sm">第 1 份：正本本身</text>
<line x1="210" y1="58" x2="230" y2="58" class="fg-l"/>
<line x1="210" y1="108" x2="230" y2="108" class="fg-l"/>
<line x1="210" y1="158" x2="230" y2="158" class="fg-l"/>
<line x1="230" y1="58" x2="230" y2="158" class="fg-l"/>
<line x1="230" y1="108" x2="242" y2="108" class="fg-l"/><polygon points="250,108 242,103.5 242,112.5" class="fg-a"/>
<rect x="250" y="84" width="130" height="48" rx="6" class="fg-b alt"/><text x="315" y="104" text-anchor="middle" class="fg-t">備份工具</text><text x="315" y="122" text-anchor="middle" class="fg-t sm">用 API 拉資料</text>
<line x1="380" y1="108" x2="405" y2="108" class="fg-l"/>
<line x1="405" y1="62" x2="405" y2="152" class="fg-l"/>
<line x1="405" y1="62" x2="422" y2="62" class="fg-l"/><polygon points="430,62 422,57.5 422,66.5" class="fg-a"/>
<line x1="405" y1="152" x2="422" y2="152" class="fg-l on"/><polygon points="430,152 422,147.5 422,156.5" class="fg-a on"/>
<rect x="430" y="40" width="230" height="44" rx="6" class="fg-b"/><text x="545" y="58" text-anchor="middle" class="fg-t">第 2 份：辦公室 NAS</text><text x="545" y="75" text-anchor="middle" class="fg-t sm">另一種媒體、唯讀快照</text>
<rect x="430" y="130" width="230" height="44" rx="6" class="fg-b hot"/><text x="545" y="148" text-anchor="middle" class="fg-t">第 3 份：雲端物件儲存</text><text x="545" y="165" text-anchor="middle" class="fg-t sm">異地＋Object Lock 鎖 30 天</text>
<rect x="20" y="214" width="640" height="38" rx="6" class="fg-b warm"/>
<text x="340" y="238" text-anchor="middle" class="fg-t sm">0：每季挑一個檔案、一個信箱、一台筆電實際還原並計時，結果要是 0 錯誤</text>
</svg><figcaption>正本在 SaaS 裡不代表有備份。第 3 份放在不同帳號、鎖定不可刪除的儲存空間，才能挺過「管理員帳號被盜，攻擊者把備份一起刪掉」這種情況。</figcaption></figure>
<h4>SaaS：供應商保護服務，不保護你的錯</h4>
<p>Microsoft 和 Google 保證的是服務一直在線、機房燒掉也不掉資料。它們不保護的是：管理員刪錯帳號（刪掉的使用者大約只能在 20 到 30 天內救回）、離職員工的信箱被照流程刪除後才發現還需要、勒索軟體把加密過的檔案同步上雲端硬碟、攻擊者用管理員權限刪除資料。回收筒和版本紀錄都有期限和數量上限，它們是「後悔藥」，不是備份。</p>
<p>所以要有第三方備份工具，用 API 把信箱、雲端硬碟、聊天紀錄定期拉出來，放在<b>另一個帳號、另一組憑證</b>管的儲存空間。順手也備份那些常被忘記的東西：程式碼代管平台的 repo 與 issue、密碼管理器的保險庫匯出、DNS 區域檔、身分提供者和防火牆的設定。</p>
<h4>筆電：讓它變得不重要</h4>
<p>最好的筆電備份策略，是讓筆電上沒有不可取代的東西：文件放雲端硬碟、程式碼在 Git、設定靠 MDM 重建。這樣一台筆電壞了，換一台新的、零接觸部署、登入，一個小時就能繼續工作。真正需要備份的只剩少數例外（例如還沒推上去的大型素材），針對那些人設定就好。</p>
<h4>NAS：攻擊者最先找的東西</h4>
<p>勒索軟體集團進來之後，第一件事常常是找備份並刪掉。所以 NAS 的管理員帳號不要跟網域或 IdP 共用、要有自己的 MFA；快照設成唯讀、保留期限內連管理員都刪不掉（有些 NAS 叫不可變快照）；異地那一份用 S3 Object Lock 的合規模式這類機制，在保留期限內任何人（包括你自己的 root 帳號）都無法刪除或覆寫。</p>

<h3><span class="badge lv4">專家</span>九、印表機、攝影機，和交換器上的老把戲</h3>
<h4>為什麼 IoT 是最好打的入口</h4>
<p>這些裝置有共同的特徵：一裝上去就沒人再管，韌體好幾年沒更新，預設帳號密碼常常沒改，裡面跑著一個老舊的網頁管理介面。2016 年的 Mirai 殭屍網路，就是靠一份幾十組預設帳密的清單，掃遍網際網路上的攝影機和路由器，湊出了打癱大型 DNS 服務商的流量。</p>
<ul>
<li><b>攝影機</b>常有「雲端 P2P」功能，會自動往外連到廠商伺服器，讓手機 App 能看畫面；也可能透過 UPnP 叫路由器自動幫它開連接埠。防火牆上關掉 UPnP，攝影機只准連錄影主機，真的需要遠端看，就走錄影主機或零信任存取。</li>
<li><b>印表機</b>存著掃描過的文件，也存著「掃描寄信」「掃描到資料夾」用的帳號密碼。有一種經典手法叫 LDAP 回傳攻擊（pass-back）：攻擊者登進印表機沒改密碼的管理頁，把通訊錄伺服器的位址改成自己的機器，按下「測試連線」，印表機就把存著的帳號密碼送了過去。所以管理頁一定要改密碼，掃描用的帳號要權限最小。</li>
<li><b>會議室電視、門禁、空調控制器</b>：全部進 IoT VLAN，對外只開它們真正需要的那一兩個目的地。清冊裡也要列出它們，你不知道的東西保護不了。</li>
</ul>
<h4>交換器上的老把戲</h4>
<table>
<tr><th>攻擊</th><th>怎麼做</th><th>怎麼防</th></tr>
<tr><td>交換器偽裝（switch spoofing）</td><td>某些交換器的埠預設會「協商」成 trunk，攻擊者的電腦假裝自己是交換器，就拿到所有 VLAN</td><td>使用者用的埠一律明確設成 access，關掉自動協商（例如 Cisco 的 DTP）</td></tr>
<tr><td>雙重標籤（double tagging）</td><td>在原生 VLAN 上送一個貼了兩層標籤的訊框，第一台交換器拆掉外層，內層把它送進別的 VLAN（只能單向）</td><td>原生 VLAN 改成一個沒人用的編號，或讓 trunk 連原生 VLAN 也帶標籤</td></tr>
<tr><td>假 DHCP 伺服器</td><td>在網段上架一台會回 DHCP 的機器，把大家的閘道或 DNS 指向自己</td><td>DHCP snooping：只有接往真正 DHCP 伺服器的埠能回 DHCP</td></tr>
<tr><td>ARP 欺騙</td><td>謊稱自己是閘道的 MAC 位址，讓流量先經過自己</td><td>動態 ARP 檢查（Dynamic ARP Inspection），依 DHCP snooping 的紀錄驗證</td></tr>
<tr><td>員工自己接的小交換器或基地台</td><td>私接設備造成迴圈，或開了一個沒人管的 Wi-Fi</td><td>BPDU guard、每埠限制 MAC 數量；基地台的偵測惡意 AP 功能</td></tr>
</table>
<h4>RADIUS 本身也要保護</h4>
<p>RADIUS 是 1990 年代的協定，跑在 UDP 上，用共用密鑰加上 MD5 保護。2024 年公開的 BlastRADIUS 漏洞，讓能在基地台和伺服器之間攔截流量的人偽造回應。對策是讓伺服器和所有設備都要求 Message-Authenticator 屬性、更新到修補過的版本，並且只讓 RADIUS 流量走在管理 VLAN 或加密通道裡；能用 RADIUS over TLS（RadSec）的就改用它。</p>

<h3><span class="badge lv4">專家</span>十、監控、文件，和一份 30 人辦公室的建置清單</h3>
<h4>監控：讓設備自己告訴你出事了</h4>
<ul>
<li><b>日誌集中</b>：防火牆、交換器、基地台、RADIUS 的 syslog 全部送到同一個地方，至少保存 90 天。上面那筆「攝影機連 NAS 被擋」的紀錄，只有在集中之後才會被看到。</li>
<li><b>要發警報的事</b>：主線路斷線、切換到備援線路、UPS 改用電池供電、設備重新開機、防火牆設定被修改、VPN 或管理介面出現大量登入失敗。</li>
<li><b>設定備份</b>：網路設備的設定也是程式碼。用 Oxidized 這類開源工具每天把設定拉下來存進 Git，誰改了什麼、什麼時候改的，一個 diff 就看得到；設備壞了，換一台新的把設定灌回去就好。</li>
</ul>
<h4>文件：出事那天，一小時和一整天的差別</h4>
<p>一張網路架構圖、一份位址規劃（就是第二節那張表；NetBox 是很多人用來管 IP 和機櫃的開源工具）、一份廠商與合約清單（ISP 客服電話、線路編號、保固到期日）、一個續約行事曆（網域、憑證、授權），以及管理員密碼保險庫，至少兩位信得過的人打得開。寫給「半夜接到電話、從沒看過這套網路的人」看，他照著做得下去，文件才算及格。</p>
<h4>建置清單：四週從零到可以交接</h4>
<table>
<tr><th>時間</th><th>要完成的事</th></tr>
<tr><td>第 1 週：規劃</td><td>位址與 VLAN 規劃、防火牆規則草稿；申請兩條不同的對外線路（或光纖加 4G／5G）；採購支援 802.1Q 與 PoE 的交換器、企業級基地台、有雙 WAN 的防火牆、UPS；用廠商的規劃工具或實地量測決定基地台數量和位置</td></tr>
<tr><td>第 2 週：骨幹</td><td>上機櫃、所有線材兩端貼標籤；防火牆設定分區與規則、關閉 UPnP、管理介面只開給管理 VLAN；交換器的使用者埠設成 access 並開 DHCP snooping；DNS 過濾上線</td></tr>
<tr><td>第 3 週：無線與身分</td><td>員工 SSID 用 WPA3／WPA2-Enterprise 加 EAP-TLS，憑證由 MDM 發；RADIUS 依群組做動態 VLAN；訪客 SSID 隔離、限速；IoT 和印表機用 MAB 放進各自的 VLAN</td></tr>
<tr><td>第 4 週：保險與交接</td><td>NAS 快照與異地備份；日誌集中、警報、設定備份；寫完文件；跑一遍驗收測試，全部通過才算完成</td></tr>
</table>
<p>驗收測試要實際動手，不是看設定：拔掉主線路，量切換要幾秒、會議有沒有斷；用訪客 Wi-Fi 試著 ping 員工網段；從 IoT VLAN 試著連網際網路上的任意網站；關掉總電源，計時 UPS 撐多久、設備有沒有好好關機；從異地備份還原一個資料夾；用一台沒註冊 MDM 的筆電連員工 SSID，確認被拒絕。每一項都把結果記進文件。</p>

<h3>十一、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>切了 VLAN 就隔離了</td><td>VLAN 只是分開廣播網域。真正決定誰能連誰的是防火牆規則；規則寫成「全部允許」，切了等於沒切。</td></tr>
<tr><td>Wi-Fi 密碼夠長就安全</td><td>長度防得了離線猜，防不了「共用密碼收不回來」。人一多、人一走，就該用企業模式。</td></tr>
<tr><td>有 VPN 就是零信任</td><td>VPN 是「檢查一次、之後信任內網」，零信任是「每次存取都檢查身分與裝置，只開放單一應用程式」。</td></tr>
<tr><td>資料在雲端，供應商會備份</td><td>供應商保護的是服務；你自己刪的、被攻擊者刪的，回收筒期限一過就沒了。</td></tr>
<tr><td>印表機和攝影機不是電腦，不用管</td><td>它們是跑著老舊 Linux、從不更新、還存著帳密的電腦，常常是入侵的第一站。</td></tr>
<tr><td>網路設備不用更新，能動就好</td><td>防火牆和 VPN 設備直接面對網際網路，是被利用最多的設備類型之一。</td></tr>
</table>

<h3>十二、跟你的工作連起來</h3>
<ul>
<li><b>雲端的 VPC 就是一間大辦公室</b>：子網路對應 VLAN，安全群組和網路 ACL 對應防火牆分區（第 1.8 課）。在辦公室學會「先畫區域、再寫規則」，設計 VPC 時是同一件事。</li>
<li><b>Docker 和 Kubernetes</b>：Docker 的 bridge 網路、Kubernetes 的 NetworkPolicy，都是在做「誰能連誰」的分區。預設全通，要自己收緊。</li>
<li><b>內部工具的遠端存取</b>：你用 Vue、Node.js 或 Go 寫的營運後台，不要開在公網上靠密碼保護，放到身分感知代理後面，讓 SSO 和裝置檢查在請求到達你的程式之前就完成。</li>
<li><b>遊戲開發的網路需求</b>：多人連線測試、主機開發機、大型素材的 NAS，常常需要特殊規則。把它們放進自己的 VLAN、寫清楚例外，而不是把整個辦公室打通。</li>
<li><b>在家工作</b>：你家的路由器也是一間小辦公室。訪客網路給智慧家電、關掉 UPnP、更新韌體，這一章的每一條都能先在家裡練習。</li>
</ul>

<h3>十三、面試會怎麼問</h3>
<p>先自己講一遍，再打開參考答案。</p>
<ol>
<li>「請說明 802.1X 的三個角色，以及用 EAP-TLS 連上公司 Wi-Fi 的過程。PEAP 有什麼風險？」</li>
<li>「幫一間 50 人的辦公室設計網路：你會切哪些 VLAN？跨區的規則怎麼寫？」</li>
<li>「WPA2-Personal、WPA3-Personal、企業模式差在哪裡？」</li>
<li>「傳統 VPN 和零信任存取的差別是什麼？你會怎麼從 VPN 遷移過去？」</li>
<li>「公司的資料都在 Microsoft 365 上，還需要備份嗎？你會怎麼設計？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>請求者是要連網的裝置，驗證者是交換器埠或基地台，驗證伺服器是 RADIUS。驗證通過前埠只放行 EAP。基地台用 EAP 詢問身分，把 EAP 訊息包進 RADIUS 轉給伺服器；EAP-TLS 在雙方之間完成 TLS 交握，用戶端驗證伺服器憑證，伺服器驗證用戶端憑證與撤銷狀態，通過後回 Access-Accept 並可指派 VLAN；Wi-Fi 再用四次交握產生每個連線專屬的金鑰。PEAP-MSCHAPv2 用帳號密碼，若用戶端沒有被設定成只信任特定 CA 與伺服器名稱，假基地台可以收集挑戰回應並離線破解，所以要用 MDM 設死伺服器驗證，或改用 EAP-TLS。</li>
<li>依信任程度與用途分：員工、訪客、印表機、伺服器、IoT、網路設備管理，各一個 VLAN 與子網路，閘道在防火牆上，讓跨區流量都經過規則。預設全擋，只開員工到印表機與 NAS 的必要連接埠、管理機到管理 VLAN、IoT 到錄影主機；訪客只能上網，並開啟用戶端隔離；所有拒絕都記錄並集中。員工用 802.1X 加動態 VLAN，IoT 用 MAB 放進受限 VLAN，交換器開 DHCP snooping。</li>
<li>WPA2-Personal 共用密碼，錄到交握即可離線猜密碼，知道密碼的人錄到別人的交握還能解開其流量。WPA3-Personal 用 SAE，無法離線猜、每次連線金鑰獨立，並強制管理訊框保護，但共用密碼仍然收不回來。企業模式每個人有自己的帳號或憑證，可以單獨停用，金鑰也是每人每次不同。</li>
<li>VPN 在連線時驗證一次，之後使用者成為內網的一部分，通常能連到大範圍的資源，而且閘道必須對外開放、是高風險設備。零信任存取每次存取都依身分、裝置狀態決定，只開放被授權的單一應用程式，連接器向外連線，不需開放進站連接埠。遷移時先盤點 VPN 使用者實際用到哪些應用程式，網頁類工具先放到身分感知代理後面，SSH 與資料庫改用以身分控管的網狀 VPN，觀察一段時間後縮小、最後關閉 VPN。</li>
<li>需要。供應商保護服務可用性，不保護誤刪、到期刪除的離職者資料、勒索軟體同步上雲的加密檔案，或攻擊者用管理權限刪除的資料；回收筒與版本紀錄都有期限。設計上用第三方工具透過 API 定期備份信箱、雲端硬碟與聊天，存到不同帳號、不同憑證管理、啟用不可刪除鎖定的儲存空間，並每季實際還原、計時、記錄。</li>
</ol>
</details>

<h3>十四、練功題（做得出來才算真的懂）</h3>
<ol>
<li>一個 trunk 埠收到一個訊框，802.1Q 標籤的最後 12 位元是 <code>0x014</code>。在第二節的規劃裡，它屬於哪個 VLAN？加上標籤之後，一個訊框最大可以多長（不含前導碼）？</li>
<li>下面這份規則有一個嚴重的順序錯誤，找出來並說明後果：①所有內部到任何地方 允許 ②訪客到員工區 拒絕 ③其他 拒絕。</li>
<li>一位員工在高鐵站連上了一個也叫「Corp」的 Wi-Fi，筆電跳出「是否信任這張憑證」，他按了是。公司用的是 PEAP-MSCHAPv2。發生了什麼事？要改什麼，才不會再發生？</li>
<li>在你的 Mac 上查出：DHCP 給了你哪個 DNS 伺服器、你的瀏覽器有沒有開啟 DNS over HTTPS。如果你是公司的 MIS，你會怎麼讓所有筆電的 DNS 查詢都經過過濾？</li>
<li>替你負責的辦公室（或你家）列出驗收測試清單，至少六項，每一項寫出「怎麼測」和「什麼結果才算通過」。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li><code>0x014</code> 是 20，也就是訪客 VLAN。一般乙太網路訊框最大 1518 位元組（含 FCS），加上 4 位元組標籤變成 1522。資料本身的上限仍是 1500，所以 MTU 不用改。</li>
<li>第①條把「任何地方」都允許了，而且排在最前面，訪客到員工區的流量會先符合第①條被放行，第②條永遠輪不到。修法：把拒絕規則放在前面，並把第①條縮小成「所有內部到網際網路」，不要寫「任何地方」。</li>
<li>那是一台假基地台。他按下信任後，筆電在 TLS 通道裡把 MSCHAPv2 的挑戰回應送給了攻擊者，攻擊者可以離線破解出他的密碼，而那通常就是他的公司帳號密碼。要立刻改密碼並撤銷工作階段。根本修法：用 MDM 推 Wi-Fi 設定，固定只信任公司 CA、只接受特定伺服器名稱，不讓使用者自己按信任；更好的是改用 EAP-TLS，根本沒有密碼可以被騙。</li>
<li><code>ipconfig getpacket en0</code> 可以看到 DHCP 選項裡的 <code>domain_name_server</code>；<code>scutil --dns</code> 列出系統實際使用的解析器。瀏覽器的設定裡可以看到「使用安全 DNS」是否開啟。公司做法：DHCP 發公司解析器、防火牆擋掉其他往外的 53 與 853、用 MDM 政策關掉瀏覽器自己的 DoH，並對離開辦公室的筆電裝過濾代理程式或推加密 DNS 設定檔。</li>
<li>例如：拔主線路，備援在 60 秒內接手、通話不斷或只斷幾秒；訪客 Wi-Fi ping 員工網段，全部逾時；訪客之間互 ping，逾時；IoT 裝置連任意外部網站，被擋並有紀錄；沒註冊 MDM 的筆電連員工 SSID，被拒絕；切斷市電，UPS 撐過約定時間並送出警報；從異地備份還原一個資料夾，內容正確並記下花了多久；防火牆改一條規則，設定備份在一天內出現對應的 diff。</li>
</ol>
</details>

<h3>十五、想再挖深</h3>
<ul>
<li><b>NIST SP 800-207《Zero Trust Architecture》</b>（<a href="https://csrc.nist.gov/pubs/sp/800/207/final">csrc.nist.gov</a>）：零信任的原始架構文件，篇幅不長。</li>
<li><b>RFC 3580</b>：802.1X 與 RADIUS 搭配的使用指引，動態 VLAN 用的那三個屬性就定義在這裡；搭配 <b>FreeRADIUS</b> 官方文件（<a href="https://www.freeradius.org/documentation/">freeradius.org</a>）動手架一台。</li>
<li><b>Wi-Fi Alliance 的 WPA3 說明</b>（<a href="https://www.wi-fi.org/discover-wi-fi/security">wi-fi.org</a>）：SAE、轉換模式、Enhanced Open 的官方介紹。</li>
<li><b>Gary Donahue《Network Warrior》</b>（O'Reilly）：寫給真的在管交換器、路由器、防火牆的人，VLAN、trunk、生成樹都講得很實際。</li>
</ul>
` });
