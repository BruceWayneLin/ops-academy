MZ({
  id: 'cc2',
  title: '腳本、輸入與動畫',
  time: '1 到 2 週',
  blurb: '自己寫元件、回應點擊和按鈕、用標準的 UI 元件拼出畫面，再用 tween 和動畫片段讓東西動起來。',
  lessons: [
  {
    id: 'cc-scripts',
    title: '寫一支元件腳本',
    body: `
<p><b>元件腳本</b>（component script）是一個 TypeScript 檔案，負責讓節點「有行為」。節點是場景裡的那個東西，腳本是它會做的事。一個掛了 Sprite 的卡牌節點，本來就能顯示圖片；再掛上你自己寫的腳本，這張牌就能翻面、記住自己的點數，還能告訴遊戲「我被選了」。</p>
<p>可以把節點想成一個空白的公仔，元件（component）就是一個個卡上去的零件：一張圖、一行文字、一顆按鈕，還有一顆你自己寫的小腦袋。你的腳本（script）只是再多卡上去一個零件，跟引擎內建的 Sprite、Label 是同一類東西。</p>
<div class="tiers"><b>節點</b><div><span class="box hot">Card<small>名稱、位置、父節點、子節點</small></span></div><b>元件</b><div><span class="box">UITransform<small>尺寸和錨點</small></span><span class="box">Sprite<small>負責畫圖</small></span><span class="box hot">Card<small>你的腳本</small></span></div></div>
<h3>每支腳本都長這樣</h3>
<p>在 Assets 面板按右鍵，選 Create，再選 TypeScript，Cocos 就會幫你寫好下面這段，只是 Card 會換成你取的名字：</p>
<pre><code>import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Card')
export class Card extends Component {
    start() {
    }

    update(deltaTime: number) {
    }
}</code></pre>
<ul>
<li><code>from 'cc'</code>：引擎提供的所有東西，都來自一個叫 <code>cc</code> 的模組。</li>
<li><code>_decorator</code> 裡放著你需要的兩個裝飾器。第二行把它們拿出來，你就能直接寫 <code>@ccclass</code>，不用寫成 <code>@_decorator.ccclass</code>。</li>
<li><code>extends Component</code> 讓你的 class 變成一個元件。它可以掛在節點上，引擎也會呼叫它的生命週期方法，像 <code>onLoad</code>、<code>start</code>、<code>update</code>（「元件的生命週期」那一課會講）。</li>
<li><code>export</code> 讓別的腳本可以 import 這個 class。</li>
</ul>
<h3>裝飾器，簡單講</h3>
<p>開頭是 <code>@</code> 的那一行，就是<b>裝飾器</b>（decorator）。它是一個函式，在 class 被定義的那一刻執行一次，替緊接在它後面的東西貼上一張標籤。它不會改變你的程式一行一行怎麼跑，而是告訴引擎和編輯器關於這個 class 的一些事。</p>
<table>
<tr><th>裝飾器</th><th>放在</th><th>告訴引擎</th></tr>
<tr><td><code>@ccclass('Card')</code></td><td>class 上</td><td>「這是一個元件 class，名字叫 Card。」少了它，編輯器就沒辦法把這支腳本掛到節點上。</td></tr>
<tr><td><code>@property</code></td><td>欄位上</td><td>「把這個欄位顯示在屬性檢查器（Inspector）裡，並且把它的值跟著場景一起存起來。」</td></tr>
</table>
<p>每個 <code>@ccclass</code> 的名字在整個專案裡都不能重複。一般的習慣是讓檔名、class 名稱和 <code>@ccclass</code> 的名字三個都一樣。</p>
<h3>@property：讓編輯器幫你填的屬性（property）</h3>
<pre><code>import { _decorator, Component, Label, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Card')
export class Card extends Component {
    @property
    value = 7;                           // a number box in the Inspector

    @property(Label)
    valueLabel: Label | null = null;     // a slot: drag a Label into it

    @property([SpriteFrame])
    faces: SpriteFrame[] = [];           // a list of pictures
}</code></pre>
<p>如果是單純的數字、字串或布林值，只寫 <code>@property</code> 就夠了，編輯器會從初始值判斷型別。如果是引擎裡的東西，像 Node、Label 或一張圖，就要把型別寫在括號裡，編輯器才知道這個格子可以放什麼進來。括號裡再包一層方括號，就變成清單。</p>
<p>選取節點，屬性檢查器就會出現你的 Card 元件和三個欄位。把 Label 節點從層級管理器（Hierarchy）面板拖到 Value Label 這一格。這條存起來的連結就是一個<b>參照</b>（reference）。場景載入時，引擎會在你的 <code>onLoad</code> 執行之前，就把那個 Label 填進 <code>valueLabel</code>。</p>
<div class="flow"><span class="box">層級管理器<small>那個 Label 節點</small></span><span class="arr">拖曳 &rarr;</span><span class="box">屬性檢查器裡的格子<small>Value Label</small></span><span class="arr">存進場景 &rarr;</span><span class="box hot">this.valueLabel<small>onLoad 時已經準備好</small></span></div>
<div class="warn">屬性檢查器裡的值說了算。程式裡的 <code>= 7</code>，只是元件第一次被加上去時用的初始值。之後你把它改成 <code>= 9</code>，場景裡已經擺好的每一張牌，還是會保留它存下來的 7。數字「怎麼改都不變」的時候，先去看屬性檢查器。</div>
<p><b>跟 Vue 比較。</b><code>@property</code> 很像 prop：元件先宣告它需要什麼，再由外面的人提供。在 Vue 裡，是父元件的 template 把 props 傳進來；在 Cocos 裡，是你自己在屬性檢查器裡手動填，而且這些值會存在場景檔裡。把節點拖進格子，就像 template ref：直接拿到某個東西的把手，而不是去搜尋。</p>
<table>
<tr><th>Cocos</th><th>Vue</th></tr>
<tr><td>繼承 Component 的 class</td><td>.vue 檔裡的 script 部分</td></tr>
<tr><td><code>@property</code> 欄位</td><td>prop</td></tr>
<tr><td>拖進來的節點參照</td><td>template ref</td></tr>
<tr><td><code>this.node</code></td><td>元件的根元素</td></tr>
<tr><td><code>find('Canvas/Board')</code></td><td><code>document.querySelector</code></td></tr>
</table>
<h3>在程式裡拿到其他東西</h3>
<table>
<tr><th>你寫</th><th>你拿到</th></tr>
<tr><td><code>this.node</code></td><td>這支腳本掛著的那個節點</td></tr>
<tr><td><code>this.getComponent(Sprite)</code></td><td>同一個節點上的 Sprite；沒有的話是 <code>null</code></td></tr>
<tr><td><code>this.node.getChildByName('Face')</code></td><td>名叫 Face 的直屬子節點，或 <code>null</code></td></tr>
<tr><td><code>this.node.parent</code></td><td>父節點</td></tr>
<tr><td><code>find('Canvas/Board/Deck')</code></td><td>從場景最上層照這條路徑找到的節點，或 <code>null</code></td></tr>
</table>
<h3>為什麼「拖進來」比「用名字找」好</h3>
<p>用名字找，在有人把節點改名、或把它搬到別的父節點底下之前，都不會有問題。一旦改了，<code>find</code> 就會默默回傳 <code>null</code>，遊戲到執行時才壞掉，跳出「Cannot read properties of null」，而且出錯的地方常常離真正的原因很遠。拖進來的參照會跟著節點走：改名也好、搬家也好，連結還是指著它。空著的格子在屬性檢查器裡也一眼就看得到，所以少接一條線，在你按下 Play 之前就會發現。</p>
<p>用名字找，就留給沒辦法拖的東西，例如遊戲執行中才建立的節點。真的要用的時候，在 <code>onLoad</code> 裡找一次，存進欄位。不要在 <code>update</code> 裡每一個影格都去搜整棵樹。</p>
<h3>用程式加元件</h3>
<pre><code>// inside a method of Card; glowFrame is a @property SpriteFrame
const glow = new Node('Glow');
glow.layer = this.node.layer;              // same layer, so the same camera draws it
const sprite = glow.addComponent(Sprite);  // a UITransform is added too
sprite.spriteFrame = this.glowFrame;
this.node.addChild(glow);</code></pre>
<p><code>addComponent</code> 會建立元件、掛上去、再把它回傳給你，所以你可以馬上設定它。Sprite 需要 UITransform 來決定尺寸，Cocos 會自動幫你加一個。不過大多數時候，比較輕鬆的做法是在編輯器裡把節點做好，存成預製物件（prefab），再用 <code>instantiate</code> 複製出來。這樣看得到、也改得動，不用碰程式。</p>
<h3>一支完整的腳本：點一下就翻面的牌</h3>
<pre><code>import { _decorator, Component, Node, Label } from 'cc';
const { ccclass, property } = _decorator;
@ccclass('Card')
export class Card extends Component {
    @property(Node) front: Node | null = null;   // drag the Front child here
    @property(Node) back: Node | null = null;    // drag the Back child here
    @property(Label) valueLabel: Label | null = null;
    @property value = 7;
    private faceUp = false;
    onLoad() {
        this.node.on(Node.EventType.TOUCH_END, this.flip, this);
    }
    flip() {
        if (!this.front || !this.back || !this.valueLabel) return;  // a slot is empty
        this.faceUp = !this.faceUp;
        this.front.active = this.faceUp;
        this.back.active = !this.faceUp;
        this.valueLabel.string = String(this.value);
    }
}</code></pre>
<ol>
<li>在 Canvas 底下建一個叫 Card 的節點。確認它有 UITransform，再把尺寸設成一張牌的大小，例如 200 乘 280。</li>
<li>給它兩個子節點 Front 和 Back，各掛一個 Sprite。在 Front 裡面放一個 Label。把 Front 的勾取消，讓一開始先看到牌背。</li>
<li>把腳本拖到 Card 上。再把 Front、Back 和那個 Label 分別拖進三個格子。</li>
<li>按 Play，點一下那張牌。</li>
</ol>
<p>把 <code>active</code> 設成 false，會把節點和它底下的所有東西藏起來，上面的腳本也會停下來。<code>onLoad</code> 裡那一行，是在監聽「點到這張牌本身」，下一課會完整說明。</p>
<h3>深入一點：@ccclass 到底做了什麼</h3>
<p>TypeScript 編譯之後，class 會變成一個普通的 JavaScript 函式，型別資訊全都不見了。可是遊戲執行時，引擎還是需要知道：哪些欄位要顯示、哪些要存、每個欄位是什麼型別。裝飾器就是讓這些資訊留下來的方法。<code>@ccclass</code> 用名字把 class 登記在引擎的 class 清單裡；每個 <code>@property</code> 則把一個欄位，加進這個 class 專屬的一份清單。場景載入時，引擎讀取存好的資料，建立你的元件，再把存下來的值複製到清單上的欄位。沒有 <code>@property</code> 的欄位不在清單上，所以既不會顯示，也不會被存，每次都從程式裡寫的值開始。</p>
<h3>深入一點：幫你省下好幾個小時的規則</h3>
<ul>
<li><b>不要在 constructor 裡做初始化。</b>元件是引擎自己建立的，存好的欄位值是建立之後才填進去的。請用 <code>onLoad</code>。</li>
<li><b>東西只找一次。</b>在 <code>onLoad</code> 裡呼叫 <code>getComponent</code>，把結果存進欄位。</li>
<li><b>要預期會拿到 null。</b>每一次查找都可能失敗。欄位型別上的 <code>| null</code> 就是 TypeScript 在提醒你，「null 與 undefined」那一課會教你怎麼處理。</li>
</ul>`,
    tryNote: '打開一個 Cocos Creator 3.8 專案的瀏覽器預覽，開啟開發者工具（Mac 上按 Option-Command-I），把每一行貼進 Console 執行。',
    try: [
      '目前場景裡，最上層各個節點的名稱。',
      '用路徑找到 Canvas，列出它底下直屬的子節點。',
      'Canvas 底下的每一個元件，以及它掛在哪個節點上。你自己寫的腳本，會用 @ccclass 的名字出現。'
    ],
    own: `打開你自己的一個專案，找一支用 <code>find</code> 或 <code>getChildByName</code> 去拿別的節點的腳本。把這個查找換成一個 <code>@property</code> 格子，再把節點拖進去。接著把那個節點改名，按 Play：拖進來的版本照樣能跑，你也會明白為什麼。如果你手上還沒有這種腳本，就照這一課做出那張會翻面的牌。`,
    quiz: [
      { q: "你在程式裡把 <code>@property speed = 300</code> 改成 <code>= 500</code>，但場景裡已經擺好的那艘船，還是用 300 的速度在跑。為什麼？",
        a: ["腳本沒有編譯成功", "場景替那個元件存了 300，存下來的值比程式裡的預設值優先", "@property 只能用在字串上", "速度不能超過 300"],
        why: "程式裡的值只在元件第一次被加上去時使用。之後載入的，是存在場景裡、屬性檢查器上的那個值。" },
      { q: "為什麼把參照拖進 @property 格子，比呼叫 find('Canvas/Board/Deck') 安全？",
        a: ["用拖的比較快，不用打字", "find 只能在 update 裡用", "find 找不到 Canvas 底下的節點", "拖進來的參照在節點改名或搬家之後還是指著它，路徑則會默默回傳 null"],
        why: "路徑是對名字的猜測；拖進來的參照，是直接連到節點本身。" },
      { q: "<code>@ccclass('Card')</code> 做了什麼？",
        a: ["用 Card 這個名字把 class 登記給引擎，編輯器才能把它加到節點上，場景也才能載入它", "讓 class 跑得比較快", "在場景裡建立一個叫 Card 的節點", "從 cc 模組 import Card 這個 class"],
        why: "裝飾器帶著引擎在執行時需要的資訊。有了 @ccclass，這個 class 才會變成編輯器認得的元件。" }
    ]
  },
  {
    id: 'cc-input',
    title: '輸入與事件',
    body: `
<p>遊戲要會反應：點一張牌、按一顆按鈕、在桌面上拖動。Cocos 把這些全都用<b>事件</b>（event）送來。事件就是一則小訊息，例如「這裡、這個點，有一次觸控開始了」，交給每一個說過「我要這個」的函式。這些函式叫<b>監聽函式</b>（listener）。</p>
<p>如果你在網頁上寫過 <code>addEventListener('click', fn)</code>，你已經懂這個概念了。名字不一樣，形狀是一樣的。</p>
<h3>節點上的觸控事件</h3>
<pre><code>onLoad() {
    this.node.on(Node.EventType.TOUCH_START, this.onDown, this);
    this.node.on(Node.EventType.TOUCH_END, this.onUp, this);
}

onDown(event: EventTouch) {
    const p = event.getUILocation();     // where, in UI coordinates
    console.log('down at', p.x, p.y);
}

onUp(event: EventTouch) {
    console.log('released on', this.node.name);
}</code></pre>
<p>第三個參數 <code>this</code>，是這個監聽函式的<b>目標</b>（target）：也就是在函式裡面會變成 <code>this</code> 的那個物件。少了它，<code>onDown</code> 裡的 <code>this</code> 就不再是你的元件，<code>this.node</code> 會出錯。</p>
<table>
<tr><th>事件</th><th>什麼時候觸發</th></tr>
<tr><td><code>TOUCH_START</code></td><td>手指按到這個節點上，或滑鼠在它上面按下</td></tr>
<tr><td><code>TOUCH_MOVE</code></td><td>那根手指在移動，就算已經移出節點也一樣</td></tr>
<tr><td><code>TOUCH_END</code></td><td>手指在節點範圍內離開螢幕</td></tr>
<tr><td><code>TOUCH_CANCEL</code></td><td>手指在節點範圍外離開螢幕</td></tr>
<tr><td><code>MOUSE_ENTER</code>、<code>MOUSE_LEAVE</code>、<code>MOUSE_WHEEL</code></td><td>只有電腦上才有：滑鼠移入移出，還有滾輪</td></tr>
</table>
<p>在電腦的瀏覽器裡，滑鼠點擊也會被當成觸控事件送進來，所以只要監聽觸控，手機和電腦就都顧到了。滑鼠事件只拿來做手機沒有的東西，例如滑鼠移上去（hover）的效果。</p>
<h3>一次觸控怎麼找到它的節點</h3>
<p>手指落在玻璃上。哪個節點會拿到這次觸控？引擎會做一次<b>點擊判定</b>（hit test）：</p>
<div class="flow"><span class="box">手指碰到螢幕<small>一個以像素表示的點</small></span><span class="arr">&rarr;</span><span class="box">瀏覽器<small>送出一次觸控</small></span><span class="arr">&rarr;</span><span class="box">引擎的輸入系統<small>轉換座標</small></span><span class="arr">&rarr;</span><span class="box">點擊判定<small>由上往下，只看有監聽的</small></span><span class="arr">&rarr;</span><span class="box hot">目標節點<small>收到 TOUCH_START</small></span></div>
<ol>
<li>它只考慮「啟用中、而且有在監聽觸控」的節點。</li>
<li>它由上往下一個一個問，畫在最上面的先被問。子節點畫在父節點上面，排在後面的兄弟節點畫在前面那個的上面。</li>
<li>每問一個，就問那個節點的 UITransform：這個點在你的矩形裡嗎？第一個回答「在」的就贏了。那個節點就是這次事件的目標，它底下的節點完全看不到這次觸控。</li>
</ol>
<div class="tiers"><b>最上層</b><div><span class="box hot">彈窗的遮罩背景<small>BlockInputEvents</small></span></div><b>中間</b><div><span class="box">Card<small>有監聽</small></span><span class="box">「大」按鈕</span><span class="box">「小」按鈕</span></div><b>最下層</b><div><span class="box">桌面圖<small>沒有監聽：永遠點不到</small></span></div></div>
<h3>什麼會擋住觸控，什麼不會</h3>
<table>
<tr><th>那個點最上面是</th><th>結果</th></tr>
<tr><td>一張沒有監聽的圖</td><td>擋不住。觸控會交給底下有在監聽的節點。</td></tr>
<tr><td>一個有監聽的節點，或一顆 Button</td><td>拿走這次觸控。底下的節點完全看不到。</td></tr>
<tr><td>掛了 <code>BlockInputEvents</code> 元件的節點</td><td>把落在它矩形裡的觸控全部吃掉。把它掛在彈窗的半透明黑色背景上，後面的遊戲就按不到了。</td></tr>
<tr><td>一個有監聽、但透明度是 0 的節點</td><td>還是點得到。看不見不等於不存在。要真的拿掉它，請設 <code>active = false</code>。</td></tr>
<tr><td>被父節點的 Mask 遮住的節點</td><td>被 Mask 遮住的地方點不到。</td></tr>
</table>
<p>第一列最容易讓人意外。上面蓋一張大大的裝飾圖，並不會擋住點到底下按鈕的操作，除非它有監聽，或掛了 BlockInputEvents。</p>
<h3>冒泡：事件會往上傳</h3>
<p>找到目標之後，事件不會停在那裡，而是會<b>冒泡</b>（bubbling）：目標的監聽函式跑完，接著輪到父節點對同一個事件的監聽函式，再來是祖父節點，一路到最上面。網頁上的 DOM 事件也是這樣。</p>
<div class="flow"><span class="box hot">Card<small>目標：它的監聽函式先跑</small></span><span class="arr">&rarr;</span><span class="box">Hand<small>父節點</small></span><span class="arr">&rarr;</span><span class="box">Table<small>祖父節點</small></span><span class="arr">&rarr;</span><span class="box">Canvas</span></div>
<p>假設在比大小裡，點一下空的桌面就會發下一張牌，所以 Table 節點監聽 TOUCH_END。牌放在 Table 裡面，點一下牌會翻面。如果什麼都不做，點牌的時候它會先翻面，接著事件冒泡上去，又多發了一張牌。所以牌的監聽函式要把它擋下來：</p>
<pre><code>onCardTouched(event: EventTouch) {
    this.flip();
    event.propagationStopped = true;    // the Table never hears about it
}</code></pre>
<p>在監聽函式裡，<code>event.target</code> 是被點到的那個節點，<code>event.currentTarget</code> 是現在正在跑監聽函式的那個節點。<b>跟 Vue 比較：</b>把事件擋下來、不再往上傳遞（propagation），就是 <code>@click.stop</code>，在一般的 DOM 程式裡就是 <code>stopPropagation()</code>。</p>
<h3>Button 元件</h3>
<p>玩家刻意要按的東西，請用 <b>Button</b>，不要直接用觸控事件。它會顯示按下去的樣子，手指按著滑出去再放開就不算數，還可以用 <code>interactable = false</code> 把它關掉。接法有兩種。</p>
<p><b>在編輯器裡接。</b>在 Button 的 Click Events 清單加一筆，把掛著你腳本的節點拖進去，再選元件和方法。選填的 CustomEventData 文字會傳給那個方法，所以兩顆按鈕可以共用同一個方法：</p>
<pre><code>// Higher button: CustomEventData = higher
// Lower button:  CustomEventData = lower
onGuess(event: EventTouch, choice: string) {
    this.guess(choice === 'higher');
}</code></pre>
<p><b>用程式接。</b>Button 會在自己的節點上送出 click 事件，監聽函式收到的就是那顆 Button。</p>
<pre><code>this.higherButton.node.on(Button.EventType.CLICK, this.onHigher, this);</code></pre>
<h3>自己的事件：emit 和 on</h3>
<p>節點也可以傳你自己發明的訊息。一支腳本呼叫 <code>emit</code>，所有用 <code>on</code> 註冊同一個名字的監聽函式都會執行。</p>
<pre><code>// Card.ts: tell whoever is listening
this.node.emit('card-flipped', this.value);

// Table.ts: listen on that card's node
card.on('card-flipped', this.onCardFlipped, this);

onCardFlipped(value: number) {
    console.log('card shows', value);
}</code></pre>
<p>有兩件事要知道。<code>emit</code> 最多可以多帶五個參數，原封不動交給監聽函式。還有，用 <code>emit</code> 送出的事件不會冒泡：只有掛在那個節點上的監聽函式聽得到。</p>
<p><b>跟 Vue 比較。</b><code>this.node.emit</code> 就是 Vue 元件裡的 <code>emit('card-flipped', value)</code>，<code>on</code> 就是父元件上的 <code>@card-flipped</code>。差別在於 Vue 的父元件是在 template 裡監聽，而 Cocos 的監聽者必須先拿到那個節點的參照，再用程式訂閱。</p>
<h3>給整個遊戲用的事件匯流排</h3>
<p>有時候發送的一方和監聽的一方離得很遠。螢幕上方的分數 Label 想知道玩家什麼時候猜對，但它跟遊戲邏輯之間沒有任何連結。那就給整個遊戲一個共用的 <code>EventTarget</code>：</p>
<pre><code>// events.ts
import { EventTarget } from 'cc';
export const bus = new EventTarget();

// Game.ts
bus.emit('score-changed', this.score);

// ScoreLabel.ts
onLoad()    { bus.on('score-changed', this.onScore, this); }
onDestroy() { bus.off('score-changed', this.onScore, this); }
onScore(score: number) { this.label.string = String(score); }</code></pre>
<p>像這樣的<b>事件匯流排</b>（event bus），就是 Cocos 版的 mitt，或 Vue 2 時代的「event bus」：一個大家都 import 的模組，讓任何地方都能跟任何地方說話。拿它來傳整個遊戲都在意的消息，例如「分數變了」、「這一局結束了」。可以直接用參照的地方，就不要用它。匯流排會把「誰依賴誰」藏起來。</p>
<h3>有 on 就要有 off</h3>
<p>每一個 <code>on</code> 都要有一個對應的 <code>off</code>，而且事件名稱、函式、目標三個都要一樣。忘了的話，會出兩種問題的其中一種：</p>
<table>
<tr><th>忘了 off</th><th>會發生什麼事</th></tr>
<tr><td>換場景，ScoreLabel 被銷毀了</td><td>匯流排還抓著它的監聽函式。下一次分數變化，就會呼叫一個已經死掉的元件：不是直接出錯，就是默默地對一個已經不存在的節點做事。這也是<b>記憶體洩漏</b>（memory leak）：死掉的元件永遠沒辦法被釋放。</td></tr>
<tr><td>你在 <code>onEnable</code> 裡訂閱，卻從來沒在 <code>onDisable</code> 裡取消</td><td>節點每重新顯示一次，就多加一份監聽函式。到了第二輪，每猜對一次就加兩分。</td></tr>
</table>
<div class="warn">兩個習慣就能同時避免這兩種問題。第一，成對寫：<code>onLoad</code> 配 <code>onDestroy</code>，或 <code>onEnable</code> 配 <code>onDisable</code>。第二，用有名字的方法來監聽，永遠不要直接塞一個箭頭函式進去。<code>off</code> 需要「同一個」函式，而直接寫在那裡的箭頭函式，每次都是一個新的函式。<code>bus.targetOff(this)</code> 一行就能把這個元件加到匯流排上的監聽全部移除。</div>
<p>掛在元件自己節點上的監聽，會在那個節點被銷毀時一起消失。但比元件活得久的東西，例如匯流排、別的節點、全域的 <code>input</code> 物件，會一直留著那些監聽，直到你自己移除為止。</p>
<h3>深入一點</h3>
<ul>
<li><b>只有在監聽的節點才會參加點擊判定。</b>這點跟 DOM 不一樣。點到一個沒有監聽的子節點，它不會變成目標。所以只在父節點放一個監聽、再去讀 <code>event.target</code>，你拿到的會是父節點，而不是手指底下那張牌。請讓每張牌都有自己的監聽。</li>
<li><b>捕獲（capture）。</b><code>node.on(type, fn, this, true)</code> 會在事件往下走的途中就先聽到，比目標自己的監聽函式還早。ScrollView 就是這樣聽的：就算拖曳是從它裡面的 Button 開始，而 Button 會擋住自己觸控的冒泡，ScrollView 還是看得到。</li>
<li><b>讓觸控穿過去。</b>設 <code>event.preventSwallow = true</code>，下面的下一個節點也能試著接這次觸控。很少需要用到。</li>
<li><b>自己發會冒泡的事件。</b><code>this.node.dispatchEvent(new Event('card-picked', true))</code> 送出的事件，會像觸控一樣沿著父節點往上冒泡。這裡的 <code>Event</code> 是從 <code>cc</code> import 進來的那一個。</li>
<li><b>鍵盤和整個螢幕範圍的輸入</b>，來自全域的 <code>input</code> 物件，而不是某個節點：</li>
</ul>
<pre><code>import { input, Input, EventKeyboard, KeyCode } from 'cc';

onLoad()    { input.on(Input.EventType.KEY_DOWN, this.onKey, this); }
onDestroy() { input.off(Input.EventType.KEY_DOWN, this.onKey, this); }
onKey(e: EventKeyboard) {
    if (e.keyCode === KeyCode.ARROW_UP) this.guess(true);     // higher
    if (e.keyCode === KeyCode.ARROW_DOWN) this.guess(false);  // lower
}</code></pre>`,
    tryNote: '打開一個 Cocos Creator 3.8 專案的瀏覽器預覽，開啟開發者工具，把每一行貼進 Console 執行。',
    try: [
      '接著在預覽畫面上到處點。每一次傳到 Canvas 的觸控，都會印出被點到的節點和正在監聽的節點。點到空白的地方，被點到的就是 Canvas 本身。點到 Button 可能什麼都不會印，因為 Button 把觸控擋下來了。',
      '自訂事件：先監聽，再 emit。會印出 got 42。',
      '一個迷你的事件匯流排。兩則訊息都會送到同一個監聽函式。'
    ],
    own: `在你自己的專案裡搜尋 <code>.on(</code>。每找到一個監聽，就檢查有沒有一個名稱、函式、目標都一樣的 <code>off</code>，而且是成對寫在 <code>onLoad</code> 和 <code>onDestroy</code>，或 <code>onEnable</code> 和 <code>onDisable</code> 裡。少了的就補上。然後在一個彈窗後面放一層掛了 <code>BlockInputEvents</code> 的黑色背景，確認它後面的按鈕再也按不到。`,
    quiz: [
      { q: "一張沒有任何監聽的大裝飾圖，蓋在一顆 Button 上面。玩家點在兩者重疊的地方，會發生什麼事？",
        a: ["什麼都不會發生：圖片擋住了這次點擊", "Button 會收到，因為沒有監聽的節點在點擊判定時會被跳過", "兩個都會收到", "引擎會丟出錯誤"],
        why: "只有啟用中、而且有在監聽的節點，才會參加點擊判定。想擋住點擊，就給那張圖掛一個 BlockInputEvents 元件。" },
      { q: "玩家離開遊戲畫面再回來之後，每猜對一次就加兩分。最可能的原因是什麼？",
        a: ["分數的 tween 跑了兩次", "事件匯流排壞了", "監聽函式在 onEnable 裡加上去，卻從來沒在 onDisable 裡移除，所以多了一份", "手機上的按鈕一定會觸發兩次"],
        why: "每一次 onEnable 都多加一個監聽。onEnable 要配 onDisable，或是 onLoad 配 onDestroy。" },
      { q: "在一張牌的 TOUCH_END 監聽函式裡，要怎麼讓父節點 Table 的 TOUCH_END 監聽不要也跟著執行？",
        a: ["event.propagationStopped = true", "return false", "this.node.off()", "event.target = null"],
        why: "觸控事件會沿著父節點往上冒泡。把 propagationStopped 設成 true，這趟旅程就停在這張牌。" }
    ]
  },
  {
    id: 'cc-ui',
    title: 'UI 的基本元件',
    body: `
<p>遊戲畫面是用一小把現成的元件拼出來的，就像網頁是用一小把 HTML 元素拼出來的一樣。學會這七個，幾乎任何選單、面板或卡片你都做得出來。</p>
<table>
<tr><th>元件</th><th>做什麼</th><th>最接近的網頁概念</th></tr>
<tr><td>Sprite</td><td>顯示一張圖</td><td><code>&lt;img&gt;</code>，或背景圖</td></tr>
<tr><td>Label</td><td>顯示文字</td><td><code>&lt;span&gt;</code></td></tr>
<tr><td>Button</td><td>對按下有反應，還有按下去的樣子</td><td><code>&lt;button&gt;</code></td></tr>
<tr><td>Layout</td><td>把子節點排成一列、一欄或格狀</td><td>Flexbox、CSS grid</td></tr>
<tr><td>ScrollView</td><td>讓比視窗大的內容可以捲動</td><td><code>overflow: auto</code></td></tr>
<tr><td>Mask</td><td>把超出形狀的部分藏起來</td><td><code>overflow: hidden</code></td></tr>
<tr><td>Widget</td><td>讓節點跟父節點的邊緣保持固定距離</td><td><code>position: absolute</code> 加上 top 和 right</td></tr>
</table>
<p>它們每一個都需要同一個節點上有 <b>UITransform</b>，用來存尺寸和錨點。編輯器會自動幫你加。</p>
<h3>Sprite：精靈圖（sprite），也就是一張圖</h3>
<p>Sprite 畫的是一個 <b>SpriteFrame</b>：一張圖，或一張大圖裡的其中一塊。把圖片從 Assets 面板拖進它的 Sprite Frame 格子。它的 Type 決定圖片怎麼填滿節點：</p>
<table>
<tr><th>Type</th><th>用在</th></tr>
<tr><td>Simple</td><td>大部分的圖：牌面、圖示。整張圖拉伸成節點的大小。</td></tr>
<tr><td>Sliced</td><td>要拉長拉寬、但轉角不能變形的按鈕和面板</td></tr>
<tr><td>Tiled</td><td>把一小塊花紋重複鋪滿一大片</td></tr>
<tr><td>Filled</td><td>只填滿一部分的進度條和圓形計時器</td></tr>
</table>
<h3>Sliced，也就是九宮格：拉伸也不會醜的轉角</h3>
<p>把一張圓角按鈕圖拉到三倍寬，圓角就會變成扁扁的橢圓。<b>九宮格</b>（9-slice）就是用來解決這個問題的。在 Assets 面板裡選取那張圖的 SpriteFrame，在屬性檢查器裡按 Edit，打開 Sprite 編輯器。在那裡設定四條邊界，把圖切成九塊。再把 Sprite 的 Type 設成 Sliced，每一塊就會用自己的方式拉伸：</p>
<table>
<tr><td><b>轉角</b><small>永遠不拉伸</small></td><td><b>上邊</b><small>只左右拉伸</small></td><td><b>轉角</b><small>永遠不拉伸</small></td></tr>
<tr><td><b>左邊</b><small>只上下拉伸</small></td><td><b>中間</b><small>上下左右都拉伸</small></td><td><b>右邊</b><small>只上下拉伸</small></td></tr>
<tr><td><b>轉角</b><small>永遠不拉伸</small></td><td><b>下邊</b><small>只左右拉伸</small></td><td><b>轉角</b><small>永遠不拉伸</small></td></tr>
</table>
<p>轉角的像素原封不動，所以一顆小按鈕和一大塊面板，可以共用同一張小圖。</p>
<h3>Label：文字</h3>
<p>Label 預設用手機的系統字型：不用下載，但每台裝置看起來都會有點不一樣。想要固定的樣子，就拖一個 TTF 字型檔進去。分數想用手繪風格的字，就用<b>點陣字型</b>（bitmap font）：一張圖裡放好每一個字元。Overflow 這個設定，決定文字比框還長的時候怎麼辦：</p>
<table>
<tr><th>Overflow</th><th>文字太長的時候</th></tr>
<tr><td>None</td><td>框會長大到剛好裝得下文字</td></tr>
<tr><td>Clamp</td><td>超出框的文字直接被切掉</td></tr>
<tr><td>Shrink</td><td>字會縮小，直到裝得下為止</td></tr>
<tr><td>Resize Height</td><td>寬度不變，文字自動換行，框往下長高</td></tr>
</table>
<p>在 Clamp 和 Shrink 模式下，Enable Wrap Text 這個勾，決定太長的一行要不要折到下一行。分數用 Shrink 最保險：9 和 10,000 都塞得進同一個框。</p>
<h3>Button：按下時的變化（transition）</h3>
<p>Button 通常掛在有 Sprite 的節點上。它的 Transition 設定負責給玩家回饋：</p>
<table>
<tr><th>Transition</th><th>玩家看到的</th></tr>
<tr><td>None</td><td>沒有變化</td></tr>
<tr><td>Color</td><td>每種狀態一種色調：一般、按下、滑鼠移上、停用</td></tr>
<tr><td>Sprite</td><td>每種狀態換一張圖</td></tr>
<tr><td>Scale</td><td>按住時稍微變大或變小（Zoom Scale）</td></tr>
</table>
<p><code>interactable</code> 是 false 的時候，會顯示停用的樣子。在比大小裡，牌正在翻面的時候，把兩顆猜測按鈕都關掉，玩家就沒辦法猜兩次。</p>
<h3>Layout：一列、一欄、格狀</h3>
<p>在父節點掛一個負責自動排列（layout）的 Layout，它就會幫你擺好子節點的位置。加一個或拿掉一個子節點，其他的會自動移過去補位。</p>
<table>
<tr><th>Layout 設定</th><th>接近的 CSS 概念</th></tr>
<tr><td>Type：Horizontal</td><td><code>display: flex</code></td></tr>
<tr><td>Type：Vertical</td><td><code>flex-direction: column</code></td></tr>
<tr><td>Type：Grid</td><td><code>flex-wrap: wrap</code>，或 CSS grid</td></tr>
<tr><td>Spacing X 和 Y</td><td><code>gap</code></td></tr>
<tr><td>Padding</td><td><code>padding</code></td></tr>
<tr><td>Resize Mode：Container</td><td>父節點跟著子節點變大變小，像 <code>width: fit-content</code></td></tr>
<tr><td>Resize Mode：Children</td><td>子節點被調整大小來填滿父節點，大約像 <code>flex: 1</code></td></tr>
</table>
<p>有三件事常讓人卡住。Layout 只排啟用中的直屬子節點，所以藏起來的子節點不會留空位。子節點的位置歸它管，你手動設的位置會被蓋掉。還有，它是在這個影格稍後才更新，不是在你加子節點的那一刻；如果馬上就需要新位置，就呼叫 <code>layout.updateLayout()</code>。</p>
<h3>ScrollView 和 Mask</h3>
<p>ScrollView 就是一扇看著一大張紙的窗。現成的那一個（在層級管理器按右鍵，Create、UI Component、ScrollView）分成三個部分：</p>
<div class="tiers"><b>ScrollView</b><div><span class="box">ScrollView<small>處理拖曳和回彈</small></span></div><b>view</b><div><span class="box hot">view<small>一個 Mask：看得見的那扇窗</small></span></div><b>content</b><div><span class="box">content<small>Layout，Resize Mode 設成 Container</small></span><span class="box">一列</span><span class="box">一列</span><span class="box">一列</span></div></div>
<p>view 節點上有一個<b>遮罩</b>（mask），會把矩形以外的東西全部藏起來，所以捲出視窗的列會在邊緣消失。給 content 一個垂直的 Layout，Resize Mode 設成 Container，它就會隨著你加的列變長，ScrollView 也就一直知道可以捲多遠。把 Mask 的類型設成橢圓、蓋在一張方形照片上，就是做圓形大頭貼的方法。</p>
<p>一千列、每一列都是真的節點，就會很慢。常見的解法是只建立螢幕裝得下的那幾列，捲動時重複利用它們，就像 Vue 裡的虛擬捲動（virtual scroller）。</p>
<h3>Widget：貼齊螢幕邊緣</h3>
<p>手機有各種形狀。一顆擺在固定位置的暫停鍵，在這支手機上剛好在角落，在另一支手機上卻有一部分跑出螢幕。<b>Widget</b> 說的是「跟父節點的上緣保持 20 像素、跟右緣保持 20 像素」，引擎會替每一種螢幕算出位置。</p>
<p>勾選 Top 和 Right，兩個都設 20，就是 Cocos 版的 <code>top: 20px; right: 20px</code>。同時勾 Left 和 Right，節點就會撐滿父節點的寬度。在有瀏海的手機上，SafeArea 元件可以讓節點避開瀏海。提醒一件事：Align Mode 設成 Always 的 Widget，只要節點或父節點一有變動，就會把節點放回原位，所以會跟任何想移動這個節點的 tween 打架。</p>
<h3>組合起來：一張比大小用的牌</h3>
<div class="tiers"><b>Card</b><div><span class="box hot">Card<small>Sprite（Sliced）、Button、你的腳本</small></span></div><b>子節點</b><div><span class="box">Value<small>Label，大大的數字</small></span><span class="box">Suit<small>Sprite，小小的花色圖示，加上 Widget</small></span></div></div>
<ol>
<li>在 Canvas 底下建一個叫 Card 的節點。加一個 Sprite，設成 Sliced，放進一張已經設好邊界的圓角矩形圖。把節點設成 200 乘 280。</li>
<li>加一個叫 Value 的子節點，掛一個 Label：字級 96、置中、Overflow 設成 Shrink，這樣 10 也塞得下。</li>
<li>加一個叫 Suit 的子節點，掛一個顯示花色圖示的 Sprite，再加一個 Top 和 Left 都設 16 的 Widget，這樣不管牌多大，它都待在角落。</li>
<li>在 Card 上加一個 Button，Transition 設成 Scale，把它的 Click Event 接到你腳本上的一個方法。</li>
<li>把 Card 拖進 Assets 面板，做成預製物件（prefab），遊戲就能需要幾張就建幾張。</li>
</ol>
<h3>深入一點：draw call，以及為什麼圖集對手機很重要</h3>
<p>要把像素畫到螢幕上，引擎會對顯示晶片送出一次<b>繪製呼叫</b>（draw call）：「用這張圖，畫這些形狀」。每一次都有固定的成本，手機最吃不消。幾十次不算什麼；幾百次就可能讓便宜的手機掉影格。</p>
<p>引擎靠<b>批次合併</b>（batching）來省 draw call：在繪製順序上相鄰、用同一張圖和同一個材質的節點，會合成一次呼叫送出去。關鍵在「同一張圖」。二十個圖示放在二十個不同的檔案裡，可能就要花二十次 draw call。把它們打包進一張<b>圖集</b>（texture atlas），也就是一張把二十個全裝在裡面的大圖，它們就可以共用一次。</p>
<div class="flow"><span class="box bad">20 張各自獨立的圖<small>最多 20 次 draw call</small></span><span class="arr">打包 &rarr;</span><span class="box hot">1 張圖集<small>可以只要 1 次 draw call</small></span></div>
<ul>
<li><b>Cocos 會幫你打包圖集。</b>在 Assets 面板裡對一個資料夾按右鍵，選 Create、Auto Atlas。裡面的圖會在建置（build）時才打包，所以 draw call 要在建置出來的版本裡數。</li>
<li><b>順序很重要。</b>節點照樹的順序畫。用系統字型的 Label，是從它自己的一張貼圖畫出來的，所以「牌圖、Label、牌圖、Label」這樣交錯，每一步都會打斷批次合併。</li>
<li><b>每個 Mask 都會多出 draw call。</b>只在真的需要的地方用。</li>
<li><b>盯著數字看。</b>預覽畫面角落的統計面板裡，有一行 Draw Call。</li>
</ul>`,
    tryNote: '打開一個 Cocos Creator 3.8 專案的瀏覽器預覽，開啟開發者工具，把每一行貼進 Console 執行。',
    try: [
      '場景裡的每一個 Label，以及它顯示的文字。',
      '每一個 Sprite，以及它顯示的圖。不同的圖越多，draw call 就可能越多。',
      '所有子節點由 Layout 負責排列的節點。',
      '如果統計面板被藏起來了，就把它打開。找找 Draw Call 那一行。'
    ],
    own: `挑一個你熟悉的畫面，可以是工作上的，也可以是你喜歡的遊戲，只用這一課的七個元件把它重做一次。每一塊面板和每一顆按鈕都用 Sliced 的 Sprite，每一排按鈕都用 Layout，所有該貼在邊緣的東西都用 Widget。然後在兩種形狀差很多的螢幕上預覽（瀏覽器預覽可以選裝置），把跑錯位置的東西修好。最後記下 Draw Call 的數字。`,
    quiz: [
      { q: "一張圓角按鈕圖被拉到三倍寬，轉角看起來被壓扁了。怎麼修？",
        a: ["在上面加一個 Mask", "用 Layout，Resize Mode 設成 Children", "把 Sprite 的 Type 設成 Sliced，並在 Sprite 編輯器裡設好邊界", "把圖片匯出成三倍大"],
        why: "用了九宮格，轉角永遠不會被拉伸，只有邊和中間會。" },
      { q: "為什麼把三十個圖示打包進一張圖集，通常能讓手機遊戲變快？",
        a: ["相鄰、又共用同一張圖的 Sprite，可以用一次 draw call 畫完", "圖集會讓 CPU 跑得更快", "圖集會跳過點擊判定", "手機最多只能載入十個檔案"],
        why: "批次合併需要同一張圖。一張圖集，把很多張圖變成一張。" },
      { q: "你在一個掛了 Layout 的節點底下加了一個子節點，下一行就去讀它的位置，結果還不是 Layout 最後會擺的位置。為什麼？",
        a: ["Layout 不理新的子節點", "那個子節點沒有啟用", "位置永遠是世界座標", "Layout 是在這個影格稍後才更新；呼叫 updateLayout() 可以馬上套用"],
        why: "Layout 是在這個影格稍後才套用變動，而不是在樹一變動的那一刻。" }
    ]
  },
  {
    id: 'cc-tween',
    title: '移動與動畫',
    body: `
<p>螢幕上的移動是一種錯覺。引擎每秒畫大約六十張靜止的畫面；如果每一張裡，牌都比上一張再往右一點點，你的眼睛就會看到它在滑動。做動畫，就是決定每一張畫面裡東西在哪裡。Cocos 給你兩種決定的方法：你可以每個影格自己算，也可以把動作描述一次，交給<b>補間動畫</b>（tween）去算。</p>
<h3>方法一：在 update 裡自己移動，配上 dt</h3>
<pre><code>@property speed = 300;   // pixels per second

update(dt: number) {
    const p = this.node.position;
    this.node.setPosition(p.x + this.speed * dt, p.y, p.z);
}</code></pre>
<p><code>dt</code> 就是<b>影格間隔時間</b>（delta time）：距離上一個影格過了幾秒。影格率（frame rate）是每秒 60 格時，它大約是 0.016；每秒 30 格時，是 0.033。乘上它，速度在每支手機上就會一樣。沒有它的話，「每個影格移動 5 像素」在 120 Hz 的手機上，會跑得比 60 Hz 的快一倍。</p>
<div class="note">在 Cocos Creator 3 裡，<code>node.position</code> 是唯讀的。<code>this.node.position.x += 5</code> 會被 TypeScript 直接拒絕，就算硬寫進去，節點也不會正確移動。一律呼叫 <code>setPosition</code>。</div>
<h3>方法二：tween</h3>
<p>大部分 UI 動作都不是連續的，而是「0.3 秒內從這裡移到那裡，然後停」。要在 update 裡寫這個，你得自己計時、算出走到幾成了、到終點時停下來。tween 全部幫你做好：</p>
<pre><code>import { tween, Vec3 } from 'cc';

tween(this.node)
    .to(0.3, { position: new Vec3(0, 200, 0) })   // move there in 0.3 s
    .start();                                     // nothing happens without start()</code></pre>
<p>把它當成一句話來讀：「對這個節點做補間：花 0.3 秒移到位置 (0, 200, 0)。開始。」每個影格，tween 系統都會算出節點應該在哪，再把它放到那裡。</p>
<table>
<tr><th></th><th>update 配 dt</th><th>Tween</th></tr>
<tr><td>最適合</td><td>由玩家或遊戲驅動的連續動作：被操控的飛船、正在掉落的方塊</td><td>有起點也有終點的固定動作：牌滑進來、按鈕彈一下、面板淡出</td></tr>
<tr><td>你要寫的</td><td>一個影格的規則</td><td>終點在哪、要花多久</td></tr>
<tr><td>什麼時候停</td><td>你的程式說停才停</td><td>到終點自己停</td></tr>
</table>
<h3>把步驟串起來</h3>
<p>每呼叫一次就多一個步驟，步驟會一個接一個執行：</p>
<pre><code>tween(this.node)
    .to(0.2, { scale: new Vec3(1.2, 1.2, 1) })   // grow to 1.2 (to: absolute)
    .by(0.2, { angle: 15 })                      // turn 15 more degrees (by: relative)
    .delay(0.5)                                  // wait half a second
    .call(() =&gt; console.log('done'))             // run any code
    .start();</code></pre>
<table>
<tr><th>步驟</th><th>意思</th></tr>
<tr><td><code>to(time, props)</code></td><td>把屬性改成這些值</td></tr>
<tr><td><code>by(time, props)</code></td><td>從現在的值開始，把屬性改變這麼多</td></tr>
<tr><td><code>delay(time)</code></td><td>等一下</td></tr>
<tr><td><code>call(fn)</code></td><td>執行一個函式，然後繼續</td></tr>
<tr><td><code>set(props)</code></td><td>直接跳到這些值</td></tr>
</table>
<p>tween 可以改任何物件上的數字屬性，不只是節點。Cocos Creator 3 的節點本身沒有透明度，所以要讓節點淡出，就在它上面掛一個 <code>UIOpacity</code> 元件，再對它做 tween：<code>tween(opacity).to(0.3, { opacity: 0 })</code>。</p>
<h3>依序與同時</h3>
<p>串起來的步驟本來就是依序執行。要讓兩件事同時發生，就把每個動作各自寫成一個 tween，交給 <code>parallel</code>。兩個都做完之後，外面那條串接才會繼續往下走。</p>
<pre><code>const slide = tween(card).to(0.4, { position: new Vec3(0, 0, 0) });
const turn = tween(card).to(0.4, { angle: 0 });

tween(card)
    .parallel(slide, turn)            // both at once
    .call(() =&gt; this.reveal())
    .start();</code></pre>
<div class="tiers"><b>依序</b><div><span class="box">滑動 0.4 秒</span><span class="arr">&rarr;</span><span class="box">轉正 0.4 秒</span><span class="arr">&rarr;</span><span class="box hot">翻開<small>在 0.8 秒</small></span></div><b>同時</b><div><span class="box">滑動 0.4 秒<small>同一時間還有</small></span><span class="box">轉正 0.4 秒</span><span class="arr">&rarr;</span><span class="box hot">翻開<small>在 0.4 秒</small></span></div></div>
<p><code>sequence(a, b)</code> 用法一樣，會依序執行裡面的 tween，很適合當成 <code>parallel</code> 裡的其中一份。</p>
<h3>緩動：動作的手感</h3>
<p>沒有緩動的 tween，從頭到尾同一個速度，到終點一下子停住，看起來很機械。<b>緩動</b>（easing）函式會改變整段動作裡每個時刻的速度。把它當成第三個參數傳進去：<code>{ easing: 'quadOut' }</code>。</p>
<p>下表是五個等距的時間點上，動作走到了幾成（0% 是起點，100% 是終點）：</p>
<table>
<tr><th>時間</th><th>linear</th><th>quadIn</th><th>quadOut</th><th>backOut</th></tr>
<tr><td>0%</td><td>0%</td><td>0%</td><td>0%</td><td>0%</td></tr>
<tr><td>25%</td><td>25%</td><td>6%</td><td>44%</td><td>82%</td></tr>
<tr><td>50%</td><td>50%</td><td>25%</td><td>75%</td><td>109%</td></tr>
<tr><td>75%</td><td>75%</td><td>56%</td><td>94%</td><td>106%</td></tr>
<tr><td>100%</td><td>100%</td><td>100%</td><td>100%</td><td>100%</td></tr>
</table>
<p>下面用點畫出同一件事，每一小段相同的時間畫一個點。點擠在一起的地方，節點走得慢；點拉得很開的地方，就走得快。</p>
<pre><code>          0%                                   100%
linear    o....o....o....o....o....o....o....o....o
quadIn    ooo...o...o.....o.....o........o........o
quadOut   o........o........o.....o.....o...o...ooo
backOut   o...................o............o......oo oo   (past the end, then back)</code></pre>
<ul>
<li><b>quadOut</b> 一開始快、最後慢慢停。東西進場時最常用它。</li>
<li><b>quadIn</b> 一開始慢、最後很快。適合東西離場。</li>
<li><b>backOut</b> 會衝過終點再彈回來，像彈簧一樣。適合「彈一下」的效果。</li>
<li>其他名字都照同一套規則，例如 <code>sineInOut</code>、<code>cubicOut</code>、<code>bounceOut</code>、<code>elasticOut</code>。</li>
</ul>
<p><b>跟 Vue 比較。</b>緩動就是 Vue transition 的 CSS 裡的 <code>transition-timing-function</code>。<code>ease-out</code> 跟 <code>quadOut</code> 很接近。</p>
<h3>重複與停止</h3>
<pre><code>// pulse the Deal button for ever
tween(this.dealButton)
    .to(0.5, { scale: new Vec3(1.1, 1.1, 1) })
    .to(0.5, { scale: new Vec3(1, 1, 1) })
    .union()              // join the two steps into one
    .repeatForever()
    .start();

// later: stop every tween on that node
Tween.stopAllByTarget(this.dealButton);</code></pre>
<p><code>repeat(n)</code> 和 <code>repeatForever()</code> 只會重複緊接在它們前面的那一個步驟，所以要先用 <code>union()</code> 把前面的步驟合成一個。要停掉單一個 tween，就把 <code>start()</code> 回傳的東西留著，再對它呼叫 <code>stop()</code>。</p>
<h3>Animation 元件：在編輯器裡做的動畫片段</h3>
<p>tween 是程式。需要用眼睛慢慢調的動作，就用動畫編輯器（Animation editor）。它是一條時間軸，你在上面設定<b>關鍵影格</b>（keyframe）：「第 0 秒節點在這裡，第 0.5 秒在那裡」，可以做位置、縮放、旋轉、顏色，甚至 Sprite 要顯示哪張圖。做出來的成果是一個<b>動畫片段</b>（animation clip）資源。在節點上掛 Animation 元件，把片段加進它的 Clips 清單，再用程式播放：</p>
<pre><code>const anim = this.getComponent(Animation)!;
anim.play('win');                                       // the clip's name
anim.once(Animation.EventType.FINISHED, this.onWinDone, this);</code></pre>
<p>勾選 Play On Load，再選好 Default Clip，節點一出現就會自己播放。你也可以在時間軸上加事件，在指定的時間點呼叫你腳本上的方法，例如在牌落下的那一刻播放音效。</p>
<table>
<tr><th></th><th>Tween</th><th>動畫片段</th></tr>
<tr><td>在哪裡做</td><td>程式</td><td>動畫編輯器</td></tr>
<tr><td>數值</td><td>遊戲執行時才決定：「滑到下一個空位，不管它在哪」</td><td>事先固定好</td></tr>
<tr><td>誰能調整</td><td>程式設計師</td><td>企劃或美術也可以</td></tr>
</table>
<h3>Spine 和 DragonBones：骨骼動畫</h3>
<p>把角色跑步的每一格都畫成獨立的圖，很吃記憶體。<b>骨骼動畫</b>（skeletal animation）只存一份角色，把它切成頭、手臂、腿這些零件，釘在一副由骨頭組成的骨架上，然後只對骨頭做動畫。這樣做出來的動作流暢、檔案小，也容易修改。</p>
<p>Spine 和 DragonBones 是 Cocos 支援的兩套這類工具。美術在工具裡把角色做好、讓它動起來，再匯出幾個檔案：骨架資料、一個圖集和它的圖片。你把它們放進 Assets 面板，再加一個 <code>sp.Skeleton</code> 元件（Spine 用）或 <code>dragonBones.ArmatureDisplay</code> 元件（DragonBones 用）。之後播放動畫只要一行，例如 <code>skeleton.setAnimation(0, 'idle', true)</code>。美術匯出之前，先查清楚你的引擎版本支援哪一版 Spine。版本對不上，是骨架載入失敗的常見原因。</p>
<h3>用縮放 tween 翻牌</h3>
<p>翻牌看起來是 3D，其實是 2D 的小把戲。先把牌的寬度壓到零，趁它側面朝著你的時候把牌背換成牌面，再把它拉回來：</p>
<div class="flow"><span class="box">顯示牌背<small>scale x 1</small></span><span class="arr">0.15 秒 &rarr;</span><span class="box">側面朝前<small>scale x 0</small></span><span class="arr">換面 &rarr;</span><span class="box hot">牌面已經打開<small>還是側面</small></span><span class="arr">0.15 秒 &rarr;</span><span class="box">顯示牌面<small>scale x 1</small></span></div>
<pre><code>flip() {
    if (this.flipping) return;           // ignore taps during a flip
    this.flipping = true;
    Tween.stopAllByTarget(this.node);
    tween(this.node)
        .to(0.15, { scale: new Vec3(0, 1, 1) }, { easing: 'quadIn' })
        .call(() =&gt; this.showFace())     // swap while edge-on
        .to(0.15, { scale: new Vec3(1, 1, 1) }, { easing: 'quadOut' })
        .call(() =&gt; { this.flipping = false; })
        .start();
}</code></pre>
<p>進去的時候用 quadIn、出來的時候用 quadOut，牌在側面朝前時轉得最快，這正是真的牌翻面的樣子。</p>
<h3>深入一點：對一個數字做 tween</h3>
<p>tween 也可以驅動一個普通物件。下面這段會把分數一路數到新的值，<code>onUpdate</code> 在 tween 的每一個影格都會執行：</p>
<pre><code>private counter = { value: 0 };

showScore(score: number) {
    tween(this.counter)
        .to(0.5, { value: score }, {
            onUpdate: () =&gt; { this.label.string = String(Math.round(this.counter.value)); },
        })
        .start();
}</code></pre>
<h3>注意：tween 可能比它的節點活得更久</h3>
<div class="warn">tween 屬於引擎的 tween 系統，不屬於節點。如果節點在 tween 跑到一半時被銷毀，或是場景換掉了，不要指望 tween 會自己發現。對普通物件做的 tween，像上面那個計數器，根本沒有節點可以讓它發現。這時候，任何 <code>call</code> 或 <code>onUpdate</code> 都可能去碰已經不存在的物件，於是你會在看似隨機的時間點收到「Cannot read properties of null」。解法是一個習慣：在 <code>onDestroy</code> 裡把你的 tween 停掉。</div>
<pre><code>onDestroy() {
    Tween.stopAllByTarget(this.node);
    Tween.stopAllByTarget(this.counter);
}</code></pre>`,
    tryNote: '打開一個 Cocos Creator 3.8 專案的瀏覽器預覽，開啟開發者工具，依序把每一行貼進 Console 執行。第一行會挑一個節點給你玩。',
    try: [
      '挑出 Canvas 底下第一個不是攝影機的節點，並顯示它的名字。',
      '讓它在半秒內轉一整圈。',
      '把它壓扁再拉回來：就是翻牌的動作，只是沒有換面。',
      '讓它往上移動 80 像素，最後會衝過頭再回來。把 backOut 換成 linear 再跑一次，比較看看。',
      '讓它一直轉下去。下一行會把它停掉。',
      '停掉這個節點上所有還在跑的 tween。'
    ],
    own: `在你自己的專案裡，找一個在 <code>update</code> 裡用計時器或計數器手寫的動作，例如滑進來的面板。把它改寫成一個加了緩動的 tween，並在 <code>onDestroy</code> 裡加上 <code>Tween.stopAllByTarget</code>。如果找不到，就照這一課做出翻牌，並在牌翻面的時候，把「大」和「小」兩顆按鈕關掉。`,
    quiz: [
      { q: "在 update 裡移動節點時，為什麼要把速度乘上 dt？",
        a: ["這樣 update 會被呼叫得更頻繁", "不乘的話，Cocos 不會呼叫 update", "這樣不管遊戲是每秒 30、60 還是 120 影格，每秒移動的像素都一樣", "為了把像素換算成公尺"],
        why: "dt 是距離上一個影格的時間。速度乘上時間，在每台裝置上每秒走的距離就一樣。" },
      { q: "<code>tween(node).to(0.3, A).to(0.3, B).repeat(3).start()</code> 重複的是什麼？",
        a: ["兩個步驟一起，重複三次", "什麼都不會重複，因為 repeat 必須寫在 start 後面", "整個 tween，永遠重複下去", "只有移到 B 的那一步，因為 repeat 只作用在緊接在它前面的步驟"],
        why: "在 repeat 前面先用 union() 把前面的步驟合成一個，再重複它。" },
      { q: "一局結束、場景換掉了，但一個對普通物件做的分數計數 tween 還在跑。它的 onUpdate 會寫進一個已經被銷毀的 Label。怎麼避免？",
        a: ["在 onDestroy 裡對那個物件呼叫 Tween.stopAllByTarget", "把時間拉長", "改用 linear 緩動", "不用處理：引擎一定會把它停掉"],
        why: "對普通物件做的 tween，不跟任何節點綁在一起。元件要消失時，你得自己把它停掉。" }
    ]
  }
  ]
});
