DEEP({ 'pro-field': `
<p>上一課給了你一張資安職業的地圖，告訴你有藍隊、紅隊、應用程式安全、雲端安全、治理合規這幾種工作，也告訴你開發背景走 AppSec 或雲端安全最快。這一章把那張地圖放大：每一種工作一天真正在做什麼、需要哪些本事、在一間公司裡怎麼被組織起來、「資安工程」和「合規」到底差在哪、你手上這幾年的開發經驗可以換算成哪些資安能力，最後給你一條有里程碑的學習路線，和一套把「我會」變成「別人看得到我會」的做法。目標只有一個：讓你從「對資安有興趣」變成「履歷寄出去會有人找你面試」。</p>

<h3><span class="badge lv1">基礎</span>一、資安不是一種工作，是一間醫院</h3>
<p>很多人以為「資安工程師」是一個職位，就像「廚師」。其實它比較像「醫生」——你不會說「我要當醫生」就結束，你得選內科、外科、急診還是放射科。每一科用的腦袋、每天摸的東西、值不值班、適合什麼個性，差得很遠。資安也一樣。</p>
<figure class="figure"><svg viewBox="0 0 680 250" class="fg" style="width:100%;max-width:680px" role="img" aria-label="資安的五個領域並排：藍隊、紅隊、應用安全、雲端安全、治理合規，其中應用安全與雲端安全最適合開發者">
<text x="340" y="24" text-anchor="middle" class="fg-t lg">同一個「資安」，底下是五科</text>
<rect x="20" y="48" width="112" height="60" rx="8" class="fg-b"/><text x="76" y="76" text-anchor="middle" class="fg-t">藍隊</text><text x="76" y="96" text-anchor="middle" class="fg-t sm">防守·偵測</text>
<rect x="152" y="48" width="112" height="60" rx="8" class="fg-b"/><text x="208" y="76" text-anchor="middle" class="fg-t">紅隊</text><text x="208" y="96" text-anchor="middle" class="fg-t sm">授權攻擊</text>
<rect x="284" y="48" width="112" height="60" rx="8" class="fg-b hot"/><text x="340" y="76" text-anchor="middle" class="fg-t acc">應用安全</text><text x="340" y="96" text-anchor="middle" class="fg-t sm">看程式碼</text>
<rect x="416" y="48" width="112" height="60" rx="8" class="fg-b hot"/><text x="472" y="76" text-anchor="middle" class="fg-t acc">雲端安全</text><text x="472" y="96" text-anchor="middle" class="fg-t sm">身分·設定</text>
<rect x="548" y="48" width="112" height="60" rx="8" class="fg-b"/><text x="604" y="76" text-anchor="middle" class="fg-t">治理合規</text><text x="604" y="96" text-anchor="middle" class="fg-t sm">政策·稽核</text>
<text x="340" y="150" text-anchor="middle" class="fg-t sm">綠色這兩科，最吃「看得懂程式、懂系統怎麼蓋、會自動化」</text>
<line x1="340" y1="166" x2="340" y2="190" class="fg-l on dash"/><polygon points="340,198 335.5,190 344.5,190" class="fg-a on"/>
<rect x="190" y="200" width="300" height="38" rx="8" class="fg-b hot"/><text x="340" y="224" text-anchor="middle" class="fg-t acc">這正是你這幾年在練的東西</text>
</svg><figcaption>五科之中，應用安全和雲端安全最靠近開發。它們要的硬本事，你多半已經有了，差的是資安那一層知識。</figcaption></figure>
<p>先用一句話把五科講清楚，之後每一科再展開：</p>
<ul>
<li><b>藍隊</b>（blue team）是守門員。他們不攻擊任何人，整天盯著警報、追查可疑的登入、寫偵測規則、出事時收拾殘局。</li>
<li><b>紅隊</b>（red team）是「被請來的小偷」。公司付錢、簽約授權他們攻擊自己，目的是搶在真壞人之前把洞找出來。沒有那張授權書，同樣的動作就是犯罪。</li>
<li><b>應用程式安全</b>（application security，常縮寫 AppSec）是「幫開發團隊把程式寫安全」的人。看設計、看程式碼、做威脅建模、把安全工具放進 CI/CD。</li>
<li><b>雲端與基礎設施安全</b>（cloud security）管的是「系統蓋在雲上面的那一層」：誰能存取什麼（IAM）、網路怎麼切、Kubernetes 怎麼強化、金鑰放哪裡。</li>
<li><b>治理、風險與合規</b>（governance, risk and compliance，GRC）是「把資安變成制度和證據」的人。訂政策、評風險、依 ISO 27001 這類標準接受稽核。</li>
</ul>
<div class="note">別被「紅隊比較帥」帶走。對一個有開發底子、想盡快把資安變成飯碗的人來說，<b>最短、最穩、而且需求最大的路是 AppSec 和雲端安全</b>。紅隊和滲透測試入門很競爭，通常是你有了幾年資安資歷之後再轉過去的方向。</div>

<h3><span class="badge lv1">基礎</span>二、每一科，一天到底在做什麼</h3>
<p>「一天在做什麼」比職稱更能告訴你適不適合。下面把五科的日常攤開，順便標出它最吃哪種本事。</p>
<table>
<tr><th>科別</th><th>早上你會做的事</th><th>最吃的本事</th><th>值不值班</th></tr>
<tr><td><b>藍隊 / SOC 分析師</b></td><td>看昨晚累積的警報、判斷真假、把可疑登入追到底</td><td>耐心、判讀日誌、知道「正常長什麼樣」</td><td>常輪班</td></tr>
<tr><td><b>偵測工程師</b></td><td>把一次事件寫成一條新的偵測規則，調到不會一直誤報</td><td>寫程式、懂攻擊手法、資料查詢</td><td>多半日班</td></tr>
<tr><td><b>滲透測試 / 紅隊</b></td><td>依授權範圍測一個網站或一台機器，再寫報告</td><td>攻擊知識、動手能力、「報告寫得好」</td><td>日班，專案制</td></tr>
<tr><td><b>AppSec 工程師</b></td><td>幫某個功能做威脅建模、審一段 PR、修一條掃描器報的問題</td><td>讀程式碼、懂 Web 攻擊、會跟開發團隊溝通</td><td>日班</td></tr>
<tr><td><b>雲端安全 / DevSecOps</b></td><td>收緊一條太寬的 IAM 權限、把金鑰搬進管理服務、把檢查接進管線</td><td>雲端、自動化、Infrastructure as Code</td><td>日班，可能 on-call</td></tr>
<tr><td><b>GRC 分析師</b></td><td>更新風險登錄表、幫稽核準備佐證、審一家新供應商</td><td>寫作、溝通、懂標準</td><td>日班</td></tr>
</table>
<p>看出規律了嗎？<b>越靠近「寫程式、自動化、懂系統」的工作，越適合你，而且通常不用輪班。</b>SOC 分析師是沒技術背景的人常見的入門磚，對一個有經驗的開發者來說反而是往下走一階——不是不能做，是浪費你的本錢。</p>

<h3><span class="badge lv2">進階</span>三、一間公司的資安團隊，長什麼樣子</h3>
<p>面試時，你如果能講清楚「這些角色在一間公司裡怎麼串起來」，馬上會比只背名詞的人高一截。先看一張典型的組織圖——注意，<b>公司越小，這些框框越容易由同一個人兼</b>。</p>
<figure class="figure"><svg viewBox="0 0 660 300" class="fg" style="width:100%;max-width:660px" role="img" aria-label="資安團隊組織圖：資安長底下分成防守、攻擊、建置、治理四條線，建置線包含應用安全與雲端安全">
<rect x="250" y="16" width="160" height="40" rx="8" class="fg-b"/><text x="330" y="41" text-anchor="middle" class="fg-t lg">資安長 CISO</text>
<line x1="330" y1="56" x2="330" y2="74" class="fg-l"/>
<line x1="95" y1="74" x2="565" y2="74" class="fg-l"/>
<line x1="95" y1="74" x2="95" y2="92" class="fg-l"/><line x1="255" y1="74" x2="255" y2="92" class="fg-l"/><line x1="405" y1="74" x2="405" y2="92" class="fg-l"/><line x1="565" y1="74" x2="565" y2="92" class="fg-l"/>
<rect x="30" y="92" width="130" height="48" rx="8" class="fg-b alt"/><text x="95" y="113" text-anchor="middle" class="fg-t alt">防守</text><text x="95" y="131" text-anchor="middle" class="fg-t sm">SOC·偵測·應變</text>
<rect x="190" y="92" width="130" height="48" rx="8" class="fg-b warm"/><text x="255" y="113" text-anchor="middle" class="fg-t warm">攻擊</text><text x="255" y="131" text-anchor="middle" class="fg-t sm">紅隊·滲透測試</text>
<rect x="340" y="92" width="130" height="48" rx="8" class="fg-b hot"/><text x="405" y="113" text-anchor="middle" class="fg-t acc">建置</text><text x="405" y="131" text-anchor="middle" class="fg-t sm">AppSec·雲端安全</text>
<rect x="500" y="92" width="130" height="48" rx="8" class="fg-b"/><text x="565" y="113" text-anchor="middle" class="fg-t">治理</text><text x="565" y="131" text-anchor="middle" class="fg-t sm">GRC·稽核</text>
<rect x="340" y="166" width="290" height="58" rx="8" class="fg-b hot"/>
<text x="485" y="188" text-anchor="middle" class="fg-t acc">你最可能從這裡進去</text>
<text x="485" y="208" text-anchor="middle" class="fg-t sm">讀程式·懂架構·會自動化，門檻你已踏過一半</text>
<line x1="405" y1="140" x2="405" y2="166" class="fg-l on"/><polygon points="405,166 400.5,158 409.5,158" class="fg-a on"/>
<rect x="30" y="250" width="600" height="36" rx="8" class="fg-b"/><text x="330" y="273" text-anchor="middle" class="fg-t sm">小公司：這四條線常常是一兩個人全兼，外加一家外部廠商做滲透測試</text>
</svg><figcaption>大公司四條線分得很清楚；十幾人的新創可能一個人兼全部。看懂這張圖，你就知道職缺描述裡那些職稱分別落在哪一格。</figcaption></figure>
<p>幾個新手常問、面試也常考的問題：</p>
<ul>
<li><b>紫隊</b>（purple team）不是第三支隊伍，是一種「合作模式」。紅隊打一招、藍隊當場看自己有沒有偵測到、沒有就補一條規則，兩邊坐在一起一招一招過。它把紅隊的發現「直接」變成藍隊的偵測能力，不浪費。</li>
<li><b>AppSec 和開發團隊是什麼關係？</b>AppSec 不是來擋你出貨的警察，是來幫你把洞補掉、讓你能安心出貨的隊友。好的 AppSec 工程師會被開發團隊當成資源，而不是關卡。</li>
<li><b>為什麼小公司最適合轉職者？</b>因為小公司請不起五個人，它要一個「什麼都能碰一點」的人。你這種會寫程式、會架系統、又補了資安知識的人，正好符合。</li>
</ul>

<h3><span class="badge lv2">進階</span>四、「資安工程」和「合規」到底差在哪</h3>
<p>這是最多人搞混、也最容易在台灣踩到的分岔。兩者都叫資安，但一個是「把東西做安全」，一個是「證明東西有被照規矩管」。用一個具體例子一次看懂。</p>
<p>假設需求是：「所有管理後台的登入都要有第二道驗證。」</p>
<figure class="figure"><svg viewBox="0 0 640 230" class="fg" style="width:100%;max-width:640px" role="img" aria-label="同一條要求，資安工程把它做出來，合規把它寫成政策並留下佐證，兩者互補">
<rect x="180" y="16" width="280" height="40" rx="8" class="fg-b"/><text x="320" y="41" text-anchor="middle" class="fg-t">要求：後台登入要有第二道驗證</text>
<line x1="320" y1="56" x2="320" y2="72" class="fg-l"/>
<line x1="170" y1="72" x2="470" y2="72" class="fg-l"/>
<line x1="170" y1="72" x2="170" y2="88" class="fg-l"/><line x1="470" y1="72" x2="470" y2="88" class="fg-l"/>
<rect x="30" y="88" width="280" height="118" rx="8" class="fg-b hot"/>
<text x="170" y="110" text-anchor="middle" class="fg-t acc">資安工程：把它做出來</text>
<text x="170" y="134" text-anchor="middle" class="fg-t sm">設定 IdP 強制 MFA</text>
<text x="170" y="154" text-anchor="middle" class="fg-t sm">寫程式擋掉沒過驗證的請求</text>
<text x="170" y="174" text-anchor="middle" class="fg-t sm">加一條偵測：沒過驗證就登入</text>
<text x="170" y="194" text-anchor="middle" class="fg-t sm">問的是：它真的擋得住嗎？</text>
<rect x="330" y="88" width="280" height="118" rx="8" class="fg-b alt"/>
<text x="470" y="110" text-anchor="middle" class="fg-t alt">合規：把它寫成制度與佐證</text>
<text x="470" y="134" text-anchor="middle" class="fg-t sm">寫成政策文件</text>
<text x="470" y="154" text-anchor="middle" class="fg-t sm">留下設定截圖與日誌當佐證</text>
<text x="470" y="174" text-anchor="middle" class="fg-t sm">稽核時證明「一整年都有做」</text>
<text x="470" y="194" text-anchor="middle" class="fg-t sm">問的是：你能證明有做嗎？</text>
</svg><figcaption>資安工程問「它真的擋得住攻擊嗎」；合規問「你能不能證明你有照規矩做」。兩邊都要，缺一不可。</figcaption></figure>
<p>關鍵心法，記起來，面試會用到：<b>一間公司可以通過稽核，卻還是被打進去。</b>因為標準只檢查「控制措施存不存在、有沒有在運作」，沒辦法檢查「它夠不夠擋住一個鐵了心的攻擊者」。合規給你的是一條「底線」和一份「書面紀錄」；真正的安全要蓋在這條底線之上。反過來也成立：你可以把系統做得很安全，卻因為沒留佐證而過不了稽核，拿不到大客戶的訂單。</p>
<p>台灣的現實是：<b>很多職缺是「一半工程、一半合規」</b>，尤其碰到 ISO 27001。你如果只會寫程式、完全不懂稽核在要什麼，會很吃虧；但如果你會寫程式、又懂「怎麼讓佐證自己長出來」（例如存取靠 code review 給、部署走管線、基礎設施寫在 git 裡——這叫 compliance as code），你就是市場上很稀缺的那種人。</p>

<h3><span class="badge lv3">專業</span>五、你的開發背景，怎麼換算成資安能力</h3>
<p>轉職最大的心魔是「我是不是要從零開始」。不是。你把過去幾年學會的東西，一條一條對照到資安職缺要的能力，會發現你早就站在半路上了。這一節就是幫你做這個換算。</p>
<figure class="figure"><svg viewBox="0 0 660 300" class="fg" style="width:100%;max-width:660px" role="img" aria-label="開發者已有的能力對照到應用安全與雲端安全要補的能力，中間是橋接">
<text x="100" y="24" text-anchor="middle" class="fg-t lg alt">你已經會的</text>
<text x="560" y="24" text-anchor="middle" class="fg-t lg acc">要補的那一層</text>
<rect x="20" y="40" width="170" height="36" rx="6" class="fg-b alt"/><text x="105" y="63" text-anchor="middle" class="fg-t sm">讀別人的程式碼</text>
<rect x="20" y="86" width="170" height="36" rx="6" class="fg-b alt"/><text x="105" y="109" text-anchor="middle" class="fg-t sm">懂請求怎麼流</text>
<rect x="20" y="132" width="170" height="36" rx="6" class="fg-b alt"/><text x="105" y="155" text-anchor="middle" class="fg-t sm">會寫自動化腳本</text>
<rect x="20" y="178" width="170" height="36" rx="6" class="fg-b alt"/><text x="105" y="201" text-anchor="middle" class="fg-t sm">架過雲端伺服器</text>
<rect x="20" y="224" width="170" height="36" rx="6" class="fg-b alt"/><text x="105" y="247" text-anchor="middle" class="fg-t sm">用過 Docker·CI/CD</text>
<rect x="250" y="120" width="160" height="60" rx="10" class="fg-b hot"/><text x="330" y="146" text-anchor="middle" class="fg-t acc">橋接</text><text x="330" y="166" text-anchor="middle" class="fg-t sm">模組 5·6 補的</text>
<line x1="190" y1="58" x2="248" y2="135" class="fg-l dim"/><line x1="190" y1="104" x2="248" y2="142" class="fg-l dim"/><line x1="190" y1="150" x2="248" y2="150" class="fg-l dim"/><line x1="190" y1="196" x2="248" y2="158" class="fg-l dim"/><line x1="190" y1="242" x2="248" y2="165" class="fg-l dim"/>
<rect x="470" y="40" width="170" height="36" rx="6" class="fg-b hot"/><text x="555" y="63" text-anchor="middle" class="fg-t sm">看出程式裡的弱點</text>
<rect x="470" y="86" width="170" height="36" rx="6" class="fg-b hot"/><text x="555" y="109" text-anchor="middle" class="fg-t sm">威脅建模</text>
<rect x="470" y="132" width="170" height="36" rx="6" class="fg-b hot"/><text x="555" y="155" text-anchor="middle" class="fg-t sm">OWASP Top 10</text>
<rect x="470" y="178" width="170" height="36" rx="6" class="fg-b hot"/><text x="555" y="201" text-anchor="middle" class="fg-t sm">雲端 IAM·最小權限</text>
<rect x="470" y="224" width="170" height="36" rx="6" class="fg-b hot"/><text x="555" y="247" text-anchor="middle" class="fg-t sm">把檢查接進管線</text>
<line x1="410" y1="135" x2="468" y2="58" class="fg-l on"/><line x1="410" y1="142" x2="468" y2="104" class="fg-l on"/><line x1="410" y1="150" x2="468" y2="150" class="fg-l on"/><line x1="410" y1="158" x2="468" y2="196" class="fg-l on"/><line x1="410" y1="165" x2="468" y2="242" class="fg-l on"/>
</svg><figcaption>左邊是你這幾年累積的硬本事，這些最難教；右邊是資安那一層知識，相對好補。轉職不是重來，是在既有地基上加一層。</figcaption></figure>
<p>為什麼這條換算對你特別有利？因為<b>左邊那些「硬本事」是最難教的</b>——一個資工系剛畢業、沒出過貨的人，往往缺的正是「讀得懂一個真實系統、知道東西壞掉會怎樣、會把事情自動化」。這些你用幾年的專案換來了。右邊那層資安知識，有系統地讀，三到六個月就能補上一個能上工的厚度。</p>
<h4>兩條路再細看</h4>
<ul>
<li><b>往 AppSec：</b>你每天在讀 PR、寫 TypeScript、處理前後端的資料流，距離「看出一段程式的注入風險、越權風險」只差一套攻擊視角。模組 5 的 Web 攻擊那幾課就是在給你這套視角。</li>
<li><b>往雲端安全：</b>你架過伺服器、用過 Docker、碰過雲端主控台，距離「看出一條 IAM 權限給太寬、一個 S3 開太大、一個金鑰放錯地方」只差一套「攻擊者會怎麼用這些設定」的眼光。</li>
</ul>

<h3><span class="badge lv4">專家</span>六、一條有里程碑的學習路線</h3>
<p>「有興趣」不會讓你被錄取，「有進度」才會。給你一條對「白天上班、晚上讀書」的人務實的時間線。這不是保證，是一個讓你知道自己走到哪的刻度。</p>
<figure class="figure"><svg viewBox="0 0 660 210" class="fg" style="width:100%;max-width:660px" role="img" aria-label="學習時間線：0 月打基礎，3 月可面橋接職位，6 月成為雲端或應用安全的真正候選人，1 到 2 年成為資深">
<line x1="40" y1="70" x2="630" y2="70" class="fg-l dim"/><polygon points="636,70 628,65.5 628,74.5" class="fg-a"/>
<circle cx="70" cy="70" r="7" class="fg-lamp on"/><circle cx="240" cy="70" r="7" class="fg-lamp on"/><circle cx="410" cy="70" r="7" class="fg-lamp on"/><circle cx="580" cy="70" r="7" class="fg-lamp on"/>
<text x="70" y="52" text-anchor="middle" class="fg-t sm">第 0 月</text>
<text x="240" y="52" text-anchor="middle" class="fg-t sm">約 3 月</text>
<text x="410" y="52" text-anchor="middle" class="fg-t sm">約 6 月</text>
<text x="580" y="52" text-anchor="middle" class="fg-t sm">1 到 2 年</text>
<rect x="20" y="90" width="110" height="78" rx="8" class="fg-b"/><text x="75" y="112" text-anchor="middle" class="fg-t sm">讀模組 5</text><text x="75" y="130" text-anchor="middle" class="fg-t sm">做作業</text><text x="75" y="148" text-anchor="middle" class="fg-t sm">建習慣</text>
<rect x="185" y="90" width="110" height="78" rx="8" class="fg-b alt"/><text x="240" y="112" text-anchor="middle" class="fg-t sm">能面</text><text x="240" y="130" text-anchor="middle" class="fg-t sm">橋接職位</text><text x="240" y="148" text-anchor="middle" class="fg-t sm">AWS 證照</text>
<rect x="355" y="90" width="110" height="78" rx="8" class="fg-b hot"/><text x="410" y="112" text-anchor="middle" class="fg-t sm">真正的</text><text x="410" y="130" text-anchor="middle" class="fg-t sm">候選人</text><text x="410" y="148" text-anchor="middle" class="fg-t sm">作品集成形</text>
<rect x="525" y="90" width="110" height="78" rx="8" class="fg-b"/><text x="580" y="112" text-anchor="middle" class="fg-t sm">有實戰</text><text x="580" y="130" text-anchor="middle" class="fg-t sm">能稱資深</text><text x="580" y="148" text-anchor="middle" class="fg-t sm">選方向深化</text>
</svg><figcaption>一週讀五個晚上的務實節奏：三個月有面橋接職位的底氣，六個月是正式候選人，資深要靠在職位上跑過一兩年真正的系統。</figcaption></figure>
<p>每個里程碑配一個「做得出來才算到」的驗收：</p>
<ul>
<li><b>第 0 到 3 月：</b>讀完模組 5 的每一課，每一課的「On your own stack」作業都真的做、寫成一頁文件。能對自己的系統畫一張威脅模型，說出三條最該修的風險。</li>
<li><b>第 3 月（橋接點）：</b>別急著跳去一個全新職稱。最聰明的一步是接一個「七成是你本來會的、三成是資安新東西」的位置——例如一個你同時也管理管線、部署、雲端設定的全端職位，或在現在的工作裡主動把這些扛下來。這一年下來，你的履歷上就有「資安相關的生產經驗」了。</li>
<li><b>第 6 月：</b>作品集有三到四件成形的東西（見下一節），拿到一張能通過人資篩選的證照（模組 9 建議先 AWS SAA）。這時你投雲端安全或 AppSec 的職缺，不再是碰運氣。</li>
<li><b>第 1 到 2 年：</b>在一個掛著新頭銜的位置上，跑過真正的系統、處理過真正的事件。「資深」不是讀來的，是跑出來的。</li>
</ul>

<h3><span class="badge lv4">專家</span>七、把「我會」變成「別人看得到我會」</h3>
<p>沒有學歷，你靠什麼讓雇主在還沒見到你之前，就相信你會做事？靠<b>公開的能力證明</b>（public proof of skill）。這是免費的，而且比證照更有說服力。它有一個優先順序。</p>
<figure class="figure"><svg viewBox="0 0 620 250" class="fg" style="width:100%;max-width:620px" role="img" aria-label="能力證明的金字塔：底層證照通過篩選，中層作品集看得到，頂層推薦最強">
<polygon points="310,30 110,210 510,210" class="fg-l dim" fill="none"/>
<line x1="177" y1="150" x2="443" y2="150" class="fg-l dim"/>
<line x1="243" y1="90" x2="377" y2="90" class="fg-l dim"/>
<text x="310" y="68" text-anchor="middle" class="fg-t acc">推薦</text><text x="310" y="84" text-anchor="middle" class="fg-t sm">最強</text>
<text x="310" y="122" text-anchor="middle" class="fg-t alt">作品集·文章·CTF</text><text x="310" y="140" text-anchor="middle" class="fg-t sm">看得到你做了什麼</text>
<text x="310" y="178" text-anchor="middle" class="fg-t">證照</text><text x="310" y="196" text-anchor="middle" class="fg-t sm">通過人資的自動篩選</text>
<text x="545" y="70" class="fg-t sm">認識你</text>
<text x="545" y="130" class="fg-t sm">讀你的</text>
<text x="545" y="190" class="fg-t sm">濾掉你</text>
</svg><figcaption>由下往上越來越有說服力：證照只是讓你通過機器篩選，作品集讓人看到你真的會，而一句來自雇主信任的人的推薦，勝過所有文件。</figcaption></figure>
<p>重點放在中間那層，因為那是你能自己掌控、而且能長期累積的。四種做法，由易到難：</p>
<h4>一、把每件事寫成文章（write-up）</h4>
<p>你做過的每一個練習、修過的每一個問題，寫成一頁。開頭先講結果和一個數字（「把某查詢的 p95 從 900 毫秒降到 140 毫秒，靠一個索引加一個連線池」），再講你怎麼想、考慮過哪些做法、為什麼選這個。<b>展示你的思路，才是資深和菜鳥的分水嶺。</b>發在個人 GitHub 或一個小網站，絕不放雇主的程式或任何屬於公司的東西。</p>
<h4>二、打 CTF（capture the flag）</h4>
<p>CTF 是資安的解謎比賽，給你一個題目，你找出藏起來的「旗標」字串來證明你解開了。它是在<b>完全合法、特意為練習搭好的環境</b>裡磨攻防直覺的最好方法。打完把解題過程寫成文章，一魚兩吃：既練了技術，又生出了作品。</p>
<h4>三、懂 bug bounty 的禮節</h4>
<p>有些公司會公布一份「漏洞獎勵計畫」（bug bounty），公開寫明哪些系統可以測、怎麼回報、找到問題付多少獎金。這是少數「你被允許去測別人系統」的管道，但規矩很硬：</p>
<ul>
<li><b>只待在公布的範圍裡。</b>範圍外的系統，就算你看到洞，也不能碰——碰了就從研究變成犯罪。</li>
<li><b>點到為止。</b>證明漏洞存在就停，別去讀真實使用者的資料、別把系統弄壞。讀一筆紀錄，不要倒整張資料表。</li>
<li><b>負責任揭露</b>（responsible disclosure）：私下通報、給廠商合理的修補時間，修好之前不公開細節。</li>
</ul>
<h4>四、開源貢獻</h4>
<p>給你在用的工具修一個文件錯字、補一段測試、修一個小 bug，都算。它留下一條「有名有姓、公開可查」的紀錄，證明你能在一個真實團隊的規矩裡協作。從小的、低風險的貢獻開始，比你想的更有份量。</p>

<h3>八、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>資安工程師就是一種工作</td><td>它是五科以上的統稱，像「醫生」。選對科，你的開發背景才用得上。</td></tr>
<tr><td>要從 SOC 分析師開始熬</td><td>那是沒技術背景者的入門磚。有開發經驗的人，直接走 AppSec 或雲端安全更快、更不浪費。</td></tr>
<tr><td>轉資安要從零開始</td><td>讀程式、懂系統、會自動化這些最難教的本事你已經有了，要補的只是上面那層資安知識。</td></tr>
<tr><td>通過 ISO 27001 稽核就等於安全</td><td>稽核只證明「控制措施存在且有運作」，擋不擋得住鐵了心的攻擊者是另一回事。合規是底線，不是終點。</td></tr>
<tr><td>紅隊最厲害、最該追</td><td>紅隊入門很競爭，通常是有幾年資歷後再轉。需求最大、最穩的其實是建置那條線。</td></tr>
<tr><td>沒學歷就沒機會</td><td>外商與遠端職缺多半直接考實力，作品集和推薦比一張文憑更有說服力。</td></tr>
</table>

<h3>九、跟你的工作連起來</h3>
<ul>
<li><b>前端 / 遊戲開發（Vue、TypeScript、Cocos、Unity）：</b>你每天處理使用者輸入、串接 API、管理登入狀態（session），這些正是 Web 攻擊最愛下手的地方。把「這個輸入如果是惡意的會怎樣」變成寫程式時的反射，你就已經在做 AppSec 的核心工作。</li>
<li><b>後端（Node.js、Go）：</b>你寫的每一條權限檢查、每一次資料庫查詢、每一個對外的端點，都是攻防的前線。懂了攻擊視角，你的程式會天生比較難被打。</li>
<li><b>雲端與容器（Docker、雲端伺服器）：</b>你設過的每一條防火牆規則、給過的每一個雲端角色，都是「雲端安全」這科的日常。差別只在你現在是「讓它能動」，之後要加上「讓它只給最小必要的權限」。</li>
<li><b>共通的那項本事——把東西寫清楚：</b>不管哪一科，寫不清楚的發現事項不會有人修，讀不下去的報告保護不了任何人。這門課每個作業都寫成文件，就是在練這項最被低估、卻最值錢的能力。</li>
</ul>

<h3>十、面試會怎麼問</h3>
<p>下面是轉職資安時真的會被問到的題目。先自己出聲講一遍，再看參考答案。</p>
<ol>
<li>「你有開發背景，為什麼想做資安？你覺得自己適合哪一科，為什麼？」</li>
<li>「資安工程和合規，差在哪裡？能不能舉一個例子？」</li>
<li>「一間公司的資安團隊通常怎麼分工？紫隊是什麼？」</li>
<li>「一間公司通過了 ISO 27001 稽核，是不是就代表它很安全？」</li>
<li>「你沒有資安的正式經歷，要怎麼讓我相信你會做事？」</li>
<li>「AppSec 工程師和開發團隊應該是什麼關係？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>強調你最難教的本事已經有了——讀程式、懂系統、會自動化。適合的科是 AppSec 或雲端安全，因為它們直接建立在這些能力上；SOC 的輪班盯警報對有開發經驗的人是往下一階。講出你自己系統裡一個真實的資安問題，顯示你已經在用攻擊視角看事情。</li>
<li>資安工程是「把東西做安全並確認它真的擋得住」；合規是「把要求寫成制度、留下佐證、證明一整年有做」。例子：同一條「後台登入要第二道驗證」，工程端去設定、寫程式擋、加偵測；合規端寫政策、留截圖與日誌當佐證。可以加一句：通過稽核不等於安全，因為標準只檢查控制措施存不存在、有沒有運作。</li>
<li>通常分防守（SOC、偵測、應變）、攻擊（紅隊 / 滲透測試）、建置（AppSec、雲端安全）、治理（GRC）四條線，小公司常由一兩個人兼。紫隊不是第三支隊伍，是紅藍兩隊肩並肩合作，一招一招把紅隊的攻擊變成藍隊能用的偵測規則。</li>
<li>不是。稽核只證明「必要的控制措施存在、而且在稽核期間有運作」，無法證明它足以擋住一個有決心的攻擊者。合規給的是一條底線和一份書面紀錄，真正的安全要蓋在上面。</li>
<li>靠公開的能力證明：把做過的事寫成文章、打 CTF 並寫解題過程、在 bug bounty 的範圍內合法練手、做開源貢獻。再搭一張能通過人資篩選的證照。最強的是一句來自雇主信任的人的推薦。</li>
<li>隊友，不是警察。AppSec 的價值在於幫開發團隊把洞早點補掉、讓他們能安心出貨，而不是在最後一關擋人。好的 AppSec 會被團隊當成資源。</li>
</ol>
</details>

<h3>十一、練功題（做得出來才算真的懂）</h3>
<ol>
<li>把本課五科各用一句「一天在做什麼」講給一個非技術的朋友聽，讓他能分辨哪兩科最適合你。</li>
<li>到你想進的市場找十則職缺（關鍵字 security engineer、DevSecOps、cloud security），把每條要求抄進同一張清單，數出現次數。前十名就是你的讀書優先順序。</li>
<li>拿「後台登入要第二道驗證」這條要求，各寫三件事：資安工程會做什麼、合規會做什麼。</li>
<li>畫一張你自己的「能力換算表」：左欄寫你這幾年學會的五項硬本事，右欄寫它們各自對應到 AppSec 或雲端安全的哪項能力。</li>
<li>選一件你做過的事，照「先結果加數字、再講思路」的格式，寫成一頁 write-up。這就是你作品集的第一塊磚。</li>
<li>找一個 bug bounty 計畫，讀它的範圍與規則頁，用自己的話寫出「哪些可以測、哪些絕對不能碰、找到問題要怎麼回報」。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>參考：藍隊整天盯警報抓壞人、紅隊被授權去當小偷、AppSec 幫開發把程式寫安全、雲端安全管誰能存取什麼、GRC 把資安變成制度和證據。最適合開發者的是 AppSec 和雲端安全。</li>
<li>沒有標準答案，重點是你數出來的前十名會很像：雲端（AWS）、Kubernetes、CI/CD、Terraform、程式能力、Linux、IAM、網路、某張證照、英文。這張表就是你的讀書地圖。</li>
<li>工程：設定身分提供者強制 MFA、寫程式擋掉沒過驗證的請求、加一條「沒過驗證卻登入」的偵測。合規：寫成政策、留設定截圖與日誌當佐證、稽核時證明一整年都有做。</li>
<li>例如：讀程式碼→看出注入與越權；懂請求流→威脅建模；會自動化→把安全檢查接進管線；架過伺服器→雲端設定強化；用過 Docker→容器與映像檔安全。</li>
<li>檢查你的文章是不是「第一句就有結果和數字」「中段有講你考慮過的選項和取捨」「結尾有下一步」。有這三點，就是一篇會讓人想找你面試的文章。</li>
<li>重點答案：只能測它明確列出的系統、嚴禁碰範圍外、嚴禁讀真實使用者資料或弄壞系統、要照它指定的管道私下回報、修好前不公開。</li>
</ol>
</details>

<h3>十二、想再挖深</h3>
<ul>
<li><b>MITRE ATT&amp;CK</b>（<a href="https://attack.mitre.org/">attack.mitre.org</a>）：攻擊手法的公開大目錄。想往藍隊或紅隊走，這是共通語言，下一課會深入用它。</li>
<li><b>OWASP</b>（<a href="https://owasp.org/">owasp.org</a>）：應用程式安全的大本營，Top 10、測試指南、Juice Shop 練習靶都在這。想走 AppSec 必逛。</li>
<li><b>PortSwigger Web Security Academy</b>（<a href="https://portswigger.net/web-security">portswigger.net/web-security</a>）：免費、在瀏覽器裡就能做的 Web 安全實驗室，是補「攻擊視角」最好的地方。</li>
<li><b>SANS《Blueprint》podcast 與免費資源</b>：藍隊職涯與偵測工程的實務討論，幫你了解防守這條線的日常。</li>
<li>台灣的<b>資通安全管理法</b>與數位發展部資通安全署公布的<b>資安專業證照清單</b>：決定證照方向前，先查官方最新版本，別照舊資料。</li>
</ul>
` });
