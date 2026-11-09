DEEP({ 'job-bank': `
<p>上一課的題庫有 26 題，參考答案（model answer）刻意寫得很短。這一章往兩個方向延伸。第一，往深：面試官怎麼替一個答案打分數、追問（follow-up question）是怎麼一層一層長出來的，以及另外十幾題常見題目的深入答案，每一題都附上面試官接下來最可能追問的方向。第二，往外：怎麼用英文開口練、怎麼替自己評分、怎麼排複習，讓這些答案在面試那天真的講得出來。題庫讀懂只是第一步，講得出來才算數。</p>

<h3><span class="badge lv1">基礎</span>一、面試官怎麼打分數：一個答案的三層</h3>
<p>同一題「What is the difference between TCP and UDP?」，三個人的答案可以差很多。面試官心裡其實有一把尺：你的答案能往下走幾層。</p>
<figure class="figure"><svg viewBox="0 0 680 270" class="fg" style="width:100%;max-width:680px" role="img" aria-label="答案的三層：第一層是兩三句的結論，第二層是機制，第三層是正式環境的取捨與自己的例子；每往下一層都是被追問 why 帶下去的，右邊標出每一層代表的資歷">
<rect x="20" y="20" width="400" height="56" rx="6" class="fg-b hot"/><text x="40" y="44" class="fg-t acc">第一層：兩三句的結論</text><text x="40" y="64" class="fg-t sm">先直接回答問題本身</text>
<rect x="60" y="96" width="400" height="56" rx="6" class="fg-b alt"/><text x="80" y="120" class="fg-t alt">第二層：機制</text><text x="80" y="140" class="fg-t sm">它怎麼運作、為什麼會這樣</text>
<rect x="100" y="172" width="400" height="56" rx="6" class="fg-b warm"/><text x="120" y="196" class="fg-t warm">第三層：正式環境</text><text x="120" y="216" class="fg-t sm">取捨、故障的樣子、你自己的例子</text>
<line x1="380" y1="76" x2="380" y2="88" class="fg-l"/><polygon points="380,96 375.5,88 384.5,88" class="fg-a"/><text x="390" y="90" class="fg-t sm mono">Why?</text>
<line x1="420" y1="152" x2="420" y2="164" class="fg-l"/><polygon points="420,172 415.5,164 424.5,164" class="fg-a"/><text x="430" y="166" class="fg-t sm mono">And then?</text>
<text x="530" y="52" class="fg-t sm">停在這裡：資淺</text>
<text x="530" y="128" class="fg-t sm">講得出機制：中階</text>
<text x="530" y="204" class="fg-t sm acc">有自己的例子：資深</text>
<text x="340" y="258" text-anchor="middle" class="fg-t sm">第一層永遠先講完；往下走多深，讓面試官的追問決定</text>
</svg><figcaption>上一課說「先講兩三句，對方追問再深入」，就是這張圖：第一層是你主動給的，第二、三層是被追問時才給的。準備時三層都要有，面試時一層一層交出去。</figcaption></figure>
<p>拿 TCP 和 UDP 走一次：</p>
<ul>
<li><b>第一層：</b>「TCP is a reliable, ordered connection; UDP sends independent datagrams with no guarantees. TCP fits web and databases; UDP fits DNS, voice, fast games and QUIC.」</li>
<li><b>第二層（被問 why）：</b>TCP 靠序號、確認（ACK）和重送做到可靠與有序，靠壅塞控制避免把網路塞爆；代價是交握的往返時間，以及一個封包遺失時後面的資料都得等它（隊頭阻塞，head-of-line blocking）。</li>
<li><b>第三層（被問 and then）：</b>「這就是 HTTP/3 改走 QUIC 的原因：QUIC 在 UDP 上自己做可靠傳輸，但每條串流各自重送，一個封包遺失不會卡住其他串流。在我自己的遊戲伺服器上，即時的位置更新用的是……」接上你自己的經驗。</li>
</ul>
<p>為什麼不一次講完三層？因為面試時間有限，面試官想把時間花在他在意的地方。你一口氣講五分鐘，他可能根本不在意的那一層就吃掉了他想問的下一題。先交第一層，等他選方向，是對他時間的尊重，也是一種溝通能力。</p>

<h3><span class="badge lv1">基礎</span>二、追問是怎麼長出來的：一棵追問樹</h3>
<p>面試官的追問不是隨機的。你答案裡的每一個名詞，都是一條可以往下挖的路。以題庫第 1 題「輸入網址按下 Enter」為例：</p>
<figure class="figure"><svg viewBox="0 0 680 300" class="fg" style="width:100%;max-width:680px" role="img" aria-label="追問樹：從輸入網址按 Enter 分出 DNS、TCP 加 TLS、HTTP、伺服器端四條，每條再往下分出一到兩層追問，其中一條一路追到憑證怎麼驗證">
<rect x="250" y="12" width="180" height="36" rx="6" class="fg-b alt"/><text x="340" y="35" text-anchor="middle" class="fg-t">輸入網址按 Enter</text>
<path d="M340 48 V64 H85 V72" class="fg-l"/><polygon points="85,80 80.5,72 89.5,72" class="fg-a"/>
<path d="M340 48 V64 H255 V72" class="fg-l on"/><polygon points="255,80 250.5,72 259.5,72" class="fg-a on"/>
<path d="M340 64 H425 V72" class="fg-l"/><polygon points="425,80 420.5,72 429.5,72" class="fg-a"/>
<path d="M425 64 H595 V72" class="fg-l"/><polygon points="595,80 590.5,72 599.5,72" class="fg-a"/>
<rect x="20" y="80" width="130" height="36" rx="6" class="fg-b"/><text x="85" y="103" text-anchor="middle" class="fg-t">DNS</text>
<rect x="190" y="80" width="130" height="36" rx="6" class="fg-b hot"/><text x="255" y="103" text-anchor="middle" class="fg-t acc">TCP＋TLS</text>
<rect x="360" y="80" width="130" height="36" rx="6" class="fg-b"/><text x="425" y="103" text-anchor="middle" class="fg-t">HTTP</text>
<rect x="530" y="80" width="130" height="36" rx="6" class="fg-b"/><text x="595" y="103" text-anchor="middle" class="fg-t">伺服器端</text>
<line x1="85" y1="116" x2="85" y2="142" class="fg-l"/><polygon points="85,150 80.5,142 89.5,142" class="fg-a"/>
<line x1="255" y1="116" x2="255" y2="142" class="fg-l on"/><polygon points="255,150 250.5,142 259.5,142" class="fg-a on"/>
<line x1="425" y1="116" x2="425" y2="142" class="fg-l"/><polygon points="425,150 420.5,142 429.5,142" class="fg-a"/>
<line x1="595" y1="116" x2="595" y2="142" class="fg-l"/><polygon points="595,150 590.5,142 599.5,142" class="fg-a"/>
<rect x="20" y="150" width="130" height="36" rx="6" class="fg-b"/><text x="85" y="173" text-anchor="middle" class="fg-t sm">TTL 與快取</text>
<rect x="190" y="150" width="130" height="36" rx="6" class="fg-b hot"/><text x="255" y="173" text-anchor="middle" class="fg-t sm">TLS 1.3 少一趟</text>
<rect x="360" y="150" width="130" height="36" rx="6" class="fg-b"/><text x="425" y="173" text-anchor="middle" class="fg-t sm">keep-alive、HTTP/2</text>
<rect x="530" y="150" width="130" height="36" rx="6" class="fg-b"/><text x="595" y="173" text-anchor="middle" class="fg-t sm">負載平衡到資料庫</text>
<line x1="255" y1="186" x2="255" y2="212" class="fg-l on"/><polygon points="255,220 250.5,212 259.5,212" class="fg-a on"/>
<line x1="595" y1="186" x2="595" y2="212" class="fg-l"/><polygon points="595,220 590.5,212 599.5,212" class="fg-a"/>
<rect x="190" y="220" width="130" height="36" rx="6" class="fg-b hot"/><text x="255" y="243" text-anchor="middle" class="fg-t sm">憑證怎麼驗證</text>
<rect x="530" y="220" width="130" height="36" rx="6" class="fg-b"/><text x="595" y="243" text-anchor="middle" class="fg-t sm">變慢的話怎麼查</text>
<text x="340" y="286" text-anchor="middle" class="fg-t sm">第一層答案裡的每個名詞都是一個入口：只提你能往下走兩層的</text>
</svg><figcaption>綠色那條是一場真實面試常見的走法：面試官聽到你提 TLS，就順著問「1.3 改了什麼」「憑證怎麼驗證」。你提了一個自己接不住的名詞，就是替自己挖了一個洞。</figcaption></figure>
<p>這張圖給你兩個練習方法。第一，準備每一題時，<b>先畫出它的追問樹</b>，確認每一個你會提到的名詞，都能再往下講兩層。第二，你可以<b>主動引導</b>：在第一層答案裡，刻意放一個你最有把握的名詞。例如你對資料庫很熟，就在「輸入網址」的答案最後加一句「應用程式可能還要查快取或資料庫」，面試官很可能就往那裡追。</p>

<h3><span class="badge lv2">進階</span>三、網路與 Linux：深入題與追問</h3>
<p>每一題都先蓋住答案，自己用英文講一遍，再打開。答案後面的「追問」，是面試官接下來最可能問的方向，也要準備。</p>
<details class="reveal"><summary>N1. What happens in a TLS handshake, and what changed in TLS 1.3?　TLS 交握在做什麼？1.3 改了什麼？</summary><p>交握要完成三件事：協商版本和加密套件、讓雙方算出同一把對稱金鑰、讓用戶端確認伺服器的身分。TLS 1.3 的用戶端在第一個訊息就送出金鑰交換的資料（key share），伺服器回覆自己的那一份、憑證和簽章，一個往返就完成，1.2 要兩個。1.3 也拿掉了舊的 RSA 金鑰交換和不安全的加密套件，所有連線都用臨時的 Diffie-Hellman，所以一定有前向保密（forward secrecy）：伺服器的私鑰日後外洩，也解不開過去錄下來的流量。</p><p><b>追問：</b>用戶端怎麼驗證憑證？（簽章鏈一路到信任的根憑證、主機名稱符合憑證上的名稱、在有效期間內、可能檢查撤銷狀態。）0-RTT 是什麼、有什麼風險？（恢復連線時第一個封包就帶資料，但這份資料可能被重放，所以只能用在不會改變狀態的請求。）憑證過期造成事故，怎麼預防？（自動續期，加上到期前多少天的警報。）</p></details>
<details class="reveal"><summary>N2. A process died and the kernel log says &ldquo;Out of memory: Killed process&rdquo;. What happened?　核心日誌說行程因記憶體不足被殺，發生了什麼事？</summary><p>系統或這個行程所在的 cgroup 用光了記憶體，核心的 OOM killer 依照每個行程的分數挑了一個殺掉，通常是用最多記憶體的那個。在容器裡，觸發點常常是容器自己的記憶體上限，不是整台機器；Kubernetes 會顯示 OOMKilled，結束代碼是 137。我會先分辨兩種情況：記憶體一直穩定往上爬直到被殺，是洩漏；在某個流量或某種請求時突然跳高，是上限設得太低或有一種請求特別吃記憶體。前者要找洩漏，後者要調整上限或修那種請求，兩種都要加上記憶體使用率接近上限時的警報。</p><p><b>追問：</b>137 這個數字怎麼來的？（128 加上訊號編號 9，也就是 SIGKILL。）怎麼證明是洩漏？（看長時間的記憶體曲線，重啟後是否又以同樣斜率往上；用語言本身的工具抓堆積快照比較。）為什麼不乾脆把上限調很高？（會讓一個壞掉的容器拖垮同一節點上的其他服務。）</p></details>
<details class="reveal"><summary>N3. Why might a server show thousands of connections in TIME_WAIT?　為什麼伺服器上有幾千個 TIME_WAIT 連線？</summary><p>TIME_WAIT 是主動關閉連線的那一方會進入的狀態，在 Linux 上固定停留 60 秒，目的是確保遲到的封包不會混進之後用同一組位址和連接埠的新連線。大量出現通常代表這台機器頻繁地主動建立又關閉短連線，例如每個請求都對後端或資料庫開一條新連線。危險在於對同一個目的地的本機連接埠會被用光，新連線開始失敗。根本的解法是重用連線：HTTP keep-alive、連線池。</p><p><b>追問：</b>為什麼是主動關閉的一方，不是兩邊都有？可以調核心參數解決嗎？（<code>tcp_tw_reuse</code> 可以讓用戶端重用，但根本解法是連線重用；舊文章裡的 <code>tcp_tw_recycle</code> 已經從新的核心移除了。）怎麼數？（<code>ss -s</code> 看各狀態的總數，<code>ss -tan state time-wait</code> 看細節。）</p></details>

<h3><span class="badge lv2">進階</span>四、容器、Kubernetes 與自動化：深入題與追問</h3>
<p>Kubernetes 的題目有一個共同的核心：它是一群各自監看狀態、只做一件事的控制迴圈。把這張圖講得出來，很多題目都能從它推出答案：</p>
<figure class="figure"><svg viewBox="0 0 680 300" class="fg" style="width:100%;max-width:680px" role="img" aria-label="執行 kubectl apply 之後的八個步驟：送出 YAML、API server 驗證並存進 etcd、Deployment 控制器建立 ReplicaSet、ReplicaSet 控制器建立 Pod、排程器選節點、kubelet 拉映像檔並啟動、就緒探測通過、Service 端點開始接流量">
<rect x="20" y="24" width="170" height="50" rx="6" class="fg-b"/><text x="105" y="45" text-anchor="middle" class="fg-t">kubectl</text><text x="105" y="63" text-anchor="middle" class="fg-t sm">1 送出 YAML</text>
<rect x="250" y="24" width="170" height="50" rx="6" class="fg-b hot"/><text x="335" y="45" text-anchor="middle" class="fg-t acc">API server</text><text x="335" y="63" text-anchor="middle" class="fg-t sm">2 驗證、授權、准入</text>
<rect x="480" y="24" width="170" height="50" rx="6" class="fg-b"/><text x="565" y="45" text-anchor="middle" class="fg-t">etcd</text><text x="565" y="63" text-anchor="middle" class="fg-t sm">存下期望狀態</text>
<line x1="190" y1="49" x2="242" y2="49" class="fg-l"/><polygon points="250,49 242,44.5 242,53.5" class="fg-a"/>
<line x1="420" y1="49" x2="472" y2="49" class="fg-l"/><polygon points="480,49 472,44.5 472,53.5" class="fg-a"/>
<path d="M335 74 V96 H105 V110" class="fg-l dash"/><polygon points="105,118 100.5,110 109.5,110" class="fg-a"/><text x="220" y="90" text-anchor="middle" class="fg-t sm">監看（watch）</text>
<rect x="20" y="118" width="170" height="50" rx="6" class="fg-b alt"/><text x="105" y="139" text-anchor="middle" class="fg-t">Deployment 控制器</text><text x="105" y="157" text-anchor="middle" class="fg-t sm">3 建立 ReplicaSet</text>
<rect x="250" y="118" width="170" height="50" rx="6" class="fg-b alt"/><text x="335" y="139" text-anchor="middle" class="fg-t">ReplicaSet 控制器</text><text x="335" y="157" text-anchor="middle" class="fg-t sm">4 建立 Pod</text>
<rect x="480" y="118" width="170" height="50" rx="6" class="fg-b alt"/><text x="565" y="139" text-anchor="middle" class="fg-t">排程器</text><text x="565" y="157" text-anchor="middle" class="fg-t sm">5 替 Pod 選節點</text>
<line x1="190" y1="143" x2="242" y2="143" class="fg-l"/><polygon points="250,143 242,138.5 242,147.5" class="fg-a"/>
<line x1="420" y1="143" x2="472" y2="143" class="fg-l"/><polygon points="480,143 472,138.5 472,147.5" class="fg-a"/>
<path d="M565 168 V194 H105 V214" class="fg-l dash"/><polygon points="105,222 100.5,214 109.5,214" class="fg-a"/><text x="335" y="188" text-anchor="middle" class="fg-t sm">節點上的 kubelet 看到分給自己的 Pod</text>
<rect x="20" y="222" width="170" height="50" rx="6" class="fg-b warm"/><text x="105" y="243" text-anchor="middle" class="fg-t">kubelet</text><text x="105" y="261" text-anchor="middle" class="fg-t sm">6 拉映像檔、啟動容器</text>
<rect x="250" y="222" width="170" height="50" rx="6" class="fg-b warm"/><text x="335" y="243" text-anchor="middle" class="fg-t">就緒探測</text><text x="335" y="261" text-anchor="middle" class="fg-t sm">7 通過才算好</text>
<rect x="480" y="222" width="170" height="50" rx="6" class="fg-b hot"/><text x="565" y="243" text-anchor="middle" class="fg-t acc">Service 端點</text><text x="565" y="261" text-anchor="middle" class="fg-t sm">8 開始接流量</text>
<line x1="190" y1="247" x2="242" y2="247" class="fg-l"/><polygon points="250,247 242,242.5 242,251.5" class="fg-a"/>
<line x1="420" y1="247" x2="472" y2="247" class="fg-l"/><polygon points="480,247 472,242.5 472,251.5" class="fg-a"/>
<text x="340" y="292" text-anchor="middle" class="fg-t sm">每個元件都只做一件事：看 API server 上的狀態，跟期望不同就動手，再把結果寫回去</text>
</svg><figcaption>沒有任何一個元件「指揮」整個流程。每個控制器都在監看自己負責的物件，發現現況和期望不同就動手。卡在哪一步，就去看那一步的元件和事件。</figcaption></figure>
<details class="reveal"><summary>K1. Walk me through what happens after kubectl apply -f deployment.yaml.　執行 kubectl apply 之後發生了什麼？</summary><p>照上圖講八步：API server 先驗證身分、檢查 RBAC 權限、跑准入控制（可能改寫或拒絕這個物件），然後存進 etcd。Deployment 控制器看到新的 Deployment，建立一個 ReplicaSet；ReplicaSet 控制器建立需要數量的 Pod；排程器替每個還沒有節點的 Pod 挑一個資源夠、條件符合的節點；那個節點的 kubelet 透過容器執行環境拉映像檔、建立容器、設定網路；就緒探測通過後，Pod 被加進 Service 的端點，開始收流量。</p><p><b>追問：</b>Pod 一直 Pending 怎麼辦？（describe 看事件：資源不夠、污點沒有對應的容忍、親和性條件不符、儲存卷宣告綁不上。）滾動更新的速度由什麼決定？（maxSurge 和 maxUnavailable，預設都是 25%，再加上就緒探測多快通過。）如果 etcd 掛了，正在跑的 Pod 會怎樣？（已經在跑的容器繼續跑，但叢集無法再做任何變更。）</p></details>
<details class="reveal"><summary>K2. Requests vs limits: what happens when a container exceeds each?　requests 和 limits 有什麼不同？超過各會怎樣？</summary><p>requests 是排程的依據：排程器只把 Pod 放到剩餘可分配量足夠的節點，它也決定 CPU 吃緊時各容器分到的比例。limits 是上限：CPU 超過會被節流（throttling），程式變慢但不會死；記憶體超過會被 OOM kill。用量超過 requests 但沒到 limits 是允許的，但節點記憶體吃緊時，超過 requests 越多的 Pod 越容易被驅逐（eviction）。requests 和 limits 的設法也決定 Pod 的服務品質等級（QoS）：每個容器的 CPU 和記憶體都設了、而且 requests 等於 limits 是 Guaranteed，有設但不相等是 Burstable，都沒設是 BestEffort，最先被驅逐。</p><p><b>追問：</b>CPU limit 要不要設？（各有主張：設了可以防止吵鬧的鄰居，但容易造成不必要的節流；重點是用監控看節流的指標再決定。）requests 怎麼訂出來？（看一段時間的實際用量，例如 p95，再留餘裕。）</p></details>
<details class="reveal"><summary>K3. Design a CI/CD pipeline for a new service from scratch.　從零設計一個服務的 CI/CD 管線。</summary><p>原則是「建置一次、到處部署」。每次合併：跑檢查和測試，建置映像檔並用 commit 的雜湊值當標籤，掃描已知弱點，推到映像檔倉庫。部署到測試環境後跑冒煙測試（smoke test），通過後把<b>同一個映像檔</b>升級到正式環境，用滾動或金絲雀發布，並在發布期間盯著錯誤率和延遲，超過門檻就自動回復。管線存取雲端用短期憑證（例如 OIDC），不放長期金鑰。資料庫遷移是獨立的一步，用先擴充、後收縮的方式保持新舊版本相容。</p><p><b>追問：</b>管線很慢怎麼辦？（快取相依套件和映像檔層、平行跑測試、只測有改到的部分。）為什麼不在每個環境各自重新建置？（重建出來的東西可能不一樣，測過的和上線的就不是同一個。）誰可以按下正式環境的部署？</p></details>
<details class="reveal"><summary>K4. What is drift in Terraform, and how do you handle it?　Terraform 的漂移（drift）是什麼？怎麼處理？</summary><p>漂移是真實的基礎設施和程式碼描述的不一樣了，通常是有人在主控台手動改了設定。<code>terraform plan</code> 會顯示差異。處理時先問這個手動變更該不該留：該留，就把它寫回程式碼；不該留，就讓 apply 把它改回來。預防的方法是讓正式環境的主控台幾乎只有唯讀權限、所有變更走程式碼審查，並在 CI 裡定期跑 plan，有差異就通知。</p><p><b>追問：</b>有一批資源當初是手動建的，怎麼納入管理？（用 import 把它們匯入狀態檔，再補上對應的程式碼，直到 plan 沒有差異。）狀態檔被兩個人同時改壞了怎麼辦？（這就是遠端狀態要加鎖的原因；真的壞了，從版本化的備份還原。）</p></details>

<h3><span class="badge lv3">專業</span>五、雲端、資料與可靠性：深入題與追問</h3>
<details class="reveal"><summary>C1. Design a highly available web application on AWS for a small team.　替一個小團隊在 AWS 上設計高可用的網站。</summary><p>先問需求：可用性目標、預算、團隊有多少人維運。小團隊的答案通常是：應用程式放在至少兩個可用區，前面一個跨可用區的應用程式負載平衡器，用自動擴展群組或代管的容器服務，就緒探測不通過就換掉；資料庫用 RDS 的 Multi-AZ；靜態檔案放 S3 加 CloudFront。網路上，只有負載平衡器在公開子網路，應用程式和資料庫在私有子網路。機密放機密管理服務，全部用基礎設施即程式碼建立，備份放到另一個帳號。</p><p><b>追問：</b>多少錢、先砍哪裡？（NAT gateway 每個可用區一台最穩但最貴，小團隊可以先接受一台的風險；這種取捨要講出來。）整個區域掛了怎麼辦？（先問 RTO 和 RPO 的需求，再決定是只備份到另一個區域，還是要有一套溫備援。）</p></details>
<details class="reveal"><summary>C2. The cloud bill jumped 40% this month. How do you investigate?　雲端帳單這個月暴增 40%，怎麼查？</summary><p>用成本分析工具，依服務、用量類型、帳號和標籤分組，跟上個月比較，找出增加最多的那一行。常見的元兇是：NAT gateway 的資料處理費（例如映像檔或大量資料經過它）、跨可用區的資料傳輸、日誌的寫入量、忘了關的機器或快照、某個自動擴展沒有縮回來。找到之後修正，再補上兩道防線：預算警示，以及強制每個資源都要有負責人的標籤。</p><p><b>追問：</b>為什麼 NAT gateway 會變貴？（它按流過的資料量收費，私有子網路裡的服務如果大量存取網路或某些雲端服務，就會全部經過它；有些服務可以改走 VPC 端點。）怎麼讓工程師平常就在意成本？</p></details>
<details class="reveal"><summary>D1. How do you make backups you can actually trust?　怎麼讓備份真的可靠？</summary><p>備份可不可靠，只有還原過才知道。我的做法：自動排程，不靠人記得；至少有一份放在另一個帳號或另一個區域，而且設成不可修改（例如物件鎖定），這樣就算主帳號被入侵，攻擊者也刪不掉；加密；保留期限照需求訂。然後定期做還原演練，量出實際的還原時間，跟 RTO 比；檢查備份的時間間隔，跟 RPO 比。常被引用的 3-2-1 原則（三份副本、兩種媒介、一份在異地）是很好的起點。</p><p><b>追問：</b>上次還原演練花了多久？發現了什麼？（這題一定要有真實的答案，第 4.5 課的練習就是為它準備的。）資料庫很大，還原要好幾小時，怎麼辦？</p></details>
<details class="reveal"><summary>R1. How would you set an SLO for a brand-new service?　替一個新服務訂 SLO，怎麼做？</summary><p>先挑使用者在乎的一兩個關鍵操作，定義 SLI：例如「請求在 300 毫秒內成功回應的比例」，在最靠近使用者的地方量。新服務沒有歷史資料，就先觀察幾週，把目標訂在略低於目前實際表現的地方，時間窗用 28 或 30 天。接著寫好錯誤預算政策：預算燒完時，團隊暫停新功能、先做可靠性。每季檢討一次：目標太鬆沒人在意，太緊每天都在燒預算，兩種都要調。</p><p><b>追問：</b>為什麼不訂 100%？（不可能做到，而且每多一個 9，成本和發布速度的代價都會大幅增加；使用者的網路本身也沒有 100%。）依賴的服務只有 99.9%，你的服務能訂 99.99% 嗎？</p></details>
<details class="reveal"><summary>R2. How would you load test before a big launch?　大型上線前，你怎麼做負載測試？</summary><p>先建立流量模型：預期的尖峰每秒請求數、各種請求的比例、使用者的行為順序，不能只打首頁。在跟正式環境同樣規格的環境上，逐步加壓，找出效能曲線的轉折點：延遲開始急升的那個流量。同時看每一層的飽和度，找出第一個撐不住的元件，修掉再測。最後測故障情境：一台機器掛掉、依賴服務變慢時，系統會不會優雅地降級。</p><p><b>追問：</b>為什麼看 p99 而不只是平均？測試環境的資料量太小，結果可信嗎？（不完全可信：資料量會影響索引和快取的命中率，要說明這個限制。）</p></details>

<h3><span class="badge lv3">專業</span>六、資安：深入題與追問</h3>
<details class="reveal"><summary>S1. Threat model a new file upload feature.　替一個新的檔案上傳功能做威脅模型。</summary><p>先畫出資料流和信任邊界：使用者的瀏覽器、上傳的 API、儲存的地方、之後處理和下載檔案的地方。然後一類一類想：上傳可執行的檔案或含腳本的 SVG，之後被別人在我們的網域下打開（XSS）；檔名裡帶路徑跳脫字元；超大檔案或壓縮炸彈造成服務癱瘓；偽造的檔案類型騙過檢查；圖片處理函式庫本身的漏洞。對應的控制：限制大小和數量、用內容判斷類型而不是副檔名、用隨機名稱存到物件儲存而不是網站目錄、用另一個網域或強制下載的標頭提供檔案、需要時做惡意程式掃描、處理檔案的工作放在隔離的環境。</p><p><b>追問：</b>如果功能是「輸入一個網址，由伺服器去抓檔案」，多了什麼風險？（伺服器端請求偽造 SSRF：攻擊者讓伺服器去存取內部網路或雲端的中繼資料服務，要限制目的地。）</p></details>
<details class="reveal"><summary>S2. How does an OIDC login work, and what can go wrong?　OIDC 登入怎麼運作？哪裡可能出錯？</summary><p>常見的是授權碼流程加上 PKCE：應用程式把使用者導到身分提供者登入，帶著一個隨機的 state 和 PKCE 的挑戰值；登入後身分提供者帶著授權碼導回我們事先登記的網址；後端用授權碼加上 PKCE 的驗證值換到權杖，其中的 ID token 說明使用者是誰。會出錯的地方：導回網址沒有嚴格比對，授權碼被導到攻擊者那裡；沒檢查 state，被 CSRF；沒有完整驗證 ID token 的簽章、發行者、對象和到期時間；把權杖放在前端 JavaScript 讀得到的地方，一旦有 XSS 就被偷走。</p><p><b>追問：</b>PKCE 防的是什麼？（授權碼在傳遞途中被攔截後，被別人拿去換權杖。）存取權杖和 ID token 有什麼不同？</p></details>
<details class="reveal"><summary>S3. At 3 AM you get an alert: unusual outbound traffic from a production server. What do you do?　凌晨三點收到警報：一台正式環境伺服器有異常的對外流量，你怎麼做？</summary><p>照事件應變的順序做，而且每一步都記下時間。見下圖。</p><p><b>追問：</b>為什麼不直接關機？要通知誰、什麼時候通知？（照事件應變計畫的升級流程；如果可能涉及個人資料，法務和主管要很早就加入。）你怎麼確定攻擊者已經被清乾淨？</p></details>
<figure class="figure"><svg viewBox="0 24 680 146" class="fg" style="width:100%;max-width:680px" role="img" aria-label="事件應變的六步：確認真假、隔離、保全證據、找入口、清除與復原、檢討；隔離和保全證據時不要直接關機">
<rect x="10" y="40" width="100" height="56" rx="6" class="fg-b alt"/><text x="60" y="63" text-anchor="middle" class="fg-t">確認真假</text><text x="60" y="82" text-anchor="middle" class="fg-t sm">流量去哪裡</text>
<rect x="122" y="40" width="100" height="56" rx="6" class="fg-b warm"/><text x="172" y="63" text-anchor="middle" class="fg-t">隔離</text><text x="172" y="82" text-anchor="middle" class="fg-t sm">安全群組封鎖</text>
<rect x="234" y="40" width="100" height="56" rx="6" class="fg-b warm"/><text x="284" y="63" text-anchor="middle" class="fg-t">保全證據</text><text x="284" y="82" text-anchor="middle" class="fg-t sm">快照、記憶體</text>
<rect x="346" y="40" width="100" height="56" rx="6" class="fg-b alt"/><text x="396" y="63" text-anchor="middle" class="fg-t">找入口</text><text x="396" y="82" text-anchor="middle" class="fg-t sm">日誌、時間線</text>
<rect x="458" y="40" width="100" height="56" rx="6" class="fg-b alt"/><text x="508" y="63" text-anchor="middle" class="fg-t">清除復原</text><text x="508" y="82" text-anchor="middle" class="fg-t sm">重建、換金鑰</text>
<rect x="570" y="40" width="100" height="56" rx="6" class="fg-b hot"/><text x="620" y="63" text-anchor="middle" class="fg-t acc">檢討</text><text x="620" y="82" text-anchor="middle" class="fg-t sm">事後檢討</text>
<line x1="110" y1="68" x2="114" y2="68" class="fg-l"/><polygon points="122,68 114,63.5 114,72.5" class="fg-a"/>
<line x1="222" y1="68" x2="226" y2="68" class="fg-l"/><polygon points="234,68 226,63.5 226,72.5" class="fg-a"/>
<line x1="334" y1="68" x2="338" y2="68" class="fg-l"/><polygon points="346,68 338,63.5 338,72.5" class="fg-a"/>
<line x1="446" y1="68" x2="450" y2="68" class="fg-l"/><polygon points="458,68 450,63.5 450,72.5" class="fg-a"/>
<line x1="558" y1="68" x2="562" y2="68" class="fg-l"/><polygon points="570,68 562,63.5 562,72.5" class="fg-a"/>
<path d="M122 104 V112 H334 V104" class="fg-l warm"/>
<text x="228" y="132" text-anchor="middle" class="fg-t sm warm">先隔離、不要關機：記憶體裡的證據會消失</text>
<text x="340" y="160" text-anchor="middle" class="fg-t sm">每一步都記下時間：事後的時間線就是從這裡來</text>
</svg><figcaption>先確認不是誤報（例如正常的備份上傳），再用網路隔離切斷它對外的連線，同時保留證據。重建而不是「清理」被入侵的機器，並換掉它能碰到的所有憑證。</figcaption></figure>
<h4>最後一題：行為題也有追問</h4>
<details class="reveal"><summary>B1. Tell me about a time you disagreed with a technical decision.　講一次你不同意某個技術決定的經驗。</summary><p>這是行為題，用 STAR。重點不是你贏了，而是你怎麼處理不同意見。好的故事有這幾個元素：你用資料而不是情緒表達意見（「I ran a quick benchmark and shared the numbers」）；你理解對方的考量；最後無論結果如何，你都全力執行團隊的決定（「disagree and commit」），並在事後回頭檢討。最強的版本是：你最後被說服了，而且說得出你學到什麼。</p><p><b>追問：</b>如果事後證明你是對的，你怎麼做？（不是說「我早就說過」，而是推動一次檢討，讓下次的決策流程更好。）</p></details>

<h3><span class="badge lv4">專家</span>七、開口練英文：從讀懂到講得出來</h3>
<p>讀懂一個答案，和在面試官面前用英文講出來，是兩種不同的能力。前者靠閱讀，後者靠<b>從記憶裡提取並組織成句子</b>，只能靠開口練。下面是一個每天三十分鐘就能做的循環：</p>
<figure class="figure"><svg viewBox="0 24 680 136" class="fg" style="width:100%;max-width:680px" role="img" aria-label="練習循環：讀題想三十秒、開口答並錄音、轉成文字、對照評分表、改寫弱點，然後回到開口答再講一次">
<rect x="9" y="40" width="118" height="56" rx="6" class="fg-b"/><text x="68" y="63" text-anchor="middle" class="fg-t">讀題想 30 秒</text><text x="68" y="82" text-anchor="middle" class="fg-t sm">先想結構</text>
<rect x="145" y="40" width="118" height="56" rx="6" class="fg-b hot"/><text x="204" y="63" text-anchor="middle" class="fg-t acc">開口答、錄音</text><text x="204" y="82" text-anchor="middle" class="fg-t sm">60 到 120 秒</text>
<rect x="281" y="40" width="118" height="56" rx="6" class="fg-b"/><text x="340" y="63" text-anchor="middle" class="fg-t">轉成文字</text><text x="340" y="82" text-anchor="middle" class="fg-t sm">手機語音轉文字</text>
<rect x="417" y="40" width="118" height="56" rx="6" class="fg-b alt"/><text x="476" y="63" text-anchor="middle" class="fg-t">對照評分表</text><text x="476" y="82" text-anchor="middle" class="fg-t sm">六項、各 0 到 2</text>
<rect x="553" y="40" width="118" height="56" rx="6" class="fg-b warm"/><text x="612" y="63" text-anchor="middle" class="fg-t">改寫弱點</text><text x="612" y="82" text-anchor="middle" class="fg-t sm">只改最差那項</text>
<line x1="127" y1="68" x2="137" y2="68" class="fg-l"/><polygon points="145,68 137,63.5 137,72.5" class="fg-a"/>
<line x1="263" y1="68" x2="273" y2="68" class="fg-l"/><polygon points="281,68 273,63.5 273,72.5" class="fg-a"/>
<line x1="399" y1="68" x2="409" y2="68" class="fg-l"/><polygon points="417,68 409,63.5 409,72.5" class="fg-a"/>
<line x1="535" y1="68" x2="545" y2="68" class="fg-l"/><polygon points="553,68 545,63.5 545,72.5" class="fg-a"/>
<path d="M612 96 V126 H204 V104" class="fg-l on dash"/><polygon points="204,96 199.5,104 208.5,104" class="fg-a on"/>
<text x="408" y="146" text-anchor="middle" class="fg-t sm acc">同一題當天再講一次，聽聽看有沒有變好</text>
</svg><figcaption>錄音和轉文字是關鍵。你講的時候覺得還不錯，看到逐字稿才會發現「um」有多少、句子在哪裡斷掉、第一句是不是結論。</figcaption></figure>
<h4>評分表：每項 0 到 2 分，滿分 12</h4>
<table>
<tr><th>項目</th><th>0 分</th><th>1 分</th><th>2 分</th></tr>
<tr><td>結構</td><td>想到哪講到哪</td><td>有重點但順序亂</td><td>先結論，再兩三個重點</td></tr>
<tr><td>正確</td><td>有明顯錯誤</td><td>小地方不精確</td><td>全部正確</td></tr>
<tr><td>深度</td><td>只有名詞</td><td>講到機制（第二層）</td><td>機制加上正式環境的細節</td></tr>
<tr><td>取捨</td><td>沒提</td><td>提到一個代價</td><td>比較兩個做法並說明選擇</td></tr>
<tr><td>例子</td><td>沒有</td><td>假設性的例子</td><td>自己真實做過的事</td></tr>
<tr><td>英文與長度</td><td>常卡住，或超過三分鐘</td><td>偶爾卡住</td><td>順暢，第一段在一分鐘內</td></tr>
</table>
<h4>排複習：三個盒子</h4>
<p>題目多了，就不可能每天每題都練。用一個簡單的間隔複習系統：三個盒子，練得越好的題目，越久才練一次。</p>
<figure class="figure"><svg viewBox="0 0 680 210" class="fg" style="width:100%;max-width:680px" role="img" aria-label="三個盒子的複習系統：盒子一每天練，盒子二每三天練，盒子三每週練；9 分以上往右移一格，低於 6 分回到盒子一">
<rect x="30" y="40" width="170" height="80" rx="8" class="fg-b warm"/><text x="115" y="70" text-anchor="middle" class="fg-t">盒子一：每天</text><text x="115" y="92" text-anchor="middle" class="fg-t sm">新題、常錯的題</text>
<rect x="255" y="40" width="170" height="80" rx="8" class="fg-b alt"/><text x="340" y="70" text-anchor="middle" class="fg-t">盒子二：每三天</text><text x="340" y="92" text-anchor="middle" class="fg-t sm">大致講得出來</text>
<rect x="480" y="40" width="170" height="80" rx="8" class="fg-b hot"/><text x="565" y="70" text-anchor="middle" class="fg-t acc">盒子三：每週</text><text x="565" y="92" text-anchor="middle" class="fg-t sm">講得又順又深</text>
<line x1="200" y1="62" x2="247" y2="62" class="fg-l on"/><polygon points="255,62 247,57.5 247,66.5" class="fg-a on"/>
<line x1="425" y1="62" x2="472" y2="62" class="fg-l on"/><polygon points="480,62 472,57.5 472,66.5" class="fg-a on"/>
<text x="228" y="30" text-anchor="middle" class="fg-t sm acc">9 分以上</text><text x="453" y="30" text-anchor="middle" class="fg-t sm acc">9 分以上</text>
<path d="M565 120 V156 H115 V128" class="fg-l warm"/><polygon points="115,120 110.5,128 119.5,128" class="fg-a warm"/>
<line x1="340" y1="120" x2="340" y2="156" class="fg-l warm"/>
<text x="340" y="176" text-anchor="middle" class="fg-t sm warm">低於 6 分：不管在哪個盒子，都回到盒子一</text>
<text x="340" y="198" text-anchor="middle" class="fg-t sm">6 到 8 分：留在原來的盒子</text>
</svg><figcaption>這是學習科學裡的間隔複習，跟第 9.2 課深入章節的讀書方法同一個道理：把力氣花在還不會的題目上，會的題目只要偶爾確認沒忘。</figcaption></figure>
<h4>好用的英文句型</h4>
<table>
<tr><th>情境</th><th>英文</th></tr>
<tr><td>先給結論</td><td>The short answer is..., and the longer answer depends on...</td></tr>
<tr><td>預告結構</td><td>There are three things I'd check, in this order.</td></tr>
<tr><td>確認題意</td><td>Just to make sure I understand: are you asking about..., or...?</td></tr>
<tr><td>爭取思考時間</td><td>Let me think about that for a second.</td></tr>
<tr><td>講取捨</td><td>The trade-off is... I'd choose X here because...</td></tr>
<tr><td>沒做過但會推理</td><td>I haven't run that in production, but here's how I'd approach it.</td></tr>
<tr><td>接上自己的經驗</td><td>On my own platform, I ran into this when...</td></tr>
</table>
<p>還有幾個常被念錯、一念錯就很顯眼的名詞：cache 念起來跟 cash 一樣；nginx 念 engine-x；etcd 念 et-see-dee；Kubernetes 的重音在 ne（koo-ber-NET-eez）。不確定的詞，查官方的念法，或聽幾場該專案的公開演講。</p>
<p>最後，找一個人陪你練。一個朋友、一個也在求職的工程師，每週一次，互相用題庫面試對方三十分鐘。自己練是練「講得出來」，跟人練才是練「被打斷、被追問時還講得下去」。</p>

<h3>八、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>參考答案背熟就夠了</td><td>面試官一追問，背的答案就斷了。要準備的是三層的理解，加上追問樹上的每個名詞。</td></tr>
<tr><td>答得越長，顯得越懂</td><td>長答案會吃掉面試官想問的下一題。先交第一層，讓他選方向。</td></tr>
<tr><td>英文要很流利才去面試外商</td><td>面試官要的是清楚，不是漂亮。有結構的簡單英文，勝過流利但沒重點的長句。</td></tr>
<tr><td>在心裡默講就等於練過</td><td>默講會自動跳過卡住的地方。只有出聲、錄音、看逐字稿，才看得到真正的問題。</td></tr>
<tr><td>沒做過的題目只能說不會</td><td>說「沒在正式環境做過」，然後用你懂的原理推理一個做法，是很好的答案。</td></tr>
</table>

<h3>九、跟你的工作連起來</h3>
<ul>
<li><b>前端工程師</b>：網路題（DNS、TLS、HTTP、CDN）你每天都碰得到，打開瀏覽器的開發者工具，看一個請求的時間分段，就是 N1 的第三層例子。</li>
<li><b>遊戲工程師</b>：TCP 與 UDP、連線數、記憶體不足被殺，這些在遊戲伺服器上都很具體。用你的遊戲當例子講，面試官通常很有興趣。</li>
<li><b>後端工程師</b>：K2 的資源限制、N3 的連線重用、C2 的成本，都可以拿你部署過的 Node.js 或 Go 服務來驗證：量一次記憶體曲線，數一次 TIME_WAIT，看一次帳單。</li>
<li>每一題的第三層，都應該盡量換成<b>你自己系統上的例子</b>。這也是上一課最後那句話的意思：「On my own platform I found...」比任何教科書答案都有說服力。</li>
</ul>

<h3>十、面試會怎麼問</h3>
<p>除了深入題，很多面試會有一段<b>快問快答</b>：面試官連續丟出短題目，看你的基本功是否扎實。每題一兩句就要答完。</p>
<ol>
<li>「What is the difference between a 502 and a 504?」（502 和 504 有什麼不同？）</li>
<li>「What is the difference between kill and kill -9?」（kill 和 kill -9 有什麼不同？）</li>
<li>「What does chmod 640 mean?」（chmod 640 是什麼意思？）</li>
<li>「What is the difference between a Docker image and a container?」（映像檔和容器有什麼不同？）</li>
<li>「Explain Kubernetes to a non-engineer in one sentence.」（用一句話跟非工程師解釋 Kubernetes。）</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>兩個都是代理或負載平衡器回的。502 Bad Gateway 是它從後端拿到無效的回應，或根本連不上（例如後端當掉、連線被拒）；504 Gateway Timeout 是後端在時限內沒有回應（例如後端卡住或太慢）。前者先查後端活著沒，後者先查後端為什麼慢。</li>
<li>kill 預設送 SIGTERM，行程可以攔截它，做完清理（關連線、寫完檔案）再結束；kill -9 送 SIGKILL，無法攔截，立刻結束，什麼都來不及清。所以先用 SIGTERM，等一段時間沒反應才用 SIGKILL。Kubernetes 停止 Pod 也是這個順序。</li>
<li>擁有者可讀可寫（6）、群組可讀（4）、其他人沒有任何權限（0）。常用在設定檔：服務的群組讀得到，其他使用者讀不到。</li>
<li>映像檔是唯讀的範本，由一層一層的檔案系統組成；容器是映像檔執行起來的實體，多了一層可寫的層和自己的行程、網路、資源限制。一個映像檔可以同時跑很多個容器。</li>
<li>例如：「It's an automatic manager for many servers: you tell it what should be running, and it keeps making reality match, restarting or moving things when they fail.」重點是抓住「期望狀態，自動維持」這個核心，而不是列名詞。</li>
</ol>
</details>

<h3>十一、練功題（做得出來才算真的懂）</h3>
<ol>
<li>從上一課的題庫挑一題，寫出它的三層答案：第一層兩三句英文、第二層的機制、第三層一個你自己的例子。</li>
<li>替題庫第 7 題「容器和虛擬機有什麼不同」畫一棵追問樹，至少三個分支、兩層深。哪一個名詞你接不住？</li>
<li>照本章的練習循環，錄一題 K2 的英文答案，轉成文字，用評分表打分數。最低的是哪一項？改寫後再錄一次。</li>
<li>做一份三個盒子的複習表（試算表就可以），把上一課的 26 題和本章的題目全部放進盒子一，連續練一週，記下每題的分數和移動。</li>
<li>挑三題，把第三層的例子換成「On my own platform...」開頭的真實經驗。如果某一題你沒有真實經驗，設計一個在練習環境裡一個晚上做得完的小實驗來補。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>檢查第一層：只聽這兩三句，面試官知道你的結論了嗎？檢查第二層：有沒有講到「為什麼」，而不只是換一種說法重複第一層？第三層如果寫不出自己的例子，就是你下一個要做的練習。</li>
<li>常見的分支：命名空間（追問：有哪幾種？）、cgroups（追問：記憶體超過會怎樣？）、共用核心（追問：所以容器逃逸為什麼危險？）、啟動速度（追問：映像檔層怎麼快取？）。你在第一層提到、卻接不住的那個名詞，要嘛補起來，要嘛先不提。</li>
<li>多數人第一次最低的是「結構」或「英文與長度」：第一句不是結論，或講超過三分鐘。改寫時只改最差的那一項，下一次錄音就會明顯不同。</li>
<li>一週後，你會清楚看到哪幾題一直留在盒子一。那幾題通常不是英文的問題，而是第二層的機制還沒真的懂，回到對應的課程章節重讀。</li>
<li>小實驗的例子：在 kind 叢集裡故意把容器的記憶體上限設得很低，觀察 OOMKilled 和 137；寫一個每次都開新連線的小程式，用 <code>ss -s</code> 看 TIME_WAIT 增加。做過一次，你就有了真實的第三層。</li>
</ol>
</details>

<h3>十二、想再挖深</h3>
<ul>
<li><b>Ilya Grigorik《High Performance Browser Networking》</b>（<a href="https://hpbn.co/">hpbn.co</a>，可免費線上閱讀）：TCP、TLS、HTTP 的第二、三層答案幾乎都在這本書裡。</li>
<li><b>Julia Evans 的部落格與小誌</b>（<a href="https://jvns.ca/">jvns.ca</a>）：用很白話的方式講 Linux、網路和除錯工具，最適合拿來補「機制」那一層。</li>
<li><b>Kubernetes 官方文件的 Concepts 章節</b>（<a href="https://kubernetes.io/docs/concepts/">kubernetes.io/docs/concepts</a>）：控制器、排程、資源管理的權威說明。</li>
<li><b>OWASP Cheat Sheet Series</b>（<a href="https://cheatsheetseries.owasp.org/">cheatsheetseries.owasp.org</a>）：檔案上傳、身分驗證、OAuth 等主題的防禦清單，資安題的標準參考。</li>
<li><b>AWS Well-Architected Framework</b>（<a href="https://aws.amazon.com/architecture/well-architected/">aws.amazon.com/architecture/well-architected</a>）：雲端架構題的取捨框架，C1 和 C2 的延伸閱讀。</li>
</ul>
` });
