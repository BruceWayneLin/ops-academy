DEEP({ 'mach-memory': `
<p>上一課你按下「設定」，看兩個閘圍成的迴圈撐住一個 1。這一章從那個迴圈出發，一層一層往上拆：一個位元怎麼變成暫存器；幾十億格記憶體，怎麼靠一個位址找到其中一格；CPU 拿一個數字，為什麼有時候只要 1 奈秒、有時候要 100 奈秒；你的程式明明跟上百個程式擠在同一台機器上，為什麼還以為整塊記憶體都是它的。容器被 OOM 砍掉、同一段程式換個寫法就快好幾倍，根源都在這一章。</p>

<h3><span class="badge lv1">基礎</span>一、一個位元的記憶：兩個閘互相撐住</h3>
<p>先想像兩個很固執的人，甲和乙。甲的規則是：「只要乙沒舉手，我就舉手。」乙的規則是：「只要甲沒舉手，我就舉手。」現在甲舉著手，乙看到了，就把手放下；乙放下，甲的條件成立，就繼續舉著。沒有人再去推他們，這個狀態也會一直維持下去。反過來，乙舉手、甲放下，同樣穩定。兩個人互相撐住對方，就記住了「現在是誰舉手」這一件事。</p>
<p>電路裡的甲和乙，是兩個 <b>NOR 閘</b>（第 0.3 課：兩個輸入都是 0，才輸出 1）。每個閘除了接對方的輸出，還多一個從外面進來的輸入：一個叫 S（set，設定），一個叫 R（reset，重設）。這就是最簡單的記憶電路，<b>SR 栓鎖器</b>（SR latch）。</p>
<figure class="figure"><svg viewBox="0 0 640 250" class="fg" style="width:100%;max-width:640px" role="img" aria-label="SR 栓鎖器：兩個 NOR 閘，各自的輸出接回對方的輸入，S 設定、R 重設">
<text x="14" y="50" class="fg-t">R 重設</text>
<line x1="70" y1="46" x2="142" y2="46" class="fg-l"/><polygon points="150,46 142,41.5 142,50.5" class="fg-a"/>
<text x="14" y="222" class="fg-t">S 設定</text>
<line x1="70" y1="218" x2="142" y2="218" class="fg-l"/><polygon points="150,218 142,213.5 142,222.5" class="fg-a"/>
<rect x="150" y="30" width="120" height="64" rx="8" class="fg-b hot"/>
<text x="210" y="58" text-anchor="middle" class="fg-t acc">NOR 閘 A</text>
<text x="210" y="78" text-anchor="middle" class="fg-t sm">都是 0 才出 1</text>
<rect x="150" y="170" width="120" height="64" rx="8" class="fg-b alt"/>
<text x="210" y="198" text-anchor="middle" class="fg-t alt">NOR 閘 B</text>
<text x="210" y="218" text-anchor="middle" class="fg-t sm">都是 0 才出 1</text>
<line x1="270" y1="62" x2="402" y2="62" class="fg-l"/><polygon points="410,62 402,57.5 402,66.5" class="fg-a"/>
<text x="418" y="67" class="fg-t lg">Q</text>
<line x1="270" y1="202" x2="402" y2="202" class="fg-l"/><polygon points="410,202 402,197.5 402,206.5" class="fg-a"/>
<text x="418" y="207" class="fg-t">非 Q</text>
<path d="M300 62 V120 H112 V186 H142" class="fg-l on"/><polygon points="150,186 142,181.5 142,190.5" class="fg-a on"/>
<path d="M330 202 V146 H126 V78 H142" class="fg-l alt"/><polygon points="150,78 142,73.5 142,82.5" class="fg-a alt"/>
<circle cx="300" cy="62" r="3.5" class="fg-lamp on"/>
<circle cx="330" cy="202" r="3.5" class="fg-lamp on"/>
<text x="206" y="113" text-anchor="middle" class="fg-t sm acc">Q 送回閘 B</text>
<text x="228" y="162" text-anchor="middle" class="fg-t sm alt">非 Q 送回閘 A</text>
<rect x="470" y="28" width="160" height="166" rx="8" class="fg-b"/>
<text x="550" y="52" text-anchor="middle" class="fg-t lg">怎麼用</text>
<text x="484" y="80" class="fg-t acc">按 S：Q 變成 1</text>
<text x="484" y="104" class="fg-t">放開：Q 還是 1</text>
<text x="484" y="132" class="fg-t warm">按 R：Q 變成 0</text>
<text x="484" y="156" class="fg-t">放開：Q 還是 0</text>
<text x="484" y="182" class="fg-t sm">S、R 同時按：禁止</text>
</svg><figcaption>兩個 NOR 閘交叉相接：A 的輸出 Q 送進 B，B 的輸出送回 A。外面的 S、R 只要按一下，迴圈就自己撐住結果。</figcaption></figure>
<p>照著電路一步一步推，看它怎麼「記住」：</p>
<table>
<tr><th>步驟</th><th>S</th><th>R</th><th>閘 B 輸出（非 Q）</th><th>閘 A 輸出（Q）</th><th>發生什麼事</th></tr>
<tr><td>1. 一開始</td><td>0</td><td>0</td><td>1</td><td>0</td><td>穩定：記著 0</td></tr>
<tr><td>2. 按下 S</td><td>1</td><td>0</td><td>0</td><td>1</td><td>B 有一個輸入是 1，輸出變 0；A 兩個輸入都是 0，輸出變 1</td></tr>
<tr><td>3. 放開 S</td><td>0</td><td>0</td><td>0</td><td>1</td><td>B 還收到 Q = 1，繼續輸出 0；A 就繼續輸出 1。<b>撐住了</b></td></tr>
<tr><td>4. 按下 R</td><td>0</td><td>1</td><td>1</td><td>0</td><td>A 收到 1，輸出變 0；B 兩個輸入都是 0，輸出變 1</td></tr>
<tr><td>5. 放開 R</td><td>0</td><td>0</td><td>1</td><td>0</td><td>又穩定在 0</td></tr>
</table>
<p>第 3 步是整個記憶體世界的起點：<b>輸入已經回到 0，輸出卻還是 1</b>。電路的輸出不只看「現在的輸入」，還看「以前發生過什麼」。有這種性質的電路叫<b>循序電路</b>（sequential circuit）；之前那些輸入一變、輸出馬上跟著變的，叫<b>組合電路</b>（combinational circuit）。</p>
<p>那 S 和 R 同時按下呢？兩個閘的輸出都會變成 0，Q 和「非 Q」不再相反。更麻煩的是同時放開的那一瞬間：兩個閘都想變成 1，誰快一點誰就贏，結果取決於哪個電晶體快了幾兆分之一秒。所以這個組合規定「不准用」。下一節你會看到，真正的晶片換一種接法，讓這種情況根本不會發生。</p>

<h3><span class="badge lv1">基礎</span>二、栓鎖器與正反器：差別在「什麼時候收」</h3>
<p>SR 栓鎖器有兩個按鈕，不好用。我們真正想要的是：一條資料線 D，說「要存的是 0 還是 1」；另一條控制線，說「現在可以存」。在 SR 栓鎖器前面加兩個 AND 閘就做得到，這叫 <b>D 栓鎖器</b>（D latch）。控制線是 1 的時候，Q 跟著 D 走；控制線是 0 的時候，Q 停在最後的值。因為 S 和 R 都從同一條 D 產生（一個接 D，一個接反過來的 D），「同時按下」不可能出現。</p>
<p>問題出在「控制線是 1 的那段時間」。這段時間裡，栓鎖器像一扇<b>開著的門</b>：D 怎麼變，Q 就怎麼變，連途中一閃而過的雜訊都放過去。想像程式計數器要做「PC = PC + 1」：PC 的輸出接到加法器，加法器的答案再接回 PC 的輸入。如果 PC 是栓鎖器，門開著的期間，新的 PC 立刻又流進加法器、再加 1、再流回來……一拍之內可能加了好幾次，加幾次全看電路有多快。</p>
<p>解法是把兩個 D 栓鎖器前後串起來，讓它們的門一個開、一個關，輪流交接。整體效果是：<b>只有在時脈從 0 跳到 1 的那一瞬間，才看 D 一眼</b>，其他時間 D 怎麼變都不理。這叫<b>正反器</b>（flip-flop），精確地說是「邊緣觸發的 D 正反器」（edge-triggered D flip-flop）。栓鎖器像開著的門，人可以一直進出；正反器像照相機，只記得快門按下那一刻的畫面。</p>
<figure class="figure"><svg viewBox="0 0 640 250" class="fg" style="width:100%;max-width:640px" role="img" aria-label="時序圖：時脈、輸入 D、栓鎖器輸出、正反器輸出。栓鎖器在時脈為 1 時跟著 D 變，連雜訊也放過；正反器只在時脈上升的瞬間取樣">
<line x1="170" y1="22" x2="170" y2="212" class="fg-l dim dash"/><line x1="270" y1="22" x2="270" y2="212" class="fg-l dim dash"/><line x1="370" y1="22" x2="370" y2="212" class="fg-l dim dash"/><line x1="470" y1="22" x2="470" y2="212" class="fg-l dim dash"/><line x1="570" y1="22" x2="570" y2="212" class="fg-l dim dash"/>
<text x="14" y="48" class="fg-t">時脈</text>
<text x="14" y="98" class="fg-t">輸入 D</text>
<text x="14" y="148" class="fg-t alt">栓鎖器 Q</text>
<text x="14" y="198" class="fg-t acc">正反器 Q</text>
<polyline points="120,54 170,54 170,30 220,30 220,54 270,54 270,30 320,30 320,54 370,54 370,30 420,30 420,54 470,54 470,30 520,30 520,54 570,54 570,30 620,30" class="fg-l"/>
<polyline points="120,104 195,104 195,80 335,80 335,104 395,104 395,80 410,80 410,104 440,104 440,80 620,80" class="fg-l"/>
<polyline points="120,154 195,154 195,130 370,130 370,154 395,154 395,130 410,130 410,154 470,154 470,130 620,130" class="fg-l alt"/>
<polyline points="120,204 270,204 270,180 370,180 370,204 470,204 470,180 620,180" class="fg-l on"/>
<text x="402" y="124" text-anchor="middle" class="fg-t sm warm">雜訊</text>
<text x="320" y="238" text-anchor="middle" class="fg-t sm">虛線＝時脈從 0 跳到 1 的瞬間。正反器只在虛線上看 D 一眼。</text>
</svg><figcaption>同一條 D，兩種電路的反應不同。栓鎖器在時脈是 1 的整段時間都跟著 D 走，連那個短短的雜訊也照抄；正反器只在虛線那一刻取樣，雜訊落在兩條虛線之間，就被完全忽略。</figcaption></figure>
<p>把 64 個 D 正反器並排，接同一條時脈，就是一個 64 位元的<b>暫存器</b>（register）。時脈一跳，64 個位元同時換成新的值；兩拍之間，暫存器的輸出穩穩不動，讓後面的電路安心計算。上一課 CPU 裡的程式計數器、指令暫存器，都是這種東西。整顆處理器說穿了，就是「一排排正反器，中間夾著組合電路」。</p>

<h3><span class="badge lv2">進階</span>三、兩種記憶格：SRAM 和 DRAM</h3>
<p>正反器很快，但很佔空間，一個大約要二十個電晶體。用它來做 16 GB 的記憶體，晶片要大到不可能。所以真正的記憶體用兩種更精簡的「格子」（cell）：</p>
<figure class="figure"><svg viewBox="0 0 640 280" class="fg" style="width:100%;max-width:640px" role="img" aria-label="左邊 SRAM 一格：兩個反相器圍成迴圈加兩個存取開關，共 6 個電晶體；右邊 DRAM 一格：一個開關加一個電容，電荷會慢慢漏掉">
<rect x="10" y="10" width="300" height="258" rx="10" class="fg-b"/>
<text x="160" y="36" text-anchor="middle" class="fg-t lg">SRAM：6 個電晶體</text>
<text x="160" y="62" text-anchor="middle" class="fg-t sm">字線：選中這一列</text>
<line x1="30" y1="70" x2="290" y2="70" class="fg-l"/>
<line x1="40" y1="84" x2="40" y2="214" class="fg-l"/>
<line x1="280" y1="84" x2="280" y2="214" class="fg-l"/>
<text x="48" y="208" class="fg-t sm">位元線</text>
<line x1="81" y1="70" x2="81" y2="110" class="fg-l dash"/>
<line x1="239" y1="70" x2="239" y2="110" class="fg-l dash"/>
<rect x="56" y="110" width="50" height="30" rx="5" class="fg-b"/><text x="81" y="130" text-anchor="middle" class="fg-t sm">開關</text>
<rect x="214" y="110" width="50" height="30" rx="5" class="fg-b"/><text x="239" y="130" text-anchor="middle" class="fg-t sm">開關</text>
<line x1="40" y1="125" x2="56" y2="125" class="fg-l"/>
<line x1="264" y1="125" x2="280" y2="125" class="fg-l"/>
<line x1="106" y1="125" x2="114" y2="125" class="fg-l"/>
<line x1="206" y1="125" x2="214" y2="125" class="fg-l"/>
<rect x="128" y="96" width="64" height="34" rx="5" class="fg-b hot"/><text x="160" y="118" text-anchor="middle" class="fg-t sm">反相器</text>
<rect x="128" y="170" width="64" height="34" rx="5" class="fg-b hot"/><text x="160" y="192" text-anchor="middle" class="fg-t sm">反相器</text>
<path d="M192 113 H206 V187 H200" class="fg-l on"/><polygon points="192,187 200,182.5 200,191.5" class="fg-a on"/>
<path d="M128 187 H114 V113 H120" class="fg-l on"/><polygon points="128,113 120,108.5 120,117.5" class="fg-a on"/>
<text x="160" y="154" text-anchor="middle" class="fg-t sm acc">互相撐住</text>
<text x="160" y="238" text-anchor="middle" class="fg-t sm">有電就自己撐住，不用刷新</text>
<text x="160" y="256" text-anchor="middle" class="fg-t sm">快，但一格就要 6 個電晶體</text>
<rect x="330" y="10" width="300" height="258" rx="10" class="fg-b"/>
<text x="480" y="36" text-anchor="middle" class="fg-t lg">DRAM：1 個電晶體＋1 個電容</text>
<text x="480" y="62" text-anchor="middle" class="fg-t sm">字線：選中這一列</text>
<line x1="350" y1="70" x2="610" y2="70" class="fg-l"/>
<line x1="380" y1="84" x2="380" y2="214" class="fg-l"/>
<text x="388" y="208" class="fg-t sm">位元線</text>
<line x1="480" y1="70" x2="480" y2="104" class="fg-l dash"/>
<rect x="440" y="104" width="80" height="34" rx="5" class="fg-b"/><text x="480" y="126" text-anchor="middle" class="fg-t sm">開關</text>
<line x1="380" y1="121" x2="440" y2="121" class="fg-l"/>
<line x1="480" y1="138" x2="480" y2="164" class="fg-l"/>
<line x1="455" y1="164" x2="505" y2="164" class="fg-l on"/>
<line x1="455" y1="174" x2="505" y2="174" class="fg-l on"/>
<line x1="480" y1="174" x2="480" y2="190" class="fg-l"/>
<line x1="468" y1="190" x2="492" y2="190" class="fg-l"/><line x1="473" y1="195" x2="487" y2="195" class="fg-l"/><line x1="477" y1="200" x2="483" y2="200" class="fg-l"/>
<text x="514" y="173" class="fg-t sm acc">電容：裝電荷</text>
<path d="M500 180 V204 H526" class="fg-l warm dash"/><polygon points="534,204 526,199.5 526,208.5" class="fg-a warm"/>
<text x="540" y="208" class="fg-t sm warm">慢慢漏電</text>
<text x="480" y="238" text-anchor="middle" class="fg-t sm">讀一次電荷就散掉，要馬上寫回</text>
<text x="480" y="256" text-anchor="middle" class="fg-t sm">一格只要 2 個零件：密、便宜</text>
</svg><figcaption>兩種格子都用「字線」選列、「位元線」進出資料。SRAM 靠迴圈撐住，DRAM 靠一桶會漏的電荷。零件數差三倍，就是快取只有幾 MB、主記憶體卻有幾十 GB 的原因。</figcaption></figure>
<h4>SRAM：靠迴圈撐住</h4>
<p><b>SRAM</b>（static RAM，靜態隨機存取記憶體）的一格用 6 個電晶體：4 個組成兩個首尾相接的反相器（NOT 閘），就是第一節那個「互相撐住」的迴圈；另外 2 個是開關，只有這一列被選中時才打開。有電，迴圈就自己撐著，所以叫「靜態」。它很快，CPU 裡的快取全是 SRAM；缺點是太大太貴，一顆晶片上只放得下幾 MB 到幾十 MB。</p>
<h4>DRAM：靠電荷，而且會漏</h4>
<p><b>DRAM</b>（dynamic RAM，動態隨機存取記憶體）的一格只有 1 個電晶體加 1 個電容器（capacitor）。電容器就是課文裡那個小水桶：有電荷是 1，沒電荷是 0。電晶體是水龍頭，這一列被選中才打開。一格只要兩個零件，同樣的面積可以放多很多位元，這就是你的電腦有 16 GB 的 DRAM、卻只有幾 MB 的 SRAM 的原因。</p>
<p>代價有兩個。第一，<b>讀一次就破壞了</b>：電容器太小，打開水龍頭時，電荷流到很長的位元線（bit line）上，只造成一點點電壓變化，要靠一個叫感測放大器（sense amplifier）的電路放大才判斷得出來；讀完以後電荷已經散掉，得馬上寫回去。第二，<b>會漏</b>：就算沒人碰，電荷也會慢慢漏光。所以記憶體控制器要定期幫每一格「補水」，這叫<b>刷新</b>（refresh）。</p>
<p>拿 DDR4 算一次：規格要求每一列在 64 毫秒內都要被刷新一次（溫度超過 85°C 時頻率要加倍）。記憶體控制器把這件事拆成 8192 次，平均每 64 毫秒 ÷ 8192 ≈ 7.8 微秒，就送一個刷新命令。刷新進行的那一小段時間，那一塊記憶體不能回應讀寫，所以刷新會吃掉一小部分效能。這就是「動態」的意思：它得一直被照顧，才記得住。</p>

<h3><span class="badge lv2">進階</span>四、一個位址，怎麼在幾十億格裡找到一格</h3>
<p>CPU 把位址放上位址匯流排，記憶體怎麼知道是哪一格？靠的是<b>解碼器</b>（decoder）：輸入 n 個位元，輸出 2<sup>n</sup> 條線，每次只有一條是 1。2 個位元進來、4 條線出去：00 只點亮第 0 條，01 只點亮第 1 條，以此類推。裡面就是一排 AND 閘，跟上一課解碼指令用的是同一招。</p>
<p>可是 16 GB 有 2<sup>34</sup> 個位元組。做一個有 170 億條輸出的解碼器，再把 170 億格排成一長條，線會長到訊號跑不完。所以記憶體排成<b>方陣</b>：位址的前半段選「第幾列」（row），後半段選「第幾欄」（column）。用一個 16 格的小記憶體走一次：</p>
<figure class="figure"><svg viewBox="0 0 660 306" class="fg" style="width:100%;max-width:660px" role="img" aria-label="位址 1011 拆成列位址 10 和欄位址 11：列解碼器點亮第 2 列，整列複製到列緩衝區，欄選擇器挑出第 3 欄的 1">
<text x="196" y="50" class="fg-t lg">位址</text>
<text x="281" y="20" text-anchor="middle" class="fg-t sm acc">列</text>
<text x="345" y="20" text-anchor="middle" class="fg-t sm alt">欄</text>
<rect x="250" y="28" width="30" height="30" rx="4" class="fg-b hot"/><text x="265" y="48" text-anchor="middle" class="fg-t lg mono">1</text>
<rect x="282" y="28" width="30" height="30" rx="4" class="fg-b hot"/><text x="297" y="48" text-anchor="middle" class="fg-t lg mono">0</text>
<rect x="314" y="28" width="30" height="30" rx="4" class="fg-b alt"/><text x="329" y="48" text-anchor="middle" class="fg-t lg mono">1</text>
<rect x="346" y="28" width="30" height="30" rx="4" class="fg-b alt"/><text x="361" y="48" text-anchor="middle" class="fg-t lg mono">1</text>
<path d="M281 58 V74 H90 V88" class="fg-l on"/><polygon points="90,96 85.5,88 94.5,88" class="fg-a on"/>
<path d="M345 58 V74 H500 V256" class="fg-l alt"/><polygon points="500,264 495.5,256 504.5,256" class="fg-a alt"/>
<text x="508" y="170" class="fg-t sm alt">11 → 第 3 欄</text>
<rect x="30" y="96" width="120" height="160" rx="8" class="fg-b"/>
<text x="80" y="170" text-anchor="middle" class="fg-t">列解碼器</text>
<text x="80" y="190" text-anchor="middle" class="fg-t sm">10 → 只亮第 2 列</text>
<text x="142" y="120" text-anchor="end" class="fg-t sm">0</text><text x="142" y="160" text-anchor="end" class="fg-t sm">1</text><text x="142" y="200" text-anchor="end" class="fg-t sm acc">2</text><text x="142" y="240" text-anchor="end" class="fg-t sm">3</text>
<line x1="150" y1="116" x2="177" y2="116" class="fg-l dim"/><line x1="150" y1="156" x2="177" y2="156" class="fg-l dim"/><line x1="150" y1="196" x2="177" y2="196" class="fg-l on"/><line x1="150" y1="236" x2="177" y2="236" class="fg-l dim"/>
<text x="200" y="96" text-anchor="middle" class="fg-t sm">0</text><text x="260" y="96" text-anchor="middle" class="fg-t sm">1</text><text x="320" y="96" text-anchor="middle" class="fg-t sm">2</text><text x="380" y="96" text-anchor="middle" class="fg-t sm alt">3</text>
<rect x="177" y="102" width="46" height="28" rx="4" class="fg-b"/><text x="200" y="121" text-anchor="middle" class="fg-t mono">1</text>
<rect x="237" y="102" width="46" height="28" rx="4" class="fg-b"/><text x="260" y="121" text-anchor="middle" class="fg-t mono">0</text>
<rect x="297" y="102" width="46" height="28" rx="4" class="fg-b"/><text x="320" y="121" text-anchor="middle" class="fg-t mono">0</text>
<rect x="357" y="102" width="46" height="28" rx="4" class="fg-b"/><text x="380" y="121" text-anchor="middle" class="fg-t mono">1</text>
<rect x="177" y="142" width="46" height="28" rx="4" class="fg-b"/><text x="200" y="161" text-anchor="middle" class="fg-t mono">0</text>
<rect x="237" y="142" width="46" height="28" rx="4" class="fg-b"/><text x="260" y="161" text-anchor="middle" class="fg-t mono">0</text>
<rect x="297" y="142" width="46" height="28" rx="4" class="fg-b"/><text x="320" y="161" text-anchor="middle" class="fg-t mono">1</text>
<rect x="357" y="142" width="46" height="28" rx="4" class="fg-b"/><text x="380" y="161" text-anchor="middle" class="fg-t mono">1</text>
<rect x="177" y="182" width="46" height="28" rx="4" class="fg-b hot"/><text x="200" y="201" text-anchor="middle" class="fg-t mono">0</text>
<rect x="237" y="182" width="46" height="28" rx="4" class="fg-b hot"/><text x="260" y="201" text-anchor="middle" class="fg-t mono">1</text>
<rect x="297" y="182" width="46" height="28" rx="4" class="fg-b hot"/><text x="320" y="201" text-anchor="middle" class="fg-t mono">0</text>
<rect x="357" y="182" width="46" height="28" rx="4" class="fg-b warm"/><text x="380" y="201" text-anchor="middle" class="fg-t mono">1</text>
<rect x="177" y="222" width="46" height="28" rx="4" class="fg-b"/><text x="200" y="241" text-anchor="middle" class="fg-t mono">1</text>
<rect x="237" y="222" width="46" height="28" rx="4" class="fg-b"/><text x="260" y="241" text-anchor="middle" class="fg-t mono">1</text>
<rect x="297" y="222" width="46" height="28" rx="4" class="fg-b"/><text x="320" y="241" text-anchor="middle" class="fg-t mono">0</text>
<rect x="357" y="222" width="46" height="28" rx="4" class="fg-b"/><text x="380" y="241" text-anchor="middle" class="fg-t mono">0</text>
<line x1="200" y1="250" x2="200" y2="258" class="fg-l"/><polygon points="200,266 195.5,258 204.5,258" class="fg-a"/>
<line x1="260" y1="250" x2="260" y2="258" class="fg-l"/><polygon points="260,266 255.5,258 264.5,258" class="fg-a"/>
<line x1="320" y1="250" x2="320" y2="258" class="fg-l"/><polygon points="320,266 315.5,258 324.5,258" class="fg-a"/>
<line x1="380" y1="250" x2="380" y2="258" class="fg-l"/><polygon points="380,266 375.5,258 384.5,258" class="fg-a"/>
<text x="412" y="258" class="fg-t sm">整列送下來</text>
<text x="90" y="285" text-anchor="middle" class="fg-t">列緩衝區</text>
<rect x="177" y="266" width="226" height="30" rx="5" class="fg-b hot"/>
<text x="200" y="286" text-anchor="middle" class="fg-t mono">0</text><text x="260" y="286" text-anchor="middle" class="fg-t mono">1</text><text x="320" y="286" text-anchor="middle" class="fg-t mono">0</text><text x="380" y="286" text-anchor="middle" class="fg-t mono acc">1</text>
<line x1="403" y1="281" x2="432" y2="281" class="fg-l"/><polygon points="440,281 432,276.5 432,285.5" class="fg-a"/>
<rect x="440" y="264" width="120" height="34" rx="6" class="fg-b alt"/><text x="500" y="286" text-anchor="middle" class="fg-t">欄選擇器</text>
<line x1="560" y1="281" x2="592" y2="281" class="fg-l on"/><polygon points="600,281 592,276.5 592,285.5" class="fg-a on"/>
<text x="606" y="286" class="fg-t acc">讀出 1</text>
</svg><figcaption>位址的前半段和後半段走不同的路：前半段經過列解碼器，一次打開整列；後半段送到欄選擇器，從那一列裡挑出要的那一格。</figcaption></figure>
<ol>
<li>位址 1011 切成兩半：前兩位 10 是列，後兩位 11 是欄。</li>
<li><b>列解碼器</b>把 10 變成「只有第 2 列的線是 1」。第 2 列的 4 格同時打開開關，把內容送到下面的<b>列緩衝區</b>（row buffer）。注意：送下來的是整列，不是一格。</li>
<li><b>欄選擇器</b>（column multiplexer）用 11 從列緩衝區的 4 個位元裡挑出第 3 個，送上資料匯流排。</li>
</ol>
<p>真實的 DRAM 是同一個設計放大很多倍：一顆晶片分成好幾個區塊（bank），每個區塊有幾萬列，一列有上千欄。記憶體控制器讀一個位址，要依序送三種命令：</p>
<ul>
<li><b>開列</b>（activate）：把整列讀進列緩衝區。</li>
<li><b>讀欄</b>（read）：從列緩衝區挑出要的那幾欄。</li>
<li><b>關列</b>（precharge）：把列緩衝區寫回去，準備開下一列。</li>
</ul>
<p>每一步都有規定的等待時間。記憶體規格上的「CL16」，意思是送出讀欄命令後要等 16 個記憶體時脈。DDR4-3200 的記憶體時脈是 1600 MHz，一拍 0.625 奈秒，16 拍就是 10 奈秒。如果下一個位址剛好在<b>同一列</b>，列緩衝區裡已經有了，只要再等這 10 奈秒；如果在<b>不同列</b>，就得先關列、再開列，時間大約變成三倍。所以連最底層的 DRAM，都是「照順序讀」最快。</p>
<p>還有一個細節，後面會一直用到：DDR4 一次讀取會連續送出 8 筆、每筆 8 個位元組，總共 <b>64 個位元組</b>。記憶體從來不是一個位元組、一個位元組地送，最小單位就是一整塊。</p>

<h3><span class="badge lv2">進階</span>五、時脈與時序：要快，路就要短</h3>
<p>正反器在時脈跳起來的那一刻「看 D 一眼」。可是這一眼不是零秒，它有兩個要求：</p>
<ul>
<li><b>建立時間</b>（setup time）：時脈跳起來<b>之前</b>，D 必須已經穩定一小段時間。</li>
<li><b>保持時間</b>（hold time）：時脈跳起來<b>之後</b>，D 還要再穩住一小段時間。</li>
</ul>
<p>另外，時脈跳起來以後，正反器的輸出 Q 也要過一小段時間才會變成新的值，叫<b>時脈到輸出延遲</b>（clock-to-Q delay）。</p>
<p>現在看兩個正反器之間：A 的輸出經過一串閘（加法器、比較器……），結果送進 B。時脈一跳，A 送出新的值，訊號開始在閘裡跑；下一次時脈跳起來之前，結果必須已經到達 B，而且要提早到，站穩一段建立時間。所以一拍至少要這麼長：</p>
<p><b>一拍 ≥ 時脈到輸出延遲 ＋ 最慢那條路的閘延遲 ＋ 建立時間</b></p>
<figure class="figure"><svg viewBox="0 0 640 304" class="fg" style="width:100%;max-width:640px" role="img" aria-label="上方：正反器 A 經過三個閘到正反器 B，兩者共用時脈。下方：3.3 GHz 時一拍 300 ps 剛好裝得下；5 GHz 時一拍 200 ps，閘還沒算完下一拍就來了">
<text x="280" y="30" text-anchor="middle" class="fg-t sm acc">最慢的一條路：250 ps</text>
<path d="M160 44 V38 H400 V44" class="fg-l dim"/>
<rect x="20" y="40" width="90" height="50" rx="6" class="fg-b alt"/><text x="65" y="70" text-anchor="middle" class="fg-t">正反器 A</text>
<rect x="160" y="48" width="60" height="34" rx="5" class="fg-b hot"/><text x="190" y="70" text-anchor="middle" class="fg-t sm">閘 1</text>
<rect x="250" y="48" width="60" height="34" rx="5" class="fg-b hot"/><text x="280" y="70" text-anchor="middle" class="fg-t sm">閘 2</text>
<rect x="340" y="48" width="60" height="34" rx="5" class="fg-b hot"/><text x="370" y="70" text-anchor="middle" class="fg-t sm">閘 3</text>
<rect x="450" y="40" width="90" height="50" rx="6" class="fg-b alt"/><text x="495" y="70" text-anchor="middle" class="fg-t">正反器 B</text>
<line x1="110" y1="65" x2="152" y2="65" class="fg-l"/><polygon points="160,65 152,60.5 152,69.5" class="fg-a"/>
<line x1="220" y1="65" x2="242" y2="65" class="fg-l"/><polygon points="250,65 242,60.5 242,69.5" class="fg-a"/>
<line x1="310" y1="65" x2="332" y2="65" class="fg-l"/><polygon points="340,65 332,60.5 332,69.5" class="fg-a"/>
<line x1="400" y1="65" x2="442" y2="65" class="fg-l"/><polygon points="450,65 442,60.5 442,69.5" class="fg-a"/>
<line x1="40" y1="116" x2="520" y2="116" class="fg-l"/>
<line x1="65" y1="116" x2="65" y2="98" class="fg-l"/><polygon points="65,90 60.5,98 69.5,98" class="fg-a"/>
<line x1="495" y1="116" x2="495" y2="98" class="fg-l"/><polygon points="495,90 490.5,98 499.5,98" class="fg-a"/>
<text x="530" y="120" class="fg-t sm">時脈：同一拍</text>
<text x="20" y="160" class="fg-t">3.3 GHz：一拍 300 ps</text>
<rect x="20" y="170" width="40" height="26" class="fg-b alt"/><text x="40" y="188" text-anchor="middle" class="fg-t sm">25</text>
<rect x="60" y="170" width="400" height="26" class="fg-b hot"/><text x="260" y="188" text-anchor="middle" class="fg-t sm">閘延遲 250 ps</text>
<rect x="460" y="170" width="40" height="26" class="fg-b warm"/><text x="480" y="188" text-anchor="middle" class="fg-t sm">25</text>
<text x="512" y="188" class="fg-t acc">剛好來得及</text>
<text x="40" y="212" text-anchor="middle" class="fg-t sm">時脈到輸出</text>
<text x="480" y="212" text-anchor="middle" class="fg-t sm">建立時間</text>
<text x="20" y="240" class="fg-t">5 GHz：一拍只有 200 ps</text>
<rect x="20" y="250" width="40" height="26" class="fg-b alt"/><text x="40" y="268" text-anchor="middle" class="fg-t sm">25</text>
<rect x="60" y="250" width="280" height="26" class="fg-b hot"/><text x="200" y="268" text-anchor="middle" class="fg-t sm">閘還在算……</text>
<rect x="340" y="250" width="160" height="26" class="fg-b warm"/><text x="420" y="268" text-anchor="middle" class="fg-t sm">超出 100 ps</text>
<line x1="340" y1="242" x2="340" y2="284" class="fg-l warm"/>
<text x="340" y="298" text-anchor="middle" class="fg-t sm warm">下一拍到了</text>
<text x="512" y="268" class="fg-t warm">來不及</text>
</svg><figcaption>一拍的長度，要裝得下「A 送出 ＋ 閘計算 ＋ B 站穩」三段。時脈越快，一拍越短，最慢的那條路就越容易裝不下。</figcaption></figure>
<p>代數字（數字是為了好算，真實晶片的值依製程而不同）：時脈到輸出 25 皮秒、閘延遲 250 皮秒、建立時間 25 皮秒，加起來 300 皮秒（1 皮秒是一兆分之一秒，縮寫 ps）。一拍 300 皮秒，時脈頻率最高就是 1 ÷ 300 皮秒 ≈ 3.3 GHz。整顆晶片裡最慢的那條路叫<b>關鍵路徑</b>（critical path），它決定整顆晶片的時脈上限。</p>
<p>想跑 5 GHz，一拍只剩 200 皮秒，閘延遲得壓到 150 皮秒以下。辦法只有三種：</p>
<ol>
<li><b>把路切短</b>：在長路中間多放一排正反器，一件事分兩拍做。這就是上一課深入圖解講的管線，級數越多，每一級越短。</li>
<li><b>讓電晶體切換更快</b>：提高電壓。代價是耗電和發熱急遽上升，第 0.8 課的「熱牆」就是這樣來的。</li>
<li><b>換更好的製程</b>：電晶體越小，切換越快。這要等整個產業往前走。</li>
</ol>
<p>這也解釋了<b>超頻</b>（overclocking）為什麼會讓電腦當機，而不是只變慢。時脈拉太快，最慢的那條路來不及，正反器抓到的是還在變的值，加法器可能才算完一半的位元。錯一個位元，可能是一個指標指錯地方、一道指令解碼錯，程式就在隨機的地方崩潰。這種錯很難追，因為它根本不是程式的 bug。</p>

<h3><span class="badge lv3">專業</span>六、記憶體階層：每往下一層，大很多、也慢很多</h3>
<p>你現在知道兩件事：SRAM 快但小，DRAM 大但慢。電腦的解法是不選邊，而是<b>分層</b>：最常用的放在最快、最小的地方，越不常用的放越遠。就像你工作時：手上拿著的筆（暫存器）、桌上攤開的幾本書（L1 快取）、身後的書架（L2、L3）、走過去要幾分鐘的圖書館（主記憶體），還有要申請調閱、好幾天才送到的倉庫（SSD、硬碟）。</p>
<table>
<tr><th>層級</th><th>常見容量</th><th>讀一次大約</th><th>假如 L1 是 1 秒</th></tr>
<tr><td>暫存器</td><td>幾百個位元組</td><td>1 拍（不到 0.5 奈秒）</td><td>不用等</td></tr>
<tr><td>L1 快取</td><td>每顆核心 32 到 128 KB</td><td>約 1 奈秒（4、5 拍）</td><td>1 秒</td></tr>
<tr><td>L2 快取</td><td>幾百 KB 到幾 MB</td><td>約 3 到 5 奈秒</td><td>3 到 5 秒</td></tr>
<tr><td>L3 快取</td><td>多顆核心共用，幾 MB 到幾十 MB</td><td>約 10 到 20 奈秒</td><td>10 到 20 秒</td></tr>
<tr><td>主記憶體（DRAM）</td><td>幾 GB 到幾百 GB</td><td>約 80 到 100 奈秒</td><td>一分半鐘左右</td></tr>
<tr><td>NVMe SSD</td><td>幾百 GB 到幾 TB</td><td>約 20 到 100 微秒</td><td>6 小時到一天多</td></tr>
<tr><td>傳統硬碟</td><td>幾 TB</td><td>約 5 到 10 毫秒</td><td>2 到 4 個月</td></tr>
</table>
<p>表上的數字是常見的數量級，每顆晶片都不一樣。重點是比例：從 L1 到主記憶體，差將近 100 倍；從主記憶體到 SSD，又差 1,000 倍。</p>
<p>分層之所以有效，是因為程式有兩個習慣，叫<b>局部性</b>（locality）：</p>
<ul>
<li><b>時間局部性</b>（temporal locality）：剛用過的東西，很快又會再用。迴圈的計數器、函式的區域變數，每一圈都碰。</li>
<li><b>空間局部性</b>（spatial locality）：用了某一格，旁邊幾格很快也會用。走訪陣列、一道一道往下執行指令，都是往旁邊走。</li>
</ul>
<p>只要程式有這兩個習慣，絕大部分的讀取都在最上面幾層完成，整台機器用起來就像「有 DRAM 的容量、有 SRAM 的速度」。習慣不好的程式，例如在一大片記憶體裡隨機亂跳，就會一直掉到最下層，慢上幾十倍。</p>

<h3><span class="badge lv3">專業</span>七、快取怎麼運作：快取列、命中、組關聯</h3>
<h4>單位是一整條，不是一個位元組</h4>
<p>快取和記憶體之間搬東西的最小單位，叫<b>快取列</b>（cache line）。x86 和大部分 ARM 伺服器是 64 個位元組，Apple 的 M 系列是 128 個位元組。你讀一個 4 位元組的整數，快取會把它所在的整條 64 位元組一起搬上來；接下來讀旁邊的 15 個整數，全部<b>命中</b>（hit），不用再去主記憶體。這就是空間局部性被利用的方式，也剛好對上 DRAM 一次送 64 個位元組。</p>
<h4>一條快取列可以放在哪裡？</h4>
<p>快取比記憶體小幾千倍，每一條列只能挑一個位置放。用停車場來比喻：</p>
<ul>
<li><b>直接對應</b>（direct-mapped）：每輛車照車牌尾數，只能停在固定的那一格。找車很快，看一格就知道；但兩輛尾數一樣的車會一直互相擠掉。</li>
<li><b>完全關聯</b>（fully associative）：愛停哪就停哪。不會互擠，但找車要把整個停車場看一遍，太慢、太耗電。</li>
<li><b>組關聯</b>（set-associative）：車牌尾數決定停哪一排，那一排裡的 8 格隨便停。找車只要看一排，8 格還可以同時比對。這是真實快取的做法，叫「8 路組關聯」（8-way set-associative）。</li>
</ul>
<p>拿一個常見的 L1 設定實際走一次：32 KB、每條 64 位元組、8 路。32 KB ÷ 64 = 512 條，分成 512 ÷ 8 = 64 組。位址就被切成三段：</p>
<figure class="figure"><svg viewBox="0 0 640 280" class="fg" style="width:100%;max-width:640px" role="img" aria-label="位址 0x12345 切成標籤 0x12、組號 13、位移 5；用組號找到第 13 組，8 格的標籤同時比對，第 3 格相符就是命中">
<text x="136" y="22" text-anchor="middle" class="fg-t sm alt">標籤 tag = 0x12</text>
<text x="308" y="22" text-anchor="middle" class="fg-t sm acc">組號 index = 13</text>
<text x="456" y="22" text-anchor="middle" class="fg-t sm warm">位移 offset = 5</text>
<rect x="40" y="30" width="192" height="32" rx="5" class="fg-b alt"/><text x="136" y="51" text-anchor="middle" class="fg-t mono">0001 0010</text>
<rect x="236" y="30" width="144" height="32" rx="5" class="fg-b hot"/><text x="308" y="51" text-anchor="middle" class="fg-t mono">001101</text>
<rect x="384" y="30" width="144" height="32" rx="5" class="fg-b warm"/><text x="456" y="51" text-anchor="middle" class="fg-t mono">000101</text>
<text x="540" y="51" class="fg-t mono">= 0x12345</text>
<path d="M308 62 V84 H40 V157 H58" class="fg-l on"/><polygon points="66,157 58,152.5 58,161.5" class="fg-a on"/>
<text x="174" y="79" text-anchor="middle" class="fg-t sm acc">用組號直接跳到這一組</text>
<text x="316" y="102" text-anchor="middle" class="fg-t sm">⋮</text>
<text x="102" y="128" text-anchor="end" class="fg-t sm">組 12</text>
<rect x="110" y="110" width="48" height="26" rx="4" class="fg-b"/><rect x="162" y="110" width="48" height="26" rx="4" class="fg-b"/><rect x="214" y="110" width="48" height="26" rx="4" class="fg-b"/><rect x="266" y="110" width="48" height="26" rx="4" class="fg-b"/><rect x="318" y="110" width="48" height="26" rx="4" class="fg-b"/><rect x="370" y="110" width="48" height="26" rx="4" class="fg-b"/><rect x="422" y="110" width="48" height="26" rx="4" class="fg-b"/><rect x="474" y="110" width="48" height="26" rx="4" class="fg-b"/>
<text x="102" y="162" text-anchor="end" class="fg-t acc">組 13</text>
<rect x="110" y="144" width="48" height="26" rx="4" class="fg-b"/><text x="134" y="161" text-anchor="middle" class="fg-t sm mono">0x07</text>
<rect x="162" y="144" width="48" height="26" rx="4" class="fg-b"/><text x="186" y="161" text-anchor="middle" class="fg-t sm mono">0x3A</text>
<rect x="214" y="144" width="48" height="26" rx="4" class="fg-b hot"/><text x="238" y="161" text-anchor="middle" class="fg-t sm mono acc">0x12</text>
<rect x="266" y="144" width="48" height="26" rx="4" class="fg-b"/><text x="290" y="161" text-anchor="middle" class="fg-t sm mono">0x55</text>
<rect x="318" y="144" width="48" height="26" rx="4" class="fg-b"/><text x="342" y="161" text-anchor="middle" class="fg-t sm mono">0x01</text>
<rect x="370" y="144" width="48" height="26" rx="4" class="fg-b"/><text x="394" y="161" text-anchor="middle" class="fg-t sm mono">0x2C</text>
<rect x="422" y="144" width="48" height="26" rx="4" class="fg-b"/><text x="446" y="161" text-anchor="middle" class="fg-t sm mono">0x19</text>
<rect x="474" y="144" width="48" height="26" rx="4" class="fg-b"/><text x="498" y="161" text-anchor="middle" class="fg-t sm mono">0x40</text>
<text x="532" y="161" class="fg-t sm acc">第 3 格相符</text>
<text x="102" y="196" text-anchor="end" class="fg-t sm">組 14</text>
<rect x="110" y="178" width="48" height="26" rx="4" class="fg-b"/><rect x="162" y="178" width="48" height="26" rx="4" class="fg-b"/><rect x="214" y="178" width="48" height="26" rx="4" class="fg-b"/><rect x="266" y="178" width="48" height="26" rx="4" class="fg-b"/><rect x="318" y="178" width="48" height="26" rx="4" class="fg-b"/><rect x="370" y="178" width="48" height="26" rx="4" class="fg-b"/><rect x="422" y="178" width="48" height="26" rx="4" class="fg-b"/><rect x="474" y="178" width="48" height="26" rx="4" class="fg-b"/>
<text x="316" y="222" text-anchor="middle" class="fg-t sm">⋮</text>
<text x="320" y="246" text-anchor="middle" class="fg-t sm">8 格的標籤同時跟 0x12 比：有一格相同 → 命中，再照位移 5 取出那個位元組</text>
<text x="320" y="268" text-anchor="middle" class="fg-t sm">每一格放一條 64 位元組的快取列，旁邊另外記著它的標籤</text>
</svg><figcaption>位址自己就說明了該去哪裡找：中間幾個位元選組，前面的位元當作身分證，最後幾個位元指出是這條列裡的第幾個位元組。</figcaption></figure>
<ul>
<li><b>位移</b>（offset）：最後 6 個位元（2<sup>6</sup> = 64），表示在這條列裡的第幾個位元組。</li>
<li><b>組號</b>（index）：再往前 6 個位元（2<sup>6</sup> = 64 組），決定去哪一組找。</li>
<li><b>標籤</b>（tag）：剩下的位元，用來確認「這一格放的真的是我要的那條」。</li>
</ul>
<p>位址 0x12345：位移是 5，組號是 13，標籤是 0x12。快取直接跳到第 13 組，把 8 格的標籤同時拿來跟 0x12 比。有一格相同就是命中，取出位移 5 的那個位元組；都不同就是<b>未命中</b>（miss），要去下一層把整條搬上來，再從這一組裡挑一條「最久沒用的」踢掉（近似 LRU，least recently used）。</p>
<h4>命中率差一點，速度差很多</h4>
<p>平均存取時間 ＝ 命中時間 ＋ 未命中率 × 未命中的代價。設命中要 1 奈秒、未命中要多花 100 奈秒：</p>
<ul>
<li>未命中率 5%：1 ＋ 0.05 × 100 ＝ 6 奈秒。</li>
<li>未命中率 1%：1 ＋ 0.01 × 100 ＝ 2 奈秒。</li>
</ul>
<p>命中率從 95% 變成 99%，看起來只差 4 個百分點，平均速度卻快了 3 倍。所以效能工程師談快取時，盯的是「未命中率」，而不是「命中率」。</p>
<h4>未命中的三種原因</h4>
<ul>
<li><b>第一次碰</b>（compulsory miss）：這條列從來沒進過快取。只能靠硬體預取（prefetch）提早搬，或減少要碰的資料量。</li>
<li><b>容量不夠</b>（capacity miss）：要用的資料總量比快取大，舊的被擠掉了。解法是讓資料變小，或分塊處理。</li>
<li><b>撞在同一組</b>（conflict miss）：快取明明還有空位，但好幾條列剛好對應到同一組，互相擠掉。常見的元兇是「剛好是 2 的次方的跨步」，第 0.8 課的深入圖解會遇到它。</li>
</ul>
<p>寫入呢？現代快取多半用<b>回寫</b>（write-back）：寫的時候只改快取裡那一條，標記成「髒的」（dirty），等它被踢出去時才寫回記憶體。多核心時，每顆核心有自己的 L1，硬體還得保證大家看到同一個值，這叫<b>快取一致性</b>（cache coherence），它的代價也留到第 0.8 課。</p>

<h3><span class="badge lv3">專業</span>八、虛擬記憶體：每個行程都以為整台機器是它的</h3>
<p>在一台把位址隨機化（ASLR）關掉的機器上，同一個程式跑兩次，印出某個變數的位址，會得到一模一樣的數字。兩個同時在跑的行程寫進「同一個位址」，卻不會蓋掉對方。因為程式看到的位址，根本不是記憶體晶片上的真實位置。</p>
<p>CPU 裡有一個零件叫 <b>MMU</b>（memory management unit，記憶體管理單元）。程式發出的每一個位址都是<b>虛擬位址</b>（virtual address），MMU 會即時把它翻譯成<b>實體位址</b>（physical address）。翻譯不是一個位元組一個位元組地對照，而是以<b>頁</b>（page）為單位：Linux 在 x86-64 上一頁是 4 KB，macOS 在 Apple silicon 上是 16 KB。每個行程有自己的一張<b>頁表</b>（page table），由作業系統填寫，記錄「我的第幾頁，放在實體記憶體的第幾框」。</p>
<figure class="figure"><svg viewBox="0 0 640 300" class="fg" style="width:100%;max-width:640px" role="img" aria-label="行程 A 和 B 都有虛擬頁 0x403 到 0x405，各自的頁表把它們對應到不同的實體框；兩者的 0x404 指向同一個共用框，A 的 0x405 被換到磁碟">
<text x="95" y="24" text-anchor="middle" class="fg-t lg">行程 A</text>
<text x="320" y="24" text-anchor="middle" class="fg-t sm">頁表：每個行程一張</text>
<text x="545" y="24" text-anchor="middle" class="fg-t lg">實體記憶體</text>
<rect x="20" y="34" width="150" height="26" rx="5" class="fg-b alt"/><text x="95" y="52" text-anchor="middle" class="fg-t">虛擬頁 0x403</text>
<rect x="20" y="66" width="150" height="26" rx="5" class="fg-b alt"/><text x="95" y="84" text-anchor="middle" class="fg-t">虛擬頁 0x404</text>
<rect x="20" y="98" width="150" height="26" rx="5" class="fg-b alt"/><text x="95" y="116" text-anchor="middle" class="fg-t">虛擬頁 0x405</text>
<text x="95" y="160" text-anchor="middle" class="fg-t lg">行程 B</text>
<rect x="20" y="172" width="150" height="26" rx="5" class="fg-b hot"/><text x="95" y="190" text-anchor="middle" class="fg-t">虛擬頁 0x403</text>
<rect x="20" y="204" width="150" height="26" rx="5" class="fg-b hot"/><text x="95" y="222" text-anchor="middle" class="fg-t">虛擬頁 0x404</text>
<rect x="20" y="236" width="150" height="26" rx="5" class="fg-b hot"/><text x="95" y="254" text-anchor="middle" class="fg-t">虛擬頁 0x405</text>
<rect x="470" y="34" width="150" height="26" rx="5" class="fg-b"/><text x="545" y="52" text-anchor="middle" class="fg-t">框 0x1C7</text>
<rect x="470" y="66" width="150" height="26" rx="5" class="fg-b"/><text x="545" y="84" text-anchor="middle" class="fg-t">框 0x2A0（共用）</text>
<rect x="470" y="98" width="150" height="26" rx="5" class="fg-b"/><text x="545" y="116" text-anchor="middle" class="fg-t">框 0x8F2</text>
<rect x="470" y="130" width="150" height="26" rx="5" class="fg-b"/><text x="545" y="148" text-anchor="middle" class="fg-t">框 0x9B4</text>
<text x="545" y="198" text-anchor="middle" class="fg-t">磁碟上的 swap</text>
<rect x="470" y="208" width="150" height="40" rx="6" class="fg-b warm"/><text x="545" y="233" text-anchor="middle" class="fg-t">被換出去的頁</text>
<text x="545" y="266" text-anchor="middle" class="fg-t sm warm">碰到才讀回來</text>
<path d="M170 47 H190 L450 111 H462" class="fg-l alt"/><polygon points="470,111 462,106.5 462,115.5" class="fg-a alt"/>
<path d="M170 79 H462" class="fg-l"/><polygon points="470,79 462,74.5 462,83.5" class="fg-a"/>
<path d="M170 111 H190 L450 228 H462" class="fg-l warm dash"/><polygon points="470,228 462,223.5 462,232.5" class="fg-a warm"/>
<path d="M170 185 H190 L450 47 H462" class="fg-l on"/><polygon points="470,47 462,42.5 462,51.5" class="fg-a on"/>
<path d="M170 217 H190 L450 79 H462" class="fg-l"/>
<path d="M170 249 H190 L450 143 H462" class="fg-l"/><polygon points="470,143 462,138.5 462,147.5" class="fg-a"/>
<text x="320" y="290" text-anchor="middle" class="fg-t sm">同一個位址 0x403A10：A 翻成 0x8F2A10，B 翻成 0x1C7A10</text>
</svg><figcaption>兩個行程用的是同一組虛擬頁號，查的卻是各自的頁表，落在不同的實體框。共用函式庫可以讓兩張頁表指向同一框；不常用的頁可以先放到磁碟上。</figcaption></figure>
<p>走一次翻譯，頁大小 4 KB（0x1000）：</p>
<ol>
<li>行程 A 讀位址 0x403A10。最後 12 個位元 0xA10 是頁內位移（2<sup>12</sup> = 4096），前面的 0x403 是虛擬頁號。</li>
<li>MMU 查 A 的頁表：虛擬頁 0x403 對應實體框 0x8F2。</li>
<li>實體位址 ＝ 0x8F2 接上 0xA10 ＝ 0x8F2A10。位移原封不動，只換頁號。</li>
<li>行程 B 讀同一個 0x403A10，查的是 B 自己的頁表，得到 0x1C7A10。兩個程式互不相干。</li>
</ol>
<p>這套設計一次解決好幾件事：</p>
<ul>
<li><b>隔離</b>：A 的頁表裡沒有 B 的實體框，A 怎麼算都碰不到 B 的資料。一個程式寫壞記憶體，只會弄壞自己。</li>
<li><b>方便</b>：每個程式都可以假設自己從同樣的位址開始，不用管別人放在哪裡。</li>
<li><b>共用</b>：同一個共用函式庫（例如 C 標準函式庫），所有行程的頁表都指向同一份實體框，記憶體裡只放一份。</li>
<li><b>可以先欠著</b>：頁表可以標「這一頁現在不在記憶體裡」，等程式真的碰到再說。下面就是這一招。</li>
</ul>
<h4>分頁錯誤（page fault）不是錯誤</h4>
<p>程式碰到一頁標著「不在」的頁，MMU 就觸發<b>分頁錯誤</b>（page fault），像中斷一樣跳進作業系統。作業系統處理完，再讓那道指令重新執行一次，程式完全不知道剛才發生了什麼：</p>
<ul>
<li><b>輕微分頁錯誤</b>（minor fault）：不用讀磁碟。例如程式第一次寫入剛要來的記憶體，作業系統找一個空的實體框、清成 0、填進頁表就好，成本是微秒等級。</li>
<li><b>重大分頁錯誤</b>（major fault）：內容在磁碟上，例如執行檔裡第一次被執行到的那段程式碼，或之前被換出去的頁。要等磁碟，在 SSD 上大約 100 微秒的等級，是讀記憶體的一千倍。</li>
<li>真的不合法的位址（例如空指標 0）：作業系統送出 <code>SIGSEGV</code>，你看到的就是 segmentation fault。</li>
</ul>
<p>這也解釋了一個常讓人困惑的現象：<code>malloc</code> 了 1 GB，程式的記憶體用量卻幾乎沒變。作業系統只給了一段<b>虛擬</b>位址，頁表全標「不在」，碰到哪一頁才配哪一頁。<code>ps</code> 和 <code>top</code> 裡的 <b>VSZ</b>（virtual size）是拿到的虛擬位址總量，<b>RSS</b>（resident set size）才是真正佔著實體記憶體的量。</p>
<h4>swap 與 OOM</h4>
<p>實體記憶體不夠時，作業系統會挑一些最近沒用的頁，寫到磁碟上的<b>置換空間</b>（swap），把框空出來給別人。那些頁再被碰到時，就發生重大分頁錯誤讀回來。如果大家一直搶，頁不停地換出去、換回來，機器就會陷入<b>顛簸</b>（thrashing）：CPU 幾乎都在等磁碟，連滑鼠都動不了。</p>
<p>連 swap 都不夠，或根本沒開 swap（很多伺服器和 Kubernetes 節點都不開），Linux 就會叫出 <b>OOM killer</b>，挑一個行程直接砍掉。容器裡也一樣：Docker 和 Kubernetes 用 cgroup 給容器設記憶體上限，超過就被砍，你會看到 <code>OOMKilled</code>，結束碼 137（128 ＋ 9，也就是被 SIGKILL 砍掉）。</p>
<p>還有一個每次存取都要付的成本：頁表本身也放在記憶體裡。x86-64 的頁表通常有 4 層，查一次最多要讀 4 次記憶體，才知道真正的位址。所以 CPU 另外有一個專門的小快取，叫 <b>TLB</b>（translation lookaside buffer，轉譯後備緩衝區），記住最近翻譯過的頁。TLB 命中時，翻譯幾乎不花時間；未命中時，硬體得去走頁表。切換到另一個行程時，舊的翻譯不能用了，這也是上一課深入圖解說「行程切換比執行緒切換貴」的原因之一。</p>

<h3><span class="badge lv4">專家</span>九、邊界上的事：大多數人沒見過的情況</h3>
<h4>亞穩態：兩個時脈交會的地方</h4>
<p>第五節說，D 必須在建立時間和保持時間的窗口裡站穩。如果做不到呢？例如一個訊號來自另一個時脈（網路卡、USB 控制器都有自己的時脈），它改變的時間跟你的時脈毫無關係，遲早會剛好落在那個窗口裡。這時正反器可能卡在 0 和 1 之間的電壓，停留一段<b>無法預測</b>的時間才倒向某一邊，這叫<b>亞穩態</b>（metastability）。</p>
<p>它不能被消除，只能把機率壓到可以忽略。標準做法是讓訊號先連續經過兩個正反器（同步器，synchronizer）再使用，多給它一整拍的時間「下定決心」。卡住的機率會隨等待時間呈指數下降，多等一拍，就小到幾乎不會發生。晶片設計裡每一個跨時脈的地方都要這樣處理，漏掉一個，就是一個幾個月才發生一次、怎麼都重現不了的 bug。</p>
<h4>Rowhammer：讀這一列，弄壞隔壁</h4>
<p>DRAM 越做越密，相鄰兩列的電容器靠得非常近。2014 年的研究發現：在兩次刷新之間反覆開關同一列很多次（早期的晶片是十幾萬次，新一代更少），會讓<b>隔壁那一列</b>的電荷漏得特別快，在下次刷新前就翻轉位元。這叫 <b>Rowhammer</b>。隔年 Google Project Zero 示範了怎麼用它翻轉頁表裡的位元，讓普通程式拿到整台機器的權限；後來甚至有研究從瀏覽器裡的 JavaScript 做到。防禦包括更頻繁的刷新、讓記憶體偵測「被反覆開關的列」並提早刷新它的鄰居（target row refresh），以及 ECC。這個例子說明：硬體的物理特性，也是軟體的攻擊面。</p>
<h4>斷電不等於清空：冷開機攻擊</h4>
<p>DRAM 的電荷漏光需要時間：常溫下幾秒，冷卻以後可以撐到幾分鐘。2008 年普林斯頓大學的研究示範了<b>冷開機攻擊</b>（cold boot attack）：斷電後立刻冷卻記憶體，插到另一台機器上讀出內容，從裡面找出磁碟加密的金鑰。所以「關機就忘光」只在夠久之後才成立。</p>
<h4>位元會自己翻轉：ECC 記憶體</h4>
<p>就算沒有攻擊，宇宙射線和晶片材料本身的微量輻射，也會偶爾讓某個位元翻轉，叫<b>軟錯誤</b>（soft error）。一台筆電很少遇到；有幾萬台伺服器的資料中心，則天天都在發生。Google 2009 年對自家機群的研究就發現，記憶體錯誤比業界原本以為的常見得多。所以伺服器用 <b>ECC 記憶體</b>（error-correcting code）：每 64 個位元多存 8 個檢查位元，能自動修正一個位元的錯、偵測兩個位元的錯。</p>
<h4>TLB 的覆蓋範圍與大頁</h4>
<p>TLB 很小。假設第一層 TLB 有 64 項、每頁 4 KB，它只覆蓋 256 KB 的記憶體。一個資料庫在幾十 GB 的記憶體裡隨機讀，幾乎每次都 TLB 未命中，要去走 4 層頁表。解法是<b>大頁</b>（huge page）：x86-64 支援 2 MB 和 1 GB 的頁，同樣 64 項就能覆蓋 128 MB。PostgreSQL、JVM 都有使用大頁的設定。但 Linux 自動把小頁合併成大頁的功能（Transparent Huge Pages，THP）會在背景搬動記憶體，造成延遲突然飆高，所以 Redis 的官方文件建議關掉它。同一個機制，有的系統要開、有的要關，看你的存取模式。</p>
<h4>Meltdown：頁表上的一道牆被繞過</h4>
<p>過去作業系統為了讓系統呼叫快一點，把核心的記憶體也映射在每個行程的頁表裡，只標成「使用者模式不能讀」。2018 年的 <b>Meltdown</b> 漏洞發現，某些 CPU 在推測執行時會先把資料讀出來、之後才檢查權限，痕跡就留在快取裡（跟上一課深入圖解的 Spectre 同一類）。修補方式叫 KPTI（kernel page-table isolation）：在使用者模式時，頁表裡乾脆不放核心的記憶體。代價是每次系統呼叫都要換頁表，I/O 很頻繁的服務在當時的機器上明顯變慢。這是虛擬記憶體、快取和資安綁在一起的經典案例。</p>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>斷電後，記憶體立刻清空</td><td>DRAM 的電荷要幾秒到幾分鐘才漏光，冷卻後更久。冷開機攻擊就是利用這一點。</td></tr>
<tr><td>new 了 1 GB，就立刻用掉 1 GB 實體記憶體</td><td>只拿到虛擬位址。碰到哪一頁才配哪一頁，所以要看 RSS，不是 VSZ。</td></tr>
<tr><td>讀一個位元組，就只搬一個位元組</td><td>至少搬一整條快取列（64 或 128 位元組），DRAM 也是一次送一整塊。</td></tr>
<tr><td>swap 是多出來的記憶體</td><td>它是慢一千倍的備胎。伺服器經常在用 swap，代表該加記憶體，或是有東西在洩漏。</td></tr>
<tr><td>free 顯示閒置記憶體很少，就是快爆了</td><td>Linux 會把閒著的記憶體拿去當磁碟快取（page cache），需要時立刻讓出來。要看 available 那一欄。</td></tr>
<tr><td>時脈拉高，電腦就一定更快</td><td>最慢的那條路來不及，就會算錯。結果是當機，不是變快。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>Node.js</b>：V8 的堆積（heap）有上限，超過會出現「JavaScript heap out of memory」，可以用 <code>--max-old-space-size</code> 調整（單位是 MB）。但容器的記憶體上限算的是整個行程的 RSS，包含堆積外面的 Buffer 和原生模組。容器上限要比堆積設定多留一截，不然容器會先被 OOMKilled。</li>
<li><b>Docker 與 Kubernetes</b>：<code>resources.limits.memory</code> 是硬上限，超過就被砍，結束碼 137。<code>kubectl describe pod</code> 看到 <code>OOMKilled</code> 時，先分清楚是真的需要更多記憶體，還是有東西在慢慢洩漏：看 RSS 隨時間的曲線，一直往上爬、從不回落，就是洩漏。</li>
<li><b>Go</b>：Go 1.19 起有 <code>GOMEMLIMIT</code>，告訴垃圾回收器「接近這個量就要積極回收」。在容器裡把它設得比容器上限低一些，可以減少被 OOM 砍掉的機會。</li>
<li><b>遊戲（Cocos、Unity）</b>：每一格畫面都 new 一堆小物件，垃圾回收器遲早要停下來清，畫面就頓一下。物件池（object pool）和把資料排成連續的陣列，同時解決回收和快取兩個問題。另外，手機作業系統在記憶體吃緊時，會直接把背景的 App 砍掉，不會先問你。</li>
<li><b>資料庫與快取服務</b>：Redis 的資料集、PostgreSQL 常用的資料，都要放得進實體記憶體；一旦開始用 swap，延遲會從微秒變成毫秒。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<p>下面是後端、DevOps、遊戲工程師面試裡真的會出現的題目。先自己講一遍（最好出聲講），再打開參考答案。</p>
<ol>
<li>「SRAM 和 DRAM 差在哪？為什麼快取用 SRAM、主記憶體用 DRAM？」</li>
<li>「什麼是快取列？為什麼照順序走訪陣列，比走訪鏈結串列快很多？」</li>
<li>「解釋虛擬記憶體。什麼是 page fault？minor 和 major 差在哪？」</li>
<li>「一個容器一直被 OOMKilled，你會怎麼查？」</li>
<li>「什麼是 setup time 和關鍵路徑？為什麼超頻會讓電腦當機？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>SRAM 每個位元用 6 個電晶體組成互相撐住的迴圈，有電就保持、不必刷新，存取很快，但面積大、成本高；DRAM 每個位元只用一個電晶體加一個電容，密度高、便宜，但電荷會漏要定期刷新，讀取是破壞性的必須寫回，存取還要經過開列、讀欄等步驟，延遲是幾十奈秒。快取要的是快，容量小沒關係，所以用 SRAM；主記憶體要的是大和便宜，所以用 DRAM。</li>
<li>快取列是快取和記憶體之間搬資料的最小單位，常見 64 位元組（Apple M 系列是 128）。照順序走訪陣列時，一次未命中就把後面十幾個元素一起帶上來，硬體預取器也看得出規律、提早搬下一條；鏈結串列的節點散在記憶體各處，每個節點都可能是一次未命中，而且要讀到這個節點才知道下一個在哪，預取幫不上忙，每一步都付完整的記憶體延遲。</li>
<li>每個行程看到的是虛擬位址，MMU 透過作業系統維護的頁表，以頁為單位翻譯成實體位址，TLB 快取最近的翻譯結果。好處是隔離、共用和延遲配置。page fault 是存取到頁表標成「不在記憶體」的頁時，交給作業系統處理的機制：minor fault 不用讀磁碟，例如第一次碰剛配置的頁，或頁已經在 page cache 裡；major fault 要從磁碟讀，例如被換出去的頁或第一次讀到的檔案內容，慢上好幾個數量級。真正不合法的位址才會變成 segmentation fault。</li>
<li>先確認是哪一種砍：describe 看到 OOMKilled、結束碼 137，表示超過的是容器自己的記憶體上限（cgroup），不一定是整台機器沒記憶體。接著看記憶體用量隨時間的曲線：一啟動就爆，是上限設太低或啟動時載入太多；慢慢往上爬，是洩漏，要用語言的工具拍堆積快照比較（Node 的 heap snapshot、Go 的 pprof）。也要檢查執行環境的設定，例如 Node 的堆積上限比容器上限還大，或舊版 JVM 沒有依照容器上限決定堆積大小。</li>
<li>正反器在時脈邊緣取樣，資料必須在邊緣之前穩定一段時間（setup time），之後再保持一段時間（hold time）。兩個正反器之間最慢的組合邏輯路徑叫關鍵路徑，一拍至少要等於時脈到輸出延遲、關鍵路徑延遲和 setup time 的總和。超頻縮短了一拍，關鍵路徑來不及時，正反器抓到的是還沒算完的值，出現隨機的位元錯誤，表現成當機或資料損毀，而不是單純變慢。提高電壓能讓電晶體快一點，但耗電和發熱會急遽上升。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>SR 栓鎖器從「記著 1」的狀態開始，S 和 R 同時按下，再同時放開。照第一節的表格一步一步推，說明為什麼結果無法預測。</li>
<li>一個 L1 快取：64 KB、每條 64 位元組、4 路組關聯。它有幾組？位址的位移和組號各要幾個位元？</li>
<li>L1 命中要 1 奈秒，未命中要多花 80 奈秒。未命中率是 2% 和 10% 時，平均存取時間各是多少？</li>
<li>在你的 Mac 上執行 <code>getconf PAGESIZE</code> 和 <code>sysctl -n hw.cachelinesize</code>。兩個數字代表什麼？在一台 x86 的 Linux 伺服器上執行 <code>getconf PAGESIZE</code>，你預期看到多少？</li>
<li>兩個正反器之間：時脈到輸出 30 皮秒、建立時間 20 皮秒、最慢的閘路徑 400 皮秒。最高時脈是多少？想跑 4 GHz，閘路徑要縮到多少？</li>
<li>一個程式 <code>malloc</code> 了 2 GB，但只寫了前面 100 MB。<code>top</code> 裡它的 VSZ 和 RSS 大約各是多少？為什麼？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>按下時：A ＝ NOR(1, 非 Q) ＝ 0，B ＝ NOR(1, Q) ＝ 0，兩個輸出都是 0，Q 和非 Q 不再相反。同時放開時，A 看到 NOR(0, 0)，想變成 1；B 也看到 NOR(0, 0)，也想變成 1。誰先變成 1，就會把對方壓回 0，所以結果取決於兩個閘誰快了一點點，可能是 0、可能是 1，甚至來回振盪一陣子。這就是這個輸入組合被禁止的原因。</li>
<li>64 KB ÷ 64 ＝ 1024 條，÷ 4 ＝ 256 組。位移 6 個位元（2<sup>6</sup> ＝ 64），組號 8 個位元（2<sup>8</sup> ＝ 256），其餘是標籤。</li>
<li>2%：1 ＋ 0.02 × 80 ＝ 2.6 奈秒；10%：1 ＋ 0.1 × 80 ＝ 9 奈秒。未命中率變成 5 倍，平均就慢了將近 3.5 倍。</li>
<li>Apple silicon 上通常是 16384（一頁 16 KB）和 128（快取列 128 位元組）；Intel 的 Mac 會是 4096 和 64。x86 的 Linux 伺服器上，<code>getconf PAGESIZE</code> 通常是 4096。頁大小是虛擬記憶體翻譯的單位，快取列大小是一次從記憶體搬上來的量。</li>
<li>30 ＋ 400 ＋ 20 ＝ 450 皮秒，最高約 1 ÷ 450 皮秒 ≈ 2.2 GHz。4 GHz 一拍 250 皮秒，閘路徑要 ≤ 250 − 30 − 20 ＝ 200 皮秒，大約得把這條路切成兩級管線。</li>
<li>VSZ 至少 2 GB（再加上程式本身和函式庫），RSS 大約 100 MB 多一點。<code>malloc</code> 只配置虛擬位址；寫入時才發生分頁錯誤，作業系統才真的給實體框。沒碰過的 1.9 GB，只是頁表上的一個承諾。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>Ulrich Drepper〈What Every Programmer Should Know About Memory〉</b>（2007）：免費的長文，從 DRAM 的電路一路講到快取、TLB、NUMA，以及怎麼寫出對快取友善的程式。年代有點久，但原理全都還成立。</li>
<li><b>Bryant 與 O'Hallaron《Computer Systems: A Programmer's Perspective》</b>（CS:APP）：第 6 章記憶體階層、第 9 章虛擬記憶體，從寫程式的人的角度講這一章，是最好的課本。</li>
<li><b>Remzi 與 Andrea Arpaci-Dusseau《Operating Systems: Three Easy Pieces》</b>（OSTEP，網路上免費）：「Virtualization」那一部分，把頁表、TLB、swap 講得非常清楚。</li>
<li><b>Nand2Tetris</b>（<a href="https://www.nand2tetris.org/">nand2tetris.org</a>）第 3 個專案：從正反器開始，親手接出暫存器和 RAM。</li>
</ul>
` });
