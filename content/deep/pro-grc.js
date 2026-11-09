DEEP({ 'pro-grc': `
<p>上一課說了治理、風險與合規（GRC）是什麼，以及你會遇到哪些標準。這一章把它從「文書作業」還原成一套有邏輯的機制：風險怎麼評、怎麼算錢；ISO/IEC 27001 的條文到底在要求什麼、適用性聲明書是什麼；SOC 2 和 PCI DSS 差在哪；政策和程序怎麼分層；稽核員怎麼抽樣、工程師怎麼讓佐證資料自己長出來；供應商的風險、營運持續，以及台灣的法規環境。在台灣，很多資安職缺有一半的工作就在這裡，看懂它，你在面試和工作上都會比只會技術的人多一條路。</p>

<h3><span class="badge lv1">基礎</span>一、風險是「可能性 × 衝擊」，而且要算得出錢</h3>
<p>你每天都在做風險管理，只是沒這樣叫它。出門前看天空決定帶不帶傘：下雨的可能性多高、淋濕了有多慘、帶傘有多麻煩。資安的風險管理是同一件事，只是寫下來、有人負責、定期重看。</p>
<p>最常見的工具是一張 5 × 5 的<b>風險矩陣</b>（risk matrix）：可能性 1 到 5、衝擊 1 到 5，相乘得到風險值。</p>
<figure class="figure"><svg viewBox="0 0 660 290" class="fg" style="width:100%;max-width:660px" role="img" aria-label="5 乘 5 風險矩陣：R1 雲端 root 帳號被盜在可能性 3、衝擊 5，加上硬體金鑰後降到可能性 1；R2 筆電遺失、R3 DDoS、R4 誤刪正式資料庫分別落在不同格子">
<text x="20" y="126" class="fg-t">可能性</text><text x="20" y="144" class="fg-t sm">（1～5）</text>
<text x="108" y="46" text-anchor="end" class="fg-t sm">5</text><text x="108" y="90" text-anchor="end" class="fg-t sm">4</text><text x="108" y="134" text-anchor="end" class="fg-t sm">3</text><text x="108" y="178" text-anchor="end" class="fg-t sm">2</text><text x="108" y="222" text-anchor="end" class="fg-t sm">1</text>
<rect x="120" y="20" width="64" height="44" class="fg-b"/><rect x="184" y="20" width="64" height="44" class="fg-b"/><rect x="248" y="20" width="64" height="44" class="fg-b warm"/><rect x="312" y="20" width="64" height="44" class="fg-b warm"/><rect x="376" y="20" width="64" height="44" class="fg-b warm"/>
<rect x="120" y="64" width="64" height="44" class="fg-b hot"/><rect x="184" y="64" width="64" height="44" class="fg-b"/><rect x="248" y="64" width="64" height="44" class="fg-b"/><rect x="312" y="64" width="64" height="44" class="fg-b warm"/><rect x="376" y="64" width="64" height="44" class="fg-b warm"/>
<rect x="120" y="108" width="64" height="44" class="fg-b hot"/><rect x="184" y="108" width="64" height="44" class="fg-b"/><rect x="248" y="108" width="64" height="44" class="fg-b"/><rect x="312" y="108" width="64" height="44" class="fg-b"/><rect x="376" y="108" width="64" height="44" class="fg-b warm"/>
<rect x="120" y="152" width="64" height="44" class="fg-b hot"/><rect x="184" y="152" width="64" height="44" class="fg-b hot"/><rect x="248" y="152" width="64" height="44" class="fg-b"/><rect x="312" y="152" width="64" height="44" class="fg-b"/><rect x="376" y="152" width="64" height="44" class="fg-b"/>
<rect x="120" y="196" width="64" height="44" class="fg-b hot"/><rect x="184" y="196" width="64" height="44" class="fg-b hot"/><rect x="248" y="196" width="64" height="44" class="fg-b hot"/><rect x="312" y="196" width="64" height="44" class="fg-b hot"/><rect x="376" y="196" width="64" height="44" class="fg-b"/>
<text x="152" y="258" text-anchor="middle" class="fg-t sm">1</text><text x="216" y="258" text-anchor="middle" class="fg-t sm">2</text><text x="280" y="258" text-anchor="middle" class="fg-t sm">3</text><text x="344" y="258" text-anchor="middle" class="fg-t sm">4</text><text x="408" y="258" text-anchor="middle" class="fg-t sm">5</text>
<text x="280" y="280" text-anchor="middle" class="fg-t">衝擊（1～5）</text>
<circle cx="408" cy="130" r="13" class="fg-b"/><text x="408" y="134" text-anchor="middle" class="fg-t sm">R1</text>
<line x1="408" y1="143" x2="408" y2="197" class="fg-l on"/><polygon points="408,205 403.5,197 412.5,197" class="fg-a on"/>
<circle cx="408" cy="218" r="13" class="fg-b"/><text x="408" y="222" text-anchor="middle" class="fg-t sm acc">R1′</text>
<circle cx="280" cy="86" r="13" class="fg-b"/><text x="280" y="90" text-anchor="middle" class="fg-t sm">R2</text>
<circle cx="280" cy="130" r="13" class="fg-b"/><text x="280" y="134" text-anchor="middle" class="fg-t sm">R3</text>
<circle cx="344" cy="174" r="13" class="fg-b"/><text x="344" y="178" text-anchor="middle" class="fg-t sm">R4</text>
<text x="470" y="40" class="fg-t sm">R1 雲端 root 帳號被盜</text>
<text x="470" y="64" class="fg-t sm">R2 筆電遺失</text>
<text x="470" y="88" class="fg-t sm">R3 DDoS 攻擊</text>
<text x="470" y="112" class="fg-t sm">R4 誤刪正式資料庫</text>
<text x="470" y="136" class="fg-t sm acc">R1′ 加上硬體金鑰之後</text>
<rect x="470" y="170" width="12" height="12" rx="2" class="fg-b warm"/><text x="490" y="181" class="fg-t sm">15 以上：一定要處理</text>
<rect x="470" y="194" width="12" height="12" rx="2" class="fg-b"/><text x="490" y="205" class="fg-t sm">5～12：依風險胃納決定</text>
<rect x="470" y="218" width="12" height="12" rx="2" class="fg-b hot"/><text x="490" y="229" class="fg-t sm">4 以下：通常可接受</text>
</svg><figcaption>R1 原本落在 3 × 5 = 15 的格子。強制使用硬體金鑰之後，衝擊沒變（root 被盜一樣慘），但可能性降到 1，風險值變成 5。這個「處理前」和「處理後」的差，就是控制措施的價值。</figcaption></figure>
<p>三個一定要會的詞：</p>
<ul>
<li><b>固有風險</b>（inherent risk）：什麼都還沒做時的風險，R1 的 15。</li>
<li><b>殘餘風險</b>（residual risk）：做了控制措施之後剩下的，R1′ 的 5。殘餘風險永遠不會是零，所以要有人簽名接受它。</li>
<li><b>風險胃納</b>（risk appetite）：組織願意承擔多少風險。新創和銀行的胃納差很多，同一個風險值，一邊接受、一邊必須處理。這條線要由經營階層畫，不是工程師。</li>
</ul>
<h4>算成錢：年化損失期望值</h4>
<p>矩陣是定性的，跟老闆要預算時，定量更有說服力。最經典的公式是 <b>ALE = SLE × ARO</b>：</p>
<ul>
<li><b>SLE</b>（single loss expectancy）：發生一次損失多少。</li>
<li><b>ARO</b>（annualized rate of occurrence）：一年平均發生幾次。</li>
<li><b>ALE</b>（annualized loss expectancy）：一年平均損失多少。</li>
</ul>
<p>算 R2：公司有 50 台筆電，過去平均每兩年遺失一台，ARO = 0.5。筆電沒加密的話，遺失一次除了 4 萬元的硬體，還要做外洩調查、通知受影響的人，假設合計 30 萬元，ALE = 30 萬 × 0.5 = 每年 15 萬。開啟全磁碟加密並集中管理金鑰，假設每年管理成本 2 萬元，遺失時就只剩硬體損失，ALE = 4 萬 × 0.5 = 2 萬。每年省下 15 萬 − 2 萬 − 2 萬 = 11 萬。這樣講，比「加密很重要」有力得多。數字都是假設的，但<b>把假設寫出來</b>本身就有價值：別人可以挑戰你的假設，而不是挑戰你的直覺。更完整的定量方法可以看 FAIR（Factor Analysis of Information Risk）。</p>

<h3><span class="badge lv1">基礎</span>二、ISO 27005 式的風險管理流程</h3>
<p>ISO/IEC 27005 是 ISO 27001 家族裡專講資安風險管理的指引，2022 年版和 27001:2022 對齊。它的流程可以畫成一條主線，加上兩條貫穿全程的軌道：</p>
<figure class="figure"><svg viewBox="0 0 640 236" class="fg" style="width:100%;max-width:640px" role="img" aria-label="風險管理流程：建立脈絡、風險評鑑（辨識、分析、評估）、風險處理、風險接受；殘餘風險太高就再處理一輪；溝通與諮詢、監視與審查貫穿全程">
<rect x="20" y="14" width="584" height="28" rx="6" class="fg-b alt"/><text x="312" y="33" text-anchor="middle" class="fg-t">溝通與諮詢：每一步都跟利害關係人講清楚</text>
<rect x="20" y="80" width="84" height="50" rx="6" class="fg-b"/><text x="62" y="101" text-anchor="middle" class="fg-t">建立脈絡</text><text x="62" y="119" text-anchor="middle" class="fg-t sm">範圍、準則</text>
<line x1="104" y1="105" x2="118" y2="105" class="fg-l"/><polygon points="126,105 118,100.5 118,109.5" class="fg-a"/>
<rect x="126" y="58" width="260" height="92" rx="8" class="fg-b"/><text x="256" y="74" text-anchor="middle" class="fg-t sm acc">風險評鑑</text>
<rect x="136" y="84" width="74" height="50" rx="6" class="fg-b hot"/><text x="173" y="105" text-anchor="middle" class="fg-t">辨識</text><text x="173" y="123" text-anchor="middle" class="fg-t sm">會出什麼事</text>
<rect x="220" y="84" width="74" height="50" rx="6" class="fg-b hot"/><text x="257" y="105" text-anchor="middle" class="fg-t">分析</text><text x="257" y="123" text-anchor="middle" class="fg-t sm">多可能多痛</text>
<rect x="304" y="84" width="74" height="50" rx="6" class="fg-b hot"/><text x="341" y="105" text-anchor="middle" class="fg-t">評估</text><text x="341" y="123" text-anchor="middle" class="fg-t sm">跟準則比</text>
<line x1="386" y1="105" x2="402" y2="105" class="fg-l"/><polygon points="410,105 402,100.5 402,109.5" class="fg-a"/>
<rect x="410" y="80" width="84" height="50" rx="6" class="fg-b warm"/><text x="452" y="101" text-anchor="middle" class="fg-t">處理</text><text x="452" y="119" text-anchor="middle" class="fg-t sm">四選一</text>
<line x1="494" y1="105" x2="512" y2="105" class="fg-l on"/><polygon points="520,105 512,100.5 512,109.5" class="fg-a on"/>
<rect x="520" y="80" width="84" height="50" rx="6" class="fg-b"/><text x="562" y="101" text-anchor="middle" class="fg-t">接受</text><text x="562" y="119" text-anchor="middle" class="fg-t sm">負責人簽名</text>
<path d="M562 130 V162 H452 V138" class="fg-l warm dash"/><polygon points="452,130 447.5,138 456.5,138" class="fg-a warm"/>
<text x="507" y="180" text-anchor="middle" class="fg-t sm warm">殘餘風險太高，再處理一輪</text>
<rect x="20" y="196" width="584" height="28" rx="6" class="fg-b alt"/><text x="312" y="215" text-anchor="middle" class="fg-t">監視與審查：定期重看，環境變了就重評</text>
</svg><figcaption>主線一年至少跑一次，系統有重大變更時也要跑。上下兩條軌道不是步驟，而是一直在進行的工作：沒溝通，風險評估就變成資安團隊自己的作文；沒重看，風險登錄表半年就過時。</figcaption></figure>
<ol>
<li><b>建立脈絡</b>：範圍是什麼（整間公司，還是只有遊戲平台）？風險準則是什麼（風險值多少以上一定要處理）？誰有權接受風險？</li>
<li><b>辨識</b>：2022 年版提出兩種角度。<b>以事件為基礎</b>：從「會發生什麼事」想起，例如「玩家資料庫被偷」，適合跟經營階層談。<b>以資產為基礎</b>：一項一項資產問「它會遇到什麼威脅、有什麼弱點」，比較細，適合工程團隊。兩種可以並用。</li>
<li><b>分析</b>：替每個風險給出可能性和衝擊。關鍵是<b>同一套準則</b>：「衝擊 5」要有明確定義，例如「營收損失超過 500 萬，或超過 1 萬筆個資外洩」，不然每個人的 5 都不一樣。</li>
<li><b>評估</b>：拿分析結果跟準則比，排出先後。</li>
<li><b>處理</b>：降低、轉移、避免、接受四選一（上一課的表），寫成風險處理計畫：做什麼、誰做、何時完成。</li>
<li><b>接受</b>：處理後的殘餘風險，由風險負責人正式接受。不能接受，就回去再處理一輪。</li>
</ol>

<h3><span class="badge lv2">進階</span>三、ISO/IEC 27001 白話拆解</h3>
<p>ISO 27001 常被誤會成一份「資安檢查清單」。它其實分成兩半：<b>本文的第 4 到 10 章</b>規定你要怎麼「管理」資安（每一條都是必須做到的），<b>附錄 A</b> 列出 93 項可以選用的控制措施。</p>
<figure class="figure"><svg viewBox="0 0 680 300" class="fg" style="width:100%;max-width:680px" role="img" aria-label="ISO 27001 的結構：第 4 到 10 章對應規劃、執行、檢查、行動的循環；第 6 章的風險處理產生適用性聲明書，逐一對照附錄 A 的四大類 93 項控制措施">
<text x="170" y="26" text-anchor="middle" class="fg-t sm acc">本文：一定要做到</text>
<text x="45" y="114" text-anchor="middle" class="fg-t lg">P</text>
<text x="45" y="204" text-anchor="middle" class="fg-t lg">D</text>
<text x="45" y="240" text-anchor="middle" class="fg-t lg">C</text>
<text x="45" y="276" text-anchor="middle" class="fg-t lg">A</text>
<path d="M36 280 H24 V56 H30" class="fg-l dash"/><polygon points="38,56 30,51.5 30,60.5" class="fg-a"/>
<rect x="70" y="40" width="200" height="30" rx="5" class="fg-b"/><text x="80" y="60" class="fg-t">4 組織處境</text><text x="262" y="60" text-anchor="end" class="fg-t sm">範圍、利害關係人</text>
<rect x="70" y="76" width="200" height="30" rx="5" class="fg-b"/><text x="80" y="96" class="fg-t">5 領導</text><text x="262" y="96" text-anchor="end" class="fg-t sm">政策、角色責任</text>
<rect x="70" y="112" width="200" height="30" rx="5" class="fg-b hot"/><text x="80" y="132" class="fg-t">6 規劃</text><text x="262" y="132" text-anchor="end" class="fg-t sm">風險評鑑與處理</text>
<rect x="70" y="148" width="200" height="30" rx="5" class="fg-b"/><text x="80" y="168" class="fg-t">7 支援</text><text x="262" y="168" text-anchor="end" class="fg-t sm">人力、能力、文件</text>
<rect x="70" y="184" width="200" height="30" rx="5" class="fg-b"/><text x="80" y="204" class="fg-t">8 運作</text><text x="262" y="204" text-anchor="end" class="fg-t sm">照計畫執行</text>
<rect x="70" y="220" width="200" height="30" rx="5" class="fg-b"/><text x="80" y="240" class="fg-t">9 績效評估</text><text x="262" y="240" text-anchor="end" class="fg-t sm">內部稽核、審查</text>
<rect x="70" y="256" width="200" height="30" rx="5" class="fg-b"/><text x="80" y="276" class="fg-t">10 改善</text><text x="262" y="276" text-anchor="end" class="fg-t sm">矯正措施</text>
<path d="M270 127 H288 V150 H302" class="fg-l on"/><polygon points="310,150 302,145.5 302,154.5" class="fg-a on"/>
<rect x="310" y="110" width="110" height="80" rx="6" class="fg-b hot"/><text x="365" y="134" text-anchor="middle" class="fg-t acc">適用性聲明書</text><text x="365" y="154" text-anchor="middle" class="fg-t sm">SoA</text><text x="365" y="174" text-anchor="middle" class="fg-t sm">93 項逐一交代</text>
<line x1="420" y1="150" x2="440" y2="150" class="fg-l on"/><polygon points="448,150 440,145.5 440,154.5" class="fg-a on"/>
<line x1="450" y1="44" x2="450" y2="266" class="fg-l on"/>
<text x="565" y="26" text-anchor="middle" class="fg-t sm acc">附錄 A：93 項控制措施</text>
<rect x="460" y="40" width="210" height="50" rx="6" class="fg-b alt"/><text x="472" y="60" class="fg-t">組織面 37 項</text><text x="472" y="80" class="fg-t sm">政策、供應商、事件管理</text>
<rect x="460" y="100" width="210" height="50" rx="6" class="fg-b alt"/><text x="472" y="120" class="fg-t">人員面 8 項</text><text x="472" y="140" class="fg-t sm">背景查核、教育訓練</text>
<rect x="460" y="160" width="210" height="50" rx="6" class="fg-b alt"/><text x="472" y="180" class="fg-t">實體面 14 項</text><text x="472" y="200" class="fg-t sm">門禁、設備、桌面淨空</text>
<rect x="460" y="220" width="210" height="50" rx="6" class="fg-b alt"/><text x="472" y="240" class="fg-t">技術面 34 項</text><text x="472" y="260" class="fg-t sm">存取、加密、日誌、備份</text>
</svg><figcaption>左邊是管理的骨架，一條都不能少；右邊是工具箱，依風險挑選。中間的適用性聲明書把兩邊接起來：每一項控制措施用或不用、為什麼，都要寫清楚。</figcaption></figure>
<table>
<tr><th>章</th><th>白話在要求什麼</th><th>稽核員會要看的東西</th></tr>
<tr><td>4 組織處境</td><td>你是誰、誰在乎你的資安、範圍畫在哪</td><td>範圍文件、利害關係人與其要求</td></tr>
<tr><td>5 領導</td><td>老闆要參與，不是丟給資安團隊</td><td>經核准的資安政策、角色與責任</td></tr>
<tr><td>6 規劃</td><td>風險評鑑、風險處理、資安目標</td><td>風險評鑑結果、處理計畫、適用性聲明書</td></tr>
<tr><td>7 支援</td><td>有人、有能力、有意識、有文件</td><td>訓練紀錄、能力證明、文件管制</td></tr>
<tr><td>8 運作</td><td>照著計畫真的做</td><td>風險處理的執行紀錄</td></tr>
<tr><td>9 績效評估</td><td>量測、內部稽核、管理審查</td><td>監控結果、內部稽核報告、管理審查紀錄</td></tr>
<tr><td>10 改善</td><td>出錯了怎麼找根因、怎麼修</td><td>不符合事項與矯正措施的紀錄</td></tr>
</table>
<p>附錄 A 在 2022 年版從 114 項重整成 93 項，分成組織、人員、實體、技術四類，並新增了 11 項，例如威脅情資、使用雲端服務的資安、組態管理、資料遮罩、資料外洩防護、監控活動、安全程式設計。每一項怎麼做，寫在姊妹標準 <b>ISO/IEC 27002</b> 裡。舊的 2013 年版證書，轉換期已在 2025 年 10 月底結束。</p>
<h4>適用性聲明書（Statement of Applicability，SoA）</h4>
<p>它是一張 93 列的表，每一列回答四件事：這項控制措施需不需要、為什麼、是否已經實施、如果排除是為什麼。例如：</p>
<table>
<tr><th>控制措施</th><th>適用</th><th>理由</th><th>狀態</th></tr>
<tr><td>A.8.28 安全程式設計</td><td>是</td><td>自行開發遊戲平台（對應風險 R7、R9）</td><td>已實施：程式碼審查＋SAST</td></tr>
<tr><td>A.7.4 實體安全監控</td><td>是</td><td>辦公室有存放開發設備</td><td>已實施：門禁與監視器</td></tr>
<tr><td>A.8.11 資料遮罩</td><td>是</td><td>測試環境會用到玩家資料（風險 R12）</td><td>實施中，預計第 2 季完成</td></tr>
</table>
<p>稽核員常從 SoA 開始，挑幾列往回追：「你說 A.8.28 已實施，給我看最近三次的程式碼審查紀錄。」所以 SoA 寫的每一句，都要拿得出證據。</p>

<h3><span class="badge lv2">進階</span>四、SOC 2 與 PCI DSS：一個賣給美國客戶，一個為了刷卡</h3>
<table>
<tr><th></th><th>ISO/IEC 27001</th><th>SOC 2</th><th>PCI DSS</th></tr>
<tr><td>是什麼</td><td>管理系統的國際標準</td><td>會計師對服務商控制措施的鑑證報告</td><td>支付卡產業的資料安全標準</td></tr>
<tr><td>誰訂的</td><td>ISO 與 IEC</td><td>美國會計師協會（AICPA）</td><td>PCI 安全標準委員會（由各大卡組織成立）</td></tr>
<tr><td>結果的形式</td><td>證書，效期 3 年</td><td>一份報告，沒有「通過證書」</td><td>合規報告或自評問卷，加上合規聲明</td></tr>
<tr><td>誰會要求</td><td>台灣、歐洲、日本的客戶與政府</td><td>美國的企業客戶</td><td>收單銀行與卡組織</td></tr>
</table>
<h4>SOC 2</h4>
<p>由會計師事務所依 AICPA 的信任服務準則（Trust Services Criteria）查核，共五類：<b>安全</b>（必選）、可用性、處理完整性、機密性、隱私，其他四類依服務性質選擇。報告分兩型：<b>Type I</b> 看某一天的控制措施<b>設計</b>得對不對；<b>Type II</b> 看一段觀察期（通常 3 到 12 個月）裡，控制措施是不是<b>一直有在運作</b>。美國客戶要的幾乎都是 Type II。</p>
<p>拿到供應商的 SOC 2 報告時，要特別看「互補性用戶控制」（complementary user entity controls）：供應商寫明「這些事要由客戶自己做」，例如「客戶要自行替帳號開啟 MFA」。你沒做，報告再漂亮也沒用。</p>
<h4>PCI DSS</h4>
<p>目前的版本是 4.0.1（4.0 在 2022 年發布，舊的 3.2.1 在 2024 年 3 月退場，4.0 裡標為「未來生效」的要求從 2025 年 3 月 31 日起強制）。它有 12 大要求，例如網路安全控制、安全設定、保護儲存的卡片資料、傳輸加密、防惡意程式、安全開發、依需要授權、身分驗證、實體存取、記錄與監控所有存取、定期測試、組織政策。</p>
<p>PCI DSS 最重要的概念是<b>範圍</b>：所有儲存、處理、傳輸卡片資料的系統，以及連得到它們的系統，都在範圍內。範圍越大，要做的事越多。所以最聰明的做法是<b>縮小範圍</b>：用金流商的代管付款頁或 iframe，讓卡號根本不經過你的伺服器。完全外包時，你通常只要填最簡單的自評問卷（SAQ A），而不是對整個平台做 12 大要求。這正是上一課「避免」那一種風險處理的實例。</p>

<h3><span class="badge lv3">專業</span>五、政策、標準、程序：文件的金字塔</h3>
<p>很多公司的資安文件寫成一大本，什麼都混在一起：經營理念旁邊寫著密碼長度，密碼長度旁邊寫著點哪個按鈕。結果改一個按鈕，就要整本重新給董事會核准。分層就是為了解決這件事：</p>
<figure class="figure"><svg viewBox="0 0 680 256" class="fg" style="width:100%;max-width:680px" role="img" aria-label="文件金字塔：最上層政策、往下是標準、程序，最底層是紀錄與佐證；右邊以多因素驗證為例，各層各寫一句">
<polygon points="150,20 230,20 265,76 115,76" class="fg-b hot"/><text x="190" y="46" text-anchor="middle" class="fg-t acc">政策</text><text x="190" y="64" text-anchor="middle" class="fg-t sm">要達成什麼</text>
<polygon points="115,76 265,76 300,132 80,132" class="fg-b alt"/><text x="190" y="102" text-anchor="middle" class="fg-t">標準</text><text x="190" y="120" text-anchor="middle" class="fg-t sm">量得到的規定</text>
<polygon points="80,132 300,132 335,188 45,188" class="fg-b"/><text x="190" y="158" text-anchor="middle" class="fg-t">程序</text><text x="190" y="176" text-anchor="middle" class="fg-t sm">一步一步怎麼做</text>
<polygon points="45,188 335,188 370,244 10,244" class="fg-b warm"/><text x="190" y="214" text-anchor="middle" class="fg-t">紀錄與佐證</text><text x="190" y="232" text-anchor="middle" class="fg-t sm">證明真的有做</text>
<text x="535" y="16" text-anchor="middle" class="fg-t sm acc">以多因素驗證為例</text>
<rect x="400" y="26" width="270" height="44" rx="6" class="fg-b"/><text x="412" y="53" class="fg-t sm">所有管理存取都要多因素驗證</text>
<rect x="400" y="82" width="270" height="44" rx="6" class="fg-b"/><text x="412" y="109" class="fg-t sm">管理員用 FIDO2 硬體金鑰；不接受簡訊</text>
<rect x="400" y="138" width="270" height="44" rx="6" class="fg-b"/><text x="412" y="165" class="fg-t sm">新管理員第一天：領金鑰、註冊、測試</text>
<rect x="400" y="194" width="270" height="44" rx="6" class="fg-b"/><text x="412" y="221" class="fg-t sm">每月自動匯出 MFA 註冊報表存檔</text>
<line x1="255" y1="48" x2="400" y2="48" class="fg-l dim dash"/>
<line x1="290" y1="104" x2="400" y2="104" class="fg-l dim dash"/>
<line x1="325" y1="160" x2="400" y2="160" class="fg-l dim dash"/>
<line x1="360" y1="216" x2="400" y2="216" class="fg-l dim dash"/>
</svg><figcaption>越往上越穩定、核准層級越高；越往下越常改、越貼近技術。最底層的紀錄不是「文件」，卻是稽核時唯一能證明上面三層不是空話的東西。</figcaption></figure>
<table>
<tr><th>層</th><th>誰核准</th><th>多久改一次</th><th>寫錯的徵兆</th></tr>
<tr><td><b>政策</b>（policy）</td><td>經營階層</td><td>每年審一次，很少大改</td><td>出現產品名稱或版本號</td></tr>
<tr><td><b>標準</b>（standard）</td><td>資安主管</td><td>技術變了就改</td><td>寫「應適當」「盡量」，量不出來</td></tr>
<tr><td><b>程序</b>（procedure）</td><td>負責的團隊</td><td>隨時</td><td>新人照著做還是做不出來</td></tr>
<tr><td><b>指引</b>（guideline）</td><td>負責的團隊</td><td>隨時</td><td>被當成強制規定</td></tr>
</table>
<p>指引是「建議」，不強制，例如「建議使用密碼管理器」。標準是「規定」，違反就是不符合。這個差別在稽核時很要緊：你寫成標準的東西，稽核員就會要你證明每一次都做到。</p>

<h3><span class="badge lv3">專業</span>六、佐證資料與合規即程式碼</h3>
<p>稽核員不會把所有紀錄看完，而是<b>抽樣</b>：先要一份「母體」（例如這段期間的所有正式環境變更），再從裡面隨機抽幾筆，一筆一筆檢查。抽樣數量依控制措施執行的頻率而定，每天發生很多次的，常見是抽二、三十筆。</p>
<figure class="figure"><svg viewBox="0 20 680 230" class="fg" style="width:100%;max-width:680px" role="img" aria-label="稽核抽樣：控制措施「變更都要審核」，從期間內 412 筆變更的母體隨機抽樣 25 筆，每筆檢查是否有別人核准、CI 通過、由管線部署，發現 1 筆例外">
<rect x="10" y="90" width="150" height="60" rx="6" class="fg-b alt"/><text x="85" y="114" text-anchor="middle" class="fg-t sm alt">控制措施</text><text x="85" y="136" text-anchor="middle" class="fg-t">變更都要審核</text>
<line x1="160" y1="120" x2="192" y2="120" class="fg-l"/><polygon points="200,120 192,115.5 192,124.5" class="fg-a"/>
<rect x="200" y="30" width="170" height="180" rx="6" class="fg-b"/>
<text x="285" y="52" text-anchor="middle" class="fg-t sm">母體：期間內 412 筆變更</text>
<rect x="215" y="64" width="10" height="10" class="fg-b"/><rect x="229" y="64" width="10" height="10" class="fg-b hot"/><rect x="243" y="64" width="10" height="10" class="fg-b"/><rect x="257" y="64" width="10" height="10" class="fg-b"/><rect x="271" y="64" width="10" height="10" class="fg-b"/><rect x="285" y="64" width="10" height="10" class="fg-b"/><rect x="299" y="64" width="10" height="10" class="fg-b hot"/><rect x="313" y="64" width="10" height="10" class="fg-b"/><rect x="327" y="64" width="10" height="10" class="fg-b"/><rect x="341" y="64" width="10" height="10" class="fg-b"/>
<rect x="215" y="78" width="10" height="10" class="fg-b"/><rect x="229" y="78" width="10" height="10" class="fg-b"/><rect x="243" y="78" width="10" height="10" class="fg-b"/><rect x="257" y="78" width="10" height="10" class="fg-b hot"/><rect x="271" y="78" width="10" height="10" class="fg-b"/><rect x="285" y="78" width="10" height="10" class="fg-b"/><rect x="299" y="78" width="10" height="10" class="fg-b"/><rect x="313" y="78" width="10" height="10" class="fg-b"/><rect x="327" y="78" width="10" height="10" class="fg-b warm"/><rect x="341" y="78" width="10" height="10" class="fg-b"/>
<rect x="215" y="92" width="10" height="10" class="fg-b"/><rect x="229" y="92" width="10" height="10" class="fg-b"/><rect x="243" y="92" width="10" height="10" class="fg-b hot"/><rect x="257" y="92" width="10" height="10" class="fg-b"/><rect x="271" y="92" width="10" height="10" class="fg-b"/><rect x="285" y="92" width="10" height="10" class="fg-b"/><rect x="299" y="92" width="10" height="10" class="fg-b"/><rect x="313" y="92" width="10" height="10" class="fg-b hot"/><rect x="327" y="92" width="10" height="10" class="fg-b"/><rect x="341" y="92" width="10" height="10" class="fg-b"/>
<rect x="215" y="106" width="10" height="10" class="fg-b"/><rect x="229" y="106" width="10" height="10" class="fg-b"/><rect x="243" y="106" width="10" height="10" class="fg-b"/><rect x="257" y="106" width="10" height="10" class="fg-b"/><rect x="271" y="106" width="10" height="10" class="fg-b hot"/><rect x="285" y="106" width="10" height="10" class="fg-b"/><rect x="299" y="106" width="10" height="10" class="fg-b"/><rect x="313" y="106" width="10" height="10" class="fg-b"/><rect x="327" y="106" width="10" height="10" class="fg-b"/><rect x="341" y="106" width="10" height="10" class="fg-b hot"/>
<rect x="215" y="120" width="10" height="10" class="fg-b hot"/><rect x="229" y="120" width="10" height="10" class="fg-b"/><rect x="243" y="120" width="10" height="10" class="fg-b"/><rect x="257" y="120" width="10" height="10" class="fg-b"/><rect x="271" y="120" width="10" height="10" class="fg-b"/><rect x="285" y="120" width="10" height="10" class="fg-b"/><rect x="299" y="120" width="10" height="10" class="fg-b hot"/><rect x="313" y="120" width="10" height="10" class="fg-b"/><rect x="327" y="120" width="10" height="10" class="fg-b"/><rect x="341" y="120" width="10" height="10" class="fg-b"/>
<rect x="215" y="134" width="10" height="10" class="fg-b"/><rect x="229" y="134" width="10" height="10" class="fg-b"/><rect x="243" y="134" width="10" height="10" class="fg-b"/><rect x="257" y="134" width="10" height="10" class="fg-b hot"/><rect x="271" y="134" width="10" height="10" class="fg-b"/><rect x="285" y="134" width="10" height="10" class="fg-b"/><rect x="299" y="134" width="10" height="10" class="fg-b"/><rect x="313" y="134" width="10" height="10" class="fg-b"/><rect x="327" y="134" width="10" height="10" class="fg-b"/><rect x="341" y="134" width="10" height="10" class="fg-b hot"/>
<text x="285" y="172" text-anchor="middle" class="fg-t sm">綠＝抽到，橘＝例外</text>
<text x="285" y="194" text-anchor="middle" class="fg-t sm">從 git 與 CI 自動匯出</text>
<line x1="370" y1="120" x2="412" y2="120" class="fg-l on"/><polygon points="420,120 412,115.5 412,124.5" class="fg-a on"/>
<text x="395" y="110" text-anchor="middle" class="fg-t sm">抽樣</text>
<rect x="420" y="30" width="250" height="180" rx="6" class="fg-b"/>
<text x="434" y="52" class="fg-t sm acc">抽 25 筆，每一筆都檢查：</text>
<text x="434" y="80" class="fg-t">1. PR 有別人核准</text>
<text x="434" y="106" class="fg-t">2. CI 測試通過</text>
<text x="434" y="132" class="fg-t">3. 由管線部署</text>
<text x="434" y="166" class="fg-t warm">例外：1 筆緊急修補</text>
<text x="434" y="188" class="fg-t sm warm">事後才補核准，要有說明</text>
<text x="340" y="238" text-anchor="middle" class="fg-t sm">佐證資料如果是系統自動產生的，抽到哪一筆都拿得出來</text>
</svg><figcaption>母體一定要完整：稽核員會問「你怎麼證明這 412 筆就是全部？」從 git 和 CI 直接匯出的清單，比任何人工整理的表格都可信。</figcaption></figure>
<p>工程師在這裡的價值很大。如果存取權透過 PR 申請、部署只能走管線、基礎設施寫在 git，那麼「誰在什麼時候改了什麼、誰核准的」本來就記錄在系統裡，抽到哪一筆都能在一分鐘內拿出來。這就是<b>合規即程式碼</b>（compliance as code）的第一層：<b>讓流程本身就留下證據</b>。</p>
<p>第二層是<b>讓檢查本身變成程式</b>：與其每季人工檢查一次「所有容器都不能用 root 執行」，不如在 CI 裡自動擋下。第 2.5 課 IaC 的深入圖解講過政策即程式碼；用 Open Policy Agent 的 Rego 寫，大概是這樣：</p>
<pre><code>package main

import rego.v1

deny contains msg if {
  input.kind == "Deployment"
  not input.spec.template.spec.securityContext.runAsNonRoot
  name := input.metadata.name
  msg := sprintf("%s 必須設定 runAsNonRoot", [name])
}</code></pre>
<p>這條規則在每一次合併前跑。稽核時你交出的不是「我們有檢查」的截圖，而是「規則本身、它的版本歷史，以及這段期間每一次執行的結果」。</p>
<p>第三層是<b>持續監控</b>：排程每天或每月自動匯出重要的狀態（沒開 MFA 的帳號、對外開放的儲存桶、超過 90 天沒輪替的金鑰），存到不能修改的儲存空間。市面上也有 GRC 自動化平台專做這件事，接上雲端和身分系統之後自動收集佐證。NIST 還訂了一種機器可讀的控制措施格式 OSCAL，讓這些資料能在不同工具之間交換。</p>

<h3><span class="badge lv3">專業</span>七、第三方風險與營運持續</h3>
<h4>你的資安，也取決於你的供應商</h4>
<p>近年很多重大事件，入口都不在受害者自己身上：2020 年 SolarWinds 的更新程式被植入後門，數千個客戶跟著中招；2023 年 MOVEit 檔案傳輸軟體的漏洞，讓大量企業的資料外洩；2024 年一批 Snowflake 客戶的資料被偷，原因是那些客戶帳號沒開 MFA、憑證又早已外洩。第三方風險管理（third-party risk management）的流程是：</p>
<table>
<tr><th>步驟</th><th>做什麼</th></tr>
<tr><td>盤點</td><td>列出所有供應商與 SaaS，包括各部門自己刷卡買的</td></tr>
<tr><td>分級</td><td>依「碰到什麼資料」和「停了會怎樣」分級。拿得到玩家個資或正式環境權限的是第一級</td></tr>
<tr><td>審查</td><td>依等級決定深度：第一級要看 SOC 2 Type II 或 ISO 27001 證書與範圍、填問卷；低等級簡單確認即可</td></tr>
<tr><td>合約</td><td>寫進資安條款：事件發生後幾小時內通知、可稽核權、資料存放地點、再委外要告知、終止時刪除資料</td></tr>
<tr><td>持續監控</td><td>每年重審；證書或報告到期要追；有重大新聞就重評</td></tr>
<tr><td>退場</td><td>停用帳號與整合、收回或確認刪除資料</td></tr>
</table>
<p>看供應商的 SOC 2 報告，五分鐘內先確認五件事：範圍有沒有包含你用的那個服務；觀察期是不是最近；會計師的意見有沒有保留；測試結果裡有沒有例外；以及有哪些互補性用戶控制要你自己做。報告的觀察期和今天之間有空檔時，可以要求供應商出具一份說明期間內沒有重大變化的「銜接函」（bridge letter）。</p>
<h4>營運持續：先做營運衝擊分析</h4>
<p>營運持續管理的國際標準是 ISO 22301。它的起點是<b>營運衝擊分析</b>（business impact analysis，BIA）：一項一項業務問「停多久，公司就受不了？」這個時間叫<b>最大可容忍中斷時間</b>（maximum tolerable period of disruption，MTPD）。技術的 RTO 一定要比它短，中間的差距就是你的安全餘裕。以「猜高低」遊戲平台為例：</p>
<table>
<tr><th>業務</th><th>MTPD</th><th>RTO</th><th>RPO</th><th>依賴</th></tr>
<tr><td>玩家登入與遊戲</td><td>4 小時</td><td>1 小時</td><td>5 分鐘</td><td>資料庫、身分系統、CDN</td></tr>
<tr><td>儲值與金流</td><td>4 小時</td><td>1 小時</td><td>0（不能掉交易）</td><td>金流商、資料庫</td></tr>
<tr><td>客服</td><td>1 天</td><td>8 小時</td><td>1 天</td><td>客服系統（SaaS）、人員</td></tr>
<tr><td>營運報表</td><td>3 天</td><td>1 天</td><td>1 天</td><td>資料倉儲</td></tr>
</table>
<p>RTO、RPO 和災難復原的技術做法，第 4.5 課的深入圖解已經講過；那是營運持續計畫裡「IT 復原」的那一塊。營運持續計畫還要涵蓋 IT 以外的東西：關鍵人員找不到人時誰代理、辦公室不能進時怎麼工作、主要供應商倒了有沒有替代方案、危機時誰對外發言。而且一樣要演練。</p>

<h3><span class="badge lv4">專家</span>八、一場稽核實際上怎麼跑</h3>
<figure class="figure"><svg viewBox="0 28 680 194" class="fg" style="width:100%;max-width:680px" role="img" aria-label="稽核時間軸：ISO 27001 的第一階段、第二階段、取得證書後第一年與第二年監督稽核、第三年重新驗證；SOC 2 Type I 看某一天，Type II 看三到十二個月的觀察期再出報告">
<text x="10" y="74" class="fg-t">ISO 27001</text>
<text x="250" y="44" text-anchor="middle" class="fg-t sm acc">取得證書（效期 3 年）</text>
<line x1="100" y1="70" x2="656" y2="70" class="fg-l"/><polygon points="664,70 656,65.5 656,74.5" class="fg-a"/>
<circle cx="130" cy="70" r="6" class="fg-lamp on"/><circle cx="210" cy="70" r="6" class="fg-lamp on"/><circle cx="250" cy="70" r="7" class="fg-b hot"/><circle cx="380" cy="70" r="6" class="fg-lamp on"/><circle cx="500" cy="70" r="6" class="fg-lamp on"/><circle cx="630" cy="70" r="6" class="fg-lamp on"/>
<line x1="250" y1="50" x2="250" y2="60" class="fg-l on"/>
<text x="130" y="96" text-anchor="middle" class="fg-t sm">第一階段</text><text x="130" y="112" text-anchor="middle" class="fg-t sm">文件審查</text>
<text x="210" y="96" text-anchor="middle" class="fg-t sm">第二階段</text><text x="210" y="112" text-anchor="middle" class="fg-t sm">實際運作</text>
<text x="380" y="96" text-anchor="middle" class="fg-t sm">監督稽核</text><text x="380" y="112" text-anchor="middle" class="fg-t sm">第 1 年</text>
<text x="500" y="96" text-anchor="middle" class="fg-t sm">監督稽核</text><text x="500" y="112" text-anchor="middle" class="fg-t sm">第 2 年</text>
<text x="630" y="96" text-anchor="middle" class="fg-t sm">重新驗證</text><text x="630" y="112" text-anchor="middle" class="fg-t sm">第 3 年</text>
<line x1="10" y1="130" x2="670" y2="130" class="fg-l dim dash"/>
<text x="10" y="174" class="fg-t">SOC 2</text>
<text x="180" y="152" text-anchor="middle" class="fg-t sm alt">Type I：某一天的設計</text>
<line x1="100" y1="170" x2="656" y2="170" class="fg-l"/><polygon points="664,170 656,165.5 656,174.5" class="fg-a"/>
<circle cx="180" cy="170" r="6" class="fg-lamp on"/>
<rect x="300" y="162" width="260" height="16" rx="4" class="fg-b alt"/>
<text x="430" y="152" text-anchor="middle" class="fg-t sm alt">Type II：觀察期 3～12 個月</text>
<circle cx="610" cy="170" r="6" class="fg-lamp on"/>
<text x="610" y="198" text-anchor="middle" class="fg-t sm">出報告</text>
<text x="430" y="198" text-anchor="middle" class="fg-t sm">整段期間都要有運作紀錄</text>
</svg><figcaption>ISO 27001 是「證書＋每年回來看」；SOC 2 Type II 是「看一整段期間的錄影」。兩者都意味著：稽核不是一次性的考試，而是每天的工作有沒有留下紀錄。</figcaption></figure>
<p>先分清楚兩個詞：<b>驗證</b>（certification）是驗證機構（例如 BSI、SGS、TÜV 這類公司）檢查你、發證書；<b>認證</b>（accreditation）是認證機構（台灣是全國認證基金會 TAF）檢查驗證機構有沒有資格發證書。看到一張證書，可以確認發證的單位有沒有被認證。</p>
<p>ISO 27001 的驗證分兩階段：<b>第一階段</b>看文件準備好了沒（範圍、政策、風險評鑑、SoA、內部稽核、管理審查都要有），<b>第二階段</b>到現場看是不是真的照著做。一個典型的稽核日：</p>
<ol>
<li><b>起始會議</b>：確認範圍、行程、要訪談誰。</li>
<li><b>文件與紀錄審查</b>：從 SoA 和風險登錄表挑項目往回追。</li>
<li><b>訪談</b>：問工程師「你們怎麼部署？」「有人離職時帳號怎麼處理？」，再要你當場打開系統給他看。</li>
<li><b>抽樣</b>：像上一節那樣，從母體抽樣檢查。</li>
<li><b>結束會議</b>：宣布發現事項。</li>
</ol>
<p>發現事項分三級：<b>主要不符合</b>（major nonconformity，某項要求根本沒做，或系統性地失效）在發證前必須矯正完成；<b>次要不符合</b>（minor，個別的疏漏）要提出矯正計畫，下次稽核確認；<b>觀察事項</b>（observation）是建議，不強制。最常被開的不符合：帳號權限審查沒有按時做、離職同仁的帳號離職好幾週後還開著、備份從來沒有做過還原測試、風險登錄表一年沒更新、政策沒有每年審查。</p>
<p>被訪談時的三個原則：<b>不要說謊、不要猜</b>，不知道就說「我確認後回覆您」；<b>只回答被問的問題</b>，不要主動延伸到你不熟的範圍；<b>拿出系統裡的紀錄</b>，而不是口頭描述。稽核員不是敵人，他的報告其實是你跟老闆要資源最好的依據。</p>

<h3><span class="badge lv4">專家</span>九、台灣的法規環境</h3>
<p>以下是一般性的說明，不是法律意見。法規會修正，實際適用時請查全國法規資料庫的最新條文，並請法務或律師確認。</p>
<ul>
<li><b>個人資料保護法</b>：幾乎所有企業都適用。除了上一課說的外洩通知，它要求非公務機關對保有的個資「採行適當之安全措施」，許多產業的主管機關也據此訂了個資安全維護辦法，要求訂定計畫、定期檢查。2023 年修法大幅提高了沒做好安全措施的罰鍰，情節重大的可罰到新台幣 1,500 萬元，並推動成立獨立的個人資料保護委員會。</li>
<li><b>資通安全管理法</b>：適用於公務機關和特定非公務機關。機關依重要性分成 A 到 E 級的資通安全責任等級，等級越高，要求越多：導入 ISMS 並通過第三方驗證、配置資安專職人員、定期做弱點掃描、滲透測試、資安健診，以及資安監控。它也規定機關委外時要監督受託者，所以<b>替政府做系統的民間廠商</b>，常常會在合約裡被要求符合相關規定。</li>
<li><b>金融與上市櫃公司</b>：金管會對銀行、保險、證券業有專門的資安規範；上市櫃公司要依規模設置資安專責主管與人員，重大資安事件要發布重大訊息。</li>
<li><b>標準的在地版本</b>：台灣的國家標準 CNS 27001 對應 ISO/IEC 27001。政府機關與很多企業的 ISMS 驗證，都以此為依據。</li>
</ul>
<p>把這些放在一起看，就知道為什麼上一課說台灣很多資安職缺「一半工程、一半 GRC」：資安法和金融規範創造了大量 ISMS 導入、內部稽核、法遵檢查的工作。能同時看懂 Terraform 和 SoA 的人，在這個市場很少見。</p>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>ISO 27001 證書代表產品很安全</td><td>它驗證的是組織的管理系統，而且只在證書寫明的範圍內。要看範圍寫了什麼。</td></tr>
<tr><td>附錄 A 的 93 項全部都要做</td><td>依風險評鑑選擇，不適用的在 SoA 說明理由即可。但第 4 到 10 章每一條都必須做到。</td></tr>
<tr><td>SOC 2 是一張證書</td><td>它是會計師的鑑證報告，沒有「通過」或「證書」，要讀內容：範圍、期間、例外。</td></tr>
<tr><td>政策寫得越詳細越好</td><td>政策要短而穩定，細節放進標準和程序。政策裡寫版本號，每次升級都得重新核准。</td></tr>
<tr><td>合規是資安團隊的事</td><td>佐證資料大多來自工程流程。工程流程設計得好，合規幾乎不用額外花力氣。</td></tr>
<tr><td>風險接受就是不管它</td><td>風險接受是有人具名、知情、有期限的決定，到期要重看。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>後端（Node.js、Go）</b>：稽核最常抽的就是「變更管理」和「存取管理」。保護好主分支（必須審核、不能直接推）、部署只走管線，這兩件事你每天在做，就直接是控制措施的佐證。管理後台的操作日誌，也是個資法安全措施的一部分。</li>
<li><b>前端（Vue、TypeScript）</b>：如果你的網站有付款頁，PCI DSS 4.0 新增了對付款頁面腳本的盤點與竄改偵測要求。把卡號輸入交給金流商的代管頁面，是最省事的做法。</li>
<li><b>遊戲（Cocos、Unity）</b>：遊戲裡收集的玩家資料（暱稱、裝置識別碼、聊天紀錄、位置）都可能是個資。新增一個欄位前先問：真的需要嗎？保存多久？這就是個資法和 ISO 27001 隱私相關控制措施要的「資料最少化」。</li>
<li><b>Docker 與雲端伺服器</b>：資源一律打標籤（負責人、環境、資料等級）、基礎設施寫在 Terraform、設定規則放進 CI，你的雲端環境就自帶一半的稽核證據。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<p>資安 GRC、資安顧問、雲端資安的面試常出現下面這些題目，台灣的職缺尤其常問 ISO 27001。先自己講一遍，再打開參考答案。</p>
<ol>
<li>「說說 ISO 27001 的架構。適用性聲明書是什麼？」</li>
<li>「固有風險和殘餘風險有什麼不同？風險胃納由誰決定？」</li>
<li>「SOC 2 Type I 和 Type II 差在哪？你拿到供應商的 SOC 2 報告會看什麼？」</li>
<li>「怎麼縮小 PCI DSS 的範圍？」</li>
<li>「稽核員要你證明『所有正式環境變更都經過審核』，你會怎麼準備？」</li>
<li>「一家公司通過了 ISO 27001，還是被入侵了，為什麼？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>本文第 4 到 10 章是必須做到的管理要求：組織處境與範圍、領導、規劃（風險評鑑與處理、目標）、支援、運作、績效評估（監控、內部稽核、管理審查）、改善，大致對應規劃、執行、檢查、行動的循環。附錄 A 是 93 項控制措施，分組織、人員、實體、技術四類，依風險評鑑選用。適用性聲明書是風險處理的產出，逐一列出每項控制措施是否適用、理由、實施狀態與排除理由，稽核員常從它開始往回追證據。</li>
<li>固有風險是尚未採取控制措施時的風險，殘餘風險是採取控制措施後剩下的風險。殘餘風險不會是零，必須由風險負責人正式接受。風險胃納是組織願意承擔的風險程度，由經營階層決定，並寫進風險準則，決定哪些風險一定要處理。</li>
<li>Type I 評估某一個時間點的控制措施設計是否適當；Type II 評估一段觀察期（通常 3 到 12 個月）內控制措施是否持續有效運作，客戶通常要求 Type II。我會看：範圍是否包含我用的服務、觀察期是否夠新、會計師意見有無保留、測試是否有例外及其說明、有哪些互補性用戶控制需要我方實施、有哪些次服務組織被排除，必要時要求銜接函。</li>
<li>讓卡片資料盡量不碰到自己的系統：使用金流商的代管付款頁或 iframe、用代碼化（tokenization）取代儲存卡號、不在日誌與資料庫保存卡號。再用網路分段把仍需處理卡片資料的系統隔離，讓連不到它們的系統不在範圍內。範圍越小，要符合的要求和要稽核的系統就越少。</li>
<li>先確保母體完整：從 git 平台和 CI 直接匯出期間內所有部署到正式環境的紀錄，並說明怎麼確認沒有管線以外的部署方式（例如沒有人有直接部署的權限）。每一筆都能連到 PR、核准者（且不是作者本人）、CI 結果和部署紀錄。緊急變更另有流程，要有事後補核准與說明。最好是平常就自動化存檔，而不是稽核前才整理。</li>
<li>因為 ISO 27001 驗證的是管理系統存在並運作，不保證控制措施足以擋住特定攻擊者。可能是範圍沒有涵蓋被入侵的系統、風險評鑑低估了某個威脅、控制措施設計了但執行品質不佳，或攻擊手法超出了當初的假設。合規是底線和紀錄，安全要靠在上面持續加強。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>把上一課練功題的風險登錄表，補上三個欄位：固有風險值、處理方式（四選一）、殘餘風險值。替其中風險值最高的一項，寫一段 ALE 計算，並寫出你的假設。</li>
<li>從 ISO 27001 附錄 A 挑三項你最熟的控制措施（例如日誌、備份、存取權限），各寫一列 SoA：是否適用、理由、目前狀態，以及稽核員來時你會拿出什麼證據。</li>
<li>把「所有正式環境的資料庫都要加密」這句話，拆成政策、標準、程序、紀錄四層，各寫一句。</li>
<li>你們要導入一個新的 SaaS 客服系統，會存玩家的 email 和對話紀錄。依本章的第三方風險流程，它屬於哪一級？你會要求哪些文件、合約裡要寫哪些條款？</li>
<li>替「猜高低」平台的「儲值與金流」寫一段營運衝擊分析：停 1 小時、4 小時、1 天，各會發生什麼事？你會把 MTPD 訂多少？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>例如「雲端 root 帳號被盜」：固有風險 3 × 5 = 15；處理方式是降低（root 只用硬體金鑰、平常不用 root、對 root 登入設警報）；殘餘風險 1 × 5 = 5，由技術長接受。ALE 範例：假設被盜一次的損失（停機、調查、資料外洩處理）是 500 萬元，處理前 ARO 估 0.1（十年一次），ALE 50 萬；處理後 ARO 估 0.01，ALE 5 萬；控制措施每年成本約 1 萬，明顯值得。重點是每個數字旁邊都寫出依據，例如「ARO 參考同業事件頻率與我方過去的釣魚演練結果」。</li>
<li>例如 A.8.15 日誌：適用；理由是要能偵測與調查未授權存取（對應風險登錄表的某幾項）；狀態是已實施，雲端稽核日誌集中到獨立帳號、保存一年；證據是 trail 的設定截圖或 IaC 程式碼、日誌儲存桶的保存政策、最近一次用日誌調查事件的紀錄。A.8.13 資訊備份：適用；證據是備份排程設定和最近一次還原測試的紀錄。A.5.18 存取權限：適用；證據是每季權限審查的紀錄與處理結果。</li>
<li>政策：「組織保有的機敏資料，在儲存時都必須受到保護。」標準：「正式環境資料庫必須啟用靜態加密，使用雲端金鑰管理服務的客戶自管金鑰，每年輪替。」程序：「建立新資料庫時，使用 Terraform 模組 db-encrypted，加密參數由模組強制開啟；不得在主控台手動建立。」紀錄：「每天由設定掃描工具匯出所有資料庫的加密狀態，存入不可修改的儲存桶；未加密者自動開單。」</li>
<li>它會存玩家個資和對話內容，屬於第一級（或至少是較高的等級）。要求：SOC 2 Type II 報告或 ISO 27001 證書（並確認範圍包含該服務）、資安問卷、資料存放地點、再委外（次處理者）清單、事件通知機制。合約條款：事件發生後的通知時限、可稽核權或提供報告的義務、資料只能用於提供服務、資料存放地點、更換次處理者要通知、合約終止時歸還或刪除資料並提供證明。另外要確認互補性用戶控制，例如我方要自己開 MFA、設定權限。</li>
<li>停 1 小時：玩家無法儲值，營收直接損失，客服開始收到抱怨，但多數玩家會稍後再試。停 4 小時：營收損失明顯，社群開始出現負面討論，可能有重複扣款或已扣款未入帳的爭議要人工處理。停 1 天：大量客訴、退款爭議、媒體與主管機關可能關注，信任受損會延續到之後。依此可以把 MTPD 訂在 4 小時，RTO 訂 1 小時以保留餘裕；RPO 必須是 0，交易一筆都不能掉，所以要靠金流商的交易紀錄對帳，作為最後的依據。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>ISO/IEC 27001 官方頁面</b>（<a href="https://www.iso.org/standard/27001">iso.org/standard/27001</a>）：標準本身要付費購買，但官方頁面有架構說明。台灣可以透過標準檢驗局購買對應的 CNS 27001。</li>
<li><b>NIST Cybersecurity Framework 2.0</b>（<a href="https://www.nist.gov/cyberframework">nist.gov/cyberframework</a>）：免費，治理、辨識、保護、偵測、應變、復原六大功能，是理解整個資安計畫最好的地圖。</li>
<li><b>PCI SSC 文件庫</b>（<a href="https://www.pcisecuritystandards.org/">pcisecuritystandards.org</a>）：PCI DSS 全文與各種自評問卷，可以免費下載。</li>
<li><b>CIS Controls</b>（<a href="https://www.cisecurity.org/controls">cisecurity.org/controls</a>）：18 組實務控制措施，並對應到 ISO 27001、NIST CSF 等框架，適合當成「控制措施要怎麼落地」的參考。</li>
<li><b>全國法規資料庫</b>（<a href="https://law.moj.gov.tw/">law.moj.gov.tw</a>）：個人資料保護法、資通安全管理法及其子法的最新條文，都以這裡為準。</li>
</ul>
` });
