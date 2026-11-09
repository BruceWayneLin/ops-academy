DEEP({ 'sec-iam': `
<p>上一課說，在雲端「身分就是邊界」。這一章把那道邊界拆開來看：AWS 收到一個 API 請求時，依什麼順序翻哪幾份政策、在哪一步說「不」；怎麼從真實的存取紀錄，寫出剛好夠用的政策；伺服器、Pod、CI 和人，各自怎麼拿到一張會過期的通行證；跨帳號時為什麼需要 External ID；金鑰被偷之後，攻擊者在 CloudTrail 裡留下什麼腳印。最後看幾個真實事故：它們沒有一個用到高深的漏洞，全部是 IAM 設定出了問題。這一章用 AWS 的名詞，因為它最常見；GCP 和 Azure 的觀念幾乎一樣，只是名字不同。</p>

<h3><span class="badge lv1">基礎</span>一、一個請求進門：驗證、請求內容、授權</h3>
<p>想像一棟辦公大樓的門禁。你刷卡，系統先確認這張卡是真的、是你的（驗證）；接著看你要進哪一層、哪一間、現在幾點（請求內容）；最後翻規定，決定開不開門（授權）。AWS 對每一個 API 呼叫都做這三件事。你在主控台按一個按鈕，背後也是一個 API 呼叫，沒有例外。</p>
<figure class="figure"><svg viewBox="0 0 660 240" class="fg" style="width:100%;max-width:660px" role="img" aria-label="一個 API 請求的三個階段：驗證簽章，組出包含主體、動作、資源、條件的請求內容，再交給政策引擎判斷允許或拒絕">
<text x="90" y="24" text-anchor="middle" class="fg-t alt">1 驗證身分</text>
<text x="335" y="24" text-anchor="middle" class="fg-t alt">2 組出請求內容</text>
<text x="575" y="24" text-anchor="middle" class="fg-t alt">3 授權判斷</text>
<rect x="10" y="40" width="160" height="160" rx="8" class="fg-b alt"/>
<text x="90" y="70" text-anchor="middle" class="fg-t">你的程式送出</text>
<text x="90" y="98" text-anchor="middle" class="fg-t sm">HTTPS 請求</text>
<text x="90" y="118" text-anchor="middle" class="fg-t sm">＋ 存取金鑰 ID</text>
<text x="90" y="138" text-anchor="middle" class="fg-t sm">＋ SigV4 簽章</text>
<text x="90" y="176" text-anchor="middle" class="fg-t sm acc">秘密金鑰不出門</text>
<line x1="170" y1="120" x2="202" y2="120" class="fg-l"/><polygon points="210,120 202,115.5 202,124.5" class="fg-a"/>
<rect x="210" y="40" width="250" height="160" rx="8" class="fg-b"/>
<text x="335" y="62" text-anchor="middle" class="fg-t acc">請求內容 request context</text>
<rect x="222" y="72" width="226" height="26" rx="4" class="fg-b"/><text x="232" y="89" class="fg-t sm acc">主體</text><text x="268" y="89" class="fg-t sm mono">assumed-role/hilo-api</text>
<rect x="222" y="102" width="226" height="26" rx="4" class="fg-b"/><text x="232" y="119" class="fg-t sm acc">動作</text><text x="268" y="119" class="fg-t sm mono">s3:PutObject</text>
<rect x="222" y="132" width="226" height="26" rx="4" class="fg-b"/><text x="232" y="149" class="fg-t sm acc">資源</text><text x="268" y="149" class="fg-t sm mono">hilo-saves/u/42.json</text>
<rect x="222" y="162" width="226" height="26" rx="4" class="fg-b"/><text x="232" y="179" class="fg-t sm acc">條件</text><text x="268" y="179" class="fg-t sm">來源 IP、時間、MFA、標籤</text>
<line x1="460" y1="120" x2="492" y2="120" class="fg-l"/><polygon points="500,120 492,115.5 492,124.5" class="fg-a"/>
<rect x="500" y="40" width="150" height="160" rx="8" class="fg-b hot"/>
<text x="575" y="68" text-anchor="middle" class="fg-t acc">政策引擎</text>
<text x="575" y="94" text-anchor="middle" class="fg-t sm">每一份相關的政策</text>
<text x="575" y="112" text-anchor="middle" class="fg-t sm">都拿來對一次</text>
<rect x="515" y="128" width="56" height="30" rx="5" class="fg-b"/><text x="543" y="148" text-anchor="middle" class="fg-t acc">允許</text>
<rect x="579" y="128" width="56" height="30" rx="5" class="fg-b warm"/><text x="607" y="148" text-anchor="middle" class="fg-t warm">拒絕</text>
<text x="575" y="184" text-anchor="middle" class="fg-t sm">沒人說允許＝拒絕</text>
<text x="330" y="228" text-anchor="middle" class="fg-t sm">驗證只回答「你是誰」；授權要把整份請求內容和每一份政策對過</text>
</svg><figcaption>簽章證明「是你」，但不決定「准不准」。准不准，要看請求內容裡的四樣東西，和所有相關政策怎麼說。</figcaption></figure>
<p>驗證這一步有個值得記住的細節：SDK 用秘密存取金鑰（secret access key）對請求算一個簽章（SigV4），送出去的只有<b>金鑰 ID 和簽章</b>，秘密金鑰本身從來不上網路。AWS 用金鑰 ID 找到同一把秘密金鑰，自己再算一次，對得上就知道是你。簽章裡還包含時間，簽過的請求只在幾分鐘內有效，被錄下來也很難拿去重播。</p>
<p>請求內容裡最重要的是<b>主體</b>（principal），也就是「誰在問」。看 ARN 就分得出是哪一種：</p>
<table>
<tr><th>主體</th><th>ARN 長什麼樣子</th><th>金鑰</th></tr>
<tr><td>根使用者（root user）</td><td><code>arn:aws:iam::111122223333:root</code></td><td>不該有</td></tr>
<tr><td>IAM 使用者</td><td><code>arn:aws:iam::111122223333:user/alice</code></td><td>長期金鑰，ID 以 <code>AKIA</code> 開頭</td></tr>
<tr><td>角色工作階段（role session）</td><td><code>arn:aws:sts::111122223333:assumed-role/hilo-api/i-0abc</code></td><td>短期金鑰，ID 以 <code>ASIA</code> 開頭，還要帶一張工作階段權杖</td></tr>
<tr><td>AWS 服務</td><td><code>s3.amazonaws.com</code> 這類服務主體</td><td>由 AWS 自己處理</td></tr>
</table>
<p>看到一把金鑰，先看開頭四個字。<code>AKIA</code> 代表它會一直有效，直到有人去停用它，外洩的後果最嚴重；<code>ASIA</code> 代表它幾小時內會自己過期。處理外洩事件時，這個小知識能讓你第一眼就判斷有多急。</p>
<p>除了主體、動作（action）、資源（resource），請求內容還帶著一大堆<b>條件鍵</b>（condition key）：來源 IP（<code>aws:SourceIp</code>）、這次登入有沒有用 MFA（<code>aws:MultiFactorAuthPresent</code>）、主體屬於哪個組織（<code>aws:PrincipalOrgID</code>）、要去哪個區域（<code>aws:RequestedRegion</code>），還有主體和資源身上的標籤。政策裡的 <code>Condition</code>，就是拿這些值來比。</p>

<h3><span class="badge lv1">基礎</span>二、六種政策：誰會給權限，誰只會拿走</h3>
<p>延續大樓的比喻。員工證上寫著你能進哪些房間，這是<b>身分型政策</b>（identity-based policy）；房門口貼著「只有某某部門能進」，這是<b>資源型政策</b>（resource-based policy）；集團規定所有子公司「誰都不准動消防系統」，這是 <b>SCP</b>；你這個職級最高只能到某一層，這是<b>權限邊界</b>（permissions boundary）；今天櫃台發你一張臨時證、只開兩扇門，這是<b>工作階段政策</b>（session policy）。</p>
<table>
<tr><th>政策</th><th>掛在哪裡</th><th>會給權限嗎</th><th>典型用途</th></tr>
<tr><td>身分型政策</td><td>使用者、群組、角色</td><td>會</td><td>日常授權</td></tr>
<tr><td>資源型政策</td><td>S3 儲存桶、KMS 金鑰、SQS 佇列；角色的<b>信任政策</b>（trust policy）也是一種</td><td>會</td><td>跨帳號分享、限定誰能碰這個資源</td></tr>
<tr><td>SCP（service control policy）</td><td>AWS Organizations 裡的帳號或組織單位</td><td>不會，只設上限</td><td>全公司的護欄：不准關 CloudTrail、只能用某幾個區域</td></tr>
<tr><td>RCP（resource control policy）</td><td>組織裡的帳號</td><td>不會，只設上限</td><td>從資源那一側設上限，例如儲存桶永遠不准給組織外的人用。2024 年底推出，支援的服務還在增加</td></tr>
<tr><td>權限邊界</td><td>單一使用者或角色</td><td>不會，只設上限</td><td>讓開發者自己建角色，但建出來的角色不能比邊界大</td></tr>
<tr><td>工作階段政策</td><td>擔任角色時臨時帶上</td><td>不會，只設上限</td><td>同一個角色，這一次只用其中一小部分</td></tr>
</table>
<p>記住一句話：<b>只有前兩種會給權限，後四種只會拿走。</b>後四種是篩子，不是水龍頭。一個動作要成功，必須通過每一層篩子：</p>
<figure class="figure"><svg viewBox="0 0 680 320" class="fg" style="width:100%;max-width:680px" role="img" aria-label="六個動作逐一經過身分政策、權限邊界、SCP、工作階段政策四欄檢查，只有每一欄都亮燈的 s3:GetObject 和 s3:PutObject 最後被允許">
<text x="230" y="30" text-anchor="middle" class="fg-t">身分政策</text>
<text x="330" y="30" text-anchor="middle" class="fg-t">權限邊界</text>
<text x="430" y="30" text-anchor="middle" class="fg-t">SCP</text>
<text x="530" y="30" text-anchor="middle" class="fg-t">工作階段政策</text>
<text x="620" y="30" text-anchor="middle" class="fg-t acc">結果</text>
<text x="230" y="50" text-anchor="middle" class="fg-t sm">給了這些</text>
<text x="330" y="50" text-anchor="middle" class="fg-t sm">只准 s3、DB</text>
<text x="430" y="50" text-anchor="middle" class="fg-t sm">不准建使用者</text>
<text x="530" y="50" text-anchor="middle" class="fg-t sm">只准讀寫存檔</text>
<text x="620" y="50" text-anchor="middle" class="fg-t sm">交集</text>
<rect x="588" y="66" width="64" height="200" rx="8" class="fg-b hot"/>
<line x1="16" y1="102" x2="580" y2="102" class="fg-l dim"/><line x1="16" y1="134" x2="580" y2="134" class="fg-l dim"/><line x1="16" y1="166" x2="580" y2="166" class="fg-l dim"/><line x1="16" y1="198" x2="580" y2="198" class="fg-l dim"/><line x1="16" y1="230" x2="580" y2="230" class="fg-l dim"/>
<text x="20" y="90" class="fg-t mono">s3:GetObject</text>
<circle cx="230" cy="86" r="6" class="fg-lamp on"/><circle cx="330" cy="86" r="6" class="fg-lamp on"/><circle cx="430" cy="86" r="6" class="fg-lamp on"/><circle cx="530" cy="86" r="6" class="fg-lamp on"/><circle cx="620" cy="86" r="6" class="fg-lamp on"/>
<text x="20" y="122" class="fg-t mono">s3:PutObject</text>
<circle cx="230" cy="118" r="6" class="fg-lamp on"/><circle cx="330" cy="118" r="6" class="fg-lamp on"/><circle cx="430" cy="118" r="6" class="fg-lamp on"/><circle cx="530" cy="118" r="6" class="fg-lamp on"/><circle cx="620" cy="118" r="6" class="fg-lamp on"/>
<text x="20" y="154" class="fg-t mono">s3:DeleteObject</text>
<circle cx="230" cy="150" r="6" class="fg-lamp on"/><circle cx="330" cy="150" r="6" class="fg-lamp on"/><circle cx="430" cy="150" r="6" class="fg-lamp on"/><text x="530" y="155" text-anchor="middle" class="fg-t warm">✕</text><text x="620" y="155" text-anchor="middle" class="fg-t warm">✕</text>
<text x="20" y="186" class="fg-t mono">dynamodb:PutItem</text>
<circle cx="230" cy="182" r="6" class="fg-lamp on"/><circle cx="330" cy="182" r="6" class="fg-lamp on"/><circle cx="430" cy="182" r="6" class="fg-lamp on"/><text x="530" y="187" text-anchor="middle" class="fg-t warm">✕</text><text x="620" y="187" text-anchor="middle" class="fg-t warm">✕</text>
<text x="20" y="218" class="fg-t mono">iam:CreateUser</text>
<circle cx="230" cy="214" r="6" class="fg-lamp on"/><text x="330" y="219" text-anchor="middle" class="fg-t warm">✕</text><text x="430" y="219" text-anchor="middle" class="fg-t warm">✕</text><text x="530" y="219" text-anchor="middle" class="fg-t warm">✕</text><text x="620" y="219" text-anchor="middle" class="fg-t warm">✕</text>
<text x="20" y="250" class="fg-t mono">ec2:RunInstances</text>
<circle cx="230" cy="246" r="6" class="fg-lamp on"/><text x="330" y="251" text-anchor="middle" class="fg-t warm">✕</text><circle cx="430" cy="246" r="6" class="fg-lamp on"/><text x="530" y="251" text-anchor="middle" class="fg-t warm">✕</text><text x="620" y="251" text-anchor="middle" class="fg-t warm">✕</text>
<text x="340" y="300" text-anchor="middle" class="fg-t sm">身分政策給得再多，最後只剩每一欄都亮燈的那幾列</text>
</svg><figcaption>有效權限是交集。身分政策給了六個動作，權限邊界、SCP、工作階段政策各拿掉一些，最後只剩兩個。</figcaption></figure>
<p>常讓人困惑的地方：SCP 和權限邊界「沒寫到」也算不允許。你平常沒感覺，是因為組織預設掛著一份叫 <code>FullAWSAccess</code> 的 SCP，它什麼都允許。如果把它拿掉，換成只列幾個服務的允許清單，沒列到的服務就全部不能用，不管帳號裡的管理員是誰。另外兩個例外要記得：SCP 管不到組織的<b>管理帳號</b>（management account），也管不到服務連結角色（service-linked role）。所以管理帳號裡不要放任何工作負載。</p>
<p>權限邊界最常見的用途是「授權別人去授權」。平台團隊希望開發者能自己替 Lambda 建角色，又怕他們順手建一個管理員角色給自己。做法是：開發者的政策允許 <code>iam:CreateRole</code>，但加一個條件，要求 <code>iam:PermissionsBoundary</code> 必須等於某一份邊界政策。開發者建出來的每個角色都帶著這個上限，政策怎麼寫都超不過去。</p>

<h3><span class="badge lv2">進階</span>三、評估流程：一步一步走，再追兩個請求</h3>
<p>AWS 官方文件把評估畫成一張流程圖。簡化成六個問題，照順序問：</p>
<figure class="figure"><svg viewBox="0 0 640 486" class="fg" style="width:100%;max-width:640px" role="img" aria-label="政策評估流程圖：先看有沒有明確拒絕，再看 SCP 與 RCP、資源型政策、身分型政策、權限邊界、工作階段政策，任一步不允許就拒絕">
<rect x="120" y="8" width="300" height="38" rx="6" class="fg-b alt"/><text x="270" y="32" text-anchor="middle" class="fg-t">收齊這個請求適用的每一份政策</text>
<line x1="270" y1="46" x2="270" y2="58" class="fg-l"/><polygon points="270,66 265.5,58 274.5,58" class="fg-a"/>
<rect x="120" y="66" width="300" height="40" rx="6" class="fg-b"/><text x="270" y="91" text-anchor="middle" class="fg-t">1 有任何一份寫了明確的 Deny 嗎？</text>
<text x="110" y="91" text-anchor="end" class="fg-t sm warm">一票否決</text>
<line x1="420" y1="86" x2="462" y2="86" class="fg-l warm"/><polygon points="470,86 462,81.5 462,90.5" class="fg-a warm"/><text x="445" y="79" text-anchor="middle" class="fg-t sm warm">有</text>
<rect x="470" y="68" width="150" height="36" rx="6" class="fg-b warm"/><text x="545" y="91" text-anchor="middle" class="fg-t warm">拒絕（最終）</text>
<line x1="270" y1="106" x2="270" y2="120" class="fg-l"/><polygon points="270,128 265.5,120 274.5,120" class="fg-a"/><text x="280" y="121" class="fg-t sm">沒有</text>
<rect x="120" y="128" width="300" height="40" rx="6" class="fg-b"/><text x="270" y="153" text-anchor="middle" class="fg-t">2 組織的 SCP、RCP 允許嗎？</text>
<text x="110" y="153" text-anchor="end" class="fg-t sm">只設上限</text>
<line x1="420" y1="148" x2="462" y2="148" class="fg-l warm"/><polygon points="470,148 462,143.5 462,152.5" class="fg-a warm"/><text x="445" y="141" text-anchor="middle" class="fg-t sm warm">不允許</text>
<rect x="470" y="130" width="150" height="36" rx="6" class="fg-b warm"/><text x="545" y="153" text-anchor="middle" class="fg-t warm">拒絕</text>
<line x1="270" y1="168" x2="270" y2="182" class="fg-l"/><polygon points="270,190 265.5,182 274.5,182" class="fg-a"/><text x="280" y="183" class="fg-t sm">允許</text>
<rect x="120" y="190" width="300" height="40" rx="6" class="fg-b"/><text x="270" y="215" text-anchor="middle" class="fg-t">3 資源型政策允許這個主體嗎？</text>
<text x="110" y="215" text-anchor="end" class="fg-t sm acc">會給權限</text>
<line x1="420" y1="210" x2="462" y2="210" class="fg-l on"/><polygon points="470,210 462,205.5 462,214.5" class="fg-a on"/><text x="445" y="203" text-anchor="middle" class="fg-t sm acc">允許</text>
<rect x="470" y="192" width="150" height="36" rx="6" class="fg-b hot"/><text x="545" y="215" text-anchor="middle" class="fg-t acc">允許（同帳號）</text>
<line x1="270" y1="230" x2="270" y2="244" class="fg-l"/><polygon points="270,252 265.5,244 274.5,244" class="fg-a"/><text x="280" y="245" class="fg-t sm">沒有，或是跨帳號</text>
<rect x="120" y="252" width="300" height="40" rx="6" class="fg-b"/><text x="270" y="277" text-anchor="middle" class="fg-t">4 身分型政策允許嗎？</text>
<text x="110" y="277" text-anchor="end" class="fg-t sm acc">會給權限</text>
<line x1="420" y1="272" x2="462" y2="272" class="fg-l warm"/><polygon points="470,272 462,267.5 462,276.5" class="fg-a warm"/><text x="445" y="265" text-anchor="middle" class="fg-t sm warm">不允許</text>
<rect x="470" y="254" width="150" height="36" rx="6" class="fg-b warm"/><text x="545" y="277" text-anchor="middle" class="fg-t warm">拒絕（隱含）</text>
<line x1="270" y1="292" x2="270" y2="306" class="fg-l"/><polygon points="270,314 265.5,306 274.5,306" class="fg-a"/><text x="280" y="307" class="fg-t sm">允許</text>
<rect x="120" y="314" width="300" height="40" rx="6" class="fg-b"/><text x="270" y="339" text-anchor="middle" class="fg-t">5 權限邊界允許嗎？（有設才看）</text>
<text x="110" y="339" text-anchor="end" class="fg-t sm">只設上限</text>
<line x1="420" y1="334" x2="462" y2="334" class="fg-l warm"/><polygon points="470,334 462,329.5 462,338.5" class="fg-a warm"/><text x="445" y="327" text-anchor="middle" class="fg-t sm warm">不允許</text>
<rect x="470" y="316" width="150" height="36" rx="6" class="fg-b warm"/><text x="545" y="339" text-anchor="middle" class="fg-t warm">拒絕</text>
<line x1="270" y1="354" x2="270" y2="368" class="fg-l"/><polygon points="270,376 265.5,368 274.5,368" class="fg-a"/><text x="280" y="369" class="fg-t sm">允許</text>
<rect x="120" y="376" width="300" height="40" rx="6" class="fg-b"/><text x="270" y="401" text-anchor="middle" class="fg-t">6 工作階段政策允許嗎？（有帶才看）</text>
<text x="110" y="401" text-anchor="end" class="fg-t sm">只設上限</text>
<line x1="420" y1="396" x2="462" y2="396" class="fg-l warm"/><polygon points="470,396 462,391.5 462,400.5" class="fg-a warm"/><text x="445" y="389" text-anchor="middle" class="fg-t sm warm">不允許</text>
<rect x="470" y="378" width="150" height="36" rx="6" class="fg-b warm"/><text x="545" y="401" text-anchor="middle" class="fg-t warm">拒絕</text>
<line x1="270" y1="416" x2="270" y2="430" class="fg-l on"/><polygon points="270,438 265.5,430 274.5,430" class="fg-a on"/><text x="280" y="431" class="fg-t sm acc">允許</text>
<rect x="120" y="438" width="300" height="38" rx="6" class="fg-b hot"/><text x="270" y="462" text-anchor="middle" class="fg-t acc">允許</text>
</svg><figcaption>任何一步說「不」就結束。左邊的小字提醒你：只有第 3、4 步會給權限，其他步驟只會把權限拿掉。</figcaption></figure>
<p>有幾個細節要抓住：</p>
<ul>
<li><b>明確拒絕是一票否決。</b>不管是身分型、資源型、SCP 還是邊界，只要有一條 <code>Deny</code> 符合，後面都不用看了。</li>
<li><b>預設就是拒絕。</b>走完流程都沒有人說「允許」，結果是拒絕，這叫隱含拒絕（implicit deny）。它和明確拒絕的差別在於：隱含拒絕只要補一條 Allow 就能解開；明確拒絕，別的政策寫什麼都救不回來。</li>
<li><b>同帳號和跨帳號不一樣。</b>同一個帳號裡，資源型政策點頭就可能夠了（細節依主體是使用者還是角色工作階段而有不同）。跨帳號時，<b>兩邊都要點頭</b>：你帳號的身分政策允許你去做，對方的資源政策也允許你來。</li>
<li><b>有些資源一定要資源那一側點頭。</b>KMS 的金鑰政策（key policy）和角色的信任政策就是這樣：資源本身沒寫允許，身分政策寫什麼都沒用。</li>
</ul>
<h4>追兩個真實的請求</h4>
<p>情境：正式環境帳號 111122223333 裡有一個角色 <code>hilo-api</code>，給 EC2 上的猜高低遊戲伺服器用。某次為了趕上線，有人在它的身分政策裡加了一條 <code>"Action": "s3:*", "Resource": "*"</code>。另外，備份儲存桶 <code>hilo-backups</code> 的儲存桶政策裡有這一條：</p>
<pre><code>{
  "Sid": "OnlyBackupAdminDeletes",
  "Effect": "Deny",
  "Principal": "*",
  "Action": "s3:DeleteObject",
  "Resource": "arn:aws:s3:::hilo-backups/*",
  "Condition": {
    "ArnNotLike": {
      "aws:PrincipalArn": "arn:aws:iam::111122223333:role/backup-admin"
    }
  }
}</code></pre>
<table>
<tr><th>步驟</th><th>請求 A：寫入玩家存檔<br><code>s3:PutObject</code> 到 <code>hilo-saves/u/42.json</code></th><th>請求 B：刪除昨天的備份<br><code>s3:DeleteObject</code> 到 <code>hilo-backups/2026-11-08.dump</code></th></tr>
<tr><td>1 明確拒絕</td><td>沒有任何 Deny 符合</td><td><b>儲存桶政策的 Deny 符合</b>：主體是 <code>role/hilo-api</code>，不是 <code>backup-admin</code>。結束，拒絕。</td></tr>
<tr><td>2 SCP</td><td>預設的 FullAWSAccess 允許；區域限制只擋東京以外的區域，這次就在東京</td><td>不用看了</td></tr>
<tr><td>3 資源型政策</td><td><code>hilo-saves</code> 的政策沒有允許它的條文，往下</td><td>—</td></tr>
<tr><td>4 身分型政策</td><td>那條 <code>s3:*</code> 允許</td><td>—</td></tr>
<tr><td>5、6</td><td>沒設邊界、沒帶工作階段政策，略過</td><td>—</td></tr>
<tr><td>結果</td><td>允許</td><td>拒絕（明確）</td></tr>
</table>
<p>請求 B 是好消息：身分政策開得再寬，備份還是刪不掉，因為資源那一側有一道明確拒絕。這就是縱深防禦在 IAM 裡的樣子。請求 A 也成功了，但它是靠那條萬用字元成功的。這個角色現在也能讀別的儲存桶、改儲存桶政策，甚至把儲存桶設成公開。下一節就把它收回來。</p>
<p>出錯時，先讀錯誤訊息。現在很多服務的 AccessDenied 訊息會直接寫明原因，例如「because no identity-based policy allows」或「with an explicit deny in a service control policy」。看到哪幾個字，就知道該去翻哪一份政策，不用一份一份猜。</p>

<h3><span class="badge lv2">進階</span>四、從存取紀錄寫出最小權限的政策</h3>
<p>「最小權限」（least privilege）大家都會背，難的是怎麼知道「最小」是多少。用猜的永遠猜不準；最可靠的答案在紀錄裡：這個角色過去三個月，實際上呼叫了什麼。</p>
<p><b>第一步，確定紀錄夠完整。</b>CloudTrail 預設只記「管理事件」（management event），例如建立儲存桶、修改政策。讀寫 S3 物件、呼叫 Lambda 這類「資料事件」（data event）要另外打開，而且另外收費。沒打開的話，紀錄裡就看不到 <code>GetObject</code>，你產生的政策也會漏掉它。</p>
<p><b>第二步，撈出實際呼叫過的動作。</b>CloudTrail 的檔案放在 S3，可以用 Athena 直接查：</p>
<pre><code>SELECT eventsource, eventname, count(*) AS calls
FROM cloudtrail_logs
WHERE useridentity.arn LIKE 'arn:aws:sts::111122223333:assumed-role/hilo-api/%'
  AND eventtime &gt; '2026-08-01T00:00:00Z'
  AND errorcode IS NULL
GROUP BY eventsource, eventname
ORDER BY calls DESC;

eventsource         eventname         calls
s3.amazonaws.com    GetObject       182330
s3.amazonaws.com    PutObject        41207
sqs.amazonaws.com   SendMessage      40991
kms.amazonaws.com   Decrypt           9812
kms.amazonaws.com   GenerateDataKey   2306</code></pre>
<p>注意最後兩列。存檔儲存桶用 KMS 加密，S3 會替這個角色去呼叫 KMS，這些呼叫也記在它名下。只看程式碼的人常常漏掉這一段，新政策一上線，寫存檔就失敗。</p>
<p><b>第三步，把資源和條件收窄。</b>紀錄只告訴你「做了哪些動作」，資源要你自己寫具體：</p>
<pre><code>{
  "Version": "2012-10-17",
  "Statement": [
    { "Sid": "Saves",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::hilo-saves/u/*" },
    { "Sid": "Events",
      "Effect": "Allow",
      "Action": "sqs:SendMessage",
      "Resource": "arn:aws:sqs:ap-northeast-1:111122223333:hilo-events" },
    { "Sid": "SaveKeyViaS3Only",
      "Effect": "Allow",
      "Action": ["kms:Decrypt", "kms:GenerateDataKey"],
      "Resource": "arn:aws:kms:ap-northeast-1:111122223333:key/1234abcd-…",
      "Condition": { "StringEquals": {
        "kms:ViaService": "s3.ap-northeast-1.amazonaws.com" } } }
  ]
}</code></pre>
<p>最後那個條件的意思是：這把金鑰只能「經由 S3」使用。就算攻擊者拿到這個角色的憑證，也不能直接呼叫 KMS 去解別的東西。</p>
<p><b>第四步，上線前先驗證。</b><code>aws accessanalyzer validate-policy --policy-type IDENTITY_POLICY --policy-document file://hilo-api.json</code> 會指出語法錯誤和危險寫法，例如 <code>iam:PassRole</code> 配萬用字元。IAM Access Analyzer 也能直接讀 CloudTrail，替你產生第一版政策，省掉第二步的手工；<code>aws iam simulate-principal-policy</code> 則能在上線前試算某個動作會不會被允許。</p>
<p><b>第五步，上線後盯著拒絕。</b>新政策上線後的一兩週，每天查一次這個角色的 AccessDenied。客戶管理的政策（customer managed policy）最多保留 5 個版本，出事可以馬上切回上一版。</p>
<div class="note"><b>觀察期要涵蓋少見的路徑。</b>每個月跑一次的結算、只有出錯時才走的重試邏輯、一年演練一次的災難復原，都可能不在最近 90 天的紀錄裡。產生政策之後，把這些路徑列出來，一條一條確認。另外，主控台的「上次存取時間」（last accessed）能看出哪些服務、甚至哪些動作很久沒用了，是定期回收權限最省力的工具。</div>

<h3><span class="badge lv3">專業</span>五、角色與短期憑證：四種工作負載，同一個模式</h3>
<p>長期金鑰最大的問題不是「可能外洩」，而是「外洩之後一直有效」。角色把這件事反過來：誰都不保管長期金鑰，要用的時候，拿一份證明去換一張會過期的憑證。差別只在每種工作負載拿什麼去換。</p>
<figure class="figure"><svg viewBox="0 0 680 262" class="fg" style="width:100%;max-width:680px" role="img" aria-label="EC2 程式、EKS Pod、CI 工作、工程師四種身分，各自拿不同的證明，到 IMDS、STS 或 IAM Identity Center 換成同一種會過期的短期憑證">
<text x="75" y="22" text-anchor="middle" class="fg-t sm acc">誰</text>
<text x="245" y="22" text-anchor="middle" class="fg-t sm acc">拿什麼證明</text>
<text x="450" y="22" text-anchor="middle" class="fg-t sm acc">去哪裡換</text>
<text x="625" y="22" text-anchor="middle" class="fg-t sm acc">拿到什麼</text>
<rect x="10" y="40" width="130" height="44" rx="6" class="fg-b alt"/><text x="75" y="67" text-anchor="middle" class="fg-t">EC2 上的程式</text>
<rect x="10" y="96" width="130" height="44" rx="6" class="fg-b alt"/><text x="75" y="123" text-anchor="middle" class="fg-t">EKS 的 Pod</text>
<rect x="10" y="152" width="130" height="44" rx="6" class="fg-b alt"/><text x="75" y="179" text-anchor="middle" class="fg-t">CI 的一次工作</text>
<rect x="10" y="208" width="130" height="44" rx="6" class="fg-b alt"/><text x="75" y="235" text-anchor="middle" class="fg-t">工程師</text>
<line x1="140" y1="62" x2="152" y2="62" class="fg-l"/><polygon points="160,62 152,57.5 152,66.5" class="fg-a"/>
<line x1="140" y1="118" x2="152" y2="118" class="fg-l"/><polygon points="160,118 152,113.5 152,122.5" class="fg-a"/>
<line x1="140" y1="174" x2="152" y2="174" class="fg-l"/><polygon points="160,174 152,169.5 152,178.5" class="fg-a"/>
<line x1="140" y1="230" x2="152" y2="230" class="fg-l"/><polygon points="160,230 152,225.5 152,234.5" class="fg-a"/>
<rect x="160" y="40" width="170" height="44" rx="6" class="fg-b"/><text x="245" y="58" text-anchor="middle" class="fg-t sm">機器本身</text><text x="245" y="75" text-anchor="middle" class="fg-t sm">EC2 知道它掛哪個角色</text>
<rect x="160" y="96" width="170" height="44" rx="6" class="fg-b"/><text x="245" y="114" text-anchor="middle" class="fg-t sm">服務帳號權杖</text><text x="245" y="131" text-anchor="middle" class="fg-t sm">叢集簽的 JWT</text>
<rect x="160" y="152" width="170" height="44" rx="6" class="fg-b"/><text x="245" y="170" text-anchor="middle" class="fg-t sm">OIDC 權杖</text><text x="245" y="187" text-anchor="middle" class="fg-t sm">GitHub 簽的 JWT</text>
<rect x="160" y="208" width="170" height="44" rx="6" class="fg-b"/><text x="245" y="226" text-anchor="middle" class="fg-t sm">SSO 登入</text><text x="245" y="243" text-anchor="middle" class="fg-t sm">密碼＋MFA</text>
<line x1="330" y1="62" x2="342" y2="62" class="fg-l"/><polygon points="350,62 342,57.5 342,66.5" class="fg-a"/>
<line x1="330" y1="118" x2="342" y2="118" class="fg-l"/><polygon points="350,118 342,113.5 342,122.5" class="fg-a"/>
<line x1="330" y1="174" x2="342" y2="174" class="fg-l"/><polygon points="350,174 342,169.5 342,178.5" class="fg-a"/>
<line x1="330" y1="230" x2="342" y2="230" class="fg-l"/><polygon points="350,230 342,225.5 342,234.5" class="fg-a"/>
<rect x="350" y="40" width="200" height="44" rx="6" class="fg-b"/><text x="450" y="58" text-anchor="middle" class="fg-t sm mono">IMDSv2</text><text x="450" y="75" text-anchor="middle" class="fg-t sm mono">169.254.169.254</text>
<rect x="350" y="96" width="200" height="44" rx="6" class="fg-b"/><text x="450" y="114" text-anchor="middle" class="fg-t sm mono">STS</text><text x="450" y="131" text-anchor="middle" class="fg-t sm mono">AssumeRoleWithWebIdentity</text>
<rect x="350" y="152" width="200" height="44" rx="6" class="fg-b"/><text x="450" y="170" text-anchor="middle" class="fg-t sm mono">STS</text><text x="450" y="187" text-anchor="middle" class="fg-t sm mono">AssumeRoleWithWebIdentity</text>
<rect x="350" y="208" width="200" height="44" rx="6" class="fg-b"/><text x="450" y="226" text-anchor="middle" class="fg-t sm">IAM Identity Center</text><text x="450" y="243" text-anchor="middle" class="fg-t sm">入口網站或 aws sso login</text>
<line x1="550" y1="62" x2="567" y2="62" class="fg-l on"/><polygon points="575,62 567,57.5 567,66.5" class="fg-a on"/>
<line x1="550" y1="118" x2="567" y2="118" class="fg-l on"/><polygon points="575,118 567,113.5 567,122.5" class="fg-a on"/>
<line x1="550" y1="174" x2="567" y2="174" class="fg-l on"/><polygon points="575,174 567,169.5 567,178.5" class="fg-a on"/>
<line x1="550" y1="230" x2="567" y2="230" class="fg-l on"/><polygon points="575,230 567,225.5 567,234.5" class="fg-a on"/>
<rect x="575" y="40" width="100" height="212" rx="8" class="fg-b hot"/>
<text x="625" y="112" text-anchor="middle" class="fg-t acc">短期憑證</text>
<text x="625" y="136" text-anchor="middle" class="fg-t sm mono">ASIA…</text>
<text x="625" y="154" text-anchor="middle" class="fg-t sm">＋ 工作階段權杖</text>
<text x="625" y="178" text-anchor="middle" class="fg-t sm">自動過期</text>
</svg><figcaption>四條路的終點都一樣：一組 ASIA 開頭、會自己過期的憑證。沒有人需要保管一把永遠有效的鑰匙。</figcaption></figure>
<p>換到的東西長這樣（手動擔任一個角色）：</p>
<pre><code>$ aws sts assume-role \\
    --role-arn arn:aws:iam::111122223333:role/hilo-deploy \\
    --role-session-name sk-1109
{
  "Credentials": {
    "AccessKeyId": "ASIA…",
    "SecretAccessKey": "…",
    "SessionToken": "IQoJb3JpZ2lu…",
    "Expiration": "2026-11-09T04:12:33+00:00"
  },
  "AssumedRoleUser": {
    "Arn": "arn:aws:sts::111122223333:assumed-role/hilo-deploy/sk-1109"
  }
}</code></pre>
<p>預設有效 1 小時；角色本身可以把上限設成 1 到 12 小時。用一個角色的憑證再去擔任另一個角色，叫角色串接（role chaining），最長只能 1 小時。<code>--role-session-name</code> 會出現在 CloudTrail 的 ARN 裡，寫成人名或工作編號，事後查紀錄才知道是誰。</p>
<h4>EC2：執行個體設定檔與 IMDSv2</h4>
<p>EC2 的角色是透過<b>執行個體設定檔</b>（instance profile）掛上去的。機器上的程式向中繼資料服務要憑證；SDK 會自動做這件事，也會在過期前自動換新：</p>
<pre><code>TOKEN=$(curl -s -X PUT http://169.254.169.254/latest/api/token \\
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \\
  http://169.254.169.254/latest/meta-data/iam/security-credentials/</code></pre>
<p>第一行用 PUT 拿一個權杖，這就是 IMDSv2。第 1.8 課的深入圖解講過它為什麼擋得住大部分 SSRF。這裡補一個實務細節：跳數上限（hop limit）設成 1，橋接網路裡的 Docker 容器就拿不到憑證；如果容器真的需要，可以設成 2，但更好的做法是讓容器有自己的身分，例如 ECS 的任務角色（task role）。</p>
<h4>EKS：IRSA 與 Pod Identity</h4>
<p>一個節點上跑著十幾個 Pod，不該全部共用節點的角色。EKS 有兩種方式，讓每個服務帳號對應一個 IAM 角色：</p>
<table>
<tr><th></th><th>IRSA</th><th>EKS Pod Identity</th></tr>
<tr><td>AWS 信任誰</td><td>這個叢集自己的 OIDC 簽發者，每個叢集一個</td><td>EKS 服務本身（<code>pods.eks.amazonaws.com</code>）</td></tr>
<tr><td>要先做什麼</td><td>在 IAM 登記叢集的 OIDC 提供者；信任政策寫死簽發者和服務帳號</td><td>叢集裝 Pod Identity Agent；用 API 建一筆「服務帳號對應角色」的關聯</td></tr>
<tr><td>誰去換憑證</td><td>Pod 裡的 SDK 拿投射進來的權杖，呼叫 <code>AssumeRoleWithWebIdentity</code></td><td>節點上的代理程式替 Pod 去換</td></tr>
<tr><td>多個叢集共用一個角色</td><td>每加一個叢集，信任政策就要多寫一個簽發者</td><td>信任政策不綁叢集，可以直接共用</td></tr>
</table>
<p>IRSA 信任政策的關鍵在條件。跟 CI 的 OIDC 一樣，<code>sub</code> 要寫死到 Namespace 和服務帳號：</p>
<pre><code>"Condition": {
  "StringEquals": {
    "oidc.eks.ap-northeast-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B71:sub":
      "system:serviceaccount:shop:hilo-api",
    "oidc.eks.ap-northeast-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B71:aud":
      "sts.amazonaws.com"
  }
}</code></pre>
<p>CI 用 OIDC 換憑證的完整流程，第 2.6 課的深入圖解已經一步一步畫過。人則用 IAM Identity Center 單一登入，在命令列執行 <code>aws sso login --profile prod</code>，拿到的同樣是幾小時就過期的角色憑證。四種情況都是同一個模式：<b>拿一份別人簽過的證明，去換一張會過期的憑證</b>。</p>
<div class="note"><b>最常見的坑：殘留的環境變數贏過角色。</b>SDK 找憑證有固定的順序，環境變數 <code>AWS_ACCESS_KEY_ID</code> 排在最前面，中繼資料服務排在最後。伺服器上如果殘留一組當年測試用的長期金鑰，程式會一直用它，角色設得再漂亮也沒用。檢查方法很簡單：在那台機器、用跑程式的那個使用者，執行 <code>aws sts get-caller-identity</code>，看回來的 ARN 是 <code>assumed-role/…</code> 還是 <code>user/…</code>。</div>

<h3><span class="badge lv3">專業</span>六、跨帳號存取與混淆代理人</h3>
<p>成熟的團隊會把 CI、正式環境、日誌分在不同帳號。CI 帳號 444455556666 裡的部署角色，要去正式帳號 111122223333 更新服務，需要兩邊點頭：</p>
<ul>
<li>正式帳號裡的 <code>hilo-deploy</code> 角色，信任政策寫「允許 <code>arn:aws:iam::444455556666:role/ci-runner</code> 來擔任我」。</li>
<li>CI 帳號裡的 <code>ci-runner</code> 角色，身分政策寫「允許對 <code>arn:aws:iam::111122223333:role/hilo-deploy</code> 呼叫 <code>sts:AssumeRole</code>」。</li>
</ul>
<p>少一邊都不行。信任政策的 Principal 最好寫具體的角色 ARN，不要只寫對方帳號（<code>…:root</code>）：後者等於把「誰能擔任」的決定權，交給對方帳號的管理員。</p>
<h4>混淆代理人：供應商替壞人跑腿</h4>
<p>很多 SaaS（監控、成本分析、資安掃描）會請你在自己的帳號裡建一個角色，讓它們的 AWS 帳號來擔任。問題在於：供應商只有一個 AWS 身分，卻替成千上萬個客戶去擔任角色。如果攻擊者也是這家供應商的客戶，他在自己的設定頁填上<b>你的</b>角色 ARN，供應商的後端就會用自己的身分去擔任你的角色，再把結果顯示在攻擊者的畫面上。被利用的「代理人」（deputy）沒有惡意，它只是分不清自己在替誰做事。這叫<b>混淆代理人問題</b>（confused deputy problem）。</p>
<figure class="figure"><svg viewBox="0 0 680 270" class="fg" style="width:100%;max-width:680px" role="img" aria-label="混淆代理人：你和攻擊者都把你的角色 ARN 交給同一家供應商，供應商擔任角色時帶上各租戶的 External ID，只有你的值和信任政策相符">
<text x="340" y="20" text-anchor="middle" class="fg-t sm">供應商只有一個 AWS 身分，替所有客戶去擔任角色</text>
<rect x="10" y="40" width="160" height="56" rx="6" class="fg-b alt"/><text x="90" y="63" text-anchor="middle" class="fg-t">你的租戶</text><text x="90" y="83" text-anchor="middle" class="fg-t sm">External ID：a1f3</text>
<rect x="10" y="180" width="160" height="56" rx="6" class="fg-b warm"/><text x="90" y="203" text-anchor="middle" class="fg-t">攻擊者的租戶</text><text x="90" y="223" text-anchor="middle" class="fg-t sm">External ID：7c9e</text>
<path d="M170 68 H210 V124 H242" class="fg-l alt"/><polygon points="250,124 242,119.5 242,128.5" class="fg-a alt"/>
<text x="178" y="60" class="fg-t sm alt">填入你的角色 ARN</text>
<path d="M170 208 H210 V152 H242" class="fg-l warm"/><polygon points="250,152 242,147.5 242,156.5" class="fg-a warm"/>
<text x="178" y="228" class="fg-t sm warm">也填了你的角色 ARN</text>
<rect x="250" y="100" width="170" height="76" rx="6" class="fg-b"/><text x="335" y="132" text-anchor="middle" class="fg-t">供應商的後端</text><text x="335" y="152" text-anchor="middle" class="fg-t sm">AWS 帳號 5555</text>
<line x1="420" y1="124" x2="502" y2="124" class="fg-l alt"/><polygon points="510,124 502,119.5 502,128.5" class="fg-a alt"/><text x="465" y="116" text-anchor="middle" class="fg-t sm alt">帶 a1f3</text>
<line x1="420" y1="152" x2="502" y2="152" class="fg-l warm"/><polygon points="510,152 502,147.5 502,156.5" class="fg-a warm"/><text x="465" y="144" text-anchor="middle" class="fg-t sm warm">帶 7c9e</text>
<rect x="510" y="100" width="160" height="76" rx="6" class="fg-b hot"/><text x="590" y="124" text-anchor="middle" class="fg-t acc">你帳號裡的角色</text><text x="590" y="144" text-anchor="middle" class="fg-t sm">信任帳號 5555</text><text x="590" y="162" text-anchor="middle" class="fg-t sm">要求 ExternalId＝a1f3</text>
<text x="590" y="202" text-anchor="middle" class="fg-t sm acc">a1f3 相符：換到憑證</text>
<text x="590" y="222" text-anchor="middle" class="fg-t sm warm">7c9e 不符：AccessDenied</text>
<text x="340" y="260" text-anchor="middle" class="fg-t sm">信任政策沒有 External ID 條件時，下面那條橘線也會成功</text>
</svg><figcaption>代理人分不清自己替誰做事。External ID 把「替哪個客戶做事」變成信任政策能檢查的條件。</figcaption></figure>
<p>解法是 <b>External ID</b>：供應商替每個客戶產生一個唯一、客戶自己不能改的值，你在信任政策裡要求它：</p>
<pre><code>{
  "Effect": "Allow",
  "Principal": { "AWS": "arn:aws:iam::555555555555:root" },
  "Action": "sts:AssumeRole",
  "Condition": {
    "StringEquals": {
      "sts:ExternalId": "a1f3c9e2-7b44-4d2e"
    }
  }
}</code></pre>
<p>供應商每次替某個客戶擔任角色，都帶上那個客戶自己的 External ID。攻擊者的租戶帶的是他自己的值，對不上，就是 AccessDenied。External ID 不是密碼，它的作用是讓「替誰做事」變成可以檢查的條件。也正因為如此，它必須由供應商產生、每個客戶都不同；讓客戶自己填，攻擊者就能填你的值，整個機制就失去意義了。</p>
<p>AWS 自己的服務也可能當代理人。例如允許 S3 把事件送進你的 SNS 主題時，主題政策除了寫服務主體 <code>s3.amazonaws.com</code>，還要加上 <code>aws:SourceArn</code>（哪個儲存桶）或 <code>aws:SourceAccount</code>（哪個帳號）的條件，不然別人的儲存桶也能往你的主題送訊息。</p>

<h3><span class="badge lv3">專業</span>七、根使用者與帳號結構</h3>
<p>根使用者不受任何身分政策和權限邊界限制；帳號沒加入組織時，也不受 SCP 限制。有些事只有它能做：關閉帳號、修改帳號的電子郵件和根密碼、更改支援方案。還有兩件救命用的：IAM 管理員把自己的權限弄丟時，由它恢復；有人寫了一份「拒絕所有人」的儲存桶政策把儲存桶鎖死，也只有它能刪掉那份政策。</p>
<ul>
<li>用硬體安全金鑰或通行金鑰（passkey）當 MFA，至少註冊兩把，一把放保險箱。</li>
<li>沒有存取金鑰。帳號摘要裡的 <code>AccountAccessKeysPresent</code> 必須是 0。</li>
<li>帳號電子郵件用團隊共用的信箱，不要綁某一個人的信箱。那個人離職或信箱被盜，帳號就跟著走了。</li>
<li>任何一次根使用者登入都發警報（下一節有查詢）。</li>
</ul>
<p>有了 AWS Organizations 之後，<b>帳號本身就是最硬的邊界</b>。常見的結構是：管理帳號只管組織和帳單，不放任何東西；一個日誌封存帳號（log archive），所有帳號的 CloudTrail 都寫進去，其他帳號的人刪不掉；一個資安工具帳號，集中看 GuardDuty 和 Security Hub；正式、測試、開發各自一個帳號。組織還能集中管理成員帳號的根使用者：直接移除它們的根密碼，少數需要根權限的操作改從管理帳號執行。再用 SCP 把護欄釘死：</p>
<pre><code>{
  "Version": "2012-10-17",
  "Statement": [
    { "Sid": "ProtectAuditTrail",
      "Effect": "Deny",
      "Action": ["cloudtrail:StopLogging", "cloudtrail:DeleteTrail",
                 "guardduty:DeleteDetector",
                 "organizations:LeaveOrganization"],
      "Resource": "*" },
    { "Sid": "NoRootInMemberAccounts",
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*",
      "Condition": { "StringLike": {
        "aws:PrincipalArn": "arn:aws:iam::*:root" } } }
  ]
}</code></pre>
<p>限制區域的 SCP 也很常見，但要小心：IAM、CloudFront、Route 53 這類全球服務的控制端點在美東（us-east-1），直接全擋會把它們一起擋掉，要用 <code>NotAction</code> 把全球服務排除。SCP 寫錯一次，就是整個組織一起壞，所以先套在一個測試用的組織單位上。最後，準備一組<b>緊急破窗</b>（break-glass）身分：SSO 壞掉時用的管理員，密碼和 MFA 分開保管，一用就發警報，用完就輪替。</p>

<h3><span class="badge lv4">專家</span>八、偵測濫用：偷來的金鑰會留下什麼腳印</h3>
<p>偷到金鑰的人，前幾步幾乎都一樣。認得這個順序，就知道該在哪裡裝感應器：</p>
<figure class="figure"><svg viewBox="0 0 680 218" class="fg" style="width:100%;max-width:680px" role="img" aria-label="金鑰外洩後的攻擊時間軸：外洩、查詢身分、到處摸索、留後門、變現，每一步下方對應一個你看得到的偵測訊號">
<text x="10" y="22" class="fg-t sm warm">攻擊者在做什麼</text>
<rect x="10" y="32" width="128" height="50" rx="6" class="fg-b warm"/><text x="74" y="52" text-anchor="middle" class="fg-t">金鑰外洩</text><text x="74" y="72" text-anchor="middle" class="fg-t sm">推上公開 repo</text>
<rect x="142" y="32" width="128" height="50" rx="6" class="fg-b warm"/><text x="206" y="52" text-anchor="middle" class="fg-t">先問我是誰</text><text x="206" y="72" text-anchor="middle" class="fg-t sm mono">GetCallerIdentity</text>
<rect x="274" y="32" width="128" height="50" rx="6" class="fg-b warm"/><text x="338" y="52" text-anchor="middle" class="fg-t">到處摸索</text><text x="338" y="72" text-anchor="middle" class="fg-t sm">List*、Describe*</text>
<rect x="406" y="32" width="128" height="50" rx="6" class="fg-b warm"/><text x="470" y="52" text-anchor="middle" class="fg-t">留後門</text><text x="470" y="72" text-anchor="middle" class="fg-t sm mono">CreateAccessKey</text>
<rect x="538" y="32" width="128" height="50" rx="6" class="fg-b warm"/><text x="602" y="52" text-anchor="middle" class="fg-t">變現</text><text x="602" y="72" text-anchor="middle" class="fg-t sm">開 GPU 機器挖礦</text>
<line x1="10" y1="110" x2="660" y2="110" class="fg-l"/><polygon points="668,110 660,105.5 660,114.5" class="fg-a"/>
<line x1="74" y1="82" x2="74" y2="104" class="fg-l"/><line x1="206" y1="82" x2="206" y2="104" class="fg-l"/><line x1="338" y1="82" x2="338" y2="104" class="fg-l"/><line x1="470" y1="82" x2="470" y2="104" class="fg-l"/><line x1="602" y1="82" x2="602" y2="104" class="fg-l"/>
<circle cx="74" cy="110" r="6" class="fg-lamp on"/><circle cx="206" cy="110" r="6" class="fg-lamp on"/><circle cx="338" cy="110" r="6" class="fg-lamp on"/><circle cx="470" cy="110" r="6" class="fg-lamp on"/><circle cx="602" cy="110" r="6" class="fg-lamp on"/>
<line x1="74" y1="116" x2="74" y2="136" class="fg-l dash"/><line x1="206" y1="116" x2="206" y2="136" class="fg-l dash"/><line x1="338" y1="116" x2="338" y2="136" class="fg-l dash"/><line x1="470" y1="116" x2="470" y2="136" class="fg-l dash"/><line x1="602" y1="116" x2="602" y2="136" class="fg-l dash"/>
<rect x="10" y="136" width="128" height="50" rx="6" class="fg-b hot"/><text x="74" y="156" text-anchor="middle" class="fg-t">秘密掃描</text><text x="74" y="176" text-anchor="middle" class="fg-t sm">推上去就通知</text>
<rect x="142" y="136" width="128" height="50" rx="6" class="fg-b hot"/><text x="206" y="156" text-anchor="middle" class="fg-t">GuardDuty</text><text x="206" y="176" text-anchor="middle" class="fg-t sm">陌生來源的呼叫</text>
<rect x="274" y="136" width="128" height="50" rx="6" class="fg-b hot"/><text x="338" y="156" text-anchor="middle" class="fg-t">AccessDenied</text><text x="338" y="176" text-anchor="middle" class="fg-t sm">短時間大量出現</text>
<rect x="406" y="136" width="128" height="50" rx="6" class="fg-b hot"/><text x="470" y="156" text-anchor="middle" class="fg-t">警報規則</text><text x="470" y="176" text-anchor="middle" class="fg-t sm">新的存取金鑰</text>
<rect x="538" y="136" width="128" height="50" rx="6" class="fg-b hot"/><text x="602" y="156" text-anchor="middle" class="fg-t">預算警報</text><text x="602" y="176" text-anchor="middle" class="fg-t sm">挖礦類的發現</text>
<text x="10" y="208" class="fg-t sm acc">你看得到的訊號</text>
</svg><figcaption>每一步都會留下紀錄。越早的訊號，損失越小；只靠帳單警報，通常是錢已經燒掉之後才知道。</figcaption></figure>
<p>第一個呼叫常常是 <code>sts:GetCallerIdentity</code>。它不需要任何權限，卻會告訴攻擊者「這把金鑰屬於哪個帳號、哪個身分」。在 CloudTrail 裡長這樣：</p>
<pre><code>{
  "eventTime": "2026-11-09T02:14:07Z",
  "eventSource": "sts.amazonaws.com",
  "eventName": "GetCallerIdentity",
  "sourceIPAddress": "203.0.113.77",
  "userAgent": "aws-cli/2.x Python/3.x Linux/…",
  "userIdentity": {
    "type": "IAMUser",
    "arn": "arn:aws:iam::111122223333:user/ci-legacy",
    "accessKeyId": "AKIA…"
  }
}</code></pre>
<p>一個 CI 用的舊使用者，從沒見過的 IP、用互動式的命令列工具，問「我是誰」。單看這一筆就很可疑。接下來它會在各個區域到處 <code>List</code>、<code>Describe</code>，被拒絕很多次，因為它在摸索這把金鑰能做什麼。把這些變成固定的查詢：</p>
<pre><code>-- 根使用者最近做了什麼（正常情況下幾乎是空的）
SELECT eventtime, eventname, sourceipaddress, awsregion
FROM cloudtrail_logs
WHERE useridentity.type = 'Root'
ORDER BY eventtime DESC LIMIT 50;

-- 今天被拒絕最多次的身分：偷來的金鑰在試探權限
SELECT useridentity.arn, count(*) AS denied,
       count(DISTINCT eventname) AS apis,
       count(DISTINCT sourceipaddress) AS ips
FROM cloudtrail_logs
WHERE (errorcode LIKE '%AccessDenied%'
       OR errorcode LIKE '%UnauthorizedOperation%')
  AND eventtime &gt; '2026-11-09T00:00:00Z'
GROUP BY useridentity.arn
ORDER BY denied DESC LIMIT 20;</code></pre>
<p>需要即時通知的，用 EventBridge 規則直接比對事件：根使用者登入、<code>CreateAccessKey</code>、<code>CreateUser</code>、<code>UpdateAssumeRolePolicy</code>（改了誰能擔任某個角色）、<code>PutBucketPolicy</code>、<code>StopLogging</code>。這些事在大部分團隊一週發生不到幾次，每一次都值得有人看一眼。</p>
<h4>GuardDuty 幫你看的事</h4>
<p>GuardDuty 讀 CloudTrail、VPC 流量日誌和 DNS 查詢，用規則和行為模型找異常。幾個最值得認得的發現（finding）類型：</p>
<table>
<tr><th>發現類型</th><th>意思</th></tr>
<tr><td><code>UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration.OutsideAWS</code></td><td>EC2 角色的短期憑證，在 AWS 外面被拿來用。幾乎就是 SSRF 或機器被入侵</td></tr>
<tr><td><code>Policy:IAMUser/RootCredentialUsage</code></td><td>有人用了根使用者</td></tr>
<tr><td><code>Stealth:IAMUser/CloudTrailLoggingDisabled</code></td><td>有人關掉了 CloudTrail，想讓你看不見</td></tr>
<tr><td><code>Discovery:IAMUser/AnomalousBehavior</code></td><td>一個身分突然做起它平常不做的列舉</td></tr>
<tr><td><code>CryptoCurrency:EC2/BitcoinTool.B!DNS</code></td><td>機器在查挖礦池的網域</td></tr>
</table>
<h4>發現金鑰外洩後的頭三十分鐘</h4>
<ol>
<li><b>停用</b>那把金鑰（<code>aws iam update-access-key --status Inactive</code>），先不要刪。停用可以恢復，萬一停錯了，服務還救得回來。</li>
<li><b>撤銷已發出的工作階段。</b>如果外洩的是角色憑證，改信任政策沒有用，已經發出去的憑證會一直活到過期。IAM 主控台的「撤銷作用中的工作階段」（revoke active sessions）會替角色加一條政策，拒絕所有在這一刻之前發出的憑證（條件用的是 <code>aws:TokenIssueTime</code>）。</li>
<li><b>用金鑰 ID 查 CloudTrail</b>，每個區域都要查：它做了什麼、從哪些 IP。</li>
<li><b>找後門：</b>新的使用者、新的金鑰、新的角色或被改過的信任政策、新的 Lambda、新開的機器。攻擊者知道你會停用第一把金鑰，所以通常會先替自己再做一把。</li>
</ol>
<p>附帶一提：AWS 發現金鑰出現在公開的 GitHub 上時，會自動替那個 IAM 使用者掛上一份隔離用的受管政策（名稱以 <code>AWSCompromisedKeyQuarantine</code> 開頭），擋掉最危險的動作，並寄信通知你。它是安全網，不是應變計畫。</p>

<h3><span class="badge lv4">專家</span>九、真實事故裡的 IAM 錯誤，和權限提升的捷徑</h3>
<table>
<tr><th>事件</th><th>發生了什麼</th><th>哪一道 IAM 防線能打斷它</th></tr>
<tr><td>Code Spaces（2014）</td><td>攻擊者取得公司 AWS 主控台的存取權，勒索不成，就把機器、儲存空間和備份全部刪掉。備份放在同一個帳號裡。這家公司隨後宣布結束營業。</td><td>主控台強制 MFA；備份放在另一個帳號，用 SCP 和物件鎖定保護</td></tr>
<tr><td>Uber（2016）</td><td>攻擊者進到工程師用的私有 GitHub 倉庫，裡面有一組 AWS 長期金鑰，拿它從 S3 下載了約 5,700 萬名乘客和司機的資料。</td><td>程式碼裡不放長期金鑰；機器用角色；秘密掃描</td></tr>
<tr><td>Capital One（2019）</td><td>SSRF 拿到 EC2 角色的短期憑證，而那個角色能讀大量 S3（第 1.8 課的深入圖解追過）。</td><td>IMDSv2；角色只給它需要的儲存桶</td></tr>
<tr><td>Uber（2022）</td><td>攻擊者用買來的外包人員密碼登入，一直發 MFA 推播騷擾，再假冒 IT 傳訊息叫對方按同意。進入內網後，在網路共用資料夾的 PowerShell 腳本裡找到特權存取管理系統的管理員帳密，一路拿到各個雲端的權限。</td><td>防推播疲勞的 MFA（數字比對或安全金鑰）；腳本裡不寫帳密</td></tr>
<tr><td>LastPass（2022）</td><td>攻擊者入侵一位資深 DevOps 工程師的家用電腦，透過一個有漏洞的第三方媒體軟體裝上鍵盤側錄程式，偷到他的主密碼，打開公司的保險庫，裡面有存取雲端備份的金鑰。</td><td>能碰正式備份的身分，要求受管理的裝置和短期憑證；高權限存取發警報</td></tr>
</table>
<p>五件事沒有一件需要零時差漏洞。共同點是：<b>一把權限太大、活得太久的鑰匙，放在攻擊者摸得到的地方。</b></p>
<h4>看起來無害的權限，怎麼變成管理員</h4>
<p>攻擊者拿到一個「普通」身分之後，下一步就是找捷徑把自己變成管理員。審查政策時，這些組合要一眼認出來：</p>
<ul>
<li><b><code>iam:PassRole</code> 加 <code>ec2:RunInstances</code>，資源是 <code>*</code>：</b>只要帳號裡有一個掛著大角色的執行個體設定檔，就能開一台機器掛上它，再從機器的中繼資料服務讀出憑證。同一招也適用於 Lambda、ECS 等任何「能指定角色來執行」的服務。<code>iam:PassRole</code> 一定要限定到具體的角色 ARN。</li>
<li><b><code>iam:CreatePolicyVersion</code>：</b>替自己身上的受管政策建一個新版本，內容寫 <code>"Action": "*"</code>，再設成預設版本。</li>
<li><b><code>iam:AttachUserPolicy</code>、<code>iam:PutRolePolicy</code>：</b>直接幫自己掛上管理員政策。</li>
<li><b><code>iam:UpdateAssumeRolePolicy</code>：</b>改掉某個大角色的信任政策，讓自己能擔任它。</li>
<li><b><code>lambda:UpdateFunctionCode</code>：</b>改寫一個掛著大角色的 Lambda，讓它替你做事。</li>
</ul>
<h4>政策語言裡的三個陷阱</h4>
<ul>
<li><b>信任政策或資源政策裡寫 <code>"Principal": "*"</code>：</b>全世界任何 AWS 帳號都符合。除非後面有很嚴的條件（例如 <code>aws:PrincipalOrgID</code>），否則就等於公開。</li>
<li><b>Allow 配 <code>NotAction</code>：</b><code>"Effect": "Allow", "NotAction": "iam:*"</code> 不是「不准碰 IAM」，而是「除了 IAM 以外全部允許」，包括將來新推出的每一個服務。</li>
<li><b><code>ForAllValues</code> 遇到空集合：</b><code>ForAllValues:StringEquals</code> 的意思是「請求裡的每一個值都在清單中」。如果請求根本沒帶這個鍵，條件會<b>成立</b>。想要求「一定要帶，而且只能是這些」，要再加一條 <code>Null</code> 條件，檢查它確實存在。</li>
</ul>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>改掉角色的信任政策，攻擊者手上的憑證就沒用了</td><td>信任政策只管「下一次能不能擔任」。已經發出去的憑證照樣能用到過期。要撤銷工作階段，或直接拿掉角色的權限。</td></tr>
<tr><td>SCP 可以替帳號開權限</td><td>SCP 只設上限，永遠不會給權限。真正給權限的是身分型和資源型政策。</td></tr>
<tr><td>短期憑證外洩沒關係，反正一小時就過期</td><td>一小時足夠攻擊者替自己做一把長期金鑰、建一個新使用者。SSRF 沒修好，他還能一直重新拿。</td></tr>
<tr><td>開了 MFA，帳號就安全了</td><td>MFA 擋的是密碼外洩。長期存取金鑰根本不經過 MFA；推播式 MFA 會被疲勞轟炸；被偷走的瀏覽器工作階段也能繞過它。</td></tr>
<tr><td>最小權限就是先給很少，等報錯再補</td><td>這樣做的結局通常是有人不耐煩，直接補一個 <code>*</code>。用紀錄產生政策、上線後觀察拒絕，才收得住。</td></tr>
<tr><td>同一個帳號裡把角色分好就夠了</td><td>帳號才是最硬的邊界。正式環境、CI、日誌放在不同帳號，一個被拿下，另一個還在。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>Node.js 和 Go 後端：</b>AWS 的 JavaScript SDK v3 和 Go SDK v2 都有預設的憑證提供鏈。程式碼裡不寫任何金鑰，也不要自己讀環境變數拼憑證，交給 SDK。本機開發用 <code>aws sso login</code> 加 profile，部署後自動改用角色，程式碼一行都不用改。</li>
<li><b>Vue 前端、Cocos 和 Unity 遊戲用戶端：</b>打包給使用者的東西都等於公開，絕對不放雲端金鑰。要讓玩家上傳頭像或下載存檔，由後端用自己的角色簽一個預先簽章網址（presigned URL），限定一個物件、幾分鐘有效。注意：用短期憑證簽的網址，最晚會在那組憑證過期時失效。</li>
<li><b>Docker：</b>不要把 <code>~/.aws</code> 掛進容器，也不要用 <code>-e AWS_SECRET_ACCESS_KEY=…</code> 啟動。在雲端上，讓容器拿自己的任務角色或 Pod 身分。</li>
<li><b>Terraform 和 CI：</b>每個環境一個部署角色，CI 用 OIDC 擔任；跑 plan 用唯讀角色，apply 才用能寫的角色。</li>
<li><b>雲端主機：</b>新機器一律強制 IMDSv2；舊機器用 <code>aws ec2 modify-instance-metadata-options --instance-id i-… --http-tokens required</code> 改過來。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<p>雲端工程師、DevOps、資安職缺幾乎一定會問 IAM。先自己講一遍，再打開參考答案。</p>
<ol>
<li>「說明 AWS 怎麼決定一個 API 請求是允許還是拒絕。SCP 和權限邊界扮演什麼角色？」</li>
<li>「EC2 或 Kubernetes 上的服務，該怎麼拿到雲端憑證？為什麼不用存取金鑰？」</li>
<li>「什麼是混淆代理人問題？External ID 怎麼解決它？」</li>
<li>「你發現一把存取金鑰被推上公開的 GitHub，接下來半小時你會做什麼？」</li>
<li>「怎麼把一個權限過大的正式服務收斂成最小權限，又不把它弄壞？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>預設是拒絕。AWS 收齊這個請求適用的所有政策：只要有一條明確 Deny 符合，就拒絕；帳號在組織裡時，SCP（和 RCP）必須允許；接著資源型政策或身分型政策至少要有一個允許，同帳號時資源型政策可以單獨給權限，跨帳號時兩邊都要允許；如果主體有權限邊界、這次帶了工作階段政策，動作也必須在它們允許的範圍內。SCP、權限邊界、工作階段政策只設上限、不給權限，有效權限是它們和身分政策的交集。</li>
<li>EC2 用執行個體設定檔加 IMDSv2；EKS 用 IRSA 或 Pod Identity，讓每個服務帳號對應自己的角色；CI 用 OIDC 換短期憑證；人用 SSO 擔任角色。好處是沒有長期秘密：憑證自動輪替、自動過期，外洩的影響有時間上限；工作階段名稱也讓 CloudTrail 能對回是哪台機器、哪個 Pod。長期金鑰會被複製到筆電、映像檔、日誌裡，很難輪替，外洩之後一直有效。</li>
<li>代理人是一個有權限、替很多人做事的服務，例如 SaaS 供應商。攻擊者以客戶身分把受害者的角色 ARN 交給它，它就用自己的身分去擔任受害者的角色，替攻擊者讀資料。External ID 是供應商替每個客戶產生、客戶不能自訂的唯一值，受害者在信任政策裡要求 <code>sts:ExternalId</code> 等於自己的值；供應商替攻擊者擔任角色時帶的是攻擊者的值，對不上就被拒絕。AWS 服務當代理人時，對應的做法是 <code>aws:SourceArn</code> 和 <code>aws:SourceAccount</code> 條件。</li>
<li>先停用那把金鑰（不刪，保留恢復的可能）；用金鑰 ID 查所有區域的 CloudTrail，看它做了什麼、從哪些 IP 來；找後門：新的使用者、金鑰、角色、信任政策變更、Lambda、機器；如果它擔任過角色，撤銷那些角色的作用中工作階段；評估讀過或改過哪些資料，依法規決定是否通報。從 git 歷史刪掉不算解決，要假設它已經被抓走了。最後找根因：把這個使用者換成角色或 OIDC，加上提交前的秘密掃描。</li>
<li>先確認 CloudTrail 有開需要的資料事件；用 Athena 或 IAM Access Analyzer，依過去 90 天的實際呼叫產生政策；補上紀錄裡看不到的少見路徑，例如月結和災難復原；資源寫成具體 ARN，能加條件就加；用 Access Analyzer 的政策驗證和模擬器檢查；上線時保留舊版本以便馬上回復；上線後一兩週每天看這個角色的 AccessDenied。之後用「上次存取時間」定期回收沒在用的權限。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>一個角色的身分政策允許 <code>s3:*</code>，權限邊界只允許 <code>s3:GetObject</code>，帳號沒有加入組織。（a）它對同帳號裡一個沒有儲存桶政策的儲存桶做 <code>PutObject</code>，結果是什麼？<code>GetObject</code> 呢？（b）換一個角色，它的身分政策只有 <code>dynamodb:*</code>，另一個帳號的儲存桶政策明確允許它 <code>GetObject</code>，結果是什麼？</li>
<li>替 Namespace <code>payments</code> 裡的服務帳號 <code>worker</code> 寫 IRSA 的信任政策條件。如果有人把 <code>sub</code> 改成 <code>StringLike</code> 和 <code>system:serviceaccount:payments:*</code>，會打開什麼風險？</li>
<li>這份政策有什麼問題？攻擊者拿到它會怎麼做？怎麼修？<br><code>{"Effect": "Allow", "Action": ["iam:PassRole", "lambda:CreateFunction", "lambda:InvokeFunction"], "Resource": "*"}</code></li>
<li>寫一個 Athena 查詢：找出同一天內從超過 3 個不同 IP 使用過的長期存取金鑰。</li>
<li>一家 SaaS 供應商請你建一個角色給它擔任，還說「External ID 可以留空，比較方便」。你怎麼回覆？除了 External ID，你還會怎麼限制這個角色？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>（a）<code>PutObject</code> 被拒絕：身分政策允許，但權限邊界沒有允許，有效權限是兩者的交集。<code>GetObject</code> 允許，因為兩邊都允許。（b）被拒絕。跨帳號時兩邊都要點頭，對方的儲存桶政策點頭了，但這個角色自己的身分政策沒有允許任何 S3 動作。</li>
<li>Principal 是 <code>{"Federated": "arn:aws:iam::111122223333:oidc-provider/oidc.eks.ap-northeast-1.amazonaws.com/id/叢集ID"}</code>，Action 是 <code>sts:AssumeRoleWithWebIdentity</code>，條件用 <code>StringEquals</code>：<code>…:sub</code> 等於 <code>system:serviceaccount:payments:worker</code>，<code>…:aud</code> 等於 <code>sts.amazonaws.com</code>。改成萬用字元之後，這個 Namespace 裡任何服務帳號都能擔任它；而在那裡有權建立 Pod 或服務帳號的人，就能建一個新的來拿這個角色。</li>
<li><code>iam:PassRole</code> 的資源是 <code>*</code>，代表可以把帳號裡任何角色交給新建的 Lambda。攻擊者建一個函式、掛上權限最大的角色，再呼叫它，例如替自己的使用者掛上管理員政策。修法：<code>iam:PassRole</code> 的資源限定為具體的執行角色 ARN，並加條件 <code>iam:PassedToService</code> 等於 <code>lambda.amazonaws.com</code>；那個執行角色本身也要是最小權限。</li>
<li><pre><code>SELECT useridentity.accesskeyid,
       date(from_iso8601_timestamp(eventtime)) AS day,
       count(DISTINCT sourceipaddress) AS ips
FROM cloudtrail_logs
WHERE useridentity.accesskeyid LIKE 'AKIA%'
GROUP BY 1, 2
HAVING count(DISTINCT sourceipaddress) &gt; 3
ORDER BY ips DESC;</code></pre>只看 <code>AKIA</code>，因為長期金鑰最危險；短期憑證的金鑰 ID 每次都換，要改用角色的 ARN 來分組。CI 用的金鑰本來就可能從很多 IP 來，查出來要先排除已知的例外。</li>
<li>拒絕留空。沒有 External ID，這家供應商的任何其他客戶，都能讓它的後端擔任你的角色，這就是混淆代理人。請它替你的租戶產生一個唯一的值，寫進信任政策的 <code>sts:ExternalId</code> 條件。另外：Principal 寫供應商具體的角色 ARN 而不是整個帳號；角色只給它需要的唯讀權限，最好用權限邊界再框一次；替這個角色的 CloudTrail 活動設警報，例如出現寫入動作或陌生的區域。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>AWS IAM 使用者指南的〈Policy evaluation logic〉</b>（<a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html">docs.aws.amazon.com</a>）：官方的完整評估流程圖，包含同帳號、跨帳號、權限邊界與工作階段政策的所有細節。這一章第三節的圖就是它的簡化版。</li>
<li><b>flaws.cloud 與 flaws2.cloud</b>（Scott Piper）：免費的闖關練習，每一關都是一個真實常見的 AWS 設定錯誤；flaws2 還分攻擊方和防守方兩條路線，防守方那條就是在練 CloudTrail 調查。</li>
<li><b>AWS Security Reference Architecture（AWS SRA）</b>：AWS 官方的多帳號資安架構指南，日誌封存帳號、資安工具帳號、SCP 怎麼擺，都有完整的範例。</li>
<li><b>Rhino Security Labs〈AWS IAM Privilege Escalation – Methods and Mitigation〉</b>：整理了二十多種 IAM 權限提升手法，第九節那份清單的完整版；他們的開源工具 Pacu 可以在自己的測試帳號裡實際跑一遍。</li>
<li><b>AWS Well-Architected Framework 的 Security Pillar</b>：身分管理、偵測、事件應變的官方最佳實務，適合當作檢查自己帳號的清單。</li>
</ul>
` });
