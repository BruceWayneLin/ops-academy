DEEP({ 'cc-input': `
<p>上一課你學會了用 <code>on</code> 聽觸控、用 <code>propagationStopped</code> 擋住冒泡、用 BlockInputEvents 擋住彈窗後面的按鈕。這一章把一次觸控從頭跟到尾：手指碰到玻璃之後，經過作業系統、瀏覽器、引擎的輸入層、點擊判定，最後才變成你監聽函式裡的那個 <code>event</code>。看懂這條路，你就能解釋「明明有按到卻沒反應」「按一下觸發兩次」「拖一下按鈕就失效」這些怪事，也能自己做出點擊、拖曳、長按這些手勢。文中講到的引擎行為，都以 Cocos Creator 3.8 的引擎原始碼為準。</p>

<h3><span class="badge lv1">基礎</span>一、先看全貌：一次觸控走過的六站</h3>
<p>把一次觸控想成一封掛號信。大樓管理員（作業系統）收到信，交給收發室（瀏覽器）；收發室交給社區郵局（引擎的輸入層），郵局先把地址翻成門牌號碼（座標換算），再從最上層的住戶開始一戶一戶問「這封是你的嗎」（點擊判定）。第一個說「是」的人簽收，信就歸他；他看完，還可以往上交給家長看（冒泡）。</p>
<figure class="figure"><svg viewBox="0 0 680 392" class="fg" style="width:100%;max-width:680px" role="img" aria-label="一次觸控的路徑：作業系統、瀏覽器、引擎輸入層、input 物件，再分給 UI 節點派送器與全域 input 監聽，最後在節點上做點擊判定與捕獲冒泡">
<rect x="20" y="14" width="280" height="40" rx="6" class="fg-b"/><text x="34" y="39" class="fg-t">1 作業系統：觸控面板</text>
<text x="320" y="39" class="fg-t sm">偵測到手指，給每根手指一個 id</text>
<line x1="160" y1="54" x2="160" y2="66" class="fg-l"/><polygon points="160,74 155.5,66 164.5,66" class="fg-a"/>
<rect x="20" y="74" width="280" height="40" rx="6" class="fg-b"/><text x="34" y="99" class="fg-t">2 瀏覽器：畫布上的 touchstart</text>
<text x="320" y="99" class="fg-t sm">引擎呼叫 preventDefault：頁面不捲動、不縮放</text>
<line x1="160" y1="114" x2="160" y2="126" class="fg-l"/><polygon points="160,134 155.5,126 164.5,126" class="fg-a"/>
<rect x="20" y="134" width="280" height="40" rx="6" class="fg-b alt"/><text x="34" y="159" class="fg-t">3 引擎輸入層：換算座標</text>
<text x="320" y="159" class="fg-t sm">乘上 DPR、把 y 翻過來；依 id 記住每根手指</text>
<line x1="160" y1="174" x2="160" y2="186" class="fg-l"/><polygon points="160,194 155.5,186 164.5,186" class="fg-a"/>
<rect x="20" y="194" width="280" height="40" rx="6" class="fg-b alt"/><text x="34" y="219" class="fg-t">4 input 物件：依優先權派送</text>
<text x="320" y="219" class="fg-t sm">先給 UI 節點，再給全域監聽</text>
<line x1="160" y1="234" x2="160" y2="256" class="fg-l on"/><polygon points="160,264 155.5,256 164.5,256" class="fg-a on"/>
<rect x="20" y="264" width="280" height="40" rx="6" class="fg-b hot"/><text x="34" y="289" class="fg-t acc">5 UI 節點派送器（優先權 1）</text>
<line x1="300" y1="284" x2="372" y2="284" class="fg-l dash"/><polygon points="380,284 372,279.5 372,288.5" class="fg-a"/>
<text x="340" y="275" text-anchor="middle" class="fg-t sm">沒人接才往下</text>
<rect x="380" y="264" width="280" height="40" rx="6" class="fg-b"/><text x="394" y="289" class="fg-t">全域 input 監聽（優先權 0）</text>
<line x1="160" y1="304" x2="160" y2="326" class="fg-l on"/><polygon points="160,334 155.5,326 164.5,326" class="fg-a on"/>
<rect x="20" y="334" width="280" height="40" rx="6" class="fg-b hot"/><text x="34" y="359" class="fg-t acc">6 點擊判定 → 捕獲 → 目標 → 冒泡</text>
<text x="520" y="330" text-anchor="middle" class="fg-t sm">例如 input.on(TOUCH_START)</text>
<text x="520" y="348" text-anchor="middle" class="fg-t sm">按鈕吃掉的觸控，這裡聽不到</text>
</svg><figcaption>同一次觸控，UI 節點先拿。只有沒有任何節點接走的觸控，才會往下交給全域的 input 監聽。</figcaption></figure>
<ol>
<li><b>作業系統</b>：觸控面板偵測到手指，作業系統給每根手指一個編號（id）。手指離開螢幕之前，編號都不變。</li>
<li><b>瀏覽器</b>：在網頁上，Cocos 監聽的是遊戲畫布（id 為 <code>GameCanvas</code> 的 canvas）上的 <code>touchstart</code>、<code>touchmove</code>、<code>touchend</code>、<code>touchcancel</code>，電腦上再加上滑鼠事件，並沒有用 Pointer Events。事件的目標是畫布時，引擎會呼叫 <code>preventDefault()</code>，所以在遊戲上滑動不會捲動網頁、不會縮放，瀏覽器也不會再補送一份模擬的滑鼠事件。</li>
<li><b>引擎的輸入層</b>：把瀏覽器的座標換成引擎的座標（下一節細講），再用一張表依 id 記住每一根手指，表上最多 8 根。</li>
<li><b><code>input</code> 物件</b>：手上有兩個派送器（dispatcher），依優先權排好。UI 節點的派送器優先權是 1，先拿到；全域 <code>input.on(...)</code> 的監聽優先權是 0，排在後面。</li>
<li><b>UI 節點派送器</b>：如果某個節點接走了這次觸控，它就回報「不用往下傳了」。所以<b>全域的 <code>input.on(Input.EventType.TOUCH_START)</code> 只聽得到沒有任何節點接走的觸控</b>。很多人在這裡卡過：明明全域有在聽，點在按鈕上卻聽不到，因為按鈕先吃掉了。</li>
<li><b>節點上的派送</b>：點擊判定找到目標之後，事件照「捕獲、目標、冒泡」三個階段走一遍，你的監聽函式就是在這裡被呼叫的。</li>
</ol>
<p>還有一個平台差異值得記住：在網頁上，觸控是在瀏覽器的事件裡<b>當場</b>派送的，不等下一個影格；在原生 App（iOS、Android）上，引擎會先把觸控收集起來，到下一個影格一開始才統一派送。兩種都發生在下一次 <code>update</code> 之前，平常寫程式感覺不出差別，但除錯時看到的呼叫堆疊（call stack）會很不一樣。</p>

<h3><span class="badge lv1">基礎</span>二、同一根手指，三種座標</h3>
<p>同一個點，在不同的層有不同的寫法。用一支常見的手機實際算一次：螢幕寬 390、高 844 個 CSS 像素，裝置像素比（device pixel ratio，DPR）是 3；遊戲的設計解析度是 720 × 1280，適配方式勾選 Fit Width（寬度對齊）。手指點在螢幕正中央。</p>
<figure class="figure"><svg viewBox="0 0 680 270" class="fg" style="width:100%;max-width:680px" role="img" aria-label="同一個點的三種座標：瀏覽器 CSS 像素 195,422，原點左上；引擎螢幕座標 585,1266，原點左下；UI 座標 360,779">
<text x="110" y="20" text-anchor="middle" class="fg-t alt">瀏覽器</text><text x="110" y="37" text-anchor="middle" class="fg-t sm mono">clientX, clientY</text>
<text x="340" y="20" text-anchor="middle" class="fg-t alt">引擎螢幕座標</text><text x="340" y="37" text-anchor="middle" class="fg-t sm mono">getLocation()</text>
<text x="570" y="20" text-anchor="middle" class="fg-t acc">UI 座標</text><text x="570" y="37" text-anchor="middle" class="fg-t sm mono">getUILocation()</text>
<rect x="65" y="50" width="90" height="180" rx="12" class="fg-b"/>
<rect x="295" y="50" width="90" height="180" rx="12" class="fg-b"/>
<rect x="525" y="50" width="90" height="180" rx="12" class="fg-b hot"/>
<text x="110" y="70" text-anchor="middle" class="fg-t sm mono">390 × 844</text>
<text x="340" y="70" text-anchor="middle" class="fg-t sm mono">1170 × 2532</text>
<text x="570" y="70" text-anchor="middle" class="fg-t sm mono">720 × 1558</text>
<circle cx="110" cy="140" r="5" class="fg-lamp on"/><circle cx="340" cy="140" r="5" class="fg-lamp on"/><circle cx="570" cy="140" r="5" class="fg-lamp on"/>
<circle cx="65" cy="50" r="4" class="fg-lamp on"/><text x="58" y="54" text-anchor="end" class="fg-t sm mono">(0,0)</text>
<circle cx="295" cy="230" r="4" class="fg-lamp on"/><text x="288" y="234" text-anchor="end" class="fg-t sm mono">(0,0)</text>
<circle cx="525" cy="230" r="4" class="fg-lamp on"/><text x="518" y="234" text-anchor="end" class="fg-t sm mono">(0,0)</text>
<line x1="165" y1="140" x2="277" y2="140" class="fg-l alt"/><polygon points="285,140 277,135.5 277,144.5" class="fg-a alt"/>
<text x="224" y="130" text-anchor="middle" class="fg-t sm alt">× 3、y 翻轉</text>
<line x1="395" y1="140" x2="507" y2="140" class="fg-l on"/><polygon points="515,140 507,135.5 507,144.5" class="fg-a on"/>
<text x="454" y="130" text-anchor="middle" class="fg-t sm acc">÷ 1.625</text>
<text x="110" y="254" text-anchor="middle" class="fg-t mono">(195, 422)</text>
<text x="340" y="254" text-anchor="middle" class="fg-t mono">(585, 1266)</text>
<text x="570" y="254" text-anchor="middle" class="fg-t mono">(360, 779)</text>
</svg><figcaption>瀏覽器的原點在左上角，引擎的原點在左下角。中間那一步換成真正的裝置像素，最後一步再換成設計解析度的單位。</figcaption></figure>
<ol>
<li><b>瀏覽器給的</b>：<code>clientX = 195</code>、<code>clientY = 422</code>。原點在左上角，y 往下變大，單位是 CSS 像素。</li>
<li><b>引擎的螢幕座標</b>（<code>getLocation()</code>）：x 乘上 DPR，變成 585；y 先翻過來（844 − 422 = 422），再乘 3，變成 1266。原點改到<b>左下角</b>，y 往上變大，單位是真正的裝置像素，整個畫面是 1170 × 2532。</li>
<li><b>UI 座標</b>（<code>getUILocation()</code>）：Fit Width 的縮放倍率是 1170 ÷ 720 = 1.625。585 ÷ 1.625 = 360，1266 ÷ 1.625 ≈ 779。這支手機看得到的範圍是 720 × 1558（2532 ÷ 1.625），所以 (360, 779) 正好就是正中央。</li>
</ol>
<p>寫 UI 的時候，幾乎都用第三種。要知道手指點在某個節點的「哪裡」，就再換成那個節點自己的座標：</p>
<pre><code>onDown(e: EventTouch) {
    const ui = e.getUILocation();
    const local = this.node.getComponent(UITransform)!
        .convertToNodeSpaceAR(new Vec3(ui.x, ui.y, 0));
    // local is relative to this node's anchor point
}</code></pre>
<p>在一般的 Canvas 底下，UI 座標就等於世界座標，所以可以直接交給 <code>convertToNodeSpaceAR</code>。<code>getDelta()</code> 和 <code>getUIDelta()</code> 也是同一組分別：前者是裝置像素，後者是設計單位。拖曳一張牌要用 <code>getUIDelta()</code>，不然牌會比手指跑得快，在這支手機上快 1.625 倍，換一支手機又是另一個倍數。</p>

<h3><span class="badge lv2">進階</span>三、點擊判定：誰先被問、怎麼算「在裡面」</h3>
<p>上一課說「由上往下問」。實際上，引擎手上有一份名單，只列出「啟用中、有 UITransform、身上有觸控或滑鼠監聽」的節點。樹的結構一變（加節點、換順序、啟用或停用），名單就被標成需要重排，等下一次有觸控進來時才真的排序。排序規則有兩層：</p>
<ol>
<li><b>先比攝影機</b>：畫這個節點的攝影機，優先權（priority）比較高的先被問。兩個 Canvas 疊在一起時，就是靠這個決定誰在上面。</li>
<li><b>再比樹的位置</b>：子節點排在父節點前面；兄弟之間，後面的（siblingIndex 比較大、畫在上層的）排在前面。換句話說，順序跟畫的順序剛好相反：最後畫的，最先被問。</li>
</ol>
<figure class="figure"><svg viewBox="0 0 680 330" class="fg" style="width:100%;max-width:680px" role="img" aria-label="左邊是節點樹，右邊是點擊判定問的順序：OK 按鈕、Backdrop、Card B、Card A、Table；沒有監聽的節點不在名單上">
<text x="20" y="20" class="fg-t lg">節點樹（由上往下是畫的順序）</text>
<rect x="20" y="34" width="170" height="26" rx="5" class="fg-b"/><text x="30" y="52" class="fg-t">Canvas</text><text x="180" y="52" text-anchor="end" class="fg-t sm">沒監聽</text>
<rect x="50" y="70" width="170" height="26" rx="5" class="fg-b"/><text x="60" y="88" class="fg-t">桌面圖</text><text x="210" y="88" text-anchor="end" class="fg-t sm">沒監聽</text>
<rect x="50" y="106" width="170" height="26" rx="5" class="fg-b hot"/><text x="60" y="124" class="fg-t">Table</text>
<rect x="80" y="142" width="170" height="26" rx="5" class="fg-b hot"/><text x="90" y="160" class="fg-t">Card A</text>
<rect x="80" y="178" width="170" height="26" rx="5" class="fg-b hot"/><text x="90" y="196" class="fg-t">Card B</text>
<rect x="50" y="214" width="170" height="26" rx="5" class="fg-b"/><text x="60" y="232" class="fg-t">Popup</text><text x="210" y="232" text-anchor="end" class="fg-t sm">沒監聽</text>
<rect x="80" y="250" width="170" height="26" rx="5" class="fg-b hot"/><text x="90" y="268" class="fg-t">Backdrop</text>
<rect x="80" y="286" width="170" height="26" rx="5" class="fg-b hot"/><text x="90" y="304" class="fg-t">OK 按鈕</text>
<path d="M32 60 V227 H50" class="fg-l dim"/><line x1="32" y1="83" x2="50" y2="83" class="fg-l dim"/><line x1="32" y1="119" x2="50" y2="119" class="fg-l dim"/>
<path d="M62 132 V191 H80" class="fg-l dim"/><line x1="62" y1="155" x2="80" y2="155" class="fg-l dim"/>
<path d="M62 240 V299 H80" class="fg-l dim"/><line x1="62" y1="263" x2="80" y2="263" class="fg-l dim"/>
<circle cx="236" cy="119" r="10" class="fg-b alt"/><text x="236" y="123" text-anchor="middle" class="fg-t sm">5</text>
<circle cx="266" cy="155" r="10" class="fg-b alt"/><text x="266" y="159" text-anchor="middle" class="fg-t sm">4</text>
<circle cx="266" cy="191" r="10" class="fg-b alt"/><text x="266" y="195" text-anchor="middle" class="fg-t sm">3</text>
<circle cx="266" cy="263" r="10" class="fg-b alt"/><text x="266" y="267" text-anchor="middle" class="fg-t sm">2</text>
<circle cx="266" cy="299" r="10" class="fg-b alt"/><text x="266" y="303" text-anchor="middle" class="fg-t sm">1</text>
<text x="390" y="20" class="fg-t lg">點擊判定問的順序</text>
<rect x="390" y="34" width="270" height="28" rx="5" class="fg-b hot"/><text x="402" y="53" class="fg-t">1　OK 按鈕</text><text x="648" y="53" text-anchor="end" class="fg-t sm">最後畫，最先問</text>
<rect x="390" y="70" width="270" height="28" rx="5" class="fg-b hot"/><text x="402" y="89" class="fg-t">2　Backdrop</text><text x="648" y="89" text-anchor="end" class="fg-t sm">BlockInputEvents</text>
<rect x="390" y="106" width="270" height="28" rx="5" class="fg-b hot"/><text x="402" y="125" class="fg-t">3　Card B</text>
<rect x="390" y="142" width="270" height="28" rx="5" class="fg-b hot"/><text x="402" y="161" class="fg-t">4　Card A</text>
<rect x="390" y="178" width="270" height="28" rx="5" class="fg-b hot"/><text x="402" y="197" class="fg-t">5　Table</text><text x="648" y="197" text-anchor="end" class="fg-t sm">父節點排在子節點後</text>
<text x="390" y="236" class="fg-t sm">沒有監聽的 Canvas、桌面圖、Popup 不在名單上。</text>
<text x="390" y="258" class="fg-t sm">手指點在 OK 和 Card B 重疊的地方：</text>
<text x="390" y="276" class="fg-t sm">問到第 1 個 OK 就停，Card B 完全不知道。</text>
<text x="390" y="298" class="fg-t sm acc">第一個說「在範圍內」的，就把觸控拿走。</text>
</svg><figcaption>名單只收有監聽的節點，順序是「後畫的先問、子節點先於父節點」。這也是彈窗的 Backdrop 擋得住後面整個遊戲的原因：它排在所有遊戲節點前面。</figcaption></figure>
<p>名單排好之後，就照順序一個一個問：「這個點在你的矩形裡嗎？」每個節點的回答是這樣算的：</p>
<ol>
<li>用攝影機把螢幕座標換成世界座標。如果攝影機的可見層（visibility）不包含這個節點的 layer，直接跳過。</li>
<li>把節點的世界矩陣（world matrix）求反矩陣，用它把世界座標換成節點自己的座標，再加上錨點的偏移。這一步把旋轉和縮放都算進去了，所以轉了 30 度的牌，判定範圍也跟著轉。</li>
<li>看結果有沒有落在「0 到寬、0 到高」之間。</li>
<li>如果祖先節點有 Mask，再問 Mask 一次：這個點有沒有被遮掉？</li>
</ol>
<p>從這四步可以直接推出三件事：</p>
<ul>
<li><b>判定的是矩形，不是圖片的像素。</b>一顆圓形按鈕，四個透明的角也點得到。要更準，就把節點尺寸縮小一點，或在監聽裡自己再算一次跟圓心的距離。</li>
<li><b>縮放是 0 的節點點不到。</b>它的世界矩陣沒有反矩陣，引擎直接跳過。但從 0 放大的彈窗，從縮放大於 0 的下一個影格起就點得到了，第六節會講這帶來的麻煩。</li>
<li><b>第一個回答「在」的就拿走</b>，名單上後面的節點完全不知道有這次觸控，這叫「吞掉」（swallow）。在監聽裡設 <code>event.preventSwallow = true</code>，派送器會讓名單上的下一個也試試看；這個旗標每問完一個就被清掉，要一路往下傳，每一層都得自己再設一次。</li>
</ul>

<h3><span class="badge lv2">進階</span>四、認領、捕獲、冒泡：TOUCH_START 之後發生什麼</h3>
<h4>認領：之後的移動和放開，不再重新判定</h4>
<p>TOUCH_START 判定成功的節點，會把這根手指的 id 記在自己身上，這叫「認領」（claim）。之後同一根手指的 TOUCH_MOVE，引擎不再做點擊判定，直接交給認領它的節點，所以手指滑出節點，它還是收得到移動。放開時引擎會再判定一次：還在矩形裡，送 TOUCH_END；已經滑出去，就改送 TOUCH_CANCEL。網頁的觸控事件也是這樣：<code>touchmove</code> 的 target，永遠是手指一開始按下的那個元素。</p>
<p>另外兩種情況也會收到 TOUCH_CANCEL：認領中的節點被銷毀了，或在處理 TOUCH_START 的時候被停用了。所以「放開」的收尾工作（例如把按下去的樣子還原），要在 TOUCH_END 和 TOUCH_CANCEL 裡都寫。</p>
<h4>三個階段</h4>
<p>找到目標節點之後，事件跟 DOM 一樣分三段走：</p>
<figure class="figure"><svg viewBox="80 0 520 300" class="fg" style="width:100%;max-width:520px" role="img" aria-label="捕獲由 Canvas 往下經過 ScrollView、content 到 Button；Button 是目標並停止冒泡，所以往上的冒泡沒有發生，ScrollView 靠捕獲監聽看到拖曳">
<rect x="240" y="20" width="180" height="36" rx="6" class="fg-b"/><text x="330" y="43" text-anchor="middle" class="fg-t">Canvas</text>
<rect x="240" y="82" width="180" height="36" rx="6" class="fg-b alt"/><text x="330" y="105" text-anchor="middle" class="fg-t">ScrollView</text>
<rect x="240" y="144" width="180" height="36" rx="6" class="fg-b"/><text x="330" y="167" text-anchor="middle" class="fg-t">content</text>
<rect x="240" y="206" width="180" height="36" rx="6" class="fg-b hot"/><text x="330" y="229" text-anchor="middle" class="fg-t acc">Button（目標）</text>
<line x1="330" y1="56" x2="330" y2="82" class="fg-l dim"/><line x1="330" y1="118" x2="330" y2="144" class="fg-l dim"/><line x1="330" y1="180" x2="330" y2="206" class="fg-l dim"/>
<line x1="215" y1="34" x2="215" y2="210" class="fg-l alt"/><polygon points="215,218 210.5,210 219.5,210" class="fg-a alt"/>
<text x="203" y="96" text-anchor="end" class="fg-t alt">1 捕獲</text>
<text x="203" y="114" text-anchor="end" class="fg-t sm">由上往下</text>
<text x="203" y="132" text-anchor="end" class="fg-t sm">ScrollView 在這裡</text>
<text x="203" y="148" text-anchor="end" class="fg-t sm">看到每一次移動</text>
<line x1="445" y1="218" x2="445" y2="42" class="fg-l dim dash"/><polygon points="445,34 440.5,42 449.5,42" class="fg-a"/>
<text x="457" y="96" class="fg-t">3 冒泡</text>
<text x="457" y="114" class="fg-t sm">由下往上</text>
<text x="457" y="132" class="fg-t sm warm">Button 設了</text>
<text x="457" y="150" class="fg-t sm warm">propagationStopped，</text>
<text x="457" y="168" class="fg-t sm warm">所以這段沒有發生</text>
<text x="330" y="266" text-anchor="middle" class="fg-t acc">2 目標：Button 自己的監聽</text>
<text x="330" y="286" text-anchor="middle" class="fg-t sm">按下、改外觀、放開時發出 click</text>
</svg><figcaption>Button 會擋住自己觸控的冒泡，所以外層的 ScrollView 要用捕獲監聽，才能在按鈕上照樣拖得動。</figcaption></figure>
<ol>
<li><b>捕獲</b>（capture）：從根往下，走到目標的父節點為止。只有用 <code>node.on(type, fn, this, true)</code> 註冊了捕獲監聽的祖先會被呼叫。</li>
<li><b>目標</b>（target）：目標節點自己的監聽。</li>
<li><b>冒泡</b>（bubbling）：從父節點往上走到根，呼叫一般的監聽。任何一站設了 <code>propagationStopped</code>，後面的就不走了。</li>
</ol>
<h4>用 ScrollView 和 Button 看三個階段怎麼合作</h4>
<p>ScrollView 裡放了一排 Button。手指按在某顆 Button 上往上拖，你要的是列表捲動，不是按到按鈕。引擎是這樣做到的：</p>
<ol>
<li>點擊判定的目標是 Button（它在樹裡比 ScrollView 深，先被問）。Button 在 TOUCH_START 裡記下「我被按住了」，並設 <code>propagationStopped</code>，冒泡就上不去。</li>
<li>但 ScrollView 是在<b>捕獲</b>階段監聽的，每一次 TOUCH_MOVE 它都比 Button 早一步看到，所以照樣能捲。</li>
<li>ScrollView 每次移動都量一次：手指離起點多遠。超過 7 個 UI 單位（3.8 原始碼裡寫死的門檻），它就對 Button 送一個模擬的 TOUCH_CANCEL。Button 收到後把「按住」清掉，放開時就不會發出 click。這個行為由 ScrollView 的 <code>cancelInnerEvents</code> 控制，預設是開的。</li>
</ol>
<p>這就是「點擊」和「拖曳」的分界線：7 個單位以內算手抖，超過算拖。下一節自己做手勢時，會用到同一套想法。</p>

<h3><span class="badge lv3">專業</span>五、多點觸控，與自己做手勢</h3>
<h4>每根手指各走一次流程</h4>
<p>瀏覽器的一次 <code>touchstart</code> 裡，可能同時有好幾根新手指（<code>changedTouches</code>）。引擎會把它們拆開，每根手指各做一次點擊判定、各自被認領。這帶來一個很實際的後果：兩根手指同時按在「猜高」和「猜低」兩顆按鈕上，<b>兩顆按鈕都會發出 click</b>，而且可能在同一個影格裡。</p>
<figure class="figure"><svg viewBox="0 0 680 230" class="fg" style="width:100%;max-width:680px" role="img" aria-label="時間軸：手指 0 被「猜高」按鈕認領，手指 1 被「猜低」按鈕認領；中途才鎖上輸入，兩根手指放開時照樣各自觸發 click">
<text x="20" y="66" class="fg-t">手指 0</text><text x="20" y="136" class="fg-t">手指 1</text>
<line x1="380" y1="30" x2="380" y2="178" class="fg-l warm dash"/>
<text x="380" y="22" text-anchor="middle" class="fg-t sm warm">這時才鎖上輸入</text>
<rect x="150" y="50" width="320" height="26" rx="5" class="fg-b alt"/><text x="265" y="68" text-anchor="middle" class="fg-t sm">被「猜高」按鈕認領</text>
<circle cx="150" cy="63" r="5" class="fg-lamp on"/><circle cx="470" cy="63" r="5" class="fg-lamp on"/>
<text x="150" y="42" text-anchor="middle" class="fg-t sm mono">START</text>
<text x="470" y="42" text-anchor="middle" class="fg-t sm acc">END → 猜高 click</text>
<rect x="250" y="120" width="300" height="26" rx="5" class="fg-b alt"/><text x="320" y="138" text-anchor="middle" class="fg-t sm">被「猜低」按鈕認領</text>
<circle cx="250" cy="133" r="5" class="fg-lamp on"/><circle cx="550" cy="133" r="5" class="fg-lamp on"/>
<text x="250" y="112" text-anchor="middle" class="fg-t sm mono">START</text>
<text x="550" y="112" text-anchor="middle" class="fg-t sm acc">END → 猜低 click</text>
<line x1="110" y1="194" x2="652" y2="194" class="fg-l dim"/><polygon points="660,194 652,189.5 652,198.5" class="fg-a"/>
<text x="110" y="214" class="fg-t sm">時間</text>
<text x="660" y="214" text-anchor="end" class="fg-t sm">兩次猜測都送出了</text>
</svg><figcaption>每根手指在按下的那一刻就決定了歸誰。鎖上輸入只擋得住之後才按下的手指，已經被認領的手指放開時照樣送出 click。</figcaption></figure>
<p>引擎的設定 <code>macro.ENABLE_MULTI_TOUCH</code> 預設是 true，最多同時追蹤 8 根手指。設成 false，引擎同一時間只接受一根手指，第二根直接忽略。單手玩的卡牌遊戲、選單很多的遊戲，關掉多點觸控是最省事的防呆。另外，手指表滿了的時候，引擎會把超過 <code>macro.TOUCH_TIMEOUT</code>（預設 5000 毫秒）沒有更新的舊手指清掉，避免某次漏掉的 touchend 讓表永遠卡滿。</p>
<p>在監聽裡，<code>e.getID()</code> 是這根手指的編號，<code>e.getTouches()</code> 是這次事件帶的手指，<code>e.getAllTouches()</code> 是此刻螢幕上所有的手指。電腦上的滑鼠，會被模擬成 id 為 0 的手指。</p>
<h4>點擊、拖曳、長按：用兩個門檻分開</h4>
<p>這三種手勢都從同一個 TOUCH_START 開始，差別只在「手指動了多遠」和「按了多久」。寫成一個小小的狀態機：</p>
<figure class="figure"><svg viewBox="0 0 640 290" class="fg" style="width:100%;max-width:640px" role="img" aria-label="手勢狀態機：閒置按下後變成按著；移動超過門檻變拖曳；按住超過 0.5 秒變長按；沒移動也沒逾時就放開是點擊；拖曳和長按放開後回到閒置">
<rect x="20" y="122" width="110" height="40" rx="8" class="fg-b"/><text x="75" y="147" text-anchor="middle" class="fg-t">閒置</text>
<rect x="220" y="122" width="120" height="40" rx="8" class="fg-b hot"/><text x="280" y="147" text-anchor="middle" class="fg-t acc">按著</text>
<rect x="470" y="40" width="150" height="40" rx="8" class="fg-b alt"/><text x="545" y="65" text-anchor="middle" class="fg-t">拖曳</text>
<rect x="470" y="204" width="150" height="40" rx="8" class="fg-b warm"/><text x="545" y="229" text-anchor="middle" class="fg-t">長按</text>
<line x1="130" y1="134" x2="212" y2="134" class="fg-l on"/><polygon points="220,134 212,129.5 212,138.5" class="fg-a on"/>
<text x="175" y="125" text-anchor="middle" class="fg-t sm acc">按下</text>
<line x1="220" y1="152" x2="138" y2="152" class="fg-l"/><polygon points="130,152 138,147.5 138,156.5" class="fg-a"/>
<text x="175" y="176" text-anchor="middle" class="fg-t sm">放開 → 點擊</text>
<line x1="340" y1="128" x2="463" y2="66" class="fg-l alt"/><polygon points="470,62 461.4,62.6 465.4,70.6" class="fg-a alt"/>
<text x="396" y="80" text-anchor="end" class="fg-t sm alt">移動 &gt; 10</text>
<line x1="340" y1="156" x2="463" y2="218" class="fg-l warm"/><polygon points="470,222 465.4,213.4 461.4,221.4" class="fg-a warm"/>
<text x="398" y="214" text-anchor="end" class="fg-t sm warm">按住 &gt; 0.5 秒</text>
<path d="M545 40 V22 H75 V114" class="fg-l dim"/><polygon points="75,122 70.5,114 79.5,114" class="fg-a"/>
<text x="300" y="40" text-anchor="middle" class="fg-t sm">放開：拖曳結束</text>
<path d="M545 244 V266 H75 V170" class="fg-l dim"/><polygon points="75,162 70.5,170 79.5,170" class="fg-a"/>
<text x="300" y="282" text-anchor="middle" class="fg-t sm">放開：不算點擊</text>
</svg><figcaption>同一個 TOUCH_START，看之後先發生哪件事：先移動超過門檻就是拖曳，先撐過時間就是長按，兩者都沒發生就放開，才是點擊。</figcaption></figure>
<pre><code>const SLOP = 10;         // UI units; less is a shaky finger
const LONG_PRESS = 0.5;  // seconds
const T = Node.EventType;

@ccclass('Gesture')
export class Gesture extends Component {
    private id = -1;     // the finger we follow; -1 = none
    private start = new Vec2();
    private dragging = false;
    private longFired = false;

    onEnable() {
        this.node.on(T.TOUCH_START, this.onStart, this);
        this.node.on(T.TOUCH_MOVE, this.onMove, this);
        this.node.on(T.TOUCH_END, this.onEnd, this);
        this.node.on(T.TOUCH_CANCEL, this.onCancel, this);
    }
    onDisable() {
        this.node.targetOff(this);
        this.unschedule(this.onLong);
        this.id = -1;
    }

    private onStart(e: EventTouch) {
        if (this.id !== -1) return;  // a second finger: ignore it
        this.id = e.getID()!;
        e.getUILocation(this.start);
        this.dragging = this.longFired = false;
        this.scheduleOnce(this.onLong, LONG_PRESS);
    }
    private onMove(e: EventTouch) {
        if (e.getID() !== this.id) return;
        const moved = Vec2.distance(e.getUILocation(), this.start);
        if (!this.dragging &amp;&amp; moved &gt; SLOP) {
            this.dragging = true;
            this.unschedule(this.onLong);
        }
        if (this.dragging) this.node.emit('drag', e.getUIDelta());
    }
    private onEnd(e: EventTouch) {
        if (e.getID() !== this.id) return;
        this.unschedule(this.onLong);
        const isTap = !this.dragging &amp;&amp; !this.longFired;
        if (isTap) this.node.emit('tap');
        this.id = -1;
    }
    private onCancel(e: EventTouch) {
        if (e.getID() !== this.id) return;
        this.unschedule(this.onLong);
        this.id = -1;
    }
    private onLong() {
        this.longFired = true;
        this.node.emit('long-press');
    }
}</code></pre>
<p>門檻怎麼選，是手感問題，也是工程問題：</p>
<ul>
<li><b>移動門檻（touch slop）</b>：太小，手指一抖就變拖曳，點擊常常失敗；太大，拖曳起步時會先「黏」一下才動。ScrollView 用 7 個 UI 單位，Android 系統的預設大約是 8 dp。要注意 UI 單位不等於實際大小：設計寬 720 的遊戲放在 390 點寬的手機上，1 個點約是 1.85 個 UI 單位，10 個 UI 單位只有 5 個點出頭；放到平板上又是另一個數字。講究的做法是依螢幕實際尺寸換算。</li>
<li><b>長按時間</b>：常見落在 0.4 到 0.5 秒之間（這是常見值，不是標準）。太短，玩家只是按久一點就誤觸；太長，玩家以為壞了。長按成立的那一刻一定要給回饋，例如放大或震動，玩家才知道「到了，可以放開」。</li>
<li><b>雙擊</b>：要分出單擊和雙擊，每一次單擊都得等一下，看第二下會不會來（通常等 0.25 到 0.3 秒）。所有單擊因此都變慢，這就是遊戲很少用雙擊的原因。</li>
</ul>
<h4>兩指縮放</h4>
<p>雙指縮放（pinch）只要追兩根手指之間的距離：</p>
<pre><code>private startDist = 0;
private startScale = 1;

onMove(e: EventTouch) {
    const all = e.getAllTouches();
    if (all.length &lt; 2) return;
    const a = all[0].getUILocation(), b = all[1].getUILocation();
    const d = Vec2.distance(a, b);
    if (this.startDist === 0) {     // the second finger just joined
        this.startDist = d;
        this.startScale = this.node.scale.x;
        return;
    }
    const ratio = d / this.startDist;
    const s = math.clamp(this.startScale * ratio, 0.5, 3);
    this.node.setScale(s, s, 1);
}
// set startDist back to 0 in onEnd and onCancel</code></pre>
<p>要注意，第二根手指按下時也會做點擊判定。它如果落在別的節點上（例如一顆按鈕），就被那個節點認領：那根手指的移動事件送不到你這裡，那顆按鈕還會被按下去。所以縮放用的監聽，要掛在蓋滿整個可縮放區域的節點上，並且讓那一區不要有其他會接觸控的節點。</p>

<h3><span class="badge lv3">專業</span>六、動畫進行中的輸入，與防止連點</h3>
<p>點擊判定用的是「這一刻」的世界矩陣。也就是說，正在從 0 放大的彈窗，縮放一大於 0 就點得到；正在飛向桌面的牌，飛到哪裡就點得到哪裡。玩家的手指常常比動畫快，這類問題在自己測試時不容易遇到，上線後玩家一多，就一定會遇到。</p>
<h4>三種常見的出事方式</h4>
<table>
<tr><th>情境</th><th>發生什麼事</th></tr>
<tr><td>連點兩下「猜高」</td><td>第一下送出猜測、開始翻牌；第二下在翻牌動畫中又送一次。分數算兩次，或伺服器收到兩筆。</td></tr>
<tr><td>兩根手指同時按「猜高」和「猜低」</td><td>兩根手指各自被認領，兩顆按鈕在同一個影格都發出 click。只關掉「被按的那一顆」擋不住另一顆。</td></tr>
<tr><td>彈窗還在放大，玩家就按了「關閉」</td><td>關閉動畫和開啟動畫同時在跑，彈窗卡在一半，或關掉之後又自己打開。</td></tr>
</table>
<h4>第一道防線：看狀態，不是看按鈕</h4>
<p>最可靠的防線，是讓遊戲邏輯自己知道「現在能不能猜」。按鈕只是輸入的來源之一（還有鍵盤、自動化測試），所以判斷要放在邏輯裡：</p>
<pre><code>private state: 'idle' | 'revealing' = 'idle';

onGuess(higher: boolean) {
    // every extra press stops here
    if (this.state !== 'idle') return;
    this.state = 'revealing';
    // looks disabled, and Button ignores presses
    this.setButtons(false);
    this.reveal(higher, () =&gt; {
        this.state = 'idle';
        this.setButtons(true);
    });
}

private setButtons(on: boolean) {
    this.higherButton.interactable = on;
    this.lowerButton.interactable = on;
}</code></pre>
<p>兩根手指同時按的情況，兩次 click 都會進到 <code>onGuess</code>，第二次被 <code>state</code> 擋下。如果猜測要送到伺服器，伺服器也要能擋：每次猜測帶上這一局的編號，同一個編號只算一次。用戶端的防連點只是讓體驗變好，真正的正確性要靠伺服器的冪等性（idempotency）。</p>
<h4>第二道防線：轉場期間鎖住整個畫面</h4>
<p>彈窗開關、換場景這類轉場，常見做法是在 Canvas 最上層放一個蓋滿螢幕的節點，掛上 BlockInputEvents，平常停用，轉場時啟用。鎖要做成「計數」的，因為兩段轉場可能重疊：</p>
<pre><code>@ccclass('InputLock')
export class InputLock extends Component {
    // on a full-screen node, the last child of the Canvas
    @property(BlockInputEvents) blocker: BlockInputEvents = null!;
    private count = 0;

    onLoad() { this.blocker.enabled = false; }
    lock() {
        if (++this.count === 1) this.blocker.enabled = true;
    }
    unlock() {
        if (this.count === 0) return;
        if (--this.count === 0) this.blocker.enabled = false;
    }
}</code></pre>
<p>BlockInputEvents 在 <code>onEnable</code> 裝上監聽、在 <code>onDisable</code> 拿掉，所以切換元件的 <code>enabled</code> 就夠了，節點本身不用動。每一次 <code>lock()</code> 都要配一次 <code>unlock()</code>，而且要放在一定會執行到的地方，例如動畫最後一個 <code>call</code>，或 <code>try</code> 的 <code>finally</code>。少解一次，畫面就永遠點不動，這是上線後最難查的問題之一。建議在開發版把 <code>count</code> 顯示在螢幕角落。</p>
<div class="warn">鎖只擋得住<b>之後才按下</b>的手指。認領是在 TOUCH_START 那一刻決定的：玩家的手指如果在上鎖前就按在按鈕上，上鎖後才放開，那根手指的 TOUCH_END 還是會送到按鈕，click 照樣發出。所以鎖是第二道防線，第一道永遠是邏輯裡的狀態檢查。</div>
<p>換場景也一樣。<code>director.loadScene</code> 載入新場景的那段時間，舊場景還活著、還點得到。按下「開始」之後就上鎖，至少也要把按鈕關掉。</p>

<h3><span class="badge lv4">專家</span>七、鍵盤、焦點，以及嵌在網頁裡的遊戲</h3>
<h4>鍵盤事件是掛在畫布上的</h4>
<p>在網頁上，Cocos 的鍵盤監聽掛在遊戲畫布上，不是掛在 <code>window</code> 上。畫布要有焦點（focus）才收得到按鍵。官方的網頁範本給畫布加了 <code>tabindex</code>，讓它能拿到焦點；引擎在觸控開始和滑鼠按下時，也會主動呼叫 <code>canvas.focus()</code>。</p>
<p>這平常感覺不出來，但遊戲嵌在 Vue 的頁面裡就會出事：玩家點了一下 Vue 做的設定面板，焦點跑到面板上，方向鍵就控制不了遊戲，直到玩家再點一下畫面。解法是關掉面板時，順手把焦點還給畫布：</p>
<pre><code>// in the Vue component that closes the overlay
document.getElementById('GameCanvas')?.focus();</code></pre>
<p>反過來，畫布有焦點的時候，引擎會對按鍵呼叫 <code>preventDefault()</code>。如果你在畫布上面疊了一個 HTML 輸入框，要讓它自己拿到焦點，不然字打不進去。</p>
<h4>三個鍵盤事件，以及「實體按鍵」</h4>
<table>
<tr><th>事件</th><th>什麼時候</th></tr>
<tr><td><code>KEY_DOWN</code></td><td>按下去的第一次</td></tr>
<tr><td><code>KEY_PRESSING</code></td><td>按住不放時，作業系統自動重複送出的那些（瀏覽器的 <code>event.repeat</code> 是 true）</td></tr>
<tr><td><code>KEY_UP</code></td><td>放開</td></tr>
</table>
<p>所以「按住方向鍵一直走」不要寫在 KEY_PRESSING 裡：自動重複的延遲和速度是作業系統的設定，每台電腦都不一樣。正確做法是 KEY_DOWN 記下「這個鍵按著」、KEY_UP 清掉，然後在 <code>update(dt)</code> 裡依照按著的鍵移動。</p>
<p>引擎的 <code>KeyCode</code> 是從瀏覽器的 <code>event.code</code> 換來的，代表<b>鍵盤上的實體位置</b>，不是鍵帽上印的字。所以 WASD 移動在各種鍵盤排列（例如 AZERTY）上都在同一個位置，這是好事；但它不適合拿來收文字。要讓玩家輸入名字，就用 EditBox：它在網頁上會真的建立一個 HTML 的 <code>input</code>，輸入法、複製貼上、手機鍵盤都正常運作。</p>
<h4>幾個少有人知道的細節</h4>
<ul>
<li><b>事件物件會被重複使用。</b>同一次瀏覽器事件裡有好幾根手指時，引擎用同一個 EventTouch 物件依序派送；派送途中還會改它的 <code>type</code>（例如在節點外放開，TOUCH_END 會被改成 TOUCH_CANCEL）。之後還要用的值，當場複製出來，不要把 <code>event</code> 本身存起來。</li>
<li><b>自己在 window 上聽觸控，要小心 passive。</b>Chrome 把掛在 <code>window</code>、<code>document</code>、<code>body</code> 上的 touchstart 和 touchmove 預設成 passive，裡面呼叫 <code>preventDefault()</code> 會被忽略。引擎是掛在畫布上，不受影響。</li>
<li><b><code>systemEvent</code> 已經過時。</b>3.4 以後，全域輸入改用 <code>input</code>。舊教學裡的 <code>systemEvent.on</code> 不要再寫。</li>
<li><b>停用的 Button 還是會吞觸控。</b><code>interactable = false</code> 的 Button 身上仍然掛著監聽，所以點擊判定照樣選中它，底下的節點收不到。但它這時不會設 <code>propagationStopped</code>，事件會繼續冒泡到父節點。父節點如果也在聽 TOUCH_END，點在停用的按鈕上，就會觸發父節點的邏輯。</li>
<li><b>自動化測試直接 emit，會繞過點擊判定。</b><code>button.node.emit(Button.EventType.CLICK, button)</code> 一定會成功，就算按鈕被彈窗蓋住、被停用也一樣。這種測試測不到「玩家其實按不到」的情況。</li>
</ul>
<h4>跟 DOM 事件逐項對照</h4>
<table>
<tr><th>網頁 DOM（Vue）</th><th>Cocos Creator 3.8</th></tr>
<tr><td><b>誰能被點到</b>：每個元素都能，除非設了 <code>pointer-events: none</code></td><td>只有掛了觸控或滑鼠監聽的節點；其他節點等於預設就是 none</td></tr>
<tr><td><b>判定範圍</b>：元素的方框，包含 CSS transform</td><td>UITransform 的矩形，包含旋轉、縮放，再扣掉 Mask 遮住的地方</td></tr>
<tr><td><b>三個階段</b>：捕獲、目標、冒泡</td><td>一樣；捕獲監聽用 <code>on</code> 的第四個參數 <code>true</code></td></tr>
<tr><td><b>停止傳遞</b>：<code>stopPropagation()</code>、<code>@click.stop</code></td><td><code>event.propagationStopped = true</code></td></tr>
<tr><td><b>只觸發一次</b>：<code>{ once: true }</code>、<code>@click.once</code></td><td><code>node.once(...)</code></td></tr>
<tr><td><b>只處理自己身上的</b>：<code>@click.self</code></td><td>自己比對 <code>event.target</code> 和 <code>event.currentTarget</code> 是不是同一個</td></tr>
<tr><td><b>手指拖出元素外</b>：觸控事件的 target 一直是按下的元素</td><td>一樣：認領的節點一直收到 MOVE，在外面放開變成 CANCEL</td></tr>
<tr><td><b>讓底下的也收到</b>：沒有直接對應</td><td><code>event.preventSwallow = true</code></td></tr>
<tr><td><b>立刻停止</b>：<code>stopImmediatePropagation()</code></td><td>有 <code>propagationImmediateStopped</code>，但行為跟 DOM 不完全一樣，用 <code>propagationStopped</code> 就好</td></tr>
</table>

<h3>八、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>透明度是 0 的節點點不到</td><td>透明度是 0 的節點不會被畫出來，但只要身上有監聽，點擊判定照樣選得到它。要拿掉它，設 <code>active = false</code>。</td></tr>
<tr><td>全域 <code>input</code> 聽得到所有觸控</td><td>它排在 UI 節點後面，只聽得到沒有被任何節點接走的觸控。</td></tr>
<tr><td>手指滑出按鈕，按鈕就收不到事件了</td><td>認領它的節點會一直收到 TOUCH_MOVE，放開時才判定是 TOUCH_END 還是 TOUCH_CANCEL。</td></tr>
<tr><td>鎖住輸入之後，什麼點擊都不會發生</td><td>上鎖前就按下的手指，放開時照樣送到原本的節點。鎖要配合邏輯裡的狀態檢查。</td></tr>
<tr><td>圓形按鈕只有圓的部分點得到</td><td>判定的是 UITransform 的矩形，透明的四個角也算。</td></tr>
<tr><td>把按鈕的 interactable 關掉，就不會重複送出</td><td>兩根手指、鍵盤、另一顆按鈕都還進得來。要靠邏輯狀態擋，伺服器還要能擋重複的請求。</td></tr>
</table>

<h3>九、跟你的工作連起來</h3>
<ul>
<li><b>Vue 前端</b>：DOM 事件和 Cocos 事件是同一套「捕獲、目標、冒泡」的思路，差在 Cocos 只讓有監聽的節點參加判定。前端常見的虛擬捲動、拖曳排序、手勢套件，背後也是這一章的門檻和狀態機。</li>
<li><b>Cocos 遊戲</b>：每個會改變遊戲狀態的按鈕，都該問三個問題：連點兩下會怎樣？兩根手指同時按會怎樣？動畫播到一半按會怎樣？把狀態檢查、輸入鎖、按鈕停用三件事做成整個專案共用的工具，不要每個畫面各寫一次。</li>
<li><b>Node.js、Go 後端</b>：用戶端再怎麼防，網路重送、玩家改封包都會讓同一個請求來兩次。每一筆會改變狀態的請求都帶一個唯一編號，伺服器用它去重（冪等鍵，idempotency key），這是後端面試的經典題。</li>
<li><b>測試與維運</b>：用 Playwright 這類工具測網頁版遊戲時，模擬的是真的滑鼠或觸控，會經過整條路徑；直接在程式裡 emit 事件則會跳過點擊判定。兩種測試要分清楚各自能證明什麼。</li>
</ul>

<h3>十、面試會怎麼問</h3>
<p>下面是遊戲前端、互動前端面試裡真的會出現的題目。先自己講一遍（最好出聲講），再打開參考答案。</p>
<ol>
<li>「在 Cocos Creator 裡，一次觸控是怎麼決定要交給哪個節點的？」</li>
<li>「ScrollView 裡放了按鈕。為什麼手指按在按鈕上拖一下，列表會捲動，按鈕卻不會觸發？」</li>
<li>「玩家連點按鈕，造成同一個操作送出兩次。你會怎麼從用戶端到伺服器整個處理？」</li>
<li>「我在全域 input 聽了 TOUCH_START，可是點在按鈕上聽不到。為什麼？」</li>
<li>「你會怎麼分辨點擊、拖曳、長按？門檻怎麼選？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>引擎維護一份「啟用中、有 UITransform、有觸控監聽」的節點名單，先依攝影機優先權、再依樹的順序排序（子節點先於父節點、後面的兄弟先於前面的），也就是後畫的先問。TOUCH_START 時照順序做點擊判定：把螢幕座標經攝影機換成世界座標，再用節點世界矩陣的反矩陣換成本地座標，檢查是否落在矩形內，並檢查祖先 Mask。第一個命中的節點認領這根手指，之後的 MOVE、END 都直接交給它；事件在節點樹上照捕獲、目標、冒泡派送。</li>
<li>Button 是目標，它會停止冒泡，但 ScrollView 用捕獲階段監聽，所以每次移動都先看到。手指離起點超過門檻（3.8 原始碼裡是 7 個 UI 單位）時，ScrollView 對 Button 送一個模擬的 TOUCH_CANCEL，Button 清掉按住的狀態，放開時就不會發出 click。這個行為由 cancelInnerEvents 控制。</li>
<li>分三層。第一層在遊戲邏輯：用狀態機，非閒置狀態直接忽略新的操作，因為按鈕之外還有鍵盤、多點觸控等來源。第二層在 UI：按下後立刻把相關按鈕設成不可互動，轉場期間用計數式的全螢幕輸入鎖；並且知道鎖擋不住上鎖前就按下的手指。第三層在伺服器：每個請求帶唯一編號，伺服器用它去重，確保重送也只生效一次。</li>
<li>input 的派送器有優先權，UI 節點的派送器排在全域監聽前面。只要有節點在點擊判定中接走這次觸控，派送器就會回報不再往下傳，全域監聽就收不到。需要全畫面的觸控，可以改在一個蓋滿畫面的節點上聽，或用 preventSwallow 讓觸控繼續往下。</li>
<li>從 TOUCH_START 開始，記下起點和時間，開一個長按計時器。移動超過門檻就進入拖曳並取消計時；計時器先到就是長按；兩者都沒發生就放開，才算點擊。門檻要考慮實際的物理尺寸，常見的移動門檻大約是 8 到 10 個點，長按約 0.4 到 0.5 秒。還要只追蹤一根手指，並在 CANCEL 和元件停用時清掉狀態與計時器。</li>
</ol>
</details>

<h3>十一、練功題（做得出來才算真的懂）</h3>
<ol>
<li>一支手機的螢幕是 360 × 800 CSS 像素，DPR 是 3。遊戲設計解析度 720 × 1280，Fit Width。手指點在 <code>clientX = 90</code>、<code>clientY = 200</code>。請算出 <code>getLocation()</code> 和 <code>getUILocation()</code>，以及這支手機看得到的 UI 範圍。</li>
<li>節點樹：Canvas 底下依序有 Bg（沒監聽）、Board（有監聽，底下依序有 Cell1、Cell2、Cell3，都有監聽）、Hud（沒監聽，底下有一顆 PauseButton）。請寫出點擊判定問的順序。</li>
<li>同事在 Table 上聽 TOUCH_END，用 <code>event.target</code> 判斷點到哪張牌，結果 target 永遠是 Table。牌身上都沒有監聽。為什麼？請給兩種修法。</li>
<li>一張牌同時要「點一下翻面」和「長按顯示說明」。如果你用 Button 的 click 來翻面，長按完放開時會發生什麼事？怎麼修？</li>
<li>上線後偶爾有玩家回報「畫面點不動」，你懷疑是第六節的輸入鎖沒有解開。請列出三個可能讓 <code>unlock()</code> 沒執行到的原因，以及你會怎麼查。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>裝置像素是 1080 × 2400。x = 90 × 3 = 270；y = (800 − 200) × 3 = 1800，所以 <code>getLocation()</code> 是 (270, 1800)。縮放倍率 1080 ÷ 720 = 1.5，<code>getUILocation()</code> 是 (180, 1200)。看得到的範圍是 720 × 1600（2400 ÷ 1.5）。</li>
<li>PauseButton、Cell3、Cell2、Cell1、Board。Hud 這棵子樹在 Board 後面，所以先問；Bg、Hud 沒有監聽，不在名單上；Board 是父節點，排在它的子節點後面。（PauseButton 是 Button，身上有監聽。）</li>
<li>沒有監聽的節點不參加點擊判定，所以命中的只有 Table，target 就是 Table。修法一：每張牌掛自己的監聽（或 Button），並視需要停止冒泡。修法二：保留 Table 上的一個監聽，在裡面自己逐張呼叫 <code>card.getComponent(UITransform)!.hitTest(e.getLocation())</code>，從最上層的牌開始找。注意 hitTest 吃的是螢幕座標 getLocation，不是 UI 座標。</li>
<li>Button 只看「按下後有沒有在範圍內放開」，長按完放開時它照樣發出 click，牌就在顯示說明的同時翻面了。修法：不要用 Button 的 click，改用第五節的手勢元件，長按成立後把 longFired 設起來，放開時不送 tap；或在 click 處理裡檢查「剛剛是不是長按」。</li>
<li>可能的原因：(1) lock 之後的程式丟出例外，unlock 沒有放在 finally；(2) 轉場用的 tween 被 <code>Tween.stopAllByTarget</code> 提前停掉，最後那個負責 unlock 的 <code>call</code> 永遠沒跑；(3) 彈窗在轉場途中被銷毀或換了場景，負責 unlock 的回呼也跟著不見；(4) 某條路徑 lock 了兩次卻只 unlock 一次。查法：開發版在角落顯示 count；lock 時記下呼叫來源（例如 <code>new Error().stack</code>），count 長時間不為 0 就印出還沒解的來源；在負責轉場的元件 onDestroy 裡補一次 unlock。</li>
</ol>
</details>

<h3>十二、想再挖深</h3>
<ul>
<li><b>Cocos Creator 3.8 使用手冊</b>（<a href="https://docs.cocos.com/creator/3.8/manual/en/">docs.cocos.com/creator/3.8/manual</a>）：事件系統、輸入事件、ScrollView、BlockInputEvents 的官方說明，有中文和英文版。</li>
<li><b>Cocos 引擎原始碼</b>（<a href="https://github.com/cocos/cocos-engine">github.com/cocos/cocos-engine</a>）：這一章的行為都可以在原始碼裡驗證。從 <code>cocos/2d/event/pointer-event-dispatcher.ts</code>（名單排序與認領）、<code>cocos/scene-graph/node-event-processor.ts</code>（三個階段）、<code>cocos/ui/scroll-view.ts</code>（7 個單位的門檻）讀起。</li>
<li><b>MDN：Touch events</b>（<a href="https://developer.mozilla.org/en-US/docs/Web/API/Touch_events">developer.mozilla.org</a>）：瀏覽器這一層的觸控事件、<code>changedTouches</code>、preventDefault 的效果，寫得最清楚的參考。</li>
<li><b>Apple Human Interface Guidelines 與 Material Design</b>：兩家對觸控目標大小的建議（Apple 44 × 44 點、Material 48 × 48 dp），是決定按鈕和門檻大小的起點。</li>
<li><b>Steve Swink《Game Feel》</b>：從輸入、反應到回饋，講「操作手感」怎麼設計的經典書，第五節的門檻、下一課的動畫回饋，都在這本書的範圍裡。</li>
</ul>
` });
