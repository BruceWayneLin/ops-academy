DEEP({ 'mach-fast': `
<p>上一課說，處理器要更快有三條路：時脈更快、每一拍做更多事、核心更多，而每一條都撞過牆。這一章把這些牆量化：先用一條公式算出一顆核心到底多快；再算出加核心為什麼不會等比例變快；接著看 SIMD 和 GPU 怎麼用「一次做一整排」繞過去；然後是最常被忽略的那道牆：記憶體。你會看到同一個迴圈換個順序就快好幾倍，最後學會怎麼量效能，才不會騙到自己。</p>

<h3><span class="badge lv1">基礎</span>一、一條公式看懂 CPU 速度</h3>
<p>一個程式跑多久，可以拆成三個因子相乘，這叫處理器效能的「鐵律」（iron law of performance）：</p>
<p><b>執行時間 ＝ 指令數 × 每道指令平均幾拍（CPI）÷ 時脈頻率</b></p>
<p>CPI（cycles per instruction）的倒數就是 <b>IPC</b>（instructions per cycle，每拍完成幾道指令），所以也可以寫成：執行時間 ＝ 指令數 ÷（IPC × 時脈頻率）。三個因子由不同的人負責：</p>
<ul>
<li><b>指令數</b>：看演算法、編譯器、指令集。你把 O(n²) 改成 O(n log n)，改的是這一項。</li>
<li><b>IPC</b>：看微架構（管線、亂序、分支預測），也看你的程式配不配合。一直在等記憶體，IPC 就掉。</li>
<li><b>時脈頻率</b>：看製程和功耗，也就是下一節那道牆。</li>
</ul>
<p>代數字算一次。一個程式要跑 120 億道指令：</p>
<figure class="figure"><svg viewBox="0 0 640 224" class="fg" style="width:100%;max-width:640px" role="img" aria-label="同樣 1 奈秒：A 晶片 4 GHz 跳 4 拍，每拍平均 1.5 道，共 6 道；B 晶片 3 GHz 跳 3 拍，每拍 4 道，共 12 道">
<line x1="120" y1="24" x2="600" y2="24" class="fg-l dim"/>
<text x="120" y="16" text-anchor="middle" class="fg-t sm">0</text>
<text x="600" y="16" text-anchor="middle" class="fg-t sm">1 奈秒</text>
<text x="14" y="60" class="fg-t">A 晶片</text>
<text x="14" y="78" class="fg-t sm">4 GHz、IPC 1.5</text>
<rect x="120" y="44" width="480" height="40" rx="4" class="fg-b"/>
<line x1="240" y1="44" x2="240" y2="84" class="fg-l dim dash"/><line x1="360" y1="44" x2="360" y2="84" class="fg-l dim dash"/><line x1="480" y1="44" x2="480" y2="84" class="fg-l dim dash"/>
<rect x="136" y="52" width="40" height="24" rx="3" class="fg-b hot"/><rect x="184" y="52" width="40" height="24" rx="3" class="fg-b hot"/>
<rect x="280" y="52" width="40" height="24" rx="3" class="fg-b hot"/>
<rect x="376" y="52" width="40" height="24" rx="3" class="fg-b hot"/><rect x="424" y="52" width="40" height="24" rx="3" class="fg-b hot"/>
<rect x="520" y="52" width="40" height="24" rx="3" class="fg-b hot"/>
<text x="180" y="100" text-anchor="middle" class="fg-t sm">一拍 0.25 奈秒</text>
<text x="14" y="140" class="fg-t">B 晶片</text>
<text x="14" y="158" class="fg-t sm">3 GHz、IPC 4</text>
<rect x="120" y="124" width="480" height="40" rx="4" class="fg-b"/>
<line x1="280" y1="124" x2="280" y2="164" class="fg-l dim dash"/><line x1="440" y1="124" x2="440" y2="164" class="fg-l dim dash"/>
<rect x="131" y="132" width="30" height="24" rx="3" class="fg-b alt"/><rect x="167" y="132" width="30" height="24" rx="3" class="fg-b alt"/><rect x="203" y="132" width="30" height="24" rx="3" class="fg-b alt"/><rect x="239" y="132" width="30" height="24" rx="3" class="fg-b alt"/>
<rect x="291" y="132" width="30" height="24" rx="3" class="fg-b alt"/><rect x="327" y="132" width="30" height="24" rx="3" class="fg-b alt"/><rect x="363" y="132" width="30" height="24" rx="3" class="fg-b alt"/><rect x="399" y="132" width="30" height="24" rx="3" class="fg-b alt"/>
<rect x="451" y="132" width="30" height="24" rx="3" class="fg-b alt"/><rect x="487" y="132" width="30" height="24" rx="3" class="fg-b alt"/><rect x="523" y="132" width="30" height="24" rx="3" class="fg-b alt"/><rect x="559" y="132" width="30" height="24" rx="3" class="fg-b alt"/>
<text x="200" y="180" text-anchor="middle" class="fg-t sm">一拍 0.33 奈秒</text>
<text x="360" y="210" text-anchor="middle" class="fg-t">同樣 1 奈秒：A 完成 <tspan class="fg-t acc">6 道</tspan>，B 完成 <tspan class="fg-t alt">12 道</tspan></text>
</svg><figcaption>虛線隔開每一拍，小方塊是那一拍完成的指令。A 拍子打得快，但每拍做得少；B 拍子慢，每拍卻做四道。</figcaption></figure>
<ul>
<li>A 晶片：4 GHz，IPC 1.5。每秒完成 1.5 × 40 億 ＝ 60 億道，要 2 秒。</li>
<li>B 晶片：3 GHz，IPC 4。每秒完成 4 × 30 億 ＝ 120 億道，只要 1 秒。</li>
</ul>
<p>時脈低 25% 的 B，反而快了一倍。所以不同世代、不同廠牌的 CPU 不能只比 GHz。同一個程式在同一顆 CPU 上，IPC 也會大幅變動：純計算的迴圈，IPC 可以到 3、4 以上；一直在等記憶體的程式（例如走訪一個很大的鏈結串列），IPC 可能低於 0.5。Linux 上的 <code>perf stat</code> 會直接印出「insn per cycle」，這是判斷程式卡在「算」還是卡在「等」的第一個線索。</p>

<h3><span class="badge lv1">基礎</span>二、功耗牆：為什麼時脈停在 5 GHz 附近</h3>
<p>晶片的耗電，大部分花在電晶體開關的那一瞬間：每切換一次，就把一點點電荷灌進去、再放掉。這部分叫動態功耗，大約是：</p>
<p><b>動態功耗 ∝ 電容 × 電壓² × 時脈頻率</b></p>
<p>看起來跟頻率只是正比，問題出在電壓。第 0.5 課的深入圖解說過，要讓最慢的那條路在更短的一拍內跑完，就得讓電晶體切換更快，最直接的方法是<b>提高電壓</b>，而電壓又是平方。所以在高頻區，頻率和電壓一起往上推，功耗漲得比頻率快得多。</p>
<p>算一個例子（數字是為了示範比例）：時脈提高 20%，電壓也得提高 10%，功耗變成 1.2 × 1.1² ≈ 1.45 倍。快了 20%，熱卻多了 45%。而熱是有上限的：桌機 CPU 能散掉的熱大約一兩百瓦，筆電和手機少得多。</p>
<p>2005 年左右以前，這不是問題。電晶體每縮小一代，電壓也能跟著降，單位面積的功耗維持不變，這叫 <b>Dennard 縮放</b>（Dennard scaling）。後來電晶體小到一個程度，就算關著也會漏電，電壓降不下去，縮放就失效了。從此時脈只能往上爬一點點，設計師把多出來的電晶體拿去做別的事。下面是那個轉向背後的關鍵算式：</p>
<figure class="figure"><svg viewBox="0 0 640 250" class="fg" style="width:100%;max-width:640px" role="img" aria-label="一顆 4 GHz、1.2 V 的核心功耗當作 100%；兩顆 3 GHz、1.0 V 的核心各 52%，合計 104%，但工作量從 4 變成 6">
<text x="14" y="30" class="fg-t lg">功耗</text>
<text x="14" y="62" class="fg-t sm">一顆 4 GHz、1.2 V</text>
<rect x="150" y="44" width="300" height="26" rx="3" class="fg-b warm"/>
<text x="458" y="62" class="fg-t">100%</text>
<text x="14" y="96" class="fg-t sm">兩顆 3 GHz、1.0 V</text>
<rect x="150" y="78" width="156" height="26" rx="3" class="fg-b warm"/><rect x="306" y="78" width="156" height="26" rx="3" class="fg-b warm"/>
<text x="470" y="96" class="fg-t">52% ＋ 52% ≈ 104%</text>
<text x="14" y="140" class="fg-t lg">工作量</text>
<text x="14" y="172" class="fg-t sm">一顆 4 GHz</text>
<rect x="150" y="154" width="200" height="26" rx="3" class="fg-b alt"/>
<text x="358" y="172" class="fg-t">4</text>
<text x="14" y="206" class="fg-t sm">兩顆 3 GHz</text>
<rect x="150" y="188" width="150" height="26" rx="3" class="fg-b hot"/><rect x="300" y="188" width="150" height="26" rx="3" class="fg-b hot"/>
<text x="458" y="206" class="fg-t acc">3 ＋ 3 ＝ 6（多 50%）</text>
<text x="320" y="240" text-anchor="middle" class="fg-t sm">前提：工作要能拆成兩半同時做</text>
</svg><figcaption>降一點頻率，電壓就能降，功耗按平方掉下來。省下的電拿去多養一顆核心，總工作量多了一半，熱卻差不多。</figcaption></figure>
<p>一顆核心跑 4 GHz、1.2 V，當作功耗 100%。換成兩顆核心，各跑 3 GHz，電壓降到 1.0 V：每顆的功耗是 (3/4) × (1.0/1.2)² ≈ 52%，兩顆加起來 104%，差不多一樣熱。可是如果工作能平分給兩顆，總工作量是 3 ＋ 3 ＝ 6，比 4 多了 50%。<b>同樣的電，換更多的工作量</b>，前提是工作拆得開。這就是多核心時代的由來，也是手機和 M 系列晶片放「省電核心」的道理：低頻低壓的核心，每做一件事花的電少得多。</p>
<p>現代晶片也很會「看情況衝刺」：只有一兩顆核心在忙、溫度又還低的時候，把它們推到很高的時脈（Intel 叫 Turbo Boost，AMD 叫 Precision Boost）；全部核心都滿載時，時脈反而會降下來。這對量效能影響很大，第八節會講。</p>

<h3><span class="badge lv2">進階</span>三、多核心與 Amdahl 定律</h3>
<p>有了 8 顆核心，程式會快 8 倍嗎？幾乎永遠不會。1967 年 Gene Amdahl 指出：程式裡總有一段<b>只能一個人做</b>的部分，例如讀設定、把結果合併、搶同一把鎖。這段不會因為核心變多而變短。</p>
<p>假設一個工作在單核心上要跑 100 秒，其中 20 秒只能循序做，80 秒可以平分給任意多顆核心：</p>
<figure class="figure"><svg viewBox="0 0 640 240" class="fg" style="width:100%;max-width:640px" role="img" aria-label="Amdahl 定律：循序的 20 秒永遠在，平行的 80 秒隨核心數變短，1 顆 100 秒、2 顆 60 秒、4 顆 40 秒、8 顆 30 秒、16 顆 25 秒、無限多顆 20 秒">
<rect x="110" y="5" width="12" height="10" class="fg-b warm"/><text x="128" y="14" class="fg-t sm">只能一個人做：20 秒</text>
<rect x="300" y="5" width="12" height="10" class="fg-b hot"/><text x="318" y="14" class="fg-t sm">可以平分：80 秒</text>
<line x1="190" y1="28" x2="190" y2="234" class="fg-l dim dash"/>
<text x="96" y="53" text-anchor="end" class="fg-t">1 顆</text>
<rect x="110" y="36" width="80" height="24" class="fg-b warm"/><rect x="190" y="36" width="320" height="24" class="fg-b hot"/>
<text x="518" y="53" class="fg-t">100 秒</text>
<text x="96" y="87" text-anchor="end" class="fg-t">2 顆</text>
<rect x="110" y="70" width="80" height="24" class="fg-b warm"/><rect x="190" y="70" width="160" height="24" class="fg-b hot"/>
<text x="358" y="87" class="fg-t">60 秒</text>
<text x="96" y="121" text-anchor="end" class="fg-t">4 顆</text>
<rect x="110" y="104" width="80" height="24" class="fg-b warm"/><rect x="190" y="104" width="80" height="24" class="fg-b hot"/>
<text x="278" y="121" class="fg-t">40 秒</text>
<text x="96" y="155" text-anchor="end" class="fg-t">8 顆</text>
<rect x="110" y="138" width="80" height="24" class="fg-b warm"/><rect x="190" y="138" width="40" height="24" class="fg-b hot"/>
<text x="238" y="155" class="fg-t">30 秒</text>
<text x="96" y="189" text-anchor="end" class="fg-t">16 顆</text>
<rect x="110" y="172" width="80" height="24" class="fg-b warm"/><rect x="190" y="172" width="20" height="24" class="fg-b hot"/>
<text x="218" y="189" class="fg-t">25 秒</text>
<text x="96" y="223" text-anchor="end" class="fg-t">無限多</text>
<rect x="110" y="206" width="80" height="24" class="fg-b warm"/>
<text x="198" y="223" class="fg-t warm">20 秒：最快就這樣</text>
</svg><figcaption>綠色那段跟著核心數變短，橘色那段一秒都不會少。核心越多，總時間越接近虛線，也就是循序部分的 20 秒。</figcaption></figure>
<table>
<tr><th>核心數</th><th>循序部分</th><th>平行部分</th><th>總時間</th><th>加速倍數</th></tr>
<tr><td>1</td><td>20 秒</td><td>80 秒</td><td>100 秒</td><td>1 倍</td></tr>
<tr><td>2</td><td>20 秒</td><td>40 秒</td><td>60 秒</td><td>1.67 倍</td></tr>
<tr><td>4</td><td>20 秒</td><td>20 秒</td><td>40 秒</td><td>2.5 倍</td></tr>
<tr><td>8</td><td>20 秒</td><td>10 秒</td><td>30 秒</td><td>3.33 倍</td></tr>
<tr><td>16</td><td>20 秒</td><td>5 秒</td><td>25 秒</td><td>4 倍</td></tr>
<tr><td>無限多</td><td>20 秒</td><td>0 秒</td><td>20 秒</td><td>5 倍（上限）</td></tr>
</table>
<p>寫成公式：平行的比例是 p，核心數是 N，加速倍數 ＝ 1 ÷ [(1 − p) ＋ p ÷ N]。上限是 1 ÷ (1 − p)：只要 20% 是循序的，就算有一萬顆核心，最多也只快 5 倍。從 8 顆加到 16 顆，硬體加倍，時間只從 30 秒變成 25 秒。</p>
<p>真實世界比公式更糟，因為公式假設平行部分「完美平分、不用溝通」。實際上執行緒之間要同步、要搶鎖、要在核心之間搬資料，核心越多，這些額外成本越大，很多服務加到某個核心數以後反而變慢。也有好消息：<b>Gustafson 定律</b>指出，核心變多時，我們通常會順便處理更大的問題（更多使用者、更大的資料），平行部分跟著變大，循序部分的比例就變小。伺服器同時服務一萬個彼此無關的請求，就是接近完美的平行。</p>
<h4>這在你的服務上長什麼樣子</h4>
<ul>
<li><b>Node.js</b>：你的 JavaScript 只跑在一條執行緒上（第 0.9 課）。要用到多顆核心，就開多個行程（<code>cluster</code> 模組、PM2，或在 Kubernetes 裡多開幾個 Pod），或把吃重的計算丟到 <code>worker_threads</code>。</li>
<li><b>Go</b>：<code>GOMAXPROCS</code> 決定同時有幾條執行緒在跑 Go 程式碼，預設等於 CPU 數。在容器裡要確認它看到的是容器的 CPU 上限：Go 1.25 起會自動依容器的上限設定，更早的版本常用 <code>uber-go/automaxprocs</code> 套件處理。</li>
<li><b>Kubernetes 的 CPU 上限是「配額」，不是「核心數」</b>。<code>limits.cpu: 1</code> 的意思是：每 100 毫秒，這個容器所有執行緒加起來最多用 100 毫秒的 CPU 時間。一個有 4 條忙碌執行緒的服務，可能前 25 毫秒就把配額用完，接下來 75 毫秒全部被暫停（throttling）。平均 CPU 使用率看起來不高，延遲卻一直出現尖峰。</li>
</ul>

<h3><span class="badge lv2">進階</span>四、SIMD：一道指令算一整排</h3>
<p>前面講的都是「一道指令處理一個數字」。可是很多工作是對一大排數字做同一件事：每個像素調亮一點、兩個陣列逐項相加、一個向量乘一個矩陣。<b>SIMD</b>（single instruction, multiple data，單一指令多重資料）讓一道指令同時處理好幾個數字。</p>
<p>做法是很寬的暫存器。128 位元的暫存器可以並排放 4 個 32 位元的浮點數（或 16 個 8 位元的像素值），一道加法指令，4 組同時加：</p>
<figure class="figure"><svg viewBox="0 0 640 244" class="fg" style="width:100%;max-width:640px" role="img" aria-label="左邊一般指令做四次加法，右邊 SIMD 把四個數字放進一個寬暫存器，一道 add 同時算出四個答案">
<rect x="10" y="8" width="300" height="228" rx="10" class="fg-b"/>
<text x="160" y="34" text-anchor="middle" class="fg-t lg">一般指令：4 道</text>
<rect x="30" y="50" width="260" height="28" rx="5" class="fg-b alt"/><text x="160" y="69" text-anchor="middle" class="fg-t mono">add：1 + 10 → 11</text>
<rect x="30" y="88" width="260" height="28" rx="5" class="fg-b alt"/><text x="160" y="107" text-anchor="middle" class="fg-t mono">add：2 + 20 → 22</text>
<rect x="30" y="126" width="260" height="28" rx="5" class="fg-b alt"/><text x="160" y="145" text-anchor="middle" class="fg-t mono">add：3 + 30 → 33</text>
<rect x="30" y="164" width="260" height="28" rx="5" class="fg-b alt"/><text x="160" y="183" text-anchor="middle" class="fg-t mono">add：4 + 40 → 44</text>
<text x="160" y="220" text-anchor="middle" class="fg-t sm">4 道指令，各自解碼、各自執行</text>
<rect x="330" y="8" width="300" height="228" rx="10" class="fg-b"/>
<text x="480" y="34" text-anchor="middle" class="fg-t lg">SIMD：1 道</text>
<text x="372" y="70" text-anchor="end" class="fg-t">a</text>
<rect x="380" y="50" width="60" height="30" class="fg-b"/><rect x="440" y="50" width="60" height="30" class="fg-b"/><rect x="500" y="50" width="60" height="30" class="fg-b"/><rect x="560" y="50" width="60" height="30" class="fg-b"/>
<text x="410" y="70" text-anchor="middle" class="fg-t mono">1</text><text x="470" y="70" text-anchor="middle" class="fg-t mono">2</text><text x="530" y="70" text-anchor="middle" class="fg-t mono">3</text><text x="590" y="70" text-anchor="middle" class="fg-t mono">4</text>
<text x="500" y="95" text-anchor="middle" class="fg-t lg">＋</text>
<text x="372" y="120" text-anchor="end" class="fg-t">b</text>
<rect x="380" y="100" width="60" height="30" class="fg-b"/><rect x="440" y="100" width="60" height="30" class="fg-b"/><rect x="500" y="100" width="60" height="30" class="fg-b"/><rect x="560" y="100" width="60" height="30" class="fg-b"/>
<text x="410" y="120" text-anchor="middle" class="fg-t mono">10</text><text x="470" y="120" text-anchor="middle" class="fg-t mono">20</text><text x="530" y="120" text-anchor="middle" class="fg-t mono">30</text><text x="590" y="120" text-anchor="middle" class="fg-t mono">40</text>
<line x1="500" y1="132" x2="500" y2="150" class="fg-l on"/><polygon points="500,158 495.5,150 504.5,150" class="fg-a on"/>
<text x="510" y="150" class="fg-t sm acc">一道 add</text>
<text x="372" y="178" text-anchor="end" class="fg-t">結果</text>
<rect x="380" y="158" width="60" height="30" class="fg-b hot"/><rect x="440" y="158" width="60" height="30" class="fg-b hot"/><rect x="500" y="158" width="60" height="30" class="fg-b hot"/><rect x="560" y="158" width="60" height="30" class="fg-b hot"/>
<text x="410" y="178" text-anchor="middle" class="fg-t mono">11</text><text x="470" y="178" text-anchor="middle" class="fg-t mono">22</text><text x="530" y="178" text-anchor="middle" class="fg-t mono">33</text><text x="590" y="178" text-anchor="middle" class="fg-t mono">44</text>
<text x="480" y="220" text-anchor="middle" class="fg-t sm">1 道指令，4 個答案</text>
</svg><figcaption>右邊的 a、b、結果各是一個 128 位元的暫存器，切成 4 格。取指令、解碼的成本只付一次，做的事卻是 4 倍。</figcaption></figure>
<table>
<tr><th>名稱</th><th>寬度</th><th>一次幾個 32 位元浮點數</th><th>在哪裡</th></tr>
<tr><td>SSE</td><td>128 位元</td><td>4</td><td>所有 x86-64</td></tr>
<tr><td>AVX2</td><td>256 位元</td><td>8</td><td>近十年大部分的 x86</td></tr>
<tr><td>AVX-512</td><td>512 位元</td><td>16</td><td>部分伺服器和較新的 AMD 晶片</td></tr>
<tr><td>NEON</td><td>128 位元</td><td>4</td><td>所有 ARM64，包含手機和 M 系列</td></tr>
</table>
<p>你不一定要自己寫 SIMD 指令：</p>
<ul>
<li><b>編譯器自動向量化</b>（auto-vectorization）：C、C++、Rust 的編譯器開了最佳化，會把簡單的迴圈自動改寫成 SIMD。條件是：資料是連續的陣列、每一圈互不依賴、迴圈裡沒有複雜的分支。<code>sum += a[i]</code> 這類可以；<code>a[i] = a[i-1] + 1</code> 不行，因為每一圈都要等上一圈的結果。</li>
<li><b>函式庫已經幫你做了</b>：<code>memcpy</code>、字串搜尋、JSON 解析（simdjson）、影像和影片編解碼、NumPy，裡面都是大量的 SIMD。</li>
<li><b>遊戲引擎</b>：Unity 的 Burst 編譯器搭配 <code>Unity.Mathematics</code> 的 <code>float4</code>，就是為了讓 C# 產生 SIMD 指令。</li>
<li><b>瀏覽器</b>：JavaScript 本身沒有 SIMD；WebAssembly 有 128 位元的 SIMD 指令，主流瀏覽器都支援。</li>
</ul>
<p>SIMD 的道理跟功耗牆一樣：取指令、解碼、排程的成本是固定的，讓一道指令做 8 份工作，每份工作分到的成本就只剩八分之一，耗電也是。</p>

<h3><span class="badge lv3">專業</span>五、GPU：用幾千個小工人換吞吐量</h3>
<p>CPU 的設計目標是<b>讓一件事盡快做完</b>（低延遲）：大快取、分支預測、亂序執行，晶片面積大部分花在「讓單一條指令流不要等」。GPU 的目標相反：<b>讓一大堆事加起來做最多</b>（高吞吐量），它把面積幾乎全部拿去放運算單元。</p>
<figure class="figure"><svg viewBox="0 0 640 252" class="fg" style="width:100%;max-width:640px" role="img" aria-label="CPU 是四顆大核心加大快取；GPU 是一排排小運算單元，每排共用一個控制單元，快取較小但頻寬很大">
<text x="155" y="22" text-anchor="middle" class="fg-t lg">CPU</text>
<rect x="10" y="30" width="290" height="190" rx="10" class="fg-b"/>
<rect x="24" y="44" width="120" height="60" rx="6" class="fg-b alt"/><text x="84" y="70" text-anchor="middle" class="fg-t">大核心</text><text x="84" y="90" text-anchor="middle" class="fg-t sm">預測、亂序</text>
<rect x="156" y="44" width="120" height="60" rx="6" class="fg-b alt"/><text x="216" y="70" text-anchor="middle" class="fg-t">大核心</text><text x="216" y="90" text-anchor="middle" class="fg-t sm">預測、亂序</text>
<rect x="24" y="112" width="120" height="60" rx="6" class="fg-b alt"/><text x="84" y="138" text-anchor="middle" class="fg-t">大核心</text><text x="84" y="158" text-anchor="middle" class="fg-t sm">預測、亂序</text>
<rect x="156" y="112" width="120" height="60" rx="6" class="fg-b alt"/><text x="216" y="138" text-anchor="middle" class="fg-t">大核心</text><text x="216" y="158" text-anchor="middle" class="fg-t sm">預測、亂序</text>
<rect x="24" y="180" width="252" height="30" rx="6" class="fg-b warm"/><text x="150" y="200" text-anchor="middle" class="fg-t">大快取（幾十 MB）</text>
<text x="480" y="22" text-anchor="middle" class="fg-t lg">GPU</text>
<rect x="330" y="30" width="300" height="190" rx="10" class="fg-b"/>
<rect x="342" y="44" width="30" height="24" rx="3" class="fg-b alt"/><text x="357" y="60" text-anchor="middle" class="fg-t sm">控制</text>
<rect x="378" y="44" width="16" height="24" rx="2" class="fg-b hot"/><rect x="398" y="44" width="16" height="24" rx="2" class="fg-b hot"/><rect x="418" y="44" width="16" height="24" rx="2" class="fg-b hot"/><rect x="438" y="44" width="16" height="24" rx="2" class="fg-b hot"/><rect x="458" y="44" width="16" height="24" rx="2" class="fg-b hot"/><rect x="478" y="44" width="16" height="24" rx="2" class="fg-b hot"/><rect x="498" y="44" width="16" height="24" rx="2" class="fg-b hot"/><rect x="518" y="44" width="16" height="24" rx="2" class="fg-b hot"/><rect x="538" y="44" width="16" height="24" rx="2" class="fg-b hot"/><rect x="558" y="44" width="16" height="24" rx="2" class="fg-b hot"/><rect x="578" y="44" width="16" height="24" rx="2" class="fg-b hot"/><rect x="598" y="44" width="16" height="24" rx="2" class="fg-b hot"/>
<rect x="342" y="76" width="30" height="24" rx="3" class="fg-b alt"/><text x="357" y="92" text-anchor="middle" class="fg-t sm">控制</text>
<rect x="378" y="76" width="16" height="24" rx="2" class="fg-b hot"/><rect x="398" y="76" width="16" height="24" rx="2" class="fg-b hot"/><rect x="418" y="76" width="16" height="24" rx="2" class="fg-b hot"/><rect x="438" y="76" width="16" height="24" rx="2" class="fg-b hot"/><rect x="458" y="76" width="16" height="24" rx="2" class="fg-b hot"/><rect x="478" y="76" width="16" height="24" rx="2" class="fg-b hot"/><rect x="498" y="76" width="16" height="24" rx="2" class="fg-b hot"/><rect x="518" y="76" width="16" height="24" rx="2" class="fg-b hot"/><rect x="538" y="76" width="16" height="24" rx="2" class="fg-b hot"/><rect x="558" y="76" width="16" height="24" rx="2" class="fg-b hot"/><rect x="578" y="76" width="16" height="24" rx="2" class="fg-b hot"/><rect x="598" y="76" width="16" height="24" rx="2" class="fg-b hot"/>
<rect x="342" y="108" width="30" height="24" rx="3" class="fg-b alt"/><text x="357" y="124" text-anchor="middle" class="fg-t sm">控制</text>
<rect x="378" y="108" width="16" height="24" rx="2" class="fg-b hot"/><rect x="398" y="108" width="16" height="24" rx="2" class="fg-b hot"/><rect x="418" y="108" width="16" height="24" rx="2" class="fg-b hot"/><rect x="438" y="108" width="16" height="24" rx="2" class="fg-b hot"/><rect x="458" y="108" width="16" height="24" rx="2" class="fg-b hot"/><rect x="478" y="108" width="16" height="24" rx="2" class="fg-b hot"/><rect x="498" y="108" width="16" height="24" rx="2" class="fg-b hot"/><rect x="518" y="108" width="16" height="24" rx="2" class="fg-b hot"/><rect x="538" y="108" width="16" height="24" rx="2" class="fg-b hot"/><rect x="558" y="108" width="16" height="24" rx="2" class="fg-b hot"/><rect x="578" y="108" width="16" height="24" rx="2" class="fg-b hot"/><rect x="598" y="108" width="16" height="24" rx="2" class="fg-b hot"/>
<rect x="342" y="140" width="30" height="24" rx="3" class="fg-b alt"/><text x="357" y="156" text-anchor="middle" class="fg-t sm">控制</text>
<rect x="378" y="140" width="16" height="24" rx="2" class="fg-b hot"/><rect x="398" y="140" width="16" height="24" rx="2" class="fg-b hot"/><rect x="418" y="140" width="16" height="24" rx="2" class="fg-b hot"/><rect x="438" y="140" width="16" height="24" rx="2" class="fg-b hot"/><rect x="458" y="140" width="16" height="24" rx="2" class="fg-b hot"/><rect x="478" y="140" width="16" height="24" rx="2" class="fg-b hot"/><rect x="498" y="140" width="16" height="24" rx="2" class="fg-b hot"/><rect x="518" y="140" width="16" height="24" rx="2" class="fg-b hot"/><rect x="538" y="140" width="16" height="24" rx="2" class="fg-b hot"/><rect x="558" y="140" width="16" height="24" rx="2" class="fg-b hot"/><rect x="578" y="140" width="16" height="24" rx="2" class="fg-b hot"/><rect x="598" y="140" width="16" height="24" rx="2" class="fg-b hot"/>
<rect x="342" y="180" width="272" height="30" rx="6" class="fg-b warm"/><text x="478" y="200" text-anchor="middle" class="fg-t">小快取＋超大記憶體頻寬</text>
<text x="155" y="242" text-anchor="middle" class="fg-t sm">少數聰明的大核心：一件事做最快</text>
<text x="480" y="242" text-anchor="middle" class="fg-t sm">一排共用一個控制：同一道指令一起做</text>
</svg><figcaption>示意圖，不照比例。CPU 把面積花在控制和快取，讓每顆核心都很聰明；GPU 把面積花在運算單元，一排單元共用一個控制，對不同資料執行同一道指令。</figcaption></figure>
<ul>
<li><b>成群執行</b>：GPU 把執行緒每 32 個（NVIDIA 叫 warp）或 32、64 個（AMD 叫 wavefront）編成一組，同一組在同一時刻執行同一道指令，只是資料不同。這叫 SIMT（single instruction, multiple threads），本質上是把 SIMD 藏在「很多執行緒」的寫法後面。</li>
<li><b>靠切換藏住等待</b>：CPU 用大快取避免等記憶體；GPU 的做法是同時掛著幾十組執行緒，一組在等記憶體，就馬上換另一組上來算。所以 GPU 要有非常多的工作才吃得飽。</li>
<li><b>頻寬很大</b>：高階顯示卡的記憶體頻寬是每秒一到數 TB 的等級，桌機 CPU 的主記憶體大約每秒幾十 GB 到一百 GB 左右。</li>
</ul>
<h4>什麼時候 GPU 會輸</h4>
<ul>
<li><b>分支會分歧</b>：同一組的 32 條執行緒，如果一半走 if、一半走 else，硬體只能兩邊都跑一次，沒走那邊的執行緒在旁邊等。分支越亂，效率越低。</li>
<li><b>資料太少</b>：幾千個數字，GPU 還沒熱身就做完了，不如 CPU。</li>
<li><b>搬資料的成本</b>：獨立顯示卡的資料要經過 PCIe 送過去、再送回來。如果計算本身很快，時間全花在搬運上。</li>
<li><b>邏輯很複雜</b>：遊戲的規則判斷、AI、網路協定，充滿分支和不規則的記憶體存取，是 CPU 的主場。</li>
</ul>
<p>遊戲就是兩者分工的最好例子：CPU 跑遊戲邏輯、物理，決定要畫什麼，把一批批<b>繪製呼叫</b>（draw call）交給 GPU；GPU 對幾百萬個像素同時跑著色器（shader）。畫面卡頓時，第一個問題是「現在瓶頸在 CPU 還是 GPU」。如果是 CPU 送 draw call 送不完，就要合併繪製（batching）、把小圖併成圖集（atlas）；如果是 GPU 畫不完，就要降解析度、簡化著色器、減少同一個像素被重複畫（overdraw）。</p>

<h3><span class="badge lv3">專業</span>六、記憶體牆：同一個迴圈，換個順序快好幾倍</h3>
<p>過去幾十年，CPU 的運算速度進步得比記憶體快得多，兩者的差距越拉越大，這叫<b>記憶體牆</b>（memory wall）。今天一顆核心一拍可以做好幾道運算，從主記憶體拿一個數字卻要等幾百拍。很多程式真正的瓶頸不是算，而是<b>等資料</b>。</p>
<p>先分清楚兩個常被混用的詞：</p>
<ul>
<li><b>延遲</b>（latency）：要一筆資料，等多久才拿到。主記憶體大約 100 奈秒。</li>
<li><b>頻寬</b>（bandwidth）：資料源源不絕流過來時，每秒能流多少。雙通道 DDR5-5600 理論上每秒大約 90 GB；M1 大約每秒 68 GB。</li>
</ul>
<p>延遲像從台北開到台中要多久，頻寬像這條高速公路一小時能過幾輛車。照順序讀資料時，硬體<b>預取器</b>（prefetcher）會看出規律，提早把下一條快取列搬上來，你吃到的是頻寬；隨機亂跳時，預取器猜不到，每一次都要付一次完整的延遲。</p>
<h4>經典例子：二維陣列的走訪順序</h4>
<pre><code>const N = 4096;
const a = new Int32Array(N * N);   // 64 MB，一列接著一列存放

// 版本一：外層走列、內層走欄（照記憶體順序）
let s = 0;
for (let i = 0; i &lt; N; i++)
  for (let j = 0; j &lt; N; j++)
    s += a[i * N + j];

// 版本二：外層走欄、內層走列（每一步跳過一整列）
for (let j = 0; j &lt; N; j++)
  for (let i = 0; i &lt; N; i++)
    s += a[i * N + j];</code></pre>
<p>兩個版本做的加法一模一樣，都是 1,677 萬次。但在大部分機器上，版本二會慢好幾倍（大陣列上常見 3 到 10 倍，看機器和語言）。</p>
<figure class="figure"><svg viewBox="0 0 640 290" class="fg" style="width:100%;max-width:640px" role="img" aria-label="同一個 4 列 8 欄的陣列：版本一沿著列走，連續幾次落在同一條快取列；版本二沿著欄走，每一步都跳到另一條快取列。下方是陣列在記憶體裡的實際排列">
<text x="150" y="24" text-anchor="middle" class="fg-t acc">版本一：照列走</text>
<text x="490" y="24" text-anchor="middle" class="fg-t warm">版本二：照欄走</text>
<rect x="30" y="50" width="120" height="30" class="fg-b hot"/><rect x="150" y="50" width="120" height="30" class="fg-b alt"/>
<rect x="30" y="80" width="120" height="30" class="fg-b hot"/><rect x="150" y="80" width="120" height="30" class="fg-b alt"/>
<rect x="30" y="110" width="120" height="30" class="fg-b hot"/><rect x="150" y="110" width="120" height="30" class="fg-b alt"/>
<rect x="30" y="140" width="120" height="30" class="fg-b hot"/><rect x="150" y="140" width="120" height="30" class="fg-b alt"/>
<line x1="60" y1="50" x2="60" y2="170" class="fg-l dim"/><line x1="90" y1="50" x2="90" y2="170" class="fg-l dim"/><line x1="120" y1="50" x2="120" y2="170" class="fg-l dim"/><line x1="180" y1="50" x2="180" y2="170" class="fg-l dim"/><line x1="210" y1="50" x2="210" y2="170" class="fg-l dim"/><line x1="240" y1="50" x2="240" y2="170" class="fg-l dim"/>
<line x1="38" y1="65" x2="254" y2="65" class="fg-l on"/><polygon points="262,65 254,60.5 254,69.5" class="fg-a on"/>
<line x1="38" y1="95" x2="254" y2="95" class="fg-l on"/><polygon points="262,95 254,90.5 254,99.5" class="fg-a on"/>
<line x1="38" y1="125" x2="254" y2="125" class="fg-l on"/><polygon points="262,125 254,120.5 254,129.5" class="fg-a on"/>
<line x1="38" y1="155" x2="254" y2="155" class="fg-l on"/><polygon points="262,155 254,150.5 254,159.5" class="fg-a on"/>
<text x="24" y="69" text-anchor="end" class="fg-t sm acc">1</text><text x="24" y="99" text-anchor="end" class="fg-t sm acc">2</text><text x="24" y="129" text-anchor="end" class="fg-t sm acc">3</text><text x="24" y="159" text-anchor="end" class="fg-t sm acc">4</text>
<rect x="370" y="50" width="120" height="30" class="fg-b hot"/><rect x="490" y="50" width="120" height="30" class="fg-b alt"/>
<rect x="370" y="80" width="120" height="30" class="fg-b hot"/><rect x="490" y="80" width="120" height="30" class="fg-b alt"/>
<rect x="370" y="110" width="120" height="30" class="fg-b hot"/><rect x="490" y="110" width="120" height="30" class="fg-b alt"/>
<rect x="370" y="140" width="120" height="30" class="fg-b hot"/><rect x="490" y="140" width="120" height="30" class="fg-b alt"/>
<line x1="400" y1="50" x2="400" y2="170" class="fg-l dim"/><line x1="430" y1="50" x2="430" y2="170" class="fg-l dim"/><line x1="460" y1="50" x2="460" y2="170" class="fg-l dim"/><line x1="520" y1="50" x2="520" y2="170" class="fg-l dim"/><line x1="550" y1="50" x2="550" y2="170" class="fg-l dim"/><line x1="580" y1="50" x2="580" y2="170" class="fg-l dim"/>
<line x1="385" y1="54" x2="385" y2="158" class="fg-l warm"/><polygon points="385,166 380.5,158 389.5,158" class="fg-a warm"/>
<line x1="415" y1="54" x2="415" y2="158" class="fg-l warm"/><polygon points="415,166 410.5,158 419.5,158" class="fg-a warm"/>
<line x1="445" y1="54" x2="445" y2="158" class="fg-l warm"/><polygon points="445,166 440.5,158 449.5,158" class="fg-a warm"/>
<line x1="475" y1="54" x2="475" y2="158" class="fg-l warm"/><polygon points="475,166 470.5,158 479.5,158" class="fg-a warm"/>
<line x1="505" y1="54" x2="505" y2="158" class="fg-l warm"/><polygon points="505,166 500.5,158 509.5,158" class="fg-a warm"/>
<line x1="535" y1="54" x2="535" y2="158" class="fg-l warm"/><polygon points="535,166 530.5,158 539.5,158" class="fg-a warm"/>
<line x1="565" y1="54" x2="565" y2="158" class="fg-l warm"/><polygon points="565,166 560.5,158 569.5,158" class="fg-a warm"/>
<line x1="595" y1="54" x2="595" y2="158" class="fg-l warm"/><polygon points="595,166 590.5,158 599.5,158" class="fg-a warm"/>
<text x="385" y="44" text-anchor="middle" class="fg-t sm warm">1</text><text x="415" y="44" text-anchor="middle" class="fg-t sm warm">2</text><text x="445" y="44" text-anchor="middle" class="fg-t sm warm">3</text><text x="475" y="44" text-anchor="middle" class="fg-t sm warm">4</text><text x="505" y="44" text-anchor="middle" class="fg-t sm warm">5</text><text x="535" y="44" text-anchor="middle" class="fg-t sm warm">6</text><text x="565" y="44" text-anchor="middle" class="fg-t sm warm">7</text><text x="595" y="44" text-anchor="middle" class="fg-t sm warm">8</text>
<text x="150" y="194" text-anchor="middle" class="fg-t sm acc">連續 4 次落在同一條快取列</text>
<text x="150" y="212" text-anchor="middle" class="fg-t sm">預取器看得出規律</text>
<text x="490" y="194" text-anchor="middle" class="fg-t sm warm">每一步都換到另一條快取列</text>
<text x="490" y="212" text-anchor="middle" class="fg-t sm">一條只用到一格就換下一條</text>
<text x="20" y="238" class="fg-t sm">記憶體裡的實際順序：一長條</text>
<rect x="20" y="244" width="72" height="18" class="fg-b hot"/><rect x="92" y="244" width="72" height="18" class="fg-b alt"/><rect x="164" y="244" width="72" height="18" class="fg-b hot"/><rect x="236" y="244" width="72" height="18" class="fg-b alt"/><rect x="308" y="244" width="72" height="18" class="fg-b hot"/><rect x="380" y="244" width="72" height="18" class="fg-b alt"/><rect x="452" y="244" width="72" height="18" class="fg-b hot"/><rect x="524" y="244" width="72" height="18" class="fg-b alt"/>
<line x1="38" y1="244" x2="38" y2="262" class="fg-l dim"/><line x1="56" y1="244" x2="56" y2="262" class="fg-l dim"/><line x1="74" y1="244" x2="74" y2="262" class="fg-l dim"/><line x1="110" y1="244" x2="110" y2="262" class="fg-l dim"/><line x1="128" y1="244" x2="128" y2="262" class="fg-l dim"/><line x1="146" y1="244" x2="146" y2="262" class="fg-l dim"/><line x1="182" y1="244" x2="182" y2="262" class="fg-l dim"/><line x1="200" y1="244" x2="200" y2="262" class="fg-l dim"/><line x1="218" y1="244" x2="218" y2="262" class="fg-l dim"/><line x1="254" y1="244" x2="254" y2="262" class="fg-l dim"/><line x1="272" y1="244" x2="272" y2="262" class="fg-l dim"/><line x1="290" y1="244" x2="290" y2="262" class="fg-l dim"/><line x1="326" y1="244" x2="326" y2="262" class="fg-l dim"/><line x1="344" y1="244" x2="344" y2="262" class="fg-l dim"/><line x1="362" y1="244" x2="362" y2="262" class="fg-l dim"/><line x1="398" y1="244" x2="398" y2="262" class="fg-l dim"/><line x1="416" y1="244" x2="416" y2="262" class="fg-l dim"/><line x1="434" y1="244" x2="434" y2="262" class="fg-l dim"/><line x1="470" y1="244" x2="470" y2="262" class="fg-l dim"/><line x1="488" y1="244" x2="488" y2="262" class="fg-l dim"/><line x1="506" y1="244" x2="506" y2="262" class="fg-l dim"/><line x1="542" y1="244" x2="542" y2="262" class="fg-l dim"/><line x1="560" y1="244" x2="560" y2="262" class="fg-l dim"/><line x1="578" y1="244" x2="578" y2="262" class="fg-l dim"/>
<text x="92" y="280" text-anchor="middle" class="fg-t sm">第 1 列</text><text x="236" y="280" text-anchor="middle" class="fg-t sm">第 2 列</text><text x="380" y="280" text-anchor="middle" class="fg-t sm">第 3 列</text><text x="524" y="280" text-anchor="middle" class="fg-t sm">第 4 列</text>
</svg><figcaption>示意圖：一個小格是一個整數，一個色塊是一條快取列（這裡畫成 4 個整數，真實的 64 位元組是 16 個）。陣列在記憶體裡是一列接一列排成一長條，照列走就是沿著這條往前；照欄走則是在這一長條上大步跳。</figcaption></figure>
<ul>
<li><b>版本一</b>：<code>a[0]</code> 未命中，整條 64 位元組（16 個整數）搬上來，接下來 15 次全部命中。未命中率 1/16，而且預取器看出「一直往後走」，提早把後面的列搬好，連那 1/16 都藏掉大半。</li>
<li><b>版本二</b>：<code>a[0]</code> 之後是 <code>a[4096]</code>，相隔 16 KB，在完全不同的快取列，甚至不同的頁。每一次都碰一條新的快取列，一條只用 4 個位元組就換下一條。等回頭要用同一條的第二個整數時（<code>j = 1</code>），中間已經碰過 4096 條，早就被擠出 L1 了。</li>
</ul>
<p>還有一個更隱蔽的原因：16 KB 是 2 的次方。回想第 0.5 課深入圖解的組關聯：組號取自位址中間的幾個位元，跨步剛好是 2 的次方時，這些位元幾乎不變，所有存取擠進同一組或少數幾組，快取明明還有很多空位，卻一直互相踢掉。高效能程式有時會故意讓每列多留幾個空格（例如寬度用 4096 ＋ 16），打破這種對齊。</p>
<h4>資料怎麼排，常常比演算法的常數還重要</h4>
<ul>
<li><b>陣列 vs 鏈結串列</b>：走訪 100 萬個整數的陣列，是讀 4 MB 的連續記憶體，以每秒幾十 GB 的頻寬，不到 1 毫秒。走訪 100 萬個節點的鏈結串列，節點散在記憶體各處，最壞情況每個節點都是一次 100 奈秒的未命中，而且要讀到這個節點才知道下一個在哪，預取也幫不上：大約 100 毫秒。理論上都是 O(n)，實際上差了上百倍。</li>
<li><b>結構的陣列 vs 陣列的結構</b>：一萬個敵人，每個有位置、血量、名字、裝備……更新位置時只需要位置，卻得把整個物件搬進快取，大部分頻寬都浪費了。把同一種欄位排成自己的陣列（structure of arrays），更新位置時讀到的每個位元組都有用，還能順便用 SIMD。這是遊戲引擎 ECS（entity component system）架構背後的主要理由之一。</li>
<li><b>物件越小越好</b>：同樣的快取，物件小一半，就放得下兩倍的數量。</li>
</ul>

<h3><span class="badge lv4">專家</span>七、多核心之間的暗流</h3>
<h4>偽共享（false sharing）</h4>
<p>第 0.5 課深入圖解說過，每顆核心有自己的 L1，硬體要保證大家看到同一個值（快取一致性），而它管理的單位是<b>整條快取列</b>。現在兩條執行緒各自累加自己的計數器：</p>
<pre><code>type Counters struct {
    a int64 // 執行緒 1 一直加這個
    b int64 // 執行緒 2 一直加這個
}</code></pre>
<p>a 和 b 是不同的變數，邏輯上完全不相干，但它們只差 8 個位元組，落在同一條快取列。核心 1 寫 a，要先拿到這條列的獨佔權，核心 2 手上那份就失效；核心 2 寫 b，又把它搶回來。這條列在兩顆核心之間來回彈，每次都要幾十到上百拍。結果兩條執行緒跑得比一條還慢。</p>
<p>解法是把它們隔到不同的快取列：在中間塞填充位元組（Go 的 <code>golang.org/x/sys/cpu</code> 有現成的 <code>cpu.CacheLinePad</code>），或乾脆讓每條執行緒先累加在自己的區域變數，最後再合併。注意 Apple M 系列的快取列是 128 位元組，填充要夠寬。Linux 的 <code>perf c2c</code> 可以抓出這種核心之間搶快取列的熱點。</p>
<h4>vCPU 不一定是一顆核心</h4>
<p>很多 x86 處理器有<b>同時多執行緒</b>（simultaneous multithreading，SMT，Intel 叫 Hyper-Threading）：一顆實體核心對作業系統假裝成兩顆，兩條執行緒共用同一組運算單元和快取，趁對方等記憶體的空檔塞指令。總吞吐量通常只多一兩成到三成左右，不是兩倍。雲端上，大多數 x86 執行個體的 1 個 vCPU 就是一條這樣的硬體執行緒，所以「2 vCPU」常常只是 1 顆實體核心；AWS 的 Graviton（ARM）則是 1 個 vCPU 對應 1 顆實體核心。比較規格前，先弄清楚 vCPU 是什麼。</p>
<h4>NUMA：不是每塊記憶體都一樣近</h4>
<p>大型伺服器有兩顆以上的 CPU 插槽，每顆 CPU 接著自己的記憶體。讀自己那邊的比較快，讀另一顆 CPU 那邊的要繞過晶片之間的連線，延遲明顯變高。這叫 <b>NUMA</b>（non-uniform memory access）。資料庫、大型 JVM 在這種機器上，要注意行程和它的記憶體有沒有被排在同一邊（Linux 有 <code>numactl</code> 工具）。小台的雲端主機通常只有一個 NUMA 節點，大規格的執行個體就要留意。</p>

<h3><span class="badge lv4">專家</span>八、量效能，不要騙自己</h3>
<p>效能最佳化最常見的失敗，不是不會改，而是<b>量錯了</b>：量到的不是你以為的東西，然後花一週改了一個根本不是瓶頸的地方。幾條規則：</p>
<h4>1. 先暖身，再看穩定的數字</h4>
<p>前幾次執行通常特別慢：JIT 還沒編譯（V8、JVM）、快取是冷的、記憶體第一次被碰到要處理分頁錯誤、檔案還沒進作業系統的快取。只跑一次，量到的是「冷啟動」，不是「平常」。兩者都可能重要，但要知道自己量的是哪一個。</p>
<figure class="figure"><svg viewBox="0 0 640 236" class="fg" style="width:100%;max-width:640px" role="img" aria-label="同一段程式跑 20 次的耗時：前 3 次因為暖身特別慢，之後穩定在 10 毫秒左右，第 13 次因為雜訊突然變慢">
<text x="14" y="30" class="fg-t sm">耗時</text>
<line x1="52" y1="190" x2="620" y2="190" class="fg-l"/>
<rect x="60" y="22" width="20" height="168" class="fg-b warm"/>
<rect x="88" y="81" width="20" height="109" class="fg-b warm"/>
<rect x="116" y="127" width="20" height="63" class="fg-b warm"/>
<rect x="144" y="152" width="20" height="38" class="fg-b hot"/>
<rect x="172" y="153" width="20" height="37" class="fg-b hot"/>
<rect x="200" y="155" width="20" height="35" class="fg-b hot"/>
<rect x="228" y="152" width="20" height="38" class="fg-b hot"/>
<rect x="256" y="153" width="20" height="37" class="fg-b hot"/>
<rect x="284" y="155" width="20" height="35" class="fg-b hot"/>
<rect x="312" y="153" width="20" height="37" class="fg-b hot"/>
<rect x="340" y="152" width="20" height="38" class="fg-b hot"/>
<rect x="368" y="155" width="20" height="35" class="fg-b hot"/>
<rect x="396" y="106" width="20" height="84" class="fg-b alt"/>
<rect x="424" y="153" width="20" height="37" class="fg-b hot"/>
<rect x="452" y="155" width="20" height="35" class="fg-b hot"/>
<rect x="480" y="152" width="20" height="38" class="fg-b hot"/>
<rect x="508" y="153" width="20" height="37" class="fg-b hot"/>
<rect x="536" y="155" width="20" height="35" class="fg-b hot"/>
<rect x="564" y="153" width="20" height="37" class="fg-b hot"/>
<rect x="592" y="152" width="20" height="38" class="fg-b hot"/>
<line x1="140" y1="153" x2="620" y2="153" class="fg-l on dash"/>
<text x="620" y="144" text-anchor="end" class="fg-t sm acc">中位數約 10.5 ms</text>
<text x="120" y="40" class="fg-t sm warm">暖身：JIT 還沒編譯、快取是冷的</text>
<text x="406" y="96" text-anchor="middle" class="fg-t sm alt">偶發雜訊：GC、別的程式</text>
<text x="70" y="206" text-anchor="middle" class="fg-t sm">第 1 次</text>
<text x="602" y="206" text-anchor="middle" class="fg-t sm">第 20 次</text>
<text x="330" y="228" text-anchor="middle" class="fg-t sm">只跑一次會量到 48 ms；跑二十次看中位數，才是平常的速度</text>
</svg><figcaption>示意的量測結果。第一次的 48 毫秒和平常的 10 毫秒差了快五倍；第 13 次的突起則提醒你，單一次的數字可能只是剛好遇上雜訊。</figcaption></figure>
<h4>2. 跑很多次，看分佈，不看單一數字</h4>
<p>同一段程式，每次跑的時間都不一樣：別的程式在搶 CPU、CPU 因為溫度升降頻、雲端主機上的鄰居在用同一台實體機（Linux <code>top</code> 裡的 <code>st</code>，steal time，就是被別人拿走的 CPU 時間）。至少看中位數和分佈的尾巴（p95、p99）；比較兩個版本時，差距要大於雜訊才算數。命令列程式可以用 <code>hyperfine</code>；Go 用 <code>go test -bench</code> 跑多次，再用 <code>benchstat</code> 比較；JavaScript 可以用 Vitest 的 <code>bench</code>，它會幫你處理暖身和重複次數。</p>
<h4>3. 小心編譯器把你的測試刪掉</h4>
<p>計算結果沒人用，最佳化器就有權把整段計算刪掉（第 0.7 課的深入圖解講過），你會量到一個快得不可思議的數字。結果要「被用到」：印出來、存到外面的變數，或用測試框架提供的方法。Go 1.24 起建議用 <code>b.Loop()</code> 寫基準測試，它能防止迴圈裡的計算被最佳化掉。</p>
<h4>4. 先找瓶頸，再動手</h4>
<p>不要猜。用<b>取樣分析器</b>（sampling profiler）看時間花在哪：它每秒打斷程式幾百到幾千次，記下當時在哪個函式，統計出來就知道誰最花時間。畫成<b>火焰圖</b>（flame graph）最直觀：越寬的方塊越花時間。Node.js 用 <code>node --cpu-prof</code> 或 Chrome DevTools，Go 用 <code>pprof</code>，整台 Linux 機器用 <code>perf record</code>。</p>
<p>找到熱點以後，再問它是「算太多」還是「等太久」。<code>perf stat</code> 會給你 IPC 和快取未命中的次數：IPC 很低、未命中很多時，改演算法的常數沒用，要改資料的排法（第六節）。</p>
<h4>5. 「CPU 使用率 100%」不代表 CPU 在算</h4>
<p>作業系統說 CPU 很忙，只代表那顆核心沒有閒著，不代表它在做有用的運算。核心等記憶體的那幾百拍，也算在「忙」裡。一個 IPC 只有 0.3 的程式，CPU 使用率可能是 100%，大部分時間卻在等資料。這時加 CPU 沒用，讓資料對快取友善才有用。</p>
<h4>6. 壓力測試的陷阱：協同遺漏</h4>
<p>很多壓測工具的做法是「送一個請求、等回應、再送下一個」。伺服器卡住 2 秒時，工具也跟著停 2 秒，這段期間本來應該送出的幾百個請求根本沒送，它們會遇到的長延遲就沒被記錄。結果 p99 看起來很漂亮，真實使用者卻在排隊。這叫<b>協同遺漏</b>（coordinated omission），是 Gil Tene 提出的。要量真實的尾延遲，要用固定速率送請求的工具（例如 wrk2，或 k6 的固定到達率模式），並且從「本來應該送出的時間」開始算延遲。</p>
<h4>7. 在跟正式環境一樣的地方量</h4>
<p>你的 M 系列筆電和雲端的 x86 主機，快取大小、記憶體頻寬、核心數、連快取列大小都不一樣。在筆電上快兩倍的改動，到了伺服器可能沒差。最後的判斷，要在跟正式環境同型號的機器上做。</p>

<h3>九、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>核心數加倍，速度就加倍</td><td>循序的部分不會變短，加上溝通成本，加速永遠打折扣。20% 循序的工作，最多只快 5 倍。</td></tr>
<tr><td>CPU 使用率 100%，代表 CPU 正在全力計算</td><td>等記憶體也算「忙」。IPC 很低時，CPU 大部分時間其實在等資料。</td></tr>
<tr><td>演算法複雜度一樣，速度就差不多</td><td>陣列和鏈結串列都是 O(n)，走訪速度卻能差上百倍。常數裡藏著快取。</td></tr>
<tr><td>GPU 什麼都比 CPU 快</td><td>GPU 只在大量、規則、同樣運算的工作上贏。分支多、資料少、要來回搬資料的工作，CPU 比較快。</td></tr>
<tr><td>跑一次量到的時間就是答案</td><td>第一次常常包含暖身成本，之後的每次也有雜訊。要跑多次、看分佈。</td></tr>
<tr><td>2 vCPU 就是 2 顆核心</td><td>大多數 x86 雲端主機上，2 vCPU 是 1 顆實體核心的 2 條硬體執行緒，吞吐量遠不到兩倍。</td></tr>
</table>

<h3>十、跟你的工作連起來</h3>
<ul>
<li><b>前端（Vue、TypeScript）</b>：瀏覽器的主執行緒每一格畫面只有 16.7 毫秒（60 FPS），排版、繪製、你的 JavaScript 全擠在裡面。吃重的計算移到 Web Worker；上萬筆的清單用虛擬捲動（virtual scrolling），只畫看得到的那幾十筆。量的時候用 DevTools 的 Performance 面板。</li>
<li><b>Node.js</b>：一個行程只用一顆核心跑你的 JavaScript。在 Kubernetes 上，常見做法是每個 Pod 一個 Node 行程、給大約一顆 CPU，再用 Pod 數量水平擴展。</li>
<li><b>Go</b>：熱點用 pprof 找；多執行緒共用的計數器，小心偽共享，可以改成每條執行緒各自累加或分片再合併。</li>
<li><b>遊戲（Cocos、Unity）</b>：每一格的預算是 16.7 毫秒（120 FPS 只剩 8.3 毫秒）。先分清楚瓶頸在 CPU 還是 GPU：draw call 太多就合批、用圖集；邏輯太重就把大量同類物件的資料排成連續陣列，Unity 還可以用 Burst 和 SIMD。</li>
<li><b>DevOps 與雲端</b>：設 CPU limit 之前，先看 cAdvisor 的 <code>container_cpu_cfs_throttled_periods_total</code>，確認服務有沒有被節流。選機型時，弄清楚 vCPU 是實體核心還是硬體執行緒；ARM 機型通常比較便宜，但要有多架構映像檔。</li>
</ul>

<h3>十一、面試會怎麼問</h3>
<p>先自己講一遍（最好出聲講），再打開參考答案。</p>
<ol>
<li>「一個工作有 10% 只能循序執行。給它 8 顆核心，最多快幾倍？無限多顆呢？」</li>
<li>「為什麼 CPU 時脈這十幾年沒什麼長進，電腦卻還是一直變快？」</li>
<li>「二維陣列照列走訪和照欄走訪，速度為什麼會差這麼多？」</li>
<li>「什麼是 false sharing？怎麼發現、怎麼修？」</li>
<li>「一個線上服務變慢了，你會怎麼找原因？」</li>
<li>「Kubernetes 上一個服務的 CPU 平均使用率只有 40%，p99 延遲卻很高，可能是什麼原因？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>用 Amdahl 定律：8 顆核心是 1 ÷ (0.1 ＋ 0.9 ÷ 8) ＝ 1 ÷ 0.2125 ≈ 4.7 倍；無限多顆是 1 ÷ 0.1 ＝ 10 倍。實務上還要扣掉同步和溝通成本，通常更少。</li>
<li>2005 年前後 Dennard 縮放失效，電壓降不下去，動態功耗跟電壓平方乘頻率成正比，再拉高時脈會熱到散不掉，這叫功耗牆。之後效能來自其他地方：提高 IPC（更寬的管線、更好的分支預測、更大的快取、亂序執行）、增加核心數、SIMD 指令變寬、加入 GPU 和各種專用單元，以及編譯器與軟體的改進。</li>
<li>C、Go、JavaScript 的 TypedArray 這類語言裡，二維陣列是一列接一列存放的。照列走是連續存取，一條快取列裡的元素全部用到，硬體預取器也能提早搬資料；照欄走每一步跨過一整列，每次存取都落在不同的快取列，甚至不同的頁，快取列只用到一小部分就被擠掉，還會造成 TLB 未命中；寬度是 2 的次方時，還會集中撞在同幾組造成衝突未命中。修法是調換迴圈順序、分塊處理（tiling），或先轉置資料。</li>
<li>兩條執行緒寫的是不同變數，但這些變數落在同一條快取列，快取一致性協定以整條為單位，讓這條列在核心之間來回失效、搬移，效能大幅下降，甚至比單執行緒還慢。徵兆是加執行緒反而變慢；Linux 可以用 <code>perf c2c</code> 找出被搶的快取列。修法是把各執行緒的資料用填充對齊到不同快取列（注意 Apple M 系列是 128 位元組），或讓每條執行緒先寫自己的區域變數，最後再合併。</li>
<li>先確認範圍和時間點：哪些端點變慢、從什麼時候開始、跟部署或流量變化有沒有對上。看四種資源（CPU、記憶體、磁碟、網路）和下游依賴的指標，判斷是自己算太慢還是在等別人。如果是 CPU，用取樣分析器（pprof、<code>--cpu-prof</code>、<code>perf</code>）錄火焰圖找熱點，再用 <code>perf stat</code> 看 IPC 和快取未命中，區分是計算還是記憶體問題。改一個地方就驗證一次，比較延遲分佈（p50、p99），不是只看平均。</li>
<li>很可能是 CPU limit 造成的節流：配額以 100 毫秒為一期計算，多條執行緒同時忙時，可能在一期的前段就把配額用完，剩下時間整個容器被暫停，平均使用率不高，請求延遲卻出現尖峰。檢查 <code>container_cpu_cfs_throttled_periods_total</code> 之類的指標確認。修法：提高或移除 CPU limit（保留 request）、讓執行緒數或 <code>GOMAXPROCS</code> 跟 limit 相符、減少瞬間的平行爆量。另外也要排除 GC 停頓、吵鬧的鄰居和下游變慢。</li>
</ol>
</details>

<h3>十二、練功題（做得出來才算真的懂）</h3>
<ol>
<li>一個程式要跑 300 億道指令。A 晶片 3.5 GHz、IPC 2；B 晶片 2.5 GHz、IPC 3.5。各要跑多久？</li>
<li>一個工作單核心要 60 秒，其中 15 秒只能循序做。給它 6 顆核心要多久？加速幾倍？最多能快幾倍？</li>
<li>把兩個各有 1,024 個 32 位元浮點數的陣列逐項相加。純量指令要幾道加法？AVX2 呢？NEON 呢？</li>
<li>一個 2 GB 的陣列，記憶體頻寬每秒 20 GB。不管 CPU 多快，從頭讀到尾至少要多久？這告訴你什麼？</li>
<li>動手：把本章那段 TypeScript 放進 Node 執行，兩個版本各先跑一次暖身，再量 5 次取中位數。接著把 N 改成 4000 再量一次版本二。你看到什麼？為什麼？</li>
<li>一個容器設 <code>limits.cpu: 0.5</code>（每 100 毫秒最多 50 毫秒 CPU 時間）。一個請求需要單執行緒 80 毫秒的 CPU，剛好在一期開始時進來，而且沒有其他工作。它多久後完成？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>A：每秒 2 × 35 億 ＝ 70 億道，300 億 ÷ 70 億 ≈ 4.3 秒。B：每秒 3.5 × 25 億 ＝ 87.5 億道，約 3.4 秒。時脈較低的 B 比較快。</li>
<li>15 ＋ 45 ÷ 6 ＝ 22.5 秒，加速 60 ÷ 22.5 ≈ 2.67 倍。上限是 60 ÷ 15 ＝ 4 倍。</li>
<li>純量：1,024 道。AVX2 一次 8 個：128 道。NEON 一次 4 個：256 道。</li>
<li>2 GB ÷ 每秒 20 GB ＝ 0.1 秒，也就是 100 毫秒。這是下限：程式只要需要把整塊資料讀一遍，就快不過頻寬。這種程式叫「受記憶體頻寬限制」，換更快的 CPU 沒用，要想辦法少讀（壓縮資料、用更小的型別、只讀需要的欄位）。</li>
<li>版本二通常會比版本一慢好幾倍。N = 4000 時，版本二常常比 N = 4096 時快一截，因為跨步不再是 2 的次方，存取會分散到不同的快取組，衝突未命中變少。確切倍數依機器、Node 版本而不同，量到什麼就是什麼，重點是你能解釋它。</li>
<li>前 50 毫秒用完這一期的配額，接下來 50 毫秒被暫停，下一期開始後再跑剩下的 30 毫秒：總共 130 毫秒，比它真正需要的 80 毫秒多了 50 毫秒。這就是 CPU limit 造成延遲尖峰的原理。</li>
</ol>
</details>

<h3>十三、想再挖深</h3>
<ul>
<li><b>Brendan Gregg《Systems Performance》</b>（第二版）與他的網站 <a href="https://www.brendangregg.com/">brendangregg.com</a>：火焰圖的發明者，系統效能分析的標準參考，從方法論到每一個 Linux 工具都有。</li>
<li><b>Hennessy 與 Patterson《Computer Architecture: A Quantitative Approach》</b>：功耗牆、Amdahl 定律、指令層級平行、記憶體階層，用數字講清楚每一個設計取捨。</li>
<li><b>Sergey Slotin《Algorithms for Modern Hardware》</b>（<a href="https://en.algorithmica.org/hpc/">en.algorithmica.org/hpc</a>，免費線上）：專講「同樣的演算法，怎麼寫才配合真實的 CPU」，SIMD、快取、分支都有實測。</li>
<li><b>Agner Fog 的最佳化手冊</b>（<a href="https://www.agner.org/optimize/">agner.org/optimize</a>）：x86 最佳化的經典免費資料，連每道指令要幾拍都有表。</li>
</ul>
` });
