DEEP({ 'obs-signals': `
<p>上一課介紹了三種訊號、四個黃金訊號，還有「平均值會騙人」。這一章往下挖：一個請求經過你的系統時，三種訊號各自留下什麼；Prometheus 怎麼抓、怎麼存、怎麼算；百分位數怎麼從直方圖算出來、誤差從哪裡來；為什麼一個標籤就能拖垮監控；日誌和追蹤怎麼串成一條線；最後是 OpenTelemetry 和真正能回答問題的儀表板。看完，你應該能在凌晨三點從一個警報一路追到那一行慢查詢。</p>

<h3><span class="badge lv1">基礎</span>一、同一個請求，留下三種痕跡</h3>
<p>拿一台車來比喻。<b>指標</b>是儀表板：時速、油量、水溫，一眼看出現在正不正常。<b>日誌</b>是行車紀錄器：每一件事發生的那一刻，原原本本記下來。<b>追蹤</b>是 GPS 軌跡：這一趟從哪裡出發、經過哪些路口、每一段花了多久。三樣東西回答三種不同的問題，缺一不可。</p>
<figure class="figure"><svg viewBox="0 0 660 284" class="fg" style="width:100%;max-width:660px" role="img" aria-label="一個請求經過瀏覽器、API 閘道、遊戲服務、資料庫，同時留下指標的計數、一行結構化日誌、一條追蹤的時間軸">
<rect x="20" y="16" width="110" height="40" rx="6" class="fg-b"/><text x="75" y="41" text-anchor="middle" class="fg-t">瀏覽器</text>
<rect x="180" y="16" width="130" height="40" rx="6" class="fg-b"/><text x="245" y="41" text-anchor="middle" class="fg-t">API 閘道</text>
<rect x="360" y="16" width="130" height="40" rx="6" class="fg-b"/><text x="425" y="41" text-anchor="middle" class="fg-t">遊戲服務</text>
<rect x="540" y="16" width="100" height="40" rx="6" class="fg-b"/><text x="590" y="41" text-anchor="middle" class="fg-t">資料庫</text>
<line x1="130" y1="36" x2="172" y2="36" class="fg-l"/><polygon points="180,36 172,31.5 172,40.5" class="fg-a"/>
<line x1="310" y1="36" x2="352" y2="36" class="fg-l"/><polygon points="360,36 352,31.5 352,40.5" class="fg-a"/>
<line x1="490" y1="36" x2="532" y2="36" class="fg-l"/><polygon points="540,36 532,31.5 532,40.5" class="fg-a"/>
<text x="20" y="104" class="fg-t acc">指標</text><text x="20" y="122" class="fg-t sm">加總成數字</text>
<rect x="120" y="80" width="520" height="52" rx="6" class="fg-b hot"/>
<text x="132" y="101" class="fg-t sm mono">http_requests_total{route="/api/round",status="200"} +1</text>
<text x="132" y="120" class="fg-t sm mono">http_request_duration_seconds_bucket{le="0.25"} +1</text>
<text x="20" y="166" class="fg-t alt">日誌</text><text x="20" y="184" class="fg-t sm">一筆一筆事件</text>
<rect x="120" y="142" width="520" height="52" rx="6" class="fg-b alt"/>
<text x="132" y="163" class="fg-t sm mono">{"level":"info","route":"/api/round","status":200,</text>
<text x="132" y="182" class="fg-t sm mono"> "duration_ms":182,"trace_id":"4bf92f35..."}</text>
<text x="20" y="232" class="fg-t warm">追蹤</text><text x="20" y="250" class="fg-t sm">請求走過的路</text>
<rect x="120" y="204" width="520" height="70" rx="6" class="fg-b warm"/>
<rect x="132" y="212" width="470" height="16" rx="3" class="fg-b"/><text x="140" y="224" class="fg-t sm">API 閘道 182 ms</text>
<rect x="152" y="232" width="410" height="16" rx="3" class="fg-b"/><text x="160" y="244" class="fg-t sm">遊戲服務 160 ms</text>
<rect x="200" y="252" width="300" height="16" rx="3" class="fg-b"/><text x="208" y="264" class="fg-t sm">資料庫 120 ms</text>
</svg><figcaption>同一個請求：指標只讓計數器加一（不管請求多少，大小都固定）；日誌留下一行帶欄位的紀錄；追蹤畫出它在每個服務花了多久。日誌和追蹤靠同一個 trace_id 串在一起。</figcaption></figure>
<p>三者的成本結構完全不同，這決定了它們各自怎麼用：</p>
<ul>
<li><b>指標</b>在程式裡先加總好，每秒 10 個請求和每秒 10 萬個請求，存下來的資料量幾乎一樣。便宜，可以保存很久、拿來發警報，但細節都被加總掉了。</li>
<li><b>日誌</b>跟流量成正比，流量翻十倍，帳單就翻十倍。細節最多，但要能搜尋，而且要控制量。</li>
<li><b>追蹤</b>最貴，所以通常只<b>取樣</b>一部分。它是唯一能告訴你「時間花在哪一個服務、哪一段」的訊號。</li>
</ul>
<p>實際查問題的順序幾乎都是：<b>指標告訴你出事了</b>（錯誤率升高）→ <b>追蹤告訴你在哪裡</b>（慢在資料庫那一段）→ <b>日誌告訴你為什麼</b>（那一筆查詢逾時，錯誤訊息是什麼）。</p>

<h3><span class="badge lv1">基礎</span>二、四種指標型別</h3>
<table>
<tr><th>型別</th><th>像什麼</th><th>特性</th><th>例子</th></tr>
<tr><td><b>計數器</b>（counter）</td><td>里程表</td><td>只會往上加；服務重啟才歸零</td><td>請求總數、錯誤總數、送出的位元組</td></tr>
<tr><td><b>儀表</b>（gauge）</td><td>油表</td><td>可上可下，代表「現在」的值</td><td>進行中的請求、佇列長度、記憶體用量</td></tr>
<tr><td><b>直方圖</b>（histogram）</td><td>考試成績分布表</td><td>把每個觀測值丟進對應的區間（bucket）計數</td><td>請求延遲、回應大小</td></tr>
<tr><td><b>摘要</b>（summary）</td><td>老師已經算好的「前 1% 是幾分」</td><td>在程式裡直接算好百分位數</td><td>少用，原因見第六節</td></tr>
</table>
<p>新手最常犯的錯，是用儀表記「請求數」：每次抓取時讀一次「這 15 秒來了幾個」。中間只要漏抓一次，那 15 秒的請求就永遠消失了。計數器只往上加，漏抓一次，下一次的差值還是包含它，所以數字永遠對得起來。用 Node.js 的 prom-client 寫起來是這樣：</p>
<pre><code>import * as client from 'prom-client';

const requests = new client.Counter({
  name: 'http_requests_total', help: 'HTTP requests',
  labelNames: ['route', 'status'],
});
const duration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP latency',
  labelNames: ['route'],
  buckets: [0.05, 0.1, 0.2, 0.3, 0.5, 1, 2.5],
});

// 處理一個請求時
const end = duration.startTimer({ route: '/api/round' });
// ……做事……
end();
requests.inc({ route: '/api/round', status: '200' });</code></pre>
<p>注意 <code>route</code> 填的是路由樣板，不是實際網址。原因在第七節。</p>

<h3><span class="badge lv2">進階</span>三、Prometheus 怎麼抓、怎麼存、怎麼算</h3>
<figure class="figure"><svg viewBox="0 0 660 228" class="fg" style="width:100%;max-width:660px" role="img" aria-label="Prometheus 每 15 秒從各服務拉取 /metrics，存進記憶體中的 head 與 WAL，每兩小時壓成磁碟區塊，再供 Grafana 查詢與 Alertmanager 發警報">
<rect x="20" y="30" width="140" height="36" rx="6" class="fg-b"/><text x="90" y="53" text-anchor="middle" class="fg-t sm">API 服務 /metrics</text>
<rect x="20" y="80" width="140" height="36" rx="6" class="fg-b"/><text x="90" y="103" text-anchor="middle" class="fg-t sm">遊戲服務 /metrics</text>
<rect x="20" y="130" width="140" height="36" rx="6" class="fg-b"/><text x="90" y="153" text-anchor="middle" class="fg-t sm">node-exporter</text>
<line x1="160" y1="48" x2="192" y2="48" class="fg-l alt"/><polygon points="200,48 192,43.5 192,52.5" class="fg-a alt"/>
<line x1="160" y1="98" x2="192" y2="98" class="fg-l alt"/><polygon points="200,98 192,93.5 192,102.5" class="fg-a alt"/>
<line x1="160" y1="148" x2="192" y2="148" class="fg-l alt"/><polygon points="200,148 192,143.5 192,152.5" class="fg-a alt"/>
<text x="176" y="22" text-anchor="middle" class="fg-t sm alt">主動來拉</text>
<rect x="200" y="20" width="210" height="166" rx="8" class="fg-b alt"/>
<text x="305" y="42" text-anchor="middle" class="fg-t lg">Prometheus</text>
<rect x="214" y="54" width="182" height="32" rx="5" class="fg-b"/><text x="305" y="75" text-anchor="middle" class="fg-t sm">抓取：每 15 秒一次</text>
<rect x="214" y="94" width="182" height="32" rx="5" class="fg-b"/><text x="305" y="115" text-anchor="middle" class="fg-t sm">記憶體裡的 head ＋ WAL</text>
<rect x="214" y="134" width="182" height="32" rx="5" class="fg-b"/><text x="305" y="155" text-anchor="middle" class="fg-t sm">每 2 小時壓成磁碟區塊</text>
<rect x="500" y="40" width="140" height="40" rx="6" class="fg-b hot"/><text x="570" y="65" text-anchor="middle" class="fg-t">Grafana 儀表板</text>
<rect x="500" y="126" width="140" height="40" rx="6" class="fg-b warm"/><text x="570" y="151" text-anchor="middle" class="fg-t">Alertmanager</text>
<line x1="410" y1="60" x2="492" y2="60" class="fg-l on"/><polygon points="500,60 492,55.5 492,64.5" class="fg-a on"/>
<text x="455" y="51" text-anchor="middle" class="fg-t sm acc">PromQL 查詢</text>
<line x1="410" y1="146" x2="492" y2="146" class="fg-l warm"/><polygon points="500,146 492,141.5 492,150.5" class="fg-a warm"/>
<text x="455" y="137" text-anchor="middle" class="fg-t sm warm">規則觸發</text>
<text x="330" y="216" text-anchor="middle" class="fg-t sm">每條序列 ＝ 名稱 ＋ 一組標籤；每個樣本 ＝ 時間戳記 ＋ 一個浮點數</text>
</svg><figcaption>Prometheus 是「拉」的：服務只要把數字掛在 /metrics，Prometheus 自己定時來拿。警報規則也在 Prometheus 裡算，Alertmanager 負責去重、分組、通知人。</figcaption></figure>
<p>你的服務在 <code>/metrics</code> 吐出的就是一頁純文字：</p>
<pre><code># TYPE http_requests_total counter
http_requests_total{route="/api/round",status="200"} 10234
http_requests_total{route="/api/round",status="500"} 17
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 940
http_request_duration_seconds_bucket{le="0.25"} 985
http_request_duration_seconds_bucket{le="0.5"} 994
http_request_duration_seconds_bucket{le="1"} 998
http_request_duration_seconds_bucket{le="+Inf"} 1000
http_request_duration_seconds_sum 92.4
http_request_duration_seconds_count 1000</code></pre>
<p>「名稱加上一組標籤值」決定一條<b>時間序列</b>（time series）。上面每一行都是一條不同的序列，每次抓取，就在每條序列後面接一個新的樣本（時間戳記、數值）。剛收到的資料先放在記憶體裡的 head 區塊，同時寫一份預寫日誌（WAL），當機重開才不會掉；大約每兩小時壓縮成一個磁碟上的區塊，之後再合併成更大的區塊。壓縮效果很好，官方文件的說法是平均每個樣本只要 1 到 2 個位元組。預設保留 15 天，要更久就接 Thanos、Mimir 這類長期儲存。</p>
<p>「拉」的好處是 Prometheus 知道誰沒回應：每個目標都有一條自動產生的 <code>up</code> 序列，抓不到就是 0，這本身就是最基本的存活警報。在 Kubernetes 上，Prometheus 透過服務發現自動找到所有 Pod，不用一台一台登記。跑完就結束的批次工作來不及被拉，才改用 Pushgateway 推上去。</p>
<h4>PromQL 的四個基本動作</h4>
<pre><code># 每秒請求數，依路由分開
sum by (route) (rate(http_requests_total[5m]))

# 錯誤率
sum(rate(http_requests_total{status=~"5.."}[5m]))
  / sum(rate(http_requests_total[5m]))

# p99 延遲
histogram_quantile(0.99,
  sum by (le) (
    rate(http_request_duration_seconds_bucket[5m])))

# 300 ms 內完成的比例
sum(rate(
  http_request_duration_seconds_bucket{le="0.3"}[5m]))
  / sum(rate(http_request_duration_seconds_count[5m]))</code></pre>
<p><code>rate()</code> 算的是計數器在時間窗裡「平均每秒長多少」。追一次：10:00:00 是 1000，10:01:00 是 1300，<code>rate(...[1m])</code> 大約是 300 ÷ 60 = 5 個每秒。如果中間服務重啟，數字從 1150 掉回 20，<code>rate()</code> 會把「變小」當成歸零重來，自動接起來，不會算出負數。兩條規則記住：<b>一定先 rate 再 sum</b>，先加總的話，某一台重啟造成的歸零會被當成整體變少；<b>時間窗至少是抓取間隔的 4 倍</b>，漏抓一兩次時才還算得出來。</p>

<h3><span class="badge lv2">進階</span>四、平均值為什麼會騙人：算給你看</h3>
<p>1,000 個請求：940 個花 40 ms，50 個花 200 ms，10 個花 3 秒。平均是 (940 × 40 + 50 × 200 + 10 × 3000) ÷ 1000 = (37,600 + 10,000 + 30,000) ÷ 1000 = <b>77.6 ms</b>。看起來很健康。把所有請求由快到慢排好，畫成下圖：</p>
<figure class="figure"><svg viewBox="0 0 660 262" class="fg" style="width:100%;max-width:660px" role="img" aria-label="把一千個請求由快到慢排好的延遲曲線：p50 是 40 毫秒，p95 和 p99 是 200 毫秒，最後千分之十是 3 秒，平均 77.6 毫秒是一條沒有任何請求落在上面的虛線">
<line x1="80" y1="230" x2="620" y2="230" class="fg-l dim"/><line x1="80" y1="30" x2="80" y2="230" class="fg-l dim"/><line x1="76" y1="163.3" x2="84" y2="163.3" class="fg-l dim"/><line x1="76" y1="96.6" x2="84" y2="96.6" class="fg-l dim"/><line x1="76" y1="30" x2="84" y2="30" class="fg-l dim"/>
<text x="72" y="234" text-anchor="end" class="fg-t sm">10 ms</text><text x="72" y="167" text-anchor="end" class="fg-t sm">100 ms</text><text x="72" y="100" text-anchor="end" class="fg-t sm">1 秒</text><text x="72" y="34" text-anchor="end" class="fg-t sm">10 秒</text>
<polyline points="80,189.8 300,189.8 300,143.2 440,143.2 440,64.8 620,64.8" class="fg-l on"/>
<line x1="80" y1="170.6" x2="620" y2="170.6" class="fg-l warm dash"/>
<text x="612" y="188" text-anchor="end" class="fg-t sm warm">平均 77.6 ms</text>
<circle cx="134" cy="189.8" r="4" class="fg-b hot"/><text x="134" y="210" text-anchor="middle" class="fg-t sm acc">p50 = 40 ms</text>
<circle cx="314" cy="143.2" r="4" class="fg-b hot"/><text x="322" y="162" class="fg-t sm acc">p95 = 200 ms</text>
<circle cx="440" cy="143.2" r="4" class="fg-b hot"/><text x="432" y="134" text-anchor="end" class="fg-t sm acc">p99 = 200 ms</text>
<circle cx="620" cy="64.8" r="4" class="fg-b warm"/><text x="612" y="56" text-anchor="end" class="fg-t sm warm">最慢的 1%：3 秒</text>
<text x="80" y="250" text-anchor="middle" class="fg-t sm">0%</text><text x="134" y="250" text-anchor="middle" class="fg-t sm">50%</text><text x="260" y="250" text-anchor="middle" class="fg-t sm">90%</text><text x="440" y="250" text-anchor="middle" class="fg-t sm">99%</text><text x="620" y="250" text-anchor="middle" class="fg-t sm">99.9%</text>
</svg><figcaption>橫軸是「第幾百分位」，越往右越靠近最慢的那幾個，刻度刻意把尾巴放大；縱軸是延遲（對數刻度）。平均值那條虛線上，一個請求都沒有。</figcaption></figure>
<p>平均 77.6 ms 不是任何人經歷過的時間：九成以上的人只等 40 ms，而每一百個人裡有一個等了整整 3 秒。平均值被那 10 個慢請求拉高了一點，卻完全看不出「有人在等 3 秒」。百分位數直接回答「第幾慢的那個人等多久」，所以 SLO 和警報都用它。</p>
<h4>尾巴比你想的常見</h4>
<p>一個頁面要發 20 個 API 請求，每個請求有 1% 的機率落在最慢那一段。至少踩到一次的機率是 1 − 0.99<sup>20</sup> ≈ 18%；如果是後端一個請求要呼叫 100 個下游，就是 1 − 0.99<sup>100</sup> ≈ 63%。也就是說，<b>單一服務的 p99，往往就是使用者的「一般體驗」</b>。Google 的 Jeff Dean 把這個現象寫成了一篇很有名的文章〈The Tail at Scale〉。</p>
<div class="warn"><b>百分位數不能拿來平均。</b>A 機器的 p99 是 100 ms、B 機器的 p99 是 900 ms，整體的 p99 不是 500 ms，它取決於兩台各有多少流量、分布長什麼樣子。直方圖可以先把各台的區間計數加總，再算整體的百分位數；已經算好的百分位數則沒辦法再合併。</div>

<h3><span class="badge lv3">專業</span>五、直方圖的區間怎麼切，誤差從哪裡來</h3>
<p>Prometheus 的直方圖不存每一個值，只存「≤ 每個邊界的有幾個」。<code>histogram_quantile</code> 要從這些累計數字<b>估</b>出百分位數。拿第三節那組數字算 p99：</p>
<figure class="figure"><svg viewBox="0 0 660 244" class="fg" style="width:100%;max-width:660px" role="img" aria-label="五個累計區間，p99 的第 990 個請求落在 0.25 到 0.5 秒的區間裡，用線性內插估出約 0.389 秒">
<text x="75" y="28" text-anchor="middle" class="fg-t sm mono">le="0.1"</text><text x="197" y="28" text-anchor="middle" class="fg-t sm mono">le="0.25"</text><text x="319" y="28" text-anchor="middle" class="fg-t sm mono">le="0.5"</text><text x="441" y="28" text-anchor="middle" class="fg-t sm mono">le="1"</text><text x="563" y="28" text-anchor="middle" class="fg-t sm mono">le="+Inf"</text>
<rect x="20" y="38" width="110" height="44" rx="6" class="fg-b"/><text x="75" y="66" text-anchor="middle" class="fg-t lg">940</text>
<rect x="142" y="38" width="110" height="44" rx="6" class="fg-b"/><text x="197" y="66" text-anchor="middle" class="fg-t lg">985</text>
<rect x="264" y="38" width="110" height="44" rx="6" class="fg-b hot"/><text x="319" y="66" text-anchor="middle" class="fg-t lg acc">994</text>
<rect x="386" y="38" width="110" height="44" rx="6" class="fg-b"/><text x="441" y="66" text-anchor="middle" class="fg-t lg">998</text>
<rect x="508" y="38" width="110" height="44" rx="6" class="fg-b"/><text x="563" y="66" text-anchor="middle" class="fg-t lg">1000</text>
<text x="330" y="102" text-anchor="middle" class="fg-t sm">第 990 個（1000 × 0.99）大於 985、不大於 994，所以落在 0.25 到 0.5 秒之間</text>
<line x1="264" y1="110" x2="120" y2="150" class="fg-l dim dash"/><line x1="374" y1="110" x2="560" y2="150" class="fg-l dim dash"/>
<rect x="120" y="150" width="440" height="26" rx="4" class="fg-b alt"/>
<line x1="364" y1="144" x2="364" y2="186" class="fg-l warm"/>
<text x="364" y="202" text-anchor="middle" class="fg-t sm warm">p99 ≈ 0.389 秒</text>
<text x="120" y="202" class="fg-t sm">0.25 秒（第 985 個）</text><text x="560" y="202" text-anchor="end" class="fg-t sm">0.5 秒（第 994 個）</text>
<text x="340" y="232" text-anchor="middle" class="fg-t sm">假設區間裡平均分布，真實值可能是 0.25 到 0.5 秒之間的任何一個</text>
</svg><figcaption>內插的算法：(990 − 985) ÷ (994 − 985) = 5／9，0.25 + 0.25 × 5／9 ≈ 0.389 秒。區間越寬，這個估計就越粗。</figcaption></figure>
<p>這個 0.389 秒是「估」出來的。如果那 9 個請求其實全都是 0.26 秒，真正的 p99 就是 0.26 秒，你的儀表板卻顯示 0.39 秒。實務上的切法：</p>
<ul>
<li><b>在你在乎的門檻上放邊界</b>。SLO 是「300 ms 內完成」，就一定要有 <code>le="0.3"</code>，這樣「多少比例在 300 ms 內」是精確的計數，不是估計。</li>
<li><b>在常見值附近切細</b>，兩端放寬。大多數請求在 50 到 300 ms，就在這一段多放幾個邊界。</li>
<li><b>每多一個區間，就多一條時間序列</b>。client 函式庫的預設區間是 0.005 到 10 秒共 11 個，再加上 +Inf、_sum、_count，一組標籤就是 14 條序列，乘上所有標籤組合，成本很快就上去。</li>
</ul>
<p>摘要（summary）在程式裡直接算好百分位數，查詢很便宜，但有兩個硬傷：不能跨機器合併（上一節那個警告），以及事後不能改要看哪個百分位。所以除非只有一台、又確定只看固定的幾個百分位，否則一律用直方圖。較新的 Prometheus 還支援原生直方圖（native histograms），區間依指數自動切分，精度高、序列少；要不要開、怎麼開，看你用的版本的文件。</p>

<h3><span class="badge lv3">專業</span>六、基數：為什麼一個標籤就能拖垮 Prometheus</h3>
<p><b>基數</b>（cardinality）就是一個指標總共有幾條時間序列，等於所有標籤可能值的乘積。來算一個延遲直方圖：</p>
<table>
<tr><th>加上的標籤</th><th>可能值</th><th>序列數</th></tr>
<tr><td>route × method × status</td><td>30 × 4 × 6</td><td>720</td></tr>
<tr><td>× 區間與 _sum、_count</td><td>× 10（第二節的 7 個區間＋+Inf＋2）</td><td>7,200</td></tr>
<tr><td>× service</td><td>× 10</td><td>72,000</td></tr>
<tr><td>× pod（每個服務 20 個）</td><td>× 20</td><td>約 144 萬</td></tr>
<tr><td>× user_id</td><td>× 50,000</td><td>約 720 億：當場爆掉</td></tr>
</table>
<p>每條活躍的序列在記憶體裡都要佔一份索引和緩衝，粗估是幾 KB，幾百萬條就是好幾 GB 的記憶體，查詢也跟著變慢。前四行還在可控範圍，最後一行絕對不行。最常見的三個來源：</p>
<ul>
<li><b>網址直接當標籤</b>：<code>/api/rooms/8812</code> 每個房間一條。要用路由樣板 <code>/api/rooms/:id</code>。</li>
<li><b>使用者 ID、請求 ID、錯誤訊息全文</b>當標籤：值沒有上限。</li>
<li><b>Pod 名稱</b>：每次部署都換新名字，舊序列要等一段時間才會被清掉，頻繁部署時序列數一直往上疊。</li>
</ul>
<p>找兇手的方法：Prometheus 網頁介面的 Status → TSDB Status 會列出序列最多的指標名稱；或用 <code>topk(10, count by (__name__)({__name__=~".+"}))</code> 查（很耗資源，離峰時跑）。高基數的資訊不是不要，而是放到對的地方：使用者 ID 放在日誌和追蹤的欄位裡，指標只留可以列舉的維度。</p>

<h3><span class="badge lv3">專業</span>七、RED 與 USE：每個儀表板先放什麼</h3>
<p>面對一個陌生的系統，不知道要看哪些指標時，有兩套現成的清單。<b>RED</b>（Tom Wilkie 提出）用在「處理請求的服務」，<b>USE</b>（Brendan Gregg 提出）用在「資源」：</p>
<table>
<tr><th>方法</th><th>看什麼</th><th>例子</th></tr>
<tr><td>RED：Rate</td><td>每秒請求數</td><td><code>sum(rate(http_requests_total[5m]))</code></td></tr>
<tr><td>RED：Errors</td><td>失敗的比例</td><td>5xx 佔全部的比例</td></tr>
<tr><td>RED：Duration</td><td>延遲分布</td><td>p50、p99（用直方圖算）</td></tr>
<tr><td>USE：Utilization</td><td>忙碌的比例</td><td>CPU 不是閒置（idle）的時間比例、磁碟忙著做 I/O 的時間比例、連線池使用中的比例</td></tr>
<tr><td>USE：Saturation</td><td>排隊等待的量</td><td>負載平均除以核心數、磁碟佇列、連線池等待數、swap 活動</td></tr>
<tr><td>USE：Errors</td><td>資源層級的錯誤</td><td>網路卡丟包、磁碟錯誤、取得連線逾時</td></tr>
</table>
<p>「飽和度」特別重要，因為它常常比使用率更早示警：連線池用了 60% 看起來沒事，但如果已經有 30 個請求在排隊等連線，延遲很快就會爆。上一課的四個黃金訊號，其實就是 RED 加上飽和度。</p>

<h3><span class="badge lv4">專家</span>八、結構化日誌與關聯 ID</h3>
<p>一行好的日誌，是一個可以依欄位搜尋的 JSON 物件（實際上會寫成一行，這裡排開好讀）：</p>
<pre><code>{
  "time": "2026-11-09T08:15:02.481Z",
  "level": "error",
  "service": "game",
  "msg": "settle round failed",
  "route": "/api/round",
  "status": 500,
  "duration_ms": 2013,
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "user": "u_8f2c",
  "err": "canceling statement due to statement timeout"
}</code></pre>
<p>有了欄位，你可以直接問「過去一小時 <code>route=/api/round</code> 而且 <code>duration_ms &gt; 1000</code> 的錯誤有哪些」，而不是在幾 GB 的純文字裡 grep。關鍵是 <code>trace_id</code>：同一個請求經過的每個服務、每一行日誌都帶著它，一搜就把整條路串起來。</p>
<p>在 Node.js 裡，最乾淨的做法是用 <code>AsyncLocalStorage</code> 把請求的上下文存起來，之後不管 await 了幾層，日誌函式都拿得到，不用一路把 ID 當參數傳：</p>
<pre><code>import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

const ctx = new AsyncLocalStorage&lt;{ requestId: string }&gt;();

app.use((req, res, next) =&gt; {
  const requestId =
    req.get('x-request-id') ?? randomUUID();
  res.set('x-request-id', requestId);
  ctx.run({ requestId }, next);
});

function log(msg: string, fields: object = {}) {
  const requestId = ctx.getStore()?.requestId;
  console.log(
    JSON.stringify({ msg, ...fields, requestId }));
}</code></pre>
<p>實務上會用現成的日誌函式庫：Node.js 常用 pino，Go 從 1.21 起標準函式庫就有 <code>log/slog</code>。幾個專業習慣：級別要有意義（error 代表需要有人處理，不是「有點怪」）；debug 等級在正式環境預設關掉或取樣；不記錄請求本文、密碼、權杖、完整個資，使用者用雜湊或內部 ID；日誌服務多半依「每 GB 收進來」計費，一行沒用的 info 乘上每秒一萬個請求，一個月就是一筆可觀的費用。</p>

<h3><span class="badge lv4">專家</span>九、分散式追蹤：span、上下文傳遞、取樣</h3>
<p>一條追蹤（trace）由很多個 <b>span</b> 組成。每個 span 代表一段工作：名稱、開始時間、長度、自己的 span ID、父 span 的 ID、一些屬性（路由、狀態碼、資料庫語句）。把父子關係排開，就是下面這種瀑布圖：</p>
<figure class="figure"><svg viewBox="0 0 660 262" class="fg" style="width:100%;max-width:660px" role="img" aria-label="一條追蹤的瀑布圖：API 閘道 182 毫秒，裡面驗證權杖 12 毫秒、遊戲服務 162 毫秒；遊戲服務裡 Redis 3 毫秒、PostgreSQL 126 毫秒是慢查詢、送出事件 18 毫秒">
<text x="20" y="22" class="fg-t sm mono">trace 4bf92f35…  GET /api/round</text>
<text x="20" y="58" class="fg-t sm">API 閘道</text>
<rect x="200" y="42" width="400" height="22" rx="4" class="fg-b alt"/><text x="608" y="58" class="fg-t sm">182</text>
<text x="34" y="90" class="fg-t sm">驗證權杖</text>
<rect x="204" y="74" width="26" height="22" rx="4" class="fg-b"/><text x="238" y="90" class="fg-t sm">12</text>
<text x="34" y="122" class="fg-t sm">遊戲服務</text>
<rect x="235" y="106" width="356" height="22" rx="4" class="fg-b alt"/><text x="599" y="122" class="fg-t sm">162</text>
<text x="48" y="154" class="fg-t sm">Redis 讀房間</text>
<rect x="240" y="138" width="7" height="22" rx="2" class="fg-b"/><text x="255" y="154" class="fg-t sm">3</text>
<text x="48" y="186" class="fg-t sm warm">PostgreSQL 更新</text>
<rect x="253" y="170" width="277" height="22" rx="4" class="fg-b warm"/><text x="391" y="186" text-anchor="middle" class="fg-t sm">126：慢在這裡</text>
<text x="48" y="218" class="fg-t sm">送出事件</text>
<rect x="534" y="202" width="40" height="22" rx="4" class="fg-b"/><text x="582" y="218" class="fg-t sm">18</text>
<line x1="200" y1="236" x2="640" y2="236" class="fg-l dim"/>
<text x="200" y="252" text-anchor="middle" class="fg-t sm">0</text><text x="310" y="252" text-anchor="middle" class="fg-t sm">50</text><text x="420" y="252" text-anchor="middle" class="fg-t sm">100</text><text x="530" y="252" text-anchor="middle" class="fg-t sm">150</text><text x="640" y="252" text-anchor="end" class="fg-t sm">200 ms</text>
</svg><figcaption>縮排代表父子關係，長條的位置和長度就是真實的時間。182 ms 裡有 126 ms 在等一個資料庫更新：指標只會告訴你「變慢了」，這張圖直接告訴你「慢在哪裡」。</figcaption></figure>
<h4>上下文傳遞</h4>
<p>服務 A 呼叫服務 B 時，要把「我們屬於哪一條 trace、我是哪個 span」帶過去，B 建立的 span 才能接在正確的父親底下。業界標準是 W3C Trace Context 的 <code>traceparent</code> 標頭：</p>
<pre><code>traceparent:
00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01</code></pre>
<p>四段分別是版本、16 位元組的 trace ID、8 位元組的父 span ID，以及旗標（01 表示「這條要取樣」）。只要有一個環節沒有傳下去，例如某個服務自己 new 了一個 HTTP 用戶端、沒有被自動埋點，或訊息丟進佇列時沒把標頭放進訊息屬性，追蹤就會斷成兩截，後半段變成一條找不到爸爸的孤兒 trace。</p>
<h4>取樣</h4>
<ul>
<li><b>頭部取樣</b>（head-based sampling）：在請求一進來的第一個服務就決定要不要記，例如 10%，決定結果用旗標往下傳，整條 trace 要嘛全記、要嘛全不記。便宜簡單，缺點是決定時還不知道這個請求會不會出錯，罕見的錯誤很可能剛好沒被記到。</li>
<li><b>尾部取樣</b>（tail-based sampling）：先把所有 span 收到 Collector，等整條 trace 結束（例如等 10 秒），再依結果決定：錯誤全留、超過 1 秒全留、其他只留 5%。最有價值，但 Collector 要把資料暫存在記憶體，而且同一條 trace 的所有 span 必須送到同一台 Collector 才能一起判斷。</li>
</ul>

<h3><span class="badge lv4">專家</span>十、OpenTelemetry，以及會回答問題的儀表板</h3>
<p><b>OpenTelemetry</b>（簡稱 OTel）把三種訊號的「產生」標準化：程式碼只依賴 OTel 的 API，資料用 OTLP 協定送出，後端要換成哪一家，改設定就好，不用改程式。</p>
<figure class="figure"><svg viewBox="0 0 660 214" class="fg" style="width:100%;max-width:660px" role="img" aria-label="服務裡的 OpenTelemetry API 與 SDK 用 OTLP 把資料送到 Collector，Collector 接收、處理後匯出到指標、追蹤、日誌三個後端">
<rect x="20" y="20" width="180" height="170" rx="8" class="fg-b"/>
<text x="110" y="44" text-anchor="middle" class="fg-t lg">你的服務</text>
<rect x="34" y="58" width="152" height="34" rx="5" class="fg-b"/><text x="110" y="80" text-anchor="middle" class="fg-t sm">自動埋點：HTTP、DB</text>
<rect x="34" y="100" width="152" height="34" rx="5" class="fg-b"/><text x="110" y="122" text-anchor="middle" class="fg-t sm">OTel API：手動加 span</text>
<rect x="34" y="142" width="152" height="34" rx="5" class="fg-b alt"/><text x="110" y="164" text-anchor="middle" class="fg-t sm">OTel SDK：取樣、批次</text>
<line x1="200" y1="105" x2="242" y2="105" class="fg-l alt"/><polygon points="250,105 242,100.5 242,109.5" class="fg-a alt"/>
<text x="225" y="96" text-anchor="middle" class="fg-t sm alt">OTLP</text>
<rect x="250" y="20" width="180" height="170" rx="8" class="fg-b alt"/>
<text x="340" y="44" text-anchor="middle" class="fg-t lg">Collector</text>
<rect x="264" y="58" width="152" height="34" rx="5" class="fg-b"/><text x="340" y="80" text-anchor="middle" class="fg-t sm">接收 receivers</text>
<rect x="264" y="100" width="152" height="34" rx="5" class="fg-b"/><text x="340" y="122" text-anchor="middle" class="fg-t sm">處理 processors</text>
<rect x="264" y="142" width="152" height="34" rx="5" class="fg-b"/><text x="340" y="164" text-anchor="middle" class="fg-t sm">匯出 exporters</text>
<rect x="500" y="30" width="140" height="38" rx="6" class="fg-b hot"/><text x="570" y="54" text-anchor="middle" class="fg-t sm">指標：Prometheus</text>
<rect x="500" y="86" width="140" height="38" rx="6" class="fg-b warm"/><text x="570" y="110" text-anchor="middle" class="fg-t sm">追蹤：Tempo</text>
<rect x="500" y="142" width="140" height="38" rx="6" class="fg-b"/><text x="570" y="166" text-anchor="middle" class="fg-t sm">日誌：Loki</text>
<line x1="430" y1="105" x2="466" y2="105" class="fg-l"/>
<path d="M466 49 V161" class="fg-l"/>
<line x1="466" y1="49" x2="492" y2="49" class="fg-l"/><polygon points="500,49 492,44.5 492,53.5" class="fg-a"/>
<line x1="466" y1="105" x2="492" y2="105" class="fg-l"/><polygon points="500,105 492,100.5 492,109.5" class="fg-a"/>
<line x1="466" y1="161" x2="492" y2="161" class="fg-l"/><polygon points="500,161 492,156.5 492,165.5" class="fg-a"/>
</svg><figcaption>Collector 是中間的轉運站：在這裡做尾部取樣、刪掉敏感欄位、補上環境標籤，再分送到各個後端。右邊三個只是例子，換成任何支援 OTLP 的服務都可以。</figcaption></figure>
<p>在 Node.js 上，零程式碼就能開始：</p>
<pre><code>export OTEL_SERVICE_NAME=game-api
export OTEL_EXPORTER_OTLP_ENDPOINT=http://collector:4318
node --require \\
  @opentelemetry/auto-instrumentations-node/register \\
  dist/server.js</code></pre>
<p>自動埋點會替 HTTP 伺服器與用戶端、常見的資料庫驅動程式自動建立 span、傳遞 <code>traceparent</code>。屬性名稱照著 OTel 的語意慣例（semantic conventions）走，例如 <code>http.request.method</code>、<code>http.response.status_code</code>、<code>http.route</code>，這樣不同語言、不同團隊的資料，查詢方式都一樣。4318 是 OTLP over HTTP 的預設連接埠，gRPC 是 4317。</p>
<h4>會回答問題的儀表板</h4>
<p>壞的儀表板是五十個圖塊，每個都在動，沒有人知道該看哪一個。好的儀表板由上往下回答三個問題：</p>
<ol>
<li><b>使用者現在好不好？</b>最上面一排：每條關鍵流程的成功率、p99 延遲、流量，旁邊畫上 SLO 門檻。</li>
<li><b>是哪個服務？</b>中間：每個服務的 RED，同樣的時間範圍、同樣的排列方式，一眼就看出哪一個不一樣。</li>
<li><b>為什麼？</b>下面：USE 資源、相依服務、佇列長度，以及連到追蹤和日誌的連結。</li>
</ol>
<p>幾個細節：每個圖塊的標題寫成問題（不要只寫「API 延遲」，要寫「開局 API 變慢了嗎？」）；延遲畫百分位數或熱度圖，不畫平均；單位一定要標；把每次上版標成註記（annotation），一半的事故都跟最近一次上版對得起來。</p>

<h3>十一、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>請求數用儀表記就好</td><td>漏抓一次就永遠少算。累加的量一律用計數器，再用 <code>rate()</code> 算速率。</td></tr>
<tr><td>可以把各台機器的 p99 平均起來</td><td>百分位數不能平均。要把直方圖的區間計數加總，再算整體的百分位數。</td></tr>
<tr><td>histogram_quantile 算出來的是準確值</td><td>它是區間內線性內插的估計，誤差最大可達一整個區間寬。重要的門檻要放成區間邊界。</td></tr>
<tr><td>標籤越多，分析越細越好</td><td>序列數是所有標籤值的乘積。沒有上限的值會讓 Prometheus 記憶體爆掉。</td></tr>
<tr><td>日誌越多越安全</td><td>沒用的日誌會淹沒有用的、拖慢搜尋、增加費用，還可能把個資留在不該留的地方。</td></tr>
<tr><td>有了追蹤就不需要指標</td><td>追蹤通常有取樣，算不出準確的比例和總量；警報要靠指標。</td></tr>
</table>

<h3>十二、跟你的工作連起來</h3>
<ul>
<li><b>Node.js／TypeScript 後端</b>：用 prom-client 暴露 <code>/metrics</code>，它也內建 Node 執行環境的指標（事件迴圈延遲、垃圾回收、記憶體）。事件迴圈延遲變大，通常代表有同步的重活卡住了全部人。</li>
<li><b>Go 後端</b>：官方的 <code>client_golang</code> 加上 <code>log/slog</code> 輸出 JSON；context 本來就一路往下傳，把 trace ID 放進去很自然。</li>
<li><b>Vue 前端與網頁遊戲</b>：伺服器量不到使用者真正的體驗。用 Web Vitals、資源載入時間、前端錯誤回報（例如 Sentry）收集真實使用者監測（RUM）資料；前端呼叫 API 時帶上 <code>traceparent</code>，就能把一次點擊和後端的追蹤接起來。</li>
<li><b>Cocos／Unity 遊戲</b>：在用戶端記錄每局的載入時間、幀率分布（看 p95 的單幀時間，不是平均 FPS）、斷線次數，批次送回伺服器。這些就是遊戲的 SLI。</li>
<li><b>Docker 與雲端主機</b>：容器的日誌一律寫到 stdout，讓平台收走；node-exporter 和 cAdvisor 提供主機與容器的 USE 指標。</li>
</ul>

<h3>十三、面試會怎麼問</h3>
<ol>
<li>「計數器、儀表、直方圖、摘要差在哪？各舉一個例子。」</li>
<li>「為什麼看 p99 而不是平均？可以把十台機器的 p99 平均起來嗎？」</li>
<li>「什麼是基數爆炸？你會怎麼發現、怎麼修？」</li>
<li>「使用者回報 API 變慢。你會怎麼用指標、追蹤、日誌一路查到原因？」</li>
<li>「頭部取樣和尾部取樣差在哪？各適合什麼情況？」</li>
<li>「RED 和 USE 是什麼？分別用在哪裡？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>計數器只增不減（重啟歸零），用來記累計量，例如請求總數，查詢時用 rate；儀表是可上可下的瞬間值，例如進行中的請求、記憶體用量；直方圖把觀測值放進預先定義的區間計數，例如延遲，可以跨機器加總後算百分位數；摘要在用戶端直接算好百分位數，查詢便宜，但不能跨機器合併、事後不能改百分位，所以大多數情況選直方圖。</li>
<li>平均值會被大量快速請求稀釋，看不出少數非常慢的請求，而使用者的一次操作往往會碰到很多請求，尾端延遲出現的機率很高。百分位數不能平均，因為整體分布取決於各台的流量和形狀；正確做法是把各台直方圖的區間計數加總，再用 histogram_quantile 算整體的 p99。</li>
<li>指標的序列數是所有標籤值組合的乘積，如果標籤放了使用者 ID、完整網址、請求 ID 這種沒有上限的值，序列數暴增，Prometheus 記憶體與查詢都撐不住。發現：看 TSDB Status 頁或用 count by (__name__) 找序列最多的指標、監控 prometheus_tsdb_head_series。修法：改用路由樣板、把狀態碼分組、移除高基數標籤，把那些資訊改放到日誌或追蹤；必要時用 relabel 規則在抓取時丟掉。</li>
<li>先看 RED 儀表板確認範圍：哪條路由、從什麼時候開始、錯誤率有沒有一起升、是不是跟某次上版同時。接著從那個時間段挑幾條慢的追蹤，看瀑布圖找出時間花在哪個 span，例如某個資料庫查詢。再用那條 trace 的 ID 搜尋日誌，看錯誤訊息、參數、逾時細節。最後用 USE 看那個資源（資料庫 CPU、連線池等待、磁碟佇列）確認根因。</li>
<li>頭部取樣在請求開始時就決定要不要記錄，並把決定往下傳，成本低、實作簡單，但會錯過罕見的錯誤和慢請求；尾部取樣在整條 trace 完成後依結果決定，能保留所有錯誤和慢請求，但需要 Collector 暫存資料、記憶體成本高，而且同一條 trace 的 span 必須送到同一台 Collector。常見做法是兩者並用。</li>
<li>RED（Rate、Errors、Duration）用在處理請求的服務，看使用者感受得到的速率、錯誤和延遲；USE（Utilization、Saturation、Errors）用在 CPU、記憶體、磁碟、網路、連線池這類資源，找出瓶頸。查問題時通常先用 RED 定位哪個服務，再用 USE 找是哪個資源。</li>
</ol>
</details>

<h3>十四、練功題（做得出來才算真的懂）</h3>
<ol>
<li>100 個請求：90 個 20 ms、9 個 100 ms、1 個 2 秒。算出平均、p50、p90、p99。</li>
<li>直方圖的累計數字是：<code>le="0.1"</code> 800、<code>le="0.2"</code> 950、<code>le="0.5"</code> 990、<code>le="+Inf"</code> 1000。用線性內插估計 p95 和 p99。</li>
<li>一個指標有標籤 route（40 種）、status（5 種）、region（3 種）。同事想加上 <code>player_id</code>（同時在線約 2 萬人）。算出加之前、加之後的序列數，並提出替代做法。</li>
<li>寫出 PromQL：每條路由過去 5 分鐘的錯誤率（5xx 比例），只列出超過 1% 的路由。</li>
<li>打開你自己任何一個服務的日誌，挑一行錯誤，看它能不能回答：哪個請求？哪個使用者（用內部 ID）？花了多久？跟哪條追蹤有關？缺了哪幾項，就是你下一個要補的欄位。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>平均 = (90 × 20 + 9 × 100 + 1 × 2000) ÷ 100 = (1800 + 900 + 2000) ÷ 100 = 47 ms。排序後 p50 是第 50 個 = 20 ms；p90 是第 90 個 = 20 ms；p99 是第 99 個 = 100 ms；只有最慢的那 1 個是 2 秒。平均 47 ms 比 99% 的請求都慢，又遠小於最慢的那一個。</li>
<li>p95：第 950 個，剛好是 <code>le="0.2"</code> 的上緣，約 0.2 秒。p99：第 990 個，剛好是 <code>le="0.5"</code> 的上緣，約 0.5 秒；真實值可能在 0.2 到 0.5 秒之間任何地方，這就是區間太寬的代價。如果 SLO 門檻是 300 ms，應該加一個 <code>le="0.3"</code>。</li>
<li>加之前 40 × 5 × 3 = 600 條；加之後 600 × 20,000 = 1,200 萬條，而且玩家一直換人，舊序列還沒清掉新的又來，實際更多。替代做法：玩家 ID 放在日誌和追蹤的屬性裡；指標只用可列舉的維度，例如玩家等級分組或付費與否。</li>
<li><code>sum by (route) (rate(http_requests_total{status=~"5.."}[5m])) / sum by (route) (rate(http_requests_total[5m])) &gt; 0.01</code>。分子分母都要 by (route)，兩邊的標籤才對得上。</li>
<li>沒有標準答案。常見缺的是 trace ID（日誌和追蹤串不起來）和 duration（看不出慢）。補上之後，下一次查問題的時間通常能從小時縮短到分鐘。</li>
</ol>
</details>

<h3>十五、想再挖深</h3>
<ul>
<li><b>Prometheus 官方文件</b>（<a href="https://prometheus.io/docs/">prometheus.io/docs</a>）：特別是〈Histograms and summaries〉和命名慣例那兩篇，第五、六節的權威來源。</li>
<li><b>Google《Site Reliability Engineering》第 6 章〈Monitoring Distributed Systems〉</b>（<a href="https://sre.google/books/">sre.google/books</a>，免費線上閱讀）：四個黃金訊號的出處。</li>
<li><b>Brendan Gregg 的 USE Method</b>（<a href="https://www.brendangregg.com/usemethod.html">brendangregg.com</a>）：作者本人整理的完整檢查清單，Linux 每種資源要看哪個指令都列好了。</li>
<li><b>OpenTelemetry 官方文件</b>（<a href="https://opentelemetry.io/docs/">opentelemetry.io/docs</a>）：各語言的入門、Collector 設定、語意慣例。</li>
<li><b>Jeffrey Dean 與 Luiz André Barroso〈The Tail at Scale〉</b>（Communications of the ACM，2013）：為什麼大規模系統裡尾端延遲是頭號問題，以及對付它的技巧。</li>
</ul>
` });
