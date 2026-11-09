DEEP({ 'k8s-health': `
<p>上一課用四項設定帶過「怎麼讓 Kubernetes 照顧你的程式」：探針、requests 與 limits、自動擴展、滾動更新。這一章把每一項拆到底：探針是誰在打、多久才發現問題；requests 怎麼決定 Pod 放哪台機器；CPU 上限為什麼會讓延遲變高；HPA 怎麼算出要幾個 Pod；新機器為什麼要等好幾分鐘；以及一個 Pod 被刪掉的那 30 秒裡，到底發生了哪些事。這些是正式環境天天出事的地方，也是面試官最愛追問的細節。</p>

<h3><span class="badge lv1">基礎</span>一、誰在檢查：kubelet 與三種探針</h3>
<p>先想像一間醫院。每間病房外面有一位護理師，固定時間進去看一次病人。她問兩件事：「病人還有呼吸嗎？」和「病人現在能見訪客嗎？」前者答不出來，就要急救；後者答不出來，只是先請訪客別進去。剛開完刀、麻醉還沒退的病人，她會先不問，免得把「還沒醒」誤判成「沒呼吸」。</p>
<p>在 Kubernetes 裡，這位護理師是每台節點（node）上的 <b>kubelet</b>。探針（probe）不是控制平面打的，是 Pod 所在那台機器上的 kubelet 直接去敲容器。三個問題就是存活探測（liveness）、就緒探測（readiness）和啟動探測（startup）。</p>
<figure class="figure"><svg viewBox="0 0 660 280" class="fg" style="width:100%;max-width:660px" role="img" aria-label="節點上的 kubelet 定時探測容器；存活失敗就地重啟容器，就緒失敗則經過 API server 與 EndpointSlice，最後由各節點的 kube-proxy 停止轉送流量">
<rect x="10" y="10" width="230" height="260" rx="10" class="fg-b"/>
<text x="24" y="32" class="fg-t lg">節點</text>
<rect x="30" y="44" width="190" height="56" rx="6" class="fg-b hot"/>
<text x="125" y="67" text-anchor="middle" class="fg-t acc">kubelet</text>
<text x="125" y="87" text-anchor="middle" class="fg-t sm">每台節點上的代理程式</text>
<rect x="30" y="196" width="190" height="56" rx="6" class="fg-b alt"/>
<text x="125" y="219" text-anchor="middle" class="fg-t">容器 hilo-api</text>
<text x="125" y="239" text-anchor="middle" class="fg-t sm mono">/alive　/ready</text>
<line x1="90" y1="100" x2="90" y2="188" class="fg-l on"/><polygon points="90,196 85.5,188 94.5,188" class="fg-a on"/>
<text x="82" y="152" text-anchor="end" class="fg-t sm acc">探測</text>
<line x1="160" y1="196" x2="160" y2="108" class="fg-l"/><polygon points="160,100 155.5,108 164.5,108" class="fg-a"/>
<text x="168" y="152" class="fg-t sm">結果</text>
<rect x="290" y="44" width="150" height="48" rx="6" class="fg-b warm"/>
<text x="365" y="64" text-anchor="middle" class="fg-t warm">存活探測失敗</text>
<text x="365" y="82" text-anchor="middle" class="fg-t sm">連續 3 次</text>
<line x1="220" y1="68" x2="282" y2="68" class="fg-l warm"/><polygon points="290,68 282,63.5 282,72.5" class="fg-a warm"/>
<rect x="480" y="44" width="170" height="48" rx="6" class="fg-b"/>
<text x="565" y="64" text-anchor="middle" class="fg-t">重啟這個容器</text>
<text x="565" y="82" text-anchor="middle" class="fg-t sm">Pod 名字和 IP 不變</text>
<line x1="440" y1="68" x2="472" y2="68" class="fg-l"/><polygon points="480,68 472,63.5 472,72.5" class="fg-a"/>
<rect x="290" y="130" width="150" height="48" rx="6" class="fg-b alt"/>
<text x="365" y="150" text-anchor="middle" class="fg-t alt">就緒探測失敗</text>
<text x="365" y="168" text-anchor="middle" class="fg-t sm">連續 3 次</text>
<path d="M220 90 H255 V154 H282" class="fg-l alt"/><polygon points="290,154 282,149.5 282,158.5" class="fg-a alt"/>
<rect x="480" y="130" width="170" height="48" rx="6" class="fg-b"/>
<text x="565" y="150" text-anchor="middle" class="fg-t">API server</text>
<text x="565" y="168" text-anchor="middle" class="fg-t sm">記下 Ready=False</text>
<line x1="440" y1="154" x2="472" y2="154" class="fg-l alt"/><polygon points="480,154 472,149.5 472,158.5" class="fg-a alt"/>
<rect x="480" y="212" width="170" height="48" rx="6" class="fg-b hot"/>
<text x="565" y="232" text-anchor="middle" class="fg-t acc">EndpointSlice</text>
<text x="565" y="250" text-anchor="middle" class="fg-t sm">標記這個 IP 沒就緒</text>
<line x1="565" y1="178" x2="565" y2="204" class="fg-l alt"/><polygon points="565,212 560.5,204 569.5,204" class="fg-a alt"/>
<rect x="290" y="212" width="150" height="48" rx="6" class="fg-b"/>
<text x="365" y="232" text-anchor="middle" class="fg-t">各節點 kube-proxy</text>
<text x="365" y="250" text-anchor="middle" class="fg-t sm">不再轉流量給它</text>
<line x1="480" y1="236" x2="448" y2="236" class="fg-l alt"/><polygon points="440,236 448,231.5 448,240.5" class="fg-a alt"/>
<line x1="290" y1="236" x2="228" y2="236" class="fg-l dash"/><polygon points="220,236 228,231.5 228,240.5" class="fg-a"/>
<text x="258" y="228" text-anchor="middle" class="fg-t sm">流量</text>
</svg><figcaption>探測是節點上的 kubelet 在做。存活失敗只在節點上就地重啟；就緒失敗要繞一大圈：回報 API server、EndpointSlice 標記、每台節點的 kube-proxy 更新規則，流量才真的停。</figcaption></figure>
<p>kubelet 有四種敲門方式：</p>
<ul>
<li><code>httpGet</code>：打一個 HTTP 請求，狀態碼 200 到 399 算成功。最常用。</li>
<li><code>tcpSocket</code>：TCP 連得上就算成功。適合不講 HTTP 的服務，但它只證明「有人在聽」，不證明「能做事」。</li>
<li><code>exec</code>：在容器裡執行一個指令，結束碼（exit code）是 0 就算成功。每次都要開新行程，探得很密時會吃 CPU。</li>
<li><code>grpc</code>：走 gRPC 標準的健康檢查協定，gRPC 服務用這個最省事。</li>
</ul>
<p>注意圖上兩條路的長短差很多。存活失敗，kubelet 自己就能處理：把容器殺掉、原地重開，<code>RESTARTS</code> 那一欄加 1。就緒失敗則要經過控制平面，再傳到每一台節點。這一圈要花時間，第九節會再回來看，因為它正是「每次部署都噴 502」的元兇。</p>

<h3><span class="badge lv1">基礎</span>二、requests 與 limits：訂位和天花板</h3>
<p>把節點想成一間餐廳。<b>request</b> 是訂位：你說「四個人」，餐廳就把四個位子留給你，不管最後來幾個人。<b>limit</b> 是天花板：你最多只能坐到這麼多位子。排程器（scheduler）決定 Pod 放哪台機器時，<b>只看訂位，不看店裡現在實際坐了幾個人</b>。</p>
<figure class="figure"><svg viewBox="0 0 640 230" class="fg" style="width:100%;max-width:640px" role="img" aria-label="同一台節點的兩條長條：上面是 requests 加總，三個 Pod 各訂 1000m，只剩 500m，新的 Pod D 放不下；下面是實際用量，三個 Pod 只用了 650m">
<text x="110" y="26" class="fg-t sm">節點可分配：3500m CPU</text>
<text x="16" y="58" class="fg-t">requests</text>
<text x="16" y="74" class="fg-t sm">排程器只看這個</text>
<rect x="110" y="36" width="490" height="44" rx="5" class="fg-b"/>
<rect x="112" y="38" width="136" height="40" rx="4" class="fg-b alt"/><text x="180" y="63" text-anchor="middle" class="fg-t sm">Pod A 訂 1000m</text>
<rect x="252" y="38" width="136" height="40" rx="4" class="fg-b alt"/><text x="320" y="63" text-anchor="middle" class="fg-t sm">Pod B 訂 1000m</text>
<rect x="392" y="38" width="136" height="40" rx="4" class="fg-b alt"/><text x="460" y="63" text-anchor="middle" class="fg-t sm">Pod C 訂 1000m</text>
<text x="565" y="63" text-anchor="middle" class="fg-t sm">剩 500m</text>
<rect x="440" y="94" width="160" height="30" rx="5" class="fg-b warm"/>
<text x="520" y="113" text-anchor="middle" class="fg-t sm">新 Pod D 要 1000m</text>
<text x="430" y="113" text-anchor="end" class="fg-t sm warm">放不下 → Pending</text>
<text x="16" y="166" class="fg-t">實際用量</text>
<text x="16" y="182" class="fg-t sm">top 看到的</text>
<rect x="110" y="144" width="490" height="44" rx="5" class="fg-b"/>
<rect x="112" y="146" width="136" height="40" rx="4" class="fg-b dash"/><rect x="112" y="146" width="28" height="40" rx="3" class="fg-b hot"/><text x="148" y="171" class="fg-t sm">用 200m</text>
<rect x="252" y="146" width="136" height="40" rx="4" class="fg-b dash"/><rect x="252" y="146" width="42" height="40" rx="3" class="fg-b hot"/><text x="302" y="171" class="fg-t sm">用 300m</text>
<rect x="392" y="146" width="136" height="40" rx="4" class="fg-b dash"/><rect x="392" y="146" width="21" height="40" rx="3" class="fg-b hot"/><text x="421" y="171" class="fg-t sm">用 150m</text>
<text x="355" y="214" text-anchor="middle" class="fg-t sm">實際只用 650m，排程器卻認為已經訂掉 3000m</text>
</svg><figcaption>上下兩條是同一台節點。排程器只看上面那條：requests 的加總。下面的實際用量再低，新的 Pod D 還是放不進來。</figcaption></figure>
<p>這張圖解開一個很常見的困惑：「監控上每台機器 CPU 都只用兩成，為什麼新 Pod 還是 Pending？」因為排程器算的是 requests 的加總，位子已經被訂走了。反過來，requests 訂得太低也不行：排程器以為很空，一直往同一台塞，等大家真的開始用，就互相搶。</p>
<h4>單位與可分配量</h4>
<ul>
<li>CPU 的 <code>1</code> 是一顆核心（雲端上是一個 vCPU），<code>250m</code> 是四分之一顆，m 是千分之一（millicore）。</li>
<li>記憶體的 <code>Mi</code> 是 1024 × 1024 位元組，<code>M</code> 是 1000 × 1000。<code>512M</code> 和 <code>512Mi</code> 差了大約 5%，別混用。</li>
<li>節點不是整台都能給 Pod。kubelet 先扣掉作業系統和自己要用的保留量，再扣掉觸發驅逐的門檻，剩下的才叫<b>可分配量</b>（allocatable）。<code>kubectl describe node</code> 裡有 Capacity 和 Allocatable 兩段，要看後面那段。</li>
</ul>
<h4>三種服務品質等級（QoS class）</h4>
<p>Kubernetes 會依你怎麼設 requests 和 limits，自動把 Pod 分成三級。機器記憶體不夠時，這個等級決定誰先被犧牲。</p>
<table>
<tr><th>等級</th><th>條件</th><th>記憶體不夠時</th></tr>
<tr><td><b>Guaranteed</b></td><td>每個容器的 CPU 和記憶體都設了，而且 request 等於 limit</td><td>最後才被動到</td></tr>
<tr><td><b>Burstable</b></td><td>至少設了某個 request 或 limit，但不符合上一級</td><td>用量超過自己 request 的排在前面</td></tr>
<tr><td><b>BestEffort</b></td><td>完全沒設</td><td>第一個被犧牲</td></tr>
</table>
<p>有個小陷阱：只寫 limits、沒寫 requests 時，Kubernetes 會把 requests 自動設成跟 limits 一樣。所以「只設 limits」的 Pod 其實是 Guaranteed，排程時也用 limits 的大小去訂位，常常因此排不進去。</p>
<p>QoS 也會變成 Linux 核心裡的 <code>oom_score_adj</code> 分數：Guaranteed 是 -997，BestEffort 是 1000，Burstable 介於中間，request 訂得越大分數越低。整台機器記憶體真的耗盡、核心親自出手殺行程時，分數高的先死。</p>

<h3><span class="badge lv2">進階</span>三、探針的時間參數：算出多久才發現問題</h3>
<p>每個探針都有五個時間參數。先記住預設值，因為大部分人根本沒改過：</p>
<table>
<tr><th>參數</th><th>意思</th><th>預設</th></tr>
<tr><td><code>initialDelaySeconds</code></td><td>容器啟動後，等多久才開始探</td><td>0</td></tr>
<tr><td><code>periodSeconds</code></td><td>多久探一次</td><td>10</td></tr>
<tr><td><code>timeoutSeconds</code></td><td>一次最多等多久，超過算失敗</td><td>1</td></tr>
<tr><td><code>failureThreshold</code></td><td>連續失敗幾次才算真的失敗</td><td>3</td></tr>
<tr><td><code>successThreshold</code></td><td>失敗後連續成功幾次才算恢復（存活和啟動探測只能是 1）</td><td>1</td></tr>
</table>
<p>拿一組真實的設定來追：就緒探測每 5 秒一次，存活探測每 10 秒一次，失敗門檻都是 3。程式在第 12 秒發生死結（deadlock），完全不回應：</p>
<figure class="figure"><svg viewBox="0 0 660 228" class="fg" style="width:100%;max-width:660px" role="img" aria-label="時間軸：程式第 12 秒卡住，就緒探測在第 15、20、25 秒連續失敗後停流量，存活探測在第 20、30、40 秒連續失敗後重啟">
<text x="16" y="54" class="fg-t">程式</text>
<rect x="80" y="36" width="130" height="26" rx="4" class="fg-b hot"/><text x="145" y="54" text-anchor="middle" class="fg-t">正常</text>
<rect x="210" y="36" width="302" height="26" rx="4" class="fg-b warm"/><text x="361" y="54" text-anchor="middle" class="fg-t">第 12 秒卡住，不回應任何請求</text>
<rect x="512" y="36" width="108" height="26" rx="4" class="fg-b"/><text x="566" y="54" text-anchor="middle" class="fg-t">重新啟動</text>
<line x1="210" y1="66" x2="210" y2="194" class="fg-l dim dash"/>
<line x1="512" y1="66" x2="512" y2="194" class="fg-l dim dash"/>
<text x="16" y="98" class="fg-t">就緒探測</text><text x="16" y="114" class="fg-t sm">每 5 秒</text>
<circle cx="134" cy="100" r="6" class="fg-lamp on"/><circle cx="188" cy="100" r="6" class="fg-lamp on"/>
<circle cx="242" cy="100" r="6" class="fg-b warm"/><circle cx="296" cy="100" r="6" class="fg-b warm"/><circle cx="350" cy="100" r="6" class="fg-b warm"/>
<circle cx="404" cy="100" r="6" class="fg-b warm"/><circle cx="458" cy="100" r="6" class="fg-b warm"/>
<text x="242" y="88" text-anchor="middle" class="fg-t sm warm">1</text><text x="296" y="88" text-anchor="middle" class="fg-t sm warm">2</text><text x="350" y="88" text-anchor="middle" class="fg-t sm warm">3</text>
<text x="350" y="124" text-anchor="middle" class="fg-t sm warm">第 25 秒：從 Service 拿掉</text>
<text x="16" y="158" class="fg-t">存活探測</text><text x="16" y="174" class="fg-t sm">每 10 秒</text>
<circle cx="188" cy="160" r="6" class="fg-lamp on"/>
<circle cx="296" cy="160" r="6" class="fg-b warm"/><circle cx="404" cy="160" r="6" class="fg-b warm"/><circle cx="512" cy="160" r="6" class="fg-b warm"/>
<text x="296" y="148" text-anchor="middle" class="fg-t sm warm">1</text><text x="404" y="148" text-anchor="middle" class="fg-t sm warm">2</text><text x="524" y="148" class="fg-t sm warm">3</text>
<text x="520" y="184" class="fg-t sm warm">第 40 秒：重啟容器</text>
<line x1="80" y1="200" x2="620" y2="200" class="fg-l dim"/>
<text x="80" y="216" text-anchor="middle" class="fg-t sm">0</text><text x="188" y="216" text-anchor="middle" class="fg-t sm">10</text><text x="296" y="216" text-anchor="middle" class="fg-t sm">20</text><text x="404" y="216" text-anchor="middle" class="fg-t sm">30</text><text x="512" y="216" text-anchor="middle" class="fg-t sm">40</text><text x="620" y="216" text-anchor="middle" class="fg-t sm">50 秒</text>
</svg><figcaption>同一個卡住的程式，就緒探測 13 秒後先止血，存活探測 28 秒後才動手重啟。實心綠點是成功，橘色是失敗，數字是連續失敗的次數。</figcaption></figure>
<p>粗估公式是：<b>偵測時間 ≈ periodSeconds × failureThreshold</b>，最壞情況再加上最後一次最多 timeoutSeconds 的等待。就緒探測 5 × 3 = 15 秒內停掉流量，存活探測 10 × 3 = 30 秒內重啟。這兩個數字刻意不一樣：就緒要快，先止血；存活要慢，確定真的死了才動手。</p>
<h4>啟動探測：給慢熱的程式一段保護期</h4>
<p>有些程式啟動要很久，例如 JVM 服務要預熱、遊戲伺服器要把關卡資料載進記憶體。如果只有存活探測，它 30 秒內還沒起來就會被殺掉重開，然後又在 30 秒內被殺掉，永遠起不來。舊做法是把 <code>initialDelaySeconds</code> 設很大，但這樣它日後真的卡住時，也要等很久才發現。</p>
<p>正確做法是加啟動探測。<b>啟動探測成功之前，存活和就緒探測都不會執行</b>；它一成功，這個容器這輩子就不再跑它。容許的最長啟動時間是 <code>failureThreshold × periodSeconds</code>：</p>
<pre><code>startupProbe:
  httpGet: { path: /alive, port: 8080 }
  periodSeconds: 5
  failureThreshold: 24     # 最多給 5 × 24 = 120 秒開機
livenessProbe:
  httpGet: { path: /alive, port: 8080 }
  periodSeconds: 10
  failureThreshold: 3      # 開機後，卡住 30 秒左右就重啟</code></pre>
<h4>三種探針各自怎麼出事</h4>
<ul>
<li><b>存活探測太敏感</b>：預設 timeoutSeconds 只有 1 秒。流量尖峰時程式忙到 <code>/alive</code> 要 1.2 秒才回，或垃圾回收（GC）停頓了一下，連續三次就被重啟。它的流量轉給其他 Pod，其他 Pod 更忙、也開始超時，一個接一個倒下，這叫連鎖重啟。存活端點要極輕，不碰資料庫、不碰鎖，timeout 給寬一點。</li>
<li><b>存活探測檢查相依服務</b>：上一課講過，資料庫抖一下，所有 Pod 一起重啟。重啟修不好資料庫，只會讓情況更糟。</li>
<li><b>就緒探測檢查共用的相依服務</b>：比較隱晦。資料庫掛了，所有 Pod 都變成沒就緒，Service 後面一個端點都沒有，使用者拿到的是連線被拒，而不是一個好好的錯誤訊息。就緒探測該問的是「<b>我自己</b>準備好了沒」：設定載入了沒、快取暖好了沒、是不是正在關機。相依服務壞了，讓程式回錯誤或降級，比把自己藏起來好。</li>
<li><b>根本沒有就緒探測</b>：容器一啟動就被當成就緒。程式還在連資料庫、還沒開始監聽，請求就送進來了。每次部署都有一小段錯誤，很多人還以為「部署本來就會掉一點」。</li>
</ul>

<h3><span class="badge lv2">進階</span>四、CPU 上限為什麼會讓延遲變高</h3>
<p>上一課說「CPU 超過上限只會被放慢，不會被殺」。「放慢」聽起來很溫和，實際上是一頓一頓的急煞車。Linux 用 CFS 頻寬控制（CFS bandwidth control）實作 CPU 上限：在 cgroup v2 裡是一個叫 <code>cpu.max</code> 的設定，Kubernetes 把它寫成「每 100ms 一個週期，週期內最多能用多少 CPU 時間」。</p>
<p>limit 是 500m，就是每 100ms 只能用 50ms 的 CPU。用完了怎麼辦？整個容器原地暫停，等下一個週期開始。這就是<b>節流</b>（throttling）。</p>
<figure class="figure"><svg viewBox="0 0 660 236" class="fg" style="width:100%;max-width:660px" role="img" aria-label="CFS 節流時間軸：上限 500m 的單執行緒工作跑 50ms 被暫停 50ms，110ms 才做完；上限 1000m 的四條執行緒 25ms 就把配額燒完，一起停 75ms">
<text x="245" y="24" text-anchor="middle" class="fg-t sm">第 1 個 100ms 週期</text>
<text x="495" y="24" text-anchor="middle" class="fg-t sm">第 2 個週期</text>
<line x1="120" y1="32" x2="120" y2="202" class="fg-l dim dash"/><line x1="370" y1="32" x2="370" y2="202" class="fg-l dim dash"/><line x1="620" y1="32" x2="620" y2="202" class="fg-l dim dash"/>
<text x="16" y="60" class="fg-t">上限 500m</text><text x="16" y="76" class="fg-t sm">單執行緒</text>
<rect x="120" y="46" width="125" height="30" rx="3" class="fg-b hot"/><text x="182" y="66" text-anchor="middle" class="fg-t">跑 50ms</text>
<rect x="245" y="46" width="125" height="30" rx="3" class="fg-b warm"/><text x="307" y="66" text-anchor="middle" class="fg-t">被暫停 50ms</text>
<rect x="370" y="46" width="25" height="30" rx="3" class="fg-b hot"/>
<text x="403" y="66" class="fg-t sm">110ms 才做完（沒上限只要 60ms）</text>
<text x="16" y="128" class="fg-t">上限 1000m</text><text x="16" y="144" class="fg-t sm">4 條執行緒</text>
<rect x="120" y="104" width="62" height="18" rx="3" class="fg-b hot"/><rect x="182" y="104" width="188" height="18" rx="3" class="fg-b warm"/><rect x="370" y="104" width="62" height="18" rx="3" class="fg-b hot"/><rect x="432" y="104" width="188" height="18" rx="3" class="fg-b warm"/>
<rect x="120" y="126" width="62" height="18" rx="3" class="fg-b hot"/><rect x="182" y="126" width="188" height="18" rx="3" class="fg-b warm"/><rect x="370" y="126" width="62" height="18" rx="3" class="fg-b hot"/><rect x="432" y="126" width="188" height="18" rx="3" class="fg-b warm"/>
<rect x="120" y="148" width="62" height="18" rx="3" class="fg-b hot"/><rect x="182" y="148" width="188" height="18" rx="3" class="fg-b warm"/><rect x="370" y="148" width="62" height="18" rx="3" class="fg-b hot"/><rect x="432" y="148" width="188" height="18" rx="3" class="fg-b warm"/>
<rect x="120" y="170" width="62" height="18" rx="3" class="fg-b hot"/><rect x="182" y="170" width="188" height="18" rx="3" class="fg-b warm"/><rect x="370" y="170" width="62" height="18" rx="3" class="fg-b hot"/><rect x="432" y="170" width="188" height="18" rx="3" class="fg-b warm"/>
<text x="151" y="117" text-anchor="middle" class="fg-t sm">跑 25ms</text>
<text x="276" y="117" text-anchor="middle" class="fg-t sm">四條一起停 75ms</text>
<line x1="120" y1="206" x2="620" y2="206" class="fg-l dim"/>
<text x="120" y="222" text-anchor="middle" class="fg-t sm">0</text><text x="245" y="222" text-anchor="middle" class="fg-t sm">50</text><text x="370" y="222" text-anchor="middle" class="fg-t sm">100</text><text x="495" y="222" text-anchor="middle" class="fg-t sm">150</text><text x="620" y="222" text-anchor="middle" class="fg-t sm">200 ms</text>
</svg><figcaption>綠色是在跑，橘色是配額用完、原地等下一個週期。配額是整個容器共用的，執行緒越多，燒得越快、等得越久。</figcaption></figure>
<p>上半部：一個請求需要 60ms 的 CPU，單執行緒。第一個週期跑了 50ms，配額用完，被暫停 50ms；第二個週期再跑 10ms 才做完。<b>本來 60ms 的工作，變成 110ms</b>。平均使用率卻看起來沒滿，因為整段時間平均下來真的沒用滿。</p>
<p>下半部更常見、也更兇：limit 1000m、四條執行緒同時忙，100ms 的配額 25ms 就燒完，四條一起停 75ms。Go、Java、Node.js 底下的 libuv 執行緒池、各種垃圾回收器，全都是多執行緒的。</p>
<h4>怎麼發現、怎麼處理</h4>
<ul>
<li>看 cAdvisor 的兩個指標：<code>container_cpu_cfs_throttled_periods_total</code> 除以 <code>container_cpu_cfs_periods_total</code>，就是「有幾成的週期被煞車」。超過幾個百分點，延遲就會受影響。</li>
<li>讓執行環境知道自己的上限。Go 在 1.25 之前預設開跟整台機器核心數一樣多的執行緒（<code>GOMAXPROCS</code>），64 核心的節點配 1 核心的上限，配額一下就燒光；舊版常用 Uber 的 <code>automaxprocs</code> 套件修正，1.25 起執行環境會自己參考 cgroup 的上限。JVM 從 JDK 10 起會偵測容器上限。</li>
<li>很多團隊的做法是：<b>CPU 只設 requests，不設 limits</b>。requests 會換算成 cgroup 的權重（<code>cpu.weight</code>），CPU 不夠分時按權重分，該拿的一定拿得到；機器有閒置的 CPU 時，大家還能借來用。這是正式環境最常見的取捨，但也有團隊為了成本控管或多租戶公平，仍然設上限。</li>
</ul>

<h3><span class="badge lv2">進階</span>五、記憶體上限與 OOMKilled</h3>
<p>CPU 時間可以等，記憶體不行。你沒辦法叫程式「先暫停用記憶體，下個週期再用」。所以記憶體上限是一道硬牆：用量碰到 <code>memory.max</code>，核心先試著回收這個容器的檔案快取（page cache）；回收不夠，就在這個 cgroup 裡挑行程直接 SIGKILL。結束碼是 137（128 + 9，9 就是 SIGKILL），<code>kubectl describe pod</code> 的 Last State 會寫 <code>OOMKilled</code>。</p>
<h4>OOMKilled 和 Evicted 不一樣</h4>
<table>
<tr><th>狀態</th><th>誰動手</th><th>為什麼</th><th>結果</th></tr>
<tr><td><b>OOMKilled</b></td><td>Linux 核心</td><td>容器超過<b>自己的</b>記憶體上限</td><td>同一個 Pod 裡的容器原地重啟</td></tr>
<tr><td><b>Evicted</b>（被驅逐）</td><td>kubelet</td><td>整台<b>節點</b>的記憶體或磁碟快不夠了</td><td>整個 Pod 結束，由 Deployment 在別處補一個</td></tr>
</table>
<p>kubelet 有一組驅逐門檻，Linux 上預設的硬門檻是：可用記憶體低於 100Mi，或根磁碟剩不到 10%。碰到了，它依序挑 Pod 驅逐：先挑用量超過自己 requests 的，再看 Pod 的優先順序（priority），最後看超過 requests 多少。所以 requests 設得誠實很重要：它不只是排程用的數字，也是搶記憶體時的護身符。</p>
<h4>程式語言的記憶體要跟上限對齊</h4>
<p>很多執行環境不知道容器上限，以為整台機器的記憶體都能用，垃圾回收器就不急著回收，直到撞牆被殺。常見對策：Node.js 用 <code>--max-old-space-size</code> 把 V8 的堆積上限設在容器上限的七成左右，留空間給堆積以外的記憶體；Go 1.19 起可以設 <code>GOMEMLIMIT</code>，讓 GC 接近上限時加緊回收；JVM 用 <code>-XX:MaxRAMPercentage</code>。記憶體的 request 和 limit，很多團隊直接設成一樣，避免「排程時以為夠、跑起來才發現不夠」。</p>

<h3><span class="badge lv3">專業</span>六、HPA 怎麼算：一步一步實算</h3>
<p>HorizontalPodAutoscaler（HPA）是控制平面裡的一個控制迴圈，預設每 15 秒醒來一次。核心只有一條公式：</p>
<pre><code>期望副本數 = ceil( 目前副本數 × 目前指標值 ÷ 目標指標值 )</code></pre>
<p>重點在「指標值」怎麼定義。用 CPU 使用率（utilization）時，它是<b>相對於 requests</b> 的百分比，不是相對於 limits，也不是相對於整台機器。沒設 CPU request 的 Pod，HPA 根本算不出使用率。</p>
<h4>實算一次</h4>
<p>猜高低遊戲的 API 跑 4 個 Pod，每個 CPU request 是 500m，HPA 目標是平均使用率 60%。</p>
<ol>
<li>晚上八點流量上來，每個 Pod 平均用 450m，也就是 450 ÷ 500 = 90%。期望副本數 = ceil(4 × 90 ÷ 60) = ceil(6) = 6。</li>
<li>擴到 6 個之後，總用量 4 × 450 = 1800m 攤給 6 個 Pod，每個 300m，剛好 60%。這就是公式的直覺：<b>總工作量不變，攤到更多 Pod 上，讓每個回到目標值</b>。</li>
<li>流量再漲一點，平均變 64%。比值 64 ÷ 60 ≈ 1.07。HPA 有 10% 的容忍度（tolerance），比值在 0.9 到 1.1 之間就不動，免得為了一點波動一直加減。</li>
<li>半夜流量掉到平均 20%。公式算出 ceil(6 × 20 ÷ 60) = 2。但縮減有 5 分鐘的穩定視窗（stabilization window）：HPA 取過去 5 分鐘內算出的<b>最大</b>建議值。流量要持續低 5 分鐘才真的縮，免得流量一波一波時反覆擴縮。</li>
</ol>
<h4>擴張的速度也有上限</h4>
<p>預設規則是：每 15 秒最多「加倍」或「加 4 個」，兩者取大的。假設 3 個 Pod 突然遇到十倍流量，公式算出要 30 個：</p>
<table>
<tr><th>時間</th><th>最多到</th><th>算法</th></tr>
<tr><td>0 秒</td><td>7</td><td>加倍是 6，加 4 是 7，取大的</td></tr>
<tr><td>15 秒</td><td>14</td><td>加倍是 14，加 4 是 11</td></tr>
<tr><td>30 秒</td><td>28</td><td>加倍是 28</td></tr>
<tr><td>45 秒</td><td>30</td><td>到達公式的目標（也不能超過 maxReplicas）</td></tr>
</table>
<p>這些規則都能在 HPA 的 <code>behavior</code> 欄位裡改。幾個實務細節：還沒就緒、或拿不到數據的 Pod，HPA 會用對擴縮最保守的假設去算；CPU 數據由 metrics-server 從各節點收集，本身就有十幾秒延遲；想用佇列長度、每秒請求數這類指標，要接 Prometheus Adapter 或 KEDA。最後一個大坑：用了 HPA，Deployment 的 YAML 就不要再寫 <code>replicas</code>，否則每次部署都會把 HPA 算好的副本數蓋回去。</p>

<h3><span class="badge lv3">專業</span>七、叢集自動擴展：為什麼要等好幾分鐘</h3>
<p>HPA 只會加 Pod，不會加機器。機器滿了，新的 Pod 就卡在 Pending，這時輪到叢集自動擴展器（Cluster Autoscaler，簡稱 CA）。它看的不是 CPU 使用率，而是「有沒有 Pod 因為排不下而 Pending」。有的話，它模擬：在某個節點群組加一台機器，這些 Pod 放不放得下？放得下，就呼叫雲端 API 把群組的機器數加一。</p>
<figure class="figure"><svg viewBox="0 0 680 222" class="fg" style="width:100%;max-width:680px" role="img" aria-label="流量暴增到新容量上線的接力時間軸：HPA 發現、新 Pod 排不下、CA 決定加機器、雲端開機、節點加入、拉映像檔、程式啟動，共約 220 秒">
<text x="150" y="33" text-anchor="end" class="fg-t">HPA 發現負載</text>
<rect x="160" y="20" width="62" height="18" rx="3" class="fg-b hot"/><text x="230" y="33" class="fg-t sm">15～30 秒</text>
<text x="150" y="57" text-anchor="end" class="fg-t">新 Pod 排不下</text>
<rect x="222" y="44" width="21" height="18" rx="3" class="fg-b warm"/><text x="251" y="57" class="fg-t sm">Pending</text>
<text x="150" y="81" text-anchor="end" class="fg-t">CA 決定加機器</text>
<rect x="243" y="68" width="21" height="18" rx="3" class="fg-b alt"/><text x="272" y="81" class="fg-t sm">約 10 秒</text>
<text x="150" y="105" text-anchor="end" class="fg-t">雲端開新機器</text>
<rect x="264" y="92" width="125" height="18" rx="3" class="fg-b alt"/><text x="397" y="105" class="fg-t sm">約 1 分鐘</text>
<text x="150" y="129" text-anchor="end" class="fg-t">節點加入、就緒</text>
<rect x="389" y="116" width="134" height="18" rx="3" class="fg-b alt"/><text x="531" y="129" class="fg-t sm">30～60 秒</text>
<text x="150" y="153" text-anchor="end" class="fg-t">拉映像檔</text>
<rect x="523" y="140" width="62" height="18" rx="3" class="fg-b"/><text x="593" y="153" class="fg-t sm">幾秒到幾分鐘</text>
<text x="150" y="177" text-anchor="end" class="fg-t">程式啟動、就緒</text>
<rect x="585" y="164" width="63" height="18" rx="3" class="fg-b hot"/><text x="577" y="177" text-anchor="end" class="fg-t sm warm">第 220 秒才接客</text>
<line x1="160" y1="196" x2="660" y2="196" class="fg-l dim"/>
<text x="160" y="212" text-anchor="middle" class="fg-t sm">0</text><text x="285" y="212" text-anchor="middle" class="fg-t sm">1 分</text><text x="410" y="212" text-anchor="middle" class="fg-t sm">2 分</text><text x="535" y="212" text-anchor="middle" class="fg-t sm">3 分</text><text x="660" y="212" text-anchor="middle" class="fg-t sm">4 分</text>
</svg><figcaption>從流量暴增到新容量能接客，是一場接力。HPA 那段只佔半分鐘，後面幾乎都在等機器。圖上的秒數是常見的量級，依雲端業者、機型和映像檔大小差很多。</figcaption></figure>
<p>這就是上一課說「要預留備用容量」的原因：機器還有空位時，HPA 加的 Pod 十幾秒就能上線；沒有空位時，就得等完這一整串。</p>
<h4>縮減與常見的對策</h4>
<ul>
<li><b>縮減</b>：一台節點上 Pod 的 requests 加總低於可分配量的 50%，上面的 Pod 都能搬到別台，持續 10 分鐘，CA 才會排空、關掉它（都是預設值）。被 PDB 擋著、用了本機儲存、或沒有控制器管理的 Pod，會讓節點縮不掉。</li>
<li><b>預先佔位</b>（overprovisioning）：跑一組優先順序很低、只會睡覺的佔位 Pod，替真正的 Pod 先佔著位子。真的 Pod 來了，排程器直接把佔位的擠掉（preemption），真 Pod 幾秒內就能啟動；被擠掉的佔位 Pod 變成 Pending，CA 在背景慢慢加機器。這是用錢換時間。</li>
<li><b>Karpenter</b>：AWS 起家的另一種做法，不透過固定的節點群組，直接依 Pending Pod 的需求開一台大小剛好的機器，通常比 CA 快一些，也比較會把零散的 Pod 併到少數機器上省錢。</li>
<li><b>映像檔要小</b>：新機器上沒有任何快取，一個 2 GB 的映像檔可能就要拉一兩分鐘。映像檔瘦身，直接縮短擴展時間。</li>
</ul>

<h3><span class="badge lv3">專業</span>八、滾動更新的兩個旋鈕</h3>
<p>Deployment 換版時，其實是建一個新的 ReplicaSet，一邊把新的往上加、一邊把舊的往下減。節奏由兩個參數決定：</p>
<ul>
<li><code>maxSurge</code>：最多可以比期望副本數<b>多</b>幾個 Pod。預設 25%，無條件進位。</li>
<li><code>maxUnavailable</code>：最多可以比期望副本數<b>少</b>幾個可用的。預設 25%，無條件捨去。兩個不能同時是 0。</li>
</ul>
<p>以 4 個副本、<code>maxSurge: 1</code>、<code>maxUnavailable: 0</code> 為例，追一次完整的換版：</p>
<figure class="figure"><svg viewBox="0 0 670 256" class="fg" style="width:100%;max-width:670px" role="img" aria-label="滾動更新九個步驟：每一輪先加一個 v2 Pod，等它就緒再刪一個 v1，可接流量始終是 4，Pod 總數在 4 和 5 之間">
<text x="16" y="92" class="fg-t">4 個副本</text>
<text x="16" y="110" class="fg-t sm">maxSurge 1</text>
<text x="16" y="124" class="fg-t sm">maxUnavailable 0</text>
<text x="152" y="26" text-anchor="middle" class="fg-t sm">開始</text><text x="212" y="26" text-anchor="middle" class="fg-t sm">加 1 新</text><text x="272" y="26" text-anchor="middle" class="fg-t sm">減 1 舊</text><text x="332" y="26" text-anchor="middle" class="fg-t sm">加 1 新</text><text x="392" y="26" text-anchor="middle" class="fg-t sm">減 1 舊</text><text x="452" y="26" text-anchor="middle" class="fg-t sm">加 1 新</text><text x="512" y="26" text-anchor="middle" class="fg-t sm">減 1 舊</text><text x="572" y="26" text-anchor="middle" class="fg-t sm">加 1 新</text><text x="632" y="26" text-anchor="middle" class="fg-t sm">減 1 舊</text>
<rect x="130" y="38" width="44" height="22" rx="4" class="fg-b alt"/><text x="152" y="53" text-anchor="middle" class="fg-t sm">v1</text>
<rect x="130" y="64" width="44" height="22" rx="4" class="fg-b alt"/><text x="152" y="79" text-anchor="middle" class="fg-t sm">v1</text>
<rect x="130" y="90" width="44" height="22" rx="4" class="fg-b alt"/><text x="152" y="105" text-anchor="middle" class="fg-t sm">v1</text>
<rect x="130" y="116" width="44" height="22" rx="4" class="fg-b alt"/><text x="152" y="131" text-anchor="middle" class="fg-t sm">v1</text>
<rect x="190" y="38" width="44" height="22" rx="4" class="fg-b alt"/><text x="212" y="53" text-anchor="middle" class="fg-t sm">v1</text>
<rect x="190" y="64" width="44" height="22" rx="4" class="fg-b alt"/><text x="212" y="79" text-anchor="middle" class="fg-t sm">v1</text>
<rect x="190" y="90" width="44" height="22" rx="4" class="fg-b alt"/><text x="212" y="105" text-anchor="middle" class="fg-t sm">v1</text>
<rect x="190" y="116" width="44" height="22" rx="4" class="fg-b alt"/><text x="212" y="131" text-anchor="middle" class="fg-t sm">v1</text>
<rect x="190" y="142" width="44" height="22" rx="4" class="fg-b hot dash"/><text x="212" y="157" text-anchor="middle" class="fg-t sm">啟動</text>
<rect x="250" y="38" width="44" height="22" rx="4" class="fg-b hot"/><text x="272" y="53" text-anchor="middle" class="fg-t sm acc">v2</text>
<rect x="250" y="64" width="44" height="22" rx="4" class="fg-b alt"/><text x="272" y="79" text-anchor="middle" class="fg-t sm">v1</text>
<rect x="250" y="90" width="44" height="22" rx="4" class="fg-b alt"/><text x="272" y="105" text-anchor="middle" class="fg-t sm">v1</text>
<rect x="250" y="116" width="44" height="22" rx="4" class="fg-b alt"/><text x="272" y="131" text-anchor="middle" class="fg-t sm">v1</text>
<rect x="310" y="38" width="44" height="22" rx="4" class="fg-b hot"/><text x="332" y="53" text-anchor="middle" class="fg-t sm acc">v2</text>
<rect x="310" y="64" width="44" height="22" rx="4" class="fg-b alt"/><text x="332" y="79" text-anchor="middle" class="fg-t sm">v1</text>
<rect x="310" y="90" width="44" height="22" rx="4" class="fg-b alt"/><text x="332" y="105" text-anchor="middle" class="fg-t sm">v1</text>
<rect x="310" y="116" width="44" height="22" rx="4" class="fg-b alt"/><text x="332" y="131" text-anchor="middle" class="fg-t sm">v1</text>
<rect x="310" y="142" width="44" height="22" rx="4" class="fg-b hot dash"/><text x="332" y="157" text-anchor="middle" class="fg-t sm">啟動</text>
<rect x="370" y="38" width="44" height="22" rx="4" class="fg-b hot"/><text x="392" y="53" text-anchor="middle" class="fg-t sm acc">v2</text>
<rect x="370" y="64" width="44" height="22" rx="4" class="fg-b hot"/><text x="392" y="79" text-anchor="middle" class="fg-t sm acc">v2</text>
<rect x="370" y="90" width="44" height="22" rx="4" class="fg-b alt"/><text x="392" y="105" text-anchor="middle" class="fg-t sm">v1</text>
<rect x="370" y="116" width="44" height="22" rx="4" class="fg-b alt"/><text x="392" y="131" text-anchor="middle" class="fg-t sm">v1</text>
<rect x="430" y="38" width="44" height="22" rx="4" class="fg-b hot"/><text x="452" y="53" text-anchor="middle" class="fg-t sm acc">v2</text>
<rect x="430" y="64" width="44" height="22" rx="4" class="fg-b hot"/><text x="452" y="79" text-anchor="middle" class="fg-t sm acc">v2</text>
<rect x="430" y="90" width="44" height="22" rx="4" class="fg-b alt"/><text x="452" y="105" text-anchor="middle" class="fg-t sm">v1</text>
<rect x="430" y="116" width="44" height="22" rx="4" class="fg-b alt"/><text x="452" y="131" text-anchor="middle" class="fg-t sm">v1</text>
<rect x="430" y="142" width="44" height="22" rx="4" class="fg-b hot dash"/><text x="452" y="157" text-anchor="middle" class="fg-t sm">啟動</text>
<rect x="490" y="38" width="44" height="22" rx="4" class="fg-b hot"/><text x="512" y="53" text-anchor="middle" class="fg-t sm acc">v2</text>
<rect x="490" y="64" width="44" height="22" rx="4" class="fg-b hot"/><text x="512" y="79" text-anchor="middle" class="fg-t sm acc">v2</text>
<rect x="490" y="90" width="44" height="22" rx="4" class="fg-b hot"/><text x="512" y="105" text-anchor="middle" class="fg-t sm acc">v2</text>
<rect x="490" y="116" width="44" height="22" rx="4" class="fg-b alt"/><text x="512" y="131" text-anchor="middle" class="fg-t sm">v1</text>
<rect x="550" y="38" width="44" height="22" rx="4" class="fg-b hot"/><text x="572" y="53" text-anchor="middle" class="fg-t sm acc">v2</text>
<rect x="550" y="64" width="44" height="22" rx="4" class="fg-b hot"/><text x="572" y="79" text-anchor="middle" class="fg-t sm acc">v2</text>
<rect x="550" y="90" width="44" height="22" rx="4" class="fg-b hot"/><text x="572" y="105" text-anchor="middle" class="fg-t sm acc">v2</text>
<rect x="550" y="116" width="44" height="22" rx="4" class="fg-b alt"/><text x="572" y="131" text-anchor="middle" class="fg-t sm">v1</text>
<rect x="550" y="142" width="44" height="22" rx="4" class="fg-b hot dash"/><text x="572" y="157" text-anchor="middle" class="fg-t sm">啟動</text>
<rect x="610" y="38" width="44" height="22" rx="4" class="fg-b hot"/><text x="632" y="53" text-anchor="middle" class="fg-t sm acc">v2</text>
<rect x="610" y="64" width="44" height="22" rx="4" class="fg-b hot"/><text x="632" y="79" text-anchor="middle" class="fg-t sm acc">v2</text>
<rect x="610" y="90" width="44" height="22" rx="4" class="fg-b hot"/><text x="632" y="105" text-anchor="middle" class="fg-t sm acc">v2</text>
<rect x="610" y="116" width="44" height="22" rx="4" class="fg-b hot"/><text x="632" y="131" text-anchor="middle" class="fg-t sm acc">v2</text>
<line x1="130" y1="176" x2="654" y2="176" class="fg-l dim"/>
<text x="16" y="198" class="fg-t">可接流量</text>
<text x="152" y="198" text-anchor="middle" class="fg-t acc">4</text><text x="212" y="198" text-anchor="middle" class="fg-t acc">4</text><text x="272" y="198" text-anchor="middle" class="fg-t acc">4</text><text x="332" y="198" text-anchor="middle" class="fg-t acc">4</text><text x="392" y="198" text-anchor="middle" class="fg-t acc">4</text><text x="452" y="198" text-anchor="middle" class="fg-t acc">4</text><text x="512" y="198" text-anchor="middle" class="fg-t acc">4</text><text x="572" y="198" text-anchor="middle" class="fg-t acc">4</text><text x="632" y="198" text-anchor="middle" class="fg-t acc">4</text>
<text x="16" y="222" class="fg-t">Pod 總數</text>
<text x="152" y="222" text-anchor="middle" class="fg-t">4</text><text x="212" y="222" text-anchor="middle" class="fg-t">5</text><text x="272" y="222" text-anchor="middle" class="fg-t">4</text><text x="332" y="222" text-anchor="middle" class="fg-t">5</text><text x="392" y="222" text-anchor="middle" class="fg-t">4</text><text x="452" y="222" text-anchor="middle" class="fg-t">5</text><text x="512" y="222" text-anchor="middle" class="fg-t">4</text><text x="572" y="222" text-anchor="middle" class="fg-t">5</text><text x="632" y="222" text-anchor="middle" class="fg-t">4</text>
<text x="392" y="248" text-anchor="middle" class="fg-t sm">每一輪：先加 1 個新的 → 等它就緒 → 才刪 1 個舊的</text>
</svg><figcaption>虛線框是還在啟動、還沒通過就緒的新 Pod。容量從頭到尾不掉，代價是過程中要多一個 Pod 的資源。新版一直起不來，就會停在「加 1 新」那一格，舊的照常服務。</figcaption></figure>
<p>這是最保守、正式環境最常用的設定。反過來，<code>maxSurge: 0</code>、<code>maxUnavailable: 1</code> 不需要多的資源，但換版期間少一台在服務，適合機器很緊、流量不高的時候。預設的 25%／25% 是折衷：10 個副本時，最多同時 13 個 Pod，最少保持 8 個可用。</p>
<h4>另外三個常被忽略的參數</h4>
<ul>
<li><code>minReadySeconds</code>（預設 0）：新 Pod 通過就緒之後，還要穩定撐過這麼多秒才算「可用」。設 10 到 30 秒，可以擋掉「一開始正常、跑幾秒就掛」的版本。</li>
<li><code>progressDeadlineSeconds</code>（預設 600）：換版 10 分鐘沒有進展，Deployment 會被標成失敗，<code>kubectl rollout status</code> 回傳錯誤。但 <b>Kubernetes 不會自動退版</b>，舊 Pod 繼續服務、新的卡在那裡，要你或你的部署工具去執行 <code>rollout undo</code>。</li>
<li><code>revisionHistoryLimit</code>（預設 10）：保留幾個舊的 ReplicaSet。<code>rollout undo</code> 退得回去，靠的就是它們還在。</li>
</ul>

<h3><span class="badge lv4">專家</span>九、一個 Pod 被刪掉的 30 秒：優雅關閉與端點競賽</h3>
<p>這是本章最重要的一節。很多團隊設好了就緒探測，也處理了 SIGTERM，每次部署還是有零星的 502。原因是：<b>Pod 被刪除時，「停止送流量」和「通知程式關機」是兩條同時開跑、互不等待的路</b>。</p>
<ol>
<li>你（或滾動更新、或排空節點）刪除 Pod。API server 記下刪除時間，狀態變成 Terminating，寬限期（預設 <code>terminationGracePeriodSeconds: 30</code>）從這一刻開始倒數。</li>
<li><b>第一條路</b>：那台節點的 kubelet 看到了，先執行 <code>preStop</code> hook（如果有），執行完才對每個容器的 1 號行程送出 SIGTERM。</li>
<li><b>第二條路</b>：EndpointSlice 控制器把這個 Pod 的端點標成「終止中」。這個變化要傳到<b>每一台</b>節點的 kube-proxy、Ingress 控制器、雲端負載平衡器，各自更新規則。快的幾百毫秒，慢的好幾秒。</li>
<li>寬限期到了，還沒結束的行程一律 SIGKILL。</li>
</ol>
<figure class="figure"><svg viewBox="0 0 680 290" class="fg" style="width:100%;max-width:680px" role="img" aria-label="刪除 Pod 後的兩種情況：沒有 preStop 時程式馬上關閉，其他節點的流量規則還沒更新，請求失敗；preStop 先睡 10 秒時，流量規則先更新完，再送 SIGTERM 收尾">
<text x="150" y="20" text-anchor="middle" class="fg-t sm">刪除 Pod（t=0）</text>
<text x="630" y="20" text-anchor="middle" class="fg-t sm warm">30 秒：SIGKILL</text>
<line x1="150" y1="28" x2="150" y2="256" class="fg-l dim dash"/><line x1="630" y1="28" x2="630" y2="256" class="fg-l dim dash"/>
<text x="12" y="48" class="fg-t warm">情況一：沒有 preStop</text>
<text x="140" y="75" text-anchor="end" class="fg-t sm">流量規則</text>
<rect x="150" y="62" width="48" height="18" rx="3" class="fg-b warm"/>
<text x="206" y="75" class="fg-t sm">其他節點還在送流量（約 3 秒）</text>
<text x="140" y="111" text-anchor="end" class="fg-t sm">你的程式</text>
<text x="156" y="93" class="fg-t sm warm">SIGTERM</text>
<rect x="150" y="98" width="16" height="18" rx="3" class="fg-b"/>
<text x="174" y="111" class="fg-t sm warm">馬上關掉監聽：這 2 秒的請求全部失敗</text>
<text x="12" y="152" class="fg-t acc">情況二：preStop 先睡 10 秒</text>
<text x="140" y="177" text-anchor="end" class="fg-t sm">流量規則</text>
<rect x="150" y="164" width="48" height="18" rx="3" class="fg-b alt"/>
<text x="206" y="177" class="fg-t sm">3 秒內全部更新完</text>
<text x="140" y="215" text-anchor="end" class="fg-t sm">你的程式</text>
<rect x="150" y="202" width="160" height="18" rx="3" class="fg-b alt"/><text x="230" y="215" text-anchor="middle" class="fg-t sm">preStop：照常服務</text>
<line x1="310" y1="188" x2="310" y2="224" class="fg-l warm"/><text x="316" y="197" class="fg-t sm warm">SIGTERM</text>
<rect x="310" y="202" width="96" height="18" rx="3" class="fg-b hot"/><text x="358" y="215" text-anchor="middle" class="fg-t sm">收尾</text>
<text x="414" y="215" class="fg-t sm acc">exit 0，沒有掉請求</text>
<text x="390" y="244" text-anchor="middle" class="fg-t sm">寬限期從 t=0 算起，preStop 也算在 30 秒裡</text>
<line x1="150" y1="262" x2="630" y2="262" class="fg-l dim"/>
<text x="150" y="280" text-anchor="middle" class="fg-t sm">0</text><text x="230" y="280" text-anchor="middle" class="fg-t sm">5</text><text x="310" y="280" text-anchor="middle" class="fg-t sm">10</text><text x="390" y="280" text-anchor="middle" class="fg-t sm">15</text><text x="470" y="280" text-anchor="middle" class="fg-t sm">20</text><text x="550" y="280" text-anchor="middle" class="fg-t sm">25</text><text x="630" y="280" text-anchor="middle" class="fg-t sm">30 秒</text>
</svg><figcaption>「停送流量」和「送 SIGTERM」同時開跑，誰先到沒有保證。preStop 先睡幾秒，讓每台節點的流量規則先更新完，程式才開始收尾。秒數是示意的量級。</figcaption></figure>
<p>情況一就是 502 的由來：SIGTERM 幾乎一瞬間就到，程式很守規矩地馬上關掉監聽，可是其他節點的轉送規則還沒更新，請求照樣送過來，撞上一個已經不收連線的 Pod。修法是讓程式在收到 SIGTERM 之前，多服務幾秒：</p>
<pre><code>spec:
  terminationGracePeriodSeconds: 45
  containers:
  - name: hilo-api
    lifecycle:
      preStop:
        sleep: { seconds: 10 }   # 1.30 起預設可用</code></pre>
<p>更舊的叢集沒有 <code>sleep</code> 這個寫法，要改用 <code>exec</code> 在容器裡執行 <code>sleep</code> 指令，前提是映像檔裡真的有這個指令。然後程式自己要把收尾做好。Node.js 的最小版本：</p>
<pre><code>process.on('SIGTERM', () =&gt; {
  // 不再接新連線，等進行中的請求做完
  server.close(() =&gt; process.exit(0));
  // 保險：25 秒還沒做完就自己結束
  setTimeout(() =&gt; process.exit(1), 25000).unref();
});</code></pre>
<p>Go 的 <code>http.Server</code> 有現成的 <code>Shutdown(ctx)</code>，會關掉監聽、關閉閒置連線、等進行中的請求結束。三個時間要對得起來：<b>preStop 的時間 + 收尾的最長時間 &lt; 寬限期</b>，因為寬限期從刪除那一刻算起，preStop 也算在裡面。</p>
<h4>兩個讓 SIGTERM 根本沒用的陷阱</h4>
<ul>
<li><b>1 號行程</b>：Linux 對每個 PID 命名空間裡的 1 號行程很特別：它沒有自己註冊處理函式的訊號，核心直接忽略，不套用「收到 SIGTERM 就結束」的預設行為。Node.js 當 1 號行程、又沒寫 <code>process.on('SIGTERM')</code>，就會對 SIGTERM 毫無反應，硬撐到寬限期結束被 SIGKILL。對策是自己處理 SIGTERM，或用 <code>tini</code> 這類小型 init 當 1 號行程。</li>
<li><b>外面包了一層 shell</b>：Dockerfile 寫 <code>CMD npm start</code>（shell 形式），1 號行程變成 <code>/bin/sh</code>，訊號不一定會轉給你的程式。改用 exec 形式 <code>CMD ["node", "server.js"]</code>，讓你的程式自己當 1 號行程。</li>
</ul>
<p>長連線要特別處理。WebSocket 或 gRPC 串流不會自己結束，<code>server.close()</code> 會一直等下去。收到 SIGTERM 時，應該主動通知用戶端「請重連」再關掉連線；用戶端重連時，自然會連到其他還活著的 Pod。</p>

<h3><span class="badge lv4">專家</span>十、PodDisruptionBudget：計畫性停機的煞車</h3>
<p>Pod 消失有兩類原因。<b>非自願中斷</b>（involuntary disruption）：機器當機、核心崩潰、整個可用區斷線。<b>自願中斷</b>（voluntary disruption）：你排空節點準備升級、CA 想縮掉一台機器、雲端業者要維修主機。PodDisruptionBudget（PDB）只管後者，而且只管走<b>驅逐 API</b>（Eviction API）的那些。</p>
<pre><code>apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: hilo-api }
spec:
  minAvailable: 2          # 也可以改寫成 maxUnavailable: 1
  selector:
    matchLabels: { app: hilo-api }</code></pre>
<p>3 個副本、<code>minAvailable: 2</code>。<code>kubectl drain</code> 對節點上的 Pod 逐一發出驅逐請求。第一個准了；如果第二個副本剛好也在這台機器上，這時只剩 2 個可用，再驅逐就低於 2，API server 回 429（Too Many Requests），drain 會一直重試，等被驅逐的那個在別台重新就緒才放行。</p>
<h4>PDB 擋不住的事，和它造成的事</h4>
<ul>
<li><b>擋不住</b>：直接 <code>kubectl delete pod</code>、刪掉 Deployment、節點當機，都不經過驅逐 API。滾動更新也不受 PDB 限制，它看的是自己的 <code>maxUnavailable</code>。</li>
<li><b>副本全在同一台，PDB 沒用</b>：3 個副本都排到同一台機器，那台一當機就全倒。要搭配 <code>topologySpreadConstraints</code>，把副本分散到不同節點，甚至不同可用區（<code>topology.kubernetes.io/zone</code>）。</li>
<li><b>造成卡死</b>：<code>minAvailable</code> 等於副本數，或單一副本配 <code>minAvailable: 1</code>，等於宣告「一個都不准動」。節點永遠排空不了，叢集升級整個卡住。這是維運團隊最常抱怨應用團隊的設定之一。</li>
<li><b>壞掉的 Pod 也會擋</b>：本來就沒就緒的 Pod，預設也算在預算裡，可能讓 drain 卡住。較新的版本可以設 <code>unhealthyPodEvictionPolicy: AlwaysAllow</code>，允許直接驅逐本來就不健康的 Pod。</li>
</ul>

<h3>十一、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>存活探測設越多越安全</td><td>存活探測是一把會自己扣扳機的槍。設錯了，它製造的停機比救回來的還多。不確定時，先只設就緒探測。</td></tr>
<tr><td>就緒探測失敗，Pod 會被重啟</td><td>就緒只管流量。Pod 繼續跑，恢復了就自動回到 Service 裡。</td></tr>
<tr><td>排程器會看機器現在有多忙</td><td>排程器只看 requests 的加總。實際用量再低，訂位滿了就是滿了。</td></tr>
<tr><td>CPU 使用率沒到上限，就不會被節流</td><td>使用率是一段時間的平均，節流發生在每 100ms 的週期裡。平均四成，尖峰時照樣被煞車。</td></tr>
<tr><td>HPA 的 CPU 百分比是對 limits 算的</td><td>是對 requests 算的。request 設太小，使用率會超過 100%，HPA 會擴得很兇。</td></tr>
<tr><td>設了 PDB，服務就不會中斷</td><td>PDB 只管走驅逐 API 的自願中斷。機器當機、直接刪 Pod、滾動更新都不受它限制。</td></tr>
<tr><td>程式處理了 SIGTERM，部署就不會掉請求</td><td>還要用 preStop 等端點移除傳到每一台節點，否則 SIGTERM 比流量規則先到。</td></tr>
</table>

<h3>十二、跟你的工作連起來</h3>
<ul>
<li><b>Node.js／Go 後端</b>：做兩個端點。<code>/alive</code> 只回「行程還活著」，什麼都不檢查；<code>/ready</code> 檢查自己的初始化有沒有完成，收到 SIGTERM 之後立刻改回失敗。再加上 SIGTERM 處理和對齊容器上限的記憶體參數，你的服務就比大多數服務守規矩。</li>
<li><b>本機用 Docker 先驗證</b>：<code>docker stop</code> 也是先送 SIGTERM，預設等 10 秒再 SIGKILL。如果你的容器每次 stop 都剛好卡 10 秒，就代表程式根本沒理 SIGTERM，上了 Kubernetes 一樣會出問題。</li>
<li><b>前端靜態網站</b>：就算容器裡只是 nginx 放著 Vue 打包好的檔案，也一樣有端點競賽的問題。加個幾秒的 preStop，部署時就不會有使用者剛好拿到錯誤頁。</li>
<li><b>即時對戰的遊戲伺服器</b>：滾動更新會把房間裡的玩家踢掉。常見做法是寬限期設長（幾分鐘）、收到 SIGTERM 後不再分配新房間、等現有房間打完才結束；房間型的遊戲伺服器也常交給專門的控制器管理，本模組最後一課「正式環境裡的 Kubernetes」的深入圖解會提到。</li>
<li><b>雲端帳單</b>：requests 直接決定叢集需要幾台機器。requests 抓得比實際高一倍，你就多付一倍的機器錢。定期拿實際用量回頭校正 requests，是最划算的省錢工作。</li>
</ul>

<h3>十三、面試會怎麼問</h3>
<p>這些題目在 DevOps、SRE、後端面試裡很常出現。先自己出聲講一遍，再打開參考答案。</p>
<ol>
<li>「liveness、readiness、startup 三種探針差在哪？什麼情況你會刻意不設存活探測？」</li>
<li>「服務的 p99 延遲很高，可是監控上 CPU 使用率只有上限的四成。你會懷疑什麼？怎麼證明？」</li>
<li>「說說 Kubernetes 的 QoS 等級。節點記憶體不夠時，誰先被處理？」</li>
<li>「HPA 目前 3 個副本、目標 CPU 50%、實際平均 80%，它會擴到幾個？為什麼流量掉了它不馬上縮？」</li>
<li>「我們每次部署都有零星的 502，探針都設了，程式也處理了 SIGTERM。可能是什麼原因？」</li>
<li>「kubectl drain 一直卡住不動，你會查什麼？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>存活探測失敗會重啟容器，用來處理死結這種「自己好不了」的狀態；就緒探測失敗只把 Pod 從 Service 的端點拿掉，不重啟，用來表示暫時不能接流量；啟動探測在成功之前會暫停另外兩種，保護啟動慢的程式。如果程式卡住時自己會崩潰退出，或我沒辦法寫出一個「只反映行程本身」的輕量檢查，我寧可不設存活探測，因為設錯的存活探測會在高負載時引發連鎖重啟。</li>
<li>懷疑 CFS 節流。使用率是平均值，但 CPU 上限是每 100ms 一個週期在執行，多執行緒程式可能在週期的前段就把配額燒完，剩下時間全部暫停。證明方法是看 <code>container_cpu_cfs_throttled_periods_total</code> 對總週期數的比例；處理方法是讓執行環境的執行緒數符合上限、調高上限，或只設 requests 不設 CPU limits。</li>
<li>Guaranteed 是每個容器 CPU 和記憶體的 request 都等於 limit；Burstable 是有設一部分；BestEffort 完全沒設。節點記憶體壓力時，kubelet 先驅逐用量超過自己 requests 的 Pod，再依優先順序和超出的量排序，所以 BestEffort 通常最先走，Guaranteed 最後。真的耗盡時，核心的 OOM killer 會依 <code>oom_score_adj</code> 挑行程，QoS 也決定了這個分數。</li>
<li>ceil(3 × 80 ÷ 50) = ceil(4.8) = 5 個。縮減有預設 5 分鐘的穩定視窗，HPA 取這段期間內最大的建議值，避免流量起伏時反覆擴縮；而且使用率是相對於 requests 計算的。</li>
<li>端點移除和 SIGTERM 是平行發生的。程式收到 SIGTERM 就關掉監聽，但其他節點的 kube-proxy 或負載平衡器還沒更新完，請求仍然送到這個 Pod。解法是加 preStop 先等幾秒，讓端點移除傳開，再開始優雅關閉，並確認寬限期大於 preStop 加收尾的時間。另外也要檢查長連線有沒有被處理、1 號行程有沒有真的收到訊號。</li>
<li>先看是哪個 Pod 驅逐不掉，通常是 PDB：<code>kubectl get pdb -A</code> 看 ALLOWED DISRUPTIONS 是不是 0，例如單一副本配 minAvailable 1，或有副本本來就沒就緒。也可能是 Pod 用了 emptyDir 需要加 <code>--delete-emptydir-data</code>、是 DaemonSet 需要 <code>--ignore-daemonsets</code>，或是 Pod 沒有控制器管理。處理方式是先擴副本或修好壞的 Pod，而不是直接刪 PDB。</li>
</ol>
</details>

<h3>十四、練功題（做得出來才算真的懂）</h3>
<ol>
<li>就緒探測 <code>periodSeconds: 5</code>、<code>failureThreshold: 2</code>，存活探測 <code>periodSeconds: 15</code>、<code>failureThreshold: 4</code>，兩者 <code>timeoutSeconds</code> 都是 2。程式剛通過一次檢查就卡住，最慢多久停流量？多久重啟？</li>
<li>一個服務平常 40 秒開機，最慢可能要 100 秒。寫出它的 startupProbe 和 livenessProbe 時間參數。</li>
<li>CPU limit 是 200m，一個單執行緒的工作需要 50ms 的 CPU。從 0ms 開始，它幾 ms 才做完？</li>
<li>HPA 目前 10 個副本，目標 70%，實際平均 35%，<code>minReplicas</code> 是 6。它最後會變成幾個？大約什麼時候？</li>
<li>一個 10 副本的 Deployment 用預設的滾動更新設定。換版過程中，Pod 總數最多幾個？可用的最少幾個？</li>
<li>你的服務 preStop 睡 10 秒，最慢的請求要 20 秒。寬限期該設多少？把刪除後發生的事依序寫出來。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>就緒：第 5 秒和第 10 秒兩次失敗，最後一次最多等 2 秒，約 12 秒停流量。存活：第 15、30、45、60 秒四次失敗，約 62 秒重啟。</li>
<li>例如 startupProbe <code>periodSeconds: 5</code>、<code>failureThreshold: 24</code>，給到 120 秒，比最慢的 100 秒多一點餘裕；livenessProbe 維持 <code>periodSeconds: 10</code>、<code>failureThreshold: 3</code>，開機後卡住 30 秒左右就重啟。重點是不用為了慢開機去拉長存活探測。</li>
<li>每 100ms 配額 20ms。0～20ms 跑，等到 100ms；100～120ms 跑，等到 200ms；200～210ms 跑完最後 10ms。總共 210ms，是沒有上限時的四倍多。</li>
<li>公式 ceil(10 × 35 ÷ 70) = 5，但不能低於 minReplicas，所以是 6。因為縮減有 5 分鐘穩定視窗，要等使用率持續偏低大約 5 分鐘後才會縮。</li>
<li>maxSurge 25% 無條件進位是 3，最多 13 個；maxUnavailable 25% 無條件捨去是 2，最少 8 個可用。</li>
<li>preStop 10 秒加收尾 20 秒是 30 秒，再留點餘裕，設 40 到 45 秒。順序：刪除、狀態變 Terminating、寬限期開始倒數；同時端點被標成終止中並傳到各節點，kubelet 執行 preStop 睡 10 秒；然後送 SIGTERM，程式關閉監聽、等進行中的請求做完、結束；如果寬限期到了還沒結束，SIGKILL。</li>
</ol>
</details>

<h3>十五、想再挖深</h3>
<ul>
<li><b>Kubernetes 官方文件：Pod Lifecycle 與 Configure Liveness, Readiness and Startup Probes</b>（<a href="https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/">kubernetes.io</a>）：Pod 終止流程、探針參數的權威說明，本章第三節和第九節的出處。</li>
<li><b>Kubernetes 官方文件：Horizontal Pod Autoscaling</b>（<a href="https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/">kubernetes.io</a>）：演算法、容忍度、<code>behavior</code> 欄位的完整規則。</li>
<li><b>Cluster Autoscaler FAQ</b>（<a href="https://github.com/kubernetes/autoscaler/blob/master/cluster-autoscaler/FAQ.md">GitHub kubernetes/autoscaler</a>）：什麼情況會擴、什麼情況縮不掉，寫得非常完整。</li>
<li><b>Linux 核心文件：CFS Bandwidth Control</b>（<a href="https://docs.kernel.org/scheduler/sched-bwc.html">docs.kernel.org</a>）：配額與週期的原始設計，讀完就知道節流為什麼長那樣。</li>
<li><b>Bilgin Ibryam、Roland Huß《Kubernetes Patterns》</b>（O'Reilly）：其中 Predictable Demands、Health Probe、Managed Lifecycle 幾章，正好對應本章的資源、探針與優雅關閉。</li>
</ul>
` });
