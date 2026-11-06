M({
  id: 'cap', n: 8,
  title: 'Designing for ten million users',
  zh: '總整理：一千萬使用者的架構怎麼算、怎麼長、怎麼壞、怎麼設計',
  time: '2 weeks',
  blurb: 'Everything so far, put together: do the sums, grow in stages, know what breaks first, and design a complete system out loud.',
  lessons: [
  {
    id: 'cap-math', lv: 3, mins: 11,
    title: 'Do the sums first',
    zh: '「一千萬使用者」是行銷數字。工程要先換算成：每天活躍人數、尖峰同時在線、尖峰每秒請求數、每天新增多少資料。算出來通常只是幾十台機器，難的是資料庫與不能有單點故障。',
    body: `
<p>&ldquo;Ten million users&rdquo; is a marketing number. Engineers need different numbers before they can decide anything: how many people are active on a normal day, how many are online at the busiest moment, how many requests arrive per second at that moment, and how fast the data grows.</p>
<div class="widget" data-w="capacity"></div>
<h3>Reading the result</h3>
<p>With the typical ratios filled in above, ten million registered users become about 1.5 million active per day, about 1,700 requests per second on average and about 5,200 at peak. That needs around 15 ordinary app servers. Around 150,000 people are connected at the same moment, which needs around a dozen realtime gateways.</p>
<p>These are modest numbers. Ten million registered users is a system of tens of servers. So the difficulty is not raw volume. It lies in five other places:</p>
<ol>
<li><b>The database's write path.</b> App servers multiply easily. The place where all writes meet does not.</li>
<li><b>No single point of failure.</b> At this size, something is always broken somewhere.</li>
<li><b>Releasing without downtime</b>, several times a day.</li>
<li><b>Knowing what is happening</b> across dozens of machines.</li>
<li><b>Abuse.</b> A large product attracts attacks, fraud and bots.</li>
</ol>
<h3>Storage grows quietly</h3>
<p>With the defaults above: 1.5 million active users writing 20 rows a day is 30 million rows a day, about 6 GB, or roughly 2 TB a year. Within a year the history table has ten billion rows. That is why partitioning and archiving (lesson 3.6) must be planned early.</p>
<h3>Going deeper: estimating in an interview</h3>
<p>Interviewers want to see the method. Say your assumptions aloud, round boldly, and keep these in your head:</p>
<table>
<tr><th>Fact</th><th>Use</th></tr>
<tr><td>A day has 86,400 seconds, roughly 100,000</td><td>1 million requests a day is about 12 per second</td></tr>
<tr><td>Peak is 2 to 5 times the average</td><td>Size for the peak</td></tr>
<tr><td>1 million rows of 1 KB is 1 GB</td><td>Storage estimates</td></tr>
<tr><td>One ordinary server handles hundreds to a few thousand simple requests per second</td><td>Server counts</td></tr>
<tr><td>One server can hold tens of thousands of idle connections</td><td>Gateway counts</td></tr>
</table>
<h3>Going deeper: design for the next step</h3>
<p>Build for 3 to 10 times your present load. Building for 1,000 times wastes a year on problems you do not have, and by the time you grow that much you will understand the system far better and will rebuild it anyway. Every number here is a guess until a load test (lesson 4.4) replaces it with a measurement.</p>`,
    own: `Fill in the calculator with your own platform's real numbers as they are today. Then enter the numbers for the size you hope to reach in one year. Which output changes most? That output points at the part of your system to look at first.`,
    terms: [['daily active users', '每日活躍使用者'], ['peak', '尖峰'], ['concurrent users', '同時在線人數'], ['requests per second', '每秒請求數'], ['estimate', '估算'], ['write path', '寫入路徑']],
    quiz: [
      { q: "A product has 2 million daily active users, each making 50 requests a day. What is the average number of requests per second?",
        a: ["About 12", "About 1,200", "About 120,000", "About 100 million"], c: 1,
        why: "100 million requests divided by 86,400 seconds is about 1,160." },
      { q: "At ten million registered users, what is usually the hardest part?",
        a: ["Buying enough web servers", "The database's write path, and removing single points of failure", "Choosing a programming language", "Designing the logo"], c: 1,
        why: "Stateless servers multiply cheaply. State and resilience are where the real work is." }
    ]
  },
  {
    id: 'cap-stages', lv: 3, mins: 12,
    title: 'Growing in stages',
    zh: '沒有人第一天就蓋千萬人架構。系統是一階一階長大的：每一階都是被某個具體的痛逼出來的，也都會帶來一個新問題。知道下一階是什麼、什麼訊號出現才該動。',
    body: `
<p>Nobody builds the ten-million-user design on the first day. It would take a year, and the guesses would be wrong. Real systems grow in stages. Each stage is forced by a specific pain, and each brings a specific new problem with it.</p>
<p>Move the slider through the six stages:</p>
<div class="widget" data-w="stages"></div>
<h3>What to take from this</h3>
<ul>
<li><b>Every stage is the correct design for its size.</b> One machine is a good design for a product with a thousand users.</li>
<li><b>Moving early costs you.</b> Each stage adds parts to run, pay for and debug. Most products fail from lack of users. Very few fail from lack of sharding.</li>
<li><b>Moving late costs more.</b> The skill is recognising the signal: the measurement that tells you the present stage is close to its limit.</li>
<li><b>The order hardly varies.</b> Separate the state. Then duplicate what has no state. Then protect the database with caches and replicas. Then do work in the background. Then split the data.</li>
</ul>
<h3>Going deeper: the signals</h3>
<table>
<tr><th>You see</th><th>It is time to</th></tr>
<tr><td>App and database competing for memory on one machine</td><td>Move the database out (stage 2)</td></tr>
<tr><td>A single failure or a deploy takes everything down</td><td>Add a load balancer and a second app server (stage 3)</td></tr>
<tr><td>Database CPU high, and most queries are reads</td><td>Cache, then read replicas (stage 4)</td></tr>
<tr><td>Bandwidth bills, or slow loads for distant users</td><td>A CDN (stage 4)</td></tr>
<tr><td>Requests slow because they do slow work inline</td><td>A queue and workers (stage 5)</td></tr>
<tr><td>The primary database is at its write limit after everything else</td><td>Split by function, then shard (stage 6)</td></tr>
</table>
<h3>Going deeper: what must be right from the start</h3>
<p>Some decisions are cheap on day one and very expensive to change later:</p>
<ul>
<li><b>Keep the app stateless.</b> Sessions and files go in shared stores from the beginning.</li>
<li><b>Make money operations atomic and idempotent.</b></li>
<li><b>Take backups and test them.</b></li>
<li><b>Put secrets in a secrets store.</b></li>
<li><b>Build once and deploy through a script</b>, even a simple one.</li>
</ul>
<p>Everything else can wait for the stage that needs it.</p>`,
    own: `Find the stage you are at today. For most small products, it is stage 1. Read the row &ldquo;the new problem you own&rdquo; for the next stage, and the list &ldquo;what must be right from the start&rdquo;. Which of those five are already true for your platform? The ones that are not are worth doing now, at any size.`,
    terms: [['scaling', '擴展'], ['stateless', '無狀態'], ['read replica', '讀取副本'], ['autoscaling', '自動擴展'], ['multi-region', '多區域']],
    quiz: [
      { q: "What must be true before a second app server can be added behind a load balancer?",
        a: ["The servers must be in different countries", "The app must keep no user state in its own memory or on its own disk", "The database must be sharded", "A CDN must be in place"], c: 1,
        why: "Otherwise a user whose next request lands on the other server loses their session." },
      { q: "When is it time to add read replicas?",
        a: ["On day one", "When reads are saturating the primary database and caching is not enough", "When the disk is full", "When a certificate expires"], c: 1,
        why: "Each stage answers a measured pain. Adding it earlier only adds lag and cost." },
      { q: "Which of these should be right from the very first version?",
        a: ["Sharding", "Multi-region deployment", "Atomic, idempotent handling of money", "A service mesh"], c: 2,
        why: "It is cheap to do at the start and very painful to retrofit after real money has gone missing." }
    ]
  },
  {
    id: 'cap-breaks', lv: 3, mins: 12,
    title: 'What breaks first',
    zh: '系統長大時會出的事其實就那十幾種：磁碟滿、連線數爆、少索引、快取擊穿、重連風暴、重試風暴、憑證過期、上版出包……每一種都有固定的徵兆與解法。',
    body: `
<p>Systems fail in a small number of well-known ways. If you can recognise each from its symptom, you will diagnose most incidents within minutes.</p>
<table>
<tr><th>Failure</th><th>Symptom</th><th>Defence</th><th>Lesson</th></tr>
<tr><td>Disk full</td><td>Writes fail, the database stops, odd errors everywhere</td><td>Log rotation, cleanup, an alert at 80%</td><td>1.9</td></tr>
<tr><td>Connections exhausted</td><td>&ldquo;Too many connections&rdquo;. Slow apps with a quiet database.</td><td>A pooler, small pools, timeouts</td><td>3.3</td></tr>
<tr><td>Missing index</td><td>One endpoint is slow, database CPU at 100%</td><td>EXPLAIN, add the index</td><td>3.1</td></tr>
<tr><td>Cache stampede or cold cache</td><td>The database collapses just after a cache restart or expiry</td><td>Locks, varied expiry, warming</td><td>3.5</td></tr>
<tr><td>Reconnect storm</td><td>After a deploy, every client reconnects at once and the server falls over again</td><td>Random growing delays in clients, draining</td><td>1.6</td></tr>
<tr><td>Retry storm</td><td>A slow dependency is hammered by retries and never recovers</td><td>Backoff, retry limits, circuit breakers</td><td>below</td></tr>
<tr><td>Memory leak</td><td>Memory rises steadily, then a restart, again and again</td><td>Limits, soak tests</td><td>4.4</td></tr>
<tr><td>Single point of failure</td><td>One machine, zone, provider or person takes everything down</td><td>Redundancy</td><td>4.5</td></tr>
<tr><td>Certificate or domain expiry</td><td>Total outage on a calendar date</td><td>Automation and an alert</td><td>1.5</td></tr>
<tr><td>Bad release</td><td>Errors jump right after a deploy</td><td>Canary, fast rollback</td><td>2.6</td></tr>
<tr><td>Hot key or hot shard</td><td>One piece of data overloads one server</td><td>Local caching, splitting</td><td>3.6</td></tr>
<tr><td>Unbounded queue</td><td>Work arrives faster than it is done, and delay grows without end</td><td>Alert on message age, shed load</td><td>3.7</td></tr>
<tr><td>Burst credits exhausted</td><td>A small cloud machine becomes slow at peak, with high steal time</td><td>A larger or non-burstable size</td><td>4.6</td></tr>
<tr><td>Abuse and floods</td><td>A wave of junk traffic</td><td>CDN, WAF, rate limits</td><td>5.6</td></tr>
</table>
<h3>Why small problems become outages</h3>
<p>Most large outages are <b>cascades</b>. One component slows down. Its callers wait, which fills their own queues and pools, so their callers slow down too. Clients time out and retry, which adds load to the component that was already struggling. A minor fault becomes a complete failure.</p>
<h3>Patterns that stop cascades</h3>
<ul>
<li><b>Timeouts on every call.</b> A call with no timeout can wait for ever and hold resources the whole time.</li>
<li><b>Retries with backoff and jitter</b>, a limit on attempts, and only for operations that are idempotent.</li>
<li><b>Circuit breaker.</b> After repeated failures, stop calling the broken dependency for a while and fail at once. This gives it room to recover.</li>
<li><b>Bulkheads.</b> Separate pools of connections and threads for each dependency, so that one slow dependency cannot use them all.</li>
<li><b>Graceful degradation.</b> When a non-essential part is down, serve the page without it.</li>
<li><b>Load shedding.</b> Above capacity, refuse some requests quickly to keep the others fast.</li>
</ul>
<h3>Going deeper: the first question in any incident</h3>
<p>&ldquo;What changed?&rdquo; A deploy, a configuration edit, a certificate, a traffic pattern, a dependency's behaviour. Most incidents start with a change, and the fastest route to the cause is the list of recent ones. This is another reason every change should leave a record.</p>`,
    own: `Go down the table and tick each failure you have personally experienced. For each one you ticked, check whether its defence is in place now. For each one you did not tick, ask what would warn you before it happened.`,
    terms: [['cascade', '連鎖故障'], ['retry storm', '重試風暴'], ['circuit breaker', '斷路器'], ['bulkhead', '艙壁隔離'], ['timeout', '逾時'], ['graceful degradation', '優雅降級']],
    quiz: [
      { q: "Response times are climbing while the database's CPU stays low. Which failure is most likely?",
        a: ["A missing index", "The application's connection pool is exhausted", "The disk is full", "A certificate expired"], c: 1,
        why: "A missing index would make the database busy. A quiet database means requests are waiting before they reach it." },
      { q: "A dependency becomes slow, and every client retries immediately without limit. What happens?",
        a: ["The dependency recovers sooner", "The extra load keeps the dependency down: a retry storm", "Nothing changes", "The clients use less memory"], c: 1,
        why: "Retries multiply traffic at the worst moment. Backoff, limits and circuit breakers prevent it." },
      { q: "What does a circuit breaker do?",
        a: ["Cuts the power to a server", "Stops calling a failing dependency for a while and fails fast", "Encrypts traffic", "Restarts the database"], c: 1,
        why: "It protects the caller from waiting and gives the dependency a chance to recover." }
    ]
  },
  {
    id: 'cap-design', lv: 4, mins: 15,
    title: 'Design exercise: a realtime wagering platform',
    zh: '完整設計一個千萬人的即時對戰下注平台。照面試的八個步驟走：釐清需求、估算、資料與介面、畫架構、深入最難的部分、想故障、想資安、決定先做什麼。先自己想 30 分鐘再看參考答案。',
    body: `
<p>This is the format of a system design interview, and it is also how real designs are made. Work through it on paper for thirty minutes before opening the reference answer.</p>
<h3>The brief</h3>
<div class="note">Design a platform on which players wager against each other in realtime games. Ten million registered users. Deposits and withdrawals happen on a blockchain. Every bet must settle exactly once. Target 99.9% availability, and the service must survive the loss of one datacenter. Staff need a back office.</div>
<h3>The eight steps</h3>
<ol>
<li><b>Clarify.</b> What must it do, and what matters most? Here: no money is ever lost or duplicated; play feels instant; the service stays up.</li>
<li><b>Estimate.</b> Use lesson 8.1: active users, connections, requests and writes per second, storage per year.</li>
<li><b>Data and interfaces.</b> The main records (accounts, ledger entries, matches, bets) and the main operations (deposit, join, bet, settle, withdraw).</li>
<li><b>Draw the high-level design.</b> Boxes and arrows, following the request's path.</li>
<li><b>Go deep on the hardest part.</b> Here it is the ledger and settlement.</li>
<li><b>Failure.</b> For each box: what happens when it dies?</li>
<li><b>Security.</b> What would an attacker go for, and what stands in the way?</li>
<li><b>What to build first.</b></li>
</ol>
<p>Speak your reasoning aloud at each step, and name the trade-offs. An interviewer is grading the reasoning far more than the final picture.</p>
<details class="reveal"><summary>Reference answer: the design</summary>
<div class="tiers">
<b>Edge</b><div><span class="box">DNS</span><span class="box">CDN + WAF<small>game client files, flood protection, rate limits</small></span><span class="box">Load balancer</span></div>
<b>Realtime</b><div><span class="box">WebSocket gateways<small>about 20,000 connections each, autoscaled</small></span><span class="box">Room servers<small>one room lives on one server</small></span></div>
<b>Services</b><div><span class="box">Lobby and account API<small>stateless</small></span><span class="box hot">Ledger service<small>the only writer of balances</small></span><span class="box">Back office<small>behind single sign-on</small></span></div>
<b>Data</b><div><span class="box hot">Ledger database<small>PostgreSQL, synchronous standby in a second zone</small></span><span class="box">Read replica<small>history, reports</small></span><span class="box">Redis<small>sessions, room directory, rate limits, leaderboards</small></span></div>
<b>Background</b><div><span class="box">Queue</span><span class="box">Settlement workers</span><span class="box">Deposit watcher</span><span class="box hot">Signer<small>isolated, with limits</small></span></div>
</div>
<ul>
<li><b>Gateways</b> hold the connections, check the session, and pass messages between players and room servers. A directory in Redis records which gateway each player is on.</li>
<li><b>Room servers</b> are stateful: a match runs in the memory of one server. A directory maps each room to its server, and gateways route by room ID. The server decides every outcome. Fairness uses commit and reveal.</li>
<li><b>The ledger service</b> is the single place where balances change. Other services ask it and never touch the tables.</li>
</ul>
</details>
<details class="reveal"><summary>Reference answer: the ledger and settlement</summary>
<ul>
<li>The ledger is <b>append-only and double-entry</b>. Every movement is a pair of rows that sum to zero. A balance is a sum over rows, with a cached total updated in the same transaction.</li>
<li>Every operation carries an <b>idempotency key</b> under a unique constraint: the bet ID, the match ID, the blockchain transaction hash. A repeated request finds the key and does nothing.</li>
<li>Placing a bet <b>reserves</b> funds with one atomic conditional update. Settlement releases the reservation and writes the result in one transaction.</li>
<li>When a match ends, the room server writes the result and an <b>outbox</b> row together. A worker reads the outbox and calls the ledger. If the worker crashes and repeats the call, the idempotency key makes it harmless.</li>
<li><b>Deposits:</b> a watcher waits for enough confirmations, then credits through the ledger, keyed by transaction hash.</li>
<li><b>Withdrawals:</b> risk checks, then a request to the signer, which enforces limits per transaction and per day. The hot wallet holds about one day of withdrawals.</li>
<li>The ledger chooses <b>consistency over availability</b>. If the primary cannot confirm a write with its standby, it refuses the write. A small tie-breaker in a third zone decides which of the two may act as primary, so they never both do.</li>
<li>A background job continually checks that <b>all entries sum to zero</b> and that on-chain balances match the books. Any difference pages someone.</li>
<li>History is <b>partitioned by month</b>. Sharding by user is kept in reserve for when one primary can no longer take the writes.</li>
</ul>
</details>
<details class="reveal"><summary>Reference answer: failure, security and build order</summary>
<table>
<tr><th>If this dies</th><th>Then</th></tr>
<tr><td>A gateway</td><td>Its players reconnect to another, with random delays. The match continues, because it lives on the room server.</td></tr>
<tr><td>A room server</td><td>Its matches are lost from memory. Each is restored from its last saved round or cancelled and refunded by a published rule. The outbox guarantees that finished rounds still settle.</td></tr>
<tr><td>The ledger primary</td><td>The synchronous standby is promoted in about a minute with no committed data lost. Bets are refused during that minute.</td></tr>
<tr><td>Redis</td><td>Sessions and directories are rebuilt. Nothing about money was stored there.</td></tr>
<tr><td>A whole zone</td><td>Everything runs in two zones, with the tie-breaker in a third. Capacity is sized so that one zone can carry the peak.</td></tr>
<tr><td>The blockchain node provider</td><td>Deposits and withdrawals queue up. Play continues.</td></tr>
</table>
<ul>
<li><b>Security.</b> The signing key exists only in the signer. The back office sits behind single sign-on with a second factor and records every action. Secrets come from a secrets manager. Network tiers are separated. The client is never trusted. There is a switch that pauses all withdrawals.</li>
<li><b>Observability.</b> SLOs on connection success, bet acceptance time and settlement delay. Alerts on queue age, on ledger imbalance and on unusual withdrawals.</li>
<li><b>Disaster recovery.</b> Point-in-time recovery for the ledger, with a copy in another region and account. A data-loss target near zero for money and a recovery-time target under fifteen minutes.</li>
<li><b>Build order.</b> First the ledger's correctness and its backups. Then the isolated signer. Then monitoring. Then the load balancer and stateless tier. Everything else is added when measurements call for it.</li>
</ul>
</details>
<h3>How to practise</h3>
<p>Repeat this exercise with other briefs until the eight steps are automatic: a chat application, a URL shortener, a video site, a ride-hailing service. Do it aloud and in English, with a timer set to forty minutes.</p>`,
    own: `Do the exercise on paper, then compare with the reference answer. Mark every place where your real platform differs from it. Each difference is one of two things: a sensible simplification for your present size, or a gap. Decide which, and write one sentence of reasoning for each. That document is your architecture write-up, and it is the best thing to bring to an interview.`,
    terms: [['system design', '系統設計'], ['trade-off', '取捨'], ['double-entry ledger', '複式帳本'], ['reservation', '預先保留'], ['reconciliation', '對帳'], ['gateway', '閘道']],
    quiz: [
      { q: "In this design, which component needs the strongest consistency?",
        a: ["The lobby list", "The leaderboard", "The ledger", "The chat"], c: 2,
        why: "Money must never be lost or duplicated. The others can be briefly out of date." },
      { q: "Why are room servers harder to scale than the lobby API?",
        a: ["They use more disk", "They hold state in memory, so traffic must be routed to the right server and there must be a plan for when it dies", "They need a different language", "They cannot use TLS"], c: 1,
        why: "Stateless servers are interchangeable. Stateful ones need routing and recovery." },
      { q: "A settlement worker crashes after calling the ledger and then repeats the call on restart. What prevents a double payout?",
        a: ["A faster worker", "The idempotency key under a unique constraint", "A larger queue", "The CDN"], c: 1,
        why: "The second call finds the key already recorded and changes nothing." }
    ]
  }
  ]
});
