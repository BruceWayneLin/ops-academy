DEEP({ 'fnd-cloud': `
<p>上一課說雲端是「透過 API 按小時租別人的電腦」。這一章把那台「別人的電腦」拆開來看：你按下「啟動執行個體」之後，雲端業者在機房裡到底切了什麼給你；為什麼同樣規格的機器，有時快有時慢；哪些東西會一起壞；真實的雲端資安事故是怎麼一步一步發生的；最後一行一行讀懂帳單。這些是雲端工程師面試必考、上線後天天會碰的東西，也是「伺服器怎麼突然變慢」「這個月怎麼多了一萬塊」這類問題的答案所在。</p>

<h3><span class="badge lv1">基礎</span>一、一台實體機，怎麼變成幾十台虛擬機</h3>
<p>先想像一棟大樓。業者買下整棟（實體伺服器），隔成很多間套房（虛擬機，virtual machine），每間有自己的門鎖、水電錶，房客彼此看不到。負責隔間、分水分電、確保 A 房客進不了 B 的房間的那一層，就是 <b>hypervisor</b>（虛擬機監控程式）。</p>
<p>雲端機房裡一台典型的實體伺服器，有一兩顆處理器、合起來幾十到上百顆核心、幾百 GB 記憶體。hypervisor 把這些資源切開，分給上面的虛擬機：</p>
<figure class="figure"><svg viewBox="0 0 660 300" class="fg" style="width:100%;max-width:660px" role="img" aria-label="三台虛擬機的 vCPU 分別對應到實體機上的硬體執行緒，中間由 hypervisor 分配，實體機上還有記憶體與 Nitro 卡">
<rect x="20" y="36" width="180" height="82" rx="8" class="fg-b"/>
<text x="36" y="58" class="fg-t">虛擬機 A</text><text x="36" y="78" class="fg-t sm">2 vCPU、4 GB</text>
<rect x="36" y="88" width="20" height="18" rx="3" class="fg-b alt"/><rect x="60" y="88" width="20" height="18" rx="3" class="fg-b alt"/>
<rect x="240" y="36" width="180" height="82" rx="8" class="fg-b"/>
<text x="256" y="58" class="fg-t">虛擬機 B</text><text x="256" y="78" class="fg-t sm">4 vCPU、16 GB</text>
<rect x="256" y="88" width="20" height="18" rx="3" class="fg-b hot"/><rect x="280" y="88" width="20" height="18" rx="3" class="fg-b hot"/><rect x="304" y="88" width="20" height="18" rx="3" class="fg-b hot"/><rect x="328" y="88" width="20" height="18" rx="3" class="fg-b hot"/>
<rect x="460" y="36" width="180" height="82" rx="8" class="fg-b"/>
<text x="476" y="58" class="fg-t">虛擬機 C</text><text x="476" y="78" class="fg-t sm">2 vCPU、8 GB</text>
<rect x="476" y="88" width="20" height="18" rx="3" class="fg-b warm"/><rect x="500" y="88" width="20" height="18" rx="3" class="fg-b warm"/>
<rect x="20" y="130" width="620" height="30" rx="6" class="fg-b"/>
<text x="330" y="150" text-anchor="middle" class="fg-t">hypervisor：把核心、記憶體、網路和磁碟切給各台虛擬機</text>
<rect x="20" y="172" width="620" height="118" rx="8" class="fg-b"/>
<text x="36" y="196" class="fg-t lg">實體機</text>
<rect x="36" y="208" width="58" height="42" rx="5" class="fg-b"/><rect x="42" y="218" width="22" height="22" rx="3" class="fg-b alt"/><rect x="66" y="218" width="22" height="22" rx="3" class="fg-b alt"/>
<rect x="104" y="208" width="58" height="42" rx="5" class="fg-b"/><rect x="110" y="218" width="22" height="22" rx="3" class="fg-b hot"/><rect x="134" y="218" width="22" height="22" rx="3" class="fg-b hot"/>
<rect x="172" y="208" width="58" height="42" rx="5" class="fg-b"/><rect x="178" y="218" width="22" height="22" rx="3" class="fg-b hot"/><rect x="202" y="218" width="22" height="22" rx="3" class="fg-b hot"/>
<rect x="240" y="208" width="58" height="42" rx="5" class="fg-b"/><rect x="246" y="218" width="22" height="22" rx="3" class="fg-b warm"/><rect x="270" y="218" width="22" height="22" rx="3" class="fg-b warm"/>
<rect x="308" y="208" width="58" height="42" rx="5" class="fg-b"/><rect x="314" y="218" width="22" height="22" rx="3" class="fg-b"/><rect x="338" y="218" width="22" height="22" rx="3" class="fg-b"/>
<rect x="376" y="208" width="58" height="42" rx="5" class="fg-b"/><rect x="382" y="218" width="22" height="22" rx="3" class="fg-b"/><rect x="406" y="218" width="22" height="22" rx="3" class="fg-b"/>
<rect x="452" y="208" width="172" height="20" rx="4" class="fg-b"/><text x="538" y="222" text-anchor="middle" class="fg-t sm">記憶體：幾百 GB</text>
<rect x="452" y="232" width="172" height="20" rx="4" class="fg-b"/><text x="538" y="246" text-anchor="middle" class="fg-t sm">Nitro 卡：網路、EBS</text>
<text x="235" y="276" text-anchor="middle" class="fg-t sm">一個大框是一顆實體核心，裡面兩格是它的兩條硬體執行緒</text>
</svg><figcaption>顏色對得起來的格子是同一台虛擬機。在多數 x86 執行個體上，1 個 vCPU 就是實體核心裡的一條硬體執行緒；所以「2 vCPU」通常是一顆實體核心，不是兩顆。右邊兩顆核心還空著，等著下一位房客。</figcaption></figure>
<h4>vCPU 不是「一顆 CPU」</h4>
<p>現代 x86 處理器的每顆實體核心，可以同時跑兩條指令流，叫<b>同步多執行緒</b>（SMT，Intel 叫 Hyper-Threading）。在 AWS 多數 x86 機型上，<b>1 個 vCPU 就是其中一條</b>，也就是半顆實體核心。兩條執行緒共用同一顆核心的運算單元和快取，所以兩個 vCPU 都跑滿時，效能不會是一個 vCPU 的兩倍，常見是 1.2 到 1.5 倍左右（量級，依工作內容差很多）。AWS 自家的 Graviton（ARM）處理器沒有 SMT，一個 vCPU 就是一顆完整的實體核心。比較機型時，這一點會讓「同樣 2 vCPU」的效能差很多。</p>
<h4>hypervisor 怎麼做到又快又隔離</h4>
<p>早期的虛擬化很慢，因為虛擬機裡的作業系統每做一件「特權」的事，都要被攔下來模擬。現在的處理器內建了虛擬化支援（Intel VT-x、AMD-V、ARM 的虛擬化擴充）：虛擬機裡的一般指令<b>直接在真正的 CPU 上全速執行</b>，只有少數敏感動作（改分頁表、碰硬體）才會跳出來交給 hypervisor 處理，這叫 VM exit。記憶體位址也由硬體做兩層翻譯（虛擬機位址 → 實體機位址），不用軟體一筆一筆查。結果是：純運算的程式在虛擬機裡，跟在實體機上差不到幾個百分點。</p>
<p>hypervisor 分兩類。<b>第一型</b>（Type 1）直接跑在硬體上，例如 KVM、Xen、VMware ESXi、Hyper-V，雲端業者用的都是這類；<b>第二型</b>（Type 2）跑在一般作業系統上面，例如你 Mac 上的 Parallels Desktop、VirtualBox。AWS 早期用 Xen，現在的機型大多跑在 <b>Nitro</b> 系統上：hypervisor 本身是以 KVM 為基礎的極簡版本，網路、EBS 磁碟、監控這些工作全部交給專用的 Nitro 硬體卡去做，主機的 CPU 幾乎全部留給客戶。</p>

<h3><span class="badge lv1">基礎</span>二、吵鬧的鄰居：明明規格一樣，為什麼時快時慢</h3>
<p>套房隔得再好，有些東西還是整棟共用：電梯、水壓、外面那條馬路。實體機也一樣。你的 vCPU 是切好的，記憶體容量是切好的，但下面這些東西是共用的，切不乾淨：</p>
<ul>
<li><b>處理器的最後一層快取</b>（L3 cache）和<b>記憶體頻寬</b>：鄰居的程式如果一直大量掃記憶體，會把你的資料擠出快取，你的程式就要更常去慢的記憶體拿東西。</li>
<li><b>網路和儲存的後端</b>：網路卡、交換器、EBS 的儲存叢集，都是很多客戶一起用的，業者靠限速讓大家公平分。</li>
<li><b>同一顆核心的另一條硬體執行緒</b>：如果它被別人在用，你的效能會受影響。這也是資安問題：Spectre 這類旁路攻擊，可能透過共用的快取讀到別人的資料。所以大型雲端業者會在排程時刻意避免把不同客戶放在同一顆實體核心上。</li>
</ul>
<p>這種現象叫<b>吵鬧的鄰居</b>（noisy neighbour）。怎麼看到它？在 Linux 上跑 <code>top</code>，看第三行最後那個 <code>st</code>：</p>
<pre><code>%Cpu(s): 41.2 us,  3.1 sy,  0.0 ni, 47.5 id,  0.2 wa,  0.0 hi,  0.4 si,  7.6 st</code></pre>
<p><b>st</b> 是偷走的時間（steal time）：你的 vCPU 本來想跑，hypervisor 卻把實體 CPU 拿去給別人用的時間比例。長期接近 0 是正常的；一直有好幾個百分點，就表示你在跟別人搶。在可爆發型的機型上（下一節），點數用完被壓住的那段時間，也常常顯示成 st。對策由便宜到貴：換一台（換到別的實體機上，有時就好了）、換大一點的機型（佔的比例越大，鄰居越少）、改用專用執行個體或整台的 <code>.metal</code> 機型。</p>

<h3><span class="badge lv2">進階</span>三、可爆發型 CPU：點數怎麼賺、怎麼花、花完會怎樣</h3>
<p>很多網站的 CPU 平常只用 5%，偶爾衝到 100%。為這種工作租一顆一直滿載的核心很浪費，所以 AWS 有一系列<b>可爆發型</b>（burstable）機型：T3、T4g 這些 T 開頭的，Lightsail 的方案也是同一類。它們的規則像手機的流量包：</p>
<ul>
<li>每台有一個<b>基準</b>（baseline）使用率，例如 t3.medium 是每個 vCPU 20%。</li>
<li>用得比基準少，就累積 <b>CPU 點數</b>（CPU credit）。<b>1 點 = 1 個 vCPU 以 100% 跑 1 分鐘</b>。</li>
<li>用得比基準多，就花點數。點數有上限，存滿就不再增加。</li>
</ul>
<p>拿 t3.medium 實際算一次。它有 2 個 vCPU，基準 20%，所以每小時賺的點數是 2 × 20% × 60 分鐘 = <b>24 點</b>，最多存 576 點（剛好是 24 小時賺的量）。</p>
<figure class="figure"><svg viewBox="0 0 640 262" class="fg" style="width:100%;max-width:640px" role="img" aria-label="t3.medium 從第 2 小時開始滿載，點數從 576 每小時淨扣 96 點，第 8 小時用完，之後 CPU 被壓回基準 20%">
<text x="60" y="20" class="fg-t">CPU 使用率</text>
<line x1="60" y1="110" x2="600" y2="110" class="fg-l dim"/>
<line x1="60" y1="94" x2="600" y2="94" class="fg-l dim dash"/>
<text x="54" y="34" text-anchor="end" class="fg-t sm">100%</text>
<text x="54" y="98" text-anchor="end" class="fg-t sm">20%</text>
<polyline points="60,106 150,106 150,30 420,30 420,94 600,94" class="fg-l on"/>
<line x1="420" y1="30" x2="600" y2="30" class="fg-l warm dash"/>
<text x="285" y="50" text-anchor="middle" class="fg-t sm acc">滿載 6 小時</text>
<text x="510" y="24" text-anchor="middle" class="fg-t sm warm">程式還想用 100%</text>
<text x="510" y="70" text-anchor="middle" class="fg-t sm warm">被壓回基準 20%</text>
<text x="60" y="140" class="fg-t">點數餘額</text>
<line x1="60" y1="230" x2="600" y2="230" class="fg-l dim"/>
<text x="54" y="154" text-anchor="end" class="fg-t sm">576</text>
<text x="54" y="234" text-anchor="end" class="fg-t sm">0</text>
<polyline points="60,150 150,150 420,230 600,230" class="fg-l alt"/>
<text x="105" y="168" text-anchor="middle" class="fg-t sm">存滿了</text>
<text x="350" y="186" text-anchor="middle" class="fg-t sm alt">每小時淨扣 96 點</text>
<line x1="420" y1="30" x2="420" y2="230" class="fg-l warm dim dash"/>
<text x="60" y="250" text-anchor="middle" class="fg-t sm">0</text>
<text x="150" y="250" text-anchor="middle" class="fg-t sm">2</text>
<text x="420" y="250" text-anchor="middle" class="fg-t sm warm">8：點數用完</text>
<text x="600" y="250" text-anchor="middle" class="fg-t sm">12 小時</text>
</svg><figcaption>滿載時每小時花 2 × 60 = 120 點、賺 24 點，淨扣 96 點；576 ÷ 96 = 6 小時就見底。之後（標準模式）CPU 被壓回 20%，程式什麼都沒改，卻慢了五倍。</figcaption></figure>
<p>這就是那個經典的工單：「伺服器每天下午開始變慢，重開機也沒用，CPU 使用率顯示才 20%。」重開機沒用，因為點數不會因為重開而回來；CPU 才 20%，因為它就是被壓在 20%。確認方法：在 CloudWatch 看這台的 <code>CPUCreditBalance</code> 指標，掉到 0 的時間點跟變慢的時間點對得上，就是它。</p>
<h4>標準模式和無限模式</h4>
<p>點數花完之後怎麼辦，看你設定哪一種：</p>
<table>
<tr><th>模式</th><th>點數用完時</th><th>適合</th></tr>
<tr><td><b>標準</b>（standard）</td><td>CPU 被壓回基準</td><td>寧可變慢也不要帳單出意外</td></tr>
<tr><td><b>無限</b>（unlimited）</td><td>繼續全速跑，超出的部分另外收費</td><td>不能變慢，偶爾爆衝</td></tr>
</table>
<p>T3 和 T4g 預設是無限模式。無限模式的陷阱是：如果你的程式其實<b>一直</b>都在滿載，你會一直付超額費。以美東的公開價做量級估算：t3.medium 本身大約每小時 0.04 美元，滿載時每小時多用了 1.6 個 vCPU 小時（2 個 vCPU 減掉基準的 0.4），超額大約每 vCPU 小時 0.05 美元，一個月下來超額費比機器本身還貴，加起來超過一台同樣 2 vCPU、而且不限 CPU 的一般機型（例如 m7i.large）。<b>可爆發型只適合「平常閒、偶爾忙」的工作</b>；長時間平均使用率超過基準，就該換一般機型。</p>
<p>同樣的「點數」設計也出現在磁碟上：舊的 gp2 EBS 磁碟每 GB 給 3 IOPS 的基準，小磁碟靠點數爆衝到 3,000 IOPS，點數用完就變得很慢。新的 gp3 直接保證 3,000 IOPS 和每秒 125 MB，通常也比較便宜，所以新建的磁碟一律選 gp3。</p>

<h3><span class="badge lv2">進階</span>四、區域、可用區，以及「什麼東西會一起壞」</h3>
<p>做高可用（high availability）的第一個問題不是「要開幾台」，而是「<b>哪些東西會一起壞</b>」。兩台機器放在同一個機櫃、接同一條電源，看起來有兩台，其實只有一台的可靠度。雲端的層級就是一層一層的「一起壞的範圍」（blast radius，爆炸半徑）：</p>
<figure class="figure"><svg viewBox="0 0 660 290" class="fg" style="width:100%;max-width:660px" role="img" aria-label="一個區域裡有三個可用區，每個可用區有獨立的機房、機櫃和主機；右邊列出主機、機櫃、可用區、區域、全球服務各自壞掉會影響的範圍">
<rect x="10" y="20" width="466" height="262" rx="10" class="fg-b"/>
<text x="26" y="44" class="fg-t lg">區域：東京 ap-northeast-1</text>
<rect x="26" y="58" width="136" height="164" rx="8" class="fg-b"/>
<text x="94" y="80" text-anchor="middle" class="fg-t">可用區 a</text>
<rect x="36" y="92" width="56" height="86" rx="5" class="fg-b"/><text x="64" y="108" text-anchor="middle" class="fg-t sm">機櫃</text>
<rect x="44" y="116" width="40" height="14" rx="2" class="fg-b warm"/><rect x="44" y="134" width="40" height="14" rx="2" class="fg-b"/><rect x="44" y="152" width="40" height="14" rx="2" class="fg-b"/>
<rect x="98" y="92" width="56" height="86" rx="5" class="fg-b"/><text x="126" y="108" text-anchor="middle" class="fg-t sm">機櫃</text>
<rect x="106" y="116" width="40" height="14" rx="2" class="fg-b"/><rect x="106" y="134" width="40" height="14" rx="2" class="fg-b"/><rect x="106" y="152" width="40" height="14" rx="2" class="fg-b"/>
<text x="94" y="204" text-anchor="middle" class="fg-t sm">獨立電力、冷卻、網路</text>
<rect x="175" y="58" width="136" height="164" rx="8" class="fg-b"/>
<text x="243" y="80" text-anchor="middle" class="fg-t">可用區 c</text>
<rect x="185" y="92" width="56" height="86" rx="5" class="fg-b"/><text x="213" y="108" text-anchor="middle" class="fg-t sm">機櫃</text>
<rect x="193" y="116" width="40" height="14" rx="2" class="fg-b"/><rect x="193" y="134" width="40" height="14" rx="2" class="fg-b"/><rect x="193" y="152" width="40" height="14" rx="2" class="fg-b"/>
<rect x="247" y="92" width="56" height="86" rx="5" class="fg-b"/><text x="275" y="108" text-anchor="middle" class="fg-t sm">機櫃</text>
<rect x="255" y="116" width="40" height="14" rx="2" class="fg-b"/><rect x="255" y="134" width="40" height="14" rx="2" class="fg-b"/><rect x="255" y="152" width="40" height="14" rx="2" class="fg-b"/>
<text x="243" y="204" text-anchor="middle" class="fg-t sm">獨立電力、冷卻、網路</text>
<rect x="324" y="58" width="136" height="164" rx="8" class="fg-b warm"/>
<text x="392" y="80" text-anchor="middle" class="fg-t warm">可用區 d（停電）</text>
<rect x="334" y="92" width="56" height="86" rx="5" class="fg-b"/><text x="362" y="108" text-anchor="middle" class="fg-t sm">機櫃</text>
<rect x="342" y="116" width="40" height="14" rx="2" class="fg-b"/><rect x="342" y="134" width="40" height="14" rx="2" class="fg-b"/><rect x="342" y="152" width="40" height="14" rx="2" class="fg-b"/>
<rect x="396" y="92" width="56" height="86" rx="5" class="fg-b"/><text x="424" y="108" text-anchor="middle" class="fg-t sm">機櫃</text>
<rect x="404" y="116" width="40" height="14" rx="2" class="fg-b"/><rect x="404" y="134" width="40" height="14" rx="2" class="fg-b"/><rect x="404" y="152" width="40" height="14" rx="2" class="fg-b"/>
<text x="392" y="204" text-anchor="middle" class="fg-t sm">整區一起停</text>
<rect x="26" y="234" width="434" height="34" rx="6" class="fg-b alt"/>
<text x="243" y="256" text-anchor="middle" class="fg-t">區域層級共用：控制面 API、區域服務</text>
<text x="570" y="44" text-anchor="middle" class="fg-t lg">一起壞的範圍</text>
<text x="496" y="76" class="fg-t warm">主機</text><text x="496" y="94" class="fg-t sm">上面的虛擬機一起停</text>
<text x="496" y="122" class="fg-t">機櫃</text><text x="496" y="140" class="fg-t sm">電源或交換器：一整排</text>
<text x="496" y="168" class="fg-t warm">可用區</text><text x="496" y="186" class="fg-t sm">停電、冷卻、網路事故</text>
<text x="496" y="214" class="fg-t alt">區域</text><text x="496" y="232" class="fg-t sm">控制面或區域服務出錯</text>
<text x="496" y="260" class="fg-t">全球</text><text x="496" y="278" class="fg-t sm">IAM、DNS 這類共用服務</text>
</svg><figcaption>可用區 a 裡一台主機壞了，只影響它上面的虛擬機；可用區 d 停電，整區都停。服務分散在 a、c 兩區，就撐得過 d 的事故；但三個可用區共用的區域層級服務出問題時，多可用區也救不了你。</figcaption></figure>
<p><b>可用區</b>（availability zone）是一個或多座資料中心，有自己的電力、冷卻和網路，跟同一區域的其他可用區隔開幾公里到幾十公里；近到可以同步複寫資料（延遲通常在 1、2 毫秒以內），遠到一場火災、一次停電不會同時打到兩區。真實的例子：2019 年 8 月，AWS 東京區域的一個可用區因為冷卻系統的控制故障而過熱，那一區的大量執行個體停擺，只部署在那一區的服務全倒，跨可用區部署的大多撐住了。</p>
<p>一個小細節：可用區的名字（<code>ap-northeast-1a</code>）在每個 AWS 帳號裡的對應是打亂的，你的 1a 不一定是別人的 1a。要跟其他帳號對齊同一座實體可用區，要看可用區 ID（像 <code>apne1-az1</code> 這種）。</p>
<h4>多可用區的數學，和它沒算進去的東西</h4>
<p>假設一個可用區一年有 0.5% 的時間出事。只放一區，可用率 99.5%；放兩區、而且兩區<b>真的獨立</b>，同時出事的機率是 0.5% × 0.5% = 0.0025%，可用率變成 99.9975%。差了兩百倍，這就是多可用區划算的原因。</p>
<p>但這個乘法有個前提：「獨立」。下面這些東西，不管你放幾個可用區，都會讓它們一起倒：</p>
<ul>
<li><b>你自己</b>：一次推錯的設定、一個壞掉的版本，會同時部署到每個可用區。真實世界裡最常見的大停機，是人造成的。2017 年 2 月 AWS 美東的 S3 大停機，起因是工程師在除錯時打錯一個指令參數，移除了比預期多很多的伺服器。</li>
<li><b>共用的單點</b>：只有一台的主資料庫、同一張快過期的憑證、同一個 DNS 設定、同一個第三方 API。</li>
<li><b>區域層級的服務</b>：啟動新機器的控制面 API、區域性的代管服務。這些出事時，所有可用區一起受影響。</li>
</ul>
<h4>容量要留到「少一區也撐得住」</h4>
<p>兩區各開一半，平常每區 60% 負載；其中一區倒了，所有流量湧到另一區，變成 120%，於是第二區也被壓垮。這叫<b>連鎖失效</b>。原則是：N 個可用區，每區平常的負載不能超過 (N − 1) ÷ N。兩區就是每區不超過 50%，三區就是不超過約 66%。所以三個可用區通常比兩個划算：要多準備的閒置容量比較少。</p>

<h3><span class="badge lv3">專業</span>五、共同責任模型：事故實際上是怎麼發生的</h3>
<p>上一課那句話很好背：「業者負責雲端<b>本身</b>的安全，你負責你<b>放進雲端</b>的東西的安全」。實務上更有用的是知道：<b>界線會隨服務類型移動，但有兩樣東西永遠在你這一邊</b>。</p>
<figure class="figure"><svg viewBox="0 0 680 298" class="fg" style="width:100%;max-width:680px" role="img" aria-label="責任分工表：從自己的機房到 EC2、RDS、Lambda，業者負責的層越來越多，但資料與存取權限、防火牆與公開設定永遠由你負責">
<text x="220" y="24" text-anchor="middle" class="fg-t lg">自己的機房</text><text x="220" y="42" text-anchor="middle" class="fg-t sm">全部自己來</text>
<text x="350" y="24" text-anchor="middle" class="fg-t lg">EC2</text><text x="350" y="42" text-anchor="middle" class="fg-t sm">虛擬機</text>
<text x="480" y="24" text-anchor="middle" class="fg-t lg">RDS</text><text x="480" y="42" text-anchor="middle" class="fg-t sm">代管資料庫</text>
<text x="610" y="24" text-anchor="middle" class="fg-t lg">Lambda</text><text x="610" y="42" text-anchor="middle" class="fg-t sm">無伺服器</text>
<text x="146" y="71" text-anchor="end" class="fg-t">資料與存取權限</text>
<rect x="160" y="52" width="120" height="28" rx="4" class="fg-b alt"/><text x="220" y="71" text-anchor="middle" class="fg-t sm">你</text>
<rect x="290" y="52" width="120" height="28" rx="4" class="fg-b alt"/><text x="350" y="71" text-anchor="middle" class="fg-t sm">你</text>
<rect x="420" y="52" width="120" height="28" rx="4" class="fg-b alt"/><text x="480" y="71" text-anchor="middle" class="fg-t sm">你</text>
<rect x="550" y="52" width="120" height="28" rx="4" class="fg-b alt"/><text x="610" y="71" text-anchor="middle" class="fg-t sm">你</text>
<text x="146" y="105" text-anchor="end" class="fg-t">防火牆與公開設定</text>
<rect x="160" y="86" width="120" height="28" rx="4" class="fg-b alt"/><text x="220" y="105" text-anchor="middle" class="fg-t sm">你</text>
<rect x="290" y="86" width="120" height="28" rx="4" class="fg-b alt"/><text x="350" y="105" text-anchor="middle" class="fg-t sm">你</text>
<rect x="420" y="86" width="120" height="28" rx="4" class="fg-b alt"/><text x="480" y="105" text-anchor="middle" class="fg-t sm">你</text>
<rect x="550" y="86" width="120" height="28" rx="4" class="fg-b alt"/><text x="610" y="105" text-anchor="middle" class="fg-t sm">你</text>
<text x="146" y="145" text-anchor="end" class="fg-t">程式或資料庫軟體</text>
<rect x="160" y="126" width="120" height="28" rx="4" class="fg-b alt"/><text x="220" y="145" text-anchor="middle" class="fg-t sm">你</text>
<rect x="290" y="126" width="120" height="28" rx="4" class="fg-b alt"/><text x="350" y="145" text-anchor="middle" class="fg-t sm">你</text>
<rect x="420" y="126" width="120" height="28" rx="4" class="fg-b hot"/><text x="480" y="145" text-anchor="middle" class="fg-t sm">業者</text>
<rect x="550" y="126" width="120" height="28" rx="4" class="fg-b alt"/><text x="610" y="145" text-anchor="middle" class="fg-t sm">你（函式程式碼）</text>
<text x="146" y="179" text-anchor="end" class="fg-t">作業系統修補</text>
<rect x="160" y="160" width="120" height="28" rx="4" class="fg-b alt"/><text x="220" y="179" text-anchor="middle" class="fg-t sm">你</text>
<rect x="290" y="160" width="120" height="28" rx="4" class="fg-b alt"/><text x="350" y="179" text-anchor="middle" class="fg-t sm">你</text>
<rect x="420" y="160" width="120" height="28" rx="4" class="fg-b hot"/><text x="480" y="179" text-anchor="middle" class="fg-t sm">業者</text>
<rect x="550" y="160" width="120" height="28" rx="4" class="fg-b hot"/><text x="610" y="179" text-anchor="middle" class="fg-t sm">業者</text>
<text x="146" y="213" text-anchor="end" class="fg-t">虛擬化</text>
<rect x="160" y="194" width="120" height="28" rx="4" class="fg-b alt"/><text x="220" y="213" text-anchor="middle" class="fg-t sm">你</text>
<rect x="290" y="194" width="120" height="28" rx="4" class="fg-b hot"/><text x="350" y="213" text-anchor="middle" class="fg-t sm">業者</text>
<rect x="420" y="194" width="120" height="28" rx="4" class="fg-b hot"/><text x="480" y="213" text-anchor="middle" class="fg-t sm">業者</text>
<rect x="550" y="194" width="120" height="28" rx="4" class="fg-b hot"/><text x="610" y="213" text-anchor="middle" class="fg-t sm">業者</text>
<text x="146" y="247" text-anchor="end" class="fg-t">硬體與機房</text>
<rect x="160" y="228" width="120" height="28" rx="4" class="fg-b alt"/><text x="220" y="247" text-anchor="middle" class="fg-t sm">你</text>
<rect x="290" y="228" width="120" height="28" rx="4" class="fg-b hot"/><text x="350" y="247" text-anchor="middle" class="fg-t sm">業者</text>
<rect x="420" y="228" width="120" height="28" rx="4" class="fg-b hot"/><text x="480" y="247" text-anchor="middle" class="fg-t sm">業者</text>
<rect x="550" y="228" width="120" height="28" rx="4" class="fg-b hot"/><text x="610" y="247" text-anchor="middle" class="fg-t sm">業者</text>
<line x1="160" y1="120" x2="670" y2="120" class="fg-l warm dash"/>
<text x="415" y="284" text-anchor="middle" class="fg-t sm">橘色虛線以上那兩列，不管用哪一種服務都是你的事；幾乎所有雲端資安事故都出在這裡</text>
</svg><figcaption>越往右，業者幫你扛的層越多（綠色），你要顧的只剩上面幾列。但「誰能存取什麼資料」和「哪些東西對外公開」永遠是你設定的，業者沒辦法替你決定。</figcaption></figure>
<p>看幾個真實的事故模式。它們有一個共同點：<b>沒有一件是雲端業者被攻破</b>，全部都是客戶這一邊的設定和身分出問題。</p>
<h4>模式一：從一個網站漏洞，一路走到整個資料庫</h4>
<p>2019 年 Capital One 的資料外洩，大約一億人的信用卡申請資料流出。攻擊路徑值得一步一步記住，因為它是雲端攻擊的標準範本：</p>
<figure class="figure"><svg viewBox="0 30 700 196" class="fg" style="width:100%;max-width:700px" role="img" aria-label="攻擊路徑：攻擊者利用網站伺服器的 SSRF 漏洞，向中繼資料服務要到臨時金鑰，再用金鑰下載 S3 資料；下方是每一步對應的防線">
<rect x="10" y="40" width="108" height="60" rx="6" class="fg-b warm"/><text x="64" y="64" text-anchor="middle" class="fg-t">攻擊者</text><text x="64" y="84" text-anchor="middle" class="fg-t sm">送特製的網址</text>
<rect x="153" y="40" width="108" height="60" rx="6" class="fg-b"/><text x="207" y="64" text-anchor="middle" class="fg-t">網站伺服器</text><text x="207" y="84" text-anchor="middle" class="fg-t sm">SSRF：代發請求</text>
<rect x="296" y="40" width="108" height="60" rx="6" class="fg-b"/><text x="350" y="64" text-anchor="middle" class="fg-t">中繼資料服務</text><text x="350" y="84" text-anchor="middle" class="fg-t sm mono">169.254.169.254</text>
<rect x="439" y="40" width="108" height="60" rx="6" class="fg-b"/><text x="493" y="64" text-anchor="middle" class="fg-t">臨時金鑰</text><text x="493" y="84" text-anchor="middle" class="fg-t sm">這台機器的角色</text>
<rect x="582" y="40" width="108" height="60" rx="6" class="fg-b warm"/><text x="636" y="64" text-anchor="middle" class="fg-t">S3 貯體</text><text x="636" y="84" text-anchor="middle" class="fg-t sm">上億筆資料</text>
<line x1="118" y1="70" x2="145" y2="70" class="fg-l warm"/><polygon points="153,70 145,65.5 145,74.5" class="fg-a warm"/><text x="135" y="62" text-anchor="middle" class="fg-t warm">1</text>
<line x1="261" y1="70" x2="288" y2="70" class="fg-l warm"/><polygon points="296,70 288,65.5 288,74.5" class="fg-a warm"/><text x="278" y="62" text-anchor="middle" class="fg-t warm">2</text>
<line x1="404" y1="70" x2="431" y2="70" class="fg-l warm"/><polygon points="439,70 431,65.5 431,74.5" class="fg-a warm"/><text x="421" y="62" text-anchor="middle" class="fg-t warm">3</text>
<line x1="547" y1="70" x2="574" y2="70" class="fg-l warm"/><polygon points="582,70 574,65.5 574,74.5" class="fg-a warm"/><text x="564" y="62" text-anchor="middle" class="fg-t warm">4</text>
<text x="64" y="150" text-anchor="middle" class="fg-t sm acc">每一步</text><text x="64" y="168" text-anchor="middle" class="fg-t sm acc">都有防線</text>
<line x1="207" y1="100" x2="207" y2="134" class="fg-l dim dash"/><line x1="350" y1="100" x2="350" y2="134" class="fg-l dim dash"/><line x1="493" y1="100" x2="493" y2="134" class="fg-l dim dash"/><line x1="636" y1="100" x2="636" y2="134" class="fg-l dim dash"/>
<rect x="153" y="134" width="108" height="44" rx="6" class="fg-b hot"/><text x="207" y="152" text-anchor="middle" class="fg-t sm">修掉 SSRF</text><text x="207" y="168" text-anchor="middle" class="fg-t sm">限制往內網連</text>
<rect x="296" y="134" width="108" height="44" rx="6" class="fg-b hot"/><text x="350" y="152" text-anchor="middle" class="fg-t sm">強制 IMDSv2</text><text x="350" y="168" text-anchor="middle" class="fg-t sm">要先 PUT 拿權杖</text>
<rect x="439" y="134" width="108" height="44" rx="6" class="fg-b hot"/><text x="493" y="152" text-anchor="middle" class="fg-t sm">最小權限</text><text x="493" y="168" text-anchor="middle" class="fg-t sm">只給需要的貯體</text>
<rect x="582" y="134" width="108" height="44" rx="6" class="fg-b hot"/><text x="636" y="152" text-anchor="middle" class="fg-t sm">異常下載警報</text><text x="636" y="168" text-anchor="middle" class="fg-t sm">CloudTrail 紀錄</text>
<text x="350" y="212" text-anchor="middle" class="fg-t sm acc">四道防線只要有一道在，這串攻擊就斷了</text>
</svg><figcaption>SSRF（伺服器端請求偽造）讓攻擊者借網站伺服器的手，去連只有那台機器連得到的位址。雲端機器上最值錢的這種位址，就是會發臨時金鑰的中繼資料服務。</figcaption></figure>
<ol>
<li>網站前面有一個設定不當的 WAF，攻擊者可以讓它幫忙發請求到任意位址（SSRF）。</li>
<li>他讓伺服器去連 <code>169.254.169.254</code>，這是每台 EC2 都連得到的<b>執行個體中繼資料服務</b>（IMDS），會回答「這台機器是誰、有什麼角色」。</li>
<li>中繼資料服務很老實地交出了這台機器 IAM 角色的臨時金鑰。</li>
<li>這個角色的權限開得太大，可以列出並下載大量 S3 貯體。攻擊者在自己的電腦上拿這組金鑰，把資料全部下載走。</li>
</ol>
<p>現在的對策：<b>IMDSv2</b> 要求先用 PUT 請求拿一個有效期的權杖，之後的請求都要帶著它；大多數 SSRF 漏洞只能發 GET，於是就拿不到金鑰。再加上回應的跳數限制（hop limit），容器裡的程式也碰不到。較新的映像檔和機型大多已經預設要求 IMDSv2，但舊機器要自己去改。</p>
<h4>模式二到五：每週都有人重演</h4>
<table>
<tr><th>模式</th><th>怎麼發生</th><th>怎麼防</th></tr>
<tr><td>公開的儲存貯體</td><td>為了讓前端讀圖片，把整個貯體設成公開，連帶裡面的備份、使用者資料一起公開</td><td>開啟封鎖公開存取（2023 年起新貯體預設開啟）；公開的檔案透過 CDN 給，不要整個貯體公開</td></tr>
<tr><td>外洩的存取金鑰</td><td>長效的存取金鑰被寫進程式碼推上公開 GitHub，機器人幾分鐘內就掃到，開一堆機器挖礦，帳單一夜幾千美元</td><td>不用長效金鑰：人用 SSO 登入，機器用角色，CI 用 OIDC 換臨時憑證</td></tr>
<tr><td>對外敞開的資料庫</td><td>安全群組開了 <code>0.0.0.0/0</code> 的 27017 或 9200，資料庫又沒設密碼；2017 年起一波波的勒索就是把資料刪掉、留一張要錢的紙條</td><td>資料庫只放私有子網路，只允許應用程式的安全群組連進來</td></tr>
<tr><td>被盜的帳號密碼</td><td>2024 年一波大型資料外洩，起因是客戶在雲端資料服務上的帳號，用的是被木馬偷走的密碼，而且沒開多因素驗證</td><td>所有人類帳號強制 MFA；根帳號（root）鎖起來不日常使用</td></tr>
</table>
<p>這張表的結論是：雲端資安的主戰場是<b>身分和設定</b>，不是防火牆。模組 5 的 IAM（第 5.5 課）和祕密管理（第 5.4 課）會把這兩件事講到底。</p>

<h3><span class="badge lv3">專業</span>六、計價模型：同一台機器，四種價錢</h3>
<p>同樣一台 2 vCPU 的機器，依你怎麼買，價錢可以差好幾倍。用一個好算的例子：假設隨需價每小時 0.10 美元，一個月大約 730 小時，就是 73 美元。</p>
<table>
<tr><th>買法</th><th>大約價錢（量級）</th><th>你答應了什麼</th><th>適合</th></tr>
<tr><td><b>隨需</b>（on-demand）</td><td>73 美元</td><td>什麼都沒答應，隨時可停</td><td>短期、不確定、會自動擴縮的部分</td></tr>
<tr><td><b>承諾方案</b>（Savings Plans、預留執行個體）</td><td>一年不預付約省兩到三成；三年全預付可省到一半以上</td><td>一年或三年內，每小時至少花多少錢</td><td>一直開著的基本盤</td></tr>
<tr><td><b>Spot</b></td><td>常常只要兩到三成的價錢，最多省九成</td><td>業者要收回時，只給你兩分鐘</td><td>可以中斷的工作：批次運算、CI、可替換的無狀態節點</td></tr>
<tr><td><b>專用主機</b>（dedicated host）</td><td>比隨需更貴</td><td>整台實體機只給你</td><td>授權綁實體核心、法規要求隔離</td></tr>
</table>
<p>實務上的組合是分層買：看過去一個月的用量曲線，<b>一直都在的最低那一段</b>用承諾方案；白天多出來的那一段用隨需加自動擴縮；能接受中斷的批次工作丟給 Spot。用 Spot 的前提是程式真的不怕被殺：無狀態、收到中斷通知時能在兩分鐘內收尾、工作可以從斷點重來。上一課深入圖解講的 SIGTERM 處理，在這裡直接變成省錢的能力。</p>
<h4>付了錢卻沒在用的東西</h4>
<p>雲端是按「你佔著什麼」收費，不是按「你用了什麼」。幾個常見的隱形帳單：</p>
<ul>
<li><b>停止的機器還在收磁碟錢</b>：EC2 停機後不收運算費，但 EBS 磁碟照樣按 GB 每月收費。機器刪了、磁碟沒刪，也一樣在收。</li>
<li><b>公開的 IPv4 位址</b>：2024 年 2 月起，AWS 對每個公開 IPv4 位址收費，每小時 0.005 美元，一個月大約 3.6 美元。不需要對外的機器就不要給公開 IP。</li>
<li><b>快照和日誌</b>：舊的磁碟快照越積越多；CloudWatch Logs 預設永不過期，寫入一 GB 約 0.5 美元，保存也要錢。記得設保存期限。</li>
</ul>

<h3><span class="badge lv4">專家</span>七、資料傳輸：帳單上最常讓人嚇一跳的那一行</h3>
<p>雲端業者對資料移動的收費規則，可以濃縮成一句話：<b>進來免費，出去收錢，在裡面跨邊界也收錢</b>。邊界包括：雲端到網際網路、區域到區域、甚至同一區域裡的可用區到可用區。下面是 AWS 的典型價格（美東公開價，東京通常貴一些；價格會變，記量級就好）：</p>
<figure class="figure"><svg viewBox="0 0 660 320" class="fg" style="width:100%;max-width:660px" role="img" aria-label="六條資料路徑的價格：從網際網路進來免費，出去每 GB 約 0.09 美元起，跨可用區兩邊各收 0.01，經過 NAT 閘道另收處理費，透過閘道端點到 S3 免費，從 EC2 到 CloudFront 免費">
<rect x="20" y="20" width="140" height="36" rx="6" class="fg-b"/><text x="90" y="43" text-anchor="middle" class="fg-t">網際網路</text>
<line x1="160" y1="38" x2="462" y2="38" class="fg-l on"/><polygon points="470,38 462,33.5 462,42.5" class="fg-a on"/>
<text x="315" y="32" text-anchor="middle" class="fg-t sm acc">進來：免費</text>
<rect x="470" y="20" width="170" height="36" rx="6" class="fg-b"/><text x="555" y="43" text-anchor="middle" class="fg-t">EC2</text>
<rect x="20" y="70" width="140" height="36" rx="6" class="fg-b"/><text x="90" y="93" text-anchor="middle" class="fg-t">EC2</text>
<line x1="160" y1="88" x2="462" y2="88" class="fg-l warm"/><polygon points="470,88 462,83.5 462,92.5" class="fg-a warm"/>
<text x="315" y="82" text-anchor="middle" class="fg-t sm warm">出去：每 GB 約 0.09～0.11 美元</text>
<rect x="470" y="70" width="170" height="36" rx="6" class="fg-b"/><text x="555" y="93" text-anchor="middle" class="fg-t">網際網路</text>
<rect x="20" y="120" width="140" height="36" rx="6" class="fg-b"/><text x="90" y="143" text-anchor="middle" class="fg-t">EC2（可用區 a）</text>
<line x1="168" y1="138" x2="462" y2="138" class="fg-l alt"/><polygon points="470,138 462,133.5 462,142.5" class="fg-a alt"/><polygon points="160,138 168,133.5 168,142.5" class="fg-a alt"/>
<text x="315" y="132" text-anchor="middle" class="fg-t sm alt">跨可用區：兩邊各收 0.01 美元/GB</text>
<rect x="470" y="120" width="170" height="36" rx="6" class="fg-b"/><text x="555" y="143" text-anchor="middle" class="fg-t">EC2（可用區 b）</text>
<rect x="20" y="170" width="140" height="36" rx="6" class="fg-b"/><text x="90" y="193" text-anchor="middle" class="fg-t">私有子網路的 EC2</text>
<line x1="160" y1="188" x2="262" y2="188" class="fg-l warm"/><polygon points="270,188 262,183.5 262,192.5" class="fg-a warm"/>
<text x="215" y="182" text-anchor="middle" class="fg-t sm warm">處理費 0.045/GB</text>
<rect x="270" y="170" width="120" height="36" rx="6" class="fg-b warm"/><text x="330" y="193" text-anchor="middle" class="fg-t">NAT 閘道</text>
<line x1="390" y1="188" x2="462" y2="188" class="fg-l warm"/><polygon points="470,188 462,183.5 462,192.5" class="fg-a warm"/>
<text x="430" y="182" text-anchor="middle" class="fg-t sm warm">＋出去的錢</text>
<rect x="470" y="170" width="170" height="36" rx="6" class="fg-b"/><text x="555" y="193" text-anchor="middle" class="fg-t">網際網路</text>
<rect x="20" y="220" width="140" height="36" rx="6" class="fg-b"/><text x="90" y="243" text-anchor="middle" class="fg-t">私有子網路的 EC2</text>
<line x1="160" y1="238" x2="462" y2="238" class="fg-l on"/><polygon points="470,238 462,233.5 462,242.5" class="fg-a on"/>
<text x="315" y="232" text-anchor="middle" class="fg-t sm acc">走閘道端點：免費</text>
<rect x="470" y="220" width="170" height="36" rx="6" class="fg-b hot"/><text x="555" y="243" text-anchor="middle" class="fg-t">S3（同區域）</text>
<rect x="20" y="270" width="140" height="36" rx="6" class="fg-b"/><text x="90" y="293" text-anchor="middle" class="fg-t">EC2（來源站）</text>
<line x1="160" y1="288" x2="262" y2="288" class="fg-l on"/><polygon points="270,288 262,283.5 262,292.5" class="fg-a on"/>
<text x="215" y="282" text-anchor="middle" class="fg-t sm acc">免費</text>
<rect x="270" y="270" width="120" height="36" rx="6" class="fg-b alt"/><text x="330" y="293" text-anchor="middle" class="fg-t">CloudFront</text>
<line x1="390" y1="288" x2="462" y2="288" class="fg-l alt"/><polygon points="470,288 462,283.5 462,292.5" class="fg-a alt"/>
<text x="430" y="282" text-anchor="middle" class="fg-t sm alt">CDN 價</text>
<rect x="470" y="270" width="170" height="36" rx="6" class="fg-b"/><text x="555" y="293" text-anchor="middle" class="fg-t">使用者</text>
</svg><figcaption>同樣是「把 1 GB 從 A 搬到 B」，價錢從 0 到十幾美分都有。橘色的路是錢流走的地方，綠色的路是省錢的地方。</figcaption></figure>
<h4>三個真實會遇到的帳單</h4>
<p><b>一、網站流量</b>。一個頁面加上圖片大約 500 KB，一個月 200 萬次瀏覽，就是 1 TB 對外流量。每月前 100 GB 免費，剩下 900 GB 乘上 0.09，大約 81 美元。改成讓 CloudFront 出流量：從 AWS 的來源站送到 CloudFront 不收錢，CloudFront 每月又有 1 TB 的免費額度，這筆錢幾乎歸零，使用者還變快。</p>
<p><b>二、NAT 閘道</b>。私有子網路裡的機器要上網（拉 Docker 映像檔、呼叫外部 API、存取 S3），預設都經過 NAT 閘道。它除了每小時收約 0.045 美元，<b>經過它的每一 GB 再收約 0.045 美元處理費</b>。一個 Kubernetes 叢集每天從外部拉幾百 GB 的映像檔、或透過 NAT 讀寫 S3，一個月就是幾百美元，而且它在帳單上躲在「EC2-Other」裡，很多人找不到。修法：替 S3 和 DynamoDB 建<b>閘道端點</b>（VPC 端點的一種，免費），讓這些流量不經過 NAT；映像檔放在同區域的映像檔倉庫並快取起來。</p>
<p><b>三、跨可用區聊天</b>。為了高可用，你把服務分散在三個可用區，結果服務之間每一次呼叫都有三分之二的機率跨區。假設一個資料庫每天寫入 1 TB，要同步到另外兩個可用區的副本，每天就是 2 TB 跨區，兩邊各收 0.01，等於每 GB 0.02 美元：每天 40 美元，一個月 1,200 美元。這筆錢不是錯誤，是高可用的代價；但你要知道它存在，才能決定哪些流量值得跨區、哪些可以讓同一可用區內的副本就近回答。</p>
<div class="note"><b>資料有重力</b>（data gravity）。資料放在哪裡，運算就該跟著放在那裡；資料一旦變大，搬出去本身就很貴。這也是業者「進來免費、出去收錢」的商業邏輯：它讓你很容易進來，很難離開。架構設計時，先問資料會從哪裡流到哪裡、一個月多少 GB。</div>

<h3><span class="badge lv4">專家</span>八、讀懂一張雲端帳單</h3>
<p>帳單的第一層是「服務」：EC2、S3、RDS……這層太粗，看不出問題。真正有用的是第二層「<b>用量類型</b>」（usage type），名字的格式是「區域代碼-計費項目」，東京的區域代碼是 APN1。用 AWS 的 Cost Explorer，先依服務分組、再依用量類型分組，就會看到像下面這樣的明細（金額是示意）：</p>
<table>
<tr><th>帳單上的一行</th><th>月費（示意）</th><th>白話</th><th>下一步</th></tr>
<tr><td><code>APN1-BoxUsage:m7i.large</code></td><td>150 美元</td><td>機器開著的時數</td><td>一直開著的部分改承諾方案</td></tr>
<tr><td>NAT 閘道的處理量（<code>APN1-Nat</code> 開頭、<code>Bytes</code> 結尾）</td><td>95 美元</td><td>經過 NAT 閘道的資料量</td><td>查是誰在透過 NAT 搬東西；S3 改走閘道端點</td></tr>
<tr><td><code>APN1-DataTransfer-Out-Bytes</code></td><td>80 美元</td><td>傳到網際網路的資料</td><td>靜態檔交給 CDN、打開壓縮</td></tr>
<tr><td><code>APN1-DataTransfer-Regional-Bytes</code></td><td>40 美元</td><td>同區域裡跨可用區的流量</td><td>找出哪兩個服務在跨區大量聊天</td></tr>
<tr><td><code>APN1-EBS:VolumeUsage.gp3</code></td><td>30 美元</td><td>磁碟容量，不管有沒有掛在機器上</td><td>刪掉沒掛載的磁碟和過期快照</td></tr>
<tr><td><code>APN1-DataProcessing-Bytes</code>（CloudWatch）</td><td>25 美元</td><td>寫進日誌的資料量</td><td>降低日誌等級、設保存期限</td></tr>
</table>
<p>注意第二到第五行：在 Cost Explorer 的服務層級，它們全部被歸在「<b>EC2-Other</b>」這一個籠統的名字底下。很多人看到 EC2 很貴，就去縮機器，結果真正的大戶是 NAT 和流量，機器縮了也省不到多少。</p>
<h4>一套固定的查帳流程</h4>
<ol>
<li><b>先看趨勢，不要只看總額</b>：把過去三個月按天畫出來。突然跳上去的那一天，對照當天的部署或設定變更，通常就找到原因了。</li>
<li><b>由大到小</b>：服務 → 用量類型 → 資源。只追前三名，它們通常佔七八成。</li>
<li><b>用標籤分到人頭</b>：每個資源掛上 <code>project</code>、<code>env</code> 這類標籤，並在帳單設定裡啟用成成本分配標籤（cost allocation tag），才能回答「這筆錢是哪個專案、哪個環境花的」。沒有標籤的資源，本身就是待處理事項。</li>
<li><b>分類再動手</b>：每一行標上運算、儲存、資料傳輸或閒置浪費。閒置浪費直接刪；運算看能不能縮或改承諾方案；資料傳輸看架構。</li>
<li><b>設警報，不要等月底</b>：用 AWS Budgets 設預算，在實際花費或預測花費超過某個比例時寄信。外洩的金鑰被拿去挖礦，警報當天就會響，而不是下個月收到帳單才發現。</li>
</ol>
<p>最後，把成本換算成<b>單位成本</b>：每一千個活躍玩家多少錢、每一百萬次請求多少錢。總額上漲不一定是壞事，玩家多了，帳單本來就該漲；單位成本上漲，才是架構或設定出了問題。能用單位成本跟主管對話的工程師，在雲端團隊裡非常稀少，也非常值錢。</p>

<h3>九、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>2 vCPU 就是兩顆核心</td><td>在多數 x86 機型上，2 vCPU 是一顆實體核心的兩條硬體執行緒；兩條都滿載時，效能遠不到單條的兩倍。</td></tr>
<tr><td>CPU 才 20%，所以不是 CPU 的問題</td><td>可爆發型機型點數用完時，CPU 就是被壓在基準值。先看點數餘額。</td></tr>
<tr><td>放兩個可用區就不會停機</td><td>只防得了機房層級的事故。推錯設定、共用的單點、區域層級的服務出事，多可用區照樣一起倒。</td></tr>
<tr><td>用了雲端，資安就是業者的事</td><td>業者只負責底層。誰能存取資料、哪些東西對外公開，永遠是你設定的，事故幾乎都出在這裡。</td></tr>
<tr><td>機器停掉就不用錢了</td><td>運算費停了，但磁碟、快照、公開 IP、NAT 閘道照收。</td></tr>
<tr><td>同一個區域裡傳資料是免費的</td><td>同一可用區內大多免費；跨可用區兩邊各收 0.01 美元/GB，經過 NAT 另收處理費。</td></tr>
<tr><td>Spot 不穩定，正式環境不能用</td><td>無狀態、可以隨時被替換的節點很適合用 Spot，只要能在兩分鐘內收尾，而且混著隨需機器一起跑。</td></tr>
</table>

<h3>十、跟你的工作連起來</h3>
<ul>
<li><b>前端（Vue、TypeScript）</b>：打包後的靜態檔放 S3 加 CloudFront，不要從機器直接送；檔名帶雜湊、設長快取，流量費和速度一起改善。不要為了讓前端讀檔，把整個貯體設成公開。</li>
<li><b>遊戲（Cocos、Unity）</b>：遊戲資源包動輒幾十、幾百 MB，一定要走 CDN，並用版本號讓舊檔一直被快取。即時對戰伺服器對延遲敏感，選離玩家近的區域，並注意 vCPU 是不是半顆核心、有沒有被點數壓住。</li>
<li><b>後端（Node.js、Go）</b>：服務設計成無狀態，就能用 Spot 和自動擴縮省錢；在 EC2 上要求 IMDSv2，角色只給需要的權限；呼叫 S3 走閘道端點。</li>
<li><b>Docker 與雲端伺服器</b>：映像檔放同區域的倉庫，避免每次部署都經過 NAT 從外面拉；小型的個人伺服器用可爆發型很划算，但要盯著點數餘額，長期滿載就換一般機型。</li>
</ul>

<h3>十一、面試會怎麼問</h3>
<p>這些是雲端、DevOps、SRE 面試的常見題。先自己講一遍，再看參考答案。</p>
<ol>
<li>「一台 EC2 平常很順，每天下午開始變慢，重開也沒用，CPU 使用率才 20%。你會怎麼查？」</li>
<li>「可用區和區域差在哪裡？你要怎麼部署，才撐得過一個可用區停擺？」</li>
<li>「解釋共同責任模型，並舉一個真實的雲端資安事故，說它錯在誰那一邊、該怎麼防。」</li>
<li>「這個月的雲端帳單比上個月多了三成，你會怎麼查？」</li>
<li>「NAT 閘道為什麼常常很貴？有哪些省錢的做法？」</li>
<li>「什麼工作適合用 Spot？程式要怎麼設計，才不怕被收回？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>先確認機型。如果是 T 系列，看 CloudWatch 的 CPUCreditBalance：每天固定時段掉到 0，CPU 就被壓在基準值，這正好解釋「20%」和「重開沒用」。對策是改無限模式（要接受超額費）或換一般機型。不是 T 系列的話，用 top 看 st（steal time）判斷是否被鄰居搶資源，再看記憶體、磁碟 I/O（EBS 是否撞到 IOPS 或頻寬上限，gp2 是否點數用完），以及應用程式本身在那個時段的流量和慢查詢。</li>
<li>區域是一個地理範圍，彼此完全獨立；可用區是區域裡一個或多座有獨立電力、冷卻、網路的資料中心，彼此距離近、延遲低。要撐過一個可用區停擺：負載平衡器跨至少兩個（最好三個）可用區，每區的應用程式節點夠多，容量要算到「少一區也扛得住」（三區時每區平常不超過約三分之二）；資料庫用多可用區的同步副本，能自動容錯移轉；而且事先就把容量開好，不要指望事故當下才啟動新機器，因為那時控制面可能也很忙或受影響。</li>
<li>業者負責雲端本身：機房、硬體、虛擬化，以及代管服務的底層；客戶負責放進去的東西：資料、存取權限、網路與公開設定、自己管的作業系統和程式。界線隨服務類型移動，但權限和公開設定永遠在客戶這邊。例子：2019 年 Capital One，攻擊者透過設定不當的 WAF 做 SSRF，向中繼資料服務拿到 EC2 角色的臨時金鑰，該角色權限過大，下載了大量 S3 資料。錯在客戶設定：可以靠修掉 SSRF、強制 IMDSv2、角色最小權限、異常下載的偵測警報，任何一道都能擋下。</li>
<li>先在 Cost Explorer 依天畫出趨勢，找出跳升的日期，對照那天的部署和設定變更。再依服務、依用量類型分組，比較兩個月的差異，只追差最多的前幾行；注意 EC2-Other 底下的 NAT、資料傳輸、EBS。用標籤找到是哪個專案或環境的資源。最後區分是合理成長（流量變多，單位成本沒變）還是浪費或錯誤（閒置資源、設定錯誤、外洩金鑰），並設好預算警報避免下次月底才發現。</li>
<li>NAT 閘道除了按小時收費，經過它的每一 GB 都要收處理費，而私有子網路裡所有往外的流量都會經過它，包括拉映像檔、存取 S3、呼叫外部 API。省法：S3 和 DynamoDB 建免費的閘道端點；其他 AWS 服務視流量決定是否用介面端點；映像檔放同區域倉庫並快取；開發環境不需要時關掉或共用 NAT；找出經過 NAT 的大流量來源。注意每個可用區各放一個 NAT 是為了高可用，同時也能避免跨可用區的流量費。</li>
<li>適合可以中斷、可以重來、可以被替換的工作：批次運算、CI 建置、資料處理、無狀態的網頁或 API 節點、Kubernetes 的部分工作節點。設計上要：無狀態，狀態放外面；收到兩分鐘中斷通知時停止接新工作、把手上的做完或存檔；工作切小並能從斷點重來；混用多種機型和多個可用區，降低同時被收回的機率；保留一部分隨需或承諾方案的容量當基本盤。</li>
</ol>
</details>

<h3>十二、練功題（做得出來才算真的懂）</h3>
<ol>
<li>一台 t3.small（2 vCPU、基準每個 vCPU 20%、每小時賺 24 點、最多存 576 點）從存滿開始，兩個 vCPU 都穩定跑在 60%。多久後點數用完？</li>
<li>你的服務尖峰時需要 30 台應用程式機器。要撐過任何一個可用區停擺，用兩個可用區總共要開幾台？用三個可用區呢？</li>
<li>一個 Higher or Lower 網頁遊戲，每位玩家第一次載入要下載 2 MB 的資源，一個月 50 萬次載入，資源直接從 EC2 送出。對外流量費大約多少？改成 CloudFront 之後呢？</li>
<li>把下列工作分成「你負責」和「業者負責」，分別回答 EC2 自己裝 PostgreSQL 和使用 RDS 兩種情況：作業系統修補、更換壞掉的硬碟、資料庫的帳號密碼、安全群組開放哪些來源、備份要保留幾天、資料庫引擎的安裝。</li>
<li>打開你自己的雲端帳號（或用價格試算工具），找出一筆「付了錢卻沒在用」的東西。如果找不到，列出三個你會先去檢查的地方。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>每小時花 2 × 60% × 60 = 72 點，賺 24 點，淨扣 48 點。576 ÷ 48 = 12 小時後用完，之後被壓回每個 vCPU 20%（標準模式）。</li>
<li>兩個可用區：任何一區倒了，剩下那一區要獨自扛 30 台，所以每區 30 台，共 60 台。三個可用區：倒一區時剩兩區分擔 30 台，每區 15 台，共 45 台。三區少準備 15 台閒置容量，這就是三區常常比兩區划算的原因。</li>
<li>2 MB × 500,000 = 1,000,000 MB，大約 1,000 GB（1 TB）。扣掉每月 100 GB 的免費額度，900 GB × 0.09 ≈ 81 美元（美東價格，量級）。改成 CloudFront：從 AWS 來源站送到 CloudFront 不收傳輸費，CloudFront 每月有 1 TB 免費額度，這個量幾乎不用錢，而且玩家從離自己近的節點下載，載入更快。</li>
<li>EC2 自己裝：除了「更換壞掉的硬碟」是業者，其他全部是你。RDS：作業系統修補、換硬碟、資料庫引擎的安裝是業者；帳號密碼、安全群組、備份保留天數是你（業者提供備份功能，但保留多久、要不要開，是你設定的）。</li>
<li>先查的地方：沒有掛在任何機器上的 EBS 磁碟、很舊的快照、沒在用的公開 IP（彈性 IP）、開發環境裡整天開著的 NAT 閘道或負載平衡器、永不過期的 CloudWatch 日誌群組、停在別的區域被遺忘的測試機器。</li>
</ol>
</details>

<h3>十三、想再挖深</h3>
<ul>
<li><b>AWS Well-Architected Framework</b>（<a href="https://aws.amazon.com/architecture/well-architected/">aws.amazon.com/architecture/well-architected</a>）：AWS 官方的架構檢查清單，分成可靠性、安全、成本最佳化等六大支柱，面試和實務都直接用得上。</li>
<li><b>Amazon Builders' Library</b>（<a href="https://aws.amazon.com/builders-library/">aws.amazon.com/builders-library</a>）：AWS 工程師自己寫的實戰文章，特別推薦〈Static stability using Availability Zones〉，講的就是「事故時不要依賴啟動新機器」。</li>
<li><b>AWS 共同責任模型官方說明</b>（<a href="https://aws.amazon.com/compliance/shared-responsibility-model/">aws.amazon.com/compliance/shared-responsibility-model</a>）：一頁講清楚責任怎麼切。</li>
<li><b>EC2 使用者指南的「Burstable performance instances」章節</b>：點數的完整規則、各機型的基準和上限，都以這份為準。</li>
<li><b>AWS 白皮書〈The Security Design of the AWS Nitro System〉</b>：Nitro 卡、hypervisor 怎麼隔離不同客戶，寫得很具體，是理解「雲端本身的安全」最好的第一手資料。</li>
</ul>
` });
