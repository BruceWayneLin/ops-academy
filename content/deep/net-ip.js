DEEP({ 'net-ip': `
<p>課文教了你 CIDR 怎麼讀、哪些是私有位址、NAT 在做什麼、VPC 怎麼分公開和私有，以及 Docker 那個常見的意外。這一章把每一塊拆到底：不靠計算機，用二進位在紙上算出任何一個子網路的範圍；替一個正式環境的 VPC 規劃位址，而且留好長大的空間；NAT 裡面那張連線追蹤表長什麼樣子，為什麼連接埠會「用完」；IPv6 你真的需要知道的部分；一台 Linux 主機和一個雲端 VPC 怎麼決定封包往哪裡送；最後是 Docker 發布連接埠時，封包在核心裡到底走了哪條路，為什麼 ufw 根本沒機會擋它。模組 0〈網際網路是什麼〉的深入圖解講過路由器的「最長前綴優先」，這一章從那裡接著走。</p>

<h3><span class="badge lv1">基礎</span>一、位址就是一個 32 位元的數字</h3>
<p><code>10.0.1.77</code> 這種寫法，叫「點分十進位」，只是為了人好讀。對電腦來說，它是一個 32 位元的數字，切成四段、每段 8 個位元，每段剛好是 0 到 255。每一段的 8 個位元，由左到右分別代表 128、64、32、16、8、4、2、1。77 = 64 + 8 + 4 + 1，所以寫成 <code>01001101</code>。</p>
<p>子網路遮罩（subnet mask）也是一個 32 位元的數字：前面一串 1，後面一串 0。<code>/24</code> 就是「前 24 個位元是 1」，寫成十進位是 <code>255.255.255.0</code>。把位址和遮罩逐位元做 AND，就得到網路位址：</p>
<figure class="figure"><svg viewBox="0 0 680 250" class="fg" style="width:100%;max-width:680px" role="img" aria-label="10.0.1.77 的 32 個位元和 /24 遮罩逐位元做 AND，前 24 個位元照抄，後 8 個位元歸零，得到網路位址 10.0.1.0">
<text x="333" y="22" text-anchor="middle" class="fg-t sm alt">網路部分：前 24 個位元</text>
<path d="M160 38 V30 H506 V38" class="fg-l alt"/>
<text x="569" y="22" text-anchor="middle" class="fg-t sm acc">主機部分：8 個位元</text>
<path d="M514 38 V30 H624 V38" class="fg-l on"/>
<text x="10" y="76" class="fg-t">位址 10.0.1.77</text>
<rect x="160" y="56" width="110" height="30" rx="5" class="fg-b alt"/><text x="215" y="76" text-anchor="middle" class="fg-t mono">00001010</text>
<rect x="278" y="56" width="110" height="30" rx="5" class="fg-b alt"/><text x="333" y="76" text-anchor="middle" class="fg-t mono">00000000</text>
<rect x="396" y="56" width="110" height="30" rx="5" class="fg-b alt"/><text x="451" y="76" text-anchor="middle" class="fg-t mono">00000001</text>
<rect x="514" y="56" width="110" height="30" rx="5" class="fg-b hot"/><text x="569" y="76" text-anchor="middle" class="fg-t mono">01001101</text>
<text x="10" y="120" class="fg-t">遮罩 255.255.255.0</text>
<rect x="160" y="100" width="110" height="30" rx="5" class="fg-b"/><text x="215" y="120" text-anchor="middle" class="fg-t mono">11111111</text>
<rect x="278" y="100" width="110" height="30" rx="5" class="fg-b"/><text x="333" y="120" text-anchor="middle" class="fg-t mono">11111111</text>
<rect x="396" y="100" width="110" height="30" rx="5" class="fg-b"/><text x="451" y="120" text-anchor="middle" class="fg-t mono">11111111</text>
<rect x="514" y="100" width="110" height="30" rx="5" class="fg-b"/><text x="569" y="120" text-anchor="middle" class="fg-t mono">00000000</text>
<line x1="160" y1="146" x2="624" y2="146" class="fg-l"/>
<text x="640" y="150" class="fg-t sm">AND</text>
<text x="10" y="182" class="fg-t acc">網路 10.0.1.0</text>
<rect x="160" y="162" width="110" height="30" rx="5" class="fg-b alt"/><text x="215" y="182" text-anchor="middle" class="fg-t mono">00001010</text>
<rect x="278" y="162" width="110" height="30" rx="5" class="fg-b alt"/><text x="333" y="182" text-anchor="middle" class="fg-t mono">00000000</text>
<rect x="396" y="162" width="110" height="30" rx="5" class="fg-b alt"/><text x="451" y="182" text-anchor="middle" class="fg-t mono">00000001</text>
<rect x="514" y="162" width="110" height="30" rx="5" class="fg-b warm"/><text x="569" y="182" text-anchor="middle" class="fg-t mono">00000000</text>
<text x="340" y="228" text-anchor="middle" class="fg-t sm">遮罩是 1 的位置照抄，是 0 的位置歸零：剩下的就是「這台機器屬於哪個網路」</text>
</svg><figcaption>電腦判斷「對方跟我在不在同一個網路」，就是把自己的位址和對方的位址各跟遮罩做一次 AND，看結果一不一樣。一樣就直接送，不一樣就交給預設閘道（default gateway）。</figcaption></figure>
<p>這個判斷每一台機器每送一個封包都在做。想像一棟大樓的門牌：前面的「幾號幾樓」是網路，最後的「幾室」是主機。郵差先看前半段決定送到哪一棟、哪一層，到了那一層才看最後幾碼找門。</p>

<h3><span class="badge lv1">基礎</span>二、算子網路不用計算機：區塊大小法</h3>
<p>任何一個 CIDR，你只需要回答三個問題：多大、從哪裡開始、到哪裡結束。用「區塊大小」這個技巧，全部可以心算：</p>
<ol>
<li><b>主機位元數</b> = 32 − 前綴長度。<code>/26</code> 就是 6 個位元。</li>
<li><b>大小</b> = 2 的主機位元數次方。2<sup>6</sup> = 64 個位址。</li>
<li><b>區塊大小</b>：看「切在哪一段」。/26 切在第四段，第四段的區塊大小就是 64，代表這一段的網路只能從 0、64、128、192 開始。</li>
<li>找出你的位址落在哪一塊：比它小、又最接近的那個倍數，就是網路位址；下一個倍數減 1，就是最後一個位址。</li>
</ol>
<h4>例一：10.0.1.77/26</h4>
<p>第四段是 77，64 的倍數裡，比 77 小又最接近的是 64。所以網路是 <code>10.0.1.64</code>，最後一個位址是 64 + 64 − 1 = 127，也就是 <code>10.0.1.127</code>（傳統上當廣播位址）。中間 <code>.65</code> 到 <code>.126</code>，共 62 個可以給機器用。遮罩的第四段是 256 − 64 = 192，寫成 <code>255.255.255.192</code>。</p>
<h4>例二：172.31.37.200/20</h4>
<p>主機位元 12 個，切在第三段（因為 /16 到 /24 之間）。第三段用掉的主機位元是 12 − 8 = 4 個，區塊大小 2<sup>4</sup> = 16。第三段是 37，16 的倍數裡最接近又不超過的是 32。所以網路是 <code>172.31.32.0</code>，最後一個位址是 <code>172.31.47.255</code>（32 + 16 − 1 = 47），一共 4,096 個位址。遮罩第三段是 256 − 16 = 240，寫成 <code>255.255.240.0</code>。</p>
<h4>例三：10.0.3.5 在不在 10.0.0.0/22 裡面？</h4>
<p>/22 切在第三段，區塊大小 2<sup>10 − 8</sup> = 4，範圍是第三段 0 到 3，也就是 <code>10.0.0.0</code> 到 <code>10.0.3.255</code>。10.0.3.5 在裡面。10.0.4.1 就不在，它屬於下一塊 10.0.4.0/22。</p>
<table>
<tr><th>前綴</th><th>遮罩</th><th>位址數</th><th>常見用途</th></tr>
<tr><td>/16</td><td>255.255.0.0</td><td>65,536</td><td>一整個 VPC</td></tr>
<tr><td>/20</td><td>255.255.240.0</td><td>4,096</td><td>放很多容器的私有子網路</td></tr>
<tr><td>/22</td><td>255.255.252.0</td><td>1,024</td><td>中型子網路</td></tr>
<tr><td>/24</td><td>255.255.255.0</td><td>256</td><td>一般子網路、家用網路</td></tr>
<tr><td>/26</td><td>255.255.255.192</td><td>64</td><td>小型子網路</td></tr>
<tr><td>/28</td><td>255.255.255.240</td><td>16</td><td>AWS 允許的最小子網路</td></tr>
<tr><td>/32</td><td>255.255.255.255</td><td>1</td><td>防火牆規則裡指定「就這一台」</td></tr>
</table>
<p>雲端還會再扣掉幾個。AWS 每個子網路保留前四個和最後一個位址：網路位址本身、<code>.1</code> 給 VPC 的路由器、<code>.2</code> 給 DNS、<code>.3</code> 保留給未來、最後一個是廣播。所以一個 /24 實際能用 251 個，/28 只剩 11 個。Azure 也保留 5 個，GCP 保留 4 個。規劃時別忘了這幾個。</p>

<h3><span class="badge lv2">進階</span>三、規劃一個 VPC：現在夠用，三年後也夠用</h3>
<p>VPC 的位址一旦有機器在用，就很難改。子網路建好之後不能改大小，要換只能建新的、把機器搬過去。所以規劃要一次想清楚。下面是一個放在三個可用區域（availability zone，AZ）的正式環境：</p>
<figure class="figure"><svg viewBox="0 0 680 290" class="fg" style="width:100%;max-width:680px" role="img" aria-label="10.20.0.0/16 的位址規劃：第一塊 /18 切成三個可用區域的應用程式子網路和一個預留，第二塊 /18 放公開子網路和資料庫子網路，後半個 /17 整個留空">
<text x="20" y="28" class="fg-t">VPC 10.20.0.0/16，一共 65,536 個位址</text>
<rect x="20" y="40" width="160" height="44" rx="5" class="fg-b hot"/>
<text x="100" y="58" text-anchor="middle" class="fg-t sm mono">10.20.0.0/18</text>
<text x="100" y="75" text-anchor="middle" class="fg-t sm">應用程式</text>
<rect x="180" y="40" width="160" height="44" rx="5" class="fg-b alt"/>
<text x="260" y="58" text-anchor="middle" class="fg-t sm mono">10.20.64.0/18</text>
<text x="260" y="75" text-anchor="middle" class="fg-t sm">公開＋資料庫</text>
<rect x="340" y="40" width="320" height="44" rx="5" class="fg-b dash"/>
<text x="500" y="58" text-anchor="middle" class="fg-t sm mono">10.20.128.0/17</text>
<text x="500" y="75" text-anchor="middle" class="fg-t sm">整個留空：新服務、第二個叢集</text>
<text x="20" y="118" class="fg-t sm">放大第一塊 10.20.0.0/18（照比例）</text>
<rect x="20" y="128" width="154" height="54" rx="5" class="fg-b hot"/>
<text x="97" y="148" text-anchor="middle" class="fg-t sm">應用程式 AZ a</text>
<text x="97" y="166" text-anchor="middle" class="fg-t sm mono">10.20.0.0/20</text>
<rect x="182" y="128" width="154" height="54" rx="5" class="fg-b hot"/>
<text x="259" y="148" text-anchor="middle" class="fg-t sm">應用程式 AZ b</text>
<text x="259" y="166" text-anchor="middle" class="fg-t sm mono">10.20.16.0/20</text>
<rect x="344" y="128" width="154" height="54" rx="5" class="fg-b hot"/>
<text x="421" y="148" text-anchor="middle" class="fg-t sm">應用程式 AZ c</text>
<text x="421" y="166" text-anchor="middle" class="fg-t sm mono">10.20.32.0/20</text>
<rect x="506" y="128" width="154" height="54" rx="5" class="fg-b dash"/>
<text x="583" y="148" text-anchor="middle" class="fg-t sm">預留：第四個 AZ</text>
<text x="583" y="166" text-anchor="middle" class="fg-t sm mono">10.20.48.0/20</text>
<text x="20" y="214" class="fg-t sm">放大第二塊 10.20.64.0/18（不照比例，省略開頭的 10.20）</text>
<rect x="20" y="224" width="80" height="50" rx="5" class="fg-b alt"/><text x="60" y="244" text-anchor="middle" class="fg-t sm">公開 a</text><text x="60" y="262" text-anchor="middle" class="fg-t sm mono">.64.0/24</text>
<rect x="106" y="224" width="80" height="50" rx="5" class="fg-b alt"/><text x="146" y="244" text-anchor="middle" class="fg-t sm">公開 b</text><text x="146" y="262" text-anchor="middle" class="fg-t sm mono">.65.0/24</text>
<rect x="192" y="224" width="80" height="50" rx="5" class="fg-b alt"/><text x="232" y="244" text-anchor="middle" class="fg-t sm">公開 c</text><text x="232" y="262" text-anchor="middle" class="fg-t sm mono">.66.0/24</text>
<rect x="278" y="224" width="80" height="50" rx="5" class="fg-b warm"/><text x="318" y="244" text-anchor="middle" class="fg-t sm">資料庫 a</text><text x="318" y="262" text-anchor="middle" class="fg-t sm mono">.72.0/24</text>
<rect x="364" y="224" width="80" height="50" rx="5" class="fg-b warm"/><text x="404" y="244" text-anchor="middle" class="fg-t sm">資料庫 b</text><text x="404" y="262" text-anchor="middle" class="fg-t sm mono">.73.0/24</text>
<rect x="450" y="224" width="80" height="50" rx="5" class="fg-b warm"/><text x="490" y="244" text-anchor="middle" class="fg-t sm">資料庫 c</text><text x="490" y="262" text-anchor="middle" class="fg-t sm mono">.74.0/24</text>
<rect x="536" y="224" width="124" height="50" rx="5" class="fg-b dash"/><text x="598" y="244" text-anchor="middle" class="fg-t sm">其餘 58 個 /24</text><text x="598" y="262" text-anchor="middle" class="fg-t sm">留空</text>
</svg><figcaption>應用程式子網路給得最大，因為容器最吃位址；公開子網路只放負載平衡器和 NAT 閘道，小小的就夠；資料庫自成一組，防火牆規則好寫。整個 VPC 還有一半以上沒動。</figcaption></figure>
<h4>這份規劃背後的六條規則</h4>
<ol>
<li><b>容器最吃位址。</b>在 AWS 的 EKS 上，預設的網路外掛會讓每一個 Pod 拿一個真的 VPC 位址。一台機器跑 30 個 Pod，就吃掉 30 個以上。/24 的子網路，幾台機器就滿了，所以應用程式子網路給 /20 起跳。</li>
<li><b>公開子網路要小。</b>裡面只該有負載平衡器、NAT 閘道、跳板機。東西少，被不小心放進公開子網路的機會也少。</li>
<li><b>每一種角色、每一個 AZ 一個子網路。</b>防火牆規則和路由表都是以子網路為單位，角色分開，規則才寫得乾淨；每個 AZ 一份，一個機房出事，其他 AZ 照樣運作。</li>
<li><b>對齊邊界，留下整塊的空間。</b>把同一類的子網路放在同一個大區塊裡（上圖的兩個 /18），以後要擴充，旁邊就有連續的空位，路由和防火牆規則也能用一條大網段涵蓋整類。</li>
<li><b>跟所有可能連起來的網路都不重疊。</b>VPC 對等互連（peering）、Transit Gateway、公司辦公室、VPN、合作夥伴的網路，只要位址重疊，就連不起來，或連起來之後封包不知道該往哪裡送。先列一張公司的位址總表：正式環境 10.20.0.0/16、測試環境 10.21.0.0/16、開發環境 10.22.0.0/16、辦公室 10.100.0.0/16，誰都不准越界。</li>
<li><b>避開大家的預設值。</b><code>10.0.0.0/16</code> 是很多雲端精靈的預設，以後要跟別的團隊或併購來的公司打通，十之八九撞在一起。<code>172.17.0.0/16</code> 是 Docker 預設橋接網路，VPC 用它，主機上的容器就連不到 VPC 裡那段位址的機器。<code>192.168.0.0/24</code> 和 <code>192.168.1.0/24</code> 是家用路由器的預設，在家連 VPN 的同事會撞上。Kubernetes 自己的網段也要算進來，例如 kubeadm 預設的 Service 網段是 <code>10.96.0.0/12</code>。</li>
</ol>
<p>如果真的規劃錯了：AWS 可以替一個 VPC 加第二段、第三段 CIDR，新子網路建在新的那一段，再慢慢把服務搬過去。能救，但痛。</p>

<h3><span class="badge lv2">進階</span>四、路由表：主機上一張，VPC 裡一張</h3>
<p>模組 0 的深入圖解講過路由器怎麼查表：最長前綴優先。其實每一台 Linux 主機也有自己的路由表，規則一模一樣。用 <code>ip route</code> 看：</p>
<pre><code>$ ip route
default via 10.20.1.1 dev eth0 proto dhcp src 10.20.1.15 metric 100
10.20.0.0/20 dev eth0 proto kernel scope link src 10.20.1.15
172.17.0.0/16 dev docker0 proto kernel scope link src 172.17.0.1 linkdown</code></pre>
<ul>
<li><b>第一行</b>：預設路由。不知道往哪送的，全部交給 <code>10.20.1.1</code>，也就是這個子網路的 VPC 路由器（AWS 保留的 .1）。</li>
<li><b>第二行</b>：自己所在的子網路，<code>scope link</code> 代表「在同一條線上，直接用 ARP 找對方，不用經過路由器」。<code>proto kernel</code> 代表這條是設定網卡位址時，核心自動加的。</li>
<li><b>第三行</b>：Docker 的橋接網路。<code>linkdown</code> 代表現在沒有容器接在上面。</li>
</ul>
<p>想知道「一個封包到底會走哪一條」，不用自己比對，直接問核心：</p>
<pre><code>$ ip route get 8.8.8.8
8.8.8.8 via 10.20.1.1 dev eth0 src 10.20.1.15 uid 1000
$ ip route get 10.20.3.40
10.20.3.40 dev eth0 src 10.20.1.15 uid 1000</code></pre>
<p>第一個要經過閘道（via），第二個在同一個子網路裡，直接送。<code>src</code> 告訴你這個封包會用哪一個來源位址，主機有好幾張網卡時特別重要。</p>
<h4>一個關鍵的領悟：從主機裡面，看不出自己在公開還是私有子網路</h4>
<p>公開子網路的機器和私有子網路的機器，<code>ip route</code> 長得一模一樣：預設路由都指向 .1。差別在 <b>VPC 的路由表</b>，也就是那個 .1 收到封包之後怎麼轉：</p>
<figure class="figure"><svg viewBox="0 0 680 380" class="fg" style="width:100%;max-width:680px" role="img" aria-label="VPC 裡的公開子網路和私有子網路：公開子網路的路由表把 0.0.0.0/0 指向網際網路閘道，私有子網路的路由表把 0.0.0.0/0 指向 NAT 閘道">
<rect x="240" y="8" width="160" height="34" rx="17" class="fg-b"/><text x="320" y="30" text-anchor="middle" class="fg-t">網際網路</text>
<rect x="10" y="60" width="660" height="312" rx="10" class="fg-b"/>
<text x="24" y="82" class="fg-t lg">VPC 10.20.0.0/16</text>
<rect x="250" y="66" width="180" height="32" rx="6" class="fg-b hot"/><text x="340" y="87" text-anchor="middle" class="fg-t">網際網路閘道 IGW</text>
<line x1="320" y1="50" x2="320" y2="58" class="fg-l"/><polygon points="320,66 315.5,58 324.5,58" class="fg-a"/><polygon points="320,42 315.5,50 324.5,50" class="fg-a"/>
<rect x="30" y="118" width="620" height="94" rx="8" class="fg-b"/>
<text x="212" y="138" class="fg-t">公開子網路 10.20.64.0/24</text>
<rect x="60" y="150" width="140" height="46" rx="6" class="fg-b alt"/><text x="130" y="178" text-anchor="middle" class="fg-t">負載平衡器</text>
<rect x="260" y="150" width="160" height="46" rx="6" class="fg-b warm"/><text x="340" y="178" text-anchor="middle" class="fg-t">NAT 閘道</text>
<rect x="450" y="128" width="190" height="74" rx="6" class="fg-b"/>
<text x="462" y="148" class="fg-t sm">路由表（公開）</text>
<text x="462" y="168" class="fg-t sm mono">10.20.0.0/16 → local</text>
<text x="462" y="188" class="fg-t sm mono acc">0.0.0.0/0 → IGW</text>
<rect x="30" y="242" width="620" height="120" rx="8" class="fg-b"/>
<text x="212" y="264" class="fg-t">私有子網路 10.20.0.0/20</text>
<rect x="60" y="282" width="140" height="46" rx="6" class="fg-b alt"/><text x="130" y="302" text-anchor="middle" class="fg-t">應用程式</text><text x="130" y="320" text-anchor="middle" class="fg-t sm">10.20.1.15</text>
<rect x="260" y="282" width="160" height="46" rx="6" class="fg-b"/><text x="340" y="302" text-anchor="middle" class="fg-t">資料庫</text><text x="340" y="320" text-anchor="middle" class="fg-t sm">沒有公開 IP</text>
<rect x="450" y="270" width="190" height="74" rx="6" class="fg-b"/>
<text x="462" y="290" class="fg-t sm">路由表（私有）</text>
<text x="462" y="310" class="fg-t sm mono">10.20.0.0/16 → local</text>
<text x="462" y="330" class="fg-t sm mono warm">0.0.0.0/0 → NAT 閘道</text>
<path d="M290 98 V108 H130 V142" class="fg-l alt"/><polygon points="130,150 125.5,142 134.5,142" class="fg-a alt"/>
<line x1="130" y1="196" x2="130" y2="274" class="fg-l alt"/><polygon points="130,282 125.5,274 134.5,274" class="fg-a alt"/>
<text x="138" y="230" class="fg-t sm alt">進來</text>
<path d="M180 282 V226 H230 V173 H252" class="fg-l warm"/><polygon points="260,173 252,168.5 252,177.5" class="fg-a warm"/>
<text x="238" y="226" class="fg-t sm warm">出去</text>
<line x1="380" y1="150" x2="380" y2="106" class="fg-l warm"/><polygon points="380,98 375.5,106 384.5,106" class="fg-a warm"/>
<line x1="200" y1="305" x2="252" y2="305" class="fg-l"/><polygon points="260,305 252,300.5 252,309.5" class="fg-a"/>
</svg><figcaption>兩個子網路唯一的差別，是路由表裡 0.0.0.0/0 那一行指向誰。指向網際網路閘道，就是公開子網路；指向 NAT 閘道或根本沒有這一行，就是私有子網路。</figcaption></figure>
<p>還有幾件只有在雲端才會遇到的事：</p>
<ul>
<li><b>機器不知道自己的公開 IP。</b>在 AWS，你替機器配了公開 IP，登進去跑 <code>ip addr</code>，看到的還是只有私有位址。公開 IP 是網際網路閘道在做一對一的位址轉換。要知道自己的公開 IP，得問中繼資料服務（169.254.169.254）或外面的網站。這也是為什麼「應用程式自己記錄的伺服器 IP」常常跟你在主控台看到的不一樣。</li>
<li><b><code>local</code> 那一行不能刪。</b>VPC 內部所有子網路互通，是靠這一行。要擋子網路之間的流量，用安全群組或網路 ACL，不是改路由。</li>
<li><b>公開 IPv4 開始收錢了。</b>AWS 從 2024 年起，每一個公開 IPv4 位址每小時收 0.005 美元，一個月大約 3.6 美元，不管有沒有掛在機器上。這又多了一個「只讓負載平衡器和 NAT 有公開 IP」的理由。</li>
</ul>

<h3><span class="badge lv3">專業</span>五、NAT 的內部：一張連線追蹤表</h3>
<p>課文說 NAT「記住這次調換」。它記在哪裡、記什麼？答案是一張<b>連線追蹤表</b>（connection tracking table，Linux 裡叫 conntrack）。每一條穿過 NAT 的連線，都在表裡佔一列，用五個欄位認出它：協定、來源 IP、來源埠、目的 IP、目的埠，合稱<b>五元組</b>（5-tuple）。</p>
<figure class="figure"><svg viewBox="0 0 680 330" class="fg" style="width:100%;max-width:680px" role="img" aria-label="NAT 出去時把來源改成公開位址和新的埠號並記在連線追蹤表，回來時查表把目的改回內部位址；表中兩條連線共用同一個外部埠，因為目的地不同">
<text x="120" y="20" text-anchor="middle" class="fg-t sm">私有網路這一側</text>
<text x="340" y="20" text-anchor="middle" class="fg-t sm">NAT</text>
<text x="560" y="20" text-anchor="middle" class="fg-t sm">網際網路這一側</text>
<rect x="10" y="32" width="220" height="52" rx="6" class="fg-b alt"/>
<text x="22" y="53" class="fg-t sm mono">來源 10.20.1.15:51000</text>
<text x="22" y="73" class="fg-t sm mono">目的 198.51.100.20:443</text>
<rect x="280" y="32" width="120" height="52" rx="6" class="fg-b hot"/>
<text x="340" y="53" text-anchor="middle" class="fg-t sm">改寫來源</text>
<text x="340" y="73" text-anchor="middle" class="fg-t sm">記一筆</text>
<rect x="450" y="32" width="220" height="52" rx="6" class="fg-b"/>
<text x="462" y="53" class="fg-t sm mono warm">來源 203.0.113.9:30001</text>
<text x="462" y="73" class="fg-t sm mono">目的 198.51.100.20:443</text>
<line x1="230" y1="58" x2="272" y2="58" class="fg-l"/><polygon points="280,58 272,53.5 272,62.5" class="fg-a"/>
<line x1="400" y1="58" x2="442" y2="58" class="fg-l"/><polygon points="450,58 442,53.5 442,62.5" class="fg-a"/>
<rect x="450" y="104" width="220" height="52" rx="6" class="fg-b"/>
<text x="462" y="125" class="fg-t sm mono">來源 198.51.100.20:443</text>
<text x="462" y="145" class="fg-t sm mono">目的 203.0.113.9:30001</text>
<rect x="280" y="104" width="120" height="52" rx="6" class="fg-b hot"/>
<text x="340" y="125" text-anchor="middle" class="fg-t sm">查表</text>
<text x="340" y="145" text-anchor="middle" class="fg-t sm">改回目的</text>
<rect x="10" y="104" width="220" height="52" rx="6" class="fg-b alt"/>
<text x="22" y="125" class="fg-t sm mono">來源 198.51.100.20:443</text>
<text x="22" y="145" class="fg-t sm mono warm">目的 10.20.1.15:51000</text>
<line x1="450" y1="130" x2="408" y2="130" class="fg-l"/><polygon points="400,130 408,125.5 408,134.5" class="fg-a"/>
<line x1="280" y1="130" x2="238" y2="130" class="fg-l"/><polygon points="230,130 238,125.5 238,134.5" class="fg-a"/>
<line x1="340" y1="156" x2="340" y2="176" class="fg-l dim dash"/>
<rect x="10" y="180" width="660" height="110" rx="6" class="fg-b"/>
<text x="20" y="200" class="fg-t sm acc">內部位址:埠</text>
<text x="200" y="200" class="fg-t sm acc">換成</text>
<text x="360" y="200" class="fg-t sm acc">目的地</text>
<text x="530" y="200" class="fg-t sm acc">狀態</text>
<line x1="10" y1="208" x2="670" y2="208" class="fg-l dim"/>
<text x="20" y="228" class="fg-t sm mono">10.20.1.15:51000</text><text x="200" y="228" class="fg-t sm mono">203.0.113.9:30001</text><text x="360" y="228" class="fg-t sm mono">198.51.100.20:443</text><text x="530" y="228" class="fg-t sm mono">ESTABLISHED</text>
<text x="20" y="254" class="fg-t sm mono">10.20.1.16:51000</text><text x="200" y="254" class="fg-t sm mono">203.0.113.9:30002</text><text x="360" y="254" class="fg-t sm mono">198.51.100.20:443</text><text x="530" y="254" class="fg-t sm mono">ESTABLISHED</text>
<text x="20" y="280" class="fg-t sm mono">10.20.1.15:51002</text><text x="200" y="280" class="fg-t sm mono warm">203.0.113.9:30001</text><text x="360" y="280" class="fg-t sm mono">192.0.2.50:443</text><text x="530" y="280" class="fg-t sm mono">ESTABLISHED</text>
<text x="340" y="318" text-anchor="middle" class="fg-t sm">第三列和第一列共用外部埠 30001：目的地不同，五元組就不同，回來的封包不會認錯人</text>
</svg><figcaption>出去時，NAT 改寫來源並記一筆；回來時，用「目的位址＋目的埠＋對方」查表，把目的改回內部那台機器。外面主動打進來的封包，表裡沒有對應的那一列，所以無處可去。</figcaption></figure>
<p>注意第二列：兩台內部機器剛好都用了來源埠 51000，NAT 必須把其中一個換成別的外部埠（30002），不然回來的封包分不清是誰的。這就是 NAT 的全名裡「連接埠」那部分的工作，業界也叫 PAT（port address translation）或 NAPT。</p>
<h4>在 Linux 上看這張表</h4>
<pre><code>$ sudo conntrack -L | head -3
tcp  6 431999 ESTABLISHED src=10.20.1.15 dst=198.51.100.20 sport=51000 dport=443 ...
$ cat /proc/sys/net/netfilter/nf_conntrack_count   # 現在有幾列
$ cat /proc/sys/net/netfilter/nf_conntrack_max     # 最多幾列</code></pre>
<p>只要機器上有用 iptables 的 NAT 或有狀態的規則（Docker、Kubernetes 的 kube-proxy 都會），每一條連線都會進這張表，不只是當路由器的機器。表滿了，核心日誌會出現 <code>nf_conntrack: table full, dropping packet</code>，新連線直接被丟掉，症狀是「一部分連線莫名其妙逾時」。TCP 連線建好之後，在表裡預設可以待 5 天（432,000 秒）不被清掉；UDP 通常只有幾十秒。一台撐大量短連線的伺服器，要嘛調大 <code>nf_conntrack_max</code>，要嘛縮短已經結束的連線在表裡停留的時間。</p>
<h4>有狀態和無狀態：安全群組與網路 ACL</h4>
<p>雲端的安全群組（security group）也是靠連線追蹤，所以它是<b>有狀態</b>（stateful）的：你允許「出去連 443」，回來的封包自動放行，不必另外寫規則。AWS 的網路 ACL 則是<b>無狀態</b>（stateless）的，它不記得誰先開口，所以你允許出去連 443 之後，還得允許「回來的封包，目的埠是 1024 到 65535 之間的任何一個」，因為回應是送到用戶端那個隨機的短暫連接埠（ephemeral port）上。很多人在 ACL 上只開了 443，結果「出得去、回不來」。</p>
<h4>連接埠耗盡</h4>
<p>一個外部 IP 的埠號只有 65,536 個，扣掉保留的，對<b>同一個目的地</b>能同時開的連線就是幾萬條。為什麼強調同一個目的地？因為上表第三列說明了：目的地不同，外部埠可以重用。真正會出事的情境，正好就是「所有東西都打同一個目的地」：</p>
<ul>
<li>私有子網路裡 200 個容器，全部透過同一個 NAT 閘道，呼叫同一個第三方 API（同一個 IP、同一個 443）。</li>
<li>每個請求都開新連線、用完就關，關掉的連線還要在 NAT 裡等一段時間才釋放那個埠。</li>
</ul>
<p>AWS 的 NAT 閘道寫得很明白：每一個公開 IP，對每一個唯一的目的地，最多同時 55,000 條連線；用完時，CloudWatch 的 <code>ErrorPortAllocation</code> 指標會開始增加，應用程式看到的是連線逾時或被拒。解法依序是：<b>重用連線</b>（keep-alive、連線池，第 1.4 課的深入圖解會細講）、替 NAT 閘道多掛幾個公開 IP、或者讓流量不經過 NAT（例如用 VPC 端點直接連雲端服務）。</p>
<h4>電信業者的 NAT：你的使用者其實共用 IP</h4>
<p>IPv4 不夠用，很多行動網路和部分家用寬頻，會在業者那一端再做一層 NAT，叫 CGNAT（carrier-grade NAT），用的私有網段是 <code>100.64.0.0/10</code>。結果是：成百上千個使用者，在你的伺服器看來是同一個公開 IP。直接的影響有兩個：用 IP 做限速或封鎖，會誤傷同一個 IP 後面的一大群無辜使用者；點對點連線的遊戲（例如 WebRTC）要打洞穿過兩層 NAT，常常失敗，只好退回中繼伺服器（TURN）轉送。</p>

<h3><span class="badge lv3">專業</span>六、IPv6：真正需要知道的部分</h3>
<p>IPv6 位址是 128 個位元，分成 8 組、每組 16 位元，用十六進位寫。它最大的改變不是「位址變長」，而是<b>位址多到每一台機器都能有全球唯一的位址，不再需要 NAT</b>。</p>
<figure class="figure"><svg viewBox="0 0 680 200" class="fg" style="width:100%;max-width:680px" role="img" aria-label="一個 IPv6 位址的八組十六位元：前三組是業者配給的 /48 前綴，第四組是自己切的子網路，後四組是介面編號，以及簡寫的規則">
<text x="140" y="22" text-anchor="middle" class="fg-t sm alt">前綴 /48：業者或雲端配給你</text>
<path d="M23 38 V30 H257 V38" class="fg-l alt"/>
<text x="300" y="22" text-anchor="middle" class="fg-t sm acc">子網路</text>
<path d="M263 38 V30 H337 V38" class="fg-l on"/>
<text x="500" y="22" text-anchor="middle" class="fg-t sm">介面編號：64 個位元</text>
<path d="M343 38 V30 H657 V38" class="fg-l"/>
<rect x="23" y="46" width="74" height="34" rx="5" class="fg-b alt"/><text x="60" y="68" text-anchor="middle" class="fg-t mono">2001</text>
<rect x="103" y="46" width="74" height="34" rx="5" class="fg-b alt"/><text x="140" y="68" text-anchor="middle" class="fg-t mono">0db8</text>
<rect x="183" y="46" width="74" height="34" rx="5" class="fg-b alt"/><text x="220" y="68" text-anchor="middle" class="fg-t mono">abcd</text>
<rect x="263" y="46" width="74" height="34" rx="5" class="fg-b hot"/><text x="300" y="68" text-anchor="middle" class="fg-t mono">0012</text>
<rect x="343" y="46" width="74" height="34" rx="5" class="fg-b"/><text x="380" y="68" text-anchor="middle" class="fg-t mono">0000</text>
<rect x="423" y="46" width="74" height="34" rx="5" class="fg-b"/><text x="460" y="68" text-anchor="middle" class="fg-t mono">0000</text>
<rect x="503" y="46" width="74" height="34" rx="5" class="fg-b"/><text x="540" y="68" text-anchor="middle" class="fg-t mono">0000</text>
<rect x="583" y="46" width="74" height="34" rx="5" class="fg-b"/><text x="620" y="68" text-anchor="middle" class="fg-t mono">0001</text>
<path d="M23 88 V96 H337 V88" class="fg-l"/>
<text x="180" y="114" text-anchor="middle" class="fg-t sm">網路部分 /64：一個子網路固定這麼大</text>
<path d="M343 88 V96 H657 V88" class="fg-l"/>
<text x="500" y="114" text-anchor="middle" class="fg-t sm">每個子網路有 2 的 64 次方個位址</text>
<text x="340" y="156" text-anchor="middle" class="fg-t lg mono">2001:db8:abcd:12::1</text>
<text x="340" y="184" text-anchor="middle" class="fg-t sm">簡寫：每組開頭的 0 可以省略；連續好幾組全是 0，用 :: 代替，整個位址只能用一次</text>
</svg><figcaption>IPv6 的子網路幾乎永遠是 /64。規劃時你不再算「裝得下幾台」，而是算「要幾個 /64」：拿到一個 /48，就有 65,536 個子網路可以切。</figcaption></figure>
<table>
<tr><th>範圍</th><th>意思</th><th>對應的 IPv4 概念</th></tr>
<tr><td><code>::1</code></td><td>自己</td><td>127.0.0.1</td></tr>
<tr><td><code>fe80::/10</code></td><td>鏈路本地（link-local）：每張網卡自動有一個，只在同一條線上有效，不會被路由</td><td>169.254.x.x，但 IPv6 每張網卡一定有</td></tr>
<tr><td><code>fc00::/7</code>（實務上是 <code>fd</code> 開頭）</td><td>唯一本地位址（ULA），內部網路用</td><td>10.0.0.0/8 這類私有位址</td></tr>
<tr><td><code>2000::/3</code></td><td>全球單播：公開位址，大部分以 2 或 3 開頭</td><td>公開 IPv4</td></tr>
<tr><td><code>2001:db8::/32</code></td><td>文件和範例專用</td><td>203.0.113.0/24 這類範例網段</td></tr>
</table>
<h4>四個會在正式環境咬你的差別</h4>
<ul>
<li><b>沒有 NAT，不代表沒有防火牆。</b>IPv4 時代，很多網路的「安全」其實是 NAT 順便給的：外面打不進來。IPv6 每台機器都有全球位址，如果沒有防火牆，外面就真的打得進來。AWS 為此提供「只出不進的網際網路閘道」（egress-only internet gateway），讓私有子網路的機器能用 IPv6 往外連，外面卻不能主動連進來。</li>
<li><b>防火牆規則是兩套。</b>iptables 只管 IPv4，IPv6 要用 ip6tables 另外寫；nftables 的 <code>inet</code> 家族可以一次涵蓋兩者。ufw 預設會同時寫兩套，但你手寫的 iptables 規則不會。常見的漏洞是：IPv4 的 22 埠擋得很好，IPv6 的 22 埠大開。</li>
<li><b>不要擋光 ICMPv6。</b>IPv6 沒有 ARP，找鄰居、拿位址、通知「封包太大」，全部靠 ICMPv6（鄰居探索，neighbor discovery）。擋光了，IPv6 就整個不通，或出現模組 0 那一章講的 MTU 黑洞。</li>
<li><b>有 AAAA 紀錄，就得真的能用。</b>用戶端看到 AAAA 紀錄，會優先試 IPv6，現代的作法（Happy Eyeballs，RFC 8305）是先試 IPv6，大約 250 毫秒沒回應就同時試 IPv4。如果你的 AAAA 指向一台沒在聽 IPv6 的伺服器，使用者每次連線都白等一段，或某些不支援 Happy Eyeballs 的用戶端直接失敗。另外，Linux 上一個監聽 <code>[::]:8080</code> 的程式，預設也會收 IPv4 的連線，日誌裡會看到 <code>::ffff:203.0.113.7</code> 這種「IPv4 包在 IPv6 裡」的位址。</li>
</ul>

<h3><span class="badge lv4">專家</span>七、Docker 發布連接埠：封包在核心裡走了哪條路</h3>
<p>課文說「Docker 自己寫防火牆規則，所以 ufw 擋不住」。這一節把它講到你能畫出來。先認識 Linux 核心裡的封包檢查站：netfilter。一個封包進到主機，會經過幾個固定的掛勾點，叫<b>鏈</b>（chain）：</p>
<ul>
<li><b>PREROUTING</b>：封包一進來，還沒決定要給誰之前。改目的位址（DNAT）就在這裡做。</li>
<li><b>路由決定</b>：看目的位址，是給這台主機自己，還是要轉給別人。</li>
<li><b>INPUT</b>：要給這台主機上的程式的封包，走這裡。</li>
<li><b>FORWARD</b>：要轉給別人（例如容器）的封包，走這裡。</li>
<li><b>POSTROUTING</b>：封包要離開之前，改來源位址（SNAT、MASQUERADE）在這裡做。</li>
</ul>
<p>ufw 是 iptables 的友善外殼。你下 <code>ufw deny 6379</code>，它把規則寫進 <b>INPUT</b> 那一串鏈裡。問題就出在這裡：</p>
<figure class="figure"><svg viewBox="0 0 680 350" class="fg" style="width:100%;max-width:680px" role="img" aria-label="封包進入主機後在 PREROUTING 被 Docker 改寫目的位址成容器，路由決定之後走 FORWARD 鏈，Docker 的規則先放行，而 ufw 寫在 INPUT 鏈的規則根本沒有被經過">
<rect x="10" y="20" width="130" height="56" rx="6" class="fg-b"/>
<text x="75" y="43" text-anchor="middle" class="fg-t">封包進來</text>
<text x="75" y="63" text-anchor="middle" class="fg-t sm mono">目的 :6379</text>
<rect x="170" y="14" width="240" height="68" rx="6" class="fg-b warm"/>
<text x="290" y="36" text-anchor="middle" class="fg-t">PREROUTING（nat 表）</text>
<text x="290" y="54" text-anchor="middle" class="fg-t sm">Docker 的 DOCKER 鏈：DNAT</text>
<text x="290" y="72" text-anchor="middle" class="fg-t sm mono">:6379 → 172.17.0.2:6379</text>
<rect x="440" y="26" width="140" height="44" rx="6" class="fg-b"/>
<text x="510" y="53" text-anchor="middle" class="fg-t">路由決定</text>
<line x1="140" y1="48" x2="162" y2="48" class="fg-l"/><polygon points="170,48 162,43.5 162,52.5" class="fg-a"/>
<line x1="410" y1="48" x2="432" y2="48" class="fg-l"/><polygon points="440,48 432,43.5 432,52.5" class="fg-a"/>
<path d="M470 70 V104 H200 V140" class="fg-l dim dash"/><polygon points="200,148 195.5,140 204.5,140" class="fg-a"/>
<text x="214" y="98" class="fg-t sm">目的仍是本機（例如 :22）</text>
<line x1="540" y1="70" x2="540" y2="140" class="fg-l warm"/><polygon points="540,148 535.5,140 544.5,140" class="fg-a warm"/>
<text x="548" y="120" class="fg-t sm warm">已改成容器</text>
<rect x="60" y="148" width="280" height="96" rx="6" class="fg-b"/>
<text x="200" y="172" text-anchor="middle" class="fg-t lg">INPUT</text>
<text x="200" y="196" text-anchor="middle" class="fg-t sm">ufw 擋 6379 的規則寫在這裡</text>
<text x="200" y="218" text-anchor="middle" class="fg-t sm warm">這個封包根本不經過</text>
<rect x="370" y="148" width="300" height="110" rx="6" class="fg-b warm"/>
<text x="520" y="172" text-anchor="middle" class="fg-t lg">FORWARD</text>
<text x="384" y="196" class="fg-t sm acc">① DOCKER-USER：你的規則放這裡</text>
<text x="384" y="218" class="fg-t sm warm">② Docker 自己的鏈：放行 6379</text>
<text x="384" y="240" class="fg-t sm">③ ufw 的 forward 規則：輪不到</text>
<line x1="200" y1="244" x2="200" y2="282" class="fg-l dim"/><polygon points="200,290 195.5,282 204.5,282" class="fg-a"/>
<rect x="60" y="290" width="280" height="44" rx="6" class="fg-b"/>
<text x="200" y="317" text-anchor="middle" class="fg-t">本機程式（sshd、nginx）</text>
<line x1="520" y1="258" x2="520" y2="282" class="fg-l warm"/><polygon points="520,290 515.5,282 524.5,282" class="fg-a warm"/>
<rect x="370" y="290" width="300" height="44" rx="6" class="fg-b hot"/>
<text x="520" y="317" text-anchor="middle" class="fg-t">docker0 → 容器 Redis 172.17.0.2</text>
</svg><figcaption>Docker 在封包還沒做路由決定之前，就把目的地改成容器的位址。核心一看「這不是給我的」，就把它送進 FORWARD，而 ufw 守的是 INPUT。兩條路從一開始就分岔了。</figcaption></figure>
<ol>
<li>外面的封包打到主機的 6379。在 PREROUTING 的 nat 表裡，Docker 有一條 DNAT 規則：把目的改成 <code>172.17.0.2:6379</code>。</li>
<li>路由決定：目的地 172.17.0.2 不是這台主機的位址，是 docker0 那個網段上的別人。於是走 <b>FORWARD</b>，不走 INPUT。</li>
<li>FORWARD 鏈的最前面，Docker 先跳到 <code>DOCKER-USER</code>（預設是空的），再跳到它自己的鏈，裡面有一條「目的是 172.17.0.2、埠 6379 的就放行」。封包被 ACCEPT，後面 ufw 寫在 FORWARD 的規則根本輪不到。</li>
<li>你寫在 INPUT 的 <code>ufw deny 6379</code>，從頭到尾沒被看過一眼。</li>
</ol>
<p>你可以自己看到這條 DNAT（輸出經過簡化）：</p>
<pre><code>$ sudo iptables -t nat -L DOCKER -n
DNAT  tcp  --  0.0.0.0/0  0.0.0.0/0  tcp dpt:6379 to:172.17.0.2:6379
$ sudo ss -ltnp | grep 6379
LISTEN 0 4096  0.0.0.0:6379  0.0.0.0:*  users:(("docker-proxy",...))</code></pre>
<p>第二個指令還會騙人：你看到 <code>docker-proxy</code> 在聽 6379，以為流量是經過它。其實從外面來的封包，大多在 PREROUTING 就被 DNAT 帶走了；docker-proxy 主要處理從本機自己連 localhost 這類的情況。</p>
<h4>正確的防法，由好到壞</h4>
<ol>
<li><b>根本不要發布。</b>同一台主機上的容器，接在同一個自訂網路（user-defined network）上，就能用容器名稱互連，完全不需要 <code>-p</code>。Docker Compose 裡，資料庫和 Redis 不寫 <code>ports</code>。</li>
<li><b>只發布在 localhost。</b><code>-p 127.0.0.1:6379:6379</code>，Compose 寫成 <code>"127.0.0.1:6379:6379"</code>。主機上的程式連得到，外面連不到。</li>
<li><b>外面再加一道牆。</b>雲端的安全群組是在機器外面擋，Docker 改不到它。正式環境一律只開真正需要的埠。</li>
<li><b>規則寫進 DOCKER-USER。</b>Docker 官方文件說明，這條鏈會在 Docker 自己的規則之前被檢查，而且 Docker 不會動它。要注意：到這裡時目的地已經被改成容器的位址了，所以要用 conntrack 比對「原本的」目的埠：</li>
</ol>
<pre><code># 從 eth0 進來、原本要連 6379 的，除了辦公室 VPN 網段，一律丟掉
sudo iptables -I DOCKER-USER -i eth0 -p tcp \\
  -m conntrack --ctorigdstport 6379 --ctdir ORIGINAL \\
  ! -s 10.100.0.0/16 -j DROP</code></pre>
<p>也有人會建議「設定 Docker 不要碰 iptables」，這會讓容器的網路整個要你自己接，除非你很清楚在做什麼，不然會換來更多問題。</p>
<h4>同一套機制，在 Kubernetes 和多網卡主機上</h4>
<ul>
<li><b>Kubernetes 的 NodePort 也是 DNAT。</b>kube-proxy（iptables 模式）在 PREROUTING 把打到節點 30000 到 32767 埠的流量，DNAT 到某個 Pod。主機上的防火牆照樣管不到，要靠雲端的安全群組或 NetworkPolicy。</li>
<li><b>多張網卡的主機會遇到非對稱路由。</b>封包從 eth1 進來，回應卻照預設路由從 eth0 出去。Linux 的反向路徑過濾（rp_filter）在嚴格模式下，會把這種「回程不會從同一張網卡出去」的封包丟掉；雲端則會因為來源位址不屬於那張網卡而丟掉。解法是策略路由（<code>ip rule</code>）：從哪張網卡的位址出去的，就用那張網卡自己的路由表。</li>
<li><b>雲端的「來源／目的檢查」。</b>AWS 預設會丟掉「目的地不是自己、來源也不是自己」的封包。你自己架 NAT 機器、VPN 閘道、或用某些 Kubernetes 網路外掛時，要把那台機器的這個檢查關掉，不然它轉送的封包全部消失。</li>
</ul>

<h3>八、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>/24 有 256 台機器可以用</td><td>傳統上扣掉網路和廣播位址剩 254；在 AWS 再扣 3 個，剩 251。</td></tr>
<tr><td>開了 ufw，Docker 的埠就被擋住了</td><td>Docker 發布的埠走 FORWARD，ufw 的規則在 INPUT。要用 127.0.0.1 綁定、DOCKER-USER 或外部的安全群組。</td></tr>
<tr><td>NAT 是一種防火牆</td><td>NAT 擋住外面主動連進來，只是副作用。它不檢查內容、不擋往外的連線，換成 IPv6 之後這個副作用也沒了。</td></tr>
<tr><td>一個 NAT IP 最多只能有 65,535 條連線</td><td>限制是「對同一個目的地」。目的地不同，外部埠可以重用。真正出事的是大量連線打同一個目的地。</td></tr>
<tr><td>私有子網路的機器完全連不出去</td><td>私有只代表外面連不進來。路由表有指向 NAT 閘道的預設路由，它就能往外連。</td></tr>
<tr><td>IPv4 的防火牆規則也會保護 IPv6</td><td>是兩套獨立的規則。只寫了 iptables，IPv6 可能整個沒防護。</td></tr>
</table>

<h3>九、跟你的工作連起來</h3>
<ul>
<li><b>前端（Vue、TypeScript）</b>：本機開發時，Vite 加了 <code>--host</code> 就會聽 0.0.0.0，同一個咖啡廳 Wi-Fi 的人都連得到你的開發伺服器。只在需要用手機測試時才開。</li>
<li><b>遊戲（Cocos、Unity）</b>：伺服器看到的玩家 IP 可能是 CGNAT 共用的，用 IP 封鎖作弊者要非常小心；點對點對戰要準備 TURN 中繼；UDP 遊戲的 NAT 對應很快就過期，客戶端要定時送小封包保持住。</li>
<li><b>後端（Node.js、Go）</b>：在負載平衡器後面，<code>req.socket.remoteAddress</code> 是負載平衡器的私有位址，真正的用戶端 IP 在 <code>X-Forwarded-For</code> 裡，而且只能信任你自己那一層加進去的部分；對同一個外部 API 一定要重用連線，否則 NAT 閘道的埠會被吃光。</li>
<li><b>Docker、雲端</b>：Compose 裡資料庫不寫 <code>ports</code>；VPC 位址先查公司的總表再開；容器多的話子網路給 /20 起跳；開 IPv6 之前，先把兩套防火牆規則對齊。</li>
</ul>

<h3>十、面試會怎麼問</h3>
<p>先自己講一遍，再打開參考答案。</p>
<ol>
<li>「10.0.1.77/26 的網路位址、廣播位址、可用範圍是什麼？你怎麼算的？」</li>
<li>「幫我規劃一個要跑在三個可用區域的 VPC，你會怎麼切子網路？考慮哪些事？」</li>
<li>「NAT 怎麼知道回來的封包要給內部哪一台？為什麼外面連不進來？」</li>
<li>「服務透過 NAT 閘道呼叫外部 API，尖峰時出現大量連線逾時，你會懷疑什麼？」</li>
<li>「為什麼 ufw 擋不住 Docker 發布的連接埠？要怎麼正確處理？」</li>
<li>「安全群組和網路 ACL 差在哪？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>/26 有 6 個主機位元，區塊大小 64，第四段的網路只能從 0、64、128、192 開始。77 落在 64 到 127 那一塊，所以網路位址是 10.0.1.64，廣播位址是 10.0.1.127，可用的是 .65 到 .126，共 62 個；遮罩是 255.255.255.192。在 AWS 還會再保留 .65、.66、.67，實際可用 59 個。</li>
<li>先跟公司所有網路（其他 VPC、辦公室、VPN、Kubernetes 的 Pod 和 Service 網段）確認不重疊，並避開 10.0.0.0/16、172.17.0.0/16、常見家用網段。例如用 10.20.0.0/16：每個可用區域各一個大的私有應用程式子網路（容器吃位址，給 /20），各一個小的公開子網路（只放負載平衡器和 NAT 閘道），各一個資料庫子網路；同類子網路放在對齊的大區塊裡，並保留一半以上的空間給未來。公開子網路路由表的預設路由指向網際網路閘道，私有的指向各自可用區域的 NAT 閘道。</li>
<li>NAT 對每一條往外的連線，在連線追蹤表記下五元組，以及它把來源換成哪一個公開 IP 和埠。回應的封包以那個公開 IP 和埠為目的地，NAT 查表找到對應的內部位址和埠，把目的改回去。外面主動打進來的封包，表裡沒有對應的紀錄，NAT 不知道要給誰，就丟掉；除非有設定靜態的埠轉發（DNAT）。</li>
<li>NAT 閘道的連接埠耗盡：同一個公開 IP 對同一個目的地，同時能開的連線有上限（AWS 是每個 IP 每個目的地 55,000 條），如果服務每個請求都開新連線，再加上關閉後的等待時間，尖峰時就會用完。驗證看 NAT 閘道的 ErrorPortAllocation 指標和同時連線數。解法：用 keep-alive 和連線池重用連線、替 NAT 閘道加公開 IP、或改用 VPC 端點等不經過 NAT 的路徑。另外也要排除 conntrack 表滿的可能。</li>
<li>Docker 在 nat 表的 PREROUTING 把打到發布埠的封包 DNAT 成容器位址，路由決定後它走 FORWARD 鏈，而 Docker 把自己的放行規則放在 FORWARD 的前面；ufw 的阻擋規則寫在 INPUT，這個封包根本不會經過。正確做法：不需要對外的服務不要發布，或只綁 127.0.0.1；在雲端用安全群組限制；需要主機層級的控制時，把規則寫進 DOCKER-USER 鏈，並用 conntrack 比對原始目的埠。</li>
<li>安全群組掛在網卡上、是有狀態的：允許了一個方向的連線，回應自動放行，而且只能寫「允許」。網路 ACL 掛在子網路上、是無狀態的：每個封包獨立判斷，回應的流量（目的是用戶端的短暫連接埠 1024 到 65535）要另外允許；它可以寫「拒絕」，規則依編號順序比對。實務上主要靠安全群組，ACL 用來做子網路層級的粗略封鎖。</li>
</ol>
</details>

<h3>十一、練功題（做得出來才算真的懂）</h3>
<ol>
<li>不用計算機：<code>192.168.10.200/27</code> 的網路位址、廣播位址、可用範圍和遮罩各是什麼？</li>
<li><code>10.20.33.4</code> 屬於本章 VPC 規劃裡的哪一個子網路？<code>10.20.70.9</code> 呢？</li>
<li>一家公司的正式環境是 10.0.0.0/16，你要開一個新的測試環境 VPC 並跟它對等互連。下面哪些可以用：10.0.128.0/17、10.1.0.0/16、172.17.0.0/16、10.20.0.0/16？說明原因。</li>
<li>在一台 Linux 主機上，你要怎麼知道連到 <code>10.30.5.6</code> 的封包會從哪張網卡、經過哪個閘道出去？如果答案是「走預設路由」，但那個網段其實在對等互連的另一個 VPC，問題可能出在哪一層？</li>
<li>把下面這個 IPv6 位址寫成最短的形式：<code>2001:0db8:0000:0000:0001:0000:0000:0042</code>。</li>
<li>一台雲端機器跑了 <code>docker run -d -p 5432:5432 postgres</code>，主機上開了 ufw 並 <code>ufw deny 5432</code>，安全群組允許所有來源連 5432。外面的人連得到嗎？寫出兩種修法。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>/27 有 5 個主機位元，區塊大小 32，第四段的網路從 0、32、64、96、128、160、192、224 開始。200 落在 192 到 223：網路位址 192.168.10.192，廣播位址 192.168.10.223，可用 .193 到 .222，共 30 個；遮罩 255.255.255.224。</li>
<li>10.20.33.4：第三段 33 落在 32 到 47，是 10.20.32.0/20，AZ c 的應用程式子網路。10.20.70.9：在 10.20.64.0/18 裡，但第三段 70 不屬於 64、65、66、72、73、74 任何一個 /24，是還沒分配的空間，不該有機器在這裡。</li>
<li>10.0.128.0/17 不行，它在 10.0.0.0/16 裡面，重疊。10.1.0.0/16 可以。172.17.0.0/16 雖然不重疊，但跟 Docker 預設的橋接網段相同，跑容器的主機會連不到那段位址，不建議。10.20.0.0/16 可以，前提是公司別處沒用掉它。</li>
<li>跑 <code>ip route get 10.30.5.6</code>，看 <code>dev</code> 和 <code>via</code>。在 VPC 裡，主機走預設路由交給 .1 是正常的；真正決定能不能到對面的是 VPC 的路由表：要有一條 10.30.0.0/16 指向對等連線，而且對面的路由表也要有一條指回來，雙方的安全群組也要允許。只設一邊的路由，封包去得了、回不來。</li>
<li>每組去掉開頭的 0：2001:db8:0:0:1:0:0:42。兩段連續的 0 都只有兩組，:: 只能用一次，慣例是替換最左邊那一段（長度相同時）：<code>2001:db8::1:0:0:42</code>。</li>
<li>連得到。ufw 的規則在 INPUT，Docker 發布的埠走 FORWARD，安全群組又放行，所以整個網際網路都能試著連資料庫。修法一：改成 <code>-p 127.0.0.1:5432:5432</code>，或根本不發布、讓應用程式容器透過同一個 Docker 網路連它。修法二：把安全群組的 5432 改成只允許應用程式那幾台的安全群組。也可以在 DOCKER-USER 用 conntrack 比對原始目的埠 5432 加一條 DROP。</li>
</ol>
</details>

<h3>十二、想再挖深</h3>
<ul>
<li><b>Kevin Fall 與 W. Richard Stevens《TCP/IP Illustrated, Volume 1》</b>（第二版）：IP 位址、子網路、ARP、ICMP、IPv6 的經典教科書，每個欄位都有真實封包可看。</li>
<li><b>RFC 1918（私有位址）、RFC 4632（CIDR）、RFC 6598（CGNAT 用的 100.64.0.0/10）</b>：都很短，讀過一次就知道這些範圍是怎麼來的。</li>
<li><b>AWS 官方文件《Amazon VPC User Guide》</b>：子網路大小、保留位址、路由表、NAT 閘道的限制與 ErrorPortAllocation 指標，都有官方的說明。</li>
<li><b>Docker 官方文件的〈Packet filtering and firewalls〉</b>（docs.docker.com，網路章節）：DOCKER-USER 鏈的用法、為什麼會繞過 ufw、用 conntrack 比對原始目的地的範例。</li>
<li><b>Linux 的 man 頁面 <code>ip-route(8)</code>、<code>iptables(8)</code>、<code>iptables-extensions(8)</code></b>：路由表欄位、各個鏈與表、conntrack 比對模組的正式說明。</li>
</ul>
` });
