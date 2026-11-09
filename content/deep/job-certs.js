DEEP({ 'job-certs': `
<p>上一課排好了證照的順序：先 AWS，再 CKA，再一張資安的基本門檻。這一章把每一張證照拆開來看：它到底在考什麼、題目長什麼樣子、怎麼準備才不會讀了就忘、要在哪裡練手、考試當天怎麼分配時間；最後回到最根本的問題：在雇主眼裡，一張證照跟一年經驗，各值多少。證照是一項投資，花的是你下班後的晚上和一筆考試費。這一章的目的，是讓這筆投資每一分都花在刀口上。</p>
<div class="note"><b>先講清楚一件事：</b>考試的費用、題數、及格分數和大綱版本都會變。這一章只講考試的形式和目的；報名之前，一律以官方頁面和官方考試大綱（exam guide）為準。</div>

<h3><span class="badge lv1">基礎</span>一、證照在證明什麼：從「認得出答案」到「做得出來」</h3>
<p>考汽車駕照有兩關：筆試和路考。筆試證明你知道規則，路考證明你真的開得動。兩關都有用，但如果只能看一關，教練一定看路考。證照也一樣。有的考試是筆試，有的是路考，雇主對它們的信任程度也就不一樣。</p>
<figure class="figure"><svg viewBox="0 0 680 230" class="fg" style="width:100%;max-width:680px" role="img" aria-label="一條從認得出答案到做得出來的軸線，由左到右依序是 iPAS 資安工程師、AWS SAA、Security+、CKA">
<line x1="40" y1="110" x2="632" y2="110" class="fg-l"/><polygon points="640,110 632,105.5 632,114.5" class="fg-a"/>
<text x="40" y="100" class="fg-t sm">認得出答案</text><text x="640" y="100" text-anchor="end" class="fg-t sm acc">做得出來</text>
<rect x="60" y="30" width="140" height="56" rx="6" class="fg-b"/><text x="130" y="53" text-anchor="middle" class="fg-t">iPAS 資安工程師</text><text x="130" y="73" text-anchor="middle" class="fg-t sm">中文筆試、概念為主</text>
<line x1="130" y1="86" x2="130" y2="104" class="fg-l dim"/><circle cx="130" cy="110" r="5" class="fg-lamp"/>
<rect x="190" y="134" width="140" height="56" rx="6" class="fg-b alt"/><text x="260" y="157" text-anchor="middle" class="fg-t">AWS SAA</text><text x="260" y="177" text-anchor="middle" class="fg-t sm">情境選擇題</text>
<line x1="260" y1="116" x2="260" y2="134" class="fg-l dim"/><circle cx="260" cy="110" r="5" class="fg-lamp"/>
<rect x="340" y="30" width="140" height="56" rx="6" class="fg-b alt"/><text x="410" y="53" text-anchor="middle" class="fg-t">Security+</text><text x="410" y="73" text-anchor="middle" class="fg-t sm">選擇題＋實作題</text>
<line x1="410" y1="86" x2="410" y2="104" class="fg-l dim"/><circle cx="410" cy="110" r="5" class="fg-lamp"/>
<rect x="500" y="134" width="140" height="56" rx="6" class="fg-b hot"/><text x="570" y="157" text-anchor="middle" class="fg-t acc">CKA</text><text x="570" y="177" text-anchor="middle" class="fg-t sm">真叢集上動手做</text>
<line x1="570" y1="116" x2="570" y2="134" class="fg-l dim"/><circle cx="570" cy="110" r="5" class="fg-lamp on"/>
<text x="340" y="220" text-anchor="middle" class="fg-t sm">越往右，越難靠背題目考過，雇主也就越相信它</text>
</svg><figcaption>四張證照放在同一條軸上。左邊的考試確認你「知道」，右邊的考試確認你「做得到」。兩種都有用處，只是用在招募管線的不同地方。</figcaption></figure>
<table>
<tr><th>考試形式</th><th>怎麼出題</th><th>容易讓人誤會的地方</th></tr>
<tr><td><b>選擇題</b>（multiple choice）</td><td>給你一個情境，從幾個選項裡挑最好的一個；有的題目要選兩個以上（multiple response）</td><td>以為背熟服務名稱就夠。其實題目考的是「在這個限制下，哪一個最合適」，要懂取捨</td></tr>
<tr><td><b>混合題型</b></td><td>選擇題加上幾題實作題（performance-based questions，PBQ）：拖拉、排順序、在模擬的畫面上設定</td><td>實作題很花時間，卡在第一題就會拖垮整場</td></tr>
<tr><td><b>實作考試</b>（practical exam）</td><td>給你真的系統和一串任務，限時完成，系統自動檢查結果</td><td>以為懂概念就夠。其實考的是速度：知道怎麼做，但打指令太慢，一樣考不過</td></tr>
<tr><td><b>中文筆試</b></td><td>選擇題為主，偏重觀念、管理制度和法規</td><td>以為英文的知識直接套用。中文的專有名詞要另外對照熟悉</td></tr>
</table>

<h3><span class="badge lv1">基礎</span>二、證照在招募管線的哪一關起作用</h3>
<p>上一章把招募拆成六關。證照的力量並不是平均分布在每一關的：它在最前面最有用，越往後越弱。看懂這一點，你就不會想靠證照解決它解決不了的問題。</p>
<figure class="figure"><svg viewBox="0 0 640 220" class="fg" style="width:100%;max-width:640px" role="img" aria-label="三種證據在三個階段的分量：證照在履歷篩選很有用、技術面試有一點、決定職級影響小；作品集在篩選有一點、面試很有用、職級有一點；工作經驗三個階段都很有用">
<text x="260" y="30" text-anchor="middle" class="fg-t lg">履歷篩選</text><text x="400" y="30" text-anchor="middle" class="fg-t lg">技術面試</text><text x="540" y="30" text-anchor="middle" class="fg-t lg">決定職級</text>
<line x1="20" y1="44" x2="620" y2="44" class="fg-l dim"/>
<text x="20" y="75" class="fg-t">證照</text>
<rect x="205" y="56" width="110" height="28" rx="14" class="fg-b hot"/><text x="260" y="75" text-anchor="middle" class="fg-t sm acc">很有用</text>
<rect x="345" y="56" width="110" height="28" rx="14" class="fg-b alt"/><text x="400" y="75" text-anchor="middle" class="fg-t sm alt">有一點</text>
<rect x="485" y="56" width="110" height="28" rx="14" class="fg-b"/><text x="540" y="75" text-anchor="middle" class="fg-t sm">影響小</text>
<text x="20" y="125" class="fg-t">作品集</text>
<rect x="205" y="106" width="110" height="28" rx="14" class="fg-b alt"/><text x="260" y="125" text-anchor="middle" class="fg-t sm alt">有一點</text>
<rect x="345" y="106" width="110" height="28" rx="14" class="fg-b hot"/><text x="400" y="125" text-anchor="middle" class="fg-t sm acc">很有用</text>
<rect x="485" y="106" width="110" height="28" rx="14" class="fg-b alt"/><text x="540" y="125" text-anchor="middle" class="fg-t sm alt">有一點</text>
<text x="20" y="175" class="fg-t">工作經驗</text>
<rect x="205" y="156" width="110" height="28" rx="14" class="fg-b hot"/><text x="260" y="175" text-anchor="middle" class="fg-t sm acc">很有用</text>
<rect x="345" y="156" width="110" height="28" rx="14" class="fg-b hot"/><text x="400" y="175" text-anchor="middle" class="fg-t sm acc">很有用</text>
<rect x="485" y="156" width="110" height="28" rx="14" class="fg-b hot"/><text x="540" y="175" text-anchor="middle" class="fg-t sm acc">很有用</text>
<line x1="20" y1="194" x2="620" y2="194" class="fg-l dim"/>
<text x="320" y="212" text-anchor="middle" class="fg-t sm">證照幫你走進門；進了門，比的是你做過什麼</text>
</svg><figcaption>這是經驗上的分量，不是統計數字，每家公司不同。但方向很一致：證照的價值集中在最前面，工作經驗則一路有用到最後。</figcaption></figure>
<ul>
<li><b>履歷篩選：</b>證照是招募者看得懂的標籤。他不一定分辨得出你的 GitHub 好不好，但看得懂「CKA」三個字。對沒有學歷、又要換領域的人，這一關正是最需要它的地方。</li>
<li><b>技術面試：</b>證照會變成話題。面試官看到 CKA，常常就直接問「一個節點變成 NotReady，你怎麼查？」。答得出來，證照替你加分；答不出來，它反而扣分，因為看起來像是背題考過的。</li>
<li><b>決定職級：</b>職級看的是你負責過多大的範圍。三張證照加零年經驗，不會被當成資深。</li>
</ul>
<p>結論很實際：證照是用來<b>補前兩關的洞</b>，不是用來取代經驗的。所以考少一點、挑準一點，把剩下的時間拿去做作品和累積工作上的責任。</p>

<h3><span class="badge lv2">進階</span>三、AWS Solutions Architect Associate：考的是取捨，不是名詞</h3>
<p>這張考試是情境選擇題。大綱大致圍繞四個主題：安全的架構、有韌性的架構、高效能的架構、成本最佳化的架構（各佔多少比重，看當期的官方大綱）。它幾乎不會問「S3 是什麼」，而是給你一段情境、一個限制，要你挑最合適的做法。來看一題自己出的練習題，走一次解題的過程：</p>
<figure class="figure"><svg viewBox="0 0 680 290" class="fg" style="width:100%;max-width:680px" role="img" aria-label="一題 AWS 情境題的刪去法：四個選項先檢查撐不撐得過可用區故障，再檢查改動是否最少，只有開啟 Multi-AZ 兩關都通過">
<rect x="20" y="10" width="640" height="40" rx="6" class="fg-b alt"/>
<text x="340" y="35" text-anchor="middle" class="fg-t">題目：資料庫是單一台 RDS。要撐過一個可用區故障，而且改動最少。</text>
<text x="30" y="76" class="fg-t sm">選項</text><text x="450" y="76" text-anchor="middle" class="fg-t sm">撐得過可用區故障？</text><text x="590" y="76" text-anchor="middle" class="fg-t sm">改動最少？</text>
<rect x="20" y="86" width="350" height="34" rx="5" class="fg-b hot"/><text x="32" y="108" class="fg-t">A　開啟 RDS 的 Multi-AZ</text>
<rect x="20" y="128" width="350" height="34" rx="5" class="fg-b"/><text x="32" y="150" class="fg-t">B　在另一個區域建讀取副本</text>
<rect x="20" y="170" width="350" height="34" rx="5" class="fg-b"/><text x="32" y="192" class="fg-t">C　每小時把快照存到 S3</text>
<rect x="20" y="212" width="350" height="34" rx="5" class="fg-b"/><text x="32" y="234" class="fg-t">D　改成在 EC2 上自己架資料庫</text>
<rect x="395" y="90" width="110" height="26" rx="13" class="fg-b hot"/><text x="450" y="108" text-anchor="middle" class="fg-t sm acc">自動切換</text>
<rect x="540" y="90" width="100" height="26" rx="13" class="fg-b hot"/><text x="590" y="108" text-anchor="middle" class="fg-t sm acc">改一個設定</text>
<rect x="395" y="132" width="110" height="26" rx="13" class="fg-b warm"/><text x="450" y="150" text-anchor="middle" class="fg-t sm warm">要手動升級</text>
<rect x="395" y="174" width="110" height="26" rx="13" class="fg-b warm"/><text x="450" y="192" text-anchor="middle" class="fg-t sm warm">會掉資料</text>
<rect x="395" y="216" width="110" height="26" rx="13" class="fg-b alt"/><text x="450" y="234" text-anchor="middle" class="fg-t sm alt">做得到</text>
<rect x="540" y="216" width="100" height="26" rx="13" class="fg-b warm"/><text x="590" y="234" text-anchor="middle" class="fg-t sm warm">改動很大</text>
<text x="340" y="276" text-anchor="middle" class="fg-t sm">先刪掉不符合需求的，再從剩下的挑「改動最少、最省錢、最好維運」的那一個</text>
</svg><figcaption>兩道篩子：第一道看「需求有沒有被滿足」，第二道看題目裡的限制詞。B 和 C 在第一道就被刷掉，D 在第二道被刷掉。</figcaption></figure>
<ol>
<li><b>先讀最後一句。</b>題目真正要的是什麼：「最高可用性」「最低成本」「最少維運工作」「最快完成」？這些<b>限制詞</b>決定答案。同一個情境，問「最便宜」和問「最可靠」，答案可能完全相反。</li>
<li><b>第一道篩子：需求。</b>Multi-AZ 會在另一個可用區放一台同步的備用機，主機掛了自動切換，符合。跨區的讀取副本是非同步的，要手動升級，不是自動切換。每小時的快照，最多會掉一小時的資料，恢復也慢。</li>
<li><b>第二道篩子：限制詞。</b>剩下 A 和 D。D 理論上做得到高可用，但要你自己架、自己管複寫和切換，改動最大。題目說「改動最少」，所以是 A。</li>
</ol>
<p>這就是為什麼背名詞不夠：你要知道每個服務<b>在什麼條件下</b>是對的答案。準備的時候，每讀一個服務，就問自己三個問題：它解決什麼問題？它的限制是什麼？它最常被拿來跟哪個服務比較？例如 SQS 和 SNS、EBS 和 EFS、RDS 讀取副本和 Multi-AZ，這些「長得很像」的組合，正是出題的最愛。</p>

<h3><span class="badge lv2">進階</span>四、CKA：考的是速度，不只是知識</h3>
<p>CKA 是實作考試。依照目前的考生說明，考試在一個遠端的 Linux 桌面裡進行，有終端機和一個可以查 Kubernetes 官方文件的瀏覽器。你會拿到一串任務，每一題都有分數比重，而且會分在不同的叢集或主機上作答。大綱分成幾大塊：叢集架構與安裝設定、工作負載與排程、服務與網路、儲存、故障排查（troubleshooting），其中排查是比重很大的一塊。大綱會改版，報名前看當期的官方 curriculum。</p>
<h4>一題的標準動作</h4>
<p>假設題目是：「在 web 命名空間建立一個叫 hello 的 Deployment，映像檔是 nginx，三個副本，並用 ClusterIP 的 Service 在 80 埠暴露它。」熟練的人是這樣做的：</p>
<pre><code># 1. 題目開頭會指定在哪個叢集作答，先照做
#    （可能是切換 context，也可能是 ssh 到指定的主機）
kubectl config use-context &lt;題目指定的 context&gt;

# 2. 能用一行指令建立的，就不要手寫 YAML
kubectl create deployment hello --image=nginx --replicas=3 -n web
kubectl expose deployment hello --port=80 -n web

# 3. 驗證：Pod 都跑起來了，Service 後面也有端點
kubectl get deploy,pods,svc,endpoints -n web</code></pre>
<p>需要 YAML 的時候（例如要加資源限制、探針），先用指令生成骨架再改，比從零開始寫快得多，也不會打錯縮排：</p>
<pre><code>kubectl create deployment hello --image=nginx -n web --dry-run=client -o yaml &gt; hello.yaml
# 忘了欄位怎麼寫，就查 explain，比翻文件快
kubectl explain deployment.spec.template.spec.containers.resources</code></pre>
<p>第一步千萬不能省。最常見、最冤枉的失分，就是在錯的叢集上把題目做得完美無缺：系統去指定的叢集檢查，什麼都沒有，整題零分。</p>
<h4>時間怎麼分：兩輪法</h4>
<figure class="figure"><svg viewBox="0 0 680 230" class="fg" style="width:100%;max-width:680px" role="img" aria-label="兩小時的實作考試分成第一輪、第二輪和最後檢查三段；每一題的循環是切到指定叢集、完成任務、驗證、超過時間就旗標">
<line x1="40" y1="40" x2="640" y2="40" class="fg-l"/>
<text x="40" y="28" text-anchor="middle" class="fg-t sm">0 分</text><text x="190" y="28" text-anchor="middle" class="fg-t sm">30</text><text x="340" y="28" text-anchor="middle" class="fg-t sm">60</text><text x="490" y="28" text-anchor="middle" class="fg-t sm">90</text><text x="640" y="28" text-anchor="middle" class="fg-t sm">120</text>
<rect x="40" y="50" width="375" height="36" rx="6" class="fg-b hot"/><text x="227" y="73" text-anchor="middle" class="fg-t acc">第一輪：會的先做完、驗證</text>
<rect x="419" y="50" width="167" height="36" rx="6" class="fg-b alt"/><text x="502" y="73" text-anchor="middle" class="fg-t alt">第二輪：旗標題</text>
<rect x="590" y="50" width="50" height="36" rx="6" class="fg-b warm"/><text x="615" y="73" text-anchor="middle" class="fg-t sm warm">檢查</text>
<text x="40" y="118" class="fg-t sm">每一題的循環</text>
<rect x="40" y="128" width="130" height="40" rx="6" class="fg-b"/><text x="105" y="153" text-anchor="middle" class="fg-t">切到指定叢集</text>
<rect x="200" y="128" width="130" height="40" rx="6" class="fg-b"/><text x="265" y="153" text-anchor="middle" class="fg-t">完成任務</text>
<rect x="360" y="128" width="130" height="40" rx="6" class="fg-b"/><text x="425" y="153" text-anchor="middle" class="fg-t">用 get 驗證</text>
<rect x="520" y="128" width="130" height="40" rx="6" class="fg-b warm"/><text x="585" y="153" text-anchor="middle" class="fg-t">卡住就旗標</text>
<line x1="170" y1="148" x2="192" y2="148" class="fg-l"/><polygon points="200,148 192,143.5 192,152.5" class="fg-a"/>
<line x1="330" y1="148" x2="352" y2="148" class="fg-l"/><polygon points="360,148 352,143.5 352,152.5" class="fg-a"/>
<line x1="490" y1="148" x2="512" y2="148" class="fg-l"/><polygon points="520,148 512,143.5 512,152.5" class="fg-a"/>
<path d="M585 168 V196 H105 V176" class="fg-l dash"/><polygon points="105,168 100.5,176 109.5,176" class="fg-a"/>
<text x="345" y="214" text-anchor="middle" class="fg-t sm">下一題</text>
</svg><figcaption>這是建議的時間分配，不是考試規定。重點是：第一輪不要在任何一題上耗太久，先把會的分數全部拿到手，難題留到第二輪。</figcaption></figure>
<ul>
<li><b>先看比重。</b>一題佔分很低、又要改很多東西的，直接旗標（flag）跳過。</li>
<li><b>每題做完就驗證。</b>Pod 是不是 Running？Service 有沒有端點？做完不看，等於沒做完。</li>
<li><b>排查題照固定順序。</b>節點有問題：<code>kubectl describe node</code> 看狀態，上那台機器看 kubelet 的服務狀態和日誌（<code>systemctl status kubelet</code>、<code>journalctl -u kubelet</code>）。Pod 有問題：describe 看事件，logs 看上一次為什麼結束。這套順序平常就要練到變成反射動作。</li>
<li><b>官方文件要會「搜」。</b>考場上可以查文件，但沒時間慢慢讀。平常練習時就只准自己用官方文件，記住常用範例（PersistentVolumeClaim、NetworkPolicy、RBAC）放在哪一頁。</li>
</ul>

<h3><span class="badge lv2">進階</span>五、Security+ 與 iPAS：廣度型的考試</h3>
<h4>CompTIA Security+</h4>
<p>它是國際上很常見的資安入門門檻，題目以選擇題為主，加上幾題實作題。範圍很廣：常見的威脅與攻擊、安全架構、日常的資安維運、治理與風險管理。它不要求你很深，但要求你每個角落都碰過。CompTIA 的考試會定期改版，準備時務必用跟你報考版本相同的官方考試大綱（exam objectives）。大綱裡還附了一份縮寫清單，這份清單本身就是很好的複習表：每個縮寫都要能講出全名和一句用途。</p>
<p>考場策略的重點在實作題：它們很花時間，常常出現在考試的前面。很多考生的做法是先把實作題旗標，把選擇題做完，再回頭處理，這樣就不會因為一題拖拉題卡住而影響整場。</p>
<h4>iPAS 資訊安全工程師</h4>
<p>這是經濟部的產業人才能力鑑定（iPAS），分初級和中級，用中文筆試。內容偏重資訊安全的觀念、技術概論和管理制度，例如資安管理系統、風險評鑑、存取控制、常見攻擊與防護、相關法規。準備的方法跟國際考試不一樣：</p>
<ul>
<li>先讀官方公告的簡章和評鑑範圍，確認報考資格、科目和題型。</li>
<li>中文的專有名詞要另外對照。例如「存取控制」就是 access control，「營運持續管理」就是 business continuity management。英文會、中文認不出來，在選擇題上一樣會失分。</li>
<li>管理制度和法規的題目佔比不小。模組 6 的治理、風險與合規那一課（第 6.7 課）可以先讀一遍。</li>
</ul>
<p>如果你的目標是台灣的公部門、關鍵基礎設施或金融業，記得上一課講的資通安全專業證照清單：先查最新公告的清單，確認你要考的證照、以及它的哪一級，真的在清單上。</p>

<h3><span class="badge lv2">進階</span>六、讀書計畫：讓讀過的東西留下來</h3>
<p>多數人準備證照的方式是：從第一章讀到最後一章，最後一週狂做模擬考。問題是，讀到第八週時，第一週的內容已經忘得差不多了。學習科學裡有兩個被反覆驗證過的做法，可以解決這件事：<b>主動回想</b>（retrieval practice，不看書、自己考自己）和<b>間隔複習</b>（spaced repetition，在快要忘記的時候再拿出來考一次）。</p>
<figure class="figure"><svg viewBox="0 0 640 250" class="fg" style="width:100%;max-width:640px" role="img" aria-label="遺忘曲線示意：只讀一次的記憶一路往下掉；在第 1、3、7、14 天各複習一次，每次都拉回頂端，而且掉得越來越慢">
<line x1="60" y1="34" x2="60" y2="200" class="fg-l"/><line x1="60" y1="200" x2="630" y2="200" class="fg-l"/>
<text x="50" y="46" text-anchor="end" class="fg-t sm">記得多</text><text x="50" y="200" text-anchor="end" class="fg-t sm">記得少</text>
<path d="M60 40 C 100 130, 200 165, 620 182" class="fg-l warm dash"/>
<path d="M60 40 Q66 70 79 82 V40 Q92 66 116 76 V40 Q140 60 191 70 V40 Q240 55 321 64 V40 Q440 50 620 58" class="fg-l on"/>
<text x="420" y="28" text-anchor="middle" class="fg-t sm acc">間隔複習：快忘時考自己一次</text>
<text x="520" y="170" text-anchor="middle" class="fg-t sm warm">只讀一次</text>
<line x1="79" y1="200" x2="79" y2="206" class="fg-l"/><line x1="116" y1="200" x2="116" y2="206" class="fg-l"/><line x1="191" y1="200" x2="191" y2="206" class="fg-l"/><line x1="321" y1="200" x2="321" y2="206" class="fg-l"/><line x1="620" y1="200" x2="620" y2="206" class="fg-l"/>
<text x="79" y="220" text-anchor="middle" class="fg-t sm">1</text><text x="116" y="220" text-anchor="middle" class="fg-t sm">3</text><text x="191" y="220" text-anchor="middle" class="fg-t sm">7</text><text x="321" y="220" text-anchor="middle" class="fg-t sm">14</text><text x="620" y="220" text-anchor="middle" class="fg-t sm">30</text>
<text x="345" y="242" text-anchor="middle" class="fg-t sm">讀完後的第幾天</text>
</svg><figcaption>示意圖，不是實驗結果。重點在形狀：每次在快忘的時候成功想起來，記憶就被拉回去，而且下一次掉得比較慢，所以複習的間隔可以越拉越長。</figcaption></figure>
<h4>實際怎麼排：八週的 AWS 計畫</h4>
<p>假設每週讀五個晚上、每晚一到一個半小時。每週的模式都一樣：平日讀新主題並動手做一個小實驗，週末做那一週的練習題，<b>再加上前面幾週的舊題目</b>。舊題目就是間隔複習。</p>
<table>
<tr><th>週</th><th>新主題</th><th>週末複習</th></tr>
<tr><td>1</td><td>帳號與 IAM：使用者、角色、政策、多重驗證</td><td>第 1 週</td></tr>
<tr><td>2</td><td>VPC：子網路、路由表、NAT gateway、安全群組</td><td>第 2 週＋第 1 週</td></tr>
<tr><td>3</td><td>運算：EC2、自動擴展、負載平衡器</td><td>第 3 週＋第 1 週</td></tr>
<tr><td>4</td><td>儲存：S3 的儲存類別與生命週期、EBS、EFS</td><td>第 4 週＋第 2 週</td></tr>
<tr><td>5</td><td>資料庫：RDS、Aurora、DynamoDB、ElastiCache</td><td>第 5 週＋第 3 週</td></tr>
<tr><td>6</td><td>解耦與無伺服器：SQS、SNS、Lambda、API Gateway</td><td>第 6 週＋第 4 週</td></tr>
<tr><td>7</td><td>監控、加密與成本：CloudWatch、CloudTrail、KMS、帳單工具</td><td>第 7 週＋第 5、6 週</td></tr>
<tr><td>8</td><td>完整的計時模擬考，加上錯題本</td><td>錯題本裡的全部</td></tr>
</table>
<p>三個讓計畫真的有效的細節：</p>
<ul>
<li><b>錯題本。</b>每一題錯的、或是猜對的，都記下三件事：我選了什麼、為什麼錯、正確的判斷規則是什麼（例如「要自動切換 → Multi-AZ，不是讀取副本」）。最後兩週只讀錯題本，比再讀一次全部有效得多。</li>
<li><b>混著練</b>（interleaving）。週末的題目不要照主題排好，要混在一起。正式考試不會告訴你這題是哪一章，你得自己認出來。</li>
<li><b>先考自己，再看答案。</b>讀完一節，合上書，用一張白紙寫下你記得的重點。寫不出來的那些，才是要重讀的。這比畫重點、重讀筆記累得多，但效果也好得多。</li>
</ul>

<h3><span class="badge lv3">專業</span>七、練習環境：便宜、安全、可以弄壞</h3>
<p>實作考試靠手熟，選擇題考試也需要你親手做過，才分辨得出長得很像的選項。練習環境的原則是：從最便宜、可以隨便弄壞的開始，越接近考試再越接近真實。</p>
<figure class="figure"><svg viewBox="0 0 680 270" class="fg" style="width:100%;max-width:680px" role="img" aria-label="練習環境的四個台階：本機的 kind 或 minikube、幾台虛擬機加 kubeadm、雲端練習帳號、模擬考環境，越往右越像真的，也越貴">
<rect x="20" y="158" width="150" height="72" rx="6" class="fg-b"/><text x="95" y="180" text-anchor="middle" class="fg-t">本機叢集</text><text x="95" y="198" text-anchor="middle" class="fg-t sm">kind 或 minikube</text>
<rect x="180" y="125" width="150" height="105" rx="6" class="fg-b alt"/><text x="255" y="146" text-anchor="middle" class="fg-t">幾台虛擬機</text><text x="255" y="164" text-anchor="middle" class="fg-t sm">用 kubeadm 裝叢集</text><text x="255" y="182" text-anchor="middle" class="fg-t sm">練升級、備份</text><text x="255" y="200" text-anchor="middle" class="fg-t sm">故意弄壞再修</text>
<rect x="340" y="80" width="150" height="150" rx="6" class="fg-b warm"/><text x="415" y="103" text-anchor="middle" class="fg-t">雲端練習帳號</text><text x="415" y="123" text-anchor="middle" class="fg-t sm">獨立帳號＋MFA</text><text x="415" y="143" text-anchor="middle" class="fg-t sm">先設預算警示</text><text x="415" y="163" text-anchor="middle" class="fg-t sm">用程式碼建立</text><text x="415" y="183" text-anchor="middle" class="fg-t sm">用完立刻刪掉</text>
<rect x="500" y="35" width="160" height="195" rx="6" class="fg-b hot"/><text x="580" y="58" text-anchor="middle" class="fg-t acc">模擬考環境</text><text x="580" y="78" text-anchor="middle" class="fg-t sm">計時、照考場規則</text><text x="580" y="98" text-anchor="middle" class="fg-t sm">只准查官方文件</text><text x="580" y="118" text-anchor="middle" class="fg-t sm">做完看詳解</text><text x="580" y="138" text-anchor="middle" class="fg-t sm">通常比正式考難</text><text x="95" y="220" text-anchor="middle" class="fg-t sm acc">第一級</text><text x="255" y="220" text-anchor="middle" class="fg-t sm acc">第二級</text><text x="415" y="220" text-anchor="middle" class="fg-t sm acc">第三級</text><text x="580" y="220" text-anchor="middle" class="fg-t sm acc">第四級</text>
<line x1="20" y1="250" x2="652" y2="250" class="fg-l dim"/><polygon points="660,250 652,245.5 652,254.5" class="fg-a"/>
<text x="20" y="266" class="fg-t sm">便宜、可以亂弄</text><text x="660" y="266" text-anchor="end" class="fg-t sm">最像考場、比較貴</text>
</svg><figcaption>一級一級往上走。大部分的練習時間花在前兩級；雲端帳號只在需要雲端服務本身時才開；模擬考留到最後幾週，用來找弱點和練時間。</figcaption></figure>
<h4>每張證照的練習場</h4>
<table>
<tr><th>證照</th><th>在哪裡練</th><th>要小心的</th></tr>
<tr><td>AWS SAA</td><td>一個專門拿來練習的 AWS 帳號；AWS 官方的訓練平台（AWS Skill Builder）上有官方練習題</td><td>一開帳號就設預算警示（AWS Budgets）；資源用 Terraform 建，練完 <code>terraform destroy</code>；免費額度的規則會變，以官方說明為準</td></tr>
<tr><td>CKA</td><td>本機用 kind 或 minikube 練物件；用兩三台虛擬機和 kubeadm 練裝叢集、升級、備份 etcd；Killercoda 有免費的互動情境；報名附的 killer.sh 模擬考</td><td>模擬考通常刻意出得比正式考試難，第一次分數很低是正常的，重點是看詳解</td></tr>
<tr><td>Security+</td><td>家裡的虛擬機：一台 Linux、一台故意留漏洞的靶機；用 Wireshark 看自己的流量；在自己的網路上跑 nmap</td><td>掃描和攻擊只對你自己擁有、或有書面授權的系統做</td></tr>
<tr><td>iPAS</td><td>官方公告的簡章、評鑑範圍和樣題</td><td>中英名詞對照表要自己整理一份</td></tr>
</table>
<div class="warn"><b>雲端練習帳號的三條保命規則：</b>根帳號（root user）開多重驗證、平常不用它；一開帳號就設預算警示，金額設在你付得起的範圍；所有資源都用程式碼建立，練完一個指令刪乾淨。忘記關掉的 NAT gateway 或大型資料庫，一個月的帳單會讓你心痛。</div>

<h3><span class="badge lv3">專業</span>八、考試當天：把能控制的變數全部控制住</h3>
<h4>線上考還是考場考</h4>
<p>多數國際證照可以選擇到授權考場考，或在家線上監考（online proctored）。線上考方便，但規則很嚴：通常要出示證件、用攝影機掃一圈房間、桌上不能有任何東西、不能離開鏡頭、網路斷太久可能被判中止。細節以考試單位的規定為準，但有三件事一定要做：</p>
<ol>
<li><b>前幾天就跑一次官方的系統檢查。</b>公司電腦常常裝了阻擋監考軟體的防護，最好用自己的電腦。</li>
<li><b>準備一個安靜、桌面淨空的房間。</b>家裡有人會突然開門，就去考場考。</li>
<li><b>提早報到。</b>報到流程本身就要花一段時間。</li>
</ol>
<h4>選擇題的作答技巧</h4>
<ul>
<li><b>先讀問句，再讀情境。</b>先知道它問「最便宜」還是「最可靠」，讀情境時才知道要找什麼。</li>
<li><b>用刪去法。</b>四個選項裡通常有兩個明顯錯，剩下兩個靠限制詞決勝負。</li>
<li><b>不確定就先選一個、旗標、往下走。</b>不要空著，也不要在一題上卡好幾分鐘。最後再回來看旗標的題目，這時候後面的題目常常已經給了你提示。</li>
<li><b>改答案要有理由。</b>回頭檢查時，只有在你找到具體的理由（看漏了一個限制詞、想起一條規則）時才改，不要因為「感覺不對」就改。</li>
</ul>

<h3><span class="badge lv4">專家</span>九、證照跟經驗怎麼換算：什麼時候該停下來</h3>
<p>證照最大的陷阱，是它很容易讓人覺得自己在進步。考完一張，有一個清楚的成就感；寫一份事後檢討、在現職爭取一項新責任，則模糊又困難。所以很多人會不知不覺變成「證照收藏家」。下面這張決策圖，幫你判斷下一張該考什麼，以及什麼時候該停。</p>
<figure class="figure"><svg viewBox="0 0 680 270" class="fg" style="width:100%;max-width:680px" role="img" aria-label="依目標雇主選證照的決策圖：外商或遠端走 AWS、CKA、Security+；台灣民間公司走 AWS、CKA、iPAS；公部門或金融先查官方清單">
<rect x="240" y="12" width="200" height="40" rx="6" class="fg-b alt"/><text x="340" y="37" text-anchor="middle" class="fg-t">你瞄準的雇主是？</text>
<path d="M340 52 V76 H120 V98" class="fg-l"/><polygon points="120,106 115.5,98 124.5,98" class="fg-a"/>
<line x1="340" y1="52" x2="340" y2="98" class="fg-l"/><polygon points="340,106 335.5,98 344.5,98" class="fg-a"/>
<path d="M340 76 H560 V98" class="fg-l"/><polygon points="560,106 555.5,98 564.5,98" class="fg-a"/>
<rect x="20" y="106" width="200" height="104" rx="6" class="fg-b hot"/><text x="120" y="130" text-anchor="middle" class="fg-t acc">外商、遠端</text><text x="120" y="152" text-anchor="middle" class="fg-t sm">1. AWS SAA</text><text x="120" y="172" text-anchor="middle" class="fg-t sm">2. CKA</text><text x="120" y="192" text-anchor="middle" class="fg-t sm">3. Security+</text>
<rect x="240" y="106" width="200" height="104" rx="6" class="fg-b hot"/><text x="340" y="130" text-anchor="middle" class="fg-t acc">台灣民間公司</text><text x="340" y="152" text-anchor="middle" class="fg-t sm">1. AWS SAA</text><text x="340" y="172" text-anchor="middle" class="fg-t sm">2. CKA</text><text x="340" y="192" text-anchor="middle" class="fg-t sm">3. iPAS 資安工程師</text>
<rect x="460" y="106" width="200" height="104" rx="6" class="fg-b warm"/><text x="560" y="130" text-anchor="middle" class="fg-t warm">公部門、金融</text><text x="560" y="152" text-anchor="middle" class="fg-t sm">先查最新的官方清單</text><text x="560" y="172" text-anchor="middle" class="fg-t sm">挑清單上的入門證照</text><text x="560" y="192" text-anchor="middle" class="fg-t sm">再看管理類證照</text>
<line x1="20" y1="232" x2="660" y2="232" class="fg-l dim dash"/>
<text x="340" y="256" text-anchor="middle" class="fg-t sm">三張之後先停，去累積經驗；再考就照方向：Terraform、CKS、雲端安全、OSCP、CISSP</text>
</svg><figcaption>三條路的前兩步幾乎一樣，差別在第三張資安證照用哪一張，以及公部門要先看清單。三張之後，下一張證照要等到工作方向更清楚再決定。</figcaption></figure>
<h4>三個「該停了」的訊號</h4>
<ul>
<li><b>面試開始卡在經驗題，而不是篩選。</b>你已經常常拿到面試，卻在「講一次你處理過的事故」時講不出東西。這時候再考一張證照，解決的是一個你已經沒有的問題。</li>
<li><b>你的證照比你的作品多。</b>三張證照、零篇技術文章，在面試官眼裡是「會考試」。一張證照配三件作品，才是「做得到」。</li>
<li><b>下一張證照跟你的目標職缺對不上。</b>把你收藏的十份目標職缺打開，數一數下一張證照出現幾次。很少出現的，就不急。</li>
</ul>
<h4>面試時怎麼談你的證照</h4>
<p>不要只說「我有 CKA」。要講它跟工作的連結：「準備 CKA 的時候，我在自己的練習環境裡把叢集升級和 etcd 備份還原做了好幾次。後來在工作上遇到一次節點掛掉，我第一個反應就是看 kubelet 的日誌，十分鐘就找到是磁碟滿了。」這樣一句話，把證照從一個標籤，變成一個能力的故事。</p>
<h4>維護成本</h4>
<p>國際證照多半有有效期限，到期前要靠繼續教育、更高階的考試或重考來續證，各家規則不同。每多一張證照，就多一份要追蹤的到期日和續證成本。這也是「少而準」的另一個理由。有些雇主會補助考試和續證的費用，進了橋接職位之後，記得問。</p>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>證照越多，越容易被錄取</td><td>證照主要幫你通過前面的篩選。過了那一關，多一張的效益很小，作品和經驗才是決勝點。</td></tr>
<tr><td>題庫背熟就能考過，也算學會了</td><td>就算考過，面試官一追問就穿幫，還會讓人懷疑你所有的證照。實作考試則根本背不過。</td></tr>
<tr><td>把教材從頭讀到尾，就是準備好了</td><td>重讀的感覺很熟悉，卻不等於想得起來。主動考自己、間隔複習、錯題本，才是讓記憶留下來的方法。</td></tr>
<tr><td>CKA 可以查文件，所以不用記</td><td>查得到，但沒時間慢慢查。常用的指令要記在手上，文件只拿來查少數不常用的欄位。</td></tr>
<tr><td>雲端練習帳號用免費額度就不會花錢</td><td>免費額度有範圍和期限，很多服務不在裡面。不設預算警示、不刪資源，帳單隨時可能嚇到你。</td></tr>
<tr><td>模擬考分數低，代表還沒準備好考試</td><td>有些模擬考刻意比正式考試難。要看的是錯在哪一類、時間夠不夠，而不只是分數本身。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>前端工程師</b>：準備 AWS 時，拿你的 Vue 或 React 專案練：S3 放靜態檔、CloudFront 當 CDN、憑證、網域。一個你真的上線過的網站，同時就是一件作品。</li>
<li><b>遊戲工程師</b>：Cocos 或 Unity 的網頁版建置產物，就是一包靜態檔，部署方式跟前端一樣；遊戲伺服器則可以拿來練容器和 Kubernetes。準備 CKA 時，把你的遊戲伺服器跑進 kind 叢集，練 Deployment、Service、探針和資源限制。</li>
<li><b>後端工程師</b>：你的 Node.js 或 Go 服務、資料庫和快取，正好對到 AWS 大綱裡的運算、資料庫和解耦三大塊。每讀一個服務，就問「我的服務如果搬上來，會用它嗎？為什麼？」。</li>
<li>不管哪一種，<b>拿自己的系統當教材</b>，讀書和作品集就變成同一件事，這是省時間最多的做法。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<p>面試官看到你履歷上的證照，常常會用它開場。下面這些題目，是在測試你的證照是不是「真的」。</p>
<ol>
<li>「I see you have the CKA. A node shows NotReady. Walk me through how you investigate.」（你有 CKA。一個節點顯示 NotReady，你怎麼查？）</li>
<li>「Why did you choose these certifications?」（你為什麼選這幾張證照？）</li>
<li>「What did you learn while preparing that you have actually used at work?」（準備的過程裡，有什麼是你真的用在工作上的？）</li>
<li>「When would you choose RDS Multi-AZ, and when a read replica?」（什麼時候用 RDS 的 Multi-AZ，什麼時候用讀取副本？）</li>
<li>「How do you keep your skills current after passing an exam?」（考過之後，你怎麼讓技能保持在最新？）</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>先看範圍：一個節點還是全部？最近有沒有變更？然後 <code>kubectl describe node</code> 看 Conditions：是 Ready 為 Unknown（kubelet 沒回報），還是有 DiskPressure、MemoryPressure。接著上那台機器：kubelet 有沒有在跑、它的日誌說什麼；容器執行環境（例如 containerd）正不正常；磁碟滿了沒；憑證有沒有過期；網路外掛有沒有問題。修好之後確認節點回到 Ready，並想想為什麼監控沒有提早告訴我們。</li>
<li>講策略，不是清單：「我的目標是平台工程。AWS 是最多職缺要求的雲端；CKA 是實作考試，能證明我真的會維運 Kubernetes；第三張資安證照讓我在設計時有安全的基本功。我刻意只考這三張，其餘時間拿去做作品。」</li>
<li>給一個具體的例子，前後有數字最好。例如準備 AWS 時學到的成本工具，讓你在工作上找出一個沒人用、卻一直在收費的資源；或是 CKA 練過的排查順序，讓你很快找到一個 Pod 一直重啟的原因。</li>
<li>Multi-AZ 是為了可用性：同一區域另一個可用區的同步備用機，主機故障時自動切換；常見的單一備用機部署，備用機平常不接讀取流量。讀取副本是為了分擔讀取和擴展：非同步複寫，會有延遲，可以跨區域，要升級成主庫時通常要手動處理。兩個可以同時用。</li>
<li>具體講你的習慣：維護一個練習環境，新版本出來時先在那裡試；讀官方的版本更新說明；在工作上把新學的東西用在一件小事上，再寫成一篇技術文章。重點是讓面試官看到「學習」是一個持續的系統，而不是考前衝刺。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>打開 AWS SAA 的官方考試大綱，照上一課的方法把每一項標成綠、黃、紅。然後把黃和紅的項目，排進本章那張八週計畫表裡。哪一週最重？</li>
<li>自己出一題 AWS 情境題：一段情境、一個限制詞、四個選項，其中兩個是「長得很像」的服務。寫出每個錯誤選項錯在哪裡。</li>
<li>在 kind 叢集上，計時完成本章的那一題 Deployment 加 Service 的任務，包括驗證。目標是兩分鐘以內。超過的話，記下慢在哪一步。</li>
<li>你週一讀完 VPC。照「第 1、3、7、14 天」的間隔，寫出你接下來要在哪幾天複習它。如果第 7 天複習時發現忘了一半，下一次間隔該怎麼調？</li>
<li>在你的 AWS 練習帳號設一個預算警示，金額設在你一個月願意花的上限，並讓它在達到一半時寄信給你。寫下你設定的步驟。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>大多數開發者會發現 VPC 和 IAM 這兩週最重，因為平常寫應用程式很少碰到網路和權限的細節。把多出來的時間放在這兩週，其他週可以縮短。</li>
<li>好的題目，錯誤選項都「在別的情境下是對的」。例如情境要求「訊息只能被處理一次、而且要排隊」，正確答案是 SQS，錯誤選項放 SNS（它是廣播給多個訂閱者，不是排隊）。每個錯誤選項都寫得出「它適合什麼情境」，代表你真的懂。</li>
<li>常見的慢點是：忘了切 context、手寫 YAML、打錯命名空間。解法是用 <code>kubectl create</code> 一行完成、每個指令都帶 <code>-n web</code>、最後一行 <code>get</code> 一次確認。練到第五次，兩分鐘內應該很輕鬆。</li>
<li>週一讀完，就是週二（第 1 天）、週四（第 3 天）、下週一（第 7 天）、再下週一（第 14 天）。如果第 7 天只想起一半，代表間隔拉太快：下一次改成兩三天後再考一次，想得起來了，再把間隔拉長。</li>
<li>在帳單主控台的 Budgets 建立一個成本預算，設定每月金額，加上一個在實際花費達到 50% 時寄信的警示（再加一個 100%）。重點不是步驟本身，而是在你建立任何資源之前就先做這件事。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>AWS 認證官方頁面</b>（<a href="https://aws.amazon.com/certification/">aws.amazon.com/certification</a>）：每張考試的官方考試大綱和報名資訊都在這裡，以這裡為準。</li>
<li><b>Kubernetes 官方文件</b>（<a href="https://kubernetes.io/docs/">kubernetes.io/docs</a>）：CKA 考場上能查的就是它。平常練習就只用它，考試時才找得到東西。</li>
<li><b>Killercoda</b>（<a href="https://killercoda.com/">killercoda.com</a>）：在瀏覽器裡就有一個真的叢集或 Linux 環境，有很多免費的 CKA 練習情境。</li>
<li><b>Professor Messer 的 Security+ 免費課程</b>（<a href="https://www.professormesser.com/">professormesser.com</a>）：照著官方大綱逐項講解的免費影片，是很多人準備 Security+ 的主要教材。</li>
<li><b>Brown、Roediger、McDaniel《Make It Stick: The Science of Successful Learning》</b>：把主動回想、間隔複習、混著練背後的研究，講得很好懂的一本書。</li>
</ul>
` });
