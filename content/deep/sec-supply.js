DEEP({ 'sec-supply': `
<p>上一課把供應鏈、修補、偵測和應變排成一條防線。這一章深入其中最容易被低估的幾段：攻擊者怎麼透過「別人寫的程式碼」進到你的系統，真實案例一個一個看；鎖檔、可重現建置、SBOM、簽章和 SLSA 各自擋住哪一步；幾百個服務要一起修補時，流程長什麼樣子；容器跑起來之後，怎麼用系統呼叫抓出不該發生的事；以及出事那天，你的日誌能不能回答「發生了什麼」。第 2.6 課（CI/CD）的深入圖解講過管線本身的安全和簽章的基本流程，第 2.1 課（容器）的深入圖解講過映像檔怎麼做小、容器怎麼逃逸，這一章接著往下走。</p>

<h3><span class="badge lv1">基礎</span>一、你的程式裡，有多少不是你寫的</h3>
<p>想像一家餐廳。廚師手藝再好，菜的安全也取決於農場、運輸、批發商、冷藏庫的每一站。任何一站被下了毒，廚師照常料理，客人照樣中毒。軟體的供應鏈（supply chain）也是這樣：你寫的程式碼，可能只佔最後那個映像檔的百分之幾。一個普通的 Vue 或 Node.js 專案，執行 <code>npm ls --all</code> 常常列出幾百到上千個套件；基底映像檔裡又有幾十到上百個作業系統套件；中間還有建置工具、CI 外掛、映像檔倉庫。</p>
<figure class="figure"><svg viewBox="0 18 690 248" class="fg" style="width:100%;max-width:690px" role="img" aria-label="軟體供應鏈五站：原始碼、相依套件、建置、成品倉庫、部署與執行，每一站下方列出攻擊點與對應的防線">
<rect x="10" y="30" width="124" height="38" rx="6" class="fg-b alt"/><text x="72" y="54" text-anchor="middle" class="fg-t">原始碼</text>
<rect x="146" y="30" width="124" height="38" rx="6" class="fg-b alt"/><text x="208" y="54" text-anchor="middle" class="fg-t">相依套件</text>
<rect x="282" y="30" width="124" height="38" rx="6" class="fg-b alt"/><text x="344" y="54" text-anchor="middle" class="fg-t">建置</text>
<rect x="418" y="30" width="124" height="38" rx="6" class="fg-b alt"/><text x="480" y="54" text-anchor="middle" class="fg-t">成品倉庫</text>
<rect x="554" y="30" width="124" height="38" rx="6" class="fg-b alt"/><text x="616" y="54" text-anchor="middle" class="fg-t">部署與執行</text>
<line x1="134" y1="49" x2="138" y2="49" class="fg-l"/><polygon points="146,49 138,44.5 138,53.5" class="fg-a"/>
<line x1="270" y1="49" x2="274" y2="49" class="fg-l"/><polygon points="282,49 274,44.5 274,53.5" class="fg-a"/>
<line x1="406" y1="49" x2="410" y2="49" class="fg-l"/><polygon points="418,49 410,44.5 410,53.5" class="fg-a"/>
<line x1="542" y1="49" x2="546" y2="49" class="fg-l"/><polygon points="554,49 546,44.5 546,53.5" class="fg-a"/>
<text x="10" y="92" class="fg-t sm warm">攻擊點</text>
<rect x="10" y="98" width="124" height="66" rx="6" class="fg-b warm"/><text x="72" y="118" text-anchor="middle" class="fg-t sm">維護者帳號被盜</text><text x="72" y="136" text-anchor="middle" class="fg-t sm">長期臥底的貢獻者</text><text x="72" y="154" text-anchor="middle" class="fg-t sm">（xz）</text>
<rect x="146" y="98" width="124" height="66" rx="6" class="fg-b warm"/><text x="208" y="118" text-anchor="middle" class="fg-t sm">打錯字的套件</text><text x="208" y="136" text-anchor="middle" class="fg-t sm">相依混淆</text><text x="208" y="154" text-anchor="middle" class="fg-t sm">被接手的套件</text>
<rect x="282" y="98" width="124" height="66" rx="6" class="fg-b warm"/><text x="344" y="118" text-anchor="middle" class="fg-t sm">惡意的 CI action</text><text x="344" y="136" text-anchor="middle" class="fg-t sm">建置機被植入</text><text x="344" y="154" text-anchor="middle" class="fg-t sm">（SolarWinds）</text>
<rect x="418" y="98" width="124" height="66" rx="6" class="fg-b warm"/><text x="480" y="126" text-anchor="middle" class="fg-t sm">標籤被改指</text><text x="480" y="144" text-anchor="middle" class="fg-t sm">推入假映像檔</text>
<rect x="554" y="98" width="124" height="66" rx="6" class="fg-b warm"/><text x="616" y="126" text-anchor="middle" class="fg-t sm">跑了沒驗證的</text><text x="616" y="144" text-anchor="middle" class="fg-t sm">執行期被入侵</text>
<text x="10" y="186" class="fg-t sm acc">防線</text>
<rect x="10" y="192" width="124" height="66" rx="6" class="fg-b hot"/><text x="72" y="212" text-anchor="middle" class="fg-t sm">強制 MFA</text><text x="72" y="230" text-anchor="middle" class="fg-t sm">兩人審查</text><text x="72" y="248" text-anchor="middle" class="fg-t sm">保護分支</text>
<rect x="146" y="192" width="124" height="66" rx="6" class="fg-b hot"/><text x="208" y="212" text-anchor="middle" class="fg-t sm">鎖檔＋雜湊</text><text x="208" y="230" text-anchor="middle" class="fg-t sm">私有命名空間</text><text x="208" y="248" text-anchor="middle" class="fg-t sm">新版本冷卻期</text>
<rect x="282" y="192" width="124" height="66" rx="6" class="fg-b hot"/><text x="344" y="212" text-anchor="middle" class="fg-t sm">action 釘 SHA</text><text x="344" y="230" text-anchor="middle" class="fg-t sm">隔離、用完即丟</text><text x="344" y="248" text-anchor="middle" class="fg-t sm">出處證明</text>
<rect x="418" y="192" width="124" height="66" rx="6" class="fg-b hot"/><text x="480" y="220" text-anchor="middle" class="fg-t sm">用 digest 部署</text><text x="480" y="238" text-anchor="middle" class="fg-t sm">簽章</text>
<rect x="554" y="192" width="124" height="66" rx="6" class="fg-b hot"/><text x="616" y="220" text-anchor="middle" class="fg-t sm">准入時驗簽章</text><text x="616" y="238" text-anchor="middle" class="fg-t sm">執行期偵測</text>
</svg><figcaption>每一站都有人打過，也都有對應的防線。這一章的每一節，大致就是這張表的一欄。</figcaption></figure>
<p>攻擊者喜歡供應鏈，理由很簡單：<b>槓桿</b>。直接攻擊一家公司，只拿得下一家；在一個每週下載幾千萬次的套件裡放後門，下游幾萬家公司會自己把它裝進去，還替它通過自己的 CI、簽上自己的名字、部署到自己的正式環境。</p>

<h3><span class="badge lv1">基礎</span>二、五種手法，與真實案例</h3>
<h4>打錯字的套件（typosquatting）</h4>
<p>2017 年，npm 上出現一個叫 <code>crossenv</code> 的套件，名字只比熱門的 <code>cross-env</code> 少一個連字號。它真的能用（因為它自己就依賴真正的 cross-env），但安裝時會把環境變數送到攻擊者的伺服器。同一個帳號一口氣發了幾十個類似的假套件。CI 的環境變數裡有什麼？發布權杖、雲端金鑰、資料庫密碼。</p>
<h4>相依混淆（dependency confusion）</h4>
<p>2021 年，研究員 Alex Birsan 發表了一種新手法，並用它（在漏洞獎金計畫的授權下）在超過 35 家公司的內部機器上執行了程式，包括 Apple、Microsoft 和 PayPal。原理是許多公司內部有私有套件，名字被不小心洩漏（例如寫在公開的 <code>package.json</code> 裡），而建置工具同時設定了內部和公開兩個來源：</p>
<figure class="figure"><svg viewBox="0 0 640 240" class="fg" style="width:100%;max-width:640px" role="img" aria-label="相依混淆：建置機用 pip 同時查詢內部套件庫與公開 PyPI，內部是 1.2.0，攻擊者在 PyPI 上傳同名的 99.0.0，pip 挑了版本較高的公開套件">
<text x="320" y="18" text-anchor="middle" class="fg-t sm">同時設定兩個來源（例如 pip 的 --extra-index-url）時</text>
<rect x="10" y="95" width="140" height="60" rx="6" class="fg-b alt"/><text x="80" y="118" text-anchor="middle" class="fg-t">CI 建置機</text><text x="80" y="140" text-anchor="middle" class="fg-t sm mono">hilo-utils&gt;=1.2</text>
<line x1="150" y1="125" x2="202" y2="125" class="fg-l"/><polygon points="210,125 202,120.5 202,129.5" class="fg-a"/>
<rect x="210" y="95" width="130" height="60" rx="6" class="fg-b"/><text x="275" y="118" text-anchor="middle" class="fg-t">pip 解析版本</text><text x="275" y="140" text-anchor="middle" class="fg-t sm">兩邊都問，挑最新</text>
<path d="M340 110 H375 V55 H402" class="fg-l alt"/><polygon points="410,55 402,50.5 402,59.5" class="fg-a alt"/>
<path d="M340 140 H375 V195 H402" class="fg-l warm"/><polygon points="410,195 402,190.5 402,199.5" class="fg-a warm"/>
<rect x="410" y="30" width="220" height="50" rx="6" class="fg-b alt"/><text x="520" y="51" text-anchor="middle" class="fg-t">公司內部套件庫</text><text x="520" y="70" text-anchor="middle" class="fg-t sm mono">hilo-utils 1.2.0</text>
<rect x="410" y="170" width="220" height="50" rx="6" class="fg-b warm"/><text x="520" y="191" text-anchor="middle" class="fg-t">公開的 PyPI</text><text x="520" y="210" text-anchor="middle" class="fg-t sm">hilo-utils 99.0.0（攻擊者上傳）</text>
<text x="275" y="182" text-anchor="middle" class="fg-t sm warm">挑中了 99.0.0</text>
<text x="275" y="200" text-anchor="middle" class="fg-t sm">安裝時就執行它的程式</text>
</svg><figcaption>版本號比較高，就被當成「比較新」。工具沒有錯，它只是照規則挑；錯在同一個名字可以從兩個信任程度完全不同的地方來。</figcaption></figure>
<p>2022 年 12 月底，PyTorch 的每日建置版就這樣中招：它依賴一個放在 PyTorch 自己套件庫的 <code>torchtriton</code>，有人在公開的 PyPI 搶先上傳了同名套件。那幾天安裝每日建置版的人，裝到的是會蒐集系統資訊和 SSH 金鑰、再送出去的版本。</p>
<h4>維護者被攻陷，或被接手</h4>
<ul>
<li><b>event-stream（2018）</b>：原作者沒空維護，把發布權交給一位主動幫忙的陌生人。新維護者加了一個新的相依套件，裡面藏著加密過的程式，目標是某個比特幣錢包 App 的使用者。</li>
<li><b>ua-parser-js（2021）</b>：每週下載數百萬次。維護者的 npm 帳號被盜，攻擊者發布了三個帶有挖礦程式和密碼竊取程式的版本。</li>
<li><b>chalk、debug 等套件（2025 年 9 月）</b>：維護者收到一封假冒 npm 官方的釣魚信，交出了帳號和第二道驗證碼。十幾個合計每週下載數十億次的套件被植入在瀏覽器裡竄改加密貨幣收款地址的程式，幾個小時內就被發現並下架。</li>
<li><b>xz utils（2024）</b>：最驚人的一次。一個化名的貢獻者花了大約兩年，認真修 bug、建立信任，成為共同維護者，然後在發行用的壓縮檔裡（<b>不在 git 倉庫裡</b>）放進一段建置腳本，讓編出來的函式庫在特定條件下替 sshd 開後門。它在進入各大 Linux 發行版正式版之前被發現，發現者 Andres Freund 只是注意到 SSH 登入慢了大約半秒、多吃了一些 CPU。</li>
</ul>
<h4>惡意的 CI action 與建置機被入侵</h4>
<p>2025 年 tj-actions 的標籤被改指向惡意 commit（第 2.6 課的深入圖解講過），是「管線外掛」這一站的例子。建置機這一站最經典的是 <b>SolarWinds（2020）</b>：攻擊者在建置伺服器上放了一支程式，它盯著 Orion 產品的編譯過程，在編譯的那一刻把一個原始碼檔案換掉，編完再換回來。git 倉庫裡的程式碼是乾淨的，審查看不出任何問題，但產出的更新檔帶有後門，而且用 SolarWinds 自己的正牌憑證簽了名。大約一萬八千個客戶下載了它。2023 年的 3CX 事件更進一步：3CX 的桌面軟體被植入後門，追查下去，起點是一位員工裝了另一家公司被植入後門的軟體，是一次供應鏈攻擊引出另一次。</p>

<h3><span class="badge lv2">進階</span>三、鎖檔與可重現建置</h3>
<p>鎖檔（lockfile）裡每一個套件都長這樣：</p>
<pre><code>"node_modules/left-pad": {
  "version": "1.3.0",
  "resolved": "https://registry.npmjs.org/left-pad/-/left-pad-1.3.0.tgz",
  "integrity": "sha512-XI5MPzVNApjAyhQzphX8BkmKsKUxD4LdyK24iZeQGjUcTx6y…"
}</code></pre>
<p><code>npm ci</code> 只照鎖檔安裝，下載下來的壓縮檔雜湊對不上 <code>integrity</code> 就直接失敗；<code>package.json</code> 和鎖檔不一致也直接失敗，不會偷偷改鎖檔。npm 也不允許同一個版本號重新發布不同的內容。所以鎖檔把「名字＋版本」釘成了「這一份確切的內容」。</p>
<p>但要看清楚它擋的是什麼：鎖檔擋的是「明天冒出一個新的惡意版本，自動混進你的建置」。它<b>擋不了</b>你鎖住的那個版本本來就是惡意的，也擋不了你自己按下合併的那個更新。所以還需要：</p>
<ul>
<li><b>審查鎖檔的變動。</b>一個說是「更新一個小套件」的 PR，鎖檔卻多了四十個新的間接相依套件，或某個套件多了 <code>postinstall</code> 腳本，都值得停下來看。</li>
<li><b>冷卻期。</b>很多惡意版本在幾小時到幾天內就會被社群發現下架。Renovate 的 <code>minimumReleaseAge</code> 可以設成「新版本發布滿 3 天才開 PR」，用一點點延遲換很大的安全。真正的緊急修補再手動放行。</li>
<li><b>安裝腳本。</b>npm 套件的 <code>preinstall</code>、<code>postinstall</code> 會在安裝時以你的權限執行，看得到 CI 的所有環境變數。能用 <code>npm ci --ignore-scripts</code> 就用；pnpm 10 起預設不執行相依套件的安裝腳本，要明確列出允許的套件。</li>
<li><b>防相依混淆。</b>內部套件一律用自己的命名空間，例如 <code>@hilo/utils</code>，在 <code>.npmrc</code> 寫 <code>@hilo:registry=https://npm.internal.example/</code>，這個命名空間就只會從內部來。Python 改用單一個內部代理（<code>--index-url</code>），由它決定哪些名字可以去公開來源拿，並用 <code>pip install --require-hashes</code> 驗雜湊。</li>
<li><b>Go</b> 的 <code>go.sum</code> 加上公開的校驗資料庫（sum.golang.org）：每個模組版本在全世界只有一個合法的雜湊，作者事後偷改標籤也會被發現。</li>
</ul>
<h4>可重現建置：讓「建置機被動手腳」變得看得見</h4>
<p><b>可重現建置</b>（reproducible build）的意思是：同一份原始碼，不管誰、在哪台機器上建，產出的檔案每一個位元都一樣。這樣就能找兩台互不相干的機器各建一次，比對雜湊。SolarWinds 那種「在編譯當下換檔案」的攻擊，在獨立重建的機器上不會發生，雜湊就會對不上。</p>
<p>讓建置不可重現的常見原因，和對應的修法：時間戳記被寫進檔案（設 <code>SOURCE_DATE_EPOCH</code>，很多工具會用它代替現在時間）；建置路徑被寫進執行檔（Go 用 <code>-trimpath</code>）；檔案的排列順序、語系設定、平行編譯造成的順序不同；以及沒鎖住的相依套件和基底映像檔。Debian、Arch、NixOS 等發行版已經讓絕大部分套件可以重現。xz 事件也給了一個啟示：如果發行用的壓縮檔可以從 git 原始碼重現出來，「壓縮檔裡多了一段 git 裡沒有的腳本」就會立刻被機器發現。</p>

<h3><span class="badge lv2">進階</span>四、SBOM：新漏洞公布那天，你要回答的問題</h3>
<p>2021 年 12 月 Log4Shell 公布的那個週末，全世界的資安團隊都在問同一個問題：「我們有哪些系統用了 log4j-core？版本是多少？」很多公司花了好幾週才回答出來，因為 log4j 常常不是直接相依，而是被包在某個函式庫、某個廠商產品、某個「肥 jar」（把所有相依套件打包在一起的 jar）裡面。</p>
<p><b>SBOM</b>（software bill of materials，軟體物料清單）就是事先把答案準備好：每一次建置，列出成品裡的每一個元件、版本、來源和雜湊。兩種主流格式：</p>
<table>
<tr><th></th><th>SPDX</th><th>CycloneDX</th></tr>
<tr><td>出身</td><td>Linux 基金會，已成為 ISO/IEC 5962 國際標準</td><td>OWASP，已成為 Ecma 標準（ECMA-424）</td></tr>
<tr><td>強項</td><td>授權條款合規，歷史悠久</td><td>資安用途，內建漏洞與 VEX 的表達方式</td></tr>
</table>
<p>兩者都用 <b>purl</b>（package URL）標示元件，例如 <code>pkg:maven/org.apache.logging.log4j/log4j-core@2.14.1</code>、<code>pkg:npm/left-pad@1.3.0</code>：一個字串就說清楚是哪個生態系、哪個套件、哪一版，跨工具比對不會混淆。實際操作：</p>
<pre><code># 建置時：從「最後的成品」產生 SBOM，並附在映像檔上
syft ghcr.io/example/hilo-api@sha256:7d1e… -o cyclonedx-json &gt; sbom.cdx.json
cosign attest --type cyclonedx --predicate sbom.cdx.json \\
  ghcr.io/example/hilo-api@sha256:7d1e…

# 漏洞公布那天：在所有 SBOM 裡找
jq '.components[] | select(.name == "log4j-core") | {name, version, purl}' sbom.cdx.json
grype sbom:./sbom.cdx.json          # 也可以直接拿 SBOM 比對漏洞資料庫</code></pre>
<figure class="figure"><svg viewBox="0 0 690 170" class="fg" style="width:100%;max-width:690px" role="img" aria-label="新漏洞公布後的查詢流程：從兩百個服務的 SBOM 用 purl 查出十二個命中，VEX 排除四個不受影響，剩八個要修">
<rect x="10" y="30" width="118" height="80" rx="6" class="fg-b warm"/><text x="69" y="56" text-anchor="middle" class="fg-t">新漏洞公布</text><text x="69" y="78" text-anchor="middle" class="fg-t sm mono">CVE-2021-44228</text><text x="69" y="96" text-anchor="middle" class="fg-t sm">log4j-core</text>
<rect x="148" y="30" width="118" height="80" rx="6" class="fg-b alt"/><text x="207" y="56" text-anchor="middle" class="fg-t">SBOM 庫</text><text x="207" y="78" text-anchor="middle" class="fg-t sm">每次建置產生</text><text x="207" y="96" text-anchor="middle" class="fg-t sm">跟映像檔放一起</text>
<rect x="286" y="30" width="118" height="80" rx="6" class="fg-b"/><text x="345" y="56" text-anchor="middle" class="fg-t">用 purl 查</text><text x="345" y="78" text-anchor="middle" class="fg-t sm">比對元件與版本</text><text x="345" y="96" text-anchor="middle" class="fg-t sm">連內嵌的 jar</text>
<rect x="424" y="30" width="118" height="80" rx="6" class="fg-b"/><text x="483" y="56" text-anchor="middle" class="fg-t">VEX 判斷</text><text x="483" y="78" text-anchor="middle" class="fg-t sm">程式走不到</text><text x="483" y="96" text-anchor="middle" class="fg-t sm">就標不受影響</text>
<rect x="562" y="30" width="118" height="80" rx="6" class="fg-b hot"/><text x="621" y="56" text-anchor="middle" class="fg-t acc">要修的清單</text><text x="621" y="78" text-anchor="middle" class="fg-t sm">附負責團隊</text><text x="621" y="96" text-anchor="middle" class="fg-t sm">附修補期限</text>
<line x1="128" y1="70" x2="140" y2="70" class="fg-l"/><polygon points="148,70 140,65.5 140,74.5" class="fg-a"/>
<line x1="266" y1="70" x2="278" y2="70" class="fg-l"/><polygon points="286,70 278,65.5 278,74.5" class="fg-a"/>
<line x1="404" y1="70" x2="416" y2="70" class="fg-l"/><polygon points="424,70 416,65.5 416,74.5" class="fg-a"/>
<line x1="542" y1="70" x2="554" y2="70" class="fg-l"/><polygon points="562,70 554,65.5 554,74.5" class="fg-a"/>
<text x="69" y="146" text-anchor="middle" class="fg-t lg">1 個漏洞</text>
<text x="207" y="146" text-anchor="middle" class="fg-t lg">200 個服務</text>
<text x="345" y="146" text-anchor="middle" class="fg-t lg">命中 12 個</text>
<text x="483" y="146" text-anchor="middle" class="fg-t lg">排除 4 個</text>
<text x="621" y="146" text-anchor="middle" class="fg-t lg acc">8 個要修</text>
</svg><figcaption>數字只是示意。重點是：有 SBOM，這張表幾分鐘就跑完；沒有 SBOM，每一格都要找人去問。</figcaption></figure>
<p>第四格的 <b>VEX</b>（Vulnerability Exploitability eXchange）是一份「這個漏洞對我們是否真的有影響」的聲明，狀態有不受影響、受影響、已修復、調查中。標成不受影響時要附理由，例如「有漏洞的程式碼不在執行路徑上」。它讓掃描器不再一直對同一件事發警報，也讓客戶知道你判斷過了。</p>
<p>SBOM 的品質只跟產生它的方式一樣好。從鎖檔產生的清單，看不到基底映像檔裡的作業系統套件；從映像檔掃出來的清單，看不到被直接複製進專案的 C 原始碼。Go 編出來的執行檔裡記著模組資訊（<code>go version -m ./hilo</code> 看得到），Syft 這類工具也會往肥 jar 裡面找，但手動複製進來的檔案，誰都看不見。原則是：<b>從最後要部署的那個成品產生</b>，並且隨著每一次建置更新。</p>

<h3><span class="badge lv3">專業</span>五、簽章與驗證：到底驗了什麼</h3>
<p>第 2.6 課說過 cosign 的「免金鑰簽章」：CI 用自己的 OIDC 身分換一張短命憑證來簽。這裡把簽和驗兩邊各自做了什麼，一格一格攤開：</p>
<figure class="figure"><svg viewBox="0 0 680 230" class="fg" style="width:100%;max-width:680px" role="img" aria-label="Sigstore 免金鑰簽章：CI 用 OIDC 權杖向 Fulcio 換短命憑證、簽映像檔 digest、寫進 Rekor；部署前驗證身分、憑證鏈、簽章與時間四項">
<text x="10" y="22" class="fg-t sm acc">簽章：在 CI 裡，幾秒鐘內完成</text>
<rect x="10" y="32" width="150" height="50" rx="6" class="fg-b"/><text x="85" y="53" text-anchor="middle" class="fg-t">CI 的 OIDC 權杖</text><text x="85" y="72" text-anchor="middle" class="fg-t sm">寫著 repo、分支</text>
<rect x="180" y="32" width="150" height="50" rx="6" class="fg-b"/><text x="255" y="53" text-anchor="middle" class="fg-t">Fulcio 發憑證</text><text x="255" y="72" text-anchor="middle" class="fg-t sm">綁身分，約 10 分鐘</text>
<rect x="350" y="32" width="150" height="50" rx="6" class="fg-b"/><text x="425" y="53" text-anchor="middle" class="fg-t">簽映像檔 digest</text><text x="425" y="72" text-anchor="middle" class="fg-t sm">私鑰用完就丟</text>
<rect x="520" y="32" width="150" height="50" rx="6" class="fg-b"/><text x="595" y="53" text-anchor="middle" class="fg-t">寫進 Rekor</text><text x="595" y="72" text-anchor="middle" class="fg-t sm">公開、只能附加</text>
<line x1="160" y1="57" x2="172" y2="57" class="fg-l"/><polygon points="180,57 172,52.5 172,61.5" class="fg-a"/>
<line x1="330" y1="57" x2="342" y2="57" class="fg-l"/><polygon points="350,57 342,52.5 342,61.5" class="fg-a"/>
<line x1="500" y1="57" x2="512" y2="57" class="fg-l"/><polygon points="520,57 512,52.5 512,61.5" class="fg-a"/>
<line x1="85" y1="82" x2="85" y2="140" class="fg-l dim dash"/><line x1="255" y1="82" x2="255" y2="140" class="fg-l dim dash"/><line x1="425" y1="82" x2="425" y2="140" class="fg-l dim dash"/><line x1="595" y1="82" x2="595" y2="140" class="fg-l dim dash"/>
<rect x="10" y="140" width="150" height="56" rx="6" class="fg-b hot"/><circle cx="146" cy="154" r="5" class="fg-lamp on"/><text x="85" y="164" text-anchor="middle" class="fg-t">身分相符</text><text x="85" y="184" text-anchor="middle" class="fg-t sm">是我們 repo 的 main</text>
<rect x="180" y="140" width="150" height="56" rx="6" class="fg-b hot"/><circle cx="316" cy="154" r="5" class="fg-lamp on"/><text x="255" y="164" text-anchor="middle" class="fg-t">憑證鏈</text><text x="255" y="184" text-anchor="middle" class="fg-t sm">接到 Fulcio 的根</text>
<rect x="350" y="140" width="150" height="56" rx="6" class="fg-b hot"/><circle cx="486" cy="154" r="5" class="fg-lamp on"/><text x="425" y="164" text-anchor="middle" class="fg-t">簽章正確</text><text x="425" y="184" text-anchor="middle" class="fg-t sm">簽的就是這個 digest</text>
<rect x="520" y="140" width="150" height="56" rx="6" class="fg-b hot"/><circle cx="656" cy="154" r="5" class="fg-lamp on"/><text x="595" y="164" text-anchor="middle" class="fg-t">時間對得上</text><text x="595" y="184" text-anchor="middle" class="fg-t sm">Rekor 紀錄在效期內</text>
<text x="10" y="220" class="fg-t sm alt">驗證：部署前每次都做，四項都過才放行</text>
</svg><figcaption>上排每一步，在下排都有一項對應的檢查。憑證只活十分鐘，所以要靠 Rekor 證明「簽的時候，憑證還有效」。</figcaption></figure>
<pre><code>cosign verify ghcr.io/example/hilo-api@sha256:7d1e… \\
  --certificate-identity-regexp '^https://github.com/example/hilo/\\.github/workflows/release\\.yml@refs/heads/main$' \\
  --certificate-oidc-issuer https://token.actions.githubusercontent.com</code></pre>
<p>最重要的是第一項：<b>不指定身分的驗證等於沒驗</b>。任何人都能用自己的 GitHub 帳號替任何映像檔簽一個有效的簽章，你要檢查的是「簽的人是不是我們那個 repo、那個分支上的那個工作流程」。在 Kubernetes 上，用 Kyverno 或 Sigstore 的 policy-controller 在准入時做同樣的檢查。</p>
<h4>SLSA：把「出處」分等級</h4>
<p>簽章證明「是誰簽的」，<b>出處證明</b>（provenance）則記錄「這個成品是怎麼建出來的」：哪個 repo、哪個 commit、哪個工作流程、在哪個建置平台。SLSA（念作 salsa）把建置的可信程度分成幾個等級，用白話講：</p>
<table>
<tr><th>等級</th><th>要求</th><th>擋得住什麼</th></tr>
<tr><td>L0</td><td>沒有任何要求</td><td>什麼都擋不住</td></tr>
<tr><td>L1</td><td>有出處證明，但可能是建置腳本自己寫的</td><td>擋得住搞錯，方便盤點；擋不住故意偽造</td></tr>
<tr><td>L2</td><td>在託管的建置平台上建置，出處證明由平台簽章</td><td>建置完之後，成品或出處被竄改</td></tr>
<tr><td>L3</td><td>建置平台經過強化：每次建置彼此隔離，簽章用的金鑰你自己的建置步驟碰不到</td><td>連你自己的建置腳本被入侵，都偽造不了出處</td></tr>
</table>
<p>GitHub Actions 用 <code>actions/attest-build-provenance</code> 產生出處證明，驗證用 <code>gh attestation verify oci://ghcr.io/example/hilo-api@sha256:7d1e… --repo example/hilo</code>。npm 也支援 <code>npm publish --provenance</code>，讓使用者看得到某個版本是從哪個 repo、哪次建置發布的；npm 現在也支援從 CI 用 OIDC 發布，不必再保存長期的發布權杖，這正好切斷了 chalk 事件那種「偷到帳號就能發版」的路。</p>
<div class="note"><b>簽章證明的是來源，不是善意。</b>SolarWinds 的後門更新檔，用的是 SolarWinds 自己的正牌憑證；xz 的惡意版本，是由真正的維護者發布的。簽章和出處能擋住「冒充」和「中途竄改」，擋不住「本人就是壞的」或「本人的建置機被控制」。後兩者要靠審查、可重現建置和執行期偵測。</div>

<h3><span class="badge lv3">專業</span>六、大規模修補：從一個 CVE 到一千個容器</h3>
<p>該先修哪個，第 6.6 課（弱點管理）講過 CVSS、EPSS、KEV 怎麼排順序。這一節講「決定要修之後，怎麼在幾百個服務上真的修完」。</p>
<p>容器的原則只有一條：<b>不修補執行中的容器，而是重建、重新部署</b>。在容器裡 <code>apt-get upgrade</code>，下一次重啟就消失了，而且那個容器再也不等於任何一個你測試過的映像檔。所以修補變成一條管線：</p>
<figure class="figure"><svg viewBox="0 0 680 250" class="fg" style="width:100%;max-width:680px" role="img" aria-label="上游修補進入公司基底映像檔，每天自動重建，Renovate 對每個服務開更新 PR，每個 PR 都經過測試、自動合併、金絲雀與全面推出">
<rect x="10" y="100" width="130" height="70" rx="6" class="fg-b warm"/><text x="75" y="124" text-anchor="middle" class="fg-t">上游修補</text><text x="75" y="144" text-anchor="middle" class="fg-t sm">例：openssl 更新</text><text x="75" y="160" text-anchor="middle" class="fg-t sm">（Debian 套件）</text>
<line x1="140" y1="135" x2="162" y2="135" class="fg-l"/><polygon points="170,135 162,130.5 162,139.5" class="fg-a"/>
<rect x="170" y="100" width="130" height="70" rx="6" class="fg-b alt"/><text x="235" y="124" text-anchor="middle" class="fg-t">公司基底映像檔</text><text x="235" y="144" text-anchor="middle" class="fg-t sm">每天自動重建</text><text x="235" y="160" text-anchor="middle" class="fg-t sm mono">hilo-base</text>
<text x="410" y="20" text-anchor="middle" class="fg-t sm acc">Renovate 自動開 PR</text>
<line x1="300" y1="135" x2="320" y2="135" class="fg-l"/><line x1="320" y1="50" x2="320" y2="215" class="fg-l"/>
<line x1="320" y1="50" x2="342" y2="50" class="fg-l"/><polygon points="350,50 342,45.5 342,54.5" class="fg-a"/>
<line x1="320" y1="105" x2="342" y2="105" class="fg-l"/><polygon points="350,105 342,100.5 342,109.5" class="fg-a"/>
<line x1="320" y1="160" x2="342" y2="160" class="fg-l"/><polygon points="350,160 342,155.5 342,164.5" class="fg-a"/>
<line x1="320" y1="215" x2="342" y2="215" class="fg-l dim"/><polygon points="350,215 342,210.5 342,219.5" class="fg-a"/>
<rect x="350" y="30" width="120" height="40" rx="6" class="fg-b"/><text x="410" y="55" text-anchor="middle" class="fg-t">api 的 PR</text>
<rect x="350" y="85" width="120" height="40" rx="6" class="fg-b"/><text x="410" y="110" text-anchor="middle" class="fg-t">web 的 PR</text>
<rect x="350" y="140" width="120" height="40" rx="6" class="fg-b"/><text x="410" y="165" text-anchor="middle" class="fg-t">worker 的 PR</text>
<rect x="350" y="195" width="120" height="40" rx="6" class="fg-b dash"/><text x="410" y="220" text-anchor="middle" class="fg-t sm">…共 120 個</text>
<line x1="470" y1="50" x2="502" y2="50" class="fg-l on"/><polygon points="510,50 502,45.5 502,54.5" class="fg-a on"/>
<line x1="470" y1="105" x2="502" y2="105" class="fg-l on"/><polygon points="510,105 502,100.5 502,109.5" class="fg-a on"/>
<line x1="470" y1="160" x2="502" y2="160" class="fg-l on"/><polygon points="510,160 502,155.5 502,164.5" class="fg-a on"/>
<line x1="470" y1="215" x2="502" y2="215" class="fg-l on"/><polygon points="510,215 502,210.5 502,219.5" class="fg-a on"/>
<rect x="510" y="30" width="160" height="205" rx="8" class="fg-b hot"/>
<text x="526" y="56" class="fg-t acc">每個 PR 都走：</text>
<text x="526" y="86" class="fg-t sm">1 測試全部通過</text>
<text x="526" y="108" class="fg-t sm">2 自動合併</text>
<text x="526" y="130" class="fg-t sm">3 金絲雀上線</text>
<text x="526" y="152" class="fg-t sm">4 全面推出</text>
<text x="526" y="192" class="fg-t sm acc">量：修補延遲</text>
<text x="526" y="212" class="fg-t sm">從修補釋出到上線幾天</text>
</svg><figcaption>一個上游修補，扇出成一百多個 PR。只要測試可信、部署有金絲雀，大部分 PR 不需要人去按，人只處理失敗的那幾個。</figcaption></figure>
<ul>
<li><b>基底映像檔要有主人。</b>平台團隊維護一兩個公司的基底映像檔，每天自動重建，把作業系統的安全更新吃進來；各服務只從它衍生。否則一百個服務會用八十種基底，每一個都要各自追。</li>
<li><b>自動合併要有底氣。</b>修補等級的更新、測試全過，就自動合併、走金絲雀上線。前提是測試真的能抓到壞掉，以及部署能一鍵退版。</li>
<li><b>主機也一樣。</b>作業系統用 unattended-upgrades 這類工具自動裝安全更新，但核心和 glibc 的更新要重開機才生效（Ubuntu 會留下 <code>/var/run/reboot-required</code>，<code>needrestart</code> 會列出還在用舊函式庫的服務）。更成熟的做法是不修主機，而是定期用新映像檔換掉整批節點，例如 EKS 的受管節點群組更新或 Karpenter 的節點汰換。</li>
<li><b>修補常常不只一次。</b>Log4Shell 公布後三週內，Log4j 連續出了四個修補版（2.15.0 到 2.17.1），一開始建議的設定參數 <code>log4j2.formatMsgNoLookups</code> 後來也被證明不夠。你的管線要能在短時間內把同一件事做好幾次，而且每次都不痛。</li>
</ul>
<p>要量的指標是<b>修補延遲</b>：從修補版釋出，到正式環境全部換上，花了幾天。再加一個：有多少服務跑在已經過了支援終止日的版本上（endoflife.date 這個網站整理了大部分軟體的終止日期）。</p>

<h3><span class="badge lv3">專業</span>七、容器強化：每一條設定，打斷攻擊的哪一步</h3>
<p>第 2.1 課和第 2.7 課的深入圖解已經講過怎麼做小映像檔、Pod Security Standards 怎麼設。這裡換個角度：假設攻擊者已經透過一個惡意相依套件，在你的容器裡執行了程式。他接下來想做的每一步，各被哪一條設定擋住：</p>
<table>
<tr><th>攻擊者想做的事</th><th>擋住它的設定</th></tr>
<tr><td>開一個 shell、用 curl 下載工具</td><td>distroless 映像檔：裡面根本沒有 sh 和 curl</td></tr>
<tr><td>把工具寫進磁碟、改掉程式檔</td><td>根目錄唯讀（<code>readOnlyRootFilesystem: true</code>）</td></tr>
<tr><td>用 setuid 程式提升權限</td><td>非 root 使用者、<code>allowPrivilegeEscalation: false</code></td></tr>
<tr><td>掛載檔案系統、載入核心模組這類危險操作</td><td>拿掉所有 capability、seccomp 用 <code>RuntimeDefault</code></td></tr>
<tr><td>拿 Pod 的權杖去打 Kubernetes API</td><td><code>automountServiceAccountToken: false</code></td></tr>
<tr><td>拿節點的雲端憑證</td><td>IMDS 跳數上限 1、每個工作負載有自己的身分（第 5.5 課）</td></tr>
<tr><td>連回自己的控制伺服器、把資料送出去</td><td>出站的 NetworkPolicy 和出站代理（第 5.6 課）</td></tr>
<tr><td>直接接管整台主機</td><td>不用 <code>privileged</code>、不掛 Docker socket 和主機目錄</td></tr>
</table>
<p>這張表還有一個副作用：強化過的容器，「正常行為」變得很窄，所以任何異常都特別顯眼。一個根本沒有 shell 的容器裡出現 shell，不可能是正常的。這正是下一節偵測的基礎。</p>

<h3><span class="badge lv4">專家</span>八、執行期偵測：從系統呼叫看出不該發生的事</h3>
<p>前面所有防線都失守時，最後一道是在執行期看見它。不管攻擊者用什麼語言、什麼工具，他想開檔案、執行程式、連網路，最後都得透過<b>系統呼叫</b>（system call）請核心代勞。Falco 這類工具就在核心裡看這些呼叫：</p>
<figure class="figure"><svg viewBox="0 0 680 190" class="fg" style="width:100%;max-width:680px" role="img" aria-label="Falco 的資料流：容器裡的行程呼叫系統呼叫，核心裡的 eBPF 探針收集事件，Falco 補上容器與 Pod 資訊後逐條比對規則，符合就送出警報與日誌">
<rect x="10" y="16" width="120" height="46" rx="6" class="fg-b"/><text x="70" y="36" text-anchor="middle" class="fg-t mono">hilo-api</text><text x="70" y="54" text-anchor="middle" class="fg-t sm warm">開了一個 sh</text>
<rect x="140" y="16" width="120" height="46" rx="6" class="fg-b"/><text x="200" y="36" text-anchor="middle" class="fg-t mono">worker</text><text x="200" y="54" text-anchor="middle" class="fg-t sm warm">連到陌生 IP</text>
<rect x="270" y="16" width="120" height="46" rx="6" class="fg-b"/><text x="330" y="36" text-anchor="middle" class="fg-t mono">web</text><text x="330" y="54" text-anchor="middle" class="fg-t sm">正常讀寫檔案</text>
<line x1="70" y1="62" x2="70" y2="92" class="fg-l"/><polygon points="70,100 65.5,92 74.5,92" class="fg-a"/>
<line x1="200" y1="62" x2="200" y2="92" class="fg-l"/><polygon points="200,100 195.5,92 204.5,92" class="fg-a"/>
<line x1="330" y1="62" x2="330" y2="92" class="fg-l"/><polygon points="330,100 325.5,92 334.5,92" class="fg-a"/>
<rect x="10" y="100" width="380" height="46" rx="6" class="fg-b alt"/><text x="24" y="120" class="fg-t">Linux 核心</text><text x="24" y="138" class="fg-t sm mono">execve、connect、openat…</text>
<rect x="270" y="108" width="110" height="30" rx="5" class="fg-b hot"/><text x="325" y="128" text-anchor="middle" class="fg-t sm acc">eBPF 探針</text>
<line x1="390" y1="123" x2="422" y2="123" class="fg-l on"/><polygon points="430,123 422,118.5 422,127.5" class="fg-a on"/>
<rect x="430" y="70" width="140" height="106" rx="8" class="fg-b hot"/><text x="500" y="98" text-anchor="middle" class="fg-t acc">Falco 規則引擎</text><text x="500" y="122" text-anchor="middle" class="fg-t sm">補上容器、Pod 資訊</text><text x="500" y="140" text-anchor="middle" class="fg-t sm">逐條比對規則</text><text x="500" y="158" text-anchor="middle" class="fg-t sm">例：沒 shell 卻開 sh</text>
<line x1="570" y1="100" x2="592" y2="100" class="fg-l warm"/><polygon points="600,100 592,95.5 592,104.5" class="fg-a warm"/>
<rect x="600" y="80" width="70" height="40" rx="6" class="fg-b warm"/><text x="635" y="105" text-anchor="middle" class="fg-t warm">警報</text>
<line x1="570" y1="150" x2="592" y2="150" class="fg-l"/><polygon points="600,150 592,145.5 592,154.5" class="fg-a"/>
<rect x="600" y="130" width="70" height="40" rx="6" class="fg-b"/><text x="635" y="155" text-anchor="middle" class="fg-t">日誌</text>
</svg><figcaption>規則看的不是檔案長什麼樣子，而是行為：哪個容器、哪個行程、做了哪個系統呼叫。換一支工具、改個檔名，行為還是一樣。</figcaption></figure>
<p>一條規則由條件、輸出和嚴重度組成。下面這條利用了上一節的強化：我們的映像檔裡沒有 shell，所以只要出現 shell，就一定是有人放進來的：</p>
<pre><code>- list: hilo_images
  items: [ghcr.io/example/hilo-api, ghcr.io/example/hilo-worker]

- rule: Shell in hilo container
  desc: 我們的映像檔沒有 shell，出現 shell 就一定有人放進來
  condition: &gt;
    spawned_process and container
    and container.image.repository in (hilo_images)
    and proc.name in (sh, bash, dash, ash)
  output: &gt;
    shell in %container.name (image=%container.image.repository
    cmd=%proc.cmdline parent=%proc.pname user=%user.name)
  priority: CRITICAL
  tags: [container, mitre_execution]</code></pre>
<p>好規則的共同點是「對這個工作負載來說，發生了就一定不正常」：容器裡執行套件管理工具（<code>apt</code>、<code>npm install</code>）；執行一個容器啟動之後才被寫進來的檔案（Falco 預設規則集裡就有這條，靠的是判斷執行檔是否來自容器的可寫層）；應用程式以外的行程去讀 Pod 的服務帳號權杖；連到挖礦池常用的網域或連接埠；對外連到允許清單以外的位址。</p>
<ul>
<li><b>從窄開始。</b>一開始就打開幾百條通用規則，第一週就會被誤報淹沒，然後沒人再看。先挑幾條「發生就一定是事件」的，針對自己的映像檔寫，再慢慢加。</li>
<li><b>想想怎麼被繞過。</b>只比對 <code>proc.name</code> 的規則，攻擊者把 sh 複製成 <code>/tmp/x</code> 就繞過了；所以根目錄唯讀很重要，規則也盡量看行為（例如「執行了可寫層裡的檔案」），而不是名字。</li>
<li><b>偵測和阻擋是兩回事。</b>Falco 只負責看和報；Tetragon 這類工具可以在核心裡直接把違規的行程停掉。阻擋的誤判代價高得多，通常先用偵測模式跑一段時間，確定沒有誤判，再對少數幾條規則開阻擋。</li>
</ul>

<h3><span class="badge lv4">專家</span>九、為事故準備的日誌</h3>
<p>出事那天，應變團隊會問四個問題：<b>怎麼進來的？碰到了什麼？留下了什麼？什麼時候？</b>（第 6.5 課的事件應變）。日誌設計的好壞，就看它能不能回答這四題。用一個供應鏈事件追一次：</p>
<figure class="figure"><svg viewBox="0 0 680 250" class="fg" style="width:100%;max-width:680px" role="img" aria-label="用四份日誌拼出事件時間軸：10:02 CI 裝了被植入的套件，10:03 出站代理看到連到陌生網域，10:21 CloudTrail 看到 CI 角色在國外 IP 被用、10:26 下載存檔，10:33 Kubernetes 稽核看到用 CI 身分部署新映像檔">
<text x="10" y="54" class="fg-t">CI 日誌</text>
<text x="10" y="104" class="fg-t">出站代理</text>
<text x="10" y="154" class="fg-t">CloudTrail</text>
<text x="10" y="204" class="fg-t">K8s 稽核</text>
<line x1="110" y1="50" x2="670" y2="50" class="fg-l dim"/><line x1="110" y1="100" x2="670" y2="100" class="fg-l dim"/><line x1="110" y1="150" x2="670" y2="150" class="fg-l dim"/><line x1="110" y1="200" x2="670" y2="200" class="fg-l dim"/>
<line x1="154" y1="28" x2="154" y2="222" class="fg-l warm dash"/>
<text x="154" y="20" text-anchor="middle" class="fg-t sm warm">入侵起點</text>
<circle cx="154" cy="50" r="6" class="fg-lamp on"/><text x="164" y="40" class="fg-t sm">裝了 hilo-utils 4.2.1</text>
<circle cx="166" cy="100" r="6" class="fg-lamp on"/><text x="176" y="90" class="fg-t sm">連到 x7.example.net</text>
<circle cx="382" cy="150" r="6" class="fg-lamp on"/><text x="392" y="140" class="fg-t sm">CI 角色在國外 IP 被用</text>
<circle cx="442" cy="150" r="6" class="fg-lamp on"/><text x="452" y="170" class="fg-t sm">下載 hilo-saves</text>
<circle cx="526" cy="200" r="6" class="fg-lamp on"/><text x="536" y="190" class="fg-t sm">用 CI 身分部署新映像檔</text>
<line x1="110" y1="222" x2="670" y2="222" class="fg-l"/>
<text x="130" y="240" text-anchor="middle" class="fg-t sm mono">10:00</text><text x="250" y="240" text-anchor="middle" class="fg-t sm mono">10:10</text><text x="370" y="240" text-anchor="middle" class="fg-t sm mono">10:20</text><text x="490" y="240" text-anchor="middle" class="fg-t sm mono">10:30</text><text x="610" y="240" text-anchor="middle" class="fg-t sm mono">10:40</text>
</svg><figcaption>四份來自不同系統的紀錄，時間對得上，才拼得出這條線。任何一份時鐘偏了幾分鐘、保留期太短、或根本沒開，故事就斷在那裡。</figcaption></figure>
<p>從這條時間軸，可以反推出日誌要滿足的條件：</p>
<ul>
<li><b>來源要齊。</b>大家都記得收應用程式日誌，卻常常漏掉這幾種：CI 的執行紀錄（裝了哪些套件、哪個版本）、出站代理和 DNS 查詢紀錄、雲端稽核日誌（含需要的資料事件）、Kubernetes 稽核日誌。這次事件的四個關鍵證據，沒有一個來自應用程式本身。</li>
<li><b>時間要準、要統一。</b>每台機器都用 NTP（例如 chrony）對時，一律記 UTC，用帶時區和毫秒的 ISO 8601 格式。三台機器差兩分鐘，「先連外、還是先下載」就說不清楚了。</li>
<li><b>每一筆都要能串起來。</b>請求 ID 或 trace ID 從邊緣一路帶到資料庫；每一筆都記主體（使用者、服務帳號、角色）、來源 IP、使用者代理字串。</li>
<li><b>攻擊者刪不掉。</b>日誌即時送離產生它的機器，寫到另一個帳號；儲存用 S3 物件鎖定的合規模式（compliance mode），保留期內連管理員都不能刪。CloudTrail 開啟日誌檔驗證，之後用 <code>aws cloudtrail validate-logs</code> 能證明紀錄沒被改過。</li>
<li><b>留得夠久。</b>入侵往往在發生後幾天到幾週才被發現，長的以月計。常見做法是近期的放在能快速查詢的地方，一年以上的轉到便宜的封存儲存。稽核類日誌不要抽樣。</li>
<li><b>不要記秘密。</b>網址裡的權杖、<code>Authorization</code> 標頭、完整的信用卡號，一旦寫進日誌，日誌系統就變成新的外洩點。在送出之前就過濾掉。</li>
</ul>
<p>最後一步最便宜也最有效：拿一個假想的事件（例如「某個 npm 套件被植入，我們的 CI 在昨天下午裝過它」），團隊坐下來，真的用現有的日誌查一遍。查不出來的地方，就是你下一個要補的日誌。</p>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>有鎖檔就不怕惡意套件</td><td>鎖檔只保證「每次裝的都一樣」。你鎖住的版本本身是惡意的、或你合併了含惡意版本的更新，它都擋不了。</td></tr>
<tr><td>簽過章的就是安全的</td><td>簽章證明來源和完整性，不證明善意。SolarWinds 的後門更新就有正牌簽章。</td></tr>
<tr><td>掃描器沒報漏洞，就沒有問題</td><td>掃描器只認得「已知漏洞」。惡意套件在被發現之前，沒有任何 CVE。</td></tr>
<tr><td>只裝熱門套件就安全</td><td>event-stream、ua-parser-js、chalk 都是非常熱門的套件。熱門代表攻擊者更想拿下它。</td></tr>
<tr><td>容器裡 apt-get upgrade 就修好了</td><td>重啟就沒了，而且那個容器不再等於任何測試過的映像檔。正確做法是重建映像檔、重新部署。</td></tr>
<tr><td>SBOM 是給法規看的文件</td><td>它最大的價值在新漏洞公布那天：幾分鐘內知道誰受影響。前提是每次建置都自動產生、存得到、查得到。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>Vue、TypeScript、Node.js：</b>鎖檔一定提交，CI 一律 <code>npm ci</code>；看 PR 時順便看鎖檔的變動；<code>npm audit signatures</code> 能檢查套件的註冊表簽章和出處證明；不需要安裝腳本的專案加上 <code>--ignore-scripts</code>。內部共用的套件放在自己的命名空間。</li>
<li><b>Go：</b><code>go.sum</code> 一定提交；用 <code>govulncheck</code> 掃描，它會分析你的程式是否真的呼叫到有漏洞的函式，比只看版本號的掃描器少很多誤報。</li>
<li><b>Cocos、Unity：</b>從資源商店或第三方下載的外掛、套件，也是供應鏈的一部分。Unity 的套件管理員支援 scoped registry，設定方式和 npm 的命名空間類似，同樣要注意哪些名字會從哪個來源拿。來路不明的編輯器外掛，在你的開發機上以你的權限執行。</li>
<li><b>Docker：</b>基底映像檔用 digest 釘住，交給 Renovate 或 Dependabot 更新；建置時產生 SBOM、掃描、簽章；部署時驗簽章。</li>
<li><b>雲端伺服器：</b>開好自動安全更新，並且監看「需要重開機」的狀態；CloudTrail、DNS 查詢紀錄和 VPC 流量日誌都送到另一個帳號保存。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<p>DevOps、平台工程、應用程式安全的面試，這幾年幾乎一定會問供應鏈。先自己講一遍，再看參考答案。</p>
<ol>
<li>「什麼是相依混淆？你會怎麼防？」</li>
<li>「一個新的重大 CVE 剛公布，你要怎麼在一小時內知道公司哪些服務受影響？」</li>
<li>「映像檔簽章能證明什麼、不能證明什麼？SLSA 的等級在講什麼？」</li>
<li>「你負責三百個容器化的服務，基底映像檔出現重大漏洞，怎麼在幾天內全部修好？」</li>
<li>「執行期偵測在偵測什麼？舉兩條你會寫的規則，並說明為什麼它們誤報很少。」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>當建置工具同時從內部和公開兩個來源找套件，而內部套件的名字在公開來源沒被佔用時，攻擊者在公開來源發布同名、版本號更高的套件，工具就會挑它，安裝時執行攻擊者的程式。防法：內部套件用自己的命名空間（npm 的 scope），並把該命名空間對應到內部註冊表；只設一個來源，由內部代理決定哪些名字能去公開來源拿；鎖檔加雜湊驗證；必要時在公開來源先註冊佔位的名字；CI 不執行安裝腳本、只給最小的機密。</li>
<li>前提是平常就有準備：每次建置從最終成品產生 SBOM，跟映像檔一起存，並知道每個服務目前在正式環境跑的是哪個 digest。漏洞公布時，用 purl 在所有正在執行的版本的 SBOM 裡查受影響的元件和版本範圍，得到清單；再依是否對外、是否真的走得到有漏洞的程式碼（用 VEX 記錄判斷）排序；清單附上負責團隊。沒有 SBOM 的，至少能用掃描器對正在執行的映像檔逐一掃描。</li>
<li>簽章證明這個 digest 是某個身分簽的、簽完沒被改過；配上身分檢查（哪個 repo、哪個工作流程），就能確保只部署自己的 CI 建出來的東西。它不能證明原始碼沒有惡意、建置機沒被控制。SLSA 的 Build 等級描述出處證明有多可信：L1 有出處證明但可偽造；L2 由託管的建置平台簽章，防建置後的竄改；L3 建置彼此隔離、簽章金鑰碰不到使用者的建置步驟，連建置腳本被入侵都偽造不了出處。</li>
<li>前提是所有服務都從少數幾個公司維護的基底映像檔衍生。基底映像檔修好、重建、簽章後，用 Renovate 這類工具自動對每個服務開更新 PR；測試全過就自動合併，經過金絲雀再全面推出；失敗的才由人處理。全程用 SBOM 或掃描結果追蹤進度，量修補延遲。過程中無法馬上修的，用 WAF 規則、關閉功能、限制網路等方式暫時降低風險，並書面記錄例外。</li>
<li>偵測的是行為：容器裡的行程做了哪些系統呼叫，例如執行了什麼、開了哪些檔案、連到哪裡。規則例子：在沒有 shell 的映像檔裡出現 shell；執行了容器啟動後才被寫進可寫層的檔案；應用程式以外的行程讀取服務帳號權杖；連到挖礦池或允許清單以外的位址。它們誤報少，是因為對強化過的工作負載來說，這些事在正常情況下根本不會發生；規則要針對自己的映像檔寫，而不是對整個叢集套用通用規則。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>某專案的 <code>package.json</code> 依賴一個內部套件 <code>"hilo-utils": "*"</code>，<code>.npmrc</code> 設定先找內部註冊表、找不到再找公開的 npm。這個設定有什麼風險？寫出兩種修法。</li>
<li>一個 PR 的說明是「把 date 函式庫從 3.6.0 升到 3.6.1」，但鎖檔多了 38 個新套件，其中一個新增了 <code>postinstall</code> 腳本。你會檢查哪些東西？</li>
<li>寫一條 Falco 規則的條件：容器裡除了 <code>hilo-api</code> 這支程式以外，任何行程讀取 <code>/var/run/secrets/kubernetes.io/serviceaccount/</code> 底下的檔案都要警報。</li>
<li>你的 <code>cosign verify</code> 只寫了 <code>--certificate-oidc-issuer https://token.actions.githubusercontent.com</code>，沒有寫身分。攻擊者可以怎麼通過這道檢查？</li>
<li>替一個五人團隊設計日誌保存：哪些日誌、送到哪裡、留多久、怎麼確保刪不掉？列出你的方案。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>風險是相依混淆：任何人只要在公開 npm 發布一個叫 <code>hilo-utils</code> 的套件，版本範圍 <code>*</code> 又什麼都接受，下次重新解析相依（例如更新鎖檔）就可能裝到它。修法：改名為 <code>@hilo/utils</code>，並在 <code>.npmrc</code> 寫 <code>@hilo:registry=https://npm.internal.example/</code>，讓這個命名空間只從內部來；版本範圍寫具體，並提交鎖檔、CI 用 <code>npm ci</code>；也可以只設一個內部代理當唯一來源。</li>
<li>先看那 38 個套件是誰拉進來的（<code>npm ls 套件名</code>），合不合理；看那個 <code>postinstall</code> 腳本的內容，有沒有下載東西、讀環境變數、連網路；看新套件的發布時間、維護者、下載量，是否剛發布或剛換維護者；比對上游的變更紀錄是否提到新增相依。有疑慮就不合併，先用 <code>--ignore-scripts</code> 在隔離環境安裝檢查。</li>
<li><code>open_read and container and fd.name startswith /var/run/secrets/kubernetes.io/serviceaccount/ and not proc.name = hilo-api</code>。實際上要再排除你已知會讀它的元件（例如某些代理程式），並且最好連同映像檔一起限定，避免別的映像檔裡剛好也有一支叫 hilo-api 的程式。</li>
<li>這只檢查了「憑證是 GitHub Actions 發的」，沒檢查是哪個 repo。攻擊者在自己的 GitHub 帳號開一個 repo，用 GitHub Actions 對他的惡意映像檔簽章，就會得到一個由同一個簽發者發出、完全有效的簽章，通過你的驗證。一定要加上 <code>--certificate-identity</code> 或 <code>--certificate-identity-regexp</code>，限定到你的 repo、工作流程檔案和分支。</li>
<li>參考方案：雲端稽核日誌（所有區域，含重要的資料事件）、身分提供者的登入紀錄、CI 執行紀錄、DNS 查詢與 VPC 流量日誌、Kubernetes 稽核日誌、應用程式的管理操作與業務事件。全部即時送到一個獨立的日誌帳號，只有少數人能讀、沒有人能刪；儲存桶開物件鎖定合規模式，保留至少一年；近 30 到 90 天放在能查詢的地方。CloudTrail 開日誌檔驗證，所有機器用 NTP 對時、記 UTC。敏感欄位在送出前過濾。每季做一次「用日誌回答假想事件」的演練。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>SLSA 官方網站</b>（<a href="https://slsa.dev/">slsa.dev</a>）：每個等級的完整要求、出處證明的格式，以及各種威脅在供應鏈上的位置圖。</li>
<li><b>Sigstore 官方文件</b>（<a href="https://docs.sigstore.dev/">docs.sigstore.dev</a>）：Fulcio、Rekor、cosign 的原理和用法，包括怎麼在 Kubernetes 上強制驗證。</li>
<li><b>Alex Birsan〈Dependency Confusion: How I Hacked Into Apple, Microsoft and Dozens of Other Companies〉</b>：相依混淆的原始文章，寫得像偵探小說，把手法和各家套件管理工具的行為差異講得非常清楚。</li>
<li><b>Falco 官方文件</b>（<a href="https://falco.org/docs/">falco.org/docs</a>）：規則語法、欄位清單和預設規則集。自己在測試叢集裝一份，在容器裡開個 shell，看警報長什麼樣子。</li>
<li><b>Reproducible Builds 專案</b>（<a href="https://reproducible-builds.org/">reproducible-builds.org</a>）：讓建置可重現的所有常見問題和解法，包括 <code>SOURCE_DATE_EPOCH</code> 的規格。</li>
</ul>
` });
