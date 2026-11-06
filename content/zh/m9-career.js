MZ({
  id: 'job',
  title: '沒有學歷，怎麼被錄取',
  time: '早點讀，之後常回來看',
  blurb: '什麼能取代學歷：實績證明、照對的順序考對的證照，還有面試練習。先讀這個模組，才知道自己要瞄準什麼。',
  lessons: [
  {
    id: 'job-map',
    title: '職缺地圖，以及沒有學歷的人該走的路',
    body: `
<p>學歷在求職時只做一件事：在雇主還沒見到你之前，先告訴他你大概懂基本功。沒有學歷，你就得用別的方式送出這個訊號。這個模組講的就是這些方式。</p>
<h3>有哪些職位</h3>
<table>
<tr><th>職位</th><th>工作內容</th><th>模組</th><th>適不適合開發者</th></tr>
<tr><td><b>DevOps／平台工程師（platform engineer）</b></td><td>管線（pipeline）、基礎設施即程式碼（infrastructure as code）、Kubernetes、雲端</td><td>1 到 4</td><td>很適合。會寫程式是硬性條件。</td></tr>
<tr><td><b>網站可靠性工程師（site reliability engineer）</b></td><td>可靠性、容量、事故、值班待命（on-call）、自動化</td><td>1 到 4、8</td><td>很適合，但要求更深。</td></tr>
<tr><td><b>雲端工程師／架構師（cloud engineer / architect）</b></td><td>在雲端供應商的平台上設計並建置系統</td><td>0、1、3、5、8</td><td>很適合。</td></tr>
<tr><td><b>雲端或應用程式安全工程師（cloud or application security engineer）</b></td><td>保護系統和程式碼的安全，在管線裡加上工具</td><td>5、6，再加 1 到 3</td><td>很適合，而且需求很大。</td></tr>
<tr><td><b>滲透測試人員（penetration tester）</b></td><td>經過授權的攻擊，以及寫報告</td><td>5、6，再加上很多小時的實作練習（lab）</td><td>有機會。入門職缺競爭激烈。</td></tr>
<tr><td><b>SOC 分析師（SOC analyst）</b></td><td>盯著警報做分級判讀（triage），常要輪班</td><td>6</td><td>入門職位。對有經驗的開發者來說是往下走一階。</td></tr>
<tr><td><b>MIS／IT 管理員（IT administrator）</b></td><td>帳號、裝置、辦公室網路、技術支援</td><td>7、1</td><td>傳統公司的職缺很多。天花板比較低。</td></tr>
</table>
<h3>什麼能取代學歷</h3>
<ol>
<li><b>經驗。</b>你不是從零開始。多年來把真實的軟體交到真實使用者手上，正是大多數有學歷的應徵者缺的東西。你是在重新定位自己，這比從頭來過容易得多。</li>
<li><b>實績證明（proof of work）。</b>雇主可以直接看的東西：技術文章（write-up）、程式碼儲存庫（repository）、儀表板、報告（第 9.3 課）。這是最強的替代品，而且不用花錢。</li>
<li><b>證照（certificate）。</b>有些自動篩選本來會要求學歷，有證照就過得了（第 9.2 課）。</li>
<li><b>人脈。</b>雇主信得過的人推薦你一句，勝過所有文件。</li>
</ol>
<h3>橋接職位（bridge job）</h3>
<p>最難的走法，是職位和雇主一起換，還頂著一個你從沒掛過的新職稱。比較容易的走法分兩步：</p>
<ol>
<li>先找一個七成是你已經做得好的事、三成是新領域的職位：例如在某個團隊當全端或前端，同時也負責管線、部署和雲端設定。或者就在你現在的工作裡這樣做。</li>
<li>一年後，你在新的名目底下就有了真實的正式環境（production）經驗，第二次換就只是一次普通的轉職。</li>
</ol>
<h3>深入一點：沒有學歷在哪裡會有影響</h3>
<table>
<tr><th>雇主</th><th>態度</th></tr>
<tr><td>外商和遠端職位</td><td>很少問。他們在面試裡考實力。</td></tr>
<tr><td>新創和產品公司</td><td>在意你做出過什麼。</td></tr>
<tr><td>大型傳統公司</td><td>人資可能會用學歷篩人。靠內部推薦（referral）或證照可以過關。</td></tr>
<tr><td>政府機關和受監管的金融業</td><td>常有正式的資格規定。資安職位的話，官方清單上的證照非常有分量。</td></tr>
</table>
<p>先瞄準前兩列。薪水最高的也在這裡。</p>
<h3>深入一點：老實說要多久</h3>
<p>以一個有正職、每週讀五個晚上的開發者來說：大約三個月，別人會相信你做得了橋接職位；大約六個月，可以成為 DevOps 或雲端安全職位的真正人選；在這樣的職位上做一到兩年，「資深」兩個字才算名副其實。專家等級來自多年維運正式環境的經驗，光靠讀書催不出來。</p>`,
    own: `寫下表格裡你第一個要瞄準的職位，還有市場：台灣，或是替外商遠端工作。然後寫下你的橋：哪一份工作，或是現職裡哪一項額外的責任，可以讓你在三個月內把真正的 DevOps 或資安工作放進你的資歷？`,
    quiz: [
      { q: "什麼是學歷最強的替代品？",
        a: ["更長的履歷", "雇主可以直接看的實績證明", "課程結業徽章", "個人 logo"],
        why: "學歷只能暗示的事，它直接攤開來給人看：你做得了這份工作。" },
      { q: "什麼是橋接職位？",
        a: ["到國外的短期約聘", "大部分是你已經做得好的事，再加上一部分新領域的職位", "無薪實習", "營造業的工作"],
        why: "它讓你不必從最底層做起，就能把新領域的真實經驗放進資歷。" }
    ]
  },
  {
    id: 'job-certs',
    title: '證照，以及考的順序',
    body: `
<p>證照（certificate）有兩個作用。一是讓你通過那些本來會要求學歷的篩選，二是顯示你有系統地讀完了一整套知識。它不能證明你做得了這份工作，那是作品集（portfolio）和面試的事。所以證照考少一點、挑準一點，而且讀書的同時，手上的實作千萬不要停。</p>
<h3>建議的順序</h3>
<table>
<tr><th>證照</th><th>證明什麼</th><th>考試形式</th><th>大概費用</th></tr>
<tr><td><b>1. AWS Solutions Architect Associate</b></td><td>你會在 AWS 上設計系統</td><td>選擇題（multiple choice），大約兩小時</td><td>約 US$150</td></tr>
<tr><td><b>2. CKA</b>（Certified Kubernetes Administrator）</td><td>你會維運 Kubernetes</td><td>兩小時，在真實的叢集上動手完成任務</td><td>約 US$400 到 450，含一次重考（retake）</td></tr>
<tr><td><b>3a. CompTIA Security+</b></td><td>國際通用的資安基本門檻</td><td>選擇題加實作題</td><td>約 US$400</td></tr>
<tr><td><b>3b. iPAS 資訊安全工程師</b></td><td>台灣認可的資安基本門檻。分兩級：初級和中級。</td><td>筆試，用中文考</td><td>低</td></tr>
</table>
<p>價格會變。付錢之前先看官方頁面。有些雇主會補助考試費，等你進了橋接職位之後很值得問一下。</p>
<h3>為什麼是這個順序</h3>
<ul>
<li><b>先考 AWS。</b>它是國際證照裡最便宜的，到哪裡都有人認得，而且準備的過程會把模組 0、1、3、8 再鞏固一遍。</li>
<li><b>再考 CKA。</b>它是實作考試（practical exam），靠背的考不過。雇主就是因為這樣才看重它。對 DevOps 職位來說，它是最強的單一訊號。</li>
<li><b>第三張考一張資安基本門檻的證照。</b>瞄準外商或遠端雇主就考 3a，瞄準台灣的雇主就考 3b。兩張都曾列在台灣的官方清單上。報名之前先查最新的清單，也確認它列的是 iPAS 的哪一級。</li>
</ul>
<h3>台灣的官方清單</h3>
<p>依照《資通安全管理法》，政府機關和特定非公務機關的資安人員必須持有公告清單上的證照（資通安全專業證照清單，由數位發展部資通安全署維護）。清單裡列過 Security+、CEH、CISSP、ISO 27001 Lead Auditor、iPAS 資訊安全工程師等等，而且會不定期修訂。如果你的目標是公部門、關鍵基礎設施或金融業，就從這份清單裡挑。</p>
<h3>之後依方向再考</h3>
<table>
<tr><th>方向</th><th>證照</th><th>備註</th></tr>
<tr><td>DevOps</td><td>Terraform Associate</td><td>便宜又快</td></tr>
<tr><td>Kubernetes 安全</td><td>CKS</td><td>要先有 CKA</td></tr>
<tr><td>雲端安全</td><td>AWS Security Specialty</td><td></td></tr>
<tr><td>滲透測試</td><td>OSCP</td><td>24 小時的實作考試。業界公認的標準。</td></tr>
<tr><td>合規</td><td>ISO 27001 Lead Auditor</td><td>五天的課程加考試。在台灣很常見。</td></tr>
<tr><td>資安主管</td><td>CISSP</td><td>需要五年支薪的資安工作經驗。可以先把考試考過，在那之前先掛「Associate」身分。</td></tr>
</table>
<h3>怎麼準備一張證照</h3>
<ol>
<li>下載官方的考試大綱（exam guide）。上面列出每個主題和它佔的比重。</li>
<li>把每個主題對應到這裡的某一課，對不上的缺口就讀官方文件補起來。</li>
<li>實作考試的話，就在真實的系統上練到那些任務變成例行公事。買 CKA 考試會附考試模擬器的練習場次。</li>
<li>做計時的模擬考。能穩定通過之後，再去預約正式考試。</li>
</ol>
<h3>如果手頭很緊</h3>
<p>先做作品集。它不用錢，分量還更重。然後挑你目標雇主認可的證照裡最便宜的那張去考。其他的等你有了橋接職位的收入，或是有雇主幫你出錢再說。</p>`,
    own: `下載 AWS Solutions Architect Associate 的官方考試大綱。把主題清單看過一遍，每一項標上綠色（我講得出來）、黃色（聽過）或紅色（沒碰過）。黃色和紅色的項目就是你的讀書清單。每一張證照在付錢之前都這樣做一次。`,
    quiz: [
      { q: "證照主要的用處是什麼？",
        a: ["證明你做得了這份工作", "通過求職篩選，並顯示你有系統地讀完一個領域", "取代面試", "保證薪水"],
        why: "能力要靠實績證明和面試來展現。證照是讓你走得到那一關。" },
      { q: "為什麼雇主看重 CKA，勝過大多數考選擇題的證照？",
        a: ["它比較貴", "它是在真實叢集上動手做的考試，靠背的考不過", "它比較短", "它比較老牌"],
        why: "它考的是你能不能在時間壓力下把任務做出來。" },
      { q: "能花的錢很少時，先做什麼？",
        a: ["最貴的那張證照", "先做作品集，再考最便宜又廣受認可的那張", "同時考三張證照", "付費的訓練營"],
        why: "作品集不用錢，而且分量最重。" }
    ]
  },
  {
    id: 'job-portfolio',
    title: '作品集：實績證明',
    body: `
<p>你有大多數應徵者沒有的東西：真實的系統、真實的使用者，而且是你自己在維運。這門課每一課的「用你自己的系統練習」都是特別挑過的：寫成技術文章（write-up）之後，就是雇主讀得到的證據。這一課把它們收在一起。</p>
<div class="widget" data-w="ready"></div>
<h3>每一件作品該有什麼</h3>
<table>
<tr><th>作品</th><th>內容</th><th>出自哪一課</th></tr>
<tr><td>架構技術文章</td><td>一張圖、請求走的路徑、每個元件的工作、每個元件故障時會怎樣，以及你下一步想改什麼</td><td>1.1、8.4</td></tr>
<tr><td>基礎設施儲存庫（repository）</td><td>能從零把一個服務建起來的程式碼、一條管線，再加一份別人照著做得出來的說明文件（README）</td><td>2.5、2.6</td></tr>
<tr><td>監控</td><td>儀表板的截圖、警報規則，再用一段話說明為什麼是那四個訊號</td><td>4.1</td></tr>
<tr><td>事後檢討（postmortem）</td><td>六個段落。老實寫出哪裡出了錯。</td><td>4.3</td></tr>
<tr><td>負載測試報告</td><td>方法、圖表、瓶頸、做了什麼修改、改完的結果</td><td>4.4</td></tr>
<tr><td>威脅模型和一項修正</td><td>資產、攻擊路徑，以及一個你消除掉的風險，附上前後對照</td><td>5.1、5.4</td></tr>
<tr><td>還原演練</td><td>還原了什麼、花了多久、事後改了什麼</td><td>4.5</td></tr>
<tr><td>資安評估</td><td>範圍、附上嚴重程度和證據的發現事項、修正方式</td><td>5.2、6.3</td></tr>
</table>
<h3>怎麼寫</h3>
<ul>
<li><b>每件一頁。</b>審閱的人大概只會給一份作品集（portfolio）五分鐘。</li>
<li><b>開頭先講結果，而且要有數字。</b>「加了一個索引和一個連線池代理，把 p95 延遲從 900 ms 降到 140 ms。」</li>
<li><b>把你的推理寫出來。</b>你考慮過什麼、選了什麼、為什麼。資深和資淺的差別就在這裡。</li>
<li><b>把出錯的地方也寫進去。</b>一份樣樣都成功的報告，讀起來就像沒被考驗過。</li>
<li><b>用英文寫</b>，如果你瞄準的是外商。它同時也證明你的英文能用在工作上。</li>
</ul>
<h3>發布在哪裡</h3>
<p>個人的 GitHub 帳號，置頂一個連到所有作品的儲存庫；或是一個小小的個人網站。絕對不要放在雇主的程式碼託管平台上，也絕對不要放任何屬於雇主的東西。</p>
<h3>公開任何東西之前</h3>
<div class="warn">
<ul>
<li>拿掉所有機密、金鑰、真實的 IP 位址和內部主機名稱。除了最新版本，git 的歷史紀錄也要檢查。</li>
<li>拿掉任何屬於雇主或客戶的東西。</li>
<li>從工程的角度描述系統：「具備鏈上支付的即時多人平台」、「會持續保存世界狀態的遊戲伺服器」。有些雇主會篩掉特定產業，所以開頭先講技術問題，標題裡不要放產品類別。</li>
<li>線上系統裡還沒修好的弱點，細節不要公開。修好之後再發表。</li>
</ul>
</div>
<h3>深入一點：自架練習環境（home lab）</h3>
<p>如果你自己的系統涵蓋不到某個主題，就為它架一個小型的練習環境：用最便宜的雲端機器架一個三節點的 k3s 叢集跑一個週末、一個故意留了漏洞的應用程式拿來測、一套 Prometheus。照同樣的方式寫成技術文章。算數的是那篇文章，練習環境事後可以刪掉省錢。</p>`,
    own: `挑一件你最快能完成的。對多數人來說是事後檢討或架構技術文章，因為這兩件寫的都是已經存在的東西。這個禮拜就寫出來，一頁，然後在上面的清單把它勾起來。完成一件，勝過計畫八件。`,
    quiz: [
      { q: "作品集裡的一件作品該怎麼開頭？",
        a: ["從你的人生故事講起", "從結果講起，並且附上數字", "列出你會的所有工具", "先道歉"],
        why: "審閱的人只有幾分鐘。看到成果，他馬上就知道要不要繼續讀。" },
      { q: "發布儲存庫之前，一定要檢查什麼？",
        a: ["commit 數量夠不夠多", "裡面沒有機密、真實位址或雇主的財產，歷史紀錄也一樣", "有沒有用最新的框架", "README 夠不夠長"],
        why: "作品集裡漏出一把金鑰，給人的印象跟你想要的完全相反，而 git 的歷史紀錄什麼都留著。" }
    ]
  },
  {
    id: 'job-interview',
    title: '履歷與面試',
    body: `
<h3>把經驗寫成履歷（resume）上的句子</h3>
<p>每一條都照同一個模式：<b>你做了什麼、用數字衡量，以及怎麼做到的</b>。比較一下：</p>
<table>
<tr><th>弱</th><th>強</th></tr>
<tr><td>負責伺服器維護</td><td>把 [N] 個容器化服務從 [X] 台機器整併到一台主機上，雲端支出減少 [Y]%，資料零遺失</td></tr>
<tr><td>修正效能問題</td><td>追查 WebAssembly 遊戲用戶端在瀏覽器裡記憶體不足而當掉的問題，找出原因是堆積（heap）持續成長；加上記憶體上限和自動復原機制後，在 25 分鐘的壓力測試裡不再當掉</td></tr>
<tr><td>參與資安工作</td><td>稽核 [N] 個儲存庫，找出 [K] 個高風險問題，並把所有服務共用的那把簽章金鑰，換成一個獨立隔離、會強制執行支出限額的簽章服務</td></tr>
<tr><td>做過部署</td><td>透過層層把關的流程（回歸測試、瀏覽器驗證、分階段的候選版本）發布了 [N] 次正式環境版本，回復上一版只要不到 [M] 分鐘</td></tr>
</table>
<p>你的要從自己真正做過的工作來寫，用真實的數字。絕對不要編：面試官每個數字都會問。</p>
<h3>履歷的樣子</h3>
<ul>
<li>一到兩頁。最上面的三分之一，決定剩下的會不會被讀。</li>
<li>兩行摘要，對準你要應徵的職位：「軟體工程師，正轉往平台與資安領域，有在 AWS 上維運即時系統的正式環境經驗。」</li>
<li>技能照職缺（job posting）上的分法來分組：雲端、容器、自動化、資料、可觀測性、資安。</li>
<li>作品集的連結放在靠近最上面的地方。</li>
<li>學歷放最後，簡短帶過。證照放在它上面。</li>
</ul>
<h3>五種面試</h3>
<table>
<tr><th>類型</th><th>會問什麼</th><th>怎麼準備</th></tr>
<tr><td><b>系統設計面試（system design interview）</b></td><td>「設計一個給一百萬使用者用的聊天服務。」</td><td>第 8.4 課的八個步驟。計時、開口練。</td></tr>
<tr><td><b>故障排查（troubleshooting）</b></td><td>「使用者說網站很慢。你怎麼辦？」</td><td>照第 1.1 課的請求路徑走一遍。問什麼東西變了。檢查四個訊號。</td></tr>
<tr><td><b>實機操作（hands-on）</b></td><td>給你一台壞掉的 Linux 機器或叢集，在他們面前修好</td><td>Killercoda 的情境題，練到指令不用想就打得出來</td></tr>
<tr><td><b>資安情境（security scenario）</b></td><td>「審查這個設計。」「有一把金鑰外洩了。現在怎麼辦？」</td><td>第 5.1 課的威脅模型分析、第 6.5 課的事件應變步驟</td></tr>
<tr><td><b>行為面試（behavioural interview）</b></td><td>「講一次你遇過的事故。」「講一次你跟人意見不合的經驗。」</td><td>準備五個真實的故事：情境、你做了什麼、結果、學到什麼</td></tr>
</table>
<h3>技術面試時該怎麼表現</h3>
<ul>
<li><b>邊想邊講。</b>你不出聲，面試官就沒有東西可以打分數。</li>
<li><b>先發問。</b>釐清需求本身就是答案的一部分。</li>
<li><b>講出你的假設（assumption）和取捨（trade-off）。</b>「我會先用一台資料庫加副本，因為寫入量不高。如果成長十倍，我會按使用者做分割。」</li>
<li><b>用數字講話。</b></li>
<li><b>不會的時候就說不會，並且說你會怎麼查出來。</b>不懂裝懂是唯一一件肯定會讓面試失敗的事。</li>
</ul>
<h3>深入一點：怎麼回答「你沒有學歷」</h3>
<p>只回答一次，簡短，然後轉到證據上：「我是在工作中、在動手做的過程裡學的。這是我在正式環境維運的一個平台，這些是我怎麼監控它、保護它、擴展它的技術文章。」然後就停。不要道歉，也不要長篇解釋。</p>
<h3>深入一點：可以反問他們的問題</h3>
<ul>
<li>你們多久發布一次？發布出問題的時候會怎麼處理？</li>
<li>值班待命是什麼樣子？大家多常被叫醒？</li>
<li>講講你們上一次的事故，以及事後改了什麼。</li>
<li>前三個月我會負責什麼？</li>
</ul>
<p>從他們的回答，你就知道這份工作能不能讓你學到東西。</p>`,
    own: `把你現在履歷上的三條，照「強」的模式用真實的數字重寫。然後準備一個事故的故事，分成四段（情境、你做了什麼、結果、學到什麼），用英文在兩分鐘內講完。錄一次音，再聽一遍。`,
    quiz: [
      { q: "哪一條履歷最強？",
        a: ["負責資料庫", "熟悉多種技術", "加了一個索引和一個連線池代理，把 p95 延遲從 900 ms 降到 140 ms", "工作認真、有團隊精神"],
        why: "它講了做了什麼、量得出來的結果，還有方法。" },
      { q: "技術面試時被問到你不會的東西。最好的回應是什麼？",
        a: ["很有自信地猜", "說你不會，並說明你會怎麼查出來", "轉移話題", "保持沉默"],
        why: "誠實加上方法，正是這份工作本身需要的。不懂裝懂通常會被看穿。" },
      { q: "被問到「使用者說網站很慢」，回答該從哪裡開始？",
        a: ["重啟所有伺服器", "先問什麼東西變了，再沿著請求路徑走一遍，同時檢查延遲、流量、錯誤和飽和度", "怪網路", "加更多伺服器"],
        why: "有方法，看得出經驗。還沒搞懂就動手，給人的印象正好相反。" }
    ]
  },
  {
    id: 'job-bank',
    title: '面試題庫',
    body: `
<p>這些題目在 DevOps、SRE 和資安的面試裡一再出現。每一題都先自己用英文把答案講出來，再打開參考答案（model answer）。參考答案是刻意寫短的。面試時先用兩三句話講重點，對方追問了再往下講。</p>
<h3>網路與 Linux</h3>
<details class="reveal"><summary>1. What happens when you type a URL and press Enter?　輸入網址按下 Enter 之後發生什麼事？</summary><p>瀏覽器先透過 DNS 把名稱解析成位址，建立 TCP 連線，再做 TLS 交握（handshake），伺服器在交握中用憑證（certificate）證明自己的身分。接著瀏覽器送出 HTTP 請求，這個請求可能由 CDN 直接回應，也可能經過負載平衡器（load balancer）轉給應用程式伺服器，再由它去查快取或資料庫。回應沿著同一條路回來，瀏覽器解析 HTML、抓取其他資源，然後把頁面畫出來。每一步我都可以再講得更深。</p></details>
<details class="reveal"><summary>2. What is the difference between TCP and UDP?　TCP 和 UDP 有什麼不同？</summary><p>TCP 是一條連線，保證資料送達而且順序正確，代價是要先交握，封包遺失時還得等。UDP 送的是各自獨立的訊息，不做任何保證，也沒有延遲。TCP 適合網頁流量和資料庫。UDP 適合 DNS、語音、視訊和節奏快的遊戲，HTTP/3 也是建在它上面。</p></details>
<details class="reveal"><summary>3. A user says the site is slow. How do you investigate?　使用者說網站很慢，你怎麼查？</summary><p>我會先問影響範圍有多大，還有最近改了什麼。接著看每一層的四個訊號：延遲、流量、錯誤、飽和度。我會沿著請求路徑找出延遲開始變高的第一層，再到那一層裡面看它是在拚命工作還是在等：CPU、連線池、慢查詢、某個相依服務。如果最近某次發布的時間剛好對上問題開始的時間，我會先回復上一版，之後再調查。</p></details>
<details class="reveal"><summary>4. What is the difference between &ldquo;connection refused&rdquo; and a timeout?　「connection refused」和逾時（timeout）有什麼不同？</summary><p>連線被拒（connection refused）表示那台機器有回應，只是那個連接埠上沒有東西在聆聽，所以我會檢查行程有沒有在跑、它聆聽的是哪個位址。逾時表示沒有任何回應回來，通常是防火牆或安全群組（security group）把封包丟掉了，或是位址錯了。</p></details>
<details class="reveal"><summary>5. A server's disk is full. What do you do?　伺服器的磁碟滿了，你怎麼處理？</summary><p>我用 df 和 du 找出是什麼佔了空間，通常是日誌或舊的映像檔。然後安全地騰出空間：壓縮或截斷日誌、清掉沒在用的映像檔。如果刪了檔案空間卻沒回來，就是有行程還開著那個檔案，需要重啟它。接著用日誌輪替（log rotation）和定期清理把根本原因（root cause）解決掉，並加上用到 80% 就通知的警報。</p></details>
<details class="reveal"><summary>6. What does load average mean?　平均負載（load average）是什麼意思？</summary><p>它大致是正在執行或等著執行的工作數量，分別取 1、5、15 分鐘的平均。我會拿它跟 CPU 核心數比。超過核心數，就表示有工作在排隊。在 Linux 上它也把等磁碟的工作算進去，所以負載很高但 CPU 很閒，指向的是 I/O 問題。</p></details>
<h3>容器、Kubernetes 與自動化</h3>
<details class="reveal"><summary>7. How does a container differ from a virtual machine?　容器和虛擬機有什麼不同？</summary><p>虛擬機（virtual machine）在虛擬硬體上跑自己的作業系統。容器（container）則是主機核心（kernel）上的一個行程，用命名空間（namespace）隔離、用 cgroups 限制資源。容器不到一秒就能啟動，而且很輕。但它的隔離比較弱，所以像特權模式（privileged mode）或掛載 Docker socket 這類設定很危險。</p></details>
<details class="reveal"><summary>8. A pod is in CrashLoopBackOff. How do you debug it?　有個 pod 卡在 CrashLoopBackOff，你怎麼除錯？</summary><p>我會對那個 pod 執行 kubectl describe 看它的事件，再用 kubectl logs 加上 previous 旗標，看上一個容器為什麼結束。常見的原因是設定值有錯、少了機密（secret）、相依服務連不上、探針（probe）失敗，或是撞到記憶體上限。如果日誌是空的，我會用 shell 啟動那個映像檔，或是掛一個除錯容器上去。</p></details>
<details class="reveal"><summary>9. What is the difference between liveness and readiness probes?　存活探測（liveness）和就緒探測（readiness）有什麼不同？</summary><p>存活探測失敗，Kubernetes 會重啟容器。就緒探測失敗，只會把 pod 從 Service 裡移除，讓它收不到流量。存活探測應該只檢查行程本身。如果它去檢查共用的相依服務，那個服務一打嗝，所有 pod 都會被重啟。</p></details>
<details class="reveal"><summary>10. How do you deploy with zero downtime?　怎麼做到零停機部署？</summary><p>用滾動更新（rolling update）或金絲雀發布（canary）：新的執行個體要先通過就緒探測才接流量，舊的收到 SIGTERM 之後把連線排空。因為新舊程式碼會同時在跑，資料庫的變更要用先擴充、後收縮（expand-then-contract）的做法保持向後相容。發布之後我會盯著錯誤率和延遲，並且讓回復上一版只需要一個指令。</p></details>
<details class="reveal"><summary>11. What is Terraform state, and how does a team manage it?　Terraform 的狀態檔（state）是什麼？團隊怎麼管理它？</summary><p>狀態檔是 Terraform 對它管理的真實資源所做的紀錄，它靠這份紀錄算出哪些東西要改。團隊會把它放在共用的遠端儲存空間，並且加鎖，這樣兩個人就不會同時 apply。它絕不能 commit 進 git，因為裡面可能有機密。每個環境各有一份自己的狀態檔。</p></details>
<h3>資料與規模</h3>
<details class="reveal"><summary>12. How do you find and fix a slow query?　怎麼找出並修好慢查詢？</summary><p>我用慢查詢日誌或 pg_stat_statements 來找，依總耗時排序。然後跑 EXPLAIN ANALYZE 看執行計畫，找有沒有對大資料表做全表掃描（full scan），或是預估列數和實際列數差很多。修法通常是加一個符合篩選條件和排序順序的索引，或是改寫查詢，避開 N+1 呼叫或很深的 offset。改完再量一次。</p></details>
<details class="reveal"><summary>13. What is replication lag, and how do you handle it?　什麼是複寫延遲（replication lag）？怎麼處理？</summary><p>用非同步複寫時，副本會比主庫慢一點點，所以剛寫完馬上讀，可能讀到舊資料。我的做法是：使用者寫入之後的一小段時間內，把他的讀取送到主庫；像餘額這種關鍵資料則一律從主庫讀。我也會監控這個延遲，並對它設警報。</p></details>
<details class="reveal"><summary>14. How do you prevent a payment from being processed twice?　怎麼防止一筆付款被處理兩次？</summary><p>每個操作都帶一個冪等鍵（idempotency key），存的時候加上唯一約束，所以重複的請求查到這個鍵就什麼都不做。餘額的變動是一次原子性的條件式更新，或是在列鎖（row lock）底下做，而且包在一筆交易（transaction）裡。如果中間有佇列，我會假設它是至少一次傳遞（at-least-once delivery），並用同樣的方式讓消費端做到冪等。</p></details>
<details class="reveal"><summary>15. When would you shard a database, and what does it cost?　什麼時候才該對資料庫做分片（sharding）？代價是什麼？</summary><p>要等比較便宜的招數都用完之後：查詢調校、換更大的機器、快取、讀取副本、按功能拆分、分割表。分片的代價是跨分片的查詢和交易、重新平衡、熱點分片，還有維運工作要乘上分片的數量。我會選像使用者 ID 這樣的鍵：分布平均，而且幾乎每個查詢都會帶到它。</p></details>
<details class="reveal"><summary>16. What is a cache stampede, and how do you prevent it?　什麼是快取擊穿（cache stampede）？怎麼預防？</summary><p>一個熱門的鍵到期了，一大堆請求同時沒命中，全都跑去重建它，把資料庫灌爆。預防的做法是只讓一個請求去重建，其他的等它，或是先拿舊值；另外在到期時間上加一點隨機變化，讓鍵不會同時到期。</p></details>
<h3>可靠性</h3>
<details class="reveal"><summary>17. What are SLI, SLO and SLA?　SLI、SLO、SLA 各是什麼？</summary><p>SLI 是對使用者實際體驗的一項量測，例如請求快速成功的比例。SLO 是我們替它訂的目標，例如一個月內 99.9%。SLA 是帶有罰則的合約，訂得比 SLO 寬鬆。SLO 和 100% 之間的差距就是錯誤預算（error budget），它告訴我們該加快發布，還是該回頭顧穩定性。</p></details>
<details class="reveal"><summary>18. Tell me about an incident you handled.　講一個你處理過的事故。</summary><p>分成四段。情境：什麼壞了，用數字講影響。你做了什麼：怎麼發現的、怎麼止血、怎麼找到原因。結果：花多久恢復。事後改了什麼：具體的修正，以及現在抓得到它的那個警報。講系統的弱點，絕不怪罪任何人。這個故事要事先用真實的事件準備好。</p></details>
<details class="reveal"><summary>19. How do you decide what deserves an alert?　你怎麼決定什麼值得發警報？</summary><p>只有在使用者已經受影響或馬上就會受影響、而且必須有人立刻處理的時候，我才會把人叫起來。我針對症狀設警報，例如錯誤率和延遲，因為像 CPU 這類原因往往無害。每個警報都連到一份處理手冊（runbook）。任何響了卻沒有事情要人做的警報，不是修好就是拿掉。</p></details>
<h3>資安</h3>
<details class="reveal"><summary>20. How should passwords be stored?　密碼該怎麼儲存？</summary><p>用專門為此設計、又慢又加鹽（salt）的雜湊（hash）：argon2id 或 bcrypt。絕不用明文，絕不用可還原的加密，也絕不用 MD5 或單純的 SHA-256 這類快速雜湊。我還會在登入加上速率限制、比對已外洩的密碼，並加上第二道驗證。</p></details>
<details class="reveal"><summary>21. What is the difference between XSS and CSRF?　XSS 和 CSRF 有什麼不同？</summary><p>XSS 是攻擊者的腳本在受害者的瀏覽器裡、在我們的網站上執行，使用者能做的事它都能做。防禦方法是對輸出做跳脫（escape），並加上內容安全政策（content security policy）。CSRF 是別的網站讓受害者的瀏覽器帶著他的 cookie，向我們的網站送出請求。防禦方法是 SameSite cookie 和防 CSRF 權杖（token）。</p></details>
<details class="reveal"><summary>22. How do you manage secrets in production?　正式環境的機密怎麼管理？</summary><p>機密絕不放在 git 或映像檔裡。服務在執行時才從機密管理服務（secrets manager）取得，每個服務只拿得到自己的，而且每次讀取都留下紀錄。可以的話，我會用搭配短期憑證（temporary credentials）的角色，這樣就不存在長期有效的機密。機密按排程輪替，一旦懷疑外洩就立刻輪替。高價值的簽章金鑰只放在隔離的簽章服務或金鑰管理服務（key management service）裡。</p></details>
<details class="reveal"><summary>23. An AWS access key was pushed to a public repository. What do you do?　有一把 AWS 存取金鑰被推到公開的儲存庫，你怎麼辦？</summary><p>我會立刻停用並更換那把金鑰，因為它只要公開過，刪掉 commit 也沒用。我會查 CloudTrail，看那把金鑰做過的所有事，並找出攻擊者可能建立的資源或使用者。然後把金鑰從歷史紀錄裡清掉，加上機密掃描（secret scanning）防止再犯，再寫一份事後檢討（postmortem）。</p></details>
<details class="reveal"><summary>24. What is least privilege? Give an example.　什麼是最小權限（least privilege）？舉個例子。</summary><p>每個身分只拿到它的工作需要的權限，這樣就算被入侵，損害也有限。舉例來說，備份工作拿到的角色只能寫入某個 bucket 的某個路徑，其他什麼都不能做。它不會拿到管理員權限，而且用的是執行個體角色（instance role）發的短期憑證。</p></details>
<details class="reveal"><summary>25. Where are symmetric and asymmetric encryption used in TLS?　TLS 裡哪裡用對稱加密、哪裡用非對稱加密？</summary><p>非對稱加密（asymmetric encryption）用在一開始：憑證上的簽章證明伺服器的身分，金鑰交換（key exchange）讓雙方推導出一個共用的機密值（shared secret）。之後就用這把共用金鑰做快速的對稱加密（symmetric encryption）來保護資料。</p></details>
<details class="reveal"><summary>26. How would you secure a new Linux server that faces the internet?　一台面向網際網路的新 Linux 伺服器，你怎麼保護它？</summary><p>先套用更新，並開啟自動安全性修補。SSH 只允許用金鑰登入，禁止 root 登入，並限制或關閉那個連接埠。防火牆設成預設拒絕，只開需要的。服務用非 root 的使用者執行，沒用到的東西就移除。把日誌送到機器外面，加上監控和警報，並設好備份。最後我會從外面掃描一次，確認到底暴露了什麼。</p></details>
<h3>這一頁怎麼用</h3>
<p>每週把題目走一遍，直到每一題都能不看筆記、順順地講出來。然後把每個參考答案換成你自己系統上的例子。「On my own platform I found...」（在我自己的平台上，我發現……）比任何教科書答案都有說服力。</p>`,
    own: `從清單裡挑五題。每一題再寫第二個答案，開頭用「On my own platform...」（在我自己的平台上……），內容用你在這門課裡真正做過或發現的事。這五個答案，就是讓面試官記住你的東西。`,
    quiz: [
      { q: "有一把存取金鑰被推到公開的儲存庫。第一個動作是什麼？",
        a: ["刪掉那個 commit", "停用並更換金鑰", "把儲存庫改成私有", "等等看有沒有人用它"],
        why: "只要公開過，就要當成已經被偷。把它藏起來不代表它安全了。" },
      { q: "面試題的第一個回答該多長？",
        a: ["越長越好，展現知識量", "兩三句講重點，對方追問再深入", "一個字", "把這項技術的歷史完整講一遍"],
        why: "這顯示你知道什麼才重要，也讓面試官能把話題帶到他在意的地方。" }
    ]
  }
  ]
});
