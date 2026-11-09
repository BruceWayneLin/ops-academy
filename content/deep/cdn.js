DEEP({ 'cdn': `
<p>上一課你學到 CDN 的基本樣子：使用者連到最近的邊緣節點，檔名帶雜湊的檔案快取一年，<code>index.html</code> 每次都檢查。這一章把「最近的節點」整個拆開：使用者是怎麼被送過去的、邊緣節點憑什麼判斷「這是同一個檔案」、檔案過期的那一刻發生什麼事、上版順序為什麼不能錯，以及 CDN 在資安和帳單上替你做了什麼、又可能害你什麼。以後你設定 CDN、追查「為什麼使用者還看到舊版」、在面試白板上畫架構，用的都是這一章的東西。</p>

<h3><span class="badge lv1">基礎</span>一、時間都花在哪裡：CDN 省下的是「來回」</h3>
<p>先想像一家只有中央廚房的連鎖餐廳：不管你在台北還是高雄點餐，餐都從同一個廚房出發。CDN 就是在每個城市開分店，熱門的菜先做好放在店裡。你點的店裡有，馬上拿到；店裡沒有，分店再打電話回中央廚房要。</p>
<p>網路上最貴的往往不是頻寬，而是<b>來回時間</b>（round-trip time，RTT）。光在光纖裡每毫秒大約只跑 200 公里，台北到美國西岸一趟來回，物理下限就超過 100 ms；實際路由會繞一點，常見是 130 到 160 ms。更麻煩的是，一個 HTTPS 請求在拿到第一個位元組之前，要先來回好幾趟：</p>
<ol>
<li><b>TCP 交握</b>：一個來回，確認雙方都在。</li>
<li><b>TLS 交握</b>：TLS 1.3 一個來回（TLS 1.2 要兩個），交換金鑰、驗證憑證。</li>
<li><b>請求與回應</b>：再一個來回，才真的拿到資料。</li>
</ol>
<figure class="figure"><svg viewBox="0 0 660 256" class="fg" style="width:100%;max-width:660px" role="img" aria-label="三種情況下拿到第一個位元組要多久：沒有 CDN 約 450 毫秒，CDN 未命中約 165 毫秒，CDN 命中約 15 毫秒">
<text x="150" y="22" class="fg-t sm">拿到第一個位元組之前，時間花在哪裡（單位 ms）</text>
<text x="20" y="54" class="fg-t">沒有 CDN</text>
<text x="20" y="72" class="fg-t sm">直連美西源站</text>
<rect x="150" y="38" width="148" height="36" rx="4" class="fg-b"/><text x="224" y="61" text-anchor="middle" class="fg-t sm">TCP 交握 150</text>
<rect x="300" y="38" width="148" height="36" rx="4" class="fg-b alt"/><text x="374" y="61" text-anchor="middle" class="fg-t sm">TLS 交握 150</text>
<rect x="450" y="38" width="148" height="36" rx="4" class="fg-b warm"/><text x="524" y="61" text-anchor="middle" class="fg-t sm">請求與回應 150</text>
<text x="606" y="61" class="fg-t sm warm">450</text>
<text x="20" y="124" class="fg-t">CDN 未命中</text>
<text x="20" y="142" class="fg-t sm">邊緣去源站拿</text>
<rect x="150" y="108" width="14" height="36" rx="3" class="fg-b hot"/>
<rect x="166" y="108" width="150" height="36" rx="4" class="fg-b warm"/><text x="241" y="131" text-anchor="middle" class="fg-t sm">邊緣到源站 150</text>
<text x="326" y="131" class="fg-t sm">約 165</text>
<text x="20" y="194" class="fg-t">CDN 命中</text>
<text x="20" y="212" class="fg-t sm">檔案就在附近</text>
<rect x="150" y="178" width="14" height="36" rx="3" class="fg-b hot"/>
<text x="174" y="201" class="fg-t sm acc">約 15：交握和檔案都在附近</text>
<line x1="150" y1="232" x2="600" y2="232" class="fg-l dim"/>
<text x="150" y="249" text-anchor="middle" class="fg-t sm">0</text><text x="300" y="249" text-anchor="middle" class="fg-t sm">150</text><text x="450" y="249" text-anchor="middle" class="fg-t sm">300</text><text x="600" y="249" text-anchor="middle" class="fg-t sm">450 ms</text>
</svg><figcaption>同樣是拿一個檔案。綠色小段是跟附近節點做完的交握（三個來回加起來約 15 ms）。未命中時，邊緣和源站之間的連線早就開好，只多一趟長途來回。數字是台北到美西的典型數量級。</figcaption></figure>
<p>CDN 省下的時間有兩個來源。第一，交握都跟附近的節點做，三個 150 ms 變成三個 5 ms。第二，就算邊緣節點沒有這個檔案，它跟源站之間的連線早就開好、一直重複使用（connection reuse），所以只多付一趟長途來回，不用重新交握。這也是為什麼「連 API 都走 CDN」常常會變快，即使 API 的回應根本不快取。</p>
<p>一個頁面不只一個檔案，而且有先後：瀏覽器先拿到 HTML，才知道要拿哪支 JS；JS 跑起來，才知道要拿哪個 JSON 和哪些圖。每多一層「看到了才知道要拿」，就多付一次來回。來回 150 ms 時，三層就將近半秒；來回 10 ms 時，幾乎感覺不到。</p>

<h3><span class="badge lv1">基礎</span>二、使用者怎麼被送到最近的節點：DNS 還是 Anycast</h3>
<p>「連到最近的節點」聽起來理所當然，可是使用者的瀏覽器只知道一個網址。要把台北的人送到台北、東京的人送到東京，業界有兩種做法：</p>
<figure class="figure"><svg viewBox="0 0 660 256" class="fg" style="width:100%;max-width:660px" role="img" aria-label="左邊是 DNS 式導向：CDN 的 DNS 依查詢來源回不同節點的 IP；右邊是 Anycast：所有節點宣告同一個 IP，由網路路由把使用者送到最近的節點">
<line x1="330" y1="10" x2="330" y2="246" class="fg-l dim dash"/>
<text x="165" y="26" text-anchor="middle" class="fg-t lg alt">DNS 式導向</text>
<rect x="20" y="48" width="120" height="40" rx="6" class="fg-b"/><text x="80" y="73" text-anchor="middle" class="fg-t">台北的使用者</text>
<rect x="20" y="150" width="120" height="40" rx="6" class="fg-b"/><text x="80" y="175" text-anchor="middle" class="fg-t">東京的使用者</text>
<rect x="190" y="98" width="124" height="42" rx="6" class="fg-b alt"/><text x="252" y="124" text-anchor="middle" class="fg-t">CDN 的 DNS</text>
<path d="M140 68 H164 V112 H182" class="fg-l"/><polygon points="190,112 182,107.5 182,116.5" class="fg-a"/>
<path d="M140 170 H164 V126 H182" class="fg-l"/><polygon points="190,126 182,121.5 182,130.5" class="fg-a"/>
<text x="80" y="108" text-anchor="middle" class="fg-t sm acc">回：台北節點 IP</text>
<text x="80" y="210" text-anchor="middle" class="fg-t sm acc">回：東京節點 IP</text>
<text x="252" y="160" text-anchor="middle" class="fg-t sm">看查詢從哪裡來</text>
<text x="165" y="238" text-anchor="middle" class="fg-t sm">每個地方拿到不同的 IP</text>
<text x="495" y="26" text-anchor="middle" class="fg-t lg acc">Anycast</text>
<rect x="350" y="48" width="120" height="40" rx="6" class="fg-b"/><text x="410" y="73" text-anchor="middle" class="fg-t">台北的使用者</text>
<rect x="350" y="150" width="120" height="40" rx="6" class="fg-b"/><text x="410" y="175" text-anchor="middle" class="fg-t">東京的使用者</text>
<rect x="530" y="44" width="116" height="48" rx="6" class="fg-b hot"/><text x="588" y="64" text-anchor="middle" class="fg-t">台北節點</text><text x="588" y="82" text-anchor="middle" class="fg-t sm mono">192.0.2.1</text>
<rect x="530" y="146" width="116" height="48" rx="6" class="fg-b hot"/><text x="588" y="166" text-anchor="middle" class="fg-t">東京節點</text><text x="588" y="184" text-anchor="middle" class="fg-t sm mono">192.0.2.1</text>
<line x1="470" y1="68" x2="522" y2="68" class="fg-l on"/><polygon points="530,68 522,63.5 522,72.5" class="fg-a on"/>
<line x1="470" y1="170" x2="522" y2="170" class="fg-l on"/><polygon points="530,170 522,165.5 522,174.5" class="fg-a on"/>
<text x="588" y="124" text-anchor="middle" class="fg-t sm">同一個 IP</text>
<text x="495" y="238" text-anchor="middle" class="fg-t sm">BGP 路由把封包送到最近的節點</text>
</svg><figcaption>DNS 式導向在「查名字」時就分流，每個地方拿到不同的 IP；Anycast 讓所有節點用同一個 IP，靠網路本身的路由分流。</figcaption></figure>
<h4>做法一：DNS 式導向</h4>
<p>你把 <code>www.example.com</code> 設成一筆 CNAME，指到 CDN 給你的名字。之後所有查詢都會問到 CDN 自己的權威 DNS。它看「查詢是從哪裡來的」，回一個附近、而且目前健康的節點 IP。回答的 TTL 通常很短（幾十秒），方便它隨時把流量搬走。</p>
<p>弱點就在「從哪裡來」：CDN 看到的是你的 DNS 解析器（resolver），不是你本人。如果你用的公共 DNS 從別的國家出去，你可能被分到很遠的節點。有一個叫 EDNS Client Subnet（ECS）的擴充，會讓解析器把使用者 IP 的前幾段一起帶過去，緩解這個問題。Akamai 和 Amazon CloudFront 主要都是靠 DNS 分流。</p>
<h4>做法二：Anycast</h4>
<p>所有節點對外宣告<b>同一個 IP</b>。網際網路上的路由器用 BGP 交換「哪裡可以到這個 IP」，各自挑一條最短的路，封包自然流到最近的節點。這裡的「近」是路由意義上的近（經過的網路少、業者之間的協議），不一定是地圖上最近。Cloudflare 就是以 Anycast 聞名。</p>
<p>Anycast 的好處：不管使用者用哪家 DNS 都一樣準；某個節點要下線，只要撤回路由宣告，流量很快就流到別處；攻擊流量也會被分散到全世界的節點，不會集中打爆一個地方。代價是控制比較粗，而且路由在連線途中改變時，一條 TCP 連線可能被送到另一個節點而斷掉（很少見，但會發生）。</p>
<div class="note"><b>自己看得到被送到哪裡。</b>用 <code>curl -sI</code> 看回應標頭：Cloudflare 的 <code>cf-ray</code> 最後幾個字是機房代碼（例如 <code>TPE</code>），CloudFront 的 <code>x-amz-cf-pop</code> 也會寫出節點名稱。</div>

<h3><span class="badge lv2">進階</span>三、快取鍵與 Vary：邊緣怎麼判斷「這是同一個檔案」</h3>
<p>邊緣節點裡就是一張巨大的對照表：鍵是「這個請求長什麼樣子」，值是「上次存下來的回應」。決定鍵的規則叫做<b>快取鍵</b>（cache key）。大多數 CDN 預設用協定、主機名稱、路徑和完整的查詢字串（query string）組成，再加上回應的 <code>Vary</code> 標頭指定的請求標頭。</p>
<figure class="figure"><svg viewBox="0 0 660 300" class="fg" style="width:100%;max-width:660px" role="img" aria-label="同樣四個請求，照預設的快取鍵會變成四份快取，忽略 fbclid 參數之後只剩兩份">
<rect x="20" y="14" width="620" height="40" rx="6" class="fg-b hot"/>
<text x="330" y="39" text-anchor="middle" class="fg-t acc">快取鍵 ＝ 協定 ＋ 主機 ＋ 路徑 ＋ 查詢字串 ＋ Vary 指定的標頭</text>
<text x="170" y="84" text-anchor="middle" class="fg-t warm">照預設：整條查詢字串都算</text>
<text x="490" y="84" text-anchor="middle" class="fg-t acc">整理過：忽略 fbclid</text>
<rect x="20" y="98" width="300" height="28" rx="4" class="fg-b"/><text x="30" y="117" class="fg-t sm mono">/card.png?v=3</text><text x="200" y="117" class="fg-t sm">br</text><text x="310" y="117" text-anchor="end" class="fg-t sm warm">鍵 1</text>
<rect x="20" y="134" width="300" height="28" rx="4" class="fg-b"/><text x="30" y="153" class="fg-t sm mono">/card.png?v=3&amp;fbclid=a1</text><text x="200" y="153" class="fg-t sm">br</text><text x="310" y="153" text-anchor="end" class="fg-t sm warm">鍵 2</text>
<rect x="20" y="170" width="300" height="28" rx="4" class="fg-b"/><text x="30" y="189" class="fg-t sm mono">/card.png?v=3&amp;fbclid=b7</text><text x="200" y="189" class="fg-t sm">br</text><text x="310" y="189" text-anchor="end" class="fg-t sm warm">鍵 3</text>
<rect x="20" y="206" width="300" height="28" rx="4" class="fg-b"/><text x="30" y="225" class="fg-t sm mono">/card.png?v=3</text><text x="200" y="225" class="fg-t sm">gzip</text><text x="310" y="225" text-anchor="end" class="fg-t sm warm">鍵 4</text>
<rect x="340" y="98" width="300" height="28" rx="4" class="fg-b"/><text x="350" y="117" class="fg-t sm mono">/card.png?v=3</text><text x="520" y="117" class="fg-t sm">br</text><text x="630" y="117" text-anchor="end" class="fg-t sm acc">鍵 1</text>
<rect x="340" y="134" width="300" height="28" rx="4" class="fg-b"/><text x="350" y="153" class="fg-t sm mono">/card.png?v=3&amp;fbclid=a1</text><text x="520" y="153" class="fg-t sm">br</text><text x="630" y="153" text-anchor="end" class="fg-t sm acc">鍵 1</text>
<rect x="340" y="170" width="300" height="28" rx="4" class="fg-b"/><text x="350" y="189" class="fg-t sm mono">/card.png?v=3&amp;fbclid=b7</text><text x="520" y="189" class="fg-t sm">br</text><text x="630" y="189" text-anchor="end" class="fg-t sm acc">鍵 1</text>
<rect x="340" y="206" width="300" height="28" rx="4" class="fg-b"/><text x="350" y="225" class="fg-t sm mono">/card.png?v=3</text><text x="520" y="225" class="fg-t sm">gzip</text><text x="630" y="225" text-anchor="end" class="fg-t sm acc">鍵 2</text>
<text x="170" y="260" text-anchor="middle" class="fg-t warm">存 4 份、去源站 4 次</text>
<text x="490" y="260" text-anchor="middle" class="fg-t acc">存 2 份、去源站 2 次</text>
<text x="330" y="288" text-anchor="middle" class="fg-t sm">換成 Vary: User-Agent，同一個檔案會被拆成幾千份</text>
</svg><figcaption>每一列是一個請求，中間那欄是瀏覽器送的 Accept-Encoding。左右兩邊的請求一模一樣，只差快取鍵怎麼組。壓縮方式不同本來就該分開存；行銷參數不同則不該。</figcaption></figure>
<p>看圖左邊：四個請求要的其實是同一張圖，但行銷連結帶的 <code>fbclid</code> 每個人都不一樣，CDN 照預設把它們當成不同的檔案，存四份、去源站拿四次。命中率就是這樣悄悄掉下去的。解法是在 CDN 設定裡，只把會改變內容的參數（例如 <code>v</code>）放進快取鍵，其他一律忽略。反過來也要小心：如果你的 API 真的靠某個參數回不同內容，卻被你從鍵裡拿掉，大家就會拿到同一份錯的答案。</p>
<h4>Vary：告訴快取「還要看哪些標頭」</h4>
<p>同一個網址，瀏覽器說自己支援 Brotli，就該拿 br 壓縮版；只支援 gzip 的就拿 gzip 版。源站回 <code>Vary: Accept-Encoding</code>，等於跟所有快取說：「這個回應要依 <code>Accept-Encoding</code> 分開存。」這是好的 Vary。壞的 Vary 是 <code>Vary: User-Agent</code>：瀏覽器版本有幾千種，一個檔案被拆成幾千份，幾乎永遠不會命中。<code>Vary: Cookie</code> 更糟，等於每個人一份。各家 CDN 對 Vary 的支援也不一樣，有的只認壓縮相關的標頭，上線前要查你用的那家怎麼處理。</p>
<h4>Cache-Control 的每個字在說什麼</h4>
<table>
<tr><th>指令</th><th>意思</th><th>常見用途</th></tr>
<tr><td><code>max-age=N</code></td><td>N 秒內是新鮮的，瀏覽器和 CDN 都適用</td><td>一般靜態檔</td></tr>
<tr><td><code>s-maxage=N</code></td><td>只給共用快取（CDN、代理伺服器）看，會蓋過 max-age</td><td>CDN 存久一點、瀏覽器短一點</td></tr>
<tr><td><code>public</code>／<code>private</code></td><td>能不能存在共用快取；private 只准瀏覽器自己存</td><td>個人化的回應用 private</td></tr>
<tr><td><code>no-cache</code></td><td>可以存，但每次用之前都要先問源站</td><td><code>index.html</code></td></tr>
<tr><td><code>no-store</code></td><td>完全不准存</td><td>帳戶、付款、權杖</td></tr>
<tr><td><code>immutable</code></td><td>新鮮期內內容絕對不變，重新整理也不用問</td><td>檔名帶雜湊的檔案</td></tr>
<tr><td><code>stale-while-revalidate=N</code></td><td>過期後 N 秒內，可以先回舊的，同時在背景更新</td><td>排行榜、設定檔</td></tr>
<tr><td><code>stale-if-error=N</code></td><td>源站出錯時，N 秒內可以拿舊的頂著</td><td>源站掛掉時保命</td></tr>
</table>
<p>注意 <code>no-cache</code> 不是「不要快取」，而是「每次都要確認」；真正的「不准存」是 <code>no-store</code>。這兩個字搞反，是面試和事故裡最常見的錯。另外有一個 <code>CDN-Cache-Control</code> 標頭（RFC 9213），只給 CDN 看，讓你把瀏覽器和 CDN 的規則完全分開寫。</p>

<h3><span class="badge lv2">進階</span>四、一個快取項目的一生：新鮮、過期、重新驗證</h3>
<p>拿一個排行榜 API 走一次。源站的回應帶著這兩個標頭：</p>
<pre><code>Cache-Control: s-maxage=300, stale-while-revalidate=60
ETag: "a1"</code></pre>
<figure class="figure"><svg viewBox="0 0 660 196" class="fg" style="width:100%;max-width:660px" role="img" aria-label="一份快取的時間軸：0 到 300 秒新鮮，300 到 360 秒是寬限期可以先回舊的，360 秒以後要先問源站">
<text x="36" y="40" class="fg-t sm">第 0 秒</text><text x="36" y="56" class="fg-t sm warm">MISS：去源站拿</text>
<line x1="40" y1="62" x2="40" y2="92" class="fg-l"/><polygon points="40,100 35.5,92 44.5,92" class="fg-a"/>
<text x="208" y="40" text-anchor="middle" class="fg-t sm">第 120 秒</text><text x="208" y="56" text-anchor="middle" class="fg-t sm acc">HIT：直接回</text>
<line x1="208" y1="62" x2="208" y2="92" class="fg-l on"/><polygon points="208,100 203.5,92 212.5,92" class="fg-a on"/>
<text x="502" y="40" text-anchor="middle" class="fg-t sm">第 330 秒</text><text x="502" y="56" text-anchor="middle" class="fg-t sm warm">先回舊的再更新</text>
<line x1="502" y1="62" x2="502" y2="92" class="fg-l warm"/><polygon points="502,100 497.5,92 506.5,92" class="fg-a warm"/>
<text x="600" y="40" text-anchor="middle" class="fg-t sm">第 400 秒</text><text x="600" y="56" text-anchor="middle" class="fg-t sm">先等源站 304</text>
<line x1="600" y1="62" x2="600" y2="92" class="fg-l"/><polygon points="600,100 595.5,92 604.5,92" class="fg-a"/>
<rect x="40" y="100" width="420" height="26" rx="3" class="fg-b hot"/><text x="250" y="118" text-anchor="middle" class="fg-t sm acc">新鮮：直接回，不問源站</text>
<rect x="460" y="100" width="84" height="26" rx="3" class="fg-b warm"/><text x="480" y="118" class="fg-t sm">寬限期</text>
<rect x="544" y="100" width="96" height="26" rx="3" class="fg-b"/><text x="620" y="118" text-anchor="end" class="fg-t sm">過期</text>
<text x="460" y="146" text-anchor="middle" class="fg-t sm">300：到期</text>
<text x="560" y="146" text-anchor="middle" class="fg-t sm">360：寬限結束</text>
<text x="340" y="180" text-anchor="middle" class="fg-t sm mono">Cache-Control: s-maxage=300, stale-while-revalidate=60</text>
</svg><figcaption>色帶是「第 0 秒存下的這份資料」在每個時間點的狀態。第 330 秒和第 400 秒是兩種不同的情況：前者落在寬限期，使用者不用等；後者已經過期，要先問完源站。</figcaption></figure>
<ol>
<li><b>第 0 秒</b>：台北節點第一次被問，沒有這份資料（MISS），去源站拿回 200 和完整內容，存起來。回給使用者的標頭裡有 <code>Age: 0</code>。</li>
<li><b>第 120 秒</b>：又有人要，資料還新鮮（HIT），直接回，<code>Age: 120</code> 告訴你這份已經在快取裡放了兩分鐘。源站完全不知道這次請求。</li>
<li><b>第 300 秒</b>：新鮮期結束，資料變成「過期」（stale），但還沒被丟掉。</li>
<li><b>情況一，第 330 秒有人來</b>：落在 60 秒的寬限期內。節點先把舊的回給使用者，同時在背景問源站：<code>If-None-Match: "a1"</code>。源站發現內容沒變，只回一個沒有內容的 <code>304 Not Modified</code>，新鮮期從這一刻重新起算。使用者完全沒有等。</li>
<li><b>情況二，一直到第 400 秒才有人來</b>：已經超過寬限期，節點必須先問完源站才能回應，這個請求就多等一趟來回。</li>
</ol>
<p>304 很便宜：只有標頭、沒有內容，源站也只要比一下 ETag。所以「短 TTL＋ETag」對常常被問、但不常變的資料很划算。還有一點要記住：TTL 是每個節點各自算的。台北節點過期了，東京節點可能還新鮮，所以世界各地的使用者會在不同時間看到新資料，最多差一個 TTL 加寬限期。</p>
<p>如果想讓瀏覽器每次都問、CDN 卻存久一點，可以寫 <code>Cache-Control: max-age=0, s-maxage=300</code>：瀏覽器看 max-age，馬上過期；CDN 看 s-maxage，存五分鐘。代價是上版後 CDN 可能還回五分鐘的舊版，所以上版流程要順手清掉那一個網址。</p>

<h3><span class="badge lv3">專業</span>五、分層快取與源站屏蔽：別讓三百個節點一起來敲門</h3>
<p>大型 CDN 有幾百個節點，每個節點的快取是各自獨立的。你上版了一支 8 MB 的新 JS，全世界 300 個節點第一次被問到時都會未命中，各自去源站拿：一瞬間 300 個請求、2.4 GB 的流量打到你那台小伺服器上。冷門的檔案更慘：每個節點的空間有限，用得少的會先被擠掉，所以長尾的素材在每個節點都一直未命中。</p>
<figure class="figure"><svg viewBox="0 0 660 252" class="fg" style="width:100%;max-width:660px" role="img" aria-label="六個邊緣節點同時未命中，都先去問屏蔽層，屏蔽層只向源站要一次">
<rect x="20" y="16" width="120" height="30" rx="5" class="fg-b"/><text x="80" y="36" text-anchor="middle" class="fg-t">台北節點</text>
<rect x="20" y="54" width="120" height="30" rx="5" class="fg-b"/><text x="80" y="74" text-anchor="middle" class="fg-t">東京節點</text>
<rect x="20" y="92" width="120" height="30" rx="5" class="fg-b"/><text x="80" y="112" text-anchor="middle" class="fg-t">首爾節點</text>
<rect x="20" y="130" width="120" height="30" rx="5" class="fg-b"/><text x="80" y="150" text-anchor="middle" class="fg-t">新加坡節點</text>
<rect x="20" y="168" width="120" height="30" rx="5" class="fg-b"/><text x="80" y="188" text-anchor="middle" class="fg-t">香港節點</text>
<rect x="20" y="206" width="120" height="30" rx="5" class="fg-b"/><text x="80" y="226" text-anchor="middle" class="fg-t">雪梨節點</text>
<line x1="140" y1="31" x2="262" y2="126" class="fg-l"/>
<line x1="140" y1="69" x2="262" y2="127" class="fg-l"/>
<line x1="140" y1="107" x2="262" y2="128" class="fg-l"/>
<line x1="140" y1="145" x2="262" y2="129" class="fg-l"/>
<line x1="140" y1="183" x2="262" y2="130" class="fg-l"/>
<line x1="140" y1="221" x2="262" y2="131" class="fg-l"/>
<polygon points="270,128 262,123.5 262,132.5" class="fg-a"/>
<rect x="270" y="98" width="140" height="60" rx="8" class="fg-b alt"/><text x="340" y="123" text-anchor="middle" class="fg-t alt">屏蔽層</text><text x="340" y="143" text-anchor="middle" class="fg-t sm">合併成 1 個請求</text>
<line x1="410" y1="128" x2="512" y2="128" class="fg-l on"/><polygon points="520,128 512,123.5 512,132.5" class="fg-a on"/>
<text x="465" y="118" text-anchor="middle" class="fg-t sm acc">只去 1 次</text>
<rect x="520" y="98" width="120" height="60" rx="8" class="fg-b hot"/><text x="580" y="123" text-anchor="middle" class="fg-t acc">源站</text><text x="580" y="143" text-anchor="middle" class="fg-t sm">負擔最小</text>
<text x="530" y="200" text-anchor="middle" class="fg-t sm warm">沒有屏蔽層：</text>
<text x="530" y="218" text-anchor="middle" class="fg-t sm warm">源站被要 6 次</text>
</svg><figcaption>邊緣未命中時先問屏蔽層，只有屏蔽層也沒有，才去源站。節點越多，差別越大：300 個節點時，就是 300 次對 1 次。</figcaption></figure>
<p>解法是在邊緣和源站之間多放一層：<b>源站屏蔽</b>（origin shield），也叫分層快取（tiered cache）。邊緣節點未命中時，不是直接去源站，而是先問屏蔽層；只有屏蔽層也沒有，才去源站。CloudFront 的 Origin Shield、Cloudflare 的 Tiered Cache、Fastly 的 shielding，都是這個概念。</p>
<p>另一個默默在幫你的機制是<b>請求合併</b>（request collapsing）：同一個節點同時收到 1,000 個對同一個檔案的未命中，它只派 1 個請求去上游，其他 999 個原地等那一份回來。少了它，一個熱門檔案過期的瞬間，上游就會同時被打 1,000 次，這叫<b>驚群效應</b>（thundering herd）。你自己寫的 Redis 快取也會遇到一模一樣的問題，解法也一樣：同一個鍵只讓一個人去重算。</p>
<h4>取捨</h4>
<ul>
<li>屏蔽層要選<b>離源站近</b>的區域：源站在東京，屏蔽層就放東京，邊緣到屏蔽層那一段走 CDN 自己的骨幹網路。</li>
<li>未命中時多了一跳，第一次請求會稍微慢一點；換來的是源站負擔大減、整體命中率上升。</li>
<li>不可快取的請求（POST、帶個人資料的 API）不會因為屏蔽層變好，它們每次都會穿過去。</li>
</ul>

<h3><span class="badge lv3">專業</span>六、上版的順序：雜湊檔名、舊檔保留、清除快取</h3>
<p>上一課說「上版不用清快取」，前提是順序對。物件儲存（例如 S3）一次只能換一個檔案，沒有「整包同時換掉」這回事，所以先後就是全部的關鍵：</p>
<figure class="figure"><svg viewBox="0 0 660 214" class="fg" style="width:100%;max-width:660px" role="img" aria-label="上版的對與錯：先傳新檔、最後換入口頁，舊檔保留；反過來會讓使用者拿到 404，而且 404 還被快取起來">
<text x="20" y="22" class="fg-t acc">對的順序</text>
<rect x="20" y="32" width="140" height="54" rx="6" class="fg-b"/><text x="90" y="55" text-anchor="middle" class="fg-t">① 傳新雜湊檔</text><text x="90" y="75" text-anchor="middle" class="fg-t sm mono">app.9c2e.js</text>
<rect x="180" y="32" width="140" height="54" rx="6" class="fg-b"/><text x="250" y="55" text-anchor="middle" class="fg-t">② 確認拿得到</text><text x="250" y="75" text-anchor="middle" class="fg-t sm">從外面抽查 200</text>
<rect x="340" y="32" width="140" height="54" rx="6" class="fg-b hot"/><text x="410" y="55" text-anchor="middle" class="fg-t acc">③ 換 index.html</text><text x="410" y="75" text-anchor="middle" class="fg-t sm mono">no-cache</text>
<rect x="500" y="32" width="140" height="54" rx="6" class="fg-b"/><text x="570" y="55" text-anchor="middle" class="fg-t">④ 舊檔留著</text><text x="570" y="75" text-anchor="middle" class="fg-t sm">給還開著的頁面</text>
<line x1="160" y1="59" x2="172" y2="59" class="fg-l on"/><polygon points="180,59 172,54.5 172,63.5" class="fg-a on"/>
<line x1="320" y1="59" x2="332" y2="59" class="fg-l on"/><polygon points="340,59 332,54.5 332,63.5" class="fg-a on"/>
<line x1="480" y1="59" x2="492" y2="59" class="fg-l on"/><polygon points="500,59 492,54.5 492,63.5" class="fg-a on"/>
<text x="20" y="126" class="fg-t warm">錯的順序</text>
<rect x="20" y="136" width="140" height="54" rx="6" class="fg-b warm"/><text x="90" y="159" text-anchor="middle" class="fg-t">① 先換 index.html</text><text x="90" y="179" text-anchor="middle" class="fg-t sm">指向 app.9c2e.js</text>
<rect x="180" y="136" width="140" height="54" rx="6" class="fg-b"/><text x="250" y="159" text-anchor="middle" class="fg-t">② 新檔還沒到</text><text x="250" y="179" text-anchor="middle" class="fg-t sm">使用者拿到 404</text>
<rect x="340" y="136" width="140" height="54" rx="6" class="fg-b warm"/><text x="410" y="159" text-anchor="middle" class="fg-t">③ 404 被快取</text><text x="410" y="179" text-anchor="middle" class="fg-t sm">存幾秒到幾分鐘</text>
<rect x="500" y="136" width="140" height="54" rx="6" class="fg-b"/><text x="570" y="159" text-anchor="middle" class="fg-t">④ 只能清快取</text><text x="570" y="179" text-anchor="middle" class="fg-t sm">清之前一直壞</text>
<line x1="160" y1="163" x2="172" y2="163" class="fg-l warm"/><polygon points="180,163 172,158.5 172,167.5" class="fg-a warm"/>
<line x1="320" y1="163" x2="332" y2="163" class="fg-l warm"/><polygon points="340,163 332,158.5 332,167.5" class="fg-a warm"/>
<line x1="480" y1="163" x2="492" y2="163" class="fg-l warm"/><polygon points="500,163 492,158.5 492,167.5" class="fg-a warm"/>
</svg><figcaption>入口頁是「指向新版」的那個開關，一定最後才扳。舊檔要留到沒有人還開著舊頁面為止。</figcaption></figure>
<ol>
<li><b>先傳所有帶雜湊的新檔</b>。它們是全新的網址，不會影響任何正在用的人。</li>
<li><b>確認新檔真的拿得到</b>。從外面用 <code>curl</code> 抽查幾個，都要 200。</li>
<li><b>最後才換 <code>index.html</code></b>（或 <code>version.json</code>、遊戲的版本清單）。從這一刻起，新來的人拿到新版。</li>
<li><b>舊檔留著</b>至少幾天。還開著舊頁面的人，切換畫面時會去載舊版的程式碼分塊（chunk）；你把舊檔刪了，他們就會看到 Vite 的「Failed to fetch dynamically imported module」這類錯誤。</li>
</ol>
<p>順序反過來，就是圖下半的連鎖事故：入口頁先指向還不存在的檔案，使用者拿到 404；很多 CDN 預設會把 404 也存一小段時間（負向快取，negative caching，從幾秒到幾分鐘，看廠商與設定），所以就算新檔幾秒後就傳好了，壞掉的狀態還會持續下去。</p>
<h4>真的需要清除快取的時候</h4>
<ul>
<li><b>依網址清</b>：最精準，適合改了一個不帶雜湊的檔案。</li>
<li><b>依標籤清</b>：源站在回應裡加標籤（有的叫 surrogate key，有的叫 cache tag），之後一次清掉「所有跟商品 42 有關的頁面」。</li>
<li><b>全部清掉</b>：最危險。所有節點同時未命中，等於自己對源站發動一次驚群。</li>
</ul>
<div class="warn"><b>CDN 清得掉，瀏覽器清不掉。</b>清除快取只影響 CDN 節點。已經存在使用者瀏覽器裡、<code>max-age</code> 還沒到的檔案，伺服器沒有任何方法叫它丟掉。這就是入口頁必須是 <code>no-cache</code> 的真正原因：它是你唯一還能「改口」的地方。</div>

<h3><span class="badge lv3">專業</span>七、動態內容：可以快取，但要先分清楚是誰的</h3>
<p>先把回應分成三類，再決定標頭：</p>
<table>
<tr><th>回應</th><th>例子</th><th>怎麼設</th></tr>
<tr><td>每個人都一樣、變得快</td><td>排行榜、房間列表、公告</td><td><code>public, s-maxage=2, stale-while-revalidate=10</code></td></tr>
<tr><td>跟登入的人有關</td><td>我的資料、我的戰績</td><td><code>private, no-cache</code> 或 <code>no-store</code></td></tr>
<tr><td>敏感</td><td>付款、權杖、個資</td><td><code>no-store</code></td></tr>
</table>
<p>第一類就算 TTL 很短，效果也驚人，這叫<b>微快取</b>（micro-caching）。算一次：猜高低的排行榜每秒被要 5,000 次，設 <code>s-maxage=2</code>。每個節點每 2 秒最多去上游一次；假設有 50 個節點在服務，源站每秒最多只收到 25 次；再加上屏蔽層，每秒不到 1 次。資料最多舊 2 秒，對排行榜來說沒人在意，源站的負擔卻少了幾千倍。</p>
<h4>兩種真實攻擊：快取欺騙與快取汙染</h4>
<ul>
<li><b>網頁快取欺騙</b>（web cache deception）：CDN 規則寫「副檔名 .css 一律快取」。攻擊者騙已登入的受害者點開 <code>/account/profile.css</code>。源站的路由不在乎後面那一段，照樣回出受害者的個人頁；CDN 看到 .css 就存起來。攻擊者自己再要一次同一個網址，就拿到別人的資料。</li>
<li><b>網頁快取汙染</b>（web cache poisoning）：源站用了某個<b>不在快取鍵裡</b>的標頭來產生內容，例如用 <code>X-Forwarded-Host</code> 組出腳本的網址。攻擊者送一個帶惡意值的請求，這份被汙染的回應就以正常網址為鍵存起來，之後每個人都拿到它。</li>
</ul>
<p>防法的共同原則：<b>源站對每個回應都明確寫出 Cache-Control</b>，API 預設 <code>private, no-store</code>，要快取的才打開；CDN 設定成「尊重源站的標頭」，不要只看副檔名；任何會影響內容的請求標頭，要嘛放進快取鍵，要嘛源站完全不用它。帶 <code>Set-Cookie</code> 的回應，永遠不該被共用快取存起來。</p>

<h3><span class="badge lv4">專家</span>八、DDoS、TLS 與源站保護：CDN 替你擋了什麼</h3>
<h4>兩種洪水</h4>
<ul>
<li><b>網路層與傳輸層</b>（L3／L4）：SYN flood、UDP 反射放大，靠的是量。一台伺服器的網路卡常見是 1 到 10 Gbps，大型攻擊可以到好幾 Tbps；大型 CDN 的總容量以數百 Tbps 計，Anycast 又把攻擊分散到每個節點，各自吃一小塊。非 HTTP 的雜訊封包，CDN 根本不會轉給你。</li>
<li><b>應用層</b>（L7）：看起來像正常的 HTTP 請求，量不一定大，但每一個都要你的伺服器做事。可以快取的網址，CDN 自己就吃掉了；攻擊者的對策是每個請求加一個亂數參數（<code>?r=8812</code>），讓每次都未命中、全部打穿到源站。所以第三節「只把有用的參數放進快取鍵」同時也是資安設定。再往上要靠 WAF 規則、依 IP 或權杖限流（rate limiting）、機器人偵測。</li>
</ul>
<h4>TLS 在邊緣解開</h4>
<p>使用者的 TLS 連線在邊緣節點就解開了，這代表兩件事。第一，CDN 握有你網域的憑證和私密金鑰，看得到所有明文流量，你是在信任這家廠商。第二，邊緣到源站那一段要另外加密，而且要驗證源站憑證。有些 CDN 提供「邊緣到源站走明文 HTTP」的選項（Cloudflare 叫 Flexible），使用者看到鎖頭，資料卻在公開網路上裸奔；正確的是 Full (strict) 這種「加密而且驗證憑證」的模式。</p>
<figure class="figure"><svg viewBox="0 0 660 254" class="fg" style="width:100%;max-width:660px" role="img" aria-label="一般使用者經過 CDN 到源站；攻擊者打 CDN 會被吸收，直接打源站會被只放行 CDN 的防火牆擋下">
<rect x="20" y="40" width="120" height="46" rx="6" class="fg-b alt"/><text x="80" y="68" text-anchor="middle" class="fg-t">一般使用者</text>
<rect x="20" y="174" width="120" height="46" rx="6" class="fg-b warm"/><text x="80" y="202" text-anchor="middle" class="fg-t">攻擊者</text>
<rect x="200" y="28" width="170" height="70" rx="8" class="fg-b hot"/><text x="285" y="56" text-anchor="middle" class="fg-t acc">CDN 邊緣</text><text x="285" y="78" text-anchor="middle" class="fg-t sm">WAF・限流・吸收洪水</text>
<rect x="488" y="16" width="14" height="214" rx="3" class="fg-b warm"/>
<rect x="530" y="28" width="110" height="202" rx="8" class="fg-b"/><text x="585" y="120" text-anchor="middle" class="fg-t lg">源站</text><text x="585" y="142" text-anchor="middle" class="fg-t sm">IP 不公開</text>
<line x1="140" y1="63" x2="192" y2="63" class="fg-l on"/><polygon points="200,63 192,58.5 192,67.5" class="fg-a on"/>
<path d="M140 188 H166 V86 H192" class="fg-l warm dash"/><polygon points="200,86 192,81.5 192,90.5" class="fg-a warm"/>
<text x="176" y="140" class="fg-t sm warm">洪水打到邊緣</text>
<line x1="370" y1="63" x2="522" y2="63" class="fg-l on"/><polygon points="530,63 522,58.5 522,67.5" class="fg-a on"/>
<text x="429" y="54" text-anchor="middle" class="fg-t sm acc">驗證過的連線</text>
<text x="429" y="84" text-anchor="middle" class="fg-t sm">mTLS 或密鑰標頭</text>
<line x1="140" y1="206" x2="480" y2="206" class="fg-l warm"/><polygon points="488,206 480,201.5 480,210.5" class="fg-a warm"/>
<text x="314" y="196" text-anchor="middle" class="fg-t sm warm">直接打源站 IP：被擋下</text>
<text x="495" y="246" text-anchor="middle" class="fg-t sm warm">防火牆：只放行 CDN</text>
</svg><figcaption>所有保護都只對「經過 CDN」的流量有效。源站前面那道牆，負責讓不經過 CDN 的流量根本進不來；CDN 到源站那一段，還要證明「是我的 CDN 帳號」。</figcaption></figure>
<h4>源站保護：別讓人繞過 CDN</h4>
<p>攻擊者只要知道源站的 IP，就能繞過前面所有保護直接打過去。源站 IP 常見的洩漏方式：改用 CDN 之前的舊 DNS 紀錄（有網站專門保存 DNS 歷史）、同一台機器寄出的信件標頭、直接用 IP 連 443 時回出的憑證被網路掃描引擎收錄。所以要做好幾層：</p>
<ol>
<li><b>防火牆只放行 CDN 的 IP 範圍</b>。各家都公布這份清單，AWS 還提供 CloudFront 專用的受管前綴清單（managed prefix list），可以直接放進安全群組。</li>
<li><b>驗證請求真的來自你的 CDN 帳號</b>：IP 範圍是所有客戶共用的，別人也能開一個 CDN 指到你的源站。加一個只有你的 CDN 設定知道的密鑰標頭，或用 mTLS（Cloudflare 叫 Authenticated Origin Pulls）。</li>
<li><b>更徹底：源站完全不開對外連接埠</b>，由源站主動往外連到 CDN（例如 Cloudflare Tunnel）。沒有對外的門，就沒有門可以敲。</li>
<li>改用 CDN 之後，<b>順便換掉源站 IP</b>，因為舊 IP 早就被記錄了。</li>
</ol>

<h3><span class="badge lv4">專家</span>九、邊緣運算、命中率與帳單</h3>
<h4>在邊緣跑程式</h4>
<table>
<tr><th>產品</th><th>執行方式</th><th>適合</th></tr>
<tr><td>Cloudflare Workers</td><td>V8 isolate，在每個節點跑，冷啟動極短</td><td>轉址、驗證權杖、改標頭、整支小 API</td></tr>
<tr><td>CloudFront Functions</td><td>非常輕量的 JavaScript，只處理進出的請求與回應，不能連外部網路</td><td>改網址、加標頭、簡單轉址</td></tr>
<tr><td>Lambda@Edge</td><td>Node.js 或 Python，在區域層級的節點跑，可以呼叫外部服務</td><td>需要查資料或比較重的邏輯</td></tr>
</table>
<p>最常見的錯誤，是把需要資料庫的邏輯搬到邊緣：函式在台北跑，資料庫在美西，每個請求還是要跨太平洋，一次請求查好幾次的話，比原本更慢。邊緣適合「只看請求本身就能決定」的事：驗證 JWT 簽章、依國家轉址、A/B 分組、改寫網址。邊緣的鍵值儲存（例如 Workers KV）通常是最終一致的，寫入要一段時間才傳遍全球，不能拿來做扣款或庫存。</p>
<h4>命中率怎麼量才不會騙自己</h4>
<p>命中率有兩種，要分開看。假設一天 100 萬個請求，其中 90 萬個命中，<b>請求命中率</b>是 90%。可是如果沒命中的 10 萬個剛好都是 2 MB 的大型素材，命中的大多是 10 KB 的小圖，改算位元組：命中 9 GB、未命中 200 GB，<b>位元組命中率</b>只有大約 4%。帳單和源站負擔跟著位元組走，所以真正要盯的是位元組命中率，也叫源站卸載率（origin offload）。</p>
<p>資料來源有三個：CDN 後台的分析頁；CDN 的請求日誌，每一筆都有命中與否的欄位，可以依路徑統計，找出命中率最差的檔案；還有抽查用的回應標頭，例如 Cloudflare 的 <code>cf-cache-status</code>、CloudFront 的 <code>x-cache</code>（值像「Hit from cloudfront」）。每次上版後命中率會掉一下再爬回來，這是正常的；如果一直爬不回來，通常是快取鍵碎掉了，或源站回了不該有的 <code>no-cache</code>、<code>Set-Cookie</code>。</p>
<h4>出站流量的帳單</h4>
<p>雲端業者對「流出到網際網路」的流量收費，常見是每 GB 幾美分，量大才有折扣，各家、各地區都不一樣。用一個假設的價格算數量級：每 GB 0.08 美元，一款網頁遊戲每天 10 萬人進來、每人下載 30 MB 素材，一個月大約 90 TB，全部從源站直接送，就是七千美元上下。透過 CDN、位元組命中率 95%，源站只要送 4.5 TB；CDN 的單價通常也比雲端主機的出站便宜，而 AWS 從自家源站傳到 CloudFront 的流量不另收出站費。這一段帳單，常常比主機本身還貴。</p>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td><code>no-cache</code> 就是不要快取</td><td>可以存，但每次用之前都要問源站；不准存的是 <code>no-store</code>。</td></tr>
<tr><td>清了 CDN 快取，使用者就會拿到新版</td><td>使用者瀏覽器裡的副本清不掉。入口頁一定要 <code>no-cache</code>，其他檔案靠改檔名。</td></tr>
<tr><td>命中率 90% 就很好了</td><td>那可能只是請求命中率。大檔全沒中時，位元組命中率可能只有個位數。</td></tr>
<tr><td>用了 CDN，源站就安全了</td><td>源站 IP 一旦被找到，所有保護都被繞過。要用防火牆只放行 CDN，再加上帳號層級的驗證。</td></tr>
<tr><td>Anycast 就是送到地圖上最近的地方</td><td>是路由上最近，由 BGP 和網路業者之間的協議決定，有時會繞到別的國家。</td></tr>
<tr><td>API 不能放在 CDN 後面</td><td>不快取也能省掉長途交握；公開又變動快的資料還能微快取。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>Vue／Vite 前端</b>：<code>dist/assets</code> 裡的檔名已經帶雜湊，你只要讓託管設定對上：<code>assets/</code> 一年加 <code>immutable</code>，<code>index.html</code> 用 <code>no-cache</code>。特別注意單頁應用的「找不到就回 index.html」規則：如果一個已經被刪掉的 JS 分塊也被回成 HTML、狀態碼 200，瀏覽器會報「Unexpected token &lt;」，而 CDN 還可能把這份 HTML 當成 JS 存一年。靜態資源路徑找不到時，必須回真正的 404。</li>
<li><b>Cocos Creator 網頁遊戲</b>：建置時可以開 MD5 Cache，讓資源檔名帶雜湊；遠端資源包（bundle）放在 CDN 上。版本清單或設定檔要設成每次檢查，素材本身快取一年。</li>
<li><b>Unity WebGL</b>：<code>.data</code>、<code>.wasm</code> 動輒幾十 MB，要確認 CDN 回的 <code>Content-Encoding</code> 和 <code>Content-Type</code> 正確，而且每次建置的檔名不同，否則玩家會卡在舊的大檔案上。</li>
<li><b>Node.js／Go 後端</b>：在中介層（middleware）替所有 API 回應預設 <code>Cache-Control: private, no-store</code>，只有明確標記為公開的路由才改成 <code>public, s-maxage=…</code>。這一行預設，可以擋掉大部分「把個人資料快取給別人」的事故。</li>
<li><b>Docker 與雲端主機</b>：源站的安全群組只開給 CDN 的 IP 範圍；部署腳本最後一步才上傳入口頁，並且不要用會刪掉舊檔的同步選項。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<p>下面是前端、後端、DevOps 面試裡真的會出現的題目。先自己講一遍，再打開參考答案。</p>
<ol>
<li>「使用者打開網站時，是怎麼被導到最近的 CDN 節點的？」</li>
<li>「<code>no-cache</code>、<code>no-store</code>、<code>private</code>、<code>s-maxage</code> 差在哪？<code>index.html</code> 跟 <code>app.[hash].js</code> 你會怎麼設？」</li>
<li>「上版後部分使用者白畫面，主控台說 JS 404。可能的原因是什麼？怎麼避免？」</li>
<li>「什麼是源站屏蔽？什麼情況下特別需要？」</li>
<li>「哪些 API 回應可以讓 CDN 快取？要注意哪些資安問題？」</li>
<li>「怎麼確保攻擊者不能繞過 CDN 直接打源站？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>主要有兩種。DNS 式：網域 CNAME 到 CDN，CDN 的權威 DNS 依查詢來源（解析器位址，或 EDNS Client Subnet 帶來的使用者網段）回一個附近、健康的節點 IP，TTL 很短以便調度。Anycast：所有節點宣告同一個 IP，由 BGP 路由把封包送到路由上最近的節點，不依賴使用者的 DNS，故障切換和分散攻擊流量都很自然。很多 CDN 兩者並用。</li>
<li><code>no-cache</code> 可以存但每次要重新驗證；<code>no-store</code> 完全不能存；<code>private</code> 只能存在使用者自己的瀏覽器，不能存在共用快取；<code>s-maxage</code> 只對共用快取生效並蓋過 <code>max-age</code>。入口頁 <code>no-cache</code>（配 ETag 讓重新驗證只回 304），帶雜湊的檔案 <code>public, max-age=31536000, immutable</code>。</li>
<li>多半是上版順序錯（先換入口頁、新檔還沒上傳完），或刪掉了舊檔而舊頁面還在載舊分塊；404 還可能被 CDN 負向快取。另一種是單頁應用的萬用轉址把缺檔回成 HTML。避免方法：先傳新檔、驗證、最後換入口頁；舊檔保留數天；靜態路徑缺檔回真正的 404；前端攔截分塊載入失敗後提示重新整理。</li>
<li>在邊緣和源站之間加一層區域快取，邊緣未命中先問它，只有它也未命中才回源站，並搭配請求合併。節點多、檔案冷門、源站弱，或上版瞬間大量未命中時特別需要。屏蔽層要選在離源站近的區域。</li>
<li>每個人都一樣的公開資料可以用很短的 <code>s-maxage</code> 微快取，加上 stale-while-revalidate。任何隨登入者變化的回應要 <code>private</code> 或 <code>no-store</code>，帶 <code>Set-Cookie</code> 的不能存。要防網頁快取欺騙（不要只依副檔名決定快取）和快取汙染（影響內容的標頭必須在快取鍵裡，或源站不使用）。</li>
<li>防火牆或安全群組只放行 CDN 公布的 IP 範圍；再用密鑰標頭或 mTLS 證明是自己的 CDN 帳號，因為 IP 範圍是所有客戶共用；更好的是用通道讓源站沒有任何對外開放的連接埠；改用 CDN 時順便換掉源站 IP，並檢查 DNS 歷史、郵件標頭等洩漏途徑。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>對你自己網站的 <code>index.html</code> 和一個 JS 檔，各跑兩次 <code>curl -sI</code>。找出：被哪個節點服務、是 HIT 還是 MISS、<code>Age</code> 有沒有變大、<code>Cache-Control</code> 寫什麼。</li>
<li>一個 JSON 設 <code>s-maxage=60</code>，全世界有 200 個節點都持續有人在要它。沒有屏蔽層時，源站每秒大約收到幾次這個請求？有屏蔽層時呢？</li>
<li>下面四個回應，哪些可以讓 CDN 存？(a) <code>GET /api/leaderboard</code>，每個人都一樣；(b) <code>GET /api/me</code>，帶 <code>Set-Cookie</code>；(c) <code>GET /img/avatar/42.png</code>；(d) <code>POST /api/round</code>。</li>
<li>寫出一個前端上版腳本的順序：用 <code>aws s3</code> 上傳 <code>dist/</code> 到 S3，前面放 CloudFront。要寫出每一步的 Cache-Control。</li>
<li>CDN 日誌顯示：一天 200 萬個請求，180 萬個命中、平均 20 KB；20 萬個未命中、平均 1 MB。算出請求命中率和位元組命中率，並說說你會先去查什麼。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>入口頁應該看到 <code>no-cache</code>，快取狀態可能是 MISS、REVALIDATED（重新驗證後回快取），或像 Cloudflare 的 DYNAMIC（有的 CDN 預設根本不快取 HTML）；JS 第二次應該是 HIT，<code>Age</code> 變大，<code>Cache-Control</code> 帶一年的 max-age。如果 JS 每次都 MISS，檢查 Cache-Control 和有沒有 <code>Set-Cookie</code>。</li>
<li>每個節點每 60 秒最多去上游一次，200 個節點就是每秒約 3.3 次。有屏蔽層時，源站每 60 秒大約只被問 1 次（再加上請求合併，不會同時被問很多次）。</li>
<li>(a) 可以，短 <code>s-maxage</code> 微快取；(b) 不行，個人資料又帶 Set-Cookie；(c) 可以，最好檔名帶版本或雜湊，因為使用者換頭像時網址不變就會看到舊的；(d) 不行，POST 不快取，而且有副作用。</li>
<li>先 <code>aws s3 sync dist/assets s3://bucket/assets --cache-control "public, max-age=31536000, immutable"</code>（不加 <code>--delete</code>，舊檔留著）；從外面抽查新檔 200；再 <code>aws s3 cp dist/index.html s3://bucket/index.html --cache-control "no-cache"</code>；最後 <code>aws cloudfront create-invalidation --distribution-id …… --paths "/index.html"</code>，只清入口頁。舊檔幾天後用另一個排程清理。</li>
<li>請求命中率 180 萬 ÷ 200 萬 = 90%。位元組：命中 180 萬 × 20 KB = 36 GB，未命中 20 萬 × 1 MB = 200 GB，位元組命中率 36 ÷ 236 ≈ 15%。先查那些 1 MB 的檔案為什麼沒中：快取鍵是不是被參數打碎、TTL 是不是太短、回應有沒有 <code>no-cache</code> 或 <code>Set-Cookie</code>、是不是冷門檔案需要屏蔽層。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>MDN Web Docs 的 HTTP caching 指南</b>（<a href="https://developer.mozilla.org/">developer.mozilla.org</a>）：每個 Cache-Control 指令、條件請求、304 的權威說明，例子很多。</li>
<li><b>RFC 9111《HTTP Caching》</b>（<a href="https://www.rfc-editor.org/rfc/rfc9111">rfc-editor.org</a>）：快取行為的正式規格。遇到「到底誰對」的爭議時，以它為準。</li>
<li><b>Ilya Grigorik《High Performance Browser Networking》</b>（<a href="https://hpbn.co/">hpbn.co</a>，免費線上閱讀）：TCP、TLS、HTTP/2 的來回成本講得最清楚，是第一節的完整版。</li>
<li><b>PortSwigger Web Security Academy</b>（<a href="https://portswigger.net/web-security">portswigger.net/web-security</a>）：免費的網頁快取汙染與快取欺騙教學，附可以實際動手打的練習環境。</li>
<li><b>Cloudflare Learning Center</b>（<a href="https://www.cloudflare.com/learning/">cloudflare.com/learning</a>）：Anycast、DDoS、CDN 的入門文章，圖多、好讀。</li>
</ul>
` });
