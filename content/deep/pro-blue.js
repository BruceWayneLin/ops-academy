DEEP({ 'pro-blue': `
<p>上一課講了藍隊的循環：收集、偵測、判讀、應變。這一章把它拆開來看：每一種日誌到底記了什麼、一行原始文字怎麼一路變成一則警報、一條偵測規則怎麼寫、怎麼測、怎麼調到不吵人，還有威脅獵捕、誘餌，以及一個資安維運中心（security operations center，SOC）拿來衡量自己的幾個數字。讀完之後，你應該能自己寫一條規則、說出它會在哪裡誤報，並且知道怎麼證明它真的有用。</p>

<h3><span class="badge lv1">基礎</span>一、一次入侵，在五種日誌裡留下的腳印</h3>
<p>想像一棟辦公大樓遭小偷。門禁系統記下「凌晨兩點，一張員工卡刷進大門」；管理處的系統記下「有人新辦了一張門禁卡」；監視器拍到「有人在三樓搬電腦」；收發室記下「一箱很重的包裹寄出去」。每一筆單獨看都很平常：員工也會加班、也會補辦卡、也會寄包裹。<b>把它們排在同一條時間軸上，才看得出是同一個人做的一連串事</b>。</p>
<p>伺服器和雲端也一樣。一次典型的入侵，會分散在好幾種日誌裡：</p>
<figure class="figure"><svg viewBox="0 20 660 270" class="fg" style="width:100%;max-width:660px" role="img" aria-label="一次入侵的五個步驟，分別在身分、雲端稽核、端點、網路、應用五種日誌裡留下痕跡，排成一條往右下的斜線">
<text x="180" y="40" text-anchor="middle" class="fg-t sm">1 偷密碼登入</text>
<text x="280" y="40" text-anchor="middle" class="fg-t sm">2 建新金鑰</text>
<text x="380" y="40" text-anchor="middle" class="fg-t sm">3 下載腳本</text>
<text x="480" y="40" text-anchor="middle" class="fg-t sm">4 連陌生網域</text>
<text x="580" y="40" text-anchor="middle" class="fg-t sm">5 匯出資料</text>
<line x1="20" y1="62" x2="640" y2="62" class="fg-l dim"/>
<line x1="20" y1="106" x2="640" y2="106" class="fg-l dim"/>
<line x1="20" y1="150" x2="640" y2="150" class="fg-l dim"/>
<line x1="20" y1="194" x2="640" y2="194" class="fg-l dim"/>
<line x1="20" y1="238" x2="640" y2="238" class="fg-l dim"/>
<line x1="20" y1="282" x2="640" y2="282" class="fg-l dim"/>
<text x="20" y="88" class="fg-t">身分紀錄</text>
<text x="20" y="132" class="fg-t">雲端稽核</text>
<text x="20" y="176" class="fg-t">端點紀錄</text>
<text x="20" y="220" class="fg-t">網路紀錄</text>
<text x="20" y="264" class="fg-t">應用事件</text>
<rect x="136" y="70" width="88" height="28" rx="5" class="fg-b warm"/><text x="180" y="88" text-anchor="middle" class="fg-t sm">陌生國家登入</text>
<rect x="136" y="114" width="88" height="28" rx="5" class="fg-b"/><text x="180" y="132" text-anchor="middle" class="fg-t sm">主控台登入</text>
<rect x="236" y="114" width="88" height="28" rx="5" class="fg-b warm"/><text x="280" y="132" text-anchor="middle" class="fg-t sm">建立存取金鑰</text>
<rect x="336" y="158" width="88" height="28" rx="5" class="fg-b warm"/><text x="380" y="176" text-anchor="middle" class="fg-t sm">curl 接到 sh</text>
<rect x="336" y="202" width="88" height="28" rx="5" class="fg-b"/><text x="380" y="220" text-anchor="middle" class="fg-t sm">連出下載</text>
<rect x="436" y="202" width="88" height="28" rx="5" class="fg-b warm"/><text x="480" y="220" text-anchor="middle" class="fg-t sm">查陌生網域</text>
<rect x="536" y="202" width="88" height="28" rx="5" class="fg-b"/><text x="580" y="220" text-anchor="middle" class="fg-t sm">大量流出</text>
<rect x="536" y="246" width="88" height="28" rx="5" class="fg-b warm"/><text x="580" y="264" text-anchor="middle" class="fg-t sm">管理員匯出</text>
</svg><figcaption>橫的是攻擊的五個步驟，直的是五種日誌。每一種日誌只看得到一兩格；把五種放在一起，才看得到那條往右下走的斜線。</figcaption></figure>
<table>
<tr><th>日誌來源</th><th>常見的例子</th><th>它回答的問題</th><th>量</th></tr>
<tr><td><b>身分紀錄</b></td><td>身分提供者（identity provider，IdP）的登入紀錄、SSH 的 auth.log</td><td>誰、從哪裡、用什麼方式登入？成功還是失敗？</td><td>小，價值最高</td></tr>
<tr><td><b>雲端稽核日誌</b></td><td>AWS CloudTrail、GCP Cloud Audit Logs、Azure Activity Log</td><td>誰呼叫了哪一支 API、改了什麼設定？</td><td>中</td></tr>
<tr><td><b>端點紀錄</b></td><td>Linux 的 auditd、Windows 的 Sysmon、osquery、EDR 產品</td><td>哪個行程被誰啟動、帶了什麼參數、開了什麼連線？</td><td>大</td></tr>
<tr><td><b>網路紀錄</b></td><td>DNS 查詢紀錄、VPC Flow Logs、防火牆、代理伺服器</td><td>哪台機器跟誰講話、講了多少位元組？</td><td>非常大</td></tr>
<tr><td><b>應用事件</b></td><td>管理後台操作、權限變更、提款、資料匯出</td><td>在你的業務邏輯裡，誰做了什麼？</td><td>小，但只有你自己寫得出來</td></tr>
</table>
<p>幾個實務上一定要知道的細節：</p>
<ul>
<li><b>CloudTrail 預設只保留 90 天的管理事件</b>，在主控台的 Event history 查得到。要保存更久，得建立一條 trail 寫到 S3。讀寫 S3 物件這類「資料事件」（data events）預設不記，要另外打開，而且另外收費。</li>
<li><b>VPC Flow Logs 只記「誰連誰、幾個位元組、放行還是拒絕」</b>，沒有內容。它能告訴你資料庫伺服器傳了 3 GB 到某個國外位址，但不會告訴你傳了什麼。</li>
<li><b>應用事件最常被忘記。</b>攻擊者用一個合法的管理員帳號、在你的後台按「匯出全部玩家」，在其他四種日誌裡全都長得像正常操作。只有你的程式自己記下「誰在幾點匯出了幾筆」，才抓得到。</li>
<li><b>保存期限要比「發現得多慢」更長。</b>入侵常常過了好幾天、甚至好幾個月才被發現，到時候你需要回頭查。PCI DSS 的要求是稽核日誌至少保存一年，其中最近三個月要能立刻查詢；就算你不受它管，這也是個合理的起點。</li>
</ul>

<h3><span class="badge lv1">基礎</span>二、SIEM 是一條管線：把雜亂的文字變成警報</h3>
<p>SIEM 常被講成一個神祕的盒子。其實它是一條很好懂的管線，每一站做一件事：</p>
<figure class="figure"><svg viewBox="0 0 670 175" class="fg" style="width:100%;max-width:670px" role="img" aria-label="SIEM 管線六站：收集、解析正規化、豐富化、儲存索引、關聯偵測、警報，判讀結果再回饋給偵測規則">
<path d="M608 40 V26 H498 V32" class="fg-l dash"/><polygon points="498,40 493.5,32 502.5,32" class="fg-a"/>
<text x="553" y="18" text-anchor="middle" class="fg-t sm">判讀結果回饋</text>
<rect x="10" y="40" width="96" height="56" rx="6" class="fg-b"/><text x="58" y="63" text-anchor="middle" class="fg-t">收集</text><text x="58" y="83" text-anchor="middle" class="fg-t sm">agent、API</text>
<line x1="106" y1="68" x2="112" y2="68" class="fg-l"/><polygon points="120,68 112,63.5 112,72.5" class="fg-a"/>
<rect x="120" y="40" width="96" height="56" rx="6" class="fg-b"/><text x="168" y="63" text-anchor="middle" class="fg-t">解析正規化</text><text x="168" y="83" text-anchor="middle" class="fg-t sm">切欄位、統一名</text>
<line x1="216" y1="68" x2="222" y2="68" class="fg-l"/><polygon points="230,68 222,63.5 222,72.5" class="fg-a"/>
<rect x="230" y="40" width="96" height="56" rx="6" class="fg-b"/><text x="278" y="63" text-anchor="middle" class="fg-t">豐富化</text><text x="278" y="83" text-anchor="middle" class="fg-t sm">加地點、資產</text>
<line x1="326" y1="68" x2="332" y2="68" class="fg-l"/><polygon points="340,68 332,63.5 332,72.5" class="fg-a"/>
<rect x="340" y="40" width="96" height="56" rx="6" class="fg-b"/><text x="388" y="63" text-anchor="middle" class="fg-t">儲存索引</text><text x="388" y="83" text-anchor="middle" class="fg-t sm">熱存＋冷存</text>
<line x1="436" y1="68" x2="442" y2="68" class="fg-l"/><polygon points="450,68 442,63.5 442,72.5" class="fg-a"/>
<rect x="450" y="40" width="96" height="56" rx="6" class="fg-b hot"/><text x="498" y="63" text-anchor="middle" class="fg-t acc">關聯偵測</text><text x="498" y="83" text-anchor="middle" class="fg-t sm">規則＋時間窗</text>
<line x1="546" y1="68" x2="552" y2="68" class="fg-l on"/><polygon points="560,68 552,63.5 552,72.5" class="fg-a on"/>
<rect x="560" y="40" width="96" height="56" rx="6" class="fg-b warm"/><text x="608" y="63" text-anchor="middle" class="fg-t warm">警報</text><text x="608" y="83" text-anchor="middle" class="fg-t sm">工單、叫人</text>
<text x="10" y="124" class="fg-t sm acc">一筆 SSH 登入失敗走過這條管線：</text>
<text x="58" y="146" text-anchor="middle" class="fg-t sm">一行純文字</text>
<text x="168" y="146" text-anchor="middle" class="fg-t sm mono">user=root</text>
<text x="168" y="162" text-anchor="middle" class="fg-t sm mono">ip=203.0.113.7</text>
<text x="278" y="146" text-anchor="middle" class="fg-t sm">雲端機房 IP</text>
<text x="278" y="162" text-anchor="middle" class="fg-t sm">負責人：平台組</text>
<text x="388" y="146" text-anchor="middle" class="fg-t sm">一年內可回查</text>
<text x="498" y="146" text-anchor="middle" class="fg-t sm">10 分鐘失敗 20 次</text>
<text x="498" y="162" text-anchor="middle" class="fg-t sm">接著成功 1 次</text>
<text x="608" y="146" text-anchor="middle" class="fg-t sm">通知值班</text>
</svg><figcaption>前四站在整理資料，第五站才在「偵測」。前面任何一站壞掉（解析失敗、欄位沒對上），後面的規則就會安靜地瞎掉。</figcaption></figure>
<ol>
<li><b>收集</b>（collection）：在機器上裝 agent（例如 Fluent Bit、Vector、Elastic Agent、Wazuh agent）把日誌檔往外送，或用雲端的 API 把稽核日誌拉進來。原則是<b>盡快把日誌送離那台機器</b>：攻擊者拿到 root，第一件事常常就是刪本機日誌。</li>
<li><b>解析</b>（parsing）：把一行文字切成欄位。JSON 最省事；純文字要用正規表示式或 grok 這類樣式去切。</li>
<li><b>正規化</b>（normalisation）：不同來源的同一個概念，統一成同一個欄位名稱（下一節細講）。</li>
<li><b>豐富化</b>（enrichment）：替事件加上脈絡：這個 IP 在哪個國家、屬於哪家網路業者（ASN）；這台機器是誰負責、是不是正式環境；這個帳號屬於哪個部門；這個網域在不在威脅情資（threat intelligence）清單上。</li>
<li><b>儲存與索引</b>：最近 30 天放在能快速查詢的「熱」儲存，更舊的放到便宜的「冷」儲存。SIEM 的帳單大多算在這一站，通常是照每天吃進多少 GB 計價。</li>
<li><b>關聯與偵測</b>（correlation）：規則在資料上持續跑。單一事件就能判斷的（「有人建了管理員金鑰」），每筆進來就比對；要看一段時間的（「10 分鐘內失敗 20 次再成功」），就在一個滑動的時間窗（time window）裡計數。</li>
<li><b>警報</b>（alerting）：命中後開工單、發到聊天頻道，嚴重的直接叫值班的人。進一步的叫 SOAR（security orchestration, automation and response），自動做查 IP、停用帳號這類固定動作。</li>
</ol>

<h3><span class="badge lv2">進階</span>三、正規化與豐富化：讓「同一件事」長得一樣</h3>
<p>同樣是「有人登入失敗」，SSH 寫的是一行英文，CloudTrail 寫的是一包 JSON，兩者沒有任何一個欄位名稱相同。如果不先統一，你得替每一種來源各寫一條規則，而且永遠會漏掉一種。</p>
<figure class="figure"><svg viewBox="0 18 680 277" class="fg" style="width:100%;max-width:680px" role="img" aria-label="一行 sshd 文字和一段 CloudTrail JSON，經過解析後對應到同一組統一欄位：user.name、source.ip、event.action、event.outcome">
<rect x="10" y="30" width="310" height="76" rx="6" class="fg-b"/>
<text x="22" y="50" class="fg-t sm acc">sshd 日誌（一行文字）</text>
<text x="22" y="72" class="fg-t sm mono">Failed password for root</text>
<text x="22" y="90" class="fg-t sm mono">from 203.0.113.7 port 52144 ssh2</text>
<rect x="10" y="124" width="310" height="140" rx="6" class="fg-b"/>
<text x="22" y="144" class="fg-t sm alt">CloudTrail（JSON）</text>
<text x="22" y="166" class="fg-t sm mono">"eventName": "ConsoleLogin",</text>
<text x="22" y="184" class="fg-t sm mono">"sourceIPAddress": "203.0.113.7",</text>
<text x="22" y="202" class="fg-t sm mono">"userIdentity": {"userName": "alice"},</text>
<text x="22" y="220" class="fg-t sm mono">"responseElements":</text>
<text x="40" y="238" class="fg-t sm mono">{"ConsoleLogin": "Failure"}</text>
<line x1="320" y1="68" x2="352" y2="68" class="fg-l on"/><polygon points="360,68 352,63.5 352,72.5" class="fg-a on"/>
<text x="340" y="58" text-anchor="middle" class="fg-t sm">解析</text>
<line x1="320" y1="194" x2="352" y2="194" class="fg-l alt"/><polygon points="360,194 352,189.5 352,198.5" class="fg-a alt"/>
<text x="340" y="184" text-anchor="middle" class="fg-t sm">解析</text>
<rect x="360" y="30" width="310" height="234" rx="6" class="fg-b hot"/>
<text x="372" y="54" class="fg-t sm acc">統一欄位</text>
<text x="525" y="54" text-anchor="middle" class="fg-t sm acc">sshd</text>
<text x="620" y="54" text-anchor="middle" class="fg-t sm alt">CloudTrail</text>
<line x1="370" y1="70" x2="660" y2="70" class="fg-l dim"/>
<text x="372" y="96" class="fg-t sm mono">user.name</text><text x="525" y="96" text-anchor="middle" class="fg-t sm">root</text><text x="620" y="96" text-anchor="middle" class="fg-t sm">alice</text>
<line x1="370" y1="116" x2="660" y2="116" class="fg-l dim"/>
<text x="372" y="142" class="fg-t sm mono">source.ip</text><text x="525" y="142" text-anchor="middle" class="fg-t sm">203.0.113.7</text><text x="620" y="142" text-anchor="middle" class="fg-t sm">203.0.113.7</text>
<line x1="370" y1="162" x2="660" y2="162" class="fg-l dim"/>
<text x="372" y="188" class="fg-t sm mono">event.action</text><text x="525" y="188" text-anchor="middle" class="fg-t sm">ssh_login</text><text x="620" y="188" text-anchor="middle" class="fg-t sm">ConsoleLogin</text>
<line x1="370" y1="208" x2="660" y2="208" class="fg-l dim"/>
<text x="372" y="234" class="fg-t sm mono">event.outcome</text><text x="525" y="234" text-anchor="middle" class="fg-t sm">failure</text><text x="620" y="234" text-anchor="middle" class="fg-t sm">failure</text>
<text x="340" y="286" text-anchor="middle" class="fg-t sm acc">一條規則 event.outcome = failure，兩種來源一起抓</text>
</svg><figcaption>正規化之後，「登入失敗」不管從哪裡來，都是 event.outcome = failure。規則只要寫一次，換一個新的日誌來源，只要補一份對應表。</figcaption></figure>
<p>你不用自己發明欄位名稱。業界有幾套現成的共通格式（schema）：Elastic 的 <b>ECS</b>（Elastic Common Schema，上圖用的就是它的名稱）、Splunk 的 CIM，以及 AWS、Splunk 等廠商一起推的開放格式 <b>OCSF</b>（Open Cybersecurity Schema Framework）。選一套，全公司照著用。</p>
<h4>正規化最常出錯的三個地方</h4>
<ul>
<li><b>時間。</b>一台機器寫本地時間、一台寫 UTC，關聯規則的時間窗就錯開了。全部轉成 UTC，所有機器跑 NTP 對時。另外要分清楚「事件發生的時間」和「SIEM 收到的時間」：網路斷了半小時再補送的日誌，要照發生時間排。</li>
<li><b>解析默默失敗。</b>應用程式改了日誌格式，解析器切不出 <code>source.ip</code>，這些事件照樣進得來，只是少了欄位。所有用到 IP 的規則從那天起全部瞎掉，而且不會有任何錯誤訊息。要監控「每個來源解析失敗的比例」。</li>
<li><b>同名不同義。</b>某個來源的 <code>user</code> 是 email、另一個是員工編號、第三個是 Linux 帳號名。豐富化時要對到同一個人，不然「同一個人五分鐘內從兩個國家登入」永遠算不出來。</li>
</ul>
<h4>豐富化：在收進來時加，還是查詢時才加？</h4>
<p>收進來時就加（例如寫入當下查 GeoIP），查詢快、而且記下的是「當時」的答案：三個月後 IP 換了主人，你看到的仍是當時屬於誰。代價是每筆都要算、儲存變大。查詢時才加，便宜又有彈性，但答案是「現在」的。實務上，地理位置、資產負責人這種事後會變的，收進來時就加；威脅情資這種常常更新的，兩邊都做。</p>

<h3><span class="badge lv2">進階</span>四、寫一條偵測規則：Sigma 白話講，外加一次真實的調校</h3>
<p><b>Sigma</b> 是一種用 YAML 寫偵測規則的格式，像是「偵測規則界的通用語言」：寫一次，再用轉換工具（例如 sigma-cli，背後是 pySigma 函式庫）轉成 Splunk、Elastic、Microsoft Sentinel 等各家 SIEM 的查詢語法。開源的 SigmaHQ 規則庫裡有幾千條別人寫好的規則可以參考。</p>
<p>一條 Sigma 規則只有四個重點：<b>看哪種日誌</b>（logsource）、<b>找什麼樣的事件</b>（detection 裡的 selection）、<b>怎麼組合</b>（condition），以及<b>它會在哪裡誤報</b>（falsepositives）。來寫一條：「有人用密碼登入 AWS 主控台成功，但沒用 MFA」。</p>
<pre><code>title: AWS 主控台登入沒有使用 MFA
id: 7f1c2a90-5b3e-4d8a-9c61-2e4f0b8d3a17
status: experimental
description: 有人登入主控台成功，但沒有第二道驗證
date: 2026-11-01
logsource:
  product: aws
  service: cloudtrail
detection:
  selection:
    eventSource: signin.amazonaws.com
    eventName: ConsoleLogin
    responseElements.ConsoleLogin: Success
    additionalEventData.MFAUsed: 'No'
  condition: selection
falsepositives:
  - 待補
level: high
tags:
  - attack.t1078.004</code></pre>
<p>逐行看：<code>logsource</code> 說這條規則吃的是 CloudTrail；<code>selection</code> 底下的四個欄位要<b>同時</b>成立（同一個 selection 裡的欄位是 AND）；<code>condition</code> 說只要 selection 成立就響。<code>tags</code> 裡的 <code>attack.t1078.004</code> 是 MITRE ATT&amp;CK 的技術編號「有效帳號：雲端帳號」，之後拿來算偵測涵蓋率。<code>id</code> 是一個 UUID，規則改名也不會變，讓你在三年後還追得到它的歷史。</p>
<p>轉成 Splunk 之後，大概長這樣（示意，實際輸出依轉換設定而不同）：</p>
<pre><code>eventSource="signin.amazonaws.com"
eventName="ConsoleLogin"
"responseElements.ConsoleLogin"="Success"
"additionalEventData.MFAUsed"="No"</code></pre>
<h4>上線之後：三週的調校紀錄</h4>
<p>規則寫得對，不代表它好用。下面是一條規則上線後很典型的三週：</p>
<figure class="figure"><svg viewBox="0 0 640 225" class="fg" style="width:100%;max-width:640px" role="img" aria-label="同一條規則三個版本每週的警報數：第一版 280 則幾乎全是誤報，第二版 10 則全是政策違規，第三版 0 到 1 則每則都值得看">
<rect x="130" y="14" width="12" height="12" rx="2" class="fg-b"/><text x="148" y="24" class="fg-t sm">誤報（SSO 使用者）</text>
<rect x="300" y="14" width="12" height="12" rx="2" class="fg-b warm"/><text x="318" y="24" class="fg-t sm">政策違規（廠商帳號）</text>
<rect x="480" y="14" width="12" height="12" rx="2" class="fg-b hot"/><text x="498" y="24" class="fg-t sm">要處理的真警報</text>
<text x="20" y="72" class="fg-t">第 1 版</text><text x="20" y="90" class="fg-t sm">原始規則</text>
<rect x="130" y="58" width="366" height="26" rx="3" class="fg-b"/>
<rect x="496" y="58" width="14" height="26" rx="3" class="fg-b warm"/>
<text x="520" y="76" class="fg-t sm">每週 280 則</text>
<text x="20" y="132" class="fg-t">第 2 版</text><text x="20" y="150" class="fg-t sm">排除 SSO</text>
<rect x="130" y="118" width="14" height="26" rx="3" class="fg-b warm"/>
<text x="154" y="136" class="fg-t sm">每週 10 則，全是同一個廠商帳號</text>
<text x="20" y="192" class="fg-t">第 3 版</text><text x="20" y="210" class="fg-t sm">修好環境</text>
<rect x="130" y="178" width="5" height="26" rx="2" class="fg-b hot"/>
<text x="145" y="196" class="fg-t sm">每週 0～1 則，每一則都值得看</text>
</svg><figcaption>規則的邏輯三版幾乎沒變，變的是「我們對環境的了解」。調校不是把規則改鈍，而是把已知的正常行為說清楚。</figcaption></figure>
<ol>
<li><b>第 1 週，每天 40 則。</b>判讀後發現：幾乎全是透過公司 SSO 登入的同事。他們在身分提供者那邊做過 MFA，但 AWS 看不到，CloudTrail 一律記成 <code>MFAUsed: No</code>。這是<b>誤報</b>（false positive）：規則以為有事，其實沒事。</li>
<li><b>第 2 版：排除聯合登入。</b>透過 SSO 進來的身分，<code>userIdentity.type</code> 是 <code>AssumedRole</code>；只有 IAM 使用者和 root 是直接用密碼登入的。加一段排除：
<pre><code>  filter_federated:
    userIdentity.type: AssumedRole
  condition: selection and not filter_federated
falsepositives:
  - 尚未強制 MFA 的舊帳號（應該修帳號，不是修規則）</code></pre>
注意這裡用的是「<b>排除已知的正常</b>」，而不是「<b>只抓 IAMUser 和 Root</b>」。前者遇到你沒想到的新類型會照樣響（吵，但安全）；後者遇到新類型會默默放過（安靜，但瞎了）。偵測規則寧可吵，不可瞎。</li>
<li><b>第 2 週，每週 10 則</b>，全是同一個給外部廠商用的 IAM 使用者。判讀結果：沒有人在攻擊，但這個帳號確實沒開 MFA。這叫<b>良性真陽性</b>（benign true positive）：規則判斷對了，只是這次不是惡意。正確的處理<b>不是</b>把這個帳號加進排除清單，而是去修環境：替廠商帳號強制 MFA，或乾脆改成 SSO。</li>
<li><b>第 3 週之後</b>，一週 0 到 1 則。每一則都代表「有人繞過了公司的登入方式」，值得叫人。</li>
</ol>
<div class="note"><b>四種結果要分清楚。</b>真陽性（true positive）：響了，真的有事。誤報（false positive）：響了，其實沒事，要調規則。良性真陽性：響了，規則沒錯，但這次是允許的行為，要修環境或登記例外。漏報（false negative）：真的有事，規則沒響。前三種你看得到；第四種你看不到，只能靠測試和獵捕去找。</div>

<h3><span class="badge lv2">進階</span>五、分級判讀：一則警報從響起到結案</h3>
<p>分析師每天面對的是一則接一則的警報。好的判讀流程讓每一則都走同一條路，而且每一則都留下結論：</p>
<figure class="figure"><svg viewBox="0 0 670 300" class="fg" style="width:100%;max-width:670px" role="img" aria-label="判讀流程：警報響起，補脈絡，判斷是不是真的，分成誤報、良性真陽性、真的有事三條路，各自結案、修環境或升級成事件，誤報回饋去調規則">
<path d="M610 37 V24 H56 V128" class="fg-l dash"/><polygon points="56,136 51.5,128 60.5,128" class="fg-a"/>
<text x="330" y="16" text-anchor="middle" class="fg-t sm">誤報回饋：規則越調越準</text>
<rect x="10" y="136" width="92" height="48" rx="6" class="fg-b warm"/><text x="56" y="165" text-anchor="middle" class="fg-t">警報響起</text>
<line x1="102" y1="160" x2="122" y2="160" class="fg-l"/><polygon points="130,160 122,155.5 122,164.5" class="fg-a"/>
<rect x="130" y="125" width="128" height="70" rx="6" class="fg-b"/><text x="194" y="150" text-anchor="middle" class="fg-t">補脈絡</text>
<text x="194" y="168" text-anchor="middle" class="fg-t sm">誰？哪台機器？</text><text x="194" y="184" text-anchor="middle" class="fg-t sm">平常也這樣嗎？</text>
<line x1="258" y1="160" x2="278" y2="160" class="fg-l"/><polygon points="286,160 278,155.5 278,164.5" class="fg-a"/>
<polygon points="336,120 386,160 336,200 286,160" class="fg-b alt"/><text x="336" y="165" text-anchor="middle" class="fg-t">是真的嗎</text>
<path d="M386 160 H405 V60 H422" class="fg-l"/><polygon points="430,60 422,55.5 422,64.5" class="fg-a"/>
<line x1="386" y1="160" x2="422" y2="160" class="fg-l"/><polygon points="430,160 422,155.5 422,164.5" class="fg-a"/>
<path d="M405 160 V260 H422" class="fg-l"/><polygon points="430,260 422,255.5 422,264.5" class="fg-a"/>
<rect x="430" y="37" width="104" height="46" rx="6" class="fg-b"/><text x="482" y="56" text-anchor="middle" class="fg-t">誤報</text><text x="482" y="74" text-anchor="middle" class="fg-t sm">規則判斷錯了</text>
<rect x="430" y="137" width="104" height="46" rx="6" class="fg-b warm"/><text x="482" y="156" text-anchor="middle" class="fg-t">良性真陽性</text><text x="482" y="174" text-anchor="middle" class="fg-t sm">對了但沒惡意</text>
<rect x="430" y="237" width="104" height="46" rx="6" class="fg-b hot"/><text x="482" y="256" text-anchor="middle" class="fg-t acc">真的有事</text><text x="482" y="274" text-anchor="middle" class="fg-t sm">有人在做壞事</text>
<line x1="534" y1="60" x2="550" y2="60" class="fg-l"/><polygon points="558,60 550,55.5 550,64.5" class="fg-a"/>
<line x1="534" y1="160" x2="550" y2="160" class="fg-l"/><polygon points="558,160 550,155.5 550,164.5" class="fg-a"/>
<line x1="534" y1="260" x2="550" y2="260" class="fg-l on"/><polygon points="558,260 550,255.5 550,264.5" class="fg-a on"/>
<rect x="558" y="37" width="104" height="46" rx="6" class="fg-b"/><text x="610" y="56" text-anchor="middle" class="fg-t">結案附理由</text><text x="610" y="74" text-anchor="middle" class="fg-t sm">回去調規則</text>
<rect x="558" y="137" width="104" height="46" rx="6" class="fg-b"/><text x="610" y="156" text-anchor="middle" class="fg-t">結案＋修環境</text><text x="610" y="174" text-anchor="middle" class="fg-t sm">或登記例外</text>
<rect x="558" y="237" width="104" height="46" rx="6" class="fg-b hot"/><text x="610" y="256" text-anchor="middle" class="fg-t acc">升級成事件</text><text x="610" y="274" text-anchor="middle" class="fg-t sm">交給事件應變</text>
</svg><figcaption>三條路都有出口，沒有一則警報可以「看過就算了」。最上面那條虛線最重要：每一則誤報，都是讓規則變準的材料。</figcaption></figure>
<p>用上一節的「沒用 MFA 登入」走一次：</p>
<ol>
<li><b>補脈絡（5 分鐘內）。</b>這個 IAM 使用者是誰的？最近 30 天他都從哪些 IP 登入？這次的 IP 屬於哪家網路業者？登入後做了什麼（查 CloudTrail 接下來 15 分鐘的事件）？大部分 SIEM 和 SOAR 可以把這些查詢自動做好，貼在警報裡。</li>
<li><b>問本人，但走另一條管道。</b>不要回覆警報信去問，因為那個信箱可能也被拿走了。打電話、或在公司的聊天工具裡直接問。</li>
<li><b>下結論。</b>本人說「是我，在機場用手機登入」，而 IP 確實是某家行動網路業者、登入後只看了帳單，就是良性真陽性：結案，並開一張單要他補 MFA。如果本人說「我沒有登入」，或登入後馬上去建新的存取金鑰，就是真的有事：立刻升級。</li>
<li><b>寫結案說明。</b>一兩句話就好：「本人確認，行動網路 IP，登入後僅檢視帳單；已開單補 MFA。」半年後有人問「這則為什麼結掉」，答案就在這裡。稽核時，這也是證明「我們有在看警報」的佐證資料。</li>
</ol>
<p>判讀的速度靠的是事先準備：每條規則都附一份<b>處理手冊</b>（runbook），寫清楚「響了先查哪三件事、什麼情況要升級、找誰」。模組 4 的事故處理講過同樣的道理。</p>

<h3><span class="badge lv3">專業</span>六、偵測即程式碼：規則也要有 code review 和測試</h3>
<p>規則散落在 SIEM 的網頁介面裡，誰改了什麼、為什麼改，沒人說得清。成熟的團隊把規則當成程式碼來管，叫<b>偵測即程式碼</b>（detection as code）：規則放在 git，改動走 pull request，合併前跑自動測試，合併後自動部署到 SIEM。</p>
<figure class="figure"><svg viewBox="0 16 670 216" class="fg" style="width:100%;max-width:670px" role="img" aria-label="偵測即程式碼的流程：寫規則加測試樣本、格式檢查、樣本測試、轉換部署、模擬攻擊、健康檢查；前兩關失敗擋下合併，後兩關失敗開工單，再回到寫規則">
<rect x="10" y="30" width="96" height="56" rx="6" class="fg-b alt"/><text x="58" y="53" text-anchor="middle" class="fg-t">寫規則</text><text x="58" y="73" text-anchor="middle" class="fg-t sm">＋測試樣本</text>
<line x1="106" y1="58" x2="112" y2="58" class="fg-l"/><polygon points="120,58 112,53.5 112,62.5" class="fg-a"/>
<rect x="120" y="30" width="96" height="56" rx="6" class="fg-b"/><text x="168" y="53" text-anchor="middle" class="fg-t">格式檢查</text><text x="168" y="73" text-anchor="middle" class="fg-t sm">欄位、語法</text>
<line x1="216" y1="58" x2="222" y2="58" class="fg-l"/><polygon points="230,58 222,53.5 222,62.5" class="fg-a"/>
<rect x="230" y="30" width="96" height="56" rx="6" class="fg-b"/><text x="278" y="53" text-anchor="middle" class="fg-t">樣本測試</text><text x="278" y="73" text-anchor="middle" class="fg-t sm">該響、不該響</text>
<line x1="326" y1="58" x2="332" y2="58" class="fg-l"/><polygon points="340,58 332,53.5 332,62.5" class="fg-a"/>
<rect x="340" y="30" width="96" height="56" rx="6" class="fg-b"/><text x="388" y="53" text-anchor="middle" class="fg-t">轉換部署</text><text x="388" y="73" text-anchor="middle" class="fg-t sm">轉成 SIEM 查詢</text>
<line x1="436" y1="58" x2="442" y2="58" class="fg-l"/><polygon points="450,58 442,53.5 442,62.5" class="fg-a"/>
<rect x="450" y="30" width="96" height="56" rx="6" class="fg-b"/><text x="498" y="53" text-anchor="middle" class="fg-t">模擬攻擊</text><text x="498" y="73" text-anchor="middle" class="fg-t sm">每週自動跑</text>
<line x1="546" y1="58" x2="552" y2="58" class="fg-l"/><polygon points="560,58 552,53.5 552,62.5" class="fg-a"/>
<rect x="560" y="30" width="96" height="56" rx="6" class="fg-b hot"/><text x="608" y="53" text-anchor="middle" class="fg-t acc">健康檢查</text><text x="608" y="73" text-anchor="middle" class="fg-t sm">資料還在流嗎</text>
<line x1="168" y1="86" x2="168" y2="122" class="fg-l warm"/><polygon points="168,130 163.5,122 172.5,122" class="fg-a warm"/>
<line x1="278" y1="86" x2="278" y2="122" class="fg-l warm"/><polygon points="278,130 273.5,122 282.5,122" class="fg-a warm"/>
<rect x="120" y="130" width="206" height="40" rx="6" class="fg-b warm"/><text x="223" y="155" text-anchor="middle" class="fg-t">失敗就擋下合併</text>
<line x1="498" y1="86" x2="498" y2="122" class="fg-l warm"/><polygon points="498,130 493.5,122 502.5,122" class="fg-a warm"/>
<line x1="608" y1="86" x2="608" y2="122" class="fg-l warm"/><polygon points="608,130 603.5,122 612.5,122" class="fg-a warm"/>
<rect x="450" y="130" width="206" height="40" rx="6" class="fg-b warm"/><text x="553" y="155" text-anchor="middle" class="fg-t">沒響或沒資料：開工單</text>
<path d="M553 170 V196 H58 V94" class="fg-l dash"/><polygon points="58,86 53.5,94 62.5,94" class="fg-a"/>
<text x="305" y="218" text-anchor="middle" class="fg-t sm">規則像程式一樣，持續修、持續測</text>
</svg><figcaption>左邊兩關在合併前把關：規則寫錯就進不去。右邊兩關在上線後持續驗證：規則還會不會響、資料還有沒有進來。</figcaption></figure>
<p>一個規則庫大概長這樣：</p>
<pre><code>detections/
  aws/console_login_no_mfa.yml
tests/
  aws/console_login_no_mfa/
    hit_iam_user_no_mfa.json     # 一定要響
    miss_sso_assumed_role.json   # 一定不能響
    miss_iam_user_with_mfa.json  # 一定不能響</code></pre>
<p>測試樣本就是真實事件的去識別化副本。上一節第 1 週那 270 則誤報，挑一則存成 <code>miss_sso_assumed_role.json</code>，以後任何人改規則，只要讓 SSO 使用者又開始響，測試就紅了。<b>每一次調校，都留下一個測試樣本</b>，規則就不會退步。</p>
<h4>三種測試，各抓一種錯</h4>
<ul>
<li><b>格式檢查</b>：YAML 對不對、必填欄位齊不齊、ATT&amp;CK 標籤存不存在。sigma-cli 有 check 指令可以做。</li>
<li><b>樣本測試</b>：把規則轉成查詢，對著樣本跑，確認該響的響、不該響的不響。這是規則的單元測試。</li>
<li><b>模擬攻擊</b>：在測試環境真的做一次那個動作，看整條管線（收集、解析、規則、警報）是不是全通。開源的 <b>Atomic Red Team</b> 替很多 ATT&amp;CK 技術準備了小而安全的測試，例如「建立一個新的本機帳號」「下載並執行腳本」。這一關抓的是樣本測試抓不到的東西：日誌根本沒收到、欄位名稱在正式環境不一樣。</li>
</ul>
<h4>最危險的規則：從來不響的那條</h4>
<p>一條規則半年沒響，有兩種可能：環境很乾淨，或者它早就瞎了。最常見的瞎法是<b>資料斷流</b>：某台機器的 agent 掛了、雲端的 trail 被誤關、日誌格式改了解析不出來。所以要有<b>健康檢查</b>：每個日誌來源設一個「心跳」警報，例如「CloudTrail 超過 30 分鐘沒有任何新事件」就響。攻擊者入侵雲端帳號後，常見的動作之一就是呼叫 <code>StopLogging</code> 或刪掉 trail；這兩個 API 呼叫本身，也一定要有規則。</p>
<p>每條規則還要帶著<b>中繼資料</b>：負責人、嚴重度、對應的 ATT&amp;CK 技術、處理手冊連結、最後一次驗證通過的日期。有了 ATT&amp;CK 對應，你就能畫出一張「哪些技術我們抓得到」的涵蓋率圖。但要小心：圖上一格塗了顏色，只代表你有一條規則，不代表那個技術的每一種變形你都抓得到。</p>

<h3><span class="badge lv3">專業</span>七、威脅獵捕：帶著假設，主動去找</h3>
<p>規則是被動的：它只抓你已經想到的事。<b>威脅獵捕</b>（threat hunting）是主動的：假設攻擊者已經在裡面、而且沒觸發任何規則，那他會留下什麼？然後去找。</p>
<p>好的獵捕從一個<b>可以被證明或推翻的假設</b>開始，不是「看看有沒有怪怪的東西」。用一個例子走一次：</p>
<ol>
<li><b>假設</b>：「如果 CI 用的雲端存取金鑰外洩了（例如被印在建置日誌裡），攻擊者會從 CI 以外的地方拿它來呼叫 API。」</li>
<li><b>需要的資料</b>：CloudTrail 裡，<code>userIdentity.accessKeyId</code> 是那把 CI 金鑰的所有事件，過去 90 天。</li>
<li><b>做法：堆疊計數</b>（stacking）。照 <code>sourceIPAddress</code> 分組計數，從最少的看起。正常情況下，你只會看到 CI 跑者固定的幾個出口 IP，每個都有幾萬筆。</li>
<li><b>結果</b>：三個 IP 各有幾萬筆，是 CI 的 NAT 出口；另外一個 IP 只有 2 筆，屬於某家住宅網路業者，呼叫的是 <code>ListBuckets</code>。只有兩筆、而且是「先看看有什麼」的 API，這正是值得深挖的樣子。</li>
<li><b>收尾</b>：不管有沒有找到入侵，獵捕都要留下東西。這次的假設很適合變成一條常駐規則：「CI 金鑰從已知出口以外的 IP 被使用」。或者你發現 S3 的資料事件沒打開、根本看不到他讀了什麼，那就是一個<b>能見度缺口</b>，要補。</li>
</ol>
<p>獵捕的假設從哪裡來？從 ATT&amp;CK 裡挑一個你還沒有規則的技術；從同業最近被入侵的報告；從你自己系統最值錢的東西倒推（「如果我是攻擊者，要偷玩家資料，會走哪條路？」）。</p>
<h4>為什麼要抓「行為」而不是「指標」</h4>
<p>上一課說過，行為比指標耐用。David Bianco 在 2013 年提出的<b>痛苦金字塔</b>（Pyramid of Pain）把這件事講得最清楚：你封鎖的東西越往上層，攻擊者要換掉它就越痛。</p>
<table>
<tr><th>層級（由下往上）</th><th>例子</th><th>攻擊者換掉它要花多少力氣</th></tr>
<tr><td>檔案雜湊值</td><td>某個惡意程式的 SHA-256</td><td>幾乎不用力：重新編譯就變了</td></tr>
<tr><td>IP 位址</td><td>攻擊來源的 IP</td><td>很容易：換一台雲端主機</td></tr>
<tr><td>網域名稱</td><td>惡意程式連回去的網域</td><td>簡單：花一點錢註冊新的</td></tr>
<tr><td>網路與主機上的痕跡</td><td>特殊的 User-Agent、固定的檔名</td><td>有點煩：要改工具的細節</td></tr>
<tr><td>工具</td><td>某套特定的攻擊框架</td><td>有挑戰：要換一套工具重新學</td></tr>
<tr><td>手法（TTP）</td><td>「讀中繼資料服務的憑證，再從新位址呼叫 API」</td><td>最痛：要改變做事的方式</td></tr>
</table>
<p>上面那條「CI 金鑰從陌生 IP 被使用」就是一條行為規則：它不在乎攻擊者用哪個 IP、哪套工具，只在乎「這把金鑰出現在不該出現的地方」。</p>

<h3><span class="badge lv4">專家</span>八、誘餌與欺敵：讓攻擊者自己按下警報</h3>
<p>前面所有的規則，都在做同一件困難的事：從大量正常行為裡分辨出不正常的。誘餌（honeytoken，也叫 canary）把問題反過來：<b>先做一個正常人永遠不會碰的東西</b>，那麼任何碰觸都是不正常的，不需要分辨。</p>
<figure class="figure"><svg viewBox="0 24 660 186" class="fg" style="width:100%;max-width:660px" role="img" aria-label="誘餌金鑰的機制：攻擊者進入機器，翻到看起來像真的憑證檔，拿去呼叫雲端 API，誘餌所在帳號的稽核紀錄觸發，幾分鐘內通知你；正常使用者從不碰它，所以沒有誤報">
<rect x="10" y="40" width="110" height="50" rx="6" class="fg-b warm"/><text x="65" y="62" text-anchor="middle" class="fg-t">攻擊者進來</text><text x="65" y="80" text-anchor="middle" class="fg-t sm">不管從哪裡</text>
<line x1="120" y1="65" x2="134" y2="65" class="fg-l warm"/><polygon points="142,65 134,60.5 134,69.5" class="fg-a warm"/>
<rect x="142" y="40" width="110" height="50" rx="6" class="fg-b"/><text x="197" y="62" text-anchor="middle" class="fg-t">翻到憑證檔</text><text x="197" y="80" text-anchor="middle" class="fg-t sm">看起來像真的</text>
<line x1="252" y1="65" x2="266" y2="65" class="fg-l warm"/><polygon points="274,65 266,60.5 266,69.5" class="fg-a warm"/>
<rect x="274" y="40" width="110" height="50" rx="6" class="fg-b"/><text x="329" y="62" text-anchor="middle" class="fg-t">拿去試用</text><text x="329" y="80" text-anchor="middle" class="fg-t sm">呼叫雲端 API</text>
<line x1="384" y1="65" x2="398" y2="65" class="fg-l warm"/><polygon points="406,65 398,60.5 398,69.5" class="fg-a warm"/>
<rect x="406" y="40" width="110" height="50" rx="6" class="fg-b"/><text x="461" y="62" text-anchor="middle" class="fg-t">稽核紀錄</text><text x="461" y="80" text-anchor="middle" class="fg-t sm">誘餌所在帳號</text>
<line x1="516" y1="65" x2="530" y2="65" class="fg-l on"/><polygon points="538,65 530,60.5 530,69.5" class="fg-a on"/>
<rect x="538" y="40" width="110" height="50" rx="6" class="fg-b hot"/><text x="593" y="62" text-anchor="middle" class="fg-t acc">通知你</text><text x="593" y="80" text-anchor="middle" class="fg-t sm">幾分鐘內</text>
<line x1="10" y1="118" x2="648" y2="118" class="fg-l dim dash"/>
<rect x="10" y="140" width="110" height="46" rx="6" class="fg-b alt"/><text x="65" y="161" text-anchor="middle" class="fg-t">正常使用者</text><text x="65" y="178" text-anchor="middle" class="fg-t sm">和正常程式</text>
<line x1="120" y1="163" x2="134" y2="163" class="fg-l alt"/><polygon points="142,163 134,158.5 134,167.5" class="fg-a alt"/>
<rect x="142" y="140" width="110" height="46" rx="6" class="fg-b"/><text x="197" y="161" text-anchor="middle" class="fg-t">從不碰它</text><text x="197" y="178" text-anchor="middle" class="fg-t sm">沒有理由用</text>
<line x1="252" y1="163" x2="266" y2="163" class="fg-l alt"/><polygon points="274,163 266,158.5 266,167.5" class="fg-a alt"/>
<rect x="274" y="140" width="110" height="46" rx="6" class="fg-b"/><text x="329" y="168" text-anchor="middle" class="fg-t">0 則警報</text>
<text x="420" y="158" class="fg-t sm">沒有人有正當理由碰它，</text>
<text x="420" y="176" class="fg-t sm">所以響一次，就是出事一次。</text>
</svg><figcaption>上面那條路，攻擊者自己完成了偵測的每一步；下面那條路，正常的人和程式根本不會走。誤報率接近零，是設計出來的，不是調出來的。</figcaption></figure>
<h4>誘餌可以放在哪裡</h4>
<ul>
<li><b>假的雲端金鑰</b>：放在伺服器的 <code>~/.aws/credentials</code>、CI 的環境變數、程式碼倉庫的設定範例檔裡。那把金鑰沒有任何權限，但只要有人拿它呼叫 API，稽核日誌就會記下來。</li>
<li><b>假的資料庫紀錄</b>：在玩家資料表裡放一筆假玩家，email 用一個只有你收得到的信箱。哪天那個信箱收到信，就代表整張表被拿走、而且被拿去用了。</li>
<li><b>假的帳號</b>：在目錄服務裡建一個名字很誘人的管理員帳號（例如 <code>backup-admin</code>），沒有任何人會用它登入。任何一次登入嘗試都要響。</li>
<li><b>假的網址與文件</b>：內部 wiki 上一份叫「正式環境密碼.docx」的檔案，一打開就會對外連一個專屬網址；或在 robots.txt 裡列一個不存在的「後台路徑」，任何人去存取都值得看一眼。</li>
</ul>
<h4>攻擊者也會反偵測</h4>
<p>誘餌不是萬無一失。有經驗的攻擊者拿到一把 AWS 金鑰，會先想辦法確認它是不是誘餌，而且不想留下紀錄。例如 AWS 有一支 API 可以從存取金鑰 ID 查出它屬於哪個帳號，而這次查詢只記在<b>查詢者自己</b>的帳號裡，金鑰的主人看不到。如果查出來是某個知名誘餌服務的帳號，他就不碰了。對策是：重要的誘餌放在你<b>自己的</b>帳號裡，跟真的資源長得一樣，權限設成零，再對那把金鑰的任何使用設規則。誘餌的價值在於「看起來跟真的一模一樣」，越像，越有效。</p>
<p>欺敵（deception）只能用在你自己的系統裡，目的是偵測，不是反擊。拿誘餌去「反駭」對方，在台灣和多數國家都可能違法。</p>

<h3><span class="badge lv4">專家</span>九、SOC 的數字：MTTD、MTTR 與警報轉事件比</h3>
<p>藍隊做得好不好，要有數字。最常見的三個：</p>
<ul>
<li><b>平均偵測時間</b>（mean time to detect，MTTD）：從入侵開始，到你發現為止。從攻擊者角度看，這段時間叫<b>潛伏時間</b>（dwell time）。</li>
<li><b>平均應變時間</b>（mean time to respond，MTTR）：從發現，到圍堵完成為止。注意 MTTR 這個縮寫有好幾種意思（respond、recover、remediate），報告裡一定要寫清楚你量的是哪一段。</li>
<li><b>警報轉事件比</b>（alert-to-incident ratio）：所有警報裡，最後真的升級成事件的比例。它反映規則的精確度，也決定分析師的時間花在哪裡。</li>
</ul>
<h4>算一次：平均數會騙人</h4>
<p>一季裡有 5 起事件，偵測時間分別是 2 小時、0.5 小時、1 小時、3 小時，還有一起是 30 天（720 小時）後才發現的。</p>
<ul>
<li>平均：(2 + 0.5 + 1 + 3 + 720) ÷ 5 = 145.3 小時，大約 6 天。</li>
<li>中位數：排序後是 0.5、1、2、3、720，中間那個是 2 小時。</li>
</ul>
<p>兩個數字講的是不同的故事。中位數說「我們通常兩小時內發現」，平均數被那一起 30 天的拉高了。真正該拿去開會的，是那一起 30 天的：它為什麼沒被抓到？是沒有日誌、沒有規則，還是規則響了但被當成誤報結掉？所以報告時要同時給中位數和最慢的那幾起，並且<b>逐一檢討最慢的那幾起</b>。Mandiant 每年出版的 M-Trends 報告會統計全球的潛伏時間中位數，近年大約在十天上下，可以拿來當外部對照。</p>
<h4>警報量決定你要幾個人</h4>
<p>一個月 1,200 則警報，最後升級成事件的有 18 起，警報轉事件比是 18 ÷ 1,200 = 1.5%。如果每則平均要花 10 分鐘判讀，就是 12,000 分鐘、200 小時，大約要 1.25 個全職人力（一個人一個月約 160 小時）專門在看警報，而其中 98.5% 的時間花在不是事件的東西上。</p>
<p>所以真正有用的，是<b>每條規則各自的精確度</b>：</p>
<table>
<tr><th>規則</th><th>每月警報</th><th>升級成事件</th><th>該怎麼辦</th></tr>
<tr><td>SSH 暴力破解後成功</td><td>600</td><td>1</td><td>先關掉密碼登入，這條規則的量自然會降到接近零</td></tr>
<tr><td>主控台登入沒用 MFA</td><td>4</td><td>1</td><td>好規則，保留</td></tr>
<tr><td>誘餌金鑰被使用</td><td>1</td><td>1</td><td>最好的規則，多放幾個</td></tr>
<tr><td>正式機上 curl 接 sh</td><td>40</td><td>2</td><td>把部署腳本的正常用法加進排除，或改掉部署方式</td></tr>
</table>
<p>最後要記得古德哈特定律（Goodhart's law）：一個數字變成目標，它就不再是好的衡量。如果你只考核 MTTR，分析師會傾向把事件早早結案；如果只考核警報量，大家會把規則改鈍。數字是拿來找問題的，不是拿來打分數的。</p>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>買了 SIEM 就有偵測能力</td><td>SIEM 只是管線和資料庫。偵測能力來自日誌收得對、解析得對、規則寫得好、有人判讀。工具只佔其中一小部分。</td></tr>
<tr><td>日誌收越多越好</td><td>收進來的每一 GB 都要付錢、都會拖慢查詢。先收價值高的（身分、雲端稽核），再依偵測需要加，而不是全部丟進去再說。</td></tr>
<tr><td>誤報多就把規則刪掉</td><td>先分清楚是誤報還是良性真陽性。前者調規則，後者修環境。刪掉之前問一句：那這種攻擊以後誰來抓？</td></tr>
<tr><td>規則一直沒響，代表很安全</td><td>也可能是資料斷流、欄位改名、規則寫錯。沒有模擬攻擊和健康檢查，你分不出這兩種。</td></tr>
<tr><td>封鎖攻擊者的 IP 就好</td><td>IP 在痛苦金字塔的最底層，換一個只要幾分鐘。封鎖可以減緩，但真正耐用的是針對行為的規則。</td></tr>
<tr><td>威脅獵捕沒找到東西就是白做</td><td>沒找到也有產出：一條新規則、一個補起來的能見度缺口，或一份「這個假設被推翻了」的紀錄。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>後端（Node.js、Go）</b>：你寫的程式就是「應用事件」的唯一來源。登入、權限變更、匯出資料、修改餘額這些動作，輸出一行結構化的 JSON（誰、對什麼、結果、來源 IP、請求 ID），藍隊就能直接用，不用再寫解析器。不要把密碼、token、完整的個人資料寫進日誌。</li>
<li><b>前端（Vue、TypeScript）</b>：前端的錯誤回報和行為分析會送到外部服務，那也是一種日誌。檢查送出去的內容裡有沒有 token 或個人資料；內容安全政策（CSP）的違規回報，也是一個很好的偵測訊號。</li>
<li><b>遊戲（Cocos、Unity）</b>：外掛和盜號，在伺服器端看起來就是「不可能的行為」：一秒內完成十局、同一個帳號同時從兩個國家連線。這些就是遊戲版的偵測規則，思路跟本章完全一樣。</li>
<li><b>Docker 與雲端伺服器</b>：容器的日誌要送到 stdout，再由收集器帶走，不要只寫在容器裡的檔案，因為容器一刪就沒了。雲端帳號第一天就要打開稽核日誌，並且寫到另一個權限分開的帳號。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<p>資安維運、偵測工程、雲端資安的面試很常出現下面這些題目。先自己講一遍，再打開參考答案。</p>
<ol>
<li>「如果只能收三種日誌，你會選哪三種？為什麼？」</li>
<li>「說說你怎麼寫、怎麼測一條偵測規則。上線後誤報很多怎麼辦？」</li>
<li>「誤報和良性真陽性有什麼不同？處理方式有什麼不同？」</li>
<li>「一條規則半年都沒響過，你會怎麼判斷它是好是壞？」</li>
<li>「什麼是威脅獵捕？給我一個你會做的獵捕假設。」</li>
<li>「你會用哪些數字衡量一個 SOC？這些數字有什麼陷阱？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>身分紀錄（登入成功與失敗、MFA 變更）、雲端稽核日誌（每一次 API 呼叫與設定變更），以及正式環境主機的端點紀錄（行程啟動與參數）。理由是大部分入侵都要經過「拿到身分」和「在雲端或主機上做事」，這三種量相對小、價值最高。網路流量紀錄量很大、又沒有內容，排在後面；應用事件很重要，但需要開發團隊自己先把它做出來。</li>
<li>先寫清楚假設：要抓哪個攻擊行為、對應哪個 ATT&amp;CK 技術、用哪種日誌。用 Sigma 這類格式寫成程式碼放在 git，附上「該響」與「不該響」的測試樣本，CI 跑格式檢查和樣本測試，合併後自動部署。再用 Atomic Red Team 之類的工具在測試環境真的做一次，確認整條管線通。上線後誤報多，逐則判讀分類：真的誤報就排除那種已知的正常行為，並把那則存成新的測試樣本；排除時寧可用「排除已知正常」，不用「只抓已知類型」，避免默默漏掉新情況。</li>
<li>誤報是規則判斷錯了，根本沒有發生規則想抓的事，要調規則。良性真陽性是規則判斷對了，事情確實發生了，只是這次是被允許的，例如工程師自己用沒開 MFA 的舊帳號登入。後者不該靠調規則解決，而是修環境（補 MFA、移除舊帳號），或登記一個有到期日的例外。</li>
<li>先看資料：那條規則需要的日誌來源，這半年有沒有持續進來、需要的欄位有沒有被解析出來。再做一次模擬攻擊，看它響不響。如果資料正常、模擬也會響，那它就是一條好規則，只是環境裡沒發生過；如果模擬不響，就是壞掉了，要修。之後把模擬攻擊排成定期自動跑，並替資料來源加心跳警報。</li>
<li>威脅獵捕是假設攻擊者已經在裡面、沒觸發任何規則，主動用資料去證明或推翻一個具體的假設。例如：「如果 CI 的雲端金鑰外洩，它會被從 CI 出口以外的 IP 使用。」做法是撈出那把金鑰過去 90 天的所有事件，依來源 IP 堆疊計數，從最少的看起。沒找到入侵，也要把它變成一條常駐規則，或記下發現的能見度缺口。</li>
<li>MTTD（含潛伏時間）、MTTR（要說清楚是 respond 還是 recover）、警報轉事件比、每條規則的精確度、日誌來源的涵蓋率。陷阱是：平均數會被少數極端值拉歪，要同時看中位數和最慢的幾起；數字一旦拿來考核，大家會為了數字而改變行為，例如提早結案、把規則改鈍。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>上一課的 SSH 指令，是在數「失敗了幾次」。把它改成一個真正的偵測問題：「同一個 IP 失敗超過 20 次，而且之後成功了一次」。用你自己的話寫出這條規則需要哪些欄位、什麼時間窗。</li>
<li>替「正式環境的機器上執行了 <code>curl</code>，而且同一個父行程接著執行了 <code>sh</code> 或 <code>bash</code>」想出三種會誤報的正常情況，並說明每一種該調規則、還是該修環境。</li>
<li>你的 SIEM 每天吃進 50 GB，老闆要你砍掉一半的費用。列出你會先砍哪些、絕對不砍哪些，並說出理由。</li>
<li>設計一個獵捕假設，主題是「有人拿到了某位工程師的筆電」。寫出假設、要用的資料、怎麼找、找不到的話要留下什麼。</li>
<li>一個月有 900 則警報、升級成事件 9 起，每則平均判讀 12 分鐘。算出警報轉事件比、每月花在判讀的人力小時，並說出你第一步會做什麼。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>需要的欄位：<code>source.ip</code>、<code>event.outcome</code>（failure／success）、事件時間，最好還有 <code>user.name</code>。規則是：以 source.ip 分組，在 10 分鐘的滑動時間窗裡，failure 的數量 ≥ 20，而且在這些失敗之後出現至少一筆同 IP 的 success。單看「失敗 20 次」只是雜訊（網際網路上隨時都有人在猜），加上「之後成功」才是有意義的訊號。如果密碼登入已經關掉，這條規則的價值就轉成「確認沒有人用其他方式成功」。</li>
<li>例子：一、雲端主機開機時的初始化腳本（cloud-init）下載安裝程式：通常是固定網址、固定時間，可以在規則裡排除那個父行程與網址，但更好的做法是改成把安裝程式事先放進映像檔（修環境）。二、設定管理或部署工具在機器上跑安裝腳本：同理，排除那個工具的服務帳號，並且要求它只從內部的檔案來源下載。三、工程師上機除錯時手動安裝工具：這是良性真陽性，正確的處理是修流程（正式環境不該手動裝東西），而不是排除那位工程師。</li>
<li>先砍或降級：量大、價值低、可以改用抽樣或摘要的，例如所有 VPC Flow Logs 改成只收被拒絕的連線和對外流量、除錯等級的應用日誌不送 SIEM、健康檢查的存取紀錄。也可以把一部分改成只放冷儲存，需要時再查。絕對不砍：身分紀錄、雲端稽核日誌、管理操作的應用事件，以及正式環境主機的行程啟動紀錄，因為它們量小、而且是大部分規則和事後調查的基礎。</li>
<li>假設：「如果有人拿到工程師的筆電，他會用筆電裡已登入的 session 或存著的金鑰，在非上班時間、或從那位工程師平常不會出現的網路，存取程式碼倉庫和雲端。」資料：身分提供者的登入紀錄、程式碼倉庫的稽核日誌（clone、新增 SSH 金鑰、新增 token）、CloudTrail。做法：列出每位工程師平常的登入時段與網路，找出偏離的；特別看大量 clone 和新建 token。找不到的話，留下一條規則（例如「新增個人存取 token 後一小時內大量 clone」），以及一份清單：筆電遺失時要撤銷哪些 session 和金鑰。</li>
<li>比例：9 ÷ 900 = 1%。人力：900 × 12 = 10,800 分鐘 = 180 小時，大約 1.1 個全職人力，其中 99% 花在不是事件的警報上。第一步：依規則分組，找出產生最多警報、卻幾乎沒升級過的前三條規則，逐一判斷是誤報（調規則、存成測試樣本）還是良性真陽性（修環境），通常這三條就佔了一大半的量。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>SigmaHQ 規則庫</b>（<a href="https://github.com/SigmaHQ/sigma">github.com/SigmaHQ/sigma</a>）：幾千條開源的 Sigma 規則和格式說明。挑一個你熟的日誌來源，把那個資料夾裡的規則一條一條讀懂，是最快的學法。</li>
<li><b>MITRE ATT&amp;CK</b>（<a href="https://attack.mitre.org/">attack.mitre.org</a>）：攻擊手法的共同語言。每個技術頁面都寫了「怎麼偵測」和「需要哪種資料來源」。</li>
<li><b>Atomic Red Team</b>（<a href="https://github.com/redcanaryco/atomic-red-team">github.com/redcanaryco/atomic-red-team</a>）：依 ATT&amp;CK 技術整理的小型模擬測試，拿來驗證你的規則真的會響。只在你自己的測試環境裡跑。</li>
<li><b>Canarytokens</b>（<a href="https://canarytokens.org/">canarytokens.org</a>）：免費產生各種誘餌，包括 AWS 金鑰、文件、網址、DNS。先用它體驗誘餌的威力，再在自己的帳號裡做正式版。</li>
<li><b>Richard Bejtlich《The Practice of Network Security Monitoring》</b>：講「收集、分析、升級」這個循環最經典的一本書，雖然以網路監控為主，但思維完全適用於今天的雲端。</li>
</ul>
` });
