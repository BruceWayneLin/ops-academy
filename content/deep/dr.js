DEEP({ 'dr': `
<p>上一課給了兩個數字（RPO、RTO）、四種策略、一條 3-2-1 守則。這一章把它們拆到可以拿去做設計：RPO 和 RTO 到底由哪些時間組成；各種備份怎麼搭配；為什麼「有備份」和「救得回來」是兩回事；四種災難復原策略各花多少錢、換到多少時間；切換到備援的那一刻，資料會出什麼事；勒索軟體怎麼專挑備份下手；最後是最常被忽略的一種災難：你自己的帳號進不去了。災難復原（disaster recovery，DR）是那種平常沒人想做、出事時卻決定公司生死的工作。</p>

<h3><span class="badge lv1">基礎</span>一、RPO 與 RTO：一條時間軸看懂</h3>
<p>用寫報告來想。文書軟體每 10 分鐘自動存檔一次，電腦突然當機，你最多掉 10 分鐘的內容，這是<b>復原點目標</b>（RPO）：往回看，最近一個救得回來的點在哪裡。重開機、打開軟體、找回檔案、重新開始打字，花了 15 分鐘，這是<b>復原時間目標</b>（RTO）：往前看，要多久才能重新工作。</p>
<figure class="figure"><svg viewBox="0 0 660 220" class="fg" style="width:100%;max-width:660px" role="img" aria-label="時間軸：02:00 最後一次備份，17:30 災難發生，19:45 服務恢復；備份到災難之間是 RPO，會掉的資料；災難到恢復之間是 RTO，停擺的時間">
<path d="M110 80 V70 H330 V80" class="fg-l warm"/>
<text x="220" y="42" text-anchor="middle" class="fg-t warm">RPO：這段資料會掉</text>
<text x="220" y="60" text-anchor="middle" class="fg-t sm">往回看：上一個還原點在哪</text>
<path d="M330 80 V70 H560 V80" class="fg-l alt"/>
<text x="445" y="42" text-anchor="middle" class="fg-t alt">RTO：這段時間停擺</text>
<text x="445" y="60" text-anchor="middle" class="fg-t sm">往前看：多久能再服務</text>
<line x1="20" y1="120" x2="632" y2="120" class="fg-l"/><polygon points="640,120 632,115.5 632,124.5" class="fg-a"/>
<line x1="110" y1="100" x2="110" y2="140" class="fg-l on"/>
<line x1="330" y1="100" x2="330" y2="140" class="fg-l warm"/>
<line x1="560" y1="100" x2="560" y2="140" class="fg-l on"/>
<rect x="110" y="106" width="220" height="10" class="fg-b warm"/>
<rect x="330" y="124" width="230" height="10" class="fg-b alt"/>
<text x="110" y="160" text-anchor="middle" class="fg-t sm mono">02:00</text><text x="110" y="178" text-anchor="middle" class="fg-t">最後一次備份</text>
<text x="330" y="160" text-anchor="middle" class="fg-t sm mono">17:30</text><text x="330" y="178" text-anchor="middle" class="fg-t warm">災難發生</text>
<text x="560" y="160" text-anchor="middle" class="fg-t sm mono">19:45</text><text x="560" y="178" text-anchor="middle" class="fg-t acc">服務恢復</text>
<text x="330" y="208" text-anchor="middle" class="fg-t sm">只靠每晚備份：掉了 15.5 小時的資料，停擺 2 小時 15 分</text>
</svg><figcaption>RPO 由「多久留一個還原點」決定；RTO 由「事前準備了多少」決定。兩個數字互相獨立，要分開設計。</figcaption></figure>
<p>RPO 由備份或複寫的頻率決定：每晚備份一次，最壞的情況就是掉將近 24 小時。RTO 則是一長串步驟加起來的，而且大部分人只估了其中一兩步。把上圖那次災難的 2 小時 15 分拆開：</p>
<table>
<tr><th>步驟</th><th>時間</th><th>在做什麼</th></tr>
<tr><td>發現</td><td>10 分鐘</td><td>警報響、確認不是誤報</td></tr>
<tr><td>決定</td><td>20 分鐘</td><td>誰有權說「啟動災難復原」？找到他、他同意</td></tr>
<tr><td>準備環境</td><td>30 分鐘</td><td>開新的資料庫機器、網路、權限</td></tr>
<tr><td>還原資料</td><td>35 分鐘</td><td>200 GB，以每秒約 100 MB 的速度大約 33 分鐘</td></tr>
<tr><td>補上日誌</td><td>20 分鐘</td><td>把備份之後的交易日誌重播上去</td></tr>
<tr><td>驗證</td><td>15 分鐘</td><td>檢查資料、跑一輪冒煙測試（smoke test）</td></tr>
<tr><td>切換流量</td><td>5 分鐘</td><td>改 DNS、等 TTL 過期</td></tr>
</table>
<p>真實事件裡，最常超時的是兩個「不是技術」的步驟：<b>決定</b>（半夜聯絡不到有權限的人，或大家在爭要不要切）和<b>驗證</b>（不知道該檢查什麼）。這兩步都要事先寫進處理手冊。</p>
<h4>RPO 和 RTO 要按資料訂，不是全公司一個數字</h4>
<table>
<tr><th>資料</th><th>RPO</th><th>RTO</th><th>做法</th></tr>
<tr><td>玩家帳號與道具</td><td>接近 0</td><td>30 分鐘</td><td>同步複寫到另一個可用區域，加持續日誌封存</td></tr>
<tr><td>對局紀錄</td><td>5 分鐘</td><td>4 小時</td><td>持續日誌封存，可以還原到任一時間點</td></tr>
<tr><td>排行榜</td><td>24 小時</td><td>1 天</td><td>不用備份，從對局紀錄重新算</td></tr>
<tr><td>應用程式日誌</td><td>1 小時</td><td>不急</td><td>送到物件儲存就好</td></tr>
</table>
<p>越往零靠近，成本上升得越快。把每一種資料都訂成「RPO 0、RTO 1 分鐘」，預算會爆掉；把它們分級，錢才花在刀口上。</p>

<h3><span class="badge lv1">基礎</span>二、備份有哪幾種</h3>
<p>先分清楚三種最基本的組合：</p>
<ul>
<li><b>完整備份</b>（full）：整份資料複製一次。最好還原，最佔空間、最花時間。</li>
<li><b>增量備份</b>（incremental）：只存「上一次備份（不管哪一種）之後」改過的部分。每次都很小，還原時卻要一份一份接起來。</li>
<li><b>差異備份</b>（differential）：只存「上一次完整備份之後」改過的部分。會一天比一天大，但還原時只要兩份。</li>
</ul>
<figure class="figure"><svg viewBox="0 0 660 252" class="fg" style="width:100%;max-width:660px" role="img" aria-label="一週的備份：週日完整備份，增量備份每天一小塊，差異備份一天比一天大；週五還原時，增量要六份，差異只要兩份">
<text x="160" y="30" text-anchor="middle" class="fg-t sm">週日</text><text x="232" y="30" text-anchor="middle" class="fg-t sm">週一</text><text x="304" y="30" text-anchor="middle" class="fg-t sm">週二</text><text x="376" y="30" text-anchor="middle" class="fg-t sm">週三</text><text x="448" y="30" text-anchor="middle" class="fg-t sm">週四</text><text x="520" y="30" text-anchor="middle" class="fg-t acc">週五：還原</text><text x="592" y="30" text-anchor="middle" class="fg-t sm">週六</text>
<text x="16" y="86" class="fg-t">增量備份</text><text x="16" y="104" class="fg-t sm">存上次之後的變化</text>
<rect x="135" y="54" width="50" height="56" rx="3" class="fg-b hot"/><text x="160" y="87" text-anchor="middle" class="fg-t sm">100</text>
<rect x="207" y="96" width="50" height="14" rx="3" class="fg-b hot"/><rect x="279" y="96" width="50" height="14" rx="3" class="fg-b hot"/><rect x="351" y="96" width="50" height="14" rx="3" class="fg-b hot"/><rect x="423" y="96" width="50" height="14" rx="3" class="fg-b hot"/><rect x="495" y="96" width="50" height="14" rx="3" class="fg-b hot"/><rect x="567" y="96" width="50" height="14" rx="3" class="fg-b"/>
<text x="232" y="88" text-anchor="middle" class="fg-t sm">5</text><text x="304" y="88" text-anchor="middle" class="fg-t sm">5</text><text x="376" y="88" text-anchor="middle" class="fg-t sm">5</text><text x="448" y="88" text-anchor="middle" class="fg-t sm">5</text><text x="520" y="88" text-anchor="middle" class="fg-t sm">5</text><text x="592" y="88" text-anchor="middle" class="fg-t sm">5</text>
<text x="376" y="132" text-anchor="middle" class="fg-t sm acc">週五還原要接 6 份｜一週共存 130 GB</text>
<text x="16" y="186" class="fg-t">差異備份</text><text x="16" y="204" class="fg-t sm">存完整之後的變化</text>
<rect x="135" y="154" width="50" height="56" rx="3" class="fg-b hot"/><text x="160" y="187" text-anchor="middle" class="fg-t sm">100</text>
<rect x="207" y="198" width="50" height="12" rx="3" class="fg-b"/><rect x="279" y="192" width="50" height="18" rx="3" class="fg-b"/><rect x="351" y="186" width="50" height="24" rx="3" class="fg-b"/><rect x="423" y="180" width="50" height="30" rx="3" class="fg-b"/><rect x="495" y="174" width="50" height="36" rx="3" class="fg-b hot"/><rect x="567" y="168" width="50" height="42" rx="3" class="fg-b"/>
<text x="232" y="192" text-anchor="middle" class="fg-t sm">5</text><text x="304" y="186" text-anchor="middle" class="fg-t sm">10</text><text x="376" y="180" text-anchor="middle" class="fg-t sm">15</text><text x="448" y="174" text-anchor="middle" class="fg-t sm">20</text><text x="520" y="168" text-anchor="middle" class="fg-t sm">25</text><text x="592" y="162" text-anchor="middle" class="fg-t sm">30</text>
<text x="376" y="234" text-anchor="middle" class="fg-t sm acc">週五還原只要 2 份｜一週共存 205 GB</text>
</svg><figcaption>示意：完整備份 100 GB，每天改 5 GB。綠色是週五還原時需要的那幾份。增量省空間、還原麻煩；差異多佔空間、還原簡單。</figcaption></figure>
<p>還有幾種你一定會碰到的：</p>
<ul>
<li><b>快照</b>（snapshot）：雲端磁碟的區塊層級備份，例如 EBS 快照。建立很快，底層其實也是增量的。要注意它預設只是<b>當機一致</b>（crash-consistent）：等於拔掉電源那一刻的磁碟。資料庫通常能從這種狀態自己修復，但最好在資料庫的配合下拍，或直接用資料庫自己的備份工具。</li>
<li><b>邏輯備份與實體備份</b>：<code>pg_dump</code> 匯出的是 SQL 或封存檔，能跨版本搬、能只還原一張表，但資料量大時還原很慢；<code>pg_basebackup</code> 複製的是資料檔本身，還原快，而且能搭配日誌做時間點還原。</li>
<li><b>持續封存與時間點還原</b>（point-in-time recovery，PITR）：資料庫把每一筆變更都寫進日誌（PostgreSQL 的 WAL、MySQL 的 binlog），持續把日誌送到別處保存。還原時先放回一份基礎備份，再把日誌重播到你指定的那一秒，例如「出包的那次上版之前一分鐘」。雲端的託管資料庫（例如 RDS）多半內建這個功能，可以還原到大約五分鐘以前的任一時間點。</li>
</ul>
<div class="warn"><b>複寫不是備份。</b>有人下了 <code>DROP TABLE</code>，這個動作會在幾毫秒內忠實地複寫到所有副本。副本保護的是「機器壞掉」，保護不了「資料被弄壞」。PostgreSQL 可以設一個故意延遲的副本（<code>recovery_min_apply_delay</code>，例如延遲 1 小時），給你一小時的反悔時間，但它也只是補充，不能取代真正的備份。</div>

<h3><span class="badge lv2">進階</span>三、3-2-1-1-0：把備份放對地方</h3>
<p>3-2-1 守則後來被擴充成 <b>3-2-1-1-0</b>，多出來的兩個數字正好對應現代的兩大威脅：勒索軟體和「以為有備份」。</p>
<table>
<tr><th>數字</th><th>意思</th><th>防的是什麼</th></tr>
<tr><td><b>3</b></td><td>至少三份資料（正式資料加兩份備份）</td><td>任何一份壞掉</td></tr>
<tr><td><b>2</b></td><td>放在兩種不同的儲存系統</td><td>同一種系統的同一種故障或 bug</td></tr>
<tr><td><b>1</b></td><td>一份在異地：另一個區域、另一個帳號</td><td>整個機房、整個區域、整個帳號出事</td></tr>
<tr><td><b>1</b></td><td>一份離線或不可變（immutable）</td><td>拿到權限的攻擊者、寫錯的清理腳本</td></tr>
<tr><td><b>0</b></td><td>驗證還原後零錯誤</td><td>「備份其實壞了好幾個月」</td></tr>
</table>
<figure class="figure"><svg viewBox="0 0 660 296" class="fg" style="width:100%;max-width:660px" role="img" aria-label="正式帳號在區域 A，有資料庫和同帳號快照；資料以只能寫不能刪的權限，跨帳號跨區域複製到區域 B 的備份帳號，存在有物件鎖定的物件儲存；每天自動還原驗證">
<rect x="10" y="10" width="300" height="200" rx="10" class="fg-b"/>
<text x="24" y="34" class="fg-t lg">正式帳號（區域 A）</text>
<rect x="30" y="52" width="140" height="56" rx="6" class="fg-b"/>
<text x="100" y="76" text-anchor="middle" class="fg-t">資料庫</text>
<text x="100" y="96" text-anchor="middle" class="fg-t sm">第 1 份：正式資料</text>
<line x1="100" y1="108" x2="100" y2="132" class="fg-l"/><polygon points="100,140 95.5,132 104.5,132" class="fg-a"/>
<text x="110" y="128" class="fg-t sm">每小時</text>
<rect x="30" y="140" width="260" height="50" rx="6" class="fg-b alt"/>
<text x="160" y="161" text-anchor="middle" class="fg-t">第 2 份：磁碟快照</text>
<text x="160" y="179" text-anchor="middle" class="fg-t sm">同帳號，還原最快</text>
<rect x="350" y="10" width="300" height="200" rx="10" class="fg-b alt"/>
<text x="364" y="34" class="fg-t lg">備份帳號（區域 B）</text>
<rect x="370" y="52" width="260" height="56" rx="6" class="fg-b hot"/>
<text x="500" y="76" text-anchor="middle" class="fg-t acc">第 3 份：物件儲存</text>
<text x="500" y="96" text-anchor="middle" class="fg-t sm">物件鎖定 35 天，誰都刪不掉</text>
<line x1="170" y1="80" x2="362" y2="80" class="fg-l on"/><polygon points="370,80 362,75.5 362,84.5" class="fg-a on"/>
<text x="262" y="72" text-anchor="middle" class="fg-t sm acc">跨帳號、跨區域</text>
<text x="262" y="98" text-anchor="middle" class="fg-t sm warm">只能寫、不能刪</text>
<rect x="370" y="140" width="260" height="50" rx="6" class="fg-b"/>
<text x="500" y="161" text-anchor="middle" class="fg-t">獨立的身分</text>
<text x="500" y="179" text-anchor="middle" class="fg-t sm">另一組管理員、另一組 MFA</text>
<rect x="160" y="236" width="320" height="50" rx="6" class="fg-b warm"/>
<text x="320" y="257" text-anchor="middle" class="fg-t">0 個錯誤：每天自動還原驗證</text>
<text x="320" y="275" text-anchor="middle" class="fg-t sm">還原到暫時的機器、檢查、計時、刪掉</text>
<path d="M500 210 V261 H488" class="fg-l"/><polygon points="480,261 488,256.5 488,265.5" class="fg-a"/>
</svg><figcaption>三份資料、兩種儲存（磁碟快照和物件儲存）、一份在另一個區域和帳號、那一份還是不可變的，最後用自動還原證明它真的能用。</figcaption></figure>
<h4>不可變，要做到什麼程度</h4>
<p>三大雲都有讓物件「寫入後一段時間內不能刪、不能改」的功能：AWS S3 的物件鎖定（Object Lock）、AWS Backup 的 Vault Lock、Azure Blob 的不可變儲存、Google Cloud Storage 的保留政策鎖定。以 S3 物件鎖定為例，它有兩種模式：</p>
<ul>
<li><b>治理模式</b>（governance）：有特殊權限的人可以解除。防得了寫錯的腳本，防不了偷到管理員權限的人。</li>
<li><b>合規模式</b>（compliance）：保留期限到之前，任何人，包括帳號的 root，都不能刪除或縮短期限。這才是防勒索軟體要的那一種。代價是設錯了也改不回來，要先用短的期限試。</li>
</ul>
<h4>兩個常被忽略的陷阱</h4>
<ul>
<li><b>冷儲存要等。</b>把備份放進最便宜的封存層很划算，但取回要時間：S3 Glacier Flexible Retrieval 標準取回要幾個小時，Deep Archive 標準取回最多 12 小時。如果 RTO 是 2 小時，最新的那份備份就不能放在這裡。</li>
<li><b>加密金鑰也要有備援。</b>備份通常是加密的。如果金鑰放在正式帳號的 KMS 裡，攻擊者可以排程刪除那把金鑰（KMS 會等 7 到 30 天才真的刪），或者金鑰因為別的原因不見了，備份就變成一堆讀不出來的位元組。異地那份備份，要用備份帳號自己控制的金鑰。</li>
</ul>

<h3><span class="badge lv2">進階</span>四、沒還原過的備份，不算備份</h3>
<p>備份的狀態，在你真的去還原之前，都是未知的。真實世界裡常見的意外：</p>
<ul>
<li>備份工作好幾個月前就開始失敗，失敗通知寄到一個早就沒人看的信箱。</li>
<li>備份到的是錯的資料庫，或少了某幾個 schema、某幾張新加的表。</li>
<li>資料庫在，可是還原後應用程式連不上：使用者權限、擴充套件、設定檔都沒備份。</li>
<li>金鑰找不到，解不開。</li>
<li>還原要 6 小時，可是 RTO 寫的是 1 小時。</li>
</ul>
<p>唯一的解法是把還原變成例行公事。每天自動跑一次：把最新的備份還原到一台暫時的機器、檢查、計時、刪掉。一個最小的版本：</p>
<pre><code>#!/usr/bin/env bash
set -euo pipefail
start=$(date +%s)

aws s3 cp s3://backup-bucket/db/latest.dump /tmp/db.dump
createdb restore_check
pg_restore --no-owner -d restore_check /tmp/db.dump

# 最新一筆資料的時間，要在 RPO 之內
psql -At -d restore_check \\
  -c "select max(created_at) from matches"

echo "restore took $(( $(date +%s) - start )) seconds"
dropdb restore_check</code></pre>
<p>把「還原花了幾秒」和「最新一筆資料距今幾分鐘」送進監控，並設兩個警報：還原失敗、還原時間超過 RTO 的一半。這就是第 4.3 課說的「針對症狀發警報」：你真正在意的症狀不是「備份工作有沒有跑」，而是「現在出事的話，救不救得回來」。</p>
<p>還有一個更根本的測試：<b>從零重建</b>。給你一個全新的空帳號、一份 git 和備份，能不能把整個服務建起來？第一次做通常會發現一堆只存在某台機器上、某個人腦袋裡的東西。基礎設施即程式碼（infrastructure as code）的價值，在這一刻最明顯。</p>

<h3><span class="badge lv3">專業</span>五、四種災難復原策略：用錢換時間</h3>
<p>上一課的四種策略，差別在「平常在第二個區域準備了多少東西」：</p>
<figure class="figure"><svg viewBox="0 0 680 266" class="fg" style="width:100%;max-width:680px" role="img" aria-label="四種災難復原策略比較：備份與還原只有備份，母火模式資料持續複寫但機器關著，暖備援有小規模在跑，主動-主動全規模接流量；越往右 RTO 越短、成本越高">
<rect x="20" y="14" width="150" height="36" rx="6" class="fg-b"/><text x="95" y="37" text-anchor="middle" class="fg-t">備份與還原</text>
<rect x="182" y="14" width="150" height="36" rx="6" class="fg-b"/><text x="257" y="37" text-anchor="middle" class="fg-t">母火模式</text>
<rect x="344" y="14" width="150" height="36" rx="6" class="fg-b"/><text x="419" y="37" text-anchor="middle" class="fg-t">暖備援</text>
<rect x="506" y="14" width="150" height="36" rx="6" class="fg-b"/><text x="581" y="37" text-anchor="middle" class="fg-t">主動-主動</text>
<rect x="20" y="62" width="150" height="32" rx="5" class="fg-b"/><text x="95" y="83" text-anchor="middle" class="fg-t sm">資料：只有備份</text>
<rect x="182" y="62" width="150" height="32" rx="5" class="fg-b alt"/><text x="257" y="83" text-anchor="middle" class="fg-t sm">資料：持續複寫</text>
<rect x="344" y="62" width="150" height="32" rx="5" class="fg-b alt"/><text x="419" y="83" text-anchor="middle" class="fg-t sm">資料：持續複寫</text>
<rect x="506" y="62" width="150" height="32" rx="5" class="fg-b hot"/><text x="581" y="83" text-anchor="middle" class="fg-t sm">資料：兩邊都在寫</text>
<rect x="20" y="102" width="150" height="32" rx="5" class="fg-b dash"/><text x="95" y="123" text-anchor="middle" class="fg-t sm">機器：沒有</text>
<rect x="182" y="102" width="150" height="32" rx="5" class="fg-b dash"/><text x="257" y="123" text-anchor="middle" class="fg-t sm">機器：關著，映像檔備好</text>
<rect x="344" y="102" width="150" height="32" rx="5" class="fg-b alt"/><text x="419" y="123" text-anchor="middle" class="fg-t sm">機器：小規模在跑</text>
<rect x="506" y="102" width="150" height="32" rx="5" class="fg-b hot"/><text x="581" y="123" text-anchor="middle" class="fg-t sm">機器：全規模接流量</text>
<text x="95" y="160" text-anchor="middle" class="fg-t">RTO 幾小時</text><text x="95" y="180" text-anchor="middle" class="fg-t sm">RPO 看備份頻率</text>
<text x="257" y="160" text-anchor="middle" class="fg-t">RTO 幾十分鐘</text><text x="257" y="180" text-anchor="middle" class="fg-t sm">RPO 幾秒到幾分鐘</text>
<text x="419" y="160" text-anchor="middle" class="fg-t">RTO 幾分鐘</text><text x="419" y="180" text-anchor="middle" class="fg-t sm">RPO 幾秒到幾分鐘</text>
<text x="581" y="160" text-anchor="middle" class="fg-t acc">RTO 接近零</text><text x="581" y="180" text-anchor="middle" class="fg-t sm">RPO 接近零</text>
<text x="24" y="208" class="fg-t sm">成本</text><rect x="56" y="198" width="16" height="14" rx="2" class="fg-b warm"/>
<text x="186" y="208" class="fg-t sm">成本</text><rect x="218" y="198" width="40" height="14" rx="2" class="fg-b warm"/>
<text x="348" y="208" class="fg-t sm">成本</text><rect x="380" y="198" width="76" height="14" rx="2" class="fg-b warm"/>
<text x="510" y="208" class="fg-t sm">成本</text><rect x="542" y="198" width="112" height="14" rx="2" class="fg-b warm"/>
<line x1="20" y1="232" x2="648" y2="232" class="fg-l"/><polygon points="656,232 648,227.5 648,236.5" class="fg-a"/>
<text x="338" y="254" text-anchor="middle" class="fg-t sm">越往右：復原越快、越貴、也越複雜</text>
</svg><figcaption>四種策略的差別，就是第二個區域平常在跑多少東西。成本長條只是相對的示意。</figcaption></figure>
<table>
<tr><th>策略</th><th>出事時要做的事</th><th>最容易出錯的地方</th></tr>
<tr><td><b>備份與還原</b></td><td>用基礎設施即程式碼建出整套環境，再還原資料</td><td>沒演練過的整套重建，幾乎一定比預期久</td></tr>
<tr><td><b>母火模式</b>（pilot light）</td><td>資料庫副本已經在跑；開機、擴大應用程式層，把副本升為主節點，切流量</td><td>那一刻才開機，可能碰上那個區域的容量不足</td></tr>
<tr><td><b>暖備援</b>（warm standby）</td><td>把在跑的小規模環境擴大，升級資料庫，切流量</td><td>平常流量小，有些問題要真的放大流量才看得到</td></tr>
<tr><td><b>主動-主動</b>（active-active）</td><td>把壞掉那一區的流量導到其他區</td><td>兩邊同時寫入的資料衝突，是最難的工程問題</td></tr>
</table>
<p>選哪一種，回頭看第一節的表：每一種資料的 RTO 和 RPO 是多少，加上業務願意為它付多少錢。同一個系統裡混用很常見：玩家帳號用暖備援，排行榜和報表用備份與還原。</p>
<h4>多可用區域和多區域，差的不只是距離</h4>
<p>同一個區域裡的可用區域（availability zone），是電力、網路、建築都分開的機房，彼此距離近，延遲通常在毫秒以內到幾毫秒。所以跨可用區域做<b>同步複寫</b>很實際：每次提交多等一兩毫秒，換到 RPO 0。這能擋住最常見的故障：一棟機房斷電、一台交換器壞掉。</p>
<p>跨區域就不一樣了。區域之間常常隔了幾百到幾千公里，往返延遲幾十到一百多毫秒，每次提交都等這麼久，大部分系統受不了，只好用<b>非同步複寫</b>，RPO 就不可能是零。多區域要擋的，是整個區域出問題：這很少見，但確實發生過，例如 2021 年 12 月 AWS 的 us-east-1 事件，影響了大量依賴它的服務。</p>
<p>做多區域設計時，AWS 自己的建議很值得記住：<b>復原的步驟，盡量只依賴「資料平面」，不要依賴「控制平面」</b>。意思是：出事時才去呼叫 API 開新機器、改設定（控制平面），在大規模事件裡這些 API 本身可能就很慢或失敗；事先就把機器準備好、用 DNS 健康檢查自動切換（資料平面），比較可靠。這叫<b>靜態穩定</b>（static stability）：出事時什麼都不用新建，系統就能繼續運作。</p>

<h3><span class="badge lv3">專業</span>六、切換的那一刻：資料會出什麼事</h3>
<p>切到備援，不是按一個鈕那麼簡單。幾個一定要想清楚的問題：</p>
<h4>非同步複寫的延遲，就是你真實的 RPO</h4>
<p>主節點每秒處理 1,000 筆寫入，副本落後 3 秒。主節點那一刻死掉，大約 3,000 筆交易就不見了，而這些交易，使用者當時都已經看到「成功」。所以要監控複寫延遲（replication lag），並設警報：它就是你此時此刻真正的 RPO。</p>
<h4>腦分裂：兩邊都以為自己是主</h4>
<figure class="figure"><svg viewBox="0 0 660 276" class="fg" style="width:100%;max-width:660px" role="img" aria-label="腦分裂：網路斷開後，區域 A 的舊主節點和區域 B 新升的主節點都在接受寫入；加上第三區的見證者後，B 加 C 兩票成為多數可以當主，A 只有一票必須停止寫入">
<rect x="55" y="10" width="120" height="30" rx="5" class="fg-b"/><text x="115" y="30" text-anchor="middle" class="fg-t sm">用戶端 1</text>
<rect x="485" y="10" width="120" height="30" rx="5" class="fg-b"/><text x="545" y="30" text-anchor="middle" class="fg-t sm">用戶端 2</text>
<line x1="115" y1="40" x2="115" y2="52" class="fg-l"/><polygon points="115,60 110.5,52 119.5,52" class="fg-a"/>
<text x="125" y="54" class="fg-t sm">寫入 X</text>
<line x1="545" y1="40" x2="545" y2="52" class="fg-l"/><polygon points="545,60 540.5,52 549.5,52" class="fg-a"/>
<text x="555" y="54" class="fg-t sm">寫入 Y</text>
<rect x="30" y="60" width="170" height="60" rx="6" class="fg-b warm"/>
<text x="115" y="85" text-anchor="middle" class="fg-t">區域 A：舊的主</text>
<text x="115" y="105" text-anchor="middle" class="fg-t sm">以為自己還是主</text>
<rect x="460" y="60" width="170" height="60" rx="6" class="fg-b warm"/>
<text x="545" y="85" text-anchor="middle" class="fg-t">區域 B：新升的主</text>
<text x="545" y="105" text-anchor="middle" class="fg-t sm">也在接受寫入</text>
<line x1="330" y1="14" x2="330" y2="130" class="fg-l warm dash"/>
<line x1="200" y1="90" x2="300" y2="90" class="fg-l dim"/><line x1="360" y1="90" x2="460" y2="90" class="fg-l dim"/>
<text x="330" y="150" text-anchor="middle" class="fg-t sm warm">網路斷開：兩份歷史開始分岔</text>
<rect x="255" y="180" width="150" height="50" rx="6" class="fg-b hot"/>
<text x="330" y="202" text-anchor="middle" class="fg-t acc">見證者</text>
<text x="330" y="220" text-anchor="middle" class="fg-t sm">在第三個區域 C</text>
<path d="M255 205 H115 V120" class="fg-l warm dash"/>
<path d="M405 205 H545 V120" class="fg-l on"/>
<text x="30" y="250" class="fg-t sm warm">A 只剩 1 票（少數）</text>
<text x="30" y="268" class="fg-t sm">→ 自己停止寫入</text>
<text x="630" y="250" text-anchor="end" class="fg-t sm acc">B＋C 共 2 票（多數）</text>
<text x="630" y="268" text-anchor="end" class="fg-t sm">→ 才能升為主</text>
</svg><figcaption>上半部是腦分裂：兩邊各自接受寫入，網路恢復後沒有一份是「對的」。下半部是解法：第三個區域放一個見證者，只有拿到多數票的一邊能當主。</figcaption></figure>
<p>A 和 B 之間的網路斷了。B 收不到 A 的心跳，以為 A 死了，於是升自己為主。但 A 其實活著，還有一些用戶端連著它，繼續寫入。網路恢復後，你手上有兩份不同的歷史，沒有任何一份是完整的。這叫<b>腦分裂</b>（split brain），修復它通常要人工一筆一筆比對。</p>
<p>防法有兩層：</p>
<ul>
<li><b>多數決</b>（quorum）：在第三個可用區域放一個見證者（witness），只有拿到多數票的那一邊可以當主。A 發現自己只剩一票，就主動停止寫入。這也是為什麼 etcd、Consul 這類系統都建議奇數個節點。</li>
<li><b>隔離舊主</b>（fencing）：升級新主之前，先確定舊主不可能再寫入：撤掉它的網路、關掉它的機器、收回它對儲存的寫入權。有一個很直白的名字叫 STONITH（shoot the other node in the head）。</li>
</ul>
<h4>其他會在切換時咬人的東西</h4>
<ul>
<li><b>舊主回來之後</b>，不能直接接回去當副本：它身上可能有新主沒有的交易。要重建，或用 <code>pg_rewind</code> 倒回到分岔點，而那些多出來的交易要另外處理。</li>
<li><b>同步複寫的另一面</b>：PostgreSQL 設定成同步複寫後，如果同步的副本掛了，主節點的提交會一直等，整個系統看起來像卡住。同步複寫要搭配至少兩個候選副本，或明確的降級流程。</li>
<li><b>快取是冷的</b>：切到新區域後，快取全部是空的，所有請求一起打到資料庫，可能剛切過去就被壓垮。演練時要量這一段。</li>
<li><b>物件儲存的複寫也是非同步的</b>：例如 S3 的跨區域複寫，啟用 Replication Time Control 時保證 99.99% 的物件在 15 分鐘內複製完成。資料庫裡記著某個檔案，那個檔案卻還沒到新區域，是很常見的不一致。</li>
</ul>

<h3><span class="badge lv4">專家</span>七、為勒索軟體設計</h3>
<p>現代勒索軟體攻擊不是「一個病毒把檔案加密」那麼簡單，而是一個有耐心的人在你的系統裡一步一步來。他知道你有備份，所以第一個目標就是備份：</p>
<figure class="figure"><svg viewBox="0 0 680 236" class="fg" style="width:100%;max-width:680px" role="img" aria-label="勒索攻擊五個步驟：偷到憑證、潛伏盤點、刪除備份快照、加密正式環境、留下勒索信；第三步時，同帳號快照和同帳號儲存桶會被刪掉，另一帳號加物件鎖定和離線副本撐得過去">
<rect x="10" y="20" width="120" height="50" rx="6" class="fg-b warm"/><text x="70" y="42" text-anchor="middle" class="fg-t">1 偷到憑證</text><text x="70" y="60" text-anchor="middle" class="fg-t sm">釣魚、外洩金鑰</text>
<rect x="145" y="20" width="120" height="50" rx="6" class="fg-b warm"/><text x="205" y="42" text-anchor="middle" class="fg-t">2 潛伏盤點</text><text x="205" y="60" text-anchor="middle" class="fg-t sm">幾天到幾週</text>
<rect x="280" y="20" width="120" height="50" rx="6" class="fg-b warm"/><text x="340" y="42" text-anchor="middle" class="fg-t">3 刪除備份</text><text x="340" y="60" text-anchor="middle" class="fg-t sm">先斷你的退路</text>
<rect x="415" y="20" width="120" height="50" rx="6" class="fg-b warm"/><text x="475" y="42" text-anchor="middle" class="fg-t">4 加密資料</text><text x="475" y="60" text-anchor="middle" class="fg-t sm">資料庫、磁碟</text>
<rect x="550" y="20" width="120" height="50" rx="6" class="fg-b warm"/><text x="610" y="42" text-anchor="middle" class="fg-t">5 勒索</text><text x="610" y="60" text-anchor="middle" class="fg-t sm">付錢才給金鑰</text>
<line x1="130" y1="45" x2="137" y2="45" class="fg-l warm"/><polygon points="145,45 137,40.5 137,49.5" class="fg-a warm"/>
<line x1="265" y1="45" x2="272" y2="45" class="fg-l warm"/><polygon points="280,45 272,40.5 272,49.5" class="fg-a warm"/>
<line x1="400" y1="45" x2="407" y2="45" class="fg-l warm"/><polygon points="415,45 407,40.5 407,49.5" class="fg-a warm"/>
<line x1="535" y1="45" x2="542" y2="45" class="fg-l warm"/><polygon points="550,45 542,40.5 542,49.5" class="fg-a warm"/>
<line x1="340" y1="70" x2="340" y2="100" class="fg-l warm"/>
<line x1="85" y1="100" x2="583" y2="100" class="fg-l warm"/>
<line x1="85" y1="100" x2="85" y2="122" class="fg-l warm"/><polygon points="85,130 80.5,122 89.5,122" class="fg-a warm"/>
<line x1="251" y1="100" x2="251" y2="122" class="fg-l warm"/><polygon points="251,130 246.5,122 255.5,122" class="fg-a warm"/>
<line x1="417" y1="100" x2="417" y2="122" class="fg-l warm dash"/><polygon points="417,130 412.5,122 421.5,122" class="fg-a warm"/>
<line x1="583" y1="100" x2="583" y2="122" class="fg-l warm dash"/><polygon points="583,130 578.5,122 587.5,122" class="fg-a warm"/>
<rect x="10" y="130" width="150" height="56" rx="6" class="fg-b"/><text x="85" y="154" text-anchor="middle" class="fg-t">同帳號的快照</text><text x="85" y="174" text-anchor="middle" class="fg-t sm warm">被刪掉</text>
<rect x="176" y="130" width="150" height="56" rx="6" class="fg-b"/><text x="251" y="154" text-anchor="middle" class="fg-t">同帳號的儲存桶</text><text x="251" y="174" text-anchor="middle" class="fg-t sm warm">權限夠就刪得掉</text>
<rect x="342" y="130" width="150" height="56" rx="6" class="fg-b hot"/><text x="417" y="154" text-anchor="middle" class="fg-t">另一帳號＋鎖定</text><text x="417" y="174" text-anchor="middle" class="fg-t sm acc">刪不掉、改不了</text>
<rect x="508" y="130" width="150" height="56" rx="6" class="fg-b hot"/><text x="583" y="154" text-anchor="middle" class="fg-t">離線副本</text><text x="583" y="174" text-anchor="middle" class="fg-t sm acc">根本碰不到</text>
<text x="340" y="218" text-anchor="middle" class="fg-t sm">第 3 步之後，只有右邊兩份還在。你的復原計畫，要建立在它們身上。</text>
</svg><figcaption>攻擊者在加密之前，會先花時間找出並刪掉備份。能撐過第 3 步的，是他拿到的權限碰不到、或碰到了也改不了的那幾份。</figcaption></figure>
<p>把這條攻擊鏈反過來，就是設計原則：</p>
<ul>
<li><b>不同的帳號，還要不同的身分。</b>備份帳號如果跟正式帳號用同一個單一登入的管理員群組，那只是換了個資料夾。備份帳號要有自己的管理員、自己的硬體 MFA，平常幾乎沒人登入。</li>
<li><b>正式環境只能寫，不能刪。</b>正式帳號的備份角色只有「放進去」的權限，沒有刪除、沒有改生命週期規則、沒有解除鎖定。</li>
<li><b>保留期限要比潛伏期長。</b>攻擊者常常在裡面待了幾天到幾週才動手，長的可以到好幾個月。只保留 7 天的不可變備份，可能每一份都已經是「被入侵之後」的狀態。重要資料的不可變保留，常見是 30 到 90 天，再加上每月一份保留更久的。</li>
<li><b>盯著刪除的動作。</b>大量刪除快照、刪除備份庫、改儲存桶的生命週期、排程刪除 KMS 金鑰、關掉稽核日誌，這些 API 呼叫幾乎都不是正常操作。對它們設警報，往往能在第 3 步就抓到人。</li>
<li><b>在乾淨的房間裡復原。</b>還原時假設所有舊的憑證都外洩了：在隔離的網路或新的帳號裡還原，全部金鑰和密碼輪換；伺服器用基礎設施即程式碼和乾淨的映像檔重建，而不是從被入侵的機器備份還原，因為那裡面可能藏著後門。找到攻擊者一開始怎麼進來的之前，不要接回網路。</li>
</ul>

<h3><span class="badge lv4">專家</span>八、處理手冊、演練，和帳號層級的災難</h3>
<h4>災難復原的處理手冊</h4>
<p>災難復原的手冊，是給一個壓力很大、可能對這套系統不熟的人看的。它至少要有：</p>
<ol>
<li><b>觸發條件</b>：什麼情況下啟動，什麼情況下先不要。</li>
<li><b>誰決定</b>：有權宣布啟動的角色，加上第二、第三順位，以及聯絡方式。</li>
<li><b>事前條件</b>：需要哪些權限、工具、帳號，放在哪裡。</li>
<li><b>步驟</b>：每一步的指令，以及<b>預期看到的輸出</b>。看到不一樣的，就停下來升級。</li>
<li><b>驗證</b>：怎麼確認恢復了，用哪些指標。</li>
<li><b>切回來</b>（failback）：怎麼回到原本的區域。這常常比切過去更難：要反向複寫、要比對切換期間兩邊的資料。</li>
</ol>
<h4>演練要一級一級來</h4>
<table>
<tr><th>等級</th><th>內容</th><th>能發現什麼</th></tr>
<tr><td>桌上推演</td><td>大家照著手冊口頭走一遍</td><td>步驟缺漏、沒人知道的權限</td></tr>
<tr><td>元件還原</td><td>還原一個資料庫到測試環境，計時</td><td>真實的還原速度、缺的設定</td></tr>
<tr><td>計畫中的切換</td><td>上班時間，正式把流量切到備援區域再切回來</td><td>DNS、快取、容量、切回來的難度</td></tr>
<tr><td>不預告的演練</td><td>只有少數人知道，看值班的人照手冊處理</td><td>手冊在真實壓力下好不好用</td></tr>
</table>
<p>每次演練都記下量到的 RTO 和 RPO，跟目標比較。差距就是下一季的工作清單。</p>
<h4>最可怕的災難：帳號進不去</h4>
<p>這一類災難沒有任何技術能解，只能事先防：</p>
<ul>
<li><b>雲端的 root 帳號</b>：註冊時用的是某個已離職同事的個人信箱，或公司的網域忘了續約、信箱收不到信，連重設密碼都做不到。root 的信箱要用公司網域上的群組地址；MFA 至少註冊兩個（AWS 的 root 可以註冊多個 MFA 裝置），分開保管。</li>
<li><b>付款失敗</b>：信用卡過期，帳單一直付不出去，帳號可能被停權，資源最後被刪除。帳單聯絡人要是一個有人看的群組。</li>
<li><b>網域註冊商</b>：網域過期或註冊商帳號被盜，DNS 就沒了，連帶所有寄到這個網域的信都收不到，包括其他服務的密碼重設信。開自動續約、註冊商鎖定（registrar lock），註冊商帳號一樣要 MFA。</li>
<li><b>單一登入服務</b>：所有東西都靠同一個身分供應商登入，它一出事，所有人都進不去所有系統。準備<b>破窗帳號</b>（break-glass account）：不經過單一登入、有硬體 MFA、密碼密封保管、平常不用、一用就發警報。</li>
<li><b>只有一個人知道</b>：密碼、流程、某台機器怎麼設的，全在某個人腦袋裡。用團隊共用的密碼管理器，並設定緊急存取。</li>
<li><b>供應商本身</b>：帳號因為濫用申訴被暫停，或供應商長時間出事。最重要的資料，在另一家雲端或離線處，留一份你自己控制的副本。</li>
</ul>

<h3>九、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>有副本（replica）就不用備份</td><td>副本會把刪除和寫壞的資料一起複寫過去。它防機器壞，不防資料壞。</td></tr>
<tr><td>備份工作顯示成功，就代表救得回來</td><td>只有實際還原、檢查過，才知道救不救得回來，以及要花多久。</td></tr>
<tr><td>快照放在同一個帳號就夠了</td><td>拿到那個帳號權限的攻擊者或腳本，可以連快照一起刪掉。</td></tr>
<tr><td>多區域一定比較可靠</td><td>多區域多了非同步複寫、腦分裂、切換流程這些新的失敗方式。沒演練過的多區域，可能比單區域多可用區域更不可靠。</td></tr>
<tr><td>RTO 就是還原資料的時間</td><td>還原只是其中一步。發現、決定、準備環境、驗證、切流量都要算，而「決定」常常是最久的。</td></tr>
<tr><td>災難就是天災或硬體壞掉</td><td>更常見的是人：刪錯資料、出包的上版、勒索軟體、帳號被鎖。</td></tr>
</table>

<h3>十、跟你的工作連起來</h3>
<ul>
<li><b>後端（Node.js、Go）與資料庫</b>：資料庫遷移在上線前先拍一份快照或確認時間點還原可用；寫壞資料的 bug，常常要靠時間點還原救。上傳到物件儲存的檔案，也要開版本控制。</li>
<li><b>Docker 與雲端主機</b>：容器裡的資料是暫時的，重要的狀態要放在有備份的地方（託管資料庫、物件儲存），不要放在某台機器的磁碟上。主機本身要能用腳本或基礎設施即程式碼重建，不靠手動設定。</li>
<li><b>前端（Vue、TypeScript）</b>：靜態檔通常放在物件儲存和 CDN 上，網域和 DNS 是它的命脈。網域續約、DNS 供應商的帳號安全，就是前端的災難復原。</li>
<li><b>遊戲（Cocos、Unity）</b>：玩家最在意的是帳號和道具。那一塊的 RPO 要接近零；而排行榜、統計可以重算，不用花大錢保護。資源包（asset bundle）和版本檔也要能從 CI 重新產生。</li>
<li><b>自己的專案</b>：至少做到：資料每天備份到另一個帳號或另一家服務、每個月實際還原一次、網域開自動續約、所有重要帳號開 MFA 並把復原碼離線保存。</li>
</ul>

<h3>十一、面試會怎麼問</h3>
<p>維運、SRE、雲端架構的面試很愛問災難復原，因為它很快就能看出你有沒有真的做過。</p>
<ol>
<li>「RPO 和 RTO 是什麼？舉一個你會怎麼替不同資料訂這兩個數字的例子。」</li>
<li>「備份和複寫有什麼不同？為什麼有了副本還要備份？」</li>
<li>「你怎麼確定備份是可以用的？」</li>
<li>「比較母火模式和暖備援。你會怎麼選？」</li>
<li>「如果攻擊者拿到了你雲端帳號的管理員權限，你的備份還安全嗎？要怎麼設計？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>RPO 是最多能承受掉多少最近的資料，由備份或複寫頻率決定；RTO 是最多能停擺多久，由事前準備決定，包含發現、決定、建環境、還原、驗證、切流量。要按資料分級：例如使用者帳號 RPO 接近零、RTO 30 分鐘，用同步複寫加時間點還原；報表 RPO 一天、RTO 一天，每天備份即可；可以重算的資料甚至不用備份。</li>
<li>複寫是即時把變更送到副本，防的是機器或機房故障；但刪除、寫壞的資料也會同樣被複寫過去。備份是某些時間點的獨立副本，能回到出錯之前。所以兩者都要：副本負責快速切換，備份（最好加上時間點還原）負責從資料錯誤和惡意破壞中恢復。</li>
<li>定期自動還原：把最新的備份還原到暫時環境，檢查資料量和最新資料的時間是否在 RPO 內、跑應用程式的冒煙測試，記錄還原時間並和 RTO 比較，失敗或超時就發警報。另外定期做從零重建和完整的切換演練，並監控備份的新鮮度而不只是工作成功與否。</li>
<li>母火模式平常只保持資料持續複寫，應用程式機器關著，成本低，但出事時要開機和擴展，RTO 大約幾十分鐘，而且可能碰上容量不足；暖備援平常有小規模的完整環境在跑，只要擴大和切換，RTO 幾分鐘，成本較高，好處是它一直在運作，問題比較早被發現。依各資料的 RTO 和預算選，也可以混用。</li>
<li>如果備份都在同一個帳號、用同一套權限，就不安全：攻擊者通常會先刪備份。設計上要把一份備份放在另一個帳號、用不同的身分和 MFA 管理；正式環境只有寫入權限；用合規模式的物件鎖定讓保留期內誰都刪不掉，保留期要比可能的潛伏期長；加密金鑰由備份帳號控制；對刪除快照、改生命週期、刪金鑰等動作發警報；復原時在隔離環境進行並輪換所有憑證。</li>
</ol>
</details>

<h3>十二、練功題（做得出來才算真的懂）</h3>
<ol>
<li>一個資料庫 500 GB，每天凌晨 3 點完整備份一次，沒有日誌封存。還原速度約每秒 150 MB。下午 4 點資料庫壞掉。最壞情況會掉多少小時的資料？單是還原資料就要多久？</li>
<li>承上題，業務要求 RPO 5 分鐘。你會改什麼？</li>
<li>完整備份 200 GB，每天改 10 GB。週日完整備份，週一到週六做增量。週四晚上要還原到週四的備份，需要哪幾份、一共多少 GB？如果改成差異備份呢？</li>
<li>主節點每秒 400 筆寫入，非同步副本平均落後 2 秒，尖峰時落後 15 秒。尖峰時切換，大約會掉多少筆交易？你會怎麼讓這個數字被看見？</li>
<li>動手：替你自己的一個資料庫寫一支還原驗證腳本，跑一次並記下還原時間。這就是你的真實 RTO 的一部分。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>最近一次備份在凌晨 3 點，下午 4 點壞掉，掉 13 小時的資料；如果備份那天剛好失敗，就是 37 小時。還原：500,000 MB ÷ 150 ≈ 3,333 秒，大約 56 分鐘，還不包含發現、決定、驗證等步驟。</li>
<li>開啟持續日誌封存（例如 PostgreSQL 的 WAL 封存，或託管資料庫的自動備份與時間點還原），讓日誌至少每 5 分鐘送出一次；同時保留每日或每週的基礎備份。如果要求更嚴，再加一個跨可用區域的副本。並且監控封存是否延遲。</li>
<li>增量：週日完整 200＋週一、二、三、四各 10，共 5 份、240 GB。差異：週日完整 200＋週四的差異（週一到週四累積 40），共 2 份、240 GB。這一次兩者要讀的資料量一樣，差別在份數：增量要接 5 份，任何一份壞掉，後面的都用不了。</li>
<li>400 × 15 = 大約 6,000 筆。把複寫延遲做成指標和警報（例如超過 10 秒就開工單、超過 60 秒就叫人），並在切換的處理手冊裡寫明：切換前先看延遲、記下最後一筆已複寫的位置，事後才知道要補救哪些交易。</li>
<li>參考第四節的腳本：下載備份、還原到暫時的資料庫、檢查最新一筆資料的時間、輸出耗時、刪掉。記下的時間加上「發現」「決定」「切換」的估計，才是完整的 RTO。</li>
</ol>
</details>

<h3>十三、想再挖深</h3>
<ul>
<li><b>AWS 白皮書〈Disaster Recovery of Workloads on AWS: Recovery in the Cloud〉</b>：四種策略的原始出處，各自的架構圖和 RTO／RPO 範圍都講得很清楚，觀念換到其他雲端也適用。</li>
<li><b>Google《Site Reliability Engineering》第 26 章〈Data Integrity: What You Read Is What You Wrote〉</b>（<a href="https://sre.google/books/">sre.google/books</a>）：Google 怎麼看備份、還原和資料完整性，包括很多「備份沒用」的真實故事。</li>
<li><b>PostgreSQL 官方文件〈Continuous Archiving and Point-in-Time Recovery (PITR)〉</b>（<a href="https://www.postgresql.org/docs/">postgresql.org/docs</a>）：基礎備份加 WAL 封存的完整做法。</li>
<li><b>NIST SP 800-34〈Contingency Planning Guide for Federal Information Systems〉</b>：營運持續與災難復原計畫的標準框架，寫處理手冊和演練計畫時很好用。</li>
<li><b>CISA〈#StopRansomware Guide〉</b>（<a href="https://www.cisa.gov/stopransomware">cisa.gov/stopransomware</a>）：美國網路安全機構整理的勒索軟體預防與應變清單，包括離線備份的做法。</li>
</ul>
` });
