DEEP({ 'fnd-computer': `
<p>上一課用一張表講了四種資源，又丟給你五個詞：程式、行程、執行緒、核心、檔案描述符。這一章把一個正在跑的行程打開來看：它的記憶體其實是一場「每個人都以為自己獨佔」的魔術；它每次想讀檔、想送封包，都得去敲作業系統的門；一個 <code>read()</code> 從你的程式碼出發，一路到 SSD 再回來，中間經過哪幾站；作業系統怎麼決定誰先上 CPU；最後，從裡面看一個真的伺服器行程，以及它在容器裡怎麼生、怎麼死。伺服器出事時，<code>top</code>、<code>ps</code>、日誌裡的怪數字，大多能在這裡找到出處。</p>
<div class="note"><b>先講一個用詞。</b>中文的「核心」同時是 CPU 的 core 和作業系統的 kernel。這一章為了不搞混，CPU 的一律寫「CPU 核心」，作業系統的一律寫「作業系統核心」，或直接寫 kernel。</div>

<h3><span class="badge lv1">基礎</span>一、食譜、廚房、廚師：程式、行程、執行緒差在哪</h3>
<p>先用一個比喻把三個詞釘牢。<b>程式</b>（program）是一本食譜：躺在磁碟上的一個檔案，例如 <code>/usr/bin/node</code>，它自己什麼都不會做。<b>行程</b>（process）是一間照著食譜開伙的廚房：作業系統替它準備好流理台（記憶體）、一疊號碼牌（檔案描述符），門口再掛一個編號（PID）。同一本食譜可以同時開好幾間廚房：你在三個終端機各打一次 <code>node</code>，就是三個行程，彼此看不到對方的流理台。</p>
<p><b>執行緒</b>（thread）是廚房裡的廚師。一間廚房至少有一個廚師，也可以有好幾個。他們共用同一個流理台、同一疊號碼牌，但每個人手上有自己的進度（做到食譜第幾步，也就是第 0.6 課的程式計數器 PC），和一塊自己的小砧板（堆疊，stack）。</p>
<figure class="figure"><svg viewBox="0 0 660 326" class="fg" style="width:100%;max-width:660px" role="img" aria-label="一個行程的內部：左邊是共用的位址空間，中間是三條執行緒，右邊是共用的檔案描述符表">
<rect x="10" y="10" width="640" height="306" rx="10" class="fg-b"/>
<text x="28" y="36" class="fg-t lg">行程 PID 4127：node server.js</text>
<rect x="28" y="52" width="196" height="232" rx="8" class="fg-b alt"/>
<text x="126" y="74" text-anchor="middle" class="fg-t alt">位址空間（共用）</text>
<rect x="42" y="86" width="168" height="26" rx="4" class="fg-b"/><text x="54" y="103" class="fg-t sm">程式碼（唯讀）</text>
<rect x="42" y="118" width="168" height="26" rx="4" class="fg-b"/><text x="54" y="135" class="fg-t sm">全域變數</text>
<rect x="42" y="150" width="168" height="26" rx="4" class="fg-b"/><text x="54" y="167" class="fg-t sm">堆積 heap：物件都在這</text>
<rect x="42" y="182" width="168" height="26" rx="4" class="fg-b hot"/><text x="54" y="199" class="fg-t sm">執行緒 1 的堆疊</text>
<rect x="42" y="214" width="168" height="26" rx="4" class="fg-b hot"/><text x="54" y="231" class="fg-t sm">執行緒 2 的堆疊</text>
<rect x="42" y="246" width="168" height="26" rx="4" class="fg-b hot"/><text x="54" y="263" class="fg-t sm">執行緒 3 的堆疊</text>
<rect x="252" y="60" width="160" height="60" rx="6" class="fg-b hot"/><text x="332" y="84" text-anchor="middle" class="fg-t acc">執行緒 1</text><text x="332" y="104" text-anchor="middle" class="fg-t sm">自己的 PC、暫存器</text>
<rect x="252" y="136" width="160" height="60" rx="6" class="fg-b hot"/><text x="332" y="160" text-anchor="middle" class="fg-t acc">執行緒 2</text><text x="332" y="180" text-anchor="middle" class="fg-t sm">自己的 PC、暫存器</text>
<rect x="252" y="212" width="160" height="60" rx="6" class="fg-b hot"/><text x="332" y="236" text-anchor="middle" class="fg-t acc">執行緒 3</text><text x="332" y="256" text-anchor="middle" class="fg-t sm">自己的 PC、暫存器</text>
<line x1="252" y1="90" x2="232" y2="90" class="fg-l"/><polygon points="224,90 232,85.5 232,94.5" class="fg-a"/>
<line x1="252" y1="166" x2="232" y2="166" class="fg-l"/><polygon points="224,166 232,161.5 232,170.5" class="fg-a"/>
<line x1="252" y1="242" x2="232" y2="242" class="fg-l"/><polygon points="224,242 232,237.5 232,246.5" class="fg-a"/>
<line x1="412" y1="90" x2="432" y2="90" class="fg-l"/><polygon points="440,90 432,85.5 432,94.5" class="fg-a"/>
<line x1="412" y1="166" x2="432" y2="166" class="fg-l"/><polygon points="440,166 432,161.5 432,170.5" class="fg-a"/>
<line x1="412" y1="242" x2="432" y2="242" class="fg-l"/><polygon points="440,242 432,237.5 432,246.5" class="fg-a"/>
<rect x="440" y="52" width="196" height="232" rx="8" class="fg-b alt"/>
<text x="538" y="74" text-anchor="middle" class="fg-t alt">檔案描述符表（共用）</text>
<rect x="454" y="86" width="168" height="26" rx="4" class="fg-b"/><text x="466" y="103" class="fg-t mono">0</text><text x="486" y="103" class="fg-t sm">標準輸入</text>
<rect x="454" y="118" width="168" height="26" rx="4" class="fg-b"/><text x="466" y="135" class="fg-t mono">1</text><text x="486" y="135" class="fg-t sm">標準輸出</text>
<rect x="454" y="150" width="168" height="26" rx="4" class="fg-b"/><text x="466" y="167" class="fg-t mono">2</text><text x="486" y="167" class="fg-t sm">標準錯誤</text>
<rect x="454" y="182" width="168" height="26" rx="4" class="fg-b"/><text x="466" y="199" class="fg-t mono">3</text><text x="486" y="199" class="fg-t sm">監聽 :8080 的 socket</text>
<rect x="454" y="214" width="168" height="26" rx="4" class="fg-b"/><text x="466" y="231" class="fg-t mono">4</text><text x="486" y="231" class="fg-t sm">一條客戶連線</text>
<rect x="454" y="246" width="168" height="26" rx="4" class="fg-b"/><text x="466" y="263" class="fg-t mono">5</text><text x="486" y="263" class="fg-t sm">日誌檔</text>
<text x="330" y="304" text-anchor="middle" class="fg-t sm">同一個行程還共用：PID、使用者身分、目前目錄、環境變數、資源上限</text>
</svg><figcaption>同一個行程裡，位址空間和檔案描述符表大家共用；每條執行緒只有自己的「進度」（PC 和其他暫存器）和自己的堆疊。</figcaption></figure>
<p>這張圖最重要的是「誰跟誰共用」。整理成一張表，面試和除錯都用得到：</p>
<table>
<tr><th>項目</th><th>歸誰</th><th>這代表什麼</th></tr>
<tr><td>位址空間：程式碼、全域變數、堆積（heap）</td><td>整個行程共用</td><td>兩條執行緒能讀寫同一個變數，所以要用鎖（lock）保護</td></tr>
<tr><td>檔案描述符表</td><td>整個行程共用</td><td>一條執行緒打開的連線，另一條也能用；一條關掉，大家都沒了</td></tr>
<tr><td>PID、使用者身分、資源上限</td><td>整個行程共用</td><td><code>ulimit -n</code> 是算在整個行程頭上，不是每條執行緒各一份</td></tr>
<tr><td>程式計數器、其他暫存器</td><td>每條執行緒一份</td><td>各自跑到程式的不同地方</td></tr>
<tr><td>堆疊</td><td>每條執行緒一份</td><td>區域變數互不干擾；當掉時每條執行緒有自己的 stack trace</td></tr>
</table>
<p>所以「多執行緒還是多行程」的取捨，一句話就講完：執行緒之間共用記憶體，溝通很便宜，但只要一條寫壞了記憶體，整個行程一起陪葬；行程之間預設什麼都不共用，比較安全，可是要溝通就得透過作業系統（管線、socket、共享記憶體），比較貴。Chrome 把每個網站放進不同的行程，就是選了安全，第 0.12 課會再看到。</p>

<h3><span class="badge lv1">基礎</span>二、位址空間：每個行程都以為整台機器的記憶體是它的</h3>
<p>第 0.5 課說過，記憶體像一整面編了號的信箱牆。問題來了：兩個行程都想用第 1000 號信箱怎麼辦？如果讓程式直接用真的號碼，一個行程寫錯一格，就會蓋掉別人的資料，甚至蓋掉作業系統本身。</p>
<p>解法是讓每個行程拿到一套<b>假門牌</b>，叫<b>虛擬位址</b>（virtual address）。每個行程都從 0 開始編，而且大得誇張：64 位元的 Linux 上，使用者能用的那一半大約有 128 TB（x86-64 常見的設定）。CPU 裡有一個專門的零件叫 <b>MMU</b>（memory management unit），每一次讀寫記憶體，它都拿假門牌去查一本對照表，換成真正的位置，也就是<b>實體位址</b>（physical address）。這本對照表叫<b>分頁表</b>（page table），每個行程一本，由作業系統核心維護。</p>
<p>對照不是一格一格對，而是一整塊一整塊對，一塊叫一<b>頁</b>（page）。Linux 伺服器上通常 4 KB 一頁；Apple Silicon 上的 macOS 是 16 KB。每次都查表太慢，所以 CPU 會把最近查過的對照留在一個小快取裡，叫 TLB。</p>
<figure class="figure"><svg viewBox="0 0 660 310" class="fg" style="width:100%;max-width:660px" role="img" aria-label="行程 A 和行程 B 各自的虛擬位址空間，透過分頁表對到實體記憶體中散落的頁；兩邊的 libc 程式碼對到同一頁">
<text x="105" y="26" text-anchor="middle" class="fg-t lg">行程 A（虛擬）</text>
<text x="330" y="26" text-anchor="middle" class="fg-t lg">實體記憶體 RAM</text>
<text x="555" y="26" text-anchor="middle" class="fg-t lg">行程 B（虛擬）</text>
<rect x="20" y="40" width="170" height="28" rx="4" class="fg-b warm"/><text x="30" y="58" class="fg-t sm">作業系統核心</text><text x="182" y="58" text-anchor="end" class="fg-t sm">碰不到</text>
<rect x="20" y="74" width="170" height="28" rx="4" class="fg-b"/><text x="30" y="92" class="fg-t sm">堆疊 stack</text><text x="182" y="92" text-anchor="end" class="fg-t sm mono">0x7ffc…</text>
<rect x="20" y="108" width="170" height="44" rx="4" class="fg-l dim dash"/><text x="105" y="134" text-anchor="middle" class="fg-t sm">還沒用到的大片空白</text>
<rect x="20" y="158" width="170" height="28" rx="4" class="fg-b hot"/><text x="30" y="176" class="fg-t sm">共用函式庫 libc</text>
<rect x="20" y="192" width="170" height="28" rx="4" class="fg-b"/><text x="30" y="210" class="fg-t sm">堆積 heap</text><text x="182" y="210" text-anchor="end" class="fg-t sm mono">0x5600…</text>
<rect x="20" y="226" width="170" height="28" rx="4" class="fg-b"/><text x="30" y="244" class="fg-t sm">全域變數</text>
<rect x="20" y="260" width="170" height="28" rx="4" class="fg-b"/><text x="30" y="278" class="fg-t sm">程式碼</text>
<rect x="470" y="40" width="170" height="28" rx="4" class="fg-b warm"/><text x="480" y="58" class="fg-t sm">作業系統核心</text><text x="632" y="58" text-anchor="end" class="fg-t sm">碰不到</text>
<rect x="470" y="74" width="170" height="28" rx="4" class="fg-b"/><text x="480" y="92" class="fg-t sm">堆疊 stack</text><text x="632" y="92" text-anchor="end" class="fg-t sm mono">0x7ffc…</text>
<rect x="470" y="108" width="170" height="44" rx="4" class="fg-l dim dash"/><text x="555" y="134" text-anchor="middle" class="fg-t sm">還沒用到的大片空白</text>
<rect x="470" y="158" width="170" height="28" rx="4" class="fg-b hot"/><text x="480" y="176" class="fg-t sm">共用函式庫 libc</text>
<rect x="470" y="192" width="170" height="28" rx="4" class="fg-b"/><text x="480" y="210" class="fg-t sm">堆積 heap</text><text x="632" y="210" text-anchor="end" class="fg-t sm mono">0x5600…</text>
<rect x="470" y="226" width="170" height="28" rx="4" class="fg-b"/><text x="480" y="244" class="fg-t sm">全域變數</text>
<rect x="470" y="260" width="170" height="28" rx="4" class="fg-b"/><text x="480" y="278" class="fg-t sm">程式碼</text>
<rect x="260" y="40" width="140" height="26" rx="4" class="fg-b alt"/><text x="330" y="57" text-anchor="middle" class="fg-t sm">B 的堆疊</text>
<rect x="260" y="72" width="140" height="26" rx="4" class="fg-b alt"/><text x="330" y="89" text-anchor="middle" class="fg-t sm">A 的堆疊</text>
<rect x="260" y="104" width="140" height="26" rx="4" class="fg-b hot"/><text x="330" y="121" text-anchor="middle" class="fg-t sm acc">libc 程式碼（一份）</text>
<rect x="260" y="136" width="140" height="26" rx="4" class="fg-b"/><text x="330" y="153" text-anchor="middle" class="fg-t sm">（空的）</text>
<rect x="260" y="168" width="140" height="26" rx="4" class="fg-b alt"/><text x="330" y="185" text-anchor="middle" class="fg-t sm">A 的堆積</text>
<rect x="260" y="200" width="140" height="26" rx="4" class="fg-b alt"/><text x="330" y="217" text-anchor="middle" class="fg-t sm">B 的堆積</text>
<rect x="260" y="232" width="140" height="26" rx="4" class="fg-b alt"/><text x="330" y="249" text-anchor="middle" class="fg-t sm">A 的程式碼</text>
<rect x="260" y="264" width="140" height="26" rx="4" class="fg-b alt"/><text x="330" y="281" text-anchor="middle" class="fg-t sm">B 的程式碼</text>
<line x1="190" y1="88" x2="260" y2="85" class="fg-l"/><circle cx="257" cy="85" r="3" class="fg-a"/>
<line x1="190" y1="172" x2="260" y2="117" class="fg-l on"/><circle cx="257" cy="117" r="3" class="fg-a on"/>
<line x1="190" y1="206" x2="260" y2="181" class="fg-l"/><circle cx="257" cy="181" r="3" class="fg-a"/>
<line x1="190" y1="274" x2="260" y2="245" class="fg-l"/><circle cx="257" cy="245" r="3" class="fg-a"/>
<line x1="470" y1="88" x2="400" y2="53" class="fg-l"/><circle cx="403" cy="53" r="3" class="fg-a"/>
<line x1="470" y1="172" x2="400" y2="117" class="fg-l on"/><circle cx="403" cy="117" r="3" class="fg-a on"/>
<line x1="470" y1="206" x2="400" y2="213" class="fg-l"/><circle cx="403" cy="213" r="3" class="fg-a"/>
<line x1="470" y1="274" x2="400" y2="277" class="fg-l"/><circle cx="403" cy="277" r="3" class="fg-a"/>
</svg><figcaption>兩個行程的堆積都在虛擬位址 0x5600…，卻對到不同的實體頁；libc 的程式碼兩邊對到同一份。實體頁散落在哪裡，程式自己完全不知道。</figcaption></figure>
<p>從這張圖可以讀出三件事：</p>
<ol>
<li><b>隔離</b>：A 和 B 的堆積用同一個虛擬位址，卻對到不同的實體頁。A 再怎麼亂寫，也寫不到 B 的頁，因為 A 的分頁表裡根本沒有那一頁。去碰一個沒有對照的位址，CPU 會丟出例外，作業系統送一個 SIGSEGV 訊號把行程砍掉，你看到的就是「Segmentation fault」。</li>
<li><b>共用</b>：兩個行程都用到 C 函式庫（libc）。它的程式碼是唯讀的，所以作業系統讓兩邊對到同一份實體頁。一台機器跑一百個行程，libc 在記憶體裡還是只有一份。</li>
<li><b>最上面那塊是作業系統核心</b>：每個行程的位址空間裡都留著核心的位置，但標成「使用者模式不能碰」。這樣進出系統呼叫時不必換分頁表。2018 年的 Meltdown 漏洞讓這招出了問題，修補方式之一就是把兩邊的分頁表拆開，代價是每次系統呼叫都變慢一點。</li>
</ol>
<h4>先登記，用到才給：為什麼 VSZ 那麼大</h4>
<p>你在 <code>ps</code> 或 <code>top</code> 會看到兩個記憶體數字。<b>VSZ</b>（虛擬大小）是這個行程「登記要用」的位址範圍有多大；<b>RSS</b>（resident set size）是此刻真的放在實體記憶體裡的頁加起來有多大。一個 Node 行程 VSZ 好幾 GB、RSS 只有幾十 MB，非常正常。</p>
<p>原因是作業系統很懶，而且懶得很聰明。程式要 1 GB 記憶體，作業系統先在帳上記一筆「這 1 GB 是你的」，一頁實體記憶體都還沒給。等程式第一次真的去寫某一頁，MMU 查表發現沒有對照，觸發<b>分頁錯誤</b>（page fault）；作業系統這時才找一頁空的實體記憶體填上，再讓程式繼續跑。程式完全感覺不到中間被打斷過。</p>
<ul>
<li><b>小的分頁錯誤</b>（minor fault）：補一個對照就好，例如第一次碰到剛配置的記憶體。大約是微秒以內的事。</li>
<li><b>大的分頁錯誤</b>（major fault）：資料得從磁碟讀回來，例如那一頁之前被搬去 swap 了。要等磁碟，慢上百倍以上。伺服器「慢得像在爬」，背後通常就是大量的 major fault。</li>
</ul>
<p>這套「先登記」有個後果：Linux 預設允許所有行程登記的記憶體加起來超過實體記憶體，叫<b>超額配置</b>（overcommit）。大部分時候沒事，因為大家都只用了登記的一小部分。萬一大家同時真的要用、實體記憶體不夠了，作業系統核心只剩一招：挑一個行程直接砍掉。這就是上一課表格裡的 OOM kill，第七節會看它在正式環境長什麼樣子。</p>

<h3><span class="badge lv2">進階</span>三、系統呼叫：跟著一個 read() 走一趟</h3>
<p>第 0.6 課的深入圖解講過，CPU 有使用者模式和核心模式兩種權限，你的程式碰不到硬體。那 Node 的 <code>fs.readFile</code>、Go 的 <code>os.ReadFile</code> 是怎麼把檔案讀進來的？最後都會變成同一件事：<b>系統呼叫</b>（system call）。我們跟著最基本的一個走一趟：從檔案描述符 3 讀 4096 個位元組到 <code>buf</code>。</p>
<figure class="figure"><svg viewBox="0 0 680 340" class="fg" style="width:100%;max-width:680px" role="img" aria-label="read 系統呼叫的八個步驟，橫跨使用者模式、作業系統核心與硬體三條泳道；頁快取命中時直接複製，沒命中時要等 SSD 和中斷">
<rect x="10" y="10" width="200" height="320" rx="10" class="fg-b"/>
<rect x="240" y="10" width="200" height="320" rx="10" class="fg-b"/>
<rect x="470" y="10" width="200" height="320" rx="10" class="fg-b"/>
<text x="110" y="34" text-anchor="middle" class="fg-t lg">你的程式</text><text x="110" y="52" text-anchor="middle" class="fg-t sm">使用者模式</text>
<text x="340" y="34" text-anchor="middle" class="fg-t lg">作業系統核心</text><text x="340" y="52" text-anchor="middle" class="fg-t sm">核心模式</text>
<text x="570" y="34" text-anchor="middle" class="fg-t lg">硬體</text><text x="570" y="52" text-anchor="middle" class="fg-t sm">SSD、中斷</text>
<rect x="25" y="66" width="170" height="34" rx="6" class="fg-b alt"/><text x="110" y="87" text-anchor="middle" class="fg-t sm mono">① read(3, buf, 4096)</text>
<line x1="110" y1="100" x2="110" y2="108" class="fg-l"/><polygon points="110,116 105.5,108 114.5,108" class="fg-a"/>
<rect x="25" y="116" width="170" height="44" rx="6" class="fg-b"/><text x="110" y="134" text-anchor="middle" class="fg-t sm">② 編號、參數放進暫存器</text><text x="110" y="152" text-anchor="middle" class="fg-t">執行 syscall 指令</text>
<text x="110" y="206" text-anchor="middle" class="fg-t sm">read() 還沒回來</text><text x="110" y="224" text-anchor="middle" class="fg-t sm">程式就停在這一行</text>
<line x1="195" y1="138" x2="247" y2="138" class="fg-l on"/><polygon points="255,138 247,133.5 247,142.5" class="fg-a on"/>
<rect x="255" y="116" width="170" height="44" rx="6" class="fg-b"/><text x="340" y="134" text-anchor="middle" class="fg-t sm">③ 存好你的暫存器</text><text x="340" y="152" text-anchor="middle" class="fg-t">查 fd 3 是哪個檔案</text>
<line x1="340" y1="160" x2="340" y2="170" class="fg-l"/><polygon points="340,178 335.5,170 344.5,170" class="fg-a"/>
<rect x="255" y="178" width="170" height="44" rx="6" class="fg-b warm"/><text x="340" y="196" text-anchor="middle" class="fg-t">④ 頁快取裡有嗎？</text><text x="340" y="214" text-anchor="middle" class="fg-t sm">記憶體裡的檔案副本</text>
<line x1="425" y1="200" x2="477" y2="200" class="fg-l warm"/><polygon points="485,200 477,195.5 477,204.5" class="fg-a warm"/>
<text x="455" y="192" text-anchor="middle" class="fg-t sm warm">沒有</text>
<rect x="485" y="178" width="170" height="44" rx="6" class="fg-b"/><text x="570" y="196" text-anchor="middle" class="fg-t">⑤ 下命令：讀 4 KB</text><text x="570" y="214" text-anchor="middle" class="fg-t sm">SSD 開始讀</text>
<line x1="570" y1="222" x2="570" y2="258" class="fg-l"/><polygon points="570,266 565.5,258 574.5,258" class="fg-a"/>
<text x="580" y="248" class="fg-t sm">約 100 微秒</text>
<line x1="290" y1="222" x2="290" y2="258" class="fg-l on"/><polygon points="290,266 285.5,258 294.5,258" class="fg-a on"/>
<text x="280" y="248" text-anchor="end" class="fg-t sm acc">有</text>
<text x="372" y="248" text-anchor="middle" class="fg-t sm">沒有時：執行緒去睡</text>
<rect x="485" y="266" width="170" height="44" rx="6" class="fg-b"/><text x="570" y="284" text-anchor="middle" class="fg-t">⑥ 讀好了</text><text x="570" y="302" text-anchor="middle" class="fg-t sm">對 CPU 發出中斷</text>
<line x1="485" y1="288" x2="433" y2="288" class="fg-l warm"/><polygon points="425,288 433,283.5 433,292.5" class="fg-a warm"/>
<text x="455" y="280" text-anchor="middle" class="fg-t sm warm">中斷</text>
<rect x="255" y="266" width="170" height="44" rx="6" class="fg-b"/><text x="340" y="284" text-anchor="middle" class="fg-t">⑦ 複製到你的 buf</text><text x="340" y="302" text-anchor="middle" class="fg-t sm">4096 個位元組</text>
<line x1="255" y1="288" x2="203" y2="288" class="fg-l on"/><polygon points="195,288 203,283.5 203,292.5" class="fg-a on"/>
<rect x="25" y="266" width="170" height="44" rx="6" class="fg-b hot"/><text x="110" y="284" text-anchor="middle" class="fg-t acc">⑧ read 回傳 4096</text><text x="110" y="302" text-anchor="middle" class="fg-t sm">切回使用者模式，往下跑</text>
</svg><figcaption>快的路線（頁快取命中）只走 ①②③④⑦⑧，全程在記憶體裡，大約幾微秒；慢的路線多了 ⑤⑥，要等 SSD，這段時間執行緒在睡，CPU 去跑別人。</figcaption></figure>
<ol>
<li><b>呼叫</b>：你的程式呼叫 C 函式庫的 <code>read()</code>。它只是一層薄薄的包裝。</li>
<li><b>準備、敲門</b>：包裝把系統呼叫的編號和三個參數放進約好的暫存器。在 x86-64 的 Linux 上，read 的編號是 0，放在 <code>rax</code>，參數依序放 <code>rdi</code>、<code>rsi</code>、<code>rdx</code>；ARM64 則是把編號 63 放在 <code>x8</code>。接著執行一道特別的指令（x86-64 是 <code>syscall</code>，ARM64 是 <code>svc #0</code>），CPU 切到核心模式，跳到作業系統核心事先登記好的入口。這是使用者程式進核心唯一的一道門。</li>
<li><b>查號碼</b>：核心先把你的暫存器存起來，再到這個行程的檔案描述符表查 3 號，找到它代表哪個已開啟的檔案、目前讀到第幾個位元組。</li>
<li><b>查頁快取</b>：Linux 會把讀過的檔案內容留在記憶體裡，叫<b>頁快取</b>（page cache）。命中的話，直接跳到第 7 步。</li>
<li><b>沒命中，找硬體</b>：核心對 SSD 下一個讀取命令，然後把你的執行緒標成「睡眠」，交給排程器去跑別人。你的程式此刻就是上一課說的<b>阻塞</b>。</li>
<li><b>中斷</b>：SSD 讀好了，對 CPU 發出中斷。核心把資料放進頁快取，叫醒你的執行緒。</li>
<li><b>複製</b>：核心把 4096 個位元組從頁快取複製到你的 <code>buf</code>，把回傳值放進 <code>rax</code>。</li>
<li><b>回家</b>：執行「從系統呼叫返回」的指令，CPU 切回使用者模式，<code>read()</code> 回傳 4096，你的程式接著跑下一行。</li>
</ol>
<h4>回傳值會告訴你三種結果</h4>
<ul>
<li><b>正數</b>：讀到幾個位元組。注意，它可以<b>比你要的少</b>（short read），網路 socket 特別常見：你要 4096，對方目前只送來 1200，就先回 1200。所以正確的程式都是「用迴圈讀到夠為止」。</li>
<li><b>0</b>：讀到檔案結尾，或是對方把連線關了。</li>
<li><b>-1</b>：出錯，原因放在 <code>errno</code>。你在日誌裡看到的 <code>EAGAIN</code>、<code>ECONNRESET</code>、<code>EMFILE</code>、<code>ENOSPC</code>，全部都是這裡來的錯誤代碼。Node 和 Go 只是把它包成例外或 error 而已。</li>
</ul>
<h4>親眼看：strace</h4>
<p>在 Linux 伺服器或 Docker 容器裡，<code>strace</code> 會把一個程式做的每個系統呼叫印出來（Mac 上沒有它，要進 Linux 容器）。讀一個只有「hi」的小檔案：</p>
<pre><code>$ strace -e trace=openat,read,write,close \\
    cat hello.txt &gt; /dev/null
（前面幾行是載入 C 函式庫，先省略）
openat(AT_FDCWD, "hello.txt", O_RDONLY) = 3
read(3, "hi\\n", 131072)                 = 3
write(1, "hi\\n", 3)                     = 3
read(3, "", 131072)                     = 0
close(3)                                = 0</code></pre>
<p>openat 拿到 3 號：0、1、2 已經被標準輸入、輸出、錯誤佔走，作業系統永遠發最小的空號。read 要了 128 KB，只拿到 3 個位元組；write 把它寫到 1 號；再讀一次回傳 0，代表到結尾了；最後 close。</p>
<h4>系統呼叫有多貴</h4>
<p>一次進出核心本身，數量級大約是 0.1 到 1 微秒，看 CPU 和資安修補而定。單看很便宜，一秒做幾十萬次就不便宜了。所以幾乎所有語言都有<b>緩衝</b>（buffer）：Go 的 <code>bufio</code>、C 的 stdio、Node 的串流，都是把很多次小寫入湊成一次大的系統呼叫。日誌每一行都直接寫到磁碟，在高流量時就會吃掉看得出來的 CPU。</p>

<h3><span class="badge lv2">進階</span>四、檔案描述符：一個小號碼，背後三層表</h3>
<p>上一課說檔案描述符是「作業系統核心發回來的號碼」。號碼背後其實有三層：</p>
<figure class="figure"><svg viewBox="0 0 660 250" class="fg" style="width:100%;max-width:660px" role="img" aria-label="檔案描述符的三層：行程的號碼表指向核心裡的已開啟檔案，再指向真正的終端機、磁碟檔案或 TCP 連線；1 號和 2 號指向同一個已開啟檔案">
<text x="95" y="24" text-anchor="middle" class="fg-t lg">行程的號碼表</text>
<text x="330" y="24" text-anchor="middle" class="fg-t lg">核心裡的已開啟檔案</text>
<text x="565" y="24" text-anchor="middle" class="fg-t lg">真正的東西</text>
<rect x="30" y="44" width="130" height="28" rx="4" class="fg-b"/><text x="44" y="63" class="fg-t mono">0</text><text x="62" y="63" class="fg-t sm">標準輸入</text>
<rect x="30" y="80" width="130" height="28" rx="4" class="fg-b hot"/><text x="44" y="99" class="fg-t mono">1</text><text x="62" y="99" class="fg-t sm">標準輸出</text>
<rect x="30" y="116" width="130" height="28" rx="4" class="fg-b hot"/><text x="44" y="135" class="fg-t mono">2</text><text x="62" y="135" class="fg-t sm">標準錯誤</text>
<rect x="30" y="152" width="130" height="28" rx="4" class="fg-b"/><text x="44" y="171" class="fg-t mono">3</text><text x="62" y="171" class="fg-t sm">監聽的 socket</text>
<rect x="250" y="44" width="160" height="28" rx="4" class="fg-b"/><text x="330" y="63" text-anchor="middle" class="fg-t sm">終端機，可讀寫</text>
<rect x="250" y="88" width="160" height="48" rx="4" class="fg-b hot"/><text x="330" y="107" text-anchor="middle" class="fg-t acc">out.log，只寫</text><text x="330" y="126" text-anchor="middle" class="fg-t sm">目前寫到第 2048 位元組</text>
<rect x="250" y="152" width="160" height="28" rx="4" class="fg-b"/><text x="330" y="171" text-anchor="middle" class="fg-t sm">socket，監聽中</text>
<rect x="490" y="44" width="150" height="28" rx="4" class="fg-b alt"/><text x="565" y="63" text-anchor="middle" class="fg-t sm">你的終端機視窗</text>
<rect x="490" y="98" width="150" height="28" rx="4" class="fg-b alt"/><text x="565" y="117" text-anchor="middle" class="fg-t sm">磁碟上的 out.log</text>
<rect x="490" y="152" width="150" height="28" rx="4" class="fg-b alt"/><text x="565" y="171" text-anchor="middle" class="fg-t sm">TCP 連接埠 8080</text>
<line x1="160" y1="58" x2="242" y2="58" class="fg-l"/><polygon points="250,58 242,53.5 242,62.5" class="fg-a"/>
<path d="M160 94 H205 V104 H242" class="fg-l on"/><polygon points="250,104 242,99.5 242,108.5" class="fg-a on"/>
<path d="M160 130 H205 V120 H242" class="fg-l on"/><polygon points="250,120 242,115.5 242,124.5" class="fg-a on"/>
<line x1="160" y1="166" x2="242" y2="166" class="fg-l"/><polygon points="250,166 242,161.5 242,170.5" class="fg-a"/>
<line x1="410" y1="58" x2="482" y2="58" class="fg-l"/><polygon points="490,58 482,53.5 482,62.5" class="fg-a"/>
<line x1="410" y1="112" x2="482" y2="112" class="fg-l"/><polygon points="490,112 482,107.5 482,116.5" class="fg-a"/>
<line x1="410" y1="166" x2="482" y2="166" class="fg-l"/><polygon points="490,166 482,161.5 482,170.5" class="fg-a"/>
<text x="330" y="212" text-anchor="middle" class="fg-t mono">node app.js &gt; out.log 2&gt;&amp;1</text>
<text x="330" y="234" text-anchor="middle" class="fg-t sm">先讓 1 指向 out.log，再讓 2 指向「1 此刻指的那一個」</text>
</svg><figcaption>號碼只是第一層。1 號和 2 號指向核心裡同一個「已開啟檔案」，共用同一個寫入位置，所以輸出和錯誤會照順序寫進同一個檔案。</figcaption></figure>
<ol>
<li><b>每個行程一張號碼表</b>：號碼指向核心裡的一個「已開啟檔案」。</li>
<li><b>核心裡的已開啟檔案</b>（open file description）：記著寫到第幾個位元組、用什麼模式開的。兩個號碼可以指向同一個。</li>
<li><b>真正的東西</b>：磁碟上的檔案、一條 TCP 連線、一條管線（pipe）、一個終端機。</li>
</ol>
<p>Unix 那句有名的「一切都是檔案」，意思就是：不管背後是什麼，前面都是一個號碼，都用同一組 read、write、close 去操作。網路連線、管線，甚至 epoll 本身，都是檔案描述符。</p>
<h4>2&gt;&amp;1 到底做了什麼</h4>
<p>你一定寫過 <code>node app.js &gt; out.log 2&gt;&amp;1</code>。shell 由左往右做：先打開 out.log，讓 1 號指向它；再執行 <code>dup2(1, 2)</code>，讓 2 號指向「1 號此刻指向的那個已開啟檔案」。</p>
<p>順序反過來寫成 <code>node app.js 2&gt;&amp;1 &gt; out.log</code>，結果就不同了：做 <code>2&gt;&amp;1</code> 的那一刻，1 號還指著終端機，所以 2 號也指向終端機；之後 1 號才改指 out.log。錯誤訊息還是印在螢幕上，檔案裡一行都沒有。很多人「明明有導向，錯誤卻沒進日誌」，就是這個原因。</p>
<h4>too many open files</h4>
<p>每個行程能拿的號碼有上限（<code>ulimit -n</code>，很多 Linux 發行版預設的軟上限是 1024）。一台反向代理伺服器每服務一個請求，至少要兩個號碼：一個給使用者的連線，一個給後端的連線。一千多個同時連線就撞牆了，<code>accept()</code> 和 <code>open()</code> 開始回傳 <code>EMFILE</code>，日誌裡就出現「too many open files」。這時有兩種可能：</p>
<ul>
<li><b>真的連線很多</b>：把上限調高。systemd 服務用 <code>LimitNOFILE=</code>，nginx 用 <code>worker_rlimit_nofile</code>。</li>
<li><b>其實是洩漏</b>：號碼借了沒還。Go 最經典的錯誤是忘了 <code>resp.Body.Close()</code>，每個 HTTP 回應都佔著一條連線不放。分辨的方法：號碼數會不會隨時間一直漲，而且流量降下來也不回落。</li>
</ul>
<pre><code># 這個行程現在拿著幾個號碼
$ ls /proc/$PID/fd | wc -l
# 它的上限：軟上限、硬上限
$ grep 'open files' /proc/$PID/limits
Max open files      1024      524288      files</code></pre>

<h3><span class="badge lv2">進階</span>五、排程：下一個上 CPU 的是誰</h3>
<p>一台 4 核心的機器上，常常有幾百條執行緒。任何一刻最多只有 4 條真的在跑，其他的不是在排隊，就是在睡。每條執行緒一輩子都在這幾個狀態之間跳：</p>
<figure class="figure"><svg viewBox="0 0 660 280" class="fg" style="width:100%;max-width:660px" role="img" aria-label="執行緒的狀態圖：可執行、執行中、睡眠、殭屍四個狀態，以及在它們之間移動的原因">
<line x1="115" y1="40" x2="115" y2="82" class="fg-l"/><polygon points="115,90 110.5,82 119.5,82" class="fg-a"/>
<text x="125" y="62" class="fg-t sm">新建立</text>
<rect x="40" y="90" width="150" height="48" rx="8" class="fg-b"/><text x="115" y="110" text-anchor="middle" class="fg-t">可執行 R</text><text x="115" y="128" text-anchor="middle" class="fg-t sm">排隊等 CPU</text>
<rect x="270" y="90" width="130" height="48" rx="8" class="fg-b hot"/><text x="335" y="110" text-anchor="middle" class="fg-t acc">執行中 R</text><text x="335" y="128" text-anchor="middle" class="fg-t sm">正在用 CPU</text>
<rect x="480" y="90" width="150" height="48" rx="8" class="fg-b alt"/><text x="555" y="110" text-anchor="middle" class="fg-t alt">睡眠 S／D</text><text x="555" y="128" text-anchor="middle" class="fg-t sm">等 I/O、計時器、鎖</text>
<line x1="190" y1="104" x2="262" y2="104" class="fg-l on"/><polygon points="270,104 262,99.5 262,108.5" class="fg-a on"/>
<text x="230" y="96" text-anchor="middle" class="fg-t sm acc">被選中</text>
<line x1="270" y1="126" x2="198" y2="126" class="fg-l"/><polygon points="190,126 198,121.5 198,130.5" class="fg-a"/>
<text x="230" y="146" text-anchor="middle" class="fg-t sm">時間片用完</text>
<line x1="400" y1="114" x2="472" y2="114" class="fg-l alt"/><polygon points="480,114 472,109.5 472,118.5" class="fg-a alt"/>
<text x="440" y="106" text-anchor="middle" class="fg-t sm">呼叫 read()</text>
<path d="M555 138 V262 H115 V146" class="fg-l alt"/><polygon points="115,138 110.5,146 119.5,146" class="fg-a alt"/>
<text x="470" y="256" text-anchor="middle" class="fg-t sm alt">資料到了，被叫醒</text>
<line x1="335" y1="138" x2="335" y2="192" class="fg-l warm"/><polygon points="335,200 330.5,192 339.5,192" class="fg-a warm"/>
<text x="345" y="172" class="fg-t sm">exit()</text>
<rect x="270" y="200" width="130" height="44" rx="8" class="fg-b warm"/><text x="335" y="220" text-anchor="middle" class="fg-t warm">殭屍 Z</text><text x="335" y="237" text-anchor="middle" class="fg-t sm">等父行程 wait()</text>
</svg><figcaption>一條執行緒一輩子就在這幾個狀態之間跳。ps 的 STAT 欄、top 的 S 欄，顯示的就是這些字母。</figcaption></figure>
<ul>
<li><b>R（可執行或執行中）</b>：想跑。可能正在某顆 CPU 核心上跑，也可能在排隊（run queue）。</li>
<li><b>S（睡眠）</b>：在等某件事：網路封包、計時器、一把鎖。可以被訊號叫醒。閒著的伺服器，絕大部分執行緒都是 S。</li>
<li><b>D（不可中斷的睡眠）</b>：通常在等磁碟。這段時間連 <code>kill -9</code> 都要等它醒來才生效。一堆行程卡在 D，八成是儲存裝置或網路磁碟（NFS）出事了。</li>
<li><b>Z（殭屍）</b>：已經結束，但父行程還沒來收它的結束代碼。第八節會講它在容器裡為什麼會出問題。</li>
</ul>
<h4>排程器怎麼選</h4>
<p>Linux 的<b>排程器</b>（scheduler）追求公平：每條執行緒都記著自己已經用了多少 CPU 時間（依優先權加權），每次都挑「最吃虧」的那條上場。跑了一小段時間，計時器中斷一來，排程器就再看一次要不要換人，這叫<b>搶先</b>（preemption）。所以就算有一條執行緒寫成無窮迴圈，其他程式也不會完全卡死。從 2007 年起 Linux 用的是 CFS，6.6 版換成 EEVDF，概念一樣是公平分配，後者對「很在意延遲」的工作比較友善。</p>
<p><code>nice</code> 值從 -20 到 19，數字越大越「客氣」，每差一級大約差 10% 的 CPU 份量。備份、壓縮這類不急的工作用 <code>nice -n 19</code> 跑，就不會搶走線上服務的 CPU。</p>
<h4>load average 怎麼讀</h4>
<pre><code>$ uptime
 14:02:11 up 12 days, … load average: 7.91, 4.20, 1.88</code></pre>
<p>三個數字是過去 1、5、15 分鐘裡，平均有幾條執行緒「想跑，或在等磁碟」（R 加上 D）。要拿它跟 CPU 核心數比。一台 4 核心的機器，1 分鐘是 7.91、15 分鐘只有 1.88，代表負載正在快速上升，平均每顆核心前面都有一條在排隊。要注意 Linux 把 D 也算進去，所以 load 很高、CPU 卻很閒，通常是磁碟或網路磁碟卡住了，不是運算力不夠。</p>
<h4>容器裡的 CPU 上限：看起來沒滿，卻一直卡</h4>
<p>在 Kubernetes 設 <code>limits.cpu: "1"</code>，底下是 cgroup 的 CPU 配額：每 100 毫秒為一期，這一期裡最多用 100 毫秒的 CPU 時間。如果你的程式有 4 條執行緒同時在算，它們 25 毫秒就把整期配額用完，接下來 75 毫秒全部被<b>節流</b>（throttle），一起停住。平均 CPU 使用率看起來只有一顆，請求延遲卻多出幾十毫秒的尖刺。容器的 <code>cpu.stat</code> 裡 <code>nr_throttled</code> 一直在漲，就是它。</p>
<p>所以「執行緒數要跟可用的 CPU 對齊」很重要。Go 1.25 之前，<code>GOMAXPROCS</code> 預設等於整台主機的核心數，不看容器的限制，大家會另外裝 uber 的 automaxprocs 套件；從 1.25 起，Go 執行環境會自己讀 cgroup 的 CPU 上限。</p>

<h3><span class="badge lv3">專業</span>六、同時服務一萬個連線：執行緒派與事件迴圈派</h3>
<p>1999 年有一篇有名的文章叫「C10K 問題」：一台伺服器要怎麼同時撐住一萬個連線？到今天，答案還是兩條路，你用的每一套伺服器軟體都選了其中一條。</p>
<figure class="figure"><svg viewBox="0 0 660 270" class="fg" style="width:100%;max-width:660px" role="img" aria-label="兩種模型的時間軸比較：上面三條執行緒各自卡著等；下面一條事件迴圈輪流處理 A、B、C，中間一段同步重活讓所有人一起等">
<text x="20" y="24" class="fg-t lg">做法一：一個連線一條執行緒</text>
<text x="640" y="24" text-anchor="end" class="fg-t sm">時間 →</text>
<text x="20" y="55" class="fg-t">執行緒 A</text>
<rect x="120" y="40" width="30" height="20" rx="3" class="fg-b hot"/>
<rect x="150" y="40" width="200" height="20" rx="3" class="fg-l dim dash"/><text x="250" y="54" text-anchor="middle" class="fg-t sm">睡著等網路</text>
<rect x="350" y="40" width="24" height="20" rx="3" class="fg-b hot"/>
<rect x="374" y="40" width="150" height="20" rx="3" class="fg-l dim dash"/>
<rect x="524" y="40" width="30" height="20" rx="3" class="fg-b hot"/>
<text x="20" y="83" class="fg-t">執行緒 B</text>
<rect x="140" y="68" width="24" height="20" rx="3" class="fg-b hot"/>
<rect x="164" y="68" width="120" height="20" rx="3" class="fg-l dim dash"/><text x="224" y="82" text-anchor="middle" class="fg-t sm">等資料庫</text>
<rect x="284" y="68" width="40" height="20" rx="3" class="fg-b hot"/>
<rect x="324" y="68" width="230" height="20" rx="3" class="fg-l dim dash"/>
<rect x="554" y="68" width="24" height="20" rx="3" class="fg-b hot"/>
<text x="20" y="111" class="fg-t">執行緒 C</text>
<rect x="120" y="96" width="90" height="20" rx="3" class="fg-l dim dash"/>
<rect x="210" y="96" width="30" height="20" rx="3" class="fg-b hot"/>
<rect x="240" y="96" width="260" height="20" rx="3" class="fg-l dim dash"/><text x="370" y="110" text-anchor="middle" class="fg-t sm">睡著等網路</text>
<rect x="500" y="96" width="30" height="20" rx="3" class="fg-b hot"/>
<text x="120" y="138" class="fg-t sm">每條都能放心地卡著等；代價是每條一塊堆疊，輪流上 CPU 要切換</text>
<text x="20" y="170" class="fg-t lg">做法二：一條執行緒＋事件迴圈</text>
<text x="20" y="199" class="fg-t">主執行緒</text>
<rect x="120" y="184" width="26" height="24" rx="3" class="fg-b hot"/><text x="133" y="200" text-anchor="middle" class="fg-t sm">A</text>
<rect x="148" y="184" width="26" height="24" rx="3" class="fg-b hot"/><text x="161" y="200" text-anchor="middle" class="fg-t sm">B</text>
<rect x="176" y="184" width="26" height="24" rx="3" class="fg-b hot"/><text x="189" y="200" text-anchor="middle" class="fg-t sm">C</text>
<rect x="204" y="184" width="26" height="24" rx="3" class="fg-b hot"/><text x="217" y="200" text-anchor="middle" class="fg-t sm">A</text>
<rect x="260" y="184" width="220" height="24" rx="3" class="fg-b warm"/><text x="370" y="200" text-anchor="middle" class="fg-t sm warm">A 的同步重活 200 毫秒</text>
<rect x="482" y="184" width="26" height="24" rx="3" class="fg-b hot"/><text x="495" y="200" text-anchor="middle" class="fg-t sm">B</text>
<rect x="510" y="184" width="26" height="24" rx="3" class="fg-b hot"/><text x="523" y="200" text-anchor="middle" class="fg-t sm">C</text>
<rect x="538" y="184" width="26" height="24" rx="3" class="fg-b hot"/><text x="551" y="200" text-anchor="middle" class="fg-t sm">B</text>
<line x1="370" y1="236" x2="370" y2="216" class="fg-l warm"/><polygon points="370,208 365.5,216 374.5,216" class="fg-a warm"/>
<text x="370" y="252" text-anchor="middle" class="fg-t sm warm">這段時間 B、C 的資料到了，也只能乾等</text>
</svg><figcaption>上面：虛線框是睡著等的時間，誰的資料到了，作業系統就叫醒誰。下面：一條執行緒輪流處理所有人，非常省；但只要一段同步重活（橘色），所有人一起卡住。</figcaption></figure>
<h4>路線一：一個連線一條執行緒</h4>
<p>每條執行緒都可以放心呼叫會阻塞的 <code>read()</code>：沒資料就睡，作業系統負責在資料到了的時候叫醒對的那一條。程式碼很直覺，從上寫到下就好。代價有兩個：</p>
<ul>
<li><b>記憶體</b>：每條執行緒要一塊堆疊。Linux 上 C 程式的執行緒預設登記 8 MB（虛擬的，真的用多少才佔多少），Java 預設 1 MB。一萬條執行緒，光是堆疊就很可觀。</li>
<li><b>切換</b>：一萬條執行緒輪流上 CPU，每次切換都要存取整組暫存器、洗掉一部分快取。連線越多，越多時間花在切換本身。</li>
</ul>
<h4>路線二：一條執行緒，加上事件迴圈</h4>
<p>把所有 socket 設成<b>非阻塞</b>（non-blocking）：沒資料時 <code>read()</code> 不睡，直接回傳 <code>EAGAIN</code>，意思是「現在沒有，等一下再來」。然後用一個系統呼叫一次問作業系統：「這一萬個號碼裡，哪幾個有動靜了？」Linux 上這個呼叫叫 <b>epoll</b>，macOS 和 BSD 是 kqueue，Windows 是 IOCP。</p>
<pre><code>for (;;) {
  // 睡到有人有動靜，醒來時拿到 n 個「有事」的號碼
  n = epoll_wait(ep, events, 1024, timeout);
  // 一個一個處理，絕對不能卡
  for (i = 0; i &lt; n; i++)
    handle(events[i]);
}</code></pre>
<p>這就是<b>事件迴圈</b>（event loop）的全部骨架。Node 的 libuv、nginx、Redis，裡面都是這個迴圈。一條執行緒、一塊堆疊、幾乎不用切換，一萬個連線只是一萬個號碼，記憶體非常省。代價就是圖下半那塊橘色：<code>handle()</code> 裡只要有一段同步的重活，例如解析一個 50 MB 的 JSON、同步版的 bcrypt、一個寫壞了的正規表示式，迴圈就回不去 <code>epoll_wait</code>，所有連線一起等。</p>
<h4>Node 的細節：不是真的只有一條執行緒</h4>
<ul>
<li>你的 JavaScript 跑在一條主執行緒上，這一條是唯一的。</li>
<li>網路 I/O 走 epoll，不需要額外的執行緒。</li>
<li>讀寫檔案、<code>dns.lookup</code>、一部分 <code>crypto</code> 和 <code>zlib</code>，作業系統沒有好用的非阻塞介面，libuv 就丟給一個<b>工作執行緒池</b>（thread pool），預設 4 條，用 <code>UV_THREADPOOL_SIZE</code> 可以調。同時有 5 個 pbkdf2 在算，第 5 個就得排隊。</li>
<li>要用滿多顆 CPU 核心：開多個 Node 行程（cluster 模組、PM2、Kubernetes 多個副本），或把 CPU 重活放進 <code>worker_threads</code>。</li>
<li>量迴圈有沒有被卡住：<code>perf_hooks.monitorEventLoopDelay()</code> 會告訴你迴圈每一圈晚了多少毫秒。這個數字應該放進監控。</li>
</ul>
<h4>第三條路：看起來像執行緒，底下是事件迴圈</h4>
<p>Go 的 goroutine 讓你照路線一的方式寫：每個連線一個 goroutine，放心呼叫會阻塞的讀取。但 goroutine 不是作業系統的執行緒。Go 執行環境把成千上萬個 goroutine 排到少數幾條作業系統執行緒上（數量由 <code>GOMAXPROCS</code> 決定）。某個 goroutine 要讀網路時，執行環境把它停下來，把那個 socket 交給內建的 epoll（叫 netpoller），先讓別的 goroutine 上場，資料到了再把它排回去。寫起來像路線一，跑起來像路線二。Java 21 的虛擬執行緒（virtual thread）也是同一個思路。</p>

<h3><span class="badge lv3">專業</span>七、從裡面看一個伺服器行程</h3>
<p>到了正式環境，一個伺服器行程從裡面看長什麼樣子？Linux 把每個行程的內臟都攤在 <code>/proc/PID/</code> 底下，用讀檔案的方式就能看。下面是一個 Node 伺服器（數字是示意）：</p>
<pre><code>$ PID=$(pgrep -f "node server.js")
$ grep -E 'State|VmRSS|Threads|ctxt' /proc/$PID/status
State:  S (sleeping)
VmRSS:     84212 kB
Threads:   11
voluntary_ctxt_switches:     182340
nonvoluntary_ctxt_switches:  97
$ ls -l /proc/$PID/fd
... 0 -&gt; /dev/null
... 1 -&gt; pipe:[40211]
... 18 -&gt; socket:[51874]
... 19 -&gt; anon_inode:[eventpoll]
$ ss -tlnp | grep 8080
LISTEN 0  511  *:8080  *:*  users:(("node",pid=4127,fd=18))</code></pre>
<ul>
<li><b>State: S</b>：閒著在等連線，正常。如果一直是 R，代表它一直在算；一直是 D，去查磁碟。</li>
<li><b>Threads: 11</b>：一條跑 JavaScript，幾條是 V8 的幫手（垃圾回收、背景編譯），用過檔案或 DNS 之後再多 libuv 的 4 條。閒著的 Node 通常是七到十幾條，看版本而定。重點是它<b>不會跟著連線數變多</b>。如果一個服務的執行緒數一直隨流量往上長，它用的就是「一個請求一條執行緒」的模型。</li>
<li><b>兩種切換次數</b>：自願切換（voluntary）是自己去睡、等 I/O；非自願切換（nonvoluntary）是時間片用完被趕下來。非自願的比例很高，代表 CPU 不夠分，大家在搶。</li>
<li><b>fd 18 是 socket，ss 說它在聽 8080</b>；fd 19 是 epoll 本身。用這兩招，就能回答「是哪個行程佔了這個連接埠」。</li>
</ul>
<h4>記憶體出事的四種樣子</h4>
<table>
<tr><th>現象</th><th>你會看到</th><th>發生了什麼</th><th>怎麼辦</th></tr>
<tr><td>行程突然消失</td><td><code>dmesg</code> 裡有 Out of memory: Killed process；容器結束代碼 137；Kubernetes 顯示 OOMKilled</td><td>實體記憶體或容器的記憶體上限用完，作業系統核心挑一個行程送 SIGKILL</td><td>先找是誰在長：洩漏，還是真的需要這麼多</td></tr>
<tr><td>整台慢到不行</td><td><code>vmstat 1</code> 的 si、so 欄不是 0；大量 major fault</td><td>記憶體不夠，頁一直被搬去 swap 又搬回來（thrashing）</td><td>減少用量或加記憶體。Kubernetes 傳統上要求節點關掉 swap</td></tr>
<tr><td>記憶體一路往上爬</td><td>RSS 隨時間持續上升，重啟就好，過幾天又來</td><td>洩漏：程式一直抓著不再用的資料，例如全域快取、忘了移除的監聽器</td><td>比對兩個時間點的 heap snapshot，看誰多出來</td></tr>
<tr><td>Node 自己喊停</td><td>FATAL ERROR: … JavaScript heap out of memory</td><td>不是作業系統砍的，是 V8 的堆積撞到它自己的上限</td><td><code>--max-old-space-size</code> 要比容器上限小一截，留空間給 Buffer 和原生記憶體</td></tr>
</table>
<div class="note"><b>free 很少不用慌。</b>Linux 會把沒在用的記憶體拿去當頁快取，要用時隨時讓出來。<code>free -m</code> 要看的是 available 那一欄，不是 free。</div>

<h3><span class="badge lv4">專家</span>八、行程的生與死：fork、exec、訊號，和容器裡的 PID 1</h3>
<p>Unix 生一個新行程分兩步。<b>fork</b>：把自己複製一份，連檔案描述符都一起繼承，所以子行程也拿得到父行程的 0、1、2。<b>exec</b>：把這份複本的位址空間整個換成另一支程式。shell 執行 <code>ls</code>，就是先 fork 自己，再在子行程裡 exec 成 ls。</p>
<p>複製整個位址空間聽起來很貴，但 fork 其實很快，因為用了<b>寫入時複製</b>（copy-on-write）：一開始父子共用全部的實體頁，都標成唯讀，誰先寫某一頁，才把那一頁複製一份。Redis 存快照（BGSAVE）就是 fork 一個子行程去寫磁碟，父行程繼續服務。陷阱在於：存快照期間如果寫入很多，被改到的頁都要複製，記憶體用量最多可能逼近兩倍。記憶體抓得太緊的機器，常常就在半夜存快照時被 OOM。</p>
<h4>訊號：作業系統拍你的肩膀</h4>
<p><b>訊號</b>（signal）是作業系統送給行程的小通知。最常碰到的幾個：</p>
<table>
<tr><th>訊號</th><th>編號</th><th>誰送的</th><th>預設會怎樣</th></tr>
<tr><td>SIGINT</td><td>2</td><td>你按 Ctrl+C</td><td>結束</td></tr>
<tr><td>SIGTERM</td><td>15</td><td><code>kill</code>、<code>docker stop</code>、Kubernetes 要關 Pod</td><td>結束；程式可以攔下來先收尾</td></tr>
<tr><td>SIGKILL</td><td>9</td><td><code>kill -9</code>、OOM killer、寬限期到了</td><td>立刻結束，攔不住，也沒有機會收尾</td></tr>
<tr><td>SIGSEGV</td><td>11</td><td>碰了沒有對照的記憶體</td><td>當掉</td></tr>
</table>
<p>行程被訊號殺掉時，shell 和容器看到的結束代碼是 128 加上訊號編號：137 是 SIGKILL（9），143 是 SIGTERM（15），139 是 SIGSEGV（11）。在 Kubernetes 看到 137，第一個懷疑的對象就是記憶體上限。</p>
<figure class="figure"><svg viewBox="0 0 660 240" class="fg" style="width:100%;max-width:660px" role="img" aria-label="關機時間軸：有處理 SIGTERM 的程式幾秒內收尾並以 0 結束；不處理訊號的 PID 1 一直跑到寬限期結束，被 SIGKILL 砍掉，結束代碼 137">
<text x="20" y="72" class="fg-t">有處理 SIGTERM</text>
<text x="20" y="152" class="fg-t">PID 1 沒處理</text>
<line x1="130" y1="30" x2="130" y2="42" class="fg-l alt"/><polygon points="130,50 125.5,42 134.5,42" class="fg-a alt"/>
<text x="138" y="36" class="fg-t sm alt">SIGTERM</text>
<rect x="130" y="50" width="130" height="36" rx="5" class="fg-b hot"/><text x="195" y="73" text-anchor="middle" class="fg-t sm">做完手上的請求</text>
<circle cx="272" cy="68" r="5" class="fg-lamp on"/><text x="284" y="72" class="fg-t acc">exit 0，乾淨結束</text>
<line x1="130" y1="110" x2="130" y2="122" class="fg-l alt"/><polygon points="130,130 125.5,122 134.5,122" class="fg-a alt"/>
<text x="138" y="116" class="fg-t sm alt">SIGTERM</text>
<rect x="130" y="130" width="430" height="36" rx="5" class="fg-b"/><text x="345" y="153" text-anchor="middle" class="fg-t sm">訊號被忽略：照常在跑，什麼都沒收尾</text>
<line x1="560" y1="40" x2="560" y2="92" class="fg-l dim dash"/>
<line x1="560" y1="100" x2="560" y2="122" class="fg-l warm"/><polygon points="560,130 555.5,122 564.5,122" class="fg-a warm"/>
<text x="568" y="114" class="fg-t sm warm">SIGKILL</text>
<text x="568" y="153" class="fg-t warm">exit 137</text>
<line x1="120" y1="196" x2="632" y2="196" class="fg-l dim"/><polygon points="640,196 632,191.5 632,200.5" class="fg-a"/>
<line x1="130" y1="190" x2="130" y2="202" class="fg-l"/><line x1="260" y1="190" x2="260" y2="202" class="fg-l"/><line x1="560" y1="190" x2="560" y2="202" class="fg-l"/>
<text x="130" y="220" text-anchor="middle" class="fg-t sm">0 秒</text>
<text x="260" y="220" text-anchor="middle" class="fg-t sm">幾秒</text>
<text x="560" y="220" text-anchor="middle" class="fg-t sm">10 秒（Docker）／30 秒（K8s）</text>
</svg><figcaption>關機的流程是「先禮後兵」：先送 SIGTERM 讓你收尾，寬限期到了才送 SIGKILL。不處理 SIGTERM，每次部署都要白等滿整段寬限期，手上的請求還是被硬切。</figcaption></figure>
<h4>容器裡的 PID 1 陷阱</h4>
<p>在容器裡，你的程式通常就是 PID 1。作業系統對 PID 1 特別客氣：凡是它沒有自己安裝處理函式的訊號，一律<b>不執行預設動作</b>。換句話說，一個沒寫 SIGTERM 處理的 Node 程式當 PID 1，收到 SIGTERM 會什麼都不做。docker stop 等滿 10 秒、Kubernetes 等滿 30 秒，才送 SIGKILL 硬砍。解法有三個，通常一起用：</p>
<ul>
<li><b>在程式裡處理 SIGTERM</b>：停止接新連線、做完手上的請求、關掉資料庫連線，再結束。這叫<b>優雅關機</b>（graceful shutdown）。</li>
<li><b>Dockerfile 用 exec 格式</b>：<code>CMD ["node", "server.js"]</code>。寫成 <code>CMD node server.js</code> 的話，PID 1 會是 <code>/bin/sh</code>，而 sh 不會把訊號轉給你的程式。</li>
<li><b>放一個小小的 init</b>：<code>docker run --init</code>，或在映像檔裡放 tini。讓它當 PID 1，負責轉發訊號、收殭屍。</li>
</ul>
<p>收殭屍也是 PID 1 的工作。子行程結束後，父行程要呼叫 <code>wait()</code> 收走它的結束代碼，殭屍才會消失；父行程先死的話，孤兒會被過繼給 PID 1。如果你的 PID 1 是一支不會 wait 的程式，又常常開子行程（例如開無頭瀏覽器截圖），殭屍就會越積越多，最後把 PID 用光，連 <code>ls</code> 都開不起來。</p>

<h3><span class="badge lv4">專家</span>九、再往下一層：少有人看見的幾件事</h3>
<ul>
<li><b>Linux 裡其實沒有「執行緒」這種東西</b>：作業系統核心只認得一種東西，叫 task。建立執行緒和建立行程用的是同一個系統呼叫 <code>clone()</code>，差別只在旗標：加了 <code>CLONE_VM</code>、<code>CLONE_FILES</code>，就共用位址空間和號碼表，看起來就是執行緒。所以每條執行緒都有自己的編號（TID），列在 <code>/proc/PID/task/</code> 底下；你平常說的 PID，其實是「這一組 task 的組長」的編號。</li>
<li><b>有些「系統呼叫」不用進核心</b>：讀時間的 <code>clock_gettime</code> 太常用了，Linux 把它做成 vDSO：核心把一小段程式碼和時間資料映射進每個行程，直接在使用者模式讀，省掉一次進出。</li>
<li><b>io_uring</b>（Linux 5.1 起）：程式和核心共用兩個環狀佇列，一個放「要做的事」、一個放「做完的結果」，大量 I/O 幾乎不需要系統呼叫。效能很好，但它也曾是核心漏洞的大宗來源，有些大公司在正式環境把它關掉。</li>
<li><b>seccomp</b>：規定一個行程只能用哪些系統呼叫。Docker 預設的設定檔大約擋掉四十幾個危險的系統呼叫，例如重開機、載入核心模組。容器的隔離，靠的是 namespace（看不到別人）、cgroup（用量不能超過）和 seccomp（有些事做不到）。模組 2 和模組 5 會再展開。</li>
</ul>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>執行緒越多越快</td><td>超過 CPU 核心數之後，多出來的執行緒只是在排隊和切換。I/O 為主的工作可以多開一些，CPU 為主的工作接近核心數最好。</td></tr>
<tr><td>free 很少，記憶體就快用完了</td><td>Linux 把閒置記憶體拿去當頁快取，隨時讓出。要看 available。</td></tr>
<tr><td>VSZ 很大，就是吃很多記憶體</td><td>VSZ 只是登記的位址範圍，真的佔用要看 RSS。</td></tr>
<tr><td><code>kill -9</code> 是正常的關法</td><td>SIGKILL 不給程式收尾的機會，連線被硬切、緩衝裡的資料會遺失。應該先送 SIGTERM，等不到才用 -9。</td></tr>
<tr><td>load average 就是 CPU 使用率</td><td>它算的是「想跑加上在等磁碟」的執行緒數量，要跟核心數比；磁碟卡住也會讓它飆高。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>Node.js／TypeScript 後端</b>：同步重活會卡住所有使用者。把 CPU 重活放進 <code>worker_threads</code> 或另一個服務；把迴圈延遲放進監控；在容器裡處理 SIGTERM，做好優雅關機。</li>
<li><b>Go</b>：goroutine 很便宜，但每個 HTTP 回應都要 <code>resp.Body.Close()</code>；在容器裡確認 <code>GOMAXPROCS</code> 跟 CPU 上限對得上。</li>
<li><b>Docker／Kubernetes</b>：看到 137 先查記憶體上限；部署很慢先查 PID 1 有沒有處理 SIGTERM；延遲有尖刺但 CPU 不高，查 CPU 節流。</li>
<li><b>遊戲前端（Cocos、Unity 網頁版）</b>：瀏覽器裡的遊戲同樣只有一條主執行緒，一格畫面 16.7 毫秒的預算，跟「事件迴圈不能卡」是同一個道理。第 0.12 課會從瀏覽器這一側再講一次。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<p>下面是後端、DevOps、遊戲伺服器面試裡真的會出現的題目。先自己出聲講一遍，再打開參考答案。</p>
<ol>
<li>「行程和執行緒差在哪？什麼時候選多行程，什麼時候選多執行緒？」</li>
<li>「呼叫 <code>read()</code> 讀一個檔案，從你的程式到硬體，中間發生了什麼？」</li>
<li>「Node.js 是單執行緒，為什麼還能同時服務上萬個連線？它的弱點是什麼？」</li>
<li>「一個容器一直被重啟，結束代碼是 137。你會怎麼查？」</li>
<li>「虛擬記憶體是什麼？VSZ 和 RSS 有什麼不同？」</li>
<li>「為什麼 <code>docker stop</code> 常常要等 10 秒？怎麼讓它馬上、而且乾淨地停下來？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>行程是程式執行起來的實例，有自己的位址空間、檔案描述符表和 PID；執行緒是行程裡的執行路線，共用位址空間和檔案描述符，只各自擁有暫存器和堆疊。執行緒溝通便宜，但一條出錯會拖垮整個行程，共用資料也要上鎖；行程彼此隔離比較安全，但溝通要透過作業系統，成本較高。要隔離故障或權限（例如瀏覽器每個網站一個行程、多個 Node 行程分攤 CPU）選行程；要大量共用記憶體、低延遲溝通選執行緒。</li>
<li>C 函式庫把系統呼叫編號和參數放進暫存器，執行 syscall 指令切到核心模式。核心查行程的檔案描述符表找到已開啟的檔案，再查頁快取：命中就直接複製到使用者的緩衝區；沒命中就對儲存裝置下命令，把執行緒設成睡眠、排程別人，等裝置用中斷通知完成後再叫醒它、複製資料。最後切回使用者模式，回傳讀到的位元組數，可能比要求的少，0 代表結尾，-1 代表錯誤並設定 errno。</li>
<li>JavaScript 跑在單一執行緒的事件迴圈上，網路 I/O 用非阻塞 socket 加上 epoll（或 kqueue）一次等待大量連線，誰有資料就處理誰，一萬個連線只是一萬個檔案描述符，不需要一萬條執行緒。檔案 I/O、DNS 查詢和部分加密運算交給 libuv 的執行緒池。弱點是 CPU 密集的同步工作會卡住迴圈，讓所有請求一起變慢，而且一個行程只用得到一顆 CPU 核心；對策是 worker_threads、多行程，並且監控事件迴圈延遲。</li>
<li>137 是 128 加 9，代表被 SIGKILL 砍掉，最常見的原因是超過記憶體上限被 OOM kill。先用 <code>kubectl describe pod</code> 看 Last State 是不是 OOMKilled，再看記憶體監控的曲線：是一路往上爬（洩漏），還是遇到某種請求就暴衝（真的需要）。前者用 heap snapshot 找洩漏，後者調高上限或改寫那段處理。如果不是 OOM，再查是不是存活探針（liveness probe）失敗、寬限期到了被強制砍掉。</li>
<li>每個行程看到的是一套虛擬位址，CPU 的 MMU 依照作業系統維護的分頁表，以頁為單位把它換成實體位址。這提供隔離、讓唯讀的函式庫可以共用，也讓作業系統用到才配置實體記憶體。VSZ 是行程登記的虛擬位址空間總大小，RSS 是此刻實際放在實體記憶體裡的部分；判斷記憶體壓力要看 RSS，VSZ 大通常沒有意義。</li>
<li>docker stop 先送 SIGTERM，預設等 10 秒還沒結束才送 SIGKILL。常見原因是程式當 PID 1 又沒有處理 SIGTERM，作業系統對 PID 1 不執行預設動作，所以訊號被忽略；或者 CMD 用 shell 格式，PID 1 是不轉發訊號的 sh。解法：程式裡處理 SIGTERM 做優雅關機、CMD 用 exec 格式、必要時加 <code>--init</code>（tini）。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li><code>./app &gt; out.log 2&gt;&amp;1</code> 和 <code>./app 2&gt;&amp;1 &gt; out.log</code>，錯誤訊息各會跑到哪裡？畫出兩種情況下 0、1、2 號各指向什麼。</li>
<li>一台 4 核心的機器，load average 是 12、12、12，CPU 使用率卻只有 15%。最可能是什麼狀況？你下一個指令會打什麼？</li>
<li>寫一段會卡住 Node 事件迴圈的程式：用 <code>setInterval</code> 每 100 毫秒印一次距離上次的毫秒數，中間插一個跑 2 秒的同步迴圈。觀察印出來的數字，再說明它為什麼不是 100。</li>
<li>一個 Java 服務開了 2,000 條執行緒，每條堆疊 1 MB。它的 VSZ 至少多出多少？RSS 會不會因此多出 2 GB？為什麼？</li>
<li>只把 Dockerfile 的 <code>CMD node server.js</code> 改成 <code>CMD ["node", "server.js"]</code>，docker stop 就會馬上結束嗎？還需要做什麼？</li>
<li>用 <code>/proc/PID/status</code> 裡哪兩個數字，可以分辨一個行程變慢是「CPU 搶不到」還是「一直在等 I/O」？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>第一種：1 號先指向 out.log，2 號再複製 1 號，兩個都進 out.log。第二種：2 號先複製 1 號，那時 1 號還指著終端機，所以 2 號指向終端機；之後 1 號才改指 out.log。錯誤印在螢幕上，檔案裡只有標準輸出。0 號兩種情況都指向終端機。</li>
<li>load 很高但 CPU 很閒，代表很多執行緒卡在 D 狀態等 I/O，常見是磁碟太慢或網路磁碟（NFS）斷線。下一步：<code>ps -eo state,pid,comm | grep '^D'</code> 找出卡住的行程，再用 <code>vmstat 1</code> 看 wa（等 I/O 的時間）、<code>iostat -x 1</code> 看是哪顆磁碟滿載。</li>
<li>範例：<code>let t = Date.now(); setInterval(() =&gt; { const n = Date.now(); console.log(n - t); t = n; }, 100); setTimeout(() =&gt; { const end = Date.now() + 2000; while (Date.now() &lt; end) {} }, 500);</code>。平常印 100 左右，卡住那一次會印出 2000 多。因為計時器到期後只是排進佇列，要等主執行緒跑完手上的同步迴圈才輪得到它。</li>
<li>VSZ 至少多出約 2,000 MB（大約 2 GB），因為每條執行緒都登記了 1 MB 的堆疊範圍。RSS 不會多 2 GB：堆疊頁要真的被寫到才會配置實體記憶體，大部分執行緒只用到前面幾十 KB，所以 RSS 只多出幾十 MB 的數量級。</li>
<li>不會。改成 exec 格式後，PID 1 從 sh 變成 node，但 node 當 PID 1 又沒處理 SIGTERM 時，訊號還是被忽略。還要在程式裡加 <code>process.on('SIGTERM', ...)</code> 做優雅關機，或用 <code>--init</code> 讓 tini 當 PID 1（這時 node 不是 PID 1，SIGTERM 的預設動作會生效）。最好是兩個都做。</li>
<li><code>voluntary_ctxt_switches</code> 和 <code>nonvoluntary_ctxt_switches</code>。隔幾秒讀兩次算出增加量：自願切換增加很多，代表它常常自己去睡，在等 I/O；非自願切換增加很多，代表它想跑卻一直被趕下來，CPU 不夠分。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>Remzi 與 Andrea Arpaci-Dusseau《Operating Systems: Three Easy Pieces》</b>（<a href="https://pages.cs.wisc.edu/~remzi/OSTEP/">pages.cs.wisc.edu/~remzi/OSTEP</a>）：免費的作業系統課本，虛擬記憶體、排程、並行三大塊寫得非常好懂。這一章的每一節，它都有一整章。</li>
<li><b>Michael Kerrisk《The Linux Programming Interface》</b>：Linux 系統呼叫的聖經。檔案描述符、訊號、行程、socket，每一個都講到細節。作者也維護 <a href="https://man7.org/linux/man-pages/">man7.org</a> 上的 Linux man pages，<code>man 2 read</code>、<code>man 7 signal</code>、<code>man 5 proc</code> 都值得讀。</li>
<li><b>Brendan Gregg《Systems Performance》第二版</b>：正式環境效能分析的經典，load、CPU 節流、記憶體、strace 和 eBPF 工具都在這本。他的網站 brendangregg.com 也有大量免費文章。</li>
<li><b>Node.js 官方文件〈The Node.js Event Loop〉</b>：在 nodejs.org 的 Learn 區，講 libuv 事件迴圈的各個階段、<code>process.nextTick</code> 和計時器的順序。</li>
</ul>
` });
