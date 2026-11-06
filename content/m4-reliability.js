M({
  id: 'rel', n: 4,
  title: 'Reliability and observability',
  zh: '可靠性：監控、SLO、事故處理、負載測試、災難復原',
  time: '3 to 4 weeks',
  blurb: 'How to see what a system is doing, decide how reliable it must be, and behave well when it breaks.',
  lessons: [
  {
    id: 'obs-signals', lv: 2, mins: 13,
    title: 'Seeing your system: metrics, logs, traces',
    zh: '看不到就修不了。三種訊號：指標（數字）、日誌（事件）、追蹤（一個請求走過哪些服務）。每個服務先看四件事：延遲、流量、錯誤、飽和度。平均值會騙人，要看百分位。',
    body: `
<p><b>Observability</b> means being able to tell what a system is doing from the outside. Without it you learn about problems from users, and you fix them by guessing.</p>
<h3>Three kinds of signal</h3>
<table>
<tr><th>Signal</th><th>What it is</th><th>Answers</th><th>Tools</th></tr>
<tr><td><b>Metrics</b></td><td>Numbers sampled over time</td><td>Is something wrong, and how badly?</td><td>Prometheus, CloudWatch</td></tr>
<tr><td><b>Logs</b></td><td>A record of individual events</td><td>What exactly happened?</td><td>Loki, Elasticsearch, CloudWatch Logs</td></tr>
<tr><td><b>Traces</b></td><td>One request followed across every service, with timings</td><td>Where did the time go?</td><td>Jaeger, Tempo</td></tr>
</table>
<h3>The four golden signals</h3>
<p>For any service, watch these four first:</p>
<ul>
<li><b>Latency:</b> how long requests take.</li>
<li><b>Traffic:</b> how many requests arrive.</li>
<li><b>Errors:</b> how many fail.</li>
<li><b>Saturation:</b> how full it is: CPU, memory, disk, connection pool, queue.</li>
</ul>
<h3>Averages lie</h3>
<p>If 99 requests take 50 ms and one takes 5 seconds, the average is about 100 ms and looks fine. One user in a hundred is suffering. Use <b>percentiles</b>. p50 is the typical request. p99 is the experience of the unluckiest 1%. A page that makes many requests will hit that slow 1% most of the time.</p>
<h3>Going deeper: Prometheus</h3>
<p>Prometheus is the standard open-source metrics system. Every few seconds (15 is a common setting) it fetches a text page of numbers from each service (it <b>scrapes</b> <code>/metrics</code>) and stores them as time series. Each series has a name and <b>labels</b>:</p>
<pre><code>http_requests_total{service="api", status="500"}  1027</code></pre>
<p>Its query language answers questions such as:</p>
<pre><code># errors per second over the last 5 minutes
rate(http_requests_total{status=~"5.."}[5m])

# 99th percentile latency
histogram_quantile(0.99, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))</code></pre>
<div class="warn"><b>Do not put unbounded values in labels.</b> A label holding a user ID or a full URL creates one time series per value. Millions of series will bring Prometheus down. This is called a cardinality explosion.</div>
<h3>Going deeper: logs worth having</h3>
<ul>
<li><b>Structured</b> (JSON), so that they can be searched by field.</li>
<li>A <b>request ID</b> on every line, passed between services, so one request can be followed.</li>
<li><b>No passwords, tokens or personal data.</b> Logs are read by many people and kept a long time.</li>
<li><b>Shipped off the machine.</b> When a server dies, its local logs die with it, exactly when you need them.</li>
</ul>
<p><b>OpenTelemetry</b> is the vendor-neutral standard for producing all three signals from your code.</p>`,
    tryNote: 'On your Mac with colima running. A small image. It shows the metrics of the colima virtual machine.',
    try: [
      ['docker run -d --name ne -p 127.0.0.1:9100:9100 prom/node-exporter', 'A small program that publishes machine metrics.'],
      ['curl -s localhost:9100/metrics | grep -E "^node_(load1|memory_MemAvailable_bytes|filesystem_avail_bytes)" | head -6', 'The raw text Prometheus would collect: load, free memory, free disk.'],
      ['docker rm -f ne', 'Clean up.']
    ],
    own: `Set up the smallest useful monitoring for your servers at no cost: node-exporter, Prometheus and Grafana as three containers on one of them (check its free memory first), or Grafana Cloud's free tier. Create four alerts: disk above 80%, available memory below 10%, the site returning anything other than 200 when checked from outside, and a certificate with under 14 days left. A screenshot of that dashboard goes in your portfolio.`,
    terms: [['observability', '可觀測性'], ['metric', '指標'], ['log', '日誌'], ['trace', '追蹤'], ['percentile', '百分位數'], ['saturation', '飽和度'], ['cardinality', '基數'], ['dashboard', '儀表板']],
    quiz: [
      { q: "Why look at the 99th percentile of latency and not the average?",
        a: ["It is easier to compute", "The average hides a small group of very slow requests that real users are experiencing", "The average is always higher", "Percentiles use less storage"], c: 1,
        why: "A few very slow requests barely move the average, and they are the ones that drive users away." },
      { q: "Which label would be dangerous to add to a Prometheus metric?",
        a: ["status_code", "http_method", "region", "user_id"], c: 3,
        why: "It has unlimited distinct values. Each one creates a separate time series." }
    ]
  },
  {
    id: 'slo', lv: 3, mins: 11,
    title: 'SLOs and error budgets',
    zh: '100% 可用是錯的目標。先定 SLO（例如 99.9%），剩下的 0.1% 就是「錯誤預算」：還有預算就放心上版，花光了就停下來修穩定度。',
    body: `
<p>Aiming for 100% availability is a mistake. It cannot be reached, each extra &ldquo;nine&rdquo; costs about ten times more than the last, and a user on mobile data cannot tell 99.99% from 100% anyway. The useful question is how reliable the service needs to be, written down as a number.</p>
<h3>Three terms</h3>
<table>
<tr><th>Term</th><th>Meaning</th><th>Example</th></tr>
<tr><td><b>SLI</b> (indicator)</td><td>What you measure</td><td>The share of requests that succeed in under 300 ms</td></tr>
<tr><td><b>SLO</b> (objective)</td><td>Your target for it</td><td>99.9% over 30 days</td></tr>
<tr><td><b>SLA</b> (agreement)</td><td>A contract with a customer, with penalties</td><td>99.5%, or a refund</td></tr>
</table>
<p>The SLA is always looser than the SLO, so that you notice trouble before you owe money.</p>
<div class="widget" data-w="slo"></div>
<h3>The error budget</h3>
<p>An SLO of 99.9% means 0.1% of requests are allowed to fail. That allowance is the <b>error budget</b>, about 43 minutes a month, and it is there to be spent on releases, experiments and maintenance.</p>
<ul>
<li><b>Budget left:</b> release faster and take risks.</li>
<li><b>Budget gone:</b> stop adding features and work on reliability until it recovers.</li>
</ul>
<p>This replaces the old quarrel between &ldquo;ship faster&rdquo; and &ldquo;keep it stable&rdquo; with a number both sides agreed in advance.</p>
<h3>Choosing good indicators</h3>
<ul>
<li>Measure what the <b>user</b> experiences: from the load balancer's logs, or from probes that act like a user from outside. CPU usage is not an SLI.</li>
<li>Pick a few journeys that matter: log in, enter a room, place a bet, withdraw.</li>
<li>Count both failures and slowness. A response that takes 30 seconds is a failure.</li>
</ul>
<h3>Going deeper: the arithmetic of dependencies</h3>
<ul>
<li><b>In series, availability multiplies.</b> A request that needs three components, each 99.9% available, succeeds about 99.7% of the time. Every hard dependency you add lowers your ceiling.</li>
<li><b>In parallel, it improves.</b> Two independent copies at 99% each give about 99.99%, provided their failures really are independent. Two copies in one datacenter are not.</li>
<li><b>Degrade gracefully.</b> If the recommendations service is down, show the page without recommendations. A dependency you can do without is no longer a hard one.</li>
</ul>
<h3>Going deeper: alerting on burn rate</h3>
<p>Advanced teams alert on how fast the budget is being spent. If the current rate would use the month's budget in two days, wake someone. If it would last three weeks, open a ticket. This catches fast disasters and slow leaks with few false alarms.</p>`,
    own: `Write one SLO for a service you run that its users would accept as fair. For example: &ldquo;logging in and reaching the first screen succeeds within 10 seconds, 99.5% of the time.&rdquo; Then ask how you would measure it today. If you cannot, the homework from lesson 4.1 comes first.`,
    terms: [['SLI', '服務水準指標'], ['SLO', '服務水準目標'], ['SLA', '服務水準協議'], ['error budget', '錯誤預算'], ['availability', '可用性'], ['graceful degradation', '優雅降級']],
    quiz: [
      { q: "About how much downtime per month does a 99.9% SLO allow?",
        a: ["4 seconds", "43 minutes", "7 hours", "3 days"], c: 1,
        why: "0.1% of 30 days is 43.2 minutes." },
      { q: "The error budget for this month has been used up. What should the team do?",
        a: ["Release more often to catch up", "Pause risky releases and work on reliability until the budget recovers", "Change the SLO to 90%", "Turn off monitoring"], c: 1,
        why: "This is the agreement that an error budget represents." },
      { q: "A request passes through three services, each with 99.9% availability. What is the availability of the whole?",
        a: ["About 99.99%", "Exactly 99.9%", "About 99.7%", "About 97%"], c: 2,
        why: "0.999 multiplied by itself three times is about 0.997. Chains are weaker than their links." }
    ]
  },
  {
    id: 'incidents', lv: 3, mins: 12,
    title: 'Alerts, incidents and postmortems',
    zh: '只有「使用者正在受害、而且需要人馬上處理」才該半夜叫人。出事先止血（多半是退版），原因之後再查。事後檢討不追究個人，追究「系統為什麼讓這件事發生」。',
    body: `
<h3>Alerts</h3>
<p>Wake a person only when both are true: users are being hurt or soon will be, and a person must act now. Everything else belongs on a dashboard or in a ticket.</p>
<ul>
<li><b>Alert on symptoms, not causes.</b> &ldquo;The error rate is above 2%&rdquo; is a symptom. &ldquo;CPU is at 90%&rdquo; is a possible cause, and may be perfectly healthy.</li>
<li><b>Each alert links to a runbook:</b> what it means, the first three things to check, how to reduce the damage.</li>
<li><b>Noise kills.</b> If an alert fires and nobody needs to act, fix it or delete it. People who are woken for nothing learn to ignore the pager.</li>
</ul>
<h3>During an incident</h3>
<ol>
<li><b>Declare it early.</b> Saying &ldquo;this is an incident&rdquo; costs nothing and gets people moving.</li>
<li><b>One person leads</b> (the incident commander) and makes decisions. Others carry them out. One person keeps users informed.</li>
<li><b>Stop the damage first.</b> Roll back, fail over, add capacity, switch off the feature. Understanding the cause can wait. The fastest fix is usually to undo the last change.</li>
<li><b>Write a timeline as you go.</b> Memory is unreliable an hour later.</li>
<li><b>Confirm recovery</b> using the same measurements that showed the problem.</li>
</ol>
<h3>After: the postmortem</h3>
<p>A written review with a fixed shape:</p>
<table>
<tr><th>Section</th><th>Content</th></tr>
<tr><td>Summary</td><td>Two sentences anyone can understand</td></tr>
<tr><td>Impact</td><td>Who was affected, how badly, for how long</td></tr>
<tr><td>Timeline</td><td>What happened and what people did, with times</td></tr>
<tr><td>Contributing factors</td><td>Everything that had to be true for this to happen. There is rarely one &ldquo;root cause&rdquo;.</td></tr>
<tr><td>What went well</td><td>What limited the damage</td></tr>
<tr><td>Actions</td><td>Specific changes, each with an owner and a date</td></tr>
</table>
<h3>Why it must be blameless</h3>
<p>The question is &ldquo;why did the system allow this?&rdquo; and never &ldquo;who did it?&rdquo;. If a person can take down production with one mistyped command, the system is at fault for making that possible. And when people are punished for mistakes, they hide information, and hidden information causes the next outage.</p>
<h3>Going deeper: change causes most incidents</h3>
<p>Most outages follow a change: a deploy, a configuration edit, a migration. The defences are the ones from module 2: small changes, gradual rollout, fast rollback, and releasing when people are awake to watch.</p>
<h3>Going deeper: practice</h3>
<p>Teams that handle incidents well have rehearsed. A <b>game day</b> is a planned exercise: break something on purpose in a test environment and respond as if it were real. <b>Chaos engineering</b> does this continuously and automatically.</p>`,
    own: `Write a one-page postmortem for a real event you lived through: a migration that lost something, a disk that filled up, a release that broke. Use the six sections above. The list of actions at the end becomes your reliability to-do list, and the page itself goes in your portfolio. Interviewers ask &ldquo;tell me about an incident&rdquo; in almost every operations interview.`,
    terms: [['alert', '警報'], ['incident', '事故'], ['runbook', '處理手冊'], ['mitigation', '緩解／止血'], ['postmortem', '事後檢討'], ['blameless', '不究責'], ['on-call', '值班待命']],
    quiz: [
      { q: "What is the first priority during an incident?",
        a: ["Find the root cause", "Stop the damage, often by undoing the last change", "Write the postmortem", "Identify who made the mistake"], c: 1,
        why: "Users are being hurt now. Investigation can happen once they are not." },
      { q: "Why are postmortems blameless?",
        a: ["To be polite", "People share what really happened only when they are not punished for it, and that information prevents the next incident", "Because nobody is ever at fault", "To make them shorter"], c: 1,
        why: "Blame produces silence. The aim is to fix the system that allowed the mistake." },
      { q: "Which of these is a good reason to page someone at night?",
        a: ["CPU reached 85% for one minute", "A nightly report finished late", "The share of failed logins has been above 5% for five minutes", "A disk is 60% full"], c: 2,
        why: "Users are being hurt now and a person needs to act. The others can wait for morning." }
    ]
  },
  {
    id: 'loadtest', lv: 3, mins: 12,
    title: 'Load testing and capacity',
    zh: '沒量過就不知道容量。逐步加壓、看延遲曲線在哪裡「彎上去」，那裡就是極限；當下滿載的資源就是瓶頸。修掉一個，瓶頸會移到下一個。',
    body: `
<p>You do not know how much load your system can take until you measure it. Estimates are commonly wrong by a factor of ten in either direction.</p>
<h3>The method</h3>
<ol>
<li>Write a script that acts like a real user: log in, open the lobby, join a room, place bets, with pauses.</li>
<li>Raise the number of simulated users in steps.</li>
<li>At each step, record p95 latency, the error rate, and the saturation of each part: app CPU, database CPU, connection pool, memory.</li>
<li>Find the <b>knee</b>: the load at which latency stops being flat and bends upward. That is your capacity.</li>
<li>Whatever was saturated at the knee is the <b>bottleneck</b>. Fix it and test again. The bottleneck moves somewhere else.</li>
</ol>
<h3>Four kinds of test</h3>
<table>
<tr><th>Test</th><th>Shape</th><th>Finds</th></tr>
<tr><td>Load</td><td>The expected peak, held for a while</td><td>Whether you cope on a busy day</td></tr>
<tr><td>Stress</td><td>Beyond the peak, until it breaks</td><td>Where the limit is, and whether it fails gently or collapses</td></tr>
<tr><td>Spike</td><td>A sudden jump to ten times normal</td><td>Whether scaling reacts in time</td></tr>
<tr><td>Soak</td><td>Moderate load for hours</td><td>Slow leaks of memory, connections or disk</td></tr>
</table>
<pre><code>import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 200 },
    { duration: '3m', target: 200 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)&lt;500'],
    http_req_failed: ['rate&lt;0.01'],
  },
};

export default function () {
  const r = http.get('http://localhost:8080/api/lobby');
  check(r, { 'status is 200': (x) =&gt; x.status === 200 });
  sleep(1);
}</code></pre>
<h3>Rules that keep the results honest</h3>
<ul>
<li>Test a copy that resembles production. Never test a live system that handles real money.</li>
<li>Run the load generator on a different machine. Otherwise you are measuring the generator.</li>
<li>Use a realistic amount of data. An empty database is always fast.</li>
<li>Only test systems you own.</li>
</ul>
<h3>Going deeper: planning capacity</h3>
<ul>
<li><b>Headroom.</b> Provision for the peak plus 30 to 50%.</li>
<li><b>N+1.</b> You should survive losing one server, or one zone, at peak.</li>
<li><b>Autoscaling</b> handles gradual growth. It cannot react faster than a server boots. For sudden spikes you need spare capacity or a queue.</li>
</ul>
<h3>Going deeper: failing gently</h3>
<p>When demand exceeds capacity, serving everyone slowly makes everyone time out, and the retries that follow make it worse. Refusing some requests quickly (HTTP 429 or 503) keeps the rest fast. This is <b>load shedding</b>. <b>Rate limits</b> per user stop one client from taking everything.</p>`,
    tryNote: 'On your Mac: brew install k6. Save the script above as test.js and aim it at a local copy of your own service.',
    try: [
      ['k6 run test.js', 'Watch http_req_duration p(95) and http_req_failed in the summary.']
    ],
    own: `Run the test against a local or scratch copy of your service. Do not aim it at a live system that real users depend on. Record the number of simulated users at which p95 passes 500 ms, and which resource was full at that moment. Fix it, run again, and write up the before and after. That is a load-test report for your portfolio.`,
    terms: [['load test', '負載測試'], ['stress test', '壓力測試'], ['bottleneck', '瓶頸'], ['capacity', '容量'], ['headroom', '餘裕'], ['load shedding', '卸載'], ['rate limit', '速率限制'], ['soak test', '長時間浸泡測試']],
    quiz: [
      { q: "Which kind of test is most likely to reveal a memory leak?",
        a: ["A spike test", "A soak test: moderate load for several hours", "A one-minute load test", "A DNS test"], c: 1,
        why: "Leaks grow slowly. They show only when the system runs under load for a long time." },
      { q: "In a load test, what is the &quot;knee&quot;?",
        a: ["The moment the test starts", "The load at which latency stops being flat and starts to climb steeply", "The highest error code seen", "The cost of the test"], c: 1,
        why: "It marks the practical capacity of the system as it is built today." },
      { q: "Demand is twice what the system can handle. What is the best behaviour?",
        a: ["Accept every request and answer each one slowly", "Reject the excess quickly so that accepted requests stay fast", "Restart all servers", "Turn off logging"], c: 1,
        why: "Slow answers for everyone lead to timeouts and retries for everyone. Shedding load protects the majority." }
    ]
  },
  {
    id: 'dr', lv: 3, mins: 11,
    title: 'Surviving disasters',
    zh: '每個系統要先決定兩個數字：RPO（最多能掉多少資料）與 RTO（最久能停多久）。備份守則 3-2-1：三份、兩種地方、一份異地。沒還原過的備份不算備份。',
    body: `
<p>Some things will happen eventually. A disk dies. A datacenter loses power. Someone deletes the production database. A password leaks. The cloud account is locked. The question for each is how much you lose and how long you are down.</p>
<h3>Two numbers for every system</h3>
<table>
<tr><th>Term</th><th>Question</th><th>Example</th></tr>
<tr><td><b>RPO</b> (recovery point objective)</td><td>How much recent data can we afford to lose?</td><td>&ldquo;At most the last 5 minutes&rdquo;</td></tr>
<tr><td><b>RTO</b> (recovery time objective)</td><td>How long can we be down?</td><td>&ldquo;At most 1 hour&rdquo;</td></tr>
</table>
<p>These two numbers decide the design and the cost. A nightly backup gives an RPO of 24 hours. Continuous shipping of the change log gives minutes. A synchronous standby gives almost zero.</p>
<h3>Strategies, from cheap to expensive</h3>
<table>
<tr><th>Strategy</th><th>What is kept ready</th><th>Recovery time</th></tr>
<tr><td>Backup and restore</td><td>Only the backups</td><td>Hours</td></tr>
<tr><td>Pilot light</td><td>Data replicated, servers switched off</td><td>Tens of minutes</td></tr>
<tr><td>Warm standby</td><td>A small copy running</td><td>Minutes</td></tr>
<tr><td>Active-active</td><td>Full copies serving traffic in several regions</td><td>Seconds. Hardest to build, because data must agree across regions.</td></tr>
</table>
<h3>Start with two zones</h3>
<p>Spreading across two or three availability zones in one region covers the most common failures at modest cost. Going to several regions is a large step in complexity. Take it only when the business truly needs it.</p>
<h3>Backups: the 3-2-1 rule</h3>
<div class="note"><b>3</b> copies of the data, on <b>2</b> different kinds of storage, with <b>1</b> in another place: a different account or region. Make one copy <b>immutable</b>, so that an attacker or a script cannot delete it.</div>
<h3>Going deeper: proving it works</h3>
<ul>
<li><b>Restore drills.</b> Restore from backup on a schedule and time it. The result is your real RTO, and it is usually worse than you hoped.</li>
<li><b>Rebuild from nothing.</b> Could you recreate everything in an empty account, using only git and the backups? This is where infrastructure as code pays for itself.</li>
<li><b>Hunt for single points of failure:</b> one machine, one zone, one DNS provider, one payment provider, and one person who knows the passwords.</li>
</ul>
<h3>Going deeper: disasters that are not hardware</h3>
<ul>
<li><b>Ransomware and malicious deletion</b> go for the backups first. That is the purpose of the immutable copy in another account.</li>
<li><b>Account lockout.</b> Losing access to the cloud root account or the domain registrar is a disaster with no technical fix. Keep recovery codes somewhere safe and offline.</li>
<li><b>A bad release</b> that corrupts data over several hours. Only point-in-time recovery can undo it.</li>
</ul>`,
    own: `List where everything you run lives: how many machines, in how many zones. Write the RPO and RTO you would accept for your three most important kinds of data. Then run one real drill and time it: take the newest backup of one of them and restore it onto a test machine.`,
    terms: [['disaster recovery', '災難復原'], ['RPO', '復原點目標'], ['RTO', '復原時間目標'], ['standby', '備援'], ['immutable backup', '不可變備份'], ['restore drill', '還原演練']],
    quiz: [
      { q: "What does RPO measure?",
        a: ["How long recovery takes", "How much recent data you can afford to lose", "How many servers you have", "The cost of the backup"], c: 1,
        why: "RPO is about data loss. RTO is about time down." },
      { q: "What does the 3-2-1 rule say?",
        a: ["3 servers, 2 databases, 1 load balancer", "3 copies of the data, on 2 kinds of storage, 1 of them elsewhere", "3 backups a day for 2 weeks in 1 region", "3 engineers, 2 on call, 1 manager"], c: 1,
        why: "Several copies in different places, so that no single event destroys them all." },
      { q: "Why keep one backup copy immutable and in a separate account?",
        a: ["It is cheaper", "An attacker or a faulty script that reaches the main account cannot delete it", "It restores faster", "It is required by DNS"], c: 1,
        why: "Attackers delete backups before demanding ransom. A copy they cannot reach or change survives." }
    ]
  },
  {
    id: 'perf', lv: 4, mins: 14,
    title: 'Linux performance analysis',
    zh: '進階：效能問題靠方法、不靠亂猜。對每個資源（CPU、記憶體、磁碟、網路）問三件事：用了多少、有沒有在排隊、有沒有錯誤。雲端小機器要注意 CPU 點數用完會被限速。',
    body: `
<p>When a server is slow, beginners guess and try things. Experts follow a method that finds the answer in minutes. This lesson is that method.</p>
<h3>The USE method</h3>
<p>For every resource (CPU, memory, disk, network) ask three questions:</p>
<ul>
<li><b>Utilisation:</b> how busy is it?</li>
<li><b>Saturation:</b> is work waiting in a queue for it?</li>
<li><b>Errors:</b> is it reporting any?</li>
</ul>
<p>Saturation is the one people forget, and it is the one that matters. A CPU at 100% with nothing waiting is fully used and healthy. A CPU at 100% with twenty tasks waiting is the problem.</p>
<h3>The first sixty seconds</h3>
<table>
<tr><th>Command</th><th>What to read</th></tr>
<tr><td><code>uptime</code></td><td>Load averages for 1, 5 and 15 minutes. Is it rising or falling?</td></tr>
<tr><td><code>dmesg -T | tail</code></td><td>Kernel messages: OOM kills, disk errors</td></tr>
<tr><td><code>vmstat 1</code></td><td><b>r</b>: tasks running or waiting for CPU. More than the core count means saturation. <b>si/so</b>: swapping, which is always bad news. <b>wa</b>: time waiting for disk. <b>st</b>: time stolen by the host.</td></tr>
<tr><td><code>mpstat -P ALL 1</code></td><td>Is one core at 100% while the others idle? That is a single-threaded bottleneck.</td></tr>
<tr><td><code>pidstat 1</code></td><td>Which process is using the CPU</td></tr>
<tr><td><code>iostat -xz 1</code></td><td><b>await</b>: how long each disk operation takes. <b>%util</b>: how busy the disk is.</td></tr>
<tr><td><code>free -m</code></td><td>The &ldquo;available&rdquo; column</td></tr>
<tr><td><code>sar -n DEV 1</code></td><td>Network throughput per interface</td></tr>
</table>
<h3>Where CPU time goes</h3>
<table>
<tr><th>Kind</th><th>Means</th></tr>
<tr><td>user</td><td>Your application's own code</td></tr>
<tr><td>system</td><td>The kernel working for you: many system calls, heavy networking</td></tr>
<tr><td>iowait</td><td>Idle, waiting for a disk</td></tr>
<tr><td>steal</td><td>The cloud host gave your CPU time to someone else, or you are being throttled</td></tr>
</table>
<div class="warn"><b>Burstable cloud machines.</b> Cheap instance types (AWS t3, Lightsail) earn CPU credits while idle and spend them when busy. When the credits run out, Lightsail slows the machine to a small baseline, and a t3 in its default mode keeps running and charges extra. A machine that is mysteriously slow at peak hours, with high steal time, has often run out of credits. No change to the code will fix that.</div>
<h3>Going deeper: finding the code responsible</h3>
<ul>
<li>A <b>profiler</b> samples what the program is doing many times a second. <code>perf</code> does this for the whole system, and each language has its own.</li>
<li>A <b>flame graph</b> draws the samples. Each box is a function, and its width is the share of time spent there. Look for the widest flat top.</li>
<li><b>Off-CPU time.</b> A program that is slow while using little CPU is waiting: for a lock, the disk, the network, the database. A CPU profile will not show this. Traces and time-in-state tools will.</li>
<li><b>eBPF</b> tools (bcc, bpftrace) attach small safe programs inside the kernel to observe it live with little overhead: every process started, every slow disk operation, every TCP connection.</li>
<li><code>strace</code> shows a process's system calls. It slows the process a great deal, so use it with care in production.</li>
</ul>
<h3>Going deeper: tail latency</h3>
<p>The slowest 1% usually has its own causes: garbage collection pauses, lock contention, one slow disk operation, a cold cache, a noisy neighbour. Improving the average does nothing for these. Find them by looking at the slowest individual requests, with traces.</p>
<h3>The discipline</h3>
<p>Measure before changing anything. Change one thing. Measure again. Keep a note of each. Optimising without measuring usually makes the code more complicated and no faster.</p>`,
    tryNote: 'On a Linux server over SSH. Every command only reads. mpstat and iostat need the sysstat package.',
    try: [
      ['vmstat 1 5', 'Compare the r column with your core count. Check that si and so are zero, and look at st.'],
      ['mpstat -P ALL 1 3', 'Per-core usage. One busy core among idle ones points to single-threaded code.'],
      ['iostat -xz 1 3', 'Disk wait times and utilisation.'],
      ['top -H', 'Threads, not processes. Press q to leave.']
    ],
    own: `Look at the CPU credit graphs for your cloud machines. In the Lightsail console, open Metrics and choose CPU burst capacity. For EC2, open CloudWatch and look at CPUCreditBalance. If the capacity falls to zero during busy hours, the machine is being limited by the provider, and the fix is a different instance size.`,
    terms: [['utilisation', '使用率'], ['saturation', '飽和（排隊）'], ['profiler', '效能剖析器'], ['flame graph', '火焰圖'], ['steal time', '被竊取時間'], ['burstable instance', '可爆發型執行個體'], ['tail latency', '尾端延遲']],
    quiz: [
      { q: "vmstat shows 12 in the r column on a 4-core machine. What does that mean?",
        a: ["12% of memory is free", "Twelve tasks want the CPU and only four can run: the CPU is saturated", "The disk is full", "Twelve users are logged in"], c: 1,
        why: "r counts runnable tasks. More than the number of cores means some are waiting." },
      { q: "A cloud server shows high steal time during busy hours. What is the likely cause?",
        a: ["A memory leak in the app", "The host is giving CPU time to others, or the machine has used up its CPU credits", "A missing index", "A DNS problem"], c: 1,
        why: "Steal is time your machine wanted to run and was not allowed to. Check the credit balance." },
      { q: "A service is slow and uses almost no CPU. What should you investigate?",
        a: ["Buy faster CPUs", "What it is waiting for: locks, disk, network or a database", "Rewrite it in another language", "Add more threads"], c: 1,
        why: "Low CPU with high latency means the time is being spent waiting." }
    ]
  }
  ]
});
