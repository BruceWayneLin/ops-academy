DEEP({ 'cc-debug': `
<p>上一課是一張「症狀 → 原因 → 解法」的清單，能解決你會遇到的大部分 bug。這一章處理剩下那些：清單上沒有的、只在某一支手機上發生的、十次才出現一次的。要對付它們，靠的不是經驗，是一套方法：怎麼重現、怎麼縮小範圍、怎麼提出可以被推翻的假設，以及怎麼用工具驗證。工具這一半，我們會把瀏覽器的開發者工具、引擎的統計面板一行一行拆開，再接上真的手機。最後講手機上特有的當機和卡死，以及上線之後，你人不在現場時，怎麼靠日誌知道發生了什麼。</p>

<h3><span class="badge lv1">基礎</span>一、除錯是一套方法，不是靈感</h3>
<p>醫生看病不會一進門就開藥。他先問症狀、量體溫（重現），再排除不可能的器官（隔離），接著提出「我懷疑是某某，如果是的話，驗血會看到某某」（假設），最後真的去驗（驗證）。除錯完全一樣：</p>
<figure class="figure"><svg viewBox="0 22 640 234" class="fg" style="width:100%;max-width:640px" role="img" aria-label="除錯的循環：重現、隔離、假設、驗證，最後修好並留下檢查；預測不準時回到假設，範圍縮不下來時回到重現">
<rect x="10" y="40" width="108" height="76" rx="6" class="fg-b alt"/><text x="64" y="66" text-anchor="middle" class="fg-t acc">重現</text><text x="64" y="86" text-anchor="middle" class="fg-t sm">穩定做出來</text><text x="64" y="102" text-anchor="middle" class="fg-t sm">記下版本與步驟</text>
<line x1="118" y1="78" x2="130" y2="78" class="fg-l"/><polygon points="138,78 130,73.5 130,82.5" class="fg-a"/>
<rect x="138" y="40" width="108" height="76" rx="6" class="fg-b alt"/><text x="192" y="66" text-anchor="middle" class="fg-t acc">隔離</text><text x="192" y="86" text-anchor="middle" class="fg-t sm">砍掉一半</text><text x="192" y="102" text-anchor="middle" class="fg-t sm">縮小範圍</text>
<line x1="246" y1="78" x2="258" y2="78" class="fg-l"/><polygon points="266,78 258,73.5 258,82.5" class="fg-a"/>
<rect x="266" y="40" width="108" height="76" rx="6" class="fg-b alt"/><text x="320" y="66" text-anchor="middle" class="fg-t acc">假設</text><text x="320" y="86" text-anchor="middle" class="fg-t sm">說出原因</text><text x="320" y="102" text-anchor="middle" class="fg-t sm">和會看到什麼</text>
<line x1="374" y1="78" x2="386" y2="78" class="fg-l"/><polygon points="394,78 386,73.5 386,82.5" class="fg-a"/>
<rect x="394" y="40" width="108" height="76" rx="6" class="fg-b alt"/><text x="448" y="66" text-anchor="middle" class="fg-t acc">驗證</text><text x="448" y="86" text-anchor="middle" class="fg-t sm">只改一個變數</text><text x="448" y="102" text-anchor="middle" class="fg-t sm">看預測準不準</text>
<line x1="502" y1="78" x2="514" y2="78" class="fg-l on"/><polygon points="522,78 514,73.5 514,82.5" class="fg-a on"/>
<rect x="522" y="40" width="108" height="76" rx="6" class="fg-b hot"/><text x="576" y="66" text-anchor="middle" class="fg-t acc">修好＋留檢查</text><text x="576" y="86" text-anchor="middle" class="fg-t sm">測試或清單</text><text x="576" y="102" text-anchor="middle" class="fg-t sm">下次一分鐘</text>
<path d="M448 116 V150 H320 V124" class="fg-l warm"/><polygon points="320,116 315.5,124 324.5,124" class="fg-a warm"/>
<text x="384" y="168" text-anchor="middle" class="fg-t sm warm">預測不準：換一個假設</text>
<path d="M192 116 V196 H64 V124" class="fg-l alt"/><polygon points="64,116 59.5,124 68.5,124" class="fg-a alt"/>
<text x="128" y="214" text-anchor="middle" class="fg-t sm alt">範圍縮不下來：回去補重現</text>
<text x="320" y="246" text-anchor="middle" class="fg-t sm">多數人跳過前兩步直接猜，所以一個 bug 才會修三天</text>
</svg><figcaption>四個步驟各有各的產出：一份能重現的步驟、一個夠小的範圍、一句能被推翻的話、一次只改一件事的實驗。少了哪一個，就會在原地繞圈。</figcaption></figure>
<p>最常見的錯，是從「看到症狀」直接跳到「改程式碼」。改了，症狀好像不見了，但你不知道是真的修好，還是剛好這次沒出現。這種「修好」通常兩週後會回來，而且那時候你已經忘了改過什麼。</p>
<p>「假設」這一步有個判斷標準：<b>一個好的假設會說出你接下來會看到什麼</b>。「可能是記憶體的問題」不是假設，什麼結果都推翻不了它。「每開一次設定畫面，監聽器就多一個；所以開過兩次之後，點一下會觸發三次」才是假設，因為它可以被一個簡單的實驗證明是錯的。</p>

<h3><span class="badge lv1">基礎</span>二、先能重現：一份好的 bug 回報長什麼樣</h3>
<p>重現不了的 bug，你什麼都證明不了。所以第一步是把「有時候會卡住」變成「照這幾步做，十次會出現八次」。下面是一份回報應該有的欄位，缺的就去問，或在遊戲裡自動附上：</p>
<table>
<tr><th>欄位</th><th>例子</th><th>為什麼需要</th></tr>
<tr><td>版本</td><td>1.4.2（a1b2c3d）</td><td>不知道版本，就不知道該看哪一份程式碼</td></tr>
<tr><td>裝置與瀏覽器</td><td>iPhone 11、iOS 17、Safari</td><td>手機上的 bug 一半跟裝置有關</td></tr>
<tr><td>步驟</td><td>開遊戲 → 進設定 → 返回 → 猜 Higher</td><td>你要能照著做一次</td></tr>
<tr><td>預期和實際</td><td>預期加 1 分，實際加 2 分</td><td>有時候「bug」其實是規則沒講清楚</td></tr>
<tr><td>頻率</td><td>10 次有 8 次</td><td>決定你需要試幾次，才能說「修好了」</td></tr>
<tr><td>當下的狀態</td><td>截圖、日誌、連線狀態</td><td>上一課說的「畫面角落的除錯資訊」就是為這一格準備的</td></tr>
</table>
<p>頻率很重要。一個 10 次出現 8 次的 bug，你改完試 5 次都沒出現，就有很高的把握；一個 10 次出現 1 次的 bug，試 5 次沒出現，什麼都不能說明（每次有九成機會不出現，連續 5 次不出現的機率還有大約 59%）。低頻率的 bug，要先想辦法讓它變得常出現：把模擬伺服器的延遲調大、把動畫速度調慢、用腳本連點一百次。</p>
<p>能重現之後，再把它<b>縮小</b>：刪掉跟它無關的步驟，直到剩下最短的那條路。「進設定 → 返回 → 猜」比「玩五局、進設定、去商店、再回來猜」好查十倍。</p>

<h3><span class="badge lv2">進階</span>三、隔離：每次砍掉一半</h3>
<p>隔離最強的工具是<b>二分法</b>（bisection）。你知道 1.3 版是好的，1.4 版壞了，中間有 200 個 commit。一個一個試要 200 次；每次測中間那一個、丟掉一半，只要 8 次。</p>
<figure class="figure"><svg viewBox="0 0 680 240" class="fg" style="width:100%;max-width:680px" role="img" aria-label="二分法：在 200 個 commit 之間，每次測中間那一個，範圍從 200 個縮到 100、50、25、12 個，總共 8 步找到第一個壞掉的 commit">
<text x="70" y="26" class="fg-t sm acc">#0：正常</text>
<text x="270" y="26" text-anchor="middle" class="fg-t sm">#100</text>
<text x="470" y="26" text-anchor="end" class="fg-t sm warm">#200：壞了</text>
<text x="10" y="60" class="fg-t">第 1 步</text>
<line x1="70" y1="56" x2="470" y2="56" class="fg-l dim"/><rect x="70" y="47" width="400" height="18" rx="4" class="fg-b hot"/><circle cx="270" cy="56" r="5" class="fg-lamp on"/>
<text x="490" y="60" class="fg-t sm">測 #100：正常</text>
<text x="10" y="100" class="fg-t">第 2 步</text>
<line x1="70" y1="96" x2="470" y2="96" class="fg-l dim"/><rect x="270" y="87" width="200" height="18" rx="4" class="fg-b hot"/><circle cx="370" cy="96" r="5" class="fg-lamp on"/>
<text x="490" y="100" class="fg-t sm warm">測 #150：壞了</text>
<text x="10" y="140" class="fg-t">第 3 步</text>
<line x1="70" y1="136" x2="470" y2="136" class="fg-l dim"/><rect x="270" y="127" width="100" height="18" rx="4" class="fg-b hot"/><circle cx="320" cy="136" r="5" class="fg-lamp on"/>
<text x="490" y="140" class="fg-t sm">測 #125：正常</text>
<text x="10" y="180" class="fg-t">第 4 步</text>
<line x1="70" y1="176" x2="470" y2="176" class="fg-l dim"/><rect x="320" y="167" width="50" height="18" rx="4" class="fg-b hot"/><circle cx="344" cy="176" r="5" class="fg-lamp on"/>
<text x="490" y="180" class="fg-t sm warm">測 #137：壞了</text>
<text x="10" y="220" class="fg-t">之後</text>
<line x1="70" y1="216" x2="470" y2="216" class="fg-l dim"/><rect x="320" y="207" width="24" height="18" rx="4" class="fg-b hot"/>
<text x="490" y="220" class="fg-t sm acc">再 4 步，剩 1 個</text>
</svg><figcaption>綠色是「壞掉的那個 commit 一定在這裡面」的範圍。每測一次，範圍砍半：200、100、50、25、12、6、3、2、1。2 的 8 次方是 256，所以 8 次一定夠。</figcaption></figure>
<p>git 內建這個流程，你只要回答「好」或「壞」：</p>
<pre><code>git bisect start
git bisect bad v1.4.0        # 壞掉的版本
git bisect good v1.3.0       # 確定正常的版本
# git 切到中間的 commit；建置、測試，然後告訴它結果：
git bisect good              # 或 git bisect bad
# ……重複到 git 印出第一個壞掉的 commit
git bisect reset             # 回到原本的分支
</code></pre>
<p>二分法不只能用在 commit 上。任何「一大堆東西裡，有一個是兇手」的情況都適用：</p>
<ul>
<li><b>節點</b>：畫面上有東西擋住點擊，但不知道是誰。把 Canvas 底下的子節點停用一半，問題還在嗎？在，兇手就在另一半。</li>
<li><b>資料</b>：某一局的牌堆會讓遊戲卡住。把那 52 張牌切一半給模擬伺服器，看哪一半能重現。</li>
<li><b>環境</b>：把真伺服器換成模擬伺服器。問題還在，就跟網路無關；不見了，就去看網路和伺服器那一側。</li>
</ul>
<h4>從頭到尾追一個 bug</h4>
<p>回報：「每開一次設定畫面，翻牌音效就多響一次。」</p>
<ol>
<li><b>重現</b>：開遊戲、翻牌，響一次。進設定、返回、翻牌，聽起來像兩次疊在一起。照做三遍都一樣，頻率 100%。</li>
<li><b>隔離</b>：把模擬伺服器的延遲調成 0，問題還在，跟網路無關。直接在主控台觸發一次 Model 的 <code>changed</code> 事件，也會響兩次，所以跟點擊、跟狀態機都無關，範圍縮到「誰在聽 changed」。</li>
<li><b>假設</b>：三個候選，各有不同的預測。(a) 音效檔本身有回音：預測不管開幾次設定，都是「兩聲」。(b) 場景裡有兩個 SoundView：預測從一開始就是兩聲。(c) SoundView 在 <code>onEnable</code> 註冊監聽器，卻沒在 <code>onDisable</code> 移除：預測開過 n 次設定，就響 n + 1 次。</li>
<li><b>驗證</b>：在播放音效那一行加一個 logpoint（下一節講），分別在開過 0、1、2 次設定之後翻牌，數 log 印了幾行：1、2、3。只有 (c) 預測對了。</li>
<li><b>修好並留檢查</b>：補上 <code>onDisable</code> 裡的 <code>off</code>。再照做一次，開過 5 次設定還是只印 1 行。最後把「on 一定要配 off」加進 code review 清單。</li>
</ol>
<p>注意第 3 步：三個假設在「開 0 次」的時候預測都可能是一聲或兩聲，分不出來；但在「開 2 次」的時候，三個預測完全不同。<b>設計實驗，就是去找那個能讓假設們說出不同答案的情境。</b></p>

<h3><span class="badge lv2">進階</span>四、瀏覽器開發者工具：中斷點與 source map</h3>
<h4>source map：讓你看到自己寫的 TypeScript</h4>
<p>瀏覽器跑的永遠是 JavaScript。預覽的時候，這份 JavaScript 是從你的 TypeScript 轉出來的；建置之後，它還被縮小過，整個 main 包可能只有一行。你之所以能在 Sources 面板看到 <code>GameController.ts</code> 第 57 行，是因為有一份 <b>source map</b>：一張「產物的第幾行第幾欄，對應到原始檔的第幾行第幾欄」的對照表。</p>
<figure class="figure"><svg viewBox="0 0 660 176" class="fg" style="width:100%;max-width:660px" role="img" aria-label="source map 的運作：瀏覽器在縮小過的 index.js 第 1 行第 48213 欄暫停，查 .map 對照表，換成 GameController.ts 第 57 行顯示給你看">
<rect x="10" y="20" width="180" height="92" rx="6" class="fg-b warm"/>
<text x="100" y="44" text-anchor="middle" class="fg-t">瀏覽器實際在跑的</text>
<text x="100" y="66" text-anchor="middle" class="fg-t sm mono">index.8f3c2.js</text>
<text x="100" y="84" text-anchor="middle" class="fg-t sm">第 1 行，第 48213 欄</text>
<text x="100" y="102" text-anchor="middle" class="fg-t sm mono">fsm.go("revealing",t)</text>
<line x1="190" y1="66" x2="232" y2="66" class="fg-l"/><polygon points="240,66 232,61.5 232,70.5" class="fg-a"/>
<text x="215" y="86" text-anchor="middle" class="fg-t sm">查表</text>
<rect x="240" y="20" width="180" height="92" rx="6" class="fg-b alt"/>
<text x="330" y="44" text-anchor="middle" class="fg-t">對照表 .map</text>
<text x="330" y="66" text-anchor="middle" class="fg-t sm mono">index.8f3c2.js.map</text>
<text x="330" y="84" text-anchor="middle" class="fg-t sm">產物位置 → 原始位置</text>
<text x="330" y="102" text-anchor="middle" class="fg-t sm mono">1:48213 → 57:5</text>
<line x1="420" y1="66" x2="462" y2="66" class="fg-l on"/><polygon points="470,66 462,61.5 462,70.5" class="fg-a on"/>
<text x="445" y="86" text-anchor="middle" class="fg-t sm">換成</text>
<rect x="470" y="20" width="180" height="92" rx="6" class="fg-b hot"/>
<text x="560" y="44" text-anchor="middle" class="fg-t acc">你在 DevTools 看到的</text>
<text x="560" y="66" text-anchor="middle" class="fg-t sm mono">GameController.ts</text>
<text x="560" y="84" text-anchor="middle" class="fg-t sm">第 57 行</text>
<text x="560" y="102" text-anchor="middle" class="fg-t sm mono">fsm.go('revealing', g)</text>
<text x="330" y="142" text-anchor="middle" class="fg-t sm">沒有 .map：你只能看到一整行壓縮過的程式</text>
<text x="330" y="162" text-anchor="middle" class="fg-t sm">屬性名（fsm、go）通常保留，區域變數（g → t）會被改短</text>
</svg><figcaption>source map 只是一張對照表，程式本身一點都沒變。所以中斷點、例外的堆疊、效能面板的函式名稱，都能透過它翻回你的原始碼。</figcaption></figure>
<p>建置面板有 Source Maps 的選項。要不要讓 <code>.map</code> 跟著上 CDN，是一個資安決定：有了它，任何人都能在瀏覽器裡看到你的原始碼。常見的做法是建置時產生 <code>.map</code>，但不公開上傳，而是交給錯誤追蹤服務，或留在內部。真的要在正式環境的頁面上除錯時，Chrome 可以在 Sources 面板裡對某個腳本按右鍵，用「Add source map」手動掛上你本機的那份。</p>
<h4>中斷點不只一種</h4>
<table>
<tr><th>種類</th><th>怎麼下</th><th>什麼時候用</th></tr>
<tr><td>一般中斷點</td><td>點行號</td><td>知道大概在哪一行</td></tr>
<tr><td>條件中斷點</td><td>行號按右鍵，例如條件 <code>score &gt; 10</code></td><td>一個每幀都會跑的函式，只有某種情況才出錯</td></tr>
<tr><td>logpoint</td><td>行號按右鍵，填要印的東西</td><td>不想停住遊戲，只想知道經過幾次、值是多少；不用改程式碼</td></tr>
<tr><td>例外時暫停</td><td>Sources 面板的「Pause on exceptions」，可以連被捕捉的也停</td><td>錯誤被某個 <code>try/catch</code> 或 <code>.catch()</code> 吞掉了</td></tr>
<tr><td>事件與網路中斷點</td><td>Event Listener Breakpoints、XHR/fetch Breakpoints</td><td>不知道是哪段程式碼在處理觸控，或是誰發了某個請求</td></tr>
<tr><td><code>debugger;</code></td><td>寫在程式碼裡</td><td>條件很複雜時：<code>if (deck.length === 0 &amp;&amp; !over) debugger;</code></td></tr>
</table>
<div class="warn"><b>中斷點會改變你要觀察的東西。</b>停在中斷點時，整條主執行緒都停了：遊戲迴圈、計時器、WebSocket 訊息的處理，全部暫停。伺服器那邊卻沒停，如果它每 10 秒等一次心跳，你停 30 秒，它就把你斷線了，於是你開始除錯一個「你自己造成的」斷線。恢復執行後，累積的計時器和訊息會一口氣湧進來，下一幀的時間差也特別大。所以跟時間有關的 bug（倒數、動畫、網路順序），用 logpoint，不要用中斷點。</div>

<h3><span class="badge lv2">進階</span>五、統計面板逐行解讀</h3>
<p>在主控台執行 <code>cc.profiler.showStats()</code>，畫面角落會出現一個小面板。它是你在手機上最快能拿到的效能數字。下面是一個健康的猜高低畫面大概的樣子：</p>
<figure class="figure"><svg viewBox="0 0 560 270" class="fg" style="width:100%;max-width:560px" role="img" aria-label="Cocos 統計面板的十行數字，分成四組：時間、GPU 的工作量、CPU 時間的三個部分、顯示記憶體的估計">
<rect x="20" y="24" width="270" height="236" rx="6" class="fg-b"/>
<text x="34" y="54" class="fg-t sm mono">Frame time (ms)</text><text x="278" y="54" text-anchor="end" class="fg-t sm mono">16.7</text>
<text x="34" y="76" class="fg-t sm mono">Framerate (FPS)</text><text x="278" y="76" text-anchor="end" class="fg-t sm mono">60</text>
<text x="34" y="98" class="fg-t sm mono">Draw call</text><text x="278" y="98" text-anchor="end" class="fg-t sm mono">12</text>
<text x="34" y="120" class="fg-t sm mono">Instance Count</text><text x="278" y="120" text-anchor="end" class="fg-t sm mono">0</text>
<text x="34" y="142" class="fg-t sm mono">Triangle</text><text x="278" y="142" text-anchor="end" class="fg-t sm mono">184</text>
<text x="34" y="164" class="fg-t sm mono">Game Logic (ms)</text><text x="278" y="164" text-anchor="end" class="fg-t sm mono">1.8</text>
<text x="34" y="186" class="fg-t sm mono">Physics (ms)</text><text x="278" y="186" text-anchor="end" class="fg-t sm mono">0.0</text>
<text x="34" y="208" class="fg-t sm mono">Renderer (ms)</text><text x="278" y="208" text-anchor="end" class="fg-t sm mono">2.4</text>
<text x="34" y="230" class="fg-t sm mono">GFX Texture Mem(M)</text><text x="278" y="230" text-anchor="end" class="fg-t sm mono">38.5</text>
<text x="34" y="252" class="fg-t sm mono">GFX Buffer Mem(M)</text><text x="278" y="252" text-anchor="end" class="fg-t sm mono">1.2</text>
<path d="M298 40 H304 V82 H298" class="fg-l"/>
<text x="316" y="56" class="fg-t acc">時間</text><text x="316" y="74" class="fg-t sm">16.7 ms 內才有 60 FPS</text>
<path d="M298 86 H304 V148 H298" class="fg-l"/>
<text x="316" y="110" class="fg-t acc">GPU 的工作量</text><text x="316" y="128" class="fg-t sm">幾道命令、幾個三角形</text>
<path d="M298 152 H304 V214 H298" class="fg-l"/>
<text x="316" y="176" class="fg-t acc">CPU 時間拆三份</text><text x="316" y="194" class="fg-t sm">腳本、物理、準備繪製</text>
<path d="M298 218 H304 V258 H298" class="fg-l"/>
<text x="316" y="234" class="fg-t acc">顯示記憶體（估計）</text><text x="316" y="252" class="fg-t sm">貼圖、緩衝區，單位 MB</text>
</svg><figcaption>十行可以分成四組來讀。實際的名稱和順序，依引擎版本可能有一兩行不同，以你畫面上看到的為準。</figcaption></figure>
<table>
<tr><th>這一行</th><th>意思</th><th>怎麼讀</th></tr>
<tr><td>Frame time</td><td>兩幀之間平均隔多久，毫秒</td><td>60 FPS 的預算是 1000 &divide; 60 &asymp; 16.7 ms</td></tr>
<tr><td>Framerate</td><td>每秒幾幀</td><td>是一小段時間的平均，偶爾一次卡 100 ms 會被平均掉；抓卡頓要用 Performance 面板</td></tr>
<tr><td>Draw call</td><td>這一幀送給顯示晶片幾道繪製命令</td><td>2D 卡牌遊戲常見十幾到幾十。上百，就去查合批為什麼被切斷</td></tr>
<tr><td>Instance Count</td><td>用 GPU instancing 一次畫多個物件的數量</td><td>主要是 3D 用的，2D 遊戲通常是 0</td></tr>
<tr><td>Triangle</td><td>這一幀送出的三角形數</td><td>一個一般的 Sprite 是 2 個三角形，九宮格切圖是 18 個</td></tr>
<tr><td>Game Logic</td><td>元件的 <code>update</code>、<code>lateUpdate</code>、計時器、補間動畫</td><td>就是你寫的大部分程式。這個數字高，問題在腳本</td></tr>
<tr><td>Physics</td><td>物理模擬</td><td>沒用物理就是 0</td></tr>
<tr><td>Renderer</td><td>CPU 這一側整理場景、合批、送出繪製命令的時間</td><td>不包含顯示晶片真正畫圖的時間，那一段在這個面板上看不到</td></tr>
<tr><td>GFX Texture Mem</td><td>引擎建立的貼圖估計佔多少顯示記憶體</td><td>一局一局往上爬，就是貼圖沒釋放</td></tr>
<tr><td>GFX Buffer Mem</td><td>頂點、索引這些緩衝區</td><td>2D 遊戲通常很小</td></tr>
</table>
<h4>一幀的預算怎麼花</h4>
<p>面板最有用的讀法，是把 Game Logic 和 Renderer 加起來，跟 Frame time 比。下面三種情況，FPS 可能都不好看，原因卻完全不同：</p>
<figure class="figure"><svg viewBox="0 0 680 256" class="fg" style="width:100%;max-width:680px" role="img" aria-label="三種幀的時間分配：健康的幀在 16.7 毫秒內做完還有空閒；腳本太重的幀超過 16.7 毫秒，錯過一次畫面更新，變成 33.3 毫秒；CPU 很閒卻慢的幀，面板上的時間很少，但其他東西佔掉了時間">
<text x="150" y="26" text-anchor="middle" class="fg-t sm">0</text><text x="384" y="26" text-anchor="middle" class="fg-t sm warm">16.7 ms</text><text x="616" y="26" text-anchor="middle" class="fg-t sm">33.3 ms</text>
<line x1="384" y1="34" x2="384" y2="214" class="fg-l warm dash"/><line x1="616" y1="34" x2="616" y2="214" class="fg-l dim dash"/>
<text x="10" y="62" class="fg-t">健康</text>
<rect x="150" y="44" width="28" height="26" rx="3" class="fg-b alt"/><rect x="178" y="44" width="42" height="26" rx="3" class="fg-b hot"/>
<rect x="220" y="44" width="164" height="26" rx="3" class="fg-b"/><text x="302" y="61" text-anchor="middle" class="fg-t sm">閒著，等下一次更新</text>
<text x="150" y="88" class="fg-t sm">一幀 16.7 ms → 60 FPS</text>
<text x="10" y="130" class="fg-t">腳本太重</text>
<rect x="150" y="112" width="196" height="26" rx="3" class="fg-b alt"/><text x="248" y="129" text-anchor="middle" class="fg-t sm">Game Logic 14 ms</text>
<rect x="346" y="112" width="42" height="26" rx="3" class="fg-b hot"/>
<rect x="388" y="112" width="228" height="26" rx="3" class="fg-b"/><text x="502" y="129" text-anchor="middle" class="fg-t sm">錯過這次更新，等下一次</text>
<text x="150" y="156" class="fg-t sm">一幀變成 33.3 ms → 30 FPS</text>
<text x="10" y="198" class="fg-t">CPU 很閒卻慢</text>
<rect x="150" y="180" width="28" height="26" rx="3" class="fg-b alt"/><rect x="178" y="180" width="42" height="26" rx="3" class="fg-b hot"/>
<rect x="220" y="180" width="396" height="26" rx="3" class="fg-b warm"/><text x="418" y="197" text-anchor="middle" class="fg-t sm">GPU 太忙、GC、其他主執行緒工作</text>
<text x="150" y="224" class="fg-t sm">面板上 Logic＋Renderer 才 5 ms，FPS 卻只有 30</text>
<rect x="150" y="238" width="14" height="10" rx="2" class="fg-b alt"/><text x="170" y="247" class="fg-t sm">Game Logic</text>
<rect x="260" y="238" width="14" height="10" rx="2" class="fg-b hot"/><text x="280" y="247" class="fg-t sm">Renderer</text>
<rect x="360" y="238" width="14" height="10" rx="2" class="fg-b warm"/><text x="380" y="247" class="fg-t sm">面板看不到的</text>
</svg><figcaption>螢幕每 16.7 毫秒更新一次。一幀只要超過一點點，就得等下一次更新，所以 FPS 不會從 60 慢慢掉到 55，而常常是直接掉到 30。</figcaption></figure>
<table>
<tr><th>你看到</th><th>最可能是</th><th>下一步</th></tr>
<tr><td>FPS 低，Game Logic 高</td><td>腳本太重</td><td>Performance 面板錄一次，找 <code>update</code> 底下最寬的函式</td></tr>
<tr><td>FPS 低，Renderer 高，Draw call 上百</td><td>合批被切斷</td><td>圖集、Label 擺放的位置、材質是否相同</td></tr>
<tr><td>FPS 低，Logic 和 Renderer 都低</td><td>顯示晶片忙不過來（大面積半透明一層疊一層、全螢幕特效），或垃圾回收、或別的主執行緒工作</td><td>把畫布變小看 FPS 會不會回來：會，就是顯示晶片的填充率；不會，去 Performance 面板看 GC</td></tr>
<tr><td>平常 60，偶爾頓一下</td><td>垃圾回收，或某一幀同步載入、建立大量節點</td><td>Performance 面板找那一幀</td></tr>
<tr><td>GFX Texture Mem 一局比一局高</td><td>貼圖或資源包沒釋放</td><td>第六節的記憶體檢查</td></tr>
</table>

<h3><span class="badge lv3">專業</span>六、Performance 面板與記憶體快照</h3>
<h4>錄一次效能</h4>
<ol>
<li>用預覽或 Debug 建置。release 建置的函式名都被改短了，火焰圖上會是一堆 <code>t</code>、<code>e</code>、<code>n</code>，除非你掛上了 source map。</li>
<li>在 Performance 面板的設定裡把 CPU 降速 4 倍或 6 倍。你的電腦比玩家的手機快太多，不降速，很多問題根本看不到。</li>
<li>按錄製，玩 5 秒出問題的那一段，停止。</li>
<li>看最上面的 Frames 和 Main 兩條。每一幀從一個 requestAnimationFrame 的回呼開始，底下是引擎的每幀流程，再底下才是你的 <code>update</code>。超過 50 毫秒的長任務會被標成紅色。</li>
<li>選取一段範圍，切到 Bottom-Up，依 Self Time 排序：哪個函式自己花最多時間，一眼就看出來。</li>
</ol>
<p>同一次錄製勾上 Memory，會多一條 JS heap 的曲線。如果它像鋸子一樣：慢慢爬升、突然掉下來、再爬升，代表你每一幀都在製造垃圾，垃圾回收器（garbage collector，GC）定期出來收，而每次收都可能讓某一幀變慢。最常見的兇手是在 <code>update</code> 裡 <code>new Vec3()</code>，或每幀建立陣列、閉包、字串。</p>
<h4>找記憶體洩漏：三張快照</h4>
<p>記憶體洩漏（memory leak）的定義是：你已經不需要的東西，因為還有人參考著它，所以垃圾回收器收不走。要找它，Memory 面板的 Heap snapshot 搭配下面這個做法最可靠：</p>
<ol>
<li>開遊戲，先玩一局讓快取都暖好，回到 waiting。拍第 1 張快照（拍快照之前，瀏覽器會自己先做一次垃圾回收）。</li>
<li>再玩 10 局，回到 waiting，拍第 2 張。</li>
<li>再玩 10 局，回到 waiting，拍第 3 張。</li>
<li>選第 3 張，在檢視選單裡選「只看第 1 張和第 2 張之間配置的物件」。這些物件是在第 2 到第 11 局之間建立的，而且玩完第 21 局還活著，嫌疑最大。</li>
<li>用類別篩選打你自己的元件名稱（例如 <code>CardView</code>），點一個，看下方的 Retainers：它會告訴你「是誰還抓著它」。</li>
</ol>
<figure class="figure"><svg viewBox="0 22 660 228" class="fg" style="width:100%;max-width:660px" role="img" aria-label="一條讓元件無法被回收的參考鏈：全域的 model、它的 events、監聽器清單、redraw 回呼、ResultView 元件、已銷毀的節點；在 onDestroy 呼叫 targetOff 就能把鏈在監聽器清單之後切斷">
<rect x="20" y="40" width="180" height="56" rx="6" class="fg-b"/><text x="110" y="64" text-anchor="middle" class="fg-t">① 全域的 model</text><text x="110" y="84" text-anchor="middle" class="fg-t sm">整個遊戲都活著</text>
<line x1="200" y1="68" x2="232" y2="68" class="fg-l"/><polygon points="240,68 232,63.5 232,72.5" class="fg-a"/>
<rect x="240" y="40" width="180" height="56" rx="6" class="fg-b"/><text x="330" y="64" text-anchor="middle" class="fg-t">② model.events</text><text x="330" y="84" text-anchor="middle" class="fg-t sm">共用的 EventTarget</text>
<line x1="420" y1="68" x2="452" y2="68" class="fg-l"/><polygon points="460,68 452,63.5 452,72.5" class="fg-a"/>
<rect x="460" y="40" width="180" height="56" rx="6" class="fg-b"/><text x="550" y="64" text-anchor="middle" class="fg-t">③ 監聽器清單</text><text x="550" y="84" text-anchor="middle" class="fg-t sm">changed 底下的回呼</text>
<line x1="550" y1="96" x2="550" y2="142" class="fg-l warm"/><polygon points="550,150 545.5,142 554.5,142" class="fg-a warm"/>
<line x1="543" y1="114" x2="557" y2="128" class="fg-l warm"/><line x1="557" y1="114" x2="543" y2="128" class="fg-l warm"/>
<text x="536" y="116" text-anchor="end" class="fg-t sm warm">斷點：在 onDestroy 呼叫</text>
<text x="536" y="134" text-anchor="end" class="fg-t sm mono">events.targetOff(this)</text>
<rect x="460" y="150" width="180" height="56" rx="6" class="fg-b warm"/><text x="550" y="174" text-anchor="middle" class="fg-t">④ redraw 回呼</text><text x="550" y="194" text-anchor="middle" class="fg-t sm">target＝那個元件</text>
<line x1="460" y1="178" x2="428" y2="178" class="fg-l warm"/><polygon points="420,178 428,173.5 428,182.5" class="fg-a warm"/>
<rect x="240" y="150" width="180" height="56" rx="6" class="fg-b warm"/><text x="330" y="174" text-anchor="middle" class="fg-t">⑤ ResultView 元件</text><text x="330" y="194" text-anchor="middle" class="fg-t sm">畫面早就關了</text>
<line x1="240" y1="178" x2="208" y2="178" class="fg-l warm"/><polygon points="200,178 208,173.5 208,182.5" class="fg-a warm"/>
<rect x="20" y="150" width="180" height="56" rx="6" class="fg-b warm"/><text x="110" y="174" text-anchor="middle" class="fg-t">⑥ 已銷毀的節點</text><text x="110" y="194" text-anchor="middle" class="fg-t sm">和它還參考著的一切</text>
<text x="330" y="238" text-anchor="middle" class="fg-t sm">Heap snapshot 的 Retainers 欄，就是從 ⑥ 往回念到 ①</text>
</svg><figcaption>只要從一個永遠活著的東西（GC 根）出發，還走得到某個物件，它就收不走。修法不是「刪掉那個物件」，而是把鏈上的某一環剪斷。</figcaption></figure>
<p>這條鏈還解釋了上一課的另一個症狀：「錯誤來自一個早就被銷毀的節點」。被抓住的元件還會收到 <code>changed</code> 事件，回呼照樣執行，碰到它那個已經銷毀的節點就出錯。在 Cocos 裡，一個被 <code>destroy()</code> 的物件，<code>isValid</code> 會變成 false，但只要還有人參考它，那個 JavaScript 物件就還在記憶體裡。</p>
<p>另外兩個常見的漏法：</p>
<ul>
<li><b><code>removeFromParent()</code> 不等於 <code>destroy()</code></b>：前者只是把節點從樹上拿下來。你的陣列裡還留著它，它就一直在，連同它的子節點和元件。</li>
<li><b>動態載入的資源沒釋放</b>：用程式載入的貼圖、資源包，引擎靠參考計數決定什麼時候可以釋放。載了不放，GFX Texture Mem 就一局一局往上爬。</li>
</ul>
<p>想直接看引擎現在握著多少貼圖，可以在主控台跑：</p>
<pre><code>let n = 0, mb = 0;
cc.assetManager.assets.forEach((a) =&gt; {
  if (a instanceof cc.Texture2D) { n++; mb += a.width * a.height * 4 / 1048576; }
});
console.log(n + ' textures, up to ' + mb.toFixed(1) + ' MB if uncompressed');
</code></pre>
<p>玩 10 局前後各跑一次。貼圖數量應該持平；如果每局多幾張，就是有東西載了沒放。（用了壓縮格式時，實際佔用會比這個上限小。）</p>

<h3><span class="badge lv3">專業</span>七、在真的手機上除錯</h3>
<p>電腦上的模擬器只能模擬螢幕大小，模擬不了手機的顯示晶片、記憶體上限、Safari 的行為。真正的手機 bug，要在真正的手機上抓。兩大平台的做法：</p>
<table>
<tr><th></th><th>iPhone（Safari）</th><th>Android（Chrome）</th></tr>
<tr><td>手機上</td><td>設定 → Safari → 進階，打開「網頁檢閱器」</td><td>開啟開發人員選項，再打開「USB 偵錯」</td></tr>
<tr><td>電腦上</td><td>Mac 的 Safari 在設定的「進階」裡打開開發者功能；接上傳輸線後，在「開發」選單找到手機和頁面</td><td>Chrome 打開 <code>chrome://inspect</code>，勾選 Discover USB devices，在頁面下方按 inspect</td></tr>
<tr><td>需要</td><td>一台 Mac</td><td>任何能跑 Chrome 的電腦</td></tr>
<tr><td>遊戲包在 App 的 WebView 裡</td><td>iOS 16.4 起，App 要把 WKWebView 的 <code>isInspectable</code> 設成 true</td><td>App 要呼叫 <code>WebView.setWebContentsDebuggingEnabled(true)</code></td></tr>
<tr><td>連到電腦上的預覽</td><td>手機和電腦在同一個區域網路，用電腦的 IP 開預覽網址</td><td>同左；或用連接埠轉送（見下段）</td></tr>
</table>
<p>Android 的連接埠轉送（port forwarding）很好用：在 <code>chrome://inspect</code> 的設定裡，把手機上的 <code>7456</code> 轉到電腦的 <code>localhost:7456</code>，手機打開 <code>http://localhost:7456</code> 就是你電腦上的預覽，不用管區域網路和 IP。</p>
<p>連上之後，主控台、中斷點、Network、Performance 都能用在手機那個頁面上。你在電腦上學的所有東西，在這裡全部適用，而且這次量到的是真的數字。</p>
<p>沒有傳輸線的時候（例如測試人員在外面），可以在 Debug 建置裡嵌入一個頁面內的主控台，例如 vConsole 或 Eruda：畫面上多一顆按鈕，點開就能看 log 和網路請求。只放在 Debug 建置，不要出現在正式產物裡。</p>

<h3><span class="badge lv4">專家</span>八、手機上的當機與卡死</h3>
<h4>記憶體壓力：分頁被系統砍掉</h4>
<p>手機的記憶體比電腦少很多，而且瀏覽器的一個分頁能用多少，沒有公開的固定數字，跟機型、系統版本、背景還開著多少 App 都有關。超過了，系統直接把那個分頁的行程結束，不會先通知你的 JavaScript。玩家看到的是：iPhone 上頁面自己重新載入，重複幾次之後 Safari 顯示「A problem repeatedly occurred」；Android 上是 Chrome 的錯誤頁。</p>
<p>因為沒有事件可以接，只能事後推斷。一個不完美但很有用的做法：遊戲執行中在 localStorage 寫一個「正在玩，第幾局、什麼狀態」的標記，在 <code>pagehide</code> 時清掉。下次啟動時如果標記還在，代表上一次不是正常離開，就把它當成「疑似被系統結束」回報，附上當時的狀態。滑掉 App 也可能留下標記，所以看的是比例和趨勢，不是單一筆。</p>
<p>算記憶體時，別只算貼圖：</p>
<ul>
<li><b>貼圖</b>：寬 &times; 高 &times; 4，壓縮格式另算。通常是最大的一塊。</li>
<li><b>JS heap</b>：你的物件、引擎的物件、序列化資料。</li>
<li><b>解碼後的聲音</b>：如果聲音是用 Web Audio 解碼成原始取樣來播放，一分鐘的雙聲道 44.1 kHz 音樂，以 32 位元浮點數存放，是 44,100 &times; 2 &times; 4 &times; 60 &asymp; 21 MB。一首三分鐘的背景音樂，可能比你全部的牌面圖集還大。</li>
</ul>
<h4>WebGL context lost：畫面突然黑掉或定住</h4>
<p>遊戲用 WebGL 畫圖，WebGL 背後是一個「繪圖環境」（context）。顯示晶片重置、系統要回顯示記憶體、太多頁面同時用 WebGL，都可能讓瀏覽器把這個環境收回去。收回之後，所有貼圖和緩衝區都消失了，畫面黑掉或定住，但你的 JavaScript 還在跑，聲音還在響，網路還在收訊息。</p>
<p>瀏覽器會在畫布上發出 <code>webglcontextlost</code> 事件。引擎能不能自己把所有資源重建回來，要看版本，不要賭它。最穩的做法是接住事件、記一筆日誌、給玩家一個「點一下重新載入」，搭配伺服器的快照，重新載入後回到原本那一局：</p>
<pre><code>import { game } from 'cc';

export function watchContextLoss(onLost: () =&gt; void) {
  game.canvas?.addEventListener('webglcontextlost', (e) =&gt; {
    e.preventDefault();   // 想要它回來；不呼叫就沒有 restored 事件
    onLost();             // 記日誌、顯示「點一下重新載入」
  });
}
</code></pre>
<p>不用等它真的發生，你可以在主控台自己製造一次：</p>
<pre><code>const c = cc.game.canvas;
const gl = c.getContext('webgl2') || c.getContext('webgl');
gl.getExtension('WEBGL_lose_context').loseContext();
</code></pre>
<p>（對一個已經有 WebGL 環境的畫布再呼叫一次 <code>getContext</code>，拿到的是同一個環境；類型不同時會拿到 null，所以兩種都試。）</p>
<h4>切到背景再回來</h4>
<p>玩家接個電話、切去回訊息，你的頁面就被放到背景：requestAnimationFrame 停了，計時器被大幅降頻，連線可能被系統切斷，聲音的環境可能被暫停。回來的時候，別相信自己本地的計時器還準。Cocos 會發出 <code>Game.EVENT_HIDE</code> 和 <code>Game.EVENT_SHOW</code>；在 SHOW 時，先問伺服器這一局現在在哪（跟伺服器對話那一課的 <code>resume</code>），再用 <code>jump()</code> 跳過去。聲音如果不響了，在玩家下一次觸控時恢復。</p>
<h4>不是當機，是卡住</h4>
<p>玩家說「卡住了」，先分清楚是哪一種：</p>
<ul>
<li><b>畫面還在動，只是不能玩</b>（統計面板的 FPS 還是 60）：主執行緒沒問題，是邏輯卡住了。最常見的是一個永遠不會完成的 Promise：<code>revealing</code> 在等一個回覆，那個請求卻在斷線時沒被拒絕，狀態機就永遠停在那裡。這就是為什麼每個請求都要有逾時。</li>
<li><b>畫面完全不動，點什麼都沒反應</b>：主執行緒被佔住了，可能是無窮迴圈（例如兩個狀態互相 <code>go()</code> 對方），或一段很長的同步工作。接上 DevTools，在 Sources 面板按暫停鍵，它會停在正在跑的那一行，兇手當場現形。</li>
<li><b>整體變成 30 FPS，而且剛好是 30</b>：在 iPhone 上，先問玩家有沒有開低耗電模式。在這個模式下，Safari 常會把 requestAnimationFrame 降到每秒 30 次，你的程式沒有問題。</li>
</ul>

<h3><span class="badge lv4">專家</span>九、正式環境的日誌策略</h3>
<p>上線之後，bug 發生在幾萬支你碰不到的手機上。你唯一的眼睛是日誌。好的日誌策略要回答三個問題：記什麼、存在哪、怎麼送回來。</p>
<h4>記什麼</h4>
<table>
<tr><th>等級</th><th>例子</th><th>正式環境怎麼處理</th></tr>
<tr><td>debug</td><td>每一幀的數值、每個節點的建立</td><td>只在 Debug 建置存在</td></tr>
<tr><td>info</td><td>狀態轉換、送出請求與收到回覆（含 id 和耗時）、連線與斷線（含關閉碼）</td><td>只放在手機上的環形緩衝區，出錯時一起送</td></tr>
<tr><td>warn</td><td>被擋下的狀態轉換、請求逾時、重連第 3 次以上</td><td>放進緩衝區；可以抽樣送出</td></tr>
<tr><td>error</td><td>沒接住的例外、Promise 被拒絕沒人處理、資源載入失敗、WebGL context lost</td><td>立即送出，連同緩衝區</td></tr>
</table>
<p>關鍵是 <b>info 不要即時送</b>。一局遊戲幾十筆狀態轉換，乘上幾萬個玩家，伺服器先被日誌打垮。正確的做法是把最近 200 筆存在手機的記憶體裡（環形緩衝區，ring buffer），只有出錯時才連同錯誤一起送出。你拿到的就是「出錯前的最後 200 步」，正好是你需要的。</p>
<pre><code>import { BUILD } from './BuildInfo';

type Entry = { t: number; lv: 'info' | 'warn' | 'error'; ev: string; data?: unknown };
const SESSION = crypto.randomUUID();
const buf: Entry[] = [];
let sent = 0;

export function log(lv: Entry['lv'], ev: string, data?: unknown) {
  buf.push({ t: Date.now(), lv, ev, data });
  if (buf.length &gt; 200) buf.shift();
  if (lv === 'error' &amp;&amp; sent++ &lt; 5) {      // 每個 session 最多送 5 次，避免洗版
    navigator.sendBeacon('/client-log', JSON.stringify({
      ev, build: BUILD.version, session: SESSION, ua: navigator.userAgent, recent: buf,
    }));
  }
}

window.addEventListener('error', (e) =&gt; log('error', 'uncaught', { msg: e.message, at: e.filename + ':' + e.lineno }));
window.addEventListener('unhandledrejection', (e) =&gt; log('error', 'unhandled-rejection', { msg: String(e.reason) }));
</code></pre>
<p>幾個設計上的理由：</p>
<ul>
<li><b><code>sendBeacon</code></b>：瀏覽器保證會盡力送出，即使頁面正在被關掉或切到背景。用一般的 <code>fetch</code>，頁面一關請求就可能被取消。</li>
<li><b>每筆都帶版本和 session</b>：版本告訴你該對照哪一份 source map；session id 如果也在連線時送給伺服器，你就能把用戶端的日誌和伺服器的日誌接在一起看，同一局兩邊各說了什麼一清二楚。</li>
<li><b>上限</b>：<code>update</code> 裡的一個錯誤每秒會發生 60 次。沒有上限，一個玩家就能送出幾千筆。看錯誤時也一樣：先找<b>第一筆</b>，後面的常常只是它引起的連鎖反應。</li>
<li><b>不記的東西</b>：登入憑證、玩家的個人資料、完整的訊息內容。日誌會被很多人看到、保存很久，它是資安事件最常見的源頭之一。</li>
</ul>
<h4>正式建置裡的引擎錯誤</h4>
<p>release 建置為了變小，引擎自己的錯誤訊息常常只剩一個編號和一個連結，要拿編號去對照引擎原始碼 repo 裡的錯誤對照表，才知道是什麼意思。所以在日誌裡完整保留錯誤字串，不要只記「發生錯誤」。</p>
<h4>錯誤追蹤服務</h4>
<p>自己做到上面這樣已經很夠用。團隊大了，可以接一個現成的錯誤追蹤服務（例如 Sentry）：它會把同一種錯誤歸成一組、統計影響多少玩家、用你私下上傳的 source map 把堆疊翻回 TypeScript，還能在新版本出現新錯誤時通知你。原理跟上面的程式碼一樣，只是幫你把後半段做完了。</p>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>改完之後試一次沒出現，就是修好了</td><td>要看原本的頻率。十次出現一次的 bug，試五次沒出現什麼都證明不了。先讓它變常出現，再驗證。</td></tr>
<tr><td>中斷點是最好的工具</td><td>中斷點會停住整個遊戲和時間。跟時間、順序、網路有關的 bug，用 logpoint 和日誌。</td></tr>
<tr><td>FPS 低就是程式寫太慢</td><td>先看 Game Logic 和 Renderer。如果它們都很低，問題在顯示晶片、垃圾回收或別的地方，最佳化腳本沒有用。</td></tr>
<tr><td>JavaScript 有垃圾回收，不會記憶體洩漏</td><td>垃圾回收只收「沒人參考」的東西。一個忘記移除的監聽器，就能讓整個畫面留在記憶體裡。</td></tr>
<tr><td>電腦上沒事，手機上也不會有事</td><td>手機的 CPU、顯示晶片、記憶體上限、瀏覽器行為都不同。用真機，至少用降速。</td></tr>
<tr><td>日誌記越多越好</td><td>記太多會拖慢遊戲、打垮伺服器、洩漏個資。平常存在手機上，出錯才送。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>Vue 和 TypeScript</b>：source map、中斷點、Performance 面板、三張快照找洩漏，在 Vue 專案裡完全一樣。Vue 的「元件卸載了，監聽器還在」跟 Cocos 的「節點銷毀了，監聽器還在」，是同一個 bug。</li>
<li><b>Node.js 和 Go 的後端</b>：重現、二分、假設、驗證這套方法不分前後端。Node.js 可以用 <code>--inspect</code> 接上同一套 Chrome DevTools；Go 有 pprof 看 CPU 和記憶體。</li>
<li><b>Docker 與雲端主機</b>：「在我電腦上沒事」的伺服器版本，就是環境不同。把環境當成一個要被二分的變數：同一個映像檔、同一份設定、同一筆資料，一次只換一樣。</li>
<li><b>Unity</b>：Unity 也有自己的 Profiler 和記憶體分析工具；WebGL 版的 Unity 遊戲，在瀏覽器裡一樣會遇到這一章的 context lost 和分頁被砍。</li>
<li><b>維運</b>：環形緩衝區、帶版本與 session id 的結構化日誌、錯誤上限，是所有用戶端（網頁、App、遊戲）上報系統的共同設計。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<p>遊戲用戶端、前端、全端的面試都愛問除錯，因為它最能分辨「做過」和「讀過」。</p>
<ol>
<li>「說說你除錯的方法，再舉一個你修過最難的 bug。」</li>
<li>「遊戲在 iPhone 上玩幾關之後頁面會自己重新載入，電腦上完全正常。你怎麼查？」</li>
<li>「FPS 從 60 掉到 40，你怎麼判斷問題在 CPU 還是 GPU？」</li>
<li>「怎麼找前端的記憶體洩漏？」</li>
<li>「正式環境的錯誤怎麼收集？source map 要不要公開？」</li>
<li>「什麼是 WebGL context lost？你會怎麼處理？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>先重現並記錄版本、裝置、步驟和頻率；再用二分法隔離，不管是 commit、節點、資料還是環境；然後提出能被推翻的假設，寫下預期會看到什麼；一次只改一個變數去驗證；修好後留下測試或檢查清單。舉例時照這個結構講：症狀、怎麼縮小範圍、哪幾個假設、哪個實驗把它們分開、根本原因、怎麼防止再犯，最好帶數字（例如二分 8 次找到 commit、頻率從 80% 降到 0）。</li>
<li>這是典型的記憶體壓力，系統把分頁結束了。先接上 Safari 的網頁檢閱器在真機上重現，看 Timelines 或記憶體的趨勢；在遊戲裡算貼圖的總量（寬 &times; 高 &times; 4），檢查每一關之後有沒有釋放上一關的資源包，以及有沒有大型聲音被解碼成原始取樣。修法是縮小並壓縮貼圖、用完就釋放、分包載入，然後在支援的最舊機型上驗證。另外加上「上次是否異常結束」的偵測，看修完之後比例有沒有下降。</li>
<li>先開統計面板。Game Logic 加 Renderer 如果已經接近或超過 16.7 毫秒，問題在 CPU，用 Performance 面板找最花時間的函式或過多的 draw call。如果這兩項都很低、FPS 卻不好，CPU 這邊沒在忙，可能是顯示晶片的填充率或垃圾回收：把畫布變小看 FPS 會不會回來，會就是 GPU；再用 Performance 看有沒有 GC 或其他長任務。還要注意 FPS 常常是直接從 60 掉到 30，因為錯過了畫面更新。</li>
<li>先確認真的在漲：同樣的操作重複 N 次，看節點數、貼圖數、JS heap 是否持續上升。然後用三張 heap snapshot：暖機後拍一張、做 N 次拍一張、再做 N 次拍一張，在第三張只看第一和第二張之間配置、但到現在還活著的物件，挑自己的類別，看 Retainers 找出是誰抓著它。常見原因是沒移除的監聽器、只 <code>removeFromParent</code> 沒 <code>destroy</code>、陣列或快取只加不刪、資源載了沒釋放。</li>
<li>用全域的 <code>error</code> 和 <code>unhandledrejection</code> 接住錯誤，平常把最近的 info 日誌放在手機上的環形緩衝區，出錯時連同版本、session id、裝置資訊用 <code>sendBeacon</code> 送出，並設上限避免洗版；session id 也送給伺服器，方便對照兩邊的日誌。source map 建置時產生，但不公開放在 CDN 上，而是私下交給錯誤追蹤服務或內部工具，因為它等於公開原始碼。</li>
<li>WebGL 的繪圖環境被瀏覽器收回了，通常因為顯示晶片重置、記憶體壓力或太多頁面同時使用。收回後所有顯示資源都消失，畫面黑掉或定住，但 JavaScript 照跑。處理方式是監聽畫布上的 <code>webglcontextlost</code>、呼叫 <code>preventDefault</code>、記錄日誌，再依引擎能力選擇重建資源或請玩家重新載入，並靠伺服器的快照回到原本的進度。可以用 <code>WEBGL_lose_context</code> 擴充功能在開發時模擬。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>一支 iPhone 上，統計面板顯示：FPS 30、Frame time 33.3、Game Logic 3.1、Renderer 2.2、Draw call 14。你的第一個假設是什麼？要怎麼驗證？</li>
<li>好版本和壞版本之間有 300 個 commit，每建置並測試一次要 4 分鐘。用二分法最多要幾次、多久？一個一個試，平均要多久？</li>
<li>在你自己的專案上做一次「三張快照」：玩 10 局、再玩 10 局。寫下第 3 張快照裡，在第 1 和第 2 張之間配置、到現在還活著的物件，數量最多的前三種類別是什麼。它們應該活著嗎？</li>
<li>分數偶爾會一次跳 2 分。在 <code>applyReveal(card, correct, score)</code> 裡下一個條件中斷點，只在這種情況停下來。條件怎麼寫？</li>
<li>用主控台模擬一次 WebGL context lost，觀察你的遊戲發生什麼事。然後寫出你希望它發生什麼事。</li>
<li>玩家回報：「我猜完就卡住了。」如果你的環形緩衝區裡只能挑 5 種事件來記，你會挑哪 5 種，才能在一分鐘內判斷卡在哪裡？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>CPU 這一側每幀只花約 5 毫秒，而且剛好是 30，不像是腳本或 draw call 的問題。第一個假設：低耗電模式把 requestAnimationFrame 限制在每秒 30 次。驗證：關掉低耗電模式再看一次；如果變回 60 就是它。如果還是 30，第二個假設是顯示晶片忙不過來：用 Safari 的網頁檢閱器錄 Timelines，再把畫布縮小或拿掉半透明的全螢幕圖層，看 FPS 會不會回來。</li>
<li>2 的 9 次方是 512，大於 300，所以最多 9 次，約 36 分鐘。一個一個試，平均要試到一半才找到，大約 150 次、10 個小時。</li>
<li>健康的結果：大部分是引擎內部的小物件，數量不多，而且跟局數無關。如果看到你的 <code>CardView</code>、Node 或閉包的數量剛好是「局數的倍數」（例如 10 局多了 20 個 CardView），就是每局留下兩張牌沒銷毀，或有監聽器抓著它們。點進去看 Retainers，找出是誰抓著。</li>
<li>條件寫成 <code>score - this.score &gt; 1</code>（參數 <code>score</code> 是伺服器說的新分數，<code>this.score</code> 是目前的分數）。如果條件成立時伺服器的回覆本身就跳了 2 分，問題在伺服器或模擬伺服器；如果回覆正常、是同一個回覆被套用了兩次，就去找重複的監聽器或重送的請求。</li>
<li>多數情況下畫面會黑掉或定住，但聲音和網路照常，狀態機還在跑。希望的行為：接住事件、記一筆含當時狀態的日誌、顯示「點一下重新載入」，重新載入後靠伺服器的快照回到同一局、同樣的分數。</li>
<li>一種合理的選擇：(1) 狀態轉換，含從哪到哪和局號；(2) 送出請求，含 id 和類型；(3) 收到回覆，含 id 和耗時；(4) 請求逾時或被拒絕；(5) 連線關閉，含關閉碼。有了這 5 種，看最後幾筆就知道：是請求送出了卻沒回來（網路或伺服器）、回來了卻沒轉換狀態（用戶端邏輯）、還是根本沒送出（點擊被防護條件擋掉）。翻牌動畫的完成回呼也可以考慮加進來，因為 revealing 要等它才離開。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>Chrome DevTools 官方文件</b>（<a href="https://developer.chrome.com/docs/devtools">developer.chrome.com/docs/devtools</a>）：Performance 和 Memory 兩個面板各有完整的教學，包括怎麼讀火焰圖和怎麼比較快照。</li>
<li><b>WebKit 的 Web Inspector 文件</b>（<a href="https://webkit.org/web-inspector/">webkit.org/web-inspector</a>）：Safari 開發者工具的官方說明，iPhone 上除錯時用的就是它。</li>
<li><b>MDN〈WebGL best practices〉</b>（<a href="https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices">developer.mozilla.org</a>）：顯示記憶體、context lost、效能上的建議，寫給所有用 WebGL 的人。</li>
<li><b>David J. Agans《Debugging: The 9 Indispensable Rules for Keeping Track of the Most Elusive Software and Hardware Problems》</b>：一本薄薄的經典，把「先重現、一次只改一件事、別猜要量」這些原則講得非常透。</li>
<li><b>Cocos Creator 3.8 使用手冊</b>（<a href="https://docs.cocos.com/creator/3.8/manual/en/">docs.cocos.com/creator/3.8/manual</a>）：資源的釋放與參考計數、Asset Manager 的章節，對照這一章的記憶體部分讀。</li>
</ul>
` });
