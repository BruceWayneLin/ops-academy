DEEP({ 'incidents': `
<p>上一課講了三件事：什麼時候該把人叫醒、出事時誰做什麼、事後怎麼檢討。這一章把它們一層一層拆開：一個警報要怎麼設計，才不會半夜白白叫醒人；值班要怎麼排，人才撐得下去；事故當下的指揮系統怎麼運作；為什麼「先止血」幾乎永遠是對的；事後檢討怎麼寫，才不會停在「有人打錯字」；最後，怎麼在出事之前先把自己練好。這些東西跟寫程式不一樣，它是一套「人加系統」的做法。會寫功能的人很多，出事時能穩住場面的人很少，這正是資深和資淺最看得出差別的地方。</p>

<h3><span class="badge lv1">基礎</span>一、警報要針對症狀：煙霧偵測器的道理</h3>
<p>家裡的煙霧偵測器不量瓦斯爐的溫度，它只量「有沒有煙」。爐火開到最大，可能只是你在炒菜，完全正常；可是只要有煙，不管是什麼原因，都值得叫你起來看一眼。警報（alert）也是同一個道理：量<b>症狀</b>（symptom），不要量<b>原因</b>（cause）。</p>
<figure class="figure"><svg viewBox="0 0 660 272" class="fg" style="width:100%;max-width:660px" role="img" aria-label="請求從使用者經過負載平衡器、API 服務到資料庫；症狀在負載平衡器量，持續五分鐘就叫人；原因在 API 和資料庫量，只放儀表板和工單">
<rect x="20" y="14" width="270" height="56" rx="6" class="fg-b hot"/>
<text x="155" y="37" text-anchor="middle" class="fg-t acc">症狀：使用者感受到的</text>
<text x="155" y="57" text-anchor="middle" class="fg-t sm">錯誤率 &gt; 2%、p99 &gt; 1 秒</text>
<line x1="290" y1="42" x2="462" y2="42" class="fg-l on"/><polygon points="470,42 462,37.5 462,46.5" class="fg-a on"/>
<text x="380" y="34" text-anchor="middle" class="fg-t sm acc">持續 5 分鐘</text>
<rect x="470" y="14" width="170" height="56" rx="6" class="fg-b hot"/>
<text x="555" y="37" text-anchor="middle" class="fg-t acc">叫人（page）</text>
<text x="555" y="57" text-anchor="middle" class="fg-t sm">有人要馬上動手</text>
<rect x="20" y="110" width="120" height="50" rx="6" class="fg-b"/><text x="80" y="140" text-anchor="middle" class="fg-t">使用者</text>
<rect x="180" y="110" width="120" height="50" rx="6" class="fg-b alt"/><text x="240" y="140" text-anchor="middle" class="fg-t">負載平衡器</text>
<rect x="340" y="110" width="120" height="50" rx="6" class="fg-b"/><text x="400" y="140" text-anchor="middle" class="fg-t">API 服務</text>
<rect x="500" y="110" width="140" height="50" rx="6" class="fg-b"/><text x="570" y="140" text-anchor="middle" class="fg-t">資料庫</text>
<line x1="140" y1="135" x2="172" y2="135" class="fg-l"/><polygon points="180,135 172,130.5 172,139.5" class="fg-a"/>
<line x1="300" y1="135" x2="332" y2="135" class="fg-l"/><polygon points="340,135 332,130.5 332,139.5" class="fg-a"/>
<line x1="460" y1="135" x2="492" y2="135" class="fg-l"/><polygon points="500,135 492,130.5 492,139.5" class="fg-a"/>
<line x1="240" y1="108" x2="240" y2="78" class="fg-l on dash"/><polygon points="240,70 235.5,78 244.5,78" class="fg-a on"/>
<text x="250" y="96" class="fg-t sm acc">在這裡量</text>
<line x1="400" y1="160" x2="400" y2="198" class="fg-l warm dash"/><polygon points="400,206 395.5,198 404.5,198" class="fg-a warm"/>
<line x1="570" y1="160" x2="570" y2="198" class="fg-l warm dash"/><polygon points="570,206 565.5,198 574.5,198" class="fg-a warm"/>
<rect x="340" y="206" width="300" height="56" rx="6" class="fg-b warm"/>
<text x="490" y="229" text-anchor="middle" class="fg-t warm">可能的原因（系統內部）</text>
<text x="490" y="249" text-anchor="middle" class="fg-t sm">CPU 90%、連線池快滿、磁碟 85%</text>
<line x1="340" y1="234" x2="298" y2="234" class="fg-l"/><polygon points="290,234 298,229.5 298,238.5" class="fg-a"/>
<rect x="20" y="206" width="270" height="56" rx="6" class="fg-b"/>
<text x="155" y="229" text-anchor="middle" class="fg-t">儀表板／工單</text>
<text x="155" y="249" text-anchor="middle" class="fg-t sm">診斷時才看，不半夜叫人</text>
</svg><figcaption>症狀在最靠近使用者的地方量（負載平衡器或外部探測），持續一段時間就叫人。原因類的指標放在儀表板上，警報響了以後拿來診斷。</figcaption></figure>
<p>症狀是使用者直接感受到的東西：請求失敗、變慢、登入不了。原因是系統內部的狀態：CPU 很高、連線池快滿、磁碟用了 85%。為什麼不針對原因叫人？三個理由：</p>
<ul>
<li><b>原因不一定造成傷害。</b>CPU 90% 可能只是批次工作在跑，使用者完全沒感覺。為它叫人，就是白白叫醒一次。</li>
<li><b>原因列不完。</b>能讓服務壞掉的原因有幾百種，你不可能每一種都事先寫好警報。可是不管是哪一種，最後都會表現成同一組症狀：錯誤變多、延遲變長。量症狀，等於一次涵蓋所有你沒想到的原因。</li>
<li><b>原因很適合拿來診斷。</b>原因類的指標不是沒用，它們應該放在儀表板（dashboard）上。警報響了，值班的人打開儀表板，看到連線池滿了，就知道從哪裡查起。</li>
</ul>
<p>例外是「快要變成症狀的原因」：磁碟照目前的速度，四小時後會寫滿；憑證七天後過期。這類警報預告的是一個確定會發生、而且時間算得出來的傷害，值得處理。離發生還很久的，開工單就好；只剩幾小時的，才需要叫人。</p>
<h4>一個警報值不值得叫人：四個問題</h4>
<p>Google 的《Site Reliability Engineering》在講監控的那一章，整理過一組檢查問題，濃縮起來是這四個。每一個會叫人的警報都要通過：</p>
<ol>
<li><b>使用者正在受害，或馬上就會受害嗎？</b>不是的話，不該叫人。</li>
<li><b>收到的人需要做什麼事嗎？</b>如果只是「知道一下」，那是聊天室訊息，不是呼叫。</li>
<li><b>這件事需要現在做嗎？</b>能等到明天早上的，就開工單（ticket）。</li>
<li><b>這件事需要人的判斷嗎？</b>如果每次響起來，處理方式都一模一樣（例如重開某個服務），那就寫成自動化，不要把人當機器用。</li>
</ol>
<h4>四種去處</h4>
<table>
<tr><th>去處</th><th>什麼時候</th><th>例子</th></tr>
<tr><td><b>叫人</b>（page）</td><td>使用者正在受害，需要人現在動手</td><td>登入成功率連續 5 分鐘低於 95%</td></tr>
<tr><td><b>工單</b></td><td>要處理，但可以等到上班時間</td><td>憑證 14 天後過期；昨晚的備份失敗</td></tr>
<tr><td><b>儀表板</b></td><td>不用任何人做事，診斷時才看</td><td>每台機器的 CPU、記憶體、連線池使用量</td></tr>
<tr><td><b>刪掉</b></td><td>沒人會看，也不會改變任何決定</td><td>「某個行程重啟了一次」，而且它自己好了</td></tr>
</table>
<h4>警報疲勞：雜訊是怎麼害死人的</h4>
<p>假設一個值班的人一週收到 50 個呼叫，其中 45 個最後什麼都不用做。他很快就學到一件事：「呼叫響了，通常沒事。」第 46 個是真的出事，他也會晚十分鐘才看，甚至直接按掉。這叫<b>警報疲勞</b>（alert fatigue）。醫院的加護病房研究過同一個現象：監視器叫得太頻繁，護理人員就會對警報聲越來越不敏感。</p>
<p>對策只有一條：<b>每一個沒人需要處理的呼叫，都是一個要修的 bug。</b>每週交接時，把這週所有的呼叫列出來，一個一個問：這個需要叫人嗎？不需要的，就調門檻、拉長持續時間、降成工單，或直接刪掉。</p>

<h3><span class="badge lv1">基礎</span>二、值班待命：讓人撐得下去的排班</h3>
<p>值班待命（on-call）的意思是：在一段時間裡，呼叫器響了，就由你負責。它像醫院的值班醫師：不是一直在急診室裡忙，但手機要帶著，幾分鐘內要回應，半小時內要能坐到電腦前。</p>
<ul>
<li><b>輪值表</b>（rotation）：常見是一週一輪，有<b>主要</b>（primary）和<b>次要</b>（secondary）兩個人。</li>
<li><b>升級政策</b>（escalation policy）：例如 5 分鐘沒人確認就找次要，再 10 分鐘沒人確認就找主管。PagerDuty 這類工具做的就是這件事：打電話、發簡訊、推播，直到有人按下「我收到了」。</li>
<li><b>交接</b>（handoff）：換班時寫一段紀錄：這週發生過什麼、哪些問題還沒解決、哪個警報最近特別吵。</li>
</ul>
<h4>排班的數學</h4>
<p>值班會累，排得太密，人就會走。Google 的 SRE 書給過幾個參考：處理一次事故，加上查原因、寫檢討、修 bug，平均大約要 6 小時，所以一個 12 小時的班，最多承受 2 次事故；一個人花在值班上的時間，最好不超過四分之一。照這個算法，同一個地點、每週有主要和次要兩人在班的團隊，至少要 8 個人，每人每個月輪到一週。</p>
<p>只有兩三個人的團隊，常見的做法是：白天輪值，晚上只接最嚴重等級的呼叫；或者跟另一個時區的團隊接力，叫做 follow the sun。另外兩件事常被忽略：值班要有補償（加給或補休），而且值班的人有權把「這週太吵」當成正式問題提出來。沒人想值的班，最後會變成沒人認真值的班。</p>

<h3><span class="badge lv2">進階</span>三、從 SLO 寫出好警報：燃燒率</h3>
<p>「錯誤率超過 2% 就叫人」聽起來合理，可是 2% 是怎麼來的？定太低會一直誤報，定太高會漏掉慢慢流血的問題。第 4.2 課的錯誤預算（error budget）給了一個不用猜的做法：<b>看預算燒得多快</b>。</p>
<p>假設 SLO 是 30 天內 99.9% 的請求要成功。允許失敗的比例是 0.1%，這就是預算。<b>燃燒率</b>（burn rate）的定義是：</p>
<pre><code>燃燒率 = 現在的錯誤率 ÷ SLO 允許的錯誤率</code></pre>
<p>錯誤率剛好 0.1%，燃燒率是 1，預算剛好在第 30 天用完。錯誤率 1.44%，燃燒率是 14.4，整個月的預算 30 ÷ 14.4 ≈ 2.1 天就燒光。</p>
<figure class="figure"><svg viewBox="0 0 640 236" class="fg" style="width:100%;max-width:640px" role="img" aria-label="三種燃燒率燒光一個月錯誤預算所需的天數：14.4 倍約 2 天，6 倍 5 天，1 倍 30 天；前兩種叫人，最後一種開工單">
<text x="170" y="26" text-anchor="middle" class="fg-t sm">0 天</text>
<text x="395" y="26" text-anchor="middle" class="fg-t sm">15 天</text>
<text x="620" y="26" text-anchor="middle" class="fg-t sm">30 天</text>
<line x1="170" y1="34" x2="170" y2="196" class="fg-l dim"/>
<line x1="395" y1="32" x2="395" y2="38" class="fg-l dim"/>
<line x1="620" y1="34" x2="620" y2="196" class="fg-l dim dash"/>
<text x="20" y="56" class="fg-t">燃燒率 14.4×</text><text x="20" y="72" class="fg-t sm">錯誤率 1.44%</text>
<rect x="170" y="44" width="31" height="30" rx="3" class="fg-b warm"/>
<text x="212" y="64" class="fg-t sm warm">約 2 天燒光 → 叫人（看 1 小時＋5 分鐘）</text>
<text x="20" y="112" class="fg-t">燃燒率 6×</text><text x="20" y="128" class="fg-t sm">錯誤率 0.6%</text>
<rect x="170" y="100" width="75" height="30" rx="3" class="fg-b warm"/>
<text x="256" y="120" class="fg-t sm warm">5 天燒光 → 叫人（看 6 小時＋30 分鐘）</text>
<text x="20" y="168" class="fg-t">燃燒率 1×</text><text x="20" y="184" class="fg-t sm">錯誤率 0.1%</text>
<rect x="170" y="156" width="450" height="30" rx="3" class="fg-b alt"/>
<text x="184" y="176" class="fg-t sm">剛好用到月底 → 開工單（看 3 天＋6 小時）</text>
<text x="320" y="222" text-anchor="middle" class="fg-t sm">燃燒率 = 現在的錯誤率 ÷ SLO 允許的錯誤率（SLO 99.9% 時是 0.1%）</text>
</svg><figcaption>同一個 SLO，燒得越快，越早用完預算。燒得快的要叫人，燒得慢的開工單。括號裡是要同時超過門檻的「長時間窗＋短時間窗」。</figcaption></figure>
<p>Google 的《The Site Reliability Workbook》建議的組合是：</p>
<table>
<tr><th>條件</th><th>等於</th><th>去處</th></tr>
<tr><td>1 小時內燃燒率 &gt; 14.4</td><td>1 小時燒掉整月預算的 2%</td><td>叫人</td></tr>
<tr><td>6 小時內燃燒率 &gt; 6</td><td>6 小時燒掉 5%</td><td>叫人</td></tr>
<tr><td>3 天內燃燒率 &gt; 1</td><td>3 天燒掉 10%</td><td>開工單</td></tr>
</table>
<p>每一條還要配一個「短時間窗」（window），長度大約是長時間窗的十二分之一：1 小時的配 5 分鐘，兩個都超過才叫人。原因是長時間窗反應慢，而且事情修好以後，它還會繼續響一陣子，因為過去一小時的平均還很高；短時間窗確認「現在這一刻還在燒」，修好之後幾分鐘，警報就會自己解除。用 Prometheus 寫出來是這樣：</p>
<pre><code>groups:
- name: slo-api
  rules:
  - alert: ApiErrorBudgetBurnFast
    expr: |
      (sum(rate(http_requests_total{code=~"5.."}[1h]))
        / sum(rate(http_requests_total[1h]))) &gt; 14.4 * 0.001
      and
      (sum(rate(http_requests_total{code=~"5.."}[5m]))
        / sum(rate(http_requests_total[5m]))) &gt; 14.4 * 0.001
    labels:
      severity: page
    annotations:
      summary: "API 的錯誤預算正在快速燃燒"
      runbook_url: "https://wiki.example.com/rb/api"</code></pre>
<p>這種寫法有兩個好處：門檻直接跟大家同意過的目標掛鉤，不是誰憑感覺定的；而且同一套規則，同時抓得到「突然大爆炸」和「一整天慢慢漏」。</p>
<h4>處理手冊要寫什麼</h4>
<p>上面那個 <code>runbook_url</code> 要連到一頁處理手冊（runbook）。它是寫給半夜三點、剛被叫醒、對這個服務不熟的人看的：</p>
<ul>
<li><b>這個警報代表什麼</b>：一句話，使用者看到的是什麼。</li>
<li><b>先看哪裡</b>：哪個儀表板、哪三個指標，直接附連結。</li>
<li><b>常見原因和對應的止血方法</b>：最近有部署嗎？退版的指令是什麼？</li>
<li><b>什麼時候要升級</b>：多久沒好轉就找誰、怎麼找。</li>
</ul>
<p>處理手冊不是寫完就放著。每次有人照著它做過一遍，就知道哪裡寫錯、哪裡過期，順手改掉。</p>

<h3><span class="badge lv2">進階</span>四、事故的一生：一條時間軸</h3>
<p>用一個例子從頭走到尾。猜高低遊戲的 API 在下午兩點上了一個新版本：</p>
<figure class="figure"><svg viewBox="0 0 680 236" class="fg" style="width:100%;max-width:680px" role="img" aria-label="事故時間軸：14:02 部署，14:09 警報，14:12 確認，14:15 宣布，14:21 退版，14:27 恢復，使用者受害 25 分鐘；15:40 找到原因，隔天事後檢討">
<path d="M68 44 V36 H418 V44" class="fg-l warm"/>
<text x="243" y="28" text-anchor="middle" class="fg-t warm">使用者受害 25 分鐘</text>
<path d="M68 82 V74 H162 V82" class="fg-l alt"/>
<text x="115" y="66" text-anchor="middle" class="fg-t sm alt">偵測 7 分鐘</text>
<path d="M170 82 V74 H418 V82" class="fg-l on"/>
<text x="294" y="66" text-anchor="middle" class="fg-t sm acc">確認、宣布、止血 18 分鐘</text>
<line x1="30" y1="150" x2="442" y2="150" class="fg-l"/>
<line x1="446" y1="158" x2="454" y2="142" class="fg-l"/><line x1="454" y1="158" x2="462" y2="142" class="fg-l"/>
<line x1="466" y1="150" x2="650" y2="150" class="fg-l"/><polygon points="658,150 650,145.5 650,154.5" class="fg-a"/>
<circle cx="68" cy="150" r="5" class="fg-lamp on"/><circle cx="166" cy="150" r="5" class="fg-lamp on"/><circle cx="208" cy="150" r="5" class="fg-lamp"/><circle cx="250" cy="150" r="5" class="fg-lamp"/><circle cx="334" cy="150" r="5" class="fg-lamp"/><circle cx="418" cy="150" r="5" class="fg-lamp on"/><circle cx="520" cy="150" r="5" class="fg-lamp"/><circle cx="610" cy="150" r="5" class="fg-lamp"/>
<text x="68" y="116" text-anchor="middle" class="fg-t">部署 v2.4</text><text x="68" y="134" text-anchor="middle" class="fg-t sm mono">14:02</text>
<text x="208" y="116" text-anchor="middle" class="fg-t">值班確認</text><text x="208" y="134" text-anchor="middle" class="fg-t sm mono">14:12</text>
<text x="334" y="116" text-anchor="middle" class="fg-t">開始退版</text><text x="334" y="134" text-anchor="middle" class="fg-t sm mono">14:21</text>
<text x="520" y="116" text-anchor="middle" class="fg-t">找到原因</text><text x="520" y="134" text-anchor="middle" class="fg-t sm mono">15:40</text>
<text x="166" y="174" text-anchor="middle" class="fg-t sm mono">14:09</text><text x="166" y="192" text-anchor="middle" class="fg-t">警報響了</text>
<text x="250" y="174" text-anchor="middle" class="fg-t sm mono">14:15</text><text x="250" y="192" text-anchor="middle" class="fg-t">宣布 SEV2</text>
<text x="418" y="174" text-anchor="middle" class="fg-t sm mono">14:27</text><text x="418" y="192" text-anchor="middle" class="fg-t acc">恢復正常</text>
<text x="610" y="174" text-anchor="middle" class="fg-t sm">隔天</text><text x="610" y="192" text-anchor="middle" class="fg-t">事後檢討</text>
<text x="340" y="226" text-anchor="middle" class="fg-t sm">偵測 → 確認 → 分級與宣布 → 止血 → 修復 → 檢討與追蹤</text>
</svg><figcaption>對使用者來說，事故在 14:27 就結束了。15:40 找到原因、隔天寫檢討，都發生在使用者已經沒事之後。</figcaption></figure>
<ol>
<li><b>偵測</b>（detect）：14:02 部署，新版本有個 bug，兩成的開局請求回 500。快速燃燒的警報要「過去 1 小時」的平均也超過 1.44%，以 20% 的錯誤率大約要累積 4 分多鐘，再加上抓取和評估的間隔，14:09 響。</li>
<li><b>確認</b>（acknowledge）：14:12，值班的人按下確認。</li>
<li><b>分級與宣布</b>（triage）：14:15，他判斷影響大，在事故頻道宣布「SEV2，我先當指揮官」。</li>
<li><b>止血</b>（mitigate）：他看到 14:02 有部署，14:21 開始退版，14:27 錯誤率回到平常的 0.05%。</li>
<li><b>修復</b>（resolve）：15:40 找到原因：新版本漏處理了「牌堆用完」這個邊界情況。修好後走正常流程上線。</li>
<li><b>檢討與追蹤</b>：隔天寫事後檢討，行動項目排進工作清單。</li>
</ol>
<p>團隊會長期追蹤幾個時間：<b>偵測時間</b>（time to detect）、<b>止血時間</b>（time to mitigate）、<b>修復時間</b>（time to resolve）。常聽到的 MTTR 有好幾種定義（復原、修復、回應），討論時先確認對方說的是哪一種。還有一件事要記住：對使用者來說，只有前兩個重要。止血之後，原因要查多久都可以。</p>
<h4>事故分級</h4>
<table>
<tr><th>等級</th><th>例子</th><th>怎麼動員</th></tr>
<tr><td>SEV1</td><td>全站掛掉、資料遺失、資料外洩</td><td>立刻全員，主管和對外溝通都要上</td></tr>
<tr><td>SEV2</td><td>重要功能壞了一大塊，例如兩成的開局失敗</td><td>指揮官加上相關的人，定時對外更新</td></tr>
<tr><td>SEV3</td><td>小功能壞了，而且有替代方式</td><td>值班的人在上班時間處理</td></tr>
</table>
<p>每家公司的定義不一樣，重點是事先寫好，出事時不用爭「這到底算不算嚴重」。拿不定主意就往高的報：事後降級很容易，晚了才升級，代價很高。</p>

<h3><span class="badge lv3">專業</span>五、指揮系統：一個人決定，大家分工</h3>
<p>事故當下的角色分工，借自消防和救災用的<b>事故指揮系統</b>（Incident Command System，ICS）。火場上不會讓每個消防員各自決定往哪裡噴水；有一個指揮官看全局、做決定，其他人各自負責一塊。</p>
<figure class="figure"><svg viewBox="0 0 640 272" class="fg" style="width:100%;max-width:640px" role="img" aria-label="事故指揮官在上方，分派給溝通負責人、操作負責人、紀錄三個角色，他們各自對應狀態頁、專家和事故文件">
<rect x="225" y="16" width="190" height="56" rx="6" class="fg-b hot"/>
<text x="320" y="40" text-anchor="middle" class="fg-t acc">事故指揮官（IC）</text>
<text x="320" y="60" text-anchor="middle" class="fg-t sm">看全局、做決定、不動手</text>
<line x1="320" y1="72" x2="320" y2="96" class="fg-l"/>
<line x1="110" y1="96" x2="530" y2="96" class="fg-l"/>
<text x="430" y="89" text-anchor="middle" class="fg-t sm">分派工作</text>
<line x1="110" y1="96" x2="110" y2="122" class="fg-l"/><polygon points="110,130 105.5,122 114.5,122" class="fg-a"/>
<line x1="320" y1="96" x2="320" y2="122" class="fg-l"/><polygon points="320,130 315.5,122 324.5,122" class="fg-a"/>
<line x1="530" y1="96" x2="530" y2="122" class="fg-l"/><polygon points="530,130 525.5,122 534.5,122" class="fg-a"/>
<rect x="20" y="130" width="180" height="56" rx="6" class="fg-b alt"/>
<text x="110" y="154" text-anchor="middle" class="fg-t">溝通負責人</text>
<text x="110" y="174" text-anchor="middle" class="fg-t sm">定時發更新</text>
<rect x="230" y="130" width="180" height="56" rx="6" class="fg-b warm"/>
<text x="320" y="154" text-anchor="middle" class="fg-t">操作負責人</text>
<text x="320" y="174" text-anchor="middle" class="fg-t sm">帶專家查問題、下指令</text>
<rect x="440" y="130" width="180" height="56" rx="6" class="fg-b"/>
<text x="530" y="154" text-anchor="middle" class="fg-t">紀錄</text>
<text x="530" y="174" text-anchor="middle" class="fg-t sm">記下時間、決定、動作</text>
<line x1="110" y1="186" x2="110" y2="212" class="fg-l dash"/><polygon points="110,220 105.5,212 114.5,212" class="fg-a"/>
<line x1="320" y1="186" x2="320" y2="212" class="fg-l dash"/><polygon points="320,220 315.5,212 324.5,212" class="fg-a"/>
<line x1="530" y1="186" x2="530" y2="212" class="fg-l dash"/><polygon points="530,220 525.5,212 534.5,212" class="fg-a"/>
<rect x="20" y="220" width="180" height="38" rx="6" class="fg-b"/><text x="110" y="244" text-anchor="middle" class="fg-t sm">狀態頁、主管、客服</text>
<rect x="230" y="220" width="180" height="38" rx="6" class="fg-b"/><text x="320" y="244" text-anchor="middle" class="fg-t sm">資料庫、網路等專家</text>
<rect x="440" y="220" width="180" height="38" rx="6" class="fg-b"/><text x="530" y="244" text-anchor="middle" class="fg-t sm">事故文件（時間軸）</text>
</svg><figcaption>指揮官不親自下指令。小事故裡這四個角色可能是同一個人，但任何時候，大家都要知道是誰在做決定。</figcaption></figure>
<table>
<tr><th>角色</th><th>做什麼</th><th>不做什麼</th></tr>
<tr><td><b>事故指揮官</b>（incident commander，IC）</td><td>掌握全局、排優先順序、分派工作、決定何時宣布止血</td><td>不自己下指令改系統。手一忙，眼睛就看不到全局</td></tr>
<tr><td><b>溝通負責人</b>（communications lead）</td><td>定時對內（主管、客服）、對外（狀態頁）發更新</td><td>不讓主管直接跑去問正在修的人</td></tr>
<tr><td><b>操作負責人</b>（operations lead）</td><td>帶著專家查問題、下指令、改系統，動手前先跟指揮官講</td><td>不自己偷偷試一堆東西</td></tr>
<tr><td><b>紀錄</b>（scribe）</td><td>在事故文件裡記下時間、觀察、決定、做過的動作</td><td>不參與爭論，專心記</td></tr>
</table>
<p>最糟的事故現場是這樣：五個人同時在不同機器上試不同的修法，沒人知道剛才那個好轉是誰做的，也沒人知道剛才那個惡化是誰造成的。指揮系統要避免的就是這個。</p>
<p>指揮官也要會交棒。事故拖過幾個小時，人會累，判斷會變差。交棒時要明說「從現在起由某某當指揮官」，並在頻道裡寫下來。</p>
<h4>溝通範本</h4>
<p>溝通最怕兩件事：太晚，和不規律。事先寫好範本，出事時填空就好：</p>
<pre><code>【事故通報｜SEV2｜調查中】14:15
影響：約兩成玩家開局失敗，其他功能正常。
開始時間：約 14:02。
目前動作：懷疑跟 14:02 的部署有關，正在退版。
下次更新：14:45 前，或有進展時。
指揮官：小林　事故頻道：#inc-0612</code></pre>
<pre><code>【事故通報｜SEV2｜已止血】14:30
影響：14:02 到 14:27 之間，約兩成開局請求失敗。14:27 起恢復正常。
動作：已退回上一版。原因仍在調查，修好之前暫停部署。
下次更新：16:00 前。</code></pre>
<p>幾條規則：寫使用者看得懂的影響，不寫內部術語；一定寫「下次更新時間」，就算沒有新進展，時間到了也發一則「仍在處理」；不要猜原因，不要承諾修好的時間。還有，對外的狀態頁要架在跟你的服務不同的基礎設施上，不然網站掛了，狀態頁也跟著掛。</p>

<h3><span class="badge lv3">專業</span>六、先止血：一份標準止血清單</h3>
<p>止血（mitigation）的意思是：先讓使用者不再受害，不管你懂不懂原因。這聽起來像在偷懶，其實是最理性的選擇。把兩種做法的時間軸並排比一比：</p>
<figure class="figure"><svg viewBox="0 0 660 230" class="fg" style="width:100%;max-width:660px" role="img" aria-label="兩條時間軸：先找原因的做法讓使用者受害 95 分鐘；先退版止血的做法只受害 15 分鐘，之後再慢慢查原因">
<text x="606" y="32" text-anchor="end" class="fg-t sm warm">使用者受害 95 分鐘</text>
<text x="20" y="56" class="fg-t">先找原因</text><text x="20" y="72" class="fg-t sm">再修</text>
<rect x="150" y="40" width="336" height="36" rx="4" class="fg-b warm"/>
<text x="318" y="63" text-anchor="middle" class="fg-t sm">確認、查日誌、讀程式碼、猜原因</text>
<rect x="486" y="40" width="120" height="36" rx="4" class="fg-b warm"/>
<text x="546" y="63" text-anchor="middle" class="fg-t sm">寫修正、上線</text>
<text x="150" y="102" class="fg-t sm acc">使用者受害 15 分鐘</text>
<text x="20" y="126" class="fg-t">先止血</text><text x="20" y="142" class="fg-t sm">再查</text>
<rect x="150" y="110" width="72" height="36" rx="4" class="fg-b warm"/>
<text x="186" y="133" text-anchor="middle" class="fg-t sm">退版</text>
<rect x="222" y="110" width="408" height="36" rx="4" class="fg-b alt"/>
<text x="426" y="133" text-anchor="middle" class="fg-t sm">使用者沒事了，再慢慢查原因</text>
<line x1="150" y1="176" x2="630" y2="176" class="fg-l"/>
<line x1="150" y1="172" x2="150" y2="180" class="fg-l"/><line x1="294" y1="172" x2="294" y2="180" class="fg-l"/><line x1="438" y1="172" x2="438" y2="180" class="fg-l"/><line x1="582" y1="172" x2="582" y2="180" class="fg-l"/>
<text x="150" y="194" text-anchor="middle" class="fg-t sm">0</text><text x="294" y="194" text-anchor="middle" class="fg-t sm">30</text><text x="438" y="194" text-anchor="middle" class="fg-t sm">60</text><text x="582" y="194" text-anchor="middle" class="fg-t sm">90 分鐘</text>
<text x="390" y="220" text-anchor="middle" class="fg-t sm">退版要多久大致算得出來；找原因要多久，誰都算不出來</text>
</svg><figcaption>同一個事故，兩種順序。找原因的時間不可預測，可能 5 分鐘也可能 3 小時；退版通常幾分鐘就完成。</figcaption></figure>
<p>而且大部分事故都跟某個變更有關，把變更收回來，常常就好了。所以順序是：先止血，再查原因。</p>
<h4>止血清單</h4>
<table>
<tr><th>手段</th><th>什麼時候用</th><th>要小心</th></tr>
<tr><td><b>退版</b>（roll back）</td><td>最近有部署或設定變更</td><td>資料庫結構已經改了、新舊版本又不相容時，退不回去</td></tr>
<tr><td><b>關掉功能開關</b>（feature flag）</td><td>新功能有問題</td><td>新功能平常就要放在開關後面，出事時才有得關</td></tr>
<tr><td><b>切到備援</b>（fail over）</td><td>一個可用區域、一台資料庫、一個外部供應商出問題</td><td>先確認備援是健康的；切換本身也可能出錯</td></tr>
<tr><td><b>排除壞節點</b>（drain）</td><td>只有某幾台機器異常</td><td>剩下的機器要撐得住多出來的流量</td></tr>
<tr><td><b>加容量</b></td><td>流量真的變多</td><td>瓶頸在資料庫時，加 API 機器只會讓資料庫更慘</td></tr>
<tr><td><b>限流或封鎖</b></td><td>某個用戶端或某些 IP 在狂打</td><td>別誤封正常使用者</td></tr>
<tr><td><b>降級</b></td><td>非核心功能拖垮核心功能</td><td>例如先關掉排行榜，保住開局</td></tr>
<tr><td><b>重開</b></td><td>記憶體洩漏、卡死的行程</td><td>證據會一起被清掉。先花一分鐘留下堆積傾印（heap dump）或執行緒傾印</td></tr>
<tr><td><b>凍結部署</b></td><td>任何事故期間</td><td>止血完成之前，別讓其他變更混進來</td></tr>
</table>
<p>退版能當第一選擇，前提是它真的退得回去。這要靠平常的設計：資料庫遷移拆成「先擴充、再收縮」（expand and contract）兩步。先加新欄位、讓新舊版本都能讀寫；確定新版穩定了，再刪掉舊欄位。這樣不管在哪一刻退版，都不會壞。</p>
<p>還有一個心法：<b>止血的決定要快，而且要可逆。</b>指揮官常常要在資訊不完整的時候做決定。「我們先退版，十分鐘後沒好轉，再考慮切到備援」比「再查一下看看」好得多。一個收得回來的錯誤決定，代價通常比拖延小。</p>

<h3><span class="badge lv3">專業</span>七、不究責的事後檢討：別停在「有人打錯字」</h3>
<p>上一課給了事後檢討的六個段落。這一節講最難寫的那一段：<b>促成因素</b>（contributing factors）。</p>
<h4>「人為疏失」是起點，不是結論</h4>
<p>假設事故的直接原因是：工程師改設定時打錯一個字，全站回 502。如果檢討寫「根本原因：人為疏失」，行動項目就只剩「以後要更小心」。這等於什麼都沒改：下一個人在同樣的情況下，還是有一樣的機率打錯。</p>
<p>研究安全的學者（例如 Sidney Dekker）的主張是：人為疏失是一個需要被解釋的現象，不是解釋本身。該問的不是「誰做錯了」，而是「在那個當下，為什麼他的做法看起來是合理的？系統為什麼讓一個字的錯，變成全站當機？」這樣問下去，促成因素會一個一個浮出來：</p>
<figure class="figure"><svg viewBox="0 0 660 296" class="fg" style="width:100%;max-width:660px" role="img" aria-label="事故在中間，周圍有五個促成因素各自指向它：沒有格式檢查、一次全推、交接沒寫、偵測太慢、退版太慢；打錯字只是起點">
<rect x="20" y="16" width="290" height="56" rx="6" class="fg-b"/>
<text x="165" y="39" text-anchor="middle" class="fg-t">沒有檢查：設定檔不驗格式</text>
<text x="165" y="59" text-anchor="middle" class="fg-t sm acc">→ CI 加格式驗證</text>
<rect x="350" y="16" width="290" height="56" rx="6" class="fg-b"/>
<text x="495" y="39" text-anchor="middle" class="fg-t">一次全推：沒有金絲雀部署</text>
<text x="495" y="59" text-anchor="middle" class="fg-t sm acc">→ 先推 5% 機器、觀察 10 分鐘</text>
<rect x="20" y="122" width="170" height="56" rx="6" class="fg-b warm"/>
<text x="105" y="145" text-anchor="middle" class="fg-t">有人打錯一個字</text>
<text x="105" y="165" text-anchor="middle" class="fg-t sm warm">起點，不是結論</text>
<rect x="215" y="122" width="230" height="56" rx="6" class="fg-b hot"/>
<text x="330" y="156" text-anchor="middle" class="fg-t lg">事故：全站回 502</text>
<rect x="470" y="122" width="170" height="56" rx="6" class="fg-b"/>
<text x="555" y="145" text-anchor="middle" class="fg-t">交接沒寫到風險</text>
<text x="555" y="165" text-anchor="middle" class="fg-t sm acc">→ 交接範本加一欄</text>
<rect x="20" y="228" width="290" height="56" rx="6" class="fg-b"/>
<text x="165" y="251" text-anchor="middle" class="fg-t">偵測太慢：警報晚 12 分鐘</text>
<text x="165" y="271" text-anchor="middle" class="fg-t sm acc">→ 改用燃燒率警報</text>
<rect x="350" y="228" width="290" height="56" rx="6" class="fg-b"/>
<text x="495" y="251" text-anchor="middle" class="fg-t">退版太慢：手動要 20 分鐘</text>
<text x="495" y="271" text-anchor="middle" class="fg-t sm acc">→ 做成一鍵退版</text>
<path d="M165 72 V96 H280 V114" class="fg-l"/><polygon points="280,122 275.5,114 284.5,114" class="fg-a"/>
<path d="M495 72 V96 H380 V114" class="fg-l"/><polygon points="380,122 375.5,114 384.5,114" class="fg-a"/>
<path d="M165 228 V204 H280 V186" class="fg-l"/><polygon points="280,178 275.5,186 284.5,186" class="fg-a"/>
<path d="M495 228 V204 H380 V186" class="fg-l"/><polygon points="380,178 375.5,186 384.5,186" class="fg-a"/>
<line x1="190" y1="150" x2="207" y2="150" class="fg-l warm"/><polygon points="215,150 207,145.5 207,154.5" class="fg-a warm"/>
<line x1="470" y1="150" x2="453" y2="150" class="fg-l"/><polygon points="445,150 453,145.5 453,154.5" class="fg-a"/>
</svg><figcaption>一個字打錯是事實，但要它變成全站當機，周圍五個條件缺一不可。每個條件對應一個具體的改動，這些才是行動項目。</figcaption></figure>
<p>改完以後，下次就算有人打錯同一個字，CI 會擋下來；就算沒擋到，也只影響 5% 的機器，幾分鐘內被警報抓到，一鍵就退回去。<b>你修的不是人，是讓錯誤擴大的那條路。</b></p>
<h4>寫檢討時的三個警訊</h4>
<ul>
<li><b>反事實的句子</b>：「他應該先檢查⋯⋯」「如果當時有注意到⋯⋯」。這些句子描述的是一個沒有發生的世界，對理解實際發生的事沒有幫助。改寫成：「當時的畫面上看不到這個資訊，因為⋯⋯」。</li>
<li><b>只有一個根本原因</b>：複雜系統的事故，幾乎都是好幾個條件同時成立才發生的。「五個為什麼」（5 whys）是不錯的起點，但它只沿著一條線往下挖，常常漏掉其他分支。</li>
<li><b>點名</b>：檢討裡寫角色（「值班工程師」「部署的人」），不寫名字。目的是把注意力放在系統上。</li>
</ul>
<p>不究責不等於沒有人負責。真正的惡意或一再故意違規，是人事問題，走另一條路處理；事後檢討處理的是「好人在壞系統裡犯的錯」，而這占了絕大多數。</p>
<h4>行動項目：沒追蹤等於沒寫</h4>
<table>
<tr><th>不好的行動項目</th><th>好的行動項目</th></tr>
<tr><td>以後改設定要小心</td><td>設定檔在 CI 加上格式驗證。負責人：平台組。11 月底前</td></tr>
<tr><td>改善監控</td><td>開局成功率改用燃燒率警報，取代固定 2% 門檻。負責人：值班組。下一個衝刺</td></tr>
<tr><td>加強測試</td><td>為「牌堆用完」補一個整合測試。負責人：遊戲組。本週</td></tr>
</table>
<p>每個行動項目都要有負責人和期限，開成工作追蹤系統裡的正式項目，標上「事後檢討」的標籤，團隊每週或每兩週看一次還沒關的。很多團隊的檢討寫得很漂亮，最後卻敗在這裡：沒人追，半年後同樣的事故又來一次。</p>
<p>行動項目也可以分類：預防（不讓它發生）、偵測（更快發現）、止血（更快止住）、流程（溝通和協作）。如果一份檢討的行動項目全部都是「預防」，通常代表大家還在想「讓它永遠不再發生」。成熟的團隊知道總會有新的事故，所以偵測和止血的改善，價值一點都不輸預防。</p>

<h3><span class="badge lv4">專家</span>八、演練：演練日與混沌工程</h3>
<p>消防隊不會等到真的火災，才第一次拉水管。事故處理也一樣：流程、工具、處理手冊，都要在平靜的時候先跑過一遍。</p>
<h4>從桌上推演開始</h4>
<p>最便宜的演練是<b>桌上推演</b>（tabletop exercise）：大家坐在會議室，主持人說「現在是週六晚上十點，資料庫主節點沒有回應，你會怎麼做？」，然後一步一步問下去：你看哪個儀表板？處理手冊在哪？誰有權限切換？Google 的版本叫「厄運之輪」（Wheel of Misfortune），由一個人扮演系統，回答值班新人的每一個查詢。不碰任何系統，就能找出一堆「原來沒人知道密碼放在哪」的問題。</p>
<h4>演練日</h4>
<p><b>演練日</b>（game day）是真的動手：在測試環境，成熟之後也可以在正式環境，故意製造故障，看系統和人怎麼反應。規劃時要寫清楚四件事：</p>
<ul>
<li><b>假設</b>：「關掉一個可用區域的 API 機器，錯誤率不會超過 0.5%，3 分鐘內流量會轉到另外兩區。」</li>
<li><b>影響範圍</b>（blast radius）：會影響哪些服務、哪些使用者。越小越好。</li>
<li><b>中止條件</b>：例如錯誤率超過 2%，就立刻停止並復原。</li>
<li><b>復原方法</b>：怎麼把故障收回來，事先試過一次。</li>
</ul>
<h4>混沌工程</h4>
<p><b>混沌工程</b>（chaos engineering）是把演練變成持續、自動的實驗。Netflix 在 2010 年前後開始用 Chaos Monkey，在上班時間隨機關掉正式環境的機器，逼每個服務都得承受「機器隨時會死」。它的方法是一個循環：</p>
<figure class="figure"><svg viewBox="0 0 640 196" class="fg" style="width:100%;max-width:640px" role="img" aria-label="混沌工程的循環：定義穩態、提出假設、注入故障、觀察比較，然後修好弱點、擴大範圍再來一輪；超過中止條件就立刻停止">
<text x="395" y="24" text-anchor="middle" class="fg-t sm warm">超過中止條件 → 立刻停止、復原</text>
<line x1="395" y1="58" x2="395" y2="42" class="fg-l warm"/><polygon points="395,34 390.5,42 399.5,42" class="fg-a warm"/>
<rect x="20" y="60" width="130" height="60" rx="6" class="fg-b alt"/>
<text x="85" y="86" text-anchor="middle" class="fg-t">1 定義穩態</text><text x="85" y="106" text-anchor="middle" class="fg-t sm">正常時的指標</text>
<rect x="175" y="60" width="130" height="60" rx="6" class="fg-b"/>
<text x="240" y="86" text-anchor="middle" class="fg-t">2 提出假設</text><text x="240" y="106" text-anchor="middle" class="fg-t sm">壞了也撐得住</text>
<rect x="330" y="60" width="130" height="60" rx="6" class="fg-b warm"/>
<text x="395" y="86" text-anchor="middle" class="fg-t">3 注入故障</text><text x="395" y="106" text-anchor="middle" class="fg-t sm">從小範圍開始</text>
<rect x="485" y="60" width="130" height="60" rx="6" class="fg-b hot"/>
<text x="550" y="86" text-anchor="middle" class="fg-t">4 觀察比較</text><text x="550" y="106" text-anchor="middle" class="fg-t sm">跟對照組比</text>
<line x1="150" y1="90" x2="167" y2="90" class="fg-l"/><polygon points="175,90 167,85.5 167,94.5" class="fg-a"/>
<line x1="305" y1="90" x2="322" y2="90" class="fg-l"/><polygon points="330,90 322,85.5 322,94.5" class="fg-a"/>
<line x1="460" y1="90" x2="477" y2="90" class="fg-l"/><polygon points="485,90 477,85.5 477,94.5" class="fg-a"/>
<path d="M550 120 V160 H85 V128" class="fg-l on"/><polygon points="85,120 80.5,128 89.5,128" class="fg-a on"/>
<text x="318" y="180" text-anchor="middle" class="fg-t sm acc">修好找到的弱點，下一輪擴大一點範圍</text>
</svg><figcaption>每一輪都是一個有假設、有對照、有中止條件的實驗。假設被推翻，代表你在使用者之前找到了一個弱點。</figcaption></figure>
<p>現在常見的工具有：AWS Fault Injection Service（在 AWS 上注入停機、延遲、CPU 壓力）、Kubernetes 上的 Chaos Mesh 和 LitmusChaos，或用 Linux 的 <code>tc</code> 指令自己在網路介面加延遲、掉封包。混沌工程的重點從來不是搞破壞，而是<b>用小而可控的實驗，換來對系統真實行為的信心</b>。沒有監控、沒有中止條件的混沌實驗，只是另一種事故。</p>
<h4>幾個多數人沒看過的角落</h4>
<ul>
<li><b>監控本身也會壞。</b>Prometheus 掛了，所有警報都不會響，看起來就像一切正常。對策是設一個「永遠在響」的警報（kube-prometheus 裡叫 Watchdog），送到外部服務；外部服務一段時間沒收到它，就反過來叫人。這叫<b>死人開關</b>（dead man's switch）。</li>
<li><b>警報要分組和抑制。</b>資料庫一掛，下游 30 個服務會同時噴警報。Alertmanager 的分組（<code>group_by</code>）把它們併成一則；抑制規則（<code>inhibit_rules</code>）讓「資料庫掛了」響著的時候，壓住那些因為它才出問題的警報。</li>
<li><b>資安事故的規則不一樣。</b>一般事故越快恢復越好；資安事故要先保留證據（記憶體、日誌、磁碟快照），而且不能在攻擊者可能看得到的頻道裡討論。模組 5 會再談。</li>
<li><b>壓力會讓人變笨。</b>半夜被叫醒的人，判斷力明顯比白天差。所以處理手冊要寫到不用思考也能照做，危險的指令要有確認步驟，重大決定兩個人一起看。這不是不信任，而是承認人在壓力下的極限。</li>
</ul>

<h3>九、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>警報越多越安全</td><td>警報越多，每一個被認真看待的機會越低。真正的事故會被淹沒在雜訊裡。</td></tr>
<tr><td>CPU 高就該叫人</td><td>CPU 高是可能的原因，不是症狀。使用者沒受害，就放在儀表板上。</td></tr>
<tr><td>要先找到根本原因才能處理</td><td>先止血。使用者沒事之後，原因慢慢查。</td></tr>
<tr><td>不究責就是沒人負責</td><td>不究責是為了讓真實的資訊流出來。行動項目照樣有負責人和期限，責任落在改善系統上。</td></tr>
<tr><td>只有大事故才要寫檢討</td><td>差一點出事（near miss）也值得寫。那是代價最低的一堂課。</td></tr>
<tr><td>混沌工程就是在正式環境亂關機器</td><td>它是有假設、有影響範圍、有中止條件的實驗，通常從測試環境、從很小的範圍開始。</td></tr>
</table>

<h3>十、跟你的工作連起來</h3>
<ul>
<li><b>後端（Node.js、Go）</b>：服務一上線，就先問「它的 SLI 是什麼？燃燒率警報有沒有？」HTTP 服務至少要輸出請求數和依狀態碼分類的錯誤數，警報才寫得出來。</li>
<li><b>部署（Docker、Kubernetes、雲端主機）</b>：保留上一版的映像檔，讓退版只要一行指令，例如 <code>kubectl rollout undo</code>。退版要事先練過，不要第一次用就在事故當下。</li>
<li><b>前端（Vue、TypeScript）</b>：前端錯誤也是症狀。把瀏覽器裡的 JavaScript 錯誤和 API 失敗回報到監控服務，新版前端上線後錯誤暴增，同樣要能馬上退回上一版的靜態檔。</li>
<li><b>遊戲（Cocos、Unity）</b>：用戶端版本散在玩家的手機上，退不回來。所以伺服器端要能用功能開關關掉某個功能，或拒絕某個有問題的用戶端版本，這就是遊戲的止血手段。</li>
<li><b>自己的專案</b>：就算只有你一個人，也替服務寫一個從外部打的健康檢查和一頁處理手冊。面試時講得出「我的服務出事時，我怎麼知道、怎麼止血」，就跟只會寫功能的人不一樣。</li>
</ul>

<h3>十一、面試會怎麼問</h3>
<p>維運、SRE、後端的面試，幾乎每一場都會碰到下面幾題。先自己出聲講一遍，再打開參考答案。</p>
<ol>
<li>「你怎麼決定一個警報該不該半夜叫人？」</li>
<li>「講一次你處理過的事故：怎麼發現的、怎麼止血、事後改了什麼？」</li>
<li>「事故指揮官要做什麼？為什麼他不該自己動手修？」</li>
<li>「什麼是燃燒率警報？它比固定門檻好在哪裡？」</li>
<li>「事後檢討為什麼要不究責？如果真的是有人疏忽呢？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>只有同時滿足「使用者正在受害或即將受害」和「需要人現在動手、而且需要判斷」才叫人。所以叫人的警報針對症狀（錯誤率、延遲、成功率，最好以 SLO 的燃燒率表示），在靠近使用者的地方量；原因類指標（CPU、記憶體）放儀表板；能等的開工單；每次都同樣處理的寫成自動化。每週檢查一次呼叫，沒人需要處理的就調整或刪除。</li>
<li>用時間軸講：什麼時候、怎麼偵測到（最好是警報，不是客訴）；誰宣布、誰指揮；先做了什麼止血（例如發現剛部署就先退版）、多久恢復；止血之後怎麼找到原因；事後檢討列出哪些促成因素、做了哪些具體改動（例如加 CI 檢查、改成金絲雀部署、補燃燒率警報）。重點放在你的判斷和系統的改善，不是英雄式熬夜。</li>
<li>指揮官掌握全局：判斷嚴重度、決定優先順序、分派操作和溝通的工作、決定何時宣布止血和何時交棒。他不動手，是因為一旦開始下指令、看日誌，注意力就被一個細節吸走，沒人在看全局、協調大家、注意時間，事故現場就會變成每個人各試各的。</li>
<li>燃燒率是目前錯誤率除以 SLO 允許的錯誤率，代表錯誤預算被消耗的速度。例如 99.9% 的 SLO，1 小時內燃燒率超過 14.4，代表 1 小時燒掉整月預算的 2%，要叫人；燒得慢的開工單。搭配長短兩個時間窗，既抓得到突發大事故，也抓得到慢性漏，而且恢復後很快解除。門檻來自業務目標，不是憑感覺定的數字。</li>
<li>因為處罰會讓人隱藏資訊，而隱藏的資訊正是下一次事故的來源。事後檢討要找的是系統為什麼讓一個常見的錯誤造成大傷害：缺少檢查、缺少逐步上線、偵測太慢等等。就算有人疏忽，在同樣的系統裡換一個人也可能犯同樣的錯，修系統才有用。真正的惡意或屢次故意違規是人事問題，另外處理。</li>
</ol>
</details>

<h3>十二、練功題（做得出來才算真的懂）</h3>
<ol>
<li>一個服務的 SLO 是 30 天 99.5%。過去 6 小時的錯誤率是 4%。燃燒率是多少？照這個速度，整月預算幾天燒光？依照本章的組合，該叫人、開工單，還是不用管？</li>
<li>把下面五件事分到「叫人／工單／儀表板」：（a）一台機器 CPU 95% 持續 10 分鐘，錯誤率正常；（b）登入成功率過去 10 分鐘掉到 90%；（c）憑證 10 天後過期；（d）昨晚的備份工作失敗；（e）磁碟照目前速度，2 小時後寫滿。</li>
<li>把這句改寫成不究責的版本，並找出至少兩個促成因素：「值班工程師沒看處理手冊，直接重開資料庫，導致最近幾分鐘的資料遺失。」</li>
<li>替第四節那個事故寫三個好的行動項目，分別屬於預防、偵測、止血。</li>
<li>替你自己的一個服務設計一場演練日：寫出假設、影響範圍、中止條件、復原方法。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>允許的錯誤率是 0.5%，燃燒率 = 4% ÷ 0.5% = 8。30 ÷ 8 ≈ 3.75 天燒光。它超過「6 小時內燃燒率 &gt; 6」那一條（只要最近 30 分鐘也還超過），所以要叫人；它沒超過 14.4，所以不是最緊急的那一條。</li>
<li>（a）儀表板：使用者沒受害。（b）叫人：使用者正在受害，需要人處理。（c）工單：會發生但還有時間。（d）工單，而且要優先處理：它沒有立即傷害，但下一次災難時你會少一天的資料；如果連續失敗，就該升級。（e）叫人：兩小時內一定會變成使用者看得到的故障，而且需要人動手。</li>
<li>例如：「值班工程師在資料庫無回應 8 分鐘後執行了重開，最近幾分鐘尚未寫入磁碟的資料遺失。」促成因素可以是：處理手冊沒有從警報直接連過去，值班的人不知道它存在；重開資料庫不需要任何確認步驟；資料庫的設定在重開時會遺失未同步的寫入，而這件事沒有寫在任何地方；值班的人第一次值這個服務，沒有受過演練。</li>
<li>預防：新版本的 CI 補上「牌堆用完」的整合測試，或部署改成先推 5% 機器、觀察 10 分鐘的金絲雀部署。偵測：開局成功率改用燃燒率警報，並加上部署後 10 分鐘內錯誤率比對的自動檢查。止血：讓退版變成一鍵完成，並設定「金絲雀錯誤率超標時自動退版」。每一項都要寫負責人和期限。</li>
<li>例如：假設「關掉兩台 API 機器中的一台，錯誤率不超過 0.5%，30 秒內負載平衡器不再把流量送過去」；影響範圍「只在測試環境，只動 API 層」；中止條件「錯誤率超過 2% 或延遲 p99 超過 2 秒持續 1 分鐘」；復原方法「重新啟動那台機器，或在負載平衡器上把它加回來」。做完記下實際的數字，跟假設比較。</li>
</ol>
</details>

<h3>十三、想再挖深</h3>
<ul>
<li><b>Google《Site Reliability Engineering》</b>（免費線上版在 <a href="https://sre.google/books/">sre.google/books</a>）：〈Monitoring Distributed Systems〉〈Being On-Call〉〈Managing Incidents〉〈Postmortem Culture: Learning from Failure〉這四章，就是這一課的原典。</li>
<li><b>《The Site Reliability Workbook》</b>（同一個網站，免費）：〈Alerting on SLOs〉一章，把燃燒率警報從最簡單的寫法一路推到多時間窗的版本。</li>
<li><b>PagerDuty Incident Response 文件</b>（<a href="https://response.pagerduty.com/">response.pagerduty.com</a>）：一家公司公開的完整事故處理流程，角色、範本、訓練教材都有。</li>
<li><b>Sidney Dekker《The Field Guide to Understanding 'Human Error'》</b>：為什麼「人為疏失」不是答案，以及怎麼問出第二層的問題。</li>
<li><b>Casey Rosenthal、Nora Jones《Chaos Engineering》</b>（O'Reilly），搭配 <a href="https://principlesofchaos.org/">principlesofchaos.org</a> 的原則宣言。</li>
</ul>
` });
