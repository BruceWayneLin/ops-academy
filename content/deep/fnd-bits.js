DEEP({ 'fnd-bits': `
<p>上一課講了三件事：位元組是一切的原料，同一串位元組要靠「約定」才有意思，編碼不是加密。這一章把那些約定一個一個拆開來，親手算一次：Base64 怎麼把 3 個位元組變成 4 個字、「中」為什麼是 <code>e4 b8 ad</code>、同一個數字在記憶體裡為什麼有兩種排法、整數怎麼會從 21 億「翻」成負數、0.1 + 0.2 為什麼不等於 0.3，以及這些小事在正式環境裡怎麼變成大事故：金額對不上帳、ID 最後幾位數被改掉、表情符號存不進資料庫、遊戲角色走遠了開始抖。</p>

<h3><span class="badge lv1">基礎</span>一、同一串位元組，五種讀法</h3>
<p>先做一個小實驗。記憶體裡有連續四個位元組，十六進位寫成 <code>41 42 43 44</code>。它們是什麼？答案是：<b>看你用哪一種約定去讀</b>。</p>
<figure class="figure"><svg viewBox="0 0 660 300" class="fg" style="width:100%;max-width:660px" role="img" aria-label="記憶體中的四個位元組 41 42 43 44，分別當成文字、大端整數、小端整數、浮點數和顏色來讀，得到五種完全不同的意思">
<text x="325" y="24" text-anchor="middle" class="fg-t lg">記憶體裡連續的四個位元組</text>
<rect x="170" y="40" width="70" height="44" rx="6" class="fg-b alt"/><text x="205" y="68" text-anchor="middle" class="fg-t lg mono">41</text>
<rect x="250" y="40" width="70" height="44" rx="6" class="fg-b alt"/><text x="285" y="68" text-anchor="middle" class="fg-t lg mono">42</text>
<rect x="330" y="40" width="70" height="44" rx="6" class="fg-b alt"/><text x="365" y="68" text-anchor="middle" class="fg-t lg mono">43</text>
<rect x="410" y="40" width="70" height="44" rx="6" class="fg-b alt"/><text x="445" y="68" text-anchor="middle" class="fg-t lg mono">44</text>
<text x="205" y="102" text-anchor="middle" class="fg-t sm mono">01000001</text><text x="285" y="102" text-anchor="middle" class="fg-t sm mono">01000010</text><text x="365" y="102" text-anchor="middle" class="fg-t sm mono">01000011</text><text x="445" y="102" text-anchor="middle" class="fg-t sm mono">01000100</text>
<line x1="325" y1="110" x2="325" y2="128" class="fg-l on"/><polygon points="325,136 320.5,128 329.5,128" class="fg-a on"/>
<text x="337" y="126" class="fg-t sm acc">套上不同的約定</text>
<rect x="60" y="136" width="540" height="26" rx="4" class="fg-b"/><text x="74" y="154" class="fg-t">當成 ASCII 文字</text><text x="586" y="154" text-anchor="end" class="fg-t mono acc">"ABCD"</text>
<rect x="60" y="168" width="540" height="26" rx="4" class="fg-b"/><text x="74" y="186" class="fg-t">當成 32 位元整數，大端</text><text x="586" y="186" text-anchor="end" class="fg-t mono acc">1,094,861,636</text>
<rect x="60" y="200" width="540" height="26" rx="4" class="fg-b"/><text x="74" y="218" class="fg-t">當成 32 位元整數，小端</text><text x="586" y="218" text-anchor="end" class="fg-t mono acc">1,145,258,561</text>
<rect x="60" y="232" width="540" height="26" rx="4" class="fg-b"/><text x="74" y="250" class="fg-t">當成 32 位元浮點數，大端</text><text x="586" y="250" text-anchor="end" class="fg-t mono acc">12.1414…</text>
<rect x="60" y="264" width="540" height="26" rx="4" class="fg-b"/><text x="74" y="282" class="fg-t">當成 CSS 顏色 #RRGGBBAA</text><text x="586" y="282" text-anchor="end" class="fg-t mono acc">#41424344：半透明的深灰</text>
</svg><figcaption>位元組本身沒有意思。同樣 32 個位元，套上五種約定，就是五種完全不同的東西。「亂碼」和「數字讀錯」，都是約定對不上。</figcaption></figure>
<p>這張圖是整章的地圖。後面每一節，都是在講其中一種約定：文字怎麼編、整數怎麼排、浮點數怎麼存。只要記得一件事：<b>位元組不會告訴你它是什麼</b>。檔案開頭、HTTP 標頭、資料庫欄位型別、通訊協定的規格書，都是在替位元組「附上說明書」。說明書一丟，誰都猜不回來。</p>
<h4>為什麼大家都用十六進位</h4>
<p>一個位元組是 8 個位元，寫成二進位太長，寫成十進位又看不出位元的樣子。十六進位剛好：<b>一個十六進位數字正好代表 4 個位元</b>（叫一個 nibble），一個位元組就是兩個數字，不多不少。</p>
<table>
<tr><th>十六進位</th><th>二進位</th><th>十進位</th></tr>
<tr><td><code>4</code></td><td><code>0100</code></td><td>4</td></tr>
<tr><td><code>9</code></td><td><code>1001</code></td><td>9</td></tr>
<tr><td><code>A</code></td><td><code>1010</code></td><td>10</td></tr>
<tr><td><code>E</code></td><td><code>1110</code></td><td>14</td></tr>
<tr><td><code>F</code></td><td><code>1111</code></td><td>15</td></tr>
</table>
<p>所以 <code>0xE4</code> 一眼就能拆：E 是 1110，4 是 0100，合起來是 <code>1110 0100</code>，十進位是 14 × 16 + 4 = 228。練熟這個轉換，後面的 UTF-8 和 Base64 就只是「把位元重新分組」而已。</p>
<p>要在程式裡拆位元，用的是位元運算：<code>x &gt;&gt; 4</code> 把位元往右推 4 格，拿到高的那半；<code>x &amp; 0x0F</code> 用遮罩只留下低的那半。<code>chmod 755</code> 則是另一種寫法：八進位，一個數字代表 3 個位元，剛好對上「讀、寫、執行」三個開關，7 是 <code>111</code>（全開），5 是 <code>101</code>（讀和執行）。</p>

<h3><span class="badge lv2">進階</span>二、Base64：把 3 個位元組變成 4 個字</h3>
<p>先問為什麼需要它。電子郵件、JSON、HTTP 標頭、網址，這些管道當初都是為「文字」設計的。直接把任意位元組塞進去，遇到 <code>0x00</code>、換行、控制字元，就會被截斷或改掉。<b>Base64</b> 的解法是：只用 64 個保證安全的字元（A–Z、a–z、0–9、<code>+</code>、<code>/</code>）來表示任意位元組。64 是 2 的 6 次方，所以每個字元剛好裝 6 個位元。</p>
<p>8 和 6 的最小公倍數是 24：3 個位元組（24 位元）剛好切成 4 段 6 位元。我們把「Hi!」編一次：</p>
<figure class="figure"><svg viewBox="0 0 660 296" class="fg" style="width:100%;max-width:660px" role="img" aria-label="Base64 編碼 Hi!：三個位元組共 24 個位元，重新切成四組 6 位元，得到 18、6、36、33，查表得到 S、G、k、h">
<text x="154" y="24" text-anchor="middle" class="fg-t sm">H = 0x48</text><text x="330" y="24" text-anchor="middle" class="fg-t sm">i = 0x69</text><text x="506" y="24" text-anchor="middle" class="fg-t sm">! = 0x21</text>
<path d="M68 46 V36 H240 V46" class="fg-l"/><path d="M244 46 V36 H416 V46" class="fg-l"/><path d="M420 46 V36 H592 V46" class="fg-l"/>
<rect x="66" y="50" width="22" height="30" class="fg-b hot"/><text x="77" y="70" text-anchor="middle" class="fg-t mono">0</text>
<rect x="88" y="50" width="22" height="30" class="fg-b hot"/><text x="99" y="70" text-anchor="middle" class="fg-t mono">1</text>
<rect x="110" y="50" width="22" height="30" class="fg-b hot"/><text x="121" y="70" text-anchor="middle" class="fg-t mono">0</text>
<rect x="132" y="50" width="22" height="30" class="fg-b hot"/><text x="143" y="70" text-anchor="middle" class="fg-t mono">0</text>
<rect x="154" y="50" width="22" height="30" class="fg-b hot"/><text x="165" y="70" text-anchor="middle" class="fg-t mono">1</text>
<rect x="176" y="50" width="22" height="30" class="fg-b hot"/><text x="187" y="70" text-anchor="middle" class="fg-t mono">0</text>
<rect x="198" y="50" width="22" height="30" class="fg-b alt"/><text x="209" y="70" text-anchor="middle" class="fg-t mono">0</text>
<rect x="220" y="50" width="22" height="30" class="fg-b alt"/><text x="231" y="70" text-anchor="middle" class="fg-t mono">0</text>
<rect x="242" y="50" width="22" height="30" class="fg-b alt"/><text x="253" y="70" text-anchor="middle" class="fg-t mono">0</text>
<rect x="264" y="50" width="22" height="30" class="fg-b alt"/><text x="275" y="70" text-anchor="middle" class="fg-t mono">1</text>
<rect x="286" y="50" width="22" height="30" class="fg-b alt"/><text x="297" y="70" text-anchor="middle" class="fg-t mono">1</text>
<rect x="308" y="50" width="22" height="30" class="fg-b alt"/><text x="319" y="70" text-anchor="middle" class="fg-t mono">0</text>
<rect x="330" y="50" width="22" height="30" class="fg-b hot"/><text x="341" y="70" text-anchor="middle" class="fg-t mono">1</text>
<rect x="352" y="50" width="22" height="30" class="fg-b hot"/><text x="363" y="70" text-anchor="middle" class="fg-t mono">0</text>
<rect x="374" y="50" width="22" height="30" class="fg-b hot"/><text x="385" y="70" text-anchor="middle" class="fg-t mono">0</text>
<rect x="396" y="50" width="22" height="30" class="fg-b hot"/><text x="407" y="70" text-anchor="middle" class="fg-t mono">1</text>
<rect x="418" y="50" width="22" height="30" class="fg-b hot"/><text x="429" y="70" text-anchor="middle" class="fg-t mono">0</text>
<rect x="440" y="50" width="22" height="30" class="fg-b hot"/><text x="451" y="70" text-anchor="middle" class="fg-t mono">0</text>
<rect x="462" y="50" width="22" height="30" class="fg-b alt"/><text x="473" y="70" text-anchor="middle" class="fg-t mono">1</text>
<rect x="484" y="50" width="22" height="30" class="fg-b alt"/><text x="495" y="70" text-anchor="middle" class="fg-t mono">0</text>
<rect x="506" y="50" width="22" height="30" class="fg-b alt"/><text x="517" y="70" text-anchor="middle" class="fg-t mono">0</text>
<rect x="528" y="50" width="22" height="30" class="fg-b alt"/><text x="539" y="70" text-anchor="middle" class="fg-t mono">0</text>
<rect x="550" y="50" width="22" height="30" class="fg-b alt"/><text x="561" y="70" text-anchor="middle" class="fg-t mono">0</text>
<rect x="572" y="50" width="22" height="30" class="fg-b alt"/><text x="583" y="70" text-anchor="middle" class="fg-t mono">1</text>
<path d="M68 84 V94 H196 V84" class="fg-l on"/><path d="M200 84 V94 H328 V84" class="fg-l alt"/><path d="M332 84 V94 H460 V84" class="fg-l on"/><path d="M464 84 V94 H592 V84" class="fg-l alt"/>
<text x="132" y="114" text-anchor="middle" class="fg-t sm mono">010010 = 18</text><text x="264" y="114" text-anchor="middle" class="fg-t sm mono">000110 = 6</text><text x="396" y="114" text-anchor="middle" class="fg-t sm mono">100100 = 36</text><text x="528" y="114" text-anchor="middle" class="fg-t sm mono">100001 = 33</text>
<line x1="132" y1="122" x2="132" y2="132" class="fg-l"/><polygon points="132,140 127.5,132 136.5,132" class="fg-a"/>
<line x1="264" y1="122" x2="264" y2="132" class="fg-l"/><polygon points="264,140 259.5,132 268.5,132" class="fg-a"/>
<line x1="396" y1="122" x2="396" y2="132" class="fg-l"/><polygon points="396,140 391.5,132 400.5,132" class="fg-a"/>
<line x1="528" y1="122" x2="528" y2="132" class="fg-l"/><polygon points="528,140 523.5,132 532.5,132" class="fg-a"/>
<rect x="107" y="140" width="50" height="36" rx="6" class="fg-b hot"/><text x="132" y="164" text-anchor="middle" class="fg-t lg mono">S</text>
<rect x="239" y="140" width="50" height="36" rx="6" class="fg-b alt"/><text x="264" y="164" text-anchor="middle" class="fg-t lg mono">G</text>
<rect x="371" y="140" width="50" height="36" rx="6" class="fg-b hot"/><text x="396" y="164" text-anchor="middle" class="fg-t lg mono">k</text>
<rect x="503" y="140" width="50" height="36" rx="6" class="fg-b alt"/><text x="528" y="164" text-anchor="middle" class="fg-t lg mono">h</text>
<line x1="60" y1="196" x2="600" y2="196" class="fg-l dim"/>
<text x="110" y="222" class="fg-t mono">Hi!  →  SGkh</text><text x="300" y="222" class="fg-t sm">剛好 3 個位元組，不用補</text>
<text x="110" y="248" class="fg-t mono">Hi   →  SGk=</text><text x="300" y="248" class="fg-t sm">少 1 個位元組：補 0 湊滿，加一個 =</text>
<text x="110" y="274" class="fg-t mono">H    →  SA==</text><text x="300" y="274" class="fg-t sm">少 2 個位元組：補 0 湊滿，加兩個 =</text>
</svg><figcaption>上面：位元一個都沒變，只是從「8 個一組」改成「6 個一組」，每組查表換成一個字元。下面：最後不滿 3 個位元組時，用 = 告訴解碼的人「這裡是補的」。</figcaption></figure>
<ol>
<li>把三個字元換成位元組：H 是 <code>0x48</code>、i 是 <code>0x69</code>、! 是 <code>0x21</code>。</li>
<li>寫成 24 個位元：<code>01001000 01101001 00100001</code>。</li>
<li>改成 6 個一組：<code>010010 000110 100100 100001</code>，也就是 18、6、36、33。</li>
<li>查表：0–25 是 A–Z，26–51 是 a–z，52–61 是 0–9，62 是 <code>+</code>，63 是 <code>/</code>。18 是 S，6 是 G，36 是 26 + 10，也就是 a 往後數 10 個的 k，33 是 h。答案：<code>SGkh</code>。</li>
</ol>
<p>從這裡可以直接推出幾個常考的事實：</p>
<ul>
<li><b>變長 33%</b>：每 3 個位元組變成 4 個字元，4 ÷ 3 ≈ 1.33。一張 300 KB 的圖做成 data URL，大約變成 400 KB。</li>
<li><b>中文也一樣</b>：「猜」的 UTF-8 是 3 個位元組 <code>e7 8c 9c</code>，Base64 正好是 4 個字元 <code>54yc</code>。Base64 只看位元組，不管它原本是什麼。</li>
<li><b>Base64url</b>：<code>+</code> 和 <code>/</code> 在網址裡有特別意思，所以有一個變形，改用 <code>-</code> 和 <code>_</code>，通常也省略結尾的 <code>=</code>。JWT 用的就是這一種，所以拿一般的 Base64 解碼器去解 JWT，偶爾會報錯。</li>
</ul>
<h4>URL 編碼：另一種「把位元組變安全」</h4>
<p>網址裡只能放一小撮字元。其他的，先轉成 UTF-8 位元組，每個位元組寫成 <code>%</code> 加兩位十六進位，叫<b>百分比編碼</b>（percent-encoding）。「猜 高?a=1&amp;b」用 <code>encodeURIComponent</code> 編出來是 <code>%E7%8C%9C%20%E9%AB%98%3Fa%3D1%26b</code>：中文每個字變成三組 <code>%XX</code>，空白是 <code>%20</code>，連 <code>?</code>、<code>=</code>、<code>&amp;</code> 都被編掉了。</p>
<p>這裡有兩個常踩的坑。第一，<code>encodeURI</code> 會<b>保留</b> <code>?</code>、<code>&amp;</code>、<code>=</code>，因為它假設你給的是一整個網址；要放進查詢參數的「值」，一定要用 <code>encodeURIComponent</code>，不然使用者輸入一個 <code>&amp;</code>，參數就被切成兩個。第二，HTML 表單送出的格式把空白編成 <code>+</code>，不是 <code>%20</code>（<code>URLSearchParams</code> 也是）。兩種解碼器混用，加號就會變成空白，或空白變成加號。</p>

<h3><span class="badge lv2">進階</span>三、UTF-8：一個字為什麼是 1 到 4 個位元組</h3>
<p>先分清楚兩個常被混在一起的東西。<b>Unicode</b> 是一張大表，給世界上每個字元一個編號，叫<b>碼位</b>（code point），寫成 U+ 加十六進位：「A」是 U+0041，「中」是 U+4E2D，😀 是 U+1F600。<b>UTF-8</b> 則是把這個編號<b>變成位元組</b>的一種規則。同一張表，還有 UTF-16、UTF-32 等其他變法。</p>
<p>UTF-8 的規則只有一張表：</p>
<table>
<tr><th>碼位範圍</th><th>位元組數</th><th>位元的樣子（x 是填編號的位置）</th><th>例子</th></tr>
<tr><td>U+0000 到 U+007F</td><td>1</td><td><code>0xxxxxxx</code></td><td>英文、數字（跟 ASCII 一模一樣）</td></tr>
<tr><td>U+0080 到 U+07FF</td><td>2</td><td><code>110xxxxx 10xxxxxx</code></td><td>é、希臘文、阿拉伯文</td></tr>
<tr><td>U+0800 到 U+FFFF</td><td>3</td><td><code>1110xxxx 10xxxxxx 10xxxxxx</code></td><td>常用中文、日文</td></tr>
<tr><td>U+10000 到 U+10FFFF</td><td>4</td><td><code>11110xxx 10xxxxxx 10xxxxxx 10xxxxxx</code></td><td>表情符號、罕用漢字</td></tr>
</table>
<p>來編「中」。U+4E2D 落在第三列，要 3 個位元組，可以裝 4 + 6 + 6 = 16 個位元，剛好裝下：</p>
<figure class="figure"><svg viewBox="0 0 660 246" class="fg" style="width:100%;max-width:660px" role="img" aria-label="把 U+4E2D 的 16 個位元切成 4、6、6 三段，分別填進 1110、10、10 開頭的三個位元組，得到 E4 B8 AD">
<text x="330" y="20" text-anchor="middle" class="fg-t lg">「中」的碼位 U+4E2D，寫成 16 個位元</text>
<text x="186" y="42" text-anchor="middle" class="fg-t sm alt">前 4 位</text><text x="306" y="42" text-anchor="middle" class="fg-t sm acc">中間 6 位</text><text x="450" y="42" text-anchor="middle" class="fg-t sm warm">最後 6 位</text>
<rect x="138" y="48" width="24" height="28" class="fg-b alt"/><text x="150" y="67" text-anchor="middle" class="fg-t mono">0</text>
<rect x="162" y="48" width="24" height="28" class="fg-b alt"/><text x="174" y="67" text-anchor="middle" class="fg-t mono">1</text>
<rect x="186" y="48" width="24" height="28" class="fg-b alt"/><text x="198" y="67" text-anchor="middle" class="fg-t mono">0</text>
<rect x="210" y="48" width="24" height="28" class="fg-b alt"/><text x="222" y="67" text-anchor="middle" class="fg-t mono">0</text>
<rect x="234" y="48" width="24" height="28" class="fg-b hot"/><text x="246" y="67" text-anchor="middle" class="fg-t mono">1</text>
<rect x="258" y="48" width="24" height="28" class="fg-b hot"/><text x="270" y="67" text-anchor="middle" class="fg-t mono">1</text>
<rect x="282" y="48" width="24" height="28" class="fg-b hot"/><text x="294" y="67" text-anchor="middle" class="fg-t mono">1</text>
<rect x="306" y="48" width="24" height="28" class="fg-b hot"/><text x="318" y="67" text-anchor="middle" class="fg-t mono">0</text>
<rect x="330" y="48" width="24" height="28" class="fg-b hot"/><text x="342" y="67" text-anchor="middle" class="fg-t mono">0</text>
<rect x="354" y="48" width="24" height="28" class="fg-b hot"/><text x="366" y="67" text-anchor="middle" class="fg-t mono">0</text>
<rect x="378" y="48" width="24" height="28" class="fg-b warm"/><text x="390" y="67" text-anchor="middle" class="fg-t mono">1</text>
<rect x="402" y="48" width="24" height="28" class="fg-b warm"/><text x="414" y="67" text-anchor="middle" class="fg-t mono">0</text>
<rect x="426" y="48" width="24" height="28" class="fg-b warm"/><text x="438" y="67" text-anchor="middle" class="fg-t mono">1</text>
<rect x="450" y="48" width="24" height="28" class="fg-b warm"/><text x="462" y="67" text-anchor="middle" class="fg-t mono">1</text>
<rect x="474" y="48" width="24" height="28" class="fg-b warm"/><text x="486" y="67" text-anchor="middle" class="fg-t mono">0</text>
<rect x="498" y="48" width="24" height="28" class="fg-b warm"/><text x="510" y="67" text-anchor="middle" class="fg-t mono">1</text>
<path d="M186 76 V100 H178 V134" class="fg-l alt"/><polygon points="178,142 173.5,134 182.5,134" class="fg-a alt"/>
<path d="M306 76 V100 H352 V134" class="fg-l on"/><polygon points="352,142 347.5,134 356.5,134" class="fg-a on"/>
<path d="M450 76 V100 H548 V134" class="fg-l warm"/><polygon points="548,142 543.5,134 552.5,134" class="fg-a warm"/>
<rect x="46" y="142" width="22" height="28" class="fg-b"/><text x="57" y="161" text-anchor="middle" class="fg-t mono">1</text>
<rect x="68" y="142" width="22" height="28" class="fg-b"/><text x="79" y="161" text-anchor="middle" class="fg-t mono">1</text>
<rect x="90" y="142" width="22" height="28" class="fg-b"/><text x="101" y="161" text-anchor="middle" class="fg-t mono">1</text>
<rect x="112" y="142" width="22" height="28" class="fg-b"/><text x="123" y="161" text-anchor="middle" class="fg-t mono">0</text>
<rect x="134" y="142" width="22" height="28" class="fg-b alt"/><text x="145" y="161" text-anchor="middle" class="fg-t mono">0</text>
<rect x="156" y="142" width="22" height="28" class="fg-b alt"/><text x="167" y="161" text-anchor="middle" class="fg-t mono">1</text>
<rect x="178" y="142" width="22" height="28" class="fg-b alt"/><text x="189" y="161" text-anchor="middle" class="fg-t mono">0</text>
<rect x="200" y="142" width="22" height="28" class="fg-b alt"/><text x="211" y="161" text-anchor="middle" class="fg-t mono">0</text>
<rect x="242" y="142" width="22" height="28" class="fg-b"/><text x="253" y="161" text-anchor="middle" class="fg-t mono">1</text>
<rect x="264" y="142" width="22" height="28" class="fg-b"/><text x="275" y="161" text-anchor="middle" class="fg-t mono">0</text>
<rect x="286" y="142" width="22" height="28" class="fg-b hot"/><text x="297" y="161" text-anchor="middle" class="fg-t mono">1</text>
<rect x="308" y="142" width="22" height="28" class="fg-b hot"/><text x="319" y="161" text-anchor="middle" class="fg-t mono">1</text>
<rect x="330" y="142" width="22" height="28" class="fg-b hot"/><text x="341" y="161" text-anchor="middle" class="fg-t mono">1</text>
<rect x="352" y="142" width="22" height="28" class="fg-b hot"/><text x="363" y="161" text-anchor="middle" class="fg-t mono">0</text>
<rect x="374" y="142" width="22" height="28" class="fg-b hot"/><text x="385" y="161" text-anchor="middle" class="fg-t mono">0</text>
<rect x="396" y="142" width="22" height="28" class="fg-b hot"/><text x="407" y="161" text-anchor="middle" class="fg-t mono">0</text>
<rect x="438" y="142" width="22" height="28" class="fg-b"/><text x="449" y="161" text-anchor="middle" class="fg-t mono">1</text>
<rect x="460" y="142" width="22" height="28" class="fg-b"/><text x="471" y="161" text-anchor="middle" class="fg-t mono">0</text>
<rect x="482" y="142" width="22" height="28" class="fg-b warm"/><text x="493" y="161" text-anchor="middle" class="fg-t mono">1</text>
<rect x="504" y="142" width="22" height="28" class="fg-b warm"/><text x="515" y="161" text-anchor="middle" class="fg-t mono">0</text>
<rect x="526" y="142" width="22" height="28" class="fg-b warm"/><text x="537" y="161" text-anchor="middle" class="fg-t mono">1</text>
<rect x="548" y="142" width="22" height="28" class="fg-b warm"/><text x="559" y="161" text-anchor="middle" class="fg-t mono">1</text>
<rect x="570" y="142" width="22" height="28" class="fg-b warm"/><text x="581" y="161" text-anchor="middle" class="fg-t mono">0</text>
<rect x="592" y="142" width="22" height="28" class="fg-b warm"/><text x="603" y="161" text-anchor="middle" class="fg-t mono">1</text>
<text x="134" y="198" text-anchor="middle" class="fg-t lg mono acc">E4</text><text x="330" y="198" text-anchor="middle" class="fg-t lg mono acc">B8</text><text x="526" y="198" text-anchor="middle" class="fg-t lg mono acc">AD</text>
<text x="134" y="222" text-anchor="middle" class="fg-t sm">開頭 1110：三個一組的第一個</text><text x="330" y="222" text-anchor="middle" class="fg-t sm">開頭 10：接續的位元組</text><text x="526" y="222" text-anchor="middle" class="fg-t sm">開頭 10：接續的位元組</text>
</svg><figcaption>白色格子是 UTF-8 規定的「標頭」，彩色格子是「中」的編號本身。編號被切成三段，依序填進三個位元組，結果就是你在 xxd 裡看到的 e4 b8 ad。</figcaption></figure>
<p>這個設計有三個很聰明的地方，你在除錯時都會用到：</p>
<ul>
<li><b>跟 ASCII 完全相容</b>：純英文的檔案，用 ASCII 讀和用 UTF-8 讀，一個位元組都不差。</li>
<li><b>看第一個位元組就知道長度</b>：<code>0</code> 開頭是 1 個，<code>110</code> 是 2 個，<code>1110</code> 是 3 個，<code>11110</code> 是 4 個。</li>
<li><b>從中間也找得回邊界</b>：接續的位元組一律是 <code>10</code> 開頭，不可能被誤認成一個字的開頭。所以就算從一串資料的中間開始讀，最多丟掉一個字，後面就對齊了。</li>
</ul>
<h4>JavaScript 的字串長度，數的不是字</h4>
<p>JavaScript（還有 Java、C#）的字串內部用的是 UTF-16：大部分字元佔 2 個位元組，叫一個「碼元」（code unit）；U+FFFF 以上的字元（表情符號、部分罕用字）要用兩個碼元湊成一對。<code>.length</code> 數的是碼元，不是字：</p>
<pre><code>"猜高低".length                         // 3（碼元）
new TextEncoder().encode("猜高低").length // 9（UTF-8 位元組）
"😀".length                              // 2（一對碼元）
[..."😀"].length                         // 1（碼位）
"👨‍👩‍👧".length                             // 8
// 三個人，再加兩個看不見的連接字元
[...new Intl.Segmenter().segment("👨‍👩‍👧")].length
// 1：使用者看到的「一個字」</code></pre>
<p>同一個「家庭」表情符號，長度可以是 1、5、8 或 18（UTF-8 位元組），全看你數的是什麼。暱稱限制「最多 12 個字」、資料庫欄位「最多 255」、訊息「最多 4 KB」，規格書上都要寫清楚數的是哪一種。HTML 的 <code>maxlength</code> 數的是 UTF-16 碼元，所以一個表情符號會吃掉兩格。</p>
<h4>三個真實世界的坑</h4>
<ul>
<li><b>MySQL 的 utf8 不是真的 UTF-8</b>：舊的 <code>utf8</code>（現在叫 utf8mb3）每個字最多只存 3 個位元組，表情符號存進去會報錯。請一律用 <code>utf8mb4</code>。</li>
<li><b>Excel 打開 CSV 變亂碼</b>：很多版本的 Excel 遇到沒有標記的 CSV，會用系統預設的舊編碼（繁中 Windows 上是 Big5 系列）去讀 UTF-8 的位元組。匯出給 Excel 的 CSV，開頭加上三個位元組 <code>EF BB BF</code>（BOM），它就知道是 UTF-8。</li>
<li><b>照位元組截斷，會把字切成兩半</b>：Go 的 <code>s[:255]</code>、資料庫的位元組上限，都可能剛好切在一個中文字的三個位元組中間，剩下的半個字解不回來，顯示成 <code>�</code>（U+FFFD，替代字元）。截斷要以碼位或字為單位。</li>
</ul>

<h3><span class="badge lv2">進階</span>四、位元組順序：大端與小端</h3>
<p>一個 32 位元的整數要放進 4 個位元組。問題是：哪一頭先放？就像寫日期，有人寫「2026/11/09」，有人寫「09/11/2026」，數字一樣，順序不同，讀錯就差很多。</p>
<figure class="figure"><svg viewBox="0 0 640 210" class="fg" style="width:100%;max-width:640px" role="img" aria-label="數字 0x12345678 用大端存是 12 34 56 78，用小端存是 78 56 34 12">
<text x="320" y="22" text-anchor="middle" class="fg-t lg">把 0x12345678 存進位址 100 到 103</text>
<text x="245" y="48" text-anchor="middle" class="fg-t sm mono">100</text><text x="341" y="48" text-anchor="middle" class="fg-t sm mono">101</text><text x="437" y="48" text-anchor="middle" class="fg-t sm mono">102</text><text x="533" y="48" text-anchor="middle" class="fg-t sm mono">103</text>
<text x="20" y="80" class="fg-t">大端 big-endian</text><text x="20" y="98" class="fg-t sm">網路傳輸用這種</text>
<rect x="200" y="58" width="90" height="40" rx="5" class="fg-b alt"/><text x="245" y="84" text-anchor="middle" class="fg-t lg mono">12</text>
<rect x="296" y="58" width="90" height="40" rx="5" class="fg-b alt"/><text x="341" y="84" text-anchor="middle" class="fg-t lg mono">34</text>
<rect x="392" y="58" width="90" height="40" rx="5" class="fg-b alt"/><text x="437" y="84" text-anchor="middle" class="fg-t lg mono">56</text>
<rect x="488" y="58" width="90" height="40" rx="5" class="fg-b alt"/><text x="533" y="84" text-anchor="middle" class="fg-t lg mono">78</text>
<text x="20" y="138" class="fg-t">小端 little-endian</text><text x="20" y="156" class="fg-t sm">x86、ARM 的記憶體</text>
<rect x="200" y="116" width="90" height="40" rx="5" class="fg-b hot"/><text x="245" y="142" text-anchor="middle" class="fg-t lg mono">78</text>
<rect x="296" y="116" width="90" height="40" rx="5" class="fg-b hot"/><text x="341" y="142" text-anchor="middle" class="fg-t lg mono">56</text>
<rect x="392" y="116" width="90" height="40" rx="5" class="fg-b hot"/><text x="437" y="142" text-anchor="middle" class="fg-t lg mono">34</text>
<rect x="488" y="116" width="90" height="40" rx="5" class="fg-b hot"/><text x="533" y="142" text-anchor="middle" class="fg-t lg mono">12</text>
<text x="320" y="190" text-anchor="middle" class="fg-t sm">大端：份量最大的那一頭放在最前面，跟我們寫數字的順序一樣。小端：最小的那一頭放前面。</text>
</svg><figcaption>同一個數字，兩種排法。CPU 自己用哪一種都沒關係；只有在位元組離開 CPU（寫進檔案、送上網路）、被另一邊讀回來時，雙方必須講好。</figcaption></figure>
<ul>
<li><b>你的電腦是小端</b>：x86-64 和 ARM（手機、Apple Silicon、雲端的 Graviton，在一般設定下）都是小端。</li>
<li><b>網路是大端</b>：TCP/IP 的標頭一律用大端，所以大端又叫<b>網路位元組順序</b>（network byte order）。連接埠 8080 是 <code>0x1F90</code>，在封包裡就是 <code>1F 90</code>。C 語言的 <code>htons()</code>、<code>ntohl()</code>，就是「主機順序和網路順序互換」。</li>
<li><b>JavaScript 的陷阱</b>：<code>DataView</code> 的 <code>getUint32(0)</code> <b>預設用大端</b>，要讀小端得寫 <code>getUint32(0, true)</code>；可是 <code>Uint32Array</code> 用的是本機順序，也就是小端。同一段 <code>ArrayBuffer</code>，兩種讀法讀出 <code>0x12345678</code> 和 <code>0x78563412</code>。Node 的 Buffer 乾脆把順序寫進名字：<code>readUInt32BE</code>、<code>readUInt32LE</code>。</li>
</ul>
<p>什麼時候會碰到？自己設計二進位協定（遊戲的封包、存檔格式）、解析別人的檔案格式（PNG 用大端，WAV 用小端）、在 WebSocket 上傳 ArrayBuffer。規格書第一行就該寫「所有整數一律小端」或「一律大端」，前端、後端、Unity 的 C# 都照著讀。</p>

<h3><span class="badge lv3">專業</span>五、整數溢位：計數器怎麼會變成負數</h3>
<p>先看負數怎麼存。現代電腦幾乎都用<b>二補數</b>（two's complement）：把 8 位元的 256 種組合排成一個圈，前半當正數，後半當負數。</p>
<figure class="figure"><svg viewBox="0 0 640 300" class="fg" style="width:100%;max-width:640px" role="img" aria-label="8 位元有號整數排成一個圈：從 0 順時針加到 127，再加 1 就跳到 -128；右邊說明二補數怎麼表示負數">
<circle cx="200" cy="150" r="110" class="fg-l"/>
<path d="M255 54.7 A110 110 0 0 1 295.3 95" class="fg-l on"/><polygon points="299.3,101.9 291.4,97.3 299.2,92.8" class="fg-a on"/>
<text x="236" y="100" text-anchor="middle" class="fg-t sm acc">+1 往這走</text>
<path d="M219.1 258.3 A110 110 0 0 1 184 258.8" class="fg-l warm"/><polygon points="176,257.4 184.7,254.4 183.1,263.2" class="fg-a warm"/>
<text x="200" y="236" text-anchor="middle" class="fg-t sm warm">再 +1 就溢位</text>
<circle cx="200" cy="40" r="4" class="fg-lamp on"/><text x="212" y="30" class="fg-t sm mono">0（00000000）</text>
<circle cx="181" cy="42" r="4" class="fg-lamp"/><text x="172" y="30" text-anchor="end" class="fg-t sm mono">-1（11111111）</text>
<circle cx="310" cy="150" r="4" class="fg-lamp"/><text x="320" y="154" class="fg-t sm mono">64</text>
<circle cx="90" cy="150" r="4" class="fg-lamp"/><text x="80" y="154" text-anchor="end" class="fg-t sm mono">-64</text>
<circle cx="219" cy="258" r="4" class="fg-lamp"/><text x="228" y="282" class="fg-t sm mono">127（01111111）</text>
<circle cx="181" cy="258" r="4" class="fg-lamp"/><text x="172" y="282" text-anchor="end" class="fg-t sm mono">-128（10000000）</text>
<text x="380" y="50" class="fg-t lg">8 位元有號整數</text>
<text x="380" y="80" class="fg-t sm mono">00000000 = 0</text>
<text x="380" y="102" class="fg-t sm mono">01111111 = 127（最大）</text>
<text x="380" y="124" class="fg-t sm mono">10000000 = -128（最小）</text>
<text x="380" y="146" class="fg-t sm mono">11111111 = -1</text>
<text x="380" y="182" class="fg-t">取負數：每一位反轉，再加 1</text>
<text x="380" y="206" class="fg-t sm mono">5     = 00000101</text>
<text x="380" y="228" class="fg-t sm mono">反轉  = 11111010</text>
<text x="380" y="250" class="fg-t sm mono">再加 1 = 11111011 = -5</text>
</svg><figcaption>二補數把數字排成一個圈。加法電路照常做，不用管正負；代價是走到 127 再加 1，會直接繞到 -128。32 位元、64 位元是同一個圈，只是大得多。（為了看得清楚，圈上 127 和 -128 的距離畫得比實際遠。）</figcaption></figure>
<p>二補數的好處是，第 0.4 課那個加法器完全不用改：5 + (-5) 就是 <code>00000101 + 11111011</code>，進位溢出最左邊後剩下 <code>00000000</code>，剛好是 0。壞處就是圖下方那條橘色的線：<b>最大值再加 1，會繞回最小值</b>。這就是<b>溢位</b>（overflow）。</p>
<p>32 位元有號整數的最大值是 2,147,483,647，大約 21 億。這個數字在真實世界裡被撞到過很多次：</p>
<ul>
<li><b>2014 年，YouTube</b>：一支音樂影片的觀看次數逼近 2,147,483,647，YouTube 把計數器換成 64 位元。</li>
<li><b>2015 年，波音 787</b>：發電機控制單元用一個每 10 毫秒加 1 的 32 位元有號計數器，連續通電 2<sup>31</sup> × 0.01 秒 ≈ 248 天就會溢位，可能讓發電機全部進入保護模式。美國航空主管機關要求定期斷電重開。</li>
<li><b>2038 年問題</b>：很多舊系統用 32 位元有號整數存「從 1970 年起過了幾秒」。它會在 2038-01-19 03:14:07 UTC 溢位，時間跳回 1901 年。</li>
<li><b>資料庫的自動遞增 ID</b>：用 <code>INT</code> 當主鍵的大表，總有一天插入失敗。改成 <code>BIGINT</code> 要改整張表，在大表上可能要好幾個小時。一開始就用 64 位元。</li>
</ul>
<h4>各個語言遇到溢位會怎樣</h4>
<table>
<tr><th>語言</th><th>溢位時</th></tr>
<tr><td>Go、Java、C#（預設）</td><td>安靜地繞回去，不報錯。C# 可以用 <code>checked</code> 讓它丟例外；Java 有 <code>Math.addExact</code>。</td></tr>
<tr><td>Rust</td><td>除錯版本會 panic；正式版本預設繞回去。要明確處理可用 <code>checked_add</code>。</td></tr>
<tr><td>C、C++</td><td>有號整數溢位是「未定義行為」，編譯器可以假設它不會發生，做出你想不到的最佳化。</td></tr>
<tr><td>Python</td><td>整數沒有上限，自動變大。</td></tr>
<tr><td>JavaScript</td><td>一般數字是浮點數，不會繞回，但超過 2<sup>53</sup> 就不準（下一節）。位元運算會先轉成 32 位元整數：<code>(2**31) | 0</code> 是 -2147483648。</td></tr>
</table>
<p>遊戲裡最常見的是金幣和分數。Unity 的 C# <code>int</code> 是 32 位元，玩家刷到 21 億金幣，下一筆收入就變成負數；更危險的是扣款：<code>coins - price</code> 在檢查之前就溢位，可能讓檢查被繞過。金額類的欄位一律用 64 位元，加減之前先檢查範圍。</p>

<h3><span class="badge lv3">專業</span>六、浮點數：0.1 為什麼存不準</h3>
<p>浮點數就是二進位的科學記號。JavaScript 的 number、Go 的 <code>float64</code>、C# 的 <code>double</code>，都照 IEEE 754 標準用 64 個位元存一個數：</p>
<figure class="figure"><svg viewBox="0 0 660 250" class="fg" style="width:100%;max-width:660px" role="img" aria-label="64 位元浮點數分成符號 1 位、指數 11 位、小數 52 位；下方兩條數線比較 1 附近和 2 的 53 次方附近可以表示的數有多密">
<text x="330" y="22" text-anchor="middle" class="fg-t lg">64 位元浮點數（double，IEEE 754）</text>
<rect x="40" y="38" width="50" height="38" rx="4" class="fg-b warm"/><text x="65" y="62" text-anchor="middle" class="fg-t sm">符號 1</text>
<rect x="90" y="38" width="150" height="38" rx="4" class="fg-b alt"/><text x="165" y="62" text-anchor="middle" class="fg-t sm">指數 11 位：放大多少</text>
<rect x="240" y="38" width="380" height="38" rx="4" class="fg-b hot"/><text x="430" y="62" text-anchor="middle" class="fg-t sm">小數 52 位：有效數字（精度就在這裡）</text>
<text x="330" y="100" text-anchor="middle" class="fg-t sm">值 = ± 1.小數 × 2 的「指數」次方。有效數字固定，數字越大，能分辨的最小差距就越大</text>
<text x="170" y="138" text-anchor="middle" class="fg-t">在 1 附近</text>
<line x1="40" y1="170" x2="300" y2="170" class="fg-l"/>
<line x1="40" y1="164" x2="40" y2="176" class="fg-l"/><line x1="53" y1="164" x2="53" y2="176" class="fg-l"/><line x1="66" y1="164" x2="66" y2="176" class="fg-l"/><line x1="79" y1="164" x2="79" y2="176" class="fg-l"/><line x1="92" y1="164" x2="92" y2="176" class="fg-l"/><line x1="105" y1="164" x2="105" y2="176" class="fg-l"/><line x1="118" y1="164" x2="118" y2="176" class="fg-l"/><line x1="131" y1="164" x2="131" y2="176" class="fg-l"/><line x1="144" y1="164" x2="144" y2="176" class="fg-l"/><line x1="157" y1="164" x2="157" y2="176" class="fg-l"/><line x1="170" y1="164" x2="170" y2="176" class="fg-l"/><line x1="183" y1="164" x2="183" y2="176" class="fg-l"/><line x1="196" y1="164" x2="196" y2="176" class="fg-l"/><line x1="209" y1="164" x2="209" y2="176" class="fg-l"/><line x1="222" y1="164" x2="222" y2="176" class="fg-l"/><line x1="235" y1="164" x2="235" y2="176" class="fg-l"/><line x1="248" y1="164" x2="248" y2="176" class="fg-l"/><line x1="261" y1="164" x2="261" y2="176" class="fg-l"/><line x1="274" y1="164" x2="274" y2="176" class="fg-l"/><line x1="287" y1="164" x2="287" y2="176" class="fg-l"/><line x1="300" y1="164" x2="300" y2="176" class="fg-l"/>
<text x="170" y="200" text-anchor="middle" class="fg-t sm">相鄰兩個數只差 2.2 × 10⁻¹⁶</text>
<text x="490" y="138" text-anchor="middle" class="fg-t">在 2<tspan dy="-5" class="fg-t sm">53</tspan><tspan dy="5"> 附近</tspan></text>
<line x1="360" y1="170" x2="620" y2="170" class="fg-l"/>
<line x1="380" y1="162" x2="380" y2="178" class="fg-l on"/><line x1="490" y1="162" x2="490" y2="178" class="fg-l on"/><line x1="600" y1="162" x2="600" y2="178" class="fg-l on"/>
<circle cx="435" cy="170" r="5" class="fg-b warm"/>
<text x="380" y="198" text-anchor="middle" class="fg-t sm mono">2^53</text><text x="490" y="198" text-anchor="middle" class="fg-t sm mono">2^53+2</text><text x="600" y="198" text-anchor="middle" class="fg-t sm mono">2^53+4</text>
<text x="435" y="226" text-anchor="middle" class="fg-t sm warm">2^53+1 存不下，被捨入成 2^53</text>
</svg><figcaption>浮點數的「格點」不是平均分布的：越靠近 0 越密，越大越疏。過了 2<sup>53</sup>，連相鄰的整數都分不出來了。</figcaption></figure>
<p>問題出在「二進位的小數」。十進位寫不完 1/3（0.3333…），二進位也寫不完 1/10：0.1 在二進位是 <code>0.000110011001100…</code>，無限循環。52 位元裝不下無限，只好捨入。所以你存進去的 0.1，其實是：</p>
<pre><code>0.1000000000000000055511151231257827021181583404541015625</code></pre>
<p>每一個小誤差都很小，但它們會疊加、會在運算中放大：</p>
<pre><code>0.1 + 0.2          // 0.30000000000000004
0.07 * 100         // 7.000000000000001
(1.005).toFixed(2) // "1.00"，不是 "1.01"
// 因為 1.005 其實存成 1.00499999…
let s = 0; for (let i = 0; i &lt; 1e6; i++) s += 0.01;
s                  // 10000.000000171856
// 加一百萬次一分錢，多出來了</code></pre>
<p>這不是 JavaScript 的 bug。Go、Java、C#、Python，只要是 IEEE 754 的 double，算出來一模一樣。</p>
<h4>為什麼錢絕對不能用浮點數</h4>
<p>會計要的是「每一分都對得上」。浮點數保證不了：顯示時四捨五入可以把 0.30000000000000004 藏起來，但一百萬筆交易加總、乘上匯率、再分攤手續費，誤差就會變成一分一分對不上的帳。正確的做法有兩種：</p>
<ul>
<li><b>用最小單位的整數</b>：100.25 元存成 10025 分。加減完全精確。注意每種貨幣的小數位數不同：日圓沒有小數，美元兩位，有些中東貨幣三位；加密貨幣的最小單位更小，以太幣的 wei 是 10<sup>-18</sup>，金額很快就超過 2<sup>53</sup>，要用 <code>BigInt</code> 或字串。</li>
<li><b>用十進位型別</b>：PostgreSQL 的 <code>NUMERIC</code>、MySQL 的 <code>DECIMAL</code>、Java 的 <code>BigDecimal</code>、C# 的 <code>decimal</code>、Python 的 <code>Decimal</code>。它們用十進位存數字，0.1 就是真的 0.1。Go 沒有內建，常見做法是用整數分，或社群的 decimal 套件。</li>
</ul>
<p>就算用了整數，<b>除法</b>還是要想清楚。100 元平分給 3 個人，每人 33.33 元，加起來 99.99 元，少的那一分給誰？正確的寫法是先算出每人 3333 分，再把剩下的 1 分明確地分給某一個人，總和一定是 10000 分。捨入規則也要寫進規格：一般的四捨五入，還是金融業常用的「銀行家捨入」（剛好一半時捨入到偶數）。</p>
<h4>遊戲裡的浮點數</h4>
<p>遊戲引擎為了效能，座標多半用 32 位元浮點數（Unity 的 <code>Vector3</code> 就是）。float 只有大約 7 位有效數字，離原點越遠越不準：在座標 100,000 附近，能表示的最小間距大約是 0.0078，角色和鏡頭就會開始抖。開放世界遊戲的對策是<b>浮動原點</b>（floating origin）：玩家走遠了，就把整個世界平移回原點附近。</p>
<p>另一個問題是<b>可重現性</b>。同一段浮點數運算，在不同 CPU、不同編譯設定下，最後幾位可能不同。多人遊戲如果靠「每台機器各自模擬、只交換輸入」來同步（lockstep），一點點差異累積下去，兩台機器的世界就分岔了。這類遊戲常改用<b>定點數</b>（fixed-point）：用整數表示「千分之幾」，保證每台機器算出一模一樣的位元。</p>

<h3><span class="badge lv3">專業</span>七、JSON 的數字：規格沒限制，解析器有</h3>
<p>JSON 的規格（RFC 8259）沒有限制數字的大小和精度，但它明講：大部分實作會把數字讀成 IEEE 754 的 double，所以超出那個範圍就不保證互通。實際上會發生什麼事：</p>
<pre><code>JSON.parse('{"id": 9007199254740993}').id
// 9007199254740992，最後一位被改了

JSON.stringify({ n: 1n })
// TypeError: Do not know how to serialize a BigInt

JSON.stringify({ a: NaN, b: Infinity })
// '{"a":null,"b":null}'</code></pre>
<p>第一行最可怕：沒有任何錯誤，數字就被默默改掉了。後端用 64 位元整數產生的 ID（例如分散式 ID 產生器做出來的雪花 ID），送到前端被改掉最後幾位，前端再拿這個 ID 去查詢，就查到別人的資料或查不到。各大平台的對策都一樣：</p>
<ul>
<li><b>大整數在 JSON 裡用字串</b>：Twitter 的 API 很早就同時給 <code>id</code> 和 <code>id_str</code>；Protocol Buffers 轉成 JSON 時，<code>int64</code> 一律變成字串。</li>
<li><b>後端語言也會中招</b>：Go 把 JSON 解進 <code>interface{}</code> 時，數字一律變成 <code>float64</code>，大 ID 一樣被捨入。要用 <code>json.Decoder</code> 的 <code>UseNumber()</code>，或直接解進有型別的 struct。</li>
<li><b>資料庫驅動程式也知道這件事</b>：Node 的 <code>pg</code> 套件預設把 PostgreSQL 的 <code>bigint</code> 讀成字串，就是為了不讓你丟失精度。</li>
<li><b>金額</b>：用最小單位的整數（在安全範圍內），或用十進位字串（<code>"100.25"</code>）傳，兩端再用十進位型別處理。</li>
</ul>
<p>還有一個單位上的提醒：<code>Number.MAX_SAFE_INTEGER</code> 是 2<sup>53</sup> - 1 = 9,007,199,254,740,991，大約九千兆。一般流水號用不到，但奈秒時間戳記、雪花 ID、鏈上金額都會超過。</p>

<h3><span class="badge lv4">專家</span>八、編碼、加密、雜湊：這次看裡面</h3>
<p>上一課的表格告訴你三者的差別。這裡補上面試官接著會追問的部分。</p>
<h4>雜湊的四個性質</h4>
<pre><code>$ printf 'hello' | shasum -a 256
2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
$ printf 'hellp' | shasum -a 256
fdd7585e08c4e2afd71dcabdb4636c89d557a3f42db9e2040c8bbd1708aa4ce7</code></pre>
<ol>
<li><b>固定長度</b>：不管輸入是 5 個位元組還是 5 GB，SHA-256 都輸出 32 個位元組（64 個十六進位字元）。</li>
<li><b>同樣輸入，同樣輸出</b>：所以能拿來比對檔案、當快取的鍵。</li>
<li><b>雪崩效應</b>（avalanche effect）：只改最後一個字母，輸出完全看不出關聯。</li>
<li><b>單向</b>：從輸出推不回輸入，也找不到兩個輸入有相同輸出（找到就叫碰撞，MD5 和 SHA-1 已經被找到，所以不能再拿來做安全用途）。</li>
</ol>
<h4>密碼不能直接用 SHA-256 存</h4>
<p>SHA-256 的設計目標是<b>快</b>，一張遊戲顯示卡每秒能算數十億次。資料庫外流後，攻擊者把常見密碼一個一個算過去，一般密碼幾分鐘就被猜出來。存密碼要用<b>故意設計得很慢、很吃記憶體</b>的演算法：Argon2id、bcrypt 或 scrypt，並且每個使用者配一個隨機的<b>鹽</b>（salt），讓同樣的密碼存出不同的結果。第 0.15 課和模組 5 會再展開。</p>
<h4>有金鑰的雜湊：HMAC</h4>
<p>金流或第三方服務打 webhook 給你時，會用一把只有雙方知道的金鑰，對內容算 HMAC-SHA256，放在標頭裡。你用同一把金鑰再算一次，一樣才代表「內容沒被改過，而且真的是對方送的」。比對時要用固定時間的比較（Node 的 <code>crypto.timingSafeEqual</code>），不能用 <code>===</code>：一般的字串比較遇到第一個不同就停，攻擊者可以從回應時間的微小差異，一個字元一個字元猜出正確的簽章。</p>
<p>JWT 的第三段也是同一件事：前兩段 Base64url 誰都能解開，簽章只保證「沒被改過」，不保證「別人看不到」。這就是為什麼 JWT 裡不能放秘密。</p>
<h4>文字本身也能拿來攻擊</h4>
<ul>
<li><b>長得一樣、位元組不同</b>：西里爾字母的「а」（U+0430）和英文的「a」（U+0061）看起來一樣。攻擊者註冊一個用它拼成的網域或帳號名稱來冒充別人。瀏覽器對可疑的混合文字網域，會改顯示 <code>xn--</code> 開頭的 Punycode。</li>
<li><b>同一個字，兩種寫法</b>：「é」可以是一個碼位 U+00E9，也可以是「e」加上一個組合用的重音符號 U+0301。看起來一樣，<code>===</code> 卻是 false。比較或儲存帳號名稱之前，先用 <code>normalize('NFC')</code> 統一寫法。</li>
</ul>

<h3>九、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>一個字就是一個位元組</td><td>UTF-8 裡英文 1 個、中文通常 3 個、表情符號 4 個以上；JavaScript 的 <code>.length</code> 數的又是 UTF-16 碼元。</td></tr>
<tr><td>Unicode 和 UTF-8 是同一個東西</td><td>Unicode 是字元和編號的對照表；UTF-8 是把編號變成位元組的其中一種方法。</td></tr>
<tr><td>0.1 + 0.2 是 JavaScript 的 bug</td><td>所有使用 IEEE 754 double 的語言都一樣。這是二進位存十進位小數的本質。</td></tr>
<tr><td>錢用 double 存，顯示時四捨五入就好</td><td>誤差會在加總、乘法、分攤時累積。用最小單位的整數或十進位型別。</td></tr>
<tr><td>JSON 的數字要多大都可以</td><td>規格沒限制，但多數解析器讀成 double，超過 2<sup>53</sup> 會默默變值。大整數用字串。</td></tr>
<tr><td>Kubernetes Secret 是加密過的</td><td>Secret 裡的值只是 Base64 編碼。真的要保護，要開啟靜態加密，或改用外部的金鑰管理服務。</td></tr>
</table>

<h3>十、跟你的工作連起來</h3>
<ul>
<li><b>Vue／TypeScript 前端</b>：輸入框的字數限制要想清楚數的是什麼；後端回來的大 ID 和金額用字串型別接；用 <code>Intl.NumberFormat</code> 顯示金額，不要自己拿浮點數四捨五入。</li>
<li><b>Node.js／Go 後端</b>：主鍵用 64 位元；金額用整數分或 decimal；JSON 裡的 64 位元整數改成字串；資料庫連線和資料表都用 utf8mb4。</li>
<li><b>Cocos／Unity 遊戲</b>：自訂二進位封包要在規格寫明大端或小端（<code>DataView</code> 預設大端，C# 的 <code>BitConverter</code> 跟著機器走，通常是小端）；金幣、分數用 64 位元；大地圖注意 float 精度。</li>
<li><b>Docker／Kubernetes</b>：建 Secret 時，<code>echo 'secret' | base64</code> 會把換行也編進去（得到 <code>c2VjcmV0Cg==</code>），密碼就多了一個看不見的 <code>\\n</code>，登入一直失敗。要用 <code>printf</code> 或 <code>echo -n</code>（得到 <code>c2VjcmV0</code>），或直接用 <code>kubectl create secret --from-literal</code>。</li>
</ul>

<h3>十一、面試會怎麼問</h3>
<p>先自己講一遍，再打開參考答案。</p>
<ol>
<li>「Base64 為什麼會讓資料變大大約三分之一？它能用來保護資料嗎？」</li>
<li>「UTF-8 是怎麼把一個中文字變成位元組的？為什麼一個表情符號在 JavaScript 裡 <code>.length</code> 是 2？」</li>
<li>「為什麼 0.1 + 0.2 不等於 0.3？系統裡的金額你會怎麼存？」</li>
<li>「大端和小端是什麼？網路傳輸用哪一種？在哪些情況下你需要在意？」</li>
<li>「後端傳一個 64 位元的訂單編號給前端，前端顯示出來最後幾位不一樣。為什麼？怎麼修？」</li>
<li>「雜湊、編碼、加密差在哪？使用者密碼應該怎麼存？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>Base64 用 64 個可列印字元表示資料，每個字元只承載 6 個位元，所以每 3 個位元組（24 位元）要用 4 個字元表示，長度變成 4/3 倍，結尾不足時用 = 補齊。它的目的是讓二進位資料能安全通過只接受文字的管道，例如 JSON、電子郵件、HTTP 標頭。它是編碼，不需要金鑰，任何人都能解回來，所以完全沒有保護作用。</li>
<li>先查出字元的 Unicode 碼位，例如「中」是 U+4E2D，落在 U+0800 到 U+FFFF 的範圍，要用 3 個位元組，格式是 1110xxxx 10xxxxxx 10xxxxxx；把碼位的 16 個位元切成 4、6、6 填進去，得到 E4 B8 AD。JavaScript 字串內部用 UTF-16，<code>.length</code> 數的是 16 位元碼元；表情符號的碼位超過 U+FFFF，要用兩個碼元（代理對）表示，所以長度是 2。要數使用者看到的字，要用 <code>Intl.Segmenter</code>。</li>
<li>double 用二進位存小數，0.1 和 0.2 在二進位都是無限循環小數，只能捨入成最接近的值，相加後的誤差剛好讓結果不是最接近 0.3 的那個 double。金額我會存成最小貨幣單位的 64 位元整數，或用資料庫的 DECIMAL／NUMERIC 和語言的十進位型別；除法和分攤時明確處理餘數與捨入規則；在 JSON 裡用整數或十進位字串傳遞。</li>
<li>多位元組的數字在記憶體或傳輸時，大端把最高位的位元組放在最前面，小端把最低位的放在最前面。x86 和 ARM 的記憶體一般是小端，TCP/IP 標頭用大端，叫網路位元組順序。只要位元組離開程式、要被另一方讀回來，例如自訂二進位協定、檔案格式、ArrayBuffer 和 DataView 的處理、跨語言交換資料，就要在規格裡講清楚。</li>
<li>JavaScript 的 number 是 double，只能精確表示到 2<sup>53</sup> - 1；JSON.parse 遇到更大的整數會默默捨入成最接近的 double，所以最後幾位被改掉。修法是後端把 64 位元整數序列化成字串，前端也用字串處理 ID；需要運算時用 BigInt。同時檢查中間層，例如 Go 解進 interface{} 也會有同樣問題。</li>
<li>編碼只是換一種表示法，不用金鑰就能還原，例如 Base64；加密要金鑰才能還原，用來保密，例如 AES；雜湊是單向的固定長度摘要，無法還原，用來檢查完整性或當指紋。密碼要用專門設計得很慢的演算法，例如 Argon2id 或 bcrypt，每個使用者配隨機的鹽，不能用 MD5、SHA-256 這種快速雜湊，更不能用可逆的加密。</li>
</ol>
</details>

<h3>十二、練功題（做得出來才算真的懂）</h3>
<ol>
<li>不用電腦，手算「Go」這兩個字元的 Base64。（G 是 <code>0x47</code>，o 是 <code>0x6F</code>）</li>
<li>手算「高」（U+9AD8）的 UTF-8 位元組，再用 <code>printf '高' | xxd</code> 對答案。</li>
<li>一個 8 位元有號整數，100 + 100 會變成多少？用二補數的圈解釋。</li>
<li>連接埠 443 用大端寫進封包，是哪兩個位元組？如果有人誤用小端，對方會讀成哪個連接埠？</li>
<li>寫一個函式 <code>split(totalCents, n)</code>：把一筆金額平分給 n 個人，回傳每個人的金額，總和必須剛好等於原本的金額。</li>
<li>為什麼 <code>echo 'secret' | base64</code> 和 <code>printf secret | base64</code> 結果不同？差的那一段解開是什麼？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li><code>01000111 01101111</code> 只有 16 位元，補兩個 0 湊成 18 位元：<code>010001 110110 111100</code>，也就是 17、54、60，查表是 R、2、8。少了 1 個位元組，結尾補一個 =，答案是 <code>R28=</code>。</li>
<li>9AD8 是 <code>1001 1010 1101 1000</code>，切成 4、6、6：<code>1001</code>、<code>101011</code>、<code>011000</code>。填進去：<code>1110 1001</code> = E9、<code>10 101011</code> = AB、<code>10 011000</code> = 98。答案 <code>e9 ab 98</code>。</li>
<li>200 超過 127。在圈上從 100 往前走 100 格，過了 127 就繞到 -128 那一側：200 - 256 = -56。位元上，<code>01100100 + 01100100 = 11001000</code>，最高位是 1，被當成負數，就是 -56。</li>
<li>443 是 <code>0x01BB</code>，大端是 <code>01 BB</code>。如果被當成小端，讀成 <code>0xBB01</code> = 47873。</li>
<li>先算整數除法和餘數，再把餘數一分一分分給前幾個人：<code>function split(total, n) { const base = Math.floor(total / n), rest = total % n; return Array.from({ length: n }, (_, i) =&gt; base + (i &lt; rest ? 1 : 0)); }</code>。<code>split(10000, 3)</code> 得到 <code>[3334, 3333, 3333]</code>，總和 10000。（負數金額要另外處理。）</li>
<li><code>echo</code> 會在結尾多輸出一個換行字元，所以被編碼的是 7 個位元組 <code>secret\\n</code>，得到 <code>c2VjcmV0Cg==</code>；多出來的 <code>Cg==</code> 解開就是換行（<code>0x0A</code>）。<code>printf</code> 只輸出 6 個位元組，得到 <code>c2VjcmV0</code>。</li>
</ol>
</details>

<h3>十三、想再挖深</h3>
<ul>
<li><b>Joel Spolsky〈The Absolute Minimum Every Software Developer Absolutely, Positively Must Know About Unicode and Character Sets (No Excuses!)〉</b>：2003 年的老文章，到今天還是講字元編碼最好的入門。</li>
<li><b>David Goldberg〈What Every Computer Scientist Should Know About Floating-Point Arithmetic〉</b>：浮點數的經典論文，數學比較多；先讀輕鬆版的 <a href="https://floating-point-gui.de/">floating-point-gui.de</a> 再回來看。</li>
<li><b>RFC 4648（Base16、Base32、Base64）、RFC 3629（UTF-8）、RFC 8259（JSON）</b>：三份都不長，這一章的每一條規則，都能在裡面找到原文。</li>
<li><b>Charles Petzold《Code: The Hidden Language of Computer Hardware and Software》</b>：從摩斯電碼、點字一路講到二進位和字元編碼，跟第 0.1 課到這一課是同一條路。</li>
</ul>
` });
