DEEP({ 'cc-scripts': `
<p>上一課你寫出了第一支元件腳本：用 <code>@ccclass</code> 登記、用 <code>@property</code> 開格子、把節點拖進去、在 <code>onLoad</code> 裡註冊點擊。這一章把這些「照著寫就會動」的東西拆開：一支 .ts 檔從存檔到在玩家手機上跑起來，中間經過哪五個階段；<code>@property</code> 的值在場景檔裡到底長什麼樣；<code>getComponent</code> 和 <code>find</code> 各要花多少力氣；引擎是怎麼排 <code>update</code> 的順序，為什麼「不要依賴順序」不是一句客套話；一支大腳本和一組小元件差在哪；改程式之後編輯器裡什麼會留下來、什麼會歸零；以及在 Cocos 專案裡把 TypeScript 的嚴格模式打開會遇到什麼。你從 Vue 過來，很多觀念都有對應，但底層的機制很不一樣。</p>
<p>這一章的細節都對照過 Cocos Creator 3.8 的引擎原始碼、編輯器產生的編譯結果和實際的場景檔。</p>

<h3><span class="badge lv1">基礎</span>一、從 .ts 檔到節點上的元件：五個階段</h3>
<p>先打個比方。<code>@ccclass</code> 像是到戶政事務所登記戶口：從此引擎知道「有一種東西叫 Card」。<code>@property</code> 像是登記時填的那幾個欄位：姓名、生日、住址。場景檔就是戶籍資料。遊戲開啟時，引擎照著戶籍資料，把每一個人重新「生」出來，把欄位一格一格填回去。</p>
<figure class="figure"><svg viewBox="0 0 700 175" class="fg" style="width:100%;max-width:700px" role="img" aria-label="腳本的五個階段：編譯、登記、掛上節點、存進場景、載入，前兩個在存檔時，中間兩個在編輯器裡，最後一個在遊戲執行時">
<path d="M20 44 V38 H275 V44" class="fg-l dim"/><text x="147" y="30" text-anchor="middle" class="fg-t sm">你按下存檔</text>
<path d="M290 44 V38 H545 V44" class="fg-l dim"/><text x="417" y="30" text-anchor="middle" class="fg-t sm">你在編輯器裡操作</text>
<path d="M560 44 V38 H680 V44" class="fg-l dim"/><text x="620" y="30" text-anchor="middle" class="fg-t sm">遊戲執行時</text>
<rect x="20" y="52" width="120" height="84" rx="7" class="fg-b"/>
<text x="80" y="74" text-anchor="middle" class="fg-t lg">1 編譯</text>
<text x="80" y="96" text-anchor="middle" class="fg-t sm">TS → JS</text><text x="80" y="114" text-anchor="middle" class="fg-t sm">只拿掉型別</text>
<rect x="155" y="52" width="120" height="84" rx="7" class="fg-b"/>
<text x="215" y="74" text-anchor="middle" class="fg-t lg">2 登記</text>
<text x="215" y="96" text-anchor="middle" class="fg-t sm">@property 記欄位</text><text x="215" y="114" text-anchor="middle" class="fg-t sm">@ccclass 登記</text>
<rect x="290" y="52" width="120" height="84" rx="7" class="fg-b alt"/>
<text x="350" y="74" text-anchor="middle" class="fg-t lg">3 掛上節點</text>
<text x="350" y="96" text-anchor="middle" class="fg-t sm">new 一個元件</text><text x="350" y="114" text-anchor="middle" class="fg-t sm">初始值＝預設值</text>
<rect x="425" y="52" width="120" height="84" rx="7" class="fg-b alt"/>
<text x="485" y="74" text-anchor="middle" class="fg-t lg">4 存進場景</text>
<text x="485" y="96" text-anchor="middle" class="fg-t sm">序列化欄位</text><text x="485" y="114" text-anchor="middle" class="fg-t sm">類型記成 uuid</text>
<rect x="560" y="52" width="120" height="84" rx="7" class="fg-b hot"/>
<text x="620" y="74" text-anchor="middle" class="fg-t lg">5 載入</text>
<text x="620" y="96" text-anchor="middle" class="fg-t sm">依 uuid 找 class</text><text x="620" y="114" text-anchor="middle" class="fg-t sm">new、填回存檔值</text>
<line x1="141" y1="94" x2="147" y2="94" class="fg-l"/><polygon points="155,94 147,89.5 147,98.5" class="fg-a"/>
<line x1="276" y1="94" x2="282" y2="94" class="fg-l"/><polygon points="290,94 282,89.5 282,98.5" class="fg-a"/>
<line x1="411" y1="94" x2="417" y2="94" class="fg-l"/><polygon points="425,94 417,89.5 417,98.5" class="fg-a"/>
<line x1="546" y1="94" x2="552" y2="94" class="fg-l"/><polygon points="560,94 552,89.5 552,98.5" class="fg-a"/>
<text x="350" y="162" text-anchor="middle" class="fg-t sm">第 2 步在編輯器和玩家的手機上都會發生：模組一執行，class 就登記</text>
</svg><figcaption>3、4 只發生在編輯器裡；玩家的手機只做 2 和 5。所以「欄位的值從哪裡來」，答案永遠是場景檔，不是你的程式碼。</figcaption></figure>
<ol>
<li><b>編譯</b>：你一存檔，編輯器就把 TypeScript 轉成 JavaScript。去專案的 <code>temp/programming</code> 底下翻，會看到產出的是 SystemJS 格式的模組，裝飾器被轉成 Babel 風格的輔助函式。這一步<b>只拿掉型別、不檢查型別</b>：專案的 <code>temp/tsconfig.cocos.json</code> 裡寫著 <code>noEmit: true</code> 和 <code>isolatedModules: true</code>，意思是 tsconfig 只給編輯器（VS Code）做型別提示用，真正的轉換是另一條路。所以型別錯了，預覽照樣跑得起來。</li>
<li><b>登記</b>：模組一執行，每個 <code>@property</code> 先把自己的欄位記進這個 class 的暫存清單，最後 <code>@ccclass</code> 讀那份清單，把 class 登記進引擎。編譯器還會在每支腳本開頭插一行 <code>_RF.push({}, "14779Z+7RpAx…", "Card")</code>，那串奇怪的字是這支腳本檔 uuid 的壓縮形式，用來把 class 和腳本檔綁在一起。</li>
<li><b>掛上節點</b>：你把腳本拖到節點上，編輯器 <code>new</code> 一個元件。class 欄位的初始值（<code>= 7</code>）就在這時成為它的值。</li>
<li><b>存進場景</b>：存檔時，只有登記過的欄位會被寫進場景檔。這個元件的類型，寫的是那串壓縮過的腳本 uuid，不是 <code>"Card"</code>。</li>
<li><b>載入</b>：遊戲開始，引擎讀到那串 uuid，查到對應的 class，<code>new</code> 一個，把存檔的值一格一格蓋上去，然後才呼叫 <code>onLoad</code>。</li>
</ol>
<div class="note"><b>這解釋了上一課的好幾個規則。</b>為什麼程式裡改 <code>= 7</code> 沒用？因為第 5 步會用存檔值蓋掉它。為什麼不能在 constructor 裡做初始化？因為 constructor 跑在第 5 步「蓋上存檔值」之前，你在那裡讀到的都是還沒填好的預設值。為什麼腳本的 .meta 也不能丟？因為場景靠的是腳本的 uuid：.meta 一丟，腳本拿到新 uuid，場景裡所有這個元件都找不到 class，會變成 Missing Script。</div>

<h3><span class="badge lv1">基礎</span>二、@property 的各種型別，以及它們在場景檔裡的樣子</h3>
<p>屬性（property）的型別，決定了兩件事：屬性檢查器（Inspector）要畫出什麼樣的格子，以及值要怎麼寫進場景檔。</p>
<pre><code>import {
    _decorator, Component, Node, Label, SpriteFrame,
    Color, Enum, CCInteger,
} from 'cc';
const { ccclass, property } = _decorator;

enum Suit { Spade, Heart, Diamond, Club }

@ccclass('Card')
export class Card extends Component {
    @property value = 7;        // number box
    @property title = 'Ace';    // text box
    @property(Node) front: Node | null = null;
    @property(Label) valueLabel: Label | null = null;
    @property([SpriteFrame]) faces: SpriteFrame[] = [];
    @property({ type: Enum(Suit) }) suit = Suit.Spade;
    @property(Color) tint = new Color(255, 255, 255, 255);
    @property({ type: CCInteger, range: [1, 13, 1],
                slide: true })
    rank = 1;

    private flips = 0;          // not shown, not saved
}</code></pre>
<p>存檔之後，這個元件在場景檔裡大概是這樣（省略幾個引擎自己的欄位）：</p>
<pre><code>{
  "__type__": "a1b2cXyZ…",
  "node": { "__id__": 2 },
  "_enabled": true,
  "value": 7,
  "title": "Ace",
  "front": { "__id__": 5 },
  "valueLabel": { "__id__": 12 },
  "faces": [ { "__uuid__": "3f2a9c10-…@f9941" } ],
  "suit": 0,
  "tint": { "__type__": "cc.Color",
            "r": 255, "g": 255, "b": 255, "a": 255 },
  "rank": 1
}</code></pre>
<figure class="figure"><svg viewBox="0 0 680 262" class="fg" style="width:100%;max-width:680px" role="img" aria-label="屬性檢查器裡的四個欄位，各自對應到場景檔 JSON 裡的一行：數字照存，節點變成陣列索引，資源變成 uuid，列舉變成數字">
<text x="130" y="34" text-anchor="middle" class="fg-t lg">屬性檢查器</text>
<text x="525" y="34" text-anchor="middle" class="fg-t lg">場景檔（JSON）</text>
<rect x="10" y="60" width="220" height="28" rx="5" class="fg-b"/><text x="22" y="79" class="fg-t">Value</text><text x="218" y="79" text-anchor="end" class="fg-t mono">7</text>
<rect x="10" y="104" width="220" height="28" rx="5" class="fg-b"/><text x="22" y="123" class="fg-t">Front</text><text x="218" y="123" text-anchor="end" class="fg-t">[Front 節點]</text>
<rect x="10" y="148" width="220" height="28" rx="5" class="fg-b"/><text x="22" y="167" class="fg-t">Faces</text><text x="218" y="167" text-anchor="end" class="fg-t">2 項</text>
<rect x="10" y="192" width="220" height="28" rx="5" class="fg-b"/><text x="22" y="211" class="fg-t">Suit</text><text x="218" y="211" text-anchor="end" class="fg-t">Spade ▾</text>
<rect x="380" y="60" width="290" height="28" rx="5" class="fg-b alt"/><text x="392" y="79" class="fg-t sm mono">"value": 7</text>
<rect x="380" y="104" width="290" height="28" rx="5" class="fg-b alt"/><text x="392" y="123" class="fg-t sm mono">"front": { "__id__": 5 }</text>
<rect x="380" y="148" width="290" height="28" rx="5" class="fg-b alt"/><text x="392" y="167" class="fg-t sm mono">"faces": [{ "__uuid__": "…@f9941" }]</text>
<rect x="380" y="192" width="290" height="28" rx="5" class="fg-b warm"/><text x="392" y="211" class="fg-t sm mono">"suit": 0</text>
<line x1="232" y1="79" x2="372" y2="79" class="fg-l"/><polygon points="380,79 372,74.5 372,83.5" class="fg-a"/><text x="305" y="70" text-anchor="middle" class="fg-t sm">數字照存</text>
<line x1="232" y1="123" x2="372" y2="123" class="fg-l"/><polygon points="380,123 372,118.5 372,127.5" class="fg-a"/><text x="305" y="114" text-anchor="middle" class="fg-t sm">節點→陣列索引</text>
<line x1="232" y1="167" x2="372" y2="167" class="fg-l"/><polygon points="380,167 372,162.5 372,171.5" class="fg-a"/><text x="305" y="158" text-anchor="middle" class="fg-t sm">資源→uuid</text>
<line x1="232" y1="211" x2="372" y2="211" class="fg-l warm"/><polygon points="380,211 372,206.5 372,215.5" class="fg-a warm"/><text x="305" y="202" text-anchor="middle" class="fg-t sm warm">列舉→數字</text>
<text x="340" y="248" text-anchor="middle" class="fg-t sm">沒有 @property 的 private flips：屬性檢查器看不到，場景檔裡也沒有</text>
</svg><figcaption>同一個檔案裡的節點和元件用 __id__（陣列索引）指，別的資源用 __uuid__ 指。列舉只存數字，這一點最容易出事。</figcaption></figure>
<p>從這份 JSON 可以直接讀出三個實務上的坑：</p>
<ul>
<li><b>列舉存的是數字。</b><code>Suit.Spade</code> 存成 0。哪天有人把 enum 改成 <code>{ Heart, Spade, Diamond, Club }</code>，所有已經存好的 0 都默默變成 Heart，沒有任何錯誤訊息。新的成員只能加在最後面，或者每個成員都明寫數值。</li>
<li><b>欄位改名，資料就讀不到了。</b>場景檔是用欄位名稱當 key 的。把 <code>value</code> 改名成 <code>rankValue</code>，引擎找不到 <code>rankValue</code> 這個 key，就用初始值，而且下次存檔時 <code>value</code> 那筆資料就被丟掉。要改名，就加上 <code>@formerlySerializedAs('value')</code>，讓它先去讀舊名字。</li>
<li><b>private 欄位不會存。</b>沒有 <code>@property</code> 的欄位不在清單上，每次都從程式碼裡的初始值開始。這正好是你要的：執行時的狀態（翻了幾次、現在是不是正面）本來就不該存進場景。</li>
</ul>
<h4>「顯示」和「儲存」是兩回事</h4>
<table>
<tr><th>寫法</th><th>屬性檢查器裡看得到</th><th>存進場景檔</th></tr>
<tr><td><code>@property</code></td><td>是</td><td>是</td></tr>
<tr><td><code>@property</code>，名字以底線開頭（<code>_speed</code>）</td><td>否（預設隱藏）</td><td>是</td></tr>
<tr><td><code>@property</code> 加在 getter／setter 上</td><td>是</td><td>否</td></tr>
<tr><td><code>@property({ serializable: false })</code></td><td>是</td><td>否</td></tr>
<tr><td><code>@property({ visible: false })</code></td><td>否</td><td>是</td></tr>
<tr><td>不加任何裝飾器</td><td>否</td><td>否</td></tr>
</table>
<p>最常見的組合是：一個以底線開頭、真正存資料的欄位，加上一個給屬性檢查器用的 getter／setter。這樣在編輯器裡改值時，setter 會被呼叫，你可以在裡面做檢查或即時更新畫面：</p>
<pre><code>// saved, hidden (starts with _)
@property
private _speed = 300;

// shown in the Inspector, not saved
@property
get speed() { return this._speed; }
set speed(v: number) {
    this._speed = Math.max(0, v);   // runs on every edit
}</code></pre>

<h3><span class="badge lv2">進階</span>三、找東西的成本：getComponent、find 和快取</h3>
<p>上一課說「找一次、存起來」。這裡用 3.8 的實作，看清楚每一種查找到底做了什麼：</p>
<table>
<tr><th>呼叫</th><th>3.8 裡怎麼做</th><th>要走幾步</th></tr>
<tr><td><code>getComponent(Sprite)</code></td><td>把這個節點的元件陣列從頭走一遍，用 <code>instanceof</code> 比對</td><td>節點上的元件數，通常 2 到 6 個</td></tr>
<tr><td><code>getComponent('Card')</code></td><td>先用名字查 class 登記表，再同上</td><td>多一次字典查詢</td></tr>
<tr><td><code>getChildByName('Face')</code></td><td>把直屬子節點走一遍，比名字</td><td>子節點數</td></tr>
<tr><td><code>find('Canvas/Board/Deck')</code></td><td>從場景根開始，把路徑用 <code>/</code> 切開，每一層在子節點裡找第一個同名的</td><td>路徑上每一層的兄弟數加總，外加一個新陣列</td></tr>
<tr><td><code>getComponentInChildren(X)</code></td><td>走遍整棵子樹</td><td>子樹裡的節點數</td></tr>
</table>
<figure class="figure"><svg viewBox="0 0 660 262" class="fg" style="width:100%;max-width:660px" role="img" aria-label="場景樹上 find 走的路徑：第一層比對一次找到 Canvas，第二層比對兩次找到 Board，第三層比對一次找到 Deck，共比對四次名字">
<rect x="282" y="16" width="96" height="30" rx="6" class="fg-b"/><text x="330" y="36" text-anchor="middle" class="fg-t">Scene</text>
<rect x="122" y="76" width="96" height="30" rx="6" class="fg-b hot"/><text x="170" y="96" text-anchor="middle" class="fg-t acc">Canvas</text>
<rect x="282" y="76" width="96" height="30" rx="6" class="fg-b"/><text x="330" y="96" text-anchor="middle" class="fg-t">Main Camera</text>
<rect x="442" y="76" width="96" height="30" rx="6" class="fg-b"/><text x="490" y="96" text-anchor="middle" class="fg-t">Audio</text>
<rect x="12" y="136" width="96" height="30" rx="6" class="fg-b warm"/><text x="60" y="156" text-anchor="middle" class="fg-t">Bg</text>
<rect x="122" y="136" width="96" height="30" rx="6" class="fg-b hot"/><text x="170" y="156" text-anchor="middle" class="fg-t acc">Board</text>
<rect x="232" y="136" width="96" height="30" rx="6" class="fg-b"/><text x="280" y="156" text-anchor="middle" class="fg-t">Hud</text>
<rect x="342" y="136" width="96" height="30" rx="6" class="fg-b"/><text x="390" y="156" text-anchor="middle" class="fg-t">Popup</text>
<rect x="72" y="196" width="96" height="30" rx="6" class="fg-b hot"/><text x="120" y="216" text-anchor="middle" class="fg-t acc">Deck</text>
<rect x="182" y="196" width="96" height="30" rx="6" class="fg-b"/><text x="230" y="216" text-anchor="middle" class="fg-t">Hand</text>
<rect x="292" y="196" width="96" height="30" rx="6" class="fg-b"/><text x="340" y="216" text-anchor="middle" class="fg-t">Pile</text>
<line x1="330" y1="46" x2="170" y2="76" class="fg-l on"/><line x1="330" y1="46" x2="330" y2="76" class="fg-l dim"/><line x1="330" y1="46" x2="490" y2="76" class="fg-l dim"/>
<line x1="170" y1="106" x2="60" y2="136" class="fg-l dim"/><line x1="170" y1="106" x2="170" y2="136" class="fg-l on"/><line x1="170" y1="106" x2="280" y2="136" class="fg-l dim"/><line x1="170" y1="106" x2="390" y2="136" class="fg-l dim"/>
<line x1="170" y1="166" x2="120" y2="196" class="fg-l on"/><line x1="170" y1="166" x2="230" y2="196" class="fg-l dim"/><line x1="170" y1="166" x2="340" y2="196" class="fg-l dim"/>
<rect x="460" y="130" width="190" height="122" rx="7" class="fg-b"/>
<text x="472" y="152" class="fg-t sm mono acc">find('Canvas/Board/Deck')</text>
<text x="472" y="174" class="fg-t sm">1. 切成 3 段（新陣列）</text>
<text x="472" y="194" class="fg-t sm">2. 第一層比 1 次：Canvas</text>
<text x="472" y="214" class="fg-t sm">3. 第二層比 2 次：Bg、Board</text>
<text x="472" y="234" class="fg-t sm">4. 第三層比 1 次：Deck</text>
</svg><figcaption>綠色是找到的那條路，橘色是比過但不對的。這一次只比了 4 次名字，很便宜；問題在於你在 update 裡每一格、每一張牌都這樣做。</figcaption></figure>
<p>單次都很便宜，所以重點不是「find 很慢」，而是<b>乘法</b>：200 張牌在 <code>update</code> 裡各 <code>find</code> 一次，每秒 60 格，就是每秒 12,000 次路徑搜尋，外加 12,000 個切字串產生的陣列等著垃圾回收。快取起來，這些全部變成 0。另外三件比效能更重要的事：</p>
<ul>
<li><b>同名節點只會找到第一個。</b><code>find</code> 和 <code>getChildByName</code> 在每一層都是「找到第一個同名的就停」。兩個兄弟都叫 Card，你永遠拿到前面那個，不會有任何警告。</li>
<li><b>getComponent 會比對到子類別。</b>它用的是 <code>instanceof</code>，所以你可以寫一個抽象的基底類別 <code>Damageable</code>，用 <code>getComponent(Damageable)</code> 拿到任何一種會受傷的元件。但 TypeScript 的 interface 不行：interface 在編譯後就不存在了，執行時沒有東西可以比。</li>
<li><b>快取的參照會過期。</b>你存起來的節點，可能在別處被 <code>destroy()</code> 了。物件還在你的欄位裡，但已經不能用。長期持有別人的參照時，用之前先檢查 <code>isValid(node)</code>。</li>
</ul>
<pre><code>import {
    _decorator, Component, Label, find, isValid,
} from 'cc';
import { Deck } from './Deck';
const { ccclass, property } = _decorator;

@ccclass('Hud')
export class Hud extends Component {
    // best: drag it into the slot
    @property(Label) score: Label | null = null;
    private deck: Deck | null = null;

    onLoad() {
        // only for things you cannot drag: look it up once
        const n = find('Canvas/Board/Deck');
        this.deck = n ? n.getComponent(Deck) : null;
    }

    update(dt: number) {
        if (this.deck &amp;&amp; isValid(this.deck.node)) {
            // use the cached field; never search here
        }
    }
}</code></pre>

<h3><span class="badge lv2">進階</span>四、執行順序：引擎裡其實是三個桶子</h3>
<p>上一課說「不同節點之間的順序不要去依賴，真的需要就用 <code>@executionOrder</code>」。看了 3.8 的元件排程器（component scheduler）你就會知道為什麼。</p>
<h4>啟用一棵樹：先全部 onLoad，再全部 onEnable</h4>
<p>當一棵節點樹被啟用（場景載入、把實例化的 Prefab <code>addChild</code> 上去、或把 <code>active</code> 設成 true），引擎先把整棵樹走一遍，順序是先處理節點自己的元件，再往下處理子節點。走完之後，<b>先把收集到的所有 onLoad 跑完，再跑所有的 onEnable</b>。所以就算 A 元件排在 B 前面，A 的 onEnable 也一定在 B 的 onLoad 之後。<code>start</code> 則是在每個元件第一次 update 之前才呼叫。</p>
<h4>update 的三個桶子</h4>
<p>每個元件依它的 executionOrder 被放進三個桶子之一：負數一桶、0 一桶、正數一桶。每一格先跑負數桶（照數字排序），再跑 0 桶，最後跑正數桶（照數字排序）。關鍵在 0 這一桶：它<b>不排序</b>，照加入的順序跑；而且移除元件時，為了快，引擎用的是「把最後一個搬過來補洞」的作法。</p>
<figure class="figure"><svg viewBox="0 0 680 245" class="fg" style="width:100%;max-width:680px" role="img" aria-label="update 的三個桶子：負數、0、正數。0 號桶裡 A B C D E，停用 B 之後最後的 E 搬到 B 的位置，再啟用 B 時 B 排到最後">
<text x="165" y="42" text-anchor="middle" class="fg-t sm">負數：排序</text>
<text x="388" y="42" text-anchor="middle" class="fg-t sm">0：照加入順序</text>
<text x="590" y="42" text-anchor="middle" class="fg-t sm">正數：排序</text>
<rect x="100" y="50" width="130" height="44" rx="7" class="fg-l dash"/>
<rect x="250" y="50" width="276" height="44" rx="7" class="fg-l dash"/>
<rect x="545" y="50" width="90" height="44" rx="7" class="fg-l dash"/>
<text x="10" y="77" class="fg-t">原本</text>
<rect x="106" y="58" width="56" height="28" rx="5" class="fg-b alt"/><text x="134" y="77" text-anchor="middle" class="fg-t sm">輸入 −10</text>
<rect x="168" y="58" width="56" height="28" rx="5" class="fg-b alt"/><text x="196" y="77" text-anchor="middle" class="fg-t sm">規則 −1</text>
<rect x="256" y="58" width="44" height="28" rx="5" class="fg-b"/><text x="278" y="77" text-anchor="middle" class="fg-t">A</text>
<rect x="308" y="58" width="44" height="28" rx="5" class="fg-b"/><text x="330" y="77" text-anchor="middle" class="fg-t">B</text>
<rect x="360" y="58" width="44" height="28" rx="5" class="fg-b"/><text x="382" y="77" text-anchor="middle" class="fg-t">C</text>
<rect x="412" y="58" width="44" height="28" rx="5" class="fg-b"/><text x="434" y="77" text-anchor="middle" class="fg-t">D</text>
<rect x="464" y="58" width="44" height="28" rx="5" class="fg-b"/><text x="486" y="77" text-anchor="middle" class="fg-t">E</text>
<rect x="551" y="58" width="78" height="28" rx="5" class="fg-b alt"/><text x="590" y="77" text-anchor="middle" class="fg-t sm">特效 +5</text>
<line x1="20" y1="110" x2="650" y2="110" class="fg-l dim"/><polygon points="658,110 650,105.5 650,114.5" class="fg-a"/>
<text x="20" y="126" class="fg-t sm">每一格由左到右呼叫 update</text>
<text x="10" y="167" class="fg-t">停用 B</text>
<rect x="256" y="148" width="44" height="28" rx="5" class="fg-b"/><text x="278" y="167" text-anchor="middle" class="fg-t">A</text>
<rect x="308" y="148" width="44" height="28" rx="5" class="fg-b warm"/><text x="330" y="167" text-anchor="middle" class="fg-t warm">E</text>
<rect x="360" y="148" width="44" height="28" rx="5" class="fg-b"/><text x="382" y="167" text-anchor="middle" class="fg-t">C</text>
<rect x="412" y="148" width="44" height="28" rx="5" class="fg-b"/><text x="434" y="167" text-anchor="middle" class="fg-t">D</text>
<text x="520" y="167" class="fg-t sm warm">E 被搬去補 B 的洞</text>
<text x="10" y="217" class="fg-t">再啟用 B</text>
<rect x="256" y="198" width="44" height="28" rx="5" class="fg-b"/><text x="278" y="217" text-anchor="middle" class="fg-t">A</text>
<rect x="308" y="198" width="44" height="28" rx="5" class="fg-b warm"/><text x="330" y="217" text-anchor="middle" class="fg-t warm">E</text>
<rect x="360" y="198" width="44" height="28" rx="5" class="fg-b"/><text x="382" y="217" text-anchor="middle" class="fg-t">C</text>
<rect x="412" y="198" width="44" height="28" rx="5" class="fg-b"/><text x="434" y="217" text-anchor="middle" class="fg-t">D</text>
<rect x="464" y="198" width="44" height="28" rx="5" class="fg-b hot"/><text x="486" y="217" text-anchor="middle" class="fg-t acc">B</text>
<text x="520" y="217" class="fg-t sm acc">B 排到最後</text>
</svg><figcaption>沒做任何事，只是停用再啟用一個元件，0 號桶的順序就從 A B C D E 變成 A E C D B。E 現在跑在 C 前面了。</figcaption></figure>
<p>這就是「不要依賴順序」的真正原因：0 號桶的順序在場景剛載入時是樹的順序，但只要遊戲中有元件被停用、銷毀、重新啟用，順序就會被打散，而且每一局打散的方式都不一樣。今天測試時剛好是 C 先跑、明天上線後變成 E 先跑，這種 bug 最難重現。</p>
<h4>職業做法：一個總管，明確地叫大家</h4>
<p><code>@executionOrder</code> 適合少數真正需要「最先」或「最後」的東西，例如每一格最先收集輸入的元件。但如果你的遊戲邏輯有一串明確的先後，最穩的做法是不要讓每個系統各自實作 <code>update</code>，而是由一個總管元件在自己的 <code>update</code> 裡依序呼叫它們：</p>
<pre><code>@ccclass('GameLoop')
export class GameLoop extends Component {
    @property(InputSystem) input: InputSystem | null = null;
    @property(RuleSystem) rules: RuleSystem | null = null;
    @property(ViewSystem) view: ViewSystem | null = null;

    update(dt: number) {
        // the order is written here
        this.input?.tick(dt);
        this.rules?.tick(dt);
        this.view?.tick(dt);
    }
}</code></pre>
<p>各系統把邏輯寫在 <code>tick</code> 而不是 <code>update</code>。順序寫在程式碼裡，看得到、改得到，也可以在測試裡單獨呼叫某一個系統的 <code>tick</code>。</p>

<h3><span class="badge lv3">專業</span>五、元件化架構，和一支大腳本差在哪</h3>
<p>剛開始寫遊戲，最自然的寫法是一支 <code>Game.ts</code> 什麼都管：牌堆、比大小的規則、按鈕事件、翻牌動畫、分數、音效、存檔。前三百行很順，到九百行時，每改一個地方都會弄壞另一個地方，兩個人同時改一定衝突，而且規則沒辦法單獨測試，因為它跟畫面纏在一起。</p>
<figure class="figure"><svg viewBox="0 0 680 262" class="fg" style="width:100%;max-width:680px" role="img" aria-label="左邊是一支什麼都管的 Game.ts；右邊拆成 GameController 總管、純 TypeScript 的 HiLoGame 規則，以及 CardView、HudView、SoundPlayer 三個畫面元件。往下是方法呼叫，往上是事件">
<text x="130" y="24" text-anchor="middle" class="fg-t">一支大腳本</text>
<text x="380" y="24" text-anchor="middle" class="fg-t">拆成元件</text>
<rect x="10" y="38" width="240" height="210" rx="8" class="fg-b warm"/>
<text x="130" y="64" text-anchor="middle" class="fg-t lg">Game.ts（900 行）</text>
<text x="30" y="96" class="fg-t sm">牌堆和比大小的規則</text>
<text x="30" y="120" class="fg-t sm">按鈕事件</text>
<text x="30" y="144" class="fg-t sm">翻牌動畫</text>
<text x="30" y="168" class="fg-t sm">分數和連勝顯示</text>
<text x="30" y="192" class="fg-t sm">音效</text>
<text x="30" y="216" class="fg-t sm">存檔和網路</text>
<line x1="258" y1="140" x2="284" y2="140" class="fg-l"/><polygon points="292,140 284,135.5 284,144.5" class="fg-a"/>
<rect x="300" y="40" width="160" height="40" rx="7" class="fg-b hot"/><text x="380" y="65" text-anchor="middle" class="fg-t acc">GameController</text>
<rect x="520" y="40" width="150" height="40" rx="7" class="fg-b alt"/><text x="595" y="58" text-anchor="middle" class="fg-t">HiLoGame</text><text x="595" y="74" text-anchor="middle" class="fg-t sm">純 TS，不 import cc</text>
<line x1="460" y1="60" x2="512" y2="60" class="fg-l"/><polygon points="520,60 512,55.5 512,64.5" class="fg-a"/>
<text x="488" y="34" text-anchor="middle" class="fg-t sm mono">guess()</text>
<path d="M380 80 V120 H595" class="fg-l"/><line x1="370" y1="120" x2="380" y2="120" class="fg-l"/>
<line x1="370" y1="120" x2="370" y2="152" class="fg-l"/><polygon points="370,160 365.5,152 374.5,152" class="fg-a"/>
<line x1="470" y1="120" x2="470" y2="152" class="fg-l"/><polygon points="470,160 465.5,152 474.5,152" class="fg-a"/>
<line x1="595" y1="120" x2="595" y2="152" class="fg-l"/><polygon points="595,160 590.5,152 599.5,152" class="fg-a"/>
<text x="530" y="112" text-anchor="middle" class="fg-t sm">方法呼叫（往下）</text>
<line x1="318" y1="160" x2="318" y2="88" class="fg-l alt dash"/><polygon points="318,80 313.5,88 322.5,88" class="fg-a alt"/>
<text x="326" y="146" class="fg-t sm alt">事件</text>
<rect x="300" y="160" width="100" height="40" rx="7" class="fg-b"/><text x="350" y="185" text-anchor="middle" class="fg-t">CardView</text>
<rect x="420" y="160" width="100" height="40" rx="7" class="fg-b"/><text x="470" y="185" text-anchor="middle" class="fg-t">HudView</text>
<rect x="540" y="160" width="110" height="40" rx="7" class="fg-b"/><text x="595" y="185" text-anchor="middle" class="fg-t">SoundPlayer</text>
<text x="475" y="236" text-anchor="middle" class="fg-t sm">往下直接呼叫；往上發事件；兄弟之間互不認識</text>
</svg><figcaption>拆開之後，每個檔案只有一個「會被改的理由」：規則改了只動 HiLoGame，畫面改了只動 View。規則那一塊不碰引擎，可以直接用 Vitest 或 Jest 測。</figcaption></figure>
<p>以猜高低為例，規則寫成一個完全不碰 Cocos 的類別：</p>
<pre><code>// HiLoGame.ts: no import from 'cc'
export type Guess = 'higher' | 'lower';

export class HiLoGame {
    score = 0;
    current: number;

    constructor(private deck: number[]) {
        this.current = deck.pop()!;
    }

    guess(g: Guess): { next: number; win: boolean } {
        const next = this.deck.pop()!;
        // a tie counts as a loss
        const win = g === 'higher' ? next &gt; this.current
                                   : next &lt; this.current;
        if (win) this.score += 1;
        this.current = next;
        return { next, win };
    }
}</code></pre>
<p>總管元件只負責「接線」：按鈕的事件進來，呼叫規則，把結果交給畫面。</p>
<pre><code>@ccclass('GameController')
export class GameController extends Component {
    @property(CardView) card: CardView | null = null;
    @property(HudView) hud: HudView | null = null;
    private game!: HiLoGame;

    onLoad() {
        this.game = new HiLoGame(makeShuffledDeck());
    }

    // both are bound to Buttons in the Inspector
    onHigher() { this.play('higher'); }
    onLower() { this.play('lower'); }

    private play(g: Guess) {
        const r = this.game.guess(g);
        this.card?.show(r.next);
        this.hud?.setScore(this.game.score);
    }
}</code></pre>
<p>三條溝通規則：<b>往下用方法呼叫</b>（總管透過 <code>@property</code> 拿到畫面元件，直接叫它的方法）；<b>往上用事件</b>（CardView 被點了，用 <code>this.node.emit('picked')</code> 或一個共用的 <code>EventTarget</code> 通知，它不需要知道誰在聽）；<b>兄弟之間不直接互叫</b>，都經過總管。跟 Vue 對照：HiLoGame 就像一個 Pinia store 或 composable，View 元件像只負責顯示的子元件，往下傳 props、往上 emit 事件，觀念完全一樣。</p>
<p>拆過頭也是一種病。每個小功能都拆一個元件、全部用事件串起來，最後你會看不出「按下按鈕之後到底發生了什麼」。實用的判斷標準是：<b>一個元件只有一個會被改的理由</b>。另外，元件之間的依賴可以寫成裝飾器：<code>@requireComponent(Sprite)</code> 會在加這個腳本時自動補上 Sprite，<code>@disallowMultiple</code> 防止同一個節點掛兩個。讀 3.8 原始碼還會發現，<code>@menu</code>、<code>@executeInEditMode</code>、<code>@disallowMultiple</code>、<code>tooltip</code> 這類只給編輯器看的裝飾器，在正式建置裡會變成什麼都不做的空函式，不佔執行成本；<code>@executionOrder</code> 和 <code>@requireComponent</code> 則會保留。</p>

<h3><span class="badge lv3">專業</span>六、改了程式之後：編輯器裡什麼會留下來</h3>
<p>你在 VS Code 裡改了 Card.ts、按下存檔，編輯器會重新編譯，用新的程式重新建立場景裡的元件，再用序列化過的資料把它們還原。記住一句話就夠了：<b>只有序列化過的東西會活下來</b>。</p>
<figure class="figure"><svg viewBox="0 0 640 230" class="fg" style="width:100%;max-width:640px" role="img" aria-label="重新載入腳本前後的 Card 元件：存進場景的 value、front、faces 保留下來；程式執行中改的 faceUp、flips 和註冊的監聽都回到初始狀態">
<text x="140" y="26" text-anchor="middle" class="fg-t lg">重新載入前</text>
<text x="500" y="26" text-anchor="middle" class="fg-t lg">重新載入後</text>
<rect x="20" y="44" width="240" height="26" rx="5" class="fg-b hot"/><text x="32" y="62" class="fg-t sm">value = 9（屬性檢查器改的）</text>
<rect x="20" y="78" width="240" height="26" rx="5" class="fg-b hot"/><text x="32" y="96" class="fg-t sm">front → Front 節點</text>
<rect x="20" y="112" width="240" height="26" rx="5" class="fg-b hot"/><text x="32" y="130" class="fg-t sm">faces：2 張圖</text>
<rect x="20" y="146" width="240" height="26" rx="5" class="fg-b warm"/><text x="32" y="164" class="fg-t sm">faceUp = true（程式改的）</text>
<rect x="20" y="180" width="240" height="26" rx="5" class="fg-b warm"/><text x="32" y="198" class="fg-t sm">flips = 3、已註冊的監聽</text>
<rect x="380" y="44" width="240" height="26" rx="5" class="fg-b hot"/><text x="392" y="62" class="fg-t sm">value = 9 ✓</text>
<rect x="380" y="78" width="240" height="26" rx="5" class="fg-b hot"/><text x="392" y="96" class="fg-t sm">front → Front 節點 ✓</text>
<rect x="380" y="112" width="240" height="26" rx="5" class="fg-b hot"/><text x="392" y="130" class="fg-t sm">faces：2 張圖 ✓</text>
<rect x="380" y="146" width="240" height="26" rx="5" class="fg-b"/><text x="392" y="164" class="fg-t sm">faceUp = false（回到初始值）</text>
<rect x="380" y="180" width="240" height="26" rx="5" class="fg-b"/><text x="392" y="198" class="fg-t sm">flips = 0、監聽要靠 onLoad 重新註冊</text>
<line x1="270" y1="125" x2="362" y2="125" class="fg-l on"/><polygon points="370,125 362,120.5 362,129.5" class="fg-a on"/>
<text x="320" y="113" text-anchor="middle" class="fg-t sm acc">存檔、重編</text>
<text x="320" y="145" text-anchor="middle" class="fg-t sm">從序列化還原</text>
</svg><figcaption>綠色的是存在場景裡的，跨過重新載入還在；橘色的是只活在記憶體裡的，重新載入之後回到程式碼裡的初始值。</figcaption></figure>
<table>
<tr><th>你在程式裡改了什麼</th><th>場景裡已經存好的資料會怎樣</th></tr>
<tr><td>只改方法的內容</td><td>完全不受影響</td></tr>
<tr><td>新增一個 <code>@property</code> 欄位</td><td>已經掛好的元件拿到程式裡的初始值</td></tr>
<tr><td>改 <code>@property</code> 的初始值</td><td>已經存好的值不變（上一課的那個坑）</td></tr>
<tr><td>把欄位改名</td><td>讀不到舊名字的值；下次存檔，舊資料就被丟掉。要保留就加 <code>@formerlySerializedAs</code></td></tr>
<tr><td>刪掉一個 <code>@property</code></td><td>下次存檔時，那筆資料被丟掉</td></tr>
<tr><td>重新排列 enum 的成員</td><td>存的是數字，意思默默改變</td></tr>
<tr><td>腳本被刪掉，或腳本的 .meta 弄丟（uuid 對不上）</td><td>元件變成 Missing Script；它會把原本序列化的資料原封不動保管著，等找回對應的腳本再還回去。這時千萬不要手動把它移除</td></tr>
</table>
<p><b>瀏覽器預覽是另一回事。</b>預覽頁面不會把新程式「換進」正在跑的遊戲，而是整頁重新載入；專案設定的預覽頁裡有一個「允許自動重新整理」（Allow auto refresh）的選項，控制存檔後要不要自動重整。重整就等於重新開遊戲，玩到一半的狀態全部消失。如果你常常要測第十關，就替自己做一個開發用的捷徑，例如讀網址參數直接跳到某一關，省下每次重玩的時間。</p>

<h3><span class="badge lv3">專業</span>七、在 Cocos 專案裡打開 TypeScript 嚴格模式</h3>
<p>3.8 新建專案的 <code>tsconfig.json</code> 長這樣：</p>
<pre><code>{
  /* Base configuration. Do not edit this field. */
  "extends": "./temp/tsconfig.cocos.json",

  /* Add your custom configuration here. */
  "compilerOptions": {
    "strict": false
  }
}</code></pre>
<p>它繼承的 <code>temp/tsconfig.cocos.json</code> 是編輯器產生的，裡面其實是 <code>"strict": true</code>，再加上 <code>experimentalDecorators: true</code>、<code>isolatedModules: true</code>、<code>noEmit: true</code>、<code>target: "ES2015"</code>。新專案在自己這層把 strict 關掉了，對新手比較友善。對一個要長期維護、多人合作的專案，建議把它打開，因為上一課那一整類「Cannot read properties of null」的錯，strict 會在你寫程式時就標出來。</p>
<p>打開之後，你會遇到這幾種錯誤，各有標準解法：</p>
<ul>
<li><b>欄位沒有初始化</b>（TS2564）：<code>@property(Label) label: Label;</code> 會報錯，因為 TypeScript 看不到「引擎會在載入時填它」。兩條路：寫成 <code>Label | null = null</code>，誠實地承認它可能是空的；或寫 <code>= null!</code>，告訴編譯器「相信我」。後者寫起來輕鬆，但格子忘了拖，錯誤就會延到執行時才爆，而且爆在離原因很遠的地方。</li>
<li><b>可能是 null</b>：<code>getComponent</code> 回傳 <code>T | null</code>，<code>find</code> 回傳 <code>Node | null</code>，嚴格模式下不檢查就不能用。</li>
<li><b>需要 override</b>：如果你另外打開 <code>noImplicitOverride</code>，因為 3.8 的 Component 型別宣告裡有 <code>protected onLoad?(): void</code> 這類宣告，你的 <code>onLoad</code> 就算是覆寫，要寫成 <code>protected override onLoad()</code>。</li>
<li><b>只匯出型別</b>：<code>isolatedModules</code> 代表每個檔案單獨轉換，轉換器看不到別的檔案，不知道你 re-export 的名字是不是型別。只有型別的匯出、匯入要寫成 <code>export type</code>、<code>import type</code>。</li>
</ul>
<p>我推薦的寫法是：格子誠實地寫成 <code>| null</code>，在 <code>onLoad</code> 裡一次檢查完，檢查不過就丟出一個寫清楚是哪一格的錯誤，之後用不會是 null 的私有欄位：</p>
<pre><code>export function required&lt;T&gt;(
    v: T | null | undefined, name: string,
): T {
    if (v == null) throw new Error('Missing slot: ' + name);
    return v;
}

@ccclass('Hud')
export class Hud extends Component {
    @property(Label) scoreLabel: Label | null = null;
    private score!: Label;

    protected override onLoad() {
        this.score = required(
            this.scoreLabel, 'scoreLabel');
    }

    setScore(n: number) {
        this.score.string = String(n);   // no null check
    }
}</code></pre>
<p>格子忘了拖，遊戲一啟動就在主控台告訴你「Missing slot: scoreLabel」，而不是在玩家按下某個按鈕之後才莫名其妙地壞掉。</p>
<h4>型別檢查要自己跑</h4>
<p>前面說過，編輯器的編譯只拿掉型別、不檢查。所以嚴格模式只有在兩個地方生效：你的編輯器（VS Code 的紅線），和你自己跑的 <code>tsc</code>。把 TypeScript 裝成開發相依套件，加一個指令 <code>npx tsc --noEmit -p .</code>，放進 git hook 或 CI。要注意一個細節：<code>temp/declarations/cc.d.ts</code> 裡引用的是你這台電腦上 Creator 的安裝路徑，所以 CI 機器上如果沒有裝同版本的 Creator，引擎的型別會找不到，要另外處理（例如在 CI 上裝好 Creator，或把宣告檔準備好）。<code>experimentalDecorators</code> 則千萬不要關：3.8 的裝飾器是照 TypeScript 舊式裝飾器的規格寫的，跟 TypeScript 5 的標準裝飾器簽名不同。</p>

<h3><span class="badge lv4">專家</span>八、裝飾器的內部：暫存清單、屬性表和兩張登記表</h3>
<p>上一課說 <code>@ccclass</code> 把 class 登記進引擎、<code>@property</code> 把欄位加進一份清單。現在看實際的流程：</p>
<figure class="figure"><svg viewBox="0 0 680 250" class="fg" style="width:100%;max-width:680px" role="img" aria-label="裝飾器的執行順序：兩個 @property 先執行，把欄位寫進暫存清單；@ccclass 最後執行，讀取清單交給 CCClass，產生 __props__ 與 __values__，並把 class 登記進名字表和 id 表">
<rect x="10" y="40" width="210" height="110" rx="7" class="fg-b"/>
<text x="22" y="70" class="fg-t sm mono">① @property value = 7</text>
<text x="22" y="100" class="fg-t sm mono">② @property(Node) front</text>
<text x="22" y="130" class="fg-t sm mono acc">③ @ccclass('Card')</text>
<text x="115" y="28" text-anchor="middle" class="fg-t">你的程式</text>
<rect x="260" y="40" width="170" height="70" rx="7" class="fg-b alt"/>
<text x="345" y="62" text-anchor="middle" class="fg-t">暫存清單 stash</text>
<text x="345" y="82" text-anchor="middle" class="fg-t sm">value：預設 7</text><text x="345" y="99" text-anchor="middle" class="fg-t sm">front：型別 Node</text>
<rect x="260" y="140" width="170" height="80" rx="7" class="fg-b hot"/>
<text x="345" y="162" text-anchor="middle" class="fg-t acc">CCClass()</text>
<text x="345" y="184" text-anchor="middle" class="fg-t sm mono">__props__</text><text x="345" y="204" text-anchor="middle" class="fg-t sm mono">__values__</text>
<rect x="470" y="40" width="200" height="60" rx="7" class="fg-b"/>
<text x="570" y="64" text-anchor="middle" class="fg-t mono">_nameToClass</text><text x="570" y="86" text-anchor="middle" class="fg-t sm">'Card' → Card</text>
<rect x="470" y="130" width="200" height="60" rx="7" class="fg-b"/>
<text x="570" y="154" text-anchor="middle" class="fg-t mono">_idToClass</text><text x="570" y="176" text-anchor="middle" class="fg-t sm">'14779Z…' → Card</text>
<line x1="220" y1="66" x2="252" y2="66" class="fg-l"/><polygon points="260,66 252,61.5 252,70.5" class="fg-a"/>
<line x1="220" y1="96" x2="252" y2="90" class="fg-l"/><polygon points="260,88 252,85.5 254,94" class="fg-a"/>
<path d="M220 126 H240 V180 H252" class="fg-l on"/><polygon points="260,180 252,175.5 252,184.5" class="fg-a on"/>
<line x1="345" y1="110" x2="345" y2="132" class="fg-l on"/><polygon points="345,140 340.5,132 349.5,132" class="fg-a on"/>
<text x="353" y="128" class="fg-t sm acc">讀取</text>
<path d="M430 160 H445 V70 H462" class="fg-l"/><polygon points="470,70 462,65.5 462,74.5" class="fg-a"/>
<path d="M430 190 H455 V160 H462" class="fg-l"/><polygon points="470,160 462,155.5 462,164.5" class="fg-a"/>
<text x="340" y="242" text-anchor="middle" class="fg-t sm">成員的裝飾器先跑，class 的裝飾器最後跑：這是 TypeScript 舊式裝飾器的規則</text>
</svg><figcaption>① ② 在 ③ 之前執行，所以 @ccclass 一定看得到所有 @property 留下的資料。名字表給 getComponent('Card') 這類字串查詢用，id 表給載入場景時用。</figcaption></figure>
<ol>
<li><b>成員裝飾器先跑。</b>TypeScript 的舊式裝飾器規定：class 裡每個成員的裝飾器先執行，class 本身的裝飾器最後執行。每個 <code>@property</code> 把「欄位名、型別、預設值、顯示選項」寫進掛在這個 class 上的暫存清單（stash）。</li>
<li><b>預設值從哪裡來。</b>編輯器的編譯會把 <code>value = 7</code> 這種欄位初始值包成一個小函式（initializer），連同欄位一起交給裝飾器。引擎呼叫它拿到 7；如果初始值是物件（例如 <code>new Color()</code>），就保留那個函式，每次建立元件時各呼叫一次，避免所有元件共用同一個物件。</li>
<li><b>@ccclass 收尾。</b>它讀出暫存清單，交給內部的 <code>CCClass()</code>，替這個 class 建出兩份清單：<code>__props__</code> 是所有屬性的名字，<code>__values__</code> 是其中要被序列化的那些（getter／setter 和 <code>serializable: false</code> 的會被排除）。序列化和反序列化就只看 <code>__values__</code>。</li>
<li><b>登記進兩張表。</b>名字表（<code>_nameToClass</code>）用 <code>@ccclass</code> 的字串當 key，id 表（<code>_idToClass</code>）用腳本 uuid 當 key。如果兩支腳本都寫了 <code>@ccclass('Card')</code>，id 表不會衝突（兩支腳本的 uuid 不同），場景照樣載入；但名字表一個名字只能放一個，3.8 的寫法是<b>後登記的直接蓋掉先登記的</b>，不報錯。結果是所有用字串找的地方，例如 <code>getComponent('Card')</code>，都可能拿到另一支腳本的 class，而且哪一支後登記，取決於模組的載入順序。所以大專案、或會引入別人套件的專案，常用 <code>'hilo.Card'</code> 這種帶前綴的名字，就像引擎自己的類別都叫 <code>cc.Sprite</code>、<code>cc.Label</code>。</li>
<li><b>正式建置裡，編輯器用的資訊會消失。</b>tooltip、displayName、range 這些只在開發版存在，正式包裡不佔空間也不佔時間。</li>
</ol>
<h4>循環 import：Cocos 特別容易踩的坑</h4>
<p>一般的 TypeScript 專案，A import B、B 又 import A，通常只要不在模組最上層直接用到對方就沒事。Cocos 不一樣：<code>@property(Deck)</code> 這一行是在<b>class 定義的那一刻</b>就要拿到 <code>Deck</code> 的值。如果 Card.ts 和 Deck.ts 互相 import，其中一個在定義時，另一個還沒執行完，拿到的是 <code>undefined</code>，那個屬性的型別就壞了：屬性檢查器上的格子不對，或拖不進東西。打開 <code>temp/programming</code> 裡的編譯結果，會看到編輯器在每個 import 旁邊都插了「可能用到循環參照」的回報程式，主控台出現這類警告時就要認真處理。</p>
<p>解法是把循環切斷：雙方都需要的東西抽到第三個檔案（例如只放型別和介面的 <code>types.ts</code>，用 <code>import type</code> 引入，編譯後完全不存在，就不會造成執行時的循環）；或者讓下層用事件通知上層，而不是 import 上層。</p>

<h3>九、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>型別錯了，預覽就跑不起來</td><td>編輯器只拿掉型別、不檢查。型別錯誤只會出現在 VS Code 和你自己跑的 tsc 裡，所以要把 tsc 放進流程。</td></tr>
<tr><td>場景檔用 class 名字記住元件</td><td>記的是腳本檔 uuid 的壓縮形式。腳本的 .meta 弄丟，元件就變成 Missing Script。</td></tr>
<tr><td>@property 的初始值就是它的值</td><td>初始值只是預設值，載入時會被場景檔裡的值蓋掉。</td></tr>
<tr><td>欄位改名只是重構，沒有風險</td><td>場景檔用欄位名當 key，改名就讀不到舊值，下次存檔還會丟掉。要用 formerlySerializedAs。</td></tr>
<tr><td>同一個節點上元件的 update 順序固定</td><td>同一個節點上的初始順序照屬性檢查器的排列，但 0 號桶移除時會「拿最後一個補洞」，啟停過之後順序就變了。</td></tr>
<tr><td>find 很慢，所以不能用</td><td>單次很便宜。問題是放在 update 裡乘上每格、每個物件，以及改名就默默回傳 null、同名只找到第一個。</td></tr>
<tr><td>用 interface 就可以 getComponent</td><td>interface 編譯後不存在。要用抽象的基底類別，getComponent 會用 instanceof 比對到子類別。</td></tr>
</table>

<h3>十、跟你的工作連起來</h3>
<ul>
<li><b>Vue 的對照</b>：<code>@property</code> 對應 props，拖進來的參照對應 template ref，元件往上 emit、往下傳 props 的規則在 Cocos 一樣好用。最大的差別是：Vue 的 props 每次渲染都由父元件重新傳入，Cocos 的屬性值是存在場景檔裡的資料，會跟著版本控制、會有遷移問題（改名、列舉重排），比較像資料庫的欄位。</li>
<li><b>跟後端的對照</b>：場景檔的序列化，就是後端的資料庫結構遷移（migration）問題。欄位改名要寫遷移、列舉只能往後加、刪欄位要確定沒人在用，這些在 Go 或 Node.js 的後端你也會遇到，觀念完全通用。</li>
<li><b>Code review 要看的</b>：新增的 <code>@property</code> 有沒有寫 <code>| null</code> 並處理；有沒有在 <code>update</code> 裡做 find 或 getComponent；enum 有沒有被重排；欄位有沒有改名卻沒加 formerlySerializedAs；在 <code>onLoad</code> 註冊的監聽，有沒有在 <code>onDestroy</code> 拿掉。</li>
<li><b>可測試的規則</b>：把遊戲規則寫成不 import <code>cc</code> 的純 TypeScript，就能在 Node.js 裡用 Vitest 或 Jest 跑單元測試，放進 CI 每次合併都跑。這是遊戲專案最容易被忽略、回報最高的一件事。</li>
<li><b>Unity 的對照</b>：<code>[SerializeField]</code> 對應 <code>@property</code>，<code>[FormerlySerializedAs]</code> 對應 <code>@formerlySerializedAs</code>（名字幾乎一樣），Script Execution Order 設定對應 <code>@executionOrder</code>，GetComponent 的成本和快取規則也一樣。</li>
</ul>

<h3>十一、面試會怎麼問</h3>
<ol>
<li>「Cocos 的 @ccclass 和 @property 實際做了什麼？為什麼不能在 constructor 裡初始化？」</li>
<li>「把一個 @property 欄位改名之後，場景裡原本設好的值不見了。為什麼？怎麼避免？」</li>
<li>「getComponent 和 find 的成本在哪裡？你會怎麼寫才不會有效能和穩定性的問題？」</li>
<li>「兩個元件的 update 誰先跑？如果你的邏輯需要固定的順序，你怎麼做？」</li>
<li>「你會怎麼組織一個中型遊戲的腳本架構？規則要怎麼測試？」</li>
<li>「Cocos 專案要不要開 TypeScript 的 strict？開了會遇到什麼問題？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>@property 在 class 定義時把欄位的型別、預設值和顯示選項記進一份暫存清單；@ccclass 最後執行，讀出清單，建立這個 class 的屬性表（哪些要顯示、哪些要序列化），並用名字登記進引擎，同時這個 class 也透過腳本 uuid 登記。場景檔記的是腳本 uuid 和序列化欄位的值。載入時引擎先 new 元件、再把存檔值填回去、最後才呼叫 onLoad，所以 constructor 執行時存檔值還沒到，在那裡初始化會拿到錯的值；而且元件由引擎建立，constructor 不能有參數。</li>
<li>場景檔是用欄位名稱當 key 存值的。改名之後引擎找不到新名字的資料，就用程式裡的初始值，下次存檔時舊名字的資料還會被丟掉。用 @formerlySerializedAs('舊名字') 讓新欄位先讀舊名字的資料，存一次之後就會以新名字存下來。同樣道理，列舉存的是數字，只能在最後新增成員，不能重排。</li>
<li>getComponent 是把節點的元件陣列走一遍做 instanceof，find 是把路徑切開、每一層在子節點裡逐一比名字。單次都便宜，問題在放進 update 乘上每格和物件數，還會產生垃圾；而且 find 依賴名字和結構，改名就默默回傳 null，同名只拿到第一個。做法是：能拖的就用 @property 拖進來；不能拖的在 onLoad 找一次存成欄位；長期持有別人的參照時，用之前檢查 isValid。</li>
<li>引擎把元件依 executionOrder 分成負數、0、正數三桶，負數和正數照數字排序，0 號桶照加入順序，而且移除時會拿最後一個補洞，所以啟停過之後順序會改變。少數需要最先執行的元件可以用 @executionOrder；整串邏輯需要固定先後時，我會讓一個總管元件在自己的 update 裡依序呼叫各系統的 tick，把順序明確寫在程式碼裡。</li>
<li>規則和狀態寫成不依賴引擎的純 TypeScript 類別，用 Vitest 或 Jest 在 Node 裡做單元測試；畫面拆成只負責顯示的 View 元件；一個 Controller 元件負責接按鈕事件、呼叫規則、更新畫面。往下用方法呼叫，往上用事件，兄弟之間不直接溝通。判斷要不要拆的標準是一個元件只有一個會被改的理由，避免拆到整個流程都要靠追事件才看得懂。</li>
<li>建議開。新專案預設在自己的 tsconfig 把 strict 關掉，但長期維護的專案開了能在寫程式時就抓到大部分 null 的錯誤。要處理的是：@property 欄位要寫成 | null 加初始值，或用 = null! 但要接受執行時才爆的風險；getComponent 和 find 的回傳要檢查；開 noImplicitOverride 時生命週期方法要加 override；isolatedModules 下型別的匯出入要用 export type、import type。另外編輯器不做型別檢查，要自己把 tsc --noEmit 放進 git hook 或 CI。</li>
</ol>
</details>

<h3>十二、練功題（做得出來才算真的懂）</h3>
<ol>
<li>打開你專案裡任何一個場景檔，找一個你自己寫的元件。它的 <code>__type__</code> 是什麼？去那支腳本的 .meta 看 uuid，兩者有什麼關係？</li>
<li>一個元件有 <code>@property speed = 300</code>，場景裡存的是 450。你把程式改成 <code>@property moveSpeed = 500</code>。重新載入之後值是多少？存檔之後場景檔裡會剩下什麼？要怎麼改才能保住 450？</li>
<li>0 號桶裡依序是 A、B、C、D、E。先停用 C，再停用 A，再啟用 C。現在的順序是什麼？</li>
<li>Card.ts 裡有 <code>@property(Deck) deck</code>，Deck.ts 裡有 <code>@property(Card) cards</code>，兩邊互相 import。會發生什麼？給一個修法。</li>
<li>把下面這行改寫成嚴格模式下不會報錯、而且格子沒拖時錯誤訊息清楚的寫法：<code>@property(Label) title: Label;</code></li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li><code>__type__</code> 是一串 23 個字元左右的字串，前面幾個字元跟腳本 .meta 裡的 uuid 開頭相同：它就是那個 uuid 的壓縮形式。這代表場景是靠腳本檔的 uuid 找到 class，不是靠 class 名字。</li>
<li>新欄位 <code>moveSpeed</code> 在場景檔裡找不到同名資料，所以是 500；存檔之後場景檔只剩 <code>"moveSpeed": 500</code>，450 永遠消失。改成 <code>@formerlySerializedAs('speed') @property moveSpeed = 500</code>，載入時就會讀到 450，存檔後以新名字保存。</li>
<li>停用 C：最後的 E 補到 C 的位置，變成 A、B、E、D。停用 A：最後的 D 補到 A 的位置，變成 D、B、E。啟用 C：接到最後，變成 D、B、E、C。原本的 A、B、C、D、E 完全認不出來了。</li>
<li>兩個模組有一個會先執行完 class 定義，那時另一個還沒定義好，<code>@property</code> 拿到的型別是 undefined，屬性檢查器的格子會壞掉，主控台也會出現可能的循環參照警告。修法：讓一邊不要 import 另一邊，例如 Card 不持有 Deck，改用事件通知；或把共用的型別抽到只用 <code>import type</code> 引入的檔案。</li>
<li><code>@property(Label) titleSlot: Label | null = null;</code> 加上 <code>private title!: Label;</code>，在 <code>onLoad</code> 裡寫 <code>this.title = required(this.titleSlot, 'titleSlot');</code>。格子沒拖時，遊戲一啟動就丟出「Missing slot: titleSlot」，之後的程式用 <code>this.title</code> 不用再檢查 null。</li>
</ol>
</details>

<h3>十三、想再挖深</h3>
<ul>
<li><b>Cocos Creator 3.8 使用手冊</b>（<a href="https://docs.cocos.com/creator/3.8/manual/zh/">docs.cocos.com/creator/3.8/manual/zh</a>）：「腳本指南」底下的「裝飾器」「屬性參數」「生命週期回呼」和「腳本執行順序」幾章，以及 TypeScript 支援的說明。</li>
<li><b>cocos-engine 原始碼</b>（GitHub 上的 cocos/cocos-engine，3.8 分支）：<code>cocos/core/data/decorators/</code> 是所有裝飾器，<code>cocos/core/data/class.ts</code> 是 <code>__props__</code> 和 <code>__values__</code> 的來源，<code>cocos/scene-graph/component-scheduler.ts</code> 是三個桶子，<code>cocos/scene-graph/node-activator.ts</code> 是先 onLoad 再 onEnable 的地方。</li>
<li><b>TypeScript Handbook 的 Decorators 章節</b>（typescriptlang.org）：舊式裝飾器的求值順序和參數，跟 Cocos 用的是同一套。也順便看 tsconfig 參考裡的 strict、isolatedModules、noImplicitOverride 說明。</li>
<li><b>Robert Nystrom《Game Programming Patterns》</b>（gameprogrammingpatterns.com 可免費線上讀）：Component、Update Method、Event Queue、Service Locator 這幾章，正好對應這一章的架構和執行順序。</li>
</ul>
` });
