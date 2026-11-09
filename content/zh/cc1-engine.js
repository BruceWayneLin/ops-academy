MZ({
  id: 'cc1',
  title: '引擎怎麼運作',
  time: '1 到 2 週',
  blurb: '遊戲引擎每一格畫面在做什麼、場景怎麼由節點和元件組成、你的程式什麼時候執行、東西在畫面上的哪裡，以及圖片和聲音怎麼載入。這條路線後面的一切，都建立在這上面。',
  lessons: [
  {
    id: 'cc-what',
    title: '遊戲引擎是什麼，Cocos 怎麼在瀏覽器裡跑',
    body: `
<p>歡迎來到 Cocos Creator 這條學習路線。它分成三個模組，帶你從「遊戲引擎是什麼？」一路走到一個完整遊戲的結構。這個模組講引擎怎麼運作。下一個模組講腳本、輸入和移動。最後一個模組把全部串起來，變成一個真正遊戲的架構。</p>
<p>Cocos 的腳本是用 TypeScript 寫的。這條路線只講 Cocos 多加了什麼；語言本身在 TypeScript 路線裡教，在它自己的分頁裡。如果這裡哪一行 TypeScript 看不懂，就去那邊找。</p>
<h3>遊戲引擎是什麼</h3>
<p><b>遊戲引擎</b>（game engine）是一個很大的程式，幫你做掉每個遊戲都需要的工作，讓你只要寫「讓你的遊戲跟別人不一樣」的那一部分。快速畫圖、播放聲音、讀取觸控和按鍵、載入檔案、計時：這些引擎全包了。你只要描述畫面上有什麼、它們該怎麼表現。</p>
<p>想像一間劇院。引擎就是那棟建築：舞台、燈光、布幕，還有後台工作人員。你帶來的是演員和劇本。沒有人會為了每一齣戲重新搭一套燈光。</p>
<p><b>Cocos Creator</b> 一次下載，其實是兩樣東西。<b>編輯器</b>（editor）是一個桌面 App，你在裡面排畫面、把圖片拖進來、掛上腳本。<b>引擎</b>則是真正在玩家裝置上跑你遊戲的程式碼。它免費，腳本用 TypeScript，手機和瀏覽器上有很多 2D 遊戲都是用它做的。</p>
<h3>網頁和遊戲的畫法不一樣</h3>
<p>網頁是怎麼出現的，你已經很熟了。瀏覽器維護一棵 DOM 元素的樹，算出每個元素放在哪裡，再把它們畫出來。資料一變，Vue 只更新跟那筆資料有關的元素，瀏覽器也只重畫那一塊。</p>
<p>瀏覽器裡的 Cocos 遊戲，幾乎整個就只是一個 DOM 元素：一張 <code>&lt;canvas&gt;</code>，也就是畫布（canvas）。牌、按鈕和文字根本不在 DOM 裡。引擎用 <b>WebGL</b> 自己把它們一個一個畫成那張畫布上的彩色像素。WebGL 是瀏覽器提供的方法，讓網頁可以直接使用顯示晶片（GPU）。</p>
<table>
<tr><th></th><th>Vue 頁面</th><th>Cocos 遊戲</th></tr>
<tr><td>頁面上有什麼</td><td>很多 DOM 元素</td><td>一張畫布</td></tr>
<tr><td>誰來畫</td><td>瀏覽器，一個元素一個元素畫</td><td>引擎，透過 WebGL 在 GPU 上畫</td></tr>
<tr><td>什麼時候畫</td><td>資料改變的時候</td><td>每一格，每秒大約 60 次</td></tr>
<tr><td>按鈕是什麼</td><td>一個 <code>&lt;button&gt;</code> 元素</td><td>一張圖，加上一段程式，負責檢查點擊有沒有落在它上面</td></tr>
</table>
<h3>遊戲迴圈</h3>
<p>遊戲就像一本翻頁動畫書。每一頁是一張靜止的圖，叫做一格畫面，也就是一個<b>影格</b>（frame）。翻得夠快，圖就好像動了起來。只要遊戲還在跑，引擎就一頁接一頁地做出這些畫面，而且每一輪都做同樣的三步：</p>
<div class="flow"><span class="box">1. 讀輸入<small>觸控、點擊、按鍵</small></span><span class="arr">&rarr;</span><span class="box hot">2. 更新<small>每個物件移動、判斷、改變</small></span><span class="arr">&rarr;</span><span class="box">3. 繪製<small>畫出整格畫面</small></span><span class="arr">&rarr;</span><span class="box">回到 1<small>每秒大約 60 次</small></span></div>
<p>這個圈就是<b>遊戲迴圈</b>（game loop）。第 2 步，引擎會呼叫場景裡每一個啟用中元件的 <code>update</code> 函式。第 3 步，它把整張畫面重新繪製（render）一次，連沒變的部分也一起畫。聽起來很浪費，但 GPU 就是為這件事設計的；而且每次全部重畫，比追蹤「哪裡變了」更簡單，也更好預測。</p>
<p>每秒 60 格的話，每一輪大約只有 16.7 毫秒。只要某一格的工作花得比這更久，下一格就會遲到，遊戲就會卡頓。遊戲開發裡大部分的效能建議，背後都是這一個數字。</p>
<h3>幀間隔時間：為什麼移動要乘上 dt</h3>
<p>假設你讓球每一格移動 5 像素。在每秒跑得出 60 格的手機上，球每秒走 300 像素。在只跑得出 30 格的舊手機上，它每秒只走 150。同一段程式，速度差了一半。而且只要某一格慢了，球也跟著變慢。</p>
<p>解法是用「每秒」來想，而不是「每格」。引擎每次呼叫 <code>update</code>，都會傳進 <b>dt</b>，也就是幀間隔時間（delta time）：距離上一格過了幾秒。每秒 60 格時，dt 大約是 0.0167。把速度乘上 dt，不管在哪一台裝置上，球每秒走的距離都一樣：</p>
<pre><code>import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Mover')
export class Mover extends Component {
    @property
    speed = 200; // pixels per second

    update(dt: number) {
        const p = this.node.position;
        // distance this frame = speed x time this frame
        this.node.setPosition(p.x + this.speed * dt, p.y, p.z);
    }
}</code></pre>
<p>每秒 60 格時，球每格移動 200 &times; 0.0167，大約 3.3 像素。每秒 30 格時，每格大約移動 6.7 像素。不管哪一種，每秒都是 200 像素。</p>
<h3>在下面試試看</h3>
<p>按「播放」。格數一直往上跳，球照你螢幕的速度跑過跑道。注意看 dt 的數字：在大多數螢幕上大約是 16.7 ms，瀏覽器一忙它就會跳一下，可是球的速度還是很平均。再按「暫停」（同一顆按鈕），迴圈停下來，什麼都不動了。接著勾選「慢動作」，再按一次「播放」。現在三個步驟會一個一個亮起來，每到「更新」那一步，文字就會列出算式：原本的 x 加上速度 &times; dt。</p>
<div class="widget" data-w="cc-loop"></div>
<h3>跟 Vue 對照</h3>
<p>Vue 是<b>響應式</b>（reactive）的：資料沒變就什麼都不做，資料一變，Vue 只修補跟它有關的 DOM。遊戲引擎剛好相反。不管有沒有東西改變，它每一格都把整張畫面重畫，你的程式也每一格都在 <code>update</code> 裡跑一次。在 Vue 裡你問的是「這筆資料變了，什麼要跟著變？」。在遊戲裡你問的是「這一格，每樣東西應該在哪裡？」。</p>
<h3>編輯器、執行階段和建置</h3>
<p><b>編輯器</b>是你工作的地方。<b>執行階段</b>（runtime）是跟著你的遊戲一起發佈、在玩家裝置上跑遊戲迴圈的引擎程式碼。編輯器永遠不會跟著發佈，玩家拿到的只有執行階段和你的內容。</p>
<div class="flow"><span class="box">編輯器<small>場景、資源、腳本</small></span><span class="arr">&rarr;</span><span class="box">預覽<small>在你的瀏覽器裡跑</small></span><span class="arr">&rarr;</span><span class="box hot">建置<small>選單 Project，再選 Build</small></span><span class="arr">&rarr;</span><span class="box">一個遊戲資料夾<small>網頁、Android、iOS 等等</small></span></div>
<p><b>預覽</b>（Preview），也就是編輯器上方那顆播放鍵，會馬上在瀏覽器裡跑你的遊戲。<b>建置</b>（build）則是把專案變成可以發佈的東西：把你的 TypeScript 編譯成 JavaScript、打包圖片和聲音、加上執行階段，再把結果寫進專案的 <code>build</code> 資料夾。網頁版就是一個含有 <code>index.html</code> 的資料夾，放到任何網頁伺服器上都能跑，很像 Vite 專案的 <code>dist</code> 資料夾。</p>
<h3>深入一點：同一個遊戲做成手機 App</h3>
<p>如果是 Android 和 iOS，建置會產生一個原生 App 專案。你的腳本還是以 JavaScript 執行，跑在打包進 App 裡的 JavaScript 引擎上；畫圖則改走手機自己的繪圖系統，而不是 WebGL。你的程式碼不用改，改變的只有底下的執行階段。</p>
<h3>深入一點：其實不只一個元素</h3>
<p>在網頁上，有幾個特殊的元件會在畫布上面疊一個真正的 DOM 元素，例如你正在打字的文字輸入框，或是影片播放器。其他全部都是像素。所以用瀏覽器的「檢查元素」去看一個正在跑的遊戲，幾乎什麼也看不到。</p>
<h3>深入一點：影格率是目標，不是保證</h3>
<p>每秒 60 格是常見的目標，你也可以改。但慢的手機、很重的一格，或是被切到背景的瀏覽器分頁，都會讓格數變少，而且每一格之間的間隔從來不會完全相等。用了 dt 的程式不在乎這些；假設剛好 60 格的程式，在這幾種情況下全都會出問題。</p>`,
    tryNote: '在 Preview 執行專案時，貼到瀏覽器的主控台（Chrome 按 Command+Option+J）。',
    try: [
      '這個頁面有幾個 canvas 元素：一個。整個遊戲都畫在它上面。',
      '到目前為止畫了幾格。隔幾秒各跑一次：每過一秒大約多 60。',
      '要求每秒只跑 10 格。遊戲會變得一頓一頓的，但有用 dt 的東西移動速度還是一樣。用 cc.game.frameRate = 60 改回來。',
      '讓遊戲迴圈停下來，什麼都不動、也不重畫。cc.game.resume() 讓它繼續。'
    ],
    own: `建一個新的空白 2D 專案，或打開一個你手上現有的專案。加一個 sprite，掛上上面的 <code>Mover</code> 腳本，然後預覽。接著做第二個版本：每格固定移動 5 像素，不乘 dt。在主控台用 <code>cc.game.frameRate</code> 比較每秒 60、30、10 格，記下哪一個版本的速度維持不變。`,
    quiz: [
      { q: "一個 Cocos 遊戲在瀏覽器裡跑。遊戲是畫在什麼上面？",
        a: ["每張牌、每顆按鈕各一個 DOM 元素", "一個 canvas 元素，引擎每一格都在上面重畫", "一棵 Vue 元件樹", "不在頁面裡，它在瀏覽器外面跑"],
        why: "牌、按鈕和文字，都是引擎用 WebGL 畫在同一張畫布上的像素，不是 DOM 元素。" },
      { q: "為什麼 update 裡的移動要乘上 dt？",
        a: ["讓程式碼短一點", "因為 dt 是在數已經過了幾格", "讓速度以「每秒」來算，不管每秒 30 格還是 60 格都一樣", "因為 WebGL 沒有它就畫不出來"],
        why: "dt 是距離上一格的時間。速度乘上 dt，就是這一格該走的距離，不管這一格花了多久。" },
      { q: "遊戲迴圈的每一輪，依序做哪三步？",
        a: ["讀輸入、更新、繪製", "繪製、讀輸入、存檔", "載入、建置、預覽", "更新、等資料改變、修補 DOM"],
        why: "先讀玩家做了什麼，讓每個物件改變，再畫出整格畫面。然後重來。" }
    ]
  },
  {
    id: 'cc-tree',
    title: '場景、節點和元件',
    body: `
<p>Cocos 遊戲裡的一切，都是用三個觀念組起來的。現在把它們弄懂，引擎其他的部分就都說得通了。</p>
<table>
<tr><th>觀念</th><th>它是什麼</th><th>生活中的比喻</th></tr>
<tr><td><b>場景</b>（scene）</td><td>遊戲的一個畫面，例如選單或遊戲桌，存成一個檔案</td><td>一座舞台佈景</td></tr>
<tr><td><b>節點</b>（node）</td><td>場景裡的一樣東西。單獨看它是空的：一個名字、一個位置，加上一串子節點</td><td>舞台上一個空的掛鉤，東西可以掛在上面</td></tr>
<tr><td><b>元件</b>（component）</td><td>掛在節點上的一種能力</td><td>掛在鉤子上的東西：一張畫好的牌、一塊寫了字的牌子、一個照劇本演的演員</td></tr>
</table>
<h3>場景是一棵樹</h3>
<p>場景裡裝著節點，每個節點又可以再裝更多節點，也就是它的<b>子節點</b>（child）。這樣就成了一棵樹，跟資料夾裡面還有資料夾是同一種形狀。編輯器把它顯示在層級管理器（Hierarchy）面板裡。下面是 Higher or Lower（猜高低）的一個小場景。這是一個猜牌遊戲：玩家要猜下一張牌會比現在這張大還是小：</p>
<div class="tiers"><b>場景</b><div><span class="box">場景本身</span></div><b>最上層</b><div><span class="box">Canvas</span></div><b>Canvas 底下</b><div><span class="box">Camera</span><span class="box hot">Table</span><span class="box">ScoreLabel</span><span class="box">HigherButton</span><span class="box">LowerButton</span></div><b>Table 底下</b><div><span class="box">CurrentCard</span><span class="box">NextCard</span></div></div>
<p><b>Canvas</b> 是裝所有 2D 東西的節點：按鈕、文字、牌。它裡面有一台 Camera，負責「拍」這些 2D 內容。如果你在一個還沒有 Canvas 的場景裡加 2D 節點，編輯器會自動幫你建一個。你自己的節點都放在 Canvas 底下。</p>
<h3>節點：位置、旋轉、縮放和子節點</h3>
<p>選任何一個節點，屬性檢查器（Inspector）面板就會列出它有什麼。每個節點都一定有這些：</p>
<ul>
<li>一個<b>名字</b>，讓你找得到它。</li>
<li>一個<b>位置</b>：x、y、z。2D 只用 x 和 y。</li>
<li>一個<b>旋轉</b>。2D 只會繞著 z 轉，<code>node.angle</code> 就是轉了幾度。</li>
<li>一個<b>縮放</b>：1 是原本大小，2 是兩倍大。</li>
<li>一個父節點（parent），和一串子節點。</li>
<li><code>active</code>：開或關。</li>
</ul>
<p>就這樣。節點自己什麼都畫不出來，空節點是看不見的。但它還是有用：可以當成一個把手，把其他節點組在一起、一起移動，就像上面的 Table 把兩張牌組在一起。</p>
<h3>元件讓節點有能力</h3>
<p>要讓節點做事，就幫它加一個<b>元件</b>：在屬性檢查器裡按 Add Component，或是用程式加。下面幾個你每天都會用到：</p>
<table>
<tr><th>元件</th><th>讓節點多了什麼</th></tr>
<tr><td><code>UITransform</code></td><td>寬、高和一個錨點。每個 2D 節點都有一個（請看講位置和尺寸的那一課）。</td></tr>
<tr><td><code>Sprite</code></td><td>要畫的一張圖</td></tr>
<tr><td><code>Label</code></td><td>要畫的文字</td></tr>
<tr><td><code>Button</code></td><td>會回應點擊，按下去的時候外觀會變</td></tr>
<tr><td>你自己的腳本</td><td>你寫的任何行為，例如「檢查玩家猜得對不對，對了就加一分」</td></tr>
</table>
<p>一個節點可以掛好幾個元件。一個牌的節點，可能有一個 UITransform、一個顯示牌面的 Sprite，再加上你自己寫、知道這張牌是幾點的 <code>Card</code> 腳本。用小零件掛在一個空的容器上來組東西，而不是每一種物件寫一個大類別，這種做法叫<b>組合</b>（composition）。整個引擎都是這樣蓋起來的。</p>
<h3>父節點帶著子節點走</h3>
<p>子節點的位置不是從螢幕角落量的，而是從它的父節點量起。如果 CurrentCard 在 x = -80，它的父節點 Table 在 x = 100，這張牌就會出現在 100 + (-80) = 20。移動 Table，兩張牌就跟著走，它們自己的數字完全不用改。轉動或縮放 Table，牌也會跟著轉、跟著變大。</p>
<p>所以每個節點都有兩個位置：</p>
<ul>
<li><b>本地座標</b>（local position），相對於父節點。就是屬性檢查器裡的那個數字，在程式裡是 <code>node.position</code>。</li>
<li><b>世界座標</b>（world position）：把所有父節點都算進去之後，它實際落在哪裡。在程式裡是 <code>node.worldPosition</code>。</li>
</ul>
<h3>在下面試試看</h3>
<p>左邊是樹：Canvas、底下的 Table，還有 Table 底下的兩張牌。右邊是舞台。拖動「Table 的 x」和「Table 的 y」：兩張牌跟著 Table 一起走。注意看旁邊的數字。每張牌的本地座標是從 Table 量起的，永遠不變；它在畫面上的世界座標，則是每動一下就變一次。拖「Table 的角度」，牌也跟著轉。最後把「Table 是 active」取消勾選，兩張牌就跟著父節點一起消失。</p>
<div class="widget" data-w="cc-tree"></div>
<h3>啟用和停用</h3>
<p>把節點的 <code>active</code> 設成 false，就是把它關掉：它不會被畫出來，上面的腳本也不再每一格執行，它所有的子節點也一樣。改回 true，一切就回來了，狀態都還在。要藏起一個之後還會再顯示的面板，就用這個，不要把它銷毀之後再重做一次。子節點自己的 <code>active</code> 就算是 true，只要父節點關著，它也看不見。<code>node.activeInHierarchy</code> 會告訴你一個節點是不是真的開著。</p>
<h3>用程式蓋出同一棵樹</h3>
<p>你在編輯器裡做的每件事，在腳本裡也都做得到。在元件裡面，<code>this.node</code> 就是這個元件掛著的那個節點。</p>
<pre><code>import { _decorator, Component, Node, Label } from 'cc';
const { ccclass } = _decorator;

@ccclass('TableBuilder')
export class TableBuilder extends Component {
    start() {
        const table = new Node('Table');
        table.layer = this.node.layer;          // see Going deeper
        this.node.addChild(table);              // Table is now our child
        const card = new Node('Card');
        card.layer = this.node.layer;
        card.addComponent(Label).string = '7';  // now it can show text
        table.addChild(card);
        card.setPosition(-80, 0, 0);            // measured from Table
        table.setPosition(100, 0, 0);           // the card moves too
    }
}</code></pre>
<p>要找節點，<code>this.node.getChildByName('Table')</code> 只在直接的子節點裡找，<code>find('Canvas/Table/Card')</code> 則從場景的最上層照著路徑往下找。要拿節點上的某個元件，用 <code>getComponent</code>，例如 <code>card.getComponent(Label)</code>。</p>
<div class="warn">不要直接改 <code>node.position.x</code>。你讀到的那個位置是唯讀的，你改了，引擎也不會發現。一律呼叫 <code>setPosition</code>，像上面那樣。</div>
<h3>跟 Vue 對照</h3>
<table>
<tr><th>Cocos</th><th>Vue</th></tr>
<tr><td>層級管理器裡的場景樹</td><td>Vue DevTools 裡的元件樹</td></tr>
<tr><td>一個節點</td><td>一個元素，例如 <code>&lt;div&gt;</code></td></tr>
<tr><td>節點上的元件</td><td>你放在元素上的東西：增加行為的指令（directive），加上驅動它的腳本</td></tr>
<tr><td>子節點跟著父節點動</td><td>父元素的框移動時，子元素也跟著移動</td></tr>
<tr><td><code>active = false</code></td><td>很接近 <code>v-show</code>：藏起來，但保留著。差別是上面的腳本會停下來，而且會收到通知。</td></tr>
</table>
<p>有一個差別很重要。在 DOM 裡，CSS 會把子元素排進父元素的框裡。Cocos 預設沒有排版：子節點就只是放在離父節點某個距離的地方。這棵樹同時也是座標系統。</p>
<h3>深入一點：圖層和攝影機</h3>
<p>每個節點還有一個<b>圖層</b>（layer），而攝影機只會拍它被設定要看的那些圖層。你在編輯器裡、在 Canvas 底下建立的節點，會拿到 Canvas 攝影機會拍的 UI_2D 圖層。在程式裡用 <code>new Node()</code> 做出來的節點，拿到的是預設圖層，所以它可能放在完全正確的位置，卻還是看不見。這就是為什麼範例要複製父節點的圖層。如果你用程式建立的節點沒有出現，先查這個。</p>
<h3>深入一點：繪製順序</h3>
<p>2D 節點照樹的順序畫：父節點先畫，子節點後畫；排在前面的兄弟節點先畫，排在後面的後畫。所以最後一個子節點會在最上面。要把一張牌拿到最前面，就用 <code>card.setSiblingIndex(table.children.length - 1)</code> 把它移到父節點清單的最後。</p>`,
    tryNote: '在 Preview 執行專案時，貼到瀏覽器的主控台。把 Table 換成你自己某個節點的名字。',
    try: [
      '執行中的場景裡，最上層那些節點的名字，例如 Canvas。',
      'Canvas 的子節點：樹的下一層。',
      'Canvas 節點上的元件，例如 cc.UITransform 和 cc.Canvas。',
      '這個節點和它所有的子節點一起消失。改回 true 就會回來。'
    ],
    own: `在你自己的專案裡，用編輯器蓋出 Higher or Lower 的牌桌：Canvas 底下一個 Table 節點，Table 底下兩個牌的節點，各自掛一個 Sprite 或 Label。在屬性檢查器裡移動、轉動、縮放 Table，看牌怎麼跟著走。把每張牌的本地座標記下來，再到主控台用 <code>cc.find('Canvas/Table/CurrentCard').worldPosition</code> 查它的世界座標，說說看兩者為什麼不一樣。`,
    quiz: [
      { q: "場景裡有一個沒有任何元件的空節點。畫面上會看到什麼？",
        a: ["一個白色方塊", "用小字寫出來的節點名字", "一個灰色的佔位框", "什麼都沒有：要加上 Sprite 或 Label 這類元件，節點才會畫東西"],
        why: "節點只是一個有位置、有子節點的容器。畫東西靠的是元件。" },
      { q: "Table 在 x = 100，它的子節點 Card 在 x = -80。Table 移到 x = 150 之後，這張牌的本地 x 是多少？",
        a: ["-80", "20", "70", "150"],
        why: "本地座標是從父節點量起的，所以不會變。這張牌的世界 x 則從 20 變成了 70。" },
      { q: "你把一個面板節點的 active 設成 false。它的子節點會怎樣？",
        a: ["還是看得見", "被銷毀", "也一起被關掉，面板重新打開時再一起回來", "被移到場景的最上層"],
        why: "關掉一個節點，就是關掉它整個分支。狀態會保留下來，等它回來時用。" }
    ]
  },
  {
    id: 'cc-lifecycle',
    title: '元件的生命週期：你的程式什麼時候執行',
    body: `
<p>你從來不用自己去呼叫元件的函式，它才開始運作。引擎會在元件一生中的固定時刻替你呼叫：建立的時候、第一格之前、每一格、被關掉的時候，還有被銷毀的時候。這些函式就叫<b>生命週期回呼</b>（lifecycle callback）。搞清楚哪一個在什麼時候跑、每一個裡面該放什麼，大部分的新手 bug 就不會發生。</p>
<p>生活中的比喻：一個新進員工。第一天早上，他先找到自己的座位和工具（onLoad）。每次到公司，他都要簽到（onEnable）。第一天，他會等整個團隊都到齊了，才開始真正做事（start）。然後他一遍又一遍地做他的工作（update）。請假的時候，他簽退（onDisable）。真的離職時，他把鑰匙交回來（onDestroy）。</p>
<h3>一生的順序</h3>
<div class="flow"><span class="box">onLoad<small>一次</small></span><span class="arr">&rarr;</span><span class="box">onEnable<small>每次被打開</small></span><span class="arr">&rarr;</span><span class="box">start<small>一次，在第一次 update 之前</small></span><span class="arr">&rarr;</span><span class="box hot">update、lateUpdate<small>每一格</small></span><span class="arr">&rarr;</span><span class="box">onDisable<small>每次被關掉</small></span><span class="arr">&rarr;</span><span class="box">onDestroy<small>一次，在最後</small></span></div>
<table>
<tr><th>回呼</th><th>什麼時候執行</th><th>裡面放什麼</th></tr>
<tr><td><code>onLoad</code></td><td>一次，在節點第一次被打開時：通常是場景載入時，或是有新節點加進場景時</td><td>找到其他節點和元件的參照（reference），存在欄位裡</td></tr>
<tr><td><code>onEnable</code></td><td>緊接在 <code>onLoad</code> 之後；之後節點或元件每次重新被打開，都會再跑一次</td><td>開始監聽那些只有在它打開時才重要的事件</td></tr>
<tr><td><code>start</code></td><td>一次，就在這個元件第一次 <code>update</code> 之前</td><td>啟動計時器（timer）。讀取其他元件在它們的 <code>onLoad</code> 裡準備好的值。</td></tr>
<tr><td><code>update(dt)</code></td><td>只要元件開著，每一格都跑</td><td>小而快的變化：移動一點點、倒數一點點</td></tr>
<tr><td><code>lateUpdate(dt)</code></td><td>每一格，在所有元件的 <code>update</code> 都跑完之後</td><td>必須跟在別人後面做的事，例如攝影機要跟著一個在 <code>update</code> 裡移動過的玩家</td></tr>
<tr><td><code>onDisable</code></td><td>每次元件被停用，或它的節點被關掉時</td><td>把 <code>onEnable</code> 做的事還原</td></tr>
<tr><td><code>onDestroy</code></td><td>一次，在元件或它的節點被銷毀（destroy）時</td><td>從會繼續存在的東西上移除監聽器（listener），例如全域的 <code>input</code>。釋放你載入的資源。</td></tr>
</table>
<p>你只要寫你需要的回呼就好。一個元件裡只有 <code>update</code>，完全正常。</p>
<h3>在下面試試看</h3>
<p>按按鈕，然後看紀錄。「建立節點」會跑 <code>onLoad</code>，接著是 <code>onEnable</code>。第一次按「下一格畫面」會跑 <code>start</code>，然後是 <code>update</code> 和 <code>lateUpdate</code>。之後的每一格只跑 <code>update</code> 和 <code>lateUpdate</code>，因為 <code>start</code> 在元件一生中只跑一次。「隱藏（active = false）」會跑 <code>onDisable</code>；節點藏起來的時候，按「下一格畫面」什麼都不會呼叫。「顯示」會再跑一次 <code>onEnable</code>，但不會跑 <code>onLoad</code> 或 <code>start</code>。「銷毀」的話，如果節點原本開著，會先跑 <code>onDisable</code>，再跑 <code>onDestroy</code>。</p>
<div class="widget" data-w="cc-lifecycle"></div>
<h3>一個實際的例子</h3>
<p>這是 Higher or Lower 的回合計時器。每一段都放在它該在的回呼裡：</p>
<pre><code>import { _decorator, Component, Label, input, Input, EventKeyboard } from 'cc';
const { ccclass } = _decorator;

@ccclass('Round')
export class Round extends Component {
    private label: Label | null = null;
    private left = 10;

    onLoad() {
        this.label = this.getComponent(Label);     // find references once
        input.on(Input.EventType.KEY_DOWN, this.onKey, this);
    }
    start() { this.schedule(this.tick, 1); }      // call tick every second
    tick() {
        this.left -= 1;
        if (this.label) this.label.string = String(this.left);
    }
    onKey(e: EventKeyboard) { console.log('key', e.keyCode); }
    onDestroy() { input.off(Input.EventType.KEY_DOWN, this.onKey, this); }
}</code></pre>
<p><code>input</code> 這個物件屬於整個遊戲，不屬於這個節點，節點被銷毀之後它還活著。如果 <code>onDestroy</code> 裡沒有 <code>input.off</code>，之後每按一次鍵，都還會去呼叫一個已經不存在的元件的 <code>onKey</code>。每一個 <code>on</code> 都要有一個對應的 <code>off</code>：<code>onLoad</code> 配 <code>onDestroy</code>；如果監聽器只應該在節點開著時有作用，就用 <code>onEnable</code> 配 <code>onDisable</code>。</p>
<h3>絕對不要在 update 裡做重活</h3>
<p><code>update</code> 每秒大約跑 60 次，而且每個啟用中的元件都會跑。一件花 1 毫秒的工作，做一次不算什麼；放在 50 個元件裡、每一格都做，就是 50 毫秒，整整是一格預算的三倍。所以在 <code>update</code> 裡：</p>
<ul>
<li>不要用 <code>find</code> 或 <code>getComponent</code> 去搜尋整棵樹。在 <code>onLoad</code> 裡找一次，把結果存起來。</li>
<li>不要載入檔案，也不要建立大物件。提早準備好。</li>
<li>每秒才發生一次的事，不要用 <code>update</code> 做。用 <code>this.schedule</code>，就像上面的計時器那樣。</li>
</ul>
<h3>好幾個元件之間的順序</h3>
<ul>
<li>場景載入時，所有的 <code>onLoad</code> 都會在任何一個 <code>start</code> 之前跑完。所以在 <code>start</code> 裡，你可以放心使用其他元件在它們的 <code>onLoad</code> 裡設定好的東西。</li>
<li>同一個節點上，元件照它們在屬性檢查器裡由上到下的順序執行。</li>
<li>不同節點之間的順序，不要去依賴。如果某個腳本一定要先跑，就用 <code>@executionOrder</code> 裝飾器調整它的執行順序（execution order），給它一個比較小的數字。預設是 0。它會影響 <code>onLoad</code>、<code>onEnable</code>、<code>start</code>、<code>update</code> 和 <code>lateUpdate</code>。</li>
<li>在同一格裡，所有的 <code>update</code> 都跑完之後，才會開始任何一個 <code>lateUpdate</code>。</li>
</ul>
<h3>跟 Vue 對照</h3>
<table>
<tr><th>Cocos</th><th>Vue 裡最接近的</th><th>不一樣的地方</th></tr>
<tr><td><code>onLoad</code></td><td><code>created</code>，或 <code>setup</code> 的開頭</td><td>在 <code>onLoad</code> 裡，場景已經存在，所以你找得到其他節點。在 <code>created</code> 裡還沒有 DOM。</td></tr>
<tr><td><code>onEnable</code></td><td>KeepAlive 裡的 <code>onActivated</code></td><td>在 Vue 裡，只有被快取的元件才有。在 Cocos 裡，每個元件都有。</td></tr>
<tr><td><code>start</code></td><td><code>onMounted</code></td><td><code>start</code> 會等到第一格，在場景裡所有 <code>onLoad</code> 都跑完之後。</td></tr>
<tr><td><code>update(dt)</code>、<code>lateUpdate(dt)</code></td><td>沒有</td><td>Vue 是資料變了才跑程式。這兩個不管怎樣，每一格都跑。</td></tr>
<tr><td><code>onDisable</code></td><td>KeepAlive 裡的 <code>onDeactivated</code></td><td>跟 <code>onEnable</code> 一樣的差別</td></tr>
<tr><td><code>onDestroy</code></td><td><code>onBeforeUnmount</code>、<code>onUnmounted</code></td><td>做的事一樣：清掉監聽器和計時器</td></tr>
</table>
<p>把這張表當成幫助記憶的工具，不要當成完全對等。觀念很接近，但時間點並不完全相同。</p>
<h3>深入一點：銷毀發生在這一格的最後</h3>
<p><code>node.destroy()</code> 不會馬上把節點移除。節點會立刻被關掉，所以 <code>onDisable</code> 會跑；真正的銷毀，連同 <code>onDestroy</code>，發生在目前這一格的最後。在那之後，<code>node.isValid</code> 就是 false。可能在節點消失之後才碰到它的程式，例如之後才從計時器或網路回來的回應，應該先檢查 <code>isValid</code>。</p>
<h3>深入一點：移除不等於銷毀</h3>
<p><code>node.removeFromParent()</code> 會把節點從樹裡拿出來，但節點還在記憶體裡，隨時可以加到別的地方去。要把節點從一個父節點搬到另一個，這很好用。但一個被移除、之後既沒有加回去、也沒有銷毀的節點，就只是漏掉的記憶體。</p>
<h3>深入一點：只關掉一個元件</h3>
<p>設定 <code>this.enabled = false</code>，只會關掉那一個元件。它的 <code>update</code> 會停、<code>onDisable</code> 會跑，但節點還留在畫面上，其他元件也照常運作。</p>`,
    tryNote: '先在編輯器裡做一步，接著在 Preview 執行時，貼到瀏覽器的主控台。',
    try: [
      '主控台會顯示 onLoad、onEnable 和 start，各一次。',
      '紀錄裡出現 onDisable。改回 true：會跑 onEnable，但不會跑 onLoad 和 start。',
      '只有那一個元件被關掉。onDisable 會跑，但節點還在畫面上。',
      '先 onDisable，再 onDestroy。這一格結束後，節點就從樹裡消失了。'
    ],
    own: `從你的專案裡挑一個元件，把它的程式照回呼分類：它找了什麼、啟動了什麼、什麼每一格都在跑、最後清掉了什麼。接著檢查兩件事。它有沒有在 <code>update</code> 裡呼叫 <code>find</code> 或 <code>getComponent</code>？有的話搬到 <code>onLoad</code>。每一個 <code>input.on</code> 或 <code>director.on</code>，有沒有在 <code>onDestroy</code> 或 <code>onDisable</code> 裡配一個 <code>off</code>？把缺的補上。`,
    quiz: [
      { q: "元件需要的其他元件，應該在哪裡找？",
        a: ["在 update 裡每一格都找，這樣永遠是最新的", "在 onLoad 裡找一次，存在欄位裡", "在 onDestroy 裡", "在 lateUpdate 裡"],
        why: "每一格都搜尋很浪費時間。在 onLoad 裡找一次，把結果存起來。" },
      { q: "一個節點被 active = false 藏起來，現在又被顯示出來。顯示的時候會跑哪些回呼？",
        a: ["onLoad、onEnable 和 start", "只有 start", "只有 onLoad", "只有 onEnable"],
        why: "onLoad 和 start 在元件一生中只跑一次。onEnable 則是每次重新打開都會跑。" },
      { q: "一個腳本在 onLoad 裡呼叫了 input.on，卻從來沒有呼叫 input.off。會出什麼問題？",
        a: ["節點被銷毀之後，全域的 input 還會繼續呼叫一個已經不存在的元件的函式", "沒問題，Cocos 會自動移除所有監聽器", "遊戲無法啟動", "這個節點再也藏不起來"],
        why: "input 屬於整個遊戲，活得比節點久。要在 onDestroy 裡把監聽器移除。" }
    ]
  },
  {
    id: 'cc-coords',
    title: '位置、尺寸、錨點和座標空間',
    body: `
<p>在 CSS 裡，你用 <code>top</code> 和 <code>left</code> 擺一個框，框的左上角就放在那裡。Cocos 問的是另一個問題：這個框的「哪一點」要放在這個位置上？那一點就叫<b>錨點</b>（anchor point）。只要錨點想通了，大部分「為什麼我的 sprite 跑到錯的地方？」的問題，就自己有答案了。</p>
<h3>UITransform：尺寸和錨點</h3>
<p>每個 2D 節點都有一個 <code>UITransform</code> 元件，裡面存兩樣東西：</p>
<ul>
<li><b>內容尺寸</b>（content size）：節點那個框的寬和高。</li>
<li>錨點：框裡面的一個點，用寬和高的比例來表示。(0, 0) 是左下角，(1, 1) 是右上角，預設的 (0.5, 0.5) 是正中間。</li>
</ul>
<p>想像你把一張照片釘在軟木板上。圖釘插進木板的地方，就是位置。圖釘穿過照片的地方，就是錨點。從照片正中間穿過去，照片就平均地攤在圖釘四周。從左下角穿過去，照片就往圖釘的右上方伸出去。</p>
<div class="note">規則是：節點的位置，就是它的錨點在父節點裡面的位置。而父節點的「裡面」，是從父節點自己的錨點開始算的。一個在 (0, 0) 的子節點，剛好就放在父節點的錨點上；預設的父節點，錨點在正中間，不是在角落。</div>
<h3>算出四個邊</h3>
<p>一個節點，位置在 (x, y)，寬 w、高 h，錨點是 (ax, ay)：</p>
<table>
<tr><th>邊</th><th>公式</th><th>例子：x = 100、y = 50、w = 200、h = 80、錨點 (0.5, 0.5)</th></tr>
<tr><td>左</td><td>x - ax &times; w</td><td>100 - 100 = 0</td></tr>
<tr><td>右</td><td>左 + w</td><td>0 + 200 = 200</td></tr>
<tr><td>下</td><td>y - ay &times; h</td><td>50 - 40 = 10</td></tr>
<tr><td>上</td><td>下 + h</td><td>10 + 80 = 90</td></tr>
</table>
<p>把錨點改成 (0, 0)，左邊就剛好是 x，下邊就剛好是 y：框從位置開始，往右、往上長出去。</p>
<h3>在下面試試看</h3>
<p>綠色十字標的是節點的位置，你改錨點的時候它不會動。拖「錨點 x」和「錨點 y」：矩形會繞著那個固定的十字滑動，因為你是在選矩形的哪一點要對準十字。在 (0, 0) 時，十字在左下角；在 (1, 1) 時，十字在右上角。接著拖「位置 x」和「位置 y」：這次十字和矩形一起移動。下面的數字會列出四個邊，你可以拿來驗算上面的公式。這個矩形是 120 &times; 80。</p>
<div class="widget" data-w="cc-anchor"></div>
<h3>Y 軸朝上</h3>
<p>在 DOM 裡，y 是往下長的：頁面最上面是 0，數字越大越下面。在 Cocos 裡，就跟學校的數學一樣，y 是往<b>上</b>長的。y 越大，在螢幕上就越高，所以把一張牌往上移 50，就是把它的 y 加 50。每個網頁工程師都至少會掉進這個坑一次。</p>
<div class="tiers"><b>DOM</b><div><span class="box">(0, 0) 在左上角</span><span class="box">y 往下長</span></div><b>Cocos</b><div><span class="box hot">(0, 0) 在父節點的錨點</span><span class="box hot">y 往上長</span></div></div>
<h3>本地座標和世界座標</h3>
<p>就像講場景的那一課說的，節點的 <code>position</code> 是<b>本地座標</b>（local coordinates）：從父節點量起。它的<b>世界座標</b>（world coordinates）則是它在整個場景裡實際落在哪裡。對 Canvas 底下的 2D 內容來說，世界座標的 (0, 0) 是可見範圍的左下角，而 Canvas 節點本身放在正中間。</p>
<p>只要兩樣東西在不同的父節點底下，就需要換算。點擊進來時是世界座標；想知道它點在 Table 的哪裡，就要把它換算到 Table 的座標空間（coordinate space）。要把一張牌從一個父節點搬到另一個，又不想讓它跳一下，就拿它的世界座標，換算成新父節點的座標空間。</p>
<pre><code>import { Node, Vec3, UITransform } from 'cc';

function demo(table: Node, card: Node) {
    const ui = table.getComponent(UITransform)!;
    // world to local: this world point, seen from Table
    const local = ui.convertToNodeSpaceAR(new Vec3(400, 300, 0));
    // local to world: where Table's anchor is in the world
    const world = ui.convertToWorldSpaceAR(new Vec3(0, 0, 0));
    // shortcut for a node's own world position
    console.log(local, world, card.worldPosition);
}</code></pre>
<p>兩個名字結尾的 AR，意思是「相對於錨點」：在那個空間裡，(0, 0) 就是節點的錨點。</p>
<h3>設計解析度：一套排版適用每種螢幕</h3>
<p>手機有各種形狀，你不可能每一種都排一次畫面。你選一個<b>設計解析度</b>（design resolution），例如直式遊戲用 720 &times; 1280，所有東西都用這個單位來排。遊戲執行時，引擎再把這個設計縮放到真正的螢幕上。怎麼縮放，是在 Project Settings 的 Project Data 裡，用兩個勾選框來設定：</p>
<table>
<tr><th>勾選</th><th>一定看得到</th><th>螢幕形狀不一樣時</th></tr>
<tr><td>Fit Width</td><td>設計的完整寬度</td><td>比較長的螢幕，上下會多出空間；比較寬的螢幕，上下會被裁掉一些。</td></tr>
<tr><td>Fit Height</td><td>設計的完整高度</td><td>比較寬的螢幕，左右會多出空間；比較窄的螢幕，左右會被裁掉一些。</td></tr>
<tr><td>兩個都勾</td><td>整個設計</td><td>形狀不合的地方，會出現空白的邊條</td></tr>
<tr><td>兩個都不勾</td><td>螢幕永遠是填滿的</td><td>設計有一邊會被裁掉一部分</td></tr>
</table>
<p>例如，一個直式遊戲可以勾 Fit Width，再把背景畫得比設計高一點，這樣長型手機上多出來的空間就不會看起來空空的。<code>view.getVisibleSize()</code> 會告訴你，設計範圍實際上有多少在螢幕上。</p>
<h3>Widget：貼住邊緣</h3>
<p>長型手機上下多出了空間，放在固定 y 的分數就可能飄到中間去。<b>Widget</b> 元件就是用來解決這個問題的。把它加到節點上，勾選它要貼住的邊，每一邊給一個距離，例如離上面 20、離右邊 20。之後引擎會在每一種螢幕上，相對於父節點替你算出位置。左右兩邊都勾，節點還會被拉寬到跟父節點一樣寬，很像 CSS 的 <code>left: 0; right: 0</code>。</p>
<pre><code>import { _decorator, Component, Widget } from 'cc';
const { ccclass } = _decorator;

@ccclass('PinTopRight')
export class PinTopRight extends Component {
    onLoad() {
        const w = this.getComponent(Widget) ?? this.addComponent(Widget);
        w.isAlignTop = true;
        w.top = 20;
        w.isAlignRight = true;
        w.right = 20;
        w.updateAlignment();   // apply it now
    }
}</code></pre>
<h3>深入一點</h3>
<ul>
<li><b>縮放和旋轉都繞著錨點。</b>錨點是 (0.5, 0) 的牌，會從底邊往上長大，也會繞著底邊的中點旋轉。選錨點時，要考慮節點要怎麼動，不只是它要放在哪裡。</li>
<li><b>邊界框。</b>UITransform 的 <code>getBoundingBox()</code> 會給你節點在父節點空間裡的矩形，<code>getBoundingBoxToWorld()</code> 則給你世界空間裡的。可以用來判斷兩張牌有沒有重疊。</li>
<li><b>觸控位置。</b>觸控事件的 <code>getUILocation()</code> 和 UI 在同一個世界空間裡。用 <code>convertToNodeSpaceAR</code> 換算，就知道手指落在節點的哪裡。</li>
<li><b>Widget 有一點成本。</b>對齊模式設成 ALWAYS 的 Widget，只要它自己或父節點一有變動，就會重新對齊；會動的節點一多，這些工作就會累積起來。如果只需要在視窗大小改變時調整，用 ON_WINDOW_RESIZE 就夠了。</li>
</ul>`,
    tryNote: '在 Preview 執行專案時，貼到瀏覽器的主控台。',
    try: [
      '在 Project Settings 裡設定的設計解析度。',
      '這個螢幕顯示了多少設計範圍。跟設計解析度比一比，再把預覽切到另一種裝置尺寸，重跑一次。',
      'Canvas 放在螢幕正中間，所以這大約是可見寬度的一半、可見高度的一半。',
      'Canvas 的錨點：(0.5, 0.5)，也就是它的中心。'
    ],
    own: `拿一個你做過的畫面，挑三個節點。每一個都記下它的錨點、位置和尺寸，再用上面的公式手算出四個邊。挑其中一個，在主控台用 <code>getBoundingBoxToWorld()</code> 驗算。如果有哪個元素應該貼住螢幕邊緣，就把它的固定位置換成 Widget，再用兩種不同的裝置尺寸預覽看看。`,
    quiz: [
      { q: "一個節點寬 200，錨點 x 是 0，位置 x 是 100。它的左邊在哪裡？",
        a: ["0", "-100", "100", "200"],
        why: "左 = x - ax × w = 100 - 0 × 200 = 100。錨點 x 是 0，框就從位置開始。" },
      { q: "你把節點的 y 加 50。它在螢幕上往哪裡移？",
        a: ["往上", "往下", "往左", "要看錨點"],
        why: "Cocos 的 y 軸朝上，跟 DOM 相反。" },
      { q: "分數標籤要在每一支手機上，都待在離螢幕頂端 20 像素的地方。該用什麼？",
        a: ["在一支手機上算好的固定位置", "換一個設計解析度", "把錨點設成 (0.5, 0.5)", "對齊頂端、距離設成 20 的 Widget"],
        why: "Widget 會在每一種螢幕尺寸上，根據父節點的邊算出位置。" }
    ]
  },
  {
    id: 'cc-assets',
    title: '資源：圖片、聲音、Prefab 和載入',
    body: `
<p>遊戲用到的東西裡，不是程式碼的都叫<b>資源</b>（asset）：圖片、聲音、字型、動畫，連場景本身也是。在編輯器裡，它們放在資源管理器（Assets）面板，也就是專案的 <code>assets</code> 資料夾。把檔案丟進去，編輯器就會匯入它，轉成引擎可以快速使用的東西。</p>
<h3>你會碰到的幾種</h3>
<table>
<tr><th>資源</th><th>它是什麼</th><th>誰在用</th></tr>
<tr><td>圖片</td><td>一個 .png 或 .jpg 檔。引擎會把它變成<b>貼圖</b>（texture）：一張載入到 GPU 上的圖。</td><td>所有要畫圖的地方</td></tr>
<tr><td>SpriteFrame</td><td>貼圖上的一塊矩形，可以直接拿來畫：整張圖，或其中一部分</td><td><code>Sprite</code> 元件</td></tr>
<tr><td>Sprite atlas</td><td>很多張小圖拼進一張大圖裡，再加上一份清單，記錄每一張在哪裡</td><td>共用它的 Sprite</td></tr>
<tr><td>Audio clip</td><td>一個聲音檔，例如 .mp3</td><td><code>AudioSource</code> 元件</td></tr>
<tr><td>Prefab</td><td>存起來、隨時可以複製的節點樹</td><td>你的腳本，透過 <code>instantiate</code></td></tr>
<tr><td>場景</td><td>一整個畫面：存成檔案的一棵節點樹</td><td><code>director.loadScene</code></td></tr>
</table>
<h3>為什麼要用圖集</h3>
<p>想像 52 張牌面是 52 張分開的圖。GPU 每畫一張牌之前都得換一次圖，每換一次都要花時間。把 52 張全部拼進一張<b>圖集</b>（atlas），引擎常常就能把它們放在同一批一起畫。圖比較少、比較大，要下載的檔案也比較少。圖集可以用 TexturePacker 這類外部工具來做，也可以交給編輯器：在一個資料夾裡建立一個 Auto Atlas，建置時那個資料夾裡的圖就會被拼在一起。</p>
<h3>資源資料庫和 uuid</h3>
<p>編輯器匯入一個檔案時，會給它一個 <b>uuid</b>，也就是一組唯一識別碼：一串很長、不會跟其他資源重複的 id。它會把這個 uuid 和匯入設定一起，寫進原始檔旁邊一個小小的 <code>.meta</code> 檔。場景和 Prefab 都是用 uuid 來指向資源的，從來不是用檔名。</p>
<div class="flow"><span class="box">card-back.png<small>你的檔案</small></span><span class="arr">&rarr;</span><span class="box">card-back.png.meta<small>uuid 和匯入設定</small></span><span class="arr">&rarr;</span><span class="box">library 資料夾<small>匯入後、引擎可以直接用的版本</small></span><span class="arr">&rarr;</span><span class="box hot">場景檔<small>指向那個 uuid</small></span></div>
<p>所以你在資源管理器裡改名或搬動資源，什麼都不會壞：uuid 沒有變。這也是為什麼你不能在 Finder 裡搬檔案，卻不帶著它的 .meta 檔。.meta 一弄丟，檔案就會拿到新的 uuid，所有用到它的場景就指向空無一物。.meta 檔要 commit 進 git。<code>library</code> 和 <code>temp</code> 資料夾是編輯器產生的，可以重建，所以不要放進 git。</p>
<h3>Prefab：可以複製的節點樹</h3>
<p>手做一張牌沒問題，手做 52 張就不行了。先在場景裡做好一張牌，包括它的圖、文字和腳本，再把這個節點從層級管理器拖到資源管理器裡。這樣就把它存成一個 <b>Prefab</b>，也就是預製體（prefab）。從此之後，你的程式想複製幾份全新的都可以：</p>
<pre><code>import { _decorator, Component, Prefab, instantiate } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Deck')
export class Deck extends Component {
    @property(Prefab)
    cardPrefab: Prefab | null = null;   // drag the prefab here in the Inspector

    draw(index: number) {
        if (!this.cardPrefab) return;
        const card = instantiate(this.cardPrefab);  // a new copy of the whole tree
        card.setPosition(index * 40, 0, 0);
        this.node.addChild(card);                   // nothing shows until it has a parent
    }
}</code></pre>
<p>改一次 Prefab，之後從它複製出來的每一份都會跟著變，已經擺在你場景裡的每一個實例也一樣。一個 Prefab 裡面，也可以再放其他 Prefab。</p>
<h3>跟 Vue 對照</h3>
<table>
<tr><th>Cocos</th><th>Vue</th></tr>
<tr><td>一個 Prefab 資源</td><td>一個 <code>.vue</code> 檔：定義一次、可以重複使用的零件</td></tr>
<tr><td><code>instantiate</code>，再 <code>addChild</code></td><td>在 template 裡寫 <code>&lt;Card /&gt;</code>：建立一個新的實例，並掛載上去</td></tr>
<tr><td>用 <code>@property</code> 標記、在屬性檢查器裡設定的欄位</td><td>Props</td></tr>
<tr><td>Prefab 裡的 Prefab</td><td>在另一個元件裡使用的元件</td></tr>
</table>
<p>有一個差別：Vue 會照 template 自動幫你建立實例。在 Cocos 裡，你在編輯器裡擺進場景的 Prefab，會在場景載入時建立；但任何動態的東西，例如每一回合一張新牌，都要你自己在程式裡實例化（instantiate）。</p>
<h3>在遊戲執行中載入</h3>
<p>場景用到的資源，會跟著場景一起載入。但有時候，你要的東西晚一點才需要：玩家選的牌面設計、他打開的某一關。這種情況，就把資源放在 <code>assets</code> 裡一個叫 <code>resources</code> 的資料夾，然後用路徑載入：</p>
<pre><code>import { _decorator, Component, Sprite, SpriteFrame, resources } from 'cc';
const { ccclass } = _decorator;

@ccclass('CardBack')
export class CardBack extends Component {
    start() {
        // path inside assets/resources, without the file extension
        resources.load('cards/back/spriteFrame', SpriteFrame, (err, frame) =&gt; {
            if (err) { console.error(err); return; }
            this.getComponent(Sprite)!.spriteFrame = frame;
        });
        console.log('this line runs first');
    }
}</code></pre>
<p>注意路徑最後的 <code>/spriteFrame</code>。圖檔是 <code>cards/back.png</code>，但 Sprite 需要的是它裡面的 SpriteFrame；在 Cocos Creator 3.x 裡，要在路徑後面加上它的名字才拿得到。</p>
<h3>為什麼載入是非同步的</h3>
<p>讀檔案要花時間：手機上是從儲存空間讀，瀏覽器裡是透過網路下載，有時候要好幾百毫秒。如果 <code>resources.load</code> 一直等到檔案到了才返回，遊戲迴圈就會停住，畫面就會凍結。所以這個呼叫是<b>非同步</b>（asynchronous）的：它馬上返回，迴圈繼續跑，等檔案到了，你的回呼才會執行。這就是為什麼「this line runs first」會在圖片出現之前就印出來。需要這個資源的程式碼，一定要放在回呼裡面；或者，如果你把這個呼叫包成 Promise，就放在 <code>await</code> 後面。TypeScript 路線裡講非同步程式的那一課有教。</p>
<h3>Asset Bundle：需要時再整組載入</h3>
<p><code>resources</code> 資料夾本身就是一個內建的 <b>Asset Bundle</b>（資源包）。你也可以自己做：在資源管理器裡選一個資料夾，在屬性檢查器裡勾 Is Bundle。每個 bundle 都會被建置成獨立的一包，裡面的資源只有在你要的時候才會下載：</p>
<pre><code>import { assetManager, Prefab, instantiate, Node } from 'cc';

function openShop(parent: Node) {
    assetManager.loadBundle('shop', (err, bundle) =&gt; {
        if (err) { console.error(err); return; }
        bundle.load('ShopPanel', Prefab, (err2, prefab) =&gt; {
            if (err2) { console.error(err2); return; }
            parent.addChild(instantiate(prefab));
        });
    });
}</code></pre>
<p>跟 Vue 對照：這就是 code splitting（程式碼分割）。像 <code>component: () =&gt; import('./Shop.vue')</code> 這樣的 lazy route，會讓商店不包含在第一次下載裡。Bundle 對遊戲資源做的是同一件事。第一個畫面出現得更快，從來不開商店的玩家，也永遠不用下載它。</p>
<h3>釋放資源，以及為什麼手機特別在意</h3>
<p>載入後的圖片，在記憶體裡是一張沒有壓縮的貼圖，它的大小跟 .png 檔案的大小完全無關。一張 2048 &times; 2048 的圖要佔 2048 &times; 2048 &times; 4 個位元組，也就是 16 MB，就算檔案只有 300 KB 也一樣。這種圖載入夠多張，手機可能會一聲不響就把你的遊戲關掉。</p>
<p>所以，你自己載入的東西用完了，就把它釋放掉：</p>
<pre><code>import { assetManager, resources, SpriteFrame, Asset } from 'cc';

// release one asset you loaded by path
resources.release('cards/back/spriteFrame', SpriteFrame);

// or release an asset object you are holding
function drop(asset: Asset) {
    assetManager.releaseAsset(asset);
}</code></pre>
<p>只釋放真的已經不再顯示的東西：還在用某張被釋放貼圖的 sprite，可能會變成一片空白。引擎會替每個資源記一個<b>參照計數</b>（reference count），避免另一個資源還需要的貼圖被誤釋放。如果你把載入的資源存在欄位裡留著之後用，就對它呼叫 <code>addRef()</code>，表示「我在用這個」，用完再呼叫 <code>decRef()</code>。整個場景的話，在場景上勾 Auto Release Assets，切換到別的場景時，它用過的東西就會被釋放，下一個場景也要用的除外。</p>
<h3>深入一點</h3>
<ul>
<li><b>resources 裡的東西全部都會打包。</b>在 <code>resources</code> 和其他 bundle 以外的資源，只有被建置裡的東西用到，才會放進建置。<code>resources</code> 裡的東西不管有沒有用到都會打包進去，因為引擎沒辦法知道你的程式會要哪些路徑。這個資料夾要保持精簡。</li>
<li><b>壓縮貼圖。</b>針對手機，你可以在貼圖壓縮設定裡，選 ASTC 或 ETC2 這類對 GPU 友善的壓縮格式。這樣存的貼圖，只佔原本記憶體的一小部分。</li>
<li><b>預先載入。</b><code>director.preloadScene('Game')</code> 會在玩家還停在選單時，就先下載下一個場景，切換時就快很多。</li>
</ul>`,
    tryNote: '在 Preview 執行時，貼到瀏覽器的主控台。最後一項在 Finder 裡做。',
    try: [
      '現在已經載入的 bundle，例如 main 和 internal；如果你的專案有 resources 資料夾，也會有 resources。',
      '現在記憶體裡有多少個資源。載入一些東西或切換場景之後，再跑一次。',
      '把路徑換成你自己 resources 資料夾裡的一張圖。結果會過一下子才印出來，不是馬上。',
      'uuid 那一行，就是場景用來指向這張圖的 id。'
    ],
    own: `在你自己的專案裡，做一個牌的 Prefab，再寫一個 <code>Deck</code> 腳本，用它排出一排五張牌。接著把牌背的圖搬進 <code>resources</code> 資料夾，在遊戲執行中用路徑載入；在呼叫之前印一行、在回呼裡印一行，看看順序。最後，用寬 &times; 高 &times; 4，算出你最大的三張圖各佔多少 GPU 記憶體。`,
    quiz: [
      { q: "為什麼 .meta 檔一定要跟著它的資源一起走？",
        a: ["它裡面存的就是圖片本身", "它存著場景和 Prefab 用來找到這個資源的 uuid", "它讓檔案變小", "沒有它，git 會拒絕這個資源"],
        why: "場景指向的是 uuid，不是檔名。.meta 一弄丟，就會換成新的 uuid，參照全部斷掉。" },
      { q: "instantiate(cardPrefab) 會給你什麼？",
        a: ["Prefab 檔案的路徑", "一個之後才會 resolve 的 promise", "什麼都沒有，它會直接改 Prefab 本身", "一棵從 Prefab 複製出來的新節點樹，加到某個父節點之後就會出現"],
        why: "它會把存起來的那棵樹，複製出一份全新的。把它加到場景裡的某個父節點，就看得到了。" },
      { q: "一個 1024 × 1024 的 PNG 檔是 200 KB。當成一般貼圖載入之後，大約佔多少 GPU 記憶體？",
        a: ["200 KB", "1 MB", "4 MB", "16 MB"],
        why: "1024 × 1024 個像素，每個 4 個位元組，就是 4 MB。一旦變成貼圖，檔案大小就不重要了。" }
    ]
  }
  ]
});
