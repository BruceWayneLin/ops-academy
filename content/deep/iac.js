DEEP({ 'iac': `
<p>上一課說「把基礎設施寫成檔案放進 git」，也帶過了 plan、apply、狀態檔和 GitOps。這一章把它們拆開：宣告式工具到底怎麼把「我要什麼」變成一連串 API 呼叫；狀態檔裡面存了什麼、為什麼它比程式碼還寶貴；兩個人同時 apply 會怎樣；怎麼把手動建好的東西收編進來；怎麼用程式擋住危險的變更；以及 GitOps 為什麼是「叢集自己來拉」，而不是「你推進去」。這些是雲端與 DevOps 職缺面試的基本題，也是半夜被叫起來時，決定你能不能安心按下 apply 的知識。</p>

<h3><span class="badge lv1">基礎</span>一、宣告式與命令式：說「要什麼」還是說「怎麼做」</h3>
<p>搭計程車有兩種方式。一種是一路指揮：「前面右轉、第二個紅綠燈左轉、再直走五百公尺。」另一種是只說地址：「台北車站。」第一種叫<b>命令式</b>（imperative），你要負責每一步，而且你得知道車子現在在哪；第二種叫<b>宣告式</b>（declarative），你只說終點，司機自己看現在的位置，算出怎麼走。</p>
<p>基礎設施也一樣。寫一支 shell 腳本呼叫雲端 CLI 開機器，是命令式；寫一份 Terraform 檔說「要有兩台機器」，是宣告式。差別在你把同一份東西<b>跑第二次</b>的時候：</p>
<figure class="figure"><svg viewBox="0 0 660 244" class="fg" style="width:100%;max-width:660px" role="img" aria-label="命令式腳本跑兩次開出四台機器；宣告式設定跑兩次仍然是兩台，因為它先讀現況、算差距，只補差距">
<text x="165" y="24" text-anchor="middle" class="fg-t lg">命令式：說怎麼做</text>
<rect x="30" y="38" width="270" height="36" rx="6" class="fg-b warm"/>
<text x="165" y="61" text-anchor="middle" class="fg-t mono">run-instances --count 2</text>
<text x="30" y="110" class="fg-t sm">第 1 次執行</text>
<rect x="120" y="94" width="34" height="26" rx="4" class="fg-b hot"/><text x="137" y="111" text-anchor="middle" class="fg-t sm">VM</text>
<rect x="162" y="94" width="34" height="26" rx="4" class="fg-b hot"/><text x="179" y="111" text-anchor="middle" class="fg-t sm">VM</text>
<text x="206" y="111" class="fg-t sm">2 台</text>
<text x="30" y="148" class="fg-t sm">第 2 次執行</text>
<rect x="120" y="132" width="34" height="26" rx="4" class="fg-b"/><text x="137" y="149" text-anchor="middle" class="fg-t sm">VM</text>
<rect x="162" y="132" width="34" height="26" rx="4" class="fg-b"/><text x="179" y="149" text-anchor="middle" class="fg-t sm">VM</text>
<rect x="204" y="132" width="34" height="26" rx="4" class="fg-b warm"/><text x="221" y="149" text-anchor="middle" class="fg-t sm">VM</text>
<rect x="246" y="132" width="34" height="26" rx="4" class="fg-b warm"/><text x="263" y="149" text-anchor="middle" class="fg-t sm">VM</text>
<text x="288" y="149" class="fg-t sm warm">4 台</text>
<rect x="40" y="178" width="110" height="26" rx="5" class="fg-b"/><text x="95" y="195" text-anchor="middle" class="fg-t sm">照步驟執行</text>
<line x1="150" y1="191" x2="172" y2="191" class="fg-l"/><polygon points="180,191 172,186.5 172,195.5" class="fg-a"/>
<rect x="180" y="178" width="110" height="26" rx="5" class="fg-b warm"/><text x="235" y="195" text-anchor="middle" class="fg-t sm">不管現況</text>
<text x="165" y="232" text-anchor="middle" class="fg-t sm warm">跑兩次就開四台</text>
<line x1="330" y1="14" x2="330" y2="236" class="fg-l dim dash"/>
<text x="495" y="24" text-anchor="middle" class="fg-t lg">宣告式：說要什麼</text>
<rect x="360" y="38" width="270" height="36" rx="6" class="fg-b hot"/>
<text x="495" y="61" text-anchor="middle" class="fg-t mono">count = 2</text>
<text x="360" y="110" class="fg-t sm">第 1 次 apply</text>
<rect x="450" y="94" width="34" height="26" rx="4" class="fg-b hot"/><text x="467" y="111" text-anchor="middle" class="fg-t sm">VM</text>
<rect x="492" y="94" width="34" height="26" rx="4" class="fg-b hot"/><text x="509" y="111" text-anchor="middle" class="fg-t sm">VM</text>
<text x="536" y="111" class="fg-t sm">建 2 台</text>
<text x="360" y="148" class="fg-t sm">第 2 次 apply</text>
<rect x="450" y="132" width="34" height="26" rx="4" class="fg-b"/><text x="467" y="149" text-anchor="middle" class="fg-t sm">VM</text>
<rect x="492" y="132" width="34" height="26" rx="4" class="fg-b"/><text x="509" y="149" text-anchor="middle" class="fg-t sm">VM</text>
<text x="536" y="149" class="fg-t sm acc">已經 2 台，不動</text>
<rect x="360" y="178" width="80" height="26" rx="5" class="fg-b"/><text x="400" y="195" text-anchor="middle" class="fg-t sm">讀現況</text>
<line x1="440" y1="191" x2="452" y2="191" class="fg-l"/><polygon points="460,191 452,186.5 452,195.5" class="fg-a"/>
<rect x="460" y="178" width="80" height="26" rx="5" class="fg-b"/><text x="500" y="195" text-anchor="middle" class="fg-t sm">算差距</text>
<line x1="540" y1="191" x2="552" y2="191" class="fg-l"/><polygon points="560,191 552,186.5 552,195.5" class="fg-a"/>
<rect x="560" y="178" width="80" height="26" rx="5" class="fg-b hot"/><text x="600" y="195" text-anchor="middle" class="fg-t sm">只補差距</text>
<text x="495" y="232" text-anchor="middle" class="fg-t sm acc">跑幾次結果都一樣</text>
</svg><figcaption>命令式記得的是「做了什麼」，宣告式記得的是「應該長什麼樣」。宣告式工具每次都先看現況，所以重跑是安全的。</figcaption></figure>
<p>「重跑幾次結果都一樣」有個名字，叫<b>冪等</b>（idempotent）。這是宣告式最大的價值：你可以放心重跑，失敗了就再跑一次，它會從現況接著補。它也帶來第二個好處：<b>收斂</b>（convergence）。不管現況偏到哪裡，下一次執行都會把它拉回檔案描述的樣子。你在 Kubernetes 用的 <code>kubectl apply</code>，是同一個思想。</p>
<p>宣告式不代表沒有順序。資料庫要先有網路才能建，Terraform 會從你的設定裡找出誰引用了誰，自己排出順序，你不用寫。Ansible 則在中間：它的每個模組是冪等的（「確保這個套件已安裝」），但整份 playbook 還是照你寫的順序一步一步跑。</p>

<h3><span class="badge lv1">基礎</span>二、Terraform 的三方對照：程式碼、狀態、真實世界</h3>
<p>Terraform 本體其實不懂 AWS，也不懂 Cloudflare。它靠<b>provider</b>：每個雲端或服務一個外掛程式，<code>terraform init</code> 時下載下來，本體透過 gRPC 跟它溝通。provider 負責把「建立一個 <code>aws_s3_bucket</code>」翻譯成真正的 API 呼叫。</p>
<p>每次 plan，Terraform 都要同時看三個東西：</p>
<figure class="figure"><svg viewBox="0 0 660 256" class="fg" style="width:100%;max-width:660px" role="img" aria-label="terraform plan 同時讀取 .tf 檔、真實世界的 API 回報，以及狀態檔；狀態檔把設定裡的資源位址對應到真實世界的 ID">
<rect x="20" y="40" width="160" height="70" rx="8" class="fg-b alt"/>
<text x="100" y="64" text-anchor="middle" class="fg-t">你的 .tf 檔</text>
<text x="100" y="82" text-anchor="middle" class="fg-t sm">想要什麼</text>
<text x="100" y="99" text-anchor="middle" class="fg-t sm mono">aws_instance.web</text>
<rect x="250" y="40" width="160" height="70" rx="8" class="fg-b hot"/>
<text x="330" y="64" text-anchor="middle" class="fg-t acc">terraform plan</text>
<text x="330" y="82" text-anchor="middle" class="fg-t sm">三方比對</text>
<text x="330" y="99" text-anchor="middle" class="fg-t sm">算出要做的事</text>
<rect x="480" y="40" width="160" height="70" rx="8" class="fg-b alt"/>
<text x="560" y="64" text-anchor="middle" class="fg-t">真實世界</text>
<text x="560" y="82" text-anchor="middle" class="fg-t sm">雲端 API 回報的現況</text>
<text x="560" y="99" text-anchor="middle" class="fg-t sm mono">i-0abc123</text>
<line x1="180" y1="75" x2="242" y2="75" class="fg-l"/><polygon points="250,75 242,70.5 242,79.5" class="fg-a"/>
<text x="215" y="66" text-anchor="middle" class="fg-t sm">讀取</text>
<line x1="480" y1="75" x2="418" y2="75" class="fg-l"/><polygon points="410,75 418,70.5 418,79.5" class="fg-a"/>
<text x="445" y="66" text-anchor="middle" class="fg-t sm">refresh</text>
<rect x="250" y="180" width="160" height="66" rx="8" class="fg-b warm"/>
<text x="330" y="202" text-anchor="middle" class="fg-t">狀態檔</text>
<text x="330" y="220" text-anchor="middle" class="fg-t sm">上次 apply 後記下的</text>
<text x="330" y="237" text-anchor="middle" class="fg-t sm mono">web → i-0abc123</text>
<line x1="330" y1="180" x2="330" y2="118" class="fg-l warm"/><polygon points="330,110 325.5,118 334.5,118" class="fg-a warm"/>
<text x="338" y="150" class="fg-t sm">對照表</text>
<path d="M100 110 V213 H250" class="fg-l dim dash"/>
<text x="108" y="204" class="fg-t sm">資源位址</text>
<path d="M410 213 H560 V110" class="fg-l dim dash"/>
<text x="420" y="204" class="fg-t sm">真實 ID</text>
</svg><figcaption>狀態檔是一張對照表：左邊是你設定裡的名字，右邊是雲端給的 ID。沒有它，Terraform 分不出雲端上的一千台機器，哪一台是「它的」<code>web</code>。</figcaption></figure>
<p>為什麼一定要狀態檔？直接問雲端不行嗎？三個原因：</p>
<ol>
<li><b>對應</b>：雲端只知道 <code>i-0abc123</code>，不知道你在程式碼裡叫它 <code>aws_instance.web</code>。標籤可以幫忙，但不是每種資源都支援標籤，也不能保證沒人亂改。</li>
<li><b>刪除</b>：你把一段 resource 從檔案裡刪掉，Terraform 怎麼知道要去雲端刪對應的東西？因為狀態檔還記得它。檔案裡沒有、狀態裡有，就是「要刪」。</li>
<li><b>相依和效能</b>：狀態檔記著資源之間的相依關係，也存了上次的屬性，大型專案不必每次都從零盤點。</li>
</ol>

<h3><span class="badge lv2">進階</span>三、plan 與 apply 一步一步</h3>
<figure class="figure"><svg viewBox="0 0 690 212" class="fg" style="width:100%;max-width:690px" role="img" aria-label="plan 階段：init、讀設定建相依圖、refresh、比對差異、存成計畫檔；apply 階段：審查、上鎖、依相依圖平行呼叫 API、逐一寫回狀態、解鎖">
<text x="20" y="28" class="fg-t sm acc">plan 階段：只讀不寫</text>
<rect x="20" y="40" width="112" height="52" rx="6" class="fg-b"/><text x="76" y="62" text-anchor="middle" class="fg-t">init</text><text x="76" y="80" text-anchor="middle" class="fg-t sm">下載 provider</text>
<line x1="132" y1="66" x2="146" y2="66" class="fg-l"/><polygon points="154,66 146,61.5 146,70.5" class="fg-a"/>
<rect x="154" y="40" width="112" height="52" rx="6" class="fg-b"/><text x="210" y="62" text-anchor="middle" class="fg-t">讀設定</text><text x="210" y="80" text-anchor="middle" class="fg-t sm">建相依圖</text>
<line x1="266" y1="66" x2="280" y2="66" class="fg-l"/><polygon points="288,66 280,61.5 280,70.5" class="fg-a"/>
<rect x="288" y="40" width="112" height="52" rx="6" class="fg-b alt"/><text x="344" y="62" text-anchor="middle" class="fg-t">refresh</text><text x="344" y="80" text-anchor="middle" class="fg-t sm">問 API 現況</text>
<line x1="400" y1="66" x2="414" y2="66" class="fg-l"/><polygon points="422,66 414,61.5 414,70.5" class="fg-a"/>
<rect x="422" y="40" width="112" height="52" rx="6" class="fg-b"/><text x="478" y="62" text-anchor="middle" class="fg-t">比對差異</text><text x="478" y="80" text-anchor="middle" class="fg-t sm mono">+  ~  -  -/+</text>
<line x1="534" y1="66" x2="548" y2="66" class="fg-l"/><polygon points="556,66 548,61.5 548,70.5" class="fg-a"/>
<rect x="556" y="40" width="112" height="52" rx="6" class="fg-b hot"/><text x="612" y="62" text-anchor="middle" class="fg-t acc">tfplan</text><text x="612" y="80" text-anchor="middle" class="fg-t sm">存成計畫檔</text>
<path d="M612 92 V116 H76 V138" class="fg-l on"/><polygon points="76,146 71.5,138 80.5,138" class="fg-a on"/>
<text x="90" y="138" class="fg-t sm warm">apply 階段：真的動手</text>
<rect x="20" y="146" width="112" height="52" rx="6" class="fg-b"/><text x="76" y="168" text-anchor="middle" class="fg-t">審查</text><text x="76" y="186" text-anchor="middle" class="fg-t sm">人或政策檢查</text>
<line x1="132" y1="172" x2="146" y2="172" class="fg-l"/><polygon points="154,172 146,167.5 146,176.5" class="fg-a"/>
<rect x="154" y="146" width="112" height="52" rx="6" class="fg-b warm"/><text x="210" y="168" text-anchor="middle" class="fg-t">上鎖</text><text x="210" y="186" text-anchor="middle" class="fg-t sm">別人不能動</text>
<line x1="266" y1="172" x2="280" y2="172" class="fg-l"/><polygon points="288,172 280,167.5 280,176.5" class="fg-a"/>
<rect x="288" y="146" width="112" height="52" rx="6" class="fg-b alt"/><text x="344" y="168" text-anchor="middle" class="fg-t">呼叫 API</text><text x="344" y="186" text-anchor="middle" class="fg-t sm">依相依圖平行做</text>
<line x1="400" y1="172" x2="414" y2="172" class="fg-l"/><polygon points="422,172 414,167.5 414,176.5" class="fg-a"/>
<rect x="422" y="146" width="112" height="52" rx="6" class="fg-b"/><text x="478" y="168" text-anchor="middle" class="fg-t">寫回狀態</text><text x="478" y="186" text-anchor="middle" class="fg-t sm">每完成一個</text>
<line x1="534" y1="172" x2="548" y2="172" class="fg-l"/><polygon points="556,172 548,167.5 548,176.5" class="fg-a"/>
<rect x="556" y="146" width="112" height="52" rx="6" class="fg-b hot"/><text x="612" y="168" text-anchor="middle" class="fg-t">解鎖</text><text x="612" y="186" text-anchor="middle" class="fg-t sm mono">serial + 1</text>
</svg><figcaption>plan 只讀不寫，所以隨時可以跑；apply 才會改雲端和狀態。把 plan 存成檔案再 apply，保證審查過的就是執行的。</figcaption></figure>
<p>假設你改了兩個地方：把 <code>web</code> 這台機器的映像檔（AMI）換成新的，把日誌 bucket 的標籤從 game 改成 platform。plan 的輸出會長這樣（經過刪減）：</p>
<pre><code>  # aws_instance.web must be replaced
-/+ resource "aws_instance" "web" {
      ~ ami = "ami-0aaa" -&gt; "ami-0bbb" # forces replacement
      ~ id  = "i-0abc123" -&gt; (known after apply)
    }

  # aws_s3_bucket.logs will be updated in-place
  ~ resource "aws_s3_bucket" "logs" {
      ~ tags = {
          ~ "team" = "game" -&gt; "platform"
        }
    }

Plan: 1 to add, 1 to change, 1 to destroy.</code></pre>
<p>讀 plan 要先看符號：<code>+</code> 新建、<code>~</code> 原地修改、<code>-</code> 刪除、<code>-/+</code> <b>先刪再建</b>。最後一種最危險：有些屬性雲端不允許原地修改（例如機器的映像檔、資料庫的某些設定），provider 就會標成 <code>forces replacement</code>。對一台無狀態的網頁機器，換掉沒關係；對一個資料庫，那一行等於「刪掉你的資料」。</p>
<h4>apply 的幾個細節</h4>
<ul>
<li><b>存檔的 plan</b>：<code>terraform plan -out=tfplan</code> 再 <code>terraform apply tfplan</code>，apply 只會執行那份計畫。如果中間狀態被別人改過，這份計畫會被判定過期而拒絕執行。CI 裡一律這樣做，審查的人看的才是真正會發生的事。</li>
<li><b>平行</b>：沒有相依關係的資源會同時做，預設最多 10 個（<code>-parallelism</code>）。</li>
<li><b>做到一半失敗</b>：沒有交易（transaction）可以回滾。已經成功的資源會寫進狀態，失敗的留著錯誤訊息。修好原因再 apply 一次，它會從現況接著做，這正是冪等的好處。</li>
<li><b>保護開關</b>：<code>lifecycle { prevent_destroy = true }</code> 讓任何會刪掉它的計畫直接失敗，資料庫和儲存桶建議都加；<code>create_before_destroy = true</code> 讓需要替換的資源先建新的再刪舊的，減少停機。</li>
</ul>

<h3><span class="badge lv2">進階</span>四、狀態檔裡面長什麼樣子</h3>
<p>狀態檔就是一份 JSON。打開一份簡化過的來看：</p>
<pre><code>{
  "version": 4,
  "serial": 42,
  "lineage": "5c1e7d2a-0f3b-4e8a-9d1c-7b2a6e4f8c90",
  "resources": [{
    "mode": "managed",
    "type": "aws_db_instance",
    "name": "main",
    "instances": [{
      "attributes": {
        "id": "hilo-prod-db",
        "instance_class": "db.t4g.medium",
        "password": "這裡是明碼"
      },
      "dependencies": ["aws_db_subnet_group.main"]
    }]
  }]
}</code></pre>
<ul>
<li><b>serial</b>：每寫一次加 1。Terraform 用它判斷「你手上這份是不是舊的」，拒絕用舊版本蓋掉新版本。</li>
<li><b>lineage</b>：這份狀態的身分證，第一次建立時產生，之後不變。防止你不小心把另一個專案的狀態推上來。</li>
<li><b>attributes</b>：provider 回報的<b>所有</b>屬性，包括密碼、私鑰、連線字串，全部明碼。變數加上 <code>sensitive = true</code> 只是讓 CLI 輸出時遮起來，狀態檔裡照樣是明碼。這就是上一課說「狀態檔可能有機密、絕不放 git」的原因。</li>
<li><b>dependencies</b>：刪除時要照相依的反向順序，靠的就是這裡。</li>
</ul>
<p>永遠不要手動編輯它。要改名、搬位置、放棄管理，用 <code>terraform state mv</code>、<code>terraform state rm</code>，或第九節的 <code>moved</code>、<code>removed</code> 區塊。要看內容，用 <code>terraform state list</code> 和 <code>terraform state show</code>。</p>

<h3><span class="badge lv3">專業</span>五、遠端狀態與鎖：兩個人同時 apply 會怎樣</h3>
<p>狀態檔放在自己筆電上，團隊裡第二個人就沒辦法工作。放在共用的地方，又會遇到經典的競爭問題：</p>
<figure class="figure"><svg viewBox="0 0 670 250" class="fg" style="width:100%;max-width:670px" role="img" aria-label="沒有鎖時 Alice 和 Bob 都讀到 serial 7，Bob 最後寫回時蓋掉了 Alice 建的資料庫，造成孤兒資源；有鎖時 Bob 上鎖失敗，等 Alice 解鎖後才讀到 serial 8">
<text x="12" y="22" class="fg-t warm">沒有鎖</text>
<text x="12" y="51" class="fg-t">Alice</text>
<rect x="90" y="36" width="110" height="22" rx="4" class="fg-b"/><text x="145" y="51" text-anchor="middle" class="fg-t sm">讀 serial 7</text>
<rect x="210" y="36" width="100" height="22" rx="4" class="fg-b alt"/><text x="260" y="51" text-anchor="middle" class="fg-t sm">建資料庫</text>
<rect x="320" y="36" width="120" height="22" rx="4" class="fg-b"/><text x="380" y="51" text-anchor="middle" class="fg-t sm">寫回 serial 8</text>
<text x="12" y="85" class="fg-t">Bob</text>
<rect x="110" y="70" width="110" height="22" rx="4" class="fg-b"/><text x="165" y="85" text-anchor="middle" class="fg-t sm">讀 serial 7</text>
<rect x="230" y="70" width="100" height="22" rx="4" class="fg-b alt"/><text x="280" y="85" text-anchor="middle" class="fg-t sm">改防火牆</text>
<rect x="340" y="70" width="120" height="22" rx="4" class="fg-b warm"/><text x="400" y="85" text-anchor="middle" class="fg-t sm">寫回，蓋掉 Alice</text>
<line x1="460" y1="81" x2="482" y2="81" class="fg-l warm"/><polygon points="490,81 482,76.5 482,85.5" class="fg-a warm"/>
<rect x="490" y="36" width="168" height="66" rx="6" class="fg-b warm"/>
<text x="574" y="58" text-anchor="middle" class="fg-t sm">資料庫還在雲端</text>
<text x="574" y="75" text-anchor="middle" class="fg-t sm">狀態檔卻沒有它</text>
<text x="574" y="93" text-anchor="middle" class="fg-t warm">孤兒資源</text>
<line x1="12" y1="118" x2="658" y2="118" class="fg-l dim dash"/>
<text x="12" y="140" class="fg-t acc">有鎖</text>
<text x="12" y="167" class="fg-t">Alice</text>
<rect x="90" y="152" width="60" height="22" rx="4" class="fg-b hot"/><text x="120" y="167" text-anchor="middle" class="fg-t sm">上鎖</text>
<rect x="160" y="152" width="60" height="22" rx="4" class="fg-b"/><text x="190" y="167" text-anchor="middle" class="fg-t sm">讀 7</text>
<rect x="230" y="152" width="90" height="22" rx="4" class="fg-b alt"/><text x="275" y="167" text-anchor="middle" class="fg-t sm">建資料庫</text>
<rect x="330" y="152" width="100" height="22" rx="4" class="fg-b hot"/><text x="380" y="167" text-anchor="middle" class="fg-t sm">寫 8、解鎖</text>
<text x="12" y="201" class="fg-t">Bob</text>
<rect x="110" y="186" width="90" height="22" rx="4" class="fg-b warm"/><text x="155" y="201" text-anchor="middle" class="fg-t sm">上鎖失敗</text>
<rect x="210" y="186" width="220" height="22" rx="4" class="fg-b dash"/><text x="320" y="201" text-anchor="middle" class="fg-t sm">等 Alice 解鎖</text>
<rect x="440" y="186" width="100" height="22" rx="4" class="fg-b hot"/><text x="490" y="201" text-anchor="middle" class="fg-t sm">上鎖、讀 8</text>
<text x="548" y="201" class="fg-t sm acc">看得到資料庫</text>
<line x1="90" y1="232" x2="642" y2="232" class="fg-l dim"/><polygon points="650,232 642,227.5 642,236.5" class="fg-a"/>
<text x="90" y="226" class="fg-t sm">時間</text>
</svg><figcaption>沒有鎖時，兩個人從同一個舊版本出發，後寫的蓋掉先寫的。被蓋掉的資料庫還在雲端照樣收錢，但 Terraform 已經不知道它存在。</figcaption></figure>
<p>所以團隊一定用<b>遠端狀態</b>（remote state）加<b>鎖</b>（state locking）。最常見的是 AWS S3：</p>
<pre><code>terraform {
  backend "s3" {
    bucket       = "hilo-tfstate"
    key          = "prod/network/terraform.tfstate"
    region       = "ap-northeast-1"
    encrypt      = true
    use_lockfile = true   # 用 S3 本身做鎖
  }
}</code></pre>
<p><code>use_lockfile</code> 是 Terraform 1.10 之後才有的做法；更早的設定是另外建一張 DynamoDB 表當鎖（<code>dynamodb_table</code>），你在既有專案裡會常看到。GCS、Azure Blob、HCP Terraform 都內建鎖。不管哪一種，這幾件事都要做：</p>
<ul>
<li><b>開啟版本控制</b>（bucket versioning）：狀態被寫壞時，可以退回前一版。這是你最後的救命繩。</li>
<li><b>加密、限制存取</b>：狀態裡有明碼機密，能讀狀態的人，等於能讀資料庫密碼。只給 CI 的角色和少數管理員。OpenTofu 從 1.7 起支援在用戶端先加密狀態再上傳。</li>
<li><b>鎖卡住時</b>：CI 中途被取消，鎖可能沒被釋放。先確認真的沒有人在跑，再用 <code>terraform force-unlock &lt;鎖的 ID&gt;</code>。不確定就別解，解錯的代價就是上面那張圖。</li>
</ul>

<h3><span class="badge lv3">專業</span>六、飄移：真實世界被偷改了</h3>
<p>設定飄移（drift）就是真實世界和程式碼對不上，最常見的原因是有人半夜在主控台「先救火」。plan 每次都會 refresh，所以飄移會出現在下一次 plan 裡。問題是：如果下一次 plan 是三週後，你三週都不知道。</p>
<ul>
<li><b>定時偵測</b>：在 CI 裡每天跑一次 <code>terraform plan -detailed-exitcode</code>。它的結束碼有三種：0 是沒有差異，1 是出錯，2 是有差異。拿到 2 就發警報。只想看飄移、不想看程式碼的變更，用 <code>-refresh-only</code>。</li>
<li><b>處理有兩條路</b>：手動改的是錯的，就 apply 把它改回來；手動改的是對的（例如救火時加大的機器確實需要），就把程式碼改成一樣，讓 plan 回到「沒有差異」。最糟的做法是放著不管，因為下一個人 apply 時會在不知情下把救火的設定改回去。</li>
<li><b>交給別人管的欄位</b>：自動擴展群組的機器數，本來就會被自動擴展改變。用 <code>lifecycle { ignore_changes = [desired_capacity] }</code> 告訴 Terraform 這個欄位別管。</li>
<li><b>盲點</b>：Terraform 只看得到狀態裡的東西。有人在主控台新開一台機器，plan 完全看不到。要抓這種，得靠雲端自己的盤點工具，例如 AWS Config。</li>
</ul>
<p>根本解法是減少能手動改的人：平常只給主控台唯讀權限，寫入權限只給 CI 的角色；真的要救火，用有記錄、有時效的緊急帳號（break-glass），救完一定補一個 PR。</p>

<h3><span class="badge lv3">專業</span>七、模組與環境：同一份程式，三個環境</h3>
<p>模組（module）就是一個資料夾的 .tf 檔，有輸入（variable）和輸出（output），像一個函式。呼叫它時給不同的參數：</p>
<pre><code>module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~&gt; 5.0"        # 鎖住大版本，升級要刻意

  name = "hilo-prod"
  cidr = "10.20.0.0/16"
  azs  = ["ap-northeast-1a", "ap-northeast-1c"]
}</code></pre>
<figure class="figure"><svg viewBox="0 0 660 262" class="fg" style="width:100%;max-width:660px" role="img" aria-label="同一個 web-service 模組被 staging 和 prod 兩個環境以不同參數呼叫，每個環境各有自己的狀態檔；prod 再依網路、資料、應用三層拆成三份狀態">
<rect x="200" y="16" width="260" height="60" rx="8" class="fg-b hot"/>
<text x="330" y="40" text-anchor="middle" class="fg-t acc">模組 web-service v1.4.0</text>
<text x="330" y="60" text-anchor="middle" class="fg-t sm">負載平衡器 + 服務 + 警報</text>
<path d="M290 76 V96 H160 V112" class="fg-l on"/><polygon points="160,120 155.5,112 164.5,112" class="fg-a on"/>
<path d="M370 76 V96 H500 V112" class="fg-l on"/><polygon points="500,120 495.5,112 504.5,112" class="fg-a on"/>
<text x="330" y="100" text-anchor="middle" class="fg-t sm">同一份程式</text>
<rect x="40" y="120" width="240" height="80" rx="8" class="fg-b"/>
<text x="160" y="144" text-anchor="middle" class="fg-t mono">envs/staging</text>
<text x="160" y="164" text-anchor="middle" class="fg-t sm">replicas = 1，機型小</text>
<rect x="56" y="174" width="208" height="20" rx="4" class="fg-b warm"/>
<text x="160" y="188" text-anchor="middle" class="fg-t sm">狀態：staging/terraform.tfstate</text>
<rect x="380" y="120" width="240" height="80" rx="8" class="fg-b"/>
<text x="500" y="144" text-anchor="middle" class="fg-t mono">envs/prod</text>
<text x="500" y="164" text-anchor="middle" class="fg-t sm">replicas = 4，跨三個可用區</text>
<rect x="396" y="174" width="208" height="20" rx="4" class="fg-b warm"/>
<text x="500" y="188" text-anchor="middle" class="fg-t sm">狀態：prod/…（再按層拆開）</text>
<line x1="500" y1="200" x2="500" y2="214" class="fg-l dim"/>
<rect x="380" y="222" width="70" height="30" rx="5" class="fg-b alt"/><text x="415" y="242" text-anchor="middle" class="fg-t sm">網路層</text>
<line x1="450" y1="237" x2="457" y2="237" class="fg-l"/><polygon points="465,237 457,232.5 457,241.5" class="fg-a"/>
<rect x="465" y="222" width="70" height="30" rx="5" class="fg-b alt"/><text x="500" y="242" text-anchor="middle" class="fg-t sm">資料層</text>
<line x1="535" y1="237" x2="542" y2="237" class="fg-l"/><polygon points="550,237 542,232.5 542,241.5" class="fg-a"/>
<rect x="550" y="222" width="70" height="30" rx="5" class="fg-b alt"/><text x="585" y="242" text-anchor="middle" class="fg-t sm">應用層</text>
<text x="370" y="242" text-anchor="end" class="fg-t sm">輸出接輸入，各自一份狀態</text>
</svg><figcaption>模組讓環境之間只差參數，不差程式；每個環境、每一層各有自己的狀態，一次 apply 能弄壞的範圍就被切小了。</figcaption></figure>
<h4>環境怎麼分：資料夾還是 workspace</h4>
<p>常見的兩種做法：一種是每個環境一個資料夾（<code>envs/staging</code>、<code>envs/prod</code>），各有自己的 backend 設定；另一種是 Terraform 的 workspace，同一份設定、切換不同的狀態。workspace 用起來方便，但所有環境共用同一組設定和憑證，一個 <code>terraform workspace select</code> 打錯就 apply 到正式環境。大部分團隊對正式環境偏好資料夾分開，甚至放在不同的雲端帳號裡。</p>
<h4>狀態要按層拆開</h4>
<p>把整個公司塞進一份狀態，會有三個問題：plan 要 refresh 幾千個資源，跑好幾分鐘還可能撞到 API 速率限制；任何一個小改動都得鎖住整份狀態；一次 apply 出錯的<b>爆炸半徑</b>（blast radius）是全部。常見拆法是依變動頻率分層：網路幾個月才動一次，資料層偶爾動，應用層天天動。下層用 output 輸出 ID，上層用 data source 或 <code>terraform_remote_state</code> 讀進來。</p>
<p>最後一個習慣：模組一定要鎖版本（registry 用 <code>version</code>，git 來源用 <code>?ref=v1.4.0</code>）。不鎖的話，別人改了模組，你下次 plan 就莫名其妙多出一堆變更。</p>

<h3><span class="badge lv3">專業</span>八、IaC 裡的機密</h3>
<p>規則只有一條：機密不能出現在 git 裡，最好也不要出現在狀態檔裡。做法由差到好：</p>
<ol>
<li><b>寫死在 .tf 或 terraform.tfvars 裡</b>：最糟。只要進過 git 歷史，就要當作已經外洩，必須輪替（rotate）。</li>
<li><b>從環境變數或 CI 的機密儲存區傳進來</b>（<code>TF_VAR_db_password</code>）：git 裡乾淨了，但值還是會寫進狀態檔。</li>
<li><b>從機密管理服務讀</b>（<code>data "aws_secretsmanager_secret_version"</code>）：來源集中、可輪替，但讀到的值一樣會進狀態檔。</li>
<li><b>讓雲端服務自己保管</b>：例如 AWS RDS 可以設定讓服務自己產生主密碼、存進 Secrets Manager，Terraform 從頭到尾沒碰過那個值。能這樣做的地方，優先這樣做。</li>
</ol>
<p>Terraform 1.10 之後加入了不寫進狀態的暫時值（ephemeral），之後又加入只寫不存的參數（write-only），都是在處理這個老問題；OpenTofu 則是走加密整份狀態的路線。需要把加密過的設定檔放進 git 時，常用 SOPS。最後，在 CI 裡加一道機密掃描（例如 gitleaks），在機密進入 git 歷史之前就擋下來。</p>

<h3><span class="badge lv3">專業</span>九、收編現有資源：import、moved、removed</h3>
<p>現實中你很少從零開始。公司早就有一堆手動建的東西，你要把它們「收編」進 Terraform，又不能刪掉重建。Terraform 1.5 起可以用 <code>import</code> 區塊：</p>
<pre><code>import {
  to = aws_s3_bucket.logs
  id = "hilo-logs-prod"
}</code></pre>
<ol>
<li>寫好 import 區塊，執行 <code>terraform plan -generate-config-out=generated.tf</code>，它會去雲端讀這個資源，自動產生一份對應的 resource 設定。</li>
<li>打開產生的檔案，整理成你的風格：刪掉預設值、把寫死的 ID 改成引用。</li>
<li>再 plan 一次。目標是看到「1 to import, 0 to add, 0 to change, 0 to destroy」。如果它想改任何東西，代表你的設定跟現況還有差，繼續調到沒有差異為止。</li>
<li>apply，資源進入狀態。之後 import 區塊可以刪掉。</li>
</ol>
<p>重構時還有兩個好用的區塊。把資源搬進模組，位址從 <code>aws_instance.web</code> 變成 <code>module.hilo_api.aws_instance.web</code>，Terraform 預設會以為是「刪掉舊的、建一個新的」。用 <code>moved</code> 告訴它這是同一個東西：</p>
<pre><code>moved {
  from = aws_instance.web
  to   = module.hilo_api.aws_instance.web
}</code></pre>
<p>反過來，想讓某個資源脫離 Terraform 管理、但不要真的刪掉（例如要交給別的團隊），1.7 起可以用 <code>removed</code> 區塊加上 <code>lifecycle { destroy = false }</code>。這些都寫在程式碼裡、經過審查，比在終端機手打 <code>terraform state mv</code> 安全得多。</p>

<h3><span class="badge lv4">專家</span>十、政策即程式碼：用程式擋住危險的變更</h3>
<p>審查 PR 的人會累、會漏看。「不准對全世界開放 SSH」「所有儲存桶必須加密」「每個資源都要有 owner 標籤」這種規則，應該寫成程式，讓機器每次都檢查。這叫<b>政策即程式碼</b>（policy as code）。</p>
<p>Terraform 的 plan 可以輸出成 JSON（<code>terraform show -json tfplan</code>），裡面的 <code>resource_changes</code> 列出每個資源變更後的樣子。用 Open Policy Agent 的 Rego 語言寫規則，再用 Conftest 去跑：</p>
<pre><code>package main
import rego.v1

deny contains msg if {
  some rc in input.resource_changes
  rc.type == "aws_security_group_rule"
  rc.change.after.from_port &lt;= 22
  rc.change.after.to_port &gt;= 22
  "0.0.0.0/0" in rc.change.after.cidr_blocks
  msg := sprintf("%s 對全世界開放 SSH", [rc.address])
}</code></pre>
<p>CI 裡執行 <code>conftest test plan.json</code>，有任何 deny 就讓管線失敗。工具的選擇：</p>
<ul>
<li><b>掃描原始碼</b>：Checkov、Trivy（tfsec 已併入 Trivy）內建上千條常見規則，不用自己寫，最容易起步。</li>
<li><b>檢查 plan</b>：OPA／Conftest，或 HCP Terraform 的 Sentinel。看的是「真的會發生的變更」，比看原始碼準，因為變數和模組都已經展開。</li>
<li><b>Kubernetes 裡</b>：同樣的概念叫准入控制（admission control）。Kyverno、OPA Gatekeeper，或 1.30 正式推出的內建 ValidatingAdmissionPolicy，可以在物件寫進叢集之前擋下「用 root 跑」「沒設資源上限」的 Pod。</li>
</ul>
<p>導入的順序很重要：先只警告、不擋，收集一兩週看看會誤擋多少；再把確定的規則改成強制。一上來就全部強制，大家只會想辦法繞過它。</p>

<h3><span class="badge lv4">專家</span>十一、GitOps：叢集自己來拉，不是你推進去</h3>
<p>傳統的 CD 是<b>推</b>（push）：CI 跑完，拿著叢集的管理憑證執行 <code>kubectl apply</code>。這代表 CI 系統手上握著正式環境的鑰匙，任何能改管線的人、任何混進 CI 的惡意套件，都碰得到那把鑰匙。GitOps 把方向反過來：</p>
<figure class="figure"><svg viewBox="0 0 680 300" class="fg" style="width:100%;max-width:680px" role="img" aria-label="開發者推程式碼到應用程式 repo，CI 建置後推映像檔並開 PR 改設定 repo 的 tag；叢集裡的 Argo CD 主動拉設定 repo，比對後套用；kubelet 從映像檔倉庫拉映像檔">
<rect x="20" y="24" width="110" height="50" rx="6" class="fg-b"/><text x="75" y="46" text-anchor="middle" class="fg-t">開發者</text><text x="75" y="64" text-anchor="middle" class="fg-t sm mono">git push</text>
<line x1="130" y1="49" x2="162" y2="49" class="fg-l"/><polygon points="170,49 162,44.5 162,53.5" class="fg-a"/>
<rect x="170" y="24" width="140" height="50" rx="6" class="fg-b"/><text x="240" y="46" text-anchor="middle" class="fg-t">應用程式 repo</text><text x="240" y="64" text-anchor="middle" class="fg-t sm">原始碼</text>
<line x1="310" y1="49" x2="342" y2="49" class="fg-l"/><polygon points="350,49 342,44.5 342,53.5" class="fg-a"/>
<rect x="350" y="24" width="140" height="50" rx="6" class="fg-b alt"/><text x="420" y="46" text-anchor="middle" class="fg-t">CI</text><text x="420" y="64" text-anchor="middle" class="fg-t sm">建置、測試、推映像檔</text>
<line x1="490" y1="49" x2="522" y2="49" class="fg-l"/><polygon points="530,49 522,44.5 522,53.5" class="fg-a"/>
<rect x="530" y="24" width="130" height="50" rx="6" class="fg-b"/><text x="595" y="46" text-anchor="middle" class="fg-t">映像檔倉庫</text><text x="595" y="64" text-anchor="middle" class="fg-t sm mono">hilo-api:3f9c2e1</text>
<line x1="420" y1="74" x2="420" y2="112" class="fg-l alt"/><polygon points="420,120 415.5,112 424.5,112" class="fg-a alt"/>
<text x="428" y="100" class="fg-t sm alt">開 PR 改 tag</text>
<rect x="350" y="120" width="140" height="50" rx="6" class="fg-b hot"/><text x="420" y="142" text-anchor="middle" class="fg-t acc">設定 repo</text><text x="420" y="160" text-anchor="middle" class="fg-t sm">tag 改成 3f9c2e1</text>
<text x="340" y="150" text-anchor="end" class="fg-t sm acc">退版 = git revert</text>
<rect x="20" y="196" width="640" height="94" rx="10" class="fg-b dash"/>
<text x="34" y="216" class="fg-t sm">叢集</text>
<text x="34" y="252" class="fg-t sm warm">CI 和工程師都不需要</text>
<text x="34" y="270" class="fg-t sm warm">叢集的寫入權限</text>
<rect x="330" y="226" width="180" height="50" rx="6" class="fg-b hot"/><text x="420" y="248" text-anchor="middle" class="fg-t acc">Argo CD／Flux</text><text x="420" y="266" text-anchor="middle" class="fg-t sm">比對 git 與現況</text>
<line x1="420" y1="170" x2="420" y2="218" class="fg-l on"/><polygon points="420,226 415.5,218 424.5,218" class="fg-a on"/>
<text x="428" y="190" class="fg-t sm acc">定時拉（pull）</text>
<rect x="560" y="226" width="90" height="50" rx="6" class="fg-b"/><text x="605" y="248" text-anchor="middle" class="fg-t">Pod</text><text x="605" y="266" text-anchor="middle" class="fg-t sm">照 git 跑</text>
<line x1="510" y1="251" x2="552" y2="251" class="fg-l on"/><polygon points="560,251 552,246.5 552,255.5" class="fg-a on"/>
<text x="535" y="243" text-anchor="middle" class="fg-t sm">套用</text>
<line x1="605" y1="74" x2="605" y2="218" class="fg-l dim"/><polygon points="605,226 600.5,218 609.5,218" class="fg-a"/>
<text x="597" y="150" text-anchor="end" class="fg-t sm">拉映像檔</text>
</svg><figcaption>進到叢集裡的設定和映像檔，都是叢集裡的元件主動去拉的，沒有人從外面推進叢集。CI 的權力只到「開 PR 改設定 repo」，正式環境的鑰匙留在叢集裡。</figcaption></figure>
<p>叢集裡跑著一個控制器（Argo CD 或 Flux），盯著一個存放部署設定的 git repo。Argo CD 預設每 3 分鐘拉一次，也可以設 webhook 讓 git 一有變更就通知它。拉到之後，它把 Helm 或 Kustomize 渲染成最終的 YAML，和叢集現況比對，狀態顯示成 Synced 或 OutOfSync，再把差異套用上去。這就是第一節的宣告式和收斂，只是對象從雲端資源換成 Kubernetes 物件。</p>
<pre><code>apiVersion: argoproj.io/v1alpha1
kind: Application
metadata: { name: hilo-api, namespace: argocd }
spec:
  project: default
  source:
    repoURL: https://github.com/example/hilo-config.git
    path: apps/hilo-api/prod
    targetRevision: main
  destination:
    server: https://kubernetes.default.svc
    namespace: hilo
  syncPolicy:
    automated: { prune: true, selfHeal: true }</code></pre>
<ul>
<li><b>prune</b>：git 裡刪掉的物件，叢集裡也跟著刪。不開的話，刪掉的東西會一直留在叢集裡。</li>
<li><b>selfHeal</b>：有人用 kubectl 手動改了叢集，控制器會把它改回 git 的樣子。這等於 Kubernetes 版的自動修正飄移。</li>
<li><b>跟 HPA 打架</b>：HPA 會改副本數，selfHeal 又會改回 git 的值。要嘛 YAML 裡不寫 <code>replicas</code>，要嘛在 Argo CD 設定忽略這個欄位（<code>ignoreDifferences</code>）。</li>
<li><b>環境升級</b>：staging 驗證過，就開一個 PR 把 prod 路徑下的 tag 改成同一個值。誰核准、什麼時候上線，全部留在 git 歷史裡。</li>
<li><b>機密</b>：git 裡不能放明碼的 Secret。常見做法有三種：Sealed Secrets（只有叢集解得開的加密檔）、SOPS（Flux 原生支援）、External Secrets Operator（git 裡只放「去哪裡拿」，值留在雲端的機密管理服務）。</li>
</ul>

<h3><span class="badge lv4">專家</span>十二、測試基礎設施程式碼</h3>
<p>基礎設施的程式碼也是程式碼，也會有 bug，而且 bug 的代價常常是整個環境。測試照成本由低到高排：</p>
<table>
<tr><th>層級</th><th>工具</th><th>多快</th><th>抓什麼</th></tr>
<tr><td>格式與語法</td><td><code>terraform fmt -check</code>、<code>terraform validate</code></td><td>幾秒</td><td>打錯字、型別不對</td></tr>
<tr><td>靜態檢查</td><td>tflint、Checkov、Trivy</td><td>幾秒</td><td>已知的壞習慣、不安全設定</td></tr>
<tr><td>政策檢查</td><td>Conftest、Sentinel</td><td>一次 plan 的時間</td><td>違反公司規則的變更</td></tr>
<tr><td>模組測試</td><td><code>terraform test</code>（1.6 起內建）</td><td>幾秒到幾分鐘</td><td>模組的輸入輸出對不對</td></tr>
<tr><td>整合測試</td><td>Terratest（Go）</td><td>幾分鐘到幾十分鐘、要花錢</td><td>真的建起來能不能用</td></tr>
<tr><td>重建演練</td><td>定期從零建一個環境</td><td>幾小時</td><td>文件沒寫、程式碼沒涵蓋的手工步驟</td></tr>
</table>
<p><code>terraform test</code> 的測試檔寫成 <code>.tftest.hcl</code>，可以只跑 plan（不花錢），也可以真的 apply 再自動清掉；1.7 起還能模擬 provider，完全不連雲端：</p>
<pre><code>run "logs_bucket_is_private" {
  command = plan
  assert {
    condition = (
      aws_s3_bucket_public_access_block.logs.block_public_acls
    )
    error_message = "日誌 bucket 必須擋掉公開 ACL"
  }
}</code></pre>
<p>表格最後一列最常被跳過，卻最重要。上一課那個問題「這台機器消失了，你能在一小時內用 git 和備份重建嗎？」唯一可信的答案，是你真的做過一次。</p>

<h3>十三、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>plan 沒有錯誤，apply 就一定成功</td><td>plan 只是預測。名稱衝突、配額不足、權限不夠，常常要到真的呼叫 API 才會失敗。</td></tr>
<tr><td>變數標了 sensitive，機密就安全了</td><td>只是畫面上遮起來，狀態檔裡照樣是明碼。保護狀態檔本身才是重點。</td></tr>
<tr><td>Terraform 會告訴我雲端上所有的變動</td><td>它只看得到狀態裡的資源。別人新開的東西，它完全看不到。</td></tr>
<tr><td>apply 失敗會自動回滾</td><td>沒有交易。做完的就是做完了，修好原因再 apply 一次，讓它接著收斂。</td></tr>
<tr><td>GitOps 就是把 YAML 放進 git</td><td>關鍵是叢集裡的控制器持續比對、自動收斂，而且部署權限不在 CI 手上。只是存進 git，叫版本控制。</td></tr>
<tr><td>workspace 就是分環境的標準做法</td><td>它共用同一組設定和憑證，切錯就 apply 到正式環境。正式環境多半用獨立資料夾，甚至獨立帳號。</td></tr>
</table>

<h3>十四、跟你的工作連起來</h3>
<ul>
<li><b>你的雲端伺服器</b>：手動開好的那幾台機器、安全群組、DNS 記錄，都可以用第九節的 import 一個一個收編。先從最常改、最怕改錯的開始，例如防火牆規則。</li>
<li><b>前端與遊戲的靜態資源</b>：放打包檔的儲存桶、CDN 的快取規則、自訂網域的憑證，都是 IaC 的好起點。它們設定錯了會直接影響玩家，而且很少有人記得當初怎麼設的。</li>
<li><b>Node.js／Go 服務</b>：服務需要的資料庫、佇列、IAM 角色，跟程式碼一起在 PR 裡審查。新同事看 git 就知道這個服務依賴什麼。</li>
<li><b>Docker 與 Kubernetes</b>：Dockerfile 本身就是 IaC；部署設定交給 GitOps，你上線就是合併一個 PR，退版就是 revert，不用再登入任何機器。</li>
</ul>

<h3>十五、面試會怎麼問</h3>
<p>雲端工程師、DevOps、平台工程的面試幾乎一定會問 Terraform 和 GitOps。先自己講一遍，再打開參考答案。</p>
<ol>
<li>「Terraform 的 state 是做什麼的？為什麼不能放 git？弄丟了會怎樣？」</li>
<li>「兩個人同時 apply 會發生什麼事？你們怎麼防？」</li>
<li>「有人在主控台手動改了安全群組，你怎麼發現？發現了怎麼處理？」</li>
<li>「plan 裡出現一行 -/+ must be replaced，你會怎麼評估要不要 apply？」</li>
<li>「推式部署和 GitOps 的拉式部署差在哪？各有什麼風險？」</li>
<li>「IaC 裡的資料庫密碼，你會怎麼處理？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>狀態檔是設定裡的資源位址和真實資源 ID 的對照表，也記錄屬性和相依關係，Terraform 靠它計算差異、知道哪些資源該刪。它常含有明碼機密，而且需要鎖來避免同時寫入，所以放在有加密、有版本控制、有鎖的遠端 backend，而不是 git。弄丟了，Terraform 會以為什麼都不存在，下一次 apply 會嘗試重建全部，造成名稱衝突或重複資源；救法是從 backend 的版本紀錄還原，最差的情況是用 import 一個一個收編回來。</li>
<li>沒有鎖時，兩個人都從同一個 serial 出發，後寫回的會蓋掉先寫的，被蓋掉的資源變成狀態裡沒有、雲端上還在的孤兒。我們用遠端 backend 的狀態鎖，例如 S3 的鎖檔或 DynamoDB；更進一步，只讓 CI 執行 apply，人只開 PR，這樣同一份狀態本來就是排隊執行的。</li>
<li>每天在 CI 跑 <code>plan -detailed-exitcode</code>，結束碼 2 就發警報；也可以用雲端的設定稽核工具抓狀態外的資源。處理時先確認手動改動的原因：錯的就 apply 改回來，對的就把程式碼改成一致再合併。長期要把主控台的寫入權限收掉，只留有紀錄的緊急帳號。</li>
<li>先看是哪個資源、哪個屬性觸發了替換。無狀態的機器替換通常可以接受，最好搭配 <code>create_before_destroy</code> 減少停機；資料庫、儲存桶、有固定 IP 的東西被替換，等於資料或位址會不見，就要停下來，看能不能改用可以原地修改的方式、先做備份，或用 <code>prevent_destroy</code> 擋住。也要確認是不是我自己誤改了某個屬性，例如名稱。</li>
<li>推式部署由 CI 持有叢集憑證、主動 apply，簡單直覺，但 CI 被攻破就等於正式環境被攻破，而且叢集被手動改了沒人會發現。GitOps 由叢集裡的控制器主動拉 git，CI 只負責建映像檔和開 PR，憑證不出叢集，還能持續修正飄移、用 git revert 退版。代價是多一個要維運的元件，而且 git 變成正式環境的入口，所以設定 repo 的分支保護和審查要更嚴格。</li>
<li>不寫進 git，也盡量不讓 Terraform 經手。優先讓雲端服務自己產生並保管密碼，例如交給 Secrets Manager 管理；不行的話，從機密管理服務讀取，並把狀態檔當成機密等級保護：加密、限制讀取權限、開版本控制。CI 裡加機密掃描，一旦機密進過 git 歷史就立刻輪替。</li>
</ol>
</details>

<h3>十六、練功題（做得出來才算真的懂）</h3>
<ol>
<li>plan 輸出寫著「Plan: 2 to add, 0 to change, 2 to destroy.」，可是你只改了一個標籤。可能是什麼原因？你會怎麼查？</li>
<li>團隊的狀態檔被誤刪了，bucket 沒開版本控制。下一次 apply 會發生什麼事？你要怎麼救？</li>
<li>公司有一個手動建立的儲存桶 <code>hilo-assets</code>。寫出把它收編進 Terraform 的完整步驟，以及你怎麼確定收編成功。</li>
<li>你要把十個資源搬進一個新模組，不能有任何停機。要用什麼？寫出其中一個的寫法。</li>
<li>Argo CD 開了 selfHeal。有人在正式環境執行 <code>kubectl scale deploy hilo-api --replicas=10</code> 想撐住流量。接下來會發生什麼？正確的做法是什麼？</li>
<li>把下面這些檢查排進 CI，說明順序和理由：<code>terraform apply</code>、Checkov、<code>terraform fmt -check</code>、Conftest、人工審查 plan。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>add 和 destroy 數量相同，通常是有資源要被替換（<code>-/+</code>）。可能是某個 forces replacement 的屬性被改到了，例如你改的「標籤」其實是名稱的一部分；也可能是模組沒鎖版本、被升級了；或是有人手動改了雲端，refresh 後算出要替換。把 plan 輸出裡標著 <code>forces replacement</code> 的那一行找出來，答案就在那裡。</li>
<li>Terraform 會以為什麼都不存在，嘗試把所有資源重新建一次，結果是名稱衝突的錯誤，或在雲端多出一套重複的資源。先停止所有 apply，然後用 import 區塊把現有資源一個一個收編回新的狀態，直到 plan 顯示沒有變更。事後一定要開 bucket 版本控制。</li>
<li>寫一個 import 區塊，<code>to = aws_s3_bucket.assets</code>、<code>id = "hilo-assets"</code>，跑 <code>terraform plan -generate-config-out=generated.tf</code>，整理產生的設定，再 plan 直到結果是「1 to import, 0 to add, 0 to change, 0 to destroy」，最後 apply，刪掉 import 區塊。看到「0 to change」才代表你的程式碼和現況完全一致。</li>
<li>用 <code>moved</code> 區塊，每個資源一個，例如 <code>from = aws_lb.main</code>、<code>to = module.hilo_api.aws_lb.main</code>。plan 應該只顯示位址搬移，沒有 add 或 destroy。</li>
<li>Argo CD 下一次比對時發現副本數跟 git 不一樣，會把它改回 git 裡的值，手動擴的 Pod 被收掉。正確做法是改 git（開 PR 調副本數），或更好的是設 HPA 讓它自動調整，並在 Argo CD 裡忽略 replicas 欄位。緊急時真的要手動，先暫停這個 Application 的自動同步，事後補 PR。</li>
<li>先 <code>fmt -check</code>（幾秒、最便宜），再 Checkov 掃原始碼，接著產生 plan 並用 Conftest 檢查 plan 的 JSON，然後人工審查 plan，最後才 apply 那份存檔的 plan。原則是越便宜、越快的越前面，失敗就早點停；人工審查放在機器檢查之後，人只需要專心看機器看不懂的部分。</li>
</ol>
</details>

<h3>十七、想再挖深</h3>
<ul>
<li><b>Terraform 官方文件</b>（<a href="https://developer.hashicorp.com/terraform/docs">developer.hashicorp.com</a>）：State、Backends、Import、Refactoring（moved）這幾個章節，是本章的權威來源。</li>
<li><b>OpenTofu 官方文件</b>（<a href="https://opentofu.org/docs/">opentofu.org</a>）：和 Terraform 幾乎相同，另外有狀態加密等自己的功能。</li>
<li><b>Yevgeniy Brikman《Terraform: Up &amp; Running》</b>（O'Reilly）：從狀態管理、模組到團隊流程，講得最完整的一本實戰書。</li>
<li><b>Kief Morris《Infrastructure as Code》</b>（O'Reilly）：不綁工具，談 IaC 的設計原則、測試和團隊做法。</li>
<li><b>Argo CD 官方文件</b>（<a href="https://argo-cd.readthedocs.io/">argo-cd.readthedocs.io</a>）與 <b>OpenGitOps</b>（<a href="https://opengitops.dev/">opengitops.dev</a>）：前者是工具細節，後者是 CNCF 整理的 GitOps 四個原則。</li>
</ul>
` });
