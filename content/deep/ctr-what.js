DEEP({ 'ctr-what': `
<p>上一課用兩個比喻講容器：戴上眼罩（命名空間）、給一筆預算（cgroups），再加上一疊唯讀的檔案層。這一章把三樣東西一個一個拆開：每一種眼罩遮住了什麼、預算撞到上限的那一刻核心做了什麼、映像檔的層怎麼疊成一個檔案系統、從你打 <code>docker run</code> 到程式開始跑，中間經過哪幾支程式。最後是怎麼做出又小又安全的映像檔，以及容器為什麼逃得出去。第 0.9 課的 PID 1 和 seccomp、第 1.9 課的 capabilities 和 cgroup，這裡都會接著用。</p>

<h3><span class="badge lv1">基礎</span>一、核心裡沒有「容器」這種東西</h3>
<p>先講一個會讓很多人意外的事實：Linux 核心的原始碼裡，沒有一個東西叫做「容器」。核心提供的是好幾個<b>各自獨立</b>的功能：命名空間、cgroups、capabilities、seccomp、掛載。Docker 這類工具做的事，只是把這些功能依序套到一個普通的行程上。套完之後，這個行程「看起來」像住在一台自己的小機器裡。</p>
<p>比喻成一棟套房大樓最貼切。虛擬機是獨棟透天：自己的地基、自己的水電，蓋起來慢，但隔壁失火燒不過來。容器是同一棟大樓裡的套房：共用同一個地基和水電管線（核心），每一間有自己的門牌、自己的信箱、自己的電錶（預算）。房客從門縫看出去只看得到自己那一間，可是大樓管理員（核心）看得到所有人。</p>
<figure class="figure"><svg viewBox="0 0 660 290" class="fg" style="width:100%;max-width:660px" role="img" aria-label="同一個 nginx 行程，從主機看是 PID 23817，從容器裡看是 PID 1；主機名稱、網卡、根目錄也各看到不同的樣子">
<rect x="10" y="10" width="290" height="268" rx="10" class="fg-b"/>
<text x="155" y="34" text-anchor="middle" class="fg-t lg">主機看到的</text>
<text x="24" y="66" class="fg-t sm mono">PID 1</text><text x="104" y="66" class="fg-t sm mono">systemd</text>
<text x="24" y="88" class="fg-t sm mono">PID 23790</text><text x="104" y="88" class="fg-t sm mono">containerd-shim</text>
<rect x="18" y="98" width="274" height="24" rx="4" class="fg-b hot"/><text x="24" y="115" class="fg-t sm mono">PID 23817</text><text x="104" y="115" class="fg-t sm mono">nginx: master</text>
<rect x="18" y="126" width="274" height="24" rx="4" class="fg-b alt"/><text x="24" y="143" class="fg-t sm mono">PID 23850</text><text x="104" y="143" class="fg-t sm mono">nginx: worker</text>
<text x="24" y="180" class="fg-t sm">主機名稱：ip-10-0-1-7</text>
<text x="24" y="204" class="fg-t sm">網卡：eth0 10.0.1.7</text>
<text x="24" y="228" class="fg-t sm">根目錄：主機的 /</text>
<text x="24" y="252" class="fg-t sm">看得到每一個行程</text>
<rect x="370" y="10" width="280" height="268" rx="10" class="fg-b"/>
<text x="510" y="34" text-anchor="middle" class="fg-t lg">容器裡看到的</text>
<text x="384" y="66" class="fg-t sm">（只有自己這一間）</text>
<rect x="378" y="98" width="264" height="24" rx="4" class="fg-b hot"/><text x="384" y="115" class="fg-t sm mono">PID 1</text><text x="444" y="115" class="fg-t sm mono">nginx: master</text>
<rect x="378" y="126" width="264" height="24" rx="4" class="fg-b alt"/><text x="384" y="143" class="fg-t sm mono">PID 29</text><text x="444" y="143" class="fg-t sm mono">nginx: worker</text>
<text x="384" y="180" class="fg-t sm">主機名稱：3f9a1c2b7d10</text>
<text x="384" y="204" class="fg-t sm">網卡：eth0 172.17.0.2</text>
<text x="384" y="228" class="fg-t sm">根目錄：映像檔裡的檔案</text>
<text x="384" y="252" class="fg-t sm">看不到主機的其他行程</text>
<line x1="306" y1="110" x2="364" y2="110" class="fg-l on"/><polygon points="370,110 362,105.5 362,114.5" class="fg-a on"/><polygon points="300,110 308,105.5 308,114.5" class="fg-a on"/>
<text x="335" y="92" text-anchor="middle" class="fg-t sm acc">同一個</text>
<line x1="306" y1="138" x2="364" y2="138" class="fg-l alt"/><polygon points="370,138 362,133.5 362,142.5" class="fg-a alt"/><polygon points="300,138 308,133.5 308,142.5" class="fg-a alt"/>
</svg><figcaption>同一個行程，兩種看法。核心替它準備了另一套 PID 編號、另一個主機名稱、另一組網卡和另一個根目錄，所以它在裡面以為自己是 PID 1。</figcaption></figure>
<p>在 Linux 主機上可以親眼驗證。每一種命名空間都有一個編號，列在 <code>/proc/PID/ns/</code> 底下；兩個行程的編號一樣，就代表它們在同一個命名空間裡：</p>
<pre><code>$ docker inspect -f '{{.State.Pid}}' web
23817
$ sudo ls -l /proc/23817/ns | awk '{print $9, $11}'   # 節錄
ipc 'ipc:[4026532546]'
mnt 'mnt:[4026532544]'
net 'net:[4026532549]'
pid 'pid:[4026532547]'
uts 'uts:[4026532545]'
$ sudo ls -l /proc/1/ns/net
... /proc/1/ns/net -&gt; 'net:[4026531840]'   # 主機的，跟容器的不一樣</code></pre>
<p>容器裡看到的世界，就是這幾個編號背後的那一份。所以「容器」更準確的說法是：<b>一個行程，加上它被放進去的那一組命名空間和 cgroup</b>。</p>

<h3><span class="badge lv1">基礎</span>二、八種眼罩，一個一個看</h3>
<p>Linux 目前有八種命名空間。容器執行環境預設用其中六、七種：</p>
<table>
<tr><th>命名空間</th><th>隔開什麼</th><th>容器裡看到的</th></tr>
<tr><td><b>mnt</b>（掛載）</td><td>掛載表，也就是「哪個目錄是哪個檔案系統」</td><td>根目錄是映像檔的檔案，看不到主機的 <code>/home</code></td></tr>
<tr><td><b>uts</b></td><td>主機名稱</td><td>Docker 預設用容器 ID 的前 12 碼</td></tr>
<tr><td><b>ipc</b></td><td>System V 共享記憶體、POSIX 訊息佇列</td><td>跟別的容器不能用共享記憶體溝通</td></tr>
<tr><td><b>pid</b></td><td>行程編號</td><td>第一個行程是 PID 1，看不到外面的行程</td></tr>
<tr><td><b>net</b></td><td>網卡、IP、路由表、防火牆規則、連接埠</td><td>自己的 <code>eth0</code>、自己的 <code>127.0.0.1</code></td></tr>
<tr><td><b>user</b></td><td>使用者和群組 ID 的對照</td><td>裡面的 0 可以對到外面的 100000</td></tr>
<tr><td><b>cgroup</b></td><td>cgroup 樹的視角</td><td>自己的 cgroup 看起來就是根</td></tr>
<tr><td><b>time</b></td><td>開機時間、單調時鐘的偏移</td><td>很少用，主要給搬遷容器的工具</td></tr>
</table>
<h4>pid：自己的一套編號</h4>
<p>PID 命名空間裡的第一個行程拿到 1 號，第 0.9 課講過的「PID 1 不執行訊號預設動作」「PID 1 要負責收殭屍」就是從這裡來的。它是巢狀的：主機看得到容器裡的行程（用主機的編號），容器看不到主機的。可以不用 Docker，自己做一個：</p>
<pre><code>$ sudo unshare --pid --fork --mount-proc bash
# ps aux
USER   PID %CPU %MEM ... COMMAND
root     1  0.0  0.0 ... bash
root     8  0.0  0.0 ... ps aux</code></pre>
<p>注意 <code>--mount-proc</code>：它重新掛一份 <code>/proc</code>。少了它，<code>ps</code> 讀到的還是主機的 <code>/proc</code>，照樣列出所有行程。這正好印證第 1.9 課說的：<code>ps</code> 只是在讀 <code>/proc</code>。</p>
<h4>net：自己的網卡、自己的 127.0.0.1</h4>
<figure class="figure"><svg viewBox="0 0 680 290" class="fg" style="width:100%;max-width:680px" role="img" aria-label="兩個容器各有自己的網路命名空間和 eth0，透過一對對 veth 接到主機上的 docker0 橋接器，再經過 NAT 從主機的 eth0 出去；-p 8080:80 把主機的 8080 轉到容器 A 的 80">
<rect x="10" y="10" width="660" height="270" rx="10" class="fg-b"/>
<text x="26" y="34" class="fg-t lg">主機的根網路命名空間</text>
<rect x="30" y="50" width="200" height="86" rx="8" class="fg-b alt"/>
<text x="130" y="72" text-anchor="middle" class="fg-t">容器 A 的網路命名空間</text>
<text x="44" y="98" class="fg-t sm mono">eth0  172.17.0.2</text>
<text x="44" y="120" class="fg-t sm">lo  127.0.0.1（自己的）</text>
<rect x="30" y="170" width="200" height="86" rx="8" class="fg-b alt"/>
<text x="130" y="192" text-anchor="middle" class="fg-t">容器 B 的網路命名空間</text>
<text x="44" y="218" class="fg-t sm mono">eth0  172.17.0.3</text>
<text x="44" y="240" class="fg-t sm">lo  127.0.0.1（自己的）</text>
<rect x="300" y="110" width="140" height="70" rx="8" class="fg-b hot"/>
<text x="370" y="138" text-anchor="middle" class="fg-t acc">docker0 橋接器</text>
<text x="370" y="160" text-anchor="middle" class="fg-t sm mono">172.17.0.1</text>
<rect x="520" y="110" width="130" height="70" rx="8" class="fg-b"/>
<text x="585" y="138" text-anchor="middle" class="fg-t">主機 eth0</text>
<text x="585" y="160" text-anchor="middle" class="fg-t sm mono">10.0.1.7</text>
<path d="M230 93 H262 V128 H292" class="fg-l"/><polygon points="300,128 292,123.5 292,132.5" class="fg-a"/>
<path d="M230 213 H262 V162 H292" class="fg-l"/><polygon points="300,162 292,157.5 292,166.5" class="fg-a"/>
<text x="270" y="150" class="fg-t sm">veth</text>
<line x1="448" y1="145" x2="512" y2="145" class="fg-l alt"/><polygon points="520,145 512,140.5 512,149.5" class="fg-a alt"/><polygon points="440,145 448,140.5 448,149.5" class="fg-a alt"/>
<text x="480" y="134" text-anchor="middle" class="fg-t sm alt">NAT</text>
<text x="470" y="210" text-anchor="middle" class="fg-t sm mono">-p 8080:80</text>
<text x="470" y="230" text-anchor="middle" class="fg-t sm mono">:8080 → 172.17.0.2:80</text>
<line x1="610" y1="262" x2="610" y2="188" class="fg-l on"/><polygon points="610,180 605.5,188 614.5,188" class="fg-a on"/>
<text x="600" y="266" text-anchor="end" class="fg-t sm acc">外面連進來</text>
</svg><figcaption>每個容器有自己的一組網卡。一對 veth 像一條兩頭的網路線，一頭在容器裡叫 eth0，另一頭插在主機的橋接器上。<code>-p</code> 是在主機上加一條 NAT 規則，把連到 8080 的封包改寫成容器的位址。</figcaption></figure>
<p>這張圖解釋了容器網路最常見的兩個坑：</p>
<ul>
<li><b>程式聽 127.0.0.1，外面永遠連不到。</b>容器的 <code>127.0.0.1</code> 是容器<b>自己的</b> lo，從 <code>-p</code> 轉進來的封包是從 eth0 進來的。你的 Node 程式寫 <code>listen(3000, '127.0.0.1')</code>，在筆電上好好的，包進容器就變成「connection reset」。容器裡要聽 <code>0.0.0.0</code>。第 0.13 課講的 bind 位址，在這裡換了一種方式咬你。</li>
<li><b>Docker 發布的連接埠會繞過 ufw。</b>Docker 直接在 iptables 裡插入自己的規則，順序在 ufw 的規則之前，所以你 <code>ufw deny 5432</code> 擋不住 <code>-p 5432:5432</code> 的資料庫。只給本機用的連接埠，要寫成 <code>-p 127.0.0.1:5432:5432</code>。</li>
</ul>
<p>值班時還有一招很好用：精簡的映像檔裡沒有 <code>ss</code>，你可以只進入它的<b>網路</b>命名空間，用主機自己的工具看：<code>sudo nsenter -t 23817 -n ss -tlnp</code>。<code>-n</code> 只換網路，檔案系統還是主機的，所以主機上的 <code>ss</code>、<code>tcpdump</code> 都能用。</p>
<h4>user：容器裡的 root，可以不是主機的 root</h4>
<p>user 命名空間是一張 ID 對照表。<code>/proc/PID/uid_map</code> 裡寫著 <code>0 100000 65536</code>，意思是「容器裡的 0 到 65535，對到主機的 100000 到 165535」。容器裡的 root 在主機上只是一個沒人認識的 100000 號，就算逃出去，手上也沒有任何權限。Podman 和 rootless Docker 預設就這樣做；但<b>一般的 Docker 預設沒有開</b>，容器裡的 uid 0 就是主機的 uid 0，只是被拿掉了大部分 capabilities。Kubernetes 也在 1.30 把它推到 beta（Pod 設 <code>hostUsers: false</code>）。第七節會看到，這一層有沒有開，決定了「逃出去」之後是主機 root 還是無名小卒。</p>

<h3><span class="badge lv2">進階</span>三、cgroups v2：預算怎麼記帳，撞到上限會怎樣</h3>
<p>命名空間管「看得到什麼」，cgroups 管「用得了多少」。現代發行版用的是 <b>cgroup v2</b>：整台機器只有一棵樹，掛在 <code>/sys/fs/cgroup</code>，每個節點是一個目錄，每個設定是一個檔案。<code>stat -fc %T /sys/fs/cgroup</code> 印出 <code>cgroup2fs</code> 就是 v2。舊的 v1 每種資源各有一棵樹，新版 Kubernetes 已經把 v1 列為只維護、不再加新功能。</p>
<p>找到一個容器的 cgroup，再看 Docker 參數變成了什麼：</p>
<pre><code>$ cat /proc/23817/cgroup
0::/system.slice/docker-3f9a1c2b7d10….scope
$ cd /sys/fs/cgroup/system.slice/docker-3f9a1c2b7d10….scope
$ cat memory.max cpu.max pids.max
268435456          # docker run -m 256m
50000 100000       # --cpus 0.5：每 100 毫秒最多用 50 毫秒
100                # --pids-limit 100</code></pre>
<table>
<tr><th>檔案</th><th>意思</th><th>到了會怎樣</th></tr>
<tr><td><code>memory.max</code></td><td>記憶體硬上限</td><td>回收不了就在這個 cgroup 裡 OOM kill</td></tr>
<tr><td><code>memory.high</code></td><td>軟上限、節流線</td><td>被拖慢、被迫回收，但<b>不會被殺</b></td></tr>
<tr><td><code>cpu.max</code></td><td>每一期能用多少 CPU 時間</td><td>用完就整個暫停到下一期（節流）</td></tr>
<tr><td><code>cpu.weight</code></td><td>搶 CPU 時的相對份量，預設 100</td><td>沒人搶時不起作用</td></tr>
<tr><td><code>pids.max</code></td><td>最多幾個行程、執行緒</td><td><code>fork()</code> 失敗，擋住 fork 炸彈</td></tr>
<tr><td><code>io.max</code></td><td>每顆磁碟的讀寫速度、次數上限</td><td>被限速</td></tr>
</table>
<h4>記憶體撞到上限的那一刻</h4>
<figure class="figure"><svg viewBox="0 0 640 280" class="fg" style="width:100%;max-width:640px" role="img" aria-label="記憶體用量隨時間上升：超過 memory.high 之後被拖慢並被迫回收，曲線變平；碰到 memory.max 又回收不了時被 OOM kill，用量掉到底，容器被重新啟動">
<line x1="60" y1="240" x2="60" y2="30" class="fg-l"/>
<line x1="60" y1="240" x2="602" y2="240" class="fg-l"/><polygon points="610,240 602,235.5 602,244.5" class="fg-a"/>
<text x="60" y="22" text-anchor="middle" class="fg-t sm">記憶體</text>
<text x="610" y="262" text-anchor="end" class="fg-t sm">時間</text>
<line x1="60" y1="60" x2="610" y2="60" class="fg-l warm dash"/>
<text x="605" y="52" text-anchor="end" class="fg-t sm warm">memory.max（512M）</text>
<line x1="60" y1="110" x2="610" y2="110" class="fg-l alt dash"/>
<text x="68" y="102" class="fg-t sm alt">memory.high（400M）</text>
<polyline points="60,225 120,195 180,160 230,120 250,110 270,108 290,104 305,108 325,99 345,103 365,93 385,97 405,86 425,90 445,76 460,66 470,61" class="fg-l on"/>
<line x1="470" y1="61" x2="470" y2="228" class="fg-l warm"/>
<polyline points="470,228 520,205 570,180 610,165" class="fg-l on dash"/>
<text x="150" y="222" class="fg-t sm">memory.current</text>
<text x="256" y="140" class="fg-t sm alt">① 超過 high：變慢、被迫回收</text>
<text x="478" y="90" class="fg-t sm warm">② 回收不了：OOM kill</text>
<text x="478" y="150" class="fg-t sm">③ 結束碼 137，重新啟動</text>
</svg><figcaption>memory.high 是踩煞車，memory.max 是撞牆。只設 max，程式會全速撞上去；兩個都設，程式在撞牆之前會先明顯變慢，監控有機會先叫你。</figcaption></figure>
<p>一步一步看核心做了什麼：</p>
<ol>
<li>容器裡的程式要一頁新的記憶體，核心先把這一頁記在它的 cgroup 帳上（<code>memory.current</code> 增加）。</li>
<li>超過 <code>memory.high</code>：核心讓這個 cgroup 的行程在每次配置時先幫忙回收，並且刻意延遲它們。程式還活著，但變慢了。</li>
<li>碰到 <code>memory.max</code>：核心在這個 cgroup 裡<b>同步回收</b>：丟掉乾淨的檔案快取、把髒頁寫回磁碟、有 swap 的話搬過去。只要能騰出空間，程式就繼續跑。</li>
<li>真的騰不出來：在這個 cgroup 裡挑一個行程 OOM kill。<code>memory.events</code> 裡的計數會增加，容器的主行程死掉就結束，結束代碼 137。</li>
</ol>
<pre><code>$ cat memory.events
low 0
high 2210        # 超過 high 被節流的次數
max 1532         # 碰到 max 的次數
oom 1
oom_kill 1       # 真的殺了一個</code></pre>
<p>第 3 步藏著一個常讓人誤判的地方：<code>memory.current</code> <b>包含頁快取</b>。一個一直在讀寫檔案的容器，用量長期貼著上限，看起來快爆了，其實大部分是可以丟的快取，永遠不會被殺。看 <code>memory.stat</code> 的 <code>anon</code>（程式自己配置、丟不掉的）和 <code>file</code>（快取）就分得出來。Kubernetes 的 <code>kubectl top</code> 和驅逐判斷用的是「工作集」（working set），也就是扣掉不活躍的檔案快取之後的數字，正是為了避開這個誤判。</p>
<p>CPU 的上限第 0.9 課已經算過：配額用完就整個暫停到下一期，延遲出現尖刺。補一個區別：<code>cpu.max</code> 是硬上限，就算機器很閒也不能多用；<code>cpu.weight</code> 只在大家搶的時候才分比例。Kubernetes 的 <code>requests.cpu</code> 會變成 weight，<code>limits.cpu</code> 會變成 max；而 <code>requests.memory</code> 只拿來排程，cgroup 預設不會替它保留記憶體。</p>

<h3><span class="badge lv2">進階</span>四、映像檔的層與 overlay 檔案系統</h3>
<p>一個映像檔拆開來只有三種東西，每一個都用內容的 sha256 雜湊當名字：</p>
<ul>
<li><b>層</b>（layer）：一個 tar 壓縮檔，裝的是「這一步新增、修改、刪除了哪些檔案」。</li>
<li><b>設定</b>（config）：一段 JSON，記著環境變數、要執行的指令、使用者、工作目錄、建置歷史。<code>docker history</code> 讀的就是它。</li>
<li><b>清單</b>（manifest）：列出「這個映像檔由哪個 config 和哪幾層組成」。同一個標籤還可以有一份<b>索引</b>（index），指向 amd64、arm64 各自的清單。</li>
</ul>
<p>最後那一點對 Mac 使用者特別重要。M 系列晶片是 arm64，你在筆電上 <code>docker build</code> 出來的預設是 arm64 映像檔；推到 amd64 的雲端主機，跑起來就是「exec format error」。用 <code>docker buildx build --platform linux/amd64,linux/arm64</code> 一次建兩種，讓索引去挑。</p>
<p>容器跑起來時，這些層要疊成一個看起來完整的根目錄。Linux 用的是 <b>OverlayFS</b>：把好幾個唯讀的目錄（lowerdir）疊在下面，上面放一個可寫的目錄（upperdir），對外呈現一個合併後的畫面（merged）。</p>
<figure class="figure"><svg viewBox="0 0 660 296" class="fg" style="width:100%;max-width:660px" role="img" aria-label="OverlayFS 的層：三個唯讀層加上容器的可寫層，合併成容器看到的畫面；讀取從上往下找，修改會把檔案複製到可寫層，刪除會留下刪除標記">
<rect x="20" y="20" width="400" height="44" rx="6" class="fg-b alt"/>
<rect x="20" y="96" width="400" height="36" rx="6" class="fg-b hot"/>
<rect x="20" y="146" width="400" height="36" rx="6" class="fg-b"/>
<rect x="20" y="196" width="400" height="36" rx="6" class="fg-b"/>
<rect x="20" y="246" width="400" height="36" rx="6" class="fg-b"/>
<text x="432" y="47" class="fg-t alt">合併畫面 merged</text>
<text x="432" y="119" class="fg-t acc">可寫層 upperdir</text>
<text x="432" y="169" class="fg-t">第 3 層：COPY app/</text>
<text x="432" y="219" class="fg-t">第 2 層：RUN apt-get</text>
<text x="432" y="269" class="fg-t">第 1 層：debian:12-slim</text>
<rect x="35" y="30" width="110" height="24" rx="4" class="fg-b"/><text x="90" y="47" text-anchor="middle" class="fg-t sm">passwd（改過）</text>
<rect x="165" y="30" width="110" height="24" rx="4" class="fg-b"/><text x="220" y="47" text-anchor="middle" class="fg-t sm">config.json</text>
<rect x="295" y="30" width="110" height="24" rx="4" class="fg-b dash"/><text x="350" y="47" text-anchor="middle" class="fg-t sm">沒有 cache.db</text>
<rect x="35" y="102" width="110" height="24" rx="4" class="fg-b warm"/><text x="90" y="119" text-anchor="middle" class="fg-t sm">passwd（改過）</text>
<rect x="295" y="102" width="110" height="24" rx="4" class="fg-b warm dash"/><text x="350" y="119" text-anchor="middle" class="fg-t sm">cache.db 刪除標記</text>
<rect x="165" y="152" width="110" height="24" rx="4" class="fg-b"/><text x="220" y="169" text-anchor="middle" class="fg-t sm">config.json</text>
<rect x="295" y="202" width="110" height="24" rx="4" class="fg-b"/><text x="350" y="219" text-anchor="middle" class="fg-t sm">cache.db</text>
<rect x="35" y="252" width="110" height="24" rx="4" class="fg-b"/><text x="90" y="269" text-anchor="middle" class="fg-t sm">passwd 原版</text>
<line x1="90" y1="54" x2="90" y2="94" class="fg-l"/><polygon points="90,102 85.5,94 94.5,94" class="fg-a"/>
<line x1="220" y1="54" x2="220" y2="144" class="fg-l"/><polygon points="220,152 215.5,144 224.5,144" class="fg-a"/>
<line x1="350" y1="54" x2="350" y2="94" class="fg-l"/><polygon points="350,102 345.5,94 354.5,94" class="fg-a"/>
<line x1="90" y1="252" x2="90" y2="134" class="fg-l warm dash"/><polygon points="90,126 85.5,134 94.5,134" class="fg-a warm"/>
<text x="100" y="219" class="fg-t sm warm">copy-up</text>
<line x1="350" y1="126" x2="350" y2="202" class="fg-l warm dash"/>
<text x="358" y="169" class="fg-t sm warm">遮住</text>
</svg><figcaption>讀：從上往下找，第一個找到的就算數（config.json 一路落到第 3 層）。寫：先把整個檔案從下面複製到可寫層再改（copy-up）。刪：在可寫層放一個「刪除標記」（whiteout），把下面那一份遮住。</figcaption></figure>
<p>這三條規則，直接推出寫 Dockerfile 時的四件事：</p>
<ol>
<li><b>後面的 RUN rm 不會讓映像檔變小。</b>檔案還好好地躺在下面那一層，上面只是多了一個刪除標記。要清掉，必須在<b>同一個</b> RUN 裡做：<code>RUN apt-get update &amp;&amp; apt-get install -y curl &amp;&amp; rm -rf /var/lib/apt/lists/*</code>。</li>
<li><b>機密刪了也還在。</b>COPY 進一把金鑰、用完再 rm，任何人用 <code>docker save</code> 把映像檔解開，翻到那一層就拿得到。</li>
<li><b>大檔案的第一次寫入很貴。</b>改一個 2 GB 資料庫檔的一個位元組，也要先把 2 GB 整個複製上來。資料庫和大量寫入的東西一律放<b>儲存卷</b>：儲存卷直接掛在那個路徑上，完全繞過 overlay，速度是原生的，容器刪掉也還在。</li>
<li><b>層是快取的單位。</b>建置時，某一層的輸入沒變就直接重用。先 COPY 套件清單、裝套件，最後才 COPY 原始碼，改一行程式碼就只要重跑最後幾層。順序擺錯，每次都從 <code>npm ci</code> 重來，一次建置從十秒變兩分鐘。</li>
</ol>

<h3><span class="badge lv2">進階</span>五、從 docker run 到 runc：誰負責哪一段</h3>
<p>你打一行 <code>docker run</code>，背後其實是四、五支程式在接力：</p>
<figure class="figure"><svg viewBox="0 0 680 340" class="fg" style="width:100%;max-width:680px" role="img" aria-label="容器執行環境的分工：docker CLI 透過 docker.sock 呼叫 dockerd，dockerd 和 kubelet 都用 gRPC 呼叫 containerd，containerd 為每個容器開一個 shim，shim 呼叫 runc 建立容器，runc 退出後由 shim 看著容器行程">
<rect x="30" y="20" width="200" height="40" rx="6" class="fg-b"/><text x="130" y="45" text-anchor="middle" class="fg-t mono">docker CLI</text>
<rect x="30" y="96" width="200" height="44" rx="6" class="fg-b"/><text x="130" y="116" text-anchor="middle" class="fg-t mono">dockerd</text><text x="130" y="133" text-anchor="middle" class="fg-t sm">Docker 的常駐程式</text>
<rect x="450" y="20" width="200" height="40" rx="6" class="fg-b"/><text x="550" y="45" text-anchor="middle" class="fg-t">API server</text>
<rect x="450" y="96" width="200" height="44" rx="6" class="fg-b"/><text x="550" y="116" text-anchor="middle" class="fg-t mono">kubelet</text><text x="550" y="133" text-anchor="middle" class="fg-t sm">每台節點一個</text>
<line x1="130" y1="60" x2="130" y2="88" class="fg-l"/><polygon points="130,96 125.5,88 134.5,88" class="fg-a"/><text x="140" y="82" class="fg-t sm">REST：docker.sock</text>
<line x1="550" y1="60" x2="550" y2="88" class="fg-l"/><polygon points="550,96 545.5,88 554.5,88" class="fg-a"/><text x="560" y="82" class="fg-t sm">watch</text>
<rect x="240" y="170" width="200" height="48" rx="8" class="fg-b hot"/><text x="340" y="190" text-anchor="middle" class="fg-t acc">containerd</text><text x="340" y="208" text-anchor="middle" class="fg-t sm">拉映像檔、解層、管生命週期</text>
<path d="M130 140 V194 H232" class="fg-l"/><polygon points="240,194 232,189.5 232,198.5" class="fg-a"/><text x="140" y="170" class="fg-t sm">gRPC</text>
<path d="M550 140 V194 H448" class="fg-l alt"/><polygon points="440,194 448,189.5 448,198.5" class="fg-a alt"/><text x="540" y="170" text-anchor="end" class="fg-t sm alt">CRI（gRPC）</text>
<rect x="240" y="244" width="200" height="40" rx="6" class="fg-b"/><text x="340" y="268" text-anchor="middle" class="fg-t sm mono">containerd-shim-runc-v2</text>
<line x1="340" y1="218" x2="340" y2="236" class="fg-l"/><polygon points="340,244 335.5,236 344.5,236" class="fg-a"/><text x="350" y="234" class="fg-t sm">每個容器一個</text>
<rect x="30" y="292" width="200" height="40" rx="6" class="fg-b warm dash"/><text x="130" y="317" text-anchor="middle" class="fg-t">runc：設好就退出</text>
<rect x="450" y="292" width="200" height="40" rx="6" class="fg-b hot"/><text x="550" y="317" text-anchor="middle" class="fg-t">nginx（容器的 PID 1）</text>
<path d="M240 264 H130 V284" class="fg-l"/><polygon points="130,292 125.5,284 134.5,284" class="fg-a"/><text x="146" y="284" class="fg-t sm">① 呼叫</text>
<line x1="230" y1="312" x2="442" y2="312" class="fg-l warm"/><polygon points="450,312 442,307.5 442,316.5" class="fg-a warm"/><text x="340" y="304" text-anchor="middle" class="fg-t sm warm">② 套好眼罩和預算，exec</text>
<path d="M440 264 H550 V284" class="fg-l on"/><polygon points="550,292 545.5,284 554.5,284" class="fg-a on"/><text x="562" y="284" class="fg-t sm acc">③ 看著它</text>
</svg><figcaption>Docker 和 Kubernetes 從 containerd 開始走同一條路。真正動手建立容器的 runc 做完就退出，之後由 shim 當容器的父行程：保管它的輸出、回報結束代碼。</figcaption></figure>
<p>以 <code>docker run -d -p 8080:80 nginx:1.27</code> 為例，照順序：</p>
<ol>
<li><b>CLI → dockerd</b>：CLI 把請求變成 HTTP，送到 <code>/var/run/docker.sock</code>。誰能寫這個 socket，誰就能指揮 dockerd，而 dockerd 是 root。記住這句，第七節會用到。</li>
<li><b>拉映像檔</b>：本機沒有的話，containerd 用標籤查到清單，下載缺少的層，解開成快照（snapshot）。</li>
<li><b>準備網路</b>：建一對 veth、接上橋接器、為 <code>-p</code> 加上 NAT 規則。</li>
<li><b>做出 OCI bundle</b>：一個根目錄（overlay 掛好的 merged）加上一份 <code>config.json</code>，寫著要哪些命名空間、cgroup 上限、掛載、capabilities、seccomp 設定檔、使用者、環境變數和指令。這份格式是 <b>OCI</b>（Open Container Initiative）標準規定的。</li>
<li><b>containerd 開一個 shim，shim 叫 runc</b>。runc 照 <code>config.json</code> 依序：用 <code>clone()</code> 建立新的命名空間、把自己放進 cgroup、掛好 <code>/proc</code> 和 <code>/dev</code>、用 <code>pivot_root</code> 換掉根目錄、丟掉不需要的 capabilities、套上 seccomp 和 AppArmor／SELinux、切換到指定的使用者，最後 <code>execve</code> 成 nginx。</li>
<li><b>runc 退出</b>。shim 留下來當 nginx 的父行程。所以 containerd 甚至 dockerd 重啟時，容器不必跟著死。</li>
</ol>
<pre><code>$ pstree -p | grep -A2 containerd-shim
containerd-shim(23790)───nginx(23817)─┬─nginx(23850)
                                       └─nginx(23851)</code></pre>
<p>行程名稱最多 15 個字元，所以 <code>containerd-shim-runc-v2</code> 在這裡被截成 <code>containerd-shim</code>，而 runc 已經不在了。</p>
<h4>「Kubernetes 不用 Docker 了」是什麼意思</h4>
<p>Kubernetes 1.24 移除了 dockershim，從此 kubelet 透過 <b>CRI</b>（Container Runtime Interface）直接跟 containerd 或 CRI-O 說話，中間不經過 dockerd。用 Docker 建出來的映像檔照樣能跑，因為它們是 OCI 映像檔，大家都看得懂。被拿掉的只是 dockerd 這個中間人。底層的 runc 也可以換：<b>crun</b> 用 C 寫的，啟動更快、更省記憶體；<b>gVisor</b> 在使用者空間重寫了一大部分核心，攔下容器的系統呼叫自己處理；<b>Kata Containers</b> 替每個 Pod 開一台小虛擬機。Kubernetes 用 RuntimeClass 讓你逐個 Pod 挑。</p>

<h3><span class="badge lv3">專業</span>六、做出小而安全的映像檔</h3>
<p>映像檔裡的每一個套件，都是一個可能的漏洞，也是攻擊者進來之後可以用的工具。目標很單純：<b>只放執行需要的東西</b>。最有效的工具是多階段建置：</p>
<figure class="figure"><svg viewBox="0 0 660 270" class="fg" style="width:100%;max-width:660px" role="img" aria-label="多階段建置：建置階段有編譯器、原始碼和快取，數百 MB；只有編好的執行檔被複製到只有幾 MB 的執行階段">
<rect x="20" y="20" width="260" height="210" rx="10" class="fg-b"/>
<text x="150" y="44" text-anchor="middle" class="fg-t lg">建置階段</text>
<text x="150" y="64" text-anchor="middle" class="fg-t sm mono">golang:1.25（數百 MB）</text>
<rect x="36" y="80" width="228" height="28" rx="4" class="fg-b"/><text x="150" y="99" text-anchor="middle" class="fg-t sm">Go 編譯器與工具鏈</text>
<rect x="36" y="114" width="228" height="28" rx="4" class="fg-b"/><text x="150" y="133" text-anchor="middle" class="fg-t sm">原始碼、.git、測試檔</text>
<rect x="36" y="148" width="228" height="28" rx="4" class="fg-b"/><text x="150" y="167" text-anchor="middle" class="fg-t sm">模組快取 go mod download</text>
<rect x="36" y="182" width="228" height="28" rx="4" class="fg-b hot"/><text x="150" y="201" text-anchor="middle" class="fg-t sm acc">編好的 /out/hilo（約 10 MB）</text>
<rect x="400" y="40" width="240" height="170" rx="10" class="fg-b"/>
<text x="520" y="64" text-anchor="middle" class="fg-t lg">執行階段</text>
<text x="520" y="84" text-anchor="middle" class="fg-t sm mono">distroless/static（約 2 MB）</text>
<rect x="416" y="100" width="208" height="28" rx="4" class="fg-b"/><text x="520" y="119" text-anchor="middle" class="fg-t sm">CA 憑證、時區資料</text>
<rect x="416" y="134" width="208" height="28" rx="4" class="fg-b"/><text x="520" y="153" text-anchor="middle" class="fg-t sm">nonroot 使用者 uid 65532</text>
<rect x="416" y="168" width="208" height="28" rx="4" class="fg-b hot"/><text x="520" y="187" text-anchor="middle" class="fg-t sm acc">/hilo</text>
<path d="M264 196 H340 V182 H408" class="fg-l on"/><polygon points="416,182 408,177.5 408,186.5" class="fg-a on"/>
<text x="340" y="226" text-anchor="middle" class="fg-t sm mono">COPY --from</text>
<text x="330" y="258" text-anchor="middle" class="fg-t sm">最後的映像檔約十幾 MB：沒有 shell、沒有套件管理器、沒有原始碼</text>
</svg><figcaption>左邊整個丟掉，只有那一個執行檔過橋到右邊。數字是未壓縮大小的數量級，版本不同會差一些。</figcaption></figure>
<pre><code># 建置階段：有完整的工具鏈
FROM golang:1.25 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/hilo ./cmd/hilo

# 執行階段：只有這一個檔案
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/hilo /hilo
USER 65532:65532
EXPOSE 8080
ENTRYPOINT ["/hilo"]</code></pre>
<p><code>CGO_ENABLED=0</code> 讓 Go 編出不依賴 C 函式庫的靜態執行檔，所以連 libc 都不需要的 <code>static</code> 映像檔就夠了。Node 專案沒辦法這麼極端，但同一個原則照用：建置階段用完整的 <code>node</code> 映像檔跑 <code>npm ci</code> 和編譯 TypeScript，執行階段換成 slim 或 distroless 的 Node 映像檔，只複製 <code>dist/</code> 和 <code>npm ci --omit=dev</code> 裝出來的正式相依套件，最後 <code>USER node</code>。</p>
<h4>其他五條規矩，和它們背後的理由</h4>
<ul>
<li><b>用數字寫使用者。</b>Kubernetes 的 <code>runAsNonRoot: true</code> 只能檢查數字：映像檔寫 <code>USER node</code>，它無法確定 node 不是 0，會拒絕啟動；寫 <code>USER 1000</code> 就沒問題。</li>
<li><b>用摘要鎖定基底。</b>標籤是可以移動的指標，今天的 <code>node:22-slim</code> 和下個月的不是同一份。寫成 <code>FROM node:22-slim@sha256:…</code>，內容就被鎖死。代價是不會自動拿到安全更新，所以要配 Renovate 或 Dependabot 定期開 PR 更新摘要：每一次變動都看得到、可以審查、可以回復。</li>
<li><b>建置時的機密用 BuildKit 的 secret 掛載。</b><code>RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci</code>，建置時用 <code>docker build --secret id=npmrc,src=.npmrc .</code> 傳進去。這個檔案只在那一步存在，不會進任何一層。</li>
<li><b>寫好 .dockerignore。</b>沒寫的話，<code>COPY . .</code> 會把 <code>.git</code>、<code>.env</code>、<code>node_modules</code> 一起送進建置環境，有時候就這樣進了映像檔。</li>
<li><b>根目錄唯讀。</b><code>docker run --read-only --tmpfs /tmp</code>，或 Kubernetes 的 <code>readOnlyRootFilesystem: true</code>。攻擊者進來之後連一支工具都放不下去。</li>
</ul>
<p>最後在管線裡用 Trivy 或 Grype 掃描已知漏洞，產生一份 SBOM（軟體物料清單），並對映像檔簽章，這些第 5.7 課會展開。至於 alpine：它很小，但它用的 C 函式庫是 musl，DNS 解析和部分原生套件的行為跟一般的 glibc 不同，偶爾會出現只在 alpine 上才有的怪問題。小不是目標，<b>少</b>才是：distroless 往往比 alpine 更少。</p>
<div class="note"><b>沒有 shell 要怎麼除錯？</b>不要為了除錯把 shell 裝回去。Docker 可以開一個工具容器，共用目標的 PID 和網路命名空間：<code>docker run --rm -it --pid=container:web --network=container:web nicolaka/netshoot</code>。Kubernetes 用 <code>kubectl debug -it POD --image=busybox --target=app</code> 掛一個臨時容器進去。</div>

<h3><span class="badge lv4">專家</span>七、容器怎麼逃出去，又為什麼會發生</h3>
<p>先講結論：容器的邊界不是一道牆，而是<b>好幾層核心功能加上一堆設定</b>疊出來的。任何一層被設定拿掉，或核心本身有一個漏洞，邊界就破了。而且大家共用同一顆核心，所以「攻進一個容器」可能就是「拿下整台機器和上面所有的容器」。</p>
<figure class="figure"><svg viewBox="0 0 680 396" class="fg" style="width:100%;max-width:680px" role="img" aria-label="容器的六層防線和最底下共用的核心；右邊列出每一層可以被哪個設定拆掉，--privileged 一次拆掉其中三層">
<text x="20" y="22" class="fg-t lg">防線</text>
<text x="400" y="22" class="fg-t lg warm">把它拆掉的設定</text>
<rect x="20" y="36" width="340" height="36" rx="6" class="fg-b alt dash"/><text x="34" y="59" class="fg-t">① user namespace</text><text x="346" y="59" text-anchor="end" class="fg-t sm">容器 root ≠ 主機 root</text>
<rect x="20" y="80" width="340" height="36" rx="6" class="fg-b alt"/><text x="34" y="103" class="fg-t">② capabilities</text><text x="346" y="103" text-anchor="end" class="fg-t sm">只留 14 個</text>
<rect x="20" y="124" width="340" height="36" rx="6" class="fg-b alt"/><text x="34" y="147" class="fg-t">③ seccomp</text><text x="346" y="147" text-anchor="end" class="fg-t sm">擋掉四十幾個系統呼叫</text>
<rect x="20" y="168" width="340" height="36" rx="6" class="fg-b alt"/><text x="34" y="191" class="fg-t">④ AppArmor／SELinux</text><text x="346" y="191" text-anchor="end" class="fg-t sm">限制能碰的檔案</text>
<rect x="20" y="212" width="340" height="36" rx="6" class="fg-b alt"/><text x="34" y="235" class="fg-t">⑤ 命名空間</text><text x="346" y="235" text-anchor="end" class="fg-t sm">看不到主機</text>
<rect x="20" y="256" width="340" height="36" rx="6" class="fg-b alt"/><text x="34" y="279" class="fg-t">⑥ 掛載範圍</text><text x="346" y="279" text-anchor="end" class="fg-t sm">只有映像檔和儲存卷</text>
<rect x="20" y="304" width="640" height="40" rx="8" class="fg-b warm"/><text x="340" y="329" text-anchor="middle" class="fg-t">共用的 Linux 核心：一個漏洞就穿過上面全部</text>
<text x="410" y="59" class="fg-t sm">一般 Docker 預設就沒開</text>
<text x="410" y="103" class="fg-t sm mono">--cap-add SYS_ADMIN</text>
<text x="410" y="147" class="fg-t sm mono">seccomp=unconfined</text>
<text x="410" y="191" class="fg-t sm mono">apparmor=unconfined</text>
<text x="410" y="235" class="fg-t sm mono">--pid=host、--net=host</text>
<text x="410" y="279" class="fg-t sm mono">-v /:/host、-v /etc:/etc</text>
<line x1="402" y1="99" x2="370" y2="99" class="fg-l warm"/><polygon points="362,99 370,94.5 370,103.5" class="fg-a warm"/>
<line x1="402" y1="143" x2="370" y2="143" class="fg-l warm"/><polygon points="362,143 370,138.5 370,147.5" class="fg-a warm"/>
<line x1="402" y1="187" x2="370" y2="187" class="fg-l warm"/><polygon points="362,187 370,182.5 370,191.5" class="fg-a warm"/>
<line x1="402" y1="231" x2="370" y2="231" class="fg-l warm"/><polygon points="362,231 370,226.5 370,235.5" class="fg-a warm"/>
<line x1="402" y1="275" x2="370" y2="275" class="fg-l warm"/><polygon points="362,275 370,270.5 370,279.5" class="fg-a warm"/>
<text x="340" y="366" text-anchor="middle" class="fg-t sm warm">--privileged：②③④ 一次全拆，再把主機的所有裝置交給它</text>
<text x="340" y="388" text-anchor="middle" class="fg-t sm warm">掛進 docker.sock：一層都不用拆，直接請 dockerd 開一個特權容器</text>
</svg><figcaption>每一層都只擋一部分。上課時說的「三個把鑰匙交出去的設定」，在這張圖上分別是拆掉 ②③④、拆掉 ⑥，以及繞過全部直接叫 dockerd。</figcaption></figure>
<h4>第一類：設定把門打開</h4>
<ul>
<li><b><code>--privileged</code></b>：給它全部的 capabilities、關掉 seccomp 和 AppArmor、把主機的 <code>/dev</code> 整個交出去。容器裡看得到 <code>/dev/sda1</code>，<code>mount</code> 起來就是主機的整顆硬碟，改 <code>/etc/shadow</code>、放一把 SSH 金鑰，就是主機 root 了。</li>
<li><b>掛進 <code>docker.sock</code></b>：容器拿到 dockerd 的遙控器。它不必拆任何一層，只要請 dockerd「幫我開一個 <code>--privileged</code>、把主機的 <code>/</code> 掛進來的新容器」。監控工具、CI 執行器最常要求掛它，給之前要想清楚。</li>
<li><b>掛主機目錄</b>：<code>-v /:/host</code> 不用說；就算只掛 <code>/etc</code> 或 <code>/var/run</code>，也常常足以改到主機的設定或碰到其他 socket。</li>
<li><b>共用主機的命名空間</b>：<code>--pid=host</code> 再加上 <code>CAP_SYS_PTRACE</code>，就能把程式碼注入主機上的行程；<code>--net=host</code> 讓容器碰得到主機上只聽 127.0.0.1 的管理介面。</li>
</ul>
<h4>第二類：危險的 capability</h4>
<p><code>CAP_SYS_ADMIN</code> 能掛載檔案系統；拿它搭配 cgroup v1 的 <code>release_agent</code> 機制，可以讓主機以 root 執行容器指定的程式，這是最經典的逃逸手法之一。2022 年的 CVE-2022-0492 則是核心少檢查了一步，讓某些設定下連這個能力都不需要。<code>CAP_SYS_MODULE</code> 能載入核心模組，等於直接在核心裡執行程式碼。<code>CAP_DAC_READ_SEARCH</code> 曾經讓早期的 Docker 容器讀到主機上的任意檔案。原則只有一條：<code>--cap-drop ALL</code>，再一個一個加回真的需要的。</p>
<h4>第三類：執行環境本身的漏洞</h4>
<p>runc 是用 root 執行、要跨過邊界做事的程式，所以它的漏洞特別致命。CVE-2019-5736 讓容器裡的程式透過 <code>/proc/self/exe</code> 改寫主機上的 runc 執行檔，下一次有人 <code>docker exec</code>，就以 root 跑了攻擊者的程式。2024 年的 CVE-2024-21626（Leaky Vessels）則是 runc 不小心把一個指向主機目錄的檔案描述符留給了容器，一個惡意映像檔把 <code>WORKDIR</code> 設成 <code>/proc/self/fd/</code> 底下的路徑，工作目錄就落在主機的檔案系統上；runc 1.1.12 修好了。教訓是：runc、containerd、Docker 也要跟作業系統一樣定期更新，而且<b>不要跑來路不明的映像檔</b>。</p>
<h4>第四類：核心漏洞</h4>
<p>2022 年的 Dirty Pipe（CVE-2022-0847）讓一般使用者能改寫唯讀檔案在記憶體裡的內容。在容器裡，這代表可以改寫映像檔底層那些「唯讀」又被很多容器共用的檔案。這種漏洞，前面六層防線一層都擋不住，因為它就發生在大家共用的那一層。這也是為什麼公有雲跑陌生人的程式時，很少只靠容器隔離，而是在外面再包 gVisor、Kata 或 Firecracker 這類虛擬機級的沙盒。</p>
<h4>第五類：不出主機，改出雲端</h4>
<p>雲端主機上，<code>169.254.169.254</code> 是中繼資料服務，可以拿到這台機器的臨時雲端憑證。一個被入侵的容器只要連得到它，就能拿著節點的權限去碰你的 S3 和資料庫，完全不用突破核心。AWS 的 IMDSv2 把回應的跳數上限（hop limit）設成 1 時，走橋接網路的容器多了一跳就拿不到；更根本的做法是讓每個工作負載有自己的身分（第 5.5 課的 IAM）。</p>
<div class="warn"><b>最便宜的一層：不要用 root。</b>沒開 user 命名空間時，容器裡的 uid 0 就是主機的 uid 0，只是少了一些 capabilities。上面每一種逃逸，結果都是「拿到容器裡那個使用者在主機上的身分」。這個身分是 root 還是 65532，差別就是「整台機器」和「幾乎什麼都做不了」。</div>

<h3>八、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>容器是輕量的虛擬機</td><td>它是主機上的一個普通行程，被命名空間和 cgroup 包起來，跟所有容器共用同一顆核心。</td></tr>
<tr><td>容器裡的 root 被隔離了，所以沒關係</td><td>一般 Docker 沒開 user 命名空間，容器的 uid 0 就是主機的 uid 0，只是少了一些能力。一旦逃出去就是主機 root。</td></tr>
<tr><td>在 Dockerfile 最後 <code>RUN rm</code> 就能變小、就能刪掉機密</td><td>下面那一層還在，只是被刪除標記遮住。要在同一個 RUN 裡刪，機密改用 secret 掛載。</td></tr>
<tr><td>記憶體用量碰到上限就會被殺</td><td>用量包含頁快取。能回收就不會死，回收不了才 OOM kill。要看 <code>memory.stat</code> 的 anon。</td></tr>
<tr><td>alpine 最小，所以最好、最安全</td><td>它有 musl 的相容性差異。重點是「東西少、常更新、非 root」，distroless 常常更好。</td></tr>
<tr><td>ufw 擋了那個連接埠就安全了</td><td>Docker 發布的連接埠會繞過 ufw。只給本機用的就綁 <code>127.0.0.1</code>。</td></tr>
<tr><td>Kubernetes 不能跑 Docker 建的映像檔了</td><td>只是拿掉了 dockerd 這個中間人。映像檔是 OCI 標準格式，照樣能跑。</td></tr>
</table>

<h3>九、跟你的工作連起來</h3>
<ul>
<li><b>Node.js／TypeScript</b>：多階段建置、<code>npm ci --omit=dev</code>、<code>USER</code> 寫數字、<code>CMD ["node", "dist/server.js"]</code> 用陣列格式；程式聽 <code>0.0.0.0</code>，處理 SIGTERM。</li>
<li><b>Go</b>：<code>CGO_ENABLED=0</code> 加上 distroless static，映像檔只有十幾 MB；Go 1.25 起 <code>GOMAXPROCS</code> 會自己讀 cgroup 的 CPU 上限。</li>
<li><b>前端與遊戲的網頁版</b>：Vue、Cocos、Unity 網頁版的建置在 node 階段完成，最後一階段只放靜態檔加上一個非 root 的網頁伺服器（例如 <code>nginxinc/nginx-unprivileged</code>，聽 8080）。</li>
<li><b>在 Mac 上開發</b>：容器其實跑在一台 Linux 虛擬機裡（colima、Docker Desktop 都是）。推上 amd64 的雲端主機前，用 buildx 建多架構映像檔，免得遇到 exec format error。</li>
<li><b>雲端主機上的 Docker</b>：資料庫不要 <code>-p</code> 到公開介面；不要把 docker.sock 掛給不需要的容器；記得第 1.9 課的日誌上限。</li>
</ul>

<h3>十、面試會怎麼問</h3>
<p>下面是 DevOps、平台工程、資安面試裡真的會出現的題目。先自己出聲講一遍，再打開參考答案。</p>
<ol>
<li>「容器和虛擬機差在哪裡？容器在 Linux 核心裡是用什麼做出來的？」</li>
<li>「容器的記憶體用到上限會發生什麼事？CPU 用到上限呢？」</li>
<li>「映像檔的層是什麼？為什麼在 Dockerfile 最後一行刪掉檔案，映像檔不會變小？」</li>
<li>「從 docker run 到程式開始跑，中間經過哪些元件？『Kubernetes 不再支援 Docker』是什麼意思？」</li>
<li>「你會怎麼讓一個映像檔更小、更安全？」</li>
<li>「舉出三種容器逃逸的方式，以及各自怎麼防。」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>虛擬機有自己的核心，由 hypervisor 隔離，邊界小而強，但啟動慢、資源多；容器是主機上的普通行程，共用主機核心，用命名空間隔開它看到的東西（PID、網路、掛載、主機名稱、IPC、使用者、cgroup），用 cgroups 限制資源，再加上 capabilities、seccomp、AppArmor／SELinux 縮小權限，根目錄由 OverlayFS 疊出來。共用核心讓它輕快，也讓隔離比較薄。</li>
<li>記憶體：超過 memory.high 會被節流、被迫回收；碰到 memory.max 時核心先在這個 cgroup 裡回收頁快取、寫回髒頁，回收不了才在 cgroup 裡 OOM kill，容器結束代碼 137，Kubernetes 顯示 OOMKilled。注意用量包含快取，要看 anon 或工作集。CPU：cpu.max 以每 100 毫秒為一期給配額，用完就整個暫停到下一期，不會被殺，但延遲出現尖刺，cpu.stat 的 nr_throttled 會上升。</li>
<li>層是一個 tar 檔，記錄某個建置步驟新增、修改、刪除的檔案，以內容雜湊命名，可以被多個映像檔共用。執行時 OverlayFS 把唯讀的層疊在下面，上面加一層可寫層。刪除只是在上層放一個刪除標記，原本的檔案仍在下層，所以映像檔不會變小，機密也還拿得到。要在同一個 RUN 裡產生並刪除，或用多階段建置只複製需要的結果。</li>
<li>docker CLI 透過 docker.sock 呼叫 dockerd；dockerd 準備網路，並透過 gRPC 請 containerd 拉映像檔、解成快照；containerd 為容器開一個 shim，shim 呼叫 runc 依 OCI 的 config.json 建立命名空間、cgroup、掛載、權限，最後 exec 程式後 runc 退出，shim 留著當父行程。Kubernetes 1.24 移除了 dockershim，kubelet 改用 CRI 直接跟 containerd 或 CRI-O 溝通；映像檔是 OCI 格式，Docker 建的照樣能跑，被拿掉的只是 dockerd。</li>
<li>多階段建置，執行階段用 slim、distroless 或 static；只裝正式相依套件；用數字 UID 以非 root 執行；用摘要鎖定基底並自動化更新；.dockerignore 排除 .git 和 .env；建置機密用 BuildKit secret 掛載；根目錄唯讀；在管線裡掃描漏洞、產生 SBOM、簽章；執行時 drop 所有 capabilities 只加回需要的、保留預設 seccomp、設 no-new-privileges。</li>
<li>一，--privileged：所有 capabilities 和裝置都給了，可以直接掛載主機硬碟，防法是禁止它，Kubernetes 用 Pod Security 的 restricted 等級擋。二，掛載 docker.sock：可以叫 dockerd 開特權容器，防法是不掛，真的需要時改用權限受限的代理。三，執行環境或核心漏洞，例如 runc 的 CVE-2019-5736、CVE-2024-21626 或 Dirty Pipe：防法是定期更新、不跑不信任的映像檔、對不信任的工作負載用 gVisor 或 Kata 這類沙盒。共通的防線是非 root 執行、開 user 命名空間或 rootless，讓逃出去也只是無權限的使用者。</li>
</ol>
</details>

<h3>十一、練功題（做得出來才算真的懂）</h3>
<ol>
<li>在 Linux 主機上執行 <code>docker run -d --name a nginx</code> 和 <code>docker run -d --name b --network container:a busybox sleep 1d</code>。比較兩個容器 <code>/proc/PID/ns/</code> 底下的編號，哪幾個一樣、哪幾個不一樣？在 b 裡面 <code>wget -qO- 127.0.0.1</code> 會拿到什麼？</li>
<li><code>docker run -m 512m --cpus 1.5 --pids-limit 200</code>，cgroup 裡的 <code>memory.max</code>、<code>cpu.max</code>、<code>pids.max</code> 各會是什麼值？</li>
<li>一個 Dockerfile 先 <code>COPY id_rsa /root/.ssh/</code>，再 <code>RUN git clone</code> 私有專案，最後 <code>RUN rm /root/.ssh/id_rsa</code>。金鑰還在映像檔裡嗎？別人怎麼拿到？應該怎麼改？</li>
<li>容器裡的程式聽 <code>127.0.0.1:3000</code>，你用 <code>-p 3000:3000</code> 啟動，主機上 <code>curl localhost:3000</code> 失敗。說明封包走到哪裡被擋下，以及怎麼修。</li>
<li>把這四行排成快取效果最好的順序，並說明原因：<code>COPY . .</code>、<code>RUN npm ci</code>、<code>COPY package.json package-lock.json ./</code>、<code>RUN npm run build</code>。</li>
<li>一個容器的記憶體上限 512 MB，監控顯示 <code>memory.current</code> 長期在 495 MB，卻從沒被 OOM kill。<code>memory.stat</code> 裡 file 是 380 MB。發生了什麼？需要調高上限嗎？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>net 的編號一樣（b 加入了 a 的網路命名空間），pid、mnt、uts、ipc 不一樣。在 b 裡面連 127.0.0.1 拿到的是 nginx 的歡迎頁，因為兩個容器共用同一個 lo。Kubernetes 的 Pod 就是用這種方式讓多個容器共用網路，下一章會看到。</li>
<li>memory.max 是 536870912（512 × 1024 × 1024）；cpu.max 是「150000 100000」，每 100 毫秒最多用 150 毫秒的 CPU 時間；pids.max 是 200。</li>
<li>還在。它存在 COPY 那一層裡，後面的 rm 只是加了一個刪除標記。任何拿得到映像檔的人用 <code>docker save</code> 匯出、解開那一層的 tar 就看得到。改法：用 BuildKit 的 <code>RUN --mount=type=ssh</code> 或 secret 掛載，讓金鑰只在那一步存在；或在建置階段 clone、執行階段只複製需要的檔案。而且那把金鑰已經外洩，要立刻作廢換新。</li>
<li><code>-p</code> 讓主機把 3000 的封包 NAT 到容器的 172.17.0.x:3000，封包從容器的 eth0 進來；可是程式只聽容器自己 lo 上的 127.0.0.1，eth0 上的 3000 沒有人聽，核心就回 RST。修法：程式改聽 0.0.0.0（或環境變數設 HOST=0.0.0.0）。</li>
<li>COPY package.json package-lock.json ./ → RUN npm ci → COPY . . → RUN npm run build。套件清單很少變，放前面讓 npm ci 那一層能一直重用；原始碼常變，放後面，改一行程式只重跑最後兩層。</li>
<li>大部分是頁快取（file 380 MB），程式自己的記憶體（anon）大約一百多 MB。碰到上限時核心會先丟掉快取，所以不會被殺，這是正常的。不需要調高上限；要監控的是 anon 或工作集，以及 memory.events 裡 oom_kill 有沒有增加。</li>
</ol>
</details>

<h3>十二、想再挖深</h3>
<ul>
<li><b>Liz Rice《Container Security》</b>（O'Reilly）：從命名空間、cgroup 一路講到映像檔安全與逃逸，是這一章最直接的延伸。她的演講〈Containers From Scratch〉（YouTube）用幾十行 Go 當場寫出一個容器，強烈推薦。</li>
<li><b>Linux man pages</b>（<a href="https://man7.org/linux/man-pages/">man7.org</a>）：<code>namespaces(7)</code>、<code>user_namespaces(7)</code>、<code>cgroups(7)</code>；核心文件的〈Control Group v2〉（<a href="https://docs.kernel.org/admin-guide/cgroup-v2.html">docs.kernel.org/admin-guide/cgroup-v2.html</a>）把每個檔案的意思都寫清楚了。</li>
<li><b>Open Container Initiative 規格</b>（<a href="https://opencontainers.org/">opencontainers.org</a>）：映像檔、執行環境、發佈三份規格。讀一次 runtime spec 的 config.json，就知道 runc 到底收到了什麼。</li>
<li><b>Docker 官方文件</b>（<a href="https://docs.docker.com/">docs.docker.com</a>）：Multi-stage builds、Build secrets、Rootless mode 三頁，都附了可以直接用的範例。</li>
<li><b>GoogleContainerTools/distroless</b>（GitHub）：distroless 映像檔的說明、各語言的範例和除錯方式。</li>
</ul>
` });
