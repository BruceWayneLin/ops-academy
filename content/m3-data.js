M({
  id: 'data', n: 3,
  title: 'Data and scale',
  zh: '資料庫與擴展：索引、交易、複寫、快取、分片、佇列',
  time: '6 to 8 weeks',
  blurb: 'The database is where systems break first. How it works, how it fails, and the order in which to scale it.',
  lessons: [
  {
    id: 'db-index', lv: 2, mins: 14,
    title: 'What a database is, and how indexes work',
    zh: '資料庫負責把資料安全存好、快速找到。沒有索引就得整張表掃一遍；索引像書後面的索引頁，但每多一個索引，寫入就多一份工。',
    body: `
<p>A <b>database</b> is a program whose job is to keep data safe and find it quickly, while many users read and write at once. A <b>relational</b> database (PostgreSQL, MySQL) keeps data in tables of rows and columns, and you ask questions in a language called SQL.</p>
<h3>Why a query is fast or slow</h3>
<p>Without help, finding the rows you want means reading every row in the table. That is a <b>full scan</b>. On a thousand rows nobody notices. On a hundred million rows it takes seconds, and the site goes down.</p>
<p>An <b>index</b> is a sorted lookup structure kept beside the table, like the index at the back of a book. The usual kind is a B-tree, which finds a row among a hundred million in about four steps.</p>
<pre><code>EXPLAIN ANALYZE
SELECT * FROM bets WHERE user_id = 42 ORDER BY created_at DESC LIMIT 20;
--  Seq Scan on bets ...            Execution Time: 80 ms

CREATE INDEX bets_user_time ON bets (user_id, created_at DESC);
--  Index Scan using bets_user_time Execution Time: 0.1 ms</code></pre>
<p><code>EXPLAIN ANALYZE</code> runs the query and shows how the database did it. Look for &ldquo;Seq Scan&rdquo; on a large table. That is the sign of a missing index.</p>
<h3>What indexes cost</h3>
<p>Every insert and update must also update every index on the table, and each index takes disk and memory. Index what you search by, and nothing more.</p>
<h3>Going deeper: the left-prefix rule</h3>
<p>An index on <code>(user_id, created_at)</code> is sorted by user first, then by time within each user, like a phone book sorted by family name and then given name. It helps a search by <code>user_id</code>, and a search by <code>user_id</code> and <code>created_at</code> together. It does not help a search by <code>created_at</code> alone, just as a phone book does not help you find everyone named &ldquo;Wei&rdquo;.</p>
<h3>Going deeper: the usual killers</h3>
<ul>
<li><b>N+1 queries.</b> One query fetches a list of 50 items, then the code runs one more query per item. Fetch them together with a JOIN or one <code>IN (...)</code> query.</li>
<li><b>A function on the column.</b> <code>WHERE lower(email) = ...</code> cannot use an ordinary index on <code>email</code>.</li>
<li><b>Deep pagination.</b> <code>OFFSET 100000</code> reads and throws away 100,000 rows. Use <code>WHERE id &gt; last_seen_id LIMIT 50</code>.</li>
<li><b>SELECT *</b> drags large columns across the network that the code never uses.</li>
</ul>
<h3>Going deeper: finding the slow ones</h3>
<p>Turn on slow-query logging, or the <code>pg_stat_statements</code> extension in PostgreSQL. Rank queries by <b>total</b> time (calls multiplied by average time). A 5 ms query that runs a million times an hour costs more than a 2 second query that runs twice.</p>`,
    tryNote: 'On your Mac with colima running. The image is about 100 MB, so check free disk first. Keep the container for the next two lessons.',
    try: [
      ['docker run -d --name pg -e POSTGRES_PASSWORD=pw postgres:16-alpine && sleep 4 && docker exec -it pg psql -U postgres', 'Start PostgreSQL and open its prompt. Paste the next lines there.'],
      ["CREATE TABLE bets AS SELECT g AS id, (random()*100000)::int AS user_id, now() - random()*interval '90 days' AS created_at, (random()*1000)::int AS amount FROM generate_series(1,1000000) g;", 'One million rows of made-up bets.'],
      ['EXPLAIN ANALYZE SELECT * FROM bets WHERE user_id = 42 ORDER BY created_at DESC LIMIT 20;', 'Note the scan type and the execution time on the last line.'],
      ['CREATE INDEX bets_user_time ON bets (user_id, created_at DESC);', 'Add the index.'],
      ['EXPLAIN ANALYZE SELECT * FROM bets WHERE user_id = 42 ORDER BY created_at DESC LIMIT 20;', 'Run it again. It should be hundreds of times faster. Type \\q to leave.']
    ],
    own: `On a development copy of your platform's database, switch on slow-query logging at 200 ms and play for ten minutes. Take the three queries with the largest total time and run EXPLAIN ANALYZE on each. Write down what you found and what you changed. That note is portfolio material.`,
    terms: [['database', '資料庫'], ['index', '索引'], ['full scan', '全表掃描'], ['query planner', '查詢規劃器'], ['composite index', '複合索引'], ['pagination', '分頁']],
    quiz: [
      { q: "A table has an index on (user_id, created_at). Which query cannot make good use of it?",
        a: ["WHERE user_id = 7", "WHERE user_id = 7 AND created_at &gt; '2026-01-01'", "WHERE created_at &gt; '2026-01-01'", "WHERE user_id = 7 ORDER BY created_at"], c: 2,
        why: "The index is sorted by user first. Without a user to start from, the time order inside it is no help." },
      { q: "What is the cost of adding more indexes to a table?",
        a: ["Reads become slower", "Every write must update every index, and they take disk and memory", "The table can hold fewer rows", "Backups stop working"], c: 1,
        why: "Indexes speed up reads and slow down writes." },
      { q: "A page lists 50 orders and then runs one query per order to fetch the customer. What is this called, and what is the fix?",
        a: ["A deadlock: add retries", "N+1 queries: fetch the customers in one query", "Sharding: add servers", "A full scan: add memory"], c: 1,
        why: "51 round trips become 2. This is one of the most common causes of slow pages." }
    ]
  },
  {
    id: 'db-tx', lv: 3, mins: 14,
    title: 'Transactions and isolation',
    zh: '交易＝一組動作要嘛全做、要嘛全不做。兩個請求同時讀餘額再各自寫回，錢就會憑空消失（lost update）；要用原子更新或鎖來擋。',
    body: `
<p>A <b>transaction</b> groups several changes so that either all of them happen or none do. Moving 30 from one account to another is two changes. If the server dies between them, a transaction guarantees you are not left with money that has vanished or been created.</p>
<h3>ACID in plain words</h3>
<table>
<tr><th>Letter</th><th>Promise</th></tr>
<tr><td><b>A</b>tomic</td><td>All or nothing</td></tr>
<tr><td><b>C</b>onsistent</td><td>The rules you declared (constraints) hold before and after</td></tr>
<tr><td><b>I</b>solated</td><td>Transactions running at the same time do not see each other's half-finished work</td></tr>
<tr><td><b>D</b>urable</td><td>Once committed, it survives a crash</td></tr>
</table>
<h3>The bug every money system must prevent</h3>
<p>Two requests arrive together. Both read a balance of 100. Each subtracts 30 and writes 70. Sixty was spent, and the balance fell by only 30. This is a <b>lost update</b>, and the code looks perfectly correct when read one request at a time.</p>
<p>Three ways to prevent it:</p>
<ol>
<li><b>Do it in one statement.</b> The database applies it as a unit, and the condition stops overdrafts:
<pre><code>UPDATE accounts SET balance = balance - 30
WHERE id = 1 AND balance &gt;= 30;   -- then check that 1 row changed</code></pre></li>
<li><b>Lock the row first.</b> <code>SELECT ... FOR UPDATE</code> makes the second request wait until the first commits.</li>
<li><b>Check a version number.</b> Read the row with its version. Write back with <code>WHERE version = 7</code>. If no row changed, someone else got there first, so read again and retry.</li>
</ol>
<h3>Going deeper: isolation levels</h3>
<table>
<tr><th>Level</th><th>What you get</th><th>Default in</th></tr>
<tr><td>Read committed</td><td>You see only committed data. Two reads inside one transaction may differ.</td><td>PostgreSQL</td></tr>
<tr><td>Repeatable read</td><td>The whole transaction sees one snapshot.</td><td>MySQL</td></tr>
<tr><td>Serializable</td><td>The result is as if transactions ran one after another. The database may cancel one, and your code must retry it.</td><td></td></tr>
</table>
<h3>Going deeper: deadlocks and long transactions</h3>
<ul>
<li><b>Deadlock.</b> A holds row 1 and wants row 2. B holds row 2 and wants row 1. The database cancels one of them. Always lock rows in the same order, and retry when cancelled.</li>
<li><b>Keep transactions short.</b> Never hold one open while calling something slow, such as a payment provider or a blockchain node. It holds locks and a connection the whole time.</li>
</ul>
<h3>Going deeper: rules for money</h3>
<ul>
<li>Keep an <b>append-only ledger</b>. Every change of balance is a new row that is never edited. The balance is the sum, and you can always audit it.</li>
<li>Give every operation an <b>idempotency key</b> with a unique constraint, so that a retried request cannot pay twice.</li>
<li>Add <b>constraints</b> such as <code>CHECK (balance &gt;= 0)</code>. They are the last line of defence when the code is wrong.</li>
</ul>`,
    tryNote: 'In the PostgreSQL container from the last lesson. Open two terminals, each with: docker exec -it pg psql -U postgres',
    try: [
      ['CREATE TABLE acct (id int PRIMARY KEY, balance int CHECK (balance >= 0)); INSERT INTO acct VALUES (1, 100);', 'Window 1: one account with 100.'],
      ['BEGIN; SELECT * FROM acct WHERE id = 1 FOR UPDATE;', 'Window 1: start a transaction and lock the row.'],
      ['UPDATE acct SET balance = balance - 30 WHERE id = 1 AND balance >= 30;', 'Window 2: this hangs. It is waiting for the lock.'],
      ['COMMIT;', 'Window 1: release the lock. Window 2 completes at once.'],
      ['UPDATE acct SET balance = balance - 500 WHERE id = 1;', 'Either window: refused by the constraint. The last line of defence works.']
    ],
    own: `Find a place in your own code where a balance, a stock count or any other number is read and then changed. Is it one atomic operation, or a read followed by a write? What happens if exactly the same request arrives twice, one millisecond apart? If you are not sure, that is the experiment to run on a development copy.`,
    terms: [['transaction', '交易'], ['commit', '提交'], ['rollback', '回復'], ['lost update', '更新遺失'], ['lock', '鎖'], ['isolation level', '隔離層級'], ['deadlock', '死結'], ['idempotency key', '冪等鍵'], ['ledger', '帳本']],
    quiz: [
      { q: "Two requests each read a balance of 100, subtract 30, and write 70. How do you prevent this?",
        a: ["Add an index", "Use a single UPDATE with the subtraction and a condition, or lock the row first", "Use a faster server", "Cache the balance"], c: 1,
        why: "The read and the write must happen as one unit, or the second request must wait for the first." },
      { q: "Under serializable isolation the database cancels your transaction with a serialization failure. What should the code do?",
        a: ["Show an error to the user", "Run the whole transaction again", "Lower the isolation level for good", "Restart the database"], c: 1,
        why: "This is how serializable works: it cancels one side of a conflict and expects a retry." },
      { q: "Why should a transaction not stay open during a call to an external payment service?",
        a: ["External services reject it", "It holds locks and a database connection for as long as the slow call takes", "It costs more", "The network cannot carry it"], c: 1,
        why: "Long transactions block other work and use up connections. Record the intent, commit, call out, then record the result." }
    ]
  },
  {
    id: 'db-pool', lv: 3, mins: 10,
    title: 'Connections and pooling',
    zh: '資料庫連線很貴而且有上限（PostgreSQL 預設 100）。應用程式機器越加越多，連線總數反而撐爆資料庫——這是成長時最先遇到的當機。解法是連線池。',
    body: `
<p>This is the outage that reaches almost every growing system first, and it arrives exactly when you add servers to handle more load.</p>
<h3>Why connections are scarce</h3>
<p>Each connection to PostgreSQL is a whole process on the database server, using several megabytes of memory. The default maximum is 100. MySQL uses a thread per connection, with a default maximum of 151.</p>
<h3>The sum that goes wrong</h3>
<p>Each app server keeps a <b>pool</b> of open connections ready to reuse, perhaps 20. With 4 app servers that is 80, and all is well. Traffic grows, you scale to 10 app servers, and now they want 200. The database refuses the extra ones with &ldquo;too many connections&rdquo;, and the new servers you added to help start to fail.</p>
<h3>More connections do not mean more speed</h3>
<p>A database with 8 cores can run about 8 queries at any instant. A few hundred active connections only fight each other for those cores. The best total is small, usually a few dozen.</p>
<h3>The fix: a pooler in the middle</h3>
<div class="flow"><span class="box">App servers<small>thousands of connections</small></span><span class="arr">&rarr;</span><span class="box hot">Pooler<small>PgBouncer, RDS Proxy</small></span><span class="arr">&rarr;</span><span class="box">Database<small>a few dozen real connections</small></span></div>
<p>The pooler lends a real connection to a client only for the length of one transaction, then takes it back for the next client.</p>
<h3>Going deeper: reading the symptoms</h3>
<ul>
<li><b>Latency climbs while the database's CPU stays low.</b> Requests are waiting for a free connection in the app's pool. The database itself is fine. This symptom is very often misread as &ldquo;the database is slow&rdquo;.</li>
<li><b>Everything hangs slowly over hours.</b> A code path takes a connection and never gives it back. The pool drains. Always release in a <code>finally</code> block.</li>
</ul>
<h3>Going deeper: timeouts everywhere</h3>
<p>Set a time limit on connecting, on each statement, and on transactions left idle. One stuck query should give up its connection after seconds, and must never be allowed to hold it for ever. A good starting point for the total number of real connections is about twice the database's core count. Then measure.</p>`,
    tryNote: 'In the PostgreSQL container.',
    try: [
      ['SHOW max_connections;', 'The ceiling.'],
      ['SELECT state, count(*) FROM pg_stat_activity GROUP BY state;', 'How many connections exist now, and what they are doing.']
    ],
    own: `For every service that talks to your database, multiply (number of copies running) by (its pool size). Add them up and compare with <code>max_connections</code>. How close to the ceiling are you, and what happens when you double the number of app servers? When finished with this lesson, remove the practice container: <code>docker rm -f pg</code>.`,
    terms: [['connection pool', '連線池'], ['pooler', '連線池代理'], ['max connections', '最大連線數'], ['connection leak', '連線洩漏']],
    quiz: [
      { q: "You scale from 5 app servers to 20 and the database starts refusing connections. Why?",
        a: ["The database disk is full", "Each server opens its own pool, and together they exceed the database's connection limit", "The load balancer is misconfigured", "DNS has not updated"], c: 1,
        why: "Pool size times number of servers must stay under the limit. A pooler removes the link between the two." },
      { q: "Response times are rising and the database server's CPU is at 15%. What is the likely cause?",
        a: ["The database needs more cores", "Requests are queuing for a free connection in the application's pool", "The CDN is down", "An index is missing"], c: 1,
        why: "A missing index would make the database busy. A quiet database with slow apps points to waiting, usually for connections." }
    ]
  },
  {
    id: 'db-repl', lv: 3, mins: 13,
    title: 'Replication, failover and backups',
    zh: '複寫：主庫收寫入、同步給副本。副本可以接手（容錯移轉）也可以分擔讀取，但會慢一點點。副本不是備份——誤刪也會同步過去。',
    body: `
<p>One database server is a single point of failure and a ceiling on capacity. <b>Replication</b> addresses both. One server, the <b>primary</b>, takes all writes. It sends a stream of its changes to one or more <b>replicas</b>, which apply them and stay nearly identical.</p>
<div class="flow"><span class="box">App</span><span class="arr">writes &rarr;</span><span class="box hot">Primary</span><span class="arr">stream of changes &rarr;</span><span class="box">Replica A<small>standby</small></span><span class="box">Replica B<small>serves reads</small></span></div>
<h3>What replicas are for</h3>
<ul>
<li><b>Failover.</b> When the primary dies, a replica is promoted to take its place.</li>
<li><b>Read scaling.</b> Read-only queries can go to replicas.</li>
<li><b>Safe heavy work.</b> Reports and backups run on a replica without loading the primary.</li>
</ul>
<h3>The price: lag</h3>
<table>
<tr><th>Mode</th><th>How</th><th>Trade-off</th></tr>
<tr><td>Asynchronous (the default)</td><td>The primary does not wait for replicas</td><td>Fast. Replicas are a little behind, and a failover can lose the last moments of writes.</td></tr>
<tr><td>Synchronous</td><td>The primary waits for a replica to confirm</td><td>Nothing is lost. Every write is slower, and writes stall if the replica is down.</td></tr>
</table>
<p><b>Replication lag</b> produces a classic bug. A user saves their profile (a write, to the primary). The page reloads (a read, from a replica that has not caught up) and shows the old data. The cure is <b>read-your-writes</b>: for a few seconds after a user writes, send that user's reads to the primary. For anything involving money, always read from the primary.</p>
<h3>Failover</h3>
<p>Something must notice that the primary is dead, promote a replica, and point the applications at it. Managed databases do this in about one to two minutes. Doing it yourself is hard, because of <b>split brain</b>: two servers each believing they are the primary and accepting different writes. This is a strong reason to pay for a managed database.</p>
<h3>Replicas are not backups</h3>
<div class="warn">If someone runs <code>DROP TABLE</code> or a bad deploy corrupts data, the mistake reaches every replica within milliseconds. Replication protects you from hardware failure. Only backups protect you from mistakes and attacks.</div>
<h3>Going deeper: what a real backup looks like</h3>
<ul>
<li><b>Regular snapshots plus a continuous archive of the change log.</b> Together they allow <b>point-in-time recovery</b>: restore the database as it was at 14:32:05, a moment before the bad deploy.</li>
<li><b>A copy somewhere else:</b> another account or region, out of reach of an attacker who gets into the main one.</li>
<li><b>Tested restores.</b> A backup that has never been restored is a hope. Restore on a schedule and time it.</li>
</ul>`,
    own: `For each place your data lives (databases, Redis, and any files your services write to disk), answer three questions. When was the last backup? Where is it kept? Have you ever restored one? A timed copy to object storage in another account counts as a backup. A snapshot kept on the same machine does not.`,
    terms: [['replication', '複寫'], ['primary', '主庫'], ['replica', '副本'], ['replication lag', '複寫延遲'], ['failover', '容錯移轉'], ['split brain', '腦裂'], ['backup', '備份'], ['point-in-time recovery', '時間點還原']],
    quiz: [
      { q: "Why is a replica not a backup?",
        a: ["Replicas are slower", "Mistakes and deletions are copied to it within milliseconds", "Replicas cannot be read", "Replicas use a different format"], c: 1,
        why: "A replica faithfully repeats everything, including the error you want to undo." },
      { q: "With asynchronous replication, what can be lost when the primary fails?",
        a: ["Nothing", "The most recent writes that had not yet reached a replica", "All data older than a day", "Only the indexes"], c: 1,
        why: "The primary confirmed those writes to clients before any replica had them." },
      { q: "A user updates their name and the next page still shows the old one. The system uses read replicas. What is happening?",
        a: ["The browser is broken", "The read went to a replica that has not yet received the change", "The write failed", "The index is corrupt"], c: 1,
        why: "This is replication lag. Read that user's data from the primary for a short time after they write." }
    ]
  },
  {
    id: 'db-cache', lv: 2, mins: 12,
    title: 'Caching',
    zh: '快取＝把答案先存起來，下次不用重算。難的是「什麼時候作廢」。熱門的鍵同時過期，一千個請求會同時打進資料庫（stampede），要用鎖和隨機過期時間擋。',
    body: `
<p>A <b>cache</b> keeps the answer to a question so that the work is not repeated. Reading from memory is about a thousand times faster than doing a database query, so a cache is often the cheapest large improvement available.</p>
<h3>Caches exist at every layer</h3>
<div class="flow"><span class="box">Browser</span><span class="arr">&rarr;</span><span class="box">CDN</span><span class="arr">&rarr;</span><span class="box">App's own memory</span><span class="arr">&rarr;</span><span class="box hot">Redis</span><span class="arr">&rarr;</span><span class="box">Database</span></div>
<p><b>Redis</b> is the usual shared cache: a server that keeps keys and values in memory and handles on the order of a hundred thousand simple operations per second.</p>
<h3>The standard pattern: cache-aside</h3>
<ul>
<li><b>To read:</b> look in the cache. If the key is missing, read the database, store the result with an expiry time (a TTL), and return it.</li>
<li><b>To write:</b> update the database, then delete the cache key. The next read refills it.</li>
</ul>
<h3>The hard part</h3>
<p>A cached value is a copy, and copies go stale. For each kind of data, decide how stale is acceptable. A leaderboard ten seconds old is fine. A balance used to approve a withdrawal must never come from a cache.</p>
<h3>Going deeper: how caches cause outages</h3>
<table>
<tr><th>Failure</th><th>What happens</th><th>Defence</th></tr>
<tr><td><b>Stampede</b></td><td>A popular key expires. A thousand requests miss at once and all run the same expensive query.</td><td>Let one request rebuild while the others wait or use the old value. Add random variation to expiry times.</td></tr>
<tr><td><b>Cold start</b></td><td>The cache restarts empty and the database takes the full load.</td><td>Warm it before sending traffic. Make sure the database can survive a while without it.</td></tr>
<tr><td><b>Hot key</b></td><td>One key receives a huge share of traffic.</td><td>A small extra cache inside each app server.</td></tr>
<tr><td><b>Memory full</b></td><td>Redis refuses writes or evicts the wrong things.</td><td>Set a memory limit and an eviction policy.</td></tr>
<tr><td><b>One slow command</b></td><td>Redis runs commands one at a time. <code>KEYS *</code> on a large store blocks everyone.</td><td>Never run it in production. Use <code>SCAN</code>.</td></tr>
</table>
<h3>Going deeper: cache or state?</h3>
<p>Redis often ends up holding things that are not copies of anything: sessions, queues, locks, game rooms. If Redis is the only place a value exists, it is <b>state</b>, and it needs persistence, replication and backups like a database. Know which keys are which.</p>
<p>Measure the <b>hit rate</b>. A cache that misses most of the time adds cost and complexity for nothing.</p>`,
    tryNote: 'On your Mac with colima running. The image is about 15 MB.',
    try: [
      ['docker run -d --name r redis:7-alpine && docker exec -it r redis-cli', 'Start Redis and open its prompt. Type the next lines there.'],
      ['SET greeting hello EX 10', 'Store a value that expires in 10 seconds.'],
      ['TTL greeting', 'Seconds left. Repeat it and watch the number fall. After it reaches -2, GET greeting returns nothing.'],
      ['INFO stats', 'Find keyspace_hits and keyspace_misses: the hit rate. Type exit, then run: docker rm -f r']
    ],
    own: `List what your application keeps in Redis or any other cache: sessions, state of work in progress, leaderboards, anything else. Mark each group of keys as &ldquo;cache, safe to lose&rdquo; or &ldquo;state, losing it hurts&rdquo;. For the second group, check whether persistence is switched on and whether it is included in your backups.`,
    terms: [['cache', '快取'], ['cache hit', '快取命中'], ['cache miss', '快取未命中'], ['invalidation', '快取失效'], ['stampede', '快取擊穿'], ['eviction', '淘汰'], ['hit rate', '命中率']],
    quiz: [
      { q: "A popular cache key expires and the database is flooded with identical queries. What is this, and what is the defence?",
        a: ["A deadlock: add an index", "A stampede: let one request rebuild the value, and vary expiry times", "Replication lag: read from the primary", "A leak: restart Redis"], c: 1,
        why: "Many requests miss together. The lock keeps the rebuild to one request. Random expiry times stop many keys from expiring together." },
      { q: "In the cache-aside pattern, what does the code do when data changes?",
        a: ["Update the cache and skip the database", "Update the database, then delete the cache key", "Delete the database row", "Nothing, the cache updates itself"], c: 1,
        why: "The database is the truth. Deleting the key forces the next read to fetch the new value." }
    ]
  },
  {
    id: 'db-shard', lv: 4, mins: 13,
    title: 'Partitioning and sharding',
    zh: '擴展有順序：先修查詢、換大機器、加快取、加讀取副本、按功能拆庫，最後才是分片。分片很貴：跨片查詢與交易都變困難，別為了面子去做。',
    body: `
<p>When a database cannot keep up, there is a ladder of fixes. Climb it in order. Each step costs several times more than the one before, in money and in complexity.</p>
<table>
<tr><th>Step</th><th>Fix</th><th>Cost</th></tr>
<tr><td>1</td><td>Fix slow queries and add indexes</td><td>Hours</td></tr>
<tr><td>2</td><td>A bigger machine</td><td>Money only. Goes much further than people expect.</td></tr>
<tr><td>3</td><td>Cache</td><td>Stale data to manage</td></tr>
<tr><td>4</td><td>Read replicas</td><td>Lag to manage</td></tr>
<tr><td>5</td><td>Split by function: users in one database, game history in another, the ledger in a third</td><td>No joins across them</td></tr>
<tr><td>6</td><td>Partition large tables inside one database</td><td>Moderate</td></tr>
<tr><td>7</td><td><b>Shard</b>: spread one table's rows across many database servers</td><td>Very high</td></tr>
</table>
<h3>Partitioning</h3>
<p>One table is stored as several pieces inside the same server, usually by time: one piece per month. Queries for recent data touch only recent pieces, and old data is removed by dropping a whole piece, which is instant. Applications mostly do not notice.</p>
<h3>Sharding</h3>
<p>Rows are divided among separate servers by a <b>shard key</b>. Users 1 to 1,000,000 on server A, the next million on server B, or more commonly by a hash of the user ID.</p>
<h3>What sharding costs</h3>
<ul>
<li><b>No joins or transactions across shards</b>, or only slow and complicated ones.</li>
<li><b>Every query must include the shard key</b> so that it can be routed.</li>
<li><b>Rebalancing.</b> When a shard fills, data must be moved while the system is live.</li>
<li><b>Hot shards.</b> One very active customer can overload their shard.</li>
<li><b>Operations multiply.</b> Twenty shards mean twenty backups, twenty failovers, and every schema change twenty times.</li>
</ul>
<h3>Choosing the shard key</h3>
<p>It should have many distinct values, spread load evenly, and appear in almost every query. For consumer products this is nearly always the user ID. Keep all of one user's data on the same shard, so that everyday operations stay inside one shard. Things that span all users, such as a global leaderboard or the uniqueness of usernames, need a separate design.</p>
<h3>Going deeper: how the mapping is done</h3>
<ul>
<li><b>Hash modulo N</b> is simple. Changing N moves almost every row.</li>
<li><b>Consistent hashing</b> moves only a small share of rows when a server is added.</li>
<li><b>A directory</b> (a lookup table from key to shard) is the most flexible, and it becomes a critical service itself.</li>
</ul>
<p>Tools that do this for you: Vitess for MySQL, Citus for PostgreSQL, and distributed SQL databases such as CockroachDB, TiDB and Spanner, which shard automatically at the price of some latency.</p>
<div class="note"><b>A reality check.</b> One well-tuned PostgreSQL server on good hardware handles thousands of transactions per second. Many products with ten million registered users run on one primary and a few replicas. Shard when measurements say you must.</div>`,
    own: `Write down your largest table and how fast it grows per day. At that rate, when does it reach 100 million rows? Would partitioning by month let you drop or archive old data? For most history tables the answer is yes, and that single step usually postpones sharding by years.`,
    terms: [['partitioning', '分割表'], ['sharding', '分片'], ['shard key', '分片鍵'], ['vertical scaling', '垂直擴展'], ['horizontal scaling', '水平擴展'], ['consistent hashing', '一致性雜湊'], ['rebalancing', '重新平衡']],
    quiz: [
      { q: "The database is struggling. What is the first thing to do?",
        a: ["Shard it", "Find the slow queries and check their indexes", "Move to another database product", "Add ten read replicas"], c: 1,
        why: "The cheapest step comes first, and it is often enough." },
      { q: "Which is usually the best shard key for a consumer product?",
        a: ["The creation date", "The user ID", "The country", "A random number chosen per query"], c: 1,
        why: "It has many values, spreads evenly, appears in nearly every query, and keeps each user's data together." },
      { q: "What is the main advantage of partitioning a history table by month?",
        a: ["It encrypts the data", "Queries touch only the relevant months, and old months can be dropped instantly", "It removes the need for backups", "It makes writes atomic"], c: 1,
        why: "Dropping a partition is a quick file operation. Deleting the same rows one by one is slow and heavy." }
    ]
  },
  {
    id: 'queues', lv: 3, mins: 13,
    title: 'Queues and background work',
    zh: '不是每件事都要在請求裡做完：先把工作丟進佇列就回應，背景工人慢慢做。佇列幾乎都是「至少送一次」，所以同一則訊息可能來兩次，處理要做到冪等。',
    body: `
<p>Not everything has to happen while the user waits. A request can do the minimum (check the input, record the intent), put a message on a <b>queue</b>, and reply. Separate programs called <b>workers</b> take messages off the queue and do the slow part: send the email, settle on chain, build the replay.</p>
<div class="flow"><span class="box">Request</span><span class="arr">&rarr;</span><span class="box">App<small>replies at once</small></span><span class="arr">message &rarr;</span><span class="box hot">Queue</span><span class="arr">&rarr;</span><span class="box">Worker</span><span class="box">Worker</span></div>
<h3>What you gain</h3>
<ul>
<li><b>Fast responses.</b> The user does not wait for slow work.</li>
<li><b>Spikes are absorbed.</b> During a burst the queue grows, and the servers stay up. The work is done a little later.</li>
<li><b>Failures are contained.</b> If the email provider is down, messages wait and nothing is lost.</li>
<li><b>Independent scaling.</b> Add workers without touching the web servers.</li>
</ul>
<h3>The rule that matters most</h3>
<p>Nearly all queues promise <b>at-least-once</b> delivery. A worker can finish a job and crash before confirming it, and the queue will hand the same message to another worker. So every message may arrive twice.</p>
<p>The handler must therefore be <b>idempotent</b>: doing it twice has the same effect as doing it once. Two ways:</p>
<ul>
<li>Give each operation a unique ID. Before acting, record the ID in a table with a unique constraint. If it is already there, skip.</li>
<li>Write operations that are naturally safe to repeat. &ldquo;Set status to paid&rdquo; is safe. &ldquo;Add 10 to the balance&rdquo; is not.</li>
</ul>
<h3>Going deeper: operating a queue</h3>
<ul>
<li><b>Poison messages.</b> A message that always fails is retried with growing delays, and after a set number of attempts moved to a <b>dead-letter queue</b> for a person to inspect.</li>
<li><b>The best single alert</b> is the age of the oldest message. If it keeps rising, workers are not keeping up.</li>
<li><b>Backpressure.</b> If messages arrive faster than they can ever be processed, the queue grows without limit. Something must give: add workers, slow the producers, or drop low-value work.</li>
<li><b>Order</b> is usually not guaranteed. Design so that it does not matter, or use a system that keeps order per key.</li>
</ul>
<h3>Going deeper: two families</h3>
<table>
<tr><th></th><th>Task queue</th><th>Log (stream)</th></tr>
<tr><td>Examples</td><td>SQS, RabbitMQ, BullMQ</td><td>Kafka, Kinesis, Redpanda</td></tr>
<tr><td>A message is</td><td>Taken by one worker, then gone</td><td>Kept for days, and read by many independent consumers</td></tr>
<tr><td>Replay old messages?</td><td>No</td><td>Yes</td></tr>
<tr><td>Best for</td><td>Jobs to be done</td><td>Events that several systems care about, at high volume</td></tr>
</table>
<h3>Going deeper: the outbox pattern</h3>
<p>&ldquo;Update the database and publish a message&rdquo; are two actions, and a crash between them leaves them out of step. The fix: write the message into an <b>outbox table</b> inside the same database transaction as the change. A small relay process reads the outbox and publishes. Either both happen or neither does.</p>`,
    own: `Find a background job of yours that reacts to outside events: a payment webhook, an email sender, a job that watches for incoming transfers. It is a queue consumer in all but name. If it restarts and sees the same event a second time, what stops the action from happening twice? Find the unique key that prevents it, or add one. The event's own ID is the natural choice.`,
    terms: [['queue', '佇列'], ['worker', '背景工作者'], ['at-least-once delivery', '至少一次傳遞'], ['idempotent', '冪等'], ['dead-letter queue', '死信佇列'], ['backpressure', '背壓'], ['outbox pattern', '寄件匣模式']],
    quiz: [
      { q: "A queue guarantees at-least-once delivery. What must every handler be?",
        a: ["Fast", "Idempotent, so that processing a message twice does no harm", "Written in the same language as the producer", "Single-threaded"], c: 1,
        why: "Duplicates will happen. The handler has to make them harmless." },
      { q: "Which single metric best tells you that workers are falling behind?",
        a: ["CPU of the web servers", "The age of the oldest message in the queue", "The number of DNS queries", "Disk space on the database"], c: 1,
        why: "If the oldest message keeps getting older, work is arriving faster than it is being done." },
      { q: "Which operation is safe to repeat?",
        a: ["Add 10 to the balance", "Send the welcome email", "Set the order's status to paid", "Append a row to the history"], c: 2,
        why: "Setting a value to a fixed state gives the same result however many times it runs." }
    ]
  },
  {
    id: 'cdn', lv: 2, mins: 10,
    title: 'CDNs and the edge',
    zh: 'CDN 在世界各地放快取節點，使用者連到最近的那個。靜態檔用「檔名帶雜湊＋快取一年」，index.html 設成每次都檢查，這樣上版不用清快取。',
    body: `
<p>A <b>CDN</b> (content delivery network) is a set of caching servers in hundreds of cities. A user connects to the nearest one, called the <b>edge</b>. If the edge has the file, it answers at once. If not, it fetches the file from your server (the <b>origin</b>), keeps a copy, and answers.</p>
<h3>What you get</h3>
<ul>
<li><b>Speed.</b> Files come from 10 ms away, not 150 ms. The TLS handshake also happens nearby.</li>
<li><b>Less load on you.</b> For a site heavy with images or game assets, most bytes never reach your server.</li>
<li><b>Protection.</b> A large network absorbs traffic floods that would flatten a single server.</li>
</ul>
<h3>How it decides what to keep</h3>
<p>The edge follows the <code>Cache-Control</code> header that your server sends, and identifies a file by its URL (the <b>cache key</b>).</p>
<h3>The pattern for front-end builds</h3>
<table>
<tr><th>File</th><th>Header</th><th>Why</th></tr>
<tr><td>Files with a content hash in the name: <code>app.3f9a1c.js</code>, <code>atlas.81bd.png</code></td><td><code>public, max-age=31536000, immutable</code></td><td>The name changes whenever the content does, so the file can be kept for a year.</td></tr>
<tr><td><code>index.html</code>, <code>version.json</code></td><td><code>no-cache</code></td><td>Always checked, so users pick up a new version at once.</td></tr>
</table>
<p>A release uploads the new hashed files, then replaces <code>index.html</code>. Users with the old page keep working, because the old files are still there. No purge is needed.</p>
<h3>Going deeper: what goes wrong</h3>
<ul>
<li><b>Caching a personal response.</b> If a page containing one user's data is cached, the next user receives it. Never cache responses that depend on a cookie or login unless you have designed for it.</li>
<li><b>Attackers skipping the CDN.</b> If your origin's address is known and open, they bypass every protection. The origin should accept traffic only from the CDN.</li>
<li><b>Purging</b> is slow and easy to get wrong. Names with hashes avoid it.</li>
<li><b>WebSockets</b> pass through a CDN and are not cached.</li>
</ul>
<h3>Going deeper: code at the edge</h3>
<p>CDNs can now run small functions at the edge (Cloudflare Workers, Lambda@Edge): redirects, header changes, login checks and A/B tests happen near the user, and the request may never reach your servers.</p>`,
    tryNote: 'Run on your Mac. Replace the address with one of your own asset files.',
    try: [
      ['curl -sI https://www.cloudflare.com/ | grep -i -E "cache-control|age|cf-cache-status|x-cache|via"', 'Headers showing whether an answer came from a cache.'],
      ['curl -sI https://YOUR_SITE/path/to/an/asset.png | grep -i -E "cache-control|age|x-cache|content-length"', 'How one of your own files is cached today.']
    ],
    own: `Pick the largest static file your site serves: an image, a script bundle, a game asset. Check its response headers. Is it served through a CDN? Does its name contain a hash, with a one-year max-age? If the header says no-cache, every visit downloads those bytes from your origin again.`,
    terms: [['CDN', '內容傳遞網路'], ['edge', '邊緣節點'], ['origin', '源站'], ['cache key', '快取鍵'], ['purge', '清除快取'], ['content hash', '內容雜湊']],
    quiz: [
      { q: "What is the right caching for app.3f9a1c.js and for index.html?",
        a: ["Both no-cache", "The hashed file for a year, index.html checked every time", "Both for a year", "The hashed file never, index.html for a year"], c: 1,
        why: "The hashed name changes with the content, so it is safe to keep. The entry page must always be fresh to point at the new names." },
      { q: "What is the most dangerous CDN mistake?",
        a: ["Caching images for too long", "Caching a response that contains one user's private data", "Using more than one edge location", "Serving files over HTTPS"], c: 1,
        why: "The next visitor receives someone else's data. This has caused real breaches." }
    ]
  },
  {
    id: 'dist-sys', lv: 4, mins: 15,
    title: 'Distributed systems: what the theory says',
    zh: '多台機器合作的三個事實：網路會斷、機器會掛、時鐘不準。CAP：斷線時只能選「一致」或「可用」。「剛好一次」做不到，實務是「至少一次＋冪等」。',
    body: `
<p>Once a system runs on more than one machine, three facts shape everything: the network loses and delays messages, machines fail, and no two clocks agree. Worse, a machine that is slow looks exactly like one that is dead. Every timeout is a guess.</p>
<h3>CAP, said correctly</h3>
<p>When the network splits a system into two halves that cannot talk (a <b>partition</b>), each half must choose:</p>
<ul>
<li><b>Consistency:</b> refuse some requests, so that nobody is ever given wrong or outdated data.</li>
<li><b>Availability:</b> answer everything, accepting that the two halves may disagree for a while.</li>
</ul>
<p>You cannot have both during a partition. A ledger chooses consistency: it is better to reject a withdrawal than to approve it twice. A lobby list or a &ldquo;likes&rdquo; counter chooses availability. Different parts of one product choose differently.</p>
<h3>Levels of consistency</h3>
<table>
<tr><th>Level</th><th>Promise</th></tr>
<tr><td>Strong (linearizable)</td><td>Everyone sees the latest write, as if there were a single copy.</td></tr>
<tr><td>Read-your-writes</td><td>You see your own changes at once. Others may see them later.</td></tr>
<tr><td>Eventual</td><td>If writes stop, all copies will agree after some time.</td></tr>
</table>
<h3>Consensus: agreeing despite failures</h3>
<p>Algorithms such as <b>Raft</b> let a group of machines agree on a sequence of changes as long as a <b>majority</b> is alive and connected. Three machines survive one failure. Five survive two. The minority side of a split cannot gather a majority, so it stops, which is what prevents split brain. This is also why such clusters use odd numbers. etcd in Kubernetes, and the coordination layers of Kafka and distributed SQL databases, are built on consensus.</p>
<h3>Clocks</h3>
<p>Machine clocks drift and are sometimes adjusted backwards. Never decide which of two events on different machines came first by comparing their timestamps. Use a sequence issued in one place, or version numbers.</p>
<h3>&ldquo;Exactly once&rdquo;</h3>
<p>Exactly-once <em>delivery</em> is impossible: a sender that gets no reply cannot tell whether its message or the reply was lost. What you build is exactly-once <em>effect</em>: deliver at least once, and make the receiver idempotent. When a product advertises &ldquo;exactly once&rdquo;, this is what it means.</p>
<h3>Changes that span services</h3>
<ul>
<li><b>Two-phase commit:</b> a coordinator asks everyone to prepare, then tells everyone to commit. Correct, slow, and stuck if the coordinator dies at the wrong moment.</li>
<li><b>Saga:</b> a chain of local transactions, each with a compensating action that undoes it. Reserve the funds, place the bet, confirm; and if a step fails, release the reservation. This is the usual choice for flows involving money across services.</li>
</ul>
<h3>Locks and leases</h3>
<p>A lock held across machines must expire (a <b>lease</b>), or a crashed holder blocks everyone for ever. But a paused process can wake after its lease has expired and still believe it holds the lock. The protection is a <b>fencing token</b>: each grant of the lock carries a rising number, and the protected resource rejects any request bearing an older number.</p>
<h3>The habits this produces</h3>
<p>Put a timeout on every call. Retry with backoff, and only operations that are idempotent. Expect duplicates and reordering. Decide, for each piece of data, which side of CAP it is on. Assume any component can vanish at any time.</p>`,
    own: `Go through your platform's data and label each kind &ldquo;must be consistent&rdquo; or &ldquo;may be briefly stale&rdquo;: balances, orders in progress, results, leaderboards, listings, chat. Then check that the code agrees with your labels. Anything in the first group that is read from a cache or a replica is a bug waiting for traffic.`,
    terms: [['distributed system', '分散式系統'], ['partition', '網路分區'], ['consistency', '一致性'], ['availability', '可用性'], ['consensus', '共識'], ['quorum', '法定數量'], ['eventual consistency', '最終一致性'], ['saga', 'Saga（補償式交易）'], ['lease', '租約']],
    quiz: [
      { q: "How many failed machines can a 5-member consensus cluster survive?",
        a: ["1", "2", "3", "4"], c: 1,
        why: "It needs a majority, 3 of 5, to keep working. Losing 2 still leaves 3." },
      { q: "How is an exactly-once effect achieved in practice?",
        a: ["With a faster network", "At-least-once delivery combined with idempotent processing", "By sending each message only once and hoping", "With synchronised clocks"], c: 1,
        why: "Duplicates cannot be prevented, so they are made harmless." },
      { q: "During a network partition, what should a ledger service do?",
        a: ["Keep answering on both sides to stay available", "Refuse writes on the side without a majority, to stay consistent", "Delete recent data", "Switch to eventual consistency"], c: 1,
        why: "For money, a refused request is far cheaper than a double spend." }
    ]
  }
  ]
});
