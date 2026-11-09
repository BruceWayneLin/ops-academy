DEEP({ 'ts-patterns': `
<p>上一課認識了五種模式，每種一個小例子。這一章把每一種拆成四件事：一張圖、一份型別正確的 TypeScript 實作、它什麼時候幫你、什麼時候害你。再補上三樣大專案裡天天碰到的東西：能復原的命令模式、不用框架的相依注入，以及 SOLID 五條原則，每一條都有改寫前後的程式。讀完之後，你在別人的程式裡看到一個 <code>EventBus</code> 或一個 <code>static getInstance()</code>，就知道該檢查哪幾個地方。</p>

<h3><span class="badge lv1">基礎</span>一、模式是什麼：圍棋的定式</h3>
<p>下圍棋的人都背過<b>定式</b>：角落的某個局面，前人已經試出一串公認不吃虧的下法。定式不是規則，而是經驗；背了定式不會讓你變高手，但不懂定式，你會一直在同一個地方吃虧。更重要的是，局面不對還硬套定式，反而會輸。</p>
<p><b>設計模式</b>（design pattern）就是寫程式的定式。1994 年有四位作者把物件導向程式裡反覆出現的 23 種解法整理成一本書，大家叫他們四人幫（Gang of Four，GoF），分成三類：<b>建立型</b>（怎麼做出物件，例如工廠、單例）、<b>結構型</b>（物件怎麼組合）、<b>行為型</b>（物件之間怎麼分工、溝通，例如觀察者、策略、命令、狀態）。</p>
<h4>讀任何一個模式，問四個問題</h4>
<ol>
<li><b>它解決什麼痛？</b>沒有這個痛，就不需要它。</li>
<li><b>它的形狀是什麼？</b>誰認識誰、誰呼叫誰。</li>
<li><b>它讓什麼變容易？</b>通常是「某一種改變」：加新種類、換做法、加新的聽眾。</li>
<li><b>它的代價是什麼？</b>每個模式都會多一層間接，程式變得比較難從頭追到尾。</li>
</ol>
<p>還有一件事要先知道：GoF 那本書的例子是 C++ 和 Smalltalk，很多模式是為了彌補「函式不能當成值傳來傳去」。TypeScript 的函式是一等公民（first-class），模組本身就只會執行一次，型別又是看形狀的結構型別（structural typing），所以很多模式在 TypeScript 裡會縮小成一個函式、一個物件，甚至一行。看到有人用十個 class 實作一個策略模式，通常是從 Java 搬過來的習慣。</p>

<h3><span class="badge lv1">基礎</span>二、工廠與策略：最小的兩個模式</h3>
<figure class="figure"><svg viewBox="0 0 680 250" class="fg" style="width:100%;max-width:680px" role="img" aria-label="左邊工廠：關卡資料寫著 bat 等級 5，spawn 查 registry 表找到做蝙蝠的函式，做出一隻 hp 11 的蝙蝠；右邊策略：addPoints 有一個插槽，可以插入 flat、combo 或自己寫的計分函式">
<text x="170" y="22" text-anchor="middle" class="fg-t lg">工廠：查表決定做哪一種</text>
<rect x="10" y="44" width="96" height="48" rx="6" class="fg-b"/><text x="58" y="64" text-anchor="middle" class="fg-t sm mono">'bat', 5</text><text x="58" y="82" text-anchor="middle" class="fg-t sm">關卡資料</text>
<line x1="106" y1="68" x2="120" y2="68" class="fg-l"/><polygon points="128,68 120,63.5 120,72.5" class="fg-a"/>
<rect x="128" y="44" width="84" height="48" rx="6" class="fg-b hot"/><text x="170" y="73" text-anchor="middle" class="fg-t mono acc">spawn()</text>
<line x1="212" y1="68" x2="226" y2="68" class="fg-l on"/><polygon points="234,68 226,63.5 226,72.5" class="fg-a on"/>
<rect x="234" y="44" width="90" height="48" rx="6" class="fg-b"/><text x="279" y="64" text-anchor="middle" class="fg-t sm">一隻蝙蝠</text><text x="279" y="82" text-anchor="middle" class="fg-t sm mono">hp 11</text>
<line x1="170" y1="92" x2="170" y2="110" class="fg-l"/><polygon points="170,118 165.5,110 174.5,110" class="fg-a"/>
<text x="178" y="108" class="fg-t sm">查表</text>
<rect x="118" y="118" width="210" height="104" rx="8" class="fg-b alt"/>
<text x="223" y="137" text-anchor="middle" class="fg-t mono">registry</text>
<rect x="130" y="146" width="186" height="24" rx="4" class="fg-b"/><text x="140" y="162" class="fg-t sm mono">slime → 做史萊姆</text>
<rect x="130" y="174" width="186" height="24" rx="4" class="fg-b hot"/><text x="140" y="190" class="fg-t sm mono">bat → 做蝙蝠</text>
<text x="223" y="214" text-anchor="middle" class="fg-t sm acc">新種類：加一行，不改 spawn</text>
<line x1="345" y1="12" x2="345" y2="240" class="fg-l dim dash"/>
<text x="515" y="22" text-anchor="middle" class="fg-t lg">策略：同一個插槽，換做法</text>
<rect x="380" y="44" width="270" height="56" rx="8" class="fg-b alt"/>
<text x="515" y="66" text-anchor="middle" class="fg-t sm mono">addPoints(score, streak, scoring)</text>
<text x="515" y="88" text-anchor="middle" class="fg-t sm">做法從參數插進來</text>
<rect x="365" y="160" width="92" height="44" rx="6" class="fg-b"/><text x="411" y="179" text-anchor="middle" class="fg-t sm mono">flat</text><text x="411" y="196" text-anchor="middle" class="fg-t sm">每題 +1</text>
<rect x="469" y="160" width="92" height="44" rx="6" class="fg-b hot"/><text x="515" y="179" text-anchor="middle" class="fg-t sm mono acc">combo</text><text x="515" y="196" text-anchor="middle" class="fg-t sm">連對加更多</text>
<rect x="573" y="160" width="92" height="44" rx="6" class="fg-b"/><text x="619" y="179" text-anchor="middle" class="fg-t sm">你寫的</text><text x="619" y="196" text-anchor="middle" class="fg-t sm">形狀一樣</text>
<line x1="411" y1="160" x2="411" y2="108" class="fg-l dim dash"/><polygon points="411,100 406.5,108 415.5,108" class="fg-a"/>
<line x1="515" y1="160" x2="515" y2="108" class="fg-l on"/><polygon points="515,100 510.5,108 519.5,108" class="fg-a on"/>
<line x1="619" y1="160" x2="619" y2="108" class="fg-l dim dash"/><polygon points="619,100 614.5,108 623.5,108" class="fg-a"/>
<text x="523" y="136" class="fg-t sm acc">這次插 combo</text>
<text x="515" y="232" text-anchor="middle" class="fg-t sm mono">(streak: number) =&gt; number</text>
</svg><figcaption>工廠把「做哪一種」藏在一張表後面，呼叫的人只給名字；策略把「怎麼做」變成一個參數，只要形狀（函式型別）一樣，就能互換。</figcaption></figure>
<h4>工廠：讓資料決定做出什麼</h4>
<p>遊戲最常見的工廠，是「關卡檔寫著要放哪一種敵人」。程式在寫的時候不知道，要到讀了資料才知道。用一張表把名字對到製作函式，就是一個乾淨的<b>工廠</b>（factory）：</p>
<pre><code>interface Enemy { kind: string; hp: number; speed: number }
type MakeEnemy = (level: number) =&gt; Enemy;

const registry = {
  slime: (level: number) =&gt; ({ kind: 'slime', hp: 10 + level * 2, speed: 1 }),
  bat: (level: number) =&gt; ({ kind: 'bat', hp: 6 + level, speed: 3 }),
} satisfies Record&lt;string, MakeEnemy&gt;;

export type EnemyKind = keyof typeof registry;          // 'slime' | 'bat'

export function isEnemyKind(name: string): name is EnemyKind {
  return Object.hasOwn(registry, name);                 // 關卡檔來的字串，先驗證
}

export function spawn(kind: EnemyKind, level: number): Enemy {
  return registry[kind](level);
}

const fromLevelFile = 'bat';
if (isEnemyKind(fromLevelFile)) console.log(spawn(fromLevelFile, 5));   // hp 11</code></pre>
<p>這段有兩個值得學的細節。第一，<code>satisfies</code> 檢查表的每一格都符合 <code>MakeEnemy</code>，同時保留確切的鍵，所以 <code>EnemyKind</code> 會自動變成 <code>'slime' | 'bat'</code>，加一隻新敵人，型別也跟著更新。第二，關卡檔是外部資料，型別系統管不到，所以在邊界用 <code>isEnemyKind</code> 驗證一次，之後整個程式都拿到安全的型別。用 <code>Object.hasOwn</code> 而不是 <code>in</code>，是為了不讓 <code>'toString'</code> 這種原型上的名字混進來。</p>
<p><b>什麼時候幫你</b>：製作過程不只一行、要做哪一種到執行時才知道、或製作規則常常改。<b>什麼時候害你</b>：只是把 <code>new Thing()</code> 包一層，沒有任何東西要決定；或者為了「以後可能有很多種」先蓋好一整套工廠，結果永遠只有一種。</p>
<h4>策略：把「做法」當參數</h4>
<pre><code>type Scoring = (streak: number) =&gt; number;

const flat: Scoring = () =&gt; 1;
const combo: Scoring = streak =&gt; Math.min(streak, 5);   // 連對越多加越多，最多 5

function addPoints(score: number, streak: number, scoring: Scoring): number {
  return score + scoring(streak);
}
console.log(addPoints(10, 3, flat), addPoints(10, 3, combo));   // 11 13</code></pre>
<p><b>策略</b>（strategy）的價值，是 <code>addPoints</code> 永遠不用改：新的計分方式只是另一個符合 <code>Scoring</code> 的函式。陣列的 <code>sort</code>、Vue 的 <code>computed</code>、Cocos 的緩動函式（easing），都是把做法當參數傳進去。<b>什麼時候害你</b>：只有一種做法，卻包成策略加介面加註冊表；或策略需要的資料越來越多，參數從一個長成八個，這時通常該傳一個物件，或重新想想切法。</p>

<h3><span class="badge lv2">進階</span>三、單例：好用，但它會偷偷害你的測試</h3>
<p>課本式的<b>單例</b>（singleton）長這樣：建構子設成 private，用一個 static 方法交出唯一的實例。</p>
<pre><code>// sound.ts
export class SoundPlayer {
  private static instance: SoundPlayer | null = null;
  static get(): SoundPlayer {
    return (SoundPlayer.instance ??= new SoundPlayer());
  }
  private constructor() {}
  muted = false;
  play(clip: string): void {
    if (!this.muted) console.log('play', clip);
  }
}

// rules.ts
import { SoundPlayer } from './sound';
export function onCorrect(streak: number): number {
  SoundPlayer.get().play('ding');          // 誰都能直接伸手拿
  return streak + 1;
}</code></pre>
<figure class="figure"><svg viewBox="0 0 680 262" class="fg" style="width:100%;max-width:680px" role="img" aria-label="左邊：選單、遊戲、規則、測試 A、測試 B 都直接伸手拿同一個 SoundPlayer，測試 A 改的 muted 測試 B 也看到；右邊：只有 main.ts 建立一個實例並傳給遊戲和規則，測試傳入假的">
<text x="165" y="22" text-anchor="middle" class="fg-t lg">課本式：誰都自己伸手拿</text>
<rect x="20" y="40" width="100" height="30" rx="5" class="fg-b"/><text x="70" y="60" text-anchor="middle" class="fg-t sm">選單</text>
<rect x="20" y="80" width="100" height="30" rx="5" class="fg-b"/><text x="70" y="100" text-anchor="middle" class="fg-t sm">遊戲</text>
<rect x="20" y="120" width="100" height="30" rx="5" class="fg-b"/><text x="70" y="140" text-anchor="middle" class="fg-t sm mono">rules.ts</text>
<rect x="20" y="166" width="100" height="30" rx="5" class="fg-b warm"/><text x="70" y="186" text-anchor="middle" class="fg-t sm">測試 A</text>
<rect x="20" y="206" width="100" height="30" rx="5" class="fg-b warm"/><text x="70" y="226" text-anchor="middle" class="fg-t sm">測試 B</text>
<line x1="120" y1="55" x2="160" y2="55" class="fg-l dash"/><line x1="120" y1="95" x2="160" y2="95" class="fg-l dash"/><line x1="120" y1="135" x2="160" y2="135" class="fg-l dash"/>
<line x1="120" y1="181" x2="160" y2="181" class="fg-l warm dash"/><line x1="120" y1="221" x2="160" y2="221" class="fg-l warm dash"/>
<line x1="160" y1="55" x2="160" y2="221" class="fg-l dash"/>
<line x1="160" y1="138" x2="192" y2="138" class="fg-l"/><polygon points="200,138 192,133.5 192,142.5" class="fg-a"/>
<rect x="200" y="102" width="125" height="72" rx="8" class="fg-b hot"/>
<text x="262" y="124" text-anchor="middle" class="fg-t sm mono">SoundPlayer</text>
<text x="262" y="143" text-anchor="middle" class="fg-t sm">唯一的實例</text>
<text x="262" y="162" text-anchor="middle" class="fg-t sm warm">muted = true</text>
<text x="165" y="254" text-anchor="middle" class="fg-t sm warm">測試 A 改的狀態，測試 B 也看到</text>
<line x1="340" y1="12" x2="340" y2="250" class="fg-l dim dash"/>
<text x="510" y="22" text-anchor="middle" class="fg-t lg">改成：組裝的地方決定</text>
<rect x="360" y="40" width="140" height="36" rx="6" class="fg-b hot"/><text x="430" y="63" text-anchor="middle" class="fg-t sm">main.ts（組裝）</text>
<line x1="430" y1="76" x2="430" y2="102" class="fg-l on"/><polygon points="430,110 425.5,102 434.5,102" class="fg-a on"/>
<text x="438" y="96" class="fg-t sm acc">建立一次</text>
<rect x="360" y="110" width="140" height="36" rx="6" class="fg-b"/><text x="430" y="133" text-anchor="middle" class="fg-t sm">sound 實例</text>
<rect x="555" y="84" width="110" height="34" rx="6" class="fg-b"/><text x="610" y="106" text-anchor="middle" class="fg-t sm">遊戲</text>
<rect x="555" y="138" width="110" height="34" rx="6" class="fg-b"/><text x="610" y="160" text-anchor="middle" class="fg-t sm mono">rules.ts</text>
<path d="M500 128 H527 V101 H547" class="fg-l on"/><polygon points="555,101 547,96.5 547,105.5" class="fg-a on"/>
<path d="M527 128 V155 H547" class="fg-l on"/><polygon points="555,155 547,150.5 547,159.5" class="fg-a on"/>
<text x="527" y="76" text-anchor="middle" class="fg-t sm acc">傳進去</text>
<rect x="360" y="196" width="140" height="36" rx="6" class="fg-b alt"/><text x="430" y="219" text-anchor="middle" class="fg-t sm">測試</text>
<rect x="555" y="196" width="110" height="36" rx="6" class="fg-b alt"/><text x="610" y="219" text-anchor="middle" class="fg-t sm">假的 sound</text>
<line x1="500" y1="214" x2="547" y2="214" class="fg-l alt"/><polygon points="555,214 547,209.5 547,218.5" class="fg-a alt"/>
<text x="527" y="206" text-anchor="middle" class="fg-t sm alt">傳假的</text>
<text x="510" y="254" text-anchor="middle" class="fg-t sm">每個測試自己做一個，互不干擾</text>
</svg><figcaption>左：每個地方都自己去拿那個唯一的實例，相依關係藏在函式內部，測試之間共用同一份狀態。右：「只有一個」改由組裝的地方保證，實例被傳進去，測試就能換成自己的假物件。</figcaption></figure>
<h4>它到底害了什麼</h4>
<ul>
<li><b>藏起相依</b>：看 <code>onCorrect(streak: number): number</code> 的簽名，你完全看不出它會播音效。讀程式的人、寫測試的人都被騙了。</li>
<li><b>狀態在測試之間漏過去</b>：測試 A 把 <code>muted</code> 設成 true，測試 B 期待聲音有播，結果失敗；單獨跑 B 卻會過。這種「跟執行順序有關」的測試失敗最浪費時間。</li>
<li><b>換不掉</b>：你想在測試裡用一個「只記錄播了什麼」的假物件，但 <code>onCorrect</code> 寫死了 <code>SoundPlayer.get()</code>，只能用測試框架去攔截整個模組（例如 Vitest 的 <code>vi.mock</code>）。做得到，但那是在繞過設計。</li>
</ul>
<h4>修法：把「只有一個」移到組裝的地方</h4>
<pre><code>// sound.ts
export interface Sound { play(clip: string): void }
export function createSound(): Sound {
  return { play: clip =&gt; console.log('play', clip) };
}

// rules.ts
import type { Sound } from './sound';
export function onCorrect(streak: number, sound: Sound): number {
  sound.play('ding');
  return streak + 1;
}

// main.ts
import { createSound } from './sound';
import { onCorrect } from './rules';
const sound = createSound();               // 整個程式只在這裡建立一次
console.log(onCorrect(0, sound));

// rules.check.ts
import { onCorrect as check } from './rules';
const played: string[] = [];
const result = check(2, { play: clip =&gt; played.push(clip) });
console.log(result, played);              // 3 [ 'ding' ]</code></pre>
<p>實例還是只有一個，但現在是 main.ts 決定的，不是 class 自己硬性規定的。簽名誠實了，測試也乾淨了。</p>
<p><b>Vue 和 Cocos 對照</b>：Pinia 的 store 不是全程式唯一，而是「每個 Pinia 實例裡唯一」，而 Pinia 實例是 <code>app.use(createPinia())</code> 時建立的。所以測試可以每次 <code>setActivePinia(createPinia())</code> 拿一個全新的，伺服器端渲染（SSR）時每個請求也各有一份，不會把甲使用者的資料漏給乙。Cocos 常見的做法是把管理器掛在一個 <code>director.addPersistRootNode()</code> 的常駐節點上，再用一個 static 欄位指向它；這很方便，但上面三個問題一樣存在，至少要讓需要它的元件透過屬性或參數拿到它，而不是到處呼叫全域的 getter。</p>

<h3><span class="badge lv2">進階</span>四、觀察者與事件匯流排：洩漏和順序</h3>
<p>先寫一個型別安全的事件匯流排。重點是第一行的事件表：事件名稱對到它帶的資料，發送和訂閱都會被檢查。</p>
<pre><code>type Handler&lt;T&gt; = (payload: T) =&gt; void;

export class EventBus&lt;E extends Record&lt;string, unknown&gt;&gt; {
  private handlers: { [K in keyof E]?: Set&lt;Handler&lt;E[K]&gt;&gt; } = {};

  on&lt;K extends keyof E&gt;(name: K, fn: Handler&lt;E[K]&gt;): () =&gt; void {
    const set = (this.handlers[name] ??= new Set&lt;Handler&lt;E[K]&gt;&gt;());
    set.add(fn);
    return () =&gt; { set.delete(fn); };              // 回傳取消訂閱的函式
  }

  emit&lt;K extends keyof E&gt;(name: K, payload: E[K]): void {
    const set = this.handlers[name];
    if (!set) return;
    for (const fn of [...set]) {                     // 先拍快照再呼叫
      try { fn(payload); } catch (err) { console.error('listener failed', err); }
    }
  }
}

type GameEvents = { score: number; roundEnd: { won: boolean; streak: number } };
export const bus = new EventBus&lt;GameEvents&gt;();

const off = bus.on('roundEnd', e =&gt; console.log(e.won, e.streak));
bus.emit('score', 3);
off();
// bus.emit('score', 'three');   ← 型別檢查會擋下：'three' 不是 number</code></pre>
<h4>洩漏：畫面關了，聽眾還活著</h4>
<figure class="figure"><svg viewBox="0 0 680 200" class="fg" style="width:100%;max-width:680px" role="img" aria-label="記憶體參考鏈：模組層級的 bus 抓著 Set，Set 抓著箭頭函式，箭頭函式抓著已經關閉的 ScorePanel，ScorePanel 抓著貼圖和節點；呼叫 off 會剪斷 Set 和箭頭函式之間的連線">
<text x="15" y="34" class="fg-t sm">從根出發，一路都抓得到：</text>
<rect x="15" y="60" width="110" height="50" rx="6" class="fg-b alt"/><text x="70" y="81" text-anchor="middle" class="fg-t mono">bus</text><text x="70" y="99" text-anchor="middle" class="fg-t sm">模組層級，常駐</text>
<line x1="125" y1="85" x2="142" y2="85" class="fg-l"/><polygon points="150,85 142,80.5 142,89.5" class="fg-a"/>
<rect x="150" y="60" width="105" height="50" rx="6" class="fg-b"/><text x="202" y="81" text-anchor="middle" class="fg-t mono">Set</text><text x="202" y="99" text-anchor="middle" class="fg-t sm">聽眾清單</text>
<line x1="255" y1="85" x2="272" y2="85" class="fg-l"/><polygon points="280,85 272,80.5 272,89.5" class="fg-a"/>
<rect x="280" y="60" width="110" height="50" rx="6" class="fg-b"/><text x="335" y="81" text-anchor="middle" class="fg-t sm">箭頭函式</text><text x="335" y="99" text-anchor="middle" class="fg-t sm">閉包抓著 panel</text>
<line x1="390" y1="85" x2="407" y2="85" class="fg-l"/><polygon points="415,85 407,80.5 407,89.5" class="fg-a"/>
<rect x="415" y="60" width="115" height="50" rx="6" class="fg-b warm"/><text x="472" y="81" text-anchor="middle" class="fg-t sm mono">ScorePanel</text><text x="472" y="99" text-anchor="middle" class="fg-t sm">畫面已關閉</text>
<line x1="530" y1="85" x2="547" y2="85" class="fg-l"/><polygon points="555,85 547,80.5 547,89.5" class="fg-a"/>
<rect x="555" y="60" width="110" height="50" rx="6" class="fg-b warm"/><text x="610" y="81" text-anchor="middle" class="fg-t sm">節點、貼圖</text><text x="610" y="99" text-anchor="middle" class="fg-t sm">跟著留下</text>
<line x1="267" y1="50" x2="267" y2="124" class="fg-l on dash"/>
<text x="267" y="142" text-anchor="middle" class="fg-t sm acc">off() 剪斷這裡</text>
<text x="472" y="142" text-anchor="middle" class="fg-t sm acc">剪斷後，右邊三個都能回收</text>
<text x="340" y="182" text-anchor="middle" class="fg-t sm warm">沒呼叫 off()：只要 bus 還活著，整條鏈就都活著，畫面關了也收不走</text>
</svg><figcaption>垃圾回收（GC）只回收「從根出發走不到」的物件。常駐的 bus 是根能走到的，它抓著的聽眾、聽眾閉包抓著的元件、元件抓著的貼圖，全都跟著活下去。</figcaption></figure>
<p>這就是觀察者模式最經典的 bug。洩漏還不是最糟的：那個已經關掉的面板每次收到事件還會執行，去改一個不存在的節點，於是主控台開始出現奇怪的錯誤，而且每開關一次畫面，就多一個幽靈聽眾。規則只有一條：<b>在哪個生命週期訂閱，就在對稱的生命週期取消</b>。</p>
<table>
<tr><th>環境</th><th>訂閱</th><th>取消</th></tr>
<tr><td>Vue 元件</td><td><code>onMounted</code></td><td><code>onUnmounted</code> 裡呼叫 <code>off()</code></td></tr>
<tr><td>Cocos 元件</td><td><code>onEnable</code>：<code>node.on('score', this.onScore, this)</code></td><td><code>onDisable</code>：<code>node.off(...)</code>，或 <code>onDestroy</code> 裡 <code>targetOff(this)</code> 一次清掉</td></tr>
<tr><td>DOM</td><td><code>addEventListener(type, fn, { signal })</code></td><td>對應的 <code>AbortController</code> 呼叫 <code>abort()</code>，一次移除全部</td></tr>
</table>
<p>Cocos 那一列的第三個參數 <code>this</code> 很重要：它讓引擎知道「這個聽眾屬於誰」，也讓 <code>off</code> 能比對到同一個函式。常見錯誤是訂閱時寫 <code>this.onScore.bind(this)</code>，取消時又寫一次 <code>bind</code>：兩次產生的是兩個不同的函式，<code>off</code> 永遠找不到要刪的那個。</p>
<h4>順序：同步、照訂閱先後，而且會巢狀</h4>
<p><code>emit</code> 是同步的：它照訂閱的先後一個一個呼叫，全部跑完才回到 <code>emit</code> 的下一行。所以聽眾之間如果有「誰要先跑」的隱性需求（例如成就系統要讀分數標籤已經更新好的值），程式就默默依賴了訂閱順序，哪天有人調換了兩個元件的初始化順序，就壞了。聽眾之間應該彼此獨立，需要的資料都從 payload 拿。</p>
<p>還有三個邊角：</p>
<ul>
<li><b>聽眾在 emit 中途訂閱</b>：JavaScript 的 Set 在迭代時，新加進去的元素<b>也會被走到</b>。如果某個聽眾在收到事件時又訂閱了一個新聽眾，新的那個在同一次 emit 就會被呼叫，最壞的情況是無窮迴圈。上面的實作先用 <code>[...set]</code> 拍快照，就沒有這個問題；代價是在 emit 中途被取消的聽眾，這一次還是會被呼叫。</li>
<li><b>一個聽眾丟錯</b>：沒有 try/catch 的話，後面的聽眾全部不會被呼叫。音效模組的一個 bug，讓分數標籤也不更新了。</li>
<li><b>聽眾裡再 emit</b>：會變成巢狀呼叫，外層 emit 還沒跑完，內層就先跑完了。事件一多，呼叫堆疊就變成一團，這時候常改用佇列：先收集事件，等這一格畫面的邏輯跑完再一起處理。</li>
</ul>
<p><b>什麼時候幫你</b>：一件事發生，好幾個彼此無關的部分都要反應，而發送者不該認識它們。<b>什麼時候害你</b>：一個父元件跟一個子元件說話，直接呼叫或用 props 更好追；或者全 app 只剩一個萬用匯流排，任何人對任何人發事件，讀程式的人再也找不到「誰會讓這個畫面改變」。</p>

<h3><span class="badge lv2">進階</span>五、狀態機：表格驅動，再加上守衛</h3>
<p>上一課的狀態機只有「從哪裡可以去哪裡」。真實的遊戲還需要兩樣東西：<b>事件</b>（發生了什麼）和<b>守衛</b>（guard，條件成立才准走）。例如「下一回合」這個事件，命還有的時候去發牌，命用完的時候去遊戲結束。</p>
<figure class="figure"><svg viewBox="0 28 680 224" class="fg" style="width:100%;max-width:680px" role="img" aria-label="狀態圖：idle 經 START 到 dealing，經 DEALT 到 guessing，經 GUESS 到 revealing，經 REVEALED 到 result；result 收到 NEXT 時，命還有就回 dealing，命用完就到 gameOver；gameOver 收到 START 回到 dealing">
<rect x="15" y="60" width="100" height="40" rx="20" class="fg-b"/><text x="65" y="85" text-anchor="middle" class="fg-t mono">idle</text>
<rect x="150" y="60" width="100" height="40" rx="20" class="fg-b"/><text x="200" y="85" text-anchor="middle" class="fg-t mono">dealing</text>
<rect x="285" y="60" width="100" height="40" rx="20" class="fg-b hot"/><text x="335" y="85" text-anchor="middle" class="fg-t mono acc">guessing</text>
<rect x="420" y="60" width="100" height="40" rx="20" class="fg-b"/><text x="470" y="85" text-anchor="middle" class="fg-t mono">revealing</text>
<rect x="555" y="60" width="100" height="40" rx="20" class="fg-b"/><text x="605" y="85" text-anchor="middle" class="fg-t mono">result</text>
<line x1="115" y1="80" x2="142" y2="80" class="fg-l"/><polygon points="150,80 142,75.5 142,84.5" class="fg-a"/>
<text x="132" y="50" text-anchor="middle" class="fg-t sm mono">START</text>
<line x1="250" y1="80" x2="277" y2="80" class="fg-l"/><polygon points="285,80 277,75.5 277,84.5" class="fg-a"/>
<text x="267" y="50" text-anchor="middle" class="fg-t sm mono">DEALT</text>
<line x1="385" y1="80" x2="412" y2="80" class="fg-l on"/><polygon points="420,80 412,75.5 412,84.5" class="fg-a on"/>
<text x="402" y="50" text-anchor="middle" class="fg-t sm mono acc">GUESS</text>
<line x1="520" y1="80" x2="547" y2="80" class="fg-l"/><polygon points="555,80 547,75.5 547,84.5" class="fg-a"/>
<text x="537" y="50" text-anchor="middle" class="fg-t sm mono">REVEALED</text>
<path d="M580 100 V136 H210 V108" class="fg-l alt"/><polygon points="210,100 205.5,108 214.5,108" class="fg-a alt"/>
<text x="395" y="128" text-anchor="middle" class="fg-t sm alt">NEXT［lives &gt; 0］</text>
<line x1="630" y1="100" x2="630" y2="164" class="fg-l warm"/><polygon points="630,172 625.5,164 634.5,164" class="fg-a warm"/>
<text x="622" y="158" text-anchor="end" class="fg-t sm warm">NEXT［lives = 0］</text>
<rect x="545" y="172" width="120" height="40" rx="20" class="fg-b warm"/><text x="605" y="197" text-anchor="middle" class="fg-t mono">gameOver</text>
<path d="M545 192 H180 V108" class="fg-l dash"/><polygon points="180,100 175.5,108 184.5,108" class="fg-a"/>
<text x="360" y="186" text-anchor="middle" class="fg-t sm mono">START</text>
<text x="340" y="240" text-anchor="middle" class="fg-t sm warm">revealing 時再收到 GUESS：表裡沒有這一格，事件被忽略</text>
</svg><figcaption>每個狀態只接受表裡寫著的事件。同一個事件 NEXT 有兩條路，靠守衛（方括號裡的條件）決定走哪一條；表裡沒寫的組合，例如翻牌中又按一次猜，就被安靜地忽略。</figcaption></figure>
<pre><code>type State = 'idle' | 'dealing' | 'guessing' | 'revealing' | 'result' | 'gameOver';
type GameEvent = 'START' | 'DEALT' | 'GUESS' | 'REVEALED' | 'NEXT';
interface Ctx { lives: number; streak: number }
interface Transition { to: State; guard?: (ctx: Ctx) =&gt; boolean }

const table: Record&lt;State, Partial&lt;Record&lt;GameEvent, Transition[]&gt;&gt;&gt; = {
  idle: { START: [{ to: 'dealing' }] },
  dealing: { DEALT: [{ to: 'guessing' }] },
  guessing: { GUESS: [{ to: 'revealing' }] },
  revealing: { REVEALED: [{ to: 'result' }] },
  result: {
    NEXT: [
      // 由上往下比對，第一條成立的勝出
      { to: 'gameOver', guard: ctx =&gt; ctx.lives === 0 },
      { to: 'dealing' },
    ],
  },
  gameOver: { START: [{ to: 'dealing' }] },
};

export function send(state: State, event: GameEvent, ctx: Ctx): State {
  const options = table[state][event];
  if (!options) return state;                               // 這個狀態不收這個事件
  const hit = options.find(t =&gt; !t.guard || t.guard(ctx));
  return hit ? hit.to : state;
}

const ctx: Ctx = { lives: 2, streak: 0 };
console.log(send('result', 'NEXT', { ...ctx, lives: 0 }));  // gameOver
console.log(send('result', 'NEXT', ctx));                   // dealing
console.log(send('revealing', 'GUESS', ctx));               // revealing：被忽略</code></pre>
<p>注意 <code>send</code> 是一個純函式：給它目前狀態、事件、資料，它回傳下一個狀態，不改任何東西。這讓它極好測試，你可以把整張表的每一格都用一行測過。真正的「動作」（發牌動畫、播音效）放在狀態改變之後，看新狀態決定要做什麼。</p>
<h4>讓錯的狀態根本寫不出來</h4>
<p>字串狀態有一個缺點：<code>gameOver</code> 時的最終分數、<code>revealing</code> 時正在翻的那張牌，這些「只在某個狀態才有意義」的資料，只好放在外面的變數裡，誰都能在錯的時候讀到它。進一步的做法是可辨識聯集（discriminated union），讓每個狀態帶著自己的資料：</p>
<pre><code>type RoundState =
  | { kind: 'guessing'; current: number }
  | { kind: 'revealing'; current: number; next: number }
  | { kind: 'gameOver'; finalScore: number };

function describe(s: RoundState): string {
  switch (s.kind) {
    case 'guessing': return 'card ' + s.current + ', higher or lower?';
    case 'revealing': return s.current + ' then ' + s.next;
    case 'gameOver': return 'final ' + s.finalScore;
    default: {
      const never: never = s;               // 漏寫一種狀態，這一行就會報錯
      return never;
    }
  }
}
console.log(describe({ kind: 'revealing', current: 7, next: 9 }));</code></pre>
<p>在 <code>guessing</code> 狀態下，根本沒有 <code>next</code> 這個欄位可以讀；以後新增一種狀態，所有沒處理它的 switch 都會在編譯時亮紅燈。這叫「讓不合法的狀態無法被表示」（make illegal states unrepresentable），是 TypeScript 型別系統最值錢的用法之一。</p>
<p><b>什麼時候幫你</b>：有階段、順序錯了就是 bug 的東西，例如一回合、結帳、上傳、角色動作（站、跑、跳、受傷）。<b>什麼時候害你</b>：兩個狀態、沒有規則的開關；或者把所有東西都塞進一台巨大的狀態機，狀態多到上百個，這時候要拆成幾台小的，或用支援階層與平行狀態的狀態圖（statechart）工具，例如 XState。</p>

<h3><span class="badge lv3">專業</span>六、命令模式：把「動作」變成物件，就能復原</h3>
<p>關卡編輯器、繪圖工具、卡牌遊戲的「悔一步」，背後都是同一個想法：<b>命令</b>（command）模式把每一個動作包成一個物件，裡面帶著「怎麼做」和「怎麼撤銷」。動作變成了資料，就能存起來、排隊、復原、重做，甚至送到網路另一端。</p>
<pre><code>interface Command { label: string; run(): void; undo(): void }

class History {
  private done: Command[] = [];
  private undone: Command[] = [];
  constructor(private limit = 100) {}

  exec(cmd: Command): void {
    cmd.run();
    this.done.push(cmd);
    if (this.done.length &gt; this.limit) this.done.shift();   // 太舊的丟掉
    this.undone = [];                          // 做了新動作，重做清單作廢
  }
  undo(): void {
    const cmd = this.done.pop();
    if (!cmd) return;
    cmd.undo();
    this.undone.push(cmd);
  }
  redo(): void {
    const cmd = this.undone.pop();
    if (!cmd) return;
    cmd.run();
    this.done.push(cmd);
  }
}

const board = new Map&lt;string, number&gt;();
function placeCard(cell: string, card: number): Command {
  let before: number | undefined;                            // 撤銷需要的舊值
  return {
    label: 'place ' + card + ' at ' + cell,
    run() { before = board.get(cell); board.set(cell, card); },
    undo() {
      if (before === undefined) board.delete(cell);
      else board.set(cell, before);
    },
  };
}

const h = new History();
h.exec(placeCard('A1', 7));
h.exec(placeCard('A1', 9));
h.undo();
console.log(board.get('A1'));   // 7
h.redo();
console.log(board.get('A1'));   // 9</code></pre>
<figure class="figure"><svg viewBox="0 0 680 212" class="fg" style="width:100%;max-width:680px" role="img" aria-label="四個步驟中 A1 格子的值和 done、undone 兩個堆疊：放 7 之後 done 有放 7；放 9 之後 done 有放 7 和放 9；undo 之後放 9 移到 undone，A1 回到 7；redo 之後放 9 回到 done，A1 變成 9">
<text x="92" y="22" text-anchor="middle" class="fg-t sm mono acc">exec 放 7</text>
<text x="257" y="22" text-anchor="middle" class="fg-t sm mono acc">exec 放 9</text>
<text x="422" y="22" text-anchor="middle" class="fg-t sm mono warm">undo</text>
<text x="587" y="22" text-anchor="middle" class="fg-t sm mono alt">redo</text>
<line x1="175" y1="10" x2="175" y2="184" class="fg-l dim dash"/><line x1="340" y1="10" x2="340" y2="184" class="fg-l dim dash"/><line x1="505" y1="10" x2="505" y2="184" class="fg-l dim dash"/>
<rect x="37" y="34" width="110" height="28" rx="5" class="fg-b hot"/><text x="92" y="53" text-anchor="middle" class="fg-t sm mono">A1 = 7</text>
<rect x="202" y="34" width="110" height="28" rx="5" class="fg-b hot"/><text x="257" y="53" text-anchor="middle" class="fg-t sm mono">A1 = 9</text>
<rect x="367" y="34" width="110" height="28" rx="5" class="fg-b warm"/><text x="422" y="53" text-anchor="middle" class="fg-t sm mono">A1 = 7</text>
<rect x="532" y="34" width="110" height="28" rx="5" class="fg-b alt"/><text x="587" y="53" text-anchor="middle" class="fg-t sm mono">A1 = 9</text>
<rect x="20" y="76" width="70" height="80" rx="5" class="fg-b"/><rect x="95" y="76" width="70" height="80" rx="5" class="fg-b"/>
<rect x="185" y="76" width="70" height="80" rx="5" class="fg-b"/><rect x="260" y="76" width="70" height="80" rx="5" class="fg-b"/>
<rect x="350" y="76" width="70" height="80" rx="5" class="fg-b"/><rect x="425" y="76" width="70" height="80" rx="5" class="fg-b"/>
<rect x="515" y="76" width="70" height="80" rx="5" class="fg-b"/><rect x="590" y="76" width="70" height="80" rx="5" class="fg-b"/>
<rect x="26" y="124" width="58" height="26" rx="4" class="fg-b hot"/><text x="55" y="141" text-anchor="middle" class="fg-t sm">放 7</text>
<rect x="191" y="124" width="58" height="26" rx="4" class="fg-b hot"/><text x="220" y="141" text-anchor="middle" class="fg-t sm">放 7</text>
<rect x="191" y="94" width="58" height="26" rx="4" class="fg-b hot"/><text x="220" y="111" text-anchor="middle" class="fg-t sm">放 9</text>
<rect x="356" y="124" width="58" height="26" rx="4" class="fg-b hot"/><text x="385" y="141" text-anchor="middle" class="fg-t sm">放 7</text>
<rect x="431" y="124" width="58" height="26" rx="4" class="fg-b warm"/><text x="460" y="141" text-anchor="middle" class="fg-t sm">放 9</text>
<rect x="521" y="124" width="58" height="26" rx="4" class="fg-b hot"/><text x="550" y="141" text-anchor="middle" class="fg-t sm">放 7</text>
<rect x="521" y="94" width="58" height="26" rx="4" class="fg-b hot"/><text x="550" y="111" text-anchor="middle" class="fg-t sm">放 9</text>
<text x="55" y="174" text-anchor="middle" class="fg-t sm">done</text><text x="130" y="174" text-anchor="middle" class="fg-t sm">undone</text>
<text x="220" y="174" text-anchor="middle" class="fg-t sm">done</text><text x="295" y="174" text-anchor="middle" class="fg-t sm">undone</text>
<text x="385" y="174" text-anchor="middle" class="fg-t sm">done</text><text x="460" y="174" text-anchor="middle" class="fg-t sm">undone</text>
<text x="550" y="174" text-anchor="middle" class="fg-t sm">done</text><text x="625" y="174" text-anchor="middle" class="fg-t sm">undone</text>
<text x="340" y="202" text-anchor="middle" class="fg-t sm">undo：從 done 頂端拿一個，執行它的 undo，放進 undone。redo 反過來。</text>
</svg><figcaption>兩個堆疊就是全部的機制。第三格的 undo 把「放 9」從 done 移到 undone，並用它記住的舊值 7 還原 A1；第四格的 redo 再把它搬回來。</figcaption></figure>
<p>注意 <code>placeCard</code> 的 <code>before</code>：撤銷需要的資訊，是在 <code>run</code> 的那一刻記下來的。寫命令最常見的 bug，就是 undo 憑空猜舊值，或在建立命令時（而不是執行時）就記錄，結果 redo 之後再 undo，還原到錯的值。</p>
<h4>真實系統的幾個取捨</h4>
<ul>
<li><b>合併</b>：拖曳一張牌，滑鼠移動會觸發幾十次。每次都當成一個命令，按一次復原只退一小步。常見做法是把連續的同類命令合併成一個（只記開始前的值和最後的值）。</li>
<li><b>記憶體上限</b>：每個命令都帶著舊資料。如果命令存的是整張圖片或整個關卡的拷貝，一百步就可能是幾百 MB，所以要設上限（上面的 <code>limit</code>），或改存「差異」。</li>
<li><b>撤不回來的動作</b>：已經送到伺服器的存檔、已經扣掉的點數，沒有真正的 undo，只能再做一個反向的動作（補償，compensating action）。介面上要讓使用者知道哪些動作不能復原。</li>
</ul>
<p><b>什麼時候害你</b>：沒有復原、重播、排隊的需求，卻把每個按鈕都包成命令類別，程式多了一層又一層的間接，卻什麼都沒換到。</p>

<h3><span class="badge lv3">專業</span>七、不用框架的相依注入</h3>
<p><b>相依注入</b>（dependency injection，DI）聽起來很玄，其實就一句話：<b>一個物件需要的東西，由外面交給它，而不是自己去拿或自己 new</b>。不需要任何框架，建構子參數就是最好的注入方式。</p>
<pre><code>// ports.ts
// 遊戲需要的外部能力，用介面描述
export interface Clock { now(): number }
export interface Rng { next(): number }                 // 0 ≤ x &lt; 1
export interface ScoreStore { save(best: number): Promise&lt;void&gt; }

// game.ts
// 只認識介面，不 new 任何外部的東西
import type { Clock, Rng, ScoreStore } from './ports';
export class Game {
  best = 0;
  constructor(private clock: Clock, private rng: Rng, private store: ScoreStore) {}
  drawCard(): number {
    return 1 + Math.floor(this.rng.next() * 13);
  }
  async finish(score: number): Promise&lt;number&gt; {
    if (score &gt; this.best) {
      this.best = score;
      await this.store.save(score);
    }
    return this.clock.now();
  }
}

// main.ts
// 組裝根：整個程式唯一 new 這些東西的地方
import { Game } from './game';
const game = new Game(
  { now: () =&gt; Date.now() },
  { next: () =&gt; Math.random() },
  { save: async best =&gt; { localStorage.setItem('best', String(best)); } },
);
console.log(game.drawCard());

// game.check.ts
// 測試時換成假的
import { Game as G } from './game';
const saved: number[] = [];
const g = new G(
  { now: () =&gt; 1000 },
  { next: () =&gt; 0.5 },
  { save: async b =&gt; { saved.push(b); } },
);
console.log(g.drawCard());              // 一定是 7：1 + floor(0.5 × 13)
void g.finish(12).then(t =&gt; console.log(saved, t));     // [ 12 ] 1000</code></pre>
<figure class="figure"><svg viewBox="0 0 680 236" class="fg" style="width:100%;max-width:680px" role="img" aria-label="左邊正式執行：main.ts 把 Date.now、Math.random、localStorage 包好交給 Game；右邊測試：把固定時間、固定亂數、陣列交給同一個 Game">
<text x="165" y="22" text-anchor="middle" class="fg-t lg">正式執行：main.ts 組裝</text>
<rect x="12" y="40" width="96" height="40" rx="6" class="fg-b"/><text x="60" y="65" text-anchor="middle" class="fg-t sm mono">Date.now</text>
<rect x="117" y="40" width="96" height="40" rx="6" class="fg-b"/><text x="165" y="65" text-anchor="middle" class="fg-t sm mono">Math.random</text>
<rect x="222" y="40" width="96" height="40" rx="6" class="fg-b"/><text x="270" y="65" text-anchor="middle" class="fg-t sm mono">localStorage</text>
<line x1="60" y1="80" x2="60" y2="122" class="fg-l on"/><polygon points="60,130 55.5,122 64.5,122" class="fg-a on"/>
<line x1="165" y1="80" x2="165" y2="122" class="fg-l on"/><polygon points="165,130 160.5,122 169.5,122" class="fg-a on"/>
<line x1="270" y1="80" x2="270" y2="122" class="fg-l on"/><polygon points="270,130 265.5,122 274.5,122" class="fg-a on"/>
<rect x="20" y="130" width="290" height="54" rx="8" class="fg-b hot"/>
<text x="165" y="151" text-anchor="middle" class="fg-t mono acc">Game</text>
<text x="60" y="173" text-anchor="middle" class="fg-t sm mono">Clock</text><text x="165" y="173" text-anchor="middle" class="fg-t sm mono">Rng</text><text x="270" y="173" text-anchor="middle" class="fg-t sm mono">ScoreStore</text>
<text x="165" y="214" text-anchor="middle" class="fg-t sm">外部的東西，整個程式只在這裡 new</text>
<line x1="340" y1="12" x2="340" y2="226" class="fg-l dim dash"/>
<text x="515" y="22" text-anchor="middle" class="fg-t lg">測試：換成假的</text>
<rect x="362" y="40" width="96" height="40" rx="6" class="fg-b alt"/><text x="410" y="65" text-anchor="middle" class="fg-t sm mono">now = 1000</text>
<rect x="467" y="40" width="96" height="40" rx="6" class="fg-b alt"/><text x="515" y="65" text-anchor="middle" class="fg-t sm mono">next = 0.5</text>
<rect x="572" y="40" width="96" height="40" rx="6" class="fg-b alt"/><text x="620" y="65" text-anchor="middle" class="fg-t sm">存進陣列</text>
<line x1="410" y1="80" x2="410" y2="122" class="fg-l alt"/><polygon points="410,130 405.5,122 414.5,122" class="fg-a alt"/>
<line x1="515" y1="80" x2="515" y2="122" class="fg-l alt"/><polygon points="515,130 510.5,122 519.5,122" class="fg-a alt"/>
<line x1="620" y1="80" x2="620" y2="122" class="fg-l alt"/><polygon points="620,130 615.5,122 624.5,122" class="fg-a alt"/>
<rect x="370" y="130" width="290" height="54" rx="8" class="fg-b hot"/>
<text x="515" y="151" text-anchor="middle" class="fg-t mono acc">Game</text>
<text x="410" y="173" text-anchor="middle" class="fg-t sm mono">Clock</text><text x="515" y="173" text-anchor="middle" class="fg-t sm mono">Rng</text><text x="620" y="173" text-anchor="middle" class="fg-t sm mono">ScoreStore</text>
<text x="515" y="214" text-anchor="middle" class="fg-t sm acc">結果固定、不碰瀏覽器，幾毫秒跑完</text>
</svg><figcaption>同一個 Game，插座的形狀（Clock、Rng、ScoreStore）不變，插進去的東西不同。正式執行接真的時間、亂數和儲存；測試接固定值，結果每次都一樣。</figcaption></figure>
<p>好處很具體：<code>drawCard</code> 在正式環境是隨機的，在測試裡一定是 7；<code>finish</code> 不會真的寫瀏覽器的儲存空間；時間固定在 1000，跟「幾點跑測試」無關。<b>組裝根</b>（composition root）是整個程式唯一把具體實作接起來的地方，通常就是 main.ts。其他所有檔案只認識介面。</p>
<p><b>Vue 對照</b>：<code>provide</code> 和 <code>inject</code> 就是 Vue 內建的相依注入。在 App 根元件或 <code>app.provide()</code> 提供一個 <code>ScoreStore</code>，深層的元件用 <code>inject</code> 拿，測試時用 <code>mount(Comp, { global: { provide: { ... } } })</code> 換成假的（這是 Vue Test Utils 的寫法）。用 <code>InjectionKey</code> 當鍵，inject 回來的型別就是對的。</p>
<p><b>什麼時候害你</b>：每個類別都配一個只有一種實作的介面，建構子長到七八個參數，找一個功能要跳五個檔案。只替「真的會換」的東西注入：時間、亂數、網路、儲存、音效，這些剛好也是最難測的。純計算的函式直接呼叫就好。</p>

<h3><span class="badge lv3">專業</span>八、SOLID：五條原則，改寫前後對照</h3>
<p>SOLID 是 Robert C. Martin 整理、推廣的五條物件導向設計原則，取每條英文的第一個字母。它們不是法律，而是五種「這樣寫以後會痛」的警訊。每一條都看改寫前後。</p>
<h4>S：單一職責（Single Responsibility）</h4>
<p>一個模組應該只有一個「改變的理由」。下面這個方法有四個：規則改、存檔方式改、音效改、畫面改，都得動它。</p>
<pre><code>type Guess = 'higher' | 'lower';

// 之前：規則、存檔、音效、畫面擠在一起
class RoundBefore {
  score = 0;
  guess(current: number, next: number, guess: Guess, label: HTMLElement): void {
    const ok = guess === 'higher' ? next &gt; current : next &lt; current;
    if (ok) this.score += 1;
    localStorage.setItem('score', String(this.score));
    void new Audio(ok ? '/ding.mp3' : '/buzz.mp3').play();
    label.textContent = String(this.score);
  }
}

// 之後：規則變成純函式，其他三件事各自一個模組，由流程串起來
export const isCorrect = (current: number, next: number, guess: Guess): boolean =&gt;
  guess === 'higher' ? next &gt; current : next &lt; current;</code></pre>
<h4>O：開放封閉（Open/Closed）</h4>
<p>對擴充開放，對修改封閉：加新功能時，應該是「加程式碼」，而不是「改已經測好的程式碼」。</p>
<pre><code>// 之前：每加一種模式，就要改這個 switch
function pointsBefore(mode: 'normal' | 'combo', streak: number): number {
  switch (mode) {
    case 'normal': return 1;
    case 'combo': return Math.min(streak, 5);
  }
}

// 之後：加新模式＝加一筆資料，points 不用改
const modes = {
  normal: (_streak: number) =&gt; 1,
  combo: (streak: number) =&gt; Math.min(streak, 5),
  double: (_streak: number) =&gt; 2,
} satisfies Record&lt;string, (streak: number) =&gt; number&gt;;
function points(mode: keyof typeof modes, streak: number): number {
  return modes[mode](streak);
}
console.log(pointsBefore('combo', 3), points('double', 3));   // 3 2</code></pre>
<h4>L：里氏替換（Liskov Substitution）</h4>
<p>子型別必須能放在父型別出現的任何地方，而且不讓呼叫的人吃驚。</p>
<pre><code>// 之前：砲台繼承敵人，卻不會動
class Enemy { x = 0; move(dx: number): void { this.x += dx; } }
class Turret extends Enemy {
  move(_dx: number): void { throw new Error('turrets cannot move'); }
}
function stepAllBefore(list: Enemy[]): void {
  list.forEach(e =&gt; e.move(1));          // 清單裡有砲台，整個迴圈就爆掉
}

// 之後：會動的才有 move
interface Unit { x: number }
interface Mover extends Unit { move(dx: number): void }
function stepAll(list: Mover[]): void { list.forEach(m =&gt; m.move(1)); }
stepAll([new Enemy()]);</code></pre>
<p>型別檢查抓不到這種錯：<code>Turret</code> 的 <code>move</code> 簽名完全正確，只是行為違反了「呼叫 move 會移動」這個約定。這就是為什麼這條原則講的是行為，不只是型別。</p>
<h4>I：介面隔離（Interface Segregation）</h4>
<p>不要逼一個使用者依賴它用不到的方法。</p>
<pre><code>// 之前：排行榜只要分數，卻得拿到整個服務
interface GameServiceBefore {
  getScore(): number;
  reset(): void;
  save(): Promise&lt;void&gt;;
  connect(url: string): void;
  setVolume(v: number): void;
}
function renderBestBefore(svc: GameServiceBefore): string {
  return 'Best ' + svc.getScore();
}

// 之後：要什麼就只要什麼
interface ScoreReader { getScore(): number }
function renderBest(svc: ScoreReader): string { return 'Best ' + svc.getScore(); }
console.log(renderBest({ getScore: () =&gt; 12 }));        // 測試時一行造一個假的</code></pre>
<p>在 TypeScript 裡這條特別便宜：因為型別看的是形狀，真正的服務物件不必宣告「我實作了 ScoreReader」，只要它有 <code>getScore</code>，就能直接傳進 <code>renderBest</code>。</p>
<h4>D：相依反轉（Dependency Inversion）</h4>
<p>高層的規則不應該依賴低層的細節；兩者都依賴抽象，而且<b>抽象由高層定義</b>。</p>
<figure class="figure"><svg viewBox="0 0 680 246" class="fg" style="width:100%;max-width:680px" role="img" aria-label="之前：遊戲層的 Game 直接依賴外部層的 HttpScoreApi，箭頭往下；之後：Game 依賴遊戲層自己定義的 ScoreStore 介面，外部層的 HttpScoreStore 和 MemoryScoreStore 往上實作它">
<text x="155" y="22" text-anchor="middle" class="fg-t lg">之前</text>
<rect x="10" y="36" width="290" height="66" rx="8" class="fg-b"/><text x="20" y="54" class="fg-t sm">遊戲層</text>
<rect x="10" y="112" width="290" height="124" rx="8" class="fg-b"/><text x="20" y="130" class="fg-t sm">外部層</text>
<rect x="100" y="50" width="140" height="40" rx="6" class="fg-b"/><text x="170" y="75" text-anchor="middle" class="fg-t mono">Game</text>
<rect x="100" y="136" width="140" height="36" rx="6" class="fg-b warm"/><text x="170" y="159" text-anchor="middle" class="fg-t sm mono">HttpScoreApi</text>
<rect x="100" y="190" width="140" height="36" rx="6" class="fg-b"/><text x="170" y="213" text-anchor="middle" class="fg-t sm">fetch、伺服器</text>
<line x1="170" y1="90" x2="170" y2="128" class="fg-l warm"/><polygon points="170,136 165.5,128 174.5,128" class="fg-a warm"/>
<text x="178" y="128" class="fg-t sm warm">直接 new</text>
<line x1="170" y1="172" x2="170" y2="182" class="fg-l"/><polygon points="170,190 165.5,182 174.5,182" class="fg-a"/>
<line x1="330" y1="12" x2="330" y2="240" class="fg-l dim dash"/>
<text x="515" y="22" text-anchor="middle" class="fg-t lg">之後</text>
<rect x="360" y="36" width="310" height="66" rx="8" class="fg-b"/><text x="370" y="54" class="fg-t sm">遊戲層</text>
<rect x="360" y="112" width="310" height="124" rx="8" class="fg-b"/><text x="370" y="130" class="fg-t sm">外部層</text>
<rect x="410" y="50" width="100" height="42" rx="6" class="fg-b"/><text x="460" y="76" text-anchor="middle" class="fg-t mono">Game</text>
<rect x="535" y="50" width="125" height="42" rx="6" class="fg-b hot"/><text x="597" y="68" text-anchor="middle" class="fg-t sm mono">ScoreStore</text><text x="597" y="84" text-anchor="middle" class="fg-t sm">介面，遊戲層定義</text>
<line x1="510" y1="71" x2="527" y2="71" class="fg-l on"/><polygon points="535,71 527,66.5 527,75.5" class="fg-a on"/>
<rect x="380" y="150" width="130" height="36" rx="6" class="fg-b alt"/><text x="445" y="173" text-anchor="middle" class="fg-t sm mono">HttpScoreStore</text>
<rect x="530" y="150" width="130" height="36" rx="6" class="fg-b alt"/><text x="595" y="173" text-anchor="middle" class="fg-t sm mono">MemoryScoreStore</text>
<path d="M445 150 V122 H575 V100" class="fg-l alt dash"/><polygon points="575,92 570.5,100 579.5,100" class="fg-a alt"/>
<line x1="625" y1="150" x2="625" y2="100" class="fg-l alt dash"/><polygon points="625,92 620.5,100 629.5,100" class="fg-a alt"/>
<text x="515" y="214" text-anchor="middle" class="fg-t sm acc">外部層的箭頭往上指向介面：依賴反轉了</text>
</svg><figcaption>之前，高層的 Game 直接依賴低層的 HttpScoreApi，換儲存方式就得改 Game。之後，介面由遊戲層自己定義，外部層的實作往上去「符合」它；Game 一行都不用改，就能接上記憶體版或任何新的儲存方式。</figcaption></figure>
<pre><code>// 之前：高層直接依賴低層的具體類別
class HttpScoreApi {
  async save(best: number): Promise&lt;void&gt; {
    await fetch('/api/best', { method: 'POST', body: String(best) });
  }
}
class GameBefore {
  private api = new HttpScoreApi();
  async finish(best: number): Promise&lt;void&gt; { await this.api.save(best); }
}

// 之後：兩邊都依賴高層定義的介面（第七節的 ScoreStore）
interface ScoreStore { save(best: number): Promise&lt;void&gt; }
class GameAfter {
  constructor(private store: ScoreStore) {}
  async finish(best: number): Promise&lt;void&gt; { await this.store.save(best); }
}
class MemoryScoreStore implements ScoreStore {
  saved: number[] = [];
  async save(best: number): Promise&lt;void&gt; { this.saved.push(best); }
}
void new GameAfter(new MemoryScoreStore()).finish(12);</code></pre>
<p>「反轉」反轉的是箭頭的方向：本來是高層指向低層，現在低層指向高層定義的介面。第七節的 DI 是手段，相依反轉是目的；模組那一章拆循環的「反轉相依」，也是同一件事。</p>

<h3><span class="badge lv4">專家</span>九、模式的邊界：大部分人沒遇過的情況</h3>
<h4>命令模式＋固定亂數＝重播與連線對戰</h4>
<p>如果遊戲的每一個玩家輸入都是一個命令，而亂數用的是可以指定種子（seed）的產生器，那麼「初始狀態＋種子＋命令清單」就能完整重現一整局。這是很多遊戲重播系統的原理，也是即時策略遊戲「鎖步」（lockstep）連線的基礎：每台電腦只交換命令，各自算出一模一樣的結果。前提是所有計算都必須是確定的（deterministic）：同樣的輸入，在每台機器上都要得到同樣的結果。只要有一處偷偷用了 <code>Math.random()</code> 或依賴真實時間，兩邊就會慢慢分歧。這也是第七節把 <code>Rng</code> 和 <code>Clock</code> 注入的另一個理由。</p>
<h4>觀察者：WeakRef 救不了你</h4>
<p>有人想用 <code>WeakRef</code> 存聽眾，讓忘了取消的聽眾能被自動回收。問題是垃圾回收什麼時候發生無法預測：在它被回收之前，那個已關閉的畫面照樣會收到事件、照樣執行。WeakRef 和 FinalizationRegistry 適合做快取，不適合拿來管「誰應該收到事件」。正確答案仍然是明確的生命週期，Chrome 開發者工具的記憶體快照（heap snapshot）可以用來確認：關掉畫面再拍一張，搜尋那個元件的類別名稱，看它是不是還在、被誰抓著（Retainers）。</p>
<h4>單例和模組狀態：熱更新與伺服器端渲染</h4>
<p>模組層級的狀態（包括 <code>export const bus = new EventBus()</code>）有兩個隱藏的坑。熱更新時模組被重新執行，舊的實例可能還被別人抓著，於是同時存在兩個 bus，一半的人在舊的上面說話。伺服器端渲染時，Node 行程裡的模組只載入一次，卻服務所有使用者的請求，模組層級的狀態會在請求之間互相污染；Vue 的 SSR 文件把這稱為跨請求狀態污染（cross-request state pollution），解法就是每個請求建立一份新的 app、router、store。這兩件事，都在說同一個道理：「誰建立、誰擁有、活多久」最好寫在明處。</p>
<h4>Service Locator：長得像 DI 的反模式</h4>
<p>有些專案有一個全域的 <code>container.get('sound')</code>，任何地方都能從裡面拿東西。它看起來像相依注入，其實是單例換了件衣服：相依又藏回函式內部，簽名又不誠實了，而且拿錯名字要到執行時才知道。判斷方法很簡單：如果一個類別的建構子看不出它需要什麼，那就不是注入。</p>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>用了越多模式，程式越專業</td><td>每個模式都多一層間接。沒有對應的痛，它只是負擔。資深工程師刪掉的模式，常常比加的多。</td></tr>
<tr><td>單例就是全域變數的好聽說法，所以一律不能用</td><td>「只有一個」本身沒問題，問題是「到處自己去拿」。由組裝的地方建立一個、傳進去，就沒有那些缺點。</td></tr>
<tr><td>JavaScript 有垃圾回收，就不會記憶體洩漏</td><td>只要還有一條從根出發的參考，例如沒取消的事件聽眾，物件就永遠不會被回收。</td></tr>
<tr><td>狀態機一定要用函式庫</td><td>一張表加一個純函式，幾十行就夠用。狀態多、有階層和平行狀態時，再考慮 XState 這類工具。</td></tr>
<tr><td>相依注入需要框架和裝飾器</td><td>建構子參數就是相依注入。框架只是幫你自動做組裝那一步。</td></tr>
<tr><td>SOLID 是規則，每一條都要做到</td><td>它們是警訊，用來診斷「為什麼這段程式這麼難改」。為了符合原則而把簡單的程式拆成十個檔案，一樣是過度設計。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>Vue</b>：Pinia store 是「每個 app 一份」的單例；<code>emit</code> 和 <code>defineEmits</code> 是觀察者；<code>provide</code>、<code>inject</code> 是相依注入；元件裡 <code>v-if="state.kind === 'guessing'"</code> 搭配可辨識聯集，就是畫面版的狀態機。</li>
<li><b>Cocos Creator</b>：<code>instantiate(prefab)</code> 是工廠；節點和 <code>EventTarget</code> 的 <code>on</code>、<code>off</code> 是觀察者，記得在 <code>onDisable</code>、<code>onDestroy</code> 取消；角色動畫的待機、跑、跳、受傷，最適合寫成狀態機。</li>
<li><b>Unity</b>：C# 的 <code>event</code> 和 <code>UnityEvent</code> 是觀察者，一樣要在 <code>OnDisable</code> 取消訂閱；Animator 本身就是一台狀態機；ScriptableObject 常被拿來做可替換的策略和設定。</li>
<li><b>Node.js 和 Go 後端</b>：把資料庫、時間、外部 API 包成介面再注入，是讓服務能寫單元測試的標準做法。Go 的介面同樣是看形狀的，由使用的一方定義小介面，正好就是 I 和 D 兩條原則。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<ol>
<li>「單例有什麼問題？如果真的需要全程式只有一個，你會怎麼做？」</li>
<li>「事件匯流排或觀察者模式，在大型專案裡常見的問題是什麼？」</li>
<li>「你會怎麼設計一個有復原、重做功能的編輯器？」</li>
<li>「什麼是相依注入？不用框架要怎麼做？它跟相依反轉原則是什麼關係？」</li>
<li>「挑一條 SOLID 原則，用你寫過的程式舉例說明。」</li>
<li>「什麼時候你會選擇不用設計模式？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>單例把相依藏在函式內部，簽名看不出來；狀態在測試之間共享，測試結果會跟執行順序有關；也很難換成假物件。如果真的只需要一個，我會讓它變成普通的類別或工廠函式，在組裝根建立唯一的一份，透過建構子或參數傳給需要的人。「只有一個」是組裝時的決定，不是類別自己的規定。</li>
<li>最常見的是忘了取消訂閱：常駐的匯流排抓著聽眾，聽眾的閉包抓著已銷毀的元件，造成記憶體洩漏和幽靈行為。第二是可追蹤性：誰發送、誰接收，只能靠搜尋字串。第三是順序和重入：emit 是同步的，聽眾之間若隱性依賴訂閱順序就很脆弱；在 emit 中途訂閱、丟錯或再次 emit 都要處理。對策：在對稱的生命週期取消、用型別化的事件表、emit 前拍快照並隔離錯誤，以及限制匯流排的使用範圍。</li>
<li>用命令模式：每個使用者動作是一個帶有 run 和 undo 的物件，undo 需要的舊值在 run 的時候記下來。一個 done 堆疊、一個 undone 堆疊；執行新命令時清空 undone。再加上：連續的小動作合併成一個、設定歷史上限或只存差異、無法撤銷的動作改用補償動作並在介面上說明。</li>
<li>相依注入是物件需要的東西由外部提供，而不是自己建立或從全域拿。不用框架時就用建構子參數，並有一個組裝根負責把具體實作接起來。相依反轉是原則：高層不依賴低層細節，兩者都依賴由高層定義的抽象；相依注入是實現它最常見的手段。好處是可測試、可替換，代價是多了間接，所以只注入時間、亂數、網路、儲存這類真的會換或難測的東西。</li>
<li>以單一職責為例：一個猜牌按鈕的處理函式同時判斷規則、存分數、播音效、改畫面，任何一項需求改變都得動它，也很難測。我把規則抽成純函式 isCorrect，存檔、音效、畫面各自成為模組，由流程把它們串起來。之後改音效不會碰到規則，規則也能用幾行測試完整覆蓋。</li>
<li>當問題還沒出現的時候。只有一種做法就不做策略，只有一個父子溝通就不用事件匯流排，只包一個 new 就不做工廠。我會先寫最直接的版本，等同一種痛第二、三次出現，再引入對應的模式，並且在 PR 裡說明它解決了什麼。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>第四節的 EventBus 如果把 <code>[...set]</code> 改回直接 <code>for (const fn of set)</code>，再讓某個聽眾在收到 <code>score</code> 時又訂閱一個新的 <code>score</code> 聽眾，一次 emit 會發生什麼事？快照版本又付出了什麼代價？</li>
<li>替第五節的狀態機加上「暫停」：在 <code>guessing</code> 時收到 <code>PAUSE</code> 進入 <code>paused</code>，收到 <code>RESUME</code> 回到 <code>guessing</code>。表要改哪幾格？<code>send</code> 要改嗎？</li>
<li>第六節的 <code>placeCard</code> 如果把 <code>before = board.get(cell)</code> 移到建立命令的時候（也就是 <code>run</code> 之外），哪一個操作順序會讓 undo 還原到錯的值？寫出步驟。</li>
<li>找出你專案裡一個 <code>XxxManager.getInstance()</code> 或類似的全域單例，列出所有呼叫它的地方。如果要把它改成注入，組裝根會在哪個檔案？哪些函式的簽名要變？</li>
<li>下面的程式違反了哪一條 SOLID？怎麼改？<code>class ReadonlyDeck extends Deck { push(card: number) { throw new Error('read only'); } }</code></li>
<li>用第七節的 Game，寫一個「最佳分數沒有超過時不會呼叫 save」的檢查：用一個假的 ScoreStore 記錄被呼叫的次數。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>Set 在迭代時會走到新加入的元素，所以新聽眾會在同一次 emit 就被呼叫；如果它的程式又訂閱一個新的，就會一直繼續下去，形成無窮迴圈。快照版本只呼叫 emit 開始那一刻就在的聽眾，新加入的下一次 emit 才收得到；代價是在 emit 中途被取消的聽眾，這一次仍然會被呼叫一次。</li>
<li>在 <code>State</code> 加上 <code>'paused'</code>，<code>GameEvent</code> 加上 <code>'PAUSE' | 'RESUME'</code>；表裡 <code>guessing</code> 加 <code>PAUSE: [{ to: 'paused' }]</code>，新增 <code>paused: { RESUME: [{ to: 'guessing' }] }</code>。因為表的型別是 <code>Record&lt;State, ...&gt;</code>，漏寫 paused 這一列會直接編譯失敗。<code>send</code> 完全不用改，這就是表格驅動的好處。</li>
<li>例如：A1 原本是空的。建立「放 7」命令時記下 before = 空；接著先執行別的命令把 A1 改成 3；再執行「放 7」並 undo，A1 會被還原成空，而不是正確的 3。舊值必須在 run 的那一刻才記。</li>
<li>依專案而定。通常組裝根是 main.ts（Vue）或常駐的啟動場景元件（Cocos）。所有直接呼叫 getInstance 的函式，都要改成從參數、建構子或 inject 拿到它；改完之後，從簽名就看得出誰需要它。</li>
<li>違反里氏替換：任何拿到 Deck 的程式都期待 push 能用，換成 ReadonlyDeck 就爆掉。改法是反過來：讓唯讀的介面（只有讀取方法）當基底，可修改的 Deck 再擴充它；需要唯讀的地方只接受唯讀介面。</li>
<li>一種寫法：
<pre><code>// best.check.ts
import { Game } from './game';
let calls = 0;
const fakeStore = { save: async () =&gt; { calls += 1; } };
const game = new Game({ now: () =&gt; 0 }, { next: () =&gt; 0 }, fakeStore);
async function check(): Promise&lt;void&gt; {
  await game.finish(10);
  await game.finish(8);                   // 沒有超過 10，不該存
  await game.finish(12);
  console.log(calls === 2 ? 'ok' : 'wrong: ' + calls);
}
void check();

// game.ts
export interface Clock { now(): number }
export interface Rng { next(): number }
export interface ScoreStore { save(best: number): Promise&lt;void&gt; }
export class Game {
  best = 0;
  constructor(private clock: Clock, private rng: Rng, private store: ScoreStore) {}
  async finish(score: number): Promise&lt;number&gt; {
    if (score &gt; this.best) { this.best = score; await this.store.save(score); }
    return this.clock.now();
  }
}</code></pre>
下半段是第七節 game.ts 的精簡版，放在一起方便對照。預期印出 ok。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>Robert Nystrom《Game Programming Patterns》</b>（免費線上版 <a href="https://gameprogrammingpatterns.com/">gameprogrammingpatterns.com</a>）：命令、觀察者、狀態、單例都有獨立一章，全部用遊戲當例子，單例那章正是在講它為什麼常常是壞主意。</li>
<li><b>Refactoring.Guru 的設計模式目錄</b>（<a href="https://refactoring.guru/design-patterns">refactoring.guru/design-patterns</a>）：每個模式都有圖、優缺點和 TypeScript 範例，適合當查詢手冊。</li>
<li><b>Gamma、Helm、Johnson、Vlissides《Design Patterns: Elements of Reusable Object-Oriented Software》</b>（1994）：四人幫的原典。不必從頭讀，挑你在程式裡遇到的模式，看它的「動機」和「後果」兩節。</li>
<li><b>Robert C. Martin《Clean Architecture》</b>：SOLID 和相依反轉、元件分層的完整說明。</li>
<li><b>XState 官方文件</b>（<a href="https://stately.ai/docs">stately.ai/docs</a>）：狀態機和狀態圖的觀念講得很清楚，即使不用這個函式庫也值得讀。</li>
</ul>
` });
