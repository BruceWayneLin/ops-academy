DEEP({ 'mis-identity': `
<p>上一課給了結論：每一套系統都該信任同一個身分提供者，帳號從進來到離開都要有人管。這一章把那份「信任」拆開：四套常見產品差在哪裡；按下「用公司帳號登入」之後，SAML 和 OIDC 在瀏覽器裡來回跑了幾趟、每趟帶著什麼；SCIM 怎麼讓新進、調動、離職自動發生；權限照角色給還是照屬性算；管理員和緊急帳號怎麼設計；最後是攻擊者實際上怎麼偷走一個身分，哪些防線真的擋得住。</p>

<h3><span class="badge lv1">基礎</span>一、目錄服務和身分提供者：戶政事務所和護照</h3>
<p><b>目錄服務</b>（directory）是一本名冊：公司有哪些人、每個人在哪些群組、主管是誰、屬於哪個部門。它像戶政事務所的戶籍資料，回答「這個人存不存在、他是誰」。</p>
<p><b>身分提供者</b>（identity provider，IdP）是發證件的機關。外國海關不會打電話回台灣的戶政事務所查你，它看護照：一份它信任的機關簽發、有防偽、有期限的文件。身分提供者做的事一樣：你在它那裡證明自己（密碼加第二道驗證），它簽一張「這個人是 amy@example.com，屬於工程部」的證明交給應用程式，應用程式驗得過簽章就相信。</p>
<p>應用程式就是海關，術語叫<b>服務提供者</b>（service provider，SP；OIDC 裡叫 relying party，RP），它從沒看過你的密碼。這就是<b>單一登入</b>（single sign-on，SSO）真正的價值：密碼只在一個地方輸入、檢查、保護。</p>
<figure class="figure"><svg viewBox="0 0 660 280" class="fg" style="width:100%;max-width:660px" role="img" aria-label="左邊沒有身分提供者，員工在五套系統各有一組密碼；右邊有身分提供者，員工只登入一次，各系統都信任它發的簽章聲明">
<text x="160" y="24" text-anchor="middle" class="fg-t warm">沒有 IdP：每套系統各管各的</text>
<rect x="20" y="110" width="80" height="44" rx="6" class="fg-b"/>
<text x="60" y="137" text-anchor="middle" class="fg-t">員工</text>
<line x1="100" y1="132" x2="180" y2="56" class="fg-l"/>
<line x1="100" y1="132" x2="180" y2="98" class="fg-l"/>
<line x1="100" y1="132" x2="180" y2="140" class="fg-l"/>
<line x1="100" y1="132" x2="180" y2="182" class="fg-l"/>
<line x1="100" y1="132" x2="180" y2="224" class="fg-l"/>
<rect x="180" y="40" width="130" height="32" rx="5" class="fg-b"/><text x="192" y="61" class="fg-t sm">信箱</text><text x="298" y="61" text-anchor="end" class="fg-t sm warm">密碼 1</text>
<rect x="180" y="82" width="130" height="32" rx="5" class="fg-b"/><text x="192" y="103" class="fg-t sm">聊天</text><text x="298" y="103" text-anchor="end" class="fg-t sm warm">密碼 2</text>
<rect x="180" y="124" width="130" height="32" rx="5" class="fg-b"/><text x="192" y="145" class="fg-t sm">程式碼代管</text><text x="298" y="145" text-anchor="end" class="fg-t sm warm">密碼 3</text>
<rect x="180" y="166" width="130" height="32" rx="5" class="fg-b"/><text x="192" y="187" class="fg-t sm">雲端主控台</text><text x="298" y="187" text-anchor="end" class="fg-t sm warm">密碼 4</text>
<rect x="180" y="208" width="130" height="32" rx="5" class="fg-b"/><text x="192" y="229" class="fg-t sm">薪資系統</text><text x="298" y="229" text-anchor="end" class="fg-t sm warm">密碼 5</text>
<text x="160" y="266" text-anchor="middle" class="fg-t sm warm">離職那天：要記得去 5 個地方關帳號</text>
<line x1="330" y1="12" x2="330" y2="268" class="fg-l dim dash"/>
<text x="495" y="24" text-anchor="middle" class="fg-t acc">有 IdP：大家都信任同一個</text>
<rect x="345" y="110" width="64" height="44" rx="6" class="fg-b"/>
<text x="377" y="137" text-anchor="middle" class="fg-t">員工</text>
<text x="377" y="176" text-anchor="middle" class="fg-t sm">登入一次</text>
<line x1="409" y1="132" x2="427" y2="132" class="fg-l on"/><polygon points="435,132 427,127.5 427,136.5" class="fg-a on"/>
<rect x="435" y="96" width="104" height="72" rx="6" class="fg-b hot"/>
<text x="487" y="126" text-anchor="middle" class="fg-t acc">身分提供者</text>
<text x="487" y="146" text-anchor="middle" class="fg-t sm">密碼＋MFA</text>
<text x="487" y="196" text-anchor="middle" class="fg-t sm">發簽章聲明（SSO）</text>
<text x="487" y="214" text-anchor="middle" class="fg-t sm">推帳號變動（SCIM）</text>
<line x1="539" y1="132" x2="552" y2="132" class="fg-l on"/>
<line x1="552" y1="56" x2="552" y2="224" class="fg-l on"/>
<line x1="552" y1="56" x2="558" y2="56" class="fg-l on"/><polygon points="566,56 558,51.5 558,60.5" class="fg-a on"/>
<line x1="552" y1="98" x2="558" y2="98" class="fg-l on"/><polygon points="566,98 558,93.5 558,102.5" class="fg-a on"/>
<line x1="552" y1="140" x2="558" y2="140" class="fg-l on"/><polygon points="566,140 558,135.5 558,144.5" class="fg-a on"/>
<line x1="552" y1="182" x2="558" y2="182" class="fg-l on"/><polygon points="566,182 558,177.5 558,186.5" class="fg-a on"/>
<line x1="552" y1="224" x2="558" y2="224" class="fg-l on"/><polygon points="566,224 558,219.5 558,228.5" class="fg-a on"/>
<rect x="566" y="40" width="84" height="32" rx="5" class="fg-b"/><text x="608" y="61" text-anchor="middle" class="fg-t sm">信箱</text>
<rect x="566" y="82" width="84" height="32" rx="5" class="fg-b"/><text x="608" y="103" text-anchor="middle" class="fg-t sm">聊天</text>
<rect x="566" y="124" width="84" height="32" rx="5" class="fg-b"/><text x="608" y="145" text-anchor="middle" class="fg-t sm">程式碼代管</text>
<rect x="566" y="166" width="84" height="32" rx="5" class="fg-b"/><text x="608" y="187" text-anchor="middle" class="fg-t sm">雲端主控台</text>
<rect x="566" y="208" width="84" height="32" rx="5" class="fg-b"/><text x="608" y="229" text-anchor="middle" class="fg-t sm">薪資系統</text>
<text x="495" y="266" text-anchor="middle" class="fg-t sm acc">離職那天：在一個地方關一個開關</text>
</svg><figcaption>左邊每套系統各保管一份密碼，任何一套忘了關都是洞。右邊密碼只交給身分提供者，其他系統只收它簽過章的聲明。</figcaption></figure>
<p>右圖藏著兩種不同的箭頭：</p>
<ul>
<li><b>登入</b>（authentication）：每次進某套系統，它問「你是誰」。這是 SAML 和 OIDC 的工作（第三、四節）。</li>
<li><b>帳號開通</b>（provisioning）：第一次登入前先建好帳號、放進對的群組，人離開時停掉。這是 SCIM 的工作（第五節）。</li>
</ul>
<p>很多公司只做了前者：登入集中了，每套系統裡卻還躺著沒人停用的帳號，有些甚至允許用本機密碼繞過 SSO。缺一個，離職那天的開關就不是真的開關。</p>
<div class="note"><b>身分驗證和授權是兩件事。</b>身分提供者主要回答「你是誰」，順便附上群組；「工程部能不能刪正式資料庫」通常還是應用程式自己，或第六節的權限模型決定。</div>

<h3><span class="badge lv1">基礎</span>二、四套你一定會遇到的產品</h3>
<p>台灣的公司幾乎都落在下面四種之一，或兩種的組合。</p>
<h4>Active Directory：辦公室時代的老大哥</h4>
<p>Active Directory（AD）從 Windows 2000 Server 就有了，跑在公司自己的伺服器上，那幾台叫<b>網域控制站</b>（domain controller，DC）。Windows 電腦「加入網域」之後，開機登入就是去問 DC。它靠三個老東西：</p>
<ul>
<li><b>LDAP</b>（連接埠 389，加密版 636）：查名冊。很多老系統號稱「能用 AD 帳號登入」，其實是拿你輸入的帳密去對 DC 做一次 LDAP 驗證，密碼還是經過了那套系統的手。</li>
<li><b>Kerberos</b>（連接埠 88）：登入電腦、存取檔案伺服器的票券系統，第九節看它怎麼被攻擊。</li>
<li><b>群組原則</b>（Group Policy，GPO）：從 DC 把密碼規則、鎖螢幕時間這類設定推到每台電腦。</li>
</ul>
<p>AD 的世界觀是「大家都在同一棟辦公室的區域網路裡」。它本身不講 SAML 或 OIDC（要另外架 AD FS），也絕不該直接暴露在網際網路上。</p>
<h4>Microsoft Entra ID：雲端的身分提供者，不是雲端版的 AD</h4>
<p>Entra ID 在 2023 年以前叫 Azure AD，但它是另一套東西：在雲端、講 SAML、OIDC、OAuth 2.0 和 SCIM，沒有 OU 樹、沒有 GPO，電腦改成「加入 Entra」再交給 Intune（下一課）管。用 Microsoft 365 的公司都已經有一個 Entra ID 租用戶（tenant）。還有 AD 的公司通常裝 <b>Entra Connect</b>（或 Cloud Sync）把帳號同步上雲，叫<b>混合式身分</b>（hybrid identity）。</p>
<p>功能跟授權綁在一起：條件式存取要 P1，即時提權（PIM）和風險偵測要 P2 或 ID Governance。「為什麼沒開條件式存取」的真實答案，常常是授權費。</p>
<h4>Google Workspace 與 Okta</h4>
<p>用 Gmail 的公司，Google Workspace 就是目錄服務，也能當 SAML 身分提供者讓其他 SaaS 用公司帳號登入；從 AD 同步用 Google Cloud Directory Sync，條件式存取叫 Context-Aware Access，要高階方案才有。Okta 這一類（還有 OneLogin、JumpCloud）是獨立的身分提供者，賣點是中立和幾千個現成的 SAML、OIDC、SCIM 整合；信箱用 Google、開發卻在 Azure，或不想被任何一家辦公軟體綁死，就會選它。</p>
<figure class="figure"><svg viewBox="0 0 680 290" class="fg" style="width:100%;max-width:680px" role="img" aria-label="混合式身分：地端的網域控制站用 Kerberos 和 LDAP 服務 Windows 電腦與老系統，再透過 Entra Connect 把帳號同步到雲端的 Entra ID，雲端應用程式用 SAML、OIDC 登入、用 SCIM 開關帳號">
<rect x="10" y="30" width="220" height="250" rx="10" class="fg-b"/>
<text x="24" y="54" class="fg-t lg">地端（公司機房）</text>
<rect x="26" y="72" width="188" height="56" rx="6" class="fg-b alt"/>
<text x="120" y="95" text-anchor="middle" class="fg-t">網域控制站（DC）</text>
<text x="120" y="115" text-anchor="middle" class="fg-t sm">Active Directory</text>
<line x1="68" y1="190" x2="68" y2="136" class="fg-l"/><polygon points="68,128 63.5,136 72.5,136" class="fg-a"/>
<text x="74" y="164" class="fg-t sm mono">Kerberos</text>
<line x1="172" y1="190" x2="172" y2="136" class="fg-l"/><polygon points="172,128 167.5,136 176.5,136" class="fg-a"/>
<text x="178" y="164" class="fg-t sm mono">LDAP</text>
<rect x="26" y="190" width="84" height="50" rx="6" class="fg-b"/>
<text x="68" y="211" text-anchor="middle" class="fg-t">Windows</text>
<text x="68" y="229" text-anchor="middle" class="fg-t sm">加入網域</text>
<rect x="130" y="190" width="84" height="50" rx="6" class="fg-b"/>
<text x="172" y="211" text-anchor="middle" class="fg-t">老系統</text>
<text x="172" y="229" text-anchor="middle" class="fg-t sm">用 LDAP 查</text>
<text x="120" y="266" text-anchor="middle" class="fg-t sm">電腦和老系統直接問 DC</text>
<rect x="340" y="30" width="330" height="250" rx="10" class="fg-b"/>
<line x1="214" y1="100" x2="352" y2="100" class="fg-l on"/><polygon points="360,100 352,95.5 352,104.5" class="fg-a on"/>
<text x="285" y="90" text-anchor="middle" class="fg-t sm acc">同步帳號與群組</text>
<text x="285" y="118" text-anchor="middle" class="fg-t sm">Entra Connect</text>
<text x="354" y="54" class="fg-t lg">雲端</text>
<rect x="360" y="72" width="170" height="56" rx="6" class="fg-b hot"/>
<text x="445" y="95" text-anchor="middle" class="fg-t acc">Entra ID</text>
<text x="445" y="115" text-anchor="middle" class="fg-t sm">雲端身分提供者</text>
<text x="542" y="95" class="fg-t sm">SSO：SAML／OIDC</text>
<text x="542" y="115" class="fg-t sm">SCIM：開關帳號</text>
<line x1="445" y1="128" x2="445" y2="160" class="fg-l on"/>
<line x1="393" y1="160" x2="621" y2="160" class="fg-l on"/>
<line x1="393" y1="160" x2="393" y2="188" class="fg-l on"/><polygon points="393,196 388.5,188 397.5,188" class="fg-a on"/>
<line x1="469" y1="160" x2="469" y2="188" class="fg-l on"/><polygon points="469,196 464.5,188 473.5,188" class="fg-a on"/>
<line x1="545" y1="160" x2="545" y2="188" class="fg-l on"/><polygon points="545,196 540.5,188 549.5,188" class="fg-a on"/>
<line x1="621" y1="160" x2="621" y2="188" class="fg-l on"/><polygon points="621,196 616.5,188 625.5,188" class="fg-a on"/>
<rect x="360" y="196" width="66" height="44" rx="6" class="fg-b"/><text x="393" y="222" text-anchor="middle" class="fg-t sm">M365</text>
<rect x="436" y="196" width="66" height="44" rx="6" class="fg-b"/><text x="469" y="222" text-anchor="middle" class="fg-t sm">Slack</text>
<rect x="512" y="196" width="66" height="44" rx="6" class="fg-b"/><text x="545" y="222" text-anchor="middle" class="fg-t sm">GitHub</text>
<rect x="588" y="196" width="66" height="44" rx="6" class="fg-b"/><text x="621" y="222" text-anchor="middle" class="fg-t sm">AWS</text>
<text x="505" y="266" text-anchor="middle" class="fg-t sm">應用程式只認 Entra ID 的簽章</text>
</svg><figcaption>混合式身分是兩套系統，中間只靠一條同步線。那台跑同步的伺服器能改雲端所有人的身分，所以它跟 DC 一樣重要。</figcaption></figure>
<table>
<tr><th></th><th>Active Directory</th><th>Entra ID</th><th>Google Workspace</th><th>Okta</th></tr>
<tr><td>主要協定</td><td>LDAP、Kerberos、GPO</td><td>OIDC、SAML、OAuth、SCIM</td><td>SAML、OIDC</td><td>SAML、OIDC、SCIM</td></tr>
<tr><td>怎麼管電腦</td><td>加入網域＋GPO</td><td>加入 Entra＋Intune</td><td>內建的基本端點管理</td><td>不管電腦，搭配別家 MDM</td></tr>
<tr><td>常見於</td><td>有歷史的公司、工廠</td><td>用 Microsoft 365 的公司</td><td>新創、用 Gmail 的公司</td><td>多雲、想保持中立的公司</td></tr>
</table>

<h3><span class="badge lv2">進階</span>三、SAML：一封蓋了章的 XML 介紹信</h3>
<p>SAML 2.0 是 2005 年的 XML 標準，企業軟體到現在還大量使用。開始之前，SP 和 IdP 先交換一份<b>中繼資料</b>（metadata），最重要的三樣：</p>
<ul>
<li><b>Entity ID</b>：雙方的名字，例如 <code>https://wiki.example.com/saml</code>。</li>
<li><b>ACS URL</b>（Assertion Consumer Service）：SP 收證明的網址，IdP 只會送到登記過的這個網址。</li>
<li><b>IdP 的簽章憑證</b>：SP 用裡面的公開金鑰驗 IdP 的簽章。</li>
</ul>
<figure class="figure"><svg viewBox="0 0 660 390" class="fg" style="width:100%;max-width:660px" role="img" aria-label="SAML 由應用程式發起的登入：瀏覽器、應用程式、身分提供者三條時間線，八個步驟都經過瀏覽器，應用程式和身分提供者之間沒有直接連線">
<rect x="40" y="12" width="140" height="36" rx="6" class="fg-b"/><text x="110" y="35" text-anchor="middle" class="fg-t">瀏覽器</text>
<rect x="260" y="12" width="140" height="36" rx="6" class="fg-b"/><text x="330" y="35" text-anchor="middle" class="fg-t">應用程式（SP）</text>
<rect x="480" y="12" width="140" height="36" rx="6" class="fg-b"/><text x="550" y="35" text-anchor="middle" class="fg-t">身分提供者（IdP）</text>
<line x1="110" y1="48" x2="110" y2="380" class="fg-l dim dash"/>
<line x1="330" y1="48" x2="330" y2="380" class="fg-l dim dash"/>
<line x1="550" y1="48" x2="550" y2="380" class="fg-l dim dash"/>
<line x1="110" y1="84" x2="322" y2="84" class="fg-l"/><polygon points="330,84 322,79.5 322,88.5" class="fg-a"/>
<text x="220" y="76" text-anchor="middle" class="fg-t sm">① GET /wiki（還沒登入）</text>
<line x1="330" y1="122" x2="118" y2="122" class="fg-l"/><polygon points="110,122 118,117.5 118,126.5" class="fg-a"/>
<text x="220" y="114" text-anchor="middle" class="fg-t sm">② 302 轉去 IdP，帶 AuthnRequest</text>
<line x1="110" y1="160" x2="542" y2="160" class="fg-l"/><polygon points="550,160 542,155.5 542,164.5" class="fg-a"/>
<text x="440" y="152" text-anchor="middle" class="fg-t sm">③ 帶著 AuthnRequest 到 IdP</text>
<rect x="480" y="186" width="140" height="30" rx="5" class="fg-b alt"/>
<text x="550" y="206" text-anchor="middle" class="fg-t sm">④ 驗密碼＋第二道驗證</text>
<line x1="550" y1="244" x2="118" y2="244" class="fg-l alt"/><polygon points="110,244 118,239.5 118,248.5" class="fg-a alt"/>
<text x="440" y="236" text-anchor="middle" class="fg-t sm alt">⑤ 回一張會自動送出的表單</text>
<text x="440" y="262" text-anchor="middle" class="fg-t sm">內含簽過章的 SAMLResponse</text>
<line x1="110" y1="290" x2="322" y2="290" class="fg-l alt"/><polygon points="330,290 322,285.5 322,294.5" class="fg-a alt"/>
<text x="220" y="282" text-anchor="middle" class="fg-t sm alt">⑥ POST /saml/acs</text>
<rect x="250" y="310" width="160" height="30" rx="5" class="fg-b hot"/>
<text x="330" y="330" text-anchor="middle" class="fg-t sm">⑦ 驗章、建立工作階段</text>
<text x="478" y="304" text-anchor="middle" class="fg-t sm">SP 和 IdP 之間</text>
<text x="478" y="322" text-anchor="middle" class="fg-t sm">從頭到尾沒有直接連線</text>
<line x1="330" y1="366" x2="118" y2="366" class="fg-l"/><polygon points="110,366 118,361.5 118,370.5" class="fg-a"/>
<text x="220" y="358" text-anchor="middle" class="fg-t sm">⑧ 302 回 /wiki，登入完成</text>
</svg><figcaption>藍色兩段最關鍵：IdP 簽好的證明是由使用者的瀏覽器搬到應用程式的，所以應用程式必須假設它經過了不可信的手，每個欄位都要驗。</figcaption></figure>
<p>照圖走一遍。Amy 早上九點打開公司 Wiki：</p>
<ol>
<li>瀏覽器 GET 首頁，Wiki 發現沒有自己的工作階段 cookie。</li>
<li>Wiki 產生一份帶隨機 ID（例如 <code>_8f3a91c2</code>）的 AuthnRequest，自己先記下 ID，再回 302 把瀏覽器轉到 IdP；請求壓縮、Base64 後放在網址參數 <code>SAMLRequest</code> 裡（HTTP-Redirect binding）。</li>
<li>瀏覽器帶著它去 IdP。</li>
<li>IdP 看 Amy 今天登入過沒有。如果她八點半已經登入過信箱，這一步直接跳過：「只登入一次」的那個一次，指的是 IdP 自己的工作階段。</li>
<li>IdP 產生 SAMLResponse，用私鑰簽章，包在一個 HTML 表單裡，頁面一載入就自動 POST 出去（HTTP-POST binding）。回應太大放不進網址，所以用表單。</li>
<li>瀏覽器把表單 POST 到 Wiki 的 ACS URL。</li>
<li>Wiki 驗證回應（下面那張表），通過後發自己的 cookie。</li>
<li>轉回 Amy 原本要去的頁面。</li>
</ol>
<p>第 ⑦ 步之後，Wiki 跟 IdP 就沒關係了。Wiki 的工作階段多久過期，完全看 Wiki 自己。這一點到第五節講離職時會變成大問題。</p>
<h4>那份證明長什麼樣子</h4>
<pre><code>&lt;samlp:Response Destination="https://wiki.example.com/saml/acs"
                InResponseTo="_8f3a91c2"&gt;
  &lt;saml:Issuer&gt;https://idp.example.com&lt;/saml:Issuer&gt;
  &lt;saml:Assertion&gt;
    &lt;ds:Signature&gt;…IdP 的簽章…&lt;/ds:Signature&gt;
    &lt;saml:Subject&gt;
      &lt;saml:NameID&gt;amy@example.com&lt;/saml:NameID&gt;
      &lt;saml:SubjectConfirmationData InResponseTo="_8f3a91c2"
          Recipient="https://wiki.example.com/saml/acs"
          NotOnOrAfter="2026-11-09T01:05:00Z"/&gt;
    &lt;/saml:Subject&gt;
    &lt;saml:Conditions NotBefore="2026-11-09T01:00:00Z"
                     NotOnOrAfter="2026-11-09T01:05:00Z"&gt;
      &lt;saml:AudienceRestriction&gt;
        &lt;saml:Audience&gt;https://wiki.example.com/saml&lt;/saml:Audience&gt;
      &lt;/saml:AudienceRestriction&gt;
    &lt;/saml:Conditions&gt;
    &lt;saml:AttributeStatement&gt;
      &lt;saml:Attribute Name="groups"&gt;
        &lt;saml:AttributeValue&gt;engineering&lt;/saml:AttributeValue&gt;
      &lt;/saml:Attribute&gt;
    &lt;/saml:AttributeStatement&gt;
  &lt;/saml:Assertion&gt;
&lt;/samlp:Response&gt;</code></pre>
<p>這是刪掉一大半的樣子，真實的回應還有命名空間和一長串簽章值。SP 收到後，每一項都要檢查：</p>
<table>
<tr><th>檢查</th><th>沒檢查會怎樣</th></tr>
<tr><td>簽章存在、用的是事先登記的 IdP 憑證，而且簽章涵蓋你實際讀取的那個 Assertion</td><td>有人自己捏造一份；或在簽過章的節點旁邊塞一份沒簽章的，讓程式驗的是 A、讀的是 B（XML 簽章包裝攻擊，XML signature wrapping）</td></tr>
<tr><td>Issuer 是預期的 IdP</td><td>別家 IdP 簽的證明也被接受</td></tr>
<tr><td>Audience 是自己的 Entity ID</td><td>發給另一套系統的證明，被拿來登入這一套</td></tr>
<tr><td>Destination、Recipient 是自己的 ACS URL</td><td>同上，從另一個方向檢查</td></tr>
<tr><td>NotBefore、NotOnOrAfter，只容許一兩分鐘時鐘誤差</td><td>撿到一份舊證明，拿來重放</td></tr>
<tr><td>InResponseTo 對得上自己剛發出的請求 ID，而且只能用一次</td><td>重放，或沒人要求就硬塞進來的回應</td></tr>
</table>
<p>這張表的每一格都出過真實的漏洞，所以第 5.3 課才說這一塊要用經過充分測試的函式庫。自己用字串比對去 XML 裡找 NameID，幾乎一定出事。</p>
<p>上面這種叫 SP 發起（SP-initiated）。另一種是在 IdP 入口頁點應用程式圖示，IdP 直接送一份沒人要求過的證明（IdP-initiated）。SP 沒有 InResponseTo 可以對，比較容易被重放。能選的話，讓圖示只是連回 SP 的連結，再由 SP 發起。</p>

<h3><span class="badge lv2">進階</span>四、OIDC：同一件事的 JSON 版，加上授權碼與 PKCE</h3>
<p>OpenID Connect（OIDC）蓋在 OAuth 2.0 上面。OAuth 2.0 是<b>授權</b>協定：讓 App 拿到「代替你呼叫某個 API」的 access token，沒規定「你是誰」怎麼表示。OIDC 補了一張 <b>ID token</b>：IdP 簽章的 JWT，內容就是「這個人是誰」。要登入看 ID token，要呼叫 API 帶 access token，不要混用。現在正確的做法只有一種：<b>授權碼流程加 PKCE</b>（authorization code flow with PKCE），網站、單頁應用、手機 App 都一樣。</p>
<figure class="figure"><svg viewBox="0 0 660 420" class="fg" style="width:100%;max-width:660px" role="img" aria-label="OIDC 授權碼加 PKCE：瀏覽器只搬授權碼，後台直接連到身分提供者，用授權碼加 code_verifier 換到 id_token 和 access_token">
<rect x="40" y="12" width="140" height="36" rx="6" class="fg-b"/><text x="110" y="35" text-anchor="middle" class="fg-t">瀏覽器</text>
<rect x="260" y="12" width="140" height="36" rx="6" class="fg-b"/><text x="330" y="35" text-anchor="middle" class="fg-t">後台（RP）</text>
<rect x="480" y="12" width="140" height="36" rx="6" class="fg-b"/><text x="550" y="35" text-anchor="middle" class="fg-t">身分提供者（IdP）</text>
<line x1="110" y1="48" x2="110" y2="410" class="fg-l dim dash"/>
<line x1="330" y1="48" x2="330" y2="410" class="fg-l dim dash"/>
<line x1="550" y1="48" x2="550" y2="410" class="fg-l dim dash"/>
<rect x="250" y="62" width="160" height="30" rx="5" class="fg-b"/>
<text x="330" y="82" text-anchor="middle" class="fg-t sm">① 產生三個隨機值</text>
<line x1="330" y1="124" x2="118" y2="124" class="fg-l"/><polygon points="110,124 118,119.5 118,128.5" class="fg-a"/>
<text x="220" y="116" text-anchor="middle" class="fg-t sm">② 302 轉去 /authorize</text>
<line x1="110" y1="162" x2="542" y2="162" class="fg-l"/><polygon points="550,162 542,157.5 542,166.5" class="fg-a"/>
<text x="440" y="154" text-anchor="middle" class="fg-t sm">③ 帶 code_challenge 登入</text>
<rect x="480" y="184" width="140" height="30" rx="5" class="fg-b alt"/>
<text x="550" y="204" text-anchor="middle" class="fg-t sm">④ 驗密碼＋MFA</text>
<line x1="550" y1="242" x2="118" y2="242" class="fg-l"/><polygon points="110,242 118,237.5 118,246.5" class="fg-a"/>
<text x="440" y="234" text-anchor="middle" class="fg-t sm">⑤ 302 回 /callback</text>
<text x="440" y="260" text-anchor="middle" class="fg-t sm mono">?code=Q7xP…&amp;state=k2Jd9…</text>
<line x1="110" y1="288" x2="322" y2="288" class="fg-l"/><polygon points="330,288 322,283.5 322,292.5" class="fg-a"/>
<text x="220" y="280" text-anchor="middle" class="fg-t sm">⑥ 把 code 交給後台</text>
<text x="220" y="322" text-anchor="middle" class="fg-t sm">綠線不經過瀏覽器</text>
<text x="220" y="340" text-anchor="middle" class="fg-t sm">code 單獨被偷沒有用</text>
<line x1="330" y1="326" x2="542" y2="326" class="fg-l on"/><polygon points="550,326 542,321.5 542,330.5" class="fg-a on"/>
<text x="440" y="318" text-anchor="middle" class="fg-t sm acc">⑦ POST /token＋verifier</text>
<line x1="550" y1="362" x2="338" y2="362" class="fg-l on"/><polygon points="330,362 338,357.5 338,366.5" class="fg-a on"/>
<text x="440" y="354" text-anchor="middle" class="fg-t sm acc">⑧ id_token、access_token</text>
<rect x="250" y="378" width="160" height="28" rx="5" class="fg-b hot"/>
<text x="330" y="397" text-anchor="middle" class="fg-t sm">⑨ 驗 id_token</text>
</svg><figcaption>跟 SAML 最大的不同在綠線：token 由後台直接向 IdP 拿。瀏覽器只搬一個用過即丟的授權碼，要換成 token 還得出示只有後台知道的 code_verifier。</figcaption></figure>
<p>用一個猜高低遊戲的營運後台 <code>admin.example.com</code> 走一遍：</p>
<ol>
<li>後台產生一個 43 到 128 字元的隨機字串 <code>code_verifier</code>，存在 Amy 的暫時工作階段裡；算它的 SHA-256 再做 Base64URL，得到 <code>code_challenge</code>。另外再產生兩個隨機值 <code>state</code> 和 <code>nonce</code>。</li>
<li>回 302，把瀏覽器送到 IdP：
<pre><code>https://idp.example.com/authorize
  ?response_type=code
  &amp;client_id=admin-portal
  &amp;redirect_uri=https://admin.example.com/callback
  &amp;scope=openid%20email%20profile
  &amp;state=k2Jd9…
  &amp;nonce=Vn81q…
  &amp;code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &amp;code_challenge_method=S256</code></pre></li>
<li>瀏覽器到 IdP，Amy 輸入密碼、做第二道驗證。</li>
<li>IdP 把瀏覽器轉回 <code>https://admin.example.com/callback?code=Q7xP…&amp;state=k2Jd9…</code>。IdP 只轉到事先登記、完全相符的 <code>redirect_uri</code>。</li>
<li>後台比對 <code>state</code> 跟自己發出的一不一樣，不一樣就拒絕。這是在防有人把<b>他自己的</b>授權碼塞給你，讓你登入成他的帳號（登入版的 CSRF）。</li>
<li>後台用自己的連線 POST 到 IdP 的 <code>/token</code>，帶上授權碼、<code>code_verifier</code> 和自己的用戶端憑證（client secret，或更好的 private_key_jwt）。</li>
<li>IdP 算 <code>SHA-256(code_verifier)</code>，跟收到的 challenge 一樣，才交出 token：
<pre><code>{
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlOWdkazcifQ.eyJpc3Mi….",
  "access_token": "…",
  "expires_in": 3600,
  "token_type": "Bearer"
}</code></pre></li>
<li>後台驗 ID token，通過就建立自己的工作階段。</li>
</ol>
<p>為什麼要繞這一圈，不讓 IdP 直接把 token 放在轉址網址裡？因為網址會留在瀏覽紀錄、被代理伺服器寫進日誌、跟著 Referer 標頭跑到別的網站。走瀏覽器的只有授權碼，只能用一次、很快過期，單獨偷到也換不到 token，因為還要從沒離開過後台的 <code>code_verifier</code>。早年在網址裡直接回 token 的隱含流程（implicit flow），OAuth 安全最佳實務（RFC 9700）已經不建議使用。</p>
<h4>ID token 裡面有什麼，要驗什麼</h4>
<p>把 JWT 的中間那段 Base64URL 解開，大概長這樣：</p>
<pre><code>{
  "iss": "https://idp.example.com",
  "sub": "00u8x2k1ab",
  "aud": "admin-portal",
  "iat": 1794186000,
  "exp": 1794189600,
  "nonce": "Vn81q…",
  "email": "amy@example.com",
  "name": "Amy Chen"
}</code></pre>
<ol>
<li><b>簽章</b>：從 <code>/.well-known/openid-configuration</code> 找到 <code>jwks_uri</code>，下載 IdP 的公開金鑰，照 JWT 標頭的 <code>kid</code> 挑一把來驗；演算法要是你預期的（例如 RS256），絕不接受 <code>none</code>。</li>
<li><b>iss</b> 是預期的 IdP，<b>aud</b> 包含自己的 client_id，<b>exp</b> 還沒到。</li>
<li><b>nonce</b> 跟第 ① 步產生的一樣，防止重放舊的 ID token。</li>
</ol>
<p>還有一個很多人踩過的坑：<b>用 <code>iss</code> 加 <code>sub</code> 認人，不要用 email。</b><code>sub</code> 是 IdP 給這個人的永久編號；email 會因改名而變、會在人離職後分給新同事，某些多租戶設定裡甚至能被使用者自己改。2023 年公開的 nOAuth 問題就是這樣：有些應用程式拿 Entra ID 傳來的 email 當帳號依據，攻擊者在自己的租用戶裡把 email 改成受害者的，就登入成了受害者。</p>
<h4>SAML 和 OIDC 怎麼選</h4>
<table>
<tr><th></th><th>SAML 2.0</th><th>OIDC</th></tr>
<tr><td>格式</td><td>XML，簽章規則很複雜</td><td>JSON、JWT</td></tr>
<tr><td>證明怎麼送到</td><td>瀏覽器 POST 表單</td><td>瀏覽器只搬授權碼，後台直接換 token</td></tr>
<tr><td>能不能順便呼叫 API</td><td>不能</td><td>能，用 access token</td></tr>
<tr><td>適合</td><td>企業 SaaS、老系統</td><td>新寫的網站、單頁應用、手機 App、CLI</td></tr>
</table>
<p>規則很簡單：對方只支援 SAML 就用 SAML，自己寫新系統一律 OIDC。兩者都安全，出事幾乎都在實作。</p>

<h3><span class="badge lv3">專業</span>五、SCIM 與帳號的一生：讓新進、調動、離職自己發生</h3>
<h4>即時開通不夠</h4>
<p>最簡單的帳號開通叫<b>即時開通</b>（just-in-time provisioning，JIT）：第一次用 SSO 登入時，應用程式看到沒見過的 <code>sub</code>，就照證明裡的屬性當場建帳號。它解決了新進，解決不了離職：人走了就不會再登入，應用程式永遠不知道，帳號連同他建的 API 金鑰一直躺在那裡。</p>
<h4>SCIM：身分提供者主動去改每一套系統</h4>
<p>SCIM 2.0（RFC 7643、7644）是一組樸素的 REST API：應用程式提供 <code>/Users</code> 和 <code>/Groups</code>，身分提供者拿一把專用的 bearer token 去呼叫。新人報到前幾天，IdP 送出：</p>
<pre><code>POST /scim/v2/Users
Authorization: Bearer &lt;給 IdP 專用的 token&gt;
Content-Type: application/scim+json

{
  "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
  "externalId": "00u8x2k1ab",
  "userName": "amy@example.com",
  "name": { "givenName": "Amy", "familyName": "Chen" },
  "emails": [{ "value": "amy@example.com", "primary": true }],
  "active": true
}</code></pre>
<p>應用程式回 <code>201 Created</code> 和它自己的 <code>id</code>，例如 <code>2819c223</code>。IdP 記住這個對應關係。人離職時，IdP 送出：</p>
<pre><code>PATCH /scim/v2/Users/2819c223
Content-Type: application/scim+json

{
  "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
  "Operations": [{ "op": "replace", "value": { "active": false } }]
}</code></pre>
<p>它通常是停用不是刪除，資料和稽核紀錄還在。三個現實：很多 SaaS 只在最貴的方案給 SSO 和 SCIM，業界戲稱「SSO 稅」；同步一輪一輪跑，可能等幾十分鐘，緊急離職不能只靠它；每家實作都不太一樣，上線前用測試帳號把三種事件各跑一次。</p>
<h4>真相來源：人資系統</h4>
<p>成熟的做法是讓<b>人資系統</b>（HRIS）當唯一的真相來源：人資登錄到職日、部門、主管、離職日，身分提供者讀它、用規則算出群組，再用 SCIM 推到每套系統。MIS 不再一個一個開帳號，而是維護規則：「部門＝客戶端組，就加入 GitHub 的 client 團隊」。</p>
<figure class="figure"><svg viewBox="0 0 680 300" class="fg" style="width:100%;max-width:680px" role="img" aria-label="新進、調動、離職三列，每一列都從人資系統開始，身分提供者依規則改帳號和群組，再用 SCIM 推到各個應用程式">
<text x="185" y="34" text-anchor="middle" class="fg-t">HR 系統（真相來源）</text>
<text x="385" y="34" text-anchor="middle" class="fg-t">身分提供者（規則）</text>
<text x="585" y="34" text-anchor="middle" class="fg-t">各系統（SCIM）</text>
<text x="50" y="87" text-anchor="middle" class="fg-t lg acc">新進</text>
<rect x="100" y="52" width="170" height="60" rx="6" class="fg-b"/>
<text x="185" y="77" text-anchor="middle" class="fg-t sm">新建員工資料</text>
<text x="185" y="96" text-anchor="middle" class="fg-t sm">到職日 3/2，客戶端組</text>
<line x1="270" y1="82" x2="292" y2="82" class="fg-l"/><polygon points="300,82 292,77.5 292,86.5" class="fg-a"/>
<rect x="300" y="52" width="170" height="60" rx="6" class="fg-b hot"/>
<text x="385" y="77" text-anchor="middle" class="fg-t sm">先建帳號、加入群組</text>
<text x="385" y="96" text-anchor="middle" class="fg-t sm">到職日當天才啟用</text>
<line x1="470" y1="82" x2="492" y2="82" class="fg-l"/><polygon points="500,82 492,77.5 492,86.5" class="fg-a"/>
<rect x="500" y="52" width="170" height="60" rx="6" class="fg-b alt"/>
<text x="585" y="77" text-anchor="middle" class="fg-t sm mono">POST /Users</text>
<text x="585" y="96" text-anchor="middle" class="fg-t sm">GitHub、Slack、Jira</text>
<text x="50" y="163" text-anchor="middle" class="fg-t lg alt">調動</text>
<rect x="100" y="128" width="170" height="60" rx="6" class="fg-b"/>
<text x="185" y="153" text-anchor="middle" class="fg-t sm">部門改成後端組</text>
<text x="185" y="172" text-anchor="middle" class="fg-t sm">生效日 6/1</text>
<line x1="270" y1="158" x2="292" y2="158" class="fg-l"/><polygon points="300,158 292,153.5 292,162.5" class="fg-a"/>
<rect x="300" y="128" width="170" height="60" rx="6" class="fg-b hot"/>
<text x="385" y="153" text-anchor="middle" class="fg-t sm">群組重新計算</text>
<text x="385" y="172" text-anchor="middle" class="fg-t sm">新的加上、舊的移除</text>
<line x1="470" y1="158" x2="492" y2="158" class="fg-l"/><polygon points="500,158 492,153.5 492,162.5" class="fg-a"/>
<rect x="500" y="128" width="170" height="60" rx="6" class="fg-b alt"/>
<text x="585" y="153" text-anchor="middle" class="fg-t sm mono">PATCH /Groups</text>
<text x="585" y="172" text-anchor="middle" class="fg-t sm">舊專案的權限收回</text>
<text x="50" y="239" text-anchor="middle" class="fg-t lg warm">離職</text>
<rect x="100" y="204" width="170" height="60" rx="6" class="fg-b"/>
<text x="185" y="229" text-anchor="middle" class="fg-t sm">離職日 6/30 18:00</text>
<text x="185" y="248" text-anchor="middle" class="fg-t sm">人資按下送出</text>
<line x1="270" y1="234" x2="292" y2="234" class="fg-l warm"/><polygon points="300,234 292,229.5 292,238.5" class="fg-a warm"/>
<rect x="300" y="204" width="170" height="60" rx="6" class="fg-b hot"/>
<text x="385" y="229" text-anchor="middle" class="fg-t sm">停用帳號</text>
<text x="385" y="248" text-anchor="middle" class="fg-t sm">撤銷所有工作階段</text>
<line x1="470" y1="234" x2="492" y2="234" class="fg-l warm"/><polygon points="500,234 492,229.5 492,238.5" class="fg-a warm"/>
<rect x="500" y="204" width="170" height="60" rx="6" class="fg-b alt"/>
<text x="585" y="229" text-anchor="middle" class="fg-t sm mono">active: false</text>
<text x="585" y="248" text-anchor="middle" class="fg-t sm">各系統同步停用</text>
<text x="385" y="290" text-anchor="middle" class="fg-t sm">MIS 維護的是規則，不是一個一個帳號</text>
</svg><figcaption>每一列都從人資系統的一筆資料開始，身分提供者用規則把部門翻譯成群組，應用程式照 SCIM 指令執行。人工只出現在最左邊。</figcaption></figure>
<h4>新進：第一天就能工作，但不能早一天</h4>
<p>帳號報到前幾天建好、群組算好，但到職日當天才啟用。第一次登入不寄明文密碼，改用幾小時就過期的一次性設定碼（Entra ID 叫 Temporary Access Pass），讓新人直接註冊通行金鑰。筆電事先在 MDM 登記，開箱連網就自動套用設定（下一課）。</p>
<h4>調動：最容易爛掉的一環</h4>
<p>調動沒有明確的觸發點。新權限有人吵著要，舊權限沒人會說「請拿掉」，三年調三次就有三個部門的權限，這叫<b>權限潛變</b>（privilege creep）。解法是讓群組由屬性動態算出（Entra 的動態群組、Okta 的群組規則），部門一改，舊群組自動退出；交接期需要舊權限，就給一個兩週後自動收回的例外。</p>
<h4>離職：一張有時間的檢查表</h4>
<table>
<tr><th>什麼時候</th><th>做什麼</th></tr>
<tr><td>當下</td><td>停用 IdP 帳號；撤銷所有工作階段和 refresh token（Entra 的 Revoke sessions、Google 管理控制台的強制登出）；移除他的 MFA 方法</td></tr>
<tr><td>一小時內</td><td>確認 SCIM 已推完；手動處理不在 SSO 後面的系統（清單要事先有）；停用他的雲端存取金鑰、VPN 憑證</td></tr>
<tr><td>一天內</td><td>輪替他知道的共用密碼；查郵件自動轉寄；收回筆電，收不回就遠端鎖定</td></tr>
<tr><td>三十天內</td><td>信箱、雲端硬碟交接；確認沒有排程或 Webhook 還用他的身分在跑</td></tr>
</table>
<p>最常被忽略的一點：<b>在身分提供者停用帳號，不會讓已經登入的應用程式自動把人踢出去。</b>應用程式有自己的工作階段，可能 8 小時、可能 30 天才過期。所以要一起做三件事：在 IdP 撤銷工作階段、靠 SCIM 停用應用程式那邊的帳號、對雲端主控台和程式碼代管這幾套再人工確認。Microsoft 的持續存取評估（Continuous Access Evaluation，CAE）能讓部分 Microsoft 365 服務幾乎立刻失效，但只涵蓋支援的服務。</p>

<h3><span class="badge lv3">專業</span>六、權限怎麼給：RBAC、ABAC，以及條件式存取</h3>
<h4>RBAC：照職務發鑰匙圈</h4>
<p><b>以角色為基礎的存取控制</b>（role-based access control，RBAC）：權限先組成角色，再把人放進角色。以一家做猜高低遊戲的工作室為例：</p>
<table>
<tr><th>角色</th><th>拿到的權限</th></tr>
<tr><td>客戶端工程師</td><td>客戶端程式碼庫寫入、測試環境後台唯讀</td></tr>
<tr><td>後端工程師</td><td>後端程式碼庫寫入、測試環境雲端主控台、正式環境日誌唯讀</td></tr>
<tr><td>營運</td><td>營運後台、報表</td></tr>
<tr><td>MIS</td><td>身分提供者管理員，但要經過第七節的即時提權</td></tr>
</table>
<p>RBAC 好懂、好稽核，一句「Amy 是後端工程師」就說完。問題在<b>角色爆炸</b>（role explosion）：「台北的後端、只碰支付、不碰正式環境」這種需求一多，角色從十個長成幾百個。</p>
<h4>ABAC：照屬性算</h4>
<p><b>以屬性為基礎的存取控制</b>（attribute-based access control，ABAC）每次用屬性算：人的（部門、團隊）、資源的（標籤、機密等級）、環境的（時間、裝置）。AWS 的例子：</p>
<pre><code>{
  "Effect": "Allow",
  "Action": ["ec2:StartInstances", "ec2:StopInstances"],
  "Resource": "*",
  "Condition": {
    "StringEquals": { "aws:ResourceTag/team": "\${aws:PrincipalTag/team}" }
  }
}</code></pre>
<p>意思是：你工作階段的 team 標籤（IdP 透過 SAML 屬性帶進來）跟機器上的一樣，你就能開關它。多一個團隊不用寫新政策。代價是稽核變難（「Amy 能碰哪些機器」要掃過所有標籤），而且<b>標籤本身變成了權限</b>，誰能打標籤也要管。另外還有<b>以關係為基礎</b>（ReBAC）的做法，例如雲端硬碟的「分享給某人」；Google 的 Zanzibar 論文催生了開源的 OpenFGA、SpiceDB。實務上常混著用：RBAC 管大方向，ABAC 加條件。</p>
<h4>條件式存取：把「在哪裡、用什麼」也算進去</h4>
<p><b>條件式存取</b>（conditional access）就是在身分提供者那一端執行的 ABAC：每次登入、每次換新 token，都把一組訊號丟進政策算出結果。</p>
<figure class="figure"><svg viewBox="0 0 680 280" class="fg" style="width:100%;max-width:680px" role="img" aria-label="條件式存取：左邊五種訊號（使用者、裝置、地點、應用程式、風險）匯進政策引擎，右邊算出放行、加驗 MFA、限制工作階段或封鎖四種結果">
<rect x="20" y="24" width="210" height="34" rx="5" class="fg-b"/><text x="32" y="46" class="fg-t sm">誰：使用者、群組、角色</text>
<rect x="20" y="66" width="210" height="34" rx="5" class="fg-b"/><text x="32" y="88" class="fg-t sm">裝置：有沒有納管、合規</text>
<rect x="20" y="108" width="210" height="34" rx="5" class="fg-b"/><text x="32" y="130" class="fg-t sm">地點：IP、國家</text>
<rect x="20" y="150" width="210" height="34" rx="5" class="fg-b"/><text x="32" y="172" class="fg-t sm">應用程式：要進哪一套</text>
<rect x="20" y="192" width="210" height="34" rx="5" class="fg-b"/><text x="32" y="214" class="fg-t sm">風險：這次登入像不像本人</text>
<line x1="230" y1="41" x2="256" y2="41" class="fg-l"/>
<line x1="230" y1="83" x2="256" y2="83" class="fg-l"/>
<line x1="230" y1="125" x2="256" y2="125" class="fg-l"/>
<line x1="230" y1="167" x2="256" y2="167" class="fg-l"/>
<line x1="230" y1="209" x2="256" y2="209" class="fg-l"/>
<line x1="256" y1="41" x2="256" y2="209" class="fg-l"/>
<line x1="256" y1="140" x2="284" y2="140" class="fg-l"/><polygon points="292,140 284,135.5 284,144.5" class="fg-a"/>
<rect x="292" y="100" width="150" height="80" rx="6" class="fg-b hot"/>
<text x="367" y="134" text-anchor="middle" class="fg-t acc">條件式存取</text>
<text x="367" y="156" text-anchor="middle" class="fg-t sm">逐條比對政策</text>
<line x1="442" y1="140" x2="466" y2="140" class="fg-l"/>
<line x1="466" y1="48" x2="466" y2="204" class="fg-l"/>
<line x1="466" y1="48" x2="492" y2="48" class="fg-l"/><polygon points="500,48 492,43.5 492,52.5" class="fg-a"/>
<line x1="466" y1="100" x2="492" y2="100" class="fg-l"/><polygon points="500,100 492,95.5 492,104.5" class="fg-a"/>
<line x1="466" y1="152" x2="492" y2="152" class="fg-l"/><polygon points="500,152 492,147.5 492,156.5" class="fg-a"/>
<line x1="466" y1="204" x2="492" y2="204" class="fg-l"/><polygon points="500,204 492,199.5 492,208.5" class="fg-a"/>
<rect x="500" y="30" width="160" height="36" rx="5" class="fg-b hot"/><text x="580" y="53" text-anchor="middle" class="fg-t">放行</text>
<rect x="500" y="82" width="160" height="36" rx="5" class="fg-b alt"/><text x="580" y="105" text-anchor="middle" class="fg-t">加驗 MFA</text>
<rect x="500" y="134" width="160" height="36" rx="5" class="fg-b alt"/><text x="580" y="157" text-anchor="middle" class="fg-t">放行，但限唯讀</text>
<rect x="500" y="186" width="160" height="36" rx="5" class="fg-b warm"/><text x="580" y="209" text-anchor="middle" class="fg-t warm">封鎖</text>
<text x="340" y="262" text-anchor="middle" class="fg-t sm">例：財務系統＋沒納管的筆電 → 封鎖；同一個人用公司筆電 → 放行</text>
</svg><figcaption>同一個人、同一組密碼，換一台裝置、換一個地點，結果就不同。條件式存取把「密碼對不對」這一個問題，變成五個問題一起問。</figcaption></figure>
<p>Entra ID 的政策是<b>指派</b>（哪些人、哪些應用程式、什麼條件）加<b>控制</b>（要求 MFA、合規裝置、某種驗證強度，或封鎖）。中小公司常見的起手式：</p>
<table>
<tr><th>對象</th><th>條件</th><th>結果</th></tr>
<tr><td>所有人、所有應用程式</td><td>任何登入</td><td>要求 MFA</td></tr>
<tr><td>管理員角色</td><td>任何登入</td><td>要求防釣魚的驗證強度（安全金鑰、通行金鑰）</td></tr>
<tr><td>雲端主控台、程式碼代管</td><td>任何登入</td><td>要求合規裝置（下一課）</td></tr>
<tr><td>所有人</td><td>舊式驗證（IMAP、POP）</td><td>封鎖：它們不能做 MFA</td></tr>
<tr><td>所有人</td><td>公司不營運的國家</td><td>封鎖：擋業餘的，擋不住掛 VPN 的</td></tr>
</table>
<p>兩個守則：新政策先用「僅限報告」（report-only）模式跑一兩週，看它<b>會</b>擋到誰；政策要排除緊急帳號（第七節），以免一條寫錯的政策把所有管理員鎖在外面。排除清單也要定期檢查，它很容易越長越長，變成沒人看守的側門。</p>

<h3><span class="badge lv3">專業</span>七、管理員：分開帳號、即時提權、緊急帳號、權限盤點</h3>
<h4>管理員帳號要分開</h4>
<p>Amy 用 <code>amy@</code> 收信上網，管 IdP 時用另一個 <code>amy-admin@</code>：沒有信箱、不瀏覽網頁、只能用安全金鑰登入。釣魚信和惡意擴充套件偷到的是日常帳號，損失就停在一般員工的權限。</p>
<h4>從「一直有」到「需要才有」：即時提權</h4>
<p>永遠掛在身上的權限叫<b>常駐權限</b>（standing privilege）：8 個全域管理員，就是 8 把隨時能被釣走的萬能鑰匙。<b>即時提權</b>（just-in-time access）讓大家平常只是「有資格」，要用才啟用。以 Entra ID 的 PIM 為例：Amy 到 PIM 按「啟用」，填工單號碼、再做一次 MFA，重要角色還要另一人核准；啟用最多 2 小時，到時自動失效，全程寫進稽核日誌。</p>
<p>雲端同理，AWS IAM Identity Center 只發幾小時就過期的憑證。伺服器 root 這類共用帳號交給 <b>PAM</b>（privileged access management）產品：密碼放保險庫、借出才能用、連線可錄影、歸還就換密碼。Windows 本機管理員密碼交給 LAPS，每台不同。</p>
<h4>緊急帳號（break-glass account）</h4>
<p>IdP 的 MFA 服務掛了、條件式存取政策寫錯、唯一的全域管理員聯絡不上，那一天你沒時間打給原廠排隊。設計重點：</p>
<table>
<tr><th>項目</th><th>做法</th><th>為什麼</th></tr>
<tr><td>數量</td><td>至少兩個</td><td>一個被鎖、一個還能用</td></tr>
<tr><td>帳號從哪來</td><td>只存在雲端、不從 AD 同步，用租用戶預設網域（例如 example.onmicrosoft.com）</td><td>AD、同步、自訂網域壞了照樣能登入</td></tr>
<tr><td>驗證方式</td><td>FIDO2 安全金鑰，兩把分開保管</td><td>Azure 管理入口已強制 MFA；綁個人手機，人一走就斷</td></tr>
<tr><td>條件式存取</td><td>排除在大多數政策之外</td><td>政策寫錯時它才進得來</td></tr>
<tr><td>保管與監控</td><td>放保險箱、兩人才能取出；一登入就警報</td><td>平常不該被用，一用就要有人知道</td></tr>
<tr><td>測試</td><td>每季實際登入一次</td><td>不測就不知道還能不能用</td></tr>
</table>
<h4>權限盤點：讓人真的看，而不是一路按核准</h4>
<p><b>權限盤點</b>（access review）是每季請主管確認「這些人還該有這些權限嗎」，ISO 27001、SOC 2 稽核都要紀錄。最常見的失敗是<b>橡皮圖章</b>：200 行清單全部按核准。讓它有用的幾招：附上「最後一次使用的日期」，90 天沒用的很容易下手；主管沒回應就預設收回；只盤點正式環境、財務、個資、管理員角色這些重要的；讓工具自動套用結果，不靠 MIS 照試算表手動刪。</p>

<h3><span class="badge lv4">專家</span>八、身分攻擊實際上怎麼發生</h3>
<p>攻擊者已經不太費力打伺服器漏洞了，登入比較快。典型的身分入侵分四步：拿到密碼 → 過第二道驗證 → 拿到工作階段 → 留後門。第 5.3 課講過怎麼拿到密碼，這裡從第二步開始。</p>
<h4>過 MFA 的第一種方法：中間人釣魚</h4>
<figure class="figure"><svg viewBox="0 0 680 300" class="fg" style="width:100%;max-width:680px" role="img" aria-label="上半部：中間人釣魚代理把使用者的密碼和驗證碼原封不動轉給真正的身分提供者，再偷走登入後的工作階段 cookie；下半部：通行金鑰的簽章綁著網域，釣魚網域拿不到能用的簽章，真正的身分提供者拒絕">
<text x="20" y="22" class="fg-t sm warm">密碼＋驗證碼：釣魚代理整包轉送</text>
<rect x="20" y="36" width="100" height="44" rx="6" class="fg-b"/>
<text x="70" y="63" text-anchor="middle" class="fg-t">使用者</text>
<line x1="120" y1="58" x2="242" y2="58" class="fg-l"/><polygon points="250,58 242,53.5 242,62.5" class="fg-a"/>
<text x="185" y="50" text-anchor="middle" class="fg-t sm">密碼＋驗證碼</text>
<rect x="250" y="36" width="160" height="44" rx="6" class="fg-b warm"/>
<text x="330" y="55" text-anchor="middle" class="fg-t warm">釣魚代理</text>
<text x="330" y="72" text-anchor="middle" class="fg-t sm mono">login-examp1e.com</text>
<line x1="410" y1="50" x2="532" y2="50" class="fg-l"/><polygon points="540,50 532,45.5 532,54.5" class="fg-a"/>
<text x="475" y="42" text-anchor="middle" class="fg-t sm">原封不動轉送</text>
<line x1="540" y1="70" x2="418" y2="70" class="fg-l warm"/><polygon points="410,70 418,65.5 418,74.5" class="fg-a warm"/>
<text x="475" y="90" text-anchor="middle" class="fg-t sm warm">工作階段 cookie</text>
<rect x="540" y="36" width="120" height="44" rx="6" class="fg-b"/>
<text x="600" y="63" text-anchor="middle" class="fg-t">真正的 IdP</text>
<line x1="330" y1="80" x2="330" y2="98" class="fg-l warm"/><polygon points="330,106 325.5,98 334.5,98" class="fg-a warm"/>
<rect x="250" y="106" width="160" height="30" rx="5" class="fg-b warm"/>
<text x="330" y="126" text-anchor="middle" class="fg-t sm">攻擊者拿 cookie 直接登入</text>
<line x1="20" y1="152" x2="660" y2="152" class="fg-l dim dash"/>
<text x="20" y="176" class="fg-t sm acc">通行金鑰：簽章綁著網域，代理拿不到能用的東西</text>
<rect x="20" y="188" width="100" height="52" rx="6" class="fg-b"/>
<text x="70" y="210" text-anchor="middle" class="fg-t">使用者</text>
<text x="70" y="228" text-anchor="middle" class="fg-t sm">有通行金鑰</text>
<line x1="120" y1="214" x2="242" y2="214" class="fg-l warm dash"/><polygon points="250,214 242,209.5 242,218.5" class="fg-a warm"/>
<text x="185" y="206" text-anchor="middle" class="fg-t sm warm">這個網域沒金鑰</text>
<rect x="250" y="188" width="160" height="52" rx="6" class="fg-b warm"/>
<text x="330" y="210" text-anchor="middle" class="fg-t warm">釣魚代理</text>
<text x="330" y="228" text-anchor="middle" class="fg-t sm mono">login-examp1e.com</text>
<line x1="410" y1="214" x2="532" y2="214" class="fg-l dash"/><polygon points="540,214 532,209.5 532,218.5" class="fg-a"/>
<text x="475" y="206" text-anchor="middle" class="fg-t sm">硬轉也沒用</text>
<text x="475" y="232" text-anchor="middle" class="fg-t sm">簽章裡寫著假網域</text>
<rect x="540" y="188" width="120" height="52" rx="6" class="fg-b"/>
<text x="600" y="210" text-anchor="middle" class="fg-t">真正的 IdP</text>
<text x="600" y="228" text-anchor="middle" class="fg-t sm warm">網域不對，拒絕</text>
<text x="340" y="278" text-anchor="middle" class="fg-t sm">WebAuthn 把網域寫進簽章：換一個網域，就對不上</text>
</svg><figcaption>上半部：密碼、簡訊碼、六位數驗證碼都能照抄，代理抄一份就好。下半部：通行金鑰的簽章包含瀏覽器當下的網域，假網域簽出來的，真網站一驗就知道。</figcaption></figure>
<p>這叫<b>中間人釣魚</b>（adversary-in-the-middle，AiTM）。釣魚網站是一台反向代理，把真登入頁即時轉給使用者，再把使用者輸入的每個字轉給真網站。登入成功那一刻，真網站發出 cookie，代理順手留一份。開源的 Evilginx 這類工具讓它幾乎不用寫程式。</p>
<p>簡訊、TOTP、推播全擋不住，因為它們不知道使用者是在哪個網域按下去的。擋得住的是<b>防釣魚的 MFA</b>（phishing-resistant MFA）：FIDO2 安全金鑰、通行金鑰（passkey）、憑證式驗證。WebAuthn 有兩道機制：瀏覽器只拿出屬於目前網域的金鑰，在 <code>login-examp1e.com</code> 上叫不出 <code>login.example.com</code> 的；就算硬把挑戰轉過去，簽章內容也寫著瀏覽器看到的真實來源，IdP 一驗就拒絕。不靠使用者眼尖，靠密碼學。</p>
<h4>第二種：MFA 疲勞</h4>
<p>攻擊者有了密碼，凌晨兩點連續觸發推播，一次、十次、五十次，使用者被吵到按了核准。2022 年 Uber 的入侵就有這一段，攻擊者還在 WhatsApp 上假裝公司 IT，請對方「按一下核准就不會再跳了」。防法：<b>數字比對</b>（number matching），手機上要輸入登入畫面顯示的兩位數，沒看到畫面的人不知道該輸入什麼；Microsoft Authenticator 從 2023 年起強制開啟。再加上顯示登入地點、限制推播次數、一個「這不是我」的回報鈕。根本解還是通行金鑰。</p>
<h4>第三種：打電話給服務台</h4>
<p>「我換手機了，可以幫我重設 MFA 嗎？」來電者知道員工姓名、職稱、主管，全是 LinkedIn 查得到的。2023 年 MGM 度假村的入侵，就是從一通打給 IT 服務台的電話開始。防法是一套寫下來、不能通融的流程：用人資檔案裡的電話回撥、視訊對證件、主管在系統裡核准，重設後只發短效臨時碼，並盯緊接下來 24 小時的活動。</p>
<h4>token 竊取：連 MFA 都不用過</h4>
<p>這是近幾年最大宗的手法。<b>資訊竊取惡意程式</b>（infostealer）藏在破解軟體、假遊戲外掛、惡意擴充套件裡，一執行就把瀏覽器存的密碼和 cookie 打包送走，在地下市場一筆一筆賣。攻擊者把 cookie 匯進自己的瀏覽器，就是登入狀態的你，MFA 早就做完了。偷到 refresh token 更糟，可能幾週都能換新的 access token。</p>
<p>防法一層層疊：EDR 抓竊取程式（下一課）；敏感系統縮短工作階段；把 token 綁在裝置上（Entra 的 Token Protection、Chrome 正在推的 DBSC，涵蓋範圍都還有限）；偵測工作階段突然換了國家；一有懷疑就全部撤銷。</p>
<h4>不用密碼的兩種</h4>
<ul>
<li><b>同意授權釣魚</b>（consent phishing）：真的 Microsoft 頁面問你「是否允許『PDF 檢視器』讀取你的信件」，按下允許，攻擊者拿到 OAuth token，改密碼也趕不走。防法：使用者只能同意低風險權限，其他走管理員核准。</li>
<li><b>裝置代碼釣魚</b>（device code phishing）：攻擊者發起「在另一台裝置登入」的流程，騙受害者到真的官方網址輸入代碼，受害者做完 MFA，token 卻發給攻擊者。防法：用條件式存取封鎖不需要的裝置代碼流程。</li>
</ul>
<h4>進來之後：盯住留後門的動作</h4>
<p>攻擊者進來後的動作很有特徵，這些是偵測重點：</p>
<table>
<tr><th>訊號</th><th>代表什麼</th></tr>
<tr><td>新註冊了一個 MFA 方法</td><td>攻擊者加了自己的手機</td></tr>
<tr><td>信箱新規則：含「匯款」的信自動轉寄或藏起來</td><td>準備商務電子郵件詐騙（BEC）</td></tr>
<tr><td>新的 OAuth 應用程式同意，或服務主體多了憑證</td><td>不靠密碼也能長期進出</td></tr>
<tr><td>同一個工作階段從兩個國家出現</td><td>token 被偷</td></tr>
<tr><td>有人被指派管理員角色，不是透過 PIM</td><td>提權</td></tr>
</table>

<h3><span class="badge lv4">專家</span>九、Active Directory 的經典攻擊</h3>
<p>還有 AD，就要認得這幾個名字，它們大多是設計如此。先補一點 Kerberos：登入時 DC 發一張<b>票券授予票</b>（ticket-granting ticket，TGT），用特殊帳號 <code>krbtgt</code> 的金鑰加密；要存取檔案伺服器，就拿 TGT 換一張<b>服務票</b>，用該服務帳號的金鑰加密。誰有對的金鑰，誰就能做出看起來合法的票。</p>
<table>
<tr><th>攻擊</th><th>怎麼做</th><th>怎麼防</th></tr>
<tr><td>Kerberoasting</td><td>任何網域使用者都能替有 SPN 的服務帳號要服務票，票用該帳號密碼推導的金鑰加密，拿回家離線破解。服務帳號常常密碼弱、多年沒換、權限又大。</td><td>改用 gMSA（密碼長而隨機、AD 自動輪替）；手動設定的服務帳號用很長的隨機密碼</td></tr>
<tr><td>Pass-the-Hash</td><td>NTLM 接受密碼雜湊本身當證明。從中毒電腦的記憶體挖出雜湊，直接登入別台。</td><td>本機管理員密碼每台不同（LAPS）；管理員不登入一般工作站；能關 NTLM 就關</td></tr>
<tr><td>Golden Ticket</td><td>偷到 <code>krbtgt</code> 的金鑰，就能自己做出任何人、任何群組的 TGT</td><td>DC 最高等級保護；懷疑外洩就把 <code>krbtgt</code> 密碼重設<b>兩次</b>（它保留前一組，只換一次舊票還有效）</td></tr>
<tr><td>DCSync</td><td>有「目錄複寫」權限的帳號假裝自己是 DC，要真 DC 把所有密碼雜湊同步過來</td><td>複寫權限只留給 DC；監控非 DC 發出的複寫請求</td></tr>
<tr><td>Golden SAML</td><td>偷到 AD FS 的簽章金鑰，就能自己簽 SAML 證明登入任何信任它的雲端服務。2020 年 SolarWinds 事件的攻擊者用過。</td><td>從 AD FS 移到雲端驗證；簽章金鑰放 HSM</td></tr>
</table>
<p>共同的防禦框架是<b>分層模型</b>（tiering）：第 0 層是能控制身分本身的東西（DC、AD FS、Entra Connect 同步伺服器、PAM），第 1 層是伺服器，第 2 層是員工電腦。規則只有一條：高層的管理員帳號絕不登入低層的機器，因為你一登入，雜湊或票券就留在那台機器的記憶體裡。防守方也能用開源的 BloodHound，把「從實習生帳號走到網域管理員」的路徑畫成圖，先自己找到、先切斷。</p>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>有了 SSO 就安全了</td><td>SSO 把所有鑰匙集中在 IdP，IdP 就成了最值錢的目標。它本身要最強的 MFA、最少的管理員、最嚴的監控。</td></tr>
<tr><td>開了 MFA 就不會被盜</td><td>簡訊、TOTP、推播都擋不住中間人釣魚，也擋不住 token 竊取。要防釣魚的 MFA 加上裝置條件，才擋得住大部分。</td></tr>
<tr><td>在 IdP 停用帳號，人就進不來了</td><td>已經發出去的應用程式工作階段和 refresh token 還活著，要另外撤銷，重要系統要人工確認。</td></tr>
<tr><td>Entra ID 就是雲端版的 AD</td><td>協定、結構都不同。混合式環境是兩套系統。</td></tr>
<tr><td>用 email 認人很直覺，沒問題</td><td>email 會變、會被回收、有時能被使用者自己改。用 <code>iss</code> 加 <code>sub</code>。</td></tr>
<tr><td>緊急帳號是後門，不該存在</td><td>沒有它，一條寫錯的政策就能讓整家公司進不了自己的系統。危險的是沒人監控，不是它的存在。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>你寫的 Node.js 或 Go 後台要接公司登入</b>：用成熟的函式庫，例如 Node.js 的 <code>openid-client</code>、Go 的 <code>golang.org/x/oauth2</code> 加 <code>github.com/coreos/go-oidc</code>。走授權碼加 PKCE，驗 ID token 的簽章、<code>iss</code>、<code>aud</code>、<code>exp</code>、<code>nonce</code>，用 <code>iss</code> 加 <code>sub</code> 對應你資料庫裡的使用者。</li>
<li><b>Vue 單頁應用</b>：與其把 token 存在 localStorage（第 5.3 課說過會暴露給 XSS），不如加一層小後端（backend for frontend，BFF）跑 OIDC，前端只拿 <code>HttpOnly</code> cookie。</li>
<li><b>CI/CD 和雲端</b>：GitHub Actions 可以用 OIDC 向 AWS、GCP、Azure 換短效憑證，雲端那邊設定「只信任這個 repo、這個分支發的 token」。從此 repo 的 secrets 裡不必再放長期存取金鑰。這跟本章的 OIDC 是同一套協定，只是登入的是工作流程，不是人。</li>
<li><b>Kubernetes 和內部工具</b>：Kubernetes API server、Grafana、Argo CD 都能直接信任 OIDC，把 IdP 的群組對應成角色，調動離職時權限跟著自動變。</li>
<li><b>遊戲的玩家帳號</b>：「用 Google 登入」「用 Apple 登入」也是 OIDC。Cocos 或 Unity 做的客戶端拿到 ID token 後，交給你的 Node.js 或 Go 伺服器驗，驗法跟本章一模一樣，而且同樣要用 <code>sub</code> 認人。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<p>先自己講一遍，再打開參考答案。</p>
<ol>
<li>「說明 SAML 的 SP 發起登入流程。SP 收到回應後要檢查哪些東西？」</li>
<li>「OAuth 授權碼流程為什麼要加 PKCE？<code>state</code> 和 <code>nonce</code> 各防什麼？」</li>
<li>「員工今天下午離職，請說明你的處理流程。在 IdP 停用帳號之後，還剩下哪些風險？」</li>
<li>「使用者明明開了 MFA，帳號還是被盜了。可能是怎麼發生的？你會怎麼防？」</li>
<li>「RBAC 和 ABAC 差在哪裡？各自適合什麼情況？」</li>
<li>「如果你們的身分提供者整個無法登入，你的應變計畫是什麼？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>SP 產生帶隨機 ID 的 AuthnRequest，轉址送使用者到 IdP；IdP 驗證後產生簽章過的 SAMLResponse，由瀏覽器自動送出的表單 POST 到 SP 的 ACS URL；SP 驗證後建立自己的工作階段。SP 要檢查：簽章用的是登記過的憑證、涵蓋實際被讀取的 Assertion；Issuer；Audience；Destination 與 Recipient；有效時間；InResponseTo 對得上且只用一次。並補一句：這些交給成熟的函式庫。</li>
<li>授權碼經過瀏覽器，可能被攔截；PKCE 讓換 token 時必須出示原始的 code_verifier，IdP 只收過它的雜湊，所以只偷到授權碼沒用。<code>state</code> 綁住「這次回呼是我發起的」，防登入 CSRF；<code>nonce</code> 寫進 ID token，防止重放舊的 ID token。</li>
<li>人資送出離職，IdP 停用帳號、撤銷工作階段和 refresh token、移除 MFA 方法，SCIM 停用各系統帳號；再處理沒接 SSO 的系統、雲端金鑰、VPN 憑證，輪替共用密碼，收回裝置。剩下的風險：應用程式自己的工作階段；他建的 API 金鑰、個人 token、OAuth 授權；用他身分跑的排程；郵件轉寄規則。</li>
<li>中間人釣魚偷走登入後的 cookie、MFA 疲勞、騙服務台重設 MFA、竊取程式偷走 cookie，或同意授權、裝置代碼釣魚。防法：防釣魚的 MFA；數字比對；要求合規裝置；縮短敏感系統的工作階段；服務台的身分確認流程；限制使用者同意 OAuth 應用程式；偵測新 MFA 方法、信箱規則、異常地點。</li>
<li>RBAC 把權限組成角色再指派，好懂好稽核，但角色會隨例外暴增。ABAC 每次用屬性即時計算，彈性大，但難回答「誰能存取什麼」，而且標籤本身變成權限。實務上 RBAC 管大方向，ABAC 加條件，例如「後端工程師＋公司裝置＋只限自己團隊標籤的資源」。</li>
<li>事前準備兩個以上只存在雲端的緊急帳號：FIDO2 安全金鑰、排除在大多數政策外、分開保管、登入就發警報、每季測試；並列出雲端 root、網域註冊商這些關鍵系統獨立於 IdP 的備用登入方式。出事時先判斷是 IdP 故障還是自己設定錯，用緊急帳號修正，全程留紀錄，事後重新封存憑證。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>RFC 7636 附錄裡有一組範例：<code>code_verifier</code> 是 <code>dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk</code>。在你的 Mac 上自己算出 <code>code_challenge</code>，對照第四節授權網址裡的值。</li>
<li>打開 <code>https://accounts.google.com/.well-known/openid-configuration</code>，找出授權端點、token 端點、<code>jwks_uri</code>，以及它支援哪些 ID token 簽章演算法。</li>
<li>你的 Wiki 收到一份簽章正確的 SAML 回應，但 Audience 是 <code>https://crm.example.com/saml</code>。Wiki 該怎麼做？如果不檢查，攻擊者可以怎麼利用？</li>
<li>替一家 30 人的遊戲工作室寫一份離職檢查表，分成「SCIM 會自動處理」和「一定要人工做」兩欄。工作室用 Google Workspace、Slack、GitHub、AWS、一套沒有 SSO 的記帳軟體，還有一組大家共用的 App 商店開發者帳號。</li>
<li>你寫了一條條件式存取政策：「所有使用者、所有應用程式，要求合規裝置」，準備直接啟用。指出至少三個會出事的地方，並說明你會怎麼改。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li><code>printf %s 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk' | openssl dgst -sha256 -binary | openssl base64 | tr '+/' '-_' | tr -d '='</code>，結果是 <code>E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM</code>，跟授權網址裡的一樣。重點在三步：SHA-256 取原始位元組、Base64、把 <code>+</code> <code>/</code> 換成 <code>-</code> <code>_</code> 並拿掉結尾的 <code>=</code>（這就是 Base64URL）。</li>
<li><code>authorization_endpoint</code>、<code>token_endpoint</code>、<code>jwks_uri</code> 都在那份 JSON 裡；<code>id_token_signing_alg_values_supported</code> 列出簽章演算法（Google 目前是 RS256）。你的函式庫平常就是自動讀這份文件來設定自己的。</li>
<li>拒絕並記一筆警告。這份證明是發給 CRM 的；不檢查 Audience，攻破 CRM 的人就能拿使用者發給 CRM 的證明來登入 Wiki，一套系統的弱點變成所有系統的弱點。</li>
<li>自動：Google Workspace、Slack、GitHub 組織成員資格（若接了 SSO 與 SCIM）、AWS IAM Identity Center。人工：確認工作階段已撤銷；他建的 GitHub 個人 token、部署金鑰；AWS 裡他的存取金鑰；記帳軟體帳號；App 商店共用帳號要換密碼，並檢查有沒有綁他的手機；資料交接；收回筆電。共用帳號改成每人一個成員身分，清單才會變短。</li>
<li>一、會把所有人鎖在外面，要先用「僅限報告」模式。二、沒排除緊急帳號。三、新人還沒有合規裝置，連註冊 MFA 都進不去。四、手機、會議室設備、服務帳號會全部失敗。五、範圍太大，先從雲端主控台、程式碼代管開始。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>Microsoft Entra 官方文件</b>（<a href="https://learn.microsoft.com/entra/">learn.microsoft.com/entra</a>）：條件式存取、緊急存取帳號、PIM 的設計指引，不用 Microsoft 也值得參考。</li>
<li><b>OpenID Connect Core 1.0 規格</b>（<a href="https://openid.net/specs/openid-connect-core-1_0.html">openid.net</a>），搭配 RFC 7636（PKCE）與 RFC 9700。第四節每個參數為什麼存在，都在這裡。</li>
<li><b>OWASP Cheat Sheet Series</b>（<a href="https://cheatsheetseries.owasp.org/">cheatsheetseries.owasp.org</a>）的 SAML Security、Authentication、Session Management 三篇。</li>
<li><b>RFC 7643 與 RFC 7644</b>：SCIM 的資料格式和協定，實作端點前讀一遍。</li>
<li><b>NIST SP 800-63B</b>：各種驗證方式的強度分級，以及為什麼簡訊被列為受限制的方式。</li>
</ul>
` });
