DEEP({ 'k8s-objects': `
<p>上一課列了七種物件，再用標籤把它們串起來。這一章把每一種打開：Pod 為什麼是「一組」容器、Deployment 和 ReplicaSet 怎麼一層管一層地做滾動更新、標籤和 EndpointSlice 怎麼決定流量送給誰、Service 的四種類型、Ingress 和正在取代它的 Gateway API、為什麼 Secret 預設根本不祕密、Namespace 管得到和管不到的地方。接著拆開最神祕的一個：ClusterIP 這個「沒有任何網卡擁有」的位址，封包到底怎麼送到 Pod。最後一行一行讀一份完整的小應用。探針和資源上限留給下一課，網路政策和 RBAC 留給第 2.7 課。</p>

<h3><span class="badge lv1">基礎</span>一、每個物件都是一張訂單</h3>
<p>網購訂單分兩半：上半是你填的（買什麼、買幾個、送到哪），下半是物流填的（已出貨、配送中、已送達）。Kubernetes 的每一個物件都是這樣一張訂單：</p>
<pre><code>apiVersion: apps/v1     # 屬於哪個 API 群組、哪一版
kind: Deployment        # 哪一種物件
metadata:               # 名字、命名空間、標籤、註解
  name: web
  namespace: hilo
  labels: { app: web }
spec: { … }             # 你要的樣子：你寫
status: { … }           # 現在的樣子：控制器寫，你不用寫</code></pre>
<p>不管是 Pod、Service 還是你以後會遇到的自訂資源，形狀都一樣。兩個指令讓你不必背欄位：<code>kubectl explain deployment.spec.strategy</code> 印出任何欄位的說明；<code>kubectl api-resources</code> 列出叢集裡所有的物件種類、它們的縮寫，以及是不是屬於某個命名空間。</p>

<h3><span class="badge lv1">基礎</span>二、Pod：合租同一間套房的幾個容器</h3>
<p>為什麼最小單位是 Pod，不是容器？因為有些程式<b>必須</b>住在一起：要用 <code>localhost</code> 互相連、要讀寫同一批檔案、要被排到同一台機器、要同生共死。把它們想成合租同一間套房的室友：同一個門牌（IP），同一扇門，各睡各的床（各自的映像檔和檔案系統），共用客廳（明確掛載的儲存卷）。</p>
<figure class="figure"><svg viewBox="0 0 660 280" class="fg" style="width:100%;max-width:660px" role="img" aria-label="一個 Pod 裡有 pause 容器握著網路命名空間、主容器和日誌代理共用同一個 IP，並共用一個 emptyDir 儲存卷；右邊是 init 容器、sidecar、主容器的啟動順序">
<rect x="14" y="14" width="460" height="250" rx="10" class="fg-b"/>
<text x="30" y="38" class="fg-t lg">Pod hilo-api-x2k4q</text>
<text x="458" y="38" text-anchor="end" class="fg-t sm mono">IP 10.244.1.7</text>
<rect x="30" y="56" width="130" height="64" rx="8" class="fg-b alt"/><text x="95" y="82" text-anchor="middle" class="fg-t mono">pause</text><text x="95" y="104" text-anchor="middle" class="fg-t sm">握著網路命名空間</text>
<rect x="176" y="56" width="136" height="64" rx="8" class="fg-b hot"/><text x="244" y="82" text-anchor="middle" class="fg-t acc">api</text><text x="244" y="104" text-anchor="middle" class="fg-t sm">聽 :8080</text>
<rect x="328" y="56" width="132" height="64" rx="8" class="fg-b"/><text x="394" y="82" text-anchor="middle" class="fg-t">日誌代理</text><text x="394" y="104" text-anchor="middle" class="fg-t sm">聽 :9090</text>
<line x1="95" y1="120" x2="95" y2="134" class="fg-l"/><line x1="244" y1="120" x2="244" y2="134" class="fg-l"/><line x1="394" y1="120" x2="394" y2="134" class="fg-l"/>
<rect x="30" y="134" width="430" height="34" rx="6" class="fg-b dash"/><text x="245" y="156" text-anchor="middle" class="fg-t sm">共用：同一個 IP、同一個 localhost、連接埠不能重複</text>
<line x1="244" y1="168" x2="244" y2="196" class="fg-l dash"/><line x1="394" y1="168" x2="394" y2="196" class="fg-l dash"/>
<rect x="176" y="196" width="284" height="50" rx="8" class="fg-b warm"/><text x="318" y="217" text-anchor="middle" class="fg-t mono">emptyDir：/var/log/app</text><text x="318" y="236" text-anchor="middle" class="fg-t sm">api 寫、日誌代理讀</text>
<text x="571" y="38" text-anchor="middle" class="fg-t lg">啟動順序</text>
<rect x="496" y="56" width="150" height="44" rx="8" class="fg-b"/><text x="571" y="75" text-anchor="middle" class="fg-t">① init 容器</text><text x="571" y="92" text-anchor="middle" class="fg-t sm">等資料庫、做遷移</text>
<rect x="496" y="126" width="150" height="44" rx="8" class="fg-b"/><text x="571" y="145" text-anchor="middle" class="fg-t">② sidecar 先起</text><text x="571" y="162" text-anchor="middle" class="fg-t sm">一直跑到最後</text>
<rect x="496" y="196" width="150" height="50" rx="8" class="fg-b hot"/><text x="571" y="217" text-anchor="middle" class="fg-t acc">③ 主容器</text><text x="571" y="236" text-anchor="middle" class="fg-t sm">就緒了才收流量</text>
<line x1="571" y1="100" x2="571" y2="118" class="fg-l"/><polygon points="571,126 566.5,118 575.5,118" class="fg-a"/>
<line x1="571" y1="170" x2="571" y2="188" class="fg-l"/><polygon points="571,196 566.5,188 575.5,188" class="fg-a"/>
</svg><figcaption>網路是整個 Pod 共用的，由一個什麼都不做的 pause 容器握著；檔案系統是各自的，要共用就明確掛同一個儲存卷。上一章練功題的 <code>--network container:a</code>，就是同一招。</figcaption></figure>
<ul>
<li><b>共用的</b>：網路命名空間（同一個 IP，兩個容器不能都聽 8080）、明確掛載的儲存卷、預設也共用 IPC。</li>
<li><b>不共用的</b>：根目錄（各自來自自己的映像檔）、PID 命名空間（除非設 <code>shareProcessNamespace: true</code>）、各自的資源上限。</li>
<li><b>init 容器</b>：在主容器之前一個一個跑，每個都必須成功結束。適合「等資料庫準備好」「先做資料庫遷移」「先下載設定」。</li>
<li><b>sidecar 容器</b>：寫在 <code>initContainers</code> 裡、加上 <code>restartPolicy: Always</code>。它會比主容器先啟動、一直跑著，Pod 結束時比主容器晚關，日誌代理和服務網格的 proxy 都適合這樣放。這個原生寫法在 1.33 成為正式功能，在那之前大家只能把它當普通容器，常常遇到「主程式結束了，sidecar 還不走」的問題。</li>
</ul>
<p>Pod 的階段（phase）只有五個：Pending、Running、Succeeded、Failed、Unknown。你常看到的 CrashLoopBackOff <b>不是</b>階段，而是某個容器「等待中」的原因：它一直啟動又結束，kubelet 重啟的間隔越拉越長（最多 5 分鐘）。</p>
<p>最重要的一點：<b>Pod 一輩子只屬於一台節點</b>，從來不會被「搬家」。節點掛了，那個 Pod 就沒了，由上層的控制器在別台建一個<b>新的</b>，新名字、新 IP。所以正式服務永遠不要直接建 Pod：沒有控制器管它，它死了就沒人補。</p>

<h3><span class="badge lv2">進階</span>三、ReplicaSet 與 Deployment：一層管一層</h3>
<p>Deployment 不直接管 Pod。它管的是 ReplicaSet，每一個版本的 Pod 範本對應一個 ReplicaSet，由 ReplicaSet 去維持 Pod 的數量：</p>
<pre><code>$ kubectl get rs -n hilo
NAME                  DESIRED   CURRENT   READY
hilo-api-7d9f8c6b5    3         3         3       # 現在的版本
hilo-api-5c4b9d7f8    0         0         0       # 上一版，留著準備回復</code></pre>
<p>名字後面那串是 Pod 範本的雜湊值，也會被加成每個 Pod 的 <code>pod-template-hash</code> 標籤，讓新舊兩個 ReplicaSet 分得清哪些 Pod 是自己的。只有<b>改了 Pod 範本</b>（映像檔、環境變數、資源設定）才會建立新的 ReplicaSet、觸發滾動更新；改 replicas 只是調整數量。</p>
<h4>滾動更新：兩個數字決定節奏</h4>
<p><code>maxSurge</code>：更新期間最多能比 replicas <b>多</b>幾個；<code>maxUnavailable</code>：最多能有幾個<b>沒就緒</b>。預設都是 25%，前者無條件進位、後者無條件捨去。用 replicas 4、兩者都是 1 走一次：</p>
<figure class="figure"><svg viewBox="0 0 660 290" class="fg" style="width:100%;max-width:660px" role="img" aria-label="滾動更新的五個階段：舊 4 新 0、舊 3 新 1、舊 3 新 2、舊 1 新 4、舊 0 新 4；任何時候總數不超過 5，就緒的不少於 3">
<text x="330" y="22" text-anchor="middle" class="fg-t sm">replicas 4、maxSurge 1、maxUnavailable 1：最多 5 個、至少 3 個就緒</text>
<rect x="50" y="44" width="60" height="24" rx="4" class="fg-b alt"/><text x="80" y="61" text-anchor="middle" class="fg-t sm">舊</text>
<rect x="50" y="74" width="60" height="24" rx="4" class="fg-b alt"/><text x="80" y="91" text-anchor="middle" class="fg-t sm">舊</text>
<rect x="50" y="104" width="60" height="24" rx="4" class="fg-b alt"/><text x="80" y="121" text-anchor="middle" class="fg-t sm">舊</text>
<rect x="50" y="134" width="60" height="24" rx="4" class="fg-b alt"/><text x="80" y="151" text-anchor="middle" class="fg-t sm">舊</text>
<rect x="175" y="44" width="60" height="24" rx="4" class="fg-b alt"/><text x="205" y="61" text-anchor="middle" class="fg-t sm">舊</text>
<rect x="175" y="74" width="60" height="24" rx="4" class="fg-b alt"/><text x="205" y="91" text-anchor="middle" class="fg-t sm">舊</text>
<rect x="175" y="104" width="60" height="24" rx="4" class="fg-b alt"/><text x="205" y="121" text-anchor="middle" class="fg-t sm">舊</text>
<rect x="175" y="134" width="60" height="24" rx="4" class="fg-b hot dash"/><text x="205" y="151" text-anchor="middle" class="fg-t sm">啟動中</text>
<rect x="300" y="44" width="60" height="24" rx="4" class="fg-b alt"/><text x="330" y="61" text-anchor="middle" class="fg-t sm">舊</text>
<rect x="300" y="74" width="60" height="24" rx="4" class="fg-b alt"/><text x="330" y="91" text-anchor="middle" class="fg-t sm">舊</text>
<rect x="300" y="104" width="60" height="24" rx="4" class="fg-b alt"/><text x="330" y="121" text-anchor="middle" class="fg-t sm">舊</text>
<rect x="300" y="134" width="60" height="24" rx="4" class="fg-b hot dash"/><text x="330" y="151" text-anchor="middle" class="fg-t sm">啟動中</text>
<rect x="300" y="164" width="60" height="24" rx="4" class="fg-b hot dash"/><text x="330" y="181" text-anchor="middle" class="fg-t sm">啟動中</text>
<rect x="425" y="44" width="60" height="24" rx="4" class="fg-b alt"/><text x="455" y="61" text-anchor="middle" class="fg-t sm">舊</text>
<rect x="425" y="74" width="60" height="24" rx="4" class="fg-b hot"/><text x="455" y="91" text-anchor="middle" class="fg-t sm">新</text>
<rect x="425" y="104" width="60" height="24" rx="4" class="fg-b hot"/><text x="455" y="121" text-anchor="middle" class="fg-t sm">新</text>
<rect x="425" y="134" width="60" height="24" rx="4" class="fg-b hot dash"/><text x="455" y="151" text-anchor="middle" class="fg-t sm">啟動中</text>
<rect x="425" y="164" width="60" height="24" rx="4" class="fg-b hot dash"/><text x="455" y="181" text-anchor="middle" class="fg-t sm">啟動中</text>
<rect x="550" y="44" width="60" height="24" rx="4" class="fg-b hot"/><text x="580" y="61" text-anchor="middle" class="fg-t sm">新</text>
<rect x="550" y="74" width="60" height="24" rx="4" class="fg-b hot"/><text x="580" y="91" text-anchor="middle" class="fg-t sm">新</text>
<rect x="550" y="104" width="60" height="24" rx="4" class="fg-b hot"/><text x="580" y="121" text-anchor="middle" class="fg-t sm">新</text>
<rect x="550" y="134" width="60" height="24" rx="4" class="fg-b hot"/><text x="580" y="151" text-anchor="middle" class="fg-t sm">新</text>
<line x1="116" y1="110" x2="161" y2="110" class="fg-l"/><polygon points="169,110 161,105.5 161,114.5" class="fg-a"/><text x="142" y="100" text-anchor="middle" class="fg-t sm acc">①</text>
<line x1="241" y1="110" x2="286" y2="110" class="fg-l"/><polygon points="294,110 286,105.5 286,114.5" class="fg-a"/><text x="267" y="100" text-anchor="middle" class="fg-t sm acc">②</text>
<line x1="366" y1="110" x2="411" y2="110" class="fg-l"/><polygon points="419,110 411,105.5 411,114.5" class="fg-a"/><text x="392" y="100" text-anchor="middle" class="fg-t sm acc">③</text>
<line x1="491" y1="110" x2="536" y2="110" class="fg-l"/><polygon points="544,110 536,105.5 536,114.5" class="fg-a"/><text x="517" y="100" text-anchor="middle" class="fg-t sm acc">④</text>
<text x="80" y="214" text-anchor="middle" class="fg-t sm">舊 4／新 0</text><text x="80" y="232" text-anchor="middle" class="fg-t sm acc">就緒 4</text>
<text x="205" y="214" text-anchor="middle" class="fg-t sm">舊 3／新 1</text><text x="205" y="232" text-anchor="middle" class="fg-t sm acc">就緒 3</text>
<text x="330" y="214" text-anchor="middle" class="fg-t sm">舊 3／新 2</text><text x="330" y="232" text-anchor="middle" class="fg-t sm acc">就緒 3</text>
<text x="455" y="214" text-anchor="middle" class="fg-t sm">舊 1／新 4</text><text x="455" y="232" text-anchor="middle" class="fg-t sm acc">就緒 3</text>
<text x="580" y="214" text-anchor="middle" class="fg-t sm">舊 0／新 4</text><text x="580" y="232" text-anchor="middle" class="fg-t sm acc">就緒 4</text>
<text x="330" y="270" text-anchor="middle" class="fg-t sm">① 開一個新的、關一個舊的　② 再開一個　③ 兩個新的就緒：關兩個舊的、補兩個新的　④ 全部就緒，關掉最後一個舊的</text>
</svg><figcaption>虛線框是還在啟動、還沒就緒的新 Pod。這是其中一種典型的過程，實際每一步的時間點看 Pod 多快就緒。不變的只有兩條規則：總數不超過 replicas 加 maxSurge，就緒的不少於 replicas 減 maxUnavailable。</figcaption></figure>
<p>幾個實務上的細節：</p>
<ul>
<li><b>容量不能少一個的服務</b>，設 <code>maxSurge: 1, maxUnavailable: 0</code>：永遠先多開一個、就緒了才關舊的。代價是更新期間要多一份資源。</li>
<li><b>回復上一版很快</b>：<code>kubectl rollout undo</code> 只是把舊的 ReplicaSet 調回原來的數量，映像檔通常還在節點上，不用重新下載。預設保留 10 個舊的 ReplicaSet（<code>revisionHistoryLimit</code>）。</li>
<li><b>Kubernetes 不會自動回復</b>。新版本一直沒就緒，超過 <code>progressDeadlineSeconds</code>（預設 600 秒），Deployment 只會標上 ProgressDeadlineExceeded，舊的 Pod 照樣在服務。要自動回復，得靠你的 CI/CD 或 Argo Rollouts 這類工具看到這個狀態再動手。</li>
<li><b>Recreate 策略</b>：先把舊的全部關掉，再開新的。中間會停機，但適合「新舊兩版絕對不能同時跑」的情況，例如只能有一個寫入者的程式。</li>
</ul>

<h3><span class="badge lv2">進階</span>四、標籤、選擇器與 EndpointSlice：流量送給誰</h3>
<p>標籤是貼在物件上的鍵值對，選擇器是「挑出貼了哪些標籤的物件」。除了 <code>app=web</code> 這種等號比對，還能用集合：<code>kubectl get pods -l 'env in (prod,staging),!canary'</code>。Service 用選擇器描述「我的後端是誰」，但它自己不去找 Pod。真正去找的是 <b>EndpointSlice 控制器</b>：</p>
<figure class="figure"><svg viewBox="0 0 680 300" class="fg" style="width:100%;max-width:680px" role="img" aria-label="Service 的選擇器 app=web 挑出三個 Pod，第四個標籤不符；EndpointSlice 列出三個 Pod 的 IP，其中一個標成未就緒；每台節點的 kube-proxy 只把流量送給就緒的">
<rect x="14" y="118" width="160" height="64" rx="8" class="fg-b hot"/><text x="94" y="143" text-anchor="middle" class="fg-t acc">Service web</text><text x="94" y="164" text-anchor="middle" class="fg-t sm mono">selector: app=web</text>
<text x="94" y="206" text-anchor="middle" class="fg-t sm">用選擇器挑 Pod</text>
<rect x="230" y="40" width="190" height="40" rx="6" class="fg-b"/><text x="242" y="65" class="fg-t sm mono">web-a</text><text x="296" y="65" class="fg-t sm mono">app=web</text><text x="408" y="65" text-anchor="end" class="fg-t sm acc">就緒</text>
<rect x="230" y="90" width="190" height="40" rx="6" class="fg-b"/><text x="242" y="115" class="fg-t sm mono">web-b</text><text x="296" y="115" class="fg-t sm mono">app=web</text><text x="408" y="115" text-anchor="end" class="fg-t sm acc">就緒</text>
<rect x="230" y="140" width="190" height="40" rx="6" class="fg-b warm dash"/><text x="242" y="165" class="fg-t sm mono">web-c</text><text x="296" y="165" class="fg-t sm mono">app=web</text><text x="408" y="165" text-anchor="end" class="fg-t sm warm">未就緒</text>
<rect x="230" y="190" width="190" height="40" rx="6" class="fg-b dash"/><text x="242" y="215" class="fg-t sm mono">dbg-x</text><text x="296" y="215" class="fg-t sm mono">app=dbg</text><text x="408" y="215" text-anchor="end" class="fg-t sm">不符</text>
<line x1="174" y1="150" x2="230" y2="60" class="fg-l on"/>
<line x1="174" y1="150" x2="230" y2="110" class="fg-l on"/>
<line x1="174" y1="150" x2="230" y2="160" class="fg-l on"/>
<line x1="174" y1="150" x2="230" y2="210" class="fg-l dim dash"/>
<rect x="476" y="24" width="190" height="196" rx="8" class="fg-b alt"/>
<text x="571" y="46" text-anchor="middle" class="fg-t alt">EndpointSlice</text><text x="571" y="64" text-anchor="middle" class="fg-t sm mono">web-k3x9p</text>
<rect x="488" y="74" width="166" height="32" rx="4" class="fg-b"/><text x="496" y="95" class="fg-t sm mono">10.244.1.7</text><text x="646" y="95" text-anchor="end" class="fg-t sm acc">就緒</text>
<rect x="488" y="114" width="166" height="32" rx="4" class="fg-b"/><text x="496" y="135" class="fg-t sm mono">10.244.2.5</text><text x="646" y="135" text-anchor="end" class="fg-t sm acc">就緒</text>
<rect x="488" y="154" width="166" height="32" rx="4" class="fg-b warm"/><text x="496" y="175" class="fg-t sm mono">10.244.3.9</text><text x="646" y="175" text-anchor="end" class="fg-t sm warm">未就緒</text>
<path d="M420 60 H454 V90 H480" class="fg-l"/><polygon points="488,90 480,85.5 480,94.5" class="fg-a"/>
<path d="M420 110 H454 V130 H480" class="fg-l"/><polygon points="488,130 480,125.5 480,134.5" class="fg-a"/>
<path d="M420 160 H454 V170 H480" class="fg-l"/><polygon points="488,170 480,165.5 480,174.5" class="fg-a"/>
<rect x="476" y="250" width="190" height="40" rx="8" class="fg-b"/><text x="571" y="275" text-anchor="middle" class="fg-t sm">每台節點的 kube-proxy</text>
<line x1="571" y1="220" x2="571" y2="242" class="fg-l on"/><polygon points="571,250 566.5,242 575.5,242" class="fg-a on"/>
<text x="563" y="240" text-anchor="end" class="fg-t sm acc">只送給就緒的</text>
</svg><figcaption>Service 只寫「我要哪些標籤」。EndpointSlice 控制器把符合的 Pod 和它們的就緒狀態整理成名單，kube-proxy 再照名單寫規則。未就緒的 Pod 還在名單上，只是被標記起來，不會收到新連線。</figcaption></figure>
<pre><code>$ kubectl get endpointslice -n hilo -l kubernetes.io/service-name=web -o yaml   # 節錄
endpoints:
- addresses: ["10.244.1.7"]
  conditions: { ready: true, serving: true, terminating: false }
  nodeName: node-d
- addresses: ["10.244.3.9"]
  conditions: { ready: false, serving: false, terminating: false }
ports:
- port: 8080
  protocol: TCP</code></pre>
<p>為什麼叫「切片」？舊的 Endpoints 物件把一個 Service 的所有位址放在同一個物件裡。一個有 5,000 個 Pod 的 Service，任何一個 Pod 換掉，整個大物件就要重寫一次、再推給每一台節點。EndpointSlice 把名單切成每片最多 100 個（預設），一個 Pod 變動只要更新它所在的那一片。舊的 Endpoints API 在 1.33 已被標為棄用。</p>
<h4>標籤的三個實戰用法</h4>
<ul>
<li><b>把生病的 Pod 隔離出來，而不是砍掉。</b><code>kubectl label pod hilo-api-7d9f8c6b5-x2k4q app=quarantine --overwrite</code>。它的標籤不再符合選擇器：ReplicaSet 發現少了一個，馬上補一個新的；Service 不再送流量給它；而這個出問題的 Pod 還活著，讓你慢慢 <code>exec</code> 進去調查。</li>
<li><b>選擇器寫太寬會吃到別人。</b>兩個不同的 Deployment 都標 <code>app: web</code>，Service 就會把流量平均送給兩邊。金絲雀發布刻意這樣用；不小心這樣寫，就是半夜的謎題。</li>
<li><b>用標準標籤。</b><code>app.kubernetes.io/name</code>、<code>/instance</code>、<code>/version</code>、<code>/component</code>、<code>/part-of</code> 是官方建議的一組，工具和儀表板都認得。另外，Deployment 的 <code>selector</code> 建立後就不能改，一開始就要想好。</li>
</ul>
<p><b>註解</b>（annotation）長得跟標籤很像，但不能拿來選擇，用途是給工具看的附加資訊：建置版本、負責人、Ingress 控制器的特殊設定。值可以很長；標籤的值則最多 63 個字元。</p>

<h3><span class="badge lv2">進階</span>五、Service 的四種類型</h3>
<figure class="figure"><svg viewBox="0 0 680 290" class="fg" style="width:100%;max-width:680px" role="img" aria-label="Service 類型一層包一層：LoadBalancer 包含 NodePort，NodePort 包含 ClusterIP；下方的 headless Service 沒有虛擬 IP，DNS 直接回 Pod IP">
<path d="M128 52 V44 H562 V52" class="fg-l warm"/><text x="345" y="36" text-anchor="middle" class="fg-t sm mono warm">type: LoadBalancer</text>
<path d="M280 78 V70 H562 V78" class="fg-l alt"/><text x="421" y="62" text-anchor="middle" class="fg-t sm mono alt">type: NodePort</text>
<path d="M442 104 V96 H562 V104" class="fg-l on"/><text x="502" y="88" text-anchor="middle" class="fg-t sm mono acc">type: ClusterIP</text>
<rect x="10" y="130" width="96" height="50" rx="8" class="fg-b"/><text x="58" y="160" text-anchor="middle" class="fg-t">外部使用者</text>
<rect x="128" y="130" width="130" height="50" rx="8" class="fg-b warm"/><text x="193" y="151" text-anchor="middle" class="fg-t">雲端負載平衡器</text><text x="193" y="169" text-anchor="middle" class="fg-t sm">公開 IP</text>
<rect x="280" y="130" width="140" height="50" rx="8" class="fg-b alt"/><text x="350" y="151" text-anchor="middle" class="fg-t">任一節點</text><text x="350" y="169" text-anchor="middle" class="fg-t sm mono">:31080</text>
<rect x="442" y="130" width="120" height="50" rx="8" class="fg-b hot"/><text x="502" y="151" text-anchor="middle" class="fg-t">ClusterIP</text><text x="502" y="169" text-anchor="middle" class="fg-t sm mono">10.96.12.34:80</text>
<rect x="596" y="110" width="74" height="24" rx="4" class="fg-b"/><text x="633" y="127" text-anchor="middle" class="fg-t sm">Pod</text>
<rect x="596" y="143" width="74" height="24" rx="4" class="fg-b"/><text x="633" y="160" text-anchor="middle" class="fg-t sm">Pod</text>
<rect x="596" y="176" width="74" height="24" rx="4" class="fg-b"/><text x="633" y="193" text-anchor="middle" class="fg-t sm">Pod</text>
<line x1="106" y1="155" x2="120" y2="155" class="fg-l"/><polygon points="128,155 120,150.5 120,159.5" class="fg-a"/>
<line x1="258" y1="155" x2="272" y2="155" class="fg-l"/><polygon points="280,155 272,150.5 272,159.5" class="fg-a"/>
<line x1="420" y1="155" x2="434" y2="155" class="fg-l"/><polygon points="442,155 434,150.5 434,159.5" class="fg-a"/>
<line x1="562" y1="155" x2="578" y2="155" class="fg-l"/><line x1="578" y1="122" x2="578" y2="188" class="fg-l"/>
<line x1="578" y1="122" x2="588" y2="122" class="fg-l"/><polygon points="596,122 588,117.5 588,126.5" class="fg-a"/>
<line x1="578" y1="155" x2="588" y2="155" class="fg-l"/><polygon points="596,155 588,150.5 588,159.5" class="fg-a"/>
<line x1="578" y1="188" x2="588" y2="188" class="fg-l"/><polygon points="596,188 588,183.5 588,192.5" class="fg-a"/>
<text x="10" y="226" class="fg-t sm acc">headless：clusterIP: None</text>
<rect x="128" y="236" width="130" height="44" rx="8" class="fg-b"/><text x="193" y="263" text-anchor="middle" class="fg-t">用戶端 Pod</text>
<rect x="280" y="236" width="140" height="44" rx="8" class="fg-b"/><text x="350" y="255" text-anchor="middle" class="fg-t">DNS 查詢</text><text x="350" y="272" text-anchor="middle" class="fg-t sm">回 3 個 Pod IP</text>
<rect x="442" y="236" width="228" height="44" rx="8" class="fg-b hot"/><text x="556" y="255" text-anchor="middle" class="fg-t">自己挑一個 Pod 直接連</text><text x="556" y="272" text-anchor="middle" class="fg-t sm">沒有虛擬 IP，也沒有 NAT</text>
<line x1="258" y1="258" x2="272" y2="258" class="fg-l"/><polygon points="280,258 272,253.5 272,262.5" class="fg-a"/>
<line x1="420" y1="258" x2="434" y2="258" class="fg-l"/><polygon points="442,258 434,253.5 434,262.5" class="fg-a"/>
</svg><figcaption>上面三種是一層包一層：開 LoadBalancer 會順便給你 NodePort 和 ClusterIP，開 NodePort 會順便給你 ClusterIP。headless 是另一條路：不要虛擬 IP，把選擇權交給用戶端。</figcaption></figure>
<ul>
<li><b>ClusterIP</b>（預設）：從叢集專用的位址段拿一個虛擬 IP，配一個 DNS 名字 <code>web.hilo.svc.cluster.local</code>，只有叢集裡面連得到。<code>port</code> 是 Service 對外的連接埠，<code>targetPort</code> 是容器裡真的在聽的連接埠，兩者可以不同；targetPort 也可以寫容器連接埠的<b>名字</b>，以後程式改聽別的號碼，Service 不用跟著改。</li>
<li><b>NodePort</b>：在<b>每一台</b>節點上開同一個連接埠（預設範圍 30000 到 32767），連到任何一台都會被轉到後端。預設的 <code>externalTrafficPolicy: Cluster</code> 可能把封包轉到另一台節點上的 Pod，為了讓回程走得回來，會把來源位址改掉，Pod 看到的就不是使用者的真實 IP。改成 <code>Local</code> 就只有「本機有 Pod」的節點會回應，保留真實 IP，代價是流量可能分得不平均。</li>
<li><b>LoadBalancer</b>：請雲端（透過 cloud-controller-manager）真的開一台負載平衡器，指向各節點的 NodePort，或在部分實作裡直接指向 Pod IP。<b>每一個 LoadBalancer Service 就是一台要付月費的負載平衡器</b>，這是為什麼大家用一個 Ingress 或 Gateway 擋在前面，讓幾十個服務共用一台。</li>
<li><b>headless</b>（<code>clusterIP: None</code>）：不配虛擬 IP，DNS 直接回所有就緒 Pod 的 IP。兩個主要用途：StatefulSet 讓每個 Pod 有固定的名字，例如 <code>db-0.db.hilo.svc.cluster.local</code>；以及讓用戶端自己做負載平衡。</li>
</ul>
<div class="warn"><b>gRPC 和長連線的陷阱。</b>ClusterIP 是「每條<b>連線</b>挑一次後端」，不是每個請求。gRPC、WebSocket、資料庫連線池這類一條連線用很久的，一開始連上哪個 Pod 就一直是它。擴展到 10 個 Pod，舊的連線還是黏在原本那 3 個上，新的 7 個閒著。解法是用 headless Service 讓用戶端自己分散請求、在前面放一個看得懂 HTTP/2 的代理（或服務網格），或讓伺服器定期關閉太老的連線，逼用戶端重新連。</div>
<p>還有一種 <b>ExternalName</b>，它只是在叢集的 DNS 裡放一筆 CNAME，指到外部的主機名稱，常用來讓程式用同一個內部名字連外部的資料庫。</p>

<h3><span class="badge lv3">專業</span>六、Ingress 與 Gateway API</h3>
<p><b>Ingress</b> 描述「哪個主機名稱、哪個路徑，送到哪個 Service」，通常也在這裡終結 TLS：</p>
<pre><code>apiVersion: networking.k8s.io/v1
kind: Ingress
metadata: { name: hilo, namespace: hilo }
spec:
  ingressClassName: traefik
  tls: [{ hosts: [hilo.example.com], secretName: hilo-tls }]
  rules:
  - host: hilo.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend: { service: { name: hilo-api, port: { number: 80 } } }</code></pre>
<p>它自己什麼都不做，要有一個 <b>Ingress 控制器</b>（Traefik、HAProxy、雲端業者的實作）去讀它、設定真正的代理。Ingress 的問題在於規格太小：權重分流、改寫網址、依標頭路由、逾時這些實際一定會用到的功能，全部靠<b>各家控制器自己的註解</b>，換一個控制器就要重寫。而且一個物件同時混著「基礎設施」（TLS 憑證、對外的連接埠）和「應用」（路徑），誰能改哪一部分很難分。過去最常用的社群版 ingress-nginx 已經宣布退休，新專案不要再選它。</p>
<p><b>Gateway API</b>（2023 年 GA）把同一件事拆成三種物件，各自交給不同角色：</p>
<figure class="figure"><svg viewBox="0 0 660 280" class="fg" style="width:100%;max-width:660px" role="img" aria-label="Gateway API 的三層：平台團隊管 GatewayClass，叢集維運管 Gateway，應用開發者管 HTTPRoute；HTTPRoute 依權重把 90% 和 10% 的流量分給兩個 Service">
<text x="14" y="50" class="fg-t">平台／雲端業者</text>
<text x="14" y="135" class="fg-t">叢集維運團隊</text>
<text x="14" y="225" class="fg-t">應用開發者</text>
<rect x="180" y="22" width="230" height="46" rx="8" class="fg-b"/><text x="295" y="41" text-anchor="middle" class="fg-t mono">GatewayClass</text><text x="295" y="59" text-anchor="middle" class="fg-t sm">用哪一套實作</text>
<rect x="180" y="104" width="230" height="52" rx="8" class="fg-b alt"/><text x="295" y="126" text-anchor="middle" class="fg-t">Gateway：public</text><text x="295" y="145" text-anchor="middle" class="fg-t sm">聽 443、掛 TLS 憑證</text>
<rect x="180" y="194" width="230" height="52" rx="8" class="fg-b hot"/><text x="295" y="216" text-anchor="middle" class="fg-t acc">HTTPRoute：hilo</text><text x="295" y="235" text-anchor="middle" class="fg-t sm">/api 分給兩個版本</text>
<line x1="295" y1="194" x2="295" y2="164" class="fg-l"/><polygon points="295,156 290.5,164 299.5,164" class="fg-a"/><text x="303" y="180" class="fg-t sm mono">parentRefs</text>
<line x1="295" y1="104" x2="295" y2="76" class="fg-l"/><polygon points="295,68 290.5,76 299.5,76" class="fg-a"/><text x="303" y="92" class="fg-t sm mono">gatewayClassName</text>
<rect x="470" y="176" width="170" height="36" rx="6" class="fg-b"/><text x="555" y="199" text-anchor="middle" class="fg-t mono">hilo-v1</text>
<rect x="470" y="226" width="170" height="36" rx="6" class="fg-b"/><text x="555" y="249" text-anchor="middle" class="fg-t mono">hilo-v2</text>
<path d="M410 212 H436 V194 H462" class="fg-l on"/><polygon points="470,194 462,189.5 462,198.5" class="fg-a on"/><text x="449" y="186" text-anchor="middle" class="fg-t sm acc">90%</text>
<path d="M410 228 H436 V244 H462" class="fg-l warm"/><polygon points="470,244 462,239.5 462,248.5" class="fg-a warm"/><text x="449" y="262" text-anchor="middle" class="fg-t sm warm">10%</text>
</svg><figcaption>每一層由不同的人負責：平台決定用哪套實作，維運決定開哪些連接埠和憑證，應用團隊在自己的命名空間裡寫路由，不必碰到別人的設定。</figcaption></figure>
<pre><code>apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata: { name: hilo, namespace: hilo }
spec:
  parentRefs: [{ name: public, namespace: infra }]
  hostnames: ["hilo.example.com"]
  rules:
  - matches: [{ path: { type: PathPrefix, value: /api } }]
    backendRefs:
    - { name: hilo-v1, port: 80, weight: 90 }
    - { name: hilo-v2, port: 80, weight: 10 }</code></pre>
<p>注意三件事：權重分流（金絲雀發布）是規格內建的，不是某家的註解；HTTPRoute 在 <code>hilo</code> 命名空間，掛到 <code>infra</code> 命名空間的 Gateway 上，跨命名空間要 Gateway 那邊用 <code>allowedRoutes</code> 明確允許；除了 HTTP，也有 GRPCRoute 等其他路由種類。Envoy Gateway、Istio、Cilium、Traefik、NGINX Gateway Fabric 和主要雲端業者都有實作。新專案直接從 Gateway API 開始。</p>

<h3><span class="badge lv3">專業</span>七、ConfigMap 與 Secret：為什麼 Secret 預設不是祕密</h3>
<h4>兩種用法，更新行為完全不同</h4>
<ul>
<li><b>當環境變數</b>（<code>envFrom</code>、<code>valueFrom</code>）：容器<b>啟動那一刻</b>讀一次，之後 ConfigMap 怎麼改，跑著的容器都看不到。</li>
<li><b>掛成檔案</b>：kubelet 會定期同步，改了之後通常一兩分鐘內，檔案內容會被換掉（用符號連結一次切換，不會讀到寫一半的檔）。但用 <code>subPath</code> 掛的單一檔案<b>永遠不會更新</b>。</li>
</ul>
<p>不管哪一種，改 ConfigMap 都<b>不會</b>觸發滾動更新，因為 Pod 範本沒變。常見的做法是讓設定有版本：ConfigMap 取名 <code>hilo-config-v3</code>，改設定就建一個 <code>v4</code>、把 Deployment 指過去。這樣範本變了，會正常滾動更新，回復上一版也會連設定一起回去。Kustomize 的 configMapGenerator、Helm 圖表裡把設定的雜湊值放進註解，都是同一個想法。ConfigMap 和 Secret 單一個最多 1 MiB，設成 <code>immutable: true</code> 還能減輕 API server 的 watch 負擔。</p>
<h4>Base64 不是加密</h4>
<pre><code>$ kubectl create secret generic db --from-literal=password='s3cret!'
$ kubectl get secret db -o jsonpath='{.data.password}'
czNjcmV0IQ==
$ kubectl get secret db -o jsonpath='{.data.password}' | base64 -d
s3cret!</code></pre>
<p>Base64 只是換一種寫法，讓任意位元組能放進 JSON，任何人都能一行解回來。Secret 和 ConfigMap 真正的差別，在於 Kubernetes 對 Secret 多做了一些<b>處理</b>：可以另外加密存放、在節點上放在記憶體裡的 tmpfs、權限可以分開設定。但這些多半要你自己打開。看看一個 Secret 一路經過哪些地方：</p>
<figure class="figure"><svg viewBox="0 26 680 248" class="fg" style="width:100%;max-width:680px" role="img" aria-label="Secret 的旅程：從你或 CI 送進 API server，存進 etcd，再由 kubelet 取得、掛進 Pod；每一站下方用橘字標出誰讀得到它">
<rect x="10" y="40" width="130" height="56" rx="8" class="fg-b"/><text x="75" y="63" text-anchor="middle" class="fg-t">你或 CI</text><text x="75" y="82" text-anchor="middle" class="fg-t sm mono">kubectl apply</text>
<rect x="170" y="40" width="130" height="56" rx="8" class="fg-b hot"/><text x="235" y="63" text-anchor="middle" class="fg-t acc">API server</text><text x="235" y="82" text-anchor="middle" class="fg-t sm">HTTPS 傳輸</text>
<rect x="360" y="40" width="130" height="56" rx="8" class="fg-b"/><text x="425" y="63" text-anchor="middle" class="fg-t mono">kubelet</text><text x="425" y="82" text-anchor="middle" class="fg-t sm">放在 tmpfs</text>
<rect x="540" y="40" width="130" height="56" rx="8" class="fg-b"/><text x="605" y="63" text-anchor="middle" class="fg-t">Pod</text><text x="605" y="82" text-anchor="middle" class="fg-t sm">檔案或環境變數</text>
<rect x="170" y="170" width="130" height="56" rx="8" class="fg-b warm"/><text x="235" y="193" text-anchor="middle" class="fg-t">etcd</text><text x="235" y="212" text-anchor="middle" class="fg-t sm">預設：Base64 明文</text>
<rect x="330" y="170" width="200" height="56" rx="8" class="fg-b alt dash"/><text x="430" y="193" text-anchor="middle" class="fg-t">開了靜態加密</text><text x="430" y="212" text-anchor="middle" class="fg-t sm">etcd 裡才是密文</text>
<line x1="300" y1="198" x2="330" y2="198" class="fg-l dash"/>
<line x1="140" y1="68" x2="162" y2="68" class="fg-l"/><polygon points="170,68 162,63.5 162,72.5" class="fg-a"/>
<line x1="300" y1="68" x2="352" y2="68" class="fg-l"/><polygon points="360,68 352,63.5 352,72.5" class="fg-a"/><text x="330" y="60" text-anchor="middle" class="fg-t sm">來拿</text>
<line x1="490" y1="68" x2="532" y2="68" class="fg-l"/><polygon points="540,68 532,63.5 532,72.5" class="fg-a"/><text x="515" y="60" text-anchor="middle" class="fg-t sm">掛進去</text>
<line x1="205" y1="104" x2="205" y2="162" class="fg-l"/><polygon points="205,96 200.5,104 209.5,104" class="fg-a"/><polygon points="205,170 200.5,162 209.5,162" class="fg-a"/>
<text x="75" y="120" text-anchor="middle" class="fg-t sm warm">commit 進 git 就外洩</text>
<text x="215" y="124" class="fg-t sm warm">有 get、list</text>
<text x="215" y="140" class="fg-t sm warm">secrets 權限的人</text>
<text x="425" y="120" text-anchor="middle" class="fg-t sm warm">節點上的 root</text>
<text x="605" y="120" text-anchor="middle" class="fg-t sm warm">能在同一命名空間</text>
<text x="605" y="136" text-anchor="middle" class="fg-t sm warm">建 Pod 的人</text>
<text x="235" y="246" text-anchor="middle" class="fg-t sm warm">能讀 etcd 或備份的人</text>
<text x="340" y="266" text-anchor="middle" class="fg-t sm">橘字：在這一站讀得到這個值的人</text>
</svg><figcaption>Kubernetes 只保證傳輸過程走 HTTPS。存在 etcd 裡是不是密文、誰能讀、節點上怎麼放，都要你自己設定。</figcaption></figure>
<ol>
<li><b>etcd 裡預設是明文。</b>能讀 etcd 的人，或拿到 etcd 備份檔的人，就能讀到所有 Secret。打開 API server 的靜態加密（EncryptionConfiguration，正式環境用 KMS 交給雲端的金鑰服務管金鑰）之後，新寫入的才會加密；舊的要全部重寫一次。代管叢集多半在儲存層已經加密，但這不改變後面三點。</li>
<li><b>RBAC 的 list 就等於讀全部。</b>對 secrets 有 <code>list</code> 權限，拿到的是完整內容，不只是名字。</li>
<li><b>能建 Pod 就能讀 Secret。</b>在一個命名空間裡能建立 Pod 的人，可以寫一個 Pod 把同一命名空間的任何 Secret 掛進去再印出來。所以「誰能部署」要跟「誰能讀機密」一起考慮，敏感的東西放在獨立的命名空間。</li>
<li><b>到了節點和容器裡。</b>節點上的 root 讀得到；變成環境變數之後，也會出現在 <code>/proc/PID/environ</code>（第 1.9 課）、出現在不小心印出全部環境變數的錯誤報告裡。能掛成檔案就不要用環境變數。</li>
</ol>
<p>實務上的組合：把真正的值放在雲端的機密管理服務或 Vault，用 External Secrets Operator 同步進叢集，或用 Secrets Store CSI driver 直接掛進 Pod；要放進 git 走 GitOps 的，用 Sealed Secrets 或 SOPS 先加密。能用短期憑證的地方（例如讓 Pod 用自己的雲端身分），就不要放長期的密碼。第 5.4 課會把機密管理整套展開。</p>

<h3><span class="badge lv3">專業</span>八、Namespace：資料夾，不是保險箱</h3>
<p>Namespace 讓名字只需要在自己的範圍內唯一，也是 DNS 的一段：同一個命名空間裡用 <code>web</code> 就連得到，跨命名空間寫 <code>web.hilo</code>，完整名字是 <code>web.hilo.svc.cluster.local</code>。這套縮寫是靠 Pod 裡的 DNS 設定做到的，而它藏著一個效能陷阱：</p>
<pre><code>$ kubectl exec -n hilo hilo-api-7d9f8c6b5-x2k4q -- cat /etc/resolv.conf
search hilo.svc.cluster.local svc.cluster.local cluster.local
nameserver 10.96.0.10
options ndots:5</code></pre>
<p><code>ndots:5</code> 的意思是：名字裡的點少於 5 個，就先當成「短名字」，依序接上三個 search 網域去查。你的程式連 <code>api.example.com</code>（只有 2 個點），實際上會先查 <code>api.example.com.hilo.svc.cluster.local</code>、<code>…svc.cluster.local</code>、<code>…cluster.local</code>，三個都查不到才查真正的名字，而且 IPv4、IPv6 各查一次。一次連線變成最多 8 個 DNS 查詢，外部 API 呼叫一多，CoreDNS 的負載和延遲都看得出來。解法：程式裡寫完整名稱加一個結尾的點（<code>api.example.com.</code>），或在 Pod 的 <code>dnsConfig</code> 把 ndots 調成 2，或在程式裡快取 DNS 結果。</p>
<h4>它管得到和管不到的</h4>
<ul>
<li><b>不屬於任何命名空間的物件</b>：節點、PersistentVolume、StorageClass、ClusterRole、CRD、GatewayClass，以及 Namespace 本身。<code>kubectl api-resources --namespaced=false</code> 列得出來。</li>
<li><b>它本身不是安全邊界。</b>預設情況下不同命名空間的 Pod 可以互相連線；權限要靠每個命名空間的 RoleBinding；資源要靠 ResourceQuota 和 LimitRange；Pod 的安全等級要靠命名空間上的標籤。這些疊在一起才是「軟性隔離」（第 2.7 課）。</li>
<li><b>刪掉命名空間會刪掉裡面的一切</b>，不能復原。它有時會卡在 Terminating：除了 finalizer，常見原因是某個擴充 API（例如 metrics-server）掛了，命名空間控制器沒辦法列出所有種類的物件，就不敢宣告「清乾淨了」。</li>
</ul>
<p>預設的四個：<code>default</code>（沒指定時用的）、<code>kube-system</code>（叢集自己的元件）、<code>kube-public</code>（所有人可讀，很少用）、<code>kube-node-lease</code>（上一章的節點心跳）。</p>

<h3><span class="badge lv4">專家</span>九、拆開 ClusterIP：封包怎麼送到 Pod</h3>
<p>先講一個讓很多人困惑的事實：ClusterIP <code>10.96.12.34</code> 這個位址，<b>沒有任何一張網卡擁有它，也沒有任何程式在上面聆聽</b>。在常見的 iptables 模式下，你 <code>ping</code> 它多半沒有回應，<code>curl</code> 它卻通。因為它只是寫在每一台節點核心裡的一條規則：「目的地是這個位址的封包，改寫成某個 Pod 的位址」。</p>
<figure class="figure"><svg viewBox="0 0 680 300" class="fg" style="width:100%;max-width:680px" role="img" aria-label="封包從用戶端 Pod 送往 ClusterIP，在節點核心的 netfilter 規則裡依序比對 KUBE-SERVICES、KUBE-SVC，再以 1/3、1/2、1 的機率挑一條 DNAT 規則，改寫成三個後端 Pod 之一">
<rect x="10" y="118" width="130" height="60" rx="8" class="fg-b"/><text x="75" y="142" text-anchor="middle" class="fg-t">用戶端 Pod</text><text x="75" y="162" text-anchor="middle" class="fg-t sm mono">→ 10.96.12.34:80</text>
<rect x="160" y="14" width="346" height="272" rx="10" class="fg-b"/>
<text x="176" y="36" class="fg-t">這台節點的核心（netfilter）</text>
<rect x="180" y="50" width="310" height="36" rx="6" class="fg-b"/><text x="192" y="73" class="fg-t sm mono">KUBE-SERVICES：目的地是 10.96.12.34:80？</text>
<rect x="180" y="104" width="310" height="36" rx="6" class="fg-b alt"/><text x="192" y="127" class="fg-t sm mono">KUBE-SVC-…：三個裡挑一個</text>
<rect x="200" y="158" width="290" height="30" rx="6" class="fg-b"/><text x="210" y="178" class="fg-t sm mono">機率 1/3 → DNAT 10.244.2.5:8080</text>
<rect x="200" y="198" width="290" height="30" rx="6" class="fg-b"/><text x="210" y="218" class="fg-t sm mono">剩下的 1/2 → DNAT 10.244.3.9:8080</text>
<rect x="200" y="238" width="290" height="30" rx="6" class="fg-b"/><text x="210" y="258" class="fg-t sm mono">剩下全部 → DNAT 10.244.1.12:8080</text>
<path d="M140 148 H168 V68 H172" class="fg-l on"/><polygon points="180,68 172,63.5 172,72.5" class="fg-a on"/>
<line x1="335" y1="86" x2="335" y2="96" class="fg-l"/><polygon points="335,104 330.5,96 339.5,96" class="fg-a"/>
<line x1="190" y1="140" x2="190" y2="253" class="fg-l"/>
<line x1="190" y1="173" x2="192" y2="173" class="fg-l"/><polygon points="200,173 192,168.5 192,177.5" class="fg-a"/>
<line x1="190" y1="213" x2="192" y2="213" class="fg-l"/><polygon points="200,213 192,208.5 192,217.5" class="fg-a"/>
<line x1="190" y1="253" x2="192" y2="253" class="fg-l"/><polygon points="200,253 192,248.5 192,257.5" class="fg-a"/>
<text x="600" y="146" text-anchor="middle" class="fg-t sm">後端 Pod</text>
<rect x="530" y="158" width="140" height="30" rx="6" class="fg-b hot"/><text x="600" y="178" text-anchor="middle" class="fg-t sm mono">10.244.2.5:8080</text>
<rect x="530" y="198" width="140" height="30" rx="6" class="fg-b hot"/><text x="600" y="218" text-anchor="middle" class="fg-t sm mono">10.244.3.9:8080</text>
<rect x="530" y="238" width="140" height="30" rx="6" class="fg-b hot"/><text x="600" y="258" text-anchor="middle" class="fg-t sm mono">10.244.1.12:8080</text>
<line x1="490" y1="173" x2="522" y2="173" class="fg-l"/><polygon points="530,173 522,168.5 522,177.5" class="fg-a"/>
<line x1="490" y1="213" x2="522" y2="213" class="fg-l"/><polygon points="530,213 522,208.5 522,217.5" class="fg-a"/>
<line x1="490" y1="253" x2="522" y2="253" class="fg-l"/><polygon points="530,253 522,248.5 522,257.5" class="fg-a"/>
<text x="600" y="290" text-anchor="middle" class="fg-t sm acc">conntrack 記住這條連線</text>
</svg><figcaption>規則由上往下比：第一條以 1/3 的機率中，沒中的再以 1/2 的機率中第二條，剩下的全進第三條，三個後端各分到 1/3。改寫發生在發送端這台節點，封包離開時目的地已經是真的 Pod IP。</figcaption></figure>
<p>kube-proxy 在每一台節點上 watch Service 和 EndpointSlice，把上面那張圖寫成真的規則。在節點上可以直接看（簡化過）：</p>
<pre><code>$ sudo iptables-save -t nat | grep -E 'KUBE-SVC-ABCD|KUBE-SEP-1111'
-A KUBE-SERVICES -d 10.96.12.34/32 -p tcp --dport 80 -j KUBE-SVC-ABCD
-A KUBE-SVC-ABCD -m statistic --mode random --probability 0.33333 -j KUBE-SEP-1111
-A KUBE-SVC-ABCD -m statistic --mode random --probability 0.50000 -j KUBE-SEP-2222
-A KUBE-SVC-ABCD -j KUBE-SEP-3333
-A KUBE-SEP-1111 -p tcp -j DNAT --to-destination 10.244.2.5:8080</code></pre>
<p>為什麼是 1/3、1/2、1？因為規則是一條一條比：第一條中的機率 1/3；沒中（2/3）再以 1/2 中第二條，也是 1/3；剩下的 1/3 全進第三條。連線的第一個封包決定了去哪裡之後，核心的連線追蹤表（<b>conntrack</b>）會記住這條連線的改寫，之後的封包和回程都直接照表走，不再重新抽籤。</p>
<h4>這個設計帶來的四個後果</h4>
<ol>
<li><b>以連線為單位分配</b>：就是第五節 gRPC 陷阱的根源。抽籤只發生在新連線的第一個封包。</li>
<li><b>規模的天花板</b>：iptables 的規則是一條一條比的清單，叢集有上萬個 Service 時，規則有幾萬條，每次有變動還要整張表重寫，更新可能要好幾秒。<b>IPVS</b> 模式改用雜湊表；更新的 <b>nftables</b> 模式（1.33 起正式 GA）用查表的方式取代逐條比對，兩者都能撐更大的規模。</li>
<li><b>conntrack 表會滿</b>：短連線非常多的節點，可能在 <code>dmesg</code> 看到「nf_conntrack: table full, dropping packet」，新連線被直接丟掉。這時要調大 <code>nf_conntrack_max</code>，或減少短連線（用連線池、keep-alive）。</li>
<li><b>Pod 下線的那一刻</b>：Pod 進入終止流程，EndpointSlice 把它標成不就緒，kube-proxy 不再把<b>新</b>連線送給它；已經建立的連線照舊。所以第 1.9 課和下一課講的優雅關機，才能讓它把手上的請求做完。</li>
</ol>
<h4>eBPF：在 connect() 那一刻就換掉目的地</h4>
<p>Cilium 這類以 eBPF 為基礎的網路外掛，可以完全取代 kube-proxy。它把小程式掛在核心的 socket 層：Pod 呼叫 <code>connect()</code> 連到 ClusterIP 的那一刻，就直接把目的地換成某個後端 Pod 的 IP。之後的每個封包從一開始就是送往真正的 Pod，叢集內部的流量不需要逐封包 NAT，查找用的是雜湊表。NodePort 和外部流量則在網卡驅動層附近處理。附帶的好處是可觀測性：每一條連線從哪個 Pod 到哪個 Pod，都能被記錄下來。</p>

<h3><span class="badge lv4">專家</span>十、一份完整的小應用，一行一行讀</h3>
<p>把整章用到的東西放進同一個檔案：猜高低遊戲的 API，三份副本，從外面用 <code>hilo.example.com/api</code> 進來。</p>
<pre><code>apiVersion: v1
kind: Namespace
metadata:
  name: hilo
  labels:
    pod-security.kubernetes.io/enforce: restricted     # ①
---
apiVersion: v1
kind: ConfigMap
metadata: { name: hilo-config-v3, namespace: hilo }    # ②
immutable: true
data:
  LOG_LEVEL: info
  MAX_ROUNDS: "10"                                      # ③
---
apiVersion: v1
kind: Secret
metadata: { name: hilo-db, namespace: hilo }
type: Opaque
stringData:                                             # ④
  DATABASE_URL: postgres://hilo:CHANGE_ME@db.internal:5432/hilo
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hilo-api
  namespace: hilo
  labels: { app.kubernetes.io/name: hilo-api }
spec:
  replicas: 3
  revisionHistoryLimit: 5
  selector:
    matchLabels: { app.kubernetes.io/name: hilo-api }   # ⑤
  strategy:
    rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }   # ⑥
  template:
    metadata:
      labels: { app.kubernetes.io/name: hilo-api }
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 10001
        seccompProfile: { type: RuntimeDefault }        # ⑦
      containers:
      - name: api
        image: registry.example.com/hilo-api:1.8.2@sha256:…   # ⑧
        ports: [{ name: http, containerPort: 8080 }]
        envFrom:
        - configMapRef: { name: hilo-config-v3 }
        - secretRef: { name: hilo-db }                  # ⑨
        resources:
          requests: { cpu: 250m, memory: 256Mi }
          limits: { memory: 512Mi }
        readinessProbe:
          httpGet: { path: /ready, port: http }
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities: { drop: ["ALL"] }               # ⑩
        volumeMounts: [{ name: tmp, mountPath: /tmp }]
      volumes: [{ name: tmp, emptyDir: {} }]
---
apiVersion: v1
kind: Service
metadata: { name: hilo-api, namespace: hilo }
spec:
  selector: { app.kubernetes.io/name: hilo-api }
  ports: [{ name: http, port: 80, targetPort: http }]   # ⑪
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata: { name: hilo-api, namespace: hilo }
spec:
  parentRefs: [{ name: public, namespace: infra }]
  hostnames: ["hilo.example.com"]
  rules:
  - matches: [{ path: { type: PathPrefix, value: /api } }]
    backendRefs: [{ name: hilo-api, port: 80 }]        # ⑫</code></pre>
<ol>
<li><b>命名空間上的標籤</b>讓 Pod Security 用最嚴格的 restricted 等級檢查這裡的每一個 Pod。下面的 Deployment 如果少寫了 ⑦ 或 ⑩ 任何一項，會在准入那一關就被擋下。</li>
<li><b>設定帶版本號</b>，再加上 <code>immutable</code>。要改設定就建 v4、改 Deployment 的引用，滾動更新和回復都會連設定一起處理。</li>
<li>ConfigMap 的值一定是字串，所以數字要加引號，程式自己轉型。</li>
<li><b>stringData</b> 讓你寫明文，API server 會替你轉成 Base64 存進 data。這一段<b>不應該</b>真的放進 git：實務上這個物件由 External Secrets 之類的工具產生，這裡只是讓你看到形狀。</li>
<li><b>選擇器和範本的標籤必須一致</b>，而且選擇器建立後不能改。</li>
<li><b>先多開一個再關舊的</b>，容量永遠不少於 3 份。</li>
<li><b>Pod 層級的安全設定</b>：必須以非 root 執行，用數字的使用者 ID（上一章說過，名字無法被驗證），套上執行環境預設的 seccomp 設定檔。</li>
<li><b>標籤加摘要</b>：標籤給人看，摘要保證內容。CI 產生這一行，部署的就是測試過的那一份。</li>
<li>兩種設定一起變成環境變數。比較敏感的值，可以改成掛成檔案（第七節第 4 點）。</li>
<li><b>容器層級的鎖</b>：不准提權、根目錄唯讀、拿掉所有 capabilities。因為根目錄唯讀，程式要寫暫存檔的 <code>/tmp</code> 另外掛一個 emptyDir。</li>
<li><b>targetPort 用名字</b>：程式哪天改聽 9000，只要改容器的 <code>containerPort</code>，Service 不用動。</li>
<li><b>路由掛在維運團隊管的 Gateway 上</b>，應用團隊只寫自己的路徑；TLS 憑證和 443 號連接埠都不是它要煩惱的事。</li>
</ol>
<p>上線前兩個好用的指令：<code>kubectl apply --dry-run=server -f hilo.yaml</code> 會讓 API server 把認證、授權、准入和驗證全部跑一遍（包括 Pod Security 的檢查），只是最後不寫入；<code>kubectl diff -f hilo.yaml</code> 列出這次 apply 會改動哪些欄位。上線後用 <code>kubectl -n hilo get deploy,rs,pods,svc,endpointslices</code> 一次看完整條鏈。</p>

<h3>十一、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>Pod 會在節點之間搬家</td><td>Pod 一輩子只屬於一台節點。所謂「搬家」是控制器在別台建了一個新名字、新 IP 的 Pod。</td></tr>
<tr><td>CrashLoopBackOff 是一種 Pod 狀態</td><td>它是容器等待中的原因：反覆啟動又結束，重啟間隔越拉越長。Pod 的階段通常還是 Running。</td></tr>
<tr><td>改了 ConfigMap，Pod 就會用新設定</td><td>環境變數永遠不會變，掛成檔案的會慢慢更新，但程式不一定會重新讀。滾動更新不會被觸發。</td></tr>
<tr><td>Service 會平均分配每一個請求</td><td>它分配的是連線。長連線會一直黏在同一個 Pod 上。</td></tr>
<tr><td>ClusterIP ping 不通，代表 Service 壞了</td><td>iptables 模式下它本來就只轉送特定連接埠的 TCP／UDP，不回 ping。用 <code>curl</code> 或 <code>nc</code> 測。</td></tr>
<tr><td>Secret 是加密的</td><td>預設只是 Base64。能 list secrets、能在同一命名空間建 Pod、能讀 etcd 的人都讀得到。</td></tr>
<tr><td>不同命名空間之間是隔離的</td><td>預設網路全通。隔離要靠 NetworkPolicy、RBAC、配額一起疊。</td></tr>
</table>

<h3>十二、跟你的工作連起來</h3>
<ul>
<li><b>Node.js、Go 後端</b>：程式聽 <code>0.0.0.0</code>、提供 <code>/ready</code>、處理 SIGTERM；設定一律從環境變數或檔案讀，同一個映像檔才能用在每個環境。用 gRPC 或 WebSocket 的服務，記得 ClusterIP 是以連線分配的。</li>
<li><b>即時對戰的遊戲伺服器</b>：WebSocket 會黏在 Pod 上，擴展後新的 Pod 不會自動分到舊連線；縮減時要先讓 Pod 不就緒、通知玩家重連，再關閉。</li>
<li><b>前端</b>：Vue 或 Cocos 的網頁版建置成靜態檔，放在一個小的網頁伺服器 Pod 裡，用 HTTPRoute 把 <code>/</code> 指給它、<code>/api</code> 指給後端，兩邊共用同一個網域，就沒有跨來源（CORS）的問題。</li>
<li><b>從 Docker Compose 搬過來</b>：Compose 的 service 名字對應到 Kubernetes 的 Service 名字，程式裡的 <code>http://api:8080</code> 幾乎不用改；<code>ports:</code> 對應到 Service，<code>environment:</code> 和 <code>.env</code> 拆成 ConfigMap 和 Secret。</li>
</ul>

<h3>十三、面試會怎麼問</h3>
<p>下面是 Kubernetes 相關職缺很常見的題目。先自己出聲講一遍，再打開參考答案。</p>
<ol>
<li>「Pod、ReplicaSet、Deployment 之間是什麼關係？滾動更新時它們各自在做什麼？」</li>
<li>「Service 的類型有哪些？各自適合什麼情況？」</li>
<li>「一個請求送到 ClusterIP，是怎麼到達某個 Pod 的？kube-proxy 和 eBPF 的做法差在哪？」</li>
<li>「Ingress 和 Gateway API 差在哪裡？為什麼要換？」</li>
<li>「Kubernetes 的 Secret 安全嗎？你會怎麼保護它？」</li>
<li>「服務擴展到 10 個 Pod，監控卻顯示流量都集中在其中 3 個。可能是什麼原因？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>Deployment 管 ReplicaSet，每個 Pod 範本版本對應一個 ReplicaSet，ReplicaSet 依選擇器和 pod-template-hash 標籤維持 Pod 數量。改了範本，Deployment 建立新的 ReplicaSet，依 maxSurge 和 maxUnavailable 逐步調高新的、調低舊的，期間總數不超過 replicas 加 maxSurge、就緒數不少於 replicas 減 maxUnavailable。舊的 ReplicaSet 保留著，rollout undo 就是把它調回來。進度超過 progressDeadlineSeconds 只會標記失敗，不會自動回復。</li>
<li>ClusterIP 是預設，叢集內部用的虛擬 IP 加 DNS 名字；NodePort 在每台節點開 30000 到 32767 之間的連接埠，可搭配 externalTrafficPolicy 選擇是否保留來源 IP；LoadBalancer 請雲端開一台負載平衡器，每個 Service 一台，成本高，通常只給入口用；headless（clusterIP: None）不配虛擬 IP，DNS 直接回 Pod IP，用在 StatefulSet 的固定名字和用戶端自己做負載平衡；另有 ExternalName 做 DNS 別名。</li>
<li>kube-proxy watch Service 和 EndpointSlice，在每台節點寫入 netfilter 規則（iptables、IPVS 或 nftables）。Pod 送往 ClusterIP 的封包在發送端節點被比對，隨機挑一個就緒的後端做 DNAT，conntrack 記住這條連線，之後的封包和回程照表處理，所以是以連線為單位分配。iptables 規則逐條比對、整表重寫，規模大時慢。eBPF（例如 Cilium）在 socket 層於 connect() 時就把目的地換成 Pod IP，不需要逐封包 NAT，查找用雜湊表，規模和效能都更好，還附帶連線層級的可觀測性。</li>
<li>Ingress 只定義主機名稱和路徑到 Service 的對應與 TLS，其他功能（權重、改寫、標頭比對、逾時）靠各控制器自己的註解，不可攜，而且一個物件混著基礎設施和應用的設定。Gateway API 拆成 GatewayClass、Gateway、HTTPRoute 等物件，分別由平台、維運、應用團隊負責，權重分流、標頭比對、跨命名空間掛載都是規格的一部分，還支援 gRPC 等其他協定，換實作時設定可以沿用。</li>
<li>預設不安全：值只是 Base64，etcd 預設明文，有 list secrets 權限或能在該命名空間建立 Pod 的人都讀得到，節點 root 也讀得到。保護方式：開啟 etcd 靜態加密並用 KMS 管金鑰；RBAC 嚴格限制 get、list、watch secrets；敏感服務放獨立命名空間並限制誰能部署；優先掛成檔案而非環境變數；真正的值放在 Vault 或雲端機密管理服務，用 External Secrets 或 CSI driver 帶進來；git 裡只放加密後的版本；能用短期身分憑證就不要用長期密碼。</li>
<li>最常見的原因是長連線：gRPC、WebSocket、HTTP keep-alive 或資料庫連線池在擴展前就建立好了，而 ClusterIP 只在新連線時挑後端，舊連線一直黏在原本的 3 個 Pod 上。解法：用 headless Service 讓用戶端自己做負載平衡、在前面放懂 HTTP/2 的 L7 代理或服務網格、或讓伺服器定期關閉存活太久的連線。其他可能：新 Pod 的就緒探針沒過所以不在 EndpointSlice 裡、externalTrafficPolicy: Local 搭配不平均的節點分布、或 sessionAffinity 設成 ClientIP。</li>
</ol>
</details>

<h3>十四、練功題（做得出來才算真的懂）</h3>
<ol>
<li>replicas 是 10，maxSurge 和 maxUnavailable 都用預設的 25%。滾動更新期間，最多同時有幾個 Pod？至少要有幾個就緒？</li>
<li>一個 Service 有 4 個後端，用 iptables 模式。寫出 KUBE-SVC 這條鏈裡四條規則的機率，並驗算每個後端各分到多少。</li>
<li>在 Killercoda 建立上一課的 web Deployment 和 Service，把其中一個 Pod 的標籤改掉（<code>kubectl label pod … app=quarantine --overwrite</code>）。接著觀察 Pod 數量和 EndpointSlice 有什麼變化，並解釋原因。</li>
<li>一個 Pod 用 <code>envFrom</code> 讀 ConfigMap，另一個 Pod 把同一個 ConfigMap 掛成檔案。你改了 ConfigMap 的一個值，兩個 Pod 各會看到什麼？怎麼讓它們都用到新值？</li>
<li>Pod 裡的程式呼叫 <code>https://api.payment-provider.com</code> 很慢，CoreDNS 的查詢量也很大。看了 <code>/etc/resolv.conf</code> 之後，你推測原因是什麼？提出兩種修法。</li>
<li>小明說：「我們的 Secret 很安全，因為團隊裡只有我有 get secrets 的權限。」但團隊每個人都能在同一個命名空間 <code>kubectl apply</code> Deployment。這個說法哪裡有問題？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>maxSurge 25% 的 10 是 2.5，無條件進位成 3，所以最多 13 個；maxUnavailable 25% 是 2.5，無條件捨去成 2，所以至少要有 8 個就緒。</li>
<li>依序是 1/4、1/3、1/2、1（最後一條無條件）。驗算：第一個 1/4；第二個 (3/4)×(1/3) = 1/4；第三個 (3/4)×(2/3)×(1/2) = 1/4；第四個 (3/4)×(2/3)×(1/2)×1 = 1/4。每個各 1/4。</li>
<li>Pod 總數會多一個：那個被改標籤的 Pod 不再符合 ReplicaSet 的選擇器，ReplicaSet 認為少了一個就補一個新的，而舊的那個不再被任何控制器管理，會一直留著。EndpointSlice 裡它的 IP 會消失，換成新 Pod 的 IP，因為 Service 的選擇器也不再選到它。調查完要自己把它刪掉。</li>
<li>用 envFrom 的 Pod 看到的永遠是舊值，環境變數只在容器啟動時讀一次；掛成檔案的 Pod 通常一兩分鐘內檔案會被更新，但程式要自己重新讀檔才會生效（用 subPath 掛的則永遠不會更新）。要讓兩者都可靠地用到新值，最好的做法是改用新版本名稱的 ConfigMap 並更新 Deployment 的引用，觸發滾動更新；或在 Pod 範本加上設定內容的雜湊值註解，也可以 <code>kubectl rollout restart</code>。</li>
<li>ndots:5 加上三個 search 網域：<code>api.payment-provider.com</code> 只有 2 個點，會先依序嘗試接上 hilo.svc.cluster.local、svc.cluster.local、cluster.local 查詢，而且 A 和 AAAA 各查一次，一次連線最多產生 8 個查詢，前面 6 個都注定失敗。修法：在程式裡用結尾帶點的完整名稱 <code>api.payment-provider.com.</code>；在 Pod 的 dnsConfig 把 ndots 調成 2；或在應用程式裡快取 DNS 結果、重用連線。</li>
<li>能在命名空間裡建立 Deployment，就能寫一個 Pod 把任何 Secret 掛成環境變數或檔案，再印到日誌或直接 exec 進去讀。RBAC 上沒有 get secrets 權限擋不住這條路。真正的保護要把敏感 Secret 放在只有少數人能部署的命名空間、用准入政策限制 Pod 能掛哪些 Secret，或改由外部機密服務依工作負載身分發放。</li>
</ol>
</details>

<h3>十五、想再挖深</h3>
<ul>
<li><b>Kubernetes 官方文件〈Concepts〉</b>（<a href="https://kubernetes.io/docs/concepts/">kubernetes.io/docs/concepts</a>）：Workloads、Services, Load Balancing and Networking、Configuration 三大節，就是這一章的完整版；〈Good practices for Kubernetes Secrets〉一頁特別值得讀。</li>
<li><b>Gateway API 官方網站</b>（<a href="https://gateway-api.sigs.k8s.io/">gateway-api.sigs.k8s.io</a>）：角色設計的理由、各家實作的支援程度，以及從 Ingress 遷移的指南。</li>
<li><b>Cilium 文件〈Kubernetes Without kube-proxy〉</b>（docs.cilium.io）：eBPF 怎麼取代 kube-proxy，連 socket 層負載平衡的細節都有。</li>
<li><b>Marko Lukša《Kubernetes in Action》</b>（Manning）：從 Pod 一路講到 Service、Deployment 的經典教科書，圖很多、例子很實際。</li>
</ul>
` });
