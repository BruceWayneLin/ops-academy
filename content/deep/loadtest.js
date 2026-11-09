DEEP({ 'loadtest': `
<p>上一課的做法是：寫腳本、一階一階加壓、看延遲在哪裡彎上去。這一章往下拆：壓測工具「怎麼送請求」本身就可能騙你；一條三個字母的公式，能算出要開幾條連線；延遲曲線為什麼有一個轉折點，過了它為什麼幾乎是垂直往上；為什麼很多壓測報告上漂亮的 p99 是假的；找到瓶頸之後，怎麼換算成要準備幾台機器；最後是系統撐不住的時候，怎麼壞得溫和：卸載、允入控制、限流。這些就是「我有跑過壓測」和「我知道這個系統撐得住多少、撐不住時會怎樣」之間的差別。</p>

<h3><span class="badge lv1">基礎</span>一、負載長什麼樣子：熟客和路人</h3>
<p>想像一家早餐店，有兩種客人：</p>
<ul>
<li><b>熟客</b>：固定 20 個人，每個人點餐、等餐、吃完、休息一下，再點下一份。出餐一慢，他們的下一份也跟著晚點，整家店的點單速度會自動降下來。</li>
<li><b>路人</b>：從馬路上走進來，平均每分鐘 10 個。不管店裡多忙，他們照樣進來排隊。出餐一慢，隊伍就越排越長。</li>
</ul>
<p>壓測工具也有這兩種模型。熟客叫<b>封閉模型</b>（closed model）：固定數量的虛擬使用者（virtual user，VU），每個都「送出請求、等回應、想一下、再送下一個」。路人叫<b>開放模型</b>（open model）：請求照固定的到達速率（arrival rate）送進來，不管前一個回來了沒有。</p>
<figure class="figure"><svg viewBox="0 0 660 244" class="fg" style="width:100%;max-width:660px" role="img" aria-label="左邊是封閉模型：N 個虛擬使用者送請求、等回應、思考後再送，伺服器變慢就送得更少；右邊是開放模型：請求以固定速率到達、進入佇列再到伺服器，伺服器變慢佇列就變長">
<rect x="10" y="10" width="310" height="224" rx="10" class="fg-b"/>
<text x="165" y="36" text-anchor="middle" class="fg-t lg">封閉模型（熟客）</text>
<text x="165" y="56" text-anchor="middle" class="fg-t sm">固定 N 個使用者輪流送</text>
<rect x="30" y="86" width="110" height="60" rx="6" class="fg-b alt"/>
<text x="85" y="112" text-anchor="middle" class="fg-t">N 個使用者</text>
<text x="85" y="132" text-anchor="middle" class="fg-t sm">虛擬使用者</text>
<rect x="210" y="86" width="90" height="60" rx="6" class="fg-b"/>
<text x="255" y="121" text-anchor="middle" class="fg-t">伺服器</text>
<line x1="140" y1="100" x2="202" y2="100" class="fg-l"/><polygon points="210,100 202,95.5 202,104.5" class="fg-a"/>
<text x="175" y="93" text-anchor="middle" class="fg-t sm">請求</text>
<line x1="210" y1="132" x2="148" y2="132" class="fg-l"/><polygon points="140,132 148,127.5 148,136.5" class="fg-a"/>
<text x="175" y="125" text-anchor="middle" class="fg-t sm">回應 R</text>
<path d="M65 146 V174 H105 V154" class="fg-l dash"/><polygon points="105,146 100.5,154 109.5,154" class="fg-a"/>
<text x="116" y="172" class="fg-t sm">思考 Z 秒，再送下一個</text>
<text x="165" y="196" text-anchor="middle" class="fg-t sm">k6：虛擬使用者＋stages</text>
<text x="165" y="218" text-anchor="middle" class="fg-t sm warm">伺服器變慢 → 送出的請求變少</text>
<rect x="340" y="10" width="310" height="224" rx="10" class="fg-b"/>
<text x="495" y="36" text-anchor="middle" class="fg-t lg">開放模型（路人）</text>
<text x="495" y="56" text-anchor="middle" class="fg-t sm">照固定速率不停進來</text>
<circle cx="364" cy="116" r="6" class="fg-lamp on"/><circle cx="384" cy="116" r="6" class="fg-lamp on"/><circle cx="404" cy="116" r="6" class="fg-lamp on"/>
<text x="384" y="96" text-anchor="middle" class="fg-t sm">每秒 λ 個</text>
<line x1="414" y1="116" x2="432" y2="116" class="fg-l"/><polygon points="440,116 432,111.5 432,120.5" class="fg-a"/>
<rect x="440" y="96" width="94" height="40" rx="6" class="fg-b"/>
<rect x="447" y="104" width="16" height="24" rx="3" class="fg-b warm"/><rect x="468" y="104" width="16" height="24" rx="3" class="fg-b warm"/><rect x="489" y="104" width="16" height="24" rx="3" class="fg-b warm"/><rect x="510" y="104" width="16" height="24" rx="3" class="fg-b warm"/>
<text x="487" y="154" text-anchor="middle" class="fg-t sm">佇列</text>
<line x1="534" y1="116" x2="552" y2="116" class="fg-l"/><polygon points="560,116 552,111.5 552,120.5" class="fg-a"/>
<rect x="560" y="86" width="76" height="60" rx="6" class="fg-b"/>
<text x="598" y="121" text-anchor="middle" class="fg-t">伺服器</text>
<text x="495" y="196" text-anchor="middle" class="fg-t sm">k6：arrival-rate 執行器</text>
<text x="495" y="218" text-anchor="middle" class="fg-t sm warm">伺服器變慢 → 佇列越排越長</text>
</svg><figcaption>封閉模型裡，系統一慢，工具就自動少送，壓力跟著減輕；開放模型裡，請求照樣進來，系統變慢的後果完整地表現在排隊上。</figcaption></figure>
<p>差別出在系統變慢的時候。封閉模型裡，每個虛擬使用者每一輪花的時間是「回應時間 R＋思考時間 Z」，所以每秒送出的請求數是：</p>
<pre><code>吞吐量 = 使用者數 N ÷ (R + Z)</code></pre>
<p>200 個虛擬使用者、思考 1 秒、回應 0.1 秒：200 ÷ 1.1 ≈ 每秒 182 個請求。伺服器變慢，回應變成 1 秒：200 ÷ 2 = 每秒 100 個。<b>伺服器越慢，工具送得越少</b>，壓力自動減輕，問題就被藏起來了。真實的網站比較像開放模型：新的使用者不知道你的伺服器在慢，照樣一直進來，等太久的人還會按重新整理。</p>
<p>所以規則是：面對大量互不相干的使用者（網站、公開 API），用開放模型測；面對固定一群連線的系統（例如公司內部工具），封閉模型才貼近現實。k6 兩種都有：上一課的 <code>stages</code> 加虛擬使用者是封閉模型，<code>constant-arrival-rate</code> 和 <code>ramping-arrival-rate</code> 這兩種執行器（executor）是開放模型。</p>
<h4>思考時間要像人</h4>
<p>真人會停下來看畫面。思考時間（think time）太短，同樣 200 個虛擬使用者會產生遠超過真實的流量；完全沒有思考時間，就是一個不會累的機器人在狂按。還有一個細節：思考時間要隨機，例如 0.5 到 3 秒之間亂數。如果每個虛擬使用者都剛好停 1 秒，它們會慢慢「對齊」，變成每秒一波整齊的突波，那是現實裡不會有的形狀。</p>

<h3><span class="badge lv1">基礎</span>二、利特爾定律：一條公式算出要開幾條連線</h3>
<p>排隊理論裡最好用的一條公式，叫<b>利特爾定律</b>（Little's law）：</p>
<pre><code>L = λ × W
系統裡平均有幾個 = 每秒進來幾個 × 每個平均待多久</code></pre>
<p>超商的例子：每分鐘進來 2 個客人，每人平均在店裡待 5 分鐘，店裡平均就有 10 個人。它厲害的地方是不挑到達的分佈、不挑排隊規則，只要系統長期穩定（進來的跟出去的一樣多）就成立。放到伺服器上，三個方向都能用：</p>
<table>
<tr><th>已知</th><th>算出</th><th>例子</th></tr>
<tr><td>流量、延遲</td><td>同時處理中的請求數</td><td>每秒 500 個 × 0.2 秒 = 平均 100 個同時在處理。執行緒、連線至少要這麼多</td></tr>
<tr><td>查詢頻率、每次查詢時間</td><td>資料庫連線池要多大</td><td>每秒 2,000 次查詢 × 5 毫秒 = 平均 10 條連線在忙。開 20 條就有餘裕，開 200 條沒有意義</td></tr>
<tr><td>同時處理數、流量</td><td>平均延遲</td><td>監控顯示同時有 300 個請求在處理、每秒 1,000 個 → 平均每個要 0.3 秒</td></tr>
</table>
<p>它也解釋了一個常見的災難：<b>延遲一變長，系統裡同時存在的請求就變多</b>。同樣每秒 500 個，延遲從 0.2 秒變成 2 秒，同時處理中的請求就從 100 個變成 1,000 個，執行緒、連線、記憶體全部跟著翻十倍。一個變慢的下游服務，能把上游整個拖垮，就是這個原因。</p>

<h3><span class="badge lv2">進階</span>三、設計像真的情境</h3>
<p>一個只打 <code>GET /api/lobby</code> 的腳本，量到的是「大廳 API 在快取全中的時候有多快」。真實流量是很多種請求混在一起的，情境設計要回答四個問題：</p>
<ol>
<li><b>比例</b>：從正式環境的存取日誌，算出各種請求的比例。例如猜高低遊戲：大廳 50%、開一局和猜 30%、排行榜 12%、登入 5%、其他 3%。</li>
<li><b>資料</b>：每個虛擬使用者用不同的帳號、不同的參數。所有人都查同一筆資料，快取命中率就是 100%，正式環境不會這樣。資料庫的資料量也要接近真實。</li>
<li><b>先後關係</b>：先登入拿到 token，後面的請求帶著它；開了一局才能猜。這些都要寫進腳本。</li>
<li><b>外部依賴</b>：金流、簡訊、第三方登入不是你的系統，不能拿去壓。用一個假的服務（stub）頂替，並模擬它真實的延遲。</li>
</ol>
<p>用 k6 寫一個開放模型、按比例混合的情境（為了簡短，省略了登入）：</p>
<pre><code>import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    players: {
      executor: 'ramping-arrival-rate',
      startRate: 50,
      timeUnit: '1s',
      preAllocatedVUs: 200,
      maxVUs: 2000,
      stages: [
        { target: 200, duration: '5m' },
        { target: 200, duration: '10m' },
        { target: 400, duration: '5m' },
        { target: 400, duration: '10m' },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(99)&lt;800'],
    http_req_failed: ['rate&lt;0.01'],
  },
};

const BASE = 'http://staging.internal:8080';
const hdr = {
  headers: { 'Content-Type': 'application/json' },
};

export default function () {
  const r = Math.random();
  if (r &lt; 0.5) {
    http.get(BASE + '/api/lobby');
  } else if (r &lt; 0.8) {
    const guess = Math.random() &lt; 0.5 ? 'higher' : 'lower';
    const body = JSON.stringify({ guess });
    const res = http.post(BASE + '/api/round', body, hdr);
    check(res, { 'round ok': (x) =&gt; x.status === 200 });
  } else {
    http.get(BASE + '/api/leaderboard');
  }
}</code></pre>
<p>兩件事要注意。第一，開放模型裡，<code>default</code> 函式每被呼叫一次就是一個「到達」，不用再 <code>sleep</code>。第二，如果結果裡出現 <code>dropped_iterations</code>，代表準備好的虛擬使用者不夠用，k6 沒辦法照你要的速率送。這時量到的數字不可信，要調高 <code>maxVUs</code>，或換一台更強的壓測機。</p>
<h4>壓測機自己也會是瓶頸</h4>
<p>壓測機的 CPU 吃滿、檔案描述符到上限、連接埠用完，都會讓「伺服器變慢」其實是「壓測機變慢」。連接埠這件事很常見：Linux 預設的暫時連接埠（ephemeral port）大約兩萬八千個，每條關掉的連線還會在 TIME_WAIT 狀態佔著連接埠 60 秒。對同一個目標一直開新連線，28,000 ÷ 60 ≈ 每秒 470 條就到頂了。所以壓測要用 keep-alive 重複使用連線，並且同時監控壓測機，它的 CPU 最好保持在一半上下。</p>

<h3><span class="badge lv2">進階</span>四、加壓的形狀與轉折點</h3>
<p>加壓的形狀，決定你看得到什麼。上一課的四種測試，畫成「負載對時間」是這樣：</p>
<figure class="figure"><svg viewBox="0 0 660 190" class="fg" style="width:100%;max-width:660px" role="img" aria-label="四種加壓形狀：階梯加壓一階一階往上；負載測試爬到尖峰後維持；突波測試瞬間跳到十倍再回落；浸泡測試以中等負載維持數小時">
<line x1="22" y1="30" x2="22" y2="120" class="fg-l dim"/><line x1="22" y1="120" x2="150" y2="120" class="fg-l dim"/>
<polyline points="22,120 22,104 52,104 52,84 82,84 82,64 112,64 112,44 145,44" class="fg-l on"/>
<line x1="187" y1="30" x2="187" y2="120" class="fg-l dim"/><line x1="187" y1="120" x2="315" y2="120" class="fg-l dim"/>
<polyline points="187,120 215,52 285,52 305,120" class="fg-l on"/>
<line x1="352" y1="30" x2="352" y2="120" class="fg-l dim"/><line x1="352" y1="120" x2="480" y2="120" class="fg-l dim"/>
<polyline points="352,108 398,108 400,36 428,36 430,108 476,108" class="fg-l warm"/>
<line x1="517" y1="30" x2="517" y2="120" class="fg-l dim"/><line x1="517" y1="120" x2="645" y2="120" class="fg-l dim"/>
<polyline points="517,120 532,84 642,84" class="fg-l alt"/>
<text x="587" y="74" text-anchor="middle" class="fg-t sm">好幾個小時</text>
<text x="84" y="150" text-anchor="middle" class="fg-t">階梯加壓</text><text x="84" y="170" text-anchor="middle" class="fg-t sm">每階停 5～10 分鐘</text>
<text x="249" y="150" text-anchor="middle" class="fg-t">負載測試</text><text x="249" y="170" text-anchor="middle" class="fg-t sm">爬到尖峰、維持住</text>
<text x="414" y="150" text-anchor="middle" class="fg-t">突波測試</text><text x="414" y="170" text-anchor="middle" class="fg-t sm">瞬間跳到 10 倍</text>
<text x="579" y="150" text-anchor="middle" class="fg-t">浸泡測試</text><text x="579" y="170" text-anchor="middle" class="fg-t sm">中等負載跑很久</text>
</svg><figcaption>橫軸是時間，縱軸是負載。找容量用階梯加壓；確認撐得過尖峰用負載測試；看擴展來不來得及用突波；抓慢慢漏的問題用浸泡。</figcaption></figure>
<p>階梯加壓是找容量的主力。每一階要停夠久，至少 5 到 10 分鐘：讓快取熱起來、讓自動擴展有機會反應、讓垃圾回收進入穩定狀態。每一階記下送出的速率、實際完成的速率、p50 和 p99 延遲、錯誤率，以及每個資源的使用率。一份示意的結果：</p>
<table>
<tr><th>送出（個／秒）</th><th>完成（個／秒）</th><th>p50</th><th>p99</th><th>錯誤率</th></tr>
<tr><td>100</td><td>100</td><td>22 ms</td><td>45 ms</td><td>0%</td></tr>
<tr><td>200</td><td>200</td><td>23 ms</td><td>52 ms</td><td>0%</td></tr>
<tr><td>300</td><td>300</td><td>26 ms</td><td>70 ms</td><td>0%</td></tr>
<tr><td>400</td><td>398</td><td>38 ms</td><td>160 ms</td><td>0%</td></tr>
<tr><td>450</td><td>441</td><td>90 ms</td><td>900 ms</td><td>0.3%</td></tr>
<tr><td>500</td><td>452</td><td>1,800 ms</td><td>5,000 ms</td><td>6%</td></tr>
</table>
<figure class="figure"><svg viewBox="0 0 640 264" class="fg" style="width:100%;max-width:640px" role="img" aria-label="p99 延遲對送出負載的曲線：300 以前幾乎是平的，400 開始彎，450 衝到 900 毫秒，500 超出圖外；轉折點約 400，規劃上限約 280">
<line x1="80" y1="30" x2="80" y2="220" class="fg-l"/><line x1="80" y1="220" x2="600" y2="220" class="fg-l"/>
<text x="86" y="24" class="fg-t sm">p99 延遲</text>
<text x="72" y="224" text-anchor="end" class="fg-t sm">0</text><text x="72" y="134" text-anchor="end" class="fg-t sm">500 ms</text><text x="72" y="44" text-anchor="end" class="fg-t sm">1,000 ms</text>
<line x1="80" y1="130" x2="600" y2="130" class="fg-l dim dash"/><line x1="80" y1="40" x2="600" y2="40" class="fg-l dim dash"/>
<text x="180" y="238" text-anchor="middle" class="fg-t sm">100</text><text x="280" y="238" text-anchor="middle" class="fg-t sm">200</text><text x="380" y="238" text-anchor="middle" class="fg-t sm">300</text><text x="480" y="238" text-anchor="middle" class="fg-t sm">400</text><text x="580" y="238" text-anchor="middle" class="fg-t sm">500</text>
<text x="340" y="258" text-anchor="middle" class="fg-t sm">送出的負載（個請求／秒）</text>
<line x1="360" y1="48" x2="360" y2="220" class="fg-l on dash"/>
<text x="354" y="66" text-anchor="end" class="fg-t sm acc">規劃上限（約 280）</text>
<line x1="480" y1="48" x2="480" y2="220" class="fg-l warm dash"/>
<text x="474" y="110" text-anchor="end" class="fg-t sm warm">轉折點（約 400）</text>
<polyline points="180,212 280,211 380,207 480,191 530,58" class="fg-l alt"/>
<line x1="530" y1="58" x2="552" y2="32" class="fg-l alt dash"/>
<circle cx="180" cy="212" r="4" class="fg-lamp on"/><circle cx="280" cy="211" r="4" class="fg-lamp on"/><circle cx="380" cy="207" r="4" class="fg-lamp on"/><circle cx="480" cy="191" r="4" class="fg-lamp on"/><circle cx="530" cy="58" r="4" class="fg-lamp on"/>
<text x="540" y="62" class="fg-t sm">900 ms</text>
<text x="560" y="28" class="fg-t sm warm">500：5 秒</text>
</svg><figcaption>延遲先是一段平地，然後幾乎垂直往上。容量看的是轉折點，平常的規劃上限要留在它的六七成。</figcaption></figure>
<h4>為什麼是一個彎，而不是一條斜線</h4>
<p>最簡單的排隊模型（M/M/1：隨機到達、只有一個服務台）有一個很直觀的公式：</p>
<pre><code>平均回應時間 = 服務時間 ÷ (1 − 使用率)</code></pre>
<table>
<tr><th>使用率</th><th>回應時間是服務時間的幾倍</th></tr>
<tr><td>50%</td><td>2 倍</td></tr>
<tr><td>80%</td><td>5 倍</td></tr>
<tr><td>90%</td><td>10 倍</td></tr>
<tr><td>95%</td><td>20 倍</td></tr>
<tr><td>99%</td><td>100 倍</td></tr>
</table>
<p>使用率從 50% 到 80%，延遲只多一點；從 90% 到 99%，延遲多十倍。真實系統的數字不會剛好這樣，但形狀幾乎都是這樣：<b>使用率接近 100% 時，延遲不是線性變慢，而是爆炸。</b>這就是規劃要停在轉折點的六七成、不能貼著極限跑的原因：流量隨機晃一下，你就從平地掉進懸崖。</p>
<p>表格裡還有一個訊號常被漏看：送出 500，只完成 452。<b>完成的速率不再跟著成長，就是飽和最直接的證據。</b>更糟的情況是完成數不升反降：系統在過載時把力氣花在搶鎖、處理逾時、重試這些白工上，這叫<b>壅塞崩潰</b>（congestion collapse），第八節會處理它。</p>

<h3><span class="badge lv3">專業</span>五、協同遺漏：為什麼你的 p99 可能是假的</h3>
<p>第 0.8 課的深入圖解提過<b>協同遺漏</b>（coordinated omission）。這裡用數字把它算清楚，因為它會讓報告上的 p99 差到一千倍。</p>
<p>情境：一個封閉模型的工具，用一條連線，每 10 毫秒送一個請求，跑 100 秒，本來應該送 10,000 個。伺服器平常 1 毫秒就回應，但中間卡住一次，整整 2 秒（例如一次很長的垃圾回收停頓）。</p>
<figure class="figure"><svg viewBox="0 0 660 250" class="fg" style="width:100%;max-width:660px" role="img" aria-label="協同遺漏示意：伺服器卡住兩秒時，工具只送出一個請求並記成兩秒；真實使用者在這兩秒內會送出兩百個請求，每個分別要等兩秒到十毫秒">
<rect x="176" y="40" width="252" height="176" rx="4" class="fg-b warm"/>
<text x="302" y="30" text-anchor="middle" class="fg-t warm">伺服器卡住 2 秒</text>
<text x="10" y="78" class="fg-t">工具記到</text>
<circle cx="100" cy="74" r="4" class="fg-lamp on"/><circle cx="128" cy="74" r="4" class="fg-lamp on"/><circle cx="156" cy="74" r="4" class="fg-lamp on"/>
<line x1="176" y1="74" x2="428" y2="74" class="fg-l warm"/>
<circle cx="176" cy="74" r="4" class="fg-lamp on"/>
<text x="302" y="98" text-anchor="middle" class="fg-t sm">只送了 1 個，記成 2 秒</text>
<circle cx="436" cy="74" r="4" class="fg-lamp on"/><circle cx="464" cy="74" r="4" class="fg-lamp on"/><circle cx="492" cy="74" r="4" class="fg-lamp on"/><circle cx="520" cy="74" r="4" class="fg-lamp on"/><circle cx="548" cy="74" r="4" class="fg-lamp on"/><circle cx="576" cy="74" r="4" class="fg-lamp on"/><circle cx="604" cy="74" r="4" class="fg-lamp on"/><circle cx="632" cy="74" r="4" class="fg-lamp on"/>
<text x="10" y="208" class="fg-t">真實會送</text>
<line x1="90" y1="204" x2="645" y2="204" class="fg-l dim"/>
<line x1="184" y1="118" x2="428" y2="118" class="fg-l warm"/>
<line x1="212" y1="128" x2="428" y2="128" class="fg-l warm"/>
<line x1="240" y1="138" x2="428" y2="138" class="fg-l warm"/>
<line x1="268" y1="148" x2="428" y2="148" class="fg-l warm"/>
<line x1="296" y1="158" x2="428" y2="158" class="fg-l warm"/>
<line x1="324" y1="168" x2="428" y2="168" class="fg-l warm"/>
<line x1="352" y1="178" x2="428" y2="178" class="fg-l warm"/>
<line x1="380" y1="188" x2="428" y2="188" class="fg-l warm"/>
<line x1="408" y1="198" x2="428" y2="198" class="fg-l warm"/>
<circle cx="100" cy="204" r="4" class="fg-lamp on"/><circle cx="128" cy="204" r="4" class="fg-lamp on"/><circle cx="156" cy="204" r="4" class="fg-lamp on"/><circle cx="184" cy="204" r="4" class="fg-lamp"/><circle cx="212" cy="204" r="4" class="fg-lamp"/><circle cx="240" cy="204" r="4" class="fg-lamp"/><circle cx="268" cy="204" r="4" class="fg-lamp"/><circle cx="296" cy="204" r="4" class="fg-lamp"/><circle cx="324" cy="204" r="4" class="fg-lamp"/><circle cx="352" cy="204" r="4" class="fg-lamp"/><circle cx="380" cy="204" r="4" class="fg-lamp"/><circle cx="408" cy="204" r="4" class="fg-lamp"/><circle cx="436" cy="204" r="4" class="fg-lamp on"/><circle cx="464" cy="204" r="4" class="fg-lamp on"/><circle cx="492" cy="204" r="4" class="fg-lamp on"/><circle cx="520" cy="204" r="4" class="fg-lamp on"/><circle cx="548" cy="204" r="4" class="fg-lamp on"/><circle cx="576" cy="204" r="4" class="fg-lamp on"/><circle cx="604" cy="204" r="4" class="fg-lamp on"/><circle cx="632" cy="204" r="4" class="fg-lamp on"/>
<text x="442" y="140" class="fg-t sm warm">這段時間該送 200 個</text>
<text x="442" y="158" class="fg-t sm">各自要等 2 秒到 10 毫秒</text>
<text x="330" y="240" text-anchor="middle" class="fg-t sm">工具算出的 p99 ≈ 1 毫秒；照真實節奏算，p99 ≈ 1 秒</text>
</svg><figcaption>每個點是一個「本來該送出」的請求（示意，不按比例）。工具在卡住時乖乖等，等於幫伺服器把最難看的兩秒藏了起來。</figcaption></figure>
<p><b>工具量到的</b>：卡住的那 2 秒，它在等那一個請求，什麼都沒送。結果大約 9,800 個樣本是 1 毫秒，只有 1 個是 2 秒。p99 是 1 毫秒，報告非常漂亮。</p>
<p><b>真實世界</b>：使用者不會因為你的伺服器卡住就不來。照原本的節奏，那 2 秒裡應該送出 200 個請求，它們分別要等 2,000、1,990、1,980⋯⋯一直到 10 毫秒。這 200 個占全部 10,000 個的 2%，所以最慢的 1%（100 個）全部落在這一群裡，而且都超過 1 秒。<b>真正的 p99 大約是 1,000 毫秒</b>，跟報告差了一千倍。</p>
<p>「協同」的意思是：受測的系統和量測的工具，不知不覺「串通好了」。系統一慢，工具就少送、少記，剛好把最難看的那一段藏起來。怎麼防：</p>
<ul>
<li>用開放模型送請求：k6 的 arrival-rate 執行器、wrk2 的 <code>-R</code> 固定速率、Gatling 的開放注入（open injection）。</li>
<li>延遲從「本來應該送出的時間」開始算，不是從「實際送出的時間」。wrk2 就是這樣算的；HdrHistogram 也有修正這種偏差的記錄方式。</li>
<li>伺服器自己記的延遲也有同一個盲點：計時通常從程式讀到請求才開始，請求在負載平衡器、在核心的 accept 佇列（第 0.13 課）裡排隊的時間，都沒算進去。最接近使用者真實感受的數字，要從用戶端或最外層的負載平衡器量。</li>
</ul>

<h3><span class="badge lv3">專業</span>六、在轉折點找瓶頸</h3>
<p>轉折點找到了，下一個問題是：卡在哪裡？在那一刻，對每個資源問 USE 方法的三個問題：使用率、飽和、錯誤（第 4.6 課會把工具講完）。常見的瓶頸和它們的訊號：</p>
<table>
<tr><th>資源</th><th>飽和的訊號</th><th>常見的陷阱</th></tr>
<tr><td>應用程式 CPU</td><td>執行佇列變長；Node.js 的事件迴圈延遲（event loop lag）變大</td><td>整台平均 CPU 只有 25%，其實是單執行緒吃滿了一顆核心</td></tr>
<tr><td>資料庫連線池</td><td>拿連線要排隊，等待時間上升</td><td>把池開大，只是把排隊從應用程式搬進資料庫</td></tr>
<tr><td>資料庫本身</td><td>CPU 高、鎖等待、慢查詢變多</td><td>少一個索引，每次查詢都掃全表</td></tr>
<tr><td>記憶體</td><td>垃圾回收越來越頻繁、停頓越來越長</td><td>平均延遲正常，p99 被 GC 停頓拉高</td></tr>
<tr><td>網路</td><td>頻寬到頂、重傳變多、連線追蹤表滿</td><td>小機型有每秒封包數的上限，頻寬沒滿就先被限</td></tr>
<tr><td>下游服務</td><td>呼叫逾時、重試變多</td><td>你的系統沒事，是你呼叫的服務先倒</td></tr>
</table>
<h4>完整追一次</h4>
<p>猜高低遊戲的 API：兩台 Node.js 機器（各 4 核心）、一台 PostgreSQL。每個「開一局」請求要做 2 次查詢。階梯加壓的結果，轉折點在每秒 450 個請求。在轉折點：應用程式機器 CPU 40%、資料庫 CPU 35%，看起來都不忙。可是連線池的等待時間從 0 跳到 80 毫秒。</p>
<p>用利特爾定律算：每秒 450 個請求 × 2 次查詢 × 每次 20 毫秒 = 平均 18 條連線在忙。兩台機器的池各開 10 條，一共 20 條，使用率 90%，正好是上面那張表裡「延遲變 10 倍」的那一列。瓶頸在連線池，但真正的原因是每次查詢要 20 毫秒。</p>
<p>查慢查詢日誌，發現查玩家最近戰績的那條語句少了一個索引。加上索引後，查詢變成 4 毫秒：450 × 2 × 0.004 = 3.6 條連線，池子的使用率掉到 18%。再測一次，轉折點移到每秒 900 個。這一次 <code>mpstat</code> 顯示每台機器都有一顆核心 100%、另外三顆閒著：Node.js 的主執行緒滿了。下一步是每台跑 4 個行程（用 cluster，或多開幾個容器），而不是再加大連線池。</p>
<p>這就是上一課說的「瓶頸會移動」：每修好一個，它就跑到下一個最窄的地方。每一輪記下「轉折點在哪、當時誰飽和、改了什麼、新的轉折點在哪」，這份紀錄本身，就是一份很有說服力的作品。</p>

<h3><span class="badge lv3">專業</span>七、容量規劃：餘裕與 N+1</h3>
<p>壓測告訴你「一台機器能穩穩扛多少」，容量規劃把它換算成「要準備幾台」。需要三個數字：</p>
<ol>
<li><b>預估尖峰</b>：去年同一個時段的尖峰，乘上成長率。活動、節日、新版本上線都要算進去。</li>
<li><b>單台的安全工作點</b>：取轉折點的六七成，不是轉折點本身。這就是餘裕（headroom）。</li>
<li><b>容許的故障</b>：尖峰時少掉一台、甚至少掉一整個可用區域，還要撐得住。這叫 <b>N+1</b>。</li>
</ol>
<p>算一次：預估尖峰每秒 3,000 個請求，單台安全工作點 300（轉折點 450 的三分之二）。只看平均要 10 台。但要撐過「少一個可用區域」：</p>
<table>
<tr><th>部署方式</th><th>每區至少要扛</th><th>總台數</th><th>平常每台的負載</th></tr>
<tr><td>兩個可用區域</td><td>3,000（另一區倒了，一區扛全部）→ 每區 10 台</td><td>20 台</td><td>150，安全工作點的 50%</td></tr>
<tr><td>三個可用區域</td><td>1,500（剩兩區分攤）→ 每區 5 台</td><td>15 台</td><td>200，安全工作點的 67%</td></tr>
</table>
<p>區域越多，N+1 的額外成本越低：兩區要多準備一倍，三區只要多一半。這也是很多團隊選三個可用區域的原因。</p>
<h4>自動擴展救不了突波</h4>
<p>自動擴展（autoscaling）的反應時間 = 收集指標（常見約 1 分鐘）＋判斷（看設定，可能幾分鐘）＋開機和暖機（虛擬機常常要 2 到 5 分鐘，容器快一些）。流量在 10 秒內翻倍，這幾分鐘裡多出來的請求全都在排隊，照利特爾定律，系統裡的請求數會一路往上堆。所以突波要靠事先留好的餘裕、排程擴展（已知的活動時間先加機器），或用佇列把工作延後處理。</p>

<h3><span class="badge lv4">專家</span>八、撐不住的時候：卸載、允入控制與重試</h3>
<p>需求總有一天會超過容量。問題是超過的時候，你的系統走的是下面哪一條線：</p>
<figure class="figure"><svg viewBox="0 0 640 262" class="fg" style="width:100%;max-width:640px" role="img" aria-label="有效吞吐量對需求的曲線：理想情況到達容量後持平；有卸載的系統略低於理想但持平；沒有卸載的系統過了容量後一路往下掉到接近零">
<line x1="70" y1="30" x2="70" y2="210" class="fg-l"/><line x1="70" y1="210" x2="600" y2="210" class="fg-l"/>
<text x="76" y="40" class="fg-t sm">成功完成的請求</text>
<line x1="247" y1="60" x2="247" y2="210" class="fg-l dim dash"/>
<text x="70" y="228" text-anchor="middle" class="fg-t sm">0</text><text x="247" y="228" text-anchor="middle" class="fg-t sm">1 倍容量</text><text x="423" y="228" text-anchor="middle" class="fg-t sm">2 倍</text><text x="596" y="228" text-anchor="middle" class="fg-t sm">3 倍</text>
<text x="335" y="252" text-anchor="middle" class="fg-t sm">送進來的需求</text>
<polyline points="70,210 247,70 600,70" class="fg-l dim dash"/>
<text x="596" y="62" text-anchor="end" class="fg-t sm">理想</text>
<polyline points="70,210 240,80 270,84 600,84" class="fg-l on"/>
<text x="596" y="102" text-anchor="end" class="fg-t sm acc">有卸載：多的直接拒絕</text>
<polyline points="70,210 232,86 290,112 380,168 470,198 600,206" class="fg-l warm"/>
<text x="400" y="150" class="fg-t sm warm">沒卸載：一起逾時、一起重試</text>
</svg><figcaption>沒有保護的系統，過了容量之後成功的請求數不是持平，而是往下掉。快速拒絕多出來的部分，才能守住那條平線。</figcaption></figure>
<p>沒有保護的系統，會掉進一個惡性循環：請求排隊 → 輪到它的時候，用戶端早就逾時走了，伺服器做的是白工 → 用戶端重試，需求又多一倍 → 排得更長。最後伺服器 100% 忙碌，成功的請求卻接近零。</p>
<h4>卸載：快速說不</h4>
<p>卸載（load shedding）的關鍵是快：拒絕一個請求只要幾微秒，處理一個要幾十毫秒。用 429 或 503 加上 <code>Retry-After</code> 標頭立刻回應，把資源留給收下的那些。進階一點是<b>分優先順序</b>：先丟排行榜、統計這種晚點也沒關係的，最後才丟登入和開局。健康檢查則永遠不要丟，不然負載平衡器會以為這台死了，把流量全部擠到其他機器上，一台接一台倒。</p>
<h4>允入控制：限制「同時幾個」</h4>
<p>與其限制「每秒幾個」，更直接的是限制「同時幾個」。照利特爾定律，正常時同時處理中的請求大約是流量 × 延遲，例如每秒 400 個 × 0.05 秒 = 20 個。設一個上限，例如 100，超過就直接拒絕，或放進一個很短的佇列。這叫<b>允入控制</b>（admission control）。它的好處是你不用事先知道容量：系統一慢，同時處理中的數量自然上升，碰到上限就開始拒絕，等於自動卸載。Netflix 開源的 concurrency-limits 函式庫、Envoy 的自適應並行限制（adaptive concurrency），更進一步依照量到的延遲自動調整這個上限。</p>
<h4>佇列要短，重試要有預算</h4>
<ul>
<li><b>佇列要有上限，而且要短。</b>無限長的佇列，只是把「拒絕」變成「慢慢逾時」。排隊排到超過用戶端逾時時間的請求，處理它就是白工，應該直接丟掉。Facebook 在〈Fail at Scale〉這篇文章描述過他們的做法：過載時改成後進先出（LIFO），先服務最新的、用戶端還在等的請求。</li>
<li><b>重試要指數退避加上隨機抖動</b>（exponential backoff with jitter）：等 1 秒、2 秒、4 秒，每次再加減一點亂數，避免所有用戶端在同一刻一起重試。</li>
<li><b>重試要有預算。</b>例如重試的量不能超過正常請求的 10%。如果每一層都最多試 3 次，三層串起來，最底層會收到 3 × 3 × 3 = 27 倍的流量。</li>
</ul>

<h3><span class="badge lv4">專家</span>九、限流演算法：權杖桶與漏桶</h3>
<p>卸載保護的是整個系統；<b>速率限制</b>（rate limit）保護的是公平：不讓單一使用者、單一 IP、單一 API 金鑰吃掉所有資源。最常見的兩種演算法：</p>
<figure class="figure"><svg viewBox="0 0 660 268" class="fg" style="width:100%;max-width:660px" role="img" aria-label="左邊權杖桶：每秒補 r 個權杖，最多 b 個，請求拿到權杖才通過，沒有就拒絕；右邊漏桶：請求一陣一陣倒進桶裡，以固定速率從底部漏出，桶滿就溢出拒絕">
<text x="165" y="26" text-anchor="middle" class="fg-t lg">權杖桶</text>
<text x="165" y="44" text-anchor="middle" class="fg-t sm">容許突發、限制平均</text>
<circle cx="165" cy="62" r="6" class="fg-lamp on"/>
<text x="178" y="66" class="fg-t sm">每秒補 r 個</text>
<line x1="165" y1="70" x2="165" y2="92" class="fg-l on"/><polygon points="165,100 160.5,92 169.5,92" class="fg-a on"/>
<path d="M110 100 V176 H220 V100" class="fg-l"/>
<circle cx="128" cy="166" r="7" class="fg-lamp on"/><circle cx="148" cy="166" r="7" class="fg-lamp on"/><circle cx="168" cy="166" r="7" class="fg-lamp on"/><circle cx="188" cy="166" r="7" class="fg-lamp on"/><circle cx="128" cy="148" r="7" class="fg-lamp on"/><circle cx="148" cy="148" r="7" class="fg-lamp on"/>
<text x="228" y="140" class="fg-t sm">最多 b 個</text>
<line x1="165" y1="176" x2="165" y2="192" class="fg-l dash"/>
<rect x="130" y="192" width="70" height="28" rx="5" class="fg-b hot"/>
<text x="165" y="211" text-anchor="middle" class="fg-t sm">拿權杖</text>
<line x1="24" y1="206" x2="122" y2="206" class="fg-l"/><polygon points="130,206 122,201.5 122,210.5" class="fg-a"/>
<text x="70" y="198" text-anchor="middle" class="fg-t sm">請求</text>
<line x1="200" y1="206" x2="292" y2="206" class="fg-l on"/><polygon points="300,206 292,201.5 292,210.5" class="fg-a on"/>
<text x="250" y="198" text-anchor="middle" class="fg-t sm acc">有權杖：通過</text>
<line x1="165" y1="220" x2="165" y2="240" class="fg-l warm"/><polygon points="165,248 160.5,240 169.5,240" class="fg-a warm"/>
<text x="176" y="250" class="fg-t sm warm">沒權杖：拒絕</text>
<line x1="330" y1="16" x2="330" y2="258" class="fg-l dim dash"/>
<text x="495" y="26" text-anchor="middle" class="fg-t lg">漏桶</text>
<text x="495" y="44" text-anchor="middle" class="fg-t sm">輸出固定速率</text>
<circle cx="482" cy="62" r="5" class="fg-lamp"/><circle cx="495" cy="62" r="5" class="fg-lamp"/><circle cx="508" cy="62" r="5" class="fg-lamp"/>
<text x="520" y="66" class="fg-t sm">一陣一陣倒進來</text>
<line x1="495" y1="70" x2="495" y2="82" class="fg-l"/><polygon points="495,90 490.5,82 499.5,82" class="fg-a"/>
<path d="M440 90 V176 H550 V90" class="fg-l"/>
<rect x="444" y="128" width="102" height="44" rx="3" class="fg-b alt"/>
<text x="495" y="155" text-anchor="middle" class="fg-t sm">排隊中的請求</text>
<text x="558" y="140" class="fg-t sm">最多 b 個</text>
<line x1="436" y1="100" x2="392" y2="100" class="fg-l warm"/><polygon points="384,100 392,95.5 392,104.5" class="fg-a warm"/>
<text x="350" y="124" class="fg-t sm warm">滿了就溢出</text>
<text x="350" y="140" class="fg-t sm warm">＝拒絕</text>
<line x1="495" y1="176" x2="495" y2="198" class="fg-l on"/><polygon points="495,206 490.5,198 499.5,198" class="fg-a on"/>
<text x="505" y="196" class="fg-t sm acc">每秒 r 個</text>
<circle cx="435" cy="222" r="5" class="fg-lamp on"/><circle cx="475" cy="222" r="5" class="fg-lamp on"/><circle cx="515" cy="222" r="5" class="fg-lamp on"/><circle cx="555" cy="222" r="5" class="fg-lamp on"/>
<text x="495" y="250" text-anchor="middle" class="fg-t sm">出去的間隔永遠一樣</text>
</svg><figcaption>權杖桶看的是「手上有沒有額度」，所以允許一口氣用掉存下來的額度；漏桶看的是「出口的速度」，所以不管進來多亂，出去都一樣平。</figcaption></figure>
<h4>權杖桶（token bucket）</h4>
<p>一個桶子最多裝 b 個權杖，每秒補進 r 個，滿了就不再增加。每個請求要拿走一個權杖才能通過，桶子空了就拒絕。走一次：b = 10、r = 每秒 5 個，一開始桶子是滿的。第 0 秒同時湧進 15 個請求：前 10 個拿到權杖通過，後 5 個被拒絕。1 秒後補回 5 個權杖，又能放行 5 個。長期來看，平均不會超過每秒 5 個，但短時間可以衝到 10 個。<b>它容許突發，又限制平均</b>，很符合真人「一下子點好幾下，然後停下來看」的行為。AWS API Gateway 的節流設定（速率加突發量）就是用權杖桶描述的。</p>
<h4>漏桶（leaky bucket）</h4>
<p>想像一個底部有小洞的水桶：請求從上面倒進來，從底部以固定速率漏出去；桶子滿了，再倒進來的就溢出，也就是被拒絕。它的輸出非常平滑，適合保護一個只能承受固定速率的下游，例如一個有嚴格每秒上限的第三方 API。nginx 的 <code>limit_req</code> 用的就是漏桶：</p>
<pre><code>limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

server {
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        limit_req_status 429;
    }
}</code></pre>
<p>意思是：每個來源 IP 平均每秒 10 個請求；超出的部分最多先放 20 個進桶子；<code>nodelay</code> 讓桶子裡的請求立刻處理、不用排隊慢慢放，但它們仍然佔著桶子的位置，照每秒 10 個的速度空出來；桶子滿了就回 429（不設的話預設是 503）。</p>
<h4>為什麼不用「每分鐘計數」</h4>
<p>最直覺的做法是固定時間窗計數：每分鐘最多 100 個，整分歸零。問題在邊界：一個使用者在 0:59 送 100 個、1:00 再送 100 個，兩秒內通過了 200 個，是限制的兩倍。滑動時間窗（sliding window）把前一段時間的計數按比例算進來，可以大幅減少這個問題。</p>
<h4>多台機器怎麼共用一個限制</h4>
<p>每台機器各自計數，限制就變成「每台 10 個」，機器越多越鬆。要全域一致，就把計數放在 Redis 這類共用的儲存裡，用一段 Lua 腳本把「讀取、計算、寫回」做成一個不可分割的動作，免得兩台機器同時讀到舊的值。代價是每個請求多一次網路來回，所以常見的折衷是：粗的全域限制放 Redis，細的放在本機記憶體。</p>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>平均延遲正常，就代表撐得住</td><td>平均會被大量快的請求拉低。要看 p99，也要看完成的速率有沒有跟上送出的速率。</td></tr>
<tr><td>虛擬使用者數就是同時在線人數</td><td>虛擬使用者送請求的頻率取決於思考時間和回應時間。要換算成每秒請求數才有意義，而且封閉模型會被系統變慢騙到。</td></tr>
<tr><td>CPU 還沒滿，就還有餘裕</td><td>瓶頸常在 CPU 以外：連線池、鎖、單一核心、下游服務，甚至是壓測機自己。</td></tr>
<tr><td>加大連線池可以提高容量</td><td>資料庫已經是瓶頸時，更大的池只是讓更多查詢在資料庫裡搶資源，常常更慢。</td></tr>
<tr><td>有自動擴展就不用做容量規劃</td><td>擴展要幾分鐘，也有上限（帳號配額、資料庫）。突波和 N+1 都要事先準備。</td></tr>
<tr><td>拒絕請求是失敗，要盡量避免</td><td>過載時，快速拒絕一部分才保得住其他人。全部收下，結果是全部逾時。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>後端（Node.js、Go）</b>：Node.js 一個行程只用一顆核心跑你的 JavaScript，要用滿 4 核心就要 4 個行程。Go 會自己用滿所有核心，但在容器裡要讓它知道 CPU 限制（Go 1.25 起，GOMAXPROCS 預設會參考容器的 CPU 上限）。連線池大小用利特爾定律算，不要用猜的。</li>
<li><b>前端（Vue、TypeScript）</b>：前端也在製造負載。一個每 2 秒輪詢一次的頁面，1 萬個人開著就是每秒 5,000 個請求。重試一定要加退避和抖動，不然伺服器一出狀況，所有瀏覽器會同時把它打得更慘。</li>
<li><b>遊戲（Cocos、Unity）</b>：即時對戰用的 WebSocket，容量常常不是每秒請求數，而是同時連線數和每秒要廣播的訊息數。壓測要模擬長連線和訊息節奏。活動開場、整點發獎勵這種「所有人同時上線」的瞬間，就是突波。</li>
<li><b>雲端主機和 Docker</b>：小機型有頻寬和每秒封包數的上限；可爆發型機型的 CPU 點數會在長時間壓測裡用完（第 4.6 課）。容器的 CPU 限制會讓服務在壓力下被節流。壓測要跑得夠久、在跟正式環境同樣的規格上跑，才看得到這些。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<p>後端、SRE、遊戲伺服器的面試常見題。先自己講一遍，再看參考答案。</p>
<ol>
<li>「開放模型和封閉模型的壓測差在哪？什麼時候用哪一種？」</li>
<li>「什麼是協同遺漏？怎麼避免？」</li>
<li>「一個服務每秒 2,000 個請求，每個請求平均做 3 次資料庫查詢，每次 4 毫秒。連線池要開多大？」</li>
<li>「系統過載時，你會怎麼設計，讓它壞得溫和？」</li>
<li>「權杖桶和漏桶有什麼差別？各適合什麼情況？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>封閉模型是固定數量的虛擬使用者，送出、等回應、思考，再送下一個，所以系統變慢時送出的速率會自動下降；開放模型是照固定的到達速率送，不管前一個請求回來沒有，系統變慢就會表現成排隊和延遲。面對大量獨立使用者的網站和公開 API 要用開放模型，否則會低估過載時的延遲；連線數固定的內部系統，封閉模型比較貼近現實。</li>
<li>工具在等慢回應的期間停止送出新請求，等於少記了那段期間本來會發生的大量高延遲樣本，讓 p99 看起來比真實好上幾個數量級。避免的方法是用固定速率（開放模型）送請求，並從預定送出的時間開始計算延遲，例如 wrk2、k6 的 arrival-rate 執行器，或用 HdrHistogram 修正；也要記得伺服器端量的延遲不包含前面排隊的時間。</li>
<li>用利特爾定律：2,000 × 3 × 0.004 = 平均 24 條連線同時在忙。考慮起伏和不要讓池的使用率太高，總共準備大約 35 到 50 條，再除以應用程式的實例數，得到每個實例的池大小；同時確認資料庫的最大連線數夠用。如果算出來要幾百條，先檢查查詢是不是太慢，而不是開大池。</li>
<li>先量出容量和轉折點，用 N+1 和餘裕準備容量；超過時快速拒絕（429／503 加 Retry-After），並依優先順序丟棄非核心請求、保留健康檢查；用允入控制限制同時處理的請求數；佇列要有上限並丟掉已經逾時的請求；用戶端重試要指數退避加抖動，並設重試預算；非核心功能可以降級。</li>
<li>權杖桶以固定速率累積權杖，請求拿到權杖才通過，因此允許短時間用掉累積的額度（突發），但長期平均受限，適合對使用者或 API 金鑰做速率限制。漏桶以固定速率放出請求，輸出平滑，適合保護只能承受固定速率的下游。兩者都有容量參數 b，超過就拒絕。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>封閉模型：300 個虛擬使用者、思考時間 2 秒、回應時間 0.5 秒。每秒送出多少請求？伺服器變慢，回應變成 3 秒時呢？</li>
<li>一個服務每秒 800 個請求，平均延遲 50 毫秒。平均同時有幾個請求在處理？延遲變成 500 毫秒呢？如果每個請求在處理時佔用 2 MB 記憶體，兩種情況各要多少？</li>
<li>預估尖峰每秒 6,000 個請求，單台轉折點 600。取轉折點的三分之二當安全工作點，分在三個可用區域、要撐過少一區。總共要幾台？平常每台扛多少？</li>
<li>權杖桶 b = 20、r = 每秒 10 個，一開始是滿的。第 0 秒進來 30 個請求，第 1 秒又進來 15 個。各通過幾個、拒絕幾個？</li>
<li>動手：在你本機的服務加一個端點，每 100 次請求有 1 次故意等 2 秒。用 k6 分別跑虛擬使用者模式和 <code>constant-arrival-rate</code> 模式，比較兩者的 p99，解釋差異。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>300 ÷ (0.5 + 2) = 每秒 120 個。回應變 3 秒：300 ÷ 5 = 每秒 60 個。伺服器越慢，工具送得越少，這就是封閉模型會藏問題的原因。</li>
<li>800 × 0.05 = 40 個；800 × 0.5 = 400 個。記憶體從 80 MB 變成 800 MB。延遲變長十倍，資源用量也變十倍。</li>
<li>安全工作點 400。少一區時剩兩區要扛 6,000，每區 3,000，需要 7.5 台，取 8 台；三區共 24 台。平常每台扛 6,000 ÷ 24 = 250，大約是安全工作點的六成。</li>
<li>第 0 秒：通過 20、拒絕 10，桶子空了。到第 1 秒補回 10 個：通過 10、拒絕 5。</li>
<li>虛擬使用者模式下，慢的那一次只拖住一個虛擬使用者，其他照常，而且那段時間少送了請求，p99 看起來接近正常；固定速率模式下，請求照樣進來，碰上慢請求時排隊的、受影響的請求變多，p99 明顯變差。後者比較接近真實使用者的感受。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>k6 官方文件</b>（<a href="https://grafana.com/docs/k6/latest/">grafana.com/docs/k6</a>）：情境（scenarios）和各種執行器的章節，裡面有專門講開放與封閉模型的一頁。</li>
<li><b>Gil Tene 的演講〈How NOT to Measure Latency〉</b>：協同遺漏的原始說明，YouTube 上有好幾場錄影。看完你會重新檢查每一份壓測報告。</li>
<li><b>Google《Site Reliability Engineering》</b>（<a href="https://sre.google/books/">sre.google/books</a>）：〈Handling Overload〉和〈Addressing Cascading Failures〉兩章，講卸載、重試預算和連鎖倒下。</li>
<li><b>AWS Builders' Library</b>（<a href="https://aws.amazon.com/builders-library/">aws.amazon.com/builders-library</a>）：〈Using load shedding to avoid overload〉和〈Timeouts, retries, and backoff with jitter〉兩篇，都是大規模系統的第一手經驗。</li>
<li><b>Ben Maurer〈Fail at Scale〉</b>（ACM Queue，2015）：Facebook 怎麼用短佇列、後進先出和受控延遲撐過過載。</li>
</ul>
` });
