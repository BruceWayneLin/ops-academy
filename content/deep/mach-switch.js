DEEP({ 'mach-switch': `
<p>課文裡你點了開關，把 8、4、1 打開，看到 13。課文最後丟下一句很重的話：什麼東西都是數字。這一章就把這句話拆開來看：晶片裡的電壓怎麼變成乾淨的 0 和 1、位元怎麼排成數字、負數和小數怎麼寫、文字又怎麼變成位元組。每一種寫法，都是一份大家事先講好的<b>約定</b>，正式名稱叫<b>編碼</b>（encoding）。很多讓人抓狂的 bug，其實都藏在約定的細節裡：0.1 + 0.2 不等於 0.3、一個 emoji 的長度是 2、32 位元的時間會在 2038 年用完。看懂約定，這些 bug 就不再是玄學。</p>

<h3><span class="badge lv1">基礎</span>一、0 和 1 其實是兩段電壓</h3>
<p>晶片裡沒有真的燈泡。所謂的 0 和 1，是導線上的<b>電壓</b>（voltage）。以一顆核心電壓 1 伏特左右的處理器為例：接近 0 伏特就是 0，接近 1 伏特就是 1。中間有一段「禁區」，正常運作的電路不會停在那裡。</p>
<figure class="figure"><svg viewBox="0 0 640 250" class="fg" style="width:100%;max-width:640px" role="img" aria-label="左邊是電壓的三個區：讀成 0、禁區、讀成 1；右邊是一段帶雜訊的輸入訊號，經過一個閘之後變成乾淨的 0 和 1">
<rect x="52" y="30" width="80" height="54" class="fg-b hot"/>
<rect x="52" y="84" width="80" height="72" class="fg-b warm"/>
<rect x="52" y="156" width="80" height="54" class="fg-b alt"/>
<text x="92" y="62" text-anchor="middle" class="fg-t acc">讀成 1</text>
<text x="92" y="124" text-anchor="middle" class="fg-t warm">禁區</text>
<text x="92" y="188" text-anchor="middle" class="fg-t alt">讀成 0</text>
<text x="44" y="34" text-anchor="end" class="fg-t sm">1.0 V</text>
<text x="44" y="88" text-anchor="end" class="fg-t sm">0.7 V</text>
<text x="44" y="160" text-anchor="end" class="fg-t sm">0.3 V</text>
<text x="44" y="214" text-anchor="end" class="fg-t sm">0 V</text>
<line x1="132" y1="84" x2="360" y2="84" class="fg-l dim dash"/>
<line x1="132" y1="156" x2="360" y2="156" class="fg-l dim dash"/>
<text x="265" y="20" text-anchor="middle" class="fg-t sm">輸入：沾了雜訊</text>
<polyline points="170,196 180,188 190,200 200,190 210,198 220,186 228,194 236,52 246,44 256,58 266,42 276,54 286,46 296,56 304,192 314,200 324,188 334,198 344,190 354,200 360,194" class="fg-l"/>
<line x1="366" y1="120" x2="382" y2="120" class="fg-l"/><polygon points="390,120 382,115.5 382,124.5" class="fg-a"/>
<rect x="390" y="96" width="60" height="48" rx="6" class="fg-b hot"/>
<text x="420" y="125" text-anchor="middle" class="fg-t acc">閘</text>
<line x1="450" y1="120" x2="466" y2="120" class="fg-l on"/><polygon points="474,120 466,115.5 466,124.5" class="fg-a on"/>
<text x="555" y="20" text-anchor="middle" class="fg-t sm acc">輸出：乾淨的 0 和 1</text>
<polyline points="480,206 526,206 526,34 590,34 590,206 630,206" class="fg-l on"/>
<text x="265" y="238" text-anchor="middle" class="fg-t sm">還在 1 區，就讀成 1</text>
<text x="555" y="238" text-anchor="middle" class="fg-t sm">重新從電源拉到 0 V 或 1 V</text>
</svg><figcaption>門檻的數字只是示意，實際看製程。重點是：只要訊號沒掉進禁區，下一個閘就輸出一個全新、乾淨的值。</figcaption></figure>
<p>關鍵在右半邊。訊號在導線上跑，一定會沾到雜訊：隔壁導線的干擾、電源的抖動、溫度的變化。可是只要它還留在「1 區」，下一個閘就把它當成 1，然後<b>重新從電源</b>輸出一個乾淨的 1。雜訊在每一關都被洗掉，不會一路累積。</p>
<p>用傳話遊戲來想：如果要傳的是「一段旋律的準確音高」，傳過一百個人一定走音；如果每個人只需要說「是」或「不是」，傳過一百個人還是對的。這就是數位（digital）贏過類比（analog）的地方：錄音帶拷貝十次音質就變差，檔案複製一千次，每個位元組都一模一樣。</p>
<h4>為什麼不用十種電壓</h4>
<p>把 1 伏特切成十個等級，每一級只剩 0.1 伏特寬，雜訊抖個 0.05 伏特就會讀錯。而且每個閘都得變成精密的類比放大器，「每過一關就洗乾淨」的好處就沒了。歷史上真的有人做過三進位的電腦（1958 年蘇聯的 Setun），但二進位在工程上簡單太多，最後全世界都選了它。</p>

<h3><span class="badge lv1">基礎</span>二、同一串位元，三種寫法：二進位、十六進位、八進位</h3>
<p>課文教你把「開著的位」加起來，從二進位讀回十進位（decimal）。反過來，十進位要怎麼變成二進位？一直除以 2，把餘數倒著讀回來。拿 202 來試：</p>
<table>
<tr><th>算式</th><th>商</th><th>餘數</th></tr>
<tr><td>202 ÷ 2</td><td>101</td><td>0</td></tr>
<tr><td>101 ÷ 2</td><td>50</td><td>1</td></tr>
<tr><td>50 ÷ 2</td><td>25</td><td>0</td></tr>
<tr><td>25 ÷ 2</td><td>12</td><td>1</td></tr>
<tr><td>12 ÷ 2</td><td>6</td><td>0</td></tr>
<tr><td>6 ÷ 2</td><td>3</td><td>0</td></tr>
<tr><td>3 ÷ 2</td><td>1</td><td>1</td></tr>
<tr><td>1 ÷ 2</td><td>0</td><td>1</td></tr>
</table>
<p>餘數由下往上讀：11001010。驗算：128 + 64 + 8 + 2 = 202。可是 11001010 太長，人眼很難一眼看清楚。所以工程師幾乎都用<b>十六進位</b>（hexadecimal，簡稱 hex）：每 4 個位元剛好對一個十六進位的字，0 到 9 照舊，再用 A 到 F 代表 10 到 15。</p>
<figure class="figure"><svg viewBox="0 0 600 214" class="fg" style="width:100%;max-width:600px" role="img" aria-label="位元組 11001010 切成兩半：1100 是 12，寫成 C；1010 是 10，寫成 A；合起來是 0xCA，也就是十進位的 202">
<text x="300" y="20" text-anchor="middle" class="fg-t lg">同一個位元組，三種寫法</text>
<path d="M93 54 V44 H297 V54" class="fg-l alt"/>
<text x="195" y="38" text-anchor="middle" class="fg-t sm alt">1100 = 12 → C</text>
<path d="M305 54 V44 H507 V54" class="fg-l on"/>
<text x="407" y="38" text-anchor="middle" class="fg-t sm acc">1010 = 10 → A</text>
<rect x="91" y="60" width="50" height="44" rx="5" class="fg-b hot"/><text x="116" y="89" text-anchor="middle" class="fg-t lg mono">1</text>
<rect x="143" y="60" width="50" height="44" rx="5" class="fg-b hot"/><text x="168" y="89" text-anchor="middle" class="fg-t lg mono">1</text>
<rect x="195" y="60" width="50" height="44" rx="5" class="fg-b"/><text x="220" y="89" text-anchor="middle" class="fg-t lg mono">0</text>
<rect x="247" y="60" width="50" height="44" rx="5" class="fg-b"/><text x="272" y="89" text-anchor="middle" class="fg-t lg mono">0</text>
<rect x="303" y="60" width="50" height="44" rx="5" class="fg-b hot"/><text x="328" y="89" text-anchor="middle" class="fg-t lg mono">1</text>
<rect x="355" y="60" width="50" height="44" rx="5" class="fg-b"/><text x="380" y="89" text-anchor="middle" class="fg-t lg mono">0</text>
<rect x="407" y="60" width="50" height="44" rx="5" class="fg-b hot"/><text x="432" y="89" text-anchor="middle" class="fg-t lg mono">1</text>
<rect x="459" y="60" width="50" height="44" rx="5" class="fg-b"/><text x="484" y="89" text-anchor="middle" class="fg-t lg mono">0</text>
<text x="116" y="122" text-anchor="middle" class="fg-t sm">128</text><text x="168" y="122" text-anchor="middle" class="fg-t sm">64</text><text x="220" y="122" text-anchor="middle" class="fg-t sm">32</text><text x="272" y="122" text-anchor="middle" class="fg-t sm">16</text>
<text x="328" y="122" text-anchor="middle" class="fg-t sm">8</text><text x="380" y="122" text-anchor="middle" class="fg-t sm">4</text><text x="432" y="122" text-anchor="middle" class="fg-t sm">2</text><text x="484" y="122" text-anchor="middle" class="fg-t sm">1</text>
<text x="300" y="154" text-anchor="middle" class="fg-t">十進位：128 + 64 + 8 + 2 = 202</text>
<text x="300" y="178" text-anchor="middle" class="fg-t">十六進位：0xCA　　二進位：0b11001010</text>
<text x="300" y="202" text-anchor="middle" class="fg-t sm">4 個位元剛好一個十六進位字，所以一個位元組永遠寫成兩個字</text>
</svg><figcaption>換成十六進位不用做任何算術，只是四個一組分開來讀。這就是工程師看位元組時都用它的原因。</figcaption></figure>
<p>8 個位元叫一個<b>位元組</b>（byte），正好是兩個 hex 字。你在很多地方都會看到它：</p>
<ul>
<li>網頁顏色 <code>#FF8800</code>：紅 FF（255）、綠 88（136）、藍 00（0），三個位元組。</li>
<li>雜湊值：SHA-256 有 256 個位元，也就是 32 個位元組、64 個 hex 字。Git 的 commit 編號用的是 SHA-1，160 個位元，所以是 40 個字。</li>
<li>記憶體位址、網路卡的 MAC 位址、UUID，全部用 hex 寫。</li>
</ul>
<p><b>八進位</b>（octal）則是每 3 個位元一組。你最常碰到它的地方是 Linux 的檔案權限：<code>chmod 755</code> 的 7 是 111（讀、寫、執行都打開），5 是 101（可以讀、可以執行，不能寫）。三個數字分別給擁有者、群組和其他人，所以 755 就是 <code>rwxr-xr-x</code>。權限本來就是一排開關，用八進位寫剛好三個一組。</p>
<h4>1 KB 到底是 1,000 還是 1,024</h4>
<p>兩種都有人用，而且差距會越滾越大。國際單位的 KB、MB、GB 是 1,000 的倍數；以 1,024 為倍數的正式寫法是 KiB、MiB、GiB。1 GB 是 10<sup>9</sup> 個位元組，1 GiB 是 2<sup>30</sup> = 1,073,741,824 個位元組，差了大約 7%；到了 TB 和 TiB，差將近 10%。所以 1 TB 的硬碟在 Windows 上會顯示成大約 931 GB：Windows 是用 1,024 在算，卻寫成 GB。</p>
<div class="note"><b>維運的坑：</b>Kubernetes 的資源寫法分得很清楚。<code>memory: 512Mi</code> 是 536,870,912 個位元組，<code>512M</code> 是 512,000,000 個位元組，而小寫的 <code>512m</code> 是「千分之一」的 m，意思是 0.512 個位元組。官方文件特別提醒過大小寫的差別。</div>

<h3><span class="badge lv2">進階</span>三、負數：電腦為什麼選了「二補數」</h3>
<p>開關沒有負號。要表示負數，只能從位元的排法下手。歷史上試過三種做法，用 4 個位元來比較：</p>
<table>
<tr><th>做法</th><th>−5 怎麼寫</th><th>問題</th></tr>
<tr><td>正負號加大小（sign-magnitude）：最左邊一位當正負號</td><td>1101</td><td>有兩個 0（0000 和 1000）；加法器得先看正負號，再決定要加還是要減</td></tr>
<tr><td>一補數（ones' complement）：每一位都反過來</td><td>1010</td><td>還是有兩個 0（0000 和 1111）；最高位的進位要繞回來再加一次</td></tr>
<tr><td><b>二補數</b>（two's complement）：反過來，再加 1</td><td>1011</td><td>只有一個 0，而且同一個加法器不用知道正負，就能算對</td></tr>
</table>
<p>今天所有主流處理器都用二補數。最好記的讀法是：<b>最左邊那一位的份量是負的</b>。4 個位元的份量本來是 8、4、2、1，二補數改成 −8、4、2、1。所以 1011 = −8 + 2 + 1 = −5，0111 = 4 + 2 + 1 = 7，1000 = −8。</p>
<p>要把一個數變號，就是課文說的「每一位反過來，再加 1」。走一次：5 是 0101，反過來是 1010，加 1 得 1011，就是 −5。再做一次：1011 反過來是 0100，加 1 得 0101，又回到 5。</p>
<figure class="figure"><svg viewBox="0 0 660 344" class="fg" style="width:100%;max-width:660px" role="img" aria-label="4 位元的 16 種組合排成一圈：圈外是當成二補數的有號值，圈內是當成無號數的值，0111 到 1000 是有號數的斷崖，1111 到 0000 是無號數的斷崖">
<circle cx="178" cy="172" r="118" class="fg-l dim"/>
<rect x="159" y="45" width="38" height="18" rx="4" class="fg-b alt"/>
<text x="178" y="58" text-anchor="middle" class="fg-t sm mono">0000</text>
<text x="178" y="22" text-anchor="middle" class="fg-t alt">0</text>
<text x="178" y="90" text-anchor="middle" class="fg-t sm">0</text>
<rect x="204.2" y="54" width="38" height="18" rx="4" class="fg-b alt"/>
<text x="223.2" y="67" text-anchor="middle" class="fg-t sm mono">0001</text>
<text x="236.9" y="33.7" text-anchor="middle" class="fg-t alt">1</text>
<text x="210.9" y="96.5" text-anchor="middle" class="fg-t sm">1</text>
<rect x="242.4" y="79.6" width="38" height="18" rx="4" class="fg-b alt"/>
<text x="261.4" y="92.6" text-anchor="middle" class="fg-t sm mono">0010</text>
<text x="286.9" y="67.1" text-anchor="middle" class="fg-t alt">2</text>
<text x="238.8" y="115.2" text-anchor="middle" class="fg-t sm">2</text>
<rect x="268" y="117.8" width="38" height="18" rx="4" class="fg-b alt"/>
<text x="287" y="130.8" text-anchor="middle" class="fg-t sm mono">0011</text>
<text x="320.3" y="117.1" text-anchor="middle" class="fg-t alt">3</text>
<text x="257.5" y="143.1" text-anchor="middle" class="fg-t sm">3</text>
<rect x="277" y="163" width="38" height="18" rx="4" class="fg-b alt"/>
<text x="296" y="176" text-anchor="middle" class="fg-t sm mono">0100</text>
<text x="332" y="176" text-anchor="middle" class="fg-t alt">4</text>
<text x="264" y="176" text-anchor="middle" class="fg-t sm">4</text>
<rect x="268" y="208.2" width="38" height="18" rx="4" class="fg-b alt"/>
<text x="287" y="221.2" text-anchor="middle" class="fg-t sm mono">0101</text>
<text x="320.3" y="234.9" text-anchor="middle" class="fg-t alt">5</text>
<text x="257.5" y="208.9" text-anchor="middle" class="fg-t sm">5</text>
<rect x="242.4" y="246.4" width="38" height="18" rx="4" class="fg-b alt"/>
<text x="261.4" y="259.4" text-anchor="middle" class="fg-t sm mono">0110</text>
<text x="286.9" y="284.9" text-anchor="middle" class="fg-t alt">6</text>
<text x="238.8" y="236.8" text-anchor="middle" class="fg-t sm">6</text>
<rect x="204.2" y="272" width="38" height="18" rx="4" class="fg-b alt"/>
<text x="223.2" y="285" text-anchor="middle" class="fg-t sm mono">0111</text>
<text x="236.9" y="318.3" text-anchor="middle" class="fg-t alt">7</text>
<text x="210.9" y="255.5" text-anchor="middle" class="fg-t sm">7</text>
<rect x="159" y="281" width="38" height="18" rx="4" class="fg-b warm"/>
<text x="178" y="294" text-anchor="middle" class="fg-t sm mono">1000</text>
<text x="178" y="330" text-anchor="middle" class="fg-t warm">−8</text>
<text x="178" y="262" text-anchor="middle" class="fg-t sm">8</text>
<rect x="113.8" y="272" width="38" height="18" rx="4" class="fg-b warm"/>
<text x="132.8" y="285" text-anchor="middle" class="fg-t sm mono">1001</text>
<text x="119.1" y="318.3" text-anchor="middle" class="fg-t warm">−7</text>
<text x="145.1" y="255.5" text-anchor="middle" class="fg-t sm">9</text>
<rect x="75.6" y="246.4" width="38" height="18" rx="4" class="fg-b warm"/>
<text x="94.6" y="259.4" text-anchor="middle" class="fg-t sm mono">1010</text>
<text x="69.1" y="284.9" text-anchor="middle" class="fg-t warm">−6</text>
<text x="117.2" y="236.8" text-anchor="middle" class="fg-t sm">10</text>
<rect x="50" y="208.2" width="38" height="18" rx="4" class="fg-b warm"/>
<text x="69" y="221.2" text-anchor="middle" class="fg-t sm mono">1011</text>
<text x="35.7" y="234.9" text-anchor="middle" class="fg-t warm">−5</text>
<text x="98.5" y="208.9" text-anchor="middle" class="fg-t sm">11</text>
<rect x="41" y="163" width="38" height="18" rx="4" class="fg-b warm"/>
<text x="60" y="176" text-anchor="middle" class="fg-t sm mono">1100</text>
<text x="24" y="176" text-anchor="middle" class="fg-t warm">−4</text>
<text x="92" y="176" text-anchor="middle" class="fg-t sm">12</text>
<rect x="50" y="117.8" width="38" height="18" rx="4" class="fg-b warm"/>
<text x="69" y="130.8" text-anchor="middle" class="fg-t sm mono">1101</text>
<text x="35.7" y="117.1" text-anchor="middle" class="fg-t warm">−3</text>
<text x="98.5" y="143.1" text-anchor="middle" class="fg-t sm">13</text>
<rect x="75.6" y="79.6" width="38" height="18" rx="4" class="fg-b warm"/>
<text x="94.6" y="92.6" text-anchor="middle" class="fg-t sm mono">1110</text>
<text x="69.1" y="67.1" text-anchor="middle" class="fg-t warm">−2</text>
<text x="117.2" y="115.2" text-anchor="middle" class="fg-t sm">14</text>
<rect x="113.8" y="54" width="38" height="18" rx="4" class="fg-b warm"/>
<text x="132.8" y="67" text-anchor="middle" class="fg-t sm mono">1111</text>
<text x="119.1" y="33.7" text-anchor="middle" class="fg-t warm">−1</text>
<text x="145.1" y="96.5" text-anchor="middle" class="fg-t sm">15</text>
<line x1="203.2" y1="298.5" x2="206.5" y2="315.2" class="fg-l warm"/>
<line x1="152.8" y1="45.5" x2="149.5" y2="28.8" class="fg-l alt"/>
<path d="M187 120.8 A 52 52 0 0 1 226.9 154.2" class="fg-l on"/>
<polygon points="228.2,158 221.3,152 229.7,148.9" class="fg-a on"/>
<text x="178" y="176" text-anchor="middle" class="fg-t sm acc">加 1</text>
<text x="384" y="40" class="fg-t lg">4 位元的 16 種組合</text>
<text x="384" y="64" class="fg-t sm">圈外：當成有號數（二補數）</text>
<text x="384" y="84" class="fg-t sm">圈內：當成無號數</text>
<text x="384" y="122" class="fg-t acc">加 1 = 順時針走一格</text>
<text x="384" y="160" class="fg-t warm">0111 → 1000</text>
<text x="384" y="180" class="fg-t sm">有號數從 7 跳成 −8：溢位</text>
<text x="384" y="218" class="fg-t alt">1111 → 0000</text>
<text x="384" y="238" class="fg-t sm">無號數從 15 變回 0：進位掉出去</text>
<text x="384" y="276" class="fg-t sm">−1 就是「再加 1 會變成 0」的那一格</text>
<text x="384" y="296" class="fg-t sm">所以 1111 當有號數看，就是 −1</text>
</svg><figcaption>同樣 16 種組合，看你當它是有號還是無號，就有兩種讀法。加法器只會「順時針走幾格」，根本不知道你心裡想的是哪一種。</figcaption></figure>
<p>為什麼這樣排，加法器就不用管正負號？看這個圈：加 1 就是順時針走一格。4 位元的加法器只有 4 個位元，1111 再加 1 會變成 10000，最左邊那個 1 沒地方放、掉出去了，只留下 0000。所以 1111 的行為跟 −1 一模一樣。−5 加 7 呢？從 1011 順時針走 7 格，停在 0010，也就是 2。答案對了，而且加法器從頭到尾都不知道自己在算負數。</p>
<h4>範圍為什麼不對稱</h4>
<p>n 個位元的二補數，範圍是 −2<sup>n−1</sup> 到 2<sup>n−1</sup> − 1。8 位元是 −128 到 127，32 位元是 −2,147,483,648 到 2,147,483,647。負數多一個，因為 0 佔掉了非負數那一邊的一格。多出來的那個數很危險：−128 變號，反過來是 0111 1111，加 1 變成 1000 0000，又回到 −128。Java 的 <code>Math.abs(Integer.MIN_VALUE)</code> 會回傳一個負數，就是這個原因。</p>
<h4>變寬的時候：符號延伸</h4>
<p>把 4 位元的 −5（1011）放進 8 位元，不能在前面補 0，因為 0000 1011 是 11。要把最左邊那一位複製過去：1111 1011，這叫<b>符號延伸</b>（sign extension）。同一串位元要補 0 還是補 1，取決於你說它是有號還是無號。位元自己並不知道。</p>
<h4>你天天碰到的二補數</h4>
<ul>
<li>JavaScript 的數字平常是浮點數，但一碰到位元運算子，就先轉成 32 位元二補數：<code>~5</code> 是 <code>-6</code>，<code>(2 ** 31) | 0</code> 是 <code>-2147483648</code>。</li>
<li>Go 的 <code>int8</code> 存 127 再加 1，執行時會靜靜繞成 −128，不會報錯。</li>
<li><b>2038 年問題</b>：很多系統用有號 32 位元整數，存「從 1970 年 1 月 1 日起過了幾秒」（Unix time）。最大值 2,147,483,647 秒落在 2038 年 1 月 19 日 03:14:07（UTC），再過一秒就繞成負數，日期跳回 1901 年。現代的 64 位元 Linux 早就改用 64 位元的時間，但嵌入式設備、舊的資料庫欄位和檔案格式裡還有很多 32 位元的時間。</li>
</ul>

<h3><span class="badge lv2">進階</span>四、小數：浮點數，和 0.1 + 0.2 的真相</h3>
<p>整數寫不出 3.14，也寫不出 6.02 × 10<sup>23</sup> 這麼大的數。解法是科學記號：任何數都寫成「1 點多少 × 2 的幾次方」。這套寫法的標準叫 <b>IEEE 754</b>，幾乎所有硬體都照它做。JavaScript 的 <code>number</code>、Go 的 <code>float64</code>、C# 的 <code>double</code>，都是它的 64 位元版本，叫 double：</p>
<figure class="figure"><svg viewBox="0 0 660 236" class="fg" style="width:100%;max-width:660px" role="img" aria-label="0.1 的 64 個位元切成三段：1 位符號、11 位指數、52 位小數部分，各自解讀之後合成 1.6 乘以 2 的負 4 次方">
<text x="330" y="22" text-anchor="middle" class="fg-t lg">0.1 存成 double：0x3FB999999999999A</text>
<rect x="20" y="40" width="44" height="40" rx="4" class="fg-b warm"/><text x="42" y="66" text-anchor="middle" class="fg-t lg mono">0</text>
<rect x="68" y="40" width="150" height="40" rx="4" class="fg-b alt"/><text x="143" y="65" text-anchor="middle" class="fg-t mono">01111111011</text>
<rect x="222" y="40" width="418" height="40" rx="4" class="fg-b hot"/><text x="431" y="65" text-anchor="middle" class="fg-t mono">1001100110011001100110011001…1010</text>
<text x="42" y="98" text-anchor="middle" class="fg-t sm">符號 1 位</text>
<text x="143" y="98" text-anchor="middle" class="fg-t sm">指數 11 位</text>
<text x="431" y="98" text-anchor="middle" class="fg-t sm">小數部分 52 位</text>
<text x="20" y="132" class="fg-t warm">符號</text><text x="90" y="132" class="fg-t">0 → 正數</text>
<text x="20" y="158" class="fg-t alt">指數</text><text x="90" y="158" class="fg-t">01111111011 = 1019，減去偏移量 1023，得到 −4</text>
<text x="20" y="184" class="fg-t acc">小數</text><text x="90" y="184" class="fg-t">補上省略的「1.」：1.1001100110011…（二進位）≈ 1.6</text>
<text x="20" y="218" class="fg-t lg">合起來</text><text x="90" y="218" class="fg-t acc">+1.6 × 2⁻⁴ ≈ 0.1（精確值是 0.1000000000000000055…）</text>
</svg><figcaption>三段各管一件事：正負、大小的等級、精確到哪裡。0.1 的小數部分是「1001」一直重複，到第 52 位被迫四捨五入。</figcaption></figure>
<ul>
<li><b>符號</b>（sign）1 位：0 是正、1 是負。</li>
<li><b>指數</b>（exponent）11 位：存的是「真正的指數 + 1023」，這樣就不用另外處理負的指數。</li>
<li><b>小數部分</b>（fraction）52 位：「1.」後面的位元。前面那個「1.」永遠都在，所以不用存，白賺一位，總共有 53 位的精度，大約是十進位的 15 到 17 位數。</li>
</ul>
<p>Unity 的 <code>Vector3</code>、GPU 的著色器（shader）常用的則是 32 位元版本，叫 float：1 + 8 + 23 位，精度只有 24 位，大約是十進位的 7 位數。</p>
<h4>0.1 為什麼存不準</h4>
<p>十進位寫不準 1/3，只能寫 0.3333……一直下去。二進位寫不準的則是 1/10。把 0.1 一直乘 2，每次把整數部分拿出來，就是它的二進位：</p>
<table>
<tr><th>乘 2 之後</th><td>0.2</td><td>0.4</td><td>0.8</td><td>1.6</td><td>1.2</td><td>0.4</td><td>0.8</td><td>1.6</td><td>1.2</td><td>…</td></tr>
<tr><th>拿出的位元</th><td>0</td><td>0</td><td>0</td><td>1</td><td>1</td><td>0</td><td>0</td><td>1</td><td>1</td><td>…</td></tr>
</table>
<p>0.1 = 0.000110011001100110011……，「0011」永遠重複下去。52 位一定裝不完，只能在最後一位四捨五入。所以你寫的 <code>0.1</code>，實際存進去的是最接近它的那一個 double：</p>
<table>
<tr><th>你寫的</th><th>實際存的值</th></tr>
<tr><td>0.1</td><td>0.1000000000000000055511151231257827…</td></tr>
<tr><td>0.2</td><td>0.2000000000000000111022302462515654…</td></tr>
<tr><td>0.1 + 0.2 的結果（再四捨五入一次）</td><td>0.3000000000000000444089209850062616…</td></tr>
<tr><td>0.3</td><td>0.2999999999999999888977697537484345…</td></tr>
</table>
<p>兩個本來就偏大一點的數加起來，再四捨五入，落到的是 0.3 隔壁的那一個 double，剛好差一格（大約 5.55 × 10<sup>−17</sup>）。JavaScript 印數字的時候，會印出「剛好能還原回這個 double 的最短十進位」，所以你看到 <code>0.30000000000000004</code>。這不是 JavaScript 的 bug，Python、Go、Java、C# 全部一樣。</p>
<h4>精度是「相對」的</h4>
<p>double 之間的間隔，跟數字的大小成正比。在 1 和 2 之間，每一格是 2<sup>−52</sup>，大約 2.2 × 10<sup>−16</sup>，這就是 <code>Number.EPSILON</code>。數字越大，格子越寬。過了 2<sup>53</sup> = 9,007,199,254,740,992，每一格就是 2，整數開始跳號：<code>2 ** 53 + 1 === 2 ** 53</code> 是 <code>true</code>。這就是 <code>Number.MAX_SAFE_INTEGER</code> 等於 2<sup>53</sup> − 1 的原因。</p>
<p>float 更明顯。遊戲世界裡，離原點 100,000 單位的地方，float 每一格大約是 0.0078。如果 1 單位是 1 公尺，物體的位置只能 8 毫米 8 毫米地跳，角色和鏡頭就開始抖。大地圖的遊戲常用「浮動原點」（floating origin）來解決：玩家走遠了，就把整個世界搬回原點附近。</p>
<h4>幾個特殊值</h4>
<p>IEEE 754 還保留了幾個特別的位元組合：正、負無限大（在 JavaScript 裡 <code>1 / 0</code> 是 <code>Infinity</code>）；+0 和 −0（<code>0 === -0</code> 是 <code>true</code>，但 <code>Object.is(0, -0)</code> 是 <code>false</code>）；還有 NaN（not a number），它連自己都不相等，<code>NaN === NaN</code> 是 <code>false</code>，所以要用 <code>Number.isNaN</code> 來判斷。</p>

<h3><span class="badge lv3">專業</span>五、文字：從 ASCII、Unicode 到 UTF-8</h3>
<p>課文說「A 是 65」。這個 65 來自 1963 年的 <b>ASCII</b>：7 個位元、128 個字元，包含英文字母、數字、標點，和一些控制字元。它的排法很用心：</p>
<ul>
<li>'A' 是 65（0100 0001），'a' 是 97（0110 0001）。大小寫只差 32，也就是只差一個位元（0x20）。<code>65 | 32</code> 就是 97：把那個開關打開，就變成小寫。</li>
<li>'0' 是 48（0x30），所以字元 '7' 代表的數字，就是 55 − 48 = 7。</li>
</ul>
<p>128 個字元裝不下中文。早年各地各做各的：台灣用 <b>Big5</b>、中國大陸用 GB2312、日本用 Shift_JIS。同樣兩個位元組，在 Big5 是一個字，換成別的編碼就是另一個字，這就是<b>亂碼</b>（mojibake）的由來。</p>
<h4>Unicode 是一張表，UTF-8 是一種寫法</h4>
<p><b>Unicode</b> 把全世界的字放進同一張大表，每個字一個編號，叫<b>碼位</b>（code point），寫成 U+ 加上十六進位：'A' 是 U+0041，「中」是 U+4E2D，😀 是 U+1F600。這張表從 U+0000 到 U+10FFFF，一共 1,114,112 個位置，目前已經分配了十五萬個以上。</p>
<p>Unicode 只規定「中是第 0x4E2D 號」，沒有規定這個號碼要怎麼寫成位元組。寫法有好幾種，最重要的是 <b>UTF-8</b>：每個字用 1 到 4 個位元組，第一個位元組開頭的幾個位元，說明這個字總共佔幾個位元組。</p>
<table>
<tr><th>碼位範圍</th><th>位元組數</th><th>範本</th><th>例子</th></tr>
<tr><td>U+0000 到 U+007F</td><td>1</td><td><code>0xxxxxxx</code></td><td>英文字母、數字</td></tr>
<tr><td>U+0080 到 U+07FF</td><td>2</td><td><code>110xxxxx 10xxxxxx</code></td><td>é、希臘字母、阿拉伯字母</td></tr>
<tr><td>U+0800 到 U+FFFF</td><td>3</td><td><code>1110xxxx 10xxxxxx 10xxxxxx</code></td><td>常用的中文、日文</td></tr>
<tr><td>U+10000 到 U+10FFFF</td><td>4</td><td><code>11110xxx 10xxxxxx 10xxxxxx 10xxxxxx</code></td><td>emoji、罕用字</td></tr>
</table>
<figure class="figure"><svg viewBox="0 0 640 250" class="fg" style="width:100%;max-width:640px" role="img" aria-label="「中」的碼位 U+4E2D 的 16 個位元切成 4、6、6 三段，分別填進三個位元組的空位，得到 E4 B8 AD">
<text x="320" y="24" text-anchor="middle" class="fg-t lg">「中」的碼位 U+4E2D，寫成 16 個位元</text>
<rect x="55" y="40" width="30" height="32" rx="4" class="fg-b alt"/>
<text x="70" y="61" text-anchor="middle" class="fg-t mono">0</text>
<rect x="87" y="40" width="30" height="32" rx="4" class="fg-b alt"/>
<text x="102" y="61" text-anchor="middle" class="fg-t mono">1</text>
<rect x="119" y="40" width="30" height="32" rx="4" class="fg-b alt"/>
<text x="134" y="61" text-anchor="middle" class="fg-t mono">0</text>
<rect x="151" y="40" width="30" height="32" rx="4" class="fg-b alt"/>
<text x="166" y="61" text-anchor="middle" class="fg-t mono">0</text>
<rect x="193" y="40" width="30" height="32" rx="4" class="fg-b hot"/>
<text x="208" y="61" text-anchor="middle" class="fg-t mono">1</text>
<rect x="225" y="40" width="30" height="32" rx="4" class="fg-b hot"/>
<text x="240" y="61" text-anchor="middle" class="fg-t mono">1</text>
<rect x="257" y="40" width="30" height="32" rx="4" class="fg-b hot"/>
<text x="272" y="61" text-anchor="middle" class="fg-t mono">1</text>
<rect x="289" y="40" width="30" height="32" rx="4" class="fg-b hot"/>
<text x="304" y="61" text-anchor="middle" class="fg-t mono">0</text>
<rect x="321" y="40" width="30" height="32" rx="4" class="fg-b hot"/>
<text x="336" y="61" text-anchor="middle" class="fg-t mono">0</text>
<rect x="353" y="40" width="30" height="32" rx="4" class="fg-b hot"/>
<text x="368" y="61" text-anchor="middle" class="fg-t mono">0</text>
<rect x="395" y="40" width="30" height="32" rx="4" class="fg-b warm"/>
<text x="410" y="61" text-anchor="middle" class="fg-t mono">1</text>
<rect x="427" y="40" width="30" height="32" rx="4" class="fg-b warm"/>
<text x="442" y="61" text-anchor="middle" class="fg-t mono">0</text>
<rect x="459" y="40" width="30" height="32" rx="4" class="fg-b warm"/>
<text x="474" y="61" text-anchor="middle" class="fg-t mono">1</text>
<rect x="491" y="40" width="30" height="32" rx="4" class="fg-b warm"/>
<text x="506" y="61" text-anchor="middle" class="fg-t mono">1</text>
<rect x="523" y="40" width="30" height="32" rx="4" class="fg-b warm"/>
<text x="538" y="61" text-anchor="middle" class="fg-t mono">0</text>
<rect x="555" y="40" width="30" height="32" rx="4" class="fg-b warm"/>
<text x="570" y="61" text-anchor="middle" class="fg-t mono">1</text>
<rect x="13" y="140" width="22" height="30" rx="3" class="fg-b"/>
<text x="24" y="160" text-anchor="middle" class="fg-t mono">1</text>
<rect x="37" y="140" width="22" height="30" rx="3" class="fg-b"/>
<text x="48" y="160" text-anchor="middle" class="fg-t mono">1</text>
<rect x="61" y="140" width="22" height="30" rx="3" class="fg-b"/>
<text x="72" y="160" text-anchor="middle" class="fg-t mono">1</text>
<rect x="85" y="140" width="22" height="30" rx="3" class="fg-b"/>
<text x="96" y="160" text-anchor="middle" class="fg-t mono">0</text>
<rect x="109" y="140" width="22" height="30" rx="3" class="fg-b alt"/>
<text x="120" y="160" text-anchor="middle" class="fg-t mono">0</text>
<rect x="133" y="140" width="22" height="30" rx="3" class="fg-b alt"/>
<text x="144" y="160" text-anchor="middle" class="fg-t mono">1</text>
<rect x="157" y="140" width="22" height="30" rx="3" class="fg-b alt"/>
<text x="168" y="160" text-anchor="middle" class="fg-t mono">0</text>
<rect x="181" y="140" width="22" height="30" rx="3" class="fg-b alt"/>
<text x="192" y="160" text-anchor="middle" class="fg-t mono">0</text>
<line x1="118" y1="76" x2="156" y2="128" class="fg-l alt"/>
<polygon points="156,136 147.9,131.6 155.5,126.8" class="fg-a alt"/>
<text x="108" y="198" text-anchor="middle" class="fg-t lg mono">E4</text>
<text x="108" y="220" text-anchor="middle" class="fg-t sm">1110 開頭：「三個位元組」</text>
<rect x="225" y="140" width="22" height="30" rx="3" class="fg-b"/>
<text x="236" y="160" text-anchor="middle" class="fg-t mono">1</text>
<rect x="249" y="140" width="22" height="30" rx="3" class="fg-b"/>
<text x="260" y="160" text-anchor="middle" class="fg-t mono">0</text>
<rect x="273" y="140" width="22" height="30" rx="3" class="fg-b hot"/>
<text x="284" y="160" text-anchor="middle" class="fg-t mono">1</text>
<rect x="297" y="140" width="22" height="30" rx="3" class="fg-b hot"/>
<text x="308" y="160" text-anchor="middle" class="fg-t mono">1</text>
<rect x="321" y="140" width="22" height="30" rx="3" class="fg-b hot"/>
<text x="332" y="160" text-anchor="middle" class="fg-t mono">1</text>
<rect x="345" y="140" width="22" height="30" rx="3" class="fg-b hot"/>
<text x="356" y="160" text-anchor="middle" class="fg-t mono">0</text>
<rect x="369" y="140" width="22" height="30" rx="3" class="fg-b hot"/>
<text x="380" y="160" text-anchor="middle" class="fg-t mono">0</text>
<rect x="393" y="140" width="22" height="30" rx="3" class="fg-b hot"/>
<text x="404" y="160" text-anchor="middle" class="fg-t mono">0</text>
<line x1="288" y1="76" x2="344" y2="128" class="fg-l on"/>
<polygon points="344,136 335.3,133.2 341.8,127.1" class="fg-a on"/>
<text x="320" y="198" text-anchor="middle" class="fg-t lg mono">B8</text>
<text x="320" y="220" text-anchor="middle" class="fg-t sm">10 開頭：接續的位元組</text>
<rect x="437" y="140" width="22" height="30" rx="3" class="fg-b"/>
<text x="448" y="160" text-anchor="middle" class="fg-t mono">1</text>
<rect x="461" y="140" width="22" height="30" rx="3" class="fg-b"/>
<text x="472" y="160" text-anchor="middle" class="fg-t mono">0</text>
<rect x="485" y="140" width="22" height="30" rx="3" class="fg-b warm"/>
<text x="496" y="160" text-anchor="middle" class="fg-t mono">1</text>
<rect x="509" y="140" width="22" height="30" rx="3" class="fg-b warm"/>
<text x="520" y="160" text-anchor="middle" class="fg-t mono">0</text>
<rect x="533" y="140" width="22" height="30" rx="3" class="fg-b warm"/>
<text x="544" y="160" text-anchor="middle" class="fg-t mono">1</text>
<rect x="557" y="140" width="22" height="30" rx="3" class="fg-b warm"/>
<text x="568" y="160" text-anchor="middle" class="fg-t mono">1</text>
<rect x="581" y="140" width="22" height="30" rx="3" class="fg-b warm"/>
<text x="592" y="160" text-anchor="middle" class="fg-t mono">0</text>
<rect x="605" y="140" width="22" height="30" rx="3" class="fg-b warm"/>
<text x="616" y="160" text-anchor="middle" class="fg-t mono">1</text>
<line x1="490" y1="76" x2="556" y2="128" class="fg-l warm"/>
<polygon points="556,136 547.1,133.9 553.1,127.3" class="fg-a warm"/>
<text x="532" y="198" text-anchor="middle" class="fg-t lg mono">AD</text>
<text x="532" y="220" text-anchor="middle" class="fg-t sm">10 開頭：接續的位元組</text>
<text x="320" y="244" text-anchor="middle" class="fg-t sm">切成 4、6、6 三段填進空位；白底的位元是固定的開頭記號</text>
</svg><figcaption>編碼就是「把碼位的位元，照順序填進範本的空位」。所以 UTF-8 的「中」永遠是 E4 B8 AD，在哪一台電腦上都一樣。</figcaption></figure>
<p>這個設計聰明在三個地方。第一，英文還是一個位元組，而且跟 ASCII 一模一樣，舊的英文檔案直接就是合法的 UTF-8。第二，接續的位元組一定以 10 開頭，從任何位置往回找，都找得到一個字的開頭，壞掉一個位元組也只會壞一個字。第三，除了真正的 0，任何字都不會產生 0 這個位元組，舊的 C 程式不會誤以為字串已經結束。它是 Ken Thompson 和 Rob Pike 在 1992 年設計的，今天超過九成八的網站都用它。</p>
<h4>「字串長度」有四種意思</h4>
<pre><code>const s = '\\u{1F468}\\u200D\\u{1F469}\\u200D\\u{1F467}';
new TextEncoder().encode(s).length; // 18
s.length;                           // 8
[...s].length;                      // 5
[...new Intl.Segmenter().segment(s)].length; // 1</code></pre>
<p>同一個字串，四種長度：18 是 UTF-8 的位元組數，8 是 UTF-16 的單位數，5 是碼位數，1 是人眼看到的字數。</p>
<p>這個「家庭」emoji，其實是三個 emoji 用兩個<b>零寬連接字元</b>（zero width joiner，U+200D）黏起來的。JavaScript 的字串內部用的是 <b>UTF-16</b>：U+FFFF 以內的字佔 1 個單位，超過的（像 emoji）要用兩個單位組成一對（surrogate pair），所以 <code>'😀'.length</code> 是 2。要算「使用者看到幾個字」，得用 <code>Intl.Segmenter</code>。</p>
<p>Go 的字串則是一串 UTF-8 位元組：<code>len("中")</code> 是 3；用 <code>for range</code> 走字串，才會一個碼位（Go 叫 rune）一個碼位地走；要算字數用 <code>utf8.RuneCountInString</code>。</p>
<h4>上線之後才會發現的坑</h4>
<ul>
<li><b>MySQL 的 utf8 不是完整的 UTF-8</b>：舊的 <code>utf8</code> 其實是 <code>utf8mb3</code>，每個字最多 3 個位元組，存 emoji 會失敗。要用 <code>utf8mb4</code>，MySQL 8.0 起它是預設值。</li>
<li><b>HTTP 的 Content-Length 算的是位元組</b>：在 Node.js 裡自己寫這個標頭，要用 <code>Buffer.byteLength(body)</code>，不能用 <code>body.length</code>。內容有中文，兩者會差到三倍，用戶端就會收到被切掉的回應。</li>
<li><b>看起來一樣，位元不一樣</b>：「é」可以是一個碼位 U+00E9，也可以是「e」加上一個組合用的重音符號 U+0301。畫面上一模一樣，<code>===</code> 卻是 <code>false</code>。比對使用者輸入之前，先用 <code>str.normalize('NFC')</code> 統一形式。</li>
</ul>

<h3><span class="badge lv4">專家</span>六、位元沒有型別：位元組順序、型別混淆、編碼攻擊</h3>
<p>這一章最重要的一句話：<b>記憶體裡只有位元，沒有型別</b>。同樣四個位元組 <code>41 42 43 44</code>：當文字讀，是「ABCD」；在你的 Mac 上當 32 位元整數讀，是 1,145,258,561；當 float 讀，是 781.035……。意思全看「讀它的那段程式碼怎麼解釋」。</p>
<h4>位元組順序（endianness）</h4>
<p>一個 32 位元的數字要佔 4 格記憶體。那最大的位元組放最前面，還是最後面？兩種都有人做：</p>
<figure class="figure"><svg viewBox="0 0 620 214" class="fg" style="width:100%;max-width:620px" role="img" aria-label="0x12345678 存進位址 100 到 103：大端序依序放 12、34、56、78，小端序反過來放 78、56、34、12">
<text x="310" y="24" text-anchor="middle" class="fg-t lg mono">0x<tspan class="fg-t lg mono acc">12</tspan><tspan class="fg-t lg mono alt">34</tspan><tspan class="fg-t lg mono warm">56</tspan>78</text>
<text x="255" y="52" text-anchor="middle" class="fg-t sm">位址 100</text><text x="335" y="52" text-anchor="middle" class="fg-t sm">位址 101</text><text x="415" y="52" text-anchor="middle" class="fg-t sm">位址 102</text><text x="495" y="52" text-anchor="middle" class="fg-t sm">位址 103</text>
<text x="20" y="76" class="fg-t">大端序</text><text x="20" y="94" class="fg-t sm">網路封包的順序</text>
<rect x="220" y="60" width="70" height="36" rx="5" class="fg-b hot"/><text x="255" y="84" text-anchor="middle" class="fg-t lg mono">12</text>
<rect x="300" y="60" width="70" height="36" rx="5" class="fg-b alt"/><text x="335" y="84" text-anchor="middle" class="fg-t lg mono">34</text>
<rect x="380" y="60" width="70" height="36" rx="5" class="fg-b warm"/><text x="415" y="84" text-anchor="middle" class="fg-t lg mono">56</text>
<rect x="460" y="60" width="70" height="36" rx="5" class="fg-b"/><text x="495" y="84" text-anchor="middle" class="fg-t lg mono">78</text>
<text x="542" y="83" class="fg-t sm">大的先放</text>
<text x="255" y="132" text-anchor="middle" class="fg-t sm">位址 100</text><text x="335" y="132" text-anchor="middle" class="fg-t sm">位址 101</text><text x="415" y="132" text-anchor="middle" class="fg-t sm">位址 102</text><text x="495" y="132" text-anchor="middle" class="fg-t sm">位址 103</text>
<text x="20" y="156" class="fg-t">小端序</text><text x="20" y="174" class="fg-t sm">x86、ARM 的記憶體</text>
<rect x="220" y="140" width="70" height="36" rx="5" class="fg-b"/><text x="255" y="164" text-anchor="middle" class="fg-t lg mono">78</text>
<rect x="300" y="140" width="70" height="36" rx="5" class="fg-b warm"/><text x="335" y="164" text-anchor="middle" class="fg-t lg mono">56</text>
<rect x="380" y="140" width="70" height="36" rx="5" class="fg-b alt"/><text x="415" y="164" text-anchor="middle" class="fg-t lg mono">34</text>
<rect x="460" y="140" width="70" height="36" rx="5" class="fg-b hot"/><text x="495" y="164" text-anchor="middle" class="fg-t lg mono">12</text>
<text x="542" y="163" class="fg-t sm">小的先放</text>
<text x="310" y="204" text-anchor="middle" class="fg-t sm">讀的人用錯順序，就會讀成 0x78563412，而且不會有任何錯誤訊息</text>
</svg><figcaption>同一個數字、同樣四個位元組，只是擺放的順序相反。兩邊都沒有錯，錯的是「寫的人和讀的人約定不一樣」。</figcaption></figure>
<ul>
<li><b>小端序</b>（little-endian）：最小的位元組放在最低的位址。x86-64 和實務上的 ARM64（你的 M1、手機、AWS 的 Graviton）都是這樣。</li>
<li><b>大端序</b>（big-endian）：最大的位元組放前面，跟人寫數字的順序一樣。TCP、IP 標頭裡的連接埠號碼和位址都規定用這種，所以它也叫<b>網路位元組順序</b>（network byte order）。</li>
</ul>
<p>平常寫 JavaScript、Go 不會碰到它，直到你要自己解析二進位資料：讀一個檔案格式、解一個網路封包、跟伺服器用自訂的二進位協定溝通。這時候要明確指定順序：Node.js 的 <code>buf.readUInt32BE()</code> 和 <code>buf.readUInt32LE()</code>、Go 的 <code>binary.BigEndian.Uint32()</code>。順序讀反了，程式不會報錯，只會給你一個錯得很離譜的數字。</p>
<h4>型別混淆是一整類漏洞</h4>
<p>既然位元本身不帶型別，只要能騙程式「用錯的方式解讀同一塊記憶體」，就能做壞事。把一個攻擊者能控制的整數，當成記憶體位址來用，等於讓對方決定要讀寫哪裡。瀏覽器的 JavaScript 引擎有不少高危漏洞都屬於這一類，叫<b>型別混淆</b>（type confusion）。有號和無號搞混也是同一回事：一個長度欄位如果是 −1，被當成無號 32 位元來讀，就變成 4,294,967,295。</p>
<h4>文字編碼也能拿來攻擊</h4>
<ul>
<li><b>長得一樣的字</b>：西里爾字母的「а」（U+0430）跟英文的「a」（U+0061）看起來完全一樣。用它註冊一個假網域，就是同形字攻擊（homograph attack）。瀏覽器的對策是：看起來可疑時，改顯示 <code>xn--</code> 開頭的原始寫法（punycode）。</li>
<li><b>不合法的長寫法</b>：「/」本來是 1 個位元組 0x2F，但硬塞進 2 個位元組的範本，寫成 <code>C0 AF</code>，數值上也「算得出」同一個字。早年有解碼器照收不誤，結果檢查「有沒有 ../」的程式沒看出來，解碼之後卻真的變成了 ../。2000 年前後微軟 IIS 的目錄穿越漏洞就是這樣。現在的標準規定，這種寫法一律當成錯誤。</li>
<li><b>看不見的方向字元</b>：Unicode 有控制文字左右方向的字元。2021 年的 Trojan Source 研究示範：把它們藏進原始碼，畫面上看到的程式碼，跟編譯器看到的不一樣。之後 GitHub 等平台會對這種字元顯示警告。</li>
</ul>
<h4>真的有人在用兩種以上的狀態</h4>
<p>第一節說，二進位是因為兩種狀態不會搞混。但在特別值錢的地方，工程師願意付出代價去用更多種：</p>
<ul>
<li><b>SSD 的快閃記憶體</b>：每一格存好幾種電荷等級。SLC 兩級存 1 位元、TLC 八級存 3 位元、QLC 十六級存 4 位元。等級越多越便宜、容量越大，但寫入越慢、能寫的次數越少，要靠很強的錯誤更正碼撐著。</li>
<li><b>高速傳輸線</b>：PCIe 6.0 和高速乙太網路用 PAM4，一次送四種電壓之一，等於一次傳 2 個位元。代價是對雜訊更敏感，必須加上前向錯誤更正（FEC）。</li>
</ul>
<p>規則還是同一條：狀態越多，越容易讀錯，就得花更多力氣去更正。</p>

<h3>七、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>0.1 + 0.2 不等於 0.3 是 JavaScript 的 bug</td><td>這是 IEEE 754 的 double，每個語言都一樣。JavaScript 只是把結果老實印出來。</td></tr>
<tr><td>浮點數不精確，所以連整數都存不準</td><td>double 在 ±2<sup>53</sup> 以內的整數全部精確。存不準的是「二進位寫不完」的小數，和超過 2<sup>53</sup> 的整數。</td></tr>
<tr><td>UTF-8 就是 Unicode</td><td>Unicode 是「字 → 編號」的表；UTF-8、UTF-16 是把編號寫成位元組的方法。</td></tr>
<tr><td>字串長度就是字數</td><td>至少有四種長度：位元組、UTF-16 單位、碼位、使用者看到的字。</td></tr>
<tr><td>負數就是在最前面放一個負號位元</td><td>那是「正負號加大小」，已經沒人用。二補數的最高位是一個份量為負的普通位元。</td></tr>
<tr><td>1 GB 就是 1,024 MB</td><td>GB 是 1,000 的倍數，GiB 才是 1,024 的倍數。不同的工具用不同的定義。</td></tr>
</table>

<h3>八、跟你的工作連起來</h3>
<ul>
<li><b>前端（Vue、TypeScript）</b>：金額一律用整數的「分」來算，只在顯示時才轉成小數。<code>(1.005).toFixed(2)</code> 會得到 <code>"1.00"</code>，因為 1.005 存起來其實是 1.00499999……。算字數、截斷暱稱要用 <code>Intl.Segmenter</code>，不然會把 emoji 切成半個，變成亂碼。</li>
<li><b>後端（Node.js、Go）</b>：資料庫的 64 位元 ID 傳給 JavaScript，超過 2<sup>53</sup> 就會被悄悄改掉，所以很多 API 把 ID 當字串傳（Go 的 <code>encoding/json</code> 可以加 <code>,string</code> 標籤）。算雜湊、簽章、長度之前，先確定手上是 UTF-8 位元組，不是字串。</li>
<li><b>遊戲（Cocos、Unity）</b>：位置是 float，大地圖要注意精度。顏色用 0 到 255 的位元組（Cocos 的 <code>new Color(255, 136, 0, 255)</code>、Unity 的 <code>Color32</code>），或 0 到 1 的浮點數（Unity 的 <code>Color</code>）。多人連線若要每台機器算出一模一樣的結果（lockstep），常改用整數或定點數，因為不同平台、不同編譯設定下的浮點結果，可能差在最後幾位。</li>
<li><b>維運（Docker、雲端）</b>：Kubernetes 的 Mi 和 M 不一樣；雲端硬碟（例如 AWS 的 EBS）的大小用的是 GiB；監控圖表上的「GB」到底是哪一種，要看文件確認。</li>
</ul>

<h3>九、面試會怎麼問</h3>
<p>先自己講一遍，最好出聲講，再打開參考答案。</p>
<ol>
<li>「為什麼 0.1 + 0.2 不等於 0.3？那金額要怎麼存？」</li>
<li>「什麼是二補數？為什麼 8 位元的範圍是 −128 到 127？」</li>
<li>「Unicode 和 UTF-8 差在哪？為什麼一個中文字在 UTF-8 裡是三個位元組？」</li>
<li>「什麼是 endianness？你在什麼情況下會碰到它？」</li>
<li>「JavaScript 能精確表示的最大整數是多少？後端的 64 位元 ID 要怎麼給前端？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>JavaScript 的數字是 IEEE 754 的 64 位元浮點數，用二進位存小數。0.1 和 0.2 在二進位是無限循環小數，存的時候已經四捨五入過；兩者相加再四捨五入一次，結果落在 0.3 旁邊的那一個 double。所有用 IEEE 754 的語言都一樣。比較浮點數要用誤差範圍；金額則不要用浮點數，改用整數的最小單位（例如分），或資料庫的 decimal／numeric 型別，並且明確規定在哪一步、用什麼規則四捨五入。</li>
<li>二補數把最高位的份量當成 −2<sup>n−1</sup>，其他位照舊。變號是「每位反轉再加 1」。好處是只有一個 0，而且有號、無號用同一個加法器就能算對，硬體最簡單。8 位元的最高位是 −128，其餘七位最多加到 127，所以範圍是 −128 到 127；負數多一個，是因為 0 佔了非負的那一邊，也因此 −128 沒有對應的正數。</li>
<li>Unicode 是字元集，規定每個字的編號（碼位）；UTF-8 是編碼，規定編號怎麼寫成位元組，長度 1 到 4 個位元組。常用中文落在 U+0800 到 U+FFFF，用三個位元組的範本，扣掉固定的開頭記號，剛好留 16 個位元的空位。實務上要注意：JavaScript 的 length 是 UTF-16 單位，MySQL 要用 utf8mb4 才存得了 emoji。</li>
<li>多位元組的數字在記憶體裡的擺放順序。小端序把最低位的位元組放在最低位址，x86 和 ARM 都是；大端序反過來，是網路協定的標準順序。只要解析二進位資料，例如檔案格式、網路封包、自訂協定，就要明確指定用哪一種，例如 Node.js 的 readUInt32BE 或 Go 的 binary.BigEndian。用 JSON 這種文字格式就不會碰到。</li>
<li>2<sup>53</sup> − 1，也就是 9,007,199,254,740,991（Number.MAX_SAFE_INTEGER），因為 double 只有 53 位精度，超過之後相鄰的數就不再差 1。64 位元 ID 可能超過這個範圍，JSON.parse 會悄悄把它改成最接近的 double，不會報錯。做法是 API 用字串傳 ID，前端只當字串比對；真的要計算，就用 BigInt。</li>
</ol>
</details>

<h3>十、練功題（做得出來才算真的懂）</h3>
<ol>
<li>把 −20 寫成 8 位元二補數，再用「最左邊一位是 −128」的讀法驗算一次。</li>
<li>0x7F、0x80、0xFF 這三個位元組，當成無號 8 位元和有號 8 位元，各是多少？</li>
<li>照第五節的範本，手算「猜」（U+731C）的 UTF-8 是哪三個位元組。算完在 Node.js 裡執行 <code>Buffer.from('猜')</code> 對答案。</li>
<li>為什麼 <code>2 ** 53 + 1 === 2 ** 53</code> 是 <code>true</code>，但 <code>2 ** 53 + 2 === 2 ** 53</code> 是 <code>false</code>？</li>
<li>同事在 Kubernetes 的設定裡寫了 <code>memory: 256m</code>，Pod 一直起不來。問題出在哪裡？要怎麼改？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>20 是 0001 0100。每位反轉得 1110 1011，加 1 得 1110 1100（0xEC）。驗算：−128 + 64 + 32 + 8 + 4 = −20。</li>
<li>0x7F：無號 127，有號 127。0x80：無號 128，有號 −128。0xFF：無號 255，有號 −1。</li>
<li>0x731C 是 0111 0011 0001 1100。切成 4、6、6：0111、001100、011100。填進範本得 1110 0111、10 001100、10 011100，也就是 E7 8C 9C。</li>
<li>超過 2<sup>53</sup> 之後，相鄰的兩個 double 差 2。2<sup>53</sup> + 1 剛好落在 2<sup>53</sup> 和 2<sup>53</sup> + 2 的正中間，IEEE 754 遇到平手時，取最後一位是偶數的那一個，也就是 2<sup>53</sup>。2<sup>53</sup> + 2 本身就能精確表示，所以不相等。</li>
<li>小寫的 m 是「千分之一」，256m 等於 0.256 個位元組，容器不可能在這麼小的限制下跑起來。要寫成 <code>256Mi</code>（或 <code>256M</code>，兩者差大約 5%）。</li>
</ol>
</details>

<h3>十一、想再挖深</h3>
<ul>
<li><b>Bryant 與 O'Hallaron《Computer Systems: A Programmer's Perspective》（CS:APP）第 2 章</b>：整數、二補數、浮點數的表示法和運算，講得最完整的一章，附大量練習題。</li>
<li><b>David Goldberg〈What Every Computer Scientist Should Know About Floating-Point Arithmetic〉</b>：1991 年的經典論文，浮點數的誤差從哪裡來、怎麼控制。</li>
<li><b>Joel Spolsky〈The Absolute Minimum Every Software Developer Absolutely, Positively Must Know About Unicode and Character Sets (No Excuses!)〉</b>：Joel on Software 部落格上的名文，二十年來都是理解字元編碼的第一篇。</li>
<li><b>Charles Petzold《Code: The Hidden Language of Computer Hardware and Software》</b>：從摩斯電碼、點字一路講到二進位和 ASCII，這一課最好讀的延伸讀物。</li>
</ul>
` });
