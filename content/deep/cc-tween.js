DEEP({ 'cc-tween': `
<p>上一課你用 tween 做出了滑動、翻牌、數字跳動，也知道要在 <code>onDestroy</code> 把它停掉。這一章把 tween 拆開來看：緩動曲線背後是哪幾條算式，畫出來長什麼樣子；tween 系統每個影格到底做了什麼，為什麼它在 30 和 120 FPS 下一樣快；sequence、parallel 怎麼組成一條時間軸；Animation 片段和 Spine 骨骼動畫又是怎麼運作、效能花在哪裡。最後談兩件決定遊戲「好不好玩」的事：手感（juice），以及不會留下殘骸的清理習慣。引擎行為以 Cocos Creator 3.8 的原始碼為準。</p>

<h3><span class="badge lv1">基礎</span>一、補間就是「起點 + 差距 × 進度」</h3>
<p>傳統手繪動畫裡，主畫師只畫關鍵的幾張（例如揮拳的起點和終點），中間那些過渡的畫面交給助手補，這叫「補中間張」（inbetweening），tween 這個字就是從這裡來的。引擎就是那個助手：你給起點、終點、時間，它每個影格補一張。</p>
<p>它補的方法只有一條算式：</p>
<pre><code>t     = elapsed / duration     // 0 to 1
value = start + (end - start) * ease(t)</code></pre>
<p><code>t</code> 是「時間走到幾成」，<code>ease(t)</code> 是「位置走到幾成」。沒有緩動時兩者相等，有緩動時，同一個時間點，位置可以超前、落後，甚至衝過頭。用一張牌實際算：x 從 −300 移到 0，花 0.3 秒，看 0.15 秒（t = 0.5）那一刻：</p>
<table>
<tr><th>緩動</th><th>ease(0.5)</th><th>x 在哪裡</th></tr>
<tr><td>linear</td><td>0.5</td><td>−300 + 300 × 0.5 = −150</td></tr>
<tr><td>quadIn</td><td>0.25</td><td>−225，還在起點附近慢慢起步</td></tr>
<tr><td>quadOut</td><td>0.75</td><td>−75，已經快到了</td></tr>
<tr><td>backOut</td><td>1.088</td><td>+26.3，已經衝過終點，等一下再退回來</td></tr>
</table>
<p>所以緩動不是「讓動畫好看一點」的裝飾，它直接決定了每一個影格的位置。</p>

<h3><span class="badge lv1">基礎</span>二、緩動函式的數學，畫出來看</h3>
<p>下面每一格，橫軸是時間 t（0 到 1），縱軸是進度 ease(t)。虛線是 linear，拿來對照。</p>
<figure class="figure"><svg viewBox="0 0 680 385" class="fg" style="width:100%;max-width:680px" role="img" aria-label="八條緩動曲線：linear、quadIn、quadOut、sineInOut、cubicOut、backOut、elasticOut、bounceOut，橫軸是時間，縱軸是進度">
<text x="95" y="24" text-anchor="middle" class="fg-t mono">linear</text>
<rect x="30" y="60" width="130" height="90" class="fg-b"/>
<line x1="30" y1="150" x2="160" y2="60" class="fg-l dim dash"/>
<polyline points="30.0,150.0 34.3,147.0 38.7,144.0 43.0,141.0 47.3,138.0 51.7,135.0 56.0,132.0 60.3,129.0 64.7,126.0 69.0,123.0 73.3,120.0 77.7,117.0 82.0,114.0 86.3,111.0 90.7,108.0 95.0,105.0 99.3,102.0 103.7,99.0 108.0,96.0 112.3,93.0 116.7,90.0 121.0,87.0 125.3,84.0 129.7,81.0 134.0,78.0 138.3,75.0 142.7,72.0 147.0,69.0 151.3,66.0 155.7,63.0 160.0,60.0" class="fg-l on"/>
<text x="95" y="172" text-anchor="middle" class="fg-t sm">t</text>
<text x="257" y="24" text-anchor="middle" class="fg-t mono">quadIn</text>
<rect x="192" y="60" width="130" height="90" class="fg-b"/>
<line x1="192" y1="150" x2="322" y2="60" class="fg-l dim dash"/>
<polyline points="192.0,150.0 196.3,149.9 200.7,149.6 205.0,149.1 209.3,148.4 213.7,147.5 218.0,146.4 222.3,145.1 226.7,143.6 231.0,141.9 235.3,140.0 239.7,137.9 244.0,135.6 248.3,133.1 252.7,130.4 257.0,127.5 261.3,124.4 265.7,121.1 270.0,117.6 274.3,113.9 278.7,110.0 283.0,105.9 287.3,101.6 291.7,97.1 296.0,92.4 300.3,87.5 304.7,82.4 309.0,77.1 313.3,71.6 317.7,65.9 322.0,60.0" class="fg-l on"/>
<text x="257" y="172" text-anchor="middle" class="fg-t sm">t²</text>
<text x="419" y="24" text-anchor="middle" class="fg-t mono">quadOut</text>
<rect x="354" y="60" width="130" height="90" class="fg-b"/>
<line x1="354" y1="150" x2="484" y2="60" class="fg-l dim dash"/>
<polyline points="354.0,150.0 358.3,144.1 362.7,138.4 367.0,132.9 371.3,127.6 375.7,122.5 380.0,117.6 384.3,112.9 388.7,108.4 393.0,104.1 397.3,100.0 401.7,96.1 406.0,92.4 410.3,88.9 414.7,85.6 419.0,82.5 423.3,79.6 427.7,76.9 432.0,74.4 436.3,72.1 440.7,70.0 445.0,68.1 449.3,66.4 453.7,64.9 458.0,63.6 462.3,62.5 466.7,61.6 471.0,60.9 475.3,60.4 479.7,60.1 484.0,60.0" class="fg-l on"/>
<text x="419" y="172" text-anchor="middle" class="fg-t sm">1 − (1 − t)²</text>
<text x="581" y="24" text-anchor="middle" class="fg-t mono">sineInOut</text>
<rect x="516" y="60" width="130" height="90" class="fg-b"/>
<line x1="516" y1="150" x2="646" y2="60" class="fg-l dim dash"/>
<polyline points="516.0,150.0 520.3,149.8 524.7,149.0 529.0,147.8 533.3,146.1 537.7,144.0 542.0,141.4 546.3,138.4 550.7,135.1 555.0,131.5 559.3,127.5 563.7,123.3 568.0,118.9 572.3,114.4 576.7,109.7 581.0,105.0 585.3,100.3 589.7,95.6 594.0,91.1 598.3,86.7 602.7,82.5 607.0,78.5 611.3,74.9 615.7,71.6 620.0,68.6 624.3,66.0 628.7,63.9 633.0,62.2 637.3,61.0 641.7,60.2 646.0,60.0" class="fg-l on"/>
<text x="581" y="172" text-anchor="middle" class="fg-t sm">(1 − cos πt) ÷ 2</text>
<text x="95" y="224" text-anchor="middle" class="fg-t mono">cubicOut</text>
<rect x="30" y="260" width="130" height="90" class="fg-b"/>
<line x1="30" y1="350" x2="160" y2="260" class="fg-l dim dash"/>
<polyline points="30.0,350.0 34.3,341.3 38.7,333.2 43.0,325.6 47.3,318.6 51.7,312.1 56.0,306.1 60.3,300.6 64.7,295.5 69.0,290.9 73.3,286.7 77.7,282.9 82.0,279.4 86.3,276.4 90.7,273.7 95.0,271.2 99.3,269.1 103.7,267.3 108.0,265.8 112.3,264.4 116.7,263.3 121.0,262.4 125.3,261.7 129.7,261.1 134.0,260.7 138.3,260.4 142.7,260.2 147.0,260.1 151.3,260.0 155.7,260.0 160.0,260.0" class="fg-l on"/>
<text x="95" y="372" text-anchor="middle" class="fg-t sm">1 − (1 − t)³</text>
<text x="257" y="224" text-anchor="middle" class="fg-t mono">backOut</text>
<rect x="192" y="260" width="130" height="90" class="fg-b"/>
<line x1="192" y1="350" x2="322" y2="260" class="fg-l dim dash"/>
<polyline points="192.0,350.0 196.3,336.5 200.7,324.3 205.0,313.2 209.3,303.2 213.7,294.4 218.0,286.5 222.3,279.6 226.7,273.5 231.0,268.4 235.3,264.0 239.7,260.3 244.0,257.4 248.3,255.1 252.7,253.3 257.0,252.1 261.3,251.4 265.7,251.0 270.0,251.1 274.3,251.4 278.7,252.0 283.0,252.8 287.3,253.7 291.7,254.8 296.0,255.8 300.3,256.9 304.7,257.9 309.0,258.7 313.3,259.4 317.7,259.8 322.0,260.0" class="fg-l on"/>
<text x="257" y="372" text-anchor="middle" class="fg-t sm">過衝約 10%</text>
<text x="419" y="224" text-anchor="middle" class="fg-t mono">elasticOut</text>
<rect x="354" y="260" width="130" height="90" class="fg-b"/>
<line x1="354" y1="350" x2="484" y2="260" class="fg-l dim dash"/>
<polyline points="354.0,350.0 355.3,342.9 356.6,334.5 357.9,325.1 359.2,315.2 360.5,305.0 361.8,294.9 363.1,285.2 364.4,276.0 365.7,267.5 367.0,260.0 368.3,253.4 369.6,247.9 370.9,243.4 372.2,240.0 373.5,237.5 374.8,236.0 376.1,235.3 377.4,235.4 378.7,236.2 380.0,237.5 381.3,239.3 382.6,241.4 383.9,243.7 385.2,246.2 386.5,248.8 387.8,251.3 389.1,253.7 390.4,256.0 391.7,258.1 393.0,260.0 394.3,261.6 395.6,263.0 396.9,264.1 398.2,265.0 399.5,265.6 400.8,266.0 402.1,266.2 403.4,266.1 404.7,266.0 406.0,265.6 407.3,265.2 408.6,264.7 409.9,264.1 411.2,263.4 412.5,262.8 413.8,262.2 415.1,261.6 416.4,261.0 417.7,260.5 419.0,260.0 420.3,259.6 421.6,259.2 422.9,259.0 424.2,258.7 425.5,258.6 426.8,258.5 428.1,258.5 429.4,258.5 430.7,258.5 432.0,258.6 433.3,258.7 434.6,258.8 435.9,259.0 437.2,259.1 438.5,259.3 439.8,259.5 441.1,259.6 442.4,259.8 443.7,259.9 445.0,260.0 446.3,260.1 447.6,260.2 448.9,260.3 450.2,260.3 451.5,260.4 452.8,260.4 454.1,260.4 455.4,260.4 456.7,260.4 458.0,260.4 459.3,260.3 460.6,260.3 461.9,260.3 463.2,260.2 464.5,260.2 465.8,260.1 467.1,260.1 468.4,260.1 469.7,260.0 471.0,260.0 472.3,260.0 473.6,260.0 474.9,259.9 476.2,259.9 477.5,259.9 478.8,259.9 480.1,259.9 481.4,259.9 482.7,259.9 484.0,260.0" class="fg-l on"/>
<text x="419" y="372" text-anchor="middle" class="fg-t sm">衰減的正弦波</text>
<text x="581" y="224" text-anchor="middle" class="fg-t mono">bounceOut</text>
<rect x="516" y="260" width="130" height="90" class="fg-b"/>
<line x1="516" y1="350" x2="646" y2="260" class="fg-l dim dash"/>
<polyline points="516.0,350.0 517.3,349.9 518.6,349.7 519.9,349.4 521.2,348.9 522.5,348.3 523.8,347.5 525.1,346.7 526.4,345.6 527.7,344.5 529.0,343.2 530.3,341.8 531.6,340.2 532.9,338.5 534.2,336.7 535.5,334.7 536.8,332.6 538.1,330.3 539.4,327.9 540.7,325.4 542.0,322.8 543.3,320.0 544.6,317.1 545.9,314.0 547.2,310.8 548.5,307.5 549.8,304.0 551.1,300.4 552.4,296.6 553.7,292.8 555.0,288.7 556.3,284.6 557.6,280.3 558.9,275.9 560.2,271.3 561.5,266.6 562.8,261.8 564.1,261.5 565.4,263.9 566.7,266.1 568.0,268.1 569.3,270.0 570.6,271.8 571.9,273.4 573.2,274.9 574.5,276.3 575.8,277.5 577.1,278.6 578.4,279.6 579.7,280.4 581.0,281.1 582.3,281.6 583.6,282.1 584.9,282.3 586.2,282.5 587.5,282.5 588.8,282.4 590.1,282.1 591.4,281.7 592.7,281.1 594.0,280.5 595.3,279.7 596.6,278.7 597.9,277.6 599.2,276.4 600.5,275.1 601.8,273.6 603.1,271.9 604.4,270.2 605.7,268.3 607.0,266.2 608.3,264.1 609.6,261.8 610.9,260.3 612.2,261.5 613.5,262.5 614.8,263.3 616.1,264.0 617.4,264.6 618.7,265.1 620.0,265.4 621.3,265.6 622.6,265.6 623.9,265.5 625.2,265.3 626.5,264.9 627.8,264.4 629.1,263.8 630.4,263.0 631.7,262.1 633.0,261.1 634.3,260.1 635.6,260.6 636.9,261.0 638.2,261.3 639.5,261.4 640.8,261.4 642.1,261.2 643.4,261.0 644.7,260.6 646.0,260.0" class="fg-l on"/>
<text x="581" y="372" text-anchor="middle" class="fg-t sm">四段拋物線</text>
<text x="24" y="64" text-anchor="end" class="fg-t sm">1</text><text x="24" y="154" text-anchor="end" class="fg-t sm">0</text>
<text x="24" y="264" text-anchor="end" class="fg-t sm">1</text><text x="24" y="354" text-anchor="end" class="fg-t sm">0</text>
</svg><figcaption>曲線越陡，那一段走得越快；越平，走得越慢。backOut 和 elasticOut 會超出方框上緣，代表位置衝過了終點；bounceOut 則是碰到終點又彈回來。</figcaption></figure>
<p>看這些曲線，有三個讀法：</p>
<ul>
<li><b>斜率就是速度。</b>quadOut 是 t(2 − t)，微分得到 2 − 2t：一開始的速度是 linear 的 2 倍，到終點時速度剛好是 0。所以它「快速進場、輕輕停下」，最適合東西出現。quadIn（t²）剛好相反：起步速度是 0，最後最快，適合離場。</li>
<li><b>Out 是 In 的鏡像。</b>每一組都有 <code>Out(t) = 1 − In(1 − t)</code> 的關係。quadOut = 1 − (1 − t)²，展開就是 t(2 − t)。cubic、quart、quint 是同一族，次方越高，起步或收尾越陡。InOut 則是前半段用 In、後半段用 Out，兩頭都慢。</li>
<li><b>超出 0 到 1 的那幾條。</b>backOut 帶一個常數 s = 1.70158，這個數字讓它最多衝過終點約 10%（最大值約 1.0998）。elasticOut 是一條按 2<sup>−10t</sup> 衰減的正弦波，像彈簧；bounceOut 是四段拋物線拼起來，像球落地彈三下。</li>
</ul>
<p>內建的名字不夠用時，<code>easing</code> 也可以直接給一個函式。例如時鐘的秒針要「一格一格跳」：</p>
<pre><code>// jump in 5 steps instead of moving smoothly
tween(hand).to(5, { angle: -150 }, {
    easing: (k: number) =&gt; Math.floor(k * 5) / 5,
}).start();</code></pre>
<p>跟網頁比較：CSS 的 <code>ease-out</code> 是一條三次貝茲曲線（<code>cubic-bezier(0, 0, 0.58, 1)</code>），Cocos 的 quadOut 是一條多項式，形狀相近但不完全相同。要讓網頁版和遊戲版的動畫手感一致，就兩邊用同一條算式。</p>

<h3><span class="badge lv2">進階</span>三、tween 系統每個影格在做什麼</h3>
<p>先看 tween 在一個影格裡排在哪個位置。這決定了「誰會蓋掉誰」：</p>
<figure class="figure"><svg viewBox="0 0 680 330" class="fg" style="width:100%;max-width:680px" role="img" aria-label="一個影格裡的順序：原生輸入、元件 update、排程器與動畫與 Spine、tween 系統、lateUpdate、AFTER_UPDATE 的 Layout 與 Widget、延後銷毀、繪製">
<rect x="20" y="14" width="270" height="30" rx="5" class="fg-b"/><text x="34" y="34" class="fg-t">1 影格開始：原生平台的輸入</text>
<text x="310" y="34" class="fg-t sm">網頁上的觸控在影格之間就送了</text>
<rect x="20" y="52" width="270" height="30" rx="5" class="fg-b alt"/><text x="34" y="72" class="fg-t">2 元件的 update(dt)</text>
<text x="310" y="72" class="fg-t sm">你寫的遊戲邏輯</text>
<rect x="20" y="90" width="270" height="30" rx="5" class="fg-b alt"/><text x="34" y="110" class="fg-t">3 排程器、Animation、Spine</text>
<text x="310" y="110" class="fg-t sm">系統，優先權高</text>
<rect x="20" y="128" width="270" height="30" rx="5" class="fg-b hot"/><text x="34" y="148" class="fg-t acc">4 tween 系統</text>
<text x="310" y="148" class="fg-t sm">優先權中：蓋過 update 和動畫片段寫的值</text>
<rect x="20" y="166" width="270" height="30" rx="5" class="fg-b alt"/><text x="34" y="186" class="fg-t">5 元件的 lateUpdate(dt)</text>
<text x="310" y="186" class="fg-t sm">在這裡寫的，會蓋過 tween</text>
<rect x="20" y="204" width="270" height="30" rx="5" class="fg-b warm"/><text x="34" y="224" class="fg-t">6 AFTER_UPDATE：Layout、Widget</text>
<text x="310" y="224" class="fg-t sm">Widget 設成 ALWAYS 時，會蓋過前面所有人</text>
<rect x="20" y="242" width="270" height="30" rx="5" class="fg-b"/><text x="34" y="262" class="fg-t">7 延後的銷毀</text>
<text x="310" y="262" class="fg-t sm">呼叫過 destroy() 的節點，這時才真的銷毀</text>
<rect x="20" y="280" width="270" height="30" rx="5" class="fg-b"/><text x="34" y="300" class="fg-t">8 繪製：合批、draw call</text>
<text x="310" y="300" class="fg-t sm">把這一刻的值畫出來</text>
<line x1="8" y1="20" x2="8" y2="298" class="fg-l dim"/><polygon points="8,306 3.5,298 12.5,298" class="fg-a"/>
<text x="660" y="322" text-anchor="end" class="fg-t sm acc">同一個屬性，越晚寫的越算數</text>
</svg><figcaption>tween 排在元件的 update 和動畫片段之後、lateUpdate 之前。同一個屬性被好幾個地方寫，畫出來的是最後寫的那個值。</figcaption></figure>
<h4>從 start() 到每一格</h4>
<ol>
<li><code>tween(target)</code> 只是建立一張「待辦清單」，<code>to</code>、<code>delay</code>、<code>call</code> 都只是往清單上加步驟，什麼都還沒發生。</li>
<li><code>start()</code> 把整張清單包成一個依序執行的動作，交給 tween 系統裡的動作管理器（ActionManager）。</li>
<li>之後每個影格，管理器走過所有目標。如果目標是引擎物件（節點、元件）而且已經失效，就把它身上的動作全部移除；否則推進每個動作。</li>
<li>每個步驟開始的那一刻，會先<b>讀取目標現在的值</b>當作起點（<code>by</code> 也是在這時才算出終點）。所以 <code>.delay(1).to(0.3, ...)</code> 的起點，是一秒之後那一刻的值，不是你寫下這行程式時的值。</li>
<li>推進時：第一次推進把經過時間設成 0（那一格的 dt 不算），之後每格加上 dt；<code>t = min(1, 經過時間 ÷ 長度)</code>；照上一節的算式算出新值，<b>透過屬性的 setter 寫回目標</b>（例如 <code>node.position = 新值</code>）。經過時間大於等於長度，這一步就結束，換下一步。</li>
</ol>
<p>第 5 步的 setter 是關鍵。對 <code>position</code> 這種 Vec3 屬性，tween 會一個一個算 x、y、z，最後整個指派回 <code>node.position</code>，觸發節點的 setter，節點才知道自己動了。這就是為什麼要寫 <code>tween(node).to(..., { position })</code>，而 <code>tween(node.position)</code> 不行：後者只改了一個 Vec3 物件的欄位，節點完全不知道。</p>
<h4>同一段 tween，在 60 FPS 和 30 FPS 下</h4>
<p>x 從 0 到 300，linear，0.3 秒：</p>
<table>
<tr><th>經過時間</th><th>60 FPS（每格約 0.0167 秒）</th><th>30 FPS（每格約 0.0333 秒）</th></tr>
<tr><td>0</td><td>第 0 格：x = 0</td><td>第 0 格：x = 0</td></tr>
<tr><td>0.1 秒</td><td>第 6 格：x = 100</td><td>第 3 格：x = 100</td></tr>
<tr><td>0.2 秒</td><td>第 12 格：x = 200</td><td>第 6 格：x = 200</td></tr>
<tr><td>0.3 秒</td><td>第 18 格：x = 300，結束</td><td>第 9 格：x = 300，結束</td></tr>
</table>
<p>同一個時間點，位置完全一樣，只是 30 FPS 少畫了一半的中間張。這就是「用時間算進度」帶來的影格率無關。代價是：如果某一格卡了 0.1 秒，t 一下子跳 0.33，牌就瞬間移動 100 像素。tween 保證的是<b>位置跟時間對得上</b>，不保證畫面平滑。另外，結束的條件是「經過時間 ≥ 長度」，所以結束會落在 0.3 秒之後的第一個影格，不一定剛好在 0.3 秒。</p>
<h4>誰蓋掉誰</h4>
<ul>
<li>你在 <code>update</code> 裡設位置，同一個屬性又有 tween：tween 比較晚寫，畫出來是 tween 的值，你的程式白做了。</li>
<li>同一個節點的同一個屬性有兩個 tween：兩個每格都在算，比較晚加入的那個比較晚寫，所以它贏，舊的那個還在浪費 CPU，結束時還會跑它的 <code>call</code>。所以開始新的動作前，先 <code>Tween.stopAllByTarget(node)</code>。</li>
<li>Widget 設成 ALWAYS，或節點在會重排的 Layout 底下：它們在 AFTER_UPDATE 才寫，tween 怎麼動都會被拉回去。</li>
</ul>

<h3><span class="badge lv2">進階</span>四、組合：把幾段動作排成一條時間軸</h3>
<p>發三張牌：每張晚 0.08 秒出發；每張一邊滑到定位、一邊轉正；到了之後彈一下再回穩；全部做完通知遊戲。</p>
<pre><code>dealCard(card: Node, i: number, slot: Vec3) {
    const s = (v: number) =&gt; new Vec3(v, v, 1);
    const slide = tween(card).to(0.35, { position: slot },
        { easing: 'cubicOut' });
    const turn = tween(card).to(0.35, { angle: 0 });
    tween(card)
        .delay(i * 0.08)                 // stagger
        .parallel(slide, turn)           // both at once
        .to(0.1, { scale: s(1.08) }, { easing: 'quadOut' })
        .to(0.1, { scale: s(1) }, { easing: 'quadIn' })
        .call(() =&gt; this.onLanded(i))
        .start();
}</code></pre>
<figure class="figure"><svg viewBox="0 22 680 196" class="fg" style="width:100%;max-width:680px" role="img" aria-label="三張牌的時間軸：每張依序延遲 0.08 秒，接著滑入與轉正同時進行 0.35 秒，再彈起 0.1 秒、落回 0.1 秒，最後呼叫回呼">
<text x="20" y="56" class="fg-t">第 1 張</text><text x="20" y="104" class="fg-t">第 2 張</text><text x="20" y="152" class="fg-t">第 3 張</text>
<rect x="90" y="38" width="245" height="28" rx="4" class="fg-b hot"/><text x="212" y="57" text-anchor="middle" class="fg-t sm">滑入 ‖ 轉正</text>
<rect x="335" y="38" width="70" height="28" rx="4" class="fg-b warm"/><text x="370" y="57" text-anchor="middle" class="fg-t sm">彈</text>
<rect x="405" y="38" width="70" height="28" rx="4" class="fg-b alt"/><text x="440" y="57" text-anchor="middle" class="fg-t sm">回穩</text>
<circle cx="475" cy="52" r="5" class="fg-lamp on"/>
<rect x="90" y="86" width="56" height="28" rx="4" class="fg-l dim dash"/><text x="118" y="105" text-anchor="middle" class="fg-t sm">延遲</text>
<rect x="146" y="86" width="245" height="28" rx="4" class="fg-b hot"/><text x="268" y="105" text-anchor="middle" class="fg-t sm">滑入 ‖ 轉正</text>
<rect x="391" y="86" width="70" height="28" rx="4" class="fg-b warm"/><text x="426" y="105" text-anchor="middle" class="fg-t sm">彈</text>
<rect x="461" y="86" width="70" height="28" rx="4" class="fg-b alt"/><text x="496" y="105" text-anchor="middle" class="fg-t sm">回穩</text>
<circle cx="531" cy="100" r="5" class="fg-lamp on"/>
<rect x="90" y="134" width="112" height="28" rx="4" class="fg-l dim dash"/><text x="146" y="153" text-anchor="middle" class="fg-t sm">延遲</text>
<rect x="202" y="134" width="245" height="28" rx="4" class="fg-b hot"/><text x="324" y="153" text-anchor="middle" class="fg-t sm">滑入 ‖ 轉正</text>
<rect x="447" y="134" width="70" height="28" rx="4" class="fg-b warm"/><text x="482" y="153" text-anchor="middle" class="fg-t sm">彈</text>
<rect x="517" y="134" width="70" height="28" rx="4" class="fg-b alt"/><text x="552" y="153" text-anchor="middle" class="fg-t sm">回穩</text>
<circle cx="587" cy="148" r="5" class="fg-lamp on"/>
<text x="600" y="152" class="fg-t sm acc">call</text>
<line x1="90" y1="184" x2="652" y2="184" class="fg-l dim"/><polygon points="660,184 652,179.5 652,188.5" class="fg-a"/>
<line x1="90" y1="180" x2="90" y2="188" class="fg-l"/><line x1="230" y1="180" x2="230" y2="188" class="fg-l"/><line x1="370" y1="180" x2="370" y2="188" class="fg-l"/><line x1="510" y1="180" x2="510" y2="188" class="fg-l"/><line x1="650" y1="180" x2="650" y2="188" class="fg-l"/>
<text x="90" y="206" text-anchor="middle" class="fg-t sm mono">0</text><text x="230" y="206" text-anchor="middle" class="fg-t sm mono">0.2</text><text x="370" y="206" text-anchor="middle" class="fg-t sm mono">0.4</text><text x="510" y="206" text-anchor="middle" class="fg-t sm mono">0.6</text><text x="650" y="206" text-anchor="middle" class="fg-t sm mono">0.8 秒</text>
</svg><figcaption>串起來的步驟依序執行，parallel 裡的兩段同時跑，長度取最長的那一段。三張牌只差在一開始的延遲，就形成「一張接一張」的節奏。</figcaption></figure>
<ul>
<li><b>依序</b>：串起來的步驟本身就是依序；<code>sequence(a, b)</code> 把幾段 tween 包成一段，常拿來當 <code>parallel</code> 的其中一份。<code>then(other)</code> 把另一段 tween 接在後面。</li>
<li><b>同時</b>：<code>parallel(a, b)</code> 的長度是裡面最長的那一段，全部做完才往下走。</li>
<li><b>重複</b>：<code>repeat(n)</code> 總共執行 n 次，而且只重複緊接在前面的那一步，所以要先 <code>union()</code>。</li>
<li><b>可重用的動作</b>：把常用的動作寫成「回傳 Tween 的函式」，例如 <code>popIn(node)</code>、<code>shake(node)</code>；同一段動作要套到另一個目標，用 <code>clone(newTarget)</code>。</li>
<li><b>成群地停</b>：<code>tag(n)</code> 給 tween 加一個數字標籤，<code>Tween.stopAllByTag(n)</code> 一次停掉同一類的所有動作，例如「這一局的所有發牌動畫」。</li>
</ul>
<div class="note">3.8 的不同小版本，tween 的功能不一樣。比對 3.8.3 和 3.8.8 的原始碼，<code>pause()</code>、<code>resume()</code>、<code>timeScale()</code>、<code>Tween.pauseAllByTarget()</code> 這些是 3.8.4 之後才加入的。用之前先確認你專案的引擎版本。</div>

<h3><span class="badge lv2">進階</span>五、對不是節點的東西做 tween</h3>
<p>tween 不在乎目標是什麼，它只做兩件事：讀 <code>target[屬性名]</code>，把算好的值寫回去。所以任何物件上的數字屬性都能補間：</p>
<table>
<tr><th>目標</th><th>寫法</th><th>效果</th></tr>
<tr><td>UIOpacity</td><td><code>tween(op).to(0.3, { opacity: 0 })</code></td><td>淡出</td></tr>
<tr><td>ProgressBar</td><td><code>tween(bar).to(0.5, { progress: 1 })</code></td><td>進度條填滿</td></tr>
<tr><td>Filled 類型的 Sprite</td><td><code>tween(sprite).to(10, { fillRange: 0 })</code></td><td>圓形倒數計時</td></tr>
<tr><td>正交攝影機</td><td><code>tween(cam).to(0.4, { orthoHeight: 300 })</code></td><td>鏡頭拉近</td></tr>
<tr><td>AudioSource</td><td><code>tween(music).to(1, { volume: 0 })</code></td><td>音樂淡出</td></tr>
</table>
<p>材質上的數值（shader 的 uniform）不是一般屬性，不能直接補間。做法是補間一個代理物件，在 <code>onUpdate</code> 裡寫進材質。這個材質要是這個 Sprite 自己的實例，所以它會脫離合批（上一章講過），只在需要的地方用：</p>
<pre><code>const mat = sprite.getMaterialInstance(0)!;
const p = { v: 0 };
tween(p).to(0.6, { v: 1 }, {
    onUpdate: () =&gt; mat.setProperty('dissolve', p.v),
}).start();</code></pre>
<p>內插方式也能換。角度從 350 度轉到 10 度，直接內插會倒轉 340 度。給 <code>progress</code> 一個「走最短路」的內插函式：</p>
<pre><code>const shortest = (s: number, e: number,
                  _c: number, t: number) =&gt; {
    const d = ((e - s + 540) % 360) - 180;  // -180 .. 180
    return s + d * t;
};
tween(node)
    .to(0.3, { angle: 10 }, { progress: shortest })
    .start();</code></pre>
<p>350 到 10：e − s = −340，加 540 是 200，除以 360 取餘數還是 200，減 180 得 20，所以只順轉 20 度。</p>

<h3><span class="badge lv3">專業</span>六、Animation 系統：時間軸、關鍵影格、事件</h3>
<p>tween 適合「執行時才知道終點」的動作。終點固定、要靠眼睛慢慢調的動作，就交給動畫編輯器做成動畫片段（animation clip）。片段裡是好幾條軌道（track），每條軌道對應一個屬性，上面放關鍵影格，關鍵影格之間怎麼補，由每一段的內插方式決定：</p>
<figure class="figure"><svg viewBox="0 0 680 250" class="fg" style="width:100%;max-width:680px" role="img" aria-label="動畫片段的時間軸：position.y 用線性內插，scale 用三次內插，spriteFrame 用常數內插一格一格換圖，0.5 秒處有一個呼叫 onLand 的事件，播放頭在 0.3 秒">
<text x="390" y="16" text-anchor="middle" class="fg-t sm alt">播放頭 0.3 秒</text>
<line x1="390" y1="24" x2="390" y2="212" class="fg-l alt dash"/>
<text x="20" y="46" class="fg-t mono">position.y</text><text x="20" y="62" class="fg-t sm">線性 linear</text>
<polyline points="150,62 310,38 550,62 630,62" class="fg-l"/>
<polygon points="150,56 156,62 150,68 144,62" class="fg-b hot"/><polygon points="310,32 316,38 310,44 304,38" class="fg-b hot"/><polygon points="550,56 556,62 550,68 544,62" class="fg-b hot"/>
<text x="20" y="96" class="fg-t mono">scale</text><text x="20" y="112" class="fg-t sm">三次 cubic</text>
<path d="M150 112 C210 112 330 88 390 88 C430 88 510 112 550 112 H630" class="fg-l"/>
<polygon points="150,106 156,112 150,118 144,112" class="fg-b hot"/><polygon points="390,82 396,88 390,94 384,88" class="fg-b hot"/><polygon points="550,106 556,112 550,118 544,112" class="fg-b hot"/>
<text x="20" y="146" class="fg-t mono">spriteFrame</text><text x="20" y="162" class="fg-t sm">常數 constant</text>
<rect x="150" y="138" width="200" height="24" rx="3" class="fg-b"/><text x="250" y="155" text-anchor="middle" class="fg-t sm">圖 1</text>
<rect x="350" y="138" width="160" height="24" rx="3" class="fg-b alt"/><text x="430" y="155" text-anchor="middle" class="fg-t sm">圖 2</text>
<rect x="510" y="138" width="120" height="24" rx="3" class="fg-b"/><text x="570" y="155" text-anchor="middle" class="fg-t sm">圖 3</text>
<text x="20" y="192" class="fg-t">事件</text><text x="20" y="208" class="fg-t sm">呼叫方法</text>
<circle cx="550" cy="196" r="6" class="fg-lamp on"/><text x="562" y="200" class="fg-t sm mono acc">onLand()</text>
<line x1="150" y1="222" x2="630" y2="222" class="fg-l dim"/>
<text x="150" y="240" text-anchor="middle" class="fg-t sm mono">0</text><text x="310" y="240" text-anchor="middle" class="fg-t sm mono">0.2</text><text x="470" y="240" text-anchor="middle" class="fg-t sm mono">0.4</text><text x="630" y="240" text-anchor="middle" class="fg-t sm mono">0.6 秒</text>
</svg><figcaption>菱形是關鍵影格。播放頭走到哪裡，引擎就在每條軌道上取樣：position.y 在兩個關鍵影格之間直線內插，scale 走平滑的曲線，spriteFrame 不內插、時間到了直接換圖；事件則是在那一刻呼叫節點上元件的方法。</figcaption></figure>
<ul>
<li><b>內插方式</b>：線性（linear）、三次（cubic，可以拉切線調出緩動）、常數（constant，不補間，用在換圖這類不能「一半」的值）。</li>
<li><b>取樣率</b>：片段的 sample 預設是每秒 60，編輯器裡的關鍵影格會對齊到這個格子上。執行時是用實際時間取樣，所以遊戲跑 30 FPS 時，片段的長度不變，只是取樣得比較稀。</li>
<li><b>播放控制</b>：<code>anim.play('win')</code>；<code>anim.crossFade('idle', 0.3)</code> 在 0.3 秒內從目前的片段淡到另一個；<code>anim.getState('win')</code> 拿到播放狀態，可以改 <code>speed</code>、<code>wrapMode</code>（Normal、Loop、PingPong、Reverse 等）。</li>
<li><b>事件</b>：片段上的事件，會在那個時間點呼叫節點上元件的同名方法，適合「落地那一刻播音效、震動」。播放完畢有 <code>FINISHED</code>；循環播放時，每次播到最後一格有 <code>LASTFRAME</code>。</li>
<li><b>跟 tween 搶同一個屬性</b>：Animation 屬於優先權高的系統，在 tween 之前更新，所以同一個屬性兩邊都在寫時，畫出來是 tween 的值。一個屬性只交給一方管。</li>
</ul>
<p>3D 角色有很多動作要互相切換時（待機、走、跑、攻擊），一個一個 <code>crossFade</code> 很快就亂掉。Cocos 3.x 有動畫圖（Animation Graph，也叫 Marionette 系統），用狀態機和參數來管理切換，概念跟 Unity 的 Animator 類似。</p>

<h3><span class="badge lv3">專業</span>七、骨骼動畫（Spine）：觀念與效能</h3>
<p>Spine 的資料分成幾層，先把名詞弄清楚：</p>
<figure class="figure"><svg viewBox="0 0 680 280" class="fg" style="width:100%;max-width:680px" role="img" aria-label="左邊是骨架：骨頭、插槽、附件；右邊是每個影格的四個步驟：時間軸算出本地變換、算世界變換、算附件頂點、送出 draw call">
<text x="100" y="20" text-anchor="middle" class="fg-t lg">骨架</text>
<line x1="100" y1="150" x2="100" y2="86" class="fg-l alt"/>
<line x1="100" y1="100" x2="62" y2="132" class="fg-l alt"/><line x1="100" y1="100" x2="138" y2="132" class="fg-l alt"/>
<line x1="100" y1="150" x2="78" y2="205" class="fg-l alt"/><line x1="100" y1="150" x2="122" y2="205" class="fg-l alt"/>
<circle cx="100" cy="70" r="16" class="fg-b"/>
<circle cx="100" cy="150" r="5" class="fg-lamp on"/><circle cx="100" cy="100" r="5" class="fg-lamp on"/>
<text x="90" y="154" text-anchor="end" class="fg-t sm">根骨頭</text>
<text x="20" y="236" class="fg-t sm">骨頭 bone：一棵樹</text>
<text x="20" y="254" class="fg-t sm">插槽 slot：畫的順序、顏色</text>
<text x="20" y="272" class="fg-t sm">附件：一張圖或一塊網格</text>
<text x="440" y="20" text-anchor="middle" class="fg-t lg">每個影格做的事</text>
<rect x="230" y="32" width="420" height="44" rx="6" class="fg-b alt"/><text x="244" y="59" class="fg-t">1 時間軸 → 每根骨頭的本地變換</text><text x="636" y="59" text-anchor="end" class="fg-t sm">跟動作、軌道數有關</text>
<line x1="440" y1="76" x2="440" y2="84" class="fg-l"/><polygon points="440,92 435.5,84 444.5,84" class="fg-a"/>
<rect x="230" y="92" width="420" height="44" rx="6" class="fg-b alt"/><text x="244" y="119" class="fg-t">2 算每根骨頭的世界變換</text><text x="636" y="119" text-anchor="end" class="fg-t sm">跟骨頭數成正比</text>
<line x1="440" y1="136" x2="440" y2="144" class="fg-l"/><polygon points="440,152 435.5,144 444.5,144" class="fg-a"/>
<rect x="230" y="152" width="420" height="44" rx="6" class="fg-b warm"/><text x="244" y="179" class="fg-t">3 算附件的頂點</text><text x="636" y="179" text-anchor="end" class="fg-t sm">網格頂點 × 權重；裁切最貴</text>
<line x1="440" y1="196" x2="440" y2="204" class="fg-l"/><polygon points="440,212 435.5,204 444.5,204" class="fg-a"/>
<rect x="230" y="212" width="420" height="44" rx="6" class="fg-b hot"/><text x="244" y="239" class="fg-t">4 送出 draw call</text><text x="636" y="239" text-anchor="end" class="fg-t sm">每個 Skeleton 預設至少一次</text>
</svg><figcaption>美術只存一份圖片和一副骨架，執行時每個影格重算骨頭和頂點。前三步花 CPU，第四步花 draw call；效能問題幾乎都出在第三步和第四步。</figcaption></figure>
<ul>
<li><b>骨頭（bone）</b>：一棵變換的樹，跟 Cocos 的節點很像，但它活在 Spine 的資料裡，不是場景裡的節點。</li>
<li><b>插槽（slot）</b>：決定畫的先後順序和顏色，同一時間掛著一個附件。</li>
<li><b>附件（attachment）</b>：真正被畫出來的東西。一般的圖片是 4 個頂點；網格（mesh）可以有幾十到上百個頂點，還能讓每個頂點同時受好幾根骨頭影響（權重）。</li>
<li><b>皮膚、動作、軌道</b>：皮膚是一整組附件，換皮膚就換裝；動作是骨頭和插槽的時間軸；軌道（track）讓動作疊加，例如軌道 0 跑步、軌道 1 眨眼。</li>
</ul>
<pre><code>const sk = this.getComponent(sp.Skeleton)!;
sk.setMix('idle', 'win', 0.2);        // blend over 0.2 s
sk.setAnimation(0, 'win', false);     // track 0, once
sk.addAnimation(0, 'idle', true, 0);  // then loop idle
sk.setAnimation(1, 'blink', true);    // track 1, on top
sk.setCompleteListener(() =&gt; { /* one ended */ });</code></pre>
<h4>效能花在哪裡，怎麼省</h4>
<ul>
<li><b>CPU 跟著骨頭數和網格頂點數成長。</b>帶權重的網格要對每個頂點做好幾次矩陣運算；裁切（clipping）附件每格都要切三角形，是最貴的功能，能不用就不用。這些要在美術做之前就談好預算。</li>
<li><b>看不見的角色也在算。</b>角色在畫面外、被面板蓋住時，設 <code>skeleton.paused = true</code> 或直接停用節點。</li>
<li><b>draw call</b>：每個 <code>sp.Skeleton</code> 預設自己至少一批；同一個角色用到不同的貼圖或混合模式（例如加亮的特效），還會再切。打開 <code>enableBatch</code>，連續、同貼圖同材質的骨架可以合成一批，代價是 CPU 每格要把所有頂點換成世界座標。一大群小角色適合開，少數幾個大角色不必。</li>
<li><b>快取模式</b>：預設 REALTIME，每格即時計算，所有功能都能用。SHARED_CACHE 把動作每一格的結果預先算好，讓用同一份骨架資料的角色共用，大幅省 CPU，但不支援動作之間的融合（mix）和疊加；PRIVATE_CACHE 是每個角色自己一份快取。同一種小怪大量出現時，SHARED_CACHE 最划算。</li>
<li><b>兩個匯入時的坑</b>：預乘透明度（premultipliedAlpha）要跟美術匯出時的設定一致，不然邊緣會出現黑邊或白邊；Spine 的版本要跟引擎的執行環境對上，3.8 系列內建的是 Spine 3.8，較新的 3.8.x（例如 3.8.8）才在專案設定裡多了 4.2 的選項。版本不合，骨架就載入失敗。</li>
</ul>

<h3><span class="badge lv4">專家</span>八、影格率無關：不只是乘上 dt</h3>
<p>tween 已經幫你用時間算進度。自己在 <code>update</code> 裡寫的動作，最常見的陷阱不是忘了乘 dt，而是這種「平滑跟隨」：</p>
<pre><code>// every frame, close 10% of the gap
this.x += (this.targetX - this.x) * 0.1;</code></pre>
<p>每一格靠近 10%，一秒之後剩下的距離是 0.9 的「影格數」次方。影格率不同，結果差非常多：</p>
<figure class="figure"><svg viewBox="0 0 680 270" class="fg" style="width:100%;max-width:680px" role="img" aria-label="每格靠近 10% 時剩下的距離：30 FPS 一秒後剩 4.2%，60 FPS 剩 0.18%，120 FPS 剩 0.0003%；用 dt 改寫的版本在任何影格率都跟 60 FPS 那條一樣">
<line x1="80" y1="220" x2="630" y2="220" class="fg-l dim"/><line x1="80" y1="220" x2="80" y2="34" class="fg-l dim"/>
<text x="72" y="44" text-anchor="end" class="fg-t sm">100%</text><text x="72" y="224" text-anchor="end" class="fg-t sm">0</text>
<text x="80" y="240" text-anchor="middle" class="fg-t sm mono">0</text><text x="215" y="240" text-anchor="middle" class="fg-t sm mono">0.25</text><text x="350" y="240" text-anchor="middle" class="fg-t sm mono">0.5</text><text x="620" y="240" text-anchor="middle" class="fg-t sm mono">1 秒</text>
<text x="350" y="262" text-anchor="middle" class="fg-t sm">縱軸：還剩下多少距離</text>
<polyline points="80.0,40.0 98.0,58.0 116.0,74.2 134.0,88.8 152.0,101.9 170.0,113.7 188.0,124.3 206.0,133.9 224.0,142.5 242.0,150.3 260.0,157.2 278.0,163.5 296.0,169.2 314.0,174.2 332.0,178.8 350.0,182.9 368.0,186.6 386.0,190.0 404.0,193.0 422.0,195.7 440.0,198.1 458.0,200.3 476.0,202.3 494.0,204.0 512.0,205.6 530.0,207.1 548.0,208.4 566.0,209.5 584.0,210.6 602.0,211.5 620.0,212.4" class="fg-l warm"/>
<polyline points="80.0,40.0 89.0,58.0 98.0,74.2 107.0,88.8 116.0,101.9 125.0,113.7 134.0,124.3 143.0,133.9 152.0,142.5 161.0,150.3 170.0,157.2 179.0,163.5 188.0,169.2 197.0,174.2 206.0,178.8 215.0,182.9 224.0,186.6 233.0,190.0 242.0,193.0 251.0,195.7 260.0,198.1 269.0,200.3 278.0,202.3 287.0,204.0 296.0,205.6 305.0,207.1 314.0,208.4 323.0,209.5 332.0,210.6 341.0,211.5 350.0,212.4 359.0,213.1 368.0,213.8 377.0,214.4 386.0,215.0 395.0,215.5 404.0,215.9 413.0,216.4 422.0,216.7 431.0,217.0 440.0,217.3 449.0,217.6 458.0,217.8 467.0,218.1 476.0,218.3 485.0,218.4 494.0,218.6 503.0,218.7 512.0,218.9 521.0,219.0 530.0,219.1 539.0,219.2 548.0,219.2 557.0,219.3 566.0,219.4 575.0,219.5 584.0,219.5 593.0,219.6 602.0,219.6 611.0,219.6 620.0,219.7" class="fg-l on"/>
<polyline points="80.0,40.0 84.5,58.0 89.0,74.2 93.5,88.8 98.0,101.9 102.5,113.7 107.0,124.3 111.5,133.9 116.0,142.5 120.5,150.3 125.0,157.2 129.5,163.5 134.0,169.2 138.5,174.2 143.0,178.8 147.5,182.9 152.0,186.6 156.5,190.0 161.0,193.0 165.5,195.7 170.0,198.1 174.5,200.3 179.0,202.3 183.5,204.0 188.0,205.6 192.5,207.1 197.0,208.4 201.5,209.5 206.0,210.6 210.5,211.5 215.0,212.4 219.5,213.1 224.0,213.8 228.5,214.4 233.0,215.0 237.5,215.5 242.0,215.9 246.5,216.4 251.0,216.7 255.5,217.0 260.0,217.3 264.5,217.6 269.0,217.8 273.5,218.1 278.0,218.3 282.5,218.4 287.0,218.6 291.5,218.7 296.0,218.9 300.5,219.0 305.0,219.1 309.5,219.2 314.0,219.2 318.5,219.3 323.0,219.4 327.5,219.5 332.0,219.5 336.5,219.6 341.0,219.6 345.5,219.6 350.0,219.7 354.5,219.7 359.0,219.7 363.5,219.8 368.0,219.8 372.5,219.8 377.0,219.8 381.5,219.8 386.0,219.9 390.5,219.9 395.0,219.9 399.5,219.9 404.0,219.9 408.5,219.9 413.0,219.9 417.5,219.9 422.0,219.9 426.5,219.9 431.0,220.0 435.5,220.0 440.0,220.0 444.5,220.0 449.0,220.0 453.5,220.0 458.0,220.0 462.5,220.0 467.0,220.0 471.5,220.0 476.0,220.0 480.5,220.0 485.0,220.0 489.5,220.0 494.0,220.0 498.5,220.0 503.0,220.0 507.5,220.0 512.0,220.0 516.5,220.0 521.0,220.0 525.5,220.0 530.0,220.0 534.5,220.0 539.0,220.0 543.5,220.0 548.0,220.0 552.5,220.0 557.0,220.0 561.5,220.0 566.0,220.0 570.5,220.0 575.0,220.0 579.5,220.0 584.0,220.0 588.5,220.0 593.0,220.0 597.5,220.0 602.0,220.0 606.5,220.0 611.0,220.0 615.5,220.0 620.0,220.0" class="fg-l alt"/>
<line x1="400" y1="62" x2="430" y2="62" class="fg-l warm"/><text x="440" y="66" class="fg-t sm">30 FPS：1 秒後剩 4.2%</text>
<line x1="400" y1="86" x2="430" y2="86" class="fg-l on"/><text x="440" y="90" class="fg-t sm">60 FPS：剩 0.18%</text>
<line x1="400" y1="110" x2="430" y2="110" class="fg-l alt"/><text x="440" y="114" class="fg-t sm">120 FPS：剩 0.0003%</text>
<text x="400" y="142" class="fg-t sm acc">用 dt 改寫後：任何影格率</text>
<text x="400" y="160" class="fg-t sm acc">都跟綠色那條一樣</text>
</svg><figcaption>同一行「每格靠近 10%」，在 30 FPS 的手機上慢吞吞，在 120 FPS 的手機上幾乎瞬間到位。問題不在乘法，在於它是「每格」而不是「每秒」。</figcaption></figure>
<p>正確的寫法是把「每格的比例」換成「每秒的衰減速率」k：</p>
<pre><code>// -ln(0.9) * 60: feels like "10% a frame" at 60 FPS
const K = 6.32;
update(dt: number) {
    const f = 1 - Math.exp(-K * dt);
    this.x += (this.targetX - this.x) * f;
}</code></pre>
<p>推導很短：每格剩下 e<sup>−k·dt</sup>，一秒內不管切成幾格，乘起來都是 e<sup>−k</sup>。k = −ln(0.9) × 60 ≈ 6.32 時，e<sup>−6.32</sup> ≈ 0.0018，正好就是 60 FPS 那條線，但現在在 30、120 FPS 下也一樣。</p>
<p>其他幾個跟影格率有關的事實：</p>
<ul>
<li><b>用影格數計時是錯的。</b><code>if (++this.frames &gt; 60)</code> 在 120 FPS 下半秒就到。一律累加 dt，用秒計時。</li>
<li><b>要可重現的模擬，用固定步長。</b>物理、碰撞、需要跟伺服器對得上的邏輯，用累加器每次推進固定的 1/60 秒（必要時一格推進好幾次），畫面再依剩下的時間內插。這是 Glenn Fiedler〈Fix Your Timestep!〉一文的做法。</li>
<li><b>引擎替你擋了兩件事。</b>網頁上，引擎會依 <code>game.frameRate</code>（預設 60）跳過多出來的 requestAnimationFrame，所以 120 Hz 的螢幕上預設還是跑 60 FPS；某一格的 dt 超過 1 秒時（例如在除錯器裡停住），引擎會把它換成一格的標準時間。但瀏覽器分頁切到背景時，requestAnimationFrame 會停，遊戲整個暫停，回來時要自己處理計時器和倒數。</li>
</ul>

<h3><span class="badge lv4">專家</span>九、手感（juice）：預備、過衝、回穩</h3>
<p>同樣是「按下按鈕、開始翻牌」，有的遊戲摸起來很爽，有的很木。差別常常就在一兩百毫秒裡的幾段小動作。迪士尼動畫師整理的動畫原則（anticipation 預備動作、squash and stretch 擠壓與伸展、follow through 跟隨動作、slow in and slow out 漸快漸慢），放到遊戲 UI 上幾乎可以一條一條照用。以按鈕為例：</p>
<figure class="figure"><svg viewBox="0 0 680 270" class="fg" style="width:100%;max-width:680px" role="img" aria-label="按鈕按下後縮放隨時間的曲線：前 60 毫秒縮到 0.92 是預備，接下來 100 毫秒衝到 1.06 是過衝，最後 120 毫秒回到 1.0 是回穩">
<line x1="70" y1="120" x2="620" y2="120" class="fg-l dim dash"/>
<text x="62" y="124" text-anchor="end" class="fg-t sm mono">1.0</text>
<text x="62" y="76" text-anchor="end" class="fg-t sm mono">1.06</text>
<text x="62" y="188" text-anchor="end" class="fg-t sm mono">0.92</text>
<line x1="70" y1="216" x2="622" y2="216" class="fg-l dim"/><polygon points="630,216 622,211.5 622,220.5" class="fg-a"/>
<line x1="178" y1="40" x2="178" y2="216" class="fg-l dim"/><line x1="358" y1="40" x2="358" y2="216" class="fg-l dim"/><line x1="574" y1="40" x2="574" y2="216" class="fg-l dim"/>
<polyline points="70.0,120.0 79.0,130.2 88.0,139.6 97.0,148.0 106.0,155.6 115.0,162.2 124.0,168.0 133.0,172.9 142.0,176.9 151.0,180.0 160.0,182.2 169.0,183.6 178.0,184.0 187.0,173.1 196.0,162.7 205.0,152.9 214.0,143.7 223.0,135.0 232.0,126.9 241.0,119.3 250.0,112.3 259.0,105.9 268.0,100.0 277.0,94.7 286.0,89.9 295.0,85.7 304.0,82.1 313.0,79.0 322.0,76.5 331.0,74.5 340.0,73.1 349.0,72.3 358.0,72.0 367.0,72.2 376.0,72.8 385.0,73.8 394.0,75.2 403.0,77.0 412.0,79.0 421.0,81.4 430.0,84.0 439.0,86.8 448.0,89.8 457.0,92.9 466.0,96.0 475.0,99.1 484.0,102.2 493.0,105.2 502.0,108.0 511.0,110.6 520.0,113.0 529.0,115.0 538.0,116.8 547.0,118.2 556.0,119.2 565.0,119.8 574.0,120.0 583.0,120.0 592.0,120.0 601.0,120.0 610.0,120.0" class="fg-l on"/>
<circle cx="178" cy="184" r="4" class="fg-lamp on"/><circle cx="358" cy="72" r="4" class="fg-lamp on"/>
<text x="124" y="40" text-anchor="middle" class="fg-t sm">按下</text>
<text x="124" y="236" text-anchor="middle" class="fg-t warm">預備</text><text x="124" y="254" text-anchor="middle" class="fg-t sm">60 ms 縮到 0.92</text>
<text x="268" y="236" text-anchor="middle" class="fg-t acc">過衝</text><text x="268" y="254" text-anchor="middle" class="fg-t sm">100 ms 衝到 1.06</text>
<text x="466" y="236" text-anchor="middle" class="fg-t alt">回穩</text><text x="466" y="254" text-anchor="middle" class="fg-t sm">120 ms 回到 1.0</text>
<text x="620" y="236" text-anchor="end" class="fg-t sm">時間</text>
</svg><figcaption>整段不到 0.3 秒。先往反方向縮一點（預備），再衝過頭（過衝），最後輕輕落定（回穩）。玩家說不出差在哪，但會覺得「按下去有反應」。</figcaption></figure>
<pre><code>pressFeel(node: Node) {
    Tween.stopAllByTarget(node);
    const s = (v: number) =&gt; new Vec3(v, v, 1);
    tween(node)
        .to(0.06, { scale: s(0.92) }, { easing: 'quadOut' })
        .to(0.10, { scale: s(1.06) }, { easing: 'quadOut' })
        .to(0.12, { scale: s(1) }, { easing: 'sineInOut' })
        .start();
}</code></pre>
<ul>
<li><b>要能被打斷。</b>注意開頭沒有用 <code>set</code> 把縮放重設成 1。每一步的起點都是「當下的值」，所以玩家連點時，新的動作從目前的大小接著做，不會「啪」一下跳回原狀。可以被打斷、而且接得順，是好手感的基本條件。</li>
<li><b>別跟 Button 搶。</b>Button 的 Transition 設成 Scale 時，它自己會在 update 裡改縮放。自己用 tween 做按壓手感，就把 Transition 改成 None 或 Color。</li>
<li><b>擠壓與伸展</b>：牌落到桌上的那一刻，縮放變成 (1.1, 0.9) 再回到 (1, 1)。寬乘高大約維持 1，看起來就像有重量的東西被壓扁，而不是變大變小。</li>
<li><b>跟隨與錯開</b>：結算面板彈出時，標題、分數、按鈕各晚 0.05 秒進場，比全部同時出現生動得多。上一節的發牌就是同一招。</li>
<li><b>節制</b>：常見的 UI 動作長度大約在 0.1 到 0.4 秒之間（這是常見做法，不是標準）。玩家每一局都要看幾十次的動畫，再好看也要短；震動畫面要隨時間衰減，並且提供關閉的選項，有些玩家會暈。</li>
</ul>

<h3><span class="badge lv4">專家</span>十、清理 tween：引擎替你做了什麼、沒做什麼</h3>
<p>翻 3.8 的原始碼可以看到，動作管理器每個影格都會檢查：目標如果是引擎物件（節點、元件）而且已經失效，就把它身上的動作全部移除。所以「目標就是那個被銷毀的節點」的 tween，引擎會收掉。真正出事的，是下面這幾種它管不到的情況：</p>
<ol>
<li><b>目標是普通物件。</b>計數器 <code>{ value: 0 }</code> 永遠不會「失效」，tween 會跑到結束；如果是 <code>repeatForever</code>，就永遠跑下去，連同它抓著的元件一起留在記憶體裡。</li>
<li><b>回呼碰到別的東西。</b><code>call</code> 和 <code>onUpdate</code> 裡用到的 Label、別的節點，可能早就被銷毀了。tween 的目標還活著，引擎不會攔。</li>
<li><b>節點沒被銷毀，只是被拿走了。</b><code>removeFromParent()</code> 或放回 <code>NodePool</code> 的節點仍然有效，tween 照跑。下次從池子拿出來，舊的 tween 還在改它，你會看到「牌自己縮小了」這種靈異現象。放回池子之前，一定先 <code>Tween.stopAllByTarget</code>。</li>
<li><b>節點只是被停用。</b>停用的節點上，tween 會不會暫停，在 3.8 的不同小版本行為不同（3.8.7 起才有 <code>bindNodeState</code> 可以明確指定）。不要依賴它，自己在 <code>onDisable</code> 停。</li>
<li><b>同一個影格的時間差。</b><code>destroy()</code> 只是做記號，真正的銷毀發生在這個影格的後段（第三節那張圖的第 7 步），比 tween 系統更新晚。所以在 <code>update</code> 裡銷毀的節點，它的 tween 在同一格還會再跑一次。</li>
</ol>
<h4>把 tween 包成 Promise 的陷阱</h4>
<p>在 Vue 寫慣了 async，很自然會這樣寫：</p>
<pre><code>play(t: Tween&lt;Node&gt;): Promise&lt;void&gt; {
    return new Promise(res =&gt; {
        t.call(() =&gt; res()).start();
    });
}

async reveal() {
    this.lock.lock();
    const flip = tween(this.card).to(0.3, { angle: 180 });
    await this.play(flip);
    this.lock.unlock();
}</code></pre>
<p>問題是：如果這個 tween 被 <code>stopAllByTarget</code> 停掉了，<code>call</code> 永遠不會執行，Promise 永遠不會完成。<code>reveal()</code> 就永遠卡在 <code>await</code>，後面的 <code>unlock()</code> 永遠不會跑，畫面從此點不動，〈輸入與事件〉那一章的「畫面點不動」就常常是這樣來的。解法是讓「被中斷」也能走到終點：</p>
<pre><code>private pending = new Set&lt;() =&gt; void&gt;();

play(t: Tween&lt;Node&gt;): Promise&lt;void&gt; {
    return new Promise(res =&gt; {
        this.pending.add(res);
        t.call(() =&gt; { this.pending.delete(res); res(); }).start();
    });
}

// use this instead of calling stopAllByTarget directly
stopAll() {
    Tween.stopAllByTarget(this.card);
    this.pending.forEach(res =&gt; res());
    this.pending.clear();
}

onDestroy() { this.stopAll(); }</code></pre>
<p>被中斷時，等待中的程式也會繼續往下走，所以 <code>await</code> 之後要先檢查 <code>if (!this.isValid) return;</code>，再碰節點。</p>
<h4>一張清單</h4>
<ul>
<li>每個元件在 <code>onDestroy</code>（會被放回池子的，再加上 <code>onDisable</code>）停掉自己開的 tween，包括對普通物件開的。</li>
<li>同一類的動作加同一個 <code>tag</code>，換局、換場景時一次停掉。</li>
<li>普通物件上不要用 <code>repeatForever</code>；要無限循環，目標就用節點或元件。</li>
<li>開始新的動作前，先停掉同一個目標上的舊動作，避免兩個 tween 搶同一個屬性。</li>
</ul>

<h3>十一、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>tween 是用影格數在算</td><td>用經過的時間算。60 FPS 和 30 FPS 在同一個時間點的位置相同，只是取樣的密度不同。</td></tr>
<tr><td><code>tween(node.position)</code> 可以移動節點</td><td>那只改了一個 Vec3 的欄位，節點不知道。要 <code>tween(node).to(t, { position })</code>，讓值透過 setter 寫回去。</td></tr>
<tr><td>兩個 tween 改同一個屬性，效果會疊加</td><td>兩個都在算，晚寫的蓋掉早寫的。開始新動作前先停掉舊的。</td></tr>
<tr><td>節點一銷毀，它的 tween 一定會出錯</td><td>目標是節點本身的 tween，引擎會在節點失效後移除。會出錯的是普通物件上的 tween，和回呼裡碰到的其他物件。</td></tr>
<tr><td>乘上 dt 就影格率無關了</td><td>「每格靠近 10%」乘不乘 dt 都錯，要換成指數衰減；需要可重現的邏輯，還要用固定步長。</td></tr>
<tr><td>Spine 角色只花 draw call</td><td>每個影格都要算骨頭和頂點，CPU 成本跟骨頭數、網格頂點數成長，看不見的角色也在算。</td></tr>
</table>

<h3>十二、跟你的工作連起來</h3>
<ul>
<li><b>Vue 前端</b>：CSS transition 的 timing function、GSAP 這類動畫函式庫，用的是同一套緩動數學。網頁上只動 <code>transform</code> 和 <code>opacity</code> 最順，道理跟遊戲裡「只有在動的東西才重算」一樣。記得尊重使用者的 <code>prefers-reduced-motion</code> 設定。</li>
<li><b>Cocos 遊戲</b>：把 <code>pressFeel</code>、<code>popIn</code>、<code>shake</code> 這類動作做成整個專案共用的函式，參數、時間、緩動統一，整個遊戲的手感才會一致；清理規則也寫進團隊的程式規範。</li>
<li><b>Unity</b>：Unity 常用的 DOTween 跟 Cocos 的 tween 是同一個思路；<code>Time.deltaTime</code> 就是 dt，<code>FixedUpdate</code> 就是固定步長；Animator 對應這章的動畫圖。</li>
<li><b>後端（Node.js、Go）</b>：多人遊戲的伺服器通常用固定的頻率推進世界（例如每秒 20 次），用戶端在兩次伺服器狀態之間做內插，用的正是第一節那條 <code>start + (end − start) × t</code>。懂了補間，就懂了一半的網路同步。</li>
</ul>

<h3>十三、面試會怎麼問</h3>
<p>下面是遊戲客戶端、互動前端面試裡會出現的題目。先自己講一遍，再打開參考答案。</p>
<ol>
<li>「quadOut 的公式是什麼？為什麼東西進場常用 Out、離場常用 In？」</li>
<li>「tween 怎麼做到在不同影格率下速度一樣？<code>x += (target − x) * 0.1</code> 有什麼問題，怎麼改？」</li>
<li>「什麼時候用 tween、什麼時候用動畫片段、什麼時候用 Spine？」</li>
<li>「換場景後偶爾報 Cannot read properties of null，你懷疑跟 tween 有關。怎麼查、怎麼根治？」</li>
<li>「一個畫面有 50 個 Spine 角色，低階手機會掉影格。你會怎麼最佳化？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>quadOut(t) = t(2 − t) = 1 − (1 − t)²，速度是 2 − 2t：一開始最快、到終點時為 0。進場的東西要盡快出現在玩家眼前、再輕輕停住，所以用 Out；離場的東西要先有個起步、最後加速離開，所以用 In。兩者是鏡像關係：Out(t) = 1 − In(1 − t)。</li>
<li>tween 每格把 dt 累加成經過時間，用「經過時間 ÷ 長度」算進度，所以位置只跟時間有關，影格率只影響取樣的密度；卡頓時會跳一大步，但不會變慢。<code>x += (target − x) * 0.1</code> 是「每格」靠近 10%，一秒後剩下 0.9 的影格數次方，30 FPS 剩 4.2%、60 FPS 剩 0.18%，差了二十多倍。改成 <code>x += (target − x) * (1 − e^(−k·dt))</code>，k 取 −ln(0.9) × 60 ≈ 6.32，就跟 60 FPS 的手感一樣且與影格率無關。</li>
<li>tween：終點在執行時才知道、或要由程式組合的動作，例如發牌到某個空位、數字跳動。動畫片段：終點固定、需要美術用眼睛調整時間和曲線、或要在時間軸上觸發事件的動作，例如勝利標誌的進場。Spine：角色或複雜生物的動作，需要骨骼變形、換裝、動作融合。三者可以並用，但同一個屬性只交給一方。</li>
<li>先在錯誤堆疊裡找是不是從 tween 的 call 或 onUpdate 進來的。常見原因是普通物件上的 tween 在換場景後繼續跑，或回呼裡碰到已經銷毀的節點，或節點被放回池子卻沒停 tween。根治：每個元件在 onDestroy 停掉自己開的所有 tween（包含普通物件的）、用 tag 成群管理、放回池子前先停、await 之後檢查 isValid，並把 tween 包成 Promise 時處理被中斷的情況。</li>
<li>先量是 CPU 還是 draw call。CPU：減少骨頭和網格頂點、拿掉裁切、看不見的角色暫停或停用、同種角色大量出現時改用 SHARED_CACHE（接受不能融合動作）、遠處的角色降低更新頻率。draw call：讓同種角色共用貼圖並開啟 enableBatch（用 CPU 換 draw call）、減少不同的混合模式、把角色排在一起避免被其他 UI 打斷。改完在最低階的目標機器上重新量。</li>
</ol>
</details>

<h3>十四、練功題（做得出來才算真的懂）</h3>
<ol>
<li>一張牌的 x 從 −300 移到 0，花 0.3 秒。請算出 0.1 秒和 0.2 秒時，quadOut 和 backOut 各在哪裡。</li>
<li><code>tween(n).to(0.2, A).to(0.2, B).union().repeat(2).call(f).start()</code> 總共花多久？<code>f</code> 會被呼叫幾次、在什麼時候？</li>
<li>同事寫了「每格靠近 20%」的鏡頭跟隨，在 60 FPS 下手感剛好。請寫出跟影格率無關的版本，算出 k，並算出 0.5 秒後還剩多少距離。</li>
<li>從 NodePool 拿出來的牌，有時候會自己慢慢縮小。可能的原因是什麼？怎麼修？</li>
<li>設計一個「結算面板彈出」的動畫：面板、標題、分數、兩顆按鈕。寫出每一段的時間、緩動，以及怎麼讓玩家連點「再來一局」時不會出錯。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>0.1 秒是 t = 1/3：quadOut = 5/9 ≈ 0.556，x ≈ −133.3；backOut ≈ 0.956，x ≈ −13.3。0.2 秒是 t = 2/3：quadOut = 8/9 ≈ 0.889，x ≈ −33.3；backOut ≈ 1.089，x ≈ +26.7，已經衝過終點。</li>
<li>union 把「到 A、到 B」合成一段 0.4 秒的動作，repeat(2) 總共執行 2 次，共 0.8 秒。<code>f</code> 只被呼叫一次，在 0.8 秒之後的第一個影格。</li>
<li><code>x += (target − x) * (1 − Math.exp(−k * dt))</code>，k = −ln(0.8) × 60 ≈ 13.39。0.5 秒後剩 e<sup>−13.39 × 0.5</sup> = 0.8<sup>30</sup> ≈ 0.0012，也就是約 0.12%，任何影格率都一樣。</li>
<li>牌放回池子之前，身上還有 tween 在跑（例如一個縮小消失的動作），放回去並不會停掉它，因為節點沒有被銷毀、仍然有效。拿出來重用時，舊的 tween 還在改縮放。修法：放回池子前 <code>Tween.stopAllByTarget(card)</code>（子節點有動作的也要停），拿出來時把縮放、角度、透明度全部重設。</li>
<li>參考做法：開始前先上輸入鎖。遮罩 0.15 秒淡入（quadOut）；面板從 0.8 倍 0.25 秒放大到 1（backOut）；標題在 0.1 秒時、分數在 0.15 秒時、按鈕在 0.2 秒時各自進場（錯開 0.05 秒，quadOut）；分數用計數器 0.5 秒跳到最終值。整段約 0.6 秒，最後一個 call 解鎖。「再來一局」的處理函式先檢查遊戲狀態，按下立刻把按鈕設成不可互動，並停掉面板上所有 tween 再關閉；所有 tween 加同一個 tag，關閉或換場景時一次停掉，並確保解鎖一定會執行。</li>
</ol>
</details>

<h3>十五、想再挖深</h3>
<ul>
<li><b>Cocos Creator 3.8 使用手冊</b>（<a href="https://docs.cocos.com/creator/3.8/manual/en/">docs.cocos.com/creator/3.8/manual</a>）：緩動系統（tween）、動畫系統、動畫圖（Marionette）、Spine 骨骼動畫的官方說明。引擎原始碼在 <a href="https://github.com/cocos/cocos-engine">github.com/cocos/cocos-engine</a>，tween 的核心在 <code>cocos/tween/</code>。</li>
<li><b>Robert Penner 的緩動函式</b>（<a href="http://robertpenner.com/easing/">robertpenner.com/easing</a>）與 <b>easings.net</b>：幾乎所有引擎的 quad、cubic、back、elastic、bounce 都源自 Penner 的那組公式；easings.net 把每一條都畫成曲線，可以邊看邊比。</li>
<li><b>Glenn Fiedler〈Fix Your Timestep!〉</b>（<a href="https://gafferongames.com/post/fix_your_timestep/">gafferongames.com</a>）：固定步長、累加器、內插的經典文章，第八節的延伸。</li>
<li><b>Frank Thomas 與 Ollie Johnston《The Illusion of Life: Disney Animation》</b>：迪士尼動畫十二原則的出處。做手感、做動態設計的人幾乎都讀過。</li>
<li><b>Spine 使用者指南</b>（<a href="https://esotericsoftware.com/spine-user-guide">esotericsoftware.com</a>）：骨頭、插槽、網格、權重、裁切的官方說明，也有關於執行效能的建議，可以拿去跟美術討論預算。</li>
</ul>
` });
