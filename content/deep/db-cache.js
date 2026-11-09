DEEP({ 'db-cache': `
<p>快取看起來只有兩個動作：GET 和 SET。可是線上事故有一大票是從這兩行程式長出來的：資料改了畫面卻還是舊的、一個熱門的鍵過期就把資料庫打掛、某個鍵熱到單台 Redis 撐不住、有人下了一個指令讓整台 Redis 卡住好幾秒。這一章從「快取到底在賺什麼」的算式開始，拆開四種讀寫模式、作廢時的競態、TTL 和抖動、擊穿的三種防法、熱鍵，最後鑽進 Redis 裡面：單執行緒、持久化、淘汰策略、記憶體碎片，以及它什麼時候其實已經不是快取，而是你的資料庫。</p>

<h3><span class="badge lv1">基礎</span>一、快取在賺什麼：兩個算式</h3>
<p>快取（cache）就像你書桌的抽屜。常用的文具放抽屜，伸手就拿到；不常用的放在樓下的倉庫，每次要跑一趟。抽屜很小，放不下全部，所以重點是：<b>你伸手的時候，有幾次真的在抽屜裡找到？</b>這個比例就是<b>命中率</b>（hit rate）。找到叫<b>快取命中</b>（cache hit），沒找到叫<b>快取未命中</b>（cache miss）。</p>
<p>第一個算式是平均延遲。假設查一次 Redis 要 0.5 毫秒，查一次資料庫要 20 毫秒（都是常見的數量級）。沒命中時，你先花 0.5 毫秒問快取，再花 20 毫秒去資料庫：</p>
<pre><code>平均延遲 = 命中率 × 0.5 + (1 − 命中率) × (0.5 + 20)

命中率 80%：0.8 × 0.5 + 0.2 × 20.5  = 4.5 ms
命中率 95%：0.95 × 0.5 + 0.05 × 20.5 = 1.5 ms
命中率 99%：0.99 × 0.5 + 0.01 × 20.5 = 0.7 ms</code></pre>
<p>第二個算式更重要：資料庫看到的流量，等於<b>未命中的那一部分</b>。每秒 10,000 個請求，命中率 95%，資料庫每秒收 500 個查詢；命中率 99%，只收 100 個。反過來看，命中率從 99% 掉到 98%，看起來只差 1%，資料庫的負擔卻<b>變成兩倍</b>。所以快取出事時，最先倒下的通常不是快取，而是它背後的資料庫。</p>
<p>這也說明了上一課那句話：命中率很低的快取不值得養。命中率 30% 的快取，每個請求都多付一趟快取的網路來回，卻只替資料庫擋掉三成流量。</p>

<h3><span class="badge lv1">基礎</span>二、快取放在哪一層：越近越快，也越難通知</h3>
<p>同一份資料可以被快取在好幾個地方。每一層的差別，在於「誰共用這份副本」和「資料改了的時候，你有沒有辦法通知它」。</p>
<figure class="figure"><svg viewBox="0 0 680 215" class="fg" style="width:100%;max-width:680px" role="img" aria-label="請求從瀏覽器、CDN、程式記憶體、Redis 一路往右問到資料庫，每一層沒命中才往下一層；Redis 命中時直接原路回頭">
<text x="135" y="20" text-anchor="middle" class="fg-t sm">使用者那一側</text>
<text x="470" y="20" text-anchor="middle" class="fg-t sm">你的伺服器裡</text>
<line x1="269" y1="10" x2="269" y2="124" class="fg-l dim dash"/>
<rect x="16" y="34" width="104" height="54" rx="6" class="fg-b"/>
<text x="68" y="56" text-anchor="middle" class="fg-t">瀏覽器</text>
<text x="68" y="76" text-anchor="middle" class="fg-t sm">一位使用者</text>
<rect x="150" y="34" width="104" height="54" rx="6" class="fg-b"/>
<text x="202" y="56" text-anchor="middle" class="fg-t">CDN 邊緣</text>
<text x="202" y="76" text-anchor="middle" class="fg-t sm">同區所有人</text>
<rect x="284" y="34" width="104" height="54" rx="6" class="fg-b alt"/>
<text x="336" y="56" text-anchor="middle" class="fg-t">程式記憶體</text>
<text x="336" y="76" text-anchor="middle" class="fg-t sm">單一行程</text>
<rect x="418" y="34" width="104" height="54" rx="6" class="fg-b hot"/>
<text x="470" y="56" text-anchor="middle" class="fg-t acc">Redis</text>
<text x="470" y="76" text-anchor="middle" class="fg-t sm">所有伺服器</text>
<rect x="552" y="34" width="104" height="54" rx="6" class="fg-b"/>
<text x="604" y="56" text-anchor="middle" class="fg-t">資料庫</text>
<text x="604" y="76" text-anchor="middle" class="fg-t sm">真正的來源</text>
<line x1="120" y1="61" x2="142" y2="61" class="fg-l"/><polygon points="150,61 142,56.5 142,65.5" class="fg-a"/>
<line x1="254" y1="61" x2="276" y2="61" class="fg-l"/><polygon points="284,61 276,56.5 276,65.5" class="fg-a"/>
<line x1="388" y1="61" x2="410" y2="61" class="fg-l"/><polygon points="418,61 410,56.5 410,65.5" class="fg-a"/>
<line x1="522" y1="61" x2="544" y2="61" class="fg-l dash"/><polygon points="552,61 544,56.5 544,65.5" class="fg-a"/>
<text x="68" y="110" text-anchor="middle" class="fg-t sm">本機，約 0</text>
<text x="202" y="110" text-anchor="middle" class="fg-t sm">約 10～50 ms</text>
<text x="336" y="110" text-anchor="middle" class="fg-t sm">&lt; 1 微秒</text>
<text x="470" y="110" text-anchor="middle" class="fg-t sm">約 0.2～1 ms</text>
<text x="604" y="110" text-anchor="middle" class="fg-t sm">1～100+ ms</text>
<path d="M470 118 V150 H68 V128" class="fg-l on"/><polygon points="68,120 63.5,128 72.5,128" class="fg-a on"/>
<text x="282" y="168" text-anchor="middle" class="fg-t sm acc">Redis 命中：原路回頭，資料庫完全不用動</text>
<text x="340" y="202" text-anchor="middle" class="fg-t sm">越往右越慢、越多人共用；越往左越快，但越難通知它「資料改了」</text>
</svg><figcaption>每一層沒命中，才往右邊問下一層。第二排數字是「查這一層一次」大約花的時間，只是數量級。</figcaption></figure>
<ul>
<li><b>瀏覽器和手機 App</b>：最快，零網路。但它在使用者的裝置上，你沒辦法主動叫它丟掉。只能靠 HTTP 標頭事先說好能放多久（<code>Cache-Control</code>），或者乾脆換一個網址（檔名帶雜湊）。第 3.8 課的 CDN 會細講。</li>
<li><b>CDN</b>：同一區域的使用者共用。可以用 CDN 的清除 API 主動作廢，但清除要幾秒到幾分鐘才會傳到全世界的節點。</li>
<li><b>程式自己的記憶體</b>（in-process cache）：一個 <code>Map</code> 加上過期時間，查一次不到一微秒，連網路都不用走。缺點是每台伺服器各有一份：你有 10 個 Pod，就有 10 份可能不一樣的副本；部署一次全部清空；而且吃的是應用程式自己的記憶體。常見的補法是用 Redis 的 pub/sub 廣播「某個鍵改了」，讓每台各自刪掉。Redis 6 開始也有伺服器協助的用戶端快取（client-side caching），Redis 會記住誰讀過哪個鍵，鍵一改就主動通知。</li>
<li><b>Redis 或 Memcached</b>：所有伺服器共用一份。作廢只要刪一個鍵，大家立刻一致。代價是每次多一趟網路。</li>
<li><b>資料庫自己的快取</b>：別忘了資料庫本身就有一大塊記憶體在快取資料頁（PostgreSQL 的 shared buffers、InnoDB 的 buffer pool）。同一個查詢第二次跑比較快，常常是這一層的功勞。很多時候，把資料庫的記憶體加大，比多加一層快取簡單得多。</li>
</ul>

<h3><span class="badge lv2">進階</span>三、四種讀寫模式：誰負責去資料庫</h3>
<p>快取和資料庫之間的分工，有四種經典的寫法。差別在兩件事：讀的時候，沒命中由誰去資料庫拿？寫的時候，先寫哪邊、要不要等？</p>
<figure class="figure"><svg viewBox="0 0 680 384" class="fg" style="width:100%;max-width:680px" role="img" aria-label="四格圖：cache-aside 由程式自己讀快取和資料庫；read-through 由快取替程式去讀資料庫；write-through 寫入時快取同步寫進資料庫；write-behind 寫入快取後馬上回應、之後才批次寫入資料庫">
<rect x="10" y="10" width="330" height="178" rx="10" class="fg-b"/>
<text x="24" y="34" class="fg-t acc">cache-aside（旁路快取）</text>
<rect x="26" y="50" width="84" height="100" rx="6" class="fg-b"/><text x="68" y="104" text-anchor="middle" class="fg-t">應用程式</text>
<rect x="236" y="50" width="90" height="36" rx="6" class="fg-b hot"/><text x="281" y="73" text-anchor="middle" class="fg-t">快取</text>
<rect x="236" y="114" width="90" height="36" rx="6" class="fg-b"/><text x="281" y="137" text-anchor="middle" class="fg-t">資料庫</text>
<line x1="110" y1="62" x2="228" y2="62" class="fg-l"/><polygon points="236,62 228,57.5 228,66.5" class="fg-a"/>
<text x="173" y="56" text-anchor="middle" class="fg-t sm">① GET，沒中</text>
<line x1="110" y1="76" x2="228" y2="76" class="fg-l on"/><polygon points="236,76 228,71.5 228,80.5" class="fg-a on"/>
<text x="173" y="92" text-anchor="middle" class="fg-t sm acc">③ SET 存起來</text>
<line x1="110" y1="132" x2="228" y2="132" class="fg-l"/><polygon points="236,132 228,127.5 228,136.5" class="fg-a"/>
<text x="173" y="126" text-anchor="middle" class="fg-t sm">② 讀資料庫</text>
<text x="24" y="174" class="fg-t sm">寫：先更新資料庫，再刪快取的鍵</text>
<rect x="340" y="10" width="330" height="178" rx="10" class="fg-b"/>
<text x="354" y="34" class="fg-t acc">read-through（讀穿透）</text>
<rect x="356" y="50" width="84" height="100" rx="6" class="fg-b"/><text x="398" y="104" text-anchor="middle" class="fg-t">應用程式</text>
<rect x="566" y="50" width="90" height="36" rx="6" class="fg-b hot"/><text x="611" y="73" text-anchor="middle" class="fg-t">快取</text>
<rect x="566" y="114" width="90" height="36" rx="6" class="fg-b"/><text x="611" y="137" text-anchor="middle" class="fg-t">資料庫</text>
<line x1="440" y1="68" x2="558" y2="68" class="fg-l"/><polygon points="566,68 558,63.5 558,72.5" class="fg-a"/>
<text x="503" y="62" text-anchor="middle" class="fg-t sm">① 只問快取</text>
<line x1="611" y1="86" x2="611" y2="106" class="fg-l on"/><polygon points="611,114 606.5,106 615.5,106" class="fg-a on"/>
<text x="600" y="104" text-anchor="end" class="fg-t sm acc">② 沒中，快取自己去讀</text>
<text x="354" y="174" class="fg-t sm">程式只跟快取說話，載入邏輯包在快取層</text>
<rect x="10" y="198" width="330" height="178" rx="10" class="fg-b"/>
<text x="24" y="222" class="fg-t alt">write-through（寫穿透）</text>
<rect x="26" y="238" width="84" height="100" rx="6" class="fg-b"/><text x="68" y="292" text-anchor="middle" class="fg-t">應用程式</text>
<rect x="236" y="238" width="90" height="36" rx="6" class="fg-b alt"/><text x="281" y="261" text-anchor="middle" class="fg-t">快取</text>
<rect x="236" y="302" width="90" height="36" rx="6" class="fg-b"/><text x="281" y="325" text-anchor="middle" class="fg-t">資料庫</text>
<line x1="110" y1="256" x2="228" y2="256" class="fg-l alt"/><polygon points="236,256 228,251.5 228,260.5" class="fg-a alt"/>
<text x="173" y="250" text-anchor="middle" class="fg-t sm alt">① 寫入</text>
<line x1="281" y1="274" x2="281" y2="294" class="fg-l alt"/><polygon points="281,302 276.5,294 285.5,294" class="fg-a alt"/>
<text x="270" y="292" text-anchor="end" class="fg-t sm alt">② 同步寫進資料庫</text>
<text x="24" y="362" class="fg-t sm">兩邊都寫完才回 OK：讀永遠命中，寫比較慢</text>
<rect x="340" y="198" width="330" height="178" rx="10" class="fg-b"/>
<text x="354" y="222" class="fg-t warm">write-behind（延後寫入）</text>
<rect x="356" y="238" width="84" height="100" rx="6" class="fg-b"/><text x="398" y="292" text-anchor="middle" class="fg-t">應用程式</text>
<rect x="566" y="238" width="90" height="36" rx="6" class="fg-b warm"/><text x="611" y="261" text-anchor="middle" class="fg-t">快取</text>
<rect x="566" y="302" width="90" height="36" rx="6" class="fg-b"/><text x="611" y="325" text-anchor="middle" class="fg-t">資料庫</text>
<line x1="440" y1="256" x2="558" y2="256" class="fg-l warm"/><polygon points="566,256 558,251.5 558,260.5" class="fg-a warm"/>
<text x="503" y="250" text-anchor="middle" class="fg-t sm warm">① 寫入，馬上 OK</text>
<line x1="611" y1="274" x2="611" y2="294" class="fg-l warm dash"/><polygon points="611,302 606.5,294 615.5,294" class="fg-a warm"/>
<text x="600" y="292" text-anchor="end" class="fg-t sm warm">② 之後批次寫入</text>
<text x="354" y="362" class="fg-t sm warm">寫很快；快取掛了，還沒寫進去的就沒了</text>
</svg><figcaption>上面兩格講「讀」，下面兩格講「寫」。越往右下，程式碼越簡單、速度越快，但資料庫越不是「當下的真相」。</figcaption></figure>
<h4>cache-aside：最常見，也最好懂</h4>
<p>程式自己同時跟快取和資料庫說話。快取只是一個「可有可無的加速器」：Redis 整台掛掉，程式還能直接讀資料庫，只是比較慢。以 Node.js 的 ioredis 為例：</p>
<pre><code>async function getPlayer(id: string): Promise&lt;Player&gt; {
  const key = 'player:' + id;
  const cached = await redis.get(key);
  if (cached !== null) return JSON.parse(cached);
  const row = await db.findPlayer(id);              // 沒命中：讀資料庫
  await redis.set(key, JSON.stringify(row), 'EX', 300);
  return row;
}

async function renamePlayer(id: string, name: string) {
  await db.updatePlayerName(id, name);              // 先改資料庫
  await redis.del('player:' + id);                  // 再刪快取
}</code></pre>
<h4>read-through 和 write-through：把快取變成門面</h4>
<p>read-through 把「沒命中就去資料庫拿」這段邏輯包進快取層，程式只呼叫 <code>cache.get(key)</code>。很多語言的快取函式庫都有「給我一個載入函式，沒命中我自己呼叫」的設計。write-through 則是寫入也經過快取，由快取同步寫進資料庫，兩邊都成功才回應。好處是讀永遠命中、快取永遠是新的；壞處是每次寫都要等兩邊，而且很多寫進快取的資料可能根本沒人讀。AWS 的 DynamoDB Accelerator（DAX）就是一個放在 DynamoDB 前面的 read-through／write-through 快取。</p>
<h4>write-behind：快，但你在拿資料冒險</h4>
<p>寫入只進快取就回 OK，之後再一批一批寫回資料庫。最典型的用途是計數器：文章瀏覽數、按讚數，每次 <code>INCR</code> 一下 Redis，每分鐘把累積的數字寫回資料庫一次。一秒一萬次的 +1，變成一分鐘一次的 UPDATE。代價也很清楚：還沒寫回去的那一段只存在快取裡，快取掛了就沒了。所以它只適合「丟一點也沒關係」的資料。錢、道具、訂單，絕對不要用 write-behind。</p>

<h3><span class="badge lv2">進階</span>四、作廢與競態：為什麼是「刪」，而且刪了還是可能錯</h3>
<p>資料改了，快取裡的副本就過時了。讓它失效的動作叫<b>快取失效</b>（invalidation）。聽起來只是刪一個鍵，難的是<b>同時有好幾個人在讀和寫</b>。我們把三種常見的順序一一拿來檢查。</p>
<h4>順序一：更新資料庫，再把新值 SET 進快取</h4>
<p>兩個寫入者同時改同一筆：B1 把資料庫改成 v1，B2 把資料庫改成 v2，B2 先 SET 快取 v2，B1 因為網路慢，後 SET 快取 v1。結果資料庫是 v2，快取是 v1，而且會一直錯到 TTL 到期。這就是為什麼標準做法是「刪」不是「改」：刪除沒有先後之分，兩個人都刪，結果都是「沒有」。</p>
<h4>順序二：先刪快取，再更新資料庫</h4>
<p>寫入者 B 刪了鍵，還沒來得及改資料庫；讀取者 A 這時候沒命中，去資料庫讀到舊值 v1，SET 回快取；然後 B 才把資料庫改成 v2。快取又是舊的。這個窗口很大（整個資料庫寫入的時間），很容易發生。</p>
<h4>順序三：先更新資料庫，再刪快取（標準做法）</h4>
<p>這是上一課教的順序，大部分時候都對。但它還留著一個很小的窗口，下面這張時間軸就是它：</p>
<figure class="figure"><svg viewBox="0 0 680 345" class="fg" style="width:100%;max-width:680px" role="img" aria-label="時間軸：讀取者 A 快取沒中、從資料庫讀到 v1，接著寫入者 B 把資料庫改成 v2 並刪掉快取，最後 A 才把舊的 v1 寫回快取，結果快取是 v1、資料庫是 v2">
<rect x="35" y="30" width="90" height="28" rx="5" class="fg-b alt"/><text x="80" y="49" text-anchor="middle" class="fg-t">讀取者 A</text>
<rect x="215" y="30" width="90" height="28" rx="5" class="fg-b hot"/><text x="260" y="49" text-anchor="middle" class="fg-t">快取</text>
<rect x="375" y="30" width="90" height="28" rx="5" class="fg-b"/><text x="420" y="49" text-anchor="middle" class="fg-t">資料庫</text>
<rect x="555" y="30" width="90" height="28" rx="5" class="fg-b alt"/><text x="600" y="49" text-anchor="middle" class="fg-t">寫入者 B</text>
<line x1="80" y1="58" x2="80" y2="262" class="fg-l dim"/><line x1="260" y1="58" x2="260" y2="262" class="fg-l dim"/><line x1="420" y1="58" x2="420" y2="262" class="fg-l dim"/><line x1="600" y1="58" x2="600" y2="262" class="fg-l dim"/>
<line x1="80" y1="90" x2="252" y2="90" class="fg-l"/><polygon points="260,90 252,85.5 252,94.5" class="fg-a"/>
<text x="170" y="84" text-anchor="middle" class="fg-t sm">① GET，沒中</text>
<line x1="80" y1="130" x2="412" y2="130" class="fg-l"/><polygon points="420,130 412,125.5 412,134.5" class="fg-a"/>
<text x="170" y="124" text-anchor="middle" class="fg-t sm">② 讀到 v1</text>
<line x1="600" y1="170" x2="428" y2="170" class="fg-l alt"/><polygon points="420,170 428,165.5 428,174.5" class="fg-a alt"/>
<text x="510" y="164" text-anchor="middle" class="fg-t sm alt">③ 改成 v2</text>
<line x1="600" y1="210" x2="268" y2="210" class="fg-l alt"/><polygon points="260,210 268,205.5 268,214.5" class="fg-a alt"/>
<text x="510" y="204" text-anchor="middle" class="fg-t sm alt">④ 刪除這個鍵</text>
<line x1="80" y1="134" x2="80" y2="246" class="fg-l warm dash"/>
<text x="88" y="186" class="fg-t sm warm">A 被卡住一下</text>
<text x="88" y="202" class="fg-t sm">（GC、網路慢）</text>
<line x1="80" y1="250" x2="252" y2="250" class="fg-l warm"/><polygon points="260,250 252,245.5 252,254.5" class="fg-a warm"/>
<text x="170" y="244" text-anchor="middle" class="fg-t sm warm">⑤ SET v1</text>
<rect x="205" y="276" width="110" height="30" rx="5" class="fg-b warm"/><text x="260" y="296" text-anchor="middle" class="fg-t">快取 = v1</text>
<rect x="365" y="276" width="110" height="30" rx="5" class="fg-b hot"/><text x="420" y="296" text-anchor="middle" class="fg-t">資料庫 = v2</text>
<text x="340" y="332" text-anchor="middle" class="fg-t sm warm">A 的 SET 落在 B 的 DEL 之後：舊值被寫回快取，一直錯到 TTL 到期</text>
</svg><figcaption>要出事，A 的「讀資料庫到寫快取」這段，必須剛好包住 B 的整個「寫資料庫加刪鍵」。很少見，但流量大的系統每天都會遇到幾次。</figcaption></figure>
<p>為什麼說「很少見」？因為資料庫的讀通常比寫快得多，A 讀完、SET 完，B 往往還沒寫完。要出事，A 必須在讀完資料庫之後被卡住一下：一次垃圾回收（GC）的停頓、一個慢的網路封包。每秒幾萬個請求的系統裡，「很少見」就是「每天都有」。</p>
<h4>五種補強，依成本排列</h4>
<ol>
<li><b>永遠設 TTL。</b>這是最後一道保險：不管哪種競態，錯的值最多活到 TTL 到期。這也包括另一種更常見的狀況：程式改完資料庫、還沒刪鍵就當掉了。</li>
<li><b>延遲雙刪。</b>改資料庫、刪鍵，過幾百毫秒再刪一次。能縮小窗口，但沒辦法關上它，而且「幾百毫秒」只是猜的。</li>
<li><b>帶版本號寫入，而不是刪除。</b>資料表多一個每次更新都加 1 的 <code>version</code> 欄位。寫入者不刪鍵，改成「如果快取裡的版本比我舊，才寫入」；讀取者回填時也一樣。上圖的 ⑤ 帶著版本 1，快取裡已經是版本 2，就會被拒絕。比較版本和寫入必須是同一個原子動作，所以用 Lua 腳本：</li>
</ol>
<pre><code>-- KEYS[1] = 鍵；ARGV[1] = 版本；ARGV[2] = 值；ARGV[3] = TTL 秒數
local cur = redis.call('HGET', KEYS[1], 'v')
if cur and tonumber(cur) &gt;= tonumber(ARGV[1]) then return 0 end
redis.call('HSET', KEYS[1], 'v', ARGV[1], 'd', ARGV[2])
redis.call('EXPIRE', KEYS[1], ARGV[3])
return 1</code></pre>
<ol start="4">
<li><b>租約（lease）。</b>Facebook 在 2013 年的論文〈Scaling Memcache at Facebook〉裡用的方法：沒命中時，快取發給讀取者一張租約權杖；之後如果有人刪了這個鍵，權杖就作廢；讀取者回填時要出示權杖，作廢的就不准寫。上圖的 ⑤ 會因為 ④ 而被拒絕。</li>
<li><b>從資料庫的變更串流去刪。</b>不靠應用程式記得刪，而是另外跑一支程式讀資料庫的 binlog 或 WAL（例如用 Debezium），看到哪一列改了就刪對應的鍵。程式在改完資料庫後當掉也不怕。這跟第 3.7 課「佇列」裡的變更資料擷取是同一個技術。</li>
</ol>
<div class="note"><b>真正的結論：</b>快取永遠是「最終一致」的。別問「怎麼讓快取絕對不會錯」，要問「這份資料最多可以錯多久」，然後用 TTL 和上面的手段把錯的時間壓在那個範圍裡。不能錯的資料，例如核准提款時的餘額，就不要從快取讀。</div>

<h3><span class="badge lv3">專業</span>五、TTL、抖動，以及穿透、擊穿、雪崩</h3>
<p>TTL 怎麼定？看兩件事：這份資料多久改一次，以及使用者能忍受它舊多久。排行榜 10 秒、商品目錄 5 分鐘、功能開關 30 秒，都是常見的起點。TTL 太短，命中率掉、資料庫壓力上來；TTL 太長，錯的資料活太久、記憶體也被冷資料佔著。</p>
<h4>同時過期的陷阱</h4>
<p>假設你在 10:00:00 做了一次預熱，把 10 萬個鍵一口氣寫進快取，TTL 都是 3,600 秒。那麼 11:00:00 這一秒，10 萬個鍵會同時過期，同時沒命中，同時去打資料庫。解法是加上<b>抖動</b>（jitter）：TTL 不要固定，而是 3,600 秒上下隨機 10%。</p>
<figure class="figure"><svg viewBox="0 0 680 240" class="fg" style="width:100%;max-width:680px" role="img" aria-label="上面沒有抖動：10 萬個鍵在 11:00 同一秒過期，形成一根很高的尖峰；下面 TTL 加上正負 10% 抖動，過期分散在 10:54 到 11:06 的 12 分鐘裡">
<text x="10" y="70" class="fg-t sm warm">沒加抖動</text>
<line x1="80" y1="100" x2="640" y2="100" class="fg-l"/>
<rect x="355" y="30" width="10" height="70" class="fg-b warm"/>
<text x="374" y="44" class="fg-t sm warm">10 萬個鍵，同一秒過期</text>
<line x1="360" y1="20" x2="360" y2="212" class="fg-l dim dash"/>
<text x="10" y="186" class="fg-t sm acc">加 ±10% 抖動</text>
<line x1="80" y1="210" x2="640" y2="210" class="fg-l"/>
<rect x="84" y="200" width="16" height="10" class="fg-b alt"/><rect x="107" y="199" width="16" height="11" class="fg-b alt"/><rect x="130" y="201" width="16" height="9" class="fg-b alt"/><rect x="153" y="199" width="16" height="11" class="fg-b alt"/><rect x="176" y="200" width="16" height="10" class="fg-b alt"/><rect x="199" y="198" width="16" height="12" class="fg-b alt"/>
<rect x="222" y="200" width="16" height="10" class="fg-b alt"/><rect x="245" y="199" width="16" height="11" class="fg-b alt"/><rect x="268" y="201" width="16" height="9" class="fg-b alt"/><rect x="291" y="199" width="16" height="11" class="fg-b alt"/><rect x="314" y="200" width="16" height="10" class="fg-b alt"/><rect x="337" y="198" width="16" height="12" class="fg-b alt"/>
<rect x="367" y="200" width="16" height="10" class="fg-b alt"/><rect x="390" y="199" width="16" height="11" class="fg-b alt"/><rect x="413" y="201" width="16" height="9" class="fg-b alt"/><rect x="436" y="199" width="16" height="11" class="fg-b alt"/><rect x="459" y="200" width="16" height="10" class="fg-b alt"/><rect x="482" y="198" width="16" height="12" class="fg-b alt"/>
<rect x="505" y="200" width="16" height="10" class="fg-b alt"/><rect x="528" y="199" width="16" height="11" class="fg-b alt"/><rect x="551" y="201" width="16" height="9" class="fg-b alt"/><rect x="574" y="199" width="16" height="11" class="fg-b alt"/><rect x="597" y="200" width="16" height="10" class="fg-b alt"/><rect x="620" y="198" width="16" height="12" class="fg-b alt"/>
<text x="372" y="182" class="fg-t sm acc">分散到 12 分鐘裡，每秒大約 140 個</text>
<text x="80" y="228" text-anchor="middle" class="fg-t sm">10:54</text>
<text x="360" y="228" text-anchor="middle" class="fg-t sm">11:00</text>
<text x="640" y="228" text-anchor="middle" class="fg-t sm">11:06</text>
</svg><figcaption>同樣 10 萬次未命中，擠在一秒裡是事故，攤在 720 秒裡只是背景雜訊。圖裡的高度沒有照比例，真實差距是七百多倍。</figcaption></figure>
<p>算一下：±10% 代表過期時間落在 3,240 到 3,960 秒之間，一個 720 秒的窗口。10 萬個鍵攤在 720 秒裡，每秒大約 139 次未命中，資料庫輕鬆吃下。程式只要一行：<code>const ttl = Math.round(3600 * (0.9 + Math.random() * 0.2));</code></p>
<h4>中文面試常考的三個詞</h4>
<p>中文圈的面試很愛把快取故障分成三種問，名字很像，要分清楚：</p>
<table>
<tr><th>名稱</th><th>發生什麼事</th><th>主要防法</th></tr>
<tr><td><b>快取穿透</b></td><td>查一個根本不存在的資料（例如惡意用遞增的 ID 亂查），快取永遠沒有，每次都打穿到資料庫</td><td>把「查無資料」也快取起來，給短的 TTL；或用布隆過濾器（Bloom filter）先擋掉一定不存在的鍵</td></tr>
<tr><td><b>快取擊穿</b>（stampede）</td><td>一個很熱的鍵過期，大量請求同時沒命中，同時去重建</td><td>鎖、請求合併、提早刷新（下一節）</td></tr>
<tr><td><b>快取雪崩</b></td><td>大量的鍵同時過期，或整個快取叢集掛掉，流量全部落到資料庫</td><td>TTL 加抖動；快取做高可用；資料庫前面限流，寧可部分請求失敗也不要整個倒下</td></tr>
</table>

<h3><span class="badge lv3">專業</span>六、擊穿防護：鎖、請求合併、提早機率刷新</h3>
<p>先看一次擊穿到底有多兇。排行榜的鍵 <code>leaderboard:top100</code> 每秒被讀 2,000 次，重建它的查詢要 800 毫秒。它過期的那一刻，接下來 800 毫秒內進來的 1,600 個請求全都沒命中，全都去跑那個 800 毫秒的查詢。資料庫的 CPU 瞬間滿載，查詢變得更慢，更慢就讓更多請求擠進來，形成正回饋，直到整個資料庫倒下。</p>
<figure class="figure"><svg viewBox="0 0 680 262" class="fg" style="width:100%;max-width:680px" role="img" aria-label="左邊沒有保護：每一個沒命中的請求都直接查資料庫；右邊加上請求合併和鎖：同一個鍵只放行第一個請求去查資料庫，其他請求等同一個結果">
<text x="170" y="22" text-anchor="middle" class="fg-t warm">沒有保護</text>
<text x="515" y="22" text-anchor="middle" class="fg-t acc">請求合併＋鎖</text>
<line x1="340" y1="10" x2="340" y2="250" class="fg-l dim dash"/>
<rect x="20" y="40" width="70" height="28" rx="5" class="fg-b"/><text x="55" y="59" text-anchor="middle" class="fg-t sm">請求</text>
<rect x="20" y="80" width="70" height="28" rx="5" class="fg-b"/><text x="55" y="99" text-anchor="middle" class="fg-t sm">請求</text>
<rect x="20" y="120" width="70" height="28" rx="5" class="fg-b"/><text x="55" y="139" text-anchor="middle" class="fg-t sm">請求</text>
<rect x="20" y="160" width="70" height="28" rx="5" class="fg-b"/><text x="55" y="179" text-anchor="middle" class="fg-t sm">請求</text>
<rect x="20" y="200" width="70" height="28" rx="5" class="fg-b"/><text x="55" y="219" text-anchor="middle" class="fg-t sm">請求</text>
<line x1="90" y1="54" x2="212" y2="54" class="fg-l warm"/><polygon points="220,54 212,49.5 212,58.5" class="fg-a warm"/>
<line x1="90" y1="94" x2="212" y2="94" class="fg-l warm"/><polygon points="220,94 212,89.5 212,98.5" class="fg-a warm"/>
<line x1="90" y1="134" x2="212" y2="134" class="fg-l warm"/><polygon points="220,134 212,129.5 212,138.5" class="fg-a warm"/>
<line x1="90" y1="174" x2="212" y2="174" class="fg-l warm"/><polygon points="220,174 212,169.5 212,178.5" class="fg-a warm"/>
<line x1="90" y1="214" x2="212" y2="214" class="fg-l warm"/><polygon points="220,214 212,209.5 212,218.5" class="fg-a warm"/>
<rect x="220" y="40" width="100" height="188" rx="6" class="fg-b warm"/>
<text x="270" y="112" text-anchor="middle" class="fg-t">資料庫</text>
<text x="270" y="134" text-anchor="middle" class="fg-t sm">1,600 個</text>
<text x="270" y="152" text-anchor="middle" class="fg-t sm">同樣的查詢</text>
<text x="270" y="174" text-anchor="middle" class="fg-t sm warm">CPU 滿載</text>
<text x="170" y="250" text-anchor="middle" class="fg-t sm">每個沒命中的請求都自己去查</text>
<rect x="360" y="40" width="70" height="28" rx="5" class="fg-b"/><text x="395" y="59" text-anchor="middle" class="fg-t sm">請求</text>
<rect x="360" y="80" width="70" height="28" rx="5" class="fg-b"/><text x="395" y="99" text-anchor="middle" class="fg-t sm">請求</text>
<rect x="360" y="120" width="70" height="28" rx="5" class="fg-b"/><text x="395" y="139" text-anchor="middle" class="fg-t sm">請求</text>
<rect x="360" y="160" width="70" height="28" rx="5" class="fg-b"/><text x="395" y="179" text-anchor="middle" class="fg-t sm">請求</text>
<rect x="360" y="200" width="70" height="28" rx="5" class="fg-b"/><text x="395" y="219" text-anchor="middle" class="fg-t sm">請求</text>
<line x1="430" y1="54" x2="462" y2="54" class="fg-l"/><polygon points="470,54 462,49.5 462,58.5" class="fg-a"/>
<line x1="430" y1="94" x2="462" y2="94" class="fg-l"/><polygon points="470,94 462,89.5 462,98.5" class="fg-a"/>
<line x1="430" y1="134" x2="462" y2="134" class="fg-l on"/><polygon points="470,134 462,129.5 462,138.5" class="fg-a on"/>
<line x1="430" y1="174" x2="462" y2="174" class="fg-l"/><polygon points="470,174 462,169.5 462,178.5" class="fg-a"/>
<line x1="430" y1="214" x2="462" y2="214" class="fg-l"/><polygon points="470,214 462,209.5 462,218.5" class="fg-a"/>
<rect x="470" y="40" width="80" height="188" rx="6" class="fg-b alt"/>
<text x="510" y="116" text-anchor="middle" class="fg-t">合併點</text>
<text x="510" y="136" text-anchor="middle" class="fg-t sm">只放行</text>
<text x="510" y="154" text-anchor="middle" class="fg-t sm">第一個</text>
<line x1="550" y1="134" x2="582" y2="134" class="fg-l on"/><polygon points="590,134 582,129.5 582,138.5" class="fg-a on"/>
<rect x="590" y="104" width="80" height="60" rx="6" class="fg-b hot"/>
<text x="630" y="130" text-anchor="middle" class="fg-t">資料庫</text>
<text x="630" y="150" text-anchor="middle" class="fg-t sm">1 個查詢</text>
<text x="515" y="250" text-anchor="middle" class="fg-t sm">其他人等同一個結果，或先拿舊值</text>
</svg><figcaption>同樣五個沒命中的請求，左邊變成五個資料庫查詢，右邊只有一個。真實流量下，左邊是 1,600 比 1。</figcaption></figure>
<h4>防法一：重建鎖</h4>
<p>沒命中時先搶一把鎖，搶到的人去重建，其他人等一下再讀快取，或先回傳舊值。Redis 的標準寫法是 <code>SET</code> 加 <code>NX</code>（不存在才設定）和 <code>PX</code>（毫秒過期）：</p>
<pre><code>const token = crypto.randomUUID();
const got = await redis.set('lock:' + key, token, 'PX', 5000, 'NX');
if (got === 'OK') {
  try {
    await rebuild(key);                         // 只有我在重建
  } finally {
    await redis.eval(RELEASE, 1, 'lock:' + key, token);
  }
} else {
  // 沒搶到：等 50 ms 再讀一次快取，或先回傳舊值
}</code></pre>
<p>釋放鎖不能直接 <code>DEL</code>：如果你的重建超過 5 秒，鎖已經自動過期、被別人搶走，你一刪就刪到別人的鎖。所以要「確認還是我的才刪」，而且確認和刪除要在同一個原子動作裡完成：</p>
<pre><code>-- RELEASE
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0</code></pre>
<p>「等一下再讀」的那些請求，最好的去處是<b>舊值</b>。做法是在值裡另外存一個「邏輯過期時間」，Redis 的 TTL 設得比它長很多。邏輯上過期了，第一個人搶鎖去背景重建，其他人繼續拿舊值，使用者完全感覺不到。這個做法常被叫作 stale-while-revalidate，跟 HTTP 快取裡同名的指令是同一個想法。</p>
<h4>防法二：請求合併（request coalescing）</h4>
<p>鎖是跨伺服器的；在同一個行程裡，還有更便宜的做法：同一個鍵同時有很多個沒命中，只發一次查詢，大家共用同一個 Promise。Go 有現成的 <code>golang.org/x/sync/singleflight</code>，Node.js 幾行就寫得出來：</p>
<pre><code>const inflight = new Map&lt;string, Promise&lt;string&gt;&gt;();

function loadOnce(key: string, fetch: () =&gt; Promise&lt;string&gt;) {
  let p = inflight.get(key);
  if (!p) {
    p = fetch().finally(() =&gt; inflight.delete(key));
    inflight.set(key, p);
  }
  return p;
}</code></pre>
<p>有 20 台伺服器，最多就是 20 個查詢，而不是 1,600 個。很多團隊只做這一步就夠了，連鎖都不用。</p>
<h4>防法三：提早機率刷新</h4>
<p>前兩招都是「過期了再處理」。第三招是不等它過期：每次讀到快取時擲個骰子，越接近過期，越可能決定「我提早幫大家重建」。2015 年的論文〈Optimal Probabilistic Cache Stampede Prevention〉給出的公式（常被叫作 XFetch）是：</p>
<pre><code>// delta：重建要花多久（毫秒）；beta：通常設 1，越大越早刷新
function shouldRefreshEarly(expiresAt: number, delta: number, beta = 1) {
  return Date.now() - delta * beta * Math.log(Math.random()) &gt;= expiresAt;
}</code></pre>
<p><code>Math.log(Math.random())</code> 是負數，所以整個式子是「現在時間加上一段隨機的提前量」。用上面的排行榜代數字：重建要 800 毫秒，距離過期還有 5 秒時，單一請求決定刷新的機率大約是 0.2%，每秒 2,000 個請求就大約有 4 個會觸發；距離過期還有 10 秒時，機率只有百萬分之幾。所以實際上它會在過期前幾秒，由極少數的請求先把值刷新好，擊穿根本沒機會發生。搭配重建鎖，就能確保真的只有一個人在重建。</p>

<h3><span class="badge lv3">專業</span>七、熱鍵與大鍵</h3>
<p><b>熱鍵</b>（hot key）是某一個鍵收到不成比例的流量：首頁的活動設定、一個直衝排行榜第一名的熱門房間、全站共用的一份設定。問題在於：Redis Cluster 把每個鍵用 CRC16 算出 16,384 個雜湊槽（hash slot）裡的一個，每個槽只住在一個節點上。你加再多節點，同一個鍵還是只有一台在扛。</p>
<p>算一次就知道為什麼會撐不住：一個 100 KB 的鍵，每秒被讀 10,000 次，光是網路就是每秒 1 GB，也就是 8 Gbps，一般雲端主機的網卡直接被塞滿，跟 CPU 還沒關係。</p>
<ul>
<li><b>怎麼找</b>：<code>redis-cli --hotkeys</code>（需要淘汰策略設成 LFU 類，它靠存取頻率計數）；<code>redis-cli --bigkeys</code> 找大鍵；<code>MONITOR</code> 能看到每一個指令，但本身很耗效能，只能開幾秒；最好的是在應用程式端記錄每個鍵的讀取次數。</li>
<li><b>程式內再快取一層</b>：熱鍵在每台應用程式伺服器的記憶體裡放 1 到 5 秒。20 台伺服器，Redis 每秒只會被問 20 次左右，而不是一萬次。代價是最多晚幾秒看到新值。</li>
<li><b>拆成好幾份</b>：把 <code>config:home</code> 存成 <code>config:home#0</code> 到 <code>config:home#9</code> 十份，讀的時候隨機挑一份，寫的時候十份一起更新。在 Cluster 裡它們會落在不同的槽、不同的節點。</li>
<li><b>把值變小</b>：只快取前端真的需要的欄位，壓縮，或拆成好幾個小鍵。</li>
</ul>
<p><b>大鍵</b>（big key）是另一種病：一個有五百萬個欄位的 hash、一個幾百 MB 的字串。讀它很慢，刪它更慢：<code>DEL</code> 一個大鍵，Redis 要一次釋放所有記憶體，這段時間誰都動不了。刪大鍵要用 <code>UNLINK</code>（Redis 4.0 起），它把真正的釋放丟到背景執行緒去做。</p>

<h3><span class="badge lv4">專家</span>八、Redis 內部：單執行緒、持久化、淘汰、碎片</h3>
<h4>單執行緒：快的原因，也是最大的弱點</h4>
<p>Redis 用一條主執行緒、一個事件迴圈處理所有指令：一次取一個指令、執行完、再取下一個。資料全在記憶體裡、沒有鎖的開銷，所以一台每秒能做到十萬個等級的簡單操作；而且每個指令天生就是原子的，<code>INCR</code> 不會有兩個人同時加的問題。但反過來說，<b>只要有一個指令很慢，所有人都在等它</b>。</p>
<figure class="figure"><svg viewBox="0 26 680 196" class="fg" style="width:100%;max-width:680px" role="img" aria-label="四個用戶端的指令排進同一個佇列，主執行緒一次執行一個；KEYS 星號佔住很長一段時間，後面的 GET 只能排隊等">
<rect x="20" y="40" width="90" height="28" rx="5" class="fg-b"/><text x="65" y="59" text-anchor="middle" class="fg-t sm">用戶端 1</text>
<rect x="20" y="80" width="90" height="28" rx="5" class="fg-b"/><text x="65" y="99" text-anchor="middle" class="fg-t sm">用戶端 2</text>
<rect x="20" y="120" width="90" height="28" rx="5" class="fg-b warm"/><text x="65" y="139" text-anchor="middle" class="fg-t sm">用戶端 3</text>
<rect x="20" y="160" width="90" height="28" rx="5" class="fg-b"/><text x="65" y="179" text-anchor="middle" class="fg-t sm">用戶端 4</text>
<line x1="110" y1="54" x2="142" y2="54" class="fg-l"/><polygon points="150,54 142,49.5 142,58.5" class="fg-a"/>
<line x1="110" y1="94" x2="142" y2="94" class="fg-l"/><polygon points="150,94 142,89.5 142,98.5" class="fg-a"/>
<line x1="110" y1="134" x2="142" y2="134" class="fg-l warm"/><polygon points="150,134 142,129.5 142,138.5" class="fg-a warm"/>
<line x1="110" y1="174" x2="142" y2="174" class="fg-l"/><polygon points="150,174 142,169.5 142,178.5" class="fg-a"/>
<rect x="150" y="40" width="120" height="148" rx="6" class="fg-b"/>
<text x="210" y="60" text-anchor="middle" class="fg-t sm">指令佇列</text>
<text x="210" y="84" text-anchor="middle" class="fg-t sm mono">GET a</text>
<text x="210" y="104" text-anchor="middle" class="fg-t sm mono">SET b</text>
<text x="210" y="124" text-anchor="middle" class="fg-t sm mono warm">KEYS *</text>
<text x="210" y="144" text-anchor="middle" class="fg-t sm mono">GET c</text>
<text x="210" y="164" text-anchor="middle" class="fg-t sm mono">GET d</text>
<line x1="270" y1="111" x2="302" y2="111" class="fg-l"/><polygon points="310,111 302,106.5 302,115.5" class="fg-a"/>
<text x="310" y="60" class="fg-t">主執行緒：一次只執行一個</text>
<rect x="310" y="96" width="350" height="30" class="fg-b"/>
<rect x="310" y="96" width="22" height="30" class="fg-b hot"/>
<rect x="332" y="96" width="22" height="30" class="fg-b hot"/>
<rect x="354" y="96" width="236" height="30" class="fg-b warm"/>
<rect x="590" y="96" width="22" height="30" class="fg-b alt"/>
<rect x="612" y="96" width="22" height="30" class="fg-b alt"/>
<text x="332" y="88" text-anchor="middle" class="fg-t sm">a、b</text>
<text x="472" y="88" text-anchor="middle" class="fg-t sm warm">把整個鍵空間掃一遍</text>
<text x="612" y="88" text-anchor="middle" class="fg-t sm">c、d</text>
<text x="472" y="116" text-anchor="middle" class="fg-t sm mono">KEYS *</text>
<text x="485" y="150" text-anchor="middle" class="fg-t sm warm">KEYS 跑完之前，其他指令一個都不會執行</text>
<text x="340" y="210" text-anchor="middle" class="fg-t sm">Redis 6 起的 I/O 執行緒只幫忙收發網路資料，指令本身仍然一個一個執行</text>
</svg><figcaption>Redis 的延遲不是看「你的指令多快」，而是看「你前面排了什麼」。一個 O(N) 的指令，會讓所有用戶端一起變慢。</figcaption></figure>
<p>危險的指令都有一個共同點：工作量跟資料量成正比，也就是 O(N)。<code>KEYS *</code>、對很大的集合下 <code>SMEMBERS</code> 或 <code>HGETALL</code>、刪一個大鍵、在 Lua 腳本裡跑大迴圈。對策：用 <code>SCAN</code>、<code>SSCAN</code>、<code>HSCAN</code> 分批走訪；用 <code>SLOWLOG GET</code> 找出慢指令（預設記錄超過 10 毫秒的指令）；正式環境可以用 <code>rename-command</code> 或 ACL 直接禁止 <code>KEYS</code>、<code>FLUSHALL</code> 這類指令。相對地，Memcached 是多執行緒的，單一實例能用滿多個核心，但它只有最簡單的鍵值操作，沒有 Redis 那些資料結構。</p>
<h4>持久化：RDB 與 AOF</h4>
<ul>
<li><b>RDB 快照</b>：Redis 呼叫 <code>fork()</code> 生出一個子行程，子行程把當下的記憶體整份寫成一個檔案。父子行程一開始共用同一批記憶體頁，父行程改到哪一頁，作業系統才複製那一頁（copy-on-write）。所以快照期間寫入越多，多吃的記憶體越多，最壞接近兩倍。實例越大，<code>fork()</code> 本身那一下的停頓也越明顯。</li>
<li><b>AOF</b>（append-only file）：每個寫入指令都追加到一個檔案，概念跟資料庫的 WAL 一樣。<code>appendfsync</code> 有三段：<code>always</code> 每個指令都 fsync（最慢）、<code>everysec</code> 每秒一次（預設，最多丟大約一秒）、<code>no</code> 交給作業系統決定。AOF 會越來越長，所以 Redis 會在背景重寫，把它壓縮成目前狀態的最短指令序列。</li>
<li><b>預設值</b>：Redis 預設開 RDB、不開 AOF（<code>appendonly no</code>）。純快取的話，這樣甚至全關都可以；當資料庫用的話，就要開 AOF。</li>
</ul>
<h4>淘汰策略：記憶體滿了怎麼辦</h4>
<p>設定 <code>maxmemory</code> 之後，滿了就照 <code>maxmemory-policy</code> 處理。<b>預設是 <code>noeviction</code></b>：不淘汰任何東西，寫入直接回錯誤「OOM command not allowed when used memory &gt; 'maxmemory'」。對快取來說這通常不是你要的，常見的選擇是：</p>
<table>
<tr><th>策略</th><th>淘汰誰</th><th>適合</th></tr>
<tr><td><code>allkeys-lru</code></td><td>所有鍵裡最久沒被用到的</td><td>純快取，最常見的選擇</td></tr>
<tr><td><code>allkeys-lfu</code></td><td>所有鍵裡最少被用到的</td><td>純快取，有少數長期熱門的鍵</td></tr>
<tr><td><code>volatile-lru</code>／<code>volatile-lfu</code>／<code>volatile-ttl</code></td><td>只從有設 TTL 的鍵裡挑</td><td>快取和狀態混住一台時，保護沒設 TTL 的鍵</td></tr>
<tr><td><code>noeviction</code></td><td>不淘汰，寫入報錯</td><td>Redis 當資料庫用，丟資料比報錯更糟的時候</td></tr>
</table>
<p>兩個內部細節：Redis 的 LRU 是<b>近似</b>的，它不維護一條完整的使用順序，而是每次隨機抽幾個鍵（<code>maxmemory-samples</code>，預設 5），淘汰其中最舊的；過期的鍵也不是一到期就消失，而是被讀到時順手刪，加上背景定期抽查，所以過期的鍵會多佔一陣子記憶體。</p>
<h4>記憶體碎片</h4>
<p><code>INFO memory</code> 裡有兩個數字：<code>used_memory</code> 是 Redis 認為自己用了多少，<code>used_memory_rss</code> 是作業系統實際分給它多少。兩者相除就是 <code>mem_fragmentation_ratio</code>。假設 used 是 6 GB、rss 是 9 GB，比例 1.5，代表有 3 GB 是碎片：大小不一的值反覆寫入、刪除後，記憶體被切得零零碎碎，空著卻還不回去。比例低於 1 更糟，代表有一部分被換到 swap 了，延遲會暴增。Redis 搭配 jemalloc 時可以開 <code>activedefrag yes</code>，在背景慢慢整理。規劃容量時，要替碎片、RDB 的 copy-on-write 和複寫緩衝區留空間，不能把 <code>maxmemory</code> 設成整台機器的記憶體。</p>
<p>順帶一提：2024 年 Redis 改了授權條款，Linux 基金會因此分出了指令相容的 Valkey，AWS 和 Google Cloud 的代管服務也開始支援它。對你寫程式和維運來說，觀念和指令幾乎一樣。</p>

<h3><span class="badge lv4">專家</span>九、它是快取，還是你的資料庫？</h3>
<p>上一課說：如果某個值只存在 Redis 裡，它就是狀態（state），不是快取。這個區分會決定一整串設定，混在一起就兩邊都做不好：</p>
<table>
<tr><th></th><th>純快取</th><th>當狀態用</th></tr>
<tr><td>Redis 整台不見</td><td>變慢，但資料都還在資料庫</td><td>資料永久消失</td></tr>
<tr><td>淘汰策略</td><td><code>allkeys-lru</code> 或 <code>allkeys-lfu</code></td><td><code>noeviction</code>，寧可報錯</td></tr>
<tr><td>持久化</td><td>可以全關，或只留 RDB 方便重啟後不用全冷</td><td>AOF <code>everysec</code>，加上 RDB 備份送到別的地方</td></tr>
<tr><td>高可用</td><td>可有可無</td><td>一定要有副本和自動容錯移轉（Sentinel 或 Cluster）</td></tr>
<tr><td>程式怎麼對待它</td><td>連不上就跳過、直接讀資料庫，逾時設很短（例如 50 毫秒）</td><td>連不上就是故障</td></tr>
</table>
<p>最乾淨的做法是<b>分成兩個實例</b>：一台純快取，一台放狀態。就算要省錢擠在一起，也要確定快取的鍵都有 TTL，再用 <code>volatile-*</code> 策略保護狀態。</p>
<p>當狀態用時，還要記得兩個限制。第一，Redis 的複寫是非同步的，主節點回了 OK 才送給副本，容錯移轉時可能丟掉最後一小段寫入，跟第 3.4 課資料庫的非同步複寫一模一樣。<code>WAIT</code> 指令可以等副本確認，降低風險，但不能把它變成強一致的系統。第二，用 Redis 做分散式鎖，用來「避免重複做工」沒問題；但如果鎖錯了會造成資料錯誤（例如兩個人同時扣到同一筆點數），就不能只靠它。Martin Kleppmann 2016 年的文章〈How to do distributed locking〉把這個問題講得很透：鎖會因為 GC 停頓、時鐘跳動而過期，真正的保護要靠資料層檢查圍籬權杖，或乾脆用資料庫的交易和唯一約束。</p>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>更新資料時，把快取的值一起改掉最省事</td><td>兩個寫入者的順序可能顛倒，舊值會蓋掉新值。標準做法是刪鍵，或帶版本號寫入。</td></tr>
<tr><td>先改資料庫再刪快取，就絕對一致</td><td>還有一個很小的競態窗口，而且程式可能在兩步之間當掉。TTL 是一定要有的最後保險。</td></tr>
<tr><td>命中率 95% 和 98% 差不多</td><td>資料庫看到的是未命中的部分：5% 對 2%，負擔差了 2.5 倍。</td></tr>
<tr><td>快取越多層越好</td><td>每多一層，就多一個會過時、要作廢的副本。先看資料庫自己的快取夠不夠大，再看命中率值不值得。</td></tr>
<tr><td>Redis 很快，所以什麼指令都可以下</td><td>單執行緒，一個 O(N) 指令會讓所有人一起等。<code>KEYS</code> 永遠不要在正式環境下。</td></tr>
<tr><td>Redis 記憶體滿了會自動丟掉舊資料</td><td>預設是 <code>noeviction</code>：不丟，直接讓寫入失敗。要自己設淘汰策略。</td></tr>
<tr><td>鍵一過期就會立刻從記憶體消失</td><td>過期是被讀到時刪，加上背景抽查，會多佔一陣子記憶體。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>Node.js／Go 後端</b>：替每一種快取的資料寫下「最多能舊多久」，用它決定 TTL。Redis 的用戶端一定要設連線逾時和指令逾時；純快取的話，Redis 出錯就直接讀資料庫，不要讓快取的故障變成整個服務的故障。</li>
<li><b>遊戲</b>：排行榜很適合用 Redis 的有序集合（sorted set），讀多寫少、晚幾秒沒關係；玩家的點數和背包是狀態，要以資料庫為準。遊戲設定檔這類全服共用、每秒被讀幾千次的資料，是典型的熱鍵，放程式記憶體幾秒最划算。</li>
<li><b>前端（Vue、TypeScript）</b>：Pinia 或 TanStack Query 裡的資料也是快取，一樣有「什麼時候作廢」的問題。TanStack Query 的 <code>staleTime</code> 和背景重新抓取，就是本章的 TTL 加 stale-while-revalidate。</li>
<li><b>Docker 與雲端</b>：本機用 <code>redis:7-alpine</code> 做實驗很方便；雲端用 ElastiCache、Memorystore 這類代管服務時，記得檢查淘汰策略（有些預設不是你要的）、記憶體使用率和 <code>evicted_keys</code> 的警報。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<p>下面是後端和系統設計面試裡真的會出現的題目。先自己講一遍，再打開參考答案。</p>
<ol>
<li>「cache-aside 模式下，資料更新時你會先更新資料庫還是先刪快取？為什麼？還有什麼問題？」</li>
<li>「一個熱門的鍵過期，資料庫瞬間被打爆。你會怎麼防？」</li>
<li>「快取穿透、擊穿、雪崩，分別是什麼？怎麼處理？」</li>
<li>「Redis 為什麼是單執行緒還這麼快？單執行緒有什麼代價？」</li>
<li>「Redis 記憶體快滿了，你會看哪些東西、調哪些設定？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>先更新資料庫、再刪快取。刪而不是改，是因為兩個寫入者 SET 的順序可能顛倒；先刪快取再改資料庫，讀取者會在中間把舊值讀回快取，窗口很大。剩下的問題有兩個：一是讀取者在寫入前讀到舊值、在刪除後才回填，造成很少見的舊值回填；二是程式在改完資料庫、刪鍵之前當掉。所以一定要設 TTL 當保險，要求更高時用帶版本號的條件寫入、租約，或從資料庫的變更串流去刪。最後補一句：快取本質上是最終一致，強一致的資料不要讀快取。</li>
<li>先講原因：鍵過期瞬間，大量請求同時沒命中、同時重建。防法有三層：同一個行程內做請求合併（singleflight），多台伺服器之間用 <code>SET NX PX</code> 的重建鎖，只讓一個人重建，其他人回傳舊值（邏輯過期時間加上更長的實體 TTL）；或用機率提早刷新，在過期前就由少數請求重建。另外 TTL 加抖動，避免一批鍵同時過期。</li>
<li>穿透是查不存在的資料，快取永遠沒有，每次都打到資料庫，用快取空結果或布隆過濾器擋。擊穿是單一熱鍵過期，大量請求同時重建，用鎖、合併、提早刷新。雪崩是大量鍵同時過期或整個快取掛掉，用 TTL 抖動、快取高可用，以及資料庫前的限流和降級。</li>
<li>資料都在記憶體、操作大多是 O(1)，瓶頸通常是網路而不是 CPU；單執行緒沒有鎖的競爭和內容切換，還讓每個指令天生是原子的；再加上 I/O 多工（epoll）一條執行緒就能處理大量連線。代價是任何慢指令都會擋住所有人，所以不能用 <code>KEYS</code>、大鍵要用 <code>UNLINK</code>、要用 <code>SCAN</code> 分批走訪；另外單一實例只能用一個核心執行指令，要更多吞吐量就得分片。Redis 6 的 I/O 執行緒只分擔網路讀寫，不改變指令一個一個執行這件事。</li>
<li>先看 <code>INFO memory</code>：<code>used_memory</code>、<code>used_memory_rss</code> 和碎片比例；看 <code>evicted_keys</code> 和 <code>expired_keys</code>；用 <code>--bigkeys</code> 或記憶體分析找出佔最多的鍵。設定上：確認 <code>maxmemory</code> 有留餘裕給碎片和 fork，確認淘汰策略對（純快取用 <code>allkeys-lru</code> 或 <code>allkeys-lfu</code>），碎片高就開 <code>activedefrag</code>。根本解法通常是：沒設 TTL 的鍵補上 TTL、把大值變小、把狀態和快取分開，真的不夠才加記憶體或分片。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>每秒 8,000 個請求，Redis 一次 0.4 毫秒、資料庫一次 15 毫秒。命中率從 97% 掉到 90%，平均延遲和資料庫每秒的查詢數各變成多少？</li>
<li>用上一課的 Docker Redis（<code>docker run -d --name r redis:7-alpine</code>）做：先用 <code>docker exec r redis-cli CONFIG SET maxmemory 2mb</code> 設上限，再寫入五萬個鍵：<code>docker exec r sh -c 'for i in $(seq 1 50000); do echo "SET k$i $i"; done | redis-cli'</code>。看到什麼錯誤？改成 <code>CONFIG SET maxmemory-policy allkeys-lru</code> 再試一次，<code>INFO stats</code> 裡哪個數字變了？做完 <code>docker rm -f r</code>。</li>
<li>畫出「先刪快取、再更新資料庫」會讓快取變成舊值的時間軸，至少要有讀取者、寫入者、快取、資料庫四條線。</li>
<li>一個鍵重建要 2 秒，每秒被讀 500 次。不做任何保護，它過期時資料庫會收到大約多少個同樣的查詢？加上同一行程內的請求合併、你有 12 台伺服器，變成多少？</li>
<li>列出你的服務放在 Redis 裡的三種資料，替每一種寫下：它是快取還是狀態？可以舊多久？TTL 設多少？Redis 整台不見時會怎樣？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>97%：0.97 × 0.4 + 0.03 × 15.4 ≈ 0.39 + 0.46 = 0.85 ms，資料庫每秒 8,000 × 3% = 240 個查詢。90%：0.9 × 0.4 + 0.1 × 15.4 = 0.36 + 1.54 = 1.9 ms，資料庫每秒 800 個。延遲變兩倍多，資料庫負擔變成 3.3 倍多。</li>
<li>預設的 <code>noeviction</code> 下，記憶體一滿，寫入就回 <code>OOM command not allowed when used memory &gt; 'maxmemory'</code>。改成 <code>allkeys-lru</code> 後寫入會成功，<code>INFO stats</code> 裡的 <code>evicted_keys</code> 開始增加，代表舊的鍵被踢掉了。</li>
<li>B 刪掉鍵 → A 讀快取沒中 → A 讀資料庫拿到舊值 v1 → B 把資料庫改成 v2 → A 把 v1 寫回快取。結果快取 v1、資料庫 v2，一直錯到 TTL 到期。窗口等於 B 寫資料庫的整段時間，比「先改再刪」的窗口大得多。</li>
<li>過期後的 2 秒內，每秒 500 個請求都會沒命中：大約 1,000 個同樣的查詢（實際上會更多，因為資料庫被壓垮後重建會超過 2 秒）。加上請求合併後，每台伺服器同一個鍵只發一次，12 台就是最多 12 個；再加上跨伺服器的重建鎖，就只剩 1 個。</li>
<li>例子：工作階段是狀態，丟了使用者要重新登入，要持久化和副本；排行榜是快取，可以舊 10 秒，TTL 10 到 30 秒，Redis 不見就從資料庫重算；遊戲設定是快取，可以舊 1 分鐘，而且是熱鍵，再加程式內快取。重點是每一種都要能回答「Redis 不見時會怎樣」。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>Redis 官方文件</b>（<a href="https://redis.io/docs/">redis.io/docs</a>）：Persistence、Key eviction、Client-side caching、Latency 這幾篇，把本章的內部機制講得最準確。</li>
<li><b>〈Scaling Memcache at Facebook〉</b>（NSDI 2013 論文，USENIX 網站可免費下載）：租約、跨區域作廢、熱鍵，全部都是真實的超大規模經驗。</li>
<li><b>〈Optimal Probabilistic Cache Stampede Prevention〉</b>（VLDB 2015）：XFetch 公式的出處，數學不難，值得看一次推導。</li>
<li><b>Martin Kleppmann〈How to do distributed locking〉</b>（2016 年部落格文章）：看完你就知道 Redis 鎖能做什麼、不能做什麼。</li>
</ul>
` });
