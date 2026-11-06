MZ({
  id: 'k8s',
  title: '容器、Kubernetes 與自動化',
  time: '6 到 8 週',
  blurb: '把軟體打包好，到哪裡跑都一樣；讓系統替你顧著它一直跑；每一次變更都透過程式碼來做。',
  lessons: [
  {
    id: 'ctr-what',
    title: '容器到底是什麼',
    body: `
<p>容器（container）是一種打包方式：把程式和它需要的所有東西包在一起，這樣在你的筆電上跑、在伺服器上跑，結果都一樣。常有人把它說成小型的虛擬機（virtual machine）。其實它更單純：就是一個普通的 Linux 行程（process），只是被戴上了眼罩，又被給了一筆預算。</p>
<ul>
<li><b>眼罩，也就是命名空間（namespace）：</b>這個行程看到的是專屬於它的系統樣貌。它只看得到自己的行程、自己的網路、自己的檔案。</li>
<li><b>預算，也就是 cgroups：</b>核心（kernel）會限制它最多能用多少 CPU 和記憶體。</li>
</ul>
<table>
<tr><th></th><th>虛擬機</th><th>容器</th></tr>
<tr><td>裡面裝什麼</td><td>一整套作業系統</td><td>一個程式和它的檔案</td></tr>
<tr><td>核心</td><td>自己有一個</td><td>跟主機（host）共用</td></tr>
<tr><td>啟動要多久</td><td>幾十秒</td><td>不到一秒</td></tr>
<tr><td>隔離</td><td>強</td><td>比較弱：核心的一個漏洞，或一個不小心的設定，就能把它打破</td></tr>
</table>
<h3>映像檔與容器</h3>
<p><b>映像檔（image）</b>是一疊唯讀的檔案層（layer），再附上一張便條，寫著要執行什麼。Dockerfile 裡每一道指令都會加一層。<b>容器</b>就是一個跑起來的映像檔，最上面多了薄薄一層可以寫入的層。容器一移除，這一層就跟著消失，所以值得留下來的東西都要放進<b>儲存卷（volume）</b>。</p>
<h3>做維運的人為什麼喜歡容器</h3>
<ul>
<li>同一份產出物（artifact）從筆電一路走到正式環境（production）。「在我的電腦上明明可以跑」從此不再是問題。</li>
<li>容器只會整個換掉，絕不在原地修補。每一份都保證一模一樣。</li>
<li>要回復上一版（roll back），就是改跑前一個映像檔。</li>
</ul>
<h3>深入一點：好的映像檔</h3>
<ul>
<li><b>基底要小</b>（slim 或 distroless）。套件越少，安全漏洞就越少。</li>
<li><b>多階段建置（multi-stage build）：</b>在其中一個階段編譯，只把編譯出來的成果複製進最終的映像檔。</li>
<li><b>用非 root 的使用者執行。</b>預設情況下，容器裡的行程是 root。</li>
<li><b>鎖定版本。</b>寫 <code>node:22.11-slim</code>，不要寫 <code>node:latest</code>。</li>
<li><b>一個容器只跑一個行程</b>，日誌寫到標準輸出（standard output）。</li>
<li><b>映像檔裡不放機密（secret）。</b>每一層都是永久的，只要手上有這個映像檔，任何人用 <code>docker history</code> 都看得到。</li>
</ul>
<h3>深入一點：容器怎麼逃出去</h3>
<p>有三種設定等於把主機的鑰匙交給容器：<code>--privileged</code>、把 Docker socket（<code>/var/run/docker.sock</code>）掛載進容器，以及把主機的目錄（例如 <code>/</code>）掛載進去。只要用了其中任何一種，「攻進這個容器」就等於「拿下整台機器」。</p>
<p>在 Mac 上，容器其實是跑在一台小型的 Linux 虛擬機裡（你用的是 colima），因為容器需要 Linux 核心。</p>`,
    tryNote: '在你的 Mac 上執行，要先把 colima 開起來。alpine 映像檔大約 8 MB。',
    try: [
      '容器只看得到它自己的行程。這就是眼罩。',
      '印出 67108864：就是那 64 MB 的預算，由核心強制執行。',
      'uid=0。除非映像檔另外指定，否則裡面的行程就是 root。'
    ],
    own: `挑一個你自己的映像檔。它有多大（<code>docker images</code>）？它是不是用 root 在跑？（<code>docker inspect -f "{{.Config.User}}" IMAGE</code> 如果什麼都沒印，代表沒有指定使用者，也就是 root。）<code>docker history --no-trunc IMAGE</code> 有沒有露出建置時傳進去的密碼或金鑰？`,
    quiz: [
      { q: "容器和虛擬機在技術上最關鍵的差別是什麼？",
        a: ["容器下載起來一定比較快", "容器跟主機共用核心，虛擬機跑的是自己的核心", "虛擬機不能用網路", "容器不能跑資料庫"],
        why: "共用核心讓容器又輕又快，但也讓它的隔離比較弱。" },
      { q: "容器在自己的檔案系統裡寫了一個檔案，之後容器被移除。這個檔案會怎樣？",
        a: ["它會被存進映像檔", "它會不見，除非當初是寫到儲存卷裡", "它會搬到主機的家目錄", "它會被上傳到映像檔倉庫（registry）"],
        why: "可寫層是那個容器專屬的，容器走了，它也跟著走。" }
    ]
  },
  {
    id: 'k8s-idea',
    title: 'Kubernetes：核心觀念與內部構造',
    body: `
<p>假設你有五十個容器（container）和十台機器。總得有個東西來決定每個容器跑在哪一台、把當掉的重新啟動、機器掛了就把容器搬走、推出新版本，還要把流量導給它們。<b>Kubernetes</b> 就是那個東西。</p>
<h3>唯一的核心觀念</h3>
<p>你不是告訴 Kubernetes 該做什麼，而是告訴它你想要什麼：「game-api 1.4 版跑三份，每份半顆 CPU」。它會一遍又一遍拿這個跟現況比對，一有差異就修正。恆溫器也是這樣運作的。這個迴圈叫做<b>調和（reconciliation）</b>，Kubernetes 其他的一切，都是蓋在它上面的細節。</p>
<h3>內部構造</h3>
<div class="tiers">
<b>控制平面（control plane）</b><div><span class="box hot">API 伺服器（API server）<small>唯一的一扇門，所有東西都跟它溝通</small></span><span class="box">etcd<small>記錄期望狀態（desired state）與實際狀態的資料庫</small></span><span class="box">排程器（Scheduler）<small>替每個新的 Pod 挑一台機器</small></span><span class="box">控制器（Controllers）<small>就是那些恆溫器</small></span></div>
<b>每個節點（node）</b><div><span class="box">kubelet<small>照指示啟動和停止容器</small></span><span class="box">容器執行環境（container runtime）<small>containerd</small></span><span class="box">kube-proxy<small>網路規則</small></span></div>
</div>
<p>你用一個叫 <code>kubectl</code> 的工具跟 API 伺服器溝通，通常是把描述你想要什麼的 YAML 檔交給它。</p>
<h3>這樣帶來的結果</h3>
<ul>
<li><b>自我修復（self-healing）。</b>機器掛了，上面的容器會在別的地方重新啟動，不用把任何人叫醒。</li>
<li><b>你不再動手修東西。</b>你改的是描述，系統再去改變現況。</li>
<li><b>etcd 是叢集（cluster）的記憶。</b>它會跑三份或五份，而且要備份。</li>
</ul>
<h3>深入一點：Kubernetes 的幾種規模</h3>
<ul>
<li><b>代管式（managed）</b>，例如 EKS、GKE、AKS：控制平面由雲端業者負責維運。大多數公司用的就是這種。</li>
<li><b>k3s：</b>把整套東西做成一支小程式。適合學習、邊緣裝置（edge device）和小規模的正式環境。</li>
</ul>
<div class="note"><b>說句老實話。</b>服務、團隊或機器很多的時候，Kubernetes 才划得來。如果只是在一台機器上跑幾個容器，Docker Compose 比較簡單，也就夠了。之所以要學 Kubernetes，是因為整個業界都靠它在跑、雇主會要求，也因為它的觀念（宣告期望狀態、檢查健康、逐步推出）到哪裡都用得上。</div>`,
    tryNote: '在免費的 Killercoda Kubernetes 練習場（killercoda.com/playgrounds）裡執行。它跑在瀏覽器裡，不會增加你 Mac 的負擔。',
    try: [
      '叢集裡的機器。',
      '所有正在跑的東西，包括 Kubernetes 自己的元件。',
      '要求跑三份，然後看著它們出現。按 Control+C 停止觀看。',
      '砍掉一個。替補的已經在啟動了：恆溫器注意到了。',
      '清理乾淨。'
    ],
    own: `寫下現在你的容器當掉時，是什麼東西把它重新啟動的：Docker 的重啟政策（restart policy）、systemd，還是什麼都沒有？接著再寫下，如果今晚整台機器掛了會怎樣。這兩個答案之間的落差，就是編排器（orchestrator）要補上的。`,
    quiz: [
      { q: "有個 Deployment 設定為 3 個副本（replica），你刪掉其中一個 Pod。接下來會怎樣？",
        a: ["這個 Deployment 從此只跑 2 個", "控制器發現想要 3 個卻只有 2 個，就再建一個補上", "整個 Deployment 被刪掉", "什麼都不會發生，直到你下指令為止"],
        why: "現況跟期望狀態對不上了，所以這個迴圈會把落差補起來。" },
      { q: "哪個元件負責保存叢集的狀態？",
        a: ["kubelet", "排程器（Scheduler）", "etcd", "kube-proxy"],
        why: "etcd 存著「被要求的」和「實際存在的」。沒有備份又把它弄丟，叢集就什麼都不記得了。" }
    ]
  },
  {
    id: 'k8s-objects',
    title: '核心物件',
    body: `
<p>Kubernetes 裡的每樣東西都是一個<b>物件（object）</b>：一小段描述，說明你希望存在的某樣東西。七種物件就涵蓋了大部分的實際工作。</p>
<table>
<tr><th>物件</th><th>它是什麼</th></tr>
<tr><td><b>Pod（容器組）</b></td><td>最小的單位：一個容器（container），有時候是幾個共用同一個位址的容器。Pod 是用完即丟的。Pod 被換掉之後，新的 Pod 會拿到新的位址。</td></tr>
<tr><td><b>Deployment（部署）</b></td><td>「讓 N 個一模一樣的 Pod 一直跑著，版本變了就逐步把它們換掉。」</td></tr>
<tr><td><b>Service（服務）</b></td><td>擋在一群不斷變動的 Pod 前面的固定名字和位址。它也會把流量分散到這些 Pod 上。</td></tr>
<tr><td><b>Ingress（入口）</b></td><td>從外面進來的 HTTP 路由：這個主機名稱（hostname）和路徑，送到那個 Service。通常 TLS 也在這裡終結。</td></tr>
<tr><td><b>ConfigMap</b></td><td>不算機密的設定。</td></tr>
<tr><td><b>Secret</b></td><td>屬於機密的設定。</td></tr>
<tr><td><b>Namespace</b></td><td>把物件分組的資料夾，用來把團隊或環境分開。</td></tr>
</table>
<div class="flow"><span class="box">網際網路</span><span class="arr">&rarr;</span><span class="box">Ingress</span><span class="arr">&rarr;</span><span class="box hot">Service<small>固定的名字</small></span><span class="arr">&rarr;</span><span class="box">Pod</span><span class="box">Pod</span><span class="box">Pod</span></div>
<h3>靠標籤把一切串起來</h3>
<p>物件之間靠<b>標籤（label）</b>找到彼此。Pod 身上帶著 <code>app: web</code>。Service 則說「把流量送給所有標著 <code>app: web</code> 的東西」。沒有任何東西是靠位址接起來的。</p>
<pre><code>apiVersion: apps/v1
kind: Deployment
metadata: { name: web }
spec:
  replicas: 3
  selector: { matchLabels: { app: web } }
  template:
    metadata: { labels: { app: web } }
    spec:
      containers:
      - name: web
        image: nginx:1.27
        ports: [{ containerPort: 80 }]
---
apiVersion: v1
kind: Service
metadata: { name: web }
spec:
  selector: { app: web }
  ports: [{ port: 80, targetPort: 80 }]</code></pre>
<p>現在其他 Pod 用 <code>http://web</code> 就能連到它。Kubernetes 自己跑了一套 DNS，專門用來解析 Service 的名字。</p>
<h3>深入一點</h3>
<ul>
<li><b>Service 的類型。</b>ClusterIP 只有叢集（cluster）內部連得到（這是預設）。NodePort 會在每一台機器上開一個連接埠（port）。LoadBalancer 會向雲端要一台真正的負載平衡器（load balancer）。</li>
<li><b>Secret 預設只做了 Base64 編碼。</b>只要讀得到這個物件，就讀得到裡面的值。你可以開啟靜態加密（encryption at rest）、限制誰能讀 Secret，或是把真正的值放在機密管理工具（secrets manager）裡。</li>
<li><b>Ingress 需要一個控制器（controller）</b>來實際做事，例如 Traefik、HAProxy，或雲端商自己的控制器。過去最常用的 ingress-nginx 已在 2026 年停止維護；比較新的設計叫 Gateway API，正在取代 Ingress。</li>
</ul>`,
    tryNote: '在 Killercoda 練習場裡做。先把上面的 YAML 存成 web.yaml（貼進：cat > web.yaml）。',
    try: [
      '建立這些物件並列出來。後半段重複執行，直到 Pod 都變成 Running 為止。',
      '從一個用完即丟的 Pod，用名字呼叫這個 Service。',
      '把數量往上加。Service 會靠標籤跟上新的 Pod。'
    ],
    own: `在紙上把你目前的 Docker 架構翻成這些物件。每個長時間運行的容器變成一個 Deployment。你代理伺服器（proxy）裡的路由變成 Ingress。你的 .env 檔變成 ConfigMap 和 Secret。對外開的連接埠變成 Service。這樣你就知道搬到 Kubernetes 要動到哪些東西了。`,
    quiz: [
      { q: "為什麼 Pod 前面需要一個 Service？",
        a: ["Pod 自己沒辦法用網路", "Pod 只要被換掉，位址就會變；Service 給一個固定的名字，而且會跟著它們走", "它讓容器啟動得更快", "它會把 Pod 加密"],
        why: "Pod 來來去去。呼叫的一方需要一個不會跑掉的東西。" },
      { q: "Kubernetes Secret 裡的值，預設是怎麼保護的？",
        a: ["用 AES 加密", "用 SHA-256 做雜湊", "只做 Base64 編碼，這不算保護", "存在另一台機器上"],
        why: "Base64 只是編碼。真正的保護來自靜態加密和嚴格的存取規則。" }
    ]
  },
  {
    id: 'k8s-health',
    title: '健康檢查、資源、擴展與版本推出',
    body: `
<p>應用程式得先告訴 Kubernetes 怎樣才算健康，Kubernetes 才有辦法讓它保持健康。這件事靠四項設定。</p>
<h3>1. 探針（probe）</h3>
<table>
<tr><th>探針</th><th>它在問什麼</th><th>失敗的話</th></tr>
<tr><td><b>存活探測（liveness）</b></td><td>我是不是卡住了？</td><td>容器（container）會被重新啟動</td></tr>
<tr><td><b>就緒探測（readiness）</b></td><td>我現在能接流量嗎？</td><td>這個 Pod 會從 Service 裡被拿掉。它不會被殺掉。</td></tr>
<tr><td><b>啟動探測（startup）</b></td><td>我開機完成了嗎？</td><td>其他探針先等著</td></tr>
</table>
<p>最經典的錯誤，是讓存活探測去檢查資料庫。資料庫慢了一下，每個 Pod 的檢查都失敗，Kubernetes 就把它們全部重啟，本來只是打個嗝，結果變成一場服務中斷（outage）。存活探測應該只測行程（process）本身。</p>
<h3>2. Requests 與 limits</h3>
<ul>
<li><b>request</b> 是排程器（scheduler）替容器保留的量。這個量是有保證的。</li>
<li><b>limit</b> 是資源上限（resource limit），硬性的，不能超過。記憶體超過上限，容器會被殺掉（「OOMKilled」）。CPU 超過上限，它只會被放慢，不會被殺掉。</li>
<li>如果沒設 requests，Pod 會擠上同一批機器，互相搶資源，誰都吃不飽。</li>
</ul>
<pre><code>resources:
  requests: { cpu: 250m, memory: 256Mi }
  limits:   { memory: 512Mi }
readinessProbe:
  httpGet: { path: /ready, port: 8080 }
  periodSeconds: 5
livenessProbe:
  httpGet: { path: /alive, port: 8080 }
  periodSeconds: 10</code></pre>
<h3>3. 擴展</h3>
<p><b>HorizontalPodAutoscaler</b> 會自動增減 Pod，讓某個指標（metric），例如 CPU，維持在目標值附近。<b>叢集自動擴展器（cluster autoscaler）</b>則是在 Pod 塞不下的時候加機器。兩者都需要時間：一台新機器要好幾分鐘才能上場。所以要預留足夠的備用容量，撐過這段延遲。</p>
<h3>4. 版本推出</h3>
<p><b>滾動更新（rolling update）</b>會先啟動幾個新的 Pod，等它們通過就緒探測，再移除幾個舊的，然後重複下去。如果新版本一直沒辦法就緒，推出就會停下來，舊的 Pod 繼續服務。<code>kubectl rollout undo</code> 可以回復上一版（rollback）。</p>
<h3>深入一點：優雅關閉（graceful shutdown）</h3>
<p>Pod 要被移除的時候會收到 SIGTERM，預設有 30 秒，時間到才會被殺掉。守規矩的伺服器會利用這段時間停止接新工作、把手上的做完、關閉連線。不理會 SIGTERM 的伺服器，每次部署都會丟下使用者。</p>
<h3>深入一點：有狀態的東西</h3>
<p>Pod 是用完即丟的，所以資料需要 <b>PersistentVolume</b>，也就是一顆活得比 Pod 久的磁碟。<b>StatefulSet</b> 會給每個 Pod 一個固定的名字（<code>db-0</code>、<code>db-1</code>）和它專屬的磁碟。不過很多團隊還是把資料庫放在叢集外面的代管服務上，叢集裡只跑無狀態（stateless）的應用程式。這是個合理的預設做法。</p>
<p><b>PodDisruptionBudget</b> 是告訴 Kubernetes：在排空一台機器（drain）這類計畫性作業期間，某個應用程式至少要有幾個 Pod 活著。</p>`,
    tryNote: '在 Killercoda 練習場裡做，沿用第 2.3 課那個叫 web 的 Deployment。',
    try: [
      '用滾動更新換到新版本。',
      '先看有哪些版本，再回復上一版。',
      '一次壞掉的發布。新的 Pod 啟動失敗，舊的繼續服務。做完記得把它復原。'
    ],
    own: `挑一個你自己的服務，回答三個問題。它啟動之後，怎麼表示自己已經準備好接流量？啟動要花多久？收到 SIGTERM 的時候它會怎麼做：直接丟下使用者，還是先把手上的工作做完？這三個答案，就是它的就緒探測、啟動探測和寬限期（grace period）。`,
    quiz: [
      { q: "某個 Pod 的就緒探測開始失敗。Kubernetes 會怎麼做？",
        a: ["重新啟動容器", "不再把流量送給它，但讓它繼續跑", "刪掉 Deployment", "加更多記憶體"],
        why: "就緒探測只管流量。重啟是存活探測的工作。" },
      { q: "容器用的記憶體超過了它的上限。會發生什麼事？",
        a: ["它會被放慢", "它會被殺掉，並回報為 OOMKilled", "上限會自動調高", "什麼事都沒有"],
        why: "記憶體沒辦法像 CPU 那樣節流（throttle），所以容器只能被殺掉。" },
      { q: "為什麼存活探測不該依賴資料庫？",
        a: ["資料庫沒辦法回應探針", "資料庫短暫出個狀況，就會讓所有 Pod 同時重啟", "它太吃 CPU", "探針一定要用 UDP"],
        why: "存活檢查裡放了大家共用的相依項目，小故障就會變成大規模重啟。" }
    ]
  },
  {
    id: 'iac',
    title: '基礎設施即程式碼',
    body: `
<p>如果你是在網頁主控台（console）上點來點去把伺服器建起來，那做過什麼沒有紀錄、沒有人審查過，你也沒辦法照樣再做一遍。半年後有人問「那個連接埠是誰開的？為什麼要開？」，沒人答得出來。</p>
<p><b>基礎設施即程式碼（infrastructure as code）</b>的意思是：整套設定都寫成檔案，放在 git 裡。變更就跟其他程式碼一樣要經過審查。歷史紀錄看得出誰改了什麼。整個環境可以從零重建，測試環境也可以做成跟正式環境（production）一模一樣的翻版。</p>
<h3>Terraform</h3>
<p>Terraform（以及它的開源雙胞胎 OpenTofu）是標準工具。你描述應該存在什麼，它自己算出要怎麼做到。</p>
<pre><code>resource "aws_security_group_rule" "https" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.web.id
}</code></pre>
<ul>
<li><code>plan</code> 會顯示你的檔案和現況之間的差異，但什麼都不會改。</li>
<li><code>apply</code> 會讓現況變得跟檔案一致。</li>
<li><b>狀態檔（state file）</b>記錄了 Terraform 建過哪些東西，這樣它才知道哪些歸它管。它很寶貴，而且裡面可能有機密。團隊會把它放在有鎖定機制的共用儲存空間裡，絕不放進 git。</li>
<li><b>設定飄移（drift）</b>是指有人動手改了東西。下一次 plan 就會把它顯示出來。</li>
</ul>
<h3>用在 Kubernetes 上</h3>
<ul>
<li><b>Helm</b> 把一組 YAML 檔打包成一份「chart」，裡面的值可以調整，所以同一份 chart 可以用在預備環境（staging），也可以用在正式環境。</li>
<li><b>GitOps</b>（Argo CD、Flux）：叢集（cluster）裡有個代理程式（agent）盯著一個 git 儲存庫（repository），裡面有什麼就套用什麼。部署就是一次合併（merge）。回復上一版就是一次還原（revert）。沒有人需要直接存取正式環境。</li>
</ul>
<h3>深入一點：寵物與牛群（pets and cattle）</h3>
<p>「寵物」伺服器有名字，是手工設定起來的，生病了要細心照顧到康復。「牛群」伺服器每台都一樣，只有編號，哪一台病了就直接換掉。程式碼把寵物變成牛群。檢驗方法很簡單：如果這台機器現在憑空消失，你能不能只靠 git 和備份，在一小時內讓一台一模一樣的機器上線接流量？</p>
<h3>深入一點：模組與環境</h3>
<p>重複出現的組合（例如一個服務加上它的負載平衡器（load balancer）和警報）只寫一次，做成<b>模組（module）</b>，再用不同的輸入值重複使用。每個環境都有自己的狀態。機密只用名字來引用，執行的時候才去取，絕不寫進檔案裡。</p>`,
    tryNote: '一個不用花錢的練習，在你的 Mac 上做，只會建立一個本機檔案。安裝方式：brew install opentofu。然後建一個空資料夾，在裡面執行下面這些指令。',
    try: [
      '寫好描述，並下載 provider。',
      '它說會建立一個檔案。到這裡什麼都還沒發生。',
      '現在檔案真的存在了。',
      '設定飄移：工具發現現況跟程式碼對不上了，並提議把它改回去。'
    ],
    own: `想像明天要把所有東西搬到一台新機器。只存在舊機器上的東西都會不見，而排程工作（scheduled job）就是最常被忘掉的經典例子。把現在只以「手工做出來的狀態」存在伺服器上的東西全部列出來：crontab、代理伺服器（proxy）的設定、防火牆規則、.env 檔。每一項都可以考慮搬進 git 儲存庫。`,
    quiz: [
      { q: "Terraform 的狀態檔是什麼？",
        a: ["記錄誰下過指令的日誌", "記錄 Terraform 管理的真實資源，用來算出哪些東西需要變更", "你資料庫的備份", "團隊的密碼清單"],
        why: "它把你的檔案和真實資源連起來。弄丟了，Terraform 就不知道哪些東西歸它管。" },
      { q: "在 GitOps 的架構下，新版本是怎麼部署的？",
        a: ["工程師在自己的筆電上執行 kubectl", "把變更合併進 git，叢集裡的代理程式就會套用它", "用 FTP 把檔案複製到伺服器", "把叢集重建"],
        why: "Git 是唯一的事實來源（source of truth）。是叢集自己把變更拉進來，不是人把變更推上去。" }
    ]
  },
  {
    id: 'cicd',
    title: 'CI/CD：從 commit 到正式環境',
    body: `
<p><b>持續整合（continuous integration，簡稱 CI）</b>的意思是每次推送（push）都會自動建置和測試，所以東西一壞，幾分鐘內就會被發現，而且是機器發現的。<b>持續交付（continuous delivery，簡稱 CD）</b>的意思是每個通過的建置版本都可以自動發布，或是按一下就發布。兩者合起來就是<b>管線（pipeline）</b>，而且管線應該是通往正式環境（production）的唯一一條路。</p>
<div class="flow"><span class="box">提交（commit）</span><span class="arr">&rarr;</span><span class="box">建置映像檔</span><span class="arr">&rarr;</span><span class="box">測試</span><span class="arr">&rarr;</span><span class="box">掃描<small>相依套件、映像檔、機密</small></span><span class="arr">&rarr;</span><span class="box">推送<small>用 commit ID 當標籤</small></span><span class="arr">&rarr;</span><span class="box">預備環境</span><span class="arr">&rarr;</span><span class="box hot">正式環境<small>逐步放量</small></span><span class="arr">&rarr;</span><span class="box">觀察、回復上一版</span></div>
<h3>能擋掉大多數災難的幾條規則</h3>
<ul>
<li><b>只建置一次。</b>在預備環境（staging）測過的映像檔（image），跟送上正式環境的是同一個檔案。只有設定不同。</li>
<li><b>用 commit ID 當標籤（tag）</b>，絕不用 <code>latest</code>。你永遠清楚知道現在跑的是哪一版，要回復上一版也很精準。</li>
<li><b>要快。</b>一條要跑一小時的管線，大家就會繞過它。</li>
<li><b>機密從管線的機密儲存區（secret store）拿</b>，絕不從儲存庫（repository）拿。</li>
<li><b>發布不是到「已部署」就算完成。</b>要等到之後錯誤率和延遲（latency）看起來還是正常，才算完成。</li>
</ul>
<h3>發布的幾種方式</h3>
<table>
<tr><th>策略</th><th>怎麼做</th><th>取捨</th></tr>
<tr><td>滾動更新（rolling）</td><td>一次換幾台伺服器</td><td>簡單。新舊版本會並存一陣子。</td></tr>
<tr><td>藍綠部署（blue-green）</td><td>另外跑起完整的一套，再把流量切過去</td><td>可以瞬間回復上一版。切換期間成本加倍。</td></tr>
<tr><td>金絲雀發布（canary）</td><td>先把 1 到 5% 的流量送到新版本，比較結果，再逐步放大</td><td>發布有問題也只傷到少數使用者。需要好的指標。</td></tr>
<tr><td>功能開關（feature flag）</td><td>程式碼先以關閉的狀態上線，之後再打開</td><td>把部署和發布分開。開關會越積越多。</td></tr>
</table>
<h3>深入一點：資料庫的變更</h3>
<p>在版本推出的過程中，新舊程式碼會同時對著同一個資料庫跑，所以資料庫結構（schema）的變更必須兩邊都能用。安全的做法是<b>先擴張、再收縮（expand, then contract）</b>：先加新欄位；部署同時寫入新舊兩個欄位的程式碼；把舊資料複製過去；把讀取切到新欄位；最後才移除舊欄位。每一步都可以單獨回復。</p>
<h3>深入一點：管線的信任問題</h3>
<p>管線握有變更正式環境的權力，所以它是頭號攻擊目標。替主分支（main branch）設保護，規定一定要經過審查。讓管線在執行的時候才去取得短效的雲端存取憑證（透過 OIDC），這樣就不用存任何長效金鑰。別忘了，惡意的相依套件是在管線裡面執行的，拿得到管線的機密。</p>
<p>常見的工具：GitHub Actions、GitLab CI、Jenkins、Argo CD。</p>`,
    own: `你大概早就照著一套手動的發布流程在做了：跑測試、開瀏覽器檢查、建置、部署。把這些步驟寫成編號清單。把機器不用你也能自己跑的步驟都標出來。這份清單就是你管線設定檔的初稿。`,
    quiz: [
      { q: "為什麼映像檔要用 commit ID 當標籤，而不用「latest」？",
        a: ["這樣映像檔比較小", "你清楚知道現在跑的是哪一份程式碼，也能回復到確切的版本", "映像檔倉庫（registry）規定要這樣", "這樣建置比較快"],
        why: "「latest」指的東西會隨時間改變。commit ID 永遠不會。" },
      { q: "什麼是金絲雀發布？",
        a: ["挑一個冷清的日子發布", "先把一小部分流量送到新版本，數字維持健康再逐步放大", "永遠只發布給內部員工", "不測試就發布"],
        why: "它把壞版本的傷害限制在少數使用者身上，全面推出之前也能先拿到真實的資料。" },
      { q: "你要在一個正在線上運作的系統裡替資料庫欄位改名。安全的做法是什麼？",
        a: ["改名的同時部署新程式碼", "加新欄位、兩邊都寫、複製資料、切換讀取，最後再刪掉舊欄位", "把網站停下來改", "先改名，有錯誤再一個一個修"],
        why: "版本推出的過程中，新舊程式碼會同時在跑。每一步都必須兩邊都能用。" }
    ]
  },
  {
    id: 'k8s-prod',
    title: '正式環境裡的 Kubernetes',
    body: `
<p>跑幾個 Pod 很容易。這一課講的是「用過 Kubernetes 的人」和「大家放心把它交給他管的人」差在哪裡，這也是 CKA 考試和資深職位面試在考的程度。</p>
<h3>網路</h3>
<ul>
<li>每個 Pod 都有自己的 IP 位址，而且每個 Pod 都能直接連到其他任何一個 Pod。靠一個外掛（<b>CNI</b>：Calico、Cilium、Flannel）讓這件事跨機器也成立。</li>
<li>Service 是一個虛擬位址。kube-proxy（比較新的架構則是用 eBPF 程式）會改寫封包（packet），讓送往它的流量落到某個真正的 Pod 上。</li>
<li><b>CoreDNS</b> 負責解析像 <code>web.shop.svc.cluster.local</code> 這樣的名字。</li>
<li><b>預設情況下，所有 Pod 都可以跟所有 Pod 通訊。</b><b>NetworkPolicy</b>（網路政策）就是 Pod 之間的防火牆。正式環境的叢集（cluster）會先套一條全部拒絕（deny-all）的政策，再把需要的打開。</li>
</ul>
<h3>誰可以做什麼：RBAC（角色型存取控制）</h3>
<p><b>Role</b> 列出對某幾類物件可以做的動作（「讀取這個 Namespace 裡的 Pod」）。<b>RoleBinding</b> 把它授予某個使用者，或某個 <b>ServiceAccount</b>（服務帳號），也就是 Pod 執行時用的身分。實務上的規矩：應用程式絕不給 cluster-admin；每個應用程式都有自己的 ServiceAccount，只給它最少夠用的權限；而且只有少數人能讀 Secret。</p>
<h3>Pod 的安全</h3>
<p><b>Pod Security Standards</b> 定義了幾個等級。「restricted」這一級禁止用 root 執行、禁止提升權限（privilege escalation）、禁止掛載主機目錄，也禁止特權模式（privileged mode）。以 Namespace 為單位強制套用它。這樣就能擋掉第 2.1 課講的大部分容器（container）逃逸手法。</p>
<h3>共用一個叢集</h3>
<p>Namespace 加上資源配額（resource quota）、網路政策，再加上 RBAC，可以在團隊之間做出軟性的區隔。如果某個團隊被攻破絕對不能波及另一個團隊（例如金流），那就用各自獨立的叢集，或各自獨立的雲端帳號。</p>
<h3>升級</h3>
<p>大約每年會出三個新的次要版本（minor version），每個版本大約支援一年。一次只升一個次要版本：先升控制平面（control plane），再升節點（node）。每個節點換掉之前都要先做<b>排空節點（drain）</b>，也就是把上面的 Pod 移走。PodDisruptionBudget 會確保過程中每個應用程式都還有足夠的份數活著。每次升級前都要檢查有沒有 API 被移除。</p>
<h3>擴充它的功能</h3>
<ul>
<li><b>自訂資源（custom resource）</b>可以新增一種物件。<b>Operator（維運控制器）</b>是管理它的控制器，把維運知識寫成了程式碼：例如管憑證的 cert-manager，以及各種資料庫 operator，用來管理具備容錯移轉（failover）的資料庫叢集。</li>
<li><b>服務網格（service mesh）</b>，例如 Istio、Linkerd，會在每個 Pod 旁邊放一個代理伺服器（proxy）。不用改應用程式的程式碼，就能得到服務之間的加密、重試、流量分流和詳細的指標。代價是複雜度。等你有具體需求的時候再加。</li>
</ul>
<h3>你會遇到的故障</h3>
<table>
<tr><th>症狀</th><th>常見原因</th></tr>
<tr><td>CrashLoopBackOff</td><td>應用程式一啟動就退出：設定錯誤、少了機密、相依的服務出問題。去看 <code>kubectl logs --previous</code>。</td></tr>
<tr><td>Pending</td><td>沒有任何機器放得下它的 requests，或是它的儲存卷（volume）掛不上去。去看 <code>kubectl describe pod</code>。</td></tr>
<tr><td>ImagePullBackOff</td><td>映像檔（image）的名稱或標籤（tag）寫錯、少了映像檔倉庫（registry）的登入憑證，或是被限速（rate limit）。</td></tr>
<tr><td>OOMKilled</td><td>記憶體上限設太低，或是有記憶體洩漏（leak）。</td></tr>
<tr><td>不明原因變慢</td><td>CPU 上限在對應用程式節流（throttling），或是叢集內的 DNS 查詢很慢。</td></tr>
<tr><td>Pod 被驅逐（evicted）</td><td>機器的記憶體或磁碟不夠了。</td></tr>
</table>
<p>除錯的步驟永遠不變：先 <code>kubectl get</code>，再用 <code>describe</code> 看事件（event），接著看 <code>logs</code>，最後 <code>exec</code> 進到 Pod 裡，或是掛上一個除錯用的容器。</p>`,
    own: `去做 Killercoda 上免費的「CKA」情境題，做到不看筆記也能把壞掉的叢集修好為止。然後寫一頁文件：「如果我的主要服務跑在 Kubernetes 上，它的 Deployment、Service、探針、資源數字和網路政策會是什麼樣子？」這份文件可以放進作品集，同時也是一道常見面試題的答案。`,
    quiz: [
      { q: "一個全新的叢集，沒有任何 NetworkPolicy。哪些 Pod 可以跟哪些 Pod 通訊？",
        a: ["都不行", "只有同一個 Namespace 裡的 Pod", "每個 Pod 都能連到其他任何 Pod", "只有標籤（label）相同的 Pod"],
        why: "預設是全開的。隔離得自己加上去，通常從一條全部拒絕（deny-all）的政策開始。" },
      { q: "服務網格主要提供什麼？",
        a: ["比較便宜的機器", "服務之間的加密、流量控制和指標，而且不用改應用程式的程式碼", "取代資料庫", "更快的映像檔建置"],
        why: "每個 Pod 旁邊的代理伺服器會處理網路方面的事。代價是多了一堆會動的零件。" },
      { q: "有個 Pod 處於 CrashLoopBackOff。最有用的第一個指令是什麼？",
        a: ["kubectl delete namespace", "kubectl logs 加上 --previous 旗標", "重啟節點", "增加副本數"],
        why: "原因就在剛死掉的那個容器身上。--previous 會顯示它的輸出。" }
    ]
  }
  ]
});
