DEEP({ 'cap-breaks': `
<p>上一課那張表列了十四種常見故障。這一章往下挖一層：大型事故很少是「一個東西壞掉」這麼單純，通常是一個小問題，被系統自己的機制放大成全面癱瘓。重試、逾時、快取、健康檢查、自動擴展，這些本來是保護你的東西，在錯的時刻會變成加害者。我們先把壞掉的「形狀」分類，看每一種是怎麼擴散的；再看擋住它們的防禦模式怎麼實作；最後拿幾個真實的公開事故，把這些名詞一個一個對回現實。</p>

<h3><span class="badge lv1">基礎</span>一、壞掉的三種形狀：死掉、變慢、半死不活</h3>
<p>想像一條高速公路。發生車禍、整條封閉，這是<b>停止型故障</b>（fail-stop）：很糟，但很明顯，導航馬上叫大家改道。一條車道施工、車速變一半，這是<b>變慢型故障</b>（fail-slow）：沒有人通報，可是車子一直開上來，回堵一路延伸到好幾個交流道之外。最後一種是路面有個坑，監視器拍起來一切正常，但每一百台車就有兩台爆胎，這是<b>灰色故障</b>（gray failure）。</p>
<p>直覺上「死掉」最嚴重，其實它最好處理。用第 4.4 課的利特爾定律算給你看：大廳 API 每秒 500 個請求呼叫個人資料服務。</p>
<table>
<tr><th>個人資料服務的狀態</th><th>每次呼叫花多久</th><th>同時卡在呼叫裡的請求（500 × 時間）</th></tr>
<tr><td>正常</td><td>20 ms</td><td>10 個</td></tr>
<tr><td>死掉（連線直接被拒）</td><td>1 ms</td><td>0.5 個</td></tr>
<tr><td>變慢</td><td>2 秒</td><td><b>1,000 個</b></td></tr>
</table>
<p>死掉的時候，呼叫方馬上拿到錯誤，資源立刻放掉。變慢的時候，每一個請求都抱著一條連線、一個執行緒或一塊記憶體在等。大廳 API 的連線池如果只有 200 條，第 201 個請求就開始排隊，大廳自己也變慢了。<b>慢，會傳染；死，不太會。</b>這就是為什麼後面所有的防禦，核心都是「把慢變成快速失敗」。</p>

<h3><span class="badge lv1">基礎</span>二、連鎖故障：壅塞怎麼一層一層往回傳</h3>
<p>把上面的例子放進完整的呼叫鏈：閘道 → 大廳 API → 個人資料服務 → 資料庫。起因只是一個新上線的查詢少了索引，讓資料庫的某類查詢從 5 ms 變成 800 ms。</p>
<figure class="figure"><svg viewBox="0 0 660 272" class="fg" style="width:100%;max-width:660px" role="img" aria-label="連鎖故障的三個時間點：一開始四個元件都正常；三十秒後資料庫變慢、個人資料服務的連線池滿了；九十秒後大廳 API 請求堆積、閘道健康檢查失敗，全部倒下">
<text x="130" y="24" text-anchor="middle" class="fg-t">閘道</text><text x="270" y="24" text-anchor="middle" class="fg-t">大廳 API</text><text x="410" y="24" text-anchor="middle" class="fg-t">個人資料服務</text><text x="550" y="24" text-anchor="middle" class="fg-t">資料庫</text>
<line x1="150" y1="20" x2="226" y2="20" class="fg-l dim"/><polygon points="234,20 226,15.5 226,24.5" class="fg-a"/>
<line x1="305" y1="20" x2="355" y2="20" class="fg-l dim"/><polygon points="363,20 355,15.5 355,24.5" class="fg-a"/>
<line x1="456" y1="20" x2="514" y2="20" class="fg-l dim"/><polygon points="522,20 514,15.5 514,24.5" class="fg-a"/>
<text x="10" y="62" class="fg-t sm">T+0 秒</text><text x="10" y="78" class="fg-t sm">正常</text>
<text x="10" y="126" class="fg-t sm">T+30 秒</text><text x="10" y="142" class="fg-t sm">資料庫變慢</text>
<text x="10" y="190" class="fg-t sm">T+90 秒</text><text x="10" y="206" class="fg-t sm warm">全部倒下</text>
<rect x="75" y="44" width="110" height="44" rx="5" class="fg-b"/><text x="130" y="62" text-anchor="middle" class="fg-t sm">連線正常</text><rect x="85" y="70" width="90" height="10" rx="2" class="fg-b"/><rect x="85" y="70" width="9" height="10" rx="2" class="fg-b hot"/>
<rect x="215" y="44" width="110" height="44" rx="5" class="fg-b"/><text x="270" y="62" text-anchor="middle" class="fg-t sm">忙碌 10%</text><rect x="225" y="70" width="90" height="10" rx="2" class="fg-b"/><rect x="225" y="70" width="9" height="10" rx="2" class="fg-b hot"/>
<rect x="355" y="44" width="110" height="44" rx="5" class="fg-b"/><text x="410" y="62" text-anchor="middle" class="fg-t sm">連線池 10%</text><rect x="365" y="70" width="90" height="10" rx="2" class="fg-b"/><rect x="365" y="70" width="9" height="10" rx="2" class="fg-b hot"/>
<rect x="495" y="44" width="110" height="44" rx="5" class="fg-b"/><text x="550" y="62" text-anchor="middle" class="fg-t sm">查詢 5 ms</text><rect x="505" y="70" width="90" height="10" rx="2" class="fg-b"/><rect x="505" y="70" width="18" height="10" rx="2" class="fg-b hot"/>
<rect x="75" y="108" width="110" height="44" rx="5" class="fg-b"/><text x="130" y="126" text-anchor="middle" class="fg-t sm">連線正常</text><rect x="85" y="134" width="90" height="10" rx="2" class="fg-b"/><rect x="85" y="134" width="14" height="10" rx="2" class="fg-b hot"/>
<rect x="215" y="108" width="110" height="44" rx="5" class="fg-b"/><text x="270" y="126" text-anchor="middle" class="fg-t sm">忙碌 40%</text><rect x="225" y="134" width="90" height="10" rx="2" class="fg-b"/><rect x="225" y="134" width="36" height="10" rx="2" class="fg-b hot"/>
<rect x="355" y="108" width="110" height="44" rx="5" class="fg-b warm"/><text x="410" y="126" text-anchor="middle" class="fg-t sm">池滿 50/50</text><rect x="365" y="134" width="90" height="10" rx="2" class="fg-b"/><rect x="365" y="134" width="90" height="10" rx="2" class="fg-b warm"/>
<rect x="495" y="108" width="110" height="44" rx="5" class="fg-b warm"/><text x="550" y="126" text-anchor="middle" class="fg-t sm">查詢 800 ms</text><rect x="505" y="134" width="90" height="10" rx="2" class="fg-b"/><rect x="505" y="134" width="72" height="10" rx="2" class="fg-b warm"/>
<rect x="75" y="172" width="110" height="44" rx="5" class="fg-b warm"/><text x="130" y="190" text-anchor="middle" class="fg-t sm">健康檢查失敗</text><rect x="85" y="198" width="90" height="10" rx="2" class="fg-b"/><rect x="85" y="198" width="90" height="10" rx="2" class="fg-b warm"/>
<rect x="215" y="172" width="110" height="44" rx="5" class="fg-b warm"/><text x="270" y="190" text-anchor="middle" class="fg-t sm">請求堆積</text><rect x="225" y="198" width="90" height="10" rx="2" class="fg-b"/><rect x="225" y="198" width="90" height="10" rx="2" class="fg-b warm"/>
<rect x="355" y="172" width="110" height="44" rx="5" class="fg-b warm"/><text x="410" y="190" text-anchor="middle" class="fg-t sm">池滿 50/50</text><rect x="365" y="198" width="90" height="10" rx="2" class="fg-b"/><rect x="365" y="198" width="90" height="10" rx="2" class="fg-b warm"/>
<rect x="495" y="172" width="110" height="44" rx="5" class="fg-b warm"/><text x="550" y="190" text-anchor="middle" class="fg-t sm">查詢 800 ms</text><rect x="505" y="198" width="90" height="10" rx="2" class="fg-b"/><rect x="505" y="198" width="72" height="10" rx="2" class="fg-b warm"/>
<line x1="600" y1="238" x2="88" y2="238" class="fg-l warm"/><polygon points="80,238 88,233.5 88,242.5" class="fg-a warm"/>
<text x="340" y="262" text-anchor="middle" class="fg-t sm warm">呼叫往右走，壅塞往左傳</text>
</svg><figcaption>根本原因只在最右邊那一格，而且資料庫其實沒掛，只是慢。可是 90 秒後，使用者看到的是最左邊的閘道全部掛掉。值班的人如果從左邊開始查，會查很久。</figcaption></figure>
<ol>
<li><b>T+0 到 30 秒</b>：資料庫的那類查詢變慢。個人資料服務每秒 600 個請求 × 0.8 秒 = 480 個同時進行，連線池只有 50 條，立刻滿了，剩下的開始排隊。</li>
<li><b>T+30 到 60 秒</b>：大廳 API 呼叫個人資料服務時沒設逾時（或設了預設的 30 秒），每個請求都掛在那裡。Node.js 的待處理 Promise 和 Go 的 goroutine 一直增加，記憶體往上衝。</li>
<li><b>T+60 到 90 秒</b>：大廳 API 忙到連健康檢查都回不了，負載平衡器把它踢掉，流量全部擠到剩下的幾台，它們也一台一台倒。閘道等不到大廳的回應，自己的健康檢查也開始失敗。</li>
</ol>
<p>注意第三步：<b>健康檢查把「變慢」轉成了「死掉」，而且是一台接一台死。</b>所以第 1.7、2.4 課一直強調，存活探針（liveness）不要去檢查相依服務，健康檢查的端點要很輕、不排在一般請求後面。</p>

<h3><span class="badge lv2">進階</span>三、重試風暴：每一層都在幫倒忙</h3>
<p>重試對「偶爾掉一個封包」很有用，對「對方已經撐不住」卻是火上加油。如果每一層都很盡責地最多試 3 次：</p>
<figure class="figure"><svg viewBox="0 0 640 250" class="fg" style="width:100%;max-width:640px" role="img" aria-label="重試放大：用戶端試三次，閘道收到三次；閘道每次再試三次，大廳 API 收到九次；大廳 API 每次再試三次，資料庫收到二十七次">
<text x="60" y="22" text-anchor="middle" class="fg-t sm">1 次操作</text><text x="220" y="22" text-anchor="middle" class="fg-t sm">閘道收到 3 次</text><text x="380" y="22" text-anchor="middle" class="fg-t sm">API 收到 9 次</text><text x="560" y="22" text-anchor="middle" class="fg-t sm warm">資料庫收到 27 次</text>
<line x1="68" y1="122" x2="213" y2="62" class="fg-l dim"/><line x1="68" y1="122" x2="213" y2="122" class="fg-l dim"/><line x1="68" y1="122" x2="213" y2="182" class="fg-l dim"/>
<line x1="227" y1="62" x2="374" y2="42" class="fg-l dim"/><line x1="227" y1="62" x2="374" y2="62" class="fg-l dim"/><line x1="227" y1="62" x2="374" y2="82" class="fg-l dim"/>
<line x1="227" y1="122" x2="374" y2="102" class="fg-l dim"/><line x1="227" y1="122" x2="374" y2="122" class="fg-l dim"/><line x1="227" y1="122" x2="374" y2="142" class="fg-l dim"/>
<line x1="227" y1="182" x2="374" y2="162" class="fg-l dim"/><line x1="227" y1="182" x2="374" y2="182" class="fg-l dim"/><line x1="227" y1="182" x2="374" y2="202" class="fg-l dim"/>
<line x1="386" y1="42" x2="500" y2="122" class="fg-l warm"/><line x1="386" y1="62" x2="500" y2="122" class="fg-l warm"/><line x1="386" y1="82" x2="500" y2="122" class="fg-l warm"/><line x1="386" y1="102" x2="500" y2="122" class="fg-l warm"/><line x1="386" y1="122" x2="500" y2="122" class="fg-l warm"/><line x1="386" y1="142" x2="500" y2="122" class="fg-l warm"/><line x1="386" y1="162" x2="500" y2="122" class="fg-l warm"/><line x1="386" y1="182" x2="500" y2="122" class="fg-l warm"/><line x1="386" y1="202" x2="500" y2="122" class="fg-l warm"/>
<circle cx="60" cy="122" r="8" class="fg-b hot"/>
<circle cx="220" cy="62" r="7" class="fg-b alt"/><circle cx="220" cy="122" r="7" class="fg-b alt"/><circle cx="220" cy="182" r="7" class="fg-b alt"/>
<circle cx="380" cy="42" r="6" class="fg-b"/><circle cx="380" cy="62" r="6" class="fg-b"/><circle cx="380" cy="82" r="6" class="fg-b"/><circle cx="380" cy="102" r="6" class="fg-b"/><circle cx="380" cy="122" r="6" class="fg-b"/><circle cx="380" cy="142" r="6" class="fg-b"/><circle cx="380" cy="162" r="6" class="fg-b"/><circle cx="380" cy="182" r="6" class="fg-b"/><circle cx="380" cy="202" r="6" class="fg-b"/>
<rect x="500" y="92" width="120" height="60" rx="6" class="fg-b warm"/>
<text x="560" y="117" text-anchor="middle" class="fg-t">資料庫</text><text x="560" y="137" text-anchor="middle" class="fg-t sm">同一個請求 27 次</text>
<text x="60" y="236" text-anchor="middle" class="fg-t sm">用戶端（試 3 次）</text><text x="220" y="236" text-anchor="middle" class="fg-t sm">閘道（各試 3 次）</text><text x="380" y="236" text-anchor="middle" class="fg-t sm">大廳 API（各試 3 次）</text><text x="560" y="236" text-anchor="middle" class="fg-t sm">最底層</text>
</svg><figcaption>用戶端、閘道、大廳 API 三層各「最多試 3 次」，次數是相乘的（最右邊每一條粗線代表 3 次）。最底層那個本來就快撐不住的資料庫，在最需要喘口氣的時候，收到 27 倍的流量。</figcaption></figure>
<p>還有兩個常見的放大器：</p>
<ul>
<li><b>白工</b>：用戶端 1 秒就逾時走人，伺服器還在幫它做 5 秒的事。做完了也沒人收，而用戶端已經送出第二次請求。伺服器越忙，白工的比例越高。</li>
<li><b>沒有抖動的退避</b>：所有用戶端都在 1 秒、2 秒、4 秒後重試，退避了，但還是一起回來。下一節會畫給你看。</li>
</ul>
<p>對策有四條：<b>只在一層重試</b>（通常是最外層，或離故障最近的那一層，其他層直接把錯誤往上傳）；<b>重試要有預算</b>；<b>退避加上全抖動</b>；<b>把剩下的時間往下傳</b>（期限傳遞，第八節）。重試預算的實作很短，用一個小權杖桶：每次成功存 0.1 個權杖，每次重試花 1 個，所以重試量最多是成功量的一成：</p>
<pre><code>class RetryBudget {
  private tokens = 10;
  constructor(private ratio = 0.1,
              private max = 10) {}
  onSuccess() {
    this.tokens = Math.min(this.max,
                           this.tokens + this.ratio);
  }
  tryRetry(): boolean {
    if (this.tokens &lt; 1) return false; // 預算用完
    this.tokens -= 1;
    return true;
  }
}

async function callWithRetry&lt;T&gt;(
  fn: (s: AbortSignal) =&gt; Promise&lt;T&gt;,
  budget: RetryBudget,
  deadlineMs: number,
): Promise&lt;T&gt; {
  const start = Date.now();
  for (let attempt = 0; ; attempt++) {
    const left = deadlineMs - (Date.now() - start);
    if (left &lt;= 0) throw new Error('deadline');
    try {
      // 每次只給剩下的時間
      const r = await fn(AbortSignal.timeout(left));
      budget.onSuccess();
      return r;
    } catch (e) {
      if (attempt &gt;= 2 || !isRetryable(e)
          || !budget.tryRetry()) throw e;
      const cap = Math.min(2000, 100 * 2 ** attempt);
      await sleep(Math.random() * cap); // 全抖動
    }
  }
}</code></pre>
<p><code>isRetryable</code> 只對逾時、連線失敗、503 回傳 true；400 這種「你的請求本身有錯」重試一百次也沒用。沒有冪等鍵的寫入（例如「扣入場點數」）絕對不能自動重試，否則同一回合會扣兩次（第 3.2、3.9 課）。Google 的 SRE 書還描述了一種用戶端的自適應節流：用戶端自己記最近被拒絕的比例，比例一高，就在本機直接丟掉一部分請求，連送都不送。</p>

<h3><span class="badge lv2">進階</span>四、驚群：大家在同一秒醒來</h3>
<p><b>驚群</b>（thundering herd）是指一大群原本分散的用戶端，因為某個共同的時間點，在同一刻一起行動。遊戲平台裡的來源特別多：</p>
<ul>
<li><b>重連</b>：一台閘道重啟，上面兩萬人同時重連；整個部署更新，十五萬人同時重連（第 8.1 課）。</li>
<li><b>整點</b>：每日任務在 00:00 重置，所有在線玩家同一秒去領獎勵；排程工作全部設在整點。</li>
<li><b>快取同時過期</b>：熱門的鍵在同一秒到期，大家一起去打資料庫（第 3.5 課）。</li>
<li><b>恢復的那一刻</b>：服務掛了五分鐘，五分鐘裡累積的所有重試，在它恢復的那一秒一起進來，把它再打倒一次。</li>
</ul>
<figure class="figure"><svg viewBox="0 0 640 250" class="fg" style="width:100%;max-width:640px" role="img" aria-label="十五萬人重連的速率：不加抖動時，在第零、一、三、七、十五秒出現一根根尖刺；加上全抖動後，三十秒內每秒約五千次，很平">
<line x1="60" y1="30" x2="60" y2="210" class="fg-l"/><line x1="60" y1="210" x2="610" y2="210" class="fg-l"/>
<text x="66" y="32" class="fg-t sm">每秒重連數</text>
<text x="54" y="44" text-anchor="end" class="fg-t sm">15 萬</text><text x="54" y="214" text-anchor="end" class="fg-t sm">0</text>
<line x1="56" y1="40" x2="64" y2="40" class="fg-l"/>
<polyline points="60,210 64,40 68,210 73.5,210 77.5,85.3 81.5,210 100.5,210 104.5,119.3 108.5,210 154.5,210 158.5,153.3 162.5,210 262.5,210 266.5,181.7 270.5,210" class="fg-l warm"/>
<polyline points="60,210 62,204 465,204 467,210" class="fg-l on"/>
<text x="120" y="70" class="fg-t sm warm">不加抖動：退避了，還是一起回來</text>
<text x="300" y="192" class="fg-t sm acc">全抖動：分散在 30 秒，每秒約 5,000</text>
<text x="60" y="228" text-anchor="middle" class="fg-t sm">0</text><text x="195" y="228" text-anchor="middle" class="fg-t sm">10</text><text x="330" y="228" text-anchor="middle" class="fg-t sm">20</text><text x="465" y="228" text-anchor="middle" class="fg-t sm">30</text><text x="600" y="228" text-anchor="middle" class="fg-t sm">40 秒</text>
</svg><figcaption>橘線是「固定的指數退避」：第 0、1、3、7、15 秒，大家照同一張時間表一起重試，每一根刺都可能再把伺服器打倒。綠線把同樣的人數隨機攤開，峰值只剩三十分之一。</figcaption></figure>
<p><b>全抖動</b>（full jitter）的公式是：<code>等待 = random(0, min(上限, 基數 × 2^第幾次))</code>。AWS 的 Marc Brooker 在 2015 年的文章裡比較過幾種抖動，全抖動的總完成時間和伺服器負載都比不加抖動好很多。伺服器端也要配合：</p>
<ul>
<li><b>入場節流</b>：閘道剛啟動時，每秒只接受一定數量的新連線，超過的回「稍後再試」，讓它慢慢把連線收滿。</li>
<li><b>部署分批</b>：一次只換一小部分閘道，每批之間等上一批的連線穩定（第 1.7 課的連線排空）。</li>
<li><b>把整點打散</b>：每日重置不用一個 00:00 的批次去跑，而是玩家下一次動作時才判斷「今天領過沒」。工作量自然分散到玩家各自上線的時間，根本沒有尖峰。</li>
</ul>

<h3><span class="badge lv3">專業</span>五、亞穩態故障：觸發原因走了，系統還是回不來</h3>
<p>最讓值班工程師崩潰的一種事故：快取重啟了 10 秒就好了，可是系統在那之後一個小時都起不來。這叫<b>亞穩態故障</b>（metastable failure），2021 年 Bronson 等人的論文把它正式命名。第 3.3 課的連線風暴就是一個例子。它有三個要素：</p>
<ol>
<li><b>脆弱狀態</b>：系統平常靠某個東西撐著，負載其實已經超過「沒有它」時的容量。例如排行榜靠快取擋掉 95% 的讀取，資料庫只看到 5%，每秒 300 次，很輕鬆；但如果快取全部失效，資料庫要扛每秒 6,000 次，它只扛得了 1,000。</li>
<li><b>觸發</b>：一個短暫的事件。Redis 重啟、一次網路抖動、一次部署。</li>
<li><b>維持機制</b>：一個讓壞狀態自己撐住的回饋迴圈。資料庫一慢，查詢就逾時，結果沒寫回快取，快取就一直是空的；用戶端逾時又重試，負載變成三倍。Redis 早就恢復了，系統卻卡在壞的那一邊。</li>
</ol>
<figure class="figure"><svg viewBox="0 0 640 270" class="fg" style="width:100%;max-width:640px" role="img" aria-label="亞穩態：負載在脆弱區時，系統可能在上面的正常產出，也可能在下面的低產出；觸發事件讓它從上面掉到下面，要把負載降到脆弱區左邊才回得去">
<line x1="60" y1="30" x2="60" y2="240" class="fg-l"/><line x1="60" y1="240" x2="610" y2="240" class="fg-l"/>
<text x="66" y="32" class="fg-t sm">有效產出</text>
<text x="600" y="258" text-anchor="end" class="fg-t sm">送進來的負載</text>
<line x1="150" y1="44" x2="150" y2="238" class="fg-l dim dash"/><line x1="330" y1="44" x2="330" y2="238" class="fg-l dim dash"/>
<text x="240" y="40" text-anchor="middle" class="fg-t sm">脆弱區：兩種狀態都可能</text>
<polyline points="60,230 330,60 600,60" class="fg-l on"/>
<text x="338" y="76" class="fg-t sm acc">正常：快取命中 95%</text>
<text x="100" y="170" text-anchor="middle" class="fg-t sm acc">穩定區</text>
<line x1="150" y1="210" x2="600" y2="210" class="fg-l warm"/>
<text x="370" y="230" class="fg-t sm warm">亞穩態：重試與白工撐住壞狀態</text>
<line x1="300" y1="80" x2="300" y2="202" class="fg-l warm"/><polygon points="300,210 295.5,202 304.5,202" class="fg-a warm"/>
<text x="308" y="150" class="fg-t sm warm">觸發：快取清空</text>
<line x1="150" y1="210" x2="150" y2="181" class="fg-l alt"/><polygon points="150,173 145.5,181 154.5,181" class="fg-a alt"/>
<text x="158" y="200" class="fg-t sm alt">負載降到這裡才回得來</text>
</svg><figcaption>同樣的負載，系統可能在上面也可能在下面，看它剛剛經歷過什麼。觸發事件只負責把它推下去；要回到上面，光等觸發原因消失沒用，必須主動把負載壓到脆弱區的左邊。</figcaption></figure>
<p>所以恢復的手段都是「先減負載」：暫時關掉重試、卸載一大部分流量、只放一部分玩家進來、對快取用請求合併讓每個鍵只有一個人去資料庫重建（第 3.5 課），等快取暖了再慢慢放量。預防則是找出你的脆弱狀態：問自己「如果快取命中率掉到 0，資料庫撐得住嗎？」撐不住，就要準備好在那一刻自動卸載。</p>

<h3><span class="badge lv3">專業</span>六、灰色故障：健康檢查說沒事，使用者說有事</h3>
<p>Microsoft 的研究者在 2017 年的論文裡把這種故障叫<b>灰色故障</b>，核心是<b>觀察角度的差異</b>（differential observability）：系統自己的偵測器覺得一切正常，使用者卻感受到故障。例子：</p>
<table>
<tr><th>現象</th><th>健康檢查看到</th><th>使用者看到</th></tr>
<tr><td>一台閘道的網卡掉 2% 封包</td><td>本機的 /health 回 200</td><td>連上這台的玩家，操作常常卡一下</td></tr>
<tr><td>一顆磁碟變慢（還沒壞）</td><td>磁碟狀態正常</td><td>這台機器的 p99 變成十倍</td></tr>
<tr><td>二十台裡有一台拿到錯的設定</td><td>程式有在跑</td><td>5% 的請求回錯誤</td></tr>
<tr><td>雲端主機被鄰居搶 CPU</td><td>行程活著</td><td>延遲忽高忽低，被竊取時間很高（第 4.6 課）</td></tr>
</table>
<p>怎麼抓：<b>從使用者的角度量</b>（用戶端回報的成功率、沿著真實路徑打的合成探測）；<b>拿同儕比</b>：二十台做一樣的事，某一台的錯誤率或延遲明顯比其他台高，就是它。Envoy 這類代理的離群偵測（outlier detection）就是自動做這件事：某一台連續回錯，就先把它踢出負載平衡一段時間。原則是<b>先隔離，再查原因</b>：把一台可疑的機器踢掉，成本遠小於讓 5% 的玩家持續失敗。</p>

<h3><span class="badge lv3">專業</span>七、相依故障：先決定每個相依掛掉時要怎樣</h3>
<p>第 4.2 課算過，串聯的相依會讓可用性相乘下降。實務上更重要的是：<b>每一個相依，都要事先決定它掛掉時你的行為</b>，寫在設計文件裡，而不是事故當下才想。</p>
<table>
<tr><th>相依</th><th>它掛掉時</th><th>理由</th></tr>
<tr><td>做速率限制的 Redis</td><td>放行（fail open），改用每台機器自己的本機限流兜底</td><td>為了擋少數濫用而擋住所有玩家，代價更大</td></tr>
<tr><td>登入與權限驗證</td><td>拒絕（fail closed）</td><td>放行就是資安漏洞</td></tr>
<tr><td>帳本</td><td>拒絕新的回合，已開始的回合照常結算</td><td>點數不能算錯</td></tr>
<tr><td>排行榜、推薦</td><td>隱藏那一塊，或顯示稍早的快照</td><td>優雅降級，核心照玩</td></tr>
<tr><td>功能旗標、遠端設定</td><td>用最後一次成功拿到的值</td><td>靜態穩定</td></tr>
</table>
<p><b>靜態穩定</b>（static stability）是 AWS 常講的設計原則：相依的東西（特別是「控制面」，例如設定服務、擴展服務）掛掉時，系統維持在最後的正常狀態繼續運作，而不是跟著停。例如每個可用區平常就備好足夠的機器，而不是指望某個區域出事時才臨時擴展，因為出事的時候，擴展服務本身可能也不能用。</p>
<p>還有兩個陷阱。一是<b>很少跑到的備援路徑</b>：一年才觸發一次的降級邏輯，真的要用時常常是壞的，所以要嘛定期演練它，要嘛乾脆讓它變成平常就在走的路。二是<b>循環相依</b>：用來修 X 的工具，不能相依 X。監控、警報、部署工具、處理手冊、甚至門禁卡，如果都跑在出事的那套系統上，你會在最需要它們的時候失去它們。下面的案例裡會看到兩次。</p>

<h3><span class="badge lv3">專業</span>八、防禦工具箱：怎麼實作</h3>
<h4>逾時與期限傳遞</h4>
<p>每一個網路呼叫都要有逾時，而且越裡面越短（第 1.6 課）。更進一步是<b>期限傳遞</b>（deadline propagation）：最外層決定「這個請求總共只能花 300 ms」，往下每一層都只拿剩下的時間，時間到了就整條鏈一起放棄，不做白工。gRPC 內建這件事；Go 的 <code>context</code> 讓它幾乎不用額外寫：</p>
<pre><code>ctx, cancel := context.WithTimeout(
    r.Context(), 300*time.Millisecond)
defer cancel()
// 查詢和下游呼叫都帶同一個 ctx：
// 期限一到，全部一起取消
row := db.QueryRowContext(ctx,
    "SELECT points FROM balances WHERE player_id = $1",
    id)</code></pre>
<h4>斷路器</h4>
<p><b>斷路器</b>（circuit breaker）就像家裡的保險絲：連續出事就跳開，先不要再呼叫那個相依，直接回失敗，讓它有空間恢復，也讓自己不用空等。它是一個三狀態的狀態機：</p>
<figure class="figure"><svg viewBox="0 44 640 180" class="fg" style="width:100%;max-width:640px" role="img" aria-label="斷路器狀態機：關閉時請求照常通過，失敗率超過門檻就切到開啟，開啟時直接失敗；冷卻時間到切到半開，放少量試探請求，成功回到關閉，失敗回到開啟">
<rect x="30" y="60" width="170" height="60" rx="8" class="fg-b hot"/>
<text x="115" y="86" text-anchor="middle" class="fg-t acc">關閉（closed）</text>
<text x="115" y="106" text-anchor="middle" class="fg-t sm">照常呼叫，統計失敗率</text>
<rect x="440" y="60" width="170" height="60" rx="8" class="fg-b warm"/>
<text x="525" y="86" text-anchor="middle" class="fg-t warm">開啟（open）</text>
<text x="525" y="106" text-anchor="middle" class="fg-t sm">直接失敗，不呼叫對方</text>
<rect x="235" y="160" width="170" height="50" rx="8" class="fg-b alt"/>
<text x="320" y="181" text-anchor="middle" class="fg-t alt">半開（half-open）</text>
<text x="320" y="199" text-anchor="middle" class="fg-t sm">只放少量試探請求</text>
<line x1="200" y1="76" x2="432" y2="76" class="fg-l warm"/><polygon points="440,76 432,71.5 432,80.5" class="fg-a warm"/>
<text x="320" y="68" text-anchor="middle" class="fg-t sm warm">失敗率超過門檻</text>
<path d="M545 120 V185 H413" class="fg-l"/><polygon points="405,185 413,180.5 413,189.5" class="fg-a"/>
<text x="553" y="158" class="fg-t sm">冷卻時間到</text>
<path d="M235 185 H115 V128" class="fg-l on"/><polygon points="115,120 110.5,128 119.5,128" class="fg-a on"/>
<text x="123" y="158" class="fg-t sm acc">試探成功</text>
<line x1="390" y1="160" x2="452" y2="125" class="fg-l warm"/><polygon points="458,121 453.6,129.4 448.9,121.5" class="fg-a warm"/>
<text x="398" y="134" text-anchor="end" class="fg-t sm warm">試探失敗</text>
</svg><figcaption>開啟狀態讓呼叫方在幾微秒內失敗，而不是等滿逾時。半開狀態是「小心地問一下對方好了沒」，避免一恢復就被全部流量打倒。</figcaption></figure>
<pre><code>type State = 'closed' | 'open' | 'half-open';

class Breaker {
  private state: State = 'closed';
  private fails = 0;
  private openedAt = 0;
  constructor(private threshold = 5,
              private coolMs = 10_000) {}

  async call&lt;T&gt;(fn: () =&gt; Promise&lt;T&gt;) {
    if (this.state === 'open') {
      const waited = Date.now() - this.openedAt;
      if (waited &lt; this.coolMs) {
        throw new Error('circuit open');
      }
      // 冷卻結束，放試探請求
      this.state = 'half-open';
    }
    try {
      const r = await fn();
      this.state = 'closed';
      this.fails = 0;
      return r;
    } catch (e) {
      this.fails++;
      if (this.state === 'half-open'
          || this.fails &gt;= this.threshold) {
        this.state = 'open';
        this.openedAt = Date.now();
      }
      throw e;
    }
  }
}</code></pre>
<p>這是教學用的骨架。正式環境的差別：看一段時間內的<b>失敗率</b>而不是連續失敗次數、半開時嚴格限制只放一兩個請求、慢回應也算失敗、每個相依各一個斷路器、狀態變化要有指標和警報。現成的函式庫：Node.js 的 opossum、Go 的 sony/gobreaker、Java 的 Resilience4j；服務網格（第 2.7 課）也能在代理層做。</p>
<h4>艙壁隔離</h4>
<p>船艙分成好幾格，一格進水，船不會沉。<b>艙壁隔離</b>（bulkhead）是讓每個相依各用一組獨立的資源，一個變慢只會吃光自己那一格：</p>
<figure class="figure"><svg viewBox="0 0 640 210" class="fg" style="width:100%;max-width:640px" role="img" aria-label="左邊共用一個四十條的連線池，被變慢的排行榜全部佔滿，登入與結算排不到；右邊三個相依各有十條，排行榜滿了只影響排行榜">
<text x="160" y="22" text-anchor="middle" class="fg-t lg">共用一個池</text>
<text x="480" y="22" text-anchor="middle" class="fg-t lg">分艙：各用各的</text>
<line x1="320" y1="10" x2="320" y2="200" class="fg-l dim dash"/>
<rect x="62" y="40" width="16" height="16" rx="2" class="fg-b warm"/><rect x="82" y="40" width="16" height="16" rx="2" class="fg-b warm"/><rect x="102" y="40" width="16" height="16" rx="2" class="fg-b warm"/><rect x="122" y="40" width="16" height="16" rx="2" class="fg-b warm"/><rect x="142" y="40" width="16" height="16" rx="2" class="fg-b warm"/><rect x="162" y="40" width="16" height="16" rx="2" class="fg-b warm"/><rect x="182" y="40" width="16" height="16" rx="2" class="fg-b warm"/><rect x="202" y="40" width="16" height="16" rx="2" class="fg-b warm"/><rect x="222" y="40" width="16" height="16" rx="2" class="fg-b warm"/><rect x="242" y="40" width="16" height="16" rx="2" class="fg-b warm"/>
<rect x="62" y="60" width="16" height="16" rx="2" class="fg-b warm"/><rect x="82" y="60" width="16" height="16" rx="2" class="fg-b warm"/><rect x="102" y="60" width="16" height="16" rx="2" class="fg-b warm"/><rect x="122" y="60" width="16" height="16" rx="2" class="fg-b warm"/><rect x="142" y="60" width="16" height="16" rx="2" class="fg-b warm"/><rect x="162" y="60" width="16" height="16" rx="2" class="fg-b warm"/><rect x="182" y="60" width="16" height="16" rx="2" class="fg-b warm"/><rect x="202" y="60" width="16" height="16" rx="2" class="fg-b warm"/><rect x="222" y="60" width="16" height="16" rx="2" class="fg-b warm"/><rect x="242" y="60" width="16" height="16" rx="2" class="fg-b warm"/>
<rect x="62" y="80" width="16" height="16" rx="2" class="fg-b warm"/><rect x="82" y="80" width="16" height="16" rx="2" class="fg-b warm"/><rect x="102" y="80" width="16" height="16" rx="2" class="fg-b warm"/><rect x="122" y="80" width="16" height="16" rx="2" class="fg-b warm"/><rect x="142" y="80" width="16" height="16" rx="2" class="fg-b warm"/><rect x="162" y="80" width="16" height="16" rx="2" class="fg-b warm"/><rect x="182" y="80" width="16" height="16" rx="2" class="fg-b warm"/><rect x="202" y="80" width="16" height="16" rx="2" class="fg-b warm"/><rect x="222" y="80" width="16" height="16" rx="2" class="fg-b warm"/><rect x="242" y="80" width="16" height="16" rx="2" class="fg-b warm"/>
<rect x="62" y="100" width="16" height="16" rx="2" class="fg-b warm"/><rect x="82" y="100" width="16" height="16" rx="2" class="fg-b warm"/><rect x="102" y="100" width="16" height="16" rx="2" class="fg-b warm"/><rect x="122" y="100" width="16" height="16" rx="2" class="fg-b warm"/><rect x="142" y="100" width="16" height="16" rx="2" class="fg-b warm"/><rect x="162" y="100" width="16" height="16" rx="2" class="fg-b warm"/><rect x="182" y="100" width="16" height="16" rx="2" class="fg-b warm"/><rect x="202" y="100" width="16" height="16" rx="2" class="fg-b warm"/><rect x="222" y="100" width="16" height="16" rx="2" class="fg-b warm"/><rect x="242" y="100" width="16" height="16" rx="2" class="fg-b warm"/>
<text x="160" y="142" text-anchor="middle" class="fg-t sm">40 條全被變慢的排行榜卡住</text>
<text x="160" y="166" text-anchor="middle" class="fg-t sm warm">登入、結算：排不到，一起逾時</text>
<text x="352" y="53" class="fg-t sm">排行榜</text>
<rect x="410" y="40" width="16" height="16" rx="2" class="fg-b warm"/><rect x="430" y="40" width="16" height="16" rx="2" class="fg-b warm"/><rect x="450" y="40" width="16" height="16" rx="2" class="fg-b warm"/><rect x="470" y="40" width="16" height="16" rx="2" class="fg-b warm"/><rect x="490" y="40" width="16" height="16" rx="2" class="fg-b warm"/><rect x="510" y="40" width="16" height="16" rx="2" class="fg-b warm"/><rect x="530" y="40" width="16" height="16" rx="2" class="fg-b warm"/><rect x="550" y="40" width="16" height="16" rx="2" class="fg-b warm"/><rect x="570" y="40" width="16" height="16" rx="2" class="fg-b warm"/><rect x="590" y="40" width="16" height="16" rx="2" class="fg-b warm"/>
<text x="352" y="83" class="fg-t sm">登入</text>
<rect x="410" y="70" width="16" height="16" rx="2" class="fg-b hot"/><rect x="430" y="70" width="16" height="16" rx="2" class="fg-b hot"/><rect x="450" y="70" width="16" height="16" rx="2" class="fg-b hot"/><rect x="470" y="70" width="16" height="16" rx="2" class="fg-b"/><rect x="490" y="70" width="16" height="16" rx="2" class="fg-b"/><rect x="510" y="70" width="16" height="16" rx="2" class="fg-b"/><rect x="530" y="70" width="16" height="16" rx="2" class="fg-b"/><rect x="550" y="70" width="16" height="16" rx="2" class="fg-b"/><rect x="570" y="70" width="16" height="16" rx="2" class="fg-b"/><rect x="590" y="70" width="16" height="16" rx="2" class="fg-b"/>
<text x="352" y="113" class="fg-t sm">結算</text>
<rect x="410" y="100" width="16" height="16" rx="2" class="fg-b hot"/><rect x="430" y="100" width="16" height="16" rx="2" class="fg-b hot"/><rect x="450" y="100" width="16" height="16" rx="2" class="fg-b hot"/><rect x="470" y="100" width="16" height="16" rx="2" class="fg-b hot"/><rect x="490" y="100" width="16" height="16" rx="2" class="fg-b"/><rect x="510" y="100" width="16" height="16" rx="2" class="fg-b"/><rect x="530" y="100" width="16" height="16" rx="2" class="fg-b"/><rect x="550" y="100" width="16" height="16" rx="2" class="fg-b"/><rect x="570" y="100" width="16" height="16" rx="2" class="fg-b"/><rect x="590" y="100" width="16" height="16" rx="2" class="fg-b"/>
<text x="480" y="142" text-anchor="middle" class="fg-t sm">排行榜滿了，只擋排行榜</text>
<text x="480" y="166" text-anchor="middle" class="fg-t sm acc">登入、結算照常</text>
</svg><figcaption>同樣是 30 到 40 條連線，分成三格之後，變慢的排行榜只能吃光自己的 10 條。其他功能完全不受影響。</figcaption></figure>
<p>在 Go 裡，一個有容量的 channel 就是最簡單的艙壁。注意滿了是<b>立刻拒絕</b>，不是排隊等：</p>
<pre><code>// 排行榜最多同時 10 個
var lbSlots = make(chan struct{}, 10)

func getLeaderboard(ctx context.Context) ([]Entry, error) {
    select {
    case lbSlots &lt;- struct{}{}:
        defer func() { &lt;-lbSlots }()
        return fetchLeaderboard(ctx)
    default:
        // 滿了：快速失敗，前端顯示稍早的快照
        return nil, ErrBusy
    }
}</code></pre>
<h4>卸載與背壓</h4>
<p>系統整體超過容量時，快速拒絕一部分請求（卸載），並依優先順序丟：先丟排行榜，最後才丟結算和登入；第 4.4 課講過允入控制和怎麼量。佇列兩端的速度不一樣時，讓上游慢下來（背壓），第 3.7 課講過。即時層有一個特別的版本：<b>慢讀者</b>。某個玩家網路很差，伺服器推給他的訊息在送出緩衝區越堆越多。Node.js 的 <code>ws</code> 套件可以看 <code>bufferedAmount</code>：超過例如 1 MB，就先丟掉不重要的訊息（別人的動畫），再超過就斷線讓他重連。不然一個網路差的玩家，能慢慢吃光一台閘道的記憶體。</p>

<h3><span class="badge lv4">專家</span>九、控制爆炸半徑：細胞、洗牌分片、分階段發布</h3>
<p>上面的防禦都在「讓故障不要擴散」。另一個方向是「就算擴散，也只擴散到一小塊」。這叫控制<b>爆炸半徑</b>（blast radius）。</p>
<ul>
<li><b>細胞化</b>：整套系統複製成 N 份，每份服務 1/N 的玩家（第 8.2 課）。一個細胞因為壞資料或壞版本倒下，只影響那一份。</li>
<li><b>洗牌分片</b>（shuffle sharding）：有 8 台房間伺服器，每個房間隨機分到其中 2 台。一個會讓伺服器當掉的「毒房間」，最多打倒它那 2 台。8 台選 2 台有 28 種組合，另一個房間剛好跟它分到同樣 2 台的機率只有 1/28，約 3.6%。如果是普通的分片（8 台分成 4 組、每組 2 台），同組的機率是 25%。AWS 的 Route 53 就是用這個方法隔離客戶之間的影響。</li>
<li><b>設定和資料也要分階段發布</b>：程式碼大家都知道要金絲雀發布，設定檔、規則、政策資料卻常常一按就推到全球。下面的案例裡就有兩次。2024 年 7 月 CrowdStrike 的一個內容更新檔一次推到全球，讓約 850 萬台 Windows 電腦藍屏，也是同一個教訓。</li>
</ul>

<h3><span class="badge lv4">專家</span>十、真實事故：一個一個對回去</h3>
<p>下面都是公司自己公開的事後檢討，細節以原文為準。看的時候，練習用這一章的詞彙替它分類。</p>
<h4>AWS S3，2017 年 2 月（美東）</h4>
<p>一位工程師照既有的操作手冊下指令，要移除少量 S3 計費系統用的伺服器，參數打錯，移除了多很多的伺服器，其中包括兩個核心子系統。它們必須完整重啟，而在大區域裡已經好幾年沒有完整重啟過，花的時間比預期長得多，S3 在美東中斷約四小時。連 AWS 自己的服務狀態頁都因為相依 S3 而一度無法更新。<b>分類</b>：人為操作沒有限制爆炸半徑、冷啟動、循環相依。<b>改進</b>：工具改成慢慢移除容量，而且不允許低於最低需求。</p>
<h4>Cloudflare，2019 年 7 月</h4>
<p>一條新的 WAF 規則裡，有個正規表示式在某些輸入下會大量回溯（catastrophic backtracking）。規則一次推到全球所有機器，處理 HTTP 流量的 CPU 全部衝到 100%，全球服務中斷約 27 分鐘。<b>分類</b>：設定變更沒有分階段發布、單一輸入吃光 CPU。<b>改進</b>：規則也走分階段發布、補回被意外移除的 CPU 保護、改用有執行時間保證的正規表示式引擎。</p>
<h4>Facebook，2021 年 10 月</h4>
<p>例行維護時，一個用來評估骨幹網路容量的指令，意外切斷了所有資料中心之間的骨幹連線；本來該擋下它的稽核工具有 bug。DNS 伺服器發現連不到資料中心，照設計撤回了自己的 BGP 路由宣告，Facebook、Instagram、WhatsApp 從網路上消失約六小時。內部工具也跟著連不上，工程師必須到機房現場處理。恢復時還要分批開流量，避免電力和快取被一次打爆。<b>分類</b>：循環相依、自動化的健康反應把局部問題放大成全面消失、恢復時的驚群。</p>
<h4>AWS，2021 年 12 月（美東）</h4>
<p>一個自動擴展內部服務容量的動作，觸發了內部網路裡大量用戶端的異常行為，連線活動暴增，壓垮了內部網路和主網路之間的網路設備。延遲又引發更多連線嘗試和重試，形成重試風暴；監控資料也受影響，讓診斷變慢。影響持續好幾個小時。<b>分類</b>：重試風暴、亞穩態、監控相依於出事的系統。</p>
<h4>Roblox，2021 年 10 月</h4>
<p>一個遊戲平台的 73 小時停機。幾乎所有服務都靠同一個 Consul 叢集做服務發現和健康檢查，而這個叢集在高負載下效能崩潰，原因是新啟用的串流功能造成的爭用，加上它底層儲存（BoltDB）的一個效能問題。核心相依倒下，所有服務一起停。恢復時還要讓快取慢慢暖起來、分批讓玩家回來。<b>分類</b>：所有東西共用一個相依（共因故障）、冷啟動。</p>
<h4>Google Cloud，2025 年 6 月</h4>
<p>負責 API 配額與政策檢查的 Service Control 新增了一段程式，這段程式沒有用功能旗標保護。一筆含有空白欄位的政策資料在幾秒內複製到全球，觸發空指標錯誤，讓各區域的這個服務一起崩潰重啟。在較大的區域，大量任務同時重啟，又因為沒有隨機的指數退避，對底層資料庫造成驚群，拖長了恢復時間。<b>分類</b>：全球同步的資料變更、缺少抖動的驚群。</p>
<p>把六個案例放在一起，最常出現的不是「硬體壞了」，而是三件事：<b>一個變更一次推到所有地方</b>、<b>恢復或重試時大家一起來</b>、<b>修復工具相依於出事的系統</b>。這三件事，正好就是這一章的防禦重點。</p>

<h3>十一、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>重試讓系統更可靠</td><td>對偶發錯誤是；對過載是火上加油。重試要只在一層、有預算、有抖動，而且只用在冪等操作上。</td></tr>
<tr><td>故障排除了，系統自然會恢復</td><td>亞穩態故障在觸發原因消失後還會自己撐住。要主動降負載才回得來。</td></tr>
<tr><td>健康檢查通過就代表沒事</td><td>灰色故障的定義就是「偵測器看不到」。要從使用者的角度量，並拿同儕比。</td></tr>
<tr><td>逾時設長一點比較保險</td><td>逾時越長，變慢時卡住的資源越多，連鎖故障越快。逾時要依實際延遲設，越裡面越短。</td></tr>
<tr><td>斷路器開啟代表系統壞了</td><td>斷路器開啟是保護機制在正常運作：它把慢變成快速失敗，讓對方有機會恢復。</td></tr>
<tr><td>只要程式碼有金絲雀發布就安全了</td><td>設定、規則、政策資料也會讓整個服務倒下，也要分階段發布、能快速回復。</td></tr>
</table>

<h3>十二、跟你的工作連起來</h3>
<ul>
<li><b>前端與遊戲用戶端（TypeScript、Cocos、Unity）</b>：斷線重連一定要指數退避加全抖動；收到 503 或 429 要照 <code>Retry-After</code> 等；不要在 <code>update</code> 裡每一格都打 API。十五萬個用戶端的一個小 bug，就是一場驚群。</li>
<li><b>Node.js 後端</b>：每個 <code>fetch</code> 都帶 <code>AbortSignal.timeout()</code>；外部呼叫包一層斷路器；WebSocket 伺服器看 <code>bufferedAmount</code> 處理慢讀者；不要讓一個慢相依卡住事件迴圈裡的所有請求。</li>
<li><b>Go 後端</b>：<code>context</code> 一路往下傳，期限就自動傳遞；用帶容量的 channel 做艙壁；<code>http.Client</code> 一定要設 <code>Timeout</code>，零值代表永遠等下去。</li>
<li><b>Docker、Kubernetes 與雲端</b>：存活探針不檢查相依；部署分批、設 PodDisruptionBudget（第 2.4 課）；設定變更走跟程式碼一樣的管線。</li>
</ul>

<h3>十三、面試會怎麼問</h3>
<ol>
<li>「什麼是連鎖故障？舉一個例子，並說你會怎麼防。」</li>
<li>「重試有什麼危險？你會怎麼設計重試？」</li>
<li>「說說斷路器的三個狀態，以及它跟逾時、重試怎麼搭配。」</li>
<li>「快取重啟後，資料庫一直起不來，即使快取早就好了。發生了什麼事？怎麼救？」</li>
<li>「某個服務的錯誤率上升到 3%，但所有健康檢查都是綠的。你怎麼查？」</li>
<li>「挑一個你知道的公開大事故，說它發生了什麼、學到什麼。」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>一個元件變慢，呼叫它的服務因為等待而耗盡連線池、執行緒或記憶體，自己也變慢，再往上傳染；健康檢查失敗把機器踢掉，又讓剩下的負載更重。防法：每個呼叫設逾時並傳遞期限、艙壁隔離每個相依的資源、斷路器把慢變成快速失敗、超過容量時依優先順序卸載、健康檢查不檢查相依。</li>
<li>重試會在對方過載時放大流量，多層重試是相乘的（三層各三次就是 27 倍），沒有抖動的退避讓大家同時回來，非冪等操作重試會重複執行。設計：只在一層重試、最多兩三次、指數退避加全抖動、全域的重試預算（例如不超過一成）、尊重 Retry-After、只重試可重試的錯誤，寫入要有冪等鍵。</li>
<li>關閉時正常呼叫並統計失敗率；超過門檻就開啟，直接失敗不呼叫；冷卻時間後半開，放少量試探請求，成功就關閉、失敗就再開啟。搭配：逾時決定「單次呼叫多久算失敗」，並把慢也算成失敗；重試在斷路器外面時，斷路器開啟的錯誤不應該被重試；斷路器開啟時要有降級的回應。</li>
<li>亞穩態故障：系統平常靠高命中率的快取撐著，快取清空後資料庫過載，查詢逾時所以沒寫回快取，用戶端又重試，形成自我維持的迴圈。救法是先降負載：關閉或限制重試、卸載大部分流量、用請求合併讓每個鍵只有一個人重建、讓快取暖起來後再逐步放量。預防：評估「命中率掉到 0」時的負載，並準備自動卸載。</li>
<li>這是灰色故障的徵兆。按實例、可用區、版本、用戶端類型把錯誤率拆開，看是不是集中在某一台或某一群；對照最近的部署和設定變更；從用戶端或合成探測的角度量；找出離群的那一台後先把它踢出流量，再查網卡、磁碟、設定差異。</li>
<li>例如 Cloudflare 2019：WAF 規則的正規表示式造成大量回溯，規則一次推到全球，CPU 全部滿載約 27 分鐘。學到：設定和規則也要分階段發布，單一輸入的運算成本要有上限。好的回答會講出觸發、放大機制和改進，而不只是講結果。</li>
</ol>
</details>

<h3>十四、練功題（做得出來才算真的懂）</h3>
<ol>
<li>大廳 API 每秒 800 個請求，每個呼叫一次排行榜服務。排行榜平常 25 ms，出事時變成 3 秒。大廳對排行榜的連線池是 40 條。正常和出事時，各需要幾條連線？出事時會發生什麼事？</li>
<li>一條呼叫鏈有四層，每層最多試 2 次（1 次加 1 次重試）。最底層最多收到幾倍？如果只有最外層重試呢？</li>
<li>十萬個用戶端在同一秒斷線，用全抖動在 0 到 20 秒之間重連。平均每秒有多少重連？如果不加抖動、都在第 1 秒重連呢？</li>
<li>用第八節的 <code>Breaker</code>，門檻 5、冷卻 10 秒。對方從第 0 秒開始全掛，每秒有 100 個請求進來。前 10 秒，有幾個請求真的打到對方？</li>
<li>替猜高低平台列出五個相依，各自決定 fail open 還是 fail closed，並寫一句理由。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>正常：800 × 0.025 = 20 條，池子用一半。出事：800 × 3 = 2,400 條，遠超過 40 條，第 41 個之後全部排隊，大廳的請求跟著變慢，如果大廳其他功能也共用這個執行緒或連線資源，整個大廳都會被拖垮。對策是排行榜呼叫設短逾時（例如 100 ms）、艙壁、斷路器，以及失敗時顯示快照。</li>
<li>2 × 2 × 2 × 2 = 16 倍。只在最外層重試，最底層最多 2 倍。</li>
<li>100,000 ÷ 20 = 每秒約 5,000 次。不加抖動就是 1 秒內 100,000 次，是 20 倍的尖峰。</li>
<li>前 5 個請求失敗後斷路器開啟，接下來到第 10 秒前都直接失敗，不打到對方。如果第 5 個失敗發生在第 0.05 秒左右，冷卻要到第 10.05 秒才結束，所以前 10 秒只有 5 個請求真的打到對方。沒有斷路器的話是 1,000 個，而且每個都要等到逾時。</li>
<li>例如：做速率限制的 Redis，fail open 加本機限流，避免擋掉所有玩家；登入驗證，fail closed，放行就是漏洞；帳本，fail closed，拒絕新回合，點數不能錯；排行榜，降級顯示快照，不影響核心玩法；功能旗標服務，用最後一次的值，保持靜態穩定。</li>
</ol>
</details>

<h3>十五、想再挖深</h3>
<ul>
<li><b>Michael Nygard《Release It!》第二版</b>：逾時、斷路器、艙壁這些穩定性模式的經典出處，充滿真實的事故故事。</li>
<li><b>Google《Site Reliability Engineering》第 21 章〈Handling Overload〉與第 22 章〈Addressing Cascading Failures〉</b>（<a href="https://sre.google/books/">sre.google/books</a>）：重試預算、用戶端節流、連鎖故障的完整討論。</li>
<li><b>Amazon Builders' Library</b>（<a href="https://aws.amazon.com/builders-library/">aws.amazon.com/builders-library</a>）：〈Timeouts, retries, and backoff with jitter〉、〈Static stability using Availability Zones〉、〈Avoiding fallback in distributed systems〉、〈Workload isolation using shuffle-sharding〉，每篇都短而深。</li>
<li><b>Bronson 等人〈Metastable Failures in Distributed Systems〉</b>（HotOS 2021）與 <b>Huang 等人〈Gray Failure: The Achilles' Heel of Cloud-Scale Systems〉</b>（HotOS 2017）：亞穩態和灰色故障的原始論文，都只有幾頁。</li>
<li><b>Dan Luu 整理的 post-mortems 清單</b>（GitHub 上的 danluu/post-mortems）：上百篇公開事後檢討的連結，按類型分類，是練習「替事故分類」最好的材料。</li>
</ul>
` });
