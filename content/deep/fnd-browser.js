DEEP({ 'fnd-browser': `
<p>上一課說瀏覽器比較像一個小型作業系統。這一章就照作業系統的方式拆它：按下 Enter 之後的完整時間軸；從 HTML 位元組到像素的管線，以及每一種修改會觸發哪幾站；主執行緒上的事件迴圈，任務、微任務、畫面更新到底誰先誰後；同源政策、CORS、Cookie 的細節；Chrome 怎麼用行程把網站互相隔開；瀏覽器替你記住哪些東西，Service Worker 為什麼會讓新版本「發不出去」；最後是 WebGL 和 WebAssembly 遊戲在瀏覽器裡怎麼跑，記憶體的牆在哪裡。前端的效能問題和網頁的資安漏洞，幾乎都能在這一章找到根。</p>

<h3><span class="badge lv1">基礎</span>一、按下 Enter 之後：一次導覽的時間軸</h3>
<p>你在網址列打 <code>https://game.example/</code> 按下 Enter。瀏覽器依序做這些事：</p>
<ol>
<li><b>先問自己</b>：這個來源有沒有註冊過 Service Worker？有的話，請求先交給它（第七節）。再看 HTTP 快取裡有沒有還沒過期的副本。</li>
<li><b>DNS、TCP、TLS</b>：把名稱換成 IP，建連線，談好加密。這三步就是模組 1 的那條鏈，各要一個來回左右。</li>
<li><b>送出請求，等第一個位元組</b>：從送出到收到回應的第一個位元組，叫 <b>TTFB</b>（time to first byte），包含一個來回和伺服器自己的處理時間。</li>
<li><b>邊收邊解析</b>：HTML 不用等全部下載完，收到一點就解析一點。同時有一個<b>預載掃描器</b>（preload scanner）往前偷看，提早發現 CSS、JS、圖片並開始下載。</li>
<li><b>CSS 擋住畫面，一般的 script 擋住解析</b>：沒拿到 CSS 之前，瀏覽器不敢畫（不然會先畫出沒樣式的醜畫面）；遇到一般的 <code>&lt;script&gt;</code>，解析器要停下來，等它下載並執行完。</li>
<li><b>幾個里程碑</b>：DOM 建完（DOMContentLoaded）、第一次畫出內容（FCP）、最大的那塊內容畫出來（LCP）、所有資源都載完（load）。</li>
</ol>
<figure class="figure"><svg viewBox="0 0 680 296" class="fg" style="width:100%;max-width:680px" role="img" aria-label="一次頁面載入的瀑布圖：DNS、TCP、TLS、等待伺服器、下載 HTML、CSS、JS、主圖依序或並行進行，並標出 FCP、DOMContentLoaded、LCP 和 load 的時間點">
<line x1="370" y1="36" x2="370" y2="258" class="fg-l dim dash"/><text x="370" y="28" text-anchor="middle" class="fg-t sm acc">FCP</text>
<line x1="400" y1="36" x2="400" y2="258" class="fg-l dim dash"/><text x="400" y="28" text-anchor="middle" class="fg-t sm">DCL</text>
<line x1="510" y1="36" x2="510" y2="258" class="fg-l dim dash"/><text x="510" y="28" text-anchor="middle" class="fg-t sm acc">LCP</text>
<line x1="550" y1="36" x2="550" y2="258" class="fg-l dim dash"/><text x="550" y="28" text-anchor="middle" class="fg-t sm">load</text>
<text x="20" y="64" class="fg-t">DNS 查詢</text><rect x="150" y="50" width="15" height="18" rx="3" class="fg-b alt"/>
<text x="20" y="90" class="fg-t">TCP 握手</text><rect x="165" y="76" width="20" height="18" rx="3" class="fg-b alt"/>
<text x="20" y="116" class="fg-t">TLS 握手</text><rect x="185" y="102" width="20" height="18" rx="3" class="fg-b alt"/>
<text x="20" y="142" class="fg-t">等伺服器（TTFB）</text><rect x="205" y="128" width="75" height="18" rx="3" class="fg-b"/>
<text x="20" y="168" class="fg-t">下載 HTML</text><rect x="280" y="154" width="30" height="18" rx="3" class="fg-b alt"/>
<text x="20" y="194" class="fg-t">CSS（擋畫面）</text><rect x="295" y="180" width="65" height="18" rx="3" class="fg-b warm"/>
<text x="20" y="220" class="fg-t">JS（defer）</text><rect x="300" y="206" width="90" height="18" rx="3" class="fg-b hot"/>
<text x="20" y="246" class="fg-t">主圖</text><rect x="310" y="232" width="190" height="18" rx="3" class="fg-b"/>
<line x1="150" y1="266" x2="650" y2="266" class="fg-l"/>
<line x1="150" y1="262" x2="150" y2="270" class="fg-l"/><line x1="250" y1="262" x2="250" y2="270" class="fg-l"/><line x1="350" y1="262" x2="350" y2="270" class="fg-l"/><line x1="450" y1="262" x2="450" y2="270" class="fg-l"/><line x1="550" y1="262" x2="550" y2="270" class="fg-l"/><line x1="650" y1="262" x2="650" y2="270" class="fg-l"/>
<text x="150" y="286" text-anchor="middle" class="fg-t sm">0</text><text x="250" y="286" text-anchor="middle" class="fg-t sm">200</text><text x="350" y="286" text-anchor="middle" class="fg-t sm">400</text><text x="450" y="286" text-anchor="middle" class="fg-t sm">600</text><text x="550" y="286" text-anchor="middle" class="fg-t sm">800</text><text x="650" y="286" text-anchor="middle" class="fg-t sm">1000 ms</text>
</svg><figcaption>一個示意的載入過程（來回約 40 毫秒）。前四行一個接一個，沒辦法並行；HTML 一開始到，CSS、JS、圖片就同時開抓。橘色的 CSS 沒到，FCP 就出不來。</figcaption></figure>
<p>上一課的練習裡，<code>performance.getEntriesByType('navigation')[0]</code> 給你的就是這張圖的數字：<code>domainLookupStart</code>／<code>End</code> 是 DNS，<code>connectStart</code> 到 <code>connectEnd</code> 是 TCP 加 TLS（<code>secureConnectionStart</code> 是 TLS 開始的那一刻），<code>responseStart</code> 減掉 <code>requestStart</code> 就是等伺服器的時間，<code>domContentLoadedEventEnd</code> 和 <code>loadEventEnd</code> 是兩個里程碑。</p>
<h4>script 的四種載法</h4>
<table>
<tr><th>寫法</th><th>下載時擋解析嗎</th><th>什麼時候執行</th></tr>
<tr><td><code>&lt;script src&gt;</code></td><td>擋</td><td>下載完立刻執行，照順序</td></tr>
<tr><td><code>async</code></td><td>不擋</td><td>下載完就執行，誰先到誰先跑，不保證順序</td></tr>
<tr><td><code>defer</code></td><td>不擋</td><td>HTML 解析完、DOMContentLoaded 之前，照順序</td></tr>
<tr><td><code>type="module"</code></td><td>不擋</td><td>預設就像 defer</td></tr>
</table>
<p>Google 用三個數字衡量使用者的感受，叫 Core Web Vitals：<b>LCP</b>（最大內容出現的時間，2.5 秒內算好）、<b>INP</b>（點下去到畫面有反應，200 毫秒內算好）、<b>CLS</b>（版面亂跳的程度，0.1 以下算好）。INP 會在第三節再出現，它跟事件迴圈直接相關。</p>

<h3><span class="badge lv1">基礎</span>二、渲染管線：每一種修改要付多少錢</h3>
<p>上一課畫過這條流程：DOM 加上 CSS，經過版面配置、繪製，最後由 GPU 合成。這裡要補上最實用的一件事：<b>你改了什麼，決定瀏覽器要重做哪幾站</b>。</p>
<figure class="figure"><svg viewBox="0 0 680 266" class="fg" style="width:100%;max-width:680px" role="img" aria-label="渲染管線的五站，以及三種修改各自觸發哪幾站：改寬度位置要重做樣式、版面、繪製、合成；改顏色跳過版面；改 transform 和 opacity 只要樣式和合成">
<rect x="20" y="20" width="110" height="44" rx="6" class="fg-b alt"/><text x="75" y="40" text-anchor="middle" class="fg-t">DOM＋CSSOM</text><text x="75" y="56" text-anchor="middle" class="fg-t sm">解析 HTML、CSS</text>
<rect x="152" y="20" width="110" height="44" rx="6" class="fg-b alt"/><text x="207" y="40" text-anchor="middle" class="fg-t">樣式 Style</text><text x="207" y="56" text-anchor="middle" class="fg-t sm">每個元素套哪些規則</text>
<rect x="284" y="20" width="110" height="44" rx="6" class="fg-b alt"/><text x="339" y="40" text-anchor="middle" class="fg-t">版面 Layout</text><text x="339" y="56" text-anchor="middle" class="fg-t sm">算大小和位置</text>
<rect x="416" y="20" width="110" height="44" rx="6" class="fg-b alt"/><text x="471" y="40" text-anchor="middle" class="fg-t">繪製 Paint</text><text x="471" y="56" text-anchor="middle" class="fg-t sm">畫成一張張圖層</text>
<rect x="548" y="20" width="110" height="44" rx="6" class="fg-b alt"/><text x="603" y="40" text-anchor="middle" class="fg-t">合成 Composite</text><text x="603" y="56" text-anchor="middle" class="fg-t sm">GPU 把圖層疊起來</text>
<line x1="130" y1="42" x2="144" y2="42" class="fg-l"/><polygon points="152,42 144,37.5 144,46.5" class="fg-a"/>
<line x1="262" y1="42" x2="276" y2="42" class="fg-l"/><polygon points="284,42 276,37.5 276,46.5" class="fg-a"/>
<line x1="394" y1="42" x2="408" y2="42" class="fg-l"/><polygon points="416,42 408,37.5 408,46.5" class="fg-a"/>
<line x1="526" y1="42" x2="540" y2="42" class="fg-l"/><polygon points="548,42 540,37.5 540,46.5" class="fg-a"/>
<text x="20" y="104" class="fg-t warm">改 width、top、margin，或加減元素：最貴</text>
<rect x="152" y="114" width="110" height="26" rx="4" class="fg-b warm"/><text x="207" y="132" text-anchor="middle" class="fg-t sm">重算</text>
<rect x="284" y="114" width="110" height="26" rx="4" class="fg-b warm"/><text x="339" y="132" text-anchor="middle" class="fg-t sm">重算</text>
<rect x="416" y="114" width="110" height="26" rx="4" class="fg-b warm"/><text x="471" y="132" text-anchor="middle" class="fg-t sm">重畫</text>
<rect x="548" y="114" width="110" height="26" rx="4" class="fg-b warm"/><text x="603" y="132" text-anchor="middle" class="fg-t sm">重疊</text>
<text x="20" y="168" class="fg-t alt">改 color、background、box-shadow：中等</text>
<rect x="152" y="178" width="110" height="26" rx="4" class="fg-b alt"/><text x="207" y="196" text-anchor="middle" class="fg-t sm">重算</text>
<rect x="284" y="178" width="110" height="26" rx="4" class="fg-l dim dash"/><text x="339" y="196" text-anchor="middle" class="fg-t sm">跳過</text>
<rect x="416" y="178" width="110" height="26" rx="4" class="fg-b alt"/><text x="471" y="196" text-anchor="middle" class="fg-t sm">重畫</text>
<rect x="548" y="178" width="110" height="26" rx="4" class="fg-b alt"/><text x="603" y="196" text-anchor="middle" class="fg-t sm">重疊</text>
<text x="20" y="232" class="fg-t acc">改 transform、opacity：最便宜</text>
<rect x="152" y="242" width="110" height="20" rx="4" class="fg-b hot"/><text x="207" y="256" text-anchor="middle" class="fg-t sm">重算</text>
<rect x="284" y="242" width="110" height="20" rx="4" class="fg-l dim dash"/><text x="339" y="256" text-anchor="middle" class="fg-t sm">跳過</text>
<rect x="416" y="242" width="110" height="20" rx="4" class="fg-l dim dash"/><text x="471" y="256" text-anchor="middle" class="fg-t sm">跳過</text>
<rect x="548" y="242" width="110" height="20" rx="4" class="fg-b hot"/><text x="603" y="256" text-anchor="middle" class="fg-t sm">重疊</text>
</svg><figcaption>改大小或位置，後面每一站都要重做；改顏色可以跳過版面；transform 和 opacity（元素在自己的圖層上時）連繪製都跳過，只要 GPU 重新疊一次。</figcaption></figure>
<p>為什麼 transform 這麼便宜？因為合成是在另一條執行緒（合成執行緒）上做的，而且只是把已經畫好的圖層換個位置再疊一次。所以用 <code>transform: translateX()</code> 做的動畫，就算主執行緒正忙著跑 JavaScript，也還是順的；用 <code>left</code> 做的動畫，每一格都要回主執行緒重算版面。</p>
<h4>強迫同步版面：一個迴圈毀掉一個畫面</h4>
<pre><code>// 壞：每一圈都「寫了又讀」，逼瀏覽器每圈重算一次版面
for (const card of cards) {
  card.style.width = box.offsetWidth + 'px';
}
// 好：先讀完，再一起寫
const w = box.offsetWidth;
for (const card of cards) card.style.width = w + 'px';</code></pre>
<p>瀏覽器本來很聰明：你改了樣式，它先記著，等這一格要畫的時候再一起算。可是你一讀 <code>offsetWidth</code>、<code>getBoundingClientRect()</code> 這類「需要最新版面」的值，它就只好當場算一次。寫、讀、寫、讀交錯，一百張卡片就算一百次版面，這叫<b>版面抖動</b>（layout thrashing）。</p>
<p>預算是這樣算的：60 Hz 的螢幕，每一格 16.7 毫秒；120 Hz 只有 8.3 毫秒，而瀏覽器自己的樣式、版面、繪製也要從這裡面扣。用 Cocos 或 Unity 做的網頁遊戲，整個畫面是一個 <code>&lt;canvas&gt;</code>，每格由 WebGL 重畫，DOM 的管線幾乎閒著；但疊在 canvas 上的 HTML 介面（例如用 Vue 做的選單），走的還是這條管線。</p>

<h3><span class="badge lv2">進階</span>三、事件迴圈：任務、微任務、畫面更新的真正順序</h3>
<p>上一課說主執行緒「拿一件工作，跑完，更新畫面，再拿下一件」。真實的規則多了一個角色，叫<b>微任務</b>（microtask），而且畫面更新不是每件工作之後都會發生：</p>
<figure class="figure"><svg viewBox="0 0 680 284" class="fg" style="width:100%;max-width:680px" role="img" aria-label="瀏覽器事件迴圈：從任務佇列拿一個任務到主執行緒跑完，接著清空全部微任務，到了該畫畫面的時候才執行 rAF、樣式、版面、繪製，然後回去拿下一個任務">
<rect x="20" y="60" width="160" height="150" rx="8" class="fg-b alt"/><text x="100" y="82" text-anchor="middle" class="fg-t alt">任務佇列</text>
<rect x="36" y="96" width="128" height="26" rx="4" class="fg-b"/><text x="100" y="114" text-anchor="middle" class="fg-t sm">點擊事件</text>
<rect x="36" y="128" width="128" height="26" rx="4" class="fg-b"/><text x="100" y="146" text-anchor="middle" class="fg-t sm">setTimeout 到期</text>
<rect x="36" y="160" width="128" height="26" rx="4" class="fg-b"/><text x="100" y="178" text-anchor="middle" class="fg-t sm">fetch 回應到了</text>
<rect x="260" y="90" width="160" height="90" rx="8" class="fg-b hot"/><text x="340" y="120" text-anchor="middle" class="fg-t acc">主執行緒</text><text x="340" y="142" text-anchor="middle" class="fg-t sm">一次跑一件，跑到完</text><text x="340" y="162" text-anchor="middle" class="fg-t sm">中途不會被打斷</text>
<rect x="500" y="20" width="160" height="110" rx="8" class="fg-b warm"/><text x="580" y="42" text-anchor="middle" class="fg-t warm">微任務佇列</text>
<rect x="516" y="56" width="128" height="26" rx="4" class="fg-b"/><text x="580" y="74" text-anchor="middle" class="fg-t sm mono">Promise .then</text>
<rect x="516" y="90" width="128" height="26" rx="4" class="fg-b"/><text x="580" y="108" text-anchor="middle" class="fg-t sm">await 之後的部分</text>
<rect x="500" y="170" width="160" height="90" rx="8" class="fg-b"/><text x="580" y="194" text-anchor="middle" class="fg-t">畫面更新</text><text x="580" y="216" text-anchor="middle" class="fg-t sm">rAF → 樣式 → 版面</text><text x="580" y="236" text-anchor="middle" class="fg-t sm">→ 繪製 → 合成</text>
<line x1="180" y1="120" x2="252" y2="120" class="fg-l on"/><polygon points="260,120 252,115.5 252,124.5" class="fg-a on"/>
<text x="220" y="110" text-anchor="middle" class="fg-t sm acc">① 拿一個</text>
<path d="M420 110 H460 V80 H492" class="fg-l warm"/><polygon points="500,80 492,75.5 492,84.5" class="fg-a warm"/>
<text x="455" y="68" text-anchor="middle" class="fg-t sm warm">② 全部清空</text>
<path d="M420 160 H460 V215 H492" class="fg-l"/><polygon points="500,215 492,210.5 492,219.5" class="fg-a"/>
<text x="440" y="250" text-anchor="middle" class="fg-t sm">③ 該畫了才畫</text>
<path d="M580 260 V274 H100 V218" class="fg-l alt"/><polygon points="100,210 95.5,218 104.5,218" class="fg-a alt"/>
<text x="300" y="266" text-anchor="middle" class="fg-t sm alt">④ 回去拿下一個任務</text>
</svg><figcaption>一圈的規則：拿<b>一個</b>任務跑完 → 把微任務<b>全部</b>清空（途中新加進來的也算）→ 如果到了該畫下一格的時間（大約每 16.7 毫秒），才做畫面更新 → 再拿下一個任務。</figcaption></figure>
<p>用一段程式走一次：</p>
<pre><code>console.log('A');
setTimeout(() =&gt; console.log('B'), 0);
Promise.resolve().then(() =&gt; {
  console.log('C');
  Promise.resolve().then(() =&gt; console.log('D'));
});
console.log('E');
// 印出：A E C D B</code></pre>
<ol>
<li>整段程式本身就是一個任務。印出 A；<code>setTimeout</code> 把 B 排進<b>任務佇列</b>；<code>.then</code> 把 C 那段排進<b>微任務佇列</b>；印出 E。這個任務結束。</li>
<li>清空微任務：執行 C 那段，印出 C，順手又排了一個微任務 D。規則是「全部清空，包含途中新加的」，所以接著印出 D。</li>
<li>微任務空了。（也許畫一格畫面。）回任務佇列拿下一個：印出 B。</li>
</ol>
<p>就算 <code>setTimeout</code> 寫 0，B 還是排在所有微任務後面。而且巢狀超過 5 層的計時器，瀏覽器會強制至少延遲 4 毫秒。</p>
<h4>三個從這張圖推出來的坑</h4>
<ul>
<li><b>await 不會讓出畫面</b>：在迴圈裡 <code>await</code> 一個已經完成的 Promise，後面的部分是排成<b>微任務</b>，不是任務。一萬圈跑完之前，畫面一格都不會更新，跟同步迴圈一樣卡。要真的讓出主執行緒，得排一個任務，例如 <code>await new Promise(r =&gt; setTimeout(r, 0))</code>；較新的 Chromium 有 <code>scheduler.yield()</code> 專門做這件事。</li>
<li><b>微任務可以餓死畫面</b>：一個不斷產生新微任務的 Promise 鏈，會讓事件迴圈永遠停在第 ② 步，頁面整個凍住。</li>
<li><b>長任務毀掉 INP</b>：超過 50 毫秒的任務叫長任務。使用者在它跑的時候點了按鈕，點擊事件只能在任務佇列裡等，反應時間就是 INP 量到的那個數字。重活切小塊，或丟給 Web Worker。</li>
</ul>
<p>還有一個遊戲開發一定會碰到的：<b>分頁切到背景</b>，<code>requestAnimationFrame</code> 就停了，計時器也被大幅降頻（至少一秒一次，Chrome 隱藏夠久之後，連鎖的計時器可能一分鐘才跑一次）。遊戲迴圈要靠 rAF 跑，並監聽 <code>visibilitychange</code>：切回來時，用伺服器的狀態重新同步，不要試圖補跑錯過的每一格。</p>

<h3><span class="badge lv3">專業</span>四、同源政策與 CORS：擋的是「讀」，不是「送」</h3>
<p>同源政策最常被誤解的地方是：它主要限制的是<b>讀</b>。</p>
<table>
<tr><th>跨來源做這件事</th><th>可以嗎</th></tr>
<tr><td>用 <code>&lt;img&gt;</code>、<code>&lt;script&gt;</code>、<code>&lt;link&gt;</code>、<code>&lt;video&gt;</code> 嵌入別人的資源</td><td>可以，這是網頁的本質</td></tr>
<tr><td>用 <code>&lt;form&gt;</code> 把 POST 送到別的網站</td><td>可以，而且會帶上對方的 Cookie（看 SameSite）</td></tr>
<tr><td>用 <code>fetch</code> 送請求</td><td>簡單請求送得出去，但<b>讀不到回應</b>，除非對方用 CORS 同意</td></tr>
<tr><td>讀別的來源 iframe 裡的 DOM、localStorage</td><td>不行</td></tr>
<tr><td>把別的來源的圖片畫進 canvas 再讀像素</td><td>2D canvas 會被「汙染」，讀像素時丟錯誤；WebGL 直接拒絕把它當材質</td></tr>
</table>
<p>「擋讀不擋送」是理解 CSRF 的關鍵：攻擊網站讀不到你銀行的回應，但它送得出去轉帳的請求。所以伺服器要自己防（第五節的 SameSite 和模組 5 的 CSRF token）。</p>
<h4>CORS 的兩種流程</h4>
<p><b>簡單請求</b>（GET、HEAD，或 POST 但 Content-Type 只能是表單或純文字三種，而且沒有自訂標頭）會直接送出，瀏覽器收到回應後，看有沒有 <code>Access-Control-Allow-Origin</code>，決定要不要交給你的 JavaScript。其他的，例如送 JSON、帶 <code>Authorization</code> 標頭、用 PUT 或 DELETE，瀏覽器會先送一個<b>預檢請求</b>（preflight）問清楚：</p>
<figure class="figure"><svg viewBox="0 0 680 290" class="fg" style="width:100%;max-width:680px" role="img" aria-label="CORS 預檢流程：瀏覽器先送 OPTIONS 詢問，伺服器回 204 和允許的來源、方法、標頭，瀏覽器才送出真正的 POST，最後檢查回應標頭後才交給 JavaScript">
<rect x="70" y="14" width="160" height="40" rx="6" class="fg-b alt"/><text x="150" y="32" text-anchor="middle" class="fg-t">瀏覽器</text><text x="150" y="47" text-anchor="middle" class="fg-t sm">頁面在 game.example</text>
<rect x="450" y="14" width="160" height="40" rx="6" class="fg-b alt"/><text x="530" y="32" text-anchor="middle" class="fg-t">API 伺服器</text><text x="530" y="47" text-anchor="middle" class="fg-t sm">api.example</text>
<line x1="150" y1="54" x2="150" y2="284" class="fg-l dim"/><line x1="530" y1="54" x2="530" y2="284" class="fg-l dim"/>
<text x="340" y="74" text-anchor="middle" class="fg-t sm mono">① OPTIONS /scores（預檢）</text>
<text x="340" y="90" text-anchor="middle" class="fg-t sm">問：這個來源能用 POST、能帶 content-type 嗎？</text>
<line x1="150" y1="100" x2="522" y2="100" class="fg-l alt"/><polygon points="530,100 522,95.5 522,104.5" class="fg-a alt"/>
<text x="340" y="132" text-anchor="middle" class="fg-t sm mono">② 204，Allow-Origin: https://game.example</text>
<text x="340" y="148" text-anchor="middle" class="fg-t sm mono">Allow-Methods: POST，Allow-Headers: content-type</text>
<line x1="158" y1="158" x2="530" y2="158" class="fg-l alt"/><polygon points="150,158 158,153.5 158,162.5" class="fg-a alt"/>
<text x="340" y="198" text-anchor="middle" class="fg-t sm mono">③ POST /scores（真正的請求）</text>
<line x1="150" y1="208" x2="522" y2="208" class="fg-l on"/><polygon points="530,208 522,203.5 522,212.5" class="fg-a on"/>
<text x="340" y="244" text-anchor="middle" class="fg-t sm mono">④ 200 OK，帶著 Allow-Origin</text>
<text x="340" y="260" text-anchor="middle" class="fg-t sm">瀏覽器檢查通過，才把回應交給你的 JS</text>
<line x1="158" y1="270" x2="530" y2="270" class="fg-l on"/><polygon points="150,270 158,265.5 158,274.5" class="fg-a on"/>
</svg><figcaption>藍色是預檢，綠色是真正的請求。預檢的答案可以快取一段時間（Access-Control-Max-Age），不用每次都問。</figcaption></figure>
<h4>在正式環境最常見的四個 CORS 問題</h4>
<ul>
<li><b>預檢被身分驗證擋掉</b>：OPTIONS 請求不會帶你的 <code>Authorization</code> 標頭，驗證中介層卻回 401，瀏覽器就報 CORS 錯誤。OPTIONS 要在驗證之前處理掉。</li>
<li><b>帶 Cookie 時不能用 *</b>：<code>fetch</code> 設了 <code>credentials: 'include'</code>，伺服器就必須回明確的來源，加上 <code>Access-Control-Allow-Credentials: true</code>，不能用 <code>*</code>。</li>
<li><b>照抄 Origin 標頭</b>：為了省事，把請求的 Origin 原封不動回在 Allow-Origin 裡，再開 Allow-Credentials。這等於允許<b>任何網站</b>帶著使用者的 Cookie 讀他的資料，是真正的資安漏洞。要用白名單比對。</li>
<li><b>CDN 快取錯了</b>：回應依 Origin 不同而不同，卻沒有加 <code>Vary: Origin</code>，CDN 把給 A 網站的回應快取起來，B 網站拿到就失敗。</li>
</ul>
<p>最後記住：CORS 保護的是<b>使用者的資料不被別的網站讀走</b>，不是保護你的伺服器。<code>curl</code> 和後端程式根本不看 CORS。看到 CORS 錯誤時，簡單請求其實已經在伺服器上執行完了，只是瀏覽器不讓你讀結果。</p>

<h3><span class="badge lv3">專業</span>五、Cookie：每個屬性都是一道防線</h3>
<pre><code>Set-Cookie: __Host-sid=8f2c…; Path=/; Secure;
            HttpOnly; SameSite=Lax; Max-Age=86400
（實際上是同一行，這裡為了好讀折成兩行）</code></pre>
<table>
<tr><th>屬性</th><th>作用</th></tr>
<tr><td><code>Secure</code></td><td>只在 HTTPS 上送。</td></tr>
<tr><td><code>HttpOnly</code></td><td>JavaScript 的 <code>document.cookie</code> 讀不到。就算頁面被注入惡意程式（XSS），也偷不走這個值。</td></tr>
<tr><td><code>Domain</code></td><td>不寫：只送回設定它的那台主機。寫了：連子網域都送，範圍變大。</td></tr>
<tr><td><code>SameSite</code></td><td>從別的網站發起的請求，要不要帶上它。下面細講。</td></tr>
<tr><td><code>__Host-</code> 前綴</td><td>瀏覽器強制它必須 Secure、Path=/、不能寫 Domain，子網域沒辦法覆蓋它。session Cookie 很適合用。</td></tr>
</table>
<h4>先分清楚 origin 和 site</h4>
<p>SameSite 看的是<b>站點</b>（site），不是來源（origin）。站點是「協定＋可註冊的網域」：<code>https://app.example.com</code> 和 <code>https://api.example.com</code> 是不同的來源，卻是同一個站點。哪些網域「可註冊」，由一份公開的清單（Public Suffix List）決定，例如 <code>github.io</code> 在清單上，所以 <code>alice.github.io</code> 和 <code>bob.github.io</code> 是不同的站點。</p>
<table>
<tr><th>請求是怎麼發生的（送往你的網站）</th><th>Strict</th><th>Lax</th><th>None</th></tr>
<tr><td>使用者就在你的網站上操作</td><td>帶</td><td>帶</td><td>帶</td></tr>
<tr><td>從別的網站點連結過來（整頁跳轉的 GET）</td><td>不帶</td><td>帶</td><td>帶</td></tr>
<tr><td>別的網站的表單 POST 到你這裡</td><td>不帶</td><td>不帶</td><td>帶</td></tr>
<tr><td>別的網站用 fetch、img、iframe 載入你的東西</td><td>不帶</td><td>不帶</td><td>帶</td></tr>
</table>
<ul>
<li><b>Lax</b> 是大多數網站的好預設：跨站的 POST 不帶 Cookie，大部分 CSRF 就失效了；從別處點連結進來，還是登入狀態。Chrome 從 2020 年起，把沒寫 SameSite 的 Cookie 當成 Lax；其他瀏覽器的預設不完全一樣，所以要自己寫清楚。</li>
<li><b>Strict</b> 最嚴，但使用者從信件裡的連結點進來，第一頁會看起來像沒登入。</li>
<li><b>None</b> 必須同時加 <code>Secure</code>，用在真的需要跨站的情境。</li>
<li><b>SameSite 不是萬靈丹</b>：它把同一個站點的子網域都當自己人。某個子網域被接管（例如一個忘了刪的 DNS 記錄指向已經釋出的雲端資源），攻擊者就是「同站」，SameSite 擋不住。重要的操作仍然要 CSRF token，而且不要用 GET 改資料。</li>
</ul>
<p><b>第三方 Cookie</b>：你的遊戲被嵌在別人網站的 iframe 裡時，你的 Cookie 就是第三方 Cookie。Safari 預設封鎖，Firefox 會依外層網站把它隔開，Chrome 在 2024 到 2025 年間改變計畫，目前預設仍然允許（使用者可以自己關）。要在 iframe 裡穩定運作，可以用 <code>Partitioned</code> 屬性（CHIPS，每個外層網站各存一份），或改用不依賴 Cookie 的權杖登入。</p>

<h3><span class="badge lv3">專業</span>六、行程隔離：每個網站關在自己的房間</h3>
<figure class="figure"><svg viewBox="0 0 680 280" class="fg" style="width:100%;max-width:680px" role="img" aria-label="Chrome 的行程架構：瀏覽器行程是總管，旁邊有 GPU 行程和網路服務；每個網站在自己的渲染行程裡，跨站的 iframe 也分開；渲染行程只能透過 IPC 向總管要東西">
<rect x="20" y="20" width="150" height="56" rx="6" class="fg-b"/><text x="95" y="44" text-anchor="middle" class="fg-t">GPU 行程</text><text x="95" y="64" text-anchor="middle" class="fg-t sm">替大家畫圖</text>
<rect x="200" y="20" width="280" height="56" rx="6" class="fg-b alt"/><text x="340" y="44" text-anchor="middle" class="fg-t alt">瀏覽器行程（總管）</text><text x="340" y="64" text-anchor="middle" class="fg-t sm">網址列、分頁、權限、Cookie</text>
<rect x="510" y="20" width="150" height="56" rx="6" class="fg-b"/><text x="585" y="44" text-anchor="middle" class="fg-t">網路服務</text><text x="585" y="64" text-anchor="middle" class="fg-t sm">DNS、連線、快取</text>
<line x1="170" y1="48" x2="200" y2="48" class="fg-l"/><line x1="480" y1="48" x2="510" y2="48" class="fg-l"/>
<line x1="340" y1="76" x2="340" y2="112" class="fg-l dash"/>
<line x1="115" y1="112" x2="565" y2="112" class="fg-l dash"/>
<line x1="115" y1="112" x2="115" y2="142" class="fg-l dash"/><polygon points="115,150 110.5,142 119.5,142" class="fg-a"/>
<line x1="340" y1="112" x2="340" y2="142" class="fg-l dash"/><polygon points="340,150 335.5,142 344.5,142" class="fg-a"/>
<line x1="565" y1="112" x2="565" y2="142" class="fg-l dash"/><polygon points="565,150 560.5,142 569.5,142" class="fg-a"/>
<text x="228" y="104" text-anchor="middle" class="fg-t sm">IPC：什麼都要跟總管要</text>
<rect x="20" y="150" width="190" height="80" rx="6" class="fg-b hot"/><text x="115" y="172" text-anchor="middle" class="fg-t acc">渲染行程</text><text x="115" y="192" text-anchor="middle" class="fg-t sm mono">game.example</text><text x="115" y="212" text-anchor="middle" class="fg-t sm">主頁面</text>
<rect x="245" y="150" width="190" height="80" rx="6" class="fg-b hot"/><text x="340" y="172" text-anchor="middle" class="fg-t acc">渲染行程</text><text x="340" y="192" text-anchor="middle" class="fg-t sm mono">ads.example</text><text x="340" y="212" text-anchor="middle" class="fg-t sm">嵌在裡面的跨站 iframe</text>
<rect x="470" y="150" width="190" height="80" rx="6" class="fg-b hot"/><text x="565" y="172" text-anchor="middle" class="fg-t acc">渲染行程</text><text x="565" y="192" text-anchor="middle" class="fg-t sm mono">bank.example</text><text x="565" y="212" text-anchor="middle" class="fg-t sm">另一個分頁</text>
<text x="340" y="262" text-anchor="middle" class="fg-t sm warm">就算攻破了 ads.example 的渲染行程，也讀不到另外兩個行程的記憶體</text>
</svg><figcaption>渲染行程跑 HTML、CSS、JavaScript，是最容易被攻擊的部分，所以權限最少：不能讀檔案、不能自己上網，要什麼都得透過 IPC 跟總管要，總管再檢查它有沒有資格。</figcaption></figure>
<p>2018 年的 Spectre 漏洞證明了一件事：同一個行程裡的程式，有機會透過 CPU 的推測執行讀到同行程裡的任何記憶體（第 0.6 課的深入圖解提過）。所以 Chrome 推出<b>站點隔離</b>（site isolation）：不同站點，包括嵌在頁面裡的跨站 iframe，一律放進不同的渲染行程。代價是記憶體，這就是 Chrome 為什麼這麼吃記憶體；記憶體比較少的手機上，Chrome 只對部分網站做完整隔離。</p>
<p>Spectre 還留下兩個你在做遊戲時會碰到的限制：高精度計時器被刻意降低解析度，而 <code>SharedArrayBuffer</code>（多執行緒共用記憶體）只有在頁面是<b>跨來源隔離</b>（cross-origin isolated）時才能用。條件是主頁面回應帶上這兩個標頭：</p>
<pre><code>Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp</code></pre>
<p>開了之後，頁面上每一個跨來源的資源（CDN 上的圖片、第三方的 script）都必須明確同意被嵌入（CORS 或 <code>Cross-Origin-Resource-Policy</code> 標頭），否則載不進來。在主控台輸入 <code>crossOriginIsolated</code>，回 true 才算成功。WebAssembly 的多執行緒就靠它。</p>

<h3><span class="badge lv4">專家</span>七、瀏覽器記住的東西，和 Service Worker 的一生</h3>
<p>上一課的儲存表格再補幾個專業細節：</p>
<ul>
<li><b>都是依來源分開的</b>，而且現代瀏覽器在第三方情境下（被嵌在 iframe 裡）還會再依外層網站分開，叫<b>儲存分區</b>（storage partitioning）。</li>
<li><b>配額看磁碟大小</b>，用 <code>navigator.storage.estimate()</code> 查。預設是「盡力保存」：磁碟吃緊時，瀏覽器可以整個來源一起清掉。<code>navigator.storage.persist()</code> 可以申請不被自動清除。</li>
<li><b>Safari 的七天規則</b>：網站如果在使用瀏覽器的七天裡都沒被使用者互動過，Safari 會刪掉它所有用程式寫的儲存（localStorage、IndexedDB、Service Worker 註冊和快取）。加到主畫面的網頁 App 不受影響。網頁遊戲的存檔只放在瀏覽器裡，就可能哪天整個消失；重要的進度要存在伺服器。</li>
<li><b>localStorage 是同步的</b>：讀寫都卡主執行緒，只能存字串，大約 5 MB。大量或結構化的資料用 IndexedDB；需要像檔案一樣快速讀寫（例如在瀏覽器裡跑 SQLite），用 OPFS（Origin Private File System）。</li>
</ul>
<h4>Service Worker：擋在頁面和網路中間的一支程式</h4>
<figure class="figure"><svg viewBox="0 0 680 170" class="fg" style="width:100%;max-width:680px" role="img" aria-label="Service Worker 的生命週期：安裝中、等待中、啟用中、運作中、淘汰；新版在等待中會停住，直到所有用舊版的分頁都關掉，或呼叫 skipWaiting">
<line x1="70" y1="14" x2="70" y2="62" class="fg-l"/><polygon points="70,70 65.5,62 74.5,62" class="fg-a"/>
<text x="80" y="24" class="fg-t sm">導覽時發現 sw.js 內容變了</text>
<rect x="10" y="70" width="120" height="50" rx="6" class="fg-b"/><text x="70" y="91" text-anchor="middle" class="fg-t">安裝中</text><text x="70" y="110" text-anchor="middle" class="fg-t sm">install：預先快取</text>
<rect x="145" y="70" width="120" height="50" rx="6" class="fg-b warm"/><text x="205" y="91" text-anchor="middle" class="fg-t warm">等待中</text><text x="205" y="110" text-anchor="middle" class="fg-t sm">舊版還在管分頁</text>
<rect x="280" y="70" width="120" height="50" rx="6" class="fg-b"/><text x="340" y="91" text-anchor="middle" class="fg-t">啟用中</text><text x="340" y="110" text-anchor="middle" class="fg-t sm">activate：清舊快取</text>
<rect x="415" y="70" width="120" height="50" rx="6" class="fg-b hot"/><text x="475" y="91" text-anchor="middle" class="fg-t acc">運作中</text><text x="475" y="110" text-anchor="middle" class="fg-t sm">攔截每個 fetch</text>
<rect x="550" y="70" width="120" height="50" rx="6" class="fg-b"/><text x="610" y="91" text-anchor="middle" class="fg-t">淘汰</text><text x="610" y="110" text-anchor="middle" class="fg-t sm">被下一版取代</text>
<line x1="130" y1="95" x2="137" y2="95" class="fg-l"/><polygon points="145,95 137,90.5 137,99.5" class="fg-a"/>
<line x1="265" y1="95" x2="272" y2="95" class="fg-l warm"/><polygon points="280,95 272,90.5 272,99.5" class="fg-a warm"/>
<line x1="400" y1="95" x2="407" y2="95" class="fg-l"/><polygon points="415,95 407,90.5 407,99.5" class="fg-a"/>
<line x1="535" y1="95" x2="542" y2="95" class="fg-l"/><polygon points="550,95 542,90.5 542,99.5" class="fg-a"/>
<text x="272" y="48" text-anchor="middle" class="fg-t sm warm">舊分頁全關了，或呼叫 skipWaiting() 才往下走</text>
<line x1="272" y1="56" x2="272" y2="88" class="fg-l warm dash"/>
<text x="205" y="146" text-anchor="middle" class="fg-t sm warm">重新整理不算：新舊頁面會短暫重疊</text>
<text x="475" y="146" text-anchor="middle" class="fg-t sm">同一個來源、範圍內的所有請求</text>
</svg><figcaption>新版的 sw.js 下載、安裝完，不會馬上接手，而是停在「等待中」。在那之前，舊版會繼續用它快取的舊檔案回應每一個請求。</figcaption></figure>
<p>這就是「我明明部署了新版，使用者卻一直看到舊的」的機制。舊的 Service Worker 還在運作中，它攔截 <code>index.html</code> 的請求，從自己的快取拿出舊版回給你；新版在後面排隊，要等所有被舊版控制的分頁都關掉。按重新整理沒用，因為新頁面開始載入時，舊頁面還沒關。</p>
<ul>
<li><b>想立刻接手</b>：新版在 install 時呼叫 <code>self.skipWaiting()</code>，activate 時呼叫 <code>clients.claim()</code>。風險是：一個已經開著的舊頁面，下一個請求開始拿到新版的檔案，前後版本混在一起。比較穩的做法是提示使用者「有新版，按這裡重新載入」。</li>
<li><b>要整個拿掉</b>：部署一支只做一件事的 sw.js：註冊後立刻 <code>self.registration.unregister()</code>。或者讓伺服器回 <code>Clear-Site-Data: "storage"</code> 標頭（支援的瀏覽器會清掉這個來源的所有儲存，包含 Service Worker）。開發時，DevTools 的 Application 分頁可以手動 Unregister。</li>
<li><b>範圍是依來源算的</b>：一個來源上的 Service Worker，會攔截這個來源（在它的範圍內）的所有請求，不管那是哪一個專案的頁面。</li>
</ul>

<h3><span class="badge lv4">專家</span>八、WebGL 和 WebAssembly 遊戲：在瀏覽器裡跑一個引擎</h3>
<p>一個 Unity 的 WebGL 建置（或任何用 Emscripten 編譯的 C、C++ 程式）在瀏覽器裡是這樣跑起來的：一支載入用的 JavaScript 去抓 <code>.wasm</code>（程式碼）和 <code>.data</code>（資源），用 <code>WebAssembly.instantiateStreaming</code> 一邊下載一邊編譯成機器碼，配置一大塊<b>線性記憶體</b>，然後每一格由 <code>requestAnimationFrame</code> 呼叫一次引擎的主迴圈，透過 WebGL 把畫面畫在 canvas 上。Cocos Creator 的網頁版則主要是 JavaScript 跑在 V8 上，部分模組（例如物理引擎）用 WebAssembly。</p>
<figure class="figure"><svg viewBox="0 0 680 260" class="fg" style="width:100%;max-width:680px" role="img" aria-label="網頁遊戲的記憶體：分頁的渲染行程裡有 JS 堆積和 WebAssembly 線性記憶體，後者只能變大不能縮，上限 4 GB；材質和緩衝放在另外的 GPU 行程">
<rect x="10" y="10" width="470" height="240" rx="10" class="fg-b"/>
<text x="26" y="32" class="fg-t lg">分頁的渲染行程</text>
<rect x="26" y="44" width="270" height="60" rx="6" class="fg-b hot"/><text x="161" y="68" text-anchor="middle" class="fg-t acc">遊戲迴圈</text><text x="161" y="88" text-anchor="middle" class="fg-t sm">rAF 每一格呼叫一次 wasm 的主迴圈</text>
<rect x="320" y="44" width="146" height="60" rx="6" class="fg-b alt"/><text x="393" y="68" text-anchor="middle" class="fg-t alt">JS 堆積（V8）</text><text x="393" y="88" text-anchor="middle" class="fg-t sm">載入器、膠水程式</text>
<line x1="393" y1="104" x2="393" y2="140" class="fg-l"/><polygon points="393,148 388.5,140 397.5,140" class="fg-a"/>
<text x="400" y="128" class="fg-t sm">直接讀寫</text>
<text x="26" y="136" class="fg-t">WebAssembly 線性記憶體：一個大 ArrayBuffer</text>
<rect x="26" y="148" width="70" height="44" class="fg-b"/><text x="61" y="174" text-anchor="middle" class="fg-t sm">靜態資料</text>
<rect x="96" y="148" width="50" height="44" class="fg-b"/><text x="121" y="174" text-anchor="middle" class="fg-t sm">堆疊</text>
<rect x="146" y="148" width="170" height="44" class="fg-b hot"/><text x="231" y="174" text-anchor="middle" class="fg-t sm">堆積：遊戲的物件、資源</text>
<rect x="316" y="148" width="150" height="44" class="fg-l dim dash"/><text x="391" y="174" text-anchor="middle" class="fg-t sm">還沒用到</text>
<line x1="320" y1="206" x2="458" y2="206" class="fg-l warm"/><polygon points="466,206 458,201.5 458,210.5" class="fg-a warm"/>
<text x="390" y="224" text-anchor="middle" class="fg-t sm warm">memory.grow：只增不減</text>
<text x="26" y="210" class="fg-t sm">0</text>
<text x="466" y="242" text-anchor="end" class="fg-t sm">上限 4 GB（32 位元位址）</text>
<rect x="510" y="60" width="160" height="110" rx="8" class="fg-b warm"/>
<text x="590" y="86" text-anchor="middle" class="fg-t warm">GPU 行程</text>
<text x="590" y="112" text-anchor="middle" class="fg-t sm">材質、頂點緩衝</text>
<text x="590" y="132" text-anchor="middle" class="fg-t sm">收 WebGL 指令</text>
<text x="590" y="152" text-anchor="middle" class="fg-t sm">記憶體算在這裡</text>
<path d="M296 74 H306 V35 H590 V52" class="fg-l dash"/><polygon points="590,60 585.5,52 594.5,52" class="fg-a"/>
<text x="400" y="28" text-anchor="middle" class="fg-t sm">WebGL 呼叫，經 IPC 送出</text>
</svg><figcaption>一個網頁遊戲至少有三塊記憶體：JS 堆積、WebAssembly 線性記憶體、GPU 的材質和緩衝。線性記憶體長大了就縮不回去，峰值用了多少，就一直佔著多少。</figcaption></figure>
<h4>記憶體的四道牆</h4>
<ol>
<li><b>32 位元位址</b>：一般的 WebAssembly 用 32 位元位址，線性記憶體最多 65,536 頁 × 64 KB = 4 GB（第 0.8 課提過）。64 位元版本（Memory64）已經標準化，但引擎和瀏覽器的普及還在路上。</li>
<li><b>只增不減</b>：<code>memory.grow</code> 只能變大，標準裡沒有縮小。載入一張大地圖時衝到 1.5 GB，換回小地圖，這 1.5 GB 還是佔著，直到重新整理。而且每次長大，舊的 ArrayBuffer 會失效，JavaScript 那邊所有指向它的 TypedArray 都要重建（Emscripten 會幫你做）。</li>
<li><b>行動裝置的分頁上限</b>：手機上整個分頁能用的記憶體小得多，超過了，作業系統直接把分頁砍掉。iOS 上的表現是頁面突然重新載入，嚴重時顯示「這個網頁重複發生問題」。這比 wasm 自己的上限更早撞到。</li>
<li><b>GPU 記憶體</b>：一張 2048 × 2048 的 RGBA 材質，解壓後就是 16 MB，加上 mipmap 約 21 MB，不管原本的 PNG 檔案多小。改用 GPU 壓縮格式（例如 ASTC 4×4）只要 4 MB。GPU 記憶體不夠或驅動重置時，canvas 會收到 <code>webglcontextlost</code> 事件，要能接住並重新上傳資源。</li>
</ol>
<p>實務上的對策：Unity 的 WebGL 播放器設定裡可以調初始和最大記憶體，先量出真實的峰值再設；大型資源分批載入、用完就釋放，把峰值壓低；材質用壓縮格式；在 DevTools 的 Memory 面板裡，JS 堆積和 wasm 記憶體是分開看的。</p>
<h4>其他會卡住你的事</h4>
<ul>
<li><b>伺服器設定</b>：<code>.wasm</code> 要用 <code>Content-Type: application/wasm</code> 回應，<code>instantiateStreaming</code> 才能邊下載邊編譯；壓縮過的檔案要配正確的 <code>Content-Encoding</code>，不然瀏覽器只能退回比較慢的路，或乾脆失敗。</li>
<li><b>多執行緒</b>：WebAssembly 的執行緒用 SharedArrayBuffer，所以頁面必須跨來源隔離（第六節那兩個標頭），嵌在別人網站 iframe 裡的遊戲就更麻煩。</li>
<li><b>聲音</b>：瀏覽器的自動播放政策規定，<code>AudioContext</code> 一開始是暫停的，要在使用者第一次點擊或觸控時呼叫 <code>resume()</code>。</li>
<li><b>跨來源的材質</b>：圖片放在另一個網域的 CDN，要回 CORS 標頭，載入時設 <code>crossOrigin = 'anonymous'</code>，否則 WebGL 拒絕上傳（第四節表格最後一列）。</li>
</ul>

<h3>九、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>CORS 是用來保護伺服器的</td><td>CORS 保護的是使用者的資料不被其他網站讀走。<code>curl</code> 和後端程式根本不看它，伺服器仍要自己驗證身分。</td></tr>
<tr><td>出現 CORS 錯誤，代表請求沒送到伺服器</td><td>簡單請求已經送到、也執行了，只是回應不給你讀。預檢失敗的情況，真正的請求才沒有送出。</td></tr>
<tr><td>async／await 讓程式在背景跑</td><td>還是在同一條主執行緒上。await 之後的部分只是排成微任務，該卡還是卡。</td></tr>
<tr><td><code>setTimeout(fn, 0)</code> 會立刻執行</td><td>要等目前的任務和所有微任務跑完，巢狀太深還會被延到至少 4 毫秒，背景分頁更久。</td></tr>
<tr><td>用 top、left 和用 transform 做動畫都一樣</td><td>top、left 每一格都要重算版面；transform 只要重新合成，還能在合成執行緒上跑。</td></tr>
<tr><td>部署了新版，使用者重新整理就會看到</td><td>Service Worker 或 HTTP 快取可能還在回舊檔案。新版 Service Worker 要等舊分頁全部關掉才接手。</td></tr>
</table>

<h3>十、跟你的工作連起來</h3>
<ul>
<li><b>Vue／TypeScript 前端</b>：量 LCP 和 INP，而不是只看「我的電腦很快」；長的同步運算切小或丟給 Worker；動畫只動 transform 和 opacity；避免在迴圈裡寫完又讀版面。</li>
<li><b>Node.js／Go 後端</b>：CORS 用白名單、在驗證之前處理 OPTIONS、加 <code>Vary: Origin</code>；session Cookie 用 <code>__Host-</code>、<code>Secure</code>、<code>HttpOnly</code>、<code>SameSite=Lax</code>。</li>
<li><b>Cocos／Unity 網頁遊戲</b>：rAF 驅動遊戲迴圈，切背景後用伺服器狀態重新同步；量出記憶體峰值；材質用壓縮格式；聲音在第一次觸控時解鎖；被嵌進 iframe 時注意第三方 Cookie。</li>
<li><b>部署、CDN</b>：<code>index.html</code> 不要長時間快取，帶雜湊值的 JS、CSS 檔名才長時間快取；<code>.wasm</code> 的 Content-Type 和壓縮標頭要對；用了 Service Worker 就要準備好更新和移除的流程。</li>
</ul>

<h3>十一、面試會怎麼問</h3>
<p>先自己講一遍，再打開參考答案。</p>
<ol>
<li>「從輸入網址到看到畫面，瀏覽器這一側發生了什麼？」</li>
<li>「重排（reflow）和重繪（repaint）是什麼？怎麼避免不必要的重排？」</li>
<li>「解釋事件迴圈。這段程式會印出什麼？」（第三節那段 A、B、C、D、E）</li>
<li>「CORS 是什麼？為什麼有預檢請求？你看過哪些設定錯誤？」</li>
<li>「SameSite=Lax 和 Strict 差在哪？有了 SameSite，還需要 CSRF token 嗎？」</li>
<li>「一個 Unity WebGL 遊戲在手機瀏覽器上玩一陣子，整頁就重新載入。你會怎麼查？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>先檢查 Service Worker 和 HTTP 快取；沒有命中就做 DNS、TCP、TLS，送出請求，等 TTFB。HTML 邊收邊解析成 DOM，預載掃描器提早抓 CSS、JS、圖片；CSS 解析成 CSSOM，在它到之前不畫面；一般 script 會擋住解析，defer 和 module 在解析完才執行。接著計算樣式、版面、繪製、合成，出現 FCP；DOM 完成觸發 DOMContentLoaded，最大內容畫出來是 LCP，所有資源載完是 load。</li>
<li>重排是重新計算元素的大小和位置（layout），重繪是重新畫出像素（paint）。改尺寸、位置、字型或增減 DOM 會觸發重排，連帶重繪和合成；只改顏色只會重繪；transform、opacity 只需要合成。避免方法：動畫用 transform 和 opacity；批次讀寫 DOM，不要寫完立刻讀 offsetWidth 之類的版面值；減少大範圍的 DOM 變動；必要時把常動的元素放到自己的圖層。</li>
<li>主執行緒每次從任務佇列拿一個任務執行到完，接著清空微任務佇列（包含途中新增的），到了畫面更新時機才執行 rAF、樣式、版面、繪製，再拿下一個任務。那段程式先同步印出 A、E；C 是微任務，執行時又加了微任務 D，一起清空；B 是 setTimeout 的任務，最後執行，所以是 A E C D B。</li>
<li>CORS 是伺服器用回應標頭告訴瀏覽器「哪些來源可以讀我的回應」的機制，放寬同源政策。非簡單請求（例如送 JSON、帶 Authorization、用 PUT 或 DELETE）會先送 OPTIONS 預檢，確認來源、方法、標頭都被允許，才送真正的請求，避免舊伺服器收到它沒預期的跨站請求。常見錯誤：驗證中介層擋掉 OPTIONS、帶憑證卻回 *、照抄 Origin 加上 Allow-Credentials 造成任何網站都能讀使用者資料、少了 Vary: Origin 讓 CDN 快取錯誤的標頭。</li>
<li>Strict 只要請求不是從同一個站點發起就不帶 Cookie，連從外部點連結進來也不帶；Lax 允許跨站的頂層 GET 導覽帶 Cookie，但跨站的 POST、iframe、fetch 不帶。SameSite 擋掉了大部分 CSRF，但它把同一個站點的子網域都當成自己人，子網域被接管就失效，舊瀏覽器的預設也不一致，而且用 GET 改資料仍然會被利用。所以敏感操作仍應使用 CSRF token，並遵守 GET 不改資料。</li>
<li>先懷疑記憶體：手機上分頁超過系統允許的記憶體會被直接砍掉，頁面就重新載入。在桌機的 DevTools 重現同樣的遊玩流程，分別看 JS 堆積、wasm 線性記憶體（它只增不減，要看峰值）和 GPU 材質用量，找出是哪個場景或資源讓峰值衝高。對策：降低最大記憶體設定前先降峰值、分批載入並釋放資源、材質改用壓縮格式、減少同時存在的大型資源；同時處理 webglcontextlost，並確保進度存在伺服器。</li>
</ol>
</details>

<h3>十二、練功題（做得出來才算真的懂）</h3>
<ol>
<li>不要執行，先寫下輸出順序：<code>setTimeout(() =&gt; console.log(1), 0); queueMicrotask(() =&gt; console.log(2)); (async () =&gt; { console.log(3); await null; console.log(4); })(); console.log(5);</code></li>
<li>下面四個 <code>fetch</code>，從 <code>https://game.example</code> 打到 <code>https://api.example</code>，哪些會觸發預檢？(a) 不帶任何自訂標頭的 GET；(b) POST，body 是 JSON；(c) GET，帶 <code>Authorization</code> 標頭；(d) POST，body 是 <code>application/x-www-form-urlencoded</code>。</li>
<li>判斷每一組是不是同源、是不是同站：(a) <code>https://a.example.com</code> 和 <code>https://b.example.com</code>；(b) <code>http://example.com</code> 和 <code>https://example.com</code>；(c) <code>https://alice.github.io</code> 和 <code>https://bob.github.io</code>；(d) <code>https://example.com:443</code> 和 <code>https://example.com</code>。</li>
<li>一個 Cookie 設了 <code>SameSite=Lax</code>，屬於 <code>shop.example</code>。在 <code>other.example</code> 的頁面上：使用者點連結到 <code>shop.example/cart</code>；一個隱藏表單 POST 到 <code>shop.example/checkout</code>；一個 iframe 載入 <code>shop.example</code>。哪些請求會帶這個 Cookie？</li>
<li>一個遊戲有 40 張 2048 × 2048 的 RGBA 材質，都帶 mipmap。大約佔多少 GPU 記憶體？改成 ASTC 4×4 呢？</li>
<li>把一個用 <code>left</code> 做的左右移動動畫，改寫成只觸發合成的版本，並說明為什麼在主執行緒忙的時候，它仍然會順。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li><code>3 5 2 4 1</code>。async 函式在第一個 await 之前是同步執行的，所以先印 3，接著印 5；await 之後的部分排成微任務，排在先前排好的 2 後面，所以是 2、4；setTimeout 是任務，最後才印 1。</li>
<li>(a) 不會；(b) 會，因為 <code>application/json</code> 不在三種簡單 Content-Type 之內；(c) 會，因為 <code>Authorization</code> 不是允許的簡單標頭；(d) 不會。</li>
<li>(a) 不同源、同站；(b) 不同源，協定不同，現代瀏覽器也把它算成不同站；(c) 不同源、不同站，因為 <code>github.io</code> 在 Public Suffix List 上；(d) 同源，443 是 HTTPS 的預設連接埠。</li>
<li>只有點連結的那一次會帶（跨站的頂層 GET 導覽）。表單 POST 和 iframe 都不帶。</li>
<li>每張：2048 × 2048 × 4 = 16 MB，加 mipmap 約 21.3 MB；40 張約 850 MB，在手機上幾乎一定出事。ASTC 4×4 每個像素 1 個位元組：每張 4 MB，加 mipmap 約 5.3 MB，40 張約 213 MB。</li>
<li>把 <code>@keyframes</code> 裡的 <code>left: 0</code> 到 <code>left: 300px</code>，改成 <code>transform: translateX(0)</code> 到 <code>transform: translateX(300px)</code>。transform 不改變版面，元素被放到自己的圖層後，每一格只需要合成；合成在合成執行緒上做，不用等主執行緒，所以 JavaScript 在跑長任務時，動畫還是照樣動。</li>
</ol>
</details>

<h3>十三、想再挖深</h3>
<ul>
<li><b>Mariko Kosaka〈Inside look at modern web browser〉</b>：Chrome 官方部落格上的四篇圖解連載，行程架構、導覽流程、渲染管線、輸入事件，一篇比一篇深。這一章的第一、二、六節，它都有可愛的插圖版。</li>
<li><b>Jake Archibald〈Tasks, microtasks, queues and schedules〉和演講〈In The Loop〉</b>：講事件迴圈最清楚的一篇文章和一場演講（JSConf.Asia 2018），有一步一步的動畫。</li>
<li><b>MDN Web Docs</b>（<a href="https://developer.mozilla.org/">developer.mozilla.org</a>）：CORS、HTTP Cookie、Service Worker API、WebAssembly 的權威說明，連各瀏覽器的支援程度都有。</li>
<li><b>web.dev</b>（<a href="https://web.dev/">web.dev</a>）：Google 的網頁效能教材，Core Web Vitals、渲染效能、Service Worker 的實戰文章都在這裡。</li>
<li><b>HTML Living Standard 的〈Event loops〉章節</b>（html.spec.whatwg.org）：事件迴圈的正式規格。讀過上面的文章再來看，會發現每一步都寫得清清楚楚。</li>
</ul>
` });
