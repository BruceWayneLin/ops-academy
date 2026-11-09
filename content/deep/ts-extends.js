DEEP({ 'ts-extends': `
<p>上一課你學會了 <code>extends</code>、<code>super</code>、<code>override</code> 和 <code>abstract</code> 怎麼寫。這一章把它們拆開來看：JavaScript 執行時到底用什麼東西做出「繼承」？<code>new</code> 一個子類別時，哪一行先跑、哪一行後跑？<code>override</code> 這個字幫你擋下了哪些錯？遊戲引擎為什麼那麼愛用抽象基底類別？最後看繼承最有名的兩個坑：脆弱的基底類別，和子類別數量爆炸，再動手把一段繼承改寫成組合。這些題目，正好是面試官判斷「會用」和「真的懂」的分水嶺。</p>

<h3><span class="badge lv1">基礎</span>一、類別編譯完剩下什麼：一條原型鏈</h3>
<p>Java 和 C# 的類別，在執行時是一個真的「類別」。JavaScript 沒有這種東西。TypeScript 的 <code>class</code> 編譯完，只剩兩樣東西：一個函式（建構函式），和一個掛在它身上、叫 <code>prototype</code> 的普通物件，方法就放在那個物件裡。</p>
<p>每個 JavaScript 物件身上都有一條看不見的連結，規格書裡寫成 <code>[[Prototype]]</code>，指向另一個物件。你讀一個物件身上沒有的屬性，JavaScript 就順著這條連結往上找。一個接一個連起來，就叫<b>原型鏈</b>（prototype chain）。<code>extends</code> 做的事，說穿了就是把子類別的 prototype 接到父類別的 prototype 上。</p>
<p>想像你在公司遇到問題：先翻自己的筆記；沒有，就問組長；組長也不知道，就問部門主管；一路問到老闆。老闆也不知道，答案就是「沒有」。原型鏈就是這條問人的路線。</p>
<pre><code>class Player {
  score = 0;
  constructor(public name: string) {}
  describe(): string {
    return this.name + ': ' + this.score;
  }
}

class SmartPlayer extends Player {
  guess(current: number): 'higher' | 'lower' {
    return current &lt;= 7 ? 'higher' : 'lower';
  }
}

const mia = new SmartPlayer('Mia');
const P = Object.getPrototypeOf;
console.log(Object.keys(mia));            // ['name', 'score']
console.log(Object.hasOwn(mia, 'describe'));   // false
// 下面三行都印 true
console.log(P(mia) === SmartPlayer.prototype);
console.log(P(SmartPlayer.prototype) === Player.prototype);
console.log(P(SmartPlayer) === Player);</code></pre>
<p>第一行印出來的，就是 <code>mia</code> 自己身上真正有的東西：只有兩個欄位。<code>describe</code> 不在它身上，是借來的。</p>
<figure class="figure"><svg viewBox="0 0 640 380" class="fg" style="width:100%;max-width:640px" role="img" aria-label="原型鏈：mia 實例連到 SmartPlayer.prototype，再連到 Player.prototype、Object.prototype，最後是 null；右邊是類別本身那一條鏈">
<rect x="70" y="20" width="250" height="52" rx="6" class="fg-b"/>
<text x="86" y="41" class="fg-t">mia（實例本身）</text>
<text x="86" y="61" class="fg-t sm mono">name: 'Mia', score: 0</text>
<rect x="70" y="104" width="250" height="52" rx="6" class="fg-b"/>
<text x="86" y="125" class="fg-t mono">SmartPlayer.prototype</text>
<text x="86" y="145" class="fg-t sm mono">guess()、constructor</text>
<rect x="70" y="188" width="250" height="52" rx="6" class="fg-b hot"/>
<text x="86" y="209" class="fg-t mono">Player.prototype</text>
<text x="86" y="229" class="fg-t sm mono">describe()、constructor</text>
<rect x="70" y="272" width="250" height="52" rx="6" class="fg-b"/>
<text x="86" y="293" class="fg-t mono">Object.prototype</text>
<text x="86" y="313" class="fg-t sm mono">toString()、hasOwnProperty()</text>
<text x="195" y="368" text-anchor="middle" class="fg-t sm">null（問到底了）</text>
<line x1="195" y1="72" x2="195" y2="96" class="fg-l on"/><polygon points="195,104 190.5,96 199.5,96" class="fg-a on"/>
<line x1="195" y1="156" x2="195" y2="180" class="fg-l on"/><polygon points="195,188 190.5,180 199.5,180" class="fg-a on"/>
<line x1="195" y1="240" x2="195" y2="264" class="fg-l"/><polygon points="195,272 190.5,264 199.5,264" class="fg-a"/>
<line x1="195" y1="324" x2="195" y2="344" class="fg-l"/><polygon points="195,352 190.5,344 199.5,344" class="fg-a"/>
<text x="205" y="92" class="fg-t sm mono">[[Prototype]]</text>
<text x="205" y="176" class="fg-t sm mono">[[Prototype]]</text>
<text x="205" y="260" class="fg-t sm mono">[[Prototype]]</text>
<text x="62" y="50" text-anchor="end" class="fg-t sm">1 沒有</text>
<text x="62" y="134" text-anchor="end" class="fg-t sm">2 沒有</text>
<text x="62" y="218" text-anchor="end" class="fg-t sm acc">3 找到</text>
<text x="520" y="90" text-anchor="middle" class="fg-t sm">類別本身那一側</text>
<rect x="420" y="104" width="200" height="52" rx="6" class="fg-b alt"/>
<text x="436" y="125" class="fg-t mono">SmartPlayer</text>
<text x="436" y="145" class="fg-t sm">一個函式</text>
<rect x="420" y="188" width="200" height="52" rx="6" class="fg-b alt"/>
<text x="436" y="209" class="fg-t mono">Player</text>
<text x="436" y="229" class="fg-t sm">static 成員沿這條繼承</text>
<rect x="420" y="272" width="200" height="52" rx="6" class="fg-b alt"/>
<text x="436" y="293" class="fg-t mono">Function.prototype</text>
<text x="436" y="313" class="fg-t sm mono">call()、bind()</text>
<line x1="520" y1="156" x2="520" y2="180" class="fg-l alt"/><polygon points="520,188 515.5,180 524.5,180" class="fg-a alt"/>
<line x1="520" y1="240" x2="520" y2="264" class="fg-l alt"/><polygon points="520,272 515.5,264 524.5,264" class="fg-a alt"/>
<line x1="420" y1="130" x2="328" y2="130" class="fg-l dash"/><polygon points="320,130 328,125.5 328,134.5" class="fg-a"/>
<text x="370" y="122" text-anchor="middle" class="fg-t sm mono">.prototype</text>
<line x1="420" y1="214" x2="328" y2="214" class="fg-l dash"/><polygon points="320,214 328,209.5 328,218.5" class="fg-a"/>
<text x="370" y="206" text-anchor="middle" class="fg-t sm mono">.prototype</text>
</svg><figcaption>呼叫 mia.describe()：先找物件自己（沒有），順著 [[Prototype]] 到 SmartPlayer.prototype（沒有），再到 Player.prototype（找到）。右邊是類別函式自己的那一條鏈，static 成員就是沿著它繼承下去的。</figcaption></figure>
<p>注意圖上有<b>兩條</b>鏈。左邊那條給實例用，負責方法；右邊那條是類別函式自己的，負責 <code>static</code> 成員。所以 <code>SmartPlayer.create()</code> 這種寫在父類別上的靜態方法，子類別也叫得到。</p>

<h3><span class="badge lv1">基礎</span>二、讀、寫、遮蔽：一個屬性是怎麼被找到的</h3>
<p>把上面的 <code>mia</code> 拿來，每一種存取都追一次：</p>
<table>
<tr><th>你寫的</th><th>執行時怎麼找</th><th>結果</th></tr>
<tr><td><code>mia.score</code></td><td>自己身上就有</td><td><code>0</code></td></tr>
<tr><td><code>mia.guess(3)</code></td><td>自己沒有 → SmartPlayer.prototype 有</td><td><code>'higher'</code></td></tr>
<tr><td><code>mia.describe()</code></td><td>自己沒有 → SmartPlayer.prototype 沒有 → Player.prototype 有</td><td><code>'Mia: 0'</code></td></tr>
<tr><td><code>mia.toString()</code></td><td>一路找到 Object.prototype</td><td><code>'[object Object]'</code></td></tr>
<tr><td><code>(mia as any).fly</code></td><td>找到 null 都沒有</td><td><code>&#117;ndefined</code></td></tr>
</table>
<p>最後一行，TypeScript 平常不會讓你寫出來：它在編譯時就看型別，知道 <code>SmartPlayer</code> 沒有 <code>fly</code>。這是兩件不同的事，一定要分清楚：</p>
<ul>
<li><b>TypeScript 在編譯時</b>，看<b>變數的型別</b>，決定「這個名字存不存在、型別對不對」。</li>
<li><b>JavaScript 在執行時</b>，從<b>物件本身</b>出發沿鏈找，決定「跑哪一份程式碼」。這叫<b>動態分派</b>（dynamic dispatch）。</li>
</ul>
<h4>寫入不會沿著鏈走</h4>
<p>讀屬性會往上找，<b>寫屬性不會</b>。對物件賦值，永遠是寫在物件自己身上（setter 是例外）。所以你對一個實例的方法賦值，會在它身上多一個同名屬性，把原型上的那一份「遮住」，這叫<b>遮蔽</b>（shadowing）。其他實例完全不受影響：</p>
<pre><code>mia.describe = () =&gt; 'hacked';
console.log(mia.describe());   // hacked：mia 自己的
const sam = new SmartPlayer('Sam');
console.log(sam.describe());   // Sam: 0：原型上的沒變</code></pre>
<p>這段程式碼接在上一段後面。實務上你不會這樣寫，但你會在不知不覺中做同一件事：<b>箭頭函式欄位</b>。<code>onClick = () =&gt; {...}</code> 是欄位，每個實例身上各一份，不在原型上。這造成兩個繼承時的坑，TypeScript 都會報錯：</p>
<pre><code>class Button {
  onClick = (): void =&gt; { console.log('base'); };
}

class BigButton extends Button {
  override onClick(): void {}          // 錯誤 TS2425
}

class SoundButton extends Button {
  override onClick = () =&gt; super.onClick(); // 錯誤 TS2855
}</code></pre>
<p>第一個錯誤：<code>BigButton</code> 的 <code>onClick</code> 是放在原型上的方法，可是父類別的建構函式會在每個實例身上放一個同名欄位，把它遮住，所以你的覆寫永遠不會被呼叫。第二個錯誤：<code>super.onClick</code> 只會去父類別的<b>原型</b>上找，而箭頭函式欄位根本不在原型上。結論很實用：<b>打算讓子類別覆寫的東西，寫成一般方法</b>；需要固定 <code>this</code> 的時候，在用的地方再包一層箭頭函式。</p>

<h3><span class="badge lv2">進階</span>三、new 一個子類別：誰先跑、誰後跑</h3>
<p>上一課說「子類別要先呼叫 super」。現在把整個過程用時間順序追一次。在每個階段放一行 <code>log</code>，讓它自己招供：</p>
<pre><code>function log(msg: string): number {
  console.log(msg);
  return 0;
}

class Player {
  score = log('2. Player 的欄位初始值');
  constructor(public name: string) {
    log('3. Player 建構函式本體，name = ' + this.name);
  }
}

class TimedPlayer extends Player {
  bonus = log('4. TimedPlayer 的欄位初始值');
  constructor(name: string, public seconds: number) {
    log('1. 進入 TimedPlayer，還沒呼叫 super');
    super(name);
    log('5. super 回來了，seconds = ' + this.seconds);
  }
}

new TimedPlayer('Mia', 5);</code></pre>
<p>印出來的順序就是 1、2、3、4、5。把它畫成時間軸，右邊是每一步結束時，物件身上有什麼：</p>
<figure class="figure"><svg viewBox="0 0 660 310" class="fg" style="width:100%;max-width:660px" role="img" aria-label="new TimedPlayer 的五個步驟，以及每一步結束時物件上 name、score、seconds、bonus 四個欄位的值">
<text x="364" y="16" text-anchor="middle" class="fg-t sm mono">name</text>
<text x="446" y="16" text-anchor="middle" class="fg-t sm mono">score</text>
<text x="528" y="16" text-anchor="middle" class="fg-t sm mono">seconds</text>
<text x="610" y="16" text-anchor="middle" class="fg-t sm mono">bonus</text>
<rect x="16" y="24" width="290" height="44" rx="6" class="fg-b warm"/>
<text x="30" y="42" class="fg-t">1 進入子類別的建構函式</text>
<text x="30" y="59" class="fg-t sm">super 之前：this 還不存在</text>
<text x="487" y="51" text-anchor="middle" class="fg-t sm warm">物件還沒建好，碰 this 就丟錯誤</text>
<rect x="16" y="80" width="290" height="44" rx="6" class="fg-b alt"/>
<text x="30" y="98" class="fg-t">2 super(name)：Player 的欄位</text>
<text x="30" y="115" class="fg-t sm">依宣告順序：name、score = 0</text>
<rect x="326" y="89" width="76" height="26" rx="4" class="fg-b"/><text x="364" y="107" text-anchor="middle" class="fg-t sm mono">&#117;ndefined</text>
<rect x="408" y="89" width="76" height="26" rx="4" class="fg-b hot"/><text x="446" y="107" text-anchor="middle" class="fg-t sm mono">0</text>
<rect x="490" y="89" width="76" height="26" rx="4" class="fg-l dim dash"/>
<rect x="572" y="89" width="76" height="26" rx="4" class="fg-l dim dash"/>
<rect x="16" y="136" width="290" height="44" rx="6" class="fg-b alt"/>
<text x="30" y="154" class="fg-t">3 Player 建構函式本體</text>
<text x="30" y="171" class="fg-t sm mono">this.name = 'Mia'</text>
<rect x="326" y="145" width="76" height="26" rx="4" class="fg-b hot"/><text x="364" y="163" text-anchor="middle" class="fg-t sm mono">'Mia'</text>
<rect x="408" y="145" width="76" height="26" rx="4" class="fg-b"/><text x="446" y="163" text-anchor="middle" class="fg-t sm mono">0</text>
<rect x="490" y="145" width="76" height="26" rx="4" class="fg-l dim dash"/>
<rect x="572" y="145" width="76" height="26" rx="4" class="fg-l dim dash"/>
<rect x="16" y="192" width="290" height="44" rx="6" class="fg-b"/>
<text x="30" y="210" class="fg-t">4 回到子類別：它的欄位</text>
<text x="30" y="227" class="fg-t sm">seconds 先宣告、bonus = 2</text>
<rect x="326" y="201" width="76" height="26" rx="4" class="fg-b"/><text x="364" y="219" text-anchor="middle" class="fg-t sm mono">'Mia'</text>
<rect x="408" y="201" width="76" height="26" rx="4" class="fg-b"/><text x="446" y="219" text-anchor="middle" class="fg-t sm mono">0</text>
<rect x="490" y="201" width="76" height="26" rx="4" class="fg-b hot"/><text x="528" y="219" text-anchor="middle" class="fg-t sm mono">&#117;ndefined</text>
<rect x="572" y="201" width="76" height="26" rx="4" class="fg-b hot"/><text x="610" y="219" text-anchor="middle" class="fg-t sm mono">2</text>
<rect x="16" y="248" width="290" height="44" rx="6" class="fg-b"/>
<text x="30" y="266" class="fg-t">5 子類別建構函式的其餘部分</text>
<text x="30" y="283" class="fg-t sm mono">this.seconds = 5</text>
<rect x="326" y="257" width="76" height="26" rx="4" class="fg-b"/><text x="364" y="275" text-anchor="middle" class="fg-t sm mono">'Mia'</text>
<rect x="408" y="257" width="76" height="26" rx="4" class="fg-b"/><text x="446" y="275" text-anchor="middle" class="fg-t sm mono">0</text>
<rect x="490" y="257" width="76" height="26" rx="4" class="fg-b hot"/><text x="528" y="275" text-anchor="middle" class="fg-t sm mono">5</text>
<rect x="572" y="257" width="76" height="26" rx="4" class="fg-b"/><text x="610" y="275" text-anchor="middle" class="fg-t sm mono">2</text>
</svg><figcaption>父類別那一份（name、score）在第 2、3 步建好；子類別加蓋的那一份（seconds、bonus）要等 super 回來，第 4、5 步才出現。綠框是那一步剛改變的值，虛線框是還不存在的欄位。</figcaption></figure>
<p>從這張圖可以讀出三條規則：</p>
<ol>
<li><b>super 之前不能碰 this。</b>在衍生類別裡，物件是由父類別的建構函式建出來的，所以 super 回來之前 <code>this</code> 根本還沒有。TypeScript 4.6 之後，super 前面可以寫不碰 <code>this</code> 的程式碼，像第 1 步的 log。</li>
<li><b>每一層都是「先欄位初始值，再建構函式本體」。</b>父類別整層做完（第 2、3 步），才輪到子類別（第 4、5 步）。</li>
<li><b>參數屬性（parameter property）是在建構函式本體一開頭才賦值。</b>所以在目標是 ES2022 以上時（這時 <code>useDefineForClassFields</code> 預設開啟），欄位初始值如果讀 <code>this.name</code>，讀到的是 <code>&#117;ndefined</code>，TypeScript 會報 TS2729「Property 'name' is used before its initialization」。</li>
</ol>
<h4>上一課那個陷阱，現在看得懂了</h4>
<pre><code>class Base {
  constructor() {
    this.init();          // 在第 2～3 步之間呼叫
  }
  init(): void {}
}

class Child extends Base {
  label = 'child';        // 第 4 步才會設定
  override init(): void {
    console.log('label =', this.label);
  }
}

new Child();              // label = &#117;ndefined</code></pre>
<p>父類別的建構函式呼叫 <code>this.init()</code>，動態分派找到的是子類別的版本，可是子類別的欄位要到第 4 步才有值。TypeScript 不會警告你，這個錯只能靠你記住時間軸。</p>
<p>這也是為什麼 Cocos Creator 和 Unity 都要你把初始化寫在 <code>onLoad</code>、<code>start</code>（Unity 是 <code>Awake</code>、<code>Start</code>），而不是建構函式。引擎是先把元件 new 出來，再把你在編輯器屬性面板上設定的值填進去，最後才呼叫 <code>onLoad</code>。在建構函式裡，那些值都還是預設值。</p>

<h3><span class="badge lv2">進階</span>四、override：TypeScript 到底幫你檢查什麼</h3>
<p><code>override</code> 這個字在執行時什麼都不做，編譯完就消失了。它的價值全在編譯時的四道檢查：</p>
<pre><code>class Unit { hp = 10; }
class Boss extends Unit { phase = 1; }
class Player {
  describe(): string { return 'Mia'; }
  hit(target: Unit): void { target.hp -= 1; }
}

class Typo extends Player {
  override descripe(): string { return '?'; } // 錯誤 TS4113
}
class Forgot extends Player {
  describe(): string { return 'loud'; }       // 錯誤 TS4114
}
class WrongType extends Player {
  override describe(): number { return 1; }   // 錯誤 TS2416
}
class BossOnly extends Player {
  override hit(t: Boss): void { t.phase += 1; } // 竟然通過
}</code></pre>
<ol>
<li><b>名字要存在</b>（TS4113）：打錯字、或父類別把方法改名了，馬上抓到。</li>
<li><b>忘記寫也要抓</b>（TS4114）：在 tsconfig 開 <code>"noImplicitOverride": true</code>，每一個覆寫都必須明講。這樣讀程式碼的人，一眼就知道哪些方法是「換掉父類別的」。</li>
<li><b>型別要相容</b>（TS2416）：子類別的版本，必須能放在任何需要父類別版本的地方。回傳型別可以更窄（父類別回傳 <code>string</code>，子類別回傳 <code>'higher'</code> 可以），參數可以更少（上一課的 <code>RandomPlayer.guess()</code>）。</li>
<li><b>欄位與方法不能混</b>（第二節的 TS2425、TS2855）。</li>
</ol>
<p>最後一個 <code>BossOnly</code> 是個洞。它把參數從 <code>Unit</code> 縮窄成 <code>Boss</code>，這其實不安全：拿一個型別寫成 <code>Player</code> 的變數，傳一個普通 <code>Unit</code> 進去，執行時 <code>t.phase</code> 是 <code>&#117;ndefined</code>，加 1 變成 <code>NaN</code>，不會當掉，只會默默算錯。TypeScript 放過它，是因為<b>用方法語法宣告的方法，參數是雙變的</b>（method parameter bivariance），這是為了相容大量舊程式碼而做的取捨。<code>strictFunctionTypes</code> 只會嚴格檢查「寫成函式型別的屬性」，例如 <code>hit: (target: Unit) =&gt; void</code>。泛型那一章會再講這背後的「變異性」。</p>
<figure class="figure"><svg viewBox="0 0 660 260" class="fg" style="width:100%;max-width:660px" role="img" aria-label="父類別把 describe 改名為 summary 之後，沒寫 override 的子類別默默編譯通過，寫了 override 的子類別立刻報錯">
<line x1="330" y1="10" x2="330" y2="250" class="fg-l dim dash"/>
<text x="165" y="24" text-anchor="middle" class="fg-t lg warm">沒寫 override</text>
<text x="495" y="24" text-anchor="middle" class="fg-t lg acc">寫了 override</text>
<rect x="30" y="40" width="270" height="50" rx="6" class="fg-b alt"/>
<text x="44" y="60" class="fg-t">Player（基底，第 2 版）</text>
<text x="44" y="79" class="fg-t sm mono">describe() 改名成 summary()</text>
<rect x="360" y="40" width="270" height="50" rx="6" class="fg-b alt"/>
<text x="374" y="60" class="fg-t">Player（基底，第 2 版）</text>
<text x="374" y="79" class="fg-t sm mono">describe() 改名成 summary()</text>
<line x1="165" y1="120" x2="165" y2="98" class="fg-l"/><polygon points="165,90 160.5,98 169.5,98" class="fg-a"/>
<text x="175" y="110" class="fg-t sm mono">extends</text>
<line x1="495" y1="120" x2="495" y2="98" class="fg-l"/><polygon points="495,90 490.5,98 499.5,98" class="fg-a"/>
<text x="505" y="110" class="fg-t sm mono">extends</text>
<rect x="30" y="120" width="270" height="50" rx="6" class="fg-b"/>
<text x="44" y="140" class="fg-t">LoudPlayer（子類別，沒改）</text>
<text x="44" y="159" class="fg-t sm mono">describe() { … }</text>
<rect x="360" y="120" width="270" height="50" rx="6" class="fg-b"/>
<text x="374" y="140" class="fg-t">LoudPlayer（子類別，沒改）</text>
<text x="374" y="159" class="fg-t sm mono">override describe() { … }</text>
<line x1="165" y1="170" x2="165" y2="190" class="fg-l warm"/><polygon points="165,198 160.5,190 169.5,190" class="fg-a warm"/>
<line x1="495" y1="170" x2="495" y2="190" class="fg-l on"/><polygon points="495,198 490.5,190 499.5,190" class="fg-a on"/>
<rect x="30" y="198" width="270" height="50" rx="6" class="fg-b warm"/>
<text x="44" y="218" class="fg-t warm">編譯通過，問題藏起來</text>
<text x="44" y="237" class="fg-t sm">describe 變成沒人呼叫的新方法</text>
<rect x="360" y="198" width="270" height="50" rx="6" class="fg-b hot"/>
<text x="374" y="218" class="fg-t acc">編譯錯誤 TS4113</text>
<text x="374" y="237" class="fg-t sm">改名的那一刻就被抓到</text>
</svg><figcaption>同一次重新命名，左邊會變成上線後才發現的「為什麼不大聲了」；右邊在存檔的那一刻就出現紅線。override 是寫給未來改程式的人看的保險。</figcaption></figure>

<h3><span class="badge lv3">專業</span>五、抽象類別與範本方法：遊戲引擎的骨架</h3>
<p>上一課的 <code>play</code> 方法有一個正式的名字：<b>範本方法模式</b>（Template Method pattern），出自 1994 年那本經典的《Design Patterns》。基底類別寫好一個固定的流程（範本方法），流程中留幾個位置給子類別填，這些位置叫<b>鉤子</b>（hook）。鉤子分兩種：</p>
<ul>
<li><b>抽象方法</b>：一定要填，不填就編譯錯誤。適合「沒有合理預設行為」的步驟，例如 <code>guess</code>。</li>
<li><b>選擇性方法或空的預設實作</b>：想填才填。適合「大部分子類別用不到」的步驟，例如 <code>onDestroy</code>。</li>
</ul>
<p>用四十行寫一個迷你引擎，你就懂 Cocos Creator 的 <code>Component</code> 在做什麼：</p>
<pre><code>abstract class Component {
  enabled = true;
  private started = false;
  protected start?(): void;        // 選擇性鉤子
  protected update?(dt: number): void;

  // 範本方法：引擎每個影格呼叫它。流程固定，子類別不要覆寫
  runFrame(dt: number): void {
    if (!this.enabled) return;
    if (!this.started) {
      this.started = true;
      this.start?.();
    }
    this.update?.(dt);
  }
}

class Countdown extends Component {
  seconds = 3;
  protected override start(): void {
    console.log('開始倒數');
  }
  protected override update(dt: number): void {
    this.seconds = Math.max(0, this.seconds - dt);
  }
}

const scene: Component[] = [new Countdown()];
for (let frame = 0; frame &lt; 3; frame++) {
  for (const c of scene) c.runFrame(1);  // 引擎主迴圈
}</code></pre>
<figure class="figure"><svg viewBox="0 0 660 300" class="fg" style="width:100%;max-width:660px" role="img" aria-label="範本方法：引擎主迴圈呼叫基底類別的 runFrame，runFrame 依序檢查 enabled、第一次呼叫 start、每次呼叫 update，start 和 update 由子類別提供">
<rect x="200" y="14" width="260" height="40" rx="6" class="fg-b alt"/>
<text x="330" y="39" text-anchor="middle" class="fg-t">引擎主迴圈：每個影格</text>
<line x1="330" y1="54" x2="330" y2="78" class="fg-l"/><polygon points="330,86 325.5,78 334.5,78" class="fg-a"/>
<text x="342" y="74" class="fg-t sm mono">runFrame(dt)</text>
<rect x="40" y="86" width="580" height="102" rx="8" class="fg-b"/>
<text x="56" y="108" class="fg-t">Component（抽象基底類別）：流程固定在這裡</text>
<rect x="60" y="122" width="160" height="50" rx="6" class="fg-b"/>
<text x="140" y="142" text-anchor="middle" class="fg-t">1 enabled？</text>
<text x="140" y="161" text-anchor="middle" class="fg-t sm">關掉就直接 return</text>
<rect x="250" y="122" width="160" height="50" rx="6" class="fg-b"/>
<text x="330" y="142" text-anchor="middle" class="fg-t">2 第一次？</text>
<text x="330" y="161" text-anchor="middle" class="fg-t sm mono">start?.()</text>
<rect x="440" y="122" width="160" height="50" rx="6" class="fg-b"/>
<text x="520" y="142" text-anchor="middle" class="fg-t">3 每一次</text>
<text x="520" y="161" text-anchor="middle" class="fg-t sm mono">update?.(dt)</text>
<line x1="220" y1="147" x2="242" y2="147" class="fg-l"/><polygon points="250,147 242,142.5 242,151.5" class="fg-a"/>
<line x1="410" y1="147" x2="432" y2="147" class="fg-l"/><polygon points="440,147 432,142.5 432,151.5" class="fg-a"/>
<rect x="200" y="230" width="260" height="54" rx="6" class="fg-b hot"/>
<text x="330" y="252" text-anchor="middle" class="fg-t acc">Countdown（你寫的子類別）</text>
<text x="330" y="272" text-anchor="middle" class="fg-t sm">只填 start() 和 update(dt)</text>
<line x1="330" y1="172" x2="330" y2="222" class="fg-l on"/><polygon points="330,230 325.5,222 334.5,222" class="fg-a on"/>
<path d="M520 172 V257 H468" class="fg-l on"/><polygon points="460,257 468,252.5 468,261.5" class="fg-a on"/>
<text x="342" y="208" class="fg-t sm acc">呼叫鉤子</text>
<text x="530" y="208" class="fg-t sm acc">呼叫鉤子</text>
<text x="40" y="250" class="fg-t sm">你從不自己呼叫</text>
<text x="40" y="267" class="fg-t sm">start、update</text>
</svg><figcaption>控制權在基底類別手上：它決定什麼時候、用什麼順序呼叫鉤子。子類別只回答「輪到我時要做什麼」。這就是「別打給我們，我們會打給你」。</figcaption></figure>
<h4>真實引擎多做的一件事：沒寫 update 就不排進去</h4>
<p>Cocos Creator 3.8 的型別宣告裡，<code>start</code>、<code>update</code> 這些生命週期方法都宣告成選擇性的（<code>protected update?(dt: number): void</code>），而不是抽象方法。原因是效能：引擎的排程器在元件啟用時，會檢查它到底有沒有 <code>update</code>，有才把它放進「每個影格都要呼叫」的清單。一個場景有幾百個元件，大部分（按鈕、圖片）根本不需要每格更新，就完全不用付這筆錢。</p>
<p>所以一個空的 <code>update(dt) {}</code> 不是免費的：它會讓這個元件每格被呼叫一次，什麼事都沒做。Unity 也一樣：它第一次遇到某個腳本類別時，會檢查它有沒有寫 <code>Update</code> 這類方法並記下來，Unity 官方部落格有一篇〈10000 Update() calls〉專門量過這筆成本。用不到的生命週期方法，就不要留空殼。</p>
<h4>TypeScript 沒有 final</h4>
<p>Java 可以把 <code>runFrame</code> 標成 <code>final</code>，禁止子類別覆寫；C# 預設方法就不能覆寫（要寫 <code>virtual</code>）。TypeScript 兩者都沒有：任何公開或 protected 的方法，子類別都能覆寫。你能做的是在註解寫清楚「不要覆寫」、開 <code>noImplicitOverride</code> 讓覆寫變得顯眼，或者把不該被換掉的步驟搬出類別，變成它呼叫的私有函式。</p>

<h3><span class="badge lv3">專業</span>六、脆弱的基底類別：別人改一行，你壞一片</h3>
<p>這是繼承最有名的問題，叫<b>脆弱的基底類別</b>（fragile base class）。基底類別的作者做了一個看起來完全無害的修改，所有子類別的行為就變了，而且沒有任何編譯錯誤。看一個背包：</p>
<pre><code>class Inventory {
  protected items: string[] = [];
  add(item: string): void {
    this.items.push(item);
  }
  addMany(list: string[]): void {
    // 第 1 版：this.items.push(...list);
    // 第 2 版：有人「整理」了一下，改成重用 add
    for (const item of list) this.add(item);
  }
}

class CountingInventory extends Inventory {
  added = 0;
  override add(item: string): void {
    this.added += 1;
    super.add(item);
  }
  override addMany(list: string[]): void {
    this.added += list.length;
    super.addMany(list);
  }
}

const bag = new CountingInventory();
bag.addMany(['劍', '盾', '藥水']);
console.log(bag.added);   // 第 1 版印 3，第 2 版印 6</code></pre>
<figure class="figure"><svg viewBox="0 0 660 270" class="fg" style="width:100%;max-width:660px" role="img" aria-label="第 1 版 addMany 直接放入物品，計數為 3；第 2 版 addMany 改成呼叫 this.add，動態分派回到子類別的 add，計數變成 6">
<line x1="330" y1="10" x2="330" y2="260" class="fg-l dim dash"/>
<text x="165" y="24" text-anchor="middle" class="fg-t lg">第 1 版基底</text>
<text x="495" y="24" text-anchor="middle" class="fg-t lg">第 2 版基底（重構後）</text>
<rect x="40" y="40" width="250" height="38" rx="6" class="fg-b"/>
<text x="165" y="64" text-anchor="middle" class="fg-t">子類別 addMany：+3</text>
<rect x="370" y="40" width="250" height="38" rx="6" class="fg-b"/>
<text x="495" y="64" text-anchor="middle" class="fg-t">子類別 addMany：+3</text>
<line x1="165" y1="78" x2="165" y2="102" class="fg-l"/><polygon points="165,110 160.5,102 169.5,102" class="fg-a"/>
<text x="175" y="98" class="fg-t sm mono">super.addMany</text>
<line x1="495" y1="78" x2="495" y2="102" class="fg-l"/><polygon points="495,110 490.5,102 499.5,102" class="fg-a"/>
<text x="505" y="98" class="fg-t sm mono">super.addMany</text>
<rect x="40" y="110" width="250" height="38" rx="6" class="fg-b alt"/>
<text x="165" y="134" text-anchor="middle" class="fg-t">基底 addMany：直接 push</text>
<rect x="370" y="110" width="250" height="38" rx="6" class="fg-b alt"/>
<text x="495" y="134" text-anchor="middle" class="fg-t">基底 addMany：逐一 this.add</text>
<line x1="495" y1="148" x2="495" y2="172" class="fg-l warm"/><polygon points="495,180 490.5,172 499.5,172" class="fg-a warm"/>
<text x="505" y="168" class="fg-t sm warm">this 是子類別的實例</text>
<rect x="370" y="180" width="250" height="38" rx="6" class="fg-b warm"/>
<text x="495" y="204" text-anchor="middle" class="fg-t">子類別 add：+1，跑 3 次</text>
<text x="165" y="196" text-anchor="middle" class="fg-t sm">不會再回頭呼叫 add</text>
<text x="165" y="246" text-anchor="middle" class="fg-t acc">added = 3，正確</text>
<text x="495" y="246" text-anchor="middle" class="fg-t warm">added = 6，多算一倍</text>
</svg><figcaption>第 2 版的基底類別在內部呼叫了自己的公開方法 this.add。因為動態分派，這一呼叫跑到子類別的 add，計數就被算了兩次。兩個類別各自看起來都沒錯。</figcaption></figure>
<p>問題出在哪？子類別在不知不覺中，依賴了基底類別的<b>內部實作</b>：「addMany 會不會呼叫 add」。這件事不在任何型別裡，也不在任何文件裡，卻是子類別正確與否的關鍵。只要你覆寫一個會被基底類別內部呼叫的方法，你就跟它的實作細節綁在一起了。</p>
<h4>三種防守方式</h4>
<ol>
<li><b>寫基底類別的人</b>：不要在內部呼叫可以被覆寫的公開方法，改呼叫私有的輔助函式；或者明寫在文件上「addMany 會逐一呼叫 add」，把它變成正式的合約。《Effective Java》的建議是：要嘛為繼承而設計並寫清楚文件，要嘛就禁止繼承。</li>
<li><b>給子類別明確的鉤子</b>：與其讓子類別覆寫 <code>add</code>，不如由基底類別提供 <code>protected onAdded(item)</code>，並保證每放進一件就呼叫一次。這就是上一節的範本方法。</li>
<li><b>不要繼承，改用包裝</b>：</li>
</ol>
<pre><code>interface Bag {
  add(item: string): void;
  addMany(list: string[]): void;
}

class CountingBag implements Bag {
  added = 0;
  constructor(private inner: Bag) {}
  add(item: string): void {
    this.added += 1;
    this.inner.add(item);
  }
  addMany(list: string[]): void {
    this.added += list.length;
    this.inner.addMany(list);
  }
}</code></pre>
<p>這時候就算 <code>inner.addMany</code> 內部呼叫 <code>this.add</code>，那個 <code>this</code> 也是 <code>inner</code> 自己，不是 <code>CountingBag</code>，所以永遠只算一次。這種「我持有一個你，把工作轉交給你」的做法叫<b>委派</b>（delegation），也叫裝飾者（decorator）模式。代價是每個方法都要寫一行轉交的程式碼。</p>

<h3><span class="badge lv3">專業</span>七、組合取代繼承：一次完整的重構</h3>
<p>另一個問題比較直觀：<b>子類別數量爆炸</b>。猜大小的玩家有三種「腦袋」：真人、亂猜、聰明。後來企劃說：有些玩家要限時，有些玩家猜完要大聲喊出來。用繼承的話，每一種組合都是一個子類別：</p>
<figure class="figure"><svg viewBox="0 0 660 280" class="fg" style="width:100%;max-width:660px" role="img" aria-label="左邊是繼承：三種腦袋乘上限時與喊話，共需 12 個子類別；右邊是組合：一個 Player 類別插上腦袋、喊話、計時三個零件">
<line x1="335" y1="10" x2="335" y2="270" class="fg-l dim dash"/>
<text x="165" y="18" text-anchor="middle" class="fg-t sm warm">繼承：是一種</text>
<text x="500" y="18" text-anchor="middle" class="fg-t sm acc">組合：有一個</text>
<rect x="125" y="30" width="80" height="30" rx="5" class="fg-b"/><text x="165" y="50" text-anchor="middle" class="fg-t">玩家</text>
<rect x="20" y="90" width="80" height="30" rx="5" class="fg-b"/><text x="60" y="110" text-anchor="middle" class="fg-t">真人</text>
<rect x="125" y="90" width="80" height="30" rx="5" class="fg-b"/><text x="165" y="110" text-anchor="middle" class="fg-t">亂猜</text>
<rect x="230" y="90" width="80" height="30" rx="5" class="fg-b"/><text x="270" y="110" text-anchor="middle" class="fg-t">聰明</text>
<line x1="165" y1="60" x2="60" y2="90" class="fg-l"/><line x1="165" y1="60" x2="165" y2="90" class="fg-l"/><line x1="165" y1="60" x2="270" y2="90" class="fg-l"/>
<rect x="166" y="150" width="72" height="30" rx="5" class="fg-b warm"/><text x="202" y="170" text-anchor="middle" class="fg-t">限時聰明</text>
<rect x="246" y="150" width="72" height="30" rx="5" class="fg-b warm"/><text x="282" y="170" text-anchor="middle" class="fg-t">大聲聰明</text>
<line x1="270" y1="120" x2="202" y2="150" class="fg-l"/><line x1="270" y1="120" x2="282" y2="150" class="fg-l"/>
<rect x="148" y="210" width="108" height="30" rx="5" class="fg-b warm"/><text x="202" y="230" text-anchor="middle" class="fg-t">大聲限時聰明</text>
<line x1="202" y1="180" x2="202" y2="210" class="fg-l"/>
<text x="20" y="160" class="fg-t sm">真人、亂猜</text>
<text x="20" y="176" class="fg-t sm">也各要一套</text>
<text x="20" y="264" class="fg-t sm warm">3 種腦袋 × 限時 × 喊話 = 12 個類別</text>
<rect x="400" y="34" width="200" height="50" rx="6" class="fg-b hot"/>
<text x="500" y="56" text-anchor="middle" class="fg-t acc">Player</text>
<text x="500" y="74" text-anchor="middle" class="fg-t sm">只有一個類別</text>
<rect x="356" y="150" width="92" height="66" rx="6" class="fg-b alt"/>
<text x="402" y="171" text-anchor="middle" class="fg-t">腦袋</text>
<text x="402" y="189" text-anchor="middle" class="fg-t sm mono">Brain</text>
<text x="402" y="206" text-anchor="middle" class="fg-t sm">3 種可換</text>
<rect x="456" y="150" width="92" height="66" rx="6" class="fg-b alt"/>
<text x="502" y="171" text-anchor="middle" class="fg-t">喊話</text>
<text x="502" y="189" text-anchor="middle" class="fg-t sm mono">Announcer</text>
<text x="502" y="206" text-anchor="middle" class="fg-t sm">2 種</text>
<rect x="556" y="150" width="92" height="66" rx="6" class="fg-b alt"/>
<text x="602" y="171" text-anchor="middle" class="fg-t">限時</text>
<text x="602" y="189" text-anchor="middle" class="fg-t sm mono">timeLimit</text>
<text x="602" y="206" text-anchor="middle" class="fg-t sm">有或沒有</text>
<line x1="480" y1="84" x2="402" y2="150" class="fg-l alt"/><line x1="500" y1="84" x2="502" y2="150" class="fg-l alt"/><line x1="520" y1="84" x2="602" y2="150" class="fg-l alt"/>
<text x="510" y="122" class="fg-t sm">有一個</text>
<text x="500" y="250" text-anchor="middle" class="fg-t sm acc">3 + 2 + 2 個小零件，組出 12 種玩家</text>
</svg><figcaption>繼承是乘法：每多一個變化的維度，類別數就翻倍。組合是加法：每個維度各自是一個可替換的零件。</figcaption></figure>
<p>重構的步驟，在任何專案都一樣：</p>
<ol>
<li><b>列出子類別之間真正不同的地方。</b>這裡是三件事：怎麼猜、要不要喊、有沒有限時。</li>
<li><b>每一種「不同」抽成一個小介面。</b><code>Brain</code>、<code>Announcer</code>。</li>
<li><b>用建構函式把零件交進來。</b>這叫<b>依賴注入</b>（dependency injection），沒什麼神祕的，就是「零件從外面給」。</li>
<li><b>刪掉子類別，改成組裝。</b></li>
<li><b>測試時塞假零件。</b>一個永遠猜「大」的腦袋，就能測出計分對不對。</li>
</ol>
<pre><code>type Guess = 'higher' | 'lower';
interface Brain { guess(current: number): Guess; }
interface Announcer { say(text: string): void; }

const smart: Brain = {
  guess: (c) =&gt; (c &lt;= 7 ? 'higher' : 'lower'),
};
const coin: Brain = {
  guess: () =&gt; (Math.random() &lt; 0.5 ? 'higher' : 'lower'),
};
const silent: Announcer = { say: () =&gt; {} };
const loud: Announcer = {
  say: (t) =&gt; console.log(t.toUpperCase()),
};

class Player {
  score = 0;
  constructor(
    public name: string,
    private brain: Brain,
    private announcer: Announcer = silent,
    public timeLimit?: number,
  ) {}

  play(current: number, next: number): void {
    const g = this.brain.guess(current);
    const right =
      g === 'higher' ? next &gt; current : next &lt; current;
    if (right) this.score += 1;
    const word = right ? ' got it' : ' missed';
    this.announcer.say(this.name + word);
  }
}

// 聰明、大聲、限時 10 秒
const mia = new Player('Mia', smart, loud, 10);
// 亂猜、安靜、不限時
const bot = new Player('Bot', coin);
mia.play(5, 9);   // 印出 MIA GOT IT</code></pre>
<h4>組合也有代價</h4>
<ul>
<li><b>要接線</b>：誰來決定給哪顆腦袋？這段組裝程式碼總要寫在某個地方（工廠函式、設定檔，或引擎的編輯器）。</li>
<li><b>多一層間接</b>：讀程式碼時，<code>this.brain.guess</code> 跳不到唯一的實作，要去看是誰被注入了。</li>
<li><b>轉交的樣板程式碼</b>：包裝一個有十個方法的物件，就要寫十行轉交。</li>
</ul>
<p>一條實用的規則：<b>繼承用來接上框架，組合用來組出變化。</b>繼承 <code>Component</code> 一層，是引擎規定的接頭，完全正常；而在你自己的遊戲邏輯裡，每一個「這種玩家、那種玩家」的變化，都優先做成零件。Cocos Creator 的場景本身就是這個思路：一個節點身上掛好幾個元件，而不是一條很深的類別鏈。Robert Nystrom 的《Game Programming Patterns》專門有一章講這個元件模式。</p>

<h3><span class="badge lv4">專家</span>八、邊角：大部分人不會碰到、碰到就很痛的事</h3>
<h4>1. 欄位宣告會把父類別設好的值蓋掉</h4>
<p>目標是 ES2022 以上時，TypeScript 用 JavaScript 原生的類別欄位（class fields）語意。一個只宣告、不給值的欄位，在第 4 步也會被「定義」一次，值是 <code>&#117;ndefined</code>：</p>
<pre><code>class Base {
  constructor() { this.setup(); }
  setup(): void {}
}

class A extends Base {
  items!: string[];                 // 會產生一個欄位定義
  override setup(): void { this.items = ['a']; }
}

class B extends Base {
  declare items: string[];          // 只給型別，不產生任何程式碼
  override setup(): void { this.items = ['b']; }
}

console.log(new A().items);   // &#117;ndefined
console.log(new B().items);   // ['b']</code></pre>
<p><code>setup</code> 在第 2～3 步之間把值放好，第 4 步 <code>A</code> 的欄位定義又把它蓋成 <code>&#117;ndefined</code>。<code>!</code> 只是叫 TypeScript 不要抱怨，不會改變產生的程式碼；<code>declare</code> 才是真的「只是型別」。把 tsconfig 的 target 從 ES2017 升到 ES2022，這種程式就會突然壞掉，因為 <code>useDefineForClassFields</code> 的預設值跟著變了。</p>
<h4>2. mixin：不用多層繼承也能共用一段行為</h4>
<p>JavaScript 只能繼承一個類別，但 <code>extends</code> 後面可以接任何算出類別的運算式。TypeScript 官方手冊介紹的 mixin 寫法，就是一個「收一個類別、回傳它的子類別」的函式：</p>
<pre><code>type Ctor = new (...args: any[]) =&gt; {};

function Timed&lt;TBase extends Ctor&gt;(Base: TBase) {
  return class extends Base {
    seconds = 10;
    tick(): void { this.seconds -= 1; }
  };
}

class Player {
  constructor(public name: string) {}
}

const TimedPlayer = Timed(Player);
const tp = new TimedPlayer('Mia');
tp.tick();
console.log(tp.name, tp.seconds);   // Mia 9</code></pre>
<p>mixin 本質上還是繼承，原型鏈一樣會變長，名字也可能互相撞到。它適合「很多不相干的類別都要同一小段行為」的情況；一般的變化，第七節的組合仍然比較好讀。</p>
<h4>3. 繼承內建類別：自訂錯誤</h4>
<p>後端最常見的繼承，是自訂錯誤型別：<code>class GameError extends Error</code>，在建構函式裡呼叫 <code>super(message)</code>，再設定 <code>this.name = 'GameError'</code>，讓日誌裡看得出是哪一種錯。target 是 ES2015 以上時，<code>instanceof GameError</code> 正常運作。如果你維護的舊專案 target 還是 ES5，繼承 <code>Error</code>、<code>Array</code>、<code>Map</code> 會失靈，<code>instanceof</code> 回傳 false，要在建構函式裡補一行 <code>Object.setPrototypeOf(this, new.target.prototype)</code>。</p>
<h4>4. 效能：深的不是鏈，是呼叫點看到幾種形狀</h4>
<p>V8 這類引擎會幫每個物件記一個內部的「形狀」（hidden class，V8 裡叫 map），並在每一個呼叫點快取「上次這種形狀的方法在哪裡」，這叫<b>行內快取</b>（inline cache）。同一個呼叫點只看過一種形狀叫單態（monomorphic），最快；看過 2 到 4 種叫多態（polymorphic），稍慢；超過 4 種就變成超多態（megamorphic），只能走通用的慢路。</p>
<p>所以原型鏈多一兩層，因為有快取，幾乎沒差。真正會慢的，是引擎主迴圈裡那一行 <code>c.update(dt)</code>：場景裡有三十種不同的元件類別，這個呼叫點就是超多態。對大部分遊戲這完全夠用；對每格要處理上萬個物件的系統，這就是 ECS（實體元件系統）把同類資料排成陣列、一次處理一整批的原因之一。另一個免費的好習慣：同一個類別的欄位，永遠在建構時用同樣的順序全部給值，形狀就會穩定。</p>
<h4>5. #private 不會傳給子類別</h4>
<p><code>#secret</code> 是 JavaScript 真正的私有欄位，連子類別都碰不到（TS18013）；<code>protected</code> 子類別可以用，但它只是編譯時的檢查。要讓子類別用，就給 protected；要徹底藏起來，連子類別都不信任，才用 <code>#</code>。</p>

<h3>九、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>TypeScript 的類別跟 Java 一樣，執行時有一個真正的類別</td><td>執行時只有一個函式和一條原型鏈。方法是沿鏈「借」來的，所以可以在執行時被遮蔽、被改掉。</td></tr>
<tr><td>變數型別寫 <code>Player</code>，呼叫的就是 Player 的方法</td><td>型別只決定「能不能呼叫」；跑哪一份，看物件實際是什麼，從它自己開始沿鏈找。</td></tr>
<tr><td>子類別的欄位在父類別建構函式裡已經有值</td><td>要等 super 回來才初始化。在父類別建構函式裡呼叫被覆寫的方法，會讀到 <code>&#117;ndefined</code>。</td></tr>
<tr><td>override 會改變執行時的行為</td><td>它在編譯後就消失了，只是一道檢查：名字存在、型別相容。</td></tr>
<tr><td>寫了 override 而且編譯通過，覆寫就一定型別安全</td><td>方法參數是雙變的，子類別把參數縮窄也會通過，執行時可能默默算錯。</td></tr>
<tr><td>組合永遠比繼承好</td><td>繼承框架的基底類別一層，是正確用法。組合的對手是「很深的鏈」和「為每種組合各寫一個子類別」。</td></tr>
</table>

<h3>十、跟你的工作連起來</h3>
<ul>
<li><b>Cocos Creator</b>：每個腳本都 <code>extends Component</code>，這就是範本方法。初始化放 <code>onLoad</code>／<code>start</code>，不要放建構函式；用不到 <code>update</code> 就別留空殼；不同的行為優先做成另一個元件掛在節點上，而不是再往下繼承。</li>
<li><b>Unity</b>：<code>MonoBehaviour</code> 是同一套思路。C# 預設方法不能覆寫、要寫 <code>virtual</code>／<code>override</code>，比 TypeScript 嚴格，所以從 Unity 轉過來的人要特別小心第四節的洞。</li>
<li><b>Vue 3</b>：Composition API 幾乎不用繼承，邏輯共用靠 composable 函式，本質上就是組合。你在 Vue 學到的「抽出一個 useXxx」，跟第七節的「抽出一個零件」是同一個動作。</li>
<li><b>Node.js 後端</b>：自訂錯誤類別（<code>extends Error</code>）、框架的基底控制器、ORM 的模型基底類別，都是單層繼承的好例子。服務之間則用介面加依賴注入，方便測試時換成假物件。</li>
<li><b>程式碼審查</b>：看到第三層的 <code>extends</code>、看到基底類別建構函式呼叫可覆寫的方法、看到覆寫沒寫 <code>override</code>，都值得留一句意見。</li>
</ul>

<h3>十一、面試會怎麼問</h3>
<p>下面是前端、遊戲、後端面試裡常出現的題目。先自己講一遍（最好出聲講），再打開參考答案。</p>
<ol>
<li>「JavaScript 的 class 跟 Java 的 class 有什麼不同？說說原型鏈怎麼運作。」</li>
<li>「new 一個子類別時，欄位初始化和建構函式本體的執行順序是什麼？為什麼在父類別建構函式裡呼叫可覆寫的方法很危險？」</li>
<li>「override 關鍵字和 noImplicitOverride 解決什麼問題？」</li>
<li>「什麼是脆弱的基底類別問題？你會怎麼避免？」</li>
<li>「什麼時候用繼承、什麼時候用組合？」</li>
<li>「抽象類別和介面要怎麼選？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>JavaScript 的 class 是語法糖：編譯後是一個建構函式加上它的 prototype 物件，方法放在 prototype 上。每個物件有一個 [[Prototype]] 連結；讀不到的屬性會沿著這條鏈往上找，直到 null。extends 把子類別的 prototype 接到父類別的 prototype，同時把子類別函式接到父類別函式，所以 static 也會繼承。寫入不沿鏈，會在物件自己身上建立屬性，遮蔽原型上的同名成員。</li>
<li>先跑子類別建構函式裡 super 之前、不碰 this 的程式碼；super 呼叫時，父類別先初始化自己的欄位、再跑自己的建構函式本體；super 回來後，子類別初始化自己的欄位、再跑其餘的本體。所以父類別建構函式執行時，子類別的欄位還沒有值；如果它呼叫了被子類別覆寫的方法，那個方法會讀到 &#117;ndefined。框架因此把初始化放在 onLoad、start 之類的生命週期方法裡。</li>
<li>override 讓編譯器檢查「父類別真的有這個成員、而且型別相容」，父類別改名或打錯字時立刻報錯，不會默默多出一個新方法。noImplicitOverride 反過來要求每個覆寫都必須標示，讓讀程式的人一眼看出哪些方法換掉了父類別的行為。兩者都只存在於編譯時。</li>
<li>子類別覆寫了基底類別內部會呼叫的方法，就跟基底類別的實作細節綁在一起；基底類別一個看似無害的重構（例如 addMany 改成逐一呼叫 add），就會讓子類別的行為改變而且沒有編譯錯誤。避免方式：基底類別不在內部呼叫可覆寫的公開方法，或把呼叫關係寫成文件；改提供明確的 protected 鉤子；或乾脆用包裝與委派取代繼承。</li>
<li>真正的「是一種」、要接上框架、或基底類別刻意設計成給人繼承（有範本方法和鉤子）時用繼承，而且盡量只有一層。行為有好幾個會獨立變化的維度、需要在執行時更換、或想在測試時替換時，用組合：把每種變化抽成介面，用建構函式注入。繼承是乘法，組合是加法。</li>
<li>介面只描述形狀，執行時不存在、沒有成本，一個類別可以實作很多個，適合描述能力和服務邊界。抽象類別可以帶共用的程式碼、狀態和建構邏輯，可以寫範本方法，但只能繼承一個，而且執行時真的存在，能拿來做 instanceof 或當成 getComponent 的參數。常見做法是兩者並用：對外暴露介面，內部用抽象類別分享實作。</li>
</ol>
</details>

<h3>十二、練功題（做得出來才算真的懂）</h3>
<ol>
<li>不要執行，先預測輸出：
<pre><code>class A {
  x = 1;
  constructor() { console.log('A', this.x); }
}
class B extends A {
  y = 2;
  constructor() {
    super();
    console.log('B', this.x, this.y);
  }
}
new B();</code></pre></li>
<li>基底類別 <code>Enemy</code> 的建構函式呼叫 <code>this.reset()</code>；子類別 <code>Slime</code> 有欄位 <code>maxHp = 30</code>，並覆寫 <code>reset() { this.hp = this.maxHp; }</code>。new 出來之後 <code>hp</code> 是多少？說出原因，並給兩種修法。</li>
<li>畫出 <code>new LoudPlayer('Sam')</code> 的原型鏈。呼叫 <code>sam.toString()</code> 時，要找幾個物件才找到？</li>
<li>有一組類別：<code>WalkingEnemy</code>、<code>FlyingEnemy</code>、<code>ShootingEnemy</code>、<code>FlyingShootingEnemy</code>。用組合重新設計：寫出零件的介面和 <code>Enemy</code> 類別的建構函式。</li>
<li>第四節的 <code>BossOnly</code> 編譯通過但不安全。改寫父類別的宣告，讓 TypeScript 抓到它。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>先印 <code>A 1</code>，再印 <code>B 1 2</code>。A 的欄位在 A 的建構函式本體之前初始化，所以 A 看得到 x；B 的 y 在 super 回來之後才初始化，B 的本體看得到兩個。</li>
<li><code>hp</code> 是 <code>&#117;ndefined</code>：<code>reset</code> 在 Enemy 的建構函式裡執行，那時 Slime 的 <code>maxHp</code> 還沒初始化。修法一：不要在建構函式裡呼叫可覆寫的方法，改由引擎的 <code>onLoad</code> 或你自己的 <code>init()</code> 在建好之後呼叫。修法二：把最大血量當成建構函式參數交給父類別，由父類別自己設定。</li>
<li><code>sam</code> → <code>LoudPlayer.prototype</code> → <code>Player.prototype</code> → <code>Object.prototype</code>（找到）→ null。要找 4 個物件。</li>
<li>例如 <code>interface Mover { move(e: Enemy, dt: number): void }</code>、<code>interface Attack { tryFire(e: Enemy): void }</code>，<code>class Enemy { constructor(private mover: Mover, private attack?: Attack) {} }</code>。走路、飛行是兩種 Mover，射擊是一種 Attack，沒有攻擊就不給。四個子類別變成兩種 Mover 加一種 Attack 的組裝。</li>
<li>把方法宣告改成函式型別的屬性：<code>hit: (target: Unit) =&gt; void = (t) =&gt; { t.hp -= 1; };</code>。在 <code>strictFunctionTypes</code> 之下，屬性的參數是逆變檢查的，子類別把參數縮窄成 Boss 就會報錯。代價是它變成每個實例一份的欄位，失去第二節講的原型共用，所以通常是在介面上這樣宣告，而不是在類別裡。</li>
</ol>
</details>

<h3>十三、想再挖深</h3>
<ul>
<li><b>TypeScript Handbook：Classes</b>（<a href="https://www.typescriptlang.org/docs/handbook/2/classes.html">typescriptlang.org</a>）：官方手冊的類別章節，override、抽象類別、參數屬性、初始化順序都有。</li>
<li><b>MDN：Inheritance and the prototype chain</b>（<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain">developer.mozilla.org</a>）：原型鏈最權威的入門說明。</li>
<li><b>Robert Nystrom《Game Programming Patterns》</b>（<a href="https://gameprogrammingpatterns.com/">gameprogrammingpatterns.com</a>，免費線上版）：Component 和 Update Method 兩章，就是引擎為什麼這樣設計的答案。</li>
<li><b>Joshua Bloch《Effective Java》第三版</b>：Item 18「Favor composition over inheritance」和 Item 19「Design and document for inheritance or else prohibit it」，脆弱基底類別最經典的討論，換成 TypeScript 一樣成立。</li>
<li><b>Gamma 等人《Design Patterns》</b>：Template Method、Decorator 兩個模式的原始出處。</li>
</ul>
` });
