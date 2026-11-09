DEEP({ 'ts-interface': `
<p>上一課說「TypeScript 看的是形狀，不是名字」。這一句話底下藏著一整套規則：兩個形狀之間到底怎麼比？為什麼同一個物件直接寫進去會報錯，先放進變數就沒事？<code>interface</code> 和 <code>type</code> 除了寫法，還有哪些差別真的會咬到你？<code>implements</code> 在執行時留下了什麼？<code>readonly</code> 真的能保護資料嗎？這一章一條一條拆開，最後落到你每天在寫的 Vue props、emits 和引擎元件上。</p>

<h3><span class="badge lv1">基礎</span>一、型別是一群值：「放得進去」的真正意思</h3>
<p>先換一個看型別的角度：<b>一個型別，就是一群值的集合</b>。<code>number</code> 是所有數字組成的集合；<code>'higher' | 'lower'</code> 是只有兩個字串的集合；<code>{ rank: number }</code> 是「所有身上有一個數字型別 rank 的物件」組成的集合，不管它身上還有沒有別的東西。</p>
<p>想像一張徵人啟事：「需要會開車」。會開車又會做菜的人，當然符合；條件只看你「至少」有什麼。如果改成「需要會開車，而且會說英文」，條件變多，符合的人就變少。型別也一樣：<b>要求的屬性越多，這個集合就越小</b>。</p>
<figure class="figure"><svg viewBox="0 0 640 320" class="fg" style="width:100%;max-width:640px" role="img" aria-label="三層集合：最外面是所有的值，中間是有 rank 的物件，最裡面是 rank 和 suit 都有的物件，各層放著幾個例子">
<rect x="10" y="10" width="620" height="300" rx="14" class="fg-b"/>
<text x="28" y="34" class="fg-t">所有的值</text><text x="96" y="34" class="fg-t sm mono">unknown</text>
<rect x="40" y="50" width="560" height="214" rx="12" class="fg-b alt"/>
<text x="56" y="74" class="fg-t alt">HasRank：只要有 rank: number</text>
<rect x="70" y="90" width="340" height="156" rx="10" class="fg-b hot"/>
<text x="86" y="114" class="fg-t acc">CardLike：rank、suit 都要有</text>
<circle cx="94" cy="142" r="5" class="fg-lamp on"/><text x="106" y="146" class="fg-t sm mono">{ rank: 9, suit: 'hearts' }</text>
<circle cx="94" cy="176" r="5" class="fg-lamp on"/><text x="106" y="180" class="fg-t sm mono">{ rank: 3, suit: 'clubs', faceUp: true }</text>
<circle cx="94" cy="210" r="5" class="fg-lamp on"/><text x="106" y="214" class="fg-t sm mono">new Card(5, 'clubs')</text>
<circle cx="434" cy="142" r="5" class="fg-lamp"/><text x="446" y="146" class="fg-t sm mono">{ rank: 9 }</text>
<circle cx="434" cy="176" r="5" class="fg-lamp"/><text x="446" y="180" class="fg-t sm mono">{ rank: 1, id: 7 }</text>
<circle cx="44" cy="288" r="5" class="fg-lamp"/><text x="56" y="292" class="fg-t sm mono">{ value: 3 }</text>
<circle cx="204" cy="288" r="5" class="fg-lamp"/><text x="216" y="292" class="fg-t sm mono">{ rank: '3' }</text>
<circle cx="374" cy="288" r="5" class="fg-lamp"/><text x="386" y="292" class="fg-t sm mono">'hello'</text>
</svg><figcaption>綠框裡的值，也都在藍框裡，所以「CardLike 可以指派給 HasRank」，反過來不行。屬性越多，集合越小；多出來的屬性（faceUp）不會讓值掉出框外。</figcaption></figure>
<p>「A 可以指派給 B」，在集合的語言裡就是「A 這群值，全都在 B 那群裡面」。這個關係叫<b>可指派性</b>（assignability），TypeScript 檢查的幾乎每一件事，最後都歸結到這一個問題。兩個邊界值也值得記住：<code>unknown</code> 是包含一切的最大集合，什麼都放得進去；<code>never</code> 是空集合，什麼值都不是它。後面講到交集衝突，你會看到 <code>never</code> 出現。</p>

<h3><span class="badge lv1">基礎</span>二、結構化與名義：兩個不相干的介面為什麼能互通</h3>
<p>Java、C# 用的是<b>名義型別</b>（nominal typing）：一個類別要寫出「我實作了 X」，才算是 X。TypeScript 用<b>結構化型別</b>（structural typing）：形狀對了就算，誰宣告的、叫什麼名字都不重要。</p>
<pre><code>// 你自己寫的
interface Vec2 { x: number; y: number; }
// 某個函式庫寫的
interface Point { x: number; y: number; }

function length(v: Vec2): number {
  return Math.hypot(v.x, v.y);
}

const p: Point = { x: 3, y: 4 };
console.log(length(p));   // 5：兩個介面互不認識，照樣通</code></pre>
<p>TypeScript 這樣設計，是因為 JavaScript 的物件本來就是這樣被使用的：大部分物件是用 <code>{}</code> 直接寫出來的，或是從 JSON 解析來的，身上沒有任何「我屬於哪個類別」的標記。要是型別系統只認名字，你從伺服器拿到的每一筆資料都得先「轉型」才能用。</p>
<h4>結構化型別會咬人的地方</h4>
<p>形狀一樣、意思不一樣的東西，會被當成同一種。最常見的是各種 ID：</p>
<pre><code>type UserId = string &amp; { readonly __brand: 'UserId' };
type RoomId = string &amp; { readonly __brand: 'RoomId' };

const asUserId = (s: string) =&gt; s as UserId;
function kick(id: UserId): void { console.log(id); }

const room = 'r1' as RoomId;
kick(asUserId('u1'));   // 通過
kick(room);             // 錯誤：RoomId 不是 UserId
kick('u2');             // 錯誤：一般字串也不行</code></pre>
<p>如果兩個都只是 <code>string</code>，把房間 ID 傳給踢人的函式完全不會報錯。這裡的技巧叫<b>品牌型別</b>（branded type）：在型別上交集一個實際上不存在的 <code>__brand</code> 屬性，讓兩者的形狀不同。執行時它們還是普通字串，零成本；唯一的入口是 <code>asUserId</code> 這種函式，你可以在裡面順便驗證格式。</p>
<p>另一個例外：類別裡只要有 <code>private</code> 或 <code>protected</code> 成員，它就變得「半名義」。兩個類別各自宣告了 <code>private code</code>，就算形狀完全一樣，也互相不能指派，因為 TypeScript 要求私有成員必須來自同一個宣告。</p>

<h3><span class="badge lv2">進階</span>三、一條一條追：TypeScript 怎麼比對兩個形狀</h3>
<p>拿一個目標型別，跟五個來源物件逐一比對：</p>
<pre><code>interface CardView {
  rank: number;
  suit: string;
  faceUp?: boolean;
}

const a = { rank: 3, suit: 'clubs' };
const b = { rank: 3, suit: 'clubs', faceUp: 'yes' };
const c = { rank: '3', suit: 'clubs' };
const d = { rank: 3 };
const e = { rank: 3, suit: 'clubs', owner: 'Mia' };

const va: CardView = a;   // 通過：faceUp 可以沒有
const vb: CardView = b;   // 錯誤：faceUp 是 string
const vc: CardView = c;   // 錯誤：rank 是 string
const vd: CardView = d;   // 錯誤：少了 suit
const ve: CardView = e;   // 通過：多一個 owner 沒關係</code></pre>
<p>檢查器做的事，可以畫成一張流程圖。注意它是從<b>目標</b>出發，一個屬性一個屬性去來源身上找，而不是反過來：</p>
<figure class="figure"><svg viewBox="0 0 660 340" class="fg" style="width:100%;max-width:660px" role="img" aria-label="可指派性檢查流程：對目標的每個屬性，檢查來源有沒有、型別放不放得進去，最後如果是新鮮的字面值再做多餘屬性檢查">
<rect x="30" y="16" width="200" height="38" rx="6" class="fg-b alt"/>
<text x="130" y="40" text-anchor="middle" class="fg-t">對目標的每一個屬性 p</text>
<line x1="130" y1="54" x2="130" y2="78" class="fg-l"/><polygon points="130,86 125.5,78 134.5,78" class="fg-a"/>
<rect x="30" y="86" width="200" height="38" rx="6" class="fg-b"/>
<text x="130" y="110" text-anchor="middle" class="fg-t">來源有 p 嗎？</text>
<line x1="230" y1="105" x2="262" y2="105" class="fg-l"/><polygon points="270,105 262,100.5 262,109.5" class="fg-a"/>
<text x="250" y="96" text-anchor="middle" class="fg-t sm">沒有</text>
<rect x="270" y="86" width="180" height="38" rx="6" class="fg-b"/>
<text x="360" y="110" text-anchor="middle" class="fg-t">p 是選擇性的？</text>
<line x1="450" y1="105" x2="472" y2="105" class="fg-l warm"/><polygon points="480,105 472,100.5 472,109.5" class="fg-a warm"/>
<text x="465" y="96" text-anchor="middle" class="fg-t sm warm">不是</text>
<rect x="480" y="86" width="160" height="38" rx="6" class="fg-b warm"/>
<text x="560" y="110" text-anchor="middle" class="fg-t">錯誤：少了 p</text>
<text x="360" y="146" text-anchor="middle" class="fg-t sm">是：跳過，看下一個</text>
<line x1="130" y1="124" x2="130" y2="148" class="fg-l"/><polygon points="130,156 125.5,148 134.5,148" class="fg-a"/>
<text x="140" y="144" class="fg-t sm">有</text>
<rect x="30" y="156" width="200" height="46" rx="6" class="fg-b"/>
<text x="130" y="176" text-anchor="middle" class="fg-t">p 的型別放得進去？</text>
<text x="130" y="194" text-anchor="middle" class="fg-t sm">同一套規則往下遞迴</text>
<line x1="230" y1="179" x2="472" y2="179" class="fg-l warm"/><polygon points="480,179 472,174.5 472,183.5" class="fg-a warm"/>
<text x="355" y="172" text-anchor="middle" class="fg-t sm warm">不行</text>
<rect x="480" y="160" width="160" height="38" rx="6" class="fg-b warm"/>
<text x="560" y="184" text-anchor="middle" class="fg-t">錯誤：型別不符</text>
<line x1="130" y1="202" x2="130" y2="226" class="fg-l on"/><polygon points="130,234 125.5,226 134.5,226" class="fg-a on"/>
<text x="140" y="222" class="fg-t sm acc">每個 p 都可以</text>
<rect x="30" y="234" width="200" height="38" rx="6" class="fg-b"/>
<text x="130" y="258" text-anchor="middle" class="fg-t">來源是新鮮的字面值？</text>
<line x1="230" y1="253" x2="472" y2="253" class="fg-l alt"/><polygon points="480,253 472,248.5 472,257.5" class="fg-a alt"/>
<text x="355" y="246" text-anchor="middle" class="fg-t sm alt">是</text>
<rect x="480" y="234" width="160" height="38" rx="6" class="fg-b alt"/>
<text x="560" y="258" text-anchor="middle" class="fg-t">再查多餘屬性</text>
<line x1="130" y1="272" x2="130" y2="294" class="fg-l on"/><polygon points="130,302 125.5,294 134.5,294" class="fg-a on"/>
<text x="140" y="290" class="fg-t sm acc">不是</text>
<rect x="30" y="302" width="200" height="32" rx="6" class="fg-b hot"/>
<text x="130" y="323" text-anchor="middle" class="fg-t acc">通過</text>
</svg><figcaption>結構檢查只問「目標要的，來源有沒有」。來源多出來的東西，只有在它是「剛寫出來的物件字面值」時，才會被另外那道檢查（第四節）抓出來。</figcaption></figure>
<p>把規則講完整，還有幾條：</p>
<ul>
<li><b>巢狀物件用同一套規則遞迴。</b><code>{ owner: { name: string } }</code> 會再往下比 <code>owner</code> 的每一個屬性。</li>
<li><b>來源是選擇性、目標是必填，不行。</b><code>{ faceUp?: boolean }</code> 放不進 <code>{ faceUp: boolean }</code>，因為前者可能根本沒有。</li>
<li><b>readonly 不參加比對。</b>這是一個洞，第九節會看到它的後果。</li>
<li><b>函式和方法</b>：回傳型別要放得進去；參數的規則比較複雜，用方法語法宣告的參數是雙變的，寫成函式型別的屬性才會嚴格檢查。繼承那一章的 override 一節講過這個洞，泛型那一章會用「變異性」把它講透。</li>
</ul>

<h3><span class="badge lv2">進階</span>四、多餘屬性檢查：只對「剛寫出來」的物件嚴格</h3>
<p>照第一節的集合觀念，多出屬性本來不該是錯。那為什麼直接寫 <code>{ rank: 3, colour: 'red' }</code> 會報錯？因為 TypeScript 在結構檢查之外，對<b>新鮮的物件字面值</b>（fresh object literal）多加了一道<b>多餘屬性檢查</b>（excess property checking）。理由很實際：你親手寫在型別旁邊的屬性，型別卻不認得，八成是打錯字。</p>
<p>「新鮮」的意思是：這個物件字面值直接出現在需要某個型別的位置（變數宣告、函式參數、回傳值）。一旦它先被放進一個沒有標型別的變數，就不新鮮了，這道檢查也就不做了。看看這會造成什麼差別：</p>
<pre><code>interface Opts {
  faceUp?: boolean;
  speed?: number;
}
function deal(o: Opts): void { console.log(o.faceUp); }

deal({ faceup: true, speed: 2 });  // 錯誤 TS2561

const tmp = { faceup: true, speed: 2 };
deal(tmp);                     // 通過，印出 &#117;ndefined

const lone = { faceup: true };
deal(lone);                    // 錯誤 TS2559</code></pre>
<figure class="figure"><svg viewBox="0 0 660 290" class="fg" style="width:100%;max-width:660px" role="img" aria-label="同一個打錯字的物件：直接寫字面值會經過多餘屬性檢查而被抓到；先放進變數就只做結構檢查，打錯的屬性被默默忽略">
<line x1="330" y1="10" x2="330" y2="280" class="fg-l dim dash"/>
<rect x="20" y="16" width="290" height="50" rx="6" class="fg-b"/>
<text x="34" y="46" class="fg-t sm mono">deal({ faceup: true, speed: 2 });</text>
<rect x="350" y="16" width="290" height="50" rx="6" class="fg-b"/>
<text x="364" y="37" class="fg-t sm mono">const tmp = { faceup: true, speed: 2 };</text>
<text x="364" y="55" class="fg-t sm mono">deal(tmp);</text>
<line x1="165" y1="66" x2="165" y2="88" class="fg-l"/><polygon points="165,96 160.5,88 169.5,88" class="fg-a"/>
<line x1="495" y1="66" x2="495" y2="88" class="fg-l"/><polygon points="495,96 490.5,88 499.5,88" class="fg-a"/>
<rect x="20" y="96" width="290" height="38" rx="6" class="fg-b alt"/>
<text x="165" y="120" text-anchor="middle" class="fg-t">新鮮的物件字面值</text>
<rect x="350" y="96" width="290" height="38" rx="6" class="fg-b alt"/>
<text x="495" y="120" text-anchor="middle" class="fg-t">已經放進變數，不新鮮了</text>
<line x1="165" y1="134" x2="165" y2="156" class="fg-l"/><polygon points="165,164 160.5,156 169.5,156" class="fg-a"/>
<line x1="495" y1="134" x2="495" y2="156" class="fg-l"/><polygon points="495,164 490.5,156 499.5,156" class="fg-a"/>
<rect x="20" y="164" width="290" height="38" rx="6" class="fg-b"/>
<text x="165" y="188" text-anchor="middle" class="fg-t">結構檢查 ＋ 多餘屬性檢查</text>
<rect x="350" y="164" width="290" height="38" rx="6" class="fg-b"/>
<text x="495" y="188" text-anchor="middle" class="fg-t">只做結構檢查</text>
<line x1="165" y1="202" x2="165" y2="224" class="fg-l on"/><polygon points="165,232 160.5,224 169.5,224" class="fg-a on"/>
<line x1="495" y1="202" x2="495" y2="224" class="fg-l warm"/><polygon points="495,232 490.5,224 499.5,224" class="fg-a warm"/>
<rect x="20" y="232" width="290" height="46" rx="6" class="fg-b hot"/>
<text x="165" y="252" text-anchor="middle" class="fg-t acc">錯誤 TS2561</text>
<text x="165" y="269" text-anchor="middle" class="fg-t sm">打錯字當場被抓到</text>
<rect x="350" y="232" width="290" height="46" rx="6" class="fg-b warm"/>
<text x="495" y="252" text-anchor="middle" class="fg-t warm">通過</text>
<text x="495" y="269" text-anchor="middle" class="fg-t sm">faceup 被默默忽略，faceUp 是 &#117;ndefined</text>
</svg><figcaption>同一個打錯字的物件，換一條路進來，結果就不一樣。右邊因為 speed 對得上，結構檢查通過；faceUp 是選擇性的，少了也不算錯。</figcaption></figure>
<p>第一個呼叫的錯誤訊息還會問你「Did you mean to write 'faceUp'?」。第三個呼叫又被抓到了，是另一條規則：<b>弱型別偵測</b>（weak type detection）。所有屬性都是選擇性的型別叫「弱型別」，什麼物件都能符合它。為了不讓它變成垃圾桶，TypeScript 規定：來源跟弱型別<b>一個共同屬性都沒有</b>時，就算經過變數也報錯。</p>
<h4>幾個實務細節</h4>
<ul>
<li><b>聯集</b>：目標是聯集時，多餘屬性只要存在於其中任何一個成員就不算多餘。但如果聯集有一個共同的標籤欄位（例如 <code>kind: 'a' | 'b'</code>，叫可辨識聯集），TypeScript 會先用標籤找到對應的那一個成員，再用它來檢查。</li>
<li><b>索引簽章</b>：目標有 <code>[key: string]: ...</code> 時，任何鍵都合法，這道檢查等於關掉。</li>
<li><b>不要用 as 來「修」這個錯誤。</b><code>{ faceup: true } as Opts</code> 會通過，因為型別斷言把多餘屬性檢查和弱型別偵測一起關掉了。想要「檢查形狀，但保留推斷出來的型別」，用 TypeScript 4.9 的 <code>satisfies</code>：<code>const cfg = { faceUp: true } satisfies Opts</code>，打錯字照樣會被抓。</li>
</ul>

<h3><span class="badge lv2">進階</span>五、interface 和 type：真正會影響你的差別</h3>
<p>上一課那張表講了寫法上的差別。實際寫專案時，真正會影響結果的是下面幾件：</p>
<table>
<tr><th>差別</th><th><code>interface</code></th><th><code>type</code></th></tr>
<tr><td>同名宣告</td><td>自動合併</td><td>重複宣告，報錯</td></tr>
<tr><td>聯集、映射型別、條件型別</td><td>做不到</td><td>都可以</td></tr>
<tr><td>擴充時屬性衝突</td><td><code>extends</code> 當場報錯</td><td><code>&amp;</code> 默默變成 <code>never</code></td></tr>
<tr><td>能不能放進 <code>Record&lt;string, unknown&gt;</code></td><td>不行（沒有隱含的索引簽章）</td><td>可以</td></tr>
<tr><td>錯誤訊息裡的顯示</td><td>顯示名字</td><td>有時會被展開成一大串</td></tr>
<tr><td>大型專案的檢查速度</td><td>關係會被快取，通常較快</td><td>大量交集時較慢</td></tr>
</table>
<h4>extends 和 &amp; 遇到衝突時，行為不同</h4>
<pre><code>interface A1 { id: string; }
interface B1 extends A1 { id: number; }  // 錯誤 TS2430

type C1 = { id: string } &amp; { id: number };
declare const c1: C1;
const id: never = c1.id;   // 通過：id 是 never</code></pre>
<figure class="figure"><svg viewBox="0 0 660 200" class="fg" style="width:100%;max-width:660px" role="img" aria-label="interface extends 遇到屬性衝突會在宣告處報錯；交集型別遇到衝突會讓屬性變成 never，到使用時才出問題">
<line x1="330" y1="10" x2="330" y2="164" class="fg-l dim dash"/>
<text x="165" y="26" text-anchor="middle" class="fg-t lg">interface extends</text>
<text x="495" y="26" text-anchor="middle" class="fg-t lg">交集 &amp;</text>
<rect x="20" y="40" width="290" height="44" rx="6" class="fg-b"/>
<text x="34" y="59" class="fg-t sm mono">A1 { id: string }</text>
<text x="34" y="76" class="fg-t sm mono">B1 extends A1 { id: number }</text>
<rect x="350" y="40" width="290" height="44" rx="6" class="fg-b"/>
<text x="364" y="59" class="fg-t sm mono">{ id: string }</text>
<text x="364" y="76" class="fg-t sm mono">&amp; { id: number }</text>
<line x1="165" y1="84" x2="165" y2="106" class="fg-l on"/><polygon points="165,114 160.5,106 169.5,106" class="fg-a on"/>
<line x1="495" y1="84" x2="495" y2="106" class="fg-l warm"/><polygon points="495,114 490.5,106 499.5,106" class="fg-a warm"/>
<rect x="20" y="114" width="290" height="46" rx="6" class="fg-b hot"/>
<text x="165" y="134" text-anchor="middle" class="fg-t acc">在宣告那一行報錯</text>
<text x="165" y="151" text-anchor="middle" class="fg-t sm">TS2430：衝突當場現形</text>
<rect x="350" y="114" width="290" height="46" rx="6" class="fg-b warm"/>
<text x="495" y="134" text-anchor="middle" class="fg-t warm">宣告通過，id 變 never</text>
<text x="495" y="151" text-anchor="middle" class="fg-t sm">等到有人想給它值才出錯</text>
<text x="330" y="184" text-anchor="middle" class="fg-t sm">string 和 number 沒有共同的值，兩個集合的交集是空集合</text>
</svg><figcaption>交集就是第一節說的「兩個集合重疊的部分」。id 同時要是字串又要是數字，這樣的值不存在，所以是 never。interface 則把這種衝突當成錯誤，提早告訴你。</figcaption></figure>
<h4>沒有隱含的索引簽章</h4>
<pre><code>interface Score { points: number; }
type ScoreT = { points: number };
declare const s1: Score;
declare const s2: ScoreT;

const r1: Record&lt;string, unknown&gt; = s1;  // 錯誤 TS2322
const r2: Record&lt;string, unknown&gt; = s2;  // 通過</code></pre>
<p>錯誤訊息是「Index signature for type 'string' is missing in type 'Score'」。原因是介面可以被宣告合併，別的檔案隨時可能幫 <code>Score</code> 加一個屬性，所以 TypeScript 不敢保證「它的每一個鍵都是 unknown 能接受的」。型別別名不能再被打開，就沒有這個顧慮。你最常在泛型的條件約束上撞到它：一個要求 <code>E extends Record&lt;string, unknown[]&gt;</code> 的事件系統，餵 type 可以，餵 interface 會報錯。泛型那一章會給出兩全的寫法。</p>
<h4>宣告合併：好用，也危險</h4>
<p>好的一面是<b>模組擴充</b>（module augmentation）。Vue 讓你幫每個元件實例加上全域屬性的型別，就是靠合併它的介面：</p>
<pre><code>declare module 'vue' {
  interface ComponentCustomProperties {
    $formatScore: (n: number) =&gt; string;
  }
}
export {};</code></pre>
<p>Vue 官方文件特別提醒：這個檔案必須是一個模組，至少要有一個頂層的 import 或 export，哪怕只是 <code>export {}</code>，否則它會變成「宣告一個新模組」而不是擴充。</p>
<p>危險的一面：在一個<b>不是模組</b>的檔案（沒有任何 import／export）裡寫 <code>interface Node { hp: number }</code>，它會跟 DOM 內建的全域 <code>Node</code> 介面合併。從此 TypeScript 相信瀏覽器裡每一個 DOM 節點都有 <code>hp</code>，<code>document.body.hp</code> 也不會報錯。遊戲程式最容易取這種名字：<code>Node</code>、<code>Event</code>、<code>Animation</code>、<code>Text</code> 在 DOM 裡全都有。只要檔案裡有 import 或 export，它就是模組，不會發生這件事。</p>
<h4>效能</h4>
<p>TypeScript 團隊在 GitHub wiki 的〈Performance〉頁面裡建議：大量組合形狀時，用 <code>interface ... extends</code> 取代一長串的 <code>&amp;</code>。介面會被整理成一個扁平的物件型別，它跟其他型別的關係也會被快取；交集則常常要重新展開、重新比對。小專案感覺不到，幾十萬行的專案裡，這會反映在編輯器的反應速度上。要量的話，用 <code>tsc --extendedDiagnostics</code> 看檢查時間，用 <code>tsc --generateTrace</code> 找出最慢的檔案。</p>

<h3><span class="badge lv3">專業</span>六、implements：一份只在編譯時存在的合約</h3>
<p>上一課說 <code>implements</code> 只是一道檢查。仔細看，它比你想的還要「少」：</p>
<pre><code>interface Clickable {
  onClick(e: MouseEvent): void;
}

class Btn implements Clickable {
  onClick(e) {             // 錯誤 TS7006：e 隱含 any
    console.log(e);
  }
}</code></pre>
<p><code>implements</code> 不會把介面的參數型別「借」給類別。類別的方法依然要自己寫完整的型別，<code>implements</code> 只在最後比一次。它也不會改變類別的型別：一個類別就算沒寫 <code>implements Clickable</code>，只要形狀對，照樣能傳給要 <code>Clickable</code> 的函式（結構化型別）。那它的價值在哪？<b>錯誤出現的位置</b>。沒寫的話，形狀不對要等到某個地方「使用」這個類別時才報錯，可能在另一個檔案；寫了，錯誤就落在類別宣告那一行，修的人一看就懂。</p>
<p>還有一個細節：<code>implements</code> 只檢查<b>實例那一側</b>。建構函式的參數、<code>static</code> 成員都不在檢查範圍內。真的要描述「一個能被 new 出來的東西」，要另外寫建構簽章：<code>interface PlayerMaker { new (name: string): Player }</code>。</p>
<h4>執行時，介面一個位元都不剩</h4>
<figure class="figure"><svg viewBox="0 0 660 270" class="fg" style="width:100%;max-width:660px" role="img" aria-label="編譯時 .ts 檔裡有介面與 implements，編譯後的 .js 只剩類別與函式；執行時從伺服器來的 JSON 只會遇到型別守衛函式">
<line x1="330" y1="10" x2="330" y2="260" class="fg-l dim dash"/>
<text x="165" y="24" text-anchor="middle" class="fg-t lg">編譯時</text>
<text x="495" y="24" text-anchor="middle" class="fg-t lg">執行時</text>
<rect x="20" y="38" width="290" height="80" rx="6" class="fg-b alt"/>
<text x="34" y="58" class="fg-t sm">.ts 原始碼</text>
<text x="34" y="76" class="fg-t sm mono">interface HighScore {…}</text>
<text x="34" y="93" class="fg-t sm mono">class Board implements …</text>
<text x="34" y="110" class="fg-t sm mono">function isHighScore(x) {…}</text>
<line x1="165" y1="118" x2="165" y2="150" class="fg-l"/><polygon points="165,158 160.5,150 169.5,150" class="fg-a"/>
<text x="175" y="140" class="fg-t sm">編譯：型別全部擦掉</text>
<rect x="20" y="158" width="290" height="64" rx="6" class="fg-b"/>
<text x="34" y="178" class="fg-t sm">.js 輸出</text>
<text x="34" y="196" class="fg-t sm mono">class Board {…}</text>
<text x="34" y="213" class="fg-t sm mono">function isHighScore(x) {…}</text>
<rect x="350" y="38" width="290" height="48" rx="6" class="fg-b warm"/>
<text x="364" y="58" class="fg-t sm">伺服器回傳的 JSON</text>
<text x="364" y="76" class="fg-t sm mono">{ name: 'Mia', points: '12' }</text>
<line x1="495" y1="86" x2="495" y2="110" class="fg-l"/><polygon points="495,118 490.5,110 499.5,110" class="fg-a"/>
<rect x="350" y="118" width="290" height="46" rx="6" class="fg-b hot"/>
<text x="495" y="138" text-anchor="middle" class="fg-t mono">isHighScore(data)</text>
<text x="495" y="155" text-anchor="middle" class="fg-t sm">唯一還在場的檢查</text>
<line x1="495" y1="164" x2="495" y2="188" class="fg-l warm"/><polygon points="495,196 490.5,188 499.5,188" class="fg-a warm"/>
<rect x="350" y="196" width="290" height="46" rx="6" class="fg-b"/>
<text x="495" y="216" text-anchor="middle" class="fg-t">points 是字串 → false</text>
<text x="495" y="233" text-anchor="middle" class="fg-t sm">丟錯誤，壞資料進不了遊戲</text>
<path d="M310 190 H320 V141 H342" class="fg-l dash"/><polygon points="350,141 342,136.5 342,145.5" class="fg-a"/>
</svg><figcaption>左邊的介面在編譯後完全消失，留下來的只有你自己寫的函式。從網路進來的資料只會遇到右邊那一關，所以那一關必須是真正會執行的程式碼。</figcaption></figure>
<p>所以「從外面來的資料符合介面」這件事，TypeScript 從頭到尾沒有檢查過。<code>res.json()</code> 的型別是 <code>any</code>，你把它標成 <code>HighScore[]</code>，只是在對編譯器許願。要真的檢查，就寫一個<b>型別守衛</b>（type guard）：一個回傳 <code>x is HighScore</code> 的函式，在執行時檢查，同時告訴 TypeScript 檢查過了。</p>
<pre><code>interface HighScore { name: string; points: number; }

function isHighScore(x: unknown): x is HighScore {
  if (typeof x !== 'object' || x === null) return false;
  const o = x as Record&lt;string, unknown&gt;;
  return typeof o.name === 'string'
    &amp;&amp; typeof o.points === 'number';
}

async function loadScores(): Promise&lt;HighScore[]&gt; {
  const res = await fetch('/api/scores');
  const data: unknown = await res.json();
  if (!Array.isArray(data) || !data.every(isHighScore)) {
    throw new Error('高分榜格式不對');
  }
  return data;
}</code></pre>
<p>欄位一多，手寫守衛很累，業界常用 zod 這類函式庫：寫一份 schema，同時得到執行時的檢查函式和 TypeScript 型別，兩邊永遠不會不同步。重點是觀念：<b>信任邊界上的資料，一定要有會執行的檢查</b>。這不只是防 bug，也是資安：被竄改過的請求、版本不一致的舊用戶端，送來的都是「型別說不可能」的資料。</p>

<h3><span class="badge lv3">專業</span>七、索引簽章：鍵不固定的物件</h3>
<p>排行榜用玩家名字當鍵，事先不知道有哪些名字。這時用<b>索引簽章</b>（index signature）：</p>
<pre><code>interface ScoreBoard {
  [player: string]: number;
}
const board: ScoreBoard = { mia: 3, sam: 5 };
board['nobody'].toFixed(1);   // 編譯通過，執行時當掉

interface Mixed {
  [key: string]: number;
  name: string;               // 錯誤 TS2411
}</code></pre>
<p>第一個陷阱：讀 <code>board['nobody']</code>，TypeScript 給你的型別是 <code>number</code>，不是 <code>number | &#117;ndefined</code>，因為索引簽章的意思是「任何鍵都有一個 number」。執行時那個鍵不存在，拿到 <code>&#117;ndefined</code>，<code>.toFixed</code> 就當掉。在 tsconfig 開 <code>noUncheckedIndexedAccess</code>，讀索引簽章就會多帶一個 <code>| &#117;ndefined</code>，逼你先檢查。它不在 <code>strict</code> 裡面，要另外開；新專案強烈建議開。</p>
<p>第二個規則：有了字串索引簽章，每一個具名屬性也必須符合它的型別，所以 <code>name: string</code> 跟 <code>number</code> 衝突。要混用，就把索引簽章的型別放寬成 <code>number | string</code>，或者把動態的部分搬進一個獨立的欄位（例如 <code>scores: Record&lt;string, number&gt;</code>），後者通常比較好。</p>
<p>TypeScript 4.4 之後，索引簽章的鍵也可以是樣板字串型別，例如 <code>[key: \`data-\${string}\`]: string</code>，只接受 data- 開頭的鍵，很適合描述 HTML 的 data 屬性。</p>
<h4>拿一般物件當字典的坑</h4>
<pre><code>const counts: Record&lt;string, number&gt; = {};
for (const w of ['ace', 'constructor']) {
  counts[w] = (counts[w] ?? 0) + 1;
}
console.log(counts['constructor']);
// 不是 1，是一串 "function Object() { [native code] }1"</code></pre>
<p>繼承那一章講過原型鏈：一般物件會繼承 <code>Object.prototype</code>，所以 <code>constructor</code>、<code>toString</code> 這些鍵「本來就有值」，TypeScript 完全看不出來。鍵來自使用者輸入（玩家名字、聊天室的字）時，請用 <code>Map&lt;string, number&gt;</code>，或用 <code>Object.create(null)</code> 建立沒有原型的物件。更嚴重的版本叫<b>原型污染</b>（prototype pollution）：把使用者送來的 JSON 遞迴合併進物件時，<code>__proto__</code> 這個鍵會讓攻擊者改到 <code>Object.prototype</code>，影響整個行程裡的每一個物件。lodash 等常用函式庫都修過這類漏洞。</p>

<h3><span class="badge lv3">專業</span>八、Vue props／emits 與引擎元件的型別</h3>
<h4>defineProps 的型別怎麼變成執行時的 props</h4>
<pre><code>&lt;script setup lang="ts"&gt;
import { computed } from 'vue';

interface Props {
  rank: number;
  suit: string;
  faceUp?: boolean;
}
const props = withDefaults(defineProps&lt;Props&gt;(), {
  faceUp: false,
});
const emit = defineEmits&lt;{
  guess: [choice: 'higher' | 'lower'];
  reset: [];
}&gt;();

const label = computed(() =&gt; props.suit + props.rank);
props.rank = 3;          // 錯誤 TS2540：props 是唯讀的
emit('guess', 'higher');
emit('guess', 'same');   // 錯誤：只能是 higher 或 lower
&lt;/script&gt;</code></pre>
<figure class="figure"><svg viewBox="0 0 660 270" class="fg" style="width:100%;max-width:660px" role="img" aria-label="Vue SFC 編譯器把 Props 介面展開成執行時的 props 設定；同一個介面也被編輯器拿去檢查父元件的模板">
<rect x="20" y="20" width="230" height="130" rx="6" class="fg-b alt"/>
<text x="34" y="40" class="fg-t sm">你寫的型別</text>
<text x="34" y="62" class="fg-t sm mono">interface Props {</text>
<text x="47" y="80" class="fg-t sm mono">rank: number;</text>
<text x="47" y="98" class="fg-t sm mono">faceUp?: boolean;</text>
<text x="34" y="116" class="fg-t sm mono">}</text>
<text x="34" y="136" class="fg-t sm mono">defineProps&lt;Props&gt;()</text>
<line x1="250" y1="85" x2="322" y2="85" class="fg-l on"/><polygon points="330,85 322,80.5 322,89.5" class="fg-a on"/>
<text x="290" y="76" text-anchor="middle" class="fg-t sm acc">SFC 編譯</text>
<rect x="330" y="20" width="310" height="130" rx="6" class="fg-b"/>
<text x="344" y="40" class="fg-t sm">產生的執行時設定</text>
<text x="344" y="62" class="fg-t sm mono">props: {</text>
<text x="357" y="80" class="fg-t sm mono">rank: { type: Number, required: true },</text>
<text x="357" y="98" class="fg-t sm mono">faceUp: { type: Boolean,</text>
<text x="423" y="116" class="fg-t sm mono">required: false },</text>
<text x="344" y="136" class="fg-t sm mono">}</text>
<line x1="135" y1="150" x2="135" y2="182" class="fg-l"/><polygon points="135,190 130.5,182 139.5,182" class="fg-a"/>
<text x="145" y="174" class="fg-t sm">編輯器、vue-tsc 拿去用</text>
<line x1="485" y1="150" x2="485" y2="182" class="fg-l"/><polygon points="485,190 480.5,182 489.5,182" class="fg-a"/>
<text x="495" y="174" class="fg-t sm">瀏覽器裡的 Vue 拿去用</text>
<rect x="20" y="190" width="290" height="56" rx="6" class="fg-b warm"/>
<text x="34" y="212" class="fg-t sm mono">&lt;PlayingCard rank="5" /&gt;</text>
<text x="34" y="234" class="fg-t sm">型別錯誤："5" 是字串，不是數字</text>
<rect x="330" y="190" width="310" height="56" rx="6" class="fg-b hot"/>
<text x="344" y="212" class="fg-t sm">父元件沒傳 faceUp</text>
<text x="344" y="234" class="fg-t sm">執行時拿到 false，不是 &#117;ndefined</text>
</svg><figcaption>同一份 Props 介面被用了兩次：編譯器把它翻成執行時的 props 設定，編輯器和 vue-tsc 拿它檢查父元件的模板。介面本身仍然不會出現在瀏覽器裡。</figcaption></figure>
<p><code>defineProps</code> 是編譯器巨集，不是普通函式。Vue 的 SFC 編譯器讀你的型別，產生執行時的 props 設定，所以有幾件事要知道：</p>
<ul>
<li><b>型別必須讓編譯器「看得懂」。</b>Vue 3.3 起可以用 import 進來的型別，但轉換仍是照語法樹分析，不是跑完整的型別檢查。Vue 官方文件寫得很清楚：單一個 prop 的型別可以是條件型別，整個 props 物件不行。</li>
<li><b>布林轉換</b>（boolean casting）：型別是 <code>boolean</code> 的 prop 沒傳時，Vue 給的是 <code>false</code>，不是 <code>&#117;ndefined</code>。這是 Vue 的執行時規則，型別上看不出來。</li>
<li><b>props 是唯讀的。</b>型別上是 readonly（TS2540），開發模式下執行時也會警告。要改，就 emit 給父元件，或複製一份到自己的 ref。</li>
<li><b>emits 的型別用具名元組</b>（Vue 3.3 起的簡寫）：<code>guess: [choice: 'higher' | 'lower']</code>。父元件寫 <code>@guess="onGuess"</code> 時，<code>onGuess</code> 的參數型別也會被檢查。</li>
</ul>
<h4>引擎元件：介面不能拿來找元件</h4>
<p>遊戲裡常想說「找出這個節點上任何可以被打的東西」。很自然會寫一個 <code>interface Damageable</code>，然後……卡住了：Cocos Creator 的 <code>getComponent</code> 要的是一個執行時存在的類別，而介面在執行時根本不存在。Unity 的 C# 可以寫 <code>GetComponent&lt;IDamageable&gt;()</code>，那是因為 C# 的介面執行時還在，這是從 Unity 轉過來的人最常撞到的差別。</p>
<p>TypeScript 這邊的解法，是用<b>抽象類別</b>當那個「執行時的記號」。Cocos 3.8 的宣告檔裡，<code>getComponent</code> 接受的參數型別包含 <code>abstract new (...args: any[]) =&gt; T</code>，也就是抽象類別也能傳。用一個迷你版本示範：</p>
<pre><code>type Ctor&lt;T&gt; = abstract new (...args: any[]) =&gt; T;

abstract class Component { enabled = true; }
abstract class Damageable extends Component {
  abstract takeDamage(n: number): void;
}
class Crate extends Damageable {
  hp = 3;
  override takeDamage(n: number): void { this.hp -= n; }
}

function find&lt;T extends Component&gt;(
  list: Component[],
  type: Ctor&lt;T&gt;,
): T | null {
  for (const c of list) {
    if (c instanceof type) return c as T;
  }
  return null;
}

const target = find([new Crate()], Damageable);
target?.takeDamage(1);</code></pre>
<p>如果那些類別不能共用一個基底（例如有的已經繼承了別的元件），退而求其次：逐一檢查元件身上有沒有 <code>takeDamage</code> 這個函式，寫成第六節那種型別守衛。</p>

<h3><span class="badge lv4">專家</span>九、readonly 不等於不可變</h3>
<p><code>readonly</code> 給人一種「這份資料安全了」的感覺。它其實有三個限制：</p>
<pre><code>interface Config { volume: number; }
const frozen: Readonly&lt;Config&gt; = { volume: 1 };
const loose: Config = frozen;   // 通過！
loose.volume = 2;               // frozen 也被改了

const ra: readonly number[] = [1, 2];
const ma: number[] = ra;        // 錯誤 TS4104

const settings = Object.freeze({ volume: 1, keys: ['a'] });
settings.volume = 2;            // 錯誤：凍結了
settings.keys.push('b');        // 通過：只凍一層</code></pre>
<ol>
<li><b>只在編譯時。</b>編譯後的 JavaScript 裡沒有 readonly，任何拿到物件的程式碼都能改它。</li>
<li><b>能被別名繞過。</b>物件的 readonly 屬性不參加可指派性比對，所以把它指派給一個沒有 readonly 的型別，就能改了。唯讀陣列（<code>readonly T[]</code>）是例外，它真的擋得住，因為它的型別上根本沒有 <code>push</code> 這些方法。</li>
<li><b>只管一層。</b><code>Readonly&lt;T&gt;</code> 只把第一層屬性變唯讀，裡面的陣列和物件照樣能改。<code>Object.freeze</code> 在執行時也只凍結一層。</li>
</ol>
<table>
<tr><th>工具</th><th>什麼時候生效</th><th>深度</th><th>能不能繞過</th></tr>
<tr><td><code>readonly</code>、<code>Readonly&lt;T&gt;</code></td><td>只有編譯時</td><td>一層</td><td>指派給非唯讀型別就繞過</td></tr>
<tr><td><code>as const</code></td><td>只有編譯時</td><td>整棵（字面值）</td><td>同上</td></tr>
<tr><td><code>Object.freeze</code></td><td>執行時（嚴格模式下改它會丟錯誤）</td><td>一層</td><td>繞不過，但裡層沒凍</td></tr>
<tr><td>Vue 的 <code>readonly()</code></td><td>執行時（Proxy）＋型別</td><td>整棵</td><td>拿得到原本的物件就繞過</td></tr>
</table>
<p>實務上的用法：<code>readonly</code> 用來<b>表達意圖、擋住手滑</b>，例如函式參數寫 <code>readonly Card[]</code>，告訴呼叫者「我不會改你的陣列」。真正需要保證的資料（設定檔、從伺服器來的權威狀態），靠的是設計：只讓一個地方擁有可以修改的那一份，其他地方拿到的是複本或唯讀的 view。Pinia、Redux 這類狀態管理工具，就是把「誰能改」集中到一處。</p>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>多一個屬性就不符合介面</td><td>結構檢查只看「至少有」。會報錯，是因為新鮮字面值另外多了一道多餘屬性檢查。</td></tr>
<tr><td>把資料標成某個介面，資料就被檢查過了</td><td>介面在執行時不存在。網路、檔案、localStorage 來的資料，要有會執行的型別守衛或 schema 檢查。</td></tr>
<tr><td>interface 和 type 只是風格問題</td><td>宣告合併、衝突時的行為、隱含索引簽章、檢查效能，都有實際差別。</td></tr>
<tr><td>implements 會讓類別拿到介面的型別</td><td>它不推斷任何參數型別，也不改變類別的型別，只在宣告處多比一次。</td></tr>
<tr><td>readonly 的資料不會被改</td><td>只在編譯時、只有一層，而且指派給非唯讀型別就能改。</td></tr>
<tr><td>用 as 修掉錯誤就好</td><td>as 會關掉多餘屬性檢查和弱型別偵測。想要檢查又保留推斷結果，用 satisfies。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>Vue 3</b>：props、emits、Pinia 的 state、API 回應，全都是介面。API 層的回應一進來就過一次守衛或 schema；元件之間傳的就放心用型別。全域屬性用模組擴充，記得檔案裡要有 <code>export {}</code>。</li>
<li><b>Cocos Creator</b>：「能力」型的共用（可被打、可被撿起）用抽象類別當 <code>getComponent</code> 的記號；純資料（關卡設定、存檔格式）用介面。自己的類別別取 <code>Node</code>、<code>Event</code> 這種跟 DOM 撞名的名字，或確保檔案是模組。</li>
<li><b>Node.js 後端</b>：每一個 HTTP handler 的請求內容都是 <code>unknown</code>，先驗證再用。ID 類的欄位考慮用品牌型別，避免把訂單 ID 傳成使用者 ID。</li>
<li><b>tsconfig</b>：新專案開 <code>noUncheckedIndexedAccess</code>；大型專案用 <code>--extendedDiagnostics</code> 定期看檢查時間。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<ol>
<li>「什麼是結構化型別？跟 Java、C# 的名義型別差在哪？它會造成什麼問題，怎麼補？」</li>
<li>「為什麼把多一個屬性的物件直接傳進函式會報錯，先放進變數再傳就不會？」</li>
<li>「interface 和 type alias 怎麼選？說出至少三個實際的差別。」</li>
<li>「implements 在執行時做了什麼？你怎麼確保伺服器回傳的資料真的符合介面？」</li>
<li>「readonly 和 Object.freeze 差在哪？readonly 能保證資料不被改嗎？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>結構化型別只比較形狀：目標要求的每個成員，來源都有、型別也相容，就可以指派，不管名字和宣告的地方。名義型別則要求明確宣告關係。TypeScript 這樣做是因為 JavaScript 的物件大多是字面值或 JSON，沒有類別標記。問題是形狀相同、意義不同的東西會被混用，例如兩種 ID 都是 string；可以用品牌型別（交集一個不存在的標記屬性）讓它們不相容。類別的 private、protected 成員也會讓比較變成半名義。</li>
<li>直接寫在需要某型別位置上的物件字面值是「新鮮的」，TypeScript 除了結構檢查，還會做多餘屬性檢查，因為那很可能是打錯字。放進變數後就不新鮮了，只做結構檢查，多出的屬性被允許。例外是弱型別偵測：目標所有屬性都是選擇性時，來源若一個共同屬性都沒有，經過變數也會報錯。要檢查又保留推斷型別，可以用 satisfies，不要用 as。</li>
<li>描述物件形狀時兩者大致可換。差別：interface 可以宣告合併，可用於模組擴充，type 不行；聯集、映射型別、條件型別只能用 type；interface extends 遇到屬性衝突會當場報錯，交集會默默變成 never；interface 沒有隱含索引簽章，不能指派給 Record&lt;string, unknown&gt;；大量組合時 interface 的關係會被快取，檢查較快，錯誤訊息也比較好讀。常見做法是物件用 interface，其餘用 type。</li>
<li>執行時什麼都沒做，介面和 implements 編譯後都消失。它只在編譯時檢查類別的實例形狀，讓錯誤出現在類別宣告處。伺服器資料在執行時進來，TypeScript 無從檢查，要寫型別守衛（回傳 x is T 的函式），或用 zod 之類的 schema 函式庫，在信任邊界驗證後才當成該型別使用；驗證失敗就丟錯誤或走降級流程。</li>
<li>readonly 只在編譯時、只管第一層，而且物件的 readonly 屬性不參加可指派性，指派給非唯讀的型別就能修改。Object.freeze 在執行時生效，嚴格模式下修改會丟錯誤，但也只凍結第一層。兩者都不是完整的不可變保證；真正要保護的狀態要靠設計：單一擁有者、對外只給複本或唯讀的 view。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>不要貼進編輯器，先判斷 (a) 到 (d) 哪幾行會報錯、為什麼：
<pre><code>interface Seat { row: number; col: number; vip?: boolean; }

const s1: Seat = { row: 1, col: 2, price: 9 };   // (a)
const t = { row: 1, col: 2, price: 9 };
const s2: Seat = t;                              // (b)
const s3: Seat = { row: 1 };                     // (c)
const s4: Seat = { row: 1, col: 2, vip: 'yes' }; // (d)</code></pre></li>
<li>幫 <code>PlayerId</code> 和 <code>MatchId</code> 寫品牌型別，以及一個 <code>toPlayerId(s: string)</code>：只接受 <code>p_</code> 開頭的字串，否則丟錯誤。</li>
<li>第七節統計字數的程式，在 <code>constructor</code> 那一筆算錯了。改寫成用 <code>Map</code> 的版本，並說明為什麼這樣就沒事。</li>
<li>你有一個 <code>interface GameEvents { score: [points: number] }</code>，傳給 <code>class Emitter&lt;E extends Record&lt;string, unknown[]&gt;&gt;</code> 時報錯。說明原因，並給兩種修法。</li>
<li>為 <code>{ id: string; seats: { row: number; col: number }[] }</code> 寫一個型別守衛 <code>isTable(x: unknown)</code>。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>(a) 錯：新鮮字面值多了 <code>price</code>。(b) 通過：經過變數，只做結構檢查，而且有共同屬性。(c) 錯：少了必填的 <code>col</code>。(d) 錯：<code>vip</code> 是字串，不是 boolean。</li>
<li><code>type PlayerId = string &amp; { readonly __brand: 'PlayerId' }</code>，<code>MatchId</code> 同理。<code>function toPlayerId(s: string): PlayerId { if (!s.startsWith('p_')) throw new Error('不是玩家 ID'); return s as PlayerId; }</code>。整個程式只有這個函式裡用 <code>as</code>，其他地方拿不到「沒驗證過的 PlayerId」。</li>
<li><code>const counts = new Map&lt;string, number&gt;(); counts.set(w, (counts.get(w) ?? 0) + 1);</code>。Map 的鍵是它自己存的資料，跟原型鏈無關，<code>get('constructor')</code> 一開始就是 <code>&#117;ndefined</code>。</li>
<li>介面沒有隱含的索引簽章，因為它可以被宣告合併，TypeScript 不能保證所有鍵的值都是 <code>unknown[]</code>。修法一：把 <code>GameEvents</code> 改成型別別名。修法二：把條件約束改成 <code>E extends { [K in keyof E]: unknown[] }</code>，只要求「它自己有的每個鍵」都是陣列，介面和型別別名都能用。</li>
<li>先確認是物件且不是 null，<code>typeof o.id === 'string'</code>，<code>Array.isArray(o.seats)</code>，再用 <code>o.seats.every(s =&gt; typeof s === 'object' &amp;&amp; s !== null &amp;&amp; typeof s.row === 'number' &amp;&amp; typeof s.col === 'number')</code>。巢狀一深，就是改用 schema 函式庫的時候。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>TypeScript Handbook：Object Types</b>（<a href="https://www.typescriptlang.org/docs/handbook/2/objects.html">typescriptlang.org</a>）：選擇性、唯讀、索引簽章、擴充與交集的官方說明。</li>
<li><b>TypeScript Handbook：Type Compatibility</b>（<a href="https://www.typescriptlang.org/docs/handbook/type-compatibility.html">typescriptlang.org</a>）：結構化型別與可指派性規則，包括函式參數的雙變。</li>
<li><b>TypeScript wiki：Performance</b>（<a href="https://github.com/microsoft/TypeScript/wiki/Performance">github.com/microsoft/TypeScript/wiki</a>）：interface 與交集的效能差別、怎麼量檢查時間。</li>
<li><b>Vue 官方文件：TypeScript with Composition API</b>（<a href="https://vuejs.org/guide/typescript/composition-api.html">vuejs.org</a>）：defineProps、defineEmits 的型別寫法與限制。</li>
<li><b>Dan Vanderkam《Effective TypeScript》</b>：書裡有一條就叫「Think of Types as Sets of Values」，是本章第一節的完整版；interface 與 type 的取捨也有專門的一條。</li>
</ul>
` });
