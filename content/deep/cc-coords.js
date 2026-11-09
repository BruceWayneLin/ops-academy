DEEP({ 'cc-coords': `
<p>上一課你學會了錨點、四個邊的公式、本地座標和世界座標，也知道設計解析度和 Widget 是做什麼的。這一章把「一個點到底在哪裡」從頭拆到尾：手指碰到玻璃的那一點，要經過哪幾層換算，才變成你節點裡的 (242, 70)；一張 720 × 1280 的設計，放到瀏海手機、長型手機和平板上，各會發生什麼事；Widget 是在一個影格裡的哪個時間點動手的；以及畫面上的圖為什麼有時候會糊。每一層都用真的數字算一次。這些弄懂了，「東西跑到錯的地方」「在平板上被切掉」「圖比設計稿糊」這三大類問題，你都能自己找到原因。</p>
<p>這一章的數字，都是對照 Cocos Creator 3.8 的引擎原始碼算出來的。手機尺寸用的是常見的典型值，不同機型會有一點差異。</p>

<h3><span class="badge lv1">基礎</span>一、同一個點，四種說法：座標空間是一層一層的</h3>
<p>你跟朋友約在百貨公司。你可以說「三樓手扶梯左邊」，也可以說「信義路上某某號」，還可以說「手機地圖上，從左上角數過來第 300 個像素」。三句話講的是同一個地方，只是<b>參考點</b>不一樣，數字就跟著不一樣。座標空間（coordinate space）就是「從哪裡量起、用什麼單位量」的約定。</p>
<p>在 Cocos 的 2D 畫面裡，你會碰到四層，再加上瀏覽器自己的一層：</p>
<figure class="figure"><svg viewBox="0 0 700 240" class="fg" style="width:100%;max-width:700px" role="img" aria-label="五個座標空間排成一列：節點空間、父節點空間、世界空間、螢幕空間、瀏覽器 DOM。上排箭頭往右，代表把節點裡的點換到螢幕；下排箭頭往左，代表把手指的位置換回節點裡">
<path d="M74 78 V58 H340 V70" class="fg-l on"/><polygon points="340,78 335.5,70 344.5,70" class="fg-a on"/>
<text x="207" y="48" text-anchor="middle" class="fg-t sm mono acc">convertToWorldSpaceAR()</text>
<path d="M360 78 V58 H482 V70" class="fg-l"/><polygon points="482,78 477.5,70 486.5,70" class="fg-a"/>
<text x="421" y="48" text-anchor="middle" class="fg-t sm">× 縮放＋黑邊位移</text>
<path d="M494 78 V58 H620 V70" class="fg-l"/><polygon points="620,78 615.5,70 624.5,70" class="fg-a"/>
<text x="557" y="48" text-anchor="middle" class="fg-t sm">÷ DPR、y 翻轉</text>
<rect x="10" y="78" width="128" height="80" rx="7" class="fg-b hot"/>
<text x="74" y="103" text-anchor="middle" class="fg-t lg">節點空間</text>
<text x="74" y="124" text-anchor="middle" class="fg-t sm">原點：自己的錨點</text>
<text x="74" y="142" text-anchor="middle" class="fg-t sm">設計單位，y 朝上</text>
<rect x="148" y="78" width="128" height="80" rx="7" class="fg-b"/>
<text x="212" y="103" text-anchor="middle" class="fg-t lg">父節點空間</text>
<text x="212" y="124" text-anchor="middle" class="fg-t sm">原點：父節點錨點</text>
<text x="212" y="142" text-anchor="middle" class="fg-t sm">position 寫在這裡</text>
<rect x="286" y="78" width="128" height="80" rx="7" class="fg-b alt"/>
<text x="350" y="103" text-anchor="middle" class="fg-t lg">世界空間</text>
<text x="350" y="124" text-anchor="middle" class="fg-t sm">原點：可見範圍左下</text>
<text x="350" y="142" text-anchor="middle" class="fg-t sm">設計單位，y 朝上</text>
<rect x="424" y="78" width="128" height="80" rx="7" class="fg-b"/>
<text x="488" y="103" text-anchor="middle" class="fg-t lg">螢幕空間</text>
<text x="488" y="124" text-anchor="middle" class="fg-t sm">原點：畫布左下</text>
<text x="488" y="142" text-anchor="middle" class="fg-t sm">實體像素，y 朝上</text>
<rect x="562" y="78" width="128" height="80" rx="7" class="fg-b warm"/>
<text x="626" y="103" text-anchor="middle" class="fg-t lg">瀏覽器 DOM</text>
<text x="626" y="124" text-anchor="middle" class="fg-t sm">原點：左上角</text>
<text x="626" y="142" text-anchor="middle" class="fg-t sm">CSS 像素，y 朝下</text>
<path d="M626 158 V178 H494 V166" class="fg-l alt"/><polygon points="494,158 489.5,166 498.5,166" class="fg-a alt"/>
<text x="560" y="196" text-anchor="middle" class="fg-t sm alt">引擎：getLocation()</text>
<path d="M482 158 V178 H362 V166" class="fg-l alt"/><polygon points="362,158 357.5,166 366.5,166" class="fg-a alt"/>
<text x="422" y="196" text-anchor="middle" class="fg-t sm mono alt">getUILocation()</text>
<path d="M340 158 V178 H74 V166" class="fg-l alt"/><polygon points="74,158 69.5,166 78.5,166" class="fg-a alt"/>
<text x="207" y="196" text-anchor="middle" class="fg-t sm mono alt">convertToNodeSpaceAR()</text>
<text x="350" y="226" text-anchor="middle" class="fg-t sm">上排往右：節點裡的點最後落在螢幕哪裡；下排往左：手指的位置換回節點裡</text>
</svg><figcaption>每往外一層，就多乘一次「那一層的變換」。往內走就是反過來，乘上反矩陣。你寫遊戲時最常用的，是上下兩排綠色和藍色的那幾個呼叫。</figcaption></figure>
<ul>
<li><b>節點空間</b>（node space）：原點就是這個節點自己的錨點（anchor point），軸跟著節點一起轉、一起縮放。<code>convertToNodeSpaceAR</code> 算出來的數字就在這裡。</li>
<li><b>父節點空間</b>（parent space）：節點的 <code>position</code> 是用這一層寫的，也就是上一課說的本地座標（local coordinates）。</li>
<li><b>世界空間</b>：對 Canvas 底下的 UI 來說，原點在可見範圍的左下角，單位是設計單位。<code>worldPosition</code> 和觸控事件的 <code>getUILocation()</code> 都在這一層，這也是上一課說「它們在同一個空間」的原因。</li>
<li><b>螢幕空間</b>（screen space）：單位是畫布的<b>實體像素</b>，原點在畫布左下角、y 朝上。觸控事件的 <code>getLocation()</code>、UITransform 的 <code>hitTest()</code> 吃的是這一種。</li>
<li><b>瀏覽器 DOM</b>：<code>clientX</code>、<code>clientY</code> 是 CSS 像素、從左上角量、y 朝下。這一層引擎會幫你換掉，你通常不用碰，但要知道它存在，因為 y 方向剛好相反。</li>
</ul>
<div class="note"><b>為什麼要分這麼多層？</b>因為每一層都有人會變。牌桌整個縮小，牌在牌桌裡的座標不用改；換一支手機，整個遊戲的座標不用改。每一層只管自己那一段，改動就不會一路擴散出去。這跟你在 Vue 裡把元件拆開、各管各的，是同一個想法。</div>

<h3><span class="badge lv1">基礎</span>二、節點空間的原點就是錨點</h3>
<p>上一課的四邊公式，換個角度看會更好記：在節點自己的空間裡，<b>(0, 0) 永遠是錨點</b>。那個框從 (−ax × w, −ay × h) 一路延伸到 ((1 − ax) × w, (1 − ay) × h)。下面是同一張 200 × 280 的牌，換三種錨點：</p>
<figure class="figure"><svg viewBox="0 0 660 290" class="fg" style="width:100%;max-width:660px" role="img" aria-label="同一張 200 乘 280 的牌，錨點分別是中心、左下角、底邊中點時，原點的位置和四個邊的座標">
<text x="110" y="28" text-anchor="middle" class="fg-t lg">錨點 (0.5, 0.5)</text>
<text x="330" y="28" text-anchor="middle" class="fg-t lg">錨點 (0, 0)</text>
<text x="550" y="28" text-anchor="middle" class="fg-t lg">錨點 (0.5, 0)</text>
<rect x="60" y="90" width="100" height="140" rx="4" class="fg-b alt"/>
<line x1="30" y1="160" x2="190" y2="160" class="fg-l dim dash"/><line x1="110" y1="56" x2="110" y2="240" class="fg-l dim dash"/>
<circle cx="110" cy="160" r="4.5" class="fg-lamp on"/><text x="117" y="153" class="fg-t sm acc">(0, 0)</text>
<rect x="280" y="90" width="100" height="140" rx="4" class="fg-b alt"/>
<line x1="250" y1="230" x2="410" y2="230" class="fg-l dim dash"/><line x1="280" y1="56" x2="280" y2="240" class="fg-l dim dash"/>
<circle cx="280" cy="230" r="4.5" class="fg-lamp on"/><text x="287" y="223" class="fg-t sm acc">(0, 0)</text>
<rect x="500" y="90" width="100" height="140" rx="4" class="fg-b alt"/>
<line x1="470" y1="230" x2="630" y2="230" class="fg-l dim dash"/><line x1="550" y1="56" x2="550" y2="240" class="fg-l dim dash"/>
<circle cx="550" cy="230" r="4.5" class="fg-lamp on"/><text x="557" y="223" class="fg-t sm acc">(0, 0)</text>
<text x="110" y="264" text-anchor="middle" class="fg-t sm">左 −100　右 100</text><text x="110" y="280" text-anchor="middle" class="fg-t sm">下 −140　上 140</text>
<text x="330" y="264" text-anchor="middle" class="fg-t sm">左 0　右 200</text><text x="330" y="280" text-anchor="middle" class="fg-t sm">下 0　上 280</text>
<text x="550" y="264" text-anchor="middle" class="fg-t sm">左 −100　右 100</text><text x="550" y="280" text-anchor="middle" class="fg-t sm">下 0　上 280</text>
</svg><figcaption>綠點是節點空間的原點，也就是錨點。框的大小沒變，變的是框相對於原點的位置。</figcaption></figure>
<p>這件事有三個很實際的後果：</p>
<ol>
<li><b>「點有沒有落在框裡」要連錨點一起算。</b>把觸控點換到節點空間得到 (30, 40)，在錨點 (0.5, 0.5) 的牌上是「中心偏右上」，在錨點 (0, 0) 的牌上卻是「靠近左下角」。通用的判斷是：x 介於 −ax × w 和 (1 − ax) × w 之間，y 也一樣。引擎的 <code>hitTest</code> 內部就是先把錨點乘尺寸加回去，再檢查是不是落在 0 到 w、0 到 h 之間。</li>
<li><b>子節點掛在父節點的原點上，不是掛在父節點的圖上。</b>在編輯器裡把父節點的錨點從 (0.5, 0.5) 改成 (0, 0)，子節點在畫面上一動也不動，動的是父節點自己那張圖：它會滑到原點的右上方。很多人以為「改錨點會讓整組東西跑掉」，其實跑掉的只有父節點的圖。</li>
<li><b>3.x 的 UITransform 只有 AR 版本的換算。</b>2.x 時代還有不帶 AR、從左下角量起的 <code>convertToNodeSpace</code>；3.x 把它拿掉了，只留下 <code>convertToNodeSpaceAR</code> 和 <code>convertToWorldSpaceAR</code>。如果你需要「從框的左下角量起」的數字，自己把 (ax × w, ay × h) 加上去就好。</li>
</ol>

<h3><span class="badge lv2">進階</span>三、一路乘上去：Canvas → Table → Card 手算一次</h3>
<p>來追一個具體的例子。手機是 iPhone 14，遊戲用 Fit Width（第五節會算出來，這時可見範圍是 720 × 1558）。Canvas 放在可見範圍正中間，所以它的世界座標是 (360, 779)。底下有一張牌桌 Table，再底下有一張牌 Card：</p>
<table>
<tr><th>節點</th><th>position（在父節點空間）</th><th>其他</th></tr>
<tr><td>Canvas</td><td>—</td><td>世界座標 (360, 779)</td></tr>
<tr><td>Table</td><td>(0, −200)</td><td>scale 0.8，尺寸 600 × 400</td></tr>
<tr><td>Card</td><td>(150, 50)</td><td>尺寸 200 × 280，錨點在中心</td></tr>
</table>
<p>問題：Card 右上角那一點，在世界空間的哪裡？右上角在 Card 自己的空間是 (100, 140)。</p>
<ol>
<li><b>Card 空間 → Table 空間</b>：加上 Card 的 position。(100 + 150, 140 + 50) = (250, 190)。</li>
<li><b>Table 空間 → Canvas 空間</b>：先乘 Table 的縮放 0.8，得到 (200, 152)；再加 Table 的 position (0, −200)，得到 (200, −48)。</li>
<li><b>Canvas 空間 → 世界</b>：加上 Canvas 的世界座標，(200 + 360, −48 + 779) = (560, 731)。</li>
</ol>
<p>現在把 Card 轉 90 度（<code>card.angle = 90</code>，正數是逆時針）。旋轉發生在 Card 自己的空間裡、繞著錨點轉，所以要在第 1 步之前先做：逆時針轉 90 度，就是 (x, y) 變成 (−y, x)。</p>
<figure class="figure"><svg viewBox="0 40 700 175" class="fg" style="width:100%;max-width:700px" role="img" aria-label="Card 右上角的點經過旋轉、加上位置、乘上 Table 縮放、加上 Table 世界座標，最後落在世界座標 368, 699">
<text x="140" y="62" text-anchor="middle" class="fg-t sm">angle = 90</text>
<text x="280" y="62" text-anchor="middle" class="fg-t sm">+ position (150, 50)</text>
<text x="420" y="62" text-anchor="middle" class="fg-t sm">× Table 縮放 0.8</text>
<text x="560" y="62" text-anchor="middle" class="fg-t sm">+ Table 世界 (360, 579)</text>
<line x1="140" y1="68" x2="140" y2="102" class="fg-l dim dash"/><line x1="280" y1="68" x2="280" y2="102" class="fg-l dim dash"/>
<line x1="420" y1="68" x2="420" y2="102" class="fg-l dim dash"/><line x1="560" y1="68" x2="560" y2="102" class="fg-l dim dash"/>
<rect x="10" y="80" width="120" height="60" rx="6" class="fg-b alt"/>
<text x="70" y="104" text-anchor="middle" class="fg-t sm alt">Card 本地</text><text x="70" y="126" text-anchor="middle" class="fg-t mono">(100, 140)</text>
<rect x="150" y="80" width="120" height="60" rx="6" class="fg-b"/>
<text x="210" y="104" text-anchor="middle" class="fg-t sm">轉 90 度之後</text><text x="210" y="126" text-anchor="middle" class="fg-t mono">(−140, 100)</text>
<rect x="290" y="80" width="120" height="60" rx="6" class="fg-b"/>
<text x="350" y="104" text-anchor="middle" class="fg-t sm">Table 空間</text><text x="350" y="126" text-anchor="middle" class="fg-t mono">(10, 150)</text>
<rect x="430" y="80" width="120" height="60" rx="6" class="fg-b"/>
<text x="490" y="104" text-anchor="middle" class="fg-t sm">乘完縮放</text><text x="490" y="126" text-anchor="middle" class="fg-t mono">(8, 120)</text>
<rect x="570" y="80" width="120" height="60" rx="6" class="fg-b hot"/>
<text x="630" y="104" text-anchor="middle" class="fg-t sm acc">世界座標</text><text x="630" y="126" text-anchor="middle" class="fg-t mono">(368, 699)</text>
<line x1="131" y1="110" x2="141" y2="110" class="fg-l"/><polygon points="149,110 141,105.5 141,114.5" class="fg-a"/>
<line x1="271" y1="110" x2="281" y2="110" class="fg-l"/><polygon points="289,110 281,105.5 281,114.5" class="fg-a"/>
<line x1="411" y1="110" x2="421" y2="110" class="fg-l"/><polygon points="429,110 421,105.5 421,114.5" class="fg-a"/>
<line x1="551" y1="110" x2="561" y2="110" class="fg-l"/><polygon points="569,110 561,105.5 561,114.5" class="fg-a"/>
<text x="350" y="172" text-anchor="middle" class="fg-t sm">不轉的話：(100, 140) → (250, 190) → (200, 152) → 世界 (560, 731)</text>
<text x="350" y="196" text-anchor="middle" class="fg-t sm">反過來：Table 的 convertToNodeSpaceAR((368, 699)) 會得到 (10, 150)</text>
</svg><figcaption>Table 的世界座標是 (360, 779 − 200) = (360, 579)。每一層的順序都是「先轉、再縮放、再位移」，一層一層往外套。</figcaption></figure>
<p>把它寫成一條通式：<b>父空間的點 = position + 旋轉(angle) × (scale × 本地的點)</b>。引擎把每一層的「位移、旋轉、縮放」（translation、rotation、scale，合稱 TRS）存成一個 4 × 4 的矩陣，世界矩陣（world matrix）就是從根節點一路乘下來的結果。翻開 3.8 的原始碼，<code>convertToWorldSpaceAR</code> 就只有一行有意義：拿世界矩陣去乘你的點；<code>convertToNodeSpaceAR</code> 則是先把世界矩陣反過來（求反矩陣），再去乘。</p>
<pre><code>import { Node, UITransform, Vec3 } from 'cc';

function corner(card: Node, table: Node) {
    const cardUi = card.getComponent(UITransform)!;
    const tableUi = table.getComponent(UITransform)!;
    const p = new Vec3(100, 140, 0);
    const world = cardUi.convertToWorldSpaceAR(p);
    // angle 0: (560, 731); angle 90: (368, 699)
    const inTable = tableUi.convertToNodeSpaceAR(world);
    // angle 90: (10, 150)
    return inTable;
}</code></pre>
<h4>換父節點，但畫面上不要跳</h4>
<p>把一張牌從手牌移到棄牌堆，最常見的寫法錯誤是直接 <code>discard.addChild(card)</code>。position 數字沒變，但父節點換了，同樣的 (150, 50) 在新父節點裡是另一個地方，牌就「跳」了一下。3.x 的 <code>setParent</code> 有第二個參數，傳 <code>true</code> 就會幫你保留世界變換：它用新父節點世界矩陣的反矩陣，乘上牌現在的世界矩陣，算出新的 position、旋轉和縮放。</p>
<pre><code>// true = keep the world transform: no jump
card.setParent(discardPile, true);

// worldPosition is the node's own internal vector:
// clone it if you want to keep it
const saved = card.worldPosition.clone();</code></pre>
<p>第二行也是個坑。3.8 的 <code>worldPosition</code> 回傳的不是新的向量，而是節點內部那一個，型別標成 <code>Readonly&lt;Vec3&gt;</code>。你把它存起來，下一格節點一動，你存的值也跟著變。要留著用，就 <code>clone()</code>。</p>

<h3><span class="badge lv2">進階</span>四、手指碰到玻璃之後：觸控座標一路換算</h3>
<p>現在反過來走。玩家用 iPhone 14 的 Safari 玩你的網頁版，手指點在螢幕上。這支手機的畫面是 390 × 844 點（CSS 像素），裝置像素比（device pixel ratio，DPR）是 3。但 Cocos 3.8 在網頁上會把 DPR <b>封頂在 2</b>，所以遊戲畫布的實體大小是 780 × 1688 像素。Fit Width 之下，每一個設計單位等於 780 ÷ 720 ≈ 1.083 個畫布像素。</p>
<table>
<tr><th>步驟</th><th>誰算的、怎麼算</th><th>數值</th></tr>
<tr><td>1. 手指</td><td>瀏覽器給 <code>clientX</code>、<code>clientY</code>：CSS 像素、從左上角量、y 朝下</td><td>(300, 500)</td></tr>
<tr><td>2. <code>getLocation()</code></td><td>引擎把 y 翻成從底下量起：844 − 500 = 344；兩個數字再乘 DPR 2</td><td>(600, 688)</td></tr>
<tr><td>3. <code>getUILocation()</code></td><td>減掉黑邊位移（Fit Width 沒有黑邊，是 0），再除以縮放 1.083</td><td>(553.8, 635.1)</td></tr>
<tr><td>4. Table 的 <code>convertToNodeSpaceAR</code></td><td>減掉 Table 的世界座標 (360, 579)，再除以 Table 的縮放 0.8</td><td>(242.3, 70.1)</td></tr>
<tr><td>5. 判斷</td><td>Table 是 600 × 400、錨點在中心：x 要在 ±300 之內，y 要在 ±200 之內</td><td>點中了</td></tr>
</table>
<p>寫成程式是這樣。注意兩個暫存向量放在檔案最上面重複使用，不要每次觸控都 <code>new</code> 一個：</p>
<pre><code>import {
    _decorator, Component, EventTouch,
    Node, UITransform, Vec2, Vec3,
} from 'cc';
const { ccclass, property } = _decorator;

const _ui = new Vec2();
const _p = new Vec3();
const _local = new Vec3();

@ccclass('TableTouch')
export class TableTouch extends Component {
    @property(UITransform)
    tableUi: UITransform | null = null;

    onLoad() {
        this.node.on(Node.EventType.TOUCH_END,
            this.onTouchEnd, this);
    }

    onTouchEnd(e: EventTouch) {
        if (!this.tableUi) return;
        e.getUILocation(_ui);          // UI world space
        _p.set(_ui.x, _ui.y, 0);
        this.tableUi.convertToNodeSpaceAR(_p, _local);
        console.log('table space', _local.x, _local.y);
    }
}</code></pre>
<div class="warn"><b>最常見的觸控 bug：把 getLocation() 當成 UI 座標。</b>在桌機瀏覽器上，DPR 是 1，如果視窗又剛好接近設計寬度，<code>getLocation()</code> 和 <code>getUILocation()</code> 幾乎一樣，你完全看不出錯。一上手機，DPR 變 2、縮放變 1.083，點擊位置就整個偏掉。規則很簡單：跟 UI 節點比，一律用 <code>getUILocation()</code>；要交給 <code>hitTest()</code> 或攝影機的 <code>screenToWorld()</code>，才用 <code>getLocation()</code>。</div>
<p>為什麼 <code>getUILocation()</code> 剛好等於 UI 的世界座標？因為 Canvas 的攝影機被放在 Canvas 的世界位置上，正交高度（orthoHeight）設成「螢幕高 ÷ 縮放 ÷ 2」，剛好框住整個可見範圍。如果你另外有一台會移動的攝影機（例如捲動的大地圖），那台攝影機看到的世界就跟 UI 不一樣了，這時要用 <code>camera.screenToWorld(getLocation())</code>。UITransform 的 <code>hitTest(screenPoint)</code> 就是這樣做的：它對每一台看得到這個節點圖層的攝影機，各換算一次。</p>

<h3><span class="badge lv2">進階</span>五、設計解析度遇上真的手機：四種適配的實際數字</h3>
<p>引擎先算兩個比例：<b>scaleX = 螢幕寬 ÷ 設計寬</b>、<b>scaleY = 螢幕高 ÷ 設計高</b>。四種模式的差別，只在挑哪一個當縮放，以及「可見範圍」怎麼算：</p>
<ul>
<li><b>只勾 Fit Width</b>（FIXED_WIDTH）：縮放 = scaleX。可見範圍 = 720 × （螢幕高 ÷ 縮放）。</li>
<li><b>只勾 Fit Height</b>（FIXED_HEIGHT）：縮放 = scaleY。可見範圍 = （螢幕寬 ÷ 縮放）× 1280。</li>
<li><b>兩個都勾</b>（SHOW_ALL）：縮放 = 兩者取小。可見範圍固定是 720 × 1280，多出來的螢幕在 Canvas 外面。</li>
<li><b>兩個都不勾</b>（NO_BORDER）：縮放 = 兩者取大。引擎回報的可見範圍還是 720 × 1280，但有一部分其實在螢幕外面。</li>
</ul>
<p>用三種螢幕來算（單位是 CSS 點，比例才是重點）：一般 16:9 手機 360 × 640、iPhone 14 的 390 × 844、iPad 直拿的 768 × 1024。16:9 的手機剛好是 720 × 1280 的一半，四種模式結果一樣，縮放都是 0.5。另外兩支就不一樣了：</p>
<table>
<tr><th>模式</th><th>iPhone 14（390 × 844）</th><th>iPad（768 × 1024）</th></tr>
<tr><td>Fit Width</td><td>縮放 0.542；可見 720 × 1558，上下各多 139</td><td>縮放 1.067；可見 720 × 960，上下各少 160</td></tr>
<tr><td>Fit Height</td><td>縮放 0.659；可見 591.5 × 1280，左右各裁 64</td><td>縮放 0.8；可見 960 × 1280，左右各多 120</td></tr>
<tr><td>兩個都勾</td><td>縮放 0.542；上下各空出約 75 點</td><td>縮放 0.8；左右各空出 96 點</td></tr>
<tr><td>兩個都不勾</td><td>縮放 0.659；左右各 64 在螢幕外</td><td>縮放 1.067；上下各 160 在螢幕外</td></tr>
</table>
<p>算一個給你看：iPhone 14 用 Fit Width，縮放 = 390 ÷ 720 = 0.5417；可見高度 = 844 ÷ 0.5417 = 1558.2。比 1280 多出 278，上下各 139。換成 iPad，縮放 = 768 ÷ 720 = 1.0667，可見高度 = 1024 ÷ 1.0667 = 960，比 1280 少了 320。如果你的分數放在離中心 +600 的地方，在 iPad 上就看不到了，因為可見範圍的一半只有 480。</p>
<figure class="figure"><svg viewBox="0 0 680 300" class="fg" style="width:100%;max-width:680px" role="img" aria-label="iPhone 14 上四種適配模式：Fit Width 時 Canvas 等於整個螢幕、上下有多的空間；Fit Height 時設計範圍左右被裁；兩個都勾時 Canvas 只有設計範圍大；兩個都不勾時 Canvas 左右超出螢幕">
<text x="85" y="28" text-anchor="middle" class="fg-t lg">Fit Width</text>
<text x="255" y="28" text-anchor="middle" class="fg-t lg">Fit Height</text>
<text x="425" y="28" text-anchor="middle" class="fg-t lg">兩個都勾</text>
<text x="595" y="28" text-anchor="middle" class="fg-t lg">兩個都不勾</text>
<rect x="48" y="44" width="74" height="160" rx="8" class="fg-b hot"/>
<rect x="48" y="58" width="74" height="132" class="fg-l alt dash"/>
<rect x="48" y="44" width="74" height="160" rx="8" class="fg-l"/>
<rect x="218" y="44" width="74" height="160" rx="8" class="fg-b hot"/>
<rect x="210" y="44" width="90" height="160" class="fg-l alt dash"/>
<rect x="218" y="44" width="74" height="160" rx="8" class="fg-l"/>
<rect x="388" y="58" width="74" height="132" class="fg-b hot"/>
<rect x="388" y="58" width="74" height="132" class="fg-l alt dash"/>
<rect x="388" y="44" width="74" height="160" rx="8" class="fg-l"/>
<rect x="550" y="44" width="90" height="160" class="fg-b hot"/>
<rect x="550" y="44" width="8" height="160" class="fg-b warm"/>
<rect x="632" y="44" width="8" height="160" class="fg-b warm"/>
<rect x="550" y="44" width="90" height="160" class="fg-l alt dash"/>
<rect x="558" y="44" width="74" height="160" rx="8" class="fg-l"/>
<text x="85" y="226" text-anchor="middle" class="fg-t sm">可見 720 × 1558</text><text x="85" y="242" text-anchor="middle" class="fg-t sm">上下多出來給你用</text>
<text x="255" y="226" text-anchor="middle" class="fg-t sm">可見 591.5 × 1280</text><text x="255" y="242" text-anchor="middle" class="fg-t sm">左右各裁掉 64</text>
<text x="425" y="226" text-anchor="middle" class="fg-t sm">Canvas 720 × 1280</text><text x="425" y="242" text-anchor="middle" class="fg-t sm">上下各空 75 點</text>
<text x="595" y="226" text-anchor="middle" class="fg-t sm">回報 720 × 1280</text><text x="595" y="242" text-anchor="middle" class="fg-t sm">左右 64 在螢幕外</text>
<rect x="20" y="272" width="16" height="12" class="fg-b hot"/><text x="42" y="283" class="fg-t sm">Canvas（Widget 貼它的邊）</text>
<rect x="210" y="272" width="16" height="12" class="fg-l alt dash"/><text x="232" y="283" class="fg-t sm">設計範圍 720 × 1280</text>
<rect x="380" y="272" width="16" height="12" rx="3" class="fg-l"/><text x="402" y="283" class="fg-t sm">手機螢幕</text>
<rect x="520" y="272" width="16" height="12" class="fg-b warm"/><text x="542" y="283" class="fg-t sm">看不到的 Canvas</text>
</svg><figcaption>四種模式在同一支 iPhone 14 上。重點看綠色：Widget 貼的是 Canvas 的邊。前兩種的 Canvas 剛好等於螢幕，後兩種的 Canvas 等於設計範圍，跟螢幕的邊對不上。</figcaption></figure>
<p>這張圖說明了為什麼做 UI 的人幾乎都只用前兩種：<b>Canvas 的大小就是可見範圍，Widget 對齊的是 Canvas 的邊</b>。Fit Width 和 Fit Height 的 Canvas 剛好等於整個螢幕，所以「離右上角 20」就真的是螢幕右上角。兩個都勾時，Widget 貼的是設計範圍的邊，長手機上的分數會縮在中間那塊，上下留兩條空白；兩個都不勾時，貼左邊的按鈕會被放到螢幕外面。</p>
<h4>業界常見的做法：執行時依螢幕比例二選一</h4>
<p>直式遊戲最穩的組合是：螢幕比設計「更寬」就用 Fit Height，「更長」就用 Fit Width。這樣 720 × 1280 的核心範圍永遠完整看得到，多出來的空間只會出現在長的那一邊。背景圖則畫得比設計大一圈，例如 960 × 1600，從 3:4 的平板到大約 9:20 的長手機都蓋得住。</p>
<pre><code>import {
    _decorator, Component, view, screen, ResolutionPolicy,
} from 'cc';
const { ccclass } = _decorator;

@ccclass('AutoFit')
export class AutoFit extends Component {
    onLoad() {
        this.fit();
        screen.on('window-resize', this.fit, this);
    }
    onDestroy() {
        screen.off('window-resize', this.fit, this);
    }
    private fit() {
        const win = screen.windowSize;   // physical pixels
        const d = view.getDesignResolutionSize();
        const ratio = win.width / win.height;
        const wider = ratio &gt; d.width / d.height;
        view.setResolutionPolicy(wider
            ? ResolutionPolicy.FIXED_HEIGHT
            : ResolutionPolicy.FIXED_WIDTH);
    }
}</code></pre>
<p><code>setResolutionPolicy</code> 改完會發出「設計解析度改變」的事件，Canvas 的攝影機和所有預設模式的 Widget 都會跟著重算，你不用自己通知它們。</p>

<h3><span class="badge lv2">進階</span>六、Widget 到底什麼時候動手</h3>
<p>Widget 不是你一改屬性就立刻搬節點。3.8 裡有一個 Widget 管理器，它在兩個時間點出手：<b>場景剛啟動完</b>，以及<b>每一格所有 update 和 lateUpdate 都跑完之後</b>。而且每次只處理被「標髒」（dirty）的 Widget。</p>
<figure class="figure"><svg viewBox="0 0 680 245" class="fg" style="width:100%;max-width:680px" role="img" aria-label="時間軸：一格之中依序是輸入事件、start、update、lateUpdate、Widget 對齊、銷毀、繪製；載入場景時依序是 onLoad 與 onEnable、loadScene 回呼、Widget 對齊、下一格的 start">
<text x="8" y="26" class="fg-t sm">每一格（影格）</text>
<rect x="8" y="36" width="88" height="40" rx="6" class="fg-b"/><text x="52" y="61" text-anchor="middle" class="fg-t">輸入事件</text>
<rect x="104" y="36" width="88" height="40" rx="6" class="fg-b"/><text x="148" y="61" text-anchor="middle" class="fg-t">start</text>
<rect x="200" y="36" width="88" height="40" rx="6" class="fg-b"/><text x="244" y="61" text-anchor="middle" class="fg-t">update</text>
<rect x="296" y="36" width="88" height="40" rx="6" class="fg-b"/><text x="340" y="61" text-anchor="middle" class="fg-t">lateUpdate</text>
<rect x="392" y="36" width="88" height="40" rx="6" class="fg-b hot"/><text x="436" y="61" text-anchor="middle" class="fg-t acc">Widget 對齊</text>
<rect x="488" y="36" width="88" height="40" rx="6" class="fg-b"/><text x="532" y="61" text-anchor="middle" class="fg-t">銷毀</text>
<rect x="584" y="36" width="88" height="40" rx="6" class="fg-b alt"/><text x="628" y="61" text-anchor="middle" class="fg-t">繪製</text>
<line x1="8" y1="88" x2="660" y2="88" class="fg-l dim"/><polygon points="668,88 660,83.5 660,92.5" class="fg-a"/>
<text x="244" y="106" text-anchor="middle" class="fg-t sm">你在 update 改位置</text>
<text x="436" y="106" text-anchor="middle" class="fg-t sm acc">Widget 在這裡蓋掉它</text>
<text x="436" y="122" text-anchor="middle" class="fg-t sm mono">AFTER_UPDATE</text>
<text x="8" y="152" class="fg-t sm">載入一個場景時</text>
<rect x="8" y="162" width="150" height="44" rx="6" class="fg-b"/><text x="83" y="189" text-anchor="middle" class="fg-t">onLoad、onEnable</text>
<rect x="172" y="162" width="150" height="44" rx="6" class="fg-b"/><text x="247" y="189" text-anchor="middle" class="fg-t">loadScene 回呼</text>
<rect x="336" y="162" width="150" height="44" rx="6" class="fg-b hot"/><text x="411" y="181" text-anchor="middle" class="fg-t acc">Widget 對齊</text><text x="411" y="198" text-anchor="middle" class="fg-t sm mono">AFTER_SCENE_LAUNCH</text>
<rect x="500" y="162" width="150" height="44" rx="6" class="fg-b"/><text x="575" y="189" text-anchor="middle" class="fg-t">下一格的 start</text>
<line x1="159" y1="184" x2="164" y2="184" class="fg-l"/><polygon points="172,184 164,179.5 164,188.5" class="fg-a"/>
<line x1="323" y1="184" x2="328" y2="184" class="fg-l"/><polygon points="336,184 328,179.5 328,188.5" class="fg-a"/>
<line x1="487" y1="184" x2="492" y2="184" class="fg-l"/><polygon points="500,184 492,179.5 492,188.5" class="fg-a"/>
<text x="340" y="232" text-anchor="middle" class="fg-t sm">在 onLoad 和 loadScene 的回呼裡讀到的位置，都還是編輯器存的值</text>
</svg><figcaption>Widget 的對齊排在 update、lateUpdate 之後、繪製之前。所以同一格裡，Widget 永遠是「最後說話的人」。</figcaption></figure>
<p>什麼東西會把 Widget 標髒，決定了三種對齊模式的差別：</p>
<table>
<tr><th>模式</th><th>什麼時候會重新對齊</th><th>適合</th></tr>
<tr><td><code>ONCE</code></td><td>啟用之後那一格結尾對齊一次，之後就不管了</td><td>開場定位一次，之後交給動畫或程式控制</td></tr>
<tr><td><code>ON_WINDOW_RESIZE</code>（預設）</td><td>啟用時一次；之後每當視窗大小或設計解析度改變，再對齊一次</td><td>大部分的 UI</td></tr>
<tr><td><code>ALWAYS</code></td><td>除了上面那些，只要自己、或對齊目標（預設是父節點）的位置、尺寸、錨點一改，就在那一格結尾重新對齊</td><td>父節點的尺寸會在遊戲中變動，例如可以拖拉的面板</td></tr>
</table>
<p>上一課說 ALWAYS「每一格都會重算」，比較精確的說法是：它一直在監聽自己和父節點的變動，一有變動就在那一格結尾把節點拉回對齊的位置。所以實際效果是一樣的：<b>你沒辦法用程式或動畫移動一個 ALWAYS 的 Widget 節點</b>。另外，不管哪種模式，改 Widget 自己的屬性（例如 <code>top</code>）也會把它標髒。</p>
<h4>三個每個人都會踩一次的坑</h4>
<ol>
<li><b>在 onLoad 裡讀位置。</b>你想算「金幣要飛到右上角錢包的哪裡」，在 <code>onLoad</code> 讀錢包的 <code>worldPosition</code>，拿到的是編輯器裡存的位置，不是對齊之後的。需要馬上拿到正確值，就先呼叫那個 Widget 的 <code>updateAlignment()</code>，它會從根節點一路對齊到這個節點，當場算好。</li>
<li><b>tween 一個 ALWAYS 的節點。</b>tween 每一格把 x 往前推一點，Widget 每一格結尾又把它拉回去。畫面上看起來就是卡住或抖動。修法：讓 Widget 掛在外層容器上，動畫做在裡面的子節點。</li>
<li><b>tween 一個預設模式的節點。</b>面板從 x = −800 滑進來停在 0，看起來完全正常。直到玩家把手機轉向、或在電腦上調整瀏覽器大小：視窗一變，Widget 重新對齊，面板「啪」一聲跳回它在編輯器裡設定的位置。修法一樣：Widget 放外層、動畫放內層。</li>
</ol>
<p>另外兩個細節：Widget 只調整位置和尺寸，<b>不理會旋轉</b>；它的 <code>target</code> 可以指定對齊另一個節點，但那個節點必須是它的祖先，不然開發版會報錯並把 target 清掉。</p>

<h3><span class="badge lv3">專業</span>七、瀏海、圓角和 SafeArea</h3>
<p>現在的手機螢幕不是方的：上面有瀏海或動態島，下面有回到主畫面的橫條，四個角是圓的。作業系統會告訴 App 一組「安全區域」（safe area）的內縮距離。以 iPhone 14 直拿為例，上方大約 47 點、下方大約 34 點（不同機型略有不同）。換成 Fit Width 的設計單位，除以 0.5417，就是上方 86.8、下方 62.8。</p>
<p>3.8 的 <code>SafeArea</code> 元件做的事其實很單純：它要求節點上有一個 Widget（加 SafeArea 時會自動加），然後把 Widget 的四邊都勾起來，把上下左右的距離設成安全區域的內縮。視窗大小改變或螢幕轉向時，它會重新算一次。它有一個 <code>symmetric</code> 選項，預設是開的：直式時，上下兩邊取比較大的那個，讓內容保持置中。</p>
<figure class="figure"><svg viewBox="0 0 640 330" class="fg" style="width:100%;max-width:640px" role="img" aria-label="兩支手機：左邊 symmetric 開啟，安全區域上下都內縮 86.8；右邊 symmetric 關閉，上方內縮 86.8、下方內縮 62.8">
<text x="155" y="20" text-anchor="middle" class="fg-t">symmetric = true（預設）</text>
<text x="455" y="20" text-anchor="middle" class="fg-t">symmetric = false</text>
<rect x="90" y="34" width="130" height="281" rx="16" class="fg-b"/>
<rect x="92" y="50" width="126" height="249" rx="4" class="fg-b hot"/>
<rect x="132" y="34" width="46" height="11" rx="5" class="fg-b warm"/>
<line x1="135" y1="309" x2="175" y2="309" class="fg-l"/>
<text x="155" y="168" text-anchor="middle" class="fg-t acc">SafeArea 節點</text>
<text x="155" y="186" text-anchor="middle" class="fg-t sm">720 × 1384.6</text>
<line x1="222" y1="50" x2="236" y2="50" class="fg-l dim"/><text x="240" y="54" class="fg-t sm">上 86.8</text>
<line x1="222" y1="299" x2="236" y2="299" class="fg-l dim"/><text x="240" y="303" class="fg-t sm">下 86.8（對稱）</text>
<rect x="390" y="34" width="130" height="281" rx="16" class="fg-b"/>
<rect x="392" y="50" width="126" height="254" rx="4" class="fg-b hot"/>
<rect x="432" y="34" width="46" height="11" rx="5" class="fg-b warm"/>
<line x1="435" y1="309" x2="475" y2="309" class="fg-l"/>
<text x="455" y="168" text-anchor="middle" class="fg-t acc">SafeArea 節點</text>
<text x="455" y="186" text-anchor="middle" class="fg-t sm">720 × 1408.6</text>
<line x1="522" y1="50" x2="536" y2="50" class="fg-l dim"/><text x="540" y="54" class="fg-t sm">上 86.8</text>
<line x1="522" y1="304" x2="536" y2="304" class="fg-l dim"/><text x="540" y="308" class="fg-t sm">下 62.8</text>
</svg><figcaption>可見範圍是 720 × 1558.2。對稱模式下，上下都內縮 86.8；不對稱時，下面只內縮 62.8，內容就會略微偏上。</figcaption></figure>
<h4>節點樹要怎麼排</h4>
<pre><code>Canvas
├── Background    (Widget: 4 edges = 0)
└── SafeRoot      (SafeArea + Widget)
    ├── TopBar    (Widget: top = 20)
    └── BottomBar (Widget: bottom = 20)</code></pre>
<p>背景是 Canvas 的直屬子節點，畫滿整片，連瀏海後面都有畫面，看起來才不會有一條黑邊。所有可以點的東西都放在 SafeRoot 底下，用 Widget 貼它的邊。TopBar 離 SafeRoot 上緣 20，等於離螢幕頂端 86.8 + 20 = 106.8 個設計單位，剛好避開瀏海。</p>
<p>讀原始碼還會看到一個沒寫在手冊裡的細節：SafeArea 為了「節點的 position 不變、但框縮小」，會<b>改掉這個節點自己的錨點</b>。所以 SafeRoot 底下的子節點，一定要用 Widget 對齊，不要寫死座標；寫死的座標是相對錨點算的，錨點一變，它們就偏了。</p>
<h4>網頁版的安全區域通常是 0</h4>
<p>在瀏覽器裡，引擎的安全區域是從 CSS 讀來的：預設的 web-mobile 範本把 <code>--safe-top</code> 這幾個變數設成 <code>env(safe-area-inset-top)</code>，引擎再去讀它們。但同一份範本的 viewport 設定沒有 <code>viewport-fit=cover</code>，這種情況下 iOS 的瀏覽器會自己把網頁放在安全區域裡，<code>env()</code> 多半回傳 0。所以同一個專案，原生 App 的 SafeArea 會內縮，網頁版通常不會。如果你用自訂的建置範本加上 <code>viewport-fit=cover</code>，讓遊戲畫到瀏海後面，就要靠 SafeArea 自己把按鈕閃開。兩種組合都要在真機上看過一次。</p>

<h3><span class="badge lv3">專業</span>八、像素密度：為什麼你的 sprite 會糊</h3>
<p>先把三種「像素」分清楚。以網頁版的 iPhone 14 為例：</p>
<table>
<tr><th>單位</th><th>寬度</th><th>說明</th></tr>
<tr><td>CSS 點</td><td>390</td><td>瀏覽器和 DOM 用的單位</td></tr>
<tr><td>實體像素</td><td>1170</td><td>面板上真正的發光點，390 × DPR 3</td></tr>
<tr><td>遊戲畫布像素</td><td>780</td><td>Cocos 3.8 網頁版把 DPR 封頂在 2，所以是 390 × 2</td></tr>
<tr><td>設計單位</td><td>720</td><td>你在編輯器裡排版的單位</td></tr>
</table>
<p>每一層之間都有一次縮放。設計單位到畫布像素是 780 ÷ 720 ≈ 1.083 倍；畫布到實體像素，瀏覽器再放大 1.5 倍。一張 100 × 100 的圖，你在編輯器裡排成 100 × 100，實際被畫成大約 108 個畫布像素，再被瀏覽器拉到 162 個實體像素。只要是「放大」，就是用少的像素去猜多的像素，邊緣一定會變軟。這也是同一支手機上，網頁版有時看起來比原生 App 軟一點的原因之一。你可以在瀏覽器主控台比較 <code>window.devicePixelRatio</code> 和 <code>document.getElementById('GameCanvas').width</code>，自己驗證。</p>
<h4>第二個原因：邊緣落在半個像素上</h4>
<figure class="figure"><svg viewBox="0 0 620 200" class="fg" style="width:100%;max-width:620px" role="img" aria-label="兩個像素格子：左邊圖的邊緣剛好落在格線上，三欄全亮；右邊邊緣落在半格，兩側各有一欄只亮一半">
<text x="134" y="30" text-anchor="middle" class="fg-t">邊緣落在整數像素：銳利</text>
<text x="454" y="30" text-anchor="middle" class="fg-t">邊緣落在 .5：兩邊各糊一格</text>
<rect x="30" y="50" width="26" height="26" class="fg-b"/><rect x="56" y="50" width="26" height="26" class="fg-b"/><rect x="82" y="50" width="26" height="26" class="fg-b hot"/><rect x="108" y="50" width="26" height="26" class="fg-b hot"/><rect x="134" y="50" width="26" height="26" class="fg-b hot"/><rect x="160" y="50" width="26" height="26" class="fg-b"/><rect x="186" y="50" width="26" height="26" class="fg-b"/><rect x="212" y="50" width="26" height="26" class="fg-b"/>
<rect x="30" y="76" width="26" height="26" class="fg-b"/><rect x="56" y="76" width="26" height="26" class="fg-b"/><rect x="82" y="76" width="26" height="26" class="fg-b hot"/><rect x="108" y="76" width="26" height="26" class="fg-b hot"/><rect x="134" y="76" width="26" height="26" class="fg-b hot"/><rect x="160" y="76" width="26" height="26" class="fg-b"/><rect x="186" y="76" width="26" height="26" class="fg-b"/><rect x="212" y="76" width="26" height="26" class="fg-b"/>
<rect x="30" y="102" width="26" height="26" class="fg-b"/><rect x="56" y="102" width="26" height="26" class="fg-b"/><rect x="82" y="102" width="26" height="26" class="fg-b hot"/><rect x="108" y="102" width="26" height="26" class="fg-b hot"/><rect x="134" y="102" width="26" height="26" class="fg-b hot"/><rect x="160" y="102" width="26" height="26" class="fg-b"/><rect x="186" y="102" width="26" height="26" class="fg-b"/><rect x="212" y="102" width="26" height="26" class="fg-b"/>
<line x1="82" y1="42" x2="82" y2="136" class="fg-l warm dash"/><line x1="160" y1="42" x2="160" y2="136" class="fg-l warm dash"/>
<rect x="350" y="50" width="26" height="26" class="fg-b"/><rect x="376" y="50" width="26" height="26" class="fg-b"/><rect x="402" y="50" width="26" height="26" class="fg-b alt"/><rect x="428" y="50" width="26" height="26" class="fg-b hot"/><rect x="454" y="50" width="26" height="26" class="fg-b hot"/><rect x="480" y="50" width="26" height="26" class="fg-b alt"/><rect x="506" y="50" width="26" height="26" class="fg-b"/><rect x="532" y="50" width="26" height="26" class="fg-b"/>
<rect x="350" y="76" width="26" height="26" class="fg-b"/><rect x="376" y="76" width="26" height="26" class="fg-b"/><rect x="402" y="76" width="26" height="26" class="fg-b alt"/><rect x="428" y="76" width="26" height="26" class="fg-b hot"/><rect x="454" y="76" width="26" height="26" class="fg-b hot"/><rect x="480" y="76" width="26" height="26" class="fg-b alt"/><rect x="506" y="76" width="26" height="26" class="fg-b"/><rect x="532" y="76" width="26" height="26" class="fg-b"/>
<rect x="350" y="102" width="26" height="26" class="fg-b"/><rect x="376" y="102" width="26" height="26" class="fg-b"/><rect x="402" y="102" width="26" height="26" class="fg-b alt"/><rect x="428" y="102" width="26" height="26" class="fg-b hot"/><rect x="454" y="102" width="26" height="26" class="fg-b hot"/><rect x="480" y="102" width="26" height="26" class="fg-b alt"/><rect x="506" y="102" width="26" height="26" class="fg-b"/><rect x="532" y="102" width="26" height="26" class="fg-b"/>
<line x1="415" y1="42" x2="415" y2="136" class="fg-l warm dash"/><line x1="493" y1="42" x2="493" y2="136" class="fg-l warm dash"/>
<text x="134" y="158" text-anchor="middle" class="fg-t sm">寬 100、錨點 0.5、x = 200 → 左邊 150</text>
<text x="454" y="158" text-anchor="middle" class="fg-t sm">寬 101、錨點 0.5、x = 200 → 左邊 149.5</text>
<rect x="120" y="176" width="14" height="12" class="fg-b hot"/><text x="140" y="186" class="fg-t sm">整格亮</text>
<rect x="250" y="176" width="14" height="12" class="fg-b alt"/><text x="270" y="186" class="fg-t sm">只亮一半（被平均）</text>
<line x1="420" y1="182" x2="440" y2="182" class="fg-l warm dash"/><text x="446" y="186" class="fg-t sm">圖真正的邊緣</text>
</svg><figcaption>貼圖預設用線性過濾（linear filtering）：一個畫面像素如果只蓋到一半的圖，就拿圖和背景的平均。邊緣落在半格上，就會多出一圈半透明的糊邊。</figcaption></figure>
<p>錨點 0.5 加上奇數寬度，是最常見的半像素來源：寬 101，左邊就是 x − 50.5。另外，緩慢移動的物件每一格都停在不同的小數位置，邊緣會一下銳利一下糊，看起來像在「閃」。對要求清楚的 UI 文字或像素風遊戲，可以把位置對齊到實體像素：先乘上每單位的像素數、四捨五入、再除回來。</p>
<h4>其他幾個會讓圖變糊的設定</h4>
<ul>
<li><b>過濾模式</b>：圖片的 .meta 裡有 <code>minfilter</code>、<code>magfilter</code>，預設多半是 linear。像素風的美術要改成 nearest，而且只能用整數倍縮放。</li>
<li><b>Mipmap</b>：它是同一張圖預先縮小好的一串版本，給會被縮得很小的貼圖用，最典型的是 3D 遠處的物體。UI 圖如果開著 mipmap，又被縮小顯示，GPU 可能挑到比較小的那一層，看起來就更軟。UI 一般關掉。</li>
<li><b>用 scale 放大 Label</b>：用系統字型或 TTF 的 Label，是先依字型大小畫成一張貼圖再貼上去的。把 Label 節點 scale 放大兩倍，就是把那張小貼圖拉大兩倍，一定糊。要大字，就調 <code>fontSize</code>。</li>
<li><b>美術尺寸不夠</b>：如果你的遊戲會出原生版、以 1170 實體像素寬全解析度繪製，每個設計單位就是 1170 ÷ 720 = 1.625 個像素。美術以 1:1 出圖，放大 1.6 倍一定看得出來。常見的做法是美術出 1.5 倍或 2 倍的圖，或是乾脆把設計解析度訂成 1080 × 1920。代價是記憶體：邊長 1.5 倍，記憶體是 2.25 倍。這筆帳下一課會算。</li>
</ul>

<h3><span class="badge lv4">專家</span>九、矩陣、髒標記，和換算的成本</h3>
<p>引擎不會每一格把所有節點的世界矩陣重算一遍，它用的是「髒標記」（dirty flag）：</p>
<ol>
<li>你改一個節點的 position，引擎把<b>它和它底下所有的子孫</b>都標成「世界矩陣過期了」。3.8 的實作是用一個堆疊，把整棵子樹走一遍。</li>
<li>真的有人讀 <code>worldPosition</code> 或世界矩陣時，引擎才往上找到最高的那個過期祖先，從那裡一路往下重算，算完存起來。</li>
<li>這一格沒人讀、也沒人改的節點，什麼都不用算。</li>
</ol>
<p>這個設計大部分時候都很省，但有幾個地方值得知道：</p>
<ul>
<li><b>移動一個有 500 個子孫的父節點</b>，這一格繪製之前，這 500 個子孫的世界矩陣都要重算，畫面上的頂點位置也要跟著更新。標記這一步倒是很聰明：碰到已經標髒的節點就直接停，所以同一格裡改好幾次，不會重走整棵樹。</li>
<li><b>變換事件有人在聽，就有成本。</b>節點的位置、尺寸一變，會發出 <code>TRANSFORM_CHANGED</code> 這類事件。ALWAYS 模式的 Widget 會監聽自己和父節點的這些事件。一個常常在動的父節點底下掛一堆 ALWAYS Widget，每動一次就是一堆回呼。</li>
<li><b>換算會配置記憶體、也會做反矩陣。</b><code>convertToNodeSpaceAR</code> 每呼叫一次就算一次 4 × 4 的反矩陣，不傳 <code>out</code> 參數還會 <code>new</code> 一個向量。如果一格之內要把幾百個點換到同一個節點裡，就自己先算一次反矩陣，重複使用：<code>Mat4.invert(inv, node.worldMatrix)</code>，然後每個點用 <code>Vec3.transformMat4(out, p, inv)</code>。</li>
<li><b>getBoundingBoxToWorld 跟你想的不一樣。</b>它每次都 <code>new</code> 一個 Rect；回傳的是軸對齊的框（axis-aligned bounding box，AABB）；而且它會把已啟用的直屬子節點也包進來。一張 200 × 280 的牌轉 45 度，AABB 是 339 × 339，比牌大了一大圈；牌底下如果掛了一個大光暈子節點，框也會被撐大。要精準判斷旋轉過的牌有沒有被點到，就把點換到牌的節點空間再比，<code>hitTest</code> 就是這樣做的。</li>
<li><b>浮點數精度。</b>JavaScript 的數字是 64 位元，但送進 GPU 的頂點是 32 位元浮點數（float32），有效位數大約 7 位。座標在一百萬左右時，float32 能表達的最小間距大約是 0.06；超過大約 1,678 萬（2 的 24 次方）之後，間距變成 2。一般 UI 完全碰不到，但如果你做一個可以無限捲動的大地圖，把世界座標一直累加上去，遠處的物件就會開始抖。做法是讓世界原點跟著玩家移動，而不是讓玩家跑到幾百萬遠。</li>
</ul>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>position 就是它在螢幕上的位置</td><td>position 是在父節點空間、從父節點的錨點量起。螢幕上的位置要乘上整條祖先鏈的矩陣，再乘上適配的縮放。</td></tr>
<tr><td>改父節點的錨點，子節點會跟著跑</td><td>子節點掛在父節點的原點上。改父節點的錨點，子節點在畫面上不動，動的是父節點自己的圖。</td></tr>
<tr><td><code>getLocation()</code> 就是 UI 座標</td><td>它是畫布的實體像素。UI 要用 <code>getUILocation()</code>。桌機上兩者常常差不多，所以這個 bug 只在手機上出現。</td></tr>
<tr><td>兩個都勾（SHOW_ALL）最安全</td><td>設計範圍全部看得到，但 Canvas 只有設計範圍那麼大，Widget 貼的是設計範圍的邊；長手機上下會空出兩大條。</td></tr>
<tr><td>要在視窗變大小時重算，Widget 就得設 ALWAYS</td><td>預設的 ON_WINDOW_RESIZE 就會重算。ALWAYS 多出來的是「自己或父節點一動就拉回來」，會跟動畫打架。</td></tr>
<tr><td><code>getBoundingBoxToWorld()</code> 就是這個節點的框</td><td>它是軸對齊的框，還會把已啟用的直屬子節點包進來。旋轉過的節點，框會變大。</td></tr>
<tr><td>圖糊是因為 PNG 被壓壞了</td><td>PNG 是無損格式。糊幾乎都來自放大、半像素位置、過濾模式，或用 scale 放大 Label。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>從 Vue／CSS 過來的對照</b>：錨點很像 <code>transform-origin</code> 加上 <code>translate(-50%, -50%)</code> 的組合；Widget 很像 <code>position: absolute</code> 加 <code>top</code>、<code>right</code>；兩邊都勾的 Widget 就是 <code>left: 0; right: 0</code>；SafeArea 對應的是 CSS 的 <code>env(safe-area-inset-*)</code>。差別在於 CSS 的 y 往下長、Cocos 的 y 往上長，而且 Cocos 的排版要等到這一格結尾才生效，不像 DOM 你一讀 <code>getBoundingClientRect()</code> 瀏覽器就幫你算好。</li>
<li><b>遊戲裡最常見的座標任務</b>：金幣從按鈕飛到錢包、卡牌從牌堆飛到手上、拖曳物件放開時判斷落在哪一格。三件事都是同一個套路：先 <code>convertToWorldSpaceAR</code> 拿起點和終點的世界座標，再 <code>convertToNodeSpaceAR</code> 換到「負責飛行的那一層」節點裡，最後在那一層做動畫。</li>
<li><b>測試矩陣</b>：至少要有 16:9 的手機、有瀏海的長手機（大約 19.5:9）、4:3 的平板，再加上桌機瀏覽器拖拉視窗大小。瀏覽器開發者工具的裝置模擬只能模擬比例，模擬不到真實的 DPR 封頂和安全區域，正式上線前一定要上真機。</li>
<li><b>Unity 的對照</b>：RectTransform 的 pivot 就是錨點；RectTransform 的 anchors 做的是 Widget 的工作；Canvas Scaler 的「Match Width Or Height」就是在 Fit Width 和 Fit Height 之間調；<code>Screen.safeArea</code> 對應 SafeArea。觀念完全通用，換引擎不用重學。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<p>下面是遊戲前端、Cocos 工程師面試裡真的會被問到的題目。先自己講一遍，再打開參考答案。</p>
<ol>
<li>「Cocos 的錨點和位置是什麼關係？在編輯器裡改父節點的錨點，畫面上會發生什麼？」</li>
<li>「玩家點了一下螢幕，你要判斷他點到哪一張牌。從觸控事件開始，講你的做法。」</li>
<li>「設計解析度 720 × 1280 的直式遊戲，要同時支援長型手機和 iPad，你怎麼設定適配？為什麼？」</li>
<li>「Widget 的三種對齊模式差在哪？為什麼對一個掛了 Widget 的節點做 tween 會出問題？」</li>
<li>「同一張圖，在某些手機上看起來比較糊。你會怎麼查、怎麼修？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>位置是節點的錨點在父節點空間裡的座標；錨點是框裡的一個比例點，決定框相對於位置怎麼攤開，也是旋轉和縮放的中心。在節點空間裡，錨點就是原點。改父節點的錨點，父節點的位置不變，它自己的圖會相對位置點滑動；子節點是掛在父節點的原點上，所以子節點在畫面上不動。</li>
<li>在節點上監聽 TOUCH_END，用 <code>getUILocation()</code> 拿 UI 世界座標，不用 <code>getLocation()</code>，因為後者是畫布實體像素，會受 DPR 和適配縮放影響。把這個點用牌桌的 <code>convertToNodeSpaceAR</code> 換到牌桌空間，再依錨點和尺寸判斷落在哪張牌的範圍；牌如果有旋轉，就換到每張牌自己的空間判斷，或直接用 UITransform 的 <code>hitTest</code>，它吃的是螢幕座標、會考慮攝影機。重複使用暫存向量，避免每次觸控都配置記憶體。</li>
<li>執行時依螢幕比例選：螢幕比 9:16 更寬時用 Fit Height，更長時用 Fit Width。這樣 720 × 1280 的核心永遠完整可見，Canvas 等於整個螢幕，Widget 能貼到真正的螢幕邊。背景畫得比設計大，例如 960 × 1600，蓋住多出來的空間。可以點的 UI 放在 SafeArea 底下避開瀏海。不用兩個都勾，因為 Canvas 只有設計範圍大，長手機上下會空；也不用都不勾，因為邊緣會被裁到螢幕外。</li>
<li>ONCE 只在啟用後對齊一次；ON_WINDOW_RESIZE 是預設，啟用時和視窗或設計解析度改變時對齊；ALWAYS 另外監聽自己和對齊目標的位置、尺寸變化，一變就重對。對齊發生在每一格的 update、lateUpdate 之後，所以 tween 改的位置會被 ALWAYS 每格蓋掉；預設模式平常沒事，但視窗一變就跳回原位。解法是 Widget 掛在外層容器、動畫做在內層子節點。</li>
<li>先確認是不是放大：比對設計單位、畫布像素、實體像素三者的比例，網頁版 3.8 還要考慮 DPR 封頂在 2。再看是不是半像素：錨點 0.5 配奇數尺寸、或停在小數位置。接著檢查貼圖的過濾模式和 mipmap 設定，以及有沒有用 scale 放大 Label。修法對應：美術出足夠倍率的圖或調高設計解析度、把尺寸改成偶數或把位置對齊像素、UI 關 mipmap、像素風改 nearest、Label 改字型大小而不是 scale。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>一個節點 300 × 120，錨點 (1, 0.5)，位置 (−20, 50)。它的四個邊各在父節點空間的哪裡？</li>
<li>Table 的世界座標是 (360, 579)、縮放 0.5、沒有旋轉。世界座標 (410, 629) 換到 Table 空間是多少？</li>
<li>設計 720 × 1280、只勾 Fit Height，手機畫布是 1080 × 2340 像素。縮放是多少？可見寬度是多少？一個放在 x = −330（相對 Canvas 中心）的按鈕看得到嗎？</li>
<li>一個預設模式 Widget 的面板，用 tween 從 x = −800 滑到 0。QA 回報：轉了一下手機，面板跳回某個奇怪的位置。為什麼？給兩種修法。</li>
<li>一張 200 × 280 的牌轉了 30 度。它的 <code>getBoundingBox()</code> 寬和高大約是多少？用它來判斷兩張牌有沒有重疊，會有什麼問題？</li>
<li>網頁版 iPhone 14、Fit Width、設計寬 720。一個 120 × 120 的圖示，實際佔幾個畫布像素？美術至少要出多大，才不會被放大？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>左 = −20 − 1 × 300 = −320；右 = −320 + 300 = −20；下 = 50 − 0.5 × 120 = −10；上 = −10 + 120 = 110。錨點 x 是 1，所以位置點在右邊緣上。</li>
<li>先減 Table 的世界座標：(50, 50)；再除以縮放 0.5：(100, 100)。</li>
<li>縮放 = 2340 ÷ 1280 = 1.828。可見寬度 = 1080 ÷ 1.828 = 590.8，一半是 295.4。按鈕在 −330，超出左邊 34.6 個設計單位，看不到。這就是為什麼靠邊的按鈕要用 Widget，而不是寫死座標。</li>
<li>轉向讓視窗大小改變，ON_WINDOW_RESIZE 的 Widget 被標髒，在那一格結尾把面板拉回 Widget 算出來的位置，tween 的結果被蓋掉。修法一：Widget 掛在外層容器，tween 做在裡面的子節點。修法二：把這個 Widget 設成 ONCE，開場對齊一次之後就交給動畫，但這樣轉向時它也不會再自己貼邊，要自己處理。</li>
<li>寬 = 200 × cos30° + 280 × sin30° = 173.2 + 140 = 313.2；高 = 200 × sin30° + 280 × cos30° = 100 + 242.5 = 342.5。它是軸對齊的框，比牌本身大，四個角多出三角形的空白；兩張牌明明沒碰到，框卻可能重疊，造成誤判。要精準就用分離軸檢測，或把對方的角點換到這張牌的節點空間裡逐點判斷。</li>
<li>每個設計單位是 780 ÷ 720 ≈ 1.083 個畫布像素，所以佔大約 130 × 130。美術至少要出 130 × 130 才不會放大；如果還要出原生版、以 1.625 倍畫，要 195 × 195。實務上通常直接出 2 倍，240 × 240。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>Cocos Creator 3.8 使用手冊</b>（<a href="https://docs.cocos.com/creator/3.8/manual/zh/">docs.cocos.com/creator/3.8/manual/zh</a>）：找「多解析度適配」「Widget 元件」「SafeArea 元件」「座標系與節點變換」這幾章，搭配這一章的數字一起讀。</li>
<li><b>cocos-engine 原始碼</b>（GitHub 上的 cocos/cocos-engine，3.8 分支）：<code>cocos/ui/view.ts</code> 是四種適配的實作，<code>cocos/ui/widget-manager.ts</code> 是 Widget 什麼時候對齊，<code>cocos/2d/framework/ui-transform.ts</code> 是換算和點擊判斷。每個檔案都不長，這一章講的事，那裡都有一行對應的程式碼。</li>
<li><b>Fletcher Dunn、Ian Parberry《3D Math Primer for Graphics and Game Development》</b>：作者在 gamemath.com 免費公開全書。矩陣、座標空間、反矩陣講得最平易近人，2D 的部分只要看前幾章。</li>
<li><b>Robert Nystrom《Game Programming Patterns》的 Dirty Flag 一章</b>（gameprogrammingpatterns.com 可免費線上讀）：用的例子剛好就是場景樹的世界變換，跟第九節講的是同一件事。</li>
<li><b>MDN 的 Window.devicePixelRatio 和 env() 頁面</b>：搞懂瀏覽器那一層的像素和安全區域，網頁版的模糊和瀏海問題就能自己查。</li>
</ul>
` });
