DEEP({ 'mach-code': `
<p>上一課說：沒有人會用手寫一長串數字，你用高階語言寫，再由另一個程式翻譯。這一章就把「另一個程式」打開來看。你寫的 TypeScript、Go、C#，到底經過哪些步驟，才變成 CPU 看得懂的那串數字？每一步做了什麼決定？為什麼同一個映像檔，在你的 Mac 上能跑，到了伺服器上卻說 <code>exec format error</code>？為什麼 JavaScript 明明是一邊讀一邊跑，熱起來卻能跟 C 差不多快？最後，我們會碰到一道連理論上都過不去的牆：有些問題，任何程式都永遠答不出來。</p>

<h3><span class="badge lv1">基礎</span>一、指令集：CPU 和軟體之間的合約</h3>
<p>先分清楚兩個常被混在一起的詞：</p>
<ul>
<li><b>指令集架構</b>（instruction set architecture，ISA）：一份規格書。寫著有哪些暫存器、有哪些指令、每道指令怎麼編成位元、做完會有什麼結果。x86-64 和 ARM64 都是 ISA。</li>
<li><b>微架構</b>（microarchitecture）：照著這份規格做出來的真實晶片。管線多長、快取多大、一拍能做幾道，都是微架構的事。Intel 和 AMD 的晶片內部設計完全不同，但都實作 x86-64，所以跑得了同一個執行檔。</li>
</ul>
<p>打個比方：ISA 是插座的規格，微架構是發電廠。只要插座規格一樣，你的電器（程式）插哪一家的電都能用，不用管電是怎麼發出來的。這份合約讓軟體和硬體可以分開進步：十年前編譯好的執行檔，在今天的新晶片上照樣能跑，而且更快。</p>
<h4>兩大家族：x86-64 和 ARM64</h4>
<table>
<tr><th></th><th>x86-64</th><th>ARM64（AArch64）</th></tr>
<tr><td>出身</td><td>從 Intel 1978 年的 8086 一路擴充；AMD 在 2003 年推出 64 位元版本</td><td>ARM 在 2011 年公布的 64 位元架構（ARMv8-A）</td></tr>
<tr><td>通用暫存器</td><td>16 個（rax、rbx……r15）</td><td>31 個（x0 到 x30）</td></tr>
<tr><td>指令長度</td><td>1 到 15 個位元組不等</td><td>固定 4 個位元組</td></tr>
<tr><td>運算能直接碰記憶體嗎</td><td>可以，例如把記憶體裡的數字直接加進暫存器</td><td>不行，只有 load 和 store 碰記憶體，其他指令只算暫存器</td></tr>
<tr><td>常見在哪裡</td><td>大多數雲端伺服器、PC</td><td>手機、Apple silicon、AWS Graviton 這類 ARM 伺服器</td></tr>
</table>
<p>右邊那種「只有 load、store 碰記憶體」的設計，叫 <b>load/store 架構</b>，是 RISC（reduced instruction set computer，精簡指令集）的核心想法：指令簡單、長度固定，硬體就好做得又快又省電。x86 屬於 CISC（complex instruction set computer，複雜指令集），指令花樣多；但上一課深入圖解說過，現代 x86 會先把指令拆成內部的小指令再執行，所以今天兩邊在晶片內部其實很像，差別主要在解碼這一關和功耗。</p>
<p>同一行 C：<code>int add(int a, int b) { return a + b; }</code>，用 GCC 開最佳化，兩邊的編譯結果長這樣：</p>
<figure class="figure"><svg viewBox="0 0 660 262" class="fg" style="width:100%;max-width:660px" role="img" aria-label="同一個 add 函式，x86-64 編成 lea 和 ret 共 4 個位元組，ARM64 編成 add 和 ret 共 8 個位元組，兩邊的數字完全不同">
<rect x="150" y="12" width="360" height="32" rx="6" class="fg-b hot"/>
<text x="330" y="33" text-anchor="middle" class="fg-t mono">int add(int a, int b) { return a + b; }</text>
<path d="M240 44 V56 H165 V64" class="fg-l"/><polygon points="165,72 160.5,64 169.5,64" class="fg-a"/>
<path d="M420 44 V56 H495 V64" class="fg-l"/><polygon points="495,72 490.5,64 499.5,64" class="fg-a"/>
<rect x="20" y="72" width="290" height="180" rx="8" class="fg-b"/>
<text x="165" y="96" text-anchor="middle" class="fg-t lg">x86-64</text>
<text x="165" y="116" text-anchor="middle" class="fg-t sm">參數在 rdi、rsi，答案放 eax</text>
<rect x="34" y="128" width="262" height="32" rx="5" class="fg-b alt"/>
<text x="46" y="149" class="fg-t mono">lea eax, [rdi+rsi]</text><text x="284" y="149" text-anchor="end" class="fg-t mono acc">8D 04 37</text>
<rect x="34" y="166" width="262" height="32" rx="5" class="fg-b alt"/>
<text x="46" y="187" class="fg-t mono">ret</text><text x="284" y="187" text-anchor="end" class="fg-t mono acc">C3</text>
<text x="165" y="222" text-anchor="middle" class="fg-t sm">長度不固定：3 個位元組＋1 個</text>
<text x="165" y="240" text-anchor="middle" class="fg-t sm">總共 4 個位元組</text>
<rect x="350" y="72" width="290" height="180" rx="8" class="fg-b"/>
<text x="495" y="96" text-anchor="middle" class="fg-t lg">ARM64</text>
<text x="495" y="116" text-anchor="middle" class="fg-t sm">參數在 w0、w1，答案也放 w0</text>
<rect x="364" y="128" width="262" height="32" rx="5" class="fg-b alt"/>
<text x="376" y="149" class="fg-t mono">add w0, w0, w1</text><text x="614" y="149" text-anchor="end" class="fg-t mono acc">0B010000</text>
<rect x="364" y="166" width="262" height="32" rx="5" class="fg-b alt"/>
<text x="376" y="187" class="fg-t mono">ret</text><text x="614" y="187" text-anchor="end" class="fg-t mono acc">D65F03C0</text>
<text x="495" y="222" text-anchor="middle" class="fg-t sm">每道指令固定 4 個位元組</text>
<text x="495" y="240" text-anchor="middle" class="fg-t sm">總共 8 個位元組</text>
</svg><figcaption>左邊是組合語言，右邊綠色是 CPU 真正讀到的數字（十六進位）。同一件事，兩種 CPU 的數字完全不同，所以為 x86 編譯的程式，ARM 的 CPU 讀起來就是一堆亂碼。</figcaption></figure>
<p>三件事值得注意。第一，<b>兩邊的位元組完全不同</b>：x86 的執行檔放到 ARM 的 Linux 主機上，核心一看檔頭就拒絕，這就是 <code>exec format error</code>。第二，x86 版本沒有用 add，而是用了一道原本拿來「算位址」的 <code>lea</code>，因為它能一次把兩個暫存器相加、再放進第三個暫存器，編譯器很懂這種小技巧。第三，參數放在哪個暫存器（x86 的 rdi、rsi，ARM 的 w0、w1；w 是 x 暫存器的低 32 位元，因為 int 是 32 位元），不是 CPU 規定的，而是下一節要講的「呼叫慣例」。</p>

<h3><span class="badge lv1">基礎</span>二、組合語言與呼叫慣例</h3>
<p><b>組合語言</b>（assembly）就是替機器碼的數字取名字：<code>8D 04 37</code> 寫成 <code>lea eax, [rdi+rsi]</code>。把組合語言轉回數字的程式叫<b>組譯器</b>（assembler）。它幾乎是一對一的翻譯，再加上兩個方便的功能：<b>標籤</b>（label），讓你寫「跳到 loop_start」而不用自己算差幾個位元組；以及<b>指示詞</b>（directive），告訴組譯器「這裡放一串資料」「這一段是程式碼」。</p>
<p>讀別人的組合語言之前，要先知道一個很容易踩的坑：x86 有兩種寫法。Intel 語法把目的地寫在前面（<code>mov eax, 1</code>）；AT&amp;T 語法把目的地寫在後面，暫存器前面加 %（<code>movl $1, %eax</code>）。Linux 上的 <code>objdump</code> 和 GCC 預設輸出 AT&amp;T 語法，Intel 的手冊用 Intel 語法。同一道指令方向相反，第一次看會以為自己眼花。</p>
<h4>呼叫慣例：函式之間的約定</h4>
<p>上一課深入圖解講了 CALL 和 RET 怎麼跳過去、跳回來。可是參數放在哪裡？答案放在哪裡？哪些暫存器呼叫完可能被改掉？這些不是 CPU 規定的，是一份大家共同遵守的約定，叫<b>呼叫慣例</b>（calling convention）：</p>
<table>
<tr><th>平台</th><th>前幾個整數參數</th><th>回傳值</th></tr>
<tr><td>Linux、macOS 的 x86-64（System V）</td><td>rdi、rsi、rdx、rcx、r8、r9</td><td>rax</td></tr>
<tr><td>Windows 的 x86-64</td><td>rcx、rdx、r8、r9</td><td>rax</td></tr>
<tr><td>ARM64（AAPCS64）</td><td>x0 到 x7</td><td>x0</td></tr>
</table>
<p>參數比暫存器多，多出來的才放堆疊。呼叫慣例，加上資料在記憶體裡怎麼排（結構的欄位順序、對齊）、系統呼叫怎麼叫，合起來叫 <b>ABI</b>（application binary interface，應用程式二進位介面）。API 是原始碼層級的約定，ABI 是編譯好以後的約定。兩段機器碼要能互相呼叫，ABI 必須一致。</p>
<p>這不是理論。Docker 很常見的一個坑：在一般 Linux（用 glibc）上編譯好的程式，丟進 Alpine 映像檔（用 musl）執行，會得到一句莫名其妙的 <code>not found</code>，明明檔案就在那裡。原因是執行檔裡寫著「請用 glibc 的動態載入器來載入我」，而 Alpine 裡根本沒有那個載入器。兩套 C 函式庫的 ABI 不同，不能混用。</p>

<h3><span class="badge lv2">進階</span>三、編譯器的六個步驟</h3>
<p><b>編譯器</b>（compiler）聽起來很神祕，其實是一條很有條理的生產線。拿一行程式走一次：<code>total = total + n * 2;</code></p>
<figure class="figure"><svg viewBox="0 0 660 330" class="fg" style="width:100%;max-width:660px" role="img" aria-label="編譯器的六個步驟：詞法分析、語法分析、型別檢查、中間表示、最佳化、產生機器碼，每一步都以 total = total + n * 2 為例">
<rect x="20" y="20" width="190" height="116" rx="8" class="fg-b alt"/>
<text x="115" y="44" text-anchor="middle" class="fg-t lg">1 詞法分析</text>
<text x="115" y="74" text-anchor="middle" class="fg-t sm mono">[total] [=] [total]</text>
<text x="115" y="96" text-anchor="middle" class="fg-t sm mono">[+] [n] [*] [2] [;]</text>
<text x="115" y="124" text-anchor="middle" class="fg-t sm">字元切成一個個詞</text>
<rect x="235" y="20" width="190" height="116" rx="8" class="fg-b alt"/>
<text x="330" y="40" text-anchor="middle" class="fg-t lg">2 語法分析</text>
<text x="310" y="58" text-anchor="middle" class="fg-t mono">=</text>
<line x1="306" y1="62" x2="272" y2="71" class="fg-l dim"/><line x1="314" y1="62" x2="351" y2="71" class="fg-l dim"/>
<text x="265" y="80" text-anchor="middle" class="fg-t sm mono">total</text>
<text x="355" y="80" text-anchor="middle" class="fg-t mono">+</text>
<line x1="351" y1="84" x2="326" y2="93" class="fg-l dim"/><line x1="359" y1="84" x2="386" y2="93" class="fg-l dim"/>
<text x="320" y="102" text-anchor="middle" class="fg-t sm mono">total</text>
<text x="390" y="102" text-anchor="middle" class="fg-t mono">*</text>
<line x1="386" y1="106" x2="374" y2="115" class="fg-l dim"/><line x1="394" y1="106" x2="405" y2="115" class="fg-l dim"/>
<text x="370" y="126" text-anchor="middle" class="fg-t sm mono">n</text>
<text x="408" y="126" text-anchor="middle" class="fg-t sm mono">2</text>
<rect x="450" y="20" width="190" height="116" rx="8" class="fg-b alt"/>
<text x="545" y="44" text-anchor="middle" class="fg-t lg">3 型別檢查</text>
<text x="545" y="74" text-anchor="middle" class="fg-t sm">total 是 number</text>
<text x="545" y="96" text-anchor="middle" class="fg-t sm">n 是 number</text>
<text x="545" y="124" text-anchor="middle" class="fg-t sm warm">型別不對就在這裡報錯</text>
<line x1="210" y1="78" x2="227" y2="78" class="fg-l"/><polygon points="235,78 227,73.5 227,82.5" class="fg-a"/>
<line x1="425" y1="78" x2="442" y2="78" class="fg-l"/><polygon points="450,78 442,73.5 442,82.5" class="fg-a"/>
<path d="M545 136 V152 H115 V160" class="fg-l"/><polygon points="115,168 110.5,160 119.5,160" class="fg-a"/>
<rect x="20" y="168" width="190" height="116" rx="8" class="fg-b hot"/>
<text x="115" y="192" text-anchor="middle" class="fg-t lg">4 中間表示 IR</text>
<text x="40" y="220" class="fg-t sm mono">t1 = n * 2</text>
<text x="40" y="242" class="fg-t sm mono">t2 = total + t1</text>
<text x="40" y="264" class="fg-t sm mono">total = t2</text>
<rect x="235" y="168" width="190" height="116" rx="8" class="fg-b hot"/>
<text x="330" y="192" text-anchor="middle" class="fg-t lg">5 最佳化</text>
<text x="330" y="220" text-anchor="middle" class="fg-t sm">乘 2 → 左移一位</text>
<text x="330" y="242" text-anchor="middle" class="fg-t sm">total、n 留在暫存器</text>
<text x="330" y="264" text-anchor="middle" class="fg-t sm">沒人用的計算刪掉</text>
<rect x="450" y="168" width="190" height="116" rx="8" class="fg-b warm"/>
<text x="545" y="192" text-anchor="middle" class="fg-t lg">6 產生機器碼</text>
<text x="464" y="214" class="fg-t sm alt">ARM64</text>
<text x="464" y="232" class="fg-t sm mono">add w0, w0, w1, lsl #1</text>
<text x="464" y="254" class="fg-t sm alt">x86-64</text>
<text x="464" y="272" class="fg-t sm mono">lea eax, [rdi+rsi*2]</text>
<line x1="210" y1="226" x2="227" y2="226" class="fg-l"/><polygon points="235,226 227,221.5 227,230.5" class="fg-a"/>
<line x1="425" y1="226" x2="442" y2="226" class="fg-l"/><polygon points="450,226 442,221.5 442,230.5" class="fg-a"/>
<text x="115" y="314" text-anchor="middle" class="fg-t sm alt">藍：前端，看語言</text>
<text x="330" y="314" text-anchor="middle" class="fg-t sm acc">綠：中間，兩邊都不管</text>
<text x="545" y="314" text-anchor="middle" class="fg-t sm warm">橘：後端，看 CPU</text>
</svg><figcaption>一行程式從文字變成機器碼的路。前三步把文字變成有結構、確定沒寫錯的樹；中間把樹攤平、改寫得更快；最後一步才去管是哪一種 CPU。整行最後只剩一道指令。</figcaption></figure>
<ol>
<li><b>詞法分析</b>（lexing）：把一串字元切成一個個<b>詞</b>（token）：識別字 total、符號 =、識別字 total、符號 +、識別字 n、符號 *、數字 2、分號。空白和註解在這一步就丟掉了。</li>
<li><b>語法分析</b>（parsing）：照語言的文法，把詞組成一棵樹，叫<b>抽象語法樹</b>（abstract syntax tree，AST）。運算的優先順序在這裡決定：<code>n * 2</code> 先組成一個節點，才輪到加法。你在 ESLint、Prettier、Babel 裡看到的規則和轉換，都是在操作這棵樹。</li>
<li><b>語意分析</b>（semantic analysis）：查每個名字指的是誰、型別對不對。<code>n</code> 如果是字串，TypeScript 就在這裡報錯。TypeScript 的編譯器 <code>tsc</code> 做完型別檢查，就把型別全部擦掉、輸出 JavaScript，它的工作基本上到這裡為止。</li>
<li><b>中間表示</b>（intermediate representation，IR）：把樹攤平成一串很簡單、跟 CPU 無關的指令，每道最多一個運算。很多編譯器的 IR 有一個特性：每個暫時變數只被指定一次（SSA，static single assignment），這讓後面的分析簡單很多。</li>
<li><b>最佳化</b>（optimization）：在 IR 上反覆改寫，結果不變、但更快更小。例如把乘以 2 換成左移、把迴圈裡每圈都一樣的計算搬到迴圈外、刪掉沒人用的計算、把小函式直接展開在呼叫的地方（inlining）。</li>
<li><b>產生機器碼</b>（code generation）：挑選指令、決定哪個變數放哪個暫存器（暫存器配置，register allocation）、排好順序，輸出組合語言或直接輸出機器碼。圖裡最後一格，整行只剩一道指令：ARM64 的 add 可以順便把第二個數左移一位（等於乘 2），x86 的 lea 也能一次算出「一個數 ＋ 另一個數 × 2」。</li>
</ol>
<p>前面幾步叫<b>前端</b>（front end），跟語言有關；最後一步叫<b>後端</b>（back end），跟 CPU 有關；中間的 IR 和最佳化，兩邊都不管。這個切法是現代編譯器最重要的設計，第五節會看到它值多少錢。</p>

<h3><span class="badge lv2">進階</span>四、直譯器與 JIT：V8 怎麼跑你的 JavaScript</h3>
<p><b>直譯器</b>（interpreter）不產生機器碼。它本身是一個已經編譯好的程式，裡面是一個大迴圈：讀下一個指令、用一個大 switch 看它是什麼、照著做、再讀下一個。現代的直譯器很少直接走 AST，多半先把程式轉成<b>位元組碼</b>（bytecode）：一種給虛擬機器用的緊湊指令，再一道一道執行。CPython 和 V8 的第一層都是這樣。</p>
<p>直譯的代價在「每道指令都要經過那個 switch」：讀指令、判斷、跳到對應的程式碼，本身就要好幾道機器指令。而且直譯器不知道變數的型別，<code>a + b</code> 每次都要先檢查：兩個都是數字？是字串？是物件？所以純直譯通常比編譯好的機器碼慢上幾倍到幾十倍。</p>
<p><b>即時編譯器</b>（just-in-time compiler，JIT）的想法是：先直譯，一邊跑一邊觀察，發現某段程式碼很常跑，再把它編譯成機器碼。而且因為已經觀察過，它知道事先編譯的編譯器不知道的事：「這個函式被呼叫了幾萬次，<code>a</code> 和 <code>b</code> 每次都是小整數。」</p>
<figure class="figure"><svg viewBox="0 0 660 232" class="fg" style="width:100%;max-width:660px" role="img" aria-label="V8 的流程：原始碼經過解析器變成 AST，Ignition 執行位元組碼並收集型別回饋，熱的函式交給 TurboFan 編成最佳化機器碼，假設錯了就去最佳化回到 Ignition">
<text x="485" y="22" text-anchor="middle" class="fg-t sm warm">假設錯了：去最佳化</text>
<path d="M565 60 V30 H405 V52" class="fg-l warm dash"/><polygon points="405,60 400.5,52 409.5,52" class="fg-a warm"/>
<rect x="20" y="60" width="130" height="60" rx="8" class="fg-b"/>
<text x="85" y="86" text-anchor="middle" class="fg-t">原始碼</text>
<text x="85" y="106" text-anchor="middle" class="fg-t sm">JavaScript</text>
<rect x="180" y="60" width="130" height="60" rx="8" class="fg-b"/>
<text x="245" y="86" text-anchor="middle" class="fg-t">解析器</text>
<text x="245" y="106" text-anchor="middle" class="fg-t sm">產生 AST</text>
<rect x="340" y="60" width="130" height="60" rx="8" class="fg-b hot"/>
<text x="405" y="86" text-anchor="middle" class="fg-t acc">Ignition</text>
<text x="405" y="106" text-anchor="middle" class="fg-t sm">直譯位元組碼</text>
<rect x="500" y="60" width="130" height="60" rx="8" class="fg-b alt"/>
<text x="565" y="86" text-anchor="middle" class="fg-t alt">TurboFan</text>
<text x="565" y="106" text-anchor="middle" class="fg-t sm">最佳化機器碼</text>
<line x1="150" y1="90" x2="172" y2="90" class="fg-l"/><polygon points="180,90 172,85.5 172,94.5" class="fg-a"/>
<line x1="310" y1="90" x2="332" y2="90" class="fg-l"/><polygon points="340,90 332,85.5 332,94.5" class="fg-a"/>
<line x1="470" y1="90" x2="492" y2="90" class="fg-l on"/><polygon points="500,90 492,85.5 492,94.5" class="fg-a on"/>
<text x="485" y="80" text-anchor="middle" class="fg-t sm acc">夠熱</text>
<line x1="405" y1="120" x2="405" y2="142" class="fg-l dash"/><polygon points="405,150 400.5,142 409.5,142" class="fg-a"/>
<rect x="330" y="150" width="150" height="34" rx="6" class="fg-b"/>
<text x="405" y="172" text-anchor="middle" class="fg-t sm">型別回饋：a、b 是整數</text>
<path d="M480 167 H565 V128" class="fg-l dash"/><polygon points="565,120 560.5,128 569.5,128" class="fg-a"/>
<text x="330" y="216" text-anchor="middle" class="fg-t sm">現在中間還有 Sparkplug、Maglev 兩層：越往右，編譯越久、跑得越快</text>
</svg><figcaption>Ignition 一邊跑、一邊記下它看到的型別；函式夠熱，TurboFan 就拿這些紀錄做出大膽假設的機器碼。假設一被打破，就丟掉機器碼，回到 Ignition。</figcaption></figure>
<h4>V8 的兩個主角</h4>
<ul>
<li><b>Ignition</b>：V8 的直譯器。原始碼解析成 AST 之後，先轉成位元組碼，由 Ignition 執行。啟動快、佔記憶體少。它在執行時順便記錄<b>型別回饋</b>（type feedback）：每個 <code>+</code> 看到過什麼型別、每個 <code>obj.x</code> 碰到的物件長什麼形狀。</li>
<li><b>TurboFan</b>：V8 的最佳化編譯器。函式夠「熱」的時候，它拿著位元組碼和型別回饋，做出一份<b>大膽假設</b>的機器碼：「a 和 b 一定是小整數」，於是加法就只是一道 add 加一個溢位檢查，跟 C 差不多快。</li>
</ul>
<p>現在的 V8 在兩者中間還多了兩層：Sparkplug（很快產生、幾乎不做最佳化的機器碼）和 Maglev（中等程度的最佳化）。道理一樣：越往上，編譯越花時間、產出的程式越快，所以只把最熱的程式碼送上去。</p>
<h4>假設錯了怎麼辦：去最佳化</h4>
<p>TurboFan 的機器碼裡，每個假設前面都有一道檢查。假設某天你呼叫了 <code>add('猜', '高低')</code>，檢查發現不是整數，就觸發<b>去最佳化</b>（deoptimization）：丟掉這份機器碼，把目前的狀態轉回 Ignition 的格式，回到直譯器繼續跑。之後如果它又變熱，V8 會用比較保守的假設重新編譯。</p>
<p>這就是常見的 JavaScript 效能建議背後的原因：</p>
<ul>
<li><b>讓同一個函式看到同樣形狀的資料</b>。V8 會替「欄位相同、加入順序也相同」的物件建立同一個內部形狀（常被叫作隱藏類別，hidden class）。<code>{x, y}</code> 和 <code>{y, x}</code> 是兩種形狀。一個函式只看過一種形狀，存取欄位就是固定位置的一次讀取；看過太多種，就只能退回慢路。</li>
<li><b>不要讓陣列裡的型別亂跳</b>。全是小整數的陣列，和混了浮點數、字串、<code>undefined</code> 的陣列，V8 存放的方式不同，後者比較慢。</li>
<li><b>量效能要先暖身</b>。一開始的那些呼叫還沒被最佳化，量到的不是最後的速度（第 0.8 課的深入圖解會講怎麼量）。</li>
</ul>
<p>其他語言的執行環境也是同一個思路：Java 的 HotSpot、.NET 的分層編譯（tiered compilation）、LuaJIT、PyPy 都是 JIT；CPython 3.13 也開始有實驗性的 JIT（預設關閉）。</p>

<h3><span class="badge lv3">專業</span>五、一個 IR，接很多語言和很多 CPU</h3>
<p>假設世界上有 4 種語言、4 種 CPU。如果每個編譯器都從語言一路做到機器碼，就得寫 4 × 4 ＝ 16 個編譯器。如果大家先翻成同一種 IR，就只要寫 4 個前端（語言 → IR）加 4 個後端（IR → CPU），共 8 個，而且所有的最佳化只要寫一次，所有語言都受益。</p>
<figure class="figure"><svg viewBox="0 0 640 230" class="fg" style="width:100%;max-width:640px" role="img" aria-label="C、C++、Rust、Swift、Zig 的前端都翻成 LLVM IR，經過共用的最佳化，再由後端輸出 x86-64、ARM64、WebAssembly、RISC-V">
<text x="90" y="20" text-anchor="middle" class="fg-t sm alt">4 個前端</text>
<text x="550" y="20" text-anchor="middle" class="fg-t sm warm">4 個後端</text>
<rect x="20" y="30" width="140" height="32" rx="6" class="fg-b alt"/><text x="90" y="51" text-anchor="middle" class="fg-t">C／C++（Clang）</text>
<rect x="20" y="80" width="140" height="32" rx="6" class="fg-b alt"/><text x="90" y="101" text-anchor="middle" class="fg-t">Rust</text>
<rect x="20" y="130" width="140" height="32" rx="6" class="fg-b alt"/><text x="90" y="151" text-anchor="middle" class="fg-t">Swift</text>
<rect x="20" y="180" width="140" height="32" rx="6" class="fg-b alt"/><text x="90" y="201" text-anchor="middle" class="fg-t">Zig</text>
<rect x="250" y="70" width="140" height="100" rx="10" class="fg-b hot"/>
<text x="320" y="114" text-anchor="middle" class="fg-t lg">LLVM IR</text>
<text x="320" y="136" text-anchor="middle" class="fg-t sm">共用的最佳化</text>
<rect x="480" y="30" width="140" height="32" rx="6" class="fg-b warm"/><text x="550" y="51" text-anchor="middle" class="fg-t">x86-64</text>
<rect x="480" y="80" width="140" height="32" rx="6" class="fg-b warm"/><text x="550" y="101" text-anchor="middle" class="fg-t">ARM64</text>
<rect x="480" y="130" width="140" height="32" rx="6" class="fg-b warm"/><text x="550" y="151" text-anchor="middle" class="fg-t">WebAssembly</text>
<rect x="480" y="180" width="140" height="32" rx="6" class="fg-b warm"/><text x="550" y="201" text-anchor="middle" class="fg-t">RISC-V</text>
<path d="M160 46 H190 L230 100 H242" class="fg-l"/><polygon points="250,100 242,95.5 242,104.5" class="fg-a"/>
<path d="M160 96 H190 L230 113 H242" class="fg-l"/><polygon points="250,113 242,108.5 242,117.5" class="fg-a"/>
<path d="M160 146 H190 L230 127 H242" class="fg-l"/><polygon points="250,127 242,122.5 242,131.5" class="fg-a"/>
<path d="M160 196 H190 L230 140 H242" class="fg-l"/><polygon points="250,140 242,135.5 242,144.5" class="fg-a"/>
<path d="M390 100 H410 L450 46 H472" class="fg-l"/><polygon points="480,46 472,41.5 472,50.5" class="fg-a"/>
<path d="M390 113 H410 L450 96 H472" class="fg-l"/><polygon points="480,96 472,91.5 472,100.5" class="fg-a"/>
<path d="M390 127 H410 L450 146 H472" class="fg-l"/><polygon points="480,146 472,141.5 472,150.5" class="fg-a"/>
<path d="M390 140 H410 L450 196 H472" class="fg-l"/><polygon points="480,196 472,191.5 472,200.5" class="fg-a"/>
</svg><figcaption>沒有共用的 IR，4 種語言乘 4 種 CPU 要 16 套編譯器；有了 IR，只要 4 個前端加 4 個後端，中間的最佳化大家共用。</figcaption></figure>
<p>這正是 <b>LLVM</b> 的設計。C 和 C++（透過 Clang）、Rust、Swift、Zig 都把程式翻成 LLVM IR，交給同一套最佳化和後端，輸出 x86-64、ARM64、WebAssembly、RISC-V 等等的機器碼。所以一種新的 CPU 架構，只要有人寫好 LLVM 後端，這些語言幾乎同時都能支援它。</p>
<p>不是每個語言都走 LLVM。Go 有自己的編譯器和後端，編譯速度是它刻意追求的目標；GCC 也有自己的 IR。但「前端、IR、後端」這個三段式，幾乎是所有現代編譯器的共同骨架。</p>
<h4>最佳化的兩面</h4>
<p>最佳化器只保證一件事：<b>程式「看得到的行為」不變</b>。除此之外，它可以重排、合併、刪除。這有幾個你遲早會撞到的後果：</p>
<ul>
<li>量效能的迴圈，如果計算結果沒有被用到，最佳化器可能把整個迴圈刪掉，你會量到 0 秒。</li>
<li>C 和 C++ 裡有「未定義行為」（undefined behavior），例如有號整數溢位。最佳化器可以假設它永遠不會發生，於是你寫來檢查溢位的 <code>if</code>，可能被當成「永遠不成立」而整個刪掉。</li>
<li>除錯版（<code>-O0</code>）和發行版（<code>-O2</code>）行為不一樣，通常不是編譯器的錯，而是程式依賴了未定義行為或競爭條件（race condition），最佳化只是讓它現形。</li>
</ul>

<h3><span class="badge lv3">專業</span>六、連結與執行檔：從 .o 到能跑的程式</h3>
<p>大型程式不會一口氣編譯成一個檔案。每個原始檔先各自編譯成一個<b>目的檔</b>（object file，<code>.o</code>），裡面有機器碼，但留著一些「洞」：<code>main.o</code> 呼叫了 <code>shuffle</code>，可是 <code>shuffle</code> 寫在另一個檔案，現在還不知道它最後會在哪個位址。目的檔裡用兩張表記著這些事：</p>
<ul>
<li><b>符號表</b>（symbol table）：「我提供了 main」、「我需要 shuffle」。</li>
<li><b>重定位紀錄</b>（relocation）：「第 0x1C 個位元組那裡，等你知道 shuffle 在哪，請把位址填進來。」</li>
</ul>
<p><b>連結器</b>（linker）把所有目的檔收齊，做三件事：把同類的區段（section）排在一起，決定每一段最後的位址；用符號表把「需要」和「提供」配對，配不到就是你常看到的 <code>undefined reference</code>；最後照重定位紀錄，把洞全部填上。輸出的就是<b>執行檔</b>（executable）。</p>
<figure class="figure"><svg viewBox="0 0 660 284" class="fg" style="width:100%;max-width:660px" role="img" aria-label="main.o 和 deck.o 交給連結器，配對符號、填好位址，輸出執行檔；執行檔裡記著需要 libc.so.6，啟動時由動態載入器接上">
<rect x="20" y="20" width="180" height="104" rx="8" class="fg-b alt"/>
<text x="110" y="44" text-anchor="middle" class="fg-t lg">main.o</text>
<text x="34" y="68" class="fg-t sm">提供：main</text>
<text x="34" y="88" class="fg-t sm">需要：shuffle、printf</text>
<text x="34" y="110" class="fg-t sm warm">機器碼裡留著洞</text>
<rect x="20" y="150" width="180" height="104" rx="8" class="fg-b alt"/>
<text x="110" y="174" text-anchor="middle" class="fg-t lg">deck.o</text>
<text x="34" y="198" class="fg-t sm">提供：shuffle</text>
<text x="34" y="218" class="fg-t sm">需要：rand</text>
<text x="34" y="240" class="fg-t sm warm">機器碼裡留著洞</text>
<path d="M200 72 H220 L236 120 H242" class="fg-l"/><polygon points="250,120 242,115.5 242,124.5" class="fg-a"/>
<path d="M200 202 H220 L236 150 H242" class="fg-l"/><polygon points="250,150 242,145.5 242,154.5" class="fg-a"/>
<rect x="250" y="95" width="130" height="80" rx="8" class="fg-b hot"/>
<text x="315" y="128" text-anchor="middle" class="fg-t lg">連結器</text>
<text x="315" y="150" text-anchor="middle" class="fg-t sm">配對符號、填洞</text>
<line x1="380" y1="135" x2="422" y2="135" class="fg-l on"/><polygon points="430,135 422,130.5 422,139.5" class="fg-a on"/>
<rect x="430" y="20" width="210" height="180" rx="8" class="fg-b"/>
<text x="535" y="44" text-anchor="middle" class="fg-t lg">執行檔 game</text>
<rect x="446" y="58" width="178" height="28" rx="4" class="fg-b hot"/><text x="458" y="77" class="fg-t">.text：main、shuffle</text>
<rect x="446" y="92" width="178" height="28" rx="4" class="fg-b"/><text x="458" y="111" class="fg-t">.rodata：字串常數</text>
<rect x="446" y="126" width="178" height="28" rx="4" class="fg-b"/><text x="458" y="145" class="fg-t">.data／.bss：全域變數</text>
<rect x="446" y="160" width="178" height="28" rx="4" class="fg-b warm"/><text x="458" y="179" class="fg-t">需要：libc.so.6</text>
<line x1="535" y1="200" x2="535" y2="230" class="fg-l warm dash"/><polygon points="535,238 530.5,230 539.5,230" class="fg-a warm"/>
<text x="525" y="224" text-anchor="end" class="fg-t sm">啟動時由動態載入器接上</text>
<rect x="430" y="238" width="210" height="36" rx="6" class="fg-b warm"/>
<text x="535" y="261" text-anchor="middle" class="fg-t">libc.so.6：printf、rand</text>
</svg><figcaption>每個目的檔只知道自己提供什麼、缺什麼。連結器把缺的配上提供的，填好每個洞；外部函式庫的部分則留到程式啟動時，交給動態載入器處理。</figcaption></figure>
<p>執行檔不只是一串機器碼，它有固定的格式：Linux 用 <b>ELF</b>，macOS 用 <b>Mach-O</b>，Windows 用 <b>PE</b>。裡面分成幾個區段：</p>
<table>
<tr><th>區段</th><th>放什麼</th><th>記憶體權限</th></tr>
<tr><td><code>.text</code></td><td>機器碼</td><td>可讀、可執行，不可寫</td></tr>
<tr><td><code>.rodata</code></td><td>常數、字串字面值</td><td>唯讀</td></tr>
<tr><td><code>.data</code></td><td>有初始值的全域變數</td><td>可讀寫</td></tr>
<tr><td><code>.bss</code></td><td>初始值是 0 的全域變數（檔案裡只記大小）</td><td>可讀寫</td></tr>
</table>
<p>你執行它的時候，作業系統讀檔頭，把每個區段<b>映射</b>到這個行程的虛擬記憶體（第 0.5 課的深入圖解），設定好權限、準備好堆疊，然後跳到進入點。進入點通常不是 <code>main</code>，而是 C 函式庫的啟動程式，它整理好參數和環境變數，才呼叫你的 <code>main</code>。</p>
<h4>靜態連結和動態連結</h4>
<ul>
<li><b>靜態連結</b>（static linking）：把用到的函式庫程式碼直接複製進執行檔。檔案大，但自給自足，丟到哪台同架構的機器都能跑。Go 關掉 cgo（<code>CGO_ENABLED=0</code>）時產生的就是完全靜態的執行檔，所以 Go 服務可以裝進幾乎是空的 <code>FROM scratch</code> 映像檔。缺點是函式庫有資安漏洞時，每個程式都要重新編譯。</li>
<li><b>動態連結</b>（dynamic linking）：執行檔裡只記「我需要 <code>libc.so.6</code>」，程式啟動時由<b>動態載入器</b>（dynamic loader）去找、映射進記憶體、填好位址。所有行程共用同一份函式庫的記憶體，更新 OpenSSL 只要換一個檔。代價是「我的機器可以跑，你的不行」：最常見的是 <code>GLIBC_2.34 not found</code> 這類錯誤，代表程式是在比較新的系統上編譯的，目標機器的 glibc 太舊。</li>
</ul>
<p>看執行檔的幾個工具：<code>file</code> 看格式和架構，<code>ldd</code>（Linux）或 <code>otool -L</code>（macOS）看依賴哪些動態函式庫，<code>nm</code> 看符號表，<code>objdump -d</code> 把機器碼反組譯成組合語言。</p>

<h3><span class="badge lv3">專業</span>七、WebAssembly：給瀏覽器的可攜式機器碼</h3>
<p>瀏覽器很早就想跑 C++、Rust 寫的程式（遊戲引擎、影像處理、壓縮），可是網頁不能下載一個 x86 執行檔直接跑：使用者的 CPU 可能是 ARM，而且直接跑機器碼太危險。<b>WebAssembly</b>（Wasm）的答案是：定義一套<b>不屬於任何真實 CPU</b> 的指令集，給一台虛構的機器用，讓瀏覽器下載後再翻成本機的機器碼。</p>
<pre><code>(func $add (param $a i32) (param $b i32) (result i32)
  local.get $a
  local.get $b
  i32.add)</code></pre>
<p>這是 Wasm 的文字格式，跟前面那個 add 函式做同一件事。注意它沒有暫存器：<code>local.get</code> 把值推到一個堆疊上，<code>i32.add</code> 從堆疊拿兩個、加起來、再把結果推回去。這種設計叫<b>堆疊機</b>（stack machine），好處是指令短，而且不用假設對方的 CPU 有幾個暫存器，瀏覽器翻譯時再自己分配。</p>
<ul>
<li><b>可攜</b>：同一個 <code>.wasm</code> 檔，在 x86 筆電和 ARM 手機上都能跑。</li>
<li><b>先驗證、再執行</b>：載入時瀏覽器會先檢查整個模組，型別不對、跳到不合法的地方，直接拒絕。</li>
<li><b>沙盒</b>：Wasm 程式只能碰自己的一塊<b>線性記憶體</b>（linear memory），就是一個從 0 開始的大位元組陣列。它就算寫壞了，也只會弄壞這塊陣列，碰不到瀏覽器的記憶體。要做任何對外的事（畫圖、上網），都得呼叫 JavaScript 交給它的函式。</li>
<li><b>快，但不是魔法</b>：V8 先用一個很快的基礎編譯器（Liftoff）讓它馬上能跑，熱的函式再交給 TurboFan。型別在編譯時就確定，不必像 JavaScript 那樣猜，所以表現穩定，接近原生程式但多半還是慢一些。JavaScript 和 Wasm 之間來回呼叫、搬資料有成本，操作 DOM 也得經過 JavaScript，所以「把一小段 JS 改寫成 Wasm」常常不會變快。</li>
</ul>
<p>你最可能遇到它的地方：Unity 的 WebGL 版本，就是把 C# 經過 IL2CPP 轉成 C++，再編譯成 Wasm；Figma 這類大型網頁應用的核心也用它。它也走出了瀏覽器：WASI（WebAssembly System Interface）定義了讀檔、取時間這些系統功能，讓 Wasm 能在伺服器和邊緣運算平台上跑，當作比容器更輕的沙盒。</p>

<h3><span class="badge lv4">專家</span>八、編譯器背後的暗處</h3>
<h4>寫進去的東西要能執行：W^X 與 JIT</h4>
<p>為了擋住上一課深入圖解講的緩衝區溢位攻擊，現代作業系統遵守一條規則：一塊記憶體<b>可以寫、或可以執行，但不能同時兩者</b>（W^X，write xor execute）。JIT 偏偏兩者都要：先把機器碼寫進記憶體，再跳過去執行。所以 JIT 得在「寫」和「執行」兩種權限之間切換，Apple silicon 甚至有專門的硬體機制，讓每條執行緒快速切換。iOS 更嚴格：一般 App 不准 JIT。這就是 Unity 在 iOS 上一定要用 IL2CPP，把 C# 事先編譯成原生程式碼的原因。</p>
<h4>你信任你的編譯器嗎</h4>
<p>Ken Thompson 在 1984 年發表的圖靈獎演講〈Reflections on Trusting Trust〉提出一個讓人睡不著的想法：如果編譯器被動了手腳，它可以在編譯登入程式時偷偷加後門，在編譯「編譯器自己」時把這段竄改也複製進去。之後就算原始碼完全乾淨，編出來的編譯器還是有毒。審查原始碼看不出來，因為問題根本不在原始碼裡。</p>
<p>這不只是思想實驗。2024 年被發現的 xz utils 後門，惡意程式碼就藏在發布用的建置腳本和測試檔案裡，不在一般人會審查的主要原始碼，差一點就進入各大 Linux 發行版的正式版。業界的回應之一是<b>可重現建置</b>（reproducible builds）：同一份原始碼，任何人在任何機器上編譯，都要得到每個位元組都相同的結果。只要有幾個人獨立驗證，就能確認發布的二進位檔真的來自那份原始碼。這是供應鏈安全（模組 5）的核心問題之一。</p>
<h4>二進位翻譯：Rosetta 2 和跨架構容器</h4>
<p>Apple 從 Intel 換到自家的 ARM 晶片時，舊的 x86-64 程式怎麼辦？Rosetta 2 在程式第一次執行前，把整個 x86-64 機器碼翻成 ARM64（遇到執行時才產生的程式碼，例如 JIT，就邊跑邊翻）。最難的一點是記憶體順序：x86 對「多核心之間看到寫入的先後」保證得比較嚴格，ARM 比較寬鬆，直接翻會讓多執行緒程式出錯。Apple 的解法是在晶片裡加一個開關，讓翻譯後的程式照 x86 的規則執行。軟體相容性的問題，最後用硬體解決。</p>
<p>你在 Docker 上也會遇到同一件事。在 Apple silicon 的 Mac 上跑 <code>linux/amd64</code> 的映像檔，要靠模擬或翻譯，又慢、偶爾行為還怪；部署到 ARM 的雲端主機時，只有 amd64 版本的映像檔會直接報 <code>exec format error</code>。正確做法是建置多架構映像檔：<code>docker buildx build --platform linux/amd64,linux/arm64</code>，讓每台機器自己拉對的版本。</p>

<h3><span class="badge lv4">專家</span>九、圖靈完備與停機問題：電腦能力的邊界</h3>
<p>課文說，只要有記憶體、簡單運算和條件跳躍，就能算任何寫得成步驟的東西。一個系統只要能模擬圖靈機（假設記憶體無限），就叫<b>圖靈完備</b>（Turing complete）。門檻低得驚人：</p>
<ul>
<li>JavaScript、Go、C#、Python 都是，這不意外。</li>
<li>SQL 加上遞迴查詢（<code>WITH RECURSIVE</code>）就是。</li>
<li>C++ 的樣板（template）、TypeScript 的型別系統，本身也是。這就是為什麼 TypeScript 有一個錯誤叫「Type instantiation is excessively deep and possibly infinite」：型別檢查器自己也可能跑不完，只好設一個深度上限。</li>
<li>康威的《生命遊戲》（Game of Life）、Minecraft 的紅石電路，都有人在裡面蓋出能跑程式的電腦。</li>
</ul>
<h4>停機問題：一個永遠寫不出來的函式</h4>
<p>假設有人宣稱寫出了 <code>halts(f, x)</code>：給它任何函式 f 和輸入 x，它一定能在有限時間內回答「f(x) 最後會不會停」。我們用它寫一個搗蛋的函式：</p>
<pre><code>function trouble(f) {
  if (halts(f, f)) {
    while (true) {}   // 你說會停？那我就永遠不停
  }
  return;             // 你說不會停？那我馬上停
}

trouble(trouble);     // 這會停嗎？</code></pre>
<p>問 <code>halts(trouble, trouble)</code>，看它怎麼答：</p>
<figure class="figure"><svg viewBox="0 0 620 226" class="fg" style="width:100%;max-width:620px" role="img" aria-label="halts 回答會停，trouble 就進入無窮迴圈；回答不會停，trouble 就馬上結束。兩種回答都錯">
<rect x="180" y="16" width="260" height="36" rx="6" class="fg-b hot"/>
<text x="310" y="39" text-anchor="middle" class="fg-t"><tspan class="fg-t mono">halts(trouble, trouble)</tspan> 答？</text>
<path d="M250 52 V80 H155 V92" class="fg-l on"/><polygon points="155,100 150.5,92 159.5,92" class="fg-a on"/>
<path d="M370 52 V80 H465 V92" class="fg-l alt"/><polygon points="465,100 460.5,92 469.5,92" class="fg-a alt"/>
<text x="200" y="73" text-anchor="middle" class="fg-t sm acc">答「會停」</text>
<text x="420" y="73" text-anchor="middle" class="fg-t sm alt">答「不會停」</text>
<rect x="30" y="100" width="250" height="50" rx="6" class="fg-b"/>
<text x="155" y="121" text-anchor="middle" class="fg-t">trouble 進入 while (true)</text>
<text x="155" y="140" text-anchor="middle" class="fg-t sm">實際上：永遠不停</text>
<rect x="340" y="100" width="250" height="50" rx="6" class="fg-b"/>
<text x="465" y="121" text-anchor="middle" class="fg-t">trouble 直接 return</text>
<text x="465" y="140" text-anchor="middle" class="fg-t sm">實際上：馬上停了</text>
<line x1="155" y1="150" x2="155" y2="172" class="fg-l warm"/><polygon points="155,180 150.5,172 159.5,172" class="fg-a warm"/>
<line x1="465" y1="150" x2="465" y2="172" class="fg-l warm"/><polygon points="465,180 460.5,172 469.5,172" class="fg-a warm"/>
<rect x="30" y="180" width="250" height="36" rx="6" class="fg-b warm"/>
<text x="155" y="203" text-anchor="middle" class="fg-t warm">跟回答相反：halts 錯了</text>
<rect x="340" y="180" width="250" height="36" rx="6" class="fg-b warm"/>
<text x="465" y="203" text-anchor="middle" class="fg-t warm">跟回答相反：halts 錯了</text>
</svg><figcaption>trouble 專門跟 halts 唱反調。不管 halts 回答什麼，trouble 都做出相反的事，所以 halts 不可能永遠答對。</figcaption></figure>
<p>不管 <code>halts</code> 回答什麼，<code>trouble</code> 都會做出相反的事，所以它一定答錯。唯一的結論是：<b>這樣的 halts 根本不可能存在</b>。這就是 Turing 在 1936 年證明的<b>停機問題</b>（halting problem）。重點不是「目前還沒人寫得出來」，而是「邏輯上不可能」。</p>
<p>它還有一個更廣的版本，叫 Rice 定理：任何關於程式「實際會做什麼」的非平凡問題，都沒有永遠答對的通用演算法。「這段程式會不會存取空指標？」「這個檔案是不是惡意程式？」「這兩個函式是否等價？」都是。</p>
<h4>這對工程有什麼影響</h4>
<ul>
<li><b>靜態分析一定會有誤報或漏報</b>。型別檢查器、linter、防毒軟體只能做「保守的近似」：TypeScript 寧可錯擋一些其實沒問題的程式（所以有時你得寫型別斷言），防毒軟體則同時有誤報和漏報。這不是工具不夠好，是數學上的必然。</li>
<li><b>工程的答案是設上限</b>。既然無法事先判斷會不會停，就限制它能跑多久：HTTP 請求有逾時、PostgreSQL 有 <code>statement_timeout</code>、遞迴有深度上限、Kubernetes 的 Job 有 <code>activeDeadlineSeconds</code>、以太坊的智慧合約用 gas 限制每次執行的步數。</li>
<li><b>有時故意不要圖靈完備</b>。Linux 的 eBPF 在載入程式前用驗證器（verifier）確認它一定會結束，才准它在核心裡跑；Kubernetes 的 ValidatingAdmissionPolicy 用的 CEL 運算式語言，刻意設計成不能寫無限迴圈。少一點能力，換來「一定會停」的保證，在核心和控制平面這種地方非常划算。</li>
</ul>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>直譯語言一定比編譯語言慢</td><td>JIT 能在執行時依照真實資料最佳化，熱的 JavaScript 程式碼可以接近 C 的速度。慢的是執行方式，不是語言本身。</td></tr>
<tr><td>TypeScript 的型別會讓程式跑得更快</td><td><code>tsc</code> 把型別全部擦掉才輸出 JavaScript，V8 根本看不到型別。型別幫的是你，不是引擎。</td></tr>
<tr><td>64 位元的程式，在任何 64 位元 CPU 上都能跑</td><td>還要指令集相同（x86-64 對 ARM64 不行）、執行檔格式相同（ELF 對 Mach-O 不行）、函式庫的 ABI 相容（glibc 對 musl 不行）。</td></tr>
<tr><td>WebAssembly 一定比 JavaScript 快</td><td>算數密集、型別固定的工作常常比較快；但跨邊界呼叫和搬資料有成本，碰 DOM 還是得經過 JavaScript。</td></tr>
<tr><td>除錯版正常、發行版出錯，是編譯器的 bug</td><td>絕大多數是程式依賴了未定義行為或競爭條件，最佳化只是讓問題現形。</td></tr>
<tr><td>只要工具夠聰明，就能自動找出所有 bug</td><td>停機問題和 Rice 定理保證做不到。任何分析工具都只能在誤報和漏報之間取捨。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>TypeScript 與 Vue</b>：Vite 用 esbuild 把 TypeScript 轉成 JavaScript，它只擦掉型別、<b>不做型別檢查</b>，所以 <code>vite build</code> 成功不代表型別沒錯。CI 裡要另外跑 <code>vue-tsc --noEmit</code> 或 <code>tsc --noEmit</code>。</li>
<li><b>Node.js</b>：熱路徑上的函式，讓它每次都看到同樣形狀的物件；不要在建構後才陸續加欄位。要知道時間花在哪，用 <code>node --cpu-prof</code> 錄一段再看。</li>
<li><b>Go</b>：<code>GOOS=linux GOARCH=arm64 go build</code> 一行就能交叉編譯；加上 <code>CGO_ENABLED=0</code> 得到靜態執行檔，配 <code>FROM scratch</code> 或 distroless 映像檔，又小又少攻擊面。</li>
<li><b>Docker 與雲端</b>：ARM 主機（例如 Graviton）通常比較便宜，但映像檔要建多架構版本，否則就是 <code>exec format error</code>。基底映像檔從 Debian 換成 Alpine 時，要確認裡面的二進位檔是不是依賴 glibc。</li>
<li><b>遊戲（Unity、Cocos）</b>：發行版的當機紀錄只有位址，要靠符號檔（iOS 的 dSYM、Android 的符號檔）才能翻回函式名稱和行號，打包時記得保存。Unity 的 iOS 和 WebGL 版本走 IL2CPP，C# 先變成 C++ 再編譯，所以有些反射（reflection）用法會被裁掉。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<p>先自己講一遍（最好出聲講），再打開參考答案。</p>
<ol>
<li>「編譯器和直譯器差在哪？JIT 又是什麼？」</li>
<li>「說說 V8 怎麼執行 JavaScript。什麼是去最佳化？寫程式時怎麼避免？」</li>
<li>「靜態連結和動態連結各有什麼優缺點？做容器映像檔時你會怎麼選？」</li>
<li>「同一個映像檔，在 M 系列的 Mac 上能跑，部署到伺服器卻出現 exec format error。為什麼？怎麼修？」</li>
<li>「什麼是停機問題？它對寫工具或做資安有什麼實際影響？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>編譯器事先把整個程式翻成機器碼，執行時不用再翻譯，啟動後就是全速，但編譯要時間，而且只能依靠編譯時看得到的資訊最佳化。直譯器在執行時一道一道讀位元組碼並執行，啟動快、可攜，但每道指令都有分派和型別檢查的額外成本。JIT 結合兩者：先直譯並收集執行時的型別資訊，把熱的程式碼編成機器碼，還能依實際資料做大膽假設，假設失效時去最佳化退回直譯器。</li>
<li>V8 把原始碼解析成 AST，轉成位元組碼由 Ignition 執行，同時記錄型別回饋；熱的函式依序可能交給 Sparkplug、Maglev，最熱的交給 TurboFan，依型別回饋產生帶檢查的最佳化機器碼。檢查失敗，例如原本都是整數的參數突然收到字串，就去最佳化，回到位元組碼。避免方法：同一個函式盡量接收相同型別、相同形狀的物件；物件欄位在建構時一次建好、順序固定；陣列不要混放不同型別。</li>
<li>靜態連結：自給自足、部署簡單、啟動時不用找函式庫，適合 <code>FROM scratch</code> 這類極小映像檔；缺點是檔案大，函式庫有漏洞要重新編譯每個程式。動態連結：檔案小、函式庫可共用記憶體、可單獨更新；缺點是執行環境要有相容版本的函式庫，容易出現 glibc 版本或 musl／glibc 不相容的問題。容器裡因為映像檔本身就把環境鎖住了，Go 這類語言常用靜態連結配極小映像檔；需要動態連結時，就讓建置和執行用同一個基底映像檔。</li>
<li>映像檔只建了 arm64 版本（在 M 系列 Mac 上預設建出來的就是 arm64），伺服器是 amd64，CPU 指令集不同，核心拒絕執行這個執行檔。修法是用 <code>docker buildx build --platform linux/amd64,linux/arm64</code> 建置多架構映像檔並推到 registry，讓每台機器自動拉對的版本；或至少用 <code>--platform linux/amd64</code> 建出伺服器要的那一版。</li>
<li>停機問題是說：不存在一個通用的程式，能對任意程式和輸入判斷它最後會不會停。證明用反證法：假設有這個判斷程式，就能造出一個專門跟它唱反調的程式，導出矛盾。推廣到 Rice 定理，任何關於程式行為的非平凡性質都無法完美判定。實務影響是：靜態分析、型別檢查、惡意程式偵測都只能做近似，必然有誤報或漏報；系統設計上要用逾時、資源上限、gas 這類限制來處理「可能跑不完」；需要保證會結束的地方，乾脆用不圖靈完備的語言，例如 eBPF 的驗證器或 CEL。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>打開 Compiler Explorer（godbolt.org），貼上 <code>int add(int a, int b) { return a + b; }</code>，分別選 x86-64 和 ARM64 的 GCC，加上 <code>-O2</code>，對照本章第一張圖。再把它改成 <code>return a + b * 2;</code>，指令會怎麼變？</li>
<li>對 <code>a = b * (c + 4);</code> 手寫出：它的 token、AST，和三位址形式的 IR。</li>
<li>把下面這段存成 <code>add.js</code>，執行 <code>node --trace-opt --trace-deopt add.js</code>，找出跟 add 有關的訊息。你預期會看到哪幾件事、照什麼順序發生？
<pre><code>function add(a, b) { return a + b; }
for (let i = 0; i &lt; 1e6; i++) add(i, 1);
add('猜', '高低');
for (let i = 0; i &lt; 1e6; i++) add(i, 1);</code></pre></li>
<li>為什麼一個 <code>CGO_ENABLED=0</code> 編譯的 Go 程式可以放進 <code>FROM scratch</code> 映像檔執行，但一個用 glibc 動態連結的 C 程式放進去就跑不起來？</li>
<li>同事說：「我們的 CI 會自動偵測所有會跑不完的程式碼。」你怎麼回應？實務上該怎麼做？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>沒加乘法時：x86-64 是 <code>lea eax, [rdi+rsi]</code> 加 <code>ret</code>，ARM64 是 <code>add w0, w0, w1</code> 加 <code>ret</code>。改成 <code>a + b * 2</code> 後，通常仍然只有一道指令：x86-64 變成 <code>lea eax, [rdi+rsi*2]</code>，ARM64 變成 <code>add w0, w0, w1, lsl 1</code>（左移一位等於乘 2；GCC 不寫 #，跟圖裡的 lsl #1 是同一道指令）。乘法根本沒出現，這就是指令選擇。</li>
<li>Token：識別字 a、=、識別字 b、*、(、識別字 c、+、數字 4、)、;。AST：根是 =，左邊 a，右邊是 *；* 的左邊是 b，右邊是 +；+ 的左邊是 c，右邊是 4（括號只影響樹的形狀，不會出現在樹裡）。IR：<code>t1 = c + 4</code>、<code>t2 = b * t1</code>、<code>a = t2</code>。</li>
<li>預期順序：第一個迴圈跑一陣子後，add 被標記並最佳化（可能先經過中間層，再到 TurboFan）；呼叫 <code>add('猜', '高低')</code> 時，型別檢查失敗，出現 add 的去最佳化訊息；第二個迴圈再跑一陣子，add 又被重新最佳化，這次的假設會比較保守。確切的訊息格式和次數隨 Node 版本不同，重點是看出「最佳化 → 去最佳化 → 再最佳化」的順序。</li>
<li>Go 關掉 cgo 時產生完全靜態的執行檔，所有需要的程式碼都在檔案裡，不需要任何動態載入器或共用函式庫，空的檔案系統也能跑（若要連 HTTPS，還得自己放 CA 憑證）。動態連結的 C 程式需要 <code>ld-linux</code> 動態載入器和 <code>libc.so.6</code>，scratch 裡都沒有，核心找不到執行檔指定的載入器，就無法執行。</li>
<li>這在一般情況下不可能做到，停機問題證明了不存在能判斷所有程式會不會停的工具；它頂多能抓到一些明顯的模式，必然會有漏掉或誤報。實務上應該在執行面設上限：測試有逾時、服務呼叫有逾時、背景工作有最長執行時間，並且監控執行時間的分佈，發現異常就告警。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>Compiler Explorer</b>（<a href="https://godbolt.org/">godbolt.org</a>）：貼上程式碼，立刻看到各種編譯器、各種 CPU 產生的組合語言。這一章的每個例子，都可以在上面自己驗證。</li>
<li><b>Robert Nystrom《Crafting Interpreters》</b>（<a href="https://craftinginterpreters.com/">craftinginterpreters.com</a>，可免費線上閱讀）：從零寫出一個完整的直譯器和位元組碼虛擬機器，文筆極好，是入門編譯原理最平易近人的一本。</li>
<li><b>V8 官方部落格</b>（<a href="https://v8.dev/blog">v8.dev/blog</a>）：Ignition、TurboFan、Sparkplug、Maglev 的介紹文章都在這裡，由寫這些東西的工程師親自說明。</li>
<li><b>John R. Levine《Linkers and Loaders》</b>：講連結器和載入器最經典的一本書，符號、重定位、共用函式庫全都有。</li>
<li><b>Aho 等人《Compilers: Principles, Techniques, and Tools》</b>（俗稱龍書）：編譯器的標準教科書，想把詞法分析、語法分析到最佳化學扎實，就讀這本。</li>
</ul>
` });
