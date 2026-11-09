DEEP({ 'mach-transistor': `
<p>課文說電晶體是「用電來切換的開關」，也提到它是矽做的、晶圓是圓的、晶片會發熱。這一章把這三件事一路挖到底：矽為什麼可以被「調」成導電或不導電、電晶體裡那道閘門怎麼被電場打開、為什麼兩顆一組的 CMOS 幾乎不耗電、一片晶圓怎麼用光印出上百億顆電晶體、良率為什麼決定了晶片的價錢，還有那條決定手機會不會燙的功耗公式。你不需要會畫電路，但讀完之後，「3 奈米」「降頻」「大小核」這些字，你會知道背後到底在說什麼。</p>

<h3><span class="badge lv1">基礎</span>一、矽：本來不太導電，但可以調</h3>
<p>一樣東西會不會導電，看它的電子能不能自由移動。金屬的外層電子到處跑，所以導電；玻璃、塑膠把電子抓得死死的，所以絕緣。<b>矽</b>（silicon）在中間：每顆矽原子最外層有 4 顆電子，在晶體裡跟上下左右 4 個鄰居各共用一對，手牽手排成整齊的格子。每顆電子都有固定的位置，所以純的矽不太導電。</p>
<p>工程師的招數叫<b>摻雜</b>（doping）：故意換掉極少數的矽原子。</p>
<figure class="figure"><svg viewBox="0 0 660 236" class="fg" style="width:100%;max-width:660px" role="img" aria-label="兩塊矽晶格：左邊換進一顆磷，多出一顆自由電子，是 N 型；右邊換進一顆硼，少一顆電子留下電洞，是 P 型">
<text x="165" y="22" text-anchor="middle" class="fg-t lg">N 型：換進一顆磷</text>
<line x1="60" y1="60" x2="270" y2="60" class="fg-l dim"/><line x1="60" y1="120" x2="270" y2="120" class="fg-l dim"/><line x1="60" y1="180" x2="270" y2="180" class="fg-l dim"/>
<line x1="60" y1="60" x2="60" y2="180" class="fg-l dim"/><line x1="130" y1="60" x2="130" y2="180" class="fg-l dim"/><line x1="200" y1="60" x2="200" y2="180" class="fg-l dim"/><line x1="270" y1="60" x2="270" y2="180" class="fg-l dim"/>
<circle cx="60" cy="60" r="18" class="fg-b"/><text x="60" y="64" text-anchor="middle" class="fg-t sm">Si</text>
<circle cx="130" cy="60" r="18" class="fg-b"/><text x="130" y="64" text-anchor="middle" class="fg-t sm">Si</text>
<circle cx="200" cy="60" r="18" class="fg-b"/><text x="200" y="64" text-anchor="middle" class="fg-t sm">Si</text>
<circle cx="270" cy="60" r="18" class="fg-b"/><text x="270" y="64" text-anchor="middle" class="fg-t sm">Si</text>
<circle cx="60" cy="120" r="18" class="fg-b"/><text x="60" y="124" text-anchor="middle" class="fg-t sm">Si</text>
<circle cx="130" cy="120" r="18" class="fg-b"/><text x="130" y="124" text-anchor="middle" class="fg-t sm">Si</text>
<circle cx="200" cy="120" r="18" class="fg-b hot"/><text x="200" y="125" text-anchor="middle" class="fg-t acc">P</text>
<circle cx="270" cy="120" r="18" class="fg-b"/><text x="270" y="124" text-anchor="middle" class="fg-t sm">Si</text>
<circle cx="60" cy="180" r="18" class="fg-b"/><text x="60" y="184" text-anchor="middle" class="fg-t sm">Si</text>
<circle cx="130" cy="180" r="18" class="fg-b"/><text x="130" y="184" text-anchor="middle" class="fg-t sm">Si</text>
<circle cx="200" cy="180" r="18" class="fg-b"/><text x="200" y="184" text-anchor="middle" class="fg-t sm">Si</text>
<circle cx="270" cy="180" r="18" class="fg-b"/><text x="270" y="184" text-anchor="middle" class="fg-t sm">Si</text>
<circle cx="235" cy="90" r="6" class="fg-lamp on"/>
<text x="165" y="222" text-anchor="middle" class="fg-t sm">多一顆電子，可以自由移動：帶負電</text>
<text x="495" y="22" text-anchor="middle" class="fg-t lg">P 型：換進一顆硼</text>
<line x1="390" y1="60" x2="600" y2="60" class="fg-l dim"/><line x1="390" y1="120" x2="600" y2="120" class="fg-l dim"/><line x1="390" y1="180" x2="600" y2="180" class="fg-l dim"/>
<line x1="390" y1="60" x2="390" y2="180" class="fg-l dim"/><line x1="460" y1="60" x2="460" y2="180" class="fg-l dim"/><line x1="530" y1="60" x2="530" y2="180" class="fg-l dim"/><line x1="600" y1="60" x2="600" y2="180" class="fg-l dim"/>
<circle cx="390" cy="60" r="18" class="fg-b"/><text x="390" y="64" text-anchor="middle" class="fg-t sm">Si</text>
<circle cx="460" cy="60" r="18" class="fg-b"/><text x="460" y="64" text-anchor="middle" class="fg-t sm">Si</text>
<circle cx="530" cy="60" r="18" class="fg-b"/><text x="530" y="64" text-anchor="middle" class="fg-t sm">Si</text>
<circle cx="600" cy="60" r="18" class="fg-b"/><text x="600" y="64" text-anchor="middle" class="fg-t sm">Si</text>
<circle cx="390" cy="120" r="18" class="fg-b"/><text x="390" y="124" text-anchor="middle" class="fg-t sm">Si</text>
<circle cx="460" cy="120" r="18" class="fg-b"/><text x="460" y="124" text-anchor="middle" class="fg-t sm">Si</text>
<circle cx="530" cy="120" r="18" class="fg-b warm"/><text x="530" y="125" text-anchor="middle" class="fg-t warm">B</text>
<circle cx="600" cy="120" r="18" class="fg-b"/><text x="600" y="124" text-anchor="middle" class="fg-t sm">Si</text>
<circle cx="390" cy="180" r="18" class="fg-b"/><text x="390" y="184" text-anchor="middle" class="fg-t sm">Si</text>
<circle cx="460" cy="180" r="18" class="fg-b"/><text x="460" y="184" text-anchor="middle" class="fg-t sm">Si</text>
<circle cx="530" cy="180" r="18" class="fg-b"/><text x="530" y="184" text-anchor="middle" class="fg-t sm">Si</text>
<circle cx="600" cy="180" r="18" class="fg-b"/><text x="600" y="184" text-anchor="middle" class="fg-t sm">Si</text>
<circle cx="565" cy="90" r="6" class="fg-l warm dash"/>
<text x="495" y="222" text-anchor="middle" class="fg-t sm">少一顆電子，留下電洞：效果像正電</text>
</svg><figcaption>灰線是原子之間共用的電子對。綠點是磷多出來、沒地方放的電子；橘色虛線圈是硼少掉的那一顆，也就是電洞。</figcaption></figure>
<ul>
<li><b>摻磷</b>（phosphorus，最外層 5 顆電子）：4 顆拿去跟鄰居牽手，多出來的 1 顆沒有位置，就能自由移動。帶負電的載子變多了，叫 <b>N 型</b>（negative）。</li>
<li><b>摻硼</b>（boron，最外層 3 顆電子）：少了一顆，留下一個空位，叫<b>電洞</b>（hole）。隔壁的電子跳進來補，空位就換到隔壁去。電洞一路移動，效果就像一個正電荷在跑，叫 <b>P 型</b>（positive）。</li>
</ul>
<p>用電影院來想：座位全滿，沒人能換位子，這是純矽。多塞進一個沒座位的人，他可以在走道上到處走，這是 N 型。空出一個座位，旁邊的人一個個往空位挪，看起來就像「空位」在往反方向移動，這是 P 型。</p>
<p>摻的量少得驚人，常常是上百萬顆矽原子才換一顆，導電能力卻能差上好幾個數量級。更重要的是，它可以<b>一塊一塊地摻</b>：同一片晶體上，這裡做成 N 型、旁邊做成 P 型。電晶體就是用這種拼圖拼出來的。</p>

<h3><span class="badge lv1">基礎</span>二、MOSFET：用電場打開的閘門</h3>
<p>晶片裡幾乎所有的電晶體都是同一種：<b>金氧半場效電晶體</b>（MOSFET，metal–oxide–semiconductor field-effect transistor）。課文說的三隻腳，在這裡有正式的名字：電流進出的兩端叫<b>源極</b>（source）和<b>汲極</b>（drain），控制腳叫<b>閘極</b>（gate）。</p>
<figure class="figure"><svg viewBox="0 0 660 256" class="fg" style="width:100%;max-width:660px" role="img" aria-label="nMOS 的剖面圖：左邊閘極 0 伏特，源極和汲極之間被 P 型區域隔開，不通；右邊閘極 1 伏特，電子被吸到表面形成通道，接通">
<text x="165" y="18" text-anchor="middle" class="fg-t lg">閘極 0 V：關</text>
<text x="85" y="42" text-anchor="middle" class="fg-t sm">源極 0 V</text><text x="165" y="42" text-anchor="middle" class="fg-t sm warm">閘極 0 V</text><text x="245" y="42" text-anchor="middle" class="fg-t sm">汲極 1 V</text>
<line x1="85" y1="48" x2="85" y2="104" class="fg-l"/><line x1="165" y1="48" x2="165" y2="66" class="fg-l"/><line x1="245" y1="48" x2="245" y2="104" class="fg-l"/>
<rect x="30" y="104" width="270" height="110" class="fg-b"/>
<rect x="125" y="66" width="80" height="30" rx="3" class="fg-b"/><text x="165" y="86" text-anchor="middle" class="fg-t">閘極</text>
<rect x="115" y="96" width="100" height="8" class="fg-b warm"/>
<rect x="50" y="104" width="70" height="48" class="fg-b alt"/><text x="85" y="126" text-anchor="middle" class="fg-t">源極</text><text x="85" y="143" text-anchor="middle" class="fg-t sm">N 型</text>
<rect x="210" y="104" width="70" height="48" class="fg-b alt"/><text x="245" y="126" text-anchor="middle" class="fg-t">汲極</text><text x="245" y="143" text-anchor="middle" class="fg-t sm">N 型</text>
<text x="165" y="178" text-anchor="middle" class="fg-t sm warm">中間隔著 P 型，不通</text>
<text x="165" y="202" text-anchor="middle" class="fg-t sm">P 型基底</text>
<line x1="330" y1="10" x2="330" y2="222" class="fg-l dim dash"/>
<text x="495" y="18" text-anchor="middle" class="fg-t lg acc">閘極 1 V：開</text>
<text x="415" y="42" text-anchor="middle" class="fg-t sm">源極 0 V</text><text x="495" y="42" text-anchor="middle" class="fg-t sm acc">閘極 1 V</text><text x="575" y="42" text-anchor="middle" class="fg-t sm">汲極 1 V</text>
<line x1="415" y1="48" x2="415" y2="104" class="fg-l"/><line x1="495" y1="48" x2="495" y2="66" class="fg-l on"/><line x1="575" y1="48" x2="575" y2="104" class="fg-l"/>
<rect x="360" y="104" width="270" height="110" class="fg-b"/>
<rect x="455" y="66" width="80" height="30" rx="3" class="fg-b"/><text x="495" y="86" text-anchor="middle" class="fg-t">閘極</text>
<rect x="445" y="96" width="100" height="8" class="fg-b warm"/>
<rect x="380" y="104" width="70" height="48" class="fg-b alt"/><text x="415" y="126" text-anchor="middle" class="fg-t">源極</text><text x="415" y="143" text-anchor="middle" class="fg-t sm">N 型</text>
<rect x="540" y="104" width="70" height="48" class="fg-b alt"/><text x="575" y="126" text-anchor="middle" class="fg-t">汲極</text><text x="575" y="143" text-anchor="middle" class="fg-t sm">N 型</text>
<rect x="450" y="104" width="90" height="10" class="fg-b hot"/>
<circle cx="462" cy="109" r="2.5" class="fg-lamp on"/><circle cx="478" cy="109" r="2.5" class="fg-lamp on"/><circle cx="495" cy="109" r="2.5" class="fg-lamp on"/><circle cx="512" cy="109" r="2.5" class="fg-lamp on"/><circle cx="528" cy="109" r="2.5" class="fg-lamp on"/>
<text x="495" y="178" text-anchor="middle" class="fg-t sm acc">電子被吸上來，接成通道</text>
<text x="495" y="202" text-anchor="middle" class="fg-t sm">P 型基底</text>
<text x="330" y="246" text-anchor="middle" class="fg-t sm">橘色是閘極下面那層很薄的絕緣層：閘極本身幾乎沒有電流流進去</text>
</svg><figcaption>同一顆 nMOS，只差在閘極的電壓。右圖表面那一薄層電子，就是接通源極和汲極的那座橋。</figcaption></figure>
<p>以最常見的 nMOS 為例：底下是 P 型的矽，上面做出兩塊 N 型的區域，當源極和汲極。從源極走到汲極，要經過 N、P、N 三段，中間那段 P 型幾乎沒有自由電子，交界處又會擋住電流，所以平常是不通的（左圖）。</p>
<p>閘極蓋在兩塊 N 型區域中間的上方，底下隔著一層很薄的絕緣層（氧化層）。在閘極加上正電壓，電場穿過絕緣層，把 P 型區域表面的電洞推開、把電子吸上來。電壓超過某個門檻（叫<b>臨界電壓</b>，threshold voltage，現代製程大約是零點幾伏特），表面就聚集了一薄層電子，像一座橋接通源極和汲極。這層電子叫<b>通道</b>（channel）。路通了，電流就過得去（右圖）。</p>
<p>注意一個細節：閘極跟底下是<b>絕緣</b>的，電流幾乎流不進閘極。閘極靠的是「電場」，不是「電流」，所以才叫<b>場效</b>（field-effect）。這帶來兩個大好處：</p>
<ul>
<li><b>推動別人很省力</b>：控制一顆電晶體，只要把閘極這個小電容充飽就好，不用一直供電。所以一個閘的輸出，可以同時接好幾個下一級的閘，這叫<b>扇出</b>（fan-out）。</li>
<li><b>停著不動就幾乎不耗電</b>：下一節的 CMOS 就是靠這一點。</li>
</ul>
<div class="note"><b>名字的陷阱：</b>電晶體的「閘極」（gate）和下一課的「邏輯閘」（logic gate），英文都叫 gate，卻是兩件事。閘極是一顆電晶體的控制腳；邏輯閘是好幾顆電晶體組成的小電路。</div>

<h3><span class="badge lv2">進階</span>三、CMOS：兩顆一組，停著就不耗電</h3>
<p>nMOS 是「閘極有電才通」。把 N 和 P 全部對調，就得到 <b>pMOS</b>：「閘極沒電才通」。兩種還各有擅長的事：nMOS 擅長把輸出拉到 0（接地），pMOS 擅長把輸出拉到 1（接電源）。</p>
<p>把它們配成一對，就是 <b>CMOS</b>（complementary MOS，互補式金氧半）。最簡單的 CMOS 電路就是 NOT 閘，也叫<b>反相器</b>（inverter）：pMOS 接在電源和輸出之間，nMOS 接在輸出和地之間，兩顆的閘極接在一起當輸入。</p>
<figure class="figure"><svg viewBox="0 0 680 290" class="fg" style="width:100%;max-width:680px" role="img" aria-label="CMOS 反相器的兩種狀態：輸入 1 時 nMOS 接通、輸出接地變 0；輸入 0 時 pMOS 接通、輸出接電源變 1">
<line x1="110" y1="30" x2="230" y2="30" class="fg-l"/><text x="238" y="34" class="fg-t sm">電源 1 V</text>
<line x1="170" y1="30" x2="170" y2="60" class="fg-l dim"/>
<rect x="125" y="60" width="90" height="44" rx="5" class="fg-b"/><text x="170" y="79" text-anchor="middle" class="fg-t">pMOS</text><text x="170" y="96" text-anchor="middle" class="fg-t sm">關：斷開</text>
<line x1="170" y1="104" x2="170" y2="137" class="fg-l dim"/>
<line x1="170" y1="137" x2="170" y2="170" class="fg-l on"/>
<circle cx="170" cy="137" r="3.5" class="fg-lamp"/>
<line x1="170" y1="137" x2="252" y2="137" class="fg-l"/><polygon points="260,137 252,132.5 252,141.5" class="fg-a"/>
<text x="266" y="133" class="fg-t sm">輸出</text><text x="266" y="151" class="fg-t warm">0 V</text>
<rect x="125" y="170" width="90" height="44" rx="5" class="fg-b hot"/><text x="170" y="189" text-anchor="middle" class="fg-t acc">nMOS</text><text x="170" y="206" text-anchor="middle" class="fg-t sm">開：接通</text>
<line x1="170" y1="214" x2="170" y2="250" class="fg-l on"/>
<line x1="110" y1="250" x2="230" y2="250" class="fg-l"/><text x="238" y="254" class="fg-t sm">接地 0 V</text>
<text x="18" y="133" class="fg-t">輸入</text><text x="18" y="151" class="fg-t acc">1 V</text>
<line x1="54" y1="137" x2="90" y2="137" class="fg-l on"/><line x1="90" y1="82" x2="90" y2="192" class="fg-l on"/>
<line x1="90" y1="82" x2="125" y2="82" class="fg-l on"/><line x1="90" y1="192" x2="125" y2="192" class="fg-l on"/>
<circle cx="90" cy="137" r="3.5" class="fg-lamp on"/>
<text x="170" y="280" text-anchor="middle" class="fg-t acc">輸入 1 → 輸出 0</text>
<line x1="330" y1="10" x2="330" y2="284" class="fg-l dim dash"/>
<line x1="450" y1="30" x2="570" y2="30" class="fg-l"/><text x="578" y="34" class="fg-t sm">電源 1 V</text>
<line x1="510" y1="30" x2="510" y2="60" class="fg-l on"/>
<rect x="465" y="60" width="90" height="44" rx="5" class="fg-b hot"/><text x="510" y="79" text-anchor="middle" class="fg-t acc">pMOS</text><text x="510" y="96" text-anchor="middle" class="fg-t sm">開：接通</text>
<line x1="510" y1="104" x2="510" y2="137" class="fg-l on"/>
<line x1="510" y1="137" x2="510" y2="170" class="fg-l dim"/>
<circle cx="510" cy="137" r="3.5" class="fg-lamp on"/>
<line x1="510" y1="137" x2="592" y2="137" class="fg-l on"/><polygon points="600,137 592,132.5 592,141.5" class="fg-a on"/>
<text x="606" y="133" class="fg-t sm">輸出</text><text x="606" y="151" class="fg-t acc">1 V</text>
<rect x="465" y="170" width="90" height="44" rx="5" class="fg-b"/><text x="510" y="189" text-anchor="middle" class="fg-t">nMOS</text><text x="510" y="206" text-anchor="middle" class="fg-t sm">關：斷開</text>
<line x1="510" y1="214" x2="510" y2="250" class="fg-l dim"/>
<line x1="450" y1="250" x2="570" y2="250" class="fg-l"/><text x="578" y="254" class="fg-t sm">接地 0 V</text>
<text x="358" y="133" class="fg-t">輸入</text><text x="358" y="151" class="fg-t warm">0 V</text>
<line x1="394" y1="137" x2="430" y2="137" class="fg-l"/><line x1="430" y1="82" x2="430" y2="192" class="fg-l"/>
<line x1="430" y1="82" x2="465" y2="82" class="fg-l"/><line x1="430" y1="192" x2="465" y2="192" class="fg-l"/>
<circle cx="430" cy="137" r="3.5" class="fg-lamp"/>
<text x="510" y="280" text-anchor="middle" class="fg-t acc">輸入 0 → 輸出 1</text>
</svg><figcaption>綠色的線是接通的那條路。兩種狀態下，電源和地之間都有一顆電晶體是斷開的，所以沒有電流一直從電源流到地。</figcaption></figure>
<ol>
<li><b>輸入 1 伏特</b>：nMOS 的閘極有電，接通；pMOS 的閘極有電，反而斷開。輸出被接到地，變成 0。</li>
<li><b>輸入 0 伏特</b>：nMOS 斷開；pMOS 接通。輸出被接到電源，變成 1。</li>
</ol>
<p>關鍵在於：不管輸入是什麼，<b>兩顆裡永遠有一顆是斷開的</b>，電源到地之間沒有一條通路。所以電路停在 0 或 1 的時候，幾乎沒有電流在流。只有在切換的那一瞬間，才需要電流去把下一級的閘極充電或放電。</p>
<p>這不是理所當然的。1970 年代的晶片大多只用 nMOS，上面接一個像電阻一樣的元件把輸出拉高；輸出是 0 的時候，電流就從電源一路流到地，一直在發熱。CMOS 其實在 1963 年就被發明出來（Frank Wanlass，在 Fairchild），但要到 1980 年代，晶片越做越密、熱開始受不了，它才成為主流。今天幾乎所有的數位晶片都是 CMOS。</p>
<p>這就是課文說「一個 NOT 閘要兩顆電晶體」的由來。下一課的深入圖解，會用同樣的方法接出四顆電晶體的 NAND。</p>

<h3><span class="badge lv2">進階</span>四、為什麼會燙：電容、電壓，和那條功耗公式</h3>
<p>每一個閘極，加上連到它的導線，都是一個很小的<b>電容</b>（capacitance）。把它想成一個小水桶：輸出從 0 變成 1，就是透過接通的 pMOS 這條水管，把下一級所有的水桶裝滿；從 1 變成 0，就是透過 nMOS 把它們倒掉。</p>
<ul>
<li><b>為什麼要花時間</b>：水管有阻力、水桶有容量，裝滿需要一點時間。這就是閘的延遲，下一課的深入圖解會看到它怎麼決定時脈。</li>
<li><b>為什麼會熱</b>：每裝滿再倒掉一次，從電源拿走的能量是 C × V²（電容乘上電壓的平方），最後全部變成熱：一半在裝水時消耗在 pMOS 上，一半在倒水時消耗在 nMOS 上。</li>
</ul>
<p>把整顆晶片加起來，就是有名的<b>動態功耗</b>（dynamic power）公式：</p>
<div class="note"><b>P ≈ α × C × V² × f</b></div>
<table>
<tr><th>符號</th><th>意思</th><th>怎麼降低</th></tr>
<tr><td>α</td><td>每一拍裡，有多少比例的電晶體真的在切換（activity）</td><td>沒事做的區塊，把時脈停掉（clock gating）</td></tr>
<tr><td>C</td><td>要充放電的總電容</td><td>電晶體做小、導線做短，也就是更先進的製程</td></tr>
<tr><td>V</td><td>供電電壓</td><td>降壓。效果是平方，最有效</td></tr>
<tr><td>f</td><td>時脈頻率</td><td>降頻</td></tr>
</table>
<p>麻煩的是，頻率和電壓綁在一起：要讓電晶體切換得更快，就得用更高的電壓去推。來算一次。假設一顆核心在 3.0 GHz、1.0 V 時，動態功耗是 20 瓦：</p>
<figure class="figure"><svg viewBox="0 0 620 226" class="fg" style="width:100%;max-width:620px" role="img" aria-label="三種電壓與頻率組合的相對速度和相對功耗：2.4 GHz 時速度 0.8 倍、功耗 0.51 倍；3.0 GHz 都是 1 倍；4.0 GHz 時速度 1.33 倍、功耗 1.92 倍">
<rect x="170" y="12" width="14" height="10" class="fg-b alt"/><text x="190" y="21" class="fg-t sm">速度（相對）</text>
<rect x="290" y="12" width="14" height="10" class="fg-b warm"/><text x="310" y="21" class="fg-t sm">功耗（相對）</text>
<text x="20" y="64" class="fg-t">2.4 GHz・0.8 V</text><text x="20" y="81" class="fg-t sm">省電模式</text>
<rect x="170" y="49" width="160" height="14" class="fg-b alt"/><text x="338" y="60" class="fg-t sm alt">0.8 倍</text>
<rect x="170" y="69" width="102" height="14" class="fg-b warm"/><text x="280" y="80" class="fg-t sm warm">0.51 倍</text>
<text x="20" y="130" class="fg-t">3.0 GHz・1.0 V</text><text x="20" y="147" class="fg-t sm">基準</text>
<rect x="170" y="115" width="200" height="14" class="fg-b alt"/><text x="378" y="126" class="fg-t sm alt">1 倍</text>
<rect x="170" y="135" width="200" height="14" class="fg-b warm"/><text x="378" y="146" class="fg-t sm warm">1 倍</text>
<text x="20" y="196" class="fg-t">4.0 GHz・1.2 V</text><text x="20" y="213" class="fg-t sm">衝高時脈</text>
<rect x="170" y="181" width="267" height="14" class="fg-b alt"/><text x="445" y="192" class="fg-t sm alt">1.33 倍</text>
<rect x="170" y="201" width="384" height="14" class="fg-b warm"/><text x="562" y="212" class="fg-t sm warm">1.92 倍</text>
</svg><figcaption>藍色長條（速度）跟著頻率走，橘色長條（功耗）跟著「頻率 × 電壓的平方」走。往上衝，功耗漲得比速度快；往下降，省下的電比失去的速度多。</figcaption></figure>
<ul>
<li><b>衝到 4.0 GHz</b>，電壓要拉到 1.2 V：20 × (4 ÷ 3) × (1.2 ÷ 1.0)² ≈ 38 瓦。快了 33%，功耗卻多了 92%。</li>
<li><b>降到 2.4 GHz</b>，電壓可以降到 0.8 V：20 × 0.8 × 0.8² ≈ 10 瓦。只慢了 20%，功耗卻少了將近一半。</li>
</ul>
<p>這組數字是示意，但比例是真的。它解釋了三件你一定看過的事：</p>
<ol>
<li><b>手機的大小核</b>：小核用低電壓、低頻率，做同樣的工作耗電少很多。滑社群、聽音樂交給小核，玩遊戲才叫醒大核。</li>
<li><b>兩顆慢核心，比一顆快核心划算</b>：兩顆 2.4 GHz 的核心合起來大約 20 瓦，做的事是一顆 3.0 GHz 核心（也是 20 瓦）的 1.6 倍。前提是工作拆得開（第 0.8 課）。</li>
<li><b>動態電壓頻率調整</b>（DVFS，dynamic voltage and frequency scaling）：作業系統和晶片隨時依照負載切換「電壓＋頻率」的組合。沒事做就降，一忙就升。廠商寫的「最高加速時脈」，通常只撐得了一小段時間，或只在少數核心上達得到。</li>
</ol>

<h3><span class="badge lv3">專業</span>五、晶片怎麼做出來：用光一層一層印</h3>
<p>課文講到晶圓怎麼長出來。接下來，要在這片厚度不到 1 毫米的圓片上，印出上百億顆電晶體，和把它們連起來的導線。今天主流的晶圓直徑是 300 毫米，整個過程在比醫院手術室乾淨得多的<b>無塵室</b>（clean room）裡進行。核心技術叫<b>微影</b>（lithography），原理跟洗照片、網版印刷很像：</p>
<figure class="figure"><svg viewBox="0 0 640 226" class="fg" style="width:100%;max-width:640px" role="img" aria-label="微影的五個步驟：鋪一層、塗光阻、隔著光罩曝光、顯影、蝕刻；每一步下面畫出晶圓剖面的變化；做完洗掉光阻，換下一張光罩重來">
<rect x="14" y="30" width="108" height="44" rx="6" class="fg-b"/><text x="68" y="49" text-anchor="middle" class="fg-t">1 鋪一層</text><text x="68" y="66" text-anchor="middle" class="fg-t sm">氧化物或金屬</text>
<line x1="122" y1="52" x2="132" y2="52" class="fg-l"/><polygon points="140,52 132,47.5 132,56.5" class="fg-a"/>
<rect x="140" y="30" width="108" height="44" rx="6" class="fg-b"/><text x="194" y="49" text-anchor="middle" class="fg-t">2 塗光阻</text><text x="194" y="66" text-anchor="middle" class="fg-t sm">感光的塗料</text>
<line x1="248" y1="52" x2="258" y2="52" class="fg-l"/><polygon points="266,52 258,47.5 258,56.5" class="fg-a"/>
<rect x="266" y="30" width="108" height="44" rx="6" class="fg-b"/><text x="320" y="49" text-anchor="middle" class="fg-t">3 曝光</text><text x="320" y="66" text-anchor="middle" class="fg-t sm">光穿過光罩</text>
<line x1="374" y1="52" x2="384" y2="52" class="fg-l"/><polygon points="392,52 384,47.5 384,56.5" class="fg-a"/>
<rect x="392" y="30" width="108" height="44" rx="6" class="fg-b"/><text x="446" y="49" text-anchor="middle" class="fg-t">4 顯影</text><text x="446" y="66" text-anchor="middle" class="fg-t sm">洗掉照到的光阻</text>
<line x1="500" y1="52" x2="510" y2="52" class="fg-l"/><polygon points="518,52 510,47.5 510,56.5" class="fg-a"/>
<rect x="518" y="30" width="108" height="44" rx="6" class="fg-b"/><text x="572" y="49" text-anchor="middle" class="fg-t">5 蝕刻</text><text x="572" y="66" text-anchor="middle" class="fg-t sm">沒保護的被吃掉</text>
<rect x="24" y="150" width="88" height="20" class="fg-b alt"/><rect x="24" y="136" width="88" height="14" class="fg-b warm"/>
<rect x="150" y="150" width="88" height="20" class="fg-b alt"/><rect x="150" y="136" width="88" height="14" class="fg-b warm"/><rect x="150" y="124" width="88" height="12" class="fg-b hot"/>
<rect x="276" y="150" width="88" height="20" class="fg-b alt"/><rect x="276" y="136" width="88" height="14" class="fg-b warm"/><rect x="276" y="124" width="30" height="12" class="fg-b hot"/><rect x="306" y="124" width="18" height="12" class="fg-b"/><rect x="324" y="124" width="40" height="12" class="fg-b hot"/>
<rect x="276" y="92" width="30" height="8" class="fg-b"/><rect x="324" y="92" width="40" height="8" class="fg-b"/>
<line x1="315" y1="82" x2="315" y2="114" class="fg-l on"/><polygon points="315,122 310.5,114 319.5,114" class="fg-a on"/>
<line x1="291" y1="80" x2="291" y2="88" class="fg-l dim"/><line x1="344" y1="80" x2="344" y2="88" class="fg-l dim"/>
<rect x="402" y="150" width="88" height="20" class="fg-b alt"/><rect x="402" y="136" width="88" height="14" class="fg-b warm"/><rect x="402" y="124" width="30" height="12" class="fg-b hot"/><rect x="450" y="124" width="40" height="12" class="fg-b hot"/>
<rect x="528" y="150" width="88" height="20" class="fg-b alt"/><rect x="528" y="136" width="30" height="14" class="fg-b warm"/><rect x="576" y="136" width="40" height="14" class="fg-b warm"/><rect x="528" y="124" width="30" height="12" class="fg-b hot"/><rect x="576" y="124" width="40" height="12" class="fg-b hot"/>
<path d="M572 174 V196 H68 V182" class="fg-l dash"/><polygon points="68,174 63.5,182 72.5,182" class="fg-a"/>
<text x="320" y="216" text-anchor="middle" class="fg-t sm">洗掉光阻，換下一張光罩，從 1 再來一次（重複幾十層）</text>
</svg><figcaption>下排是晶圓的剖面：藍色是晶圓本身，橘色是這一輪要加工的那一層，綠色是光阻。光只穿過光罩的縫，縫底下的光阻被洗掉，那裡的材料就被吃掉。</figcaption></figure>
<ol>
<li><b>鋪一層</b>：在晶圓上長一層氧化物，或沉積一層金屬、其他材料。</li>
<li><b>塗光阻</b>（photoresist）：一層照到光就會改變性質的感光塗料。</li>
<li><b>曝光</b>：光穿過<b>光罩</b>（mask）照下來。光罩上有這一層的圖案，透鏡把它縮小大約 4 倍，一格一格印到晶圓上。</li>
<li><b>顯影</b>：把照到光的光阻洗掉（也有相反的光阻，看種類），圖案就轉印到光阻上了。</li>
<li><b>蝕刻</b>（etch）或<b>離子佈植</b>（ion implantation）：沒有光阻保護的地方，被吃掉，或被打進摻雜的原子。第一節的 N 型、P 型區域，就是這樣一塊一塊做出來的。</li>
</ol>
<p>然後洗掉光阻，換下一張光罩，再來一次。電晶體在最底下，上面再蓋十幾層銅導線，層與層之間用垂直的小孔接起來，每一層做完都要磨得極平（化學機械研磨，CMP）。先進製程的光罩有幾十層、工序上千道，一片晶圓從進廠到做完，常常要兩、三個月。</p>
<h4>光的波長，就是最小的筆尖</h4>
<p>能印得多細，受限於光的波長。主力的深紫外光（DUV）波長 193 奈米，比要印的線寬粗得多，工程師只好用各種技巧：在透鏡和晶圓之間加水（浸潤式微影），或把同一層拆成兩、三次曝光（多重曝光）。再往下，就得用<b>極紫外光</b>（EUV），波長 13.5 奈米。EUV 會被空氣和玻璃吸收，所以整台機器要抽真空、用反射鏡代替透鏡；光源是用雷射每秒打爆幾萬顆錫滴產生的電漿。全世界只有荷蘭的 ASML 做得出這種機器，一台超過一億美元。</p>
<h4>「3 奈米」不是任何東西的長度</h4>
<p>很久以前，製程的數字真的是電晶體閘極的長度。大約從 1990 年代末開始，兩者就脫鉤了，今天的「5 奈米」「3 奈米」只是<b>世代的名字</b>。3 奈米晶片上最細的金屬線距，也還有二十幾奈米。各家的命名也不能直接比：Intel 在 2021 年把自家的 10 奈米改名為「Intel 7」，因為它的密度跟台積電的 7 奈米差不多。比較有意義的指標，是每平方毫米塞得進幾百萬顆電晶體，以及同樣耗電下快了多少。廠商公布的數字通常是：新一代在同樣功耗下快一到兩成，或在同樣速度下省兩到三成的電。</p>
<h4>電晶體的形狀也在變</h4>
<figure class="figure"><svg viewBox="0 0 660 230" class="fg" style="width:100%;max-width:660px" role="img" aria-label="三代電晶體的剖面：平面式的閘極只壓在通道上面，FinFET 的閘極包住立起來的鰭三面，GAA 的閘極把幾片奈米片四面全包">
<text x="110" y="22" text-anchor="middle" class="fg-t lg">平面式</text><text x="110" y="42" text-anchor="middle" class="fg-t sm">2010 年代初以前</text>
<rect x="30" y="150" width="160" height="46" class="fg-b"/>
<rect x="70" y="138" width="80" height="12" class="fg-b hot"/>
<rect x="70" y="100" width="80" height="34" rx="3" class="fg-b alt"/><text x="110" y="122" text-anchor="middle" class="fg-t">閘極</text>
<text x="110" y="216" text-anchor="middle" class="fg-t sm">閘極只壓在上面</text>
<text x="330" y="22" text-anchor="middle" class="fg-t lg">FinFET（鰭式）</text><text x="330" y="42" text-anchor="middle" class="fg-t sm">約 2011 年起</text>
<rect x="250" y="160" width="160" height="36" class="fg-b"/>
<rect x="296" y="66" width="68" height="94" rx="3" class="fg-b alt"/>
<rect x="316" y="80" width="28" height="80" class="fg-b hot"/>
<text x="372" y="104" class="fg-t sm alt">閘極</text>
<text x="330" y="216" text-anchor="middle" class="fg-t sm">包住左、上、右三面</text>
<text x="550" y="22" text-anchor="middle" class="fg-t lg">GAA（環繞式）</text><text x="550" y="42" text-anchor="middle" class="fg-t sm">約 2022 年起</text>
<rect x="470" y="170" width="160" height="26" class="fg-b"/>
<rect x="508" y="56" width="84" height="114" rx="3" class="fg-b alt"/>
<rect x="522" y="72" width="56" height="18" class="fg-b hot"/><rect x="522" y="104" width="56" height="18" class="fg-b hot"/><rect x="522" y="136" width="56" height="18" class="fg-b hot"/>
<text x="600" y="104" class="fg-t sm alt">閘極</text>
<text x="550" y="216" text-anchor="middle" class="fg-t sm">把每一片四面全包</text>
</svg><figcaption>綠色是電流走的通道，藍色是閘極。閘極包得越完整，越能把通道「關緊」，關著的時候漏的電就越少。</figcaption></figure>
<p>電晶體越做越短，閘極從上面壓下來的電場，就越來越管不住底下的通道：明明「關」了，電流還是從底下偷溜過去，這就是<b>漏電</b>（leakage）。解法是讓閘極包住更多面：</p>
<ul>
<li><b>FinFET</b>（鰭式場效電晶體）：把通道立起來，變成一片「鰭」，閘極從左、上、右三面包住它。Intel 在 22 奈米（2011 年發表）率先量產，台積電從 16 奈米開始用。</li>
<li><b>GAA</b>（gate-all-around，環繞式閘極）：把通道做成幾片橫躺、疊起來的奈米片（nanosheet），閘極四面全包。Samsung 在 3 奈米、台積電在 2 奈米開始採用。</li>
</ul>

<h3><span class="badge lv3">專業</span>六、良率：為什麼大晶片貴得不成比例</h3>
<p>再乾淨的無塵室，晶圓上還是會落下零星的<b>缺陷</b>（defect）：一顆微塵、一處沒印好的圖案。缺陷落在哪一顆晶片上，那一顆通常就報廢了。一片晶圓上能用的晶片比例，叫<b>良率</b>（yield）。</p>
<figure class="figure"><svg viewBox="0 0 640 300" class="fg" style="width:100%;max-width:640px" role="img" aria-label="兩片一樣的晶圓，落著同樣 10 個缺陷：左邊切成小晶片，壞掉的只佔一小部分；右邊切成大晶片，壞掉的比例高很多">
<circle cx="160" cy="150" r="122" class="fg-b"/>
<rect x="57" y="104" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="57" y="123" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="57" y="142" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="57" y="161" width="16" height="16" rx="2" class="fg-b warm"/>
<rect x="57" y="180" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="76" y="85" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="76" y="104" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="76" y="123" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="76" y="142" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="76" y="161" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="76" y="180" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="76" y="199" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="95" y="66" width="16" height="16" rx="2" class="fg-b warm"/>
<rect x="95" y="85" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="95" y="104" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="95" y="123" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="95" y="142" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="95" y="161" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="95" y="180" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="95" y="199" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="95" y="218" width="16" height="16" rx="2" class="fg-b warm"/>
<rect x="114" y="47" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="114" y="66" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="114" y="85" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="114" y="104" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="114" y="123" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="114" y="142" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="114" y="161" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="114" y="180" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="114" y="199" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="114" y="218" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="114" y="237" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="133" y="47" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="133" y="66" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="133" y="85" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="133" y="104" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="133" y="123" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="133" y="142" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="133" y="161" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="133" y="180" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="133" y="199" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="133" y="218" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="133" y="237" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="152" y="47" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="152" y="66" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="152" y="85" width="16" height="16" rx="2" class="fg-b warm"/>
<rect x="152" y="104" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="152" y="123" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="152" y="142" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="152" y="161" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="152" y="180" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="152" y="199" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="152" y="218" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="152" y="237" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="171" y="47" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="171" y="66" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="171" y="85" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="171" y="104" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="171" y="123" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="171" y="142" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="171" y="161" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="171" y="180" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="171" y="199" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="171" y="218" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="171" y="237" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="190" y="47" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="190" y="66" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="190" y="85" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="190" y="104" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="190" y="123" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="190" y="142" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="190" y="161" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="190" y="180" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="190" y="199" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="190" y="218" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="190" y="237" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="209" y="66" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="209" y="85" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="209" y="104" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="209" y="123" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="209" y="142" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="209" y="161" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="209" y="180" width="16" height="16" rx="2" class="fg-b warm"/>
<rect x="209" y="199" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="209" y="218" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="228" y="85" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="228" y="104" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="228" y="123" width="16" height="16" rx="2" class="fg-b warm"/>
<rect x="228" y="142" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="228" y="161" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="228" y="180" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="228" y="199" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="247" y="104" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="247" y="123" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="247" y="142" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="247" y="161" width="16" height="16" rx="2" class="fg-b alt"/>
<rect x="247" y="180" width="16" height="16" rx="2" class="fg-b alt"/>
<circle cx="100" cy="80" r="3.2" class="fg-a warm"/>
<circle cx="195" cy="65" r="3.2" class="fg-a warm"/>
<circle cx="240" cy="130" r="3.2" class="fg-a warm"/>
<circle cx="140" cy="140" r="3.2" class="fg-a warm"/>
<circle cx="70" cy="170" r="3.2" class="fg-a warm"/>
<circle cx="210" cy="195" r="3.2" class="fg-a warm"/>
<circle cx="170" cy="230" r="3.2" class="fg-a warm"/>
<circle cx="105" cy="225" r="3.2" class="fg-a warm"/>
<circle cx="255" cy="210" r="3.2" class="fg-a warm"/>
<circle cx="155" cy="95" r="3.2" class="fg-a warm"/>
<text x="160" y="22" text-anchor="middle" class="fg-t lg">小晶片</text>
<text x="160" y="294" text-anchor="middle" class="fg-t sm">97 顆裡壞 6 顆，良率 94%</text>
<circle cx="480" cy="150" r="122" class="fg-b"/>
<rect x="379" y="90" width="38" height="38" rx="2" class="fg-b alt"/>
<rect x="379" y="131" width="38" height="38" rx="2" class="fg-b alt"/>
<rect x="379" y="172" width="38" height="38" rx="2" class="fg-b alt"/>
<rect x="420" y="49" width="38" height="38" rx="2" class="fg-b warm"/>
<rect x="420" y="90" width="38" height="38" rx="2" class="fg-b alt"/>
<rect x="420" y="131" width="38" height="38" rx="2" class="fg-b alt"/>
<rect x="420" y="172" width="38" height="38" rx="2" class="fg-b alt"/>
<rect x="420" y="213" width="38" height="38" rx="2" class="fg-b warm"/>
<rect x="461" y="49" width="38" height="38" rx="2" class="fg-b alt"/>
<rect x="461" y="90" width="38" height="38" rx="2" class="fg-b warm"/>
<rect x="461" y="131" width="38" height="38" rx="2" class="fg-b alt"/>
<rect x="461" y="172" width="38" height="38" rx="2" class="fg-b alt"/>
<rect x="461" y="213" width="38" height="38" rx="2" class="fg-b warm"/>
<rect x="502" y="49" width="38" height="38" rx="2" class="fg-b warm"/>
<rect x="502" y="90" width="38" height="38" rx="2" class="fg-b alt"/>
<rect x="502" y="131" width="38" height="38" rx="2" class="fg-b alt"/>
<rect x="502" y="172" width="38" height="38" rx="2" class="fg-b warm"/>
<rect x="502" y="213" width="38" height="38" rx="2" class="fg-b alt"/>
<rect x="543" y="90" width="38" height="38" rx="2" class="fg-b alt"/>
<rect x="543" y="131" width="38" height="38" rx="2" class="fg-b alt"/>
<rect x="543" y="172" width="38" height="38" rx="2" class="fg-b warm"/>
<circle cx="420" cy="80" r="3.2" class="fg-a warm"/>
<circle cx="515" cy="65" r="3.2" class="fg-a warm"/>
<circle cx="560" cy="130" r="3.2" class="fg-a warm"/>
<circle cx="460" cy="140" r="3.2" class="fg-a warm"/>
<circle cx="390" cy="170" r="3.2" class="fg-a warm"/>
<circle cx="530" cy="195" r="3.2" class="fg-a warm"/>
<circle cx="490" cy="230" r="3.2" class="fg-a warm"/>
<circle cx="425" cy="225" r="3.2" class="fg-a warm"/>
<circle cx="575" cy="210" r="3.2" class="fg-a warm"/>
<circle cx="475" cy="95" r="3.2" class="fg-a warm"/>
<text x="480" y="22" text-anchor="middle" class="fg-t lg">大晶片</text>
<text x="480" y="294" text-anchor="middle" class="fg-t sm">21 顆裡壞 7 顆，良率 67%</text>
</svg><figcaption>兩片晶圓上的缺陷（橘點）位置完全一樣。小晶片只有少數幾顆被打中；大晶片每一顆都佔很大的面積，三顆就壞一顆。</figcaption></figure>
<p>同一片晶圓、同樣 10 個缺陷，切成小晶片時只壞了 6%；切成大晶片，壞了三分之一。晶片越大，越容易「中獎」。常用的簡化模型是：良率 ≈ e<sup>−D × A</sup>，D 是每平方公分平均有幾個缺陷，A 是晶片的面積。用典型的數量級算一次：D = 0.1 時，1 平方公分的晶片良率約 90%；6 平方公分的大晶片（頂級 GPU 那種尺寸），只剩約 55%。</p>
<p>再把晶圓邊緣切不完整的損耗算進去：一片 300 毫米的晶圓，1 平方公分的晶片切得出六百多顆，6 平方公分的只切得出九十顆左右。好的分別大約是 580 顆和 50 顆。面積大 6 倍，每顆好晶片分攤到的晶圓成本卻差了 11 倍左右。先進製程的一片晶圓要上萬美元，這個差距就是真金白銀。</p>
<h4>業界怎麼對付良率</h4>
<ul>
<li><b>分級</b>（binning）：缺陷剛好落在某一顆核心上，就把那顆核心關掉，當成「少一顆核心」的版本賣；跑不到最高時脈的，就當較低階的型號賣。同一款晶片分成好幾個等級，常常就是這樣來的。</li>
<li><b>小晶片</b>（chiplet）：把一顆大晶片拆成幾顆小晶片，各自製造、測試，挑好的再封裝在一起。AMD 的伺服器處理器、Apple 的 M1 Ultra（兩顆 M1 Max 接在一起）都是這個思路。代價是晶片和晶片之間的連線，比晶片內部慢，也更耗電。</li>
<li><b>備用的零件</b>：記憶體區塊多做幾排備用的，測試時發現哪一排壞了，就切換到備用的那排。</li>
</ul>

<h3><span class="badge lv4">專家</span>七、熱、漏電，和物理的盡頭</h3>
<h4>Dennard 縮放的終結</h4>
<p>1974 年，Robert Dennard 指出：電晶體縮小時，電壓和電容可以跟著等比例縮小，每顆電晶體的功耗下降，剛好抵消密度的上升，<b>單位面積的功耗維持不變</b>。這條規律撐了三十年：每一代晶片都有更多電晶體、跑得更快，卻沒有更燙。</p>
<p>到了 2000 年代中期，它失效了。卡住的是電壓：要讓電晶體在低電壓下開得夠快，臨界電壓就得跟著降，可是臨界電壓一降，「關著」時的漏電就以指數上升。所以供電電壓從此大約卡在 1 伏特上下。電壓不降、密度照樣上升，單位面積的功耗就一路往上衝。後果你在第 0.8 課看過：時脈停在 3 到 4 GHz，改走多核心。</p>
<p>再往下走，晶片上的電晶體多到<b>不能同時全速運轉</b>，否則會過熱，這叫<b>暗矽</b>（dark silicon）。所以現在的晶片塞滿專用電路：GPU、AI 加速器（NPU）、影片編解碼器。它們平常關著，要用時才打開，做特定的事比通用核心省電得多。</p>
<h4>漏電：不做事也在花電</h4>
<p>前面說 CMOS「停著就不耗電」，那是理想狀況。真實的電晶體關著時還是會漏一點電，乘上幾百億顆，就是一筆可觀的<b>靜態功耗</b>（static power）。對策有兩個：把閒置區塊的電源整個切掉（power gating）；同一顆晶片上混用不同臨界電壓的電晶體，要快的地方用低臨界電壓（快但會漏），其他地方用高臨界電壓（慢但省）。</p>
<p>還有一種漏法更直接。到了 2000 年代中期，閘極下面的絕緣層薄到只剩幾個原子，電子會直接「穿隧」（tunneling）過去。Intel 在 2007 年的 45 奈米改用介電常數更高的材料（high-k）當絕緣層，搭配金屬閘極，讓絕緣層可以做厚一點、效果不變。這是量子力學直接出現在產品規格裡的例子。</p>
<h4>熱會降頻，也會讓晶片老化</h4>
<ul>
<li><b>降頻</b>（thermal throttling）：溫度碰到上限，韌體就自動降低電壓和頻率。很多筆電和手機的處理器，設計上就會跑在攝氏九十幾度，碰到上限就降頻。所以效能測試的頭 30 秒，常常比第 10 分鐘快。</li>
<li><b>老化</b>：導線裡的電流長年推著金屬原子移動（電遷移，electromigration），溫度越高越嚴重，久了會斷線。晶片能用十年，靠的是設計時就限制電流和溫度。</li>
<li><b>宇宙射線</b>：高能粒子打進晶片，偶爾會翻轉記憶體裡的一個位元，叫軟錯誤（soft error）。Google 在 2009 年對自家機房做的大規模研究發現，記憶體錯誤比業界原本以為的常見得多。所以伺服器用 <b>ECC 記憶體</b>，能自動更正單一位元的錯誤。</li>
</ul>
<h4>物理會洩密</h4>
<p>動態功耗跟「哪些位元在翻轉」有關。這件事可以被拿來攻擊：</p>
<ul>
<li><b>功耗分析</b>：1999 年 Paul Kocher 等人發表差分功耗分析（DPA）：量晶片在加密時的耗電波形，就能一步步推出金鑰。智慧卡、硬體錢包都得專門防這一招。</li>
<li><b>Hertzbleed</b>（2022）：DVFS 會依功耗調整頻率，而功耗又跟正在處理的資料有關。結果是運算時間跟資料有關，攻擊者從遠端量回應時間，就有機會推出金鑰。</li>
<li><b>Rowhammer</b>（2014）：記憶體格子做得太小、太密，對同一列反覆存取，會讓隔壁列的位元翻轉。Google Project Zero 在 2015 年示範用它取得系統的最高權限。</li>
</ul>
<p>這一章的電晶體、電壓、電容，最後一路連到資安。越往底層走，越會發現「抽象層」其實是會漏的。</p>

<h3>八、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>3 奈米製程，就是電晶體只有 3 奈米大</td><td>那是世代的名字，晶片上沒有任何東西剛好 3 奈米。各家的命名也不能直接比較。</td></tr>
<tr><td>電晶體做得越小，就一定越快、越省電</td><td>Dennard 縮放在 2000 年代中期就失效了。漏電和導線的延遲，讓每一代的進步越來越小、越來越貴。</td></tr>
<tr><td>晶片不做事就不耗電</td><td>關著的電晶體還是會漏電，幾百億顆加起來很可觀。所以才要把閒置區塊的電源切掉。</td></tr>
<tr><td>時脈加 30%，耗電就加 30%</td><td>通常要連電壓一起拉高，而功耗跟電壓的平方成正比，常常接近兩倍。</td></tr>
<tr><td>同一款晶片，每一顆都一模一樣</td><td>每顆的體質不同，出廠前會測試分級。能跑多快、要多少電壓，顆顆有差。</td></tr>
<tr><td>CPU 跑到 90 度就快壞了</td><td>很多處理器設計上就能跑在這個溫度，碰到上限會自己降頻。真正要注意的是長時間降頻造成的效能損失。</td></tr>
</table>

<h3>九、跟你的工作連起來</h3>
<ul>
<li><b>手機遊戲（Cocos、Unity）</b>：玩了十分鐘開始掉幀，常常不是程式變慢，是手機熱到降頻。限制幀率（Unity 的 <code>Application.targetFrameRate</code>、Cocos 的 <code>game.frameRate</code>）、減少每一幀不必要的計算和重複繪製，都是在降低公式裡的 α 和 f。效能測試要連續玩 15 到 20 分鐘再看數字，不要只看剛開機的那一分鐘。</li>
<li><b>前端（Vue、TypeScript）</b>：不必要的 <code>setInterval</code> 輪詢、一直在跑的動畫，會讓 CPU 沒機會進入省電狀態，筆電風扇狂轉、手機掉電。動畫用 <code>requestAnimationFrame</code>，分頁切到背景時瀏覽器會自動暫停它。</li>
<li><b>後端與效能測試（Node.js、Go）</b>：同一段程式量兩次，結果可能差 10% 以上，因為加速時脈和溫度一直在變。基準測試要多跑幾輪、看分布，例如 Go 用 <code>go test -bench . -count=10</code> 再交給 benchstat 比較，不要只看一次的數字。</li>
<li><b>雲端</b>：雲端的 vCPU 跑在別人也在用的實體晶片上，加速時脈和溫度你都控制不了，這是同一種機型效能會飄的原因之一。ARM 架構的機型（例如 AWS Graviton）每瓦效能好，同樣的預算常常能跑更多工作。</li>
</ul>

<h3>十、面試會怎麼問</h3>
<p>先自己講一遍，最好出聲講，再打開參考答案。</p>
<ol>
<li>「CMOS 是什麼？為什麼它不切換的時候幾乎不耗電？」</li>
<li>「動態功耗跟電壓、頻率是什麼關係？為什麼手機要有大小核？」</li>
<li>「『3 奈米製程』代表什麼？可以拿來比較不同廠商嗎？」</li>
<li>「什麼是良率？為什麼大晶片特別貴？chiplet 解決了什麼問題？」</li>
<li>「為什麼 2005 年左右之後，CPU 的時脈就沒有再大幅提升？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>CMOS 是用一對互補的電晶體組成邏輯閘：pMOS 組成的上拉網路接電源，nMOS 組成的下拉網路接地，兩邊的開關條件剛好相反。任何穩定的輸入下，總有一邊是斷開的，電源到地沒有直接通路，所以靜止時只剩很小的漏電。功耗主要發生在切換時，替下一級的閘極電容充放電。</li>
<li>動態功耗約等於 α × C × V² × f。功耗跟頻率成正比、跟電壓的平方成正比，而要跑更高的頻率通常得拉高電壓，所以往上衝時功耗漲得比效能快。大小核就是利用這一點：輕的工作交給低電壓、低頻率的小核，同樣的工作耗電少很多；重的工作才用大核。DVFS 則在執行中隨時調整電壓和頻率。</li>
<li>今天的製程數字是世代名稱，不是閘極長度或任何實際尺寸，各家的定義也不同，例如 Intel 曾把 10 奈米改名為 Intel 7。要比較，看電晶體密度、同功耗下的效能、同效能下的功耗，以及實際產品的測試結果。</li>
<li>良率是一片晶圓上能用的晶片比例。缺陷是隨機分布的，晶片面積越大，落到缺陷的機率越高，常用 e 的負（缺陷密度 × 面積）次方來估。大晶片不只切得少，壞的比例還高，每顆好晶片的成本因此不成比例地上升。chiplet 把大晶片拆成幾顆小的，各自測試後挑好的封裝在一起，提高良率，也能讓不同部分用不同的製程；代價是晶片之間的連線比較慢、比較耗電。</li>
<li>過去靠 Dennard 縮放：電晶體縮小、電壓跟著降，單位面積的功耗不變，所以可以一直加快時脈。2000 年代中期電壓降不下去了，因為臨界電壓再降，漏電會急遽上升。再提高時脈，功耗和熱就超過散熱能力，所以業界改走每一拍做更多事、增加核心數，以及專用加速器。</li>
</ol>
</details>

<h3>十一、練功題（做得出來才算真的懂）</h3>
<ol>
<li>一顆晶片在 2.0 GHz、0.9 V 時，動態功耗是 15 瓦。要跑到 3.0 GHz 得把電壓拉到 1.1 V，這時功耗大約是多少？是原來的幾倍？</li>
<li>缺陷密度是每平方公分 0.2 個。用 e<sup>−D × A</sup> 估算：2 平方公分和 0.5 平方公分的晶片，良率各大約多少？</li>
<li>CMOS 反相器的輸入從 0 慢慢升到 1 的過程中，有一小段時間兩顆電晶體都是半開的。這時候會發生什麼事？為什麼設計上希望訊號的上升、下降越乾脆越好？</li>
<li>你的手機遊戲在 60 FPS 下玩 10 分鐘就發燙、開始掉幀。用 P ≈ α × C × V² × f 解釋原因，再列出三個你能在程式或設定上做的改變。</li>
<li>晶圓從 200 毫米做到 300 毫米，為什麼每顆晶片會變便宜？至少說出兩個原因。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>15 × (3.0 ÷ 2.0) × (1.1 ÷ 0.9)² ≈ 15 × 1.5 × 1.49 ≈ 33.6 瓦，大約是原來的 2.2 倍。速度只多了 50%。</li>
<li>2 平方公分：e<sup>−0.4</sup> ≈ 67%。0.5 平方公分：e<sup>−0.1</sup> ≈ 90%。</li>
<li>兩顆都半開時，電源和地之間出現一條直接的通路，電流直接流過去，叫短路電流，純粹變成熱。訊號變化得越慢，這段時間越長、浪費越多；而且停在中間電壓的時間越長，越容易被雜訊干擾而誤判。所以設計上會控制每個閘推動的負載，讓訊號的邊緣夠陡。</li>
<li>持續的高負載讓晶片一直跑在高頻率、高電壓，熱量累積到上限，系統就降頻，幀率跟著掉。可以做的事：把幀率限制在 30 或依場景調整（降低 f，也讓晶片有機會降壓）；減少每幀的計算量，例如不要每幀都做的邏輯改成事件觸發或降低頻率；減少重複繪製和過大的貼圖，降低 GPU 的負擔（降低 α）；在畫面靜止時暫停不必要的更新。</li>
<li>一是同一輪製程處理一片晶圓的時間和成本差不多，但 300 毫米的面積是 200 毫米的 2.25 倍，一次做出的晶片多很多。二是邊緣切不完整的損耗，佔的比例變小。三是設備、人力等固定成本被更多晶片分攤。</li>
</ol>
</details>

<h3>十二、想再挖深</h3>
<ul>
<li><b>Chris Miller《Chip War: The Fight for the World's Most Critical Technology》</b>：從電晶體發明到台積電、ASML 的產業史，讀完會知道這一章的每一項技術是怎麼被逼出來的。</li>
<li><b>Patterson 與 Hennessy《Computer Organization and Design》第 1 章</b>：晶片製造、良率公式、「功耗牆」（power wall），用工程師的角度講清楚。</li>
<li><b>Neil Weste 與 David Harris《CMOS VLSI Design: A Circuits and Systems Perspective》</b>：電路設計的經典教科書，想真正懂 CMOS、延遲和功耗的計算，就讀這本。</li>
<li><b>Asianometry</b>（YouTube 頻道）：大量半導體製程、微影、產業史的影片，很適合有空時一部一部看。</li>
</ul>
` });
