DEEP({ 'cc-lifecycle': `
<p>上一課列出了七個生命週期回呼，和它們大致在什麼時候執行。這一章要追到「確切」：整個場景載入時，父節點和子節點、同一個節點上的幾個元件，誰先誰後；在一格中途生出來的節點，什麼時候開始跑；換場景時，是舊的先死還是新的先生；<code>destroy()</code> 為什麼要拖到這一格最後；還有三個幾乎每個 Cocos 專案都踩過的經典 bug。最後拿 Vue 的生命週期逐一對照，因為兩邊最容易搞混的，正好就是父子的順序。</p>

<h3><span class="badge lv1">基礎</span>一、生命週期是一台狀態機</h3>
<p>把一個元件想成一間店。裝潢只做一次（<code>onLoad</code>）；每次開門營業前掛上「營業中」（<code>onEnable</code>）；開幕第一天，等所有店員都到齊才開始接客（<code>start</code>）；營業時間裡不停地做事（<code>update</code>）；暫停營業就掛上「休息中」（<code>onDisable</code>），之後還可以再開；最後收店退租（<code>onDestroy</code>），就再也不會開了。</p>
<p>用狀態機畫出來，規則一目了然：</p>
<figure class="figure"><svg viewBox="0 0 680 282" class="fg" style="width:100%;max-width:680px" role="img" aria-label="元件的狀態機：建立後在節點第一次啟用時跑 onLoad 和 onEnable 進入已啟用；關掉跑 onDisable 進入已停用，再打開跑 onEnable；destroy 後進入等待銷毀，這一格結束時跑 onDestroy 變成已銷毀；從沒啟用過就銷毀的，不會跑 onDestroy">
<text x="355" y="30" text-anchor="middle" class="fg-t sm acc">第一次 update 之前：start</text>
<rect x="20" y="40" width="140" height="48" rx="6" class="fg-b"/><text x="90" y="60" text-anchor="middle" class="fg-t">建立了</text><text x="90" y="78" text-anchor="middle" class="fg-t sm">onLoad 還沒跑</text>
<rect x="280" y="40" width="150" height="48" rx="6" class="fg-b hot"/><text x="355" y="60" text-anchor="middle" class="fg-t acc">已啟用</text><text x="355" y="78" text-anchor="middle" class="fg-t sm">每格 update</text>
<rect x="280" y="190" width="150" height="48" rx="6" class="fg-b alt"/><text x="355" y="210" text-anchor="middle" class="fg-t">已停用</text><text x="355" y="228" text-anchor="middle" class="fg-t sm">不跑 update</text>
<rect x="520" y="115" width="140" height="48" rx="6" class="fg-b warm"/><text x="590" y="135" text-anchor="middle" class="fg-t">等待銷毀</text><text x="590" y="153" text-anchor="middle" class="fg-t sm">這一格還在樹上</text>
<rect x="520" y="228" width="140" height="48" rx="6" class="fg-b"/><text x="590" y="248" text-anchor="middle" class="fg-t">已銷毀</text><text x="590" y="266" text-anchor="middle" class="fg-t sm">isValid 是 false</text>
<line x1="160" y1="64" x2="272" y2="64" class="fg-l on"/><polygon points="280,64 272,59.5 272,68.5" class="fg-a on"/>
<text x="220" y="56" text-anchor="middle" class="fg-t sm acc">onLoad → onEnable</text><text x="220" y="82" text-anchor="middle" class="fg-t sm">節點第一次啟用</text>
<line x1="325" y1="88" x2="325" y2="182" class="fg-l alt"/><polygon points="325,190 320.5,182 329.5,182" class="fg-a alt"/>
<text x="317" y="142" text-anchor="end" class="fg-t sm">onDisable</text><text x="317" y="158" text-anchor="end" class="fg-t sm">關掉</text>
<line x1="385" y1="190" x2="385" y2="96" class="fg-l on"/><polygon points="385,88 380.5,96 389.5,96" class="fg-a on"/>
<text x="393" y="142" class="fg-t sm">onEnable</text><text x="393" y="158" class="fg-t sm">再打開</text>
<path d="M430 64 H590 V107" class="fg-l warm"/><polygon points="590,115 585.5,107 594.5,107" class="fg-a warm"/>
<text x="510" y="56" text-anchor="middle" class="fg-t sm warm">destroy()：先 onDisable</text>
<path d="M430 214 H470 V139 H512" class="fg-l warm"/><polygon points="520,139 512,134.5 512,143.5" class="fg-a warm"/>
<text x="476" y="184" class="fg-t sm warm">destroy()</text>
<line x1="590" y1="163" x2="590" y2="220" class="fg-l"/><polygon points="590,228 585.5,220 594.5,220" class="fg-a"/>
<text x="598" y="190" class="fg-t sm">這一格結束</text><text x="598" y="206" class="fg-t sm acc">onDestroy</text>
<path d="M90 88 V252 H512" class="fg-l dash"/><polygon points="520,252 512,247.5 512,256.5" class="fg-a"/>
<text x="300" y="272" text-anchor="middle" class="fg-t sm">從沒啟用過就 destroy：不會有 onDestroy</text>
</svg><figcaption>onLoad、start、onDestroy 一生最多一次；onEnable 和 onDisable 成對出現，可以來回很多次。destroy 不會立刻銷毀，要等到這一格結束。</figcaption></figure>
<p>從這張圖可以讀出幾條規則，比背表格好用：</p>
<ul>
<li><b>一生一次的</b>：<code>onLoad</code>、<code>start</code>、<code>onDestroy</code>。<b>成對、可重複的</b>：<code>onEnable</code> 和 <code>onDisable</code>。所以「打開時做、關掉時復原」的事，放在後面這一對。</li>
<li><b>onLoad 跟著節點，不跟著元件的開關。</b>元件在屬性檢查器裡被取消勾選（<code>enabled = false</code>），只要節點啟用了，它的 <code>onLoad</code> 照樣會跑；<code>onEnable</code>、<code>start</code>、<code>update</code> 則要等它被打開。</li>
<li><b>節點從沒啟用過，什麼都不會跑。</b>放在一個關著的面板底下的元件，連 <code>onLoad</code> 都還沒跑，直到面板第一次被打開。</li>
<li><b>從沒啟用過就被銷毀的元件，不會有 <code>onDestroy</code>。</b>這很合理：它從沒做過任何設定，也就沒有東西要清。</li>
</ul>

<h3><span class="badge lv1">基礎</span>二、誰在呼叫你：引擎裡的兩個排班員</h3>
<p>這些回呼不是魔法，是引擎裡兩個角色依規則呼叫的：</p>
<ul>
<li><b>節點啟用器</b>（原始碼裡叫 NodeActivator）：負責「開」和「關」。節點在樹裡從關變開、從開變關的那一刻，它<b>當場、同步地</b>走過整棵子樹，呼叫 <code>onLoad</code>、<code>onEnable</code> 或 <code>onDisable</code>。場景載入、<code>addChild</code> 進一棵開著的樹、<code>active = true</code>，都是在叫它做事。</li>
<li><b>元件排程器</b>（ComponentScheduler）：負責「每一格」。它手上有三張名單：還沒跑過 <code>start</code> 的、要跑 <code>update</code> 的、要跑 <code>lateUpdate</code> 的。每一格的 <code>director.tick</code> 裡，依序把三張名單叫一遍。</li>
</ul>
<p>元件只有在<b>真的有寫那個函式</b>時，才會被放進對應的名單。這帶來一個很實際的提醒：Cocos 新建腳本的範本裡，預設就有空的 <code>start() {}</code> 和 <code>update(deltaTime: number) {}</code>。空的 <code>update</code> 也會讓元件進入名單，每格白白被呼叫一次。用不到就刪掉。</p>

<h3><span class="badge lv2">進階</span>三、整個場景載入時的確切順序</h3>
<p>用猜高低的場景追一次。場景的最上層有兩個節點：GameManager 和 Canvas。Canvas 底下是 Table，Table 底下是 CurrentCard 和 NextCard。CurrentCard 身上掛了兩個你寫的元件，依屬性檢查器的順序是 Card、CardFlip。</p>
<figure class="figure"><svg viewBox="0 0 680 262" class="fg" style="width:100%;max-width:680px" role="img" aria-label="表格：五個元件在 onLoad、onEnable、start、update、lateUpdate 各階段的呼叫順序編號，1 到 25">
<text x="290" y="20" text-anchor="middle" class="fg-t sm">場景啟用時（同一次呼叫裡）</text><text x="515" y="20" text-anchor="middle" class="fg-t sm">下一格（第 1 格）</text>
<rect x="200" y="30" width="90" height="28" class="fg-b"/><text x="245" y="49" text-anchor="middle" class="fg-t sm mono">onLoad</text>
<rect x="290" y="30" width="90" height="28" class="fg-b"/><text x="335" y="49" text-anchor="middle" class="fg-t sm mono">onEnable</text>
<rect x="380" y="30" width="90" height="28" class="fg-b"/><text x="425" y="49" text-anchor="middle" class="fg-t sm mono">start</text>
<rect x="470" y="30" width="90" height="28" class="fg-b"/><text x="515" y="49" text-anchor="middle" class="fg-t sm mono">update</text>
<rect x="560" y="30" width="90" height="28" class="fg-b"/><text x="605" y="49" text-anchor="middle" class="fg-t sm mono">lateUpdate</text>
<text x="28" y="79" class="fg-t">GameManager</text>
<rect x="200" y="58" width="90" height="32" class="fg-b alt"/><text x="245" y="79" text-anchor="middle" class="fg-t mono">1</text>
<rect x="290" y="58" width="90" height="32" class="fg-b alt"/><text x="335" y="79" text-anchor="middle" class="fg-t mono">6</text>
<rect x="380" y="58" width="90" height="32" class="fg-b hot"/><text x="425" y="79" text-anchor="middle" class="fg-t mono">11</text>
<rect x="470" y="58" width="90" height="32" class="fg-b"/><text x="515" y="79" text-anchor="middle" class="fg-t mono">16</text>
<rect x="560" y="58" width="90" height="32" class="fg-b"/><text x="605" y="79" text-anchor="middle" class="fg-t mono">21</text>
<text x="28" y="111" class="fg-t">TableView（Table）</text>
<rect x="200" y="90" width="90" height="32" class="fg-b alt"/><text x="245" y="111" text-anchor="middle" class="fg-t mono">2</text>
<rect x="290" y="90" width="90" height="32" class="fg-b alt"/><text x="335" y="111" text-anchor="middle" class="fg-t mono">7</text>
<rect x="380" y="90" width="90" height="32" class="fg-b hot"/><text x="425" y="111" text-anchor="middle" class="fg-t mono">12</text>
<rect x="470" y="90" width="90" height="32" class="fg-b"/><text x="515" y="111" text-anchor="middle" class="fg-t mono">17</text>
<rect x="560" y="90" width="90" height="32" class="fg-b"/><text x="605" y="111" text-anchor="middle" class="fg-t mono">22</text>
<text x="28" y="143" class="fg-t">Card（CurrentCard）</text>
<rect x="200" y="122" width="90" height="32" class="fg-b alt"/><text x="245" y="143" text-anchor="middle" class="fg-t mono">3</text>
<rect x="290" y="122" width="90" height="32" class="fg-b alt"/><text x="335" y="143" text-anchor="middle" class="fg-t mono">8</text>
<rect x="380" y="122" width="90" height="32" class="fg-b hot"/><text x="425" y="143" text-anchor="middle" class="fg-t mono">13</text>
<rect x="470" y="122" width="90" height="32" class="fg-b"/><text x="515" y="143" text-anchor="middle" class="fg-t mono">18</text>
<rect x="560" y="122" width="90" height="32" class="fg-b"/><text x="605" y="143" text-anchor="middle" class="fg-t mono">23</text>
<text x="28" y="175" class="fg-t">CardFlip（CurrentCard）</text>
<rect x="200" y="154" width="90" height="32" class="fg-b alt"/><text x="245" y="175" text-anchor="middle" class="fg-t mono">4</text>
<rect x="290" y="154" width="90" height="32" class="fg-b alt"/><text x="335" y="175" text-anchor="middle" class="fg-t mono">9</text>
<rect x="380" y="154" width="90" height="32" class="fg-b hot"/><text x="425" y="175" text-anchor="middle" class="fg-t mono">14</text>
<rect x="470" y="154" width="90" height="32" class="fg-b"/><text x="515" y="175" text-anchor="middle" class="fg-t mono">19</text>
<rect x="560" y="154" width="90" height="32" class="fg-b"/><text x="605" y="175" text-anchor="middle" class="fg-t mono">24</text>
<text x="28" y="207" class="fg-t">Card（NextCard）</text>
<rect x="200" y="186" width="90" height="32" class="fg-b alt"/><text x="245" y="207" text-anchor="middle" class="fg-t mono">5</text>
<rect x="290" y="186" width="90" height="32" class="fg-b alt"/><text x="335" y="207" text-anchor="middle" class="fg-t mono">10</text>
<rect x="380" y="186" width="90" height="32" class="fg-b hot"/><text x="425" y="207" text-anchor="middle" class="fg-t mono">15</text>
<rect x="470" y="186" width="90" height="32" class="fg-b"/><text x="515" y="207" text-anchor="middle" class="fg-t mono">20</text>
<rect x="560" y="186" width="90" height="32" class="fg-b"/><text x="605" y="207" text-anchor="middle" class="fg-t mono">25</text>
<line x1="380" y1="26" x2="380" y2="222" class="fg-l warm"/>
<text x="340" y="246" text-anchor="middle" class="fg-t sm">先整批 onLoad，再整批 onEnable；下一格的 start、update 也照同樣由上而下的樹順序</text>
</svg><figcaption>數字是呼叫順序。引擎由上往下、先父後子走過整棵樹；同一個節點上的元件，照屬性檢查器裡的順序。UITransform、Sprite 這些引擎內建元件也在同一個隊伍裡，圖上省略。</figcaption></figure>
<p>以 3.x 的實作來說，節點啟用器在一次啟用裡，會先把整棵要啟用的子樹走一遍，收集好名單，然後<b>先叫完全部的 <code>onLoad</code>，再叫全部的 <code>onEnable</code></b>。<code>start</code> 不在這一次呼叫裡，它要等到下一次 <code>director.tick</code> 的開頭。由此可以推出三個寫程式時真正用得到的結論：</p>
<ol>
<li><b>在 <code>onLoad</code> 裡，其他節點都已經存在，可以找；但它們的 <code>onLoad</code> 不一定跑過了。</b>你拿得到別人的元件，可是別人在 <code>onLoad</code> 裡才設定的欄位，可能還是空的。</li>
<li><b>在 <code>start</code> 裡，整個場景的 <code>onLoad</code> 和 <code>onEnable</code> 都跑完了。</b>所以「讀別人準備好的資料」放在 <code>start</code>，永遠安全。</li>
<li><b>父節點的 <code>onLoad</code> 跑的時候，子節點的 <code>onLoad</code> 還沒跑。</b>這和 Vue 剛好相反，第九節會詳細比較。</li>
</ol>
<p>如果 GameManager 加上 <code>@executionOrder(-1)</code>，它的 <code>onLoad</code>、<code>onEnable</code>、<code>start</code>、<code>update</code>、<code>lateUpdate</code> 在各自那一批裡都會排到最前面，不管它的節點在樹的哪裡。</p>

<h3><span class="badge lv2">進階</span>四、在一格中途出生的節點</h3>
<p>遊戲進行到一半，Spawner 元件在自己的 <code>update</code> 裡生出一顆星星。這顆星星的回呼，什麼時候跑？</p>
<figure class="figure"><svg viewBox="0 0 680 244" class="fg" style="width:100%;max-width:680px" role="img" aria-label="第 10 格的 update 裡，Spawner 生出 Star，addChild 當場跑完 Star 的 onLoad 和 onEnable；Star 的 start 在它第一次 update 之前；Star 的第一次 update 在第 11 格">
<text x="165" y="40" text-anchor="middle" class="fg-t lg">第 10 格</text><text x="515" y="40" text-anchor="middle" class="fg-t lg">第 11 格</text>
<rect x="20" y="52" width="60" height="40" rx="5" class="fg-b"/><text x="50" y="76" text-anchor="middle" class="fg-t sm">start</text>
<rect x="84" y="52" width="150" height="40" rx="5" class="fg-b hot"/><text x="159" y="68" text-anchor="middle" class="fg-t acc">update</text><text x="159" y="84" text-anchor="middle" class="fg-t sm">Spawner 生出 Star</text>
<rect x="238" y="52" width="72" height="40" rx="5" class="fg-b"/><text x="274" y="76" text-anchor="middle" class="fg-t sm">lateUpdate</text>
<rect x="314" y="52" width="52" height="40" rx="5" class="fg-b warm"/><text x="340" y="69" text-anchor="middle" class="fg-t sm">Star</text><text x="340" y="84" text-anchor="middle" class="fg-t sm">start</text>
<rect x="370" y="52" width="60" height="40" rx="5" class="fg-b"/><text x="400" y="76" text-anchor="middle" class="fg-t sm">start</text>
<rect x="434" y="52" width="150" height="40" rx="5" class="fg-b hot"/><text x="509" y="68" text-anchor="middle" class="fg-t acc">update</text><text x="509" y="84" text-anchor="middle" class="fg-t sm">Star 第一次 update</text>
<rect x="588" y="52" width="72" height="40" rx="5" class="fg-b"/><text x="624" y="76" text-anchor="middle" class="fg-t sm">lateUpdate</text>
<line x1="159" y1="92" x2="159" y2="124" class="fg-l dash"/>
<rect x="20" y="124" width="410" height="108" rx="6" class="fg-b"/>
<text x="32" y="146" class="fg-t">Spawner.update(dt) 裡面：</text>
<text x="32" y="166" class="fg-t sm mono">① const star = instantiate(this.starPrefab)</text>
<text x="32" y="184" class="fg-t sm mono">② star.getComponent(Star)!.value = 50</text>
<text x="32" y="202" class="fg-t sm mono">③ this.table.addChild(star)</text>
<text x="48" y="220" class="fg-t sm acc">這一行裡面，就跑完 Star 的 onLoad、onEnable</text>
<text x="450" y="146" class="fg-t">Star 在第 10 格：</text>
<text x="450" y="168" class="fg-t sm">onLoad、onEnable：跑了</text>
<text x="450" y="188" class="fg-t sm warm">update：還沒</text>
<text x="450" y="214" class="fg-t sm acc">第 11 格才開始 update</text>
</svg><figcaption>新元件在名單正被走訪時加入，會先排在旁邊，不會插進這一格的 update。Star 的 start 畫在兩格之間：保證的是「在它第一次 update 之前」，確切落在哪一刻是引擎的實作細節。</figcaption></figure>
<p>三個重點：</p>
<ul>
<li><b><code>addChild</code> 是同步觸發啟用的。</b>這一行還沒回來，Star 的 <code>onLoad</code> 和 <code>onEnable</code> 就已經跑完了。所以想讓 <code>onLoad</code> 用到某個初始值，要像第 ② 行那樣，<b>在加進樹之前</b>設好。<code>instantiate</code> 本身不會觸發 <code>onLoad</code>，因為那時節點還不在任何一棵開著的樹裡。</li>
<li><b>這一格不會跑它的 <code>update</code>。</b>排程器正在走 update 名單，中途加入的元件會先放在一旁，等這一輪走完再排進去。這是為了不在「走訪陣列」的同時改動陣列。</li>
<li><b>加到一個關著的父節點底下，什麼都不會跑。</b>要等父節點被打開，才輪到它的 <code>onLoad</code>。</li>
</ul>

<h3><span class="badge lv2">進階</span>五、換場景時發生什麼</h3>
<p>呼叫 <code>director.loadScene('Game')</code> 之後，事情是這樣發生的：</p>
<figure class="figure"><svg viewBox="0 0 640 424" class="fg" style="width:100%;max-width:640px" role="img" aria-label="換場景的順序：舊場景照常更新同時新場景下載；常駐節點搬進新場景；舊場景整棵 onDisable 再整棵 onDestroy；之後新場景整棵 onLoad、整棵 onEnable；下一格 start 和 update">
<text x="160" y="24" text-anchor="middle" class="fg-t lg">舊場景 Menu</text><text x="480" y="24" text-anchor="middle" class="fg-t lg">新場景 Game</text>
<rect x="40" y="40" width="240" height="40" rx="6" class="fg-b"/><text x="160" y="57" text-anchor="middle" class="fg-t">照常每格更新</text><text x="160" y="73" text-anchor="middle" class="fg-t sm">資源還在下載，玩家還能點</text>
<rect x="360" y="40" width="240" height="40" rx="6" class="fg-b alt"/><text x="480" y="57" text-anchor="middle" class="fg-t">下載資源、建立場景</text><text x="480" y="73" text-anchor="middle" class="fg-t sm">還沒啟用，誰都沒被叫</text>
<line x1="160" y1="80" x2="160" y2="88" class="fg-l"/><polygon points="160,96 155.5,88 164.5,88" class="fg-a"/>
<line x1="480" y1="80" x2="480" y2="88" class="fg-l"/><polygon points="480,96 475.5,88 484.5,88" class="fg-a"/>
<rect x="40" y="96" width="560" height="36" rx="6" class="fg-b"/><text x="320" y="119" text-anchor="middle" class="fg-t">常駐節點搬進新場景，不會被銷毀</text>
<line x1="160" y1="132" x2="160" y2="140" class="fg-l"/><polygon points="160,148 155.5,140 164.5,140" class="fg-a"/>
<rect x="40" y="148" width="240" height="40" rx="6" class="fg-b warm"/><text x="160" y="165" text-anchor="middle" class="fg-t">整棵 onDisable</text><text x="160" y="181" text-anchor="middle" class="fg-t sm">由上往下，當場執行</text>
<line x1="160" y1="188" x2="160" y2="196" class="fg-l"/><polygon points="160,204 155.5,196 164.5,196" class="fg-a"/>
<rect x="40" y="204" width="240" height="40" rx="6" class="fg-b warm"/><text x="160" y="221" text-anchor="middle" class="fg-t">整棵 onDestroy</text><text x="160" y="237" text-anchor="middle" class="fg-t sm">勾了自動釋放的資源一起放掉</text>
<text x="480" y="186" text-anchor="middle" class="fg-t sm">新場景已經建好，</text><text x="480" y="204" text-anchor="middle" class="fg-t sm">但還沒有任何回呼</text>
<path d="M160 244 V252 H480 V256" class="fg-l"/><polygon points="480,264 475.5,256 484.5,256" class="fg-a"/>
<rect x="360" y="264" width="240" height="40" rx="6" class="fg-b hot"/><text x="480" y="281" text-anchor="middle" class="fg-t">整棵 onLoad</text><text x="480" y="297" text-anchor="middle" class="fg-t sm">樹的順序，executionOrder 優先</text>
<line x1="480" y1="304" x2="480" y2="312" class="fg-l"/><polygon points="480,320 475.5,312 484.5,312" class="fg-a"/>
<rect x="360" y="320" width="240" height="40" rx="6" class="fg-b hot"/><text x="480" y="337" text-anchor="middle" class="fg-t">整棵 onEnable</text><text x="480" y="353" text-anchor="middle" class="fg-t sm">接著才呼叫 loadScene 的回呼</text>
<line x1="480" y1="360" x2="480" y2="368" class="fg-l"/><polygon points="480,376 475.5,368 484.5,368" class="fg-a"/>
<rect x="360" y="376" width="240" height="36" rx="6" class="fg-b"/><text x="480" y="399" text-anchor="middle" class="fg-t">下一格：start，然後 update</text>
<text x="160" y="300" text-anchor="middle" class="fg-t sm warm">舊場景已經不在了</text><text x="160" y="318" text-anchor="middle" class="fg-t sm">新場景的 onLoad 找不到它</text>
</svg><figcaption>舊場景整棵銷毀完，新場景才開始 onLoad。兩個場景的元件，從來不會同時「活著」互相打招呼。</figcaption></figure>
<p>從這張圖要記住的幾件事：</p>
<ul>
<li><b>下載期間舊場景還活著。</b>玩家可能再按一次「開始」，又呼叫一次 <code>loadScene</code>。自己加一個「切換中」的旗標，把重複的請求擋掉。</li>
<li><b>新場景的 <code>onLoad</code> 跟舊場景說不上話。</b>要帶到下一個場景的資料（玩家選的難度、登入資訊），放在不屬於任何場景的地方：一個普通的 TypeScript 模組、一個資料存放處，或常駐節點。這和 Vue 換路由時，資料放在 Pinia 這種存放處而不是頁面元件裡，是同一個道理。</li>
<li><b>常駐節點</b>用 <code>director.addPersistRootNode(node)</code> 設定，而且必須是場景的根節點（場景的直接子節點）。它不會被銷毀，<code>onLoad</code> 也不會再跑一次。想在「換好場景」時做事，聽 <code>Director.EVENT_AFTER_SCENE_LAUNCH</code> 事件，比依賴常駐節點身上的回呼可靠。</li>
</ul>

<h3><span class="badge lv3">專業</span>六、destroy 為什麼要拖到這一格最後</h3>
<p>想像排程器正在一個陣列裡依序呼叫 50 個元件的 <code>update</code>，第 10 個元件在自己的 <code>update</code> 裡把第 11 個銷毀了。如果銷毀是立刻從陣列裡拿掉，後面的元素全部往前移一格，原本的第 12 個就會被跳過。同樣的事也會發生在你自己的程式裡。把「真正拆掉」統一延到一個安全的時間點，所有走訪都不用擔心這件事。</p>
<p>所以 <code>destroy()</code> 分成兩段：<b>當場</b>把節點關掉（所以 <code>onDisable</code> 立刻執行），並做上「待銷毀」的記號；<b>這一格的邏輯都跑完之後</b>（<code>lateUpdate</code> 和 AFTER_UPDATE 事件之後），才真正執行 <code>onDestroy</code>、從父節點拿掉、讓 <code>isValid</code> 變成 false，並取消這個元件用 <code>schedule</code> 排的所有計時器。</p>
<figure class="figure"><svg viewBox="0 0 680 248" class="fg" style="width:100%;max-width:680px" role="img" aria-label="表格：呼叫 destroy 之前、剛呼叫之後的同一格、這一格結束後，三個時間點下節點是否看得到、是否還在 children 裡、能否用名字找到、isValid 的值和剛跑過的回呼">
<rect x="220" y="16" width="150" height="44" class="fg-b"/><text x="295" y="35" text-anchor="middle" class="fg-t">① 呼叫之前</text><text x="295" y="52" text-anchor="middle" class="fg-t sm">正常運作</text>
<rect x="370" y="16" width="150" height="44" class="fg-b"/><text x="445" y="35" text-anchor="middle" class="fg-t">② 剛呼叫 destroy()</text><text x="445" y="52" text-anchor="middle" class="fg-t sm">同一格稍後</text>
<rect x="520" y="16" width="150" height="44" class="fg-b"/><text x="595" y="35" text-anchor="middle" class="fg-t">③ 這一格結束後</text><text x="595" y="52" text-anchor="middle" class="fg-t sm">延後銷毀跑完</text>
<text x="28" y="80" class="fg-t sm">畫面上看得到</text>
<rect x="220" y="60" width="150" height="30" class="fg-b"/><text x="295" y="80" text-anchor="middle" class="fg-t">是</text>
<rect x="370" y="60" width="150" height="30" class="fg-b"/><text x="445" y="80" text-anchor="middle" class="fg-t">否</text>
<rect x="520" y="60" width="150" height="30" class="fg-b"/><text x="595" y="80" text-anchor="middle" class="fg-t">否</text>
<text x="28" y="110" class="fg-t sm">還在 children 裡</text>
<rect x="220" y="90" width="150" height="30" class="fg-b"/><text x="295" y="110" text-anchor="middle" class="fg-t">是</text>
<rect x="370" y="90" width="150" height="30" class="fg-b warm"/><text x="445" y="110" text-anchor="middle" class="fg-t">是</text>
<rect x="520" y="90" width="150" height="30" class="fg-b"/><text x="595" y="110" text-anchor="middle" class="fg-t">否</text>
<text x="28" y="140" class="fg-t sm">getChildByName 找得到</text>
<rect x="220" y="120" width="150" height="30" class="fg-b"/><text x="295" y="140" text-anchor="middle" class="fg-t">是</text>
<rect x="370" y="120" width="150" height="30" class="fg-b warm"/><text x="445" y="140" text-anchor="middle" class="fg-t">是</text>
<rect x="520" y="120" width="150" height="30" class="fg-b"/><text x="595" y="140" text-anchor="middle" class="fg-t">否</text>
<text x="28" y="170" class="fg-t sm mono">node.isValid</text>
<rect x="220" y="150" width="150" height="30" class="fg-b"/><text x="295" y="170" text-anchor="middle" class="fg-t mono">true</text>
<rect x="370" y="150" width="150" height="30" class="fg-b warm"/><text x="445" y="170" text-anchor="middle" class="fg-t mono">true</text>
<rect x="520" y="150" width="150" height="30" class="fg-b"/><text x="595" y="170" text-anchor="middle" class="fg-t mono">false</text>
<text x="28" y="200" class="fg-t sm mono">isValid(node, true)</text>
<rect x="220" y="180" width="150" height="30" class="fg-b"/><text x="295" y="200" text-anchor="middle" class="fg-t mono">true</text>
<rect x="370" y="180" width="150" height="30" class="fg-b"/><text x="445" y="200" text-anchor="middle" class="fg-t mono">false</text>
<rect x="520" y="180" width="150" height="30" class="fg-b"/><text x="595" y="200" text-anchor="middle" class="fg-t mono">false</text>
<text x="28" y="230" class="fg-t sm">剛跑過的回呼</text>
<rect x="220" y="210" width="150" height="30" class="fg-b"/><text x="295" y="230" text-anchor="middle" class="fg-t">—</text>
<rect x="370" y="210" width="150" height="30" class="fg-b"/><text x="445" y="230" text-anchor="middle" class="fg-t mono">onDisable</text>
<rect x="520" y="210" width="150" height="30" class="fg-b"/><text x="595" y="230" text-anchor="middle" class="fg-t mono">onDestroy</text>
</svg><figcaption>橘色是最容易出 bug 的三格：剛呼叫 destroy() 之後的這一格裡，節點已經看不到了，卻還在樹上、找得到，<code>isValid</code> 也還是 true。要判斷「已經被要求銷毀」，用 <code>isValid(node, true)</code>。</figcaption></figure>
<p>典型的 bug：銷毀舊的提示框，馬上用同一個名字建一個新的，接著 <code>getChildByName('Toast')</code>，拿到的卻是舊的那個，因為它要到這一格結束才離開樹。解法是直接保存新節點的參照，不要靠名字找；或在 <code>destroy()</code> 之前先 <code>removeFromParent()</code>，讓它立刻離開樹。</p>
<p>反過來，<code>removeFromParent()</code> 是<b>立刻</b>改動父節點的子節點陣列。這一行看起來沒問題，其實只會移除一半：</p>
<pre><code>// 錯：邊走訪邊從同一個陣列拿東西，5 個只會移掉 3 個
for (const c of table.children) c.removeFromParent();

// 對：先複製一份再走，或直接用引擎提供的方法
for (const c of [...table.children]) c.removeFromParent();
table.removeAllChildren();</code></pre>
<p>同樣的迴圈改成 <code>c.destroy()</code> 反而是對的，5 個都會被銷毀，因為子節點陣列要到這一格結束才會變。兩個長得很像的函式，對「陣列什麼時候變」的答案完全不同。</p>

<h3><span class="badge lv3">專業</span>七、三個經典 bug</h3>
<h4>bug 一：在 onLoad 裡用了別人在 start 才設好的參照</h4>
<figure class="figure"><svg viewBox="0 0 660 254" class="fg" style="width:100%;max-width:660px" role="img" aria-label="錯的寫法：ScoreView 在 onLoad 讀 GameManager.instance，但 GameManager 在 start 才設定，所以讀到 null。改過之後：GameManager 在 onLoad 設定，ScoreView 在 start 讀，拿得到">
<text x="20" y="34" class="fg-t warm">錯的寫法</text>
<text x="260" y="34" text-anchor="middle" class="fg-t sm">onLoad 階段</text><text x="510" y="34" text-anchor="middle" class="fg-t sm">start 階段（第 1 格）</text>
<text x="20" y="70" class="fg-t">ScoreView</text><text x="20" y="108" class="fg-t">GameManager</text>
<rect x="160" y="50" width="200" height="32" rx="5" class="fg-b warm"/><text x="260" y="71" text-anchor="middle" class="fg-t sm">讀 GameManager.instance → null</text>
<rect x="410" y="88" width="200" height="32" rx="5" class="fg-b hot"/><text x="510" y="109" text-anchor="middle" class="fg-t sm">設定 instance = this</text>
<path d="M470 88 V66 H368" class="fg-l warm dash"/><polygon points="360,66 368,61.5 368,70.5" class="fg-a warm"/>
<text x="420" y="58" text-anchor="middle" class="fg-t sm warm">這時還沒設</text>
<line x1="20" y1="140" x2="640" y2="140" class="fg-l dim dash"/>
<text x="20" y="164" class="fg-t acc">改過之後</text>
<text x="20" y="194" class="fg-t">GameManager</text><text x="20" y="232" class="fg-t">ScoreView</text>
<rect x="160" y="174" width="200" height="32" rx="5" class="fg-b hot"/><text x="260" y="195" text-anchor="middle" class="fg-t sm">設定 instance = this</text>
<rect x="410" y="212" width="200" height="32" rx="5" class="fg-b hot"/><text x="510" y="233" text-anchor="middle" class="fg-t sm">讀 instance → 拿得到</text>
<path d="M360 190 H385 V228 H402" class="fg-l on"/><polygon points="410,228 402,223.5 402,232.5" class="fg-a on"/>
</svg><figcaption>上面：要用的時候（onLoad），對方還沒設（start 才設）。下面：設定的一方提早到 onLoad，讀的一方延到 start，順序就由引擎保證。</figcaption></figure>
<p>症狀通常是「在我的電腦上好好的，換個場景結構就壞了」，因為不同節點之間的順序取決於樹的排法。記一條規則就能避開整類問題：<b>onLoad 只準備自己（設定自己的欄位、抓參照、把自己登記成單例）；start 才去讀別人準備好的東西。</b>如果真的有元件必須在 <code>onLoad</code> 裡就用到別人的結果，替被依賴的那一方加 <code>@executionOrder(-1)</code>，並在程式註解裡寫清楚原因。</p>
<h4>bug 二：監聽器沒拿掉</h4>
<p>要不要自己 <code>off</code>，看的是「發出事件的那一方，活得比你久嗎？」</p>
<table>
<tr><th>你監聽的對象</th><th>例子</th><th>要不要自己 off</th></tr>
<tr><td>自己的節點</td><td><code>this.node.on(...)</code></td><td>風險小：跟著節點一起消失</td></tr>
<tr><td>別的節點</td><td><code>other.on(type, fn, this)</code></td><td>要。對方可能比你活得久</td></tr>
<tr><td>全域物件</td><td><code>input</code>、<code>director</code>、<code>game</code>、自己寫的事件中心、<code>window</code></td><td>一定要。它們活到遊戲結束</td></tr>
</table>
<p>忘了 <code>off</code> 的三種症狀：<b>重進場景後事件觸發兩次</b>（每進一次就多註冊一個）；<b>已銷毀的元件被呼叫</b>，讀到空的欄位而報錯；<b>記憶體洩漏</b>，因為事件中心手上還拿著 <code>this</code>，整個元件、連同它參照的節點和資源，都沒辦法被回收。</p>
<p>還有兩個細節。第一，<b>成對的位置要對</b>：在 <code>onEnable</code> 註冊，就要在 <code>onDisable</code> 拿掉；如果拿掉寫在 <code>onDestroy</code>，面板開關兩次，就疊了兩個監聽器。第二，<b>用箭頭函式註冊，就拿不掉</b>：<code>input.on(type, () =&gt; this.onKey())</code> 每次都是一個新的函式，<code>off</code> 時對不上。傳方法本身加上 <code>this</code> 當目標，最後用 <code>targetOff(this)</code> 一次全部拿掉，最不容易漏：</p>
<pre><code>onEnable() {
    input.on(Input.EventType.KEY_DOWN, this.onKey, this);
    bus.on('round-end', this.onRoundEnd, this);
}
onDisable() {
    input.off(Input.EventType.KEY_DOWN, this.onKey, this);
    bus.targetOff(this);    // bus 是你的 EventTarget 事件中心
}</code></pre>
<h4>bug 三：銷毀之後才回來的工作</h4>
<p>用 <code>this.schedule</code> 排的計時器，元件被停用時會暫停，被銷毀時會被引擎一起取消，這部分可以放心。但下面這些，引擎管不到：<code>setTimeout</code>、<code>await</code> 之後的程式、網路請求的回呼。玩家可能在等待的那兩秒內就離開了場景。</p>
<pre><code>@ccclass('ResultPanel')
export class ResultPanel extends Component {
    @property(Label) title: Label | null = null;
    private timer?: ReturnType&lt;typeof setTimeout&gt;;

    async start() {
        // await 的時候，玩家可能已經離開
        const round = await fetchRound();
        if (!this.isValid) return;    // 已被銷毀，什麼都別碰
        if (this.title) this.title.string = round.name;
        this.timer = setTimeout(() =&gt; this.hide(), 3000);
    }
    hide() { this.node.active = false; }
    onDestroy() {
        clearTimeout(this.timer);
        // 補間不要賭它會自己停
        Tween.stopAllByTarget(this.node);
    }
}</code></pre>
<p>（<code>fetchRound</code> 代表你自己的網路函式；<code>Label</code>、<code>Tween</code> 都從 <code>'cc'</code> 匯入。）沒有那一行 <code>isValid</code> 檢查時，最好的情況是讀到已清掉的欄位而報錯，最壞的情況是程式默默修改一個已經不在畫面上的物件，把錯誤藏到很久以後才出現。<b>每一個 <code>await</code> 之後，都要問一次「我還活著嗎」。</b></p>

<h3><span class="badge lv4">專家</span>八、executionOrder 的真正規則與邊界</h3>
<ul>
<li><b>寫法</b>：<code>const { ccclass, executionOrder } = _decorator;</code>，然後在類別上加 <code>@executionOrder(-1)</code>。預設是 0，數字小的先執行。</li>
<li><b>影響範圍</b>：<code>onLoad</code>、<code>onEnable</code>、<code>start</code>、<code>update</code>、<code>lateUpdate</code>。<b>不影響</b> <code>onDisable</code> 和 <code>onDestroy</code>。</li>
<li><b>同樣的數字</b>：同一個節點上，照屬性檢查器的順序；不同節點，照它們被啟用的順序。場景載入時那就是樹的順序，但之後生出來的節點，排在已經存在的後面。</li>
<li><b>它只排「同一批」的順序。</b>第 20 格才生出來、標了 <code>-1</code> 的元件，不可能讓自己的 <code>onLoad</code> 跑在場景載入那一批的前面。它保證的永遠是「在同一張名單裡誰先」，不是「全場誰先」。</li>
<li><b>執行期間順序會變。</b>以目前 3.x 的實作，元件被打開時才加進名單的尾端；所以一個節點關掉再打開，它的 <code>update</code> 就排到同一組的最後面。不同節點之間的 <code>update</code> 順序，不要寫成程式的前提。</li>
</ul>
<h4>例外會讓整批半套</h4>
<p>引擎是在一個迴圈裡依序叫一整批元件的。某個元件的 <code>onLoad</code> 丟出例外，例外會往外拋出那個迴圈，同一批排在它後面的元件，這一次可能就沒被叫到。結果是一個「一半初始化」的場景：有的元件準備好了，有的沒有，錯誤訊息卻只指向第一個出事的地方。生命週期回呼裡，能預期的失敗（找不到節點、資料格式不對）要自己處理掉，不要讓例外漏出去。</p>
<h4>比 executionOrder 更好的做法</h4>
<p>executionOrder 是一種全域的、看不見的依賴：讀程式的人不會知道某個元件被調了順序。專業的專案通常只在少數基礎設施上用它（例如一個必須最先處理輸入的管理器），其他初始化順序改成<b>明確的呼叫</b>：一個 Bootstrap 元件在 <code>start</code> 裡依序呼叫 <code>audio.init()</code>、<code>network.init()</code>、<code>ui.init()</code>。順序寫在程式碼裡，看得到、測得到，也不會因為有人調整了樹的結構就改變。</p>

<h3><span class="badge lv4">專家</span>九、跟 Vue 的生命週期逐一對照</h3>
<p>兩邊最容易搞錯的，是父子的先後：</p>
<figure class="figure"><svg viewBox="0 0 660 340" class="fg" style="width:100%;max-width:660px" role="img" aria-label="左邊 Vue 3 的掛載順序：父 setup、父 onBeforeMount、子 setup、子 onBeforeMount、子 onMounted、父 onMounted。右邊 Cocos：父 onLoad、子 onLoad、父 onEnable、子 onEnable，下一格父 start、子 start">
<text x="165" y="26" text-anchor="middle" class="fg-t lg">Vue 3：子先掛好，父最後</text>
<text x="495" y="26" text-anchor="middle" class="fg-t lg">Cocos：由上往下一層層</text>
<rect x="40" y="44" width="250" height="30" rx="5" class="fg-b"/><text x="56" y="64" class="fg-t">① 父 setup</text>
<rect x="40" y="82" width="250" height="30" rx="5" class="fg-b"/><text x="56" y="102" class="fg-t">② 父 onBeforeMount</text>
<rect x="40" y="120" width="250" height="30" rx="5" class="fg-b alt"/><text x="56" y="140" class="fg-t">③ 子 setup</text>
<rect x="40" y="158" width="250" height="30" rx="5" class="fg-b alt"/><text x="56" y="178" class="fg-t">④ 子 onBeforeMount</text>
<rect x="40" y="196" width="250" height="30" rx="5" class="fg-b alt"/><text x="56" y="216" class="fg-t">⑤ 子 onMounted</text>
<rect x="40" y="234" width="250" height="30" rx="5" class="fg-b hot"/><text x="56" y="254" class="fg-t acc">⑥ 父 onMounted</text>
<text x="165" y="290" text-anchor="middle" class="fg-t sm">父的 onMounted 裡，子元件都已經好了</text>
<rect x="370" y="44" width="250" height="30" rx="5" class="fg-b"/><text x="386" y="64" class="fg-t">① 父 onLoad</text>
<rect x="370" y="82" width="250" height="30" rx="5" class="fg-b alt"/><text x="386" y="102" class="fg-t">② 子 onLoad</text>
<rect x="370" y="120" width="250" height="30" rx="5" class="fg-b"/><text x="386" y="140" class="fg-t">③ 父 onEnable</text>
<rect x="370" y="158" width="250" height="30" rx="5" class="fg-b alt"/><text x="386" y="178" class="fg-t">④ 子 onEnable</text>
<line x1="370" y1="206" x2="620" y2="206" class="fg-l warm dash"/><text x="495" y="224" text-anchor="middle" class="fg-t sm warm">下一格</text>
<rect x="370" y="234" width="250" height="30" rx="5" class="fg-b"/><text x="386" y="254" class="fg-t">⑤ 父 start</text>
<rect x="370" y="272" width="250" height="30" rx="5" class="fg-b alt"/><text x="386" y="292" class="fg-t">⑥ 子 start</text>
<text x="495" y="326" text-anchor="middle" class="fg-t sm">沒有「孩子都好了」的回呼；要等大家都好，用 start</text>
</svg><figcaption>藍框是子元件。Vue 的父元件最後才 mounted，所以在父的 onMounted 裡可以放心碰子元件；Cocos 一律先父後子，父節點的 onLoad 跑時，子節點還沒準備好。</figcaption></figure>
<table>
<tr><th>Cocos</th><th>Vue 3 最接近的</th><th>真正的差別</th></tr>
<tr><td><code>onLoad</code></td><td><code>setup</code></td><td>onLoad 時整個場景都已存在、找得到；setup 時還沒有 DOM。父子順序：兩邊都是父先。</td></tr>
<tr><td><code>start</code></td><td><code>onMounted</code></td><td>Vue 是子先父後；start 是先父後子，但保證全場的 onLoad 都已跑完。</td></tr>
<tr><td><code>onEnable</code>／<code>onDisable</code></td><td><code>onActivated</code>／<code>onDeactivated</code></td><td>Vue 只有 KeepAlive 裡的元件有；Cocos 每個元件都有。</td></tr>
<tr><td><code>update</code>、<code>lateUpdate</code></td><td>無</td><td>Vue 的 <code>onUpdated</code> 是資料變了、重畫之後才跑；Cocos 每格都跑，不管有沒有變。</td></tr>
<tr><td><code>onDestroy</code></td><td><code>onBeforeUnmount</code>、<code>onUnmounted</code></td><td>Vue 在同一次更新裡就把元件卸載完；Cocos 的 onDisable 當場跑，onDestroy 延到這一格結束。</td></tr>
</table>

<h3>十、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td><code>instantiate</code> 一呼叫，onLoad 就跑了</td><td>要等節點被加進一棵開著的樹、第一次被啟用時才跑。</td></tr>
<tr><td>start 每次打開都會跑</td><td>一生一次。每次打開都會跑的是 onEnable。</td></tr>
<tr><td><code>destroy()</code> 之後節點馬上消失</td><td>onDisable 馬上跑、畫面上馬上看不到，但要到這一格結束才離開樹、跑 onDestroy。</td></tr>
<tr><td>父節點 onLoad 時，子節點都準備好了</td><td>子節點的 onLoad 還沒跑。這和 Vue 的 onMounted 剛好相反。</td></tr>
<tr><td>引擎會自動拿掉所有監聽器</td><td>只有跟著節點一起消失的才算。全域物件和別的節點上的，要自己 off。</td></tr>
<tr><td>executionOrder 也決定 onDestroy 的順序</td><td>它不影響 onDisable 和 onDestroy。</td></tr>
<tr><td>換場景時新舊場景會同時存在一下</td><td>舊場景整棵銷毀完，新場景才開始 onLoad。</td></tr>
</table>

<h3>十一、跟你的工作連起來</h3>
<ul>
<li><b>Vue</b>：你在 Vue 裡養成的「<code>onMounted</code> 註冊、<code>onBeforeUnmount</code> 清掉」習慣，原封不動帶過來；要改的只有父子順序的直覺。跨場景的資料，就像跨路由的資料，放進存放處，不要放在會被銷毀的元件裡。</li>
<li><b>TypeScript</b>：開啟 <code>strictNullChecks</code>，把 <code>@property</code> 的欄位寫成 <code>Label | null</code>，編譯器就會逼你在使用前檢查。這能在編輯階段抓到一部分「onLoad 時還是空的」問題。</li>
<li><b>Unity</b>：<code>Awake</code> 對應 <code>onLoad</code>，<code>OnEnable</code>、<code>Start</code>、<code>Update</code>、<code>LateUpdate</code>、<code>OnDisable</code>、<code>OnDestroy</code> 名字都對得上；Unity 的 Script Execution Order 就是 executionOrder；Unity 的 <code>Destroy</code> 也是延到這一輪更新結束才真的銷毀。兩邊的經驗可以直接互換。</li>
<li><b>Node.js、Go 與 Docker</b>：「誰註冊、誰清掉」是所有長時間執行程式的共同問題。Node.js 的 EventEmitter 在同一個事件掛超過 10 個監聽器時會印出 MaxListenersExceededWarning，那通常就是洩漏的訊號；Go 裡忘了取消 context，goroutine 就會一直掛著；容器收到 SIGTERM 時的優雅關機，就是服務層級的 onDestroy。</li>
</ul>

<h3>十二、面試會怎麼問</h3>
<ol>
<li>「Cocos 元件有哪些生命週期回呼？各在什麼時候執行？哪些只跑一次？」</li>
<li>「場景載入時，父節點和子節點的 onLoad、start 誰先誰後？跟 Vue 的 mounted 有什麼不同？」</li>
<li>「為什麼 destroy() 不是立刻生效？這會造成什麼樣的 bug？」</li>
<li>「切換場景時，新舊場景的回呼順序是什麼？資料要怎麼帶到下一個場景？」</li>
<li>「監聽器沒拿掉會發生什麼事？你會怎麼在團隊裡預防？」</li>
<li>「executionOrder 是什麼？你什麼時候會用、什麼時候不用？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>onLoad 在節點第一次被啟用時執行，只一次，適合抓參照、初始化自己；onEnable 在每次被打開時執行；start 在第一次 update 之前執行一次，這時全場的 onLoad 都已跑完；update 和 lateUpdate 每格執行，lateUpdate 在所有 update 之後；onDisable 在每次被關掉時執行；onDestroy 在銷毀時執行一次，負責清理。一生一次的是 onLoad、start、onDestroy；onEnable 和 onDisable 成對、可重複。</li>
<li>引擎由上往下、先父後子走過整棵樹：先整批 onLoad，再整批 onEnable，下一格再依同樣順序跑 start 和 update。Vue 是父 setup、父 beforeMount、子元件整個掛載完，最後才是父的 mounted，所以 Vue 的父元件在 mounted 裡可以碰子元件；Cocos 父節點的 onLoad 跑時子節點還沒準備好，要等大家都好，得用 start。</li>
<li>引擎在每格裡會走訪元件和子節點的陣列，如果銷毀時立刻從陣列移除，會讓正在走訪的迴圈跳過或重複元素。所以 destroy() 當場只把節點關掉並標記，onDisable 立刻執行；這一格的邏輯跑完後才真正執行 onDestroy、移出樹。常見的 bug 是同一格裡用名字還找得到它、children 數量還包含它，以及以為 isValid 已經是 false。</li>
<li>新場景的資源先載入，這段時間舊場景照常運作；接著常駐節點搬進新場景，舊場景整棵 onDisable、onDestroy，必要時釋放舊資源；然後新場景整棵 onLoad、onEnable，再呼叫 loadScene 的回呼，下一格開始 start 和 update。兩個場景的元件不會同時存在，資料要放在不屬於場景的地方：一般模組、資料存放處或常駐節點。</li>
<li>發出事件的一方如果活得比監聽者久，監聽器會一直被呼叫：重進場景後觸發多次、呼叫到已銷毀的元件而報錯，而且事件來源持有元件的參照，造成記憶體洩漏。預防方法：規定註冊和移除成對（onEnable 配 onDisable、onLoad 配 onDestroy），統一傳 this 當目標並用 targetOff(this) 清除，不用匿名箭頭函式註冊，並在程式碼審查時把 on／off 是否成對列入檢查項目。</li>
<li>executionOrder 是元件類別的裝飾器，數字小的先執行，影響 onLoad、onEnable、start、update、lateUpdate，不影響 onDisable、onDestroy，而且只在同一批名單裡排序。我只會在少數基礎設施上用它，例如必須最先更新的輸入管理器；一般的初始化順序，我偏好由一個啟動元件明確依序呼叫各模組的 init，讓順序寫在程式碼裡、看得到也測得到。</li>
</ol>
</details>

<h3>十三、練功題（做得出來才算真的懂）</h3>
<ol>
<li>場景裡有 Parent 節點，底下一個 Child 節點，兩者都掛了會印出 onLoad、onEnable、start、onDisable、onDestroy 的 LifeLog。依序發生：場景載入、過了幾格、<code>parent.active = false</code>、<code>parent.active = true</code>、<code>parent.destroy()</code>。寫出完整的印出順序。</li>
<li>一個元件在 <code>onEnable</code> 裡 <code>input.on(...)</code>，在 <code>onDestroy</code> 裡 <code>input.off(...)</code>。面板被關掉、打開兩次之後，按一個鍵，<code>onKey</code> 會被呼叫幾次？怎麼改？</li>
<li><code>table</code> 底下有 5 個子節點 a、b、c、d、e。執行 <code>for (const c of table.children) c.removeFromParent();</code> 之後，還剩哪幾個？如果把 <code>removeFromParent()</code> 換成 <code>destroy()</code> 呢？</li>
<li>X 元件標了 <code>@executionOrder(-1)</code>，掛在樹的最下面；Y 元件預設 0，掛在最上面；Z 元件標了 <code>@executionOrder(1)</code>，掛在中間。場景載入時三者的 onLoad 順序是什麼？場景銷毀時的 onDestroy 呢？</li>
<li>選單場景裡玩家選了「困難」，遊戲場景要知道這個選擇。說出三種做法，各自的優缺點。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>場景載入：Parent onLoad、Child onLoad、Parent onEnable、Child onEnable；下一格：Parent start、Child start。關掉：Parent onDisable、Child onDisable（由上往下）。打開：Parent onEnable、Child onEnable，不會再有 onLoad 和 start。銷毀：當場 Parent onDisable、Child onDisable；這一格結束時兩者的 onDestroy。兩個 onDestroy 之間的先後，不要寫成程式的前提。</li>
<li>3 次。第一次啟用註冊 1 個，之後每次重新打開又多註冊 1 個，而 onDisable 什麼都沒拿掉。改成在 onDisable 裡 off，讓註冊和移除都跟著開關成對。</li>
<li>剩下 b 和 d。走訪時移掉 a 之後，b 往前補到第 0 格，迴圈卻已經走到第 1 格，拿到的是 c；依此類推，只移掉了 a、c、e。換成 destroy() 時 5 個都會被銷毀，因為子節點陣列要到這一格結束才改變，走訪不受影響。</li>
<li>onLoad：X（−1）、Y（0）、Z（1），數字優先，樹的位置其次。onDestroy 不受 executionOrder 影響，而且不要依賴它們之間的順序；彼此有依賴的清理，改成由一方明確呼叫。</li>
<li>一、一個普通的 TypeScript 模組（例如 <code>export const session = { difficulty: 'normal' }</code>）：最簡單，不依賴場景，但要自己注意重設時機。二、常駐節點上的元件：能有自己的生命週期和計時器，但只能是根節點，而且容易變成什麼都往裡丟的大雜燴。三、正式的資料存放處或狀態管理：有清楚的讀寫介面、方便測試和儲存，適合中大型專案，代價是多一層結構。選單的難度這種小資料，第一種就夠了。</li>
</ol>
</details>

<h3>十四、想再挖深</h3>
<ul>
<li><b>Cocos Creator 3.8 官方使用手冊</b>（docs.cocos.com/creator/3.8/manual）：生命週期回呼、腳本執行順序、場景管理與常駐節點這幾頁，本章的每一條規則都可以在裡面對照。</li>
<li><b>cocos-engine 原始碼</b>（github.com/cocos/cocos-engine）：<code>node-activator.ts</code> 看啟用和停用怎麼走訪子樹，<code>component-scheduler.ts</code> 看 start、update 的名單怎麼維護，<code>director.ts</code> 看換場景的順序。</li>
<li><b>Vue 官方文件的 Lifecycle Hooks</b>（vuejs.org）：附有完整的生命週期圖，拿來和本章第九節的圖對照。</li>
<li><b>Unity 手冊〈Order of execution for event functions〉</b>：Unity 版本的同一張圖，比較兩個引擎的設計，對面試很有幫助。</li>
<li><b>Robert Nystrom《Game Programming Patterns》</b>（gameprogrammingpatterns.com）：「Update Method」一章，討論在更新中途新增、刪除物件會遇到的問題，正是本章第四、六節的背景。</li>
</ul>
` });
