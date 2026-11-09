DEEP({ 'mach-cycle': `
<p>上一課你按著「走一步」，看迷你 CPU 一格一格把 5 + 4 + 3 + 2 + 1 加完。這一章把那顆 CPU 拆開來，一個零件一個零件看：每一步到底是哪幾條線在通電、哪個數字從哪裡搬到哪裡。最後再看真正的處理器，為什麼同樣的三個步驟，可以快上幾十億倍。</p>

<h3><span class="badge lv1">基礎</span>一、先看全貌：CPU 裡面有哪幾個零件</h3>
<p>把上一課出現過的東西全部畫在同一張圖上：</p>
<figure class="figure"><svg viewBox="0 0 660 300" class="fg" style="width:100%;max-width:660px" role="img" aria-label="CPU 與記憶體的全貌：控制單元、ALU、程式計數器、指令暫存器、工作暫存器，用位址匯流排和資料匯流排連到記憶體">
<rect x="10" y="10" width="400" height="280" rx="10" class="fg-b"/>
<text x="28" y="34" class="fg-t lg">CPU</text>
<rect x="30" y="48" width="170" height="62" rx="6" class="fg-b hot"/>
<text x="115" y="74" text-anchor="middle" class="fg-t acc">控制單元</text>
<text x="115" y="94" text-anchor="middle" class="fg-t sm">指揮大家輪流做事</text>
<rect x="220" y="48" width="170" height="62" rx="6" class="fg-b hot"/>
<text x="305" y="74" text-anchor="middle" class="fg-t acc">ALU</text>
<text x="305" y="94" text-anchor="middle" class="fg-t sm">算術邏輯單元：會加、會比</text>
<rect x="30" y="140" width="170" height="50" rx="6" class="fg-b alt"/>
<text x="115" y="161" text-anchor="middle" class="fg-t">程式計數器 PC</text>
<text x="115" y="180" text-anchor="middle" class="fg-t sm">下一道指令在第幾格</text>
<rect x="30" y="215" width="170" height="50" rx="6" class="fg-b alt"/>
<text x="115" y="236" text-anchor="middle" class="fg-t">指令暫存器 IR</text>
<text x="115" y="255" text-anchor="middle" class="fg-t sm">剛拿到的那道指令</text>
<rect x="220" y="140" width="170" height="50" rx="6" class="fg-b alt"/>
<text x="305" y="161" text-anchor="middle" class="fg-t">工作暫存器</text>
<text x="305" y="180" text-anchor="middle" class="fg-t sm">算到一半的數字</text>
<line x1="115" y1="110" x2="115" y2="140" class="fg-l dash"/>
<line x1="200" y1="79" x2="220" y2="79" class="fg-l dash"/>
<line x1="305" y1="110" x2="305" y2="140" class="fg-l"/>
<rect x="480" y="10" width="170" height="280" rx="10" class="fg-b"/>
<text x="565" y="34" text-anchor="middle" class="fg-t lg">記憶體</text>
<rect x="495" y="46" width="140" height="24" rx="4" class="fg-b"/><text x="505" y="62" class="fg-t sm">格子 0</text><text x="625" y="62" text-anchor="end" class="fg-t mono">30</text>
<rect x="495" y="74" width="140" height="24" rx="4" class="fg-b"/><text x="505" y="90" class="fg-t sm">格子 1</text><text x="625" y="90" text-anchor="end" class="fg-t mono">45</text>
<rect x="495" y="102" width="140" height="24" rx="4" class="fg-b"/><text x="505" y="118" class="fg-t sm">格子 2</text><text x="625" y="118" text-anchor="end" class="fg-t mono">62</text>
<text x="565" y="142" text-anchor="middle" class="fg-t sm">⋮</text>
<rect x="495" y="152" width="140" height="24" rx="4" class="fg-b"/><text x="505" y="168" class="fg-t sm">格子 13（n）</text><text x="625" y="168" text-anchor="end" class="fg-t mono">5</text>
<rect x="495" y="180" width="140" height="24" rx="4" class="fg-b"/><text x="505" y="196" class="fg-t sm">格子 14（總和）</text><text x="625" y="196" text-anchor="end" class="fg-t mono">0</text>
<rect x="495" y="208" width="140" height="24" rx="4" class="fg-b"/><text x="505" y="224" class="fg-t sm">格子 15（一）</text><text x="625" y="224" text-anchor="end" class="fg-t mono">1</text>
<line x1="410" y1="100" x2="472" y2="100" class="fg-l on"/><polygon points="480,100 472,95.5 472,104.5" class="fg-a on"/>
<text x="445" y="91" text-anchor="middle" class="fg-t sm acc">位址</text>
<line x1="418" y1="200" x2="472" y2="200" class="fg-l alt"/><polygon points="480,200 472,195.5 472,204.5" class="fg-a alt"/><polygon points="410,200 418,195.5 418,204.5" class="fg-a alt"/>
<text x="445" y="191" text-anchor="middle" class="fg-t sm alt">資料</text>
</svg><figcaption>CPU 裡五個零件，和記憶體之間只有兩組線：位址（CPU 說「我要第幾格」）和資料（數字本身，兩個方向都能走）。</figcaption></figure>
<p>五個零件各有一個很生活化的角色：</p>
<table>
<tr><th>零件</th><th>像什麼</th><th>做什麼</th></tr>
<tr><td><b>控制單元</b>（control unit）</td><td>樂團的指揮</td><td>看懂現在這道指令，決定這一拍要打開哪幾條線、叫哪個零件動作</td></tr>
<tr><td><b>程式計數器</b>（program counter，PC）</td><td>書籤</td><td>記住「下一道指令在第幾格」。平常每做完一道就加 1</td></tr>
<tr><td><b>指令暫存器</b>（instruction register，IR）</td><td>手上那張紙條</td><td>放剛從記憶體拿回來、正在處理的那道指令</td></tr>
<tr><td><b>ALU</b>（arithmetic logic unit）</td><td>計算機</td><td>第 0.4 課的加法器就在這裡，外加比較、AND、OR 等電路</td></tr>
<tr><td><b>工作暫存器</b>（accumulator）</td><td>草稿紙</td><td>放算到一半的數字。ALU 的答案寫在這裡</td></tr>
</table>
<p>請特別注意右邊那兩組線。CPU 和記憶體之間只有這兩條路：<b>位址匯流排</b>（address bus）只負責一件事，就是 CPU 告訴記憶體「我要第幾格」；<b>資料匯流排</b>（data bus）則把那一格的數字送回來，或把 CPU 的數字送過去存。所有指令、所有資料，都得排隊走這兩條路，一次一格。</p>
<div class="note"><b>這就是「范紐曼瓶頸」（von Neumann bottleneck）。</b>程式和資料放在同一塊記憶體、走同一組線，好處是換一串數字就換一個程式；代價是 CPU 再快，也得等記憶體把數字送過來。第 0.8 課講的快取（cache），就是為了少走這條慢路而存在的。</div>

<h3><span class="badge lv1">基礎</span>二、指令其實就是數字：把 30 拆開</h3>
<p>格子 0 裡放的是 30。CPU 怎麼從「30」看出「LOAD 14」？答案是：把它寫成位元，再切成兩半。</p>
<figure class="figure"><svg viewBox="0 0 560 180" class="fg" style="width:100%;max-width:560px" role="img" aria-label="數字 30 寫成 00011110，前四個位元是操作碼 1 代表 LOAD，後四個位元是位址 14">
<text x="280" y="20" text-anchor="middle" class="fg-t lg">格子 0 裡的數字：30</text>
<path d="M74 66 V54 H278 V66" class="fg-l alt"/>
<text x="176" y="46" text-anchor="middle" class="fg-t sm alt">操作碼 opcode：0001 = 1 → LOAD</text>
<path d="M282 66 V54 H486 V66" class="fg-l on"/>
<text x="384" y="46" text-anchor="middle" class="fg-t sm acc">位址 address：1110 = 14</text>
<rect x="72" y="72" width="50" height="44" rx="5" class="fg-b alt"/><text x="97" y="100" text-anchor="middle" class="fg-t lg mono">0</text>
<rect x="124" y="72" width="50" height="44" rx="5" class="fg-b alt"/><text x="149" y="100" text-anchor="middle" class="fg-t lg mono">0</text>
<rect x="176" y="72" width="50" height="44" rx="5" class="fg-b alt"/><text x="201" y="100" text-anchor="middle" class="fg-t lg mono">0</text>
<rect x="228" y="72" width="50" height="44" rx="5" class="fg-b alt"/><text x="253" y="100" text-anchor="middle" class="fg-t lg mono">1</text>
<rect x="284" y="72" width="50" height="44" rx="5" class="fg-b hot"/><text x="309" y="100" text-anchor="middle" class="fg-t lg mono">1</text>
<rect x="336" y="72" width="50" height="44" rx="5" class="fg-b hot"/><text x="361" y="100" text-anchor="middle" class="fg-t lg mono">1</text>
<rect x="388" y="72" width="50" height="44" rx="5" class="fg-b hot"/><text x="413" y="100" text-anchor="middle" class="fg-t lg mono">1</text>
<rect x="440" y="72" width="50" height="44" rx="5" class="fg-b hot"/><text x="465" y="100" text-anchor="middle" class="fg-t lg mono">0</text>
<text x="97" y="134" text-anchor="middle" class="fg-t sm">128</text><text x="149" y="134" text-anchor="middle" class="fg-t sm">64</text><text x="201" y="134" text-anchor="middle" class="fg-t sm">32</text><text x="253" y="134" text-anchor="middle" class="fg-t sm">16</text>
<text x="309" y="134" text-anchor="middle" class="fg-t sm">8</text><text x="361" y="134" text-anchor="middle" class="fg-t sm">4</text><text x="413" y="134" text-anchor="middle" class="fg-t sm">2</text><text x="465" y="134" text-anchor="middle" class="fg-t sm">1</text>
<text x="280" y="166" text-anchor="middle" class="fg-t sm">30 = 1 × 16 + 14：前半說「做什麼」，後半說「對哪一格做」</text>
</svg><figcaption>同一個數字，前四個位元是「操作碼」，後四個位元是「位址」。解碼，就是把位元分組，送到對的電路。</figcaption></figure>
<p>迷你 CPU 的規則是：<b>指令 = 操作碼 × 16 + 位址</b>。操作碼 1 是 LOAD、2 是 ADD、3 是 STORE、4 是 SUB、5 是 JUMPZ、6 是 JUMP、0 是 HALT。所以 ADD 13 = 2 × 16 + 13 = 45，STORE 14 = 3 × 16 + 14 = 62，正好就是格子 1 和格子 2 裡的數字。</p>
<p>「解碼」聽起來很玄，其實就是第 0.3 課的邏輯閘：前四個位元接到一排 AND 閘，「0001」這個組合只會讓其中一個閘輸出 1，那條線就去打開「從記憶體讀進工作暫存器」的電路；後四個位元則直接接到位址匯流排。沒有任何東西在「理解」，只是電線接對了地方。</p>
<h4>真實的處理器也一樣，只是更長</h4>
<ul>
<li><b>ARM64</b>（你 Mac 上的 M1、手機的處理器）：每道指令固定 32 個位元，切成好幾段：操作碼、目的暫存器、來源暫存器、數字。長度固定，所以解碼很快、很省電。</li>
<li><b>x86-64</b>（Intel、AMD）：每道指令 1 到 15 個位元組不等。歷史包袱很重，解碼器比較複雜，所以現代 x86 會先把指令翻成內部的小指令（micro-op）再執行。</li>
</ul>

<h3><span class="badge lv2">進階</span>三、一道指令的一生：三個步驟各在搬什麼</h3>
<p>用第一道指令 LOAD 14 走一次。注意看每一步「哪條線上跑著哪個數字」：</p>
<figure class="figure"><svg viewBox="0 0 690 280" class="fg" style="width:100%;max-width:690px" role="img" aria-label="擷取、解碼、執行三個步驟中，數字在 PC、記憶體、指令暫存器、控制單元與工作暫存器之間的流動">
<line x1="230" y1="10" x2="230" y2="270" class="fg-l dim dash"/><line x1="460" y1="10" x2="460" y2="270" class="fg-l dim dash"/>
<text x="115" y="26" text-anchor="middle" class="fg-t lg alt">1 擷取 Fetch</text>
<rect x="40" y="44" width="150" height="36" rx="6" class="fg-b alt"/><text x="115" y="67" text-anchor="middle" class="fg-t">PC = 0</text>
<line x1="115" y1="80" x2="115" y2="106" class="fg-l on"/><polygon points="115,114 110.5,106 119.5,106" class="fg-a on"/><text x="125" y="101" class="fg-t sm acc">位址 0</text>
<rect x="40" y="114" width="150" height="36" rx="6" class="fg-b"/><text x="115" y="137" text-anchor="middle" class="fg-t">記憶體 格子 0</text>
<line x1="115" y1="150" x2="115" y2="176" class="fg-l alt"/><polygon points="115,184 110.5,176 119.5,176" class="fg-a alt"/><text x="125" y="171" class="fg-t sm alt">資料 30</text>
<rect x="40" y="184" width="150" height="36" rx="6" class="fg-b hot"/><text x="115" y="207" text-anchor="middle" class="fg-t acc">IR = 30</text>
<text x="115" y="250" text-anchor="middle" class="fg-t sm">同時 PC 加 1，變成 1</text>
<text x="345" y="26" text-anchor="middle" class="fg-t lg alt">2 解碼 Decode</text>
<rect x="270" y="44" width="150" height="36" rx="6" class="fg-b alt"/><text x="345" y="67" text-anchor="middle" class="fg-t">IR = 30</text>
<line x1="345" y1="80" x2="345" y2="106" class="fg-l"/><polygon points="345,114 340.5,106 349.5,106" class="fg-a"/>
<rect x="270" y="114" width="150" height="36" rx="6" class="fg-b hot"/><text x="345" y="137" text-anchor="middle" class="fg-t acc">控制單元</text>
<line x1="295" y1="150" x2="295" y2="176" class="fg-l"/><polygon points="295,184 290.5,176 299.5,176" class="fg-a"/>
<line x1="395" y1="150" x2="395" y2="176" class="fg-l"/><polygon points="395,184 390.5,176 399.5,176" class="fg-a"/>
<rect x="250" y="184" width="90" height="36" rx="6" class="fg-b"/><text x="295" y="207" text-anchor="middle" class="fg-t acc">LOAD</text>
<rect x="350" y="184" width="90" height="36" rx="6" class="fg-b"/><text x="395" y="207" text-anchor="middle" class="fg-t">格子 14</text>
<text x="345" y="250" text-anchor="middle" class="fg-t sm">看懂：把格子 14 讀進工作暫存器</text>
<text x="575" y="26" text-anchor="middle" class="fg-t lg alt">3 執行 Execute</text>
<rect x="500" y="44" width="150" height="36" rx="6" class="fg-b alt"/><text x="575" y="67" text-anchor="middle" class="fg-t">位址 14</text>
<line x1="575" y1="80" x2="575" y2="106" class="fg-l on"/><polygon points="575,114 570.5,106 579.5,106" class="fg-a on"/><text x="585" y="101" class="fg-t sm acc">位址 14</text>
<rect x="500" y="114" width="150" height="36" rx="6" class="fg-b"/><text x="575" y="137" text-anchor="middle" class="fg-t">記憶體 格子 14</text>
<line x1="575" y1="150" x2="575" y2="176" class="fg-l alt"/><polygon points="575,184 570.5,176 579.5,176" class="fg-a alt"/><text x="585" y="171" class="fg-t sm alt">資料 0</text>
<rect x="500" y="184" width="150" height="36" rx="6" class="fg-b hot"/><text x="575" y="207" text-anchor="middle" class="fg-t acc">工作暫存器 = 0</text>
<text x="575" y="250" text-anchor="middle" class="fg-t sm">做完，回到第 1 步</text>
</svg><figcaption>同一組位址線、資料線，在擷取時搬「指令」，在執行時搬「資料」。對記憶體來說，兩者沒有分別，都只是數字。</figcaption></figure>
<ol>
<li><b>擷取（fetch）</b>：控制單元把 PC 的值（0）放上位址匯流排。記憶體把格子 0 的內容（30）放上資料匯流排，CPU 把它收進指令暫存器。同一時間，PC 加 1，準備好下一次。</li>
<li><b>解碼（decode）</b>：控制單元看指令暫存器裡的 30，用邏輯閘拆出「LOAD」和「14」，決定下一步要打開哪些開關。</li>
<li><b>執行（execute）</b>：這次放上位址匯流排的是 14，記憶體把格子 14 的 0 送回來，寫進工作暫存器。</li>
</ol>
<p>每一步都發生在一拍時脈（第 0.5 課的「滴」）之內：時脈一響，所有暫存器同時收下新的值，然後電流在閘裡跑，準備好下一拍要收的值。迷你 CPU 一道指令要三拍；真實處理器會把這三步切得更細，變成 5 到 20 多個小步驟，每一步更短，時脈就能更快。</p>

<h3><span class="badge lv2">進階</span>四、會「判斷」的祕密：程式計數器與跳躍</h3>
<p>如果 PC 永遠只會加 1，程式就只能從頭跑到尾一次，不會重複、不會選擇。讓電腦「會想」的，其實只是一件很小的事：<b>有些指令會直接改寫 PC</b>。</p>
<figure class="figure"><svg viewBox="0 0 560 420" class="fg" style="width:100%;max-width:560px" role="img" aria-label="九道指令由上往下排列，JUMP 0 從格子 7 跳回格子 0，JUMPZ 8 在 n 變成 0 時從格子 6 跳到格子 8">
<rect x="130" y="20" width="300" height="30" rx="5" class="fg-b"/><text x="142" y="40" class="fg-t mono">0  LOAD 14</text><text x="420" y="40" text-anchor="end" class="fg-t sm">拿出總和</text>
<line x1="280" y1="50" x2="280" y2="56" class="fg-l"/><polygon points="280,64 275.5,56 284.5,56" class="fg-a"/>
<rect x="130" y="64" width="300" height="30" rx="5" class="fg-b"/><text x="142" y="84" class="fg-t mono">1  ADD 13</text><text x="420" y="84" text-anchor="end" class="fg-t sm">加上 n</text>
<line x1="280" y1="94" x2="280" y2="100" class="fg-l"/><polygon points="280,108 275.5,100 284.5,100" class="fg-a"/>
<rect x="130" y="108" width="300" height="30" rx="5" class="fg-b"/><text x="142" y="128" class="fg-t mono">2  STORE 14</text><text x="420" y="128" text-anchor="end" class="fg-t sm">存回總和</text>
<line x1="280" y1="138" x2="280" y2="144" class="fg-l"/><polygon points="280,152 275.5,144 284.5,144" class="fg-a"/>
<rect x="130" y="152" width="300" height="30" rx="5" class="fg-b"/><text x="142" y="172" class="fg-t mono">3  LOAD 13</text><text x="420" y="172" text-anchor="end" class="fg-t sm">拿出 n</text>
<line x1="280" y1="182" x2="280" y2="188" class="fg-l"/><polygon points="280,196 275.5,188 284.5,188" class="fg-a"/>
<rect x="130" y="196" width="300" height="30" rx="5" class="fg-b"/><text x="142" y="216" class="fg-t mono">4  SUB 15</text><text x="420" y="216" text-anchor="end" class="fg-t sm">減 1</text>
<line x1="280" y1="226" x2="280" y2="232" class="fg-l"/><polygon points="280,240 275.5,232 284.5,232" class="fg-a"/>
<rect x="130" y="240" width="300" height="30" rx="5" class="fg-b"/><text x="142" y="260" class="fg-t mono">5  STORE 13</text><text x="420" y="260" text-anchor="end" class="fg-t sm">存回 n</text>
<line x1="280" y1="270" x2="280" y2="276" class="fg-l"/><polygon points="280,284 275.5,276 284.5,276" class="fg-a"/>
<rect x="130" y="284" width="300" height="30" rx="5" class="fg-b warm"/><text x="142" y="304" class="fg-t mono">6  JUMPZ 8</text><text x="420" y="304" text-anchor="end" class="fg-t sm">是 0 就跳</text>
<line x1="280" y1="314" x2="280" y2="320" class="fg-l"/><polygon points="280,328 275.5,320 284.5,320" class="fg-a"/>
<rect x="130" y="328" width="300" height="30" rx="5" class="fg-b hot"/><text x="142" y="348" class="fg-t mono">7  JUMP 0</text><text x="420" y="348" text-anchor="end" class="fg-t sm">回到 0</text>
<rect x="130" y="372" width="300" height="30" rx="5" class="fg-b"/><text x="142" y="392" class="fg-t mono">8  HALT</text><text x="420" y="392" text-anchor="end" class="fg-t sm">停止</text>
<path d="M130 343 H92 V35 H122" class="fg-l on"/><polygon points="130,35 122,30.5 122,39.5" class="fg-a on"/>
<text x="84" y="186" text-anchor="end" class="fg-t sm acc">JUMP 0</text><text x="84" y="204" text-anchor="end" class="fg-t sm acc">再繞一圈</text>
<path d="M430 299 H470 V387 H438" class="fg-l warm"/><polygon points="430,387 438,382.5 438,391.5" class="fg-a warm"/>
<text x="478" y="332" class="fg-t sm warm">n 變成 0</text><text x="478" y="350" class="fg-t sm warm">才跳到 8</text>
</svg><figcaption>平常 PC 一格一格往下。JUMP 把 PC 改回 0，形成迴圈；JUMPZ 只有在剛才的結果是 0 時才改寫 PC，這就是「判斷」。</figcaption></figure>
<p>JUMPZ 怎麼知道「剛才的結果是 0」？ALU 每算完一次，就順便把結果的幾個特徵記在一組叫<b>旗標</b>（flags）的小位元裡：是不是 0（zero flag）、是不是負數、有沒有進位、有沒有溢位。條件跳躍指令不看數字本身，只看旗標。真實處理器有「是 0 就跳」「不是 0 就跳」「小於就跳」「大於等於就跳」等十幾種，你寫的每一個 <code>if</code> 和 <code>&lt;</code>，最後都會變成其中一種。</p>
<h4>完整追一次</h4>
<table>
<tr><th>第幾圈</th><th>開始時 n</th><th>加完後總和</th><th>減完後 n</th><th>JUMPZ</th></tr>
<tr><td>1</td><td>5</td><td>5</td><td>4</td><td>不是 0，往下走到 JUMP 0</td></tr>
<tr><td>2</td><td>4</td><td>9</td><td>3</td><td>不是 0</td></tr>
<tr><td>3</td><td>3</td><td>12</td><td>2</td><td>不是 0</td></tr>
<tr><td>4</td><td>2</td><td>14</td><td>1</td><td>不是 0</td></tr>
<tr><td>5</td><td>1</td><td>15</td><td>0</td><td><b>是 0，跳到格子 8，停止</b></td></tr>
</table>
<p>前四圈每圈 8 道指令，最後一圈到 JUMPZ 為止是 7 道，再加 HALT 1 道：4 × 8 + 7 + 1 = 40 道指令。每道指令 3 步，所以示範要按 120 下，跟你上一課數到的一樣。一般化：起始是 n，就要跑 8n 道指令。<b>工作量跟輸入一起變大</b>，這就是之後你會一直聽到的「時間複雜度」的起點。</p>
<h4>你寫的迴圈長什麼樣子</h4>
<pre><code>let total = 0;
for (let n = 5; n !== 0; n = n - 1) {
  total = total + n;
}</code></pre>
<p>編譯成機器碼後，結構跟迷你 CPU 的程式幾乎一模一樣：迴圈主體、減 1、比較、條件跳躍、跳回開頭。差別只在真實的編譯器很聰明，會把 <code>total</code> 和 <code>n</code> 放在暫存器裡，不必每圈都去記憶體來回搬。</p>

<h3><span class="badge lv3">專業</span>五、為什麼真實 CPU 快那麼多：管線、預測、亂序</h3>
<p>迷你 CPU 一次只處理一道指令，做完三步才開始下一道。真實處理器像工廠的生產線：第一道指令在執行時，第二道已經在解碼，第三道已經在擷取。這叫<b>管線</b>（pipeline）。</p>
<figure class="figure"><svg viewBox="0 0 600 236" class="fg" style="width:100%;max-width:600px" role="img" aria-label="管線圖：四道指令錯開一拍，每一拍同時有三道指令在不同步驟，六拍就做完四道">
<text x="176" y="30" text-anchor="middle" class="fg-t sm">第 1 拍</text><text x="248" y="30" text-anchor="middle" class="fg-t sm">第 2 拍</text><text x="320" y="30" text-anchor="middle" class="fg-t sm">第 3 拍</text><text x="392" y="30" text-anchor="middle" class="fg-t sm">第 4 拍</text><text x="464" y="30" text-anchor="middle" class="fg-t sm">第 5 拍</text><text x="536" y="30" text-anchor="middle" class="fg-t sm">第 6 拍</text>
<text x="20" y="69" class="fg-t">指令 1</text><text x="20" y="109" class="fg-t">指令 2</text><text x="20" y="149" class="fg-t">指令 3</text><text x="20" y="189" class="fg-t">指令 4</text>
<rect x="143" y="48" width="66" height="32" rx="5" class="fg-b alt"/><text x="176" y="69" text-anchor="middle" class="fg-t sm">擷取</text>
<rect x="215" y="48" width="66" height="32" rx="5" class="fg-b hot"/><text x="248" y="69" text-anchor="middle" class="fg-t sm">解碼</text>
<rect x="287" y="48" width="66" height="32" rx="5" class="fg-b warm"/><text x="320" y="69" text-anchor="middle" class="fg-t sm">執行</text>
<rect x="215" y="88" width="66" height="32" rx="5" class="fg-b alt"/><text x="248" y="109" text-anchor="middle" class="fg-t sm">擷取</text>
<rect x="287" y="88" width="66" height="32" rx="5" class="fg-b hot"/><text x="320" y="109" text-anchor="middle" class="fg-t sm">解碼</text>
<rect x="359" y="88" width="66" height="32" rx="5" class="fg-b warm"/><text x="392" y="109" text-anchor="middle" class="fg-t sm">執行</text>
<rect x="287" y="128" width="66" height="32" rx="5" class="fg-b alt"/><text x="320" y="149" text-anchor="middle" class="fg-t sm">擷取</text>
<rect x="359" y="128" width="66" height="32" rx="5" class="fg-b hot"/><text x="392" y="149" text-anchor="middle" class="fg-t sm">解碼</text>
<rect x="431" y="128" width="66" height="32" rx="5" class="fg-b warm"/><text x="464" y="149" text-anchor="middle" class="fg-t sm">執行</text>
<rect x="359" y="168" width="66" height="32" rx="5" class="fg-b alt"/><text x="392" y="189" text-anchor="middle" class="fg-t sm">擷取</text>
<rect x="431" y="168" width="66" height="32" rx="5" class="fg-b hot"/><text x="464" y="189" text-anchor="middle" class="fg-t sm">解碼</text>
<rect x="503" y="168" width="66" height="32" rx="5" class="fg-b warm"/><text x="536" y="189" text-anchor="middle" class="fg-t sm">執行</text>
<text x="300" y="226" text-anchor="middle" class="fg-t sm">沒有管線：4 道指令要 12 拍。有管線：6 拍做完，而且之後每一拍都完成一道。</text>
</svg><figcaption>第 3 拍時，指令 1 在執行、指令 2 在解碼、指令 3 在擷取。三個零件都沒閒著。</figcaption></figure>
<p>生產線很美，但有兩種情況會卡住：</p>
<h4>卡住一：下一道要用上一道還沒算好的結果</h4>
<p>迷你程式裡，ADD 13 要用 LOAD 14 剛放進工作暫存器的數字。如果 LOAD 還沒執行完，ADD 就拿到舊的值。處理器的對策有兩個：讓 ADD 等一拍（叫 stall，管線裡出現一個空格），或把剛算出來的結果直接從 ALU 的出口「抄近路」送給下一道指令（叫 forwarding）。</p>
<h4>卡住二：遇到跳躍，還不知道下一道是誰</h4>
<p>擷取 JUMPZ 8 的時候，處理器還不知道它會不會跳，要等到執行那一步才知道。可是生產線不能停，所以處理器會<b>先猜</b>（branch prediction）：照之前的經驗猜這次會不會跳，先把猜的那條路上的指令拿進來做。猜對了，什麼都不用等；猜錯了，就把管線裡猜錯的那幾道全部丟掉重來。在現代處理器上，一次猜錯大約損失 15 到 20 拍。</p>
<p>這個效應大到你在 JavaScript 裡都量得到：對同一個陣列做「大於 128 才加總」，排序過的陣列常常比沒排序的快好幾倍，因為排序後前半段都不跳、後半段都跳，處理器幾乎每次都猜對。</p>
<h4>再往上：一拍做很多道、而且不照順序</h4>
<ul>
<li><b>多發射</b>（superscalar）：一個核心裡有好幾組 ALU，同一拍可以同時處理好幾道互不相干的指令。M1 的高效能核心，一拍最多能解碼 8 道指令。</li>
<li><b>亂序執行</b>（out-of-order execution）：處理器一次看前面上百道指令，哪一道需要的資料先到齊就先做，最後再照原本的順序把結果交出去。所以你寫的程式「看起來」是一行一行照順序，實際上裡面是同時、亂序在跑。</li>
<li>2018 年的 <b>Spectre</b> 漏洞，就是利用「先猜、猜錯再丟掉」這段過程留在快取裡的痕跡，讀到不該讀的資料。效能設計和資安，在這裡碰在一起。</li>
</ul>

<h3><span class="badge lv3">專業</span>六、函式呼叫：CPU 怎麼記得要「回去哪裡」</h3>
<p>迷你 CPU 只會跳，不會「呼叫」。可是真實程式到處都是函式呼叫：<code>main</code> 呼叫 <code>drawCard</code>，<code>drawCard</code> 做完，要回到 <code>main</code> 剛才那一行的下一行繼續。跳過去很簡單，難的是<b>回來</b>：CPU 怎麼知道要回到哪一格？</p>
<p>答案是一塊叫<b>堆疊</b>（stack）的記憶體，加上一個專門指著堆疊頂端的暫存器：<b>堆疊指標</b>（stack pointer，SP）。</p>
<figure class="figure"><svg viewBox="0 0 600 330" class="fg" style="width:100%;max-width:600px" role="img" aria-label="呼叫堆疊：main 的區塊在上，drawCard 的區塊疊在下面，裡面放著回來的位址和區域變數，堆疊指標指著最下面">
<text x="200" y="22" text-anchor="middle" class="fg-t lg">堆疊（往下長）</text>
<rect x="90" y="36" width="220" height="96" rx="6" class="fg-b alt"/>
<text x="102" y="56" class="fg-t sm alt">main 的區塊（stack frame）</text>
<rect x="104" y="64" width="192" height="26" rx="4" class="fg-b"/><text x="114" y="82" class="fg-t sm">區域變數 score = 3</text>
<rect x="104" y="96" width="192" height="26" rx="4" class="fg-b"/><text x="114" y="114" class="fg-t sm">區域變數 round = 7</text>
<rect x="90" y="140" width="220" height="128" rx="6" class="fg-b hot"/>
<text x="102" y="160" class="fg-t sm acc">drawCard 的區塊</text>
<rect x="104" y="168" width="192" height="26" rx="4" class="fg-b warm"/><text x="114" y="186" class="fg-t sm">回來的位址 = 0x1048</text>
<rect x="104" y="200" width="192" height="26" rx="4" class="fg-b"/><text x="114" y="218" class="fg-t sm">區域變數 index = 12</text>
<rect x="104" y="232" width="192" height="26" rx="4" class="fg-b"/><text x="114" y="250" class="fg-t sm">區域變數 card = 9</text>
<line x1="200" y1="276" x2="200" y2="304" class="fg-l dash"/><polygon points="200,312 195.5,304 204.5,304" class="fg-a"/>
<text x="210" y="300" class="fg-t sm">再呼叫，就繼續往下疊</text>
<line x1="378" y1="258" x2="318" y2="258" class="fg-l on"/><polygon points="310,258 318,253.5 318,262.5" class="fg-a on"/>
<text x="386" y="254" class="fg-t acc">SP 堆疊指標</text><text x="386" y="272" class="fg-t sm">永遠指著最上面那一格</text>
<rect x="386" y="60" width="200" height="110" rx="6" class="fg-b"/>
<text x="398" y="82" class="fg-t sm"><tspan class="fg-t acc">CALL drawCard</tspan></text>
<text x="398" y="102" class="fg-t sm">1. 把「回來的位址」推上堆疊</text>
<text x="398" y="122" class="fg-t sm">2. PC 改成 drawCard 的開頭</text>
<text x="398" y="146" class="fg-t sm"><tspan class="fg-t acc">RET</tspan>：從堆疊拿回位址</text>
<text x="398" y="164" class="fg-t sm">放回 PC，回到 main</text>
</svg><figcaption>每呼叫一次函式，就在堆疊上疊一個區塊，裡面有「回來的位址」和這個函式自己的區域變數。函式結束，區塊就拿掉。</figcaption></figure>
<ul>
<li><b>CALL</b>：先把 PC 現在的值（也就是「做完要回來的地方」）推上堆疊，再把 PC 改成函式的開頭。本質上就是「先記下書籤，再跳」。</li>
<li><b>RET</b>：從堆疊頂端拿出那個位址，放回 PC。CPU 就回到呼叫者的下一行。</li>
<li>函式自己的<b>區域變數</b>也放在同一個區塊裡（stack frame）。函式結束時，SP 往回移，這些變數就一起消失。這就是為什麼區域變數離開函式就沒了。</li>
<li>ARM64 有個小差別：CALL（叫 <code>BL</code>）先把回來的位址放在一個專用暫存器（link register），只有當這個函式還要再呼叫別人時，才把它存到堆疊上，省一次記憶體來回。</li>
</ul>
<h4>你天天看到、但可能沒想過的三件事</h4>
<ol>
<li><b>Stack trace</b>：程式出錯時印出來的那一串「at drawCard (deck.ts:42) at main (game.ts:10)」，就是把堆疊上一格一格的「回來的位址」翻譯成函式名稱和行號。它是一張「你是怎麼走到這裡的」地圖。</li>
<li><b>Stack overflow</b>：遞迴沒有停下來，堆疊一直往下疊，疊到超過作業系統給的空間，程式就當掉。JavaScript 的「Maximum call stack size exceeded」就是這個。</li>
<li><b>Buffer overflow 攻擊</b>：C 語言裡，如果往區域陣列寫入的資料超過它的長度，就會一路蓋過旁邊的「回來的位址」。攻擊者把它改成自己準備的程式位址，RET 一執行，CPU 就乖乖跳過去。這是資安史上最經典的攻擊。現代的防禦有三層：在回來的位址旁放一個「金絲雀」值（stack canary），被蓋掉就立刻終止；把堆疊標成不可執行；以及每次執行都把記憶體位置隨機打亂（ASLR）。模組 5 會再遇到它們。</li>
</ol>

<h3><span class="badge lv4">專家</span>七、中斷與作業系統：一顆核心怎麼同時跑一百個程式</h3>
<p>你的 Mac 同時開著瀏覽器、VS Code、音樂，可是一顆核心在任何一拍，都只在跑一條指令流。這些程式是怎麼「同時」的？答案是兩個機制：<b>中斷</b>（interrupt）和<b>內容切換</b>（context switch）。</p>
<figure class="figure"><svg viewBox="0 0 640 190" class="fg" style="width:100%;max-width:640px" role="img" aria-label="時間軸：程式 A 與程式 B 輪流使用 CPU，每次計時器中斷之後，作業系統保存一個程式的暫存器、載入另一個程式的暫存器">
<text x="20" y="56" class="fg-t">CPU 在跑</text>
<rect x="110" y="36" width="140" height="32" rx="5" class="fg-b alt"/><text x="180" y="57" text-anchor="middle" class="fg-t">程式 A</text>
<rect x="252" y="36" width="44" height="32" rx="5" class="fg-b warm"/><text x="274" y="57" text-anchor="middle" class="fg-t sm">OS</text>
<rect x="298" y="36" width="140" height="32" rx="5" class="fg-b hot"/><text x="368" y="57" text-anchor="middle" class="fg-t">程式 B</text>
<rect x="440" y="36" width="44" height="32" rx="5" class="fg-b warm"/><text x="462" y="57" text-anchor="middle" class="fg-t sm">OS</text>
<rect x="486" y="36" width="140" height="32" rx="5" class="fg-b alt"/><text x="556" y="57" text-anchor="middle" class="fg-t">程式 A</text>
<line x1="252" y1="96" x2="252" y2="76" class="fg-l warm"/><polygon points="252,70 247.5,78 256.5,78" class="fg-a warm"/>
<line x1="440" y1="96" x2="440" y2="76" class="fg-l warm"/><polygon points="440,70 435.5,78 444.5,78" class="fg-a warm"/>
<text x="252" y="112" text-anchor="middle" class="fg-t sm warm">計時器中斷</text><text x="440" y="112" text-anchor="middle" class="fg-t sm warm">計時器中斷</text>
<text x="274" y="140" text-anchor="middle" class="fg-t sm">存 A 的暫存器</text><text x="274" y="156" text-anchor="middle" class="fg-t sm">載入 B 的暫存器</text>
<text x="462" y="140" text-anchor="middle" class="fg-t sm">存 B 的暫存器</text><text x="462" y="156" text-anchor="middle" class="fg-t sm">載入 A 的暫存器</text>
<line x1="110" y1="180" x2="626" y2="180" class="fg-l dim"/><polygon points="634,180 626,175.5 626,184.5" class="fg-a"/>
<text x="110" y="174" class="fg-t sm">時間</text>
</svg><figcaption>每隔幾毫秒，硬體計時器打斷 CPU。作業系統把目前程式的 PC 和所有暫存器存起來，換另一個程式的值放回去。每個程式都以為自己獨佔了 CPU。</figcaption></figure>
<ol>
<li><b>中斷</b>：硬體可以對 CPU 發一個訊號：計時器到了、網路卡收到封包、你按了鍵盤。CPU 做完手上那一道指令，就像被呼叫一樣，把 PC 存起來，跳到作業系統事先登記好的處理程式。</li>
<li><b>排程</b>：作業系統的排程器（scheduler）決定接下來輪到哪一個程式。</li>
<li><b>內容切換</b>：把目前程式的所有暫存器（包含 PC 和 SP）存進它在記憶體裡的資料結構，再把下一個程式上次存的值全部載回來。最後一道「從中斷返回」的指令，CPU 就繼續跑那個程式，好像什麼都沒發生。</li>
</ol>
<h4>兩種模式，一道牆</h4>
<p>CPU 裡有一個代表權限的位元：<b>使用者模式</b>（user mode）和<b>核心模式</b>（kernel mode）。你的程式跑在使用者模式，碰不到硬體、不能改別人的記憶體。要開檔案、送封包，就得執行一道特別的指令（系統呼叫，第 0.9 課）主動進入核心模式，讓作業系統代勞。這道牆，是一個程式當掉不會拖垮整台電腦的原因，也是資安隔離的地基。</p>
<h4>這跟你吃飯的技能有什麼關係</h4>
<ul>
<li><b>切換有成本</b>：一次內容切換直接花費大約一到幾微秒，還會把快取裡的資料洗掉，間接成本更大。伺服器上執行緒開太多、彼此搶 CPU，時間就耗在切換上。第 4.6 課的 <code>vmstat</code> 裡那一欄 <code>cs</code>，就是每秒切換次數。</li>
<li><b>Node.js 為什麼只用一條執行緒</b>：一個事件迴圈，不用在幾千條執行緒之間切換。代價是一段同步程式卡住，所有人都卡住。</li>
<li><b>Go 的 goroutine 為什麼便宜</b>：Go 自己在使用者模式裡切換 goroutine，不必經過作業系統，也不用存那麼多暫存器。所以一台機器可以開十萬個 goroutine。這正是你「高併發修煉手冊」那份教材的地基。</li>
</ul>

<h3>八、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>時脈越高就越快</td><td>速度 = 時脈 × 每一拍平均完成幾道指令（IPC）。一顆 3 GHz、每拍做 4 道的核心，比 4 GHz、每拍做 1 道的快得多。</td></tr>
<tr><td>CPU 一次只做一件事</td><td>單一核心在同一拍裡，可能有上百道指令在不同步驟、不同零件裡進行。</td></tr>
<tr><td>程式一定是一行一行照順序跑</td><td>結果「看起來」照順序，裡面其實是亂序。多執行緒的程式會看到這個差別，所以才需要鎖和 atomic。</td></tr>
<tr><td>if 很便宜</td><td>可以預測的 if 幾乎免費；隨機、猜不到的 if，每次猜錯都要付十幾拍。</td></tr>
<tr><td>CPU 在「理解」程式</td><td>沒有任何理解，只有位元打開對的開關。所有聰明都在電路怎麼接、程式怎麼寫。</td></tr>
</table>

<h3>九、跟你的工作連起來</h3>
<ul>
<li><b>JavaScript／TypeScript</b>：V8 引擎一開始用直譯的方式跑你的程式，發現某個函式很常被呼叫，就把它編譯成機器碼（JIT）。你寫的 <code>for</code> 迴圈，最後就變成「比較、條件跳躍、跳回開頭」。</li>
<li><b>遊戲迴圈</b>：60 FPS 代表每一格畫面只有 16.7 毫秒。3 GHz 的核心在這段時間大約有 5,000 萬拍。Cocos 的 <code>update</code>、Unity 的 <code>Update</code>，全部都要擠進這個預算。</li>
<li><b>資料怎麼排會影響速度</b>：一長串數字照順序處理，快取和分支預測都最有效。這就是遊戲引擎喜歡把資料排成陣列、一次處理一整批（資料導向設計、ECS）的原因。</li>
</ul>

<h3>十、面試會怎麼問</h3>
<p>下面是後端、DevOps、遊戲工程師面試裡真的會出現的題目。先自己講一遍（最好出聲講），再打開參考答案。答得出來，這一章就算真的會了。</p>
<ol>
<li>「說說 CPU 執行一道指令的過程。」</li>
<li>「分支預測失敗，為什麼會讓程式變慢？舉一個你在程式碼裡會遇到的例子。」</li>
<li>「行程切換、執行緒切換、goroutine 切換，成本差在哪裡？」</li>
<li>「Stack overflow 跟記憶體不足（out of memory）有什麼不同？」</li>
<li>「Spectre 是什麼？為什麼它跟效能最佳化有關？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>CPU 依程式計數器的值，從記憶體（實際上通常是快取）擷取指令，同時把 PC 前進；解碼器把指令的位元拆成操作碼和運算元，控制單元依此打開對應的資料路徑；執行階段由 ALU 運算或存取記憶體，結果寫回暫存器，並更新旗標。現代 CPU 把這些步驟管線化、一拍處理多道，並且亂序執行，但對程式來說結果仍照原本順序交出。</li>
<li>管線要先猜跳躍的方向才能繼續擷取；猜錯時，管線裡已經做到一半的指令全部作廢，損失十幾拍。例子：對隨機資料做 <code>if (x &gt; 128)</code> 的迴圈；把資料先排序，或改寫成不需要分支的算式，就會明顯變快。</li>
<li>行程切換要換整個記憶體空間（還會讓位址轉換的快取失效），最貴；同一行程內的執行緒切換不必換記憶體空間，但仍要進出核心、存整組暫存器；goroutine 由 Go 執行環境在使用者模式切換，只存少數幾個暫存器，而且它的堆疊一開始只有幾 KB，所以最便宜、能開最多。</li>
<li>Stack overflow 是呼叫堆疊這一塊固定大小的空間用完了，通常是遞迴太深；記憶體不足是堆積（heap）上動態配置的空間不夠，通常是資料太多或記憶體洩漏。兩者的錯誤訊息、修法都不同：前者改演算法或改成迴圈，後者找誰一直佔著記憶體不放。</li>
<li>Spectre 利用 CPU 的推測執行：處理器先照猜測執行了不該執行的指令，結果雖然被丟掉，但它碰過的資料留在快取裡，攻擊者再用量測時間的方式讀出來。它說明了「為了快而先做」的最佳化，可能洩漏資料；修補方法往往會犧牲一部分效能。</li>
</ol>
</details>

<h3>十一、練功題（做得出來才算真的懂）</h3>
<ol>
<li>JUMPZ 8 和 STORE 13 各會被編成哪個數字？到上一課的示範裡，找找看它們在哪一格。</li>
<li>如果格子 13 一開始是 10，程式要跑幾道指令？要按幾下「走一步」？</li>
<li>只用 LOAD、ADD、STORE、HALT，寫一個把格子 13 的數字乘以 3、存到格子 14 的程式。寫出每一格放的數字。</li>
<li>用你自己的話解釋：為什麼「先排序再處理」，有時候反而比直接處理還快？</li>
<li>迷你 CPU 的位址只有 4 個位元。它最多能用幾格記憶體？如果要用 256 格，指令要改成怎樣？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>JUMPZ 8 = 5 × 16 + 8 = 88，在格子 6；STORE 13 = 3 × 16 + 13 = 61，在格子 5。</li>
<li>8 × 10 = 80 道指令，每道 3 步，要按 240 下。</li>
<li>格子 0：LOAD 13 = 29；格子 1：ADD 13 = 45；格子 2：ADD 13 = 45；格子 3：STORE 14 = 62；格子 4：HALT = 0。（不用迴圈，直接連加三次。）</li>
<li>排序後，「要不要加」的判斷變得很有規律，分支預測幾乎都猜對，管線不用一直清空；沒排序時判斷是隨機的，大約一半會猜錯，每次都損失十幾拍。</li>
<li>4 個位元只有 16 種組合，所以最多 16 格。要用 256 格，位址要 8 個位元，指令就得變長（例如 12 位元：4 位元操作碼 ＋ 8 位元位址），或把位址放在下一格。真實處理器的 64 位元，就是同一個問題放大後的答案。</li>
</ol>
</details>

<h3>十二、想再挖深</h3>
<ul>
<li><b>Nand2Tetris</b>（<a href="https://www.nand2tetris.org/">nand2tetris.org</a>）：免費課程，從一個 NAND 閘開始，一路自己做出 CPU、組譯器、作業系統，最後跑俄羅斯方塊。這一章的每一個零件，你都會親手接一次。</li>
<li><b>Ben Eater 的 8-bit 電腦</b>（YouTube）：用麵包板和真的晶片，把一台像迷你 CPU 一樣的電腦接起來，每一條線都看得到。</li>
<li><b>Charles Petzold《Code: The Hidden Language of Computer Hardware and Software》</b>：從手電筒、電報一路講到 CPU，是這一課最好的延伸讀物。</li>
<li><b>Patterson 與 Hennessy《Computer Organization and Design》</b>：資工系的計算機組織課本，管線、分支預測、快取都在這本。讀完它，這一章的內容你就能講給別人聽。</li>
</ul>
` });
