DEEP({ 'perf': `
<p>上一課給了一套方法：USE、最初六十秒的八個指令、四種 CPU 時間。這一章把它們一個一個拆開：每個指令輸出的每一欄是什麼意思；平均負載為什麼會騙人；火焰圖怎麼讀；程式「很慢卻不吃 CPU」時，時間到底去了哪裡；「記憶體被吃光」為什麼常常是假警報；雲端和容器特有的兩個陷阱；以及 eBPF 這套能在正式環境安全地看進核心的工具。最後用一次完整的調查，把整套方法從頭走一遍。模組 0 講 CPU 的那兩章深入圖解（第 0.6 課和第 0.8 課）講過管線、快取、內容切換，這一章會一直用到它們。</p>

<h3><span class="badge lv1">基礎</span>一、USE 方法：一台機器就是四條隊伍</h3>
<p>把伺服器想成一間銀行。櫃台是 CPU，等候區的座位是記憶體，金庫的門是磁碟，大門是網路。要知道銀行為什麼變慢，對每一樣東西問同樣三個問題：它有多忙（<b>使用率</b>，utilisation）、有沒有人在排隊等它（<b>飽和</b>，saturation）、它有沒有出錯（<b>錯誤</b>，errors）。這就是 Brendan Gregg 提出的 <b>USE 方法</b>。它的價值在於「不會漏」：四種資源乘三個問題，一共十二格，一格一格填完，問題一定在其中某一格。</p>
<figure class="figure"><svg viewBox="0 0 660 300" class="fg" style="width:100%;max-width:660px" role="img" aria-label="CPU、記憶體、磁碟、網路四種資源，各自畫出排隊的工作和資源本身，並列出使用率、飽和、錯誤要看的指標和指令">
<rect x="15" y="10" width="145" height="252" rx="8" class="fg-b"/>
<rect x="177" y="10" width="145" height="252" rx="8" class="fg-b"/>
<rect x="339" y="10" width="145" height="252" rx="8" class="fg-b"/>
<rect x="501" y="10" width="145" height="252" rx="8" class="fg-b"/>
<text x="87" y="36" text-anchor="middle" class="fg-t lg">CPU</text>
<text x="249" y="36" text-anchor="middle" class="fg-t lg">記憶體</text>
<text x="411" y="36" text-anchor="middle" class="fg-t lg">磁碟</text>
<text x="573" y="36" text-anchor="middle" class="fg-t lg">網路</text>
<rect x="27" y="62" width="12" height="24" rx="2" class="fg-b warm"/><rect x="43" y="62" width="12" height="24" rx="2" class="fg-b warm"/><rect x="59" y="62" width="12" height="24" rx="2" class="fg-b warm"/>
<line x1="73" y1="74" x2="81" y2="74" class="fg-l"/><polygon points="89,74 81,69.5 81,78.5" class="fg-a"/>
<rect x="89" y="54" width="59" height="40" rx="5" class="fg-b alt"/><text x="118" y="78" text-anchor="middle" class="fg-t sm">核心</text>
<rect x="189" y="62" width="12" height="24" rx="2" class="fg-b warm"/><rect x="205" y="62" width="12" height="24" rx="2" class="fg-b warm"/><rect x="221" y="62" width="12" height="24" rx="2" class="fg-b warm"/>
<line x1="235" y1="74" x2="243" y2="74" class="fg-l"/><polygon points="251,74 243,69.5 243,78.5" class="fg-a"/>
<rect x="251" y="54" width="59" height="40" rx="5" class="fg-b alt"/><text x="280" y="78" text-anchor="middle" class="fg-t sm">RAM</text>
<rect x="351" y="62" width="12" height="24" rx="2" class="fg-b warm"/><rect x="367" y="62" width="12" height="24" rx="2" class="fg-b warm"/><rect x="383" y="62" width="12" height="24" rx="2" class="fg-b warm"/>
<line x1="397" y1="74" x2="405" y2="74" class="fg-l"/><polygon points="413,74 405,69.5 405,78.5" class="fg-a"/>
<rect x="413" y="54" width="59" height="40" rx="5" class="fg-b alt"/><text x="442" y="78" text-anchor="middle" class="fg-t sm">磁碟</text>
<rect x="513" y="62" width="12" height="24" rx="2" class="fg-b warm"/><rect x="529" y="62" width="12" height="24" rx="2" class="fg-b warm"/><rect x="545" y="62" width="12" height="24" rx="2" class="fg-b warm"/>
<line x1="559" y1="74" x2="567" y2="74" class="fg-l"/><polygon points="575,74 567,69.5 567,78.5" class="fg-a"/>
<rect x="575" y="54" width="59" height="40" rx="5" class="fg-b alt"/><text x="604" y="78" text-anchor="middle" class="fg-t sm">網卡</text>
<text x="25" y="128" class="fg-t sm acc">使用率：us＋sy</text><text x="25" y="144" class="fg-t sm mono">mpstat -P ALL 1</text>
<text x="25" y="176" class="fg-t sm warm">飽和：r 大於核心數</text><text x="25" y="192" class="fg-t sm mono">vmstat 1</text>
<text x="25" y="224" class="fg-t sm">錯誤：很少見</text><text x="25" y="240" class="fg-t sm mono">dmesg -T</text>
<text x="187" y="128" class="fg-t sm acc">使用率：available</text><text x="187" y="144" class="fg-t sm mono">free -m</text>
<text x="187" y="176" class="fg-t sm warm">飽和：si/so、PSI</text><text x="187" y="192" class="fg-t sm mono">vmstat 1</text>
<text x="187" y="224" class="fg-t sm">錯誤：OOM kill</text><text x="187" y="240" class="fg-t sm mono">dmesg -T</text>
<text x="349" y="128" class="fg-t sm acc">使用率：%util</text><text x="349" y="144" class="fg-t sm mono">iostat -xz 1</text>
<text x="349" y="176" class="fg-t sm warm">飽和：aqu-sz、await</text><text x="349" y="192" class="fg-t sm mono">iostat -xz 1</text>
<text x="349" y="224" class="fg-t sm">錯誤：I/O error</text><text x="349" y="240" class="fg-t sm mono">dmesg -T</text>
<text x="511" y="128" class="fg-t sm acc">使用率：對比頻寬</text><text x="511" y="144" class="fg-t sm mono">sar -n DEV 1</text>
<text x="511" y="176" class="fg-t sm warm">飽和：重傳、丟包</text><text x="511" y="192" class="fg-t sm mono">nstat、ss -ti</text>
<text x="511" y="224" class="fg-t sm">錯誤：errors、drop</text><text x="511" y="240" class="fg-t sm mono">ip -s link</text>
<text x="330" y="288" text-anchor="middle" class="fg-t sm">橘色小方塊：排隊等這個資源的工作。排隊，就是飽和。</text>
</svg><figcaption>四種資源、三個問題、十二格。每一格都有固定的指標和指令，照順序填，就不會漏。</figcaption></figure>
<p>幾個實用的心法：</p>
<ul>
<li><b>先看錯誤。</b>錯誤最便宜也最明確：<code>dmesg</code> 裡一行 OOM kill 或 I/O error，可能就是全部答案。</li>
<li><b>飽和比使用率重要。</b>上一課講過：CPU 100% 但沒人排隊，是用好用滿；有二十個在排隊，才是問題。</li>
<li><b>軟體資源也適用。</b>連線池、執行緒池、檔案描述符、鎖，都可以問同樣三個問題。第 4.4 課那次調查，瓶頸就是連線池。</li>
</ul>

<h3><span class="badge lv1">基礎</span>二、平均負載到底在算什麼</h3>
<p><code>uptime</code> 印出的三個數字，是 1、5、15 分鐘的<b>平均負載</b>（load average）：「正在跑或等著跑的工作數」的平滑平均。讀它有兩個重點：</p>
<ul>
<li><b>要跟核心數比。</b>4 核心的機器，負載 4 是剛好滿，8 是有一半的工作在排隊。三個數字一起看趨勢：1 分鐘的 12、15 分鐘的 3，代表問題剛開始；反過來就是正在恢復。</li>
<li><b>Linux 的負載還算進了 D 狀態。</b>D 是<b>不可中斷睡眠</b>（uninterruptible sleep），通常是在等磁碟或網路檔案系統。所以負載很高、CPU 卻很閒，是完全可能的：NFS 卡住，幾十個行程卡在 D 狀態，負載 40，CPU 使用率 3%。這是 Linux 自己的設計，很多其他 Unix 系統的負載只算 CPU。</li>
</ul>
<h4>更準的飽和指標：PSI</h4>
<p>Linux 4.20 起有<b>壓力停頓資訊</b>（pressure stall information，PSI），直接回答「有多少比例的時間，工作因為缺資源而卡住」：</p>
<pre><code>$ cat /proc/pressure/cpu
some avg10=35.21 avg60=28.04 avg300=12.50 total=983429104
full avg10=0.00 avg60=0.00 avg300=0.00 total=0
$ cat /proc/pressure/memory
some avg10=0.00 avg60=0.00 avg300=0.00 total=10234
full avg10=0.00 avg60=0.00 avg300=0.00 total=8812</code></pre>
<p><code>some avg10=35.21</code> 的意思是：過去 10 秒，有 35% 的時間至少有一個工作在等 CPU。<code>full</code> 是所有工作同時卡住的比例（CPU 在整台機器的層級沒有定義，固定顯示 0）。它比平均負載好用：是百分比、不用跟核心數換算，而且 CPU、記憶體、I/O 分開算。cgroup v2 底下每個容器也有自己的一份（<code>cpu.pressure</code>、<code>memory.pressure</code>、<code>io.pressure</code>）。</p>

<h3><span class="badge lv2">進階</span>三、一行一行讀懂四個指令</h3>
<h4>vmstat：整台機器的體檢表</h4>
<p>一台 4 核心機器在忙的時候（<code>-S M</code> 讓記憶體以 MB 顯示）：</p>
<pre><code>$ vmstat -S M 1 4
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 2  0      0    420     79   4990    0    0     2    35  310  620  9  3 88  0  0
11  0      0    400     79   5000    0    0     0    44 5200 9800 86  9  5  0  0
12  1      0    399     79   5000    0    0     0    52 5310 10120 85 10  5  0  0
10  0      0    398     79   5001    0    0     0    40 5150 9650 87  9  4  0  0</code></pre>
<figure class="figure"><svg viewBox="0 0 680 254" class="fg" style="width:100%;max-width:680px" role="img" aria-label="vmstat 第二行逐欄標註：r 等於 11 大於 4 核心表示 CPU 飽和；si 和 so 是 0 表示沒有置換；us 86 加 sy 9 表示忙著跑程式；wa 和 st 是 0 表示不是磁碟也沒被偷；free 小不代表不夠；in 和 cs 是中斷和切換次數">
<path d="M19 66 V60 H91 V66" class="fg-l dim"/><text x="55" y="52" text-anchor="middle" class="fg-t sm mono">procs</text>
<path d="M95 66 V60 H243 V66" class="fg-l dim"/><text x="169" y="52" text-anchor="middle" class="fg-t sm mono">memory</text>
<path d="M247 66 V60 H319 V66" class="fg-l dim"/><text x="283" y="52" text-anchor="middle" class="fg-t sm mono">swap</text>
<path d="M323 66 V60 H395 V66" class="fg-l dim"/><text x="359" y="52" text-anchor="middle" class="fg-t sm mono">io</text>
<path d="M399 66 V60 H471 V66" class="fg-l dim"/><text x="435" y="52" text-anchor="middle" class="fg-t sm mono">system</text>
<path d="M475 66 V60 H661 V66" class="fg-l dim"/><text x="568" y="52" text-anchor="middle" class="fg-t sm mono">cpu</text>
<text x="36" y="86" text-anchor="middle" class="fg-t sm mono">r</text><text x="74" y="86" text-anchor="middle" class="fg-t sm mono">b</text><text x="112" y="86" text-anchor="middle" class="fg-t sm mono">swpd</text><text x="150" y="86" text-anchor="middle" class="fg-t sm mono">free</text><text x="188" y="86" text-anchor="middle" class="fg-t sm mono">buff</text><text x="226" y="86" text-anchor="middle" class="fg-t sm mono">cache</text><text x="264" y="86" text-anchor="middle" class="fg-t sm mono">si</text><text x="302" y="86" text-anchor="middle" class="fg-t sm mono">so</text><text x="340" y="86" text-anchor="middle" class="fg-t sm mono">bi</text><text x="378" y="86" text-anchor="middle" class="fg-t sm mono">bo</text><text x="416" y="86" text-anchor="middle" class="fg-t sm mono">in</text><text x="454" y="86" text-anchor="middle" class="fg-t sm mono">cs</text><text x="492" y="86" text-anchor="middle" class="fg-t sm mono">us</text><text x="530" y="86" text-anchor="middle" class="fg-t sm mono">sy</text><text x="568" y="86" text-anchor="middle" class="fg-t sm mono">id</text><text x="606" y="86" text-anchor="middle" class="fg-t sm mono">wa</text><text x="644" y="86" text-anchor="middle" class="fg-t sm mono">st</text>
<rect x="18" y="94" width="36" height="28" rx="3" class="fg-b warm"/><rect x="56" y="94" width="36" height="28" rx="3" class="fg-b"/><rect x="94" y="94" width="36" height="28" rx="3" class="fg-b"/><rect x="132" y="94" width="36" height="28" rx="3" class="fg-b"/><rect x="170" y="94" width="36" height="28" rx="3" class="fg-b"/><rect x="208" y="94" width="36" height="28" rx="3" class="fg-b"/><rect x="246" y="94" width="36" height="28" rx="3" class="fg-b hot"/><rect x="284" y="94" width="36" height="28" rx="3" class="fg-b hot"/><rect x="322" y="94" width="36" height="28" rx="3" class="fg-b"/><rect x="360" y="94" width="36" height="28" rx="3" class="fg-b"/><rect x="398" y="94" width="36" height="28" rx="3" class="fg-b"/><rect x="436" y="94" width="36" height="28" rx="3" class="fg-b"/><rect x="474" y="94" width="36" height="28" rx="3" class="fg-b alt"/><rect x="512" y="94" width="36" height="28" rx="3" class="fg-b alt"/><rect x="550" y="94" width="36" height="28" rx="3" class="fg-b"/><rect x="588" y="94" width="36" height="28" rx="3" class="fg-b hot"/><rect x="626" y="94" width="36" height="28" rx="3" class="fg-b hot"/>
<text x="36" y="113" text-anchor="middle" class="fg-t sm mono">11</text><text x="74" y="113" text-anchor="middle" class="fg-t sm mono">0</text><text x="112" y="113" text-anchor="middle" class="fg-t sm mono">0</text><text x="150" y="113" text-anchor="middle" class="fg-t sm mono">400</text><text x="188" y="113" text-anchor="middle" class="fg-t sm mono">79</text><text x="226" y="113" text-anchor="middle" class="fg-t sm mono">5000</text><text x="264" y="113" text-anchor="middle" class="fg-t sm mono">0</text><text x="302" y="113" text-anchor="middle" class="fg-t sm mono">0</text><text x="340" y="113" text-anchor="middle" class="fg-t sm mono">0</text><text x="378" y="113" text-anchor="middle" class="fg-t sm mono">44</text><text x="416" y="113" text-anchor="middle" class="fg-t sm mono">5200</text><text x="454" y="113" text-anchor="middle" class="fg-t sm mono">9800</text><text x="492" y="113" text-anchor="middle" class="fg-t sm mono">86</text><text x="530" y="113" text-anchor="middle" class="fg-t sm mono">9</text><text x="568" y="113" text-anchor="middle" class="fg-t sm mono">5</text><text x="606" y="113" text-anchor="middle" class="fg-t sm mono">0</text><text x="644" y="113" text-anchor="middle" class="fg-t sm mono">0</text>
<line x1="36" y1="122" x2="36" y2="146" class="fg-l warm"/>
<text x="20" y="160" class="fg-t sm warm">r＝11，比 4 核心多</text><text x="20" y="176" class="fg-t sm">→ CPU 飽和</text>
<line x1="283" y1="122" x2="283" y2="146" class="fg-l on"/>
<text x="283" y="160" text-anchor="middle" class="fg-t sm acc">si、so＝0</text><text x="283" y="176" text-anchor="middle" class="fg-t sm">→ 沒有在置換</text>
<line x1="511" y1="122" x2="511" y2="146" class="fg-l alt"/>
<text x="511" y="160" text-anchor="middle" class="fg-t sm alt">us 86＋sy 9</text><text x="511" y="176" text-anchor="middle" class="fg-t sm">→ 忙著跑程式</text>
<line x1="150" y1="122" x2="150" y2="194" class="fg-l dim"/>
<text x="150" y="208" text-anchor="middle" class="fg-t sm">free 小不代表不夠</text><text x="150" y="224" text-anchor="middle" class="fg-t sm">→ 第六節</text>
<line x1="435" y1="122" x2="435" y2="194" class="fg-l dim"/>
<text x="435" y="208" text-anchor="middle" class="fg-t sm">in、cs：中斷、切換</text><text x="435" y="224" text-anchor="middle" class="fg-t sm">暴增時查鎖和執行緒</text>
<line x1="625" y1="122" x2="625" y2="194" class="fg-l on"/>
<text x="668" y="208" text-anchor="end" class="fg-t sm acc">wa、st＝0</text><text x="668" y="224" text-anchor="end" class="fg-t sm">→ 不是磁碟、沒被偷</text>
<text x="340" y="248" text-anchor="middle" class="fg-t sm">第一行是開機以來的平均，從第二行開始看</text>
</svg><figcaption>把第二行拆開來看：CPU 飽和、都在跑使用者程式、沒有置換、沒在等磁碟、沒被偷。結論很明確：程式本身在吃 CPU，下一步是看是哪個程式、哪一段程式碼。</figcaption></figure>
<table>
<tr><th>欄位</th><th>意思</th><th>怎麼判讀</th></tr>
<tr><td><code>r</code></td><td>正在跑或在等 CPU 的工作數</td><td>長期大於核心數，就是 CPU 飽和</td></tr>
<tr><td><code>b</code></td><td>不可中斷睡眠的工作數</td><td>一直不是 0，去看磁碟或網路檔案系統</td></tr>
<tr><td><code>free</code>、<code>buff</code>、<code>cache</code></td><td>閒置、緩衝、頁快取的記憶體</td><td>free 小是正常的，看第六節</td></tr>
<tr><td><code>si</code>、<code>so</code></td><td>每秒從置換區讀進、寫出的量</td><td>持續不是 0，記憶體真的不夠</td></tr>
<tr><td><code>bi</code>、<code>bo</code></td><td>每秒從區塊裝置讀、寫的量</td><td>跟 iostat 對照</td></tr>
<tr><td><code>in</code>、<code>cs</code></td><td>每秒中斷、內容切換的次數</td><td>cs 突然暴增，常是執行緒太多、在搶鎖</td></tr>
<tr><td><code>us</code> … <code>st</code></td><td>CPU 時間的比例</td><td>第 4.6 課那張表</td></tr>
</table>
<h4>mpstat：每顆核心分開看</h4>
<pre><code>$ mpstat -P ALL 1 1        # 只留下幾個重要欄位
CPU   %usr  %sys  %iowait  %soft  %steal  %idle
all   26.1   1.3      0.0    0.2     0.0   72.4
  0   99.0   1.0      0.0    0.0     0.0    0.0
  1    2.0   2.0      0.0    0.0     0.0   96.0
  2    1.0   1.0      0.0    1.0     0.0   97.0
  3    2.4   1.2      0.0    0.0     0.0   96.4</code></pre>
<p>只看 <code>all</code> 那一行，CPU 才用了 27%，好像很閒。分開看，第 0 顆核心 99%，其他三顆在睡覺：這是單執行緒的瓶頸，Node.js 的主執行緒最常見。另一個要注意的欄位是 <code>%soft</code>（軟中斷，主要是處理網路封包）：如果某一顆核心的 <code>%soft</code> 特別高，代表網卡的中斷都擠在同一顆核心上。</p>
<h4>pidstat：是哪個行程</h4>
<pre><code>$ pidstat 1 1              # 只留下幾個欄位
   PID    %usr %system  %wait    %CPU   CPU  Command
  2817    97.0     2.0    0.0    99.0     0  node
  2901     1.0     1.0    0.0     2.0     2  node</code></pre>
<p><code>%wait</code> 是這個行程想跑、卻在排隊等 CPU 的時間比例，是單一行程的飽和指標。<code>pidstat</code> 加不同參數看不同的資源：<code>-d</code> 看磁碟讀寫、<code>-r</code> 看記憶體和分頁錯誤、<code>-w</code> 看內容切換、<code>-t</code> 分開看每條執行緒。</p>
<h4>iostat：磁碟</h4>
<pre><code>$ iostat -xz 1             # 只留下幾欄，欄名依版本略有不同
Device    r/s     w/s   w_await  aqu-sz  %util
nvme1n1  12.0  2950.0     18.40    54.3   99.6</code></pre>
<p>三個數字一起看：每次寫入平均要 18 毫秒（<code>w_await</code>，包含排隊時間）、平均有 54 個請求在排隊（<code>aqu-sz</code>）、%util 接近 100%。要注意：%util 只代表「這段時間裡一直有請求在處理」。SSD、NVMe 和雲端磁碟能同時處理很多請求，%util 100% 不一定代表滿了；await 和 aqu-sz 才是真正的飽和訊號。這一顆的線索還不只這樣：它是雲端的 gp3 磁碟，基準是每秒 3,000 次操作，而它每秒寫 2,950 次。碰到的不是硬體極限，是供應商的限額。</p>

<h3><span class="badge lv2">進階</span>四、CPU 剖析與火焰圖</h3>
<p>確定是程式在吃 CPU 之後，下一個問題是：吃在哪一段程式碼？<b>取樣式的效能剖析器</b>（sampling profiler）每秒打斷程式很多次，記下當時的整條呼叫堆疊。取樣夠多，某個函式出現在取樣裡的比例，就是它佔用 CPU 時間的比例。在 Linux 上對整台機器取樣：</p>
<pre><code># 所有 CPU、每秒 99 次、帶呼叫堆疊、取樣 30 秒
sudo perf record -F 99 -a -g -- sleep 30
sudo perf script &gt; out.perf

# 下面兩支腳本來自 FlameGraph 專案
./stackcollapse-perf.pl out.perf &gt; out.folded
./flamegraph.pl out.folded &gt; cpu.svg</code></pre>
<p>為什麼是 99 次而不是 100 次？避免跟系統裡每 10 毫秒觸發一次的計時工作剛好同步，結果只取樣到同一件事。</p>
<figure class="figure"><svg viewBox="0 0 660 250" class="fg" style="width:100%;max-width:660px" role="img" aria-label="一張火焰圖：最底下是 all，往上是 node、uv_run、getLeaderboard 和 playRound；getLeaderboard 上面有 JSON.stringify 和 gzipSync，gzipSync 上面是 deflate；deflate 是最寬的平頂，約 35%">
<text x="20" y="44" class="fg-t sm">↑ 越上面，呼叫越深</text>
<text x="276" y="44" text-anchor="middle" class="fg-t sm acc">最寬的平頂：deflate 自己吃掉 35%</text>
<rect x="166" y="56" width="219" height="24" rx="2" class="fg-b hot"/><text x="172" y="72" class="fg-t sm mono">deflate</text>
<text x="90" y="72" text-anchor="middle" class="fg-t sm acc">平頂 22%</text>
<rect x="20" y="84" width="139" height="24" rx="2" class="fg-b hot"/><text x="26" y="100" class="fg-t sm mono">JSON.stringify</text>
<rect x="160" y="84" width="229" height="24" rx="2" class="fg-b"/><text x="166" y="100" class="fg-t sm mono">gzipSync</text>
<rect x="400" y="84" width="49" height="24" rx="2" class="fg-b"/><text x="406" y="100" class="fg-t sm mono">query</text>
<rect x="450" y="84" width="44" height="24" rx="2" class="fg-b"/><text x="456" y="100" class="fg-t sm mono">score</text>
<rect x="20" y="112" width="379" height="24" rx="2" class="fg-b"/><text x="26" y="128" class="fg-t sm mono">getLeaderboard</text>
<rect x="400" y="112" width="99" height="24" rx="2" class="fg-b"/><text x="406" y="128" class="fg-t sm mono">playRound</text>
<rect x="20" y="140" width="499" height="24" rx="2" class="fg-b alt"/><text x="26" y="156" class="fg-t sm mono">uv_run（事件迴圈）</text>
<rect x="520" y="140" width="69" height="24" rx="2" class="fg-b"/><text x="526" y="156" class="fg-t sm mono">V8 GC</text>
<rect x="20" y="168" width="569" height="24" rx="2" class="fg-b alt"/><text x="26" y="184" class="fg-t sm mono">node</text>
<rect x="590" y="168" width="50" height="24" rx="2" class="fg-b"/><text x="615" y="184" text-anchor="middle" class="fg-t sm">其他</text>
<rect x="20" y="196" width="620" height="24" rx="2" class="fg-b alt"/><text x="26" y="212" class="fg-t sm mono">all</text>
<text x="330" y="240" text-anchor="middle" class="fg-t sm">寬度＝出現在取樣裡的比例；左右順序沒有意義，不是時間</text>
</svg><figcaption>示意的火焰圖。getLeaderboard 很寬，但它上面被分成兩塊，自己幾乎不花 CPU；真正在燒 CPU 的，是上面沒有東西的平頂：deflate 和 JSON.stringify。</figcaption></figure>
<p>讀火焰圖的規則：</p>
<ul>
<li><b>縱軸是呼叫堆疊</b>：下面的函式呼叫上面的。最底下是全部，越往上越深。</li>
<li><b>橫軸不是時間</b>：同一個函式的所有取樣合併在一起，通常照字母排序。要看時間順序，用另一種叫火焰時序圖（flame chart）的畫法，例如 Chrome DevTools 的 Performance 面板。</li>
<li><b>寬度是比例</b>：一個方塊的寬度，代表它（連同它呼叫的所有函式）出現在多少比例的取樣裡。</li>
<li><b>找平頂</b>：每個方塊的上緣，代表取樣那一刻正在 CPU 上跑的就是它自己。上面沒有東西、又很寬的方塊，就是自己在花 CPU 的地方（self time），最值得最佳化。</li>
<li><b>顏色通常沒有意義</b>，傳統的火焰圖只是隨機選暖色。</li>
</ul>
<p>各語言都有自己的剖析器，產出的格式都能畫成火焰圖：Node.js 用 <code>node --cpu-prof</code>（產生的檔案用 Chrome DevTools 打開），或加 <code>--perf-basic-prof</code> 讓 <code>perf</code> 看得懂 JavaScript 的函式名稱；Go 用 <code>pprof</code>，<code>go tool pprof -http=:8080 cpu.prof</code> 直接在瀏覽器裡看火焰圖；Python 有 py-spy；JVM 有 async-profiler。</p>
<p>還有一個常見的坑：堆疊斷掉，火焰圖變成一堆看不出名字的碎片。<code>perf -g</code> 預設靠<b>框架指標</b>（frame pointer）沿著堆疊往回走，而很多程式為了省一個暫存器，編譯時把它省略了。Fedora 38、Ubuntu 24.04 起，系統套件預設會保留框架指標；其他情況可以改用 <code>--call-graph dwarf</code>，代價是取樣的資料量大很多。</p>

<h3><span class="badge lv3">專業</span>五、不在 CPU 上的時間：慢，卻不吃 CPU</h3>
<p>一個請求要 70 毫秒，CPU 剖析器卻說它只花了 14 毫秒的 CPU。剩下的時間去哪了？</p>
<figure class="figure"><svg viewBox="0 0 660 248" class="fg" style="width:100%;max-width:660px" role="img" aria-label="一個 70 毫秒的請求：解析、計算、輸出在 CPU 上共 14 毫秒；等鎖、等資料庫、等磁碟共 56 毫秒不在 CPU 上；CPU 剖析只看得到前者，off-CPU 分析才看得到後者">
<text x="90" y="30" text-anchor="middle" class="fg-t sm">0</text><text x="615" y="30" text-anchor="middle" class="fg-t sm">70 ms</text>
<line x1="90" y1="38" x2="615" y2="38" class="fg-l dim"/>
<text x="10" y="69" class="fg-t">一個請求</text>
<rect x="90" y="48" width="30" height="32" rx="3" class="fg-b hot"/><text x="105" y="69" text-anchor="middle" class="fg-t sm">解析</text>
<rect x="120" y="48" width="105" height="32" rx="3" class="fg-b warm"/><text x="172" y="69" text-anchor="middle" class="fg-t sm">等鎖 14 ms</text>
<rect x="225" y="48" width="45" height="32" rx="3" class="fg-b hot"/><text x="247" y="69" text-anchor="middle" class="fg-t sm">計算</text>
<rect x="270" y="48" width="270" height="32" rx="3" class="fg-b warm"/><text x="405" y="69" text-anchor="middle" class="fg-t sm">等資料庫回應 36 ms</text>
<rect x="540" y="48" width="30" height="32" rx="3" class="fg-b hot"/><text x="555" y="69" text-anchor="middle" class="fg-t sm">輸出</text>
<rect x="570" y="48" width="45" height="32" rx="3" class="fg-b warm"/><text x="592" y="69" text-anchor="middle" class="fg-t sm">等磁碟</text>
<text x="10" y="127" class="fg-t">CPU 剖析</text>
<line x1="90" y1="122" x2="615" y2="122" class="fg-l dim dash"/>
<rect x="90" y="110" width="30" height="24" rx="3" class="fg-b hot"/><rect x="225" y="110" width="45" height="24" rx="3" class="fg-b hot"/><rect x="540" y="110" width="30" height="24" rx="3" class="fg-b hot"/>
<text x="615" y="152" text-anchor="end" class="fg-t sm acc">只看得到這 14 ms</text>
<text x="10" y="187" class="fg-t">off-CPU</text>
<line x1="90" y1="182" x2="615" y2="182" class="fg-l dim dash"/>
<rect x="120" y="170" width="105" height="24" rx="3" class="fg-b warm"/><rect x="270" y="170" width="270" height="24" rx="3" class="fg-b warm"/><rect x="570" y="170" width="45" height="24" rx="3" class="fg-b warm"/>
<text x="615" y="212" text-anchor="end" class="fg-t sm warm">另外 56 ms 都在等</text>
<text x="352" y="238" text-anchor="middle" class="fg-t sm">牆上時間 70 ms ＝ 在 CPU 上 14 ms ＋ 不在 CPU 上 56 ms</text>
</svg><figcaption>CPU 剖析只會在執行緒「正在跑」時取樣，它對等待完全是瞎的。這個請求要加速，該處理的是資料庫和鎖，而不是那 14 毫秒的計算。</figcaption></figure>
<p>執行緒不在 CPU 上，是因為它在等：等鎖、等磁碟、等網路、等另一個服務回應，或者想跑卻排不到 CPU。這段時間叫 <b>off-CPU 時間</b>。怎麼看到它：</p>
<ul>
<li><b>執行緒狀態</b>：<code>ps -eo pid,stat,wchan:32,comm</code> 會列出每個行程的狀態（R 在跑或等著跑、S 可中斷的睡眠、D 不可中斷的睡眠），以及它卡在哪個核心函式（<code>wchan</code>）。一堆行程停在同一個地方，就是線索。</li>
<li><b>兩種內容切換</b>：<code>pidstat -w</code> 的 <code>cswch/s</code> 是<b>自願</b>切換（自己等東西而讓出 CPU），<code>nvcswch/s</code> 是<b>非自願</b>切換（時間到了被趕下來）。前者很多是在等 I/O 或鎖；後者很多代表 CPU 不夠分。</li>
<li><b>off-CPU 火焰圖</b>：bcc 的 <code>offcputime</code> 在執行緒被換下 CPU 時記下堆疊、換回來時記下等了多久，畫成火焰圖，寬度就變成「等待時間」。</li>
<li><b>語言內建的</b>：Go 的 block profile 和 mutex profile，專門記錄卡在 channel 和鎖上的時間。</li>
<li><b>跨服務的等待</b>：等資料庫、等別的服務，最好用分散式追蹤（第 4.1 課）：一個請求的每一段時間花在哪個下游，一目了然。</li>
</ul>
<p>Node.js 有個特別的情況：它只有一條主執行緒，同步的 CPU 工作會擋住事件迴圈，其他所有請求的回呼都在排隊。從這些請求的角度，它們是在「等」；從 CPU 剖析的角度，是那段同步程式在「跑」。所以 Node.js 要另外監控事件迴圈延遲（例如 <code>perf_hooks.monitorEventLoopDelay</code>），它直接告訴你回呼排隊排了多久。</p>

<h3><span class="badge lv3">專業</span>六、記憶體：free 很少，不代表不夠</h3>
<pre><code>$ free -m                 # 欄距縮短過
       total   used   free  shared  buff/cache  available
Mem:    7820   3105    512      24        4203       4380
Swap:      0      0      0</code></pre>
<p>新手看到 free 只剩 512 MB 就緊張。其實 Linux 會把沒在用的記憶體拿來當<b>頁快取</b>（page cache），快取讀過的檔案；程式需要記憶體時，乾淨的快取可以立刻丟掉讓出來。空著的記憶體是浪費，所以 free 小是正常的。要看的是 <b>available</b>：核心估計「不用置換、現在就能給程式用」的量。</p>
<figure class="figure"><svg viewBox="0 0 660 220" class="fg" style="width:100%;max-width:660px" role="img" aria-label="記憶體組成：總共 7,820 MB，程式在用 3,105，頁快取 4,203，閒置 512，available 約 4,380；程式多要 2 GB 後，頁快取讓出到 2,203，閒置不變">
<path d="M110 46 V40 H630 V46" class="fg-l dim"/>
<text x="370" y="32" text-anchor="middle" class="fg-t sm">total 7,820 MB</text>
<text x="10" y="74" class="fg-t">現在</text>
<rect x="110" y="52" width="206" height="36" rx="3" class="fg-b alt"/><text x="213" y="75" text-anchor="middle" class="fg-t sm">程式在用 3,105</text>
<rect x="316" y="52" width="280" height="36" rx="3" class="fg-b hot"/><text x="456" y="75" text-anchor="middle" class="fg-t sm">頁快取 4,203（大多可回收）</text>
<rect x="596" y="52" width="34" height="36" rx="3" class="fg-b"/><text x="613" y="75" text-anchor="middle" class="fg-t sm mono">512</text>
<path d="M338 94 V102 H630 V94" class="fg-l on"/>
<text x="484" y="120" text-anchor="middle" class="fg-t sm acc">available ≈ 4,380 ＝ free 512＋可回收的快取</text>
<text x="10" y="172" class="fg-t sm">程式多要 2 GB</text>
<rect x="110" y="150" width="340" height="36" rx="3" class="fg-b alt"/><text x="280" y="173" text-anchor="middle" class="fg-t sm">程式在用 5,105</text>
<rect x="450" y="150" width="146" height="36" rx="3" class="fg-b hot"/><text x="523" y="173" text-anchor="middle" class="fg-t sm">頁快取 2,203</text>
<rect x="596" y="150" width="34" height="36" rx="3" class="fg-b"/><text x="613" y="173" text-anchor="middle" class="fg-t sm mono">512</text>
<text x="370" y="210" text-anchor="middle" class="fg-t sm">快取讓出 2 GB 給程式，free 幾乎沒變，也沒有置換</text>
</svg><figcaption>free 只是「完全沒人用」的那一小塊。程式要記憶體時，核心先回收頁快取，所以真正可用的量要看 available。</figcaption></figure>
<h4>行程用了多少：RSS、PSS、VSZ</h4>
<ul>
<li><b>VSZ</b>（虛擬大小）：行程「申請過」的位址空間，包含還沒真的用到的。Go、Java 的程式常常好幾 GB，幾乎沒有參考價值。</li>
<li><b>RSS</b>（resident set size）：實際在實體記憶體裡的頁面，最常用。但共用函式庫這類被好幾個行程共用的頁面，每個行程都會算一次，所以把所有行程的 RSS 加起來，會超過實際用量。</li>
<li><b>PSS</b>（proportional set size）：共用的頁面按比例分攤，加總才會等於實際用量。從 <code>/proc/&lt;pid&gt;/smaps_rollup</code> 讀得到。</li>
</ul>
<h4>真的不夠時的訊號</h4>
<p>available 持續往下掉、vmstat 的 si／so 開始不是 0、主要分頁錯誤（<code>sar -B</code> 的 <code>majflt/s</code>）變多、PSI 的 memory 數字上升，最後是 <code>dmesg</code> 裡出現 OOM killer 砍行程的紀錄，大概長這樣：</p>
<pre><code>Out of memory: Killed process 2817 (node)
total-vm:1893416kB, anon-rss:1587340kB, ...   # 實際是同一行</code></pre>
<p>容器裡的規則稍微不同：限額是 cgroup 的 <code>memory.max</code>，碰到就在容器裡觸發 OOM，Kubernetes 會顯示 <code>OOMKilled</code>，結束碼 137。cgroup 計算的用量包含頁快取，所以 Kubernetes 看的是扣掉不活躍檔案快取後的 <b>working set</b>，<code>kubectl top</code> 顯示的也是它。Node.js 在容器裡要明確設定 <code>--max-old-space-size</code>，讓 V8 的堆積上限低於容器限額，留空間給 Buffer 和其他原生記憶體。</p>
<h4>找記憶體洩漏</h4>
<p>洩漏的樣子是：負載不變，RSS 卻一直線性往上爬，第 4.4 課的長時間浸泡測試最容易抓到。先分清楚是哪一種成長：JavaScript 或 Go 的堆積在長、原生記憶體（例如大量 Buffer）在長，還是只是記憶體碎片化。堆積的部分，拍兩次快照比較：Node.js 用 <code>--heapsnapshot-signal=SIGUSR2</code> 讓行程收到訊號時寫出快照，在 Chrome DevTools 用 Comparison 檢視找「數量一直增加」的物件；Go 用 <code>go tool pprof -base old.pb.gz new.pb.gz</code> 比較兩份 heap profile。最常見的兇手：沒有上限的全域快取（一個只進不出的 Map）、沒移除的事件監聽器、計時器裡抓住大物件的閉包。</p>

<h3><span class="badge lv3">專業</span>七、磁碟延遲與網路延遲</h3>
<h4>磁碟：先知道正常是多少</h4>
<p>判斷 await 高不高，要先知道這種裝置的正常值。大約的量級：本機 NVMe SSD 讀取是幾十到一百微秒左右；SATA SSD 是幾百微秒；傳統硬碟要尋軌加旋轉，大約 5 到 10 毫秒；雲端的網路磁碟（例如 EBS gp3）大約在一毫秒到幾毫秒。所以同樣是 await 5 毫秒，對硬碟是正常，對 NVMe 就是出事了。</p>
<p>雲端磁碟還有<b>限額</b>：gp3 基準是每秒 3,000 次操作和 125 MB/s，機型本身也有一個 EBS 頻寬上限。碰到限額時，請求在佇列裡排隊，await 往上爬，第三節那顆磁碟就是這樣。平均值會藏住這種問題，要看分佈。bcc 的 <code>biolatency</code> 直接畫出每次 I/O 延遲的直方圖：</p>
<pre><code>$ sudo biolatency 10 1     # 10 秒畫一次，排版縮短過
     usecs        : count   distribution
    64 -&gt; 127     : 1520    |*********          |
   128 -&gt; 255     : 3410    |********************|
   256 -&gt; 511     : 820     |*****              |
 16384 -&gt; 32767   : 95      |*                  |</code></pre>
<p>大部分 I/O 在 0.1 到 0.3 毫秒，另外有一小群在 16 到 32 毫秒。這是兩種不同的行為，平均值會把它們混成一個不存在的「1 毫秒」。那一小群，往往就是你的尾端延遲（tail latency）。資料庫的寫入延遲還常常被 <code>fsync</code> 主導：每次提交都要等資料真的寫進磁碟，所以資料庫會把很多交易合併成一次 fsync（group commit）。</p>
<h4>網路：延遲是一筆一筆加起來的</h4>
<ul>
<li><b>距離</b>：光在光纖裡每 1,000 公里單程大約 5 毫秒。台北到東京大約 2,100 公里，往返光是距離就要二十毫秒上下，這是物理，不是設定。</li>
<li><b>握手</b>：TCP 握手要 1 次往返，TLS 1.3 再 1 次。沒有重複使用連線，每個請求都先付兩次往返。</li>
<li><b>重傳</b>：一個封包掉了，Linux 至少要等 200 毫秒（最小重傳逾時）才重送。p99 裡常出現的「突然多 200 毫秒」，很多就是它。看 <code>nstat -az | grep -i retrans</code> 或 <code>ss -ti</code>（每條連線的 rtt 和重傳次數）。</li>
<li><b>佇列滿了</b>：<code>nstat</code> 的 <code>TcpExtListenOverflows</code> 增加，代表 accept 佇列滿了在丟連線（第 0.13 課）；<code>dmesg</code> 出現 <code>nf_conntrack: table full</code>，代表連線追蹤表滿了在丟封包。</li>
<li><b>雲端機型的上限</b>：AWS 的機器網路卡有頻寬、每秒封包數、連線追蹤數的配額。<code>ethtool -S eth0 | grep allowance</code> 會列出 <code>bw_in_allowance_exceeded</code>、<code>pps_allowance_exceeded</code> 這些計數，一直在增加就代表碰到機型的上限。</li>
</ul>

<h3><span class="badge lv4">專家</span>八、雲端和容器的兩個陷阱：被偷走與被節流</h3>
<h4>被竊取時間</h4>
<p>vmstat 的 <code>st</code>、mpstat 的 <code>%steal</code>，是你的虛擬 CPU 想跑、hypervisor 卻沒給的時間。兩種常見原因，處理方式完全不同：</p>
<ul>
<li><b>可爆發型執行個體</b>的 CPU 點數用完了，被壓回基準。點數怎麼算，第 0.14 課的深入圖解算過一次。確認方法：看 <code>CPUCreditBalance</code> 歸零的時間點，是否跟變慢的時間點對得上。解法是換一般機型，改程式沒用。</li>
<li><b>一般機型也有 steal</b>：同一台實體機上的鄰居太吵。停機再開機（通常會換到另一台實體機）、換大一點的機型、或用專用的執行個體。</li>
</ul>
<h4>容器的 CPU 節流</h4>
<p>這個陷阱更隱蔽，因為 steal 是 0、CPU 使用率也沒到上限，延遲卻會週期性地跳高。Kubernetes 的 CPU limit，底層是 cgroup 的頻寬控制：每 100 毫秒一個週期，limit 1 顆 CPU 就是每個週期最多用 100 毫秒的 CPU 時間（cgroup v2 寫成 <code>cpu.max = 100000 100000</code>）。問題在多執行緒：</p>
<figure class="figure"><svg viewBox="0 0 660 254" class="fg" style="width:100%;max-width:660px" role="img" aria-label="CPU 限額 1 顆的容器裡有 4 條忙碌的執行緒，每個 100 毫秒週期的前 25 毫秒就用完配額，剩下 75 毫秒全部被暫停；30 毫秒進來的請求要等到 100 毫秒才被處理">
<text x="210" y="30" text-anchor="middle" class="fg-t sm">週期 1：100 ms</text>
<text x="470" y="30" text-anchor="middle" class="fg-t sm">週期 2：100 ms</text>
<line x1="80" y1="38" x2="80" y2="186" class="fg-l dim dash"/><line x1="340" y1="38" x2="340" y2="186" class="fg-l dim dash"/><line x1="600" y1="38" x2="600" y2="186" class="fg-l dim dash"/>
<text x="10" y="63" class="fg-t sm">執行緒 1</text><text x="10" y="91" class="fg-t sm">執行緒 2</text><text x="10" y="119" class="fg-t sm">執行緒 3</text><text x="10" y="147" class="fg-t sm">執行緒 4</text>
<rect x="80" y="48" width="65" height="20" rx="2" class="fg-b hot"/><rect x="145" y="48" width="195" height="20" rx="2" class="fg-b warm"/><rect x="340" y="48" width="65" height="20" rx="2" class="fg-b hot"/><rect x="405" y="48" width="195" height="20" rx="2" class="fg-b warm"/>
<rect x="80" y="76" width="65" height="20" rx="2" class="fg-b hot"/><rect x="145" y="76" width="195" height="20" rx="2" class="fg-b warm"/><rect x="340" y="76" width="65" height="20" rx="2" class="fg-b hot"/><rect x="405" y="76" width="195" height="20" rx="2" class="fg-b warm"/>
<rect x="80" y="104" width="65" height="20" rx="2" class="fg-b hot"/><rect x="145" y="104" width="195" height="20" rx="2" class="fg-b warm"/><rect x="340" y="104" width="65" height="20" rx="2" class="fg-b hot"/><rect x="405" y="104" width="195" height="20" rx="2" class="fg-b warm"/>
<rect x="80" y="132" width="65" height="20" rx="2" class="fg-b hot"/><rect x="145" y="132" width="195" height="20" rx="2" class="fg-b warm"/><rect x="340" y="132" width="65" height="20" rx="2" class="fg-b hot"/><rect x="405" y="132" width="195" height="20" rx="2" class="fg-b warm"/>
<text x="112" y="62" text-anchor="middle" class="fg-t sm">跑</text>
<text x="242" y="62" text-anchor="middle" class="fg-t sm">被節流</text>
<text x="210" y="172" text-anchor="middle" class="fg-t sm warm">25 ms 就用完配額，剩下 75 ms 全停</text>
<circle cx="158" cy="200" r="5" class="fg-lamp on"/>
<line x1="166" y1="200" x2="332" y2="200" class="fg-l warm"/><polygon points="340,200 332,195.5 332,204.5" class="fg-a warm"/>
<text x="249" y="222" text-anchor="middle" class="fg-t sm warm">30 ms 進來的請求，要等到 100 ms 才輪到它</text>
<text x="340" y="246" text-anchor="middle" class="fg-t sm">limit 1 顆 CPU ＝ 每 100 ms 最多 100 ms 的 CPU 時間</text>
</svg><figcaption>4 條執行緒同時跑，100 毫秒的配額 25 毫秒就花完，整個容器停到下一個週期。平均使用率看起來沒超標，延遲卻每個週期多了幾十毫秒。</figcaption></figure>
<p>確認方法是看容器的 <code>cpu.stat</code>：</p>
<pre><code>$ cat /sys/fs/cgroup/cpu.stat        # 在容器裡（cgroup v2）
usage_usec 81234567
nr_periods 36000
nr_throttled 9100
throttled_usec 412000000</code></pre>
<p>一小時 36,000 個週期，被節流了 9,100 次（四分之一的週期），累計被停了 412 秒。解法依情況：提高 limit、減少執行緒數（讓 Go 的 GOMAXPROCS、執行緒池大小配合 limit）、或者乾脆不設 CPU limit 只設 request，這在社群裡有不少討論，要看你的叢集怎麼分配資源。</p>

<h3><span class="badge lv4">專家</span>九、eBPF：在核心裡裝探針</h3>
<p><code>strace</code> 很好用，但它靠 ptrace：目標行程每做一次系統呼叫，都要停下來兩次，交給 strace 看，再繼續。系統呼叫多的程式，可能慢上好幾倍甚至更多，在正式環境很危險。</p>
<p><b>eBPF</b> 換了一個做法：把一段小程式載入核心，掛在某個事件上（某個核心函式被呼叫、某個 tracepoint、某個使用者程式的函式、定時取樣），事件發生時就在核心裡執行。載入前，核心的<b>驗證器</b>（verifier）會檢查這段程式不會無窮迴圈、不會亂讀記憶體，所以它不會把核心弄當。統計直接在核心裡做（存在叫 map 的資料結構裡），只把摘要送回使用者空間，所以額外負擔很小。</p>
<table>
<tr><th>工具（bcc）</th><th>看什麼</th><th>常見用途</th></tr>
<tr><td><code>execsnoop</code></td><td>每一個新啟動的行程</td><td>找出每秒偷偷啟動幾百次的短命行程</td></tr>
<tr><td><code>opensnoop</code></td><td>每一次開檔</td><td>程式到底在讀哪個設定檔、哪個找不到</td></tr>
<tr><td><code>biolatency</code>、<code>biosnoop</code></td><td>磁碟 I/O 延遲的分佈、每一次 I/O</td><td>第七節那張直方圖</td></tr>
<tr><td><code>ext4slower</code>、<code>xfsslower</code></td><td>比某個門檻慢的檔案系統操作</td><td>是哪個檔案、哪個行程在慢</td></tr>
<tr><td><code>tcpconnect</code>、<code>tcpretrans</code>、<code>tcplife</code></td><td>對外連線、重傳、每條連線的壽命</td><td>誰在連誰、哪裡在掉封包</td></tr>
<tr><td><code>runqlat</code></td><td>工作在 CPU 佇列裡等了多久</td><td>CPU 飽和的直方圖</td></tr>
<tr><td><code>profile</code>、<code>offcputime</code></td><td>CPU 取樣、off-CPU 堆疊</td><td>兩種火焰圖的原料</td></tr>
</table>
<p>在 Ubuntu 上，這些工具在 <code>bpfcc-tools</code> 套件裡，名字後面多了 <code>-bpfcc</code>，例如 <code>execsnoop-bpfcc</code>。想自己寫，用 bpftrace，一行就是一個工具：</p>
<pre><code># 5 秒內，每個程式做了幾次系統呼叫
sudo bpftrace -e '
tracepoint:raw_syscalls:sys_enter { @[comm] = count(); }
interval:s:5 { print(@); clear(@); exit(); }'</code></pre>
<p>幾個要知道的邊界：eBPF 工具要 root 或對應的權限（<code>CAP_BPF</code>、<code>CAP_PERFMON</code>）；較新的核心有 BTF 型別資訊，工具才能「編譯一次、到處執行」；在容器裡要額外的權限。從資安角度看，能載入 eBPF 程式，幾乎等於能看到整台機器的所有東西，所以大部分發行版預設關掉沒有特權的 eBPF，給容器這個權限也要非常小心。同一套技術也被 Cilium（網路）、Falco 和 Tetragon（資安偵測）拿來用。</p>

<h3><span class="badge lv4">專家</span>十、一次完整的調查：從症狀到修好</h3>
<p>猜高低遊戲的 API 跑在 4 顆 vCPU 的一般機型上，用 4 個 Node.js 行程。症狀：每天晚上 8 點，p99 從 80 毫秒跳到 900 毫秒。</p>
<table>
<tr><th>步</th><th>看到什麼</th><th>推論</th></tr>
<tr><td>1</td><td>儀表板：20:00 起 p99 900 ms，錯誤率正常，流量是平常的 3 倍</td><td>跟流量有關，不是壞掉</td></tr>
<tr><td>2</td><td><code>uptime</code>：負載 7.8、6.1、2.3</td><td>4 核心、剛開始變糟</td></tr>
<tr><td>3</td><td><code>dmesg -T | tail</code>：沒有 OOM、沒有磁碟錯誤</td><td>排除兩大類</td></tr>
<tr><td>4</td><td><code>vmstat 1</code>：r 9 到 12；us 86、sy 9；wa、st、si、so 都是 0</td><td>CPU 飽和，而且是使用者程式；不是磁碟、記憶體、鄰居</td></tr>
<tr><td>5</td><td><code>mpstat -P ALL 1</code>：四顆核心都 95% 以上</td><td>不是單執行緒問題</td></tr>
<tr><td>6</td><td><code>pidstat 1</code>：4 個 node 行程各 95% 左右</td><td>就是應用程式本身</td></tr>
<tr><td>7</td><td><code>perf</code> 加火焰圖：35% 在 deflate、22% 在 JSON.stringify，都在 getLeaderboard 底下</td><td>排行榜在吃 CPU</td></tr>
<tr><td>8</td><td>程式和流量：晚上的活動頁面每 2 秒輪詢一次排行榜，每次回應 400 KB，每個請求都重新序列化、壓縮</td><td>同一份結果每秒被算了幾千次</td></tr>
</table>
<p>修法：排行榜每秒只產生一次，把 JSON 和壓縮好的結果放在記憶體裡，請求直接送出；回應加上 ETag，沒變就回 304；前端輪詢改成 5 秒。隔天晚上 8 點，用同一個儀表板確認：CPU 降到 30% 左右，p99 回到 75 毫秒。</p>
<p>注意整個過程的形狀：從使用者看得到的症狀開始，用 USE 一層一層縮小範圍（整台機器 → CPU → 哪個行程 → 哪段程式碼），每一步的推論都有數字佐證，修完再用同一個症狀確認。最後把前後的數字和兩張火焰圖寫成一頁紀錄。這一頁，就是面試時最有說服力的故事。</p>

<h3>十一、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>平均負載高，就是 CPU 不夠</td><td>Linux 的負載包含在等 I/O 的 D 狀態工作。要配 vmstat 的 r、b 和 CPU 使用率一起看。</td></tr>
<tr><td>free 很少，就是記憶體不夠</td><td>看 available。free 小通常只是被頁快取用掉了，隨時讓得出來。</td></tr>
<tr><td>%util 100%，磁碟就滿了</td><td>SSD、NVMe 和雲端磁碟能同時處理很多請求。要看 await、aqu-sz，以及有沒有碰到供應商的限額。</td></tr>
<tr><td>CPU 使用率低，程式就不是瓶頸</td><td>時間可能花在等待（off-CPU），或被節流、被偷走。要看時間到底花在哪裡。</td></tr>
<tr><td>火焰圖由左到右是時間</td><td>橫軸是合併後的取樣比例，通常照字母排序。要看時間順序，用火焰時序圖或追蹤。</td></tr>
<tr><td>strace 是安全的除錯工具</td><td>它會讓目標行程慢上好幾倍。正式環境優先用 eBPF 工具。</td></tr>
</table>

<h3>十二、跟你的工作連起來</h3>
<ul>
<li><b>Node.js</b>：一個行程只用一顆核心跑 JavaScript，<code>mpstat</code> 看到一顆滿、其他閒，就是它。<code>node --cpu-prof</code> 加 Chrome DevTools 是最順手的剖析組合；記憶體問題用堆積快照比較。</li>
<li><b>Go</b>：匯入 <code>net/http/pprof</code> 就有 <code>/debug/pprof</code> 端點，CPU、heap、block、mutex 都拿得到。這個端點只能開在內部，絕對不能對外。</li>
<li><b>Docker 與 Kubernetes</b>：CPU limit 會造成第八節的節流，記憶體 limit 會造成 <code>OOMKilled</code>（結束碼 137）。<code>docker stats</code>、<code>kubectl top</code> 是第一眼，<code>cpu.stat</code> 和 <code>memory.events</code> 是證據。</li>
<li><b>遊戲（Cocos、Unity）</b>：同樣的觀念搬到用戶端：Unity Profiler 和瀏覽器的 Performance 面板都是剖析器；60 FPS 的每一格只有 16.7 毫秒的預算；垃圾回收造成的掉格，就是畫面版的尾端延遲。</li>
<li><b>雲端主機</b>：買小機型時先問：它是不是可爆發型？網路和磁碟的配額是多少？很多「程式變慢」，最後是帳單上的機型規格決定的。</li>
</ul>

<h3>十三、面試會怎麼問</h3>
<p>SRE、後端、平台工程的面試，這幾題幾乎是必考。先自己講一遍，再看參考答案。</p>
<ol>
<li>「一台 Linux 伺服器變慢了，你最先會跑哪些指令？各看什麼？」</li>
<li>「平均負載是什麼？為什麼會負載很高、CPU 卻很閒？」</li>
<li>「怎麼讀一張火焰圖？」</li>
<li>「一個服務很慢，CPU 使用率卻很低，你會怎麼查？」</li>
<li>「容器裡的服務延遲週期性地跳高，CPU 使用率卻沒到 limit，可能是什麼？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>照 USE 的順序：<code>uptime</code> 看負載和趨勢；<code>dmesg -T | tail</code> 看 OOM 和硬體錯誤；<code>vmstat 1</code> 看 r 和核心數比、si／so、wa、st；<code>mpstat -P ALL 1</code> 看是不是單一核心滿；<code>pidstat 1</code> 找是哪個行程；<code>iostat -xz 1</code> 看 await 和 aqu-sz；<code>free -m</code> 看 available；<code>sar -n DEV 1</code> 看網路流量。先確認是哪一種資源飽和或出錯，再往下用剖析器找程式碼。</li>
<li>它是正在跑和等著跑的工作數的 1、5、15 分鐘平滑平均，要跟核心數比較。Linux 的負載還包含不可中斷睡眠（D 狀態）的工作，通常是在等磁碟或網路檔案系統，所以 I/O 卡住時負載會很高，CPU 卻很閒。更精確的飽和指標可以看 PSI。</li>
<li>縱軸是呼叫堆疊，下面呼叫上面；橫軸不是時間，而是合併後的取樣，寬度代表該函式（含子呼叫）出現在多少比例的取樣裡。找上面沒有其他方塊、又很寬的平頂，那是函式自己在消耗 CPU 的地方。顏色通常沒有意義。</li>
<li>CPU 低、延遲高，代表時間花在等待。看執行緒狀態和 <code>wchan</code>、<code>pidstat -w</code> 的自願切換、iostat 的磁碟延遲、網路重傳；用 off-CPU 分析（bcc 的 <code>offcputime</code>、Go 的 block／mutex profile）找卡在哪個鎖或 I/O；用分散式追蹤看是哪個下游服務慢；也檢查是否被節流（cgroup 的 <code>cpu.stat</code>）或被偷走（steal）。</li>
<li>CPU limit 造成的 CFS 頻寬節流：limit 以 100 毫秒為週期計算配額，多執行緒的程式可能在週期開頭很快把配額用完，剩下的時間整個容器被暫停，平均使用率卻看起來沒超標。看 <code>cpu.stat</code> 的 <code>nr_throttled</code> 和 <code>throttled_usec</code> 確認；解法是調整 limit、讓執行緒數配合 limit，或重新考慮 limit 的設定方式。</li>
</ol>
</details>

<h3>十四、練功題（做得出來才算真的懂）</h3>
<ol>
<li>一台 8 核心機器的 vmstat 一行是：<code>r 3、b 6、si 0、so 0、us 10、sy 4、id 51、wa 35、st 0</code>。瓶頸最可能在哪？下一個要跑的指令是什麼？</li>
<li><code>free -m</code> 顯示 total 4,000、available 150，vmstat 的 si 和 so 每秒都在 200 上下。這跟本章那個「free 只剩 512」的例子差在哪？你會怎麼處理？</li>
<li>一張火焰圖裡，<code>handleRequest</code> 佔 80% 寬，它上面有三塊：<code>validate</code> 5%、<code>renderTemplate</code> 50%（上面什麼都沒有）、<code>fetchUser</code> 20%（上面還有 <code>pg.query</code> 18%）。你會先最佳化哪一個？為什麼 <code>handleRequest</code> 本身不是重點？</li>
<li>一個容器的 limit 是 2 顆 CPU（<code>cpu.max = 200000 100000</code>），裡面有 8 條一直很忙的執行緒。每個週期多久會用完配額？被暫停多久？</li>
<li>動手：在一台測試用的 Linux 機器上跑一個吃 CPU 的程式（例如一個不停做 JSON 序列化的 Node.js 腳本），用 <code>perf record</code> 加 FlameGraph 腳本畫出火焰圖，找出平頂。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>wa 35% 加上 b 6（有 6 個工作在不可中斷睡眠），CPU 本身不忙（r 3 小於 8），也沒有置換：瓶頸在 I/O。下一步跑 <code>iostat -xz 1</code> 看是哪顆磁碟、await 和 aqu-sz 多少，再用 <code>pidstat -d 1</code> 或 bcc 的 <code>biosnoop</code> 找是哪個行程。</li>
<li>這次是真的不夠：available 只剩 150，而且 si／so 持續不是 0，代表正在把記憶體換到磁碟又換回來，效能會掉很多，接下來可能觸發 OOM。先用 <code>ps</code> 或 <code>pidstat -r</code> 找誰在吃記憶體、確認是不是洩漏（RSS 是否一直長）；短期止血可以重啟那個行程或加大機器，長期要修洩漏或調整限額。</li>
<li>先最佳化 <code>renderTemplate</code>：它佔 50%，而且上面沒有其他方塊，是自己在花 CPU 的平頂。<code>fetchUser</code> 的時間幾乎都在 <code>pg.query</code> 裡，要從查詢下手。<code>handleRequest</code> 很寬，只是因為它呼叫了這些函式，它自己的 self time 大約只有 80 − 5 − 50 − 20 = 5%。</li>
<li>每個 100 毫秒的週期有 200 毫秒的 CPU 配額。8 條執行緒同時跑，每 1 毫秒的牆上時間消耗 8 毫秒配額，25 毫秒就用完，接下來 75 毫秒整個容器被暫停。</li>
<li>參考第四節的指令。如果火焰圖裡 JavaScript 的部分全是看不懂的位址，記得加 <code>--perf-basic-prof</code> 啟動 Node.js，讓 perf 拿得到函式名稱。找到平頂後，試著改掉它，再畫一次比較。</li>
</ol>
</details>

<h3>十五、想再挖深</h3>
<ul>
<li><b>Brendan Gregg《Systems Performance: Enterprise and the Cloud》</b>（第二版，2020）：這一課的原典，從方法論到 CPU、記憶體、檔案系統、磁碟、網路、雲端，每一章都有工具和實例。</li>
<li><b>Brendan Gregg《BPF Performance Tools》</b>：bcc 和 bpftrace 的完整說明，本章那張工具表的出處。</li>
<li><b>Brendan Gregg 的網站</b>（<a href="https://www.brendangregg.com/">brendangregg.com</a>）：USE 方法的檢查清單、火焰圖（包含 off-CPU 火焰圖）的原始說明，全部免費。</li>
<li><b>Netflix Tech Blog〈Linux Performance Analysis in 60,000 Milliseconds〉</b>：上一課「最初六十秒」那張表的出處（原文列了十個指令），每一個都附了真實輸出和判讀。</li>
<li><b>Linux 核心文件</b>（<a href="https://docs.kernel.org/">docs.kernel.org</a>）：〈PSI - Pressure Stall Information〉和 cgroup v2 的說明，<code>cpu.max</code>、<code>cpu.stat</code>、<code>memory.max</code> 的每個欄位都在這裡。</li>
</ul>
` });
