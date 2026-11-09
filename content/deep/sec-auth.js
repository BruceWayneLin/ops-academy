DEEP({ 'sec-auth': `
<p>上一課講了密碼怎麼存、帳號怎麼被盜、MFA 的強弱和 cookie 的三個旗標。這一章從頭到尾設計一套登入系統：註冊時的密碼規則該照誰的標準、登入要怎麼限速才不會反過來害到使用者、各種 MFA 為什麼有的擋得住釣魚有的擋不住、通行金鑰（passkey）在背後到底交換了什麼、工作階段和 token 怎麼輪替和撤銷、「使用 Google 登入」的 OAuth 流程每一步在防什麼，最後是最常被忽略的那扇門：帳號復原。密碼雜湊的細節（argon2id、鹽、胡椒）在第 0.15 課，cookie 每個屬性的細節在第 0.12 課，這裡不重複，直接往上蓋。</p>

<h3><span class="badge lv1">基礎</span>一、身分驗證是一連串的交接</h3>
<p>想像你住飯店。櫃台看你的證件（<b>身分驗證</b>，authentication），給你一張房卡（<b>工作階段</b>，session）。之後你每次刷卡，門只看房卡，不會再看證件；房卡只開你的房間和健身房（<b>授權</b>，authorization）。退房時，櫃台在系統裡讓房卡失效（<b>撤銷</b>，revocation）。房卡弄丟了，你去櫃台補一張，這就是<b>帳號復原</b>（account recovery）。</p>
<p>這個比喻點出一件很重要的事：<b>整條鏈的強度，等於最弱的那一環</b>。證件查得再嚴，如果補房卡時只要報房號就給，前面的嚴格就白費了。</p>
<figure class="figure"><svg viewBox="0 0 680 230" class="fg" style="width:100%;max-width:680px" role="img" aria-label="身分驗證的生命週期：註冊、登入、發工作階段、每個請求的驗證與授權、登出撤銷；帳號復原是一條繞過登入、直接拿到工作階段的虛線">
<text x="470" y="30" text-anchor="middle" class="fg-t sm acc">閒置逾時、定期輪替</text>
<path d="M440 70 V44 H500 V62" class="fg-l on"/><polygon points="500,70 495.5,62 504.5,62" class="fg-a on"/>
<rect x="10" y="70" width="110" height="50" rx="6" class="fg-b"/><text x="65" y="92" text-anchor="middle" class="fg-t">註冊</text><text x="65" y="110" text-anchor="middle" class="fg-t sm">建立憑證</text>
<rect x="145" y="70" width="110" height="50" rx="6" class="fg-b alt"/><text x="200" y="92" text-anchor="middle" class="fg-t">登入</text><text x="200" y="110" text-anchor="middle" class="fg-t sm">密碼＋第二道</text>
<rect x="280" y="70" width="110" height="50" rx="6" class="fg-b hot"/><text x="335" y="92" text-anchor="middle" class="fg-t">發工作階段</text><text x="335" y="110" text-anchor="middle" class="fg-t sm">新的隨機 ID</text>
<rect x="415" y="70" width="110" height="50" rx="6" class="fg-b alt"/><text x="470" y="92" text-anchor="middle" class="fg-t">每個請求</text><text x="470" y="110" text-anchor="middle" class="fg-t sm">驗證＋授權</text>
<rect x="550" y="70" width="120" height="50" rx="6" class="fg-b"/><text x="610" y="92" text-anchor="middle" class="fg-t">登出、撤銷</text><text x="610" y="110" text-anchor="middle" class="fg-t sm">伺服器端失效</text>
<line x1="120" y1="95" x2="137" y2="95" class="fg-l"/><polygon points="145,95 137,90.5 137,99.5" class="fg-a"/>
<line x1="255" y1="95" x2="272" y2="95" class="fg-l"/><polygon points="280,95 272,90.5 272,99.5" class="fg-a"/>
<line x1="390" y1="95" x2="407" y2="95" class="fg-l"/><polygon points="415,95 407,90.5 407,99.5" class="fg-a"/>
<line x1="525" y1="95" x2="542" y2="95" class="fg-l"/><polygon points="550,95 542,90.5 542,99.5" class="fg-a"/>
<text x="200" y="142" text-anchor="middle" class="fg-t sm">身分驗證（authN）</text>
<text x="470" y="142" text-anchor="middle" class="fg-t sm">授權（authZ）</text>
<rect x="145" y="168" width="110" height="50" rx="6" class="fg-b warm"/><text x="200" y="190" text-anchor="middle" class="fg-t">帳號復原</text><text x="200" y="208" text-anchor="middle" class="fg-t sm">常是最弱的門</text>
<path d="M255 193 H335 V128" class="fg-l warm dash"/><polygon points="335,120 330.5,128 339.5,128" class="fg-a warm"/>
<text x="347" y="190" class="fg-t sm warm">等於另一個登入入口</text>
</svg><figcaption>正常的路是上面那一排。帳號復原是一條繞過登入、直接拿到工作階段的路，所以它的強度要跟登入一樣，否則攻擊者只會走它。</figcaption></figure>

<h3><span class="badge lv1">基礎</span>二、註冊與密碼規則：照 NIST SP 800-63B</h3>
<p>很多網站的密碼規則還停在「要有大寫、數字、符號，每 90 天換一次」。美國國家標準與技術研究院（NIST）的數位身分指引 SP 800-63B 早就說這些規則弊大於利：人被逼著加符號，就會寫出 <code>Password1!</code> 這種好猜的東西；被逼著定期換，就只是把最後一個數字加 1。2025 年定稿的第 4 版（SP 800-63B-4）的重點整理如下：</p>
<table>
<tr><th>規則</th><th>NIST 的立場</th><th>為什麼</th></tr>
<tr><td>最短長度</td><td>只靠密碼登入時至少 15 個字元；搭配多因素時至少 8 個</td><td>長度是最有效的強度來源</td></tr>
<tr><td>最長長度</td><td>至少允許 64 個字元，而且整串都要驗證，不能截斷</td><td>讓人能用整句話或密碼管理器產生的長字串</td></tr>
<tr><td>組成規則（一定要有大寫、符號）</td><td>不可以要求</td><td>只會產生好猜的固定模式</td></tr>
<tr><td>定期強制更換</td><td>不可以要求；只有在有外洩證據時才強制換</td><td>定期換只會讓密碼越換越弱</td></tr>
<tr><td>封鎖清單</td><td>必須比對：外洩過的、字典裡的、跟服務名稱或帳號有關的</td><td>擋掉攻擊者最先試的那一批</td></tr>
<tr><td>安全提示問題、密碼提示</td><td>不可以用</td><td>答案常常查得到、猜得到</td></tr>
<tr><td>貼上、密碼管理器</td><td>要允許</td><td>密碼管理器是讓人用強密碼最實際的方法</td></tr>
<tr><td>可用的字元</td><td>空白和 Unicode 都要接受</td><td>中文的一句話也可以是好密碼</td></tr>
</table>
<p>Unicode 要注意一件事：同一個字在不同輸入法下可能是不同的位元組序列，雜湊之前要先做 Unicode 正規化（NFKC 或 NFC，全系統統一一種），否則使用者換一台電腦就登入不了。</p>
<h4>不送出密碼，也能查它有沒有外洩過：k-匿名</h4>
<p>「拒絕外洩過的密碼」需要一份大清單。最常用的是 Have I Been Pwned 的 Pwned Passwords，收錄了數億筆外洩過的密碼。問題是：你不能把使用者的密碼送給別人去查。它的解法叫 <b>k-匿名</b>（k-anonymity）：</p>
<figure class="figure"><svg viewBox="0 0 680 230" class="fg" style="width:100%;max-width:680px" role="img" aria-label="伺服器算出密碼的 SHA-1，只把前五碼送給 Pwned Passwords，對方回傳所有前五碼相同的後綴，伺服器在本機比對剩下的 35 碼">
<rect x="20" y="40" width="250" height="150" rx="8" class="fg-b hot"/>
<text x="145" y="64" text-anchor="middle" class="fg-t acc">你的伺服器</text>
<text x="36" y="88" class="fg-t sm">1 算新密碼的 SHA-1</text>
<text x="36" y="108" class="fg-t sm mono">5BAA6 1E4C9B93F3F0…</text>
<text x="36" y="152" class="fg-t sm">3 在本機比對後 35 碼</text>
<text x="36" y="172" class="fg-t sm">比對到就拒絕這個密碼</text>
<rect x="430" y="40" width="230" height="150" rx="8" class="fg-b alt"/>
<text x="545" y="64" text-anchor="middle" class="fg-t alt">Pwned Passwords</text>
<text x="545" y="96" text-anchor="middle" class="fg-t sm">找出前 5 碼相同的</text>
<text x="545" y="116" text-anchor="middle" class="fg-t sm">全部後綴和出現次數</text>
<text x="545" y="160" text-anchor="middle" class="fg-t sm">它不知道你要查哪一筆</text>
<line x1="270" y1="94" x2="422" y2="94" class="fg-l on"/><polygon points="430,94 422,89.5 422,98.5" class="fg-a on"/>
<text x="350" y="86" text-anchor="middle" class="fg-t sm acc">2 只送前 5 碼：5BAA6</text>
<line x1="430" y1="140" x2="278" y2="140" class="fg-l alt"/><polygon points="270,140 278,135.5 278,144.5" class="fg-a alt"/>
<text x="350" y="132" text-anchor="middle" class="fg-t sm alt">回傳幾百筆後綴</text>
<text x="340" y="216" text-anchor="middle" class="fg-t sm">密碼本身、甚至完整的雜湊，都不會離開你的伺服器</text>
</svg><figcaption>例子是 password 這個密碼，它的 SHA-1 開頭是 5BAA6。同樣開頭的雜湊有好幾百個，對方只知道「你查的是其中一個」，比對在你這邊完成。這裡的 SHA-1 只拿來查表，存密碼還是要用 argon2id。</figcaption></figure>
<p>不想依賴外部服務，也可以把整份雜湊清單下載到自己的機器上，定期更新。</p>
<h4>註冊流程的其他細節</h4>
<ul>
<li><b>不要透露帳號存不存在</b>：「這個 email 已經註冊過」會讓別人拿一份 email 清單來比對誰是你的使用者。改成一律回「我們已經寄信到這個信箱，請照信中的步驟繼續」，已經註冊過的人收到的信改成「你已經有帳號，要不要重設密碼」。</li>
<li><b>驗證 email</b>：信裡的連結帶一次性、有效期限短的 token，驗證前不開放碰錢的功能。</li>
<li><b>註冊也要限速</b>：大量註冊常被拿來洗紅利或發垃圾訊息。</li>
<li><b>存密碼</b>：argon2id 加鹽、可以再加胡椒，細節見第 0.15 課。</li>
</ul>

<h3><span class="badge lv2">進階</span>三、登入流程：限速與鎖定的取捨</h3>
<p>登入端點是整個系統被打最多次的地方。最常見的是<b>撞庫</b>（credential stuffing）：拿別處外洩的帳密組合，大量、分散地來試。要擋它，又不能讓正常使用者被誤傷，每一種做法都有代價：</p>
<table>
<tr><th>做法</th><th>擋得住什麼</th><th>副作用</th></tr>
<tr><td>失敗 N 次就鎖帳號</td><td>針對單一帳號一直猜</td><td>任何人都能故意把別人的帳號鎖住；鎖定訊息還會透露帳號存在</td></tr>
<tr><td>每次失敗，等待時間加倍</td><td>針對單一帳號一直猜</td><td>對「每個帳號只試一兩次」的撞庫沒什麼用</td></tr>
<tr><td>依來源位址限速</td><td>單一來源的大量嘗試</td><td>公司、學校、行動網路常常很多人共用一個位址；來源很分散時效果有限</td></tr>
<tr><td>失敗幾次後要求 CAPTCHA 或第二道驗證</td><td>自動化的大量嘗試</td><td>使用者體驗變差</td></tr>
<tr><td>拒絕外洩密碼＋MFA</td><td>撞庫的根本</td><td>要整合外部資料、推廣 MFA</td></tr>
<tr><td>新裝置或異常地點登入時通知</td><td>讓使用者自己發現</td><td>只是偵測，不是阻擋</td></tr>
</table>
<p>實務上是組合使用：<b>每個帳號、每個來源位址各有一個失敗計數器</b>，超過門檻先要求額外驗證，再嚴重才暫時拒絕；永久鎖定只留給管理員帳號這種高風險目標，而且要有安全的解鎖流程。NIST 的要求是連續失敗不能超過 100 次就要有限制，這是上限，多數系統會設得低很多。</p>
<pre><code>const LIMIT = { acct: 10, ip: 100 };   // 15 分鐘內的失敗次數上限（示意值）

app.post('/login', async (req, res) =&gt; {
  const email = String(req.body.email).trim().toLowerCase();
  const keys = ['fail:acct:' + email, 'fail:ip:' + req.ip];
  const [a, i] = await redis.mget(keys);
  if (Number(a) &gt;= LIMIT.acct || Number(i) &gt;= LIMIT.ip) {
    return res.status(429).json({ error: '嘗試次數太多，請稍後再試' });
  }

  const user = await findUserByEmail(email);
  // 帳號不存在也照樣驗一次雜湊：兩種情況花的時間差不多，回應也一模一樣
  const ok = await argon2.verify(user?.passwordHash ?? DUMMY_HASH, String(req.body.password));
  if (!user || !ok) {
    for (const k of keys) { await redis.incr(k); await redis.expire(k, 900); }
    return res.status(401).json({ error: '帳號或密碼錯誤' });
  }
  await redis.del(keys[0]);
  // 下一步：第二道驗證。全部通過後，才換發一個新的工作階段 ID
});</code></pre>
<p>注意三個細節。第一，帳號的計數器用 email 當鍵，不管帳號存不存在都計，這樣「存在」和「不存在」的帳號行為一樣。第二，<code>DUMMY_HASH</code> 是啟動時先算好的一個假雜湊，讓「帳號不存在」也要花一次 argon2 的時間，回應時間就不會透露帳號是否存在。第三，錯誤訊息永遠是「帳號或密碼錯誤」，不分是哪一個錯。每一次成功和失敗，都寫一筆結構化日誌（帳號、來源位址、結果、原因），之後的偵測全靠它。</p>

<h3><span class="badge lv2">進階</span>四、MFA：依「擋不擋得住釣魚」排名</h3>
<p>第二道驗證的價值，不是「多一道」，而是<b>多的那一道能不能被騙走</b>。關鍵差別在：驗證的結果有沒有和「真正的網站」綁在一起。</p>
<table>
<tr><th>方式</th><th>抗釣魚</th><th>主要的問題</th></tr>
<tr><td>簡訊、語音驗證碼</td><td>否</td><td>電話號碼可能被轉移到別人的 SIM 卡；驗證碼可以被轉送</td></tr>
<tr><td>Email 驗證碼或連結</td><td>否</td><td>信箱一被盜，這一道就跟著失守</td></tr>
<tr><td>驗證器 App（TOTP）</td><td>否</td><td>驗證碼是一串誰拿到都能用的數字，不知道自己是被輸入在哪個網站</td></tr>
<tr><td>推播核准</td><td>否</td><td>連續推播讓人煩到按同意；加上「輸入畫面上的數字」後好很多</td></tr>
<tr><td>通行金鑰、硬體安全金鑰（WebAuthn）</td><td><b>是</b></td><td>要設計好裝置遺失時的復原流程</td></tr>
</table>
<p>為什麼 TOTP 擋不住釣魚？一個仿冒的登入頁可以在使用者輸入驗證碼的當下，把它即時轉交給真正的網站。驗證碼本身不知道自己被輸入到哪裡。WebAuthn 不一樣：簽章的內容包含瀏覽器親自填入的網域，在別的網域上根本簽不出對的東西。下一節會拆開看。</p>
<h4>TOTP 的內部：做對的幾個細節</h4>
<p>TOTP（RFC 6238）的算法是：伺服器和 App 共享一把金鑰，把「現在的時間除以 30 秒」當成計數器，用 HMAC 算出一個數字，取 6 位。所以：</p>
<ul>
<li>伺服器通常接受前後各一個時間格（±30 秒），容忍手機時鐘的誤差。</li>
<li>同一個時間格的驗證碼用過一次就要記下來，不能再用第二次。</li>
<li>共享金鑰是真正的機密：資料庫外洩，它也跟著外洩。要加密存放（第 5.4 課的信封加密）。這是 TOTP 和通行金鑰的另一個差別：通行金鑰在伺服器上只存公鑰。</li>
<li><b>備用碼</b>（recovery code）要像密碼一樣存雜湊，每一組只能用一次，用掉一組就通知使用者。</li>
</ul>

<h3><span class="badge lv3">專業</span>五、WebAuthn 與通行金鑰：背後交換了什麼</h3>
<p>WebAuthn 是 W3C 的標準，通行金鑰（passkey）是它最普及的形式。核心概念是公開金鑰密碼學（第 0.15 課）：<b>每一個網站一對專屬的金鑰</b>，私鑰留在使用者的裝置裡（手機、筆電的安全晶片、硬體安全金鑰，或同步在密碼管理器裡），伺服器只存公鑰。整個過程分成兩個「儀式」（ceremony）：註冊和登入。</p>
<figure class="figure"><svg viewBox="0 0 680 320" class="fg" style="width:100%;max-width:680px" role="img" aria-label="WebAuthn 註冊：伺服器送挑戰值，瀏覽器呼叫 create 並綁定網域，驗證器做使用者驗證並產生新金鑰對，公鑰和憑證 ID 一路回到伺服器，伺服器驗證後存下公鑰">
<rect x="30" y="10" width="120" height="30" rx="5" class="fg-b hot"/><text x="90" y="30" text-anchor="middle" class="fg-t acc">你的伺服器</text>
<rect x="280" y="10" width="120" height="30" rx="5" class="fg-b"/><text x="340" y="30" text-anchor="middle" class="fg-t">瀏覽器</text>
<rect x="520" y="10" width="120" height="30" rx="5" class="fg-b alt"/><text x="580" y="30" text-anchor="middle" class="fg-t">驗證器</text>
<line x1="90" y1="40" x2="90" y2="315" class="fg-l dim dash"/><line x1="340" y1="40" x2="340" y2="315" class="fg-l dim dash"/><line x1="580" y1="40" x2="580" y2="315" class="fg-l dim dash"/>
<line x1="90" y1="70" x2="332" y2="70" class="fg-l"/><polygon points="340,70 332,65.5 332,74.5" class="fg-a"/>
<text x="215" y="62" text-anchor="middle" class="fg-t sm">挑戰值、rp.id、user.id</text>
<line x1="340" y1="106" x2="572" y2="106" class="fg-l"/><polygon points="580,106 572,101.5 572,110.5" class="fg-a"/>
<text x="460" y="98" text-anchor="middle" class="fg-t sm">create()，綁定 game.example.com</text>
<rect x="500" y="120" width="160" height="28" rx="5" class="fg-b alt"/><text x="580" y="139" text-anchor="middle" class="fg-t sm">使用者驗證：指紋或 PIN</text>
<rect x="500" y="156" width="160" height="28" rx="5" class="fg-b hot"/><text x="580" y="175" text-anchor="middle" class="fg-t sm">產生金鑰對，私鑰不離開</text>
<line x1="580" y1="210" x2="348" y2="210" class="fg-l on"/><polygon points="340,210 348,205.5 348,214.5" class="fg-a on"/>
<text x="460" y="202" text-anchor="middle" class="fg-t sm acc">公鑰＋憑證 ID</text>
<line x1="340" y1="246" x2="98" y2="246" class="fg-l on"/><polygon points="90,246 98,241.5 98,250.5" class="fg-a on"/>
<text x="215" y="238" text-anchor="middle" class="fg-t sm acc">公鑰、憑證 ID、clientData</text>
<rect x="20" y="262" width="140" height="44" rx="5" class="fg-b hot"/><text x="90" y="280" text-anchor="middle" class="fg-t sm">驗挑戰值與來源</text><text x="90" y="297" text-anchor="middle" class="fg-t sm">存下公鑰</text>
</svg><figcaption>伺服器出一道一次性的挑戰值；驗證器在使用者按指紋或輸入 PIN 之後，替這個網域產生一對新金鑰。回到伺服器的只有公鑰、憑證 ID，以及瀏覽器填寫的 clientData（裡面有挑戰值和真正的來源網址）。</figcaption></figure>
<p>伺服器在註冊時要檢查：clientData 裡的挑戰值等於剛剛發出去的那個（防止重放）、來源（origin）等於你的網站、authenticatorData 裡的 rpIdHash 等於你的網域的雜湊、「使用者在場」的旗標有設。通過之後，存下<b>憑證 ID、公鑰、簽章計數器</b>，連同使用者 ID。<code>user.id</code> 要用隨機產生的不透明值，不要用 email，因為它會被存在驗證器裡。</p>
<figure class="figure"><svg viewBox="0 0 680 290" class="fg" style="width:100%;max-width:680px" role="img" aria-label="上排是真網站的登入：伺服器送挑戰值，瀏覽器填入真網域，驗證器找到金鑰並簽章，伺服器用公鑰驗證成功；下排是長得很像的網站：瀏覽器填入假網域，驗證器沒有這個網域的金鑰，簽不出任何東西">
<text x="20" y="34" class="fg-t acc">真網站 game.example.com</text>
<rect x="20" y="50" width="140" height="56" rx="6" class="fg-b"/><text x="90" y="73" text-anchor="middle" class="fg-t">你的伺服器</text><text x="90" y="93" text-anchor="middle" class="fg-t sm">送挑戰值 c2</text>
<rect x="190" y="50" width="140" height="56" rx="6" class="fg-b"/><text x="260" y="73" text-anchor="middle" class="fg-t">瀏覽器</text><text x="260" y="93" text-anchor="middle" class="fg-t sm">填入：真網域</text>
<rect x="360" y="50" width="140" height="56" rx="6" class="fg-b"/><text x="430" y="73" text-anchor="middle" class="fg-t">驗證器</text><text x="430" y="93" text-anchor="middle" class="fg-t sm">找到這個網域的金鑰</text>
<rect x="530" y="50" width="135" height="56" rx="6" class="fg-b hot"/><text x="597" y="73" text-anchor="middle" class="fg-t acc">簽章回傳</text><text x="597" y="93" text-anchor="middle" class="fg-t sm">伺服器用公鑰驗證</text>
<line x1="160" y1="78" x2="182" y2="78" class="fg-l on"/><polygon points="190,78 182,73.5 182,82.5" class="fg-a on"/>
<line x1="330" y1="78" x2="352" y2="78" class="fg-l on"/><polygon points="360,78 352,73.5 352,82.5" class="fg-a on"/>
<line x1="500" y1="78" x2="522" y2="78" class="fg-l on"/><polygon points="530,78 522,73.5 522,82.5" class="fg-a on"/>
<line x1="20" y1="134" x2="665" y2="134" class="fg-l dim"/>
<text x="20" y="158" class="fg-t warm">長得很像的網站</text>
<rect x="20" y="174" width="140" height="56" rx="6" class="fg-b warm"/><text x="90" y="197" text-anchor="middle" class="fg-t">仿冒的頁面</text><text x="90" y="217" text-anchor="middle" class="fg-t sm">網域不一樣</text>
<rect x="190" y="174" width="140" height="56" rx="6" class="fg-b"/><text x="260" y="197" text-anchor="middle" class="fg-t">瀏覽器</text><text x="260" y="217" text-anchor="middle" class="fg-t sm">填入：假網域</text>
<rect x="360" y="174" width="140" height="56" rx="6" class="fg-b"/><text x="430" y="197" text-anchor="middle" class="fg-t">驗證器</text><text x="430" y="217" text-anchor="middle" class="fg-t sm">這個網域沒有金鑰</text>
<rect x="530" y="174" width="135" height="56" rx="6" class="fg-b warm"/><text x="597" y="197" text-anchor="middle" class="fg-t warm">簽不出東西</text><text x="597" y="217" text-anchor="middle" class="fg-t sm">沒有可轉送的</text>
<line x1="160" y1="202" x2="182" y2="202" class="fg-l warm"/><polygon points="190,202 182,197.5 182,206.5" class="fg-a warm"/>
<line x1="330" y1="202" x2="352" y2="202" class="fg-l warm"/><polygon points="360,202 352,197.5 352,206.5" class="fg-a warm"/>
<line x1="500" y1="202" x2="522" y2="202" class="fg-l warm dash"/><polygon points="530,202 522,197.5 522,206.5" class="fg-a warm"/>
<text x="340" y="268" text-anchor="middle" class="fg-t sm">網域是瀏覽器自己填的：使用者騙不了，網頁也改不了</text>
</svg><figcaption>這就是「抗釣魚」的機制。使用者分不出兩個網站的差別沒關係，因為判斷不是由人做的。金鑰是依網域找的，簽章裡又包含真正的來源，兩道都綁在網域上。</figcaption></figure>
<p>登入時，伺服器送出新的挑戰值；驗證器用私鑰對「authenticatorData 加上 clientData 的雜湊」簽章。伺服器用存好的公鑰驗章，同樣檢查挑戰值、來源、rpIdHash、旗標。如果你要求<b>使用者驗證</b>（user verification，指紋或 PIN），驗證器本身就是兩個因素：你有的裝置，加上你知道的 PIN 或你本人的指紋，所以通行金鑰可以單獨當作強的登入方式。</p>
<h4>實作時你會做的決定</h4>
<ul>
<li><b>不要自己寫驗證</b>：用維護良好的函式庫，例如 Node.js 的 SimpleWebAuthn（<code>@simplewebauthn/server</code>）、Go 的 <code>go-webauthn/webauthn</code>。你只負責存挑戰值、存憑證、把參數設對。</li>
<li><b>同步型和裝置綁定型</b>：同步型通行金鑰（存在 iCloud 鑰匙圈、Google 密碼管理工具）換手機不會遺失，方便一般使用者；硬體安全金鑰的私鑰不能匯出，適合管理員和高價值帳號。</li>
<li><b>簽章計數器</b>：原本用來偵測被複製的驗證器，但同步型通行金鑰常常一直回傳 0，所以只能在它「有在遞增卻突然倒退」時當成警訊。</li>
<li><b>自動填入式登入</b>：<code>navigator.credentials.get</code> 帶 <code>mediation: 'conditional'</code>，輸入框加 <code>autocomplete="username webauthn"</code>，使用者點帳號欄位就會跳出通行金鑰，不用多一顆按鈕。</li>
<li><b>導入順序</b>：先讓通行金鑰成為「額外的登入方式」，鼓勵每個人註冊兩把（例如手機和筆電），等多數人都有了，再讓高風險帳號只能用它。</li>
</ul>
<pre><code>import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';

const options = await generateRegistrationOptions({
  rpName: 'Higher or Lower',
  rpID: 'game.example.com',
  userName: user.email,                  // 顯示用；內部的 user.id 由函式庫隨機產生
  attestationType: 'none',
  authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' },
});
req.session.challenge = options.challenge;   // 挑戰值存在伺服器端，用一次就丟

// 瀏覽器完成 create() 之後送回來：
const result = await verifyRegistrationResponse({
  response: req.body,
  expectedChallenge: req.session.challenge,
  expectedOrigin: 'https://game.example.com',
  expectedRPID: 'game.example.com',
});
// result.verified 為 true 時，存下 registrationInfo 裡的憑證 ID、公鑰、計數器</code></pre>

<h3><span class="badge lv3">專業</span>六、工作階段與 token：輪替和撤銷</h3>
<h4>伺服器端工作階段的細節</h4>
<ul>
<li><b>ID 要夠長、夠隨機</b>：用密碼學等級的亂數，例如 <code>crypto.randomBytes(32).toString('base64url')</code>，256 位元，猜中的機率可以忽略。</li>
<li><b>登入成功一定要換新 ID</b>：如果登入前就存在的 ID 在登入後繼續沿用，任何事先知道那個 ID 的人，在你登入之後也就等於登入了（這叫 session fixation）。權限提升時（例如進入管理模式）也要換。Express 的 <code>req.session.regenerate()</code> 就是做這件事。</li>
<li><b>兩種逾時</b>：閒置逾時（例如 30 分鐘沒動作）和絕對逾時（例如登入 12 小時後一定要重新驗證）。碰錢的操作還可以要求「最近 5 分鐘內驗證過」。</li>
<li><b>資料庫只存 ID 的雜湊</b>：資料庫或 Redis 的內容外洩時，拿到的只是雜湊，不能直接拿來當工作階段用。</li>
<li><b>能列出、能撤銷</b>：讓使用者看到「目前登入的裝置」，可以一個一個登出，也可以全部登出。改密碼、重設密碼之後，自動撤銷其他所有工作階段。</li>
</ul>
<h4>JWT：驗證時一項都不能少</h4>
<p>用 JWT 當 access token 時，驗證不是「解得開就好」。每一項都要檢查：簽章（用你預期的金鑰）、演算法（只接受你指定的那一種，例如 ES256，絕對不接受 <code>none</code>）、<code>iss</code>（誰發的）、<code>aud</code>（發給誰的）、<code>exp</code> 和 <code>nbf</code>（時間，容許幾十秒的時鐘誤差）。金鑰用 <code>kid</code> 標示，放在 JWKS 端點，換金鑰時新舊並存一段時間。用成熟的函式庫，把這些都設成必填：</p>
<pre><code>import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS = createRemoteJWKSet(new URL('https://auth.example.com/.well-known/jwks.json'));

const { payload } = await jwtVerify(token, JWKS, {
  issuer: 'https://auth.example.com',
  audience: 'hilo-api',
  algorithms: ['ES256'],
  clockTolerance: 30,       // 秒
});</code></pre>
<h4>refresh token 輪替與重用偵測</h4>
<p>access token 只活 5 到 15 分鐘，過期就用 refresh token 換新的。refresh token 活得久（幾天到幾週），所以它被偷的後果很嚴重。對策是<b>輪替</b>（rotation）：每次用 refresh token 換新時，同時發一張新的 refresh token，舊的立刻作廢。</p>
<figure class="figure"><svg viewBox="0 0 680 250" class="fg" style="width:100%;max-width:680px" role="img" aria-label="同一個 token 家族裡，R1 換成 R2、R2 換成 R3，舊的都標為已使用；如果 R2 再次出現，伺服器把整個家族作廢，連 R3 也失效">
<text x="265" y="18" text-anchor="middle" class="fg-t sm">同一個 token 家族（family）</text>
<rect x="20" y="40" width="130" height="50" rx="6" class="fg-b"/><text x="85" y="62" text-anchor="middle" class="fg-t mono">R1</text><text x="85" y="80" text-anchor="middle" class="fg-t sm">已使用</text>
<rect x="200" y="40" width="130" height="50" rx="6" class="fg-b"/><text x="265" y="62" text-anchor="middle" class="fg-t mono">R2</text><text x="265" y="80" text-anchor="middle" class="fg-t sm">已使用</text>
<rect x="380" y="40" width="130" height="50" rx="6" class="fg-b hot"/><text x="445" y="62" text-anchor="middle" class="fg-t mono acc">R3</text><text x="445" y="80" text-anchor="middle" class="fg-t sm">目前有效</text>
<line x1="150" y1="65" x2="192" y2="65" class="fg-l on"/><polygon points="200,65 192,60.5 192,69.5" class="fg-a on"/><text x="175" y="56" text-anchor="middle" class="fg-t sm">換新</text>
<line x1="330" y1="65" x2="372" y2="65" class="fg-l on"/><polygon points="380,65 372,60.5 372,69.5" class="fg-a on"/><text x="355" y="56" text-anchor="middle" class="fg-t sm">換新</text>
<rect x="545" y="40" width="120" height="50" rx="6" class="fg-b alt"/><text x="605" y="62" text-anchor="middle" class="fg-t">access token</text><text x="605" y="80" text-anchor="middle" class="fg-t sm">每次附一張</text>
<line x1="510" y1="65" x2="537" y2="65" class="fg-l alt"/><polygon points="545,65 537,60.5 537,69.5" class="fg-a alt"/>
<line x1="265" y1="90" x2="265" y2="142" class="fg-l warm dash"/><polygon points="265,150 260.5,142 269.5,142" class="fg-a warm"/><text x="273" y="124" class="fg-t sm warm">又被拿來換一次</text>
<rect x="200" y="150" width="130" height="50" rx="6" class="fg-b warm"/><text x="265" y="172" text-anchor="middle" class="fg-t">R2 再次出現</text><text x="265" y="190" text-anchor="middle" class="fg-t sm">它已經用過了</text>
<line x1="330" y1="175" x2="372" y2="175" class="fg-l warm"/><polygon points="380,175 372,170.5 372,179.5" class="fg-a warm"/>
<rect x="380" y="150" width="285" height="50" rx="6" class="fg-b warm"/><text x="522" y="172" text-anchor="middle" class="fg-t warm">整個家族作廢</text><text x="522" y="190" text-anchor="middle" class="fg-t sm">R3 也失效，要求重新登入、發警報</text>
<text x="340" y="232" text-anchor="middle" class="fg-t sm">正常的用戶端用過就丟。同一張舊 token 出現兩次，代表有第二方拿著它</text>
</svg><figcaption>伺服器不需要知道兩方誰是真的使用者，只要整個家族作廢，雙方都得重新登入，真正的使用者登入得了，偷 token 的人登入不了。</figcaption></figure>
<p>實作上，refresh token 是一串不透明的隨機值（不是 JWT），資料庫存它的雜湊、所屬家族、是否已使用、到期時間。換新時用一個交易把「標記舊的為已使用」和「發新的」綁在一起；如果遇到已使用的那一張，就把整個家族標為作廢。網路不穩時用戶端可能重送，可以給幾秒鐘的寬限，或讓同一張 token 在極短時間內重送時回傳同一組結果。</p>
<h4>token 該放在哪裡</h4>
<ul>
<li><b>瀏覽器的單頁應用</b>：放在 <code>localStorage</code>，任何一段 XSS 都讀得到。目前最推薦的做法是 <b>BFF</b>（backend for frontend）：OAuth 的 token 全部留在你的後端，瀏覽器和後端之間只用 HttpOnly 的工作階段 cookie。IETF 給瀏覽器應用程式的 OAuth 指引草案也把它列為最安全的選項。</li>
<li><b>手機和原生遊戲用戶端</b>（Cocos 原生、Unity）：refresh token 存在系統的安全儲存區，iOS 用 Keychain，Android 用 Keystore 加密的儲存，不要放在一般的設定檔或 PlayerPrefs。</li>
<li><b>WebSocket</b>：連線時驗證一次（例如用一張只活 30 秒、只能用一次的連線票），長連線期間工作階段被撤銷時，伺服器要主動關閉這條連線，重新連線時重新驗證。</li>
</ul>

<h3><span class="badge lv3">專業</span>七、OAuth 2.0 與 OIDC：授權碼流程加 PKCE</h3>
<p>「使用 Google 登入」背後是兩個協定。<b>OAuth 2.0</b> 是授權協定：讓你的應用程式拿到一張 access token，代表使用者去存取某個資源。<b>OpenID Connect</b>（OIDC）建立在 OAuth 上，多加一張 <b>ID token</b>，告訴你「使用者是誰」。要做登入，你要的是 OIDC 的 ID token，不是拿 access token 來當登入的證明。</p>
<p>現在唯一該用的流程是<b>授權碼流程加 PKCE</b>（authorization code flow with PKCE，RFC 7636）。舊的隱含流程（implicit flow）已經不建議使用；2025 年發布的 OAuth 安全最佳實務（RFC 9700）建議所有用戶端都用 PKCE，正在定稿的 OAuth 2.1 也把它列為必要。</p>
<figure class="figure"><svg viewBox="0 0 680 400" class="fg" style="width:100%;max-width:680px" role="img" aria-label="授權碼加 PKCE 的循序圖：後端產生 verifier 與 challenge，瀏覽器帶 challenge 去授權伺服器登入，帶 code 回來，後端用 code 和 verifier 直接向授權伺服器換 token，再驗證 ID token">
<rect x="30" y="10" width="120" height="30" rx="5" class="fg-b"/><text x="90" y="30" text-anchor="middle" class="fg-t">瀏覽器</text>
<rect x="270" y="10" width="140" height="30" rx="5" class="fg-b hot"/><text x="340" y="30" text-anchor="middle" class="fg-t acc">你的後端</text>
<rect x="500" y="10" width="160" height="30" rx="5" class="fg-b alt"/><text x="580" y="30" text-anchor="middle" class="fg-t">授權伺服器</text>
<line x1="90" y1="40" x2="90" y2="395" class="fg-l dim dash"/><line x1="340" y1="40" x2="340" y2="395" class="fg-l dim dash"/><line x1="580" y1="40" x2="580" y2="395" class="fg-l dim dash"/>
<rect x="240" y="54" width="200" height="40" rx="5" class="fg-b hot"/><text x="340" y="70" text-anchor="middle" class="fg-t sm">產生 verifier、state、nonce</text><text x="340" y="86" text-anchor="middle" class="fg-t sm">challenge = SHA256(verifier)</text>
<line x1="340" y1="116" x2="98" y2="116" class="fg-l alt"/><polygon points="90,116 98,111.5 98,120.5" class="fg-a alt"/>
<text x="215" y="108" text-anchor="middle" class="fg-t sm">轉址：challenge、state</text>
<line x1="90" y1="152" x2="572" y2="152" class="fg-l alt"/><polygon points="580,152 572,147.5 572,156.5" class="fg-a alt"/>
<text x="460" y="144" text-anchor="middle" class="fg-t sm">使用者在這裡登入、同意</text>
<line x1="580" y1="188" x2="98" y2="188" class="fg-l alt"/><polygon points="90,188 98,183.5 98,192.5" class="fg-a alt"/>
<text x="460" y="180" text-anchor="middle" class="fg-t sm">轉回 redirect_uri：code、state</text>
<line x1="90" y1="224" x2="332" y2="224" class="fg-l alt"/><polygon points="340,224 332,219.5 332,228.5" class="fg-a alt"/>
<text x="215" y="216" text-anchor="middle" class="fg-t sm">帶著 code、state 回來</text>
<rect x="270" y="236" width="140" height="28" rx="5" class="fg-b"/><text x="340" y="255" text-anchor="middle" class="fg-t sm">比對 state</text>
<line x1="340" y1="290" x2="572" y2="290" class="fg-l on"/><polygon points="580,290 572,285.5 572,294.5" class="fg-a on"/>
<text x="460" y="282" text-anchor="middle" class="fg-t sm acc">code＋verifier（後端直連）</text>
<rect x="490" y="302" width="180" height="28" rx="5" class="fg-b alt"/><text x="580" y="321" text-anchor="middle" class="fg-t sm">驗 verifier 對得上 challenge</text>
<line x1="580" y1="350" x2="348" y2="350" class="fg-l on"/><polygon points="340,350 348,345.5 348,354.5" class="fg-a on"/>
<text x="460" y="342" text-anchor="middle" class="fg-t sm acc">ID token、access token</text>
<rect x="240" y="362" width="200" height="28" rx="5" class="fg-b hot"/><text x="340" y="381" text-anchor="middle" class="fg-t sm">驗 ID token：簽章、aud、nonce</text>
</svg><figcaption>藍色箭頭經過瀏覽器（前通道），網址可能出現在紀錄或被別的程式看到，所以上面只走 challenge 和一次性的 code。綠色箭頭是後端直接連授權伺服器（後通道），verifier 只在這裡出現。</figcaption></figure>
<p>用實際的值走一次。後端先產生三個隨機值，存進使用者的工作階段：</p>
<pre><code>import crypto from 'node:crypto';

const verifier = crypto.randomBytes(32).toString('base64url');   // 43 個字元，留在後端
const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
const state = crypto.randomBytes(16).toString('base64url');      // 防止有人塞給你別人的回呼
const nonce = crypto.randomBytes(16).toString('base64url');      // 綁定這次登入和 ID token</code></pre>
<p>然後把瀏覽器轉到授權頁（以 RFC 7636 附錄裡的範例值為例）：</p>
<pre><code>https://auth.example.com/authorize?response_type=code
  &amp;client_id=hilo-web
  &amp;redirect_uri=https%3A%2F%2Fgame.example.com%2Fcallback
  &amp;scope=openid%20profile
  &amp;state=Zk2…&amp;nonce=Q9x…
  &amp;code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &amp;code_challenge_method=S256</code></pre>
<p>每一個參數都在防一件事：</p>
<table>
<tr><th>參數</th><th>防什麼</th><th>你要檢查什麼</th></tr>
<tr><td><code>redirect_uri</code></td><td>授權碼被送到別的地方</td><td>在授權伺服器登記的值必須完全相等，不用萬用字元、不用前綴比對</td></tr>
<tr><td><code>state</code></td><td>回呼被偽造：有人讓你的瀏覽器帶著不是你發起的授權碼回來</td><td>回來的 state 等於工作階段裡存的那個，用一次就丟</td></tr>
<tr><td><code>code_challenge</code> 和 verifier</td><td>授權碼在前通道被看到或攔下</td><td>授權伺服器檢查 SHA256(verifier) 等於當初的 challenge；只拿到 code 而沒有 verifier，換不到 token</td></tr>
<tr><td><code>nonce</code></td><td>ID token 被拿到別的登入流程重用</td><td>ID token 裡的 nonce 等於你存的那個</td></tr>
</table>
<p>拿到 ID token 之後，要驗：簽章（用授權伺服器公布的 JWKS）、<code>iss</code> 等於授權伺服器、<code>aud</code> 等於你的 client_id、<code>exp</code> 沒過期、<code>nonce</code> 對得上。最後，用 <b><code>iss</code> 加 <code>sub</code></b> 當作這個外部帳號的唯一識別，不要用 email：email 可能被改掉、可能沒驗證過，不同的身分提供者也可能出現同一個 email。要把外部帳號連到既有的本地帳號，請使用者先用原本的方式登入再綁定，不要因為 email 相同就自動合併。</p>

<h3><span class="badge lv4">專家</span>八、帳號復原：最常被忽略的那扇門</h3>
<p>你可以把登入做得滴水不漏，但如果「忘記密碼」只要一封 email、「換手機」只要打電話給客服，攻擊者就會走那條路。2023 年就有大型企業因為客服人員在電話裡幫人重設了 MFA 而被入侵。設計原則只有一條：<b>復原流程的強度，要跟登入一樣</b>。</p>
<h4>密碼重設連結</h4>
<pre><code>// 產生：token 本身只出現在信裡，資料庫只存雜湊
const token = crypto.randomBytes(32).toString('base64url');
const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
await db.query(
  "INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '30 minutes')",
  [userId, tokenHash]);

// 使用：一條原子更新，同時確認存在、沒用過、沒過期，並標記為已使用
const { rows } = await db.query(
  'UPDATE password_resets SET used_at = now() WHERE token_hash = $1 AND used_at IS NULL AND expires_at &gt; now() RETURNING user_id',
  [sha256(tokenFromLink)]);</code></pre>
<ul>
<li><b>回應不透露帳號是否存在</b>：一律回「如果這個 email 有註冊，我們已經寄出重設信」。</li>
<li><b>重設信的網址要用你寫死的網域</b>，不要用請求裡的 Host 標頭組出來，否則網域可能被換掉。</li>
<li><b>重設頁面</b>加上 <code>Referrer-Policy: no-referrer</code>，避免 token 透過 Referer 標頭外流到頁面上的第三方資源。</li>
<li><b>重設之後</b>：撤銷所有工作階段和 refresh token、通知使用者「你的密碼剛被改了，不是你的話請聯絡我們」，並且讓使用者用新密碼重新登入，<b>第二道驗證照樣要過</b>。重設密碼不能變成繞過 MFA 的捷徑。</li>
</ul>
<h4>MFA 遺失時</h4>
<ul>
<li><b>事前準備最重要</b>：註冊時就給備用碼，並鼓勵註冊兩把通行金鑰或兩種第二道驗證。這樣大部分「手機掉了」的情況，使用者自己就能處理。</li>
<li><b>真的要人工處理時</b>：要有身分核實的程序（例如視訊比對證件、確認近期的交易紀錄），並加上<b>冷卻期</b>：重設申請送出後等 24 到 72 小時才生效，期間通知所有已知的聯絡方式，真正的使用者看到就能取消。</li>
<li><b>客服的權限</b>：客服可以「發起」重設，但不能自己完成；高價值帳號需要第二個人核准。每一次人工重設都進稽核日誌。</li>
<li><b>管理員帳號</b>：不提供自助復原，一律由另一位管理員依流程處理。</li>
</ul>
<h4>其他會改變帳號控制權的操作</h4>
<p>改 email、改手機號碼、新增登入方式、關閉 MFA，這些都等於「換一把鎖」。它們都應該：要求最近重新驗證過、通知舊的聯絡方式（改 email 時通知<b>舊的</b>信箱）、對碰錢的帳號加上一段時間的出金限制。很多帳號被盜的事件，攻擊者第一件事就是改 email，讓真正的使用者收不到任何通知。</p>

<h3>九、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>密碼規則越複雜越安全</td><td>NIST 明確反對組成規則和定期更換。長度、封鎖外洩清單、允許密碼管理器才有用。</td></tr>
<tr><td>有 MFA 就不怕釣魚</td><td>簡訊、TOTP、推播都可能被即時轉送或騙走。只有 WebAuthn 這類綁定網域的方式抗釣魚。</td></tr>
<tr><td>JWT 比工作階段安全</td><td>兩者是不同的取捨。JWT 不用查資料庫，但很難撤銷；工作階段一刪就失效。很多系統兩者並用。</td></tr>
<tr><td>JWT 是加密的</td><td>一般的 JWT 只有簽章，內容是 Base64，誰都讀得到。</td></tr>
<tr><td>OAuth 是登入協定</td><td>OAuth 是授權協定。登入要用 OIDC 的 ID token，並且驗證它的 aud 和 nonce。</td></tr>
<tr><td>通行金鑰的私鑰存在伺服器</td><td>伺服器只存公鑰。資料庫外洩，攻擊者拿到的公鑰不能拿來登入。</td></tr>
<tr><td>忘記密碼只是方便功能</td><td>它是登入的另一個入口，強度不夠，整個系統的強度就等於它。</td></tr>
</table>

<h3>十、跟你的工作連起來</h3>
<ul>
<li><b>Vue 和 TypeScript 前端</b>：不要把 token 放在 <code>localStorage</code>；登入表單的輸入框設好 <code>autocomplete</code>（<code>username</code>、<code>current-password</code>、<code>new-password</code>），密碼管理器和通行金鑰才會正常運作。</li>
<li><b>Node.js 和 Go 後端</b>：登入端點限速、換發工作階段 ID、JWT 驗證參數全部設成必填、refresh token 輪替。這些都有成熟的函式庫，你的工作是把參數設對。</li>
<li><b>遊戲用戶端</b>：Cocos 和 Unity 的原生版本把 token 存進系統的安全儲存區；WebSocket 長連線要能被伺服器踢下線；遊戲內的「綁定帳號」流程其實就是 OIDC 的帳號連結，要先登入再綁。</li>
<li><b>Docker 和雲端</b>：工作階段存在 Redis，Redis 本身要有密碼、只對應用程式的網段開放；JWT 的簽章私鑰放在機密管理服務（第 5.4 課）。</li>
<li><b>管理後台</b>：最先改成強制 WebAuthn 的地方，而且不提供自助復原。</li>
</ul>

<h3>十一、面試會怎麼問</h3>
<ol>
<li>「你會怎麼設計一個登入端點，同時擋住撞庫、又不讓攻擊者能故意鎖住別人的帳號？」</li>
<li>「為什麼通行金鑰能抵擋釣魚，TOTP 不能？」</li>
<li>「JWT 和伺服器端工作階段怎麼選？使用者按『登出所有裝置』時，JWT 要怎麼處理？」</li>
<li>「PKCE 在防什麼？有了 state 為什麼還要 PKCE？」</li>
<li>「refresh token 輪替是什麼？什麼是重用偵測？」</li>
<li>「設計一個安全的忘記密碼流程。」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>每個帳號和每個來源位址各一個失敗計數器，計數器以帳號名稱為鍵，不管帳號存不存在都計；超過門檻先要求 CAPTCHA 或第二道驗證，再嚴重才暫時拒絕，不做永久鎖定。註冊和改密碼時拒絕外洩過的密碼，推廣 MFA。錯誤訊息和回應時間不透露帳號是否存在。所有結果寫結構化日誌，對異常的失敗率發警報，新裝置登入時通知使用者。</li>
<li>TOTP 的驗證碼是一個不知道自己用在哪裡的數字，仿冒頁面可以即時把它轉給真網站。WebAuthn 的金鑰是依網域產生和查找的，瀏覽器會把真正的來源寫進 clientData，再由驗證器簽章；在別的網域上找不到金鑰，就算有也簽不出伺服器會接受的東西。判斷交給瀏覽器，不靠使用者看網址。</li>
<li>需要即時撤銷、主要是自己的網站在用，選伺服器端工作階段；跨很多服務、不想每個請求都查資料庫，選短效 JWT。JWT 沒辦法真正收回，所以做法是：access token 效期很短（5 到 15 分鐘），登出所有裝置時撤銷所有 refresh token，讓 access token 自然到期；真的需要立刻失效時，加一份撤銷清單或在使用者資料上記一個「這個時間之前發的 token 都無效」。</li>
<li>PKCE 防的是授權碼外流：授權碼會出現在經過瀏覽器的網址裡，可能被記錄或被同一台裝置上的其他程式看到。用戶端事先產生 verifier、只送出它的雜湊，換 token 時再出示 verifier，只拿到 code 的人換不到 token。state 防的是另一件事：讓你的應用程式接受一個不是你發起的回呼。兩者互補，所以都要用。</li>
<li>每次用 refresh token 換新時都發一張新的，舊的立刻作廢，同一串換下來的 token 屬於同一個家族。正常的用戶端不會重用舊 token，所以如果一張已經用過的 token 又出現，代表有第二方持有它，伺服器就把整個家族作廢，讓雙方都重新登入，並發出警報。</li>
<li>不透露帳號是否存在；產生 256 位元的隨機 token，資料庫只存雜湊，30 分鐘到期、只能用一次，用一條原子更新同時檢查並標記；信中網址用寫死的網域；重設頁面不送 Referer。重設後撤銷所有工作階段和 refresh token、通知使用者、要求用新密碼重新登入並照樣過 MFA。不使用安全提示問題。</li>
</ol>
</details>

<h3>十二、練功題（做得出來才算真的懂）</h3>
<ol>
<li>在你自己的專案裡，接上 Pwned Passwords 的 k-匿名查詢：註冊和改密碼時，比對到就拒絕。寫出你怎麼處理查詢服務連不上的情況。</li>
<li>打開瀏覽器的開發者工具，在你自己的網站登入前後各看一次工作階段 cookie 的值。它有沒有改變？如果沒有，你要改哪裡？</li>
<li>用 <code>jose</code> 寫一個驗證 JWT 的函式，故意把 <code>aud</code> 改錯、把時間調到過期，確認兩者都會被拒絕。</li>
<li>畫出你自己系統的帳號復原流程（忘記密碼、換手機、改 email），標出哪一步比登入還弱。</li>
<li>替猜高低的管理後台設計一套登入方式：用什麼因素、工作階段多久過期、管理員的手機遺失時怎麼處理。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>算 SHA-1，取前 5 碼呼叫範圍查詢 API，在回傳的後綴裡比對剩下的 35 碼。連不上時有兩種選擇：讓註冊照常進行並記錄下來，之後補查（可用性優先），或改用本機下載的清單。不建議因為外部服務掛了就讓所有人無法註冊；更不能因此跳過，卻不留紀錄。</li>
<li>登入前後的值必須不同。如果一樣，就是登入成功時沒有換發新的工作階段 ID，要在登入成功、MFA 通過之後呼叫 <code>req.session.regenerate()</code>（或你的框架的同等功能），並把使用者資料寫進新的工作階段。</li>
<li>用 <code>jwtVerify(token, key, { issuer, audience, algorithms })</code>。<code>aud</code> 錯時會丟出聲明驗證失敗的錯誤，過期時會丟出過期的錯誤。測試裡要斷言兩者都是拋出錯誤，而不是回傳結果；也測一張用別把金鑰簽的 token，必須簽章驗證失敗。</li>
<li>常見的弱點：忘記密碼只靠 email，而 email 帳號本身沒有 MFA；換手機時客服只問生日和電話；改 email 不需要重新驗證、也不通知舊信箱。每一個都要補到和登入同等：重新驗證、冷卻期、通知舊的聯絡方式。</li>
<li>只允許 WebAuthn，每位管理員註冊至少兩把硬體安全金鑰或通行金鑰；閒置 15 分鐘、絕對 8 小時就要重新驗證，敏感操作要求 5 分鐘內驗證過；管理後台放在 VPN 或單一登入之後。手機遺失時用另一把金鑰登入、撤銷遺失的那一把；兩把都沒了，由另一位管理員依書面流程核實身分後重設，全程記錄。</li>
</ol>
</details>

<h3>十三、想再挖深</h3>
<ul>
<li><b>NIST SP 800-63B</b>（數位身分指引的身分驗證篇）：密碼規則、MFA、工作階段的官方標準，條文寫得很直白，值得讀原文。</li>
<li><b>OWASP Cheat Sheet Series</b>（<a href="https://cheatsheetseries.owasp.org/">cheatsheetseries.owasp.org</a>）：Authentication、Session Management、Forgot Password、Multifactor Authentication 這幾份，是實作時的檢查清單。</li>
<li><b>RFC 7636（PKCE）、RFC 9700（OAuth 2.0 Security Best Current Practice）</b>：OAuth 怎麼做才安全的第一手資料。</li>
<li><b>passkeys.dev</b> 和 W3C 的 <b>Web Authentication</b> 規格：通行金鑰的開發者指南與正式標準。</li>
<li><b>Justin Richer、Antonio Sanso《OAuth 2 in Action》</b>（Manning）：把 OAuth 的每一個角色和流程用程式碼走過一遍。</li>
</ul>
` });
