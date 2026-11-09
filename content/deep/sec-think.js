DEEP({ 'sec-think': `
<p>上一課給了你四個問題、幾個原則和一張 STRIDE 表。這一章把它們真的用一次：拿這個網站一直在用的「猜高低」小遊戲，從畫一張資料流程圖開始，一格一格找出可能出的事，替每一項打分數、排優先順序，再把每一個威脅變成一條需求、一個控制措施、一個自動化測試和一個警報。接著看「假設已被入侵」怎麼落實成架構，資安怎麼放進開發流程又不拖慢大家，最後用幾起公開的大型事故，看看真實世界的失守通常長什麼樣子。這是防守者的思考方式，模組 5 後面每一課（網站、身分驗證、機密、雲端權限）都建立在它上面。</p>

<h3><span class="badge lv1">基礎</span>一、威脅模型就是一張「哪裡會出事」的地圖</h3>
<p>想像你要幫一間小店裝保全。你不會一開始就去買最貴的攝影機。你會先畫店的平面圖：錢放在哪裡、門和窗在哪裡、誰有鑰匙、晚上誰還在店裡。然後一個一個問：小偷從哪裡最好進來？進來之後，走幾步就拿得到錢？這張平面圖加上這些問題，就是<b>威脅模型</b>（threat model）。</p>
<p>先把幾個常被混用的詞分清楚，面試很愛問：</p>
<table>
<tr><th>詞</th><th>意思</th><th>猜高低的例子</th></tr>
<tr><td><b>資產</b>（asset）</td><td>值得保護的東西</td><td>玩家餘額、帳號、出金用的金鑰</td></tr>
<tr><td><b>威脅</b>（threat）</td><td>可能發生的壞事，以及想讓它發生的人</td><td>玩家想讓自己每一局都贏</td></tr>
<tr><td><b>弱點</b>（vulnerability）</td><td>讓威脅能成真的那個缺陷</td><td>輸贏由用戶端算好，再告訴伺服器</td></tr>
<tr><td><b>風險</b>（risk）</td><td>可能性 × 影響</td><td>很多人會試，一試就成功，損失直接變成現金</td></tr>
<tr><td><b>控制措施</b>（control）</td><td>降低可能性或影響的做法</td><td>伺服器自己發牌、自己判定輸贏</td></tr>
</table>
<p>重點在順序：先知道要保護什麼，才知道哪些威脅重要；先知道弱點在哪，才知道控制措施要放在哪裡。很多團隊反過來做：先買一套工具、開一堆掃描，結果警報一大堆，真正會賠錢的那條路卻沒人看。</p>
<div class="note"><b>威脅模型不必很正式。</b>Threat Modeling Manifesto 的精神是：誰都可以做，而且要早做、常做。一張白板照片加十條待辦事項，就比一份沒人讀的五十頁文件有用。</div>

<h3><span class="badge lv1">基礎</span>二、先畫圖：資料流程圖與信任邊界</h3>
<p>威脅模型的第一步是畫<b>資料流程圖</b>（data-flow diagram，DFD）。它只有五種符號，十分鐘就學得會：</p>
<ul>
<li><b>外部實體</b>（external entity）：你管不到的人或系統。玩家、第三方金流、營運人員。</li>
<li><b>處理程序</b>（process）：你寫的、會執行的程式。API 伺服器、管理後台、背景工作。</li>
<li><b>資料儲存</b>（data store）：資料停下來的地方。資料庫、快取、日誌、物件儲存。</li>
<li><b>資料流</b>（data flow）：箭頭，代表資料從哪裡移到哪裡。</li>
<li><b>信任邊界</b>（trust boundary）：虛線。線的兩邊，可信的程度不一樣。</li>
</ul>
<figure class="figure"><svg viewBox="0 0 680 290" class="fg" style="width:100%;max-width:680px" role="img" aria-label="猜高低系統的資料流程圖：左邊是玩家瀏覽器、金流服務、營運人員，中間是 API 伺服器和管理後台，右邊是資料庫和稽核日誌，兩條虛線是信任邊界，箭頭穿過虛線的地方都有綠點">
<text x="80" y="18" text-anchor="middle" class="fg-t sm">外部（管不到）</text>
<text x="337" y="18" text-anchor="middle" class="fg-t sm">你的程式</text>
<text x="580" y="18" text-anchor="middle" class="fg-t sm">資料</text>
<rect x="20" y="30" width="120" height="50" rx="4" class="fg-b"/>
<text x="80" y="52" text-anchor="middle" class="fg-t">玩家瀏覽器</text>
<text x="80" y="70" text-anchor="middle" class="fg-t sm">在玩家手上</text>
<rect x="20" y="115" width="120" height="50" rx="4" class="fg-b"/>
<text x="80" y="137" text-anchor="middle" class="fg-t">金流服務</text>
<text x="80" y="155" text-anchor="middle" class="fg-t sm">第三方</text>
<rect x="20" y="200" width="120" height="50" rx="4" class="fg-b"/>
<text x="80" y="222" text-anchor="middle" class="fg-t">營運人員</text>
<text x="80" y="240" text-anchor="middle" class="fg-t sm">內部的人</text>
<line x1="215" y1="26" x2="215" y2="258" class="fg-l warm dash"/>
<line x1="460" y1="26" x2="460" y2="258" class="fg-l warm dash"/>
<text x="215" y="278" text-anchor="middle" class="fg-t sm warm">信任邊界 1</text>
<text x="460" y="278" text-anchor="middle" class="fg-t sm warm">信任邊界 2</text>
<rect x="262" y="30" width="150" height="135" rx="22" class="fg-b hot"/>
<text x="337" y="92" text-anchor="middle" class="fg-t acc">API 伺服器</text>
<text x="337" y="112" text-anchor="middle" class="fg-t sm">猜高低規則、算餘額</text>
<rect x="262" y="200" width="150" height="50" rx="22" class="fg-b hot"/>
<text x="337" y="222" text-anchor="middle" class="fg-t acc">管理後台</text>
<text x="337" y="240" text-anchor="middle" class="fg-t sm">改設定、查帳</text>
<rect x="505" y="30" width="150" height="135" rx="4" class="fg-b alt"/>
<text x="580" y="92" text-anchor="middle" class="fg-t">資料庫</text>
<text x="580" y="112" text-anchor="middle" class="fg-t sm">餘額、牌局紀錄</text>
<rect x="505" y="200" width="150" height="50" rx="4" class="fg-b alt"/>
<text x="580" y="222" text-anchor="middle" class="fg-t">稽核日誌</text>
<text x="580" y="240" text-anchor="middle" class="fg-t sm">只能新增</text>
<line x1="140" y1="55" x2="254" y2="55" class="fg-l"/><polygon points="262,55 254,50.5 254,59.5" class="fg-a"/>
<text x="176" y="46" text-anchor="middle" class="fg-t sm">HTTPS 請求</text>
<line x1="140" y1="140" x2="254" y2="140" class="fg-l"/><polygon points="262,140 254,135.5 254,144.5" class="fg-a"/>
<text x="176" y="131" text-anchor="middle" class="fg-t sm">付款通知</text>
<line x1="140" y1="225" x2="254" y2="225" class="fg-l"/><polygon points="262,225 254,220.5 254,229.5" class="fg-a"/>
<text x="176" y="216" text-anchor="middle" class="fg-t sm">登入、操作</text>
<line x1="412" y1="70" x2="497" y2="70" class="fg-l"/><polygon points="505,70 497,65.5 497,74.5" class="fg-a"/>
<text x="436" y="61" text-anchor="middle" class="fg-t sm">讀寫</text>
<path d="M412 212 H482 V150 H497" class="fg-l"/><polygon points="505,150 497,145.5 497,154.5" class="fg-a"/>
<text x="436" y="203" text-anchor="middle" class="fg-t sm">查詢</text>
<line x1="412" y1="238" x2="497" y2="238" class="fg-l"/><polygon points="505,238 497,233.5 497,242.5" class="fg-a"/>
<text x="436" y="232" text-anchor="middle" class="fg-t sm">寫入</text>
<circle cx="215" cy="55" r="5" class="fg-lamp on"/><circle cx="215" cy="140" r="5" class="fg-lamp on"/><circle cx="215" cy="225" r="5" class="fg-lamp on"/>
<circle cx="460" cy="70" r="5" class="fg-lamp on"/><circle cx="460" cy="212" r="5" class="fg-lamp on"/><circle cx="460" cy="238" r="5" class="fg-lamp on"/>
</svg><figcaption>方框是外部實體，圓角框是你的程式，藍框是資料。橘色虛線是信任邊界，每一個綠點都是「資料從比較不可信的一邊進來」的地方，都要檢查。</figcaption></figure>
<p>整張圖最重要的是虛線。<b>信任邊界</b>的意思是：從這一邊過到那一邊的資料，必須重新檢查，不能因為「它是從我們自己的前端送來的」就相信它。玩家的瀏覽器在玩家手上，他可以改任何東西；金流服務的通知可能是別人偽造的；營運人員的電腦可能中了毒。第二條虛線常被忽略：資料庫不應該無條件相信應用程式，所以每個服務要用自己的資料庫帳號，只拿到它需要的權限。</p>
<p>畫完圖之後，第一個動作就是數「穿過虛線的箭頭」。圖上有六個綠點，每一個都要回答三件事：<b>誰在送</b>（身分驗證）、<b>他可以送這個嗎</b>（授權）、<b>送來的內容合理嗎</b>（輸入驗證）。漏掉任何一個點，就是一扇沒上鎖的門。</p>
<h4>畫圖時最常漏掉的東西</h4>
<ul>
<li><b>部署管線</b>（CI/CD）：它能把任何程式碼放上正式環境，等於擁有最高權限。它也是一個處理程序，也有自己的信任邊界。</li>
<li><b>你自己的筆電</b>：上面有 SSH 金鑰、雲端憑證、資料庫連線字串。</li>
<li><b>備份和匯出檔</b>：資料庫有權限控管，匯出成 CSV 丟進共用資料夾之後就沒有了。</li>
<li><b>第三方腳本</b>：網頁裡載入的分析工具、客服聊天外掛，跑在你的頁面上，權限跟你自己的程式一樣大。</li>
</ul>

<h3><span class="badge lv2">進階</span>三、用 STRIDE 一格一格過</h3>
<p>圖畫好了，下一個問題是「可能出什麼事」。靠靈感想，一定會漏。STRIDE 把威脅分成六類，讓你對著每一個元件逐項檢查。不是每一類都適用每一種元件，微軟整理過的對照（STRIDE-per-element）大致是這樣：</p>
<table>
<tr><th>元件</th><th>主要檢查</th><th>為什麼</th></tr>
<tr><td>外部實體</td><td>S、R</td><td>它可能是冒充的；它做過的事可能不認帳</td></tr>
<tr><td>處理程序</td><td>六類全部</td><td>程式會做決定，每一類都可能出事</td></tr>
<tr><td>資料儲存</td><td>T、I、D（日誌再加 R）</td><td>資料被改、被讀、被塞爆；日誌是對方否認時的證據</td></tr>
<tr><td>資料流</td><td>T、I、D</td><td>傳輸途中被改、被偷看、被切斷</td></tr>
</table>
<p>現在拿猜高低最核心的那條資料流走一次：玩家按下「猜高」，瀏覽器送出一個請求到 API 伺服器。</p>
<table>
<tr><th>類別</th><th>在猜高低裡長什麼樣</th><th>控制措施</th><th>怎麼證明它有效</th></tr>
<tr><td><b>S</b> 假冒</td><td>拿別人的工作階段來下注</td><td>工作階段 ID 夠長、夠隨機、HttpOnly，登入時換新的</td><td>測試：登入前後的 session ID 不一樣</td></tr>
<tr><td><b>T</b> 竄改</td><td>改掉請求裡的下注金額，或直接送「我贏了」</td><td>伺服器只收「猜高或猜低、押多少」，輸贏自己算；金額有上下限</td><td>測試：負數、零、超過餘額的金額，全部被拒絕</td></tr>
<tr><td><b>R</b> 否認</td><td>玩家說「那一注不是我下的」</td><td>每一注都寫進只能新增的帳本，帶時間、帳號、請求 ID</td><td>演練：隨便抽一筆客訴，五分鐘內找出完整紀錄</td></tr>
<tr><td><b>I</b> 資訊洩漏</td><td>回應裡多帶了下一張牌，或亂數的種子</td><td>回應只放這一局需要的欄位；下一張牌只存在伺服器</td><td>測試：用快照比對回應的欄位清單</td></tr>
<tr><td><b>D</b> 阻斷服務</td><td>一秒送進幾千個請求</td><td>每個帳號、每個來源位址各自限速</td><td>負載測試時確認超量的請求回 429</td></tr>
<tr><td><b>E</b> 權限提升</td><td>一般玩家呼叫管理用的 API</td><td>中央授權，所有管理路由預設拒絕</td><td>測試：玩家帳號打每一條管理路由，全部 403</td></tr>
</table>
<p>注意最右邊那一欄。威脅模型做完如果只留下一張表格，三個月後就沒人記得了。<b>每一個控制措施都要配一個能自動執行的檢查</b>，放進測試或監控裡，它才會一直有效。</p>
<h4>STRIDE 漏掉的那一類：邏輯濫用</h4>
<p>STRIDE 從技術元件出發，所以很難抓到「每一步都合法，組合起來卻不對」的問題。碰到錢的系統，要另外寫<b>濫用案例</b>（abuse case）：把每個功能的使用者故事反過來寫。「玩家每天可以領一次紅利」反過來問：一天之內有沒有辦法領到兩次？兩個請求同時到達時，伺服器會不會兩次都判斷「今天還沒領」？「今天」是用誰的時鐘算的？這類問題的控制措施通常放在資料庫層：唯一索引、原子更新、一律用伺服器的時間。</p>

<h3><span class="badge lv2">進階</span>四、排優先順序：可能性 × 影響</h3>
<p>列完通常會有二、三十條威脅。不可能一次全修，所以要排序。最常見的做法是可能性和影響各打 1 到 5 分，再相乘：</p>
<figure class="figure"><svg viewBox="0 0 640 310" class="fg" style="width:100%;max-width:640px" role="img" aria-label="五乘五的風險矩陣，橫軸是可能性，縱軸是影響，右上角是高風險區，五個威脅 A 到 E 標在各自的格子裡">
<rect x="110" y="30" width="60" height="46" class="fg-b alt"/><rect x="170" y="30" width="60" height="46" class="fg-b alt"/><rect x="230" y="30" width="60" height="46" class="fg-b warm"/><rect x="290" y="30" width="60" height="46" class="fg-b warm"/><rect x="350" y="30" width="60" height="46" class="fg-b warm"/>
<rect x="110" y="76" width="60" height="46" class="fg-b"/><rect x="170" y="76" width="60" height="46" class="fg-b alt"/><rect x="230" y="76" width="60" height="46" class="fg-b warm"/><rect x="290" y="76" width="60" height="46" class="fg-b warm"/><rect x="350" y="76" width="60" height="46" class="fg-b warm"/>
<rect x="110" y="122" width="60" height="46" class="fg-b"/><rect x="170" y="122" width="60" height="46" class="fg-b alt"/><rect x="230" y="122" width="60" height="46" class="fg-b alt"/><rect x="290" y="122" width="60" height="46" class="fg-b warm"/><rect x="350" y="122" width="60" height="46" class="fg-b warm"/>
<rect x="110" y="168" width="60" height="46" class="fg-b"/><rect x="170" y="168" width="60" height="46" class="fg-b"/><rect x="230" y="168" width="60" height="46" class="fg-b alt"/><rect x="290" y="168" width="60" height="46" class="fg-b alt"/><rect x="350" y="168" width="60" height="46" class="fg-b alt"/>
<rect x="110" y="214" width="60" height="46" class="fg-b"/><rect x="170" y="214" width="60" height="46" class="fg-b"/><rect x="230" y="214" width="60" height="46" class="fg-b"/><rect x="290" y="214" width="60" height="46" class="fg-b"/><rect x="350" y="214" width="60" height="46" class="fg-b alt"/>
<text x="140" y="57" text-anchor="middle" class="fg-t sm">5</text><text x="320" y="57" text-anchor="middle" class="fg-t sm">20</text><text x="380" y="57" text-anchor="middle" class="fg-t sm">25</text>
<text x="140" y="103" text-anchor="middle" class="fg-t sm">4</text><text x="200" y="103" text-anchor="middle" class="fg-t sm">8</text><text x="260" y="103" text-anchor="middle" class="fg-t sm">12</text><text x="320" y="103" text-anchor="middle" class="fg-t sm">16</text>
<text x="140" y="149" text-anchor="middle" class="fg-t sm">3</text><text x="200" y="149" text-anchor="middle" class="fg-t sm">6</text><text x="260" y="149" text-anchor="middle" class="fg-t sm">9</text><text x="320" y="149" text-anchor="middle" class="fg-t sm">12</text><text x="380" y="149" text-anchor="middle" class="fg-t sm">15</text>
<text x="140" y="195" text-anchor="middle" class="fg-t sm">2</text><text x="200" y="195" text-anchor="middle" class="fg-t sm">4</text><text x="260" y="195" text-anchor="middle" class="fg-t sm">6</text><text x="380" y="195" text-anchor="middle" class="fg-t sm">10</text>
<text x="140" y="241" text-anchor="middle" class="fg-t sm">1</text><text x="200" y="241" text-anchor="middle" class="fg-t sm">2</text><text x="320" y="241" text-anchor="middle" class="fg-t sm">4</text><text x="380" y="241" text-anchor="middle" class="fg-t sm">5</text>
<circle cx="200" cy="53" r="13" class="fg-b"/><text x="200" y="58" text-anchor="middle" class="fg-t acc">C</text>
<circle cx="260" cy="53" r="13" class="fg-b"/><text x="260" y="58" text-anchor="middle" class="fg-t acc">A</text>
<circle cx="380" cy="99" r="13" class="fg-b"/><text x="380" y="104" text-anchor="middle" class="fg-t acc">B</text>
<circle cx="320" cy="191" r="13" class="fg-b"/><text x="320" y="196" text-anchor="middle" class="fg-t acc">D</text>
<circle cx="260" cy="237" r="13" class="fg-b"/><text x="260" y="242" text-anchor="middle" class="fg-t acc">E</text>
<text x="100" y="57" text-anchor="end" class="fg-t sm">5</text><text x="100" y="103" text-anchor="end" class="fg-t sm">4</text><text x="100" y="149" text-anchor="end" class="fg-t sm">3</text><text x="100" y="195" text-anchor="end" class="fg-t sm">2</text><text x="100" y="241" text-anchor="end" class="fg-t sm">1</text>
<text x="56" y="146" text-anchor="middle" class="fg-t">影響</text><text x="56" y="164" text-anchor="middle" class="fg-t sm">（多慘）</text>
<text x="140" y="278" text-anchor="middle" class="fg-t sm">1</text><text x="200" y="278" text-anchor="middle" class="fg-t sm">2</text><text x="260" y="278" text-anchor="middle" class="fg-t sm">3</text><text x="320" y="278" text-anchor="middle" class="fg-t sm">4</text><text x="380" y="278" text-anchor="middle" class="fg-t sm">5</text>
<text x="260" y="300" text-anchor="middle" class="fg-t">可能性（多常發生）</text>
<rect x="440" y="34" width="14" height="14" class="fg-b warm"/><text x="462" y="46" class="fg-t sm">12 分以上：先修</text>
<rect x="440" y="58" width="14" height="14" class="fg-b alt"/><text x="462" y="70" class="fg-t sm">5 到 11 分：排進計畫</text>
<rect x="440" y="82" width="14" height="14" class="fg-b"/><text x="462" y="94" class="fg-t sm">4 分以下：接受並寫下來</text>
<circle cx="448" cy="126" r="10" class="fg-b"/><text x="448" y="130" text-anchor="middle" class="fg-t sm acc">A</text><text x="466" y="130" class="fg-t sm">管理後台沒有第二道驗證</text><text x="630" y="130" text-anchor="end" class="fg-t sm warm">15</text>
<circle cx="448" cy="152" r="10" class="fg-b"/><text x="448" y="156" text-anchor="middle" class="fg-t sm acc">B</text><text x="466" y="156" class="fg-t sm">輸贏由用戶端回報</text><text x="630" y="156" text-anchor="end" class="fg-t sm warm">20</text>
<circle cx="448" cy="178" r="10" class="fg-b"/><text x="448" y="182" text-anchor="middle" class="fg-t sm acc">C</text><text x="466" y="182" class="fg-t sm">備份檔可以公開下載</text><text x="630" y="182" text-anchor="end" class="fg-t sm alt">10</text>
<circle cx="448" cy="204" r="10" class="fg-b"/><text x="448" y="208" text-anchor="middle" class="fg-t sm acc">D</text><text x="466" y="208" class="fg-t sm">大量請求灌爆 API</text><text x="630" y="208" text-anchor="end" class="fg-t sm alt">8</text>
<circle cx="448" cy="230" r="10" class="fg-b"/><text x="448" y="234" text-anchor="middle" class="fg-t sm acc">E</text><text x="466" y="234" class="fg-t sm">玩家否認下過注</text><text x="630" y="234" text-anchor="end" class="fg-t sm">3</text>
</svg><figcaption>同一張表上，B（20 分）和 A（15 分）排在最前面；C 的影響很大，但目前不太容易發生，排第三。分數不精確沒關係，它的用處是讓大家對同一件事有同一個排序。</figcaption></figure>
<p>打分數的時候，可能性看三件事：需要多少技術、要先拿到什麼（要先有帳號，還是任何人都行）、這個入口有多公開。影響看：會賠多少錢、會外洩多少人的資料、會停機多久、要不要通報主管機關。分數本身不精確，沒關係。它的用處是<b>逼團隊把「我覺得很危險」講成「為什麼危險」</b>。大家對同一個數字爭論，比各說各話有效率得多。</p>
<p>排完序，每一條都要做一個決定，只有四種：</p>
<table>
<tr><th>處理方式</th><th>意思</th><th>例子</th></tr>
<tr><td><b>降低</b>（mitigate）</td><td>加控制措施，讓可能性或影響變小</td><td>A：管理後台加上第二道驗證</td></tr>
<tr><td><b>避免</b>（avoid）</td><td>拿掉造成風險的功能或設計</td><td>B：輸贏不再由用戶端回報，整段邏輯搬到伺服器</td></tr>
<tr><td><b>轉移</b>（transfer）</td><td>交給別人承擔</td><td>信用卡資料交給金流商處理，你的系統完全不碰卡號</td></tr>
<tr><td><b>接受</b>（accept）</td><td>知道它在那裡，決定先不處理，寫下理由和負責人</td><td>E：先靠帳本處理客訴，暫時不做數位簽章</td></tr>
</table>
<p>「接受」不是偷懶，前提是寫下來、有人簽名、訂好重新檢討的日期。沒寫下來的接受，就只是忘了。</p>
<div class="note"><b>CVSS 分數不是你的風險分數。</b>弱點掃描報告上的 CVSS，衡量的是「這種弱點一般而言有多嚴重」，它不知道你的系統長什麼樣子。一個 9.8 分的漏洞，如果在一台不對外、沒有資料的測試機上，對你的風險可能比登入頁上一個 6 分的漏洞還低。排序時，要把它放回你自己的威脅模型裡看。</div>

<h3><span class="badge lv3">專業</span>五、把威脅變成需求、控制、測試和警報</h3>
<p>這一步是業餘和專業的分水嶺。拿上面表格裡的 E（一般玩家呼叫管理 API）走完一整條鏈：</p>
<figure class="figure"><svg viewBox="0 0 680 220" class="fg" style="width:100%;max-width:680px" role="img" aria-label="一個威脅依序變成需求、控制措施、測試和警報五個方塊，最後一格有箭頭回到第一格，代表上線後的發現要回頭更新威脅模型">
<rect x="10" y="30" width="118" height="120" rx="6" class="fg-b warm"/>
<text x="69" y="56" text-anchor="middle" class="fg-t warm">1 威脅</text>
<text x="69" y="84" text-anchor="middle" class="fg-t sm">一般玩家</text><text x="69" y="104" text-anchor="middle" class="fg-t sm">呼叫管理 API</text><text x="69" y="124" text-anchor="middle" class="fg-t sm">（權限提升 E）</text>
<rect x="145" y="30" width="118" height="120" rx="6" class="fg-b alt"/>
<text x="204" y="56" text-anchor="middle" class="fg-t alt">2 需求</text>
<text x="204" y="84" text-anchor="middle" class="fg-t sm mono">/admin 底下</text><text x="204" y="104" text-anchor="middle" class="fg-t sm">只有 admin</text><text x="204" y="124" text-anchor="middle" class="fg-t sm">角色能用</text>
<rect x="280" y="30" width="118" height="120" rx="6" class="fg-b hot"/>
<text x="339" y="56" text-anchor="middle" class="fg-t acc">3 控制措施</text>
<text x="339" y="84" text-anchor="middle" class="fg-t sm">中央授權</text><text x="339" y="104" text-anchor="middle" class="fg-t sm">中介層</text><text x="339" y="124" text-anchor="middle" class="fg-t sm">沒宣告就拒絕</text>
<rect x="415" y="30" width="118" height="120" rx="6" class="fg-b alt"/>
<text x="474" y="56" text-anchor="middle" class="fg-t alt">4 測試</text>
<text x="474" y="84" text-anchor="middle" class="fg-t sm">用玩家帳號打</text><text x="474" y="104" text-anchor="middle" class="fg-t sm">每一條管理路由</text><text x="474" y="124" text-anchor="middle" class="fg-t sm">全部要 403</text>
<rect x="550" y="30" width="118" height="120" rx="6" class="fg-b alt"/>
<text x="609" y="56" text-anchor="middle" class="fg-t alt">5 警報</text>
<text x="609" y="84" text-anchor="middle" class="fg-t sm">403 突然變多</text><text x="609" y="104" text-anchor="middle" class="fg-t sm">就發警報</text><text x="609" y="124" text-anchor="middle" class="fg-t sm">通知值班的人</text>
<line x1="128" y1="90" x2="137" y2="90" class="fg-l"/><polygon points="145,90 137,85.5 137,94.5" class="fg-a"/>
<line x1="263" y1="90" x2="272" y2="90" class="fg-l"/><polygon points="280,90 272,85.5 272,94.5" class="fg-a"/>
<line x1="398" y1="90" x2="407" y2="90" class="fg-l"/><polygon points="415,90 407,85.5 407,94.5" class="fg-a"/>
<line x1="533" y1="90" x2="542" y2="90" class="fg-l"/><polygon points="550,90 542,85.5 542,94.5" class="fg-a"/>
<path d="M609 150 V182 H69 V158" class="fg-l on dash"/><polygon points="69,150 64.5,158 73.5,158" class="fg-a on"/>
<text x="339" y="204" text-anchor="middle" class="fg-t sm acc">上線後的新發現，回頭更新威脅模型</text>
</svg><figcaption>一個威脅不算處理完，要等到它有一條可以測試的需求、一個放在「忘不掉的地方」的控制措施、一個自動跑的測試，以及一個會響的警報。</figcaption></figure>
<p>需求要寫成<b>可以測試的句子</b>。「管理後台要安全」沒辦法測；「所有 <code>/admin</code> 底下的路由，只有帶 <code>admin</code> 角色的工作階段能存取，其他一律回 403」可以。測試就照著需求寫：</p>
<pre><code>// admin-routes.test.ts
// listRoutes 是你自己寫的小函式：把 app 註冊過的每一條路由列出來
const adminRoutes = listRoutes(app).filter(r =&gt; r.path.startsWith('/admin'));

test.each(adminRoutes)('玩家帳號呼叫 $method $path 要被拒絕', async ({ method, path }) =&gt; {
  const res = await request(app)[method](path).set('Cookie', playerCookie);
  expect(res.status).toBe(403);
});</code></pre>
<p>這段測試的關鍵是「從路由表自動列出來」。手寫清單的話，下個月有人新增一條管理路由，清單沒更新，測試照樣全綠。從程式本身列出來，新路由一出現就會自動被檢查。同樣的道理，控制措施本身也要放在一個<b>忘不掉的地方</b>：一個掛在所有 <code>/admin</code> 路由前面的中介層，比在每一個處理函式裡各寫一次 <code>if</code> 可靠得多。</p>
<p>最後一格是警報。控制措施擋下來的東西，本身就是情報：同一個玩家帳號一分鐘內在管理路由上吃了二十次 403，代表有人在一扇一扇試門。把「授權被拒絕」記成結構化日誌，就能對它設警報。日誌要怎麼收、警報要怎麼設才不會變成噪音，第 6.4 課會細講。</p>
<h4>威脅模型什麼時候要重做</h4>
<p>不用每次改程式都重做，遇到這幾種變動才要：多了一個新的入口（新的 API、新的 WebSocket 頻道）、多了一種新的資料（開始收身分證字號）、多了一個第三方（接新的金流）、信任邊界移動了（某個服務從內網搬到公開網路）。把威脅模型存在程式碼旁邊，例如 <code>docs/threat-model.md</code>，跟著 pull request 一起審，它就會一直是活的。</p>

<h3><span class="badge lv3">專業</span>六、假設已被入侵：把影響範圍設計得很小</h3>
<p>到目前為止，想的都是「怎麼不讓人進來」。<b>假設已被入侵</b>（assume breach）換一個問題：如果某一台機器今晚被拿下了，攻擊者能走多遠？這不是悲觀，而是承認一個事實：程式一定有 bug，人一定會點錯連結，總有一天某一層會失守。</p>
<figure class="figure"><svg viewBox="0 0 680 290" class="fg" style="width:100%;max-width:680px" role="img" aria-label="左邊所有服務共用一台機器和一份設定檔，API 被攻破後整個虛線框都是影響範圍；右邊服務拆開、各有自己的帳號，影響範圍只剩 API、一張資料表和一張短效憑證">
<line x1="340" y1="12" x2="340" y2="280" class="fg-l dim"/>
<text x="170" y="28" text-anchor="middle" class="fg-t lg">之前：一台機器、一份 .env</text>
<rect x="20" y="44" width="300" height="196" rx="8" class="fg-l warm dash"/>
<rect x="35" y="58" width="130" height="44" rx="5" class="fg-b warm"/><text x="100" y="77" text-anchor="middle" class="fg-t">API 伺服器</text><text x="100" y="94" text-anchor="middle" class="fg-t sm warm">被攻破</text>
<rect x="175" y="58" width="130" height="44" rx="5" class="fg-b"/><text x="240" y="77" text-anchor="middle" class="fg-t">管理後台</text><text x="240" y="94" text-anchor="middle" class="fg-t sm">同一台機器</text>
<rect x="35" y="116" width="130" height="44" rx="5" class="fg-b"/><text x="100" y="135" text-anchor="middle" class="fg-t">背景工作</text><text x="100" y="152" text-anchor="middle" class="fg-t sm">同一台機器</text>
<rect x="175" y="116" width="130" height="44" rx="5" class="fg-b"/><text x="240" y="135" text-anchor="middle" class="fg-t">資料庫</text><text x="240" y="152" text-anchor="middle" class="fg-t sm">全部的表</text>
<rect x="35" y="174" width="130" height="44" rx="5" class="fg-b"/><text x="100" y="193" text-anchor="middle" class="fg-t">共用 .env</text><text x="100" y="210" text-anchor="middle" class="fg-t sm">每一組密碼</text>
<rect x="175" y="174" width="130" height="44" rx="5" class="fg-b"/><text x="240" y="193" text-anchor="middle" class="fg-t">錢包金鑰</text><text x="240" y="210" text-anchor="middle" class="fg-t sm">直接讀得到</text>
<text x="170" y="264" text-anchor="middle" class="fg-t warm">影響範圍：全部</text>
<text x="510" y="28" text-anchor="middle" class="fg-t lg">之後：拆開、各拿各的</text>
<rect x="358" y="44" width="154" height="196" rx="8" class="fg-l warm dash"/>
<rect x="370" y="58" width="130" height="44" rx="5" class="fg-b warm"/><text x="435" y="77" text-anchor="middle" class="fg-t">API 伺服器</text><text x="435" y="94" text-anchor="middle" class="fg-t sm warm">被攻破</text>
<rect x="370" y="116" width="130" height="44" rx="5" class="fg-b"/><text x="435" y="135" text-anchor="middle" class="fg-t">牌局資料表</text><text x="435" y="152" text-anchor="middle" class="fg-t sm">只能讀寫這一張</text>
<rect x="370" y="174" width="130" height="44" rx="5" class="fg-b"/><text x="435" y="193" text-anchor="middle" class="fg-t">短效憑證</text><text x="435" y="210" text-anchor="middle" class="fg-t sm">15 分鐘後失效</text>
<rect x="530" y="58" width="135" height="44" rx="5" class="fg-b"/><text x="597" y="77" text-anchor="middle" class="fg-t">管理後台</text><text x="597" y="94" text-anchor="middle" class="fg-t sm">另一個網段＋MFA</text>
<rect x="530" y="116" width="135" height="44" rx="5" class="fg-b"/><text x="597" y="135" text-anchor="middle" class="fg-t">使用者資料表</text><text x="597" y="152" text-anchor="middle" class="fg-t sm">API 帳號讀不到</text>
<rect x="530" y="174" width="135" height="44" rx="5" class="fg-b hot"/><text x="597" y="193" text-anchor="middle" class="fg-t acc">簽章服務</text><text x="597" y="210" text-anchor="middle" class="fg-t sm">錢包金鑰只在這裡</text>
<text x="435" y="264" text-anchor="middle" class="fg-t warm">影響範圍：一張表、15 分鐘</text>
</svg><figcaption>兩邊的功能一模一樣，差別只在每個零件拿到多少權限。同樣是 API 被攻破，左邊全部失守，右邊的損失被關在虛線框裡。</figcaption></figure>
<p>左邊所有服務共用一台機器、一份 <code>.env</code>，API 一被攻破，管理後台、全部的資料表、錢包金鑰全都到手。右邊每個服務有自己的資料庫帳號，只授權它需要的表；錢包金鑰只在簽章服務裡（第 5.4 課）；管理後台在另一個網路區段，還要第二道驗證。API 同樣被攻破，損失被關在虛線框裡。</p>
<h4>影響範圍有兩個維度：寬度和長度</h4>
<p><b>寬度</b>是攻擊者碰得到什麼，靠最小權限和網路分段來縮小。<b>長度</b>是他能待多久，靠短效憑證和偵測來縮短。一把一年都不會過期的金鑰，被偷了就是一整年的問題；一張 15 分鐘就失效的憑證，被偷了最多就是 15 分鐘。業界的年度事故報告（例如 Mandiant 每年出的 M-Trends）一直在追蹤「從入侵到被發現」的天數中位數，這十幾年來從一年以上降到了幾週以內，主要就是因為偵測做得比以前好。</p>
<h4>具體的設計手法</h4>
<table>
<tr><th>手法</th><th>縮小什麼</th><th>做法</th></tr>
<tr><td>每個服務一個資料庫帳號</td><td>寬度</td><td><code>GRANT SELECT, INSERT ON rounds TO api_svc;</code>，不給其他表，也不給刪表的權限</td></tr>
<tr><td>正式和開發用不同的雲端帳號</td><td>寬度</td><td>開發環境被攻破，碰不到正式資料（第 5.5 課）</td></tr>
<tr><td>網路分段、限制對外連線</td><td>寬度</td><td>資料庫只接受應用層的連線；伺服器只能連少數幾個外部目的地（第 5.6 課）</td></tr>
<tr><td>短效憑證</td><td>長度</td><td>用雲端角色拿幾小時內就過期的憑證，不放長期金鑰</td></tr>
<tr><td>日誌送離機器</td><td>長度</td><td>攻擊者刪不掉紀錄，你才看得到他</td></tr>
<tr><td>緊急開關（kill switch）</td><td>長度</td><td>一個按鈕就能暫停出金、撤銷所有工作階段</td></tr>
<tr><td>敏感操作的金額上限</td><td>影響</td><td>就算一切都失守，一天最多就是賠掉這個數字</td></tr>
</table>
<p>最後一行最常被忽略，卻最有用。單日出金上限是一條業務規則，跟程式有沒有 bug 無關。它把「最慘會賠多少」從「全部」變成一個你事先就知道、也承受得起的數字。</p>

<h3><span class="badge lv3">專業</span>七、把資安放進開發流程</h3>
<p>資安如果只在上線前找人掃一次，發現問題時設計早就定了，改起來又貴又痛。比較好的做法是把小小的檢查分散到每一個階段，這就是大家說的<b>安全軟體開發生命週期</b>（secure software development lifecycle，SSDLC），或「往左移」（shift left）。</p>
<figure class="figure"><svg viewBox="0 0 680 190" class="fg" style="width:100%;max-width:680px" role="img" aria-label="開發流程的六個階段由左到右：需求、設計、實作、測試、部署、營運，每一格下面寫著該做的資安工作，最下面一條箭頭說越晚發現修起來越貴">
<rect x="10" y="30" width="100" height="40" rx="6" class="fg-b alt"/><text x="60" y="55" text-anchor="middle" class="fg-t">需求</text>
<rect x="122" y="30" width="100" height="40" rx="6" class="fg-b alt"/><text x="172" y="55" text-anchor="middle" class="fg-t">設計</text>
<rect x="234" y="30" width="100" height="40" rx="6" class="fg-b alt"/><text x="284" y="55" text-anchor="middle" class="fg-t">實作</text>
<rect x="346" y="30" width="100" height="40" rx="6" class="fg-b alt"/><text x="396" y="55" text-anchor="middle" class="fg-t">測試</text>
<rect x="458" y="30" width="100" height="40" rx="6" class="fg-b alt"/><text x="508" y="55" text-anchor="middle" class="fg-t">部署</text>
<rect x="570" y="30" width="100" height="40" rx="6" class="fg-b alt"/><text x="620" y="55" text-anchor="middle" class="fg-t">營運</text>
<polygon points="122,50 114,45.5 114,54.5" class="fg-a"/><polygon points="234,50 226,45.5 226,54.5" class="fg-a"/><polygon points="346,50 338,45.5 338,54.5" class="fg-a"/><polygon points="458,50 450,45.5 450,54.5" class="fg-a"/><polygon points="570,50 562,45.5 562,54.5" class="fg-a"/>
<text x="60" y="92" text-anchor="middle" class="fg-t sm">寫安全需求</text><text x="60" y="110" text-anchor="middle" class="fg-t sm">參考 ASVS</text>
<text x="172" y="92" text-anchor="middle" class="fg-t sm">威脅模型</text><text x="172" y="110" text-anchor="middle" class="fg-t sm">畫信任邊界</text>
<text x="284" y="92" text-anchor="middle" class="fg-t sm">安全的寫法</text><text x="284" y="110" text-anchor="middle" class="fg-t sm">程式碼審查</text>
<text x="396" y="92" text-anchor="middle" class="fg-t sm">SAST 掃描</text><text x="396" y="110" text-anchor="middle" class="fg-t sm">相依套件掃描</text>
<text x="508" y="92" text-anchor="middle" class="fg-t sm">機密掃描</text><text x="508" y="110" text-anchor="middle" class="fg-t sm">設定檢查</text>
<text x="620" y="92" text-anchor="middle" class="fg-t sm">監控、修補</text><text x="620" y="110" text-anchor="middle" class="fg-t sm">回饋到需求</text>
<text x="340" y="140" text-anchor="middle" class="fg-t sm warm">越晚發現，修起來越貴</text>
<line x1="20" y1="152" x2="652" y2="152" class="fg-l warm"/><polygon points="660,152 652,147.5 652,156.5" class="fg-a warm"/>
<text x="20" y="176" class="fg-t sm">改設計圖：便宜</text>
<text x="660" y="176" text-anchor="end" class="fg-t sm">改上線中的系統：很貴</text>
</svg><figcaption>每個階段都只放一兩個便宜、準確的檢查。在設計階段發現信任邊界畫錯，是改一張圖；上線後才發現，是改資料結構、搬資料、通知使用者。</figcaption></figure>
<ul>
<li><b>需求</b>：不用自己發明。OWASP 的 ASVS（Application Security Verification Standard）把網站應用程式該做到的安全要求，分成三個等級、一條一條寫好了。挑出跟這個功能有關的幾條，貼進需求單。</li>
<li><b>設計</b>：新功能碰到新的信任邊界時，花一小時做威脅模型。</li>
<li><b>實作和審查</b>：程式碼審查時固定問幾題：輸入從哪裡來、誰能呼叫、出錯時預設是放行還是拒絕、有沒有新增機密。</li>
<li><b>測試</b>：靜態分析（SAST，例如 Semgrep、CodeQL）、相依套件掃描（第 5.7 課）、機密掃描，全部放進 CI，有問題就擋下合併。</li>
<li><b>部署</b>：檢查基礎設施的設定（例如有沒有對外公開的儲存桶），用政策即程式碼（policy as code）自動擋下明顯的錯誤。</li>
<li><b>營運</b>：監控、修補、事件應變演練，再把發現的問題回饋給需求。</li>
</ul>
<p>重點不是工具多，是<b>每個檢查都要便宜到大家願意天天跑</b>。一個要跑四十分鐘、誤報一大堆的掃描，兩週後就會被大家關掉。先從最少、最準的幾個開始，誤報率低，大家才會信它。</p>

<h3><span class="badge lv4">專家</span>八、公開事故的共同模式</h3>
<p>研究別人的事故，是最便宜的學費。下面幾起都有公開的調查報告或官方說明，這裡只講它們的形狀和教訓。你會發現，幾乎都不是什麼神奇的技術，而是某個基本功沒做到，加上影響範圍太大。</p>
<table>
<tr><th>事故</th><th>怎麼開始的</th><th>為什麼擴大</th><th>哪個基本功擋得住</th></tr>
<tr><td>2014 年 Code Spaces</td><td>雲端主控台的帳號被拿下</td><td>備份跟正式資源在同一個帳號裡，一起被刪光，公司因此結束營業</td><td>第二道驗證；備份放在另一個帳號，而且不能刪除</td></tr>
<tr><td>2017 年 Equifax</td><td>對外網站用的 Apache Struts 有已知漏洞，修補程式出來兩個多月還沒裝</td><td>內部缺乏分段，攻擊者待了兩個多月才被發現；約 1.47 億人的資料外洩</td><td>修補管理、資產清冊、網路分段、偵測</td></tr>
<tr><td>2019 年 Capital One</td><td>設定有誤的應用程式防火牆，讓伺服器替外人去讀雲端中繼資料服務（SSRF，第 5.2 課）</td><td>那台機器的角色權限太大，讀得到大量儲存桶；約一億人的資料外洩</td><td>IMDSv2、角色最小權限、限制對外連線</td></tr>
<tr><td>2020 年 SolarWinds</td><td>廠商的建置系統被入侵，惡意程式碼被編進正式簽章的更新檔</td><td>大約一萬八千個客戶裝了這個更新</td><td>保護建置管線、可驗證的建置、限制軟體的對外連線</td></tr>
<tr><td>2022 年 Uber</td><td>外包人員的密碼外洩，接著收到大量 MFA 推播請求，最後按了同意</td><td>內部共用資料夾的腳本裡寫死了管理員的帳號密碼</td><td>抗釣魚的 MFA 或數字比對（第 5.3 課）；機密不寫在程式碼裡（第 5.4 課）</td></tr>
</table>
<p>把這五起放在一起看，有三個模式一直重複：</p>
<ol>
<li><b>進來的路很普通</b>：被偷的密碼、沒修補的已知漏洞、設定錯誤。這就是上一課說的「把基本功做好，就能擋掉大部分的攻擊者」。</li>
<li><b>真正的災難發生在進來之後</b>：權限太大、機密放在讀得到的地方、網路沒有分段、備份跟正式環境綁在一起。這正是「假設已被入侵」要處理的事。</li>
<li><b>發現得太晚</b>：很多事故是外面的人通知的，不是自己的監控抓到的。</li>
</ol>
<h4>攻擊樹：從最值錢的資產往回推</h4>
<p>STRIDE 是從元件往外推。另一種方法是從目標往回推，叫<b>攻擊樹</b>（attack tree）。樹根寫一個你最怕的結果，例如「平台的錢被轉走」；下一層寫達成它的幾種條件（拿到管理員權限、拿到出金金鑰、讓伺服器多算錢給某個帳號）；每一個條件再往下拆，直到每片葉子都是一個具體的前提，例如「管理後台只靠密碼登入」。防守者畫攻擊樹，是為了找出<b>好幾條路共用的那片葉子</b>：如果三條路都要先拿到管理後台，管理後台的第二道驗證就是最划算的投資。</p>
<h4>其他你會聽到的方法</h4>
<ul>
<li><b>LINDDUN</b>：專門看隱私，例如個資能不能被串起來、能不能認出是誰。收集個資的系統用得到。</li>
<li><b>PASTA</b>：以業務風險為中心、步驟比較多的流程，大型組織比較常用。</li>
<li><b>DREAD</b>：早年微軟用來替威脅打分數的方法，因為太主觀，後來微軟自己也不太用了。知道它就好。</li>
</ul>
<p>方法不重要，重要的是四個問題有沒有被認真回答：我們在做什麼？可能出什麼事？我們打算怎麼辦？做得夠好嗎？</p>

<h3>九、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>威脅模型要資安專家才能做</td><td>最了解系統的是寫它的人。資安專家帶問題，開發者帶答案，一起做效果最好。</td></tr>
<tr><td>做一次就好</td><td>系統變了，模型就要跟著變。新入口、新資料、新第三方，都是重做的時機。</td></tr>
<tr><td>內部網路是安全的</td><td>內部的人、被攻破的機器、第三方腳本都在牆裡面。信任邊界不只畫在網路邊緣。</td></tr>
<tr><td>分數要算得很精確</td><td>1 到 5 分的粗分數就夠了。它的用處是排序和逼出討論，不是算出真正的機率。</td></tr>
<tr><td>買了 WAF 和掃描工具就安全了</td><td>工具抓的是已知的模式。授權設計錯誤、業務邏輯的漏洞，只有懂這個系統的人看得出來。</td></tr>
<tr><td>假設已被入侵，就代表預防不重要</td><td>兩個都要。它只是多問一題：預防失敗的時候，損失有多大？</td></tr>
</table>

<h3>十、跟你的工作連起來</h3>
<ul>
<li><b>前端（Vue、TypeScript）</b>：整個前端都在信任邊界外面。前端的檢查是為了使用者體驗，伺服器一定要再檢查一次。頁面上載入的第三方腳本，也是你的攻擊面。</li>
<li><b>遊戲（Cocos、Unity）</b>：用戶端裝在玩家的電腦或手機上，可以被拆開、改記憶體、改封包。輸贏、餘額、掉寶都要由伺服器決定，用戶端只負責表演。</li>
<li><b>後端（Node.js、Go）</b>：授權放在中央的中介層、每個服務用自己的資料庫帳號、把「被拒絕」寫成結構化日誌。這三件事做到，威脅模型裡一大半的 E 和 I 就有了著落。</li>
<li><b>Docker 和雲端</b>：每個容器、每個服務的身分和權限要分開，不要所有服務共用一份 <code>.env</code> 或同一個雲端角色。</li>
<li><b>日常開發</b>：在 pull request 範本裡加一欄「這個改動有沒有新增入口、新資料、新第三方？」勾了「有」，就花一小時做一個小小的威脅模型。</li>
</ul>

<h3>十一、面試會怎麼問</h3>
<p>這些題目在後端、DevOps、資安工程師的面試裡很常見。先自己講一遍（最好出聲講），再打開參考答案。</p>
<ol>
<li>「如果要你替一個新功能做威脅模型，你會怎麼做？」</li>
<li>「什麼是信任邊界？在一般的網站架構裡，你會把它畫在哪裡？」</li>
<li>「弱點和風險有什麼不同？掃描報告上 CVSS 9.8 的漏洞，一定要最先修嗎？」</li>
<li>「『假設已被入侵』是什麼意思？在架構上你會怎麼落實？」</li>
<li>「你會怎麼把資安檢查放進 CI/CD，又不讓開發變慢？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>先畫資料流程圖：外部實體、處理程序、資料儲存、資料流，再畫出信任邊界。接著對每一個穿過邊界的資料流和每一個元件跑 STRIDE，另外針對業務邏輯寫濫用案例。每個威脅用可能性和影響打分數，決定降低、避免、轉移或接受。要降低的，每一條都寫成可測試的需求，配上控制措施、自動化測試和警報。最後把模型存進程式碼庫，有新入口、新資料或新第三方時更新。</li>
<li>信任邊界是兩邊可信程度不同的那條線，資料跨過它就必須重新驗證身分、授權和內容。一般網站至少有：瀏覽器和伺服器之間（使用者完全控制瀏覽器）、應用程式和資料庫之間（每個服務只拿自己需要的權限）、你的系統和第三方之間（例如金流的通知要驗簽章），還有管理介面和一般介面之間。</li>
<li>弱點是一個缺陷；風險是這個缺陷在你的環境裡被利用的可能性乘上造成的影響。CVSS 是通用的嚴重程度，不知道你的系統。不一定最先修：如果它在一台不對外、沒有資料的機器上，風險可能比一個中等分數但在登入頁上的漏洞低。要放回威脅模型裡看它碰得到什麼資產、入口有多公開。</li>
<li>意思是設計時就假設某個元件會被攻破，然後把它造成的損失限制住。寬度上用最小權限、每個服務獨立的帳號和角色、網路分段、限制對外連線；長度上用短效憑證、日誌送離機器、偵測和緊急開關；影響上用業務限制，例如單日出金上限。檢驗方法是對每個元件問：它今晚被拿下，攻擊者拿得到什麼？</li>
<li>每個階段只放便宜又準的檢查：PR 時跑機密掃描和 SAST，只擋高信心的規則；相依套件掃描只擋有修補版本的嚴重漏洞，其他開成待辦；基礎設施用 policy as code 擋明顯錯誤。誤報要有人負責調整，掃描要快到幾分鐘內跑完。重的檢查，例如動態掃描，放在每晚或部署到測試環境後跑，不擋每一個 PR。</li>
</ol>
</details>

<h3>十二、練功題（做得出來才算真的懂）</h3>
<ol>
<li>替猜高低加一個「好友之間互轉金幣」的功能。畫出新增的資料流和信任邊界，用 STRIDE 列出至少四個威脅，每個寫一個控制措施。</li>
<li>替這三個威脅打分數，並決定處理方式：（甲）開發環境的資料庫可以從網際網路直接連，裡面只有假資料；（乙）客服人員看得到玩家完整的 email 和手機號碼；（丙）出金 API 沒有單日上限。</li>
<li>把「玩家只能看到自己的牌局紀錄」寫成一條可測試的需求，再寫出自動化測試要做的步驟。</li>
<li>假設你的 API 伺服器今晚被拿下。用你自己的系統（或猜高低）列出攻擊者能拿到的每一樣東西，再替每一樣寫一個縮小影響範圍的做法。</li>
<li>Code Spaces 的事故裡，哪一個設計上的改變，就足以讓公司活下來？為什麼？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>新的資料流是「玩家 A 對伺服器說：轉 X 給 B」，邊界在瀏覽器和 API 之間。S：用別人的工作階段轉走金幣，控制是敏感操作要求重新驗證或第二道驗證。T：金額填負數讓錢反向流動，控制是伺服器檢查金額大於零且不超過上限。R：玩家說沒轉過，控制是只能新增的轉帳紀錄。D 或邏輯濫用：同一筆轉帳同時送很多次，控制是原子更新加冪等鍵（第 5.2 課）。E：轉給自己的分身帳號洗錢，控制是單日上限、新帳號冷卻期和異常監控。</li>
<li>甲：可能性高（掃描器會找到）、影響低（假資料），但要確認裡面真的沒有正式資料的副本，也沒有能連回正式環境的密碼；大約 4×2，排進計畫，順手關掉公開存取。乙：可能性中（客服帳號被釣魚、內部濫用）、影響中高（個資外洩要通報），大約 3×4＝12，先修：預設遮罩，需要時再申請看完整資料並留紀錄。丙：影響最高，任何其他環節失守都會被放大，大約 3×5＝15，先修：加單日和單筆上限。</li>
<li>需求：「GET /rounds/:id 只在這筆牌局的 owner_id 等於目前工作階段的使用者時回 200，否則回 404。」測試步驟：建兩個測試帳號 A 和 B，各玩一局；用 A 的工作階段讀 A 的牌局，期望 200；用 A 的工作階段讀 B 的牌局，期望 404；不帶工作階段讀，期望 401。把它放進 CI。</li>
<li>每個人的答案不同，但通常會列到：環境變數裡的所有機密（換成每個服務自己的、由雲端角色取得的短效憑證）、資料庫的全部資料表（改成只授權需要的表）、可以連到的內部服務（網路分段）、可以送資料出去的外部網路（限制對外連線）、本機日誌（送離機器），以及它能呼叫的高風險操作（加金額上限和緊急開關）。</li>
<li>把備份放在另一個帳號、而且設成不可刪除。這樣主控台帳號被拿下時，正式環境會被破壞，但資料還能還原，公司能重建。第二道驗證能降低帳號被拿下的可能性，但只有獨立的備份能把「最慘的情況」從「全部消失」變成「停機幾天」。這就是假設已被入侵的思考方式。</li>
</ol>
</details>

<h3>十三、想再挖深</h3>
<ul>
<li><b>Adam Shostack《Threat Modeling: Designing for Security》</b>（Wiley，2014）：威脅建模的經典教科書，STRIDE、攻擊樹、怎麼在團隊裡推動都有。作者也是四個問題框架的主要推手。</li>
<li><b>Threat Modeling Manifesto</b>（<a href="https://www.threatmodelingmanifesto.org/">threatmodelingmanifesto.org</a>）：一頁就讀完，講威脅建模的價值和原則，適合拿去說服團隊。</li>
<li><b>OWASP Cheat Sheet Series</b>（<a href="https://cheatsheetseries.owasp.org/">cheatsheetseries.owasp.org</a>）：裡面的 Threat Modeling Cheat Sheet 是一份很實用的入門步驟。</li>
<li><b>OWASP ASVS</b>：寫安全需求的現成清單，三個等級，可以直接挑條目放進需求單。</li>
<li><b>OWASP Threat Dragon</b> 和 <b>Microsoft Threat Modeling Tool</b>：兩個免費的畫圖工具，畫資料流程圖時會自動提示可能的威脅。</li>
</ul>
` });
