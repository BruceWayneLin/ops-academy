M({
  id: 'job', n: 9,
  title: 'Getting hired without a degree',
  zh: '沒有相關學歷怎麼求職：職缺地圖、證照、作品集、履歷與面試、面試題庫',
  time: 'Read early, return to it often',
  blurb: 'What replaces a degree: proof of work, the right certificates in the right order, and interview practice. Read this module first so you know what you are aiming at.',
  lessons: [
  {
    id: 'job-map', lv: 1, mins: 11,
    title: 'The job map, and the route for someone without a degree',
    zh: '沒有學歷，靠三樣東西取代：實際經驗、看得到的作品、證照。你不是從零開始——多年的開發經驗就是本錢。最快的路是先找「七成會、三成新」的橋接職位。',
    body: `
<p>A degree does one thing in hiring: it tells an employer, before they have met you, that you probably know the basics. Without one, you supply that signal by other means. This module is about those means.</p>
<h3>The roles</h3>
<table>
<tr><th>Role</th><th>The work</th><th>Modules</th><th>Fit for a developer</th></tr>
<tr><td><b>DevOps / platform engineer</b></td><td>Pipelines, infrastructure as code, Kubernetes, cloud</td><td>1 to 4</td><td>Strong. Coding skill is the hard requirement.</td></tr>
<tr><td><b>Site reliability engineer</b></td><td>Reliability, capacity, incidents, on-call, automation</td><td>1 to 4, 8</td><td>Strong, and asks for more depth.</td></tr>
<tr><td><b>Cloud engineer / architect</b></td><td>Designing and building on a cloud provider</td><td>0, 1, 3, 5, 8</td><td>Strong.</td></tr>
<tr><td><b>Cloud or application security engineer</b></td><td>Securing systems and code, tooling in the pipeline</td><td>5, 6, plus 1 to 3</td><td>Strong, with high demand.</td></tr>
<tr><td><b>Penetration tester</b></td><td>Authorised attacks and reports</td><td>5, 6, and many hours of labs</td><td>Possible. Competitive at entry.</td></tr>
<tr><td><b>SOC analyst</b></td><td>Watching and triaging alerts, often in shifts</td><td>6</td><td>An entry role. A step down for an experienced developer.</td></tr>
<tr><td><b>MIS / IT administrator</b></td><td>Accounts, devices, office network, support</td><td>7, 1</td><td>Many openings in traditional companies. Lower ceiling.</td></tr>
</table>
<h3>What replaces the degree</h3>
<ol>
<li><b>Experience.</b> You are not starting from zero. Years of shipping real software to real users is what most applicants with a degree lack. You are repositioning yourself, and that is far easier than starting again.</li>
<li><b>Proof of work.</b> Things an employer can look at: write-ups, repositories, dashboards, reports (lesson 9.3). This is the strongest substitute, and it is free.</li>
<li><b>Certificates.</b> They pass the automatic filters that would otherwise ask for a degree (lesson 9.2).</li>
<li><b>People.</b> A recommendation from someone the employer trusts outranks every document.</li>
</ol>
<h3>The bridge job</h3>
<p>The hardest move is changing role and employer together, with a new title you have never held. The easier move has two steps:</p>
<ol>
<li>Take a role where 70% is what you already do well and 30% is the new field: a full-stack or front-end position in a team where you also own the pipeline, the deployments and the cloud setup. Or do exactly that inside your present job.</li>
<li>After a year you have real production experience under the new heading, and the second move is ordinary.</li>
</ol>
<h3>Going deeper: where a missing degree matters</h3>
<table>
<tr><th>Employer</th><th>Attitude</th></tr>
<tr><td>Foreign companies and remote roles</td><td>Rarely ask. They test skill in interviews.</td></tr>
<tr><td>Start-ups and product companies</td><td>Care about what you have built.</td></tr>
<tr><td>Large traditional companies</td><td>HR may filter on it. A referral or certificates get you past.</td></tr>
<tr><td>Government and regulated finance</td><td>Often have formal requirements. For security roles, certificates from the official list count for a great deal.</td></tr>
</table>
<p>Aim at the first two rows first. They are also where the pay is highest.</p>
<h3>Going deeper: an honest timeline</h3>
<p>For a working developer studying on five evenings a week: about three months to be credible for a bridge role, about six to be a real candidate for DevOps or cloud security positions, and one to two years in such a job before &ldquo;senior&rdquo; is fair. The expert level comes from years of running production and cannot be hurried by study alone.</p>`,
    own: `Write down the one role from the table you are aiming at first, and the market: Taiwan, or remote for foreign companies. Then write the bridge: which job, or which extra responsibility in your present job, would put real DevOps or security work on your record within three months?`,
    terms: [['site reliability engineer', '網站可靠性工程師'], ['platform engineer', '平台工程師'], ['job posting', '職缺'], ['referral', '內部推薦'], ['proof of work', '實績證明']],
    quiz: [
      { q: "What is the strongest substitute for a degree?",
        a: ["A longer resume", "Proof of work that an employer can look at", "A course completion badge", "A personal logo"], c: 1,
        why: "It shows directly what a degree only hints at: that you can do the work." },
      { q: "What is a bridge job?",
        a: ["A temporary contract abroad", "A role that is mostly what you already do well, with a share of the new field", "An unpaid internship", "A job in construction"], c: 1,
        why: "It gets real experience of the new field onto your record without starting from the bottom." }
    ]
  },
  {
    id: 'job-certs', lv: 1, mins: 11,
    title: 'Certificates, and the order to take them',
    zh: '證照的作用是通過人資的篩選，不能取代實力。建議順序：AWS SAA（最便宜、認可度高）、CKA（DevOps 最強訊號）、Security+ 或 iPAS 資訊安全工程師（都列過台灣官方證照清單，報名前先查最新版）。錢不夠就先做作品集。',
    body: `
<p>A certificate does two things. It gets you past filters that would otherwise require a degree, and it shows you have covered a body of knowledge systematically. It does not show that you can do the job. That is what the portfolio and the interview are for. So take few, choose them well, and never stop building while you study.</p>
<h3>The recommended order</h3>
<table>
<tr><th>Certificate</th><th>Shows</th><th>Exam</th><th>Rough cost</th></tr>
<tr><td><b>1. AWS Solutions Architect Associate</b></td><td>You can design systems on AWS</td><td>Multiple choice, about two hours</td><td>About US$150</td></tr>
<tr><td><b>2. CKA</b> (Certified Kubernetes Administrator)</td><td>You can operate Kubernetes</td><td>Two hours of hands-on tasks in real clusters</td><td>About US$400 to 450, with one retake included</td></tr>
<tr><td><b>3a. CompTIA Security+</b></td><td>The international security baseline</td><td>Multiple choice and practical questions</td><td>About US$400</td></tr>
<tr><td><b>3b. iPAS 資訊安全工程師</b></td><td>The security baseline recognised in Taiwan. It has two levels, 初級 and 中級.</td><td>Written, in Chinese</td><td>Low</td></tr>
</table>
<p>Prices change. Check the official page before paying. Some employers refund exam fees, which is worth asking about once you are in a bridge job.</p>
<h3>Why this order</h3>
<ul>
<li><b>AWS first.</b> It is the cheapest of the international certificates, it is known everywhere, and studying for it reinforces modules 0, 1, 3 and 8.</li>
<li><b>CKA second.</b> It is a practical exam, so it cannot be passed by memorising. That is why employers respect it. It is the strongest single signal for DevOps roles.</li>
<li><b>One security baseline third.</b> Take 3a if you are aiming at foreign or remote employers, 3b if you are aiming at employers in Taiwan. Both have appeared on Taiwan's official list. Check the current list, and which iPAS level it names, before you pay.</li>
</ul>
<h3>Taiwan's official list</h3>
<p>Under the Cyber Security Management Act, security staff in government agencies and designated organisations must hold certificates from a published list (資通安全專業證照清單, kept by the Administration for Cyber Security under the Ministry of Digital Affairs). The list has included Security+, CEH, CISSP, ISO 27001 Lead Auditor, iPAS 資訊安全工程師 and others, and it is revised from time to time. If you aim at the public sector, critical infrastructure or finance, choose from that list.</p>
<h3>Later, according to direction</h3>
<table>
<tr><th>Direction</th><th>Certificate</th><th>Note</th></tr>
<tr><td>DevOps</td><td>Terraform Associate</td><td>Inexpensive and quick</td></tr>
<tr><td>Kubernetes security</td><td>CKS</td><td>Requires CKA first</td></tr>
<tr><td>Cloud security</td><td>AWS Security Specialty</td><td></td></tr>
<tr><td>Penetration testing</td><td>OSCP</td><td>A 24-hour practical exam. The respected standard.</td></tr>
<tr><td>Compliance</td><td>ISO 27001 Lead Auditor</td><td>A five-day course and exam. Common in Taiwan.</td></tr>
<tr><td>Security leadership</td><td>CISSP</td><td>Requires five years of paid security work. You may pass the exam earlier and hold &ldquo;Associate&rdquo; status until then.</td></tr>
</table>
<h3>How to study for one</h3>
<ol>
<li>Download the official exam guide. It lists every topic and its weight.</li>
<li>Map each topic to a lesson here, and study the gaps from the official documentation.</li>
<li>For practical exams, practise on real systems until the tasks are routine. The CKA purchase includes sessions on an exam simulator.</li>
<li>Take timed practice exams. Book the real one when you pass them consistently.</li>
</ol>
<h3>If money is tight</h3>
<p>Build the portfolio first. It costs nothing and counts for more. Then take the cheapest exam that the employers you are aiming at recognise. Leave the rest until you have income from a bridge job or an employer who pays.</p>`,
    own: `Download the official exam guide for the AWS Solutions Architect Associate. Go through its list of topics and mark each one green (I could explain this), yellow (I have heard of it) or red (new to me). The yellow and red items are your study list. Repeat this for every exam before paying for it.`,
    terms: [['certificate', '證照'], ['exam guide', '考試大綱'], ['practical exam', '實作考試'], ['multiple choice', '選擇題'], ['retake', '重考']],
    quiz: [
      { q: "What is a certificate mainly good for?",
        a: ["Proving you can do the job", "Passing hiring filters and showing systematic coverage of a subject", "Replacing interviews", "Guaranteeing a salary"], c: 1,
        why: "Ability is shown by proof of work and by the interview. The certificate gets you to that stage." },
      { q: "Why do employers respect the CKA more than most multiple-choice certificates?",
        a: ["It is more expensive", "It is a hands-on exam on real clusters, so it cannot be passed by memorising", "It is shorter", "It is older"], c: 1,
        why: "It tests whether you can do the tasks under time pressure." },
      { q: "With very little money to spend, what comes first?",
        a: ["The most expensive certificate", "The portfolio, then the cheapest widely recognised exam", "Three certificates at once", "A paid bootcamp"], c: 1,
        why: "The portfolio is free and carries the most weight." }
    ]
  },
  {
    id: 'job-portfolio', lv: 2, mins: 12,
    title: 'The portfolio: proof of work',
    zh: '作品集就是把這門課每一課的「On your own stack」作業整理成別人看得懂的文件。你有真的在線上跑的系統，這是大多數應徵者沒有的。公開前先拿掉機密、IP 與公司的東西。',
    body: `
<p>You have something most applicants do not: real systems, with real users, that you run yourself. Each &ldquo;On your own stack&rdquo; task in this course was chosen so that, written up, it becomes evidence an employer can read. This lesson collects them.</p>
<div class="widget" data-w="ready"></div>
<h3>What each piece should contain</h3>
<table>
<tr><th>Piece</th><th>Contents</th><th>From lesson</th></tr>
<tr><td>Architecture write-up</td><td>A diagram, the path of a request, each component's job, what happens when each fails, and what you would change next</td><td>1.1, 8.4</td></tr>
<tr><td>Infrastructure repository</td><td>Code that builds a service from nothing, a pipeline, and a README that someone else could follow</td><td>2.5, 2.6</td></tr>
<tr><td>Monitoring</td><td>A screenshot of the dashboard, the alert rules, and one paragraph on why those four signals</td><td>4.1</td></tr>
<tr><td>Postmortem</td><td>The six sections. Honest about what went wrong.</td><td>4.3</td></tr>
<tr><td>Load-test report</td><td>Method, graphs, the bottleneck, the change, the result after</td><td>4.4</td></tr>
<tr><td>Threat model and a fix</td><td>Assets, attack paths, and one risk you removed, with before and after</td><td>5.1, 5.4</td></tr>
<tr><td>Restore drill</td><td>What was restored, how long it took, what you changed afterwards</td><td>4.5</td></tr>
<tr><td>Security assessment</td><td>Scope, findings with severity and evidence, fixes</td><td>5.2, 6.3</td></tr>
</table>
<h3>How to write them</h3>
<ul>
<li><b>One page each.</b> A reviewer gives a portfolio about five minutes.</li>
<li><b>Begin with the result and a number.</b> &ldquo;Cut p95 latency from 900 ms to 140 ms by adding one index and a connection pooler.&rdquo;</li>
<li><b>Show your reasoning.</b> What you considered, what you chose, and why. This is what distinguishes a senior from a junior.</li>
<li><b>Include what went wrong.</b> A report in which everything succeeded reads as untested.</li>
<li><b>Write in English</b> if you are aiming at foreign employers. It also serves as proof of working English.</li>
</ul>
<h3>Where to publish</h3>
<p>A personal GitHub account with a pinned repository that links to everything, or a small personal site. Never your employer's code host, and never anything that belongs to an employer.</p>
<h3>Before anything is made public</h3>
<div class="warn">
<ul>
<li>Remove every secret, key, real IP address and internal hostname. Check the git history as well as the latest version.</li>
<li>Remove anything belonging to your employer or to a client.</li>
<li>Describe systems by their engineering: &ldquo;a realtime multiplayer platform with on-chain payments&rdquo;, &ldquo;a game server with persistent world state&rdquo;. Some employers filter on certain industries, so lead with the technical problem and leave the product category out of the headline.</li>
<li>Do not publish details of weaknesses that are still open in a live system. Publish after the fix.</li>
</ul>
</div>
<h3>Going deeper: a home lab</h3>
<p>Where your own systems do not cover a topic, build a small lab for it: a three-node k3s cluster on the cheapest cloud machines for a weekend, a deliberately vulnerable application to test, a Prometheus stack. Write it up in the same way. The write-up is what counts, and the lab can be deleted afterwards to save money.</p>`,
    own: `Choose the piece you can finish soonest. For most people it is the postmortem or the architecture write-up, since both describe things that already exist. Write it this week, one page, and tick it off above. One finished piece is worth more than eight planned ones.`,
    terms: [['portfolio', '作品集'], ['write-up', '技術文章'], ['README', '說明文件'], ['home lab', '自架練習環境'], ['redact', '遮蔽敏感資訊']],
    quiz: [
      { q: "How should a portfolio piece begin?",
        a: ["With your life story", "With the result, stated with a number", "With a list of every tool you know", "With an apology"], c: 1,
        why: "A reviewer has minutes. The outcome tells them at once whether to keep reading." },
      { q: "What must be checked before publishing a repository?",
        a: ["That it has many commits", "That no secrets, real addresses or employer property are in it, including in the history", "That it uses the newest framework", "That the README is long"], c: 1,
        why: "A leaked key in a portfolio is the opposite of the impression you want, and git history keeps everything." }
    ]
  },
  {
    id: 'job-interview', lv: 2, mins: 13,
    title: 'Resume and interviews',
    zh: '履歷每一條都寫「做了什麼＋用數字衡量的結果」。面試有五種：系統設計、故障排查情境、實機操作、資安情境、行為問題。邊想邊講、講清楚取捨、不會就說怎麼查。',
    body: `
<h3>Turning experience into resume lines</h3>
<p>Every line follows one pattern: <b>what you did, measured by a number, and how</b>. Compare:</p>
<table>
<tr><th>Weak</th><th>Strong</th></tr>
<tr><td>Responsible for server maintenance</td><td>Consolidated [N] containerised services from [X] machines onto one host, cutting cloud spend by [Y]% with no data loss</td></tr>
<tr><td>Fixed performance problems</td><td>Traced browser out-of-memory crashes in a WebAssembly game client to heap growth, added a memory cap and an automatic recovery path, and removed the crash in a 25-minute stress run</td></tr>
<tr><td>Worked on security</td><td>Audited [N] repositories, found [K] high-risk issues, and replaced a signing key shared by every service with an isolated signing service that enforces spending limits</td></tr>
<tr><td>Did deployments</td><td>Shipped [N] production releases through a gated process (regression suite, browser verification, staged candidate) with rollback under [M] minutes</td></tr>
</table>
<p>Write yours from work you have really done, with the true numbers. Never invent one: interviewers ask about every figure.</p>
<h3>The shape of the resume</h3>
<ul>
<li>One or two pages. The top third decides whether the rest is read.</li>
<li>A two-line summary aimed at the role: &ldquo;Software engineer moving into platform and security work, with production experience running realtime systems on AWS.&rdquo;</li>
<li>Skills grouped as the job posting groups them: cloud, containers, automation, data, observability, security.</li>
<li>A link to the portfolio near the top.</li>
<li>Education last and brief. Certificates above it.</li>
</ul>
<h3>The five kinds of interview</h3>
<table>
<tr><th>Kind</th><th>What they ask</th><th>How to prepare</th></tr>
<tr><td><b>System design</b></td><td>&ldquo;Design a chat service for a million users.&rdquo;</td><td>The eight steps in lesson 8.4. Practise aloud with a timer.</td></tr>
<tr><td><b>Troubleshooting</b></td><td>&ldquo;Users say the site is slow. What do you do?&rdquo;</td><td>Walk the request path from lesson 1.1. Ask what changed. Check the four signals.</td></tr>
<tr><td><b>Hands-on</b></td><td>A broken Linux machine or cluster to fix while they watch</td><td>Killercoda scenarios, until the commands are automatic</td></tr>
<tr><td><b>Security scenario</b></td><td>&ldquo;Review this design.&rdquo; &ldquo;A key has leaked. What now?&rdquo;</td><td>Threat modelling from lesson 5.1, incident steps from 6.5</td></tr>
<tr><td><b>Behavioural</b></td><td>&ldquo;Tell me about an incident.&rdquo; &ldquo;Tell me about a disagreement.&rdquo;</td><td>Prepare five true stories: situation, what you did, the result, what you learned</td></tr>
</table>
<h3>How to behave in a technical interview</h3>
<ul>
<li><b>Think aloud.</b> Silence gives the interviewer nothing to mark.</li>
<li><b>Ask questions first.</b> Clarifying the requirement is part of the answer.</li>
<li><b>State your assumptions and trade-offs.</b> &ldquo;I would start with one database and replicas, because the write rate is low. If it grows tenfold, I would partition by user.&rdquo;</li>
<li><b>Use numbers.</b></li>
<li><b>When you do not know, say so, and say how you would find out.</b> Bluffing is the one thing that reliably fails an interview.</li>
</ul>
<h3>Going deeper: answering &ldquo;you have no degree&rdquo;</h3>
<p>Answer once, briefly, and move to evidence: &ldquo;I learned on the job and by building. Here is a platform I run in production, and here are the write-ups of how I monitor, secure and scale it.&rdquo; Then stop. Do not apologise, and do not explain at length.</p>
<h3>Going deeper: questions to ask them</h3>
<ul>
<li>How often do you release, and what happens when a release goes wrong?</li>
<li>What does on-call look like, and how often are people woken?</li>
<li>Tell me about your last incident and what changed afterwards.</li>
<li>What would I own in the first three months?</li>
</ul>
<p>Their answers tell you whether the job will teach you anything.</p>`,
    own: `Rewrite three lines of your present resume in the strong pattern, with true numbers. Then prepare one incident story in four parts (situation, what you did, result, what you learned) and say it aloud in English in under two minutes. Record it once and listen back.`,
    terms: [['resume', '履歷'], ['system design interview', '系統設計面試'], ['behavioural interview', '行為面試'], ['trade-off', '取捨'], ['assumption', '假設']],
    quiz: [
      { q: "Which resume line is strongest?",
        a: ["Responsible for databases", "Experienced with many technologies", "Cut p95 latency from 900 ms to 140 ms by adding an index and a connection pooler", "Hard-working team player"], c: 2,
        why: "It states an action, a measured result and the method." },
      { q: "In a technical interview you are asked something you do not know. What is the best response?",
        a: ["Guess confidently", "Say you do not know, and explain how you would find out", "Change the subject", "Stay silent"], c: 1,
        why: "Honesty together with a method is what the work itself requires. Bluffing is usually detected." },
      { q: "Asked &quot;users say the site is slow&quot;, where should the answer begin?",
        a: ["Restart all servers", "Ask what changed, then walk the request path while checking latency, traffic, errors and saturation", "Blame the network", "Add more servers"], c: 1,
        why: "A method shows experience. Acting before understanding shows the opposite." }
    ]
  },
  {
    id: 'job-bank', lv: 3, mins: 20,
    title: 'Interview question bank',
    zh: '二十六題最常被問的面試題與參考答案。先自己用英文講出來，再點開對照。每題的答案都只有兩三句——面試時先講重點，對方想聽再往下展開。',
    body: `
<p>These questions come up again and again in DevOps, SRE and security interviews. For each, say your own answer aloud first, in English, and then open the model answer. The model answers are short on purpose. In an interview, give the core in two or three sentences and go deeper only when asked.</p>
<h3>Networking and Linux</h3>
<details class="reveal"><summary>1. What happens when you type a URL and press Enter?</summary><p>The browser resolves the name to an address through DNS, opens a TCP connection, and performs a TLS handshake in which the server proves its identity with a certificate. It sends an HTTP request, which may be answered by a CDN or passed through a load balancer to an app server that queries a cache or database. The response returns along the same path, and the browser parses the HTML, fetches the other resources and renders the page. I can go deeper on any step.</p></details>
<details class="reveal"><summary>2. What is the difference between TCP and UDP?</summary><p>TCP is a connection that guarantees delivery and order, at the cost of a handshake and of waiting when packets are lost. UDP sends independent messages with no guarantees and no delay. TCP suits web traffic and databases. UDP suits DNS, voice, video and fast games, and HTTP/3 is built on it.</p></details>
<details class="reveal"><summary>3. A user says the site is slow. How do you investigate?</summary><p>First I ask how widespread it is and what changed recently. Then I look at the four signals for each tier: latency, traffic, errors and saturation. I follow the request path to find the first tier where latency rises, and inside that tier I check whether it is working hard or waiting: CPU, connection pool, slow queries, a dependency. If a recent release lines up with the start, I roll back first and investigate afterwards.</p></details>
<details class="reveal"><summary>4. What is the difference between &ldquo;connection refused&rdquo; and a timeout?</summary><p>Refused means the machine answered and nothing is listening on that port, so I check that the process is running and which address it listens on. A timeout means no answer came back, which usually points to a firewall or security group dropping the packets, or a wrong address.</p></details>
<details class="reveal"><summary>5. A server's disk is full. What do you do?</summary><p>I find what is using it with df and du, usually logs or old images. I free space safely: compress or truncate logs, prune unused images. If space does not come back after deleting a file, a process still holds it open and needs a restart. Then I fix the cause with log rotation and scheduled cleanup, and add an alert at 80%.</p></details>
<details class="reveal"><summary>6. What does load average mean?</summary><p>It is roughly the number of tasks running or waiting to run, averaged over 1, 5 and 15 minutes. I compare it with the core count. Above the core count, work is queuing. On Linux it also counts tasks waiting on disk, so a high load with idle CPUs points to an I/O problem.</p></details>
<h3>Containers, Kubernetes and automation</h3>
<details class="reveal"><summary>7. How does a container differ from a virtual machine?</summary><p>A virtual machine runs its own operating system on virtual hardware. A container is a process on the host's kernel, isolated by namespaces and limited by cgroups. Containers start in under a second and are light. Their isolation is weaker, so settings such as privileged mode or mounting the Docker socket are dangerous.</p></details>
<details class="reveal"><summary>8. A pod is in CrashLoopBackOff. How do you debug it?</summary><p>I run kubectl describe on the pod to read its events, and kubectl logs with the previous flag to see why the last container exited. The usual causes are a bad configuration value, a missing secret, a dependency that is unreachable, a failing probe, or the memory limit. If the logs are empty, I start the image with a shell or attach a debug container.</p></details>
<details class="reveal"><summary>9. What is the difference between liveness and readiness probes?</summary><p>A failing liveness probe makes Kubernetes restart the container. A failing readiness probe only removes the pod from the Service so that it receives no traffic. Liveness should test only the process itself. If it tested a shared dependency, one hiccup would restart every pod.</p></details>
<details class="reveal"><summary>10. How do you deploy with zero downtime?</summary><p>A rolling update or a canary, in which new instances must pass readiness before taking traffic and old ones drain their connections on SIGTERM. Database changes are made backward-compatible with the expand-then-contract pattern, because old and new code run together. I watch the error rate and latency after the release, and I keep rollback to a single command.</p></details>
<details class="reveal"><summary>11. What is Terraform state, and how does a team manage it?</summary><p>State is Terraform's record of the real resources it manages, which it uses to work out what must change. A team keeps it in shared remote storage with locking, so that two people cannot apply at once. It is never committed to git, because it can contain secrets. Each environment has its own state.</p></details>
<h3>Data and scale</h3>
<details class="reveal"><summary>12. How do you find and fix a slow query?</summary><p>I find it with the slow-query log or pg_stat_statements, ranked by total time. I run EXPLAIN ANALYZE to see the plan, looking for a full scan on a large table or a large gap between estimated and actual rows. The fix is usually an index that matches the filter and the sort order, or rewriting the query to avoid N+1 calls or deep offsets. Then I measure again.</p></details>
<details class="reveal"><summary>13. What is replication lag, and how do you handle it?</summary><p>With asynchronous replication, replicas are slightly behind the primary, so a read just after a write can return old data. I send a user's reads to the primary for a short time after they write, and always read critical data such as balances from the primary. I also monitor the lag and alert on it.</p></details>
<details class="reveal"><summary>14. How do you prevent a payment from being processed twice?</summary><p>Each operation carries an idempotency key stored under a unique constraint, so a repeat finds the key and does nothing. The change of balance is one atomic conditional update or is made under a row lock, inside a transaction. If a queue is involved, I assume at-least-once delivery and make the consumer idempotent in the same way.</p></details>
<details class="reveal"><summary>15. When would you shard a database, and what does it cost?</summary><p>Only after the cheaper steps are used up: query tuning, a bigger machine, caching, read replicas, splitting by function, and partitioning. Sharding costs cross-shard queries and transactions, rebalancing, hot shards, and operations multiplied by the number of shards. I would choose a key such as the user ID that spreads evenly and appears in nearly every query.</p></details>
<details class="reveal"><summary>16. What is a cache stampede, and how do you prevent it?</summary><p>A popular key expires, and many requests miss together and all rebuild it, flooding the database. I prevent it by letting one request rebuild while the others wait or are served the old value, and by adding random variation to expiry times so that keys do not expire together.</p></details>
<h3>Reliability</h3>
<details class="reveal"><summary>17. What are SLI, SLO and SLA?</summary><p>An SLI is a measurement of what users experience, such as the share of requests that succeed quickly. An SLO is our target for it, such as 99.9% over a month. An SLA is a contract with consequences, set looser than the SLO. The gap between the SLO and 100% is the error budget, which tells us whether to release faster or to work on stability.</p></details>
<details class="reveal"><summary>18. Tell me about an incident you handled.</summary><p>Use four parts. The situation: what broke, and the impact in numbers. What you did: how you noticed, how you stopped the damage, how you found the cause. The result: time to recover. What changed afterwards: the specific fixes and the alert that would now catch it. Speak of the system's weaknesses and never blame a person. Prepare this story in advance from a real event.</p></details>
<details class="reveal"><summary>19. How do you decide what deserves an alert?</summary><p>I page a person only when users are affected or soon will be, and someone must act now. I alert on symptoms such as error rate and latency, since causes such as CPU are often harmless. Every alert links to a runbook. Any alert that fires with nothing for a person to do gets fixed or removed.</p></details>
<h3>Security</h3>
<details class="reveal"><summary>20. How should passwords be stored?</summary><p>As a slow salted hash made for the purpose: argon2id or bcrypt. Never in plain text, never with reversible encryption, and never with a fast hash such as MD5 or plain SHA-256. I would add rate limits on login, a check against breached passwords, and a second factor.</p></details>
<details class="reveal"><summary>21. What is the difference between XSS and CSRF?</summary><p>In XSS the attacker's script runs inside the victim's browser on our site and can do whatever the user can. The defence is to escape output and add a content security policy. In CSRF another site causes the victim's browser to send a request to ours with their cookies attached. The defence is SameSite cookies and anti-CSRF tokens.</p></details>
<details class="reveal"><summary>22. How do you manage secrets in production?</summary><p>They are never in git or in images. Services fetch them at run time from a secrets manager, each service only its own, and every read is logged. Where possible I use roles with temporary credentials, so that no long-lived secret exists. Secrets are rotated on a schedule and immediately after any suspected leak. High-value signing keys live only in an isolated signer or a key management service.</p></details>
<details class="reveal"><summary>23. An AWS access key was pushed to a public repository. What do you do?</summary><p>I disable and replace the key at once, since removing the commit does not help once it has been public. I check CloudTrail for everything that key did and look for resources or users the attacker may have created. I remove the key from the history, add secret scanning to block a repeat, and write a postmortem.</p></details>
<details class="reveal"><summary>24. What is least privilege? Give an example.</summary><p>Each identity gets only the permissions its job needs, so that a compromise does limited damage. For example, a backup job gets a role that can write to one bucket path and nothing else. It does not get administrator access, and it uses temporary credentials from an instance role.</p></details>
<details class="reveal"><summary>25. Where are symmetric and asymmetric encryption used in TLS?</summary><p>Asymmetric cryptography is used at the start: the certificate's signature proves the server's identity, and a key exchange lets both sides derive a shared secret. After that, fast symmetric encryption with that shared key protects the data.</p></details>
<details class="reveal"><summary>26. How would you secure a new Linux server that faces the internet?</summary><p>Apply updates and turn on automatic security patches. Allow SSH by key only, with no root login, and restrict or close the port. Set the firewall to deny by default and open only what is needed. Run services as non-root users and remove what is unused. Send logs off the machine, add monitoring and alerts, and set up backups. Then I scan it from outside to confirm what is exposed.</p></details>
<h3>How to use this page</h3>
<p>Go through the questions once a week until every answer comes out smoothly without notes. Then replace each model answer with an example from your own systems. &ldquo;On my own platform I found...&rdquo; is far more convincing than any textbook answer.</p>`,
    own: `Choose five questions from the list. For each, write a second answer that begins &ldquo;On my own platform...&rdquo; and uses something you really did or found during this course. Those five answers are what make an interviewer remember you.`,
    terms: [['model answer', '參考答案'], ['follow-up question', '追問'], ['root cause', '根本原因'], ['runbook', '處理手冊']],
    quiz: [
      { q: "An access key has been pushed to a public repository. What is the first action?",
        a: ["Delete the commit", "Disable and replace the key", "Make the repository private", "Wait and see whether it is used"], c: 1,
        why: "Once public it must be treated as stolen. Removing it from view does not make it safe." },
      { q: "How long should a first answer to an interview question be?",
        a: ["As long as possible, to show knowledge", "Two or three sentences with the core, going deeper when asked", "One word", "A full history of the technology"], c: 1,
        why: "It shows you know what matters, and it lets the interviewer steer towards what they care about." }
    ]
  }
  ]
});
