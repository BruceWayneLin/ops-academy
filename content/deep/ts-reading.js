DEEP({ 'ts-reading': `
<p>上一課給了一套讀程式的骨架：找進入點、追一個動作、分三個圈圈、讓編輯器幫你走、跟著資料、驗證猜測、寫地圖。這一章是完整版：新工作的第一天先看哪些檔案、怎麼找出「所有」進入點而不只是 main.ts、為什麼要先讀型別、怎麼用 git 問出「這行為什麼長這樣」、除錯器裡那些很少人用卻最省時間的中斷點、資深工程師 review 程式時的順序。最後，我們在一個想像的小遊戲裡完整追一次點擊，並且順著這條路抓到一個真實會發生的 bug。</p>

<h3><span class="badge lv1">基礎</span>一、為什麼讀程式比寫程式難</h3>
<p>寫程式的時候，你腦子裡有完整的理由：為什麼這樣切、試過什麼不行、哪個奇怪的 if 是為了哪個客訴。程式碼只留下最後的結果，理由全都不見了。讀別人的程式，就像看一塊化石：你看得到骨頭，但要自己推回這隻動物當年怎麼走路。</p>
<p>所以讀程式的目標從來不是「全部看懂」，而是「回答眼前這個問題」。剛到一個陌生城市，你不會把每條巷子走一遍，而是先找車站，再沿著主要幹道走到你要去的地方。一個三百個檔案的專案，回答「按下 Higher 之後發生什麼事」通常只需要其中五、六個。</p>
<figure class="figure"><svg viewBox="0 0 680 232" class="fg" style="width:100%;max-width:680px" role="img" aria-label="一大片代表檔案的小方格，其中六個被一條綠線串起來，從進入點走到畫面改變">
<text x="340" y="22" text-anchor="middle" class="fg-t sm">一大片檔案裡，回答一個問題只需要一條路</text>
<g class="fg-l dim">
<rect x="40" y="40" width="28" height="20" rx="3"/><rect x="76" y="40" width="28" height="20" rx="3"/><rect x="112" y="40" width="28" height="20" rx="3"/><rect x="148" y="40" width="28" height="20" rx="3"/><rect x="184" y="40" width="28" height="20" rx="3"/><rect x="220" y="40" width="28" height="20" rx="3"/><rect x="256" y="40" width="28" height="20" rx="3"/><rect x="292" y="40" width="28" height="20" rx="3"/><rect x="328" y="40" width="28" height="20" rx="3"/><rect x="364" y="40" width="28" height="20" rx="3"/><rect x="400" y="40" width="28" height="20" rx="3"/><rect x="436" y="40" width="28" height="20" rx="3"/><rect x="472" y="40" width="28" height="20" rx="3"/><rect x="508" y="40" width="28" height="20" rx="3"/><rect x="544" y="40" width="28" height="20" rx="3"/><rect x="580" y="40" width="28" height="20" rx="3"/>
<rect x="40" y="68" width="28" height="20" rx="3"/><rect x="76" y="68" width="28" height="20" rx="3"/><rect x="112" y="68" width="28" height="20" rx="3"/><rect x="184" y="68" width="28" height="20" rx="3"/><rect x="220" y="68" width="28" height="20" rx="3"/><rect x="256" y="68" width="28" height="20" rx="3"/><rect x="292" y="68" width="28" height="20" rx="3"/><rect x="328" y="68" width="28" height="20" rx="3"/><rect x="364" y="68" width="28" height="20" rx="3"/><rect x="400" y="68" width="28" height="20" rx="3"/><rect x="436" y="68" width="28" height="20" rx="3"/><rect x="472" y="68" width="28" height="20" rx="3"/><rect x="508" y="68" width="28" height="20" rx="3"/><rect x="544" y="68" width="28" height="20" rx="3"/><rect x="580" y="68" width="28" height="20" rx="3"/>
<rect x="76" y="96" width="28" height="20" rx="3"/><rect x="112" y="96" width="28" height="20" rx="3"/><rect x="148" y="96" width="28" height="20" rx="3"/><rect x="184" y="96" width="28" height="20" rx="3"/><rect x="220" y="96" width="28" height="20" rx="3"/><rect x="256" y="96" width="28" height="20" rx="3"/><rect x="292" y="96" width="28" height="20" rx="3"/><rect x="328" y="96" width="28" height="20" rx="3"/><rect x="400" y="96" width="28" height="20" rx="3"/><rect x="436" y="96" width="28" height="20" rx="3"/><rect x="472" y="96" width="28" height="20" rx="3"/><rect x="508" y="96" width="28" height="20" rx="3"/><rect x="544" y="96" width="28" height="20" rx="3"/>
<rect x="40" y="124" width="28" height="20" rx="3"/><rect x="76" y="124" width="28" height="20" rx="3"/><rect x="112" y="124" width="28" height="20" rx="3"/><rect x="148" y="124" width="28" height="20" rx="3"/><rect x="184" y="124" width="28" height="20" rx="3"/><rect x="220" y="124" width="28" height="20" rx="3"/><rect x="292" y="124" width="28" height="20" rx="3"/><rect x="328" y="124" width="28" height="20" rx="3"/><rect x="364" y="124" width="28" height="20" rx="3"/><rect x="400" y="124" width="28" height="20" rx="3"/><rect x="436" y="124" width="28" height="20" rx="3"/><rect x="472" y="124" width="28" height="20" rx="3"/><rect x="508" y="124" width="28" height="20" rx="3"/><rect x="544" y="124" width="28" height="20" rx="3"/><rect x="580" y="124" width="28" height="20" rx="3"/>
<rect x="40" y="152" width="28" height="20" rx="3"/><rect x="76" y="152" width="28" height="20" rx="3"/><rect x="112" y="152" width="28" height="20" rx="3"/><rect x="148" y="152" width="28" height="20" rx="3"/><rect x="184" y="152" width="28" height="20" rx="3"/><rect x="220" y="152" width="28" height="20" rx="3"/><rect x="256" y="152" width="28" height="20" rx="3"/><rect x="292" y="152" width="28" height="20" rx="3"/><rect x="328" y="152" width="28" height="20" rx="3"/><rect x="364" y="152" width="28" height="20" rx="3"/><rect x="400" y="152" width="28" height="20" rx="3"/><rect x="436" y="152" width="28" height="20" rx="3"/><rect x="508" y="152" width="28" height="20" rx="3"/><rect x="544" y="152" width="28" height="20" rx="3"/><rect x="580" y="152" width="28" height="20" rx="3"/>
<rect x="40" y="180" width="28" height="20" rx="3"/><rect x="76" y="180" width="28" height="20" rx="3"/><rect x="112" y="180" width="28" height="20" rx="3"/><rect x="148" y="180" width="28" height="20" rx="3"/><rect x="184" y="180" width="28" height="20" rx="3"/><rect x="220" y="180" width="28" height="20" rx="3"/><rect x="256" y="180" width="28" height="20" rx="3"/><rect x="292" y="180" width="28" height="20" rx="3"/><rect x="328" y="180" width="28" height="20" rx="3"/><rect x="364" y="180" width="28" height="20" rx="3"/><rect x="400" y="180" width="28" height="20" rx="3"/><rect x="436" y="180" width="28" height="20" rx="3"/><rect x="472" y="180" width="28" height="20" rx="3"/><rect x="508" y="180" width="28" height="20" rx="3"/><rect x="544" y="180" width="28" height="20" rx="3"/><rect x="580" y="180" width="28" height="20" rx="3"/>
</g>
<polyline points="54,106 162,78 270,134 378,106 486,162 594,106" class="fg-l on"/>
<rect x="40" y="96" width="28" height="20" rx="3" class="fg-b hot"/><text x="54" y="110" text-anchor="middle" class="fg-t sm acc">1</text>
<rect x="148" y="68" width="28" height="20" rx="3" class="fg-b hot"/><text x="162" y="82" text-anchor="middle" class="fg-t sm acc">2</text>
<rect x="256" y="124" width="28" height="20" rx="3" class="fg-b hot"/><text x="270" y="138" text-anchor="middle" class="fg-t sm acc">3</text>
<rect x="364" y="96" width="28" height="20" rx="3" class="fg-b hot"/><text x="378" y="110" text-anchor="middle" class="fg-t sm acc">4</text>
<rect x="472" y="152" width="28" height="20" rx="3" class="fg-b hot"/><text x="486" y="166" text-anchor="middle" class="fg-t sm acc">5</text>
<rect x="580" y="96" width="28" height="20" rx="3" class="fg-b hot"/><text x="594" y="110" text-anchor="middle" class="fg-t sm acc">6</text>
<text x="54" y="222" text-anchor="middle" class="fg-t sm acc">進入點</text>
<text x="594" y="222" text-anchor="middle" class="fg-t sm acc">畫面改變</text>
<text x="324" y="222" text-anchor="middle" class="fg-t sm">其他方格：今天先不管</text>
</svg><figcaption>每個方格是一個檔案。讀程式不是把方格一個個翻開，而是找出那條從進入點走到結果的路；路上沒有的，今天都不用看。</figcaption></figure>
<p>還有一個心態：<b>看不懂是正常的，不是你不夠好</b>。資深工程師進新專案，第一週一樣看不懂大部分的程式。差別在於他們知道怎麼縮小問題、怎麼用工具問出答案，而且不會因為「還有很多不懂」就停下來。</p>

<h3><span class="badge lv1">基礎</span>二、第一天：先讓它跑起來，再看邊界</h3>
<p>讀第一行業務邏輯之前，先花半天把專案跑起來。跑不起來，你就沒辦法驗證任何猜測，只能一直讀、一直猜。下面這些檔案，每一個都用不到五分鐘，卻能告訴你很多：</p>
<table>
<tr><th>檔案</th><th>它告訴你什麼</th></tr>
<tr><td><code>README.md</code>、<code>docs/</code></td><td>怎麼啟動、有哪些環境。常常過時，但過時的地方本身就是線索</td></tr>
<tr><td><code>package.json</code></td><td><code>scripts</code> 告訴你怎麼開發、建置、測試；<code>dependencies</code> 告訴你技術選擇：Vue 還是 React、用什麼狀態管理、什麼 HTTP 函式庫</td></tr>
<tr><td><code>tsconfig.json</code></td><td>有沒有開 <code>strict</code>（決定你能多信任型別）、路徑別名指到哪裡</td></tr>
<tr><td><code>.env.example</code></td><td>程式需要哪些外部服務：API 位址、金鑰的名字</td></tr>
<tr><td><code>Dockerfile</code>、CI 設定</td><td>正式環境怎麼建置、跑哪些檢查。CI 跑的指令，是「這個專案怎麼樣才算對」的最終定義</td></tr>
<tr><td>資料夾結構</td><td>用 <code>tree -L 2 -I node_modules</code> 看前兩層。是照功能分（game、ui、api），還是照技術分（components、stores、utils）？</td></tr>
<tr><td>測試檔</td><td>一個測試就是一個「這段程式該怎麼用」的可執行範例，比註解可靠</td></tr>
</table>
<p>Cocos Creator 專案多看兩樣：建置設定裡的起始場景，以及 <code>assets</code> 底下的資料夾分法。很多邏輯是掛在場景節點上的元件裡，光看檔案列表看不出誰先誰後，要打開場景看節點樹。</p>

<h3><span class="badge lv2">進階</span>三、進入點不只一個</h3>
<p>上一課說「找到進入點」，但真正的程式有很多個入口。main.ts 只是「啟動」那一個。程式開始跑之後，所有後續的行為，都是從下面這幾種「外面的事情」觸發的：</p>
<figure class="figure"><svg viewBox="0 0 680 262" class="fg" style="width:100%;max-width:680px" role="img" aria-label="六種進入點：啟動、路由與場景切換、使用者輸入、計時與每一格、網路訊息、生命週期，各自旁邊寫著搜尋關鍵字，全部匯集到你的程式碼">
<rect x="15" y="24" width="145" height="30" rx="6" class="fg-b hot"/><text x="87" y="44" text-anchor="middle" class="fg-t sm">啟動</text>
<text x="172" y="44" class="fg-t sm mono">main.ts、起始場景</text>
<rect x="15" y="62" width="145" height="30" rx="6" class="fg-b"/><text x="87" y="82" text-anchor="middle" class="fg-t sm">路由、場景切換</text>
<text x="172" y="82" class="fg-t sm mono">routes、loadScene</text>
<rect x="15" y="100" width="145" height="30" rx="6" class="fg-b"/><text x="87" y="120" text-anchor="middle" class="fg-t sm">使用者輸入</text>
<text x="172" y="120" class="fg-t sm mono">addEventListener、@click、on(</text>
<rect x="15" y="138" width="145" height="30" rx="6" class="fg-b"/><text x="87" y="158" text-anchor="middle" class="fg-t sm">計時、每一格畫面</text>
<text x="172" y="158" class="fg-t sm mono">setInterval、schedule、update(</text>
<rect x="15" y="176" width="145" height="30" rx="6" class="fg-b"/><text x="87" y="196" text-anchor="middle" class="fg-t sm">網路訊息</text>
<text x="172" y="196" class="fg-t sm mono">onmessage、.then(、await</text>
<rect x="15" y="214" width="145" height="30" rx="6" class="fg-b"/><text x="87" y="234" text-anchor="middle" class="fg-t sm">生命週期</text>
<text x="172" y="234" class="fg-t sm mono">onMounted、onLoad、start</text>
<line x1="392" y1="39" x2="470" y2="39" class="fg-l dim"/><line x1="392" y1="77" x2="470" y2="77" class="fg-l dim"/><line x1="392" y1="115" x2="470" y2="115" class="fg-l dim"/>
<line x1="392" y1="153" x2="470" y2="153" class="fg-l dim"/><line x1="392" y1="191" x2="470" y2="191" class="fg-l dim"/><line x1="392" y1="229" x2="470" y2="229" class="fg-l dim"/>
<line x1="470" y1="39" x2="470" y2="229" class="fg-l"/>
<line x1="470" y1="134" x2="497" y2="134" class="fg-l on"/><polygon points="505,134 497,129.5 497,138.5" class="fg-a on"/>
<rect x="505" y="94" width="160" height="80" rx="8" class="fg-b alt"/>
<text x="585" y="122" text-anchor="middle" class="fg-t">你的程式碼</text>
<text x="585" y="144" text-anchor="middle" class="fg-t sm">每一種都是一條</text>
<text x="585" y="162" text-anchor="middle" class="fg-t sm">從外面進來的路</text>
<text x="172" y="16" class="fg-t sm acc">搜尋這些字，就找得到入口</text>
</svg><figcaption>程式的行為都是被「外面的事情」觸發的：啟動、換頁、點擊、計時器、網路回應、生命週期。左邊是種類，中間是在專案裡搜尋時最好用的關鍵字。</figcaption></figure>
<p>接手一個專案，可以用這張表做一次「入口普查」：每一種都搜一次，列出找到的地方。結果常常很驚人，例如發現有三個不同的 <code>setInterval</code> 在輪詢同一個 API，或某個畫面在 <code>update</code> 裡每一格都 new 一個物件。遊戲特別要注意「每一格」這一類：Cocos 元件的 <code>update(dt)</code>、<code>this.schedule()</code>，它們不是由使用者觸發，卻一直在跑。</p>
<h4>從畫面反查程式</h4>
<p>知道「哪個按鈕」，不知道「哪段程式」時，從畫面往回找：</p>
<ul>
<li><b>Chrome 開發者工具的 Elements 面板</b>：選中按鈕，右邊的 Event Listeners 分頁會列出掛在它上面的處理函式，點一下就跳到原始碼。</li>
<li><b>Vue Devtools</b>：用選取工具點畫面上的元素，直接告訴你它是哪個元件、props 和狀態是什麼。</li>
<li><b>畫面上的字不一定在程式裡</b>：有做多語系的專案，按鈕上的「再來一局」其實在翻譯檔裡。先搜字找到它的 key（例如 <code>game.playAgain</code>），再搜 key 找到程式。</li>
<li><b>Cocos</b>：在編輯器的節點樹找到那個節點，看它身上掛了哪些元件，以及按鈕元件的 Click Events 指到哪個元件的哪個方法。這種在編輯器裡設定的連線，用程式碼搜尋是找不到的。</li>
</ul>

<h3><span class="badge lv2">進階</span>四、先讀型別：型別是地圖的圖例</h3>
<p>在 TypeScript 專案裡，最快理解一個領域的方法，是先讀它的型別定義。實作會有幾千行，型別往往只有幾十行，卻描述了整個系統「有哪些東西、可能處在哪些狀態」。看這個想像中的 <code>game/types.ts</code>：</p>
<pre><code>// game/types.ts
export type Guess = 'higher' | 'lower';

export type Phase =
  | { kind: 'idle' }
  | { kind: 'guessing'; current: number }
  | { kind: 'revealing'; current: number; next: number }
  | { kind: 'over'; finalScore: number };

export interface RoundResult {
  guess: Guess;
  current: number;
  next: number;
  correct: boolean;
}

export interface DeckApi { draw(): Promise&lt;number&gt; }

export type GameEvents = { score: number; result: RoundResult; phase: Phase };</code></pre>
<p>還沒讀任何一行邏輯，你已經可以寫下這些推論和問題：</p>
<ul>
<li>一局有四個階段，猜的時候只知道目前那張牌，翻牌時才有下一張。</li>
<li>牌是一個數字，沒有花色。點數範圍是多少？要去找產生它的地方。</li>
<li>抽牌是非同步的（<code>Promise</code>），所以很可能打 API。網路慢的時候，畫面在等什麼？</li>
<li>結果只有 <code>correct</code> 真或假，沒有「平手」。所以兩張牌一樣時怎麼算？這是一個要寫進筆記的問題。</li>
<li>有三種事件。之後追程式時，搜尋 <code>'result'</code>、<code>'score'</code>、<code>'phase'</code> 就能找到所有聽眾。</li>
</ul>
<h4>型別也會說謊：找出被蓋掉的地方</h4>
<p>型別只有在沒被繞過時才可信。在專案裡搜尋這幾個字，它們標出了「作者推翻了型別檢查」的地方，也是 bug 最常住的地方：</p>
<pre><code>rg -n "as any|as unknown as|@ts-ignore|@ts-expect-error|!\\." src</code></pre>
<p><code>as any</code> 和雙重轉型代表「我比編譯器知道得多」；<code>@ts-ignore</code> 直接關掉一行的檢查；變數後面的 <code>!</code>（非空斷言）代表「我保證這裡不是 null」。每一個都可能是對的，但每一個都值得在筆記上打個問號。另外，如果 tsconfig 沒開 <code>strict</code>，<code>null</code> 和隱含的 <code>any</code> 都不會被檢查，型別就只能當參考。</p>
<p>讀型別時的幾個工具：滑鼠停在變數上看推論出來的型別；右鍵選 Go to Type Definition 跳到型別本身；想知道某個函式實際回傳什麼，可以暫時寫 <code>type R = ReturnType&lt;typeof drawCard&gt;</code> 再停在 R 上看。</p>

<h3><span class="badge lv2">進階</span>五、追一條功能：編輯器之外的手法</h3>
<p>上一課的跳到定義、尋找所有參考是基本功。再加幾個：</p>
<table>
<tr><th>工具</th><th>Mac 的 VS Code</th><th>什麼時候用</th></tr>
<tr><td>Go to Implementations</td><td>Cmd F12</td><td>你在介面上（例如 <code>DeckApi.draw</code>），想知道實際是哪個類別在做事</td></tr>
<tr><td>Show Call Hierarchy</td><td>Shift Option H</td><td>一層一層展開「誰呼叫了它、又是誰呼叫了那個」，比反覆找參考快</td></tr>
<tr><td>文字搜尋 <code>rg</code>（ripgrep）</td><td>終端機</td><td>字串事件名、翻譯 key、設定名稱、CSS class，這些都不是程式符號</td></tr>
<tr><td>Timeline、Git 檢視</td><td>檔案總管下方</td><td>這個檔案最近被誰、為了什麼改過</td></tr>
</table>
<p>追的時候記住：<b>非同步會把路切斷</b>。<code>await</code>、事件、計時器、Promise 的 <code>then</code>，都讓「誰呼叫誰」不再是直線。遇到 <code>emit('result')</code>，跳到定義只會帶你到 EventBus 的 emit，不會帶你到聽眾；要改用搜尋 <code>'result'</code>，找出所有 <code>on('result'</code>。這是讀事件驅動程式最常卡住的地方。</p>

<h3><span class="badge lv3">專業</span>六、用 git 讀歷史：問出「為什麼」</h3>
<p>程式碼只告訴你「是什麼」，歷史紀錄告訴你「為什麼」。資深工程師看到一段奇怪的程式，第一個反應不是改掉它，而是去問 git 它是怎麼來的。</p>
<pre><code># 這個檔案的歷史（含改名之前）
git log --oneline --follow -- src/game/rules.ts

# 哪些 commit 加入或刪除了這個字串（pickaxe）
git log -p -S "next === current" -- src

# 只看某個函式那幾行的演變
git log -L '/function isCorrect/,+6:src/game/rules.ts'

# 每一行最後是誰改的；-w 忽略空白，-C 追蹤從別的檔案搬來的行
git blame -w -C -C src/game/rules.ts

# 某個版本之後才壞掉：二分搜尋是哪個 commit 引入的
git bisect start
git bisect bad
git bisect good v1.4.0
git bisect run npm test</code></pre>
<figure class="figure"><svg viewBox="0 0 680 232" class="fg" style="width:100%;max-width:680px" role="img" aria-label="一行程式的歷史時間軸：a1f 加入規則時還沒有這一行，b7c 加入相同點數算輸並附需求單，c3d 是全專案格式化，git blame 預設停在 c3d，略過格式化之後才指到 b7c">
<text x="340" y="20" text-anchor="middle" class="fg-t sm mono">要問的那一行：if (next === current) return false;</text>
<rect x="15" y="36" width="150" height="50" rx="6" class="fg-b"/><text x="90" y="56" text-anchor="middle" class="fg-t sm mono">a1f · 2024-03</text><text x="90" y="75" text-anchor="middle" class="fg-t sm">加入猜高低規則</text>
<rect x="185" y="36" width="150" height="50" rx="6" class="fg-b hot"/><text x="260" y="56" text-anchor="middle" class="fg-t sm mono">b7c · 2025-01</text><text x="260" y="75" text-anchor="middle" class="fg-t sm">相同點數算輸 #412</text>
<rect x="355" y="36" width="150" height="50" rx="6" class="fg-b warm"/><text x="430" y="56" text-anchor="middle" class="fg-t sm mono">c3d · 2025-06</text><text x="430" y="75" text-anchor="middle" class="fg-t sm">全專案自動格式化</text>
<rect x="525" y="36" width="140" height="50" rx="6" class="fg-b"/><text x="595" y="56" text-anchor="middle" class="fg-t sm mono">HEAD</text><text x="595" y="75" text-anchor="middle" class="fg-t sm">今天</text>
<line x1="20" y1="120" x2="650" y2="120" class="fg-l"/><polygon points="658,120 650,115.5 650,124.5" class="fg-a"/>
<line x1="90" y1="86" x2="90" y2="114" class="fg-l dim"/><line x1="260" y1="86" x2="260" y2="114" class="fg-l dim"/><line x1="430" y1="86" x2="430" y2="114" class="fg-l dim"/><line x1="595" y1="86" x2="595" y2="114" class="fg-l dim"/>
<circle cx="90" cy="120" r="6" class="fg-b"/><circle cx="260" cy="120" r="6" class="fg-lamp on"/><circle cx="430" cy="120" r="6" class="fg-b warm"/><circle cx="595" cy="120" r="6" class="fg-b"/>
<line x1="430" y1="156" x2="430" y2="136" class="fg-l warm"/><polygon points="430,128 425.5,136 434.5,136" class="fg-a warm"/>
<text x="430" y="172" text-anchor="middle" class="fg-t sm warm">git blame 預設停在這裡</text>
<line x1="260" y1="156" x2="260" y2="136" class="fg-l on"/><polygon points="260,128 255.5,136 264.5,136" class="fg-a on"/>
<text x="260" y="172" text-anchor="middle" class="fg-t sm acc">略過格式化之後</text>
<text x="90" y="160" text-anchor="middle" class="fg-t sm">這時還沒有</text><text x="90" y="176" text-anchor="middle" class="fg-t sm">這一行</text>
<rect x="160" y="190" width="200" height="34" rx="6" class="fg-b alt"/><text x="260" y="212" text-anchor="middle" class="fg-t sm">#412：產品決定平手算輸</text>
<line x1="260" y1="178" x2="260" y2="182" class="fg-l alt"/><polygon points="260,190 255.5,182 264.5,182" class="fg-a alt"/>
</svg><figcaption>blame 只告訴你「最後一個碰過這行的 commit」。如果那是一次格式化，它就擋住了真正的理由；略過格式化 commit 之後，才找到加入這條規則的 b7c，以及它連到的需求單 #412。</figcaption></figure>
<h4>讓 blame 不被格式化擋住</h4>
<p>把純格式化、大量改名這類 commit 的雜湊寫進專案根目錄的 <code>.git-blame-ignore-revs</code>，再設定：</p>
<pre><code>git config blame.ignoreRevsFile .git-blame-ignore-revs</code></pre>
<p>之後 <code>git blame</code> 就會跳過它們，直接指到真正改變邏輯的 commit。GitHub 的 blame 畫面也會讀這個檔案。如果你負責一次大規模格式化，順手把它的雜湊加進去，是對後來的人很體貼的事。</p>
<h4>找出熱點：最常被改的檔案</h4>
<pre><code>git log --since="6 months ago" --format= --name-only \\
  | sort | uniq -c | sort -rn | head -15</code></pre>
<p>這會列出半年內被改最多次的檔案。被改得越頻繁、又越長的檔案，通常就是 bug 最多、最需要先看懂的地方。<code>git shortlog -sn --since="1 year ago"</code> 則告訴你誰最近最活躍，有問題知道該問誰。</p>

<h3><span class="badge lv3">專業</span>七、除錯器：中斷點不只一種</h3>
<p>多數人只會在某一行點一下設中斷點。Chrome 開發者工具（Cocos 在瀏覽器預覽時、Vue 開發時都用它）其實有一整套：</p>
<table>
<tr><th>種類</th><th>怎麼設</th><th>回答什麼問題</th></tr>
<tr><td>條件中斷點</td><td>行號上按右鍵，Add conditional breakpoint，寫 <code>next === current</code></td><td>只在那個罕見的情況停下來，不用按一百次繼續</td></tr>
<tr><td>Logpoint</td><td>行號上按右鍵，Add logpoint</td><td>不改程式、不重新建置，就印出變數</td></tr>
<tr><td>事件監聽中斷點</td><td>Sources 面板側欄的 Event Listener Breakpoints，勾 Mouse 的 click</td><td>不知道按鈕的處理函式在哪裡：點一下，就停在它的第一行</td></tr>
<tr><td>DOM 中斷點</td><td>Elements 面板，元素上按右鍵，Break on 子樹或屬性變更</td><td>「到底是誰把這個元素改掉的？」</td></tr>
<tr><td>XHR、fetch 中斷點</td><td>Sources 側欄，填網址的一部分</td><td>這個請求是從哪段程式發出去的</td></tr>
<tr><td>例外時暫停</td><td>Sources 側欄勾選 Pause on uncaught exceptions（必要時連 caught 一起）</td><td>錯誤被吞掉、只看到結果不對的時候</td></tr>
</table>
<figure class="figure"><svg viewBox="0 0 680 252" class="fg" style="width:100%;max-width:680px" role="img" aria-label="除錯器暫停時的畫面：左邊呼叫堆疊由新到舊是 isCorrect、onGuess、await 接縫、click 處理函式，框架內部被隱藏；右邊是中斷點條件與區域變數 current 7、next 7">
<text x="160" y="20" text-anchor="middle" class="fg-t">Call Stack（新的在上）</text>
<rect x="15" y="32" width="290" height="30" rx="5" class="fg-b hot"/><text x="27" y="52" class="fg-t sm mono acc">▶ isCorrect</text><text x="295" y="52" text-anchor="end" class="fg-t sm mono">rules.ts:3</text>
<rect x="15" y="68" width="290" height="30" rx="5" class="fg-b"/><text x="27" y="88" class="fg-t sm mono">onGuess</text><text x="295" y="88" text-anchor="end" class="fg-t sm mono">controller.ts:12</text>
<line x1="15" y1="114" x2="85" y2="114" class="fg-l dash"/><text x="160" y="118" text-anchor="middle" class="fg-t sm alt">await（非同步接縫）</text><line x1="235" y1="114" x2="305" y2="114" class="fg-l dash"/>
<rect x="15" y="130" width="290" height="30" rx="5" class="fg-b"/><text x="27" y="150" class="fg-t sm mono">（click 處理函式）</text><text x="295" y="150" text-anchor="end" class="fg-t sm mono">buttons.ts:5</text>
<rect x="15" y="166" width="290" height="30" rx="5" class="fg-b"/><text x="160" y="186" text-anchor="middle" class="fg-t sm">框架內部 6 層：已隱藏（ignore list）</text>
<text x="160" y="222" text-anchor="middle" class="fg-t sm alt">虛線下方：當初觸發這次呼叫的點擊</text>
<line x1="330" y1="12" x2="330" y2="244" class="fg-l dim dash"/>
<rect x="350" y="32" width="315" height="48" rx="6" class="fg-b warm"/>
<text x="362" y="52" class="fg-t sm warm">中斷點條件</text>
<text x="362" y="70" class="fg-t sm mono">next === current</text>
<rect x="350" y="92" width="315" height="104" rx="6" class="fg-b"/>
<text x="362" y="112" class="fg-t sm">Scope：區域變數</text>
<text x="362" y="134" class="fg-t sm mono">current: 7</text>
<text x="362" y="154" class="fg-t sm mono">next: 7</text>
<text x="362" y="174" class="fg-t sm mono">guess: "higher"</text>
<rect x="350" y="206" width="315" height="34" rx="6" class="fg-b hot"/>
<text x="362" y="228" class="fg-t sm">Watch：</text><text x="420" y="228" class="fg-t sm mono acc">next &gt; current → false</text>
</svg><figcaption>停在條件中斷點時看到的東西。呼叫堆疊由新到舊，中間那條虛線是 await：虛線上方是 await 之後恢復執行的部分，下方是當初呼叫 onGuess 的那次點擊。框架自己的函式被放進忽略清單，所以只剩你的程式。右邊則證實了「兩張都是 7」這個猜測。</figcaption></figure>
<p>三個讓除錯器真正好用的設定：</p>
<ul>
<li><b>來源對應</b>（source map）：沒有它，你看到的是打包壓縮後的 JavaScript。Vite 開發模式預設就有；正式版要看設定，而且通常不該把 source map 公開給所有人。</li>
<li><b>忽略清單</b>（ignore list）：在檔案上按右鍵 Add script to ignore list，或在設定裡把 node_modules 整個加進去。單步執行時就不會一直走進 Vue 或引擎的內部，呼叫堆疊也只剩你的程式。</li>
<li><b>非同步堆疊</b>：Chrome 會把 await 之前的呼叫者接在後面（上圖的虛線）。看到這條接縫，就知道「是哪一次點擊造成了這次的計算」。</li>
</ul>
<p>Node.js 也一樣：用 <code>node --inspect-brk dist/server.js</code> 啟動，在 Chrome 打開 <code>chrome://inspect</code> 就能連上；或在 VS Code 開一個 JavaScript Debug Terminal，在裡面跑任何 npm 指令都會自動接上除錯器。</p>

<h3><span class="badge lv3">專業</span>八、心智地圖、筆記與畫圖</h3>
<p>讀程式最大的浪費，是讀懂了、一個禮拜後又忘了，再讀一次。筆記不是寫給別人看的作業，是你外接的記憶體。好用的筆記有五種，各管一件事：</p>
<ol>
<li><b>一頁地圖</b>：上一課那種，每一層一行：入口、輸入、邏輯、資料、畫面，以及還沒解答的問題。</li>
<li><b>流程的時序圖</b>：一個動作經過哪些模組、誰先誰後、哪裡是非同步。用 Mermaid 寫在 Markdown 裡，GitHub 和很多筆記軟體會直接畫成圖：</li>
</ol>
<pre><code>sequenceDiagram
  Buttons-&gt;&gt;Controller: onGuess('higher')
  Controller-&gt;&gt;Deck: await draw()
  Deck--&gt;&gt;Controller: 9
  Controller-&gt;&gt;Bus: emit('result')
  Bus-&gt;&gt;Sfx: play('ding')</code></pre>
<ol start="3">
<li><b>名詞表</b>：這個專案自己的用語。程式裡的 <code>round</code> 是一回合還是一局？<code>streak</code> 斷掉的條件是什麼？名詞對不上，是新人和老鳥溝通最大的障礙。</li>
<li><b>問題清單</b>：每一個「不知道」都寫下來，旁邊標狀態：自己查到了、問了誰、還沒答案。累積到五個，就是去找資深同事聊十五分鐘的最好時機，問題具體，對方也願意回答。</li>
<li><b>決策紀錄</b>：查到「為什麼這樣寫」的答案時（例如 blame 找到 #412），記一行：日期、決定、理由、連結。這正是程式碼本身最缺的東西。</li>
</ol>
<p>檢驗自己有沒有懂，最好的方法是講給別人聽，或在白板上不看程式把流程畫出來。卡住的地方，就是還沒懂的地方。</p>

<h3><span class="badge lv4">專家</span>九、資深工程師怎麼 review 程式</h3>
<p>Code review 也是讀程式，只是讀的是「差異」，而且有時間壓力。新手常從第一個檔案第一行開始看格式；資深的人順序剛好相反，先看最貴的問題：</p>
<figure class="figure"><svg viewBox="0 0 560 252" class="fg" style="width:100%;max-width:560px" role="img" aria-label="code review 的順序由上到下：為什麼、設計、正確性、測試、可讀性、風格；越上面的問題越貴，最後的風格交給工具">
<line x1="30" y1="34" x2="30" y2="226" class="fg-l on"/><polygon points="30,234 25.5,226 34.5,226" class="fg-a on"/>
<text x="42" y="24" class="fg-t sm acc">先看</text>
<rect x="50" y="34" width="130" height="30" rx="6" class="fg-b hot"/><text x="115" y="54" text-anchor="middle" class="fg-t">1 為什麼</text><text x="196" y="54" class="fg-t">PR 描述、需求：要解決的問題講清楚了嗎</text>
<rect x="50" y="70" width="130" height="30" rx="6" class="fg-b hot"/><text x="115" y="90" text-anchor="middle" class="fg-t">2 設計</text><text x="196" y="90" class="fg-t">改了哪些介面、型別、資料流，相依方向對嗎</text>
<rect x="50" y="106" width="130" height="30" rx="6" class="fg-b hot"/><text x="115" y="126" text-anchor="middle" class="fg-t">3 正確性</text><text x="196" y="126" class="fg-t">邊界值、錯誤處理、非同步時序、有沒有清理</text>
<rect x="50" y="142" width="130" height="30" rx="6" class="fg-b"/><text x="115" y="162" text-anchor="middle" class="fg-t">4 測試</text><text x="196" y="162" class="fg-t">新行為有被測到嗎，會不會時好時壞</text>
<rect x="50" y="178" width="130" height="30" rx="6" class="fg-b"/><text x="115" y="198" text-anchor="middle" class="fg-t">5 可讀性</text><text x="196" y="198" class="fg-t">命名、函式大小、半年後的人看得懂嗎</text>
<rect x="50" y="214" width="130" height="30" rx="6" class="fg-b alt"/><text x="115" y="234" text-anchor="middle" class="fg-t">6 風格</text><text x="196" y="234" class="fg-t">交給 formatter 和 linter，不要花人的時間</text>
</svg><figcaption>越上面的問題，越晚發現越貴：需求理解錯了，整個 PR 要重寫；設計錯了，要改很多檔案；風格問題，工具一秒就修好。</figcaption></figure>
<h4>前端和遊戲程式的檢查清單</h4>
<ul>
<li><b>清理</b>：每個 <code>on</code>、<code>addEventListener</code>、<code>setInterval</code>、<code>schedule</code>，都找得到對應的取消嗎？在哪個生命週期？</li>
<li><b>非同步時序</b>：使用者連點兩下會怎樣？兩個請求回來的順序相反會怎樣？請求還沒回來，畫面就被關掉了會怎樣？</li>
<li><b>狀態</b>：新加的布林旗標，會不會跟既有的旗標組合出不可能的狀態？</li>
<li><b>安全</b>：有沒有把使用者輸入（暱稱、聊天內容）塞進 <code>innerHTML</code> 或 <code>v-html</code>？前端程式裡有沒有出現金鑰？</li>
<li><b>效能</b>：遊戲的 <code>update</code> 裡有沒有每一格都 new 物件、建立閉包、做字串拼接？</li>
<li><b>看不到的部分</b>：資料格式改了，舊的存檔或快取怎麼辦？要不要功能開關？出事怎麼回滾？</li>
</ul>
<h4>大到看不完的 PR</h4>
<p>把分支拉到本機，真的跑起來；先讀測試和型別的改動，再依資料流的順序讀實作，而不是依檔名排序。留言時標清楚輕重，有一個常見的寫法慣例叫 Conventional Comments：<code>nit:</code> 是可改可不改的小地方，<code>question:</code> 是真的想知道，<code>issue:</code> 才是必須處理。最後，如果一個 PR 大到你沒辦法負責任地看完，直接說，並建議怎麼拆。小的 PR 被仔細看的機會，比大的高得多。</p>

<h3><span class="badge lv4">專家</span>十、實戰：追一次點擊，順便抓到一個 bug</h3>
<p>想像你剛加入一個團隊，接手一個網頁版的 Higher or Lower。第一張單是：「答對時，音效偶爾會響兩次。」沒有更多資訊。專案的結構如下：</p>
<pre><code>src/
  main.ts                啟動：建立 bus、deck，進入第一局
  core/events.ts         EventBus
  game/types.ts          Guess、RoundResult、GameEvents
  game/controller.ts     onGuess：一次猜測的流程
  game/rules.ts          isCorrect
  api/deck.ts            drawCard()：打 API
  ui/buttons.ts          綁定 Higher、Lower 按鈕
  ui/score-view.ts       訂閱 score，改分數標籤
  audio/sfx.ts           訂閱 result，播音效
  scenes/play-scene.ts   每一局的畫面：start、destroy</code></pre>
<h4>第一步：穩定重現</h4>
<p>「偶爾」是最難修的 bug，所以第一件事是找出規律。玩了幾次之後發現：第一局永遠正常，只要按「再來一局」進到第二局，每次答對都響兩次；第三局響三次。把這個步驟寫進單子裡。能穩定重現，就已經解決一半了：次數跟局數一起增加，很像有東西被重複訂閱。</p>
<h4>第二步：從結果往回找入口</h4>
<p>聲音是結果，搜尋音效檔名 <code>'ding'</code>，找到 <code>audio/sfx.ts</code>。它在 <code>mountSfx</code> 裡訂閱 <code>'result'</code>。對 <code>mountSfx</code> 找所有參考，只有一個地方呼叫它：<code>scenes/play-scene.ts</code> 的 <code>start()</code>。</p>
<pre><code>// core/events.ts
export type Handler&lt;T&gt; = (payload: T) =&gt; void;
export class EventBus&lt;E extends Record&lt;string, unknown&gt;&gt; {
  private handlers: { [K in keyof E]?: Set&lt;Handler&lt;E[K]&gt;&gt; } = {};
  on&lt;K extends keyof E&gt;(name: K, fn: Handler&lt;E[K]&gt;): () =&gt; void {
    const set = (this.handlers[name] ??= new Set&lt;Handler&lt;E[K]&gt;&gt;());
    set.add(fn);
    return () =&gt; { set.delete(fn); };
  }
  emit&lt;K extends keyof E&gt;(name: K, payload: E[K]): void {
    for (const fn of [...(this.handlers[name] ?? [])]) fn(payload);
  }
}

// game/types.ts
export type Guess = 'higher' | 'lower';
export interface RoundResult {
  guess: Guess;
  current: number;
  next: number;
  correct: boolean;
}
export type GameEvents = { score: number; result: RoundResult };

// audio/sfx.ts
import type { EventBus } from '../core/events';
import type { GameEvents } from '../game/types';
export function play(clip: string): void { console.log('play', clip); }
export function mountSfx(bus: EventBus&lt;GameEvents&gt;): () =&gt; void {
  return bus.on('result', r =&gt; play(r.correct ? 'ding' : 'buzz'));
}

// scenes/play-scene.ts
import type { EventBus } from '../core/events';
import type { GameEvents } from '../game/types';
import { mountSfx } from '../audio/sfx';
export class PlayScene {
  constructor(private bus: EventBus&lt;GameEvents&gt;) {}
  start(): void {
    mountSfx(this.bus);          // 回傳的取消函式被丟掉了
  }
  destroy(): void {
    console.log('scene destroyed');
  }
}

// main.ts
// 模擬玩兩局
import { EventBus } from './core/events';
import type { GameEvents } from './game/types';
import { PlayScene } from './scenes/play-scene';
const bus = new EventBus&lt;GameEvents&gt;();
for (let round = 1; round &lt;= 2; round++) {
  const scene = new PlayScene(bus);
  scene.start();
  const result = { guess: 'higher', current: 3, next: 9, correct: true } as const;
  bus.emit('result', result);
  scene.destroy();
}
// 第 1 局印一次 play ding，第 2 局印兩次</code></pre>
<p>讀到這裡已經很可疑：<code>mountSfx</code> 回傳了取消訂閱的函式，<code>start()</code> 卻把它丟掉了，而 <code>destroy()</code> 什麼都沒取消。bus 是在 main.ts 建立、整個程式共用的，所以每一局都在同一個 bus 上多掛一個聽眾。</p>
<h4>第三步：用除錯器證實，而不是相信自己</h4>
<p>在 <code>play</code> 那一行設一個 logpoint，印出 <code>clip</code>；再在同一行設一般中斷點。進第二局、答對一次：第一次停下時，呼叫堆疊是 <code>play</code> ← 箭頭函式 ← <code>emit</code> ← <code>onGuess</code>；按繼續，又停一次，堆疊一模一樣，只是箭頭函式是另一個。在 emit 裡看 handlers 的 Set，size 是 2。猜測成立。</p>
<figure class="figure"><svg viewBox="0 0 700 338" class="fg" style="width:100%;max-width:700px" role="img" aria-label="時序圖：按鈕呼叫 controller 的 onGuess，controller 呼叫狀態機、等待抽牌、呼叫規則，再對 bus 發出 result；bus 依序呼叫兩個 sfx 聽眾，第二個是第一局留下的">
<rect x="6" y="14" width="88" height="30" rx="6" class="fg-b"/><text x="50" y="34" text-anchor="middle" class="fg-t sm">按鈕</text>
<rect x="108" y="14" width="88" height="30" rx="6" class="fg-b hot"/><text x="152" y="34" text-anchor="middle" class="fg-t sm mono">controller</text>
<rect x="210" y="14" width="88" height="30" rx="6" class="fg-b"/><text x="254" y="34" text-anchor="middle" class="fg-t sm mono">machine</text>
<rect x="312" y="14" width="88" height="30" rx="6" class="fg-b"/><text x="356" y="34" text-anchor="middle" class="fg-t sm mono">deck API</text>
<rect x="414" y="14" width="88" height="30" rx="6" class="fg-b"/><text x="458" y="34" text-anchor="middle" class="fg-t sm mono">rules</text>
<rect x="516" y="14" width="88" height="30" rx="6" class="fg-b alt"/><text x="560" y="34" text-anchor="middle" class="fg-t sm mono">bus</text>
<rect x="606" y="14" width="88" height="30" rx="6" class="fg-b"/><text x="650" y="34" text-anchor="middle" class="fg-t sm mono">sfx</text>
<line x1="50" y1="44" x2="50" y2="310" class="fg-l dim dash"/><line x1="152" y1="44" x2="152" y2="310" class="fg-l dim dash"/><line x1="254" y1="44" x2="254" y2="310" class="fg-l dim dash"/><line x1="356" y1="44" x2="356" y2="310" class="fg-l dim dash"/><line x1="458" y1="44" x2="458" y2="310" class="fg-l dim dash"/><line x1="560" y1="44" x2="560" y2="310" class="fg-l dim dash"/><line x1="650" y1="44" x2="650" y2="310" class="fg-l dim dash"/>
<line x1="50" y1="74" x2="144" y2="74" class="fg-l on"/><polygon points="152,74 144,69.5 144,78.5" class="fg-a on"/><text x="58" y="66" class="fg-t sm mono">onGuess</text>
<line x1="152" y1="102" x2="246" y2="102" class="fg-l"/><polygon points="254,102 246,97.5 246,106.5" class="fg-a"/><text x="160" y="94" class="fg-t sm mono">go(revealing)</text>
<line x1="254" y1="124" x2="160" y2="124" class="fg-l dash"/><polygon points="152,124 160,119.5 160,128.5" class="fg-a"/><text x="166" y="118" class="fg-t sm mono">true</text>
<line x1="152" y1="152" x2="348" y2="152" class="fg-l alt"/><polygon points="356,152 348,147.5 348,156.5" class="fg-a alt"/><text x="160" y="144" class="fg-t sm mono alt">await draw()</text>
<line x1="356" y1="174" x2="160" y2="174" class="fg-l alt dash"/><polygon points="152,174 160,169.5 160,178.5" class="fg-a alt"/><text x="166" y="168" class="fg-t sm mono">9</text>
<line x1="152" y1="202" x2="450" y2="202" class="fg-l"/><polygon points="458,202 450,197.5 450,206.5" class="fg-a"/><text x="160" y="194" class="fg-t sm mono">isCorrect</text>
<line x1="458" y1="224" x2="160" y2="224" class="fg-l dash"/><polygon points="152,224 160,219.5 160,228.5" class="fg-a"/><text x="166" y="218" class="fg-t sm mono">true</text>
<line x1="152" y1="252" x2="552" y2="252" class="fg-l on"/><polygon points="560,252 552,247.5 552,256.5" class="fg-a on"/><text x="160" y="244" class="fg-t sm mono acc">emit(result)</text>
<line x1="560" y1="276" x2="642" y2="276" class="fg-l on"/><polygon points="650,276 642,271.5 642,280.5" class="fg-a on"/><text x="568" y="270" class="fg-t sm mono">#1 ding</text>
<line x1="560" y1="300" x2="642" y2="300" class="fg-l warm"/><polygon points="650,300 642,295.5 642,304.5" class="fg-a warm"/><text x="568" y="294" class="fg-t sm mono warm">#2 ding</text>
<text x="350" y="328" text-anchor="middle" class="fg-t sm warm">#2 是第 1 局留下、從來沒被取消的聽眾，所以第 2 局響兩次</text>
</svg><figcaption>一次點擊的完整路徑。藍線是非同步的那一段：controller 在這裡等網路，畫面上的按鈕已經被狀態機鎖住。最後 bus 依訂閱順序呼叫聽眾，第二個是上一局的殘留。</figcaption></figure>
<h4>第四步：問 git 為什麼會這樣</h4>
<p>直接修之前，先 blame <code>mountSfx(this.bus)</code> 這一行。它來自三個月前的一個 commit：「每局重新建立畫面，修正上一局的動畫殘留」。<code>git show</code> 一看就明白了：原本 <code>mountSfx</code> 在 main.ts 裡只呼叫一次，那位同事為了讓每一局有乾淨的畫面，把整段初始化搬進了 <code>PlayScene.start()</code>，順便也把音效的訂閱搬了進去。當時沒有人注意到，畫面是每局新建的，bus 卻是共用的。</p>
<p>這一步很重要：它告訴你<b>不能</b>把訂閱搬回 main.ts 了事，因為搬進來是有理由的；正確的修法是讓場景擁有自己的訂閱，並在離開時清掉。</p>
<h4>第五步：修，並留下一道防線</h4>
<pre><code>diff --git a/src/scenes/play-scene.ts b/src/scenes/play-scene.ts
 export class PlayScene {
+  private offSfx: (() =&gt; void) | null = null;
   constructor(private bus: EventBus&lt;GameEvents&gt;) {}
   start(): void {
-    mountSfx(this.bus);          // 回傳的取消函式被丟掉了
+    this.offSfx = mountSfx(this.bus);
   }
   destroy(): void {
+    this.offSfx?.();
+    this.offSfx = null;
     console.log('scene destroyed');
   }
 }</code></pre>
<p>再加一個測試：建立同一個 bus，連續跑三局 <code>start</code>、<code>emit</code>、<code>destroy</code>，斷言每局只播一次。這個測試會在下一個人又把訂閱搬來搬去時擋住他。PR 描述寫清楚三件事：重現步驟、根本原因（訂閱沒有在 destroy 取消，連到那個搬移的 commit）、為什麼選這個修法。</p>
<p>回頭數一數：整個過程讀了不到一百行，用到了搜尋、找所有參考、logpoint、中斷點、呼叫堆疊、git blame 和 git show。沒有一步是「把專案從頭讀一遍」。</p>

<h3>十一、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>要先把整個專案讀懂，才能開始改</td><td>只需要懂你要改的那條路，以及它的邊界。其他部分當黑盒子，需要時再打開。</td></tr>
<tr><td>git blame 是拿來找戰犯的</td><td>它是拿來找「理由」的：那個 commit 的訊息、PR、需求單，常常解釋了奇怪的程式。</td></tr>
<tr><td>加 console.log 比用除錯器快</td><td>簡單的情況是。但條件中斷點、事件監聽中斷點和呼叫堆疊，能回答 log 很難回答的「誰呼叫的」「誰改的」。</td></tr>
<tr><td>跳到定義可以追完任何流程</td><td>遇到事件、字串名稱、編輯器裡設定的連線、依賴注入，跳到定義就斷了，要改用搜尋。</td></tr>
<tr><td>有型別的地方就可以完全相信</td><td><code>as any</code>、<code>@ts-ignore</code>、非空斷言和沒開 strict 的設定，都會讓型別說謊。</td></tr>
<tr><td>Code review 主要在挑風格</td><td>風格交給工具。人的時間要花在需求、設計、正確性和測試上。</td></tr>
</table>

<h3>十二、跟你的工作連起來</h3>
<ul>
<li><b>Vue 專案</b>：入口是 main.ts 和 router 的路由表；Vue Devtools 從畫面反查元件；元件的狀態流向多半在 Pinia store，先讀 store 的型別和 actions。</li>
<li><b>Cocos 專案</b>：入口是起始場景和節點上的元件；很多連線（按鈕的 Click Events、屬性面板拖進去的節點）只存在場景檔裡，程式碼搜不到，要打開編輯器看；在瀏覽器預覽時，就能用上面所有的 Chrome 除錯技巧。</li>
<li><b>Node.js、Go 後端</b>：入口是路由表、訊息佇列的消費者、排程工作；用 <code>--inspect</code> 接除錯器，用日誌裡的請求 ID 把一個請求的路串起來。</li>
<li><b>Docker 與雲端主機上的問題</b>：讀 Dockerfile、CI 設定和環境變數，往往比讀程式更快找到「為什麼正式環境跟本機不一樣」。</li>
</ul>

<h3>十三、面試會怎麼問</h3>
<ol>
<li>「你加入一個新團隊，面對一個很大的程式庫，第一週會怎麼做？」</li>
<li>「有一個你沒看過的 bug：某個按鈕偶爾沒反應。你會怎麼找？」</li>
<li>「你怎麼做 code review？會先看什麼、後看什麼？」</li>
<li>「git blame 指到一個格式化的 commit，你怎麼找到真正的來源？怎麼找出 bug 是哪一個 commit 引入的？」</li>
<li>「除了一般的中斷點，你還會用哪些除錯工具？」</li>
<li>「要改一段沒有測試、你也還沒完全看懂的舊程式，你怎麼降低風險？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>先讓專案在本機跑起來，看 README、package.json 的 scripts、CI 設定和資料夾結構，掌握技術選擇和建置方式。然後挑一個真實的小任務或一個核心功能，從入口追到畫面，邊追邊寫一頁地圖和問題清單。用 git log 找出最常被修改的熱點檔案和最近活躍的人。累積具體問題後找資深同事問。第一週的目標是能獨立完成一個小改動，而不是讀完所有程式。</li>
<li>先穩定重現，找出「偶爾」的規律：哪個畫面、第幾次、網路快慢。再從按鈕找到處理函式，可以用 Elements 面板的 Event Listeners 或事件監聽中斷點。接著檢查會讓處理函式提早返回的條件，例如狀態機的守衛、loading 旗標、重複點擊保護，用條件中斷點或 logpoint 看當下的值。常見原因是狀態卡住（非同步失敗後沒把旗標重設）或者被別的元素蓋住。修完補上一個重現這個情況的測試。</li>
<li>先讀描述和需求，確認要解決的問題；再看設計：介面、型別、資料流和相依方向；然後是正確性：邊界值、錯誤處理、非同步時序、資源有沒有清理、安全問題；接著看測試是否涵蓋新行為；最後才是可讀性。格式交給工具。PR 太大時會在本機跑起來、依資料流的順序讀，並建議拆小。留言會標明輕重，例如 nit、question、issue。</li>
<li>把格式化 commit 加進 .git-blame-ignore-revs 並設定 blame.ignoreRevsFile，或用 git log -S 搜尋那段字串第一次出現的 commit，或用 git log -L 看那幾行的演變。找引入 bug 的 commit 用 git bisect：標記一個好的版本和一個壞的版本，讓 git 二分搜尋；有能自動判斷的測試時，用 git bisect run 全自動完成。</li>
<li>條件中斷點和 logpoint，用來在罕見情況停下或印值而不改程式；事件監聽中斷點，找不知道在哪裡的點擊處理函式；DOM 中斷點，找出誰改了某個元素；fetch 中斷點，找出請求從哪裡發出；例外時暫停，抓被吞掉的錯誤。另外會設定忽略清單，讓呼叫堆疊只剩自己的程式，並利用非同步堆疊看出 await 之前的呼叫者。</li>
<li>先寫「描述現狀」的測試（characterization test）：不管現在的行為對不對，先用測試把它固定下來，這樣我改完就知道有沒有不小心改變別的行為。再用 git 歷史了解那段程式的來由，改動盡量小、一次只改一件事，並分成「純重構」和「改行為」兩個 commit。風險高的改動加上功能開關，讓出事時能快速關掉。</li>
</ol>
</details>

<h3>十四、練功題（做得出來才算真的懂）</h3>
<ol>
<li>在你參與的任何一個 git 專案裡，跑第六節的熱點指令。前五名的檔案，你知道它們各自負責什麼嗎？挑一個你最不熟的，寫一頁地圖。</li>
<li>打開任何一個你常用的網站，在 Sources 面板勾選 Event Listener Breakpoints 的 Mouse click，點一個按鈕。程式停在哪個檔案？用呼叫堆疊說出它是怎麼走到那裡的。</li>
<li>在一個有歷史的專案裡，挑一行你覺得奇怪的程式，用 <code>git log -S</code> 找出它第一次出現的 commit，讀那個 commit 的完整差異和訊息。它解釋了這行為什麼存在嗎？</li>
<li>只讀第四節的 <code>game/types.ts</code>，不看任何實作，寫出：這個遊戲有哪些狀態、會發出哪些事件、至少三個你還不知道答案的問題。</li>
<li>假設你在 review 下面這段新程式。找出至少三個問題，並說出每一個的後果和修法。
<pre><code>declare const bus: { on(name: 'score', fn: (s: number) =&gt; void): () =&gt; void };
declare function fetchTop(): Promise&lt;{ name: string; best: number }[]&gt;;

export class Leaderboard {
  constructor(private root: HTMLElement) {}
  open(): void {
    bus.on('score', () =&gt; { void this.refresh(); });
  }
  async refresh(): Promise&lt;void&gt; {
    const rows = await fetchTop();
    this.root.innerHTML = rows
      .map(r =&gt; '&lt;li&gt;' + r.name + ': ' + r.best + '&lt;/li&gt;')
      .join('');
  }
  close(): void {
    this.root.innerHTML = '';
  }
}</code></pre></li>
<li>用 Mermaid 的 sequenceDiagram，畫出你自己專案裡某一個按鈕從點擊到畫面更新的過程，至少標出一個非同步的地方。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>答案因專案而異。重點是注意前幾名通常是又長又常改的檔案（大型控制器、共用的工具、路由表），它們是最值得先讀懂、也最值得在 review 時多看一眼的地方。</li>
<li>通常會先停在框架或第三方程式裡。把那些檔案加進忽略清單再點一次，就會直接停在網站自己的處理函式；呼叫堆疊由下往上讀，就是事件從瀏覽器一路傳到那個函式的路徑。</li>
<li>答案因專案而異。如果 commit 訊息只寫「fix」，再看它的 PR 或同一時期的其他 commit；找不到理由時，把問題記進問題清單，去問當時的作者或負責人。</li>
<li>狀態有 idle、guessing、revealing、over 四種，只有 revealing 同時知道兩張牌，over 帶著最終分數。事件有 score、result、phase 三種。問題例如：牌的點數範圍是多少？兩張牌相同時算對還是錯？抽牌失敗（網路錯誤）時會進到哪個狀態？phase 事件是每次改變都發，還是只在某些時候發？</li>
<li>第一，<code>open()</code> 丟掉了 <code>on</code> 回傳的取消函式，<code>close()</code> 也沒取消：關掉排行榜後還會在每次得分時打 API、寫進已關閉的元素，開關幾次就有幾個聽眾。修法是存下取消函式，在 close 裡呼叫。第二，把玩家暱稱直接拼進 <code>innerHTML</code>，暱稱裡如果有 HTML 或腳本就會被執行，是跨站腳本攻擊（XSS）。修法是用 <code>textContent</code> 建立每個 li，或交給框架的資料綁定。第三，連續得分會同時發出好幾個請求，較早的回應可能較晚回來，蓋掉較新的資料；而且 close 之後才回來的回應，還是會寫進畫面。修法是記錄請求的序號，只採用最新一次的結果，並在 close 時標記失效（或用 AbortController 取消請求）。</li>
<li>答案因專案而異。檢查你的圖：每一個箭頭都對得到程式裡的一個呼叫或事件嗎？非同步的地方（await、事件、計時器）有沒有標出來？畫的過程中卡住的地方，就是下一個要讀的地方。</li>
</ol>
</details>

<h3>十五、想再挖深</h3>
<ul>
<li><b>Michael Feathers《Working Effectively with Legacy Code》</b>：怎麼在沒有測試、看不完的舊程式裡安全地修改，「描述現狀的測試」就是出自這本。</li>
<li><b>Google Engineering Practices：Code Review Developer Guide</b>（<a href="https://google.github.io/eng-practices/">google.github.io/eng-practices</a>）：Google 公開的 code review 指南，分成「怎麼 review」和「怎麼寫好被 review 的變更」兩部分，篇幅不長。</li>
<li><b>Chrome DevTools 文件〈Pause your code with breakpoints〉</b>（<a href="https://developer.chrome.com/docs/devtools/javascript/breakpoints">developer.chrome.com/docs/devtools</a>）：第七節每一種中斷點的官方說明和截圖。</li>
<li><b>《Pro Git》</b>（免費線上版 <a href="https://git-scm.com/book">git-scm.com/book</a>）：log、blame、bisect 的完整用法，網站上也有中文翻譯版。</li>
<li><b>Adam Tornhill《Your Code as a Crime Scene》</b>：用 git 歷史找熱點、找出哪些檔案總是一起改，第六節熱點指令的延伸。</li>
</ul>
` });
