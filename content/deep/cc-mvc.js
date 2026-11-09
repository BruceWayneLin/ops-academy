DEEP({ 'cc-mvc': `
<p>上一課把猜高低拆成 Model、View、Controller 三塊：規則搬進 <code>GameModel</code>，按鈕只負責回報點擊。這一章往下挖：規則為什麼要「離開引擎也能活」、MVC／MVP／MVVM 到底差在哪、Vue 的響應式（reactivity）背後替你做了哪兩件事、事件和直接呼叫怎麼選、import 的箭頭該往哪裡指、資料夾怎麼排、怎麼不開 Cocos 就把規則測完，最後把同一份規則搬到伺服器上。以後你寫的每一款連線遊戲，骨架都長這樣。</p>

<h3><span class="badge lv1">基礎</span>一、規則是「純的」，畫面是「髒的」</h3>
<p>想像一盒桌遊。盒子裡有兩種東西：一本規則書，和一堆道具（牌、計分板、沙漏）。規則書寫的是「翻開的牌比較大，就得一分」。它不在乎牌是紙做的還是塑膠做的，也不在乎計分板放在桌子哪一角。道具全部換掉，規則書一個字都不用改。</p>
<p>遊戲程式也分這兩種。規則像規則書：給它「現在的狀態」和「玩家做了什麼」，它算出「新的狀態」。同樣的輸入，永遠得到同樣的輸出，而且除了回傳答案，什麼別的事都不做。這種程式叫<b>純函式</b>（pure function）。其他東西全是道具：節點、Label、動畫、計時器、亂數、網路。它們會變、會等、會失敗，要把整個遊戲開起來才看得到。</p>
<figure class="figure"><svg viewBox="0 0 660 270" class="fg" style="width:100%;max-width:660px" role="img" aria-label="功能核心與命令式外殼：左邊的點擊、計時器、洗好的牌把輸入送進中間的純規則核心，核心算出新狀態，右邊的外殼負責重畫和送伺服器">
<rect x="10" y="10" width="640" height="250" rx="12" class="fg-b"/>
<text x="26" y="34" class="fg-t sm">外殼（shell）：碰得到引擎、時間、亂數、網路，要把遊戲開起來才測得到</text>
<rect x="30" y="60" width="150" height="44" rx="6" class="fg-b alt"/><text x="105" y="87" text-anchor="middle" class="fg-t">玩家按 Higher</text>
<rect x="30" y="120" width="150" height="44" rx="6" class="fg-b alt"/><text x="105" y="147" text-anchor="middle" class="fg-t">計時器到了</text>
<rect x="30" y="180" width="150" height="44" rx="6" class="fg-b alt"/><text x="105" y="207" text-anchor="middle" class="fg-t">亂數洗好的牌</text>
<line x1="180" y1="82" x2="242" y2="82" class="fg-l on"/><polygon points="250,82 242,77.5 242,86.5" class="fg-a on"/><text x="215" y="75" text-anchor="middle" class="fg-t sm mono">guess</text>
<line x1="180" y1="142" x2="242" y2="142" class="fg-l on"/><polygon points="250,142 242,137.5 242,146.5" class="fg-a on"/><text x="215" y="135" text-anchor="middle" class="fg-t sm mono">timeUp</text>
<line x1="180" y1="202" x2="242" y2="202" class="fg-l on"/><polygon points="250,202 242,197.5 242,206.5" class="fg-a on"/><text x="215" y="195" text-anchor="middle" class="fg-t sm mono">deck</text>
<rect x="250" y="60" width="160" height="164" rx="8" class="fg-b hot"/>
<text x="330" y="90" text-anchor="middle" class="fg-t lg acc">規則核心</text>
<text x="330" y="112" text-anchor="middle" class="fg-t sm mono">core/rules.ts</text>
<text x="330" y="146" text-anchor="middle" class="fg-t sm">純 TypeScript</text>
<text x="330" y="166" text-anchor="middle" class="fg-t sm">不 import 'cc'</text>
<text x="330" y="200" text-anchor="middle" class="fg-t sm">同樣輸入 → 同樣輸出</text>
<line x1="410" y1="112" x2="472" y2="112" class="fg-l alt"/><polygon points="480,112 472,107.5 472,116.5" class="fg-a alt"/><text x="445" y="105" text-anchor="middle" class="fg-t sm">新 state</text>
<line x1="410" y1="182" x2="472" y2="182" class="fg-l alt"/><polygon points="480,182 472,177.5 472,186.5" class="fg-a alt"/><text x="445" y="175" text-anchor="middle" class="fg-t sm">要送的訊息</text>
<rect x="480" y="90" width="150" height="44" rx="6" class="fg-b alt"/><text x="555" y="117" text-anchor="middle" class="fg-t">Label、Sprite 重畫</text>
<rect x="480" y="160" width="150" height="44" rx="6" class="fg-b alt"/><text x="555" y="187" text-anchor="middle" class="fg-t">送伺服器、存檔</text>
<text x="330" y="248" text-anchor="middle" class="fg-t sm">核心只算答案；誰來畫、誰來送，是外殼的事</text>
</svg><figcaption>所有「髒」的東西都待在外殼：它們把輸入整理成簡單的資料送進核心，再把核心算出的新狀態畫出來、送出去。核心本身從不碰引擎。</figcaption></figure>
<p>會讓程式變「髒」的東西，常見的就四種，每一種都要擋在規則外面：</p>
<table>
<tr><th>髒東西</th><th>放進規則裡會怎樣</th><th>改成從外面傳進來</th></tr>
<tr><td>引擎物件（<code>Node</code>、<code>Label</code>）</td><td>沒有場景就跑不起來，沒辦法在 Node.js 裡測</td><td>規則只回傳數字和旗標，由 View 去畫</td></tr>
<tr><td>時間（<code>Date.now()</code>、<code>scheduleOnce</code>）</td><td>同一個測試，早上跑和晚上跑結果不同</td><td>由外殼在時間到時送一個 <code>timeUp</code> 動作，或把「現在幾毫秒」當參數傳進去</td></tr>
<tr><td>亂數（<code>Math.random()</code>）</td><td>bug 重現不了，因為每次的牌都不一樣</td><td>把洗好的牌堆傳進去，上一課的 <code>newGame(deck)</code> 就是這樣</td></tr>
<tr><td>網路、存檔</td><td>測一條規則要先架伺服器</td><td>規則只決定「要送什麼」，由外殼去送</td></tr>
</table>
<p>這種拆法有個名字，叫「功能核心、命令式外殼」（functional core, imperative shell）：中間是一塊純的核心，外面包一層薄薄的外殼，負責跟真實世界打交道。外殼越薄越好，因為它最難測；核心越厚越好，因為它最好測。</p>

<h3><span class="badge lv1">基礎</span>二、MVC、MVP、MVVM：差在「誰認得誰」</h3>
<p>這三個名字常被混著用，面試官也愛考。記住一件事就不會亂：三種都把狀態和規則放在 Model，差別只在<b>中間那一塊怎麼跟 View 說話</b>。</p>
<figure class="figure"><svg viewBox="0 0 680 280" class="fg" style="width:100%;max-width:680px" role="img" aria-label="三種拆法並排：MVC 的 View 收到 Model 的通知後自己去讀；MVP 的 Presenter 把數值推給被動的 View；MVVM 由綁定引擎自動重畫 View">
<rect x="10" y="8" width="210" height="264" rx="10" class="fg-b"/>
<rect x="235" y="8" width="210" height="264" rx="10" class="fg-b"/>
<rect x="460" y="8" width="210" height="264" rx="10" class="fg-b"/>
<text x="115" y="30" text-anchor="middle" class="fg-t lg">MVC</text><text x="115" y="48" text-anchor="middle" class="fg-t sm">View 直接看 Model</text>
<text x="340" y="30" text-anchor="middle" class="fg-t lg">MVP</text><text x="340" y="48" text-anchor="middle" class="fg-t sm">上一課其實是這型</text>
<text x="565" y="30" text-anchor="middle" class="fg-t lg">MVVM</text><text x="565" y="48" text-anchor="middle" class="fg-t sm">Vue 就是綁定引擎</text>
<rect x="40" y="60" width="120" height="36" rx="6" class="fg-b"/><text x="100" y="83" text-anchor="middle" class="fg-t">View</text>
<rect x="40" y="130" width="120" height="36" rx="6" class="fg-b hot"/><text x="100" y="153" text-anchor="middle" class="fg-t acc">Controller</text>
<rect x="40" y="200" width="120" height="36" rx="6" class="fg-b alt"/><text x="100" y="223" text-anchor="middle" class="fg-t">Model</text>
<line x1="100" y1="96" x2="100" y2="122" class="fg-l"/><polygon points="100,130 95.5,122 104.5,122" class="fg-a"/><text x="108" y="117" class="fg-t sm">輸入</text>
<line x1="100" y1="166" x2="100" y2="192" class="fg-l"/><polygon points="100,200 95.5,192 104.5,192" class="fg-a"/><text x="108" y="187" class="fg-t sm">改資料</text>
<path d="M160 218 H182 V78 H168" class="fg-l alt"/><polygon points="160,78 168,73.5 168,82.5" class="fg-a alt"/>
<text x="187" y="144" class="fg-t sm alt">通知</text><text x="187" y="160" class="fg-t sm alt">再讀</text>
<text x="115" y="258" text-anchor="middle" class="fg-t sm">Model 只發通知</text>
<rect x="265" y="60" width="120" height="36" rx="6" class="fg-b"/><text x="325" y="83" text-anchor="middle" class="fg-t">View</text>
<rect x="265" y="130" width="120" height="36" rx="6" class="fg-b hot"/><text x="325" y="153" text-anchor="middle" class="fg-t acc">Presenter</text>
<rect x="265" y="200" width="120" height="36" rx="6" class="fg-b alt"/><text x="325" y="223" text-anchor="middle" class="fg-t">Model</text>
<line x1="305" y1="96" x2="305" y2="122" class="fg-l"/><polygon points="305,130 300.5,122 309.5,122" class="fg-a"/><text x="299" y="117" text-anchor="end" class="fg-t sm">點擊</text>
<line x1="345" y1="130" x2="345" y2="104" class="fg-l on"/><polygon points="345,96 340.5,104 349.5,104" class="fg-a on"/><text x="351" y="117" class="fg-t sm mono acc">draw()</text>
<line x1="305" y1="166" x2="305" y2="192" class="fg-l"/><polygon points="305,200 300.5,192 309.5,192" class="fg-a"/><text x="299" y="187" text-anchor="end" class="fg-t sm">呼叫</text>
<line x1="345" y1="200" x2="345" y2="174" class="fg-l alt"/><polygon points="345,166 340.5,174 349.5,174" class="fg-a alt"/><text x="351" y="187" class="fg-t sm alt">事件</text>
<text x="340" y="258" text-anchor="middle" class="fg-t sm">View 被動，最好測</text>
<rect x="490" y="60" width="120" height="36" rx="6" class="fg-b"/><text x="550" y="83" text-anchor="middle" class="fg-t">View</text>
<rect x="490" y="130" width="120" height="36" rx="6" class="fg-b hot"/><text x="550" y="153" text-anchor="middle" class="fg-t acc">ViewModel</text>
<rect x="490" y="200" width="120" height="36" rx="6" class="fg-b alt"/><text x="550" y="223" text-anchor="middle" class="fg-t">Model</text>
<line x1="530" y1="96" x2="530" y2="122" class="fg-l"/><polygon points="530,130 525.5,122 534.5,122" class="fg-a"/><text x="524" y="117" text-anchor="end" class="fg-t sm mono">@click</text>
<line x1="570" y1="130" x2="570" y2="104" class="fg-l on"/><polygon points="570,96 565.5,104 574.5,104" class="fg-a on"/><text x="576" y="117" class="fg-t sm acc">自動重畫</text>
<line x1="530" y1="166" x2="530" y2="192" class="fg-l"/><polygon points="530,200 525.5,192 534.5,192" class="fg-a"/><text x="524" y="187" text-anchor="end" class="fg-t sm">呼叫</text>
<line x1="570" y1="200" x2="570" y2="174" class="fg-l alt"/><polygon points="570,166 565.5,174 574.5,174" class="fg-a alt"/><text x="576" y="187" class="fg-t sm alt">回傳</text>
<text x="565" y="258" text-anchor="middle" class="fg-t sm">不用寫重畫的程式</text>
</svg><figcaption>三種拆法的 Model 都一樣，差在右邊那條「把資料送到畫面」的路：MVC 是 View 自己去讀，MVP 是 Presenter 推給 View，MVVM 是綁定引擎自動同步。</figcaption></figure>
<ul>
<li><b>MVC</b>（1970 年代末在 Smalltalk 上提出）：Model 改變時只發一個通知，View 收到後<em>自己</em>去讀 Model。所以 View 認得 Model。Controller 只負責把輸入翻成對 Model 的呼叫。</li>
<li><b>MVP</b>（Model-View-Presenter）的「被動 View」（passive view）版本：View 完全不認得 Model，只提供幾個方法，例如 <code>draw(card, score, over)</code>。Presenter 聽 Model 的事件，讀出數值，再「推」給 View。回頭看上一課的 <code>GameController</code>：它呼叫 <code>view.draw(...)</code>，View 裡沒有任何 Model 的影子。嚴格說，那其實是 MVP。</li>
<li><b>MVVM</b>（Model-View-ViewModel）：中間那塊叫 ViewModel，它把畫面需要的狀態整理好擺出來，再由一個<b>資料綁定</b>（data binding）引擎自動讓 View 跟著變。你不用寫任何「重畫」的程式。Vue 就扮演這個綁定引擎：template 是 View，元件的 <code>setup</code> 或 Pinia store 是 ViewModel。Vue 2 的官方文件也寫過，它的設計有一部分受到 MVVM 啟發。</li>
</ul>
<p>Cocos 沒有綁定引擎，所以在 Cocos 裡最順手的是 MVP：View 被動，Presenter（你可以繼續叫它 Controller）負責推資料。好處是 View 可以換成一個假物件來測，因為它只是一組方法。業界把這幾個名字用得很鬆，看到有人叫 Controller、做的其實是 Presenter 的事，不用糾正，看箭頭就好。</p>

<h3><span class="badge lv2">進階</span>三、單向資料流：用 [3, 9, 5] 追一次</h3>
<p>上一課的 <code>GameModel</code> 用方法直接改自己的欄位。這裡換一個更嚴格的寫法，很多大型專案都用它：把「玩家做了什麼」寫成一個<b>動作</b>（action）物件，再用一個純函式 <code>reduce</code> 算出新狀態。Redux、Elm 都是這個做法。</p>
<pre><code>// core/rules.ts: nothing here imports from 'cc'
export type Guess = 'higher' | 'lower';
export interface State {
  deck: number[]; current: number;
  score: number; over: boolean;
}
export type Action =
  | { type: 'start'; deck: number[] }
  | { type: 'guess'; guess: Guess };

export function reduce(s: State, a: Action): State {
  switch (a.type) {
    case 'start':
      return { deck: a.deck.slice(1), current: a.deck[0],
               score: 0, over: false };
    case 'guess': {
      if (s.over) return s;   // no change: same object
      const [next, ...rest] = s.deck;
      const right = a.guess === 'higher'
        ? next &gt; s.current : next &lt; s.current;
      return { deck: rest, current: next,
               score: s.score + (right ? 1 : 0),
               over: !right || rest.length === 0 };
    }
  }
}
</code></pre>
<p><code>reduce</code> 從不修改傳進來的 <code>s</code>，每次都回傳一個新物件。外面再包一個很小的 store，負責「保管目前的狀態」和「通知大家」：</p>
<pre><code>// app/store.ts
export class Store {
  private listeners = new Set&lt;(s: State) =&gt; void&gt;();
  constructor(public state: State) {}

  dispatch(a: Action) {
    const before = this.state;
    this.state = reduce(before, a);
    if (this.state === before) return;   // nothing changed
    this.listeners.forEach((f) =&gt; f(this.state));
  }
  subscribe(f: (s: State) =&gt; void) {
    this.listeners.add(f);
    return () =&gt; this.listeners.delete(f);   // unsubscribe
  }
}
</code></pre>
<p>現在用牌堆 [3, 9, 5] 走一次，看資料怎麼繞圈：</p>
<figure class="figure"><svg viewBox="0 0 660 250" class="fg" style="width:100%;max-width:660px" role="img" aria-label="單向資料流的一圈：View 回報點擊，dispatch 動作，reduce 算出新狀態，通知訂閱者，View 照新狀態畫出 9 和 Score 1">
<text x="330" y="22" text-anchor="middle" class="fg-t sm">牌堆 [3, 9, 5]：桌上是 3、0 分，玩家按 Higher</text>
<rect x="20" y="36" width="180" height="56" rx="6" class="fg-b"/><text x="110" y="60" text-anchor="middle" class="fg-t">1 View 回報點擊</text><text x="110" y="80" text-anchor="middle" class="fg-t sm mono">'higher'</text>
<rect x="240" y="36" width="180" height="56" rx="6" class="fg-b"/><text x="330" y="60" text-anchor="middle" class="fg-t">2 dispatch(action)</text><text x="330" y="80" text-anchor="middle" class="fg-t sm mono">{ type: 'guess' }</text>
<rect x="460" y="36" width="180" height="56" rx="6" class="fg-b hot"/><text x="550" y="60" text-anchor="middle" class="fg-t acc">3 reduce(state, action)</text><text x="550" y="80" text-anchor="middle" class="fg-t sm">規則只在這裡</text>
<line x1="200" y1="64" x2="232" y2="64" class="fg-l on"/><polygon points="240,64 232,59.5 232,68.5" class="fg-a on"/>
<line x1="420" y1="64" x2="452" y2="64" class="fg-l on"/><polygon points="460,64 452,59.5 452,68.5" class="fg-a on"/>
<line x1="550" y1="92" x2="550" y2="148" class="fg-l on"/><polygon points="550,156 545.5,148 554.5,148" class="fg-a on"/><text x="558" y="128" class="fg-t sm">回傳新物件</text>
<rect x="460" y="156" width="180" height="56" rx="6" class="fg-b alt"/><text x="550" y="180" text-anchor="middle" class="fg-t">4 新的 state</text><text x="550" y="200" text-anchor="middle" class="fg-t sm mono">current 9, score 1</text>
<rect x="240" y="156" width="180" height="56" rx="6" class="fg-b"/><text x="330" y="180" text-anchor="middle" class="fg-t">5 通知訂閱者</text><text x="330" y="200" text-anchor="middle" class="fg-t sm mono">listeners.forEach</text>
<rect x="20" y="156" width="180" height="56" rx="6" class="fg-b"/><text x="110" y="180" text-anchor="middle" class="fg-t">6 View 照 state 畫</text><text x="110" y="200" text-anchor="middle" class="fg-t sm">9，Score: 1</text>
<line x1="460" y1="184" x2="428" y2="184" class="fg-l on"/><polygon points="420,184 428,179.5 428,188.5" class="fg-a on"/>
<line x1="240" y1="184" x2="208" y2="184" class="fg-l on"/><polygon points="200,184 208,179.5 208,188.5" class="fg-a on"/>
<line x1="110" y1="156" x2="110" y2="100" class="fg-l dash"/><polygon points="110,92 105.5,100 114.5,100" class="fg-a"/><text x="118" y="130" class="fg-t sm">下一次點擊</text>
<text x="330" y="128" text-anchor="middle" class="fg-t sm acc">state 只有一份，只有 reduce 能產生新的</text>
<text x="330" y="236" text-anchor="middle" class="fg-t sm">再按 Lower：5 &lt; 9，score 2，牌用完，over</text>
</svg><figcaption>資料永遠照同一個方向繞：點擊變成動作，動作經過規則變成新狀態，新狀態通知畫面。View 從來不直接改狀態，也從來不直接改別的 View。</figcaption></figure>
<table>
<tr><th>步驟</th><th>動作</th><th>之後的 state</th><th>畫面</th></tr>
<tr><td>1</td><td><code>start</code>，牌堆 [3, 9, 5]</td><td>current 3、score 0、deck [9, 5]</td><td>3，Score: 0</td></tr>
<tr><td>2</td><td><code>guess higher</code></td><td>9 &gt; 3 猜對：current 9、score 1、deck [5]</td><td>9，Score: 1</td></tr>
<tr><td>3</td><td><code>guess lower</code></td><td>5 &lt; 9 猜對：current 5、score 2、deck []，over</td><td>5，Final score: 2</td></tr>
<tr><td>4</td><td><code>guess higher</code>（連點）</td><td>over 已經是 true，原封不動回傳同一個物件</td><td>不變，也不會通知</td></tr>
</table>
<p>第 4 步很關鍵。<code>reduce</code> 回傳同一個物件，store 用 <code>!==</code> 一比就知道「沒變」，連通知都省了。「沒變就回傳原物件」這個習慣，讓「到底有沒有變」只需要一次參照比較，非常便宜。</p>
<h4>為什麼要這麼囉嗦</h4>
<ul>
<li><b>所有改變都走同一扇門。</b>想知道分數為什麼變成 2？在 <code>dispatch</code> 裡印出每一個動作，答案就在 log 裡。</li>
<li><b>可以重播。</b>把一局的動作清單存下來，例如 <code>[start, guess higher, guess lower]</code>，再丟回 <code>reduce</code> 一個一個跑，就能在你的電腦上重現玩家那一局，分毫不差。Redux DevTools 的「時光倒流」除錯就是這個原理。</li>
<li><b>代價是囉嗦。</b>每多一種操作，就要多定義一種動作、多寫一個 case。小遊戲用上一課的寫法完全夠；等到 bug 開始「重現不了」，再升級成這樣。</li>
</ul>

<h3><span class="badge lv2">進階</span>四、Vue 替你做掉的兩件事</h3>
<p>在 Vue 裡寫 <code>store.score++</code>，畫面就變了。中間其實發生了兩件事，而 Cocos 兩件都不會替你做：</p>
<ol>
<li><b>知道誰該更新。</b>Vue 3 的 <code>reactive()</code> 回傳一個 <code>Proxy</code>。元件在渲染時讀了 <code>score</code>，Proxy 的 get 就記下「這個元件依賴 score」，這一步叫 track；之後有人寫入 <code>score</code>，Proxy 的 set 就找出所有依賴它的地方，這一步叫 trigger。</li>
<li><b>把很多次改變合成一次重畫。</b>trigger 不會馬上重畫，而是把「這個元件要更新」排進一個佇列，同一個元件只排一次，等目前這段同步程式跑完，在一個微任務（microtask）裡統一處理。所以你連改五次，畫面只重畫一次。<code>nextTick()</code> 等的就是佇列清空的這一刻。</li>
</ol>
<figure class="figure"><svg viewBox="0 0 680 236" class="fg" style="width:100%;max-width:680px" role="img" aria-label="兩條流程對照：Vue 的寫入經過 Proxy、trigger、排進佇列，在微任務裡重畫一次；Cocos 的寫入沒有人知道，要自己 emit、標記 dirty，在 lateUpdate 裡畫一次">
<text x="20" y="76" class="fg-t acc">Vue 3</text>
<rect x="86" y="46" width="100" height="52" rx="6" class="fg-b"/><text x="136" y="68" text-anchor="middle" class="fg-t mono">score++</text><text x="136" y="87" text-anchor="middle" class="fg-t sm">連改五次</text>
<rect x="206" y="46" width="100" height="52" rx="6" class="fg-b alt"/><text x="256" y="68" text-anchor="middle" class="fg-t mono">Proxy set</text><text x="256" y="87" text-anchor="middle" class="fg-t sm">攔到寫入</text>
<rect x="326" y="46" width="100" height="52" rx="6" class="fg-b alt"/><text x="376" y="68" text-anchor="middle" class="fg-t mono">trigger</text><text x="376" y="87" text-anchor="middle" class="fg-t sm">找出依賴它的</text>
<rect x="446" y="46" width="100" height="52" rx="6" class="fg-b alt"/><text x="496" y="68" text-anchor="middle" class="fg-t">排進佇列</text><text x="496" y="87" text-anchor="middle" class="fg-t sm">同一個只排一次</text>
<rect x="566" y="46" width="100" height="52" rx="6" class="fg-b hot"/><text x="616" y="68" text-anchor="middle" class="fg-t acc">重畫一次</text><text x="616" y="87" text-anchor="middle" class="fg-t sm">在微任務裡</text>
<line x1="186" y1="72" x2="198" y2="72" class="fg-l"/><polygon points="206,72 198,67.5 198,76.5" class="fg-a"/>
<line x1="306" y1="72" x2="318" y2="72" class="fg-l"/><polygon points="326,72 318,67.5 318,76.5" class="fg-a"/>
<line x1="426" y1="72" x2="438" y2="72" class="fg-l"/><polygon points="446,72 438,67.5 438,76.5" class="fg-a"/>
<line x1="546" y1="72" x2="558" y2="72" class="fg-l"/><polygon points="566,72 558,67.5 558,76.5" class="fg-a"/>
<line x1="20" y1="124" x2="660" y2="124" class="fg-l dim dash"/>
<text x="20" y="176" class="fg-t alt">Cocos</text>
<rect x="86" y="146" width="100" height="52" rx="6" class="fg-b"/><text x="136" y="168" text-anchor="middle" class="fg-t mono">score++</text><text x="136" y="187" text-anchor="middle" class="fg-t sm">連改五次</text>
<rect x="206" y="146" width="100" height="52" rx="6" class="fg-b warm"/><text x="256" y="168" text-anchor="middle" class="fg-t warm">沒人知道</text><text x="256" y="187" text-anchor="middle" class="fg-t sm">畫面不變</text>
<rect x="326" y="146" width="100" height="52" rx="6" class="fg-b alt"/><text x="376" y="168" text-anchor="middle" class="fg-t mono">emit()</text><text x="376" y="187" text-anchor="middle" class="fg-t sm">你自己寫</text>
<rect x="446" y="146" width="100" height="52" rx="6" class="fg-b alt"/><text x="496" y="168" text-anchor="middle" class="fg-t">標記 dirty</text><text x="496" y="187" text-anchor="middle" class="fg-t sm">改五次也一樣</text>
<rect x="566" y="146" width="100" height="52" rx="6" class="fg-b hot"/><text x="616" y="168" text-anchor="middle" class="fg-t acc">畫一次</text><text x="616" y="187" text-anchor="middle" class="fg-t sm">lateUpdate 裡</text>
<line x1="186" y1="172" x2="198" y2="172" class="fg-l"/><polygon points="206,172 198,167.5 198,176.5" class="fg-a"/>
<line x1="306" y1="172" x2="318" y2="172" class="fg-l dash"/><polygon points="326,172 318,167.5 318,176.5" class="fg-a"/>
<line x1="426" y1="172" x2="438" y2="172" class="fg-l"/><polygon points="446,172 438,167.5 438,176.5" class="fg-a"/>
<line x1="546" y1="172" x2="558" y2="172" class="fg-l"/><polygon points="566,172 558,167.5 558,176.5" class="fg-a"/>
<text x="340" y="226" text-anchor="middle" class="fg-t sm">Vue 把「通知」和「合併」都藏起來了；在 Cocos，這兩步都要自己寫</text>
</svg><figcaption>同樣是連改五次分數。Vue 的 Proxy 自動通知、排程器自動合併；Cocos 的欄位只是普通的欄位，通知要自己 emit，合併要自己用髒旗標做。</figcaption></figure>
<p>在 Cocos 裡，第一件事靠你自己 <code>emit</code>（或上一節的 <code>dispatch</code>），第二件事也要自己做，不然一個操作改了三個欄位、發了三次通知，View 就畫三次。最簡單的辦法是<b>髒旗標</b>（dirty flag）：收到通知只做記號，每一幀在 <code>lateUpdate</code> 裡最多畫一次。</p>
<pre><code>import { _decorator, Component, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ScoreView')
export class ScoreView extends Component {
  @property(Label) label: Label | null = null;
  private store: Store | null = null;
  private off: (() =&gt; void) | null = null;
  private dirty = false;

  bind(store: Store) {
    this.store = store;
    this.off = store.subscribe(() =&gt; { this.dirty = true; });
    this.dirty = true;               // draw once at start
  }
  lateUpdate() {
    if (!this.dirty || !this.store) return;
    this.dirty = false;
    this.label!.string = 'Score: ' + this.store.state.score;
  }
  onDestroy() { this.off?.(); }
}
</code></pre>
<p>如果 View 只關心某一個欄位，可以再加一層<b>選擇器</b>（selector）：只有選出來的值真的變了，才通知。Pinia 的 getter、Vue 的 <code>computed</code> 做的就是類似的事。</p>
<pre><code>export function select&lt;T&gt;(
  store: Store, pick: (s: State) =&gt; T, f: (v: T) =&gt; void,
) {
  let last = pick(store.state);
  f(last);
  return store.subscribe((s) =&gt; {
    const v = pick(s);
    if (v !== last) { last = v; f(v); }
  });
}
// select(store, (s) =&gt; s.score, (n) =&gt; scoreView.show(n));
</code></pre>
<div class="note"><b>能不能把 Vue 的響應式直接搬進 Cocos？</b>Vue 3 的響應式核心是一個獨立的 npm 套件 <code>@vue/reactivity</code>，不依賴 DOM。但要知道：單獨使用時，它的 <code>effect()</code> 在資料改變時是同步重跑的，改一次就跑一次；「合成一次重畫」是 Vue 元件的排程器做的，不在這個套件裡。就算搬過來，每幀合併一次這件事還是要自己做。</div>

<h3><span class="badge lv2">進階</span>五、事件還是直接呼叫：往下呼叫、往上發事件</h3>
<p>Controller 要讓 View 重畫，可以直接呼叫 <code>view.draw()</code>，也可以發一個事件讓 View 自己聽。兩種都能動，差在「出問題的時候，找不找得到」。</p>
<table>
<tr><th></th><th>直接呼叫</th><th>事件</th></tr>
<tr><td>誰知道誰</td><td>呼叫的人知道對方是誰</td><td>發事件的人不知道誰在聽</td></tr>
<tr><td>追程式</td><td>在編輯器裡跳到定義，一路追得到</td><td>要全專案搜尋事件名稱，才知道誰會被叫</td></tr>
<tr><td>型別檢查</td><td>參數打錯，TypeScript 馬上畫紅線</td><td>名稱是字串、參數常是 <code>any</code>，打錯照樣編譯</td></tr>
<tr><td>一對多</td><td>要一個一個呼叫</td><td>天生一對多：再加一個結算畫面，原本的程式不用改</td></tr>
<tr><td>常見的坑</td><td>彼此綁太緊，換掉一個要改一串</td><td>忘了取消監聽，物件死了還一直被呼叫</td></tr>
</table>
<p>實務上的分工只有一句話：<b>往下呼叫、往上發事件</b>。上層擁有下層、知道它是誰，就直接呼叫；下層不該知道誰擁有它，就發事件往上報。Vue 的「props 往下、events 往上」（props down, events up）講的是同一件事。</p>
<figure class="figure"><svg viewBox="0 0 600 250" class="fg" style="width:100%;max-width:600px" role="img" aria-label="GameController 在上，用實線直接呼叫下面的 GameModel、GameView、ResultView；下面三個用虛線發事件往上報；GameView 和 ResultView 之間不直接互叫">
<text x="20" y="30" class="fg-t sm acc">實線：往下呼叫</text>
<text x="20" y="48" class="fg-t sm alt">虛線：往上發事件</text>
<rect x="210" y="16" width="180" height="48" rx="6" class="fg-b hot"/><text x="300" y="45" text-anchor="middle" class="fg-t acc">GameController</text>
<rect x="30" y="170" width="150" height="44" rx="6" class="fg-b alt"/><text x="105" y="197" text-anchor="middle" class="fg-t">GameModel</text>
<rect x="225" y="170" width="150" height="44" rx="6" class="fg-b"/><text x="300" y="197" text-anchor="middle" class="fg-t">GameView</text>
<rect x="420" y="170" width="150" height="44" rx="6" class="fg-b"/><text x="495" y="197" text-anchor="middle" class="fg-t">ResultView</text>
<path d="M250 64 V110 H95 V162" class="fg-l on"/><polygon points="95,170 90.5,162 99.5,162" class="fg-a on"/>
<line x1="290" y1="64" x2="290" y2="162" class="fg-l on"/><polygon points="290,170 285.5,162 294.5,162" class="fg-a on"/>
<path d="M350 64 V110 H505 V162" class="fg-l on"/><polygon points="505,170 500.5,162 509.5,162" class="fg-a on"/>
<path d="M115 170 V124 H262 V72" class="fg-l alt dash"/><polygon points="262,64 257.5,72 266.5,72" class="fg-a alt"/>
<line x1="310" y1="170" x2="310" y2="72" class="fg-l alt dash"/><polygon points="310,64 305.5,72 314.5,72" class="fg-a alt"/>
<path d="M485 170 V124 H338 V72" class="fg-l alt dash"/><polygon points="338,64 333.5,72 342.5,72" class="fg-a alt"/>
<text x="172" y="104" text-anchor="middle" class="fg-t sm mono acc">guess()</text>
<text x="190" y="140" text-anchor="middle" class="fg-t sm mono alt">changed</text>
<text x="284" y="140" text-anchor="end" class="fg-t sm mono acc">draw()</text>
<text x="316" y="140" class="fg-t sm mono alt">guess</text>
<text x="428" y="104" text-anchor="middle" class="fg-t sm mono acc">show()</text>
<text x="410" y="140" text-anchor="middle" class="fg-t sm mono alt">again</text>
<line x1="375" y1="192" x2="412" y2="192" class="fg-l warm dash"/><polygon points="420,192 412,187.5 412,196.5" class="fg-a warm"/>
<text x="397" y="184" text-anchor="middle" class="fg-t warm">✕</text>
<text x="397" y="236" text-anchor="middle" class="fg-t sm warm">兄弟之間不直接互叫</text>
</svg><figcaption>上層知道下層是誰，所以直接呼叫；下層不知道誰在聽，所以發事件。GameView 想讓結算畫面出現，要先發事件給上層，由上層決定要不要叫 ResultView。</figcaption></figure>
<p>兄弟之間（例如 GameView 和 ResultView）永遠不直接互叫。這樣 ResultView 被拿掉的那天，GameView 一行都不用改。</p>
<h4>Cocos 的事件，三個要知道的細節</h4>
<ul>
<li><code>this.node.emit('guess', 'higher')</code> 只會通知在<b>這個節點</b>上註冊的監聽器，不會往父節點傳。要往上冒泡，得用 <code>this.node.dispatchEvent(new Event('guess', true))</code>（這裡的 <code>Event</code> 要從 <code>'cc'</code> import）。冒泡多半用在 UI 的點擊，遊戲邏輯少用。</li>
<li>註冊時傳第三個參數 <code>target</code>：<code>model.events.on('changed', this.redraw, this)</code>。之後在 <code>onDestroy</code> 裡呼叫 <code>model.events.targetOff(this)</code>，就能一次取消這個元件註冊過的所有監聽。</li>
<li>最常見的洩漏：Model 活得比 View 久（例如 Model 是跨場景的單例），View 被銷毀了卻沒取消監聽。下次 Model 一變，已經死掉的元件還會被呼叫，去碰一個已經銷毀的 Label：輕則什麼都沒畫，重則直接丟錯。換場景換幾次，同一個事件就有好幾個死掉的監聽器在排隊。</li>
</ul>
<p>如果規則檔不能 import <code>'cc'</code>，就連 <code>EventTarget</code> 也不能用。自己寫一個有型別的小 emitter，十幾行，順便讓事件名稱和參數都受 TypeScript 檢查：</p>
<pre><code>// core/emitter.ts
export class Emitter&lt;E extends Record&lt;string, unknown&gt;&gt; {
  private map = new Map&lt;keyof E, Set&lt;(p: any) =&gt; void&gt;&gt;();

  on&lt;K extends keyof E&gt;(k: K, f: (p: E[K]) =&gt; void) {
    if (!this.map.has(k)) this.map.set(k, new Set());
    this.map.get(k)!.add(f);
    return () =&gt; { this.map.get(k)!.delete(f); };
  }
  emit&lt;K extends keyof E&gt;(k: K, p: E[K]) {
    this.map.get(k)?.forEach((f) =&gt; f(p));
  }
}
// const ev = new Emitter&lt;{ scored: number }&gt;();
// ev.emit('scored', 'five');   // error: not a number
</code></pre>

<h3><span class="badge lv3">專業</span>六、相依方向與資料夾結構</h3>
<p>專案長大之後，決定它好不好維護的，往往不是你用了哪個模式，而是 <b>import 的箭頭往哪裡指</b>。規則只有一條：箭頭一律指向核心。核心不認得任何外層，外層才認得核心。</p>
<figure class="figure"><svg viewBox="0 0 640 260" class="fg" style="width:100%;max-width:640px" role="img" aria-label="相依方向：view 資料夾 import app，app import core，net 實作 core 定義的介面；core 反過來 import 外層是禁止的">
<rect x="40" y="40" width="170" height="64" rx="8" class="fg-b alt"/><text x="125" y="66" text-anchor="middle" class="fg-t lg">view/</text><text x="125" y="88" text-anchor="middle" class="fg-t sm">Component：只畫、回報</text>
<rect x="40" y="156" width="170" height="64" rx="8" class="fg-b alt"/><text x="125" y="182" text-anchor="middle" class="fg-t lg">net/</text><text x="125" y="204" text-anchor="middle" class="fg-t sm">Net、MockNet</text>
<rect x="260" y="98" width="150" height="64" rx="8" class="fg-b"/><text x="335" y="124" text-anchor="middle" class="fg-t lg">app/</text><text x="335" y="146" text-anchor="middle" class="fg-t sm">store、狀態機</text>
<rect x="460" y="98" width="150" height="64" rx="8" class="fg-b hot"/><text x="535" y="124" text-anchor="middle" class="fg-t lg acc">core/</text><text x="535" y="146" text-anchor="middle" class="fg-t sm">規則、型別、介面</text>
<path d="M210 72 H235 V130 H252" class="fg-l on"/><polygon points="260,130 252,125.5 252,134.5" class="fg-a on"/>
<line x1="410" y1="130" x2="452" y2="130" class="fg-l on"/><polygon points="460,130 452,125.5 452,134.5" class="fg-a on"/><text x="435" y="122" text-anchor="middle" class="fg-t sm mono">import</text>
<path d="M210 188 H535 V170" class="fg-l on"/><polygon points="535,162 530.5,170 539.5,170" class="fg-a on"/><text x="372" y="182" text-anchor="middle" class="fg-t sm">實作 core 定的介面</text>
<path d="M535 98 V20 H125 V32" class="fg-l warm dash"/><polygon points="125,40 120.5,32 129.5,32" class="fg-a warm"/>
<text x="330" y="36" text-anchor="middle" class="fg-t sm warm">✕ core 不准反過來 import 外層</text>
<text x="320" y="248" text-anchor="middle" class="fg-t sm">箭頭＝誰 import 誰；只有 view/、net/ 可以 import 'cc'</text>
</svg><figcaption>綠色箭頭全部指向 core。只要有一條橘色的反向箭頭出現，core 就再也離不開引擎，也就沒辦法在 Node.js 裡測、沒辦法搬到伺服器。</figcaption></figure>
<p>具體排成資料夾，大概像這樣：</p>
<pre><code>assets/
  scenes/  prefabs/  textures/  audio/
  scripts/
    core/      規則、型別、牌堆：不准 import 'cc'
    app/       store、狀態機、把規則串成一局的流程
    net/       Net、MockNet、protocol.ts
    view/      Component：只畫、只回報點擊
    boot/      進入點：建立 store、選真的或假的 Net、把大家接起來
tests/         在 Node 跑的測試，放在 assets 外面
package.json   Vitest 之類的測試工具只裝在這裡
</code></pre>
<ul>
<li><b>core 定介面，外層去實作。</b>規則需要「送一個猜測給伺服器」時，不要 import <code>Net</code>，而是在 core 裡宣告一個 <code>interface GameNet</code>，由 net/ 去實作。這叫<b>相依反轉</b>（dependency inversion）：高層的規則不依賴低層的細節，兩邊都依賴同一個介面。</li>
<li><b>boot 是唯一「什麼都認得」的地方。</b>它決定用真的 <code>Net</code> 還是 <code>MockNet</code>、建好 store、交給各個 View。這個位置叫<b>組合根</b>（composition root）。接線集中在這裡，其他檔案就不必互相 new 來 new 去。</li>
<li><b>測試放在 <code>assets/</code> 外面。</b>Cocos 會把 <code>assets/</code> 底下的 .ts 全部當成遊戲腳本處理，測試檔放進去，就會跟著被編譯、被帶進建置。</li>
<li><b>讓機器守規則。</b>「core 不准 import 'cc'」寫在文件裡沒人會記得。在 CI 加一道檢查，違反就讓建置失敗：</li>
</ul>
<pre><code>if grep -rn "from 'cc" assets/scripts/core; then
  echo "core/ must not import from cc"; exit 1
fi
</code></pre>
<p>想做得更正式，ESLint 的 <code>no-restricted-imports</code> 規則也能做到，而且在編輯器裡當場畫紅線。</p>
<h4>core 裡可以用 Cocos 的 Vec3 嗎？</h4>
<p>這是真實專案常吵的題目。猜高低只有整數，當然不需要。可是動作遊戲的規則需要向量運算，硬是不 import <code>'cc'</code>，就得自己寫一套。常見的折衷：core 裡用自己定義的 <code>{ x: number; y: number }</code> 和幾個小函式，只在 View 裡轉成 <code>Vec3</code>。代價是多一次轉換，換來規則能在 Node.js 和伺服器上跑。值不值得，取決於你的規則以後會不會搬到伺服器。</p>

<h3><span class="badge lv3">專業</span>七、不開引擎就把規則測完</h3>
<p>core 不碰引擎，就能用一般的 Node.js 測試工具跑，例如 Vitest 或 Jest。一個測試檔長這樣：</p>
<pre><code>// tests/rules.test.ts
import { describe, it, expect } from 'vitest';
import { reduce, State, Guess }
  from '../assets/scripts/core/rules';

const empty: State =
  { deck: [], current: 0, score: 0, over: false };
const play = (deck: number[], ...gs: Guess[]) =&gt;
  gs.reduce((s, g) =&gt; reduce(s, { type: 'guess', guess: g }),
            reduce(empty, { type: 'start', deck }));

describe('Higher or Lower rules', () =&gt; {
  it('scores two and ends when the deck runs out', () =&gt; {
    const s = play([3, 9, 5], 'higher', 'lower');
    expect(s.score).toBe(2);
    expect(s.over).toBe(true);
  });
  it('treats an equal card as wrong', () =&gt; {
    expect(play([7, 7, 2], 'higher').over).toBe(true);
  });
  it('ignores guesses after the game is over', () =&gt; {
    const ended = play([3, 9, 5], 'lower');
    const more = play([3, 9, 5], 'lower', 'higher');
    expect(more).toEqual(ended);
  });
});
</code></pre>
<p>這種測試一個通常只要幾毫秒，幾百個加起來也是幾秒內的事，不用開編輯器、不用等場景載入。設定成存檔就自動跑，規則一改壞馬上知道。數量級的差別很重要：開遊戲手動測一個情況要一分鐘，你一天頂多測幾十個；機器一次測幾百個，你才敢放手重構。</p>
<h4>挑最會出錯的案例</h4>
<ul>
<li><b>邊界</b>：點數一樣、最後一張牌、1 和 13。</li>
<li><b>不可能的順序</b>：結束後再猜、還沒開局就猜。</li>
<li><b>不變量</b>（invariant）：不管玩家怎麼猜都一定成立的事，例如「分數不會超過猜的次數」「over 一旦是 true，就不會變回 false」。</li>
</ul>
<p>不變量最適合交給<b>屬性測試</b>（property-based testing）：你描述規則，工具自動產生幾百組隨機的牌堆和猜法，專門找反例；找到之後，還會把反例縮到最小再告訴你。JavaScript 最常用的是 fast-check（沿用上面的 <code>play</code>）：</p>
<pre><code>import fc from 'fast-check';

it('score never exceeds the number of guesses', () =&gt; {
  const deck = fc.array(fc.integer({ min: 1, max: 13 }),
                        { minLength: 2, maxLength: 52 });
  const guess = fc.constantFrom&lt;Guess&gt;('higher', 'lower');
  fc.assert(fc.property(deck, fc.array(guess),
    (d, gs) =&gt; play(d, ...gs).score &lt;= gs.length));
});
</code></pre>
<h4>把亂數變成可以重現</h4>
<p>洗牌不放在規則裡，而且要把亂數來源當參數傳進洗牌函式：</p>
<pre><code>export function makeDeck(rand = Math.random): number[] {
  const d: number[] = [];
  for (let v = 1; v &lt;= 13; v++) d.push(v, v, v, v);
  for (let i = d.length - 1; i &gt; 0; i--) {   // Fisher-Yates
    const j = Math.floor(rand() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}
</code></pre>
<p>遊戲裡用預設的 <code>Math.random</code>；測試裡傳一個用固定<b>種子</b>（seed）建立的亂數產生器，每次洗出來的牌都一樣。玩家回報「這局出現了五張 13」時，只要那局記下了種子，你就能在自己的電腦上一模一樣地重洗一次。</p>

<h3><span class="badge lv4">專家</span>八、把規則搬到伺服器</h3>
<p>到了連線版，「判定猜對猜錯」一定要搬到伺服器上（下一課會講為什麼）。規則寫成純函式之後，搬家有三條路：</p>
<figure class="figure"><svg viewBox="0 0 660 230" class="fg" style="width:100%;max-width:660px" role="img" aria-label="一份 core/rules.ts 同時被 Cocos 用戶端和 Node.js 伺服器 import；Go 伺服器共用不了程式碼，改成讀同一份黃金測試向量 vectors.json">
<rect x="230" y="16" width="180" height="52" rx="6" class="fg-b hot"/><text x="320" y="40" text-anchor="middle" class="fg-t mono acc">core/rules.ts</text><text x="320" y="58" text-anchor="middle" class="fg-t sm">一份規則</text>
<rect x="470" y="16" width="170" height="52" rx="6" class="fg-b warm"/><text x="555" y="40" text-anchor="middle" class="fg-t mono">vectors.json</text><text x="555" y="58" text-anchor="middle" class="fg-t sm">黃金測試向量</text>
<line x1="470" y1="42" x2="418" y2="42" class="fg-l"/><polygon points="410,42 418,37.5 418,46.5" class="fg-a"/><text x="440" y="34" text-anchor="middle" class="fg-t sm">也要過</text>
<rect x="20" y="150" width="190" height="60" rx="6" class="fg-b alt"/><text x="115" y="174" text-anchor="middle" class="fg-t">Cocos 用戶端</text><text x="115" y="194" text-anchor="middle" class="fg-t sm">模擬伺服器、預先播動畫</text>
<rect x="235" y="150" width="170" height="60" rx="6" class="fg-b alt"/><text x="320" y="174" text-anchor="middle" class="fg-t">Node.js 伺服器</text><text x="320" y="194" text-anchor="middle" class="fg-t sm">權威判定</text>
<rect x="470" y="150" width="170" height="60" rx="6" class="fg-b"/><text x="555" y="174" text-anchor="middle" class="fg-t">Go 伺服器</text><text x="555" y="194" text-anchor="middle" class="fg-t sm">重寫規則，跑同一份案例</text>
<path d="M270 68 V108 H115 V142" class="fg-l on"/><polygon points="115,150 110.5,142 119.5,142" class="fg-a on"/><text x="190" y="102" text-anchor="middle" class="fg-t sm mono">import</text>
<line x1="320" y1="68" x2="320" y2="142" class="fg-l on"/><polygon points="320,150 315.5,142 324.5,142" class="fg-a on"/><text x="328" y="112" class="fg-t sm mono">import</text>
<line x1="555" y1="68" x2="555" y2="142" class="fg-l alt"/><polygon points="555,150 550.5,142 559.5,142" class="fg-a alt"/><text x="563" y="112" class="fg-t sm">兩邊都要全過</text>
</svg><figcaption>同一種語言就共用程式碼；不同語言就共用測試案例。不管哪一種，規則的「標準答案」都只有一份。</figcaption></figure>
<ol>
<li><b>伺服器也是 TypeScript（Node.js）</b>：直接 import 同一份 <code>core/rules.ts</code>。用戶端那份不再「決定」，只拿來當模擬伺服器，或預先播動畫。好處是規則只有一份；代價是用戶端和伺服器要一起改版，部署要排好順序。</li>
<li><b>伺服器是 Go 或其他語言</b>：程式碼共用不了，就共用<b>測試案例</b>。把一組組「輸入和預期結果」存成 JSON，叫黃金測試向量（golden test vectors），兩邊的測試都讀同一個檔案，都要全部通過。規則一改，先改這個檔案，兩邊再各自修到綠燈。</li>
<li><b>用戶端完全不帶規則</b>：只顯示伺服器說的結果。最單純，但沒網路就沒辦法開發，所以通常還是保留一份規則給模擬伺服器用。</li>
</ol>
<pre><code>[
  { "deck": [3, 9, 5], "guesses": ["higher", "lower"],
    "score": 2, "over": true },
  { "deck": [7, 7, 2], "guesses": ["higher"],
    "score": 0, "over": true },
  { "deck": [1, 13, 1], "guesses": ["higher"],
    "score": 1, "over": false }
]
</code></pre>
<h4>伺服器的狀態和用戶端看到的狀態，不是同一個型別</h4>
<p>這是最多人踩、也最危險的一點。伺服器的 <code>State</code> 裡有整副牌；用戶端只該看到目前的牌、分數和是否結束。如果偷懶把伺服器的 state 整包 <code>JSON.stringify</code> 送出去，剩下的牌就全部攤在玩家的 Network 面板上。正確做法是寫一個明確的<b>投影</b>函式，只挑可以公開的欄位，再為它寫一個測試，確保 <code>deck</code> 永遠不會出現在輸出裡：</p>
<pre><code>export interface PublicState {
  current: number; score: number; over: boolean;
}
// a whitelist: name every field, never spread s
export const toPublic = (s: State): PublicState =&gt; ({
  current: s.current, score: s.score, over: s.over,
});
</code></pre>
<p>用白名單挑欄位，不要用 <code>{ ...s, deck: undefined }</code> 這種黑名單。哪天有人在 State 裡加了一個 <code>nextCard</code> 欄位，黑名單擋不住，白名單擋得住。</p>
<h4>確定性的細節</h4>
<ul>
<li>要能重播，<code>reduce</code> 裡就不能有 <code>Date.now()</code>、<code>Math.random()</code>，也不能讀全域變數。需要時間，就讓時間成為動作的一個欄位傳進來。</li>
<li>跨語言共用規則時，盡量只用整數。浮點數在不同語言、不同 CPU 上不保證每個位元都一樣：例如 Go 的語言規格允許編譯器把「先乘再加」合併成一道指令，結果可能差在最後一位；<code>Math.sin</code> 這類函式的實作也各家不同。卡牌、回合制遊戲用整數，就完全沒有這個問題。</li>
<li>JavaScript 的整數超過 2 的 53 次方就不精確了。分數、金額用整數的最小單位存；很長的 ID 用字串傳。</li>
</ul>
<h4>效能：每次回傳新物件，會不會太慢？</h4>
<p>猜高低一秒頂多幾個動作，複製一個小物件的成本可以忽略。但如果是每秒 60 次、每次幾百個單位在動的動作遊戲，每幀複製整個世界，就會產生大量垃圾，讓<b>垃圾回收</b>（GC）在戰鬥中突然卡一下。這時常見的折衷是：Model 內部直接修改陣列、不複製，但仍然守住「只有 Model 能改」「改完集中通知一次」這兩條。單向資料流守的是<b>方向</b>，不是「一定要不可變」。</p>

<h3>九、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>MVC 就是要有三個檔案、三個 class</td><td>重點是相依方向。規則可以是幾個純函式，View 可以只是一個元件，箭頭方向對就好。</td></tr>
<tr><td>用了事件就解耦了</td><td>事件把相依藏起來，沒有讓它消失。事件名稱和參數的形狀就是合約，改了一樣會壞，只是編譯器不會告訴你。</td></tr>
<tr><td>Model 就是一堆欄位</td><td>只有欄位、規則散在別處的 Model，叫「貧血模型」（anemic model）。規則要跟它保護的資料住在一起。</td></tr>
<tr><td>Cocos 改了欄位，畫面會自己更新</td><td>不會。Cocos 沒有響應式系統，要自己發通知，最好再合併成每幀一次。</td></tr>
<tr><td>要開遊戲測過才算數</td><td>規則用 Node.js 測，一次幾百個情況、幾秒鐘跑完；開遊戲是用來測畫面和手感的。</td></tr>
<tr><td>用戶端有一份 Model，伺服器就不用再檢查</td><td>用戶端的程式玩家改得了。伺服器要用自己的那份規則，重新判斷每一個請求。</td></tr>
</table>

<h3>十、跟你的工作連起來</h3>
<ul>
<li><b>Vue／Pinia</b>：store 的 state 和 actions，就是這一章的 Model 和 dispatch。把規則從元件搬進 store，再從 store 搬進純函式，元件測試會少一大半。</li>
<li><b>TypeScript</b>：動作用<b>可辨識聯集</b>（discriminated union）定義。開了 <code>strict</code>、函式又宣告了回傳型別時，<code>switch (a.type)</code> 漏寫一種情況，編譯器就會提醒你。</li>
<li><b>Node.js 後端</b>：同一份 core 在伺服器上跑，用戶端和伺服器共用型別定義，訊息格式不會兩邊各寫一份、各自走樣。</li>
<li><b>Go 後端</b>：共用不了程式，就共用黃金測試向量，CI 裡兩個專案都跑同一份 JSON。</li>
<li><b>Unity</b>：一樣的分法。規則寫成不繼承 <code>MonoBehaviour</code> 的一般 C# 類別，就能用 Unity Test Framework 的 Edit Mode 測試跑，不必進 Play Mode。</li>
<li><b>Docker／CI</b>：core 的測試只需要一個 Node.js 映像檔，不用安裝 Cocos 編輯器，任何 CI 機器都能跑。</li>
</ul>

<h3>十一、面試會怎麼問</h3>
<p>這些是前端、遊戲用戶端和全端職缺真的會問的題目。先出聲講一遍，再打開參考答案。</p>
<ol>
<li>「MVC、MVP、MVVM 差在哪裡？在遊戲引擎裡你會選哪一個？」</li>
<li>「單向資料流有什麼好處？代價是什麼？」</li>
<li>「什麼時候用事件，什麼時候直接呼叫？」</li>
<li>「遊戲邏輯要怎麼寫，才能不開引擎就測試？」</li>
<li>「用戶端和伺服器要用同一套規則，你會怎麼做？」</li>
<li>「Vue 3 的響應式怎麼運作？為什麼連改五次只重畫一次？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>三者都把狀態和規則放在 Model，差在中間層跟 View 的關係。MVC 裡 View 觀察 Model，收到通知後自己去讀；MVP 的被動 View 完全不認得 Model，由 Presenter 讀出數值、呼叫 View 的方法去畫，所以 View 可以換成假物件，最好測；MVVM 由綁定引擎自動把 ViewModel 的狀態同步到 View，Vue 就是例子。Cocos、Unity 沒有內建資料綁定，所以我通常用 MVP：View 只有 draw、show 這類方法和點擊事件，Presenter 聽 Model 的事件、決定畫什麼。名字不重要，重要的是 import 方向朝內、規則只有一份。</li>
<li>好處是狀態只有一份、只有一個地方能改，畫面一定和狀態一致；所有改變都經過同一扇門，可以記錄、重播、做時光倒流除錯；規則寫成純函式，可以單獨測試。代價是要多寫動作型別和 reducer，小功能也得繞一圈；每次產生新物件，在高頻率更新的遊戲裡會增加 GC 壓力，這時會折衷成在 Model 內部原地修改，但仍守住單一寫入者和集中通知。</li>
<li>往下呼叫、往上發事件。上層擁有下層、知道它是誰，就直接呼叫，追程式和型別檢查都容易；下層要通知它不認得的上層，或一件事有好幾個聽眾，就發事件。兄弟元件之間不直接互叫，透過共同的上層。用事件一定要在元件銷毀時取消監聽，否則壽命較長的 Model 會一直呼叫已經銷毀的 View；在 Cocos 裡，註冊時傳 target，再在 onDestroy 呼叫 targetOff(this)。</li>
<li>把規則寫成不 import 引擎的純 TypeScript：輸入是目前狀態和動作，輸出是新狀態。時間、亂數、網路這些副作用從外面傳進來，例如牌堆或亂數產生器當參數、時間到由外殼送一個動作。測試放在 assets 外面，用 Vitest 或 Jest 在 Node.js 跑，涵蓋邊界情況和不變量，必要時加屬性測試。CI 再加一道檢查，禁止 core 資料夾 import 'cc'。</li>
<li>伺服器是 Node.js 的話，直接共用同一個 TypeScript 模組；用戶端那份只拿來做模擬伺服器或預先播動畫，結果以伺服器為準。伺服器是其他語言，就共用黃金測試向量，兩邊的測試跑同一份 JSON。另外，伺服器的完整狀態和公開狀態要分成兩個型別，用白名單的投影函式送出，並測試隱藏資訊不會出現在輸出裡。規則裡避開浮點數和非確定性的呼叫，才能重播、才能跨語言一致。</li>
<li>reactive 回傳一個 Proxy。元件渲染時讀到的屬性，會在 get 裡被 track，記錄成依賴；寫入時 set 會 trigger，找出依賴這個屬性的 effect。元件更新不會立刻執行，而是排進排程器的佇列，同一個元件只排一次，等目前的同步程式結束後在微任務裡統一執行，所以改多次只重畫一次；nextTick 等的就是這個佇列清空。Cocos 沒有這套機制，要自己發通知，再用髒旗標在 lateUpdate 合併成每幀一次。</li>
</ol>
</details>

<h3>十二、練功題（做得出來才算真的懂）</h3>
<ol>
<li>用這一章的 <code>reduce</code>，牌堆 [5, 2, 2, 8]，依序猜 lower、lower、higher。寫出每一步之後的 current、score、over。</li>
<li>有人在 View 裡這樣寫：<code>onLoad() { GameModel.shared.events.on('changed', this.redraw, this); }</code>，沒有 <code>onDestroy</code>。玩家從大廳進遊戲、回大廳、再進遊戲。下一次 Model 改變時會發生什麼事？怎麼修？</li>
<li>把上一課的 <code>GameController</code> 改寫成 MVP：寫出 View 要實作的介面，以及一個不用 Cocos 就能跑的假 View，用來測 Presenter 有沒有在猜完之後叫 View 重畫。</li>
<li>規則多了一條「10 秒內沒猜，這局就輸」。不讓 core 碰時間的前提下，你有哪兩種寫法？各有什麼取捨？</li>
<li>為 <code>toPublic</code> 寫一個測試，保證不管 State 以後多了什麼欄位，輸出都只有那三個公開欄位。</li>
<li>有人用 <code>select(store, (s) =&gt; s.deck.slice(0, 1), ...)</code> 想監聽「下一張牌」。為什麼它每次通知都會觸發？怎麼改？（先不管「下一張牌根本不該在用戶端」這件事。）</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>開局：current 5、score 0、deck [2, 2, 8]。猜 lower：2 &lt; 5 猜對，current 2、score 1、over false。再猜 lower：2 &lt; 2 不成立，猜錯，current 2、score 1、over true。猜 higher：已經結束，原封不動。最後 1 分。</li>
<li>前一次進遊戲的那個 View 已經被銷毀，但它的 redraw 還掛在一個跨場景的 Model 上。Model 一變，兩個監聽器都會被呼叫，其中一個是死掉的元件，去碰已經銷毀的 Label，輕則沒反應，重則丟錯；進出越多次，死掉的監聽器越多。修法：加上 <code>onDestroy() { GameModel.shared.events.targetOff(this); }</code>。</li>
<li>介面例如 <code>interface GameViewPort { draw(card: number, score: number, over: boolean): void; setGuessEnabled(on: boolean): void; }</code>。假 View 是一個普通物件，把每次 draw 的參數推進陣列：<code>const calls: unknown[] = []; const fake: GameViewPort = { draw: (...a) =&gt; calls.push(a), setGuessEnabled: () =&gt; {} };</code>。Presenter 的建構子收 <code>GameViewPort</code> 而不是 Cocos 元件，測試裡傳 fake，猜一次之後檢查 calls 的最後一筆是不是新的牌和分數。</li>
<li>寫法一：外殼的計時器時間到時，dispatch 一個 <code>{ type: 'timeUp' }</code>，規則只負責「收到 timeUp 就結束」。簡單，但「多久」這件事住在外殼裡。寫法二：每個動作都帶 <code>at</code>（毫秒），state 存截止時間，規則自己比較 <code>a.at &gt; s.deadline</code>。規則完整、可重播，但每個動作都多一個欄位，而且「時間到了卻沒有任何動作」時，仍然需要外殼送一個動作來觸發結束。連線版兩者都由伺服器負責，用戶端只顯示。</li>
<li>例如：<code>expect(Object.keys(toPublic(s)).sort()).toEqual(['current', 'over', 'score']);</code>，s 用一個欄位塞得滿滿的 State。也可以再加一行 <code>expect(JSON.stringify(toPublic(s))).not.toContain('deck')</code>。用 keys 比對，以後有人在投影裡多放一個欄位，測試就會擋下來，逼他想清楚那個欄位能不能公開。</li>
<li><code>slice</code> 每次都回傳一個新陣列，<code>!==</code> 比的是參照，所以永遠「不一樣」。改法：選出原始值而不是陣列，例如 <code>(s) =&gt; s.deck[0]</code>；或者在 select 裡改用內容比較（例如比較每個元素）。原則是選擇器要回傳穩定的值，不要每次都造一個新物件。</li>
</ol>
</details>

<h3>十三、想再挖深</h3>
<ul>
<li><b>Robert Nystrom《Game Programming Patterns》</b>（<a href="https://gameprogrammingpatterns.com/">gameprogrammingpatterns.com</a>，線上免費閱讀）：Observer、Event Queue、Component 三章，正好對應這一章的事件、佇列和拆元件，而且全是遊戲的例子。</li>
<li><b>Martin Fowler〈GUI Architectures〉</b>（<a href="https://martinfowler.com/eaaDev/uiArchs.html">martinfowler.com</a>）：從 Smalltalk 的 MVC 一路講到 MVP 和被動 View，把「誰認得誰」講得最清楚的一篇。</li>
<li><b>Vue 官方文件〈深入響應式系統〉</b>（Reactivity in Depth，<a href="https://vuejs.org/guide/extras/reactivity-in-depth.html">vuejs.org</a>）：track、trigger 和 Proxy 的官方說明，讀完就知道 Cocos 裡少了什麼。</li>
<li><b>Redux 官方文件</b>（<a href="https://redux.js.org/">redux.js.org</a>）：reducer、單向資料流、為什麼要不可變。觀念可以直接搬進遊戲。</li>
<li><b>fast-check</b>（<a href="https://github.com/dubzzz/fast-check">github.com/dubzzz/fast-check</a>）：JavaScript 的屬性測試函式庫，文件裡有很多「描述規則、讓工具找反例」的範例。</li>
</ul>
` });
