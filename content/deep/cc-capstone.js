DEEP({ 'cc-capstone': `
<p>上一課的八個里程碑，能讓你做出一個能玩的猜高低。這一章要把它變成一個「專業的專案」：一張別人一看就懂的架構圖、一份有驗收標準和風險的里程碑計畫、一份測試計畫、一份效能預算、一條建置與部署管線，以及一張 code review 清單。最後一節講怎麼在面試時介紹它，還有審查的人到底在看什麼。這些文件本身不會讓遊戲更好玩，但它們決定了這個專案在別人眼中是「我寫過一個小遊戲」，還是「我能把一個專案從零帶到上線」。面試官、主管、半年後的你自己，要的都是後者。</p>

<h3><span class="badge lv1">基礎</span>一、從「作業」到「專案」：差在哪裡</h3>
<p>自己在後院蓋一間小木屋，可以邊蓋邊想：今天釘牆，明天覺得窗戶小了再挖大一點。蓋一棟大樓不行。建築師要先交出一整套圖：平面圖告訴大家每個房間在哪、管線怎麼走；施工進度表說先打地基、再立柱子；每一階段有驗收標準，沒過不能往下蓋；結構計算說這棟樓能承受多大的地震。不是因為建築師愛寫文件，而是因為很多人要照同一套圖做事，而且出事時要能知道是哪一步出的錯。</p>
<p>軟體專案的那套圖，大概是這幾份：</p>
<table>
<tr><th>文件</th><th>回答什麼問題</th><th>誰會看</th></tr>
<tr><td>架構圖</td><td>每個檔案負責什麼？誰可以依賴誰？</td><td>新同事、面試官、未來的你</td></tr>
<tr><td>里程碑計畫</td><td>先做什麼？怎樣才算做完？哪裡風險最高？</td><td>主管、你自己</td></tr>
<tr><td>測試計畫</td><td>哪些靠機器測、哪些靠人測？</td><td>團隊、測試人員</td></tr>
<tr><td>效能預算</td><td>多快、多小才算合格？</td><td>你、上線審核</td></tr>
<tr><td>建置與部署管線</td><td>一個 commit 怎麼變成玩家手上的版本？</td><td>DevOps、整個團隊</td></tr>
<tr><td>Code review 清單</td><td>合併之前要檢查什麼？</td><td>審查的人</td></tr>
<tr><td>README</td><td>我怎麼把它跑起來？</td><td>所有人，包括面試官</td></tr>
</table>
<p>猜高低是一個很小的遊戲，每份文件可能只要半頁。但正因為它小，你可以在一兩個週末裡把整套流程完整走一次。等你在工作上遇到大專案，這套東西你已經做過了。</p>

<h3><span class="badge lv1">基礎</span>二、架構圖：每個檔案住哪一層、誰可以 import 誰</h3>
<figure class="figure"><svg viewBox="0 0 680 324" class="fg" style="width:100%;max-width:680px" role="img" aria-label="猜高低的架構圖：畫面層有 CardView 與 GameView，流程層有 RoundFsm、GameController 與 GameNet 介面，規則與資料層有 GameModel 與 Rules、Deck；MockNet 和 Net 實作 GameNet 介面，config.ts 決定用哪一個">
<text x="280" y="24" text-anchor="middle" class="fg-t sm acc">遊戲本身</text>
<text x="565" y="24" text-anchor="middle" class="fg-t sm acc">外面的世界：設定、網路</text>
<text x="14" y="67" class="fg-t acc">畫面</text><text x="14" y="167" class="fg-t acc">流程</text><text x="14" y="261" class="fg-t acc">規則</text><text x="14" y="279" class="fg-t acc">與資料</text>
<rect x="120" y="38" width="150" height="50" rx="6" class="fg-b"/><text x="195" y="59" text-anchor="middle" class="fg-t">CardView.ts</text><text x="195" y="77" text-anchor="middle" class="fg-t sm">一張牌：顯示、翻牌</text>
<rect x="290" y="38" width="150" height="50" rx="6" class="fg-b"/><text x="365" y="59" text-anchor="middle" class="fg-t">GameView.ts</text><text x="365" y="77" text-anchor="middle" class="fg-t sm">畫畫面、回報點擊</text>
<rect x="460" y="38" width="210" height="50" rx="6" class="fg-b"/><text x="565" y="59" text-anchor="middle" class="fg-t">config.ts</text><text x="565" y="77" text-anchor="middle" class="fg-t sm">啟動時讀 config.json</text>
<line x1="290" y1="63" x2="278" y2="63" class="fg-l"/><polygon points="270,63 278,58.5 278,67.5" class="fg-a"/>
<rect x="120" y="138" width="150" height="50" rx="6" class="fg-b hot"/><text x="195" y="159" text-anchor="middle" class="fg-t">RoundFsm.ts</text><text x="195" y="177" text-anchor="middle" class="fg-t sm">五個狀態、轉換表</text>
<rect x="290" y="138" width="150" height="50" rx="6" class="fg-b hot"/><text x="365" y="159" text-anchor="middle" class="fg-t acc">GameController.ts</text><text x="365" y="177" text-anchor="middle" class="fg-t sm">接線、決定順序</text>
<rect x="460" y="138" width="210" height="50" rx="6" class="fg-b alt"/><text x="565" y="159" text-anchor="middle" class="fg-t">GameNet 介面</text><text x="565" y="177" text-anchor="middle" class="fg-t sm">request()、pushes</text>
<line x1="365" y1="138" x2="365" y2="96" class="fg-l"/><polygon points="365,88 360.5,96 369.5,96" class="fg-a"/>
<line x1="290" y1="163" x2="278" y2="163" class="fg-l"/><polygon points="270,163 278,158.5 278,167.5" class="fg-a"/>
<line x1="440" y1="163" x2="452" y2="163" class="fg-l"/><polygon points="460,163 452,158.5 452,167.5" class="fg-a"/>
<line x1="565" y1="88" x2="565" y2="130" class="fg-l dash"/><polygon points="565,138 560.5,130 569.5,130" class="fg-a"/>
<text x="573" y="118" class="fg-t sm">決定用哪個實作</text>
<path d="M330 188 V212 H195 V230" class="fg-l"/><polygon points="195,238 190.5,230 199.5,230" class="fg-a"/>
<text x="262" y="228" text-anchor="middle" class="fg-t sm">呼叫、讀狀態</text>
<rect x="120" y="238" width="150" height="50" rx="6" class="fg-b"/><text x="195" y="259" text-anchor="middle" class="fg-t">GameModel.ts</text><text x="195" y="277" text-anchor="middle" class="fg-t sm">狀態，不碰節點</text>
<rect x="290" y="238" width="150" height="50" rx="6" class="fg-b"/><text x="365" y="259" text-anchor="middle" class="fg-t">Rules.ts＋Deck.ts</text><text x="365" y="277" text-anchor="middle" class="fg-t sm">純函式：判斷、洗牌</text>
<rect x="460" y="238" width="95" height="50" rx="6" class="fg-b"/><text x="507" y="259" text-anchor="middle" class="fg-t">MockNet.ts</text><text x="507" y="277" text-anchor="middle" class="fg-t sm">本機規則</text>
<rect x="575" y="238" width="95" height="50" rx="6" class="fg-b"/><text x="622" y="259" text-anchor="middle" class="fg-t">Net.ts</text><text x="622" y="277" text-anchor="middle" class="fg-t sm">WebSocket</text>
<line x1="460" y1="263" x2="448" y2="263" class="fg-l"/><polygon points="440,263 448,258.5 448,267.5" class="fg-a"/>
<line x1="507" y1="238" x2="507" y2="196" class="fg-l dash"/><polygon points="507,188 502.5,196 511.5,196" class="fg-a"/>
<line x1="622" y1="238" x2="622" y2="196" class="fg-l dash"/><polygon points="622,188 617.5,196 626.5,196" class="fg-a"/>
<text x="565" y="218" text-anchor="middle" class="fg-t sm">實作介面</text>
<text x="340" y="314" text-anchor="middle" class="fg-t sm">實線箭頭＝import 的方向；虛線＝實作介面。最下面一排不 import 任何畫面</text>
</svg><figcaption>箭頭從「使用的人」指向「被使用的東西」。GameController 在正中間，什麼都認得；越往下、越往外的檔案，認得的東西越少。</figcaption></figure>
<p>這張圖背後有四條規則。每一條都有理由，面試時被問「為什麼這樣切」，就是在問這些理由：</p>
<ol>
<li><b>依賴只往一個方向</b>：View 不 import Controller，Model 不 import 任何畫面。所以你可以換掉整個畫面（例如做一個橫式版本），Model 一行都不用改；也可以在沒有編輯器的 Node.js 裡測 Model。</li>
<li><b>網路藏在介面後面</b>：Controller 只認得 <code>GameNet</code>，不知道背後是模擬伺服器還是真的 WebSocket。換伺服器不用動遊戲。</li>
<li><b>規則只住在一個地方</b>：里程碑 7 之後，「猜對了沒」只由伺服器決定。再進一步，把判斷寫成一個純函式 <code>Rules.ts</code>，模擬伺服器用它，將來用 Node.js 寫的真伺服器也 import 同一個檔案。兩邊永遠不會規則不一致，而且這個函式最好測。</li>
<li><b>設定在最外圈</b>：<code>config.ts</code> 只在啟動時讀一次，決定用哪個實作。程式裡其他地方不應該到處問「現在是不是模擬模式」。</li>
</ol>
<p>規則寫在文件裡，三個月後就會被忘記。所以讓機器檢查它：在 CI 裡加一行，Model 那個資料夾只要出現從 <code>'cc'</code> import 的程式碼，管線就失敗。</p>
<pre><code>assets/scripts/
  model/   GameModel.ts  Rules.ts  Deck.ts  Emitter.ts
  flow/    GameController.ts  RoundFsm.ts
  view/    GameView.ts  CardView.ts
  net/     GameNet.ts  Net.ts  MockNet.ts
  config.ts  BuildInfo.ts
tests/     GameModel.test.ts  RoundFsm.test.ts
           Rules.test.ts
</code></pre>
<p>注意 <code>tests/</code> 放在 <code>assets/</code> 外面。Cocos 只編譯 <code>assets/</code> 裡的腳本，所以測試檔不會被打包進遊戲，編輯器也不會去管它。</p>

<h3><span class="badge lv2">進階</span>三、一次猜測，走過整個系統</h3>
<p>架構圖是靜態的。要確定它真的行得通，用一個具體的動作走一遍：玩家在第 3 局、目前的牌是 7、分數 4，按下 Higher。</p>
<figure class="figure"><svg viewBox="0 0 680 392" class="fg" style="width:100%;max-width:680px" role="img" aria-label="一次猜測的循序圖：View 送出 guess，Controller 轉到 revealing 並向 MockNet 送出請求，約 300 毫秒後收到回覆，交給 GameModel，Model 發出 changed，Controller 叫 View 翻牌，翻完回報 done，Controller 轉回 guessing，總共約 600 毫秒">
<rect x="50" y="10" width="120" height="42" rx="6" class="fg-b alt"/><text x="110" y="28" text-anchor="middle" class="fg-t">View</text><text x="110" y="44" text-anchor="middle" class="fg-t sm">按鈕、CardView</text>
<rect x="210" y="10" width="120" height="42" rx="6" class="fg-b hot"/><text x="270" y="28" text-anchor="middle" class="fg-t">Controller</text><text x="270" y="44" text-anchor="middle" class="fg-t sm">＋RoundFsm</text>
<rect x="370" y="10" width="120" height="42" rx="6" class="fg-b"/><text x="430" y="28" text-anchor="middle" class="fg-t">GameModel</text><text x="430" y="44" text-anchor="middle" class="fg-t sm">只存狀態</text>
<rect x="530" y="10" width="120" height="42" rx="6" class="fg-b alt"/><text x="590" y="28" text-anchor="middle" class="fg-t">MockNet</text><text x="590" y="44" text-anchor="middle" class="fg-t sm">規則在這裡</text>
<line x1="110" y1="52" x2="110" y2="384" class="fg-l dim dash"/><line x1="270" y1="52" x2="270" y2="384" class="fg-l dim dash"/><line x1="430" y1="52" x2="430" y2="384" class="fg-l dim dash"/><line x1="590" y1="52" x2="590" y2="384" class="fg-l dim dash"/>
<text x="8" y="84" class="fg-t sm">0 ms</text>
<text x="190" y="74" text-anchor="middle" class="fg-t sm mono">guess('higher')</text>
<line x1="110" y1="80" x2="262" y2="80" class="fg-l"/><polygon points="270,80 262,75.5 262,84.5" class="fg-a"/>
<path d="M270 102 H296 V116 H278" class="fg-l"/><polygon points="270,116 278,111.5 278,120.5" class="fg-a"/>
<text x="302" y="113" class="fg-t sm mono">go('revealing')</text>
<text x="510" y="138" text-anchor="middle" class="fg-t sm mono">request('guess')</text>
<line x1="270" y1="144" x2="582" y2="144" class="fg-l alt"/><polygon points="590,144 582,139.5 582,148.5" class="fg-a alt"/>
<text x="582" y="164" text-anchor="end" class="fg-t sm">模擬延遲 300 ms</text>
<text x="510" y="180" text-anchor="middle" class="fg-t sm">card 11、對、5 分</text>
<line x1="590" y1="186" x2="278" y2="186" class="fg-l alt dash"/><polygon points="270,186 278,181.5 278,190.5" class="fg-a alt"/>
<text x="8" y="190" class="fg-t sm">≈ 300 ms</text>
<text x="350" y="212" text-anchor="middle" class="fg-t sm mono">applyReveal(…)</text>
<line x1="270" y1="218" x2="422" y2="218" class="fg-l"/><polygon points="430,218 422,213.5 422,222.5" class="fg-a"/>
<text x="350" y="240" text-anchor="middle" class="fg-t sm">changed 事件</text>
<line x1="430" y1="246" x2="278" y2="246" class="fg-l dash"/><polygon points="270,246 278,241.5 278,250.5" class="fg-a"/>
<text x="190" y="270" text-anchor="middle" class="fg-t sm mono">flip(11, done)</text>
<line x1="270" y1="276" x2="118" y2="276" class="fg-l on"/><polygon points="110,276 118,271.5 118,280.5" class="fg-a on"/>
<rect x="104" y="282" width="12" height="56" rx="3" class="fg-b hot"/>
<text x="8" y="314" class="fg-t sm">翻牌 0.3 s</text>
<text x="190" y="338" text-anchor="middle" class="fg-t sm mono">done()</text>
<line x1="110" y1="344" x2="262" y2="344" class="fg-l on dash"/><polygon points="270,344 262,339.5 262,348.5" class="fg-a on"/>
<text x="8" y="348" class="fg-t sm">≈ 600 ms</text>
<path d="M270 362 H296 V376 H278" class="fg-l"/><polygon points="270,376 278,371.5 278,380.5" class="fg-a"/>
<text x="302" y="373" class="fg-t sm mono">go('guessing')</text>
</svg><figcaption>從按下到可以再猜，大約 600 毫秒：一半在等伺服器，一半在播翻牌。整段時間裡，狀態都是 revealing，所以中間的任何點擊都會被擋掉。</figcaption></figure>
<ol>
<li><b>0 ms</b>：GameView 只發出 <code>guess</code>，什麼都不判斷。Controller 的防護條件先確認現在是 guessing，然後 <code>go('revealing')</code>：guessing 的 exit 關掉按鈕、停掉倒數。從這一刻起，第二下點擊會被擋掉。</li>
<li><b>送出請求</b>：revealing 的 enter 送出 <code>{ guess: 'higher', round: 3, seq: 5 }</code>。局號和第幾次猜測一起送，伺服器才能認出重送的請求，同一個猜測只算一次（冪等）。請求帶著 8 秒的逾時。</li>
<li><b>約 300 ms</b>：模擬伺服器用 <code>Rules.ts</code> 判斷 11 &gt; 7，回覆 <code>{ card: 11, correct: true, score: 5, over: false }</code>。</li>
<li><b>套用</b>：Controller 呼叫 <code>model.applyReveal(11, true, 5)</code>。Model 不判斷對錯，只把伺服器說的存起來，再發出 <code>changed</code>，分數標籤跟著重畫。</li>
<li><b>翻牌</b>：Controller 叫 CardView 翻到 11。翻牌的 0.3 秒裡，狀態還是 revealing。</li>
<li><b>約 600 ms</b>：翻完呼叫 <code>done()</code>，Controller 看回覆裡 <code>over</code> 是 false，就 <code>go('guessing')</code>，按鈕重新打開、倒數重新開始。</li>
</ol>
<p>走一遍的價值，在於每一步都能問「如果這裡出錯呢」：請求逾時怎麼辦（revealing 收到逾時，轉成「重新連線中」，再用快照同步）？翻牌時斷線怎麼辦（翻完照樣轉換，但下一個請求會失敗，走重連）？伺服器回覆時，玩家已經切到背景怎麼辦？每一個問題，都應該在里程碑計畫或測試計畫裡有一個答案。</p>

<h3><span class="badge lv2">進階</span>四、里程碑計畫：順序、估時、風險</h3>
<p>上一課給了八個里程碑的內容。專業的計畫還要再加三樣東西：每一個要花多久、哪幾個風險最高，以及什麼時候可以拿出來給人看。</p>
<figure class="figure"><svg viewBox="0 0 680 334" class="fg" style="width:100%;max-width:680px" role="img" aria-label="八個里程碑的時程圖：每個里程碑依序排列，狀態機與模擬伺服器標為高風險，最後留兩天緩衝；第 5、9、10.5 天各有一個可以展示的時間點">
<text x="150" y="24" text-anchor="middle" class="fg-t sm">0</text><text x="226" y="24" text-anchor="middle" class="fg-t sm">2</text><text x="302" y="24" text-anchor="middle" class="fg-t sm">4</text><text x="378" y="24" text-anchor="middle" class="fg-t sm">6</text><text x="454" y="24" text-anchor="middle" class="fg-t sm">8</text><text x="530" y="24" text-anchor="middle" class="fg-t sm">10</text><text x="606" y="24" text-anchor="middle" class="fg-t sm">12 天</text>
<line x1="150" y1="29" x2="150" y2="34" class="fg-l"/><line x1="226" y1="29" x2="226" y2="34" class="fg-l"/><line x1="302" y1="29" x2="302" y2="34" class="fg-l"/><line x1="378" y1="29" x2="378" y2="34" class="fg-l"/><line x1="454" y1="29" x2="454" y2="34" class="fg-l"/><line x1="530" y1="29" x2="530" y2="34" class="fg-l"/><line x1="606" y1="29" x2="606" y2="34" class="fg-l"/>
<text x="10" y="49" class="fg-t">1 場景與版面</text><rect x="150" y="36" width="19" height="18" rx="3" class="fg-b"/><text x="175" y="49" class="fg-t sm">0.5 天</text>
<text x="10" y="75" class="fg-t">2 卡牌 Prefab</text><rect x="169" y="62" width="38" height="18" rx="3" class="fg-b"/><text x="213" y="75" class="fg-t sm">1 天</text>
<text x="10" y="101" class="fg-t">3 牌堆 Model</text><rect x="207" y="88" width="38" height="18" rx="3" class="fg-b"/><text x="251" y="101" class="fg-t sm">1 天</text>
<text x="10" y="127" class="fg-t">4 狀態機</text><rect x="245" y="114" width="57" height="18" rx="3" class="fg-b warm"/><text x="308" y="127" class="fg-t sm warm">1.5 天，風險高</text>
<text x="10" y="153" class="fg-t">5 輸入</text><rect x="302" y="140" width="38" height="18" rx="3" class="fg-b"/><text x="346" y="153" class="fg-t sm">1 天</text>
<text x="10" y="179" class="fg-t">6 補間動畫</text><rect x="340" y="166" width="57" height="18" rx="3" class="fg-b"/><text x="403" y="179" class="fg-t sm">1.5 天</text>
<text x="10" y="205" class="fg-t">7 模擬伺服器</text><rect x="397" y="192" width="95" height="18" rx="3" class="fg-b warm"/><text x="498" y="205" class="fg-t sm warm">2.5 天，風險高</text>
<text x="10" y="231" class="fg-t">8 建置與部署</text><rect x="492" y="218" width="57" height="18" rx="3" class="fg-b"/><text x="555" y="231" class="fg-t sm">1.5 天</text>
<text x="10" y="257" class="fg-t">緩衝</text><rect x="549" y="244" width="76" height="18" rx="3" class="fg-l dash"/><text x="587" y="257" text-anchor="middle" class="fg-t sm">2 天</text>
<circle cx="340" cy="284" r="6" class="fg-lamp on"/><circle cx="492" cy="284" r="6" class="fg-lamp on"/><circle cx="549" cy="284" r="6" class="fg-lamp on"/>
<text x="340" y="306" text-anchor="middle" class="fg-t sm acc">離線可玩</text>
<text x="486" y="306" text-anchor="end" class="fg-t sm acc">連伺服器可玩</text>
<text x="555" y="306" class="fg-t sm acc">手機上線</text>
<rect x="150" y="318" width="14" height="10" rx="2" class="fg-b warm"/><text x="170" y="327" class="fg-t sm">風險高：會改動整個流程</text>
<rect x="330" y="318" width="14" height="10" rx="2" class="fg-l dash"/><text x="350" y="327" class="fg-t sm">緩衝：留給沒料到的事</text>
</svg><figcaption>天數是一個人、下班時間做的粗估，重點不在數字準不準，而在於你事先知道哪兩段最可能超時，並把三個「可以給人看」的時間點標出來。</figcaption></figure>
<h4>為什麼是第 4 和第 7 個風險最高</h4>
<p>大部分里程碑只是「多加一個東西」。第 4 個不一樣，它把整個遊戲的流程改成由狀態機推動，之前寫的每一段點擊處理都要重接；第 7 個也不一樣，它把「真相」從用戶端搬到伺服器，所有東西從同步變成非同步，還多了斷線、逾時、重送這些全新的失敗方式。改動範圍大、而且你以前沒做過，就是高風險的定義。</p>
<p>對付高風險，有一個專業的做法叫<b>探路</b>（spike）：在正式做之前，花一段固定的時間（例如兩小時），寫一個用完就丟的小實驗，只回答一個問題，例如「斷線之後用快照 <code>jump()</code> 回去，enter 能不能只靠資料重建畫面？」。探路的產出是答案，不是程式碼。它讓你在估時之前就知道最難的部分有多難。</p>
<h4>驗收標準要能被檢查</h4>
<p>「狀態機做好了」不是驗收標準，因為沒有人能證明它是錯的。好的驗收標準是一句可以被檢查的話，最好附上證據：</p>
<table>
<tr><th>里程碑</th><th>驗收標準</th><th>證據</th></tr>
<tr><td>1 場景與版面</td><td>視窗在 9:16 到 16:9 之間任意改變時，分數和按鈕完整可見、互不重疊</td><td>兩個比例的截圖</td></tr>
<tr><td>2 卡牌 Prefab</td><td>傳入 1、7、13，顯示 A、7、K；用 <code>instantiate()</code> 建立的牌看得到</td><td>截圖</td></tr>
<tr><td>3 牌堆 Model</td><td>52 張、每種 4 張；牌堆 [3, 9, 5] 猜 higher 得 1 分；點數相同算錯</td><td>單元測試全過</td></tr>
<tr><td>4 狀態機</td><td>5 &times; 5 共 25 組轉換，允許的 8 組回傳 true，其餘回傳 false 並印出警告</td><td>單元測試全過</td></tr>
<tr><td>5 輸入</td><td>1 秒內連點 20 次，最多加 1 分；revealing 中點擊無效；guessing 10 秒不動就結束</td><td>日誌或錄影</td></tr>
<tr><td>6 補間動畫</td><td>快速玩 60 秒後，沒有牌停在縮放 0；前後節點數相同</td><td>兩次節點數</td></tr>
<tr><td>7 模擬伺服器</td><td>延遲 3 秒時什麼都點不了；guessing 中斷線，重連後狀態和分數正確；同一個猜測送兩次只算一次</td><td>單元測試＋操作紀錄</td></tr>
<tr><td>8 建置與部署</td><td>手機上可玩；改牌背顏色重新部署後，一般重新整理就看到新版；效能預算全部達標</td><td>網址＋預算表</td></tr>
</table>
<p>除了各自的標準，每個里程碑還共用一份<b>完成的定義</b>（definition of done）：驗收標準通過、所有測試通過、<code>tsc --noEmit</code> 零錯誤、真機上跑過一次、commit 訊息說得出做了什麼和為什麼、README 跟著更新。少一項就不算完成。</p>

<h3><span class="badge lv3">專業</span>五、測試計畫：哪些交給機器，哪些交給人</h3>
<figure class="figure"><svg viewBox="0 0 640 290" class="fg" style="width:100%;max-width:640px" role="img" aria-label="測試金字塔：底層是大量快速的單元測試，中間是少量整合測試，頂端是幾個端對端冒煙測試；另外每次發版在真機上跑一份手動清單">
<polygon points="200,20 260,90 140,90" class="fg-b warm"/>
<polygon points="140,90 260,90 320,160 80,160" class="fg-b alt"/>
<polygon points="80,160 320,160 380,230 20,230" class="fg-b hot"/>
<text x="200" y="76" text-anchor="middle" class="fg-t sm">E2E</text>
<text x="200" y="131" text-anchor="middle" class="fg-t">整合</text>
<text x="200" y="201" text-anchor="middle" class="fg-t acc">單元測試</text>
<line x1="238" y1="62" x2="390" y2="62" class="fg-l dim"/>
<text x="400" y="46" class="fg-t">冒煙測試（Playwright）</text><text x="400" y="64" class="fg-t sm">打開預備網址、出畫面、零錯誤</text><text x="400" y="80" class="fg-t sm">幾個，幾分鐘</text>
<line x1="296" y1="132" x2="390" y2="132" class="fg-l dim"/>
<text x="400" y="118" class="fg-t">整合測試</text><text x="400" y="136" class="fg-t sm">Controller＋MockNet：連點、斷線</text><text x="400" y="152" class="fg-t sm">十幾個，在 Debug 建置裡跑</text>
<line x1="356" y1="202" x2="390" y2="202" class="fg-l dim"/>
<text x="400" y="188" class="fg-t">單元測試（Vitest）</text><text x="400" y="206" class="fg-t sm">Model、RoundFsm、Rules、洗牌</text><text x="400" y="222" class="fg-t sm">幾十個，1 秒內跑完</text>
<rect x="20" y="246" width="600" height="34" rx="6" class="fg-b"/>
<text x="320" y="268" text-anchor="middle" class="fg-t sm">手動：真機清單（舊 iPhone、Android、切背景、斷網），每次發版跑一次</text>
</svg><figcaption>越底層，測試越多、越快、越便宜，壞掉時也越容易知道是哪一行；越上層，越接近玩家真正的體驗，但越慢、越容易因為不相干的原因失敗。</figcaption></figure>
<h4>單元測試：先讓 Model 離開 Cocos</h4>
<p>GameModel 原本用 <code>'cc'</code> 的 <code>EventTarget</code> 發事件，這一行就讓它在 Node.js 裡跑不起來。換成一個十來行的自製發射器，Model 就徹底跟引擎無關了：</p>
<pre><code>// model/Emitter.ts：不 import 'cc'，所以 Node.js 也能跑
type Fn = (...args: any[]) =&gt; void;
export class Emitter {
  private list: { type: string; fn: Fn; target?: unknown }[] = [];
  on(type: string, fn: Fn, target?: unknown) { this.list.push({ type, fn, target }); }
  off(type: string, fn: Fn, target?: unknown) {
    this.list = this.list.filter((l) =&gt; !(l.type === type &amp;&amp; l.fn === fn &amp;&amp; l.target === target));
  }
  targetOff(target: unknown) { this.list = this.list.filter((l) =&gt; l.target !== target); }
  emit(type: string, ...args: unknown[]) {
    this.list.filter((l) =&gt; l.type === type).forEach((l) =&gt; l.fn.apply(l.target, args));
  }
}
</code></pre>
<p>它的方法名稱和用法跟 <code>EventTarget</code> 一樣，所以 View 和 Controller 那邊一行都不用改。接著用 Vitest（一個跟 Vite 同家族的測試工具）寫測試。測試的內容，就是驗收標準換成程式碼：</p>
<pre><code>import { describe, it, expect } from 'vitest';
import { GameModel } from '../assets/scripts/model/GameModel';

describe('GameModel', () =&gt; {
  it('scores right guesses and ends on an empty deck', () =&gt; {
    const m = new GameModel();
    m.newGame([3, 9, 5]);
    m.guess('higher');                       // 9 &gt; 3
    expect([m.current, m.score, m.over]).toEqual([9, 1, false]);
    m.guess('lower');                        // 5 &lt; 9, the deck is now empty
    expect([m.current, m.score, m.over]).toEqual([5, 2, true]);
  });
  it('treats an equal card as wrong', () =&gt; {
    const m = new GameModel();
    m.newGame([7, 7]);
    m.guess('higher');
    expect([m.score, m.over]).toEqual([0, true]);
  });
});
</code></pre>
<p>（里程碑 7 之後，判斷搬到了 <code>Rules.ts</code>，同樣的案例改成測 <code>Rules</code> 和模擬伺服器，測試的內容幾乎不變。）</p>
<p>狀態機的轉換表，最適合用「把所有組合跑一遍」的方式測，因為 5 個狀態只有 25 種組合：</p>
<pre><code>import { it, expect } from 'vitest';
import { RoundFsm, Phase } from '../assets/scripts/flow/RoundFsm';

const phases: Phase[] = ['waiting', 'dealing', 'guessing', 'revealing', 'result'];
const allowed = new Set(['waiting&gt;dealing', 'dealing&gt;guessing', 'dealing&gt;waiting', 'guessing&gt;revealing',
  'guessing&gt;result', 'revealing&gt;guessing', 'revealing&gt;result', 'result&gt;waiting']);
const noop = { enter() {}, exit() {} };

it('allows exactly the transitions in the table', () =&gt; {
  for (const a of phases) for (const b of phases) {
    const f = new RoundFsm({ waiting: noop, dealing: noop, guessing: noop, revealing: noop, result: noop });
    f.jump(a);
    expect(f.go(b)).toBe(allowed.has(a + '&gt;' + b));
  }
});
</code></pre>
<h4>隨機性也能測</h4>
<p>洗牌公不公平，看程式碼很難看出來，但可以用統計檢查。把洗牌寫成可以傳入任何陣列的 <code>shuffle()</code>，拿 [1, 2, 3] 洗 60,000 次。三張牌有 6 種排列，公平的話每種應該出現約 10,000 次。每種次數的標準差是 &radic;(60000 &times; 1/6 &times; 5/6) &asymp; 91，所以容許範圍設成 10,000 &plusmn; 400（大約 4.4 個標準差），公平的洗牌幾乎不可能誤判失敗。</p>
<p>反過來，<code>sort(() =&gt; Math.random() - 0.5)</code> 這種寫法一定抓得到：排序三個元素只會做少數幾次比較，每次比較等於擲一次硬幣，所以每種排列的機率只能是 1/8、1/4 這類數字，不可能剛好是 1/6。偏差至少是 1/6 − 1/8 = 1/24，60,000 次裡就是 2,500 次，遠遠超出 400。</p>
<p>另一個好習慣：讓 <code>shuffle()</code> 接受一個亂數函式當參數，預設是 <code>Math.random</code>。測試時傳一個固定種子的亂數產生器進去，同一個種子永遠洗出同一副牌，「第 37 局才會出現的 bug」就能每次重現。</p>
<h4>冒煙測試：上預備環境之後的第一道關</h4>
<p>冒煙測試（smoke test）不測細節，只確認「打開來沒有冒煙」：頁面載得起來、畫面出得來、沒有錯誤、沒有載入失敗的檔案。用 Playwright 讓一個真的瀏覽器去開預備環境的網址：</p>
<pre><code>import { test, expect } from '@playwright/test';

test('the build loads with no errors and no missing files', async ({ page }) =&gt; {
  const problems: string[] = [];
  page.on('console', (m) =&gt; { if (m.type() === 'error') problems.push(m.text()); });
  page.on('response', (r) =&gt; { if (r.status() &gt;= 400) problems.push(r.status() + ' ' + r.url()); });
  await page.goto(process.env.GAME_URL!);
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForTimeout(5000);           // 給首場景時間載完
  expect(problems).toEqual([]);
});
</code></pre>
<p>這一個測試，就能抓到建置那一課講的大部分部署事故：漏傳的檔案、錯的上傳順序、設定檔讀不到。想測得更深（例如自動玩一局），可以只在 Debug 建置裡，把狀態機和 Model 掛在 <code>window</code> 上給測試讀，正式建置裡不存在。</p>
<h4>手動清單：機器測不到的</h4>
<table>
<tr><th>檢查</th><th>為什麼機器測不到</th></tr>
<tr><td>支援的最舊 iPhone 上玩 10 局</td><td>記憶體上限、Safari 的行為，只有真機有</td></tr>
<tr><td>中階 Android 上玩 10 局</td><td>顯示晶片和壓縮貼圖格式的差異</td></tr>
<tr><td>guessing 時切到別的 App，30 秒後回來</td><td>背景時計時器和連線的行為，依系統而定</td></tr>
<tr><td>guessing 時開飛航模式 10 秒再關</td><td>真實的斷線和重連</td></tr>
<tr><td>一局玩到一半時旋轉手機</td><td>版面重排和 Widget 的實際效果</td></tr>
<tr><td>有瀏海、有圓角的螢幕</td><td>安全區域會不會蓋到按鈕</td></tr>
<tr><td>第一次點擊之後有沒有聲音</td><td>行動瀏覽器要求使用者先互動，才允許播放聲音</td></tr>
<tr><td>上線新版後，一般重新整理</td><td>快取設定的實際效果</td></tr>
<tr><td>文字和細邊在壓縮貼圖下的畫質</td><td>「看起來對不對」只有人能判斷</td></tr>
</table>

<h3><span class="badge lv3">專業</span>六、效能預算：先講好什麼叫「夠快」</h3>
<p>沒有預算的效能討論，最後都會變成「我覺得還好」。預算是一組事先寫下來的數字，加上量它的方法和時機。超過了，就跟測試失敗一樣，不能上線，除非有人明確決定接受。</p>
<table>
<tr><th>項目</th><th>預算（起點，依玩家調整）</th><th>怎麼量</th><th>什麼時候量</th></tr>
<tr><td>首包傳輸量（壓縮後）</td><td>2 MB</td><td>CI 算引擎、main、首場景的 gzip 大小</td><td>每次建置，自動</td></tr>
<tr><td>第一幀時間</td><td>中階 Android 和最舊 iPhone 都在 3 秒內</td><td>真機，4G 或降速</td><td>每次發版</td></tr>
<tr><td>遊戲中的幀時間</td><td>95% 的幀在 16.7 ms 內</td><td>Performance 面板錄 30 秒</td><td>每次發版</td></tr>
<tr><td>桌面的 draw call</td><td>10 以內</td><td>統計面板</td><td>每次改到畫面</td></tr>
<tr><td>50 局後的 JS heap 成長</td><td>5 MB 以內，節點數不變</td><td>前後各拍一張快照</td><td>每次發版</td></tr>
<tr><td>貼圖顯示記憶體</td><td>64 MB 以內</td><td>統計面板的 GFX Texture Mem</td><td>每次加了美術資源</td></tr>
</table>
<p>「95% 的幀」這種寫法叫 p95。只看平均會騙人：99 幀都是 10 ms、1 幀是 200 ms，平均才 11.9 ms，但玩家每幾秒就感覺到一次明顯的卡頓。</p>
<figure class="figure"><svg viewBox="0 0 680 262" class="fg" style="width:100%;max-width:680px" role="img" aria-label="效能預算對照：首包、Android 第一幀、幀時間、draw call、heap 成長都在預算內，只有舊 iPhone 的第一幀 3.4 秒超出 3 秒的預算">
<text x="170" y="22" class="fg-t sm">軌道的右端＝預算；綠條＝實測；橘條＝超出預算</text>
<text x="10" y="54" class="fg-t">首包傳輸量</text><rect x="170" y="42" width="350" height="16" rx="3" class="fg-b"/><rect x="170" y="45" width="254" height="10" rx="2" class="fg-b hot"/><line x1="520" y1="36" x2="520" y2="64" class="fg-l"/><text x="580" y="54" class="fg-t sm">1.45 / 2 MB</text>
<text x="10" y="92" class="fg-t">第一幀 Android</text><rect x="170" y="80" width="350" height="16" rx="3" class="fg-b"/><rect x="170" y="83" width="303" height="10" rx="2" class="fg-b hot"/><line x1="520" y1="74" x2="520" y2="102" class="fg-l"/><text x="580" y="92" class="fg-t sm">2.6 / 3 s</text>
<text x="10" y="130" class="fg-t">第一幀 舊 iPhone</text><rect x="170" y="118" width="350" height="16" rx="3" class="fg-b"/><rect x="170" y="121" width="397" height="10" rx="2" class="fg-b warm"/><line x1="520" y1="112" x2="520" y2="140" class="fg-l"/><text x="580" y="130" class="fg-t sm warm">3.4 / 3 s</text>
<text x="10" y="168" class="fg-t">幀時間 p95</text><rect x="170" y="156" width="350" height="16" rx="3" class="fg-b"/><rect x="170" y="159" width="296" height="10" rx="2" class="fg-b hot"/><line x1="520" y1="150" x2="520" y2="178" class="fg-l"/><text x="580" y="168" class="fg-t sm">14.1 / 16.7 ms</text>
<text x="10" y="206" class="fg-t">桌面 draw call</text><rect x="170" y="194" width="350" height="16" rx="3" class="fg-b"/><rect x="170" y="197" width="210" height="10" rx="2" class="fg-b hot"/><line x1="520" y1="188" x2="520" y2="216" class="fg-l"/><text x="580" y="206" class="fg-t sm">6 / 10</text>
<text x="10" y="244" class="fg-t">50 局 heap 成長</text><rect x="170" y="232" width="350" height="16" rx="3" class="fg-b"/><rect x="170" y="235" width="84" height="10" rx="2" class="fg-b hot"/><line x1="520" y1="226" x2="520" y2="254" class="fg-l"/><text x="580" y="244" class="fg-t sm">1.2 / 5 MB</text>
</svg><figcaption>一個範例：五項達標，一項超標。把預算畫成這樣放進 README 或發版紀錄，誰都看得出這一版能不能上、卡在哪裡。</figcaption></figure>
<p>舊 iPhone 第一幀超標 0.4 秒，該怎麼辦？專業的回答不是「差不多就好」，也不是「全部重做」，而是：查出是哪一段（建置那一課講的關鍵路徑）、評估修它要多久、看這種機型佔玩家多少比例，然後由負責的人<b>明確</b>決定「這一版先上、下一版修到 3 秒內」或「修完再上」，並且寫下來。預算可以調，但只能有理由地、公開地調，不能默默放寬。</p>

<h3><span class="badge lv3">專業</span>七、建置與部署管線</h3>
<p>建置那一課已經把每個環節拆開講過了。在專案計畫裡，它被畫成一條有關卡的管線：</p>
<figure class="figure"><svg viewBox="0 0 680 250" class="fg" style="width:100%;max-width:680px" role="img" aria-label="建置與部署管線：推上 git、檢查、Cocos 建置、預算檢查、預備環境冒煙測試、真機清單、同一份產物上正式；出事時回滾到上一版入口">
<rect x="20" y="30" width="140" height="60" rx="6" class="fg-b"/><text x="90" y="54" text-anchor="middle" class="fg-t">① 推上 git</text><text x="90" y="74" text-anchor="middle" class="fg-t sm">main 分支或標籤</text>
<line x1="160" y1="60" x2="178" y2="60" class="fg-l"/><polygon points="186,60 178,55.5 178,64.5" class="fg-a"/>
<rect x="186" y="30" width="140" height="60" rx="6" class="fg-b alt"/><text x="256" y="54" text-anchor="middle" class="fg-t">② 檢查</text><text x="256" y="74" text-anchor="middle" class="fg-t sm">tsc、單元測試</text>
<line x1="326" y1="60" x2="344" y2="60" class="fg-l"/><polygon points="352,60 344,55.5 344,64.5" class="fg-a"/>
<rect x="352" y="30" width="140" height="60" rx="6" class="fg-b alt"/><text x="422" y="54" text-anchor="middle" class="fg-t">③ Cocos 建置</text><text x="422" y="74" text-anchor="middle" class="fg-t sm">結束碼 36 才算過</text>
<line x1="492" y1="60" x2="510" y2="60" class="fg-l"/><polygon points="518,60 510,55.5 510,64.5" class="fg-a"/>
<rect x="518" y="30" width="140" height="60" rx="6" class="fg-b alt"/><text x="588" y="54" text-anchor="middle" class="fg-t">④ 預算檢查</text><text x="588" y="74" text-anchor="middle" class="fg-t sm">首包超過就失敗</text>
<line x1="588" y1="90" x2="588" y2="142" class="fg-l"/><polygon points="588,150 583.5,142 592.5,142" class="fg-a"/>
<rect x="518" y="150" width="140" height="60" rx="6" class="fg-b alt"/><text x="588" y="174" text-anchor="middle" class="fg-t">⑤ 預備環境</text><text x="588" y="194" text-anchor="middle" class="fg-t sm">冒煙測試自動跑</text>
<line x1="518" y1="180" x2="500" y2="180" class="fg-l"/><polygon points="492,180 500,175.5 500,184.5" class="fg-a"/>
<rect x="352" y="150" width="140" height="60" rx="6" class="fg-b"/><text x="422" y="174" text-anchor="middle" class="fg-t">⑥ 真機清單</text><text x="422" y="194" text-anchor="middle" class="fg-t sm">人工簽核</text>
<line x1="352" y1="180" x2="334" y2="180" class="fg-l on"/><polygon points="326,180 334,175.5 334,184.5" class="fg-a on"/>
<rect x="186" y="150" width="140" height="60" rx="6" class="fg-b hot"/><text x="256" y="174" text-anchor="middle" class="fg-t acc">⑦ 上正式</text><text x="256" y="194" text-anchor="middle" class="fg-t sm">同一份產物</text>
<line x1="186" y1="180" x2="158" y2="180" class="fg-l warm dash"/><polygon points="150,180 158,175.5 158,184.5" class="fg-a warm"/>
<text x="168" y="142" text-anchor="middle" class="fg-t sm warm">出事時</text>
<rect x="20" y="150" width="130" height="60" rx="6" class="fg-b warm"/><text x="85" y="174" text-anchor="middle" class="fg-t">回滾</text><text x="85" y="194" text-anchor="middle" class="fg-t sm">換回上一版入口</text>
<text x="340" y="238" text-anchor="middle" class="fg-t sm">任何一關沒過，管線就停；正式環境只收預備環境測過的那一份產物</text>
</svg><figcaption>② 到 ⑤ 都是自動的關卡，只有第 ⑥ 關要人。把人放在最後、而且只放一關，人的時間才會花在機器真的做不到的事上。</figcaption></figure>
<ul>
<li><b>main 永遠可以部署</b>：功能在分支上做，經過 review 和 ② 的檢查才合併。打一個版本標籤（例如 <code>v1.4.2</code>），就觸發往正式環境推進的流程。</li>
<li><b>產物只建置一次</b>：③ 產出的 <code>build/web-mobile</code> 壓成一個檔、用 commit 命名存起來。⑤ 和 ⑦ 部署的都是這一份，差別只在旁邊的 <code>config.json</code>。</li>
<li><b>密鑰不進 repo</b>：上傳到 CDN 和儲存空間的憑證，放在 CI 的祕密設定裡，只有部署那一步拿得到。</li>
<li><b>回滾要演練過</b>：專案還小的時候，就實際做一次「上一版、回滾、再上一版」，確認整個過程在一分鐘內完成。從沒演練過的回滾，在真的出事時通常不會動。</li>
</ul>

<h3><span class="badge lv4">專家</span>八、Code review 清單</h3>
<p>Code review 不是挑錯字，是用另一雙眼睛擋下「現在不會壞、之後一定會壞」的東西。下面這張清單，每一條都對應到這個模組某一課講過的真實 bug。合併前，審查的人照著過一次：</p>
<table>
<tr><th>類別</th><th>要檢查的</th><th>不檢查會怎樣</th></tr>
<tr><td>架構</td><td>Model 和 Rules 沒有 import <code>'cc'</code>；View 裡沒有跟分數或規則有關的 <code>if</code></td><td>規則漏進畫面，改一條規則要改五個檔案</td></tr>
<tr><td>生命週期</td><td>每個 <code>on()</code> 都有對應的 <code>off()</code> 或 <code>targetOff()</code>；自己建的節點有 <code>destroy()</code> 或回收到 <code>NodePool</code></td><td>監聽器重複觸發、記憶體洩漏</td></tr>
<tr><td>狀態與時間</td><td>每個點擊、回覆、計時器、動畫完成的回呼，開頭都先確認狀態；enter 開的計時器在 exit 關掉；新的補間動畫前先停舊的</td><td>連點得兩分、計時器在錯的狀態觸發、牌停在縮放 0</td></tr>
<tr><td>網路</td><td>每個請求有逾時；猜測帶局號和序號；收到的推播核對局號；用戶端從不送出「我猜對了」</td><td>永遠卡在 revealing、重送算兩次、作弊</td></tr>
<tr><td>效能</td><td><code>update</code> 裡沒有 <code>find()</code>、<code>getComponent()</code>、<code>new</code>；新圖片進了圖集並設好壓縮</td><td>越玩越慢、draw call 暴增、手機記憶體爆掉</td></tr>
<tr><td>資源</td><td>用路徑載入的資源在 <code>resources</code> 或 bundle 裡；動態載入的有釋放</td><td>建置後資源不見、貼圖記憶體一路往上</td></tr>
<tr><td>安全</td><td><code>config.json</code> 沒有密碼或金鑰；測試用的覆寫開關包在 <code>DEBUG</code> 裡；日誌不記憑證和個資</td><td>金鑰外洩、玩家被導到別人的伺服器</td></tr>
<tr><td>可觀察性</td><td>新的狀態轉換和網路事件有記日誌；錯誤訊息說得出是哪個欄位、哪個狀態</td><td>上線後出事，沒有任何線索</td></tr>
<tr><td>測試</td><td>改到規則或狀態機的 PR 有對應的測試；修 bug 的 PR 附上「先失敗、修完才通過」的測試</td><td>同一個 bug 三個月後回來</td></tr>
</table>
<p>流程本身也有規矩：一個 PR 只做一件事，最好在幾百行以內；描述裡寫清楚做了什麼、為什麼、怎麼測的；改到畫面的附截圖或短影片。自己的 PR 送出前，先自己照清單審一次，能擋掉一大半問題。</p>

<h3><span class="badge lv4">專家</span>九、面試時怎麼介紹這個專案</h3>
<p>面試官通常只給你幾分鐘，而且他同一天要聽好幾個人講專案。你的目標不是把每個檔案講完，而是讓他在最短的時間裡相信三件事：你能把東西做完、你懂為什麼這樣做、你在意品質而且會量。</p>
<h4>結構：由淺到深，讓對方決定要挖哪裡</h4>
<ol>
<li><b>30 秒版本</b>：做了什麼、用什麼做、有什麼特別。例如：「我用 Cocos Creator 3.8 和 TypeScript，從空專案做了一個手機網頁的猜高低遊戲。規則放在伺服器端，用戶端用狀態機管一局，斷線重連後會用伺服器的快照回到正確的狀態。它有單元測試、效能預算和自動部署，手機上第一幀大約 2.6 秒。」</li>
<li><b>2 分鐘版本</b>：拿出架構圖，講四條依賴規則，再用「一次猜測」的流程走一遍。</li>
<li><b>深挖一個難題</b>：挑一個你真的卡過的，用 STAR 的結構講：情境（Situation）、任務（Task）、行動（Action）、結果（Result）。例如連點得兩分、翻牌後牌消失、重連回到錯的狀態。重點放在你怎麼找到原因、試過哪些假設，而不是最後那一行修改。</li>
<li><b>數字</b>：首包大小、第一幀時間、測試數量和執行時間、draw call。數字讓人相信你真的量過。</li>
<li><b>取捨和限制</b>：為什麼用 Fisher–Yates 而不是 sort；為什麼設定在啟動時讀；哪些事你刻意沒做、為什麼。說得出限制的人，比什麼都說完美的人可信得多。</li>
</ol>
<h4>審查的人在找什麼</h4>
<table>
<tr><th>他們想知道</th><th>加分的證據</th><th>扣分的訊號</th></tr>
<tr><td>能不能把東西做完</td><td>一個點得開的試玩網址；照 README 五分鐘內能跑起來</td><td>只有程式碼，跑不起來</td></tr>
<tr><td>懂不懂架構</td><td>說得出依賴方向和每一條的理由</td><td>「我就是這樣寫的」</td></tr>
<tr><td>在不在意品質</td><td>測試、CI、code review 清單</td><td>沒有任何測試，或測試全被註解掉</td></tr>
<tr><td>會不會量</td><td>效能預算和量測方法</td><td>「感覺很順」</td></tr>
<tr><td>誠不誠實</td><td>主動說出已知的限制和下一步</td><td>每個問題都說「沒問題」</td></tr>
<tr><td>能不能溝通</td><td>兩分鐘講清楚，被打斷時能跳到對方想聽的地方</td><td>從第一個檔案開始逐行念</td></tr>
</table>
<h4>repo 本身也是履歷</h4>
<p>很多面試官會在面試前先打開你的 GitHub。一個讓人放心的 repo：<code>.gitignore</code> 排除了 <code>library</code>、<code>temp</code>、<code>local</code>、<code>build</code>；README 寫明 Cocos Creator 的確切版本；commit 訊息說得出每一步在做什麼，而不是一整排「update」；最上面有一段 GIF 或試玩連結。README 的骨架可以是：</p>
<pre><code># Higher or Lower（Cocos Creator 3.8.x，TypeScript）
一句話介紹，加一個試玩網址和一段 GIF

## 架構        一張圖＋四條依賴規則
## 跑起來      Creator 版本、npm ci、npx vitest run、怎麼建置
## 設計決策    規則在伺服器、狀態機、啟動時讀設定、為什麼這樣選
## 品質        測試數量、效能預算與最新實測
## 限制與下一步
</code></pre>
<p>最後，把 30 秒版本和 2 分鐘版本也準備一份英文的。就算面試用中文進行，被問到「can you walk me through it in English?」時，你會很慶幸自己練過。</p>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>小專案不需要文件和計畫</td><td>小專案正是練習的最好機會：每份文件只要半頁，但整套流程你都走過一次了。</td></tr>
<tr><td>程式寫完，里程碑就完成了</td><td>驗收標準通過、測試通過、真機跑過，才叫完成。</td></tr>
<tr><td>遊戲是畫面，沒辦法寫單元測試</td><td>規則、狀態機、洗牌都是純邏輯，一秒內能跑幾十個測試。畫面才交給冒煙測試和人。</td></tr>
<tr><td>隨機的東西沒辦法測</td><td>可以用統計檢查公平性，用固定種子讓每一次都重現。</td></tr>
<tr><td>效能等最後再最佳化</td><td>沒有預算，就不知道什麼時候算「夠了」。先訂數字、每次建置自動檢查一部分，問題在變大之前就會被看見。</td></tr>
<tr><td>面試時講越多技術細節越好</td><td>面試官要的是結構：先給全貌，再讓他決定要挖哪裡。數字和取捨比細節更有說服力。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>Vue 和 TypeScript 的前端</b>：依賴只往一個方向、狀態放在 store、畫面只負責顯示，這些規則跟 Vue 專案一模一樣；Vitest 和 Playwright 本來就是 Vue 生態系常用的工具。</li>
<li><b>Node.js 和 Go 的後端</b>：把 <code>Rules.ts</code> 抽成純函式之後，Node.js 的伺服器可以直接 import 同一份；用 Go 寫的話，就把同一組測試案例（例如 [3, 9, 5]）在兩邊各跑一次，確保兩邊的規則一致。</li>
<li><b>Docker 與雲端</b>：「建置一次、到處部署」和「正式環境只收測過的產物」，跟容器映像檔的推進流程是同一個觀念。</li>
<li><b>Unity</b>：同一套架構（Model、狀態機、網路介面）、同一套計畫（里程碑、驗收、預算），換一個引擎照樣適用。Unity 也有自己的測試框架可以跑純 C# 的規則。</li>
<li><b>帶團隊</b>：里程碑、驗收標準、完成的定義、code review 清單，就是一個小組長每天在用的工具。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<p>下面這些問題，面試官會直接拿你的專案來問。先用自己的專案回答一次，再看參考答案。</p>
<ol>
<li>「帶我看一下這個專案的架構。為什麼這樣切？」</li>
<li>「這個遊戲怎麼防止玩家作弊？」</li>
<li>「網路斷了再連回來，遊戲怎麼回到正確的狀態？」</li>
<li>「洗牌的隨機性，你怎麼測？」</li>
<li>「如果要改成很多人同時猜同一張牌，哪些地方要改？」</li>
<li>「你怎麼知道它在手機上夠快？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>分成畫面、流程、規則與資料三層，加上網路和設定在外圈。依賴只往一個方向：View 只畫圖和回報點擊；GameController 用狀態機決定順序；Model 只存狀態，不碰節點，也不 import 引擎，所以能在 Node.js 裡測；網路藏在 GameNet 介面後面，模擬伺服器和真伺服器可以互換；設定在啟動時讀一次。理由是：換畫面不動規則、換伺服器不動遊戲、規則只在一個地方，而且最重要的部分可以自動測試。CI 裡有檢查確保 Model 不 import 引擎。</li>
<li>原則是用戶端不決定任何結果。牌堆和規則在伺服器，用戶端只送「我猜 higher」，伺服器回覆下一張牌、對錯和分數；用戶端從不送「我猜對了」或「我的分數」，也拿不到還沒翻的牌。每個猜測帶局號和序號，伺服器拒絕重送和不合法的請求。設定檔是公開的，所以不放任何密鑰，測試用的覆寫開關只存在 Debug 建置裡。</li>
<li>斷線時，所有等待中的請求立刻失敗，狀態機不會卡著等；用指數退避加隨機的間隔重連；連上後第一件事是送 resume，拿到伺服器的快照（狀態、目前的牌、分數、剩幾秒），用 <code>jump()</code> 直接跳到那個狀態，每個狀態的 enter 都只靠資料重建畫面。用戶端的倒數只是顯示，結束一局由伺服器決定。這些都在模擬伺服器上用「guessing 中斷線」的開關測過。</li>
<li>兩層。公平性用統計：把三張牌洗六萬次，每種排列應該約一萬次，容許範圍依標準差設成正負 400；用 sort 加亂數的寫法會偏差上千次，一跑就抓到。可重現性用注入：洗牌函式接受亂數產生器當參數，測試時用固定種子，任何一局都能每次重現。</li>
<li>狀態機改由伺服器推動：每個狀態的開始和結束都變成伺服器的推播，用戶端只負責顯示，猜測變成「在截止前送出」，結果由伺服器在倒數結束時一起公布。推播都要帶局號，對不上的丟掉；重連時的快照要包含其他人的狀態。架構上，因為規則和時間本來就在伺服器，用戶端主要改的是 Controller 的轉換來源和 View 的顯示，Model 和介面的形狀大致不變。</li>
<li>我們有寫下來的效能預算：首包壓縮後 2 MB、第一幀 3 秒、95% 的幀在 16.7 毫秒內、桌面 draw call 10 以內、50 局後記憶體不成長。首包大小每次建置由 CI 自動檢查；其他的在每次發版時，用真機和 Performance 面板量，結果記在發版紀錄裡。超出預算時要明確決定是先修還是先上，不能默默放寬。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>畫出你自己專案的架構圖，然後寫一行 CI 檢查：只要 <code>assets/scripts/model/</code> 裡有任何檔案從 <code>'cc'</code> import，管線就失敗。</li>
<li>幫「斷線重連」寫三條驗收標準，每一條都要能被檢查，並寫出要附什麼證據。</li>
<li>如果把洗牌測試改成只跑 6,000 次，每種排列的期望次數和標準差各是多少？容許範圍應該設多少？會不會更容易誤判？</li>
<li>發版前一天，量到舊 iPhone 的第一幀是 3.4 秒，預算是 3 秒。寫出你會給主管的一段話：現況、原因、選項、你的建議。</li>
<li>照第九節的結構，寫出你的 30 秒版本，並挑出三個你會講的數字。</li>
<li>上一課的作業：改成「點數相同算猜對」。照本章的架構，哪些檔案應該改、哪些一行都不該動？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>最簡單的寫法：<code>! grep -rn "from 'cc'" assets/scripts/model/</code>。<code>grep</code> 找到東西時回傳成功，前面的 <code>!</code> 把它反過來，所以找到就讓這一步失敗。更正式的做法是用 ESLint 的 <code>no-restricted-imports</code> 規則，只套用在 model 資料夾，並在編輯器裡就看得到警告。</li>
<li>例如：(1) 在 guessing 中斷線 10 秒再恢復，30 秒內回到 guessing，目前的牌、分數和伺服器一致，證據是操作紀錄和兩邊的日誌；(2) 斷線期間伺服器已經因為時間到結束這一局，重連後直接顯示結算畫面，不會回到 guessing，證據是模擬伺服器開關的測試；(3) 斷線前送出、回覆遺失的猜測，重連後重送，分數只加一次，證據是單元測試。</li>
<li>期望次數 1,000，標準差 &radic;(6000 &times; 1/6 &times; 5/6) &asymp; 28.9。同樣取約 4.4 個標準差，容許範圍大約 1,000 &plusmn; 127。誤判的機率跟原本差不多，因為範圍是照標準差縮放的；差別在於它對「小偏差」比較不敏感，只是 sort 那種寫法偏差至少是 1/24（250 次），還是抓得到。</li>
<li>例如：「舊 iPhone 第一幀 3.4 秒，超出預算 0.4 秒；其他五項達標。原因是首場景還引用了 900 KB 的背景圖，在關鍵路徑上。選項一：明天照常上線，下一版把背景移到遊戲包裡，預估一天，舊 iPhone 玩家約佔 X%；選項二：延後一天修完再上。我建議選項一，因為不影響功能，而且修法明確；已記在發版紀錄裡。」重點是數字、原因、選項、建議，而且讓決定被寫下來。</li>
<li>參考第九節的例子。三個數字可以是：首包 1.45 MB、手機第一幀 2.6 秒、34 個單元測試 1 秒內跑完。選你真的量過的，被追問時說得出怎麼量的。</li>
<li>應該改的：<code>Rules.ts</code>（判斷從大於改成大於等於）和它的測試；如果有真伺服器，它 import 同一個 <code>Rules.ts</code>，自動一起變。一行都不該動的：所有 View、GameModel、RoundFsm、GameController、Net。如果你發現必須改 View 或 Controller，代表有規則漏到了那裡，這正是這個練習要你找出來的東西。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>Google Engineering Practices：Code Review Developer Guide</b>（<a href="https://google.github.io/eng-practices/">google.github.io/eng-practices</a>）：Google 公開的 code review 指南，分成「審查的人」和「送審的人」兩份，短而實用。</li>
<li><b>Ham Vocke〈The Practical Test Pyramid〉</b>（刊在 martinfowler.com）：把測試金字塔每一層該測什麼、不該測什麼講得最清楚的一篇長文。</li>
<li><b>Robert Nystrom《Game Programming Patterns》</b>（<a href="https://gameprogrammingpatterns.com/">gameprogrammingpatterns.com</a>，網站可免費閱讀）：State、Observer、Game Loop 幾章，正好對應這個模組的狀態機、事件和更新迴圈。</li>
<li><b>Vitest 與 Playwright 官方文件</b>（<a href="https://vitest.dev/">vitest.dev</a>、<a href="https://playwright.dev/">playwright.dev</a>）：本章的單元測試和冒煙測試，照著入門頁半小時內就能跑起來。</li>
<li><b>Andrew Hunt 與 David Thomas《The Pragmatic Programmer》</b>：一本講「專業軟體工程師怎麼工作」的經典，估時、探路、自動化、對自己的程式碼負責，都在裡面。</li>
</ul>
` });
