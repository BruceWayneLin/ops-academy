DEEP({ 'dist-sys': `
<p>上一課用一頁講完分散式系統的結論：網路會斷、機器會掛、時鐘不準；CAP 要你在斷線時二選一；「剛好一次」要靠冪等。這一章把每一個結論背後的機制拆開：逾時為什麼一定是猜、一致性到底有幾種、Raft 怎麼一步一步選出領導者並複製資料、R + W &gt; N 為什麼成立、時鐘不能信那要信什麼、跨服務的交易怎麼收尾、分散式鎖為什麼一定要配號碼。這些是資深後端和 DevOps 面試最愛問、也是線上最難查的那一類問題。</p>

<h3><span class="badge lv1">基礎</span>一、多一台機器，世界就變了：分散式運算的八個謬誤</h3>
<p>想像你跟朋友只能用寄信約吃飯。信可能寄丟、可能晚三天才到、可能同一封到兩次；你沒收到回信，也不知道是他沒收到、還是他回了但回信丟了、還是他生病了。一台機器裡的函式呼叫從來不會有這些問題，可是兩台機器之間，每一次呼叫都是在寄信。</p>
<p>1990 年代，昇陽（Sun）的工程師整理出新手最常默默相信、卻一定會出事的八個假設，叫做<b>分散式運算的謬誤</b>（fallacies of distributed computing）：</p>
<table>
<tr><th>謬誤</th><th>現實</th><th>寫程式時的對策</th></tr>
<tr><td>網路是可靠的</td><td>封包會丟、連線會斷、交換器會重開</td><td>每個呼叫都要有逾時和重試</td></tr>
<tr><td>延遲是零</td><td>同機房約 0.5 ms，跨洲 100 ms 以上</td><td>不要在迴圈裡一次一次呼叫遠端，改成批次</td></tr>
<tr><td>頻寬無限</td><td>一次撈十萬筆資料會塞爆連線</td><td>分頁、壓縮、只傳需要的欄位</td></tr>
<tr><td>網路是安全的</td><td>內網也可能被入侵、被竊聽</td><td>服務之間也要加密、互相驗證</td></tr>
<tr><td>拓撲不會變</td><td>容器每次重啟 IP 都不同</td><td>用 DNS 或服務發現，不寫死 IP</td></tr>
<tr><td>只有一個管理者</td><td>雲端業者、別的團隊、防火牆規則各管一塊</td><td>出事時要能看到每一段的狀態</td></tr>
<tr><td>傳輸成本是零</td><td>序列化要花 CPU，跨可用區流量要收錢</td><td>選對格式，注意資料流向</td></tr>
<tr><td>網路是同質的</td><td>不同語言、版本、協定混在一起</td><td>介面要有版本、要向下相容</td></tr>
</table>
<p>這八條不用背，但每次設計跨機器的功能時，拿出來一條一條問自己：「如果這條不成立，我的程式會怎樣？」</p>

<h3><span class="badge lv1">基礎</span>二、慢和死分不出來：故障偵測與逾時</h3>
<p>分散式系統最根本的難題只有一句話：<b>你等不到回覆的時候，不知道發生了什麼事</b>。</p>
<figure class="figure"><svg viewBox="0 0 660 252" class="fg" style="width:100%;max-width:660px" role="img" aria-label="三種情況：請求丟了、B 當機、B 做完但回覆丟了或太慢。對 A 來說三種都一樣，只是等不到回覆">
<rect x="20" y="24" width="90" height="52" rx="6" class="fg-b alt"/><text x="65" y="55" text-anchor="middle" class="fg-t lg">A</text>
<rect x="330" y="24" width="110" height="52" rx="6" class="fg-b"/><text x="385" y="55" text-anchor="middle" class="fg-t">B 沒收到</text>
<text x="220" y="38" text-anchor="middle" class="fg-t sm warm">情況一：請求丟了</text>
<line x1="110" y1="52" x2="204" y2="52" class="fg-l warm"/>
<line x1="208" y1="45" x2="222" y2="59" class="fg-l warm"/><line x1="208" y1="59" x2="222" y2="45" class="fg-l warm"/>
<rect x="20" y="104" width="90" height="52" rx="6" class="fg-b alt"/><text x="65" y="135" text-anchor="middle" class="fg-t lg">A</text>
<rect x="330" y="104" width="110" height="52" rx="6" class="fg-b warm"/><text x="385" y="135" text-anchor="middle" class="fg-t">B 當機</text>
<text x="220" y="118" text-anchor="middle" class="fg-t sm warm">情況二：B 掛了</text>
<line x1="110" y1="132" x2="322" y2="132" class="fg-l"/><polygon points="330,132 322,127.5 322,136.5" class="fg-a"/>
<rect x="20" y="184" width="90" height="52" rx="6" class="fg-b alt"/><text x="65" y="215" text-anchor="middle" class="fg-t lg">A</text>
<rect x="330" y="184" width="110" height="52" rx="6" class="fg-b hot"/><text x="385" y="215" text-anchor="middle" class="fg-t acc">B 做完了</text>
<text x="220" y="192" text-anchor="middle" class="fg-t sm warm">情況三：回覆丟了或太慢</text>
<line x1="110" y1="202" x2="322" y2="202" class="fg-l"/><polygon points="330,202 322,197.5 322,206.5" class="fg-a"/>
<line x1="330" y1="224" x2="236" y2="224" class="fg-l alt"/>
<line x1="216" y1="217" x2="230" y2="231" class="fg-l warm"/><line x1="216" y1="231" x2="230" y2="217" class="fg-l warm"/>
<line x1="440" y1="50" x2="470" y2="50" class="fg-l dim dash"/><line x1="440" y1="130" x2="470" y2="130" class="fg-l dim dash"/><line x1="440" y1="210" x2="470" y2="210" class="fg-l dim dash"/>
<rect x="470" y="24" width="170" height="212" rx="8" class="fg-b warm"/>
<text x="555" y="100" text-anchor="middle" class="fg-t lg">A 看到的</text>
<text x="555" y="128" text-anchor="middle" class="fg-t sm">三種情況完全一樣：</text>
<text x="555" y="150" text-anchor="middle" class="fg-t sm">等到逾時，</text>
<text x="555" y="172" text-anchor="middle" class="fg-t sm">不知道 B 做了沒</text>
</svg><figcaption>情況三最危險：B 其實已經扣款或寫入了，A 卻以為失敗而重試，於是做了兩次。這就是為什麼重試一定要搭配冪等。</figcaption></figure>
<h4>逾時要設多長</h4>
<p>逾時太短，正常但稍慢的請求被當成失敗，重試又加重負擔；太長，執行緒和連線全卡在等一個早就死掉的對象，整個服務跟著被拖垮。實務做法是看依賴對象的延遲分布：假設下游的 p99 是 80 ms、p99.9 是 250 ms，逾時設 300 ms 左右，代表「比千分之一最慢的還慢，就當它出事了」。</p>
<h4>重試會放大災難</h4>
<p>算一次：API 呼叫服務、服務呼叫資料庫，三層各自「失敗就再試兩次」（最多 3 次）。資料庫一變慢，最底層看到的請求最多會變成 3 × 3 × 3 = 27 倍，本來只是變慢，被重試活活打死。對策有四個：</p>
<ul>
<li><b>只在一層重試</b>，通常是最靠近使用者的那一層。</li>
<li><b>指數退避加隨機抖動</b>（exponential backoff with jitter）：等 100 ms、200 ms、400 ms，每次再乘一個隨機數，避免所有人在同一瞬間一起重試。</li>
<li><b>重試預算</b>：重試量最多佔正常流量的一成，超過就直接失敗。</li>
<li><b>把剩下的時間往下傳</b>：使用者只願意等 2 秒，第一層用掉 1.5 秒，下一層就只剩 0.5 秒，不要每層都重新等滿。gRPC 的 deadline 就是這樣傳的。</li>
</ul>
<h4>心跳與誤判</h4>
<p>叢集判斷節點死活，通常靠<b>心跳</b>（heartbeat）：每秒送一次「我還活著」，連續 5 秒沒收到就宣告死亡。問題是，一個 Java 行程做一次完整的垃圾回收可能停住好幾秒，虛擬機器也可能被暫停。它沒死，只是暫時不動，卻被宣告死亡、工作被別人接手，醒來後還以為自己在負責。這就是腦裂的起點，第十節的圍欄權杖就是為它準備的。Cassandra 用的 phi 累積故障偵測（phi accrual failure detector）不給「死／活」二選一，而是依心跳間隔的歷史分布，算出一個「有多可疑」的分數。</p>

<h3><span class="badge lv2">進階</span>三、CAP 與 PACELC：用實例講清楚</h3>
<p>CAP 常被說成「一致性、可用性、分區容忍，三個選兩個」。這個說法會誤導：網路分區不是你能選擇要不要的，它一定會發生。正確的講法是：<b>發生網路分區的時候</b>，你只能在一致性（C）和可用性（A）之間選一個。這裡的 C 有嚴格定義，指的是第四節的「線性一致」；A 指的是「每個還活著的節點收到請求，都要回應」。</p>
<p>拿猜高低遊戲來說。三台資料庫節點，網路把一台切到另一邊。玩家剛好連到孤單的那一台，要扣 100 點開一局：</p>
<ul>
<li><b>選 C</b>：孤單那台湊不到過半數，拒絕寫入，玩家看到「請稍後再試」。點數絕對不會算錯。</li>
<li><b>選 A</b>：孤單那台照收，等網路恢復再跟另一邊合併。玩家順利開局，但同一筆點數可能在兩邊各被花一次，事後要對帳。</li>
</ul>
<p>點數選 C，線上人數、排行榜選 A。同一個產品裡，不同的資料要做不同的選擇。</p>
<h4>PACELC：沒斷線的時候也要選</h4>
<p>CAP 只講斷線時，但系統大部分時間都沒斷線。Daniel Abadi 提出的 <b>PACELC</b> 補上後半句：如果有分區（P），在 A 和 C 之間選；否則（E，else），在<b>延遲</b>（L）和<b>一致性</b>（C）之間選。因為要強一致，每次寫入都得等其他節點確認，正常情況下也比較慢。</p>
<table>
<tr><th>系統</th><th>分類</th><th>白話</th></tr>
<tr><td>etcd、ZooKeeper、Spanner</td><td>PC／EC</td><td>斷線時少數那邊停擺；平常每次寫入都等過半數確認</td></tr>
<tr><td>Cassandra（一致性等級設 ONE）</td><td>PA／EL</td><td>斷線照收；平常一台回應就算數，最快但可能讀到舊的</td></tr>
<tr><td>DynamoDB</td><td>平常可選</td><td>預設最終一致讀取；選強一致讀取，延遲較高、費用是兩倍</td></tr>
<tr><td>PostgreSQL 主庫＋非同步副本</td><td>讀副本時是 EL</td><td>讀副本很快，但可能落後主庫幾毫秒到幾秒</td></tr>
</table>

<h3><span class="badge lv2">進階</span>四、一致性模型：從最嚴到最鬆</h3>
<p>「一致」不是一個開關，而是一整排承諾，越嚴越貴。先看最嚴的線性一致，跟它差一點的循序一致，用同一段歷史比較：</p>
<figure class="figure"><svg viewBox="0 0 660 236" class="fg" style="width:100%;max-width:660px" role="img" aria-label="三個用戶端的時間軸：A 寫入 x 等於 1 完成後，B 讀到 1，之後 C 卻讀到 0。線性一致不允許，循序一致與最終一致允許">
<text x="110" y="20" class="fg-t sm">一開始 x = 0</text><text x="640" y="20" text-anchor="end" class="fg-t sm">時間 →</text>
<text x="20" y="58" class="fg-t">用戶端 A</text><text x="20" y="118" class="fg-t">用戶端 B</text><text x="20" y="178" class="fg-t">用戶端 C</text>
<line x1="110" y1="54" x2="640" y2="54" class="fg-l dim"/><line x1="110" y1="114" x2="640" y2="114" class="fg-l dim"/><line x1="110" y1="174" x2="640" y2="174" class="fg-l dim"/>
<rect x="130" y="38" width="170" height="32" rx="5" class="fg-b hot"/><text x="215" y="59" text-anchor="middle" class="fg-t acc">寫入 x = 1</text>
<rect x="330" y="98" width="110" height="32" rx="5" class="fg-b alt"/><text x="385" y="119" text-anchor="middle" class="fg-t">讀到 1</text>
<rect x="470" y="158" width="130" height="32" rx="5" class="fg-b warm"/><text x="535" y="179" text-anchor="middle" class="fg-t">讀到 0</text>
<line x1="300" y1="30" x2="300" y2="196" class="fg-l dim dash"/><line x1="440" y1="30" x2="440" y2="196" class="fg-l dim dash"/>
<text x="300" y="210" text-anchor="middle" class="fg-t sm">A 寫完</text><text x="440" y="210" text-anchor="middle" class="fg-t sm">B 讀完</text>
<text x="330" y="230" text-anchor="middle" class="fg-t sm warm">線性一致：C 不可以讀到 0　　循序一致、最終一致：可以</text>
</svg><figcaption>每個長條是一次操作，從送出到收到回覆。C 開始讀的時候，B 已經讀到新值了，C 卻讀到舊值：這在真實時間上「倒退」了。</figcaption></figure>
<ul>
<li><b>線性一致</b>（linearizable）：每個操作都像在「送出到回覆之間的某一瞬間」原子地生效，而且尊重真實時間。只要有人讀到新值，之後開始的每一次讀都必須是新值。所以圖中 C 違規。</li>
<li><b>循序一致</b>（sequential consistency）：大家看到同一個全域順序，每個用戶端自己的操作順序不亂，但不保證跟真實時間一致。把順序排成「C 讀 0 → A 寫 1 → B 讀 1」就說得通，所以合法。</li>
<li><b>因果一致</b>（causal consistency）：有因果關係的事，大家看到的先後都一樣；沒關係的可以不同。例如回覆一定出現在原留言之後，但兩則無關的留言，各人看到的順序可以不同。</li>
<li><b>讀到自己寫的</b>（read-your-writes）與<b>單調讀</b>（monotonic reads）：只對單一使用者承諾。改完暱稱重新整理一定看得到；不會先看到新的、再看到舊的。</li>
<li><b>最終一致</b>（eventual consistency）：只承諾「寫入停下來之後，遲早會一樣」。DNS、CDN、按讚數都是。</li>
</ul>
<p>最常踩的坑是讀寫分離：寫主庫、讀副本。玩家改了暱稱，下一個請求剛好讀到落後 2 秒的副本，畫面顯示舊名字，他以為沒存到又改一次。修法是讓「剛寫過的使用者」在幾秒內都讀主庫，或在回應裡帶一個版本號，讀副本時確認副本已經追到這個版本。</p>

<h3><span class="badge lv3">專業</span>五、Raft 怎麼選出領導者</h3>
<p>共識（consensus）要解決的是：一群會當機、網路會斷的機器，怎麼對「一串變更的順序」取得一致。Raft 的做法是先選出一個<b>領導者</b>（leader），所有寫入都由它決定順序，其他人照抄。每個節點在任何時刻只有三種身分：</p>
<figure class="figure"><svg viewBox="0 30 660 210" class="fg" style="width:100%;max-width:660px" role="img" aria-label="Raft 的三種狀態：跟隨者選舉逾時變成候選者，拿到過半數選票變成領導者，看到更高任期就退回跟隨者">
<rect x="30" y="92" width="140" height="60" rx="8" class="fg-b"/><text x="100" y="117" text-anchor="middle" class="fg-t lg">跟隨者</text><text x="100" y="138" text-anchor="middle" class="fg-t sm">聽領導者的</text>
<rect x="260" y="92" width="140" height="60" rx="8" class="fg-b alt"/><text x="330" y="117" text-anchor="middle" class="fg-t lg">候選者</text><text x="330" y="138" text-anchor="middle" class="fg-t sm">向大家要票</text>
<rect x="490" y="92" width="140" height="60" rx="8" class="fg-b hot"/><text x="560" y="117" text-anchor="middle" class="fg-t lg">領導者</text><text x="560" y="138" text-anchor="middle" class="fg-t sm">收寫入、發心跳</text>
<line x1="170" y1="108" x2="252" y2="108" class="fg-l alt"/><polygon points="260,108 252,103.5 252,112.5" class="fg-a alt"/>
<text x="215" y="98" text-anchor="middle" class="fg-t sm alt">選舉逾時</text>
<line x1="400" y1="108" x2="482" y2="108" class="fg-l on"/><polygon points="490,108 482,103.5 482,112.5" class="fg-a on"/>
<text x="445" y="98" text-anchor="middle" class="fg-t sm acc">過半數票</text>
<line x1="260" y1="138" x2="178" y2="138" class="fg-l"/><polygon points="170,138 178,133.5 178,142.5" class="fg-a"/>
<text x="215" y="160" text-anchor="middle" class="fg-t sm">有人當選</text>
<path d="M300 92 V62 H360 V84" class="fg-l alt"/><polygon points="360,92 355.5,84 364.5,84" class="fg-a alt"/>
<text x="330" y="52" text-anchor="middle" class="fg-t sm alt">平手：任期再加一，重選</text>
<path d="M560 152 V206 H100 V160" class="fg-l warm"/><polygon points="100,152 95.5,160 104.5,160" class="fg-a warm"/>
<text x="330" y="226" text-anchor="middle" class="fg-t sm warm">看到更高的任期：立刻退回跟隨者</text>
</svg><figcaption>所有人一開始都是跟隨者。誰先等不到心跳，誰就先出來選；任期（term）只增不減，看到比自己大的任期，任何人都要立刻讓位。</figcaption></figure>
<ol>
<li><b>等心跳</b>：領導者定期送心跳。每個跟隨者有一個<b>選舉逾時</b>，在一個範圍內隨機（論文建議 150 到 300 ms；etcd 預設心跳 100 ms、選舉逾時 1 秒）。隨機是為了讓大家不要同時跳出來選。</li>
<li><b>出來選</b>：逾時沒收到心跳的節點把<b>任期</b>（term）加一，變成候選者，投自己一票，再向所有人發「投我」的請求。</li>
<li><b>投票規則</b>：每個節點在每個任期只投一票，先到先得；而且只投給「日誌至少跟我一樣新」的候選者（先比最後一筆的任期，再比長度）。</li>
<li><b>當選</b>：拿到過半數就成為領導者，立刻發心跳宣告。五台裡拿到三票就夠，所以掛兩台還選得出來。</li>
<li><b>平手</b>：兩個候選者各拿兩票，沒人過半。大家等下一個隨機逾時，任期再加一重選，通常一兩輪就分出勝負。</li>
</ol>
<p>第 3 條是整個演算法的安全關鍵：已經提交的資料一定存在過半數節點上，而任何候選者要當選也要過半數投票，兩個過半數一定有交集，交集裡那台不會投給日誌比自己舊的人。所以<b>新領導者一定擁有所有已提交的資料</b>。</p>

<h3><span class="badge lv3">專業</span>六、Raft 怎麼複製一筆寫入</h3>
<p>五台叢集，S1 是任期 3 的領導者。用戶端送來 <code>SET x=5</code>：</p>
<figure class="figure"><svg viewBox="0 0 660 252" class="fg" style="width:100%;max-width:660px" role="img" aria-label="五個節點的日誌：索引 7 的新寫入已經存在 S1、S2、S3 三台，過半數，所以提交；S4 落後正在補送，S5 當機">
<text x="20" y="26" class="fg-t sm">索引</text>
<text x="158" y="26" text-anchor="middle" class="fg-t sm">1</text><text x="218" y="26" text-anchor="middle" class="fg-t sm">2</text><text x="278" y="26" text-anchor="middle" class="fg-t sm">3</text><text x="338" y="26" text-anchor="middle" class="fg-t sm">4</text><text x="398" y="26" text-anchor="middle" class="fg-t sm">5</text><text x="458" y="26" text-anchor="middle" class="fg-t sm">6</text><text x="518" y="26" text-anchor="middle" class="fg-t sm">7</text>
<text x="20" y="61" class="fg-t acc">S1 領導者</text>
<rect x="130" y="40" width="56" height="32" rx="4" class="fg-b"/><text x="158" y="61" text-anchor="middle" class="fg-t">1</text><rect x="190" y="40" width="56" height="32" rx="4" class="fg-b"/><text x="218" y="61" text-anchor="middle" class="fg-t">1</text><rect x="250" y="40" width="56" height="32" rx="4" class="fg-b"/><text x="278" y="61" text-anchor="middle" class="fg-t">2</text><rect x="310" y="40" width="56" height="32" rx="4" class="fg-b"/><text x="338" y="61" text-anchor="middle" class="fg-t">2</text><rect x="370" y="40" width="56" height="32" rx="4" class="fg-b"/><text x="398" y="61" text-anchor="middle" class="fg-t">3</text><rect x="430" y="40" width="56" height="32" rx="4" class="fg-b"/><text x="458" y="61" text-anchor="middle" class="fg-t">3</text><rect x="490" y="40" width="56" height="32" rx="4" class="fg-b hot"/><text x="518" y="61" text-anchor="middle" class="fg-t acc">3</text>
<text x="20" y="101" class="fg-t">S2</text>
<rect x="130" y="80" width="56" height="32" rx="4" class="fg-b"/><text x="158" y="101" text-anchor="middle" class="fg-t">1</text><rect x="190" y="80" width="56" height="32" rx="4" class="fg-b"/><text x="218" y="101" text-anchor="middle" class="fg-t">1</text><rect x="250" y="80" width="56" height="32" rx="4" class="fg-b"/><text x="278" y="101" text-anchor="middle" class="fg-t">2</text><rect x="310" y="80" width="56" height="32" rx="4" class="fg-b"/><text x="338" y="101" text-anchor="middle" class="fg-t">2</text><rect x="370" y="80" width="56" height="32" rx="4" class="fg-b"/><text x="398" y="101" text-anchor="middle" class="fg-t">3</text><rect x="430" y="80" width="56" height="32" rx="4" class="fg-b"/><text x="458" y="101" text-anchor="middle" class="fg-t">3</text><rect x="490" y="80" width="56" height="32" rx="4" class="fg-b hot"/><text x="518" y="101" text-anchor="middle" class="fg-t acc">3</text>
<text x="20" y="141" class="fg-t">S3</text>
<rect x="130" y="120" width="56" height="32" rx="4" class="fg-b"/><text x="158" y="141" text-anchor="middle" class="fg-t">1</text><rect x="190" y="120" width="56" height="32" rx="4" class="fg-b"/><text x="218" y="141" text-anchor="middle" class="fg-t">1</text><rect x="250" y="120" width="56" height="32" rx="4" class="fg-b"/><text x="278" y="141" text-anchor="middle" class="fg-t">2</text><rect x="310" y="120" width="56" height="32" rx="4" class="fg-b"/><text x="338" y="141" text-anchor="middle" class="fg-t">2</text><rect x="370" y="120" width="56" height="32" rx="4" class="fg-b"/><text x="398" y="141" text-anchor="middle" class="fg-t">3</text><rect x="430" y="120" width="56" height="32" rx="4" class="fg-b"/><text x="458" y="141" text-anchor="middle" class="fg-t">3</text><rect x="490" y="120" width="56" height="32" rx="4" class="fg-b hot"/><text x="518" y="141" text-anchor="middle" class="fg-t acc">3</text>
<text x="20" y="181" class="fg-t">S4</text>
<rect x="130" y="160" width="56" height="32" rx="4" class="fg-b"/><text x="158" y="181" text-anchor="middle" class="fg-t">1</text><rect x="190" y="160" width="56" height="32" rx="4" class="fg-b"/><text x="218" y="181" text-anchor="middle" class="fg-t">1</text><rect x="250" y="160" width="56" height="32" rx="4" class="fg-b"/><text x="278" y="181" text-anchor="middle" class="fg-t">2</text><rect x="310" y="160" width="56" height="32" rx="4" class="fg-b"/><text x="338" y="181" text-anchor="middle" class="fg-t">2</text><rect x="370" y="160" width="56" height="32" rx="4" class="fg-b"/><text x="398" y="181" text-anchor="middle" class="fg-t">3</text>
<text x="488" y="181" text-anchor="middle" class="fg-t sm warm">缺 6、7：補送中</text>
<text x="20" y="221" class="fg-t warm">S5 當機</text>
<rect x="130" y="200" width="56" height="32" rx="4" class="fg-b"/><text x="158" y="221" text-anchor="middle" class="fg-t">1</text><rect x="190" y="200" width="56" height="32" rx="4" class="fg-b"/><text x="218" y="221" text-anchor="middle" class="fg-t">1</text><rect x="250" y="200" width="56" height="32" rx="4" class="fg-b"/><text x="278" y="221" text-anchor="middle" class="fg-t">2</text><rect x="310" y="200" width="56" height="32" rx="4" class="fg-b"/><text x="338" y="221" text-anchor="middle" class="fg-t">2</text><rect x="370" y="200" width="56" height="32" rx="4" class="fg-b"/><text x="398" y="221" text-anchor="middle" class="fg-t">3</text><rect x="430" y="200" width="56" height="32" rx="4" class="fg-b"/><text x="458" y="221" text-anchor="middle" class="fg-t">3</text>
<path d="M556 44 H564 V148 H556" class="fg-l on"/>
<text x="574" y="88" class="fg-t lg acc">3／5</text><text x="574" y="108" class="fg-t sm acc">過半數</text><text x="574" y="126" class="fg-t sm acc">→ 提交</text>
</svg><figcaption>每一格是一筆日誌，格子裡的數字是寫入它時的任期。索引 7 就是 <code>SET x=5</code>：它已經存在三台上，五台的過半數到了，就算 S4、S5 還沒有，也可以提交。</figcaption></figure>
<ol>
<li>S1 把這筆寫入接在自己日誌的索引 7，任期記 3。這時還<b>沒提交</b>，不能回覆用戶端。</li>
<li>S1 對每個跟隨者送 AppendEntries：「我是任期 3 的領導者；你在索引 6 的那筆，任期應該是 3；請接上這一筆；目前已提交到索引 6。」</li>
<li>S2、S3 檢查自己的索引 6 確實是任期 3，接上、回覆成功。S4 只有到索引 5，檢查失敗、回覆拒絕；S1 就往前退一格，改從索引 6 開始補送，直到對上為止。S5 當機沒回應，S1 會一直重送。</li>
<li>S1 數一數：自己加上 S2、S3，三台有這筆，五台過半數，<b>提交</b>。S1 把 <code>x=5</code> 套用到自己的狀態機，然後才回覆用戶端「成功」。</li>
<li>下一次心跳帶著「已提交到索引 7」，跟隨者看到後，各自也把它套用上去。</li>
</ol>
<h4>出事的時候</h4>
<ul>
<li><b>S1 在第 4 步之前就掛了</b>：如果這筆已經在三台上，新領導者一定是這三台之一（投票規則），寫入不會丟；但用戶端沒收到回覆，會重試，所以寫入本身要能去重（第九節）。如果只在 S1 自己身上，新領導者沒有這筆，之後會把它蓋掉；用戶端沒收到成功，一樣重試。</li>
<li><b>跟隨者有多出來、不一樣的日誌</b>：那是舊領導者沒提交成功的殘渣，新領導者會用自己的日誌把它蓋掉。只有「沒提交過」的東西會被蓋，所以不違反承諾。</li>
<li><b>讀取也要小心</b>：直接讀某個跟隨者的資料可能是舊的；就連領導者也可能是剛被網路隔開、還不知道自己已經下台的舊領導者。要線性一致的讀，領導者得先跟過半數確認自己還是領導者（ReadIndex），或依賴時鐘的租約。etcd 預設的讀取是線性一致的，你可以選擇比較快、但可能舊一點的 serializable 讀取。</li>
</ul>

<h3><span class="badge lv3">專業</span>七、法定數量：R + W &gt; N 為什麼成立</h3>
<p>Raft 是「一個領導者排順序」。另一派系統（Dynamo 風格，例如 Cassandra）沒有領導者，每筆資料存 N 份，寫的時候等 W 份確認，讀的時候問 R 份。只要 <b>R + W &gt; N</b>，讀的那幾台和寫的那幾台一定至少重疊一台，所以讀得到最新的寫入。</p>
<figure class="figure"><svg viewBox="0 0 600 234" class="fg" style="width:100%;max-width:600px" role="img" aria-label="三份副本，寫入 A 與 B，讀取 B 與 C，B 是交集，所以讀得到最新版本">
<path d="M70 82 V58 H350 V82" class="fg-l on"/><text x="210" y="48" text-anchor="middle" class="fg-t acc">寫入 W = 2：版本 7</text>
<rect x="60" y="88" width="120" height="60" rx="8" class="fg-b"/><text x="120" y="114" text-anchor="middle" class="fg-t lg">A</text><text x="120" y="135" text-anchor="middle" class="fg-t sm">版本 7</text>
<rect x="240" y="88" width="120" height="60" rx="8" class="fg-b hot"/><text x="300" y="114" text-anchor="middle" class="fg-t lg acc">B</text><text x="300" y="135" text-anchor="middle" class="fg-t sm">版本 7</text>
<rect x="420" y="88" width="120" height="60" rx="8" class="fg-b warm"/><text x="480" y="114" text-anchor="middle" class="fg-t lg">C</text><text x="480" y="135" text-anchor="middle" class="fg-t sm">還是版本 6</text>
<path d="M250 154 V178 H530 V154" class="fg-l alt"/><text x="390" y="196" text-anchor="middle" class="fg-t alt">讀取 R = 2：拿到 7 和 6</text>
<text x="300" y="226" text-anchor="middle" class="fg-t sm">2 ＋ 2 ＞ 3：讀和寫一定碰到同一台，取版本大的那個</text>
</svg><figcaption>N = 3。寫入只等到兩台確認就回成功，C 還沒追上。讀取問兩台，不管問哪兩台，至少有一台有版本 7。</figcaption></figure>
<table>
<tr><th>N = 3 的設定</th><th>特性</th></tr>
<tr><td>W = 2、R = 2</td><td>最常見的平衡點；讀寫都能容忍一台掛掉</td></tr>
<tr><td>W = 3、R = 1</td><td>讀最快；但任何一台掛掉就寫不進去</td></tr>
<tr><td>W = 1、R = 1</td><td>最快；不保證讀到最新，等於最終一致</td></tr>
</table>
<p>要注意三件事。第一，R + W &gt; N 只保證「碰得到」，不代表線性一致：兩個寫入同時發生、讀取途中有節點正在補資料，都會出現怪結果。第二，有些系統在節點掛掉時，會把寫入暫時寫到「名單外」的節點（sloppy quorum，事後再轉交），這時重疊就不成立了。第三，同時有兩個寫入時要決定誰贏，很多系統用「時間戳記大的贏」（last-write-wins），這就把問題丟給了時鐘，而時鐘是下一節的主角。</p>
<p>共識叢集也是同一個道理：N = 2f + 1 台可以容忍 f 台故障。4 台跟 3 台一樣只能掛 1 台（4 台的過半數是 3），卻多了一台要等，所以都用奇數。部署時，三台要分散在三個可用區；如果只有兩個可用區，放兩台的那一區一掛，剩下那一台永遠湊不到過半數。</p>

<h3><span class="badge lv4">專家</span>八、時鐘：不能信牆上的時間，那要信什麼</h3>
<h4>物理時鐘有多不準</h4>
<p>伺服器的時間來自石英振盪器，誤差常見是幾十 ppm（百萬分之幾十）。20 ppm 聽起來很小，一天就是 86,400 × 0.00002 ≈ 1.7 秒。NTP 會定期校正，在一般網路上通常能把誤差壓在幾毫秒內，但校正可能讓時間<b>往回跳</b>，虛擬機器暫停後恢復，時間也可能突然往前跳。</p>
<p>真實的事故長這樣：玩家連續改了兩次暱稱。第一次由伺服器 P 處理，P 的時鐘快了 300 ms，蓋上 10:00:00.400；第二次 150 ms 後由準確的伺服器 Q 處理，蓋上 10:00:00.250。資料庫用「時間戳記大的贏」，結果留下的是<b>第一次</b>的舊暱稱，第二次的修改無聲無息消失。</p>
<div class="note"><b>量經過時間，用單調時鐘。</b>算「花了多久」時，用 <code>performance.now()</code>、Node.js 的 <code>process.hrtime.bigint()</code>，或 Go 的 <code>time.Since</code>（Go 的 <code>time.Now()</code> 內含單調時鐘讀數）。牆上時間被 NTP 往回調時，用它算出來的經過時間可能是負的。</div>
<h4>邏輯時鐘：只記先後，不記幾點</h4>
<p>很多時候我們不需要知道「幾點」，只需要知道「誰先誰後」。Leslie Lamport 的<b>邏輯時鐘</b>（Lamport clock）規則只有三條：每個行程有一個計數器；每發生一件事就加一；送訊息時附上計數器，收到的人把自己的計數器設成「兩者取大，再加一」。</p>
<figure class="figure"><svg viewBox="0 0 660 252" class="fg" style="width:100%;max-width:660px" role="img" aria-label="三個行程的時間軸，圓圈內是 Lamport 時鐘值，方括號是向量時鐘。P1 送訊息給 P2，P2 再送給 P3">
<text x="640" y="18" text-anchor="end" class="fg-t sm">時間 →</text>
<text x="20" y="54" class="fg-t lg">P1</text><text x="20" y="134" class="fg-t lg">P2</text><text x="20" y="214" class="fg-t lg">P3</text>
<line x1="70" y1="50" x2="640" y2="50" class="fg-l dim"/><line x1="70" y1="130" x2="640" y2="130" class="fg-l dim"/><line x1="70" y1="210" x2="640" y2="210" class="fg-l dim"/>
<line x1="238.2" y1="57.3" x2="305.8" y2="117.4" class="fg-l on"/><polygon points="311.8,122.7 302.8,120.7 308.8,114.0" class="fg-a on"/>
<text x="292" y="84" class="fg-t sm acc">m1</text>
<line x1="429.2" y1="136.1" x2="524.2" y2="199.5" class="fg-l on"/><polygon points="530.8,203.9 521.7,203.2 526.7,195.7" class="fg-a on"/>
<text x="492" y="162" class="fg-t sm acc">m2</text>
<circle cx="130" cy="50" r="11" class="fg-b"/><text x="130" y="54" text-anchor="middle" class="fg-t sm">1</text>
<circle cx="230" cy="50" r="11" class="fg-b hot"/><text x="230" y="54" text-anchor="middle" class="fg-t sm">2</text>
<circle cx="150" cy="130" r="11" class="fg-b warm"/><text x="150" y="134" text-anchor="middle" class="fg-t sm">1</text>
<circle cx="320" cy="130" r="11" class="fg-b hot"/><text x="320" y="134" text-anchor="middle" class="fg-t sm">3</text>
<circle cx="420" cy="130" r="11" class="fg-b hot"/><text x="420" y="134" text-anchor="middle" class="fg-t sm">4</text>
<circle cx="200" cy="210" r="11" class="fg-b"/><text x="200" y="214" text-anchor="middle" class="fg-t sm">1</text>
<circle cx="540" cy="210" r="11" class="fg-b hot"/><text x="540" y="214" text-anchor="middle" class="fg-t sm">5</text>
<text x="130" y="30" text-anchor="middle" class="fg-t sm mono">[1,0,0]</text><text x="230" y="30" text-anchor="middle" class="fg-t sm mono">[2,0,0]</text>
<text x="150" y="158" text-anchor="middle" class="fg-t sm mono">[0,1,0]</text><text x="320" y="158" text-anchor="middle" class="fg-t sm mono">[2,2,0]</text><text x="408" y="158" text-anchor="middle" class="fg-t sm mono">[2,3,0]</text>
<text x="200" y="238" text-anchor="middle" class="fg-t sm mono">[0,0,1]</text><text x="540" y="238" text-anchor="middle" class="fg-t sm mono">[2,3,2]</text>
</svg><figcaption>圓圈裡是 Lamport 時鐘，方括號是向量時鐘（P1、P2、P3 各一格）。P2 收到 m1 時，自己是 1、訊息帶 2，取大再加一變成 3。</figcaption></figure>
<p>Lamport 時鐘保證：如果 a 導致了 b，那 a 的數字一定比 b 小。但反過來不成立：P1 的第一件事是 1，P2 的第一件事（橘色）也是 1，它們其實彼此無關，Lamport 時鐘分不出「無關」和「同時」。</p>
<p><b>向量時鐘</b>（vector clock）解決這個問題：每個行程記一整排計數器，每一格代表一個行程「我所知道它做到第幾件事」。比較兩個向量：如果一個每格都小於等於另一個，它就發生在前；如果互有大小，例如 P1 的 [1,0,0] 和 P2 的 [0,1,0]，就是<b>並行</b>（concurrent），沒有誰先誰後，需要由應用程式決定怎麼合併。早期 Amazon Dynamo 和 Riak 就用這種方式偵測寫入衝突。</p>
<p>還有兩種更進階的做法：CockroachDB 用<b>混合邏輯時鐘</b>（hybrid logical clock），把物理時間和邏輯計數器合在一起；Google Spanner 用 GPS 和原子鐘做出 TrueTime，它回傳的不是一個時間，而是一個誤差區間（通常只有幾毫秒），提交時刻意等到區間過去，用「等待」換來全球的時間順序。</p>

<h3><span class="badge lv4">專家</span>九、剛好一次的效果、兩階段提交與 Saga</h3>
<h4>冪等鍵：重試的保險絲</h4>
<p>用戶端每個操作產生一個唯一的<b>冪等鍵</b>（idempotency key），重試時帶同一個。伺服器在<b>同一個資料庫交易</b>裡先登記這把鑰匙、再做事：</p>
<pre><code>const c = await pool.connect();
try {
  await c.query('BEGIN');
  const r = await c.query(
    'INSERT INTO idem_keys(key) VALUES ($1) ' +
    'ON CONFLICT DO NOTHING', [key]);
  // 第一次看到這把鑰匙，才真的扣點數
  if (r.rowCount === 1) {
    await c.query(
      'UPDATE wallets SET points = points - 100 ' +
      'WHERE user_id = $1', [userId]);
  }
  await c.query('COMMIT');
} catch (e) {
  await c.query('ROLLBACK');
  throw e;
} finally {
  c.release();
}</code></pre>
<p>關鍵在「同一個交易」：登記和扣款要嘛一起成功，要嘛一起取消。如果分成兩步，在中間當機，就會出現「登記了但沒扣」或「扣了但沒登記」。兩個重試同時到達時，PostgreSQL 會讓第二個 INSERT 等第一個交易結束，再發現衝突、什麼都不做。</p>
<p>要「改資料庫，同時發一則訊息到佇列」也是同樣的問題：資料庫和 Kafka 沒辦法放進同一個交易。標準解法是<b>交易外寄箱</b>（transactional outbox）：把要發的訊息當成一列資料，跟業務資料寫在同一個交易裡，另一支程式再把外寄箱的訊息送出去，至少送一次，接收方用訊息 ID 去重。Kafka 標榜的 exactly-once，是冪等的生產者加上 Kafka 內部的交易，只涵蓋「從 Kafka 讀、寫回 Kafka」；寄信、扣款這種外部副作用，還是要你自己做冪等。</p>
<h4>兩階段提交與 Saga</h4>
<p>一個操作要改兩個服務的資料，例如商城買道具：錢包服務扣點數、道具服務發道具。</p>
<ul>
<li><b>兩階段提交</b>（two-phase commit，2PC）：協調者先問每個參與者「準備好了嗎」，大家鎖住資料、把紀錄寫進磁碟、回答「可以」；全部同意後，協調者才叫大家提交。好處是原子性：全部成功或全部取消。最大弱點是大家都回答「可以」之後協調者掛了，參與者不敢自己決定，鎖就一直卡著。它常見於資料庫內部，例如 Spanner 的每個參與者本身用 Paxos 複製，降低卡住的風險。</li>
<li><b>Saga</b>：一連串各自獨立的本地交易；後面某一步失敗時，依相反順序執行前面每一步的補償動作。它是最終一致的，中間狀態別人看得到；補償動作必須冪等、可以一直重試，而且不能失敗。跨微服務的業務流程通常選它。</li>
</ul>
<p>用 Saga 寫買道具：① 錢包扣 100 點（補償：退 100 點）→ ② 道具服務發道具（補償：收回道具）→ ③ 寄購買通知。如果 ② 失敗，就執行 ① 的補償。注意 ③ 寄信是收不回來的，所以「不可逆的步驟放最後」。中間那段時間，玩家可能看到點數少了、道具還沒到，所以訂單要有「處理中」這種狀態讓畫面照實顯示。負責串流程的可以是一個中央的編排者（orchestration，例如用 Temporal 這類工作流程引擎），也可以讓各服務聽事件接力（choreography），前者比較好追蹤。</p>

<h3><span class="badge lv4">專家</span>十、租約與圍欄權杖：分散式鎖的最後一塊拼圖</h3>
<p>跨機器的鎖一定要會過期（<b>租約</b>，lease），否則拿著鎖的人一當機，大家永遠等下去。可是會過期就有新問題：</p>
<figure class="figure"><svg viewBox="0 0 660 248" class="fg" style="width:100%;max-width:660px" role="img" aria-label="用戶端 1 拿到號碼 33 的鎖後停頓，租約到期，用戶端 2 拿到 34 並寫入；用戶端 1 醒來帶 33 寫入，被儲存服務拒絕">
<text x="440" y="18" text-anchor="middle" class="fg-t sm warm">第 10 秒：租約到期</text>
<line x1="440" y1="26" x2="440" y2="196" class="fg-l warm dash"/>
<text x="20" y="54" class="fg-t">用戶端 1</text><text x="20" y="134" class="fg-t">用戶端 2</text><text x="20" y="218" class="fg-t">儲存</text>
<line x1="80" y1="50" x2="640" y2="50" class="fg-l dim"/><line x1="80" y1="130" x2="640" y2="130" class="fg-l dim"/>
<rect x="80" y="34" width="84" height="32" rx="5" class="fg-b hot"/><text x="122" y="55" text-anchor="middle" class="fg-t sm acc">拿到鎖 33</text>
<rect x="170" y="34" width="456" height="32" rx="5" class="fg-b warm"/><text x="300" y="55" text-anchor="middle" class="fg-t sm">停頓中，以為鎖還在自己手上</text>
<rect x="476" y="114" width="84" height="32" rx="5" class="fg-b hot"/><text x="518" y="135" text-anchor="middle" class="fg-t sm acc">拿到鎖 34</text>
<line x1="518" y1="146" x2="518" y2="188" class="fg-l on"/><polygon points="518,196 513.5,188 522.5,188" class="fg-a on"/>
<text x="528" y="176" class="fg-t sm acc">帶 34：收下</text>
<line x1="626" y1="66" x2="626" y2="188" class="fg-l warm"/><polygon points="626,196 621.5,188 630.5,188" class="fg-a warm"/>
<text x="618" y="98" text-anchor="end" class="fg-t sm warm">醒來，帶 33 寫入：拒絕</text>
<rect x="80" y="196" width="560" height="36" rx="6" class="fg-b"/><text x="92" y="219" class="fg-t sm">記住看過的最大號碼，比它小的一律拒絕</text>
</svg><figcaption>停頓的原因可能是垃圾回收、虛擬機器被暫停、或網路卡住。用戶端 1 自己完全感覺不到時間過去了，所以只能靠被保護的那一方來把關。</figcaption></figure>
<p>用戶端 1 拿到 10 秒的租約，接著卡住 15 秒；租約在第 10 秒到期，鎖服務把鎖給了用戶端 2；用戶端 1 醒來，還以為鎖在手上，照樣去寫。兩個人同時以為自己有鎖，資料就毀了。</p>
<p>解法是<b>圍欄權杖</b>（fencing token）：鎖服務每次發鎖都附上一個遞增的號碼，寫入時帶著它，<b>被保護的儲存服務</b>記住看過的最大號碼，比它小的一律拒絕。重點在最後一句：只靠鎖服務做不到，儲存那一端必須參與檢查。etcd 的每次修改都有遞增的 revision，ZooKeeper 也有遞增的版本號，都可以拿來當號碼。Martin Kleppmann 就用這個論點批評過只靠 Redis 時間到期的鎖（Redlock）：沒有號碼，就擋不住醒過來的那一個。</p>
<p>如果儲存服務沒辦法檢查號碼呢？那就換一種設計：讓寫入本身變成條件式的，例如 <code>UPDATE … WHERE version = 41</code>，只有版本沒被別人改過才成功。這其實是同一個想法：把「我還有資格嗎」的判斷，交給握有真相的那一方。</p>

<h3>十一、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>CAP 是三個選兩個</td><td>分區一定會發生，真正的選擇只在「斷線時」要 C 還是要 A；平常則是延遲和一致性的取捨（PACELC）。</td></tr>
<tr><td>逾時了就代表對方沒做</td><td>對方可能已經做完，只是回覆丟了。重試前要確定操作是冪等的。</td></tr>
<tr><td>加一台機器就更可靠</td><td>4 台共識叢集跟 3 台一樣只能掛 1 台，還多一台要等。依賴越多，出錯的機會越多。</td></tr>
<tr><td>用 NTP 同步過，時間戳記就能排先後</td><td>誤差仍有幾毫秒，還可能往回跳。排先後要用單一來源的序號、版本號或邏輯時鐘。</td></tr>
<tr><td>買了支援 exactly-once 的產品就不用管重複</td><td>那通常只涵蓋產品內部；對外的副作用仍然要自己做冪等。</td></tr>
<tr><td>分散式鎖有逾時就安全了</td><td>停頓過的持有者會在逾時後醒來繼續寫。要靠圍欄權杖或條件式寫入擋下。</td></tr>
</table>

<h3>十二、跟你的工作連起來</h3>
<ul>
<li><b>Node.js／TypeScript</b>：<code>fetch</code> 預設沒有逾時，一個卡住的下游就能吊住你的請求。用 <code>AbortSignal.timeout(300)</code> 當作 <code>signal</code> 傳進去。重試要帶冪等鍵，並且加退避與抖動。</li>
<li><b>Go</b>：預設的 <code>http.Client</code> 也沒有逾時。每個對外呼叫都用 <code>context.WithTimeout</code>，並把 context 一路往下傳，讓整條呼叫鏈共享同一個截止時間。</li>
<li><b>Redis 當鎖</b>：<code>SET key token NX PX 10000</code> 拿鎖，釋放時要確認 token 是自己的（用 Lua 腳本比對後再刪），而且被保護的資源要能檢查號碼或版本，否則就是第十節的事故。</li>
<li><b>Kubernetes</b>：控制平面的 etcd 用 3 或 5 台，分散在不同可用區；控制器的「只能有一個在做事」靠 Lease 物件選主。你自己寫的 Operator 也一樣。</li>
<li><b>遊戲伺服器</b>：一個房間只由一台伺服器當權威，房間內的狀態就不需要共識，速度最快；跨房間的東西（點數、道具、排行榜）才需要本章的工具。點數走強一致加冪等，排行榜走最終一致。</li>
</ul>

<h3>十三、面試會怎麼問</h3>
<p>這些是資深後端、平台工程、SRE 面試的常見題。先講出來，再看答案。</p>
<ol>
<li>「解釋 CAP。為什麼說『三個選兩個』是誤導？PACELC 補了什麼？」</li>
<li>「三台的 etcd 掛一台還能寫嗎？掛兩台呢？為什麼不用四台？」</li>
<li>「Raft 的領導者怎麼選出來？為什麼新領導者不會弄丟已經提交的資料？」</li>
<li>「怎麼做到『扣款剛好一次』？」</li>
<li>「分散式鎖已經有逾時了，為什麼還需要圍欄權杖？」</li>
<li>「跨服務的訂單流程，你會用兩階段提交還是 Saga？為什麼？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>網路分區不是可選的，所以 CAP 的真正意思是：分區發生時，要嘛拒絕部分請求以保持線性一致（CP），要嘛繼續回應但接受暫時不一致（AP）。PACELC 補上沒有分區時的取捨：要低延遲就放鬆一致性，要強一致就得等其他節點確認、延遲較高。例如 etcd 是 PC／EC，Cassandra 用 ONE 時是 PA／EL。</li>
<li>掛一台還有 2／3 過半數，可以選主、可以寫；掛兩台只剩 1／3，湊不到過半數，無法寫入（為了不腦裂而停擺）。四台的過半數是 3，同樣只能掛一台，卻多一台要等、多一台可能出錯，所以用奇數，並分散在三個可用區。</li>
<li>跟隨者在隨機的選舉逾時內沒收到心跳，就把任期加一、成為候選者並請求投票；每個節點每任期只投一票，而且只投給日誌至少跟自己一樣新的候選者；拿到過半數就當選。已提交的日誌存在過半數節點上，當選也需要過半數投票，兩者必有交集，交集的節點不會投給日誌比自己舊的人，所以新領導者一定有所有已提交的日誌。</li>
<li>剛好一次的「傳遞」做不到，要做的是剛好一次的「效果」：用戶端產生冪等鍵並在重試時重用；伺服器在同一個資料庫交易裡登記冪等鍵並執行扣款，用唯一索引擋重複；重複請求回傳第一次的結果。要同時發訊息就用交易外寄箱，至少送一次，接收方再去重。</li>
<li>持有者可能因為垃圾回收、虛擬機器暫停而停住，租約過期後鎖被別人拿走，它醒來還以為自己持有鎖，繼續寫入。逾時只能保證鎖最終會被釋放，不能阻止舊持有者寫入。圍欄權杖讓每次發鎖都帶遞增號碼，由被保護的資源拒絕比已看過的號碼小的請求。</li>
<li>跨微服務通常選 Saga：每步是本地交易，失敗時依反序執行冪等、可重試的補償；不可逆的步驟放最後，並用「處理中」狀態處理中間狀態可見的問題。2PC 提供原子性，但協調者在參與者都同意後故障會讓大家持鎖卡住，又把多個服務的可用性綁在一起，比較適合在單一資料庫系統內部使用。</li>
</ol>
</details>

<h3>十四、練功題（做得出來才算真的懂）</h3>
<ol>
<li>N = 5。對每一個 W（1 到 5），找出能保證讀寫重疊的最小 R。每一種組合，寫入和讀取各能容忍幾台故障？</li>
<li>四層服務，每一層失敗時都「再試兩次」。最底層最多會看到幾倍的請求？你會怎麼改？</li>
<li>比較以下向量時鐘，說出誰先誰後或是並行：(a) [2,1,0] 和 [2,2,1]；(b) [3,0,1] 和 [2,1,1]；(c) [1,1,1] 和 [1,1,1]。</li>
<li>一台機器的時鐘誤差是 30 ppm，完全沒有校正，一週後會差多少秒？</li>
<li>替「玩家用點數兌換限量道具」設計一個 Saga：列出步驟、每一步的補償動作、哪一步放最後，以及中間狀態要怎麼呈現給玩家。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>需要 W + R ≥ 6：(W=1, R=5)、(2, 4)、(3, 3)、(4, 2)、(5, 1)。寫入能容忍的故障數是 N − W：分別是 4、3、2、1、0 台；讀取能容忍 N − R 台。(3, 3) 讀寫都能各掛 2 台，最平衡。</li>
<li>每層最多 3 次嘗試，四層就是 3⁴ = 81 倍。改法：只在最外層重試，內層失敗直接往上回報；加指數退避和抖動；設重試預算；把剩餘的截止時間往下傳，時間不夠就不要再呼叫。</li>
<li>(a) [2,1,0] 每格都 ≤ [2,2,1]，所以前者發生在先。(b) 第一格 3 &gt; 2，第二格 0 &lt; 1，互有大小，是並行。(c) 完全相同，是同一個事件（或同一個狀態）。</li>
<li>一週 604,800 秒 × 0.00003 ≈ 18 秒。所以一定要開 NTP，而且不能拿兩台機器的時間戳記排毫秒級的先後。</li>
<li>一種答案：① 庫存服務預留一份道具（補償：釋放預留）→ ② 錢包扣點數（補償：退點數）→ ③ 把預留轉成正式發放 → ④ 寄通知（不可逆，放最後）。每一步都帶同一個訂單編號當冪等鍵；任一步失敗就依反序補償；訂單狀態顯示「處理中」，完成才顯示「已到帳」。先預留庫存，是為了不讓點數扣了卻發現賣完。</li>
</ol>
</details>

<h3>十五、想再挖深</h3>
<ul>
<li><b>Martin Kleppmann《Designing Data-Intensive Applications》</b>：第 5 到 9 章就是這一章的完整版，複製、分區、交易、時鐘、共識一路講透，是這個領域最多人推薦的一本書。</li>
<li><b>Raft 論文與官網</b>（<a href="https://raft.github.io/">raft.github.io</a>）：Diego Ongaro 與 John Ousterhout 的〈In Search of an Understandable Consensus Algorithm〉，官網上有可以自己點的動畫，看節點怎麼選主、怎麼複製。</li>
<li><b>MIT 6.5840 Distributed Systems</b>（<a href="https://pdos.csail.mit.edu/6.824/">pdos.csail.mit.edu/6.824</a>）：免費的課程影片和講義，作業是用 Go 親手實作 Raft。做完它，面試講 Raft 會非常有底氣。</li>
<li><b>Jepsen</b>（<a href="https://jepsen.io/">jepsen.io</a>）：專門對資料庫做故障測試的分析報告，還有一張一致性模型的關係圖。看真實產品在網路分區下怎麼違反自己的承諾，最能讓你相信這一章不是理論。</li>
<li><b>Martin Kleppmann〈How to do distributed locking〉</b>（<a href="https://martin.kleppmann.com/">martin.kleppmann.com</a>）：第十節圍欄權杖的原始論證，以及對 Redlock 的分析。</li>
</ul>
` });
