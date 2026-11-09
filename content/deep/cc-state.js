DEEP({ 'cc-state': `
<p>上一課做出了 <code>RoundFsm</code>：一張允許轉換的表、每個狀態的 enter 和 exit、點擊處理函式最上面的防護條件，還有重新連線用的 <code>jump()</code>。這一章把狀態機拆到底：怎麼寫成一張能測、能畫的表；一次轉換裡的事要照什麼順序做；計時器怎麼跟著狀態走；伺服器的時鐘和手機上的倒數怎麼對齊；訊息在錯的時間到了怎麼辦；斷線回來怎麼落在對的狀態；以及狀態機出 bug 時，怎麼用 log 和圖把它抓出來。連線遊戲裡最難纏的 bug，十個有八個跟這些有關。</p>

<h3><span class="badge lv1">基礎</span>一、狀態機的零件：用捷運閘門看</h3>
<p>捷運閘門只有兩個狀態：鎖住、打開。會發生的事件也只有兩種：刷卡、有人推過去。</p>
<figure class="figure"><svg viewBox="0 0 600 220" class="fg" style="width:100%;max-width:600px" role="img" aria-label="捷運閘門的狀態機：鎖住時刷卡變成打開，打開時人走過去變回鎖住；鎖住時硬推還是鎖住，打開時再刷卡還是打開">
<rect x="110" y="80" width="140" height="60" rx="10" class="fg-b alt"/><text x="180" y="116" text-anchor="middle" class="fg-t lg">鎖住</text>
<rect x="350" y="80" width="140" height="60" rx="10" class="fg-b hot"/><text x="420" y="116" text-anchor="middle" class="fg-t lg acc">打開</text>
<path d="M180 80 V48 H420 V72" class="fg-l on"/><polygon points="420,80 415.5,72 424.5,72" class="fg-a on"/>
<text x="300" y="40" text-anchor="middle" class="fg-t sm acc">刷卡 → 扣錢、亮綠燈</text>
<path d="M420 140 V172 H180 V148" class="fg-l alt"/><polygon points="180,140 175.5,148 184.5,148" class="fg-a alt"/>
<text x="300" y="190" text-anchor="middle" class="fg-t sm alt">人走過去 → 鎖回去</text>
<path d="M110 100 H72 V120 H102" class="fg-l"/><polygon points="110,120 102,115.5 102,124.5" class="fg-a"/>
<text x="64" y="104" text-anchor="end" class="fg-t sm">硬推</text><text x="64" y="122" text-anchor="end" class="fg-t sm">還是鎖住</text>
<path d="M490 100 H528 V120 H498" class="fg-l"/><polygon points="490,120 498,115.5 498,124.5" class="fg-a"/>
<text x="536" y="104" class="fg-t sm">再刷</text><text x="536" y="122" class="fg-t sm">不再扣錢</text>
<text x="300" y="212" text-anchor="middle" class="fg-t sm">每一條箭頭＝（目前狀態, 事件）→（下一個狀態, 動作）</text>
</svg><figcaption>兩個狀態、兩種事件，一共四種組合，每一種都有一條箭頭。繞回自己的那兩條最容易被忘記，也最常出 bug。</figcaption></figure>
<p>把它寫成句子，就是狀態機的全部零件：</p>
<ul>
<li><b>狀態</b>（state）：鎖住、打開。任何時候只有一個是「目前的」。</li>
<li><b>事件</b>（event）：外面發生的事，例如刷卡、推。</li>
<li><b>轉換</b>（transition）：「鎖住的時候刷卡，就變成打開」。它由（目前狀態, 事件）這一對決定。</li>
<li><b>動作</b>（action）：轉換時順便做的事，例如扣錢、亮綠燈。</li>
</ul>
<p>注意那兩條繞回自己的箭頭。「鎖住時硬推」是合法的事件，只是什麼都不改變。設計狀態機時，最重要的工作其實是回答這種問題：每一個狀態遇到每一種事件，到底該怎樣？閘門設計師要是忘了想「打開時又刷一次卡」，乘客就會被扣兩次錢。</p>
<p>動作可以掛在兩個地方。掛在<b>狀態</b>上（只要進入「打開」就亮綠燈），只看現在是哪個狀態，這叫 Moore 型；掛在<b>轉換</b>上（從鎖住經過刷卡才扣錢），要看是哪個事件造成的，這叫 Mealy 型。上一課的 enter／exit 屬於前者。實務上兩種混著用，名字知道就好，面試偶爾會問。</p>

<h3><span class="badge lv1">基礎</span>二、把狀態機寫成一張表</h3>
<p>上一課的 <code>NEXT</code> 表列的是「可以去哪些狀態」，呼叫的人要自己說 <code>go('revealing')</code>。這有個問題：外面的程式必須知道整張圖長什麼樣子。更好的寫法是讓外面只說「發生了什麼事」，由狀態機自己查表決定去哪裡。表的鑰匙從「目標狀態」換成「事件」：</p>
<pre><code>export type Phase = 'waiting' | 'dealing' | 'guessing'
                  | 'revealing' | 'result';
export type Ev =
  | { type: 'play' }
  | { type: 'dealt'; card: number }
  | { type: 'fail' }
  | { type: 'guess'; guess: 'higher' | 'lower' }
  | { type: 'revealed'; card: number;
      correct: boolean; over: boolean }
  | { type: 'timeUp' }
  | { type: 'done' };

interface Rule { to: Phase; guard?: (e: Ev) =&gt; boolean; }
type ByEvent = Partial&lt;Record&lt;Ev['type'], Rule[]&gt;&gt;;
type Table = Record&lt;Phase, ByEvent&gt;;

const rightAndMore = (e: Ev) =&gt;
  e.type === 'revealed' &amp;&amp; e.correct &amp;&amp; !e.over;

export const TABLE: Table = {
  waiting:   { play: [{ to: 'dealing' }] },
  dealing:   { dealt: [{ to: 'guessing' }],
               fail: [{ to: 'waiting' }] },
  guessing:  { guess: [{ to: 'revealing' }],
               timeUp: [{ to: 'result' }] },
  revealing: { revealed: [
                 { to: 'guessing', guard: rightAndMore },
                 { to: 'result' },
               ] },
  result:    { done: [{ to: 'waiting' }] },
};
</code></pre>
<p>同一個事件可以有好幾條規則，依序檢查<b>防護條件</b>（guard），第一條通過的就是答案。revealing 收到 <code>revealed</code>：猜對而且還有牌，回 guessing；否則落到第二條，去 result。</p>
<figure class="figure"><svg viewBox="0 0 680 300" class="fg" style="width:100%;max-width:680px" role="img" aria-label="一局的狀態圖：waiting 經 play 到 dealing，dealt 到 guessing，guess 到 revealing；revealing 猜對且還有牌回 guessing，其他情況到 result；guessing 時間到也去 result；result 經 done 回 waiting；dealing 失敗回 waiting">
<circle cx="75" cy="30" r="6" class="fg-lamp on"/><text x="87" y="34" class="fg-t sm">開始</text>
<line x1="75" y1="36" x2="75" y2="92" class="fg-l"/><polygon points="75,100 70.5,92 79.5,92" class="fg-a"/>
<rect x="20" y="100" width="110" height="56" rx="10" class="fg-b"/><text x="75" y="133" text-anchor="middle" class="fg-t mono">waiting</text>
<rect x="180" y="100" width="110" height="56" rx="10" class="fg-b"/><text x="235" y="133" text-anchor="middle" class="fg-t mono">dealing</text>
<rect x="340" y="100" width="110" height="56" rx="10" class="fg-b hot"/><text x="395" y="133" text-anchor="middle" class="fg-t mono acc">guessing</text>
<rect x="500" y="100" width="110" height="56" rx="10" class="fg-b"/><text x="555" y="133" text-anchor="middle" class="fg-t mono">revealing</text>
<rect x="340" y="230" width="110" height="56" rx="10" class="fg-b alt"/><text x="395" y="263" text-anchor="middle" class="fg-t mono">result</text>
<line x1="130" y1="118" x2="172" y2="118" class="fg-l"/><polygon points="180,118 172,113.5 172,122.5" class="fg-a"/><text x="155" y="110" text-anchor="middle" class="fg-t sm mono">play</text>
<line x1="180" y1="142" x2="138" y2="142" class="fg-l warm"/><polygon points="130,142 138,137.5 138,146.5" class="fg-a warm"/><text x="155" y="166" text-anchor="middle" class="fg-t sm mono warm">fail</text>
<line x1="290" y1="128" x2="332" y2="128" class="fg-l"/><polygon points="340,128 332,123.5 332,132.5" class="fg-a"/><text x="315" y="120" text-anchor="middle" class="fg-t sm mono">dealt</text>
<line x1="450" y1="128" x2="492" y2="128" class="fg-l"/><polygon points="500,128 492,123.5 492,132.5" class="fg-a"/><text x="475" y="120" text-anchor="middle" class="fg-t sm mono">guess</text>
<path d="M555 100 V60 H395 V92" class="fg-l on"/><polygon points="395,100 390.5,92 399.5,92" class="fg-a on"/>
<text x="475" y="52" text-anchor="middle" class="fg-t sm acc">revealed［猜對且還有牌］</text>
<line x1="395" y1="156" x2="395" y2="222" class="fg-l"/><polygon points="395,230 390.5,222 399.5,222" class="fg-a"/><text x="387" y="198" text-anchor="end" class="fg-t sm mono">timeUp</text>
<path d="M555 156 V258 H458" class="fg-l"/><polygon points="450,258 458,253.5 458,262.5" class="fg-a"/>
<text x="563" y="196" class="fg-t sm mono">revealed</text><text x="563" y="212" class="fg-t sm">［其他情況］</text>
<path d="M340 258 H75 V164" class="fg-l alt"/><polygon points="75,156 70.5,164 79.5,164" class="fg-a alt"/><text x="210" y="250" text-anchor="middle" class="fg-t sm mono">done</text>
</svg><figcaption>同一個事件 revealed 有兩條出路，由防護條件決定走哪一條。外面的程式只負責說「翻完了，結果是這樣」，不需要知道接下來該去哪裡。</figcaption></figure>
<h4>每一格都想過一遍，漏洞自己會跑出來</h4>
<p>5 個狀態乘上 7 種事件，一共 35 格，每一格都是一個你要做的決定。照狀態一列一列攤開：</p>
<table>
<tr><th>狀態</th><th>會處理的事件 → 去哪裡</th><th>其他事件</th></tr>
<tr><td>waiting</td><td>play → dealing</td><td>其他 6 種：忽略</td></tr>
<tr><td>dealing</td><td>dealt → guessing；fail → waiting</td><td>其他 5 種：忽略</td></tr>
<tr><td>guessing</td><td>guess → revealing；timeUp → result</td><td>其他 5 種：忽略</td></tr>
<tr><td>revealing</td><td>revealed → guessing 或 result</td><td><b>timeUp：？</b>其他 5 種：忽略</td></tr>
<tr><td>result</td><td>done → waiting</td><td>其他 6 種：忽略</td></tr>
</table>
<p>「忽略」應該是一個刻意的決定，不是忘了寫。打問號的那格最有意思：牌還在翻，伺服器就宣布這局時間到了，該怎麼辦？第六節會回答。重點是：每一格都逼自己想過一遍，這種情況在寫程式之前就被看見；寫成一堆 <code>if</code>，它通常要等玩家回報才被發現。</p>

<h3><span class="badge lv2">進階</span>三、一次轉換的順序，以及「一次只做一件事」</h3>
<p>狀態機的本體很短，但順序不能錯：</p>
<pre><code>export interface PhaseHandler {
  enter(e: Ev): void;
  exit(): void;
}

export class RoundFsm {
  phase: Phase = 'waiting';
  private queue: Ev[] = [];
  private busy = false;
  constructor(private h: Record&lt;Phase, PhaseHandler&gt;,
              private log = console.log) {}

  send(e: Ev) {
    this.queue.push(e);
    if (this.busy) return;   // mid-transition: run it later
    this.busy = true;
    try {
      while (this.queue.length &gt; 0) {
        this.step(this.queue.shift()!);
      }
    } finally {
      this.busy = false;
    }
  }

  private step(e: Ev) {
    const rules = TABLE[this.phase][e.type] ?? [];
    const rule = rules.find((r) =&gt; !r.guard || r.guard(e));
    if (!rule) {
      this.log('[fsm] ignored ' + e.type +
               ' in ' + this.phase);
      return;
    }
    const from = this.phase;
    this.h[from].exit();       // 1. clean up the old state
    this.phase = rule.to;      // 2. switch
    this.log('[fsm] ' + from + ' --' + e.type +
             '--&gt; ' + rule.to);
    this.h[rule.to].enter(e);  // 3. set up the new one
  }
}
</code></pre>
<p>先 exit 舊的、再切換、最後 enter 新的。如果要掛 Mealy 型的動作（只屬於某條轉換的事），就放在 1 和 2 之間。</p>
<p>為什麼要那個佇列？想像 result 的 enter 裡，你為了省事寫了 <code>if (score === 0) fsm.send({ type: 'done' })</code>，想讓零分直接跳過結算。沒有佇列的話，事情會這樣發生：外層的 step 還在跑 enter(result)，裡面又開始一次完整的轉換：exit(result)、切到 waiting、enter(waiting)。等內層跑完、回到外層，外層剩下的程式還以為自己在 result，log 的順序也是反的，讓你懷疑人生。</p>
<p>佇列的規則叫<b>執行到完成</b>（run-to-completion）：一個事件從查表到 enter 結束，中間不插入任何其他事件；途中產生的新事件先排隊，這次做完才輪到它。<code>try／finally</code> 也不能省：某個 enter 丟了例外，而沒有 finally 的話，<code>busy</code> 會永遠停在 true，之後每個事件都只進佇列、不被處理，整台狀態機無聲無息地死掉。</p>
<figure class="figure"><svg viewBox="0 0 680 200" class="fg" style="width:100%;max-width:680px" role="img" aria-label="一次轉換的六個步驟：事件、查表、檢查 guard、exit 舊狀態、換 phase、enter 新狀態；enter 裡送出的新事件先進佇列，這次做完才處理">
<text x="340" y="20" text-anchor="middle" class="fg-t sm">一個事件從頭做到尾，中間不插隊（run-to-completion）</text>
<rect x="11" y="36" width="98" height="58" rx="6" class="fg-b"/><text x="60" y="60" text-anchor="middle" class="fg-t">1 事件</text><text x="60" y="80" text-anchor="middle" class="fg-t sm mono">guess</text>
<rect x="123" y="36" width="98" height="58" rx="6" class="fg-b"/><text x="172" y="60" text-anchor="middle" class="fg-t">2 查表</text><text x="172" y="80" text-anchor="middle" class="fg-t sm">找到 1 條規則</text>
<rect x="235" y="36" width="98" height="58" rx="6" class="fg-b"/><text x="284" y="60" text-anchor="middle" class="fg-t">3 guard</text><text x="284" y="80" text-anchor="middle" class="fg-t sm">都不過就忽略</text>
<rect x="347" y="36" width="98" height="58" rx="6" class="fg-b alt"/><text x="396" y="60" text-anchor="middle" class="fg-t">4 exit 舊的</text><text x="396" y="80" text-anchor="middle" class="fg-t sm">關按鈕、停計時</text>
<rect x="459" y="36" width="98" height="58" rx="6" class="fg-b hot"/><text x="508" y="60" text-anchor="middle" class="fg-t acc">5 換 phase</text><text x="508" y="80" text-anchor="middle" class="fg-t sm mono">revealing</text>
<rect x="571" y="36" width="98" height="58" rx="6" class="fg-b alt"/><text x="620" y="60" text-anchor="middle" class="fg-t">6 enter 新的</text><text x="620" y="80" text-anchor="middle" class="fg-t sm">送請求、翻牌</text>
<line x1="109" y1="65" x2="115" y2="65" class="fg-l"/><polygon points="123,65 115,60.5 115,69.5" class="fg-a"/>
<line x1="221" y1="65" x2="227" y2="65" class="fg-l"/><polygon points="235,65 227,60.5 227,69.5" class="fg-a"/>
<line x1="333" y1="65" x2="339" y2="65" class="fg-l"/><polygon points="347,65 339,60.5 339,69.5" class="fg-a"/>
<line x1="445" y1="65" x2="451" y2="65" class="fg-l"/><polygon points="459,65 451,60.5 451,69.5" class="fg-a"/>
<line x1="557" y1="65" x2="563" y2="65" class="fg-l"/><polygon points="571,65 563,60.5 563,69.5" class="fg-a"/>
<rect x="400" y="140" width="268" height="44" rx="6" class="fg-b warm"/><text x="534" y="167" text-anchor="middle" class="fg-t">enter 裡又送出的事件：先排隊</text>
<line x1="620" y1="94" x2="620" y2="132" class="fg-l warm"/><polygon points="620,140 615.5,132 624.5,132" class="fg-a warm"/><text x="628" y="120" class="fg-t sm mono">send()</text>
<path d="M400 162 H60 V102" class="fg-l alt dash"/><polygon points="60,94 55.5,102 64.5,102" class="fg-a alt"/>
<text x="230" y="154" text-anchor="middle" class="fg-t sm alt">這次做完，才輪到它</text>
</svg><figcaption>六步一口氣做完。第 6 步裡產生的新事件不會立刻插進來，而是排進佇列，等這次轉換結束才從第 1 步開始處理。</figcaption></figure>
<h4>用真實的數字追一次</h4>
<p>這局目前在 guessing，桌上是 9，4 分。玩家按下 Higher：</p>
<table>
<tr><th>時間</th><th>發生什麼</th><th>狀態機做了什麼</th></tr>
<tr><td>0 ms</td><td>點擊，送出 <code>{ type: 'guess', guess: 'higher' }</code></td><td>查表 guessing.guess，找到一條，沒有 guard</td></tr>
<tr><td>0 ms</td><td>exit(guessing)</td><td>關掉兩顆按鈕、停掉倒數</td></tr>
<tr><td>0 ms</td><td>phase = revealing，enter(revealing)</td><td>送出請求，開始播 400 毫秒的翻牌動畫</td></tr>
<tr><td>120 ms</td><td>伺服器回覆：card 11、correct true、over false</td><td>先存起來，動畫還沒播完</td></tr>
<tr><td>400 ms</td><td>動畫播完，送出 <code>revealed</code></td><td>guard 通過第一條，exit(revealing)、enter(guessing)：桌上變 11、5 分，按鈕打開，倒數重新開始</td></tr>
</table>
<p>log 會留下兩行：<code>guessing --guess--&gt; revealing</code> 和 <code>revealing --revealed--&gt; guessing</code>。之後所有的除錯，都從這種 log 開始。</p>

<h3><span class="badge lv2">進階</span>四、計時器跟著狀態走：三種寫法</h3>
<p>狀態機最常見的 bug，就是上一個狀態留下來的計時器，在下一個狀態裡突然觸發。三種計時，三種收法：</p>
<h4>1. 引擎計時器：enter 開、exit 關</h4>
<p>上一課的寫法：enter 裡 <code>scheduleOnce</code>，exit 裡 <code>unschedule</code>。注意 <code>unschedule</code> 必須傳入<b>同一個函式參照</b>。如果你寫的是 <code>this.scheduleOnce(() =&gt; this.timeUp(), 10)</code>，那個箭頭函式每次都是新的，事後根本取消不了。所以上一課才把它寫成方法 <code>this.onTimeUp</code>。</p>
<h4>2. 非同步等待：用「世代編號」作廢晚到的結果</h4>
<p>Promise 沒辦法取消。enter(revealing) 裡 <code>await</code> 一個請求，等回覆的這段時間，狀態可能早就變了：斷線了，或伺服器推來「時間到」。回覆晚到之後，await 後面那幾行照樣會執行。解法是每次進出狀態就把一個編號加一，await 回來先對號碼：</p>
<pre><code>private epoch = 0;   // goes up on every enter and exit

private revealing: PhaseHandler = {
  enter: async (e) =&gt; {
    const my = ++this.epoch;
    if (e.type !== 'guess') return;
    const r = await this.net.request('guess',
                                     { guess: e.guess });
    if (my !== this.epoch) return;  // we left meanwhile
    this.fsm.send({ type: 'revealed', card: r.card,
                    correct: r.correct, over: r.over });
  },
  exit: () =&gt; { this.epoch++; },
};
</code></pre>
<p>exit 裡也加一，所以就算之後又回到同一個狀態，舊的那次等待也對不上號。<code>scheduleOnce</code> 能 <code>unschedule</code>；Promise 不能，就用號碼讓它「回來了也沒用」。用 <code>AbortController</code> 也能做到一樣的事，道理相同。（請求失敗的處理、等動畫播完這兩件事，這段先省略。）</p>
<h4>3. 顯示用的倒數：記住截止時間，不要累加 dt</h4>
<p>倒數最直覺的寫法是在 <code>update(dt)</code> 裡 <code>left -= dt</code>。問題是：瀏覽器分頁切到背景時，<code>requestAnimationFrame</code> 會停，遊戲迴圈跟著停；手機 app 切到背景也一樣。玩家回來時，你的 <code>left</code> 還停在他離開的那一刻，伺服器的時間卻一直在走。正確寫法是記住「截止時間」，每一幀用現在的時間去減：</p>
<pre><code>// in guessing.enter:
//   this.deadline = performance.now() + msLeft;
update() {
  if (this.fsm.phase !== 'guessing') return;
  const now = performance.now();
  const left = Math.max(0, this.deadline - now);
  this.view!.showCountdown(Math.ceil(left / 1000));
}
</code></pre>
<p>這裡用 <code>performance.now()</code>，不用 <code>Date.now()</code>。前者是<b>單調時鐘</b>（monotonic clock），只會往前走；後者是牆上的時鐘，使用者改系統時間、電腦自動校時，它都可能突然跳一下。量「經過了多久」永遠用單調時鐘。另外，Cocos 有 <code>Game.EVENT_SHOW</code> 事件，app 回到前景時觸發，是「馬上檢查連線、重新同步」的好時機。</p>

<h3><span class="badge lv3">專業</span>五、時鐘歸伺服器：截止時間、倒數與時鐘偏差</h3>
<p>連線版裡，「時間到」只能由伺服器宣布，用戶端的倒數只是顯示，讓玩家知道大概還剩多久。但「大概」要多準？差個 300 毫秒，玩家就會覺得被騙：畫面明明還有時間，猜了卻說太晚。要讓顯示準，得先搞懂延遲怎麼影響倒數。</p>
<h4>做法一：伺服器送「還剩幾毫秒」</h4>
<p>伺服器說 <code>msLeft: 10000</code>。這則訊息在路上花了單程延遲，假設 51 毫秒，所以用戶端收到時，真正剩下的只有 9,949 毫秒。如果直接拿 10,000 去算，用戶端的 0 會比伺服器晚 51 毫秒，最後那一小段時間裡的猜測全部會被判太晚。修正方式是扣掉估計的單程延遲，也就是<b>往返時間</b>（round-trip time，RTT）的一半：</p>
<pre><code>this.deadline = performance.now() + msLeft - rtt / 2;
</code></pre>
<figure class="figure"><svg viewBox="0 0 660 240" class="fg" style="width:100%;max-width:660px" role="img" aria-label="截止前最後一刻的時間軸：伺服器截止在 10000 毫秒；用戶端沒扣延遲時，畫面要到 10051 才顯示 0；玩家在 9975 按下，訊息 10026 才到伺服器，被判太晚；扣掉 RTT/2 的畫面會在 9949 就顯示 0">
<text x="20" y="74" class="fg-t">伺服器</text><text x="20" y="184" class="fg-t">用戶端</text>
<line x1="80" y1="70" x2="632" y2="70" class="fg-l"/><polygon points="640,70 632,65.5 632,74.5" class="fg-a"/>
<line x1="80" y1="180" x2="632" y2="180" class="fg-l"/><polygon points="640,180 632,175.5 632,184.5" class="fg-a"/>
<line x1="360" y1="48" x2="360" y2="200" class="fg-l warm dash"/>
<text x="360" y="40" text-anchor="middle" class="fg-t sm warm">截止 10000</text>
<line x1="303.8" y1="180" x2="412.7" y2="75.5" class="fg-l warm"/><polygon points="418.5,70 415.8,78.8 409.6,72.3" class="fg-a warm"/>
<text x="298" y="166" text-anchor="end" class="fg-t sm">9975 按下</text>
<text x="424" y="60" class="fg-t sm warm">✕ 10026 才到，太晚</text>
<circle cx="245.3" cy="180" r="5" class="fg-lamp on"/><text x="239" y="204" text-anchor="end" class="fg-t sm acc">扣掉 RTT/2 的 0</text>
<circle cx="474.8" cy="180" r="5" class="fg-lamp"/><text x="481" y="204" class="fg-t sm warm">沒扣延遲的 0</text>
<line x1="135" y1="176" x2="135" y2="184" class="fg-l"/><line x1="585" y1="176" x2="585" y2="184" class="fg-l"/>
<text x="135" y="228" text-anchor="middle" class="fg-t sm mono">9900</text><text x="360" y="228" text-anchor="middle" class="fg-t sm mono">10000</text><text x="585" y="228" text-anchor="middle" class="fg-t sm mono">10100</text>
</svg><figcaption>時間都換算成伺服器的毫秒，單程延遲 51 ms。沒扣延遲的畫面會多給玩家 51 毫秒的「假時間」，在那段時間裡按下的猜測，到伺服器時都已經過了截止。</figcaption></figure>
<h4>做法二：伺服器送「絕對截止時間」，用戶端估時鐘偏差</h4>
<p>伺服器說 <code>deadline: 15050</code>，這是伺服器時鐘的毫秒數。手機的時鐘跟伺服器不一樣，可能差好幾秒甚至幾分鐘，所以要先估出兩邊差多少，叫<b>時鐘偏差</b>（clock offset）。方法跟網路校時協定 NTP 一樣，用四個時間點：</p>
<figure class="figure"><svg viewBox="0 0 640 250" class="fg" style="width:100%;max-width:640px" role="img" aria-label="估時鐘偏差：用戶端在 t0 等於 1000 送出 ping，伺服器在 t1 等於 5050 收到、t2 等於 5052 回覆，用戶端在 t3 等於 1104 收到；算出 RTT 102 毫秒、偏差 3999 毫秒">
<text x="10" y="54" class="fg-t">伺服器時鐘</text><text x="10" y="174" class="fg-t">用戶端時鐘</text>
<line x1="80" y1="50" x2="612" y2="50" class="fg-l"/><polygon points="620,50 612,45.5 612,54.5" class="fg-a"/>
<line x1="80" y1="170" x2="612" y2="170" class="fg-l"/><polygon points="620,170 612,165.5 612,174.5" class="fg-a"/>
<line x1="150" y1="170" x2="283.9" y2="55.2" class="fg-l alt"/><polygon points="290,50 286.9,58.6 281,51.8" class="fg-a alt"/>
<line x1="320" y1="50" x2="453.9" y2="164.8" class="fg-l on"/><polygon points="460,170 451,168.2 456.9,161.4" class="fg-a on"/>
<circle cx="150" cy="170" r="4" class="fg-lamp on"/><circle cx="290" cy="50" r="4" class="fg-lamp on"/><circle cx="320" cy="50" r="4" class="fg-lamp on"/><circle cx="460" cy="170" r="4" class="fg-lamp on"/>
<text x="150" y="192" text-anchor="middle" class="fg-t sm mono">t0 = 1000</text>
<text x="286" y="36" text-anchor="end" class="fg-t sm mono">t1 = 5050</text>
<text x="324" y="36" class="fg-t sm mono">t2 = 5052</text>
<text x="460" y="192" text-anchor="middle" class="fg-t sm mono">t3 = 1104</text>
<text x="208" y="106" text-anchor="end" class="fg-t sm alt">ping（帶 t0）</text>
<text x="402" y="106" class="fg-t sm acc">pong（帶 t1、t2）</text>
<text x="320" y="222" text-anchor="middle" class="fg-t sm mono">RTT = (t3 - t0) - (t2 - t1) = 104 - 2 = 102 ms</text>
<text x="320" y="240" text-anchor="middle" class="fg-t sm mono">offset = ((t1 - t0) + (t2 - t3)) / 2 = (4050 + 3948) / 2 = 3999 ms</text>
</svg><figcaption>兩條線是兩個各走各的時鐘。去程和回程各量到一次「時鐘差加上單程延遲」，一加一減，延遲就互相抵消，剩下時鐘差。</figcaption></figure>
<ol>
<li>用戶端記下 t0 = 1000（自己的時鐘），送出 ping。</li>
<li>伺服器在 t1 = 5050 收到，在 t2 = 5052 回覆，兩個時間都寫進 pong。</li>
<li>用戶端在 t3 = 1104 收到。</li>
</ol>
<p>往返時間 = (t3 − t0) − (t2 − t1) = 104 − 2 = 102 毫秒，扣掉的 2 毫秒是伺服器自己處理的時間。偏差 = ((t1 − t0) + (t2 − t3)) / 2 = (4050 + 3948) / 2 = 3999 毫秒，也就是「伺服器時鐘 ≈ 用戶端時鐘 + 3999」。之後伺服器說截止在 15050，用戶端就知道是自己時鐘的 11051。</p>
<p>這個公式假設去程和回程一樣長。如果不一樣（上傳比下載慢很常見），誤差最多會到 RTT 的一半，這是物理限制，沒有公式消得掉。實務上的三個技巧：</p>
<ul>
<li><b>量好幾次，取 RTT 最小的那一次。</b>RTT 大的那幾次，通常是在某個佇列裡塞車，去回程最不對稱。</li>
<li><b>順便量。</b>心跳本來就每幾秒來回一次（下一課會講），在 pong 裡帶上 t1、t2，就有源源不絕的樣本，不必另外發。</li>
<li><b>用單調時鐘量。</b>t0、t3 用 <code>performance.now()</code>，不然使用者一改系統時間，偏差就整個錯掉。</li>
</ul>
<h4>最後一刻的猜測，到底算不算</h4>
<p>就算時鐘對準了，玩家在畫面剩 0.05 秒時按下去，訊息還要再飛 51 毫秒，到伺服器時已經過了截止。公平的做法有兩種，各有代價：</p>
<table>
<tr><th>做法</th><th>好處</th><th>代價</th></tr>
<tr><td>用戶端提早 RTT/2 關掉按鈕</td><td>畫面上能按的，就一定算數；伺服器規則簡單</td><td>延遲高的玩家，實際能用的時間比較少</td></tr>
<tr><td>伺服器多給一點寬限，例如 200 毫秒</td><td>延遲高的玩家不吃虧</td><td>寬限就是多出來的時間，有人會刻意延遲送出來佔便宜；寬限越大越好鑽</td></tr>
</table>
<p>寬限給多少是設計決定，沒有標準答案。唯一不能做的，是讓用戶端自己判定「我在時間內」：那等於把計時器交給玩家。</p>

<h3><span class="badge lv3">專業</span>六、訊息在錯的狀態到了</h3>
<p>上一課說過，點擊要先問「我還在該在的狀態嗎」。網路訊息更需要問，因為它們會晚到、會重複、會跳號，甚至屬於上一局。每一則進來的推播，照這個順序過三關：</p>
<figure class="figure"><svg viewBox="155 0 520 300" class="fg" style="width:100%;max-width:520px" role="img" aria-label="推播進來後的三道關卡：先看 round 是不是這一局，不是就丟；再看 seq 是不是下一號，重複就丟、跳號就重新同步；最後看表上這一格有沒有規則，有就轉換，沒有就延後或記 log 忽略">
<rect x="190" y="8" width="200" height="36" rx="6" class="fg-b alt"/><text x="290" y="31" text-anchor="middle" class="fg-t">一則推播進來</text>
<line x1="290" y1="44" x2="290" y2="62" class="fg-l"/><polygon points="290,70 285.5,62 294.5,62" class="fg-a"/>
<rect x="180" y="70" width="220" height="40" rx="6" class="fg-b"/><text x="290" y="95" text-anchor="middle" class="fg-t">1 round 是這一局？</text>
<line x1="290" y1="110" x2="290" y2="122" class="fg-l on"/><polygon points="290,130 285.5,122 294.5,122" class="fg-a on"/><text x="298" y="125" class="fg-t sm acc">是</text>
<rect x="180" y="130" width="220" height="40" rx="6" class="fg-b"/><text x="290" y="155" text-anchor="middle" class="fg-t">2 seq 剛好是下一號？</text>
<line x1="290" y1="170" x2="290" y2="182" class="fg-l on"/><polygon points="290,190 285.5,182 294.5,182" class="fg-a on"/><text x="298" y="185" class="fg-t sm acc">是</text>
<rect x="180" y="190" width="220" height="40" rx="6" class="fg-b"/><text x="290" y="215" text-anchor="middle" class="fg-t">3 表上這一格有規則？</text>
<line x1="290" y1="230" x2="290" y2="242" class="fg-l on"/><polygon points="290,250 285.5,242 294.5,242" class="fg-a on"/><text x="298" y="245" class="fg-t sm acc">有</text>
<rect x="180" y="250" width="220" height="40" rx="6" class="fg-b hot"/><text x="290" y="275" text-anchor="middle" class="fg-t acc">照表轉換，lastSeq + 1</text>
<line x1="400" y1="90" x2="452" y2="90" class="fg-l warm"/><polygon points="460,90 452,85.5 452,94.5" class="fg-a warm"/><text x="426" y="83" text-anchor="middle" class="fg-t sm warm">不是</text>
<line x1="400" y1="150" x2="452" y2="150" class="fg-l warm"/><polygon points="460,150 452,145.5 452,154.5" class="fg-a warm"/><text x="426" y="143" text-anchor="middle" class="fg-t sm warm">不是</text>
<line x1="400" y1="210" x2="452" y2="210" class="fg-l warm"/><polygon points="460,210 452,205.5 452,214.5" class="fg-a warm"/><text x="426" y="203" text-anchor="middle" class="fg-t sm warm">沒有</text>
<rect x="460" y="70" width="190" height="40" rx="6" class="fg-b warm"/><text x="555" y="95" text-anchor="middle" class="fg-t">丟掉（別局的）</text>
<rect x="460" y="126" width="190" height="48" rx="6" class="fg-b warm"/><text x="555" y="146" text-anchor="middle" class="fg-t sm">重複 → 丟掉</text><text x="555" y="164" text-anchor="middle" class="fg-t sm">跳號 → 重新同步</text>
<rect x="460" y="186" width="190" height="48" rx="6" class="fg-b warm"/><text x="555" y="206" text-anchor="middle" class="fg-t sm">能延後 → 先存起來</text><text x="555" y="224" text-anchor="middle" class="fg-t sm">不能 → 記 log，忽略</text>
</svg><figcaption>先過濾「不屬於現在」的訊息，再過濾「重複或漏掉」的訊息，最後才交給狀態機查表。順序不能反：一則上一局的訊息，不該有機會碰到這一局的表。</figcaption></figure>
<table>
<tr><th>情況</th><th>例子</th><th>做法</th></tr>
<tr><td>屬於別局</td><td>上一局的 <code>timeUp</code> 現在才到</td><td>每則訊息帶 <code>round</code> 編號，不是這一局就丟</td></tr>
<tr><td>重複</td><td>斷線重連後，同一則翻牌收到兩次</td><td>每則推播帶遞增的 <code>seq</code>，小於等於已處理的就丟</td></tr>
<tr><td>跳號</td><td>處理到 seq 41，下一則是 44</td><td>不要猜中間發生了什麼，直接要求重新同步</td></tr>
<tr><td>太早</td><td>翻牌動畫還沒播完，伺服器已經推了「時間到」</td><td>先存起來，動畫播完時一起決定去哪裡</td></tr>
<tr><td>表上本來就忽略</td><td>result 收到 <code>timeUp</code></td><td>記一行 log，丟掉</td></tr>
</table>
<p>「太早」最容易做錯，它也就是上面那張表裡打問號的那一格。翻牌動畫要 400 毫秒，伺服器卻可能在這期間推來「這局時間到了」（例如它判定那次猜測太晚）。如果 revealing 收到就馬上跳 result，玩家會看到牌還沒翻完，結算畫面就蓋了上來。狀態圖的術語叫<b>延後事件</b>（deferred event）：這個狀態不處理它，但也不丟掉，留著之後再看。最簡單的實作，是在 revealing 期間把它記在一個欄位裡：</p>
<pre><code>interface Reveal {
  card: number; correct: boolean; over: boolean;
}
private lateTimeUp = false;  // revealing.exit clears it too

onTimeUpPush() {
  if (this.fsm.phase === 'revealing') {
    this.lateTimeUp = true;    // defer: card still flipping
    return;
  }
  this.fsm.send({ type: 'timeUp' });
}
// the flip animation has finished and the reply is in
onFlipDone(r: Reveal) {
  const over = r.over || this.lateTimeUp;
  this.lateTimeUp = false;
  this.fsm.send({ type: 'revealed', card: r.card,
                  correct: r.correct, over });
}
</code></pre>
<p>「跳號」也值得多說一句。很多人會想：我錯過了 42、43，請伺服器補送這兩則就好。聊天訊息可以這樣做；遊戲狀態通常不值得。補送需要伺服器替每個玩家保存訊息歷史，而重新同步只要一份當下的快照，簡單又不會錯。</p>

<h3><span class="badge lv4">專家</span>七、階層式狀態：狀態裡面還有狀態</h3>
<p>上一課提過：整個 app 有自己的狀態機，一局的狀態機只在「遊戲中」裡面跑。這種設計正式的名字叫<b>階層式狀態機</b>（hierarchical state machine），來自 David Harel 在 1987 年提出的狀態圖（statecharts）。白話講就是：一個大狀態裡可以再分小狀態，而寫在大狀態上的規則，裡面每一個小狀態都自動適用。</p>
<figure class="figure"><svg viewBox="0 0 660 290" class="fg" style="width:100%;max-width:660px" role="img" aria-label="階層式狀態機：App 裡有載入中、大廳、遊戲中、重連中；遊戲中裡面包著一局的五個子狀態；斷線這條規則寫在遊戲中這個外層，五個子狀態都適用">
<rect x="10" y="10" width="640" height="270" rx="12" class="fg-b"/><text x="26" y="36" class="fg-t lg">App 狀態機</text>
<rect x="30" y="70" width="100" height="44" rx="8" class="fg-b"/><text x="80" y="97" text-anchor="middle" class="fg-t">載入中</text>
<rect x="30" y="160" width="100" height="44" rx="8" class="fg-b"/><text x="80" y="187" text-anchor="middle" class="fg-t">大廳</text>
<line x1="80" y1="114" x2="80" y2="152" class="fg-l"/><polygon points="80,160 75.5,152 84.5,152" class="fg-a"/>
<line x1="130" y1="182" x2="152" y2="182" class="fg-l"/><polygon points="160,182 152,177.5 152,186.5" class="fg-a"/>
<rect x="160" y="50" width="330" height="180" rx="10" class="fg-b alt"/>
<text x="176" y="74" class="fg-t alt">遊戲中（一局的狀態機在裡面）</text>
<rect x="180" y="92" width="90" height="34" rx="6" class="fg-b"/><text x="225" y="114" text-anchor="middle" class="fg-t sm mono">waiting</text>
<rect x="285" y="92" width="90" height="34" rx="6" class="fg-b"/><text x="330" y="114" text-anchor="middle" class="fg-t sm mono">dealing</text>
<rect x="390" y="92" width="90" height="34" rx="6" class="fg-b hot"/><text x="435" y="114" text-anchor="middle" class="fg-t sm mono acc">guessing</text>
<rect x="232" y="150" width="90" height="34" rx="6" class="fg-b"/><text x="277" y="172" text-anchor="middle" class="fg-t sm mono">revealing</text>
<rect x="337" y="150" width="90" height="34" rx="6" class="fg-b"/><text x="382" y="172" text-anchor="middle" class="fg-t sm mono">result</text>
<text x="325" y="212" text-anchor="middle" class="fg-t sm">外層的規則，五個子狀態都適用</text>
<rect x="540" y="110" width="100" height="56" rx="8" class="fg-b warm"/><text x="590" y="143" text-anchor="middle" class="fg-t">重連中</text>
<line x1="490" y1="124" x2="532" y2="124" class="fg-l warm"/><polygon points="540,124 532,119.5 532,128.5" class="fg-a warm"/><text x="515" y="116" text-anchor="middle" class="fg-t sm warm">斷線</text>
<line x1="540" y1="152" x2="498" y2="152" class="fg-l on"/><polygon points="490,152 498,147.5 498,156.5" class="fg-a on"/><text x="515" y="170" text-anchor="middle" class="fg-t sm acc">快照</text>
<text x="330" y="252" text-anchor="middle" class="fg-t sm">斷線：exit guessing → exit 遊戲中 → enter 重連中</text>
<text x="330" y="270" text-anchor="middle" class="fg-t sm">回來：enter 遊戲中 → enter 快照指定的子狀態</text>
</svg><figcaption>「斷線」只寫一次，從外框出發，不管當時在哪個子狀態都適用。回來時落在哪個子狀態，不是記憶決定的，是伺服器的快照決定的。</figcaption></figure>
<p>最大的好處是「斷線」這種事件只要寫一次。沒有階層的話，五個子狀態都要各寫一條「斷線 → 重連中」，漏一條就是一個 bug。有階層，就在「遊戲中」這個外層寫一條，五個子狀態全部適用。</p>
<p>進出的順序有固定規則：<b>離開由內而外，進入由外而內</b>。</p>
<ul>
<li>在 guessing 時斷線：先 exit(guessing)（關按鈕、停倒數），再 exit(遊戲中)（收起牌桌共用的 UI），最後 enter(重連中)。</li>
<li>重連回來：先 enter(遊戲中)（擺好牌桌），再 enter 快照指定的那個子狀態。</li>
</ul>
<p>狀態圖還有一個「歷史狀態」（history state）的功能：離開外層時記住最後在哪個子狀態，回來時直接回到那裡。聽起來正適合斷線重連，但在連線遊戲裡<b>不要用</b>。你離開的這段時間，伺服器上的那一局還在跑；記住的是過去，伺服器的快照才是現在。</p>
<p>自己實作，不需要通用的階層引擎。最實用的做法是兩台狀態機：外層 <code>AppFsm</code> 進入「遊戲中」時建立一台 <code>RoundFsm</code>，離開時先讓它 exit 目前的子狀態，再把它丟掉。另外，有些狀態彼此獨立，例如「設定面板開著或關著」，跟這一局進行到哪一步毫無關係，這叫<b>並行區域</b>（orthogonal regions）。不要把它們乘在一起變成 10 個狀態，分成兩台各自的小狀態機就好。真的需要完整的狀態圖功能時，JavaScript 有現成的 XState 函式庫。</p>

<h3><span class="badge lv4">專家</span>八、斷線回來，落在對的狀態</h3>
<p>上一課的重點是 <code>jump(snap.phase, snap)</code>。真實的重連還有一個時間差要處理：新連線一打開，伺服器的推播可能比你要的快照先到。</p>
<pre><code>interface Snapshot {
  round: number; seq: number; phase: Phase;
  current: number; score: number; msLeft: number;
}
</code></pre>
<p>用一個例子追：斷線前處理到 seq 41。重連後先收到 seq 43 的推播，接著才收到快照，快照上寫著 seq 42、phase guessing。</p>
<ol>
<li><b>重連中先不處理推播</b>，全部暫存起來：[43]。</li>
<li>快照到了：<code>jump('guessing', snap)</code>。enter 只靠快照的資料把畫面建出來：目前的牌、分數，以及用 <code>msLeft</code> 扣掉 RTT/2 算出的截止時間。</li>
<li>把 lastSeq 設成快照的 42，再處理暫存的推播：43 剛好是下一號，套用；如果暫存區裡有 41 或 42，就丟掉。</li>
<li>之後的推播照正常流程走，回到上一節那三道關卡。</li>
</ol>
<p>這跟資料庫從備份復原是同一個道理：先載入某一刻的快照，再重播那一刻之後的紀錄。順序反了（先套用 43，再用快照蓋回 42），畫面就會倒退一步。</p>
<p><code>jump()</code> 跳過查表，是整台狀態機唯一的後門，所以要守兩條規矩：只有重新同步可以用它；它一樣要先 exit 目前的狀態，才不會留下計時器。實作上，可以在 <code>Ev</code> 多加一種 <code>{ type: 'resume'; snap: Snapshot }</code>，它不進表，只給 jump 用；每個 enter 看到 resume，就照快照建畫面。</p>

<h3><span class="badge lv4">專家</span>九、狀態機的 bug 怎麼抓：log 與畫圖</h3>
<p>狀態機的 bug 幾乎都屬於這五種，每一種在 log 裡都有特徵：</p>
<table>
<tr><th>bug</th><th>症狀</th><th>log 裡長怎樣</th></tr>
<tr><td>漏了一條轉換</td><td>遊戲卡住不動</td><td>最後一行是 <code>ignored X in Y</code>，之後一片空白</td></tr>
<tr><td>計時器殘留</td><td>莫名其妙跳到結算</td><td>一行你沒預期的 <code>--timeUp--&gt;</code>，時間點跟這次倒數對不上</td></tr>
<tr><td>重入</td><td>畫面和狀態對不上</td><td>enter 的 log 順序跟轉換的順序相反</td></tr>
<tr><td>enter 依賴上一個狀態</td><td>只有重連後才壞</td><td>壞掉的那次前面是 resume，不是正常轉換</td></tr>
<tr><td>有人繞過狀態機改 phase</td><td>什麼怪事都可能</td><td>狀態變了，卻沒有對應的轉換 log</td></tr>
</table>
<p>所以 log 要做得好查。每一行固定格式，帶上時間、局數、當時處理到的 seq：</p>
<pre><code>[fsm] 12:00:03.120 r17 s42 guessing --guess--&gt; revealing
[fsm] 12:00:03.520 r17 s43 revealing --revealed--&gt; guessing
[fsm] 12:00:09.884 r17 s44 ignored timeUp in result
</code></pre>
<p>再把最近 100 行存在一個<b>環形緩衝區</b>（ring buffer）裡，玩家按「回報問題」或程式丟出例外時，一起附上去。看 bug 回報時，你最需要的不是玩家的描述，而是這 100 行。</p>
<h4>讓圖從表產生，永遠不會過時</h4>
<p>手畫的狀態圖，兩個月後一定跟程式對不上。既然轉換已經寫成資料，就讓程式把它變成圖。Mermaid 是一種用文字描述圖表的格式，GitHub 和很多文件工具都能直接顯示：</p>
<pre><code>export function toMermaid(): string {
  const out = ['stateDiagram-v2', '  [*] --&gt; waiting'];
  for (const [from, evs] of Object.entries(TABLE))
    for (const [ev, rules] of Object.entries(evs))
      for (const r of rules ?? [])
        out.push('  ' + from + ' --&gt; ' + r.to + ' : ' + ev);
  return out.join('\\n');
}
// stateDiagram-v2
//   [*] --&gt; waiting
//   waiting --&gt; dealing : play
//   dealing --&gt; guessing : dealt ...
</code></pre>
<p>更進一步，在測試版裡統計每條箭頭被走過幾次。玩過一百局之後，次數還是 0 的箭頭，代表那條路從來沒被測過，或者根本不該存在。也可以在每次轉換後檢查<b>不變量</b>，例如「按鈕可以按，若且唯若現在是 guessing」，只在開發版啟用，一違反就立刻丟錯，把 bug 擋在發生的那一刻，而不是三個畫面之後。</p>
<h4>表也可以整張拿去測</h4>
<pre><code>type Case = [Phase, Ev, Phase];
const cases: Case[] = [
  ['waiting', { type: 'play' }, 'dealing'],
  ['waiting', { type: 'guess', guess: 'lower' }, 'waiting'],
  ['revealing', { type: 'revealed', card: 11,
                  correct: true, over: false }, 'guessing'],
  ['revealing', { type: 'revealed', card: 2,
                  correct: false, over: true }, 'result'],
];
it.each(cases)('%s + %o -&gt; %s', (from, ev, to) =&gt; {
  const fsm = machineAt(from);   // helper: no-op handlers
  fsm.send(ev);
  expect(fsm.phase).toBe(to);
});
</code></pre>
<p>表上有 35 格，就寫 35 個案例，包括所有「忽略」。忽略也是一種行為，值得被測。</p>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>狀態機就是一個大 switch</td><td>switch 只是寫法之一。本質是「狀態清單＋允許的轉換」，寫成資料之後才能測、能畫、能統計。</td></tr>
<tr><td>狀態分得越細越安全</td><td>分數、目前的牌這種「資料」不該變成狀態，不要有 score3 這種狀態。狀態只描述「現在能做什麼」，其他的放在變數裡（狀態圖的術語叫延伸狀態，extended state）。</td></tr>
<tr><td>按鈕關掉，就不會收到點擊</td><td>關按鈕是禮貌。連點、晚到的網路訊息、晚到的計時器都不看按鈕，防護條件才是防線。</td></tr>
<tr><td>用戶端倒數到 0，就是時間到</td><td>只有伺服器能宣布。用戶端的 0 只是預估，而且可能早、可能晚。</td></tr>
<tr><td>重連後回到斷線前的狀態就好</td><td>你離開時世界還在動。要用伺服器的快照，不是用記憶。</td></tr>
<tr><td><code>Date.now()</code> 拿來量經過時間就好</td><td>牆上時鐘會跳。量經過時間用 <code>performance.now()</code> 這種單調時鐘。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>Vue</b>：頁面的「載入中、成功、失敗、沒資料」用一個聯集型別的 <code>phase</code> 取代三個布林值；表單送出也是一台狀態機（編輯中、送出中、成功、失敗）。XState 有 Vue 的整合套件，可以直接用在 Composition API 裡。</li>
<li><b>Node.js／Go 伺服器</b>：權威的那台狀態機在伺服器上，每個房間一台。Go 常見的寫法是每個房間一個 goroutine，用 channel 收事件、在 <code>for</code>／<code>select</code> 迴圈裡一次處理一個，天生就是執行到完成。Node.js 是單執行緒，一段同步程式跑完之前，不會被別的訊息打斷；但一碰到 <code>await</code> 就不是了，世代編號一樣要用。</li>
<li><b>DevOps</b>：TCP 連線本身就是狀態機（LISTEN、SYN-SENT、ESTABLISHED、TIME-WAIT……）。<code>ss -tan</code> 印出來的第一欄就是每條連線的狀態；看到大量 CLOSE-WAIT，就是有程式收到對方關閉後，自己一直沒關。</li>
<li><b>Unity</b>：Animator Controller 就是一台視覺化的狀態機，很適合管動畫。但遊戲規則不要放進 Animator，理由跟這一章一樣：要能測、要能搬到伺服器上跑。</li>
<li><b>Cocos</b>：這一章的 <code>RoundFsm</code> 沒有 import <code>'cc'</code>，計時器由外殼負責，所以同一個檔案可以直接拿到 Node.js 伺服器上用。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<p>做連線遊戲、即時系統的職缺特別愛問這些。先自己講一遍，再看參考答案。</p>
<ol>
<li>「為什麼要用狀態機，而不是幾個布林旗標？」</li>
<li>「線上遊戲的倒數，用戶端和伺服器誰說了算？怎麼讓用戶端顯示得準？」</li>
<li>「你怎麼估算用戶端和伺服器的時鐘偏差？誤差從哪裡來？」</li>
<li>「收到一則不屬於目前狀態的訊息，你會怎麼處理？」</li>
<li>「玩家斷線重連，怎麼讓他回到正確的畫面？」</li>
<li>「一台狀態機偶爾會卡住，你會怎麼查？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>n 個布林值會組出 2 的 n 次方種組合，大部分不合理，卻都寫得出來。狀態機用一個變數表示目前的狀態，不可能的組合根本表示不出來；允許的轉換寫成一張表，就能測、能畫、能記 log；不在表上的事件被明確拒絕，連點、晚到的訊息也不會把狀態弄亂。</li>
<li>伺服器說了算。伺服器保存截止時間並宣布時間到；用戶端只顯示。伺服器送剩餘毫秒時，用戶端扣掉 RTT 的一半；送絕對時間時，用戶端先估時鐘偏差再換算。顯示時記住截止時間、每幀用單調時鐘重算剩餘時間，不要累加 dt，因為背景時遊戲迴圈會停。最後一刻的輸入由伺服器依抵達時間判定，用戶端可以提早 RTT/2 關按鈕，或伺服器給一個小寬限，兩者是公平性和被利用之間的取捨。</li>
<li>用 NTP 的四個時間點：用戶端送出 t0，伺服器收到 t1、回覆 t2，用戶端收到 t3。RTT 等於 (t3 − t0) − (t2 − t1)，偏差等於 ((t1 − t0) + (t2 − t3)) / 2。公式假設去回程等長，不對稱時誤差最多到 RTT 的一半。做法是量多次取 RTT 最小的樣本、搭心跳順便量、用 performance.now() 這種單調時鐘量本地時間。</li>
<li>依序過濾：局數不符就丟；seq 小於等於已處理的就丟，跳號就要求重新同步；最後交給狀態機查表，表上沒有的記 log 忽略，需要等目前狀態做完的（例如動畫還在播）就延後處理。另外，非同步等待回來的結果要用世代編號或 AbortController 檢查，狀態已經變了就不要動作。</li>
<li>斷線事件寫在外層狀態，任何子狀態都會先 exit，停掉計時器和輸入，進入重連中。重連用退避加隨機；連上後帶 token 要快照，快照包含局數、seq、phase、資料、剩餘時間。快照到之前的推播先暫存。用 jump 直接進入快照的狀態，enter 只靠資料建畫面；然後把 lastSeq 設成快照的 seq，丟掉暫存裡不超過它的，套用之後的，有跳號就再同步一次。</li>
<li>先拿 log：最後幾行轉換和 ignored 的紀錄通常直接指出是哪個狀態收到了哪個沒處理的事件，也就是漏了一條轉換；再檢查計時器有沒有在 exit 取消、有沒有在 enter 裡同步送事件造成重入、await 回來有沒有檢查狀態。接著用模擬伺服器的故障注入（延遲、重複、亂序、中途斷線）重現。修好後把那一格加進矩陣測試，並在開發版加不變量檢查。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>t0 = 2000、t1 = 9030、t2 = 9031、t3 = 2100。算出 RTT 和時鐘偏差。如果伺服器說截止在 20000，那是用戶端時鐘的多少？</li>
<li>伺服器送 <code>msLeft: 8000</code>，玩家的 RTT 是 300 毫秒，用戶端沒有扣延遲。用戶端畫面的 0 會比真正的截止晚多少？哪一段時間裡的猜測會被判太晚？</li>
<li>企劃要加一個設定面板，開著的時候這局要不要暫停？如果不暫停，「設定面板開著」應不應該變成 <code>RoundFsm</code> 裡的一個狀態？為什麼？</li>
<li>log 裡有這兩行：<code>11:59:53.900 enter guessing</code>、<code>12:00:03.900 guessing --timeUp--&gt; result</code>，中間在 12:00:03.120 和 03.520 各有一次 guess 和 revealed 的轉換，玩家說「倒數明明還有 9 秒就結束了」。guessing 的 enter 是 <code>this.scheduleOnce(() =&gt; this.fsm.send({ type: 'timeUp' }), 10)</code>，exit 是 <code>this.unschedule(this.onTimeUp)</code>。bug 在哪？</li>
<li>斷線前 lastSeq 是 70。重連中暫存了 seq 71、72、73 三則推播，接著快照到了，seq 是 72。哪幾則要丟、哪幾則要套用？如果暫存區裡只有一則 seq 74 呢？</li>
<li>上一課提到的四個旗標 <code>isDealing</code>、<code>isRevealing</code>、<code>canClick</code>、<code>gameOver</code>，16 種組合裡哪幾種是合法的？各對應哪個狀態？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>RTT = (2100 − 2000) − (9031 − 9030) = 99 毫秒。偏差 = ((9030 − 2000) + (9031 − 2100)) / 2 = (7030 + 6931) / 2 = 6980.5 毫秒。截止 20000 換成用戶端時鐘是 20000 − 6980.5 = 13019.5。</li>
<li>單程延遲約 150 毫秒，所以畫面的 0 比真正的截止晚大約 150 毫秒。再加上猜測送出去也要 150 毫秒才到，所以畫面剩大約 0.3 秒以內按下的猜測，都會被判太晚。修法：截止時間扣掉 RTT/2，或提早關按鈕。</li>
<li>不應該。伺服器上的這一局照樣在跑，面板跟這局進行到哪一步毫無關係，是並行的另一件事。做成另一台小狀態機（或一個 UI 狀態），兩者各管各的；如果開面板時不准猜，就在點擊的防護條件裡同時檢查兩者。若是單人離線模式要真的暫停，那「暫停」才會影響計時，屬於這一局的事。</li>
<li>exit 取消的是 <code>this.onTimeUp</code>，但 enter 註冊的是一個匿名箭頭函式，兩者不是同一個參照，所以計時器從來沒被取消。11:59:53.900 第一次進 guessing 時排的 10 秒計時器，在 12:00:03.900 照樣觸發，而這時已經是第二輪 guessing（03.520 才開始），於是倒數才跑了 0.38 秒就結束。修法：enter 用 <code>this.scheduleOnce(this.onTimeUp, 10)</code>，exit 取消同一個方法。</li>
<li>71、72 都小於等於快照的 72，丟掉；73 剛好是下一號，套用。如果只有 74：下一號應該是 73，出現跳號，不要套用，再要求一次重新同步。</li>
<li>只有 5 種合法：全部 false（waiting）、只有 isDealing（dealing）、只有 canClick（guessing）、只有 isRevealing（revealing）、只有 gameOver（result）。另外 11 種都是不可能的組合，例如「發牌中又能點」，用狀態機就寫不出來。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>Robert Nystrom《Game Programming Patterns》的 State 章</b>（<a href="https://gameprogrammingpatterns.com/state.html">gameprogrammingpatterns.com</a>，線上免費）：從一堆布林旗標一路重構到狀態機、並行狀態機、階層式狀態機和下推自動機，全是遊戲的例子。</li>
<li><b>David Harel〈Statecharts: A Visual Formalism for Complex Systems〉</b>（1987）：階層、並行、歷史狀態的原始論文，圖很多，比想像中好讀。</li>
<li><b>XState 官方文件</b>（<a href="https://stately.ai/docs">stately.ai/docs</a>）：JavaScript／TypeScript 的狀態圖函式庫，文件本身就是一份很好的狀態圖教學。</li>
<li><b>RFC 5905（NTPv4）</b>（<a href="https://www.rfc-editor.org/rfc/rfc5905">rfc-editor.org</a>）：網路校時協定的規格，偏差和往返延遲的公式就是從這裡來的。</li>
<li><b>Mermaid 的狀態圖語法</b>（<a href="https://mermaid.js.org/syntax/stateDiagram.html">mermaid.js.org</a>）：用文字寫狀態圖，搭配這一章的 <code>toMermaid()</code>，讓文件跟程式永遠同步。</li>
</ul>
` });
