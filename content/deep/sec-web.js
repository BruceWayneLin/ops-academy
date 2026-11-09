DEEP({ 'sec-web': `
<p>上一課把網站最常見的漏洞各講了一段：它是什麼、怎麼防。這一章站在<b>蓋系統的人</b>這一邊往下挖：防線要放在哪一層，才不會有人忘記加？安全的寫法在 Node.js、Go、Vue 裡具體長什麼樣子？修好之後，怎麼在你自己的系統上證明它真的有效？最後專門講遊戲和金流：伺服器說了算、餘額的原子更新、冪等鍵和限速。整章依照 OWASP Top 10 的分類來組織，每一種弱點只用白話和圖說明它的機制，大部分篇幅都花在防守上。</p>
<div class="warn"><b>先講清楚範圍。</b>這一章教的是設計和防守。想動手練習，只能用合法的練習環境：PortSwigger 的 Web Security Academy（免費、線上）、OWASP Juice Shop（用 Docker 在自己電腦上跑），或你自己擁有的系統。沒有書面授權就去測別人的系統，在台灣觸犯刑法「妨害電腦使用罪」，在幾乎所有國家也都是犯罪。</div>

<h3><span class="badge lv1">基礎</span>一、網站漏洞的兩個根源</h3>
<p>OWASP Top 10 列了十類，看起來很多，但拆到底，大部分都來自兩個根源：</p>
<ol>
<li><b>相信了不該相信的那一邊。</b>伺服器相信用戶端送來的身分、價格、輸贏；相信請求一定是使用者自己按的；相信使用者給的網址一定指向外面。這是第 5.1 課的信任邊界沒守住。</li>
<li><b>資料被當成指令。</b>使用者輸入的文字，本來只是「一個值」，卻被拼進 SQL、HTML 或 shell 指令裡，被解析器當成語法的一部分。</li>
</ol>
<p>第二個根源用一個比喻最好懂。餐廳的點菜單上有一格「菜名」，客人在格子裡寫「牛肉麵」，廚房做一碗牛肉麵，這是資料。如果廚房的做法是把整張紙條從頭讀到尾、照著上面的字做事，那客人在格子裡寫的就不只是菜名，而是可以寫任何「工作指示」。修法不是叫廚房檢查客人寫了什麼怪字，而是規定<b>格子裡寫什麼，都只當成菜名</b>。</p>
<figure class="figure"><svg viewBox="0 0 680 262" class="fg" style="width:100%;max-width:680px" role="img" aria-label="上半部是拼接字串：查詢文字和使用者輸入合成一條字串，整條交給解析器；下半部是參數化查詢：範本和參數分兩條路，解析器只解析範本，參數只當成值">
<text x="20" y="24" class="fg-t warm">拼接字串：資料和指令混在一起</text>
<rect x="20" y="40" width="150" height="36" rx="5" class="fg-b"/><text x="95" y="63" text-anchor="middle" class="fg-t">查詢的文字</text>
<rect x="20" y="84" width="150" height="36" rx="5" class="fg-b warm"/><text x="95" y="107" text-anchor="middle" class="fg-t">使用者輸入</text>
<path d="M170 58 H192 V72 H212" class="fg-l"/><polygon points="220,72 212,67.5 212,76.5" class="fg-a"/>
<path d="M170 102 H192 V88 H212" class="fg-l"/><polygon points="220,88 212,83.5 212,92.5" class="fg-a"/>
<rect x="220" y="56" width="150" height="48" rx="5" class="fg-b"/><text x="295" y="76" text-anchor="middle" class="fg-t">一整條 SQL 字串</text><text x="295" y="94" text-anchor="middle" class="fg-t sm">分不出誰是誰</text>
<line x1="370" y1="80" x2="412" y2="80" class="fg-l warm"/><polygon points="420,80 412,75.5 412,84.5" class="fg-a warm"/>
<rect x="420" y="56" width="240" height="48" rx="5" class="fg-b warm"/><text x="540" y="76" text-anchor="middle" class="fg-t">資料庫的解析器</text><text x="540" y="94" text-anchor="middle" class="fg-t sm">輸入的內容也被當成語法</text>
<line x1="20" y1="138" x2="660" y2="138" class="fg-l dim"/>
<text x="20" y="160" class="fg-t acc">參數化查詢：兩條路分開走</text>
<rect x="20" y="174" width="150" height="36" rx="5" class="fg-b"/><text x="95" y="197" text-anchor="middle" class="fg-t">查詢範本（$1）</text>
<rect x="20" y="218" width="150" height="36" rx="5" class="fg-b alt"/><text x="95" y="241" text-anchor="middle" class="fg-t">使用者輸入</text>
<line x1="170" y1="192" x2="212" y2="192" class="fg-l on"/><polygon points="220,192 212,187.5 212,196.5" class="fg-a on"/>
<line x1="170" y1="236" x2="212" y2="236" class="fg-l alt"/><polygon points="220,236 212,231.5 212,240.5" class="fg-a alt"/>
<rect x="220" y="174" width="200" height="36" rx="5" class="fg-b hot"/><text x="320" y="197" text-anchor="middle" class="fg-t">解析器：只解析範本</text>
<rect x="220" y="218" width="200" height="36" rx="5" class="fg-b alt"/><text x="320" y="241" text-anchor="middle" class="fg-t">參數：只當成一個值</text>
<path d="M420 192 H440 V206 H462" class="fg-l on"/><polygon points="470,206 462,201.5 462,210.5" class="fg-a on"/>
<path d="M420 236 H440 V222 H462" class="fg-l alt"/><polygon points="470,222 462,217.5 462,226.5" class="fg-a alt"/>
<rect x="470" y="186" width="190" height="56" rx="5" class="fg-b hot"/><text x="565" y="209" text-anchor="middle" class="fg-t acc">執行</text><text x="565" y="228" text-anchor="middle" class="fg-t sm">輸入寫什麼都只是值</text>
</svg><figcaption>上面：輸入和查詢文字黏成一條字串，解析器沒辦法分辨哪一段是你寫的、哪一段是使用者給的。下面：範本先被解析，參數走另一條路，執行時才放進去，從頭到尾不會被當成語法。</figcaption></figure>
<p>這張圖的道理，同樣適用在 HTML（XSS）、shell 指令、範本引擎、反序列化。所以防守的通則只有一句：<b>讓資料走資料的路</b>，不要靠「過濾危險字元」，因為危險字元的寫法永遠列不完，而結構上的分離不需要列。</p>
<h4>這一章怎麼對應 OWASP Top 10</h4>
<p>下表用的是 2021 版的分類，它是目前最多人引用的版本。OWASP 之後的新版調整了順序、合併了幾類，但這些主題都還在。</p>
<table>
<tr><th>類別（2021）</th><th>在哪裡講</th></tr>
<tr><td>A01 存取控制失效（broken access control）</td><td>本章第二節</td></tr>
<tr><td>A02 加密機制失效（cryptographic failures）</td><td>第 0.15 課、第 5.4 課</td></tr>
<tr><td>A03 注入（injection，XSS 也算在這裡）</td><td>本章第三、四節</td></tr>
<tr><td>A04 不安全的設計（insecure design）</td><td>第 5.1 課、本章第八節</td></tr>
<tr><td>A05 安全設定錯誤（security misconfiguration）</td><td>本章第七節</td></tr>
<tr><td>A06 有漏洞或過時的元件</td><td>第 5.7 課</td></tr>
<tr><td>A07 身分識別與驗證失效</td><td>第 5.3 課</td></tr>
<tr><td>A08 軟體與資料完整性失效（含不安全的反序列化）</td><td>本章第七節</td></tr>
<tr><td>A09 安全日誌與監控失效</td><td>本章第九節、第 6.4 課</td></tr>
<tr><td>A10 伺服器端請求偽造（SSRF）</td><td>本章第六節</td></tr>
</table>

<h3><span class="badge lv1">基礎</span>二、存取控制：授權要放在伺服器、放在中央、預設拒絕</h3>
<p>存取控制失效連續多年排第一，機制卻很單純：伺服器拿到一個 ID，查出資料就回傳，<b>沒有問「這筆是不是你的」</b>。網址、請求內容、隱藏欄位全都在使用者手上，他改一個數字，伺服器就照辦。</p>
<p>授權其實分成三層，每一層回答不同的問題，被擋下時也該回不同的狀態碼：</p>
<figure class="figure"><svg viewBox="0 0 680 230" class="fg" style="width:100%;max-width:680px" role="img" aria-label="請求依序經過身分驗證、功能層授權、物件層授權才到處理函式，每一層不通過就往下走到 401、403、404">
<rect x="10" y="40" width="85" height="60" rx="6" class="fg-b"/><text x="52" y="66" text-anchor="middle" class="fg-t">請求</text><text x="52" y="86" text-anchor="middle" class="fg-t sm">帶 cookie</text>
<rect x="120" y="40" width="125" height="60" rx="6" class="fg-b alt"/><text x="182" y="66" text-anchor="middle" class="fg-t">1 你是誰</text><text x="182" y="86" text-anchor="middle" class="fg-t sm">工作階段有效嗎</text>
<rect x="270" y="40" width="125" height="60" rx="6" class="fg-b alt"/><text x="332" y="66" text-anchor="middle" class="fg-t">2 能用這功能嗎</text><text x="332" y="86" text-anchor="middle" class="fg-t sm">角色、權限</text>
<rect x="420" y="40" width="125" height="60" rx="6" class="fg-b hot"/><text x="482" y="66" text-anchor="middle" class="fg-t acc">3 這筆是你的嗎</text><text x="482" y="86" text-anchor="middle" class="fg-t sm">比對 owner_id</text>
<rect x="570" y="40" width="100" height="60" rx="6" class="fg-b"/><text x="620" y="66" text-anchor="middle" class="fg-t">處理函式</text><text x="620" y="86" text-anchor="middle" class="fg-t sm">真正做事</text>
<line x1="95" y1="70" x2="112" y2="70" class="fg-l"/><polygon points="120,70 112,65.5 112,74.5" class="fg-a"/>
<line x1="245" y1="70" x2="262" y2="70" class="fg-l"/><polygon points="270,70 262,65.5 262,74.5" class="fg-a"/>
<line x1="395" y1="70" x2="412" y2="70" class="fg-l"/><polygon points="420,70 412,65.5 412,74.5" class="fg-a"/>
<line x1="545" y1="70" x2="562" y2="70" class="fg-l"/><polygon points="570,70 562,65.5 562,74.5" class="fg-a"/>
<line x1="182" y1="100" x2="182" y2="142" class="fg-l warm"/><polygon points="182,150 177.5,142 186.5,142" class="fg-a warm"/><text x="190" y="128" class="fg-t sm warm">不通過</text>
<line x1="332" y1="100" x2="332" y2="142" class="fg-l warm"/><polygon points="332,150 327.5,142 336.5,142" class="fg-a warm"/><text x="340" y="128" class="fg-t sm warm">不通過</text>
<line x1="482" y1="100" x2="482" y2="142" class="fg-l warm"/><polygon points="482,150 477.5,142 486.5,142" class="fg-a warm"/><text x="490" y="128" class="fg-t sm warm">不通過</text>
<rect x="127" y="150" width="110" height="34" rx="5" class="fg-b warm"/><text x="182" y="172" text-anchor="middle" class="fg-t">401 未登入</text>
<rect x="277" y="150" width="110" height="34" rx="5" class="fg-b warm"/><text x="332" y="172" text-anchor="middle" class="fg-t">403 沒有權限</text>
<rect x="427" y="150" width="110" height="34" rx="5" class="fg-b warm"/><text x="482" y="172" text-anchor="middle" class="fg-t">404 找不到</text>
<text x="340" y="214" text-anchor="middle" class="fg-t sm">預設拒絕：沒有宣告授權規則的路由，測試或啟動時就直接失敗</text>
</svg><figcaption>第三層最常被漏掉，因為它沒辦法用一個中介層統一處理：要先查出那筆資料，才知道它屬於誰。所以要把它寫進查詢本身。</figcaption></figure>
<h4>原則一：把擁有權寫進查詢條件</h4>
<p>最可靠的物件層授權，是讓「忘記檢查」在寫法上就做不到：查詢本身就帶著目前使用者的 ID。</p>
<pre><code>// 擁有權直接寫進 WHERE，查不到就當成不存在
async function getOrder(userId: string, orderId: string) {
  const { rows } = await db.query(
    'SELECT id, item, amount FROM orders WHERE id = $1 AND owner_id = $2',
    [orderId, userId],
  );
  return rows[0] ?? null;
}

app.get('/api/orders/:id', requireLogin, async (req, res) =&gt; {
  const order = await getOrder(req.session.userId, req.params.id);
  if (!order) return res.status(404).end();   // 不是你的，和不存在一樣
  res.json(order);
});</code></pre>
<p>注意 <code>userId</code> 來自伺服器端的工作階段，不是來自請求內容。為什麼回 404 不回 403？因為 403 等於告訴對方「這筆存在，只是你不能看」，404 連存在與否都不透露。功能層（例如「你不是管理員」）回 403 就好，那不是祕密。</p>
<h4>原則二：集中、而且預設拒絕</h4>
<p>授權散落在一百個處理函式裡，總有一個會漏。把它收到一個地方，並且讓「沒寫授權規則」變成錯誤：</p>
<pre><code>type Policy = (req: Request) =&gt; boolean | Promise&lt;boolean&gt;;

// 註冊路由一定要給授權規則，少了這個參數就編譯不過
function route(method: 'get' | 'post', path: string, policy: Policy, handler: Handler) {
  router[method](path, async (req, res, next) =&gt; {
    if (!(await policy(req))) return res.status(403).end();
    return handler(req, res, next);
  });
}

route('get', '/admin/users', isAdmin, listUsers);
route('get', '/health', isPublic, health);   // 公開的路由也要明寫</code></pre>
<p>「公開也要明寫」是重點：當公開是一個要特別宣告的選擇，審查程式碼的人一眼就看得到哪些路由沒有保護。</p>
<h4>原則三：用戶端送來的身分、角色、價格，一個都不收</h4>
<p>使用者更新個人資料時，如果伺服器把整個請求內容直接寫進資料庫，請求裡多帶一個 <code>role</code> 或 <code>balance</code> 欄位，也會一起被寫進去。這叫<b>大量指派</b>（mass assignment）。修法是用結構描述（schema）明列允許的欄位：</p>
<pre><code>import { z } from 'zod';

const UpdateProfile = z.object({
  nickname: z.string().min(1).max(20),
  avatarId: z.number().int().positive(),
});

const input = UpdateProfile.parse(req.body);   // 沒列出的欄位會被丟掉
await db.query('UPDATE users SET nickname = $1, avatar_id = $2 WHERE id = $3',
  [input.nickname, input.avatarId, req.session.userId]);</code></pre>
<p>價格也一樣：用戶端只送「商品 ID 和數量」，價格由伺服器從自己的資料表查。</p>
<h4>怎麼在自己的系統上驗證：兩個帳號</h4>
<p>在你自己的開發或測試環境建兩個帳號 A 和 B。用 A 建立各種資源（訂單、存檔、個人資料），再用 B 的工作階段去讀、改、刪 A 的每一個資源，全部都要失敗。手動做一次之後，寫成自動化測試：</p>
<pre><code>// 只在你自己的測試環境執行
const created = await as(alice).post('/api/orders').send({ itemId: 42, qty: 1 });
const url = '/api/orders/' + created.body.id;

for (const method of ['get', 'patch', 'delete'] as const) {
  const res = await as(bob)[method](url);
  expect([403, 404]).toContain(res.status);
}</code></pre>
<p>每新增一種資源，就往這個測試加一行。多租戶（multi-tenant）系統還可以在資料庫加一層保險：PostgreSQL 的<b>資料列層級安全</b>（row-level security，RLS）讓資料庫自己依租戶過濾，應用程式就算漏寫條件，也查不到別人的資料。</p>

<h3><span class="badge lv2">進階</span>三、注入：讓資料永遠只是資料</h3>
<p>機制就是第一節那張圖：輸入被拼進一段會被解析的文字裡。修法是改用<b>把範本和值分開傳</b>的 API，資料庫驅動程式會把它們分別送給資料庫。</p>
<pre><code>// 不要：把輸入拼進字串（這裡只示範形狀）
//   "SELECT id FROM users WHERE email = '" + email + "'"

// Node.js（node-postgres）：$1 是佔位符，值放在第二個參數
await db.query('SELECT id, nickname FROM users WHERE email = $1', [email]);</code></pre>
<pre><code>// Go（database/sql）：同樣是佔位符加參數
row := db.QueryRowContext(ctx,
    "SELECT id, nickname FROM users WHERE email = $1", email)</code></pre>
<h4>ORM 的逃生口</h4>
<p>ORM 平常都幫你參數化了，危險在「寫原始 SQL」的那幾個函式。記住每個工具裡哪個是安全版、哪個不是：</p>
<table>
<tr><th>工具</th><th>安全的寫法</th><th>要小心的寫法</th></tr>
<tr><td>Prisma</td><td><code>$queryRaw</code> 搭配標籤範本（值會自動變成參數）</td><td><code>$queryRawUnsafe</code> 傳入拼好的字串</td></tr>
<tr><td>Knex</td><td><code>knex.raw(sql, bindings)</code>，用 <code>?</code> 當佔位符</td><td>把值直接拼進 <code>raw</code> 的字串</td></tr>
<tr><td>Sequelize</td><td><code>sequelize.query</code> 搭配 <code>replacements</code> 或 <code>bind</code></td><td>拼好的查詢字串</td></tr>
<tr><td>GORM（Go）</td><td><code>Where("email = ?", email)</code></td><td>用 <code>fmt.Sprintf</code> 組 SQL</td></tr>
</table>
<h4>不能參數化的地方：用允許清單對照</h4>
<p>佔位符只能放「值」，不能放欄位名稱、資料表名稱、排序方向。玩家想選排序方式時，不要把他給的字串放進 SQL，而是用一張對照表，把他的選擇換成你事先寫好的片段：</p>
<pre><code>const SORT = {
  newest: 'created_at DESC',
  biggest: 'amount DESC',
} as const;

const key = String(req.query.sort) as keyof typeof SORT;
const orderBy = SORT[key] ?? SORT.newest;   // 不在表上，就用預設值
const sql = 'SELECT id, amount FROM rounds WHERE user_id = $1 ORDER BY ' + orderBy + ' LIMIT 50';</code></pre>
<p>這裡的字串拼接是安全的，因為被拼進去的只可能是你自己寫的那兩段，跟使用者輸入完全沒有關係。</p>
<h4>shell 指令和其他解析器</h4>
<ul>
<li><b>shell</b>：Node.js 用 <code>execFile</code> 或 <code>spawn</code>，把參數放在陣列裡，不經過 shell 解析；Go 的 <code>exec.Command(name, args...)</code> 本來就不經過 shell。更好的做法是直接用函式庫，例如處理圖片就用圖片函式庫，不要呼叫外部指令。</li>
<li><b>NoSQL</b>：JSON 請求可以送出物件，不只是字串。如果查詢語言會把物件解讀成運算子，原本預期的「比對一個字串」就可能變成別的條件。防法是先用 schema 驗證型別：預期字串，就只接受字串。</li>
<li><b>範本引擎</b>：使用者輸入只能當範本的「資料」，不能當範本本身被編譯。</li>
</ul>
<p>最後再加一層縱深：應用程式連資料庫用的帳號只拿它需要的權限（第 5.1 課）。就算哪天真的有一個注入點，它也不能刪表、讀不到別的服務的資料。</p>

<h3><span class="badge lv2">進階</span>四、XSS：依情境輸出編碼，再用 CSP 兜底</h3>
<p>XSS 的機制，是使用者提供的文字在別人的瀏覽器裡被 HTML 解析器當成標記或程式碼。它跟 SQL 注入是同一個病，只是解析器換成了瀏覽器。第一道防線是<b>輸出編碼</b>（output encoding）：資料要放到哪個位置，就用那個位置的規則轉換。</p>
<table>
<tr><th>資料放在哪裡</th><th>要做什麼</th><th>在框架裡</th></tr>
<tr><td>HTML 內文</td><td>HTML 實體編碼</td><td>Vue 的 <code>{{ }}</code>、React 的 <code>{}</code>、<code>textContent</code> 都會自動處理</td></tr>
<tr><td>HTML 屬性值</td><td>屬性編碼，而且一定加引號</td><td>用框架的屬性綁定，不要自己拼標籤</td></tr>
<tr><td>網址（<code>href</code>、<code>src</code>）</td><td>先檢查協定只能是 <code>https:</code> 或 <code>http:</code>，再編碼</td><td>框架不會替你檢查協定，要自己做</td></tr>
<tr><td>JavaScript 程式碼裡</td><td>不要把資料寫進腳本；放進 <code>data-</code> 屬性或 JSON，再由程式讀出來</td><td>伺服器端範本最容易犯</td></tr>
<tr><td>使用者自己寫的 HTML（富文字）</td><td>用 DOMPurify 這類消毒器，只留允許的標籤</td><td>消毒完才能交給 <code>v-html</code></td></tr>
</table>
<p>框架預設都幫你編碼了，所以真正的風險集中在幾個<b>逃生口</b>：Vue 的 <code>v-html</code>、React 的 <code>dangerouslySetInnerHTML</code>、原生的 <code>innerHTML</code> 和 <code>insertAdjacentHTML</code>，以及伺服器端範本裡「不編碼」的輸出語法（EJS 的 <code>&lt;%-</code>、Handlebars 的三層大括號、Jinja 的 <code>|safe</code>）。在 CI 裡用 Semgrep 或 ESLint 規則把這些用法全部列出來，每一個都要有人看過、有理由。</p>
<p>遊戲也一樣。聊天室、暱稱、公會名稱，一律當純文字顯示。Cocos 的 RichText 會解讀它自己的格式標籤，玩家的文字直接丟進去，別人就能插入你沒預期的格式，所以要先跳脫，或改用一般的 Label。</p>
<h4>第二道防線：Content-Security-Policy</h4>
<p>編碼總有一天會漏一處。<b>內容安全政策</b>（Content-Security-Policy，CSP）是一個回應標頭，告訴瀏覽器「這個頁面只准執行哪些腳本」。就算有一段標記被注入了，只要它不在政策允許的範圍內，瀏覽器就不執行。</p>
<figure class="figure"><svg viewBox="0 0 680 250" class="fg" style="width:100%;max-width:680px" role="img" aria-label="回應標頭帶著 CSP，瀏覽器比對四種腳本：帶正確 nonce 的腳本和它載入的腳本可以執行，沒有 nonce 的行內腳本和屬性裡的事件處理器被擋下並回報">
<rect x="20" y="14" width="640" height="34" rx="5" class="fg-b alt"/>
<text x="32" y="36" class="fg-t sm mono">Content-Security-Policy: script-src 'nonce-r4nd0m' 'strict-dynamic'; object-src 'none'</text>
<line x1="380" y1="48" x2="380" y2="62" class="fg-l"/><polygon points="380,70 375.5,62 384.5,62" class="fg-a"/>
<rect x="20" y="74" width="250" height="34" rx="5" class="fg-b"/><text x="34" y="96" class="fg-t">帶正確 nonce 的 &lt;script&gt;</text>
<rect x="20" y="116" width="250" height="34" rx="5" class="fg-b"/><text x="34" y="138" class="fg-t">它再動態載入的腳本</text>
<rect x="20" y="158" width="250" height="34" rx="5" class="fg-b warm"/><text x="34" y="180" class="fg-t">沒有 nonce 的行內腳本</text>
<rect x="20" y="200" width="250" height="34" rx="5" class="fg-b warm"/><text x="34" y="222" class="fg-t">HTML 屬性裡的事件處理器</text>
<rect x="320" y="70" width="120" height="168" rx="6" class="fg-b"/><text x="380" y="148" text-anchor="middle" class="fg-t lg">瀏覽器</text><text x="380" y="170" text-anchor="middle" class="fg-t sm">逐一比對政策</text>
<line x1="270" y1="91" x2="312" y2="91" class="fg-l"/><polygon points="320,91 312,86.5 312,95.5" class="fg-a"/>
<line x1="270" y1="133" x2="312" y2="133" class="fg-l"/><polygon points="320,133 312,128.5 312,137.5" class="fg-a"/>
<line x1="270" y1="175" x2="312" y2="175" class="fg-l"/><polygon points="320,175 312,170.5 312,179.5" class="fg-a"/>
<line x1="270" y1="217" x2="312" y2="217" class="fg-l"/><polygon points="320,217 312,212.5 312,221.5" class="fg-a"/>
<line x1="440" y1="91" x2="482" y2="91" class="fg-l on"/><polygon points="490,91 482,86.5 482,95.5" class="fg-a on"/>
<line x1="440" y1="133" x2="482" y2="133" class="fg-l on"/><polygon points="490,133 482,128.5 482,137.5" class="fg-a on"/>
<line x1="440" y1="175" x2="482" y2="175" class="fg-l warm"/><polygon points="490,175 482,170.5 482,179.5" class="fg-a warm"/>
<line x1="440" y1="217" x2="482" y2="217" class="fg-l warm"/><polygon points="490,217 482,212.5 482,221.5" class="fg-a warm"/>
<rect x="490" y="74" width="170" height="34" rx="5" class="fg-b hot"/><text x="575" y="96" text-anchor="middle" class="fg-t acc">執行</text>
<rect x="490" y="116" width="170" height="34" rx="5" class="fg-b hot"/><text x="575" y="138" text-anchor="middle" class="fg-t acc">執行（信任往下傳）</text>
<rect x="490" y="158" width="170" height="34" rx="5" class="fg-b warm"/><text x="575" y="180" text-anchor="middle" class="fg-t warm">擋下並回報</text>
<rect x="490" y="200" width="170" height="34" rx="5" class="fg-b warm"/><text x="575" y="222" text-anchor="middle" class="fg-t warm">擋下並回報</text>
</svg><figcaption>nonce 是伺服器每次回應都重新產生的亂數，只有你自己輸出的 script 標籤上有它。被注入的標記不知道這次的 nonce，所以不會被執行。strict-dynamic 讓你信任的腳本可以再載入其他腳本。</figcaption></figure>
<p>在 Express 裡產生 nonce，並放進標頭和範本：</p>
<pre><code>import crypto from 'node:crypto';

app.use((req, res, next) =&gt; {
  const nonce = crypto.randomBytes(16).toString('base64');   // 每個回應都不同
  res.locals.nonce = nonce;
  res.setHeader('Content-Security-Policy',
    "script-src 'nonce-" + nonce + "' 'strict-dynamic'; object-src 'none'; base-uri 'none'");
  next();
});
// 範本裡：&lt;script nonce="&lt;%= nonce %&gt;" src="/app.js"&gt;&lt;/script&gt;</code></pre>
<ul>
<li><b>先試跑再上線</b>：用 <code>Content-Security-Policy-Report-Only</code> 標頭，瀏覽器只回報、不阻擋。收集一兩週的報告，確認沒有誤擋正常功能，再換成正式的標頭。</li>
<li><b>純靜態的單頁應用</b>（例如 Vite 打包的 Vue）沒有伺服器每次產生 nonce，可以改用雜湊：把每一段允許的腳本內容算出 SHA-256，寫進政策。</li>
<li><b>其他該一起設的</b>：<code>object-src 'none'</code> 關掉外掛、<code>base-uri 'none'</code> 防止相對網址被改寫、<code>frame-ancestors</code> 決定誰可以用 iframe 嵌入你的頁面（防點擊劫持）。</li>
<li><b>Trusted Types</b>：更進一步的機制，要求所有寫進 <code>innerHTML</code> 這類危險位置的字串都先經過你定義的處理函式。目前以 Chromium 系瀏覽器的支援最完整。</li>
</ul>
<p>還有一層：工作階段的 cookie 設成 HttpOnly，就算腳本真的跑起來，也讀不到它（第 0.12 課有每個 cookie 屬性的細節）。</p>

<h3><span class="badge lv2">進階</span>五、CSRF：SameSite 打底，再加來源檢查和 token</h3>
<p>第 0.12 課講過同源政策「擋讀不擋送」：別的網站讀不到你的回應，但它可以讓使用者的瀏覽器送出一個請求到你的網站，瀏覽器還可能自動帶上 cookie。CSRF 的防禦就是讓伺服器分辨「這個請求是不是從我自己的頁面發出的」。由淺到深疊四層：</p>
<ol>
<li><b>SameSite cookie</b>：工作階段 cookie 設 <code>SameSite=Lax</code>（或 Strict）。跨站的 POST 不帶 cookie，大部分 CSRF 就沒用了。</li>
<li><b>不用 GET 改資料</b>：GET 只讀。Lax 會在跨站的整頁跳轉時帶 cookie，所以任何會改狀態的操作都必須是 POST、PUT、PATCH 或 DELETE。</li>
<li><b>檢查來源標頭</b>：現代瀏覽器會在請求上加 <code>Sec-Fetch-Site</code>（fetch metadata），值是 <code>same-origin</code>、<code>same-site</code>、<code>cross-site</code> 或 <code>none</code>；POST 請求通常也會帶 <code>Origin</code>。伺服器可以直接拒絕跨站來的修改請求。</li>
<li><b>anti-CSRF token</b>：伺服器替每個工作階段產生一個隨機值，頁面送出修改請求時放在表單欄位或自訂標頭裡，伺服器比對。外站拿不到這個值，因為它讀不到你的頁面。</li>
</ol>
<pre><code>const ALLOWED_ORIGINS = new Set(['https://game.example.com']);
const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

app.use((req, res, next) =&gt; {
  if (SAFE.has(req.method)) return next();
  const site = req.get('Sec-Fetch-Site');
  if (site &amp;&amp; site !== 'same-origin') return res.status(403).end();
  const origin = req.get('Origin');
  if (origin &amp;&amp; !ALLOWED_ORIGINS.has(origin)) return res.status(403).end();
  next();   // 之後再由 CSRF token 中介層做最後一道檢查
});</code></pre>
<p>為什麼有了 SameSite 還要 token？因為 SameSite 看的是「站點」，同一個主網域底下的子網域都算自己人；只要其中一個子網域出問題（例如一筆忘了刪的 DNS 紀錄），SameSite 就擋不住。token 綁在工作階段上，不受這個影響。如果你用的是 <code>Authorization</code> 標頭帶 token、而不是 cookie，瀏覽器不會自動附上它，CSRF 就不成立，但代價是 token 放在 JavaScript 拿得到的地方，這個取捨第 5.3 課會細講。</p>
<p><b>驗證</b>：在整合測試裡送三種修改請求：帶 <code>Sec-Fetch-Site: cross-site</code> 的、<code>Origin</code> 不在允許清單的、沒有 CSRF token 的，三個都要回 403；正常從自己頁面送出的，要成功。</p>

<h3><span class="badge lv3">專業</span>六、SSRF：伺服器替別人送出的請求</h3>
<p>很多功能需要伺服器去抓一個使用者給的網址：抓頭像、產生連結預覽、呼叫使用者設定的 webhook。問題在於，伺服器站在信任邊界的<b>裡面</b>。它連得到內部的管理介面、資料庫、以及雲端的中繼資料服務（metadata service），而這些東西從網際網路是連不到的。如果伺服器照單全收，使用者就等於借用了伺服器的位置。第 5.1 課的 Capital One 事故，就是這個機制加上權限太大的角色。</p>
<p>防守的順序是：能不收網址就不收；一定要收，就層層檢查；最後在網路層再擋一次。</p>
<figure class="figure"><svg viewBox="0 0 680 275" class="fg" style="width:100%;max-width:680px" role="img" aria-label="使用者給的網址依序經過三道檢查：只允許 https、解析出所有 IP 比對封鎖清單、用檢查過的 IP 連線，再經過出口代理才到公開網際網路；右上是 IMDSv2 這第二道防線">
<rect x="20" y="20" width="220" height="40" rx="5" class="fg-b"/><text x="130" y="45" text-anchor="middle" class="fg-t">使用者給的網址</text>
<rect x="20" y="80" width="220" height="40" rx="5" class="fg-b alt"/><text x="130" y="105" text-anchor="middle" class="fg-t">1 只允許 https</text>
<rect x="20" y="140" width="220" height="40" rx="5" class="fg-b alt"/><text x="130" y="165" text-anchor="middle" class="fg-t">2 解析出所有 IP，逐一比對</text>
<rect x="20" y="200" width="220" height="40" rx="5" class="fg-b alt"/><text x="130" y="225" text-anchor="middle" class="fg-t">3 用檢查過的 IP 連線</text>
<line x1="130" y1="60" x2="130" y2="72" class="fg-l"/><polygon points="130,80 125.5,72 134.5,72" class="fg-a"/>
<line x1="130" y1="120" x2="130" y2="132" class="fg-l"/><polygon points="130,140 125.5,132 134.5,132" class="fg-a"/>
<line x1="130" y1="180" x2="130" y2="192" class="fg-l"/><polygon points="130,200 125.5,192 134.5,192" class="fg-a"/>
<rect x="290" y="20" width="170" height="110" rx="5" class="fg-b warm"/>
<text x="375" y="42" text-anchor="middle" class="fg-t warm">封鎖的位址範圍</text>
<text x="375" y="64" text-anchor="middle" class="fg-t sm mono">127.0.0.0/8  ::1</text>
<text x="375" y="82" text-anchor="middle" class="fg-t sm mono">10/8  172.16/12</text>
<text x="375" y="100" text-anchor="middle" class="fg-t sm mono">192.168/16  fc00::/7</text>
<text x="375" y="118" text-anchor="middle" class="fg-t sm mono">169.254.0.0/16</text>
<path d="M240 160 H265 V75 H282" class="fg-l warm"/><polygon points="290,75 282,70.5 282,79.5" class="fg-a warm"/>
<text x="375" y="152" text-anchor="middle" class="fg-t sm warm">命中任何一段就拒絕</text>
<rect x="500" y="20" width="160" height="110" rx="5" class="fg-b alt"/>
<text x="580" y="42" text-anchor="middle" class="fg-t alt">第二道防線</text>
<text x="580" y="66" text-anchor="middle" class="fg-t sm">IMDSv2：要先拿 token</text>
<text x="580" y="86" text-anchor="middle" class="fg-t sm">hop limit 設成 1</text>
<text x="580" y="106" text-anchor="middle" class="fg-t sm">容器多一跳就拿不到</text>
<rect x="290" y="200" width="170" height="40" rx="5" class="fg-b hot"/><text x="375" y="225" text-anchor="middle" class="fg-t acc">出口代理</text>
<rect x="500" y="200" width="160" height="40" rx="5" class="fg-b hot"/><text x="580" y="225" text-anchor="middle" class="fg-t acc">公開網際網路</text>
<line x1="240" y1="220" x2="282" y2="220" class="fg-l on"/><polygon points="290,220 282,215.5 282,224.5" class="fg-a on"/>
<line x1="460" y1="220" x2="492" y2="220" class="fg-l on"/><polygon points="500,220 492,215.5 492,224.5" class="fg-a on"/>
<text x="375" y="262" text-anchor="middle" class="fg-t sm">只放行允許的網域</text>
<text x="580" y="262" text-anchor="middle" class="fg-t sm">設超時與大小上限</text>
</svg><figcaption>檢查的對象是「解析出來、真正要連的 IP」，不是網址字串，因為同一個目的地有很多種寫法。程式層的檢查之外，網路層的出口代理和 IMDSv2 是兩道獨立的保險。</figcaption></figure>
<h4>一張清單，照順序做</h4>
<ol>
<li><b>能不收網址就不收。</b>讓使用者從清單裡選一個整合對象（給 ID），伺服器自己查出對應的網址。</li>
<li><b>收網址就用允許清單。</b>只接受你認得的網域，而且只接受 <code>https:</code>。</li>
<li><b>一定要接受任意網址時</b>（例如使用者自訂的 webhook），解析 DNS 得到所有 IP，每一個都比對封鎖範圍；而且<b>連線用的必須是你檢查過的那個 IP</b>，不能檢查一次、連線時再解析一次，因為兩次的結果可能不同。</li>
<li><b>不要自動跟隨重新導向</b>，或每一跳都重新檢查。Node.js 內建的 <code>http</code> 模組本來就不跟隨；<code>fetch</code> 預設會跟，要設 <code>redirect: 'manual'</code>。</li>
<li><b>設上限</b>：連線和讀取都要超時，回應大小要有上限，回給使用者的只有「成功或失敗」，不要把對方的回應內容原樣轉回去。</li>
</ol>
<p>第 3 點在 Node.js 可以用 <code>lookup</code> 這個掛鉤做到：它就是連線當下用來解析名稱的函式，在裡面檢查，檢查到的就是實際連上的。</p>
<pre><code>import dns from 'node:dns';
import net from 'node:net';

const blocked = new net.BlockList();
blocked.addSubnet('0.0.0.0', 8);      blocked.addSubnet('10.0.0.0', 8);
blocked.addSubnet('100.64.0.0', 10);  blocked.addSubnet('127.0.0.0', 8);
blocked.addSubnet('169.254.0.0', 16); blocked.addSubnet('172.16.0.0', 12);
blocked.addSubnet('192.168.0.0', 16);
blocked.addSubnet('::1', 128, 'ipv6');   blocked.addSubnet('fc00::', 7, 'ipv6');
blocked.addSubnet('fe80::', 10, 'ipv6'); blocked.addSubnet('::ffff:0:0', 96, 'ipv6');

export function safeLookup(host, opts, cb) {
  dns.lookup(host, { ...opts, all: true }, (err, addrs) =&gt; {
    if (err) return cb(err);
    const bad = addrs.some(a =&gt; blocked.check(a.address, a.family === 6 ? 'ipv6' : 'ipv4'));
    if (bad) return cb(new Error('destination not allowed'));
    if (opts.all) return cb(null, addrs);
    cb(null, addrs[0].address, addrs[0].family);
  });
}
// 使用：https.get(url, { lookup: safeLookup, timeout: 5000 }, onResponse)</code></pre>
<h4>網路層的兩道保險</h4>
<ul>
<li><b>出口代理</b>（egress proxy）：所有「替使用者抓網址」的請求，都從一個獨立網段的代理出去，那個網段沒有通往內部的路由。程式的檢查就算有漏洞，封包也走不到內部。</li>
<li><b>IMDSv2</b>：AWS 的中繼資料服務第二版，要先用 PUT 請求拿一個短效 token，之後每次讀取都要在標頭帶上它。單純「讓伺服器去 GET 一個網址」做不到這兩步。再把 hop limit 設成 1，封包多經過一跳（例如從 Docker 容器出來）就到不了。</li>
</ul>
<pre><code># 在你自己的 EC2 執行個體上強制只用 IMDSv2
aws ec2 modify-instance-metadata-options --instance-id i-0123456789abcdef0 \\
  --http-tokens required --http-put-response-hop-limit 1</code></pre>
<p>AWS 也可以在帳號層級把新執行個體的預設設成只用 IMDSv2。最後還有第 5.5 課的原則：機器的角色只給它需要的權限，就算憑證外流，能做的事也很少。</p>

<h3><span class="badge lv3">專業</span>七、反序列化、安全設定與標頭</h3>
<h4>不安全的反序列化</h4>
<p>有些序列化格式不只描述資料，還描述「這是哪一個類別的物件」。反序列化時，程式會照著資料去建立那些物件，有些類別在建立過程中就會執行程式碼。所以當資料來自不可信的一方，<b>選哪一種格式</b>本身就是一個安全決定。</p>
<table>
<tr><th>格式或做法</th><th>對不可信資料</th><th>改用什麼</th></tr>
<tr><td>Python 的 <code>pickle</code></td><td>不安全，官方文件明說不要拿來讀不可信的資料</td><td>JSON 加 schema 驗證</td></tr>
<tr><td>Java 原生序列化</td><td>不安全，歷史上出過大量問題</td><td>JSON，並且只對應到明確的類別</td></tr>
<tr><td>.NET 的 <code>BinaryFormatter</code>（Unity 的舊教學常見）</td><td>不安全，微軟已正式淘汰</td><td>JSON（例如 <code>JsonUtility</code>）或 MessagePack 搭配明確型別</td></tr>
<tr><td>YAML</td><td>看函式庫：有些預設會建立任意物件</td><td>Python 用 <code>yaml.safe_load</code></td></tr>
<tr><td>JavaScript 的 <code>JSON.parse</code></td><td>不會執行程式碼，但要小心下面的原型汙染</td><td>搭配 schema 驗證</td></tr>
</table>
<p>Node.js 的特殊問題是<b>原型汙染</b>（prototype pollution）。JavaScript 的物件會從原型繼承屬性；如果程式拿使用者送來的 JSON，用一個「遞迴合併」函式併進設定物件，而那份 JSON 裡有名字特殊的鍵（例如 <code>__proto__</code>），合併函式可能一路改到所有物件共用的原型，影響整個行程。防法：用 schema 驗證，只留下你列出的鍵；需要「任意鍵」的對照表時用 <code>Map</code> 或 <code>Object.create(null)</code>；不要拿不可信的輸入做深度合併；啟動 Node.js 時可以加 <code>--disable-proto=delete</code>，把 <code>__proto__</code> 這個存取器整個拿掉。</p>
<p>遊戲的存檔和封包也一樣：用只描述資料的格式，讀進來先驗證欄位和範圍。如果狀態一定要交給用戶端保管再送回來，就用伺服器才知道的金鑰加上 HMAC，回來時先驗章；但更好的做法是狀態留在伺服器，用戶端只拿一個 ID。</p>
<h4>安全設定：預設值通常是為了方便，不是為了安全</h4>
<ul>
<li><b>錯誤訊息</b>：使用者只看到一般的錯誤和一個追蹤編號，細節（堆疊追蹤、SQL）寫進伺服器日誌。Express 要設 <code>NODE_ENV=production</code>，預設的錯誤處理才不會把堆疊追蹤回給瀏覽器。</li>
<li><b>不該公開的檔案</b>：在反向代理擋掉所有點開頭的路徑（<code>.git</code>、<code>.env</code>），只留 <code>.well-known</code>。</li>
<li><b>預設帳號、範例頁面、除錯端點</b>：上線前全部移除或關掉。</li>
<li><b>CORS</b>：用明確的允許清單，不要把請求的 Origin 原樣回給對方（第 0.12 課）。</li>
</ul>
<pre><code># nginx：伺服器層級的安全標頭與點檔案封鎖
server_tokens off;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

location ~ /\\.(?!well-known) { deny all; }</code></pre>
<table>
<tr><th>標頭</th><th>作用</th></tr>
<tr><td><code>Strict-Transport-Security</code></td><td>瀏覽器記住「這個網站只用 HTTPS」，之後不會再走明文</td></tr>
<tr><td><code>Content-Security-Policy</code></td><td>上一節的腳本白名單；<code>frame-ancestors</code> 控制誰能嵌入你</td></tr>
<tr><td><code>X-Content-Type-Options: nosniff</code></td><td>瀏覽器不准自己猜檔案類型，照你給的 Content-Type 處理</td></tr>
<tr><td><code>Referrer-Policy</code></td><td>跳到別的網站時，不要把完整網址（可能含 token）帶過去</td></tr>
<tr><td><code>Cross-Origin-Opener-Policy</code></td><td>你的頁面和別的網站開的視窗互相隔離</td></tr>
</table>
<div class="note"><b>nginx 的一個坑。</b>如果某個 <code>location</code> 區塊裡也寫了 <code>add_header</code>，那個區塊就<b>不會</b>繼承外層的任何 <code>add_header</code>。結果是某些路徑突然少了全部的安全標頭。每次改設定後，都要對不同路徑實際檢查一次回應標頭。</div>
<p><b>驗證</b>：<code>curl -sI https://你的網域/ | grep -iE 'strict-transport|content-security|nosniff'</code>，也可以用 MDN 上的 HTTP Observatory 掃你自己的網站，它會逐項說明缺了什麼。</p>

<h3><span class="badge lv3">專業</span>八、遊戲和金流：伺服器說了算</h3>
<p>碰到錢和輸贏，第 5.1 課的信任邊界要畫得最清楚：<b>用戶端只送「意圖」，伺服器決定「結果」</b>。玩家說「我猜高、押 100」，伺服器檢查、扣款、抽牌、判定、入帳，全部在自己手上完成。</p>
<figure class="figure"><svg viewBox="0 0 680 350" class="fg" style="width:100%;max-width:680px" role="img" aria-label="循序圖：用戶端送出猜高和冪等鍵，伺服器驗證後在資料庫交易裡寫入冪等鍵、條件式扣款、抽牌判定、入帳提交，再回傳結果；用戶端用同一個冪等鍵重送時，伺服器直接回傳存好的結果">
<rect x="30" y="10" width="120" height="30" rx="5" class="fg-b"/><text x="90" y="30" text-anchor="middle" class="fg-t">用戶端</text>
<rect x="270" y="10" width="140" height="30" rx="5" class="fg-b hot"/><text x="340" y="30" text-anchor="middle" class="fg-t acc">API 伺服器</text>
<rect x="520" y="10" width="120" height="30" rx="5" class="fg-b alt"/><text x="580" y="30" text-anchor="middle" class="fg-t">資料庫</text>
<line x1="90" y1="40" x2="90" y2="340" class="fg-l dim dash"/><line x1="340" y1="40" x2="340" y2="340" class="fg-l dim dash"/><line x1="580" y1="40" x2="580" y2="340" class="fg-l dim dash"/>
<line x1="90" y1="68" x2="332" y2="68" class="fg-l"/><polygon points="340,68 332,63.5 332,72.5" class="fg-a"/>
<text x="215" y="60" text-anchor="middle" class="fg-t sm">猜高、押 100、冪等鍵 k1</text>
<rect x="262" y="80" width="156" height="28" rx="5" class="fg-b alt"/><text x="340" y="99" text-anchor="middle" class="fg-t sm">驗工作階段、金額範圍</text>
<line x1="340" y1="130" x2="572" y2="130" class="fg-l"/><polygon points="580,130 572,125.5 572,134.5" class="fg-a"/>
<text x="460" y="122" text-anchor="middle" class="fg-t sm">開交易，寫入 k1（唯一鍵）</text>
<line x1="340" y1="160" x2="572" y2="160" class="fg-l"/><polygon points="580,160 572,155.5 572,164.5" class="fg-a"/>
<text x="460" y="152" text-anchor="middle" class="fg-t sm">條件式扣 100：1,000 → 900</text>
<rect x="262" y="172" width="156" height="28" rx="5" class="fg-b hot"/><text x="340" y="191" text-anchor="middle" class="fg-t sm">伺服器抽牌、判定輸贏</text>
<line x1="340" y1="222" x2="572" y2="222" class="fg-l"/><polygon points="580,222 572,217.5 572,226.5" class="fg-a"/>
<text x="460" y="214" text-anchor="middle" class="fg-t sm">入帳 200、寫帳本、存結果、提交</text>
<line x1="340" y1="252" x2="98" y2="252" class="fg-l on"/><polygon points="90,252 98,247.5 98,256.5" class="fg-a on"/>
<text x="215" y="244" text-anchor="middle" class="fg-t sm acc">結果：7 之後是 9，贏了</text>
<line x1="90" y1="290" x2="332" y2="290" class="fg-l alt dash"/><polygon points="340,290 332,285.5 332,294.5" class="fg-a alt"/>
<text x="215" y="282" text-anchor="middle" class="fg-t sm alt">沒收到回應，重送同一個 k1</text>
<line x1="340" y1="320" x2="98" y2="320" class="fg-l alt"/><polygon points="90,320 98,315.5 98,324.5" class="fg-a alt"/>
<text x="215" y="312" text-anchor="middle" class="fg-t sm alt">回傳存好的結果，不再扣款</text>
</svg><figcaption>用戶端只送三樣東西：猜高還是猜低、押多少、這次操作的冪等鍵。牌是伺服器抽的，結果是伺服器算的，餘額從 1,000 扣到 900 再入帳 200 變成 1,100，全部在同一個資料庫交易裡完成。</figcaption></figure>
<h4>競爭條件：為什麼「先讀、再判斷、再寫」會出事</h4>
<p>「讀餘額 → 判斷夠不夠 → 寫回新餘額」寫成三個步驟，單獨跑一次完全正確。問題出在兩個請求同時到達：兩個都在對方寫回之前讀到舊的餘額，兩個都判斷「夠」。這不需要什麼技術，網路一延遲、使用者連點兩下就會發生。</p>
<figure class="figure"><svg viewBox="0 0 680 245" class="fg" style="width:100%;max-width:680px" role="img" aria-label="左邊兩個請求都先讀到餘額 100、各自扣款寫回 0，結果兩筆都成功；右邊用一條條件式更新，第二個請求等第一個提交後重新檢查條件，影響 0 列而被拒絕">
<line x1="340" y1="10" x2="340" y2="240" class="fg-l dim"/>
<text x="180" y="22" text-anchor="middle" class="fg-t warm">先讀、再判斷、再寫（錯）</text>
<text x="107" y="44" text-anchor="middle" class="fg-t sm">請求 A</text><text x="252" y="44" text-anchor="middle" class="fg-t sm">請求 B</text>
<rect x="40" y="54" width="135" height="30" rx="5" class="fg-b"/><text x="107" y="74" text-anchor="middle" class="fg-t">讀到餘額 100</text>
<rect x="185" y="92" width="135" height="30" rx="5" class="fg-b"/><text x="252" y="112" text-anchor="middle" class="fg-t">讀到餘額 100</text>
<rect x="40" y="130" width="135" height="30" rx="5" class="fg-b"/><text x="107" y="150" text-anchor="middle" class="fg-t">扣 100，寫回 0</text>
<rect x="185" y="168" width="135" height="30" rx="5" class="fg-b warm"/><text x="252" y="188" text-anchor="middle" class="fg-t">扣 100，寫回 0</text>
<line x1="22" y1="54" x2="22" y2="192" class="fg-l"/><polygon points="22,200 17.5,192 26.5,192" class="fg-a"/><text x="22" y="216" text-anchor="middle" class="fg-t sm">時間</text>
<text x="190" y="232" text-anchor="middle" class="fg-t warm">兩筆都成功：只扣一次，出兩次貨</text>
<text x="510" y="22" text-anchor="middle" class="fg-t acc">一條條件式更新（對）</text>
<text x="430" y="44" text-anchor="middle" class="fg-t sm">請求 A</text><text x="590" y="44" text-anchor="middle" class="fg-t sm">請求 B</text>
<rect x="360" y="54" width="140" height="44" rx="5" class="fg-b hot"/><text x="430" y="72" text-anchor="middle" class="fg-t">條件式扣款</text><text x="430" y="90" text-anchor="middle" class="fg-t sm">影響 1 列，餘額 0</text>
<rect x="515" y="92" width="150" height="44" rx="5" class="fg-b"/><text x="590" y="110" text-anchor="middle" class="fg-t">等 A 的列鎖</text><text x="590" y="128" text-anchor="middle" class="fg-t sm">A 提交後重新檢查</text>
<rect x="515" y="150" width="150" height="44" rx="5" class="fg-b warm"/><text x="590" y="168" text-anchor="middle" class="fg-t">影響 0 列</text><text x="590" y="186" text-anchor="middle" class="fg-t sm">回「餘額不足」</text>
<text x="510" y="232" text-anchor="middle" class="fg-t acc">只會成功一次，餘額不會變負</text>
</svg><figcaption>左邊錯在「判斷」和「寫入」之間有空隙。右邊把判斷放進 UPDATE 的 WHERE 條件裡，資料庫用列鎖保證同一列一次只有一個交易在改，第二個交易拿到鎖之後會重新檢查條件。</figcaption></figure>
<p>把冪等鍵和條件式扣款放在同一個交易裡（第 3.2 課講過交易和隔離層級）：</p>
<pre><code>-- 資料表：同一個使用者的同一個冪等鍵只能出現一次，金額一定是正數
CREATE TABLE bets (
  user_id   bigint NOT NULL,
  idem_key  uuid   NOT NULL,
  amount    bigint NOT NULL CHECK (amount &gt; 0),   -- 以最小單位存整數，不用浮點數
  choice    text   NOT NULL CHECK (choice IN ('higher', 'lower')),
  result    jsonb,
  PRIMARY KEY (user_id, idem_key)
);

BEGIN;
-- 1. 佔住冪等鍵；同一個鍵第二次進來，這裡什麼都不會插入
INSERT INTO bets (user_id, idem_key, amount, choice) VALUES ($1, $2, $3, $4)
ON CONFLICT (user_id, idem_key) DO NOTHING RETURNING idem_key;
-- 沒有回傳任何列：ROLLBACK，查出這個鍵存好的 result 直接回給用戶端

-- 2. 條件式扣款：餘額不夠就影響 0 列
UPDATE wallets SET balance = balance - $3
WHERE user_id = $1 AND balance &gt;= $3 RETURNING balance;
-- 影響 0 列：ROLLBACK，回「餘額不足」

-- 3. 伺服器抽牌、判定、入帳、寫帳本、把結果存回 bets.result
COMMIT;</code></pre>
<p>這段設計同時擋掉好幾件事：金額填負數或零被 <code>CHECK</code> 擋下；同一個請求被重送，只會執行一次；兩個請求同時扣款，餘額不會變負；用戶端想自己決定輸贏，根本沒有欄位可以送。如果兩個相同的鍵剛好同時到達，第二個 INSERT 會等第一個交易結束，再發現衝突，不會重複扣款。</p>
<h4>其他碰錢的系統一定要有的</h4>
<ul>
<li><b>亂數用密碼學等級的</b>：Node.js 用 <code>crypto.randomInt</code>，Go 用 <code>crypto/rand</code>，不要用 <code>Math.random</code>（第 0.15 課）。下一張牌和亂數種子只存在伺服器，回應裡絕對不帶。</li>
<li><b>可驗證的公平</b>：想讓玩家事後能驗證你沒有作弊，可以在一局開始前先公布「這局種子的雜湊值」，結束後再公布種子本身，玩家自己算雜湊比對（commit-reveal）。</li>
<li><b>限速分好幾層</b>：每個帳號、每個來源位址、每一種操作各自限速（例如用 Redis 做令牌桶），超過就回 429。登入、下注、出金的上限各不相同。</li>
<li><b>業務上限</b>：單筆最高金額、單日出金上限、新帳號的冷卻期。這些上限跟程式有沒有 bug 無關，是最後一道保險。</li>
<li><b>帳本只能新增</b>：每一筆餘額變動都寫一筆帳本紀錄（誰、多少、原因、對應的冪等鍵），餘額可以從帳本重算。對帳對不上，就是警報。</li>
</ul>

<h3><span class="badge lv4">專家</span>九、證明你修好了：在自己的系統上驗證</h3>
<p>「我改好了」不算數，「這個測試會在它壞掉時變紅」才算。每一類防禦都要有一個自動化的證明，放進 CI：</p>
<table>
<tr><th>防禦</th><th>自動化的證明</th></tr>
<tr><td>存取控制</td><td>兩個帳號的交叉測試（第二節），每種資源都要列入</td></tr>
<tr><td>注入</td><td>Semgrep 或 CodeQL 規則：禁止在查詢函式裡使用字串拼接</td></tr>
<tr><td>XSS</td><td>lint 規則列出所有 <code>v-html</code>、<code>innerHTML</code>；CSP 違規報告的數量做成圖表</td></tr>
<tr><td>CSRF</td><td>跨站來源、缺 token 的修改請求，測試期望 403</td></tr>
<tr><td>安全標頭</td><td>部署後對幾個不同路徑抓回應標頭，缺了就讓管線失敗</td></tr>
<tr><td>競爭條件</td><td>下面這個平行請求測試</td></tr>
</table>
<pre><code>// 只在你自己的測試環境執行：餘額 1,000，同時送 20 筆各提領 100
await setBalance(alice, 1000);
const results = await Promise.all(
  Array.from({ length: 20 }, () =&gt;
    as(alice).post('/api/withdraw').send({ amount: 100, key: crypto.randomUUID() })),
);
expect(results.filter(r =&gt; r.status === 200)).toHaveLength(10);
expect(await getBalance(alice)).toBe(0);</code></pre>
<p>這個測試在「先讀再寫」的版本上通常會失敗（成功超過 10 筆、餘額變負），改成條件式更新之後就會穩定通過。它同時是修補的證據，也是防止有人哪天「重構」回去的護欄。</p>
<h4>動態掃描和日誌</h4>
<ul>
<li><b>動態掃描</b>（DAST）：ZAP 這類工具有「基準掃描」模式，對你自己的測試環境跑一遍，找出缺少的標頭、明顯的設定錯誤。它抓不到授權和業務邏輯的問題，那些要靠上面的測試。</li>
<li><b>記錄被拒絕的事</b>（A09）：授權失敗、CSRF 檢查失敗、SSRF 被擋、CSP 違規、限速觸發，全部寫成結構化日誌，帶使用者 ID 和請求 ID。單一帳號短時間內大量觸發，就是值得看的訊號（第 6.4 課）。</li>
<li><b>外部的眼睛</b>：系統大到一定程度，找專業團隊做滲透測試，或開漏洞回報計畫（bug bounty）。兩者都要事先寫好範圍和書面授權，第 6.3 課會講怎麼合法地做。</li>
</ul>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>ID 用 UUID，別人猜不到，就不用檢查擁有權</td><td>ID 會出現在網址、日誌、分享連結裡。難猜只是減速，伺服器端檢查擁有權才是修好。</td></tr>
<tr><td>把危險字元過濾掉就能防注入</td><td>危險的寫法列不完，而且會誤傷正常輸入。參數化是結構上的分離，不需要列清單。</td></tr>
<tr><td>用了 Vue 或 React 就不會有 XSS</td><td>框架只保護預設的寫法。<code>v-html</code>、<code>innerHTML</code>、使用者給的網址、伺服器端範本都還是你的責任。</td></tr>
<tr><td>有 HTTPS 就安全了</td><td>HTTPS 保護的是傳輸途中。授權、注入、邏輯錯誤，HTTPS 一個都管不到。</td></tr>
<tr><td>有 CORS 設定就能防 CSRF</td><td>CORS 控制的是別的網站能不能「讀」回應，擋不住「送出」請求。CSRF 要靠 SameSite、來源檢查和 token。</td></tr>
<tr><td>前端已經驗證過了</td><td>前端驗證是為了使用者體驗。請求可以不經過你的前端直接送到伺服器。</td></tr>
<tr><td>WAF 會擋掉這些攻擊</td><td>WAF 是一張安全網，擋已知的特徵。授權錯誤和業務邏輯漏洞，在它看來都是正常請求。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>Vue 和 TypeScript 前端</b>：全專案搜尋 <code>v-html</code> 和 <code>innerHTML</code>，每一個都確認資料來源；使用者給的網址放進 <code>href</code> 前先檢查協定；部署設定裡加上 CSP，先用 Report-Only。</li>
<li><b>Node.js 和 Go 後端</b>：授權收進中央的路由註冊函式；查詢全部參數化；請求內容一律先過 schema；錯誤處理不回堆疊追蹤。</li>
<li><b>遊戲伺服器</b>：用戶端只送意圖；扣款用條件式更新；每個會改餘額的操作都帶冪等鍵；WebSocket 訊息也要做和 HTTP 一樣的授權和限速。</li>
<li><b>Docker 和雲端</b>：EC2 強制 IMDSv2；替使用者抓網址的服務放在出口受限的網段；容器不要用能讀所有東西的角色。</li>
<li><b>Code review</b>：看到字串拼接進查詢、看到 <code>req.body</code> 被整包寫進資料庫、看到新路由沒有授權規則，都是要停下來問的地方。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<ol>
<li>「把 /orders/1001 改成 1002 就看到別人的訂單。你會怎麼修？怎麼確保以後不再發生？」</li>
<li>「為什麼參數化查詢能防注入，而過濾特殊字元不行？有沒有參數化做不到的地方？」</li>
<li>「已經用了 Vue，為什麼還需要 CSP？nonce 型的 CSP 怎麼運作？」</li>
<li>「SameSite cookie 已經擋住大部分 CSRF 了，什麼情況下還需要 CSRF token？」</li>
<li>「你們的服務要讓使用者設定 webhook 網址，你會怎麼防 SSRF？」</li>
<li>「兩個提領請求同時到達，餘額變成負的。原因是什麼？怎麼修？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>立即的修法是在伺服器端檢查擁有權，最好直接寫進查詢條件（<code>WHERE id = $1 AND owner_id = $2</code>），查不到回 404。長期的做法是把授權集中到路由註冊的地方、預設拒絕，再加上兩個帳號交叉存取的自動化測試，每種新資源都要加入。多租戶系統可以再加資料庫的資料列層級安全當保險。</li>
<li>參數化讓查詢範本和值分開傳給資料庫，範本先被解析，值只會被當成值，結構上就不可能變成語法；過濾是在猜哪些輸入危險，寫法列不完，還會誤傷正常輸入。參數化做不到的是識別字，例如欄位名稱和排序方向，這時用允許清單把使用者的選擇對應到你事先寫好的片段。</li>
<li>Vue 只保護 <code>{{ }}</code> 這種預設寫法，<code>v-html</code>、第三方元件、使用者給的網址都可能出錯，CSP 是編碼失誤時的第二道防線。nonce 型 CSP 是伺服器每次回應產生一個亂數，放在標頭和自己的 script 標籤上，瀏覽器只執行帶正確 nonce 的腳本，被注入的標記不知道這個值；搭配 strict-dynamic，受信任的腳本可以再載入其他腳本。上線前先用 Report-Only 收集報告。</li>
<li>SameSite 看的是站點，同一個註冊網域下的子網域都算同站，任何一個子網域被接管或有漏洞，SameSite 就擋不住；舊瀏覽器、設定成 None 的 cookie、用 GET 改資料的端點也都會破功。CSRF token 綁在工作階段上，外站讀不到，不受這些影響。實務上會再加上 Sec-Fetch-Site 和 Origin 檢查。</li>
<li>先限制協定只能 https；解析 DNS 取得所有 IP，比對私有、迴路、鏈路本地（含 169.254.169.254）、IPv6 的內部範圍；連線時用的必須是檢查過的 IP；不自動跟隨重新導向；設超時和大小上限，不把回應內容回傳。網路層把發送 webhook 的服務放在只能出不能進內網的網段，或走出口代理；EC2 強制 IMDSv2、hop limit 設 1；那台機器的角色只給最小權限。</li>
<li>程式是「讀餘額、判斷、寫回」三步，兩個請求都在對方寫回之前讀到舊值，都判斷夠用。修法是把判斷放進一條原子的條件式更新：<code>UPDATE ... SET balance = balance - $amt WHERE user_id = $id AND balance &gt;= $amt</code>，看影響的列數決定成功與否；或在交易裡用 <code>SELECT ... FOR UPDATE</code> 先鎖住那一列。再加上冪等鍵處理重送，並用平行請求的測試證明修好了。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>在你自己的專案裡找出所有 <code>v-html</code>、<code>innerHTML</code> 和 <code>dangerouslySetInnerHTML</code>，替每一個寫下資料來源，判斷它需不需要消毒。</li>
<li>寫一個中介層，讓 Express 應用程式裡任何沒有宣告授權規則的路由，在啟動時就丟出錯誤。</li>
<li>猜高低要新增「歷史紀錄可以依金額或時間排序」。寫出安全的查詢程式碼，說明你怎麼處理排序欄位。</li>
<li>用 OWASP Juice Shop 在自己電腦上跑起來，挑一個「存取控制」類的關卡完成它，然後寫下：如果你是這個應用程式的開發者，你會在程式的哪一層、用什麼寫法修好它？</li>
<li>每日紅利的領取 API 目前是：查今天領過沒有 → 沒有就發 100 → 寫一筆紀錄。用資料庫的機制把它改成同一個人一天絕對只能領一次。</li>
<li>替你自己的網站跑一次標頭檢查，列出缺少的安全標頭，並寫出 nginx 或應用程式裡要加的設定。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>一般會分成三類：資料來自你自己寫死的內容（例如固定的說明文字），風險低但最好改成元件；資料來自後台人員輸入（公告），要用 DOMPurify 消毒並限制標籤；資料來自玩家（暱稱、聊天），應該改成純文字顯示，根本不該用 <code>v-html</code>。</li>
<li>做法之一：只透過自己的 <code>route()</code> 函式註冊路由，它要求一定要有 policy 參數；另外在啟動完成後走訪 Express 的路由表，找出任何不是透過 <code>route()</code> 註冊的路徑，有就丟出錯誤讓行程起不來。測試環境也會因此失敗，問題在合併前就會被發現。</li>
<li>用允許清單：<code>{ amount: 'amount DESC', time: 'created_at DESC' }</code>，使用者的參數只拿來查表，查不到就用預設值；被拼進 SQL 的只會是你寫死的片段。使用者 ID 來自工作階段，用 <code>$1</code> 佔位符傳入；分頁大小設上限，例如最多 50 筆。</li>
<li>以「看到別人的購物籃」這類關卡為例：問題是伺服器依請求裡的 ID 回傳資料，沒有比對擁有者。修法是在查詢條件裡加上目前使用者的 ID、找不到回 404，並把這個檢查集中在資料存取層；再加一個用兩個帳號交叉存取的測試。重點是寫出「修在哪一層、怎麼證明」，不是記住過關步驟。</li>
<li>建一張 <code>daily_claims (user_id, claim_date)</code> 資料表，以這兩欄為主鍵，日期用伺服器時間算。領取時在同一個交易裡先 <code>INSERT ... ON CONFLICT DO NOTHING</code>，插入成功才加錢、寫帳本；插入不成功就回「今天已領過」。兩個請求同時到達，主鍵保證只有一個能插入。</li>
<li>通常會缺 <code>Strict-Transport-Security</code>、<code>X-Content-Type-Options</code>、<code>Referrer-Policy</code> 和 CSP。前三個可以在 nginx 用 <code>add_header ... always</code> 加上；CSP 跟頁面內容有關，建議由應用程式產生，先用 Report-Only。改完記得對不同路徑都檢查一次，避開 <code>location</code> 區塊不繼承標頭的坑。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>OWASP Top 10</b> 和 <b>OWASP Cheat Sheet Series</b>（<a href="https://cheatsheetseries.owasp.org/">cheatsheetseries.owasp.org</a>）：每一種弱點都有一份防禦用的速查表，例如 SQL Injection Prevention、Cross Site Scripting Prevention、SSRF Prevention，寫程式時隨手查。</li>
<li><b>PortSwigger Web Security Academy</b>（<a href="https://portswigger.net/web-security">portswigger.net/web-security</a>）：免費的線上教材和合法的練習環境，每個主題都附防禦說明。</li>
<li><b>OWASP Juice Shop</b>：一個故意寫壞的網站，用 Docker 在自己電腦上跑，適合練習「找到之後怎麼修」。</li>
<li><b>MDN Web Docs 的 Security 章節</b>：CSP、cookie、各種安全標頭最準確的說明。</li>
<li><b>Tanya Janca《Alice and Bob Learn Application Security》</b>（Wiley，2020）：從開發者的角度講安全的設計、寫法和測試，適合當這一章的延伸讀物。</li>
</ul>
` });
