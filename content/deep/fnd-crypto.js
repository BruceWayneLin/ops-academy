DEEP({ 'fnd-crypto': `
<p>上一課給了你四樣工具：雜湊、對稱加密、非對稱加密、數位簽章。這一章把每一樣都拆開：雜湊的指紋為什麼「找不到撞衫」，MD5 和 SHA-1 又是怎麼被撞出來的；AES 只是一塊積木，真正決定安全的是「模式」，以及 nonce 重複用一次為什麼就全盤皆輸；RSA 和橢圓曲線用小數字算一遍；Diffie-Hellman 怎麼在大家都聽得到的地方約好一個祕密；憑證鏈怎麼讓瀏覽器相信對面真的是那個網站；最後是密碼怎麼存、亂數怎麼取，以及開發者最常犯的那些錯。你不需要會數學證明，但要知道每一樣工具<b>保證了什麼、沒保證什麼</b>，因為現實中的事故，幾乎都發生在這兩者的縫隙裡。</p>

<h3><span class="badge lv1">基礎</span>一、雜湊：一台倒不回去的果汁機</h3>
<p>雜湊函式（hash function）像一台果汁機：任何水果丟進去，都打出一杯固定大小的果汁；同樣的水果永遠打出同樣的果汁；但你沒辦法從果汁還原出水果。SHA-256 的「杯子」是 256 個位元，寫成 64 個十六進位字元。</p>
<figure class="figure"><svg viewBox="0 26 660 188" class="fg" style="width:100%;max-width:660px" role="img" aria-label="hello 和 hellp 只差一個字母，經過 SHA-256 之後的輸出完全不同，256 個位元裡有 131 個不一樣">
<rect x="20" y="40" width="110" height="36" rx="6" class="fg-b"/><text x="75" y="63" text-anchor="middle" class="fg-t mono">hello</text>
<rect x="20" y="110" width="110" height="36" rx="6" class="fg-b warm"/><text x="75" y="133" text-anchor="middle" class="fg-t mono">hellp</text>
<rect x="200" y="40" width="100" height="106" rx="8" class="fg-b hot"/><text x="250" y="88" text-anchor="middle" class="fg-t acc">SHA-256</text><text x="250" y="108" text-anchor="middle" class="fg-t sm">雜湊函式</text>
<line x1="130" y1="58" x2="192" y2="58" class="fg-l"/><polygon points="200,58 192,53.5 192,62.5" class="fg-a"/>
<line x1="130" y1="128" x2="192" y2="128" class="fg-l"/><polygon points="200,128 192,123.5 192,132.5" class="fg-a"/>
<line x1="300" y1="58" x2="362" y2="58" class="fg-l alt"/><polygon points="370,58 362,53.5 362,62.5" class="fg-a alt"/>
<line x1="300" y1="128" x2="362" y2="128" class="fg-l alt"/><polygon points="370,128 362,123.5 362,132.5" class="fg-a alt"/>
<rect x="370" y="40" width="270" height="36" rx="6" class="fg-b alt"/><text x="505" y="63" text-anchor="middle" class="fg-t mono">2cf24dba5fb0a30e…938b9824</text>
<rect x="370" y="110" width="270" height="36" rx="6" class="fg-b alt"/><text x="505" y="133" text-anchor="middle" class="fg-t mono">fdd7585e08c4e2af…08aa4ce7</text>
<text x="75" y="176" text-anchor="middle" class="fg-t sm">只差最後一個字母</text>
<text x="75" y="194" text-anchor="middle" class="fg-t sm">o 和 p 只差 5 個位元</text>
<text x="505" y="176" text-anchor="middle" class="fg-t acc">256 個位元裡有 131 個不同</text>
<text x="505" y="194" text-anchor="middle" class="fg-t sm">大約一半，跟兩個隨機數一樣陌生</text>
</svg><figcaption>輸入只動一點點，輸出就像擲了 256 次新的硬幣。這叫雪崩效應（avalanche effect）：從輸出的相似程度，猜不出輸入有多相似。</figcaption></figure>
<p>一個能用在資安上的雜湊函式，要同時做到三件事，難度一件比一件低：</p>
<table>
<tr><th>性質</th><th>白話</th><th>被打破時會怎樣</th></tr>
<tr><td><b>抗原像</b>（preimage resistance）</td><td>給你一杯果汁，找不出任何一種能打出它的水果</td><td>雜湊過的祕密可以被還原</td></tr>
<tr><td><b>抗第二原像</b>（second preimage resistance）</td><td>給你一顆蘋果，找不出另一種水果打出一模一樣的果汁</td><td>可以做出跟某個檔案同指紋的假檔案</td></tr>
<tr><td><b>抗碰撞</b>（collision resistance）</td><td>連「任意兩種水果打出同一杯」都找不到，水果還可以自己挑</td><td>可以準備兩份內容不同、指紋相同的文件</td></tr>
</table>
<p>注意：碰撞一定<b>存在</b>。輸入有無限多種，輸出只有 2²⁵⁶ 種，鴿籠原理保證一定有兩個輸入撞在一起。安全的意思是「存在，但找不到」。</p>
<h4>生日問題：為什麼 256 位元只值 128</h4>
<p>一間教室要有幾個人，才有一半機會出現兩個人同一天生日？答案是 23 人，比直覺少很多，因為要比較的是「任意兩人」，23 人就有 253 對。雜湊也一樣：輸出有 n 個位元，隨便亂試大約 2<sup>n/2</sup> 次，就有一半機會撞出一對。所以 SHA-256 的抗碰撞強度是 2¹²⁸，MD5 的 128 位元輸出，理論上只值 2⁶⁴，這在今天已經是算得完的數字。</p>

<h3><span class="badge lv1">基礎</span>二、MD5 和 SHA-1 是怎麼死的</h3>
<p>「被破解」對雜湊來說，通常是指有人找到比亂試快得多的方法，做出碰撞。時間線很值得記：</p>
<table>
<tr><th>年份</th><th>事件</th><th>意義</th></tr>
<tr><td>2004</td><td>王小雲等人公開 MD5 碰撞</td><td>MD5 的抗碰撞性正式崩潰；今天一台筆電幾秒就能做出一組</td></tr>
<tr><td>2008</td><td>研究團隊用 200 台 PS3，靠 MD5 碰撞做出一張假的憑證機構憑證</td><td>證明碰撞可以拿來偽造「信任」</td></tr>
<tr><td>2012</td><td>Flame 惡意程式用 MD5 碰撞偽造了微軟的程式碼簽章</td><td>國家級攻擊真的用上了</td></tr>
<tr><td>2017</td><td>Google 與 CWI 公開 SHAttered：兩份不同的 PDF，SHA-1 一模一樣</td><td>花了大約 9 × 10¹⁸ 次 SHA-1 運算，SHA-1 碰撞從理論變成事實</td></tr>
<tr><td>2020</td><td>「SHA-1 is a Shambles」：選擇前綴碰撞，租 GPU 大約 4.5 萬美元</td><td>兩份文件的開頭可以自己挑，偽造變得實用</td></tr>
</table>
<p>為什麼碰撞這麼要命？因為<b>數位簽章簽的是雜湊，不是文件本身</b>。如果我能做出兩份指紋相同的文件，一份無害、一份惡意，騙你簽了無害的那份，你的簽章對惡意那份也一樣有效。2008 年的假憑證就是這樣做的：讓憑證機構簽一張普通的網站憑證，而它的 MD5 恰好等於另一張「我也是憑證機構」的憑證。</p>
<p>要分清楚兩件事。第一，碰撞被破，不代表原像被破：至今沒有人能從一個 MD5 值實際還原出原文。但這不是繼續用它的理由，新系統一律用 SHA-256 或更新的演算法。第二，只拿來偵測「意外損壞」（下載中斷、磁碟壞軌）時，MD5 還是抓得到錯，只是抓不到「故意的」竄改。Git 原本用 SHA-1 當物件名稱，SHAttered 之後改用加了碰撞偵測的 SHA-1，並且已經提供 SHA-256 的儲存格式；Docker 的映像檔摘要（<code>sha256:…</code>）則一開始就用 SHA-256。</p>
<h4>長度延伸：SHA-256 沒壞，但你可能用錯</h4>
<p>SHA-256 這一家（還有 SHA-1、MD5）的內部是「一塊一塊吃進去、輸出就是最後的內部狀態」。後果是：只要知道 <code>SHA-256(祕密 ‖ 訊息)</code> 和祕密的長度，攻擊者<b>不知道祕密</b>也能算出 <code>SHA-256(祕密 ‖ 訊息 ‖ 填充 ‖ 任意附加內容)</code>。2009 年就有大型網站的 API 簽章被這樣偽造過。所以「把祕密接在前面再雜湊」不能當驗證碼用，要用 <b>HMAC</b>，它專門設計來擋這件事；Webhook、HS256 權杖用的都是 HMAC。</p>

<h3><span class="badge lv2">進階</span>三、對稱加密：AES 只是一塊積木，模式才是重點</h3>
<p><b>AES</b> 本身是一個<b>區塊加密</b>（block cipher）：給它一把金鑰（128、192 或 256 位元）和剛好 16 個位元組，它吐出 16 個看起來完全隨機的位元組；有金鑰才能反過來。它很快：現代 CPU 有專門的 AES 指令，一顆核心每秒可以加密好幾 GB。</p>
<p>問題是你的資料不會剛好 16 個位元組。怎麼用這塊 16 位元組的積木處理任意長度的資料，叫做<b>模式</b>（mode of operation）。選錯模式，AES 再強也沒用：</p>
<figure class="figure"><svg viewBox="0 0 680 340" class="fg" style="width:100%;max-width:680px" role="img" aria-label="ECB 模式把每塊明文各自加密，相同的明文得到相同的密文；GCM 模式用 nonce 加計數器產生金鑰流再做 XOR，每塊密文都不同，最後算出驗證標籤">
<text x="20" y="46" class="fg-t lg warm">ECB</text><text x="20" y="66" class="fg-t sm">每塊各自加密</text>
<rect x="150" y="24" width="150" height="24" rx="5" class="fg-b"/><text x="225" y="41" text-anchor="middle" class="fg-t mono">HIGHER</text>
<rect x="330" y="24" width="150" height="24" rx="5" class="fg-b"/><text x="405" y="41" text-anchor="middle" class="fg-t mono">HIGHER</text>
<rect x="510" y="24" width="150" height="24" rx="5" class="fg-b"/><text x="585" y="41" text-anchor="middle" class="fg-t mono">SCORE=42</text>
<line x1="225" y1="48" x2="225" y2="56" class="fg-l"/><polygon points="225,64 220.5,56 229.5,56" class="fg-a"/>
<line x1="405" y1="48" x2="405" y2="56" class="fg-l"/><polygon points="405,64 400.5,56 409.5,56" class="fg-a"/>
<line x1="585" y1="48" x2="585" y2="56" class="fg-l"/><polygon points="585,64 580.5,56 589.5,56" class="fg-a"/>
<rect x="150" y="64" width="150" height="22" rx="5" class="fg-b"/><text x="225" y="80" text-anchor="middle" class="fg-t sm">AES</text>
<rect x="330" y="64" width="150" height="22" rx="5" class="fg-b"/><text x="405" y="80" text-anchor="middle" class="fg-t sm">AES</text>
<rect x="510" y="64" width="150" height="22" rx="5" class="fg-b"/><text x="585" y="80" text-anchor="middle" class="fg-t sm">AES</text>
<line x1="225" y1="86" x2="225" y2="92" class="fg-l"/><polygon points="225,100 220.5,92 229.5,92" class="fg-a"/>
<line x1="405" y1="86" x2="405" y2="92" class="fg-l"/><polygon points="405,100 400.5,92 409.5,92" class="fg-a"/>
<line x1="585" y1="86" x2="585" y2="92" class="fg-l"/><polygon points="585,100 580.5,92 589.5,92" class="fg-a"/>
<rect x="150" y="100" width="150" height="24" rx="5" class="fg-b warm"/><text x="225" y="117" text-anchor="middle" class="fg-t mono">7f3a91c2…</text>
<rect x="330" y="100" width="150" height="24" rx="5" class="fg-b warm"/><text x="405" y="117" text-anchor="middle" class="fg-t mono">7f3a91c2…</text>
<rect x="510" y="100" width="150" height="24" rx="5" class="fg-b"/><text x="585" y="117" text-anchor="middle" class="fg-t mono">c91e0b57…</text>
<text x="405" y="144" text-anchor="middle" class="fg-t sm warm">同樣的明文得到同樣的密文：不用解密，就看得出哪兩塊一樣</text>
<line x1="20" y1="158" x2="660" y2="158" class="fg-l dim dash"/>
<text x="20" y="194" class="fg-t lg acc">GCM</text><text x="20" y="214" class="fg-t sm">計數器＋驗證標籤</text>
<rect x="150" y="170" width="150" height="22" rx="5" class="fg-b"/><text x="225" y="186" text-anchor="middle" class="fg-t mono">nonce‖1</text>
<rect x="330" y="170" width="150" height="22" rx="5" class="fg-b"/><text x="405" y="186" text-anchor="middle" class="fg-t mono">nonce‖2</text>
<rect x="510" y="170" width="150" height="22" rx="5" class="fg-b"/><text x="585" y="186" text-anchor="middle" class="fg-t mono">nonce‖3</text>
<line x1="225" y1="192" x2="225" y2="198" class="fg-l"/><polygon points="225,206 220.5,198 229.5,198" class="fg-a"/>
<line x1="405" y1="192" x2="405" y2="198" class="fg-l"/><polygon points="405,206 400.5,198 409.5,198" class="fg-a"/>
<line x1="585" y1="192" x2="585" y2="198" class="fg-l"/><polygon points="585,206 580.5,198 589.5,198" class="fg-a"/>
<rect x="150" y="206" width="150" height="22" rx="5" class="fg-b"/><text x="225" y="222" text-anchor="middle" class="fg-t sm">AES → 金鑰流</text>
<rect x="330" y="206" width="150" height="22" rx="5" class="fg-b"/><text x="405" y="222" text-anchor="middle" class="fg-t sm">AES → 金鑰流</text>
<rect x="510" y="206" width="150" height="22" rx="5" class="fg-b"/><text x="585" y="222" text-anchor="middle" class="fg-t sm">AES → 金鑰流</text>
<line x1="225" y1="228" x2="225" y2="234" class="fg-l"/><polygon points="225,242 220.5,234 229.5,234" class="fg-a"/>
<line x1="405" y1="228" x2="405" y2="234" class="fg-l"/><polygon points="405,242 400.5,234 409.5,234" class="fg-a"/>
<line x1="585" y1="228" x2="585" y2="234" class="fg-l"/><polygon points="585,242 580.5,234 589.5,234" class="fg-a"/>
<rect x="150" y="242" width="150" height="22" rx="5" class="fg-b"/><text x="225" y="258" text-anchor="middle" class="fg-t mono">⊕ HIGHER</text>
<rect x="330" y="242" width="150" height="22" rx="5" class="fg-b"/><text x="405" y="258" text-anchor="middle" class="fg-t mono">⊕ HIGHER</text>
<rect x="510" y="242" width="150" height="22" rx="5" class="fg-b"/><text x="585" y="258" text-anchor="middle" class="fg-t mono">⊕ SCORE=42</text>
<line x1="225" y1="264" x2="225" y2="270" class="fg-l"/><polygon points="225,278 220.5,270 229.5,270" class="fg-a"/>
<line x1="405" y1="264" x2="405" y2="270" class="fg-l"/><polygon points="405,278 400.5,270 409.5,270" class="fg-a"/>
<line x1="585" y1="264" x2="585" y2="270" class="fg-l"/><polygon points="585,278 580.5,270 589.5,270" class="fg-a"/>
<rect x="150" y="278" width="150" height="24" rx="5" class="fg-b hot"/><text x="225" y="295" text-anchor="middle" class="fg-t mono">a40e7713…</text>
<rect x="330" y="278" width="150" height="24" rx="5" class="fg-b hot"/><text x="405" y="295" text-anchor="middle" class="fg-t mono">5bd2c08f…</text>
<rect x="510" y="278" width="150" height="24" rx="5" class="fg-b hot"/><text x="585" y="295" text-anchor="middle" class="fg-t mono">e6197a3d…</text>
<rect x="150" y="310" width="510" height="24" rx="5" class="fg-b alt"/><text x="405" y="327" text-anchor="middle" class="fg-t">全部密文一起算出 16 位元組的驗證標籤（tag）：改一個位元就驗不過</text>
</svg><figcaption>ECB 像一本固定的密碼本，同一個字永遠翻成同一個暗號，模式完全藏不住。GCM 讓每一塊都用不同的金鑰流，相同的明文也變成不同的密文，最後再附上一個檢查碼。</figcaption></figure>
<ul>
<li><b>ECB</b>：每 16 個位元組各自加密。最有名的反例是「ECB 企鵝」：把一張企鵝圖用 ECB 加密，輪廓還是清清楚楚。<b>永遠不要用。</b></li>
<li><b>CBC</b>：每一塊加密前先跟前一塊的密文混合，需要一個隨機的起始值（IV）和填充。它本身<b>不檢查竄改</b>，歷史上衍生出一整類「填充預言機」（padding oracle）攻擊，SSL 3.0 的 POODLE 就是其中之一。</li>
<li><b>CTR</b>：用 AES 加密「nonce＋計數器」，產生一串金鑰流（keystream），再跟明文做 XOR。可以平行運算、不用填充，但同樣不檢查竄改。</li>
<li><b>GCM</b>：CTR 加上一個驗證標籤。這種「加密＋驗證一次做完」的設計叫 <b>AEAD</b>（authenticated encryption with associated data）。解密時先驗標籤，對不上就整個拒絕，連一個位元組都不交給你。另一個常用的 AEAD 是 <b>ChaCha20-Poly1305</b>，在沒有 AES 硬體指令的裝置上比較快。TLS 1.3 只允許 AEAD。</li>
</ul>
<p>AEAD 裡的「associated data」是一段<b>不加密、但一起受保護</b>的資料。例如把使用者 ID 當作附加資料，密文就跟這個 ID 綁在一起，攻擊者把 A 的加密資料搬到 B 的帳號下，解密會直接失敗。用 Node.js 寫一次 AES-256-GCM：</p>
<pre><code>const crypto = require('crypto');
// 256 位元金鑰；正式環境放在祕密管理服務
const key = crypto.randomBytes(32);

function seal(text) {
  const iv = crypto.randomBytes(12);   // 每次都換新的 nonce
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([c.update(text, 'utf8'), c.final()]);
  // 存成 nonce（12）＋標籤（16）＋密文
  return Buffer.concat([iv, c.getAuthTag(), body]);
}

function open(box) {
  const iv = box.subarray(0, 12);
  const d = crypto.createDecipheriv('aes-256-gcm', key, iv);
  d.setAuthTag(box.subarray(12, 28));
  // 被改過的話，final() 會丟出錯誤
  const plain = Buffer.concat([d.update(box.subarray(28)), d.final()]);
  return plain.toString('utf8');
}</code></pre>

<h3><span class="badge lv2">進階</span>四、nonce 重複一次，就全盤皆輸</h3>
<p>CTR 和 GCM 的金鑰流，只由「金鑰＋nonce＋計數器」決定。同一把金鑰下，<b>nonce 用了兩次，就會產生兩段一模一樣的金鑰流</b>。用一個位元組實際算一次：兩次加密的明文分別是猜高低的「H」和「L」。</p>
<figure class="figure"><svg viewBox="0 0 600 272" class="fg" style="width:100%;max-width:600px" role="img" aria-label="位元表：H 和 L 用同一段金鑰流 XOR 加密，兩個密文再 XOR，金鑰流互相抵消，得到 H XOR L">
<text x="240" y="38" text-anchor="end" class="fg-t">明文 1：H</text>
<text x="240" y="70" text-anchor="end" class="fg-t warm">金鑰流 K</text>
<text x="240" y="102" text-anchor="end" class="fg-t">密文 1</text>
<text x="240" y="146" text-anchor="end" class="fg-t">明文 2：L</text>
<text x="240" y="178" text-anchor="end" class="fg-t warm">同一段 K（nonce 重複）</text>
<text x="240" y="210" text-anchor="end" class="fg-t">密文 2</text>
<text x="240" y="254" text-anchor="end" class="fg-t acc">密文 1 ⊕ 密文 2</text>
<rect x="260" y="20" width="28" height="26" rx="4" class="fg-b"/><rect x="292" y="20" width="28" height="26" rx="4" class="fg-b"/><rect x="324" y="20" width="28" height="26" rx="4" class="fg-b"/><rect x="356" y="20" width="28" height="26" rx="4" class="fg-b"/><rect x="388" y="20" width="28" height="26" rx="4" class="fg-b"/><rect x="420" y="20" width="28" height="26" rx="4" class="fg-b"/><rect x="452" y="20" width="28" height="26" rx="4" class="fg-b"/><rect x="484" y="20" width="28" height="26" rx="4" class="fg-b"/>
<rect x="260" y="52" width="28" height="26" rx="4" class="fg-b warm"/><rect x="292" y="52" width="28" height="26" rx="4" class="fg-b warm"/><rect x="324" y="52" width="28" height="26" rx="4" class="fg-b warm"/><rect x="356" y="52" width="28" height="26" rx="4" class="fg-b warm"/><rect x="388" y="52" width="28" height="26" rx="4" class="fg-b warm"/><rect x="420" y="52" width="28" height="26" rx="4" class="fg-b warm"/><rect x="452" y="52" width="28" height="26" rx="4" class="fg-b warm"/><rect x="484" y="52" width="28" height="26" rx="4" class="fg-b warm"/>
<rect x="260" y="84" width="28" height="26" rx="4" class="fg-b alt"/><rect x="292" y="84" width="28" height="26" rx="4" class="fg-b alt"/><rect x="324" y="84" width="28" height="26" rx="4" class="fg-b alt"/><rect x="356" y="84" width="28" height="26" rx="4" class="fg-b alt"/><rect x="388" y="84" width="28" height="26" rx="4" class="fg-b alt"/><rect x="420" y="84" width="28" height="26" rx="4" class="fg-b alt"/><rect x="452" y="84" width="28" height="26" rx="4" class="fg-b alt"/><rect x="484" y="84" width="28" height="26" rx="4" class="fg-b alt"/>
<rect x="260" y="128" width="28" height="26" rx="4" class="fg-b"/><rect x="292" y="128" width="28" height="26" rx="4" class="fg-b"/><rect x="324" y="128" width="28" height="26" rx="4" class="fg-b"/><rect x="356" y="128" width="28" height="26" rx="4" class="fg-b"/><rect x="388" y="128" width="28" height="26" rx="4" class="fg-b"/><rect x="420" y="128" width="28" height="26" rx="4" class="fg-b"/><rect x="452" y="128" width="28" height="26" rx="4" class="fg-b"/><rect x="484" y="128" width="28" height="26" rx="4" class="fg-b"/>
<rect x="260" y="160" width="28" height="26" rx="4" class="fg-b warm"/><rect x="292" y="160" width="28" height="26" rx="4" class="fg-b warm"/><rect x="324" y="160" width="28" height="26" rx="4" class="fg-b warm"/><rect x="356" y="160" width="28" height="26" rx="4" class="fg-b warm"/><rect x="388" y="160" width="28" height="26" rx="4" class="fg-b warm"/><rect x="420" y="160" width="28" height="26" rx="4" class="fg-b warm"/><rect x="452" y="160" width="28" height="26" rx="4" class="fg-b warm"/><rect x="484" y="160" width="28" height="26" rx="4" class="fg-b warm"/>
<rect x="260" y="192" width="28" height="26" rx="4" class="fg-b alt"/><rect x="292" y="192" width="28" height="26" rx="4" class="fg-b alt"/><rect x="324" y="192" width="28" height="26" rx="4" class="fg-b alt"/><rect x="356" y="192" width="28" height="26" rx="4" class="fg-b alt"/><rect x="388" y="192" width="28" height="26" rx="4" class="fg-b alt"/><rect x="420" y="192" width="28" height="26" rx="4" class="fg-b alt"/><rect x="452" y="192" width="28" height="26" rx="4" class="fg-b alt"/><rect x="484" y="192" width="28" height="26" rx="4" class="fg-b alt"/>
<rect x="260" y="236" width="28" height="26" rx="4" class="fg-b"/><rect x="292" y="236" width="28" height="26" rx="4" class="fg-b"/><rect x="324" y="236" width="28" height="26" rx="4" class="fg-b"/><rect x="356" y="236" width="28" height="26" rx="4" class="fg-b"/><rect x="388" y="236" width="28" height="26" rx="4" class="fg-b"/><rect x="420" y="236" width="28" height="26" rx="4" class="fg-b hot"/><rect x="452" y="236" width="28" height="26" rx="4" class="fg-b"/><rect x="484" y="236" width="28" height="26" rx="4" class="fg-b"/>
<text x="274" y="38" text-anchor="middle" class="fg-t mono">0</text><text x="306" y="38" text-anchor="middle" class="fg-t mono">1</text><text x="338" y="38" text-anchor="middle" class="fg-t mono">0</text><text x="370" y="38" text-anchor="middle" class="fg-t mono">0</text><text x="402" y="38" text-anchor="middle" class="fg-t mono">1</text><text x="434" y="38" text-anchor="middle" class="fg-t mono">0</text><text x="466" y="38" text-anchor="middle" class="fg-t mono">0</text><text x="498" y="38" text-anchor="middle" class="fg-t mono">0</text>
<text x="274" y="70" text-anchor="middle" class="fg-t mono">1</text><text x="306" y="70" text-anchor="middle" class="fg-t mono">0</text><text x="338" y="70" text-anchor="middle" class="fg-t mono">1</text><text x="370" y="70" text-anchor="middle" class="fg-t mono">1</text><text x="402" y="70" text-anchor="middle" class="fg-t mono">0</text><text x="434" y="70" text-anchor="middle" class="fg-t mono">1</text><text x="466" y="70" text-anchor="middle" class="fg-t mono">0</text><text x="498" y="70" text-anchor="middle" class="fg-t mono">1</text>
<text x="274" y="102" text-anchor="middle" class="fg-t mono">1</text><text x="306" y="102" text-anchor="middle" class="fg-t mono">1</text><text x="338" y="102" text-anchor="middle" class="fg-t mono">1</text><text x="370" y="102" text-anchor="middle" class="fg-t mono">1</text><text x="402" y="102" text-anchor="middle" class="fg-t mono">1</text><text x="434" y="102" text-anchor="middle" class="fg-t mono">1</text><text x="466" y="102" text-anchor="middle" class="fg-t mono">0</text><text x="498" y="102" text-anchor="middle" class="fg-t mono">1</text>
<text x="274" y="146" text-anchor="middle" class="fg-t mono">0</text><text x="306" y="146" text-anchor="middle" class="fg-t mono">1</text><text x="338" y="146" text-anchor="middle" class="fg-t mono">0</text><text x="370" y="146" text-anchor="middle" class="fg-t mono">0</text><text x="402" y="146" text-anchor="middle" class="fg-t mono">1</text><text x="434" y="146" text-anchor="middle" class="fg-t mono">1</text><text x="466" y="146" text-anchor="middle" class="fg-t mono">0</text><text x="498" y="146" text-anchor="middle" class="fg-t mono">0</text>
<text x="274" y="178" text-anchor="middle" class="fg-t mono">1</text><text x="306" y="178" text-anchor="middle" class="fg-t mono">0</text><text x="338" y="178" text-anchor="middle" class="fg-t mono">1</text><text x="370" y="178" text-anchor="middle" class="fg-t mono">1</text><text x="402" y="178" text-anchor="middle" class="fg-t mono">0</text><text x="434" y="178" text-anchor="middle" class="fg-t mono">1</text><text x="466" y="178" text-anchor="middle" class="fg-t mono">0</text><text x="498" y="178" text-anchor="middle" class="fg-t mono">1</text>
<text x="274" y="210" text-anchor="middle" class="fg-t mono">1</text><text x="306" y="210" text-anchor="middle" class="fg-t mono">1</text><text x="338" y="210" text-anchor="middle" class="fg-t mono">1</text><text x="370" y="210" text-anchor="middle" class="fg-t mono">1</text><text x="402" y="210" text-anchor="middle" class="fg-t mono">1</text><text x="434" y="210" text-anchor="middle" class="fg-t mono">0</text><text x="466" y="210" text-anchor="middle" class="fg-t mono">0</text><text x="498" y="210" text-anchor="middle" class="fg-t mono">1</text>
<line x1="260" y1="228" x2="512" y2="228" class="fg-l"/>
<text x="274" y="254" text-anchor="middle" class="fg-t mono">0</text><text x="306" y="254" text-anchor="middle" class="fg-t mono">0</text><text x="338" y="254" text-anchor="middle" class="fg-t mono">0</text><text x="370" y="254" text-anchor="middle" class="fg-t mono">0</text><text x="402" y="254" text-anchor="middle" class="fg-t mono">0</text><text x="434" y="254" text-anchor="middle" class="fg-t mono acc">1</text><text x="466" y="254" text-anchor="middle" class="fg-t mono">0</text><text x="498" y="254" text-anchor="middle" class="fg-t mono">0</text>
<text x="526" y="38" class="fg-t sm mono">0x48</text><text x="526" y="70" class="fg-t sm mono">0xB5</text><text x="526" y="102" class="fg-t sm mono">0xFD</text>
<text x="526" y="146" class="fg-t sm mono">0x4C</text><text x="526" y="178" class="fg-t sm mono">0xB5</text><text x="526" y="210" class="fg-t sm mono">0xF9</text>
<text x="526" y="254" class="fg-t sm mono acc">= H ⊕ L</text>
</svg><figcaption>XOR 兩次同一個值會互相抵消，所以兩段密文 XOR 起來，金鑰流就不見了，剩下「明文 1 ⊕ 明文 2」。偷聽的人只要知道其中一則是 H，另一則立刻就是 L。</figcaption></figure>
<p>這不是理論。真實的長訊息裡，攻擊者常常猜得到其中一段（HTTP 標頭、JSON 的欄位名稱），一路就能把另一則解出來。GCM 更慘：nonce 重複還會洩漏驗證標籤用的內部金鑰，攻擊者從此可以<b>偽造任何訊息的標籤</b>，加密和驗證一起失效。歷史上的例子：Wi-Fi 的 WEP 只有 24 位元的 IV，流量一大就必然重複；2017 年的 KRACK 攻擊，就是設法讓 WPA2 重新安裝金鑰、把 nonce 歸零；2016 年還有研究在網際網路上找到上百台會重複 GCM nonce 的 HTTPS 伺服器。</p>
<h4>怎麼避免</h4>
<ul>
<li><b>隨機 96 位元 nonce</b>：最簡單，但同一把金鑰最多加密約 2³² 則訊息（NIST 的建議上限），之後要換金鑰。</li>
<li><b>計數器 nonce</b>：從 0 開始每次加 1，保證不重複；前提是計數器絕不能重來，例如伺服器重啟或多台機器共用金鑰時，要特別小心。</li>
<li><b>換一個對誤用比較寬容的演算法</b>：XChaCha20-Poly1305 用 192 位元的 nonce，隨機產生幾乎不可能撞；AES-GCM-SIV 即使 nonce 重複，也只會洩漏「兩則訊息一樣」，不會整個崩潰。</li>
<li>最好的做法是用高階函式庫（例如 libsodium 的 secretbox），讓它替你產生和管理 nonce，你根本碰不到。</li>
</ul>

<h3><span class="badge lv3">專業</span>五、公開金鑰：RSA 與橢圓曲線，用小數字看懂</h3>
<p>非對稱加密需要一種「單向、但有暗門」的運算：正著算很容易，倒著算幾乎不可能，除非你知道一個祕密。RSA 用的是「乘法容易、因數分解困難」。把 61 和 53 乘起來，心算就行；但給你 3233，要找出它是哪兩個質數相乘，就得一個一個試。數字長到 617 位數時，地球上所有電腦一起試也試不完。</p>
<h4>RSA 實際算一次（玩具尺寸）</h4>
<ol>
<li>挑兩個質數 p = 61、q = 53，相乘得到 <b>n = 3233</b>。</li>
<li>算 (p − 1)(q − 1) = 60 × 52 = 3120。</li>
<li>挑一個公開指數 <b>e = 17</b>。公鑰就是 (n = 3233, e = 17)，可以公開給全世界。</li>
<li>算出私鑰 <b>d = 2753</b>，它滿足 17 × 2753 除以 3120 餘 1。算 d 需要知道 3120，而算 3120 需要知道 61 和 53。<b>這就是暗門</b>。</li>
<li>加密訊息 m = 65：65¹⁷ mod 3233 = <b>2790</b>。</li>
<li>解密：2790²⁷⁵³ mod 3233 = <b>65</b>。回來了。</li>
</ol>
<p>簽章則是反過來：用 d 對訊息的雜湊做運算，任何人用 e 都能驗證。真實系統從不直接這樣用（叫「教科書 RSA」，它是確定性的，而且可以被改造），加密要用 OAEP 填充、簽章要用 PSS 填充，交給函式庫處理。</p>
<h4>橢圓曲線：同樣的安全，短得多的金鑰</h4>
<p>橢圓曲線密碼學（ECC）在一條曲線上定義了一種「點加點」的運算。從一個公開的起點 G 出發，把它加自己 k 次，得到另一個點 k·G。用「先加倍、再相加」的技巧，k 就算是 256 位元的天文數字，也只要幾百步就算完；但給你 G 和 k·G，要反推出 k，目前沒有比硬試快多少的方法。k 就是私鑰，k·G 就是公鑰。打個比方：一顆撞球在桌上彈了 k 次停下來，你看得到起點和終點，卻算不出它彈了幾次。</p>
<figure class="figure"><svg viewBox="0 0 640 214" class="fg" style="width:100%;max-width:640px" role="img" aria-label="同樣約 128 位元安全強度：AES 金鑰 128 位元，橢圓曲線 256 位元，RSA 3072 位元">
<text x="320" y="22" text-anchor="middle" class="fg-t lg">同樣約 128 位元的安全強度，需要多長的金鑰</text>
<text x="160" y="63" text-anchor="end" class="fg-t">對稱（AES）</text>
<rect x="170" y="44" width="18" height="30" rx="4" class="fg-b hot"/><text x="198" y="64" class="fg-t mono">128 位元</text>
<text x="160" y="109" text-anchor="end" class="fg-t">橢圓曲線</text>
<rect x="170" y="90" width="37" height="30" rx="4" class="fg-b alt"/><text x="217" y="110" class="fg-t mono">256 位元</text>
<text x="160" y="155" text-anchor="end" class="fg-t">RSA</text>
<rect x="170" y="136" width="439" height="30" rx="4" class="fg-b warm"/><text x="389" y="156" text-anchor="middle" class="fg-t mono">3,072 位元</text>
<text x="320" y="196" text-anchor="middle" class="fg-t sm">長度差了二十幾倍，但要破解都得做大約 2¹²⁸ 次運算；常見的 RSA 2048 只相當於約 112 位元</text>
</svg><figcaption>這就是為什麼新系統偏好橢圓曲線：金鑰和簽章都小得多、運算更快，憑證和交握封包也跟著變小。</figcaption></figure>
<p>你會遇到三條曲線：<b>P-256</b>（美國 NIST 標準，憑證和雲端服務最常見）、<b>Curve25519</b>（金鑰交換叫 X25519、簽章叫 Ed25519，設計上不容易用錯，SSH 和 TLS 1.3 的首選），以及 <b>secp256k1</b>（比特幣和以太坊）。</p>
<h4>量子電腦</h4>
<p>夠大的量子電腦可以用 Shor 演算法有效率地分解質因數、解橢圓曲線問題，RSA、ECC、Diffie-Hellman 會一起失效；對稱加密只是強度減半，所以 AES-256 還是安全。這樣的量子電腦今天還不存在，但「先錄下來、以後再解」是真實的威脅。NIST 在 2024 年發布了後量子標準（金鑰交換用的 ML-KEM、簽章用的 ML-DSA），Chrome、Firefox 等主流瀏覽器已經在 TLS 預設採用 X25519 加 ML-KEM 的混合金鑰交換：兩種都要被破，連線才會被破。</p>

<h3><span class="badge lv3">專業</span>六、Diffie-Hellman：在大家都聽得到的地方，約好一個祕密</h3>
<p>想像兩個人各自調顏料。先公開約好一個底色（黃色）。小明偷偷加了紅色，小美偷偷加了藍色，各自把混好的顏料寄給對方，寄的過程誰都看得到。收到之後，小明在小美寄來的那桶裡再加自己的紅色，小美在小明那桶裡加自己的藍色。兩個人最後都得到「黃＋紅＋藍」，一模一樣；偷看的人手上只有「黃＋紅」和「黃＋藍」，而顏料混了就分不開。換成數字：</p>
<figure class="figure"><svg viewBox="0 0 680 296" class="fg" style="width:100%;max-width:680px" role="img" aria-label="Diffie-Hellman 金鑰交換：公開 p 等於 23、g 等於 5，小明的祕密是 6、小美的祕密是 15，交換 8 和 19 之後兩人都算出 2，偷聽的人算不出來">
<text x="120" y="24" text-anchor="middle" class="fg-t lg">小明</text>
<text x="340" y="24" text-anchor="middle" class="fg-t lg">公開通道</text>
<text x="560" y="24" text-anchor="middle" class="fg-t lg">小美</text>
<rect x="240" y="38" width="200" height="36" rx="6" class="fg-b"/><text x="340" y="61" text-anchor="middle" class="fg-t">公開約定 p = 23，g = 5</text>
<rect x="20" y="88" width="200" height="34" rx="6" class="fg-b warm"/><text x="120" y="110" text-anchor="middle" class="fg-t">祕密 a = 6（不送出）</text>
<rect x="460" y="88" width="200" height="34" rx="6" class="fg-b warm"/><text x="560" y="110" text-anchor="middle" class="fg-t">祕密 b = 15（不送出）</text>
<rect x="20" y="136" width="200" height="34" rx="6" class="fg-b"/><text x="120" y="158" text-anchor="middle" class="fg-t">A = 5⁶ mod 23 = 8</text>
<rect x="460" y="136" width="200" height="34" rx="6" class="fg-b"/><text x="560" y="158" text-anchor="middle" class="fg-t">B = 5¹⁵ mod 23 = 19</text>
<line x1="220" y1="196" x2="452" y2="196" class="fg-l alt"/><polygon points="460,196 452,191.5 452,200.5" class="fg-a alt"/>
<text x="340" y="190" text-anchor="middle" class="fg-t sm alt">送出 A = 8</text>
<line x1="228" y1="222" x2="460" y2="222" class="fg-l alt"/><polygon points="220,222 228,217.5 228,226.5" class="fg-a alt"/>
<text x="340" y="216" text-anchor="middle" class="fg-t sm alt">送出 B = 19</text>
<rect x="20" y="246" width="200" height="38" rx="6" class="fg-b hot"/><text x="120" y="270" text-anchor="middle" class="fg-t acc">19⁶ mod 23 = 2</text>
<rect x="460" y="246" width="200" height="38" rx="6" class="fg-b hot"/><text x="560" y="270" text-anchor="middle" class="fg-t acc">8¹⁵ mod 23 = 2</text>
<rect x="240" y="246" width="200" height="38" rx="6" class="fg-b"/><text x="340" y="262" text-anchor="middle" class="fg-t sm">偷聽者只有 23、5、8、19</text><text x="340" y="277" text-anchor="middle" class="fg-t sm warm">要從 8 反推出 6 才算得出 2</text>
</svg><figcaption>兩人從頭到尾沒有傳過 2，卻都算出了 2。因為 19⁶ = (5¹⁵)⁶ = 5⁹⁰ = (5⁶)¹⁵ = 8¹⁵，在 mod 23 之下兩邊相等。</figcaption></figure>
<p>偷聽的人要算出 2，得先從「5 的幾次方 mod 23 等於 8」反推出 6，這叫<b>離散對數問題</b>（discrete logarithm）。p = 23 時，試 22 次就找到了；真實系統用 2048 位元以上的 p，或改用橢圓曲線版本（ECDH，例如 X25519），反推需要大約 2¹²⁸ 次運算。</p>
<h4>它少了什麼：你在跟誰約？</h4>
<p>Diffie-Hellman 只保證「跟對面那個人約好了祕密」，不保證對面是誰。如果有人站在中間，跟小明做一次、跟小美做一次，兩邊都以為自己在跟對方講話，他在中間全部解開再轉送，這就是<b>中間人攻擊</b>（man-in-the-middle）。所以 TLS 要把兩件事接起來：伺服器用憑證裡那把公鑰對應的私鑰，<b>簽下整段交握的內容</b>，瀏覽器驗章通過，才確定剛剛跟它約好祕密的，就是憑證上那個網站。</p>
<h4>前向保密：今天的金鑰被偷，昨天的通訊還是安全的</h4>
<p>TLS 1.3 每一條連線都用全新的、臨時的 a 和 b（ephemeral，所以叫 ECDHE），算完就丟。就算有人錄下了你今天所有的加密流量，明年又偷到伺服器的私鑰，也解不開：私鑰只用來簽章，從來沒參與算出連線的金鑰，而那些臨時的 a、b 早就不在了。這叫<b>前向保密</b>（forward secrecy）。舊版 TLS 允許「用伺服器的 RSA 公鑰直接加密連線金鑰」，私鑰一外洩，過去錄下的流量全部可以解開，TLS 1.3 已經把這種方式拿掉了。</p>

<h3><span class="badge lv3">專業</span>七、簽章、憑證與信任鏈</h3>
<p>數位簽章的流程是：先對訊息算雜湊，再用私鑰對雜湊做簽章運算；驗證的人用公鑰檢查。Ed25519 的公鑰只有 32 個位元組，簽章 64 個位元組。可是公鑰本身只是一串數字，你怎麼知道「這把公鑰屬於 game.example.com」？答案是<b>憑證</b>（certificate）：一份寫著「這個名字擁有這把公鑰，效期到哪天」的文件，由一個大家信任的<b>憑證機構</b>（CA）簽章。</p>
<figure class="figure"><svg viewBox="0 0 660 252" class="fg" style="width:100%;max-width:660px" role="img" aria-label="信任鏈：網站憑證由中繼 CA 簽章，中繼 CA 由根 CA 簽章，根 CA 內建在作業系統和瀏覽器的信任清單裡">
<rect x="20" y="40" width="170" height="112" rx="8" class="fg-b alt"/>
<text x="105" y="64" text-anchor="middle" class="fg-t">網站憑證（葉）</text>
<text x="105" y="86" text-anchor="middle" class="fg-t sm mono">game.example.com</text>
<text x="105" y="106" text-anchor="middle" class="fg-t sm">網站的公鑰</text>
<text x="105" y="126" text-anchor="middle" class="fg-t sm">效期幾十到幾百天</text>
<text x="105" y="144" text-anchor="middle" class="fg-t sm warm">由中繼 CA 簽章</text>
<rect x="245" y="40" width="170" height="112" rx="8" class="fg-b"/>
<text x="330" y="64" text-anchor="middle" class="fg-t">中繼 CA</text>
<text x="330" y="86" text-anchor="middle" class="fg-t sm">日常負責簽發</text>
<text x="330" y="106" text-anchor="middle" class="fg-t sm">中繼 CA 的公鑰</text>
<text x="330" y="126" text-anchor="middle" class="fg-t sm">效期幾年</text>
<text x="330" y="144" text-anchor="middle" class="fg-t sm warm">由根 CA 簽章</text>
<rect x="458" y="28" width="194" height="172" rx="10" class="fg-l dim dash"/>
<rect x="470" y="40" width="170" height="112" rx="8" class="fg-b hot"/>
<text x="555" y="64" text-anchor="middle" class="fg-t acc">根 CA</text>
<text x="555" y="86" text-anchor="middle" class="fg-t sm">私鑰鎖在離線設備</text>
<text x="555" y="106" text-anchor="middle" class="fg-t sm">根 CA 的公鑰</text>
<text x="555" y="126" text-anchor="middle" class="fg-t sm">效期十幾二十年</text>
<text x="555" y="144" text-anchor="middle" class="fg-t sm">自己簽自己</text>
<text x="555" y="174" text-anchor="middle" class="fg-t sm">內建在作業系統、</text>
<text x="555" y="190" text-anchor="middle" class="fg-t sm">瀏覽器的信任清單</text>
<line x1="190" y1="96" x2="237" y2="96" class="fg-l on"/><polygon points="245,96 237,91.5 237,100.5" class="fg-a on"/>
<text x="217" y="88" text-anchor="middle" class="fg-t sm acc">驗章</text>
<line x1="415" y1="96" x2="462" y2="96" class="fg-l on"/><polygon points="470,96 462,91.5 462,100.5" class="fg-a on"/>
<text x="436" y="88" text-anchor="middle" class="fg-t sm acc">驗章</text>
<path d="M20 208 V216 H415 V208" class="fg-l"/>
<text x="217" y="238" text-anchor="middle" class="fg-t sm">伺服器在 TLS 交握時送出這兩張</text>
<path d="M470 208 V216 H640 V208" class="fg-l"/>
<text x="555" y="238" text-anchor="middle" class="fg-t sm">用戶端本來就有</text>
</svg><figcaption>瀏覽器從網站憑證開始，用上一層的公鑰驗下一層的簽章，一路驗到一張它本來就信任的根憑證。任何一環驗不過，整條鏈就不算數。</figcaption></figure>
<p>瀏覽器收到憑證後，至少會檢查：每一層的簽章都驗得過、最後接到信任清單裡的根；每一張都在效期內；網址跟憑證裡的名字（SAN 欄位）相符；這張憑證的用途允許拿來當網站憑證。第 1.5 課講的憑證過期、名字不符，就是這幾項其中一項沒過。</p>
<h4>維運上最常見的坑：少送了中繼憑證</h4>
<p>伺服器應該送「葉憑證＋中繼憑證」。如果只設定了葉憑證，瀏覽器常常還是能連：有些瀏覽器會自己補抓或快取了中繼憑證。但 Node.js、Go、curl 這類程式不會幫你補，於是出現「瀏覽器打得開，後端呼叫卻失敗」，Node.js 的錯誤訊息是 <code>unable to verify the first certificate</code>。用 <code>openssl s_client -connect 網址:443 -showcerts</code> 看伺服器實際送出了幾張，就能確認。正確的修法是設定完整的憑證鏈檔案，<b>絕對不是</b>把驗證關掉。</p>
<h4>信任出事的時候</h4>
<ul>
<li><b>2011 年 DigiNotar</b>：這家荷蘭憑證機構被入侵，攻擊者簽出了 google.com 等網站的假憑證，用來監聽使用者。結果它被所有瀏覽器移出信任清單，公司隨即破產。整個系統的強度，取決於信任清單裡最弱的那一家。</li>
<li><b>憑證透明化</b>（Certificate Transparency）：為了讓偷簽無所遁形，現在公開信任的憑證都必須寫進公開的紀錄裡，Chrome 不接受沒寫進紀錄的憑證。你可以到 crt.sh 搜尋自己的網域，看看有沒有你不知道的憑證被簽出來。</li>
<li><b>效期越來越短</b>：Let's Encrypt 的憑證只有 90 天。2025 年 CA/瀏覽器論壇通過決議，公開憑證的最長效期要分階段縮短，2026 年 3 月起是 200 天，到 2029 年要縮到 47 天。手動更新憑證的時代結束了，自動化是唯一的路。</li>
</ul>
<h4>簽章也會被「用壞」</h4>
<p>ECDSA 每次簽章都需要一個全新、保密的隨機數 k。2010 年有人發現 PS3 的韌體簽章每次都用同一個 k，從兩個簽章就算出了 Sony 的私鑰；2013 年 Android 上一個亂數產生器的錯誤，讓一些比特幣錢包重複用了 k，錢被偷走。Ed25519 和照 RFC 6979 實作的 ECDSA 改成由私鑰和訊息「算出」k，不再依賴亂數，這一類錯誤就不會發生。</p>

<h3><span class="badge lv4">專家</span>八、密碼怎麼存：加鹽、要慢、還要吃記憶體</h3>
<p>資料庫外洩時，攻擊者拿到的是每個使用者的雜湊值。他的做法很單純：猜一個密碼、算雜湊、比對，一直重複。所以防守的目標不是「讓雜湊算不出來」，而是<b>讓每一次猜測都很貴</b>。算一筆帳：</p>
<table>
<tr><th>情境</th><th>每秒能猜幾次（量級）</th><th>8 碼小寫字母加數字，全部試完</th></tr>
<tr><td>SHA-256，一張高階顯示卡</td><td>約 100 億次</td><td>36⁸ ≈ 2.8 × 10¹² 次，大約 5 分鐘</td></tr>
<tr><td>argon2id（19 MiB、2 輪），攻擊者一整台機器</td><td>約 1,000 次</td><td>大約 89 年</td></tr>
</table>
<p>同一個密碼，差別只在你選的雜湊函式。SHA-256 被設計成越快越好，這對檔案指紋是優點，對密碼是災難。<b>argon2id</b>（2015 年密碼雜湊競賽的冠軍）可以調整三個參數：要用多少記憶體、算幾輪、用幾條執行緒。記憶體這一項特別關鍵：顯示卡有上萬個運算單元，但每個單元分到的記憶體很少；每次猜測都要 19 MiB，就沒辦法同時猜上萬個。</p>
<figure class="figure"><svg viewBox="0 0 680 248" class="fg" style="width:100%;max-width:680px" role="img" aria-label="兩個使用者用同一個密碼，各自配上不同的隨機鹽，經過 argon2id 之後得到完全不同的結果；下方拆解儲存字串的五個欄位">
<rect x="20" y="24" width="140" height="36" rx="6" class="fg-b"/><text x="90" y="47" text-anchor="middle" class="fg-t">小明：hunter2</text>
<rect x="20" y="84" width="140" height="36" rx="6" class="fg-b"/><text x="90" y="107" text-anchor="middle" class="fg-t">小美：hunter2</text>
<rect x="190" y="24" width="110" height="36" rx="6" class="fg-b warm"/><text x="245" y="47" text-anchor="middle" class="fg-t mono">鹽 Q9f2…</text>
<rect x="190" y="84" width="110" height="36" rx="6" class="fg-b warm"/><text x="245" y="107" text-anchor="middle" class="fg-t mono">鹽 7Lrc…</text>
<line x1="160" y1="42" x2="182" y2="42" class="fg-l"/><polygon points="190,42 182,37.5 182,46.5" class="fg-a"/>
<line x1="160" y1="102" x2="182" y2="102" class="fg-l"/><polygon points="190,102 182,97.5 182,106.5" class="fg-a"/>
<rect x="330" y="24" width="140" height="96" rx="8" class="fg-b hot"/><text x="400" y="64" text-anchor="middle" class="fg-t acc">argon2id</text><text x="400" y="84" text-anchor="middle" class="fg-t sm">19 MiB、算 2 輪</text>
<line x1="300" y1="42" x2="322" y2="42" class="fg-l"/><polygon points="330,42 322,37.5 322,46.5" class="fg-a"/>
<line x1="300" y1="102" x2="322" y2="102" class="fg-l"/><polygon points="330,102 322,97.5 322,106.5" class="fg-a"/>
<line x1="470" y1="42" x2="492" y2="42" class="fg-l alt"/><polygon points="500,42 492,37.5 492,46.5" class="fg-a alt"/>
<line x1="470" y1="102" x2="492" y2="102" class="fg-l alt"/><polygon points="500,102 492,97.5 492,106.5" class="fg-a alt"/>
<rect x="500" y="24" width="160" height="36" rx="6" class="fg-b alt"/><text x="580" y="47" text-anchor="middle" class="fg-t mono">Xk8pR2…</text>
<rect x="500" y="84" width="160" height="36" rx="6" class="fg-b alt"/><text x="580" y="107" text-anchor="middle" class="fg-t mono">Mz0aV7…</text>
<text x="340" y="150" text-anchor="middle" class="fg-t sm">資料庫裡存的一整串（每個欄位用 $ 隔開）：</text>
<rect x="38" y="162" width="100" height="30" rx="5" class="fg-b"/><text x="88" y="182" text-anchor="middle" class="fg-t mono">$argon2id</text>
<rect x="144" y="162" width="70" height="30" rx="5" class="fg-b"/><text x="179" y="182" text-anchor="middle" class="fg-t mono">$v=19</text>
<rect x="220" y="162" width="190" height="30" rx="5" class="fg-b hot"/><text x="315" y="182" text-anchor="middle" class="fg-t mono">$m=19456,t=2,p=1</text>
<rect x="416" y="162" width="110" height="30" rx="5" class="fg-b warm"/><text x="471" y="182" text-anchor="middle" class="fg-t mono">$Q9f2…</text>
<rect x="532" y="162" width="110" height="30" rx="5" class="fg-b alt"/><text x="587" y="182" text-anchor="middle" class="fg-t mono">$Xk8pR2…</text>
<text x="88" y="214" text-anchor="middle" class="fg-t sm">演算法</text>
<text x="179" y="214" text-anchor="middle" class="fg-t sm">版本</text>
<text x="315" y="214" text-anchor="middle" class="fg-t sm">記憶體 KiB、輪數、平行度</text>
<text x="471" y="214" text-anchor="middle" class="fg-t sm">鹽（隨機）</text>
<text x="587" y="214" text-anchor="middle" class="fg-t sm">雜湊結果</text>
<text x="340" y="238" text-anchor="middle" class="fg-t sm">參數跟著結果存，所以以後調高參數時，舊的雜湊照樣驗得過</text>
</svg><figcaption>同一個密碼，配上不同的鹽，結果完全不同。攻擊者不能一次算好、套用到所有人身上，只能一個帳號一個帳號地慢慢猜。</figcaption></figure>
<p><b>鹽</b>（salt）是每個使用者各自一段隨機值，跟雜湊存在一起，不需要保密。它解決兩件事：一、兩個人用同一個密碼，雜湊不會一樣，攻擊者看不出誰跟誰同密碼；二、事先算好的「密碼 → 雜湊」大表（彩虹表，rainbow table）完全派不上用場。2012 年 LinkedIn 外洩的幾百萬筆密碼，用的是沒加鹽的 SHA-1，大部分在幾天內就被還原。鹽沒解決的是「慢」：單一帳號被針對時，攻擊者還是可以全速猜，所以一定要配上慢的演算法。</p>
<p>實務設定（OWASP 的建議）：argon2id，記憶體至少 19 MiB、2 輪、1 條執行緒；不能用 argon2 時用 bcrypt（成本參數至少 10，注意它只看密碼的前 72 個位元組）；有 FIPS 法規要求時用 PBKDF2-HMAC-SHA256，至少 60 萬輪。用 Node.js 的 <code>argon2</code> 套件：</p>
<pre><code>const argon2 = require('argon2');
const opts = {
  type: argon2.argon2id,
  memoryCost: 19456,   // KiB，也就是 19 MiB
  timeCost: 2,
  parallelism: 1,
};

// 註冊：鹽自動產生，整串存進資料庫
const stored = await argon2.hash(password, opts);

// 登入：驗證；參數調高過的話，趁這時候升級
const ok = await argon2.verify(stored, attempt);
if (ok &amp;&amp; argon2.needsRehash(stored, opts)) {
  await saveHash(userId, await argon2.hash(attempt, opts));
}</code></pre>
<p>再進一步可以加<b>胡椒</b>（pepper）：一把存在祕密管理服務裡、不跟資料庫放在一起的金鑰，用 HMAC 先處理密碼再雜湊。資料庫單獨外洩時，攻擊者連猜都沒辦法開始猜。</p>

<h3><span class="badge lv4">專家</span>九、亂數：可以被預測，就等於沒有加密</h3>
<p>金鑰、nonce、鹽、session ID、重設密碼的權杖、洗牌的結果，全部建立在「別人猜不到」上。一般程式語言的亂數（JavaScript 的 <code>Math.random</code>、Go 的 <code>math/rand</code>）是為了速度和統計上的均勻設計的，不是為了猜不到：V8 的 <code>Math.random</code> 用的是 xorshift128+，只要拿到幾個連續的輸出，就能推回它的內部狀態，預測之後的每一個值。</p>
<p>安全的亂數來自作業系統：Linux 核心從硬體事件收集熵（entropy），透過 <code>getrandom()</code> 和 <code>/dev/urandom</code> 提供。你用的是它的包裝：Node.js 的 <code>crypto.randomBytes</code>、<code>crypto.randomInt</code>、<code>crypto.randomUUID</code>，瀏覽器的 <code>crypto.getRandomValues</code>，Go 的 <code>crypto/rand</code>。歷史上這裡出過兩次大事：2008 年 Debian 的一個修改不小心拿掉了 OpenSSL 的熵來源，幾乎只剩行程 ID，結果那兩年產生的 SSH 和 SSL 金鑰只有大約三萬多種，全部可以列舉；2013 年 Android 的亂數錯誤，就是第七節提過、比特幣被偷的那一次。</p>
<h4>就算來源安全，也可能用歪</h4>
<p>要從 52 張牌抽一張，常見寫法是 <code>randomBytes(1)[0] % 52</code>。一個位元組有 256 種值，256 = 4 × 52 + 48，所以餘數 0 到 47 各有 5 種情況、48 到 51 只有 4 種：前 48 張牌比最後 4 張<b>多出 25% 的機率</b>。這叫取模偏差（modulo bias）。<code>crypto.randomInt</code> 內部會丟掉造成偏差的值再重抽，所以直接用它。洗整副牌用 Fisher-Yates：</p>
<pre><code>const { randomInt } = require('crypto');
function shuffle(deck) {
  for (let i = deck.length - 1; i &gt; 0; i--) {
    const j = randomInt(0, i + 1);   // 0 到 i，機率平均
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}</code></pre>
<p>另一個常見的錯誤寫法是 <code>deck.sort(() =&gt; Math.random() - 0.5)</code>：亂數不安全之外，排序演算法本來就不是為這種用法設計的，洗出來的結果也不平均。</p>

<h3><span class="badge lv4">專家</span>十、開發者最常犯的錯</h3>
<table>
<tr><th>錯誤</th><th>會怎樣</th><th>正確做法</th></tr>
<tr><td>把 Base64 當加密</td><td>任何人一行指令就還原</td><td>Base64 只是編碼，要保密就用 AEAD 加密</td></tr>
<tr><td>金鑰寫在程式碼或前端打包檔裡</td><td>拿得到程式的人就拿得到金鑰，而且無法更換</td><td>祕密放祕密管理服務（第 5.4 課）；前端永遠不放祕密</td></tr>
<tr><td>用 <code>===</code> 比對 HMAC 或權杖</td><td>比對時間會洩漏「前面幾個字元對了」</td><td><code>crypto.timingSafeEqual</code> 這類固定時間比較</td></tr>
<tr><td>JWT 接受權杖自己宣稱的演算法</td><td><code>alg: none</code>，或把公鑰當 HMAC 金鑰，都能偽造權杖</td><td>伺服器端寫死允許的演算法</td></tr>
<tr><td>憑證錯誤就關掉驗證（<code>rejectUnauthorized: false</code>、<code>InsecureSkipVerify</code>）</td><td>中間人攻擊完全不設防，而且常被忘在正式環境</td><td>修好憑證鏈；測試環境用自己的 CA 並加進信任清單</td></tr>
<tr><td>只加密、不驗證（CBC 不加 MAC）</td><td>密文可被竄改，可能遭受 padding oracle</td><td>一律用 AEAD：AES-GCM 或 ChaCha20-Poly1305</td></tr>
<tr><td><code>SHA-256(祕密 ‖ 訊息)</code> 當驗證碼</td><td>長度延伸攻擊</td><td>HMAC-SHA256</td></tr>
<tr><td>一把金鑰到處用，從來不換</td><td>一個地方外洩，所有地方一起淪陷</td><td>不同用途不同金鑰，事先設計好輪替流程</td></tr>
</table>

<h3>十一、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>雜湊是一種加密</td><td>加密可以用金鑰解回來，雜湊沒有金鑰、也解不回來。兩者用途完全不同。</td></tr>
<tr><td>MD5 被破解了，所以 MD5 值可以反推回原文</td><td>被破的是抗碰撞性。反推原文至今仍不實際；但這不是繼續用它的理由。</td></tr>
<tr><td>AES-256 一定安全</td><td>演算法沒問題，但 ECB 模式、重複的 nonce、沒有驗證，都能讓它形同虛設。</td></tr>
<tr><td>HTTPS 用公鑰加密所有資料</td><td>公開金鑰只用在一開始：驗明身分、約出金鑰。資料本身用對稱的 AEAD 加密。</td></tr>
<tr><td>有加鹽，用 SHA-256 存密碼就夠了</td><td>鹽擋的是大表和一次攻擊所有人；SHA-256 太快，單一帳號照樣被秒破。要用 argon2id、bcrypt 這類慢雜湊。</td></tr>
<tr><td>簽章能證明訊息是什麼時候簽的</td><td>簽章只證明來源和完整性。要證明時間，得另外加時間戳記服務。</td></tr>
<tr><td>UUID 都可以當安全權杖</td><td>只有用安全亂數產生的 v4 UUID（例如 <code>crypto.randomUUID</code>）才猜不到；以時間為基礎的版本可以被推算。</td></tr>
</table>

<h3>十二、跟你的工作連起來</h3>
<ul>
<li><b>前端（Vue、TypeScript）</b>：瀏覽器的 Web Crypto API（<code>crypto.subtle</code>）可以做雜湊、簽章驗證、AES-GCM，但前端永遠藏不住祕密，任何寫在打包檔裡的金鑰都等於公開。產生 ID 用 <code>crypto.randomUUID()</code>，不要用 <code>Math.random</code>。</li>
<li><b>遊戲（Cocos、Unity）</b>：洗牌和掉寶一定在伺服器上、用安全亂數做；公平性可以用「先公布種子的雜湊、事後揭露種子」讓玩家自己驗證。用戶端送來的任何資料都要驗章或驗 HMAC，不能相信。</li>
<li><b>後端（Node.js、Go）</b>：密碼用 argon2id；Webhook 用 HMAC 驗證並用固定時間比較；需要加密欄位時用 AES-GCM，nonce 每次隨機產生；JWT 寫死演算法。對外呼叫遇到憑證錯誤，修憑證鏈，不要關驗證。</li>
<li><b>Docker 與雲端伺服器</b>：映像檔用摘要（<code>sha256:…</code>）鎖定版本，內容就不會被偷換；憑證交給自動續期的機制；SSH 金鑰用 Ed25519；金鑰交給雲端的金鑰管理服務，由它負責保管和輪替。</li>
</ul>

<h3>十三、面試會怎麼問</h3>
<p>這幾題在後端、資安、DevOps 面試裡都很常見。先自己講一遍，再看參考答案。</p>
<ol>
<li>「雜湊、加密、編碼差在哪裡？各舉一個用途。」</li>
<li>「為什麼密碼不能用 SHA-256 存？鹽解決了什麼、沒解決什麼？」</li>
<li>「AES-GCM 的 nonce 重複使用會發生什麼事？你會怎麼避免？」</li>
<li>「HTTPS 連線建立時，瀏覽器怎麼確定對面真的是那個網站，又怎麼跟它約出加密金鑰？」</li>
<li>「什麼是前向保密？TLS 1.3 怎麼做到的？」</li>
<li>「HMAC 和數位簽章差在哪裡？Webhook 驗證該用哪一個？比對時要注意什麼？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>編碼（Base64、UTF-8）只是換一種表示方式，沒有祕密，誰都能轉回來，用來安全地傳輸資料。加密用金鑰把資料變成密文，有金鑰才能還原，用來保密，例如 AES-GCM 加密資料庫欄位。雜湊是單向的，沒有金鑰、也無法還原，用來驗證完整性和做指紋，例如下載檔案的 SHA-256 校驗、Docker 映像檔摘要；加上慢演算法和鹽，就用來存密碼。</li>
<li>SHA-256 是為了快而設計的，一張顯示卡每秒能算上百億次，攻擊者拿到雜湊後可以極快地暴力猜測常見密碼。鹽讓每個使用者的雜湊都不同，擋住彩虹表，也讓攻擊者無法一次攻擊所有人、看不出誰跟誰同密碼；但鹽不會讓單一帳號變難猜。所以要用故意變慢、而且吃記憶體的 argon2id（或 bcrypt、scrypt），讓每次猜測都昂貴，並視情況加上存在別處的胡椒。</li>
<li>GCM 的金鑰流只由金鑰和 nonce 決定，重複使用會產生相同的金鑰流，兩段密文 XOR 後等於兩段明文 XOR，攻擊者猜到其中一段就能解出另一段；而且會洩漏 GHASH 的驗證金鑰，攻擊者從此能偽造驗證標籤。避免方法：每次用安全亂數產生 96 位元 nonce，並在一把金鑰加密約 2³² 次前更換金鑰；或用保證不重複的計數器；或改用 XChaCha20-Poly1305、AES-GCM-SIV 這類對 nonce 誤用較寬容的設計；最好用高階函式庫替你管理。</li>
<li>伺服器送出憑證鏈，瀏覽器逐層驗章到內建信任清單的根憑證，並檢查效期、網址與 SAN 相符、用途正確、憑證透明化紀錄。金鑰部分：雙方各產生臨時的 ECDHE 金鑰對（例如 X25519，現在常混合 ML-KEM），交換公開的部分，各自算出相同的共享祕密，再推導出對稱金鑰；伺服器用憑證對應的私鑰簽下整段交握內容，證明約金鑰的對象就是憑證上的網站，擋掉中間人。之後的資料用 AES-GCM 或 ChaCha20-Poly1305 加密。</li>
<li>前向保密是指：就算伺服器的長期私鑰日後外洩，過去錄下來的連線也解不開。TLS 1.3 規定金鑰交換一律使用臨時的（EC）DHE，每條連線用新的金鑰對、用完即丟；伺服器的長期私鑰只用來簽章，不參與算出連線金鑰。舊版 TLS 的 RSA 金鑰傳輸方式沒有這個性質，已經在 TLS 1.3 移除。</li>
<li>HMAC 用雙方共用的祕密金鑰，擁有金鑰的人都能產生和驗證，所以只能證明「是知道這把金鑰的某一方發的」；數位簽章用私鑰簽、公鑰驗，任何人都能驗證，只有私鑰持有人能簽，可以對第三方證明來源。Webhook 通常是兩方之間的通知，用 HMAC-SHA256 就夠了：對原始的請求內容（不是解析後再序列化的 JSON）計算 HMAC，用固定時間比較（例如 <code>crypto.timingSafeEqual</code>）跟標頭裡的值比對，並檢查時間戳記、拒絕太舊的請求，防止重放。</li>
</ol>
</details>

<h3>十四、練功題（做得出來才算真的懂）</h3>
<ol>
<li>用手算一次 Diffie-Hellman：p = 23、g = 5，小明的祕密是 4、小美的祕密是 3。兩人各送出什麼數字？最後的共享祕密是多少？</li>
<li>你攔截到同一把金鑰、同一個 nonce 加密的兩個位元組，兩者 XOR 的結果是 <code>00000100</code>。你知道第一個是「H」（<code>01001000</code>），第二個是什麼？</li>
<li>一個只用小寫英文字母的 10 碼密碼。如果系統用 SHA-256 存（每秒 100 億次），全部試完要多久？如果用 argon2id（每秒 1,000 次）呢？</li>
<li>如果用 <code>randomBytes(1)[0] % 6</code> 擲骰子，哪些點數比較容易出現？多容易？</li>
<li>找出下面這段程式的所有問題：
<pre><code>const key = crypto.createHash('sha256').update('my-secret-123').digest();
const iv = Buffer.alloc(12);   // 12 個 0
const c = crypto.createCipheriv('aes-256-gcm', key, iv);
const out = Buffer.concat([c.update(data), c.final()]).toString('base64');</code></pre></li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>小明送出 5⁴ mod 23 = 625 mod 23 = 4；小美送出 5³ mod 23 = 125 mod 23 = 10。小明算 10⁴ mod 23 = 10000 mod 23 = 18；小美算 4³ mod 23 = 64 mod 23 = 18。共享祕密是 18。</li>
<li>第二個 = <code>00000100</code> ⊕ <code>01001000</code> = <code>01001100</code>，也就是「L」。金鑰流在 XOR 時互相抵消，你完全不需要知道金鑰。</li>
<li>26¹⁰ ≈ 1.4 × 10¹⁴ 種。SHA-256：1.4 × 10¹⁴ ÷ 10¹⁰ ≈ 14,000 秒，大約 4 小時。argon2id：1.4 × 10¹⁴ ÷ 1,000 ≈ 1.4 × 10¹¹ 秒，大約 4,500 年。同樣的密碼，差別全在雜湊的選擇（以及密碼本身夠不夠長）。</li>
<li>256 = 42 × 6 + 4。餘數 0、1、2、3 各有 43 種情況，4、5 只有 42 種。所以骰出 1 到 4 點（對應餘數 0 到 3）的機率是 43/256，5、6 點是 42/256，前四個點數多出約 2.4%。差距看起來小，但在大量重複的遊戲裡會被統計出來。用 <code>crypto.randomInt(1, 7)</code>。</li>
<li>問題至少五個：一、金鑰由一個寫死在程式裡的短字串用單純 SHA-256 推出來，等於金鑰就在程式碼裡，而且很容易被暴力猜；應該用安全亂數產生金鑰，存在祕密管理服務。二、nonce 固定為 0，每次加密都重複，GCM 直接崩潰；每次要用 <code>randomBytes(12)</code>。三、沒有呼叫 <code>getAuthTag()</code> 保存驗證標籤，解密時無法驗證，等於放棄了 GCM 的驗證功能。四、輸出沒有附上 nonce，解密方不知道用哪個 nonce。五、Base64 只是編碼，沒有問題，但不要誤以為它增加了任何安全性。</li>
</ol>
</details>

<h3>十五、想再挖深</h3>
<ul>
<li><b>Dan Boneh《Cryptography I》</b>（Coursera，Stanford 大學）：最有名的免費密碼學入門課，模式、MAC、金鑰交換、公開金鑰都講得清楚又嚴謹。</li>
<li><b>Jean-Philippe Aumasson《Serious Cryptography》</b>：寫給工程師的密碼學書，數學少、實務多，每一章都有「這樣用會出事」的段落。</li>
<li><b>The Cryptopals Crypto Challenges</b>（<a href="https://cryptopals.com/">cryptopals.com</a>）：一系列親手破解錯誤用法的練習，包括 ECB 偵測、CBC padding oracle、nonce 重複，做完你就再也不會犯這些錯。</li>
<li><b>OWASP Password Storage Cheat Sheet</b>（<a href="https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html">cheatsheetseries.owasp.org</a>）：密碼雜湊參數的業界標準答案，會隨時間更新。</li>
<li><b>The Illustrated TLS 1.3 Connection</b>（<a href="https://tls13.xargs.org/">tls13.xargs.org</a>）：把一條真實的 TLS 1.3 連線逐位元組拆開，金鑰交換、憑證、簽章在封包裡長什麼樣子都看得到。</li>
</ul>
` });
