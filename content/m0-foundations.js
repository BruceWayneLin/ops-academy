M({
  id: 'fnd', n: 0,
  title: 'Foundations',
  zh: '基礎：從一個開關講起，到 CPU、網路、瀏覽器、伺服器、雲端、密碼學',
  time: '4 to 5 weeks',
  blurb: 'How a machine made of switches can calculate and remember, then what each thing built on top of it is and what it is for. This is the part a computer-science degree covers and most self-taught developers skip.',
  lessons: [
  {
    id: 'fnd-computer', lv: 1, mins: 12,
    title: 'What a computer does when it runs your code',
    zh: '程式跑起來就是一個「行程」：CPU 執行指令、記憶體放正在用的資料、磁碟存檔案，要碰硬體都得透過作業系統核心。',
    body: `
<p>You already write software. This lesson fills in the layer underneath it. You need just enough of it to read what a server is telling you when it is in trouble.</p>
<h3>The four resources</h3>
<table>
<tr><th>Part</th><th>What it is for</th><th>What happens when it runs out</th></tr>
<tr><td><b>CPU</b></td><td>Executes instructions. A machine with 4 cores can truly do 4 things at once.</td><td>Work queues up. Every request gets slower.</td></tr>
<tr><td><b>Memory (RAM)</b></td><td>Fast, temporary workspace. Everything in it is lost at power-off.</td><td>The system kills a process to free space (an &ldquo;OOM kill&rdquo;), or moves data to disk (swap) and everything crawls.</td></tr>
<tr><td><b>Disk</b></td><td>Slow, permanent storage.</td><td>Writes fail. Databases stop. Logs stop, so you also lose the evidence.</td></tr>
<tr><td><b>Network</b></td><td>Sends and receives packets.</td><td>Timeouts and dropped connections.</td></tr>
</table>
<p>Nearly every server emergency is one of these four running out. Module 4 teaches you to check them in that order.</p>
<h3>Program, process, thread, kernel</h3>
<ul>
<li>A <b>program</b> is a file on disk. A <b>process</b> is a running copy of it, with its own private memory and an ID number (PID). Your Node server is one process.</li>
<li>A <b>thread</b> is one line of execution inside a process. Threads in the same process share its memory. Node runs your JavaScript on a single thread, so one Node process uses one core. Go, Java and C# use many threads.</li>
<li>The <b>kernel</b> is the core of the operating system. Only the kernel may touch hardware. A program asks it for things through <b>system calls</b>: open this file, send these bytes, give me more memory.</li>
<li>A <b>file descriptor</b> is the number the kernel hands back for each open file or network connection. Each process has a limit. Reach it and you get &ldquo;too many open files&rdquo;, which on a busy server usually means too many connections.</li>
</ul>
<h3>Going deeper: how slow is slow?</h3>
<table>
<tr><th>Operation</th><th>Rough time</th><th>If a memory read took 1 second</th></tr>
<tr><td>Read from memory</td><td>100 nanoseconds</td><td>1 second</td></tr>
<tr><td>Read from an SSD</td><td>100 microseconds</td><td>17 minutes</td></tr>
<tr><td>Round trip inside one datacenter</td><td>0.5 milliseconds</td><td>1.4 hours</td></tr>
<tr><td>Round trip Taipei to Tokyo</td><td>about 35 milliseconds</td><td>4 days</td></tr>
<tr><td>Round trip Taipei to the US west coast</td><td>about 140 milliseconds</td><td>16 days</td></tr>
</table>
<p>This one table explains most performance advice. Keep hot data in memory (caches). Avoid many small network calls (batch them). Put servers near users (regions and CDNs).</p>
<h3>Going deeper: waiting without wasting</h3>
<p>When a thread waits for the disk or the network, it is <b>blocked</b> and does nothing. There are two ways to serve thousands of users. One is many threads, each allowed to block. The other is one <b>event loop</b> that never blocks: it starts an operation, moves on, and comes back when the result arrives. Node, nginx and Redis work this way. The danger of the event-loop model is that one slow piece of synchronous code freezes every user at once.</p>`,
    tryNote: 'Run on your Mac.',
    try: [
      ['sysctl -n hw.ncpu hw.memsize', 'Your core count and memory in bytes.'],
      ['ps -Ao pid,pcpu,rss,comm -r | head -8', 'The processes using the most CPU right now. RSS is memory in KB.'],
      ['ulimit -n', 'The file-descriptor limit for programs started from this shell.']
    ],
    own: `Pick the main server process of something you run. Find out whether its core logic runs on one thread or several. If it is one, a single slow operation stalls every user, and extra cores only help other processes. On a Linux server, <code>top -H -p PID</code> lists the threads of one process.`,
    terms: [['process', '行程'], ['thread', '執行緒'], ['kernel', '核心'], ['system call', '系統呼叫'], ['file descriptor', '檔案描述符'], ['event loop', '事件迴圈'], ['swap', '置換空間']],
    quiz: [
      { q: "A Node.js server runs on an 8-core machine. One core is at 100%, the others are idle, and requests are queuing. Why?",
        a: ["The machine needs more memory", "Node runs your JavaScript on one thread, so one process uses one core", "The network card is saturated", "The disk is full"], c: 1,
        why: "One Node process executes JavaScript on a single thread. To use 8 cores you run 8 processes, or move heavy work off the main thread." },
      { q: "Roughly how much slower is reading from an SSD than reading from memory?",
        a: ["About the same", "About 10 times", "About 1,000 times", "About a billion times"], c: 2,
        why: "Around 100 microseconds against 100 nanoseconds. That gap is why caches exist." }
    ]
  },
  {
    id: 'fnd-bits', lv: 1, mins: 10,
    title: 'Bits, bytes and encodings',
    zh: '所有資料都是位元組；十六進位、Base64、UTF-8 只是不同的寫法。編碼不是加密，任何人都能解回來。',
    body: `
<p>Everything a computer stores or sends is a sequence of <b>bytes</b>. A byte is 8 bits and holds a number from 0 to 255. Text, images, keys and network packets are all bytes with an agreed meaning.</p>
<h3>Ways of writing bytes</h3>
<table>
<tr><th>Form</th><th>Looks like</th><th>Where you meet it</th></tr>
<tr><td><b>Hexadecimal</b></td><td><code>e4 b8 ad</code> (two characters per byte)</td><td>Hashes, wallet addresses, MAC addresses, colours, memory dumps</td></tr>
<tr><td><b>Base64</b></td><td><code>aGVsbG8=</code> (33% longer than the original)</td><td>JWTs, email attachments, Kubernetes Secrets, data URLs</td></tr>
<tr><td><b>URL encoding</b></td><td><code>%20</code> for a space</td><td>Query strings</td></tr>
</table>
<h3>Text is bytes plus an agreement</h3>
<p>ASCII uses one byte per English character. <b>UTF-8</b> uses 1 to 4 bytes and covers every language. A Chinese character is usually 3 bytes. So &ldquo;length of a string&rdquo; and &ldquo;number of bytes&rdquo; are different numbers, which matters for database column sizes and message limits. Reading bytes with the wrong agreement (Big5 as UTF-8, for example) gives garbage characters.</p>
<h3>The mistake that fails interviews</h3>
<table>
<tr><th></th><th>Reversible?</th><th>Needs a key?</th><th>Purpose</th></tr>
<tr><td><b>Encoding</b> (Base64, hex)</td><td>Yes, by anyone</td><td>No</td><td>Make bytes safe to transport</td></tr>
<tr><td><b>Encryption</b> (AES)</td><td>Yes, with the key</td><td>Yes</td><td>Keep data secret</td></tr>
<tr><td><b>Hashing</b> (SHA-256)</td><td>No</td><td>No</td><td>Fingerprint data, store passwords</td></tr>
</table>
<p>Base64 hides nothing. A JWT is Base64, so anyone holding one can read what is inside it.</p>
<h3>Going deeper: numbers that bite</h3>
<ul>
<li><b>Integer limits.</b> A signed 32-bit number stops at about 2.1 billion. Auto-increment IDs and counters do reach it. Use 64-bit.</li>
<li><b>Floats cannot hold money.</b> 0.1 + 0.2 is 0.30000000000000004. Store money as whole minor units (cents, wei) or a decimal type.</li>
<li><b>JavaScript loses precision above 2<sup>53</sup>.</b> Send large IDs and on-chain amounts as strings in JSON.</li>
<li><b>Units.</b> Network speed is in bits: 100 Mbps moves 12.5 megabytes per second. 1 MiB is 1,048,576 bytes and 1 MB is 1,000,000.</li>
</ul>`,
    tryNote: 'Run on your Mac.',
    try: [
      ["printf 'A' | xxd; printf '中' | xxd", 'The letter A is one byte (41). The character 中 is three (e4 b8 ad).'],
      ["printf 'hello' | base64; printf 'aGVsbG8=' | base64 --decode", 'Encode and decode. No key was needed.'],
      ['node -e "console.log(0.1 + 0.2, 2**53 === 2**53 + 1)"', 'Float error, and the point where JavaScript integers stop being exact.']
    ],
    own: `Take a login token from your own platform. If it has three parts separated by dots, it is a JWT: Base64-decode the middle part. Everything you can read there, anyone who sees the token can read too. Is anything in it that should not be?`,
    terms: [['byte', '位元組'], ['hexadecimal', '十六進位'], ['encoding', '編碼'], ['encryption', '加密'], ['hashing', '雜湊'], ['overflow', '溢位']],
    quiz: [
      { q: "A colleague says the API key is safe because it is Base64-encoded in the config file. Is it?",
        a: ["Yes, Base64 is a form of encryption", "No, anyone can decode Base64 without a key", "Yes, as long as the file is long", "Only if it is encoded twice"], c: 1,
        why: "Base64 is encoding. It changes the form of the bytes and protects nothing." },
      { q: "What is the safe way to store an account balance?",
        a: ["A 64-bit float", "A string with a currency symbol", "A whole number of the smallest unit, or a decimal type", "A 32-bit float, to save space"], c: 2,
        why: "Floats cannot represent most decimal fractions exactly, so errors accumulate. Integers of the smallest unit are exact." }
    ]
  },
  {
    id: 'fnd-internet', lv: 1, mins: 12,
    title: 'What the internet is',
    zh: '網際網路是「很多網路互相接起來」：資料切成封包，路由器一站一站轉送；各層各司其職（IP 找機器、TCP 保證送到、HTTP 講內容）。',
    body: `
<p>The internet is a network of networks. Your home network connects to your provider, your provider connects to other providers, and so on across cables under the sea. There is no centre. What makes it one thing is that every machine agrees on the same rules for addressing and passing data along.</p>
<h3>How data moves</h3>
<ul>
<li>Data is cut into small <b>packets</b>, usually up to 1,500 bytes each.</li>
<li>Each packet carries the <b>IP address</b> it came from and the one it is going to, like an envelope.</li>
<li><b>Routers</b> pass each packet one hop closer to its destination. A typical path is 10 to 20 hops.</li>
<li>Delivery is &ldquo;best effort&rdquo;. Packets can be lost, duplicated, or arrive out of order. Fixing that is the job of a higher layer.</li>
</ul>
<h3>Layers: each one solves one problem</h3>
<table>
<tr><th>Layer</th><th>Its job</th><th>Examples</th><th>Interview name</th></tr>
<tr><td>Application</td><td>What the two programs say to each other</td><td>HTTP, DNS, SSH</td><td>Layer 7</td></tr>
<tr><td>Transport</td><td>Deliver to the right program, reliably or not</td><td>TCP, UDP</td><td>Layer 4</td></tr>
<tr><td>Internet</td><td>Get a packet to the right machine across networks</td><td>IP</td><td>Layer 3</td></tr>
<tr><td>Link</td><td>Move bits to the next device on the same network</td><td>Ethernet, Wi-Fi</td><td>Layer 2</td></tr>
</table>
<p>Each layer wraps the one above. An HTTP request sits inside TLS, inside a TCP segment, inside an IP packet, inside a Wi-Fi frame. When people say &ldquo;a layer 7 load balancer&rdquo; they mean it understands HTTP. &ldquo;Layer 4&rdquo; means it only sees TCP connections.</p>
<h3>The four things that describe a connection</h3>
<ul>
<li><b>Latency:</b> how long one round trip takes. Limited by distance, so it cannot be bought.</li>
<li><b>Bandwidth:</b> how much data fits per second.</li>
<li><b>Packet loss:</b> the fraction that never arrives. Even 1% makes TCP much slower, because lost packets must be sent again.</li>
<li><b>Jitter:</b> how much the latency varies. This is what makes games and calls feel bad.</li>
</ul>
<h3>Going deeper: who decides the routes?</h3>
<p>Each large network (an &ldquo;autonomous system&rdquo;) tells its neighbours which addresses it can reach, using a protocol called <b>BGP</b>. Routers build their maps from these announcements. BGP runs on trust, so a wrong announcement can send traffic for a whole company to the wrong place. Several famous worldwide outages were BGP mistakes. Standards come from the IETF as documents called RFCs, and addresses are handed out by regional registries (APNIC for Asia).</p>`,
    tryNote: 'Run on your Mac.',
    try: [
      ['ping -c 5 1.1.1.1', 'Five round trips. Look at the average time and whether any were lost.'],
      ['traceroute -q 1 -w 1 -m 20 example.com', 'Every router on the path. A line of stars means that router does not answer, which is normal.']
    ],
    own: `Run traceroute from your computer to a server you run, or to any site you use daily. Find where the latency jumps: at your home router (hop 1), inside your provider, or on the hop that crosses to another country. Run it a few times. If hop 1 is slow now and then, the problem is your own Wi-Fi.`,
    terms: [['packet', '封包'], ['router', '路由器'], ['latency', '延遲'], ['bandwidth', '頻寬'], ['packet loss', '封包遺失'], ['jitter', '抖動'], ['protocol', '通訊協定']],
    quiz: [
      { q: "An interviewer asks what &quot;layer 4&quot; means. Which answer is right?",
        a: ["The application layer: HTTP and DNS", "The transport layer: TCP and UDP", "The physical cable", "The database layer"], c: 1,
        why: "Layer 4 is transport. A layer-4 load balancer forwards TCP connections without reading the HTTP inside." },
      { q: "Which device forwards packets between different networks by looking at the destination IP address?",
        a: ["A router", "A Wi-Fi repeater", "A DNS resolver", "A web server"], c: 0,
        why: "Routers work at the IP layer and move each packet one hop closer to its destination." }
    ]
  },
  {
    id: 'fnd-browser', lv: 1, mins: 15,
    title: 'What a browser is and what it does',
    zh: '瀏覽器做三件事：從伺服器抓檔案、把檔案變成看得到點得到的畫面、在沙盒裡安全地執行網頁程式。它其實是一個給網頁用的小型作業系統。',
    body: `
<p>A browser is a program that does three jobs. It <b>fetches</b> files from servers. It <b>turns them into a page</b> you can see and click. And it <b>runs the page's code safely</b>, sealed off from your computer and from every other website. That third job is why a browser is closer to a small operating system than to a document viewer.</p>
<h3>The parts</h3>
<table>
<tr><th>Part</th><th>Job</th><th>In Chrome / Safari / Firefox</th></tr>
<tr><td>Networking</td><td>DNS, connections, TLS, HTTP, cache, cookies</td><td>Built into each</td></tr>
<tr><td>Rendering engine</td><td>HTML and CSS into pixels</td><td>Blink / WebKit / Gecko</td></tr>
<tr><td>JavaScript engine</td><td>Runs scripts</td><td>V8 / JavaScriptCore / SpiderMonkey</td></tr>
<tr><td>Storage</td><td>Cookies, localStorage, IndexedDB, cache</td><td>Per website</td></tr>
<tr><td>Sandbox</td><td>Keeps a page away from your files and other sites</td><td>Separate locked-down processes</td></tr>
</table>
<h3>From bytes to pixels</h3>
<div class="flow"><span class="box">HTML bytes</span><span class="arr">&rarr;</span><span class="box">DOM tree</span><span class="arr">+</span><span class="box">CSS rules</span><span class="arr">&rarr;</span><span class="box">Layout<small>sizes and positions</small></span><span class="arr">&rarr;</span><span class="box">Paint<small>draw layers</small></span><span class="arr">&rarr;</span><span class="box">Composite<small>GPU assembles</small></span></div>
<p>The browser reads HTML top to bottom and builds a tree of elements called the <b>DOM</b>. CSS tells it how each element looks. Layout works out where everything goes, paint draws it, and the graphics card puts the layers together. To feel smooth this must finish 60 times a second, which leaves about 16 milliseconds per frame. A normal script tag stops the reading of HTML until the script has downloaded and run, which is why scripts are marked <code>defer</code> or placed last.</p>
<h3>How a page runs code</h3>
<p>Each page has one <b>main thread</b>. It runs an <b>event loop</b>: take one task (a click, a timer, a network reply), run it to the end, update the screen, take the next. While one task runs, nothing else can happen. A task that takes 2 seconds freezes the page for 2 seconds. Heavy work belongs in a Web Worker, which is a second thread with no access to the page.</p>
<p><b>WebAssembly</b> lets compiled code (C#, C++, Rust) run in the browser at near-native speed. A Unity WebGL game is WebAssembly. It lives inside one block of memory called the heap, which has a hard ceiling. Large games reach that ceiling and stop with an out-of-memory error.</p>
<h3>Going deeper: the security model</h3>
<ul>
<li><b>Origin</b> = scheme + host + port. <code>https://a.com</code>, <code>http://a.com</code> and <code>https://a.com:8443</code> are three different origins.</li>
<li><b>Same-origin policy:</b> code from one origin cannot read pages, responses or storage belonging to another. Without this rule, any site you opened could read your bank's page in the next tab.</li>
<li><b>CORS</b> is how a server grants an exception: it sends a header naming the origins allowed to read its responses.</li>
<li><b>Cookies</b> are sent automatically with every request to their site. That convenience is the root of an attack called CSRF (lesson 5.2).</li>
<li><b>Process isolation:</b> Chrome runs each site in its own locked-down process. An attacker who breaks the page must then also break out of the sandbox. This is why browsers use so much memory.</li>
</ul>
<p>Every web security bug in module 5 is a consequence of these rules, and every front-end speed problem lives in the pipeline above.</p>
<h3>Going deeper: what a browser remembers</h3>
<table>
<tr><th>Store</th><th>Size</th><th>Notes</th></tr>
<tr><td>HTTP cache</td><td>Large</td><td>Controlled by the server's Cache-Control header</td></tr>
<tr><td>Cookies</td><td>4 KB each</td><td>Sent with every request</td></tr>
<tr><td>localStorage</td><td>About 5 MB</td><td>Simple, blocks the main thread</td></tr>
<tr><td>IndexedDB</td><td>Large</td><td>A real database, asynchronous</td></tr>
<tr><td>Service worker</td><td>Code, not data</td><td>A script that sits between the page and the network. It can serve an old version of your app until it is replaced.</td></tr>
</table>`,
    tryNote: 'Open any website in Chrome, press Option+Command+J to open the console, and paste each line.',
    try: [
      ['location.origin', 'The origin of the page you are on.'],
      ["performance.getEntriesByType('navigation')[0].toJSON()", 'Timings for this page load: DNS lookup, connect, TLS, response. The same chain you will study in module 1.'],
      ["fetch('https://example.com').then(r => r.text()).then(t => console.log(t.length)).catch(e => console.log('blocked:', e.message))", 'The same-origin policy at work. Unless example.com allows it, the page may not read the response.'],
      ['navigator.hardwareConcurrency', 'How many cores the browser can use for workers.']
    ],
    own: `Serve two different projects from the same address, one after the other, for example both on <code>http://localhost:3000</code>. They share one origin, so they share storage, cookies and any service worker. Using the definition of origin above, explain why a service worker left behind by the first project can break the second, and why moving one project to another port fixes it.`,
    terms: [['browser', '瀏覽器'], ['rendering engine', '排版引擎'], ['DOM', '文件物件模型'], ['origin', '來源'], ['same-origin policy', '同源政策'], ['sandbox', '沙盒'], ['cookie', 'Cookie'], ['service worker', 'Service Worker'], ['main thread', '主執行緒']],
    quiz: [
      { q: "Which three things together make up an origin?",
        a: ["Domain, path and query string", "Scheme, host and port", "IP address, cookie and session", "Username, password and token"], c: 1,
        why: "Scheme + host + port. Change any one and the browser treats it as a different origin with its own storage." },
      { q: "A page runs a JavaScript loop that takes 3 seconds. What does the user experience, and why?",
        a: ["Nothing, scripts run in the background", "Only images stop loading", "The whole page freezes, because the main thread runs one task at a time", "The browser moves the loop to another core automatically"], c: 2,
        why: "The event loop cannot handle clicks or redraw the screen until the current task finishes." },
      { q: "What does the same-origin policy prevent?",
        a: ["A site loading images from another site", "Code on one site reading data that belongs to another site", "Two tabs being open at once", "Cookies being stored"], c: 1,
        why: "Loading resources across origins is allowed. Reading another origin's responses, pages or storage is not, unless that origin opts in with CORS." }
    ]
  },
  {
    id: 'srv-what', lv: 1, mins: 10,
    title: 'What a server is',
    zh: '伺服器有兩個意思：一台一直開著的機器，以及機器上「等別人來問、然後回答」的程式。程式要先在某個連接埠上「聆聽」才連得到。',
    body: `
<p>&ldquo;Server&rdquo; means two things, and people switch between them without warning. It is a <b>machine</b> that stays on and reachable. It is also a <b>program</b> on that machine that waits for requests and answers them. One machine usually runs several server programs.</p>
<h3>The machine</h3>
<p>A server has the same parts as your laptop, with no screen and more of everything, in a building that provides power, cooling and network. You almost never rent a whole one:</p>
<table>
<tr><th>Kind</th><th>What you get</th><th>Starts in</th><th>Example</th></tr>
<tr><td>Bare metal</td><td>The whole physical machine</td><td>Hours</td><td>A rented rack server</td></tr>
<tr><td>Virtual machine</td><td>A slice of a machine that behaves like a whole one, with its own operating system</td><td>A minute</td><td>EC2, Lightsail</td></tr>
<tr><td>Container</td><td>An isolated process sharing the host's operating system</td><td>A second</td><td>Docker</td></tr>
<tr><td>Serverless function</td><td>Your code is run on demand and you never see a machine</td><td>Milliseconds, once warm</td><td>AWS Lambda</td></tr>
</table>
<h3>The program</h3>
<p>A server program does three things in a loop: <b>listen</b> on an address and port, <b>accept</b> a connection, and <b>answer</b>. Until a program is listening, nothing can connect, no matter what the firewall says.</p>
<div class="flow"><span class="box">Reverse proxy<small>nginx, Caddy</small></span><span class="arr">&rarr;</span><span class="box">App server<small>your code</small></span><span class="arr">&rarr;</span><span class="box">Database server<small>Postgres, Redis</small></span></div>
<p>Programs that have no port at all are <b>workers</b>: they pull jobs from a queue or run on a timer. A long-running background program is called a <b>service</b> or daemon, and on Linux a manager called systemd starts it at boot and restarts it when it dies.</p>
<h3>Going deeper: why Linux, and why no screen</h3>
<p>Almost all servers run Linux because it is free, stable, and everything about it can be scripted. You control one over <b>SSH</b>, an encrypted remote terminal. No screen means no clicking, which sounds like a limit and is in fact the point: anything typed can be saved, reviewed, and repeated on a thousand machines.</p>
<h3>Going deeper: stateless and stateful</h3>
<p>A <b>stateless</b> server keeps nothing between requests. Any copy can answer any request, so you scale by adding copies and you can kill one at any time. A <b>stateful</b> server holds something that matters (a database, a game room in memory). It needs backups, careful restarts and a plan for when it dies. Half of system design is pushing state out of as many servers as possible.</p>`,
    tryNote: 'Run on your Mac. Use two terminal windows.',
    try: [
      ['python3 -m http.server 8765', 'You are now running a web server. Leave it running.'],
      ['curl -i http://localhost:8765/', 'In the second window: a client asking, and your server answering.'],
      ['lsof -nP -iTCP:8765 -sTCP:LISTEN', 'The process that is listening on port 8765. Then stop the server with Control+C.']
    ],
    own: `List the server programs on a machine you run, by role, ignoring container names. Which one is the reverse proxy? Which are app servers? Which are databases? Which are workers with no port? Mark each as stateless or stateful. The stateful ones are the ones that need backups.`,
    terms: [['server', '伺服器'], ['virtual machine', '虛擬機'], ['port', '連接埠'], ['listen', '聆聽'], ['daemon / service', '常駐服務'], ['stateless', '無狀態'], ['stateful', '有狀態'], ['reverse proxy', '反向代理']],
    quiz: [
      { q: "A program is running on a server and the firewall allows port 8080, but connections are refused. What is the most likely reason?",
        a: ["The program is not listening on port 8080", "The server has too much memory", "DNS has not updated", "The certificate expired"], c: 0,
        why: "Refused means the machine answered and nothing was listening there. Wrong port, or the program only listens on 127.0.0.1." },
      { q: "Why can you add more copies of a stateless server freely?",
        a: ["They use no memory", "They need no network", "No copy holds anything the others lack, so any of them can answer any request", "They never crash"], c: 2,
        why: "State lives elsewhere (a database, Redis), so copies are interchangeable." }
    ]
  },
  {
    id: 'fnd-cloud', lv: 1, mins: 10,
    title: 'What the cloud is',
    zh: '雲端就是「用 API 按小時租別人的電腦」。雲端商負責機房與硬體，你負責自己機器裡的設定、權限、資料——大多數雲端資安事故都出在客戶自己設錯。',
    body: `
<p>The cloud is other people's computers, rented by the hour through an API. You do not buy hardware, you can have a hundred machines in a minute and give them back an hour later, and the provider also sells ready-made services so you do not have to run everything yourself.</p>
<h3>Three levels of &ldquo;they do it for you&rdquo;</h3>
<table>
<tr><th>Level</th><th>You manage</th><th>They manage</th><th>AWS examples</th></tr>
<tr><td>Infrastructure</td><td>Operating system and everything above</td><td>Building, hardware, virtualisation</td><td>EC2, Lightsail</td></tr>
<tr><td>Managed service</td><td>Configuration and your data</td><td>Installation, patching, backups, failover</td><td>RDS (databases), load balancers, EKS</td></tr>
<tr><td>Serverless</td><td>Your code or your files</td><td>All machines and scaling</td><td>Lambda, S3</td></tr>
</table>
<h3>The building blocks</h3>
<table>
<tr><th>Need</th><th>AWS name</th></tr>
<tr><td>A machine</td><td>EC2</td></tr>
<tr><td>A disk for it</td><td>EBS</td></tr>
<tr><td>File storage reached over HTTP</td><td>S3</td></tr>
<tr><td>A private network</td><td>VPC</td></tr>
<tr><td>A database</td><td>RDS</td></tr>
<tr><td>A load balancer</td><td>ELB (ALB, NLB)</td></tr>
<tr><td>Who may do what</td><td>IAM</td></tr>
<tr><td>DNS</td><td>Route 53</td></tr>
<tr><td>A CDN</td><td>CloudFront</td></tr>
<tr><td>Metrics and logs</td><td>CloudWatch</td></tr>
</table>
<p>Google Cloud and Azure have the same pieces under other names. Learn one well and the others take a week.</p>
<h3>Regions and zones</h3>
<p>A <b>region</b> is a city-sized area such as Tokyo. Inside it are several <b>availability zones</b>: separate datacenters, from a few to tens of kilometres apart, with fast links between them. Spreading across two zones survives a datacenter failure for little extra cost. Spreading across regions survives a regional disaster and is much harder.</p>
<h3>Going deeper: who is responsible for security</h3>
<div class="note">The provider secures the cloud itself: buildings, hardware, the virtualisation layer. <b>You</b> secure what you put in it: operating system patches, firewall rules, who has access, your data and your code.</div>
<p>This is the <b>shared responsibility model</b>. Nearly all cloud breaches come from the customer's side: a storage bucket left public, a database open to the internet, a leaked access key.</p>
<h3>Going deeper: how the bill works</h3>
<ul>
<li><b>On-demand:</b> pay by the hour, stop any time. The most expensive rate.</li>
<li><b>Commitment</b> (reserved instances, savings plans): promise 1 or 3 years and pay much less.</li>
<li><b>Spot:</b> spare capacity at a deep discount that can be taken back with two minutes' notice. Good for work that can be interrupted.</li>
<li><b>Data leaving the cloud</b> is charged per gigabyte, and it is the line that surprises people.</li>
</ul>`,
    tryNote: 'Run on your Mac, if the AWS command line is set up. Both commands only read.',
    try: [
      ['aws sts get-caller-identity', 'Which identity your Mac uses when it talks to AWS.'],
      ['aws ec2 describe-regions --query "Regions[].RegionName" --output text', 'Every region you could launch a machine in.']
    ],
    own: `Open last month's cloud bill. Write down the three largest lines and label each one compute, storage or data transfer. For each, ask whether a one-year commitment or a smaller size would cut it without any downtime. If you have no cloud account yet, use the provider's pricing calculator to price one small server, one managed database and 100 GB of outgoing traffic.`,
    terms: [['cloud', '雲端'], ['region', '區域'], ['availability zone', '可用區'], ['managed service', '代管服務'], ['shared responsibility model', '共同責任模型'], ['on-demand', '隨需計費']],
    quiz: [
      { q: "You run an EC2 instance. Who must install operating system security patches on it?",
        a: ["AWS, always", "You", "Nobody, the cloud is patched automatically", "The domain registrar"], c: 1,
        why: "On a virtual machine the provider's responsibility ends at the virtualisation layer. The operating system is yours." },
      { q: "What is an availability zone?",
        a: ["A country where the provider has customers", "A separate datacenter, or group of them, inside one region", "A type of firewall rule", "A pricing plan"], c: 1,
        why: "Zones in a region are independent enough that one failing should not affect the others, and close enough for fast replication." }
    ]
  },
  {
    id: 'fnd-crypto', lv: 1, mins: 14,
    title: 'Cryptography in plain words',
    zh: '四個工具：雜湊（驗證沒被改）、對稱加密（同一把鑰匙）、非對稱加密（一對公私鑰）、數位簽章（證明是我發的）。永遠用現成的函式庫，絕不自己發明。',
    body: `
<p>Cryptography gives you four tools. Everything in security that sounds complicated (HTTPS, logins, blockchains, software updates) is a combination of these four.</p>
<h3>1. Hash: a fingerprint</h3>
<p>A hash function turns any input into a short fixed-size value. The same input always gives the same value, a one-character change gives a completely different one, and you cannot go backwards from the value to the input. Use it to check that a file was not altered, to name files by their content, and to commit to a value before revealing it. <b>SHA-256</b> is the standard.</p>
<h3>2. Symmetric encryption: one key</h3>
<p>The same key locks and unlocks. It is fast and used for all bulk data. The weakness is delivery: both sides need the key, and you cannot send it over the channel you are trying to protect. <b>AES-256-GCM</b> is the standard. The &ldquo;GCM&rdquo; part also detects tampering.</p>
<h3>3. Asymmetric encryption: a key pair</h3>
<p>Two keys that belong together. The <b>public key</b> can be given to anyone. The <b>private key</b> never leaves its owner. What one locks, only the other opens. This solves delivery, because the public key is not a secret. It is slow, so it is used only to set things up.</p>
<h3>4. Digital signature: proof of origin</h3>
<p>The owner signs a message with the private key. Anyone can check the signature with the public key. A valid signature proves two things: the message came from the holder of that private key, and it has not been changed since. Certificates, software updates, signed tokens and every blockchain transaction are signatures. A crypto wallet is a private key and nothing more.</p>
<h3>How HTTPS combines them</h3>
<div class="flow"><span class="box">Signature<small>the certificate proves who the server is</small></span><span class="arr">&rarr;</span><span class="box">Key exchange<small>both sides derive a shared secret</small></span><span class="arr">&rarr;</span><span class="box">Symmetric encryption<small>fast protection for the data</small></span></div>
<h3>Going deeper: the rules professionals follow</h3>
<ul>
<li><b>Never invent or implement cryptography yourself.</b> Use a well-known library and its highest-level function.</li>
<li><b>Randomness must come from the system's secure generator</b> (<code>crypto.randomBytes</code>, never <code>Math.random</code>). Session IDs, reset tokens and game outcomes built on weak randomness can be predicted.</li>
<li><b>Passwords get a slow hash</b> made for the purpose (argon2id, bcrypt). Plain SHA-256 is too fast: a graphics card tries billions per second.</li>
<li><b>The algorithm is public, the key is the secret.</b> Almost every real failure is a key that was stored badly, shared too widely, or never changed.</li>
<li><b>Good today:</b> SHA-256, AES-256-GCM, ChaCha20-Poly1305, Ed25519, ECDSA, RSA with 2048 bits or more. <b>Broken:</b> MD5, SHA-1, DES, RC4.</li>
<li>A <b>MAC</b> (HMAC) works like a signature made with a shared secret, so anyone holding the secret can both create and check it. It is how webhooks and HS256 tokens are verified.</li>
</ul>`,
    tryNote: 'Run on your Mac.',
    try: [
      ["printf 'hello' | shasum -a 256; printf 'hellp' | shasum -a 256", 'One letter changed, and the two fingerprints share nothing.'],
      ['openssl rand -hex 32', 'A fresh 256-bit key from the secure random generator.'],
      [`node -e "const c=require('crypto');const k=c.generateKeyPairSync('ed25519');const s=c.sign(null,Buffer.from('pay 10'),k.privateKey);console.log(c.verify(null,Buffer.from('pay 10'),k.publicKey,s),c.verify(null,Buffer.from('pay 99'),k.publicKey,s))"`, 'Sign a message, then verify it. The real message gives true. The altered one gives false.']
    ],
    own: `Fair online games often use &ldquo;commit and reveal&rdquo;: the server publishes the hash of a secret value before players act, and reveals the value afterwards. In three sentences, say which of the four tools this uses, and what the server could do to players if it were able to change the value after seeing their choices.`,
    terms: [['hash', '雜湊'], ['symmetric encryption', '對稱加密'], ['asymmetric encryption', '非對稱加密'], ['public key', '公鑰'], ['private key', '私鑰'], ['digital signature', '數位簽章'], ['key exchange', '金鑰交換']],
    quiz: [
      { q: "What does a valid digital signature prove?",
        a: ["The message is encrypted", "The message came from the holder of the private key and was not changed", "The sender's computer has no viruses", "The message is less than a day old"], c: 1,
        why: "Origin and integrity. A signature does not hide the message and says nothing about when it was made." },
      { q: "Which is the right tool for storing user passwords?",
        a: ["AES-256, so they can be decrypted when needed", "Base64", "SHA-256, because it is fast", "argon2id or bcrypt, because they are deliberately slow"], c: 3,
        why: "A password store must be one-way and slow to guess against. Fast hashes let an attacker try billions of guesses per second." },
      { q: "Why does HTTPS use asymmetric cryptography only at the start of a connection?",
        a: ["It is slow, so it is used to agree on a key and then fast symmetric encryption takes over", "It is illegal to use it for data", "It cannot encrypt text", "Browsers do not support it"], c: 0,
        why: "Asymmetric operations solve the key-delivery problem. The bulk of the data is then protected with a symmetric key." }
    ]
  }
  ]
});
