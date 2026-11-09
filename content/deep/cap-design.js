DEEP({ 'cap-design': `
<p>前三課是零件：數字怎麼算、系統怎麼長、哪裡會先壞。這一章把它們組起來，用一場 45 分鐘的系統設計（system design）面試從頭走到尾：每個階段該講什麼、白板上該出現什麼、兩個最難的部分要挖多深、面試官會在哪裡追問，最後是一張評分表，告訴你強的答案和弱的答案差在哪裡。題目換成通用的版本：一個即時多人的猜高低平台，核心是一本不能出錯的點數帳本。</p>
<div class="note"><b>題目。</b>設計一個即時多人猜高低（Higher or Lower）平台。玩家進入房間，每一回合翻開一張牌，玩家付一點入場點數，猜下一張比較高或比較低，猜對拿到獎勵點數。點數可以透過外部付款服務購買，也可以兌換獎品。一千萬註冊使用者。每一回合的點數必須剛好結算一次。可用性 99.9%，少掉一個可用區也要撐得住。營運人員需要一個後台。</div>

<h3><span class="badge lv1">基礎</span>一、面試在考什麼：45 分鐘怎麼分</h3>
<p>想像一位建築師第一次跟業主開會。他不會一坐下就開始畫藍圖，而是先問：幾個人住？預算多少？以後會不會加蓋？家裡有沒有長輩要無障礙？問完才拿出筆，而且邊畫邊說「樓梯放這裡，因為……」。系統設計面試考的就是這個過程：<b>面對模糊的需求，能不能問對問題、做出有理由的取捨，並且讓對方一路聽得懂。</b>最後那張圖畫得多漂亮，反而是最不重要的部分。</p>
<figure class="figure"><svg viewBox="0 0 660 170" class="fg" style="width:100%;max-width:660px" role="img" aria-label="四十五分鐘的時間分配：需求五分鐘、估算五分鐘、API 與資料五分鐘、高階設計十分鐘、深入兩個難點十五分鐘、故障與收尾五分鐘">
<rect x="30" y="40" width="66" height="40" rx="4" class="fg-b alt"/><text x="63" y="65" text-anchor="middle" class="fg-t">需求</text>
<rect x="97" y="40" width="66" height="40" rx="4" class="fg-b alt"/><text x="130" y="65" text-anchor="middle" class="fg-t">估算</text>
<rect x="164" y="40" width="66" height="40" rx="4" class="fg-b"/><text x="197" y="64" text-anchor="middle" class="fg-t sm">API 與資料</text>
<rect x="231" y="40" width="132" height="40" rx="4" class="fg-b"/><text x="297" y="65" text-anchor="middle" class="fg-t">高階設計</text>
<rect x="364" y="40" width="199" height="40" rx="4" class="fg-b hot"/><text x="463" y="65" text-anchor="middle" class="fg-t">深入：帳本、即時層</text>
<rect x="564" y="40" width="66" height="40" rx="4" class="fg-b warm"/><text x="597" y="64" text-anchor="middle" class="fg-t sm">故障與收尾</text>
<text x="30" y="100" text-anchor="middle" class="fg-t sm">0</text><text x="97" y="100" text-anchor="middle" class="fg-t sm">5</text><text x="164" y="100" text-anchor="middle" class="fg-t sm">10</text><text x="231" y="100" text-anchor="middle" class="fg-t sm">15</text><text x="364" y="100" text-anchor="middle" class="fg-t sm">25</text><text x="564" y="100" text-anchor="middle" class="fg-t sm">40</text><text x="630" y="100" text-anchor="middle" class="fg-t sm">45 分</text>
<text x="30" y="26" class="fg-t sm">時間</text>
<text x="63" y="132" text-anchor="middle" class="fg-t sm">會不會問</text><text x="130" y="132" text-anchor="middle" class="fg-t sm">會不會算</text><text x="197" y="132" text-anchor="middle" class="fg-t sm">介面清楚嗎</text><text x="297" y="132" text-anchor="middle" class="fg-t sm">有沒有全貌</text><text x="463" y="132" text-anchor="middle" class="fg-t sm acc">有沒有深度</text><text x="597" y="132" text-anchor="middle" class="fg-t sm">想過出事嗎</text>
<text x="330" y="160" text-anchor="middle" class="fg-t sm">下排：面試官在每一段觀察的事</text>
</svg><figcaption>深入的部分佔最多時間，因為資深與否主要在這裡分出高下。前面三段要快：需求、估算、介面加起來不要超過 15 分鐘。</figcaption></figure>

<h3><span class="badge lv1">基礎</span>二、需求：先問，再寫下來</h3>
<p>開口第一件事是問問題。每個問題都要有目的：它的答案會改變你的設計。</p>
<table>
<tr><th>問題</th><th>為什麼要問</th><th>假設的答案</th></tr>
<tr><td>一個房間最多幾個人？</td><td>決定廣播的扇出</td><td>50 人</td></tr>
<tr><td>一回合多長？</td><td>決定訊息速率和寫入量</td><td>約 10 秒</td></tr>
<tr><td>結果由誰決定？玩家要能驗證嗎？</td><td>決定防作弊與公平性的設計</td><td>伺服器決定，事後可驗證</td></tr>
<tr><td>點數能兌換獎品嗎？</td><td>點數有價值，資安和稽核的等級就完全不同</td><td>可以</td></tr>
<tr><td>使用者在哪裡？</td><td>單一區域還是多區域</td><td>台灣與鄰近地區</td></tr>
<tr><td>回合中斷線怎麼辦？</td><td>決定狀態要存在哪裡</td><td>回合照常結算，重連後看到結果</td></tr>
</table>
<p>接著把需求寫在白板上，分三塊。<b>功能需求</b>：註冊登入、大廳選房、即時參加回合、看餘額與歷史、購買點數、兌換獎品、營運後台。<b>非功能需求，一定要有數字</b>：可用性 99.9%（每月約 43 分鐘，第 4.2 課）；出手到「已受理」p99 低於 200 ms；結算在回合結束後 2 秒內完成；帳本的資料遺失目標（RPO）為零、復原時間目標（RTO）15 分鐘；點數零誤差。<b>範圍外</b>：聊天、好友、推薦。寫下範圍外，等於告訴面試官「我知道還有這些，但我選擇把時間花在重要的地方」。</p>

<h3><span class="badge lv2">進階</span>三、估算：兩分鐘講完，然後下結論</h3>
<p>直接用第 8.1 課的數字：每日活躍 150 萬人；尖峰同時在線 15 萬條連線；尖峰每秒約 1,050 回合，帳本每秒約 2,100 筆交易；每天新增約 24 GB。然後一口氣說出三個結論：</p>
<ol>
<li>寫入量一台好的 PostgreSQL 主庫扛得住，<b>現在不分片</b>，但每張會長大的表都帶 <code>player_id</code>，替以後留路。</li>
<li>15 萬條長連線需要一層專門的即時閘道，大約十幾台。</li>
<li>歷史資料一年近 9 TB，要按月分割，熱資料只留 90 天。</li>
</ol>
<p>估算的價值在這三句結論，不在算式。面試官聽到「現在不分片」，就知道你不會為了炫技把系統弄複雜。</p>

<h3><span class="badge lv2">進階</span>四、API 與即時協定</h3>
<p>不需要即時的操作走 REST，回合裡的互動走 WebSocket：</p>
<pre><code>POST /v1/purchases          Idempotency-Key: 9f2c…
GET  /v1/me/balance
GET  /v1/rooms?tier=basic
POST /v1/rooms/{id}/join    → 回傳 30 秒有效的連線票
GET  /v1/me/rounds?cursor=… → 游標分頁，不用 OFFSET
POST /v1/redemptions        Idempotency-Key: 41ab…</code></pre>
<pre><code>→ {"t":"guess","round":"r_8812","pick":"higher",
   "entry":10,"cseq":42}
← {"t":"accepted","round":"r_8812","balance":990,
   "seq":1201}
← {"t":"result","round":"r_8812","card":"Q",
   "win":true,"reward":20,"seq":1202}</code></pre>
<p>每一個欄位都有理由：</p>
<ul>
<li><b>Idempotency-Key</b>：購買和兌換牽涉到錢和獎品，手機網路一抖就會重送，伺服器用這個鍵保證只做一次（第 3.9 課）。</li>
<li><b>連線票</b>：WebSocket 連線時，網址會出現在代理和日誌裡，所以不放長效的登入權杖，而是用 REST 先換一張短效、只能用一次的票。</li>
<li><b>seq</b>：伺服器送出的每則訊息都帶遞增序號。斷線重連時，用戶端報上「我收到 1201」，伺服器從 1202 開始補（第八節）。</li>
<li><b>cseq</b>：用戶端自己的序號，同一條連線上重送同一個出手，伺服器只處理一次。</li>
<li><b>/v1</b>：舊版用戶端還裝在玩家手機裡，協定一定要有版本（第 8.2 課的單向門）。</li>
</ul>

<h3><span class="badge lv2">進階</span>五、資料模型</h3>
<figure class="figure"><svg viewBox="0 0 660 300" class="fg" style="width:100%;max-width:660px" role="img" aria-label="資料模型：players 擁有 accounts，accounts 有一列 balances；ledger_entries 只新增並按月分割，以 txn_id 連到不分割的 ledger_txns 冪等表；rounds 有多筆 round_entries，結果與 outbox 在同一筆交易寫入">
<rect x="20" y="20" width="170" height="60" rx="6" class="fg-b"/><text x="32" y="42" class="fg-t mono">players</text><text x="32" y="64" class="fg-t sm">id、名稱、建立時間</text>
<rect x="20" y="120" width="170" height="70" rx="6" class="fg-b"/><text x="32" y="142" class="fg-t mono">accounts</text><text x="32" y="162" class="fg-t sm">id、擁有者、類型</text><text x="32" y="180" class="fg-t sm">可用／保留／入場池／獎勵</text>
<rect x="20" y="230" width="170" height="60" rx="6" class="fg-b alt"/><text x="32" y="252" class="fg-t mono">balances</text><text x="32" y="274" class="fg-t sm">每個帳戶一列：餘額</text>
<line x1="105" y1="80" x2="105" y2="112" class="fg-l"/><polygon points="105,120 100.5,112 109.5,112" class="fg-a"/>
<line x1="105" y1="190" x2="105" y2="222" class="fg-l"/><polygon points="105,230 100.5,222 109.5,222" class="fg-a"/>
<text x="113" y="104" class="fg-t sm">擁有</text><text x="113" y="214" class="fg-t sm">一對一</text>
<rect x="245" y="20" width="185" height="100" rx="6" class="fg-b hot"/><text x="257" y="42" class="fg-t mono">ledger_entries</text><text x="257" y="62" class="fg-t sm">txn_id、account_id</text><text x="257" y="80" class="fg-t sm">delta（整數點數）</text><text x="257" y="98" class="fg-t sm">kind、ref、時間</text><text x="257" y="114" class="fg-t sm acc">只新增，按月分割</text>
<rect x="245" y="170" width="185" height="70" rx="6" class="fg-b hot"/><text x="257" y="192" class="fg-t mono">ledger_txns</text><text x="257" y="212" class="fg-t sm">txn_key（唯一）、txn_id</text><text x="257" y="230" class="fg-t sm acc">冪等表，不分割</text>
<line x1="245" y1="70" x2="198" y2="140" class="fg-l"/><polygon points="193,147.5 194.6,138.4 202.1,143.4" class="fg-a"/>
<text x="204" y="157" class="fg-t sm">account_id</text>
<line x1="337" y1="170" x2="337" y2="128" class="fg-l"/><polygon points="337,120 332.5,128 341.5,128" class="fg-a"/>
<text x="345" y="152" class="fg-t sm">txn_id</text>
<rect x="480" y="20" width="165" height="60" rx="6" class="fg-b"/><text x="492" y="42" class="fg-t mono">rounds</text><text x="492" y="64" class="fg-t sm">id、房間、牌、種子雜湊</text>
<rect x="480" y="120" width="165" height="70" rx="6" class="fg-b"/><text x="492" y="142" class="fg-t mono">round_entries</text><text x="492" y="162" class="fg-t sm">round_id、player_id</text><text x="492" y="180" class="fg-t sm">猜什麼、入場、狀態</text>
<rect x="480" y="230" width="165" height="60" rx="6" class="fg-b warm"/><text x="492" y="252" class="fg-t mono">outbox</text><text x="492" y="274" class="fg-t sm">待結算的事件</text>
<line x1="562" y1="80" x2="562" y2="112" class="fg-l"/><polygon points="562,120 557.5,112 566.5,112" class="fg-a"/>
<line x1="562" y1="190" x2="562" y2="222" class="fg-l dash"/><polygon points="562,230 557.5,222 566.5,222" class="fg-a"/>
<text x="570" y="104" class="fg-t sm">一對多</text><text x="570" y="214" class="fg-t sm">同一筆交易</text>
<line x1="480" y1="260" x2="438" y2="215" class="fg-l dim dash"/><polygon points="432.5,209 441.1,212.2 434.5,218.4" class="fg-a"/>
<text x="452" y="272" text-anchor="end" class="fg-t sm">結算用</text>
</svg><figcaption>綠色是帳本的核心：分錄只新增、不修改；冪等表獨立出來，不分割。餘額表只是分錄加總的快取，隨時可以從分錄重算。</figcaption></figure>
<p>三個設計重點：</p>
<ul>
<li><b>複式帳本</b>（double-entry ledger）：每一次點數移動，都是同一個 <code>txn_id</code> 底下加總為零的幾列（第 3.2 課）。每個玩家有兩個帳戶：「可用」和「保留」；系統有「入場池」「獎勵」「購買」這些帳戶。玩家付 10 點入場，先是可用 −10、保留 +10；結算時保留 −10、入場池 +10。系統的發行帳戶（例如獎勵、購買）可以是負數，它代表平台發出去的點數總量。點數不會憑空出現或消失，所有分錄加起來永遠是 0。</li>
<li><b>冪等表為什麼要獨立</b>：分錄表按月分割，而 PostgreSQL 在分割表上的唯一約束<b>必須包含分割鍵</b>。冪等鍵如果放在分錄表上，只能保證「同一個月內」不重複，跨月的重送就擋不住。所以冪等鍵放在一張不分割的小表，例如 <code>txn_key = 'entry:r_8812:p_77'</code>。</li>
<li><b>點數用整數</b>，時間存 UTC，主鍵用 <code>bigint</code>。這些是第 8.2 課說的單向門。</li>
</ul>

<h3><span class="badge lv3">專業</span>六、高階設計：順著一個回合走一遍</h3>
<figure class="figure"><svg viewBox="0 0 680 350" class="fg" style="width:100%;max-width:680px" role="img" aria-label="高階架構：玩家經過 CDN 與負載平衡器，連到閘道與 API 服務；閘道與房間伺服器互通；房間伺服器向帳本服務保留點數；寄件匣工作者觸發結算；帳本服務寫入 PostgreSQL 主庫與同步備援；另有 Redis、讀取副本、外部付款與獎品服務、後台">
<rect x="250" y="12" width="180" height="34" rx="6" class="fg-b"/><text x="340" y="34" text-anchor="middle" class="fg-t">玩家（瀏覽器、手機）</text>
<rect x="60" y="80" width="160" height="34" rx="6" class="fg-b"/><text x="140" y="102" text-anchor="middle" class="fg-t">CDN＋WAF</text>
<rect x="260" y="80" width="160" height="34" rx="6" class="fg-b"/><text x="340" y="102" text-anchor="middle" class="fg-t">負載平衡器</text>
<rect x="490" y="80" width="150" height="34" rx="6" class="fg-b"/><text x="565" y="102" text-anchor="middle" class="fg-t">後台（SSO）</text>
<rect x="20" y="148" width="180" height="42" rx="6" class="fg-b alt"/><text x="110" y="166" text-anchor="middle" class="fg-t">閘道（WebSocket）</text><text x="110" y="183" text-anchor="middle" class="fg-t sm">15 萬條連線，十幾台</text>
<rect x="240" y="148" width="180" height="42" rx="6" class="fg-b alt"/><text x="330" y="166" text-anchor="middle" class="fg-t">房間伺服器</text><text x="330" y="183" text-anchor="middle" class="fg-t sm">一房一台，狀態在記憶體</text>
<rect x="460" y="148" width="200" height="42" rx="6" class="fg-b"/><text x="560" y="166" text-anchor="middle" class="fg-t">API 服務</text><text x="560" y="183" text-anchor="middle" class="fg-t sm">大廳、帳號、購買、兌換</text>
<rect x="20" y="222" width="180" height="42" rx="6" class="fg-b"/><text x="110" y="240" text-anchor="middle" class="fg-t">Redis</text><text x="110" y="257" text-anchor="middle" class="fg-t sm">工作階段、房間目錄、限流</text>
<rect x="240" y="222" width="180" height="42" rx="6" class="fg-b hot"/><text x="330" y="240" text-anchor="middle" class="fg-t acc">帳本服務</text><text x="330" y="257" text-anchor="middle" class="fg-t sm">唯一能改點數的地方</text>
<rect x="460" y="222" width="200" height="42" rx="6" class="fg-b"/><text x="560" y="240" text-anchor="middle" class="fg-t">寄件匣工作者</text><text x="560" y="257" text-anchor="middle" class="fg-t sm">讀寄件匣、觸發結算</text>
<rect x="20" y="296" width="180" height="42" rx="6" class="fg-b"/><text x="110" y="314" text-anchor="middle" class="fg-t">讀取副本</text><text x="110" y="331" text-anchor="middle" class="fg-t sm">歷史、報表</text>
<rect x="240" y="296" width="180" height="42" rx="6" class="fg-b hot"/><text x="330" y="314" text-anchor="middle" class="fg-t acc">PostgreSQL</text><text x="330" y="331" text-anchor="middle" class="fg-t sm">主庫＋同步備援（兩區）</text>
<rect x="460" y="296" width="200" height="42" rx="6" class="fg-b warm"/><text x="560" y="314" text-anchor="middle" class="fg-t">外部付款／獎品</text><text x="560" y="331" text-anchor="middle" class="fg-t sm">隔離，單筆與每日限額</text>
<line x1="300" y1="46" x2="167.8" y2="78.1" class="fg-l dim"/><polygon points="160,80 166.7,73.7 168.8,82.5" class="fg-a"/>
<text x="210" y="58" text-anchor="middle" class="fg-t sm">遊戲檔</text>
<line x1="340" y1="46" x2="340" y2="72" class="fg-l on"/><polygon points="340,80 335.5,72 344.5,72" class="fg-a on"/>
<text x="348" y="69" class="fg-t acc">①</text>
<line x1="300" y1="114" x2="125.9" y2="146.5" class="fg-l"/><polygon points="118,148 125,142.1 126.7,150.9" class="fg-a"/>
<line x1="380" y1="114" x2="552.1" y2="146.5" class="fg-l"/><polygon points="560,148 551.3,150.9 553,142.1" class="fg-a"/>
<line x1="600" y1="114" x2="600" y2="140" class="fg-l"/><polygon points="600,148 595.5,140 604.5,140" class="fg-a"/>
<line x1="208" y1="169" x2="232" y2="169" class="fg-l on"/><polygon points="240,169 232,164.5 232,173.5" class="fg-a on"/><polygon points="200,169 208,164.5 208,173.5" class="fg-a on"/>
<text x="220" y="160" text-anchor="middle" class="fg-t acc">②⑤</text>
<line x1="330" y1="190" x2="330" y2="214" class="fg-l on"/><polygon points="330,222 325.5,214 334.5,214" class="fg-a on"/>
<text x="338" y="211" class="fg-t acc">③</text>
<line x1="460" y1="243" x2="428" y2="243" class="fg-l on"/><polygon points="420,243 428,238.5 428,247.5" class="fg-a on"/>
<text x="440" y="236" text-anchor="middle" class="fg-t acc">④</text>
<line x1="330" y1="264" x2="330" y2="288" class="fg-l"/><polygon points="330,296 325.5,288 334.5,288" class="fg-a"/>
<line x1="240" y1="317" x2="208" y2="317" class="fg-l"/><polygon points="200,317 208,312.5 208,321.5" class="fg-a"/>
<line x1="110" y1="190" x2="110" y2="214" class="fg-l"/><polygon points="110,222 105.5,214 114.5,214" class="fg-a"/>
<line x1="560" y1="264" x2="560" y2="288" class="fg-l"/><polygon points="560,296 555.5,288 564.5,288" class="fg-a"/>
</svg><figcaption>① 玩家出手，經負載平衡器到閘道；② 閘道查房間目錄，轉給那一間的房間伺服器；③ 房間伺服器請帳本保留入場點數；回合結束時結果和寄件匣一起寫入，④ 寄件匣工作者觸發結算；⑤ 結果經閘道推回房間裡的每個玩家。</figcaption></figure>
<p>講高階設計時，順著一個請求走，每到一個方塊就說「它為什麼存在」：</p>
<ul>
<li><b>閘道</b>（gateway）只管連線：TLS、驗證連線票、心跳、轉送訊息。它不懂遊戲規則，所以可以無腦擴展，部署時只要排空連線（第 1.7 課）。</li>
<li><b>房間伺服器</b>是有狀態的：一間房的牌堆、倒數、玩家名單都在某一台的記憶體裡，判定才快、才一致。Redis 裡有一份「房間 → 伺服器」的目錄，閘道照它轉送。</li>
<li><b>帳本服務</b>是唯一能改點數的地方。房間、購買、兌換、後台，全部只能呼叫它的 API，沒有人能直接改資料表。把錢的規則集中在一個地方，才審得過來、測得完整。</li>
<li><b>外部付款與獎品服務</b>放在隔離的網段，有單筆和每日的硬上限。就算帳本被攻破，能流出去的價值也有天花板。</li>
</ul>

<h3><span class="badge lv3">專業</span>七、深入一：帳本，一個回合的點數怎麼流</h3>
<p>面試官一定會挑最難的部分要你往下挖。這一題最難的是「每一回合的點數必須剛好結算一次」。用真實的值走一次：玩家 p_77 有 1,000 點，在回合 r_8812 付 10 點入場，猜「高」，猜對，獎勵 20 點。</p>
<figure class="figure"><svg viewBox="0 0 660 400" class="fg" style="width:100%;max-width:660px" role="img" aria-label="一個回合的時序：玩家出手，房間伺服器請帳本保留十點，帳本以條件更新寫入資料庫後回覆，玩家收到已受理；回合結束時房間伺服器把結果與寄件匣寫入資料庫，工作者讀寄件匣後請帳本結算，帳本釋放保留並加二十點，房間推送結果">
<text x="60" y="24" text-anchor="middle" class="fg-t">玩家</text><text x="190" y="24" text-anchor="middle" class="fg-t">房間伺服器</text><text x="330" y="24" text-anchor="middle" class="fg-t acc">帳本服務</text><text x="470" y="24" text-anchor="middle" class="fg-t">資料庫</text><text x="600" y="24" text-anchor="middle" class="fg-t">工作者</text>
<line x1="60" y1="34" x2="60" y2="388" class="fg-l dim dash"/><line x1="190" y1="34" x2="190" y2="388" class="fg-l dim dash"/><line x1="330" y1="34" x2="330" y2="388" class="fg-l dim dash"/><line x1="470" y1="34" x2="470" y2="388" class="fg-l dim dash"/><line x1="600" y1="34" x2="600" y2="388" class="fg-l dim dash"/>
<line x1="60" y1="66" x2="182" y2="66" class="fg-l"/><polygon points="190,66 182,61.5 182,70.5" class="fg-a"/><text x="125" y="60" text-anchor="middle" class="fg-t sm">1 猜高，入場 10</text>
<line x1="190" y1="98" x2="322" y2="98" class="fg-l on"/><polygon points="330,98 322,93.5 322,102.5" class="fg-a on"/><text x="260" y="92" text-anchor="middle" class="fg-t sm acc">2 保留 10 點</text>
<line x1="330" y1="130" x2="462" y2="130" class="fg-l on"/><polygon points="470,130 462,125.5 462,134.5" class="fg-a on"/><text x="400" y="124" text-anchor="middle" class="fg-t sm acc">3 可用 −10，保留 +10</text>
<line x1="330" y1="162" x2="198" y2="162" class="fg-l"/><polygon points="190,162 198,157.5 198,166.5" class="fg-a"/><text x="260" y="156" text-anchor="middle" class="fg-t sm">4 已保留</text>
<line x1="190" y1="194" x2="68" y2="194" class="fg-l"/><polygon points="60,194 68,189.5 68,198.5" class="fg-a"/><text x="125" y="188" text-anchor="middle" class="fg-t sm">5 已受理，可用 990</text>
<line x1="20" y1="218" x2="640" y2="218" class="fg-l warm dash"/><text x="640" y="212" text-anchor="end" class="fg-t sm warm">回合結束（約 10 秒後）</text>
<line x1="190" y1="246" x2="462" y2="246" class="fg-l"/><polygon points="470,246 462,241.5 462,250.5" class="fg-a"/><text x="400" y="240" text-anchor="middle" class="fg-t sm">6 結果＋寄件匣，同一交易</text>
<line x1="600" y1="278" x2="478" y2="278" class="fg-l"/><polygon points="470,278 478,273.5 478,282.5" class="fg-a"/><text x="535" y="272" text-anchor="middle" class="fg-t sm">7 讀寄件匣</text>
<line x1="600" y1="310" x2="338" y2="310" class="fg-l on"/><polygon points="330,310 338,305.5 338,314.5" class="fg-a on"/><text x="535" y="304" text-anchor="middle" class="fg-t sm acc">8 結算</text>
<line x1="330" y1="342" x2="462" y2="342" class="fg-l on"/><polygon points="470,342 462,337.5 462,346.5" class="fg-a on"/><text x="400" y="336" text-anchor="middle" class="fg-t sm acc">9 保留 −10，可用 +20</text>
<line x1="190" y1="374" x2="68" y2="374" class="fg-l"/><polygon points="60,374 68,369.5 68,378.5" class="fg-a"/><text x="125" y="368" text-anchor="middle" class="fg-t sm">10 推送結果</text>
</svg><figcaption>綠色的箭頭是會動到點數的步驟，每一個都帶冪等鍵。回合結束之後，房間伺服器不直接呼叫帳本，而是把「要結算」寫進寄件匣，由工作者負責送達，所以帳本暫時不能用時，結果也不會遺失。</figcaption></figure>
<p><b>步驟 2 到 3：保留</b>（reservation）。玩家出手的那一刻點數還不能直接扣掉，因為回合還沒結束；也不能不管，否則他可以同時在十個房間出手，花掉根本沒有的點數。所以用一個<b>原子性的條件式更新</b>，把點數從玩家的「可用」帳戶移到他的「保留」帳戶：</p>
<pre><code>-- 在同一筆交易裡
INSERT INTO ledger_txns (txn_key, txn_id)
VALUES ('entry:r_8812:p_77', $txn)
ON CONFLICT (txn_key) DO NOTHING;
-- 沒插入任何列：做過了，回傳上次的結果

UPDATE balances SET balance = balance - 10
 WHERE account_id = $avail AND balance &gt;= 10;
-- 影響 0 列：點數不足，整筆回復

UPDATE balances SET balance = balance + 10
 WHERE account_id = $held;

INSERT INTO ledger_entries
  (txn_id, account_id, delta, kind, ref)
VALUES ($txn, $avail, -10, 'hold', 'r_8812'),
       ($txn, $held,   10, 'hold', 'r_8812');</code></pre>
<p>不需要先 <code>SELECT</code> 再判斷：<code>WHERE balance &gt;= 10</code> 讓「檢查」和「扣除」在同一個原子動作裡完成，兩個房間同時出手也不會透支。</p>
<p><b>步驟 6 到 9：寄件匣與結算。</b>回合結束時，房間伺服器在<b>同一筆交易</b>裡寫入回合結果和一列寄件匣（outbox，第 3.7 課）。工作者讀寄件匣，用冪等鍵 <code>settle:r_8812:p_77</code> 呼叫帳本：保留帳戶的 10 點轉進入場池，猜對的話再從獎勵帳戶轉 20 點到玩家的可用帳戶。工作者在呼叫之後、標記完成之前當掉怎麼辦？重啟後再送一次，冪等表擋下，什麼都不會多做。這就是<b>傳遞至少一次，加上冪等，效果剛好一次</b>（第 3.9 課）。</p>
<h4>熱點帳戶：最容易被忽略的瓶頸</h4>
<p>注意結算的分錄：每一回合、每一位玩家結算時，都要寫同一個「入場池」系統帳戶，猜對的還要寫同一個「獎勵」帳戶。如果它們的餘額各是 <code>balances</code> 裡的一列，尖峰每秒約 1,050 次結算全都要搶入場池那一列的鎖。一列鎖要握到交易提交為止，而同步複寫讓每次提交多等一趟跨可用區的來回，假設要 1 到 2 毫秒，這一列每秒最多只能處理五百到一千次。<b>一列的上限，比整台資料庫的上限低得多</b>（第 3.2 課的熱點列）。</p>
<figure class="figure"><svg viewBox="0 0 640 220" class="fg" style="width:100%;max-width:640px" role="img" aria-label="左邊所有交易都搶同一個入場池帳戶的列鎖；右邊依玩家編號雜湊分到十六個子帳戶，鎖的競爭分散成十六份">
<text x="160" y="22" text-anchor="middle" class="fg-t lg">一個入場池</text>
<text x="480" y="22" text-anchor="middle" class="fg-t lg">拆成 16 個子帳戶</text>
<line x1="320" y1="10" x2="320" y2="210" class="fg-l dim dash"/>
<line x1="30" y1="50" x2="190" y2="104" class="fg-l"/><line x1="30" y1="76" x2="190" y2="106" class="fg-l"/><line x1="30" y1="102" x2="190" y2="108" class="fg-l"/><line x1="30" y1="128" x2="190" y2="110" class="fg-l"/><line x1="30" y1="154" x2="190" y2="112" class="fg-l"/><line x1="30" y1="180" x2="190" y2="114" class="fg-l"/>
<rect x="190" y="84" width="110" height="50" rx="6" class="fg-b warm"/><text x="245" y="106" text-anchor="middle" class="fg-t">入場池</text><text x="245" y="124" text-anchor="middle" class="fg-t sm">一列，大家排隊</text>
<text x="160" y="204" text-anchor="middle" class="fg-t sm warm">每秒 1,050 次結算搶同一把鎖</text>
<line x1="350" y1="58" x2="470" y2="58" class="fg-l"/><line x1="350" y1="88" x2="470" y2="88" class="fg-l"/><line x1="350" y1="118" x2="470" y2="118" class="fg-l"/><line x1="350" y1="148" x2="470" y2="148" class="fg-l"/><text x="410" y="52" text-anchor="middle" class="fg-t sm">分流</text>
<rect x="470" y="48" width="30" height="20" rx="3" class="fg-b hot"/><rect x="506" y="48" width="30" height="20" rx="3" class="fg-b hot"/><rect x="542" y="48" width="30" height="20" rx="3" class="fg-b hot"/><rect x="578" y="48" width="30" height="20" rx="3" class="fg-b hot"/>
<rect x="470" y="78" width="30" height="20" rx="3" class="fg-b hot"/><rect x="506" y="78" width="30" height="20" rx="3" class="fg-b hot"/><rect x="542" y="78" width="30" height="20" rx="3" class="fg-b hot"/><rect x="578" y="78" width="30" height="20" rx="3" class="fg-b hot"/>
<rect x="470" y="108" width="30" height="20" rx="3" class="fg-b hot"/><rect x="506" y="108" width="30" height="20" rx="3" class="fg-b hot"/><rect x="542" y="108" width="30" height="20" rx="3" class="fg-b hot"/><rect x="578" y="108" width="30" height="20" rx="3" class="fg-b hot"/>
<rect x="470" y="138" width="30" height="20" rx="3" class="fg-b hot"/><rect x="506" y="138" width="30" height="20" rx="3" class="fg-b hot"/><rect x="542" y="138" width="30" height="20" rx="3" class="fg-b hot"/><rect x="578" y="138" width="30" height="20" rx="3" class="fg-b hot"/>
<text x="480" y="186" text-anchor="middle" class="fg-t sm acc">依 player_id 雜湊選一個</text>
<text x="480" y="204" text-anchor="middle" class="fg-t sm">每個每秒約 65 筆；總額由背景加總</text>
</svg><figcaption>同樣 1,050 次結算，分到 16 個子帳戶後，每一列每秒只剩六十多筆，遠低於單列的上限。系統帳戶的總額不需要即時，交給背景工作定期加總。</figcaption></figure>
<p>另一種做法是系統帳戶根本不維護即時餘額，只寫分錄，總額由背景工作定期加總。兩種都是把「每筆交易都要碰同一列」拿掉。</p>
<h4>對帳：證明你沒算錯</h4>
<ul>
<li><b>內部對帳</b>，每幾分鐘跑一次：所有分錄加總必須為 0；每個帳戶的 <code>balances</code> 必須等於它的分錄加總；每個已結束的回合，入場和結算的分錄都要存在。任何一項不成立，<b>立刻呼叫值班人員</b>，並且自動暫停兌換。</li>
<li><b>外部對帳</b>（reconciliation），每天跑一次：拿付款服務的對帳報表和帳本的購買分錄逐筆比對，拿獎品服務的出貨紀錄和兌換分錄比對。外部系統的 webhook 要驗證簽章，並用對方的付款編號當冪等鍵。</li>
</ul>

<h3><span class="badge lv3">專業</span>八、深入二：即時層，斷線之後發生什麼</h3>
<p>第二個值得深入的是即時層。15 萬條連線本身不難（第 8.1 課算過記憶體和檔案描述符），難的是<b>連線一定會斷</b>：手機進電梯、切換 Wi-Fi、閘道部署重啟。設計要讓斷線變成一件無感的小事：</p>
<figure class="figure"><svg viewBox="0 0 660 250" class="fg" style="width:100%;max-width:660px" role="img" aria-label="斷線續傳：玩家原本連在閘道 A，閘道 A 重啟後玩家帶著票和最後收到的序號 1201 連到閘道 B，閘道 B 查 Redis 房間目錄找到房間伺服器 3，房間伺服器從環狀緩衝區補送 1202 到 1205">
<rect x="20" y="104" width="100" height="44" rx="6" class="fg-b"/><text x="70" y="131" text-anchor="middle" class="fg-t">玩家</text>
<rect x="190" y="30" width="130" height="40" rx="6" class="fg-b warm"/><text x="255" y="55" text-anchor="middle" class="fg-t">閘道 A：重啟中</text>
<rect x="190" y="160" width="130" height="40" rx="6" class="fg-b hot"/><text x="255" y="185" text-anchor="middle" class="fg-t">閘道 B</text>
<rect x="420" y="26" width="220" height="48" rx="6" class="fg-b"/><text x="530" y="46" text-anchor="middle" class="fg-t">Redis：房間目錄</text><text x="530" y="64" text-anchor="middle" class="fg-t sm mono">r_77 → 房間伺服器 3</text>
<rect x="420" y="140" width="220" height="96" rx="6" class="fg-b alt"/><text x="530" y="160" text-anchor="middle" class="fg-t">房間伺服器 3</text>
<rect x="432" y="176" width="32" height="24" rx="3" class="fg-b"/><text x="448" y="192" text-anchor="middle" class="fg-t sm mono">1201</text>
<rect x="468" y="176" width="32" height="24" rx="3" class="fg-b hot"/><text x="484" y="192" text-anchor="middle" class="fg-t sm mono">1202</text>
<rect x="504" y="176" width="32" height="24" rx="3" class="fg-b hot"/><text x="520" y="192" text-anchor="middle" class="fg-t sm mono">1203</text>
<rect x="540" y="176" width="32" height="24" rx="3" class="fg-b hot"/><text x="556" y="192" text-anchor="middle" class="fg-t sm mono">1204</text>
<rect x="576" y="176" width="32" height="24" rx="3" class="fg-b hot"/><text x="592" y="192" text-anchor="middle" class="fg-t sm mono">1205</text>
<text x="530" y="224" text-anchor="middle" class="fg-t sm">最近的訊息（環狀緩衝區）</text>
<line x1="120" y1="112" x2="184" y2="68" class="fg-l warm dash"/><polygon points="190,64 185.6,72.4 180.5,65" class="fg-a warm"/>
<text x="126" y="80" class="fg-t sm warm">斷線</text>
<line x1="120" y1="140" x2="183" y2="176" class="fg-l on"/><polygon points="190,180 180.8,179.7 185.3,171.9" class="fg-a on"/>
<text x="84" y="180" class="fg-t sm acc">① 重連</text>
<line x1="310" y1="160" x2="414" y2="78" class="fg-l"/><polygon points="420,73 415.8,81.2 410.2,74.1" class="fg-a"/>
<text x="352" y="104" text-anchor="end" class="fg-t sm">② 房間在哪</text>
<line x1="320" y1="188" x2="412" y2="188" class="fg-l alt"/><polygon points="420,188 412,183.5 412,192.5" class="fg-a alt"/>
<text x="366" y="180" text-anchor="middle" class="fg-t sm alt">③ 從 1202 補</text>
<line x1="190" y1="196" x2="126" y2="150" class="fg-l alt"/><polygon points="120,146 129.1,147.6 123.9,154.9" class="fg-a alt"/>
<text x="30" y="226" class="fg-t sm alt">④ 補送 1202–1205</text>
</svg><figcaption>玩家重連時帶著連線票和「最後收到 1201」。新的閘道查目錄找到房間，房間伺服器從記憶體裡最近的訊息補送 1202 以後的部分。玩家看到的只是畫面停了一兩秒。</figcaption></figure>
<ul>
<li><b>續傳</b>：房間伺服器為每間房保留最近幾百則訊息的環狀緩衝區。斷線太久、要補的已經被蓋掉，就改送一份完整的房間快照。</li>
<li><b>重連要打散</b>：用戶端用指數退避加全抖動（第 8.3 課），閘道剛啟動時節流新連線的速度。</li>
<li><b>房間伺服器掛掉</b>：每一回合結束時把房間狀態存一份快照。伺服器掛掉，目錄把房間指到另一台，從快照恢復；進行到一半的那一回合依公告的規則作廢，保留的點數由帳本退回。已經結束的回合，寄件匣保證一定會結算。</li>
<li><b>部署房間伺服器</b>：不能像無狀態服務那樣滾動重啟。做法是讓舊的伺服器不再接新房間，等現有房間在回合之間遷移或自然結束，再關機。</li>
<li><b>扇出與慢讀者</b>：一間房最多 50 人，一個事件最多推 50 則，不需要全域的訊息匯流排。閘道對每條連線的送出緩衝區設上限，網路差的玩家只會掉自己的訊息，不會吃光閘道的記憶體。</li>
</ul>

<h3><span class="badge lv3">專業</span>九、故障處理：每個方塊都問一次「它掛了會怎樣」</h3>
<table>
<tr><th>如果這個掛了</th><th>玩家看到什麼</th><th>點數會怎樣</th></tr>
<tr><td>一台閘道</td><td>畫面停一兩秒，自動重連到別台</td><td>不受影響</td></tr>
<tr><td>一台房間伺服器</td><td>房間換一台；進行中的回合作廢</td><td>保留的點數退回</td></tr>
<tr><td>帳本主庫</td><td>約一分鐘內不能開始新回合</td><td>同步備援升格，已提交的一筆不少</td></tr>
<tr><td>寄件匣工作者落後</td><td>結果先顯示，餘額晚幾秒更新</td><td>延遲，但不會遺失；看寄件匣年齡的警報</td></tr>
<tr><td>Redis</td><td>短暫重新登入、房間目錄重建</td><td>不受影響，點數本來就不在那裡</td></tr>
<tr><td>外部付款服務</td><td>購買暫時排隊，遊戲照玩</td><td>不受影響，回來後依冪等鍵補處理</td></tr>
<tr><td>一整個可用區</td><td>部分玩家重連一次</td><td>每區容量都能單獨撐尖峰（第 8.1 課）</td></tr>
</table>
<p>帳本在網路分區時選<b>一致性優先</b>（第 3.9 課的 CAP）：主庫如果無法讓同步備援確認，就拒絕寫入。玩家在那一分鐘不能開新回合，這是故意的：比起「多出一筆不該有的點數」，短暫不能玩的代價小得多。</p>

<h3><span class="badge lv4">專家</span>十、資安、可觀測性、成本與演進</h3>
<h4>資安：攻擊者會衝著什麼來</h4>
<ul>
<li><b>作弊</b>：用戶端只送「我的選擇」，結果永遠由伺服器決定。公平性用<b>先承諾、再揭露</b>（commit and reveal）：回合開始前先公布亂數種子的雜湊，回合結束後公布種子本身，任何人都能驗證伺服器沒有中途換牌。</li>
<li><b>機器人與腳本</b>：每個玩家、每個 IP 都有速率限制；行為分析找出反應時間異常一致的帳號。</li>
<li><b>盜帳號</b>：兌換獎品前要第二道驗證，新裝置登入要通知（第 5.3 課）。</li>
<li><b>內部濫用</b>：後台放在單一登入後面、要第二道驗證；人工調整點數要兩個人核准；每個後台動作寫進只能新增的稽核日誌。</li>
<li><b>外部介面</b>：付款 webhook 驗證簽章；兌換有單筆、每日、每帳號的硬上限；有一個能立刻暫停所有兌換的開關。</li>
</ul>
<h4>可觀測性：訂哪幾個 SLO</h4>
<ul>
<li>出手受理：99.9% 的出手在 200 ms 內收到「已受理」。</li>
<li>結算延遲：99.9% 的回合在結束後 2 秒內結算完成。</li>
<li>帳本不平衡：必須永遠是 0。這不是 SLO，是一有就叫人的警報。</li>
<li>另外看：寄件匣最舊一筆的年齡、每台閘道的連線數和重連率、每個房間伺服器的回合延遲。</li>
</ul>
<h4>成本與演進</h4>
<p>第 8.1 課估過，這個規模大約每月一萬五千美元上下，最大的幾項是資料庫和流量。至於「如果流量變成十倍」：閘道和房間伺服器加機器即可；帳本寫入到每秒兩萬筆，就照 <code>player_id</code> 分片，每個分片有自己的入場池子帳戶，跨分片的轉移（例如玩家之間贈送點數）用 Saga；需要跨國時，用第 8.2 課的「依玩家分家」。說出<b>下一步是什麼、什麼訊號出現才做</b>，比把十倍的架構先畫出來更有說服力。</p>

<h3><span class="badge lv4">專家</span>十一、面試官會追問的取捨，以及怎麼說</h3>
<table>
<tr><th>追問</th><th>強的回答方向</th></tr>
<tr><td>帳本為什麼用 PostgreSQL，不用 NoSQL？</td><td>需要多列的原子交易、條件式更新、唯一約束和強一致性；寫入量一台主庫扛得住。真的長大了，分片或分散式 SQL 都還在同一個模型裡。</td></tr>
<tr><td>為什麼用 WebSocket？</td><td>雙向、低延遲、每秒都有訊息。SSE 只能伺服器推；長輪詢在這個訊息量下浪費。代價是有狀態的連線，要處理重連和部署排空。</td></tr>
<tr><td>同步複寫拖慢寫入怎麼辦？</td><td>它增加的是每筆提交的延遲，不太影響總吞吐量（提交會合併）。真正的影響在熱點列，所以拆子帳戶。換來的是 RPO 為零，對點數值得。</td></tr>
<tr><td>你保證剛好一次嗎？</td><td>傳遞做不到剛好一次；我做的是至少一次的傳遞，加上冪等鍵，讓效果剛好一次。</td></tr>
<tr><td>房間伺服器有狀態，怎麼擴展？</td><td>房間是天然的分割單位，目錄記錄房間在哪台；擴展就是新房間開在新機器上；掛掉從快照恢復。</td></tr>
<tr><td>為什麼不一開始就微服務、多區域？</td><td>團隊和量都還不需要；每多一個元件就多一份維運。我會說出觸發它們的訊號。</td></tr>
</table>
<p>每一個取捨都可以套同一個句型：<b>「我選 X，因為 Y；代價是 Z；如果 W 改變，我會改成 V。」</b>四個空格都填得出來，面試官就知道你不是背答案。</p>
<h4>怎麼溝通</h4>
<ul>
<li><b>把想法說出來</b>，包括你放棄的選項。沉默五分鐘再畫出完美的圖，面試官什麼都打不了分。</li>
<li><b>先講路標</b>：「接下來我想深入帳本，因為它是唯一不能出錯的地方，你覺得可以嗎？」主動把方向交給面試官確認。</li>
<li><b>寫在白板上</b>：需求、數字、API、資料表。口頭說過的東西，十分鐘後誰都不記得。</li>
<li><b>不知道就說不知道</b>，然後說你會怎麼查、怎麼量。亂講一個數字被追問到底，比承認不知道傷得多。</li>
<li><b>不要丟名詞</b>：說「用 Kafka」之前，先說「這裡需要一個能重播的有序日誌，因為……」。工具是答案的結果，不是答案本身。</li>
</ul>
<h4>評分表：強的和弱的差在哪</h4>
<table>
<tr><th>面向</th><th>弱的回答</th><th>強的回答</th></tr>
<tr><td>需求</td><td>直接開始畫圖</td><td>問 3 到 5 個會改變設計的問題；非功能需求有數字；寫下範圍外</td></tr>
<tr><td>估算</td><td>跳過，或算到小數點</td><td>兩分鐘、取整數、算完說出結論</td></tr>
<tr><td>高階設計</td><td>堆滿流行元件，說不出為什麼</td><td>每個方塊都對應一個需求，順著一個請求講完</td></tr>
<tr><td>深入</td><td>停在方塊和箭頭</td><td>寫得出關鍵的 SQL、訊息格式、失敗時的行為，算得出熱點</td></tr>
<tr><td>取捨</td><td>「看情況」</td><td>選項、選擇、代價、什麼時候改變</td></tr>
<tr><td>故障與營運</td><td>只說「加備援」</td><td>逐個元件說掛了會怎樣；有 SLO、警報、對帳</td></tr>
<tr><td>溝通</td><td>自言自語或長時間沉默</td><td>帶著面試官走、主動確認方向、時間控制得好</td></tr>
</table>
<p>不同職級的期待也不同：初階工程師能畫出合理的高階設計、講清楚一個元件就很好；資深工程師要能主導整場、自己找出最難的部分深入、主動談故障和營運；更高的職級還要談團隊怎麼分工、怎麼分階段交付、怎麼控制成本和風險。</p>

<h3>十二、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>系統設計有標準答案</td><td>面試官打分的是推理過程。同一題，兩個完全不同的架構都可以拿高分，只要需求、取捨和代價說得清楚。</td></tr>
<tr><td>元件越多，看起來越厲害</td><td>每個元件都要有存在的理由。能說「這裡不需要快取，因為……」是加分。</td></tr>
<tr><td>深入就是講更多元件</td><td>深入是往下挖同一個元件：資料怎麼存、交易怎麼寫、失敗怎麼處理、熱點在哪。</td></tr>
<tr><td>用了分散式交易就能保證點數正確</td><td>實務上靠的是單一資料庫裡的原子交易、冪等鍵、寄件匣和對帳。跨系統的兩階段提交很少是好答案。</td></tr>
<tr><td>面試官打斷就代表答錯了</td><td>多半是想看某個方向的深度，或時間不夠了。順著他的問題走，那就是他想打分的地方。</td></tr>
</table>

<h3>十三、跟你的工作連起來</h3>
<ul>
<li><b>Cocos、Unity 的遊戲用戶端</b>：出手只送選擇、不送結果；每則訊息處理序號，重連時報上最後收到的序號；購買和兌換帶冪等鍵。這些是你在用戶端就能做對的部分。</li>
<li><b>Vue、TypeScript 的前端</b>：後台的每個敏感動作要二次確認，並顯示誰核准；餘額顯示要分「可用」和「保留中」，玩家才不會以為點數不見了。</li>
<li><b>Node.js、Go 的後端</b>：帳本那段 SQL、寄件匣工作者、斷線續傳的環狀緩衝區，都是一般後端工程師會親手寫的程式。先把它們寫對、寫好測試，再談擴展。</li>
<li><b>Docker 與雲端</b>：房間伺服器要有自己的部署策略（不接新房間、等回合結束），不能套用無狀態服務的滾動更新；帳本資料庫的備份要在另一個帳號、另一個區域（第 4.5 課）。</li>
</ul>

<h3>十四、面試會怎麼問</h3>
<ol>
<li>「如果同一個玩家同時在兩個房間出手，你怎麼確保他不會花掉超過自己擁有的點數？」</li>
<li>「結算工作者呼叫帳本成功了，但在標記寄件匣完成之前當掉。會發生什麼事？」</li>
<li>「你的帳本每秒 2,000 筆交易，資料庫 CPU 才 30%，延遲卻一直升高。可能是什麼？」</li>
<li>「玩家說他的點數不見了。你怎麼查？」</li>
<li>「怎麼讓玩家相信結果是公平的？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>用一個原子性的條件式更新扣玩家的可用帳戶：<code>UPDATE balances SET balance = balance - 10 WHERE account_id = $1 AND balance &gt;= 10</code>，同一筆交易裡再加到他的保留帳戶。兩筆同時到，資料庫的列鎖讓它們依序執行，第二筆在點數不足時影響 0 列而失敗。不需要應用程式自己的鎖，也不能先查再扣。</li>
<li>工作者重啟後會再讀到那一筆寄件匣，再呼叫一次帳本。帳本用冪等鍵（例如 <code>settle:回合:玩家</code>）在不分割的冪等表裡查到已經做過，直接回傳上次的結果，不會重複發獎勵。這是至少一次傳遞加冪等，效果剛好一次。</li>
<li>很可能是熱點列：每筆交易都更新同一個系統帳戶的餘額列，大家在等同一把列鎖，而同步複寫讓每次持鎖時間至少一趟跨可用區來回。看資料庫的鎖等待就能確認。解法是把系統帳戶拆成多個子帳戶依玩家雜湊分散，或系統帳戶只寫分錄、總額由背景加總。</li>
<li>先查他的分錄：依時間列出他帳戶的所有分錄，看可用和保留的變化。常見的情況是點數在「保留」裡（回合還沒結算，查寄件匣是否落後）、或是已經兌換。再跑對帳確認他的 balances 等於分錄加總。因為帳本只新增，每一點的來去都查得到，這正是複式帳本的價值。</li>
<li>結果由伺服器決定，並用先承諾再揭露：回合開始前公布亂數種子的雜湊，結束後公布種子，玩家可以自己重算雜湊與結果；種子要由安全的亂數產生器產生。再加上公開的規則、可查的回合歷史，以及操作稽核日誌。</li>
</ol>
</details>

<h3>十五、練功題（做得出來才算真的懂）</h3>
<ol>
<li>計時 45 分鐘，用上一課的八個步驟設計一個「多人即時排行榜」：全平台一千萬玩家，分數一直變，玩家要看自己的名次和前 100 名。寫完再用第十一節的評分表給自己打分。</li>
<li>入場池拆成 16 個子帳戶後，如果每次提交要 1.5 ms 握著列鎖，每個子帳戶每秒最多幾筆？尖峰每秒約 1,050 次結算夠不夠？要撐十倍呢？</li>
<li>寫出「結算」的 SQL：釋放保留的 10 點，猜對的話從獎勵帳戶轉 20 點給玩家，要冪等。</li>
<li>錄下自己講高階設計的五分鐘，回放時數一數：你說了幾次「因為」？說了幾次「代價是」？</li>
<li>把題目改成「點數可以在玩家之間互相贈送」，帳本的設計要改哪裡？會出現什麼新的風險？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>參考重點：讀多寫多，用 Redis 的有序集合存分數，<code>ZADD</code> 更新、<code>ZREVRANK</code> 查名次、<code>ZREVRANGE</code> 取前 100；一千萬個成員的有序集合大約 1 GB 上下，一台放得下；前 100 名快取一兩秒；分數的真相來源還是資料庫，Redis 掛了可以重建；寫入量太大時，先在應用程式裡合併同一玩家的連續更新。評分時檢查自己有沒有問「名次要多即時」。</li>
<li>1 ÷ 0.0015 ≈ 每秒 660 筆，16 個子帳戶約 10,600 筆，1,050 次綽綽有餘。十倍是 10,500 次，剛好貼著上限、沒有餘裕，要拆成 32 個以上；而且帳本總共每秒兩萬多筆交易，整台資料庫也到了該考慮分片的時候。</li>
<li>在同一筆交易裡：先 <code>INSERT INTO ledger_txns (txn_key, txn_id) VALUES ('settle:r_8812:p_77', $t) ON CONFLICT DO NOTHING</code>，沒插入任何列就直接回傳上次的結果；<code>UPDATE balances SET balance = balance - 10 WHERE account_id = $held AND balance &gt;= 10</code>；入場池的子帳戶 +10；猜對時，獎勵的子帳戶 −20、玩家的可用帳戶 +20。分錄寫四列：保留 −10、入場池 +10、獎勵 −20、可用 +20，加總為 0。</li>
<li>依自己的錄音回答。好的五分鐘裡，每個方塊至少有一個「因為」，至少有兩三個「代價是」。</li>
<li>玩家對玩家的轉帳是兩個玩家帳戶之間的分錄，要照帳戶編號順序鎖，避免死結（第 3.2 課）；分片之後會變成跨分片轉帳，要用 Saga。新風險是洗點數和詐騙：要有每日轉出上限、新帳號冷卻期、異常轉帳偵測，以及申訴與凍結流程。</li>
</ol>
</details>

<h3>十六、想再挖深</h3>
<ul>
<li><b>Alex Xu《System Design Interview – An Insider's Guide》第一、二冊</b>：每章一題完整的設計，第一冊第 3 章是面試的四步驟框架，可以拿來跟這一章互相印證。</li>
<li><b>Martin Kleppmann《Designing Data-Intensive Applications》</b>：交易、複寫、分割、一致性、串流處理，系統設計所有深入問題的理論底子。</li>
<li><b>The System Design Primer</b>（GitHub 上的 donnemartin/system-design-primer）：免費、大量題目與參考答案，適合天天練。</li>
<li><b>Stripe 工程部落格〈Designing robust and predictable APIs with idempotency〉</b>：冪等鍵在真實付款系統裡怎麼設計，正好對應這一章的帳本。</li>
</ul>
` });
