DEEP({ 'ts-async': `
<p>上一課你看過 A、D、C、B 這個順序，也學會了 await、Promise.all 和「不要忘了 await」。這一章把整台機器拆開：事件迴圈完整的一圈裡到底有哪幾步、畫面是在哪一步畫出來的；Promise 的三種狀態怎麼一路傳下去；async/await 其實是怎麼用 Promise 搭起來的；錯誤怎麼傳、為什麼會有「沒人接的拒絕」；四個組合方法各自什麼時候完成；最後是正式產品一定會遇到的四件事：限制同時進行的數量、失敗重試、取消，以及遊戲迴圈和非同步載入怎麼和平共處。</p>

<h3><span class="badge lv1">基礎</span>一、一個廚師的餐廳</h3>
<p>想像一間小餐廳，廚房裡只有<b>一個廚師</b>，這就是主執行緒（main thread）。烤箱、外送、叫貨這些事有別人在做（瀏覽器和作業系統的其他執行緒：網路、計時器、圖片解碼），但真正「炒菜」的，也就是執行你的 JavaScript 的，永遠只有這一個人，一次只炒一盤。</p>
<p>出菜口有兩個夾單的地方：</p>
<ul>
<li><b>一般單</b>，叫<b>任務佇列</b>（task queue）：客人點餐、計時器響了、網路回應到了、使用者點了按鈕，都會夾一張單在這裡。廚師一次拿一張。</li>
<li><b>急件夾</b>，叫<b>微任務佇列</b>（microtask queue）：Promise 的 <code>.then</code>、<code>await</code> 之後的程式、<code>queueMicrotask</code> 都夾在這裡。廚師每炒完一盤，一定先把急件夾清空，才去拿下一張一般單。</li>
</ul>
<p>另外，外場每隔一段時間（60 Hz 的螢幕大約每 16.7 毫秒）要把展示櫃擺好給客人看，這是<b>渲染</b>（rendering）。擺展示櫃也是這位廚師的工作，所以他在炒菜的時候，展示櫃就沒人擺。這就是為什麼一段跑兩秒的同步程式，會讓整個頁面凍住兩秒：不是瀏覽器壞了，是唯一的廚師一直在炒同一盤菜。</p>
<p>記住這個分工：<b>等待可以同時發生很多個，執行永遠一次一個。</b>十個請求可以同時在網路上等；但它們回來之後，十個回呼還是排隊，一個一個在主執行緒上跑。</p>

<h3><span class="badge lv1">基礎</span>二、事件迴圈完整的一圈</h3>
<p>把廚師的工作寫成步驟，就是<b>事件迴圈</b>（event loop）。HTML 規格裡寫的流程，簡化之後是這四步，一直重複：</p>
<figure class="figure"><svg viewBox="0 0 660 286" class="fg" style="width:100%;max-width:660px" role="img" aria-label="事件迴圈四步：拿一個任務、執行到呼叫堆疊清空、清空微任務佇列、如果該畫面了就跑 requestAnimationFrame 和樣式、版面、繪製，然後回到第一步">
<rect x="40" y="40" width="200" height="52" rx="8" class="fg-b alt"/>
<text x="140" y="62" text-anchor="middle" class="fg-t alt">① 拿一個任務</text>
<text x="140" y="81" text-anchor="middle" class="fg-t sm">任務佇列裡最舊的那一個</text>
<rect x="420" y="40" width="200" height="52" rx="8" class="fg-b"/>
<text x="520" y="62" text-anchor="middle" class="fg-t">② 執行到堆疊清空</text>
<text x="520" y="81" text-anchor="middle" class="fg-t sm">你的程式一路跑完，不會被打斷</text>
<rect x="420" y="186" width="200" height="52" rx="8" class="fg-b hot"/>
<text x="520" y="208" text-anchor="middle" class="fg-t acc">③ 清空微任務佇列</text>
<text x="520" y="227" text-anchor="middle" class="fg-t sm">一個不留，包括途中新加的</text>
<rect x="40" y="186" width="200" height="52" rx="8" class="fg-b warm"/>
<text x="140" y="208" text-anchor="middle" class="fg-t warm">④ 該畫面了嗎？</text>
<text x="140" y="227" text-anchor="middle" class="fg-t sm">rAF &rarr; 樣式 &rarr; 版面 &rarr; 繪製</text>
<line x1="240" y1="66" x2="412" y2="66" class="fg-l"/><polygon points="420,66 412,61.5 412,70.5" class="fg-a"/>
<line x1="520" y1="92" x2="520" y2="178" class="fg-l"/><polygon points="520,186 515.5,178 524.5,178" class="fg-a"/>
<line x1="420" y1="212" x2="248" y2="212" class="fg-l"/><polygon points="240,212 248,207.5 248,216.5" class="fg-a"/>
<line x1="140" y1="186" x2="140" y2="100" class="fg-l"/><polygon points="140,92 135.5,100 144.5,100" class="fg-a"/>
<path d="M620 200 H640 V226 H628" class="fg-l on"/><polygon points="620,226 628,221.5 628,230.5" class="fg-a on"/>
<text x="330" y="128" text-anchor="middle" class="fg-t lg">一圈 = 一個任務</text>
<text x="330" y="150" text-anchor="middle" class="fg-t sm">一圈只拿一個任務，但會清光所有微任務</text>
<text x="520" y="262" text-anchor="middle" class="fg-t sm acc">微任務裡再加微任務，也在這一步跑完</text>
<text x="140" y="262" text-anchor="middle" class="fg-t sm warm">60 Hz 的螢幕大約每 16.7 ms 一次</text>
</svg><figcaption>任務一次一個，微任務一次清光，畫面在兩個任務之間「有空而且該畫了」才畫。任何一步卡住，後面的全部跟著等。</figcaption></figure>
<ol>
<li><b>拿一個任務</b>：從任務佇列取最舊的一個。整段 <code>&lt;script&gt;</code> 的執行、一次點擊事件、一個計時器回呼、一次 WebSocket 訊息，各算一個任務。</li>
<li><b>執行到呼叫堆疊（call stack）清空</b>：任務裡的程式一路跑完，中間不會被別的 JavaScript 打斷。這叫「執行到完成」（run-to-completion），也是你寫 <code>count++</code> 不需要上鎖的原因。</li>
<li><b>清空微任務佇列</b>：一個接一個跑，直到佇列是空的。途中新加進來的微任務，也在這一輪跑完。</li>
<li><b>該畫面了就渲染</b>：瀏覽器判斷這時候該更新畫面（螢幕要新的一格，而且有東西改變了），就依序跑 <code>requestAnimationFrame</code> 的回呼、計算樣式、計算版面（layout）、繪製（paint）。不該畫的時候，這一步直接跳過。</li>
</ol>
<p>第 3 步藏著一個陷阱：如果每個微任務都再排一個新的微任務，第 3 步就永遠清不完，第 1 步和第 4 步永遠輪不到，畫面完全凍住，連點擊都不會有反應。用 setTimeout 遞迴就不會這樣，因為每次都是排到下一圈的任務佇列，中間有機會渲染。</p>

<h3><span class="badge lv2">進階</span>三、照時間軸追一次</h3>
<p>比上一課那個例子再難一點，把四種東西混在一起：</p>
<pre><code>console.log('A');
setTimeout(() =&gt; console.log('B'), 0);
Promise.resolve()
  .then(() =&gt; console.log('C'))
  .then(() =&gt; console.log('D'));
queueMicrotask(() =&gt; console.log('E'));
(async () =&gt; {
  console.log('F');
  await null;
  console.log('G');
})();
console.log('H');</code></pre>
<p>先自己猜，再往下看。答案是 <b>A F H C E G D B</b>（我在 Node 22 實際跑過）。</p>
<figure class="figure"><svg viewBox="0 0 700 220" class="fg" style="width:100%;max-width:700px" role="img" aria-label="時間軸：任務一是整段腳本，印出 A F H；接著依序清空微任務 C、E、G、D，微任務佇列的內容一路變化；可能渲染一次；任務二是計時器，印出 B">
<text x="170" y="34" text-anchor="middle" class="fg-t sm alt">任務 1：整段腳本</text>
<text x="357" y="34" text-anchor="middle" class="fg-t sm acc">微任務一次清光</text>
<text x="633" y="34" text-anchor="middle" class="fg-t sm alt">任務 2</text>
<text x="8" y="72" class="fg-t sm">執行中</text>
<text x="8" y="122" class="fg-t sm">微任務佇列</text>
<text x="8" y="166" class="fg-t sm">任務佇列</text>
<rect x="100" y="50" width="140" height="34" rx="5" class="fg-b alt"/><text x="170" y="72" text-anchor="middle" class="fg-t">印 A、F、H</text>
<rect x="248" y="50" width="50" height="34" rx="5" class="fg-b hot"/><text x="273" y="72" text-anchor="middle" class="fg-t mono">C</text>
<rect x="304" y="50" width="50" height="34" rx="5" class="fg-b hot"/><text x="329" y="72" text-anchor="middle" class="fg-t mono">E</text>
<rect x="360" y="50" width="50" height="34" rx="5" class="fg-b hot"/><text x="385" y="72" text-anchor="middle" class="fg-t mono">G</text>
<rect x="416" y="50" width="50" height="34" rx="5" class="fg-b hot"/><text x="441" y="72" text-anchor="middle" class="fg-t mono">D</text>
<rect x="474" y="50" width="96" height="34" rx="5" class="fg-b"/><text x="522" y="72" text-anchor="middle" class="fg-t sm">可能渲染</text>
<rect x="578" y="50" width="110" height="34" rx="5" class="fg-b alt"/><text x="633" y="72" text-anchor="middle" class="fg-t">計時器：B</text>
<text x="170" y="122" text-anchor="middle" class="fg-t sm mono">C E G</text>
<text x="273" y="122" text-anchor="middle" class="fg-t sm mono">E G D</text>
<text x="329" y="122" text-anchor="middle" class="fg-t sm mono">G D</text>
<text x="385" y="122" text-anchor="middle" class="fg-t sm mono">D</text>
<text x="441" y="122" text-anchor="middle" class="fg-t sm">（空）</text>
<path d="M170 162 H633 V92" class="fg-l alt dash"/><polygon points="633,84 628.5,92 637.5,92" class="fg-a alt"/>
<text x="400" y="154" text-anchor="middle" class="fg-t sm alt">B 從一開始就在任務佇列裡等</text>
<text x="350" y="204" text-anchor="middle" class="fg-t acc">印出順序：A F H C E G D B</text>
</svg><figcaption>上排是主執行緒正在做的事，中排是每一段做完之後微任務佇列剩下什麼。注意 D：它是在 C 跑完之後才被加進佇列的，但還是排在 B 前面。</figcaption></figure>
<ol>
<li><b>任務 1：整段腳本。</b>印 A。setTimeout 把 B 的回呼交給計時器，0 毫秒後放進任務佇列。<code>Promise.resolve()</code> 已經實現，所以 C 的回呼直接進微任務佇列；D 掛在 <code>.then(C)</code> 回傳的那個新 Promise 上，那個 Promise 還沒好，D 只是登記，沒有進佇列。E 進微任務佇列。async 函式<b>同步地</b>開始執行，印 F；碰到 <code>await null</code>，函式暫停，「之後的程式」G 進微任務佇列。印 H。此時微任務佇列是 C、E、G。</li>
<li><b>清空微任務。</b>跑 C。C 跑完，它所在的那個 Promise 實現了，於是 D 被放進佇列尾端，佇列變成 E、G、D。接著跑 E、G、D。佇列空了。</li>
<li><b>可能渲染。</b>如果剛好到了該畫面的時候，這裡畫一次。</li>
<li><b>任務 2：計時器。</b>印 B。</li>
</ol>
<p>這個例子裡有兩個重點，面試很愛考：<b>async 函式在第一個 await 之前是同步執行的</b>（所以 F 在 H 前面）；<b>串在後面的 then 要等前一個跑完才進佇列</b>（所以 D 在 E、G 後面）。</p>

<h3><span class="badge lv2">進階</span>四、Promise 的狀態與串接</h3>
<p>Promise 是一個小小的狀態機（state machine）：一開始是等待中（pending），之後只會定案（settled）一次，變成已實現（fulfilled）帶著一個值，或已拒絕（rejected）帶著一個原因。定案之後永遠不會再變；之後才掛上去的 then，也會拿到同一個結果。</p>
<p>串接的規則只有一條：<b>每個 then 和 catch 都回傳一個新的 Promise，新 Promise 的命運由你的回呼決定。</b></p>
<table>
<tr><th>你的回呼做了什麼</th><th>新的 Promise 變成</th></tr>
<tr><td>回傳一個普通的值 v</td><td>已實現，值是 v</td></tr>
<tr><td>回傳另一個 Promise q</td><td>跟著 q：q 實現它就實現，q 拒絕它就拒絕</td></tr>
<tr><td>丟出例外 e</td><td>已拒絕，原因是 e</td></tr>
<tr><td>沒有對應的回呼（例如拒絕碰到只有成功回呼的 then）</td><td>原封不動傳下去</td></tr>
</table>
<p>用真實的數字追一次：</p>
<pre><code>const p1 = Promise.resolve(3);
const p2 = p1.then(x =&gt; x * 2);                          // 6
const p3 = p2.then(x =&gt; {
  if (x &gt; 5) throw new Error('too big');
  return x;
});
const p4 = p3.then(x =&gt; x + 1);                          // 被跳過
const p5 = p4.catch((e: unknown) =&gt; String(e).length);   // 'Error: too big' 的長度
p5.then(v =&gt; console.log(v));                            // 14</code></pre>
<figure class="figure"><svg viewBox="0 0 650 240" class="fg" style="width:100%;max-width:650px" role="img" aria-label="上方是 Promise 的狀態機：等待中只能變成已實現或已拒絕。下方是一條串接：p1 實現 3、p2 實現 6、p3 拒絕、p4 跳過也拒絕、p5 被 catch 接住後實現 14">
<rect x="20" y="30" width="150" height="40" rx="6" class="fg-b"/><text x="95" y="55" text-anchor="middle" class="fg-t">等待中 pending</text>
<rect x="260" y="10" width="170" height="34" rx="6" class="fg-b hot"/><text x="345" y="32" text-anchor="middle" class="fg-t acc">已實現 fulfilled</text>
<rect x="260" y="56" width="170" height="34" rx="6" class="fg-b warm"/><text x="345" y="78" text-anchor="middle" class="fg-t warm">已拒絕 rejected</text>
<path d="M170 44 H215 V27 H252" class="fg-l on"/><polygon points="260,27 252,22.5 252,31.5" class="fg-a on"/>
<path d="M170 56 H215 V73 H252" class="fg-l warm"/><polygon points="260,73 252,68.5 252,77.5" class="fg-a warm"/>
<text x="450" y="44" class="fg-t sm">只會定案一次</text>
<text x="450" y="64" class="fg-t sm">定案之後永遠不變</text>
<rect x="10" y="120" width="110" height="56" rx="6" class="fg-b hot"/><text x="65" y="142" text-anchor="middle" class="fg-t mono">p1</text><text x="65" y="164" text-anchor="middle" class="fg-t sm">已實現：3</text>
<rect x="140" y="120" width="110" height="56" rx="6" class="fg-b hot"/><text x="195" y="142" text-anchor="middle" class="fg-t mono">p2</text><text x="195" y="164" text-anchor="middle" class="fg-t sm">已實現：6</text>
<rect x="270" y="120" width="110" height="56" rx="6" class="fg-b warm"/><text x="325" y="142" text-anchor="middle" class="fg-t mono">p3</text><text x="325" y="164" text-anchor="middle" class="fg-t sm">已拒絕：Error</text>
<rect x="400" y="120" width="110" height="56" rx="6" class="fg-b warm"/><text x="455" y="142" text-anchor="middle" class="fg-t mono">p4</text><text x="455" y="164" text-anchor="middle" class="fg-t sm">已拒絕（傳下去）</text>
<rect x="530" y="120" width="110" height="56" rx="6" class="fg-b hot"/><text x="585" y="142" text-anchor="middle" class="fg-t mono">p5</text><text x="585" y="164" text-anchor="middle" class="fg-t sm">已實現：14</text>
<line x1="120" y1="148" x2="132" y2="148" class="fg-l on"/><polygon points="140,148 132,143.5 132,152.5" class="fg-a on"/>
<line x1="250" y1="148" x2="262" y2="148" class="fg-l warm"/><polygon points="270,148 262,143.5 262,152.5" class="fg-a warm"/>
<line x1="380" y1="148" x2="392" y2="148" class="fg-l warm"/><polygon points="400,148 392,143.5 392,152.5" class="fg-a warm"/>
<line x1="510" y1="148" x2="522" y2="148" class="fg-l warm"/><polygon points="530,148 522,143.5 522,152.5" class="fg-a warm"/>
<text x="65" y="198" text-anchor="middle" class="fg-t sm mono">resolve(3)</text>
<text x="195" y="198" text-anchor="middle" class="fg-t sm">then：x * 2</text>
<text x="325" y="198" text-anchor="middle" class="fg-t sm">then：太大就 throw</text>
<text x="455" y="198" text-anchor="middle" class="fg-t sm">then：沒機會跑</text>
<text x="585" y="198" text-anchor="middle" class="fg-t sm">catch：接住</text>
<text x="325" y="228" text-anchor="middle" class="fg-t sm">拒絕會一路跳過成功回呼，直到碰到第一個 catch</text>
</svg><figcaption>串接裡的每一環都是新的 Promise。p3 丟出例外之後，p4 的成功回呼根本沒跑，拒絕原封不動傳到 p5，被 catch 接住；catch 回傳了一個數字，所以 p5 又回到「已實現」。</figcaption></figure>
<p>注意最後一步：<b>catch 接住之後，鏈子就「恢復正常」了</b>。catch 回傳什麼，下一環就拿到什麼。如果你在 catch 裡只是印個訊息、沒有再丟出去，後面的 then 會以為一切成功，拿到 undefined。這是很多「錯誤被吃掉」的 bug 的來源：要嘛在 catch 裡處理完並回傳一個合理的值，要嘛記錄之後再 <code>throw</code> 一次。</p>
<h4>「已解決」不等於「已實現」</h4>
<p>規格裡還有一個常被混用的詞：<b>已解決</b>（resolved）。<code>new Promise(r =&gt; r(q))</code> 呼叫 resolve 時如果傳的是另一個 Promise q，外面這個 Promise 就「鎖定」在 q 上，跟著 q 的結果走。它已經解決了（不能再被別的值解決），但在 q 定案之前，它仍然是等待中。這也是為什麼 then 的回呼回傳一個 Promise 時，下一環會「等它」：底下就是同一套跟隨（adopt）的機制。任何有 <code>then</code> 方法的物件（thenable）都會被這樣跟隨，所以舊的第三方 Promise 實作也能跟原生的混用。</p>

<h3><span class="badge lv2">進階</span>五、async/await 是怎麼用 Promise 搭起來的</h3>
<p>async/await 沒有發明新的機制，它只是讓 Promise 的串接寫起來像一般的程式。四條規則：</p>
<ol>
<li>async 函式<b>一被呼叫就開始同步執行</b>，直到第一個 await。</li>
<li><code>await x</code> 先把 x 包成 Promise（不是 Promise 的值也一樣），然後把「函式剩下的部分」登記成它的 then 回呼，函式本身暫停，把控制權還給呼叫者。所以 await 後面的程式，永遠在微任務裡才會繼續，就算 x 早就好了。</li>
<li>函式 <code>return v</code>，它回傳的 Promise 就以 v 實現；函式丟出例外，那個 Promise 就拒絕。</li>
<li>await 的 Promise 被拒絕時，拒絕的原因會在 await 那一行變成一個普通的例外丟出來，所以 try/catch 接得到。</li>
</ol>
<p>要真的相信這四條，最好的方法是不用 async，自己用產生器（generator）把它做出來。產生器可以在 <code>yield</code> 暫停、之後再從原地繼續，正好就是 await 需要的能力；缺的只是「Promise 好了自動叫它繼續」的那個驅動器：</p>
<pre><code>function run&lt;T&gt;(gen: () =&gt; Generator&lt;Promise&lt;unknown&gt;, T, unknown&gt;): Promise&lt;T&gt; {
  return new Promise&lt;T&gt;((resolve, reject) =&gt; {
    const it = gen();
    const step = (method: 'next' | 'throw', arg?: unknown): void =&gt; {
      let r: IteratorResult&lt;Promise&lt;unknown&gt;, T&gt;;
      try {
        r = method === 'next' ? it.next(arg) : it.throw(arg);
      } catch (err) {
        reject(err);                    // 規則 3：函式本體丟出例外，Promise 拒絕
        return;
      }
      if (r.done) {
        resolve(r.value);               // 規則 3：return 的值
        return;
      }
      r.value.then(                     // 規則 2：好了才叫它繼續
        v =&gt; step('next', v),           // 值送回 yield 的位置
        e =&gt; step('throw', e),          // 規則 4：在 yield 的位置丟出例外
      );
    };
    step('next');                       // 規則 1：馬上開始跑
  });
}

const wait = (ms: number) =&gt; new Promise&lt;number&gt;(r =&gt; setTimeout(() =&gt; r(ms), ms));

async function viaAwait(): Promise&lt;number&gt; {
  const a = await wait(100);
  const b = await wait(200);
  return a + b;
}
const viaGenerator = () =&gt; run(function* () {
  const a = (yield wait(100)) as number;
  const b = (yield wait(200)) as number;
  return a + b;
});
viaAwait().then(v =&gt; console.log('await', v));          // await 300
viaGenerator().then(v =&gt; console.log('generator', v));  // generator 300</code></pre>
<p>兩個版本做的事完全一樣。這不只是練習：TypeScript 把 <code>target</code> 設成 ES2017 以前的版本時，編譯器真的就是這樣幫你轉的，輸出裡會出現一個叫 <code>__awaiter</code> 的輔助函式，加上產生器；設成 ES5 時，連產生器都沒有，會再轉成一個用 switch 寫的狀態機（<code>__generator</code>）。你在除錯舊專案的編譯輸出時，看到這些就知道它們是什麼了。現代的專案 target 都在 ES2017 以上，async/await 直接交給引擎原生執行。</p>
<p>從這個模型可以直接推出兩個實務結論：</p>
<ul>
<li><b>每個 await 至少讓出一次微任務。</b>在一個要跑十萬次的迴圈裡 <code>await</code> 一個早就算好的值，雖然不會卡畫面，但每次都要排隊一次，比直接用值慢得多。</li>
<li><b>await 只暫停這一個函式。</b>呼叫它的人拿到的是一個 Promise，如果呼叫的人沒有 await，它會繼續往下跑。上一課「忘了 await」的問題，就是這一條。</li>
</ul>

<h3><span class="badge lv3">專業</span>六、錯誤怎麼傳，以及沒人接的拒絕</h3>
<h4>try/catch 只接得到 await 的東西</h4>
<pre><code>async function load(): Promise&lt;string&gt; {
  throw new Error('offline');
}
async function a(): Promise&lt;string&gt; {
  try {
    return load();              // 沒有 await：拒絕直接穿過 try，catch 接不到
  } catch {
    return 'fallback';
  }
}
async function b(): Promise&lt;string&gt; {
  try {
    return await load();        // 有 await：拒絕在這一行變成例外，catch 接得到
  } catch {
    return 'fallback';
  }
}
a().catch(e =&gt; console.log('a 失敗', (e as Error).message));   // a 失敗 offline
b().then(v =&gt; console.log('b', v));                              // b fallback</code></pre>
<p>a 裡的 <code>return load()</code> 是把一個 Promise 交出去，try 區塊當場就結束了；那個 Promise 之後才拒絕，那時已經離開 try 了。所以有一條實用的規則：<b>在 try 裡面回傳 Promise，一定寫 <code>return await</code>。</b>不在 try 裡面時，兩種寫法結果一樣。</p>
<p>另一個接不到的情況：Promise 建構函式（executor）裡面同步丟出的例外，會變成拒絕；但如果你在 executor 裡又開了一個計時器，計時器回呼裡丟出的例外跟這個 Promise 毫無關係，它會變成一個沒人接的全域例外，而那個 Promise 永遠停在等待中。所以包裝回呼式 API 時，要在回呼裡自己呼叫 <code>reject</code>，不要用 throw。</p>
<h4>沒人接的拒絕（unhandled rejection）</h4>
<p>一個 Promise 被拒絕，而在這一輪微任務清空之前都沒有人掛上處理它的回呼，就是「沒人接的拒絕」。不同環境的反應不一樣：</p>
<ul>
<li><b>瀏覽器</b>：在 window 上觸發 <code>unhandledrejection</code> 事件，主控台印出「Uncaught (in promise)」，程式繼續跑。如果之後才補掛 catch，會再觸發一個 <code>rejectionhandled</code> 事件。</li>
<li><b>Node.js 15 以後</b>：預設模式是 throw，沒人接的拒絕會讓整個行程結束（exit code 1）。一個忘了 await 的資料庫呼叫，就能讓伺服器重啟。可以用 <code>process.on('unhandledRejection', …)</code> 記錄下來，但正解是找到那個沒被 await 的地方。</li>
</ul>
<pre><code>window.addEventListener('unhandledrejection', e =&gt; {
  // 送到錯誤追蹤服務；這是最後一道網，不是正常的處理方式
  console.error('沒人接的拒絕', e.reason);
});</code></pre>
<p>正式產品的前端，幾乎都會在這裡掛一個全域的回報，因為它能抓到所有「忘了 await、忘了 catch」的地方。搭配上一課的 <code>@typescript-eslint/no-floating-promises</code>，一個在寫的時候擋，一個在跑的時候抓。</p>

<h3><span class="badge lv3">專業</span>七、四個組合方法：all、allSettled、race、any</h3>
<table>
<tr><th>方法</th><th>什麼時候完成</th><th>成功時拿到</th><th>有人失敗時</th></tr>
<tr><td><code>Promise.all</code></td><td>全部實現，或第一個拒絕</td><td>值的陣列，順序跟傳入的一樣</td><td>立刻拒絕，帶著第一個拒絕的原因</td></tr>
<tr><td><code>Promise.allSettled</code></td><td>全部定案</td><td>每一個的狀態，加上值或原因</td><td>永遠不會拒絕</td></tr>
<tr><td><code>Promise.race</code></td><td>第一個定案（不管成敗）</td><td>最先定案那一個的值</td><td>最先定案的是拒絕，它就拒絕</td></tr>
<tr><td><code>Promise.any</code></td><td>第一個實現，或全部拒絕</td><td>第一個成功的值</td><td>全部都失敗才拒絕，原因是 <code>AggregateError</code></td></tr>
</table>
<p>同樣三個 Promise，四種方法的結果完全不同。我在 Node 22 上照下圖的時間跑過：</p>
<figure class="figure"><svg viewBox="0 0 640 300" class="fg" style="width:100%;max-width:640px" role="img" aria-label="P1 在 300 毫秒實現 A，P2 在 200 毫秒實現 B，P3 在 100 毫秒拒絕。all 在 100 毫秒拒絕；allSettled 在 300 毫秒實現；race 在 100 毫秒拒絕；any 在 200 毫秒以 B 實現">
<text x="10" y="44" class="fg-t mono">P1</text>
<text x="10" y="74" class="fg-t mono">P2</text>
<text x="10" y="104" class="fg-t mono">P3</text>
<line x1="150" y1="40" x2="600" y2="40" class="fg-l dim"/><circle cx="600" cy="40" r="6" class="fg-lamp on"/><text x="590" y="33" text-anchor="end" class="fg-t sm acc">實現 A</text>
<line x1="150" y1="70" x2="450" y2="70" class="fg-l dim"/><circle cx="450" cy="70" r="6" class="fg-lamp on"/><text x="440" y="63" text-anchor="end" class="fg-t sm acc">實現 B</text>
<line x1="150" y1="100" x2="300" y2="100" class="fg-l dim"/><circle cx="300" cy="100" r="6" class="fg-b warm"/><text x="290" y="93" text-anchor="end" class="fg-t sm warm">拒絕</text>
<line x1="10" y1="122" x2="630" y2="122" class="fg-l dim dash"/>
<text x="10" y="154" class="fg-t sm mono">all</text>
<text x="10" y="189" class="fg-t sm mono">allSettled</text>
<text x="10" y="224" class="fg-t sm mono">race</text>
<text x="10" y="259" class="fg-t sm mono">any</text>
<line x1="150" y1="150" x2="300" y2="150" class="fg-l warm"/><circle cx="300" cy="150" r="6" class="fg-b warm"/><text x="292" y="143" text-anchor="end" class="fg-t sm warm">拒絕：P3 的原因</text>
<line x1="150" y1="185" x2="600" y2="185" class="fg-l on"/><circle cx="600" cy="185" r="6" class="fg-lamp on"/><text x="590" y="178" text-anchor="end" class="fg-t sm acc">實現：三個的結果都在</text>
<line x1="150" y1="220" x2="300" y2="220" class="fg-l warm"/><circle cx="300" cy="220" r="6" class="fg-b warm"/><text x="292" y="213" text-anchor="end" class="fg-t sm warm">拒絕：最先定案的是 P3</text>
<line x1="150" y1="255" x2="450" y2="255" class="fg-l on"/><circle cx="450" cy="255" r="6" class="fg-lamp on"/><text x="440" y="248" text-anchor="end" class="fg-t sm acc">實現：B，第一個成功的</text>
<line x1="150" y1="280" x2="600" y2="280" class="fg-l"/>
<text x="150" y="296" text-anchor="middle" class="fg-t sm">0</text>
<text x="300" y="296" text-anchor="middle" class="fg-t sm">100</text>
<text x="450" y="296" text-anchor="middle" class="fg-t sm">200</text>
<text x="600" y="296" text-anchor="middle" class="fg-t sm">300 ms</text>
</svg><figcaption>上半是三個輸入什麼時候定案，下半是四個方法什麼時候、以什麼結果完成。all 和 race 都在 100 毫秒失敗，但原因不同：all 是「有人失敗」，race 是「最先回來的剛好是失敗」。</figcaption></figure>
<p>三個容易被忽略的細節：</p>
<ul>
<li><b>all 失敗了，其他的照跑。</b>Promise 沒有「取消」這個動作，all 只是不再等它們。P1、P2 的請求照樣送完、照樣佔頻寬，結果被丟掉。要真的停下來，得把 AbortSignal 傳進去（第十節）。</li>
<li><b>空陣列</b>：<code>all([])</code> 和 <code>allSettled([])</code> 立刻以空陣列實現；<code>any([])</code> 立刻以 AggregateError 拒絕；<code>race([])</code> <b>永遠等待中</b>。動態組出來的陣列傳進 race 之前，記得檢查是不是空的。</li>
<li><b>型別</b>：TypeScript 會把 <code>Promise.all([loadProfile(), loadBest()])</code> 推斷成元組 <code>[string, number]</code>，每個位置的型別都保留；allSettled 的結果是 <code>PromiseSettledResult&lt;T&gt;</code>，要先用 <code>r.status === 'fulfilled'</code> 縮小型別，才能讀 <code>r.value</code>。</li>
</ul>
<p>race 最常見的用途是逾時。寫的時候別忘了收拾計時器，否則每呼叫一次就留下一個沒用的計時器：</p>
<pre><code>function withTimeout&lt;T&gt;(p: Promise&lt;T&gt;, ms: number): Promise&lt;T&gt; {
  let timer: ReturnType&lt;typeof setTimeout&gt; | undefined;
  const timeout = new Promise&lt;never&gt;((_, reject) =&gt; {
    timer = setTimeout(() =&gt; reject(new Error('timeout after ' + ms + ' ms')), ms);
  });
  return Promise.race([p, timeout]).finally(() =&gt; clearTimeout(timer));
}</code></pre>
<p>同樣的提醒：逾時之後 p 背後的工作還在跑。這個版本只是「不等了」；要連工作一起停，見練功題第 3 題。</p>

<h3><span class="badge lv3">專業</span>八、並發上限：N 個一組的工作池</h3>
<p>上一課教你用 <code>Promise.all(items.map(load))</code> 讓等待重疊。它有一個沒說的前提：items 不多。如果要載入 500 張圖、呼叫 2,000 次 API，一口氣全部送出會出問題：瀏覽器對同一個網域在 HTTP/1.1 下大約只開 6 條連線，其他的在瀏覽器裡排隊；伺服器可能被打爆，或回你 429（請求太多）；500 個回應同時解析，記憶體和主執行緒一起吃緊。</p>
<p>解法是一個<b>工作池</b>（worker pool）：同時最多 N 個在跑，一個做完就補下一個。</p>
<pre><code>async function mapPool&lt;T, R&gt;(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) =&gt; Promise&lt;R&gt;,
): Promise&lt;R[]&gt; {
  const results = new Array&lt;R&gt;(items.length);
  let next = 0;                                  // 下一個要拿的工作
  async function worker(): Promise&lt;void&gt; {
    while (next &lt; items.length) {
      const i = next++;                          // 拿號碼：同步完成，不會被別人插隊
      results[i] = await fn(items[i], i);        // 結果放回原本的位置
    }
  }
  const n = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: n }, () =&gt; worker()));
  return results;
}

const durations = [300, 100, 200, 200, 100, 300, 100, 200];
const sleep = (ms: number) =&gt; new Promise&lt;number&gt;(r =&gt; setTimeout(() =&gt; r(ms), ms));
mapPool(durations, 3, ms =&gt; sleep(ms))
  .then(r =&gt; console.log(r.length));          // 約 600 ms 後印 8</code></pre>
<figure class="figure"><svg viewBox="0 0 640 226" class="fg" style="width:100%;max-width:640px" role="img" aria-label="三個工人同時工作：工人 1 做工作 1 和 6，工人 2 做工作 2、4、7，工人 3 做工作 3、5、8，全部約 600 毫秒完成">
<text x="10" y="61" class="fg-t sm">工人 1</text>
<text x="10" y="105" class="fg-t sm">工人 2</text>
<text x="10" y="149" class="fg-t sm">工人 3</text>
<rect x="110" y="40" width="238" height="32" rx="4" class="fg-b alt"/><text x="229" y="61" text-anchor="middle" class="fg-t sm mono">#1 300ms</text>
<rect x="352" y="40" width="238" height="32" rx="4" class="fg-b hot"/><text x="471" y="61" text-anchor="middle" class="fg-t sm mono">#6 300ms</text>
<rect x="110" y="84" width="78" height="32" rx="4" class="fg-b alt"/><text x="149" y="105" text-anchor="middle" class="fg-t sm mono">#2 100</text>
<rect x="192" y="84" width="156" height="32" rx="4" class="fg-b alt"/><text x="270" y="105" text-anchor="middle" class="fg-t sm mono">#4 200ms</text>
<rect x="352" y="84" width="78" height="32" rx="4" class="fg-b hot"/><text x="391" y="105" text-anchor="middle" class="fg-t sm mono">#7 100</text>
<rect x="110" y="128" width="158" height="32" rx="4" class="fg-b alt"/><text x="189" y="149" text-anchor="middle" class="fg-t sm mono">#3 200ms</text>
<rect x="272" y="128" width="76" height="32" rx="4" class="fg-b alt"/><text x="310" y="149" text-anchor="middle" class="fg-t sm mono">#5 100</text>
<rect x="352" y="128" width="158" height="32" rx="4" class="fg-b hot"/><text x="431" y="149" text-anchor="middle" class="fg-t sm mono">#8 200ms</text>
<line x1="110" y1="176" x2="592" y2="176" class="fg-l"/><polygon points="600,176 592,171.5 592,180.5" class="fg-a"/>
<text x="110" y="192" text-anchor="middle" class="fg-t sm">0</text>
<text x="190" y="192" text-anchor="middle" class="fg-t sm">100</text>
<text x="270" y="192" text-anchor="middle" class="fg-t sm">200</text>
<text x="350" y="192" text-anchor="middle" class="fg-t sm">300</text>
<text x="430" y="192" text-anchor="middle" class="fg-t sm">400</text>
<text x="510" y="192" text-anchor="middle" class="fg-t sm">500</text>
<text x="590" y="192" text-anchor="middle" class="fg-t sm">600 ms</text>
<text x="350" y="218" text-anchor="middle" class="fg-t sm">一個接一個：1,500 ms　　工作池 3 個：約 600 ms　　全部一起：300 ms，但同時 8 條連線</text>
</svg><figcaption>誰先做完誰就去拿下一個號碼，所以短的工作不會被長的卡住。我在 Node 22 實際跑這組數字，排程和圖上一樣，總共約 605 毫秒。</figcaption></figure>
<p>為什麼 <code>const i = next++</code> 不需要鎖？因為「讀 next、加一、寫回」是一段同步程式，中間沒有 await，事件迴圈保證它不會被別的 JavaScript 打斷（第二節的「執行到完成」）。同樣的程式在 Go 或 Java 的多執行緒裡就是競爭條件，要用 atomic 或 mutex。</p>
<p>它的錯誤行為跟 Promise.all 一樣：任何一個工作失敗，mapPool 回傳的 Promise 就拒絕，但其他工人會繼續把剩下的工作做完。想要「一失敗就不再拿新的工作」，見練功題第 4 題。實務上也可以直接用現成的套件，例如 npm 上的 <code>p-limit</code>；Go 則有 <code>errgroup</code> 的 <code>SetLimit</code>。</p>
<p>N 要設多少？沒有標準答案，看瓶頸在哪：對同一台伺服器的 HTTP/1.1 請求，超過 6 個多半只是在瀏覽器裡排隊；HTTP/2 可以多一些；呼叫有速率限制的第三方 API，就照它文件寫的上限；CPU 重的工作（例如在 Worker 裡解碼），大約等於核心數。先挑一個保守的數字，量過再調。</p>

<h3><span class="badge lv3">專業</span>九、重試：指數退避加上抖動</h3>
<p>網路會偶爾失敗，重試是正常的。但亂重試會把小問題變成大事故。三條規則：</p>
<ol>
<li><b>只重試「暫時性」的失敗</b>：網路斷線（fetch 會以 TypeError 拒絕）、5xx、429。400、401、404 這些重試一百次也一樣，不要試。</li>
<li><b>只重試冪等的操作</b>：查詢可以放心重試；扣款、下單這種，要有冪等設計（例如帶同一個請求 id）才能重試，否則可能扣兩次。</li>
<li><b>等待時間要越來越長，而且要隨機</b>：這就是<b>指數退避</b>（exponential backoff）加<b>抖動</b>（jitter）。</li>
</ol>
<p>為什麼要隨機？想像伺服器當機 3 秒，1,000 個用戶端同時失敗。如果大家都「等 1 秒再試」，1 秒後 1,000 個請求在同一個瞬間打回來，剛恢復的伺服器又被打倒；接著大家都等 2 秒，又一起打回來。這叫<b>驚群效應</b>（thundering herd）。加上隨機，同樣的 1,000 個請求就被攤平在一段時間裡。</p>
<figure class="figure"><svg viewBox="0 0 640 250" class="fg" style="width:100%;max-width:640px" role="img" aria-label="上方：沒有抖動時，1,000 個重試請求在第 1 秒同一刻打進來，遠超過伺服器上限；下方：全抖動時，請求平均分散在 0 到 1 秒，都在上限以下">
<text x="10" y="70" class="fg-t sm warm">沒有抖動</text>
<text x="10" y="88" class="fg-t sm">都等 1 秒</text>
<text x="10" y="180" class="fg-t sm acc">全抖動</text>
<text x="10" y="198" class="fg-t sm">隨機 0～1 秒</text>
<line x1="120" y1="110" x2="600" y2="110" class="fg-l"/>
<line x1="120" y1="84" x2="600" y2="84" class="fg-l dim dash"/>
<text x="600" y="78" text-anchor="end" class="fg-t sm">伺服器撐得住的量</text>
<rect x="354" y="24" width="12" height="86" class="fg-b warm"/>
<text x="374" y="36" class="fg-t sm warm">1,000 個請求同一刻打進來</text>
<line x1="120" y1="210" x2="600" y2="210" class="fg-l"/>
<line x1="120" y1="184" x2="600" y2="184" class="fg-l dim dash"/>
<rect x="122" y="196" width="8" height="14" class="fg-b hot"/><rect x="134" y="196" width="8" height="14" class="fg-b hot"/><rect x="146" y="196" width="8" height="14" class="fg-b hot"/><rect x="158" y="196" width="8" height="14" class="fg-b hot"/><rect x="170" y="196" width="8" height="14" class="fg-b hot"/>
<rect x="182" y="196" width="8" height="14" class="fg-b hot"/><rect x="194" y="196" width="8" height="14" class="fg-b hot"/><rect x="206" y="196" width="8" height="14" class="fg-b hot"/><rect x="218" y="196" width="8" height="14" class="fg-b hot"/><rect x="230" y="196" width="8" height="14" class="fg-b hot"/>
<rect x="242" y="196" width="8" height="14" class="fg-b hot"/><rect x="254" y="196" width="8" height="14" class="fg-b hot"/><rect x="266" y="196" width="8" height="14" class="fg-b hot"/><rect x="278" y="196" width="8" height="14" class="fg-b hot"/><rect x="290" y="196" width="8" height="14" class="fg-b hot"/>
<rect x="302" y="196" width="8" height="14" class="fg-b hot"/><rect x="314" y="196" width="8" height="14" class="fg-b hot"/><rect x="326" y="196" width="8" height="14" class="fg-b hot"/><rect x="338" y="196" width="8" height="14" class="fg-b hot"/><rect x="350" y="196" width="8" height="14" class="fg-b hot"/>
<text x="240" y="178" text-anchor="middle" class="fg-t sm acc">每一小段只有約 50 個</text>
<text x="120" y="230" text-anchor="middle" class="fg-t sm">0</text>
<text x="240" y="230" text-anchor="middle" class="fg-t sm">0.5 s</text>
<text x="360" y="230" text-anchor="middle" class="fg-t sm">1 s</text>
<text x="480" y="230" text-anchor="middle" class="fg-t sm">1.5 s</text>
<text x="600" y="230" text-anchor="middle" class="fg-t sm">2 s</text>
</svg><figcaption>同樣 1,000 個重試請求。沒有抖動時全部擠在同一刻，像一面牆撞上剛恢復的伺服器；加上隨機之後，變成一段平緩的小坡。</figcaption></figure>
<p>AWS 架構部落格那篇經典文章比較過幾種抖動，最簡單也最好用的是<b>全抖動</b>（full jitter）：第 n 次重試前，等待 0 到 <code>min(上限, 基準 × 2ⁿ)</code> 之間的隨機時間。以基準 200 毫秒、上限 5 秒為例：</p>
<table>
<tr><th>第幾次重試</th><th>等待的範圍</th><th>平均</th></tr>
<tr><td>1</td><td>0～200 ms</td><td>100 ms</td></tr>
<tr><td>2</td><td>0～400 ms</td><td>200 ms</td></tr>
<tr><td>3</td><td>0～800 ms</td><td>400 ms</td></tr>
<tr><td>4</td><td>0～1,600 ms</td><td>800 ms</td></tr>
<tr><td>5</td><td>0～3,200 ms</td><td>1,600 ms</td></tr>
<tr><td>6 以後</td><td>0～5,000 ms（碰到上限）</td><td>2,500 ms</td></tr>
</table>
<pre><code>class HttpError extends Error {
  constructor(public status: number) {
    super('HTTP ' + status);
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise&lt;void&gt; {
  return new Promise((resolve, reject) =&gt; {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(() =&gt; {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () =&gt; {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

type RetryOptions = {
  retries: number;
  baseMs: number;
  capMs: number;
  signal?: AbortSignal;
};

async function retry&lt;T&gt;(
  op: (signal?: AbortSignal) =&gt; Promise&lt;T&gt;,
  o: RetryOptions,
): Promise&lt;T&gt; {
  for (let attempt = 0; ; attempt++) {
    try {
      return await op(o.signal);                 // try 裡一定要 return await
    } catch (err) {
      const transient = err instanceof TypeError ||                 // fetch 的網路失敗
        (err instanceof HttpError &amp;&amp; (err.status === 429 || err.status &gt;= 500));
      if (!transient || attempt &gt;= o.retries || o.signal?.aborted) throw err;
      const ceiling = Math.min(o.capMs, o.baseMs * 2 ** attempt);
      await sleep(Math.random() * ceiling, o.signal);   // 全抖動
    }
  }
}</code></pre>
<p>兩個再往上一層的細節：伺服器回 429 或 503 時，常會帶 <code>Retry-After</code> 標頭告訴你要等多久，有的話就照它的；重試要有總次數上限，用盡了就把錯誤交給上層，讓使用者看到「重試」按鈕，而不是在背景無限重試。同樣的想法在維運裡到處都是：Kubernetes 的 CrashLoopBackOff，就是容器反覆崩潰時，用指數退避拉長重啟的間隔。</p>

<h3><span class="badge lv4">專家</span>十、取消要一路傳下去</h3>
<p>Promise 本身不能取消：它只是一張取餐單，撕掉單子廚房也不會停。JavaScript 的取消是「合作式」的：發起的人拿著 <code>AbortController</code>，把它的 <code>signal</code> 一路傳給每一層，每一層自己負責在收到訊號時停下來、收拾、以拒絕結束。上面的 <code>sleep</code> 和 <code>retry</code> 就是這樣寫的：retry 把 signal 傳給 op 和 sleep，使用者按下取消，正在等的那一層立刻以 abort 的原因拒絕，例外沿著 await 一路往上傳，整條鏈都停了。</p>
<p>寫自己的可取消函式時，有四個細節：</p>
<ul>
<li><b>開始前先檢查</b>：signal 可能在你被呼叫之前就已經 abort 了，這時事件不會再觸發一次，所以要先看 <code>signal.aborted</code>。</li>
<li><b>拒絕的原因用 <code>signal.reason</code></b>：呼叫 <code>ctrl.abort(reason)</code> 時給的原因會放在這裡；沒給的話，是一個名字叫 AbortError 的 DOMException。上層用它分辨「被取消」和「真的失敗」。</li>
<li><b>做完要拆監聽</b>：同一個 signal 常常被傳給很多個操作，如果每個操作結束都不移除自己的 abort 監聽，監聽會越堆越多（Node 在一個 signal 上的監聽超過一定數量時，還會印出可能有記憶體洩漏的警告）。上面的 sleep 在正常結束時就把監聽拆掉了。</li>
<li><b>在長迴圈裡設檢查點</b>：純計算的迴圈不會自己停，每做一段就呼叫一次 <code>signal.throwIfAborted()</code>（較新的環境才有；沒有的話自己判斷 aborted 再丟）。</li>
</ul>

<h3><span class="badge lv4">專家</span>十一、遊戲迴圈和非同步載入怎麼共存</h3>
<p>瀏覽器裡的遊戲迴圈，底層幾乎都是 <code>requestAnimationFrame</code>：瀏覽器在每次要畫新畫面之前（第二節的第 4 步）呼叫你的回呼，你在裡面更新遊戲狀態、畫出這一格。Cocos Creator 在網頁平台上也是這樣驅動它的主迴圈，你寫的每個元件的 <code>update(dt)</code> 都在這裡面被呼叫。</p>
<p>非同步載入的回應，則是以任務的形式在兩格畫面之間抵達，它們的 await 後續在那個任務結束後的微任務裡跑。所以問題從來不是「等待」，等待不佔主執行緒；問題是<b>資料到了之後，那一段同步處理有多長</b>：解析一個 3 MB 的 JSON、一口氣建立 2,000 個節點、處理一大批地圖資料。這一段只要超過一格的預算，畫面就會掉格。</p>
<figure class="figure"><svg viewBox="0 0 660 228" class="fg" style="width:100%;max-width:660px" role="img" aria-label="上排：資料到了之後一次做完 45 毫秒的處理，第 3、4 格畫面掉了；下排：同樣的工作切成每格 4 毫秒的小塊，每一格都準時畫出來">
<text x="10" y="70" class="fg-t sm warm">一次做完</text>
<text x="10" y="150" class="fg-t sm acc">切成小塊</text>
<line x1="110" y1="44" x2="110" y2="176" class="fg-l dim dash"/>
<line x1="200" y1="44" x2="200" y2="176" class="fg-l dim dash"/>
<line x1="290" y1="44" x2="290" y2="176" class="fg-l dim dash"/>
<line x1="380" y1="44" x2="380" y2="176" class="fg-l dim dash"/>
<line x1="470" y1="44" x2="470" y2="176" class="fg-l dim dash"/>
<line x1="560" y1="44" x2="560" y2="176" class="fg-l dim dash"/>
<line x1="650" y1="44" x2="650" y2="176" class="fg-l dim dash"/>
<text x="242" y="30" class="fg-t sm">資料到了</text>
<line x1="236" y1="20" x2="236" y2="44" class="fg-l"/><polygon points="236,52 231.5,44 240.5,44" class="fg-a"/>
<rect x="110" y="54" width="26" height="30" rx="3" class="fg-b hot"/>
<rect x="200" y="54" width="26" height="30" rx="3" class="fg-b hot"/>
<rect x="238" y="54" width="240" height="30" rx="3" class="fg-b warm"/><text x="358" y="74" text-anchor="middle" class="fg-t sm">解析 JSON、建節點：45 ms</text>
<rect x="480" y="54" width="26" height="30" rx="3" class="fg-b hot"/>
<rect x="560" y="54" width="26" height="30" rx="3" class="fg-b hot"/>
<text x="303" y="102" text-anchor="middle" class="fg-t sm warm">掉格</text>
<text x="393" y="102" text-anchor="middle" class="fg-t sm warm">掉格</text>
<rect x="110" y="134" width="26" height="30" rx="3" class="fg-b hot"/>
<rect x="200" y="134" width="26" height="30" rx="3" class="fg-b hot"/>
<rect x="290" y="134" width="26" height="30" rx="3" class="fg-b hot"/>
<rect x="380" y="134" width="26" height="30" rx="3" class="fg-b hot"/>
<rect x="470" y="134" width="26" height="30" rx="3" class="fg-b hot"/>
<rect x="560" y="134" width="26" height="30" rx="3" class="fg-b hot"/>
<rect x="240" y="134" width="22" height="30" rx="3" class="fg-b alt"/>
<rect x="320" y="134" width="22" height="30" rx="3" class="fg-b alt"/>
<rect x="410" y="134" width="22" height="30" rx="3" class="fg-b alt"/>
<rect x="500" y="134" width="22" height="30" rx="3" class="fg-b alt"/>
<rect x="590" y="134" width="22" height="30" rx="3" class="fg-b alt"/>
<text x="425" y="124" text-anchor="middle" class="fg-t sm alt">每格只做 4 ms，十幾格做完</text>
<text x="155" y="196" text-anchor="middle" class="fg-t sm">第 1 格</text>
<text x="245" y="196" text-anchor="middle" class="fg-t sm">第 2 格</text>
<text x="335" y="196" text-anchor="middle" class="fg-t sm">第 3 格</text>
<text x="425" y="196" text-anchor="middle" class="fg-t sm">第 4 格</text>
<text x="515" y="196" text-anchor="middle" class="fg-t sm">第 5 格</text>
<text x="605" y="196" text-anchor="middle" class="fg-t sm">第 6 格</text>
<text x="330" y="220" text-anchor="middle" class="fg-t sm">綠色是每一格的更新與繪製；每格 16.7 ms</text>
</svg><figcaption>總工作量一樣，差別在有沒有把主執行緒讓出來。上排的玩家看到畫面停了兩格；下排的玩家只覺得載入條慢慢在跑，遊戲照樣順暢。</figcaption></figure>
<p>所以關鍵技巧是<b>時間切片</b>（time slicing）：把大工作切成小塊，每塊做幾毫秒就讓出主執行緒，讓這一格能畫出來。這裡有一個非常容易踩的坑：<b>用 <code>await Promise.resolve()</code> 讓出是沒用的。</b>回去看第二節：微任務在第 3 步一口氣清光，第 4 步的渲染要等它們全部做完。你以為讓出了，其實只是在同一圈裡排隊。要真的讓出，必須讓到下一個任務（setTimeout、MessageChannel），或下一格（requestAnimationFrame）。Chromium 系的瀏覽器還有一個較新的 <code>scheduler.yield()</code>，專門做這件事。</p>
<pre><code>const nextFrame = () =&gt; new Promise&lt;number&gt;(r =&gt; requestAnimationFrame(r));

async function processInChunks&lt;T&gt;(
  items: readonly T[],
  work: (item: T) =&gt; void,
  budgetMs = 4,
  signal?: AbortSignal,
): Promise&lt;void&gt; {
  let i = 0;
  while (i &lt; items.length) {
    signal?.throwIfAborted();                      // 場景換了就停
    const start = performance.now();
    while (i &lt; items.length &amp;&amp; performance.now() - start &lt; budgetMs) {
      work(items[i++]);
    }
    await nextFrame();                             // 真的讓出：這一格可以畫了
  }
}</code></pre>
<p>budget 為什麼是 4 毫秒？一格 16.7 毫秒裡，遊戲自己的更新和繪製要用掉一大塊，留一點給瀏覽器處理輸入。在低階手機上，這個數字要再小一點。要注意：分頁在背景時，大部分瀏覽器會暫停 requestAnimationFrame，用 nextFrame 讓出的載入也會跟著停；如果需要在背景繼續，改用 setTimeout 讓出。</p>
<h4>換場景時，舊的載入怎麼辦</h4>
<p>玩家在載入途中按了返回，載入完成時，原本要顯示的場景已經不在了。這是閉包那一章「過期的回應」在遊戲裡的版本，修法也一樣：每個場景一個 AbortController，換場景就 abort，載入完成後再確認自己還是不是目前的場景。</p>
<pre><code>declare function mapPool&lt;T, R&gt;(
  items: readonly T[], limit: number, fn: (item: T, i: number) =&gt; Promise&lt;R&gt;,
): Promise&lt;R[]&gt;;
declare function showLevel(name: string, images: ImageBitmap[]): void;

let scene = new AbortController();

async function enterLevel(name: string, urls: readonly string[]): Promise&lt;void&gt; {
  scene.abort();                                   // 上一個場景還在載入的，全部取消
  const mine = new AbortController();
  scene = mine;
  try {
    const images = await mapPool(urls, 4, async url =&gt; {
      const res = await fetch(url, { signal: mine.signal });
      return createImageBitmap(await res.blob());  // 解碼交給瀏覽器，通常不佔主執行緒
    });
    if (scene !== mine) return;                    // 安全網：已經換到別的場景
    showLevel(name, images);
  } catch (err) {
    if (mine.signal.aborted) return;               // 是我們自己取消的
    throw err;
  }
}</code></pre>
<p>在 Cocos Creator 裡，<code>resources.load</code> 和 <code>assetManager.loadBundle</code> 是回呼式的 API。把它們包成 Promise 時，記得在回呼裡呼叫 <code>reject</code>（第六節），而且在 await 之後操作節點前，用 <code>isValid(this.node)</code> 確認節點還沒被銷毀；元件被銷毀之後才回來的載入，是 Cocos 專案裡最常見的「Cannot read properties of null」來源之一。</p>

<h3>十二、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>async 函式在另一條執行緒上跑</td><td>還是在主執行緒。await 只是讓出、等結果回來再接著跑。CPU 重的計算要放到 Web Worker 才是真的平行。</td></tr>
<tr><td>await 會讓整個程式停下來</td><td>只暫停這一個 async 函式。其他事件、計時器、渲染照常進行。</td></tr>
<tr><td>Promise 要呼叫 then 才開始跑</td><td>建構函式（executor）在 <code>new Promise</code> 的當下就同步執行了。then 只是登記結果出來之後要做什麼。</td></tr>
<tr><td>Promise.all 一失敗，其他的就被取消</td><td>其他的照跑，只是結果沒人要。要停下來，得自己傳 AbortSignal。</td></tr>
<tr><td><code>await Promise.resolve()</code> 可以讓畫面更新</td><td>微任務會在渲染之前全部清光。要讓瀏覽器畫畫面，必須讓到下一個任務或下一格。</td></tr>
<tr><td>try/catch 包起來，所有錯誤都接得住</td><td>只接得到被 await 的拒絕。沒 await 的 Promise、計時器回呼裡丟的例外，都會從旁邊溜走。</td></tr>
<tr><td>重試越快越好</td><td>立刻重試、大家一起重試，會把剛恢復的伺服器再打倒。要指數退避加抖動，而且只重試暫時性的失敗。</td></tr>
</table>

<h3>十三、跟你的工作連起來</h3>
<ul>
<li><b>Vue</b>：<code>onMounted(async …)</code> 不會被等待，元件先畫出來，資料晚到，所以模板要有載入中和錯誤兩種狀態。大量清單的資料處理不要寫在一個同步的 computed 裡一次做完；切片處理或交給 Worker。全域掛一個 <code>unhandledrejection</code> 回報，Vue 的 <code>app.config.errorHandler</code> 也一起設。</li>
<li><b>Cocos Creator</b>：載入用工作池限制同時數量，解析和建節點切成小塊分散在幾格裡做，換場景時取消舊的載入，回來時先 <code>isValid</code>。預先載入下一個場景（例如在結算畫面時就開始載），玩家就感覺不到等待。</li>
<li><b>Node.js 後端</b>：沒人接的拒絕會讓行程結束，所以每個 async 呼叫都要有歸屬。Express 4 不會幫你接 async 路由處理器的拒絕（Express 5 會），舊專案要自己包。對外部服務的呼叫一律加逾時、重試和並發上限，否則一個慢的下游就能拖垮你。</li>
<li><b>Go</b>：goroutine 是真的平行，跟 JavaScript 單執行緒的「同時等待」不同；但工作池、退避重試、用 context 一路往下傳取消，這三個模式是一模一樣的。<code>context.Context</code> 就是 Go 版的 AbortSignal。</li>
<li><b>雲端與維運</b>：負載平衡器的健康檢查、Kubernetes 的重啟、各家雲端 SDK 的重試，全都是退避加抖動。看懂這一章，你就知道為什麼某個服務掛掉之後，其他服務的錯誤會「一波一波」地來。</li>
</ul>

<h3>十四、面試會怎麼問</h3>
<p>先自己講一遍，最好邊講邊在紙上畫事件迴圈，再打開參考答案。</p>
<ol>
<li>「說明事件迴圈。任務和微任務差在哪？畫面是在什麼時候更新的？」</li>
<li>「async/await 底層是怎麼運作的？async 函式回傳什麼？await 後面的程式什麼時候執行？」</li>
<li>「Promise.all、allSettled、race、any 各在什麼情況下用？怎麼幫一個請求加上逾時？」</li>
<li>「有 1,000 個網址要下載，怎麼限制同時最多 5 個？請寫出來。」</li>
<li>「設計一個重試機制。為什麼要指數退避？為什麼要加抖動？哪些錯誤不該重試？」</li>
<li>「遊戲在載入關卡時畫面會卡住一下，你會怎麼排查、怎麼改？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>JavaScript 在單一主執行緒上執行。事件迴圈每一圈從任務佇列取一個任務（腳本、事件、計時器、網路回呼），執行到呼叫堆疊清空，然後清空整個微任務佇列（Promise 回呼、await 後續、queueMicrotask，途中新增的也一起），接著如果到了渲染時機，就跑 requestAnimationFrame、樣式、版面、繪製。所以同一輪裡微任務一定比下一個計時器早；微任務如果不斷產生新的微任務，會餓死渲染和輸入。</li>
<li>async 函式被呼叫時同步執行到第一個 await，並立刻回傳一個 Promise。await 把運算元轉成 Promise，把函式剩餘部分登記為它的回呼後暫停；Promise 定案後，剩餘部分作為微任務繼續執行，拒絕會在 await 處以例外丟出。函式 return 的值實現回傳的 Promise，丟出的例外拒絕它。本質上等同產生器加上一個自動驅動的執行器，TypeScript 編譯到 ES2017 以前的 target 時就是用 __awaiter 這樣轉的。</li>
<li>all：全部都要成功，任一失敗就整體失敗（例如畫面需要的三份資料）。allSettled：每個結果都要知道，部分失敗可以接受（例如批次上傳的結果報告）。race：誰先定案用誰，最常用於逾時。any：只要一個成功（例如從多個鏡像站取同一份資料）。逾時用 race 搭配一個會在時間到時拒絕的 Promise，並在 finally 清掉計時器；要真的停掉請求，要用 AbortController，例如 <code>fetch(url, { signal: AbortSignal.timeout(5000) })</code>。</li>
<li>用工作池：一個共享的索引，開 5 個 worker，每個 worker 在迴圈裡同步地取下一個索引、await 該項工作、把結果寫回原位置，直到索引用完；最後 Promise.all 等所有 worker。因為取索引是同步的，單執行緒下不會重複。要說明錯誤策略（第一個失敗就停止派發，或收集所有錯誤）和取消（把 AbortSignal 傳給每個請求）。</li>
<li>只重試暫時性失敗（網路錯誤、5xx、429）且操作必須冪等；用指數退避讓失敗時對下游的壓力快速下降，設上限避免等太久；加抖動避免大量用戶端在同一時刻重試造成驚群。要有最大次數、尊重 Retry-After、支援取消，用盡後把錯誤交給上層。4xx（除了 429）、驗證失敗、業務邏輯錯誤不該重試。</li>
<li>先用 DevTools 的 Performance 面板錄一段載入過程，看主執行緒上有沒有長任務（超過 50 ms），以及它們是 JSON 解析、建立節點、圖片解碼還是 GC。改法：載入用工作池限制並發；解析和建節點用時間切片分散到多格，用 requestAnimationFrame 或 setTimeout 讓出（不能用微任務）；圖片用 createImageBitmap 在背景解碼；能預先載入的提前在前一個畫面載；CPU 重的處理移到 Web Worker。改完再錄一次確認沒有長任務。</li>
</ol>
</details>

<h3>十五、練功題（做得出來才算真的懂）</h3>
<ol>
<li>不要執行，先寫下輸出順序，再用事件迴圈的四步解釋：
<pre><code>async function one() {
  console.log(1);
  await two();
  console.log(2);
}
async function two() {
  console.log(3);
}
setTimeout(() =&gt; console.log(4), 0);
one();
Promise.resolve().then(() =&gt; console.log(5));
console.log(6);</code></pre></li>
<li>不用 <code>Promise.all</code>，自己寫一個 <code>promiseAll</code>：結果順序要跟輸入一樣，任何一個拒絕就整體拒絕，空陣列要立刻實現。</li>
<li>寫一個 <code>withDeadline(op, ms)</code>：op 會收到一個 AbortSignal，時間到時不只是「不等了」，還要真的 abort 那個操作。正常完成時要清掉計時器。</li>
<li>修改第八節的 <code>mapPool</code>：任何一個工作失敗之後，其他工人不再拿新的工作。</li>
<li>基準 200 毫秒、上限 5 秒、最多重試 6 次的全抖動重試，最壞情況下總共會等多久？平均大約多久？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>輸出是 1 3 6 2 5 4（Node 22 實測）。腳本這個任務裡：one() 同步印 1，呼叫 two() 同步印 3，two 回傳一個已實現的 Promise；await 它，one 暫停，後續（印 2）進微任務佇列。then(5) 進微任務佇列，排在後面。印 6。清空微任務：先印 2，再印 5。最後才是計時器任務，印 4。</li>
<li>用計數器記還剩幾個沒完成，結果寫回原本的位置：
<pre><code>function promiseAll&lt;T&gt;(ps: readonly Promise&lt;T&gt;[]): Promise&lt;T[]&gt; {
  return new Promise((resolve, reject) =&gt; {
    const out = new Array&lt;T&gt;(ps.length);
    let left = ps.length;
    if (left === 0) {
      resolve(out);
      return;
    }
    ps.forEach((p, i) =&gt; {
      p.then(v =&gt; {
        out[i] = v;
        if (--left === 0) resolve(out);
      }, reject);                        // 第一個拒絕決定結果，之後的沒有作用
    });
  });
}</code></pre>
不能用「最後一個回來的 index 等於 length - 1」判斷完成，因為回來的順序不保證。也不能用 push，否則結果順序會變成完成的順序。</li>
<li>計時器到期時呼叫 abort，finally 裡清掉計時器：
<pre><code>async function withDeadline&lt;T&gt;(
  op: (signal: AbortSignal) =&gt; Promise&lt;T&gt;,
  ms: number,
): Promise&lt;T&gt; {
  const ctrl = new AbortController();
  const reason = new Error('timeout after ' + ms + ' ms');
  const timer = setTimeout(() =&gt; ctrl.abort(reason), ms);
  try {
    return await op(ctrl.signal);        // 一定要 await，finally 才會在 op 結束後才跑
  } finally {
    clearTimeout(timer);
  }
}
// 用法：withDeadline(signal =&gt; fetch('/api/levels', { signal }), 3000)</code></pre>
如果不寫 await，finally 會在 op 還沒結束時就把計時器清掉，逾時就失效了。現代環境也可以直接用 <code>AbortSignal.timeout(ms)</code>，但自己寫一次才知道它在做什麼。</li>
<li>加一個共享的旗標，失敗時立起來，worker 的迴圈條件檢查它：
<pre><code>async function mapPool&lt;T, R&gt;(
  items: readonly T[], limit: number, fn: (item: T, index: number) =&gt; Promise&lt;R&gt;,
): Promise&lt;R[]&gt; {
  const results = new Array&lt;R&gt;(items.length);
  let next = 0;
  let failed = false;
  async function worker(): Promise&lt;void&gt; {
    while (!failed &amp;&amp; next &lt; items.length) {
      const i = next++;
      try {
        results[i] = await fn(items[i], i);
      } catch (err) {
        failed = true;                   // 其他工人做完手上這個就停
        throw err;
      }
    }
  }
  const n = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: n }, () =&gt; worker()));
  return results;
}</code></pre>
正在進行中的工作仍會做完；想連它們一起停，就把一個 AbortController 的 signal 傳給 fn，失敗時順便 abort。</li>
<li>六次重試的等待上限依序是 200、400、800、1,600、3,200、5,000 毫秒，最壞情況全部抽到上限，總共 11,200 毫秒，約 11 秒；全抖動的平均是上限的一半，約 5.6 秒。這還沒算每次請求本身花的時間。這個數字告訴你：如果使用者在畫面上等，6 次可能太多了，要搭配進度提示或縮短上限。</li>
</ol>
</details>

<h3>十六、想再挖深</h3>
<ul>
<li><b>Jake Archibald〈Tasks, microtasks, queues and schedules〉</b>（jakearchibald.com）：用可以一步一步播放的動畫，講任務和微任務的順序，這一章第三節的完整版。</li>
<li><b>Jake Archibald 在 JSConf.Asia 2018 的演講〈In The Loop〉</b>（YouTube）：事件迴圈和渲染、requestAnimationFrame 的關係，講得最清楚的一場。Philip Roberts 在 JSConf EU 2014 的〈What the heck is the event loop anyway?〉則是入門的經典。</li>
<li><b>HTML 規格的 Event loops 一節</b>（html.spec.whatwg.org）：事件迴圈的正式定義，包括什麼時候執行微任務檢查點、什麼時候更新渲染。</li>
<li><b>MDN：Using promises、Promise 參考、AbortController</b>（developer.mozilla.org）：每個組合方法的細節和瀏覽器支援表。</li>
<li><b>AWS Architecture Blog〈Exponential Backoff And Jitter〉</b>（Marc Brooker）：比較各種抖動策略，全抖動的出處。</li>
</ul>
` });
