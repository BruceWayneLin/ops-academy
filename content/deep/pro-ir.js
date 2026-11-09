DEEP({ 'pro-ir': `
<p>第 4.3 課的深入圖解講的是「當機」型的事故：止血優先、指揮系統、溝通範本、不究責的檢討。那些做法在資安事件裡全部還用得上，但有一件事完全不同：<b>對面有一個會思考、會反應的人</b>。這一章把資安事件應變一步一步拆開：生命週期怎麼跑、出事前要先放好什麼、證據怎麼保全、雲端上怎麼隔離一台機器、要先盯著看還是馬上切斷、怎麼大規模輪替憑證、台灣的法律要你通報誰，最後是勒索軟體、加密貨幣被盜，和一份可以直接拿去用的桌上演練劇本。</p>

<h3><span class="badge lv1">基礎</span>一、資安事件跟當機，差在「對面有人」</h3>
<p>家裡水管爆了，你衝去關總開關，越快越好，沒有人會跟你作對。家裡進了小偷就不一樣：你大叫一聲衝進去，他可能從後門跑掉、順手帶走最值錢的東西，或者早就多打了一副鑰匙，下週再來。<b>處理小偷，第一件事不是趕走他，而是搞清楚他在哪、拿了什麼、還有哪些門能進來。</b></p>
<table>
<tr><th></th><th>當機事故</th><th>資安事件</th></tr>
<tr><td>目標</td><td>恢復服務</td><td>恢復服務，<b>而且</b>確定攻擊者已經完全出去</td></tr>
<tr><td>第一反應</td><td>退版、重開、擴容</td><td>先保全證據，不要驚動對方</td></tr>
<tr><td>對手</td><td>系統自己壞了，不會變</td><td>一個人，你動他也動</td></tr>
<tr><td>溝通</td><td>狀態頁公開、越透明越好</td><td>只讓需要知道的人知道，對外說法先給法務看</td></tr>
<tr><td>什麼時候算結束</td><td>指標恢復正常</td><td>所有入口、後門、被偷的憑證都處理完，而且觀察一段時間沒再出現</td></tr>
</table>
<p>還有一個很實際的差別：<b>你平常用的溝通工具可能已經被看光了</b>。如果攻擊者拿到了某位管理員的帳號，他可能看得到公司的聊天頻道和信箱。所以嚴重的資安事件要用<b>頻外</b>（out-of-band）管道溝通：事先準備好的另一個聊天群組、電話會議，用不同的帳號體系登入。</p>

<h3><span class="badge lv1">基礎</span>二、NIST SP 800-61 的生命週期：一個會繞回去的圈</h3>
<p>美國國家標準與技術研究院（NIST）的 SP 800-61 是事件應變最常被引用的指南。它 2012 年的第二版，把應變畫成四個階段：</p>
<figure class="figure"><svg viewBox="0 0 640 248" class="fg" style="width:100%;max-width:640px" role="img" aria-label="NIST 事件應變生命週期：準備、偵測與分析、圍堵根除復原、事後活動；圍堵時找到新線索會回到分析，事後活動回饋到準備">
<path d="M565 95 V50 H80 V87" class="fg-l dash"/><polygon points="80,95 75.5,87 84.5,87" class="fg-a"/>
<text x="320" y="42" text-anchor="middle" class="fg-t sm">檢討的改進項目，回到下一次的準備</text>
<rect x="20" y="95" width="120" height="56" rx="6" class="fg-b alt"/><text x="80" y="118" text-anchor="middle" class="fg-t">準備</text><text x="80" y="138" text-anchor="middle" class="fg-t sm">手冊、權限、聯絡人</text>
<line x1="140" y1="123" x2="162" y2="123" class="fg-l"/><polygon points="170,123 162,118.5 162,127.5" class="fg-a"/>
<rect x="170" y="95" width="120" height="56" rx="6" class="fg-b"/><text x="230" y="118" text-anchor="middle" class="fg-t">偵測與分析</text><text x="230" y="138" text-anchor="middle" class="fg-t sm">確認、定範圍</text>
<line x1="290" y1="123" x2="332" y2="123" class="fg-l"/><polygon points="340,123 332,118.5 332,127.5" class="fg-a"/>
<rect x="340" y="95" width="140" height="56" rx="6" class="fg-b warm"/><text x="410" y="118" text-anchor="middle" class="fg-t">圍堵、根除、復原</text><text x="410" y="138" text-anchor="middle" class="fg-t sm">止損、清除、重建</text>
<line x1="480" y1="123" x2="502" y2="123" class="fg-l"/><polygon points="510,123 502,118.5 502,127.5" class="fg-a"/>
<rect x="510" y="95" width="110" height="56" rx="6" class="fg-b hot"/><text x="565" y="118" text-anchor="middle" class="fg-t acc">事後活動</text><text x="565" y="138" text-anchor="middle" class="fg-t sm">檢討、補強</text>
<path d="M410 151 V178 H230 V159" class="fg-l warm"/><polygon points="230,151 225.5,159 234.5,159" class="fg-a warm"/>
<text x="320" y="196" text-anchor="middle" class="fg-t sm warm">圍堵時又找到新的受害主機，回頭再分析</text>
<text x="320" y="232" text-anchor="middle" class="fg-t sm">SANS 的六步驟：準備｜辨識｜圍堵｜根除｜復原｜記取教訓，是同一件事切得更細</text>
</svg><figcaption>中間那個往回的箭頭是重點：真實的事件很少一路直線走完。每圍堵一台機器，常常就會挖出下一台，又得回去分析。</figcaption></figure>
<p>2025 年 NIST 發布了第三版（SP 800-61 Rev. 3），改成對齊網路安全框架 CSF 2.0 的六個功能（治理、辨識、保護、偵測、應變、復原），強調事件應變不是資安團隊自己的事，而是整個組織風險管理的一部分。框架的畫法變了，但實際處理一個事件時，上面這個圈仍然是你腦中該有的順序。</p>
<p>什麼時候要「宣告」一個資安事件？事先寫好門檻，不要當下討論。例如：確認有未授權的存取；任何機密（金鑰、密碼、個資）可能外洩；誘餌被觸發；或者有人勒索。寧可宣告了再降級，不要拖到確定才宣告：前面那幾個小時，正是證據最多的時候。</p>

<h3><span class="badge lv2">進階</span>三、準備：出事那天你不會有時間做的事</h3>
<p>事件應變的成敗，大半在出事前就決定了。下面這張表，每一列都是「出事當下才發現沒有」的經典場景：</p>
<table>
<tr><th>要準備的</th><th>具體是什麼</th><th>沒準備會怎樣</th></tr>
<tr><td><b>處理手冊</b>（playbook）</td><td>針對常見類型各寫一份：帳號被盜、雲端金鑰外洩、勒索軟體、資料外洩、網站被竄改</td><td>每個人憑記憶各做各的，漏掉保全證據</td></tr>
<tr><td><b>應變用的存取權</b></td><td>事先建好的應變角色、緊急帳號（break-glass account）、一個專門放證據的鑑識帳號</td><td>凌晨兩點才在申請權限，或用被入侵的帳號去查被入侵的事</td></tr>
<tr><td><b>聯絡清單</b></td><td>主管、法務、公關、雲端業者支援、外部鑑識廠商、資安保險、警方、主管機關的窗口與電話</td><td>不知道該通報誰、期限到了才開始找</td></tr>
<tr><td><b>頻外溝通</b></td><td>另一套聊天群組或電話橋，用不同的帳號體系</td><td>攻擊者在你的頻道裡看你討論怎麼抓他</td></tr>
<tr><td><b>日誌與保存期限</b></td><td>稽核日誌集中到另一個帳號、保存夠久、不能被刪</td><td>回頭查時發現只剩七天</td></tr>
<tr><td><b>決策權</b></td><td>誰有權讓正式環境下線、誰決定對外公告、誰能跟勒索者接觸</td><td>大家等老闆回覆，老闆在飛機上</td></tr>
</table>
<p>處理手冊不用寫成論文。一份「雲端存取金鑰外洩」的手冊，前五步可以短到這樣：</p>
<pre><code>1. 宣告事件，指定指揮官，開頻外頻道
2. 查這把金鑰最近被誰、從哪些 IP 用過（CloudTrail，往回 90 天）
3. 列出它做過的所有寫入動作：建了什麼、改了什麼、分享了什麼
4. 停用金鑰（先停用，不要刪除，保留證據）
5. 對第 3 步的每一項：建的刪掉、改的改回、分享的收回</code></pre>

<h3><span class="badge lv2">進階</span>四、保全證據：照揮發性排順序</h3>
<p>RFC 3227《證據收集與保存指南》把證據依「消失得多快」排好了順序。原則很簡單：<b>先收最快消失的</b>。</p>
<figure class="figure"><svg viewBox="0 0 640 296" class="fg" style="width:100%;max-width:640px" role="img" aria-label="揮發性階梯：CPU 暫存器、記憶體、網路連線與行程、暫存檔、磁碟、遠端日誌、備份，越上面消失越快，要越先收集">
<text x="20" y="30" class="fg-t sm acc">收集順序：由上往下</text>
<text x="200" y="30" class="fg-t sm">能活多久（越長越不急）</text>
<text x="20" y="60" class="fg-t">CPU 暫存器、快取</text>
<rect x="200" y="44" width="10" height="24" rx="3" class="fg-b warm"/><text x="480" y="61" class="fg-t sm">奈秒</text>
<text x="20" y="96" class="fg-t">記憶體內容</text>
<rect x="200" y="80" width="40" height="24" rx="3" class="fg-b warm"/><text x="480" y="97" class="fg-t sm">一關機就沒</text>
<text x="20" y="132" class="fg-t">網路連線、行程</text>
<rect x="200" y="116" width="80" height="24" rx="3" class="fg-b warm"/><text x="480" y="133" class="fg-t sm">幾秒到幾分鐘</text>
<text x="20" y="168" class="fg-t">暫存檔 /tmp</text>
<rect x="200" y="152" width="120" height="24" rx="3" class="fg-b"/><text x="480" y="169" class="fg-t sm">重開機可能清空</text>
<text x="20" y="204" class="fg-t">磁碟檔案與日誌</text>
<rect x="200" y="188" width="170" height="24" rx="3" class="fg-b"/><text x="480" y="205" class="fg-t sm">幾天到幾個月</text>
<text x="20" y="240" class="fg-t">遠端日誌</text>
<rect x="200" y="224" width="220" height="24" rx="3" class="fg-b alt"/><text x="480" y="241" class="fg-t sm">看保存期限</text>
<text x="20" y="276" class="fg-t">備份與封存</text>
<rect x="200" y="260" width="260" height="24" rx="3" class="fg-b alt"/><text x="480" y="277" class="fg-t sm">以年計</text>
</svg><figcaption>橘色那三層，只要重開機或關機就永遠消失。這就是為什麼「先重開機看看」是事件應變裡最昂貴的一個動作。</figcaption></figure>
<p>記憶體裡有什麼值得這麼急？正在執行的惡意程式（有些只活在記憶體裡、磁碟上根本沒有檔案）、解密後的設定、攻擊者用的金鑰、命令列歷史、網路連線的另一端是誰。重開機之後，這些全部沒了。</p>
<h4>一台 Linux 主機的第一個小時</h4>
<p>證據要寫到<b>另外掛上的磁碟</b>或直接送到別台機器，不要寫在可疑主機的磁碟上：寫入可能蓋掉攻擊者已刪除、但還能救回的檔案。</p>
<pre><code>E=/mnt/evidence/web-3
date -u &gt; $E/00-time.txt
{ who; last -aF | head -50; } &gt; $E/01-logins.txt
ps auxwwf &gt; $E/02-ps.txt
ss -tanp &gt; $E/03-conns.txt
ls -l /proc/*/exe 2&gt;/dev/null | grep deleted \\
  &gt; $E/04-deleted.txt
# 擷取整個記憶體（AVML 工具）
sudo ./avml $E/mem.lime
sha256sum $E/* &gt; $E/SHA256SUMS</code></pre>
<p><code>ls -l /proc/*/exe</code> 那一行是個專家小技巧：攻擊者常常執行完惡意程式就把檔案刪掉，但只要行程還活著，<code>/proc/&lt;pid&gt;/exe</code> 就還指著它，清單上會標 <code>(deleted)</code>。這時用 <code>cp /proc/4242/exe $E/pid4242.bin</code> 就能把那支已刪除的程式完整救回來。重開機之後就救不回了。</p>
<p>記憶體擷取完，用 Volatility 這類工具分析。還要記得：<b>你下的每一個指令，也會改變現場</b>。所以要在事件紀錄裡寫下每個指令、時間和執行者，讓之後的人分得出哪些痕跡是你留下的。</p>
<h4>證據保管鏈</h4>
<p>每一份證據都要記：是什麼、雜湊值、誰在什麼時間從哪裡取得、之後交給過誰、存在哪裡。例如：「web-3 記憶體映像，SHA-256 為 9f2c…，2026-11-09 14:32 UTC 由王小明以 AVML 取得，存於鑑識帳號的 S3 桶 ir-031/，僅鑑識角色可讀」。如果之後要提告，這條保管鏈是證據能不能被採用的關鍵。</p>

<h3><span class="badge lv3">專業</span>五、雲端鑑識：隔離、快照、保住稽核日誌</h3>
<p>雲端比實體機器好的地方是：你可以在幾分鐘內，把一台機器從網路上「拿起來」，完整拍下它的磁碟，同時讓服務照常運作。</p>
<figure class="figure"><svg viewBox="0 0 680 290" class="fg" style="width:100%;max-width:680px" role="img" aria-label="雲端隔離前後：隔離前被入侵的 web-3 在 Auto Scaling 群組裡，連線開著、角色憑證有效；隔離後 web-3 脫離群組換上隔離安全群組，群組補上新的 web-4，磁碟快照送到鑑識帳號">
<text x="170" y="24" text-anchor="middle" class="fg-t lg">隔離前</text>
<text x="510" y="24" text-anchor="middle" class="fg-t lg">隔離後</text>
<line x1="340" y1="10" x2="340" y2="285" class="fg-l dim dash"/>
<rect x="110" y="40" width="120" height="32" rx="6" class="fg-b"/><text x="170" y="61" text-anchor="middle" class="fg-t">負載平衡器</text>
<rect x="20" y="100" width="300" height="96" rx="8" class="fg-b"/><text x="30" y="189" class="fg-t sm">Auto Scaling 群組</text>
<path d="M170 72 V86 H75 V120" class="fg-l"/><polygon points="75,128 70.5,120 79.5,120" class="fg-a"/>
<line x1="170" y1="72" x2="170" y2="120" class="fg-l"/><polygon points="170,128 165.5,120 174.5,120" class="fg-a"/>
<path d="M170 86 H265 V120" class="fg-l"/><polygon points="265,128 260.5,120 269.5,120" class="fg-a"/>
<rect x="35" y="128" width="80" height="40" rx="5" class="fg-b"/><text x="75" y="153" text-anchor="middle" class="fg-t">web-1</text>
<rect x="130" y="128" width="80" height="40" rx="5" class="fg-b"/><text x="170" y="153" text-anchor="middle" class="fg-t">web-2</text>
<rect x="225" y="128" width="80" height="40" rx="5" class="fg-b warm"/><text x="265" y="153" text-anchor="middle" class="fg-t warm">web-3</text>
<line x1="265" y1="168" x2="265" y2="222" class="fg-l warm"/><polygon points="265,230 260.5,222 269.5,222" class="fg-a warm"/>
<text x="255" y="218" text-anchor="end" class="fg-t sm warm">連線還開著</text>
<rect x="200" y="230" width="130" height="40" rx="6" class="fg-b warm"/><text x="265" y="255" text-anchor="middle" class="fg-t">攻擊者伺服器</text>
<rect x="20" y="230" width="150" height="40" rx="6" class="fg-b"/><text x="95" y="255" text-anchor="middle" class="fg-t">角色憑證仍有效</text>
<rect x="450" y="40" width="120" height="32" rx="6" class="fg-b"/><text x="510" y="61" text-anchor="middle" class="fg-t">負載平衡器</text>
<rect x="360" y="100" width="300" height="96" rx="8" class="fg-b"/><text x="370" y="189" class="fg-t sm">Auto Scaling 群組</text>
<path d="M510 72 V86 H415 V120" class="fg-l"/><polygon points="415,128 410.5,120 419.5,120" class="fg-a"/>
<line x1="510" y1="72" x2="510" y2="120" class="fg-l"/><polygon points="510,128 505.5,120 514.5,120" class="fg-a"/>
<path d="M510 86 H605 V120" class="fg-l"/><polygon points="605,128 600.5,120 609.5,120" class="fg-a"/>
<rect x="375" y="128" width="80" height="40" rx="5" class="fg-b"/><text x="415" y="153" text-anchor="middle" class="fg-t">web-1</text>
<rect x="470" y="128" width="80" height="40" rx="5" class="fg-b"/><text x="510" y="153" text-anchor="middle" class="fg-t">web-2</text>
<rect x="565" y="128" width="80" height="40" rx="5" class="fg-b hot"/><text x="605" y="153" text-anchor="middle" class="fg-t acc">web-4 新</text>
<text x="375" y="215" class="fg-t sm">脫離群組、撤銷憑證</text>
<rect x="375" y="226" width="110" height="48" rx="6" class="fg-b warm"/><text x="430" y="246" text-anchor="middle" class="fg-t">web-3</text><text x="430" y="264" text-anchor="middle" class="fg-t sm">隔離 SG＋NACL</text>
<line x1="485" y1="250" x2="552" y2="250" class="fg-l alt"/><polygon points="560,250 552,245.5 552,254.5" class="fg-a alt"/>
<text x="520" y="242" text-anchor="middle" class="fg-t sm alt">快照</text>
<rect x="560" y="226" width="100" height="48" rx="6" class="fg-b alt"/><text x="610" y="246" text-anchor="middle" class="fg-t">鑑識帳號</text><text x="610" y="264" text-anchor="middle" class="fg-t sm">唯讀掛載</text>
</svg><figcaption>web-3 沒有被關機，也沒有被刪掉：它還開著，記憶體還在，只是跟世界斷了線。群組自動補上一台乾淨的 web-4，使用者不會察覺。</figcaption></figure>
<p>以 AWS 為例，順序大致是：</p>
<pre><code>I=i-0abc123
# 1. 防止被誤刪：開啟終止保護
aws ec2 modify-instance-attribute \\
  --instance-id $I --disable-api-termination
# 2. 脫離 Auto Scaling 群組，讓群組補一台新的
aws autoscaling detach-instances --instance-ids $I \\
  --auto-scaling-group-name web-asg \\
  --no-should-decrement-desired-capacity
# 3. 確認它不在負載平衡器後面
aws elbv2 deregister-targets \\
  --target-group-arn $TG --targets Id=$I
# 4. 換上隔離用的安全群組（只允許鑑識主機連入，不准連出）
aws ec2 modify-instance-attribute \\
  --instance-id $I --groups sg-0isolation
# 5. 擷取記憶體後，替每一顆磁碟拍快照
aws ec2 create-snapshot --volume-id vol-0def456 \\
  --description "IR-031 web-3 root"</code></pre>
<h4>三個大多數人不知道的坑</h4>
<ul>
<li><b>Auto Scaling 會「幫你」毀證據。</b>如果你先改了安全群組，健康檢查開始失敗，群組會判定這台不健康、直接把它終止掉。所以第 1、2 步要先做。</li>
<li><b>換安全群組，不一定會切斷已經建立的連線。</b>安全群組是有狀態的，被追蹤中的連線在規則改掉之後可能繼續存在。要立刻切斷，再在子網路加一層無狀態的網路 ACL（NACL）擋掉，或把機器移到隔離用的子網路。</li>
<li><b>撤銷角色憑證要瞄準。</b>攻擊者很可能已經從中繼資料服務拿走了這台機器的角色臨時憑證，拿到別處去用。在 IAM 主控台對整個角色按「撤銷有效的 session」，會連 web-1、web-2 一起擋掉，直到它們換到新憑證。更精準的做法是替角色加一條拒絕政策，條件寫 <code>ec2:SourceInstanceARN</code> 等於 web-3，只擋從這台機器發出的那份憑證。</li>
</ul>
<h4>保住 CloudTrail</h4>
<p>雲端事件裡，CloudTrail 就是你的監視器錄影。攻擊者也知道，所以他們常常呼叫 <code>StopLogging</code>、<code>DeleteTrail</code>，或用 <code>PutEventSelectors</code> 偷偷縮小記錄範圍。保護的方法是事前做好：組織層級的 trail 寫到另一個獨立的「日誌封存帳號」，S3 桶開啟物件鎖定（Object Lock），並啟用日誌檔完整性驗證，之後用 <code>aws cloudtrail validate-logs</code> 證明日誌沒被改過。出事時，第一個查的就是上面那三個 API 有沒有被呼叫過。</p>
<p>容器也一樣，只是更快消失。Kubernetes 上的可疑 Pod 不要刪：把它的標籤改掉，讓 Service 不再把流量送給它、ReplicaSet 另外補一個新的，它自己則繼續活著等你調查；再加一條只針對它的 NetworkPolicy 擋住對外連線。<code>docker diff</code> 可以列出容器啟動後被新增或修改過的檔案，常常一眼就看到攻擊者放進來的東西。</p>

<h3><span class="badge lv3">專業</span>六、圍堵的兩難：盯著看，還是馬上切斷</h3>
<p>發現第一台被入侵的機器時，最直覺的反應是馬上把它切掉。但如果攻擊者手上還有你不知道的第二、第三個立足點，切掉一個只會讓他警覺：</p>
<figure class="figure"><svg viewBox="0 26 690 244" class="fg" style="width:100%;max-width:690px" role="img" aria-label="兩種圍堵時間軸：馬上切斷讓攻擊者察覺並改用其他立足點、甚至報復；先觀察找出所有立足點，再同一時間全部切斷，攻擊者出局">
<text x="10" y="67" class="fg-t warm">馬上切斷</text>
<rect x="80" y="40" width="104" height="44" rx="6" class="fg-b"/><text x="132" y="67" text-anchor="middle" class="fg-t">發現 A</text>
<line x1="184" y1="62" x2="194" y2="62" class="fg-l"/><polygon points="202,62 194,57.5 194,66.5" class="fg-a"/>
<rect x="202" y="40" width="104" height="44" rx="6" class="fg-b"/><text x="254" y="67" text-anchor="middle" class="fg-t">切斷 A</text>
<line x1="306" y1="62" x2="316" y2="62" class="fg-l"/><polygon points="324,62 316,57.5 316,66.5" class="fg-a"/>
<rect x="324" y="40" width="104" height="44" rx="6" class="fg-b"/><text x="376" y="67" text-anchor="middle" class="fg-t">攻擊者察覺</text>
<line x1="428" y1="62" x2="438" y2="62" class="fg-l"/><polygon points="446,62 438,57.5 438,66.5" class="fg-a"/>
<rect x="446" y="40" width="104" height="44" rx="6" class="fg-b"/><text x="498" y="67" text-anchor="middle" class="fg-t">改用 B、C</text>
<line x1="550" y1="62" x2="560" y2="62" class="fg-l warm"/><polygon points="568,62 560,57.5 560,66.5" class="fg-a warm"/>
<rect x="568" y="40" width="104" height="44" rx="6" class="fg-b warm"/><text x="620" y="67" text-anchor="middle" class="fg-t warm">報復：加密</text>
<text x="132" y="104" text-anchor="middle" class="fg-t sm">第 1 天</text><text x="254" y="104" text-anchor="middle" class="fg-t sm">第 1 天</text><text x="376" y="104" text-anchor="middle" class="fg-t sm">幾小時內</text><text x="498" y="104" text-anchor="middle" class="fg-t sm">第 2 天</text><text x="620" y="104" text-anchor="middle" class="fg-t sm">第 3 天</text>
<line x1="10" y1="126" x2="680" y2="126" class="fg-l dim dash"/>
<text x="10" y="177" class="fg-t acc">先盯再清</text>
<rect x="80" y="150" width="104" height="44" rx="6" class="fg-b"/><text x="132" y="177" text-anchor="middle" class="fg-t">發現 A</text>
<line x1="184" y1="172" x2="194" y2="172" class="fg-l"/><polygon points="202,172 194,167.5 194,176.5" class="fg-a"/>
<rect x="202" y="150" width="104" height="44" rx="6" class="fg-b alt"/><text x="254" y="177" text-anchor="middle" class="fg-t">悄悄觀察</text>
<line x1="306" y1="172" x2="316" y2="172" class="fg-l"/><polygon points="324,172 316,167.5 316,176.5" class="fg-a"/>
<rect x="324" y="150" width="104" height="44" rx="6" class="fg-b alt"/><text x="376" y="177" text-anchor="middle" class="fg-t">找到 B、C</text>
<line x1="428" y1="172" x2="438" y2="172" class="fg-l"/><polygon points="446,172 438,167.5 438,176.5" class="fg-a"/>
<rect x="446" y="150" width="104" height="44" rx="6" class="fg-b"/><text x="498" y="177" text-anchor="middle" class="fg-t">同時全部切斷</text>
<line x1="550" y1="172" x2="560" y2="172" class="fg-l on"/><polygon points="568,172 560,167.5 560,176.5" class="fg-a on"/>
<rect x="568" y="150" width="104" height="44" rx="6" class="fg-b hot"/><text x="620" y="177" text-anchor="middle" class="fg-t acc">攻擊者出局</text>
<text x="132" y="214" text-anchor="middle" class="fg-t sm">第 1 天</text><text x="254" y="214" text-anchor="middle" class="fg-t sm">第 1～3 天</text><text x="376" y="214" text-anchor="middle" class="fg-t sm">第 3 天</text><text x="498" y="214" text-anchor="middle" class="fg-t sm">第 4 天同一小時</text><text x="620" y="214" text-anchor="middle" class="fg-t sm">之後加強監控</text>
<text x="345" y="254" text-anchor="middle" class="fg-t sm">觀察期間也要先擋最危險的：資料正在外流、資金正在移動，就不能等</text>
</svg><figcaption>上面那條路像打地鼠：你打一隻，他從另一個洞出來，而且知道你在打他了。下面那條路是一次清乾淨，業界叫「協調式驅逐」（coordinated eviction）。</figcaption></figure>
<p>沒有標準答案，要看當下的狀況。下面是做決定時要問的問題：</p>
<table>
<tr><th>傾向馬上切斷</th><th>傾向先觀察</th></tr>
<tr><td>資料正在大量外流，或資金正在被轉走</td><td>攻擊者看起來很安靜，只是在探路</td></tr>
<tr><td>有破壞行為：正在加密、刪除、竄改</td><td>你還不知道範圍，懷疑有其他立足點</td></tr>
<tr><td>可能危及人身安全或重大法律責任</td><td>執法機關要求先不要驚動</td></tr>
<tr><td>你沒有足夠的日誌和人力可以盯</td><td>你有能力看清楚他的每一步</td></tr>
</table>
<p>實務上最常見的是中間路線：<b>悄悄縮小傷害範圍，但不碰攻擊者正在用的那個入口</b>。例如先輪替最值錢的那把金鑰（攻擊者還沒用到的那把）、對外流量加一條只擋已知外洩目的地的規則、把日誌等級調高。觀察要設時限，例如最多 72 小時，到時候不管找沒找完都要動手。</p>
<p>攻擊者察覺的跡象：活動突然變多、開始刪日誌、建立新的帳號或金鑰當備胎。看到這些，就是觀察期結束的訊號。</p>

<h3><span class="badge lv3">專業</span>七、根除：為什麼只能重建，不能清理</h3>
<p>攻擊者會在很多地方留後路，而且不只在主機上：</p>
<table>
<tr><th>層</th><th>常見的後門</th></tr>
<tr><td>Linux 主機</td><td><code>authorized_keys</code>、cron、systemd 服務、新的使用者、sudoers、<code>/etc/ld.so.preload</code>、PAM 模組、shell 的啟動檔</td></tr>
<tr><td>雲端帳號</td><td>新的 IAM 使用者或存取金鑰、被改過信任政策（允許外部帳號扮演）的角色、新的 Lambda 函式、被改過的開機腳本（user data）</td></tr>
<tr><td>程式碼與 CI</td><td>新增的部署金鑰、webhook、CI 的機密變數、被改過的工作流程檔、被換掉的相依套件</td></tr>
<tr><td>應用程式</td><td>新的管理員帳號、長效的 API token、上傳目錄裡的 webshell</td></tr>
</table>
<p>你可以一項一項查，但永遠無法證明「已經全部找到」。所以被控制過的機器一律<b>重建</b>：用 IaC 和入侵日期<b>之前</b>建置的映像檔重新開一台。要小心兩件事：映像檔本身是從哪條管線建出來的（如果 CI 也被入侵，新映像檔可能也有毒）；資料要從入侵前的備份還原，但資料本身也可能帶毒，例如上傳目錄裡的 webshell、資料庫裡多出來的管理員。<b>程式和設定從乾淨的來源重建，資料要還原後再檢查。</b></p>
<p>根除的順序也有講究：先把入口補起來，再在同一個時間窗內做完撤銷存取、輪替憑證、切換到重建好的機器。如果你先輪替憑證、入口卻還開著，攻擊者只要再進來一次，就能拿到你剛換的新憑證。</p>

<h3><span class="badge lv3">專業</span>八、大規模輪替憑證</h3>
<p>一台被入侵的機器，能讀到的東西比你想的多。先列清單：環境變數、設定檔、<code>~/.aws</code>、<code>~/.kube/config</code>、角色臨時憑證、資料庫密碼、第三方 API 金鑰、JWT 簽章金鑰、TLS 私鑰、OAuth client secret、webhook 密鑰。<b>那台機器讀得到的，就當作已經外洩。</b></p>
<figure class="figure"><svg viewBox="0 24 660 186" class="fg" style="width:100%;max-width:660px" role="img" aria-label="雙金鑰輪替時間軸：T0 發現外洩，T1 建立新金鑰，T2 部署到所有使用者，T3 確認舊金鑰沒人用後停用，T4 刪除；停用後還有人用舊金鑰就是攻擊者">
<text x="470" y="40" text-anchor="middle" class="fg-t sm warm">此後再有人用，就是攻擊者</text>
<rect x="40" y="52" width="380" height="26" rx="4" class="fg-b warm"/><text x="52" y="70" class="fg-t sm">舊金鑰（已外洩）</text>
<rect x="420" y="52" width="120" height="26" rx="4" class="fg-b"/><text x="480" y="70" text-anchor="middle" class="fg-t sm">已停用</text>
<rect x="150" y="92" width="480" height="26" rx="4" class="fg-b hot"/><text x="162" y="110" class="fg-t sm">新金鑰</text>
<text x="285" y="137" text-anchor="middle" class="fg-t sm">T1～T3 兩把同時有效</text>
<line x1="30" y1="150" x2="636" y2="150" class="fg-l"/><polygon points="644,150 636,145.5 636,154.5" class="fg-a"/>
<circle cx="60" cy="150" r="5" class="fg-lamp on"/><circle cx="150" cy="150" r="5" class="fg-lamp on"/><circle cx="260" cy="150" r="5" class="fg-lamp on"/><circle cx="420" cy="150" r="5" class="fg-lamp on"/><circle cx="540" cy="150" r="5" class="fg-lamp on"/>
<text x="60" y="174" text-anchor="middle" class="fg-t sm mono">T0</text><text x="150" y="174" text-anchor="middle" class="fg-t sm mono">T1</text><text x="260" y="174" text-anchor="middle" class="fg-t sm mono">T2</text><text x="420" y="174" text-anchor="middle" class="fg-t sm mono">T3</text><text x="540" y="174" text-anchor="middle" class="fg-t sm mono">T4</text>
<text x="60" y="194" text-anchor="middle" class="fg-t sm">發現外洩</text><text x="150" y="194" text-anchor="middle" class="fg-t sm">建新金鑰</text><text x="260" y="194" text-anchor="middle" class="fg-t sm">全部換新</text><text x="420" y="194" text-anchor="middle" class="fg-t sm">停用舊的</text><text x="540" y="194" text-anchor="middle" class="fg-t sm">刪除舊的</text>
</svg><figcaption>平常輪替，T1 到 T3 可以是幾天，讓服務不中斷。事件中，舊金鑰在外面多活一分鐘就多一分鐘風險，這段要壓到幾小時甚至幾分鐘；最危險的那幾把，寧可接受短暫中斷也要立刻停用。</figcaption></figure>
<p>停用之前，怎麼知道舊的還有沒有人在用？AWS 的 <code>aws iam get-access-key-last-used</code> 會告訴你一把金鑰最後一次被用的時間、服務和區域。停用後再出現使用紀錄，要嘛是你漏換了某個服務，要嘛就是攻擊者：兩種都要立刻查。</p>
<h4>輪替的順序</h4>
<ol>
<li><b>能產生更多憑證的</b>先換：雲端管理員、身分提供者的管理權限、CI 的部署金鑰。攻擊者拿著這些，可以自己再造新的。</li>
<li><b>從外面就能用的</b>其次：雲端存取金鑰、第三方 API 金鑰、OAuth secret。</li>
<li><b>只在內網能用的</b>最後：資料庫密碼（但如果資料庫對外開放，往前排）。</li>
</ol>
<p>有幾種憑證，換了會有連鎖反應，要先想好：換 <b>JWT 簽章金鑰</b>，所有使用者的登入狀態一起失效，全部要重新登入，要先準備好公告；換 <b>TLS 私鑰</b>要重新申請憑證並撤銷舊的；應用程式自己用來加密資料的金鑰，換了之後舊資料要重新加密，不然就解不開。這種事件就看得出平常有沒有用機密管理服務：有的話，輪替是改一個值、重新部署；沒有的話，你得先花一天找出那些密碼散落在哪裡。</p>

<h3><span class="badge lv4">專家</span>九、溝通與台灣的法定通報義務</h3>
<p>資安事件的溝通，原則跟第 4.3 課一樣：準時、只講事實、不猜原因。但多了兩條：<b>只讓需要知道的人知道</b>（事件代號、頻外頻道），以及<b>對外的每一句話都先給法務看</b>，因為它日後可能成為證據，或影響你的法律責任。</p>
<p>台灣跟資安事件最相關的法律有兩部。以下是一般性的說明，不是法律意見；條文與子法會修正，實際遇到時一定要查最新版本，並請律師確認。</p>
<h4>資通安全管理法</h4>
<p>適用對象是<b>公務機關</b>和<b>特定非公務機關</b>（關鍵基礎設施提供者、公營事業、政府捐助的財團法人）。依它的子法「資通安全事件通報及應變辦法」，事件依影響程度分成第一級到第四級，時限大致如下：</p>
<figure class="figure"><svg viewBox="0 40 660 174" class="fg" style="width:100%;max-width:660px" role="img" aria-label="資通安全管理法的時限：知悉後一小時內通報；第三、四級在三十六小時內、第一、二級在七十二小時內完成損害控制或復原；完成後一個月內送調查、處理及改善報告">
<text x="50" y="60" text-anchor="middle" class="fg-t sm acc mono">0</text>
<text x="150" y="60" text-anchor="middle" class="fg-t sm acc">1 小時</text>
<text x="330" y="60" text-anchor="middle" class="fg-t sm acc">36 小時</text>
<text x="430" y="60" text-anchor="middle" class="fg-t sm acc">72 小時</text>
<text x="590" y="60" text-anchor="middle" class="fg-t sm acc">完成後 1 個月</text>
<line x1="30" y1="90" x2="636" y2="90" class="fg-l"/><polygon points="644,90 636,85.5 636,94.5" class="fg-a"/>
<line x1="50" y1="72" x2="50" y2="108" class="fg-l dim"/><line x1="150" y1="72" x2="150" y2="108" class="fg-l dim"/><line x1="330" y1="72" x2="330" y2="108" class="fg-l dim"/><line x1="430" y1="72" x2="430" y2="108" class="fg-l dim"/><line x1="590" y1="72" x2="590" y2="108" class="fg-l dim"/>
<circle cx="50" cy="90" r="6" class="fg-lamp on"/><circle cx="150" cy="90" r="6" class="fg-lamp on"/><circle cx="330" cy="90" r="6" class="fg-lamp on"/><circle cx="430" cy="90" r="6" class="fg-lamp on"/><circle cx="590" cy="90" r="6" class="fg-lamp on"/>
<text x="50" y="130" text-anchor="middle" class="fg-t">知悉</text>
<text x="150" y="130" text-anchor="middle" class="fg-t warm">通報</text>
<text x="330" y="130" text-anchor="middle" class="fg-t">第三、四級</text>
<text x="430" y="130" text-anchor="middle" class="fg-t">第一、二級</text>
<text x="590" y="130" text-anchor="middle" class="fg-t">送報告</text>
<text x="150" y="150" text-anchor="middle" class="fg-t sm">依指定方式與對象</text>
<text x="330" y="150" text-anchor="middle" class="fg-t sm">完成止損或復原</text>
<text x="430" y="150" text-anchor="middle" class="fg-t sm">完成止損或復原</text>
<text x="590" y="150" text-anchor="middle" class="fg-t sm">調查、處理、改善</text>
<text x="330" y="196" text-anchor="middle" class="fg-t sm">時間軸不照比例；級數越高，止損期限越短</text>
</svg><figcaption>一小時通報的計時起點是「知悉」，不是「確認」。所以前面那句「寧可先宣告再降級」，在這裡是法律上的要求。</figcaption></figure>
<h4>個人資料保護法</h4>
<p>個資法適用於幾乎所有蒐集個資的機關和企業。它第 12 條要求：因違反本法導致個資被竊取、洩漏、竄改或其他侵害時，要<b>查明後以適當方式通知當事人</b>。施行細則進一步規定通知要包含事實經過、已採取的因應措施，以及諮詢的管道。此外，不少產業的中央主管機關訂有個資安全維護的辦法，要求重大個資事故在一定時限內（常見是 72 小時）通報主管機關。個資法近年持續修法，也在成立獨立的個人資料保護委員會，通報義務可能會再擴大，這一塊要特別留意最新規定。</p>
<h4>其他會碰到的</h4>
<ul>
<li><b>金融業</b>另有金管會的通報規定；<b>上市櫃公司</b>發生重大資安事件，依證交所和櫃買中心的規定要發布重大訊息。</li>
<li><b>刑事</b>：入侵電腦、刪改電磁紀錄、干擾電腦系統，屬於刑法「妨害電腦使用罪」。其中幾條是<b>告訴乃論</b>，要被害人主動提告，而且告訴期間是知悉犯人後六個月。前面的證據保管鏈，就是在為這一步做準備。</li>
<li>民間企業需要協助時，可以聯絡 <b>TWCERT/CC</b>（台灣電腦網路危機處理暨協調中心）。</li>
</ul>

<h3><span class="badge lv4">專家</span>十、勒索軟體與加密貨幣被盜</h3>
<h4>勒索軟體：先假設資料已經被偷走了</h4>
<p>現代的勒索軟體集團幾乎都是<b>雙重勒索</b>（double extortion）：加密之前，先把資料偷走。所以就算你的備份完美、一個小時就還原完，事件也還沒結束：被偷走的資料可能觸發上一節的個資通知義務。</p>
<ol>
<li><b>斷網，但不要關機。</b>拔網路線、隔離網段、停用 VPN，阻止加密繼續擴散。不關機是為了保住記憶體：有些勒索軟體的金鑰或執行痕跡還在裡面。</li>
<li><b>確認備份還活著。</b>攻擊者通常在加密前幾天就先刪備份、刪快照。只有離線或不可變（immutable）的備份才算數，第 4.5 課的深入圖解講過怎麼設計。</li>
<li><b>辨識是哪一種。</b>從勒索信和副檔名查。歐洲刑警組織等單位合辦的 No More Ransom 計畫提供部分家族的免費解密工具。</li>
<li><b>先重建身分系統。</b>勒索軟體集團通常已經拿到網域管理員或雲端管理員。身分系統沒有先清乾淨，還原多少台機器都會再被加密一次。</li>
<li><b>依業務優先順序還原</b>，並在還原前掃描備份裡有沒有攻擊者放的東西。</li>
</ol>
<p>付不付贖金？一般建議不付：付了不保證拿到能用的解密工具（而且常常很慢、會壞檔），也不保證被偷的資料會刪除，還會讓你被標記成「願意付錢的對象」。這是經營階層、法務、保險一起做的決定，不是工程師自己決定的事。</p>
<h4>加密貨幣被盜：以分鐘計算</h4>
<p>區塊鏈上的交易不能撤回，但每一筆都是公開的。前一個小時做的事，決定能追回多少：</p>
<ol>
<li><b>止血</b>：暫停提款；如果合約有暫停功能就啟動；撤銷代幣授權（approval）；把<b>所有</b>可能曝光過的金鑰底下剩餘的資金，轉到在乾淨設備上新產生的金鑰或多簽錢包。</li>
<li><b>記錄</b>：每一筆交易的雜湊、地址、時間，截圖區塊瀏覽器頁面。</li>
<li><b>追蹤並通知</b>：資金流向交易所的，立刻聯絡該交易所的資安窗口，附上交易雜湊，請求凍結；穩定幣（例如 USDT、USDC）的發行商有能力凍結特定地址。社群也有緊急求助管道，例如 SEAL 911。</li>
<li><b>報案</b>：向警方報案，保留所有日誌與保管鏈。</li>
<li><b>找根因</b>：熱錢包伺服器被入侵、助記詞外洩、簽章介面被竄改、相依套件被下毒。</li>
</ol>
<p>2025 年 2 月 Bybit 被盜約 15 億美元的事件，是「簽章介面被竄改」的經典案例：簽署者在畫面上看到的是一筆正常交易，實際簽下去的卻是把錢包控制權交出去的交易。教訓是：大額簽章前，要在<b>另一台獨立的設備</b>上驗證你要簽的原始內容，而不是相信同一個介面告訴你的。</p>

<h3><span class="badge lv4">專家</span>十一、一份桌上演練劇本</h3>
<p>第 4.3 課講過桌上推演的做法。資安版的差別是：主持人會在中途丟出新狀況（inject），逼大家在資訊不完整時做決定。下面這份以「猜高低」遊戲平台為背景，60 到 90 分鐘：</p>
<table>
<tr><th>時間</th><th>主持人丟出的狀況</th><th>要大家回答的問題</th></tr>
<tr><td>T+0</td><td>放在 CI 環境變數裡的誘餌 AWS 金鑰，被一個海外 IP 使用了</td><td>這算事件嗎？誰當指揮官？在哪個頻道溝通？第一個查什麼？</td></tr>
<tr><td>T+20 分</td><td>CloudTrail 顯示同一個 IP 也用了<b>真的</b>部署金鑰，建了一個 IAM 使用者 <code>svc-backup2</code></td><td>馬上停用部署金鑰，還是先觀察？停用會讓部署中斷，誰批准？</td></tr>
<tr><td>T+45 分</td><td>發現資料庫快照被分享給一個外部 AWS 帳號（<code>ModifyDBSnapshotAttribute</code>）</td><td>裡面有哪些個資？誰通知法務？通報的時鐘從什麼時候開始算？</td></tr>
<tr><td>T+90 分</td><td>客服回報：玩家收到釣魚信，信裡有正確的暱稱和 email</td><td>對玩家說什麼？誰批准公告？要不要強制所有人重設密碼？</td></tr>
<tr><td>T+3 小時</td><td>攻擊者在論壇貼出部分資料，要求贖金</td><td>付不付？要不要報案？對媒體怎麼說？</td></tr>
</table>
<p>主持人的規則：不碰任何真實系統；每個人回答時要說出「具體的指令或主控台頁面」；只要有人說「不確定」「應該是某某知道」，紀錄就記下來。結束後，每一個「不確定」都變成一個有負責人、有期限的行動項目。第一次演練通常會發現十個以上，這很正常，也正是演練的價值。</p>

<h3>十二、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>發現入侵，第一步是把機器關掉</td><td>關機會毀掉記憶體裡的證據。先隔離網路、擷取記憶體、拍快照，讓機器繼續開著。</td></tr>
<tr><td>找到後門刪掉，機器就乾淨了</td><td>你無法證明全部找到。被控制過的機器一律從乾淨來源重建。</td></tr>
<tr><td>換了密碼就結束了</td><td>如果入口還開著，攻擊者會再進來拿新密碼。先補入口，再在同一個時間窗內輪替。</td></tr>
<tr><td>備份還在，勒索軟體就不怕</td><td>雙重勒索下，資料早已被偷走。備份解決的是「能不能恢復營運」，不是「資料有沒有外洩」。</td></tr>
<tr><td>確定是入侵才需要通報</td><td>資安法的一小時從「知悉」起算；拖到確定，往往已經超過期限。</td></tr>
<tr><td>事件應變是資安團隊自己的事</td><td>通報、公告、贖金、停機，都需要法務、公關、經營階層在第一個小時就到位。</td></tr>
</table>

<h3>十三、跟你的工作連起來</h3>
<ul>
<li><b>後端（Node.js、Go）</b>：服務要能在不重新部署的情況下換掉機密（從機密管理服務讀取、定期重新載入），出事時輪替才會快。JWT 驗證要支援多把金鑰同時有效（用 <code>kid</code> 欄位區分），才能做雙金鑰輪替。</li>
<li><b>前端（Vue、TypeScript）</b>：如果攻擊者改了你網站上的 JavaScript，使用者瀏覽器裡發生的事你完全看不到。子資源完整性（SRI）、內容安全政策（CSP）和部署產物的雜湊比對，是你事後證明「前端沒被動過」的依據。</li>
<li><b>遊戲（Cocos、Unity）</b>：玩家帳號被盜、虛擬道具被轉走，處理邏輯跟加密貨幣很像：先凍結、記錄每一筆轉移、找出所有相關帳號，再一次處理。遊戲伺服器要記下每一筆道具和貨幣的轉移，否則事後無從追起。</li>
<li><b>Docker 與雲端伺服器</b>：容器要從映像檔重建，而不是 <code>docker exec</code> 進去修；這個習慣在事件時就是「重建而不清理」。雲端帳號第一天就要有獨立的日誌封存帳號。</li>
</ul>

<h3>十四、面試會怎麼問</h3>
<p>事件應變、雲端資安、SRE 的面試很常出現下面這些題目。先自己講一遍，再打開參考答案。</p>
<ol>
<li>「你發現一台正式環境的 EC2 被入侵了，接下來 30 分鐘你會做什麼？照順序講。」</li>
<li>「什麼時候應該馬上切斷攻擊者，什麼時候應該先觀察？」</li>
<li>「為什麼被入侵的機器要重建，而不是清理？重建時要注意什麼？」</li>
<li>「一台被入侵的伺服器上有十幾種憑證，你怎麼決定輪替的順序？」</li>
<li>「勒索軟體事件裡，備份完好，為什麼事件還沒結束？」</li>
<li>「資安事件和一般的當機事故，處理上最大的差別是什麼？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>先宣告事件、指定指揮官、改用頻外頻道。接著保全與隔離：開啟終止保護、從 Auto Scaling 群組脫離（讓群組補新的），確認不在負載平衡器後面，換上隔離安全群組，必要時加 NACL 切斷既有連線。透過鑑識主機擷取記憶體，再替所有磁碟拍快照，複製到鑑識帳號。撤銷這台機器的角色憑證（用條件只針對這台）。同時查 CloudTrail：這台機器的角色最近做了什麼、有沒有人動過 trail。每一步記下時間、指令、執行者。</li>
<li>資料或資金正在流失、有破壞行為、或沒有能力盯住對方時，馬上切斷。範圍不明、懷疑有其他立足點、攻擊者看起來還在探路、而且你有足夠的日誌和人力時，先觀察，找出所有立足點後同一時間全部切斷。觀察期間仍要悄悄保護最值錢的資產，並設時限。</li>
<li>因為無法證明已經找到攻擊者留下的所有後門，而漏掉一個就前功盡棄。重建要用入侵日期之前、從可信管線建出來的映像檔；程式與設定從乾淨來源重建，資料從入侵前的備份還原後再檢查；並且先補好入口，再切換。</li>
<li>先換能產生更多憑證的（雲端管理員、身分提供者、CI 部署金鑰），再換從外部就能使用的（雲端金鑰、第三方 API 金鑰），最後是只在內網可用的。用雙金鑰方式降低中斷，但事件中要把重疊時間壓到最短，並用「最後使用時間」確認舊的沒人用；停用後再出現使用就是警訊。另外要預先處理連鎖影響，例如換 JWT 金鑰會讓所有人登出。</li>
<li>因為雙重勒索：攻擊者通常在加密前就把資料偷走了。恢復營運之後，還要調查哪些資料外洩、是否需要依個資法通知當事人或通報主管機關，並且清除攻擊者在身分系統等處的存取權，否則還會再被加密。</li>
<li>當機事故的對手是系統本身，目標是盡快恢復服務，第一反應可以是退版、重開。資安事件的對手是會反應的人，目標是恢復服務並且確認對方完全出去，所以第一反應是保全證據、不驚動對方；溝通要限縮在需要知道的人、對外說法經過法務；而且可能有法定通報期限。</li>
</ol>
</details>

<h3>十五、練功題（做得出來才算真的懂）</h3>
<ol>
<li>在你自己的一台 Linux 測試機上，用 <code>sleep 600 &amp;</code> 開一個行程，然後想辦法讓它變成「執行檔已刪除、行程還活著」的狀態，再把它救回來。提示：先把 <code>/bin/sleep</code> 複製一份到 <code>/tmp</code> 再執行。</li>
<li>替你負責的一個服務，列出「如果這台機器被入侵，哪些憑證要換」。每一項寫出：在哪裡、換了會影響誰、要花多久。</li>
<li>本章的 AWS 隔離指令，如果把第 4 步（換安全群組）放到第 1 步之前做，可能會發生什麼事？</li>
<li>你的公司是一家一般的遊戲公司（不是公務機關，也不是關鍵基礎設施），玩家資料庫被偷了。依本章的說明，哪些法律義務可能適用？你會先去確認哪三件事？</li>
<li>拿本章的桌上演練劇本，自己一個人走一次，在 T+20 分那一格做出「馬上切斷」或「先觀察」的決定，並寫下三個支持理由和一個你最擔心的風險。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>做法：<code>cp /bin/sleep /tmp/evil &amp;&amp; /tmp/evil 600 &amp;</code>，記下行程編號，再 <code>rm /tmp/evil</code>。這時 <code>ls -l /proc/&lt;pid&gt;/exe</code> 會顯示 <code>/tmp/evil (deleted)</code>。用 <code>cp /proc/&lt;pid&gt;/exe /tmp/recovered</code> 救回來，再用 <code>sha256sum</code> 比對它和 <code>/bin/sleep</code>，雜湊值會一樣。重點是：行程只要還活著，檔案就救得回來；重開機之後就沒了。</li>
<li>沒有標準答案。好的清單會包含容易忘記的幾項：角色臨時憑證、CI 的部署金鑰、JWT 簽章金鑰、第三方服務（金流、簡訊、email）的 API 金鑰、webhook 驗證密鑰，以及寫在設定檔裡的資料庫密碼。如果你發現某一項「不知道要怎麼換」或「換了不知道誰會壞」，那就是現在要補的準備工作。</li>
<li>換成隔離安全群組後，負載平衡器和 Auto Scaling 的健康檢查會開始失敗；群組判定這台不健康，可能直接終止它並補一台新的。記憶體和本機狀態就跟著消失。所以先開終止保護、先脫離群組。</li>
<li>個資法適用：查明後要以適當方式通知受影響的玩家，內容包括事實、已採取的措施和諮詢管道；如果你所屬的產業主管機關訂有個資安全維護辦法，可能還要在時限內通報主管機關。資安法原則上不適用，因為它針對公務機關與特定非公務機關。如果公司是上市櫃公司，可能要發布重大訊息。要提告的話，注意告訴乃論的期限。先確認的三件事：被偷的資料有哪些欄位、影響多少人；你的產業主管機關有沒有通報規定與時限；誰負責對玩家的通知內容與發送。</li>
<li>例如選「馬上停用部署金鑰」：一、攻擊者已經在建新的 IAM 使用者，代表正在擴大立足點；二、部署金鑰可以產生更多存取權，拖越久越難清；三、部署中斷的代價（幾小時不能上版）遠小於被植入後門的代價。最擔心的風險：攻擊者發現金鑰被停用，改用 <code>svc-backup2</code> 或其他還沒找到的立足點，所以要同時停用 <code>svc-backup2</code>，並立刻查它和那個 IP 做過的所有事。</li>
</ol>
</details>

<h3>十六、想再挖深</h3>
<ul>
<li><b>NIST SP 800-61</b>（<a href="https://csrc.nist.gov/">csrc.nist.gov</a> 搜尋 SP 800-61）：事件應變最常被引用的指南。先讀 Rev. 2 的生命週期，再看 Rev. 3 怎麼把它放進 CSF 2.0。</li>
<li><b>RFC 3227《Guidelines for Evidence Collection and Archiving》</b>：只有十頁，揮發性順序和保管鏈的原始出處。</li>
<li><b>AWS Security Incident Response Guide</b>（AWS 官方文件）：雲端上的準備、隔離、鑑識帳號，怎麼一步一步做。</li>
<li><b>Volatility</b>（<a href="https://github.com/volatilityfoundation/volatility3">github.com/volatilityfoundation/volatility3</a>）：開源的記憶體鑑識框架，搭配公開的練習映像檔，可以親手體驗「記憶體裡到底有什麼」。</li>
<li><b>No More Ransom</b>（<a href="https://www.nomoreransom.org/">nomoreransom.org</a>）：由執法機關與資安公司合辦，提供勒索軟體辨識與免費解密工具。</li>
</ul>
` });
