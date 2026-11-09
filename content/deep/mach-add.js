DEEP({ 'mach-add': `
<p>課文用兩個閘加了一個位元，再把全加器一位一位串起來。這一章把加法器整台拆開：全加器的五個閘怎麼接；64 位元的進位為什麼不能一位一位等，真實的 CPU 怎麼「預先算好」進位；同一個加法器怎麼順便做減法、比大小；兩個長得很像、意思完全不同的旗標：進位和溢位；最後是乘法、除法和浮點數的加法。你寫的每一個 <code>+</code>、<code>&lt;</code>、<code>*</code>，都能在這一章找到它的電路。</p>

<h3><span class="badge lv1">基礎</span>一、全加器：兩個半加器，加一個 OR</h3>
<p>半加器只會加兩個位元。可是直式加法的每一欄，其實要加<b>三個</b>東西：這一欄的 A、這一欄的 B，還有右邊那一欄傳過來的進位（carry in，簡寫 Cin）。能加三個位元的電路叫<b>全加器</b>（full adder），做法是把加法拆成兩次：</p>
<ol>
<li>第一個半加器先加 A 和 B，得到暫時的和 s1 = A XOR B，和進位 c1 = A AND B。</li>
<li>第二個半加器再把 s1 和 Cin 加起來，得到最後的和 S = s1 XOR Cin，和另一個進位 c2 = s1 AND Cin。</li>
<li>兩次只要有一次進位，就要往左進位：Cout = c1 OR c2。</li>
</ol>
<p>兩個 XOR、兩個 AND、一個 OR，正好是課文說的五個閘。代入 A = 1、B = 0、Cin = 1 走一次：</p>
<figure class="figure"><svg viewBox="0 0 680 240" class="fg" style="width:100%;max-width:680px" role="img" aria-label="全加器由兩個半加器和一個 OR 組成：A 等於 1、B 等於 0 進第一個半加器，得到 s1 等於 1、c1 等於 0；s1 和 Cin 等於 1 進第二個半加器，得到和 0、c2 等於 1；OR 輸出進位 1">
<text x="20" y="64" class="fg-t">Cin = 1</text>
<line x1="76" y1="60" x2="330" y2="60" class="fg-l on"/>
<text x="20" y="154" class="fg-t">A = 1</text>
<line x1="76" y1="150" x2="120" y2="150" class="fg-l on"/>
<text x="20" y="194" class="fg-t">B = 0</text>
<line x1="76" y1="190" x2="120" y2="190" class="fg-l"/>
<rect x="120" y="130" width="120" height="80" rx="6" class="fg-b alt"/><text x="180" y="166" text-anchor="middle" class="fg-t">半加器 1</text><text x="180" y="184" text-anchor="middle" class="fg-t sm">XOR 和 AND</text>
<polyline points="240,150 290,150 290,100 330,100" class="fg-l on"/><text x="246" y="142" class="fg-t sm acc">s1 = 1</text>
<line x1="240" y1="190" x2="520" y2="190" class="fg-l"/><text x="300" y="183" class="fg-t sm">c1 = 0</text>
<rect x="330" y="40" width="120" height="80" rx="6" class="fg-b alt"/><text x="390" y="76" text-anchor="middle" class="fg-t">半加器 2</text><text x="390" y="94" text-anchor="middle" class="fg-t sm">XOR 和 AND</text>
<line x1="450" y1="60" x2="652" y2="60" class="fg-l"/><polygon points="660,60 652,55.5 652,64.5" class="fg-a"/>
<text x="600" y="50" text-anchor="middle" class="fg-t warm">和 S = 0</text>
<polyline points="450,100 490,100 490,160 520,160" class="fg-l on"/><text x="456" y="92" class="fg-t sm acc">c2 = 1</text>
<rect x="520" y="140" width="70" height="70" rx="6" class="fg-b hot"/><text x="555" y="180" text-anchor="middle" class="fg-t acc">OR</text>
<line x1="590" y1="175" x2="652" y2="175" class="fg-l on"/><polygon points="660,175 652,170.5 652,179.5" class="fg-a on"/>
<text x="622" y="166" text-anchor="middle" class="fg-t sm acc">進位 = 1</text>
<text x="340" y="232" text-anchor="middle" class="fg-t sm">1 + 0 + 1 = 2，二進位寫成 10：和是 0，進位是 1</text>
</svg><figcaption>綠色的線是 1。第一個半加器只看 A、B；第二個把暫時的和跟右邊來的進位再加一次；兩個進位只要有一個是 1，就往左進位。</figcaption></figure>
<p>c1 和 c2 不可能同時是 1：c1 是 1，代表 A、B 都是 1，那 s1 = 1 XOR 1 = 0，c2 就一定是 0。所以最後那個 OR 換成 XOR 也一樣對。整理成真值表，你會認出兩個老朋友：</p>
<table>
<tr><th>A</th><th>B</th><th>Cin</th><th>和 S</th><th>進位 Cout</th></tr>
<tr><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td></tr>
<tr><td>0</td><td>0</td><td>1</td><td>1</td><td>0</td></tr>
<tr><td>0</td><td>1</td><td>0</td><td>1</td><td>0</td></tr>
<tr><td>0</td><td>1</td><td>1</td><td>0</td><td>1</td></tr>
<tr><td>1</td><td>0</td><td>0</td><td>1</td><td>0</td></tr>
<tr><td>1</td><td>0</td><td>1</td><td>0</td><td>1</td></tr>
<tr><td>1</td><td>1</td><td>0</td><td>0</td><td>1</td></tr>
<tr><td>1</td><td>1</td><td>1</td><td>1</td><td>1</td></tr>
</table>
<p>S 是「三個裡有奇數個 1」，叫<b>奇偶</b>（parity）；Cout 是「三個裡至少兩個 1」，就是上一課深入圖解的<b>多數決</b>，AB + BC + AC。</p>

<h3><span class="badge lv2">進階</span>二、漣波進位：一排排隊傳話的全加器</h3>
<p>把全加器一個接一個串起來，右邊那個的 Cout 接到左邊那個的 Cin，最右邊的 Cin 接 0，就是<b>漣波進位加法器</b>（ripple-carry adder）。用 4 位元算 7 + 5，也就是 0111 + 0101：</p>
<figure class="figure"><svg viewBox="0 0 660 230" class="fg" style="width:100%;max-width:660px" role="img" aria-label="四個全加器由右往左串成 4 位元加法器，計算 0111 加 0101：進位 C1、C2、C3 都是 1，一路往左傳，結果是 1100">
<text x="90" y="40" text-anchor="middle" class="fg-t sm">A=0</text><text x="130" y="40" text-anchor="middle" class="fg-t sm">B=0</text>
<text x="230" y="40" text-anchor="middle" class="fg-t sm acc">A=1</text><text x="270" y="40" text-anchor="middle" class="fg-t sm acc">B=1</text>
<text x="370" y="40" text-anchor="middle" class="fg-t sm acc">A=1</text><text x="410" y="40" text-anchor="middle" class="fg-t sm">B=0</text>
<text x="510" y="40" text-anchor="middle" class="fg-t sm acc">A=1</text><text x="550" y="40" text-anchor="middle" class="fg-t sm acc">B=1</text>
<line x1="90" y1="46" x2="90" y2="72" class="fg-l"/><polygon points="90,80 85.5,72 94.5,72" class="fg-a"/>
<line x1="130" y1="46" x2="130" y2="72" class="fg-l"/><polygon points="130,80 125.5,72 134.5,72" class="fg-a"/>
<line x1="230" y1="46" x2="230" y2="72" class="fg-l on"/><polygon points="230,80 225.5,72 234.5,72" class="fg-a on"/>
<line x1="270" y1="46" x2="270" y2="72" class="fg-l on"/><polygon points="270,80 265.5,72 274.5,72" class="fg-a on"/>
<line x1="370" y1="46" x2="370" y2="72" class="fg-l on"/><polygon points="370,80 365.5,72 374.5,72" class="fg-a on"/>
<line x1="410" y1="46" x2="410" y2="72" class="fg-l"/><polygon points="410,80 405.5,72 414.5,72" class="fg-a"/>
<line x1="510" y1="46" x2="510" y2="72" class="fg-l on"/><polygon points="510,80 505.5,72 514.5,72" class="fg-a on"/>
<line x1="550" y1="46" x2="550" y2="72" class="fg-l on"/><polygon points="550,80 545.5,72 554.5,72" class="fg-a on"/>
<rect x="60" y="80" width="100" height="60" rx="6" class="fg-b alt"/><text x="110" y="106" text-anchor="middle" class="fg-t">全加器</text><text x="110" y="124" text-anchor="middle" class="fg-t sm">第 3 位</text>
<rect x="200" y="80" width="100" height="60" rx="6" class="fg-b alt"/><text x="250" y="106" text-anchor="middle" class="fg-t">全加器</text><text x="250" y="124" text-anchor="middle" class="fg-t sm">第 2 位</text>
<rect x="340" y="80" width="100" height="60" rx="6" class="fg-b alt"/><text x="390" y="106" text-anchor="middle" class="fg-t">全加器</text><text x="390" y="124" text-anchor="middle" class="fg-t sm">第 1 位</text>
<rect x="480" y="80" width="100" height="60" rx="6" class="fg-b alt"/><text x="530" y="106" text-anchor="middle" class="fg-t">全加器</text><text x="530" y="124" text-anchor="middle" class="fg-t sm">第 0 位</text>
<line x1="620" y1="110" x2="588" y2="110" class="fg-l"/><polygon points="580,110 588,105.5 588,114.5" class="fg-a"/><text x="604" y="102" text-anchor="middle" class="fg-t sm">C0=0</text>
<line x1="480" y1="110" x2="448" y2="110" class="fg-l on"/><polygon points="440,110 448,105.5 448,114.5" class="fg-a on"/><text x="460" y="102" text-anchor="middle" class="fg-t sm acc">C1=1</text>
<line x1="340" y1="110" x2="308" y2="110" class="fg-l on"/><polygon points="300,110 308,105.5 308,114.5" class="fg-a on"/><text x="320" y="102" text-anchor="middle" class="fg-t sm acc">C2=1</text>
<line x1="200" y1="110" x2="168" y2="110" class="fg-l on"/><polygon points="160,110 168,105.5 168,114.5" class="fg-a on"/><text x="180" y="102" text-anchor="middle" class="fg-t sm acc">C3=1</text>
<line x1="60" y1="110" x2="28" y2="110" class="fg-l"/><polygon points="20,110 28,105.5 28,114.5" class="fg-a"/><text x="40" y="102" text-anchor="middle" class="fg-t sm">C4=0</text>
<line x1="110" y1="140" x2="110" y2="162" class="fg-l"/><polygon points="110,170 105.5,162 114.5,162" class="fg-a"/><text x="110" y="188" text-anchor="middle" class="fg-t mono acc">S3=1</text>
<line x1="250" y1="140" x2="250" y2="162" class="fg-l"/><polygon points="250,170 245.5,162 254.5,162" class="fg-a"/><text x="250" y="188" text-anchor="middle" class="fg-t mono acc">S2=1</text>
<line x1="390" y1="140" x2="390" y2="162" class="fg-l"/><polygon points="390,170 385.5,162 394.5,162" class="fg-a"/><text x="390" y="188" text-anchor="middle" class="fg-t mono">S1=0</text>
<line x1="530" y1="140" x2="530" y2="162" class="fg-l"/><polygon points="530,170 525.5,162 534.5,162" class="fg-a"/><text x="530" y="188" text-anchor="middle" class="fg-t mono">S0=0</text>
<text x="330" y="218" text-anchor="middle" class="fg-t">0111 + 0101 = 1100（7 + 5 = 12）</text>
</svg><figcaption>進位從最右邊往左一格一格傳（綠色）。第 3 位要等第 2 位、第 2 位要等第 1 位，最左邊永遠是最後一個算完的。</figcaption></figure>
<table>
<tr><th>位</th><th>A</th><th>B</th><th>進來的進位</th><th>和</th><th>往左的進位</th></tr>
<tr><td>第 0 位</td><td>1</td><td>1</td><td>0</td><td>0</td><td>1</td></tr>
<tr><td>第 1 位</td><td>1</td><td>0</td><td>1</td><td>0</td><td>1</td></tr>
<tr><td>第 2 位</td><td>1</td><td>1</td><td>1</td><td>1</td><td>1</td></tr>
<tr><td>第 3 位</td><td>0</td><td>0</td><td>1</td><td>1</td><td>0</td></tr>
</table>
<p>答案 1100 = 12。電路很省，問題在<b>時間</b>：第 3 位要等第 2 位的進位，第 2 位要等第 1 位，第 1 位要等第 0 位。進位像漣漪一樣一位一位往左傳，名字就是這麼來的。</p>
<p>算一下有多慢。每個全加器的進位路徑大約要經過 2 層閘（AND 再 OR），64 位元就是大約 128 層。上一課的深入圖解算過：3 GHz 的一拍，只排得下十幾到二十幾層閘。用漣波進位，光一個加法就要好幾拍，這在 CPU 裡完全不能接受。最慢的情況是進位從頭傳到尾，例如 0111 1111 + 0000 0001。平常大部分的加法進位鏈都很短，但電路必須照最慢的情況設計，因為時脈看的是最慢的那條路。</p>

<h3><span class="badge lv2">進階</span>三、前瞻進位：不要等，先把進位算出來</h3>
<p>換個角度看每一位。不管進位從哪裡來，只看這一位的 A 和 B，就能知道兩件事：</p>
<ul>
<li><b>產生</b>（generate）：g = A AND B。兩個都是 1，這一位<b>一定</b>會往左進位，不管右邊來不來。</li>
<li><b>傳遞</b>（propagate）：p = A XOR B。剛好一個是 1，右邊只要有進位進來，這一位就會把它<b>傳</b>下去。</li>
</ul>
<p>於是每一位的進位是：c<sub>i+1</sub> = g<sub>i</sub> OR (p<sub>i</sub> AND c<sub>i</sub>)。把它一層一層展開（| 是 OR，&amp; 是 AND）：</p>
<pre><code>c1 = g0 | p0&amp;c0
c2 = g1 | p1&amp;g0 | p1&amp;p0&amp;c0
c3 = g2 | p2&amp;g1 | p2&amp;p1&amp;g0 | p2&amp;p1&amp;p0&amp;c0
c4 = g3 | p3&amp;g2 | p3&amp;p2&amp;g1 | p3&amp;p2&amp;p1&amp;g0
   | p3&amp;p2&amp;p1&amp;p0&amp;c0</code></pre>
<p>用白話讀 c3：「第 2 位自己產生進位；或第 2 位會傳、而第 1 位產生；或第 2、1 位都會傳、而第 0 位產生；或一路都會傳、最右邊本來就有進位。」每一條式子都只用到 g、p 和 c0，全部可以<b>同時</b>算，只要兩層閘：一層 AND、一層 OR。這叫<b>前瞻進位加法器</b>（carry-lookahead adder）。</p>
<p>用 7 + 5 驗算一次：g = 0111 AND 0101 = 0101，p = 0111 XOR 0101 = 0010，c0 = 0。</p>
<ul>
<li>c1 = g0 = 1</li>
<li>c2 = g1 OR (p1 AND g0) = 0 OR (1 AND 1) = 1</li>
<li>c3 = g2 OR …，g2 本身就是 1，所以 c3 = 1</li>
<li>c4 = g3 OR (p3 AND …)，g3、p3 都是 0，所以 c4 = 0</li>
</ul>
<p>每一位的和是 S<sub>i</sub> = p<sub>i</sub> XOR c<sub>i</sub>。p 從第 3 位到第 0 位是 0、0、1、0，進位是 1、1、1、0，兩者 XOR 得 1100。答案跟漣波進位一樣，但沒有任何一位在等別人。課文的「試試看」裡，<code>a^b</code> 和 <code>(a&amp;b)&lt;&lt;1</code> 算的，其實就是 p 和「g 往左移一位」。</p>
<h4>代價，和真正的做法：前綴樹</h4>
<p>天下沒有白吃的午餐。c<sub>n</sub> 的式子有 n + 1 項，最長的一項是 n + 1 個輸入的 AND。64 位元照這樣硬展開，閘的數量會爆炸，而且輸入太多的閘本身就慢。真正的做法是<b>分層合併</b>：先算出每兩位一組「這一組會不會產生、會不會傳遞」，再合併成每四位一組、每八位一組……這叫<b>平行前綴加法器</b>（parallel prefix adder）。</p>
<figure class="figure"><svg viewBox="0 0 660 290" class="fg" style="width:100%;max-width:660px" role="img" aria-label="8 位元的平行前綴樹：第一層每一位跟右邊隔壁 1 位合併，第二層跨 2 位，第三層跨 4 位，三層之後每一位都知道自己的進位">
<text x="320" y="20" text-anchor="middle" class="fg-t lg">8 位元的平行前綴樹（Kogge–Stone）</text>
<text x="560" y="40" text-anchor="middle" class="fg-t sm">第 0 位</text>
<line x1="560" y1="64" x2="560" y2="244" class="fg-l dim"/>
<rect x="538" y="46" width="44" height="20" rx="4" class="fg-b alt"/>
<text x="560" y="60" text-anchor="middle" class="fg-t sm mono">g,p</text>
<text x="492" y="40" text-anchor="middle" class="fg-t sm">第 1 位</text>
<line x1="492" y1="64" x2="492" y2="244" class="fg-l dim"/>
<rect x="470" y="46" width="44" height="20" rx="4" class="fg-b alt"/>
<text x="492" y="60" text-anchor="middle" class="fg-t sm mono">g,p</text>
<text x="424" y="40" text-anchor="middle" class="fg-t sm">第 2 位</text>
<line x1="424" y1="64" x2="424" y2="244" class="fg-l dim"/>
<rect x="402" y="46" width="44" height="20" rx="4" class="fg-b alt"/>
<text x="424" y="60" text-anchor="middle" class="fg-t sm mono">g,p</text>
<text x="356" y="40" text-anchor="middle" class="fg-t sm">第 3 位</text>
<line x1="356" y1="64" x2="356" y2="244" class="fg-l dim"/>
<rect x="334" y="46" width="44" height="20" rx="4" class="fg-b alt"/>
<text x="356" y="60" text-anchor="middle" class="fg-t sm mono">g,p</text>
<text x="288" y="40" text-anchor="middle" class="fg-t sm">第 4 位</text>
<line x1="288" y1="64" x2="288" y2="244" class="fg-l dim"/>
<rect x="266" y="46" width="44" height="20" rx="4" class="fg-b alt"/>
<text x="288" y="60" text-anchor="middle" class="fg-t sm mono">g,p</text>
<text x="220" y="40" text-anchor="middle" class="fg-t sm">第 5 位</text>
<line x1="220" y1="64" x2="220" y2="244" class="fg-l dim"/>
<rect x="198" y="46" width="44" height="20" rx="4" class="fg-b alt"/>
<text x="220" y="60" text-anchor="middle" class="fg-t sm mono">g,p</text>
<text x="152" y="40" text-anchor="middle" class="fg-t sm">第 6 位</text>
<line x1="152" y1="64" x2="152" y2="244" class="fg-l dim"/>
<rect x="130" y="46" width="44" height="20" rx="4" class="fg-b alt"/>
<text x="152" y="60" text-anchor="middle" class="fg-t sm mono">g,p</text>
<text x="84" y="40" text-anchor="middle" class="fg-t sm">第 7 位</text>
<line x1="84" y1="64" x2="84" y2="244" class="fg-l dim"/>
<rect x="62" y="46" width="44" height="20" rx="4" class="fg-b alt"/>
<text x="84" y="60" text-anchor="middle" class="fg-t sm mono">g,p</text>
<line x1="560" y1="66" x2="492" y2="112" class="fg-l alt"/>
<line x1="492" y1="66" x2="424" y2="112" class="fg-l alt"/>
<line x1="424" y1="66" x2="356" y2="112" class="fg-l alt"/>
<line x1="356" y1="66" x2="288" y2="112" class="fg-l alt"/>
<line x1="288" y1="66" x2="220" y2="112" class="fg-l alt"/>
<line x1="220" y1="66" x2="152" y2="112" class="fg-l alt"/>
<line x1="152" y1="66" x2="84" y2="112" class="fg-l alt"/>
<line x1="560" y1="112" x2="424" y2="166" class="fg-l alt"/>
<line x1="492" y1="112" x2="356" y2="166" class="fg-l alt"/>
<line x1="424" y1="112" x2="288" y2="166" class="fg-l alt"/>
<line x1="356" y1="112" x2="220" y2="166" class="fg-l alt"/>
<line x1="288" y1="112" x2="152" y2="166" class="fg-l alt"/>
<line x1="220" y1="112" x2="84" y2="166" class="fg-l alt"/>
<line x1="560" y1="166" x2="288" y2="220" class="fg-l alt"/>
<line x1="492" y1="166" x2="220" y2="220" class="fg-l alt"/>
<line x1="424" y1="166" x2="152" y2="220" class="fg-l alt"/>
<line x1="356" y1="166" x2="84" y2="220" class="fg-l alt"/>
<circle cx="560" cy="112" r="3" class="fg-lamp"/>
<circle cx="492" cy="112" r="7" class="fg-b hot"/>
<circle cx="424" cy="112" r="7" class="fg-b hot"/>
<circle cx="356" cy="112" r="7" class="fg-b hot"/>
<circle cx="288" cy="112" r="7" class="fg-b hot"/>
<circle cx="220" cy="112" r="7" class="fg-b hot"/>
<circle cx="152" cy="112" r="7" class="fg-b hot"/>
<circle cx="84" cy="112" r="7" class="fg-b hot"/>
<circle cx="560" cy="166" r="3" class="fg-lamp"/>
<circle cx="492" cy="166" r="3" class="fg-lamp"/>
<circle cx="424" cy="166" r="7" class="fg-b hot"/>
<circle cx="356" cy="166" r="7" class="fg-b hot"/>
<circle cx="288" cy="166" r="7" class="fg-b hot"/>
<circle cx="220" cy="166" r="7" class="fg-b hot"/>
<circle cx="152" cy="166" r="7" class="fg-b hot"/>
<circle cx="84" cy="166" r="7" class="fg-b hot"/>
<circle cx="560" cy="220" r="3" class="fg-lamp"/>
<circle cx="492" cy="220" r="3" class="fg-lamp"/>
<circle cx="424" cy="220" r="3" class="fg-lamp"/>
<circle cx="356" cy="220" r="3" class="fg-lamp"/>
<circle cx="288" cy="220" r="7" class="fg-b hot"/>
<circle cx="220" cy="220" r="7" class="fg-b hot"/>
<circle cx="152" cy="220" r="7" class="fg-b hot"/>
<circle cx="84" cy="220" r="7" class="fg-b hot"/>
<text x="600" y="116" class="fg-t sm acc">跨 1 位</text>
<text x="600" y="170" class="fg-t sm acc">跨 2 位</text>
<text x="600" y="224" class="fg-t sm acc">跨 4 位</text>
<line x1="560" y1="244" x2="560" y2="254" class="fg-l"/>
<polygon points="560,262 555.5,254 564.5,254" class="fg-a"/>
<text x="560" y="280" text-anchor="middle" class="fg-t sm mono">c1</text>
<line x1="492" y1="244" x2="492" y2="254" class="fg-l"/>
<polygon points="492,262 487.5,254 496.5,254" class="fg-a"/>
<text x="492" y="280" text-anchor="middle" class="fg-t sm mono">c2</text>
<line x1="424" y1="244" x2="424" y2="254" class="fg-l"/>
<polygon points="424,262 419.5,254 428.5,254" class="fg-a"/>
<text x="424" y="280" text-anchor="middle" class="fg-t sm mono">c3</text>
<line x1="356" y1="244" x2="356" y2="254" class="fg-l"/>
<polygon points="356,262 351.5,254 360.5,254" class="fg-a"/>
<text x="356" y="280" text-anchor="middle" class="fg-t sm mono">c4</text>
<line x1="288" y1="244" x2="288" y2="254" class="fg-l"/>
<polygon points="288,262 283.5,254 292.5,254" class="fg-a"/>
<text x="288" y="280" text-anchor="middle" class="fg-t sm mono">c5</text>
<line x1="220" y1="244" x2="220" y2="254" class="fg-l"/>
<polygon points="220,262 215.5,254 224.5,254" class="fg-a"/>
<text x="220" y="280" text-anchor="middle" class="fg-t sm mono">c6</text>
<line x1="152" y1="244" x2="152" y2="254" class="fg-l"/>
<polygon points="152,262 147.5,254 156.5,254" class="fg-a"/>
<text x="152" y="280" text-anchor="middle" class="fg-t sm mono">c7</text>
<line x1="84" y1="244" x2="84" y2="254" class="fg-l"/>
<polygon points="84,262 79.5,254 88.5,254" class="fg-a"/>
<text x="84" y="280" text-anchor="middle" class="fg-t sm mono">c8</text>
</svg><figcaption>每個綠圈把「自己這一段」和「右邊隔一段的那一段」合併。第一層跨 1 位、第二層跨 2 位、第三層跨 4 位，三層之後，每一位都知道從第 0 位到自己為止會不會產生進位。</figcaption></figure>
<p>合併的規則只有一條：左邊一組 (g<sub>高</sub>, p<sub>高</sub>) 接上右邊一組 (g<sub>低</sub>, p<sub>低</sub>)。合起來的這一組會產生進位，條件是「左邊自己產生，或左邊會傳、而右邊產生」；會傳遞的條件是「兩組都會傳」。每過一層，每一位看得到的範圍就加倍：1 位、2 位、4 位……所以 n 位元只要 log<sub>2</sub>n 層：8 位元 3 層，64 位元 6 層，比漣波進位的 64 級少太多了。</p>
<p>不同的樹各有取捨。Kogge–Stone（上圖）層數最少，但連線最多、最佔面積；Brent–Kung 用的合併單元少很多，層數大約多一倍。真實的 CPU 會混合使用，在速度、面積、功耗之間找平衡。這就是上一課說的：多用閘，換少層數。</p>

<h3><span class="badge lv2">進階</span>四、減法：多一排 XOR，加法器就會減</h3>
<p>第 0.1 課的深入圖解講過二補數：−B = (NOT B) + 1。所以 A − B = A + (NOT B) + 1。硬體只要多做兩件事：</p>
<ol>
<li>B 的每一位先經過一個 XOR，XOR 的另一端接一條控制線 SUB。XOR 有個好用的性質：跟 0 做 XOR 不變，跟 1 做 XOR 就反過來。所以 SUB = 0 時 B 原封不動（做加法），SUB = 1 時 B 每一位都反過來。</li>
<li>那個「+ 1」呢？把 SUB 也接到最右邊的進位輸入 Cin。本來空著的 Cin，剛好拿來加 1，一個閘都不用多。</li>
</ol>
<figure class="figure"><svg viewBox="0 0 640 262" class="fg" style="width:100%;max-width:640px" role="img" aria-label="加減法器：B 的四個位元各經過一個 XOR，SUB 線同時接到每個 XOR 和加法器的進位輸入；SUB 等於 1 時，B 等於 0011 變成 1100，加上 A 等於 0110 再加 1，結果 0011">
<text x="138" y="24" text-anchor="middle" class="fg-t sm">B3=0</text><text x="258" y="24" text-anchor="middle" class="fg-t sm">B2=0</text><text x="378" y="24" text-anchor="middle" class="fg-t sm acc">B1=1</text><text x="498" y="24" text-anchor="middle" class="fg-t sm acc">B0=1</text>
<line x1="138" y1="30" x2="138" y2="52" class="fg-l"/><polygon points="138,60 133.5,52 142.5,52" class="fg-a"/>
<line x1="258" y1="30" x2="258" y2="52" class="fg-l"/><polygon points="258,60 253.5,52 262.5,52" class="fg-a"/>
<line x1="378" y1="30" x2="378" y2="52" class="fg-l on"/><polygon points="378,60 373.5,52 382.5,52" class="fg-a on"/>
<line x1="498" y1="30" x2="498" y2="52" class="fg-l on"/><polygon points="498,60 493.5,52 502.5,52" class="fg-a on"/>
<line x1="162" y1="46" x2="590" y2="46" class="fg-l on"/>
<line x1="162" y1="46" x2="162" y2="60" class="fg-l on"/><circle cx="162" cy="46" r="3" class="fg-a on"/>
<line x1="282" y1="46" x2="282" y2="60" class="fg-l on"/><circle cx="282" cy="46" r="3" class="fg-a on"/>
<line x1="402" y1="46" x2="402" y2="60" class="fg-l on"/><circle cx="402" cy="46" r="3" class="fg-a on"/>
<line x1="522" y1="46" x2="522" y2="60" class="fg-l on"/><circle cx="522" cy="46" r="3" class="fg-a on"/>
<text x="598" y="42" class="fg-t sm acc">SUB = 1</text><text x="598" y="60" class="fg-t sm">做減法</text>
<rect x="120" y="60" width="60" height="36" rx="5" class="fg-b"/><text x="150" y="83" text-anchor="middle" class="fg-t">XOR</text>
<rect x="240" y="60" width="60" height="36" rx="5" class="fg-b"/><text x="270" y="83" text-anchor="middle" class="fg-t">XOR</text>
<rect x="360" y="60" width="60" height="36" rx="5" class="fg-b"/><text x="390" y="83" text-anchor="middle" class="fg-t">XOR</text>
<rect x="480" y="60" width="60" height="36" rx="5" class="fg-b"/><text x="510" y="83" text-anchor="middle" class="fg-t">XOR</text>
<line x1="150" y1="96" x2="150" y2="142" class="fg-l on"/><polygon points="150,150 145.5,142 154.5,142" class="fg-a on"/><text x="158" y="128" class="fg-t sm acc">1</text>
<line x1="270" y1="96" x2="270" y2="142" class="fg-l on"/><polygon points="270,150 265.5,142 274.5,142" class="fg-a on"/><text x="278" y="128" class="fg-t sm acc">1</text>
<line x1="390" y1="96" x2="390" y2="142" class="fg-l"/><polygon points="390,150 385.5,142 394.5,142" class="fg-a"/><text x="398" y="128" class="fg-t sm">0</text>
<line x1="510" y1="96" x2="510" y2="142" class="fg-l"/><polygon points="510,150 505.5,142 514.5,142" class="fg-a"/><text x="518" y="128" class="fg-t sm">0</text>
<polyline points="590,46 590,175 568,175" class="fg-l on"/><polygon points="560,175 568,170.5 568,179.5" class="fg-a on"/>
<text x="566" y="196" class="fg-t sm acc">Cin = 1</text>
<text x="20" y="179" class="fg-t">A = 0110</text>
<line x1="84" y1="175" x2="92" y2="175" class="fg-l"/><polygon points="100,175 92,170.5 92,179.5" class="fg-a"/>
<rect x="100" y="150" width="460" height="50" rx="6" class="fg-b alt"/><text x="330" y="181" text-anchor="middle" class="fg-t lg">4 位元加法器</text>
<line x1="330" y1="200" x2="330" y2="222" class="fg-l"/><polygon points="330,230 325.5,222 334.5,222" class="fg-a"/>
<text x="330" y="250" text-anchor="middle" class="fg-t acc">結果 0011 = 3</text>
<line x1="120" y1="200" x2="120" y2="222" class="fg-l on"/><polygon points="120,230 115.5,222 124.5,222" class="fg-a on"/>
<text x="120" y="250" text-anchor="middle" class="fg-t sm">進位 1，丟掉</text>
</svg><figcaption>同一條 SUB 線做兩件事：讓每個 XOR 把 B 反過來，同時從 Cin 補上那個「+ 1」。加法器本身完全沒改。</figcaption></figure>
<p>用 4 位元算 6 − 3：0110 + 1100 + 1 = 1 0011。最左邊多出來的進位丟掉，留下 0011 = 3。再算 3 − 6：0011 + 1001 + 1 = 1101，當有號數讀是 −3，這次沒有多出進位。</p>
<p>注意兩次的進位輸出：6 − 3 有進位、3 − 6 沒有。有沒有進位，剛好告訴你「當成無號數時，夠不夠減」。下一節的旗標就靠這一點。</p>

<h3><span class="badge lv3">專業</span>五、旗標：進位（C）和溢位（V）是兩回事</h3>
<p>第 0.6 課說過，ALU 每算完一次，就把結果的特徵記在<b>旗標</b>（flags）裡，條件跳躍只看旗標。最常見的四個：</p>
<table>
<tr><th>旗標</th><th>ARM 叫</th><th>x86 叫</th><th>什麼時候是 1</th></tr>
<tr><td>零</td><td>Z</td><td>ZF</td><td>結果的每一位都是 0</td></tr>
<tr><td>負</td><td>N</td><td>SF</td><td>結果的最高位是 1（當有號數看是負的）</td></tr>
<tr><td><b>進位</b>（carry）</td><td>C</td><td>CF</td><td>最高位又往外進位：<b>當無號數看</b>，結果裝不下</td></tr>
<tr><td><b>溢位</b>（overflow）</td><td>V</td><td>OF</td><td><b>當有號數看</b>，結果裝不下</td></tr>
</table>
<p>為什麼要兩個？因為加法器根本不知道你的位元是有號還是無號（第 0.1 課的深入圖解：位元沒有型別）。它只好兩種都算，讓程式自己挑。用 4 位元看四個例子：</p>
<table>
<tr><th>位元</th><th>當無號數</th><th>當有號數</th><th>C</th><th>V</th></tr>
<tr><td>0111 + 0001 = 1000</td><td>7 + 1 = 8，對</td><td>7 + 1 = −8，錯</td><td>0</td><td>1</td></tr>
<tr><td>1111 + 0001 = 0000</td><td>15 + 1 = 0，錯</td><td>−1 + 1 = 0，對</td><td>1</td><td>0</td></tr>
<tr><td>1000 + 1000 = 0000</td><td>8 + 8 = 0，錯</td><td>−8 + (−8) = 0，錯</td><td>1</td><td>1</td></tr>
<tr><td>0011 + 0010 = 0101</td><td>3 + 2 = 5，對</td><td>3 + 2 = 5，對</td><td>0</td><td>0</td></tr>
</table>
<figure class="figure"><svg viewBox="0 0 700 196" class="fg" style="width:100%;max-width:700px" role="img" aria-label="4 位元的 16 種組合排成一列：上面是有號值，下面是無號值；0111 和 1000 之間是溢位的斷崖，1111 繞回 0000 是進位的斷崖">
<text x="14" y="22" class="fg-t sm">上排：當成有號數　下排：當成無號數</text>
<rect x="14" y="78" width="42" height="30" class="fg-b alt"/>
<text x="35" y="97" text-anchor="middle" class="fg-t sm mono">0000</text>
<text x="35" y="68" text-anchor="middle" class="fg-t alt">0</text>
<text x="35" y="128" text-anchor="middle" class="fg-t sm">0</text>
<rect x="56" y="78" width="42" height="30" class="fg-b alt"/>
<text x="77" y="97" text-anchor="middle" class="fg-t sm mono">0001</text>
<text x="77" y="68" text-anchor="middle" class="fg-t alt">1</text>
<text x="77" y="128" text-anchor="middle" class="fg-t sm">1</text>
<rect x="98" y="78" width="42" height="30" class="fg-b alt"/>
<text x="119" y="97" text-anchor="middle" class="fg-t sm mono">0010</text>
<text x="119" y="68" text-anchor="middle" class="fg-t alt">2</text>
<text x="119" y="128" text-anchor="middle" class="fg-t sm">2</text>
<rect x="140" y="78" width="42" height="30" class="fg-b alt"/>
<text x="161" y="97" text-anchor="middle" class="fg-t sm mono">0011</text>
<text x="161" y="68" text-anchor="middle" class="fg-t alt">3</text>
<text x="161" y="128" text-anchor="middle" class="fg-t sm">3</text>
<rect x="182" y="78" width="42" height="30" class="fg-b alt"/>
<text x="203" y="97" text-anchor="middle" class="fg-t sm mono">0100</text>
<text x="203" y="68" text-anchor="middle" class="fg-t alt">4</text>
<text x="203" y="128" text-anchor="middle" class="fg-t sm">4</text>
<rect x="224" y="78" width="42" height="30" class="fg-b alt"/>
<text x="245" y="97" text-anchor="middle" class="fg-t sm mono">0101</text>
<text x="245" y="68" text-anchor="middle" class="fg-t alt">5</text>
<text x="245" y="128" text-anchor="middle" class="fg-t sm">5</text>
<rect x="266" y="78" width="42" height="30" class="fg-b alt"/>
<text x="287" y="97" text-anchor="middle" class="fg-t sm mono">0110</text>
<text x="287" y="68" text-anchor="middle" class="fg-t alt">6</text>
<text x="287" y="128" text-anchor="middle" class="fg-t sm">6</text>
<rect x="308" y="78" width="42" height="30" class="fg-b alt"/>
<text x="329" y="97" text-anchor="middle" class="fg-t sm mono">0111</text>
<text x="329" y="68" text-anchor="middle" class="fg-t alt">7</text>
<text x="329" y="128" text-anchor="middle" class="fg-t sm">7</text>
<rect x="350" y="78" width="42" height="30" class="fg-b warm"/>
<text x="371" y="97" text-anchor="middle" class="fg-t sm mono">1000</text>
<text x="371" y="68" text-anchor="middle" class="fg-t warm">−8</text>
<text x="371" y="128" text-anchor="middle" class="fg-t sm">8</text>
<rect x="392" y="78" width="42" height="30" class="fg-b warm"/>
<text x="413" y="97" text-anchor="middle" class="fg-t sm mono">1001</text>
<text x="413" y="68" text-anchor="middle" class="fg-t warm">−7</text>
<text x="413" y="128" text-anchor="middle" class="fg-t sm">9</text>
<rect x="434" y="78" width="42" height="30" class="fg-b warm"/>
<text x="455" y="97" text-anchor="middle" class="fg-t sm mono">1010</text>
<text x="455" y="68" text-anchor="middle" class="fg-t warm">−6</text>
<text x="455" y="128" text-anchor="middle" class="fg-t sm">10</text>
<rect x="476" y="78" width="42" height="30" class="fg-b warm"/>
<text x="497" y="97" text-anchor="middle" class="fg-t sm mono">1011</text>
<text x="497" y="68" text-anchor="middle" class="fg-t warm">−5</text>
<text x="497" y="128" text-anchor="middle" class="fg-t sm">11</text>
<rect x="518" y="78" width="42" height="30" class="fg-b warm"/>
<text x="539" y="97" text-anchor="middle" class="fg-t sm mono">1100</text>
<text x="539" y="68" text-anchor="middle" class="fg-t warm">−4</text>
<text x="539" y="128" text-anchor="middle" class="fg-t sm">12</text>
<rect x="560" y="78" width="42" height="30" class="fg-b warm"/>
<text x="581" y="97" text-anchor="middle" class="fg-t sm mono">1101</text>
<text x="581" y="68" text-anchor="middle" class="fg-t warm">−3</text>
<text x="581" y="128" text-anchor="middle" class="fg-t sm">13</text>
<rect x="602" y="78" width="42" height="30" class="fg-b warm"/>
<text x="623" y="97" text-anchor="middle" class="fg-t sm mono">1110</text>
<text x="623" y="68" text-anchor="middle" class="fg-t warm">−2</text>
<text x="623" y="128" text-anchor="middle" class="fg-t sm">14</text>
<rect x="644" y="78" width="42" height="30" class="fg-b warm"/>
<text x="665" y="97" text-anchor="middle" class="fg-t sm mono">1111</text>
<text x="665" y="68" text-anchor="middle" class="fg-t warm">−1</text>
<text x="665" y="128" text-anchor="middle" class="fg-t sm">15</text>
<line x1="350" y1="50" x2="350" y2="116" class="fg-l warm"/>
<text x="350" y="42" text-anchor="middle" class="fg-t sm warm">溢位 V：7 + 1 變成 −8</text>
<path d="M686 93 H694 V168 H6 V93 H6" class="fg-l alt dash"/>
<polygon points="14,93 6,88.5 6,97.5" class="fg-a alt"/>
<text x="350" y="160" text-anchor="middle" class="fg-t sm alt">進位 C：15 + 1 繞回 0</text>
</svg><figcaption>同一排 16 種組合，兩種讀法各有一個斷崖。走過右邊的斷崖（繞回開頭）設 C；走過中間的斷崖（正數衝進負數）設 V。</figcaption></figure>
<p>V 在電路上怎麼算？規則是：<b>兩個同號的數相加，結果卻變號了</b>，就是溢位。正加正不可能變負，負加負不可能變正；一正一負相加則永遠不會溢位。換成電路只要一個閘：V = 進入最高位的進位 XOR 離開最高位的進位。兩者不一樣，代表最高位被「擠壞」了。</p>
<h4>比大小，就是減完看旗標</h4>
<p>CPU 的比較指令（x86 和 ARM 都叫 <code>CMP</code>）就是做一次減法、丟掉結果、只留下旗標。接下來的條件跳躍看哪幾個旗標，決定了你在比什麼：</p>
<ul>
<li><b>相等</b>：Z = 1。</li>
<li><b>無號數的小於</b>：減的時候不夠減，也就是有借位。x86 用 CF = 1 表示借位，跳躍指令叫 JB（jump if below）；ARM 剛好反過來，減法時 C = 1 代表「沒有借位」，所以無號數的小於是 C = 0（B.LO）。</li>
<li><b>有號數的小於</b>：N ≠ V。x86 是 JL（jump if less，看 SF ≠ OF），ARM 是 B.LT。</li>
</ul>
<p>為什麼有號數的小於是 N ≠ V，不能只看 N？走兩個例子：</p>
<ul>
<li>3 和 5 比：0011 − 0101 = 1110。N = 1，沒有溢位所以 V = 0，N ≠ V，所以 3 &lt; 5。這次只看 N 也對。</li>
<li>−8 和 1 比：1000 − 0001 = 0111。N = 0，看起來是「正的」；可是 −8 − 1 = −9，4 位元裝不下，V = 1。N ≠ V，所以 −8 &lt; 1。如果只看 N，就會說 −8 不小於 1，錯了。</li>
</ul>
<p>V 就是用來修正「減到溢位、正負號被翻過去」的情況。你寫的 <code>if (a &lt; b)</code>，編譯器會依照 a、b 的型別，選擇看 C，還是看 N 和 V。這也是為什麼 C 語言裡把有號和無號混著比會出事：<code>-1 &lt; 1u</code> 的結果是假，因為 −1 先被轉成無號數 4,294,967,295。Go 乾脆禁止不同的整數型別混著比，編譯就不會過。</p>
<h4>溢位之後，各個語言怎麼辦</h4>
<table>
<tr><th>語言</th><th>整數溢位時</th></tr>
<tr><td>Go、Java</td><td>靜靜地繞回去，不報錯</td></tr>
<tr><td>C#</td><td>預設繞回去；放在 <code>checked</code> 區塊裡會丟出例外</td></tr>
<tr><td>Rust</td><td>除錯版本直接 panic，正式版本繞回去；要明確的行為，就用 <code>checked_add</code>、<code>wrapping_add</code> 這類方法</td></tr>
<tr><td>C、C++</td><td>無號數繞回去；有號數溢位是「未定義行為」，編譯器可以假設它不會發生，做出意想不到的最佳化</td></tr>
<tr><td>JavaScript</td><td>number 不會繞回，但超過 2<sup>53</sup> 就開始失去精度；位元運算會先轉成 32 位元再繞回；<code>Uint8ClampedArray</code> 則是卡在 0 和 255</td></tr>
</table>
<p>真實世界的溢位事故很多。1996 年亞利安 5 號火箭首航，把一個 64 位元浮點數轉成 16 位元有號整數時溢位，起飛約 40 秒後自毀。2006 年 Joshua Bloch 指出，Java 標準函式庫的二分搜尋用 <code>(low + high) / 2</code> 算中點，陣列夠大時 low + high 會溢位成負數；改成 <code>low + (high - low) / 2</code> 就沒事。2014 年 YouTube 有一支影片的觀看次數超過 2,147,483,647，YouTube 因此把計數器換成 64 位元。2015 年美國聯邦航空總署發出指令：波音 787 的發電機控制單元連續通電 248 天後會失效，因為一個以百分之一秒計數的有號 32 位元計數器會溢位（2<sup>31</sup> 個百分之一秒，大約 248.55 天）。</p>

<h3><span class="badge lv3">專業</span>六、乘法、除法，和移位</h3>
<h4>移位：最便宜的運算</h4>
<p>二進位往左移一位，就是乘以 2，就像十進位補一個 0 是乘以 10。在硬體裡，固定移一位根本不用閘，只是把導線錯開一格接。要移任意位數，就用<b>桶形移位器</b>（barrel shifter）：好幾層多工器，第一層決定要不要移 1 位、第二層要不要移 2 位、第三層要不要移 4 位……64 位元只要 6 層，一拍就移完。</p>
<p>右移有兩種。<b>邏輯右移</b>左邊補 0，給無號數用；<b>算術右移</b>左邊補原本的最高位，讓負數保持是負數。JavaScript 裡兩種都有：<code>-8 &gt;&gt; 1</code> 是 <code>-4</code>，<code>-8 &gt;&gt;&gt; 1</code> 是 <code>2147483644</code>。還有一個小陷阱：算術右移是往負無限大取整，整數除法是往 0 取整，所以 <code>-7 &gt;&gt; 1</code> 是 −4，<code>Math.trunc(-7 / 2)</code> 卻是 −3。編譯器把有號數的「除以 2」換成右移時，會多加一道修正。</p>
<h4>乘法：移位再相加</h4>
<p>課文說乘法就是紙上的直式乘法。二進位做起來更簡單，因為乘數的每一位不是 0 就是 1：是 1，就把被乘數照抄一份、往左移到那一位；是 0，那一列就全是 0。最後全部加起來。</p>
<figure class="figure"><svg viewBox="0 0 560 250" class="fg" style="width:100%;max-width:560px" role="img" aria-label="二進位直式乘法 0110 乘 0101：乘數第 0 位和第 2 位是 1，各抄一份被乘數並左移，第 1、3 位是 0 整列為 0，相加得 00011110，也就是 30">
<text x="20" y="44" class="fg-t">被乘數　6</text>
<text x="322" y="44" text-anchor="middle" class="fg-t mono">0</text><text x="358" y="44" text-anchor="middle" class="fg-t mono">1</text><text x="394" y="44" text-anchor="middle" class="fg-t mono">1</text><text x="430" y="44" text-anchor="middle" class="fg-t mono">0</text>
<text x="20" y="70" class="fg-t">乘數　5</text>
<text x="286" y="70" text-anchor="middle" class="fg-t">×</text>
<text x="322" y="70" text-anchor="middle" class="fg-t mono">0</text><text x="358" y="70" text-anchor="middle" class="fg-t mono acc">1</text><text x="394" y="70" text-anchor="middle" class="fg-t mono">0</text><text x="430" y="70" text-anchor="middle" class="fg-t mono acc">1</text>
<line x1="160" y1="80" x2="450" y2="80" class="fg-l"/>
<rect x="306" y="88" width="140" height="22" rx="4" class="fg-b hot"/>
<text x="20" y="104" class="fg-t sm">第 0 位是 1：照抄</text>
<text x="322" y="104" text-anchor="middle" class="fg-t mono">0</text><text x="358" y="104" text-anchor="middle" class="fg-t mono">1</text><text x="394" y="104" text-anchor="middle" class="fg-t mono">1</text><text x="430" y="104" text-anchor="middle" class="fg-t mono">0</text>
<text x="20" y="130" class="fg-t sm">第 1 位是 0：整列 0</text>
<text x="286" y="130" text-anchor="middle" class="fg-t sm mono">0</text><text x="322" y="130" text-anchor="middle" class="fg-t sm mono">0</text><text x="358" y="130" text-anchor="middle" class="fg-t sm mono">0</text><text x="394" y="130" text-anchor="middle" class="fg-t sm mono">0</text>
<rect x="234" y="140" width="140" height="22" rx="4" class="fg-b hot"/>
<text x="20" y="156" class="fg-t sm">第 2 位是 1：左移 2 格</text>
<text x="250" y="156" text-anchor="middle" class="fg-t mono">0</text><text x="286" y="156" text-anchor="middle" class="fg-t mono">1</text><text x="322" y="156" text-anchor="middle" class="fg-t mono">1</text><text x="358" y="156" text-anchor="middle" class="fg-t mono">0</text>
<text x="20" y="182" class="fg-t sm">第 3 位是 0：整列 0</text>
<text x="214" y="182" text-anchor="middle" class="fg-t sm mono">0</text><text x="250" y="182" text-anchor="middle" class="fg-t sm mono">0</text><text x="286" y="182" text-anchor="middle" class="fg-t sm mono">0</text><text x="322" y="182" text-anchor="middle" class="fg-t sm mono">0</text>
<line x1="160" y1="194" x2="450" y2="194" class="fg-l"/>
<text x="20" y="220" class="fg-t acc">全部加起來 = 30</text>
<text x="178" y="220" text-anchor="middle" class="fg-t mono">0</text><text x="214" y="220" text-anchor="middle" class="fg-t mono">0</text><text x="250" y="220" text-anchor="middle" class="fg-t mono">0</text><text x="286" y="220" text-anchor="middle" class="fg-t mono acc">1</text><text x="322" y="220" text-anchor="middle" class="fg-t mono acc">1</text><text x="358" y="220" text-anchor="middle" class="fg-t mono acc">1</text><text x="394" y="220" text-anchor="middle" class="fg-t mono acc">1</text><text x="430" y="220" text-anchor="middle" class="fg-t mono">0</text>
<text x="280" y="244" text-anchor="middle" class="fg-t sm">每一列都是「被乘數 AND 乘數的某一位」，再往左移到那一位</text>
</svg><figcaption>0110 × 0101：乘數裡是 1 的位置，就把被乘數抄一份、移過去。16 + 8 + 4 + 2 = 30，也就是 6 × 5。</figcaption></figure>
<p>注意每一列其實就是「被乘數的每一位 AND 乘數的某一位」，所以 4 × 4 位元的乘法，要 16 個 AND 閘產生<b>部分積</b>（partial product），再把它們加起來；64 位元就是 4,096 個 AND，加上把 64 列加起來的加法器。結果的寬度是兩倍：兩個 64 位元相乘，最多是 128 位元。</p>
<p>真實的乘法器不會一列一列慢慢加。它用一棵<b>加法樹</b>，同時把很多列三列併成兩列地合併，過程中先不傳進位，把「和」與「進位」分開記著（carry-save），到最後才用一個快速加法器一次算清。現代 CPU 的 64 位元整數乘法，大約 3 到 4 拍就出結果，而且每一拍都能開始一個新的乘法。</p>
<h4>除法：慢的那一個</h4>
<p>除法是移位再相減，一步只能定出商的一位或少數幾位，而且下一步要看上一步減完的結果，很難平行。所以整數除法常常要十幾到幾十拍，比乘法慢一個數量級。編譯器因此很努力地避開它：</p>
<ul>
<li>除以 2 的次方，換成右移。</li>
<li>乘以常數，換成移位再相加，例如 x × 5 = (x &lt;&lt; 2) + x。</li>
<li>除以常數，例如除以 10，換成乘以一個事先算好的「魔術數字」再右移。結果完全一樣，但快得多。</li>
</ul>
<p>所以你不需要手動把 <code>x * 8</code> 寫成 <code>x &lt;&lt; 3</code>，編譯器和 JIT 都會幫你做；手寫只會降低可讀性。</p>

<h3><span class="badge lv4">專家</span>七、浮點數加法、SIMD，和會出錯的硬體</h3>
<h4>浮點數加法：對齊、相加、整理、四捨五入</h4>
<p>浮點數（第 0.1 課的深入圖解）的加法，比整數多了幾個步驟：</p>
<ol>
<li><b>對齊</b>：比較兩個數的指數，把小的那個的小數部分往右移，移到兩者的指數相同。</li>
<li><b>相加</b>：兩個小數部分，用整數加法器相加。</li>
<li><b>整理</b>（normalize）：把結果移回「1 點多少」的形式，調整指數。</li>
<li><b>四捨五入</b>：裁回 53 位。</li>
</ol>
<p>問題出在第 1 步：被往右移出去的位元就丟了。1e16 加 1，1 要往右移 50 多位才能對齊，整個被移出去，所以 <code>1e16 + 1 === 1e16</code> 是 <code>true</code>。於是順序會影響結果：<code>(1e16 + 1) + 1</code> 是 1e16，兩個 1 各自被丟掉；<code>1e16 + (1 + 1)</code> 卻是 10000000000000002。浮點數的加法<b>沒有結合律</b>。</p>
<p>這在實務上很重要：多執行緒或 GPU 把一大堆數字分組加總，每次分組、合併的順序不同，最後幾位就可能不同。同一份報表兩次算出來差在小數點後第十幾位、遊戲的重播（replay）在不同機器上慢慢跑偏，常常就是這個原因。需要更準的加總，可以用 Kahan 補償加法，或改用整數、定點數。</p>
<h4>一個加法器，切成好幾個：SIMD</h4>
<p>把一個 256 位元的加法器，在每 32 位元的地方把進位鏈切斷，它就變成 8 個獨立的 32 位元加法器，一道指令同時做 8 個加法。這就是 <b>SIMD</b>（single instruction, multiple data）：x86 的 AVX2 是 256 位元，ARM 的 NEON 是 128 位元，瀏覽器裡的 WebAssembly 也支援 128 位元的 SIMD。處理像素時還常用<b>飽和運算</b>（saturating arithmetic）：200 + 100 不繞回 44，而是停在 255，畫面才不會亮到突然變黑。</p>
<p>AI 運算的核心是「乘了再加」（multiply-accumulate），GPU 和 AI 加速器裡塞了成千上萬個這種單元。<b>融合乘加</b>（fused multiply-add，FMA）把 a × b + c 一次算完、只四捨五入一次，比分開算更快，也更準。</p>
<h4>大數字：一段一段地加，進位接力</h4>
<p>JavaScript 的 <code>BigInt</code>、Go 的 <code>math/big</code>、RSA 用的 2048 位元整數，都是軟體把大數字切成很多個 64 位元的段，一段一段地加，再用「帶進位的加法」指令（x86 的 <code>ADC</code>、ARM 的 <code>ADCS</code>）把上一段的進位旗標加進下一段。這正是漣波進位，只是從硬體搬到了軟體。Go 的 <code>bits.Add64(x, y, carry)</code> 會直接回傳和與進位，編譯器會把它變成這種指令。</p>
<h4>硬體也會算錯，算的時間也會洩密</h4>
<ul>
<li><b>Pentium FDIV</b>（1994）：Intel Pentium 的除法電路用一張查找表加速，表裡有 5 格漏填。極少數的除法會算錯，最有名的例子是 4195835 ÷ 3145727。Intel 最後全面更換處理器，認列了大約 4.75 億美元的損失。</li>
<li><b>除法的時間會洩漏資料</b>：在很多 CPU 上，除法要幾拍會隨數值改變。2024 年的 KyberSlash 研究發現，後量子密碼 Kyber 的一些實作拿祕密資料做除法，攻擊者量時間就有機會推出金鑰。密碼學程式因此避免對祕密值做除法和分支，改用固定時間的乘法和移位。</li>
<li><b>乘法一溢位，緩衝區就破了</b>：C 程式常寫 <code>malloc(count * size)</code>。攻擊者讓 count 大到乘積溢位、繞回一個很小的數，程式配了一小塊記憶體，卻照 count 寫進大量資料，造成堆積溢位（heap overflow）。這是很多記憶體漏洞的起點，<code>calloc</code> 這類函式會先檢查乘法有沒有溢位。智慧合約也出過一樣的事，所以 Solidity 從 0.8 版起預設檢查整數溢位。</li>
</ul>

<h3>八、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>進位旗標和溢位旗標是同一件事</td><td>C 是當無號數裝不下，V 是當有號數裝不下。4 位元的 7 + 1 只設 V，−1 + 1 只設 C。</td></tr>
<tr><td>CPU 有一套專門的減法電路</td><td>同一個加法器，B 前面多一排 XOR，Cin 接 1，就是減法。</td></tr>
<tr><td>乘法很慢，所以要自己改寫成移位</td><td>整數乘法大約 3 到 4 拍，乘以常數編譯器也會自動換成移位。真正慢的是除法。</td></tr>
<tr><td>整數溢位一定會報錯</td><td>Go、Java、C# 預設都會靜靜繞回去；C 的有號溢位甚至是未定義行為。</td></tr>
<tr><td>加法一定是一位一位傳進位</td><td>那是漣波進位。CPU 用前綴樹，64 位元只要 6 層合併。</td></tr>
<tr><td>(a + b) + c 一定等於 a + (b + c)</td><td>整數是；浮點數不是，加總的順序會影響最後幾位。</td></tr>
</table>

<h3>九、跟你的工作連起來</h3>
<ul>
<li><b>前端（Vue、TypeScript）</b>：位元運算會偷偷變成 32 位元：<code>(2 ** 32 + 5) | 0</code> 是 <code>5</code>。寫雜湊函式需要 32 位元整數乘法時，用 <code>Math.imul</code>，不要用 <code>*</code>，因為大數相乘的結果超過 2<sup>53</sup>，低位會被四捨五入掉。金額一律用整數加總。</li>
<li><b>後端（Node.js、Go）</b>：資料庫的自動遞增主鍵如果是 32 位元（PostgreSQL 的 <code>serial</code>、<code>integer</code>），最多大約 21 億筆。寫入量大的表要一開始就用 <code>bigint</code>／<code>bigserial</code>；等快滿了才改，得重寫整張大表。Go 的整數溢位不會報錯，計算金額、配額時要自己檢查上限。</li>
<li><b>遊戲（Cocos、Unity）</b>：C# 的 <code>int</code> 是 32 位元，累積的分數、金幣要考慮上限，或改用 <code>long</code>；希望溢位時報錯就包在 <code>checked</code> 裡。像素和顏色的混合要用飽和運算，或先 clamp 到 0 到 255。多人同步的計算如果要每台機器結果逐位元一致，不要依賴浮點數的加總順序。</li>
<li><b>維運（監控、網路）</b>：計數器會繞回。32 位元的網路介面位元組計數器，在 1 Gbps 滿載時大約 34 秒就繞一圈，所以 SNMP 要用 64 位元的 <code>ifHCInOctets</code>。Prometheus 的 <code>rate()</code> 會把計數器變小當成「重設」來處理，所以 counter 只能往上加。很多「機器開了 49.7 天就出問題」的老 bug，就是 32 位元的毫秒計數器（2<sup>32</sup> 毫秒大約 49.7 天）繞回了。</li>
</ul>

<h3>十、面試會怎麼問</h3>
<p>先自己講一遍，最好出聲講，再打開參考答案。</p>
<ol>
<li>「半加器和全加器差在哪？怎麼用半加器做出全加器？」</li>
<li>「漣波進位加法器為什麼慢？前瞻進位、前綴加法器怎麼解決？代價是什麼？」</li>
<li>「CPU 怎麼用加法器做減法？」</li>
<li>「進位旗標和溢位旗標有什麼不同？為什麼有號數比大小要看 N ≠ V？」</li>
<li>「二分搜尋寫 <code>mid = (lo + hi) / 2</code> 有什麼問題？怎麼修？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>半加器加兩個位元，輸出和（XOR）與進位（AND）；全加器多加一個從低位來的進位。全加器可以用兩個半加器做：先加 A、B，再把結果和進位輸入相加，兩次的進位用 OR 合併，總共兩個 XOR、兩個 AND、一個 OR。它的和是三個輸入的奇偶，進位是三個輸入的多數決。</li>
<li>漣波進位把每一位的進位輸出接到下一位，最高位要等進位一位一位傳上來，延遲跟位數成正比，64 位元大約一百多層閘。前瞻進位先算每一位的 generate（A AND B）和 propagate（A XOR B），進位就能直接用 g、p 和最低位的進位算出，不必等。完全展開的閘數會爆炸，所以實務上用平行前綴樹分層合併 (g, p)，延遲降到 log n 層。代價是更多閘、更多連線、更多面積和功耗；Kogge–Stone 和 Brent–Kung 就是在層數和面積之間做不同的取捨。</li>
<li>利用二補數：A − B = A + (NOT B) + 1。在 B 的每一位前面放一個 XOR，用一條 SUB 控制線決定要不要反轉，同一條 SUB 再接到加法器最低位的進位輸入，補上 +1。加法器本身不用改，同一套電路就能加也能減；減完的旗標還能直接拿來比大小。</li>
<li>C 是最高位的進位輸出，代表當無號數時結果超出範圍（減法時則表示有沒有借位，x86 和 ARM 的定義剛好相反）；V 是有號溢位，發生在兩個同號的數相加卻得到異號的結果，電路上是最高位的進位輸入 XOR 進位輸出。有號比較做的是 A − B：如果沒有溢位，N 就是正確的正負號；如果溢位了，N 被翻轉過，所以要用 N XOR V 才是真正的「A 小於 B」。例如 4 位元的 −8 − 1 得到 0111，N = 0 但 V = 1，N ≠ V 正確地表示 −8 &lt; 1。</li>
<li>lo + hi 可能超過整數的最大值而溢位，變成負數，算出錯的索引甚至當掉；這個 bug 在 Java 標準函式庫裡存在多年，2006 年才被指出。修法是 <code>lo + (hi - lo) / 2</code>，或在 Java、JavaScript 裡用無號右移 <code>(lo + hi) &gt;&gt;&gt; 1</code>。在 JavaScript 的 number 裡雖然不會繞回，但只要用到 <code>| 0</code> 這類 32 位元運算，同樣的問題就會出現。</li>
</ol>
</details>

<h3>十一、練功題（做得出來才算真的懂）</h3>
<ol>
<li>用 4 位元算 0110 + 0111。寫出結果，以及 N、Z、C、V 四個旗標，再分別用無號數和有號數解釋。</li>
<li>用 g、p 算出 1011 + 0110 的 c1 到 c4，再算出每一位的和。</li>
<li>只用 <code>^</code>、<code>&amp;</code>、<code>&lt;&lt;</code>，用 JavaScript 寫一個 <code>add(a, b)</code>。最壞要跑幾圈？為什麼說它就是漣波進位？</li>
<li>用移位再相加，手算 0111 × 0011，寫出每一列的部分積。</li>
<li>一個 32 位元的位元組計數器，在 1 Gbps 滿載下多久繞一圈？10 Gbps 呢？</li>
<li>PostgreSQL 的某張表 id 是 <code>serial</code>（32 位元），每秒寫入 300 筆，大約多久會用完？要怎麼預防？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>結果是 1101。N = 1，Z = 0。最高位沒有往外進位，C = 0：當無號數是 6 + 7 = 13，對。進入最高位的進位是 1、離開的是 0，V = 1：當有號數，6 + 7 = 13 超出 −8 到 7，結果被讀成 −3，錯。</li>
<li>g = 1011 AND 0110 = 0010，p = 1011 XOR 0110 = 1101，c0 = 0。c1 = g0 = 0；c2 = g1 OR (p1 AND c1) = 1；c3 = g2 OR (p2 AND c2) = 0 OR 1 = 1；c4 = g3 OR (p3 AND c3) = 0 OR 1 = 1。和 = p XOR 進位 = 1101 XOR 1100 = 0001，加上 c4，完整答案是 1 0001 = 17，也就是 11 + 6。</li>
<li>
<pre><code>function add(a, b) {
  while (b !== 0) {
    const carry = (a &amp; b) &lt;&lt; 1; // 進位左移
    a = a ^ b;                    // 不算進位的和
    b = carry;                    // 下一圈再加
  }
  return a;
}</code></pre>
在 32 位元的範圍內，最壞要跑 32 圈，例如 <code>add(-1, 1)</code>：進位每一圈往左走一位，一路走到最高位掉出去為止。每一圈就是進位往左傳一格，所以它就是漣波進位，只是用迴圈一拍一拍地做。</li>
<li>乘數 0011 的第 0、1 位是 1：第一列 0111，第二列 01110，第 2、3 位是 0，整列為 0。相加：0111 + 01110 = 10101 = 21，也就是 7 × 3。</li>
<li>1 Gbps 是每秒 125,000,000 個位元組，2<sup>32</sup> ÷ 125,000,000 ≈ 34 秒。10 Gbps 大約 3.4 秒。監控每分鐘才抓一次的話，中間可能已經繞了好幾圈，數字完全不可信，所以要用 64 位元的計數器。</li>
<li>2,147,483,647 ÷ 300 ÷ 86,400 ≈ 83 天。預防：寫入量大的表一開始就用 <code>bigint</code>（<code>bigserial</code>）；監控序號的使用比例，例如超過 50% 就告警；已經快滿的表，要提早規劃線上遷移，因為直接改欄位型別會重寫整張表、長時間鎖表。</li>
</ol>
</details>

<h3>十二、想再挖深</h3>
<ul>
<li><b>David Harris 與 Sarah Harris《Digital Design and Computer Architecture》第 5 章</b>：加法器、前瞻進位、前綴加法器、移位器、乘法器、除法器，一次講完，圖很多。</li>
<li><b>Patterson 與 Hennessy《Computer Organization and Design》第 3 章〈Arithmetic for Computers〉</b>：從整數加減乘除一路講到浮點數，以及硬體怎麼處理溢位。</li>
<li><b>Henry S. Warren《Hacker's Delight》</b>：位元技巧的寶典，溢位偵測、用乘法取代除以常數，都有完整的推導。</li>
<li><b>Nand2Tetris</b>（<a href="https://www.nand2tetris.org/">nand2tetris.org</a>）第 2 個專案：用上一課的閘，親手做出半加器、全加器、16 位元加法器和 ALU。</li>
</ul>
` });
