DEEP({ 'cap-stages': `
<p>上一課的滑桿帶你走過六個階段。這一章把每一步拆開來看：是哪一個量得到的數字告訴你「該動了」、每一步多出來的維運成本具體是什麼、兩個階段之間最危險的那段路（遷移）要怎麼在系統不停機的情況下走完，最後是很少有人講的另一半：團隊和組織怎麼跟著架構一起長大。架構圖人人會畫，能把一套正在跑、有人在玩、有點數在流動的系統，從第 3 階段安全地帶到第 5 階段，才是資深工程師的價值。</p>

<h3><span class="badge lv1">基礎</span>一、為什麼一定是一階一階長</h3>
<p>想像一家早餐店怎麼長大。一開始是路邊攤，老闆一個人煎蛋餅、收錢、記帳。生意好了，倉庫和爐台搶空間，就租個店面，把食材放進後面的冷藏庫（資料庫搬出去）。排隊排到馬路上，就多開兩個煎台，請兩個師傅；重點是每個師傅都看出單機上的單子做菜，不靠自己腦袋記誰點了什麼，所以任何一個師傅請假，別人都能接手（無狀態的應用程式伺服器）。再忙一點，就提早備料、開外帶窗口（快取、CDN）。費工的菜不在櫃台現做，改成叫號，做好再通知（佇列）。最後才是中央廚房加分店（分片、多區域）。</p>
<p>每一步都解決一個具體的痛，也都帶來一個具體的新麻煩：多一個師傅，就多一份薪水、多一個人要訓練、多一種「兩個人搶同一個煎台」的狀況。沒有人在開路邊攤的第一天就蓋中央廚房，因為那時候你根本不知道客人愛吃什麼。</p>
<figure class="figure"><svg viewBox="0 0 660 300" class="fg" style="width:100%;max-width:660px" role="img" aria-label="六個階段的階梯：一台機器、資料庫獨立、無狀態加負載平衡器、快取與副本、佇列與服務、分片與多區域，每一階上方標著逼你上去的痛點，越往右維運負擔越重">
<line x1="40" y1="250" x2="40" y2="34" class="fg-l"/><polygon points="40,26 35.5,34 44.5,34" class="fg-a"/>
<text x="50" y="30" class="fg-t sm">維運負擔</text>
<line x1="40" y1="250" x2="650" y2="250" class="fg-l"/>
<rect x="60" y="200" width="94" height="50" rx="5" class="fg-b"/><text x="107" y="216" text-anchor="middle" class="fg-t sm">第 1 階</text><text x="107" y="236" text-anchor="middle" class="fg-t">一台機器</text>
<rect x="158" y="168" width="94" height="82" rx="5" class="fg-b"/><text x="205" y="184" text-anchor="middle" class="fg-t sm">第 2 階</text><text x="205" y="204" text-anchor="middle" class="fg-t">資料庫獨立</text>
<rect x="256" y="136" width="94" height="114" rx="5" class="fg-b alt"/><text x="303" y="152" text-anchor="middle" class="fg-t sm">第 3 階</text><text x="303" y="172" text-anchor="middle" class="fg-t">無狀態＋LB</text>
<rect x="354" y="104" width="94" height="146" rx="5" class="fg-b alt"/><text x="401" y="120" text-anchor="middle" class="fg-t sm">第 4 階</text><text x="401" y="140" text-anchor="middle" class="fg-t">快取與副本</text>
<rect x="452" y="72" width="94" height="178" rx="5" class="fg-b warm"/><text x="499" y="88" text-anchor="middle" class="fg-t sm">第 5 階</text><text x="499" y="108" text-anchor="middle" class="fg-t">佇列與服務</text>
<rect x="550" y="40" width="94" height="210" rx="5" class="fg-b warm"/><text x="597" y="56" text-anchor="middle" class="fg-t sm">第 6 階</text><text x="597" y="76" text-anchor="middle" class="fg-t">分片與多區</text>
<text x="107" y="192" text-anchor="middle" class="fg-t sm warm">上線</text>
<text x="205" y="160" text-anchor="middle" class="fg-t sm warm">記憶體互搶</text>
<text x="303" y="128" text-anchor="middle" class="fg-t sm warm">一台掛全掛</text>
<text x="401" y="96" text-anchor="middle" class="fg-t sm warm">讀取壓垮主庫</text>
<text x="499" y="64" text-anchor="middle" class="fg-t sm warm">請求裡做慢事</text>
<text x="597" y="32" text-anchor="middle" class="fg-t sm warm">寫入到頂</text>
<text x="107" y="268" text-anchor="middle" class="fg-t sm">~1 萬人</text><text x="205" y="268" text-anchor="middle" class="fg-t sm">幾萬</text><text x="303" y="268" text-anchor="middle" class="fg-t sm">幾十萬</text><text x="401" y="268" text-anchor="middle" class="fg-t sm">~100 萬</text><text x="499" y="268" text-anchor="middle" class="fg-t sm">幾百萬</text><text x="597" y="268" text-anchor="middle" class="fg-t sm">千萬以上</text>
<text x="345" y="292" text-anchor="middle" class="fg-t sm">使用者規模（非常粗略，依產品而定）</text>
</svg><figcaption>每一階上方的橘字，是把你逼上這一階的痛。階梯越高，零件越多，會壞的地方、要值班的人、每月的帳單都跟著變多。</figcaption></figure>

<h3><span class="badge lv1">基礎</span>二、該動的訊號，要寫成量得到的數字</h3>
<p>上一課說「真正的功夫是認出訊號」。訊號不能是感覺（「好像有點慢」），要是儀表板上的一條線，加上一個事先講好的警戒值。下面的警戒值是常見的經驗值，不是定律，你的系統要用自己的數據校正：</p>
<table>
<tr><th>從 → 到</th><th>看哪個指標</th><th>經驗上的警戒線</th><th>先試便宜的招</th></tr>
<tr><td>1 → 2</td><td>記憶體、swap、資料庫和應用程式互搶 CPU</td><td>尖峰時記憶體持續超過八成，或開始用到 swap</td><td>升級機型、調小快取</td></tr>
<tr><td>2 → 3</td><td>每月停機分鐘數、每次部署的停機時間</td><td>停機已經吃掉大半個錯誤預算（第 4.2 課）</td><td>部署自動化，縮短停機</td></tr>
<tr><td>3 → 4</td><td>資料庫 CPU、讀寫比、讀取的 p95 延遲</td><td>尖峰 CPU 超過六七成，而且大部分是讀</td><td>先抓慢查詢、補索引（第 3.1 課）</td></tr>
<tr><td>4 → 5</td><td>請求的 p99、請求裡呼叫外部服務的次數、發布要協調幾個團隊</td><td>p99 被寄信、產報表這類慢工作拖過 1 秒</td><td>先把慢工作改成背景執行</td></tr>
<tr><td>5 → 6</td><td>主庫寫入的 CPU、WAL 產生量、IOPS、單表大小</td><td>照第 8.1 課的跑道公式，撞牆日減掉工程時間已經很近</td><td>分割表、歷史資料搬走、按功能拆庫</td></tr>
</table>
<p>注意最右邊那一欄。<b>每次要往上爬之前，先問有沒有更便宜的招。</b>一個缺少的索引，可以讓資料庫 CPU 從 90% 掉到 20%，等於幫你省下「加讀取副本」這整個階段，以及它帶來的複寫延遲問題。往上爬是最後的手段，不是第一個反應。</p>

<h3><span class="badge lv2">進階</span>三、每一階多出來的維運成本</h3>
<p>畫架構圖時，多一個方塊只要三秒。真正的成本在後面：每一個<b>有狀態</b>的元件（資料庫、Redis、佇列、搜尋引擎），至少要配齊這五樣東西才算上線：</p>
<ol>
<li><b>監控與警報</b>：它的四個黃金訊號，以及它特有的指標（複寫延遲、佇列訊息年齡、記憶體淘汰數）。</li>
<li><b>備份與還原演練</b>：沒還原過的備份不算備份（第 4.5 課）。</li>
<li><b>升級流程</b>：小版本修補、大版本升級，要怎麼做才不停機。</li>
<li><b>處理手冊</b>（runbook）：半夜三點它出事，值班的人照著做就能止血。</li>
<li><b>會的人</b>：至少兩個人真的懂它。只有一個人懂，那個人就是單點故障。</li>
</ol>
<table>
<tr><th>階段</th><th>新的壞法</th><th>新的技能</th></tr>
<tr><td>3：負載平衡＋無狀態</td><td>健康檢查設錯把好機器踢掉、工作階段遺失、部署時連線被切斷</td><td>CI/CD、滾動部署、連線排空（第 1.7、2.6 課）</td></tr>
<tr><td>4：快取、副本、CDN</td><td>「我剛改了怎麼沒變」：副本延遲、快取沒作廢、CDN 還在發舊檔</td><td>快取作廢策略、讀到自己寫的（第 3.4、3.5 課）</td></tr>
<tr><td>5：佇列與服務</td><td>訊息積壓、毒訊息、重複處理、一個請求跨五個服務不知道卡在哪</td><td>冪等設計、分散式追蹤、SLO 與值班（第 3.7、4.1 課）</td></tr>
<tr><td>6：分片與多區域</td><td>熱分片、跨分片查詢、區域切換時的資料遺失與腦裂</td><td>重新平衡、災難演練、容量規劃（第 3.6、4.5 課）</td></tr>
</table>
<p>還有一筆常被忽略的帳：<b>值班</b>。第 3 階段開始，系統就應該 24 小時有人顧。第 4.3 課算過，一個可以長期撐下去的值班輪替需要好幾個人，Google 的 SRE 書建議單一地點的團隊至少 8 人。三個工程師的小團隊硬要撐第 6 階段的架構，結果通常是有人過勞離職，把唯一懂那套系統的知識一起帶走。</p>

<h3><span class="badge lv2">進階</span>四、遷移的標準套路：擴展、遷移、收縮</h3>
<p>從一個階段到下一個，最危險的不是新架構本身，而是<b>搬過去的那段路</b>：舊系統還在服務、資料還在一直寫進來，你要一邊開車一邊換輪胎。業界有一套幾乎通用的做法，叫<b>擴展—遷移—收縮</b>（expand, migrate, contract），也叫平行變更（parallel change）。Stripe 公開過他們搬上億筆資料的做法，核心也是這幾步。</p>
<p>用一個實例走一次：猜高低平台到了第 5 階段末，主庫的寫入快到頂了，決定把「回合紀錄」這張最大的表，搬到一個獨立的資料庫。熱資料是 90 天份，大約 27 億列。</p>
<figure class="figure"><svg viewBox="0 0 680 270" class="fg" style="width:100%;max-width:680px" role="img" aria-label="遷移時間軸：準備、雙寫、回填、驗證、切讀、切寫、收縮七個階段中，舊庫和新庫各自的角色、讀取從哪裡來、以及怎麼回退；到收縮之前都可以回退">
<text x="150" y="24" text-anchor="middle" class="fg-t sm">準備</text><text x="230" y="24" text-anchor="middle" class="fg-t sm">雙寫</text><text x="310" y="24" text-anchor="middle" class="fg-t sm">回填</text><text x="390" y="24" text-anchor="middle" class="fg-t sm">驗證</text><text x="470" y="24" text-anchor="middle" class="fg-t sm">切讀</text><text x="550" y="24" text-anchor="middle" class="fg-t sm">切寫</text><text x="630" y="24" text-anchor="middle" class="fg-t sm">收縮</text>
<text x="10" y="59" class="fg-t">舊庫</text>
<rect x="112" y="38" width="76" height="32" rx="4" class="fg-b hot"/><text x="150" y="59" text-anchor="middle" class="fg-t sm">主（讀寫）</text>
<rect x="192" y="38" width="76" height="32" rx="4" class="fg-b hot"/><text x="230" y="59" text-anchor="middle" class="fg-t sm">主</text>
<rect x="272" y="38" width="76" height="32" rx="4" class="fg-b hot"/><text x="310" y="59" text-anchor="middle" class="fg-t sm">主</text>
<rect x="352" y="38" width="76" height="32" rx="4" class="fg-b hot"/><text x="390" y="59" text-anchor="middle" class="fg-t sm">主</text>
<rect x="432" y="38" width="76" height="32" rx="4" class="fg-b hot"/><text x="470" y="59" text-anchor="middle" class="fg-t sm">主，只剩寫</text>
<rect x="512" y="38" width="76" height="32" rx="4" class="fg-b"/><text x="550" y="59" text-anchor="middle" class="fg-t sm">反向跟寫</text>
<rect x="592" y="38" width="76" height="32" rx="4" class="fg-b"/><text x="630" y="59" text-anchor="middle" class="fg-t sm">停用</text>
<text x="10" y="99" class="fg-t">新庫</text>
<rect x="112" y="78" width="76" height="32" rx="4" class="fg-b"/><text x="150" y="99" text-anchor="middle" class="fg-t sm">建表、監控</text>
<rect x="192" y="78" width="76" height="32" rx="4" class="fg-b alt"/><text x="230" y="99" text-anchor="middle" class="fg-t sm">跟寫新資料</text>
<rect x="272" y="78" width="76" height="32" rx="4" class="fg-b alt"/><text x="310" y="99" text-anchor="middle" class="fg-t sm">補舊資料</text>
<rect x="352" y="78" width="76" height="32" rx="4" class="fg-b alt"/><text x="390" y="99" text-anchor="middle" class="fg-t sm">比對</text>
<rect x="432" y="78" width="76" height="32" rx="4" class="fg-b alt"/><text x="470" y="99" text-anchor="middle" class="fg-t sm">開始被讀</text>
<rect x="512" y="78" width="76" height="32" rx="4" class="fg-b hot"/><text x="550" y="99" text-anchor="middle" class="fg-t sm">主（讀寫）</text>
<rect x="592" y="78" width="76" height="32" rx="4" class="fg-b hot"/><text x="630" y="99" text-anchor="middle" class="fg-t sm">主</text>
<text x="10" y="139" class="fg-t">讀取從哪裡</text>
<text x="150" y="139" text-anchor="middle" class="fg-t sm">舊</text><text x="230" y="139" text-anchor="middle" class="fg-t sm">舊</text><text x="310" y="139" text-anchor="middle" class="fg-t sm">舊</text><text x="390" y="139" text-anchor="middle" class="fg-t sm">舊＋影子讀</text><text x="470" y="139" text-anchor="middle" class="fg-t sm acc">新 1%→100%</text><text x="550" y="139" text-anchor="middle" class="fg-t sm">新</text><text x="630" y="139" text-anchor="middle" class="fg-t sm">新</text>
<text x="10" y="179" class="fg-t">怎麼回退</text>
<text x="150" y="179" text-anchor="middle" class="fg-t sm">—</text><text x="230" y="179" text-anchor="middle" class="fg-t sm">關掉雙寫</text><text x="310" y="179" text-anchor="middle" class="fg-t sm">同左</text><text x="390" y="179" text-anchor="middle" class="fg-t sm">同左</text><text x="470" y="179" text-anchor="middle" class="fg-t sm">旗標切回</text><text x="550" y="179" text-anchor="middle" class="fg-t sm">切回舊庫</text><text x="630" y="179" text-anchor="middle" class="fg-t sm warm">回不去</text>
<text x="10" y="219" class="fg-t">大約多久</text>
<text x="150" y="219" text-anchor="middle" class="fg-t sm">1 週</text><text x="230" y="219" text-anchor="middle" class="fg-t sm">1 週</text><text x="310" y="219" text-anchor="middle" class="fg-t sm">2 天</text><text x="390" y="219" text-anchor="middle" class="fg-t sm">1–2 週</text><text x="470" y="219" text-anchor="middle" class="fg-t sm">1–2 週</text><text x="550" y="219" text-anchor="middle" class="fg-t sm">1 天＋觀察</text><text x="630" y="219" text-anchor="middle" class="fg-t sm">2 週後</text>
<line x1="590" y1="32" x2="590" y2="232" class="fg-l warm dash"/>
<line x1="112" y1="246" x2="660" y2="246" class="fg-l dim"/><polygon points="668,246 660,241.5 660,250.5" class="fg-a"/>
<text x="580" y="264" text-anchor="end" class="fg-t sm warm">橘線之前，每一步都能退回上一步</text>
</svg><figcaption>綠色是「真相來源」（source of truth）：出了爭議以它為準。真相來源只換一次，就在「切寫」那一格；在那之前，舊庫永遠是對的那一個，新庫壞掉也只是重來。</figcaption></figure>
<ol>
<li><b>準備。</b>開新資料庫、建表、接上監控和備份。新庫這時候還沒有人用，先確認它本身是健康的。</li>
<li><b>雙寫</b>（dual write）。應用程式每寫一筆回合紀錄，除了寫舊庫，也寫一份到新庫。舊庫仍是真相來源：寫新庫失敗不能讓請求失敗，只記下來、丟進重試佇列，之後由對帳程式補。</li>
<li><b>回填</b>（backfill）。把雙寫開始之前的歷史資料搬過去。用主鍵範圍一批一批搬（<code>WHERE id &gt; 上一批最後一個 ORDER BY id LIMIT 5000</code>），不要用 <code>OFFSET</code>，因為 OFFSET 越後面越慢。每秒搬 2 萬列，27 億列大約 37 小時。回填一定要<b>節流</b>：盯著舊庫的副本延遲，超過 1 秒就暫停，不然你的遷移會拖垮正在服務玩家的主庫。</li>
<li><b>驗證。</b>兩種方法一起用。一是每 100 萬列算一次筆數和雜湊總和，兩邊比對；二是<b>影子讀</b>（shadow read）：正式請求照樣讀舊庫、回傳舊庫的結果，同時在背景讀新庫，比對兩邊一不一樣，不一樣就記一筆指標。GitHub 開源的 Scientist 函式庫做的就是這件事。等不一致率連續幾天是 0，才進下一步。</li>
<li><b>切讀。</b>用功能旗標（feature flag）把讀取一點一點切過去：1%、10%、50%、100%。每一步看錯誤率和延遲，有問題就把旗標切回去，幾秒內恢復。</li>
<li><b>切寫。</b>真相來源換成新庫。最簡單可靠的做法是讓這個功能停寫幾秒：暫停寫入、等兩邊完全一致、切換、恢復。之後改成「反向跟寫」，把新資料也寫一份回舊庫，保留回退的路。</li>
<li><b>收縮。</b>觀察一兩週都沒問題，才停掉反向跟寫、拿掉雙寫的程式碼，最後封存並刪掉舊表。過了這一步就回不去了，所以它一定是最後一步，而且不急。</li>
</ol>

<h3><span class="badge lv3">專業</span>五、雙寫加回填的陷阱：舊資料蓋掉新資料</h3>
<p>雙寫和回填同時在跑，有一個很容易漏掉的競態：</p>
<figure class="figure"><svg viewBox="0 0 640 286" class="fg" style="width:100%;max-width:640px" role="img" aria-label="時序圖：回填程式先從舊庫讀到第四十二列的舊版本，接著應用程式把第四十二列更新成新版本並雙寫到新庫，最後回填程式把舊版本寫進新庫，蓋掉了新版本">
<rect x="40" y="12" width="100" height="30" rx="5" class="fg-b"/><text x="90" y="32" text-anchor="middle" class="fg-t">回填程式</text>
<rect x="200" y="12" width="100" height="30" rx="5" class="fg-b"/><text x="250" y="32" text-anchor="middle" class="fg-t">應用程式</text>
<rect x="360" y="12" width="100" height="30" rx="5" class="fg-b hot"/><text x="410" y="32" text-anchor="middle" class="fg-t">舊庫</text>
<rect x="520" y="12" width="100" height="30" rx="5" class="fg-b alt"/><text x="570" y="32" text-anchor="middle" class="fg-t">新庫</text>
<line x1="90" y1="42" x2="90" y2="222" class="fg-l dim dash"/><line x1="250" y1="42" x2="250" y2="222" class="fg-l dim dash"/><line x1="410" y1="42" x2="410" y2="222" class="fg-l dim dash"/><line x1="570" y1="42" x2="570" y2="222" class="fg-l dim dash"/>
<line x1="90" y1="76" x2="402" y2="76" class="fg-l"/><polygon points="410,76 402,71.5 402,80.5" class="fg-a"/>
<text x="170" y="69" text-anchor="middle" class="fg-t sm">① 讀第 42 列：v1</text>
<line x1="250" y1="114" x2="402" y2="114" class="fg-l on"/><polygon points="410,114 402,109.5 402,118.5" class="fg-a on"/>
<text x="330" y="107" text-anchor="middle" class="fg-t sm acc">② 更新成 v2</text>
<line x1="250" y1="148" x2="562" y2="148" class="fg-l alt"/><polygon points="570,148 562,143.5 562,152.5" class="fg-a alt"/>
<text x="490" y="141" text-anchor="middle" class="fg-t sm alt">③ 雙寫 v2</text>
<line x1="90" y1="196" x2="562" y2="196" class="fg-l warm"/><polygon points="570,196 562,191.5 562,200.5" class="fg-a warm"/>
<text x="170" y="189" text-anchor="middle" class="fg-t sm warm">④ 寫入 v1</text>
<text x="490" y="189" text-anchor="middle" class="fg-t sm warm">蓋掉了 v2！</text>
<rect x="360" y="230" width="100" height="28" rx="5" class="fg-b hot"/><text x="410" y="249" text-anchor="middle" class="fg-t sm">最後：v2</text>
<rect x="520" y="230" width="100" height="28" rx="5" class="fg-b warm"/><text x="570" y="249" text-anchor="middle" class="fg-t sm">最後：v1（錯）</text>
<text x="20" y="278" class="fg-t sm">回填讀到的是快照，寫進去的時候它已經過時了。</text>
</svg><figcaption>回填在 ① 讀到 v1，在 ④ 才寫入。中間應用程式已經把新的 v2 雙寫進新庫，結果被舊的 v1 蓋掉。兩邊從此不一致，而且沒有任何錯誤訊息。</figcaption></figure>
<p>修法是讓每一列帶一個版本號（或更新時間），回填寫入時只在「新庫裡的版本比較舊」時才覆蓋。PostgreSQL 可以一句寫完：</p>
<pre><code>INSERT INTO rounds_new (id, player_id, result, version)
VALUES ($1, $2, $3, $4)
ON CONFLICT (id) DO UPDATE
  SET player_id = EXCLUDED.player_id,
      result    = EXCLUDED.result,
      version   = EXCLUDED.version
  WHERE rounds_new.version &lt; EXCLUDED.version;</code></pre>
<p>雙寫本身還有一個更根本的問題：寫舊庫成功、寫新庫失敗（或反過來），兩個資料庫之間沒有共同的交易。只要應用程式在兩次寫入之間當掉，就會留下不一致。所以實務上越來越多團隊用<b>變更資料擷取</b>（change data capture，CDC）取代應用程式雙寫：讀舊庫的 WAL（PostgreSQL 的邏輯複寫、或 Debezium 這類工具），照提交的順序把每個變更套用到新庫（第 3.4、3.7 課）。順序有保證、不用改應用程式、也不會漏。缺點是多了一套要維運的管線。</p>
<div class="warn"><b>回填和驗證要按「量」估時間。</b>27 億列以每秒 2 萬列搬是 37 小時，但如果節流讓平均速度掉到每秒 5,000 列，就是 6 天。驗證用的雜湊比對也要掃一遍兩邊的資料。先用一小段範圍試跑、量出真實速度，再排時程。</div>

<h3><span class="badge lv3">專業</span>六、每一次轉換，各有各的坑</h3>
<ul>
<li><b>1 → 2，把資料庫搬出去。</b>最省事的是匯出再匯入，但 200 GB 以每秒 100 MB 的速度光複製就要半小時以上，加上重建索引，停機好幾個小時。比較好的做法是先用複寫把新庫同步到幾乎一致，再停寫幾十秒、等複寫追上、改連線字串、恢復。雲端的資料庫遷移服務做的就是這件事。</li>
<li><b>2 → 3，工作階段搬出記憶體。</b>上線過渡期，應用程式先讀 Redis，讀不到再讀自己記憶體裡的舊工作階段；寫入兩邊都寫。等過了一個工作階段的有效期，再拿掉舊的那條路。否則一上線，所有已登入的玩家都會被踢出去。</li>
<li><b>3 → 4，加讀取副本。</b>最先爆出來的 bug 是「剛儲值完餘額沒變」，因為讀到落後的副本。跟錢有關、跟「自己剛寫的」有關的讀取，一律讀主庫（第 3.4 課）。</li>
<li><b>4 → 5，拆出服務。</b>用<b>絞殺者模式</b>（strangler fig）：在反向代理上按路徑，把一部分流量導到新服務，其他的照舊進單體應用程式，一條路徑一條路徑搬。永遠不要「停下來重寫半年再一次切換」，那種專案十個有八個會延期。</li>
<li><b>5 → 6，分片。</b>重新平衡、跨分片查詢、選分片鍵，第 3.6 課的深入圖解都講過。這裡補一句：分片鍵要在第 1 階段就埋好伏筆，每一張會長大的表都帶 <code>player_id</code>，熱路徑上不做跨玩家的 JOIN。到時候要切，才切得開。</li>
</ul>

<h3><span class="badge lv3">專業</span>七、多區域：多半你不需要，需要時要想清楚</h3>
<p>要開第二個區域（region），理由只有三種：遠方的使用者太慢（台北到美西來回 150 ms）、法規要求資料存在當地、或你必須撐過整個區域掛掉。多可用區（multi-AZ）已經能撐過單一機房的故障，整個區域掛掉很少見；而多區域的成本，往往是基礎架構加倍、維運複雜度加倍以上。先確定你是哪一種理由，再選做法：</p>
<table>
<tr><th>做法</th><th>怎麼運作</th><th>適合</th><th>代價</th></tr>
<tr><td>主動—被動（active-passive）</td><td>一個區域服務，另一個區域有非同步副本和預熱好的環境</td><td>撐過區域故障</td><td>複寫延遲就是你的資料遺失量（RPO）；切換要演練</td></tr>
<tr><td>依玩家分家（home region）</td><td>每個玩家的資料只住在一個「家」區域，請求導到他的家</td><td>降低延遲、資料在地化</td><td>跨區域的互動（不同家的人一起玩）要另外設計</td></tr>
<tr><td>主動—主動、多寫入者</td><td>每個區域都能寫同一份資料，衝突事後合併</td><td>在線狀態、聊天這種可以合併的資料</td><td>衝突處理很難；<b>帳本絕對不能這樣做</b></td></tr>
</table>
<figure class="figure"><svg viewBox="0 0 660 288" class="fg" style="width:100%;max-width:660px" role="img" aria-label="依玩家分家的多區域架構：全球入口依玩家把請求送到他的家區域，每個區域有自己玩家帳本的主庫，以及另一個區域帳本的非同步副本">
<rect x="210" y="10" width="240" height="38" rx="6" class="fg-b"/>
<text x="330" y="34" text-anchor="middle" class="fg-t">全球入口：依玩家導向</text>
<rect x="20" y="86" width="290" height="166" rx="10" class="fg-b"/>
<text x="34" y="106" class="fg-t lg">區域一（東京）</text>
<rect x="350" y="86" width="290" height="166" rx="10" class="fg-b"/>
<text x="364" y="106" class="fg-t lg">區域二（美西）</text>
<line x1="270" y1="48" x2="200" y2="78" class="fg-l on"/><polygon points="193,82 199.2,74.3 203.5,82.2" class="fg-a on"/>
<text x="196" y="66" text-anchor="end" class="fg-t sm acc">家在一區的玩家</text>
<line x1="390" y1="48" x2="460" y2="78" class="fg-l alt"/><polygon points="467,82 456.5,82.2 460.8,74.3" class="fg-a alt"/>
<text x="464" y="66" class="fg-t sm alt">家在二區的玩家</text>
<rect x="40" y="118" width="250" height="34" rx="5" class="fg-b"/><text x="165" y="140" text-anchor="middle" class="fg-t">閘道＋應用程式</text>
<rect x="40" y="162" width="250" height="34" rx="5" class="fg-b hot"/><text x="165" y="184" text-anchor="middle" class="fg-t">一區玩家的帳本（主）</text>
<rect x="40" y="206" width="250" height="34" rx="5" class="fg-b"/><text x="165" y="228" text-anchor="middle" class="fg-t sm">二區帳本的副本（災難用）</text>
<rect x="370" y="118" width="250" height="34" rx="5" class="fg-b"/><text x="495" y="140" text-anchor="middle" class="fg-t">閘道＋應用程式</text>
<rect x="370" y="162" width="250" height="34" rx="5" class="fg-b alt"/><text x="495" y="184" text-anchor="middle" class="fg-t">二區玩家的帳本（主）</text>
<rect x="370" y="206" width="250" height="34" rx="5" class="fg-b"/><text x="495" y="228" text-anchor="middle" class="fg-t sm">一區帳本的副本（災難用）</text>
<line x1="290" y1="179" x2="362" y2="219" class="fg-l on dash"/><polygon points="369,223 359.8,222.8 364.2,214.9" class="fg-a on"/>
<line x1="370" y1="179" x2="298" y2="219" class="fg-l alt dash"/><polygon points="291,223 295.8,214.9 300.2,222.8" class="fg-a alt"/>
<text x="330" y="276" text-anchor="middle" class="fg-t sm">兩邊互相非同步複寫：延遲多少秒，區域掛掉時就可能少多少秒的資料</text>
</svg><figcaption>每個玩家的帳本只有一個主庫，永遠只在他的家區域寫入，所以不會有兩邊同時改同一筆餘額的問題。另一個區域只放副本，等整個區域掛掉時才升格。</figcaption></figure>
<p>自動跨區域切換要特別小心。2018 年 10 月，GitHub 的美東網路中斷了 43 秒，資料庫的自動切換工具把主庫切到美西。網路恢復後，兩邊各有一些對方沒有的寫入，加上跨洲的延遲讓應用程式變得很慢，團隊花了 24 小時多才把資料整合好、恢復正常服務。43 秒的網路問題，換來一整天的降級。所以很多團隊的做法是：區域內自動切換，跨區域切換要人按按鈕。</p>

<h3><span class="badge lv4">專家</span>八、康威定律：組織會長成架構的樣子</h3>
<p>1968 年，Melvin Conway 寫下一個觀察：<b>設計系統的組織，做出來的系統結構，會複製這個組織的溝通結構。</b>這叫<b>康威定律</b>（Conway's law）。有個流傳很廣的玩笑版：四個小組一起寫編譯器，就會得到一個分四階段的編譯器。</p>
<p>道理很實際：兩個元件之間的介面，需要兩群人溝通才定得下來。同一個團隊裡，改介面只要轉頭講一聲，所以團隊內的程式碼會黏在一起；跨團隊要開會、寫文件、排時程，所以團隊之間自然長出清楚的 API。你畫的架構圖如果跟組織圖對不上，最後贏的通常是組織圖。</p>
<figure class="figure"><svg viewBox="0 0 640 250" class="fg" style="width:100%;max-width:640px" role="img" aria-label="康威定律：左邊三個產品團隊加一個平台團隊，右邊三個服務加一個部署監控平台，團隊之間的溝通線對應到服務之間的 API">
<text x="140" y="22" text-anchor="middle" class="fg-t lg">組織的溝通結構</text>
<text x="500" y="22" text-anchor="middle" class="fg-t lg">系統的結構</text>
<rect x="40" y="40" width="200" height="36" rx="6" class="fg-b"/><text x="140" y="63" text-anchor="middle" class="fg-t">大廳組（4 人）</text>
<rect x="40" y="100" width="200" height="36" rx="6" class="fg-b"/><text x="140" y="123" text-anchor="middle" class="fg-t">對局組（5 人）</text>
<rect x="40" y="160" width="200" height="36" rx="6" class="fg-b hot"/><text x="140" y="183" text-anchor="middle" class="fg-t">帳本組（4 人）</text>
<line x1="140" y1="76" x2="140" y2="100" class="fg-l dash"/><line x1="140" y1="136" x2="140" y2="160" class="fg-l dash"/>
<text x="148" y="92" class="fg-t sm">開會、文件</text><text x="148" y="152" class="fg-t sm">開會、文件</text>
<rect x="400" y="40" width="200" height="36" rx="6" class="fg-b"/><text x="500" y="63" text-anchor="middle" class="fg-t">大廳服務</text>
<rect x="400" y="100" width="200" height="36" rx="6" class="fg-b"/><text x="500" y="123" text-anchor="middle" class="fg-t">對局服務</text>
<rect x="400" y="160" width="200" height="36" rx="6" class="fg-b hot"/><text x="500" y="183" text-anchor="middle" class="fg-t">帳本服務</text>
<line x1="500" y1="76" x2="500" y2="92" class="fg-l alt"/><polygon points="500,100 495.5,92 504.5,92" class="fg-a alt"/>
<line x1="500" y1="136" x2="500" y2="152" class="fg-l alt"/><polygon points="500,160 495.5,152 504.5,152" class="fg-a alt"/>
<text x="508" y="92" class="fg-t sm alt">API</text><text x="508" y="152" class="fg-t sm alt">API</text>
<line x1="250" y1="118" x2="382" y2="118" class="fg-l on"/><polygon points="390,118 382,113.5 382,122.5" class="fg-a on"/>
<text x="320" y="110" text-anchor="middle" class="fg-t sm acc">長成</text>
<rect x="40" y="208" width="200" height="32" rx="6" class="fg-b alt"/><text x="140" y="229" text-anchor="middle" class="fg-t sm">平台組：部署、監控、資料庫</text>
<rect x="400" y="208" width="200" height="32" rx="6" class="fg-b alt"/><text x="500" y="229" text-anchor="middle" class="fg-t sm">共用平台：管線、儀表板</text>
</svg><figcaption>團隊之間的溝通線，最後會變成服務之間的 API。想要什麼樣的架構，就先把團隊切成那個樣子，這叫「反向康威操作」（inverse Conway maneuver）。</figcaption></figure>
<p>反過來用，就是<b>反向康威操作</b>：先決定你要的架構邊界，再照它切團隊。帳本是「唯一能寫餘額的地方」，最自然的做法就是讓一個團隊擁有它：別的團隊只能透過它的 API，改它的資料表要經過它的審查。架構邊界和團隊邊界重疊，規則就不必靠大家自律。</p>
<h4>組織跟著階段長</h4>
<table>
<tr><th>階段</th><th>團隊大概的樣子</th></tr>
<tr><td>1–2</td><td>一到三個工程師，什麼都做。值班就是老闆的手機。</td></tr>
<tr><td>3</td><td>五到八人。第一個專門顧部署和監控的人出現，CI/CD 和值班輪替從這裡開始。</td></tr>
<tr><td>4</td><td>十到二十人。前端、後端、遊戲用戶端分組；有人開始專職做可靠性（SRE）或平台。</td></tr>
<tr><td>5</td><td>二三十人以上。照產品流切成幾個團隊（大廳、對局、帳本、付款），每隊自己的服務自己值班；平台團隊提供鋪好的路（paved road）：標準的部署管線、監控、資料庫範本；資安有專人。</td></tr>
<tr><td>6</td><td>好幾十人以上。好幾個平台團隊（資料、網路、可靠性），跨時區接力值班。</td></tr>
</table>
<p>《Team Topologies》（Skelton 與 Pais，2019）把團隊分成四種：<b>串流對齊團隊</b>（stream-aligned，對著一條產品流交付價值）、<b>平台團隊</b>（platform，提供自助服務的內部平台）、<b>賦能團隊</b>（enabling，短期進駐幫別人學會新技能）、<b>複雜子系統團隊</b>（complicated-subsystem，需要很深專業的部分，例如帳本或反作弊模型）。這套詞彙在大一點的公司面試裡很常出現。</p>
<div class="warn"><b>服務比人多，是紅燈。</b>五個工程師維護二十個微服務，每個人要顧四個服務的部署、監控、相依和值班，大部分時間都花在「讓它們能互相講話」。Segment 在 2018 年寫過一篇〈Goodbye Microservices〉，描述他們把上百個小服務併回一個單體的經過。服務切多細，應該由團隊的數量決定，而不是由流行決定。</div>

<h3><span class="badge lv4">專家</span>九、哪些決定是單向門</h3>
<p>Amazon 的 Jeff Bezos 在 2015 年的股東信裡，把決定分成兩種：<b>雙向門</b>（走錯了可以退回來）和<b>單向門</b>（走過去就很難回頭）。雙向門要快快決定，單向門才值得慢慢想。架構上的單向門，正是上一課「一開始就要做對」那份清單背後的原理：</p>
<ul>
<li><b>資料格式和識別碼</b>：主鍵用 <code>bigint</code>、時間一律存 UTC、金額和點數用整數。改這些要重寫所有資料。</li>
<li><b>對外的 API 和協定</b>：已經裝在玩家手機裡的舊版用戶端，你收不回來。協定從第一天就要帶版本號。</li>
<li><b>錢的正確性</b>：原子性、冪等、只新增的帳本。等真的有點數憑空出現才補，你連錯了多少都算不出來。</li>
<li><b>未來的分片鍵</b>：會長大的表都帶 <code>player_id</code>。</li>
</ul>
<p>其他的大多是雙向門：用哪一家雲端的哪個機型、要不要加快取、佇列選哪一套、服務要不要拆，都可以等量測說話。還有一個更大的雙向門很多人忘了：<b>往回走</b>。拆錯的服務可以併回去，加了沒用的快取可以拿掉。階梯不是只能往上爬。</p>
<p>到了第 6 階段之後，大公司常見的下一步不是把單一系統做得更大，而是<b>細胞化架構</b>（cell-based architecture）：把整套系統（閘道、服務、資料庫）複製成好幾份「細胞」，每個細胞只服務一部分玩家。一個細胞出事，只影響那一部分人，這叫控制<b>爆炸半徑</b>（blast radius）。第 8.3 課會從「哪裡會先壞」的角度再談它。</p>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>大公司都用微服務，所以一開始就該拆</td><td>大公司是長到那個規模、有那麼多團隊之後才拆的。服務數量應該跟團隊數量相稱。</td></tr>
<tr><td>遷移就是寫一支腳本把資料搬過去</td><td>搬資料只是七步裡的一步。雙寫、驗證、逐步切換、保留回退，才是讓遷移不出事的部分。</td></tr>
<tr><td>多區域一定比較可靠</td><td>多了跨區域切換這個新的壞法。很多重大事故就發生在切換的過程裡。多數產品做好多可用區就夠了。</td></tr>
<tr><td>架構是技術問題，跟組織無關</td><td>康威定律：團隊怎麼溝通，系統就長成什麼樣子。改架構常常要先改團隊。</td></tr>
<tr><td>升到下一個階段就不會回頭</td><td>拆錯的服務可以合回去，沒用的元件可以拿掉。每個元件都要持續證明它值得維運成本。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>Vue、TypeScript 的前端</b>：後端切讀、切寫時，前端最常看到的是「剛改完又變回舊的」。看到這種 bug，先問後端最近有沒有加副本或快取。API 從第一天就帶版本號，後端遷移時才能讓新舊用戶端並存。</li>
<li><b>Cocos、Unity 的遊戲用戶端</b>：裝在玩家手機裡的版本收不回來，所以協定改動要向下相容，伺服器要能同時服務好幾個版本的用戶端。這是遊戲特有的單向門。</li>
<li><b>Node.js、Go 的後端</b>：雙寫、回填、影子讀，都是你會親手寫的程式。回填要節流、要能從中斷的地方續跑；功能旗標要能在幾秒內切回。</li>
<li><b>Docker 與雲端</b>：每一個新階段都會多出新的容器、新的託管服務、新的帳單。用基礎設施即程式碼（第 2.5 課）管理它們，遷移時新舊兩套才能並存、也才拆得乾淨。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<ol>
<li>「你的服務現在是一台機器加一個資料庫。流量長了十倍，你會依序做哪些事？」</li>
<li>「怎麼在不停機的情況下，把一張很大的表搬到另一個資料庫？」</li>
<li>「雙寫有什麼風險？有什麼替代方案？」</li>
<li>「什麼時候需要多區域？你會怎麼設計資料的歸屬？」</li>
<li>「說說康威定律。它在你過去的團隊裡怎麼出現過？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>先量再動：看是 CPU、記憶體、資料庫還是頻寬先到頂。通常順序是：把資料庫搬到獨立的託管服務並確認備份能還原；把狀態移出應用程式，加負載平衡器和第二台應用程式伺服器，跨兩個可用區；資料庫讀取吃緊時先補索引、再加快取和讀取副本，靜態檔上 CDN；慢工作移到佇列。每一步都要說出觸發它的指標，以及它帶來的新問題。</li>
<li>擴展—遷移—收縮：開新庫；雙寫（或用 CDC 同步）；以主鍵範圍分批回填並依副本延遲節流；用筆數、雜湊和影子讀驗證；用功能旗標逐步切讀；短暫停寫後切換真相來源，並反向同步保留回退；觀察一段時間後才移除舊的。重點是任何時候只有一個真相來源，而且每一步都能退回。</li>
<li>兩個資料庫之間沒有共同交易，應用程式在兩次寫入中間失敗就會不一致；雙寫和回填同時進行時，舊資料可能蓋掉新資料，要靠版本號判斷；寫入順序也可能錯亂。替代方案是變更資料擷取：從舊庫的 WAL 依提交順序同步到新庫，不改應用程式、順序有保證，代價是多一套管線要維運。</li>
<li>只有在遠地延遲、資料在地化法規、或必須撐過整個區域故障時才需要。資料歸屬我會讓每個使用者有一個家區域，他的帳本只在家區域寫入，其他區域放非同步副本供災難復原；可以合併的資料（在線狀態、聊天）才考慮多區域寫入。跨區域切換要演練，而且通常由人決定，避免短暫的網路問題觸發切換。</li>
<li>系統的結構會複製設計它的組織的溝通結構。例子：前後端分在兩個團隊，API 就會變成兩邊協商的契約；同一個團隊裡的模組則容易互相耦合。好的回答會再講反向康威操作：照想要的架構切團隊，例如讓一個團隊擁有帳本，其他人只能走它的 API。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>你要把「玩家個人資料」從主庫搬到新的帳號服務資料庫，共 1,000 萬列。回填每秒 2,000 列，但副本延遲超過 1 秒就暫停，實測平均只有一半的時間在搬。回填大約要多久？</li>
<li>寫出一個回填迴圈的虛擬碼：分批、可以從中斷的地方續跑、會依副本延遲節流。</li>
<li>影子讀比對時發現 0.3% 的請求兩邊結果不一樣。列出三個可能原因，以及你會怎麼查。</li>
<li>把你自己的平台放進第一節的階梯：在第幾階？下一階的訊號，你的儀表板上看得到嗎？如果看不到，要加哪一條線？</li>
<li>一個 6 人的團隊打算把單體拆成 15 個微服務。用康威定律和值班的人數，寫三句話說服他們先不要。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>1,000 萬 ÷ 2,000 = 5,000 秒，大約 1.4 小時；只有一半時間在搬，大約 2.8 小時。這種量通常一個晚上就做完，可以挑離峰時段跑。</li>
<li>例如：<code>last = 讀取進度表的最後 id（沒有就是 0）</code>；迴圈：如果副本延遲 &gt; 1 秒就睡 5 秒再檢查；<code>rows = SELECT … WHERE id &gt; last ORDER BY id LIMIT 5000</code>；沒有資料就結束；用帶版本檢查的 upsert 寫進新庫；<code>last = rows 的最後一個 id</code>，寫回進度表。進度表讓程式當掉後能續跑，upsert 讓重跑同一批也不會出錯。</li>
<li>一是雙寫失敗沒被重試補上，查重試佇列和錯誤日誌；二是回填的舊資料蓋掉新資料，查不一致的列的版本號與更新時間；三是比對本身有時間差，影子讀時另一邊剛好在寫入，可以對不一致的列延遲幾秒再比一次，看是不是自己消失。另外也要檢查時區、浮點數、排序這類格式差異。</li>
<li>依各自情況回答。常見的缺口是：資料庫 CPU 只看平均沒看尖峰、沒有副本延遲的圖、沒有佇列訊息年齡、沒有「每次部署的停機時間」。缺哪條就補哪條，並寫下警戒值。</li>
<li>例如：一、15 個服務平均每人要顧 2.5 個，每個都有自己的部署、監控、升級和處理手冊；二、6 個人排不出可以長期撐的值班輪替，更別說每個服務都要有兩個人懂；三、我們只有一個團隊，康威定律說切出來的服務還是會被同一群人一起改，只得到分散式的麻煩，得不到獨立交付的好處。先做模組化的單體，把模組邊界畫清楚，等團隊分開了再沿著邊界拆。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>Alex Xu《System Design Interview – An Insider's Guide》</b>：第 1 章〈Scale from zero to millions of users〉一步一步畫出從一台機器到多資料中心，正好是這一課的面試版。</li>
<li><b>Stripe 工程部落格〈Online migrations at scale〉</b>（2017）：Stripe 怎麼用雙寫、改讀取路徑、改寫入路徑、移除舊資料四個階段，搬動上億筆正在使用中的資料。</li>
<li><b>Martin Fowler 網站上的〈ParallelChange〉與〈StranglerFigApplication〉</b>（<a href="https://martinfowler.com/">martinfowler.com</a>）：擴展—遷移—收縮和絞殺者模式的原始說明。</li>
<li><b>Matthew Skelton 與 Manuel Pais《Team Topologies》</b>：四種團隊、三種互動方式，以及怎麼用康威定律設計組織。</li>
<li><b>Melvin Conway〈How Do Committees Invent?〉</b>（1968）：康威定律的原始文章，很短，作者把全文放在自己的網站上。</li>
</ul>
` });
