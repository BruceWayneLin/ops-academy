DEEP({ 'cap-math': `
<p>上一課的計算器，把「一千萬使用者」變成了十幾台伺服器。這一章把那台計算器拆開：每個數字背後靠的是哪一條常識、怎麼在白板上三分鐘算出來、算完怎麼檢查自己有沒有算錯，最後怎麼把它變成一份能拿去要預算、排工程的容量計畫（capacity plan）。面試裡這叫「信封背面估算」（back-of-the-envelope estimation）。它看起來像數學題，其實是一種溝通能力：在還沒有任何量測之前，用幾個數字讓所有人對「這套系統有多大」有同一個概念。整章用同一個例子：一個即時多人的猜高低（Higher or Lower）平台，玩家每一回合花點數參加，猜對拿回獎勵點數，點數記在帳本裡。</p>

<h3><span class="badge lv1">基礎</span>一、估算要的是數量級，不是精確值</h3>
<p>先講一個台灣人很熟的場景：辦桌。總鋪師接到一場 300 位客人的喜酒，他不會去算每個人吃幾口飯。他會算：300 人 ÷ 每桌 10 人 = 30 桌；每桌 10 道菜，就是 300 盤；一個師傅一小時出 50 盤，出菜兩小時，要 3 個師傅；再多抓一成，以防有人臨時多帶小孩。算錯一兩桌沒關係，但如果他把 30 桌算成 3 桌，那天就完了。</p>
<p>系統估算也一樣。目標是<b>數量級</b>（order of magnitude）要對：答案差 2 倍，架構通常不變；差 10 倍，架構就變了。每秒 50 個請求，一台機器加一個資料庫就夠；每秒 5,000 個，要負載平衡器和一群應用程式伺服器；每秒 50 萬個，資料幾乎一定要分片。估算就是在決定你站在哪一格。</p>
<p>這種「用幾個合理假設，快速推出數量級」的方法叫<b>費米估算</b>（Fermi estimation），名字來自物理學家費米。做的時候守五條規矩：</p>
<ol>
<li><b>假設先寫下來。</b>「我假設每日活躍是註冊的 15%」寫在白板上。面試官不同意，改那一個數字就好，後面的推導照樣能用。</li>
<li><b>大膽取整數。</b>86,400 秒當 10 萬秒，1,736 當 1,700。只留一兩位有效數字。</li>
<li><b>用 10 的次方算。</b>1.5 × 10⁶ 人 × 100 次 = 1.5 × 10⁸ 次，除以 10⁵ 秒 = 1.5 × 10³。指數相加減，心算就做得完。</li>
<li><b>單位跟著走。</b>每一步都寫單位：人、次／人／天、秒。單位對不上，算式就錯了。</li>
<li><b>算完要說「所以呢」。</b>「尖峰每秒 5,200 次，所以一台資料庫扛全部讀取會吃緊，我會先加快取。」數字要接到決定，不然只是算術。</li>
</ol>
<figure class="figure"><svg viewBox="0 0 660 340" class="fg" style="width:100%;max-width:660px" role="img" aria-label="估算樹：註冊一千萬乘以百分之十五得到每日活躍一百五十萬，再分成請求、連線、寫入三條路，各自推到伺服器台數、閘道台數和帳本每秒交易數">
<rect x="250" y="10" width="160" height="44" rx="6" class="fg-b"/>
<text x="330" y="28" text-anchor="middle" class="fg-t sm">註冊使用者</text>
<text x="330" y="46" text-anchor="middle" class="fg-t">1,000 萬</text>
<line x1="330" y1="54" x2="330" y2="72" class="fg-l"/><polygon points="330,80 325.5,72 334.5,72" class="fg-a"/>
<text x="340" y="71" class="fg-t sm">× 15%</text>
<rect x="250" y="80" width="160" height="44" rx="6" class="fg-b alt"/>
<text x="330" y="98" text-anchor="middle" class="fg-t sm">每日活躍 DAU</text>
<text x="330" y="116" text-anchor="middle" class="fg-t">150 萬人</text>
<line x1="330" y1="124" x2="330" y2="136" class="fg-l"/>
<line x1="110" y1="136" x2="550" y2="136" class="fg-l"/>
<line x1="110" y1="136" x2="110" y2="160" class="fg-l"/><polygon points="110,168 105.5,160 114.5,160" class="fg-a"/>
<line x1="330" y1="136" x2="330" y2="160" class="fg-l"/><polygon points="330,168 325.5,160 334.5,160" class="fg-a"/>
<line x1="550" y1="136" x2="550" y2="160" class="fg-l"/><polygon points="550,168 545.5,160 554.5,160" class="fg-a"/>
<text x="118" y="156" class="fg-t sm">× 100 次 API／人</text>
<text x="338" y="156" class="fg-t sm">× 10% 同時在線</text>
<text x="558" y="156" class="fg-t sm">× 20 回合／人</text>
<rect x="15" y="168" width="190" height="40" rx="6" class="fg-b"/><text x="110" y="193" text-anchor="middle" class="fg-t">平均 1,700 次／秒</text>
<rect x="235" y="168" width="190" height="40" rx="6" class="fg-b"/><text x="330" y="193" text-anchor="middle" class="fg-t">尖峰 15 萬條連線</text>
<rect x="455" y="168" width="190" height="40" rx="6" class="fg-b"/><text x="550" y="193" text-anchor="middle" class="fg-t">3,000 萬回合／天</text>
<line x1="110" y1="208" x2="110" y2="220" class="fg-l"/><polygon points="110,228 105.5,220 114.5,220" class="fg-a"/>
<line x1="330" y1="208" x2="330" y2="220" class="fg-l"/><polygon points="330,228 325.5,220 334.5,220" class="fg-a"/>
<line x1="550" y1="208" x2="550" y2="220" class="fg-l"/><polygon points="550,228 545.5,220 554.5,220" class="fg-a"/>
<text x="118" y="222" class="fg-t sm">× 尖峰 3 倍</text>
<text x="338" y="222" class="fg-t sm">÷ 2 萬 × 1.4 餘裕</text>
<text x="558" y="222" class="fg-t sm">÷ 86,400 × 3</text>
<rect x="15" y="228" width="190" height="40" rx="6" class="fg-b hot"/><text x="110" y="253" text-anchor="middle" class="fg-t">尖峰 5,200 次／秒</text>
<rect x="235" y="228" width="190" height="40" rx="6" class="fg-b hot"/><text x="330" y="253" text-anchor="middle" class="fg-t">11 台即時閘道</text>
<rect x="455" y="228" width="190" height="40" rx="6" class="fg-b warm"/><text x="550" y="253" text-anchor="middle" class="fg-t">尖峰 1,050 回合／秒</text>
<line x1="110" y1="268" x2="110" y2="280" class="fg-l"/><polygon points="110,288 105.5,280 114.5,280" class="fg-a"/>
<line x1="330" y1="268" x2="330" y2="280" class="fg-l"/><polygon points="330,288 325.5,280 334.5,280" class="fg-a"/>
<line x1="550" y1="268" x2="550" y2="280" class="fg-l"/><polygon points="550,288 545.5,280 554.5,280" class="fg-a"/>
<text x="118" y="282" class="fg-t sm">÷ 500 × 1.4 餘裕</text>
<text x="338" y="282" class="fg-t sm">× 每人 2 則／秒</text>
<text x="558" y="282" class="fg-t sm">× 每回合 2 筆</text>
<rect x="15" y="288" width="190" height="40" rx="6" class="fg-b"/><text x="110" y="313" text-anchor="middle" class="fg-t">15 台應用程式伺服器</text>
<rect x="235" y="288" width="190" height="40" rx="6" class="fg-b"/><text x="330" y="313" text-anchor="middle" class="fg-t">推送 30 萬則／秒</text>
<rect x="455" y="288" width="190" height="40" rx="6" class="fg-b warm"/><text x="550" y="313" text-anchor="middle" class="fg-t">帳本 2,100 筆交易／秒</text>
</svg><figcaption>同一個「每日活躍」分出三條路：請求決定應用程式伺服器、連線決定閘道、寫入決定資料庫。橘色那條最難擴展，因為所有寫入最後都匯到同一個地方。</figcaption></figure>
<p>這張圖就是整章的地圖。上一課的計算器只算了左邊和中間兩條；這一章會把右邊的「寫入」補完，因為一千萬使用者的系統，最難的永遠是寫入路徑。</p>

<h3><span class="badge lv1">基礎</span>二、要背的數字（一）：2 的次方、時間，還有中文的萬和億</h3>
<p>估算的速度，取決於腦子裡存了多少「錨點」。第一組錨點是 2 的次方，因為電腦裡所有的容量、上限都是它：</p>
<table>
<tr><th>2 的幾次方</th><th>大約</th><th>你會在哪裡遇到</th></tr>
<tr><td>2¹⁰ = 1,024</td><td>一千（10³）</td><td>KB</td></tr>
<tr><td>2¹⁶ = 65,536</td><td>六萬五</td><td>連接埠號碼的上限</td></tr>
<tr><td>2²⁰</td><td>一百萬（10⁶）</td><td>MB</td></tr>
<tr><td>2³⁰</td><td>十億（10⁹）</td><td>GB</td></tr>
<tr><td>2³¹ − 1 = 2,147,483,647</td><td>21 億</td><td>32 位元有號整數（int）的上限</td></tr>
<tr><td>2³²</td><td>43 億</td><td>IPv4 位址總數</td></tr>
<tr><td>2⁴⁰</td><td>一兆（10¹²）</td><td>TB</td></tr>
<tr><td>2⁵³ − 1</td><td>約 9 × 10¹⁵</td><td>JavaScript 的 Number 能精確表示的最大整數</td></tr>
<tr><td>2⁶³ − 1</td><td>約 9.2 × 10¹⁸</td><td>64 位元有號整數（bigint）的上限</td></tr>
</table>
<p>這張表會直接救你兩次：</p>
<ul>
<li><b>主鍵用 int 會爆。</b>帳本平均每秒新增 1,000 列，主鍵用 32 位元的自動遞增（PostgreSQL 的 <code>serial</code> 就是）：2.1 × 10⁹ ÷ 1,000 ≈ 2.1 × 10⁶ 秒，大約 25 天就用完。用完那一刻，所有新增都失敗。主鍵一律用 <code>bigint</code>，事後才改要重寫整張表。</li>
<li><b>大 ID 進 JavaScript 會被改掉。</b>後端產生的 64 位元 ID 用 JSON 數字傳給前端，超過 2⁵³ 的部分會被 Number 悄悄四捨五入，兩筆不同的紀錄變成同一個 ID。做法是 ID 一律用字串傳。</li>
</ul>
<p>第二組錨點是時間：一天 86,400 秒，抓 10⁵；一個月約 2.6 × 10⁶ 秒；一年約 3.15 × 10⁷ 秒（記成 π × 10⁷）。換算成口訣：<b>每天 100 萬次，大約每秒 12 次；每月 10 億次，大約每秒 400 次。</b></p>
<p>第三組是台灣人特有的陷阱：英文三位數一個單位，中文四位數一個單位。</p>
<figure class="figure"><svg viewBox="0 0 640 232" class="fg" style="width:100%;max-width:640px" role="img" aria-label="三種刻度對照：英文每三位一級、中文每四位一級、電腦每二的十次方一級，對齊在同一條十的次方軸上">
<text x="12" y="36" class="fg-t sm">10 的幾次方</text>
<line x1="140" y1="40" x2="590" y2="40" class="fg-l dim"/>
<text x="140" y="32" text-anchor="middle" class="fg-t sm">0</text><text x="176" y="32" text-anchor="middle" class="fg-t sm">1</text><text x="212" y="32" text-anchor="middle" class="fg-t sm">2</text><text x="248" y="32" text-anchor="middle" class="fg-t sm">3</text><text x="284" y="32" text-anchor="middle" class="fg-t sm">4</text><text x="320" y="32" text-anchor="middle" class="fg-t sm">5</text><text x="356" y="32" text-anchor="middle" class="fg-t sm">6</text><text x="392" y="32" text-anchor="middle" class="fg-t sm">7</text><text x="428" y="32" text-anchor="middle" class="fg-t sm">8</text><text x="464" y="32" text-anchor="middle" class="fg-t sm">9</text><text x="500" y="32" text-anchor="middle" class="fg-t sm">10</text><text x="536" y="32" text-anchor="middle" class="fg-t sm">11</text><text x="572" y="32" text-anchor="middle" class="fg-t sm">12</text>
<text x="12" y="82" class="fg-t sm">英文：三位一級</text>
<rect x="210" y="58" width="76" height="40" rx="5" class="fg-b"/><text x="248" y="74" text-anchor="middle" class="fg-t sm">thousand</text><text x="248" y="90" text-anchor="middle" class="fg-t sm">千 10³</text>
<rect x="318" y="58" width="76" height="40" rx="5" class="fg-b"/><text x="356" y="74" text-anchor="middle" class="fg-t sm">million</text><text x="356" y="90" text-anchor="middle" class="fg-t sm">百萬 10⁶</text>
<rect x="426" y="58" width="76" height="40" rx="5" class="fg-b"/><text x="464" y="74" text-anchor="middle" class="fg-t sm">billion</text><text x="464" y="90" text-anchor="middle" class="fg-t sm">十億 10⁹</text>
<rect x="534" y="58" width="76" height="40" rx="5" class="fg-b"/><text x="572" y="74" text-anchor="middle" class="fg-t sm">trillion</text><text x="572" y="90" text-anchor="middle" class="fg-t sm">兆 10¹²</text>
<text x="12" y="134" class="fg-t sm">中文：四位一級</text>
<rect x="246" y="110" width="76" height="40" rx="5" class="fg-b alt"/><text x="284" y="127" text-anchor="middle" class="fg-t">萬</text><text x="284" y="143" text-anchor="middle" class="fg-t sm">10⁴</text>
<rect x="390" y="110" width="76" height="40" rx="5" class="fg-b alt"/><text x="428" y="127" text-anchor="middle" class="fg-t">億</text><text x="428" y="143" text-anchor="middle" class="fg-t sm">10⁸</text>
<rect x="534" y="110" width="76" height="40" rx="5" class="fg-b alt"/><text x="572" y="127" text-anchor="middle" class="fg-t">兆</text><text x="572" y="143" text-anchor="middle" class="fg-t sm">10¹²</text>
<text x="12" y="186" class="fg-t sm">電腦：2¹⁰ 一級</text>
<rect x="210" y="162" width="76" height="40" rx="5" class="fg-b hot"/><text x="248" y="179" text-anchor="middle" class="fg-t">KB</text><text x="248" y="195" text-anchor="middle" class="fg-t sm">2¹⁰ ≈ 10³</text>
<rect x="318" y="162" width="76" height="40" rx="5" class="fg-b hot"/><text x="356" y="179" text-anchor="middle" class="fg-t">MB</text><text x="356" y="195" text-anchor="middle" class="fg-t sm">2²⁰ ≈ 10⁶</text>
<rect x="426" y="162" width="76" height="40" rx="5" class="fg-b hot"/><text x="464" y="179" text-anchor="middle" class="fg-t">GB</text><text x="464" y="195" text-anchor="middle" class="fg-t sm">2³⁰ ≈ 10⁹</text>
<rect x="534" y="162" width="76" height="40" rx="5" class="fg-b hot"/><text x="572" y="179" text-anchor="middle" class="fg-t">TB</text><text x="572" y="195" text-anchor="middle" class="fg-t sm">2⁴⁰ ≈ 10¹²</text>
<text x="320" y="224" text-anchor="middle" class="fg-t sm warm">1 億 = 100 million；1 billion = 10 億；一千萬 = 10 million</text>
</svg><figcaption>英文和電腦的刻度剛好對齊（每 1,000 倍一級），中文的萬、億卻卡在中間。面試用英文講數字時，先換成 10 的次方再開口，就不會把 1 億講成 1 billion。</figcaption></figure>
<p>還有一個 7% 的小差：硬碟廠商的 1 GB 是 10⁹ 位元組，作業系統和很多雲端服務的 1 GiB 是 2³⁰，大約多 7%；到 TB 級差 10%。估算時可以不管，對帳單時要記得。</p>

<h3><span class="badge lv1">基礎</span>三、要背的數字（二）：延遲表與吞吐量</h3>
<p>第二組必背的是「做一件事要多久」。下面的數字是 2020 年代一般硬體的<b>數量級</b>，不是精確值，你的機器會不一樣。看形狀，不要背小數點：</p>
<figure class="figure"><svg viewBox="0 0 660 326" class="fg" style="width:100%;max-width:660px" role="img" aria-label="延遲階梯，對數刻度：L1 快取一奈秒、主記憶體一百奈秒、SSD 隨機讀約一百微秒、同機房來回零點五毫秒、跨可用區一到兩毫秒、硬碟尋軌約十毫秒、台北到東京約三十五毫秒、台北到美西約一百五十毫秒">
<text x="12" y="24" class="fg-t sm">動作</text><text x="128" y="24" class="fg-t sm">時間</text><text x="200" y="24" class="fg-t sm">對數刻度：每大格 10³ 倍</text><text x="650" y="24" text-anchor="end" class="fg-t sm">若 1 ns 算 1 秒</text>
<text x="12" y="52" class="fg-t">L1 快取</text><text x="128" y="52" class="fg-t sm mono">1 ns</text><rect x="200" y="41" width="4" height="14" rx="2" class="fg-b hot"/><text x="212" y="52" class="fg-t sm">1 秒</text>
<text x="12" y="80" class="fg-t">L2 快取</text><text x="128" y="80" class="fg-t sm mono">4 ns</text><rect x="200" y="69" width="28" height="14" rx="2" class="fg-b hot"/><text x="236" y="80" class="fg-t sm">4 秒</text>
<text x="12" y="108" class="fg-t">主記憶體</text><text x="128" y="108" class="fg-t sm mono">100 ns</text><rect x="200" y="97" width="92" height="14" rx="2" class="fg-b hot"/><text x="300" y="108" class="fg-t sm">1.7 分鐘</text>
<text x="12" y="136" class="fg-t">SSD 隨機讀</text><text x="128" y="136" class="fg-t sm mono">~100 μs</text><rect x="200" y="125" width="230" height="14" rx="2" class="fg-b alt"/><text x="438" y="136" class="fg-t sm">1.2 天</text>
<text x="12" y="164" class="fg-t">同機房來回</text><text x="128" y="164" class="fg-t sm mono">0.5 ms</text><rect x="200" y="153" width="262" height="14" rx="2" class="fg-b warm"/><text x="470" y="164" class="fg-t sm">5.8 天</text>
<text x="12" y="192" class="fg-t">跨可用區來回</text><text x="128" y="192" class="fg-t sm mono">1–2 ms</text><rect x="200" y="181" width="276" height="14" rx="2" class="fg-b warm"/><text x="484" y="192" class="fg-t sm">12 天</text>
<text x="12" y="220" class="fg-t">硬碟尋軌</text><text x="128" y="220" class="fg-t sm mono">~10 ms</text><rect x="200" y="209" width="322" height="14" rx="2" class="fg-b alt"/><text x="530" y="220" class="fg-t sm">3.8 個月</text>
<text x="12" y="248" class="fg-t">台北↔東京</text><text x="128" y="248" class="fg-t sm mono">~35 ms</text><rect x="200" y="237" width="347" height="14" rx="2" class="fg-b warm"/><text x="555" y="248" class="fg-t sm">1.1 年</text>
<text x="12" y="276" class="fg-t">台北↔美西</text><text x="128" y="276" class="fg-t sm mono">~150 ms</text><rect x="200" y="265" width="376" height="14" rx="2" class="fg-b warm"/><text x="584" y="276" class="fg-t sm">4.8 年</text>
<line x1="200" y1="294" x2="614" y2="294" class="fg-l"/>
<line x1="200" y1="290" x2="200" y2="298" class="fg-l"/><line x1="338" y1="290" x2="338" y2="298" class="fg-l"/><line x1="476" y1="290" x2="476" y2="298" class="fg-l"/><line x1="614" y1="290" x2="614" y2="298" class="fg-l"/>
<text x="200" y="314" text-anchor="middle" class="fg-t sm mono">1 ns</text><text x="338" y="314" text-anchor="middle" class="fg-t sm mono">1 μs</text><text x="476" y="314" text-anchor="middle" class="fg-t sm mono">1 ms</text><text x="614" y="314" text-anchor="middle" class="fg-t sm mono">1 s</text>
</svg><figcaption>綠色是 CPU 和記憶體，藍色是儲存，橘色是網路。每一大格差一千倍，所以從記憶體到跨洋網路，差了一百萬倍以上。右邊把 1 奈秒放大成 1 秒：讀一次記憶體像等一分多鐘，一趟太平洋來回像等將近五年。</figcaption></figure>
<p>這張表可以直接推出四條設計原則：</p>
<ol>
<li><b>熱資料放記憶體。</b>記憶體比 SSD 快大約一千倍。快取（第 3.5 課）賺的就是這一千倍。</li>
<li><b>同機房裡也別一來一回太多次。</b>一個請求依序做 20 次資料庫查詢，光網路來回就至少 20 × 0.5 ms = 10 ms。這就是 N+1 查詢問題會拖慢 API 的原因：不是資料庫慢，是來回太多。</li>
<li><b>跨洋的來回最貴。</b>台北到美西一趟 150 ms，TCP 握手、TLS 握手、再送請求，新連線還沒拿到第一個位元組就花掉兩三趟，三四百毫秒。所以要 CDN（第 3.8 課）、連線重用、TLS 1.3（第 1.5 課）。</li>
<li><b>光速是硬上限。</b>光在光纖裡每秒大約跑 20 萬公里，換算成來回，每 100 公里大約 1 ms。台北到東京約 2,100 公里，理論最快約 21 ms，實測 30 多毫秒。任何架構都打不破這個數字，只能把資料搬近一點。</li>
</ol>
<h4>吞吐量：一台東西每秒能做多少事</h4>
<table>
<tr><th>東西</th><th>典型數量級</th><th>估算時怎麼用</th></tr>
<tr><td>1 Gbps 網路</td><td>約 125 MB/s</td><td>位元和位元組差 8 倍，帳單和網卡寫的常常不是同一種</td></tr>
<tr><td>雲端區塊儲存（例如 AWS gp3 的基本配額）</td><td>3,000 IOPS、125 MiB/s</td><td>小機器的磁碟常常比 CPU 先到頂</td></tr>
<tr><td>本機 NVMe SSD</td><td>隨機讀每秒幾十萬次，連續讀每秒幾 GB</td><td>比雲端的網路磁碟快很多</td></tr>
<tr><td>Redis 單一執行個體</td><td>每秒約 10 萬次簡單操作</td><td>快取很少是瓶頸，網路來回才是</td></tr>
<tr><td>PostgreSQL 主庫，小交易</td><td>每秒幾千到一兩萬筆</td><td>看磁碟和提交設定，一定要自己壓測</td></tr>
<tr><td>一般 API 伺服器</td><td>每秒幾百到幾千個請求</td><td>看每個請求做多少事</td></tr>
<tr><td>即時閘道，閒置的 WebSocket</td><td>每台幾萬到幾十萬條</td><td>被記憶體和檔案描述符卡住，不是 CPU</td></tr>
</table>

<h3><span class="badge lv2">進階</span>四、一步一步算：流量、同時在線、寫入</h3>
<p>現在用猜高低平台實際算一次。面試時，先把假設寫在白板左上角，再開始算：</p>
<pre><code>假設
  註冊              1,000 萬 = 10^7
  每日活躍 DAU      註冊的 15%   → 1.5 × 10^6 人
  每人每天 API      100 次
  每人每天玩        20 回合
  尖峰／平均        3 倍
  尖峰同時在線      DAU 的 10%

API 請求
  1.5×10^6 × 100 = 1.5×10^8 次／天
  ÷ 86,400 秒     ≈ 1,700 次／秒
  × 3             ≈ 5,200 次／秒（尖峰）

回合與帳本（寫入路徑）
  1.5×10^6 × 20  = 3×10^7 回合／天
  ÷ 86,400       ≈ 350 回合／秒 → 尖峰 ≈ 1,050
  每回合 2 筆交易（扣入場點數、結算）
                 → 尖峰 ≈ 2,100 筆交易／秒

即時連線
  1.5×10^6 × 10% = 15 萬條 WebSocket
  每人每秒收 2 則 → 尖峰推送 30 萬則／秒</code></pre>
<p>心算時用 10⁵ 秒會得到 1,500 而不是 1,700，差 15%。這種誤差完全可以接受，面試官要看的是你知道自己差了多少。</p>
<p>算完要說「所以呢」：</p>
<ul>
<li><b>讀取 5,200 次／秒</b>：大部分是大廳、排行榜、個人資料，可以快取，也可以加讀取副本。不怕。</li>
<li><b>寫入 2,100 筆交易／秒</b>：快取幫不了，讀取副本也幫不了，全部要進同一台主庫。好消息是，一台規格不錯的 PostgreSQL 主庫扛小交易每秒幾千筆是常見的量級，所以<b>現在不需要分片</b>。這一句結論，可能就省下半年工程。但它是假設，要用第 4.4 課的負載測試確認。</li>
<li><b>連線 15 萬條、推送 30 萬則／秒</b>：分到十幾台閘道，每台每秒推兩萬多則，不算重。真正要小心的是重連（第六節）。</li>
</ul>
<h4>尖峰係數怎麼定</h4>
<p>「尖峰是平均的 3 倍」不是憑空來的，它來自產品的使用曲線。只做台灣市場的遊戲，全部使用者在同一個時區，曲線長這樣：</p>
<figure class="figure"><svg viewBox="0 0 640 250" class="fg" style="width:100%;max-width:640px" role="img" aria-label="一天二十四小時的流量曲線：清晨五點最低約平均的零點三倍，晚上十點最高約平均的三倍，平均線是一千七百次每秒">
<line x1="60" y1="36" x2="60" y2="210" class="fg-l"/><line x1="60" y1="210" x2="604" y2="210" class="fg-l"/>
<text x="66" y="36" class="fg-t sm">每秒請求數</text>
<line x1="60" y1="156.7" x2="600" y2="156.7" class="fg-l dim dash"/>
<text x="200" y="150" class="fg-t sm">平均 ≈ 1,700 次／秒</text>
<polyline points="60,135.3 82.5,162 105,172.7 127.5,186 150,192.9 172.5,194 195,192.9 217.5,183.3 240,175.3 262.5,172.7 285,170 307.5,167.3 330,156.7 352.5,162 375,167.3 397.5,167.3 420,167.3 442.5,164.7 465,159.3 487.5,140.7 510,119.3 532.5,76.7 555,50 577.5,92.7 600,135.3" class="fg-l on"/>
<circle cx="555" cy="50" r="4" class="fg-lamp on"/>
<text x="545" y="46" text-anchor="end" class="fg-t sm acc">尖峰 ≈ 5,200（3 倍）</text>
<line x1="172.5" y1="126" x2="172.5" y2="188" class="fg-l dim dash"/>
<text x="172.5" y="120" text-anchor="middle" class="fg-t sm">清晨谷底 ≈ 0.3 倍</text>
<text x="60" y="228" text-anchor="middle" class="fg-t sm">0 時</text><text x="195" y="228" text-anchor="middle" class="fg-t sm">6 時</text><text x="330" y="228" text-anchor="middle" class="fg-t sm">12 時</text><text x="465" y="228" text-anchor="middle" class="fg-t sm">18 時</text><text x="600" y="228" text-anchor="middle" class="fg-t sm">24 時</text>
</svg><figcaption>單一時區的產品，晚上九點到十一點最忙，清晨最閒，尖峰約是平均的 3 倍。容量要照那個尖峰抓；谷底那幾個小時，正好拿來做備份、批次工作和維護。</figcaption></figure>
<ul>
<li><b>單一時區</b>：尖峰通常是平均的 3 到 5 倍。</li>
<li><b>全球產品</b>：各時區互相填補，曲線比較平，常見 1.5 到 2 倍。</li>
<li><b>活動與推播</b>：新版本上線、節日活動、一則推播通知，可以在幾分鐘內把流量推到平常尖峰的好幾倍。這種尖峰要事先排程擴容（第 4.4 課），不能等自動擴展。</li>
<li><b>尖峰裡的尖峰</b>：這是遊戲特有的。猜高低每一回合有倒數計時，同一個房間的人都在最後幾秒出手。如果全平台 7,500 個房間的倒數都對齊在同一秒結束，「每分鐘平均」看起來很平，「每秒」卻是一根一根的刺。解法是讓每個房間的開局時間錯開一點隨機的秒數。</li>
</ul>

<h3><span class="badge lv2">進階</span>五、儲存與頻寬：會悄悄變大的兩樣東西</h3>
<h4>儲存</h4>
<p>每一回合會寫下：一列回合紀錄，加上平均約 3 列帳本分錄（扣入場點數是一對、猜對時發獎勵又是一對，大約一半的人猜對）。連同索引，假設每回合約 800 位元組：</p>
<pre><code>3×10^7 回合／天 × 800 B = 2.4×10^10 B ≈ 24 GB／天
× 365                    ≈ 8.8 TB／年（邏輯資料）
× 3 份（主庫＋同步備援＋讀取副本）≈ 26 TB／年 的磁碟
另外再加：WAL 封存、備份保留、建索引時的暫存空間</code></pre>
<p>一年 26 TB 放在雲端的區塊儲存上，又貴又難管：建一個新索引要好幾個小時，還原一次備份要更久。所以要按資料的「溫度」分層：</p>
<figure class="figure"><svg viewBox="0 0 640 206" class="fg" style="width:100%;max-width:640px" role="img" aria-label="資料分三層：最近九十天放在資料庫，九十天到兩年放到物件儲存並用欄式壓縮，兩年以上依政策封存或刪除">
<rect x="15" y="20" width="170" height="110" rx="8" class="fg-b hot"/>
<text x="100" y="44" text-anchor="middle" class="fg-t acc">熱：資料庫</text>
<text x="100" y="68" text-anchor="middle" class="fg-t sm">最近 90 天</text>
<text x="100" y="90" text-anchor="middle" class="fg-t sm">約 2.2 TB × 3 份</text>
<text x="100" y="112" text-anchor="middle" class="fg-t sm">查詢：毫秒級</text>
<rect x="235" y="20" width="170" height="110" rx="8" class="fg-b alt"/>
<text x="320" y="44" text-anchor="middle" class="fg-t alt">溫：物件儲存</text>
<text x="320" y="68" text-anchor="middle" class="fg-t sm">90 天到 2 年</text>
<text x="320" y="90" text-anchor="middle" class="fg-t sm">欄式壓縮，小好幾倍</text>
<text x="320" y="112" text-anchor="middle" class="fg-t sm">查詢：秒到分鐘</text>
<rect x="455" y="20" width="170" height="110" rx="8" class="fg-b"/>
<text x="540" y="44" text-anchor="middle" class="fg-t">冷：封存或刪除</text>
<text x="540" y="68" text-anchor="middle" class="fg-t sm">2 年以上</text>
<text x="540" y="90" text-anchor="middle" class="fg-t sm">照法規與保存政策</text>
<text x="540" y="112" text-anchor="middle" class="fg-t sm">查詢：幾乎不查</text>
<line x1="185" y1="75" x2="227" y2="75" class="fg-l on"/><polygon points="235,75 227,70.5 227,79.5" class="fg-a on"/>
<text x="210" y="66" text-anchor="middle" class="fg-t sm">每天搬</text>
<line x1="405" y1="75" x2="447" y2="75" class="fg-l"/><polygon points="455,75 447,70.5 447,79.5" class="fg-a"/>
<text x="430" y="66" text-anchor="middle" class="fg-t sm">到期</text>
<line x1="15" y1="166" x2="617" y2="166" class="fg-l dim"/><polygon points="625,166 617,161.5 617,170.5" class="fg-a"/>
<line x1="15" y1="160" x2="15" y2="172" class="fg-l"/><line x1="210" y1="160" x2="210" y2="172" class="fg-l"/><line x1="430" y1="160" x2="430" y2="172" class="fg-l"/>
<text x="15" y="190" class="fg-t sm">今天</text><text x="210" y="190" text-anchor="middle" class="fg-t sm">90 天</text><text x="430" y="190" text-anchor="middle" class="fg-t sm">2 年</text><text x="625" y="190" text-anchor="end" class="fg-t sm">資料的年紀</text>
</svg><figcaption>資料庫只留「還會被常常查」的部分，大小就固定在 90 天份，不再跟著時間一直長。舊資料搬到便宜的物件儲存，要查的時候用分析工具查。</figcaption></figure>
<p>落實的方法就是第 3.6 課的按日或按月分割表：每天把超過 90 天的那個分割匯出到物件儲存，然後整個分割直接 <code>DROP</code>，不用一列一列刪。以 AWS 美東的牌價當例子（約略，會變動）：gp3 區塊儲存每 GB 每月約 0.08 美元，S3 標準儲存約 0.023 美元，再加上壓縮，同一份資料放在物件儲存，可以便宜十倍以上。</p>
<h4>頻寬</h4>
<pre><code>API       5,200／秒 × 2 KB   ≈ 10 MB/s ≈  80 Mbps
WebSocket 30 萬／秒 × 150 B  ≈ 45 MB/s ≈ 360 Mbps
用戶端    30 萬人 × 8 MB     ≈ 2.4 TB／天
          （每天 20% 的 DAU 要下載）
          × 30 天            ≈ 每月 70 TB</code></pre>
<p>三個結論。第一，網卡不是問題：360 Mbps 分到十幾台閘道，每台才幾十 Mbps。第二，<b>最大的流量是遊戲用戶端本身</b>，不是遊戲過程。所以檔名要帶雜湊、放在 CDN 上長期快取（第 3.8 課），更新時只下載有變的部分。第三，出站流量是要付錢的。WebSocket 平均每秒約 15 MB（尖峰的三分之一），一個月就是 15 MB × 2.6 × 10⁶ 秒 ≈ 39 TB。訊息從 JSON 換成精簡的二進位格式、或打開 WebSocket 壓縮，帳單可以直接少一大截。</p>

<h3><span class="badge lv3">專業</span>六、記憶體、快取與連線</h3>
<h4>快取要多大</h4>
<p>快取要裝的是<b>工作集</b>（working set）：一段時間內真的會被讀到的那部分，不是全部資料。逐項估：</p>
<table>
<tr><th>放什麼</th><th>算式</th><th>大小</th></tr>
<tr><td>線上玩家的工作階段</td><td>15 萬 × 500 B</td><td>約 75 MB</td></tr>
<tr><td>今天活躍玩家的個人資料</td><td>150 萬 × 1 KB</td><td>約 1.5 GB</td></tr>
<tr><td>排行榜（有序集合）</td><td>150 萬名 × 約 100 B</td><td>約 150 MB</td></tr>
<tr><td>房間目錄（房間在哪台伺服器）</td><td>7,500 間 × 200 B</td><td>約 1.5 MB</td></tr>
<tr><td>每個鍵的管理成本、碎片</td><td>上面加總再乘 1.5 到 2</td><td>合計約 3 到 4 GB</td></tr>
</table>
<p>每秒操作數：尖峰 5,200 個請求，每個平均碰 3 次 Redis，約 1.5 萬次／秒，離單一執行個體的 10 萬次還很遠。結論：<b>一組 Redis 主＋副本就夠了，不需要 Redis Cluster</b>。記憶體要留一半的空間，因為 Redis 做快照時會 fork 一個子行程，寫入多的時候寫入時複製（copy-on-write）會讓記憶體用量暫時往上衝（第 3.5 課）。</p>
<h4>一台閘道撐幾條連線：卡在哪裡</h4>
<p>閒置的 WebSocket 幾乎不吃 CPU，卡住你的是另外三件事：</p>
<ol>
<li><b>記憶體。</b>每條連線有核心的 socket 緩衝區、TLS 的狀態、應用程式自己的讀寫緩衝區和連線物件。依語言和設定不同，常見落在每條十幾到幾十 KB。用 50 KB 保守估：2 萬條 × 50 KB = 1 GB，8 GB 的機器綽綽有餘。要知道你的真實數字，就開 1 萬條測試連線，看記憶體多了多少再除以 1 萬。</li>
<li><b>檔案描述符</b>（file descriptor）。每條連線佔一個。很多系統預設的軟上限只有 1,024，要在 systemd 的 <code>LimitNOFILE</code> 或 Docker 的 <code>--ulimit nofile</code> 調高，不然第 1,025 條連線就會收到 <code>EMFILE</code>（Too many open files）。</li>
<li><b>來源連接埠</b>。如果前面是 L7 的反向代理，它對同一個後端位址的每條連線，都要用掉代理自己的一個來源連接埠。Linux 預設的範圍是 32768 到 60999，大約 2.8 萬個。一台代理對一台閘道，最多大約 2.8 萬條同時連線。短連線還更糟：連線關掉後會在 <code>TIME_WAIT</code> 停 60 秒，每秒新開 1,000 條，60 秒就累積 6 萬個，超過能用的連接埠數，新連線開始失敗。對策是連線重用、讓代理用多個來源 IP，或改用不經過代理的 L4 負載平衡（第 1.7 課）。</li>
</ol>
<div class="note"><b>重連要算進容量。</b>一台閘道掛掉，它上面的 2 萬人會同時重連到其他台。部署時更糟：如果 15 萬人在 1 秒內一起重連，就是每秒 15 萬次 TLS 握手加上驗證工作階段。TLS 握手要做非對稱加密，比推一則訊息貴得多。讓用戶端在 0 到 30 秒之間隨機延遲再重連，每秒就只剩 5,000 次。容量要照「重連的那一分鐘」準備，而不是照平常。</div>

<h3><span class="badge lv3">專業</span>七、成本估算：把台數換成錢</h3>
<p>成本的算法就是「數量 × 單價」，分成運算、儲存、流量三大塊。下面的單價是示意用的數量級，實際要查你用的雲端的價目表或用它的價格計算機：</p>
<table>
<tr><th>項目</th><th>數量</th><th>示意單價</th><th>每月約</th></tr>
<tr><td>應用程式伺服器（4 vCPU、16 GB）</td><td>15 台</td><td>約 US$0.2／小時</td><td>US$2,200</td></tr>
<tr><td>即時閘道（同規格）</td><td>11 台</td><td>同上</td><td>US$1,600</td></tr>
<tr><td>房間伺服器（同規格）</td><td>9 台</td><td>同上</td><td>US$1,300</td></tr>
<tr><td>帳本資料庫：主庫＋同步備援＋讀取副本</td><td>3 台大機型</td><td>假設是上面的 8 倍</td><td>US$3,500</td></tr>
<tr><td>資料庫磁碟</td><td>3 份 × 3 TB</td><td>約 US$0.08／GB-月</td><td>US$700</td></tr>
<tr><td>Redis 主＋副本</td><td>2 台</td><td>—</td><td>US$500</td></tr>
<tr><td>出站流量（WebSocket＋API）</td><td>約 40 TB</td><td>US$0.05 到 0.09／GB</td><td>US$2,000 到 3,600</td></tr>
<tr><td>CDN（用戶端下載）</td><td>約 70 TB</td><td>看合約與量</td><td>US$2,000 到 4,000</td></tr>
<tr><td><b>合計</b></td><td></td><td></td><td><b>約 US$14,000 到 17,000</b></td></tr>
</table>
<p>算出總數之後，再做兩件事：</p>
<ul>
<li><b>換成「每個活躍使用者每月多少錢」</b>：約 US$15,000 ÷ 150 萬 ≈ 每人每月 1 美分。拿去跟每個使用者帶來的收入比，就知道這套架構撐不撐得起這門生意。這個比值是主管最在乎的一個數字。</li>
<li><b>找出最大的三項</b>。這張表裡是資料庫和兩種流量。最佳化先從大的下手：流量靠壓縮和 CDN 快取命中率，資料庫靠分層儲存。穩定的基本量用預約或長期承諾方案（通常便宜三到六成），臨時的批次工作才用隨選或競價執行個體。</li>
</ul>
<p>還有兩項常被漏掉的：監控與日誌（量大時常佔總額的一成以上），和人。一個能 24 小時值班的團隊，人事成本通常遠高於這張表。</p>

<h3><span class="badge lv3">專業</span>八、檢查估算：你怎麼知道自己沒算錯</h3>
<p>估算最危險的不是誤差，是你算錯了卻不知道。六個檢查方法：</p>
<ol>
<li><b>用兩條路算同一個數。</b>「尖峰同時在線 = DAU 的 10%」是由上往下的假設。由下往上再算一次：尖峰 15 萬人、尖峰是平均的 3 倍，所以平均同時在線 5 萬人。5 萬 × 86,400 秒 ÷ 150 萬人 ≈ 2,880 秒，也就是<b>每人每天平均在線 48 分鐘</b>。對一款休閒遊戲合理嗎？如果你的產品數據說每人每天只玩 20 分鐘，那同時在線應該只有一半。兩條路差 2 倍以內，可以接受；差 10 倍，一定有一個假設是錯的。</li>
<li><b>換算成每一個人。</b>每天 24 GB ÷ 150 萬人 = 每人 16 KB。20 回合 × 800 B 剛好是 16 KB。對得上。如果算出每人每天 16 MB，就知道哪裡多乘了一千。</li>
<li><b>跟物理極限比。</b>帳本每秒 2,100 筆交易，每筆提交都要把 WAL 寫到磁碟。資料庫會把同時提交的交易合併成一次寫入（group commit），但磁碟的 IOPS 上限還是要看。如果資料庫放在只有 3,000 IOPS 基本配額的雲端磁碟上，就已經很接近了，要另外買 IOPS 或換本機 NVMe。這種「估出來沒問題，但碰到雲端配額」的情況非常常見。</li>
<li><b>檢查單位。</b>最常見的三個錯：位元和位元組（Mbps 和 MB/s 差 8 倍）、每天和每秒（差 86,400 倍）、平均和尖峰。</li>
<li><b>做敏感度分析。</b>問自己：哪一個假設動一下，結果變最多？這題裡是「每日活躍佔幾成」和「尖峰係數」。把它們各調成兩倍再算一次，給出一個範圍：「應用程式伺服器 15 到 40 台」。範圍比單一數字誠實，也告訴大家最該先去量哪一個假設。</li>
<li><b>跟常識比。</b>算出「一千萬註冊使用者需要 2,000 台伺服器」，就要停下來：那代表每台只服務幾百個活躍使用者，幾乎一定是哪裡多乘了。</li>
</ol>

<h3><span class="badge lv4">專家</span>九、從估算到容量計畫</h3>
<p>估算回答「大概要多少」。容量計畫要再回答三件事：每台實際能扛多少（用壓測量）、少掉一個可用區還撐不撐得住、以及<b>什麼時候要開始動工</b>。</p>
<table>
<tr><th>元件</th><th>單台安全值 → 尖峰需求</th><th>台數（3 區，少一區也撐得住）</th><th>要多久才擴得上去</th></tr>
<tr><td>應用程式伺服器</td><td>每秒 500 → 5,200 個請求</td><td>每區 6 台，共 18 台</td><td>幾分鐘</td></tr>
<tr><td>即時閘道</td><td>2 萬 → 15 萬條連線</td><td>每區 4 台，共 12 台</td><td>幾分鐘，但連線要慢慢搬</td></tr>
<tr><td>帳本主庫</td><td>假設 6,000 → 2,100 筆交易／秒</td><td>1 主＋1 同步備援</td><td>換機型：一次容錯移轉；分片：好幾個月</td></tr>
<tr><td>Redis</td><td>26 GB → 4 GB；10 萬 → 1.5 萬次／秒</td><td>1 主＋1 副本</td><td>幾十分鐘</td></tr>
</table>
<p>注意應用程式伺服器從上一課的 15 台變成 18 台：少掉一個可用區時，剩下兩區要分擔全部 5,200，每區 2,600 ÷ 500 = 5.2，進位成 6 台。這就是第 4.4 課 N+1 的算法。<b>韌性是要花錢的</b>，這裡多花兩成。</p>
<h4>跑道：離撞牆還有幾個月</h4>
<p>表格最右邊那一欄最重要。應用程式伺服器加幾台只要幾分鐘，但資料庫要分片是好幾個月的工程。所以要算<b>跑道</b>（runway）：照現在的成長速度，多久會碰到上限？</p>
<pre><code>跑道（月）= ln(上限 ÷ 現在) ÷ ln(1 + 每月成長率)

帳本主庫現在 35%，每月成長 15%：
  到 70%（目標上限）：ln(2)    ÷ ln(1.15) ≈ 5.0 個月
  到 100%（撐不住） ：ln(2.86) ÷ ln(1.15) ≈ 7.5 個月</code></pre>
<figure class="figure"><svg viewBox="0 0 640 260" class="fg" style="width:100%;max-width:640px" role="img" aria-label="跑道圖：資料庫使用率從百分之三十五每月成長百分之十五，第五個月碰到百分之七十的目標上限，第七點五個月碰到百分之百；分片工程要六個月，所以最晚第一點五個月就要開工">
<line x1="60" y1="30" x2="60" y2="220" class="fg-l"/><line x1="60" y1="220" x2="610" y2="220" class="fg-l"/>
<line x1="60" y1="94" x2="600" y2="94" class="fg-l warm dash"/>
<text x="600" y="88" text-anchor="end" class="fg-t sm warm">目標上限 70%</text>
<line x1="60" y1="40" x2="600" y2="40" class="fg-l dim dash"/>
<text x="54" y="44" text-anchor="end" class="fg-t sm">100%</text><text x="54" y="98" text-anchor="end" class="fg-t sm">70%</text><text x="54" y="161" text-anchor="end" class="fg-t sm">35%</text><text x="54" y="224" text-anchor="end" class="fg-t sm">0%</text>
<polyline points="60,157 105,147.6 150,136.7 195,124.2 240,109.8 285,93.3 330,74.3 375,52.4 397.5,40.4" class="fg-l on"/>
<text x="205" y="150" text-anchor="middle" class="fg-t sm acc">每月成長 15%</text>
<circle cx="60" cy="157" r="4" class="fg-lamp on"/><text x="68" y="174" class="fg-t sm">今天</text>
<circle cx="283" cy="94" r="4" class="fg-lamp on"/><text x="292" y="112" class="fg-t sm">第 5 個月：到 70%</text>
<circle cx="397.5" cy="40" r="4" class="fg-lamp on"/><text x="408" y="56" class="fg-t sm warm">第 7.5 個月：撐不住</text>
<line x1="127.5" y1="143" x2="127.5" y2="196" class="fg-l dim dash"/>
<text x="135" y="168" class="fg-t sm">最晚開工：第 1.5 個月</text>
<line x1="135.5" y1="202" x2="389.5" y2="202" class="fg-l alt"/><polygon points="127.5,202 135.5,197.5 135.5,206.5" class="fg-a alt"/><polygon points="397.5,202 389.5,197.5 389.5,206.5" class="fg-a alt"/>
<text x="262" y="196" text-anchor="middle" class="fg-t sm alt">分片工程：6 個月</text>
<text x="60" y="238" text-anchor="middle" class="fg-t sm">0</text><text x="150" y="238" text-anchor="middle" class="fg-t sm">2</text><text x="240" y="238" text-anchor="middle" class="fg-t sm">4</text><text x="330" y="238" text-anchor="middle" class="fg-t sm">6</text><text x="420" y="238" text-anchor="middle" class="fg-t sm">8</text><text x="510" y="238" text-anchor="middle" class="fg-t sm">10</text><text x="600" y="238" text-anchor="middle" class="fg-t sm">12</text>
<text x="330" y="254" text-anchor="middle" class="fg-t sm">距今幾個月</text>
</svg><figcaption>從撞牆的那一天往回扣掉工程要花的時間，才是真正的期限。這個例子裡，如果要在碰到 70% 之前完成，其實已經晚了一個月。</figcaption></figure>
<p>這張圖要你看懂一件事：<b>容量問題的期限，是「撞牆日減掉前置時間」</b>。5 個月後到 70%、工程要 6 個月，表示你上個月就該開始了。這時候有三個選擇：買時間（換更大的機型、把讀取移到副本、把歷史資料搬走，讓使用率降回 25%）、降低成長（不太可能）、或者接受在超過 70% 的狀態下跑一陣子並加強監控。好的容量計畫會把這三個選項連同成本一起列出來，讓主管做決定。</p>
<h4>讓計畫活著</h4>
<ul>
<li><b>每個月對一次帳。</b>上個月預測的尖峰和實際量到的差多少？差很多，就改模型裡的假設，而不是改數字讓它看起來對。</li>
<li><b>已知的尖峰另外列。</b>改版、節日、行銷活動，跟行銷部門要日期，事先排程擴容。</li>
<li><b>把成本放在同一張表上。</b>每一個「多加 N 台」的決定，旁邊都寫上每月多少錢。容量計畫同時也是預算計畫。</li>
</ul>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>估算要算得很準才有用</td><td>要的是數量級對。差 2 倍架構不變，差 10 倍才會。把時間花在找出最關鍵的假設，而不是算到小數點。</td></tr>
<tr><td>照平均流量準備容量</td><td>要照尖峰，還要照「尖峰時少掉一個可用區」和「部署時大家一起重連」。平均值只用來算帳單。</td></tr>
<tr><td>一千萬使用者一定要分散式資料庫</td><td>先算寫入量。這個例子尖峰每秒兩千多筆交易，一台好的主庫就扛得住。很多團隊太早分片，花了一年處理不存在的問題。</td></tr>
<tr><td>伺服器數量是最大的成本</td><td>常常是流量、資料庫、監控日誌，還有人。先列出來再說。</td></tr>
<tr><td>閘道的上限是 CPU</td><td>閒置連線幾乎不吃 CPU，先撞到的是記憶體、檔案描述符、來源連接埠，還有重連時的 TLS 握手量。</td></tr>
<tr><td>估算做完就可以丟了</td><td>估算是容量計畫的第一版。之後每個月用量測值換掉一個假設，它就越來越準。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>前端與 TypeScript</b>：後端的 64 位元 ID 用字串傳，別讓 Number 吃掉精度。用戶端的大小直接變成 CDN 帳單：遊戲包每少 1 MB，乘上每天下載的人數，就是每月多少 TB。</li>
<li><b>Cocos、Unity 的遊戲</b>：倒數計時、整點活動、推播，都會讓請求對齊在同一秒。設計時就加上隨機錯開，比事後擴容便宜。斷線重連一定要隨機延遲加上逐次拉長。</li>
<li><b>Node.js、Go 的後端</b>：開一個服務之前，先算「每秒幾個請求 × 每個請求花多久」，就知道要幾個執行個體、連線池要多大（第 3.3 課）。主鍵用 <code>bigint</code>，檔案描述符上限要調高。</li>
<li><b>Docker 與雲端主機</b>：容器的記憶體上限、雲端磁碟的 IOPS 配額、可爆發型機器的 CPU 點數，都是估算裡要列出來的「隱藏上限」。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<ol>
<li>「一個短網址服務，每天新建 100 萬個短網址、每天被點 1 億次。估算每秒請求數和五年的儲存量。」</li>
<li>「你估出尖峰每秒 5,000 個請求。你怎麼知道這個數字是對的？」</li>
<li>「為什麼容量要照尖峰而不是平均？尖峰係數怎麼決定？」</li>
<li>「一台伺服器能撐幾條 WebSocket？限制在哪裡？」</li>
<li>「你的資料庫現在用到 40%，每月成長 10%。你什麼時候要開始擔心？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>點擊：10⁸ ÷ 10⁵ ≈ 每秒 1,000 次，尖峰抓 3 倍約 3,000 次，讀多寫少，讀可以放快取和 CDN。新建：10⁶ ÷ 10⁵ ≈ 每秒 10 筆，寫入很輕。儲存：每筆短碼、長網址、建立時間加索引約 500 B，每天 10⁶ × 500 B = 500 MB，五年約 500 MB × 1,800 天 ≈ 900 GB，連副本約 3 TB，一台資料庫放得下。短碼長度：62 個字元選 7 個，62⁷ ≈ 3.5 × 10¹²，五年 18 億筆用不到千分之一。結論：難的不是量，是熱門短網址的快取和防濫用。</li>
<li>三個方法：用另一條路再算一次（例如由每人每天在線時間推回同時在線數），換算成每個使用者看合不合理，以及做敏感度分析，給出範圍並指出最影響結果的假設。最後一定要說：上線前用負載測試量單台能扛多少，上線後用真實的尖峰換掉假設。</li>
<li>使用者感受到的是最忙那一刻的體驗，平均值會把尖峰稀釋掉；而且使用率接近滿載時延遲是爆炸性上升的。尖峰係數來自使用曲線：單一時區 3 到 5 倍，全球 1.5 到 2 倍，活動和推播另外列為已知尖峰，事先擴容。</li>
<li>閒置連線的限制通常不是 CPU，而是每條連線的記憶體（緩衝區、TLS 狀態、應用程式物件，常見十幾到幾十 KB）、檔案描述符上限、經過代理時的來源連接埠數（Linux 預設約 2.8 萬），以及斷線重連時的 TLS 握手量。實務上每台抓幾萬條，實際數字用測試量出每條連線的記憶體再算。</li>
<li>用跑道公式：到 70% 是 ln(1.75) ÷ ln(1.1) ≈ 5.9 個月。如果要做的事（例如分片、搬資料）要 4 個月，那兩個月內就要開工；如果只是換大機型，幾天就夠。重點是拿前置時間跟跑道比，而不是只看現在的使用率。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>一個聊天 app 有 500 萬每日活躍使用者，每人每天發 40 則訊息，每則（含索引）300 B。算出平均和尖峰（3 倍）每秒幾則、每年要多少磁碟（存 3 份）。</li>
<li>帳本平均每秒新增 1,050 列。如果主鍵不小心用了 32 位元的 <code>serial</code>，幾天後會出事？</li>
<li>30 萬則／秒、每則 150 B 的推送，分到 12 台閘道。每台需要多少 Mbps？如果負載平衡出 bug，全部擠到一台，1 Gbps 的網卡夠不夠？</li>
<li>資料庫現在 40%，每月成長 10%，目標上限 70%，要做的遷移工程需要 4 個月。最晚第幾個月要開工？</li>
<li>用第七節的成本表，假設流量和 CDN 都取中間值。如果每個活躍使用者每月平均帶來 0.05 美元收入，基礎架構佔收入的幾成？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>每天 5 × 10⁶ × 40 = 2 × 10⁸ 則，÷ 86,400 ≈ 2,300 則／秒，尖峰約 7,000 則／秒。每天 2 × 10⁸ × 300 B = 60 GB，一年約 22 TB，存 3 份約 66 TB。這個量已經值得考慮分割、分層儲存，甚至換成專為大量寫入設計的儲存。</li>
<li>2,147,483,647 ÷ 1,050 ≈ 2.04 × 10⁶ 秒 ≈ 24 天。上線不到一個月，所有新增都會失敗。</li>
<li>300,000 × 150 B = 45 MB/s = 360 Mbps；12 台各約 30 Mbps。全部擠到一台是 360 Mbps，1 Gbps 還夠，但那一台的連線數、記憶體和 CPU 早就先撐不住了。頻寬很少是閘道的第一個瓶頸。</li>
<li>到 70% 的跑道：ln(70 ÷ 40) ÷ ln(1.1) = 0.560 ÷ 0.0953 ≈ 5.9 個月。扣掉 4 個月，最晚大約第 1.9 個月要開工，也就是兩個月內。</li>
<li>成本約 US$2,200 + 1,600 + 1,300 + 3,500 + 700 + 500 + 2,800 + 3,000 ≈ US$15,600。收入 150 萬 × 0.05 = US$75,000。基礎架構約佔兩成，偏高。最先該看的是兩種流量（壓縮、CDN 命中率）和資料庫（分層儲存、預約方案）。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>Alex Xu《System Design Interview – An Insider's Guide》</b>：第 2 章就是信封背面估算，裡面的 2 的次方表、延遲表、面試時的寫法，跟這一章互相對照。</li>
<li><b>Brendan Gregg《Systems Performance》第二版</b>：第 2 章有一張把各種延遲放大成「人類時間」的表，整本書則是量測單台能扛多少的方法。</li>
<li><b>Peter Norvig〈Teach Yourself Programming in Ten Years〉</b>（<a href="https://norvig.com/21-days.html">norvig.com/21-days.html</a>）：文末那張「各種操作大約要多久」的時間表，是後來大家流傳的延遲表的源頭之一。</li>
<li><b>Google《Site Reliability Engineering》</b>（<a href="https://sre.google/books/">sre.google/books</a>）：免費線上版，談過載、容量和需求預測的章節，可以看到大公司怎麼把估算變成制度。</li>
<li><b>AWS Pricing Calculator</b>（<a href="https://calculator.aws/">calculator.aws</a>）：把第七節的表格換成真實的價格，自己算一次你平台的月費。</li>
</ul>
` });
