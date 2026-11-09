DEEP({ 'job-portfolio': `
<p>上一課列出了八件作品，和一個原則：開頭先講結果，而且要有數字。這一章教你把它做到專業的程度：怎麼把每天的工作變成證據、一篇技術文章（write-up）從標題到最後一行該怎麼排、圖怎麼畫、數字怎麼給才讓人信、為什麼要老實寫出取捨和失敗；接著是讓審閱者願意信任的 GitHub 個人頁、公開之前怎麼遮蔽敏感資訊（redact）；最後是兩個放大器：寫部落格和上台分享。沒有學歷的人，作品集（portfolio）就是你的成績單。成績單寫得好不好，是一門可以練的手藝。</p>

<h3><span class="badge lv1">基礎</span>一、說法和證據：把工作變成看得見的東西</h3>
<p>兩個廚師去應徵。第一個說：「我很會做菜，做過很多年。」第二個什麼都沒說，端出一盤菜，旁邊附一張卡片：「這道菜原本出餐要 25 分鐘，我把備料流程改了，現在 8 分鐘，客人退菜從每週五次變成零次。」老闆會先想試哪一個？</p>
<p>履歷上的「熟悉 Kubernetes」是說法；一篇寫著「我把部署時間從 40 分鐘縮到 6 分鐘，這是做法和圖」的技術文章是證據。審閱的人每天看幾十份說法，幾乎記不住任何一份；一份好證據，他會轉給同事看。問題是，證據不會自己長出來。它要經過一條管線：</p>
<figure class="figure"><svg viewBox="0 0 680 200" class="fg" style="width:100%;max-width:680px" role="img" aria-label="證據管線：做事、當週筆記、技術文章、公開、被引用；最常斷在做事和筆記之間，面試被追問的經驗會回頭告訴你下次要記什麼">
<rect x="20" y="50" width="112" height="46" rx="6" class="fg-b"/><text x="76" y="70" text-anchor="middle" class="fg-t">做事</text><text x="76" y="88" text-anchor="middle" class="fg-t sm">改了什麼</text>
<rect x="152" y="50" width="112" height="46" rx="6" class="fg-b alt"/><text x="208" y="70" text-anchor="middle" class="fg-t">當週筆記</text><text x="208" y="88" text-anchor="middle" class="fg-t sm">前後數字、截圖</text>
<rect x="284" y="50" width="112" height="46" rx="6" class="fg-b alt"/><text x="340" y="70" text-anchor="middle" class="fg-t">技術文章</text><text x="340" y="88" text-anchor="middle" class="fg-t sm">一頁、有圖</text>
<rect x="416" y="50" width="112" height="46" rx="6" class="fg-b alt"/><text x="472" y="70" text-anchor="middle" class="fg-t">公開</text><text x="472" y="88" text-anchor="middle" class="fg-t sm">GitHub、個人網站</text>
<rect x="548" y="50" width="112" height="46" rx="6" class="fg-b hot"/><text x="604" y="70" text-anchor="middle" class="fg-t acc">被引用</text><text x="604" y="88" text-anchor="middle" class="fg-t sm">履歷、面試故事</text>
<line x1="132" y1="73" x2="144" y2="73" class="fg-l warm"/><polygon points="152,73 144,68.5 144,77.5" class="fg-a warm"/>
<line x1="264" y1="73" x2="276" y2="73" class="fg-l"/><polygon points="284,73 276,68.5 276,77.5" class="fg-a"/>
<line x1="396" y1="73" x2="408" y2="73" class="fg-l"/><polygon points="416,73 408,68.5 408,77.5" class="fg-a"/>
<line x1="528" y1="73" x2="540" y2="73" class="fg-l"/><polygon points="548,73 540,68.5 540,77.5" class="fg-a"/>
<text x="142" y="32" text-anchor="middle" class="fg-t sm warm">最常斷在這裡：沒記數字</text>
<line x1="142" y1="38" x2="142" y2="64" class="fg-l warm dash"/>
<path d="M604 96 V140 H76 V104" class="fg-l dash"/><polygon points="76,96 71.5,104 80.5,104" class="fg-a"/>
<text x="340" y="160" text-anchor="middle" class="fg-t sm">面試被追問過一次，你就知道下次做事時該記什麼</text>
<text x="340" y="186" text-anchor="middle" class="fg-t sm">一件事做完當週就寫筆記；三個月後再回想，數字和細節都不見了</text>
</svg><figcaption>五個環節裡，最常斷掉的是第一個箭頭。事情做完了，卻沒有在當下記下「改之前是多少、改之後是多少」，事後就再也補不回來。</figcaption></figure>
<h4>當週筆記要記什麼</h4>
<p>不用寫成文章，五行就夠。重點是在記憶還新鮮的時候，把<b>之後拿不回來的東西</b>留下來：</p>
<ul>
<li><b>前後的數字</b>：延遲、錯誤率、部署時間、雲端帳單、告警次數。改之前先截圖或匯出，改之後再截一次。</li>
<li><b>為什麼要做</b>：誰在痛、痛到什麼程度。「客服一週收到十幾封說遊戲卡住的信」比「效能不好」有力得多。</li>
<li><b>考慮過、但沒選的做法</b>：這是最快被忘記、卻最能展現判斷力的部分。</li>
<li><b>出錯的地方</b>：第一次改壞了什麼、怎麼發現的。</li>
</ul>
<p>建一個私人的筆記檔就好，每週五花十分鐘。半年後，你會有二十幾則筆記，從裡面挑最好的四五則寫成文章，作品集就成形了。</p>

<h3><span class="badge lv1">基礎</span>二、每件作品的骨架：問題、做法、結果</h3>
<p>不管是架構文章、事後檢討還是負載測試報告，骨架都是同一個三段式：<b>問題</b>（有多痛，用數字講）、<b>做法</b>（你考慮過什麼、選了什麼、為什麼）、<b>結果</b>（改善了多少，代價是什麼）。拿這個網站一路用的「猜高低」遊戲當例子，比較一下同一件事的兩種寫法：</p>
<figure class="figure"><svg viewBox="0 0 680 240" class="fg" style="width:100%;max-width:680px" role="img" aria-label="同一件事的兩種寫法：弱的寫法只有一句我改善了排行榜 API 的效能；強的寫法分成問題、做法、結果三段，每段都有數字">
<rect x="20" y="40" width="220" height="180" rx="8" class="fg-b warm"/>
<text x="130" y="64" text-anchor="middle" class="fg-t warm">弱的寫法</text>
<text x="130" y="116" text-anchor="middle" class="fg-t">「我改善了排行榜</text><text x="130" y="138" text-anchor="middle" class="fg-t">API 的效能。」</text>
<text x="130" y="186" text-anchor="middle" class="fg-t sm">讀的人不知道：多慢？</text><text x="130" y="204" text-anchor="middle" class="fg-t sm">怎麼做的？改善多少？</text>
<line x1="240" y1="130" x2="264" y2="130" class="fg-l on"/><polygon points="272,130 264,125.5 264,134.5" class="fg-a on"/>
<text x="256" y="118" text-anchor="middle" class="fg-t sm acc">改寫</text>
<text x="470" y="28" text-anchor="middle" class="fg-t acc">強的寫法</text>
<rect x="280" y="40" width="380" height="52" rx="6" class="fg-b"/><rect x="288" y="48" width="60" height="36" rx="5" class="fg-b hot"/><text x="318" y="71" text-anchor="middle" class="fg-t acc">問題</text>
<text x="360" y="62" class="fg-t sm">排行榜 API 的 p95 是 900 ms</text><text x="360" y="80" class="fg-t sm">晚上尖峰時有 3% 的請求逾時</text>
<rect x="280" y="104" width="380" height="52" rx="6" class="fg-b"/><rect x="288" y="112" width="60" height="36" rx="5" class="fg-b hot"/><text x="318" y="135" text-anchor="middle" class="fg-t acc">做法</text>
<text x="360" y="126" class="fg-t sm">執行計畫顯示全表掃描 → 加複合索引</text><text x="360" y="144" class="fg-t sm">連線數爆掉 → 加連線池代理</text>
<rect x="280" y="168" width="380" height="52" rx="6" class="fg-b"/><rect x="288" y="176" width="60" height="36" rx="5" class="fg-b hot"/><text x="318" y="199" text-anchor="middle" class="fg-t acc">結果</text>
<text x="360" y="190" class="fg-t sm">p95 降到 140 ms，逾時歸零</text><text x="360" y="208" class="fg-t sm">代價：多一個要維運的元件</text>
<line x1="470" y1="92" x2="470" y2="96" class="fg-l"/><polygon points="470,104 465.5,96 474.5,96" class="fg-a"/>
<line x1="470" y1="156" x2="470" y2="160" class="fg-l"/><polygon points="470,168 465.5,160 474.5,160" class="fg-a"/>
</svg><figcaption>同一件事，右邊每一段都回答了一個審閱者心裡的問題。注意最後一行的「代價」：它讓整件事看起來是被真實考驗過的，而不是廣告。</figcaption></figure>
<p>三段裡最容易寫壞的是「做法」。很多人只寫「我做了什麼」，像一張待辦清單。資深的人會寫「我<b>為什麼</b>這樣做」：「索引和快取我都考慮過。快取會讓排行榜晚幾秒更新，玩家會抱怨看不到自己的新分數，所以先做索引；索引解決了查詢慢，但尖峰時連線數還是爆掉，才再加連線池代理。」這段推理，就是第 9.3 課說的「資深和資淺的差別」。</p>

<h3><span class="badge lv2">進階</span>三、一篇技術文章的版面：從標題到最後一行</h3>
<p>審閱的人給一份作品集的時間很短。他不會從頭讀到尾，而是先看標題、摘要和圖，覺得有意思才往下讀。所以版面要照「讀者的注意力」來排，最重要的放最上面：</p>
<figure class="figure"><svg viewBox="0 0 680 360" class="fg" style="width:100%;max-width:680px" role="img" aria-label="一篇技術文章的版面，由上到下是標題、三行摘要、背景與限制、架構圖、考慮過的做法、結果、取捨、連結；左邊是建議長度，右邊標出審閱者在每一段的目的">
<rect x="150" y="10" width="320" height="330" rx="8" class="fg-b"/>
<rect x="166" y="24" width="288" height="28" rx="4" class="fg-b hot"/><text x="310" y="43" text-anchor="middle" class="fg-t acc">標題就是結果</text>
<rect x="166" y="58" width="288" height="38" rx="4" class="fg-b hot"/><text x="310" y="82" text-anchor="middle" class="fg-t">TL;DR：三行摘要</text>
<rect x="166" y="102" width="288" height="26" rx="4" class="fg-b"/><text x="310" y="120" text-anchor="middle" class="fg-t">背景與限制</text>
<rect x="166" y="134" width="288" height="52" rx="4" class="fg-b alt"/><text x="310" y="157" text-anchor="middle" class="fg-t">架構圖</text><text x="310" y="175" text-anchor="middle" class="fg-t sm">請求怎麼走、哪裡出問題</text>
<rect x="166" y="192" width="288" height="30" rx="4" class="fg-b"/><text x="310" y="212" text-anchor="middle" class="fg-t">考慮過的做法</text>
<rect x="166" y="228" width="288" height="30" rx="4" class="fg-b"/><text x="310" y="248" text-anchor="middle" class="fg-t">結果：前後對照</text>
<rect x="166" y="264" width="288" height="30" rx="4" class="fg-b warm"/><text x="310" y="284" text-anchor="middle" class="fg-t">取捨、下次會怎麼改</text>
<rect x="166" y="300" width="288" height="26" rx="4" class="fg-b"/><text x="310" y="318" text-anchor="middle" class="fg-t">連結：儲存庫、儀表板</text>
<text x="140" y="43" text-anchor="end" class="fg-t sm">一行</text><text x="140" y="82" text-anchor="end" class="fg-t sm">三行</text><text x="140" y="120" text-anchor="end" class="fg-t sm">一段</text><text x="140" y="165" text-anchor="end" class="fg-t sm">一張</text><text x="140" y="212" text-anchor="end" class="fg-t sm">兩三列表格</text><text x="140" y="248" text-anchor="end" class="fg-t sm">一張圖表</text><text x="140" y="284" text-anchor="end" class="fg-t sm">一段</text><text x="140" y="318" text-anchor="end" class="fg-t sm">兩三個</text>
<path d="M480 24 H490 V186 H480" class="fg-l on"/><text x="500" y="100" class="fg-t acc">前一分鐘</text><text x="500" y="118" class="fg-t sm">審閱者只看這幾塊</text>
<path d="M480 192 H490 V294 H480" class="fg-l alt"/><text x="500" y="238" class="fg-t alt">判斷資深</text><text x="500" y="256" class="fg-t sm">看你怎麼想、怎麼取捨</text>
<path d="M480 300 H490 V326 H480" class="fg-l dim"/><text x="500" y="318" class="fg-t sm">想驗證的人才點</text>
</svg><figcaption>上半部負責讓人「想讀下去」，下半部負責讓人「相信你」。兩半缺一不可：只有上半部像廣告，只有下半部沒人讀得到。</figcaption></figure>
<h4>每一塊怎麼寫</h4>
<ul>
<li><b>標題就是結果。</b>「排行榜 API 效能改善」是主題；「Cutting leaderboard p95 latency from 900 ms to 140 ms」是結果。審閱者只讀標題，也知道你做到了什麼。</li>
<li><b>TL;DR 三行。</b>第一行問題、第二行做法、第三行結果。讀完這三行就走的人，也帶走了重點。</li>
<li><b>背景與限制。</b>系統大概多大、限制是什麼（「只有一台資料庫、不能停機、預算不能增加」）。限制讓你的選擇有意義：沒有限制的決定，看不出判斷力。</li>
<li><b>架構圖。</b>下一節專門講。</li>
<li><b>考慮過的做法。</b>用一張小表格：做法、好處、壞處、選或不選。兩三列就夠。</li>
<li><b>結果。</b>前後對照，附上怎麼量的（下一節）。</li>
<li><b>取捨與下次會怎麼改。</b>第五節專門講。</li>
<li><b>連結。</b>儲存庫、儀表板截圖、相關的事後檢討。讓想驗證的人驗證得到。</li>
</ul>
<p>瞄準外商的話，整篇用英文寫。英文不用華麗，短句、主動語態、一段一個重點就好。這種風格本身，就是工程團隊最想要的書寫能力。下面是一段可以直接套用的 TL;DR 範例：</p>
<pre><code>TL;DR
- Problem: the leaderboard API had a p95 of 900 ms and 3% timeouts at peak.
- Fix: a composite index for the ranking query, then a connection pooler.
- Result: p95 140 ms, zero timeouts over two weeks; one more component to run.</code></pre>

<h3><span class="badge lv2">進階</span>四、圖怎麼畫、數字怎麼給</h3>
<h4>架構圖：畫路徑，不畫圖示大全</h4>
<p>很多架構圖是一堆雲端服務的圖示，用線連在一起，看完還是不知道系統在做什麼。好的架構圖只回答一個問題：<b>一個請求怎麼走過這個系統，而這篇文章的問題發生在哪一段</b>。四條規則：</p>
<ol>
<li>從使用者畫起，照請求的方向由左到右或由上到下。</li>
<li>箭頭上寫字：協定或做的事（HTTPS、讀排行榜、寫分數）。沒有字的箭頭，讀者只能猜。</li>
<li>標出邊界：公開網路、私有子網路、第三方服務。資安審閱者第一眼就看這個。</li>
<li>把這篇文章的主角上色。整張圖只有一個地方是亮的，讀者就知道要看哪裡。</li>
</ol>
<h4>數字：給百分位數，附上量法</h4>
<p>「平均延遲從 300 ms 降到 100 ms」說服力很低。平均值會把少數很慢的請求藏起來，而使用者抱怨的正是那些慢的。給百分位數（p50、p95、p99），而且前後用同一種量法：</p>
<figure class="figure"><svg viewBox="0 0 640 250" class="fg" style="width:100%;max-width:640px" role="img" aria-label="改善前後的延遲比較：p50 從 120 降到 60 毫秒，p95 從 900 降到 140 毫秒，p99 從 1800 降到 320 毫秒">
<rect x="380" y="12" width="14" height="14" rx="3" class="fg-b warm"/><text x="400" y="24" class="fg-t sm">改之前</text>
<rect x="470" y="12" width="14" height="14" rx="3" class="fg-b hot"/><text x="490" y="24" class="fg-t sm">改之後</text>
<line x1="80" y1="36" x2="80" y2="206" class="fg-l"/>
<text x="68" y="74" text-anchor="end" class="fg-t mono">p50</text><text x="68" y="134" text-anchor="end" class="fg-t mono">p95</text><text x="68" y="194" text-anchor="end" class="fg-t mono">p99</text>
<rect x="80" y="50" width="27" height="18" class="fg-b warm"/><text x="114" y="64" class="fg-t sm">120 ms</text>
<rect x="80" y="72" width="13" height="18" class="fg-b hot"/><text x="100" y="86" class="fg-t sm">60 ms</text>
<rect x="80" y="110" width="200" height="18" class="fg-b warm"/><text x="287" y="124" class="fg-t sm">900 ms</text>
<rect x="80" y="132" width="31" height="18" class="fg-b hot"/><text x="118" y="146" class="fg-t sm acc">140 ms</text>
<rect x="80" y="170" width="400" height="18" class="fg-b warm"/><text x="487" y="184" class="fg-t sm">1800 ms</text>
<rect x="80" y="192" width="71" height="18" class="fg-b hot"/><text x="158" y="206" class="fg-t sm">320 ms</text>
<text x="320" y="238" text-anchor="middle" class="fg-t sm">同一支負載測試腳本、同樣每秒 200 個請求、各跑 15 分鐘（範例數字）</text>
</svg><figcaption>p50 只改善一倍，p95 和 p99 卻改善了好幾倍：問題原本集中在慢的那一截。這種圖一眼就說明了改善在哪裡，也順便證明你懂得怎麼量。</figcaption></figure>
<p>圖下面那一行「怎麼量的」很重要。審閱者會想：是在正式環境量的，還是在測試環境？量了多久？流量一樣嗎？你先講清楚，他就不必懷疑。如果只在測試環境跑過一次，就老實寫「在測試環境跑過一次，正式環境上線後兩週的 p95 維持在 150 ms 以下」。誠實的範圍說明，比漂亮的數字更讓人信。</p>
<div class="note"><b>營業數字要小心。</b>延遲、錯誤率、部署時間這類工程數字通常可以公開；營收、使用者人數、交易量這類營業數字，可能是雇主的機密。改用比例或量級：「尖峰流量是平常的 4 倍」「每天數十萬個請求」。第七節會再講。</div>

<h3><span class="badge lv3">專業</span>五、老實寫出取捨和失敗：可信度從這裡來</h3>
<p>一份每件事都完美成功的報告，審閱者讀起來的感覺不是「好厲害」，而是「這是行銷文案」或「這個人還沒被真正考驗過」。真實的工程永遠有代價。把代價寫出來，反而證明你看得見它。</p>
<h4>取捨要寫到什麼程度</h4>
<table>
<tr><th>做法</th><th>好處</th><th>代價</th><th>決定</th></tr>
<tr><td>排行榜加快取</td><td>最快，資料庫幾乎沒負擔</td><td>分數晚幾秒才更新，玩家會抱怨</td><td>不選（目前）</td></tr>
<tr><td>加複合索引</td><td>直接解決全表掃描，零新元件</td><td>寫入稍慢一點、多佔一些磁碟</td><td>選</td></tr>
<tr><td>加連線池代理</td><td>尖峰時連線數不再爆掉</td><td>多一個要監控、要升級的元件</td><td>選，並寫了處理手冊</td></tr>
</table>
<p>這張表做到三件事：讓讀者看到你考慮過不只一條路；每條路都有好有壞，沒有萬靈丹；你的選擇跟限制條件扣在一起。注意第一列寫的是「不選（目前）」：它告訴讀者，條件改變時你知道下一步是什麼。</p>
<h4>失敗要怎麼寫</h4>
<p>用事後檢討的口吻：寫系統和流程的問題，不寫誰的錯；寫你怎麼發現、怎麼修、事後加了什麼防線。例如：「第一次加索引時，我在尖峰時段直接建立，鎖住資料表將近一分鐘，排行榜整個卡住。後來改用不鎖表的建立方式，並把它寫進上線檢查清單。」這一段話告訴面試官三件事：你碰過真的正式環境、你會從錯誤裡建立制度、你不怕承認。這三件事都是資深的訊號。</p>
<h4>「下次會怎麼改」</h4>
<p>文章最後加一段：如果重來一次，或流量再成長十倍，你會怎麼做。這段話是在預先回答面試官最愛的追問（follow-up question）：「What would you do differently?」。寫在文章裡，面試時你就有一個已經想清楚的答案。</p>

<h3><span class="badge lv3">專業</span>六、讓審閱者信任的 GitHub 個人頁</h3>
<p>審閱者點進你的 GitHub，大概只會看最上面那一屏。那一屏要像一個整理好的展示櫃，而不是一個雜物間。</p>
<figure class="figure"><svg viewBox="0 0 640 330" class="fg" style="width:100%;max-width:640px" role="img" aria-label="一個整理好的 GitHub 個人頁：左邊是大頭照、名字、目標職稱和時區；右邊是個人頁 README；下面是六個置頂的儲存庫">
<rect x="20" y="10" width="600" height="310" rx="10" class="fg-b"/>
<circle cx="80" cy="66" r="32" class="fg-b alt"/>
<text x="80" y="124" text-anchor="middle" class="fg-t">你的名字</text><text x="80" y="142" text-anchor="middle" class="fg-t sm">目標職稱</text><text x="80" y="160" text-anchor="middle" class="fg-t sm">台北・UTC+8</text>
<rect x="150" y="26" width="454" height="138" rx="6" class="fg-b hot"/>
<text x="166" y="50" class="fg-t acc">個人頁 README</text>
<text x="166" y="74" class="fg-t sm">一句話：我是誰、正往哪裡走</text>
<text x="166" y="96" class="fg-t sm">四篇代表作的連結，每篇一行，附結果數字</text>
<text x="166" y="118" class="fg-t sm">目前在學什麼、在做什麼</text>
<text x="166" y="140" class="fg-t sm">聯絡方式、履歷 PDF、LinkedIn</text>
<text x="40" y="190" class="fg-t sm">置頂的儲存庫（最多六個）</text>
<rect x="40" y="198" width="174" height="52" rx="6" class="fg-b alt"/><text x="52" y="220" class="fg-t sm mono">portfolio</text><text x="52" y="238" class="fg-t sm">所有作品的索引</text>
<rect x="233" y="198" width="174" height="52" rx="6" class="fg-b alt"/><text x="245" y="220" class="fg-t sm mono">game-infra</text><text x="245" y="238" class="fg-t sm">Terraform＋CI 一鍵建起</text>
<rect x="426" y="198" width="174" height="52" rx="6" class="fg-b alt"/><text x="438" y="220" class="fg-t sm mono">k8s-lab</text><text x="438" y="238" class="fg-t sm">kind 叢集與處理手冊</text>
<rect x="40" y="258" width="174" height="52" rx="6" class="fg-b"/><text x="52" y="280" class="fg-t sm mono">load-test</text><text x="52" y="298" class="fg-t sm">負載測試腳本與報告</text>
<rect x="233" y="258" width="174" height="52" rx="6" class="fg-b"/><text x="245" y="280" class="fg-t sm mono">postmortems</text><text x="245" y="298" class="fg-t sm">三篇事後檢討</text>
<rect x="426" y="258" width="174" height="52" rx="6" class="fg-b"/><text x="438" y="280" class="fg-t sm mono">threat-model</text><text x="438" y="298" class="fg-t sm">威脅模型與一項修正</text>
</svg><figcaption>一屏之內回答三個問題：你是誰、你做過什麼、去哪裡看細節。個人頁 README 是導覽，置頂的儲存庫是展示品。</figcaption></figure>
<h4>兩個 GitHub 的功能</h4>
<ul>
<li><b>個人頁 README</b>：建立一個跟你帳號同名的公開儲存庫，裡面的 README.md 就會顯示在你的個人頁最上方。把它當成作品集的封面。</li>
<li><b>置頂</b>（pin）：最多可以置頂六個儲存庫。只放你願意被仔細看的那幾個。</li>
</ul>
<h4>一個值得信任的儲存庫長什麼樣子</h4>
<table>
<tr><th>審閱者會看的</th><th>加分</th><th>扣分</th></tr>
<tr><td>說明文件（README）</td><td>它解決什麼問題、架構圖、一段照著做就跑得起來的步驟、重要的設計決定</td><td>只有一行專案名稱，或是框架自動產生的範本</td></tr>
<tr><td>能不能跑起來</td><td>一個指令就能建起來（<code>make up</code>、<code>docker compose up</code>、<code>terraform apply</code>），有範例設定檔</td><td>要讀程式碼才猜得出怎麼跑</td></tr>
<tr><td>品質的訊號</td><td>CI 是綠的、有測試、有程式碼風格檢查、有授權條款（LICENSE）</td><td>CI 一直是紅的，或根本沒有</td></tr>
<tr><td>commit 紀錄</td><td>小而清楚的 commit，訊息講「為什麼」</td><td>一個「initial commit」塞進全部，或滿滿的「fix」「update」</td></tr>
<tr><td>原創性</td><td>你自己的問題、自己的設計</td><td>照著教學影片做的成品、沒有改過的 fork</td></tr>
</table>
<p>不需要的東西也要說：綠色的貢獻格子（contribution graph）填得滿不滿，幾乎沒有審閱者在意；幾十個空的或半途而廢的儲存庫，反而會稀釋你的好作品。把它們設成私有或封存（archive）。</p>

<h3><span class="badge lv3">專業</span>七、遮蔽敏感資訊與保密：公開之前的最後一關</h3>
<p>作品集裡漏出一把金鑰或一段雇主的程式碼，造成的傷害遠大於它帶來的好處：它直接證明你不懂資安、也不懂保密。公開任何東西之前，照這張決策圖走一遍：</p>
<figure class="figure"><svg viewBox="0 0 680 320" class="fg" style="width:100%;max-width:680px" role="img" aria-label="公開前的決策圖：屬於雇主或客戶的不放；提到未修好的弱點要等修好；有機密或真實位址要遮蔽；有營業數字要改成比例；都通過後再請一個人讀過才公開">
<rect x="40" y="14" width="300" height="38" rx="6" class="fg-b"/><text x="190" y="38" text-anchor="middle" class="fg-t">屬於雇主或客戶的程式碼、文件？</text>
<rect x="40" y="78" width="300" height="38" rx="6" class="fg-b"/><text x="190" y="102" text-anchor="middle" class="fg-t">提到還沒修好的弱點？</text>
<rect x="40" y="142" width="300" height="38" rx="6" class="fg-b"/><text x="190" y="166" text-anchor="middle" class="fg-t">有機密、真實位址、內部名稱？</text>
<rect x="40" y="206" width="300" height="38" rx="6" class="fg-b"/><text x="190" y="230" text-anchor="middle" class="fg-t">有營收、使用者數等營業數字？</text>
<rect x="40" y="270" width="300" height="38" rx="6" class="fg-b hot"/><text x="190" y="294" text-anchor="middle" class="fg-t acc">可以公開：再請一個人讀過</text>
<line x1="190" y1="52" x2="190" y2="70" class="fg-l"/><polygon points="190,78 185.5,70 194.5,70" class="fg-a"/><text x="200" y="68" class="fg-t sm">否</text>
<line x1="190" y1="116" x2="190" y2="134" class="fg-l"/><polygon points="190,142 185.5,134 194.5,134" class="fg-a"/><text x="200" y="132" class="fg-t sm">否</text>
<line x1="190" y1="180" x2="190" y2="198" class="fg-l"/><polygon points="190,206 185.5,198 194.5,198" class="fg-a"/><text x="200" y="196" class="fg-t sm">否，或已處理</text>
<line x1="190" y1="244" x2="190" y2="262" class="fg-l"/><polygon points="190,270 185.5,262 194.5,262" class="fg-a"/><text x="200" y="260" class="fg-t sm">否，或已處理</text>
<line x1="340" y1="33" x2="412" y2="33" class="fg-l warm"/><polygon points="420,33 412,28.5 412,37.5" class="fg-a warm"/><text x="376" y="25" text-anchor="middle" class="fg-t sm warm">是</text>
<line x1="340" y1="97" x2="412" y2="97" class="fg-l warm"/><polygon points="420,97 412,92.5 412,101.5" class="fg-a warm"/><text x="376" y="89" text-anchor="middle" class="fg-t sm warm">是</text>
<line x1="340" y1="161" x2="412" y2="161" class="fg-l alt"/><polygon points="420,161 412,156.5 412,165.5" class="fg-a alt"/><text x="376" y="153" text-anchor="middle" class="fg-t sm alt">是</text>
<line x1="340" y1="225" x2="412" y2="225" class="fg-l alt"/><polygon points="420,225 412,220.5 412,229.5" class="fg-a alt"/><text x="376" y="217" text-anchor="middle" class="fg-t sm alt">是</text>
<rect x="420" y="14" width="240" height="38" rx="6" class="fg-b warm"/><text x="540" y="38" text-anchor="middle" class="fg-t">不放，改寫成自己的版本</text>
<rect x="420" y="78" width="240" height="38" rx="6" class="fg-b warm"/><text x="540" y="102" text-anchor="middle" class="fg-t">先不發表，修好再說</text>
<rect x="420" y="142" width="240" height="38" rx="6" class="fg-b alt"/><text x="540" y="166" text-anchor="middle" class="fg-t">遮蔽，再往下一題</text>
<rect x="420" y="206" width="240" height="38" rx="6" class="fg-b alt"/><text x="540" y="230" text-anchor="middle" class="fg-t">改成比例或量級</text>
</svg><figcaption>前兩題答「是」就停下來，不是遮蔽就能解決的事。後兩題答「是」，處理掉之後繼續往下走。最後一定要有第二雙眼睛。</figcaption></figure>
<h4>具體怎麼遮蔽</h4>
<ul>
<li><b>IP 位址</b>：換成保留給文件使用的位址段，例如 <code>192.0.2.0/24</code>、<code>198.51.100.0/24</code>、<code>203.0.113.0/24</code>（IPv6 用 <code>2001:db8::/32</code>）。這些位址永遠不會出現在真的網路上，懂行的人一看就知道你是刻意替換的，這本身就是加分。</li>
<li><b>網域與主機名稱</b>：換成 <code>example.com</code> 這類保留網域，內部主機名換成看得懂角色的名字（<code>db-primary</code>、<code>api-1</code>）。</li>
<li><b>帳號編號、儲存桶名稱、叢集名稱</b>：全部換掉。雲端帳號 ID 加上一個公開的儲存桶名稱，就足以讓人開始探測。</li>
<li><b>截圖</b>：裁掉瀏覽器的網址列、書籤列和其他分頁；放大檢查每個角落有沒有內部網址或同事的名字。手機拍的照片可能帶著拍攝地點的資訊，上傳前清掉。</li>
</ul>
<h4>git 歷史紀錄：最容易漏掉的地方</h4>
<p>你在最新版本裡刪掉了金鑰，但三十個 commit 之前它還在，任何人 clone 下來都翻得到。三個做法：</p>
<ol>
<li><b>不要把工作用的儲存庫直接公開。</b>開一個全新的儲存庫，把整理過的內容放進去，歷史紀錄從乾淨的第一個 commit 開始。</li>
<li><b>公開前掃描一次。</b>用 gitleaks 或 trufflehog 這類機密掃描工具，掃整個歷史紀錄，不只是最新版本。</li>
<li><b>真的漏了：先換金鑰，再清歷史。</b>順序不能反。只要公開過一秒，就要當成已經被拿走。換掉之後，再用 git filter-repo 這類工具把它從歷史裡清掉。</li>
</ol>
<h4>保密義務</h4>
<p>大部分的雇傭合約都有保密條款。安全的做法是：只寫你自己的思考和通用的工程做法，不寫雇主專屬的設計細節；從工程的角度描述系統（「一個即時多人的遊戲伺服器」），不寫產品名稱和客戶；拿不準的時候，先問主管。一封「我想把這次效能調校的經驗寫成一篇不含任何公司資訊的文章，可以嗎？」的信，多數主管會欣然同意，有時還會幫你看稿。</p>

<h3><span class="badge lv4">專家</span>八、放大器：寫部落格和上台分享</h3>
<p>作品集讓「看到它的人」相信你。放大器的作用，是讓更多人看到它，而且讓人<b>主動來找你</b>。這是最強的推薦來源：一個在聚會上聽過你分享的工程師，日後在他的公司開缺時，會想到你。</p>
<figure class="figure"><svg viewBox="0 0 680 290" class="fg" style="width:100%;max-width:680px" role="img" aria-label="飛輪：工作上做的事寫成技術文章，技術文章拿去演講分享，分享讓人記住你、帶來人脈與推薦，人脈又帶來更好的機會和更多可做的事">
<rect x="255" y="20" width="170" height="50" rx="8" class="fg-b"/><text x="340" y="41" text-anchor="middle" class="fg-t">工作上做的事</text><text x="340" y="59" text-anchor="middle" class="fg-t sm">真實的問題與數字</text>
<rect x="490" y="115" width="170" height="50" rx="8" class="fg-b alt"/><text x="575" y="136" text-anchor="middle" class="fg-t">技術文章</text><text x="575" y="154" text-anchor="middle" class="fg-t sm">一頁、可以轉貼</text>
<rect x="255" y="210" width="170" height="50" rx="8" class="fg-b alt"/><text x="340" y="231" text-anchor="middle" class="fg-t">上台分享</text><text x="340" y="249" text-anchor="middle" class="fg-t sm">五分鐘也算</text>
<rect x="20" y="115" width="170" height="50" rx="8" class="fg-b hot"/><text x="105" y="136" text-anchor="middle" class="fg-t acc">人脈與推薦</text><text x="105" y="154" text-anchor="middle" class="fg-t sm">有人記得你</text>
<path d="M425 45 H575 V107" class="fg-l on"/><polygon points="575,115 570.5,107 579.5,107" class="fg-a on"/><text x="510" y="36" text-anchor="middle" class="fg-t sm acc">寫下來</text>
<path d="M575 165 V235 H433" class="fg-l on"/><polygon points="425,235 433,230.5 433,239.5" class="fg-a on"/><text x="510" y="226" text-anchor="middle" class="fg-t sm acc">講出去</text>
<path d="M255 235 H105 V173" class="fg-l on"/><polygon points="105,165 100.5,173 109.5,173" class="fg-a on"/><text x="180" y="226" text-anchor="middle" class="fg-t sm acc">被記住</text>
<path d="M105 115 V45 H247" class="fg-l on"/><polygon points="255,45 247,40.5 247,49.5" class="fg-a on"/><text x="176" y="36" text-anchor="middle" class="fg-t sm acc">帶來機會</text>
<text x="340" y="136" text-anchor="middle" class="fg-t lg">飛輪</text><text x="340" y="156" text-anchor="middle" class="fg-t sm">每轉一圈，下一圈更省力</text>
</svg><figcaption>同一件工作，寫一次、講一次，就被利用了三次：作品集裡一件、聽眾心裡一個印象、日後一個推薦的可能。飛輪一開始轉得很慢，持續推，才會越轉越快。</figcaption></figure>
<h4>寫部落格：從作品集文章改寫</h4>
<p>你不需要另外找題目。作品集裡的每一篇技術文章，換一個角度就是一篇部落格：作品集版本寫給審閱者，重點是「我做到了什麼」；部落格版本寫給同行，重點是「你也會遇到這個問題，這是解法」。後者更容易被轉貼。發表在你自己的網域或 GitHub Pages 上，內容永遠屬於你；想要曝光，再同步貼到工程師聚集的平台。</p>
<h4>上台分享：從五分鐘開始</h4>
<ul>
<li><b>閃電講</b>（lightning talk）：很多技術聚會和研討會都有五分鐘左右的短講時段，門檻最低。一個問題、一張圖、一個結果，剛好五分鐘。</li>
<li><b>社群聚會</b>：台灣有很多固定舉辦的技術社群聚會，常常缺講者。報名分享前，先去當幾次聽眾，了解聽眾是誰。</li>
<li><b>研討會投稿</b>（call for papers）：像 COSCUP（開源）、HITCON（資安）這類大型研討會會公開徵稿。投稿要寫摘要和大綱，重點是「聽眾聽完能帶走什麼」。</li>
</ul>
<p>上台用英文還是中文？在台灣的場合用中文就好；但同一份內容準備一份英文的投影片和講稿，錄一次放在作品集裡，它就同時證明了你的技術和英文表達能力。</p>
<h4>開源貢獻：最被低估的證據</h4>
<p>替你每天在用的工具修一個文件錯誤、補一個測試、回報一個附上完整重現步驟的 issue。這些貢獻很小，卻有兩個獨特的價值：它是公開、可驗證的協作紀錄（你跟陌生人怎麼溝通、怎麼接受程式碼審查）；而且維護者是業界的人，認識他們本身就是人脈。從「good first issue」標籤開始找。</p>

<h3>九、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>作品集要很多件才夠</td><td>四五件好的，勝過二十件普通的。審閱者只會看最上面幾件。</td></tr>
<tr><td>只有大專案才值得寫</td><td>一次把部署從 40 分鐘縮到 6 分鐘、一次事故處理，都是很好的作品。重點是有數字、有推理。</td></tr>
<tr><td>把失敗寫出來會扣分</td><td>寫得好的失敗是最強的資深訊號：你碰過真的正式環境，而且會從錯誤裡建立制度。</td></tr>
<tr><td>GitHub 的綠格子越滿越好</td><td>幾乎沒人在意。他們看的是置頂的那幾個儲存庫品質如何。</td></tr>
<tr><td>在最新版本刪掉金鑰就安全了</td><td>git 歷史紀錄還留著。公開過的金鑰一律當成已經外洩，先換掉，再清歷史。</td></tr>
<tr><td>寫部落格要先有名氣才有人看</td><td>第一個讀者是審閱你履歷的人。一篇清楚的文章，對他的價值跟你有沒有名氣無關。</td></tr>
</table>

<h3>十、跟你的工作連起來</h3>
<ul>
<li><b>前端工程師</b>：把一次打包體積的瘦身、一次首頁載入時間的改善，寫成「問題、做法、結果」：前後的打包大小、LCP 之類的指標、你考慮過的方案。這在平台工程的面試裡，就是「你會量測、會最佳化」的證據。</li>
<li><b>遊戲工程師</b>：一次記憶體問題的追查、一次建置管線的自動化、一次遊戲伺服器的壓力測試，都很適合寫。遊戲有很直觀的指標（幀率、載入時間、同時在線人數），讀者一看就懂。</li>
<li><b>後端工程師</b>：Node.js 或 Go 服務的一次慢查詢修正、一次佇列積壓的處理、一次把服務容器化並搬上雲端，都是現成的題目。把 Docker 和部署設定整理成一個能一鍵跑起來的儲存庫，就是一件基礎設施作品。</li>
<li>不管哪一種，養成一個習慣：<b>改任何東西之前，先截一張「改之前」的圖</b>。這一個動作，決定了你半年後有沒有作品可寫。</li>
</ul>

<h3>十一、面試會怎麼問</h3>
<p>面試官讀過你的作品集，就會從它開始問。這些題目在測試：作品是不是你做的，以及你想得有多深。</p>
<ol>
<li>「Walk me through one project in your portfolio.」（挑一件作品講給我聽。）</li>
<li>「How did you measure that improvement?」（那個改善你是怎麼量的？）</li>
<li>「What was the hardest trade-off?」（最難的取捨是哪一個？）</li>
<li>「What would you do differently if traffic grew ten times?」（流量成長十倍，你會怎麼改？）</li>
<li>「Is there anything in this project you are not proud of?」（這個專案裡，有沒有你不滿意的地方？）</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>照文章的骨架講，兩分鐘內：一句背景和限制，一句問題（有數字），做法裡講一個你考慮過但沒選的方案和原因，最後是結果和代價。講完停下來，讓面試官挑他有興趣的地方深入。不要從專案的歷史講起。</li>
<li>講清楚四件事：量的是什麼指標（例如 p95 延遲）、在哪裡量（正式環境的負載平衡器日誌，或測試環境的負載測試）、比較的條件是否相同（同樣的流量、同樣的時間長度）、觀察了多久。如果有限制，主動說：「這是測試環境的結果，正式環境上線後我又追了兩週，數字一致。」</li>
<li>挑一個真的兩難的取捨，講出兩邊的代價和你當時的判斷依據，例如快取和即時性：「快取最快，但分數會晚幾秒更新，對玩家體驗傷害很大，所以我先選了索引。如果之後讀取量再成長，我會只對前一百名做短時間的快取。」</li>
<li>先找出第一個會撐不住的地方，而不是把每個元件都放大十倍：「資料庫的寫入會先撐不住，因為每一局結束都寫一次分數。我會先把寫入改成經過佇列批次寫入，排行榜改用適合排序的資料結構放在記憶體快取裡，資料庫只留做持久保存。」講出順序，比講出名詞重要。</li>
<li>一定要有答案，而且要真的。例如：「監控是事後才補上的，第一次出事時我們是從使用者那邊知道的。如果重來，我會在上線前就先定好警報。」這題在測試你的自省能力，回答「沒有」是最差的答案。</li>
</ol>
</details>

<h3>十二、練功題（做得出來才算真的懂）</h3>
<ol>
<li>把這句話改寫成「問題、做法、結果」三段，數字可以用你自己真實的：「負責 CI/CD 的維護與改善。」</li>
<li>下面這段設定要公開在作品集裡，哪些地方要改、改成什麼？<code>DB_HOST=10.20.3.15</code>、<code>API_URL=https://admin.mycorp-internal.net</code>、<code>AWS_ACCESS_KEY_ID=AKIA...</code>、<code>BUCKET=mycorp-prod-userdata</code>。</li>
<li>替你最好的一件作品寫一段英文的 TL;DR，三行：問題、做法、結果。每行不超過二十個英文單字。</li>
<li>在你自己的一個儲存庫上，用 gitleaks 掃描整個歷史紀錄。如果什麼都沒掃到，故意在一個測試用的儲存庫裡 commit 一把假的金鑰，確認工具抓得到。</li>
<li>建立你的 GitHub 個人頁 README：一句話的自我介紹、三到四篇作品的連結（各附一個結果數字）、聯絡方式。請一個朋友在三十秒內看完，問他記得什麼。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>範例：問題「部署要手動執行 12 個步驟，平均 40 分鐘，每個月有一兩次因為漏步驟出錯」；做法「把步驟寫成 CI 管線，加上自動測試和部署前的健康檢查；考慮過藍綠部署，但目前流量不需要，先做滾動更新」；結果「部署縮到 6 分鐘、半年內零次部署失誤；代價是要維護管線本身」。重點是每一段都有一個可以被追問的具體內容。</li>
<li><code>DB_HOST</code> 換成文件用的位址，例如 <code>192.0.2.10</code>，或乾脆寫 <code>db-primary</code>；內部網址換成 <code>https://admin.example.com</code>；存取金鑰整行拿掉，改成說明「從環境變數或機密管理服務讀取」；儲存桶名稱換成 <code>example-app-data</code>。而且：如果那把金鑰是真的、而且曾經進過任何 git 歷史，先去停用它。</li>
<li>範例：「Problem: deployments took 40 minutes of manual steps and failed about once a month.」「Fix: a CI pipeline with tests and pre-deploy health checks.」「Result: 6-minute deploys and zero failed releases in six months.」每行一個重點、主動語態、有數字。</li>
<li>gitleaks 應該抓得到 AWS 存取金鑰這類格式明確的機密。這個練習的重點是親眼看到：刪掉檔案之後，掃描歷史紀錄時它依然會被找出來。做完記得刪除那個測試儲存庫。</li>
<li>如果朋友記得的是你的目標職稱和至少一個數字，就成功了。如果他只記得「好像很多專案」，代表連結太多、沒有重點，刪到剩三四個最好的。</li>
</ol>
</details>

<h3>十三、想再挖深</h3>
<ul>
<li><b>Google 的技術寫作課程</b>（<a href="https://developers.google.com/tech-writing">developers.google.com/tech-writing</a>）：免費、短、專為工程師設計，教你寫清楚的句子和段落。</li>
<li><b>Diátaxis</b>（<a href="https://diataxis.fr/">diataxis.fr</a>）：把技術文件分成教學、操作指南、參考、說明四種的框架。寫儲存庫的說明文件時特別有用。</li>
<li><b>gitleaks</b>（<a href="https://github.com/gitleaks/gitleaks">github.com/gitleaks/gitleaks</a>）：開源的機密掃描工具，可以掃整個 git 歷史，也可以接進 CI。</li>
<li><b>Bhatti 等人《Docs for Developers: An Engineer's Field Guide to Technical Writing》</b>：從規劃、撰寫到維護技術文件的完整指南。</li>
<li><b>GitHub 官方文件：管理你的個人頁</b>（<a href="https://docs.github.com/">docs.github.com</a>，搜尋「profile README」）：個人頁 README 和置頂儲存庫的設定方法。</li>
</ul>
` });
