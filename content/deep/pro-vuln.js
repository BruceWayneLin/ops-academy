DEEP({ 'pro-vuln': `
<p>上一課給了弱點管理的循環：盤點、掃描、排優先、修、驗證。這一章把每一步拆到能落地的程度：資產清單要記哪些欄位、每一種掃描器各自看不到什麼、CVSS 的 9.8 分到底怎麼算出來的、EPSS 和 KEV 怎麼搭配，用一組具體的掃描結果走一次排序，再談修補期限、例外、修補管線怎麼驗證，最後是怎麼衡量整個計畫做得好不好。</p>

<h3><span class="badge lv1">基礎</span>一、先有清單，才有弱點管理</h3>
<p>想像你要替一棟房子裝鎖，卻不知道它有幾扇門、幾扇窗。你可以把看得到的每一扇都鎖好，小偷還是會從地下室那扇你不知道的窗戶進來。弱點管理也一樣：<b>你修不了你不知道自己有的東西</b>。真實的入侵事件裡，很常見的入口是「那台沒人記得的測試機」「三年前離職同事開的子網域」「沒人在用、但一直沒關的舊版後台」。</p>
<figure class="figure"><svg viewBox="0 0 660 266" class="fg" style="width:100%;max-width:660px" role="img" aria-label="資產盤點的四層：對外入口、雲端資源、主機與容器、軟體元件，各自的清單來源，以及每一筆都要有的負責人、環境、是否對外等欄位">
<rect x="20" y="30" width="250" height="44" rx="6" class="fg-b warm"/><text x="32" y="49" class="fg-t">對外入口</text><text x="32" y="66" class="fg-t sm">網域、公開 IP、API 端點</text>
<rect x="20" y="90" width="250" height="44" rx="6" class="fg-b"/><text x="32" y="109" class="fg-t">雲端資源</text><text x="32" y="126" class="fg-t sm">帳號、VPC、資料庫、儲存桶</text>
<rect x="20" y="150" width="250" height="44" rx="6" class="fg-b"/><text x="32" y="169" class="fg-t">主機與容器</text><text x="32" y="186" class="fg-t sm">VM、K8s 節點、執行中的映像檔</text>
<rect x="20" y="210" width="250" height="44" rx="6" class="fg-b alt"/><text x="32" y="229" class="fg-t">軟體元件</text><text x="32" y="246" class="fg-t sm">作業系統套件、函式庫與版本</text>
<rect x="300" y="30" width="220" height="44" rx="6" class="fg-b"/><text x="312" y="49" class="fg-t sm">DNS 區域、憑證透明度紀錄</text><text x="312" y="66" class="fg-t sm">外部掃描（從外面看自己）</text>
<rect x="300" y="90" width="220" height="44" rx="6" class="fg-b"/><text x="312" y="109" class="fg-t sm">雲端 API 列舉所有帳號</text><text x="312" y="126" class="fg-t sm">AWS Config 等設定紀錄</text>
<rect x="300" y="150" width="220" height="44" rx="6" class="fg-b"/><text x="312" y="169" class="fg-t sm">主機 agent、K8s API</text><text x="312" y="186" class="fg-t sm">映像檔倉庫</text>
<rect x="300" y="210" width="220" height="44" rx="6" class="fg-b"/><text x="312" y="229" class="fg-t sm">建置時產生 SBOM</text><text x="312" y="246" class="fg-t sm">CycloneDX 或 SPDX 格式</text>
<line x1="300" y1="52" x2="278" y2="52" class="fg-l"/><polygon points="270,52 278,47.5 278,56.5" class="fg-a"/>
<line x1="300" y1="112" x2="278" y2="112" class="fg-l"/><polygon points="270,112 278,107.5 278,116.5" class="fg-a"/>
<line x1="300" y1="172" x2="278" y2="172" class="fg-l"/><polygon points="270,172 278,167.5 278,176.5" class="fg-a"/>
<line x1="300" y1="232" x2="278" y2="232" class="fg-l"/><polygon points="270,232 278,227.5 278,236.5" class="fg-a"/>
<text x="160" y="20" text-anchor="middle" class="fg-t sm acc">要盤點的東西</text>
<text x="410" y="20" text-anchor="middle" class="fg-t sm acc">清單從哪裡自動產生</text>
<rect x="540" y="30" width="110" height="224" rx="6" class="fg-b hot"/>
<text x="595" y="56" text-anchor="middle" class="fg-t sm acc">每一筆都要有</text>
<text x="595" y="92" text-anchor="middle" class="fg-t">負責人</text>
<text x="595" y="124" text-anchor="middle" class="fg-t">環境</text>
<text x="595" y="156" text-anchor="middle" class="fg-t">是否對外</text>
<text x="595" y="188" text-anchor="middle" class="fg-t">資料敏感度</text>
<text x="595" y="220" text-anchor="middle" class="fg-t">支援到期日</text>
<line x1="520" y1="52" x2="540" y2="52" class="fg-l dim dash"/><line x1="520" y1="112" x2="540" y2="112" class="fg-l dim dash"/><line x1="520" y1="172" x2="540" y2="172" class="fg-l dim dash"/><line x1="520" y1="232" x2="540" y2="232" class="fg-l dim dash"/>
</svg><figcaption>清單一定要從系統自動產生，人工維護的表格三個月就過時。右邊那五個欄位，是後面排優先時每一步都會用到的。</figcaption></figure>
<p>右邊那一欄最常被省略，卻最重要。<b>沒有負責人的資產，就是沒人會修的資產</b>；不知道是不是對外開放，就沒辦法排優先。實務上的做法是：雲端資源一律要求打標籤（tag），例如 <code>owner</code>、<code>env</code>、<code>exposure</code>，沒有標籤的資源由政策擋下或每週列出來追。</p>
<h4>SBOM：軟體的成分表</h4>
<p><b>軟體物料清單</b>（software bill of materials，SBOM）像食品包裝上的成分表：這個映像檔裡有哪些套件、各是哪個版本。在建置時用 Syft 或 Trivy 產生，跟映像檔一起存。它的價值在新漏洞爆出來的那一天才看得到：2021 年 12 月 Log4Shell 公開時，有 SBOM 的團隊下一個查詢，幾分鐘就知道「哪些服務帶了 log4j-core 2.x、各跑在哪裡」；沒有的團隊，花了好幾天一台一台找。</p>
<p>對外入口也要從外面看。憑證透明度（certificate transparency）紀錄是公開的，任何人都能查到你的網域曾經簽過哪些憑證，也就是你有哪些子網域；攻擊者正是這樣找到你忘記的那台測試機。定期自己查一次，比攻擊者先看到。</p>

<h3><span class="badge lv1">基礎</span>二、一個漏洞的一生</h3>
<p>弱點管理在跟一個時鐘賽跑。看懂這條時間軸，就懂為什麼「已經有修補」反而是最危險的時候：</p>
<figure class="figure"><svg viewBox="0 48 660 167" class="fg" style="width:100%;max-width:660px" role="img" aria-label="漏洞的時間軸：發現、通報廠商、修補釋出與 CVE 公開、利用程式公開、大規模利用、你修好；修補前是零時差期間，修補後到你修好是 n-day 曝險窗口">
<path d="M50 80 V72 H256 V80" class="fg-l warm"/>
<text x="153" y="62" text-anchor="middle" class="fg-t sm warm">零時差：還沒有修補</text>
<path d="M264 80 V72 H600 V80" class="fg-l alt"/>
<text x="432" y="62" text-anchor="middle" class="fg-t sm alt">n-day：修補已有，你還沒裝</text>
<text x="310" y="106" text-anchor="middle" class="fg-t sm">比對修補做出利用</text>
<line x1="20" y1="120" x2="636" y2="120" class="fg-l"/><polygon points="644,120 636,115.5 636,124.5" class="fg-a"/>
<circle cx="50" cy="120" r="6" class="fg-lamp on"/><circle cx="130" cy="120" r="6" class="fg-lamp on"/><circle cx="260" cy="120" r="6" class="fg-lamp on"/><circle cx="360" cy="120" r="6" class="fg-lamp on"/><circle cx="450" cy="120" r="6" class="fg-lamp on"/><circle cx="600" cy="120" r="6" class="fg-lamp on"/>
<text x="50" y="146" text-anchor="middle" class="fg-t sm">發現</text>
<text x="130" y="146" text-anchor="middle" class="fg-t sm">通報廠商</text>
<text x="260" y="146" text-anchor="middle" class="fg-t sm acc">修補釋出</text><text x="260" y="164" text-anchor="middle" class="fg-t sm acc">CVE 公開</text>
<text x="360" y="146" text-anchor="middle" class="fg-t sm">利用程式</text><text x="360" y="164" text-anchor="middle" class="fg-t sm">公開</text>
<text x="450" y="146" text-anchor="middle" class="fg-t sm warm">大規模</text><text x="450" y="164" text-anchor="middle" class="fg-t sm warm">掃描利用</text>
<text x="600" y="146" text-anchor="middle" class="fg-t sm">你修好</text><text x="600" y="164" text-anchor="middle" class="fg-t sm">（第幾天？）</text>
<text x="330" y="202" text-anchor="middle" class="fg-t sm">時間軸不照比例。熱門漏洞從公開到大規模利用，有時只要幾天，甚至幾小時。</text>
</svg><figcaption>修補一公開，攻擊者就能比對新舊版本的差異，找出被修掉的那個洞，寫出利用程式。從這一刻起，每一台還沒更新的機器都在倒數。</figcaption></figure>
<ul>
<li><b>協調揭露</b>（coordinated disclosure）：研究者先私下通報廠商，給一段時間修好再公開。業界常見的期限是 90 天，例如 Google Project Zero 的政策。</li>
<li><b>零時差</b>的期間，你能做的只有縱深防禦和偵測，因為根本沒有修補可以裝。</li>
<li><b>n-day</b> 的期間長短，完全由你決定。真實世界的大部分攻擊都發生在這裡，所以弱點管理真正在縮短的，是右邊那一段。</li>
</ul>

<h3><span class="badge lv2">進階</span>三、掃描器有六種，每一種都有盲點</h3>
<p>上一課列了各層的工具。這裡換個角度：每一種掃描器<b>看得到什麼、看不到什麼</b>。把它們疊起來，你才知道哪裡還是空的。</p>
<figure class="figure"><svg viewBox="0 26 660 278" class="fg" style="width:100%;max-width:660px" role="img" aria-label="六種掃描器對六種目標的涵蓋矩陣：SCA 看相依套件，容器映像看相依與系統套件，主機掃描看系統套件與執行中服務，雲端設定掃描只看雲端設定，DAST 看執行中服務，SAST 看自己的程式碼，商業邏輯幾乎沒有工具看得到">
<text x="190" y="44" text-anchor="middle" class="fg-t sm">自己的程式</text>
<text x="268" y="44" text-anchor="middle" class="fg-t sm">相依套件</text>
<text x="346" y="44" text-anchor="middle" class="fg-t sm">系統套件</text>
<text x="424" y="44" text-anchor="middle" class="fg-t sm">執行中服務</text>
<text x="502" y="44" text-anchor="middle" class="fg-t sm">雲端設定</text>
<text x="580" y="44" text-anchor="middle" class="fg-t sm warm">商業邏輯</text>
<line x1="20" y1="58" x2="630" y2="58" class="fg-l dim"/>
<text x="20" y="80" class="fg-t">SCA 相依掃描</text>
<text x="20" y="116" class="fg-t">容器映像</text>
<text x="20" y="152" class="fg-t">主機掃描</text>
<text x="20" y="188" class="fg-t">雲端設定</text>
<text x="20" y="224" class="fg-t">DAST 動態</text>
<text x="20" y="260" class="fg-t">SAST 靜態</text>
<line x1="20" y1="94" x2="630" y2="94" class="fg-l dim"/><line x1="20" y1="130" x2="630" y2="130" class="fg-l dim"/><line x1="20" y1="166" x2="630" y2="166" class="fg-l dim"/><line x1="20" y1="202" x2="630" y2="202" class="fg-l dim"/><line x1="20" y1="238" x2="630" y2="238" class="fg-l dim"/><line x1="20" y1="274" x2="630" y2="274" class="fg-l dim"/>
<circle cx="268" cy="76" r="7" class="fg-lamp on"/>
<circle cx="268" cy="112" r="7" class="fg-lamp on"/><circle cx="346" cy="112" r="7" class="fg-lamp on"/>
<circle cx="268" cy="148" r="6" class="fg-b"/><circle cx="346" cy="148" r="7" class="fg-lamp on"/><circle cx="424" cy="148" r="7" class="fg-lamp on"/>
<circle cx="502" cy="184" r="7" class="fg-lamp on"/>
<circle cx="190" cy="220" r="6" class="fg-b"/><circle cx="424" cy="220" r="7" class="fg-lamp on"/><circle cx="580" cy="220" r="6" class="fg-b"/>
<circle cx="190" cy="256" r="7" class="fg-lamp on"/>
<circle cx="200" cy="292" r="7" class="fg-lamp on"/><text x="212" y="296" class="fg-t sm">看得到</text>
<circle cx="290" cy="292" r="6" class="fg-b"/><text x="302" y="296" class="fg-t sm">看得到一部分</text>
</svg><figcaption>沒有一種掃描器能涵蓋全部，最右邊那一欄幾乎是空的：權限沒檢查好、可以改別人的資料這類商業邏輯漏洞，只能靠程式碼審查和滲透測試。</figcaption></figure>
<table>
<tr><th>掃描器</th><th>怎麼運作</th><th>看不到什麼</th></tr>
<tr><td><b>SCA</b>（software composition analysis）</td><td>讀 <code>package-lock.json</code>、<code>go.sum</code> 這類鎖定檔，比對已知漏洞資料庫</td><td>直接複製進專案的程式碼；你的程式到底有沒有呼叫到有漏洞的那個函式</td></tr>
<tr><td><b>容器映像掃描</b></td><td>讀映像檔裡的套件資料庫和語言套件清單</td><td>沒有套件資訊、手動複製進去的執行檔；容器跑起來之後才下載的東西；主機的核心</td></tr>
<tr><td><b>主機掃描</b></td><td>從網路探測服務版本，或登入後讀已安裝套件</td><td>掃描之間開了又關的短命機器；只看版本字串時，會把「發行版已經修好」的誤判成有漏洞（下面說明）</td></tr>
<tr><td><b>雲端設定掃描</b>（CSPM）</td><td>呼叫雲端 API，檢查設定是否違反規則</td><td>機器和容器裡面的任何東西；沒接進來的帳號</td></tr>
<tr><td><b>DAST</b></td><td>像攻擊者一樣對執行中的網站送請求</td><td>爬不到的頁面（登入後、單頁應用的路由）；找到問題也指不出是哪一行程式</td></tr>
<tr><td><b>SAST</b></td><td>讀原始碼，追蹤不可信的輸入流到危險的地方</td><td>執行環境的設定、相依套件；誤報偏多</td></tr>
</table>
<h4>發行版的「回溯修補」陷阱</h4>
<p>Ubuntu、Debian、Red Hat 這些發行版，通常不會為了修一個漏洞就把 OpenSSH 從 8.2 升到 9.x，而是把修補「回溯」（backport）到原本的版本上，套件版本號只改後面的小尾巴。從網路上看，服務的版本字串仍然寫著舊的上游版本。只看版本字串的掃描器就會報一堆「有漏洞」，其實早就修好了。解法是用<b>登入式掃描</b>（authenticated scan），直接比對套件版本和發行版自己的安全公告。反過來，也別因為這種誤報太多，就對掃描報告整份失去信任。</p>

<h3><span class="badge lv2">進階</span>四、CVE、CVSS、EPSS、KEV 一次弄懂</h3>
<h4>CVE：漏洞的身分證字號</h4>
<p>CVE 計畫由 MITRE 營運，美國政府出資。編號由各個 CNA（CVE Numbering Authority，例如各大軟體廠商、GitHub、各國 CERT）核發，格式是 <code>CVE-年份-流水號</code>，流水號至少四位數、可以更多。全部 CVE 已經超過二十萬筆，近年每年新增好幾萬筆。美國 NIST 的國家漏洞資料庫（NVD）會替 CVE 補上分數和受影響的產品清單，但 2024 年起處理速度嚴重落後，大量新 CVE 好幾個月沒有分數。所以成熟的工具也會參考其他來源：GitHub 安全公告（GHSA）、Google 的 OSV、各發行版自己的安全公告。</p>
<h4>CVSS：理論上有多糟</h4>
<p>CVSS 把一個漏洞拆成幾個問題，每個答案對應一個權重，再用公式算成 0 到 10 分。用最常見的 3.1 版，拆一個 9.8 分的漏洞：</p>
<figure class="figure"><svg viewBox="0 0 680 270" class="fg" style="width:100%;max-width:680px" role="img" aria-label="CVSS 3.1 向量 AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H 拆成八個指標，前四個算出可利用性 3.89，後三個算出衝擊 5.87，相加無條件進位得到 9.8">
<text x="340" y="26" text-anchor="middle" class="fg-t mono">CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H</text>
<rect x="16" y="44" width="74" height="66" rx="5" class="fg-b alt"/><text x="53" y="64" text-anchor="middle" class="fg-t mono">AV:N</text><text x="53" y="82" text-anchor="middle" class="fg-t sm">從網路</text><text x="53" y="100" text-anchor="middle" class="fg-t sm alt">0.85</text>
<rect x="98" y="44" width="74" height="66" rx="5" class="fg-b alt"/><text x="135" y="64" text-anchor="middle" class="fg-t mono">AC:L</text><text x="135" y="82" text-anchor="middle" class="fg-t sm">條件簡單</text><text x="135" y="100" text-anchor="middle" class="fg-t sm alt">0.77</text>
<rect x="180" y="44" width="74" height="66" rx="5" class="fg-b alt"/><text x="217" y="64" text-anchor="middle" class="fg-t mono">PR:N</text><text x="217" y="82" text-anchor="middle" class="fg-t sm">不需權限</text><text x="217" y="100" text-anchor="middle" class="fg-t sm alt">0.85</text>
<rect x="262" y="44" width="74" height="66" rx="5" class="fg-b alt"/><text x="299" y="64" text-anchor="middle" class="fg-t mono">UI:N</text><text x="299" y="82" text-anchor="middle" class="fg-t sm">不用點擊</text><text x="299" y="100" text-anchor="middle" class="fg-t sm alt">0.85</text>
<rect x="344" y="44" width="74" height="66" rx="5" class="fg-b"/><text x="381" y="64" text-anchor="middle" class="fg-t mono">S:U</text><text x="381" y="82" text-anchor="middle" class="fg-t sm">範圍不變</text><text x="381" y="100" text-anchor="middle" class="fg-t sm">選公式</text>
<rect x="426" y="44" width="74" height="66" rx="5" class="fg-b warm"/><text x="463" y="64" text-anchor="middle" class="fg-t mono">C:H</text><text x="463" y="82" text-anchor="middle" class="fg-t sm">機密性</text><text x="463" y="100" text-anchor="middle" class="fg-t sm warm">0.56</text>
<rect x="508" y="44" width="74" height="66" rx="5" class="fg-b warm"/><text x="545" y="64" text-anchor="middle" class="fg-t mono">I:H</text><text x="545" y="82" text-anchor="middle" class="fg-t sm">完整性</text><text x="545" y="100" text-anchor="middle" class="fg-t sm warm">0.56</text>
<rect x="590" y="44" width="74" height="66" rx="5" class="fg-b warm"/><text x="627" y="64" text-anchor="middle" class="fg-t mono">A:H</text><text x="627" y="82" text-anchor="middle" class="fg-t sm">可用性</text><text x="627" y="100" text-anchor="middle" class="fg-t sm warm">0.56</text>
<path d="M16 120 V128 H336 V120" class="fg-l alt"/>
<text x="176" y="148" text-anchor="middle" class="fg-t sm alt">可利用性 = 8.22 × 0.85 × 0.77 × 0.85 × 0.85</text>
<text x="176" y="166" text-anchor="middle" class="fg-t alt">≈ 3.89</text>
<path d="M426 120 V128 H664 V120" class="fg-l warm"/>
<text x="545" y="148" text-anchor="middle" class="fg-t sm warm">衝擊 = 6.42 × (1 − 0.44 × 0.44 × 0.44)</text>
<text x="545" y="166" text-anchor="middle" class="fg-t warm">≈ 5.87</text>
<text x="340" y="212" text-anchor="middle" class="fg-t lg acc">基本分數 = 無條件進位到小數一位（3.89 + 5.87）= 9.8</text>
<text x="340" y="248" text-anchor="middle" class="fg-t sm">同一個漏洞若必須在那台機器本機上觸發（AV:L，權重 0.55）：可利用性 ≈ 2.52，總分 8.4</text>
</svg><figcaption>前四個指標問「好不好打」，後三個問「打中了損失多大」。範圍（S）決定用哪一組公式：S:C 代表打穿之後能影響到別的元件，衝擊改用另一條公式，總分還要再乘上 1.08。</figcaption></figure>
<p>分數區間：0.1 到 3.9 是 Low，4.0 到 6.9 是 Medium，7.0 到 8.9 是 High，9.0 以上是 Critical。Log4Shell 的向量是 <code>AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H</code>，因為範圍改變，滿分 10.0。</p>
<p>2023 年底發布的 <b>CVSS 4.0</b> 做了幾個改動：拿掉了常被誤用的「範圍」，改成分開評估「有漏洞的系統」和「後續受影響的系統」；新增「攻擊前提」（AT）；使用者互動分成被動和主動；並且明確用 CVSS-B、CVSS-BT、CVSS-BE 這樣的名稱，標示一個分數有沒有考慮威脅情資和你自己的環境。</p>
<p>最重要的一句話：CVSS 的主管單位 FIRST 自己就說，<b>基本分數衡量的是嚴重度，不是風險</b>。它不知道你的系統有沒有對外、有沒有人正在利用。</p>
<h4>EPSS：接下來 30 天被利用的機率</h4>
<p>EPSS（Exploit Prediction Scoring System）同樣由 FIRST 維護，每天替每一個 CVE 算一個 0 到 1 的機率：未來 30 天內，在真實世界觀察到有人嘗試利用它的可能性。它用的是大量實際攻擊觀測資料和漏洞特徵訓練出來的模型。大部分 CVE 的 EPSS 都非常低，只有一小部分很高，這正是它有用的地方：它幫你從一萬筆裡挑出那幾百筆。要注意它是「全世界」的機率，不知道你是不是目標，也不知道你有沒有對外開放。</p>
<h4>KEV：已經確定被利用的清單</h4>
<p>KEV 是美國 CISA 在 2021 年 11 月開始維護的清單，收錄條件有三個：有 CVE 編號、有可靠證據顯示在真實攻擊中被利用、有明確的修補或緩解方法。美國聯邦機關依規定必須在期限內修好清單上的漏洞。它只有一千多筆，不到全部 CVE 的百分之一，所以是最有力的排序訊號：<b>EPSS 是「可能會」，KEV 是「已經在發生」</b>。KEV 還有一個欄位標示「是否已知被勒索軟體集團使用」。</p>

<h3><span class="badge lv2">進階</span>五、排一次優先：從 1,200 筆到今天要修的 4 筆</h3>
<p>一個中型團隊，第一次把所有掃描器接起來，報告通常長這樣（數字是示範）：</p>
<figure class="figure"><svg viewBox="0 0 640 250" class="fg" style="width:100%;max-width:640px" role="img" aria-label="排序漏斗：1200 筆掃描結果，去重後 380 筆，攻擊者碰得到的 95 筆，有人在利用的 14 筆，今天要修的 4 筆">
<rect x="40" y="20" width="560" height="36" rx="6" class="fg-b"/><text x="320" y="43" text-anchor="middle" class="fg-t">1,200 筆：所有掃描器的原始結果</text>
<rect x="100" y="66" width="440" height="36" rx="6" class="fg-b"/><text x="320" y="89" text-anchor="middle" class="fg-t">380 筆：去重後（同一個套件只算一筆）</text>
<rect x="160" y="112" width="320" height="36" rx="6" class="fg-b alt"/><text x="320" y="135" text-anchor="middle" class="fg-t">95 筆：攻擊者碰得到</text>
<rect x="220" y="158" width="200" height="36" rx="6" class="fg-b warm"/><text x="320" y="181" text-anchor="middle" class="fg-t">14 筆：有人在利用</text>
<rect x="265" y="204" width="110" height="36" rx="6" class="fg-b hot"/><text x="320" y="227" text-anchor="middle" class="fg-t acc">4 筆：今天修</text>
</svg><figcaption>每往下一層，問一個問題：是不是同一件事？碰不碰得到？有沒有人在打？最後剩下的，才是要叫人加班的。其他的照期限排進一般的工作。</figcaption></figure>
<p>挑其中五筆，看判斷怎麼做：</p>
<table>
<tr><th>弱點</th><th>CVSS</th><th>EPSS</th><th>KEV</th><th>在哪裡</th><th>判斷</th></tr>
<tr><td>A</td><td>9.8</td><td>0.4%</td><td>否</td><td>某個函式庫的 XML 解析功能，程式從來沒用到</td><td>正常更新，並寫下「不受影響」的理由</td></tr>
<tr><td>B</td><td>7.5</td><td>94%</td><td><b>是</b></td><td>對外的 VPN 閘道</td><td><b>今天修</b>；修好前先限制來源 IP</td></tr>
<tr><td>C</td><td>9.1</td><td>3%</td><td>否</td><td>對外的 API 伺服器，有漏洞的路徑確實會被呼叫</td><td>7 天內</td></tr>
<tr><td>D</td><td>8.8</td><td>12%</td><td>否</td><td>內部管理後台，只能從 VPN 連</td><td>60 天內；EPSS 偏高，可以提前</td></tr>
<tr><td>E</td><td>6.1</td><td>1%</td><td>否</td><td>公開網站的一個反射型 XSS</td><td>90 天內，先加 CSP</td></tr>
</table>
<p>如果只照 CVSS 排，順序會是 A、C、D、B、E：最危險的 B 排到第四，而 A 根本碰不到。照「KEV → 是否對外且碰得到 → EPSS → CVSS」的思路，B 變成第一、C 第二，A 從第一掉到最後，D 和 E 照下一節的期限排進一般工作。這就是上一課那句話的完整版：<b>碰得到、又有人在打，比理論分數高更重要</b>。</p>
<p>如果想要一套更有系統的決策方法，可以看 CISA 推廣的 <b>SSVC</b>（Stakeholder-Specific Vulnerability Categorization）：用一棵決策樹問「有沒有人在利用（沒有／有概念驗證／正在利用）」「能不能自動化大量利用」「技術衝擊是部分還是全部」「對任務和人的影響」，最後得出四種處置：追蹤、密切追蹤、處理、立即行動。它的好處是每個決定都說得出理由，不是一個神祕的分數。</p>

<h3><span class="badge lv3">專業</span>六、修補期限：依嚴重度，也依曝露程度</h3>
<p>排好優先之後，要給每一類一個期限，叫做服務等級（SLA）。只依嚴重度訂期限是不夠的，同一個漏洞在對外和內部的機器上，期限應該不同。一個常見的起點（各組織會依自己的風險胃納調整）：</p>
<table>
<tr><th>狀況</th><th>期限</th></tr>
<tr><td>在 KEV 上，或確認正被利用，而且對外</td><td>48 小時，做不到就先緩解</td></tr>
<tr><td>Critical，對外</td><td>7 天</td></tr>
<tr><td>Critical 內部；High 對外</td><td>30 天</td></tr>
<tr><td>High 內部</td><td>60 天</td></tr>
<tr><td>Medium</td><td>90 天</td></tr>
<tr><td>Low</td><td>跟著例行更新</td></tr>
</table>
<p>外部規範可以拿來對照：PCI DSS 4.0 要求重大漏洞的修補在釋出後一個月內裝好；美國聯邦機關對 KEV 上的漏洞有各自的截止日。期限從哪一刻開始算，也要寫清楚：通常是「你的掃描器第一次在你的環境裡發現它」，KEV 類的則從它被加進清單那天算。</p>

<h3><span class="badge lv3">專業</span>七、修不了的時候：例外與風險接受</h3>
<p>總有修不了的時候：廠商還沒出修補、升級會弄壞一個關鍵功能、那台設備的韌體只有原廠能更新。這時要走<b>例外流程</b>，讓「這次不修」變成一個看得見、有人負責、會到期的決定。</p>
<figure class="figure"><svg viewBox="0 26 660 236" class="fg" style="width:100%;max-width:660px" role="img" aria-label="弱點的狀態流程：新發現、排優先、修補、重新掃描、關閉；修不了時申請例外、補償措施與簽核、到期重審後回去修；不受影響的附 VEX 說明後關閉">
<rect x="10" y="40" width="110" height="44" rx="6" class="fg-b"/><text x="65" y="59" text-anchor="middle" class="fg-t">新發現</text><text x="65" y="76" text-anchor="middle" class="fg-t sm">掃描或通報</text>
<line x1="120" y1="62" x2="134" y2="62" class="fg-l"/><polygon points="142,62 134,57.5 134,66.5" class="fg-a"/>
<rect x="142" y="40" width="110" height="44" rx="6" class="fg-b"/><text x="197" y="59" text-anchor="middle" class="fg-t">排優先</text><text x="197" y="76" text-anchor="middle" class="fg-t sm">SLA 開始計時</text>
<line x1="252" y1="62" x2="266" y2="62" class="fg-l"/><polygon points="274,62 266,57.5 266,66.5" class="fg-a"/>
<rect x="274" y="40" width="110" height="44" rx="6" class="fg-b"/><text x="329" y="59" text-anchor="middle" class="fg-t">修補</text><text x="329" y="76" text-anchor="middle" class="fg-t sm">或緩解</text>
<line x1="384" y1="62" x2="398" y2="62" class="fg-l"/><polygon points="406,62 398,57.5 398,66.5" class="fg-a"/>
<rect x="406" y="40" width="110" height="44" rx="6" class="fg-b"/><text x="461" y="59" text-anchor="middle" class="fg-t">重新掃描</text><text x="461" y="76" text-anchor="middle" class="fg-t sm">確認真的修好</text>
<line x1="516" y1="62" x2="530" y2="62" class="fg-l on"/><polygon points="538,62 530,57.5 530,66.5" class="fg-a on"/>
<rect x="538" y="40" width="110" height="44" rx="6" class="fg-b hot"/><text x="593" y="67" text-anchor="middle" class="fg-t acc">關閉</text>
<line x1="197" y1="84" x2="197" y2="142" class="fg-l warm"/><polygon points="197,150 192.5,142 201.5,142" class="fg-a warm"/>
<line x1="65" y1="84" x2="65" y2="142" class="fg-l alt"/><polygon points="65,150 60.5,142 69.5,142" class="fg-a alt"/>
<rect x="10" y="150" width="110" height="44" rx="6" class="fg-b alt"/><text x="65" y="169" text-anchor="middle" class="fg-t">不受影響</text><text x="65" y="186" text-anchor="middle" class="fg-t sm">附 VEX 說明</text>
<rect x="142" y="150" width="110" height="44" rx="6" class="fg-b warm"/><text x="197" y="169" text-anchor="middle" class="fg-t">申請例外</text><text x="197" y="186" text-anchor="middle" class="fg-t sm">修不了的時候</text>
<line x1="252" y1="172" x2="266" y2="172" class="fg-l warm"/><polygon points="274,172 266,167.5 266,176.5" class="fg-a warm"/>
<rect x="274" y="150" width="110" height="44" rx="6" class="fg-b"/><text x="329" y="169" text-anchor="middle" class="fg-t">補償措施</text><text x="329" y="186" text-anchor="middle" class="fg-t sm">負責人簽核</text>
<line x1="384" y1="172" x2="398" y2="172" class="fg-l warm"/><polygon points="406,172 398,167.5 398,176.5" class="fg-a warm"/>
<rect x="406" y="150" width="110" height="44" rx="6" class="fg-b"/><text x="461" y="169" text-anchor="middle" class="fg-t">到期重審</text><text x="461" y="186" text-anchor="middle" class="fg-t sm">最長 90 天</text>
<path d="M461 150 V118 H329 V92" class="fg-l warm dash"/><polygon points="329,84 324.5,92 333.5,92" class="fg-a warm"/>
<text x="400" y="112" text-anchor="middle" class="fg-t sm warm">到期：回去修</text>
<path d="M65 194 V230 H593 V92" class="fg-l alt dash"/><polygon points="593,84 588.5,92 597.5,92" class="fg-a alt"/>
<text x="330" y="250" text-anchor="middle" class="fg-t sm alt">確認不受影響：附理由直接關閉</text>
</svg><figcaption>每一條路最後都會走到「關閉」，只是理由不同：修好了、證明不受影響，或例外到期後終於修好。沒有任何一條路是「放著不管」。</figcaption></figure>
<p>一份例外紀錄至少要有：</p>
<ul>
<li><b>是哪個弱點、在哪些資產上</b>，以及為什麼現在修不了。</li>
<li><b>補償措施</b>（compensating control）：用 WAF 規則擋住有漏洞的路徑（俗稱「虛擬修補」）、關掉那個功能、限制只有特定 IP 連得到、加強那一處的偵測。</li>
<li><b>風險負責人簽核</b>：簽的人要是承擔業務後果的主管，而不是寫程式的工程師。嚴重度越高，簽核層級越高，例如 Critical 要資安主管或技術長簽。</li>
<li><b>到期日</b>：通常最長 90 天。到期自動重新開啟，要嘛修好，要嘛重新申請、重新簽。</li>
</ul>
<p>另一條路是「確認不受影響」，例如弱點 A：有漏洞的函式根本沒被呼叫。這種判斷要寫成機器讀得懂的格式，叫 <b>VEX</b>（Vulnerability Exploitability eXchange）。狀態有四種：不受影響、受影響、已修補、調查中；「不受影響」必須附上理由，例如「有漏洞的程式碼不在執行路徑上」。寫好之後，掃描工具讀到 VEX，就不會每天再把 A 報一次。</p>

<h3><span class="badge lv3">專業</span>八、修補管線：從自動 PR 到「真的不再有漏洞」</h3>
<p>修補最大的敵人是「怕弄壞」。所以好的修補流程，重點不是更快地裝，而是讓裝了之後出問題的代價很小：</p>
<figure class="figure"><svg viewBox="0 0 670 222" class="fg" style="width:100%;max-width:670px" role="img" aria-label="修補管線：自動開 PR、CI 測試、合併、重建映像、分批上線、驗證；沒改程式碼也每晚重建；出問題就退版；最後要確認行程已經重啟">
<text x="388" y="20" text-anchor="middle" class="fg-t sm">沒改程式碼，也每晚重建</text>
<line x1="388" y1="26" x2="388" y2="42" class="fg-l dash"/><polygon points="388,50 383.5,42 392.5,42" class="fg-a"/>
<rect x="10" y="50" width="96" height="56" rx="6" class="fg-b alt"/><text x="58" y="73" text-anchor="middle" class="fg-t">自動開 PR</text><text x="58" y="93" text-anchor="middle" class="fg-t sm">Renovate 等</text>
<line x1="106" y1="78" x2="112" y2="78" class="fg-l"/><polygon points="120,78 112,73.5 112,82.5" class="fg-a"/>
<rect x="120" y="50" width="96" height="56" rx="6" class="fg-b"/><text x="168" y="73" text-anchor="middle" class="fg-t">CI 測試</text><text x="168" y="93" text-anchor="middle" class="fg-t sm">測試要夠多</text>
<line x1="216" y1="78" x2="222" y2="78" class="fg-l"/><polygon points="230,78 222,73.5 222,82.5" class="fg-a"/>
<rect x="230" y="50" width="96" height="56" rx="6" class="fg-b"/><text x="278" y="73" text-anchor="middle" class="fg-t">合併</text><text x="278" y="93" text-anchor="middle" class="fg-t sm">小版號自動</text>
<line x1="326" y1="78" x2="332" y2="78" class="fg-l"/><polygon points="340,78 332,73.5 332,82.5" class="fg-a"/>
<rect x="340" y="50" width="96" height="56" rx="6" class="fg-b"/><text x="388" y="73" text-anchor="middle" class="fg-t">重建映像</text><text x="388" y="93" text-anchor="middle" class="fg-t sm">基底一起更新</text>
<line x1="436" y1="78" x2="442" y2="78" class="fg-l"/><polygon points="450,78 442,73.5 442,82.5" class="fg-a"/>
<rect x="450" y="50" width="96" height="56" rx="6" class="fg-b"/><text x="498" y="73" text-anchor="middle" class="fg-t">分批上線</text><text x="498" y="93" text-anchor="middle" class="fg-t sm">10% → 全部</text>
<line x1="546" y1="78" x2="552" y2="78" class="fg-l on"/><polygon points="560,78 552,73.5 552,82.5" class="fg-a on"/>
<rect x="560" y="50" width="96" height="56" rx="6" class="fg-b hot"/><text x="608" y="73" text-anchor="middle" class="fg-t acc">驗證</text><text x="608" y="93" text-anchor="middle" class="fg-t sm">掃執行中的</text>
<path d="M480 106 V124 H165 V142" class="fg-l warm"/><polygon points="165,150 160.5,142 169.5,142" class="fg-a warm"/>
<rect x="10" y="150" width="310" height="56" rx="6" class="fg-b warm"/><text x="165" y="173" text-anchor="middle" class="fg-t">出問題就退版</text><text x="165" y="193" text-anchor="middle" class="fg-t sm">退版便宜，大家才敢快修</text>
<line x1="608" y1="106" x2="608" y2="142" class="fg-l on"/><polygon points="608,150 603.5,142 612.5,142" class="fg-a on"/>
<rect x="346" y="150" width="310" height="56" rx="6" class="fg-b"/><text x="501" y="173" text-anchor="middle" class="fg-t">檔案換了，不等於行程換了</text><text x="501" y="193" text-anchor="middle" class="fg-t sm">函式庫要重啟服務，核心要重開機</text>
</svg><figcaption>最右邊那一步最常被跳過：git 裡的版本對了，不代表正在跑的版本對了。驗證要針對「現在正在執行的東西」。</figcaption></figure>
<ul>
<li><b>相依套件</b>：Renovate 或 Dependabot 自動開 PR。修訂版號（patch）的更新，測試過了就自動合併；大版號的更新再由人看。這一切的前提是測試夠多，不然自動合併就是自動上線 bug。</li>
<li><b>基底映像檔</b>：你的程式碼沒改，基底映像檔裡的系統套件也會有新漏洞。所以要<b>定期重建</b>（例如每晚），而不是只在改程式時才建。</li>
<li><b>長期存在的 VM</b>：Ubuntu 可以開 <code>unattended-upgrades</code> 自動裝安全更新。但更好的方向是把機器當成可以替換的：更新映像檔、滾動替換，而不是在舊機器上一直補。</li>
<li><b>Kubernetes 節點和託管服務</b>：節點映像檔要定期升級；託管資料庫的小版本更新由雲端業者做，但你要排好維護時段，不要一直往後延。</li>
</ul>
<h4>驗證：git 對了，不代表執行中的對了</h4>
<p>一個很經典的坑：你在主機上 <code>apt upgrade</code> 升級了 OpenSSL，掃描器也說新版本裝好了。可是 nginx 是昨天啟動的，它的記憶體裡載入的還是舊版的函式庫，直到重啟為止都還是有漏洞。Ubuntu 上的 <code>needrestart</code> 會列出哪些服務還在用舊的函式庫；核心更新則要重開機（或使用 livepatch 服務）。容器的版本也一樣：要比對的是叢集裡實際在跑的映像檔摘要（digest），而不是 git 裡寫的標籤。</p>

<h3><span class="badge lv4">專家</span>九、衡量弱點管理計畫</h3>
<p>弱點管理最容易被誤用的數字，是「目前有幾個未修的漏洞」。你把掃描涵蓋率從 60% 提高到 95%，這個數字一定會暴增；如果這時候被罵，大家學到的是「少掃一點」。真正該看的是這幾個：</p>
<table>
<tr><th>指標</th><th>回答的問題</th></tr>
<tr><td><b>涵蓋率</b></td><td>已知資產裡，有多少比例被掃描、有負責人？這是其他所有數字的分母。</td></tr>
<tr><td><b>修補時間</b>（中位數與 90 百分位）</td><td>依嚴重度分開算。90 百分位告訴你「最慢的那一群」拖多久。</td></tr>
<tr><td><b>SLA 達成率</b></td><td>在期限內修好的比例。</td></tr>
<tr><td><b>漏洞年齡分布</b></td><td>還開著的漏洞，各開了多久？超過 180 天的那一堆，常常是沒有負責人的資產。</td></tr>
<tr><td><b>例外數量與到期</b></td><td>例外是不是一直在續？同一個例外續三次，就是該升級處理的訊號。</td></tr>
<tr><td><b>復發率</b></td><td>修好的漏洞又出現了嗎？通常代表基底映像檔或範本沒有一起修。</td></tr>
</table>
<p>算一次 SLA 達成率：上一季在對外系統上發現 200 個 High，期限 30 天。7 天內修好 80 個、30 天內累計 150 個、60 天內累計 180 個，還有 20 個超過 60 天。SLA 達成率是 150 ÷ 200 = 75%。再看那 50 個逾期的：如果有 30 個集中在同一個團隊、同一個舊系統，你要解決的就不是「工程師不夠努力」，而是那個舊系統本身。</p>
<h4>幾個多數人沒想過的角落</h4>
<ul>
<li><b>沒有 CVE，不代表沒有漏洞。</b>已經終止支援的軟體，廠商不再修，常常也沒人再替它申請 CVE。掃描器回報「乾淨」，其實是「沒人在看」。資產清單裡的支援到期日欄位，就是為了這個。</li>
<li><b>整個體系也有單點故障。</b>2024 年 NVD 的處理積壓，讓很多只依賴 NVD 分數的工具一度失準；2025 年 4 月，MITRE 營運 CVE 計畫的合約差點到期中斷，最後一刻才被延長。依賴多個資料來源（GHSA、OSV、發行版公告），你的流程才不會因為某一個來源停擺而停擺。</li>
<li><b>不是每個 CVE 都值得緊張。</b>開發用工具裡的正規表示式阻斷服務（ReDoS），在正式環境根本不存在；有些 CVE 甚至被原專案作者公開質疑。這正是 VEX 和可達性分析存在的理由。</li>
<li><b>惡意套件不是 CVE。</b>有人故意上傳到 npm 的惡意套件，通常不會走 CVE 的流程，SCA 不一定抓得到。這是第 5.7 課供應鏈安全的範圍，兩者要一起做。</li>
</ul>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>CVSS 越高越要先修</td><td>CVSS 是嚴重度，不是風險。要先看有沒有人在利用（KEV、EPSS）、攻擊者碰不碰得到。</td></tr>
<tr><td>掃描器說沒問題就是安全</td><td>每一種掃描器都有盲點，尤其是商業邏輯漏洞和終止支援的軟體。</td></tr>
<tr><td>裝了更新就修好了</td><td>行程沒重啟、核心沒重開機、叢集裡跑的還是舊映像檔，漏洞都還在。要掃執行中的東西。</td></tr>
<tr><td>修不了就先放著</td><td>放著要走例外流程：補償措施、負責人簽核、到期日。悄悄放著是唯一不允許的選項。</td></tr>
<tr><td>未修漏洞數越少越好</td><td>涵蓋率一提高，這個數字就會上升。要看涵蓋率、修補時間和 SLA 達成率。</td></tr>
<tr><td>程式碼沒改，就不用重建映像檔</td><td>基底映像檔裡的套件每天都可能出新漏洞，要定期重建。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>前端（Vue、TypeScript）</b>：<code>npm audit</code> 報出的大量漏洞，很多在開發用工具裡，不會進到瀏覽器。學會用 <code>npm ls 套件名</code> 看它是被誰帶進來的、在不在正式的打包結果裡，再決定要不要緊張。</li>
<li><b>後端（Node.js、Go）</b>：Go 有官方的 <code>govulncheck</code>，它會分析你的程式有沒有真的呼叫到有漏洞的函式，正是本章說的「可達性」。鎖定檔要提交進 git，SCA 才看得準。</li>
<li><b>遊戲（Cocos、Unity）</b>：遊戲客戶端裡打包的第三方 SDK（廣告、分析、支付）也是相依套件，一樣會有漏洞，而且已經發到玩家手上的版本你修不了，只能出新版、逼舊版更新。伺服器端要有能力拒絕太舊的客戶端版本。</li>
<li><b>Docker 與雲端伺服器</b>：選小的基底映像檔（例如 distroless 或 alpine），套件越少，要修的漏洞就越少。在 CI 裡用 Trivy 掃映像檔，設定只有 Critical 和 High 才擋下合併，不然大家很快就會學會忽略它。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<p>資安工程、雲端資安、DevSecOps 的面試很常出現下面這些題目。先自己講一遍，再打開參考答案。</p>
<ol>
<li>「掃描器報出 1,000 個漏洞，你怎麼決定先修哪些？」</li>
<li>「CVSS、EPSS、KEV 各是什麼？各自的限制是什麼？」</li>
<li>「一個 Critical 漏洞，廠商說要兩個月才會出修補，你怎麼辦？」</li>
<li>「你怎麼確認一個漏洞真的修好了？」</li>
<li>「如果要你建立一個公司的弱點管理計畫，你會從哪裡開始？」</li>
<li>「你會用哪些指標衡量弱點管理做得好不好？為什麼不用『未修漏洞數』？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>先去重：同一個套件、同一個 CVE 在多台機器上只算一筆，並且合併不同掃描器的結果。接著依序篩選：是否在 KEV 上或確認被利用；資產是否對外、有漏洞的程式碼是否可達；EPSS 高低；最後才看 CVSS 和資料的重要性。依結果套用依嚴重度與曝露程度訂的 SLA，不受影響的用 VEX 記錄理由關閉，修不了的走例外流程。</li>
<li>CVSS 是漏洞本身理論上的嚴重度，0 到 10 分，不考慮你的環境，也不考慮有沒有人在利用。EPSS 是未來 30 天在真實世界被嘗試利用的機率，每天更新，但它不知道你是不是目標、有沒有對外開放。KEV 是 CISA 維護、已確認被利用的漏洞清單，訊號最強，但它只收有證據的，數量少，沒進清單不代表安全。三者要搭配，再加上自己的資產曝露資訊。</li>
<li>先確認它是否對外、是否可達、有沒有被利用的跡象。接著用補償措施降低曝險：WAF 或虛擬修補擋住有漏洞的路徑、關掉相關功能、限制來源 IP、把服務移到 VPN 後面，並針對這個漏洞加偵測規則。然後開例外：寫明理由、補償措施、由風險負責人簽核、到期日設在預計修補日附近，到期自動重審。同時持續追蹤廠商進度。</li>
<li>重新掃描，而且掃的是正在執行的東西：容器要比對叢集裡實際跑的映像檔摘要；主機要確認套件版本，並確認使用舊函式庫的服務已經重啟（例如用 needrestart），核心更新後已經重開機。對外的服務可以再用外部掃描從外面確認。最後在系統裡關單，附上驗證證據。</li>
<li>從資產盤點開始：從雲端 API、K8s、映像檔倉庫自動產生清單，每一筆有負責人、環境、是否對外。接著把掃描器接到這份清單，先求涵蓋率再求深度。然後訂排序規則和 SLA、建立例外流程，讓修補自動化（自動 PR、定期重建映像檔），最後定指標定期回報。順序不能反：沒有清單就掃描，你永遠不知道沒掃到什麼。</li>
<li>涵蓋率、依嚴重度分開的修補時間中位數與 90 百分位、SLA 達成率、漏洞年齡分布、例外數量與續期次數、復發率。不用未修漏洞數，是因為它會隨著涵蓋率提高而上升，拿它考核會讓大家傾向少掃描、或把資產藏起來。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>用本章的公式，算出 <code>CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H</code> 的分數。（PR:L 在範圍不變時的權重是 0.62。）</li>
<li>到 EPSS 的公開 API 查一個你聽過的 CVE，例如 <code>curl -s "https://api.first.org/data/v1/epss?cve=CVE-2021-44228"</code>。回傳的 epss 和 percentile 各代表什麼？</li>
<li>在你的一個 Node.js 專案裡跑 <code>npm audit</code>，挑出其中一筆，判斷它是不是在正式環境會被用到，並寫一句 VEX 風格的結論（狀態＋理由）。</li>
<li>本章表格裡的弱點 D（CVSS 8.8、內部管理後台、只能從 VPN 連）。如果某天它被加進了 KEV，你的判斷和期限會怎麼變？為什麼？</li>
<li>你的團隊上一季 SLA 達成率是 60%，逾期的大多集中在一套五年前的系統上。列出三個可能的根本原因，以及各自的對策。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>可利用性 = 8.22 × 0.85 × 0.77 × 0.62 × 0.85 ≈ 2.84。衝擊跟 9.8 那題一樣 ≈ 5.87。相加 ≈ 8.71，無條件進位到小數一位是 8.8，屬於 High。只差在「要先有一個低權限帳號」，分數就從 9.8 掉到 8.8。</li>
<li>epss 是未來 30 天內觀察到有人嘗試利用它的機率（例如 0.94 代表 94%）；percentile 是它在所有 CVE 裡排在第幾百分位（例如 0.999 代表比 99.9% 的 CVE 都高）。Log4Shell 這種漏洞，兩個數字都會非常接近 1。數字每天更新，所以你查到的值會跟別人不一樣。</li>
<li>先用 <code>npm ls 套件名</code> 看它被誰帶進來。如果它只在 devDependencies 底下（例如測試或打包工具），而且不會進到正式的打包結果，可以寫：「狀態：不受影響；理由：只存在於開發工具，正式環境不含此元件。」如果它在正式執行的相依裡，就要再看有漏洞的功能有沒有被用到，判斷不了就當作受影響。</li>
<li>進了 KEV 代表已經確定有人在真實攻擊中利用它。雖然它只能從 VPN 連，但攻擊者常常先拿到 VPN 帳號或已經在內網，所以期限要從 30 天大幅縮短，例如 7 天內，並且立刻檢查日誌有沒有被利用的跡象、先限制只有少數管理員 IP 能連。如果 VPN 本身也有弱點（像弱點 B），兩者加起來就是一條完整的攻擊路徑，要更急。</li>
<li>一、沒有明確負責人：原團隊已經解散，漏洞單沒人接。對策：在資產清單補上負責人，由主管指派。二、怕改壞：沒有測試、沒有退版方式，每次更新都要人工驗證好幾天。對策：補上最基本的自動化測試和快速退版，讓更新變便宜。三、技術上卡住：舊的作業系統或框架已經終止支援，根本沒有修補。對策：開例外加補償措施（隔離網段、WAF），同時排進汰換計畫，並把這個風險上報給能撥預算的人。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>FIRST 的 CVSS 規格與計算機</b>（<a href="https://www.first.org/cvss/">first.org/cvss</a>）：3.1 和 4.0 的完整規格，每個指標的定義和計算公式，附線上計算機。</li>
<li><b>EPSS</b>（<a href="https://www.first.org/epss/">first.org/epss</a>）：模型說明、每日資料下載和 API 文件。</li>
<li><b>CISA Known Exploited Vulnerabilities Catalog</b>（<a href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog">cisa.gov/known-exploited-vulnerabilities-catalog</a>）：可以下載 JSON 或 CSV，直接接進你的排序流程。</li>
<li><b>OSV</b>（<a href="https://osv.dev/">osv.dev</a>）：Google 維護的開源漏洞資料庫，涵蓋 npm、Go、PyPI 等生態系，並提供 osv-scanner 工具。</li>
<li><b>CIS Controls</b>（<a href="https://www.cisecurity.org/controls">cisecurity.org/controls</a>）：第 1、2 項是硬體與軟體資產盤點，第 7 項是持續的弱點管理，是建立計畫時最實用的起點。</li>
</ul>
` });
