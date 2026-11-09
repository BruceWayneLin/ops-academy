DEEP({ 'cc-what': `
<p>上一課你學到遊戲迴圈的三步：讀輸入、更新、繪製，每秒大約 60 次。這一章把「一格」放到放大鏡底下：那 16.7 毫秒裡，Cocos Creator 3.8 到底依序做了哪些事、瀏覽器在哪裡替它打拍子、GPU 什麼時候才真的動手畫。接著看物理為什麼要用固定的步長、一格的時間通常被誰吃掉，再拆開引擎在瀏覽器裡的分層，最後分清楚編輯器、執行階段和建置三者的界線。讀完之後，你聽到「掉幀」兩個字，腦中應該能直接浮現是哪一段出了事、該拿什麼工具去量。</p>

<h3><span class="badge lv1">基礎</span>一、一格畫面裡的十件事</h3>
<p>先用一個比喻。想像一間拍定格動畫的攝影棚：每拍一張照片，就是一個影格（frame）。每拍一張之前，所有人都照同一張流程表做事：</p>
<ol>
<li>先看導演有沒有喊話：玩家有沒有點畫面、按鍵盤。這是<b>輸入</b>。</li>
<li>今天剛到的演員先就定位：新加入的元件跑它的 <code>start</code>。</li>
<li>每個演員把自己的手腳挪一點：每個元件的 <code>update(dt)</code>。</li>
<li>道具組照時間表做事：時間到的計時器、正在播的補間動畫（tween）和動畫片段，都往前推一點。這些在引擎裡叫「系統」（system）。</li>
<li>攝影助理最後確認：鏡頭要跟著主角，就等主角動完再跟。這是 <code>lateUpdate</code>。</li>
<li>剛才喊「拆掉」的道具，現在才真的拆：延後銷毀，<code>onDestroy</code> 在這裡跑。</li>
<li>物理組用固定的節奏推進重力和碰撞。</li>
<li>攝影師把畫面裡要拍的東西整理好，能一起拍的合成一批。</li>
<li>按下快門：把一道道繪製指令（draw call）交給顯示晶片。</li>
<li>暗房沖洗：GPU 把像素真的畫進畫布。</li>
</ol>
<figure class="figure"><svg viewBox="0 0 680 272" class="fg" style="width:100%;max-width:680px" role="img" aria-label="一格畫面的十個步驟：輸入、start、update、系統更新、lateUpdate、延後銷毀、物理、收集與批次、送出指令、GPU 繪製">
<text x="20" y="24" class="fg-t sm">邏輯：你寫的程式幾乎都在這一排</text>
<rect x="20" y="36" width="112" height="58" rx="6" class="fg-b"/><text x="76" y="60" text-anchor="middle" class="fg-t">1 輸入</text><text x="76" y="80" text-anchor="middle" class="fg-t sm">觸控、按鍵</text>
<rect x="152" y="36" width="112" height="58" rx="6" class="fg-b"/><text x="208" y="60" text-anchor="middle" class="fg-t">2 start</text><text x="208" y="80" text-anchor="middle" class="fg-t sm">新元件才有</text>
<rect x="284" y="36" width="112" height="58" rx="6" class="fg-b hot"/><text x="340" y="60" text-anchor="middle" class="fg-t acc">3 update</text><text x="340" y="80" text-anchor="middle" class="fg-t sm">每個元件</text>
<rect x="416" y="36" width="112" height="58" rx="6" class="fg-b"/><text x="472" y="60" text-anchor="middle" class="fg-t">4 系統更新</text><text x="472" y="80" text-anchor="middle" class="fg-t sm">排程、補間、動畫</text>
<rect x="548" y="36" width="112" height="58" rx="6" class="fg-b"/><text x="604" y="60" text-anchor="middle" class="fg-t">5 lateUpdate</text><text x="604" y="80" text-anchor="middle" class="fg-t sm">跟隨、收尾</text>
<line x1="132" y1="65" x2="144" y2="65" class="fg-l"/><polygon points="152,65 144,60.5 144,69.5" class="fg-a"/>
<line x1="264" y1="65" x2="276" y2="65" class="fg-l"/><polygon points="284,65 276,60.5 276,69.5" class="fg-a"/>
<line x1="396" y1="65" x2="408" y2="65" class="fg-l"/><polygon points="416,65 408,60.5 408,69.5" class="fg-a"/>
<line x1="528" y1="65" x2="540" y2="65" class="fg-l"/><polygon points="548,65 540,60.5 540,69.5" class="fg-a"/>
<path d="M604 94 V116 H76 V134" class="fg-l"/><polygon points="76,142 71.5,134 80.5,134" class="fg-a"/>
<text x="340" y="110" text-anchor="middle" class="fg-t sm">這裡發出 AFTER_UPDATE 事件</text>
<rect x="20" y="142" width="112" height="58" rx="6" class="fg-b"/><text x="76" y="166" text-anchor="middle" class="fg-t">6 延後銷毀</text><text x="76" y="186" text-anchor="middle" class="fg-t sm">onDestroy 在這</text>
<rect x="152" y="142" width="112" height="58" rx="6" class="fg-b"/><text x="208" y="166" text-anchor="middle" class="fg-t">7 物理</text><text x="208" y="186" text-anchor="middle" class="fg-t sm">固定步長推進</text>
<rect x="284" y="142" width="112" height="58" rx="6" class="fg-b alt"/><text x="340" y="166" text-anchor="middle" class="fg-t">8 收集、批次</text><text x="340" y="186" text-anchor="middle" class="fg-t sm">走樹、合併</text>
<rect x="416" y="142" width="112" height="58" rx="6" class="fg-b alt"/><text x="472" y="166" text-anchor="middle" class="fg-t">9 送出指令</text><text x="472" y="186" text-anchor="middle" class="fg-t sm">draw call</text>
<rect x="548" y="142" width="112" height="58" rx="6" class="fg-b warm"/><text x="604" y="166" text-anchor="middle" class="fg-t">10 GPU 繪製</text><text x="604" y="186" text-anchor="middle" class="fg-t sm">跟 CPU 平行</text>
<line x1="132" y1="171" x2="144" y2="171" class="fg-l"/><polygon points="152,171 144,166.5 144,175.5" class="fg-a"/>
<line x1="264" y1="171" x2="276" y2="171" class="fg-l"/><polygon points="284,171 276,166.5 276,175.5" class="fg-a"/>
<line x1="396" y1="171" x2="408" y2="171" class="fg-l"/><polygon points="416,171 408,166.5 408,175.5" class="fg-a"/>
<line x1="528" y1="171" x2="540" y2="171" class="fg-l warm"/><polygon points="548,171 540,166.5 540,175.5" class="fg-a warm"/>
<path d="M24 212 V218 H260 V212" class="fg-l"/><text x="142" y="236" text-anchor="middle" class="fg-t sm">邏輯的收尾</text>
<path d="M288 212 V218 H524 V212" class="fg-l"/><text x="406" y="236" text-anchor="middle" class="fg-t sm">繪製準備（CPU）</text>
<path d="M552 212 V218 H656 V212" class="fg-l warm"/><text x="604" y="236" text-anchor="middle" class="fg-t sm warm">GPU 自己做</text>
<text x="340" y="262" text-anchor="middle" class="fg-t sm">60 FPS 時，1 到 9 要在大約 16.7 毫秒內做完</text>
</svg><figcaption>一格裡的十個步驟。上面一排是邏輯，你的程式幾乎都在這裡；下面一排的 8、9 是 CPU 替 GPU 準備指令，第 10 步由 GPU 自己去畫。</figcaption></figure>
<p>在 Cocos Creator 3.8 裡，1 到 9 都發生在同一個函式裡：<code>director.tick(dt)</code>。你可以把它想成引擎的心臟，瀏覽器每給一次機會，它就跳一下。前五步加上第 6、7 步是「邏輯」，算出這一格每樣東西該在哪裡；第 8、9 步是「繪製準備」，把結果翻譯成 GPU 聽得懂的指令。第 10 步不在 CPU 上：GPU 收到指令後自己去畫，CPU 已經可以開始準備下一格。</p>
<p>這張圖有三個馬上用得到的推論：</p>
<ul>
<li><b>你的程式花的時間，直接從這一格扣。</b>觸控的回呼、<code>update</code>、<code>schedule</code> 的計時器、補間動畫結束時的回呼，全都在第 1 到 5 步。它們慢，整格就慢。</li>
<li><b>lateUpdate 一定看得到所有 update 和補間的結果。</b>所以「攝影機跟著主角」「血條貼在角色頭上」這種要等別人先動完的事，放在 <code>lateUpdate</code>，才不會差一格。</li>
<li><b>暫停有兩種。</b><code>director.pause()</code> 只停邏輯（第 2 到 7 步），畫面照樣每格繪製，觸控事件也照樣送進來；<code>game.pause()</code> 則把整個迴圈停掉，連畫都不畫。做暫停選單時通常要的是前者，但要記得：補間和元件的 <code>update</code> 也一起停了，所以暫停選單自己如果需要動畫，得另外處理。</li>
</ul>

<h3><span class="badge lv1">基礎</span>二、誰在打拍子：瀏覽器、畫布與 requestAnimationFrame</h3>
<p>引擎自己不會「每 16.7 毫秒醒來一次」。在瀏覽器裡，替它打拍子的是瀏覽器本身。</p>
<p>螢幕每秒刷新固定的次數，叫<b>更新率</b>（refresh rate）：大部分是 60 Hz，也有不少手機和螢幕是 90 Hz、120 Hz。每次刷新的那個時間點叫<b>垂直同步</b>（vsync）。瀏覽器每次要更新畫面之前，會先呼叫所有用 <code>requestAnimationFrame</code> 登記過的函式。Cocos 在網頁上就是把自己的主迴圈登記在這裡：瀏覽器叫一次，引擎就跑一次 <code>director.tick</code>。</p>
<p>畫布（canvas）就是那張被畫的紙。引擎啟動時，在頁面上的 <code>&lt;canvas&gt;</code>（網頁版建置裡它的 id 是 <code>GameCanvas</code>）建立一個 WebGL 繪圖環境（context），之後每一格的像素都畫在上面。瀏覽器再把這張畫布和頁面其他部分合成（composite），送上螢幕。</p>
<figure class="figure"><svg viewBox="0 0 680 204" class="fg" style="width:100%;max-width:680px" role="img" aria-label="時間軸：螢幕每 16.7 毫秒刷新一次，第 2 格算了 22 毫秒，錯過一次刷新，螢幕把畫面 1 顯示兩次">
<text x="16" y="22" class="fg-t sm">毫秒</text>
<text x="110" y="22" text-anchor="middle" class="fg-t sm">0</text><text x="245" y="22" text-anchor="middle" class="fg-t sm">16.7</text><text x="380" y="22" text-anchor="middle" class="fg-t sm">33.3</text><text x="515" y="22" text-anchor="middle" class="fg-t sm">50</text><text x="650" y="22" text-anchor="middle" class="fg-t sm">66.7</text>
<line x1="110" y1="30" x2="110" y2="192" class="fg-l dim dash"/><line x1="245" y1="30" x2="245" y2="192" class="fg-l dim dash"/><line x1="380" y1="30" x2="380" y2="192" class="fg-l dim dash"/><line x1="515" y1="30" x2="515" y2="192" class="fg-l dim dash"/><line x1="650" y1="30" x2="650" y2="192" class="fg-l dim dash"/>
<text x="16" y="50" class="fg-t">螢幕刷新</text>
<circle cx="110" cy="46" r="5" class="fg-lamp on"/><circle cx="245" cy="46" r="5" class="fg-lamp on"/><circle cx="380" cy="46" r="5" class="fg-lamp on"/><circle cx="515" cy="46" r="5" class="fg-lamp on"/><circle cx="650" cy="46" r="5" class="fg-lamp on"/>
<text x="16" y="103" class="fg-t">引擎的一格</text>
<rect x="110" y="78" width="81" height="40" rx="5" class="fg-b hot"/><text x="150" y="96" text-anchor="middle" class="fg-t">第 1 格</text><text x="150" y="111" text-anchor="middle" class="fg-t sm">10 ms</text>
<rect x="245" y="78" width="178" height="40" rx="5" class="fg-b warm"/><text x="334" y="96" text-anchor="middle" class="fg-t">第 2 格</text><text x="326" y="111" text-anchor="middle" class="fg-t sm">22 ms，超過一拍</text>
<rect x="515" y="78" width="81" height="40" rx="5" class="fg-b hot"/><text x="555" y="96" text-anchor="middle" class="fg-t">第 3 格</text><text x="555" y="111" text-anchor="middle" class="fg-t sm">10 ms</text>
<text x="450" y="138" text-anchor="middle" class="fg-t sm warm">33.3 這一拍沒趕上</text>
<text x="16" y="175" class="fg-t">螢幕顯示</text>
<rect x="112" y="152" width="131" height="38" rx="5" class="fg-b"/><text x="177" y="175" text-anchor="middle" class="fg-t sm">上一張</text>
<rect x="247" y="152" width="131" height="38" rx="5" class="fg-b hot"/><text x="312" y="175" text-anchor="middle" class="fg-t">畫面 1</text>
<rect x="382" y="152" width="131" height="38" rx="5" class="fg-b warm"/><text x="447" y="175" text-anchor="middle" class="fg-t">還是畫面 1</text>
<rect x="517" y="152" width="131" height="38" rx="5" class="fg-b hot"/><text x="582" y="175" text-anchor="middle" class="fg-t">畫面 2</text>
</svg><figcaption>每條虛線是一次螢幕刷新。第 2 格只多花了 5 毫秒，卻錯過 33.3 毫秒那一拍，螢幕只好把畫面 1 再顯示一次。玩家感覺到的就是「頓一下」。</figcaption></figure>
<p>這張圖要記住的是：<b>晚一點點，等於晚一整拍。</b>第 2 格只超過 5 毫秒，但下一次機會已經是 50 毫秒。所以遊戲效能看的不是平均，而是<b>最慢的那幾格</b>。平均 12 毫秒、偶爾 25 毫秒的遊戲，玩起來比穩定 15 毫秒的還卡。</p>
<h4>瀏覽器的節拍帶來的幾個現象</h4>
<ul>
<li><b>切到背景分頁，遊戲就停了。</b>瀏覽器不會替看不到的分頁呼叫 <code>requestAnimationFrame</code>，<code>setTimeout</code> 也會被大幅節流。玩家切回來時，引擎怎麼處理那一大段空白，不同版本、不同平台不完全一樣。所以倒數計時這種重要的時間，不要只靠一格一格累加 dt：記下開始的時間點，用「現在減開始」去算，最好以伺服器的時間為準。</li>
<li><b>影格率有上限。</b><code>game.frameRate</code> 預設是 60。在 120 Hz 的螢幕上，引擎還是照 60 的目標跑，除非你把它調高。調高之前先想清楚：每格只剩 8.3 毫秒，手機也更燙、更耗電。</li>
<li><b>輸入跟著這個節拍走。</b>觸控和按鍵事件會在下一格的 <code>update</code> 之前送到你的監聽器，所以在 <code>update</code> 裡看到的，一定是已經處理過最新輸入的狀態。</li>
</ul>

<h3><span class="badge lv2">進階</span>三、追一格：玩家在猜高低裡按下「高」</h3>
<p>用這個網站一直在用的例子：猜高低（Higher or Lower），玩家猜下一張牌會比現在這張高還是低。場景裡有這幾個元件：</p>
<ul>
<li><code>Round</code>：在 <code>update</code> 裡用 dt 倒數這一回合剩下的秒數。</li>
<li><code>GuessButtons</code>：「高」「低」兩顆按鈕的點擊處理。</li>
<li><code>CardFlip</code>：用補間動畫把牌翻過來，花 0.3 秒。</li>
<li><code>Shadow</code>：在 <code>lateUpdate</code> 裡把牌的影子對齊到牌的位置。</li>
<li>上一回合飄起來的「+1」提示，剛才在它自己的 <code>update</code> 裡呼叫了 <code>this.node.destroy()</code>。</li>
</ul>
<p>玩家在 1003.2 毫秒時點下「高」。下一次 <code>requestAnimationFrame</code> 在 1008.4 毫秒到來，距離上一格 16.6 毫秒，所以這一格的 dt 是 0.0166。這一格的經過如下。右邊的毫秒數是一台中階手機上的示意數字，只是讓你感覺比例：</p>
<table>
<tr><th>步驟</th><th>這一格發生什麼</th><th>示意耗時</th></tr>
<tr><td>1 輸入</td><td>觸控結束的事件送到「高」按鈕，Button 發出 click，<code>GuessButtons.onHigher()</code> 被呼叫：記下玩家猜「高」、啟動 <code>CardFlip</code> 的補間、用 <code>scheduleOnce(this.reveal, 0.3)</code> 排好 0.3 秒後揭曉</td><td>0.2 ms</td></tr>
<tr><td>2 start</td><td>這一格沒有新元件，跳過</td><td>0</td></tr>
<tr><td>3 update</td><td><code>Round</code> 把剩餘時間從 7.4120 秒減成 7.4120 − 0.0166 = 7.3954 秒；其他幾十個元件各自更新</td><td>1.1 ms</td></tr>
<tr><td>4 系統</td><td>排程器檢查計時器：<code>reveal</code> 還沒到時間，不叫；補間系統開始推進翻牌</td><td>0.3 ms</td></tr>
<tr><td>5 lateUpdate</td><td><code>Shadow</code> 讀到牌在補間之後的位置，把影子對過去</td><td>0.1 ms</td></tr>
<tr><td>6 延後銷毀</td><td>「+1」提示在這裡才真正被拆掉，它的 <code>onDestroy</code> 執行</td><td>0.05 ms</td></tr>
<tr><td>7 物理</td><td>這個遊戲沒用物理模組，沒有這一步</td><td>0</td></tr>
<tr><td>8 收集、批次</td><td>走一遍 Canvas 底下的樹，只重算位置有變的那幾個元件的頂點，合併成 3 批</td><td>2.0 ms</td></tr>
<tr><td>9 送出</td><td>3 個 draw call 透過 WebGL 交出去</td><td>0.8 ms</td></tr>
<tr><td>10 GPU</td><td>GPU 畫完整張畫布，和 CPU 準備下一格同時進行</td><td>另計</td></tr>
</table>
<p>CPU 這一格總共大約 4.6 毫秒，離 16.7 還很遠。這是一個健康的 2D 遊戲常見的樣子：大部分時間其實在「等下一拍」。</p>
<p>注意第 1 步和第 4 步的關係：點擊處理函式只是「登記」了補間和計時器，真正推進它們的，是同一格稍後的系統更新。0.3 秒之後，也就是大約 18 格以後，排程器才會叫 <code>reveal</code>。</p>
<h4>自己量一次順序</h4>
<p>把下面這個元件掛在任何一個節點上，預覽時打開主控台，就能親眼看到一格裡的先後：</p>
<pre><code>import { _decorator, Component, director, Director } from 'cc';
const { ccclass } = _decorator;

@ccclass('FrameProbe')
export class FrameProbe extends Component {
    private lines = 0;
    onLoad() {
        director.on(Director.EVENT_BEFORE_UPDATE, () =&gt; this.log('BEFORE_UPDATE'), this);
        director.on(Director.EVENT_AFTER_UPDATE, () =&gt; this.log('AFTER_UPDATE'), this);
        director.on(Director.EVENT_AFTER_DRAW, () =&gt; this.log('AFTER_DRAW'), this);
        this.schedule(() =&gt; this.log('schedule'), 0);   // 0 = 每一格
    }
    update() { this.log('update'); }
    lateUpdate() { this.log('lateUpdate'); }
    onDestroy() { director.targetOff(this); }          // 有 on 就要有 off
    private log(s: string) {
        if (this.lines++ &lt; 12) console.log(director.getTotalFrames(), s);
    }
}</code></pre>
<p>你會看到同一格的編號底下，依序是 BEFORE_UPDATE、update、schedule、lateUpdate、AFTER_UPDATE、AFTER_DRAW。排程器的回呼夾在 <code>update</code> 和 <code>lateUpdate</code> 中間，這一點很多人不知道。它的意思是：在 <code>update</code> 裡改的值，計時器回呼看得到；計時器回呼裡改的值，<code>lateUpdate</code> 看得到。</p>

<h3><span class="badge lv2">進階</span>四、可變步長與固定步長</h3>
<p><code>update(dt)</code> 的 dt 每一格都不一樣：0.0166、0.0171、偶爾 0.034。這叫<b>可變時間步長</b>（variable time step）：每一步走多遠，看這一格實際過了多久。上一課說過，乘上 dt 能讓速度在快手機和慢手機上一樣。但「速度一樣」不代表「結果一樣」。</p>
<h4>問題一：同樣的跳躍，跳不一樣高</h4>
<p>角色往上跳，初速 500 像素／秒，重力 −1000 像素／秒²。照物理課本，最高會到 500² ÷ (2 × 1000) = 125 像素。遊戲裡一般這樣寫：每一格先 <code>v += g * dt</code>，再 <code>y += v * dt</code>。實際算出來：</p>
<table>
<tr><th>影格率</th><th>dt</th><th>到最高點要幾步</th><th>最高跳到</th></tr>
<tr><td>60 FPS</td><td>1/60 秒</td><td>30 步</td><td>約 120.8 像素</td></tr>
<tr><td>30 FPS</td><td>1/30 秒</td><td>15 步</td><td>約 116.7 像素</td></tr>
<tr><td>數學上的答案</td><td>無限小</td><td>無限多步</td><td>125 像素</td></tr>
</table>
<p>每一步都把「這一小段時間裡的速度」當成不變，步越大，誤差越大。差 4 像素看起來不多，可是如果關卡裡有一個 119 像素高的平台，60 FPS 的玩家跳得上去，30 FPS 的玩家永遠跳不上去。</p>
<h4>問題二：跑太快，穿牆而過</h4>
<p>一顆球以 600 像素／秒飛向一道 10 像素厚的牆。60 FPS 時每格前進 10 像素，一定有一格會落在牆裡，碰撞就被偵測到。可是如果某一格卡了 50 毫秒，這一步就前進 30 像素：前一格還在牆前面，下一格已經在牆後面，中間從來沒碰過牆。這叫<b>穿隧</b>（tunneling）。</p>
<h4>問題三：沒辦法重現</h4>
<p>同樣的操作，因為每台機器的 dt 序列都不同，結果就有細微的差別。想做重播，或讓兩台機器的模擬一模一樣（某些連線對戰就是這樣做的），可變步長幾乎不可能辦到。</p>
<h4>解法：固定步長，加上一個累積器</h4>
<p><b>固定時間步長</b>（fixed time step）的意思是：模擬永遠一次走固定的一小步，例如 1/60 秒；真實的一格過了多久，就補幾步。沒用完的零頭存在一個<b>累積器</b>（accumulator）裡，留給下一格。</p>
<pre><code>import { _decorator, Component } from 'cc';
const { ccclass } = _decorator;
const STEP = 1 / 60;

@ccclass('FixedSim')
export class FixedSim extends Component {
    private acc = 0;
    update(dt: number) {
        this.acc += Math.min(dt, 0.25);   // 卡太久就別一口氣補太多步
        while (this.acc &gt;= STEP) {
            this.simulate(STEP);          // 永遠用同一個步長
            this.acc -= STEP;
        }
        this.draw(this.acc / STEP);       // 0 到 1：用來在兩步之間插值
    }
    simulate(h: number) { /* 推進位置、檢查碰撞 */ }
    draw(alpha: number) { /* 把節點放在上一步和這一步之間 */ }
}</code></pre>
<p>拿四格不規則的 dt 走一次（單位是毫秒，一步是 16.67）：</p>
<figure class="figure"><svg viewBox="0 26 680 188" class="fg" style="width:100%;max-width:680px" role="img" aria-label="四個長短不一的真實影格，底下是五個等長的模擬步；40 毫秒的那一格跑了兩步，每格結束時累積器剩下的零頭">
<text x="16" y="63" class="fg-t">真實的一格</text>
<rect x="111" y="40" width="124" height="42" rx="5" class="fg-b alt"/><text x="173" y="58" text-anchor="middle" class="fg-t">20 ms</text><text x="173" y="74" text-anchor="middle" class="fg-t sm acc">跑 1 步</text>
<rect x="237" y="40" width="249" height="42" rx="5" class="fg-b warm"/><text x="361" y="58" text-anchor="middle" class="fg-t">40 ms（卡了一下）</text><text x="361" y="74" text-anchor="middle" class="fg-t sm acc">跑 2 步</text>
<rect x="488" y="40" width="61" height="42" rx="5" class="fg-b alt"/><text x="518" y="58" text-anchor="middle" class="fg-t">10 ms</text><text x="518" y="74" text-anchor="middle" class="fg-t sm acc">跑 1 步</text>
<rect x="551" y="40" width="98" height="42" rx="5" class="fg-b alt"/><text x="600" y="58" text-anchor="middle" class="fg-t">16 ms</text><text x="600" y="74" text-anchor="middle" class="fg-t sm acc">跑 1 步</text>
<text x="16" y="129" class="fg-t">模擬的一步</text>
<rect x="111" y="106" width="102" height="36" rx="5" class="fg-b alt"/><text x="162" y="129" text-anchor="middle" class="fg-t">第 1 步</text>
<rect x="216" y="106" width="102" height="36" rx="5" class="fg-b warm"/><text x="267" y="129" text-anchor="middle" class="fg-t">第 2 步</text>
<rect x="321" y="106" width="102" height="36" rx="5" class="fg-b warm"/><text x="372" y="129" text-anchor="middle" class="fg-t">第 3 步</text>
<rect x="426" y="106" width="101" height="36" rx="5" class="fg-b alt"/><text x="476" y="129" text-anchor="middle" class="fg-t">第 4 步</text>
<rect x="530" y="106" width="102" height="36" rx="5" class="fg-b alt"/><text x="581" y="129" text-anchor="middle" class="fg-t">第 5 步</text>
<line x1="236" y1="34" x2="236" y2="100" class="fg-l dim dash"/><line x1="236" y1="146" x2="236" y2="155" class="fg-l dim"/><line x1="487" y1="34" x2="487" y2="100" class="fg-l dim dash"/><line x1="487" y1="146" x2="487" y2="155" class="fg-l dim"/><line x1="550" y1="34" x2="550" y2="100" class="fg-l dim dash"/><line x1="550" y1="146" x2="550" y2="155" class="fg-l dim"/><line x1="650" y1="34" x2="650" y2="100" class="fg-l dim dash"/><line x1="650" y1="146" x2="650" y2="155" class="fg-l dim"/>
<text x="16" y="168" class="fg-t">累積器剩下</text>
<text x="236" y="168" text-anchor="middle" class="fg-t sm mono">3.3</text><text x="487" y="168" text-anchor="middle" class="fg-t sm mono">10</text><text x="550" y="168" text-anchor="middle" class="fg-t sm mono">3.3</text><text x="650" y="168" text-anchor="middle" class="fg-t sm mono">2.7</text>
<text x="380" y="200" text-anchor="middle" class="fg-t sm">5 步 × 16.67 = 83.3 ms，加上剩下的 2.7 ms，剛好是四格加起來的 86 ms</text>
</svg><figcaption>上面是長短不一的真實影格，下面是永遠等長的模擬步。卡了一下的那一格（橘色）一次補兩步；每格結束時沒用完的零頭，留在累積器裡給下一格。</figcaption></figure>
<table>
<tr><th>格</th><th>dt</th><th>累積器加上 dt</th><th>跑幾步</th><th>剩下</th></tr>
<tr><td>1</td><td>20</td><td>0 + 20 = 20</td><td>1</td><td>3.3</td></tr>
<tr><td>2</td><td>40</td><td>3.3 + 40 = 43.3</td><td>2</td><td>10</td></tr>
<tr><td>3</td><td>10</td><td>10 + 10 = 20</td><td>1</td><td>3.3</td></tr>
<tr><td>4</td><td>16</td><td>3.3 + 16 = 19.3</td><td>1</td><td>2.7</td></tr>
</table>
<p>不管 dt 怎麼跳，模擬看到的永遠是一模一樣的 1/60 秒。跳躍永遠是 120.8 像素，在 30 FPS 的手機上也一樣，只是那台手機每格要跑兩步。</p>
<p>還有兩個細節，決定這個做法能不能上線：</p>
<ul>
<li><b>插值</b>（interpolation）：畫面的時間點通常落在兩步之間。直接畫最後一步的位置，在 120 Hz 的螢幕上會一格動、一格不動，看起來在抖。用 <code>alpha</code> 在上一步和這一步的位置之間插值，動作就平順了。</li>
<li><b>死亡螺旋</b>（spiral of death）：如果一步模擬本身就要花超過 16.67 毫秒，每格要補的步數會越來越多，越補越慢，最後整個卡死。所以要像上面那樣，替 dt 設一個上限。</li>
</ul>
<h4>Cocos 裡誰用哪一種</h4>
<p>你的 <code>update</code>、補間、動畫都是可變步長。Cocos 的元件沒有 Unity 那種 <code>FixedUpdate</code>（Unity 預設每 0.02 秒呼叫一次）。物理模組則在內部用固定步長：3D 物理在專案設定（Project Settings）的物理分頁裡，可以設定固定時間步長（預設 1/60 秒）和每格最多補幾步；程式裡從 <code>PhysicsSystem.instance.fixedTimeStep</code> 讀取和調整，2D 物理的 <code>PhysicsSystem2D.instance</code> 也有同名的設定。換句話說，Cocos 的物理已經替你做好上面那個累積器。你自己手寫的「準物理」，例如自己算的跳躍和子彈，才需要自己決定要不要固定步長。</p>

<h3><span class="badge lv3">專業</span>五、16.7 毫秒的帳本：誰在吃你的時間</h3>
<p>60 FPS 的預算是 1000 ÷ 60 ≈ 16.7 毫秒；120 Hz 是 8.3 毫秒；30 FPS 是 33.3 毫秒。這筆預算也不全是你的：瀏覽器要處理事件、合成畫面，垃圾回收也隨時可能插隊。</p>
<figure class="figure"><svg viewBox="0 0 680 232" class="fg" style="width:100%;max-width:680px" role="img" aria-label="兩條預算長條：平常的一格還有 5.2 毫秒餘裕；碰上 6 毫秒的垃圾回收時，總長超過 16.7 毫秒">
<text x="40" y="26" class="fg-t sm">平常的一格（示意數字，單位毫秒）</text>
<rect x="40" y="36" width="54" height="50" class="fg-b"/><text x="67" y="57" text-anchor="middle" class="fg-t sm">瀏覽器</text><text x="67" y="74" text-anchor="middle" class="fg-t sm mono">1.5</text>
<rect x="94" y="36" width="108" height="50" class="fg-b hot"/><text x="148" y="57" text-anchor="middle" class="fg-t sm">輸入＋update</text><text x="148" y="74" text-anchor="middle" class="fg-t sm mono">3</text>
<rect x="202" y="36" width="72" height="50" class="fg-b hot"/><text x="238" y="57" text-anchor="middle" class="fg-t sm">系統</text><text x="238" y="74" text-anchor="middle" class="fg-t sm mono">2</text>
<rect x="274" y="36" width="108" height="50" class="fg-b alt"/><text x="328" y="57" text-anchor="middle" class="fg-t sm">變換＋批次</text><text x="328" y="74" text-anchor="middle" class="fg-t sm mono">3</text>
<rect x="382" y="36" width="72" height="50" class="fg-b alt"/><text x="418" y="57" text-anchor="middle" class="fg-t sm">送指令</text><text x="418" y="74" text-anchor="middle" class="fg-t sm mono">2</text>
<rect x="455" y="37" width="184" height="48" class="fg-l dash"/><text x="547" y="57" text-anchor="middle" class="fg-t sm">餘裕</text><text x="547" y="74" text-anchor="middle" class="fg-t sm mono">5.2</text>
<line x1="340" y1="86" x2="340" y2="94" class="fg-l warm"/>
<text x="40" y="106" class="fg-t sm">0</text><text x="340" y="106" text-anchor="middle" class="fg-t sm warm">8.3：120 Hz 的整格</text><text x="640" y="106" text-anchor="end" class="fg-t sm">16.7</text>
<text x="40" y="140" class="fg-t sm">碰上一次垃圾回收的那一格</text>
<rect x="40" y="150" width="54" height="50" class="fg-b"/><text x="67" y="171" text-anchor="middle" class="fg-t sm">瀏覽器</text><text x="67" y="188" text-anchor="middle" class="fg-t sm mono">1.5</text>
<rect x="94" y="150" width="108" height="50" class="fg-b hot"/><text x="148" y="171" text-anchor="middle" class="fg-t sm">輸入＋update</text><text x="148" y="188" text-anchor="middle" class="fg-t sm mono">3</text>
<rect x="202" y="150" width="216" height="50" class="fg-b warm"/><text x="310" y="171" text-anchor="middle" class="fg-t sm">垃圾回收 GC</text><text x="310" y="188" text-anchor="middle" class="fg-t sm mono">6</text>
<rect x="418" y="150" width="72" height="50" class="fg-b hot"/><text x="454" y="171" text-anchor="middle" class="fg-t sm">系統</text><text x="454" y="188" text-anchor="middle" class="fg-t sm mono">2</text>
<rect x="490" y="150" width="108" height="50" class="fg-b alt"/><text x="544" y="171" text-anchor="middle" class="fg-t sm">變換＋批次</text><text x="544" y="188" text-anchor="middle" class="fg-t sm mono">3</text>
<rect x="598" y="150" width="72" height="50" class="fg-b alt"/><text x="634" y="171" text-anchor="middle" class="fg-t sm">送指令</text><text x="634" y="188" text-anchor="middle" class="fg-t sm mono">2</text>
<line x1="640" y1="200" x2="640" y2="210" class="fg-l warm"/><line x1="640" y1="140" x2="640" y2="150" class="fg-l warm"/>
<text x="620" y="224" text-anchor="end" class="fg-t sm warm">16.7 在這裡：這一格超出預算</text>
</svg><figcaption>上面是一格健康的帳：還剩 5 毫秒左右的餘裕。下面同樣的工作，只是碰上一次 6 毫秒的垃圾回收，總長就超過 16.7 毫秒，這一拍趕不上。</figcaption></figure>
<h4>最常見的六個大胃王</h4>
<ol>
<li><b>update 裡的重複搜尋和重複計算。</b>每格 <code>find</code>、<code>getComponent</code>，或兩兩比對所有物件（100 個物件是 4,950 對，1,000 個就將近 50 萬對）。前者改成在 <code>onLoad</code> 找一次存起來，後者改成只比對附近格子裡的物件。</li>
<li><b>配置記憶體，餵出垃圾回收。</b>在 <code>update</code> 裡寫 <code>new Vec3()</code> 或 <code>pos.clone()</code>，300 個物件、每秒 60 格，就是每秒 18,000 個用過即丟的物件。垃圾回收（garbage collection，GC）遲早要停下來清，一次就可能吃掉好幾毫秒，而且你沒辦法決定它落在哪一格。Cocos 的數學函式大多有 <code>out</code> 參數，例如 <code>Vec3.add(out, a, b)</code>，讓你重複使用同一個暫存物件。</li>
<li><b>每格改文字。</b>用系統字型的 Label，每次改 <code>string</code>，引擎都要在一張看不見的 2D 畫布上重新排字、畫字，再把結果當成新的貼圖上傳給 GPU。分數一秒變 60 次，就是一秒重畫、上傳 60 次。只在數字真的變了才改；常常變的數字，用 BMFont，或把 Label 的快取模式設成 CHAR。</li>
<li><b>太多 draw call。</b>每一個 draw call，CPU 都要設定一堆狀態，再經過瀏覽器交給 GPU。網頁上這條路特別長，第七節會講為什麼。</li>
<li><b>過度繪製。</b>這是 GPU 那一側的成本：同一個像素被半透明的圖一層層蓋了好幾次。全螢幕的半透明遮罩疊個四、五層，在高解析度手機上就很有感。</li>
<li><b>第一次出現的大圖。</b>貼圖第一次要用時才會上傳到 GPU，一張大圖可能讓那一格多出好幾毫秒。在轉場或開場時先預載，就不會讓玩家在遊戲中途感覺到。</li>
</ol>
<h4>CPU 和 GPU 是平行的</h4>
<p>第 10 步和下一格的第 1 到 9 步是同時進行的。所以一格要多久，大約是「CPU 時間」和「GPU 時間」中<b>比較大的那一個</b>，而不是兩個相加。這帶來一個很實用的診斷法：把畫布解析度調低一半，如果影格率明顯變好，瓶頸在 GPU（像素太多、過度繪製）；如果幾乎不變，瓶頸在 CPU（你的程式、節點太多、draw call 太多）。方向找錯，最佳化半天都是白工。</p>
<h4>用什麼量</h4>
<ul>
<li><code>profiler.showStats()</code>（<code>profiler</code> 從 <code>'cc'</code> 匯入）在畫面角落顯示即時統計：FPS、每格時間、draw call 數，以及邏輯和繪製各花多少毫秒。先看這個，抓大方向。</li>
<li>Chrome DevTools 的 Performance 面板：錄幾秒，就能看到每一格裡是哪些函式在跑、垃圾回收在哪裡插隊。iPhone 上的問題，用 Mac 的 Safari 網頁檢閱器連過去看。</li>
<li>一律在<b>最低階的目標手機</b>上、用<b>正式版的建置</b>量。在你的 Mac 上跑預覽，數字可能好看好幾倍，什麼也看不出來。</li>
</ul>

<h3><span class="badge lv3">專業</span>六、繪製這一段：可見性、剔除、批次與 draw call</h3>
<p>第 8 到 10 步是引擎最花功夫的地方。拆成五個小步驟：</p>
<ol>
<li><b>誰該被哪台攝影機拍。</b>每個節點有一個圖層（layer），每台攝影機有一個可見遮罩（visibility）。兩者對不上，那台攝影機就不拍它。下一課會細講。</li>
<li><b>剔除</b>（culling）：完全在鏡頭外的東西不畫。3D 模型會拿它的包圍盒和攝影機的視錐比對，在外面就跳過。2D 的部分，不要假設引擎會替你剔除：一個有 500 列的捲動清單，畫面外的那幾百列照樣會被走訪、送去畫。長清單的正確做法，是只建立看得到的那十幾列，捲動時重複使用。</li>
<li><b>更新頂點資料。</b>每張圖在 GPU 眼中是 4 個頂點（vertex）、2 個三角形。節點的位置、大小、顏色變了，它的頂點就要用新的世界矩陣重算；沒變的就沿用上一格的結果。所以畫面上靜止的東西比較便宜，每格都在動的東西才貴。</li>
<li><b>批次合併</b>（batching）：照畫的順序走過去，相鄰而且「同一張貼圖、同一個材質、同樣的混合方式」的，合成一批，一次送出。</li>
<li><b>送出 draw call。</b>每一批，CPU 都要告訴 GPU：用哪個著色器（shader）、綁哪張貼圖、頂點資料在哪裡，再下一道「畫」的指令。這一道就是一個 draw call。</li>
</ol>
<figure class="figure"><svg viewBox="0 0 680 282" class="fg" style="width:100%;max-width:680px" role="img" aria-label="同樣六個節點，左邊牌和數字交錯排列，產生 5 個 draw call；右邊把牌和數字分成兩層，只要 2 個 draw call">
<text x="20" y="26" class="fg-t lg">交錯排列：5 個 draw call</text>
<rect x="20" y="44" width="190" height="28" rx="4" class="fg-b"/><text x="32" y="63" class="fg-t">背景</text><text x="200" y="63" text-anchor="end" class="fg-t sm">圖集 A</text>
<rect x="20" y="78" width="190" height="28" rx="4" class="fg-b"/><text x="32" y="97" class="fg-t">牌 1</text><text x="200" y="97" text-anchor="end" class="fg-t sm">圖集 A</text>
<rect x="20" y="112" width="190" height="28" rx="4" class="fg-b warm"/><text x="32" y="131" class="fg-t">牌 1 的數字</text><text x="200" y="131" text-anchor="end" class="fg-t sm">自己一張貼圖</text>
<rect x="20" y="146" width="190" height="28" rx="4" class="fg-b"/><text x="32" y="165" class="fg-t">牌 2</text><text x="200" y="165" text-anchor="end" class="fg-t sm">圖集 A</text>
<rect x="20" y="180" width="190" height="28" rx="4" class="fg-b warm"/><text x="32" y="199" class="fg-t">牌 2 的數字</text><text x="200" y="199" text-anchor="end" class="fg-t sm">自己一張貼圖</text>
<rect x="20" y="214" width="190" height="28" rx="4" class="fg-b"/><text x="32" y="233" class="fg-t">高／低按鈕</text><text x="200" y="233" text-anchor="end" class="fg-t sm">圖集 A</text>
<rect x="220" y="44" width="10" height="62" rx="3" class="fg-b hot"/><text x="240" y="79" class="fg-t sm acc">DC 1</text>
<rect x="220" y="112" width="10" height="28" rx="3" class="fg-b warm"/><text x="240" y="130" class="fg-t sm warm">DC 2</text>
<rect x="220" y="146" width="10" height="28" rx="3" class="fg-b hot"/><text x="240" y="164" class="fg-t sm acc">DC 3</text>
<rect x="220" y="180" width="10" height="28" rx="3" class="fg-b warm"/><text x="240" y="198" class="fg-t sm warm">DC 4</text>
<rect x="220" y="214" width="10" height="28" rx="3" class="fg-b hot"/><text x="240" y="232" class="fg-t sm acc">DC 5</text>
<line x1="340" y1="12" x2="340" y2="246" class="fg-l dim dash"/>
<text x="370" y="26" class="fg-t lg">分兩層：2 個 draw call</text>
<rect x="370" y="44" width="190" height="28" rx="4" class="fg-b"/><text x="382" y="63" class="fg-t">背景</text><text x="550" y="63" text-anchor="end" class="fg-t sm">圖集 A</text>
<rect x="370" y="78" width="190" height="28" rx="4" class="fg-b"/><text x="382" y="97" class="fg-t">牌 1</text><text x="550" y="97" text-anchor="end" class="fg-t sm">圖集 A</text>
<rect x="370" y="112" width="190" height="28" rx="4" class="fg-b"/><text x="382" y="131" class="fg-t">牌 2</text><text x="550" y="131" text-anchor="end" class="fg-t sm">圖集 A</text>
<rect x="370" y="146" width="190" height="28" rx="4" class="fg-b"/><text x="382" y="165" class="fg-t">高／低按鈕</text><text x="550" y="165" text-anchor="end" class="fg-t sm">圖集 A</text>
<rect x="370" y="180" width="190" height="28" rx="4" class="fg-b warm"/><text x="382" y="199" class="fg-t">牌 1 的數字</text><text x="550" y="199" text-anchor="end" class="fg-t sm">字元圖集</text>
<rect x="370" y="214" width="190" height="28" rx="4" class="fg-b warm"/><text x="382" y="233" class="fg-t">牌 2 的數字</text><text x="550" y="233" text-anchor="end" class="fg-t sm">字元圖集</text>
<rect x="570" y="44" width="10" height="130" rx="3" class="fg-b hot"/><text x="590" y="113" class="fg-t sm acc">DC 1</text>
<rect x="570" y="180" width="10" height="62" rx="3" class="fg-b warm"/><text x="590" y="215" class="fg-t sm warm">DC 2</text>
<text x="340" y="272" text-anchor="middle" class="fg-t sm">合併的條件：畫的順序相鄰，而且貼圖、材質、混合方式都一樣</text>
</svg><figcaption>由上往下是畫的順序。左邊牌和數字交錯，每換一次貼圖就斷一批。右邊把牌放在一個父節點下、數字放在另一個父節點下，數字的 Label 改用 CHAR 快取模式共用一張字元圖集，就只剩兩批。</figcaption></figure>
<p>左右兩邊畫出來的畫面一模一樣，差別只在節點樹的排法。52 張牌的牌桌，左邊的排法可能有一百多個 draw call，右邊還是 2 個。</p>
<p>會打斷批次的常見原因：不同的圖集、預設快取模式的 Label（每個 Label 自己一張貼圖）、遮罩（Mask，要動到模板緩衝區）、Graphics 畫的向量圖形、自訂材質、不同的混合模式。下一個模組的 UI 課有更完整的清單，這裡只要記得原理：<b>GPU 換狀態很貴，引擎想盡辦法讓它少換幾次。</b></p>
<h4>GPU 拿到 draw call 之後</h4>
<p>GPU 對每一批做三件事：頂點著色器（vertex shader）把每個頂點算到螢幕上的位置；光柵化（rasterization）找出三角形蓋住了哪些像素；片段著色器（fragment shader）替每個像素查貼圖、算顏色，再和畫布上原本的顏色混合。頂點很少（一張牌 4 個），像素很多（一張 200 × 280 的牌就是 56,000 個），所以 2D 遊戲在 GPU 上的成本，幾乎都在像素這一側。</p>
<p>算一筆帳：一支 1170 × 2532 像素的手機，整個畫面約 300 萬個像素。如果背景、牌桌、半透明遮罩、彈窗、彈窗的陰影一共疊了 5 層全螢幕，每格就要處理約 1,500 萬個像素，每秒 60 格就是將近 9 億個。這就是<b>過度繪製</b>（overdraw）和<b>填充率</b>（fill rate）會拖垮低階手機的原因。</p>
<p>貼圖的記憶體也是同一種算法：一張 2048 × 2048 的 RGBA 貼圖，每個像素 4 個位元組，就是 16 MB，跟它的 PNG 檔有多小無關。PNG 是下載用的壓縮，上傳到 GPU 之前會先解開。</p>

<h3><span class="badge lv4">專家</span>七、引擎在瀏覽器裡的分層：GFX、WebGL／WebGPU、WebAssembly</h3>
<figure class="figure"><svg viewBox="0 0 680 340" class="fg" style="width:100%;max-width:680px" role="img" aria-label="分層圖：你的 TypeScript、Cocos 引擎、GFX 抽象層、網頁或原生的圖形 API、瀏覽器 GPU 行程或作業系統、驅動程式與 GPU；旁邊是 WebAssembly 模組和其他瀏覽器 API">
<rect x="20" y="16" width="420" height="44" rx="6" class="fg-b hot"/><text x="230" y="35" text-anchor="middle" class="fg-t acc">你的 TypeScript</text><text x="230" y="52" text-anchor="middle" class="fg-t sm">建置時轉成 JavaScript</text>
<line x1="230" y1="60" x2="230" y2="64" class="fg-l"/><polygon points="230,72 225.5,64 234.5,64" class="fg-a"/>
<rect x="20" y="72" width="420" height="44" rx="6" class="fg-b"/><text x="230" y="91" text-anchor="middle" class="fg-t">Cocos 引擎（JavaScript）</text><text x="230" y="108" text-anchor="middle" class="fg-t sm">場景樹、元件、2D 批次、動畫、補間</text>
<line x1="230" y1="116" x2="230" y2="120" class="fg-l"/><polygon points="230,128 225.5,120 234.5,120" class="fg-a"/>
<rect x="20" y="128" width="420" height="44" rx="6" class="fg-b alt"/><text x="230" y="147" text-anchor="middle" class="fg-t">GFX 圖形抽象層</text><text x="230" y="164" text-anchor="middle" class="fg-t sm">上面只說「畫這一批」，它翻成真正的圖形 API</text>
<line x1="122" y1="172" x2="122" y2="176" class="fg-l"/><polygon points="122,184 117.5,176 126.5,176" class="fg-a"/>
<line x1="338" y1="172" x2="338" y2="176" class="fg-l"/><polygon points="338,184 333.5,176 342.5,176" class="fg-a"/>
<rect x="20" y="184" width="205" height="44" rx="6" class="fg-b"/><text x="122" y="203" text-anchor="middle" class="fg-t">網頁</text><text x="122" y="220" text-anchor="middle" class="fg-t sm">WebGL 2、WebGL 1、WebGPU</text>
<rect x="235" y="184" width="205" height="44" rx="6" class="fg-b"/><text x="338" y="203" text-anchor="middle" class="fg-t">原生 App</text><text x="338" y="220" text-anchor="middle" class="fg-t sm">Metal、Vulkan、OpenGL ES</text>
<line x1="122" y1="228" x2="122" y2="232" class="fg-l"/><polygon points="122,240 117.5,232 126.5,232" class="fg-a"/>
<line x1="338" y1="228" x2="338" y2="232" class="fg-l"/><polygon points="338,240 333.5,232 342.5,232" class="fg-a"/>
<rect x="20" y="240" width="205" height="44" rx="6" class="fg-b"/><text x="122" y="259" text-anchor="middle" class="fg-t">瀏覽器的 GPU 行程</text><text x="122" y="276" text-anchor="middle" class="fg-t sm">檢查、轉譯（例如 ANGLE）</text>
<rect x="235" y="240" width="205" height="44" rx="6" class="fg-b"/><text x="338" y="259" text-anchor="middle" class="fg-t">作業系統</text><text x="338" y="276" text-anchor="middle" class="fg-t sm">直接交給驅動程式</text>
<line x1="122" y1="284" x2="122" y2="288" class="fg-l"/><polygon points="122,296 117.5,288 126.5,288" class="fg-a"/>
<line x1="338" y1="284" x2="338" y2="288" class="fg-l"/><polygon points="338,296 333.5,288 342.5,288" class="fg-a"/>
<rect x="20" y="296" width="420" height="36" rx="6" class="fg-b warm"/><text x="230" y="319" text-anchor="middle" class="fg-t">顯示驅動程式，再到 GPU</text>
<text x="570" y="60" text-anchor="middle" class="fg-t sm">引擎旁邊的幫手</text>
<rect x="480" y="72" width="180" height="44" rx="6" class="fg-b alt"/><text x="570" y="91" text-anchor="middle" class="fg-t">WebAssembly 模組</text><text x="570" y="108" text-anchor="middle" class="fg-t sm">物理：Bullet、PhysX</text>
<rect x="480" y="128" width="180" height="44" rx="6" class="fg-b"/><text x="570" y="147" text-anchor="middle" class="fg-t">其他瀏覽器 API</text><text x="570" y="164" text-anchor="middle" class="fg-t sm">音效、觸控、網路</text>
<line x1="448" y1="94" x2="472" y2="94" class="fg-l alt"/><polygon points="480,94 472,89.5 472,98.5" class="fg-a alt"/><polygon points="440,94 448,89.5 448,98.5" class="fg-a alt"/>
<path d="M440 108 H458 V150 H472" class="fg-l"/><polygon points="480,150 472,145.5 472,154.5" class="fg-a"/>
</svg><figcaption>同一份遊戲，靠 GFX 這一層在不同平台換上不同的圖形 API。網頁上多了「瀏覽器的 GPU 行程」這一段，這是網頁的 draw call 比原生貴的原因。</figcaption></figure>
<p>由上往下看：</p>
<ul>
<li><b>你的 TypeScript</b>，建置時被轉成 JavaScript，和引擎一起跑在瀏覽器的 JavaScript 引擎裡（Chrome 用的是 V8）。</li>
<li><b>Cocos 引擎本體</b>在網頁上也是 JavaScript：場景樹、元件排程、2D 批次、動畫、補間都在這一層。</li>
<li><b>GFX</b> 是 Cocos 3.x 自己的圖形抽象層。上面的程式只說「建立貼圖」「設定管線狀態」「畫這一批」，GFX 再翻譯成底下真正的圖形 API。同一份遊戲，網頁上走 WebGL，iOS 走 Metal，Android 走 Vulkan 或 OpenGL ES，靠的就是這一層。</li>
<li><b>網頁上的後端</b>：預設用 WebGL 2，不支援的瀏覽器退回 WebGL 1。WebGPU 是新一代的網頁圖形 API，Cocos 3.8 對它的支援還屬實驗性質，也不是每台手機的瀏覽器都有，所以正式上線的網頁遊戲，目前多半還是跑 WebGL。</li>
<li><b>WebAssembly 模組</b>：有些部分原本是用 C++ 寫的，例如 3D 物理的 Bullet 和 PhysX，就被編譯成 WebAssembly（wasm）在瀏覽器裡跑。你在專案設定的功能裁剪（Feature Cropping）裡選了哪一個物理後端，建置時就帶哪一個。</li>
</ul>
<h4>為什麼網頁上的 draw call 特別貴</h4>
<p>在原生 App 裡，一個 draw call 是程式透過圖形 API 直接交給驅動程式。在 Chrome 裡，你的 WebGL 呼叫要先經過瀏覽器的檢查（確保網頁不能讓 GPU 做出危險的事），再被打包送到另一個獨立的 GPU 行程，由它去呼叫驅動程式；在 Windows 上，Chrome 還會透過一個叫 ANGLE 的轉譯層，把 WebGL 翻成 Direct3D。每一層都是為了安全和相容，但每一層都要 CPU 時間。所以同樣 200 個 draw call，在網頁上比在原生上吃更多 CPU，網頁遊戲對批次合併要更斤斤計較。</p>
<h4>跨過 JavaScript 和 WebAssembly 的邊界</h4>
<p>wasm 算數學很快，但 JavaScript 和 wasm 之間每來回一次都有成本，資料也常常要複製。所以物理引擎的做法是一格整批同步：把所有剛體的位置一次寫進去、模擬、再一次讀回來，而不是每個物件各問一次。你自己用 wasm 寫模組時也一樣：<b>少來回，一次多帶一點。</b></p>
<h4>幾個只有網頁才會遇到的邊界情況</h4>
<ul>
<li><b>跨網域的圖片需要 CORS。</b>WebGL 不准把別的網域、沒有 CORS 授權的圖片當成貼圖，這是為了防止網頁偷讀別人網站的圖片內容。你把資源放到另一個網域的 CDN 上，伺服器就要回傳 <code>Access-Control-Allow-Origin</code> 標頭，否則圖片下載得到，卻畫不出來。</li>
<li><b>WebGL 環境可能遺失。</b>GPU 重置、系統資源不夠，或同一頁開了太多 WebGL 畫布，瀏覽器會發出 <code>webglcontextlost</code> 事件，畫布上所有貼圖和緩衝都沒了。能不能自動恢復要看版本和平台，至少要讓你的錯誤監控抓得到它。</li>
<li><b>iOS 對記憶體很嚴格。</b>iPhone 上的瀏覽器分頁用了太多記憶體，系統會直接把頁面重新載入，玩家看到的是遊戲「自己重開」。貼圖記憶體是最常見的元兇，拿上一節的公式算一算就知道。</li>
<li><b>GPU 資訊可以拿來追蹤使用者。</b>WebGL 查得到顯示晶片的型號，廣告追蹤程式會拿它做瀏覽器指紋（fingerprinting）。你在錯誤回報裡收集裝置資訊時，也要遵守隱私規範。</li>
</ul>

<h3><span class="badge lv4">專家</span>八、編輯器、執行階段、建置：同一份程式的三個世界</h3>
<p>你的程式碼一生會待在三個不同的地方，每個地方的規矩不一樣：</p>
<table>
<tr><th></th><th>編輯器</th><th>預覽</th><th>建置之後</th></tr>
<tr><td>在哪裡跑</td><td>你電腦上的編輯器（一個用 Electron 做成的桌面 App）</td><td>你電腦上的瀏覽器</td><td>玩家的瀏覽器或手機</td></tr>
<tr><td>引擎</td><td>編輯器模式，用來畫場景視窗</td><td>開發版，檢查多、警告多</td><td>依功能裁剪縮小、壓縮過</td></tr>
<tr><td>你的元件會不會跑</td><td>預設不跑；加了 <code>@executeInEditMode</code> 才跑</td><td>會</td><td>會</td></tr>
<tr><td><code>DEBUG</code> 常數</td><td>不適用</td><td>true</td><td>看建置面板有沒有勾選除錯（Debug）</td></tr>
</table>
<h4>編輯器裡發生的事</h4>
<p>你把一張 PNG 拖進 <code>assets</code> 資料夾，編輯器的資源資料庫（asset database）會替它產生一個 <code>.meta</code> 檔，裡面最重要的是一個 uuid：場景和預製件（prefab）是用 uuid、而不是檔名去參照資源的。編輯器還會把資源「匯入」成引擎能直接用的格式，放在 <code>library</code> 資料夾。所以：</p>
<ul>
<li><code>.meta</code> 檔一定要進版本控制。弄丟了，uuid 重新產生，所有參照它的場景就斷了。</li>
<li><code>library</code>、<code>temp</code>、<code>local</code>、<code>build</code> 這幾個資料夾都是產生出來的，不要進版本控制。</li>
<li>在檔案總管裡直接改名、搬檔，<code>.meta</code> 沒跟著走，參照就會斷。盡量在編輯器裡做。</li>
</ul>
<h4>你的 TypeScript 怎麼變成遊戲裡的程式</h4>
<p>編輯器編譯腳本時，主要是把型別拿掉、轉成 JavaScript，<b>不會像 <code>tsc</code> 那樣完整檢查型別</b>。所以型別錯誤不一定會擋住預覽和建置。專案大了，在 CI 裡跑一次 <code>tsc --noEmit</code>，讓型別錯誤在合併之前就被抓到。</p>
<p>引擎提供一組在建置時就知道值的常數，從 <code>'cc/env'</code> 匯入：</p>
<pre><code>import { DEBUG, EDITOR } from 'cc/env';

if (DEBUG) {
    console.log('只有除錯版會印出來');
}
if (!EDITOR) {
    // 只在遊戲真的跑起來時才連伺服器，編輯器裡不要
}</code></pre>
<p>這些值在建置時就固定了，建置工具看得出哪些分支永遠不會執行，可以整段拿掉。這比你自己在程式裡放一個 <code>isDev</code> 變數更乾淨，正式版也不會帶著除錯用的程式碼。</p>
<h4>建置做了哪些事</h4>
<ol>
<li>依功能裁剪，只打包用得到的引擎模組：沒用 3D 物理，就不帶物理的 wasm；沒用 Spine，就不帶 Spine 的執行階段。網頁遊戲的首次載入時間，常常就差在這裡。</li>
<li>把你的腳本打包、壓縮。</li>
<li>把場景和預製件序列化成資料檔，圖片依設定壓縮、合圖，分成一個個資源包（asset bundle）。</li>
<li>寫出一個帶 <code>index.html</code> 的資料夾，像 Vite 的 <code>dist</code> 一樣，放到任何靜態伺服器或 CDN 上都能跑。</li>
</ol>
<p>最後一個專家級的提醒：<b>預覽好好的，不代表建置之後也好好的。</b>預覽用的是開發版引擎和沒壓縮的腳本，資源也是即時從編輯器讀；建置之後換成壓縮過的程式、打包過的資源、另一個網域、另一套快取策略。上線之前，一定要拿建置後的版本在真的手機上跑過一輪。</p>

<h3>九、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>update 一格跑一次，所以 dt 永遠是 1/60</td><td>dt 每格都不同。卡頓、切背景回來、120 Hz 螢幕，都會讓它變。</td></tr>
<tr><td>平均 FPS 夠高就不會卡</td><td>卡頓來自最慢的那幾格。要看每格時間的分布，不是平均。</td></tr>
<tr><td>乘上 dt，所有裝置的結果就一模一樣</td><td>速度一樣，但積分誤差和穿隧還在。需要一致的結果，就用固定步長。</td></tr>
<tr><td><code>director.pause()</code> 和 <code>game.pause()</code> 一樣</td><td>前者只停邏輯，照樣繪製、照樣收輸入；後者把整個迴圈停掉。</td></tr>
<tr><td>畫面上沒在動的東西不花錢</td><td>它還是每格被走訪、送去畫，只是不用重算頂點。數量多了一樣有感。</td></tr>
<tr><td>draw call 越少一定越好</td><td>為了合批把所有圖塞進一張超大圖集，可能讓記憶體爆掉、載入變慢。要取捨，不是越少越好。</td></tr>
<tr><td>Mac 上預覽跑得到 60 FPS，手機也會</td><td>預覽是開發版，Mac 的 CPU 和 GPU 又強上好幾倍。要在最低階的目標手機上、用正式版量。</td></tr>
</table>

<h3>十、跟你的工作連起來</h3>
<ul>
<li><b>前端與 Vue</b>：你熟的 Chrome Performance 面板、<code>requestAnimationFrame</code>，在遊戲裡一樣是主力工具。差別是 Vue 頁面大部分時間閒著，遊戲每一格都在工作，所以「長任務」對遊戲的傷害更大。Vue 頁面裡如果嵌了一個 Cocos 遊戲，記得兩者共用同一條主執行緒：頁面上一段很重的同步程式，也會讓遊戲掉幀。</li>
<li><b>TypeScript</b>：編輯器不完整檢查型別，CI 裡的 <code>tsc --noEmit</code> 就是你的安全網。</li>
<li><b>Cocos 與 Unity</b>：Unity 的 <code>Update</code>、<code>LateUpdate</code> 對應 Cocos 的 <code>update</code>、<code>lateUpdate</code>；Unity 多一個固定步長的 <code>FixedUpdate</code>，Cocos 則把固定步長藏在物理系統裡。兩邊的效能分析工具都在回答同一個問題：這一格的時間花在哪。</li>
<li><b>後端、Node.js 與 Go</b>：多人遊戲的伺服器也有自己的迴圈，通常用固定的節奏（例如每秒 20 或 30 次）推進遊戲狀態，用的就是第四節的累積器。用 <code>setInterval</code> 或 Go 的 <code>time.Ticker</code> 做伺服器迴圈時，別假設每次間隔都準，量實際經過的時間。</li>
<li><b>Docker、雲端與 CDN</b>：網頁遊戲的資源放在 CDN 上，要設好 CORS 標頭，否則貼圖畫不出來；<code>.wasm</code> 檔要用正確的 MIME 類型（<code>application/wasm</code>）送出，並開啟 gzip 或 Brotli 壓縮；檔名帶雜湊的資源可以設很長的快取時間，<code>index.html</code> 則不要快取太久。</li>
</ul>

<h3>十一、面試會怎麼問</h3>
<p>遊戲前端、引擎相關職缺的面試裡，這些題目很常見。先自己出聲講一遍，再打開參考答案。</p>
<ol>
<li>「說說一個遊戲引擎的一格裡發生了什麼。update 和 lateUpdate 差在哪裡？」</li>
<li>「為什麼移動要乘上 dt？乘了之後還會有什麼問題？」</li>
<li>「固定時間步長怎麼實作？死亡螺旋是什麼，怎麼避免？」</li>
<li>「你的網頁遊戲在低階手機上掉幀，你會怎麼查？」</li>
<li>「什麼是 draw call？為什麼要合批？什麼會打斷合批？」</li>
<li>「用 requestAnimationFrame 和用 setInterval 做遊戲迴圈，差在哪裡？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>一格依序是：處理輸入事件、新元件的 start、所有元件的 update、引擎系統的更新（計時器、補間、動畫）、所有元件的 lateUpdate、延後銷毀、物理，然後收集要畫的東西、合批、送出 draw call，最後 GPU 繪製，GPU 和 CPU 準備下一格是平行的。lateUpdate 保證在這一格所有 update 和系統更新之後才執行，所以適合放「要等別人動完」的邏輯，例如攝影機跟隨。</li>
<li>每格的時間長短不一，乘上 dt 讓速度以「每秒」計算，不受影格率影響。但每一步都假設這段時間內速度不變，步長不同，積分結果就不同（跳躍高度會差幾像素）；步長太大時，快速物體可能一步跨過障礙物（穿隧）；而且結果無法在不同機器上重現。需要穩定一致的結果時，改用固定時間步長。</li>
<li>維護一個累積器：每格把 dt 加進去，只要累積器大於等於固定步長，就模擬一步並扣掉一個步長，剩下的零頭留給下一格；繪製時用「零頭 ÷ 步長」在上一步和這一步之間插值。死亡螺旋是一步模擬的實際耗時超過步長本身，導致每格要補的步數越來越多。解法是替每格加進去的 dt 設上限、限制每格最多補幾步，必要時直接降低模擬品質。</li>
<li>先在最低階的目標機器上用正式版建置重現，打開引擎的統計面板看 FPS、每格時間和 draw call 數，再用瀏覽器的效能分析工具錄幾秒。接著判斷瓶頸在 CPU 還是 GPU：降低解析度，如果明顯變好就是 GPU（像素、過度繪製），否則是 CPU。CPU 端再分是腳本（update 裡的搜尋和計算、配置記憶體造成的 GC）、節點數量，還是 draw call 太多，針對最大的那一塊下手，改完再量一次。</li>
<li>draw call 是 CPU 對 GPU 下的一道繪製指令，每一道之前都要設定著色器、貼圖、混合等狀態，成本主要在 CPU 和驅動程式，網頁上還要經過瀏覽器的檢查和 GPU 行程。合批是把畫的順序相鄰、狀態完全相同的東西合成一道指令。打斷合批的常見原因：不同的貼圖或圖集、不同的材質或混合模式、遮罩、每個 Label 各自一張貼圖、Graphics 等不同類型的繪製，以及節點樹的順序讓不同貼圖交錯。</li>
<li>requestAnimationFrame 由瀏覽器在每次畫面更新前呼叫，自動對齊螢幕的更新率，分頁在背景時會停，省電也不會白算。setInterval 跟畫面更新沒有對齊，可能在一次刷新之間跑兩次或一次都沒跑，造成畫面不平順；它的間隔也不精確，在背景還會被節流。遊戲迴圈應該用 requestAnimationFrame，並用實際經過的時間計算 dt。</li>
</ol>
</details>

<h3>十二、練功題（做得出來才算真的懂）</h3>
<ol>
<li>一支 120 Hz 的手機，你把 <code>game.frameRate</code> 設成 120。一個速度 300 像素／秒的物體，每格移動幾像素？改回 60，又是幾像素？每秒走的距離有沒有變？</li>
<li>固定步長 16.67 毫秒，dt 依序是 30、5、5、40 毫秒（都沒超過上限）。每一格各跑幾步？最後累積器剩多少？</li>
<li>一支 1080 × 2400 的手機，畫面上有 3 層全螢幕的圖，加上一個佔半個螢幕的彈窗。每格要畫多少個像素？每秒 60 格呢？</li>
<li>畫的順序是：背景（圖集 A）、牌（圖集 A）、數字（預設快取模式的 Label）、牌（圖集 A）、數字（預設快取模式的 Label）、按鈕（圖集 B）。這樣有幾個 draw call？把兩張牌移到一起、兩個數字移到一起，變成幾個？數字再改成 CHAR 快取模式呢？</li>
<li>把第三節的 <code>FrameProbe</code> 掛進你的專案，再加一個補間，在補間的 <code>onUpdate</code> 裡也印一行。先預測它會出現在哪兩行之間，再跑跑看。</li>
<li>一個遊戲用了 3 張 2048 × 2048 的圖集，加上 10 張 1280 × 720 的背景，全部是 RGBA。光是這些貼圖，在 GPU 上大約佔多少記憶體？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>120 FPS 時 dt = 1/120，每格移動 300 ÷ 120 = 2.5 像素；60 FPS 時每格 5 像素。每秒都是 300 像素，沒有變，這就是乘上 dt 的目的。</li>
<li>第 1 格：0 + 30 = 30，跑 1 步，剩 13.33。第 2 格：13.33 + 5 = 18.33，跑 1 步，剩 1.67。第 3 格：1.67 + 5 = 6.67，一步都不跑，剩 6.67。第 4 格：6.67 + 40 = 46.67，跑 2 步，剩 13.33。總共 80 毫秒跑了 4 步（66.67 毫秒），剩 13.33，對得起來。注意第 3 格一步都沒跑，這時插值就很重要，否則那一格畫面不會動。</li>
<li>一層是 1080 × 2400 = 2,592,000 個像素。3 層是 7,776,000，加上半層 1,296,000，每格約 907 萬個像素。每秒 60 格約 5.4 億個。</li>
<li>原本：背景＋牌合成第 1 批，數字第 2 批，牌第 3 批，數字第 4 批，按鈕（圖集 B）第 5 批，共 5 個。排在一起之後：背景＋兩張牌 1 批，兩個數字因為各自一張貼圖還是 2 批，按鈕 1 批，共 4 個。數字改成 CHAR 模式後共用一張字元圖集，兩個數字合成 1 批，共 3 個。</li>
<li>補間是引擎的系統之一，所以它的那一行會出現在 update 之後、lateUpdate 之前，和 schedule 那一行在同一段裡。它和 schedule 誰先誰後，由引擎內部系統的優先順序決定，不要寫依賴這個先後的程式。</li>
<li>一張 2048 × 2048 × 4 位元組 = 16 MB，3 張是 48 MB。一張 1280 × 720 × 4 位元組約 3.5 MB，10 張約 35 MB。合計約 83 MB，還沒算 mipmap 和其他資源。在 iPhone 的瀏覽器上，這已經值得認真考慮壓縮貼圖或按場景分批載入。</li>
</ol>
</details>

<h3>十三、想再挖深</h3>
<ul>
<li><b>Cocos Creator 3.8 官方使用手冊</b>（docs.cocos.com/creator/3.8/manual）：腳本、渲染、效能最佳化相關的章節。本章的每個名詞都能在裡面找到對應的頁面。</li>
<li><b>cocos-engine 原始碼</b>（github.com/cocos/cocos-engine）：打開 <code>director.ts</code>，找到 <code>tick</code> 函式，本章第一張圖的每一步都在那幾十行裡。讀引擎原始碼，是從「會用」走到「專家」最直接的一步。</li>
<li><b>Robert Nystrom《Game Programming Patterns》</b>（gameprogrammingpatterns.com，可免費線上閱讀）：「Game Loop」和「Update Method」兩章，把遊戲迴圈和固定步長講得非常清楚。</li>
<li><b>Glenn Fiedler〈Fix Your Timestep!〉</b>（gafferongames.com）：固定步長與累積器的經典文章，幾乎所有遊戲引擎的物理迴圈都受它影響。</li>
<li><b>WebGL Fundamentals</b>（webglfundamentals.org）：免費教學，從零寫 WebGL，親手做一次「頂點、貼圖、draw call」，第六、七節就不再抽象。</li>
</ul>
` });
