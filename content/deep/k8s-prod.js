DEEP({ 'k8s-prod': `
<p>上一課列出了「能被放心交付一個叢集的人」要懂的範圍：網路、權限、Pod 安全、多租戶、升級、擴充、常見故障。這一章一項一項拆到機制：封包從一個 Pod 到另一台機器上的 Pod，中間經過了什麼；NetworkPolicy 的規則到底怎麼組合；為什麼「能建 Pod」幾乎等於「能讀 Secret」；升級時哪些版本可以混著跑；Operator 為什麼能把維運經驗寫成程式；服務網格的代價是什麼；最後是一份照著走就能定位大部分問題的除錯手冊。這是 CKA、CKS 考試和資深面試的程度，也是半夜叢集出事時你真正用得上的東西。</p>

<h3><span class="badge lv1">基礎</span>一、叢集網路的三條規則</h3>
<p>想像一棟辦公大樓。每張桌子都有自己的分機號碼，任何一張桌子都能直接撥給任何一張桌子，中間沒有總機幫你改號碼。不管對方在三樓還是十樓，撥的都是同一個號碼，接起來看到的也是你真正的號碼。</p>
<p>Kubernetes 的網路模型就是這樣，只有三條規則：</p>
<ol>
<li>每個 Pod 都有自己獨一無二的 IP。</li>
<li>任何 Pod 都能直接連到任何 Pod，不管在不在同一台節點，中間<b>不做 NAT</b>，對方看到的來源 IP 就是你的 Pod IP。</li>
<li>節點上的代理程式（例如 kubelet）能連到這台節點上的所有 Pod。</li>
</ol>
<p>Kubernetes 自己不實作這些規則，它把工作交給 <b>CNI</b> 外掛（Container Network Interface）。每次建立 Pod，CNI 外掛會建一個獨立的網路命名空間、接一對虛擬網線（veth pair）把 Pod 和主機連起來、從這台節點的 Pod 網段裡分配一個 IP，再設好路由。</p>
<figure class="figure"><svg viewBox="0 0 680 272" class="fg" style="width:100%;max-width:680px" role="img" aria-label="兩台節點上的 Pod 各有自己的 IP；從節點 1 的 Pod A 到節點 2 的 Pod C，封包經過 veth、主機路由表、網卡，跨到節點 2 後反向走回 Pod C">
<rect x="10" y="20" width="320" height="226" rx="10" class="fg-b"/>
<text x="24" y="42" class="fg-t lg">節點 1</text>
<rect x="40" y="52" width="140" height="48" rx="6" class="fg-b hot"/><text x="110" y="72" text-anchor="middle" class="fg-t acc">Pod A</text><text x="110" y="90" text-anchor="middle" class="fg-t sm mono">10.244.1.5</text>
<rect x="200" y="52" width="110" height="48" rx="6" class="fg-b"/><text x="255" y="72" text-anchor="middle" class="fg-t">Pod B</text><text x="255" y="90" text-anchor="middle" class="fg-t sm mono">10.244.1.6</text>
<rect x="40" y="136" width="270" height="40" rx="6" class="fg-b"/><text x="175" y="161" text-anchor="middle" class="fg-t sm">主機路由：10.244.2.0/24 → 節點 2</text>
<rect x="40" y="200" width="270" height="34" rx="6" class="fg-b alt"/><text x="175" y="222" text-anchor="middle" class="fg-t sm">網卡 eth0　10.0.1.10</text>
<line x1="110" y1="100" x2="110" y2="128" class="fg-l on"/><polygon points="110,136 105.5,128 114.5,128" class="fg-a on"/>
<text x="118" y="122" class="fg-t sm">veth</text>
<line x1="110" y1="176" x2="110" y2="192" class="fg-l on"/><polygon points="110,200 105.5,192 114.5,192" class="fg-a on"/>
<rect x="350" y="20" width="320" height="226" rx="10" class="fg-b"/>
<text x="364" y="42" class="fg-t lg">節點 2</text>
<rect x="380" y="52" width="140" height="48" rx="6" class="fg-b hot"/><text x="450" y="72" text-anchor="middle" class="fg-t acc">Pod C</text><text x="450" y="90" text-anchor="middle" class="fg-t sm mono">10.244.2.7</text>
<rect x="540" y="52" width="110" height="48" rx="6" class="fg-b"/><text x="595" y="72" text-anchor="middle" class="fg-t">Pod D</text><text x="595" y="90" text-anchor="middle" class="fg-t sm mono">10.244.2.8</text>
<rect x="380" y="136" width="270" height="40" rx="6" class="fg-b"/><text x="515" y="161" text-anchor="middle" class="fg-t sm">主機路由：10.244.2.7 → Pod C 的 veth</text>
<rect x="380" y="200" width="270" height="34" rx="6" class="fg-b alt"/><text x="515" y="222" text-anchor="middle" class="fg-t sm">網卡 eth0　10.0.1.11</text>
<line x1="450" y1="200" x2="450" y2="184" class="fg-l on"/><polygon points="450,176 445.5,184 454.5,184" class="fg-a on"/>
<line x1="450" y1="136" x2="450" y2="108" class="fg-l on"/><polygon points="450,100 445.5,108 454.5,108" class="fg-a on"/>
<text x="458" y="122" class="fg-t sm">veth</text>
<line x1="310" y1="217" x2="372" y2="217" class="fg-l on"/><polygon points="380,217 372,212.5 372,221.5" class="fg-a on"/>
<text x="340" y="264" text-anchor="middle" class="fg-t sm">節點之間：VXLAN 封裝，或雲端 VPC、BGP 直接路由</text>
</svg><figcaption>Pod A 送給 10.244.2.7 的封包，經過自己的 veth 到主機，主機查路由知道它在節點 2，從網卡送出；節點 2 收到後再交給 Pod C 的 veth。全程不改位址，Pod C 看到的來源就是 10.244.1.5。</figcaption></figure>
<p>節點之間怎麼送，是各家 CNI 的主要差別：</p>
<ul>
<li><b>封裝</b>（overlay，例如 Flannel 預設的 VXLAN）：把 Pod 的封包整個包進一個節點對節點的 UDP 封包裡。底下的網路完全不用知道 Pod 網段，最容易架，代價是每個封包多大約 50 位元組的標頭，Pod 的 MTU 要跟著調小，不然會出現「小請求正常、大回應卡住」的怪問題。</li>
<li><b>直接路由</b>：Calico 可以用 BGP 把各節點的 Pod 網段告訴路由器；AWS 的 VPC CNI 則直接從 VPC 分配真的 IP 給 Pod，Pod 在 VPC 裡是一等公民。代價是每台機器能掛的 IP 數量有限，所以一台節點最多能跑幾個 Pod，會被機型限制。</li>
<li><b>eBPF</b>（例如 Cilium）：在核心裡用 eBPF 程式處理轉送和政策，效能好，也能看到很細的流量資訊。</li>
</ul>

<h3><span class="badge lv2">進階</span>二、一個請求從 Pod 到 Service 再到 Pod</h3>
<p>Pod 很少直接連另一個 Pod 的 IP，因為 Pod 隨時會換。它連的是 Service。拿 Pod A 裡的程式呼叫 <code>http://web.shop.svc.cluster.local</code> 來追：</p>
<figure class="figure"><svg viewBox="0 0 680 236" class="fg" style="width:100%;max-width:680px" role="img" aria-label="Pod A 先向 CoreDNS 查名字拿到 ClusterIP，再連 ClusterIP；本機的 kube-proxy 規則依 EndpointSlice 把目的地 DNAT 成某個 Pod 的 IP，回程由 conntrack 換回">
<rect x="20" y="20" width="130" height="50" rx="6" class="fg-b alt"/><text x="85" y="41" text-anchor="middle" class="fg-t">CoreDNS</text><text x="85" y="59" text-anchor="middle" class="fg-t sm mono">10.96.0.10</text>
<rect x="20" y="110" width="130" height="56" rx="6" class="fg-b hot"/><text x="85" y="133" text-anchor="middle" class="fg-t acc">Pod A 的程式</text><text x="85" y="152" text-anchor="middle" class="fg-t sm">連 web.shop…</text>
<line x1="75" y1="110" x2="75" y2="78" class="fg-l"/><polygon points="75,70 70.5,78 79.5,78" class="fg-a"/>
<text x="69" y="94" text-anchor="end" class="fg-t sm">① 查名字</text>
<line x1="120" y1="70" x2="120" y2="102" class="fg-l alt"/><polygon points="120,110 115.5,102 124.5,102" class="fg-a alt"/>
<text x="128" y="94" class="fg-t sm alt">回 10.96.12.34</text>
<rect x="260" y="20" width="200" height="50" rx="6" class="fg-b alt"/><text x="360" y="41" text-anchor="middle" class="fg-t">EndpointSlice</text><text x="360" y="59" text-anchor="middle" class="fg-t sm">web 目前 3 個就緒端點</text>
<line x1="360" y1="70" x2="360" y2="102" class="fg-l dash"/><polygon points="360,110 355.5,102 364.5,102" class="fg-a"/>
<text x="368" y="94" class="fg-t sm">監看更新</text>
<rect x="260" y="110" width="200" height="56" rx="6" class="fg-b warm"/><text x="360" y="133" text-anchor="middle" class="fg-t">本機的 kube-proxy 規則</text><text x="360" y="152" text-anchor="middle" class="fg-t sm">iptables、IPVS 或 eBPF</text>
<line x1="150" y1="138" x2="252" y2="138" class="fg-l on"/><polygon points="260,138 252,133.5 252,142.5" class="fg-a on"/>
<text x="205" y="130" text-anchor="middle" class="fg-t sm acc">② 連 ClusterIP</text>
<rect x="530" y="110" width="130" height="56" rx="6" class="fg-b hot"/><text x="595" y="133" text-anchor="middle" class="fg-t acc">Pod C</text><text x="595" y="152" text-anchor="middle" class="fg-t sm mono">10.244.2.7:8080</text>
<line x1="460" y1="138" x2="522" y2="138" class="fg-l on"/><polygon points="530,138 522,133.5 522,142.5" class="fg-a on"/>
<text x="495" y="130" text-anchor="middle" class="fg-t sm acc">③ DNAT</text>
<text x="340" y="200" text-anchor="middle" class="fg-t sm">④ 回程：conntrack 記得這條連線，把來源換回 10.96.12.34</text>
<text x="340" y="222" text-anchor="middle" class="fg-t sm warm">ClusterIP 不屬於任何網卡，它只存在於每台節點的轉送規則裡</text>
</svg><figcaption>Service 的「虛擬 IP」沒有任何機器在聽。是 Pod A 所在節點上的規則，在封包出門前就把目的地改寫成某個真的 Pod。</figcaption></figure>
<ol>
<li><b>查名字</b>：Pod 裡的 <code>/etc/resolv.conf</code> 是 kubelet 寫好的，指向 CoreDNS 的 ClusterIP。CoreDNS 回應 web 這個 Service 的 ClusterIP。</li>
<li><b>連 ClusterIP</b>：程式對 <code>10.96.12.34:80</code> 發出連線。這個 IP 不在任何網卡上，所以 ping 它通常沒反應，但連 Service 定義的連接埠會通。</li>
<li><b>改寫目的地</b>：在 iptables 模式下，kube-proxy 在每台節點寫了一串規則：目的地是這個 ClusterIP 的封包，用機率隨機挑一個端點，把目的地改寫（DNAT）成 <code>10.244.2.7:8080</code>。接下來就是第一節的 Pod 對 Pod 路由。</li>
<li><b>回程</b>：核心的連線追蹤表（conntrack）記得這條連線，Pod C 的回應回來時，自動把來源換回 ClusterIP，Pod A 完全不知道中間被改過。</li>
</ol>
<h4>兩個在大叢集才會遇到的坑</h4>
<pre><code>nameserver 10.96.0.10
search shop.svc.cluster.local svc.cluster.local cluster.local
options ndots:5</code></pre>
<ul>
<li><b>ndots:5</b>：名字裡的點少於 5 個，就先當成「短名字」，依序接上 search 清單去查。所以查 <code>api.example.com</code>（只有 2 個點）時，會先查 <code>api.example.com.shop.svc.cluster.local</code>、再查下一個……全部失敗才查真正的名字，而且 IPv4 和 IPv6 各查一次。一個外部呼叫變成六到八個 DNS 查詢，CoreDNS 被打爆，延遲忽高忽低。對策：外部網域在程式裡寫成結尾加點的完整名稱（<code>api.example.com.</code>）、在 Pod 的 <code>dnsConfig</code> 把 ndots 調小，或部署 NodeLocal DNSCache 在每台節點做快取。</li>
<li><b>規則數量和 conntrack</b>：iptables 規則是一條一條比對的，上萬個 Service 和端點時，更新和比對都變慢；這時會改用 IPVS、較新的 nftables 模式，或 Cilium 這類 eBPF 方案。conntrack 表也有上限，滿了之後新連線會被丟掉，節點的核心日誌會出現 <code>nf_conntrack: table full</code>。</li>
</ul>

<h3><span class="badge lv2">進階</span>三、NetworkPolicy：Pod 之間的防火牆怎麼算</h3>
<p>NetworkPolicy 的規則有三個重點，大部分的誤用都來自搞錯其中一個：</p>
<ol>
<li><b>沒被任何政策選中的 Pod，完全開放</b>。只要有一條政策用 <code>podSelector</code> 選中了某個 Pod，那個方向（進或出）就變成「只允許政策裡列出的」。</li>
<li><b>政策只能「允許」，而且會相加</b>。標準 API 裡沒有「拒絕」規則，多條政策選中同一個 Pod，允許的範圍取聯集。</li>
<li><b>要有支援它的 CNI 才會生效</b>。Calico、Cilium 會執行；單用 Flannel 時，政策物件建得進去，但什麼都不會擋。這是最危險的一種「看起來有設」。</li>
</ol>
<figure class="figure"><svg viewBox="0 0 660 230" class="fg" style="width:100%;max-width:660px" role="img" aria-label="shop 命名空間預設全部拒絕；web 到 api 的 8080 和 api 到 db 的 5432 被允許；web 直接連 db 和 dev 命名空間的 debug Pod 連 api 都被拒絕">
<rect x="10" y="20" width="470" height="200" rx="10" class="fg-b dash"/>
<text x="24" y="40" class="fg-t sm">Namespace shop：預設全部拒絕</text>
<rect x="30" y="90" width="100" height="50" rx="6" class="fg-b"/><text x="80" y="111" text-anchor="middle" class="fg-t">web</text><text x="80" y="129" text-anchor="middle" class="fg-t sm mono">app=web</text>
<rect x="200" y="90" width="100" height="50" rx="6" class="fg-b alt"/><text x="250" y="111" text-anchor="middle" class="fg-t">api</text><text x="250" y="129" text-anchor="middle" class="fg-t sm mono">app=api</text>
<rect x="370" y="90" width="100" height="50" rx="6" class="fg-b"/><text x="420" y="111" text-anchor="middle" class="fg-t">db</text><text x="420" y="129" text-anchor="middle" class="fg-t sm mono">app=db</text>
<line x1="130" y1="108" x2="192" y2="108" class="fg-l on"/><polygon points="200,108 192,103.5 192,112.5" class="fg-a on"/>
<text x="165" y="100" text-anchor="middle" class="fg-t sm acc">允許 8080</text>
<line x1="300" y1="108" x2="362" y2="108" class="fg-l on"/><polygon points="370,108 362,103.5 362,112.5" class="fg-a on"/>
<text x="335" y="100" text-anchor="middle" class="fg-t sm acc">允許 5432</text>
<path d="M80 140 V180 H420 V148" class="fg-l warm dash"/><polygon points="420,140 415.5,148 424.5,148" class="fg-a warm"/>
<line x1="242" y1="172" x2="258" y2="188" class="fg-l warm"/><line x1="258" y1="172" x2="242" y2="188" class="fg-l warm"/>
<text x="250" y="206" text-anchor="middle" class="fg-t sm warm">web 直連 db：沒有規則允許</text>
<rect x="510" y="70" width="140" height="100" rx="10" class="fg-b dash"/>
<text x="522" y="162" class="fg-t sm">Namespace dev</text>
<rect x="530" y="100" width="100" height="44" rx="6" class="fg-b"/><text x="580" y="127" text-anchor="middle" class="fg-t">debug</text>
<path d="M580 100 V58 H270 V82" class="fg-l warm dash"/><polygon points="270,90 265.5,82 274.5,82" class="fg-a warm"/>
<line x1="412" y1="50" x2="428" y2="66" class="fg-l warm"/><line x1="428" y1="50" x2="412" y2="66" class="fg-l warm"/>
<text x="500" y="54" class="fg-t sm warm">跨 Namespace：拒絕</text>
</svg><figcaption>綠色是政策明確允許的路，橘色虛線是被預設拒絕擋下的。「預設拒絕」不是一個開關，而是一條選中所有 Pod、卻什麼都不允許的政策。</figcaption></figure>
<p>先寫一條「選中所有 Pod、什麼都不允許」的政策，再一條一條打開：</p>
<pre><code>apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: default-deny, namespace: shop }
spec:
  podSelector: {}         # 空的：選中全部 Pod
  policyTypes: [Ingress, Egress]
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: api-from-web, namespace: shop }
spec:
  podSelector: { matchLabels: { app: api } }
  policyTypes: [Ingress]
  ingress:
  - from:
    - podSelector: { matchLabels: { app: web } }
    ports:
    - { protocol: TCP, port: 8080 }</code></pre>
<h4>最常漏掉的三件事</h4>
<ul>
<li><b>出去的方向也要開</b>：預設拒絕連 Egress 也擋了，所以除了 api 的 Ingress 允許 web，web 的 Egress 也要允許連 api。兩邊都開，連線才會通。</li>
<li><b>DNS</b>：擋了 Egress，Pod 連 CoreDNS 也被擋，所有用名字的連線都會失敗，看起來像「整個網路壞了」。要另外允許連 <code>kube-system</code> 裡 DNS 的 UDP 和 TCP 53 埠。</li>
<li><b>AND 和 OR</b>：在同一個 <code>from</code> 項目裡同時寫 <code>namespaceSelector</code> 和 <code>podSelector</code>，代表「那個 Namespace 裡、而且有這個標籤的 Pod」；寫成兩個項目（各自前面一個 <code>-</code>），代表「那個 Namespace 的任何 Pod，<b>或</b>本 Namespace 有這個標籤的 Pod」。YAML 裡差一個減號，權限差很多。選 Namespace 時可以用每個 Namespace 都自動有的標籤 <code>kubernetes.io/metadata.name</code>。</li>
</ul>
<p>還要記得 NetworkPolicy 只看 IP 和連接埠，不懂 HTTP 路徑。「只允許 GET /scores」這種規則，要靠服務網格或 Cilium 的 L7 政策。</p>

<h3><span class="badge lv3">專業</span>四、RBAC 與服務帳號</h3>
<p>每一個打到 API server 的請求，不管來自你的 kubectl 還是 Pod 裡的程式，都要過三道關卡才會被寫進 etcd：</p>
<figure class="figure"><svg viewBox="0 0 670 236" class="fg" style="width:100%;max-width:670px" role="img" aria-label="API 請求依序經過認證、RBAC 授權、准入控制，才寫進 etcd；授權這一關查的是 ServiceAccount、RoleBinding 和 Role 三樣東西">
<rect x="12" y="30" width="112" height="56" rx="6" class="fg-b"/><text x="68" y="53" text-anchor="middle" class="fg-t">請求</text><text x="68" y="72" text-anchor="middle" class="fg-t sm">人或 Pod</text>
<line x1="124" y1="58" x2="136" y2="58" class="fg-l"/><polygon points="144,58 136,53.5 136,62.5" class="fg-a"/>
<rect x="144" y="30" width="112" height="56" rx="6" class="fg-b"/><text x="200" y="53" text-anchor="middle" class="fg-t">認證</text><text x="200" y="72" text-anchor="middle" class="fg-t sm">你是誰</text>
<line x1="256" y1="58" x2="268" y2="58" class="fg-l"/><polygon points="276,58 268,53.5 268,62.5" class="fg-a"/>
<rect x="276" y="30" width="112" height="56" rx="6" class="fg-b hot"/><text x="332" y="53" text-anchor="middle" class="fg-t acc">授權 RBAC</text><text x="332" y="72" text-anchor="middle" class="fg-t sm">能不能做</text>
<line x1="388" y1="58" x2="400" y2="58" class="fg-l"/><polygon points="408,58 400,53.5 400,62.5" class="fg-a"/>
<rect x="408" y="30" width="112" height="56" rx="6" class="fg-b"/><text x="464" y="53" text-anchor="middle" class="fg-t">准入控制</text><text x="464" y="72" text-anchor="middle" class="fg-t sm">改寫、檢查內容</text>
<line x1="520" y1="58" x2="532" y2="58" class="fg-l"/><polygon points="540,58 532,53.5 532,62.5" class="fg-a"/>
<rect x="540" y="30" width="112" height="56" rx="6" class="fg-b alt"/><text x="596" y="53" text-anchor="middle" class="fg-t">寫進 etcd</text><text x="596" y="72" text-anchor="middle" class="fg-t sm">成為叢集狀態</text>
<text x="200" y="106" text-anchor="middle" class="fg-t sm warm">401 不認識你</text>
<text x="350" y="106" text-anchor="middle" class="fg-t sm warm">403 沒權限</text>
<text x="464" y="106" text-anchor="middle" class="fg-t sm warm">被政策擋下</text>
<line x1="296" y1="86" x2="296" y2="150" class="fg-l dim dash"/>
<text x="304" y="136" class="fg-t sm">RBAC 查這三樣</text>
<rect x="40" y="160" width="170" height="50" rx="6" class="fg-b alt"/><text x="125" y="181" text-anchor="middle" class="fg-t">ServiceAccount</text><text x="125" y="199" text-anchor="middle" class="fg-t sm mono">shop/hilo-api</text>
<rect x="255" y="160" width="150" height="50" rx="6" class="fg-b"/><text x="330" y="181" text-anchor="middle" class="fg-t">RoleBinding</text><text x="330" y="199" text-anchor="middle" class="fg-t sm">把角色綁給誰</text>
<rect x="450" y="150" width="200" height="70" rx="6" class="fg-b hot"/><text x="550" y="172" text-anchor="middle" class="fg-t acc">Role（只在 shop）</text><text x="550" y="191" text-anchor="middle" class="fg-t sm mono">configmaps: get list</text><text x="550" y="208" text-anchor="middle" class="fg-t sm mono">pods: get</text>
<line x1="255" y1="185" x2="218" y2="185" class="fg-l"/><polygon points="210,185 218,180.5 218,189.5" class="fg-a"/>
<line x1="405" y1="185" x2="442" y2="185" class="fg-l"/><polygon points="450,185 442,180.5 442,189.5" class="fg-a"/>
</svg><figcaption>認證回答「你是誰」，RBAC 回答「你能不能對這種物件做這個動作」，准入控制再檢查「你要寫進去的內容合不合規定」。三關都過，才會變成叢集的狀態。</figcaption></figure>
<pre><code>apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata: { name: read-config, namespace: shop }
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata: { name: hilo-api-read-config, namespace: shop }
subjects:
- kind: ServiceAccount
  name: hilo-api
  namespace: shop
roleRef:
  kind: Role
  name: read-config
  apiGroup: rbac.authorization.k8s.io</code></pre>
<p>Role 只在一個 Namespace 裡有效；ClusterRole 是整個叢集的。RoleBinding 也可以引用 ClusterRole，效果是「把這組權限只給你這個 Namespace」，這是重複使用權限定義的常見做法。驗證權限用 <code>kubectl auth can-i list secrets -n shop --as=system:serviceaccount:shop:hilo-api</code>，不要猜。</p>
<h4>服務帳號的權杖</h4>
<p>Pod 的身分是 ServiceAccount。kubelet 會把一張權杖掛進容器的 <code>/var/run/secrets/kubernetes.io/serviceaccount/token</code>。從 1.24 起，這張權杖預設是<b>有期限、綁定這個 Pod、會自動輪替</b>的，不再自動產生永久有效的 Secret 權杖。不需要呼叫 Kubernetes API 的程式（大多數網頁服務都不需要），直接設 <code>automountServiceAccountToken: false</code>，權杖就不會出現在容器裡。</p>
<p>這張權杖還有第二個用途：雲端的工作負載身分（AWS 的 IRSA 或 EKS Pod Identity、GKE 的 Workload Identity）。雲端信任叢集發的權杖，換出雲端的臨時憑證，跟 CI 用 OIDC 換憑證是同一個道理。Pod 不用再放雲端金鑰。</p>
<h4>看起來無害、其實很危險的權限</h4>
<ul>
<li><b>create pods</b>：能在某個 Namespace 建 Pod，就能建一個掛載那裡任何 Secret 的 Pod，也能指定用那裡任何一個 ServiceAccount 執行，等於拿到它們全部的權限。</li>
<li><b>list secrets</b>：很多人以為 list 只會列出名字，其實 list 回傳的是完整內容，跟 get 一樣能讀到值。</li>
<li><b>escalate、bind、impersonate</b>：前兩個能讓人給自己或別人比自己還大的權限，最後一個能假冒別人。</li>
<li><b>萬用字元</b>：<code>resources: ["*"]</code>、<code>verbs: ["*"]</code>，今天看起來只是方便，明天新裝的 CRD 也自動被包進去。</li>
<li><b>內建的 edit 角色</b>：名字聽起來溫和，但它能讀寫 Secret，也能用 Namespace 裡任何 ServiceAccount 跑 Pod。只想給唯讀，用 view（它刻意不包含 Secret）。</li>
</ul>

<h3><span class="badge lv3">專業</span>五、Pod Security Standards：把容器關在籠子裡</h3>
<p>Pod Security Standards 定義了三個等級，由內建的 Pod Security Admission 在准入那一關執行（它在 1.25 取代了已被移除的 PodSecurityPolicy）：</p>
<table>
<tr><th>等級</th><th>重點</th><th>給誰用</th></tr>
<tr><td><b>privileged</b></td><td>什麼都不限制</td><td>CNI、儲存驅動這類系統元件</td></tr>
<tr><td><b>baseline</b></td><td>禁止特權模式、主機網路與行程、hostPath、危險的 capability</td><td>還沒改造好的一般應用的底線</td></tr>
<tr><td><b>restricted</b></td><td>再加上：不能用 root、不能提升權限、丟掉所有 capability、必須套用 seccomp</td><td>一般應用的目標</td></tr>
</table>
<p>用 Namespace 的標籤開啟，三種模式可以並用：<code>enforce</code> 直接拒絕、<code>warn</code> 讓 kubectl 顯示警告、<code>audit</code> 寫進稽核日誌：</p>
<pre><code>metadata:
  name: shop
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: v1.30
    pod-security.kubernetes.io/warn: restricted</code></pre>
<p>一個能通過 restricted 的 Pod，securityContext 長這樣：</p>
<pre><code>spec:
  securityContext:
    runAsNonRoot: true
    seccompProfile: { type: RuntimeDefault }
  containers:
  - name: hilo-api
    securityContext:
      allowPrivilegeEscalation: false
      # 下一行 restricted 沒要求，但建議加
      readOnlyRootFilesystem: true
      capabilities: { drop: ["ALL"] }</code></pre>
<p>最常卡關的是映像檔本身用 root 跑。Dockerfile 要加一行 <code>USER</code> 指定一個非 root 的使用者；官方的 nginx 映像檔預設用 root 並監聽 80 埠，放 Vue 打包檔的話，可以改用 nginx 官方維護的 <code>nginxinc/nginx-unprivileged</code>，它用一般使用者、監聽 8080。導入時先開 warn 和 audit 觀察；也可以用 <code>kubectl label --dry-run=server --overwrite ns shop pod-security.kubernetes.io/enforce=restricted</code> 預覽，伺服器會列出現有哪些 Pod 會違規，卻不會真的套用。</p>

<h3><span class="badge lv3">專業</span>六、多租戶：軟隔離與硬隔離</h3>
<p>多個團隊共用一個叢集，隔離是一層一層疊上去的，越往下越硬、也越貴：</p>
<table>
<tr><th>層</th><th>擋住什麼</th><th>擋不住什麼</th></tr>
<tr><td>Namespace ＋ RBAC</td><td>互相看不到、改不到對方的物件</td><td>資源搶奪、網路互連</td></tr>
<tr><td>ResourceQuota ＋ LimitRange</td><td>一個團隊吃光整個叢集的 CPU、記憶體、Pod 數</td><td>同一台節點上的效能干擾</td></tr>
<tr><td>NetworkPolicy</td><td>跨團隊的網路連線</td><td>共用的核心與節點</td></tr>
<tr><td>Pod Security（restricted）</td><td>大部分容器逃逸的手法</td><td>核心本身的漏洞</td></tr>
<tr><td>專用節點（taint ＋ 親和性）</td><td>跟別的團隊共用同一顆核心</td><td>共用的控制平面</td></tr>
<tr><td>沙箱執行環境（gVisor、Kata）</td><td>不受信任的程式直接碰主機核心</td><td>效能損耗、相容性</td></tr>
<tr><td>獨立叢集或獨立雲端帳號</td><td>幾乎全部</td><td>管理成本</td></tr>
</table>
<p>兩個實務細節。第一，Namespace 一旦設了 CPU 或記憶體的 ResourceQuota，裡面每個 Pod 都必須寫 requests 和 limits，否則直接被拒絕；所以通常會搭配 LimitRange 給沒寫的容器一組預設值。第二，有些東西就算切了 Namespace 還是共用的：API server 本身（它用 API Priority and Fairness 分流，避免某個失控的控制器拖垮大家）、整個叢集層級的物件（CRD、ClusterRole、節點）、CoreDNS，以及最根本的 Linux 核心。上一課說「金流這種絕對不能互相影響的，就分開叢集或帳號」，原因就在這張表的最下面幾列。</p>

<h3><span class="badge lv3">專業</span>七、升級與 API 淘汰</h3>
<p>Kubernetes 每年大約出三個次要版本，每個版本的修補支援大約一年多（約 14 個月）。換句話說，什麼都不做，一年後你就在跑沒人修漏洞的版本。升級有嚴格的版本差距規則（version skew policy）：</p>
<ul>
<li>控制平面一次只能升一個次要版本，不能跳。1.29 到 1.31，一定要經過 1.30。</li>
<li>kubelet 不能比 API server 新；可以比它舊，從 1.28 起最多舊三個次要版本。</li>
<li>kubectl 和 API server 的差距在正負一個次要版本內。</li>
</ul>
<p>所以順序一定是：先升控制平面，再一台一台換節點。</p>
<figure class="figure"><svg viewBox="0 0 680 244" class="fg" style="width:100%;max-width:680px" role="img" aria-label="從 1.30 升到 1.31：先升控制平面，再依序把節點 1、2、3 排空換新；任何時刻節點版本都不比控制平面新">
<text x="168" y="32" text-anchor="middle" class="fg-t sm">開始</text><text x="278" y="32" text-anchor="middle" class="fg-t sm acc">① 控制平面</text><text x="388" y="32" text-anchor="middle" class="fg-t sm">② 節點 1</text><text x="498" y="32" text-anchor="middle" class="fg-t sm">③ 節點 2</text><text x="608" y="32" text-anchor="middle" class="fg-t sm">④ 節點 3</text>
<text x="16" y="71" class="fg-t">控制平面</text><text x="16" y="113" class="fg-t">節點 1</text><text x="16" y="155" class="fg-t">節點 2</text><text x="16" y="197" class="fg-t">節點 3</text>
<rect x="120" y="50" width="96" height="32" rx="5" class="fg-b"/><text x="168" y="71" text-anchor="middle" class="fg-t mono">1.30</text>
<rect x="230" y="50" width="96" height="32" rx="5" class="fg-b hot"/><text x="278" y="71" text-anchor="middle" class="fg-t mono acc">1.31</text>
<rect x="340" y="50" width="96" height="32" rx="5" class="fg-b hot"/><text x="388" y="71" text-anchor="middle" class="fg-t mono acc">1.31</text>
<rect x="450" y="50" width="96" height="32" rx="5" class="fg-b hot"/><text x="498" y="71" text-anchor="middle" class="fg-t mono acc">1.31</text>
<rect x="560" y="50" width="96" height="32" rx="5" class="fg-b hot"/><text x="608" y="71" text-anchor="middle" class="fg-t mono acc">1.31</text>
<rect x="120" y="92" width="96" height="32" rx="5" class="fg-b"/><text x="168" y="113" text-anchor="middle" class="fg-t mono">1.30</text>
<rect x="230" y="92" width="96" height="32" rx="5" class="fg-b"/><text x="278" y="113" text-anchor="middle" class="fg-t mono">1.30</text>
<rect x="340" y="92" width="96" height="32" rx="5" class="fg-b warm"/><text x="388" y="113" text-anchor="middle" class="fg-t sm">排空 → 1.31</text>
<rect x="450" y="92" width="96" height="32" rx="5" class="fg-b hot"/><text x="498" y="113" text-anchor="middle" class="fg-t mono acc">1.31</text>
<rect x="560" y="92" width="96" height="32" rx="5" class="fg-b hot"/><text x="608" y="113" text-anchor="middle" class="fg-t mono acc">1.31</text>
<rect x="120" y="134" width="96" height="32" rx="5" class="fg-b"/><text x="168" y="155" text-anchor="middle" class="fg-t mono">1.30</text>
<rect x="230" y="134" width="96" height="32" rx="5" class="fg-b"/><text x="278" y="155" text-anchor="middle" class="fg-t mono">1.30</text>
<rect x="340" y="134" width="96" height="32" rx="5" class="fg-b"/><text x="388" y="155" text-anchor="middle" class="fg-t mono">1.30</text>
<rect x="450" y="134" width="96" height="32" rx="5" class="fg-b warm"/><text x="498" y="155" text-anchor="middle" class="fg-t sm">排空 → 1.31</text>
<rect x="560" y="134" width="96" height="32" rx="5" class="fg-b hot"/><text x="608" y="155" text-anchor="middle" class="fg-t mono acc">1.31</text>
<rect x="120" y="176" width="96" height="32" rx="5" class="fg-b"/><text x="168" y="197" text-anchor="middle" class="fg-t mono">1.30</text>
<rect x="230" y="176" width="96" height="32" rx="5" class="fg-b"/><text x="278" y="197" text-anchor="middle" class="fg-t mono">1.30</text>
<rect x="340" y="176" width="96" height="32" rx="5" class="fg-b"/><text x="388" y="197" text-anchor="middle" class="fg-t mono">1.30</text>
<rect x="450" y="176" width="96" height="32" rx="5" class="fg-b"/><text x="498" y="197" text-anchor="middle" class="fg-t mono">1.30</text>
<rect x="560" y="176" width="96" height="32" rx="5" class="fg-b warm"/><text x="608" y="197" text-anchor="middle" class="fg-t sm">排空 → 1.31</text>
<text x="388" y="234" text-anchor="middle" class="fg-t sm">每一欄都合法：節點不比控制平面新，差距也在允許範圍內</text>
</svg><figcaption>升級是一連串「每一步都合法」的狀態。橘色那格是正在排空的節點：先標成不可排程（cordon），再依 PDB 把 Pod 驅逐到別台（drain），換成新版本後才重新開放（uncordon）。</figcaption></figure>
<h4>真正會讓升級出事的：被移除的 API</h4>
<p>Beta 版的 API 會先被標為淘汰（deprecated），經過幾個版本後移除。幾個有名的例子：<code>extensions/v1beta1</code> 和 <code>networking.k8s.io/v1beta1</code> 的 Ingress 在 1.22 移除；PodSecurityPolicy 和 <code>batch/v1beta1</code> 的 CronJob 在 1.25 移除；<code>autoscaling/v2beta2</code> 的 HPA 在 1.26 移除。</p>
<p>叢集裡已經存在的物件不會壞，API server 會用新版本的格式提供它們。會壞的是<b>你 git 裡、Helm chart 裡還寫著舊 apiVersion 的 YAML</b>：升級後下一次部署，apply 直接失敗。所以升級前要掃：kubectl 送出淘汰中的 API 時本來就會印出警告；API server 有一個 <code>apiserver_requested_deprecated_apis</code> 指標告訴你誰還在用；Pluto、kube-no-trouble（kubent）這類工具可以直接掃描 repo 和叢集。另外別忘了外掛：CNI、CoreDNS、Ingress 控制器、儲存驅動都有自己的相容版本表，要跟著一起升。</p>

<h3><span class="badge lv4">專家</span>八、Operator 與 CRD：把維運經驗寫成控制迴圈</h3>
<p>Kubernetes 本身就是一堆控制迴圈：Deployment 控制器看「應該有 4 個」、「現在有 3 個」，就補一個。Operator 把同樣的模式用在你自己的東西上。</p>
<p>第一步是<b>自訂資源定義</b>（CustomResourceDefinition，CRD）：告訴 API server「現在多了一種叫 PostgresCluster 的物件，它的欄位長這樣」。之後它就跟內建物件一樣，存在 etcd、能用 kubectl 操作、受 RBAC 管。第二步是寫一個控制器，專門照顧這種物件：</p>
<figure class="figure"><svg viewBox="0 0 660 236" class="fg" style="width:100%;max-width:660px" role="img" aria-label="Operator 監看自訂資源，比對 spec 與現況，建立或修改 StatefulSet、Service、Secret、CronJob 等資源，再把狀態寫回自訂資源的 status，不斷重複">
<rect x="20" y="40" width="170" height="130" rx="8" class="fg-b alt"/>
<text x="32" y="60" class="fg-t acc">自訂資源（CR）</text>
<text x="32" y="82" class="fg-t sm mono">kind: PostgresCluster</text>
<text x="32" y="100" class="fg-t sm mono">spec:</text>
<text x="46" y="116" class="fg-t sm mono">instances: 3</text>
<text x="32" y="138" class="fg-t sm mono">status:</text>
<text x="46" y="154" class="fg-t sm mono">ready: 2/3</text>
<text x="340" y="20" text-anchor="middle" class="fg-t acc">Operator：一直重複的控制迴圈</text>
<rect x="240" y="30" width="200" height="196" rx="10" class="fg-b dash"/>
<rect x="260" y="44" width="160" height="30" rx="5" class="fg-b"/><text x="340" y="64" text-anchor="middle" class="fg-t sm">① 監看變化</text>
<rect x="260" y="92" width="160" height="30" rx="5" class="fg-b"/><text x="340" y="112" text-anchor="middle" class="fg-t sm">② 比對 spec 與現況</text>
<rect x="260" y="140" width="160" height="30" rx="5" class="fg-b hot"/><text x="340" y="160" text-anchor="middle" class="fg-t sm">③ 建立或修改資源</text>
<rect x="260" y="188" width="160" height="30" rx="5" class="fg-b"/><text x="340" y="208" text-anchor="middle" class="fg-t sm">④ 寫回 status</text>
<line x1="340" y1="74" x2="340" y2="84" class="fg-l"/><polygon points="340,92 335.5,84 344.5,84" class="fg-a"/>
<line x1="340" y1="122" x2="340" y2="132" class="fg-l"/><polygon points="340,140 335.5,132 344.5,132" class="fg-a"/>
<line x1="340" y1="170" x2="340" y2="180" class="fg-l"/><polygon points="340,188 335.5,180 344.5,180" class="fg-a"/>
<path d="M420 203 H432 V59 H428" class="fg-l on"/><polygon points="420,59 428,54.5 428,63.5" class="fg-a on"/>
<line x1="190" y1="59" x2="252" y2="59" class="fg-l"/><polygon points="260,59 252,54.5 252,63.5" class="fg-a"/>
<path d="M260 203 H215 V154 H198" class="fg-l alt"/><polygon points="190,154 198,149.5 198,158.5" class="fg-a alt"/>
<rect x="490" y="40" width="160" height="30" rx="5" class="fg-b"/><text x="570" y="60" text-anchor="middle" class="fg-t sm">StatefulSet（3 個 Pod）</text>
<rect x="490" y="80" width="160" height="30" rx="5" class="fg-b"/><text x="570" y="100" text-anchor="middle" class="fg-t sm">Service（讀寫分開）</text>
<rect x="490" y="120" width="160" height="30" rx="5" class="fg-b"/><text x="570" y="140" text-anchor="middle" class="fg-t sm">Secret（連線密碼）</text>
<rect x="490" y="160" width="160" height="30" rx="5" class="fg-b"/><text x="570" y="180" text-anchor="middle" class="fg-t sm">CronJob（定時備份）</text>
<line x1="440" y1="155" x2="470" y2="155" class="fg-l on"/><line x1="470" y1="55" x2="470" y2="175" class="fg-l on"/>
<line x1="470" y1="55" x2="482" y2="55" class="fg-l on"/><polygon points="490,55 482,50.5 482,59.5" class="fg-a on"/>
<line x1="470" y1="95" x2="482" y2="95" class="fg-l on"/><polygon points="490,95 482,90.5 482,99.5" class="fg-a on"/>
<line x1="470" y1="135" x2="482" y2="135" class="fg-l on"/><polygon points="490,135 482,130.5 482,139.5" class="fg-a on"/>
<line x1="470" y1="175" x2="482" y2="175" class="fg-l on"/><polygon points="490,175 482,170.5 482,179.5" class="fg-a on"/>
</svg><figcaption>你只寫左邊那幾行「我要三個副本的資料庫」。Operator 不斷比對，缺什麼補什麼，主節點掛了就做容錯移轉，再把結果寫回 status 讓你看到。</figcaption></figure>
<ul>
<li><b>看狀態，不看事件</b>（level-triggered）：控制器問的是「現在應該長什麼樣子、實際長什麼樣子」，而不是「剛剛發生了什麼事」。漏掉一個事件沒關係，下一次比對還是會發現差距。所以 reconcile 函式必須冪等，跑一百次結果都一樣。</li>
<li><b>擁有者與清理</b>：Operator 建的資源會帶著 ownerReference 指回 CR，刪除 CR 時，Kubernetes 的垃圾回收會順便刪掉它們。要清理叢集外的東西（雲端的負載平衡器、DNS 記錄），則靠 finalizer：物件被刪除時先不消失，等控制器做完清理、拿掉 finalizer，才真的刪掉。</li>
<li><b>經典陷阱</b>：Operator 已經被移除了，它管的物件卻還帶著 finalizer，刪除時就永遠卡在 Terminating。硬把 finalizer 拿掉能讓物件消失，但外面那些該清理的資源就成了孤兒。正確順序是先刪 CR、讓 Operator 清理完，再移除 Operator。</li>
</ul>
<p>常見的 Operator：cert-manager（自動申請、續約 TLS 憑證）、CloudNativePG（PostgreSQL 叢集）、Prometheus Operator（用 CRD 描述監控目標）。遊戲開發者特別值得認識 <b>Agones</b>：它用 GameServer、Fleet 這類 CRD 管理對戰房間型的遊戲伺服器，知道「有玩家在線的伺服器不能被縮掉」。導入任何 Operator 前要記得它通常需要很大的 RBAC 權限，而且它的 bug 會同時影響它管理的每一個實例，成熟度要先評估。想自己寫，可以從 Go 的 Kubebuilder 或 Operator SDK 開始。</p>

<h3><span class="badge lv4">專家</span>九、服務網格：什麼時候值得</h3>
<p>服務網格（service mesh）分成兩半。<b>資料平面</b>：每個 Pod 旁邊多一個代理（Istio 用 Envoy，Linkerd 用自己以 Rust 寫的小型代理），Pod 的進出流量被 iptables 規則導進代理裡。<b>控制平面</b>：把路由設定和憑證發給所有代理。</p>
<p>它提供的東西是真的有價值：</p>
<ul>
<li><b>自動 mTLS</b>：每個工作負載依它的 ServiceAccount 拿到一個身分，例如 <code>spiffe://cluster.local/ns/shop/sa/hilo-api</code>，憑證自動簽發、自動輪替。服務之間全部加密，而且能寫「只有 web 的身分可以呼叫 api」這種依身分、而不是依 IP 的授權規則。</li>
<li><b>流量控制</b>：重試、逾時、斷路器、依 HTTP 標頭或比例分流（L7 的金絲雀發布）。</li>
<li><b>一致的指標</b>：每一條服務對服務的路徑，都有請求數、錯誤率、延遲分布，不用每個團隊各自埋。</li>
</ul>
<p>代價也是真的：每個 sidecar 要吃幾十 MB 記憶體和一些 CPU，乘上幾百個 Pod 很可觀；每一跳多經過兩個代理，延遲增加通常在毫秒以下到幾毫秒的量級；出問題時多了一層要查（回 503 的到底是你的程式還是代理？）；網格本身也要跟著升級。Sidecar 還有啟動和關閉順序的老問題：程式啟動時代理還沒好、Job 跑完了代理卻還活著讓 Job 永遠不結束。Kubernetes 的原生 sidecar 容器（在 initContainers 裡設 <code>restartPolicy: Always</code>，1.29 起預設可用）解決了大部分順序問題；Istio 的 ambient 模式則改成每台節點一個代理處理 mTLS，需要 L7 功能時才加專用代理，省掉每個 Pod 的 sidecar。</p>
<p>判斷的方法：服務只有幾個、一兩個團隊，NetworkPolicy 加上應用層自己做 TLS 和重試就夠了。服務有幾十個以上、多個團隊、法規要求服務之間全部加密、或你一直在各個語言的程式裡重複寫重試和指標，這時網格的價值才會超過它的成本。</p>

<h3><span class="badge lv4">專家</span>十、叢集裡的可觀測性</h3>
<table>
<tr><th>要看什麼</th><th>從哪裡來</th></tr>
<tr><td>容器用了多少 CPU、記憶體、被節流多少</td><td>kubelet 內建的 cAdvisor</td></tr>
<tr><td>物件的狀態：期望幾個副本、可用幾個、重啟幾次</td><td>kube-state-metrics</td></tr>
<tr><td>節點的磁碟、網路、負載</td><td>node-exporter（DaemonSet）</td></tr>
<tr><td>API server 延遲、etcd 健康</td><td>控制平面元件自己的指標</td></tr>
<tr><td>日誌</td><td>容器寫到 stdout，節點上的收集器（Fluent Bit、Vector 等）送到 Loki 或 Elasticsearch</td></tr>
<tr><td>事件（排程失敗、探針失敗、OOM）</td><td>Events API，預設只保留約一小時，要用事件匯出工具存起來</td></tr>
<tr><td>跨服務的請求路徑</td><td>OpenTelemetry 埋點，經 Collector 送到追蹤系統</td></tr>
</table>
<p>幾個容易誤會的點：metrics-server 只給 HPA 和 <code>kubectl top</code> 用，它只保留最新的值，不是監控系統。容器日誌由 kubelet 輪替，預設單檔約 10Mi，Pod 一刪日誌就沒了，所以日誌一定要送出節點。指標的標籤不要放使用者 ID 這類無上限的值，也要注意 Pod 名稱每次部署都會變，序列數量可能爆炸，拖垮 Prometheus。</p>
<p>值得一開始就設的警報：容器反覆重啟、Pod 長時間 Pending、CPU 節流比例過高、OOMKilled 次數、節點 NotReady 或有記憶體與磁碟壓力、PersistentVolume 用量超過八成五、憑證快到期，以及 Deployment 期望副本數和可用副本數長時間不一致。</p>

<h3><span class="badge lv4">專家</span>十一、除錯手冊：照著走就能定位</h3>
<p>上一課說除錯的步驟永遠不變：get、describe、logs、exec。這裡把它展開成一張依 STATUS 分流的地圖：</p>
<figure class="figure"><svg viewBox="0 0 672 300" class="fg" style="width:100%;max-width:672px" role="img" aria-label="除錯流程：kubectl get pods 看 STATUS，依 Pending、ImagePullBackOff、CrashLoopBackOff、Running 但未就緒、Evicted 分成五條路，各自的下一個指令和常見原因">
<rect x="236" y="12" width="200" height="34" rx="6" class="fg-b hot"/><text x="336" y="34" text-anchor="middle" class="fg-t mono acc">kubectl get pods</text>
<line x1="336" y1="46" x2="336" y2="62" class="fg-l"/>
<line x1="72" y1="62" x2="600" y2="62" class="fg-l"/>
<line x1="72" y1="62" x2="72" y2="70" class="fg-l"/><polygon points="72,78 67.5,70 76.5,70" class="fg-a"/>
<line x1="204" y1="62" x2="204" y2="70" class="fg-l"/><polygon points="204,78 199.5,70 208.5,70" class="fg-a"/>
<line x1="336" y1="62" x2="336" y2="70" class="fg-l"/><polygon points="336,78 331.5,70 340.5,70" class="fg-a"/>
<line x1="468" y1="62" x2="468" y2="70" class="fg-l"/><polygon points="468,78 463.5,70 472.5,70" class="fg-a"/>
<line x1="600" y1="62" x2="600" y2="70" class="fg-l"/><polygon points="600,78 595.5,70 604.5,70" class="fg-a"/>
<rect x="10" y="78" width="124" height="30" rx="5" class="fg-b warm"/><text x="72" y="98" text-anchor="middle" class="fg-t sm">Pending</text>
<rect x="142" y="78" width="124" height="30" rx="5" class="fg-b warm"/><text x="204" y="98" text-anchor="middle" class="fg-t sm">ImagePullBackOff</text>
<rect x="274" y="78" width="124" height="30" rx="5" class="fg-b warm"/><text x="336" y="98" text-anchor="middle" class="fg-t sm">CrashLoopBackOff</text>
<rect x="406" y="78" width="124" height="30" rx="5" class="fg-b warm"/><text x="468" y="98" text-anchor="middle" class="fg-t sm">Running 但 0/1</text>
<rect x="538" y="78" width="124" height="30" rx="5" class="fg-b warm"/><text x="600" y="98" text-anchor="middle" class="fg-t sm">Evicted</text>
<line x1="72" y1="108" x2="72" y2="118" class="fg-l"/><polygon points="72,126 67.5,118 76.5,118" class="fg-a"/>
<line x1="204" y1="108" x2="204" y2="118" class="fg-l"/><polygon points="204,126 199.5,118 208.5,118" class="fg-a"/>
<line x1="336" y1="108" x2="336" y2="118" class="fg-l"/><polygon points="336,126 331.5,118 340.5,118" class="fg-a"/>
<line x1="468" y1="108" x2="468" y2="118" class="fg-l"/><polygon points="468,126 463.5,118 472.5,118" class="fg-a"/>
<line x1="600" y1="108" x2="600" y2="118" class="fg-l"/><polygon points="600,126 595.5,118 604.5,118" class="fg-a"/>
<rect x="10" y="126" width="124" height="50" rx="5" class="fg-b alt"/><text x="72" y="147" text-anchor="middle" class="fg-t sm mono">describe pod</text><text x="72" y="164" text-anchor="middle" class="fg-t sm">看 Events</text>
<rect x="142" y="126" width="124" height="50" rx="5" class="fg-b alt"/><text x="204" y="147" text-anchor="middle" class="fg-t sm mono">describe pod</text><text x="204" y="164" text-anchor="middle" class="fg-t sm">看拉取錯誤</text>
<rect x="274" y="126" width="124" height="50" rx="5" class="fg-b alt"/><text x="336" y="147" text-anchor="middle" class="fg-t sm mono">logs --previous</text><text x="336" y="164" text-anchor="middle" class="fg-t sm">看 Last State</text>
<rect x="406" y="126" width="124" height="50" rx="5" class="fg-b alt"/><text x="468" y="147" text-anchor="middle" class="fg-t sm mono">describe pod</text><text x="468" y="164" text-anchor="middle" class="fg-t sm">看就緒探測</text>
<rect x="538" y="126" width="124" height="50" rx="5" class="fg-b alt"/><text x="600" y="147" text-anchor="middle" class="fg-t sm mono">describe node</text><text x="600" y="164" text-anchor="middle" class="fg-t sm">看 Conditions</text>
<line x1="72" y1="176" x2="72" y2="186" class="fg-l"/><polygon points="72,194 67.5,186 76.5,186" class="fg-a"/>
<line x1="204" y1="176" x2="204" y2="186" class="fg-l"/><polygon points="204,194 199.5,186 208.5,186" class="fg-a"/>
<line x1="336" y1="176" x2="336" y2="186" class="fg-l"/><polygon points="336,194 331.5,186 340.5,186" class="fg-a"/>
<line x1="468" y1="176" x2="468" y2="186" class="fg-l"/><polygon points="468,194 463.5,186 472.5,186" class="fg-a"/>
<line x1="600" y1="176" x2="600" y2="186" class="fg-l"/><polygon points="600,194 595.5,186 604.5,186" class="fg-a"/>
<rect x="10" y="194" width="124" height="70" rx="5" class="fg-b"/><text x="72" y="214" text-anchor="middle" class="fg-t sm">requests 放不下</text><text x="72" y="232" text-anchor="middle" class="fg-t sm">taint、親和性</text><text x="72" y="250" text-anchor="middle" class="fg-t sm">PVC 綁不上</text>
<rect x="142" y="194" width="124" height="70" rx="5" class="fg-b"/><text x="204" y="214" text-anchor="middle" class="fg-t sm">名稱或 tag 錯</text><text x="204" y="232" text-anchor="middle" class="fg-t sm">倉庫憑證</text><text x="204" y="250" text-anchor="middle" class="fg-t sm">CPU 架構、限速</text>
<rect x="274" y="194" width="124" height="70" rx="5" class="fg-b"/><text x="336" y="214" text-anchor="middle" class="fg-t sm">設定或機密缺</text><text x="336" y="232" text-anchor="middle" class="fg-t sm">137：被殺</text><text x="336" y="250" text-anchor="middle" class="fg-t sm">1：程式錯誤</text>
<rect x="406" y="194" width="124" height="70" rx="5" class="fg-b"/><text x="468" y="214" text-anchor="middle" class="fg-t sm">依賴還沒好</text><text x="468" y="232" text-anchor="middle" class="fg-t sm">探針路徑或埠錯</text><text x="468" y="250" text-anchor="middle" class="fg-t sm">啟動太慢</text>
<rect x="538" y="194" width="124" height="70" rx="5" class="fg-b"/><text x="600" y="214" text-anchor="middle" class="fg-t sm">記憶體壓力</text><text x="600" y="232" text-anchor="middle" class="fg-t sm">磁碟壓力</text><text x="600" y="250" text-anchor="middle" class="fg-t sm">日誌、emptyDir</text>
<text x="336" y="288" text-anchor="middle" class="fg-t sm">還是看不出來：kubectl debug 掛一個除錯容器進去</text>
</svg><figcaption>先看 STATUS 分流，每條路的下一個指令都不同。最下面一排是各狀態常見的原因，describe 和 logs 的輸出通常會直接指出是哪一個。</figcaption></figure>
<h4>Pending：排程器找不到地方放</h4>
<p><code>kubectl describe pod</code> 最下面的 Events 會寫得很清楚，例如：<code>0/4 nodes are available: 1 node(s) had untolerated taint {dedicated: game}, 3 Insufficient memory.</code> 意思是四台節點裡，一台有你沒容忍的 taint，三台記憶體不夠（記得：是 requests 不夠，不是實際用量）。其他常見原因：nodeSelector 或親和性寫了不存在的標籤；PVC 綁不上，或磁碟在 1a 可用區、能用的節點卻都在 1c（雲端磁碟不能跨可用區掛載）。如果是 Namespace 的配額滿了，Pod 根本建不出來，訊息會出現在 ReplicaSet 的事件裡，而不是 Pod。</p>
<h4>ImagePullBackOff：映像檔拉不下來</h4>
<p>Events 裡的拉取錯誤通常直接說明原因：<code>not found</code>（名稱或 tag 打錯）、<code>401 Unauthorized</code>（私有倉庫沒設 imagePullSecrets 或節點沒權限）、<code>429 Too Many Requests</code>（匿名拉 Docker Hub 被限速）。用 M1 Mac 的人要特別注意：本機 build 出來的映像檔是 arm64，推上去給 amd64 的節點，會看到 <code>no match for platform in manifest</code>。用 <code>docker buildx build --platform linux/amd64,linux/arm64</code> 建多架構映像檔，或讓 CI 去建。</p>
<h4>CrashLoopBackOff：一直起來又倒下</h4>
<p>先 <code>kubectl logs --previous</code> 看剛死掉那一次的輸出，再看 describe 的 Last State 裡的 Reason 和 Exit Code：</p>
<table>
<tr><th>結束碼</th><th>通常代表</th></tr>
<tr><td>1</td><td>程式自己報錯退出：設定錯、連不到相依服務、啟動時丟出例外</td></tr>
<tr><td>137</td><td>被 SIGKILL。Reason 寫 OOMKilled 就是記憶體超過上限；寫 Error 時，常見的是存活探測失敗後程式不理 SIGTERM，寬限期到了被強制殺掉</td></tr>
<tr><td>139</td><td>記憶體區段錯誤（segfault），常見於原生模組或 CPU 架構不符的二進位檔</td></tr>
<tr><td>143</td><td>收到 SIGTERM 後正常結束，代表有人（例如存活探測）要它停</td></tr>
</table>
<p>重啟的間隔會從 10 秒開始加倍，最多到 5 分鐘，所以修好之後要等一下才會恢復。另一個相似的狀態是 <code>CreateContainerConfigError</code>：容器根本沒啟動，因為它引用的 ConfigMap 或 Secret（或其中的某個 key）不存在，describe 裡會指名是哪一個。</p>
<h4>Running 但 0/1：活著，但不接流量</h4>
<p>就緒探測失敗。Events 會出現類似 <code>Readiness probe failed: HTTP probe failed with statuscode: 503</code> 的訊息。先確認探針的路徑和連接埠跟程式真的一致，再用 <code>kubectl exec</code> 進去自己打一次那個端點。如果是程式還在等某個相依服務，回頭看「健康檢查、資源、擴展與版本推出」那一課深入圖解的第三節：就緒探測該不該檢查它。</p>
<h4>Evicted：被節點趕出來</h4>
<p>describe 會寫 <code>The node was low on resource: memory</code> 或 <code>ephemeral-storage</code>。後者最容易被忽略：容器的可寫層、日誌、emptyDir 都算節點的暫存空間，一個瘋狂寫日誌或把暫存檔寫在容器裡的程式，就能讓整台節點把 Pod 趕走。給容器設 <code>ephemeral-storage</code> 的 requests 和 limits，讓問題出在肇事者身上。被驅逐的 Pod 會以 Failed 狀態留著，可以用 <code>kubectl delete pod -n shop --field-selector=status.phase=Failed</code> 清掉。</p>
<h4>最後一招：掛一個除錯容器</h4>
<p>正式環境的映像檔常常精簡到連 shell 都沒有，exec 進不去。<code>kubectl debug -it pod/hilo-api-7d9f -n shop --image=busybox:1.36 --target=hilo-api</code> 會在這個 Pod 裡臨時加一個除錯容器，和目標容器共用網路和行程空間，可以看它的連線、送請求、看行程。節點本身出問題時，<code>kubectl debug node/節點名稱 -it --image=busybox:1.36</code> 會在那台節點上開一個 Pod，主機的檔案系統掛在 <code>/host</code>。</p>

<h3>十二、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>建了 NetworkPolicy 就有防火牆</td><td>要 CNI 支援才會執行。用不支援的 CNI，政策建得進去、卻什麼都不擋。</td></tr>
<tr><td>ClusterIP 是某台機器的 IP</td><td>它不在任何網卡上，只存在於每台節點的轉送規則裡。</td></tr>
<tr><td>list secrets 只能看到名字</td><td>list 回傳完整內容，跟 get 一樣危險。</td></tr>
<tr><td>Namespace 就是安全邊界</td><td>它只是命名和權限的單位。網路、資源、核心都要另外隔離，真正的硬邊界是獨立叢集或帳號。</td></tr>
<tr><td>升級前只要看 release notes</td><td>要掃自己 git 和 Helm chart 裡的 apiVersion，還有 CNI、Ingress 等外掛的相容性。</td></tr>
<tr><td>服務網格是正式環境的標配</td><td>它解決的是服務很多、團隊很多時的問題。服務少的時候，它帶來的複雜度大於價值。</td></tr>
<tr><td>CrashLoopBackOff 就看 logs</td><td>要看 <code>--previous</code>，目前那個容器可能剛啟動還沒印出東西；還要配合 Exit Code 判斷是被誰殺的。</td></tr>
</table>

<h3>十三、跟你的工作連起來</h3>
<ul>
<li><b>Vue 前端</b>：放打包檔的 nginx 容器改用非 root 的映像檔、監聽 8080，就能通過 restricted；它只需要接收來自 Ingress 控制器的流量，一條 NetworkPolicy 就能把其他來源全擋掉。</li>
<li><b>Node.js／Go 後端</b>：每個服務一個自己的 ServiceAccount；不呼叫 Kubernetes API 就關掉權杖掛載；要用雲端服務就走工作負載身分，不放金鑰。呼叫外部 API 時，留意 ndots 造成的多餘 DNS 查詢。</li>
<li><b>遊戲伺服器</b>：即時對戰的房間型伺服器，可以考慮 Agones 這類專門的 Operator；長連線和玩家狀態讓「隨時可以殺掉一個 Pod」的假設不成立，需要專門處理。</li>
<li><b>Docker 與 M1 Mac</b>：映像檔要建 amd64 版本（或多架構），否則推上叢集就是 ImagePullBackOff 或 exec format error。</li>
<li><b>雲端</b>：託管的 Kubernetes（EKS、GKE、AKS）幫你管控制平面，但升級節點、掃描淘汰的 API、設定 RBAC 和 NetworkPolicy，仍然是你的工作。</li>
</ul>

<h3>十四、面試會怎麼問</h3>
<p>這些是 CKA／CKS 等級與資深平台工程面試的常見題目。先出聲講一遍，再打開參考答案。</p>
<ol>
<li>「Pod 連一個 Service 的時候，封包實際上經過了哪些東西？」</li>
<li>「shop 這個 Namespace 要預設全部拒絕，只開放 web 到 api。要寫哪些 NetworkPolicy？有什麼容易漏掉的？」</li>
<li>「為什麼說能在某個 Namespace 建 Pod，幾乎等於能讀那裡所有的 Secret？」</li>
<li>「叢集要從 1.29 升到 1.31，說說你的計畫。」</li>
<li>「什麼時候你會建議導入服務網格？什麼時候不會？」</li>
<li>「Pod 一直 CrashLoopBackOff，說說你的排查步驟。」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>程式先依 resolv.conf 向 CoreDNS 查 Service 名稱，拿到 ClusterIP；連線送出時，所在節點上 kube-proxy 寫好的規則（iptables、IPVS 或 eBPF）依 EndpointSlice 裡的就緒端點，把目的地 DNAT 成某個 Pod 的 IP 和埠；接著依 CNI 設定的路由，經 veth、主機路由、可能經過 VXLAN 封裝，送到目標節點再進目標 Pod。回程由 conntrack 把來源改回 ClusterIP。</li>
<li>一條 podSelector 為空、policyTypes 包含 Ingress 和 Egress 的預設拒絕政策；一條選中 api、允許來自 web 的 Ingress（限定埠）；一條選中 web、允許連 api 的 Egress；還有一條允許所有 Pod 連 kube-system 裡 DNS 的 UDP／TCP 53。容易漏掉的是 Egress 和 DNS，以及 namespaceSelector 和 podSelector 寫在同一項是 AND、分兩項是 OR。最後要確認 CNI 真的支援 NetworkPolicy。</li>
<li>因為建 Pod 的人可以在 Pod 規格裡掛載這個 Namespace 裡任何一個 Secret，當作檔案或環境變數讀出來；也可以指定用這個 Namespace 裡任何一個 ServiceAccount 執行，取得它的所有權限。所以「建 Pod」的權限要跟「讀 Secret」一樣嚴格看待，必要時用准入政策限制可掛載的 Secret 或可用的 ServiceAccount。</li>
<li>先掃描 git、Helm chart 和叢集裡對 1.30、1.31 移除的 API 的使用，並確認 CNI、CoreDNS、Ingress 控制器、CSI 等外掛支援目標版本；在 staging 先演練。正式升級時，控制平面不能跳版，先升到 1.30，節點跟上或至少在允許的版本差距內，再升控制平面到 1.31，然後節點逐台 cordon、drain（依 PDB）、換新、uncordon。全程監控錯誤率和 Pending 的 Pod，並確認備份和回復方案。</li>
<li>服務數量多、團隊多，需要服務之間全面 mTLS 與依身分授權，或想統一重試、逾時、流量分流和指標時，會建議導入。服務少、團隊小、沒有法規要求時不建議，因為每個 Pod 的代理會增加資源和延遲，除錯和升級也多一層；這時 NetworkPolicy 加上應用層的 TLS 和重試函式庫通常就夠了，或考慮 ambient 這種不需要 sidecar 的模式。</li>
<li>先 <code>kubectl describe pod</code> 看 Last State 的 Reason 和 Exit Code，以及 Events 裡有沒有探針失敗；再 <code>kubectl logs --previous</code> 看剛死掉那次的輸出。Exit 1 多半是設定、機密或相依服務問題；137 加 OOMKilled 是記憶體上限；137 加 Error 可能是存活探測重啟又不處理 SIGTERM；139 是 segfault 或架構不符。必要時用 <code>kubectl debug</code> 掛除錯容器，或暫時把指令換成 sleep 進去手動執行啟動指令。</li>
</ol>
</details>

<h3>十五、練功題（做得出來才算真的懂）</h3>
<ol>
<li>Pod 的 resolv.conf 有 3 個 search 網域、<code>ndots:5</code>。程式查 <code>api.example.com</code>，最壞要送出幾個 DNS 查詢（同時查 IPv4 和 IPv6）？怎麼減少？</li>
<li>寫一條 NetworkPolicy：允許 <code>monitoring</code> 這個 Namespace 裡的任何 Pod，連到 <code>shop</code> 裡所有 Pod 的 9090 埠。</li>
<li>某個應用的 Role 寫著 <code>resources: ["*"]</code>、<code>verbs: ["*"]</code>，可是它其實只需要讀 ConfigMap。說出風險，並改成最小權限。</li>
<li>一個放 Vue 打包檔的 nginx 容器，在 restricted 的 Namespace 裡建不起來。可能違反了哪些規定？要怎麼改？</li>
<li>describe 顯示 <code>0/4 nodes are available: 1 node(s) had untolerated taint {dedicated: game}, 3 Insufficient memory.</code>，可是監控上每台節點的記憶體用量都只有五成。解釋原因，並列出至少三種處理方式。</li>
<li>容器的結束碼是 137，但 Reason 是 Error 而不是 OOMKilled。可能是什麼情況？你會怎麼確認？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>點數 2 少於 5，先試 3 個 search 網域，再試原本的名字，共 4 個名字，每個查 A 和 AAAA，最壞 8 個查詢。減少的方法：程式裡用結尾加點的完整名稱 <code>api.example.com.</code>；在 Pod 的 <code>dnsConfig.options</code> 把 ndots 設成 2 左右；部署 NodeLocal DNSCache 讓重複的查詢在節點上就命中。</li>
<li>放在 shop：<code>podSelector: {}</code>、<code>policyTypes: [Ingress]</code>、ingress 的 from 寫一項 <code>namespaceSelector: { matchLabels: { kubernetes.io/metadata.name: monitoring } }</code>，ports 寫 TCP 9090。如果 monitoring 那邊也有預設拒絕 Egress，還要在那邊開允許連出的規則。</li>
<li>萬用字元等於能讀寫這個 Namespace 的所有物件，包括 Secret、建 Pod（進而取得任何 ServiceAccount 的權限），之後新裝的 CRD 也自動包含。改成 <code>apiGroups: [""]</code>、<code>resources: ["configmaps"]</code>、<code>verbs: ["get", "list", "watch"]</code>，如果只讀某一個 ConfigMap，還可以加 <code>resourceNames</code> 限定名稱。</li>
<li>官方 nginx 映像檔預設以 root 執行，違反 runAsNonRoot；如果沒寫，還缺 <code>allowPrivilegeEscalation: false</code>、<code>capabilities.drop: ["ALL"]</code>、<code>seccompProfile: RuntimeDefault</code>。改用以一般使用者執行、監聽 8080 的 nginx-unprivileged 映像檔，Service 對外仍可用 80 對應到 8080，並補上這幾個 securityContext 欄位。</li>
<li>排程器看的是 requests 的加總，不是實際用量，所以實際只用五成，requests 卻可能已經訂滿；另一台則有 taint，你的 Pod 沒有對應的 toleration。處理方式：依實際用量調低過高的 requests；加節點或讓叢集自動擴展；如果那台本來就該給這個工作，加上 toleration；或降低這個 Pod 的 requests、拆小。</li>
<li>137 代表被 SIGKILL。不是 OOMKilled 的話，常見的是存活探測失敗後 kubelet 送 SIGTERM，程式不理（例如 Node.js 當 1 號行程卻沒處理 SIGTERM），寬限期一到被強制殺掉。確認方法：describe 的 Events 裡有沒有 Liveness probe failed 的紀錄；在本機用 <code>docker stop</code> 測，若每次都剛好卡滿等待時間才停，就是沒處理 SIGTERM。</li>
</ol>
</details>

<h3>十六、想再挖深</h3>
<ul>
<li><b>Kubernetes 官方文件</b>（<a href="https://kubernetes.io/docs/">kubernetes.io</a>）：Cluster Networking、Network Policies、Using RBAC Authorization、Pod Security Standards、Version Skew Policy、Deprecated API Migration Guide，是本章每一節的權威來源。</li>
<li><b>Kelsey Hightower《Kubernetes The Hard Way》</b>（<a href="https://github.com/kelseyhightower/kubernetes-the-hard-way">GitHub</a>）：不用任何安裝工具，一個元件一個元件把叢集架起來。做完一次，憑證、網路、控制平面怎麼接在一起就再也不會模糊。</li>
<li><b>Josh Rosso 等《Production Kubernetes》</b>（O'Reilly）：專講正式環境的取捨：網路、儲存、多租戶、平台團隊怎麼設計。</li>
<li><b>Michael Hausenblas、Stefan Schimanski《Programming Kubernetes》</b>（O'Reilly）：控制器、informer、CRD 和 Operator 的內部運作，想自己寫 Operator 必讀。</li>
<li><b>CKA 與 CKS 考試</b>（Linux Foundation）：以實作為主的認證，準備過程本身就是最好的練習；搭配 Killercoda 上的免費情境題。</li>
</ul>
` });
