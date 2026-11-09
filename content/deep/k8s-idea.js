DEEP({ 'k8s-idea': `
<p>上一課用恆溫器講了 Kubernetes 唯一的核心觀念，又列了一排元件的名字。這一章把每個元件打開來看：控制迴圈寫成程式長什麼樣子、為什麼所有人都只能跟 API server 說話、一個請求進 API server 要過哪幾關、etcd 怎麼用 Raft 讓三台機器對同一件事意見一致、排程器怎麼替 Pod 挑機器、kubelet 怎麼把 Pod 變成真的容器。接著把它們串起來，一步一步看 <code>kubectl apply</code> 之後到底發生了什麼。最後談控制平面該自己架還是交給雲端，以及幾個很少人注意到的角落。上一章拆開的 containerd、runc 和 cgroup，在這裡會變成最底下那一層。</p>

<h3><span class="badge lv1">基礎</span>一、控制迴圈：把恆溫器寫成程式</h3>
<p>換一個比恆溫器更貼近生活的比喻：便利商店的補貨。店長在貨架上貼一張單子：「可樂 12 瓶」。補貨員每次巡到這一格，就數一數現在有幾瓶，少幾瓶補幾瓶。他完全不在乎可樂是被買走、被偷走還是摔破了，他只看<b>現在差多少</b>。</p>
<p>Kubernetes 裡每一個「控制器」（controller）都是這樣一個補貨員。寫成程式大概是這個樣子：</p>
<pre><code>for {
    want := deployment.Spec.Replicas      // 單子上寫的：3
    have := 數一數標籤符合、還活著的 Pod   // 貨架上的：2
    switch {
    case have &lt; want:
        建立 (want - have) 個 Pod
    case have &gt; want:
        刪掉 (have - want) 個 Pod
    }
    等下一個事件，或定時再檢查一次
}</code></pre>
<figure class="figure"><svg viewBox="0 16 640 222" class="fg" style="width:100%;max-width:640px" role="img" aria-label="控制迴圈四個步驟：觀察現況、和期望比較、做一小步、世界改變，然後再回到觀察">
<rect x="30" y="30" width="210" height="52" rx="8" class="fg-b alt"/><text x="135" y="52" text-anchor="middle" class="fg-t">① 觀察現況</text><text x="135" y="71" text-anchor="middle" class="fg-t sm">watch：現在有 2 個 Pod</text>
<rect x="400" y="30" width="210" height="52" rx="8" class="fg-b"/><text x="505" y="52" text-anchor="middle" class="fg-t">② 比較</text><text x="505" y="71" text-anchor="middle" class="fg-t sm">想要 3、看到 2，差 1</text>
<rect x="400" y="170" width="210" height="52" rx="8" class="fg-b hot"/><text x="505" y="192" text-anchor="middle" class="fg-t acc">③ 做一小步</text><text x="505" y="211" text-anchor="middle" class="fg-t sm">建立 1 個 Pod</text>
<rect x="30" y="170" width="210" height="52" rx="8" class="fg-b"/><text x="135" y="192" text-anchor="middle" class="fg-t">④ 世界改變了</text><text x="135" y="211" text-anchor="middle" class="fg-t sm">現在有 3 個</text>
<line x1="240" y1="56" x2="392" y2="56" class="fg-l"/><polygon points="400,56 392,51.5 392,60.5" class="fg-a"/>
<line x1="505" y1="82" x2="505" y2="162" class="fg-l"/><polygon points="505,170 500.5,162 509.5,162" class="fg-a"/>
<line x1="400" y1="196" x2="248" y2="196" class="fg-l"/><polygon points="240,196 248,191.5 248,200.5" class="fg-a"/>
<line x1="135" y1="170" x2="135" y2="90" class="fg-l"/><polygon points="135,82 130.5,90 139.5,90" class="fg-a"/>
<text x="320" y="118" text-anchor="middle" class="fg-t lg">一直轉，不會停</text>
<text x="320" y="140" text-anchor="middle" class="fg-t sm">漏掉一個事件也沒關係</text>
<text x="320" y="158" text-anchor="middle" class="fg-t sm">下一圈還是會看到差距</text>
</svg><figcaption>你只改「想要什麼」（spec），從來不直接下「建立一個 Pod」的命令。迴圈自己會發現差距，自己補上。</figcaption></figure>
<p>這個寫法有三個特性，它們就是 Kubernetes 能自我修復的原因：</p>
<ol>
<li><b>看狀態，不看事件</b>（level-triggered）。控制器比的是「現在的樣子」和「想要的樣子」，不是「剛剛發生了什麼」。控制器當機重啟、網路斷了漏掉十個事件，都沒關係，下一圈一比就知道差多少。反過來，如果它是「收到一個刪除事件就補一個」，漏掉一個事件就永遠少一個。</li>
<li><b>做幾次都一樣</b>（idempotent）。同一圈跑兩次，第二次會發現沒有差距，什麼都不做。</li>
<li><b>每個控制器只管一件小事，彼此不直接溝通。</b>Deployment 控制器只負責建 ReplicaSet，ReplicaSet 控制器只負責建 Pod，排程器只負責替 Pod 挑節點，kubelet 只負責把分給自己的 Pod 跑起來。它們之間唯一的溝通方式，是在 API server 裡讀寫物件。這像一條由很多個恆溫器串起來的鏈子。</li>
</ol>
<p>每個物件因此都分成兩半：<code>spec</code> 是你寫的「想要什麼」，<code>status</code> 是控制器寫的「觀察到什麼」。你改了 spec，物件的 <code>metadata.generation</code> 會加 1；控制器處理完，就把 <code>status.observedGeneration</code> 更新成同一個數字。<code>kubectl rollout status</code> 就是靠比對這兩個數字，才知道「控制器已經看到你的修改了」。</p>

<h3><span class="badge lv1">基礎</span>二、全景圖：大家只跟 API server 說話</h3>
<figure class="figure"><svg viewBox="0 0 680 340" class="fg" style="width:100%;max-width:680px" role="img" aria-label="Kubernetes 的元件圖：kubectl、排程器、控制器、每個節點的 kubelet 都只連到 API server，只有 API server 讀寫 etcd">
<rect x="14" y="66" width="120" height="40" rx="6" class="fg-b"/><text x="74" y="91" text-anchor="middle" class="fg-t mono">kubectl</text>
<rect x="160" y="10" width="506" height="172" rx="10" class="fg-b"/>
<text x="176" y="34" class="fg-t lg">控制平面</text>
<rect x="300" y="56" width="150" height="50" rx="8" class="fg-b hot"/><text x="375" y="78" text-anchor="middle" class="fg-t acc">API server</text><text x="375" y="96" text-anchor="middle" class="fg-t sm">唯一的一扇門</text>
<rect x="320" y="128" width="110" height="40" rx="6" class="fg-b warm"/><text x="375" y="153" text-anchor="middle" class="fg-t">etcd</text>
<line x1="375" y1="114" x2="375" y2="120" class="fg-l"/><polygon points="375,106 370.5,114 379.5,114" class="fg-a"/><polygon points="375,128 370.5,120 379.5,120" class="fg-a"/>
<rect x="510" y="44" width="140" height="40" rx="6" class="fg-b"/><text x="580" y="69" text-anchor="middle" class="fg-t">排程器</text>
<rect x="510" y="112" width="140" height="48" rx="6" class="fg-b"/><text x="580" y="132" text-anchor="middle" class="fg-t">控制器們</text><text x="580" y="150" text-anchor="middle" class="fg-t sm">controller-manager</text>
<line x1="510" y1="70" x2="458" y2="70" class="fg-l"/><polygon points="450,70 458,65.5 458,74.5" class="fg-a"/><text x="484" y="62" text-anchor="middle" class="fg-t sm">watch</text>
<path d="M510 136 H480 V94 H458" class="fg-l"/><polygon points="450,94 458,89.5 458,98.5" class="fg-a"/><text x="495" y="152" text-anchor="middle" class="fg-t sm">寫回</text>
<line x1="134" y1="86" x2="292" y2="86" class="fg-l"/><polygon points="300,86 292,81.5 292,90.5" class="fg-a"/><text x="213" y="78" text-anchor="middle" class="fg-t sm">HTTPS</text>
<rect x="14" y="206" width="316" height="124" rx="10" class="fg-b"/>
<text x="316" y="228" text-anchor="end" class="fg-t">節點 node-1</text>
<rect x="28" y="240" width="130" height="36" rx="6" class="fg-b alt"/><text x="93" y="263" text-anchor="middle" class="fg-t mono">kubelet</text>
<rect x="172" y="240" width="144" height="36" rx="6" class="fg-b"/><text x="244" y="263" text-anchor="middle" class="fg-t mono">kube-proxy</text>
<rect x="28" y="284" width="130" height="36" rx="6" class="fg-b"/><text x="93" y="307" text-anchor="middle" class="fg-t mono">containerd</text>
<rect x="178" y="290" width="40" height="24" rx="4" class="fg-b hot"/><text x="198" y="306" text-anchor="middle" class="fg-t sm">Pod</text>
<rect x="224" y="290" width="40" height="24" rx="4" class="fg-b hot"/><text x="244" y="306" text-anchor="middle" class="fg-t sm">Pod</text>
<rect x="270" y="290" width="40" height="24" rx="4" class="fg-b hot"/><text x="290" y="306" text-anchor="middle" class="fg-t sm">Pod</text>
<rect x="350" y="206" width="316" height="124" rx="10" class="fg-b"/>
<text x="652" y="228" text-anchor="end" class="fg-t">節點 node-2</text>
<rect x="364" y="240" width="130" height="36" rx="6" class="fg-b alt"/><text x="429" y="263" text-anchor="middle" class="fg-t mono">kubelet</text>
<rect x="508" y="240" width="144" height="36" rx="6" class="fg-b"/><text x="580" y="263" text-anchor="middle" class="fg-t mono">kube-proxy</text>
<rect x="364" y="284" width="130" height="36" rx="6" class="fg-b"/><text x="429" y="307" text-anchor="middle" class="fg-t mono">containerd</text>
<rect x="514" y="290" width="40" height="24" rx="4" class="fg-b hot"/><text x="534" y="306" text-anchor="middle" class="fg-t sm">Pod</text>
<rect x="560" y="290" width="40" height="24" rx="4" class="fg-b hot"/><text x="580" y="306" text-anchor="middle" class="fg-t sm">Pod</text>
<path d="M93 240 V194 H310 V114" class="fg-l alt"/><polygon points="310,106 305.5,114 314.5,114" class="fg-a alt"/>
<path d="M429 240 V194 H440 V114" class="fg-l alt"/><polygon points="440,106 435.5,114 444.5,114" class="fg-a alt"/>
<text x="302" y="150" text-anchor="end" class="fg-t sm alt">watch、回報狀態</text>
</svg><figcaption>所有箭頭都指向 API server。排程器、控制器、kubelet、kube-proxy 都是 API server 的「用戶端」，彼此之間沒有線；只有 API server 碰得到 etcd。</figcaption></figure>
<p>控制平面上有四個主角，節點上有三個：</p>
<ul>
<li><b>API server</b>（kube-apiserver）：唯一的一扇門。它本身沒有狀態，可以同時跑好幾份放在負載平衡器後面。</li>
<li><b>etcd</b>：唯一存狀態的地方。第四節細講。</li>
<li><b>排程器</b>（kube-scheduler）：替還沒有節點的 Pod 挑一台。第五節細講。</li>
<li><b>controller-manager</b>：幾十個控制器打包成一支程式，Deployment、ReplicaSet、Job、CronJob、節點生命週期、EndpointSlice、垃圾回收……都在裡面。雲端上還會多一個 <b>cloud-controller-manager</b>，負責跟雲端 API 打交道，例如替 LoadBalancer 類型的 Service 真的開一台負載平衡器。</li>
<li>節點上：<b>kubelet</b> 把 Pod 變成容器，<b>容器執行環境</b>（containerd）真的去跑，<b>kube-proxy</b> 把 Service 變成網路規則（下一章拆開）。</li>
</ul>
<p>為什麼堅持「只有一扇門」？第一，認證、授權、驗證、稽核日誌只要做在一個地方。第二，元件之間不需要認識彼此，所以你可以換掉排程器，也可以寫自己的控制器（就是第 2.7 課的 Operator），它們跟內建的控制器地位完全一樣。第三，etcd 只有 API server 拿得到它的憑證，保護起來簡單得多。</p>
<p>元件不是一直去問「有沒有新東西」，而是開一條長連線 <b>watch</b>，API server 有變化就推過來。客戶端程式庫（Go 的 client-go）還會在記憶體裡保留一份快取，叫 informer：啟動時先 list 一次全部，之後只收變化。控制器讀資料時讀的是自己的快取，不必每次都打 API server，這是一個上千台節點的叢集撐得住的關鍵。</p>

<h3><span class="badge lv2">進階</span>三、一個請求進 API server，要過幾關</h3>
<p>Kubernetes 的 API 就是普通的 HTTPS 加上 JSON。<code>kubectl</code> 加上 <code>-v=6</code> 就能看到它送出的每一個請求：</p>
<pre><code>$ kubectl apply -f web.yaml -v=6
… GET https://10.0.0.10:6443/apis/apps/v1/namespaces/default/deployments/web 404 Not Found in 12 milliseconds
… POST https://10.0.0.10:6443/apis/apps/v1/namespaces/default/deployments?fieldManager=kubectl-client-side-apply 201 Created in 25 milliseconds</code></pre>
<p>先 GET 看看有沒有，沒有（404）就 POST 建立（201）。網址的形狀永遠是 <code>/apis/群組/版本/namespaces/命名空間/資源種類/名字</code>，最核心的那一群（Pod、Service）走 <code>/api/v1</code>。這個 POST 進了 API server 之後，要依序通過這幾關：</p>
<figure class="figure"><svg viewBox="0 0 680 270" class="fg" style="width:100%;max-width:680px" role="img" aria-label="API server 處理請求的七個步驟：認證、授權、變更型准入、結構驗證、驗證型准入、寫入 etcd、通知 watch；認證失敗回 401、授權失敗回 403、准入失敗被拒絕">
<rect x="20" y="50" width="140" height="54" rx="8" class="fg-b"/><text x="90" y="72" text-anchor="middle" class="fg-t">kubectl apply</text><text x="90" y="91" text-anchor="middle" class="fg-t sm">POST Deployment</text>
<rect x="190" y="50" width="140" height="54" rx="8" class="fg-b"/><text x="260" y="72" text-anchor="middle" class="fg-t">① 認證 authn</text><text x="260" y="91" text-anchor="middle" class="fg-t sm">你是誰？憑證、token</text>
<rect x="360" y="50" width="140" height="54" rx="8" class="fg-b"/><text x="430" y="72" text-anchor="middle" class="fg-t">② 授權 authz</text><text x="430" y="91" text-anchor="middle" class="fg-t sm">RBAC：你能做嗎？</text>
<rect x="530" y="50" width="140" height="54" rx="8" class="fg-b"/><text x="600" y="72" text-anchor="middle" class="fg-t">③ 變更型准入</text><text x="600" y="91" text-anchor="middle" class="fg-t sm">補預設值、注入</text>
<rect x="530" y="170" width="140" height="54" rx="8" class="fg-b"/><text x="600" y="192" text-anchor="middle" class="fg-t">④ 結構驗證</text><text x="600" y="211" text-anchor="middle" class="fg-t sm">欄位和型別對不對</text>
<rect x="360" y="170" width="140" height="54" rx="8" class="fg-b"/><text x="430" y="192" text-anchor="middle" class="fg-t">⑤ 驗證型准入</text><text x="430" y="211" text-anchor="middle" class="fg-t sm">政策：准不准</text>
<rect x="190" y="170" width="140" height="54" rx="8" class="fg-b alt"/><text x="260" y="192" text-anchor="middle" class="fg-t">⑥ 寫進 etcd</text><text x="260" y="211" text-anchor="middle" class="fg-t sm">拿到 resourceVersion</text>
<rect x="20" y="170" width="140" height="54" rx="8" class="fg-b hot"/><text x="90" y="192" text-anchor="middle" class="fg-t acc">⑦ 通知 watch</text><text x="90" y="211" text-anchor="middle" class="fg-t sm">控制器們醒來</text>
<line x1="160" y1="77" x2="182" y2="77" class="fg-l"/><polygon points="190,77 182,72.5 182,81.5" class="fg-a"/>
<line x1="330" y1="77" x2="352" y2="77" class="fg-l"/><polygon points="360,77 352,72.5 352,81.5" class="fg-a"/>
<line x1="500" y1="77" x2="522" y2="77" class="fg-l"/><polygon points="530,77 522,72.5 522,81.5" class="fg-a"/>
<line x1="600" y1="104" x2="600" y2="162" class="fg-l"/><polygon points="600,170 595.5,162 604.5,162" class="fg-a"/>
<line x1="530" y1="197" x2="508" y2="197" class="fg-l"/><polygon points="500,197 508,192.5 508,201.5" class="fg-a"/>
<line x1="360" y1="197" x2="338" y2="197" class="fg-l"/><polygon points="330,197 338,192.5 338,201.5" class="fg-a"/>
<line x1="190" y1="197" x2="168" y2="197" class="fg-l on"/><polygon points="160,197 168,192.5 168,201.5" class="fg-a on"/>
<line x1="260" y1="50" x2="260" y2="34" class="fg-l warm"/><polygon points="260,26 255.5,34 264.5,34" class="fg-a warm"/><text x="270" y="30" class="fg-t sm warm">401</text>
<line x1="430" y1="50" x2="430" y2="34" class="fg-l warm"/><polygon points="430,26 425.5,34 434.5,34" class="fg-a warm"/><text x="440" y="30" class="fg-t sm warm">403</text>
<line x1="430" y1="224" x2="430" y2="244" class="fg-l warm"/><polygon points="430,252 425.5,244 434.5,244" class="fg-a warm"/><text x="440" y="252" class="fg-t sm warm">被拒絕，附上理由</text>
</svg><figcaption>前兩關問「你是誰、你能不能做」，中間三關問「這個東西本身可不可以」，通過了才寫進 etcd，寫進去之後才會有任何事情發生。</figcaption></figure>
<ol>
<li><b>認證</b>（authentication）：用戶端憑證（kubeconfig 裡那一段）、bearer token（Pod 用的 ServiceAccount token）、或公司的單一登入（OIDC）。認不出來就回 401。</li>
<li><b>授權</b>（authorization）：通常是 RBAC，問的是「這個人能不能對這個命名空間的這種資源做這個動作」。不行就回 403。自己查：<code>kubectl auth can-i create deployments -n shop</code>。</li>
<li><b>變更型准入</b>（mutating admission）：在物件存進去之前改它。例如沒寫 ServiceAccount 就補上 default、替 Pod 加上預設的容忍時間（第六節會用到），或由 webhook 注入額外的容器，服務網格的 sidecar 就是這樣被塞進每個 Pod 的。</li>
<li><b>結構驗證</b>：欄位名稱、型別、必填欄位對不對。</li>
<li><b>驗證型准入</b>（validating admission）：最後一道政策檢查。Pod Security 擋掉要求特權的 Pod、ResourceQuota 擋掉超出配額的請求、用 CEL 寫的 ValidatingAdmissionPolicy，或 Kyverno、OPA Gatekeeper 這類 webhook。被擋下時，錯誤訊息會寫明是哪一條規則。</li>
<li><b>寫進 etcd</b>，拿到一個 <code>resourceVersion</code>。</li>
<li><b>通知所有 watch 這種物件的人</b>。從這一刻起，控制器們才開始動作。</li>
</ol>
<h4>沒有鎖，靠版本號</h4>
<p>兩個人同時改同一個物件怎麼辦？每個物件都帶著 <code>resourceVersion</code>。更新時把你讀到的版本一起送回去，如果它在你讀完之後已經被別人改過，API server 會回 409 Conflict：「the object has been modified; please apply your changes to the latest version and try again」。控制器的對策很簡單：重新讀、重新算、再送一次。這叫<b>樂觀並行控制</b>（optimistic concurrency），整個系統裡沒有任何一把鎖。</p>
<div class="warn"><b>准入 webhook 是一個隱形的單點故障。</b>webhook 設成 <code>failurePolicy: Fail</code>，而它背後的服務剛好掛了，所有符合條件的請求都會被拒絕。最慘的情況是它攔的是「建立 Pod」，連修好它自己需要的 Pod 都建不起來。上線 webhook 前先想好：它掛了，叢集還能不能動？</div>

<h3><span class="badge lv2">進階</span>四、etcd 與 Raft：三台機器怎麼對一件事意見一致</h3>
<p>etcd 是一個鍵值資料庫，Kubernetes 的每個物件都是裡面的一筆，鍵長得像 <code>/registry/deployments/default/web</code>。它有兩個 Kubernetes 非用不可的特性：內建 watch，而且是<b>強一致</b>的：只要寫入成功，之後任何人讀到的都是新值。API server 回給你的 <code>resourceVersion</code>，其實就是 etcd 的修訂號（revision）。</p>
<p>難的是「強一致」加上「機器會壞」。只有一台，壞了叢集就失憶；放三台，又要怎麼保證三台意見一致？etcd 用的演算法叫 <b>Raft</b>，白話版只有三條規則：</p>
<ol>
<li><b>只有一個領導者</b>（leader），其他是跟隨者（follower）。所有寫入都交給領導者。</li>
<li><b>過半數寫好才算數。</b>領導者把新的一筆記到自己的日誌，同時送給跟隨者；只要<b>過半數</b>（包括它自己）都寫進了磁碟，這一筆就算<b>提交</b>（committed），可以回覆成功。</li>
<li><b>沒聽到領導者就選一個新的。</b>領導者定期發心跳（etcd 預設每 100 毫秒一次）。跟隨者等了一段隨機的時間（預設大約 1 秒）還沒聽到，就自己升為候選人、把任期（term）加一、拉票；拿到過半數的票就成為新的領導者。只有日誌至少跟自己一樣新的候選人才拿得到票，所以已經提交的資料永遠不會在換領導者時遺失。</li>
</ol>
<figure class="figure"><svg viewBox="0 0 660 260" class="fg" style="width:100%;max-width:660px" role="img" aria-label="Raft 寫入：API server 寫給領導者 etcd-1，領導者把第 42 筆複製給兩個跟隨者，etcd-2 回覆收到，etcd-3 斷線沒回應；三台裡有兩台寫好就提交並回覆成功">
<rect x="20" y="85" width="120" height="60" rx="8" class="fg-b"/><text x="80" y="110" text-anchor="middle" class="fg-t">API server</text><text x="80" y="130" text-anchor="middle" class="fg-t sm">要寫一筆</text>
<rect x="230" y="70" width="170" height="90" rx="8" class="fg-b hot"/>
<text x="315" y="92" text-anchor="middle" class="fg-t acc">etcd-1 領導者</text>
<rect x="246" y="104" width="38" height="24" rx="3" class="fg-b"/><text x="265" y="121" text-anchor="middle" class="fg-t sm mono">40</text>
<rect x="290" y="104" width="38" height="24" rx="3" class="fg-b"/><text x="309" y="121" text-anchor="middle" class="fg-t sm mono">41</text>
<rect x="334" y="104" width="38" height="24" rx="3" class="fg-b warm"/><text x="353" y="121" text-anchor="middle" class="fg-t sm mono">42</text>
<text x="315" y="148" text-anchor="middle" class="fg-t sm">任期 7</text>
<rect x="480" y="20" width="160" height="90" rx="8" class="fg-b"/>
<text x="560" y="42" text-anchor="middle" class="fg-t">etcd-2 跟隨者</text>
<rect x="494" y="54" width="38" height="24" rx="3" class="fg-b"/><text x="513" y="71" text-anchor="middle" class="fg-t sm mono">40</text>
<rect x="538" y="54" width="38" height="24" rx="3" class="fg-b"/><text x="557" y="71" text-anchor="middle" class="fg-t sm mono">41</text>
<rect x="582" y="54" width="38" height="24" rx="3" class="fg-b warm"/><text x="601" y="71" text-anchor="middle" class="fg-t sm mono">42</text>
<text x="560" y="98" text-anchor="middle" class="fg-t sm">已寫進磁碟</text>
<rect x="480" y="150" width="160" height="90" rx="8" class="fg-b dash"/>
<text x="560" y="172" text-anchor="middle" class="fg-t">etcd-3 斷線中</text>
<rect x="494" y="184" width="38" height="24" rx="3" class="fg-b"/><text x="513" y="201" text-anchor="middle" class="fg-t sm mono">40</text>
<rect x="538" y="184" width="38" height="24" rx="3" class="fg-b"/><text x="557" y="201" text-anchor="middle" class="fg-t sm mono">41</text>
<text x="560" y="228" text-anchor="middle" class="fg-t sm">還沒有 42</text>
<line x1="140" y1="105" x2="222" y2="105" class="fg-l"/><polygon points="230,105 222,100.5 222,109.5" class="fg-a"/><text x="185" y="97" text-anchor="middle" class="fg-t sm">① 寫入</text>
<line x1="400" y1="86" x2="472" y2="86" class="fg-l"/><polygon points="480,86 472,81.5 472,90.5" class="fg-a"/><text x="440" y="79" text-anchor="middle" class="fg-t sm">② #42</text>
<line x1="480" y1="102" x2="408" y2="102" class="fg-l on dash"/><polygon points="400,102 408,97.5 408,106.5" class="fg-a on"/><text x="440" y="120" text-anchor="middle" class="fg-t sm acc">③ 好了</text>
<line x1="400" y1="155" x2="472" y2="155" class="fg-l warm dash"/><polygon points="480,155 472,150.5 472,159.5" class="fg-a warm"/><text x="440" y="172" text-anchor="middle" class="fg-t sm warm">沒回應</text>
<line x1="230" y1="130" x2="148" y2="130" class="fg-l on dash"/><polygon points="140,130 148,125.5 148,134.5" class="fg-a on"/><text x="185" y="148" text-anchor="middle" class="fg-t sm acc">④ 成功</text>
<text x="315" y="184" text-anchor="middle" class="fg-t sm">三台裡兩台寫好 → 提交</text>
</svg><figcaption>etcd-3 斷線不影響寫入，因為 3 台裡有 2 台就過半了。等它回來，領導者會把它缺的那幾筆補給它。</figcaption></figure>
<p>「過半數」這條規則，決定了 etcd 為什麼要放奇數台：</p>
<table>
<tr><th>台數</th><th>過半要幾台</th><th>能壞幾台</th></tr>
<tr><td>1</td><td>1</td><td>0</td></tr>
<tr><td>3</td><td>2</td><td>1</td></tr>
<tr><td>4</td><td>3</td><td>1（跟 3 台一樣，卻多一台要同步）</td></tr>
<tr><td>5</td><td>3</td><td>2</td></tr>
</table>
<p>同一條規則也防止了<b>腦裂</b>（split brain）：網路把 3 台切成 1 台和 2 台，那 1 台就算以為自己還是領導者，也湊不到過半數，什麼都提交不了；2 台那邊會選出新的領導者繼續服務。壞掉超過一半時，etcd 會拒絕寫入，Kubernetes 就變成唯讀：正在跑的東西照跑，但什麼都改不了。</p>
<h4>維運 etcd 要知道的幾個數字</h4>
<ul>
<li><b>每一筆寫入都要等過半數的磁碟 fsync 完成</b>，所以 etcd 對磁碟延遲極度敏感。官方建議 WAL 的 fsync 在 99 百分位低於 10 毫秒，一定要用 SSD。成員跨地區放，每次寫入都要多付一趟跨區的來回。</li>
<li><b>單一請求預設上限約 1.5 MiB</b>，所以一個 ConfigMap 或 Secret 最多 1 MiB。<b>資料庫預設上限 2 GiB</b>（建議不要超過 8 GiB），超過會觸發 NOSPACE 警報、停止接受寫入。舊版本要定期壓實（compaction）和重整（defrag），代管服務會替你做。</li>
<li><b>Event 物件也存在 etcd 裡</b>，預設只留 1 小時，所以 <code>kubectl get events</code> 只看得到最近一小時。要長期保存，得另外收集。</li>
<li><b>備份</b>：<code>etcdctl snapshot save</code>。自己架的叢集，這是最重要的一個排程工作，而且一定要練習過還原。</li>
</ul>

<h3><span class="badge lv2">進階</span>五、排程器：先過濾，再打分</h3>
<p>排程器 watch 的是「<code>spec.nodeName</code> 還是空的 Pod」。對每一個這樣的 Pod，它分兩步：<b>過濾</b>（filter）刪掉放不下的節點，<b>打分</b>（score）替剩下的排名，挑最高分的；同分就隨機。最後它不是去叫節點做事，只是對 API server 寫一個 Binding，把 <code>nodeName</code> 填上。用真實的數字走一次：</p>
<figure class="figure"><svg viewBox="0 0 680 330" class="fg" style="width:100%;max-width:680px" role="img" aria-label="排程範例：新 Pod 要 500m CPU 和 1Gi 記憶體，五個節點中 node-a CPU 不夠、node-b 有 taint 被過濾掉，剩下三個依剩餘比例打分，node-d 得 50 分最高，被綁定">
<rect x="200" y="10" width="280" height="40" rx="8" class="fg-b hot"/><text x="340" y="35" text-anchor="middle" class="fg-t acc">新 Pod：CPU 500m、記憶體 1Gi</text>
<line x1="340" y1="50" x2="340" y2="62" class="fg-l"/><line x1="126" y1="62" x2="614" y2="62" class="fg-l"/>
<line x1="126" y1="62" x2="126" y2="72" class="fg-l"/><polygon points="126,80 121.5,72 130.5,72" class="fg-a"/>
<line x1="248" y1="62" x2="248" y2="72" class="fg-l"/><polygon points="248,80 243.5,72 252.5,72" class="fg-a"/>
<line x1="370" y1="62" x2="370" y2="72" class="fg-l"/><polygon points="370,80 365.5,72 374.5,72" class="fg-a"/>
<line x1="492" y1="62" x2="492" y2="72" class="fg-l"/><polygon points="492,80 487.5,72 496.5,72" class="fg-a"/>
<line x1="614" y1="62" x2="614" y2="72" class="fg-l"/><polygon points="614,80 609.5,72 618.5,72" class="fg-a"/>
<text x="10" y="118" class="fg-t sm">節點</text>
<text x="10" y="186" class="fg-t sm">過濾</text>
<text x="10" y="236" class="fg-t sm">打分</text>
<text x="10" y="300" class="fg-t sm">綁定</text>
<rect x="70" y="80" width="112" height="66" rx="6" class="fg-b"/><text x="126" y="100" text-anchor="middle" class="fg-t mono">node-a</text><text x="126" y="119" text-anchor="middle" class="fg-t sm">CPU 3.8／4</text><text x="126" y="137" text-anchor="middle" class="fg-t sm">記憶體 2／8 Gi</text>
<rect x="192" y="80" width="112" height="66" rx="6" class="fg-b"/><text x="248" y="100" text-anchor="middle" class="fg-t mono">node-b</text><text x="248" y="119" text-anchor="middle" class="fg-t sm">CPU 1／4</text><text x="248" y="137" text-anchor="middle" class="fg-t sm">taint：gpu</text>
<rect x="314" y="80" width="112" height="66" rx="6" class="fg-b"/><text x="370" y="100" text-anchor="middle" class="fg-t mono">node-c</text><text x="370" y="119" text-anchor="middle" class="fg-t sm">CPU 2.5／4</text><text x="370" y="137" text-anchor="middle" class="fg-t sm">記憶體 5／8 Gi</text>
<rect x="436" y="80" width="112" height="66" rx="6" class="fg-b"/><text x="492" y="100" text-anchor="middle" class="fg-t mono">node-d</text><text x="492" y="119" text-anchor="middle" class="fg-t sm">CPU 1.5／4</text><text x="492" y="137" text-anchor="middle" class="fg-t sm">記憶體 3／8 Gi</text>
<rect x="558" y="80" width="112" height="66" rx="6" class="fg-b"/><text x="614" y="100" text-anchor="middle" class="fg-t mono">node-e</text><text x="614" y="119" text-anchor="middle" class="fg-t sm">CPU 1／4</text><text x="614" y="137" text-anchor="middle" class="fg-t sm">記憶體 6／8 Gi</text>
<line x1="126" y1="146" x2="126" y2="158" class="fg-l"/><polygon points="126,166 121.5,158 130.5,158" class="fg-a"/>
<line x1="248" y1="146" x2="248" y2="158" class="fg-l"/><polygon points="248,166 243.5,158 252.5,158" class="fg-a"/>
<line x1="370" y1="146" x2="370" y2="158" class="fg-l"/><polygon points="370,166 365.5,158 374.5,158" class="fg-a"/>
<line x1="492" y1="146" x2="492" y2="158" class="fg-l"/><polygon points="492,166 487.5,158 496.5,158" class="fg-a"/>
<line x1="614" y1="146" x2="614" y2="158" class="fg-l"/><polygon points="614,166 609.5,158 618.5,158" class="fg-a"/>
<rect x="70" y="166" width="112" height="30" rx="6" class="fg-b warm"/><text x="126" y="186" text-anchor="middle" class="fg-t sm">CPU 不夠</text>
<rect x="192" y="166" width="112" height="30" rx="6" class="fg-b warm"/><text x="248" y="186" text-anchor="middle" class="fg-t sm">不容忍 taint</text>
<rect x="314" y="166" width="112" height="30" rx="6" class="fg-b"/><text x="370" y="186" text-anchor="middle" class="fg-t sm">通過</text>
<rect x="436" y="166" width="112" height="30" rx="6" class="fg-b"/><text x="492" y="186" text-anchor="middle" class="fg-t sm">通過</text>
<rect x="558" y="166" width="112" height="30" rx="6" class="fg-b"/><text x="614" y="186" text-anchor="middle" class="fg-t sm">通過</text>
<line x1="370" y1="196" x2="370" y2="208" class="fg-l"/><polygon points="370,216 365.5,208 374.5,208" class="fg-a"/>
<line x1="492" y1="196" x2="492" y2="208" class="fg-l"/><polygon points="492,216 487.5,208 496.5,208" class="fg-a"/>
<line x1="614" y1="196" x2="614" y2="208" class="fg-l"/><polygon points="614,216 609.5,208 618.5,208" class="fg-a"/>
<rect x="314" y="216" width="112" height="30" rx="6" class="fg-b"/><text x="370" y="236" text-anchor="middle" class="fg-t sm">25 分</text>
<rect x="436" y="216" width="112" height="30" rx="6" class="fg-b hot"/><text x="492" y="236" text-anchor="middle" class="fg-t sm acc">50 分</text>
<rect x="558" y="216" width="112" height="30" rx="6" class="fg-b"/><text x="614" y="236" text-anchor="middle" class="fg-t sm">約 37 分</text>
<line x1="492" y1="246" x2="492" y2="272" class="fg-l on"/><polygon points="492,280 487.5,272 496.5,272" class="fg-a on"/>
<rect x="412" y="280" width="160" height="36" rx="8" class="fg-b hot"/><text x="492" y="303" text-anchor="middle" class="fg-t acc">nodeName = node-d</text>
</svg><figcaption>節點上的數字是「已經被要求的量／可分配的量」，不是實際用量。分數只算了最常見的一項：放進去之後，CPU 和記憶體各剩幾成，取平均。</figcaption></figure>
<ul>
<li><b>node-a</b>：CPU 已被要求 3.8 顆，再加 0.5 是 4.3，超過 4 顆，過濾掉。</li>
<li><b>node-b</b>：有一個 <code>dedicated=gpu:NoSchedule</code> 的 taint（汙點），只有寫了對應 toleration（容忍）的 Pod 能放上去，過濾掉。</li>
<li><b>node-c</b>：放進去後 CPU 3.0／4、記憶體 6／8，各剩 25%，平均 25 分。</li>
<li><b>node-d</b>：放進去後 CPU 2.0／4、記憶體 4／8，各剩 50%，平均 50 分。最高，選它。</li>
<li><b>node-e</b>：CPU 剩 62.5%、記憶體只剩 12.5%，平均約 37 分。實際上還有一項 BalancedAllocation 會因為它「CPU 很空、記憶體很滿」而再扣分。</li>
</ul>
<p>過濾的條件還包括：<code>nodeSelector</code> 和節點親和性（affinity）、要用的連接埠是不是被佔了、要掛的磁碟在不在同一個可用區、拓撲分散規則（topology spread）。打分則還會看：節點上是不是已經有這個映像檔（省下拉映像檔的時間）、你寫的偏好、Pod 分散得夠不夠平均。各項分數加權相加。很大的叢集裡，排程器找到「夠多」能放的節點就停止過濾，不一定看完全部，以換取速度。</p>
<div class="note"><b>面試最愛問的一句：排程器看的是 requests，不是實際用量。</b>一台節點真實 CPU 用到 95%，只要 requests 加總還沒滿，排程器照樣往上放；反過來，沒寫 requests 的 Pod 對排程器來說是 0，會被一直疊在同一台上。「可分配量」（allocatable）是節點總量扣掉替系統和 kubelet 保留的部分，<code>kubectl describe node</code> 最下面的 Allocated resources 一節會列出 requests 已經用掉幾成。</div>
<p>放不下的 Pod 會停在 Pending，<code>kubectl describe pod</code> 的事件會把每一台的理由統計出來：</p>
<pre><code>Warning  FailedScheduling  default-scheduler  0/5 nodes are available:
  1 Insufficient cpu, 1 node(s) had untolerated taint {dedicated: gpu},
  3 Insufficient memory. preemption: …</code></pre>
<p>最後那段 preemption 是<b>搶占</b>：如果這個 Pod 的優先等級（PriorityClass）比較高，排程器可以趕走節點上優先等級較低的 Pod，騰出位置給它。</p>

<h3><span class="badge lv3">專業</span>六、kubelet 與 CRI：節點上的工頭</h3>
<p>kubelet 跑在每一台節點上，watch 的是「<code>nodeName</code> 是我的 Pod」。看到一個新的，它照順序做：</p>
<ol>
<li><b>收不收</b>：節點有沒有記憶體或磁碟壓力，資源夠不夠。</li>
<li><b>建沙盒</b>：透過 CRI 呼叫 <code>RunPodSandbox</code>。containerd 先跑一個極小的 <code>pause</code> 容器，它唯一的工作就是「握著」這個 Pod 的網路命名空間；接著呼叫 <b>CNI</b> 外掛，建好 veth、從這台節點的 Pod 網段配一個 IP、設好路由。</li>
<li><b>拉映像檔</b>：<code>PullImage</code>，依 <code>imagePullPolicy</code> 決定要不要重拉。</li>
<li><b>跑 init 容器</b>：一個接一個，每一個都必須成功結束，才輪到下一個。</li>
<li><b>建立並啟動應用容器</b>：<code>CreateContainer</code>、<code>StartContainer</code>，它們加入沙盒的網路命名空間，cgroup 上限照 <code>resources</code> 設好。上一章的 shim 和 runc 就在這一步上場。</li>
<li><b>探測和回報</b>：跑探針，把 Pod 的階段、每個容器的狀態、Pod IP 寫回 API server 的 <code>status</code>。</li>
</ol>
<p>刪除時倒過來：先跑 <code>preStop</code>，送 SIGTERM，等 <code>terminationGracePeriodSeconds</code>（預設 30 秒），還沒走就 SIGKILL，最後拆掉沙盒、收回 IP。在節點上除錯時，<code>crictl pods</code>、<code>crictl ps</code>、<code>crictl logs</code> 直接跟 containerd 說話，就算 API server 連不上也能用。</p>
<h4>節點自己也會自保</h4>
<p>kubelet 會盯著節點的資源：可用記憶體低於 100 MiB、根磁碟剩不到 10%、inode 剩不到 5% 這類門檻（預設值）一到，就開始<b>驅逐</b>（evict）Pod 自保；映像檔所在的磁碟用到 85% 時，先刪掉沒在用的映像檔。第 1.9 課的「磁碟滿了」在 Kubernetes 裡的樣子，就是一串 Evicted 的 Pod。</p>
<h4>靜態 Pod：雞生蛋的解法</h4>
<p>API server 自己也是一個 Pod，那是誰把它跑起來的？答案是 kubelet 會直接讀本機 <code>/etc/kubernetes/manifests/</code> 裡的 YAML，不經過 API server 就把它們跑起來，這叫<b>靜態 Pod</b>（static pod）。用 kubeadm 架的叢集，控制平面的四個元件全是這樣跑的。要改 API server 的參數，就是去改那個資料夾裡的檔案。</p>
<h4>一台節點斷電，Pod 多久會在別台出現？</h4>
<p>大多數人以為是「立刻」。實際上是這樣一串：kubelet 每 10 秒左右更新一次自己的 Lease（心跳）；節點生命週期控制器超過四、五十秒（預設值依版本略有不同）沒看到心跳，就把節點標成 NotReady／Unknown，並加上 <code>node.kubernetes.io/unreachable</code> 這個 taint；而每個 Pod 在准入時都被自動加上「容忍這個 taint 300 秒」。所以要再等 5 分鐘，Pod 才會被驅逐，ReplicaSet 才在別台補新的。<b>預設大約 5 到 6 分鐘。</b>這是故意的：網路抖一下就把所有 Pod 搬家，代價更大。對延遲很敏感的服務，可以在 Pod 上把 <code>tolerationSeconds</code> 調短，但更重要的是多放幾份副本，讓一台節點消失時剩下的撐得住。</p>

<h3><span class="badge lv3">專業</span>七、從 kubectl apply 到 Pod 跑起來，一步一步</h3>
<figure class="figure"><svg viewBox="0 0 700 536" class="fg" style="width:100%;max-width:700px" role="img" aria-label="循序圖：kubectl 寫入 Deployment，控制器建立 ReplicaSet 和 Pod，排程器綁定節點，kubelet 透過 containerd 建沙盒、拉映像檔、啟動容器，回報 Running 和 Ready，最後 EndpointSlice 被更新">
<rect x="10" y="10" width="100" height="40" rx="6" class="fg-b"/><text x="60" y="35" text-anchor="middle" class="fg-t mono">kubectl</text>
<rect x="125" y="10" width="100" height="40" rx="6" class="fg-b hot"/><text x="175" y="28" text-anchor="middle" class="fg-t acc">API server</text><text x="175" y="44" text-anchor="middle" class="fg-t sm">背後是 etcd</text>
<rect x="250" y="10" width="100" height="40" rx="6" class="fg-b"/><text x="300" y="35" text-anchor="middle" class="fg-t">控制器</text>
<rect x="370" y="10" width="100" height="40" rx="6" class="fg-b"/><text x="420" y="35" text-anchor="middle" class="fg-t">排程器</text>
<rect x="485" y="10" width="100" height="40" rx="6" class="fg-b"/><text x="535" y="35" text-anchor="middle" class="fg-t mono">kubelet</text>
<rect x="590" y="10" width="100" height="40" rx="6" class="fg-b"/><text x="640" y="35" text-anchor="middle" class="fg-t mono">containerd</text>
<line x1="60" y1="50" x2="60" y2="506" class="fg-l dim dash"/>
<line x1="175" y1="50" x2="175" y2="506" class="fg-l dim dash"/>
<line x1="300" y1="50" x2="300" y2="506" class="fg-l dim dash"/>
<line x1="420" y1="50" x2="420" y2="506" class="fg-l dim dash"/>
<line x1="535" y1="50" x2="535" y2="506" class="fg-l dim dash"/>
<line x1="640" y1="50" x2="640" y2="506" class="fg-l dim dash"/>
<line x1="60" y1="76" x2="167" y2="76" class="fg-l"/><polygon points="175,76 167,71.5 167,80.5" class="fg-a"/><text x="117" y="69" text-anchor="middle" class="fg-t sm">① apply</text>
<line x1="175" y1="108" x2="292" y2="108" class="fg-l alt"/><polygon points="300,108 292,103.5 292,112.5" class="fg-a alt"/><text x="237" y="101" text-anchor="middle" class="fg-t sm">② 新 Deployment</text>
<line x1="300" y1="140" x2="183" y2="140" class="fg-l"/><polygon points="175,140 183,135.5 183,144.5" class="fg-a"/><text x="237" y="133" text-anchor="middle" class="fg-t sm">建 ReplicaSet</text>
<line x1="175" y1="172" x2="292" y2="172" class="fg-l alt"/><polygon points="300,172 292,167.5 292,176.5" class="fg-a alt"/><text x="237" y="165" text-anchor="middle" class="fg-t sm">新 ReplicaSet</text>
<line x1="300" y1="204" x2="183" y2="204" class="fg-l"/><polygon points="175,204 183,199.5 183,208.5" class="fg-a"/><text x="237" y="197" text-anchor="middle" class="fg-t sm">③ 建 3 個 Pod</text>
<line x1="175" y1="236" x2="412" y2="236" class="fg-l alt"/><polygon points="420,236 412,231.5 412,240.5" class="fg-a alt"/><text x="237" y="229" text-anchor="middle" class="fg-t sm">④ 有 Pod 沒節點</text>
<line x1="420" y1="268" x2="183" y2="268" class="fg-l"/><polygon points="175,268 183,263.5 183,272.5" class="fg-a"/><text x="360" y="261" text-anchor="middle" class="fg-t sm">綁定 node-d</text>
<line x1="175" y1="300" x2="527" y2="300" class="fg-l alt"/><polygon points="535,300 527,295.5 527,304.5" class="fg-a alt"/><text x="237" y="293" text-anchor="middle" class="fg-t sm">⑤ 分給我的 Pod</text>
<line x1="535" y1="332" x2="632" y2="332" class="fg-l on"/><polygon points="640,332 632,327.5 632,336.5" class="fg-a on"/><text x="587" y="325" text-anchor="middle" class="fg-t sm">⑥ 建沙盒、給 IP</text>
<line x1="535" y1="364" x2="632" y2="364" class="fg-l on"/><polygon points="640,364 632,359.5 632,368.5" class="fg-a on"/><text x="587" y="357" text-anchor="middle" class="fg-t sm">拉映像、啟動</text>
<line x1="640" y1="396" x2="543" y2="396" class="fg-l on dash"/><polygon points="535,396 543,391.5 543,400.5" class="fg-a on"/><text x="587" y="389" text-anchor="middle" class="fg-t sm">跑起來了</text>
<line x1="535" y1="428" x2="183" y2="428" class="fg-l"/><polygon points="175,428 183,423.5 183,432.5" class="fg-a"/><text x="477" y="421" text-anchor="middle" class="fg-t sm">⑦ Running、Ready</text>
<line x1="175" y1="460" x2="292" y2="460" class="fg-l alt"/><polygon points="300,460 292,455.5 292,464.5" class="fg-a alt"/><text x="237" y="453" text-anchor="middle" class="fg-t sm">⑧ Pod 就緒了</text>
<line x1="300" y1="492" x2="183" y2="492" class="fg-l"/><polygon points="175,492 183,487.5 183,496.5" class="fg-a"/><text x="237" y="485" text-anchor="middle" class="fg-t sm">更新 EndpointSlice</text>
<text x="350" y="528" text-anchor="middle" class="fg-t sm">藍線：watch 送來的通知　黑線：寫回 API server　綠線：CRI 呼叫</text>
</svg><figcaption>每一條黑線都是一次寫入，API server 都會先存進 etcd 再通知下一個人（圖上省略）。kubectl 在第 ① 步就回來了，後面全部是非同步發生的。</figcaption></figure>
<ol>
<li><b>apply</b>：kubectl 把 YAML 送進 API server，通過第三節的七關，存進 etcd。kubectl 印出「deployment.apps/web created」就結束了，此時一個 Pod 都還沒有。</li>
<li><b>Deployment 控制器</b>看到新的 Deployment，建立一個 ReplicaSet，名字後面加上 Pod 範本的雜湊值，例如 <code>web-7d9f8c6b5</code>。</li>
<li><b>ReplicaSet 控制器</b>看到「想要 3 個、有 0 個」，建立 3 個 Pod 物件。它們只是 etcd 裡的三筆資料，<code>nodeName</code> 是空的。</li>
<li><b>排程器</b>看到沒有節點的 Pod，過濾、打分、寫 Binding。</li>
<li><b>node-d 的 kubelet</b> 看到有 Pod 分給自己。</li>
<li>它透過 CRI 請 containerd 建沙盒、CNI 配 IP、拉映像檔、啟動容器。</li>
<li>kubelet 回報 Running；容器通過就緒探針後，Pod 的 Ready 條件變成 True。</li>
<li><b>EndpointSlice 控制器</b>看到一個就緒的 Pod 符合某個 Service 的選擇器，把它的 IP 加進名單；每台節點的 kube-proxy 再據此更新規則。從這一刻起，流量才會進來。這一段是下一章的主角。</li>
</ol>
<p>整串事件都看得到：</p>
<pre><code>$ kubectl get events --sort-by=.lastTimestamp
Normal  ScalingReplicaSet  deployment/web           Scaled up replica set web-7d9f8c6b5 to 3
Normal  SuccessfulCreate   replicaset/web-7d9f8c6b5 Created pod: web-7d9f8c6b5-x2k4q
Normal  Scheduled          pod/web-7d9f8c6b5-x2k4q  Successfully assigned default/web-7d9f8c6b5-x2k4q to node-d
Normal  Pulling            pod/web-7d9f8c6b5-x2k4q  Pulling image "nginx:1.27"
Normal  Pulled             pod/web-7d9f8c6b5-x2k4q  Successfully pulled image "nginx:1.27" in 3.2s
Normal  Started            pod/web-7d9f8c6b5-x2k4q  Started container web</code></pre>
<p>時間大多花在哪裡？API 那幾關和排程都是毫秒級；拉映像檔是秒到分鐘級，往往是整條路上最慢的一段；再來是程式自己的啟動時間和就緒探針。所以「部署很慢」的第一個懷疑對象，通常是映像檔太大或映像檔倉庫太遠。上一章把映像檔做小，在這裡直接變成部署速度。</p>
<h4>apply 的兩種模式</h4>
<p>預設的 <code>kubectl apply</code> 是在用戶端算差異：它把你上次 apply 的內容存在物件的一個註解（<code>last-applied-configuration</code>）裡，拿「上次的、現在的、你這次給的」三份做合併。<code>kubectl apply --server-side</code> 則交給 API server：它記錄每一個欄位是哪個「管理者」設定的（<code>managedFields</code>），兩個管理者想把同一個欄位設成不同的值時，會明確報出衝突，而不是默默互相蓋掉。最常見的打架對象是 replicas：YAML 裡寫死 <code>replicas: 3</code>，又開了 HorizontalPodAutoscaler，每次 apply 都會把自動擴展好的數量拉回 3。所以用了自動擴展，YAML 裡就不要寫 replicas。</p>

<h3><span class="badge lv3">專業</span>八、控制平面：交給雲端，還是自己架</h3>
<table>
<tr><th>項目</th><th>代管（EKS、GKE、AKS）</th><th>自己架（kubeadm、k3s、RKE2、Talos）</th></tr>
<tr><td>控制平面誰顧</td><td>雲端業者，有 SLA</td><td>你，包括半夜</td></tr>
<tr><td>etcd 備份與還原</td><td>業者處理</td><td>你排程、你異地存放、你練習還原</td></tr>
<tr><td>憑證</td><td>業者輪替</td><td>kubeadm 簽出的憑證預設一年到期，忘了換，叢集整個停擺</td></tr>
<tr><td>升級</td><td>控制平面一個指令；節點仍要你排</td><td>每台一個一個排空、升級</td></tr>
<tr><td>能調的參數</td><td>API server 的很多參數改不了</td><td>全部能改</td></tr>
<tr><td>費用</td><td>每個叢集約每小時 0.1 美元，加上節點（以官方價目為準）</td><td>只有機器錢，但人力最貴</td></tr>
</table>
<p>自己架高可用的控制平面，標準做法是三台控制平面節點，前面放一個負載平衡器分散到三個 API server（6443 連接埠）；etcd 可以跟它們放在同一批機器上（stacked），也可以獨立成另外三台（external），後者隔離得更好，但要顧的機器變成六台。</p>
<p>代管也不是什麼都不用管：節點的作業系統和升級（除非用 GKE Autopilot、EKS Auto Mode 或 Fargate 這類連節點都代管的模式）、CNI 和 CoreDNS 這類附加元件的版本、RBAC、網路政策，仍然是你的事。上游的每個次要版本大約只維護一年多，跟不上升級節奏，雲端業者會開始收延長支援的費用。</p>
<p>務實的建議：工作上用代管；學習時用 k3s 或 kubeadm 自己架一次、弄壞一次、修好一次，你才真的知道代管替你擋掉了什麼。CKA 考試就是在 kubeadm 架的叢集上考。</p>

<h3><span class="badge lv4">專家</span>九、很少人注意到的幾個角落</h3>
<h4>控制平面全掛了，服務會停嗎？</h4>
<p>不會立刻停。正在跑的容器由 kubelet 和 containerd 照顧，容器當掉，kubelet 會在本機照重啟政策把它拉起來；kube-proxy 已經寫好的網路規則也還在，流量照樣送到。停下來的是所有「需要改變」的事：不能部署、不能擴展、節點掛了不會搬家、Pod 換了 IP 也不會更新到 Service 的名單。這就是「控制平面」和「資料平面」分開的好處，也是為什麼控制平面短暫中斷通常不是全面事故。</p>
<h4>同時只有一個在做事：領導者選舉</h4>
<p>排程器和 controller-manager 為了高可用會跑好幾份，但兩個排程器同時替同一個 Pod 挑節點會出事。所以它們用 <code>kube-system</code> 裡的一個 Lease 物件搶「領導權」，搶到的才工作，其他的待命；領導者停止續約超過租期（預設 15 秒），待命的就接手。你自己寫的控制器跑多份時，也要用同一招。</p>
<h4>刪掉 Deployment，Pod 為什麼也跟著不見</h4>
<p>每個 Pod 的 <code>metadata.ownerReferences</code> 指向它的 ReplicaSet，ReplicaSet 指向 Deployment。刪掉上層，<b>垃圾回收控制器</b>沿著這條線把下層一起刪掉。<code>kubectl delete deploy web --cascade=orphan</code> 則只刪上層、留下孤兒，在需要「換掉管理者但不重啟 Pod」時很有用。</p>
<h4>卡在 Terminating：finalizer</h4>
<p>一個物件帶著 <code>finalizers</code> 時，刪除只會先標上刪除時間，要等負責的控制器做完清理（例如刪掉雲端的負載平衡器、確認磁碟沒人在用）、把 finalizer 拿掉，物件才真的消失。命名空間或 PVC 卡在 Terminating 好幾天，多半是負責清理的那個控制器已經不在了。網路上常見「直接把 finalizer 刪掉」的解法，那等於跳過清理，可能留下一台還在收費的負載平衡器。先找出是誰的 finalizer、為什麼沒做完。</p>
<h4>API server 也會排隊</h4>
<p>一個寫壞的控制器瘋狂 list 全部 Pod，可能把 API server 拖垮，連 kubelet 回報心跳都進不去。<b>API Priority and Fairness</b> 把請求依優先等級分到不同的佇列，系統元件有保留的份量，一般用戶端排隊、被限流時收到 429 Too Many Requests。寫自己的工具時，用 informer 快取、不要在迴圈裡一直 list，是對叢集最基本的禮貌。</p>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td><code>kubectl apply</code> 成功，Pod 就已經在跑了</td><td>它只代表物件寫進了 etcd。後面的建立、排程、拉映像檔、啟動全是非同步的，用 <code>kubectl rollout status</code> 等它完成。</td></tr>
<tr><td>節點掛了，Pod 會立刻在別台重開</td><td>預設要四、五十秒判定節點失聯，再加上 300 秒的容忍時間，大約 5 到 6 分鐘。靠的是多副本撐過這段時間。</td></tr>
<tr><td>排程器會看節點實際有多忙</td><td>它只看 requests 的加總。沒寫 requests，對排程器來說就是 0。</td></tr>
<tr><td>控制平面掛了，所有服務一起停</td><td>正在跑的照跑，只是什麼都改不了、壞了也不會自動搬家。</td></tr>
<tr><td>etcd 放越多台越安全</td><td>偶數台沒有多容錯，台數越多每次寫入要等的機器越多。一般是 3 台，大叢集 5 台。</td></tr>
<tr><td>控制平面會主動去指揮每台節點</td><td>是 kubelet 自己 watch、自己拉工作。控制平面主動連 kubelet，主要只在 <code>logs</code>、<code>exec</code>、<code>port-forward</code> 這類操作。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>Node.js、Go 後端</b>：在 Kubernetes 裡，Pod 隨時會因為部署、擴展、節點維修被換掉。就緒探針、優雅關機、啟動要快，這三件事決定了使用者會不會在每次換 Pod 時看到錯誤。</li>
<li><b>控制迴圈這個寫法本身</b>：你寫的佇列消費者、定時同步工作，也該是「比對狀態、做一小步、可以重複執行」，而不是「收到事件做一次」。漏掉一個訊息時，前者會自己修好。想自己寫 Kubernetes 控制器，Go 的 controller-runtime 和 kubebuilder 是標準工具。</li>
<li><b>遊戲伺服器</b>：對戰房間是「有狀態、不能隨便砍」的 Pod，跟一般的 API 不一樣。開源專案 Agones 就是用自訂資源和控制器，在 Kubernetes 上管理遊戲伺服器的配置與回收，值得看看它怎麼處理「正在對戰中不能被縮減」。</li>
<li><b>Docker 和雲端主機</b>：先問規模。幾個容器、一兩台機器，Docker Compose 加上 systemd 就夠了；團隊和服務多起來，再上代管的 Kubernetes。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<p>下面是 DevOps、SRE、平台工程面試裡很常見的題目，也是 CKA 的基本功。先自己出聲講一遍，再打開參考答案。</p>
<ol>
<li>「說明 Kubernetes 的調和（reconciliation）迴圈。為什麼說它是 level-triggered？」</li>
<li>「kubectl apply 一個 Deployment 之後，一直到 Pod 開始接流量，中間發生了什麼？」</li>
<li>「etcd 為什麼通常是 3 台或 5 台？3 台壞了 2 台會怎樣？」</li>
<li>「排程器怎麼決定 Pod 放在哪台節點？一個 Pod 一直 Pending，你怎麼查？」</li>
<li>「一台節點突然斷電，上面的 Pod 多久會在別台出現？為什麼不是立刻？」</li>
<li>「如果整個控制平面掛了，正在跑的服務會怎樣？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>使用者在物件的 spec 宣告期望狀態，控制器持續 watch 相關物件，比較期望與實際狀態，做一小步去縮小差距，並把觀察結果寫回 status。它比較的是當下的狀態而不是事件，所以控制器重啟或漏掉事件都沒關係，下一次比對就會發現差距；動作也必須是冪等的。各控制器只負責一件事，透過 API server 上的物件間接合作，例如 Deployment → ReplicaSet → Pod。</li>
<li>kubectl 送出請求，API server 依序做認證、授權、變更型准入、結構驗證、驗證型准入，寫入 etcd 並通知 watcher，kubectl 此時就返回了。Deployment 控制器建立 ReplicaSet；ReplicaSet 控制器建立 Pod 物件；排程器過濾、打分後寫入 Binding 設定 nodeName；該節點的 kubelet 透過 CRI 請 containerd 建立沙盒，CNI 配 IP，拉映像檔、啟動容器，回報狀態；就緒探針通過後，EndpointSlice 控制器把 Pod IP 加進 Service 的名單，kube-proxy 更新規則，流量才開始進來。</li>
<li>etcd 用 Raft，寫入要過半數成員寫入磁碟才提交，領導者也要過半數投票才能選出。3 台可容忍 1 台故障、5 台可容忍 2 台；偶數台不增加容錯，卻增加複製成本。3 台壞 2 台時剩下 1 台湊不到過半數，無法寫入也選不出領導者，Kubernetes 變成唯讀：現有工作負載照跑，但無法做任何變更，要恢復成員或從快照還原。</li>
<li>排程器先過濾：requests 是否放得下、nodeSelector 與親和性、taint 與 toleration、連接埠、磁碟可用區、拓撲分散；再對剩下的節點打分（剩餘資源、資源平衡、映像檔是否已在本機、偏好設定等）加權，選最高分並寫入 Binding。Pending 時先看 <code>kubectl describe pod</code> 的 FailedScheduling 事件，它會統計每台節點不合格的原因，常見是 requests 太大、taint 沒有容忍、親和性寫錯、PVC 綁不到磁碟；再用 <code>kubectl describe node</code> 看 allocatable 和已分配的 requests。</li>
<li>kubelet 定期更新 Lease 心跳；節點生命週期控制器在預設四、五十秒沒收到心跳後把節點標成 Unknown 並加上 unreachable 的 NoExecute taint；Pod 在建立時被准入控制器自動加上容忍該 taint 300 秒，所以還要再等 5 分鐘才被驅逐，ReplicaSet 再於其他節點補上，合計約 5 到 6 分鐘。這是為了避免短暫網路抖動造成大規模搬遷。可以調短 tolerationSeconds，但更根本的是多副本與 PodDisruptionBudget。</li>
<li>資料平面照常運作：kubelet 和 containerd 繼續跑現有容器，並在本機依重啟政策重啟當掉的容器，kube-proxy 已寫入的規則仍然轉送流量。但所有需要控制平面的事都停了：部署、擴展、排程、節點故障後的搬遷、Service 名單的更新，kubectl 也無法使用。所以控制平面的高可用和 etcd 備份很重要，但它短暫中斷通常不會立刻造成服務中斷。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>一台節點可分配 8 顆 CPU、32 Gi 記憶體，目前 requests 加總是 CPU 5 顆、記憶體 8 Gi。新 Pod 要 1 顆 CPU、8 Gi 記憶體。照本章的打分方式，它得幾分？</li>
<li>一個 5 台的 etcd 叢集，有 2 台壞了還能寫入嗎？3 台壞了呢？如果你把它改成 6 台，能多壞幾台？</li>
<li>在 Killercoda 的 kubeadm 叢集裡，找出 API server 這個靜態 Pod 的 YAML 檔放在哪裡，並用一個指令列出控制平面四個元件的 Pod。</li>
<li>把 <code>kubectl scale deploy web --replicas=5</code>（原本 3 份）之後發生的事，依序寫成 5 到 6 步，標出每一步是哪個元件做的。</li>
<li>一個 Deployment 的新 Pod 一直 Pending，事件寫著「0/3 nodes are available: 3 Insufficient memory」，可是監控顯示三台節點的實際記憶體用量都只有 30%。為什麼？列出兩種修法。</li>
<li>同事說：「我直接用 kubectl edit 改了 Pod 的映像檔版本，過一陣子又被改回去了。」解釋原因，並說出正確的做法。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>放進去後 CPU 是 6／8，剩 25%；記憶體是 16／32，剩 50%。平均 37.5，約 37 分。（BalancedAllocation 還會因為兩者剩餘比例不一樣而再調整。）</li>
<li>5 台過半是 3 台。壞 2 台剩 3 台，仍然過半，可以寫入；壞 3 台剩 2 台，不到過半，無法寫入。改成 6 台，過半要 4 台，還是只能壞 2 台，容錯沒有增加，每次寫入卻要等更多台。</li>
<li>在控制平面節點上的 <code>/etc/kubernetes/manifests/kube-apiserver.yaml</code>（同一個資料夾還有 etcd、kube-scheduler、kube-controller-manager）。列出它們：<code>kubectl get pods -n kube-system -l tier=control-plane</code>（kubeadm 會替它們加上這個標籤），或直接 <code>kubectl get pods -n kube-system</code>。</li>
<li>① kubectl 更新 Deployment 的 spec.replicas，API server 寫入 etcd。② Deployment 控制器把目前的 ReplicaSet 的 replicas 改成 5。③ ReplicaSet 控制器看到想要 5、有 3，建立 2 個 Pod 物件。④ 排程器替這 2 個 Pod 過濾、打分、綁定節點。⑤ 對應節點的 kubelet 透過 containerd 建立沙盒、拉映像檔、啟動容器並回報狀態。⑥ 就緒後 EndpointSlice 控制器把新 Pod 的 IP 加進 Service 的名單，kube-proxy 更新規則。</li>
<li>排程器看的是 requests，不是實際用量。這三台節點上 Pod 的記憶體 requests 加總已經接近可分配量，雖然實際只用到 30%，對排程器來說已經滿了。修法：把各服務的 requests 調到接近實際用量（先看監控的 P95 用量）；或增加節點、讓 cluster autoscaler 自動加節點；也可以檢查新 Pod 自己的 requests 是不是寫得太大。</li>
<li>那個 Pod 是 ReplicaSet 依照 Pod 範本建出來的。Pod 本身的映像檔欄位雖然能改，但只要那個 Pod 被重建（被刪除、節點維修、擴展），新的 Pod 又會照著 ReplicaSet 的範本，也就是舊的版本建立。控制器只保證「數量和範本」，不會替你保留對單一 Pod 的手動修改。正確做法是改 Deployment 本身（改 YAML 再 apply，或 <code>kubectl set image deploy/web</code>），讓 Deployment 建立新的 ReplicaSet 進行滾動更新，並把這個變更放進 git。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>Kubernetes 官方文件〈Cluster Architecture〉與〈Kubernetes Components〉</b>（<a href="https://kubernetes.io/docs/concepts/architecture/">kubernetes.io/docs/concepts/architecture</a>）：控制器、節點、Lease、垃圾回收都有專頁，寫得比大多數書都新。</li>
<li><b>Kelsey Hightower〈Kubernetes the Hard Way〉</b>（GitHub）：不用任何安裝工具，親手把每個元件、每張憑證接起來。做完一次，這一章的每一條線你都摸過。</li>
<li><b>Raft 官方網站</b>（<a href="https://raft.github.io/">raft.github.io</a>）：有可以點的互動動畫，還有原始論文〈In Search of an Understandable Consensus Algorithm〉（Ongaro 與 Ousterhout），出乎意料地好讀。</li>
<li><b>Michael Hausenblas 與 Stefan Schimanski《Programming Kubernetes》</b>（O'Reilly）：informer、控制器、自訂資源、Operator 的寫法，是自己寫控制器之前最該讀的一本。</li>
<li><b>CKA（Certified Kubernetes Administrator）</b>：Linux Foundation 的實作考試，考綱本身就是一份很好的學習清單；Killercoda 上有免費的練習情境。</li>
</ul>
` });
