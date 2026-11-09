DEEP({ 'slo': `
<p>上一課講了 SLI、SLO、SLA 三個名詞，和「錯誤預算花光就停下來修」這個約定。這一章把它變成你真的能落地的東西：從使用者的操作流程挑出該量的指標、把 SLO 寫成一句沒有模糊空間的話、用真實的數字算預算、設計不會半夜亂叫又不會漏掉災難的警報、算出整個系統可用性的上限、在相依服務壞掉時優雅地退一步，最後看 SLO 怎麼回過頭來決定你的架構和上版方式。這是 SRE 職缺面試必考、也是團隊吵架時最有用的一章。</p>

<h3><span class="badge lv1">基礎</span>一、SLI 從使用者的操作流程來</h3>
<p>想像你在評一條公車路線好不好。乘客在乎的是「車有沒有在說好的時間內來」「上車後有沒有準時到站」，不是引擎轉速或司機今天心情。服務也一樣：<b>SLI 要量使用者感受得到的東西</b>，CPU 使用率 90% 但每個請求都很快，使用者根本不在乎。</p>
<p>做法是先畫出<b>使用者旅程</b>（user journey）。以猜高低遊戲為例：打開遊戲 → 登入 → 進大廳 → 開一局 → 猜高或低 → 看結果 → 看排行榜。挑出「壞了使用者會立刻離開」的幾條，通常三到五條就夠，每條配一兩個 SLI。SLI 的標準寫法是一個比例：</p>
<div class="note"><b>SLI ＝ 好的事件數 ÷ 有效的事件數</b>。結果永遠在 0% 到 100% 之間，越高越好，所有 SLI 就能用同一套方法算預算、發警報。</div>
<table>
<tr><th>旅程</th><th>SLI 類型</th><th>「好」的定義</th></tr>
<tr><td>登入、開一局、猜</td><td>可用性</td><td>回應不是 5xx、也沒有逾時</td></tr>
<tr><td>開一局、猜</td><td>延遲</td><td>300 ms 內完成</td></tr>
<tr><td>排行榜</td><td>新鮮度</td><td>顯示的資料落後實際成績不超過 60 秒</td></tr>
<tr><td>結算</td><td>正確性</td><td>對帳程式抽查，金額與紀錄一致</td></tr>
</table>
<p>「有效」也要定義：健康檢查、已知的機器人流量、使用者自己送錯參數造成的 4xx，通常不算在分母裡，否則數字會被灌水或被冤枉。</p>
<h4>在哪裡量</h4>
<figure class="figure"><svg viewBox="0 0 660 226" class="fg" style="width:100%;max-width:660px" role="img" aria-label="請求從瀏覽器經過 CDN、負載平衡器、應用程式到資料庫；真實使用者監測與外部探測看得到整條路，負載平衡器日誌只看得到它之後，應用程式指標看得最少">
<rect x="20" y="20" width="110" height="44" rx="6" class="fg-b"/><text x="75" y="47" text-anchor="middle" class="fg-t">瀏覽器</text>
<rect x="150" y="20" width="110" height="44" rx="6" class="fg-b"/><text x="205" y="47" text-anchor="middle" class="fg-t">CDN</text>
<rect x="280" y="20" width="110" height="44" rx="6" class="fg-b"/><text x="335" y="47" text-anchor="middle" class="fg-t">負載平衡器</text>
<rect x="410" y="20" width="110" height="44" rx="6" class="fg-b"/><text x="465" y="47" text-anchor="middle" class="fg-t">應用程式</text>
<rect x="540" y="20" width="100" height="44" rx="6" class="fg-b"/><text x="590" y="47" text-anchor="middle" class="fg-t">資料庫</text>
<line x1="130" y1="42" x2="142" y2="42" class="fg-l"/><polygon points="150,42 142,37.5 142,46.5" class="fg-a"/>
<line x1="260" y1="42" x2="272" y2="42" class="fg-l"/><polygon points="280,42 272,37.5 272,46.5" class="fg-a"/>
<line x1="390" y1="42" x2="402" y2="42" class="fg-l"/><polygon points="410,42 402,37.5 402,46.5" class="fg-a"/>
<line x1="520" y1="42" x2="532" y2="42" class="fg-l"/><polygon points="540,42 532,37.5 532,46.5" class="fg-a"/>
<text x="24" y="96" class="fg-t sm acc">真實使用者監測（RUM）：最真實，雜訊也多</text>
<line x1="20" y1="104" x2="640" y2="104" class="fg-l on"/><line x1="20" y1="98" x2="20" y2="110" class="fg-l on"/><line x1="640" y1="98" x2="640" y2="110" class="fg-l on"/>
<text x="24" y="134" class="fg-t sm alt">外部探測：照使用者的路走，但樣本少</text>
<line x1="20" y1="142" x2="640" y2="142" class="fg-l alt"/><line x1="20" y1="136" x2="20" y2="148" class="fg-l alt"/><line x1="640" y1="136" x2="640" y2="148" class="fg-l alt"/>
<text x="284" y="172" class="fg-t sm">負載平衡器日誌：量大精確，看不到前面</text>
<line x1="280" y1="180" x2="640" y2="180" class="fg-l"/><line x1="280" y1="174" x2="280" y2="186" class="fg-l"/><line x1="640" y1="174" x2="640" y2="186" class="fg-l"/>
<text x="414" y="208" class="fg-t sm warm">應用程式指標：自己當掉時算不到</text>
<line x1="410" y1="216" x2="640" y2="216" class="fg-l warm"/><line x1="410" y1="210" x2="410" y2="222" class="fg-l warm"/><line x1="640" y1="210" x2="640" y2="222" class="fg-l warm"/>
</svg><figcaption>每一條線是一種量法看得到的範圍。越靠近使用者越真實，但也越吵、越難收集。實務上最常用的是負載平衡器日誌，再加外部探測補前段。</figcaption></figure>
<p>最容易被忽略的是最下面那條：應用程式自己統計的成功率，<b>永遠會高估</b>。Pod 當掉時，負載平衡器回給使用者 502，但那個 Pod 已經死了，不可能把這次失敗記進自己的指標。所以 SLI 至少要從負載平衡器那一層量起。</p>

<h3><span class="badge lv1">基礎</span>二、把 SLO 寫成一句沒有模糊空間的話</h3>
<p>「API 要穩定」不是 SLO。一個完整的 SLO 要回答四件事：量什麼、在哪裡量、多長的時間窗、目標是多少。</p>
<ul>
<li><b>可用性</b>：「在負載平衡器量到的開局與猜測請求中，以 28 天滾動計算，99.9% 不是 5xx 也沒有逾時。」</li>
<li><b>延遲</b>：「同一批請求中，99% 在 300 ms 內完成，99.9% 在 1 秒內完成。」</li>
<li><b>新鮮度</b>：「排行榜在 99% 的時間裡，落後實際成績不超過 60 秒。」</li>
</ul>
<p>時間窗有兩種。<b>滾動窗</b>（例如最近 28 天）每天都在往前移，比較能反映使用者「最近」的體驗，選 28 天是為了剛好涵蓋四個完整的星期，週末效應不會時多時少；<b>日曆窗</b>（例如每個月）在月初歸零，適合對外報告和合約。內部用滾動窗，對外報告用日曆窗，是常見的組合。</p>
<p>每多一個 9，允許出錯的時間就少十倍。以 30 天計算：</p>
<table>
<tr><th>SLO</th><th>每月可以壞多久</th><th>白話</th></tr>
<tr><td>99%</td><td>7.2 小時</td><td>一個工作天</td></tr>
<tr><td>99.5%</td><td>3.6 小時</td><td>半個工作天</td></tr>
<tr><td>99.9%</td><td>43.2 分鐘</td><td>一次沒處理好的事故</td></tr>
<tr><td>99.95%</td><td>21.6 分鐘</td><td>一次快速回滾</td></tr>
<tr><td>99.99%</td><td>4.3 分鐘</td><td>人還沒打開電腦就用完了</td></tr>
<tr><td>99.999%</td><td>26 秒</td><td>只有自動化來得及</td></tr>
</table>
<p>目標怎麼訂？先看歷史：過去三個月實際做到多少。訂得比歷史高很多，第一個月就爆預算，大家很快就不再理它；訂得太低，使用者早就在抱怨了你還覺得沒事。從「使用者開始抱怨的那條線」和「歷史實績」之間挑一個，之後每季檢討調整。</p>

<h3><span class="badge lv2">進階</span>三、錯誤預算：用真實數字算一個月</h3>
<p>猜高低的開局 API 平均每秒 20 個請求。30 天就是 20 × 86,400 × 30 = 51,840,000 個請求。SLO 99.9%，<b>錯誤預算就是 0.1%，也就是 51,840 個失敗請求</b>。這個月發生了兩件事：</p>
<ul>
<li>第 6 天，一次上版出錯，10 分鐘內所有請求都失敗：20 × 600 = 12,000 個，用掉預算的 23%。</li>
<li>第 17 天，資料庫變慢 30 分鐘，四分之一的請求逾時：20 × 1,800 × 25% = 9,000 個，再用掉 17%。</li>
</ul>
<figure class="figure"><svg viewBox="0 0 660 244" class="fg" style="width:100%;max-width:660px" role="img" aria-label="30 天的錯誤預算消耗圖：平時緩慢下降，第 6 天上版出錯掉 23%，第 17 天資料庫變慢掉 17%，月底剩 45%；另畫出 50% 與 25% 兩條政策門檻">
<line x1="70" y1="210" x2="630" y2="210" class="fg-l dim"/><line x1="70" y1="30" x2="70" y2="210" class="fg-l dim"/>
<text x="62" y="34" text-anchor="end" class="fg-t sm">100%</text><text x="62" y="124" text-anchor="end" class="fg-t sm">50%</text><text x="62" y="214" text-anchor="end" class="fg-t sm">0%</text>
<line x1="70" y1="120" x2="630" y2="120" class="fg-l dash"/><text x="76" y="114" class="fg-t sm warm">剩 50%：上版要走金絲雀</text>
<line x1="70" y1="165" x2="630" y2="165" class="fg-l dash"/><text x="76" y="159" class="fg-t sm warm">剩 25%：只上修正</text>
<line x1="70" y1="30" x2="630" y2="210" class="fg-l dim dash"/>
<polyline points="70,30 182,35.4 182,76.8 387.3,86.7 387.3,117.3 630,129" class="fg-l on"/>
<text x="190" y="62" class="fg-t sm warm">上版出錯：−23%</text>
<text x="395" y="106" class="fg-t sm warm">資料庫變慢：−17%</text>
<text x="626" y="146" text-anchor="end" class="fg-t sm acc">月底剩 45%</text>
<text x="70" y="230" text-anchor="middle" class="fg-t sm">第 0 天</text><text x="256.7" y="230" text-anchor="middle" class="fg-t sm">10</text><text x="443.3" y="230" text-anchor="middle" class="fg-t sm">20</text><text x="630" y="230" text-anchor="middle" class="fg-t sm">30</text>
</svg><figcaption>綠線是剩下的預算。灰色斜虛線是「以剛好均勻的速度、月底剛好燒完」的路線，綠線在它上面就是安全的。兩條水平虛線是團隊事先寫好的政策門檻。</figcaption></figure>
<p>平常的零星錯誤每天再吃掉一點，月底剩下約 45%。這個數字本身就是決策依據：月底前跌破了 50%，照下面的政策，接下來每次上版都要先走金絲雀；如果再跌破 25%，就只上修正。這些都是事先講好的，不用開會吵。</p>
<h4>錯誤預算政策要寫下來</h4>
<p>沒有政策的錯誤預算只是一張漂亮的圖。政策由產品負責人和工程負責人一起簽，內容像這樣：</p>
<ol>
<li>剩餘預算高於 50%：正常上版。</li>
<li>低於 50%：每次上版都要經過金絲雀（canary）階段，非必要的高風險變更延後。</li>
<li>低於 25%：只上錯誤修正與可靠性改善。</li>
<li>用完：凍結功能上版，直到 28 天滾動窗回到 SLO 以內。資安修補例外。</li>
<li>任何單一事故吃掉超過 20% 的預算，都要寫事後檢討（postmortem），並排入改善項目。</li>
</ol>
<p>預算也是拿來<b>花</b>的：還有剩，就可以做演練、做資料庫升級、試新架構。一直用不完，代表 SLO 可能訂得太嚴，或是你們太保守了。</p>

<h3><span class="badge lv2">進階</span>四、消耗速率警報：用數字算給你看</h3>
<p>最直覺的警報是「錯誤率超過 1% 就叫人」。它有兩個問題：錯誤率 0.5% 持續三天，預算早就燒光了，它卻從來沒響；錯誤率 1.2% 只持續兩分鐘，對預算幾乎沒影響，它卻在半夜把人叫醒。正確的問題是：<b>照現在的速度，預算多快會燒完？</b></p>
<p><b>消耗速率</b>（burn rate）＝ 實際錯誤率 ÷ 允許的錯誤率。SLO 99.9% 允許 0.1%；實際錯誤率 1% 時，消耗速率是 10，代表 30 天的預算只夠撐 3 天。Google SRE Workbook 建議的多視窗、多消耗速率設定是：</p>
<table>
<tr><th>動作</th><th>長窗</th><th>短窗</th><th>消耗速率</th><th>99.9% 時的錯誤率門檻</th><th>觸發時已用掉</th></tr>
<tr><td>叫人</td><td>1 小時</td><td>5 分鐘</td><td>14.4</td><td>1.44%</td><td>2%</td></tr>
<tr><td>叫人</td><td>6 小時</td><td>30 分鐘</td><td>6</td><td>0.6%</td><td>5%</td></tr>
<tr><td>開工單</td><td>3 天</td><td>6 小時</td><td>1</td><td>0.1%</td><td>10%</td></tr>
</table>
<p>數字怎麼來的：30 天有 720 小時。消耗速率 14.4 持續 1 小時，用掉 14.4 ÷ 720 = 2% 的預算；6 持續 6 小時是 36 ÷ 720 = 5%；1 持續 3 天是 72 ÷ 720 = 10%。也就是說，<b>每一條警報都對應「已經燒掉多少預算」</b>，而不是一個拍腦袋的錯誤率。</p>
<figure class="figure"><svg viewBox="0 30 660 216" class="fg" style="width:100%;max-width:660px" role="img" aria-label="錯誤率 2% 從第 5 分鐘開始：5 分鐘窗很快超過門檻 1.44%，1 小時窗到第 48 分鐘才超過，兩者都超過時叫人；第 65 分鐘修好後，5 分鐘窗在一兩分鐘內就降下來，警報解除">
<rect x="429.9" y="40" width="135.9" height="170" class="fg-b hot"/>
<text x="497.9" y="58" text-anchor="middle" class="fg-t sm acc">兩個窗都超過：叫人</text>
<line x1="70" y1="210" x2="630" y2="210" class="fg-l dim"/><line x1="70" y1="40" x2="70" y2="210" class="fg-l dim"/>
<text x="62" y="214" text-anchor="end" class="fg-t sm">0%</text><text x="62" y="146" text-anchor="end" class="fg-t sm">1%</text><text x="62" y="78" text-anchor="end" class="fg-t sm">2%</text>
<line x1="70" y1="112.1" x2="630" y2="112.1" class="fg-l warm dash"/><text x="180" y="132" class="fg-t sm warm">門檻 1.44%（14.4 × 0.1%）</text>
<polyline points="70,210 107.3,210 144.7,74 555.3,74 592.7,210 630,210" class="fg-l alt"/>
<text x="150" y="66" class="fg-t sm alt">5 分鐘窗（幾乎貼著實際錯誤率）</text>
<polyline points="70,210 107.3,210 555.3,74 630,96.6" class="fg-l on"/>
<text x="330" y="176" class="fg-t sm acc">1 小時窗</text>
<text x="548" y="200" text-anchor="end" class="fg-t sm">修好</text>
<text x="70" y="230" text-anchor="middle" class="fg-t sm">0</text><text x="182" y="230" text-anchor="middle" class="fg-t sm">15</text><text x="294" y="230" text-anchor="middle" class="fg-t sm">30</text><text x="406" y="230" text-anchor="middle" class="fg-t sm">45</text><text x="518" y="230" text-anchor="middle" class="fg-t sm">60</text><text x="630" y="230" text-anchor="middle" class="fg-t sm">75 分</text>
</svg><figcaption>錯誤率從第 5 分鐘起穩定在 2%（消耗速率 20）。1 小時窗是慢慢爬上去的平均，第 48 分鐘才過門檻，那一刻剛好燒掉 2% 的預算。綠底區間是警報響著的時間。</figcaption></figure>
<p>用三個情境追一次（SLO 99.9%）：</p>
<ul>
<li><b>整個服務掛掉</b>，錯誤率 100%，消耗速率 1000。1 小時窗的平均在 0.0144 × 60 ≈ 0.86 分鐘、大約 52 秒後就超過 1.44%，5 分鐘窗更快。<b>一分鐘內叫人</b>。</li>
<li><b>錯誤率 2%</b>，消耗速率 20，放著不管 36 小時就燒光一整個月。就是上圖：5 分鐘窗 3.6 分鐘就過門檻，1 小時窗要到 60 × 1.44 ÷ 2 = 43.2 分鐘才過，所以<b>大約 43 分鐘後叫人</b>，那時剛好用掉 2% 的預算。第 65 分鐘修好，5 分鐘窗一兩分鐘內就降下來，警報解除，雖然 1 小時窗還高高的。</li>
<li><b>錯誤率 0.3%</b>，消耗速率 3，兩條叫人的警報都不會響；3 天窗的平均要過 0.1%，需要 72 × 0.1 ÷ 0.3 = 24 小時，<b>一天後開一張工單</b>。照這速度，預算撐 10 天，白天處理完全來得及。</li>
</ul>
<p>長窗負責「確定真的燒掉了不少」，避免兩分鐘的小波動吵醒人；短窗負責「確定現在還在燒」，問題修好後警報能馬上停，不會因為長窗的平均還沒降下來而一直響。寫成 Prometheus 規則：</p>
<pre><code>(
  sum(rate(http_requests_total{status=~"5.."}[1h]))
  / sum(rate(http_requests_total[1h]))
) &gt; (14.4 * 0.001)
and
(
  sum(rate(http_requests_total{status=~"5.."}[5m]))
  / sum(rate(http_requests_total[5m]))
) &gt; (14.4 * 0.001)</code></pre>
<div class="warn"><b>流量很小的服務要另外處理。</b>5 分鐘只有 10 個請求時，錯 1 個就是 10%，馬上觸發叫人。對策：加上「請求數至少多少才判斷」的條件、用外部探測補足流量、或把幾個小服務合併成一個 SLO。</div>

<h3><span class="badge lv3">專業</span>五、可用性的數學：串聯、並聯、修復時間</h3>
<figure class="figure"><svg viewBox="0 0 660 222" class="fg" style="width:100%;max-width:660px" role="img" aria-label="負載平衡器 99.99%，接兩個並聯的應用程式各 99.5%，再接資料庫 99.95%，整體約 99.94%">
<text x="270" y="20" text-anchor="middle" class="fg-t sm alt">並聯：1 − 0.005² ≈ 99.9975%</text>
<rect x="20" y="82" width="120" height="52" rx="6" class="fg-b"/><text x="80" y="104" text-anchor="middle" class="fg-t">負載平衡器</text><text x="80" y="124" text-anchor="middle" class="fg-t sm">99.99%</text>
<path d="M140 108 H170 V56 H192" class="fg-l"/><polygon points="200,56 192,51.5 192,60.5" class="fg-a"/>
<path d="M170 108 V160 H192" class="fg-l"/><polygon points="200,160 192,155.5 192,164.5" class="fg-a"/>
<rect x="200" y="32" width="140" height="48" rx="6" class="fg-b alt"/><text x="270" y="52" text-anchor="middle" class="fg-t">應用程式 A</text><text x="270" y="70" text-anchor="middle" class="fg-t sm">99.5%</text>
<rect x="200" y="136" width="140" height="48" rx="6" class="fg-b alt"/><text x="270" y="156" text-anchor="middle" class="fg-t">應用程式 B</text><text x="270" y="174" text-anchor="middle" class="fg-t sm">99.5%</text>
<path d="M340 56 H370 V108" class="fg-l"/><path d="M340 160 H370 V108" class="fg-l"/>
<line x1="370" y1="108" x2="392" y2="108" class="fg-l"/><polygon points="400,108 392,103.5 392,112.5" class="fg-a"/>
<rect x="400" y="82" width="120" height="52" rx="6" class="fg-b"/><text x="460" y="104" text-anchor="middle" class="fg-t">資料庫</text><text x="460" y="124" text-anchor="middle" class="fg-t sm">99.95%</text>
<line x1="520" y1="108" x2="542" y2="108" class="fg-l on"/><polygon points="550,108 542,103.5 542,112.5" class="fg-a on"/>
<rect x="550" y="82" width="90" height="52" rx="6" class="fg-b hot"/><text x="595" y="104" text-anchor="middle" class="fg-t acc">整體</text><text x="595" y="124" text-anchor="middle" class="fg-t sm acc">≈ 99.94%</text>
<text x="330" y="204" text-anchor="middle" class="fg-t sm">串聯相乘：0.9999 × 0.999975 × 0.9995 ≈ 0.99938</text>
</svg><figcaption>兩個 99.5% 的應用程式並聯後幾乎不會一起壞，整體的上限反而落在只有一份的資料庫上。要提高整體，先找串聯裡最弱、而且只有一份的那一環。</figcaption></figure>
<ul>
<li><b>串聯相乘</b>：每一段都要成功，請求才成功。五個 99.9% 串起來是 0.999<sup>5</sup> ≈ 99.5%。每加一個硬性相依，天花板就再低一點。</li>
<li><b>並聯</b>：全部都壞才算壞，失敗率相乘。兩份 99.5%：1 − 0.005 × 0.005 = 99.9975%。</li>
<li><b>並聯的前提是「獨立」</b>：兩份副本在同一個可用區、吃同一份設定檔、跑同一個有 bug 的版本，就會一起壞，算出來的 99.9975% 只是幻覺。真實的大事故，常常是同一個變更同時推到所有副本。</li>
</ul>
<h4>修復時間跟故障頻率一樣重要</h4>
<p>可用性也可以寫成 平均故障間隔 ÷（平均故障間隔 ＋ 平均修復時間），也就是 MTBF ÷ (MTBF + MTTR)。一個服務每月壞兩次、每次 20 分鐘恢復，就是 40 ÷ 43,200 的時間在壞，大約 99.91%。<b>把修復時間從 20 分鐘縮到 5 分鐘，效果跟故障次數少四倍一樣</b>，而且通常容易得多：一鍵回滾、自動故障轉移、清楚的值班手冊，都是在縮短 MTTR。</p>

<h3><span class="badge lv3">專業</span>六、相依與優雅降級</h3>
<p>把每個相依分成兩類：<b>硬性相依</b>壞了，這個功能就一定壞；<b>軟性相依</b>壞了，功能可以用比較差的方式繼續。你的 SLO 不可能高於所有硬性相依串起來的乘積，所以設計的重點，是把盡量多的相依從硬性變成軟性。</p>
<figure class="figure"><svg viewBox="0 0 660 244" class="fg" style="width:100%;max-width:660px" role="img" aria-label="猜高低的遊戲畫面：中間的開局與猜測是硬性相依，排行榜、好友頭像、活動橫幅都是軟性相依，各有自己的退路">
<rect x="20" y="16" width="620" height="214" rx="10" class="fg-b"/>
<rect x="36" y="30" width="588" height="36" rx="6" class="fg-b warm"/><text x="330" y="53" text-anchor="middle" class="fg-t sm">活動橫幅　壞了 → 整條隱藏，版面往上補</text>
<rect x="36" y="78" width="360" height="138" rx="8" class="fg-b hot"/>
<text x="216" y="136" text-anchor="middle" class="fg-t lg acc">開局、猜高低、看結果</text>
<text x="216" y="160" text-anchor="middle" class="fg-t sm">硬性相依：遊戲服務、資料庫</text>
<text x="216" y="180" text-anchor="middle" class="fg-t sm">這裡壞了，就是真的壞了</text>
<rect x="408" y="78" width="216" height="64" rx="8" class="fg-b alt"/><text x="516" y="103" text-anchor="middle" class="fg-t">排行榜</text><text x="516" y="125" text-anchor="middle" class="fg-t sm">逾時 200 ms → 用一分鐘前的快取</text>
<rect x="408" y="152" width="216" height="64" rx="8" class="fg-b alt"/><text x="516" y="177" text-anchor="middle" class="fg-t">好友頭像</text><text x="516" y="199" text-anchor="middle" class="fg-t sm">載入失敗 → 顯示預設頭像</text>
</svg><figcaption>同一個畫面，四個區塊依賴不同的服務。只有綠色那塊是硬性的；其他三塊各自有退路，壞了玩家照樣能玩，頂多少看到一點東西。</figcaption></figure>
<p>把軟性相依真的做成軟性，要靠這幾樣工具：</p>
<ul>
<li><b>短逾時加退路</b>：排行榜 200 ms 內沒回來就用快取，不要讓它拖住整個頁面。</li>
<li><b>斷路器</b>（circuit breaker）：連續失敗到一個程度就「跳開」，之後的呼叫直接走退路、不再去敲那個已經在喘的服務；過一陣子放幾個請求去試，成功了才「接回」。它保護的是對方，也是你自己的執行緒和連線。</li>
<li><b>隔艙</b>（bulkhead）：每個相依用自己的連線池和執行緒上限，排行榜卡住時，最多只吃掉它自己那一份，不會把開局要用的資源也耗光。</li>
<li><b>負載卸除</b>（load shedding）：快撐不住時，主動對不重要的請求回 503（例如排行榜重新整理），把容量留給開局和猜測。</li>
<li><b>功能開關</b>（feature flag）：出事時能在幾秒內關掉某個功能，不用重新部署。</li>
</ul>
<p>AWS 把更進一步的概念叫做<b>靜態穩定</b>（static stability）：系統在相依壞掉時，不需要做任何改變就能繼續運作。例如事先在每個可用區都放好足夠的機器，一個可用區掛掉時不用「緊急開新機器」（那正好要依賴可能也在出問題的控制平面），剩下的機器本來就扛得住。</p>

<h3><span class="badge lv3">專業</span>七、SLA 與它的缺口</h3>
<p>SLA 是合約，不是工程目標。一份典型的雲端服務 SLA 長這樣：月可用度低於 99.99% 退 10% 的費用、低於 99% 退 30%、低於 95% 全退（實際數字依服務而不同，以合約為準）。看起來很有保障，但有幾個缺口：</p>
<table>
<tr><th>缺口</th><th>實際上</th></tr>
<tr><td>賠的是服務抵用額度（service credit）</td><td>只退那個服務的一部分月費。你停機一小時損失的營收，可能是退款的幾百倍。</td></tr>
<tr><td>「不可用」的定義很窄</td><td>常常要所有可用區都連不上、或錯誤率超過某個比例才算。只壞一半通常不算數。</td></tr>
<tr><td>一堆例外</td><td>排定的維護、你自己的設定錯誤、不可抗力，通常都不算。</td></tr>
<tr><td>要你自己申請</td><td>要在期限內、附上證據提出，不會自動退。</td></tr>
<tr><td>由對方量</td><td>可用度用的是對方的監控數字，不是你看到的。</td></tr>
</table>
<p>這帶出三個實務原則。第一，<b>你的 SLA 一定要比內部 SLO 寬鬆</b>，中間的差距是你的安全邊際。第二，<b>你對外承諾的數字，不能高於你的硬性相依串起來的上限</b>：依賴一個 SLA 99.9% 的第三方付款服務，又沒有任何替代方案，你就不能承諾 99.95%。第三，<b>相依服務的可用性要自己量</b>，用自己的 SLI 監控它，不要只信它的狀態頁。</p>

<h3><span class="badge lv4">專家</span>八、SLO 怎麼回過頭來決定你的架構</h3>
<p>SLO 最大的價值，不是那個百分比，而是它逼你回答：<b>這個數字，需要什麼樣的系統和團隊才做得到？</b></p>
<figure class="figure"><svg viewBox="0 0 660 230" class="fg" style="width:100%;max-width:660px" role="img" aria-label="四個等級的 SLO 對應每月可以壞的時間與需要的做法：99% 單機加上班時間修；99.9% 值班加一鍵回滾；99.99% 自動故障轉移與跨可用區；99.999% 跨區域主動主動與全自動化">
<rect x="20" y="18" width="90" height="44" rx="6" class="fg-b"/><text x="65" y="45" text-anchor="middle" class="fg-t lg">99%</text>
<rect x="118" y="18" width="110" height="44" rx="6" class="fg-b"/><text x="173" y="45" text-anchor="middle" class="fg-t">7.2 小時</text>
<rect x="236" y="18" width="404" height="44" rx="6" class="fg-b"/><text x="248" y="45" class="fg-t">上班時間有人修就好；單機、手動部署也做得到</text>
<rect x="20" y="70" width="90" height="44" rx="6" class="fg-b alt"/><text x="65" y="97" text-anchor="middle" class="fg-t lg">99.9%</text>
<rect x="118" y="70" width="110" height="44" rx="6" class="fg-b alt"/><text x="173" y="97" text-anchor="middle" class="fg-t">43 分鐘</text>
<rect x="236" y="70" width="404" height="44" rx="6" class="fg-b alt"/><text x="248" y="97" class="fg-t">要有值班、幾分鐘內回應、一鍵回滾、至少兩台</text>
<rect x="20" y="122" width="90" height="44" rx="6" class="fg-b hot"/><text x="65" y="149" text-anchor="middle" class="fg-t lg">99.99%</text>
<rect x="118" y="122" width="110" height="44" rx="6" class="fg-b hot"/><text x="173" y="149" text-anchor="middle" class="fg-t">4.3 分鐘</text>
<rect x="236" y="122" width="404" height="44" rx="6" class="fg-b hot"/><text x="248" y="149" class="fg-t">人來不及：自動故障轉移、跨可用區、漸進式上版</text>
<rect x="20" y="174" width="90" height="44" rx="6" class="fg-b warm"/><text x="65" y="201" text-anchor="middle" class="fg-t lg">99.999%</text>
<rect x="118" y="174" width="110" height="44" rx="6" class="fg-b warm"/><text x="173" y="201" text-anchor="middle" class="fg-t">26 秒</text>
<rect x="236" y="174" width="404" height="44" rx="6" class="fg-b warm"/><text x="248" y="201" class="fg-t">跨區域主動－主動、所有變更自動化，成本大幅上升</text>
</svg><figcaption>中間那欄是 30 天裡可以壞的總時間。每往下一格，可以壞的時間少十倍，需要的工程投入和成本卻遠不只十倍。</figcaption></figure>
<p>用數字檢查你的流程能不能撐住 SLO：</p>
<ul>
<li><b>值班的反應時間</b>：SLO 99.9% 每月只有 43 分鐘。如果值班要 15 分鐘才看到警報、再花 30 分鐘定位修好，一次事故就是 45 分鐘，一個月的預算一次燒完。結論：要嘛自動回滾，要嘛把 SLO 訂低一點，不要假裝。</li>
<li><b>金絲雀的大小</b>：新版先給 5% 的流量跑 1 小時。最壞情況新版全壞，等於 5% × 60 = 3 分鐘的全面停機，佔 43.2 分鐘預算的 7%。如果預算只剩 10%，金絲雀就要更小、時間更短，或乾脆延後上版。</li>
<li><b>架構選擇</b>：從 99.9% 升到 99.99%，可以壞的時間從 43 分鐘變成 4 分鐘，任何需要人工判斷的故障轉移都太慢，這直接決定你要不要花錢做跨可用區、自動切換和更細的上版流程。</li>
</ul>
<h4>做得太好也是問題</h4>
<p>Google SRE 書裡記錄過一個故事：內部的鎖服務 Chubby 長期表現遠超過它的 SLO，結果其他團隊開始假設它永遠不會壞，沒有做任何退路。於是 Chubby 團隊在預算還有剩時，刻意安排計畫性停機，把預算「花掉」，逼大家面對它也會壞的事實。你的服務實際上一直跑在 99.999%，別人就會把系統建在這個數字上；哪天你只做到承諾的 99.9%，壞掉的是他們。</p>
<h4>別讓數字被玩壞</h4>
<p>任何被拿來考核的數字，都會被想辦法讓它好看（古德哈特定律，Goodhart's law）：把健康檢查算進分母、把逾時改回 200 加錯誤訊息、把慢的請求排除在「有效」之外。所以 SLI 的定義要寫清楚、放進版本控制，每季檢討一次：這個 SLO 還跟使用者的抱怨對得上嗎？使用者在抱怨、SLO 卻全綠，錯的是 SLO。</p>

<h3>九、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>目標越高越好，最好 100%</td><td>每多一個 9 成本暴增，使用者卻感覺不到；而且 100% 代表永遠不能冒險上版。</td></tr>
<tr><td>CPU、記憶體可以當 SLI</td><td>那是原因，不是使用者感受。它們適合當除錯用的指標，不適合當 SLO。</td></tr>
<tr><td>應用程式自己算的成功率就是可用性</td><td>它看不到自己當掉時的失敗，也看不到前面的 DNS、CDN、負載平衡器。至少要從負載平衡器量。</td></tr>
<tr><td>錯誤率超過某個值就叫人</td><td>會漏掉慢慢燒的問題，又會被短暫波動吵醒。改用多視窗的消耗速率警報。</td></tr>
<tr><td>兩份副本就有兩倍的可靠</td><td>前提是故障獨立。同一個可用區、同一份設定、同一個版本，就會一起壞。</td></tr>
<tr><td>有 SLA 就有保障</td><td>SLA 賠的是一小部分月費，不是你的損失；你的承諾不能高於相依的上限。</td></tr>
</table>

<h3>十、跟你的工作連起來</h3>
<ul>
<li><b>後端（Node.js、Go）</b>：用直方圖記錄延遲，並把 SLO 的門檻（例如 0.3 秒）設成區間邊界，「300 ms 內完成的比例」才會是精確的數字。逾時和重試的設定要對照下游的 SLO，不要讓你的逾時比使用者願意等的還長。</li>
<li><b>前端（Vue、TypeScript）</b>：真實使用者監測是最接近體驗的 SLI，例如「首頁在 3 秒內可以互動的比例」。每個非核心區塊都要有載入失敗的畫面，這就是前端的優雅降級。</li>
<li><b>遊戲（Cocos、Unity）</b>：遊戲的 SLI 常常不是 HTTP：「進入對局成功率」「對局中斷線率」「p95 單幀時間」。用戶端批次回報，伺服器彙整成比例。</li>
<li><b>Docker 與 Kubernetes</b>：PodDisruptionBudget、多副本、跨可用區分散、就緒探針（readiness probe），都是在保護 SLO；滾動更新的速度，也該依剩餘的錯誤預算調整。</li>
<li><b>雲端主機</b>：把每個雲端服務的 SLA 列出來，算一次你的硬性相依乘積。很多團隊第一次算完，才發現自己對外承諾的數字根本做不到。</li>
</ul>

<h3>十一、面試會怎麼問</h3>
<ol>
<li>「SLI、SLO、SLA 差在哪？請用你做過的服務舉例。」</li>
<li>「SLO 99.9%，30 天可以壞多久？錯誤預算用完了，團隊該怎麼做？」</li>
<li>「為什麼不直接設『錯誤率超過 1% 就叫人』？說明多視窗消耗速率警報。」</li>
<li>「三個 99.9% 的服務串聯是多少？兩個 99% 的副本並聯呢？並聯的算法什麼時候不成立？」</li>
<li>「你會怎麼挑 SLI？為什麼應用程式自己的成功率會高估可用性？」</li>
<li>「你依賴一個 SLA 99.9% 的第三方服務，可以對客戶承諾 99.95% 嗎？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>SLI 是量測值，通常是好事件除以有效事件，例如開局請求中非 5xx 且 300 ms 內完成的比例；SLO 是對 SLI 的內部目標，例如 28 天滾動 99.9%；SLA 是對客戶的合約，未達成要賠償，例如月可用度 99.5% 否則退費。SLA 要比 SLO 寬鬆，留安全邊際。</li>
<li>30 天的 0.1% 是 43.2 分鐘（或以請求數計，0.1% 的請求）。用完時依事先簽好的錯誤預算政策：凍結功能上版，只做錯誤修正和可靠性改善，直到滾動窗回到 SLO 以內；資安修補例外；大事故寫事後檢討。重點是政策要事先由產品與工程共同同意。</li>
<li>固定門檻會漏掉低錯誤率但長時間的預算消耗，也會被短暫波動誤觸發。消耗速率是實際錯誤率除以允許錯誤率，代表預算燒多快；長窗確認已燒掉有意義的預算量，短窗確認問題仍在發生、修好後能快速解除。常見設定：1 小時與 5 分鐘、速率 14.4 叫人（用掉 2%）；6 小時與 30 分鐘、速率 6 叫人（5%）；3 天與 6 小時、速率 1 開工單（10%）。</li>
<li>串聯相乘：0.999³ ≈ 99.7%。並聯是 1 減去失敗率相乘：1 − 0.01² = 99.99%。並聯成立的前提是故障互相獨立；同一個可用區、共用設定、同一個版本或同一個相依（例如同一個資料庫），會造成共因故障，實際可用性遠低於計算值。</li>
<li>從使用者旅程出發，挑壞了使用者會立刻感受到的關鍵操作，定義好事件與有效事件，在盡量靠近使用者的地方量（負載平衡器日誌、外部探測、真實使用者監測）。應用程式自己的指標看不到它當掉或無法接受連線時的失敗，那些失敗由負載平衡器回 502／503，不會出現在應用程式的計數裡，所以會高估。</li>
<li>如果它是硬性相依、沒有替代方案，不行：你的可用性上限就是它的可用性乘上你自己的部分，而且 SLA 只代表它會賠錢，不代表它做得到。要承諾更高，就要把它變成軟性相依（佇列、重試、延後處理），或接第二家供應商互為備援，並自己監控它的實際可用性。</li>
</ol>
</details>

<h3>十二、練功題（做得出來才算真的懂）</h3>
<ol>
<li>一個服務每天 400 萬個請求，SLO 是 28 天滾動 99.5%。錯誤預算是多少個請求？換算成時間是多少？</li>
<li>SLO 99.9%，過去 1 小時的錯誤率是 0.5%。消耗速率是多少？照這速度預算幾天燒完？表格裡哪條警報會先響？</li>
<li>CDN 99.99%、負載平衡器 99.99%、兩個獨立的應用程式副本各 99.9%（並聯）、資料庫 99.95%。算出整體可用性。如果要提高，你會先改哪一段？</li>
<li>一個服務每月壞 4 次，每次平均 15 分鐘恢復。它的月可用度是多少？SLO 是 99.9% 的話，不減少故障次數，每次要在幾分鐘內恢復？</li>
<li>替你自己做過的一個服務（或猜高低的排行榜）寫出兩條完整的 SLO：一條可用性或延遲、一條新鮮度。寫清楚在哪裡量、時間窗、目標。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>28 × 400 萬 = 1 億 1,200 萬個請求，0.5% 是 56 萬個失敗請求。換成時間：28 天 × 0.5% = 3.36 小時，大約 3 小時 22 分鐘。</li>
<li>消耗速率 = 0.5% ÷ 0.1% = 5。30 天的預算 ÷ 5 = 6 天燒完。兩條叫人的警報門檻是 14.4 和 6，都不會響；3 天窗、速率 1 的工單警報會響，3 天窗的平均要過 0.1% 需要 72 × 0.1 ÷ 0.5 ≈ 14.4 小時，所以大約半天多後開工單，還有充分的時間處理。</li>
<li>並聯部分：1 − 0.001² = 0.999999。整體 ≈ 0.9999 × 0.9999 × 0.999999 × 0.9995 ≈ 0.9993，大約 99.93%。最弱的是只有一份的資料庫（99.95%），先做資料庫的自動故障轉移或提升它的可用性；應用程式副本已經不是瓶頸。</li>
<li>4 × 15 = 60 分鐘壞掉，60 ÷ 43,200 ≈ 0.14%，月可用度約 99.86%，沒達到 99.9%。99.9% 每月只能壞 43.2 分鐘，除以 4 次，每次要在 10.8 分鐘內恢復，例如做成自動回滾。</li>
<li>參考寫法：「在負載平衡器量到的排行榜 API 請求中，以 28 天滾動計算，99.5% 在 500 ms 內回應成功。」「排行榜在 28 天中 99% 的時間裡，落後實際成績不超過 60 秒（由每分鐘一次的探測比對最新一局的時間來量）。」重點是每一條都說得出怎麼量。</li>
</ol>
</details>

<h3>十三、想再挖深</h3>
<ul>
<li><b>Google《Site Reliability Engineering》</b>（<a href="https://sre.google/books/">sre.google/books</a>，免費線上閱讀）：第 3 章〈Embracing Risk〉和第 4 章〈Service Level Objectives〉，錯誤預算與 Chubby 故事的出處。</li>
<li><b>Google《The Site Reliability Workbook》</b>（同一個網站）：第 2 章〈Implementing SLOs〉講怎麼挑 SLI、寫政策，第 5 章〈Alerting on SLOs〉就是第四節消耗速率表格的出處，一步一步比較各種警報設計的優缺點。</li>
<li><b>Alex Hidalgo《Implementing Service Level Objectives》</b>（O'Reilly）：整本講 SLO 的落地，包括怎麼說服主管和產品團隊。</li>
<li><b>Sloth</b>（<a href="https://github.com/slok/sloth">github.com/slok/sloth</a>）：開源工具，寫一個簡單的 SLO 設定檔，自動產生 Prometheus 的多視窗消耗速率規則，看它產生的規則是理解第四節最快的方法。</li>
<li><b>Amazon Builders' Library</b>（<a href="https://aws.amazon.com/builders-library/">aws.amazon.com/builders-library</a>）：〈Static stability using Availability Zones〉等文章，第六節靜態穩定的原文。</li>
</ul>
` });
