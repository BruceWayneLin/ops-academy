DEEP({ 'lin-ops': `
<p>上一課給了你一張「伺服器出事時要打什麼」的清單。清單很好用，可是它只告訴你「有哪些指令」，沒告訴你「先打哪一個、看到什麼數字代表什麼」。這一章把清單背後的東西拆開來：一套不靠運氣的檢查順序（USE 方法）、指令其實都在讀的 <code>/proc</code>、systemd 和 journald 再深一層、用訊號不停機地重新載入、權限位元和 capabilities、三種「磁碟滿了」、OOM killer 怎麼挑人、日誌輪替和 SSH 加固。最後用一場完整的事故，從半夜的警報走到事後檢討，把這些串起來。第 0.9 課講過的行程、檔案描述符和訊號基本款，這裡直接拿來用，不再重講。</p>

<h3><span class="badge lv1">基礎</span>一、先有方法，再打指令：USE 檢傷分類</h3>
<p>急診室的護理師看到病人，不會先問他昨天吃了什麼。她先量幾個固定的生命徵象：體溫、血壓、脈搏、血氧，一兩分鐘內就知道輕重緩急。這叫<b>檢傷分類</b>（triage）。伺服器出事時，新手的做法是「想到什麼就打什麼」，打了半小時還在猜；老手也有一組固定的生命徵象，照順序量完，問題通常自己就浮出來了。</p>
<p>最好用的一組叫 <b>USE 方法</b>，由效能專家 Brendan Gregg 提出。對每一種資源，只問三個問題：</p>
<ul>
<li><b>使用率</b>（utilization）：它有多忙？CPU 忙碌的時間比例、磁碟用掉的容量。</li>
<li><b>飽和</b>（saturation）：有沒有工作在<b>排隊</b>等它？</li>
<li><b>錯誤</b>（errors）：它有沒有回報錯誤？</li>
</ul>
<figure class="figure"><svg viewBox="0 0 680 366" class="fg" style="width:100%;max-width:680px" role="img" aria-label="USE 檢查表：六種資源各自的使用率、飽和、錯誤要看哪個指令或檔案">
<rect x="10" y="10" width="110" height="44" rx="6" class="fg-b"/><text x="65" y="37" text-anchor="middle" class="fg-t lg">資源</text>
<rect x="126" y="10" width="176" height="44" rx="6" class="fg-b alt"/><text x="214" y="30" text-anchor="middle" class="fg-t alt">使用率 U</text><text x="214" y="46" text-anchor="middle" class="fg-t sm">忙了多少</text>
<rect x="308" y="10" width="176" height="44" rx="6" class="fg-b hot"/><text x="396" y="30" text-anchor="middle" class="fg-t acc">飽和 S</text><text x="396" y="46" text-anchor="middle" class="fg-t sm">有沒有人在排隊</text>
<rect x="490" y="10" width="176" height="44" rx="6" class="fg-b warm"/><text x="578" y="30" text-anchor="middle" class="fg-t warm">錯誤 E</text><text x="578" y="46" text-anchor="middle" class="fg-t sm">有沒有在報錯</text>
<rect x="10" y="62" width="110" height="40" rx="6" class="fg-b"/><text x="65" y="87" text-anchor="middle" class="fg-t">CPU</text>
<rect x="126" y="62" width="176" height="40" rx="6" class="fg-b"/><text x="136" y="87" class="fg-t sm mono">mpstat -P ALL 1</text>
<rect x="308" y="62" width="176" height="40" rx="6" class="fg-b"/><text x="318" y="87" class="fg-t sm">vmstat 的 r、PSI cpu</text>
<rect x="490" y="62" width="176" height="40" rx="6" class="fg-b"/><text x="500" y="87" class="fg-t sm">很少見（硬體錯誤）</text>
<rect x="10" y="108" width="110" height="40" rx="6" class="fg-b"/><text x="65" y="133" text-anchor="middle" class="fg-t">記憶體</text>
<rect x="126" y="108" width="176" height="40" rx="6" class="fg-b"/><text x="136" y="133" class="fg-t sm">free -m 的 available</text>
<rect x="308" y="108" width="176" height="40" rx="6" class="fg-b"/><text x="318" y="133" class="fg-t sm">si／so、PSI memory</text>
<rect x="490" y="108" width="176" height="40" rx="6" class="fg-b"/><text x="500" y="133" class="fg-t sm">dmesg 裡的 OOM 紀錄</text>
<rect x="10" y="154" width="110" height="40" rx="6" class="fg-b"/><text x="65" y="179" text-anchor="middle" class="fg-t">磁碟空間</text>
<rect x="126" y="154" width="176" height="40" rx="6" class="fg-b"/><text x="136" y="179" class="fg-t sm mono">df -h、df -i</text>
<rect x="308" y="154" width="176" height="40" rx="6" class="fg-b"/><text x="318" y="179" class="fg-t sm">（容量不會排隊）</text>
<rect x="490" y="154" width="176" height="40" rx="6" class="fg-b"/><text x="500" y="179" class="fg-t sm">日誌裡的 ENOSPC</text>
<rect x="10" y="200" width="110" height="40" rx="6" class="fg-b"/><text x="65" y="225" text-anchor="middle" class="fg-t">磁碟 I/O</text>
<rect x="126" y="200" width="176" height="40" rx="6" class="fg-b"/><text x="136" y="225" class="fg-t sm">iostat -x 的 %util</text>
<rect x="308" y="200" width="176" height="40" rx="6" class="fg-b"/><text x="318" y="225" class="fg-t sm">await、PSI io</text>
<rect x="490" y="200" width="176" height="40" rx="6" class="fg-b"/><text x="500" y="225" class="fg-t sm">dmesg 的 I/O error</text>
<rect x="10" y="246" width="110" height="40" rx="6" class="fg-b"/><text x="65" y="271" text-anchor="middle" class="fg-t">網路</text>
<rect x="126" y="246" width="176" height="40" rx="6" class="fg-b"/><text x="136" y="271" class="fg-t sm mono">sar -n DEV 1</text>
<rect x="308" y="246" width="176" height="40" rx="6" class="fg-b"/><text x="318" y="271" class="fg-t sm">重傳與丟包：nstat</text>
<rect x="490" y="246" width="176" height="40" rx="6" class="fg-b"/><text x="500" y="271" class="fg-t sm">ip -s link 的 errors</text>
<rect x="10" y="292" width="110" height="40" rx="6" class="fg-b"/><text x="65" y="317" text-anchor="middle" class="fg-t">號碼牌 fd</text>
<rect x="126" y="292" width="176" height="40" rx="6" class="fg-b"/><text x="136" y="317" class="fg-t sm mono">/proc/sys/fs/file-nr</text>
<rect x="308" y="292" width="176" height="40" rx="6" class="fg-b"/><text x="318" y="317" class="fg-t sm">ss -lnt 的 Recv-Q</text>
<rect x="490" y="292" width="176" height="40" rx="6" class="fg-b"/><text x="500" y="317" class="fg-t sm">EMFILE 錯誤</text>
<text x="396" y="356" text-anchor="middle" class="fg-t sm acc">中間這一欄最常被忘記，也最常是答案</text>
</svg><figcaption>每種資源問同樣三個問題，一格一格填。填完 18 格，大部分的問題已經被你圈出來了。</figcaption></figure>
<p>三欄裡最重要、也最常被忘記的是<b>飽和</b>。一顆 CPU 跑到 100%、後面沒人排隊，它只是很認真地在工作；CPU 只有 70%，可是 run queue 裡有 12 條執行緒在等，使用者已經在痛了。使用率告訴你「有多忙」，飽和才告訴你「有沒有人在等」，而等待正是延遲的來源。</p>
<h4>USE 之前，先問兩個問題</h4>
<ol>
<li><b>什麼東西改變了？</b>剛部署、改了設定、流量突然變大、憑證到期、雲端業者在維修。九成的事故都有一個「剛剛發生的變化」，先找它，常常一分鐘就收工。</li>
<li><b>範圍多大？</b>只有一台壞，就看那一台；全部一起壞，就看大家共用的東西：資料庫、DNS、網路、憑證、上游的 API。範圍一判斷錯，你會在一台好好的機器上找一整晚。</li>
</ol>
<p>接著用最便宜的檢查開場：<code>dmesg -T | tail -30</code> 和 <code>journalctl -p err -b --since "-30min"</code>。錯誤欄有東西，往往直接就是答案；沒有，再一格一格量。第 4.6 課會把 USE 用在「為什麼慢」的效能分析，這一章用在「為什麼壞」的值班現場。</p>

<h3><span class="badge lv1">基礎</span>二、一切都是檔案：那些指令其實在讀 /proc</h3>
<p>上一課說 Linux 把自己的狀態用檔案攤開。更具體地說：<code>free</code>、<code>uptime</code>、<code>ps</code> 本身幾乎不懂作業系統，只是去讀幾個檔案，再排版給你看。</p>
<figure class="figure"><svg viewBox="0 0 660 296" class="fg" style="width:100%;max-width:660px" role="img" aria-label="常用工具各自讀取 /proc 底下的哪個檔案，而這些檔案的內容是作業系統核心在被讀取的那一刻才產生的">
<text x="85" y="34" text-anchor="middle" class="fg-t lg">工具</text>
<text x="330" y="34" text-anchor="middle" class="fg-t lg">其實在讀的檔案</text>
<rect x="470" y="10" width="180" height="276" rx="10" class="fg-b warm"/>
<text x="560" y="34" text-anchor="middle" class="fg-t lg">作業系統核心</text>
<rect x="20" y="50" width="130" height="34" rx="6" class="fg-b"/><text x="85" y="72" text-anchor="middle" class="fg-t mono">free</text>
<rect x="20" y="96" width="130" height="34" rx="6" class="fg-b"/><text x="85" y="118" text-anchor="middle" class="fg-t mono">uptime</text>
<rect x="20" y="142" width="130" height="34" rx="6" class="fg-b"/><text x="85" y="164" text-anchor="middle" class="fg-t mono">ps、top</text>
<rect x="20" y="188" width="130" height="34" rx="6" class="fg-b"/><text x="85" y="210" text-anchor="middle" class="fg-t mono">lsof</text>
<rect x="20" y="234" width="130" height="34" rx="6" class="fg-b"/><text x="85" y="256" text-anchor="middle" class="fg-t mono">sysctl</text>
<rect x="230" y="50" width="200" height="34" rx="6" class="fg-b alt"/><text x="330" y="72" text-anchor="middle" class="fg-t mono">/proc/meminfo</text>
<rect x="230" y="96" width="200" height="34" rx="6" class="fg-b alt"/><text x="330" y="118" text-anchor="middle" class="fg-t mono">/proc/loadavg</text>
<rect x="230" y="142" width="200" height="34" rx="6" class="fg-b alt"/><text x="330" y="164" text-anchor="middle" class="fg-t mono">/proc/PID/stat</text>
<rect x="230" y="188" width="200" height="34" rx="6" class="fg-b alt"/><text x="330" y="210" text-anchor="middle" class="fg-t mono">/proc/PID/fd/</text>
<rect x="230" y="234" width="200" height="34" rx="6" class="fg-b alt"/><text x="330" y="256" text-anchor="middle" class="fg-t mono">/proc/sys/…</text>
<rect x="486" y="50" width="148" height="34" rx="6" class="fg-b"/><text x="560" y="72" text-anchor="middle" class="fg-t sm">記憶體統計</text>
<rect x="486" y="96" width="148" height="34" rx="6" class="fg-b"/><text x="560" y="118" text-anchor="middle" class="fg-t sm">排程器的佇列</text>
<rect x="486" y="142" width="148" height="34" rx="6" class="fg-b"/><text x="560" y="164" text-anchor="middle" class="fg-t sm">每個 task 的結構</text>
<rect x="486" y="188" width="148" height="34" rx="6" class="fg-b"/><text x="560" y="210" text-anchor="middle" class="fg-t sm">行程的號碼表</text>
<rect x="486" y="234" width="148" height="34" rx="6" class="fg-b"/><text x="560" y="256" text-anchor="middle" class="fg-t sm">可調整的參數</text>
<line x1="150" y1="67" x2="222" y2="67" class="fg-l"/><polygon points="230,67 222,62.5 222,71.5" class="fg-a"/>
<line x1="150" y1="113" x2="222" y2="113" class="fg-l"/><polygon points="230,113 222,108.5 222,117.5" class="fg-a"/>
<line x1="150" y1="159" x2="222" y2="159" class="fg-l"/><polygon points="230,159 222,154.5 222,163.5" class="fg-a"/>
<line x1="150" y1="205" x2="222" y2="205" class="fg-l"/><polygon points="230,205 222,200.5 222,209.5" class="fg-a"/>
<line x1="150" y1="251" x2="222" y2="251" class="fg-l"/><polygon points="230,251 222,246.5 222,255.5" class="fg-a"/>
<line x1="430" y1="67" x2="486" y2="67" class="fg-l alt dash"/>
<line x1="430" y1="113" x2="486" y2="113" class="fg-l alt dash"/>
<line x1="430" y1="159" x2="486" y2="159" class="fg-l alt dash"/>
<line x1="430" y1="205" x2="486" y2="205" class="fg-l alt dash"/>
<line x1="430" y1="251" x2="486" y2="251" class="fg-l alt dash"/>
<text x="186" y="282" text-anchor="middle" class="fg-t sm">普通的 read()</text>
<text x="330" y="282" text-anchor="middle" class="fg-t sm">讀的那一刻才產生內容</text>
</svg><figcaption>/proc 不是磁碟上的檔案。你每讀一次，作業系統核心就把當下的資料結構翻成文字交給你，所以 <code>ls -l</code> 看到的大小都是 0。</figcaption></figure>
<p>知道這件事有兩個好處。第一，最精簡的容器映像檔裡常常沒有 <code>ps</code>、<code>free</code>，但只要有 <code>cat</code>，你就能看到一樣的資料。第二，工具的數字看不懂時，回到原始檔案，欄位定義都寫在 <code>man 5 proc</code> 裡。</p>
<h4>五個值班時最常讀的檔案</h4>
<pre><code>$ cat /proc/loadavg
3.92 2.81 1.40 5/731 48211
$ head -3 /proc/meminfo
MemTotal:        8008124 kB
MemFree:          213340 kB
MemAvailable:    2914480 kB
$ cat /proc/pressure/memory
some avg10=0.00 avg60=0.12 avg300=0.05 total=1834121
full avg10=0.00 avg60=0.03 avg300=0.01 total=512033</code></pre>
<ul>
<li><b>/proc/loadavg</b>：前三個是 1、5、15 分鐘的平均負載；<code>5/731</code> 是「此刻可執行的有 5 個、總共有 731 個 task」；最後一個是最近建立的 PID。PID 一直快速往上跳，代表有東西在瘋狂開子行程。</li>
<li><b>/proc/meminfo</b>：MemFree 只剩 200 MB 不用慌，MemAvailable 還有 2.8 GB。後者是核心自己估算的「不必動用 swap 就能拿到的記憶體」，<code>free</code> 的 available 欄就是讀這一行。</li>
<li><b>/proc/pressure/</b>：這是 <b>PSI</b>（pressure stall information，Linux 4.20 起），USE 裡「飽和」最好的單一指標。<code>some avg10=41.2</code> 的意思是：過去 10 秒裡，有 41.2% 的時間至少有一個 task 因為等記憶體而卡住；<code>full</code> 是所有 task 同時卡住的比例。<code>cpu</code>、<code>memory</code>、<code>io</code> 各一個檔案，大多數新發行版預設開著。</li>
<li><b>/proc/PID/</b> 底下：<code>cmdline</code>（用 NUL 字元分隔，要 <code>tr '\\0' ' '</code> 才好讀）、<code>cwd</code>、<code>exe</code>、<code>fd/</code>、<code>limits</code>、<code>io</code>（累計讀寫了多少位元組）、<code>oom_score</code>、<code>cgroup</code>。還有 <code>environ</code>：這個行程的環境變數，同一個使用者和 root 都讀得到，所以放在環境變數裡的密碼並沒有你想的那麼隱密。</li>
<li><b>/proc/sys/</b>：核心的可調參數。<code>sysctl net.core.somaxconn</code> 和 <code>cat /proc/sys/net/core/somaxconn</code> 是同一件事。要開機後還生效，寫進 <code>/etc/sysctl.d/</code> 底下的檔案。</li>
</ul>
<div class="note"><b>一個很實用的小招。</b>修補了 OpenSSL 這類函式庫之後，已經在跑的服務手上拿的還是<b>舊的</b>那一份，直到它重啟為止。<code>ls -l /proc/*/exe 2&gt;/dev/null | grep deleted</code> 找出還在跑舊執行檔的行程；Debian／Ubuntu 上的 <code>needrestart</code> 工具會把「用到舊函式庫、該重啟」的服務列給你。「補丁打了」和「補丁生效了」是兩件事。</div>

<h3><span class="badge lv2">進階</span>三、systemd 深一層：依賴、覆寫、計時器與 journald</h3>
<p>第 0.13 課的深入圖解寫過最基本的 <code>hilo.service</code>。正式環境裡還會一直碰到下面這幾件事。</p>
<h4>「要不要一起拉起來」和「誰先誰後」是兩回事</h4>
<p><code>Wants=</code> 和 <code>Requires=</code> 決定「啟動我的時候，也要把誰拉起來」；<code>After=</code> 和 <code>Before=</code> 只決定順序。兩者完全獨立。只寫 <code>Requires=postgresql.service</code> 卻沒寫 <code>After=</code>，systemd 會把兩個<b>同時</b>啟動，你的服務照樣在資料庫還沒好的時候去連它。<code>Requires=</code> 還多一層意思：對方被停掉，你也會跟著被停掉；<code>Wants=</code> 則是軟性的，對方起不來你照樣跑。大多數時候你要的是 <code>Wants=</code> 加上 <code>After=</code>。</p>
<p><code>Type=</code> 決定 systemd 什麼時候認定你「已經啟動了」。預設的 <code>simple</code> 是 fork 出來就算數；<code>exec</code> 是執行檔成功載入才算；<code>notify</code> 則要程式自己透過 <code>sd_notify</code> 送一句 <code>READY=1</code> 才算。如果你的服務啟動要先載入十秒的資料，用 <code>notify</code> 才能讓排在 <code>After=</code> 後面的東西真的等到它準備好。</p>
<h4>不要改套件的檔案，用覆寫</h4>
<p>套件裝的 unit 在 <code>/usr/lib/systemd/system/</code>（有些發行版是 <code>/lib/systemd/system/</code>），下一次套件更新就會被蓋掉。正確的做法是寫一個<b>覆寫檔</b>（drop-in）：</p>
<pre><code>$ sudo systemctl edit nginx
# 打開的是 /etc/systemd/system/nginx.service.d/override.conf
[Service]
LimitNOFILE=65536
MemoryMax=1G
# 像 ExecStart 這種可以有好幾行的設定，要先寫一行空的把舊值清掉
ExecStart=
ExecStart=/usr/sbin/nginx -g 'daemon off;'
$ systemctl cat nginx      # 看合併之後真正生效的樣子</code></pre>
<p>那一行空的 <code>ExecStart=</code> 是最常見的坑：少了它，systemd 會抱怨服務有兩個 ExecStart 而拒絕啟動。</p>
<h4>每個服務都住在自己的 cgroup 裡</h4>
<p>systemd 替每個服務開一個 cgroup，<code>systemd-cgls</code> 可以看到整棵樹，<code>systemd-cgtop</code> 像 top 一樣列出每個服務吃多少。所以 <code>MemoryMax=</code>、<code>CPUQuota=</code>、<code>TasksMax=</code> 其實就是在寫 cgroup 的檔案，跟下一個模組的容器是同一套機制。這也解釋了一個常見的疑惑：服務裡用 <code>nohup</code> 偷開的背景程式，<code>systemctl stop</code> 時也會一起被殺掉。預設的 <code>KillMode=control-group</code> 會把整個 cgroup 裡的行程全部送訊號，一個都跑不掉。</p>
<h4>計時器：比 cron 好用的排程</h4>
<pre><code># /etc/systemd/system/hilo-backup.timer（另外配一個同名的 .service，Type=oneshot）
[Timer]
OnCalendar=*-*-* 03:30:00
RandomizedDelaySec=10min
Persistent=true

[Install]
WantedBy=timers.target</code></pre>
<p>比起 crontab，它有三個好處：輸出自動進 journald，出錯查得到；<code>Persistent=true</code> 讓機器在 03:30 剛好關機時，開機後補跑一次；<code>systemctl list-timers</code> 一眼看到每個排程上次和下次什麼時候跑。<code>RandomizedDelaySec</code> 讓一百台機器不會在同一秒一起去打備份伺服器。</p>
<h4>journald：日誌去了哪裡、會留多久</h4>
<p>服務的標準輸出和標準錯誤、程式呼叫 syslog 寫的東西、核心訊息，全部由 <code>systemd-journald</code> 收集，存成帶有欄位的二進位檔。每一筆都有 <code>_PID</code>、<code>_SYSTEMD_UNIT</code>、<code>PRIORITY</code>、<code>_BOOT_ID</code> 這些欄位，所以才能那麼快地依服務、等級、開機次數篩選。</p>
<pre><code>journalctl -u hilo -b -p warning       # 這次開機以來 hilo 的警告和錯誤
journalctl -b -1 -e                    # 上一次開機的最後幾頁：當機重開後最重要的一行
journalctl -k -o short-iso --since "30 min ago"   # 只看核心訊息
journalctl --disk-usage                # 日誌佔了多少
sudo journalctl --vacuum-size=1G       # 砍到剩 1 GB</code></pre>
<ul>
<li><b>會不會留到下次開機？</b>日誌存在 <code>/var/log/journal/</code> 才會保留；只存在 <code>/run/log/journal/</code> 的話，那是記憶體，重開機就沒了。有些發行版預設不建立前者。<code>journalctl --list-boots</code> 只列出一次開機，就代表你看不到上一次當機前發生了什麼。在 <code>journald.conf</code> 設 <code>Storage=persistent</code>，最好今天就檢查。</li>
<li><b>會佔多少？</b><code>SystemMaxUse=</code> 預設是檔案系統的 10%，最多 4 GB。小磁碟的機器可以調小。</li>
<li><b>會不會被丟掉？</b>journald 對每個服務有速率限制，預設大約 30 秒內 1 萬則，超過的直接丟，只留一行「Suppressed N messages from hilo.service」。一個服務瘋狂刷錯誤時，最關鍵的那幾行可能正好被丟掉。</li>
</ul>

<h3><span class="badge lv2">進階</span>四、訊號進階：重新載入、優雅關機，和 systemd 怎麼送</h3>
<p>SIGTERM 是請你收工、SIGKILL 是直接拔插頭，這你已經知道了。值班時另外幾個訊號也一樣常見，而且同一個訊號，不同程式的反應差很多：</p>
<table>
<tr><th>訊號</th><th>慣例意思</th><th>要小心的地方</th></tr>
<tr><td>SIGHUP（1）</td><td>重新讀設定、重新打開日誌檔。名字來自「終端機掛斷」</td><td>對沒處理它的程式，預設動作是結束</td></tr>
<tr><td>SIGUSR1／SIGUSR2</td><td>由程式自己定義。nginx 用 USR1 重新打開日誌</td><td>對 Node.js 送 SIGUSR1 會打開除錯器，不是重新載入</td></tr>
<tr><td>SIGQUIT（3）</td><td>nginx：優雅結束。Java：印出所有執行緒的堆疊，繼續跑</td><td>Go 程式收到會印出所有 goroutine 的堆疊<b>然後結束</b></td></tr>
</table>
<p>SIGHUP 最大的用處是<b>不停機換設定</b>。nginx 是教科書級的例子：</p>
<figure class="figure"><svg viewBox="0 0 660 250" class="fg" style="width:100%;max-width:660px" role="img" aria-label="nginx 收到 SIGHUP 後的時間軸：master 一直握著監聽 socket，先開新設定的 worker，再請舊 worker 做完手上的連線後結束">
<text x="200" y="24" text-anchor="middle" class="fg-t acc">①</text>
<text x="260" y="24" text-anchor="middle" class="fg-t acc">②</text>
<text x="300" y="24" text-anchor="middle" class="fg-t acc">③</text>
<text x="470" y="24" text-anchor="middle" class="fg-t acc">④</text>
<line x1="200" y1="32" x2="200" y2="47" class="fg-l warm"/><polygon points="200,55 195.5,47 204.5,47" class="fg-a warm"/>
<line x1="200" y1="85" x2="200" y2="205" class="fg-l dim dash"/>
<line x1="260" y1="32" x2="260" y2="205" class="fg-l dim dash"/>
<line x1="300" y1="32" x2="300" y2="205" class="fg-l dim dash"/>
<line x1="470" y1="32" x2="470" y2="205" class="fg-l dim dash"/>
<text x="14" y="75" class="fg-t">master</text>
<text x="14" y="130" class="fg-t">舊 worker</text>
<text x="14" y="185" class="fg-t">新 worker</text>
<rect x="110" y="55" width="530" height="30" rx="5" class="fg-b"/><text x="420" y="75" text-anchor="middle" class="fg-t sm">一直握著 :80、:443 的監聽 socket，從頭到尾沒關</text>
<rect x="110" y="110" width="190" height="30" rx="5" class="fg-b alt"/><text x="150" y="130" text-anchor="middle" class="fg-t sm">舊設定</text>
<rect x="300" y="110" width="170" height="30" rx="5" class="fg-b warm"/><text x="385" y="130" text-anchor="middle" class="fg-t sm">不接新的，做完手上的</text>
<text x="480" y="130" class="fg-t sm">結束</text>
<rect x="260" y="165" width="380" height="30" rx="5" class="fg-b hot"/><text x="450" y="185" text-anchor="middle" class="fg-t sm">新設定，接所有新連線</text>
<text x="330" y="228" text-anchor="middle" class="fg-t sm">① 收到 SIGHUP，先檢查設定　② 用新設定開 worker　③ 通知舊 worker 收工　④ 舊連線全部做完</text>
</svg><figcaption>監聽的 socket 在 master 手上，從來沒關過，所以換設定的過程中沒有任何一個新連線被拒絕；舊連線也沒被硬切，只是做完就走。</figcaption></figure>
<p>關鍵在 ①：設定檔寫錯時，master 會記一行錯誤，然後<b>什麼都不換</b>，舊 worker 繼續服務。所以 <code>nginx -t &amp;&amp; systemctl reload nginx</code> 這個習慣要養成：先檢查，再重新載入。反過來，<code>systemctl restart nginx</code> 會把整個 master 停掉再開，中間那一瞬間新連線會被拒絕，設定寫錯的話就整個起不來了。</p>
<h4>systemd 停服務的順序</h4>
<p><code>systemctl stop hilo</code> 的流程是：先跑 <code>ExecStop=</code>（如果有寫）；再對整個 cgroup 送 <code>KillSignal=</code>（預設 SIGTERM，順便補一個 SIGCONT，免得行程剛好被暫停）；等 <code>TimeoutStopSec=</code>（預設 90 秒）；時間到還沒走完，再送 SIGKILL，日誌裡會留一行「State 'stop-sigterm' timed out. Killing.」。讓 <code>systemctl reload</code> 有作用，要自己寫上：</p>
<pre><code>[Service]
ExecReload=/bin/kill -HUP $MAINPID
TimeoutStopSec=40</code></pre>
<h4>站在負載平衡器後面，優雅關機有個時間差</h4>
<p>第 0.13 課的程式是「收到 SIGTERM 就不再接新連線，做完手上的再結束」。在負載平衡器後面這還不夠：負載平衡器大概每 5 到 10 秒才做一次健康檢查，你一關掉聆聽，它在發現之前還會繼續把新請求送過來，使用者就看到 502。正確的順序是先「讓健康檢查失敗、但照常服務」，等負載平衡器把你拿掉，才真的關門。Go 的寫法：</p>
<pre><code>ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM, os.Interrupt)
defer stop()
go srv.ListenAndServe()

&lt;-ctx.Done()                   // 收到 SIGTERM
ready.Store(false)             // /ready 開始回 503，但照常服務
time.Sleep(10 * time.Second)   // 等負載平衡器發現、把我拿掉
sctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
defer cancel()
srv.Shutdown(sctx)             // 關掉聆聽，等手上的請求做完
db.Close()                     // 最後才關資料庫連線池</code></pre>
<p>兩個細節。第一，時間要一層包一層：這裡 10 秒加 20 秒是 30 秒，就必須比外面的寬限期短，所以 systemd 的 <code>TimeoutStopSec</code> 設 40；放到 Kubernetes，<code>terminationGracePeriodSeconds</code> 也要跟著調大。第二，<code>Shutdown</code> 不會等被接管走的連線，WebSocket 就是。即時對戰的遊戲伺服器要自己記住所有 WebSocket，收到 SIGTERM 時通知用戶端「請重連到別台」，再一條一條關。</p>

<h3><span class="badge lv2">進階</span>五、權限：九個位元、三個特殊位元，和拆成四十份的 root</h3>
<figure class="figure"><svg viewBox="0 0 660 300" class="fg" style="width:100%;max-width:660px" role="img" aria-label="ls -l 的權限字串 -rw-r----- 拆成類型、擁有者、群組、其他人四段，換算成 640；下方是核心檢查權限的順序">
<text x="330" y="20" text-anchor="middle" class="fg-t mono">-rw-r-----  1  hilo  hilo  512  secrets.env</text>
<path d="M60 66 V58 H100 V66" class="fg-l"/><text x="80" y="51" text-anchor="middle" class="fg-t sm">類型</text>
<path d="M110 66 V58 H234 V66" class="fg-l alt"/><text x="172" y="51" text-anchor="middle" class="fg-t sm alt">擁有者 hilo</text>
<path d="M244 66 V58 H368 V66" class="fg-l on"/><text x="306" y="51" text-anchor="middle" class="fg-t sm acc">群組 hilo</text>
<path d="M378 66 V58 H502 V66" class="fg-l warm"/><text x="440" y="51" text-anchor="middle" class="fg-t sm warm">其他人</text>
<rect x="60" y="72" width="40" height="40" rx="5" class="fg-b"/><text x="80" y="98" text-anchor="middle" class="fg-t lg mono">-</text>
<rect x="110" y="72" width="40" height="40" rx="5" class="fg-b alt"/><text x="130" y="98" text-anchor="middle" class="fg-t lg mono">r</text>
<rect x="152" y="72" width="40" height="40" rx="5" class="fg-b alt"/><text x="172" y="98" text-anchor="middle" class="fg-t lg mono">w</text>
<rect x="194" y="72" width="40" height="40" rx="5" class="fg-b alt"/><text x="214" y="98" text-anchor="middle" class="fg-t lg mono">-</text>
<rect x="244" y="72" width="40" height="40" rx="5" class="fg-b hot"/><text x="264" y="98" text-anchor="middle" class="fg-t lg mono">r</text>
<rect x="286" y="72" width="40" height="40" rx="5" class="fg-b hot"/><text x="306" y="98" text-anchor="middle" class="fg-t lg mono">-</text>
<rect x="328" y="72" width="40" height="40" rx="5" class="fg-b hot"/><text x="348" y="98" text-anchor="middle" class="fg-t lg mono">-</text>
<rect x="378" y="72" width="40" height="40" rx="5" class="fg-b warm"/><text x="398" y="98" text-anchor="middle" class="fg-t lg mono">-</text>
<rect x="420" y="72" width="40" height="40" rx="5" class="fg-b warm"/><text x="440" y="98" text-anchor="middle" class="fg-t lg mono">-</text>
<rect x="462" y="72" width="40" height="40" rx="5" class="fg-b warm"/><text x="482" y="98" text-anchor="middle" class="fg-t lg mono">-</text>
<text x="172" y="134" text-anchor="middle" class="fg-t sm">4 + 2 + 0 = 6</text>
<text x="306" y="134" text-anchor="middle" class="fg-t sm">4 + 0 + 0 = 4</text>
<text x="440" y="134" text-anchor="middle" class="fg-t sm">0 + 0 + 0 = 0</text>
<text x="580" y="98" text-anchor="middle" class="fg-t lg acc">640</text>
<text x="580" y="118" text-anchor="middle" class="fg-t sm">r=4 w=2 x=1</text>
<rect x="20" y="166" width="160" height="40" rx="6" class="fg-b"/><text x="100" y="191" text-anchor="middle" class="fg-t">你是擁有者嗎？</text>
<rect x="250" y="166" width="160" height="40" rx="6" class="fg-b"/><text x="330" y="191" text-anchor="middle" class="fg-t">你在群組裡嗎？</text>
<rect x="480" y="166" width="160" height="40" rx="6" class="fg-b warm"/><text x="560" y="191" text-anchor="middle" class="fg-t">只看其他人 ---</text>
<rect x="20" y="246" width="160" height="40" rx="6" class="fg-b alt"/><text x="100" y="271" text-anchor="middle" class="fg-t">只看擁有者 rw-</text>
<rect x="250" y="246" width="160" height="40" rx="6" class="fg-b hot"/><text x="330" y="271" text-anchor="middle" class="fg-t">只看群組 r--</text>
<line x1="180" y1="186" x2="242" y2="186" class="fg-l"/><polygon points="250,186 242,181.5 242,190.5" class="fg-a"/><text x="215" y="178" text-anchor="middle" class="fg-t sm">不是</text>
<line x1="410" y1="186" x2="472" y2="186" class="fg-l"/><polygon points="480,186 472,181.5 472,190.5" class="fg-a"/><text x="445" y="178" text-anchor="middle" class="fg-t sm">不在</text>
<line x1="100" y1="206" x2="100" y2="238" class="fg-l alt"/><polygon points="100,246 95.5,238 104.5,238" class="fg-a alt"/><text x="110" y="228" class="fg-t sm">是</text>
<line x1="330" y1="206" x2="330" y2="238" class="fg-l on"/><polygon points="330,246 325.5,238 334.5,238" class="fg-a on"/><text x="340" y="228" class="fg-t sm">在</text>
</svg><figcaption>上半：三組三個位元，r、w、x 分別是 4、2、1，加起來就是 chmod 用的數字。下半：核心只挑<b>一組</b>來看，挑中了就不再看別組。</figcaption></figure>
<p>下半那張流程圖藏著一個反直覺的結果：權限是「先對號入座，再看那一組」，不是「三組裡挑最寬鬆的」。一個檔案是 <code>604</code>，你剛好在它的群組裡，你就<b>讀不到</b>，雖然連路人都讀得到。</p>
<h4>目錄的 r、w、x 意思不一樣</h4>
<ul>
<li><b>r</b>：可以列出裡面有哪些名字。<b>x</b>：可以「走進去」、通過它去碰裡面的東西。只有 x 沒有 r，你知道檔名就能打開，但 <code>ls</code> 不出來。</li>
<li><b>w</b>：可以在裡面新增、刪除、改名。所以<b>刪一個檔案看的是目錄的權限</b>，跟檔案本身無關。一個 <code>444</code> 的唯讀檔，放在你可寫的目錄裡，你照樣刪得掉。</li>
<li>網頁伺服器讀不到靜態檔，最常見的原因是路徑上某一層目錄少了 x。<code>namei -l /srv/hilo/public/index.html</code> 會把每一層的權限一次列出來，比一層一層 <code>ls -ld</code> 快得多。</li>
</ul>
<h4>三個特殊位元和 umask</h4>
<p>第四組數字放在最前面：<b>setuid</b>（4）讓程式用檔案擁有者的身分執行，<code>passwd</code> 就是靠它才能改 <code>/etc/shadow</code>；<b>setgid</b>（2）放在目錄上，讓裡面新建的檔案自動屬於同一個群組；<b>sticky</b>（1）放在 <code>/tmp</code> 這種大家都能寫的目錄上（<code>1777</code>），讓你只能刪自己的檔案。setuid 程式一旦有漏洞就是提權的跳板，資安檢查會用 <code>find / -xdev -perm -4000 -type f</code> 把它們全部列出來核對。<b>umask</b> 決定新檔案的預設權限：<code>022</code> 讓新檔案是 <code>644</code>、新目錄是 <code>755</code>；改成 <code>027</code>，其他人就什麼都看不到了。systemd 服務可以用 <code>UMask=</code> 單獨設定。</p>
<div class="warn"><b>SSH 金鑰登入失敗，常常是權限太「寬」。</b>sshd 預設會檢查你的家目錄和 <code>~/.ssh</code> 有沒有被其他人可寫，有的話它就拒絕用金鑰，免得別人偷偷塞一把鑰匙進去。<code>~/.ssh</code> 要 700，<code>authorized_keys</code> 和私鑰要 600。這也是 <code>chmod 777</code> 永遠不是答案的原因之一。</div>
<h4>capabilities：把 root 拆成四十份</h4>
<p>傳統上權限只分兩種人：root 什麼都能做，其他人照規矩來。這太粗了：只為了讓程式能開 443 號連接埠，就得給它整個 root。Linux 把 root 的能力拆成大約四十個 <b>capabilities</b>，可以一個一個發：</p>
<table>
<tr><th>capability</th><th>允許做什麼</th></tr>
<tr><td>CAP_NET_BIND_SERVICE</td><td>聽 1024 以下的連接埠</td></tr>
<tr><td>CAP_DAC_OVERRIDE</td><td>無視檔案的 rwx 權限，root 能讀所有檔案就是靠它</td></tr>
<tr><td>CAP_KILL</td><td>對不屬於自己的行程送訊號</td></tr>
<tr><td>CAP_NET_ADMIN</td><td>改網路設定、防火牆規則</td></tr>
<tr><td>CAP_SYS_ADMIN</td><td>掛載檔案系統等一大包，常被叫做「新的 root」，能不給就不給</td></tr>
</table>
<p>讓一個不是 root 的服務聽 443，最乾淨的做法是在 unit 裡寫 <code>User=hilo</code> 加上 <code>AmbientCapabilities=CAP_NET_BIND_SERVICE</code>。也可以用 <code>setcap 'cap_net_bind_service=+ep'</code> 把它貼在執行檔上，但對 Node 這種直譯器要小心：貼在 <code>node</code> 執行檔上，等於讓這台機器上<b>每一支</b> Node 程式都拿到它。看一個行程手上有哪些能力：<code>grep Cap /proc/PID/status</code>，再用 <code>capsh --decode=</code> 加上那串十六進位數字翻成名字。下一個模組你會看到，容器的 root 之所以「沒那麼 root」，靠的就是這套。</p>

<h3><span class="badge lv3">專業</span>六、「磁碟滿了」的三種樣子</h3>
<p>下面三種狀況，程式看到的錯誤一模一樣：<code>ENOSPC</code>，也就是「No space left on device」。可是原因和修法完全不同。</p>
<h4>第一種：區塊真的用完了</h4>
<p><code>df -h</code> 顯示 100%。用 <code>sudo du -xh --max-depth=1 / | sort -h | tail</code> 一層一層往下找（<code>-x</code> 讓它不要跑進別的檔案系統）。常見的兇手：<code>/var/log</code>、<code>/var/lib/docker</code>（舊映像檔、建置快取、沒有上限的容器日誌）、舊版本的發布目錄、程式當掉留下的 core dump、journald。</p>
<p>還有一個細節：ext4 預設保留 5% 的空間給 root。一般使用者的程式在 <code>df</code> 顯示 100% 時已經寫不進去，root 卻還能寫，這是為了讓系統服務和你登入救火時還有一點空間。1 TB 的資料碟保留 50 GB 有點浪費，可以用 <code>tune2fs -m 1</code> 調低，但系統碟留著比較好。</p>
<h4>第二種：inode 用完了</h4>
<p>每個檔案除了內容，還需要一個 <b>inode</b>，記著擁有者、權限、大小、內容放在哪些區塊。ext4 的 inode 數量在建立檔案系統時就固定了，預設大約每 16 KB 一個。幾百萬個小檔案（session 檔、縮圖、快取、郵件佇列）會先把 inode 用完：<code>df -h</code> 還剩 40%，<code>df -i</code> 卻是 100%。找出是哪個目錄：<code>sudo du --inodes -x -d1 / | sort -n | tail</code>。XFS 的 inode 是動態配置的，比較少遇到這個問題。</p>
<h4>第三種：檔案刪了，空間卻沒回來</h4>
<figure class="figure"><svg viewBox="0 28 660 236" class="fg" style="width:100%;max-width:660px" role="img" aria-label="檔案被刪除之後，目錄裡的名字沒了，但行程的檔案描述符還指著 inode，所以資料區塊沒有被釋放；du 看不到它，df 還在算它">
<rect x="20" y="40" width="180" height="110" rx="8" class="fg-b"/>
<text x="110" y="60" text-anchor="middle" class="fg-t">目錄 /var/log/hilo</text>
<rect x="32" y="72" width="156" height="28" rx="4" class="fg-b warm dash"/><text x="110" y="91" text-anchor="middle" class="fg-t sm">app.log（已被 rm）</text>
<rect x="32" y="108" width="156" height="28" rx="4" class="fg-b"/><text x="110" y="127" text-anchor="middle" class="fg-t sm">error.log</text>
<rect x="250" y="50" width="160" height="90" rx="8" class="fg-b alt"/>
<text x="330" y="74" text-anchor="middle" class="fg-t alt">inode 1234</text>
<text x="330" y="98" text-anchor="middle" class="fg-t sm">連結數：0</text>
<text x="330" y="120" text-anchor="middle" class="fg-t sm">還被開著：1 次</text>
<rect x="460" y="40" width="180" height="110" rx="8" class="fg-b"/>
<text x="550" y="60" text-anchor="middle" class="fg-t">資料區塊</text>
<rect x="476" y="70" width="20" height="16" rx="2" class="fg-b warm"/><rect x="502" y="70" width="20" height="16" rx="2" class="fg-b warm"/><rect x="528" y="70" width="20" height="16" rx="2" class="fg-b warm"/><rect x="554" y="70" width="20" height="16" rx="2" class="fg-b warm"/><rect x="580" y="70" width="20" height="16" rx="2" class="fg-b warm"/><rect x="606" y="70" width="20" height="16" rx="2" class="fg-b warm"/>
<rect x="476" y="92" width="20" height="16" rx="2" class="fg-b warm"/><rect x="502" y="92" width="20" height="16" rx="2" class="fg-b warm"/><rect x="528" y="92" width="20" height="16" rx="2" class="fg-b warm"/><rect x="554" y="92" width="20" height="16" rx="2" class="fg-b warm"/><rect x="580" y="92" width="20" height="16" rx="2" class="fg-b warm"/><rect x="606" y="92" width="20" height="16" rx="2" class="fg-b warm"/>
<text x="550" y="134" text-anchor="middle" class="fg-t sm warm">41 GB，還沒釋放</text>
<line x1="188" y1="86" x2="250" y2="86" class="fg-l dim dash"/>
<text x="219" y="78" text-anchor="middle" class="fg-t sm">斷了</text>
<line x1="410" y1="95" x2="452" y2="95" class="fg-l"/><polygon points="460,95 452,90.5 452,99.5" class="fg-a"/>
<rect x="250" y="206" width="160" height="50" rx="8" class="fg-b hot"/>
<text x="330" y="228" text-anchor="middle" class="fg-t acc">node PID 2211</text>
<text x="330" y="246" text-anchor="middle" class="fg-t sm">fd 23 還開著</text>
<line x1="330" y1="206" x2="330" y2="148" class="fg-l on"/><polygon points="330,140 325.5,148 334.5,148" class="fg-a on"/>
<text x="110" y="176" text-anchor="middle" class="fg-t sm">du 沿著目錄數：找不到它</text>
<text x="550" y="176" text-anchor="middle" class="fg-t sm">df 數區塊：它還佔著</text>
</svg><figcaption><code>rm</code> 只是把目錄裡的名字拿掉。只要還有行程開著這個檔案，inode 和它的資料區塊就會一直留著，直到最後一個檔案描述符被關掉。</figcaption></figure>
<p>症狀很好認：<code>df</code> 說滿了，<code>du</code> 加起來卻少了一大截。最常見的劇本是值班的人看到磁碟快滿，順手 <code>rm</code> 掉一個 40 GB 的日誌檔，結果 <code>df</code> 一動也不動。找出這種檔案：</p>
<pre><code>$ sudo lsof +L1                    # 連結數小於 1，也就是被刪了還開著
COMMAND  PID USER  FD  TYPE SIZE/OFF    NLINK NAME
node    2211 hilo  23w REG  44023414784     0 /var/log/hilo/app.log (deleted)
# 沒有 lsof 的話，直接看 /proc
$ sudo find /proc/*/fd -lname '*(deleted)' 2&gt;/dev/null
# 不重啟也能把空間拿回來：把它截成 0
$ sudo truncate -s 0 /proc/2211/fd/23</code></pre>
<p>重啟那個行程也可以，但半夜能不重啟就不重啟。比較好的習慣是：要清日誌，用 <code>truncate -s 0</code> 而不是 <code>rm</code>。</p>
<p>還有一種少見的：資料碟掛上 <code>/data</code> 之前，有程式先往 <code>/data</code> 寫了東西，它們其實落在系統碟上，掛載後被蓋住，<code>du</code> 看不到。用 <code>mount --bind / /mnt/rootfs</code> 另外掛一份根目錄就看得到。</p>
<div class="note"><b>預防比救火便宜。</b>磁碟用到 80% 就發警報，inode 也要設；容器日誌要有上限（下一節）；<code>docker system df</code> 定期看。清理時小心 <code>docker system prune -a</code>：它會刪掉所有「沒在用」的映像檔，包括你準備拿來回復上一版的那一個。</div>

<h3><span class="badge lv3">專業</span>七、日誌輪替：不只是「定期刪掉」</h3>
<p>日誌輪替（log rotation）的意思是：把正在寫的日誌換成新檔、舊的壓縮起來、太舊的刪掉。大多數發行版用 <code>logrotate</code>，每天由 systemd 計時器叫起來一次。難的不是刪，而是<b>正在寫的那個程式手上還拿著舊檔的檔案描述符</b>。有兩種做法：</p>
<pre><code>/var/log/hilo/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 hilo hilo
    sharedscripts
    postrotate
        systemctl reload hilo.service &gt;/dev/null 2&gt;&amp;1 || true
    endscript
}</code></pre>
<ul>
<li><b>改名再通知（create 加 postrotate）</b>：把 <code>app.log</code> 改名成 <code>app.log.1</code>，建一個新的空 <code>app.log</code>，再通知程式重新打開日誌檔（通常是 SIGHUP，這裡透過 reload 送）。改名不會改變 inode，所以在通知之前，程式其實一直在寫 <code>app.log.1</code>。</li>
<li><b>複製再截斷（copytruncate）</b>：把內容複製一份出去，再把原檔截成 0。程式不用配合，但複製和截斷之間寫進來的幾行會<b>遺失</b>；而且程式如果不是用附加模式（O_APPEND）打開檔案，它下一次會從原本的位置繼續寫，前面留下一大段空洞，檔案看起來還是幾十 GB。</li>
</ul>
<p>現在把第六節的第三種情況接起來：程式不支援重新打開日誌檔，你卻用了「改名」的做法、又沒通知它。它就一路寫進 <code>app.log.1</code>，過了 14 天，logrotate 依規則把這個檔刪掉，程式手上還開著，於是出現一個越長越大、<code>du</code> 看不到的幽靈檔案。這就是為什麼「磁碟滿了但 du 對不上」在正式環境那麼常見。</p>
<h4>更好的做法：寫到標準輸出，交給別人管</h4>
<p>現代的建議是程式只寫到標準輸出，最好是一行一筆 JSON，讓 journald 或容器執行環境去存、去輪替、去轉送。但要注意 Docker 的預設：<code>json-file</code> 日誌驅動<b>預設沒有大小上限</b>，一個話很多的容器可以把磁碟寫滿。在 <code>/etc/docker/daemon.json</code> 設好上限（只對之後新建的容器生效）：</p>
<pre><code>{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}</code></pre>
<p>Kubernetes 的 kubelet 則會自己輪替容器日誌，預設每個容器 10 MiB、保留 5 個檔。所以在叢集裡，日誌一定要另外送到集中的地方（第 4.1 課），不然輪替掉就沒了。</p>

<h3><span class="badge lv3">專業</span>八、把門鎖好：SSH 與服務的加固</h3>
<p>上一課列了四條 SSH 原則。實際動手時，有幾個地方很容易出錯。</p>
<pre><code># /etc/ssh/sshd_config.d/10-hardening.conf
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
AllowGroups ssh-users
MaxAuthTries 3
AllowAgentForwarding no
X11Forwarding no</code></pre>
<ul>
<li><b>先到的設定贏。</b>sshd 對同一個關鍵字採用<b>第一次</b>讀到的值，跟多數程式剛好相反。Ubuntu 和 Debian 的主設定檔第一行就是 include 這個資料夾，所以檔名用小數字開頭。有些雲端映像檔會放一個 <code>50-cloud-init.conf</code>，裡面寫著 <code>PasswordAuthentication yes</code>，你的 <code>10-</code> 排在它前面才會贏。</li>
<li><b>改完先驗證，再重新載入，而且不要關掉目前的連線。</b><code>sudo sshd -t</code> 檢查語法（沒有輸出就是對的），<code>sudo sshd -T | grep -E 'passwordauthentication|permitrootlogin'</code> 看真正生效的值，然後 <code>systemctl reload ssh</code>（RHEL 系列叫 <code>sshd</code>）。保持原本的視窗開著，另外開一個新視窗試登入，成功了才關。把自己鎖在外面的人，幾乎都是跳過了這一步。</li>
<li><b>金鑰用 ed25519</b>：<code>ssh-keygen -t ed25519</code>，短、快、安全。<code>AllowAgentForwarding no</code> 是因為轉送進一台被入侵的機器時，那台機器上的 root 可以借用你的 agent 登入別的地方。</li>
<li><b>最好的 SSH 是不對外的 SSH。</b>安全群組只開給你的固定 IP 或 VPN；更進一步，用 AWS Systems Manager 的 Session Manager、跳板機或 Tailscale 這類方案，22 號連接埠完全不開。fail2ban 可以減少日誌裡的雜訊，但不能取代「不對外」。</li>
</ul>
<h4>服務本身也能上鎖</h4>
<p>systemd 有一整組沙盒設定，放在覆寫檔裡，就能讓一個被入侵的服務能做的事少很多：</p>
<pre><code>[Service]
NoNewPrivileges=yes
ProtectSystem=strict
ReadWritePaths=/var/lib/hilo
ProtectHome=yes
PrivateTmp=yes
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
AmbientCapabilities=CAP_NET_BIND_SERVICE</code></pre>
<p><code>ProtectSystem=strict</code> 讓整個檔案系統對它唯讀，只有 <code>ReadWritePaths</code> 列出來的地方能寫；<code>NoNewPrivileges</code> 讓它就算執行了 setuid 程式也拿不到更多權限；<code>CapabilityBoundingSet</code> 把能力的上限收到只剩一個。<code>systemd-analyze security hilo</code> 會打一個 0 到 10 的曝險分數，一個什麼都沒設的服務通常是 9 點多的「UNSAFE」，加上這幾行分數會明顯下降，報告還會逐條列出下一步能加什麼。每加一行都要重新測試服務，因為程式可能真的需要寫某個你沒想到的路徑。</p>
<p>最後，<b>時鐘</b>：<code>timedatectl</code> 要看到「System clock synchronized: yes」。時間差幾分鐘，TLS 憑證可能被判定「還沒生效」、一次性驗證碼對不上，跨機器的日誌也排不出先後順序。</p>

<h3><span class="badge lv4">專家</span>九、OOM killer 怎麼挑人</h3>
<p>第 0.9 課說過，Linux 允許大家登記的記憶體超過實體記憶體。等到真的不夠用，核心會先努力回收：丟掉頁快取、把頁搬到 swap。回收不了，才叫出 OOM killer，挑一個行程送 SIGKILL。它不是挑「最後來要記憶體的那個」，也不是挑「最新的那個」，而是替每個行程算一個<b>壞分數</b>（badness），挑最高分的：</p>
<ul>
<li><b>基本分</b>：這個行程佔用的記憶體，包括 RSS、swap 和分頁表，佔「實體記憶體加 swap」的比例，大致換算成 0 到 1000。佔一半，就是 500 左右。</li>
<li><b>加減分</b>：再加上 <code>/proc/PID/oom_score_adj</code>，範圍從 -1000 到 +1000。<b>-1000 代表永遠不挑它</b>；+500 等於假裝它多吃了一半的記憶體。</li>
</ul>
<figure class="figure"><svg viewBox="0 0 640 262" class="fg" style="width:100%;max-width:640px" role="img" aria-label="一台 8 GB 沒有 swap 的機器上，四個行程的壞分數示意：node 約 400 最高被選中，postgres 約 250，redis 約 125，sshd 的 adj 是 -1000 永遠不選">
<text x="20" y="24" class="fg-t lg">記憶體 8 GB、沒有 swap 的機器</text>
<text x="20" y="69" class="fg-t">node（3.2 GB）</text>
<text x="20" y="117" class="fg-t">postgres（2.0 GB）</text>
<text x="20" y="165" class="fg-t">redis（1.0 GB）</text>
<text x="20" y="213" class="fg-t">sshd（adj -1000）</text>
<rect x="170" y="50" width="160" height="28" rx="4" class="fg-b warm"/>
<text x="340" y="69" class="fg-t warm">約 400：最高分，被砍</text>
<rect x="170" y="98" width="100" height="28" rx="4" class="fg-b alt"/>
<text x="280" y="117" class="fg-t sm">約 250</text>
<rect x="170" y="146" width="50" height="28" rx="4" class="fg-b alt"/>
<text x="230" y="165" class="fg-t sm">約 125</text>
<text x="176" y="213" class="fg-t sm acc">永遠不選</text>
<line x1="170" y1="236" x2="570" y2="236" class="fg-l dim"/>
<line x1="170" y1="232" x2="170" y2="240" class="fg-l"/><line x1="270" y1="232" x2="270" y2="240" class="fg-l"/><line x1="370" y1="232" x2="370" y2="240" class="fg-l"/><line x1="470" y1="232" x2="470" y2="240" class="fg-l"/><line x1="570" y1="232" x2="570" y2="240" class="fg-l"/>
<text x="170" y="254" text-anchor="middle" class="fg-t sm">0</text><text x="270" y="254" text-anchor="middle" class="fg-t sm">250</text><text x="370" y="254" text-anchor="middle" class="fg-t sm">500</text><text x="470" y="254" text-anchor="middle" class="fg-t sm">750</text><text x="570" y="254" text-anchor="middle" class="fg-t sm">1000</text>
</svg><figcaption>分數大致等於「吃掉總記憶體的千分比」，再加上 oom_score_adj。這是示意的換算，<code>/proc/PID/oom_score</code> 顯示的原始數字在不同核心版本的刻度不一樣，只要記得越大越危險。</figcaption></figure>
<p>這套規則推出一個值班時一定要記得的事實：<b>被殺的常常是無辜的大戶</b>。node 洩漏記憶體、被殺、重啟、記憶體還很小；這時候吃最多的換成資料庫，下一輪 OOM 被殺的就是資料庫。核心日誌會把兩件事分開寫，一行是「誰觸發的」，一行是「殺了誰」：</p>
<pre><code>postgres invoked oom-killer: gfp_mask=0x140cca(GFP_HIGHUSER_MOVABLE|__GFP_COMP), order=0, oom_score_adj=0
Out of memory: Killed process 4127 (node) total-vm:12856000kB, anon-rss:3201000kB, file-rss:0kB, shmem-rss:0kB, UID:998 pgtables:7400kB oom_score_adj:0</code></pre>
<h4>整台不夠，還是撞到上限</h4>
<p>OOM 有兩種。<b>整台機器</b>的記憶體不夠時，訊息是「Out of memory」，所有行程都是候選人。一個 cgroup 撞到自己的上限（容器的記憶體上限、systemd 的 <code>MemoryMax=</code>）時，訊息是「Memory cgroup out of memory」，只有那個 cgroup 裡的行程會被挑。後者其實是好事：洩漏的服務只會殺到自己，旁邊的資料庫安然無恙。這也是為什麼「每個服務都設記憶體上限」是正式環境的基本功。cgroup 還有一個 <code>memory.oom.group</code> 開關，打開後會把整組行程一起殺掉，避免只殺掉一半、剩下的半殘還在跑。</p>
<h4>核心的 OOM 常常來得太晚</h4>
<p>核心要等到「真的一頁都回收不了」才出手，在那之前，機器可能已經瘋狂搬頁、卡死好幾分鐘，SSH 都連不進去。所以 Fedora、新版 Ubuntu 這些發行版加了使用者空間的 <code>systemd-oomd</code>，它看 PSI 的記憶體壓力，壓力持續太高就提早殺掉最大的那個 cgroup。伺服器上也有人用 <code>earlyoom</code>。</p>
<h4>能調的幾個地方</h4>
<ul>
<li><code>OOMScoreAdjust=-500</code> 寫在重要服務的 unit 裡。但不要每個都設 -1000，大家都受保護，就等於沒有人受保護，最後核心可能只剩 sshd 可以殺。</li>
<li><code>vm.overcommit_memory</code>：0 是預設的啟發式；1 是永遠答應；2 是嚴格記帳，超過就讓配置直接失敗。Redis 官方建議設 1，因為它存快照時要 fork，而 fork 在啟發式模式下可能被拒絕。</li>
<li>Node 的 <code>--max-old-space-size</code>、JVM 的 <code>-Xmx</code> 要比 cgroup 上限小一截，讓執行環境先自己回收，而不是被核心一槍斃命。</li>
</ul>

<h3><span class="badge lv4">專家</span>十、一場完整的事故：從警報到事後檢討</h3>
<p>把整章串起來走一次。場景：一台雲端主機 api-1 上跑著猜高低遊戲的 API（<code>hilo.service</code>，Node.js），同一台還跑著 PostgreSQL。前一天傍晚剛部署了 1.8 版。先看一張「服務死了，是誰殺的」的判斷圖，等一下會照著它走：</p>
<figure class="figure"><svg viewBox="0 0 680 316" class="fg" style="width:100%;max-width:680px" role="img" aria-label="服務死掉時的判斷樹：先看 systemctl status 的結束方式，自己結束就看應用程式日誌，被 SIGKILL 就查 OOM，SEGV 或 ABRT 就查 core dump">
<rect x="210" y="10" width="260" height="40" rx="8" class="fg-b hot"/><text x="340" y="35" text-anchor="middle" class="fg-t acc">systemctl status：怎麼結束的？</text>
<path d="M340 50 V68 H115 V82" class="fg-l"/><polygon points="115,90 110.5,82 119.5,82" class="fg-a"/>
<line x1="340" y1="50" x2="340" y2="82" class="fg-l"/><polygon points="340,90 335.5,82 344.5,82" class="fg-a"/>
<path d="M340 68 H565 V82" class="fg-l"/><polygon points="565,90 560.5,82 569.5,82" class="fg-a"/>
<rect x="20" y="90" width="190" height="48" rx="6" class="fg-b"/><text x="115" y="110" text-anchor="middle" class="fg-t sm mono">code=exited status=1</text><text x="115" y="128" text-anchor="middle" class="fg-t sm">程式自己結束</text>
<rect x="245" y="90" width="190" height="48" rx="6" class="fg-b warm"/><text x="340" y="110" text-anchor="middle" class="fg-t sm mono">status=9/KILL</text><text x="340" y="128" text-anchor="middle" class="fg-t sm">被 SIGKILL 殺掉</text>
<rect x="470" y="90" width="190" height="48" rx="6" class="fg-b"/><text x="565" y="110" text-anchor="middle" class="fg-t sm mono">SEGV／ABRT</text><text x="565" y="128" text-anchor="middle" class="fg-t sm">程式當掉</text>
<line x1="115" y1="138" x2="115" y2="162" class="fg-l"/><polygon points="115,170 110.5,162 119.5,162" class="fg-a"/>
<line x1="340" y1="138" x2="340" y2="162" class="fg-l warm"/><polygon points="340,170 335.5,162 344.5,162" class="fg-a warm"/>
<line x1="565" y1="138" x2="565" y2="162" class="fg-l"/><polygon points="565,170 560.5,162 569.5,162" class="fg-a"/>
<rect x="20" y="170" width="190" height="48" rx="6" class="fg-b alt"/><text x="115" y="190" text-anchor="middle" class="fg-t sm">看它自己的日誌</text><text x="115" y="208" text-anchor="middle" class="fg-t sm mono">journalctl -u hilo</text>
<rect x="245" y="170" width="190" height="48" rx="6" class="fg-b"/><text x="340" y="190" text-anchor="middle" class="fg-t sm">核心日誌裡有 OOM 嗎？</text><text x="340" y="208" text-anchor="middle" class="fg-t sm mono">journalctl -k</text>
<rect x="470" y="170" width="190" height="48" rx="6" class="fg-b alt"/><text x="565" y="190" text-anchor="middle" class="fg-t sm">看 core dump</text><text x="565" y="208" text-anchor="middle" class="fg-t sm mono">coredumpctl list</text>
<path d="M300 218 V236 H210 V250" class="fg-l"/><polygon points="210,258 205.5,250 214.5,250" class="fg-a"/>
<path d="M380 218 V236 H470 V250" class="fg-l"/><polygon points="470,258 465.5,250 474.5,250" class="fg-a"/>
<text x="246" y="231" text-anchor="end" class="fg-t sm">有</text><text x="434" y="231" class="fg-t sm">沒有</text>
<rect x="120" y="258" width="180" height="48" rx="6" class="fg-b warm"/><text x="210" y="278" text-anchor="middle" class="fg-t sm">「Memory cgroup」→ 撞上限</text><text x="210" y="296" text-anchor="middle" class="fg-t sm">「Out of memory」→ 整台不夠</text>
<rect x="380" y="258" width="180" height="48" rx="6" class="fg-b"/><text x="470" y="278" text-anchor="middle" class="fg-t sm">stop 逾時被補一刀？</text><text x="470" y="296" text-anchor="middle" class="fg-t sm">還是有人 kill -9？</text>
</svg><figcaption>先分「自己走的」還是「被殺的」，再問「誰殺的」。被 SIGKILL 殺掉的程式沒有機會留遺言，所以它自己的日誌一定看不到原因，要去核心日誌或 systemd 的日誌找。</figcaption></figure>
<h4>03:02 警報：api-1 健康檢查失敗</h4>
<p><b>第一分鐘：範圍和變更。</b>api-2 正常，所以不是資料庫叢集或 DNS 這種共用的東西，問題在 api-1 本身。最近的變更：昨天 18:00 部署的 1.8 版。先記下來，等一下可能就是答案。</p>
<p><b>第二分鐘：它怎麼死的。</b></p>
<pre><code>$ systemctl status hilo | head -3
● hilo.service - Higher or Lower API
     Loaded: loaded (/etc/systemd/system/hilo.service; enabled)
     Active: activating (auto-restart) (Result: oom-kill) since 03:03:41 UTC; 1s ago
$ systemctl show -p NRestarts hilo
NRestarts=23</code></pre>
<p>23 次重啟，結果是 oom-kill。照判斷圖走中間那條：被殺的，去核心日誌找。</p>
<p><b>第四分鐘：誰殺的、殺了誰。</b></p>
<pre><code>$ journalctl -k --since "00:00" | grep -iE "invoked oom|killed process"
02:51:07 kernel: postgres invoked oom-killer: ... oom_score_adj=0
02:51:07 kernel: Out of memory: Killed process 4127 (node) ... anon-rss:3201000kB ...
02:58:33 kernel: Out of memory: Killed process 1290 (postgres) ... anon-rss:1650000kB ...
（後面還有好幾筆 node）</code></pre>
<p>訊息是「Out of memory」，不是「Memory cgroup」：整台機器不夠，而且 hilo 沒有設記憶體上限。更糟的是 02:58 那一行：<b>PostgreSQL 也被殺過一次</b>。node 被殺、重啟、記憶體變小，那一刻最大的變成資料庫，它就成了無辜的大戶。資料庫被 SIGKILL 會在重啟時做崩潰回復，資料不會壞，但這件事的嚴重度立刻升一級。</p>
<p><b>第五分鐘：用 USE 確認記憶體這一格。</b></p>
<pre><code>$ free -m
        total   used   free  shared  buff/cache  available
Mem:     7820   7410    112       4         298        180
$ cat /proc/pressure/memory
some avg10=41.20 avg60=22.75 avg300=8.10 total=…
full avg10=18.53 avg60=9.40 avg300=3.02 total=…
$ ps -eo pid,rss,etime,comm --sort=-rss | head -3
  PID   RSS     ELAPSED COMMAND
 6620 2914200     04:12 node
 1302 1580020     04:31 postgres</code></pre>
<p>使用率：available 只剩 180 MB。飽和：記憶體壓力 41%，大家一直在等記憶體。node 才跑了四分鐘就 2.9 GB，這不是流量大，是洩漏。</p>
<p><b>第十分鐘：先止血，不急著找根因。</b>變更已經擺在眼前，最快的止血是退回 1.7 版。03:12 回滾完成，03:20 確認 node 的 RSS 穩定在 400 MB 上下、記憶體壓力歸零、健康檢查恢復，宣告事故結束。半夜的目標是「讓服務恢復」，不是「當場找到哪一行程式碼」。</p>
<h4>隔天：根因與永久修正</h4>
<p>比對 1.8 版跑一小時前後的兩份 heap snapshot，多出來的是一個 Map：每一局遊戲結束後，都把那一局的資料存進去當快取，卻從來不刪。永久修正分成四項，每一項都對應到這一章的某一節：</p>
<ol>
<li>程式：快取改成有上限、會淘汰的 LRU，並且補一個「跑一萬局後記憶體不再成長」的測試。</li>
<li>隔離：<code>hilo.service</code> 加上 <code>MemoryHigh=1200M</code> 和 <code>MemoryMax=1500M</code>。下次再洩漏，先被拖慢、再只殺到自己，資料庫不會再被拖下水；長期則把資料庫搬到自己的機器。</li>
<li>警報：可用記憶體低於 15% 就警告；服務的重啟次數在 10 分鐘內增加超過 3 次也警告。這次是健康檢查失敗才發現，其實 02:51 第一次 OOM 時就該有人知道。</li>
<li>確認 journald 是持久化的。這次能還原整個時間線，是因為核心日誌都還在；如果有人在 03:05 選擇「先重開機再說」，證據就全沒了。</li>
</ol>
<p>最後寫一份不究責的事後檢討（第 4.3 課）：時間線、影響、根因、修正項目和負責人。它的價值不在追究誰部署了那一版，而在讓團隊下次少花十分鐘。</p>

<h3>十一、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>磁碟滿了，刪掉最大的檔案就會空出來</td><td>還有行程開著它，空間就不會回來。用 <code>lsof +L1</code> 找出來，重啟或截斷；以後清日誌用 <code>truncate</code>。</td></tr>
<tr><td>No space left on device 就是空間用完</td><td>也可能是 inode 用完。<code>df -h</code> 和 <code>df -i</code> 都要看。</td></tr>
<tr><td>OOM killer 會殺掉那個在要記憶體的行程</td><td>它挑壞分數最高的，常常是吃很多但沒做錯事的資料庫。</td></tr>
<tr><td>權限問題 <code>chmod 777</code> 就好</td><td>這等於讓所有人都能改，還會讓 sshd 拒絕金鑰。該修的是擁有者和路徑上缺的 x。</td></tr>
<tr><td>出事先重開機最快</td><td>可能一起毀掉證據：日誌沒持久化就全沒了。先看、先記，真的要重開也先存下 <code>journalctl -b</code>。</td></tr>
<tr><td>SIGHUP 就是把程式殺掉</td><td>對多數常駐服務，它的意思是重新載入設定或重新打開日誌檔。</td></tr>
<tr><td>只有 root 才能聽 80、443</td><td>只需要 CAP_NET_BIND_SERVICE 這一個能力，用 systemd 的 <code>AmbientCapabilities</code> 給就好。</td></tr>
</table>

<h3>十二、跟你的工作連起來</h3>
<ul>
<li><b>Node.js／TypeScript</b>：日誌寫標準輸出；SIGTERM 時先讓 <code>/ready</code> 失敗再關門；別對 Node 送 SIGUSR1；<code>--max-old-space-size</code> 要比記憶體上限小。</li>
<li><b>Go</b>：<code>signal.NotifyContext</code> 加 <code>Shutdown</code> 是標準寫法，WebSocket 要自己收尾；卡住時送 SIGQUIT 拿 goroutine 堆疊，但它會結束。</li>
<li><b>Docker</b>：<code>daemon.json</code> 一定要設日誌上限；容器結束代碼 137 就去看 <code>dmesg</code>；<code>docker system df</code> 放進每週的例行檢查。</li>
<li><b>前端與遊戲的網頁版</b>：Cocos、Unity 網頁版的建置檔丟到 nginx 後面時，403 多半是路徑上某層目錄少了 x，用 <code>namei -l</code> 一次看完；改 nginx 設定一律 <code>nginx -t</code> 再 reload，不要 restart。</li>
<li><b>雲端主機</b>：磁碟和 inode 都設 80% 警報、journald 持久化、SSH 只開給 VPN。各花十分鐘，能省掉很多個半夜。</li>
</ul>

<h3>十三、面試會怎麼問</h3>
<p>下面是 DevOps、SRE、後端面試裡很常出現的題目。先自己出聲講一遍，再打開參考答案。</p>
<ol>
<li>「一台 Linux 伺服器出問題了，你登入之後的前五分鐘會做什麼？」</li>
<li>「df 顯示磁碟滿了，du 加起來卻只有一半，可能是什麼原因？怎麼處理？」</li>
<li>「OOM killer 怎麼決定殺誰？要怎麼保護重要的服務？」</li>
<li>「SIGTERM、SIGKILL、SIGHUP 差在哪裡？一個服務怎麼做到不停機重新載入設定？」</li>
<li>「要讓一個不是 root 的服務聽 443 號連接埠，有哪些做法？各有什麼代價？」</li>
<li>「你會怎麼加固一台對外的 Linux 伺服器的 SSH？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>先問兩件事：最近改了什麼、影響範圍是一台還是全部。接著看最便宜的錯誤來源：<code>dmesg -T | tail</code>、<code>journalctl -p err -b</code>、出事服務的 <code>systemctl status</code>。然後用 USE 方法逐一檢查 CPU、記憶體、磁碟空間與 inode、磁碟 I/O、網路、檔案描述符：每種看使用率、飽和（排隊）、錯誤，飽和可以看 vmstat 的 r 和 /proc/pressure。目標是先止血（回滾、隔離、擴容），根因留到之後。</li>
<li>最常見是檔案已經被刪，但還有行程開著它：目錄裡沒有名字了，du 數不到，inode 和資料區塊卻還在，df 照算。用 <code>lsof +L1</code> 或在 /proc/*/fd 找「(deleted)」，重啟該行程或把那個 fd 截斷成 0。其他可能：檔案藏在後來掛上的掛載點底下、ext4 保留給 root 的 5%、或 du 跑到別的檔案系統被 -x 排除。</li>
<li>實體記憶體加 swap 都不夠、回收也失敗時，核心替每個行程算壞分數：佔用的記憶體（RSS、swap、分頁表）佔總量的比例，再加上 oom_score_adj（-1000 到 +1000），挑最高的送 SIGKILL。所以被殺的不一定是肇事者。保護方法：替每個服務設 cgroup 記憶體上限（MemoryMax 或容器上限），讓洩漏只殺到自己；重要服務適度調低 OOMScoreAdjust；監控可用記憶體和 PSI；必要時用 systemd-oomd 提早處理。</li>
<li>SIGTERM 是請程式結束，可以攔下來先收尾；SIGKILL 由核心直接執行，無法攔截；SIGHUP 慣例上是重新讀設定或重新開日誌檔。不停機重新載入的做法以 nginx 為例：監聽 socket 留在 master 手上，收到 SIGHUP 先檢查設定，再用新設定開新的 worker，並通知舊 worker 不接新連線、做完手上的就結束；設定錯誤就保持原狀。systemd 用 ExecReload 把 reload 對應到送 SIGHUP。</li>
<li>一是用 systemd 的 AmbientCapabilities=CAP_NET_BIND_SERVICE 搭配 User=，只給這一個能力，最乾淨。二是用 setcap 把能力貼在執行檔上，但對直譯器（node、python）等於讓所有腳本都拿到。三是讓服務聽 8080，前面放 nginx 或負載平衡器轉到 443，順便處理 TLS。四是調整 net.ipv4.ip_unprivileged_port_start，但它影響整台機器。絕對不要為了這件事用 root 跑服務。</li>
<li>只允許金鑰登入、關掉密碼與鍵盤互動驗證、禁止 root 直接登入、用 AllowGroups 限定誰能登入、MaxAuthTries 調低、關掉不需要的轉送。設定放在 sshd_config.d 的低編號檔案裡，因為 sshd 採用第一次讀到的值；改完用 sshd -t 和 sshd -T 驗證，保留原連線另開視窗測試。網路層讓 22 號連接埠只對 VPN 或固定 IP 開放，更好的是改用 Session Manager 或跳板機。再加上時鐘同步與登入日誌的監控。</li>
</ol>
</details>

<h3>十四、練功題（做得出來才算真的懂）</h3>
<ol>
<li>一台 4 核心的機器，<code>/proc/loadavg</code> 是 <code>11.80 6.02 2.10 14/902 731455</code>。用一兩句話說出你從這五個欄位讀到了什麼。</li>
<li>檔案 <code>report.csv</code> 的權限是 <code>604</code>，擁有者 alice、群組 dev。bob 在 dev 群組裡，他讀得到嗎？carol 不在群組裡呢？</li>
<li>一顆 20 GB 的 ext4 磁碟，用預設設定建立，大約有幾個 inode？如果一個程式每秒產生 30 個小快取檔、從不清理，大約多久會用完？</li>
<li>不改套件的檔案，讓 nginx 的檔案描述符上限變成 65536、記憶體上限 1 GB。寫出覆寫檔的內容和需要的指令。</li>
<li>在沒有 lsof 的容器主機上，用一行指令找出「被刪掉但還開著」的檔案，並說明怎麼在不重啟行程的情況下把空間拿回來。</li>
<li>logrotate 用了 <code>copytruncate</code>，程式卻不是用附加模式打開日誌檔。截斷之後，<code>ls -l</code> 和 <code>du</code> 看到的大小會有什麼差別？為什麼？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>1 分鐘負載 11.8，是核心數的三倍，而且 5 分鐘、15 分鐘的值小很多，代表負載正在快速上升、大量工作在排隊；此刻有 14 個 task 可執行（4 個在跑、約 10 個在等）；總共 902 個 task；最近建立的 PID 是 731455，如果幾秒後再看跳了很多，就是有東西在大量開子行程。下一步看 vmstat 的 r 和 wa，分辨是等 CPU 還是等磁碟。</li>
<li>bob 讀不到：他不是擁有者，但在群組裡，所以只看群組那一組，而群組是 0。carol 讀得到：她兩者都不是，看「其他人」那一組，是 4（r）。核心只挑一組來看，不會因為別組比較寬鬆而放行。</li>
<li>20 GB 約是 20 × 1024 × 1024 KB，除以 16 KB 一個，大約 131 萬個 inode（實際會再少一點，系統本身也用掉一些）。每秒 30 個，一天是 259 萬個，所以不到半天就用完，之後 df -h 明明還有空間，程式卻一直收到 No space left on device。</li>
<li>執行 <code>sudo systemctl edit nginx</code>，寫入 <code>[Service]</code>、<code>LimitNOFILE=65536</code>、<code>MemoryMax=1G</code>，存檔後 systemctl edit 會自動重新讀取 unit 設定；接著 <code>sudo systemctl restart nginx</code>（上限要重新啟動行程才會套用），最後用 <code>systemctl cat nginx</code> 和 <code>grep 'open files' /proc/$(pgrep -o nginx)/limits</code> 確認。</li>
<li><code>sudo find /proc/*/fd -lname '*(deleted)' 2&gt;/dev/null</code> 會列出像 <code>/proc/2211/fd/23</code> 這樣的路徑，用 <code>ls -l</code> 看它指向哪個檔、多大。拿回空間：<code>sudo truncate -s 0 /proc/2211/fd/23</code>，把那個仍開著的檔案截成 0，資料區塊立刻釋放，行程繼續寫也不會出錯。</li>
<li>程式的寫入位置還停在截斷前的地方，例如第 5 GB，所以下一次寫入會從 5 GB 處開始，前面變成一段沒有實際資料的空洞（稀疏檔）。<code>ls -l</code> 看到的大小是 5 GB 多，<code>du</code> 看到的只有真正寫入的那一點點。用附加模式打開的程式，每次寫入都會自動移到檔案結尾，就沒有這個問題。</li>
</ol>
</details>

<h3>十五、想再挖深</h3>
<ul>
<li><b>Brendan Gregg〈The USE Method〉</b>（<a href="https://www.brendangregg.com/usemethod.html">brendangregg.com/usemethod.html</a>）：USE 方法的原文，附了 Linux 上每一格該看哪個指令的完整清單。他的《Systems Performance》第二版把這一章所有的指標都講到底。</li>
<li><b>Linux man pages</b>（<a href="https://man7.org/linux/man-pages/">man7.org</a>）：<code>man 5 proc</code>、<code>man 7 capabilities</code>、<code>man 7 signal</code>，加上核心文件裡的 PSI 說明（<a href="https://docs.kernel.org/accounting/psi.html">docs.kernel.org/accounting/psi.html</a>）。</li>
<li><b>systemd 官方手冊</b>：<code>systemd.service</code>、<code>systemd.exec</code>、<code>systemd.resource-control</code>、<code>journald.conf</code> 這四頁，在 freedesktop.org 上，本章的每個設定都在裡面。</li>
<li><b>Evi Nemeth 等人《UNIX and Linux System Administration Handbook》</b>：系統管理的經典大部頭，權限、日誌、開機、儲存每一章都很紮實。</li>
<li><b>Mozilla〈OpenSSH Security Guidelines〉</b>（<a href="https://infosec.mozilla.org/guidelines/openssh">infosec.mozilla.org/guidelines/openssh</a>）：一份被廣泛引用的 SSH 加固建議，附了設定範例和理由。</li>
</ul>
` });
