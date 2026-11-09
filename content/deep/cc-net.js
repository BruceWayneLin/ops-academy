DEEP({ 'cc-net': `
<p>上一課寫了一個小小的 <code>Net</code>：一條 WebSocket、帶 id 的請求、沒有 id 的推播、斷線後退避重連、重連後要一份快照。這一章從線上的位元組開始往上拆：WebSocket 怎麼接通、一則訊息在線上長什麼樣子、協定要怎麼設計才能改版、順序和重複的訊息怎麼處理、什麼叫冪等、怎麼發現一條「看起來還活著」的死連線、為什麼伺服器一定要說了算、用戶端預測是什麼，以及用戶端到底哪些東西不能信。這些是連線遊戲工程師的基本功，也是面試最愛問的地方。</p>

<h3><span class="badge lv1">基礎</span>一、WebSocket 怎麼接通：先講 HTTP，再換語言</h3>
<p>打電話到公司總機，先跟總機說「請幫我轉 3 號分機」；接通之後，你跟分機那頭的人可以改用台語聊一整個下午。WebSocket 就是這樣：它先用一個普通的 HTTP 請求打進去，說「我想換成 WebSocket」；伺服器答應之後，<b>同一條 TCP 連線</b>就不再講 HTTP，改用 WebSocket 自己的格式，雙方隨時都能開口。</p>
<figure class="figure"><svg viewBox="0 0 640 320" class="fg" style="width:100%;max-width:640px" role="img" aria-label="WebSocket 連線的時序：先 TCP 交握一個來回，wss 再加 TLS 握手一個來回，接著 HTTP 升級請求與 101 回應一個來回，之後同一條連線上只跑 frame">
<rect x="50" y="10" width="140" height="30" rx="6" class="fg-b alt"/><text x="120" y="30" text-anchor="middle" class="fg-t">瀏覽器</text>
<rect x="450" y="10" width="140" height="30" rx="6" class="fg-b alt"/><text x="520" y="30" text-anchor="middle" class="fg-t">伺服器</text>
<line x1="120" y1="40" x2="120" y2="315" class="fg-l dim"/><line x1="520" y1="40" x2="520" y2="315" class="fg-l dim"/>
<line x1="128" y1="70" x2="512" y2="70" class="fg-l"/><polygon points="520,70 512,65.5 512,74.5" class="fg-a"/><polygon points="120,70 128,65.5 128,74.5" class="fg-a"/>
<text x="320" y="62" text-anchor="middle" class="fg-t sm">TCP 三向交握</text><text x="112" y="74" text-anchor="end" class="fg-t sm">1 RTT</text>
<line x1="128" y1="110" x2="512" y2="110" class="fg-l"/><polygon points="520,110 512,105.5 512,114.5" class="fg-a"/><polygon points="120,110 128,105.5 128,114.5" class="fg-a"/>
<text x="320" y="102" text-anchor="middle" class="fg-t sm">TLS 1.3 握手（wss 才有）</text><text x="112" y="114" text-anchor="end" class="fg-t sm">2 RTT</text>
<line x1="120" y1="150" x2="512" y2="150" class="fg-l alt"/><polygon points="520,150 512,145.5 512,154.5" class="fg-a alt"/>
<text x="320" y="142" text-anchor="middle" class="fg-t sm mono alt">GET /play　Upgrade: websocket</text>
<line x1="520" y1="190" x2="128" y2="190" class="fg-l on"/><polygon points="120,190 128,185.5 128,194.5" class="fg-a on"/>
<text x="320" y="182" text-anchor="middle" class="fg-t sm mono acc">101 Switching Protocols</text><text x="112" y="194" text-anchor="end" class="fg-t sm">3 RTT</text>
<rect x="140" y="210" width="360" height="40" rx="6" class="fg-b hot"/><text x="320" y="235" text-anchor="middle" class="fg-t">從這裡開始只有 frame，雙方隨時都能送</text>
<line x1="120" y1="275" x2="512" y2="275" class="fg-l alt"/><polygon points="520,275 512,270.5 512,279.5" class="fg-a alt"/><text x="320" y="267" text-anchor="middle" class="fg-t sm mono">frame：guess</text>
<line x1="520" y1="305" x2="128" y2="305" class="fg-l on"/><polygon points="120,305 128,300.5 128,309.5" class="fg-a on"/><text x="320" y="297" text-anchor="middle" class="fg-t sm mono">frame：reveal</text>
</svg><figcaption>連上一條 wss 要三個來回：TCP、TLS、HTTP 升級。之後這條連線不再有 HTTP，只剩雙向的 frame，誰想說話就直接送。</figcaption></figure>
<p>瀏覽器送出的升級請求長這樣（金鑰是 WebSocket 規格 RFC 6455 裡的範例值）：</p>
<pre><code>GET /play HTTP/1.1
Host: game.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
Origin: https://game.example.com
</code></pre>
<p>伺服器答應的話，回：</p>
<pre><code>HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
</code></pre>
<ul>
<li><b>101</b> 是「切換協定」的狀態碼。從這一行之後，這條連線上就不再有 HTTP 了。</li>
<li><code>Sec-WebSocket-Key</code> 是瀏覽器隨機產生的 16 個位元組，用 Base64 編碼。伺服器把它接上一個規格寫死的字串，算 SHA-1，再 Base64，放進 <code>Sec-WebSocket-Accept</code>。這<b>不是</b>安全機制，只是證明「對方真的懂 WebSocket」，而不是一台剛好回了 200 的普通網頁伺服器。</li>
<li><code>wss://</code> 就是先做 TLS、再在加密的通道裡做這次握手，跟 <code>https://</code> 一樣。正式環境一律用 wss。</li>
<li>瀏覽器的 <code>new WebSocket(url)</code> <b>不能</b>加自訂標頭。所以登入資訊只能放在 cookie、網址的查詢參數，或連上之後的第一則訊息裡。放在網址要小心：網址常被記進伺服器和代理的存取日誌。</li>
</ul>
<p>算一下成本：在 RTT 50 毫秒的手機網路上，連上要大約 150 毫秒（還沒算 DNS 查詢）。這就是為什麼一局遊戲中途不該為了每個動作重新連線，也是為什麼重連時能少一個來回就少一個。</p>

<h3><span class="badge lv1">基礎</span>二、一則訊息在線上長什麼樣子：frame</h3>
<p>升級之後，資料被包成一個一個<b>訊框</b>（frame）。一個 frame 的開頭只有 2 個位元組。用 RFC 6455 自己的例子：用戶端送出文字「Hello」，線上的位元組是 <code>81 85 37 fa 21 3d 7f 9f 4d 51 58</code>，拆開來看：</p>
<figure class="figure"><svg viewBox="0 0 680 240" class="fg" style="width:100%;max-width:680px" role="img" aria-label="WebSocket frame 的位元：第一個位元組 0x81 是 FIN 1、RSV 000、opcode 0001 文字；第二個位元組 0x85 是 MASK 1、長度 5；接著 4 位元組遮罩金鑰 37 fa 21 3d，和遮罩過的 5 位元組資料">
<path d="M54 46 V40 H86 V46" class="fg-l"/><text x="70" y="32" text-anchor="middle" class="fg-t sm">FIN</text>
<path d="M90 46 V40 H194 V46" class="fg-l"/><text x="142" y="32" text-anchor="middle" class="fg-t sm">RSV1–3</text>
<path d="M198 46 V40 H338 V46" class="fg-l alt"/><text x="268" y="32" text-anchor="middle" class="fg-t sm alt">opcode 1 = 文字</text>
<path d="M342 46 V40 H374 V46" class="fg-l warm"/><text x="358" y="32" text-anchor="middle" class="fg-t sm warm">MASK</text>
<path d="M378 46 V40 H626 V46" class="fg-l on"/><text x="502" y="32" text-anchor="middle" class="fg-t sm acc">長度 = 5</text>
<rect x="52" y="52" width="36" height="34" rx="4" class="fg-b"/><text x="70" y="75" text-anchor="middle" class="fg-t lg mono">1</text>
<rect x="88" y="52" width="36" height="34" rx="4" class="fg-b"/><text x="106" y="75" text-anchor="middle" class="fg-t lg mono">0</text>
<rect x="124" y="52" width="36" height="34" rx="4" class="fg-b"/><text x="142" y="75" text-anchor="middle" class="fg-t lg mono">0</text>
<rect x="160" y="52" width="36" height="34" rx="4" class="fg-b"/><text x="178" y="75" text-anchor="middle" class="fg-t lg mono">0</text>
<rect x="196" y="52" width="36" height="34" rx="4" class="fg-b alt"/><text x="214" y="75" text-anchor="middle" class="fg-t lg mono">0</text>
<rect x="232" y="52" width="36" height="34" rx="4" class="fg-b alt"/><text x="250" y="75" text-anchor="middle" class="fg-t lg mono">0</text>
<rect x="268" y="52" width="36" height="34" rx="4" class="fg-b alt"/><text x="286" y="75" text-anchor="middle" class="fg-t lg mono">0</text>
<rect x="304" y="52" width="36" height="34" rx="4" class="fg-b alt"/><text x="322" y="75" text-anchor="middle" class="fg-t lg mono">1</text>
<rect x="340" y="52" width="36" height="34" rx="4" class="fg-b warm"/><text x="358" y="75" text-anchor="middle" class="fg-t lg mono">1</text>
<rect x="376" y="52" width="36" height="34" rx="4" class="fg-b hot"/><text x="394" y="75" text-anchor="middle" class="fg-t lg mono">0</text>
<rect x="412" y="52" width="36" height="34" rx="4" class="fg-b hot"/><text x="430" y="75" text-anchor="middle" class="fg-t lg mono">0</text>
<rect x="448" y="52" width="36" height="34" rx="4" class="fg-b hot"/><text x="466" y="75" text-anchor="middle" class="fg-t lg mono">0</text>
<rect x="484" y="52" width="36" height="34" rx="4" class="fg-b hot"/><text x="502" y="75" text-anchor="middle" class="fg-t lg mono">0</text>
<rect x="520" y="52" width="36" height="34" rx="4" class="fg-b hot"/><text x="538" y="75" text-anchor="middle" class="fg-t lg mono">1</text>
<rect x="556" y="52" width="36" height="34" rx="4" class="fg-b hot"/><text x="574" y="75" text-anchor="middle" class="fg-t lg mono">0</text>
<rect x="592" y="52" width="36" height="34" rx="4" class="fg-b hot"/><text x="610" y="75" text-anchor="middle" class="fg-t lg mono">1</text>
<text x="196" y="104" text-anchor="middle" class="fg-t sm mono">第 1 個位元組 0x81</text>
<text x="484" y="104" text-anchor="middle" class="fg-t sm mono">第 2 個位元組 0x85</text>
<rect x="52" y="124" width="170" height="48" rx="6" class="fg-b"/><text x="137" y="145" text-anchor="middle" class="fg-t">延伸長度</text><text x="137" y="163" text-anchor="middle" class="fg-t sm">長度 126、127 時才有</text>
<rect x="232" y="124" width="180" height="48" rx="6" class="fg-b warm"/><text x="322" y="145" text-anchor="middle" class="fg-t">遮罩金鑰（4 位元組）</text><text x="322" y="163" text-anchor="middle" class="fg-t sm mono">37 fa 21 3d</text>
<rect x="422" y="124" width="206" height="48" rx="6" class="fg-b hot"/><text x="525" y="145" text-anchor="middle" class="fg-t">資料（遮罩過）</text><text x="525" y="163" text-anchor="middle" class="fg-t sm mono">7f 9f 4d 51 58</text>
<text x="340" y="200" text-anchor="middle" class="fg-t sm mono">還原：7f XOR 37 = 48 = 'H'，9f XOR fa = 65 = 'e' ……</text>
<text x="340" y="226" text-anchor="middle" class="fg-t sm">伺服器送出的 frame 不遮罩：81 05 48 65 6c 6c 6f，一共 7 個位元組</text>
</svg><figcaption>前兩個位元組就說完了「這是最後一片、是文字、有遮罩、長 5 個位元組」。資料超過 125 個位元組時，長度欄填 126 或 127，真正的長度放在後面 2 或 8 個位元組裡。</figcaption></figure>
<table>
<tr><th>opcode</th><th>意思</th></tr>
<tr><td>0x1</td><td>文字（必須是合法的 UTF-8），JSON 走這種</td></tr>
<tr><td>0x2</td><td>二進位，<code>ArrayBuffer</code> 走這種</td></tr>
<tr><td>0x0</td><td>接續：一則大訊息被拆成好幾片時，後面的那幾片</td></tr>
<tr><td>0x8</td><td>關閉，裡面帶關閉代碼，例如 1000 正常關閉、1001 離開（例如伺服器要重開）</td></tr>
<tr><td>0x9／0xA</td><td>ping／pong，控制用的小 frame，內容最多 125 個位元組</td></tr>
</table>
<ul>
<li><b>遮罩</b>（masking）：用戶端送出的每一個 frame，都必須用 4 個隨機位元組做 XOR；伺服器送出的不遮罩。目的是防止老舊的代理伺服器把 frame 誤認成 HTTP 而污染快取，<b>不是加密</b>：金鑰就寫在 frame 裡，誰都解得開。</li>
<li><b>成本很小</b>：伺服器送一則 125 個位元組以內的訊息，只多 2 個位元組；用戶端送的多 6 個（加上遮罩金鑰）。對比之下，一個 HTTP 請求光是標頭常常就有幾百個位元組。</li>
<li><b>ping／pong 在瀏覽器裡碰不到。</b>伺服器送 ping，瀏覽器會自動回 pong，但 JavaScript 既不能送 ping，也收不到這些事件。所以前端要偵測斷線，得自己在應用層做心跳（第七節）。</li>
<li><b>1006 不會出現在線上。</b>它是瀏覽器在「連線沒有經過正常關閉就斷了」時，自己填進 close 事件的代碼。看到 1006，代表沒有任何一方好好說再見，例如網路斷了或伺服器當掉。</li>
</ul>

<h3><span class="badge lv2">進階</span>三、設計訊息協定：信封、id、版本</h3>
<p>WebSocket 只負責把一串位元組送到對面。裡面裝什麼、怎麼配對、怎麼改版，全部是你的事。上一課的信封只有 <code>type</code>、<code>id</code>、<code>data</code>、<code>error</code>，正式專案通常會再加幾樣：</p>
<pre><code>interface Envelope {
  v: number;         // protocol version, e.g. 3
  type: string;      // 'guess', 'reveal', 'timeUp', 'ping'
  id?: number;       // request id; its reply repeats it
  seq?: number;      // server pushes only: 1, 2, 3 ...
  round?: number;    // which round this belongs to
  data?: unknown;
  error?: { code: string; message: string };   // 'LATE'
}
</code></pre>
<ul>
<li><b>錯誤用代碼，不用句子。</b>用戶端要依錯誤做不同的事：<code>LATE</code> 顯示「太晚了」，<code>NOT_YOUR_TURN</code> 重新同步，<code>AUTH_EXPIRED</code> 回登入畫面。拿句子來判斷，伺服器改一個字就壞。</li>
<li><b>版本號從第一天就要有。</b>連線一打開，第一則訊息就是 <code>hello</code>，帶上用戶端的協定版本。伺服器同時支援目前版和上一版；太舊的就回錯誤，讓用戶端提示玩家更新。手機上永遠有人沒更新，一次支援兩版是基本要求。</li>
<li><b>相容的改法和不相容的改法。</b>加一個新欄位、加一種新的 <code>type</code>：相容，前提是雙方都「看不懂的欄位就忽略」。改名、刪欄位、改型別：不相容，要升版本號。所以解析程式遇到不認識的欄位，不要丟錯。</li>
<li><b>兩邊都驗證。</b>伺服器一定要驗證收到的每一則訊息（型別、範圍、長度）。用戶端也該驗證，主要是為了抓伺服器改版造成的 bug：早一點報錯，比畫面上出現 <code>undefined</code> 好查。zod 這類函式庫可以讓同一份描述，同時產生 TypeScript 型別和執行時的檢查。</li>
</ul>
<h4>JSON 還是二進位？</h4>
<p>上一課那則回覆 <code>{"type":"guess","id":7,"data":{"card":11,"correct":true,"score":5}}</code> 是 67 個位元組。同樣的內容，用自訂的二進位格式（1 位元組型別、4 位元組 id、1 位元組牌、1 位元組對錯、2 位元組分數）只要 9 個。</p>
<table>
<tr><th></th><th>JSON</th><th>二進位（自訂、Protocol Buffers 等）</th></tr>
<tr><td>大小</td><td>大，欄位名稱每次都要送</td><td>小，常常差好幾倍</td></tr>
<tr><td>除錯</td><td>Network 面板直接看得懂</td><td>要另外寫工具解碼</td></tr>
<tr><td>CPU</td><td>解析要逐字讀字串</td><td>通常比較快，產生的垃圾也比較少</td></tr>
<tr><td>改版</td><td>加欄位很自然</td><td>Protocol Buffers 靠欄位編號，改版規則很清楚；自訂格式要自己設計</td></tr>
</table>
<p>判斷方式是算一下流量。猜高低一秒頂多一兩則訊息，67 和 9 個位元組都是零頭，JSON 好除錯的價值大得多。每秒同步 20 次、每次幾十個單位位置的動作遊戲，差好幾倍就是差好幾倍的頻寬帳單，才值得換二進位。中間還有一個選擇：WebSocket 的壓縮擴充 permessage-deflate，對重複性高的 JSON 很有效，但每條連線都要多佔一份壓縮用的記憶體，同時在線的人一多，要先量過。</p>

<h3><span class="badge lv2">進階</span>四、請求、回覆、推播：配對、順序、重複</h3>
<p>先看一條連線上同時發生好幾件事的時候：</p>
<figure class="figure"><svg viewBox="0 0 660 260" class="fg" style="width:100%;max-width:660px" role="img" aria-label="用戶端先送 7 號猜測、再送 8 號讀個人資料；8 號的回覆先回來，中間插進一則沒有 id 的推播，最後 7 號才回來；左邊是 pending 表的變化">
<text x="110" y="30" text-anchor="middle" class="fg-t sm mono">pending 表</text>
<rect x="150" y="10" width="120" height="30" rx="6" class="fg-b alt"/><text x="210" y="30" text-anchor="middle" class="fg-t">用戶端 Net</text>
<rect x="480" y="10" width="120" height="30" rx="6" class="fg-b alt"/><text x="540" y="30" text-anchor="middle" class="fg-t">伺服器</text>
<line x1="210" y1="40" x2="210" y2="250" class="fg-l dim"/><line x1="540" y1="40" x2="540" y2="250" class="fg-l dim"/>
<line x1="210" y1="70" x2="532" y2="70" class="fg-l alt"/><polygon points="540,70 532,65.5 532,74.5" class="fg-a alt"/><text x="375" y="62" text-anchor="middle" class="fg-t sm mono">guess　id 7</text>
<line x1="210" y1="104" x2="532" y2="104" class="fg-l alt"/><polygon points="540,104 532,99.5 532,108.5" class="fg-a alt"/><text x="375" y="96" text-anchor="middle" class="fg-t sm mono">profile　id 8</text>
<line x1="540" y1="144" x2="218" y2="144" class="fg-l on"/><polygon points="210,144 218,139.5 218,148.5" class="fg-a on"/><text x="375" y="136" text-anchor="middle" class="fg-t sm mono acc">reply　id 8（先回來）</text>
<line x1="540" y1="184" x2="218" y2="184" class="fg-l warm"/><polygon points="210,184 218,179.5 218,188.5" class="fg-a warm"/><text x="375" y="176" text-anchor="middle" class="fg-t sm warm">push timeUp（沒有 id）</text>
<line x1="540" y1="224" x2="218" y2="224" class="fg-l on"/><polygon points="210,224 218,219.5 218,228.5" class="fg-a on"/><text x="375" y="216" text-anchor="middle" class="fg-t sm mono acc">reply　id 7</text>
<text x="196" y="74" text-anchor="end" class="fg-t sm mono">{ 7 }</text>
<text x="196" y="108" text-anchor="end" class="fg-t sm mono">{ 7, 8 }</text>
<text x="196" y="148" text-anchor="end" class="fg-t sm mono">{ 7 }　8 兌現</text>
<text x="196" y="188" text-anchor="end" class="fg-t sm mono">→ 發成事件</text>
<text x="196" y="228" text-anchor="end" class="fg-t sm mono">{ }　7 兌現</text>
</svg><figcaption>回覆不一定照請求的順序回來，推播也可能插在中間。用戶端靠 id 在 pending 表裡找到對的那個 Promise；找不到 id 的，就是推播。</figcaption></figure>
<p>用戶端先送 7 號（猜測），再送 8 號（讀個人資料）。伺服器查個人資料比較快，8 號的回覆先回來；中間還插進一則推播；最後 7 號才到。用戶端靠 <code>pending</code> 這張表配對，所以順序亂了也沒關係。<b>永遠不要假設回覆照請求的順序回來</b>，就算你的伺服器今天剛好是依序處理的。</p>
<h4>一條連線裡，順序是有保證的</h4>
<p>WebSocket 跑在 TCP 上，而 TCP 保證：在<b>同一條</b>連線裡，資料不會遺失、不會重複、不會亂序。所以伺服器依序推的 seq 41、42、43，只要連線沒斷，你一定依序各收到一次。</p>
<p>麻煩全部出在連線斷掉的那一刻。斷線前最後那幾則，你不知道對方收到了沒有；重連之後是一條全新的連線，舊連線上還在路上的東西就此消失。所以：</p>
<ul>
<li>推播帶 <code>seq</code>，重連後以快照的 seq 為起點，小於等於的丟掉，跳號就重新同步（上一章第八節）。</li>
<li>斷線時還沒拿到回覆的請求，一律當成「不知道成功了沒有」。這正是下一節冪等要解決的問題。</li>
</ul>

<h3><span class="badge lv2">進階</span>五、冪等：送兩次也只算一次</h3>
<p>想像玩家猜了 higher，伺服器收到，抽出 11，分數變 5，送出回覆。這時候玩家剛好走進電梯，回覆沒送到。重連之後，用戶端不知道剛才那次猜測到底算了沒有。</p>
<figure class="figure"><svg viewBox="0 0 680 300" class="fg" style="width:100%;max-width:680px" role="img" aria-label="兩欄比較：左邊沒有冪等鍵，回覆弄丟後重送，伺服器又抽一張牌，同一次猜測算了兩次；右邊帶著冪等鍵 17:5，伺服器認出是重送，直接回上次的結果">
<line x1="340" y1="16" x2="340" y2="290" class="fg-l dim dash"/>
<text x="170" y="26" text-anchor="middle" class="fg-t lg warm">沒有冪等鍵</text>
<text x="510" y="26" text-anchor="middle" class="fg-t lg acc">有冪等鍵</text>
<text x="50" y="48" text-anchor="middle" class="fg-t sm">用戶端</text><text x="290" y="48" text-anchor="middle" class="fg-t sm">伺服器</text>
<text x="390" y="48" text-anchor="middle" class="fg-t sm">用戶端</text><text x="630" y="48" text-anchor="middle" class="fg-t sm">伺服器</text>
<line x1="50" y1="56" x2="50" y2="272" class="fg-l dim"/><line x1="290" y1="56" x2="290" y2="272" class="fg-l dim"/>
<line x1="390" y1="56" x2="390" y2="272" class="fg-l dim"/><line x1="630" y1="56" x2="630" y2="272" class="fg-l dim"/>
<line x1="50" y1="80" x2="282" y2="80" class="fg-l alt"/><polygon points="290,80 282,75.5 282,84.5" class="fg-a alt"/><text x="170" y="72" text-anchor="middle" class="fg-t sm mono">guess higher</text>
<text x="282" y="106" text-anchor="end" class="fg-t sm">抽 11，5 分</text>
<line x1="290" y1="140" x2="180" y2="140" class="fg-l warm dash"/><text x="172" y="145" text-anchor="middle" class="fg-t lg warm">✕</text><text x="230" y="132" text-anchor="middle" class="fg-t sm warm">回覆在路上弄丟</text>
<text x="58" y="172" class="fg-t sm">重連後再送一次</text>
<line x1="50" y1="200" x2="282" y2="200" class="fg-l alt"/><polygon points="290,200 282,195.5 282,204.5" class="fg-a alt"/><text x="170" y="192" text-anchor="middle" class="fg-t sm mono">guess higher</text>
<text x="282" y="226" text-anchor="end" class="fg-t sm warm">又抽一張 4</text>
<line x1="290" y1="260" x2="58" y2="260" class="fg-l warm"/><polygon points="50,260 58,255.5 58,264.5" class="fg-a warm"/><text x="170" y="252" text-anchor="middle" class="fg-t sm warm">4 &lt; 11 猜錯，over</text>
<text x="170" y="292" text-anchor="middle" class="fg-t sm warm">同一次猜測被算了兩次</text>
<line x1="390" y1="80" x2="622" y2="80" class="fg-l alt"/><polygon points="630,80 622,75.5 622,84.5" class="fg-a alt"/><text x="510" y="72" text-anchor="middle" class="fg-t sm mono">guess　key 17:5</text>
<text x="622" y="106" text-anchor="end" class="fg-t sm">抽 11，5 分，存結果</text>
<line x1="630" y1="140" x2="520" y2="140" class="fg-l warm dash"/><text x="512" y="145" text-anchor="middle" class="fg-t lg warm">✕</text><text x="570" y="132" text-anchor="middle" class="fg-t sm warm">回覆弄丟</text>
<text x="398" y="172" class="fg-t sm">重連後再送一次</text>
<line x1="390" y1="200" x2="622" y2="200" class="fg-l alt"/><polygon points="630,200 622,195.5 622,204.5" class="fg-a alt"/><text x="510" y="192" text-anchor="middle" class="fg-t sm mono">guess　key 17:5</text>
<text x="622" y="226" text-anchor="end" class="fg-t sm acc">17:5 看過，不抽</text>
<line x1="630" y1="260" x2="398" y2="260" class="fg-l on"/><polygon points="390,260 398,255.5 398,264.5" class="fg-a on"/><text x="510" y="252" text-anchor="middle" class="fg-t sm acc">11，5 分（同一份答案）</text>
<text x="510" y="292" text-anchor="middle" class="fg-t sm acc">算一次，回答兩次</text>
</svg><figcaption>重送本身沒有錯，錯在伺服器分不出「新的猜測」和「同一次猜測又送了一遍」。冪等鍵就是讓它分得出來的那個名字。</figcaption></figure>
<p>左邊的伺服器把重送當成新的猜測，又抽了一張牌，玩家等於被多猜了一次。右邊的用戶端在每次猜測都帶一把<b>冪等鍵</b>（idempotency key）：「第 17 局第 5 次猜」，寫成 <code>17:5</code>。伺服器處理時，把「這把鑰匙的結果」存起來；同一把鑰匙再來，就不再執行，直接回上次存的結果。</p>
<pre><code>// server side (Node.js), one per room
const done = new Map&lt;string, Reply&gt;();  // key -&gt; reply sent

function onGuess(key: string, g: Guess): Reply {
  const old = done.get(key);
  if (old) return old;        // a retry: same answer
  const reply = applyGuess(g);  // draws a card, scores
  done.set(key, reply);
  return reply;
}
</code></pre>
<ul>
<li><b>鑰匙由用戶端產生</b>，因為只有用戶端知道「這是同一次按下去」。用局數加次數很直觀；沒有自然編號的動作（例如在商店買東西），就在按下按鈕的那一刻用瀏覽器的 <code>crypto.randomUUID()</code> 產生一把，之後的重試都沿用同一把。</li>
<li><b>存起來的是結果，不只是「看過」。</b>只記「看過」的話，重送時你只能回「重複了」，用戶端還是不知道答案。</li>
<li><b>要設保存期限。</b>一局結束，那一局的鑰匙就可以清掉。牽涉到錢的動作，鑰匙要存進資料庫，用唯一索引擋重複，而且「記下鑰匙」和「扣款」要在同一個交易裡完成。Stripe 的付款 API 用 <code>Idempotency-Key</code> 標頭做的就是這件事。</li>
<li><b>不是每個請求都需要。</b>「讀個人資料」送幾次結果都一樣，天生冪等，直接重送即可。會改變狀態的請求（猜測、購買、領獎）才需要鑰匙。沒有鑰匙的這類請求，斷線時不要自動重送，改成重新同步，讓玩家看到真正的結果。</li>
</ul>

<h3><span class="badge lv3">專業</span>六、重連：退避、抖動，以及什麼時候不要重連</h3>
<p>上一課的公式是「等 2 的 n 次方秒，最多 30 秒，再加不到一秒的隨機」。這已經能用。但想像伺服器重新部署，一萬個玩家在同一秒被斷線：大家第 1 次都等 1 到 2 秒，第 2 次都等 2 到 3 秒……一萬條連線還是擠在同一個一秒寬的窗口裡，一波一波撞上來。這叫<b>驚群效應</b>（thundering herd）。</p>
<p>AWS 的工程師 Marc Brooker 在 AWS 架構部落格上有一篇很有名的文章，比較過幾種<b>抖動</b>（jitter）的效果，表現很好的一種叫「完整抖動」（full jitter）：等待時間在 0 到上限之間完全隨機。</p>
<figure class="figure"><svg viewBox="0 0 660 256" class="fg" style="width:100%;max-width:660px" role="img" aria-label="完整抖動的等待窗口：第 1 次 0 到 1 秒，第 2 次 0 到 2 秒，然後 4、8、16 秒，第 6、7 次都封頂在 30 秒；每一列的點是兩個用戶端各自抽到的等待時間">
<text x="330" y="18" text-anchor="middle" class="fg-t sm mono">等待 = 隨機(0, min(30, 2^n)) 秒</text>
<text x="20" y="44" class="fg-t sm">第 1 次</text><rect x="110" y="32" width="16" height="16" rx="3" class="fg-b alt"/><text x="134" y="44" class="fg-t sm">0–1 秒</text>
<text x="20" y="71" class="fg-t sm">第 2 次</text><rect x="110" y="59" width="32" height="16" rx="3" class="fg-b alt"/><text x="150" y="71" class="fg-t sm">0–2 秒</text>
<text x="20" y="98" class="fg-t sm">第 3 次</text><rect x="110" y="86" width="64" height="16" rx="3" class="fg-b alt"/><text x="182" y="98" class="fg-t sm">0–4 秒</text>
<text x="20" y="125" class="fg-t sm">第 4 次</text><rect x="110" y="113" width="128" height="16" rx="3" class="fg-b alt"/><text x="246" y="125" class="fg-t sm">0–8 秒</text>
<text x="20" y="152" class="fg-t sm">第 5 次</text><rect x="110" y="140" width="256" height="16" rx="3" class="fg-b alt"/><text x="374" y="152" class="fg-t sm">0–16 秒</text>
<text x="20" y="179" class="fg-t sm">第 6 次</text><rect x="110" y="167" width="480" height="16" rx="3" class="fg-b alt"/><text x="598" y="179" class="fg-t sm">0–30 秒</text>
<text x="20" y="206" class="fg-t sm">第 7 次</text><rect x="110" y="194" width="480" height="16" rx="3" class="fg-b alt"/><text x="598" y="206" class="fg-t sm">0–30 秒</text>
<circle cx="113.6" cy="40" r="3" class="fg-lamp on"/><circle cx="122.4" cy="40" r="3" class="fg-lamp on"/>
<circle cx="118" cy="67" r="3.5" class="fg-lamp on"/><circle cx="137.2" cy="67" r="3.5" class="fg-lamp on"/>
<circle cx="127.6" cy="94" r="3.5" class="fg-lamp on"/><circle cx="161.2" cy="94" r="3.5" class="fg-lamp on"/>
<circle cx="150" cy="121" r="3.5" class="fg-lamp on"/><circle cx="220.4" cy="121" r="3.5" class="fg-lamp on"/>
<circle cx="170.8" cy="148" r="3.5" class="fg-lamp on"/><circle cx="308.4" cy="148" r="3.5" class="fg-lamp on"/>
<circle cx="265.2" cy="175" r="3.5" class="fg-lamp on"/><circle cx="495.6" cy="175" r="3.5" class="fg-lamp on"/>
<circle cx="177.2" cy="202" r="3.5" class="fg-lamp on"/><circle cx="410.8" cy="202" r="3.5" class="fg-lamp on"/>
<line x1="110" y1="224" x2="590" y2="224" class="fg-l dim"/>
<line x1="110" y1="224" x2="110" y2="229" class="fg-l"/><line x1="190" y1="224" x2="190" y2="229" class="fg-l"/><line x1="270" y1="224" x2="270" y2="229" class="fg-l"/><line x1="350" y1="224" x2="350" y2="229" class="fg-l"/><line x1="430" y1="224" x2="430" y2="229" class="fg-l"/><line x1="510" y1="224" x2="510" y2="229" class="fg-l"/><line x1="590" y1="224" x2="590" y2="229" class="fg-l"/>
<text x="110" y="244" text-anchor="middle" class="fg-t sm">0</text><text x="190" y="244" text-anchor="middle" class="fg-t sm">5</text><text x="270" y="244" text-anchor="middle" class="fg-t sm">10</text><text x="350" y="244" text-anchor="middle" class="fg-t sm">15</text><text x="430" y="244" text-anchor="middle" class="fg-t sm">20</text><text x="510" y="244" text-anchor="middle" class="fg-t sm">25</text><text x="590" y="244" text-anchor="middle" class="fg-t sm">30 秒</text>
</svg><figcaption>每一次重試的窗口加倍，直到 30 秒封頂；窗口裡的哪一點完全隨機。兩個綠點代表兩支手機：同一次重試，它們幾乎不會撞在同一刻。</figcaption></figure>
<p>第 4 次重試時，窗口是 0 到 8 秒。一萬個用戶端平均分散在這 8 秒裡，每秒大約 1,250 個，比一萬個同時撞上來溫和得多。</p>
<pre><code>private attempt = 0;
private stable: ReturnType&lt;typeof setTimeout&gt; | undefined;

private onOpen() {
  // count it as a success only after 10 quiet seconds: a
  // server that accepts and then crashes would otherwise
  // reset the backoff and get hammered every second
  this.stable = setTimeout(() =&gt; {
    this.attempt = 0;
  }, 10_000);
}

// wired as: ws.onclose = (ev) =&gt; this.lost(ev.code)
private lost(code: number) {
  clearTimeout(this.stable);
  if (code === 4001) {           // our code: login expired
    return this.backToLogin();
  }
  const cap = Math.min(30, 2 ** this.attempt); // 1,2,4..30
  const wait = Math.random() * cap;  // full jitter
  this.attempt++;
  setTimeout(() =&gt; this.connect(this.url), wait * 1000);
}
</code></pre>
<ul>
<li><b>成功要「穩定」才算。</b>如果伺服器接受連線後馬上又當掉，一連上就把 <code>attempt</code> 歸零的話，用戶端會一直用 1 秒的間隔猛撞。等連線穩定 10 秒再歸零。</li>
<li><b>看關閉代碼決定要不要重連。</b>4000 到 4999 是留給應用自己用的。約定好例如 4001 代表登入過期、4003 代表被踢出，看到這些就不要重連，重連一萬次也不會成功。</li>
<li><b>有更好的時機就別等。</b>瀏覽器的 <code>online</code> 事件、Cocos 的 <code>Game.EVENT_SHOW</code>（app 回到前景），都是「現在立刻試一次」的好時機。但 <code>navigator.onLine</code> 是 true，只代表裝置有網路介面，不代表連得到你的伺服器，不能拿來取代真的連一次。</li>
<li><b>給玩家一個出口。</b>連續失敗一段時間（例如一分鐘）之後，顯示「連不上，點這裡重試」，不要讓轉圈圈永遠轉下去。</li>
<li><b>伺服器也要配合。</b>部署時先對每條連線送關閉代碼 1001 再關，讓用戶端知道這是預期中的斷線；能分批重啟就分批，驚群會更小。</li>
</ul>

<h3><span class="badge lv3">專業</span>七、心跳：抓出「死了但沒斷」的連線</h3>
<p>手機訊號突然消失時，不會有任何封包通知對方「我走了」。瀏覽器沒收到關閉的 frame，也沒收到 TCP 的 FIN 或 RST，所以 <code>readyState</code> 還是 OPEN，close 事件也不會觸發。這種一邊已經死了、另一邊還不知道的連線，叫<b>半開連線</b>（half-open connection）。TCP 自己要發現它可能要很久：就算開了 TCP keepalive，Linux 預設也要閒置 2 小時才開始探測；送資料失敗後的重傳，也要好幾分鐘才放棄。</p>
<p>解法是在應用層自己做<b>心跳</b>（heartbeat）：每 10 秒送一個 ping，伺服器回 pong。任何訊息都算「還活著」的證據，不只 pong。超過 25 秒什麼都沒收到，就判定連線死了。</p>
<figure class="figure"><svg viewBox="0 0 680 225" class="fg" style="width:100%;max-width:680px" role="img" aria-label="心跳時間軸：0、10、20 秒的 ping 都收到 pong；23 秒網路斷了，30 和 40 秒的 ping 送不出去；最後一次收到訊息是 20 秒，25 秒後的 45 秒判定連線死亡，主動關掉重連；這段時間 readyState 一直是 OPEN">
<text x="8" y="60" class="fg-t">伺服器</text><text x="8" y="160" class="fg-t">用戶端</text>
<line x1="70" y1="56" x2="652" y2="56" class="fg-l"/><polygon points="660,56 652,51.5 652,60.5" class="fg-a"/>
<line x1="70" y1="156" x2="652" y2="156" class="fg-l"/><polygon points="660,156 652,151.5 652,160.5" class="fg-a"/>
<line x1="80" y1="152" x2="80" y2="64" class="fg-l alt"/><polygon points="80,56 75.5,64 84.5,64" class="fg-a alt"/>
<line x1="88" y1="60" x2="88" y2="148" class="fg-l on"/><polygon points="88,156 83.5,148 92.5,148" class="fg-a on"/>
<text x="74" y="110" text-anchor="end" class="fg-t sm alt">ping</text><text x="94" y="110" class="fg-t sm acc">pong</text>
<line x1="175" y1="152" x2="175" y2="64" class="fg-l alt"/><polygon points="175,56 170.5,64 179.5,64" class="fg-a alt"/>
<line x1="183" y1="60" x2="183" y2="148" class="fg-l on"/><polygon points="183,156 178.5,148 187.5,148" class="fg-a on"/>
<line x1="270" y1="152" x2="270" y2="64" class="fg-l alt"/><polygon points="270,56 265.5,64 274.5,64" class="fg-a alt"/>
<line x1="278" y1="60" x2="278" y2="148" class="fg-l on"/><polygon points="278,156 273.5,148 282.5,148" class="fg-a on"/>
<line x1="298.5" y1="36" x2="298.5" y2="176" class="fg-l warm dash"/>
<text x="298" y="28" text-anchor="middle" class="fg-t sm warm">網路斷了（沒有 FIN）</text>
<line x1="365" y1="152" x2="365" y2="136" class="fg-l alt dash"/><text x="365" y="130" text-anchor="middle" class="fg-t warm">✕</text>
<line x1="460" y1="152" x2="460" y2="136" class="fg-l alt dash"/><text x="460" y="130" text-anchor="middle" class="fg-t warm">✕</text>
<path d="M282 102 V96 H507 V102" class="fg-l warm"/>
<text x="395" y="88" text-anchor="middle" class="fg-t sm warm">25 秒什麼都沒收到</text>
<circle cx="507.5" cy="156" r="6" class="fg-lamp on"/>
<text x="507" y="180" text-anchor="middle" class="fg-t sm acc">45 秒：判定死亡</text>
<text x="507" y="196" text-anchor="middle" class="fg-t sm">主動關掉、重連</text>
<text x="600" y="146" text-anchor="middle" class="fg-t sm mono warm">readyState 仍是 OPEN</text>
<text x="80" y="216" text-anchor="middle" class="fg-t sm">0</text><text x="175" y="216" text-anchor="middle" class="fg-t sm">10</text><text x="270" y="216" text-anchor="middle" class="fg-t sm">20</text><text x="365" y="216" text-anchor="middle" class="fg-t sm">30</text><text x="460" y="216" text-anchor="middle" class="fg-t sm">40</text><text x="555" y="216" text-anchor="middle" class="fg-t sm">50</text><text x="650" y="216" text-anchor="middle" class="fg-t sm">60 秒</text>
</svg><figcaption>網路在第 23 秒斷了，但瀏覽器完全不知道。看門狗從最後一次收到訊息（第 20 秒）開始算 25 秒，第 45 秒判定死亡。不靠心跳的話，這條連線可能好幾分鐘都還「活著」。</figcaption></figure>
<pre><code>private beat: ReturnType&lt;typeof setInterval&gt; | undefined;
private watchdog: ReturnType&lt;typeof setTimeout&gt; | undefined;

private startHeartbeat() {       // called from onOpen
  this.heard();
  this.beat = setInterval(() =&gt; {
    this.send({ v: 3, type: 'ping',
                data: { t0: performance.now() } });
  }, 10_000);
}

// call this first in onmessage, for every message
private heard() {
  clearTimeout(this.watchdog);
  this.watchdog = setTimeout(
    () =&gt; this.declareDead(), 25_000);
}

private declareDead() {
  const ws = this.ws!;
  ws.onmessage = ws.onclose = null;  // silence old socket
  ws.close();
  this.lost(4000);              // ours: heartbeat timeout
}
</code></pre>
<p>每收到一則訊息，就把 25 秒的看門狗重新設定一次，所以它永遠是從「最後一次聽到對方」開始算。<code>send</code> 是把物件轉成 JSON 再送出的小包裝。<code>lost()</code> 開頭也要清掉 <code>beat</code> 和 <code>watchdog</code>，不然舊的心跳會跟著新連線一起跑。</p>
<ul>
<li><b>為什麼是 10 秒和 25 秒？</b>這是常見的量級，不是標準。間隔越短越快發現斷線，但每支手機都要多耗電、多用流量；逾時要比間隔的兩倍再多一點，才不會因為一次封包延遲就誤判。照這組數字，網路死掉之後 15 到 25 秒內一定會發現。</li>
<li><b>心跳也讓閒置的連線活著。</b>很多反向代理和負載平衡器會切掉閒置太久的連線：nginx 的 <code>proxy_read_timeout</code> 預設 60 秒，AWS Application Load Balancer 的閒置逾時預設也是 60 秒。心跳間隔比這個短，玩家在思考時就不會被切線。</li>
<li><b>背景分頁的計時器會被降頻。</b>瀏覽器會刻意放慢背景分頁的 <code>setTimeout</code>／<code>setInterval</code>，心跳在背景時不準。回到前景時（<code>Game.EVENT_SHOW</code>）立刻送一次 ping 確認。</li>
<li><b>伺服器也要心跳。</b>伺服器那邊一樣會有幽靈連線，佔著記憶體和房間的座位。Node.js 常用的 <code>ws</code> 套件，文件裡就有一段範例：定期送 ping，下一輪還沒收到 pong 的，就呼叫 <code>terminate()</code> 直接砍掉。</li>
<li><b>pong 順便帶時間。</b>pong 裡放上伺服器收到和送出的時間，就是上一章估時鐘偏差需要的 t1、t2。</li>
</ul>

<h3><span class="badge lv3">專業</span>八、延遲，以及為什麼伺服器一定要說了算</h3>
<p>延遲是物理。光在光纖裡，一毫秒大約只走 200 公里，台北到美國西岸來回就要一百多毫秒，再加上路由器排隊、手機基地台排程。典型的量級：同一個城市的有線網路，RTT 幾毫秒到二十毫秒；手機行動網路常見幾十到一百多毫秒，訊號差時更糟；跨太平洋一百多毫秒起跳。</p>
<p>延遲讓「用戶端自己決定」看起來很誘人：不用等伺服器，按了馬上有結果。可是用戶端在玩家手上，玩家能做的事比你想的多：</p>
<table>
<tr><th>玩家能做的事</th><th>怎麼做</th><th>伺服器的對策</th></tr>
<tr><td>看光你的程式和資料</td><td>開發者工具；建置過的 JS 縮小了，還是讀得懂</td><td>不能讓玩家知道的東西（剩下的牌）永遠不送到用戶端</td></tr>
<tr><td>改你的程式</td><td>在主控台改變數、用中斷點改回傳值、載入改過的 JS</td><td>結果由伺服器算；用戶端送的只是「意圖」（我猜 higher）</td></tr>
<tr><td>根本不用你的用戶端</td><td>寫一支 20 行的腳本直接連 WebSocket，想送什麼就送什麼</td><td>每一則都驗證：是不是這一局、這個狀態允許嗎、格式和範圍對嗎</td></tr>
<tr><td>重播舊訊息</td><td>把一則成功領獎的訊息存下來，再送一百次</td><td>冪等鍵、局數、只能用一次的序號</td></tr>
<tr><td>改時間</td><td>加速類工具，讓用戶端的時鐘跑快</td><td>所有計時都以伺服器的時鐘為準</td></tr>
<tr><td>狂送</td><td>一秒送一千次猜測</td><td>每條連線限速、限制訊息大小，超過就斷線</td></tr>
</table>
<p>這張表的結論只有一句：<b>用戶端送來的每一則訊息，都是一個「可以被拒絕的請求」</b>，不是一個事實。<code>{ type: 'guess', data: { guess: 'higher' } }</code> 是合理的請求；如果裡面還有 <code>correct: true, score: 6</code>，伺服器應該連看都不看。這就是所謂的<b>權威伺服器</b>（authoritative server）。</p>

<h3><span class="badge lv4">專家</span>九、用戶端預測，白話版</h3>
<p>伺服器說了算，那每個動作都要等一個來回；150 毫秒的延遲，玩家一定感覺得到。<b>用戶端預測</b>（client-side prediction）就是在這兩件事之間取得平衡：先照「應該會發生的事」動，等伺服器的答案來了再修正。</p>
<h4>回合制：只預測你知道的部分</h4>
<p>猜高低按下 Higher 的那一刻，你不知道下一張牌，但你知道一定會翻牌。所以按下去就立刻讓按鈕下沉、開始轉牌背的動畫，等回覆到了再把牌面填上。動畫要 400 毫秒，回覆通常 100 多毫秒就到，玩家完全感覺不到在等。但<b>結果</b>（猜對猜錯）是隱藏資訊，絕對不能預測：先顯示「答對！」再改成「答錯」，比慢一點還糟。</p>
<h4>即時動作遊戲：先走，再對帳</h4>
<p>角色移動這種「自己算得出結果」的事，可以完整預測。每個輸入帶一個編號，用戶端立刻套用；伺服器處理之後，回報「處理到第幾號、那時候的正確位置」。用戶端把位置重設成伺服器說的，再把伺服器還沒處理到的輸入重新套用一次，這叫<b>校正</b>（reconciliation）。</p>
<figure class="figure"><svg viewBox="0 0 680 240" class="fg" style="width:100%;max-width:680px" role="img" aria-label="用戶端預測與校正：玩家按了五次右鍵，畫面先走到 5；伺服器說處理到第 3 號時位置是 2，因為第 2 號撞牆；用戶端重設成 2，再重播第 4、5 號，最後位置是 4">
<text x="363" y="26" text-anchor="middle" class="fg-t sm">每按一次右鍵就先走一格，畫面上已經走到 5</text>
<text x="20" y="64" class="fg-t acc">預測</text>
<rect x="110" y="40" width="90" height="40" rx="6" class="fg-b alt"/><text x="155" y="65" text-anchor="middle" class="fg-t mono">#1 → 1</text>
<rect x="214" y="40" width="90" height="40" rx="6" class="fg-b alt"/><text x="259" y="65" text-anchor="middle" class="fg-t mono">#2 → 2</text>
<rect x="318" y="40" width="90" height="40" rx="6" class="fg-b alt"/><text x="363" y="65" text-anchor="middle" class="fg-t mono">#3 → 3</text>
<rect x="422" y="40" width="90" height="40" rx="6" class="fg-b alt"/><text x="467" y="65" text-anchor="middle" class="fg-t mono">#4 → 4</text>
<rect x="526" y="40" width="90" height="40" rx="6" class="fg-b alt"/><text x="571" y="65" text-anchor="middle" class="fg-t mono">#5 → 5</text>
<line x1="200" y1="60" x2="206" y2="60" class="fg-l"/><polygon points="214,60 206,55.5 206,64.5" class="fg-a"/>
<line x1="304" y1="60" x2="310" y2="60" class="fg-l"/><polygon points="318,60 310,55.5 310,64.5" class="fg-a"/>
<line x1="408" y1="60" x2="414" y2="60" class="fg-l"/><polygon points="422,60 414,55.5 414,64.5" class="fg-a"/>
<line x1="512" y1="60" x2="518" y2="60" class="fg-l"/><polygon points="526,60 518,55.5 518,64.5" class="fg-a"/>
<line x1="363" y1="80" x2="363" y2="112" class="fg-l"/><polygon points="363,120 358.5,112 367.5,112" class="fg-a"/><text x="371" y="104" class="fg-t sm">#1–#3 先到</text>
<text x="20" y="144" class="fg-t warm">伺服器</text>
<rect x="110" y="120" width="300" height="40" rx="6" class="fg-b warm"/><text x="260" y="145" text-anchor="middle" class="fg-t">處理到 #3：位置 = 2（#2 撞牆）</text>
<line x1="175" y1="160" x2="175" y2="182" class="fg-l warm"/><polygon points="175,190 170.5,182 179.5,182" class="fg-a warm"/><text x="183" y="178" class="fg-t sm">回報</text>
<text x="20" y="214" class="fg-t acc">校正</text>
<rect x="110" y="190" width="130" height="40" rx="6" class="fg-b hot"/><text x="175" y="215" text-anchor="middle" class="fg-t acc">重設成 2</text>
<rect x="262" y="190" width="130" height="40" rx="6" class="fg-b"/><text x="327" y="215" text-anchor="middle" class="fg-t mono">重播 #4 → 3</text>
<rect x="414" y="190" width="130" height="40" rx="6" class="fg-b"/><text x="479" y="215" text-anchor="middle" class="fg-t mono">重播 #5 → 4</text>
<line x1="240" y1="210" x2="254" y2="210" class="fg-l"/><polygon points="262,210 254,205.5 254,214.5" class="fg-a"/>
<line x1="392" y1="210" x2="406" y2="210" class="fg-l"/><polygon points="414,210 406,205.5 406,214.5" class="fg-a"/>
<text x="556" y="206" class="fg-t sm warm">畫面從 5</text><text x="556" y="222" class="fg-t sm warm">修正成 4</text>
</svg><figcaption>伺服器的答案永遠是「某個輸入編號那一刻」的真相。用戶端從那個真相出發，把之後還沒被確認的輸入再走一遍，就得到「現在」最可能的位置。</figcaption></figure>
<p>大部分時候伺服器的答案跟預測一樣，重設再重播的結果不變，玩家什麼都看不出來。只有預測錯的時候（例如撞到別人剛放的牆）才會有一點修正，通常再用幾幀把它平滑地拉過去，而不是瞬間跳過去。</p>
<p>還有兩個常一起出現的名詞，知道就好：</p>
<ul>
<li><b>內插</b>（interpolation）：別的玩家你預測不了，所以故意把他們顯示在「稍微過去」的時間點，在兩個已知的位置之間平滑移動。Valve 的 Source 引擎預設把其他玩家延後 100 毫秒顯示，就是這個道理。</li>
<li><b>延遲補償</b>（lag compensation）：射擊遊戲裡，伺服器判斷有沒有打中時，把其他玩家倒回開槍者「當時看到」的位置。這是伺服器的工作，用戶端只負責報告「我在第幾號輸入開了槍」。</li>
</ul>

<h3><span class="badge lv4">專家</span>十、模擬伺服器的進階用法，與用戶端安全</h3>
<h4>模擬伺服器的三個層次</h4>
<ol>
<li><b>同一個行程裡的假物件</b>：上一課的 <code>MockNet</code>。最快，適合做畫面和流程，但完全沒測到序列化、WebSocket 和重連。</li>
<li><b>本機的假 WebSocket 伺服器</b>：用 Node.js 的 <code>ws</code> 套件寫一個小伺服器，跑同一份 core 規則。這時用戶端用的是真的 <code>Net</code>，JSON 解析、心跳、重連全部測得到。故障也在這一層注入：隨機延遲 50 到 500 毫秒（回覆順序自然就亂了）、偶爾重送同一則推播、在 guessing 中途砍掉連線、某個請求永遠不回。</li>
<li><b>錄製與重播</b>：在測試環境，把伺服器送給某個玩家的訊息逐則存成檔案（一行一則 JSON）。bug 回報進來時，把那個檔案餵給用戶端重播，玩家遇到的那一局就在你的電腦上重演。</li>
</ol>
<p>就算是第一層，也能加一點壞天氣：</p>
<pre><code>request(type: string, data: any): Promise&lt;any&gt; {
  const reply = this.handle(type, data);
  if (Math.random() &lt; this.dropRate) {
    return new Promise(() =&gt; {});       // never answers
  }
  const delay = 50 + Math.random() * 450;   // 50-500 ms
  return new Promise((ok) =&gt;
    setTimeout(() =&gt; ok(reply), delay));
}
</code></pre>
<p>「永遠不回」那一行，專門用來測請求的逾時有沒有寫好。不管哪一層，模擬伺服器和真伺服器都要守同一份合約：同一份訊息型別定義、同一組黃金測試向量。不然你會得到一個在假伺服器上完美、一上線就壞的遊戲。</p>
<h4>用戶端安全：打包出去的東西，全部都是公開的</h4>
<ul>
<li><b>不要放秘密。</b>API 金鑰、後台網址、管理員帳號、「開模擬伺服器」的隱藏開關，打包進 JS 就等於公開。縮小和混淆只會讓人多花幾分鐘。</li>
<li><b>source map 不要公開放在正式環境。</b>它會把縮小過的程式還原成你的原始碼，連註解都有。</li>
<li><b>token 存哪裡有取捨。</b>存在 <code>localStorage</code>，任何一段被注入的腳本（XSS）都讀得到。放在 <code>HttpOnly</code> cookie 裡，JavaScript 讀不到，但瀏覽器連 WebSocket 時會自動帶上；這時除了把 cookie 設成 SameSite，伺服器一定要檢查 <code>Origin</code> 標頭，否則別的網站可能用玩家的身分連上你的伺服器，這叫跨站 WebSocket 劫持（cross-site WebSocket hijacking）。</li>
<li><b>收到的文字也要小心。</b>玩家名稱、聊天訊息如果放進 Cocos 的 <code>RichText</code>，裡面的 <code>&lt;color&gt;</code>、<code>&lt;size&gt;</code>、<code>&lt;img&gt;</code> 這類標籤會被當成格式解析，有人取一個名字就能把你的排行榜版面撐爆。玩家輸入的文字用普通的 <code>Label</code> 顯示；非用 RichText 不可，就先把角括號拿掉。</li>
<li><b>伺服器限制訊息大小。</b>猜高低的用戶端訊息，不該超過幾 KB。Node.js 的 <code>ws</code> 套件有 <code>maxPayload</code> 選項，自己設一個小的上限，不要靠預設值。</li>
</ul>

<h3>十一、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>WebSocket 的訊息會亂序、會遺失</td><td>同一條連線上，TCP 保證不丟、不重複、不亂序。問題都發生在斷線和重連之間。</td></tr>
<tr><td><code>readyState</code> 是 OPEN，連線就是活的</td><td>半開連線也是 OPEN。要靠心跳和看門狗，才知道對方還在不在。</td></tr>
<tr><td>瀏覽器會自動幫我做心跳</td><td>瀏覽器只會回伺服器的 ping；JavaScript 不能送 ping，也看不到 pong。前端要自己做應用層心跳。</td></tr>
<tr><td>用了 wss 就安全了</td><td>TLS 保護的是線路，防的是路上的人。它防不了坐在螢幕前的玩家自己。</td></tr>
<tr><td>縮小、混淆過的 JS 就看不懂</td><td>開發者工具一鍵排版，花幾分鐘就讀得懂。秘密不能放在用戶端。</td></tr>
<tr><td>二進位協定一定比較好</td><td>流量小的回合制遊戲，JSON 好除錯的價值更大。頻寬或 CPU 真的成為瓶頸，才換二進位。</td></tr>
<tr><td>重連就是重新 new 一個 WebSocket</td><td>還要重新驗證身分、重新同步、丟掉重複的推播、決定哪些請求能安全重送。</td></tr>
</table>

<h3>十二、跟你的工作連起來</h3>
<ul>
<li><b>Vue</b>：同一個 <code>Net</code> 類別可以直接用在 Vue app 的聊天室和通知上，推播進來就更新 Pinia store。如果只需要伺服器往瀏覽器單向推送，瀏覽器內建的 <code>EventSource</code>（Server-Sent Events）更簡單：走一般的 HTTP，斷線會自動重連，還會帶上最後收到的事件編號。</li>
<li><b>Node.js／Go 後端</b>：Node.js 最常用 <code>ws</code> 套件；Go 常用 gorilla/websocket 或 coder/websocket。心跳、訊息大小上限、Origin 檢查這三件事，不管用哪個函式庫都要自己設定。</li>
<li><b>nginx</b>：反向代理 WebSocket，要明確轉送升級用的標頭，並把讀取逾時調得比心跳間隔長：</li>
</ul>
<pre><code>location /play {
    proxy_pass http://game_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 75s;
}
</code></pre>
<ul>
<li><b>Docker／Kubernetes</b>：滾動更新時，舊的 Pod 會收到 SIGTERM，預設有 30 秒的寬限時間。在這段時間裡對每條連線送 1001、再關閉，用戶端的完整抖動會把重連分散開來。負載平衡器的閒置逾時也要比心跳間隔長。</li>
<li><b>Cocos 原生平台</b>：Cocos 在原生平台上也提供同樣介面的 <code>WebSocket</code>，這一章的協定設計原封不動適用。Unity 也是一樣的協定設計，只是 WebSocket 用戶端的寫法不同。</li>
</ul>

<h3>十三、面試會怎麼問</h3>
<p>做連線遊戲、即時系統、後端的職缺，幾乎都會挑幾題問。先出聲講一遍，再看參考答案。</p>
<ol>
<li>「WebSocket、HTTP 輪詢、Server-Sent Events 差在哪？各自什麼時候用？」</li>
<li>「怎麼偵測斷線？為什麼需要心跳？」</li>
<li>「什麼是冪等？在遊戲或付款裡你會怎麼做？」</li>
<li>「重連為什麼要退避，還要加抖動？」</li>
<li>「為什麼伺服器必須權威？舉三種作弊方式和對策。」</li>
<li>「解釋用戶端預測和伺服器校正。」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>HTTP 輪詢是用戶端定時發請求問有沒有新東西，延遲取決於間隔，每次都帶完整標頭；長輪詢是伺服器把請求掛著，有資料才回，每則訊息仍要一個請求。Server-Sent Events 是一個持續串流的 HTTP 回應，只能伺服器往瀏覽器送文字，但走一般 HTTP、內建自動重連和事件編號。WebSocket 是雙向、低額外成本、可送二進位的長連線，但重連、心跳、訊息協定都要自己設計，代理也要正確設定。通知、動態牆用 SSE；聊天、即時遊戲用 WebSocket；低頻率的查詢用一般 HTTP。</li>
<li>close 事件只在正常關閉，或 TCP 自己發現連線壞掉時才觸發；手機網路突然消失時，連線會變成半開，readyState 還是 OPEN，可能好幾分鐘沒人發現。所以在應用層每隔固定時間送 ping，任何收到的訊息都重設一個看門狗計時器，逾時大約是間隔的兩倍多，逾時就主動關閉並重連。伺服器也做同樣的事，清掉幽靈連線。心跳還能讓代理和負載平衡器不把閒置連線切掉，pong 裡的時間戳也能拿來量 RTT 和時鐘偏差。</li>
<li>冪等是同一個請求執行多次，效果和執行一次一樣。斷線、逾時之後，用戶端不知道請求成功了沒有，只能重送，所以會改變狀態的請求要能安全重送。做法是用戶端在每次使用者操作時產生一把冪等鍵，重試沿用同一把；伺服器把鍵和結果存起來，看到同一把鍵就直接回存著的結果。遊戲裡可以用局數加第幾次猜；付款時鍵存進資料庫、用唯一索引擋重複，並和扣款在同一個交易裡完成，再設保存期限。</li>
<li>退避是讓重試間隔越拉越長，給正在掙扎的伺服器喘息空間，不會因為大家狂試而更起不來。抖動是讓每個用戶端的等待時間隨機，避免大量用戶端在同一刻被斷線（例如部署）後，又在同一刻一起衝回來，形成一波波的驚群。常用完整抖動：在 0 到上限之間均勻隨機。另外要連線穩定一段時間才把次數歸零、看關閉代碼決定要不要重連，並在失敗太久時給使用者手動重試的出口。</li>
<li>用戶端在玩家手上，程式、記憶體、協定全部看得到也改得了，還可以完全不用你的用戶端、直接用腳本連線。例子一：讀出隱藏資訊，對策是隱藏資訊永遠不送到用戶端。例子二：偽造結果，例如自己宣稱猜對或改分數，對策是用戶端只送意圖，結果由伺服器用自己的狀態算。例子三：重播或狂送訊息，對策是冪等鍵、局數檢查、限速和大小限制。另外還有改時鐘，對策是所有計時以伺服器為準。原則是每一則訊息都是可以被拒絕的請求。</li>
<li>為了不讓每個動作都等一個來回，用戶端先在本地套用自己的輸入並立刻顯示，同時把帶編號的輸入送給伺服器。伺服器是權威，它回報處理到第幾號輸入、那時的正確狀態。用戶端把狀態重設成伺服器的版本，再把還沒被確認的輸入重新套用一次，叫校正；結果不一樣時用幾幀平滑修正。其他玩家則用內插，顯示在稍微過去的時間點；命中判定由伺服器做延遲補償。隱藏資訊的結果不能預測，只能預測動畫這類確定會發生的部分。</li>
</ol>
</details>

<h3>十四、練功題（做得出來才算真的懂）</h3>
<ol>
<li>解碼這個 frame：<code>81 02 68 69</code>。它是哪一方送出的？如果伺服器從用戶端收到一個長這樣的 frame，規格要求它怎麼做？</li>
<li>用完整抖動，基數 1 秒、上限 30 秒。寫出第 1 到第 7 次重試的等待窗口和平均等待時間。如果一直連不上，第 7 次重試平均大約發生在斷線後多久？</li>
<li>心跳每 10 秒一次，看門狗 25 秒，每收到訊息就重設。網路死掉之後，最快和最慢多久會被發現？為什麼不是剛好 25 秒？</li>
<li>幫商店的「購買」設計冪等：鑰匙在什麼時候產生？存在哪裡？伺服器那邊怎麼保證「扣款」和「記下鑰匙」不會只做了一半？</li>
<li>把模擬伺服器的每個回覆隨機延遲 50 到 500 毫秒之後，下面這段程式出現了「畫面顯示的分數忽高忽低」。為什麼？怎麼修？<code>let latest; async function refresh() { latest = await net.request('score', {}); view.show(latest); }</code>，玩家連按了三次重新整理。</li>
<li>做一次安全審查：用戶端送出 <code>{ type: 'guess', data: { guess: 'higher', score: 6, nextCard: 4 } }</code>。列出你看到的所有問題。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>0x81：FIN 1、opcode 1，是一則完整的文字訊息；0x02：MASK 0、長度 2；資料 68 69 是「hi」。沒有遮罩，所以是伺服器送給用戶端的。用戶端送出的 frame 一定要遮罩，伺服器收到沒遮罩的 frame 必須關閉連線，可以帶關閉代碼 1002（協定錯誤）。</li>
<li>窗口依序是 0–1、0–2、0–4、0–8、0–16、0–30、0–30 秒，平均等待 0.5、1、2、4、8、15、15 秒。第 7 次重試發生在前 7 段等待都等完之後，平均大約 0.5 + 1 + 2 + 4 + 8 + 15 + 15 = 45.5 秒，還要再加上每次嘗試連線本身花的時間。</li>
<li>看門狗從「最後一次收到訊息」開始算 25 秒。訊息大約每 10 秒來一次，所以網路死掉時，最後一則訊息是在死掉前 0 到 10 秒之間收到的。剛好在收到 pong 之後立刻死掉，要等滿 25 秒；在下一個 pong 快來之前才死，前面已經過了將近 10 秒，只要再 15 秒。所以是 15 到 25 秒。</li>
<li>玩家按下「購買」的那一刻產生一把（例如 <code>crypto.randomUUID()</code>），跟著這次請求存在用戶端，之後的重試都沿用同一把；換一次購買才換新鑰匙。伺服器把鑰匙存進資料庫的購買紀錄表，欄位加唯一索引；在同一個資料庫交易裡「插入購買紀錄（含鑰匙）」和「扣款」，任何一步失敗整個交易回滾。重複的鑰匙會撞上唯一索引，這時查出原本那筆紀錄，回傳同一份結果。紀錄保留一段時間（例如一天）後再清。</li>
<li>三個請求的回覆亂序回來，最後抵達的不一定是最後送出的那一個，<code>latest</code> 被舊的回覆覆蓋，分數就跳回舊值。修法：每次請求記下自己的編號，回來時只接受最新那個編號的回覆（跟上一章的世代編號同一招）；或者伺服器回傳帶版本號的資料，只接受版本比較新的。</li>
<li>用戶端送 <code>score</code>：分數該由伺服器算，這個欄位要忽略，最好直接記一筆可疑紀錄。用戶端知道 <code>nextCard</code>：代表伺服器把下一張牌送到了用戶端，這是更嚴重的洩漏，要先修伺服器。缺了局數和冪等鍵：無法判斷是不是舊局的訊息或重送。另外伺服器要驗證 guess 只能是 higher 或 lower、這局現在是不是 guessing、時間到了沒有。</li>
</ol>
</details>

<h3>十五、想再挖深</h3>
<ul>
<li><b>RFC 6455：The WebSocket Protocol</b>（<a href="https://www.rfc-editor.org/rfc/rfc6455">rfc-editor.org</a>）：握手、frame、遮罩、關閉代碼的原始規格。第 5 節的 frame 格式值得對著這一章的圖讀一遍。</li>
<li><b>MDN 的 WebSocket API 文件</b>（<a href="https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API">developer.mozilla.org</a>）：瀏覽器端每個屬性、事件、關閉代碼的說明，還有各瀏覽器的支援情況。</li>
<li><b>Gabriel Gambetta〈Fast-Paced Multiplayer〉</b>（<a href="https://www.gabrielgambetta.com/client-server-game-architecture.html">gabrielgambetta.com</a>）：權威伺服器、用戶端預測、校正、內插、延遲補償，用互動圖一步一步講，是這個主題最好入門的系列文章。</li>
<li><b>Valve〈Source Multiplayer Networking〉</b>（<a href="https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking">developer.valvesoftware.com</a>）：一款真實商業引擎怎麼做 tick、內插、預測和延遲補償。</li>
<li><b>Marc Brooker〈Exponential Backoff And Jitter〉</b>（<a href="https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/">AWS Architecture Blog</a>）：用模擬比較各種抖動，看完就知道為什麼不能只做退避。</li>
</ul>
` });
