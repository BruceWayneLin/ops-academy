MZ({
  id: 'cc3',
  title: '真正遊戲的架構',
  time: '2 到 3 週',
  blurb: '怎麼把遊戲組織好，讓它越做越大也不會垮：Model、View、Controller，每一局用一個狀態機管，跟伺服器對話，建置出貨，找出 bug。最後你會從空專案做出一款「猜高低」。',
  lessons: [
  {
    id: 'cc-mvc',
    title: 'Model、View、Controller：別把規則塞進按鈕',
    body: `
<p>每個遊戲一開始都很小。你加了一顆 Higher 按鈕、掛上一個腳本，在它的點擊處理函式裡讀出畫面上的牌、抽一張新的、比大小、更新分數標籤。能動。然後遊戲慢慢長大，這一個處理函式就變成所有問題的源頭。</p>
<p>這一課要講的，是把遊戲拆成三塊，讓它長大之後還能好好運作。這種拆法叫 <b>Model、View、Controller</b>，簡稱 MVC。整個模組都用同一個例子：<b>猜高低</b>（Higher or Lower）。桌上有一張牌翻開，玩家猜下一張會比較大還是比較小，每猜對一次得一分。猜錯遊戲就結束，點數一樣也算猜錯。</p>
<h3>為什麼規則放在按鈕裡會垮</h3>
<p>這是大多數人寫的第一版，掛在 Higher 按鈕上。</p>
<pre><code>// HigherButton.ts: the rule lives inside a button (avoid this)
onClick() {
  const now = Number(this.cardLabel.string);
  const next = Math.ceil(Math.random() * 13);
  if (next &gt; now) {
    this.scoreLabel.string = String(Number(this.scoreLabel.string) + 1);
  }
  this.cardLabel.string = String(next);
}
</code></pre>
<p>只看一天的話，這段程式沒什麼問題。但看看接下來幾週會發生什麼事：</p>
<table>
<tr><th>新需求</th><th>這段程式會變成怎樣</th></tr>
<tr><td>加一顆 Lower 按鈕</td><td>同一段程式被複製到第二個腳本，只改一個符號。規則從此有兩份，慢慢就對不起來了。</td></tr>
<tr><td>加翻牌動畫</td><td>牌翻完之前標籤不能變，所以點擊處理函式開始要等動畫。</td></tr>
<tr><td>加 10 秒倒數</td><td>計時器也需要同一條規則，只好伸手進按鈕腳本裡拿，或是把規則再抄第三份。</td></tr>
<tr><td>改由伺服器決定下一張牌</td><td>規則反正得搬出按鈕，可是沒有任何地方準備好接手。</td></tr>
<tr><td>加結算畫面</td><td>分數只存在某個標籤的文字裡，結算畫面只好從另一個節點把它讀回來。</td></tr>
</table>
<p>根本的問題是：遊戲的<b>狀態</b>（state，例如目前的牌、分數）直接存在畫面上，而規則散落在每個會被點擊的地方。MVC 讓這兩樣東西各有一個家。背後的通用觀念是「每一塊只負責一件事」，叫做關注點分離（separation of concerns）。</p>
<h3>三個部分</h3>
<div class="tiers"><b>Model</b><div><span class="box hot">狀態<small>目前的牌、分數、是否結束</small></span><span class="box hot">規則<small>這次猜對了嗎？</small></span></div><b>Controller</b><div><span class="box">接線<small>同時聽兩邊</small></span><span class="box">順序<small>什麼事接在什麼事後面</small></span></div><b>View</b><div><span class="box">節點和元件<small>Label、Sprite、Button</small></span><span class="box">回報點擊<small>發出「guess」</small></span></div></div>
<ul>
<li><b>Model</b>（模型）負責狀態和規則。它就是單純的 TypeScript，對節點、標籤、畫面一無所知。就算沒有場景，它也能跑。</li>
<li><b>View</b>（視圖）負責把別人叫它畫的東西畫出來，並回報玩家做了什麼。它從不做決定。如果 View 腳本裡出現跟分數有關的 <code>if</code>，就表示有規則從 Model 漏出來了。</li>
<li><b>Controller</b>（控制器）把兩邊接起來。它聽 View 傳來的點擊、呼叫 Model，並在 Model 改變時叫 View 重畫。</li>
</ul>
<p>拿餐廳來比喻。廚房（Model）負責煮菜，也決定一道菜是什麼。用餐區（View）是客人看東西、指著菜單點菜的地方。服務生（Controller）把點單送進去、把餐點端出來。客人從不走進廚房，廚師也從不出來擺桌。</p>
<h3>單向資料流（one-way data flow）</h3>
<p>這種拆法最重要的規則，是方向。資料只繞一個圈，從不抄捷徑：</p>
<div class="flow"><span class="box">點擊<small>View 回報「higher」</small></span><span class="arr">&rarr;</span><span class="box">Controller<small>呼叫 model.guess()</small></span><span class="arr">&rarr;</span><span class="box hot">Model 改變<small>新的牌、新的分數</small></span><span class="arr">&rarr;</span><span class="box">事件<small>「changed」</small></span><span class="arr">&rarr;</span><span class="box">View 重畫<small>照 Model 的內容</small></span></div>
<p>按鈕被按下時，View 不會去動分數標籤。它等 Model 發出事件（event）說「有東西變了」，再把 Model 現在的內容畫出來。所以畫面不可能跟狀態對不上，因為真相只存在一個地方。</p>
<h3>拆開之後的程式</h3>
<p><b>第一步：Model 的狀態。</b>它只 import 了 <code>EventTarget</code>，一個可以收發「有名字的事件」的小物件，它不是節點。</p>
<pre><code>import { EventTarget } from 'cc';
export type Guess = 'higher' | 'lower';

export class GameModel {
  readonly events = new EventTarget();
  private deck: number[] = [];
  current = 0;
  score = 0;
  over = false;

  newGame(deck: number[]) {
    this.deck = deck.slice();
    this.current = this.deck.shift()!;
    this.score = 0;
    this.over = false;
    this.events.emit('changed');
  }
</code></pre>
<p><b>第二步：規則</b>，寫在同一個 class 裡。整個遊戲只有這裡知道什麼叫「猜對」。</p>
<pre><code>  guess(g: Guess) {
    if (this.over) return;
    const next = this.deck.shift()!;
    const right = g === 'higher' ? next &gt; this.current : next &lt; this.current;
    this.current = next;
    if (right) this.score++;
    this.over = !right || this.deck.length === 0;
    this.events.emit('changed');
  }
}
</code></pre>
<p><b>第三步：View。</b>兩顆 Button 透過它們在 Inspector 裡設定的 Click Events 呼叫這兩個方法。View 只負責把點擊轉交出去，被叫到的時候再畫。</p>
<pre><code>import { _decorator, Component, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameView')
export class GameView extends Component {
  @property(Label) card: Label | null = null;
  @property(Label) score: Label | null = null;

  clickHigher() { this.node.emit('guess', 'higher'); }
  clickLower() { this.node.emit('guess', 'lower'); }

  draw(card: number, score: number, over: boolean) {
    this.card!.string = String(card);
    this.score!.string = (over ? 'Final score: ' : 'Score: ') + score;
  }
}
</code></pre>
<p><b>第四步：Controller</b> 把它們接起來。<code>makeDeck()</code> 會回傳一個洗好的陣列，裡面是 52 張牌的點數，1 到 13 各四張；總結專題那一課會寫它。</p>
<pre><code>import { _decorator, Component } from 'cc';
import { GameModel, Guess } from './GameModel';
import { GameView } from './GameView';
import { makeDeck } from './Deck';
const { ccclass, property } = _decorator;

@ccclass('GameController')
export class GameController extends Component {
  @property(GameView) view: GameView | null = null;
  private model = new GameModel();

  onLoad() {
    this.model.events.on('changed', this.redraw, this);
    this.view!.node.on('guess', this.onGuess, this);
  }
  start() { this.model.newGame(makeDeck()); }
  private onGuess(g: Guess) { this.model.guess(g); }
  private redraw() { this.view!.draw(this.model.current, this.model.score, this.model.over); }
}
</code></pre>
<p>現在回頭看那張需求表。Lower 按鈕只是 View 裡多一行，規則完全不用動。計時器就是時間到時，由 Controller 去呼叫 Model。結算畫面是第二個 View，讀同一個 Model。等伺服器加進來（跟伺服器對話那一課），只有 <code>guess()</code> 裡面要改。</p>
<h3>跟 Vue 比較</h3>
<table>
<tr><th>在 Vue 裡</th><th>在這個 Cocos 拆法裡</th></tr>
<tr><td>Pinia（或 Vuex）store 的 state</td><td>Model 的欄位：<code>current</code>、<code>score</code>、<code>over</code></td></tr>
<tr><td>store 的 actions</td><td>Model 的方法，例如 <code>guess()</code></td></tr>
<tr><td>元件的 template</td><td>View：節點、Label、Sprite</td></tr>
<tr><td>子元件呼叫 <code>emit('click')</code></td><td>View 呼叫 <code>this.node.emit('guess', 'higher')</code></td></tr>
<tr><td>把 store 接到子元件上的那個頁面元件</td><td>Controller</td></tr>
<tr><td>響應式系統自動幫你重畫 template</td><td>沒有東西會自己重畫。Model 發出事件，View 刻意去重畫。</td></tr>
</table>
<p>最後一列是最大的差別。Cocos 沒有響應式（reactivity）。在 Vue 裡你改 <code>store.score</code>，畫面就跟著變。在 Cocos 裡改 <code>model.score</code>，畫面上什麼都不會發生，直到有人發出事件、另一個人在聽。所以上面那個圈才會把「事件」這一步畫出來：在 Vue 裡它被藏起來了，在這裡你要自己寫。</p>
<h3>深入一點：事件要切多細？</h3>
<p>一開始用一個 <code>changed</code> 事件，搭配一個什麼都重畫的 View 就好。簡單，而且不會不同步。只有當 View 需要知道<em>到底是什麼</em>變了，才把它拆成更細的事件，例如 <code>scoreChanged</code> 和 <code>cardRevealed</code>：比方說要讓分數一路跳上去，或是只翻新的那張牌。用事件參數傳 View 需要的資料，永遠不要傳節點。</p>
<h3>深入一點：測試 Model</h3>
<p>因為 Model 的牌堆是從參數傳進來的，你可以塞一副自己挑的牌給它。用 <code>[3, 9, 5]</code> 的話，第一張是 3，所以猜 higher 一定得一分，接著猜 lower 一定再得一分，然後遊戲結束。如果想在 Cocos 之外、用 Node 的測試工具跑這種檢查，就把 <code>EventTarget</code> 換成自己寫的十行小 emitter，讓這個檔案完全不 import <code>'cc'</code> 的東西。</p>
<p>你也會聽到 MVP 和 MVVM 這些名字。它們差在「誰跟誰說話」。它們跟 MVC 共通的，就是這一課的核心觀念：狀態和規則要跟畫面分開住。</p>`,
    tryNote: '在 Cocos 專案的預覽開著時，貼到瀏覽器的主控台執行。',
    try: [
      'Canvas 底下的每一個元件，列出類別名稱。不是 cc. 開頭的就是你自己的腳本。逐一問自己：它是負責畫、負責決定，還是負責接線？',
      '場景裡的每一顆按鈕。逐一找出點擊時會執行的程式，看它是不是自己就改了遊戲狀態。',
      '猜高低專案、而且 GameController 掛在 Canvas 上時：這就是 Model。它的欄位就是整個遊戲的狀態，完全看不到任何節點。'
    ],
    own: `挑一個你工作上的遊戲或 app 畫面。把它顯示的每一份狀態（數字、旗標、清單）列出來，並在旁邊寫下它現在存在哪裡：在某個標籤裡、在某個元件的欄位裡，還是在共用的 store 裡。接著畫出拆法：哪些欄位該進 Model、哪些腳本是純 View、Controller 要聽哪些東西。先不要改任何程式。光是這張清單，通常就看得出 bug 是從哪裡來的。`,
    quiz: [
      { q: "在 MVC 的拆法裡，「猜 higher 有沒有猜對」是哪一塊決定的？",
        a: ["Higher 按鈕的腳本", "View，在它重畫的時候", "Model", "Controller，靠讀標籤上的字"],
        why: "規則住在 Model，只有一個地方。View 只負責畫和回報點擊，Controller 只負責接線。" },
      { q: "玩家按下 Higher。分數標籤應該在什麼時候變？",
        a: ["馬上在按鈕的點擊處理函式裡改，感覺比較快", "等 Model 改變並發出事件之後，View 照 Model 重畫的時候", "只有在場景重新載入的時候", "Controller 從標籤讀到新數值的時候"],
        why: "資料只往一個方向流：點擊、Controller、Model、事件、重畫。標籤永遠顯示 Model 裡的內容。" },
      { q: "你的程式改了 model.score，Cocos 會在畫面上做什麼？",
        a: ["什麼都不做，直到有人發出事件、View 重畫", "像 Vue 一樣自動重畫分數標籤", "丟出錯誤，因為 Model 沒有節點", "把分數存進場景檔"],
        why: "Cocos 沒有響應式系統。Vue 幫你藏起來的「事件」那一步，在這裡要自己寫。" }
    ]
  },
  {
    id: 'cc-state',
    title: '用狀態機管好一局',
    body: `
<p>觀察一台自動販賣機。它在等待的時候收硬幣。正在掉飲料的時候，按什麼按鈕都沒用。在找零的時候，它不會再收硬幣。它永遠只處在一種情況裡，而那個情況決定了哪些按鈕有意義。這就是<b>狀態機</b>（state machine）：一份固定的<b>狀態</b>（state）清單，任何時刻只有其中一個是「目前的」，再加上一份固定的清單，列出狀態之間允許的移動，叫做<b>轉換</b>（transition）。</p>
<p>猜高低（Higher or Lower）的一局也是這樣運作。這一課要做出管一局遊戲的狀態機。</p>
<h3>它解決什麼問題</h3>
<p>沒有狀態機的話，遊戲會累積一堆旗標：<code>isDealing</code>、<code>isRevealing</code>、<code>canClick</code>、<code>gameOver</code>。四個 true／false 旗標會組出 16 種組合，大部分根本不合理：同時在發牌又在翻牌，或是遊戲已經結束卻還能點。每一張 bug 回報最後都變成「我們當時是哪一種組合？」。狀態機用一個變數取代全部的旗標，這個變數只會是五個名字之一。不可能的組合，連寫都寫不出來。</p>
<h3>一局裡的狀態</h3>
<div class="flow"><span class="box">waiting<small>顯示 Play 按鈕</small></span><span class="arr">按 Play &rarr;</span><span class="box">dealing<small>第一張牌送來</small></span><span class="arr">&rarr;</span><span class="box hot">guessing<small>Higher 和 Lower 可以按</small></span><span class="arr">猜 &rarr;</span><span class="box">revealing<small>下一張牌翻開</small></span><span class="arr">猜錯 &rarr;</span><span class="box">result<small>最後分數</small></span><span class="arr">&rarr; waiting</span></div>
<div class="flow"><span class="box">revealing</span><span class="arr">猜對 &rarr;</span><span class="box hot">guessing<small>剛翻開的牌變成目前的牌</small></span></div>
<p>第二行就是讓遊戲成立的那個迴圈：每猜對一次就回到 guessing，換成新的目前牌。猜錯，或是牌堆空了，就往結算走。</p>
<h3>每個狀態要做什麼</h3>
<table>
<tr><th>狀態</th><th>進入時</th><th>離開時</th><th>計時器（timer）</th><th>可以去</th></tr>
<tr><td>waiting</td><td>顯示 Play 按鈕</td><td>把它藏起來</td><td>無</td><td>dealing</td></tr>
<tr><td>dealing</td><td>拿到第一張牌，播發牌動畫</td><td>無</td><td>5 秒後放棄</td><td>guessing；失敗就回 waiting</td></tr>
<tr><td>guessing</td><td>打開 Higher 和 Lower，開始倒數</td><td>把兩顆都關掉，停止倒數</td><td>10 秒，時間到這局就輸了</td><td>revealing、result</td></tr>
<tr><td>revealing</td><td>翻開下一張牌，更新分數</td><td>無</td><td>翻牌動畫要多久就多久</td><td>guessing、result</td></tr>
<tr><td>result</td><td>顯示最後分數</td><td>把它藏起來</td><td>3 秒，或點一下</td><td>waiting</td></tr>
</table>
<p><b>進入</b>（enter）和<b>離開</b>（exit）是一個狀態可以做事的兩個時間點。進入時，把這個狀態需要的東西全部準備好。離開時，把不該留下來的東西收掉，最重要的就是它的計時器。正是這種一進一出的配對，才不會讓上一個狀態的殘渣漏進下一個狀態。</p>
<h3>動手做</h3>
<p><b>第一步：把允許的轉換寫成資料。</b></p>
<pre><code>export type Phase = 'waiting' | 'dealing' | 'guessing' | 'revealing' | 'result';

const NEXT: Record&lt;Phase, Phase[]&gt; = {
  waiting: ['dealing'],
  dealing: ['guessing', 'waiting'],
  guessing: ['revealing', 'result'],
  revealing: ['guessing', 'result'],
  result: ['waiting'],
};
</code></pre>
<p><b>第二步：狀態機本體</b>，寫在同一個檔案裡。每個狀態有一個處理器，裡面有 <code>enter</code> 和 <code>exit</code>。<code>go()</code> 會拒絕任何不在表上的移動。<code>jump()</code> 則跳過檢查，留給後面會講到的一種特殊情況。</p>
<pre><code>export interface PhaseHandler { enter(data?: unknown): void; exit(): void; }

export class RoundFsm {
  phase: Phase = 'waiting';
  constructor(private handlers: Record&lt;Phase, PhaseHandler&gt;) { handlers.waiting.enter(); }

  go(to: Phase, data?: unknown): boolean {
    if (!NEXT[this.phase].includes(to)) {
      console.warn('blocked: ' + this.phase + ' -&gt; ' + to);
      return false;
    }
    this.jump(to, data);
    return true;
  }
  jump(to: Phase, data?: unknown) {
    this.handlers[this.phase].exit();
    this.phase = to;
    this.handlers[to].enter(data);
  }
}
</code></pre>
<p><b>第三步：一個處理器</b>，寫在 Controller 裡。計時器在進入時啟動，離開時一定移除。<code>setGuessEnabled()</code> 是 View 上的一個小方法，負責設定兩顆 Button 的 <code>interactable</code>。狀態機要在 <code>onLoad</code> 裡建立，等五個處理器都存在之後再建。</p>
<pre><code>private guessing: PhaseHandler = {
  enter: () =&gt; {
    this.view!.setGuessEnabled(true);
    this.scheduleOnce(this.onTimeUp, 10);
  },
  exit: () =&gt; {
    this.view!.setGuessEnabled(false);
    this.unschedule(this.onTimeUp);
  },
};

private onTimeUp() { this.fsm.go('result'); }
</code></pre>
<h3>在錯的狀態收到點擊</h3>
<p>玩家會連點兩下、會在動畫播到一半時亂點、會在按鈕被關掉的前一幀按下去。在 guessing 以外把按鈕關掉是禮貌，但不是防線。真正的防線是一道<b>防護條件</b>（guard）：點擊處理函式最上面的一行，先檢查狀態。</p>
<pre><code>private onGuess(g: Guess) {
  if (this.fsm.phase !== 'guessing') return;   // ignore clicks in any other state
  this.fsm.go('revealing', g);
}
</code></pre>
<p>第一下點擊就把這局推進到 revealing，所以連點的第二下會發現狀態不對，直接被忽略。一次猜測最多一分，手指再快也一樣。同樣的規則也適用在所有可能晚到的東西：計時器、網路訊息、動畫播完的回呼。每一個在動手之前都要先問：「我還在我該在的那個狀態嗎？」</p>
<h3>一局打到一半時重新連線</h3>
<p>假設手機在 guessing 的時候斷訊八秒。重新連上之後，用戶端不能從頭再跑一遍 waiting、dealing、guessing。它要問伺服器這局現在進行到哪裡，拿回一份<b>快照</b>（snapshot），例如：</p>
<pre><code>{ "phase": "guessing", "current": 9, "score": 4, "secondsLeft": 6 }
</code></pre>
<p>然後用 <code>fsm.jump(snap.phase, snap)</code> 直接跳過去。這就是 <code>jump()</code> 存在的理由。前提是每個狀態的 enter 都只靠資料就能把整個畫面建出來：guessing 的 enter 要顯示 9 這張牌、4 分，倒數從 6 開始。如果某個 enter 假設「dealing 已經把牌放到桌上了」，重新連線時就會壞掉。把每一個 enter 都寫成「玩家剛剛才到」的樣子。</p>
<h3>深入一點：時鐘歸誰管</h3>
<p>上面的離線版本，是由用戶端自己的計時器結束這一局。換成對著伺服器玩的時候，伺服器的計時器才是真的，用戶端的倒數只是顯示。如果兩邊都會結束這一局，慢吞吞的手機和伺服器，就可能對「最後一秒的猜測到底算不算」有不同意見。所以用戶端只顯示倒數然後等，由伺服器宣布時間到。這也是為什麼快照傳的是 <code>secondsLeft</code>，而不是某個時鐘時間：手機的時鐘可能差好幾分鐘，但「再六秒」在哪裡都一樣。</p>
<h3>深入一點：狀態機裡面還有狀態機</h3>
<p>真正的遊戲會把狀態機一層套一層。整個 app 有自己的狀態（載入中、大廳、遊戲中、斷線），一局的狀態機只在「遊戲中」裡面跑。設定面板可以蓋在上面打開，而這一局完全不會察覺。每個狀態機都保持小小的，讓外層去啟動、停止內層，不要做一個有四十個狀態的大狀態機。</p>
<h3>跟 Vue 比較</h3>
<p>在 Vue 裡，你可能會用好幾個布林值配 <code>v-if</code> 來控制一個頁面。狀態機就像一個 <code>phase</code> ref，每個值各配一個 <code>v-if</code>，差別只有一個：在 Vue 裡任何程式都能把它設成任何值，而 <code>go()</code> 會拒絕不在表上的移動。這個拒絕，加上它印出來的警告，就是讓 bug 提早被抓到的關鍵。</p>`,
    tryNote: '在你的猜高低專案預覽開著、而且 GameController 掛在 Canvas 上時，貼到瀏覽器的主控台執行。',
    try: [
      '這一局現在所在的狀態。在一局的每個階段各跑一次看看。',
      '從 waiting 不允許走這一步。它會回傳 false，並印出 blocked 警告。',
      '假裝你剛重新連上線。如果每個 enter 都靠資料建畫面，你會看到 7 這張牌、3 分，以及剩五秒的倒數。'
    ],
    own: `在工作上找一個畫面，它用兩個以上的 true／false 旗標一起描述「現在發生什麼事」，例如載入中、編輯中、儲存中。把真的會出現的組合全部寫下來，每一種取一個名字，再畫出它們之間的箭頭。然後回想一張跟這個畫面有關的 bug 回報，找出是少了哪一條箭頭，或是哪一種組合本來就不該出現。`,
    quiz: [
      { q: "在 revealing 的時候，玩家點了兩下 Higher。應該發生什麼事？",
        a: ["兩下都得分，因為玩家手很快", "這兩下先存起來，留給下一次 guessing", "什麼都不會發生：點擊處理函式看到這局不在 guessing，就忽略它們", "遊戲丟出錯誤"],
        why: "點擊要先對照目前的狀態。在 guessing 以外，猜測沒有任何意義。" },
      { q: "為什麼一個狀態的 exit 一定要移除它的 enter 啟動的計時器？",
        a: ["計時器很吃記憶體", "不然計時器可能晚一點在別的狀態觸發，對一局已經往前走的遊戲動手", "Cocos 一次只允許一個計時器", "因為 exit 比 enter 先跑"],
        why: "enter 和 exit 是成對的。enter 開了什麼，exit 就關掉什麼，這樣才不會漏到下一個狀態。" },
      { q: "一局打到一半重新連線後，伺服器說這局在 guessing。用戶端該怎麼做？",
        a: ["直接跳到 guessing，用快照把那個畫面建出來", "從頭再跑一次 waiting、dealing、guessing", "請玩家開一局新遊戲", "停在斷線之前的那個狀態"],
        why: "伺服器的快照就是真相。jump() 直接跳過去，而靠資料寫成的 enter 會把畫面重建出來。" }
    ]
  },
  {
    id: 'cc-net',
    title: '跟伺服器對話',
    body: `
<p>到目前為止，都是 Model 在決定猜對還是猜錯。在真正的遊戲裡，這件事不能留在手機上。用戶端決定的任何東西，玩家都改得了：改記憶體，或是送假的訊息。所以下一張牌和分數要由<b>伺服器</b>（server）提供，用戶端則變成一個「把伺服器說的話好好顯示出來」的角色。</p>
<h3>兩種說話方式</h3>
<p><b>HTTP</b> 像是寄一封信、收到一封回信。你問一個問題，得到一個答案，這次往來就結束了。<b>WebSocket</b> 像是一通一直不掛斷的電話：接通之後，任何一方隨時都能開口，不用每講一句就重撥一次。</p>
<table>
<tr><th></th><th>HTTP</th><th>WebSocket</th></tr>
<tr><td>形式</td><td>一個請求（request）、一個回應，結束</td><td>一條長長的連線，訊息雙向來回</td></tr>
<tr><td>伺服器能先開口嗎？</td><td>不能，它只能回答。</td><td>可以，隨時都行</td></tr>
<tr><td>每則訊息的成本</td><td>每個請求都帶完整的標頭</td><td>連上之後只要幾個位元組</td></tr>
<tr><td>適合用在</td><td>登入、載入個人資料、排行榜、商店</td><td>正在進行的一局：猜測、翻牌、計時</td></tr>
</table>
<p>大部分遊戲兩種都用：開始玩之前和之後用 HTTP，玩的過程中用一條 WebSocket。在 Cocos 的網頁建置裡，<code>fetch</code> 和 <code>WebSocket</code> 就是瀏覽器原本的那個，跟在 Vue app 裡完全一樣。</p>
<h3>兩種訊息</h3>
<p>WebSocket 打開之後，上面會跑兩種不同的東西，用戶端必須分得出來。</p>
<ul>
<li><b>回覆</b>（reply）是在回答用戶端問過的事。「開一局」會拿回第一張牌。</li>
<li><b>推播</b>（push）是伺服器自己主動說的事：時間到了、伺服器五分鐘後重開、有朋友上線了。</li>
</ul>
<p>回覆需要配對。用戶端可能同時有好幾個問題還沒得到回答，而回答不一定照順序回來。所以每個請求都會帶一個 <b>id</b>，它的回覆也帶回同一個 id。推播沒有 id。不管哪個方向，每則訊息都用同一個<b>訊息信封</b>（envelope）格式：</p>
<pre><code>interface Envelope {
  type: string;     // what kind of message: 'start', 'guess', 'timeUp'
  id?: number;      // only on requests and their replies
  data: unknown;    // the content, different for each type
  error?: string;   // set on a reply when the request failed
}
</code></pre>
<p>下面第一行是一個請求和它的回覆，第二行是一則推播。</p>
<div class="flow"><span class="box">用戶端送出<small>{ type: 'guess', id: 7, data: { guess: 'higher' } }</small></span><span class="arr">&rarr;</span><span class="box">伺服器查它的牌堆</span><span class="arr">&rarr;</span><span class="box hot">回覆<small>{ type: 'guess', id: 7, data: { card: 11, correct: true, score: 5 } }</small></span><span class="arr">&rarr;</span><span class="box">用戶端找到 7 號請求<small>把資料交給它</small></span></div>
<div class="flow"><span class="box">伺服器的計時器到了</span><span class="arr">&rarr;</span><span class="box hot">推播<small>{ type: 'timeUp', data: { score: 5 } }</small></span><span class="arr">&rarr;</span><span class="box">沒有 id，所以是新消息<small>發出事件，由狀態機反應</small></span></div>
<h3>一個小小的用戶端</h3>
<p><b>第一步：接收。</b>如果訊息帶著一個我們正在等的 id，它就是回覆：把那個請求了結掉。不然它就是推播：當成事件發出去。</p>
<pre><code>import { EventTarget } from 'cc';

export class Net {
  readonly pushes = new EventTarget();
  private ws: WebSocket | null = null;
  private url = '';
  private nextId = 1;
  private pending = new Map&lt;number, (msg: Envelope) =&gt; void&gt;();

  connect(url: string) {
    this.url = url;
    this.ws = new WebSocket(url);
    this.ws.onclose = () =&gt; this.onClose();
    this.ws.onmessage = (ev) =&gt; {
      const msg: Envelope = JSON.parse(ev.data);
      const done = msg.id !== undefined ? this.pending.get(msg.id) : undefined;
      if (done) { this.pending.delete(msg.id!); done(msg); }
      else this.pushes.emit(msg.type, msg.data);
    };
  }
</code></pre>
<p><b>第二步：送出</b>，寫在同一個 class 裡。每個請求拿到下一個 id，以及一個等它的回覆來兌現的 promise。</p>
<pre><code>  request(type: string, data: unknown): Promise&lt;any&gt; {
    const id = this.nextId++;
    return new Promise((resolve, reject) =&gt; {
      this.pending.set(id, (msg) =&gt; (msg.error ? reject(new Error(msg.error)) : resolve(msg.data)));
      this.ws!.send(JSON.stringify({ type, id, data }));
    });
  }
}
</code></pre>
<p>用起來就跟 Vue app 裡任何 async 程式一樣。Model 的 <code>guess()</code> 變成 <code>applyReveal()</code>，只負責把伺服器說的結果存起來。</p>
<pre><code>const r = await net.request('guess', { guess: 'higher' });
model.applyReveal(r.card, r.correct, r.score);
net.pushes.on('timeUp', (d: { score: number }) =&gt; fsm.go('result', d));
</code></pre>
<h3>伺服器決定，用戶端永遠不決定</h3>
<table>
<tr><th>用戶端送出</th><th>伺服器回傳</th></tr>
<tr><td>「開一局」</td><td>第一張牌。剩下的牌堆留在伺服器上。</td></tr>
<tr><td>「我猜比較大」</td><td>下一張牌、這次有沒有猜對、新的分數</td></tr>
<tr><td>玩家在想的時候，什麼都不送</td><td>伺服器自己的計時器到了時，送「時間到」</td></tr>
</table>
<p>用戶端從來不會送「我猜對了」或「我的分數是 6」，也從來不會在猜之前就收到下一張牌。如果一開始就把整副牌送過來，任何人都能在瀏覽器的 Network 面板裡看到。Model、View、Controller 那一課的規則，從用戶端的 Model 搬到了伺服器上。而伺服器這邊，則把用戶端送來的每一則訊息都當成一個「它可以拒絕」的請求。</p>
<h3>連線斷掉的時候</h3>
<p>在手機上，連線斷掉是家常便飯：進電梯、過隧道、從 Wi-Fi 切到行動網路。<code>onclose</code> 事件會告訴你。接下來一定要做兩件事。</p>
<p><b>用退避（backoff）的方式重連。</b>不要在迴圈裡狂試。先等 1 秒，再來 2、4、8、16 秒，之後每 30 秒一次，每次再加上不到一秒的隨機時間。越等越久，是為了放過一台正在掙扎的伺服器；隨機的那一點，是為了避免伺服器重開之後，一萬支手機在同一秒全部衝回來。下面這幾行寫在 <code>Net</code> 裡面：</p>
<pre><code>private attempt = 0;   // set back to 0 in onopen

private onClose() {
  this.pending.forEach((done) =&gt; done({ type: 'error', data: null, error: 'disconnected' }));
  this.pending.clear();
  const wait = Math.min(30, 2 ** this.attempt) + Math.random();
  this.attempt++;
  setTimeout(() =&gt; this.connect(this.url), wait * 1000);
}
</code></pre>
<p>第一行會讓所有還在等的請求直接失敗，這樣就不會有程式一直在 await 一個永遠不會來的回覆。</p>
<p><b>重新同步</b>（resynchronise）。你不在的時候，這局還是繼續進行。伺服器可能已經翻了一張牌，或是時間到把這局結束了。所以新連線上的第一則訊息，就是要回整個局面：</p>
<div class="flow"><span class="box">onclose</span><span class="arr">&rarr;</span><span class="box">等 1、2、4&hellip; 秒</span><span class="arr">&rarr;</span><span class="box">重新連線</span><span class="arr">&rarr;</span><span class="box hot">request('resume')<small>這一局的快照</small></span><span class="arr">&rarr;</span><span class="box">fsm.jump(snap.phase, snap)</span></div>
<p>這就是狀態機那一課的 <code>jump()</code>。千萬不要想靠你剛好收到的那幾則訊息，去推算自己錯過了什麼。直接問，然後相信答案。伺服器也必須知道是哪個玩家回來了，所以 resume 請求會帶著用戶端登入時拿到的 token；細節怎麼做，要看你的後端。</p>
<h3>模擬伺服器：沒有後端也能開發</h3>
<p>真正的伺服器可能還沒寫好、可能掛了，也可能要你先玩五局才測得到你要的情況。所以寫一個<b>模擬伺服器</b>（mock server）：一個跟 <code>Net</code> 長得一樣的 class，在本機跑規則，再加一點延遲，讓它感覺像在走網路。先看它的外型：</p>
<pre><code>import { EventTarget } from 'cc';
import { makeDeck } from './Deck';
import { Guess } from './GameModel';

export class MockNet {
  readonly pushes = new EventTarget();
  private deck: number[] = [];
  private current = 0;
  private score = 0;

  request(type: string, data: any): Promise&lt;any&gt; {
    const reply = type === 'start' ? this.start() : this.guess(data.guess);   // two types so far
    return new Promise((resolve) =&gt; setTimeout(() =&gt; resolve(reply), 300));
  }
</code></pre>
<p>接著是規則，寫在同一個 class 裡。它們就是 Model、View、Controller 那一課的規則，現在站在將來真正伺服器要站的位置。</p>
<pre><code>  private start() {
    this.deck = makeDeck();
    this.current = this.deck.shift()!;
    this.score = 0;
    return { card: this.current };
  }
  private guess(g: Guess) {
    const next = this.deck.shift()!;
    const correct = g === 'higher' ? next &gt; this.current : next &lt; this.current;
    this.current = next;
    if (correct) this.score++;
    return { card: next, correct, score: this.score, over: !correct || this.deck.length === 0 };
  }
}
</code></pre>
<p>讓兩個 class 遵守同一個介面，遊戲的其他部分就永遠不知道自己拿到的是哪一個：</p>
<pre><code>export interface GameNet {
  readonly pushes: EventTarget;
  request(type: string, data: unknown): Promise&lt;any&gt;;
}

const net: GameNet = useMock ? new MockNet() : new Net();
</code></pre>
<p><code>useMock</code> 從哪裡來，是「建置與出貨」那一課的主題。</p>
<h3>深入一點：讓模擬伺服器故意出包</h3>
<p>模擬伺服器最好的用途，是預演壞日子。幫它加幾個開關：延遲三秒、回覆順序打亂、某個請求永遠不回、guessing 到一半斷線、玩家剛猜完 timeUp 推播才到。每一種都是手機上真的會發生的事，而且每一種都很難叫真正的伺服器隨時重現。一個在模擬伺服器上撐過這些考驗的遊戲，到了真實世界大部分也撐得住。</p>
<h3>深入一點：逾時和重送</h3>
<ul>
<li>每個請求都要有<b>逾時</b>（timeout）。如果在比方說 8 秒內沒有回覆，就讓它失敗，交給狀態機決定，通常是顯示「重新連線中」，然後重新同步。</li>
<li>請求可能已經送到伺服器，只是回覆在路上弄丟了。這時如果用戶端再送一次同一個猜測，伺服器可能會算兩次。所以每次猜測都帶著局數和第幾次猜，伺服器看到已經處理過的就忽略。送兩次也安全的請求，叫做<b>冪等</b>（idempotent）。</li>
<li>新的一局開始時，上一局的訊息可能還在路上。推播裡也放局數，跟目前這局對不上的就丟掉。</li>
</ul>
<h3>跟 Vue 比較</h3>
<p>你在 Vue 裡寫過 <code>await axios.get(url)</code>。那就是 HTTP 這一半，完全沒變。WebSocket 這一半，在 Vue 的日常裡沒有對應的東西。最接近的，是一個會 await 回覆的 store action，再加一個監聽器，每當伺服器推播就去更新 store。模擬伺服器的概念，跟在 Vue 單元測試裡 mock 一個 API 一樣，只是你整天開發都在用它，不只是在測試裡。</p>`,
    tryNote: '在 Cocos 專案的預覽開著時，貼到瀏覽器的主控台執行。最後一行需要猜高低專案，而且要開著模擬伺服器。',
    try: [
      '連到一個沒有人在聽的連接埠。你會收到關閉代碼 1006 的 close 事件：對你的程式來說，斷線就長這個樣子。',
      '前七次嘗試的退避等待秒數：1、2、4、8、16、30、30。',
      '這局停在 waiting 時，請模擬伺服器開一局並印出回覆：只有第一張牌，永遠不會有整副牌。換成真正的伺服器時，打開 Network 面板、選 WS，就能看到那條連線上的訊息。'
    ],
    own: `挑一個你工作上會跟後端溝通的功能，列出它送出和收到的每一則訊息。把每一則標成請求、回覆或推播，並寫下結果是由哪一邊決定的。然後回答這一課在講的兩個問題：連線在中途斷掉時，畫面會怎樣？它又要怎麼知道自己錯過了什麼？`,
    quiz: [
      { q: "收到一則沒有 id 的訊息。它是什麼？",
        a: ["最近一個請求的回覆", "伺服器自己主動送來的推播", "壞掉的訊息，應該丟掉", "伺服器發來、需要回答的請求"],
        why: "只有請求和它的回覆會帶 id。沒有 id 的訊息是伺服器發來的新消息，所以用戶端把它當成事件發出去。" },
      { q: "為什麼用戶端每次猜完只拿到下一張牌，而不是一開始就拿到整副牌？",
        a: ["為了省頻寬", "因為 JSON 裝不下 52 個數字", "用戶端手上的任何東西玩家都看得到，所以牌堆留在伺服器、由伺服器決定", "WebSocket 訊息一次只能裝一張牌"],
        why: "結果由伺服器決定。送到瀏覽器的牌堆，在每次猜之前都能從 Network 面板讀出來。" },
      { q: "連線斷掉之後，為什麼要等 1、2、4、8 秒再加一點隨機時間，而不是在迴圈裡馬上重試？",
        a: ["為了放過一台正在掙扎的伺服器，也避免每支手機在同一秒衝回來", "瀏覽器禁止在一秒內重新連線", "隨機的部分讓連線更安全", "讓玩家注意到出問題了"],
        why: "越等越久，讓伺服器有喘息的空間；隨機的部分，則把幾千個重連分散到不同時間。" }
    ]
  },
  {
    id: 'cc-build',
    title: '建置與出貨',
    body: `
<p>在編輯器裡按 Preview，跟把遊戲交到玩家手上，是兩回事。預覽是在自己廚房裡直接從鍋子試吃。<b>建置</b>（build）則是把菜裝進封好、貼好標籤、經得起外送的盒子裡。這一課就從鍋子一路走到玩家的手機。</p>
<h3>預覽不等於遊戲</h3>
<table>
<tr><th></th><th>預覽（preview）</th><th>建置（Web Mobile）</th></tr>
<tr><td>在哪裡跑</td><td>編輯器裡的一個小伺服器，通常是 <code>localhost:7456</code></td><td>任何網頁伺服器或 CDN</td></tr>
<tr><td>你的腳本</td><td>邊跑邊編譯，看得懂，有 source map</td><td>只編譯一次、打包，通常還會縮小（minify）</td></tr>
<tr><td>資源</td><td>從專案裡一個一個讀</td><td>打包進資源包，可以選擇壓縮貼圖、檔名加上指紋</td></tr>
<tr><td>引擎</td><td>完整的引擎，帶著各種檢查和警告</td><td>只有在 Project Settings 裡勾選的引擎模組</td></tr>
<tr><td>速度和大小</td><td>沒有參考價值</td><td>就是玩家拿到的樣子</td></tr>
</table>
<p>所以一個在預覽裡跑得很好的遊戲，建置出來還是可能出問題。某張貼圖對手機來說可能太大。程式裡用路徑載入的資源可能不見了，因為它不在 <code>resources</code> 或任何資源包裡，建置時就被排除掉了。早點建置，而且要測建置出來的版本，不要只測預覽。</p>
<h3>做一次建置</h3>
<p>打開 <b>Project &rarr; Build</b>，平台選 <b>Web Mobile</b>，按 Build。Web Mobile 是給手機瀏覽器用的；Web Desktop 比較適合電腦上的網頁。結果會放在專案裡的 <code>build/web-mobile</code>。</p>
<h3>建置裡有什麼</h3>
<div class="tiers"><b>網頁</b><div><span class="box">index.html<small>玩家打開的就是它</small></span><span class="box">style.css 和啟動用的腳本</span></div><b>引擎</b><div><span class="box">cocos-js<small>引擎，只留你用到的部分</small></span></div><b>你的遊戲</b><div><span class="box hot">assets/main<small>你的場景和腳本</small></span><span class="box">assets/resources<small>用路徑載入的東西</small></span><span class="box">assets/internal<small>引擎自己的資源</small></span><span class="box">你自己的資源包<small>需要時才載入</small></span></div><b>設定</b><div><span class="box">src<small>啟動設定：有哪些資源包和場景</small></span></div></div>
<p><code>assets</code> 底下的每個資料夾都是一個<b>資源包</b>（asset bundle，簡稱 bundle）：一包資源，帶著自己的內容清單。資源包裡面，<code>import</code> 放的是場景、prefab、材質這些存檔資料，<code>native</code> 放的是圖片、聲音這類原始檔案。確切的資料夾結構在不同版本之間可能略有差異，打開你自己的建置看一看。</p>
<p>專案裡任何一個資料夾都可以變成資源包：選取它，在 Inspector 裡勾 <b>Is Bundle</b>。之後用 <code>assetManager.loadBundle()</code> 載入。遊戲就是這樣讓第一次下載保持小小的：標題畫面和第一關放在 <code>main</code> 裡一起出貨，其他的等玩家玩到那裡才送過來。</p>
<h3>貼圖壓縮（texture compression）</h3>
<p>PNG 在磁碟上很小，但圖形晶片沒辦法直接拿 PNG 來畫。畫之前，圖會被解開成原始像素，每個像素 4 個位元組。一張 1024 &times; 1024 的圖會吃掉 4 MB 的顯示記憶體，不管那個 PNG 檔是 80 KB 還是 800 KB。壓縮貼圖格式，則是圖形晶片可以直接拿來畫的格式：</p>
<table>
<tr><th>一張 1024 &times; 1024 的圖，存成</th><th>顯示記憶體</th></tr>
<tr><td>PNG，解開後</td><td>4 MB</td></tr>
<tr><td>ETC2</td><td>不透明 0.5 MB，有透明 1 MB</td></tr>
<tr><td>PVRTC，每像素 4 位元</td><td>0.5 MB</td></tr>
<tr><td>ASTC，6 &times; 6 區塊</td><td>大約 0.45 MB</td></tr>
</table>
<p>一支手機能用哪些格式，要看它的圖形晶片，所以通常會列不只一種。在 Cocos 裡，你在 Inspector 幫每張圖選一個壓縮預設（preset），預設本身則在 Project Settings 裡定義。執行時，引擎會挑一個裝置支援的格式。壓縮會損失一點畫質，所以文字和細邊要在真的手機上檢查。</p>
<p>圖示、按鈕這類小圖，最好合併成一張大圖。在一個資料夾裡建立一個 <b>Auto Atlas</b> 資源，建置時 Cocos 會把那個資料夾裡的圖打包成一張貼圖：要下載的檔案變少，而且就像除錯那一課會講的，draw call 也變少。</p>
<h3>每個環境（environment）的設定</h3>
<p>同一個遊戲通常會跑在三個地方：<b>開發</b>（development，你自己的電腦，常常搭配模擬伺服器）、<b>預備環境</b>（staging，正式環境的複本，拿來測試）和<b>正式環境</b>（production，真正的玩家）。它們之間不同的只是少數幾個設定：伺服器位址、要不要開模擬伺服器、log 要記多少、有沒有除錯面板。</p>
<p>關鍵問題是：每個設定是<em>什麼時候</em>被讀取的。</p>
<table>
<tr><th></th><th>建置時讀取</th><th>啟動時讀取</th></tr>
<tr><td>怎麼做</td><td>編譯進程式裡的常數，例如 <code>'cc/env'</code> 裡的 <code>DEBUG</code> 和 <code>PREVIEW</code></td><td>放在 <code>index.html</code> 旁邊的 <code>config.json</code>，遊戲啟動時抓下來</td></tr>
<tr><td>要改它</td><td>重新建置</td><td>換掉伺服器上一個小檔案</td></tr>
<tr><td>適合</td><td>把除錯工具整個從程式裡拿掉</td><td>每個環境不同的伺服器位址和開關</td></tr>
</table>
<pre><code>import { PREVIEW } from 'cc/env';

export interface AppConfig { wsUrl: string; useMock: boolean; }

export async function loadConfig(): Promise&lt;AppConfig&gt; {
  if (PREVIEW) return { wsUrl: '', useMock: true };   // editor preview: no server needed
  const res = await fetch('config.json', { cache: 'no-store' });
  return (await res.json()) as AppConfig;
}
</code></pre>
<p>用啟動時讀取的設定，你可以只建置一次，在預備環境測那一份建置，再把一模一樣的檔案複製到正式環境，只換掉 <code>config.json</code>。你測過的，就是你出貨的。那個檔案裡的所有東西都是公開的，所以裡面只放位址和開關，絕對不放密碼或金鑰。</p>
<h3>放到 CDN 上</h3>
<p>網頁建置就只是一堆靜態檔案，所以任何網頁伺服器都能放。正式的遊戲會把它們放到 <b>CDN</b> 上：一群分布在世界各地的伺服器，把副本放在離玩家近的地方。CDN 和瀏覽器的快取都很兇，於是出現經典的問題：你修好 bug 出了新版，玩家還在跑昨天的檔案。</p>
<p>解法是靠檔名來<b>強制更新快取</b>（cache busting）。在 Build 面板勾選 <b>MD5 Cache</b>，Cocos 會把每個檔案內容的簡短指紋加進檔名裡，所以像 <code>index.js</code> 這樣的檔案，會變成類似 <code>index.5b2f1.js</code> 的名字。檔案一改，名字就跟著改，任何快取都不可能誤給舊的那份。<code>index.html</code> 則保留原名，因為它是玩家打開的網址。</p>
<div class="flow"><span class="box">index.html<small>no-cache：每次造訪都檢查</small></span><span class="arr">指向</span><span class="box hot">帶指紋的檔案<small>快取一年</small></span><span class="arr">&rarr;</span><span class="box">下一次發版<small>新名字，舊副本永遠對不上</small></span></div>
<p>由此得出兩條規則。帶指紋的檔案用很長的快取時間；<code>index.html</code> 和 <code>config.json</code> 則用 <code>Cache-Control: no-cache</code>，讓瀏覽器每次都檢查有沒有新的。上傳的時候，先放新的帶指紋檔案，最後才放 <code>index.html</code>，這樣就沒有人會拿到一個指向還沒上傳的檔案的頁面。舊檔案也要多留幾天，因為正在玩的玩家還需要它們。</p>
<h3>在管線裡建置</h3>
<p>手動建置一直都沒問題，直到有人忘了某個步驟。建置伺服器上的<b>管線</b>（pipeline）每次都用同樣的方式做：</p>
<div class="flow"><span class="box">推到 git</span><span class="arr">&rarr;</span><span class="box">建置伺服器取出專案</span><span class="arr">&rarr;</span><span class="box hot">Cocos Creator 用命令列建置</span><span class="arr">&rarr;</span><span class="box">上傳到預備環境，配上預備環境的 config.json</span><span class="arr">&rarr;</span><span class="box">測試</span><span class="arr">&rarr;</span><span class="box">把同一份檔案複製到正式環境</span></div>
<p>Cocos Creator 可以從命令列啟動，帶上專案路徑和建置選項，然後在沒有人碰編輯器的情況下完成建置。選項的名稱在不同版本之間改過，所以請照你那個版本的手冊裡「命令列發佈」那一頁來寫，並把建置設定放進專案的 repository，讓每台機器都用同樣的方式建置。建置用的機器，要裝跟專案相同版本的 Cocos Creator。</p>
<h3>跟 Vue 比較</h3>
<table>
<tr><th>Vue 搭配 Vite</th><th>Cocos Creator</th></tr>
<tr><td><code>npm run dev</code></td><td>預覽</td></tr>
<tr><td><code>npm run build</code> 輸出到 <code>dist/</code></td><td>建置輸出到 <code>build/web-mobile</code></td></tr>
<tr><td>帶雜湊的檔名，例如 <code>index-4f2a91c3.js</code></td><td>MD5 Cache</td></tr>
<tr><td><code>import.meta.env</code> 和 <code>.env.staging</code></td><td><code>'cc/env'</code> 的常數，或你自己的 <code>config.json</code></td></tr>
<tr><td>延遲載入的路由</td><td>用 <code>assetManager.loadBundle()</code> 載入的資源包</td></tr>
</table>`,
    tryNote: '先在編輯器裡操作，接著是在建置好的遊戲上，貼到瀏覽器主控台執行的幾行。',
    try: [
      '找出上圖裡的那些資料夾，以及檔名裡的指紋。',
      '編輯器會像網頁伺服器一樣提供這份建置，所以它的表現就跟玩家看到的一樣。',
      '這個頁面下載的每個檔案，連同它所在的資料夾。找出引擎、你的資源包，以及帶指紋的檔名。',
      '第一次載入透過網路花了多少流量。重新整理後再跑一次：快取正常的話，大部分檔案第二次幾乎不花流量。'
    ],
    own: `把你的一個專案建置出來，然後填一張小表：整個建置資料夾的大小、引擎的大小、每個資源包的大小，再加上最大的三張圖和它們的像素尺寸。算出這三張圖解開後各需要多少顯示記憶體（寬 &times; 高 &times; 4 位元組）。接著寫下你的伺服器位址現在放在哪裡，以及要改它需不需要重新建置。`,
    quiz: [
      { q: "一張 1024 × 1024 像素的 PNG，在磁碟上是 120 KB。沒有壓縮的情況下，畫出來時大約會用掉多少顯示記憶體？",
        a: ["120 KB", "1 MB", "4 MB", "16 MB"],
        why: "解開後每個像素佔 4 個位元組：1024 乘 1024 乘 4，大約是 4 MB。磁碟上的檔案大小不重要。" },
      { q: "你想在預備環境測一份建置，然後把完全相同的檔案出貨到正式環境。伺服器位址應該放在哪裡？",
        a: ["編譯進程式裡的常數", "放在 index.html 旁邊、啟動時讀取的 config.json", "場景檔裡", "玩家瀏覽器的儲存空間裡"],
        why: "啟動時才讀的設定，可以每個環境不同而不用重新建置，所以你測過的檔案就是你出貨的檔案。" },
      { q: "為什麼 index.html 最後才上傳、而且用 no-cache，其他檔案卻可以快取很久？",
        a: ["index.html 是最大的檔案", "CDN 不能快取 HTML", "瀏覽器的 WebGL 要求這樣做", "帶指紋的檔案不會在同一個名字下改變內容，但 index.html 名字不變，必須永遠指向已經存在的檔案"],
        why: "內容一變就是新的帶指紋檔名，所以那些可以放心快取。index.html 是唯一一個名字永遠不變的檔案。" }
    ]
  },
  {
    id: 'cc-debug',
    title: '除錯與常見陷阱',
    body: `
<p>Cocos 遊戲裡大部分的 bug 都不高明，就是每個人都會犯的那十幾個錯，而每一個都有典型的<b>症狀</b>（symptom）：你看到的樣子。這一課先快速介紹幫你判斷是哪一種的工具，再照症狀把它們一一列出來，附上常見的<b>原因</b>和<b>解法</b>。把它想成技師打開引擎蓋之前，先照著跑一遍的檢查清單。</p>
<h3>先認識工具</h3>
<ul>
<li><b>瀏覽器主控台</b>（console）。在 Chrome 裡跑預覽，打開開發者工具（Mac 上是 Cmd+Option+I）。紅色的是錯誤，會附上檔案和行號。預覽時全域的 <code>cc</code> 物件都在，所以你可以直接打字，檢查正在跑的遊戲。</li>
<li><b>中斷點</b>（breakpoint）。在 Sources 面板按 Cmd+P，輸入你的腳本名稱。預覽有提供 source map，所以你看到的是自己的 TypeScript。點一下行號就會在那裡暫停，或是在程式裡寫 <code>debugger;</code>。暫停時，把滑鼠移到變數上就能看到它的值。</li>
<li><b>統計面板。</b>Cocos 內建一個小小的效能分析器（profiler）。在主控台執行 <code>cc.profiler.showStats()</code>，角落會出現一個面板，顯示幀率、每幀花的時間、draw call 數量等等。邊玩邊看。</li>
<li><b>節點樹。</b>編輯器顯示的是你建出來的場景。一個小小的主控台函式，則能顯示它現在的樣子，包括你的程式建立的節點。</li>
</ul>
<pre><code>function tree(n, depth = 0) {
  console.log(' '.repeat(depth * 2) + n.name + (n.active ? '' : '  (inactive)'));
  n.children.forEach((c) =&gt; tree(c, depth + 1));
}
tree(cc.director.getScene());
</code></pre>
<p>在真的手機上，用傳輸線接到電腦：iPhone 用 Safari 的 Web Inspector（在「開發」選單裡），Android 用 Chrome 的 <code>chrome://inspect</code>。之後主控台和中斷點就能用在手機上跑的那個頁面。</p>
<h3>1. 節點看不到</h3>
<p>照這條鏈依序檢查。大部分情況在前三格就找到了。</p>
<div class="flow"><span class="box">有啟用嗎？<small>自己和每一層父節點</small></span><span class="arr">&rarr;</span><span class="box">大小和縮放？<small>不是零</small></span><span class="arr">&rarr;</span><span class="box hot">圖層（layer）？<small>攝影機會畫的那一層</small></span><span class="arr">&rarr;</span><span class="box">位置？<small>在攝影機的畫面內</small></span><span class="arr">&rarr;</span><span class="box">透明度和顏色？</span><span class="arr">&rarr;</span><span class="box">順序？<small>沒被兄弟節點蓋住</small></span></div>
<table>
<tr><th>原因</th><th>怎麼檢查</th><th>解法</th></tr>
<tr><td>它自己或某個父節點沒啟用</td><td><code>node.activeInHierarchy</code> 是 false</td><td>父節點也要啟用。只要一個父節點沒啟用，底下全部都會不見。</td></tr>
<tr><td>大小或縮放是零</td><td>它的 <code>UITransform</code> 尺寸，或是被中斷的補間動畫把縮放留在 0</td><td>給它一個尺寸；開始新的補間動畫前，先停掉舊的</td></tr>
<tr><td>圖層不對</td><td>用 <code>new Node()</code> 建立的節點，一開始在 Default 圖層，2D 攝影機不會畫它</td><td>設定 <code>node.layer = Layers.Enum.UI_2D</code>，或是複製父節點的圖層</td></tr>
<tr><td>在攝影機外面</td><td>它的位置遠在畫面外</td><td>記得位置是相對於父節點的</td></tr>
<tr><td>透明了</td><td><code>UIOpacity</code> 是 0、顏色的 alpha 是 0，或是 Sprite 沒有圖</td><td>把造成它的淡出效果復原</td></tr>
<tr><td>被別的節點蓋住</td><td>在 2D 裡，後面的兄弟節點會畫在前面的上面</td><td>把它移到樹裡比較後面的位置，或呼叫 <code>setSiblingIndex()</code></td></tr>
</table>
<h3>2. 點了沒反應</h3>
<table>
<tr><th>原因</th><th>怎麼檢查</th><th>解法</th></tr>
<tr><td>上面有別的節點把觸控吃掉了</td><td>一個透明的全螢幕面板、一個淡出了但還啟用著的彈窗，或是一個 <code>BlockInputEvents</code> 元件。把嫌疑犯一個一個關掉試試。</td><td>遮罩層隱藏時要真的停用，不要只是淡出</td></tr>
<tr><td>沒有可以點的範圍</td><td>節點沒有 <code>UITransform</code>，或尺寸是 0</td><td>給節點一個能蓋住玩家看到範圍的尺寸</td></tr>
<tr><td>Button 被關掉了</td><td><code>interactable</code> 是 false，或 Button 元件被停用</td><td>確認應該由哪個狀態把它打開</td></tr>
<tr><td>處理函式沒接上</td><td>Click Events 裡的項目，指向一個後來被改名的方法</td><td>在 Inspector 裡重新選一次方法，或用 <code>node.on()</code> 在程式裡註冊</td></tr>
</table>
<p>在猜高低（Higher or Lower）裡還有一個原因，而且它不是 bug：這局不在 guessing，所以點擊被刻意忽略了。先把狀態印出來。</p>
<h3>3. 參考是 null</h3>
<p>症狀是像 <code>Cannot read properties of null (reading 'string')</code> 這樣的錯誤。原因從最常見到最少見：某個 <code>@property</code> 欄位從來沒在 Inspector 裡拖東西進去；某個節點被改名了，所以 <code>find()</code> 或 <code>getChildByName()</code> 找不到它；<code>getComponent()</code> 呼叫在另一個節點上，而不是真正掛著那個元件的節點。先把原因修好。然後在 <code>onLoad</code> 裡用清楚的訊息檢查必要的參考，這樣下次的錯誤訊息會直接說出缺了哪個欄位，而不是程式深處的某一行。</p>
<h3>4. 監聽器觸發兩次</h3>
<p>症狀：點一下得兩分，或是有錯誤來自一個早就被銷毀的節點。原因是有 <code>on()</code> 卻沒有對應的 <code>off()</code>。在 <code>onEnable</code> 裡加的監聽器（listener），每次節點被顯示時都會再加一次。掛在長壽物件上的監聽器，例如一個共用的 <code>EventTarget</code>，會在元件的節點消失之後繼續呼叫它。解法是讓它們成對：</p>
<pre><code>onEnable() { model.events.on('changed', this.redraw, this); }
onDisable() { model.events.off('changed', this.redraw, this); }
// or, when the component goes away for good:
onDestroy() { model.events.targetOff(this); }
</code></pre>
<p>節點被銷毀時，掛在它上面的監聽器會一起被清掉。掛在比它活得更久的東西上的監聽器，就是你的責任。這跟 Vue 的規則一樣：在 <code>onMounted</code> 裡用 <code>addEventListener</code> 加上去的，就要在 <code>onUnmounted</code> 裡移除。</p>
<h3>5. 越玩越慢</h3>
<table>
<tr><th>原因</th><th>跡象</th><th>解法</th></tr>
<tr><td><code>update</code> 裡做了很重的事</td><td>一開始就慢：每一幀都在 <code>find()</code>、<code>getComponent()</code> 或建立新物件</td><td>在 <code>onLoad</code> 裡查一次就好，並重複使用同一個 <code>Vec3</code></td></tr>
<tr><td>從來不銷毀的節點：記憶體洩漏（memory leak）</td><td>節點數量一局一局往上漲</td><td>自己建立的就要自己銷毀，或用 <code>NodePool</code> 重複使用節點</td></tr>
<tr><td>永遠不停的計時器和補間動畫</td><td>已經關掉的畫面還在做事</td><td>在 exit 或 <code>onDisable</code> 裡 <code>unschedule()</code>；<code>Tween.stopAllByTarget(node)</code></td></tr>
<tr><td>draw call 太多</td><td>統計面板顯示 draw call 好幾百</td><td>會一起出現的圖放進同一張圖集，並讓共用圖集的節點在樹裡彼此相鄰</td></tr>
</table>
<p>一次<b>繪製呼叫</b>（draw call）就是引擎對圖形晶片下的一道命令：用這張貼圖畫這一批形狀。Cocos 會把相鄰、而且使用相同貼圖和材質的節點合併成一批。中間只要夾一個用不同貼圖的節點（常見的就是 Label），這一批就被切成兩半。二十張來自同一張圖集的牌，可以只算一次 draw call；同樣二十張牌，每張後面各接一個 Label，就可能接近四十次。</p>
<h3>6. 手機記憶體不夠</h3>
<p>症狀：在電腦上一切正常，但在手機上頁面會自己重新載入，或瀏覽器顯示錯誤頁面，通常是玩了幾關之後。這是瀏覽器因為記憶體用太多，把分頁砍掉了，而在手機上吃最多記憶體的，幾乎都是貼圖。回想建置那一課的算術：一張 2048 &times; 2048 的圖解開後就是 16 MB 的顯示記憶體，不管它的檔案多小。解法是更小的圖（手機很少需要用 2048 像素來畫一個物件）、壓縮貼圖格式，以及釋放不再需要的東西：用完的資源包用 <code>bundle.releaseAll()</code>，單一資源用 <code>assetManager.releaseAsset()</code>。要在你支援的最舊的手機上量，而不是在自己的手機上。</p>
<h3>深入一點：刻意讓問題看得見</h3>
<ul>
<li>每次狀態轉換都記一筆 log，附上時間。當回報說「我猜完就卡住了」，log 會告訴你它卡在哪個狀態。</li>
<li>在除錯版本裡，把目前的狀態、連線狀態和最後一則訊息，小小地顯示在畫面角落。測試人員傳來的截圖，就已經包含答案了。</li>
<li>把上面這六項檢查寫成一份短短的清單，放在程式碼旁邊。同一個 bug 第二次出現時，這份清單一分鐘就能解決它。</li>
</ul>
<h3>跟 Vue 比較</h3>
<p>在 Vue 裡，Vue Devtools 會顯示元件樹和它的狀態。對跑在瀏覽器裡的 Cocos 遊戲來說，這件事由主控台和像上面 <code>tree()</code> 這樣的函式來做：節點樹就是你的元件樹，元件的欄位就是它的狀態。</p>`,
    tryNote: '在 Cocos 專案的預覽開著時，貼到瀏覽器的主控台執行。把 Canvas/Card 換成你自己場景裡某個節點的路徑。',
    try: [
      '現在這一刻的節點樹，沒啟用的節點會標出來。',
      '統計面板：幀率、每幀時間、draw call 等等。玩一分鐘，看看哪些數字在動。',
      '檢查看不到的節點時，最先要看的幾項：有沒有啟用、是不是在 2D 圖層、尺寸是不是真的有、縮放是不是真的有。',
      '現在總共有多少個節點。玩一陣子再跑一次。如果數字一直往上漲，就是有東西從來沒被銷毀。'
    ],
    own: `挑最近一個讓你花超過一小時的 bug，工作上或自己專案裡的都可以。照這一課的格式把它寫下來：使用者看到的症狀、真正的原因、解法，以及五分鐘內就能找到它的那個檢查。然後開始累積一份這種檢查的清單，放在你的程式碼旁邊。`,
    quiz: [
      { q: "你用 new Node() 建了一個節點，加上一個 Sprite，放到 Canvas 底下。它沒有出現。最可能的原因是什麼？",
        a: ["Sprite 不能用程式建立", "這個節點在 Default 圖層，2D 攝影機不會畫它", "Canvas 只會顯示在編輯器裡建立的節點", "新節點在場景重新載入之前都是停用的"],
        why: "用程式建立的節點，一開始在 Default 圖層。把它的 layer 設成 UI_2D，或是複製父節點的圖層。" },
      { q: "點一下 Higher 會得兩分，但只發生在玩家打開過設定畫面之後，而設定畫面會把遊戲藏起來再顯示回來。你該找什麼？",
        a: ["一張太大的貼圖", "少了 UITransform", "draw call 太多", "在 onEnable 裡加了監聽器，卻沒在 onDisable 裡對應地 off 掉"],
        why: "把節點藏起來再顯示，onEnable 會再跑一次。onDisable 裡沒有 off 的話，監聽器現在就有兩個了。" },
      { q: "一個滿是卡牌的畫面，統計面板顯示 300 次 draw call。哪個改法最有幫助？",
        a: ["把卡牌的圖放進同一張圖集，並讓卡牌在樹裡彼此相鄰", "在 Project Settings 裡把幀率調高", "改用更大的 PNG 檔", "把 update 裡的程式搬到 start"],
        why: "共用同一張貼圖的相鄰節點會被合併成一批，所以一張圖集加上合理的順序，就能大幅減少 draw call。" }
    ]
  },
  {
    id: 'cc-capstone',
    title: '總結專題：從空專案做出猜高低',
    body: `
<p>這一課把整個模組串起來。你要從一個空專案開始，分八個里程碑（milestone）做出猜高低（Higher or Lower）。每個里程碑都會說明要做什麼、繼續往下之前怎麼<b>驗收檢查</b>（check）它真的能用，以及卡住時要回去重讀哪一課。照順序做。每一個都站在前一個上面，而且一個里程碑要等它的檢查通過才算完成，不是程式寫完就算。</p>
<p>再複習一次規則：桌上一張牌翻開；玩家猜下一張比較大還是比較小；猜對得一分，翻開的那張變成目前的牌；猜錯、點數一樣或牌堆用完，遊戲就結束。從里程碑 7 開始，牌堆住在（模擬的）伺服器上，就像真正的遊戲那樣。</p>
<div class="flow"><span class="box">1 場景</span><span class="arr">&rarr;</span><span class="box">2 卡牌 Prefab</span><span class="arr">&rarr;</span><span class="box">3 牌堆 Model</span><span class="arr">&rarr;</span><span class="box hot">4 狀態機</span><span class="arr">&rarr;</span><span class="box">5 輸入</span><span class="arr">&rarr;</span><span class="box">6 補間動畫</span><span class="arr">&rarr;</span><span class="box hot">7 模擬伺服器</span><span class="arr">&rarr;</span><span class="box">8 建置與部署</span></div>
<h3>最後會有的檔案</h3>
<div class="tiers"><b>Model</b><div><span class="box">Deck.ts</span><span class="box">GameModel.ts</span></div><b>一局</b><div><span class="box hot">RoundFsm.ts</span><span class="box">GameController.ts</span></div><b>View</b><div><span class="box">GameView.ts</span><span class="box">CardView.ts</span></div><b>網路</b><div><span class="box">Net.ts</span><span class="box">MockNet.ts</span><span class="box">config.ts</span></div></div>
<h3>里程碑 1：場景與版面</h3>
<p><b>要做：</b>一個新的 2D 專案，裡面一個場景。在 Canvas 底下放：中間一塊放牌的桌面區、上方一個分數標籤、下方 Higher 和 Lower 兩顆按鈕、一顆 Play 按鈕，以及一開始不啟用的結算面板。在分數標籤和按鈕上加 <code>Widget</code>，讓它們黏在螢幕邊緣。</p>
<p><b>檢查：</b>開預覽，把瀏覽器視窗拉成又高又窄，再拉成又寬又矮。標籤和按鈕都留在畫面上，而且待在該待的位置。</p>
<p><b>卡住的話：</b>重讀講節點樹和講座標的那兩課。</p>
<h3>里程碑 2：卡牌 Prefab</h3>
<p><b>要做：</b>一個 Card 節點，有背景 Sprite、顯示點數的 Label，還有牌背。幫它掛一個 <code>CardView</code> 腳本，提供 <code>show(value)</code> 和 <code>faceDown()</code>，1、11、12、13 分別顯示成 A、J、Q、K。把節點拖進 Assets 面板，讓它變成一個<b>預製物件</b>（prefab），再從場景裡刪掉，之後用 <code>instantiate()</code> 在程式裡建立卡牌。Prefab 裡的節點會保留它們在編輯器裡的圖層，所以這樣建出來的牌看得到；用 <code>new Node()</code> 拼出來的牌就看不到（見除錯那一課）。</p>
<p><b>檢查：</b>用一個測試腳本建立三張並排的牌，分別顯示 1、7、13。它們顯示成 A、7、K。</p>
<p><b>卡住的話：</b>重讀講資源和講腳本的那兩課。</p>
<h3>里程碑 3：牌堆 Model</h3>
<p><b>要做：</b>有公平洗牌（shuffle）的 <code>Deck.ts</code>，以及 Model、View、Controller 那一課的 <code>GameModel.ts</code>。</p>
<pre><code>export function makeDeck(): number[] {
  const d: number[] = [];
  for (let v = 1; v &lt;= 13; v++) d.push(v, v, v, v);   // 52 cards; suits do not matter here
  for (let i = d.length - 1; i &gt; 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}
</code></pre>
<p>這就是 <b>Fisher&ndash;Yates 洗牌法</b>（Fisher–Yates shuffle）：每一種排列出現的機率都一樣。流行的那一行寫法 <code>sort(() =&gt; Math.random() - 0.5)</code> 並不公平，某些排列會比其他的更常出現。</p>
<p><b>檢查：</b>把 <code>makeDeck()</code> 印幾次出來：52 個值、每種四個、每次順序都不同。然後手動呼叫 <code>newGame([3, 9, 5])</code> 和 <code>guess('higher')</code>，看分數變成 1。</p>
<p><b>卡住的話：</b>重讀 Model、View、Controller 那一課。</p>
<h3>里程碑 4：狀態機</h3>
<p><b>要做：</b>狀態機那一課的 <code>RoundFsm.ts</code>，以及 <code>GameController</code> 裡的五個處理器。先假裝在等伺服器：dealing 用 <code>scheduleOnce</code> 在半秒後進到 guessing。</p>
<p><b>檢查：</b>每次轉換都印 log。一場遊戲會印出 waiting、dealing、guessing、revealing、guessing&hellip; result、waiting。在主控台從 waiting 呼叫 <code>fsm.go('result')</code>，會印出 blocked 警告。</p>
<p><b>卡住的話：</b>重讀「用狀態機管好一局」那一課。</p>
<h3>里程碑 5：輸入</h3>
<p><b>要做：</b>Button 呼叫 <code>GameView</code>，由它發出 <code>guess</code>。Controller 在 guessing 以外一律忽略。Button 在 guessing 的 enter 裡打開、在它的 exit 裡關掉。Play 按鈕，以及在結算面板上點一下，都走同一條路。</p>
<p><b>檢查：</b>用最快的速度連點 Higher：只算一次猜測，最多一分。在 revealing 時點：什麼都不會發生。在 guessing 時放著不動十秒：遊戲結束。</p>
<p><b>卡住的話：</b>重讀講輸入的那一課，以及「在錯的狀態收到點擊」那一節。</p>
<h3>里程碑 6：補間動畫</h3>
<p><b>要做：</b>發牌（牌從牌堆滑到桌上）、翻牌（寬度縮到零、換牌面、再長回來），以及分數小小彈一下。revealing 要等翻牌播完才離開。在 <code>CardView</code> 裡，從 <code>'cc'</code> import <code>tween</code>、<code>Tween</code> 和 <code>Vec3</code>：</p>
<pre><code>flip(value: number, done: () =&gt; void) {
  Tween.stopAllByTarget(this.node);
  tween(this.node)
    .to(0.15, { scale: new Vec3(0, 1, 1) })
    .call(() =&gt; this.show(value))
    .to(0.15, { scale: new Vec3(1, 1, 1) })
    .call(done)
    .start();
}
</code></pre>
<p><b>檢查：</b>快速玩一分鐘。沒有任何一張牌停在翻到一半或看不見的狀態。縮放卡在 0，就是補間動畫被中斷的典型跡象。</p>
<p><b>卡住的話：</b>重讀講補間動畫的那一課。</p>
<h3>里程碑 7：本機模擬伺服器</h3>
<p><b>要做：</b>跟伺服器對話那一課的 <code>MockNet</code>，以及它和 <code>Net</code> 共用的 <code>GameNet</code> 介面。規則離開 <code>GameModel</code>：<code>guess()</code> 變成 <code>applyReveal()</code>，只負責把伺服器說的存起來。revealing 的 enter 送出猜測，等回覆到了再開始翻牌。再教模擬伺服器兩件事：guessing 過了十秒時送出 <code>timeUp</code> 推播（用戶端的倒數從此只負責顯示），以及用快照回答 <code>resume</code>。</p>
<p><b>檢查：</b>整個遊戲可以對著模擬伺服器玩。把模擬伺服器的延遲設成 3 秒：遊戲停在 revealing 等，什麼都點不了。加一個在 guessing 到一半時斷線的開關：遊戲回來時在正確的狀態，分數也正確。</p>
<p><b>卡住的話：</b>重讀跟伺服器對話那一課，以及狀態機那一課裡講重新連線的部分。</p>
<h3>里程碑 8：建置與部署</h3>
<p><b>要做：</b>有 <code>loadConfig()</code> 的 <code>config.ts</code>（來自建置那一課），在第一局之前讀取。一份勾選了 MD5 Cache 的 Web Mobile 建置，卡牌圖放在 Auto Atlas 裡。一份暫時讓模擬伺服器保持開啟的 <code>config.json</code>。把資料夾上傳到任何靜態網站空間，<code>index.html</code> 最後傳，把它<b>部署</b>（deploy）到你的手機連得到的地方。</p>
<p><b>檢查：</b>遊戲能在你的手機上跑。在除錯版本裡，統計面板顯示穩定的幀率，桌面只用了幾次 draw call。改一下牌背的顏色，重新建置、重新上傳：手機一般重新整理後就會看到新顏色，不用清任何快取。</p>
<p><b>卡住的話：</b>重讀講建置和講除錯的那兩課。</p>
<h3>延伸的點子</h3>
<ul>
<li><b>最高分</b>，重新載入後還在，用 <code>sys.localStorage</code> 存。</li>
<li><b>音效</b>：發牌、翻牌、猜錯各一個，再加一個會被記住的靜音開關。</li>
<li><b>連勝獎勵</b>：連續猜對時，每第五次算兩分。先加在模擬伺服器裡，就像伺服器會做的那樣。</li>
<li><b>真正的伺服器</b>：一個小小的 Node.js 程式，透過 WebSocket 講同樣的訊息信封格式。用戶端應該完全不用改。如果要改，表示模擬伺服器不夠誠實。</li>
<li><b>排行榜</b>，透過 HTTP 在結算畫面載入。</li>
<li><b>多人同時玩</b>，大家對同一張牌、同一個倒數一起猜。推播會變成主要的訊息種類，狀態機改由伺服器推動。</li>
<li><b>測試</b>：幫 <code>GameModel</code> 和 <code>RoundFsm</code> 寫不需要編輯器就能跑的測試。</li>
</ul>`,
    tryNote: '在你完成的猜高低專案預覽開著、而且 GameController 掛在 Canvas 上時，貼到瀏覽器的主控台執行。',
    try: [
      '一行看到狀態、目前的牌和分數。在一局的每一步都跑一次。',
      '里程碑 6：先跑一次，玩十局，再跑一次。節點數量應該不變，不然就是每一局都留下了沒收掉的牌。',
      '里程碑 7：像重新連線時那樣，向模擬伺服器要一份快照。它應該跟畫面上顯示的一致。'
    ],
    own: `把八個里程碑全部做完。然後在不碰任何 View 腳本的前提下改一條規則：點數一樣現在算猜對。如果這個改動擴散到模擬伺服器（也許再加一個測試）以外的地方，就找出是什麼從規則裡漏了出來，把它搬回去。最後，把遊戲交給別人、用他自己的手機玩，寫下他做的前三件你沒料到的事。`,
    quiz: [
      { q: "為什麼一個里程碑要等它的檢查通過才算完成，而不是程式寫完就算？",
        a: ["檢查沒過之前，Cocos 不讓你建置", "每個里程碑都站在前一個上面，藏起來的 bug 會在後面才冒出來，那時就難找得多", "檢查會讓遊戲跑得比較快", "沒檢查過的程式不能存檔"],
        why: "趁每一步還記憶猶新時檢查，bug 就會很小，而且離它的原因很近。" },
      { q: "在里程碑 7，規則從 GameModel 搬進了模擬伺服器。為什麼？",
        a: ["模擬伺服器跑得比 Model 快", "為了讓 GameModel 短一點", "Cocos 不允許 Model 裡有規則", "模擬伺服器站在將來真正伺服器的位置上，而規則必須歸伺服器管"],
        why: "規則放在模擬伺服器裡，換成真正的伺服器時，用戶端就什麼都不用改。" },
      { q: "一陣快速連點之後，有一張牌一直看不見。最可能的原因是什麼？",
        a: ["一個被中斷的翻牌補間動畫，把它的縮放留在 0", "牌堆用完了", "貼圖沒有壓縮", "WebSocket 關掉了"],
        why: "補間動畫中途被停掉，節點就停在當下的樣子。先停掉舊的補間動畫，而且最後一定要回到已知的縮放值。" }
    ]
  }
  ]
});
