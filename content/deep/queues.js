DEEP({ 'queues': `
<p>上一課說：佇列幾乎都是「至少一次」，所以處理要冪等；毒訊息要進死信佇列；Kafka 和 SQS 是兩個家族；更新資料庫加發布訊息要用寄件匣。這一章把每一句都拆開：「至少一次」到底是 ack 放在哪裡造成的？SQS 的可見性逾時怎麼讓同一件工作做兩次？去重表要怎麼寫才真的擋得住？順序怎麼保證、代價是什麼？佇列越積越長時，怎麼用算式判斷要多久才消化得完？Kafka 的分區、offset、消費者群組到底在記什麼？最後是寄件匣和變更資料擷取（CDC），以及上線後你該盯著哪幾個數字。</p>

<h3><span class="badge lv1">基礎</span>一、一則訊息的一生</h3>
<p>想像一家餐廳的出單夾。外場把點單夾上去（送出訊息），廚師拿下一張開始做（取出訊息），做完把單子丟進垃圾桶（確認，acknowledgement，簡稱 ack）。如果廚師拿著單子昏倒了，領班過一陣子發現這張單沒人做完，就把它夾回去給下一位廚師。佇列（queue）系統的每一個設計，都是在把這個流程做得更可靠。</p>
<figure class="figure"><svg viewBox="0 0 680 210" class="fg" style="width:100%;max-width:680px" role="img" aria-label="生產者把訊息送進佇列，佇列把訊息交給背景工作者，工作者處理完回覆 ack 讓佇列刪除訊息；如果沒收到 ack，佇列會把同一則訊息再交出去一次">
<rect x="20" y="70" width="120" height="56" rx="6" class="fg-b"/>
<text x="80" y="94" text-anchor="middle" class="fg-t">生產者</text>
<text x="80" y="114" text-anchor="middle" class="fg-t sm">網頁伺服器</text>
<line x1="140" y1="98" x2="222" y2="98" class="fg-l"/><polygon points="230,98 222,93.5 222,102.5" class="fg-a"/>
<text x="181" y="90" text-anchor="middle" class="fg-t sm">① 送出</text>
<rect x="230" y="50" width="200" height="96" rx="8" class="fg-b hot"/>
<text x="330" y="72" text-anchor="middle" class="fg-t acc">佇列（broker）</text>
<rect x="245" y="96" width="52" height="26" rx="4" class="fg-b"/><text x="271" y="113" text-anchor="middle" class="fg-t sm mono">#103</text>
<rect x="304" y="96" width="52" height="26" rx="4" class="fg-b"/><text x="330" y="113" text-anchor="middle" class="fg-t sm mono">#102</text>
<rect x="363" y="96" width="52" height="26" rx="4" class="fg-b alt"/><text x="389" y="113" text-anchor="middle" class="fg-t sm mono">#101</text>
<line x1="430" y1="90" x2="512" y2="90" class="fg-l"/><polygon points="520,90 512,85.5 512,94.5" class="fg-a"/>
<text x="475" y="82" text-anchor="middle" class="fg-t sm">② 交給工人</text>
<line x1="520" y1="110" x2="438" y2="110" class="fg-l on"/><polygon points="430,110 438,105.5 438,114.5" class="fg-a on"/>
<text x="475" y="127" text-anchor="middle" class="fg-t sm acc">③ ack，刪除</text>
<rect x="520" y="70" width="140" height="56" rx="6" class="fg-b"/>
<text x="590" y="94" text-anchor="middle" class="fg-t">背景工作者</text>
<text x="590" y="114" text-anchor="middle" class="fg-t sm">消費者</text>
<path d="M590 126 V176 H330 V154" class="fg-l warm dash"/><polygon points="330,146 325.5,154 334.5,154" class="fg-a warm"/>
<text x="460" y="194" text-anchor="middle" class="fg-t sm warm">④ 沒收到 ack（當機或逾時）：再交一次</text>
</svg><figcaption>訊息被取走，不代表被刪掉。佇列要等到 ack 才真的刪除；等不到，就把它交給別人。重複，就是從第 ④ 步來的。</figcaption></figure>
<p>四個角色要分清楚：<b>生產者</b>（producer）送出訊息；<b>佇列伺服器</b>（broker）把訊息確實存好，通常寫進磁碟、複製到好幾台；<b>消費者</b>（consumer），也就是<b>背景工作者</b>（worker），取出訊息去處理；處理完回一個 <b>ack</b>，佇列才刪除它。取訊息有兩種方式：SQS 和 Kafka 是消費者主動去拉（pull），沒有訊息時用長輪詢（long polling）等著；RabbitMQ 則是由佇列主動推（push）給消費者，再用「預取數量」（prefetch）限制一個消費者手上最多同時有幾則還沒 ack 的訊息。</p>

<h3><span class="badge lv1">基礎</span>二、三種傳遞保證：差別只在 ack 放在哪裡</h3>
<p>消費者的程式碼裡，「處理」和「ack」總有一個先、一個後。當機剛好發生在兩者之間時，結果完全不同：</p>
<figure class="figure"><svg viewBox="0 0 680 235" class="fg" style="width:100%;max-width:680px" role="img" aria-label="上排先 ack 再處理，處理到一半當機，訊息已刪除而工作沒做完，結果是遺失；下排先處理再 ack，處理完還沒 ack 就當機，訊息被重送，工作做兩次，結果是重複">
<text x="20" y="28" class="fg-t warm">先 ack 再處理：最多一次（at-most-once）</text>
<rect x="20" y="40" width="110" height="40" rx="6" class="fg-b"/><text x="75" y="65" text-anchor="middle" class="fg-t">收到訊息</text>
<line x1="130" y1="60" x2="152" y2="60" class="fg-l"/><polygon points="160,60 152,55.5 152,64.5" class="fg-a"/>
<rect x="160" y="40" width="110" height="40" rx="6" class="fg-b"/><text x="215" y="65" text-anchor="middle" class="fg-t">ack</text>
<line x1="270" y1="60" x2="292" y2="60" class="fg-l"/><polygon points="300,60 292,55.5 292,64.5" class="fg-a"/>
<rect x="300" y="40" width="110" height="40" rx="6" class="fg-b warm"/><text x="355" y="65" text-anchor="middle" class="fg-t">處理到一半</text>
<line x1="410" y1="60" x2="442" y2="60" class="fg-l warm dash"/><polygon points="450,60 442,55.5 442,64.5" class="fg-a warm"/>
<text x="430" y="52" text-anchor="middle" class="fg-t sm warm">當機</text>
<rect x="450" y="36" width="210" height="48" rx="6" class="fg-b warm"/>
<text x="555" y="56" text-anchor="middle" class="fg-t">訊息沒了、工作沒做完</text>
<text x="555" y="74" text-anchor="middle" class="fg-t sm">結果：遺失</text>
<text x="20" y="128" class="fg-t acc">先處理再 ack：至少一次（at-least-once）</text>
<rect x="20" y="140" width="110" height="40" rx="6" class="fg-b"/><text x="75" y="165" text-anchor="middle" class="fg-t">收到訊息</text>
<line x1="130" y1="160" x2="152" y2="160" class="fg-l"/><polygon points="160,160 152,155.5 152,164.5" class="fg-a"/>
<rect x="160" y="140" width="110" height="40" rx="6" class="fg-b hot"/><text x="215" y="165" text-anchor="middle" class="fg-t">處理完成</text>
<line x1="270" y1="160" x2="292" y2="160" class="fg-l"/><polygon points="300,160 292,155.5 292,164.5" class="fg-a"/>
<rect x="300" y="140" width="110" height="40" rx="6" class="fg-b warm dash"/><text x="355" y="165" text-anchor="middle" class="fg-t">ack 沒送出</text>
<line x1="410" y1="160" x2="442" y2="160" class="fg-l warm dash"/><polygon points="450,160 442,155.5 442,164.5" class="fg-a warm"/>
<text x="430" y="152" text-anchor="middle" class="fg-t sm warm">當機</text>
<rect x="450" y="136" width="210" height="48" rx="6" class="fg-b warm"/>
<text x="555" y="156" text-anchor="middle" class="fg-t">訊息重送、工作再做一次</text>
<text x="555" y="174" text-anchor="middle" class="fg-t sm">結果：重複，要靠冪等</text>
<text x="340" y="222" text-anchor="middle" class="fg-t sm">沒有「剛好一次」的 ack 位置：只能選丟掉，或選重複然後讓重複無害</text>
</svg><figcaption>兩排做的事一模一樣，只是 ack 的位置對調。當機剛好落在中間時，上排會丟訊息，下排會重複。</figcaption></figure>
<ul>
<li><b>最多一次</b>（at-most-once）：先 ack 再處理，或乾脆不 ack（送出就不管）。不會重複，但會丟。適合丟了也無所謂的東西，例如統計用的點擊事件。</li>
<li><b>至少一次</b>（at-least-once）：先處理再 ack。不會丟，但會重複。這是絕大多數系統的預設，也是你應該預設的心態。</li>
<li><b>剛好一次</b>（exactly-once）：在一般的網路上，「傳遞」剛好一次是做不到的。消費者送出 ack 之後，沒辦法知道佇列到底收到了沒；佇列等不到 ack 時，也沒辦法分辨消費者是死了還是只是慢。能做到的是<b>效果上剛好一次</b>（effectively-once）：訊息可能來兩次，但「處理的效果」只發生一次。公式是：<b>至少一次＋冪等的處理</b>。</li>
</ul>
<p>你會在文件上看到「exactly-once」，要看清楚它保證的範圍。Kafka 的冪等生產者（Kafka 3.0 起預設開啟）防止生產者重試時寫入重複的訊息；Kafka 的交易可以讓「從一個主題讀、處理、寫到另一個主題、提交 offset」這一整組動作原子化。但只要你的處理碰到 Kafka 以外的東西，例如寫資料庫、寄信、呼叫金流 API，那一段還是要你自己做到冪等。SQS FIFO 佇列的去重編號也一樣：它在 5 分鐘內擋掉生產者重送的相同訊息，不管消費者那一側。</p>

<h3><span class="badge lv2">進階</span>三、可見性逾時：SQS 怎麼決定「你大概死了」</h3>
<p>SQS 沒有長連線，它不知道消費者還活著沒有。它的做法是：消費者收到訊息的那一刻起，這則訊息在一段時間內對其他人<b>看不見</b>，這段時間叫<b>可見性逾時</b>（visibility timeout），預設 30 秒，最長 12 小時。消費者要在時間內用收據（receipt handle）呼叫 <code>DeleteMessage</code> 刪掉它；時間到了還沒刪，訊息就重新出現，給下一個來拿的人。</p>
<figure class="figure"><svg viewBox="0 0 680 230" class="fg" style="width:100%;max-width:680px" role="img" aria-label="時間軸：工人 A 在 0 秒收到訊息，處理要 45 秒；可見性逾時 30 秒到時訊息重新出現，工人 B 在 31 秒拿到同一則又做一次；A 在 45 秒做完刪除，但刪除可能沒生效">
<text x="290" y="34" text-anchor="middle" class="fg-t sm warm">30 秒到：訊息重新出現</text>
<line x1="290" y1="40" x2="290" y2="200" class="fg-l warm dash"/>
<text x="10" y="65" class="fg-t">工人 A</text>
<text x="10" y="115" class="fg-t">工人 B</text>
<text x="10" y="165" class="fg-t">佇列裡</text>
<rect x="80" y="46" width="315" height="28" rx="4" class="fg-b alt"/>
<text x="185" y="65" text-anchor="middle" class="fg-t sm">A 處理中：要 45 秒</text>
<text x="403" y="65" class="fg-t sm">做完、刪除：可能沒刪掉</text>
<rect x="297" y="96" width="308" height="28" rx="4" class="fg-b warm"/>
<text x="451" y="115" text-anchor="middle" class="fg-t sm">B 拿到同一則，又做一次</text>
<rect x="80" y="146" width="210" height="28" rx="4" class="fg-b dash"/>
<text x="185" y="165" text-anchor="middle" class="fg-t sm">看不見（invisible）</text>
<rect x="297" y="146" width="308" height="28" rx="4" class="fg-b dash"/>
<text x="451" y="165" text-anchor="middle" class="fg-t sm">又看不見，再等 30 秒</text>
<line x1="80" y1="200" x2="632" y2="200" class="fg-l"/><polygon points="640,200 632,195.5 632,204.5" class="fg-a"/>
<line x1="80" y1="196" x2="80" y2="204" class="fg-l"/><line x1="395" y1="196" x2="395" y2="204" class="fg-l"/><line x1="500" y1="196" x2="500" y2="204" class="fg-l"/><line x1="605" y1="196" x2="605" y2="204" class="fg-l"/>
<text x="80" y="218" text-anchor="middle" class="fg-t sm">0 秒</text>
<text x="290" y="218" text-anchor="middle" class="fg-t sm">30</text>
<text x="395" y="218" text-anchor="middle" class="fg-t sm">45</text>
<text x="500" y="218" text-anchor="middle" class="fg-t sm">60</text>
<text x="605" y="218" text-anchor="middle" class="fg-t sm">75 秒</text>
</svg><figcaption>逾時比工作短，重複就不是「偶爾」，而是「每一次」。如果每一輪都超時，這則訊息會被反覆處理，最後還可能被當成毒訊息送進死信佇列，即使它其實每次都做完了。</figcaption></figure>
<p>注意 A 在第 45 秒的刪除：每次收到訊息都會拿到新的收據，AWS 的文件寫明，用舊的收據刪除，請求可能顯示成功，訊息卻沒被刪掉。所以 B 做完之後，同樣的劇情可能再演一次。這也是為什麼收到次數（<code>ApproximateReceiveCount</code>）會一直往上加。</p>
<h4>怎麼設才對</h4>
<ul>
<li>可見性逾時設成處理時間 p99 的好幾倍。處理通常 2 秒、偶爾 20 秒，就設 2 到 3 分鐘。</li>
<li>處理時間很不固定的工作（轉檔、產報表），用心跳：每隔逾時的一半，呼叫 <code>ChangeMessageVisibility</code> 延長一次。程式真的死了，心跳停止，訊息照樣會在逾時後回來。</li>
<li>用長輪詢（<code>WaitTimeSeconds</code> 最多 20 秒），避免空佇列時不停地發空請求、浪費錢。</li>
</ul>
<h4>其他系統的同一件事</h4>
<ul>
<li><b>RabbitMQ</b>：沒有可見性逾時。消費者的連線或通道（channel）斷掉，手上沒 ack 的訊息就回到佇列，並標上 redelivered。另有一個消費者逾時（<code>consumer_timeout</code>，預設 30 分鐘）：拿著訊息太久不 ack，RabbitMQ 會關掉那個通道。</li>
<li><b>Kafka</b>：不是逐則確認，而是記錄 offset（第八節細講）。消費者兩次 <code>poll()</code> 之間如果超過 <code>max.poll.interval.ms</code>（預設 5 分鐘），會被踢出群組，它負責的分區交給別人，從上次提交的 offset 開始重做。一批訊息處理太慢，就會一直被踢、一直重做。</li>
</ul>

<h3><span class="badge lv2">進階</span>四、冪等的消費者：一張去重表</h3>
<p>上一課說：給每個操作一個唯一 ID，動手前先記到一張有唯一約束的表。關鍵細節是：<b>「記下 ID」和「真正的效果」必須在同一個資料庫交易裡</b>。</p>
<pre><code>CREATE TABLE processed_messages (
  message_id   text PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);</code></pre>
<pre><code>async function handle(msg: { id: string; userId: string; points: number }) {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const r = await c.query(
      'INSERT INTO processed_messages (message_id) VALUES ($1) ON CONFLICT DO NOTHING',
      [msg.id]);
    if (r.rowCount === 0) {            // 這個 ID 做過了：什麼都不改
      await c.query('ROLLBACK');
      return;
    }
    await c.query('UPDATE wallets SET points = points + $1 WHERE user_id = $2',
      [msg.points, msg.userId]);
    await c.query('COMMIT');           // 去重紀錄和加點數一起成功
  } catch (e) {
    await c.query('ROLLBACK');
    throw e;                           // 不 ack，讓佇列之後重送
  } finally {
    c.release();
  }
}
// 呼叫端：handle() 成功回來之後，才 ack 或刪除訊息</code></pre>
<p>逐一檢查當機的位置：在 COMMIT 之前當機，兩件事都沒發生，重送時從頭做；在 COMMIT 之後、ack 之前當機，重送時 <code>INSERT</code> 撞到主鍵，<code>rowCount</code> 是 0，直接跳過，然後 ack。不管當在哪裡，點數都只加一次。如果把去重紀錄和加點數分成兩個交易，中間當機就一定會出錯：先記 ID 的會漏加，後記 ID 的會重複加。</p>
<h4>效果不在你的資料庫裡時</h4>
<ul>
<li><b>呼叫外部 API</b>：用對方的冪等鍵。例如 Stripe 的 API 接受 <code>Idempotency-Key</code> 標頭，同一個鍵重送，它只會扣一次款。把訊息 ID 當成冪等鍵傳過去。</li>
<li><b>寄信、推播</b>：做不到真正的冪等。先在資料庫記「待寄」，寄出後改成「已寄」，可以把重複縮到極少，但當機剛好在寄出之後、改狀態之前，還是會重寄一封。大部分產品接受這個代價。</li>
<li><b>天生冪等的寫法</b>：<code>UPDATE orders SET status = 'paid' WHERE id = $1 AND status = 'pending'</code>。第二次執行時條件不成立，<code>rowCount</code> 是 0，你也就知道「已經做過了」。</li>
</ul>
<p>去重表會一直長大。它只需要保留得比「同一則訊息最晚可能被重送的時間」更久，例如 SQS 的保留期限預設 4 天，就保留 7 天。用第 3.6 課的按日分割表，每天丟掉最舊的一塊就好。</p>

<h3><span class="badge lv3">專業</span>五、順序：用鍵分區，以及它的代價</h3>
<p>順序會亂，原因有三個：好幾個消費者平行處理；一則訊息失敗後重試，排到了比它新的訊息後面；重新投遞。看一張訂單的三個事件：「已建立」、「已付款」、「已出貨」。如果「已出貨」比「已付款」先被處理，訂單狀態最後可能停在「已付款」，倒退了。</p>
<h4>做法一：同一個鍵進同一個分區</h4>
<p>Kafka 的生產者送訊息時帶一個鍵（key），預設用 murmur2 雜湊算出它落在哪個分區；同一個分區同一時間只會由群組裡的一個消費者讀，而且照 offset 順序讀。所以只要用訂單 ID 當鍵，同一張訂單的事件就一定照順序處理，不同訂單之間則完全平行。SQS FIFO 的 <code>MessageGroupId</code> 是同一個想法：同一個群組內照順序，不同群組可以平行。</p>
<p>代價有三個：</p>
<ul>
<li><b>排頭阻塞</b>（head-of-line blocking）：一則訊息卡住或一直失敗，同一個分區後面所有的訊息都要等，包括其他訂單的訊息，因為它們剛好雜湊到同一個分區。</li>
<li><b>平行度有上限</b>：一個 Kafka 主題有 12 個分區，同一個群組最多就是 12 個消費者在做事，第 13 個只能閒著。</li>
<li><b>不能隨便改分區數</b>：Kafka 的分區數只能增加，而增加之後同一個鍵可能落到別的分區，在新舊交替的那段時間，順序就不保證了。分區數最好一開始就留餘裕。</li>
</ul>
<h4>做法二：讓順序不重要</h4>
<p>每個事件帶一個版本號，消費者只接受比目前更新的版本：<code>UPDATE orders SET status = $1, version = $2 WHERE id = $3 AND version &lt; $2</code>。晚到的舊事件會因為條件不成立而被忽略。這比依賴佇列的順序更強韌，重試、重播、換佇列系統都不怕。能做到的話，優先用這一招。</p>

<h3><span class="badge lv3">專業</span>六、毒訊息、重試與死信佇列</h3>
<p>處理失敗時，第一件事是分辨錯誤的種類：</p>
<ul>
<li><b>暫時性錯誤</b>：逾時、對方回 503、資料庫死結、連線被重設。等一下再試很可能就好了，該重試。</li>
<li><b>永久性錯誤</b>：格式錯誤、欄位缺少、程式本身的 bug。重試一百次也一樣，應該直接送進<b>死信佇列</b>（dead-letter queue，DLQ），不要浪費資源。</li>
</ul>
<p>重試要用<b>指數退避加隨機抖動</b>（exponential backoff with jitter）：等待時間是 1、2、4、8、16 秒……再乘上一個隨機係數，並設上限。抖動的理由跟第 3.5 課的快取一樣：下游掛了 5 分鐘，幾萬則訊息同時失敗，如果大家都剛好在 1 秒後、2 秒後一起重試，下游一恢復就會被同一波洪水再打趴一次，這叫重試風暴（retry storm）。下游持續掛掉時，還應該用斷路器（circuit breaker）暫停消費，而不是把重試次數燒光、把整批訊息都送進 DLQ。</p>
<h4>各系統的死信佇列</h4>
<ul>
<li><b>SQS</b>：在來源佇列設 redrive policy，<code>maxReceiveCount</code> 例如 5，收到第 5 次還沒刪掉，就自動移到 DLQ。修好程式後，可以用 SQS 的重新驅動（redrive）功能把 DLQ 的訊息送回原佇列。一個容易漏掉的細節：標準佇列的訊息移進 DLQ 時，保留期限是從它<b>最初進入來源佇列</b>的時間算起，所以 DLQ 的保留期限要設得比來源佇列長，不然訊息可能還沒人看就過期了。</li>
<li><b>RabbitMQ</b>：用 dead-letter exchange：訊息被拒絕且不重新排入、過期或超過長度限制時，轉送到另一個交換器（exchange）。</li>
<li><b>Kafka</b>：本身沒有內建 DLQ，因為它沒有逐則的 ack。常見做法是重試主題：處理失敗就把訊息寫到 <code>rounds.retry.1m</code>，再失敗寫到 <code>rounds.retry.10m</code>，最後寫到 <code>rounds.dlq</code>，然後提交原本的 offset 繼續往下。這會犧牲那一則訊息的順序，換取整個分區不被卡住。</li>
</ul>
<p>DLQ 不是垃圾桶。它的深度大於 0 就該發警報，要有人去看、修、重新送回去。一個沒人看的 DLQ，等於一個靜靜吃掉訂單的黑洞。</p>

<h3><span class="badge lv3">專業</span>七、背壓與容量的算術</h3>
<p>佇列最基本的容量算式是<b>利特爾法則</b>（Little's law）：系統裡同時在處理的數量 L，等於進來的速度 λ 乘上每一則要花的時間 W。每秒進來 500 則，每則處理 200 毫秒，就要 500 × 0.2 = 100 則同時在處理。如果每個工人一次只做一則，至少要 100 個工人；保留三成餘裕，就是 130 個左右。</p>
<p>工人不夠時，積壓就會線性成長。看一個高峰：</p>
<figure class="figure"><svg viewBox="0 0 680 240" class="fg" style="width:100%;max-width:680px" role="img" aria-label="積壓量的時間圖：高峰期間每秒進 500 則、只能處理 400 則，60 分鐘累積到 36 萬則；高峰過後每秒進 300 則，每秒淨消化 100 則，又花 60 分鐘才清空">
<line x1="60" y1="30" x2="60" y2="210" class="fg-l"/>
<line x1="60" y1="210" x2="640" y2="210" class="fg-l"/>
<text x="68" y="26" class="fg-t sm">積壓的訊息數</text>
<line x1="136" y1="40" x2="136" y2="210" class="fg-l dim dash"/>
<line x1="364" y1="40" x2="364" y2="210" class="fg-l dim dash"/>
<polyline points="60,209 136,209 364,50 592,209 630,209" class="fg-l warm"/>
<circle cx="364" cy="50" r="4" class="fg-lamp on"/>
<text x="378" y="46" class="fg-t sm warm">36 萬則</text>
<text x="146" y="80" class="fg-t sm">高峰：每秒進 500</text>
<text x="146" y="98" class="fg-t sm">只做得完 400</text>
<text x="146" y="116" class="fg-t sm warm">每秒多積 100 則</text>
<text x="470" y="80" class="fg-t sm">高峰過後：每秒進 300</text>
<text x="470" y="98" class="fg-t sm">還是做 400</text>
<text x="470" y="116" class="fg-t sm acc">每秒消化 100 則</text>
<text x="60" y="228" text-anchor="middle" class="fg-t sm">0</text>
<text x="136" y="228" text-anchor="middle" class="fg-t sm">20</text>
<text x="364" y="228" text-anchor="middle" class="fg-t sm">80</text>
<text x="592" y="228" text-anchor="middle" class="fg-t sm">140</text>
<text x="640" y="228" text-anchor="end" class="fg-t sm">分鐘</text>
</svg><figcaption>堆上去和消化掉，都只看「進來」和「做完」的差。高峰只持續 60 分鐘，清完卻要再 60 分鐘，因為高峰過後的餘裕只有每秒 100 則。</figcaption></figure>
<p>消化時間的公式是：<b>積壓量 ÷（處理速度 − 進來速度）</b>。36 萬 ÷（400 − 300）= 3,600 秒，一小時。如果高峰後進來的速度是 380，就是 36 萬 ÷ 20 = 5 小時。這個公式告訴你兩件事：第一，處理能力只比平常的流量多一點點，任何高峰都要很久才消化得完；第二，高峰時加工人最有效，因為每多一份能力，都直接縮短消化時間。這時，最舊訊息的年齡大約是積壓量除以處理速度：36 萬 ÷ 400 = 900 秒，也就是使用者的工作晚了 15 分鐘才被處理。</p>
<h4>背壓：總得有一邊讓步</h4>
<p><b>背壓</b>（backpressure）是讓「下游跟不上」這件事傳回上游，而不是讓佇列無止境地長下去、直到磁碟或記憶體爆掉。常見的手段：</p>
<ul>
<li><b>有上限的佇列</b>：滿了就拒絕新訊息，生產者把 429 或 503 回給用戶端，讓用戶端稍後再試。</li>
<li><b>拉取模式本身就是背壓</b>：Kafka 和 SQS 的消費者照自己的速度拉，佇列只是變長，不會把消費者壓垮。RabbitMQ 用 prefetch 做到同樣的效果。</li>
<li><b>依積壓量自動擴展</b>：Kubernetes 上的 KEDA 可以依 SQS 佇列長度或 Kafka 的延遲，自動增減消費者的 Pod 數。但要記得：消費者變多，下游資料庫的壓力也變大，擴展上限要設在下游撐得住的地方。</li>
<li><b>丟掉低價值的工作</b>：統計事件、推薦用的點擊紀錄，在高峰時丟掉或取樣，保住訂單和付款。</li>
</ul>
<p>同樣的觀念也出現在程式語言裡：Go 的有緩衝通道滿了，送的那一方就會被擋住；Node.js 的 stream 呼叫 <code>write()</code> 回傳 <code>false</code>，就是在叫你等 <code>'drain'</code> 事件再繼續寫。不理它硬寫，記憶體就會一路漲。</p>

<h3><span class="badge lv4">專家</span>八、Kafka 的日誌模型：分區、offset、消費者群組</h3>
<p>上一課說 Kafka 是「日誌」，訊息被讀了也不會消失。具體來說：一個主題（topic）分成好幾個<b>分區</b>（partition），每個分區是一個只會往後追加的檔案；每則訊息有一個在分區內遞增的編號，叫 <b>offset</b>。訊息照保留規則留著（預設 7 天，也可以依大小，或用 compaction 只留每個鍵的最新一筆），不管有沒有人讀過。</p>
<figure class="figure"><svg viewBox="0 0 680 292" class="fg" style="width:100%;max-width:680px" role="img" aria-label="Kafka 主題有三個分區，生產者依鍵的雜湊決定分區；消費者群組裡消費者 1 讀分區 0 和 1，消費者 2 讀分區 2；綠色是已處理並提交的 offset，分區 2 還有 6 則沒處理，就是落後量">
<rect x="10" y="109" width="90" height="50" rx="6" class="fg-b"/>
<text x="55" y="131" text-anchor="middle" class="fg-t">生產者</text>
<text x="55" y="149" text-anchor="middle" class="fg-t sm">key＝玩家 ID</text>
<text x="55" y="98" text-anchor="middle" class="fg-t sm mono">hash(key) % 3</text>
<path d="M100 134 H125 V64 H142" class="fg-l"/><polygon points="150,64 142,59.5 142,68.5" class="fg-a"/>
<line x1="100" y1="134" x2="142" y2="134" class="fg-l"/><polygon points="150,134 142,129.5 142,138.5" class="fg-a"/>
<path d="M125 134 V204 H142" class="fg-l"/><polygon points="150,204 142,199.5 142,208.5" class="fg-a"/>
<text x="150" y="44" class="fg-t sm">分區 0</text>
<text x="150" y="114" class="fg-t sm">分區 1</text>
<text x="150" y="184" class="fg-t sm">分區 2</text>
<rect x="150" y="50" width="32" height="28" rx="3" class="fg-b hot"/><text x="166" y="69" text-anchor="middle" class="fg-t sm mono">0</text>
<rect x="184" y="50" width="32" height="28" rx="3" class="fg-b hot"/><text x="200" y="69" text-anchor="middle" class="fg-t sm mono">1</text>
<rect x="218" y="50" width="32" height="28" rx="3" class="fg-b hot"/><text x="234" y="69" text-anchor="middle" class="fg-t sm mono">2</text>
<rect x="252" y="50" width="32" height="28" rx="3" class="fg-b hot"/><text x="268" y="69" text-anchor="middle" class="fg-t sm mono">3</text>
<rect x="286" y="50" width="32" height="28" rx="3" class="fg-b hot"/><text x="302" y="69" text-anchor="middle" class="fg-t sm mono">4</text>
<rect x="320" y="50" width="32" height="28" rx="3" class="fg-b hot"/><text x="336" y="69" text-anchor="middle" class="fg-t sm mono">5</text>
<rect x="354" y="50" width="32" height="28" rx="3" class="fg-b"/><text x="370" y="69" text-anchor="middle" class="fg-t sm mono">6</text>
<rect x="388" y="50" width="32" height="28" rx="3" class="fg-b"/><text x="404" y="69" text-anchor="middle" class="fg-t sm mono">7</text>
<rect x="150" y="120" width="32" height="28" rx="3" class="fg-b hot"/><text x="166" y="139" text-anchor="middle" class="fg-t sm mono">0</text>
<rect x="184" y="120" width="32" height="28" rx="3" class="fg-b hot"/><text x="200" y="139" text-anchor="middle" class="fg-t sm mono">1</text>
<rect x="218" y="120" width="32" height="28" rx="3" class="fg-b hot"/><text x="234" y="139" text-anchor="middle" class="fg-t sm mono">2</text>
<rect x="252" y="120" width="32" height="28" rx="3" class="fg-b hot"/><text x="268" y="139" text-anchor="middle" class="fg-t sm mono">3</text>
<rect x="286" y="120" width="32" height="28" rx="3" class="fg-b hot"/><text x="302" y="139" text-anchor="middle" class="fg-t sm mono">4</text>
<rect x="320" y="120" width="32" height="28" rx="3" class="fg-b"/><text x="336" y="139" text-anchor="middle" class="fg-t sm mono">5</text>
<rect x="354" y="120" width="32" height="28" rx="3" class="fg-b"/><text x="370" y="139" text-anchor="middle" class="fg-t sm mono">6</text>
<rect x="150" y="190" width="32" height="28" rx="3" class="fg-b hot"/><text x="166" y="209" text-anchor="middle" class="fg-t sm mono">0</text>
<rect x="184" y="190" width="32" height="28" rx="3" class="fg-b hot"/><text x="200" y="209" text-anchor="middle" class="fg-t sm mono">1</text>
<rect x="218" y="190" width="32" height="28" rx="3" class="fg-b warm"/><text x="234" y="209" text-anchor="middle" class="fg-t sm mono">2</text>
<rect x="252" y="190" width="32" height="28" rx="3" class="fg-b warm"/><text x="268" y="209" text-anchor="middle" class="fg-t sm mono">3</text>
<rect x="286" y="190" width="32" height="28" rx="3" class="fg-b warm"/><text x="302" y="209" text-anchor="middle" class="fg-t sm mono">4</text>
<rect x="320" y="190" width="32" height="28" rx="3" class="fg-b warm"/><text x="336" y="209" text-anchor="middle" class="fg-t sm mono">5</text>
<rect x="354" y="190" width="32" height="28" rx="3" class="fg-b warm"/><text x="370" y="209" text-anchor="middle" class="fg-t sm mono">6</text>
<rect x="388" y="190" width="32" height="28" rx="3" class="fg-b warm"/><text x="404" y="209" text-anchor="middle" class="fg-t sm mono">7</text>
<path d="M218 226 V232 H420 V226" class="fg-l warm"/>
<text x="319" y="250" text-anchor="middle" class="fg-t sm warm">還有 6 則沒處理＝落後（lag）</text>
<rect x="490" y="30" width="180" height="210" rx="10" class="fg-b dash"/>
<text x="580" y="50" text-anchor="middle" class="fg-t sm">消費者群組 scorer</text>
<rect x="505" y="60" width="150" height="56" rx="6" class="fg-b alt"/>
<text x="580" y="84" text-anchor="middle" class="fg-t">消費者 1</text>
<text x="580" y="104" text-anchor="middle" class="fg-t sm">讀分區 0、1</text>
<rect x="505" y="170" width="150" height="56" rx="6" class="fg-b alt"/>
<text x="580" y="194" text-anchor="middle" class="fg-t">消費者 2</text>
<text x="580" y="214" text-anchor="middle" class="fg-t sm">讀分區 2</text>
<line x1="420" y1="64" x2="497" y2="64" class="fg-l alt"/><polygon points="505,64 497,59.5 497,68.5" class="fg-a alt"/>
<path d="M386 134 H460 V100 H497" class="fg-l alt"/><polygon points="505,100 497,95.5 497,104.5" class="fg-a alt"/>
<line x1="420" y1="204" x2="497" y2="204" class="fg-l alt"/><polygon points="505,204 497,199.5 497,208.5" class="fg-a alt"/>
<text x="340" y="282" text-anchor="middle" class="fg-t sm">綠色：已處理並提交 offset；白色：還沒處理；新訊息從右邊加進來</text>
</svg><figcaption>Kafka 不記「哪幾則被 ack 了」，只記每個群組在每個分區讀到哪個 offset。落後量就是「分區最新的 offset」減掉「群組已提交的 offset」。</figcaption></figure>
<ul>
<li><b>消費者群組</b>（consumer group）：同一個群組裡，每個分區同一時間只分給一個消費者，所以群組的平行度最多等於分區數。<b>不同的群組各自獨立</b>：計分服務一個群組、統計服務一個群組，各讀一遍、各記各的 offset，互不影響。這是日誌模型最大的威力：同一份事件，可以被很多個系統各自消費。</li>
<li><b>提交 offset</b>：消費者處理完，把「我讀到哪裡」提交給 Kafka。先提交再處理是最多一次，先處理再提交是至少一次。注意預設的自動提交（<code>enable.auto.commit=true</code>，每 5 秒一次）是照時間提交、不管你處理完沒有；如果你把訊息丟給別的執行緒非同步處理，當機時就可能有訊息被提交了卻沒做。要掌握得準，就關掉自動提交，處理完再手動提交。</li>
<li><b>offset 是一條水位線，不是逐則打勾</b>：提交 offset 106 的意思是「106 以前全部做完了」。所以 Kafka 沒辦法「跳過第 103 則、其他照做」，一則毒訊息會擋住整個分區，這就是上一節要用重試主題的原因。SQS 和 RabbitMQ 是逐則 ack，一則失敗不影響其他則。</li>
<li><b>重播</b>：因為訊息還在，修好一個 bug 之後，可以把群組的 offset 倒回去重算：<code>kafka-consumer-groups.sh --group scorer --topic rounds --reset-offsets --to-datetime 2026-11-03T14:00:00.000 --execute</code>（群組要先停下來）。工作佇列做不到這件事，訊息 ack 之後就不見了。</li>
<li><b>重新分配</b>（rebalance）：消費者加入或離開時，分區要重新分配，分配期間相關的分區會暫停。Kafka 4.0 起完全移除 ZooKeeper，並正式推出新一代的消費者群組協定，大幅減少重新分配時的停頓。</li>
</ul>
<table>
<tr><th></th><th>Kafka</th><th>SQS</th><th>RabbitMQ</th></tr>
<tr><td>模型</td><td>分區日誌，讀了不刪</td><td>代管的工作佇列</td><td>訊息代理，交換器把訊息路由到佇列</td></tr>
<tr><td>確認方式</td><td>每個分區提交一個 offset</td><td>逐則刪除</td><td>逐則 ack</td></tr>
<tr><td>順序</td><td>分區內保證</td><td>標準佇列不保證；FIFO 依群組保證</td><td>單一佇列、單一消費者時保證</td></tr>
<tr><td>重播</td><td>可以，在保留期限內</td><td>不行</td><td>一般佇列不行；stream 類型可以</td></tr>
<tr><td>多個系統讀同一份</td><td>每個系統一個消費者群組</td><td>要用 SNS 先分送成多個佇列</td><td>fanout 交換器複製到多個佇列</td></tr>
<tr><td>適合</td><td>大量事件、多個下游、要重播</td><td>不想維運、單純的背景工作</td><td>複雜路由、需要優先順序與彈性</td></tr>
</table>
<p>RabbitMQ 現在建議需要可靠性的佇列用 quorum queue（用 Raft 複製到多個節點），3.9 版起也加入了 stream 類型，提供類似 Kafka 的可重播日誌。邊界越來越模糊，但兩種心智模型仍然要分清楚：<b>工作佇列管的是「工作做完了沒」，日誌管的是「發生過什麼事」</b>。</p>

<h3><span class="badge lv4">專家</span>九、寄件匣模式與變更資料擷取（CDC）</h3>
<p>「更新資料庫」和「發布訊息」是兩個系統，沒辦法放進同一個交易。兩種天真的寫法都會出事：</p>
<ul>
<li>先 COMMIT 再發布：COMMIT 成功後、發布前程式當掉，訊息永遠沒送出。訂單付款了，出貨系統卻不知道。</li>
<li>先發布再 COMMIT：訊息送出了，COMMIT 卻失敗（違反約束、死結）。出貨系統收到一張根本不存在的已付款訂單。</li>
</ul>
<p><b>寄件匣模式</b>（outbox pattern）的解法是：把「要發布的訊息」也當成資料，跟業務資料寫在同一個交易裡。之後再由另一支程式把它搬到佇列去。</p>
<figure class="figure"><svg viewBox="0 0 680 258" class="fg" style="width:100%;max-width:680px" role="img" aria-label="應用程式在同一個交易裡更新 orders 表並在 outbox 表新增一則事件；之後由輪詢 outbox 的轉發程式，或讀取 WAL 的 CDC 工具，把事件送到 Kafka">
<rect x="10" y="80" width="110" height="60" rx="6" class="fg-b"/>
<text x="65" y="115" text-anchor="middle" class="fg-t">應用程式</text>
<rect x="180" y="30" width="230" height="170" rx="8" class="fg-b"/>
<text x="295" y="50" text-anchor="middle" class="fg-t">資料庫</text>
<rect x="196" y="62" width="198" height="94" rx="6" class="fg-b dash"/>
<rect x="208" y="72" width="174" height="30" rx="4" class="fg-b"/><text x="295" y="92" text-anchor="middle" class="fg-t sm">orders：改成已付款</text>
<rect x="208" y="116" width="174" height="30" rx="4" class="fg-b hot"/><text x="295" y="136" text-anchor="middle" class="fg-t sm">outbox：新增一則事件</text>
<rect x="196" y="166" width="198" height="24" rx="4" class="fg-b alt"/><text x="295" y="182" text-anchor="middle" class="fg-t sm">WAL／binlog 也記下了</text>
<line x1="120" y1="110" x2="188" y2="110" class="fg-l on"/><polygon points="196,110 188,105.5 188,114.5" class="fg-a on"/>
<text x="150" y="102" text-anchor="middle" class="fg-t sm acc">一次提交</text>
<rect x="450" y="60" width="120" height="44" rx="6" class="fg-b"/>
<text x="510" y="79" text-anchor="middle" class="fg-t">轉發程式</text>
<text x="510" y="96" text-anchor="middle" class="fg-t sm">輪詢 outbox</text>
<rect x="450" y="150" width="120" height="44" rx="6" class="fg-b alt"/>
<text x="510" y="169" text-anchor="middle" class="fg-t">CDC 工具</text>
<text x="510" y="186" text-anchor="middle" class="fg-t sm">讀 WAL</text>
<text x="510" y="132" text-anchor="middle" class="fg-t sm">二選一</text>
<path d="M382 131 H420 V82 H442" class="fg-l"/><polygon points="450,82 442,77.5 442,86.5" class="fg-a"/>
<line x1="394" y1="178" x2="442" y2="178" class="fg-l alt"/><polygon points="450,178 442,173.5 442,182.5" class="fg-a alt"/>
<rect x="600" y="80" width="70" height="90" rx="6" class="fg-b hot"/>
<text x="635" y="130" text-anchor="middle" class="fg-t">Kafka</text>
<path d="M570 82 H585 V105 H592" class="fg-l"/><polygon points="600,105 592,100.5 592,109.5" class="fg-a"/>
<path d="M570 172 H585 V145 H592" class="fg-l alt"/><polygon points="600,145 592,140.5 592,149.5" class="fg-a alt"/>
<text x="340" y="226" text-anchor="middle" class="fg-t sm acc">訊息和業務資料在同一個交易裡：要嘛都寫進去，要嘛都沒有</text>
<text x="340" y="246" text-anchor="middle" class="fg-t sm warm">轉發也可能重送，所以下游消費者還是要冪等</text>
</svg><figcaption>難的「兩個系統一起成功」被換成了簡單的「一個資料庫交易」，加上一段可以重試的搬運。搬運可以輪詢 outbox，也可以直接讀資料庫的 WAL。</figcaption></figure>
<pre><code>BEGIN;
UPDATE orders SET status = 'paid' WHERE id = 7 AND status = 'pending';
INSERT INTO outbox (aggregate_id, type, payload)
  VALUES ('order-7', 'OrderPaid', '{"orderId":7,"amount":350}');
COMMIT;</code></pre>
<h4>搬運方式一：輪詢</h4>
<p>轉發程式每隔一小段時間查 <code>SELECT ... FROM outbox WHERE published_at IS NULL ORDER BY id LIMIT 100 FOR UPDATE SKIP LOCKED</code>，送到佇列，成功後把 <code>published_at</code> 填上。<code>SKIP LOCKED</code> 讓好幾個轉發程式可以同時跑，不會搶同一列。它可能在「送出成功」和「填上 published_at」之間當掉，下次就會再送一次，所以又回到了至少一次，消費者要冪等。</p>
<p>有一個很少人注意的陷阱：自動遞增的 id 是在 <code>INSERT</code> 執行的那一刻分配的，不是在 COMMIT 時。交易 A 拿到 id 100、交易 B 拿到 id 101，但 B 先 COMMIT。如果轉發程式用「上次送到 id 100，這次從 101 之後找」這種游標，就可能在 A 還沒 COMMIT 時先送了 101，記下游標 101，之後永遠跳過 100。用 <code>published_at IS NULL</code> 判斷就不會漏，只是順序可能稍微亂一點。</p>
<h4>搬運方式二：變更資料擷取（CDC）</h4>
<p>不輪詢，直接讀資料庫自己的變更日誌：PostgreSQL 用邏輯解碼讀 WAL，MySQL 讀 binlog（這就是第 3.4 課講的複寫串流）。最常用的工具是 <b>Debezium</b>，它把每一列的變更變成 Kafka 訊息，還有一個專門處理寄件匣的轉換器（Outbox Event Router），只把 outbox 表的新資料轉成乾淨的事件。好處是延遲低、不用一直查資料庫、順序跟提交順序一致。代價是多一套要維運的元件，而且它在 PostgreSQL 上用的是複寫槽：CDC 停掉時，主庫會一直保留 WAL，直到磁碟被塞爆，所以要像監控副本一樣監控它。</p>
<p>也可以不經過 outbox，直接用 CDC 發布業務表本身的變更。但那等於把你內部的表結構公開成別人依賴的介面，以後改一個欄位就會打壞下游。outbox 讓你明確地決定「對外發布的事件長什麼樣子」，這是它比直接 CDC 業務表更受推薦的原因。</p>

<h3><span class="badge lv4">專家</span>十、監控：盯著哪幾個數字</h3>
<table>
<tr><th>指標</th><th>SQS 叫什麼</th><th>Kafka 怎麼看</th><th>告訴你什麼</th></tr>
<tr><td>最舊訊息的年齡</td><td><code>ApproximateAgeOfOldestMessage</code></td><td>以時間計算的落後（用工具換算）</td><td>使用者的工作晚了多久被處理。最重要的一個</td></tr>
<tr><td>積壓量</td><td><code>ApproximateNumberOfMessagesVisible</code></td><td>每個分區的 lag（最新 offset − 已提交 offset）</td><td>還有多少沒做</td></tr>
<tr><td>處理中</td><td><code>ApproximateNumberOfMessagesNotVisible</code></td><td>無直接對應</td><td>很多卻一直不減少，代表工人卡住或逾時太長</td></tr>
<tr><td>死信佇列深度</td><td>DLQ 的訊息數</td><td>DLQ 主題的訊息數</td><td>大於 0 就要有人看</td></tr>
<tr><td>處理速度與錯誤率</td><td>自己在消費者裡記錄</td><td>自己在消費者裡記錄</td><td>能力有沒有下降、是不是一直在重試</td></tr>
</table>
<p>警報要設在<b>時間</b>上，不是設在數量上。積壓 1 萬則，對一個每秒處理 5,000 則的系統只是 2 秒；對每秒處理 10 則的系統是 17 分鐘。所以警報應該長這樣：「寄信佇列最舊的訊息超過 5 分鐘，持續 10 分鐘」。數字取決於你對這項工作的承諾：密碼重設信 1 分鐘，月報表 1 小時。</p>
<p>Kafka 的落後要逐分區看。用 <code>kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group scorer</code>，節錄部分欄位：</p>
<pre><code>GROUP   TOPIC   PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
scorer  rounds  0          18200           18210           10
scorer  rounds  1          17950           17955           5
scorer  rounds  2          9000            21400           12400</code></pre>
<p>總落後 12,415，看起來只是「有點多」。逐分區看就清楚了：分區 0 和 1 幾乎是 0，分區 2 落後一萬多而且不是平均分布。這幾乎一定是兩種情況之一：分區 2 卡著一則毒訊息，或者有一個超熱的鍵全都雜湊到分區 2。只看總數的儀表板，永遠看不出這件事。LinkedIn 開源的 Burrow 就是專門用來評估消費者落後狀態的工具，很多監控系統也有現成的 Kafka 延遲匯出器。</p>

<h3>十一、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>選一個支援 exactly-once 的佇列，就不用管重複了</td><td>那個保證只涵蓋佇列系統內部。你的處理只要碰到資料庫、寄信、外部 API，那一段還是要自己做到冪等。</td></tr>
<tr><td>訊息被消費者取走就從佇列消失了</td><td>要等到 ack 或刪除才消失。逾時、斷線、被踢出群組，都會讓它回來。</td></tr>
<tr><td>可見性逾時越短，失敗的工作越快重試，越好</td><td>短於處理時間，每一則都會被重複處理，最後還可能誤進死信佇列。</td></tr>
<tr><td>Kafka 保證順序</td><td>只保證同一個分區內的順序。跨分區沒有順序，增加分區數時同一個鍵的順序也會暫時被打亂。</td></tr>
<tr><td>多開消費者就會比較快</td><td>Kafka 的平行度上限是分區數；而且瓶頸常常在下游的資料庫，開更多消費者只是把它壓垮得更快。</td></tr>
<tr><td>死信佇列是放失敗訊息的地方，不用管</td><td>DLQ 有東西就代表有工作沒完成。要有警報、有人處理、有工具重新送回。</td></tr>
<tr><td>佇列裡有幾萬則訊息就是出事了</td><td>要換算成時間才有意義。看最舊訊息的年齡，以及它是不是持續變大。</td></tr>
</table>

<h3>十二、跟你的工作連起來</h3>
<ul>
<li><b>Node.js／Go 後端</b>：寄信、產生圖片、呼叫慢的外部 API、處理金流 webhook，都適合丟進佇列。Node.js 常用 BullMQ（建立在 Redis 上），雲端上則直接用 SQS 或 Pub/Sub。不管哪一個，處理函式第一行先想：「這則訊息來兩次會怎樣？」</li>
<li><b>金流 webhook</b>：本質上就是別人送給你的至少一次訊息。用對方的事件 ID 當去重鍵，收到就先寫進資料庫、回 200，再交給背景工作處理，不要在 webhook 的請求裡做完所有事。</li>
<li><b>遊戲</b>：一局猜高低結束後，結算點數是關鍵路徑，要在交易裡做完；更新成就、寫分析事件、推播通知，就可以用寄件匣發布事件，讓各自的消費者慢慢處理。玩家不會因為成就晚 2 秒出現而等待。</li>
<li><b>Docker 與 Kubernetes</b>：消費者要能被安全地關掉：收到 SIGTERM 後停止拿新訊息、把手上的做完或放回去，再結束。否則每次部署都會製造一批重複或逾時。Pod 的 <code>terminationGracePeriodSeconds</code> 要比單則訊息的處理時間長。</li>
</ul>

<h3>十三、面試會怎麼問</h3>
<p>這些是後端、系統設計和 SRE 面試的常見題。先自己講一遍，再打開參考答案。</p>
<ol>
<li>「至少一次、最多一次、剛好一次差在哪裡？為什麼常說剛好一次做不到？」</li>
<li>「消費者處理一則訊息要 2 分鐘，SQS 的可見性逾時是 30 秒，會發生什麼事？怎麼修？」</li>
<li>「怎麼保證同一張訂單的事件照順序處理？代價是什麼？」</li>
<li>「更新資料庫和發布事件，怎麼保證不會一個成功、一個失敗？」</li>
<li>「Kafka 和 SQS（或 RabbitMQ）差在哪裡？什麼情況選哪一個？」</li>
<li>「你會怎麼監控一個佇列系統？警報設在什麼指標上？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>差在 ack 和處理的先後。先 ack 再處理，當機時訊息遺失，是最多一次；先處理再 ack，當機時訊息重送，是至少一次。剛好一次的「傳遞」在不可靠的網路上做不到，因為送出 ack 的一方無法確定對方收到了，佇列也分不出消費者是死了還是慢。實務上追求的是效果上剛好一次：至少一次傳遞加上冪等處理，例如在同一個資料庫交易裡寫去重表和業務資料，或用外部 API 的冪等鍵。Kafka 的 exactly-once 只涵蓋 Kafka 內部的讀、處理、寫。</li>
<li>30 秒後訊息重新出現，另一個消費者拿到，同一件工作被做兩次以上；舊收據的刪除可能不生效；收到次數一直增加，最後可能被送進 DLQ。修法：可見性逾時設成處理時間 p99 的好幾倍，或在處理中定期呼叫 <code>ChangeMessageVisibility</code> 延長（心跳）；處理本身做成冪等；把長工作拆小。</li>
<li>用訂單 ID 當分區鍵或 FIFO 的訊息群組 ID，同一張訂單進同一個分區，由同一個消費者依序處理。代價是排頭阻塞（一則卡住，整個分區等）、平行度受限於分區數，以及改分區數時順序會暫時被打亂。更強韌的做法是在事件裡帶版本號，消費者用條件更新只接受更新的版本，讓順序變得不重要。</li>
<li>寄件匣模式：在同一個資料庫交易裡更新業務資料並寫入 outbox 表，再由轉發程式輪詢 outbox，或用 CDC（例如 Debezium 讀 WAL 或 binlog）把事件送到佇列。這把雙寫問題變成單一交易加上可重試的搬運；搬運是至少一次，所以消費者仍要冪等。要注意輪詢時不要用遞增 id 當游標以免漏掉晚提交的列，以及 CDC 的複寫槽會讓主庫保留 WAL。</li>
<li>Kafka 是分區日誌，訊息讀了不刪、可以重播，多個系統用各自的消費者群組讀同一份資料，吞吐量很大，順序在分區內保證，但確認是以 offset 為單位，毒訊息會擋住分區，而且要維運叢集（或用代管服務）。SQS 是全代管的工作佇列，逐則確認、自動擴展、幾乎不用維運，但不能重播、標準佇列不保證順序。RabbitMQ 有彈性的路由、優先順序，適合複雜的工作分派。大量事件、多個下游、要重播選 Kafka；單純的背景工作、不想維運選 SQS。</li>
<li>最重要的是最舊訊息的年齡，依每種工作的承諾設門檻，例如超過 5 分鐘持續 10 分鐘就警報。再來是積壓量與它的趨勢、處理中的數量、處理速度與錯誤率、重試次數，以及 DLQ 深度大於 0。Kafka 要逐分區看落後，單一分區落後代表毒訊息或熱鍵。警報設在時間上而不是數量上，並且依積壓量自動擴展消費者，但上限要考慮下游的承受力。</li>
</ol>
</details>

<h3>十四、練功題（做得出來才算真的懂）</h3>
<ol>
<li>每秒進來 1,200 則訊息，每則處理 250 毫秒，每個工人行程可以同時處理 4 則。至少要幾個工人？你實際會開幾個？</li>
<li>寄信服務商掛了 2 小時，這段時間每秒進來 50 封信，全部積在佇列裡。恢復後你的工人每秒能寄 200 封，新信照樣每秒進來 50 封，要多久才清完？清完之前，最晚的那封信大約晚了多久寄出？</li>
<li>一個 Kafka 主題有 6 個分區。同一個群組開 8 個消費者，有幾個在閒著？開 3 個，每個負責幾個分區？其中 1 個當機之後呢？</li>
<li>「每日登入獎勵：發 50 點」這則訊息可能被重送。設計去重鍵，寫出能擋住重複的 SQL。</li>
<li>重試策略：第一次等 1 秒，之後每次加倍，最多重試 6 次後送進 DLQ（先不考慮抖動）。列出每次的等待時間，以及一則註定失敗的訊息從第一次失敗到進 DLQ 大約要多久。</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>利特爾法則：1,200 × 0.25 = 300 則同時在處理，每個工人 4 則，至少 75 個工人，而且是 100% 滿載。實際上要留餘裕，例如讓使用率在七成左右，大約開 100 到 110 個，並確認下游資料庫撐得住每秒 1,200 次寫入。</li>
<li>積壓：50 × 7,200 = 36 萬封。淨消化速度 200 − 50 = 150 封／秒，36 萬 ÷ 150 = 2,400 秒，40 分鐘。最晚的那封，是服務商剛掛掉時進來的第一封，大約晚了 2 小時 40 分鐘。這說明了為什麼故障恢復後要暫時加開工人，以及最舊訊息的年齡為什麼是最重要的指標。</li>
<li>8 個消費者時，6 個各拿 1 個分區，2 個閒著。3 個時，每個負責 2 個分區。1 個當機後，觸發重新分配，剩下 2 個各負責 3 個分區，被接手的分區從最後提交的 offset 開始，所以會重做一小段。</li>
<li>去重鍵用「使用者 ID＋日期」，例如 <code>daily:42:2026-11-09</code>，而不是訊息 ID，因為上游可能重複產生兩則不同 ID 的同一份獎勵。<code>INSERT INTO reward_claims (user_id, day) VALUES ($1, $2) ON CONFLICT DO NOTHING</code>，表上有 <code>(user_id, day)</code> 的唯一約束；插入成功（<code>rowCount = 1</code>）才在同一個交易裡加 50 點。</li>
<li>等待時間是 1、2、4、8、16、32 秒，加起來 63 秒，再加上每次處理本身的時間，大約一分多鐘後進 DLQ。實務上要加上隨機抖動，並設等待上限（例如 5 分鐘），避免大量訊息同步重試。</li>
</ol>
</details>

<h3>十五、想再挖深</h3>
<ul>
<li><b>Apache Kafka 官方文件</b>（<a href="https://kafka.apache.org/documentation/">kafka.apache.org/documentation</a>）：Design 一章講日誌、分區、複製和傳遞語意，是理解 Kafka 最好的起點。</li>
<li><b>Amazon SQS Developer Guide</b>（AWS 官方文件）：可見性逾時、死信佇列、FIFO 佇列的每一個細節，包括本章提到的收據與保留期限規則。</li>
<li><b>RabbitMQ 官方文件</b>（<a href="https://www.rabbitmq.com/docs">rabbitmq.com/docs</a>）：「Consumer Acknowledgements and Publisher Confirms」這篇，把確認機制和它的取捨講得非常清楚。</li>
<li><b>Jay Kreps〈The Log: What every software engineer should know about real-time data's unifying abstraction〉</b>（2013 年 LinkedIn 工程部落格）：Kafka 作者解釋為什麼「日誌」是資料系統的核心概念。</li>
<li><b>Martin Kleppmann《Designing Data-Intensive Applications》</b>：第一版第 11 章 Stream Processing，把訊息系統、日誌、變更資料擷取和事件溯源串成一條線。</li>
</ul>
` });
