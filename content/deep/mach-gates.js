DEEP({ 'mach-gates': `
<p>課文說：開關串聯是 AND、並聯是 OR，而 NAND 可以組出其他所有的閘。這一章往兩個方向挖。往下挖：閘在晶片裡到底是哪幾顆電晶體、怎麼接，為什麼 NAND 反而比 AND 便宜。往上挖：任何一張真值表，要怎麼一步一步變成電路；閘要花時間，最慢的那條路怎麼決定了 CPU 的時脈；還有兩種最常用的積木：多工器和解碼器。下一課的加法器、第 0.6 課的控制單元，都是用這一章的積木蓋起來的。</p>

<h3><span class="badge lv1">基礎</span>一、閘在晶片裡長什麼樣：用 CMOS 接出 NAND</h3>
<p>上一課的深入圖解講過兩種電晶體：nMOS 是「閘極有電才通」，pMOS 是「閘極沒電才通」；CMOS 反相器用一顆 pMOS 把輸出拉到 1、一顆 nMOS 把輸出拉到 0。所有 CMOS 的閘，都照同一個公式蓋：</p>
<ul>
<li>上面一組 pMOS，叫<b>上拉網路</b>（pull-up network），負責在該輸出 1 的時候接通電源。</li>
<li>下面一組 nMOS，叫<b>下拉網路</b>（pull-down network），負責在該輸出 0 的時候接通地。</li>
<li>兩組互為鏡像：nMOS 串聯的地方，pMOS 就並聯，反過來也一樣。所以不管輸入是什麼，剛好只有一組接通。</li>
</ul>
<p>把課文的「串聯是 AND」用在 nMOS 上：兩顆 nMOS 串聯，要 A 和 B 都是 1，輸出才會被拉到 0。輸出是 0 的條件是「A 而且 B」，所以這個閘是「AND 再反過來」，也就是 NAND：</p>
<figure class="figure"><svg viewBox="0 0 640 300" class="fg" style="width:100%;max-width:640px" role="img" aria-label="CMOS NAND 閘：兩顆 pMOS 並聯接電源，兩顆 nMOS 串聯接地；A 和 B 都是 1 時，兩顆 nMOS 都接通，輸出被拉到 0；右邊是四種輸入下哪一邊接通的表">
<line x1="60" y1="30" x2="300" y2="30" class="fg-l"/><text x="306" y="34" class="fg-t sm">電源</text>
<line x1="125" y1="30" x2="125" y2="56" class="fg-l dim"/><line x1="235" y1="30" x2="235" y2="56" class="fg-l dim"/>
<rect x="80" y="56" width="90" height="44" rx="5" class="fg-b"/><text x="125" y="75" text-anchor="middle" class="fg-t">pMOS（A）</text><text x="125" y="92" text-anchor="middle" class="fg-t sm">A = 1：關</text>
<rect x="190" y="56" width="90" height="44" rx="5" class="fg-b"/><text x="235" y="75" text-anchor="middle" class="fg-t">pMOS（B）</text><text x="235" y="92" text-anchor="middle" class="fg-t sm">B = 1：關</text>
<line x1="125" y1="100" x2="125" y2="128" class="fg-l dim"/><line x1="235" y1="100" x2="235" y2="128" class="fg-l dim"/><line x1="125" y1="128" x2="235" y2="128" class="fg-l dim"/>
<line x1="235" y1="128" x2="312" y2="128" class="fg-l"/><polygon points="320,128 312,123.5 312,132.5" class="fg-a"/>
<text x="326" y="124" class="fg-t sm">輸出</text><text x="326" y="143" class="fg-t warm">0</text>
<line x1="180" y1="128" x2="180" y2="148" class="fg-l on"/><circle cx="180" cy="128" r="3.5" class="fg-lamp"/>
<rect x="135" y="148" width="90" height="44" rx="5" class="fg-b hot"/><text x="180" y="167" text-anchor="middle" class="fg-t acc">nMOS（A）</text><text x="180" y="184" text-anchor="middle" class="fg-t sm">A = 1：開</text>
<line x1="180" y1="192" x2="180" y2="204" class="fg-l on"/>
<rect x="135" y="204" width="90" height="44" rx="5" class="fg-b hot"/><text x="180" y="223" text-anchor="middle" class="fg-t acc">nMOS（B）</text><text x="180" y="240" text-anchor="middle" class="fg-t sm">B = 1：開</text>
<line x1="180" y1="248" x2="180" y2="272" class="fg-l on"/>
<line x1="120" y1="272" x2="240" y2="272" class="fg-l"/><text x="246" y="276" class="fg-t sm">接地</text>
<text x="180" y="294" text-anchor="middle" class="fg-t sm">目前：A = 1、B = 1</text>
<text x="395" y="48" text-anchor="middle" class="fg-t sm">A</text><text x="425" y="48" text-anchor="middle" class="fg-t sm">B</text>
<text x="482" y="48" text-anchor="middle" class="fg-t sm">pMOS 並聯</text><text x="556" y="48" text-anchor="middle" class="fg-t sm">nMOS 串聯</text><text x="614" y="48" text-anchor="middle" class="fg-t sm">輸出</text>
<line x1="380" y1="58" x2="630" y2="58" class="fg-l dim"/>
<text x="395" y="82" text-anchor="middle" class="fg-t mono">0</text><text x="425" y="82" text-anchor="middle" class="fg-t mono">0</text><text x="482" y="82" text-anchor="middle" class="fg-t">通</text><text x="556" y="82" text-anchor="middle" class="fg-t">斷</text><text x="614" y="82" text-anchor="middle" class="fg-t acc">1</text>
<text x="395" y="108" text-anchor="middle" class="fg-t mono">0</text><text x="425" y="108" text-anchor="middle" class="fg-t mono">1</text><text x="482" y="108" text-anchor="middle" class="fg-t">通</text><text x="556" y="108" text-anchor="middle" class="fg-t">斷</text><text x="614" y="108" text-anchor="middle" class="fg-t acc">1</text>
<text x="395" y="134" text-anchor="middle" class="fg-t mono">1</text><text x="425" y="134" text-anchor="middle" class="fg-t mono">0</text><text x="482" y="134" text-anchor="middle" class="fg-t">通</text><text x="556" y="134" text-anchor="middle" class="fg-t">斷</text><text x="614" y="134" text-anchor="middle" class="fg-t acc">1</text>
<rect x="380" y="145" width="250" height="22" rx="4" class="fg-b hot"/>
<text x="395" y="160" text-anchor="middle" class="fg-t mono">1</text><text x="425" y="160" text-anchor="middle" class="fg-t mono">1</text><text x="482" y="160" text-anchor="middle" class="fg-t">斷</text><text x="556" y="160" text-anchor="middle" class="fg-t">通</text><text x="614" y="160" text-anchor="middle" class="fg-t warm">0</text>
<text x="380" y="200" class="fg-t sm">pMOS 並聯：任一個輸入是 0 就通</text>
<text x="380" y="222" class="fg-t sm">nMOS 串聯：兩個都是 1 才通</text>
<text x="380" y="252" class="fg-t acc">兩邊永遠剛好通一邊</text>
</svg><figcaption>左邊是 A、B 都是 1 的狀態：下拉的兩顆 nMOS 都接通，輸出接地變成 0。右邊的表是全部四種輸入：只有最後一列是下拉接通，其餘都是上拉接通，輸出 1。</figcaption></figure>
<p>四顆電晶體，就是課文說的「一個 NAND 閘要四顆」。這裡藏著一個反直覺的事實：CMOS 的閘天生會「反過來」，因為 nMOS 是在輸入為 1 時把輸出拉到 0。所以 NAND、NOR、NOT 才是最自然、最便宜的閘；你想要的 AND，反而得用 NAND 再接一個 NOT，總共六顆電晶體。</p>
<p>那為什麼大家偏愛 NAND，不是 NOR？NOR 剛好相反：nMOS 並聯、pMOS 串聯。pMOS 靠電洞導電，傳統上同樣大小的 pMOS 推得動的電流明顯比 nMOS 小（現代製程用各種技巧縮小了差距）。串聯會讓電流更小，所以把串聯放在強的 nMOS 那一邊（NAND），比放在弱的 pMOS 那一邊（NOR）划算。</p>

<h3><span class="badge lv1">基礎</span>二、從真值表到電路：積之和</h3>
<p>課文說「規則只要講得出來，就做得出來」。這一節給你一個保證成功的做法，叫<b>積之和</b>（sum of products）：</p>
<ol>
<li>把所有輸入組合列成<b>真值表</b>（truth table）。</li>
<li>挑出輸出是 1 的那幾列。</li>
<li>每一列寫成一個 AND：那一列是 1 的輸入直接接，是 0 的輸入先接 NOT。這個 AND 只有在「剛好是這一列」時才輸出 1。</li>
<li>把這些 AND 全部接進一個 OR。</li>
</ol>
<p>任何一張真值表都能這樣做。所以只靠 AND、OR、NOT，就能做出任何「是或否」的規則。</p>
<h4>先用猜高低走一次</h4>
<p>拿網站一直在用的猜高低遊戲來說：玩家猜「高」記為 H = 1，猜「低」記為 H = 0；新牌比舊牌大記為 U = 1，比較小記為 U = 0（先不管平手）。什麼時候贏？</p>
<table>
<tr><th>H（猜高）</th><th>U（真的比較大）</th><th>贏 W</th></tr>
<tr><td>0</td><td>0</td><td>1（猜低，真的低）</td></tr>
<tr><td>0</td><td>1</td><td>0</td></tr>
<tr><td>1</td><td>0</td><td>0</td></tr>
<tr><td>1</td><td>1</td><td>1（猜高，真的高）</td></tr>
</table>
<p>照步驟寫：W = (NOT H AND NOT U) OR (H AND U)。再看一眼真值表：H 和 U 一樣就贏，不一樣就輸。這正是 XOR 反過來，叫 <b>XNOR</b>。兩個 AND、一個 OR、兩個 NOT 的電路，其實一個 XNOR 閘就夠了。要處理平手，就加一個輸入 T（平手時是 1），規則變成 W = (NOT T) AND XNOR(H, U)：平手一律算輸。</p>
<h4>再來一個三輸入的：多數決</h4>
<p>三個輸入裡，至少兩個是 1，就輸出 1。真值表有 8 列，其中 4 列輸出 1：011、101、110、111。照步驟寫出來，是 4 個三輸入的 AND，加一個 OR。但它可以化簡。下面用布林代數的慣例：相乘的寫法 AB 代表 A AND B，加號代表 OR，A' 代表 NOT A。</p>
<p>原式是 A'BC + AB'C + ABC' + ABC。因為 X + X 還是 X，ABC 可以多抄兩份，分別跟前三項配對：A'BC + ABC = BC（A 是什麼都沒差）、AB'C + ABC = AC、ABC' + ABC = AB。結果是 <b>M = AB + BC + AC</b>。</p>
<figure class="figure"><svg viewBox="0 0 660 280" class="fg" style="width:100%;max-width:660px" role="img" aria-label="多數決的真值表與化簡後的電路：三個兩輸入 AND 分別接 A 和 B、B 和 C、A 和 C，再一起接進 OR，輸出 M">
<text x="40" y="30" text-anchor="middle" class="fg-t sm">A</text><text x="70" y="30" text-anchor="middle" class="fg-t sm">B</text><text x="100" y="30" text-anchor="middle" class="fg-t sm">C</text><text x="150" y="30" text-anchor="middle" class="fg-t sm">M</text>
<line x1="20" y1="38" x2="180" y2="38" class="fg-l dim"/>
<rect x="20" y="117" width="160" height="22" rx="4" class="fg-b hot"/>
<rect x="20" y="167" width="160" height="22" rx="4" class="fg-b hot"/>
<rect x="20" y="192" width="160" height="22" rx="4" class="fg-b hot"/>
<rect x="20" y="217" width="160" height="22" rx="4" class="fg-b hot"/>
<text x="40" y="58" text-anchor="middle" class="fg-t mono">0</text><text x="70" y="58" text-anchor="middle" class="fg-t mono">0</text><text x="100" y="58" text-anchor="middle" class="fg-t mono">0</text><text x="150" y="58" text-anchor="middle" class="fg-t mono">0</text>
<text x="40" y="83" text-anchor="middle" class="fg-t mono">0</text><text x="70" y="83" text-anchor="middle" class="fg-t mono">0</text><text x="100" y="83" text-anchor="middle" class="fg-t mono">1</text><text x="150" y="83" text-anchor="middle" class="fg-t mono">0</text>
<text x="40" y="108" text-anchor="middle" class="fg-t mono">0</text><text x="70" y="108" text-anchor="middle" class="fg-t mono">1</text><text x="100" y="108" text-anchor="middle" class="fg-t mono">0</text><text x="150" y="108" text-anchor="middle" class="fg-t mono">0</text>
<text x="40" y="133" text-anchor="middle" class="fg-t mono">0</text><text x="70" y="133" text-anchor="middle" class="fg-t mono">1</text><text x="100" y="133" text-anchor="middle" class="fg-t mono">1</text><text x="150" y="133" text-anchor="middle" class="fg-t acc">1</text>
<text x="40" y="158" text-anchor="middle" class="fg-t mono">1</text><text x="70" y="158" text-anchor="middle" class="fg-t mono">0</text><text x="100" y="158" text-anchor="middle" class="fg-t mono">0</text><text x="150" y="158" text-anchor="middle" class="fg-t mono">0</text>
<text x="40" y="183" text-anchor="middle" class="fg-t mono">1</text><text x="70" y="183" text-anchor="middle" class="fg-t mono">0</text><text x="100" y="183" text-anchor="middle" class="fg-t mono">1</text><text x="150" y="183" text-anchor="middle" class="fg-t acc">1</text>
<text x="40" y="208" text-anchor="middle" class="fg-t mono">1</text><text x="70" y="208" text-anchor="middle" class="fg-t mono">1</text><text x="100" y="208" text-anchor="middle" class="fg-t mono">0</text><text x="150" y="208" text-anchor="middle" class="fg-t acc">1</text>
<text x="40" y="233" text-anchor="middle" class="fg-t mono">1</text><text x="70" y="233" text-anchor="middle" class="fg-t mono">1</text><text x="100" y="233" text-anchor="middle" class="fg-t mono">1</text><text x="150" y="233" text-anchor="middle" class="fg-t acc">1</text>
<text x="250" y="36" text-anchor="middle" class="fg-t sm">A</text><text x="265" y="36" text-anchor="middle" class="fg-t sm">B</text><text x="280" y="36" text-anchor="middle" class="fg-t sm">C</text>
<line x1="250" y1="44" x2="250" y2="236" class="fg-l"/><line x1="265" y1="44" x2="265" y2="236" class="fg-l"/><line x1="280" y1="44" x2="280" y2="236" class="fg-l"/>
<line x1="250" y1="62" x2="300" y2="62" class="fg-l"/><circle cx="250" cy="62" r="2.8" class="fg-a"/>
<line x1="265" y1="78" x2="300" y2="78" class="fg-l"/><circle cx="265" cy="78" r="2.8" class="fg-a"/>
<line x1="265" y1="127" x2="300" y2="127" class="fg-l"/><circle cx="265" cy="127" r="2.8" class="fg-a"/>
<line x1="280" y1="143" x2="300" y2="143" class="fg-l"/><circle cx="280" cy="143" r="2.8" class="fg-a"/>
<line x1="250" y1="192" x2="300" y2="192" class="fg-l"/><circle cx="250" cy="192" r="2.8" class="fg-a"/>
<line x1="280" y1="208" x2="300" y2="208" class="fg-l"/><circle cx="280" cy="208" r="2.8" class="fg-a"/>
<rect x="300" y="48" width="100" height="44" rx="6" class="fg-b alt"/><text x="350" y="67" text-anchor="middle" class="fg-t">AND</text><text x="350" y="84" text-anchor="middle" class="fg-t sm">A、B</text>
<rect x="300" y="113" width="100" height="44" rx="6" class="fg-b alt"/><text x="350" y="132" text-anchor="middle" class="fg-t">AND</text><text x="350" y="149" text-anchor="middle" class="fg-t sm">B、C</text>
<rect x="300" y="178" width="100" height="44" rx="6" class="fg-b alt"/><text x="350" y="197" text-anchor="middle" class="fg-t">AND</text><text x="350" y="214" text-anchor="middle" class="fg-t sm">A、C</text>
<polyline points="400,70 435,70 435,123 470,123" class="fg-l"/>
<line x1="400" y1="135" x2="470" y2="135" class="fg-l"/>
<polyline points="400,200 435,200 435,147 470,147" class="fg-l"/>
<rect x="470" y="105" width="80" height="60" rx="6" class="fg-b hot"/><text x="510" y="132" text-anchor="middle" class="fg-t acc">OR</text><text x="510" y="150" text-anchor="middle" class="fg-t sm">任一個為 1</text>
<line x1="550" y1="135" x2="592" y2="135" class="fg-l on"/><polygon points="600,135 592,130.5 592,139.5" class="fg-a on"/>
<text x="608" y="140" class="fg-t lg">M</text><text x="608" y="158" class="fg-t sm">多數決</text>
<text x="250" y="254" class="fg-t sm">化簡前：4 個三輸入 AND ＋ 1 個 OR</text>
<text x="250" y="272" class="fg-t sm acc">化簡後：3 個兩輸入 AND ＋ 1 個 OR</text>
</svg><figcaption>左邊是真值表，綠底是輸出 1 的四列。右邊是化簡後的電路：三條直線是 A、B、C 的輸入線，有圓點的地方才是接上去的。</figcaption></figure>
<p>記住這個電路：它就是下一課全加器的「進位」。三個位元相加（兩個數字的同一位，加上前一位的進位），至少兩個是 1，就會進位。</p>
<h4>布林代數：化簡的工具</h4>
<table>
<tr><th>規則</th><th>白話</th></tr>
<tr><td>A AND 1 = A，A OR 0 = A</td><td>跟「永遠成立」的條件 AND，等於沒加</td></tr>
<tr><td>A AND 0 = 0，A OR 1 = 1</td><td>一個永遠不成立的條件，讓整串 AND 都不成立</td></tr>
<tr><td>A OR A = A，A AND A = A</td><td>同一個條件寫兩次，等於寫一次</td></tr>
<tr><td>A AND (NOT A) = 0</td><td>「已登入而且沒登入」永遠不會發生</td></tr>
<tr><td><b>笛摩根定律</b>（De Morgan's laws）：NOT(A AND B) = (NOT A) OR (NOT B)</td><td><code>!(loggedIn &amp;&amp; isOwner)</code> 等於 <code>!loggedIn || !isOwner</code></td></tr>
<tr><td>NOT(A OR B) = (NOT A) AND (NOT B)</td><td><code>!(isAdmin || isOwner)</code> 等於 <code>!isAdmin &amp;&amp; !isOwner</code></td></tr>
</table>
<p>真實的晶片設計，沒有人手算這些。工程師用硬體描述語言寫出規則，交給<b>邏輯合成</b>（logic synthesis）工具自動化簡、挑閘。小題目可以用卡諾圖（Karnaugh map）手算，大題目靠演算法。</p>

<h3><span class="badge lv2">進階</span>三、NAND 為什麼萬用</h3>
<p>上一節證明了：只要有 AND、OR、NOT，什麼都做得出來。所以只要證明 NAND 能做出這三種，NAND 就能做出一切。這個性質叫<b>功能完備</b>（functional completeness）。</p>
<table>
<tr><th>要做</th><th>用 NAND 怎麼接</th><th>NAND 個數</th></tr>
<tr><td>NOT A</td><td>NAND(A, A)：兩個輸入接在一起</td><td>1</td></tr>
<tr><td>A AND B</td><td>NAND(A, B) 後面再接一個當 NOT 用的 NAND</td><td>2</td></tr>
<tr><td>A OR B</td><td>NAND(NOT A, NOT B)，也就是笛摩根定律</td><td>3</td></tr>
<tr><td>A XOR B</td><td>見下圖</td><td>4</td></tr>
</table>
<p>OR 那一列：NAND(NOT A, NOT B) = NOT((NOT A) AND (NOT B)) = A OR B。XOR 比較巧妙：先算 N = NAND(A, B)，再算 NAND(NAND(A, N), NAND(B, N))。代入 A = 1、B = 0 走一次：</p>
<figure class="figure"><svg viewBox="0 0 660 210" class="fg" style="width:100%;max-width:660px" role="img" aria-label="用四個 NAND 做出 XOR：A 等於 1、B 等於 0 時，第 1 個 NAND 輸出 1，第 2 個輸出 0，第 3 個輸出 1，第 4 個輸出 1">
<text x="20" y="56" class="fg-t">A = 1</text><text x="20" y="182" class="fg-t">B = 0</text>
<line x1="66" y1="52" x2="320" y2="52" class="fg-l on"/><text x="88" y="45" class="fg-t sm acc">1</text>
<polyline points="110,52 110,105 160,105" class="fg-l on"/><circle cx="110" cy="52" r="3" class="fg-a on"/>
<line x1="66" y1="178" x2="320" y2="178" class="fg-l"/><text x="88" y="171" class="fg-t sm">0</text>
<polyline points="130,178 130,125 160,125" class="fg-l"/><circle cx="130" cy="178" r="3" class="fg-a"/>
<rect x="160" y="91" width="80" height="48" rx="6" class="fg-b alt"/><text x="200" y="112" text-anchor="middle" class="fg-t">NAND</text><text x="200" y="129" text-anchor="middle" class="fg-t sm">第 1 個</text>
<line x1="240" y1="115" x2="275" y2="115" class="fg-l on"/><text x="246" y="108" class="fg-t sm acc">N=1</text>
<polyline points="320,68 275,68 275,162 320,162" class="fg-l on"/><circle cx="275" cy="115" r="3" class="fg-a on"/>
<rect x="320" y="36" width="80" height="48" rx="6" class="fg-b alt"/><text x="360" y="57" text-anchor="middle" class="fg-t">NAND</text><text x="360" y="74" text-anchor="middle" class="fg-t sm">第 2 個</text>
<rect x="320" y="146" width="80" height="48" rx="6" class="fg-b alt"/><text x="360" y="167" text-anchor="middle" class="fg-t">NAND</text><text x="360" y="184" text-anchor="middle" class="fg-t sm">第 3 個</text>
<polyline points="400,60 435,60 435,105 470,105" class="fg-l"/><text x="410" y="53" class="fg-t sm">0</text>
<polyline points="400,170 435,170 435,125 470,125" class="fg-l on"/><text x="410" y="163" class="fg-t sm acc">1</text>
<rect x="470" y="91" width="80" height="48" rx="6" class="fg-b hot"/><text x="510" y="112" text-anchor="middle" class="fg-t acc">NAND</text><text x="510" y="129" text-anchor="middle" class="fg-t sm">第 4 個</text>
<line x1="550" y1="115" x2="592" y2="115" class="fg-l on"/><polygon points="600,115 592,110.5 592,119.5" class="fg-a on"/>
<text x="606" y="120" class="fg-t lg acc">1</text><text x="606" y="138" class="fg-t sm">A XOR B</text>
</svg><figcaption>綠色的線是 1，黑色的線是 0。第 2 個 NAND 看到兩個 1，輸出 0；第 3 個看到 0 和 1，輸出 1；最後的 NAND 看到 0 和 1，輸出 1。只用一種閘，就拼出了 XOR。</figcaption></figure>
<p>四種輸入都代一遍，你會發現只有 A、B 不一樣的時候，輸出才是 1。NOR 也一樣萬用：阿波羅登月的導航電腦，邏輯電路幾乎全部用三輸入的 NOR 閘拼成，好處是只要大量生產、測試同一種晶片。</p>
<h4>真實世界：不是只有 NAND</h4>
<p>「只用 NAND 就能做一台電腦」是理論上的保證，不是實際的做法。晶圓廠提供的<b>標準元件庫</b>（standard cell library）裡有上百種現成的閘：不同輸入數的 NAND、NOR，各種推力大小的版本，還有把 AND、OR、NOT 合在同一組電晶體裡做完的複合閘，例如 AOI21：NOT((A AND B) OR C)，只要 6 顆電晶體、一層延遲。合成工具會在面積、速度、功耗之間，替每一段邏輯挑最划算的組合。</p>
<p>NAND 這個名字也出現在別的地方：SSD 用的 <b>NAND 快閃記憶體</b>，就是因為它的記憶格一顆接一顆串起來，接法長得像 NAND 閘的串聯下拉網路。</p>

<h3><span class="badge lv2">進階</span>四、傳遞延遲與關鍵路徑</h3>
<p>課文裡的閘都是「瞬間」算好的。真實的閘要時間：輸入變了，輸出得等下一級的閘極電容充放電完（上一課的深入圖解），才會穩定。這段時間叫<b>傳遞延遲</b>（propagation delay）。在先進製程裡，一個簡單的閘大約是幾皮秒到幾十皮秒（ps，一兆分之一秒），看它要推動多少負載、導線有多長。</p>
<p>CPU 裡的邏輯，都夾在兩排暫存器之間（暫存器在第 0.5 課）。時脈一響，起點暫存器送出新的值，訊號穿過一層又一層的閘；下一次時脈響起時，終點暫存器把結果收下。所以每一條路，都得在<b>一拍之內</b>走完：</p>
<figure class="figure"><svg viewBox="0 0 660 276" class="fg" style="width:100%;max-width:660px" role="img" aria-label="起點暫存器和終點暫存器之間有三條路徑：上面兩個閘共 40 皮秒，中間五個閘共 90 皮秒，下面兩個閘共 45 皮秒；中間那條是關鍵路徑">
<text x="50" y="36" text-anchor="middle" class="fg-t sm">起點暫存器</text>
<rect x="20" y="44" width="60" height="182" rx="6" class="fg-b alt"/>
<text x="610" y="36" text-anchor="middle" class="fg-t sm">終點暫存器</text>
<rect x="580" y="44" width="60" height="182" rx="6" class="fg-b alt"/>
<line x1="80" y1="77" x2="152" y2="77" class="fg-l"/>
<rect x="152" y="57" width="60" height="40" rx="5" class="fg-b"/><text x="182" y="75" text-anchor="middle" class="fg-t">AND</text><text x="182" y="90" text-anchor="middle" class="fg-t sm">20 ps</text>
<line x1="212" y1="77" x2="330" y2="77" class="fg-l"/>
<rect x="330" y="57" width="60" height="40" rx="5" class="fg-b"/><text x="360" y="75" text-anchor="middle" class="fg-t">OR</text><text x="360" y="90" text-anchor="middle" class="fg-t sm">20 ps</text>
<line x1="390" y1="77" x2="572" y2="77" class="fg-l"/><polygon points="580,77 572,72.5 572,81.5" class="fg-a"/>
<text x="566" y="69" text-anchor="end" class="fg-t sm">共 40 ps</text>
<line x1="80" y1="137" x2="96" y2="137" class="fg-l warm"/>
<rect x="96" y="117" width="60" height="40" rx="5" class="fg-b warm"/><text x="126" y="135" text-anchor="middle" class="fg-t">NOT</text><text x="126" y="150" text-anchor="middle" class="fg-t sm">10 ps</text>
<line x1="156" y1="137" x2="180" y2="137" class="fg-l warm"/>
<rect x="180" y="117" width="60" height="40" rx="5" class="fg-b warm"/><text x="210" y="135" text-anchor="middle" class="fg-t">NAND</text><text x="210" y="150" text-anchor="middle" class="fg-t sm">15 ps</text>
<line x1="240" y1="137" x2="264" y2="137" class="fg-l warm"/>
<rect x="264" y="117" width="60" height="40" rx="5" class="fg-b warm"/><text x="294" y="135" text-anchor="middle" class="fg-t">XOR</text><text x="294" y="150" text-anchor="middle" class="fg-t sm">30 ps</text>
<line x1="324" y1="137" x2="348" y2="137" class="fg-l warm"/>
<rect x="348" y="117" width="60" height="40" rx="5" class="fg-b warm"/><text x="378" y="135" text-anchor="middle" class="fg-t">NAND</text><text x="378" y="150" text-anchor="middle" class="fg-t sm">15 ps</text>
<line x1="408" y1="137" x2="432" y2="137" class="fg-l warm"/>
<rect x="432" y="117" width="60" height="40" rx="5" class="fg-b warm"/><text x="462" y="135" text-anchor="middle" class="fg-t">OR</text><text x="462" y="150" text-anchor="middle" class="fg-t sm">20 ps</text>
<line x1="492" y1="137" x2="572" y2="137" class="fg-l warm"/><polygon points="580,137 572,132.5 572,141.5" class="fg-a warm"/>
<text x="566" y="129" text-anchor="end" class="fg-t sm warm">共 90 ps</text>
<line x1="80" y1="197" x2="196" y2="197" class="fg-l"/>
<rect x="196" y="177" width="60" height="40" rx="5" class="fg-b"/><text x="226" y="195" text-anchor="middle" class="fg-t">NAND</text><text x="226" y="210" text-anchor="middle" class="fg-t sm">15 ps</text>
<line x1="256" y1="197" x2="372" y2="197" class="fg-l"/>
<rect x="372" y="177" width="60" height="40" rx="5" class="fg-b"/><text x="402" y="195" text-anchor="middle" class="fg-t">XOR</text><text x="402" y="210" text-anchor="middle" class="fg-t sm">30 ps</text>
<line x1="432" y1="197" x2="572" y2="197" class="fg-l"/><polygon points="580,197 572,192.5 572,201.5" class="fg-a"/>
<text x="566" y="189" text-anchor="end" class="fg-t sm">共 45 ps</text>
<text x="330" y="250" text-anchor="middle" class="fg-t sm warm">最慢的那條（90 ps）決定時脈：一拍至少 90 ps，再加上暫存器本身的時間</text>
<text x="330" y="268" text-anchor="middle" class="fg-t sm">其他路徑早就算完了，也只能一起等</text>
</svg><figcaption>延遲的數字是示意。重點是：時脈不是看平均，是看最慢的那一條路。</figcaption></figure>
<p>三條路裡最慢的那條叫<b>關鍵路徑</b>（critical path），它決定了時脈最快能多快。這張圖裡最長的是 90 ps，加上暫存器自己需要的時間（假設 30 ps），一拍至少要 120 ps，時脈最高大約 8.3 GHz。換算回現實：3 GHz 的一拍是 333 ps，扣掉暫存器的開銷，大概只排得下十幾到二十幾層閘。</p>
<h4>讓關鍵路徑變短的三招</h4>
<ol>
<li><b>換更快的閘</b>：把電晶體做大、推力更強，代價是面積和功耗。或是加電壓，代價是熱（上一課的功耗公式）。</li>
<li><b>減少層數</b>：同樣的邏輯換一種接法，讓訊號少經過幾層。下一課的前瞻進位加法器，就是多用很多閘，換來少很多層。<b>決定速度的是層數，不是閘的個數。</b></li>
<li><b>在中間切一刀</b>：在關鍵路徑中間加一排暫存器，一條長路變成兩條短路，時脈就能加快。代價是一件事要多花一拍才做完。這就是第 0.6 課講的<b>管線</b>（pipeline）。</li>
</ol>
<h4>工具怎麼保證每一條路都來得及</h4>
<p>一顆處理器有數以億計的路徑，不可能用模擬一條一條試。晶片設計用<b>靜態時序分析</b>（static timing analysis）：把每一條路的延遲加總，跟時脈週期比，算出還剩多少餘裕（slack），而且要在最慢的情況（低電壓、高溫）和最快的情況下都檢查過。<b>超頻</b>失敗的原理就在這裡：時脈調得太快，某條路在某個溫度下來不及，暫存器收到算到一半的值，程式就會算錯或當機。</p>

<h3><span class="badge lv2">進階</span>五、突波：為什麼一定要等時脈</h3>
<p>路徑有快有慢，還會造成另一個問題：輸出在穩定之前，可能先閃一下錯誤的值。最經典的例子是 Y = A AND (NOT A)。照邏輯它永遠是 0，可是：</p>
<figure class="figure"><svg viewBox="0 0 620 226" class="fg" style="width:100%;max-width:620px" role="img" aria-label="時序圖：A 從 0 變 1，NOT A 晚了一個閘的延遲才變 0，這段時間 Y 等於 A AND NOT A 短暫變成 1，形成突波；時脈取樣在之後，Y 已經穩定是 0">
<line x1="260" y1="24" x2="260" y2="196" class="fg-l dim dash"/><line x1="300" y1="24" x2="300" y2="196" class="fg-l dim dash"/>
<line x1="520" y1="24" x2="520" y2="196" class="fg-l dash"/><text x="520" y="16" text-anchor="middle" class="fg-t sm acc">時脈在這裡取值</text>
<text x="20" y="50" class="fg-t">A</text>
<polyline points="140,60 260,60 260,30 600,30" class="fg-l alt"/>
<text x="20" y="110" class="fg-t">NOT A</text>
<polyline points="140,90 300,90 300,120 600,120" class="fg-l alt"/>
<text x="20" y="166" class="fg-t">Y</text><text x="20" y="184" class="fg-t sm">A AND (NOT A)</text>
<polyline points="140,180 260,180 260,150 300,150 300,180 600,180" class="fg-l warm"/>
<text x="280" y="143" text-anchor="middle" class="fg-t sm warm">突波</text>
<text x="330" y="172" class="fg-t sm">照邏輯應該永遠是 0</text>
<line x1="268" y1="206" x2="292" y2="206" class="fg-l"/><polygon points="260,206 268,201.5 268,210.5" class="fg-a"/><polygon points="300,206 292,201.5 292,210.5" class="fg-a"/>
<text x="280" y="222" text-anchor="middle" class="fg-t sm">NOT 閘的延遲</text>
</svg><figcaption>A 一變，直接接過來的那條路馬上到；經過 NOT 的那條路晚到一點。兩者重疊的那一小段，Y 閃出一個錯誤的 1。等到時脈取值時，Y 早就穩定了。</figcaption></figure>
<p>A 從 0 變 1 的瞬間，直接接過來的 A 已經是 1，經過 NOT 的那條路卻還沒反應過來，仍然是 1。在 NOT 閘延遲的那一小段時間裡，AND 看到兩個 1，輸出閃出一個不該有的 1。這叫<b>突波</b>（glitch）。</p>
<p>這就是第 0.5 課說「所有暫存器都在同一拍收值」的真正原因：只要等到時脈那一刻才去讀，前面怎麼閃都不要緊。這種設計叫<b>同步電路</b>（synchronous circuit），幾乎所有 CPU 都是。突波還是有代價：每閃一次就是一次充放電，白白耗電。</p>
<p>反過來說，凡是<b>沒有經過時脈、直接拿來用</b>的訊號，就要小心突波。例如兩個不同時脈的電路之間傳訊號（跨時脈域，clock domain crossing），必須特別處理，否則會出現極少發生、極難重現的錯誤。軟體裡的競態條件（race condition），是同一種病出現在另一層的樣子：結果取決於誰先到。</p>

<h3><span class="badge lv3">專業</span>六、積木：多工器與解碼器</h3>
<h4>多工器：硬體的「三元運算子」</h4>
<p><b>多工器</b>（multiplexer，簡稱 MUX）從幾個輸入裡挑一個送到輸出，由選擇線 S 決定挑誰。兩選一的版本，公式是 out = (NOT S AND A) OR (S AND B)：</p>
<figure class="figure"><svg viewBox="0 0 640 232" class="fg" style="width:100%;max-width:640px" role="img" aria-label="兩選一多工器的內部：S 等於 1 時，NOT S 是 0，上面的 AND 關掉；下面的 AND 讓 B 通過，經過 OR 送到輸出">
<text x="480" y="30" class="fg-t sm mono">out = S ? B : A</text>
<text x="20" y="59" class="fg-t">A = 0</text><text x="20" y="119" class="fg-t">S = 1</text><text x="20" y="179" class="fg-t">B = 1</text>
<line x1="64" y1="55" x2="240" y2="55" class="fg-l"/>
<line x1="64" y1="115" x2="120" y2="115" class="fg-l on"/><circle cx="120" cy="115" r="3" class="fg-a on"/>
<polyline points="120,115 120,75 140,75" class="fg-l on"/>
<polyline points="120,115 120,155 240,155" class="fg-l on"/>
<rect x="140" y="62" width="60" height="26" rx="5" class="fg-b"/><text x="170" y="79" text-anchor="middle" class="fg-t">NOT</text>
<line x1="200" y1="75" x2="240" y2="75" class="fg-l"/><text x="216" y="70" class="fg-t sm">0</text>
<line x1="64" y1="175" x2="240" y2="175" class="fg-l on"/>
<rect x="240" y="40" width="80" height="50" rx="6" class="fg-b"/><text x="280" y="69" text-anchor="middle" class="fg-t">AND</text>
<rect x="240" y="140" width="80" height="50" rx="6" class="fg-b hot"/><text x="280" y="169" text-anchor="middle" class="fg-t acc">AND</text>
<polyline points="320,65 360,65 360,105 400,105" class="fg-l"/><text x="334" y="58" class="fg-t sm">0</text>
<polyline points="320,165 360,165 360,125 400,125" class="fg-l on"/><text x="334" y="158" class="fg-t sm acc">1</text>
<rect x="400" y="90" width="70" height="50" rx="6" class="fg-b hot"/><text x="435" y="119" text-anchor="middle" class="fg-t acc">OR</text>
<line x1="470" y1="115" x2="552" y2="115" class="fg-l on"/><polygon points="560,115 552,110.5 552,119.5" class="fg-a on"/>
<text x="566" y="119" class="fg-t acc">輸出 1</text>
<text x="320" y="220" text-anchor="middle" class="fg-t sm">S = 1：下面的 AND 打開、上面的關掉，輸出就跟著 B</text>
</svg><figcaption>選擇線同時接到兩個 AND：一個直接接，一個先反過來。所以任何時候只有一個 AND 會讓資料通過。</figcaption></figure>
<p>S 就像一個切換開關，打開其中一個 AND、關掉另一個。要從 4 個裡挑一個，就要 2 條選擇線；從 2<sup>n</sup> 個裡挑，就要 n 條。多工器在 CPU 裡到處都是：</p>
<ul>
<li><b>ALU 的出口</b>：加法器、AND、OR、比較電路同時都在算，最後由操作碼控制一個多工器，挑出這道指令要的那個結果。</li>
<li><b>讀暫存器</b>：指令說「讀第 5 號暫存器」，就是拿 5 當選擇線，從幾十個暫存器裡挑一個。</li>
<li><b>管線的抄近路</b>（forwarding，第 0.6 課）：要用暫存器裡的舊值，還是 ALU 剛算出來的新值？由一個多工器決定。</li>
</ul>
<p>它也回到你的程式裡：<code>x = cond ? a : b</code> 這種簡單的選擇，編譯器常常編成「條件選擇」指令（ARM64 的 <code>CSEL</code>、x86 的 <code>CMOV</code>）：兩個值都準備好，用 ALU 裡的多工器直接挑一個。不用跳躍，也就不怕分支預測猜錯。</p>
<h4>解碼器：n 條線變成 2<sup>n</sup> 條，只亮一條</h4>
<p><b>解碼器</b>（decoder）把一個 n 位元的數字，變成 2<sup>n</sup> 條輸出線，其中剛好只有一條是 1，這叫 one-hot。做法很直接：每條輸出線是一個 AND，各自認一種輸入組合。</p>
<figure class="figure"><svg viewBox="0 0 620 256" class="fg" style="width:100%;max-width:620px" role="img" aria-label="2 對 4 解碼器：輸入 S1 S0 等於 10，四條直線是 S1、NOT S1、S0、NOT S0；只有認 10 的那個 AND 兩個輸入都是 1，輸出 2 亮起">
<text x="20" y="124" class="fg-t">輸入</text><text x="20" y="144" class="fg-t mono">S1 S0 = 10</text><text x="20" y="162" class="fg-t sm">也就是 2</text>
<text x="150" y="24" text-anchor="middle" class="fg-t sm">S1</text><text x="200" y="24" text-anchor="middle" class="fg-t sm">NOT S1</text><text x="250" y="24" text-anchor="middle" class="fg-t sm">S0</text><text x="300" y="24" text-anchor="middle" class="fg-t sm">NOT S0</text>
<text x="150" y="42" text-anchor="middle" class="fg-t acc">1</text><text x="200" y="42" text-anchor="middle" class="fg-t">0</text><text x="250" y="42" text-anchor="middle" class="fg-t">0</text><text x="300" y="42" text-anchor="middle" class="fg-t acc">1</text>
<line x1="150" y1="50" x2="150" y2="246" class="fg-l on"/><line x1="200" y1="50" x2="200" y2="246" class="fg-l"/><line x1="250" y1="50" x2="250" y2="246" class="fg-l"/><line x1="300" y1="50" x2="300" y2="246" class="fg-l on"/>
<line x1="200" y1="67" x2="360" y2="67" class="fg-l"/><circle cx="200" cy="67" r="3" class="fg-a"/>
<line x1="300" y1="83" x2="360" y2="83" class="fg-l on"/><circle cx="300" cy="83" r="3" class="fg-a on"/>
<line x1="200" y1="117" x2="360" y2="117" class="fg-l"/><circle cx="200" cy="117" r="3" class="fg-a"/>
<line x1="250" y1="133" x2="360" y2="133" class="fg-l"/><circle cx="250" cy="133" r="3" class="fg-a"/>
<line x1="150" y1="167" x2="360" y2="167" class="fg-l on"/><circle cx="150" cy="167" r="3" class="fg-a on"/>
<line x1="300" y1="183" x2="360" y2="183" class="fg-l on"/><circle cx="300" cy="183" r="3" class="fg-a on"/>
<line x1="150" y1="217" x2="360" y2="217" class="fg-l on"/><circle cx="150" cy="217" r="3" class="fg-a on"/>
<line x1="250" y1="233" x2="360" y2="233" class="fg-l"/><circle cx="250" cy="233" r="3" class="fg-a"/>
<rect x="360" y="55" width="90" height="40" rx="6" class="fg-b"/><text x="405" y="79" text-anchor="middle" class="fg-t">AND（00）</text>
<rect x="360" y="105" width="90" height="40" rx="6" class="fg-b"/><text x="405" y="129" text-anchor="middle" class="fg-t">AND（01）</text>
<rect x="360" y="155" width="90" height="40" rx="6" class="fg-b hot"/><text x="405" y="179" text-anchor="middle" class="fg-t acc">AND（10）</text>
<rect x="360" y="205" width="90" height="40" rx="6" class="fg-b"/><text x="405" y="229" text-anchor="middle" class="fg-t">AND（11）</text>
<line x1="450" y1="75" x2="522" y2="75" class="fg-l"/><circle cx="532" cy="75" r="8" class="fg-lamp"/><text x="548" y="79" class="fg-t">輸出 0</text>
<line x1="450" y1="125" x2="522" y2="125" class="fg-l"/><circle cx="532" cy="125" r="8" class="fg-lamp"/><text x="548" y="129" class="fg-t">輸出 1</text>
<line x1="450" y1="175" x2="522" y2="175" class="fg-l on"/><circle cx="532" cy="175" r="8" class="fg-lamp on"/><text x="548" y="179" class="fg-t acc">輸出 2</text>
<line x1="450" y1="225" x2="522" y2="225" class="fg-l"/><circle cx="532" cy="225" r="8" class="fg-lamp"/><text x="548" y="229" class="fg-t">輸出 3</text>
</svg><figcaption>四條直線是 S1、S1 反過來、S0、S0 反過來，有圓點的地方才接進 AND。每個 AND 認一種組合，所以輸入 10 只會讓「輸出 2」亮起來。</figcaption></figure>
<p>你其實已經見過它兩次：</p>
<ul>
<li><b>指令解碼</b>：第 0.6 課的深入圖解說，操作碼的四個位元接到一排 AND 閘，「0001」只會讓其中一個閘輸出 1。那就是一個 4 對 16 的解碼器，每一條輸出線去打開一種指令的電路。</li>
<li><b>記憶體定址</b>：第 0.5 課的記憶體收到一個位址，解碼器就讓那一列（只有那一列）接上資料線。</li>
</ul>
<p>反過來的叫<b>編碼器</b>（encoder）：好幾條線裡哪一條是 1，就輸出它的編號。如果同時有好幾條是 1，就要用<b>優先編碼器</b>（priority encoder）挑最重要的那一個，例如好幾個硬體同時發出中斷時，決定先處理誰。</p>

<h3><span class="badge lv4">專家</span>七、閘的盡頭：FPGA、硬體描述語言，和軟體裡的閘</h3>
<h4>FPGA：把真值表直接存起來</h4>
<p>第二節說，任何真值表都能變成電路。<b>FPGA</b>（field-programmable gate array）把這句話做到最徹底：它的基本單元是<b>查找表</b>（lookup table，LUT），也就是一小塊記憶體加一個多工器。6 輸入的 LUT 有 64 個位元的記憶體，存的就是那張 64 列的真值表；6 個輸入當作選擇線，挑出對應的那一格。換掉記憶體的內容，同一塊硬體就變成另一個電路。一顆 FPGA 有幾千到幾百萬個 LUT，加上可以重新接線的連線網路，通電後載入設定檔，就變成你要的電路。</p>
<p>FPGA 用在晶片量產前的驗證、網路設備、講究低延遲的金融交易，雲端也租得到（例如 AWS 的 F 系列機型）。</p>
<h4>硬體描述語言：寫程式，生出電路</h4>
<p>工程師用 <b>Verilog</b>、<b>VHDL</b> 這類硬體描述語言（HDL）描述電路，合成工具把它變成閘，就像編譯器把程式碼變成機器碼。剛才的兩選一多工器，寫起來是：</p>
<pre><code>module mux2(input a, input b, input s, output y);
  assign y = s ? b : a;
endmodule</code></pre>
<p>看起來像程式，意義卻完全不同：這不是「執行到這一行時做選擇」，而是「永遠存在一個這樣接線的電路」。檔案裡的每一行，都同時、一直在運作。</p>
<h4>軟體裡的閘，和兩個陷阱</h4>
<p>課文說程式裡的 <code>&amp;&amp;</code>、<code>||</code>、<code>!</code> 就是 AND、OR、NOT。邏輯上是，執行方式卻差很多：</p>
<ul>
<li><b><code>&amp;&amp;</code> 不是閘，是一個跳躍</b>：<code>a &amp;&amp; b()</code> 在 a 為假時根本不會呼叫 <code>b()</code>，這叫短路求值（short-circuit evaluation）。硬體的閘永遠兩邊都算。所以 <code>user &amp;&amp; user.name</code> 才不會在 user 是 null 時出錯；但這也代表每個 <code>&amp;&amp;</code> 都可能變成一次分支預測。</li>
<li><b>比較祕密值不能提早結束</b>：一般的字串比較，遇到第一個不同的位元組就回傳 false。攻擊者量回應時間，就能知道前面猜對了幾個位元組，一個一個試出整串簽章。正確做法是全部比完，用 XOR 累積差異：<code>diff |= a[i] ^ b[i]</code>，最後看 diff 是不是 0。Node.js 有 <code>crypto.timingSafeEqual</code>，Go 有 <code>subtle.ConstantTimeCompare</code>，驗證 webhook 簽章、API 金鑰時要用它們。</li>
</ul>
<h4>XOR 的兩個神奇性質</h4>
<p>x XOR x = 0，x XOR 0 = x。由此推出：A XOR B XOR B = A。這兩條性質撐起了兩樣你天天在用的東西：</p>
<ul>
<li><b>RAID 5 的同位元</b>（parity）：三顆資料硬碟 D1 = 1010、D2 = 0110、D3 = 0011，同位元 P = D1 XOR D2 XOR D3 = 1111。D2 壞了，把剩下的全部 XOR 起來：1111 XOR 1010 XOR 0011 = 0110，D2 就回來了。</li>
<li><b>串流加密</b>：ChaCha20、AES 的 CTR 和 GCM 模式，都是先產生一串看起來隨機的金鑰流（keystream），跟明文 XOR 得到密文；解密時再 XOR 一次就還原。也因此，同一組金鑰和 nonce 絕對不能重複使用：兩份密文 XOR 起來，金鑰流互相抵消，剩下兩份明文的 XOR，攻擊者就有機會拆出內容。</li>
</ul>

<h3>八、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>AND 是最基本、最便宜的閘</td><td>在 CMOS 裡，NAND、NOR、NOT 才是天生的；AND 是 NAND 再接一個 NOT，要 6 顆電晶體。</td></tr>
<tr><td>實際的晶片全部用 NAND 做</td><td>NAND 萬用是理論上的保證。實際上標準元件庫有上百種閘，由合成工具挑最划算的。</td></tr>
<tr><td>閘的輸出是瞬間算好的</td><td>每個閘都有延遲，最慢的那條路決定了時脈。</td></tr>
<tr><td>閘用得越少，電路越快</td><td>速度看層數，不看個數。快的加法器反而用了更多閘。</td></tr>
<tr><td>程式裡的 &amp;&amp; 就是 AND 閘</td><td>&amp;&amp; 會短路，本質是一個跳躍；硬體的閘兩邊永遠都算。</td></tr>
<tr><td>比較字串用 === 就夠安全</td><td>比較祕密值要用固定時間的比較，否則回應時間會洩漏內容。</td></tr>
</table>

<h3>九、跟你的工作連起來</h3>
<ul>
<li><b>前端（Vue、TypeScript）</b>：權限、顯示條件寫成一長串 <code>&amp;&amp;</code> 和 <code>||</code> 時，用笛摩根定律把「什麼時候顯示」改寫成「什麼時候不顯示」，常常就清楚很多；<code>v-if</code> 裡太長的條件，抽成有名字的 computed。功能開關、權限也常用<b>位元旗標</b>（bit flags）：<code>const CAN_EDIT = 1 &lt;&lt; 1</code>，檢查用 <code>(perms &amp; CAN_EDIT) !== 0</code>，一個整數就裝得下 32 個開關。</li>
<li><b>遊戲（Cocos、Unity）</b>：碰撞分組和射線檢測都用位元遮罩。Unity 的 <code>LayerMask</code>，只想打到第 8 層就傳 <code>1 &lt;&lt; 8</code>；Cocos 的物理系統也是用群組（group）和遮罩（mask）決定誰跟誰碰撞，一個位元代表一組。多人連線的封包，常把好幾個布林值塞進同一個位元組，省頻寬。</li>
<li><b>後端（Node.js、Go）</b>：驗證 webhook、JWT 的簽章，一律用 <code>timingSafeEqual</code> 或 <code>ConstantTimeCompare</code>。Redis 的 <code>SETBIT</code>、<code>BITCOUNT</code> 可以用一個位元記一個使用者，一億個使用者「今天有沒有登入」只要大約 12 MB。</li>
<li><b>維運（Linux、Docker）</b>：<code>umask</code> 就是位元運算：新檔案的權限 = 666 AND (NOT umask)。umask 是 022 時，666 &amp; ~022 = 644，所以新檔案是 <code>rw-r--r--</code>。RAID 5 的同位元，則是上一節的 XOR。</li>
</ul>

<h3>十、面試會怎麼問</h3>
<p>先自己講一遍，最好出聲講，再打開參考答案。</p>
<ol>
<li>「為什麼說 NAND 是萬用閘？用 NAND 做出 NOT、AND、OR。」</li>
<li>「什麼是關鍵路徑？想讓電路跑更高的時脈，有哪些做法？各有什麼代價？」</li>
<li>「多工器是什麼？CPU 裡哪些地方會用到？」</li>
<li>「<code>&amp;&amp;</code> 和 <code>&amp;</code> 有什麼不同？什麼時候這個差別很重要？」</li>
<li>「為什麼比較 HMAC 簽章要用 constant-time compare？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>任何真值表都能用積之和寫成 AND、OR、NOT 的組合，所以只要一種閘能做出這三種，它就能做出任何邏輯。NOT A 是 NAND(A, A)；A AND B 是 NAND(A, B) 再接一個 NOT；A OR B 是 NAND(NOT A, NOT B)，由笛摩根定律而來。NOR 也一樣萬用。實務上 CMOS 的 NAND 很便宜（4 顆電晶體、串聯放在 nMOS 那邊），但真實晶片會用整套標準元件庫，不會只用 NAND。</li>
<li>關鍵路徑是兩排暫存器之間延遲最長的那條組合邏輯路徑，加上暫存器本身的時間，就是最短的時脈週期。做法有：用更強的閘或提高電壓（代價是面積、功耗、熱）；重新設計邏輯減少層數，例如用前瞻進位取代漣波進位（代價是更多閘）；在中間插入暫存器做管線化（代價是延遲多一拍、多了暫存器，還可能出現資料相依的等待）。</li>
<li>多工器依選擇線，從多個輸入挑一個送出，兩選一的公式是 (NOT S AND A) OR (S AND B)，n 條選擇線可以從 2<sup>n</sup> 個輸入裡挑。CPU 裡用在 ALU 從各種運算結果中挑出這道指令要的、從暫存器堆讀出指定的暫存器、管線的 forwarding 選擇新值或舊值，以及條件選擇指令如 CSEL、CMOV。</li>
<li><code>&amp;&amp;</code> 是邏輯 AND，會短路：左邊為假就不算右邊，結果是布林值，底層通常是一個條件跳躍。<code>&amp;</code> 是位元 AND，兩邊都會算，對每個位元做 AND。差別重要的時候：右邊有副作用或可能出錯（例如 <code>obj &amp;&amp; obj.x</code>）；對旗標做遮罩時必須用 <code>&amp;</code>；在效能熱點裡，難預測的 <code>&amp;&amp;</code> 會造成分支預測失敗。</li>
<li>一般的比較在第一個不同的位元組就結束，所以比較時間會透露「前面猜對了幾個位元組」。攻擊者對驗證端點大量送出請求、量時間，就能逐位元組猜出正確的簽章。固定時間的比較會走完全部位元組、用 XOR 累積差異，時間不隨內容改變。Node.js 用 crypto.timingSafeEqual，Go 用 crypto/subtle 的 ConstantTimeCompare。</li>
</ol>
</details>

<h3>十一、練功題（做得出來才算真的懂）</h3>
<ol>
<li>寫出「三個輸入裡剛好一個是 1」的真值表，再用積之和寫成閘的式子。</li>
<li>只用 NAND 做出 OR，寫出接法，並把四種輸入都代進去驗證。</li>
<li>一條關鍵路徑有 12 層閘，每層 18 ps，暫存器的開銷是 40 ps。最高時脈是多少？如果在正中間切一刀，變成兩段管線，最高時脈變成多少？代價是什麼？</li>
<li>用三個兩選一多工器，做出一個四選一多工器。選擇線 S1、S0 要怎麼接？</li>
<li>伺服器上 umask 是 027。新建的檔案和資料夾，權限分別是多少？（檔案從 666、資料夾從 777 開始算。）</li>
<li>用笛摩根定律改寫 <code>!(isAdmin || (isOwner &amp;&amp; !isLocked))</code>，讓最外層沒有 <code>!</code>。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>輸出 1 的列是 001、010、100。式子是 A'B'C + A'BC' + AB'C'，也就是三個三輸入的 AND（輸入先依需要接 NOT），再接一個 OR。</li>
<li>A OR B = NAND(NAND(A, A), NAND(B, B))，共 3 個 NAND。驗證：A = 0、B = 0 時是 NAND(1, 1) = 0；0、1 時是 NAND(1, 0) = 1；1、0 時是 NAND(0, 1) = 1；1、1 時是 NAND(0, 0) = 1。</li>
<li>12 × 18 + 40 = 256 ps，最高大約 3.9 GHz。切成兩段後，每段 6 × 18 + 40 = 148 ps，最高大約 6.8 GHz。代價：每件事要走兩拍，總延遲從 256 ps 變成 296 ps；多一排暫存器的面積和功耗；下一件事如果要用這一件的結果，可能得等。</li>
<li>第一層兩個多工器都用 S0 當選擇線：一個從輸入 0、1 挑，一個從輸入 2、3 挑。第二層用 S1 當選擇線，從這兩個結果裡挑一個。</li>
<li>檔案：666 AND (NOT 027) = 640，也就是 <code>rw-r-----</code>。資料夾：777 AND (NOT 027) = 750，也就是 <code>rwxr-x---</code>。其他人完全沒有權限。</li>
<li>先拆外層：<code>!isAdmin &amp;&amp; !(isOwner &amp;&amp; !isLocked)</code>，再拆裡面：<code>!isAdmin &amp;&amp; (!isOwner || isLocked)</code>。白話是：不是管理員，而且（不是擁有者，或已經鎖住）。</li>
</ol>
</details>

<h3>十二、想再挖深</h3>
<ul>
<li><b>Nand2Tetris</b>（<a href="https://www.nand2tetris.org/">nand2tetris.org</a>）：第 1 個專案就是只給你 NAND，要你親手做出 NOT、AND、OR、XOR、多工器，第 2 個專案做出 ALU。這一章的每一個積木，你都會自己接一次。</li>
<li><b>David Harris 與 Sarah Harris《Digital Design and Computer Architecture》</b>：數位設計的入門教科書，布林代數、卡諾圖、時序、多工器和解碼器都有，後半本會用這些積木做出一顆處理器。</li>
<li><b>Logisim-evolution</b>：免費、開源的數位邏輯模擬器，可以拖拉閘來接電路、即時看訊號。把這一章的圖全部自己接一遍，是最有效的練習。</li>
<li><b>Ben Eater 的 8-bit 電腦</b>（YouTube）：用麵包板和真的邏輯晶片，看閘在現實中怎麼接、訊號怎麼在示波器上跑。</li>
</ul>
` });
