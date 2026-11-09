DEEP({ 'sec-secrets': `
<p>上一課列出了機密會外洩的地方和六條規矩，也介紹了簽章服務和熱冷錢包。這一章把「機密」當成一個有生命週期的東西來管理：它怎麼產生、怎麼送到需要它的程式手上、怎麼換掉、怎麼作廢；它最常在哪些你沒注意的地方留下副本，又要怎麼在它離開你的電腦之前就擋下來。接著往上走三層：讓機密活得越短越好的動態憑證，讓機密根本不存在的工作負載身分，以及讓資料庫外洩也不等於資料外洩的信封加密。最後是最高價值金鑰的隔離設計，和一個便宜又有效的早期警報：金絲雀 token。</p>

<h3><span class="badge lv1">基礎</span>一、機密的一生</h3>
<p>想像兩種開公司大門的方法。一種是實體鑰匙：打了幾把、給了誰，時間一久就沒人說得清楚；員工離職沒還，你也不知道他有沒有偷偷多打一把；要換鎖，就得通知所有人來拿新鑰匙。另一種是門禁卡：每張卡記名、有效期限寫在系統裡、每次刷卡都有紀錄，弄丟了在電腦上停用就好。管理機密的目標，就是<b>把每一把「實體鑰匙」都變成「門禁卡」</b>。</p>
<figure class="figure"><svg viewBox="0 0 680 240" class="fg" style="width:100%;max-width:680px" role="img" aria-label="機密的生命週期：產生、儲存、分發、使用、輪替、撤銷，形成一個循環">
<rect x="30" y="30" width="170" height="60" rx="6" class="fg-b alt"/><text x="115" y="55" text-anchor="middle" class="fg-t">1 產生</text><text x="115" y="75" text-anchor="middle" class="fg-t sm">密碼學亂數、夠長</text>
<rect x="255" y="30" width="170" height="60" rx="6" class="fg-b alt"/><text x="340" y="55" text-anchor="middle" class="fg-t">2 儲存</text><text x="340" y="75" text-anchor="middle" class="fg-t sm">機密管理服務、加密</text>
<rect x="480" y="30" width="170" height="60" rx="6" class="fg-b alt"/><text x="565" y="55" text-anchor="middle" class="fg-t">3 分發</text><text x="565" y="75" text-anchor="middle" class="fg-t sm">執行時用身分去拿</text>
<rect x="480" y="170" width="170" height="60" rx="6" class="fg-b hot"/><text x="565" y="195" text-anchor="middle" class="fg-t acc">4 使用</text><text x="565" y="215" text-anchor="middle" class="fg-t sm">只在記憶體、不進日誌</text>
<rect x="255" y="170" width="170" height="60" rx="6" class="fg-b alt"/><text x="340" y="195" text-anchor="middle" class="fg-t">5 輪替</text><text x="340" y="215" text-anchor="middle" class="fg-t sm">新舊並存，再切換</text>
<rect x="30" y="170" width="170" height="60" rx="6" class="fg-b warm"/><text x="115" y="195" text-anchor="middle" class="fg-t">6 撤銷</text><text x="115" y="215" text-anchor="middle" class="fg-t sm">舊的立刻失效</text>
<line x1="200" y1="60" x2="247" y2="60" class="fg-l"/><polygon points="255,60 247,55.5 247,64.5" class="fg-a"/>
<line x1="425" y1="60" x2="472" y2="60" class="fg-l"/><polygon points="480,60 472,55.5 472,64.5" class="fg-a"/>
<line x1="565" y1="90" x2="565" y2="162" class="fg-l"/><polygon points="565,170 560.5,162 569.5,162" class="fg-a"/>
<line x1="480" y1="200" x2="433" y2="200" class="fg-l"/><polygon points="425,200 433,195.5 433,204.5" class="fg-a"/>
<line x1="255" y1="200" x2="208" y2="200" class="fg-l"/><polygon points="200,200 208,195.5 208,204.5" class="fg-a"/>
<line x1="115" y1="170" x2="115" y2="98" class="fg-l dash"/><polygon points="115,90 110.5,98 119.5,98" class="fg-a"/>
<text x="340" y="134" text-anchor="middle" class="fg-t sm">每一步都要留紀錄：誰、什麼時候、拿了哪一把</text>
</svg><figcaption>機密不是「設定一次就放著」的東西，而是一個循環。哪一步做不到，那一步就是外洩後收不回來的原因：不知道給了誰，就撤銷不完全；沒辦法輪替，外洩了也只能硬著頭皮繼續用。</figcaption></figure>
<ul>
<li><b>產生</b>：用密碼學等級的亂數，例如 <code>openssl rand -base64 32</code> 或 <code>crypto.randomBytes(32)</code>。不要讓人「想」一組密碼。可以的話，直接在機密管理服務裡產生，連你自己都不用看到。</li>
<li><b>儲存</b>：放在機密管理服務裡，加密存放，存取有權限控管和紀錄。</li>
<li><b>分發</b>：程式啟動時，用自己的身分（雲端角色）去拿，而不是有人把它複製貼上到伺服器上。</li>
<li><b>使用</b>：只放在記憶體裡，不寫進日誌、不放進錯誤訊息、不回給用戶端。</li>
<li><b>輪替與撤銷</b>：下面第四節細講。</li>
</ul>
<h4>先做一份清冊</h4>
<p>不知道自己有哪些機密，就談不上管理。每一把都記下這幾欄：</p>
<table>
<tr><th>欄位</th><th>例子</th></tr>
<tr><td>名稱和用途</td><td><code>prod/game-api/db</code>，遊戲 API 連正式資料庫</td></tr>
<tr><td>負責人</td><td>後端組</td></tr>
<tr><td>誰讀得到</td><td>game-api 的執行角色、兩位維運人員</td></tr>
<tr><td>副本在哪裡</td><td>只在 Secrets Manager（如果還有別的地方，就是待修項目）</td></tr>
<tr><td>上次輪替、怎麼輪替</td><td>每 30 天自動；手動輪替的步驟寫在維運手冊第 4 節</td></tr>
<tr><td>外洩時的影響</td><td>可讀寫玩家餘額，最高等級</td></tr>
</table>

<h3><span class="badge lv1">基礎</span>二、機密會不小心跑去哪裡</h3>
<p>機密很少是被「偷」走的，大多是被<b>複製</b>到某個你沒想到的地方，再從那裡漏出去。順著一把資料庫密碼從開發者的筆電一路走到正式環境，沿途每一站都可能留下副本：</p>
<figure class="figure"><svg viewBox="0 0 680 265" class="fg" style="width:100%;max-width:680px" role="img" aria-label="機密從筆電、Git、CI、映像檔、伺服器到日誌與備份的路徑，每一站上方是常見的外洩點，下方是對應的防法">
<rect x="10" y="20" width="100" height="56" rx="5" class="fg-b warm"/><text x="60" y="44" text-anchor="middle" class="fg-t sm">.env 檔案</text><text x="60" y="62" text-anchor="middle" class="fg-t sm">shell 歷史</text>
<rect x="122" y="20" width="100" height="56" rx="5" class="fg-b warm"/><text x="172" y="44" text-anchor="middle" class="fg-t sm">提交過一次</text><text x="172" y="62" text-anchor="middle" class="fg-t sm">就永遠留著</text>
<rect x="234" y="20" width="100" height="56" rx="5" class="fg-b warm"/><text x="284" y="44" text-anchor="middle" class="fg-t sm">日誌印出來</text><text x="284" y="62" text-anchor="middle" class="fg-t sm">除錯輸出</text>
<rect x="346" y="20" width="100" height="56" rx="5" class="fg-b warm"/><text x="396" y="44" text-anchor="middle" class="fg-t sm">ENV、ARG</text><text x="396" y="62" text-anchor="middle" class="fg-t sm">COPY 的檔案</text>
<rect x="458" y="20" width="100" height="56" rx="5" class="fg-b warm"/><text x="508" y="44" text-anchor="middle" class="fg-t sm">環境變數</text><text x="508" y="62" text-anchor="middle" class="fg-t sm">當機傾印</text>
<rect x="570" y="20" width="100" height="56" rx="5" class="fg-b warm"/><text x="620" y="44" text-anchor="middle" class="fg-t sm">請求標頭</text><text x="620" y="62" text-anchor="middle" class="fg-t sm">資料庫匯出</text>
<line x1="60" y1="76" x2="60" y2="100" class="fg-l dim"/><line x1="172" y1="76" x2="172" y2="100" class="fg-l dim"/><line x1="284" y1="76" x2="284" y2="100" class="fg-l dim"/><line x1="396" y1="76" x2="396" y2="100" class="fg-l dim"/><line x1="508" y1="76" x2="508" y2="100" class="fg-l dim"/><line x1="620" y1="76" x2="620" y2="100" class="fg-l dim"/>
<rect x="10" y="100" width="100" height="44" rx="5" class="fg-b"/><text x="60" y="127" text-anchor="middle" class="fg-t">筆電</text>
<rect x="122" y="100" width="100" height="44" rx="5" class="fg-b"/><text x="172" y="127" text-anchor="middle" class="fg-t">Git</text>
<rect x="234" y="100" width="100" height="44" rx="5" class="fg-b"/><text x="284" y="127" text-anchor="middle" class="fg-t">CI 管線</text>
<rect x="346" y="100" width="100" height="44" rx="5" class="fg-b"/><text x="396" y="127" text-anchor="middle" class="fg-t">映像檔</text>
<rect x="458" y="100" width="100" height="44" rx="5" class="fg-b"/><text x="508" y="127" text-anchor="middle" class="fg-t">伺服器</text>
<rect x="570" y="100" width="100" height="44" rx="5" class="fg-b"/><text x="620" y="127" text-anchor="middle" class="fg-t">日誌與備份</text>
<polygon points="122,122 114,117.5 114,126.5" class="fg-a"/><polygon points="234,122 226,117.5 226,126.5" class="fg-a"/><polygon points="346,122 338,117.5 338,126.5" class="fg-a"/><polygon points="458,122 450,117.5 450,126.5" class="fg-a"/><polygon points="570,122 562,117.5 562,126.5" class="fg-a"/>
<line x1="60" y1="144" x2="60" y2="170" class="fg-l dim"/><line x1="172" y1="144" x2="172" y2="170" class="fg-l dim"/><line x1="284" y1="144" x2="284" y2="170" class="fg-l dim"/><line x1="396" y1="144" x2="396" y2="170" class="fg-l dim"/><line x1="508" y1="144" x2="508" y2="170" class="fg-l dim"/><line x1="620" y1="144" x2="620" y2="170" class="fg-l dim"/>
<rect x="10" y="170" width="100" height="56" rx="5" class="fg-b hot"/><text x="60" y="194" text-anchor="middle" class="fg-t sm">密碼管理器</text><text x="60" y="212" text-anchor="middle" class="fg-t sm">不存明文</text>
<rect x="122" y="170" width="100" height="56" rx="5" class="fg-b hot"/><text x="172" y="194" text-anchor="middle" class="fg-t sm">pre-commit</text><text x="172" y="212" text-anchor="middle" class="fg-t sm">機密掃描</text>
<rect x="234" y="170" width="100" height="56" rx="5" class="fg-b hot"/><text x="284" y="194" text-anchor="middle" class="fg-t sm">OIDC 聯合</text><text x="284" y="212" text-anchor="middle" class="fg-t sm">自動遮罩</text>
<rect x="346" y="170" width="100" height="56" rx="5" class="fg-b hot"/><text x="396" y="194" text-anchor="middle" class="fg-t sm">secret mount</text><text x="396" y="212" text-anchor="middle" class="fg-t sm">多階段建置</text>
<rect x="458" y="170" width="100" height="56" rx="5" class="fg-b hot"/><text x="508" y="194" text-anchor="middle" class="fg-t sm">執行時才拿</text><text x="508" y="212" text-anchor="middle" class="fg-t sm">用角色身分</text>
<rect x="570" y="170" width="100" height="56" rx="5" class="fg-b hot"/><text x="620" y="194" text-anchor="middle" class="fg-t sm">欄位遮蔽</text><text x="620" y="212" text-anchor="middle" class="fg-t sm">備份加密</text>
<text x="340" y="252" text-anchor="middle" class="fg-t sm">橘色：機密常在這裡留下副本　綠色：對應的防法</text>
</svg><figcaption>同一把密碼，走完一趟部署可能留下六份副本。每一站的防法都不一樣，但原則相同：機密不要被「寫下來」，而是在需要的那一刻，用身分去拿。</figcaption></figure>
<p>除了圖上這幾站，還有幾個特別容易被忽略的地方：</p>
<ul>
<li><b>前端的建置設定</b>：Vite 會把 <code>VITE_</code> 開頭的環境變數直接寫進打包後的 JavaScript，任何人打開瀏覽器都看得到。前端只能放公開的設定，例如 API 的網址，<b>絕對不能放任何金鑰</b>。</li>
<li><b>遊戲和 App 的安裝包</b>：Cocos、Unity 打包出來的檔案可以被解開。寫在用戶端裡的「祕密」都不是祕密。需要金鑰的動作，一律由伺服器代勞。</li>
<li><b>Terraform 的狀態檔</b>：裡面會以明文記錄資源的屬性，包括資料庫的初始密碼。狀態檔要放在加密、權限嚴格的遠端後端，不能進 git。</li>
<li><b>Kubernetes Secret</b>：預設只是 Base64 編碼，不是加密。要開啟 etcd 的靜態加密，並用 RBAC 限制誰能讀。</li>
<li><b>錯誤追蹤和日誌服務</b>：自動附上的請求標頭裡有 <code>Authorization</code> 和 cookie。</li>
</ul>

<h3><span class="badge lv2">進階</span>三、在外洩之前擋下來</h3>
<h4>在提交之前：pre-commit 掃描</h4>
<p>最便宜的攔截點是開發者自己的電腦。gitleaks 這類工具用一組規則（已知格式的金鑰、私鑰的開頭、高亂度的字串）掃描即將提交的內容，找到就讓提交失敗：</p>
<pre><code># .pre-commit-config.yaml（用 pre-commit 這個工具管理 git hook）
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.x.x        # 換成 gitleaks 目前最新的版本標籤
    hooks:
      - id: gitleaks</code></pre>
<ul>
<li><code>.env</code> 放進 <code>.gitignore</code>，另外提交一份只有欄位名稱、沒有值的 <code>.env.example</code>，新同事照著填。</li>
<li>本機的 hook 可以被跳過，所以 CI 裡要再掃一次，而且是掃整段歷史。GitHub 的 secret scanning 和 push protection 也會在推上去的時候攔下已知格式的金鑰。</li>
<li>掃描工具有誤報。用允許清單標記確定無害的測試資料，不要因為誤報就整個關掉。</li>
</ul>
<h4>在 CI 裡：遮罩有極限</h4>
<p>GitHub Actions 這類平台會把登記過的機密在日誌裡自動換成 <code>***</code>，但它只認得「原封不動的那串字」。機密被 Base64 編碼、被切成兩半、被放進 JSON 印出來，遮罩就認不得了。<code>set -x</code> 會把每一行指令連同展開後的變數印出來。所以規則是：不要依賴遮罩，<b>根本不要讓機密出現在輸出裡</b>；從機密衍生出來的值，用 <code>::add-mask::</code> 額外登記。另外，來自外部 fork 的 pull request 觸發的工作，不能拿到任何正式環境的機密。</p>
<h4>在映像檔裡：每一層都是永久的</h4>
<p>映像檔是一層一層疊起來的。某一層 <code>COPY</code> 了 <code>.env</code>，下一層就算把它刪掉，前一層裡還是有完整的檔案；<code>ENV</code> 和 <code>ARG</code> 的值也會留在映像檔的歷史裡。建置時需要的機密（例如私有套件庫的 token），用 BuildKit 的 secret mount，它只在那一步存在，不會寫進任何一層：</p>
<pre><code># syntax=docker/dockerfile:1
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
USER node
CMD ["node", "dist/server.js"]

# 建置：docker build --secret id=npmrc,src=$HOME/.npmrc -t game-api .</code></pre>
<p>再搭配 <code>.dockerignore</code> 排除 <code>.env</code>、<code>.git</code>、<code>*.pem</code>，並且用多階段建置，讓最後的映像檔只有執行需要的東西。驗證方法：<code>docker history --no-trunc 映像檔名稱</code> 看每一層的指令，確認沒有任何機密。</p>
<h4>在日誌裡：從記錄器的設定擋</h4>
<pre><code>import pino from 'pino';

const log = pino({
  redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.apiKey'],
});</code></pre>
<p>遮蔽要設在記錄器上，不要指望每個人寫日誌時都記得。錯誤追蹤服務也有類似的「送出前過濾」設定，要一併打開。</p>
<h4>如果已經外洩了：順序很重要</h4>
<ol>
<li><b>先撤銷或輪替</b>。不要先花時間清歷史紀錄：自動化的掃描工具可能早就抓到了。</li>
<li><b>查使用紀錄</b>：從外洩的那一刻到撤銷之間，這把金鑰有沒有被不認識的來源用過（雲端的稽核日誌、資料庫的連線紀錄）。</li>
<li><b>清理副本</b>：需要的話，用 <code>git filter-repo</code> 清掉歷史，但要記得：這只能減少之後的曝光，收不回已經發生的。</li>
<li><b>檢討</b>：為什麼它能被提交？補上哪一道攔截？</li>
</ol>

<h3><span class="badge lv2">進階</span>四、機密管理服務、輪替與動態憑證</h3>
<p>機密管理服務（AWS Secrets Manager、Parameter Store、HashiCorp Vault、GCP Secret Manager、Azure Key Vault）做的事都差不多：加密存放、依身分授權、每次讀取都留紀錄、支援版本和輪替。程式啟動時用自己的雲端角色去讀，存在記憶體裡，並且設一個快取時間（例如 5 分鐘），讓輪替之後能自動拿到新值。在 Kubernetes 上，常見的做法是 External Secrets Operator 或 Secrets Store CSI Driver，把雲端的機密同步成 Pod 讀得到的形式。</p>
<h4>不停機的輪替：新舊並存</h4>
<p>輪替最怕的是「換了新密碼，還有一半的伺服器拿著舊的」，結果服務中斷。解法是讓新舊兩把在一段時間內同時有效：</p>
<figure class="figure"><svg viewBox="0 0 680 225" class="fg" style="width:100%;max-width:680px" role="img" aria-label="時間軸：舊金鑰 A 一直有效到第三步才撤銷，新金鑰 B 在第一步產生，中間有一段兩把都有效的重疊期，呼叫端在第二步全部改用 B">
<rect x="30" y="40" width="440" height="34" rx="5" class="fg-b"/><text x="44" y="62" class="fg-t">金鑰 A（舊）</text><text x="488" y="62" class="fg-t sm warm">撤銷</text>
<rect x="200" y="96" width="450" height="34" rx="5" class="fg-b hot"/><text x="214" y="118" class="fg-t acc">金鑰 B（新）</text>
<rect x="192" y="30" width="286" height="112" rx="6" class="fg-l warm dash"/>
<text x="335" y="160" text-anchor="middle" class="fg-t sm warm">驗證端同時接受 A 和 B</text>
<line x1="200" y1="172" x2="200" y2="190" class="fg-l dim"/><line x1="330" y1="172" x2="330" y2="190" class="fg-l dim"/><line x1="470" y1="172" x2="470" y2="190" class="fg-l dim"/>
<line x1="30" y1="190" x2="642" y2="190" class="fg-l"/><polygon points="650,190 642,185.5 642,194.5" class="fg-a"/>
<text x="200" y="210" text-anchor="middle" class="fg-t sm">1 產生 B</text>
<text x="330" y="210" text-anchor="middle" class="fg-t sm">2 呼叫端全部改用 B</text>
<text x="470" y="210" text-anchor="middle" class="fg-t sm">3 確認沒人用 A</text>
<text x="40" y="210" class="fg-t sm">時間</text>
</svg><figcaption>重點在第三步之前要「確認」：看稽核紀錄或資料庫的連線紀錄，確定已經沒有任何東西在用 A，才撤銷它。重疊期可以是幾分鐘，也可以是一天，看你的部署要多久才能全部換完。</figcaption></figure>
<p>資料庫密碼的常見做法是準備兩個資料庫帳號輪流用：這次改 <code>app_a</code> 的密碼、讓程式切到 <code>app_a</code>，下次改 <code>app_b</code>。AWS Secrets Manager 的自動輪替也是同樣的思路，用 <code>AWSCURRENT</code> 和 <code>AWSPENDING</code> 這類版本標籤來區分新舊。API 金鑰、JWT 的簽章金鑰也一樣：簽章用新的，驗證時新舊都接受，等舊的簽出去的 token 全部過期再移除。</p>
<h4>動態憑證：每次都發一組新的</h4>
<p>輪替再勤，機密還是「活很久、很多程式共用」。更進一步的做法是<b>動態憑證</b>（dynamic credentials）：程式每次需要時，才請機密管理服務當場建立一組只屬於它、幾小時後自動作廢的帳密。以 Vault 的資料庫機密引擎為例：</p>
<pre><code>$ vault read database/creds/game-api
Key                Value
---                -----
lease_id           database/creds/game-api/7Hq2…
lease_duration     1h
username           v-game-api-x7Kq…
password           （每次隨機產生）</code></pre>
<p>Vault 在資料庫裡真的建立了一個新帳號，只有 <code>game-api</code> 這個角色設定的權限，一小時後租約（lease）到期，Vault 自動把這個帳號刪掉。好處有三個：每個程式實例的帳號都不同，出事時看資料庫的連線紀錄就知道是哪一台；被偷了最多用一小時；沒有任何人需要「知道」這組密碼。AWS RDS 的 IAM 驗證是另一種形式：程式用自己的雲端角色，換一張 15 分鐘有效的登入 token，資料庫完全不需要存密碼。</p>

<h3><span class="badge lv3">專業</span>五、工作負載身分：根本不發機密</h3>
<p>最好的機密是不存在的機密。<b>工作負載身分</b>（workload identity）的意思是：程式不靠「出示一把鑰匙」證明自己是誰，而是靠<b>它跑在哪裡</b>。雲端平台知道這台虛擬機器、這個容器、這個 Pod 是誰，就直接發給它短期憑證：</p>
<ul>
<li><b>虛擬機器</b>：EC2 的執行個體角色，憑證從中繼資料服務取得，SDK 會自動處理和更新（第 5.5 課）。</li>
<li><b>容器</b>：ECS 的 task role，每個工作各自有角色，而不是整台主機共用一個。</li>
<li><b>Kubernetes</b>：EKS 的 IRSA 或 Pod Identity、GKE 的 Workload Identity，讓每個 service account 對應到一個雲端角色。</li>
<li><b>CI 管線</b>：OIDC 聯合（federation），下面細講。</li>
</ul>
<h4>CI 的 OIDC 聯合：管線裡沒有任何雲端金鑰</h4>
<p>過去要讓 GitHub Actions 部署到 AWS，得把一組長期的存取金鑰存成 repository secret。那組金鑰權限大、不會過期，任何能改 workflow 的人都可能把它帶走。OIDC 聯合把它整個拿掉：</p>
<figure class="figure"><svg viewBox="0 0 680 260" class="fg" style="width:100%;max-width:680px" role="img" aria-label="CI 工作向 GitHub OIDC 提供者要一張 JWT，帶著它向 AWS STS 換憑證，STS 用信任政策比對 sub 和 aud，發回一小時的臨時憑證，CI 工作用它部署">
<path d="M105 40 V20 H592 V32" class="fg-l on"/><polygon points="592,40 587.5,32 596.5,32" class="fg-a on"/>
<text x="420" y="14" text-anchor="middle" class="fg-t sm acc">6 用臨時憑證部署</text>
<rect x="20" y="40" width="170" height="56" rx="6" class="fg-b alt"/><text x="105" y="63" text-anchor="middle" class="fg-t">CI 工作</text><text x="105" y="83" text-anchor="middle" class="fg-t sm">GitHub Actions</text>
<rect x="290" y="40" width="170" height="56" rx="6" class="fg-b hot"/><text x="375" y="63" text-anchor="middle" class="fg-t acc">AWS STS</text><text x="375" y="83" text-anchor="middle" class="fg-t sm">發臨時憑證</text>
<rect x="520" y="40" width="145" height="56" rx="6" class="fg-b"/><text x="592" y="63" text-anchor="middle" class="fg-t">部署目標</text><text x="592" y="83" text-anchor="middle" class="fg-t sm">ECS、S3 等</text>
<rect x="20" y="170" width="170" height="56" rx="6" class="fg-b"/><text x="105" y="193" text-anchor="middle" class="fg-t">GitHub OIDC 提供者</text><text x="105" y="213" text-anchor="middle" class="fg-t sm">簽發 JWT</text>
<rect x="290" y="170" width="170" height="56" rx="6" class="fg-b alt"/><text x="375" y="193" text-anchor="middle" class="fg-t">角色的信任政策</text><text x="375" y="213" text-anchor="middle" class="fg-t sm">只信指定 repo＋環境</text>
<rect x="520" y="170" width="145" height="56" rx="6" class="fg-b hot"/><text x="592" y="193" text-anchor="middle" class="fg-t acc">沒有長期金鑰</text><text x="592" y="213" text-anchor="middle" class="fg-t sm">一小時後自己失效</text>
<line x1="80" y1="96" x2="80" y2="162" class="fg-l"/><polygon points="80,170 75.5,162 84.5,162" class="fg-a"/><text x="72" y="136" text-anchor="end" class="fg-t sm">1 要 token</text>
<line x1="130" y1="170" x2="130" y2="104" class="fg-l alt"/><polygon points="130,96 125.5,104 134.5,104" class="fg-a alt"/><text x="138" y="136" class="fg-t sm alt">2 簽好的 JWT</text>
<line x1="190" y1="56" x2="282" y2="56" class="fg-l"/><polygon points="290,56 282,51.5 282,60.5" class="fg-a"/><text x="240" y="48" text-anchor="middle" class="fg-t sm">3 帶 JWT 換</text>
<line x1="290" y1="82" x2="198" y2="82" class="fg-l on"/><polygon points="190,82 198,77.5 198,86.5" class="fg-a on"/><text x="240" y="110" text-anchor="middle" class="fg-t sm acc">5 臨時憑證</text>
<line x1="375" y1="96" x2="375" y2="162" class="fg-l"/><polygon points="375,170 370.5,162 379.5,162" class="fg-a"/><text x="383" y="136" class="fg-t sm">4 比對 sub、aud</text>
</svg><figcaption>JWT 由 GitHub 簽章，裡面寫著是哪個 repo、哪個分支、哪個環境在執行。AWS 用 GitHub 公布的公鑰驗章，再用角色的信任政策決定要不要發憑證。整條路上沒有任何一把需要保管的長期金鑰。</figcaption></figure>
<pre><code>{
  "Effect": "Allow",
  "Principal": { "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com" },
  "Action": "sts:AssumeRoleWithWebIdentity",
  "Condition": {
    "StringEquals": {
      "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
      "token.actions.githubusercontent.com:sub": "repo:my-org/game-api:environment:production"
    }
  }
}</code></pre>
<pre><code># .github/workflows/deploy.yml（節錄）
permissions:
  id-token: write      # 允許這個工作向 GitHub 要 OIDC token
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/deploy-game-api
          aws-region: ap-northeast-1</code></pre>
<div class="warn"><b>信任政策是整個設計的鎖頭。</b>最常見的錯誤是 <code>sub</code> 條件寫得太寬，例如用萬用字元比對整個組織的所有 repo，甚至沒寫 <code>sub</code> 條件。這等於讓任何能在那些 repo 跑 workflow 的人，都能拿到部署權限。<code>sub</code> 要精確到 repo 加環境（或受保護的分支），並在 GitHub 那一側替 production 環境設定必要的審核者。</div>
<p>同樣的機制也適用在 GitLab CI、Kubernetes 的 service account token、以及跨雲端（例如 GCP 的 Workload Identity Federation 信任 AWS 的角色）。原理都一樣：<b>一方簽發「我是誰」的聲明，另一方驗章並依條件發短期憑證</b>。</p>

<h3><span class="badge lv3">專業</span>六、信封加密與 KMS</h3>
<p>資料庫裡有些欄位需要額外加密，例如 TOTP 的共享金鑰、玩家的身分證字號。問題是：拿來加密的那把金鑰要放哪裡？放在設定檔裡，就跟資料庫一起被偷了。<b>信封加密</b>（envelope encryption）的做法是兩層金鑰：</p>
<ul>
<li><b>資料金鑰</b>（data encryption key，DEK）：真正拿來加密資料的 AES 金鑰。</li>
<li><b>主金鑰</b>（key encryption key，KEK）：存在 KMS（金鑰管理服務）裡，<b>永遠不會離開 KMS</b>，只用來「包」和「拆」資料金鑰。</li>
</ul>
<figure class="figure"><svg viewBox="0 0 680 290" class="fg" style="width:100%;max-width:680px" role="img" aria-label="加密時程式向 KMS 要一把資料金鑰，拿到明文和被包起來的兩份，用明文加密資料後丟掉，只存密文和包好的金鑰；解密時把包好的金鑰交給 KMS 解開，KMS 查權限並記錄，程式拿回明文金鑰在本機解密">
<text x="20" y="24" class="fg-t acc">加密</text>
<rect x="255" y="20" width="170" height="60" rx="6" class="fg-b alt"/><text x="340" y="45" text-anchor="middle" class="fg-t">KMS</text><text x="340" y="65" text-anchor="middle" class="fg-t sm">主金鑰永遠不出來</text>
<rect x="20" y="110" width="170" height="70" rx="6" class="fg-b"/><text x="105" y="138" text-anchor="middle" class="fg-t">你的程式</text><text x="105" y="158" text-anchor="middle" class="fg-t sm">加密後丟掉明文 DEK</text>
<rect x="490" y="110" width="170" height="70" rx="6" class="fg-b hot"/><text x="575" y="138" text-anchor="middle" class="fg-t">存起來的東西</text><text x="575" y="158" text-anchor="middle" class="fg-t sm">密文＋包好的 DEK</text>
<path d="M80 110 V50 H247" class="fg-l"/><polygon points="255,50 247,45.5 247,54.5" class="fg-a"/>
<text x="165" y="42" text-anchor="middle" class="fg-t sm">1 要一把資料金鑰</text>
<path d="M255 66 H140 V102" class="fg-l alt"/><polygon points="140,110 135.5,102 144.5,102" class="fg-a alt"/>
<text x="200" y="86" text-anchor="middle" class="fg-t sm alt">2 明文＋包好的</text>
<line x1="190" y1="145" x2="482" y2="145" class="fg-l on"/><polygon points="490,145 482,140.5 482,149.5" class="fg-a on"/>
<text x="340" y="137" text-anchor="middle" class="fg-t sm acc">3 用 DEK 加密，存密文</text>
<line x1="20" y1="196" x2="660" y2="196" class="fg-l dim"/>
<text x="20" y="216" class="fg-t warm">解密</text>
<rect x="20" y="226" width="145" height="50" rx="6" class="fg-b"/><text x="92" y="246" text-anchor="middle" class="fg-t sm">讀出密文</text><text x="92" y="264" text-anchor="middle" class="fg-t sm">和包好的 DEK</text>
<rect x="187" y="226" width="145" height="50" rx="6" class="fg-b alt"/><text x="259" y="246" text-anchor="middle" class="fg-t sm">KMS 解開 DEK</text><text x="259" y="264" text-anchor="middle" class="fg-t sm">查權限、寫日誌</text>
<rect x="354" y="226" width="145" height="50" rx="6" class="fg-b"/><text x="426" y="246" text-anchor="middle" class="fg-t sm">拿回明文 DEK</text><text x="426" y="264" text-anchor="middle" class="fg-t sm">只在記憶體</text>
<rect x="521" y="226" width="145" height="50" rx="6" class="fg-b hot"/><text x="593" y="246" text-anchor="middle" class="fg-t sm">本機解密資料</text><text x="593" y="264" text-anchor="middle" class="fg-t sm">用完就清掉</text>
<line x1="165" y1="251" x2="179" y2="251" class="fg-l"/><polygon points="187,251 179,246.5 179,255.5" class="fg-a"/>
<line x1="332" y1="251" x2="346" y2="251" class="fg-l"/><polygon points="354,251 346,246.5 346,255.5" class="fg-a"/>
<line x1="499" y1="251" x2="513" y2="251" class="fg-l"/><polygon points="521,251 513,246.5 513,255.5" class="fg-a"/>
</svg><figcaption>資料庫外洩時，攻擊者拿到的是密文和「被包起來的」資料金鑰；要拆開它，必須呼叫 KMS，而 KMS 會檢查呼叫者的身分，並在稽核日誌留下紀錄。</figcaption></figure>
<pre><code>import { KMSClient, GenerateDataKeyCommand, DecryptCommand } from '@aws-sdk/client-kms';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const kms = new KMSClient({});

export async function seal(plain: Buffer, userId: string) {
  const ctx = { userId };   // 加密情境：解密時必須一模一樣，也會出現在稽核日誌裡
  const dk = await kms.send(new GenerateDataKeyCommand({
    KeyId: 'alias/player-secrets', KeySpec: 'AES_256', EncryptionContext: ctx }));
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', dk.Plaintext!, iv);
  const body = Buffer.concat([c.update(plain), c.final()]);
  dk.Plaintext!.fill(0);    // 明文資料金鑰用完就清掉
  return { wrappedKey: dk.CiphertextBlob!, iv, tag: c.getAuthTag(), body };
}

export async function open(s: Awaited&lt;ReturnType&lt;typeof seal&gt;&gt;, userId: string) {
  const dk = await kms.send(new DecryptCommand({
    CiphertextBlob: s.wrappedKey, EncryptionContext: { userId } }));
  const d = createDecipheriv('aes-256-gcm', dk.Plaintext!, s.iv);
  d.setAuthTag(s.tag);
  return Buffer.concat([d.update(s.body), d.final()]);
}</code></pre>
<p>AES-GCM 的 nonce 為什麼一定不能重複，第 0.15 課講過；這裡每次加密都用新的資料金鑰和新的 IV，兩個條件都滿足。為什麼要這麼麻煩，不直接把資料送給 KMS 加密？</p>
<ul>
<li><b>大小和速度</b>：KMS 的直接加密一次只收很小的資料（AWS 是 4 KB），而且每次都是一次網路呼叫。信封加密讓大量資料在本機加密。</li>
<li><b>權限和紀錄</b>：每一次解密都經過 KMS 的權限檢查，並記在 CloudTrail。資料庫被整份拖走，沒有 KMS 權限也解不開。</li>
<li><b>加密情境</b>（encryption context）：把 <code>userId</code> 綁進去，A 玩家的密文就算被搬到 B 玩家的欄位，也解不開。</li>
<li><b>主金鑰輪替不用重新加密資料</b>：KMS 會保留舊版本的主金鑰來解舊的資料金鑰，新的加密用新版本。</li>
<li><b>加密銷毀</b>（crypto-shredding）：刪掉某把金鑰，用它加密的資料就永遠讀不回來，可以用來處理「刪除我的資料」這類要求，連備份裡的副本也一起失效。</li>
</ul>
<p>正式環境建議直接用 AWS Encryption SDK 這類函式庫，它把上面的流程、格式和資料金鑰快取都包好了；自己寫的版本，適合用來理解原理。</p>

<h3><span class="badge lv4">專家</span>七、高價值金鑰：隔離的簽章服務</h3>
<p>上一課講了簽章服務的概念：金鑰只存在一個被隔離的地方，別的服務只能「請它簽」。這一節看它內部要怎麼設計，才能在其他服務被攻破時真的守得住。</p>
<figure class="figure"><svg viewBox="0 0 680 290" class="fg" style="width:100%;max-width:680px" role="img" aria-label="出金工作者請簽章服務簽一筆交易，簽章服務依序檢查單筆上限、單日累計、允許清單與冷卻期、速率、兩人核准，全部通過才交給 HSM 簽章，並把每一次請求寫進送到別處的稽核日誌">
<rect x="10" y="20" width="120" height="60" rx="6" class="fg-b alt"/><text x="70" y="45" text-anchor="middle" class="fg-t">核准者</text><text x="70" y="65" text-anchor="middle" class="fg-t sm">用 WebAuthn 簽核</text>
<rect x="10" y="110" width="120" height="60" rx="6" class="fg-b"/><text x="70" y="135" text-anchor="middle" class="fg-t">出金工作者</text><text x="70" y="155" text-anchor="middle" class="fg-t sm">沒有金鑰</text>
<rect x="10" y="210" width="120" height="60" rx="6" class="fg-b"/><text x="70" y="235" text-anchor="middle" class="fg-t">稽核日誌</text><text x="70" y="255" text-anchor="middle" class="fg-t sm">送到別的帳號</text>
<rect x="190" y="20" width="300" height="250" rx="8" class="fg-b hot"/>
<text x="340" y="44" text-anchor="middle" class="fg-t acc">簽章服務</text>
<rect x="205" y="58" width="270" height="28" rx="4" class="fg-b"/><circle cx="221" cy="72" r="5" class="fg-lamp on"/><text x="234" y="76" class="fg-t sm">單筆上限：5,000</text>
<rect x="205" y="92" width="270" height="28" rx="4" class="fg-b"/><circle cx="221" cy="106" r="5" class="fg-lamp on"/><text x="234" y="110" class="fg-t sm">單日累計上限：50,000</text>
<rect x="205" y="126" width="270" height="28" rx="4" class="fg-b"/><circle cx="221" cy="140" r="5" class="fg-lamp on"/><text x="234" y="144" class="fg-t sm">目的地在允許清單、過了冷卻期</text>
<rect x="205" y="160" width="270" height="28" rx="4" class="fg-b"/><circle cx="221" cy="174" r="5" class="fg-lamp on"/><text x="234" y="178" class="fg-t sm">每分鐘最多 N 筆</text>
<rect x="205" y="194" width="270" height="28" rx="4" class="fg-b"/><circle cx="221" cy="208" r="5" class="fg-lamp on"/><text x="234" y="212" class="fg-t sm">超過 20,000：要兩位核准</text>
<text x="340" y="250" text-anchor="middle" class="fg-t sm">不相信呼叫者，只看自己的規則和計數器</text>
<rect x="530" y="110" width="135" height="60" rx="6" class="fg-b alt"/><text x="597" y="135" text-anchor="middle" class="fg-t">HSM 或 KMS</text><text x="597" y="155" text-anchor="middle" class="fg-t sm">金鑰不可匯出</text>
<rect x="530" y="210" width="135" height="50" rx="6" class="fg-b"/><text x="597" y="232" text-anchor="middle" class="fg-t">廣播交易</text><text x="597" y="250" text-anchor="middle" class="fg-t sm">簽好的才送出</text>
<line x1="130" y1="50" x2="182" y2="50" class="fg-l alt"/><polygon points="190,50 182,45.5 182,54.5" class="fg-a alt"/><text x="160" y="42" text-anchor="middle" class="fg-t sm alt">核准</text>
<line x1="130" y1="140" x2="182" y2="140" class="fg-l"/><polygon points="190,140 182,135.5 182,144.5" class="fg-a"/><text x="160" y="132" text-anchor="middle" class="fg-t sm">請簽這筆</text>
<line x1="190" y1="240" x2="138" y2="240" class="fg-l"/><polygon points="130,240 138,235.5 138,244.5" class="fg-a"/><text x="160" y="232" text-anchor="middle" class="fg-t sm">每次都記</text>
<line x1="490" y1="140" x2="522" y2="140" class="fg-l on"/><polygon points="530,140 522,135.5 522,144.5" class="fg-a on"/><text x="510" y="132" text-anchor="middle" class="fg-t sm acc">簽</text>
<line x1="490" y1="235" x2="522" y2="235" class="fg-l on"/><polygon points="530,235 522,230.5 522,239.5" class="fg-a on"/>
</svg><figcaption>金額是示意值。真正的保護不是 HSM 本身，而是簽章服務自己的那五道規則：就算出金工作者被完全控制，它能要求的也只有「規則允許範圍內」的簽章。</figcaption></figure>
<h4>設計重點</h4>
<ul>
<li><b>介面要窄</b>：只提供「簽一筆出金：目的地、金額、請求 ID」，由簽章服務自己組出要簽的交易內容。絕對不要提供「簽這一串位元組」，那等於把金鑰的全部能力交出去。</li>
<li><b>自己的狀態</b>：單日累計、速率計數存在簽章服務自己的資料庫，不相信呼叫者說「今天才出了 100」。</li>
<li><b>允許清單加冷卻期</b>：新增的目的地要經過人工核准，並且等 24 到 48 小時才生效，期間通知所有管理員。這段時間就是你發現異常、喊停的機會。</li>
<li><b>核准要綁定到那一筆</b>：核准者簽的是「這一筆交易內容的雜湊」，不是「我同意下一筆」。核准者用 WebAuthn 登入，兩位核准者不能是同一個人。</li>
<li><b>獨立部署</b>：獨立的雲端帳號、獨立的部署管線、最少的相依套件；不接受網際網路的連入，只接受出金工作者經過雙向 TLS（mTLS）的連線。</li>
<li><b>緊急開關</b>：一個指令就能讓它拒絕所有簽章，並且這個開關不需要經過被懷疑的那些系統。</li>
</ul>
<pre><code>// 簽章服務內部：只看自己的規則和自己的計數器（金額單位：最小幣值的整數）
async function checkPolicy(req: WithdrawRequest): Promise&lt;Decision&gt; {
  if (req.amount &gt; LIMIT.perTx) return deny('單筆超過上限');
  if ((await counters.sumLast24h()) + req.amount &gt; LIMIT.perDay) return deny('24 小時累計超過上限');
  const dest = await allowlist.get(req.to);
  if (!dest || dest.activeAt &gt; Date.now()) return deny('目的地不在允許清單，或還在冷卻期');
  if (await rate.exceeded()) return deny('速率超過上限');
  if (req.amount &gt; LIMIT.needsApproval &amp;&amp; (await approvals.count(req.txHash)) &lt; 2) return pending('等待兩位核准');
  return allow();
}</code></pre>
<h4>HSM 能做什麼、不能做什麼</h4>
<p><b>硬體安全模組</b>（hardware security module，HSM）是一台防竄改的專用設備：金鑰在裡面產生、設成不可匯出後就永遠出不來，所有簽章和解密都在裡面完成，通常經過 FIPS 140 這類標準的驗證。雲端的 KMS 背後就是 HSM，AWS 也提供單一租戶的 CloudHSM；AWS KMS 也支援區塊鏈常用的 secp256k1 非對稱簽章金鑰。</p>
<p>但要記清楚它的極限：<b>HSM 防的是金鑰被拿走，不防金鑰被濫用</b>。任何有權限呼叫「簽章」的程式，都能讓 HSM 簽出任何東西。所以 HSM 的呼叫權限只給簽章服務，而所有業務規則都在簽章服務裡，兩者缺一不可。其他分散風險的做法還有多重簽章錢包（需要 M 把金鑰中的 N 把一起簽）和門檻簽章（MPC，金鑰被拆成幾份放在不同地方），它們把「一把金鑰被濫用」變成「要同時攻破好幾個地方」。</p>
<p>上一課的熱錢包和冷儲存也是同一個思路：簽章服務的上限，決定了熱錢包一天最多會流出多少；冷儲存的補充要走人工核准，不經過任何自動化系統。</p>

<h3><span class="badge lv4">專家</span>八、金絲雀 token：最便宜的早期警報</h3>
<p>前面所有的防禦都是「不讓它發生」。<b>金絲雀 token</b>（canary token，也叫蜜罐 token）是另一個方向：<b>如果發生了，第一時間知道</b>。做法是故意放一些看起來很有價值、但正常情況下絕對不會有人用的假憑證，只要有人拿去用，警報就響。</p>
<table>
<tr><th>放什麼</th><th>放哪裡</th><th>怎麼觸發警報</th></tr>
<tr><td>假的雲端存取金鑰</td><td>建置伺服器的設定檔、舊的 <code>.env</code>、內部 wiki</td><td>金鑰屬於一個沒有任何權限的獨立帳號，任何 API 呼叫都會在稽核日誌留下紀錄，對它設警報</td></tr>
<tr><td>假的使用者資料列</td><td>正式資料庫的使用者表</td><td>這筆資料的 email 是你控制的專用信箱，只要那個信箱收到任何信，就代表資料被拿走了</td></tr>
<tr><td>假的管理員帳號</td><td>身分系統</td><td>任何一次登入嘗試都發警報</td></tr>
<tr><td>文件或網址 token</td><td>共用資料夾裡「密碼清單」之類的檔案</td><td>檔案被開啟、網址被存取時通知你</td></tr>
</table>
<p>Thinkst 的 Canarytokens（canarytokens.org）可以免費產生多種這類 token。設計時注意幾件事：</p>
<ul>
<li><b>零誤報是它的價值</b>：放在正常流程絕對不會碰到的地方。只要每響一次都是真的，大家就會認真對待它。</li>
<li><b>團隊要知道它存在</b>，否則自己人整理資料時也會觸發，或者被當成真的金鑰「清掉」。</li>
<li><b>警報要接到真的有人看的地方</b>，並且在事件應變手冊裡寫好：響了之後先做什麼（第 6.5 課）。</li>
<li><b>它不是防禦</b>，是偵測。它縮短的是第 5.1 課說的影響範圍的「長度」：從幾個月才發現，變成幾分鐘就發現。</li>
</ul>

<h3>九、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>環境變數就是安全的存放方式</td><td>環境變數會出現在行程資訊、當機報告、除錯頁面和子行程裡。它比寫死在程式碼好，但比不上執行時從機密管理服務讀取。</td></tr>
<tr><td>私有 repo 裡放金鑰沒關係</td><td>有權限的人、被盜的帳號、整合的第三方工具、哪天被改成公開，都會讓它外洩。進過 git 就當成已外洩。</td></tr>
<tr><td>Kubernetes Secret 是加密的</td><td>預設只是 Base64。要開 etcd 靜態加密、限制 RBAC，或改用外部機密管理服務。</td></tr>
<tr><td>CI 會自動遮罩機密，所以印出來沒關係</td><td>遮罩只認得原封不動的字串，編碼或切開就認不得了。</td></tr>
<tr><td>用了 HSM，金鑰就安全了</td><td>HSM 防止金鑰被拿走，但能呼叫它的程式可以讓它簽任何東西。業務限制要另外做。</td></tr>
<tr><td>輪替就是改密碼</td><td>不停機的輪替需要新舊並存、確認切換完成、再撤銷舊的，而且整個過程要自動化，才會真的定期做。</td></tr>
<tr><td>前端的 API 金鑰藏在打包檔裡別人找不到</td><td>瀏覽器和遊戲安裝包裡的東西都看得到。前端只能放公開的值。</td></tr>
</table>

<h3>十、跟你的工作連起來</h3>
<ul>
<li><b>Vue 和 TypeScript 前端</b>：檢查所有 <code>VITE_</code> 變數，裡面只能有公開的值；需要金鑰的第三方 API，改由你的後端代為呼叫。</li>
<li><b>Node.js 和 Go 後端</b>：啟動時從機密管理服務讀取、設快取時間；日誌記錄器打開欄位遮蔽；資料庫連線改用動態憑證或 IAM 驗證。</li>
<li><b>遊戲</b>：用戶端裡不放任何能直接呼叫付費服務或後台的金鑰；需要簽章的東西（例如收據驗證）全部在伺服器做。</li>
<li><b>Docker</b>：建置時用 secret mount、<code>.dockerignore</code> 排除 <code>.env</code>，發布前跑一次 <code>docker history</code>。</li>
<li><b>雲端和 CI</b>：把管線裡的長期雲端金鑰換成 OIDC 聯合；伺服器用角色；最重要的金鑰放進 KMS 或 HSM，前面加一層有規則的簽章服務；在幾個關鍵位置放金絲雀 token。</li>
</ul>

<h3>十一、面試會怎麼問</h3>
<ol>
<li>「一位工程師把正式環境的資料庫密碼推到了 GitHub 的公開 repo。你接下來的一小時要做什麼？」</li>
<li>「怎麼讓 GitHub Actions 部署到 AWS，而不在 GitHub 上存任何 AWS 金鑰？要注意什麼？」</li>
<li>「什麼是信封加密？為什麼不直接用 KMS 加密所有資料？」</li>
<li>「怎麼在不停機的情況下輪替一把資料庫密碼？」</li>
<li>「我們有一把可以動用大量資金的私鑰，已經放在 HSM 裡了。這樣夠嗎？」</li>
<li>「什麼是金絲雀 token？你會放在哪裡？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>先假設它已經被拿到：立刻輪替那組密碼（建新密碼、更新所有使用者、撤銷舊的），不是先去清 git 歷史。接著查資料庫的連線紀錄和稽核日誌，看從推上去到撤銷之間有沒有陌生來源連線；如果有，就啟動事件應變。然後才清理歷史、通知相關的人。最後補上攔截：pre-commit 掃描、CI 的歷史掃描、平台的推送保護，並檢討為什麼正式密碼會出現在工程師的電腦上。</li>
<li>用 OIDC 聯合：在 AWS 建立信任 GitHub OIDC 提供者的 IAM 角色，workflow 宣告 <code>id-token: write</code>，執行時向 GitHub 要一張 JWT，用 AssumeRoleWithWebIdentity 換到一小時的臨時憑證。重點是信任政策的條件：<code>aud</code> 要是 sts.amazonaws.com，<code>sub</code> 要精確到 repo 加環境或受保護的分支，不能用整個組織的萬用字元；角色本身只給部署需要的權限；GitHub 的 production 環境設必要審核者。</li>
<li>兩層金鑰：資料用本機產生或 KMS 發的資料金鑰以 AES-GCM 加密，資料金鑰再由 KMS 裡不可匯出的主金鑰包起來，和密文存在一起。不直接用 KMS 加密，是因為 KMS 直接加密的資料大小有上限、每次都是網路呼叫、量大時很慢也很貴。信封加密讓大量資料在本機處理，同時保留 KMS 的權限檢查和稽核紀錄，主金鑰輪替也不用重新加密所有資料。</li>
<li>讓新舊並存：準備兩個資料庫帳號輪流使用，或在同一個帳號上允許兩組有效憑證。步驟是建立新的、更新機密管理服務、讓所有程式重新讀取（快取到期或滾動重啟）、從連線紀錄確認已經沒有人用舊的、再撤銷舊的。全部寫成自動化，例如 Secrets Manager 的輪替函式，才會真的定期執行。更進一步是改用動態憑證，根本不用輪替。</li>
<li>不夠。HSM 只保證金鑰拿不出來，任何能呼叫簽章的程式都能讓它簽任何交易。要在前面加一層隔離的簽章服務：介面窄到只能簽出金、自己記帳的單筆和單日上限、目的地允許清單加冷卻期、速率限制、超過門檻要兩人核准並綁定交易雜湊，部署在獨立帳號，只接受 mTLS 連線，日誌送到別處，並且有緊急開關。資金也要分熱冷，熱的部分只放一天的量。</li>
<li>一個正常情況下絕對不會被使用的假憑證或假資料，一旦被使用就發出警報。我會在建置伺服器的設定檔放一組假的雲端金鑰（屬於沒有權限的獨立帳號）、在正式資料庫放一筆假使用者（email 是專用信箱）、在共用文件放一個 URL token。它幾乎沒有誤報，能把發現入侵的時間從幾個月縮短到幾分鐘。</li>
</ol>
</details>

<h3>十二、練功題（做得出來才算真的懂）</h3>
<ol>
<li>在你自己的一個 repo 裝上 gitleaks 的 pre-commit hook，再對整段歷史跑一次掃描。如果找到東西，照第三節的順序處理。</li>
<li>替你自己的一個 Node.js 專案寫 Dockerfile：建置時需要私有套件庫的 token，最後的映像檔裡不能有任何痕跡。用 <code>docker history --no-trunc</code> 證明它。</li>
<li>把你的一條 GitHub Actions 部署管線，從長期存取金鑰改成 OIDC 聯合。寫出信任政策，說明 <code>sub</code> 為什麼這樣寫。</li>
<li>用 <code>openssl</code> 在本機模擬一次信封加密：產生一把資料金鑰加密一個檔案，再用另一把「主金鑰」把資料金鑰包起來。說明哪一份可以和密文放在一起、哪一份不行。</li>
<li>替猜高低的出金功能寫出簽章服務的規則清單：單筆、單日、允許清單、核准門檻，並說明每個數字是怎麼決定的。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>安裝 pre-commit 後在 repo 根目錄放設定檔、執行 <code>pre-commit install</code>；歷史掃描用 gitleaks 的 git 掃描模式（新版是 <code>gitleaks git</code>，舊版是 <code>gitleaks detect</code>）。找到真的金鑰：先撤銷或輪替、再查使用紀錄、最後才考慮清歷史。找到的是測試假資料：加進允許清單並寫明原因。</li>
<li>關鍵是 <code>RUN --mount=type=secret</code> 只在 <code>npm ci</code> 那一步掛載 token，加上多階段建置，最後一個階段只複製 <code>dist</code> 和 <code>node_modules</code>。<code>docker history --no-trunc</code> 的每一行都看不到 token；也可以把映像檔匯出後用 gitleaks 掃檔案系統再確認一次。</li>
<li>信任政策的 <code>sub</code> 寫成 <code>repo:你的組織/你的repo:environment:production</code>，<code>aud</code> 是 sts.amazonaws.com。這樣只有這個 repo、而且是在 production 環境（可以設定必要審核者）裡執行的工作，才能拿到部署角色；其他 repo、其他分支、fork 來的 pull request 都拿不到。完成後到 repository secrets 把舊的存取金鑰刪掉，並在 IAM 停用那組金鑰。</li>
<li>例如：<code>openssl rand 32</code> 產生資料金鑰，用它以 AES-256 加密檔案；再用主金鑰把資料金鑰加密成「包好的資料金鑰」。包好的資料金鑰可以和密文放在一起，因為沒有主金鑰就拆不開；明文資料金鑰用完就刪；主金鑰絕對不能和它們放在同一個地方，正式環境裡它就是 KMS 裡那把不可匯出的金鑰。（openssl 的命令列適合理解原理，正式環境請用 KMS 和 AES-GCM。）</li>
<li>答案因系統而異，但數字要有依據：單日上限約等於「熱錢包裡願意承擔的最大損失」，也就是一天正常出金量再加一點餘裕；單筆上限參考過去 99% 的單筆出金金額；超過核准門檻的筆數要少到核准者不會麻木（例如一天幾筆）；新目的地的冷卻期至少要長過你的值班人員能察覺並回應的時間。每個數字都寫下理由和檢討日期。</li>
</ol>
</details>

<h3>十三、想再挖深</h3>
<ul>
<li><b>OWASP Secrets Management Cheat Sheet</b>（<a href="https://cheatsheetseries.owasp.org/">cheatsheetseries.owasp.org</a>）：機密生命週期、偵測、輪替的完整檢查清單。</li>
<li><b>HashiCorp Vault 官方文件</b>：動態機密（dynamic secrets）、租約和撤銷的概念講得最清楚，就算不用 Vault 也值得讀。</li>
<li><b>AWS KMS Developer Guide</b>：信封加密、加密情境、金鑰輪替的官方說明。</li>
<li><b>GitHub Docs 的「Security hardening with OpenID Connect」</b>：OIDC 聯合的設定步驟和各雲端的信任政策範例。</li>
<li><b>Thinkst Canarytokens</b>（<a href="https://canarytokens.org/">canarytokens.org</a>）：免費產生金絲雀 token，親手放一個，看它怎麼通知你。</li>
</ul>
` });
