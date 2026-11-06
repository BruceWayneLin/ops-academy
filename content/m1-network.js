M({
  id: 'net', n: 1,
  title: 'Networking and Linux',
  zh: '網路與 Linux：一個請求怎麼走、怎麼看伺服器裡面',
  time: '4 to 6 weeks',
  blurb: 'How a request really travels, and how to look inside a server. Every later module assumes this one.',
  lessons: [
  {
    id: 'net-journey', lv: 1, mins: 10,
    title: 'The journey of one request',
    zh: '從點連結到畫面出現，中間經過 DNS、TCP、TLS、HTTP、負載平衡、應用程式、資料庫。出事時就照這條鏈一站一站查。',
    body: `
<p>Almost everything in this course is one picture seen from different angles: what happens between tapping a link and seeing a page. Learn this chain by heart. When something is &ldquo;down&rdquo;, you walk it from left to right and find the first step that fails.</p>
<div class="widget" data-w="journey"></div>
<h3>Why this comes first</h3>
<ul>
<li><b>Every outage is one of these steps failing.</b> &ldquo;The site is down&rdquo; can mean DNS is wrong, a firewall drops the connection, the certificate expired, the app crashed, or the database is slow. Each has a different fix.</li>
<li><b>Every scaling technique moves or multiplies one of these steps.</b> A CDN answers at step 6 so the request never reaches you. A load balancer multiplies step 7. Caches and replicas protect step 8.</li>
<li><b>Every security control guards one of them.</b> TLS protects the wire. A firewall limits who can begin step 3. Login checks happen at step 7.</li>
</ul>
<p>The command below times each step of a real request. Run it a few times. The first run is slower because nothing is cached yet.</p>`,
    tryNote: 'Run on your Mac.',
    try: [
      ['curl -s -o /dev/null -w "dns %{time_namelookup}s | tcp %{time_connect}s | tls %{time_appconnect}s | first byte %{time_starttransfer}s | total %{time_total}s\\n" https://example.com',
       'Each number is the time since the start. The gaps between them are the cost of DNS, the TCP handshake, the TLS handshake, and the server thinking.']
    ],
    own: `Run the timing command against a site you run, and against two sites you use every day. Which gap is the largest in each? To a server in a nearby country the TCP step should take a few tens of milliseconds. If &ldquo;first byte&rdquo; is far behind &ldquo;tls&rdquo;, the time is being spent inside the server.`,
    terms: [['request', '請求'], ['response', '回應'], ['handshake', '交握'], ['outage', '服務中斷']],
    quiz: [
      { q: "The timing command shows DNS taking 2.1 seconds and every other step under 50 ms. Where is the problem?",
        a: ["The database", "The application code", "Name resolution", "The certificate"], c: 2,
        why: "Only the lookup is slow. Check the resolver being used and the domain's DNS provider." },
      { q: "Which step proves you are talking to the real server and not an impostor?",
        a: ["DNS", "The TCP handshake", "The TLS certificate check", "The HTTP status code"], c: 2,
        why: "DNS and TCP only get you connected to an address. The certificate ties that server to the name you asked for." }
    ]
  },
  {
    id: 'net-ip', lv: 1, mins: 12,
    title: 'IP addresses, subnets and NAT',
    zh: 'IP 位址是機器的門牌；/24 這種寫法表示前 24 個位元是「網路」、剩下的給機器。私有位址上不了網際網路，要靠 NAT 轉換。',
    body: `
<p>An <b>IP address</b> is the address of a machine on a network. IPv4 addresses are 32 bits, written as four numbers from 0 to 255: <code>203.0.113.7</code>.</p>
<h3>Reading CIDR notation</h3>
<p><code>10.0.1.0/24</code> means &ldquo;the first 24 bits are fixed and name the network, the remaining 8 bits number the machines in it&rdquo;. Eight free bits give 256 addresses. Each bit you free doubles the size: /23 is 512, /16 is 65,536. Try some:</p>
<div class="widget" data-w="cidr"></div>
<h3>Private and public</h3>
<table>
<tr><th>Range</th><th>Meaning</th></tr>
<tr><td><code>10.0.0.0/8</code>, <code>172.16.0.0/12</code>, <code>192.168.0.0/16</code></td><td>Private. Free for anyone to use inside their own network, never routed on the internet.</td></tr>
<tr><td><code>127.0.0.1</code></td><td>This machine itself (&ldquo;localhost&rdquo;).</td></tr>
<tr><td><code>0.0.0.0</code> as a listen address</td><td>&ldquo;Every network interface on this machine&rdquo;, including the public one.</td></tr>
<tr><td><code>169.254.169.254</code></td><td>The cloud metadata service. Remember it for lesson 5.2.</td></tr>
</table>
<h3>NAT: how private machines reach the internet</h3>
<p>Your laptop has a private address. When it sends a packet out, the router replaces the source with its own public address and remembers the swap, so the reply can be passed back. This is <b>NAT</b>. A side effect is that machines behind it can call out but nobody outside can call in.</p>
<h3>In the cloud</h3>
<p>A <b>VPC</b> is your private network, for example <code>10.0.0.0/16</code>, cut into subnets. A <b>public subnet</b> has a route to the internet. A <b>private subnet</b> has none, and its machines reach out through a NAT gateway. Load balancers go in public subnets. Databases go in private ones and are never given a public address.</p>
<div class="warn"><b>A common accident.</b> <code>docker run -p 6379:6379</code> publishes that port on <code>0.0.0.0</code>, which means the whole internet. On Linux, Docker writes its own firewall rules, so a host firewall such as ufw does not stop it. Publish on localhost only (<code>-p 127.0.0.1:6379:6379</code>) unless the world should reach it.</div>
<h3>Going deeper: IPv6</h3>
<p>IPv4 has about 4.3 billion addresses and they ran out. IPv6 addresses are 128 bits, written in hexadecimal: <code>2001:db8::1</code>. There are enough that NAT is unnecessary. Both versions run side by side today. For now, know that it exists and that a firewall rule for IPv4 does not cover IPv6.</p>`,
    tryNote: 'Run on your Mac.',
    try: [
      ['ifconfig | grep "inet "', 'Your addresses. 127.0.0.1 is yourself. The other is your private address on the home network.'],
      ['curl -s https://checkip.amazonaws.com', 'The public address the internet sees. It belongs to your router: NAT at work.']
    ],
    own: `On a server where you run containers, run <code>docker ps --format "{{.Names}}  {{.Ports}}"</code> and list every port published as <code>0.0.0.0</code>. For each one, ask: should the whole internet be able to reach this directly? Databases, Redis and admin tools should not appear in that list.`,
    terms: [['IP address', 'IP 位址'], ['subnet', '子網路'], ['CIDR', '無類別域間路由'], ['private address', '私有位址'], ['NAT', '網路位址轉譯'], ['VPC', '虛擬私有雲']],
    quiz: [
      { q: "How many addresses are in a /26 block?",
        a: ["26", "64", "256", "1,024"], c: 1,
        why: "32 - 26 leaves 6 free bits, and 2 to the power 6 is 64." },
      { q: "Which of these is a private address?",
        a: ["172.32.0.1", "192.169.1.1", "172.20.5.9", "11.0.0.1"], c: 2,
        why: "The private 172 range runs from 172.16 to 172.31. The other three are public." },
      { q: "A database container is started with -p 5432:5432 on a cloud machine. Who can try to connect?",
        a: ["Only other containers", "Only localhost", "Anyone on the internet, unless the cloud firewall blocks the port", "Nobody until a DNS record exists"], c: 2,
        why: "Without an address in front, Docker publishes on every interface." }
    ]
  },
  {
    id: 'net-dns', lv: 1, mins: 10,
    title: 'DNS: names to numbers',
    zh: 'DNS 是網路的電話簿，把網域換成 IP。答案會被快取一段時間（TTL），所以改了紀錄不會馬上生效。誰控制你的 DNS 帳號，誰就控制你的網站。',
    body: `
<p>People remember names and machines need numbers. <b>DNS</b> is the system that turns <code>example.com</code> into an IP address. It is the first step of every connection, so when DNS breaks, everything looks broken.</p>
<h3>How a lookup works</h3>
<div class="flow"><span class="box">Your device</span><span class="arr">&rarr;</span><span class="box">Resolver<small>your provider, 8.8.8.8, 1.1.1.1</small></span><span class="arr">&rarr;</span><span class="box">Root servers<small>&ldquo;ask .com&rdquo;</small></span><span class="arr">&rarr;</span><span class="box">.com servers<small>&ldquo;ask their name servers&rdquo;</small></span><span class="arr">&rarr;</span><span class="box hot">Authoritative server<small>holds your records</small></span></div>
<p>The resolver does this walk once and then <b>caches</b> the answer for the number of seconds the record's <b>TTL</b> says. Your device and browser cache it too.</p>
<h3>Record types</h3>
<table>
<tr><th>Type</th><th>Maps a name to</th><th>Used for</th></tr>
<tr><td>A</td><td>An IPv4 address</td><td>The basic record</td></tr>
<tr><td>AAAA</td><td>An IPv6 address</td><td>Same, for IPv6</td></tr>
<tr><td>CNAME</td><td>Another name</td><td>Pointing <code>www</code> at a CDN or load balancer</td></tr>
<tr><td>MX</td><td>A mail server</td><td>Receiving email</td></tr>
<tr><td>TXT</td><td>Free text</td><td>Proving you own the domain, email anti-spoofing (SPF, DKIM)</td></tr>
<tr><td>NS</td><td>The name servers for the zone</td><td>Saying who is authoritative</td></tr>
</table>
<h3>What goes wrong</h3>
<ul>
<li><b>Changes are not instant.</b> After you change a record, caches keep the old answer until the TTL runs out. Before a migration, lower the TTL to 60 to 300 seconds a day ahead, and raise it again afterwards.</li>
<li><b>A CNAME cannot sit on the bare domain</b> (<code>example.com</code> with nothing in front). Providers offer &ldquo;ALIAS&rdquo; or &ldquo;flattening&rdquo; to get around this.</li>
<li><b>DNS is a single point of failure.</b> If your DNS provider is down, so are you, even when every server is healthy.</li>
<li><b>Expired domains.</b> A forgotten renewal takes everything offline on a calendar date.</li>
</ul>
<h3>Going deeper: DNS as a security boundary</h3>
<p>Whoever controls your DNS can point your name at their own server and obtain a valid certificate for it. Protect the registrar account and the DNS provider account with multi-factor login, and treat them as the most sensitive accounts you own after the cloud root account.</p>
<h3>Going deeper: DNS for routing traffic</h3>
<p>Managed DNS can answer differently depending on conditions: return several addresses to spread load, answer with the nearest region, or stop returning an address that fails a health check. It is the simplest form of global load balancing. Its weakness is the TTL: clients keep using a dead address until their cache expires.</p>`,
    tryNote: 'Run on your Mac.',
    try: [
      ['dig +short example.com', 'Just the answer.'],
      ['dig example.com +noall +answer', 'The answer with its TTL in seconds (the second column). Run it twice and watch the number count down: you are seeing a cache.'],
      ['dig example.com NS +short', 'Which servers are authoritative for the domain.'],
      ['dig +trace example.com | tail -12', 'The whole walk from the root down.']
    ],
    own: `Find where each of your domains is registered and where its DNS is hosted. Is multi-factor login on for both accounts? What TTL do your main records have? If you moved the site to a new server today, that TTL is how long visitors would keep arriving at the old one.`,
    terms: [['domain name', '網域名稱'], ['resolver', '解析器'], ['authoritative server', '權威伺服器'], ['TTL', '存活時間'], ['record', '紀錄'], ['registrar', '網域註冊商']],
    quiz: [
      { q: "You change an A record whose TTL is 3600. Thirty minutes later some users still reach the old server. Why?",
        a: ["The change failed", "Their resolvers are still serving the cached answer until its TTL expires", "TCP is retrying", "The certificate is cached"], c: 1,
        why: "Caches keep an answer for the TTL. Up to an hour of mixed traffic is expected here." },
      { q: "Which record points one name at another name?",
        a: ["A", "MX", "TXT", "CNAME"], c: 3,
        why: "A CNAME is an alias. An A record points at an address." }
    ]
  },
  {
    id: 'net-tcp', lv: 2, mins: 12,
    title: 'TCP, UDP and ports',
    zh: 'IP 找到機器，連接埠找到程式。TCP 保證資料完整照順序到；UDP 丟出去就不管。「連線被拒」是沒人在聽，「逾時」多半是防火牆擋掉。',
    body: `
<p>IP gets a packet to the right machine. A <b>port</b>, a number from 0 to 65,535, picks the program on that machine. Well-known ones: 22 SSH, 53 DNS, 80 HTTP, 443 HTTPS, 5432 PostgreSQL, 3306 MySQL, 6379 Redis.</p>
<h3>Two ways to send</h3>
<table>
<tr><th></th><th>TCP</th><th>UDP</th></tr>
<tr><td>Model</td><td>A connection: a reliable two-way stream</td><td>Separate messages, sent and forgotten</td></tr>
<tr><td>Lost packets</td><td>Sent again automatically</td><td>Lost</td></tr>
<tr><td>Order</td><td>Guaranteed</td><td>Not guaranteed</td></tr>
<tr><td>Cost</td><td>A handshake first, and waiting when packets are lost</td><td>None</td></tr>
<tr><td>Used by</td><td>Web, databases, SSH, email</td><td>DNS, voice and video, fast-action games, HTTP/3</td></tr>
</table>
<p>TCP opens with a three-step <b>handshake</b>: SYN, SYN-ACK, ACK. That is one round trip before any data, which is why reusing connections matters so much.</p>
<h3>Reading the three error messages</h3>
<table>
<tr><th>Message</th><th>What happened</th><th>Usual cause</th></tr>
<tr><td><b>Connection refused</b></td><td>The machine answered &ldquo;nothing here&rdquo;</td><td>The program is not running, or listens on another port or only on 127.0.0.1</td></tr>
<tr><td><b>Connection timed out</b></td><td>No answer at all</td><td>A firewall is silently dropping the packets, or the address is wrong</td></tr>
<tr><td><b>Connection reset</b></td><td>An open connection was cut</td><td>The other side crashed, or something in the middle closed an idle connection</td></tr>
</table>
<p>This table alone solves a large share of &ldquo;I cannot connect&rdquo; problems.</p>
<h3>Going deeper: limits that appear at scale</h3>
<ul>
<li><b>Every connection uses a file descriptor</b> and some memory on the server. The default limit on many Linux systems is 1,024 per process. A server meant to hold many connections must raise it.</li>
<li><b>Outgoing connections use up local ports.</b> Each connection from one machine to the same destination needs its own local port, from a range of about 28,000. An app that opens a new connection to the database for every request can run out. The cure is to reuse connections: keep-alive and pooling.</li>
<li><b>Idle connections get cut.</b> NAT devices and load balancers forget a connection that has been silent for a while, anywhere from 60 seconds to a few minutes. Long-lived connections such as WebSockets must send a small heartbeat more often than the shortest timeout on the path.</li>
</ul>`,
    tryNote: 'Run on your Mac.',
    try: [
      ['nc -vz example.com 443', 'Succeeds: something is listening and nothing blocks the way.'],
      ['nc -vz -w 3 example.com 81', 'Times out: a firewall drops the packets without replying.'],
      ['nc -vz localhost 9', 'Refused: your own machine answers that nothing listens on port 9.'],
      ['lsof -nP -iTCP -sTCP:LISTEN', 'Every program on your Mac that is waiting for connections, and on which port.']
    ],
    own: `If something you run holds a WebSocket or another long-lived connection, find its heartbeat interval in the code, then find the idle timeout of whatever stands in front of the server (the nginx default for a silent upstream is 60 seconds). The heartbeat must be the shorter of the two, or idle users will be cut off.`,
    terms: [['port', '連接埠'], ['connection', '連線'], ['timeout', '逾時'], ['connection refused', '連線被拒'], ['heartbeat', '心跳'], ['keep-alive', '保持連線']],
    quiz: [
      { q: "What does &quot;connection refused&quot; tell you?",
        a: ["A firewall dropped the packet", "The machine was reached, and no program is listening on that port", "DNS failed", "The certificate is invalid"], c: 1,
        why: "A refusal is an active answer from the machine. Check that the program is running and which address and port it listens on." },
      { q: "A connection attempt hangs and then times out. What is the most likely cause?",
        a: ["A firewall silently dropping the packets", "The program crashed after connecting", "A wrong password", "An HTTP 404"], c: 0,
        why: "Silence usually means a firewall or security group rule, or a wrong address." },
      { q: "Why do WebSocket connections need a heartbeat?",
        a: ["To encrypt the data", "Because devices in the path close connections that stay silent too long", "To make DNS faster", "To use less memory"], c: 1,
        why: "Load balancers and NAT devices drop idle connections. Regular small messages keep the connection counted as active." }
    ]
  },
  {
    id: 'net-tls', lv: 2, mins: 12,
    title: 'TLS and certificates',
    zh: 'TLS 做三件事：加密、防竄改、證明對方身分。憑證是「公鑰＋網域名稱」加上憑證機構的簽章。憑證過期是最常見的自找當機，一定要自動更新。',
    body: `
<p><b>TLS</b> is the &ldquo;S&rdquo; in HTTPS. It does three jobs for a connection: nobody on the path can read it (encryption), nobody can change it without being noticed (integrity), and the client knows it reached the real server (authentication).</p>
<h3>What a certificate is</h3>
<p>A certificate is a small file saying &ldquo;this public key belongs to <code>example.com</code>&rdquo;, signed by a <b>certificate authority</b> (CA). Your device ships with a list of authorities it trusts. The check goes up a chain:</p>
<div class="flow"><span class="box">Your certificate<small>example.com</small></span><span class="arr">signed by</span><span class="box">Intermediate CA</span><span class="arr">signed by</span><span class="box hot">Root CA<small>already trusted by the device</small></span></div>
<p>The browser also checks that the name matches the site it asked for and that the dates are valid. Then the server proves it holds the matching private key, both sides agree on session keys, and the encrypted conversation begins. With TLS 1.3 this takes one round trip.</p>
<h3>Operating it</h3>
<ul>
<li><b>Certificates expire.</b> Free ones last 90 days or less, and the longest life allowed for any public certificate is being cut in steps, down to 47 days by 2029. Renewal must be automatic: Let's Encrypt with certbot, Caddy, or the cloud's certificate service. An expired certificate is one of the most common outages there is, and it is entirely self-inflicted.</li>
<li><b>Monitor the expiry date</b> from outside, with an alert two weeks ahead. Automation fails silently.</li>
<li><b>The private key stays on the server.</b> If it leaks, revoke the certificate and issue a new one.</li>
<li><b>Where TLS ends matters.</b> Usually a CDN, load balancer or nginx decrypts, and traffic behind it travels as plain HTTP inside your private network. That is acceptable in simple setups.</li>
</ul>
<h3>Going deeper</h3>
<ul>
<li><b>SNI:</b> the client states which hostname it wants at the start of the handshake, so one address can serve certificates for many sites.</li>
<li><b>Mutual TLS (mTLS):</b> the client presents a certificate too. Services use it to prove their identity to each other inside a network that trusts nobody by default.</li>
<li><b>HSTS:</b> a response header telling browsers to use HTTPS for this site from now on, which blocks downgrade tricks on public Wi-Fi.</li>
<li><b>Certificate Transparency:</b> every certificate issued is recorded in public logs. You can watch them to see if anyone obtains a certificate for your domain, and attackers read them to discover your subdomains.</li>
<li>TLS 1.0 and 1.1 are obsolete. Allow 1.2 and 1.3 only.</li>
</ul>`,
    tryNote: 'Run on your Mac.',
    try: [
      ['echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null | openssl x509 -noout -subject -issuer -dates', 'Who the certificate is for, who signed it, and when it expires.'],
      ['curl -sI http://example.com | head -5', 'Plain HTTP. A well-configured site answers with a redirect to HTTPS.']
    ],
    own: `List every hostname you serve. Run the first command against each and write down the expiry date. Then check two things: that renewal is automatic, and that something would warn you two weeks before a certificate expires if the automation quietly stopped working.`,
    terms: [['certificate', '憑證'], ['certificate authority', '憑證機構'], ['encryption', '加密'], ['integrity', '完整性'], ['authentication', '身分驗證'], ['expiry', '到期']],
    quiz: [
      { q: "What does a server's certificate prove to the browser?",
        a: ["That the server is fast", "That a trusted authority tied this public key to this domain name, and the server holds the matching private key", "That the site contains no malware", "That the user is logged in"], c: 1,
        why: "It proves identity for that name. It says nothing about whether the site's content is honest." },
      { q: "What is the most common cause of a sudden certificate error on a site that worked yesterday?",
        a: ["The certificate expired", "DNS changed", "The browser was updated", "The database is full"], c: 0,
        why: "Expiry happens on a fixed date. Automate renewal and alert on the date." }
    ]
  },
  {
    id: 'net-http', lv: 2, mins: 14,
    title: 'HTTP and WebSocket',
    zh: 'HTTP 是一問一答的文字協定；狀態碼告訴你錯在誰（4xx 是請求的問題、5xx 是伺服器的問題）。WebSocket 把連線留著雙向傳，所以容量要算「同時連線數」。',
    body: `
<p><b>HTTP</b> is a conversation in text. The client sends a <b>request</b>: a method (GET, POST), a path, some headers, sometimes a body. The server sends a <b>response</b>: a status code, headers, a body. Then the exchange is over.</p>
<h3>Status codes worth knowing by heart</h3>
<table>
<tr><th>Code</th><th>Meaning</th><th>What to check</th></tr>
<tr><td>200</td><td>OK</td><td></td></tr>
<tr><td>301 / 302</td><td>Moved, permanently or for now</td><td>Follow the Location header</td></tr>
<tr><td>304</td><td>Your cached copy is still good</td><td></td></tr>
<tr><td>400</td><td>The request is malformed</td><td>The client's data</td></tr>
<tr><td>401</td><td>Not logged in</td><td>Missing or expired token</td></tr>
<tr><td>403</td><td>Logged in, and not allowed</td><td>Permissions</td></tr>
<tr><td>404</td><td>No such thing</td><td>The path</td></tr>
<tr><td>429</td><td>Too many requests</td><td>A rate limit</td></tr>
<tr><td>500</td><td>The app crashed while handling it</td><td>Application logs</td></tr>
<tr><td>502</td><td>The proxy got no valid answer from the app</td><td>Is the app process running, on the right port?</td></tr>
<tr><td>503</td><td>No server available</td><td>Health checks, overload</td></tr>
<tr><td>504</td><td>The app took too long</td><td>What the app is waiting for, usually the database</td></tr>
</table>
<p>4xx means the request was at fault. 5xx means the server was. The difference between 502 and 504 tells you whether the app is dead or slow.</p>
<h3>HTTP is stateless</h3>
<p>Each request stands alone. The server does not remember the previous one. Identity travels with every request, in a cookie or a token. This is a gift for scaling: if no server remembers anything, any server can answer.</p>
<h3>Going deeper: versions</h3>
<ul>
<li><b>HTTP/1.1:</b> one request at a time per connection. Browsers open about six connections per site to work around it.</li>
<li><b>HTTP/2:</b> many requests at once over a single connection.</li>
<li><b>HTTP/3:</b> runs over QUIC, which is built on UDP. A lost packet delays only the stream it belongs to. Connections also survive a switch from Wi-Fi to mobile data.</li>
</ul>
<h3>Going deeper: caching headers</h3>
<p><code>Cache-Control: max-age=3600</code> lets browsers and CDNs reuse the response for an hour. <code>no-store</code> forbids keeping it. An <code>ETag</code> is a version stamp: the browser sends it back and gets a tiny 304 if nothing changed.</p>
<h3>WebSocket</h3>
<p>A WebSocket begins as an HTTP request asking to &ldquo;upgrade&rdquo;. The server answers 101, and the connection stays open with both sides free to send at any time. It is what your games use. It changes how you run servers:</p>
<ul>
<li>Capacity is measured in <b>connections held open</b>, not requests per second.</li>
<li>A user is tied to one server for the whole session.</li>
<li>A deploy or restart disconnects everyone on that server at the same moment. If every client reconnects immediately, the wave can knock the server over again. Clients should wait a random time that grows with each attempt (<b>backoff with jitter</b>).</li>
</ul>`,
    tryNote: 'Run on your Mac.',
    try: [
      ['curl -sv https://example.com -o /dev/null 2>&1 | grep -E "^[<>]"', 'The raw conversation. Lines starting with > are what you sent. Lines starting with < are the reply.'],
      ['curl -s -o /dev/null -w "%{http_code} over HTTP/%{http_version}\\n" https://www.google.com', 'The status code and protocol version.'],
      ['curl -sI https://example.com | grep -i -E "cache-control|etag|age"', 'How long this response may be cached.']
    ],
    own: `Take an app of yours that keeps a connection open. When the server restarts, every client reconnects at once. Read the client's reconnect code. Does each client wait a random and growing time, or do they all retry on the same fixed interval? The second pattern is the reconnect storm described above.`,
    terms: [['status code', '狀態碼'], ['header', '標頭'], ['stateless', '無狀態'], ['cache', '快取'], ['backoff', '退避重試'], ['jitter', '隨機抖動']],
    quiz: [
      { q: "nginx returns 504 for one endpoint. What does that tell you?",
        a: ["The app process is not running", "The app is running and took too long to answer", "The user is not logged in", "The path does not exist"], c: 1,
        why: "504 is a timeout waiting for the app. A dead app gives 502. Look at what the app is waiting on." },
      { q: "Why does statelessness make scaling easy?",
        a: ["Stateless servers are faster", "Any server can handle any request, so you can add servers behind a load balancer", "It removes the need for a database", "It encrypts traffic"], c: 1,
        why: "If no server holds anything unique, they are interchangeable." },
      { q: "After a restart, 50,000 clients all reconnect within one second. What should the clients have done?",
        a: ["Reconnected faster", "Waited a random, growing delay before each attempt", "Switched to HTTP/1.1", "Cleared their cookies"], c: 1,
        why: "Random delays spread the wave out so the server can absorb it." }
    ]
  },
  {
    id: 'net-lb', lv: 2, mins: 12,
    title: 'Load balancers and reverse proxies',
    zh: '反向代理是門口的接待員：對外收請求、對內轉給後面的服務。負載平衡器就是會分流、會把壞掉的機器踢出去的反向代理。',
    body: `
<p>A <b>reverse proxy</b> stands in front of your servers like a receptionist. Clients talk to it, and it passes each request to the right server behind. nginx, Caddy, HAProxy and Envoy are reverse proxies. Since every request passes through it, it is the natural place to end TLS, route by hostname or path, compress responses, and limit request rates.</p>
<p>A <b>load balancer</b> is a reverse proxy that spreads traffic over several identical servers and stops sending to the ones that are unhealthy.</p>
<div class="flow"><span class="box">Clients</span><span class="arr">&rarr;</span><span class="box hot">Load balancer</span><span class="arr">&rarr;</span><span class="box">App 1</span><span class="box">App 2</span><span class="box">App 3</span><span class="arr">&rarr;</span><span class="box">Database</span></div>
<h3>Two kinds</h3>
<table>
<tr><th></th><th>Layer 4</th><th>Layer 7</th></tr>
<tr><td>Sees</td><td>TCP connections</td><td>HTTP requests</td></tr>
<tr><td>Can route by</td><td>Address and port</td><td>Hostname, path, headers, cookies</td></tr>
<tr><td>Strength</td><td>Very fast, any protocol</td><td>Smart routing, retries, TLS handling</td></tr>
<tr><td>AWS name</td><td>NLB</td><td>ALB</td></tr>
</table>
<h3>How it chooses a server</h3>
<ul>
<li><b>Round robin:</b> each server in turn. Fine when requests are similar.</li>
<li><b>Least connections:</b> the server with the fewest open connections. Better for long-lived or uneven work such as WebSockets.</li>
<li><b>Hashing:</b> the same key (a user ID, a room ID) always lands on the same server.</li>
</ul>
<h3>Health checks</h3>
<p>Every few seconds the load balancer calls a small endpoint on each server, often <code>/healthz</code>. After a few failures the server is taken out of rotation, and it returns when it passes again. Design the endpoint with care. If it also tests the database, one database hiccup marks every server unhealthy at once, and the load balancer has nowhere to send anyone.</p>
<h3>Going deeper</h3>
<ul>
<li><b>Sticky sessions</b> pin a user to one server. Avoid them when you can: load becomes uneven and the user loses their session when that server dies. Keep sessions in a shared store. The exception is state that must live in one place, such as a game room. Route those by room ID.</li>
<li><b>Connection draining:</b> before removing a server, stop sending it new requests and let the ones in progress finish. Without it, every deploy cuts some users off.</li>
<li><b>The load balancer must not be a single point of failure.</b> Managed ones are redundant. One nginx on one machine is not.</li>
<li><b>The client's real address</b> arrives in the <code>X-Forwarded-For</code> header. Trust it only when it comes from your own proxy, since anyone can send that header.</li>
</ul>`,
    tryNote: 'Run on your Mac.',
    try: [
      ['curl -sI https://www.cloudflare.com | grep -i -E "^server|cf-ray|via"', 'The fingerprints a proxy leaves in response headers.'],
      ['for i in 1 2 3 4; do dig +short www.google.com | head -1; done', 'Large sites also balance at the DNS level. The address may differ between lookups.']
    ],
    own: `Draw one server you run. Which process receives port 443 first? To which services does it forward, and by what rule: hostname or path? If that one process is both your load balancer and your single point of failure, write down what a visitor to each of your sites sees while it restarts.`,
    terms: [['load balancer', '負載平衡器'], ['reverse proxy', '反向代理'], ['health check', '健康檢查'], ['sticky session', '黏性工作階段'], ['single point of failure', '單點故障'], ['connection draining', '連線排空']],
    quiz: [
      { q: "Which balancing method suits servers that hold long-lived WebSocket connections?",
        a: ["Round robin", "Least connections", "Random", "Alphabetical"], c: 1,
        why: "Connections last a long time and pile up unevenly. Sending new ones to the least-loaded server evens it out." },
      { q: "Why are sticky sessions best avoided for ordinary web requests?",
        a: ["They are slower to encrypt", "Load becomes uneven, and a user loses their session when their server dies", "Browsers block them", "They need more DNS records"], c: 1,
        why: "Keeping sessions in a shared store lets any server answer and lets servers be removed freely." },
      { q: "A health check endpoint also queries the database. The database has a 10-second hiccup. What happens?",
        a: ["Nothing", "Every app server fails its check at once and the load balancer has no healthy server left", "Only one server is removed", "The database restarts"], c: 1,
        why: "A shared dependency in the health check turns a small problem into a full outage." }
    ]
  },
  {
    id: 'net-fw', lv: 2, mins: 10,
    title: 'Firewalls and security groups',
    zh: '防火牆就是門口的名單：誰可以連哪個連接埠。原則是「預設全擋、需要才開」。資料庫、Redis、後台絕對不要對整個網際網路開放。',
    body: `
<p>A <b>firewall</b> is a list of rules about which connections are allowed: from which addresses, to which port. The only sane starting point is <b>default deny</b>. Nothing gets in unless a rule says so.</p>
<h3>Stateful and stateless</h3>
<p>A <b>stateful</b> firewall remembers connections. If your server makes a call out, the reply is allowed back in automatically. Cloud security groups and the Lightsail firewall work this way, so you only write rules for who may start a connection. A <b>stateless</b> filter judges every packet alone and needs rules for both directions.</p>
<h3>Three layers of defence</h3>
<div class="flow"><span class="box">Cloud firewall<small>security group</small></span><span class="arr">&rarr;</span><span class="box">Host firewall<small>ufw, nftables</small></span><span class="arr">&rarr;</span><span class="box">The program's listen address<small>127.0.0.1 or 0.0.0.0</small></span></div>
<h3>Sensible rules</h3>
<table>
<tr><th>Port</th><th>Allow from</th></tr>
<tr><td>80, 443</td><td>Anywhere</td></tr>
<tr><td>22 (SSH)</td><td>Your own address only. Better: closed, with access through the provider's console or a private network tool</td></tr>
<tr><td>Database, Redis, queues</td><td>Only the app servers. Never the internet</td></tr>
<tr><td>Admin panels, dashboards</td><td>A VPN or a short list of addresses</td></tr>
</table>
<div class="warn">The internet is scanned constantly. A newly opened port is found within minutes. A Redis or MongoDB left open with no password is usually taken over the same day.</div>
<h3>Going deeper</h3>
<ul>
<li><b>Security groups can name other security groups.</b> &ldquo;Allow 5432 from the group <i>app-servers</i>&rdquo; keeps working as servers come and go. This is how tiers are separated in a cloud network.</li>
<li><b>Outbound rules</b> are usually wide open. Tightening them limits what an intruder can do afterwards: download tools, send your data out.</li>
<li><b>Docker and host firewalls:</b> on Linux, published container ports bypass ufw. Rely on the cloud firewall, or publish on 127.0.0.1.</li>
<li><b>IPv6</b> needs its own rules. A port closed on IPv4 may be open on IPv6.</li>
</ul>`,
    tryNote: 'Run on your Mac, against your own server only. Replace YOUR_SERVER_IP.',
    try: [
      ['nc -vz -w 3 YOUR_SERVER_IP 443', 'Should succeed.'],
      ['for p in 22 3306 5432 6379 27017 9090 3000; do nc -vz -w 2 YOUR_SERVER_IP $p 2>&1 | tail -1; done', 'From outside, every one of these should time out or be refused, apart from any you opened on purpose.']
    ],
    own: `Open your cloud console and write down every inbound firewall rule for each server (in Lightsail it is under Networking, in EC2 it is the security group). Any rule that allows the whole internet (0.0.0.0/0) on a port other than 80 and 443 needs a reason written next to it, or it gets removed.`,
    terms: [['firewall', '防火牆'], ['security group', '安全群組'], ['default deny', '預設拒絕'], ['inbound', '傳入'], ['outbound', '傳出'], ['allowlist', '允許清單']],
    quiz: [
      { q: "What does &quot;stateful&quot; mean for a firewall?",
        a: ["It stores your data", "Replies to connections you were allowed to start are let back in automatically", "It only works in one country", "It blocks all UDP"], c: 1,
        why: "The firewall tracks each connection, so you write rules only for who may open one." },
      { q: "Who should be able to connect to your Redis port?",
        a: ["Anyone, if it has a password", "Only the app servers that use it, over the private network", "Any address in your country", "Nobody, including the app"], c: 1,
        why: "Data stores are internal. A password is a second layer, and the first is not being reachable." }
    ]
  },
  {
    id: 'lin-ops', lv: 2, mins: 14,
    title: 'Linux for operators',
    zh: '半夜出事要會的幾招：看哪個程式在跑、為什麼掛、磁碟記憶體滿了沒、誰在聽哪個連接埠。磁碟滿是最常見也最無聊的當機原因。',
    body: `
<p>This is the short list you need when a server misbehaves. Each line is a question and the command that answers it.</p>
<table>
<tr><th>Question</th><th>Command</th></tr>
<tr><td>Is the disk full?</td><td><code>df -h</code>, then <code>du -sh /var/* | sort -h</code> to find what is using it</td></tr>
<tr><td>Is memory exhausted?</td><td><code>free -m</code> (read the &ldquo;available&rdquo; column)</td></tr>
<tr><td>Is the CPU overloaded?</td><td><code>uptime</code> (load average), <code>top</code></td></tr>
<tr><td>What is running?</td><td><code>ps aux --sort=-%mem | head</code>, <code>systemctl status NAME</code></td></tr>
<tr><td>Why did it die?</td><td><code>journalctl -u NAME --since "1 hour ago"</code></td></tr>
<tr><td>Did the kernel kill it?</td><td><code>dmesg -T | grep -i -E "oom|killed"</code></td></tr>
<tr><td>What is listening?</td><td><code>ss -tlnp</code></td></tr>
<tr><td>Can I reach a dependency?</td><td><code>nc -vz host port</code>, <code>curl -v</code></td></tr>
<tr><td>What are the containers doing?</td><td><code>docker ps</code>, <code>docker logs --tail 100 NAME</code>, <code>docker stats</code></td></tr>
</table>
<h3>Ideas behind the commands</h3>
<ul>
<li><b>Load average</b> is roughly how many tasks are running or waiting, for the CPU or for the disk. Compare it with the core count. A load of 8 on 2 cores means work is waiting.</li>
<li><b>Signals.</b> SIGTERM asks a process to stop politely, and a good server finishes what it is doing first. SIGKILL stops it instantly.</li>
<li><b>systemd</b> starts services at boot and restarts them when they die.</li>
<li><b>Permissions.</b> Every file has read, write and execute bits for its owner, its group and everyone else. Private keys must be <code>chmod 600</code>. Services should run as their own user, never as root.</li>
<li><b>The OOM killer.</b> When memory runs out, the kernel kills a large process without asking. The app's own log will show nothing. The kernel log will.</li>
<li><b>Disk full is the most common dull outage.</b> Logs, old container images and old releases pile up. Rotate logs, clean images on a schedule, and raise an alert at 80%.</li>
</ul>
<h3>Going deeper: a safe SSH setup</h3>
<ul>
<li>Log in with keys only. Turn password login off.</li>
<li>No direct login as root.</li>
<li>Close port 22 to the world.</li>
<li>Keep the clock synchronised. TLS, one-time codes and log timestamps all depend on it.</li>
</ul>
<h3>Going deeper: everything is a file</h3>
<p>Linux exposes its own state as files. <code>/proc</code> holds a directory for every process, <code>/sys</code> holds kernel and device settings, and <code>/var/log</code> holds logs. Tools like <code>top</code> only read these files. Knowing this, you can inspect a system even when its tools are missing.</p>`,
    tryNote: 'Run on a Linux server over SSH. Every command only reads.',
    try: [
      ['df -h / && free -m && uptime', 'Disk, memory and load in one look.'],
      ['docker system df', 'How much disk Docker images, containers and volumes use, and how much can be reclaimed.'],
      ['sudo ss -tlnp', 'Every listening port and the program behind it.'],
      ['journalctl -p err --since today --no-pager | tail -20', 'Today\'s errors from all services.']
    ],
    own: `Check the disk usage of every server you run. Decide now what will warn you at 80%, so that you hear it from a machine before you hear it from a user. Lesson 4.1 gives you the tool.`,
    terms: [['load average', '平均負載'], ['signal', '訊號'], ['permission', '權限'], ['log', '日誌'], ['OOM killer', '記憶體不足終結機制'], ['log rotation', '日誌輪替']],
    quiz: [
      { q: "A process vanished. Its own log shows nothing unusual and memory use had been rising. Where do you look?",
        a: ["The DNS records", "The kernel log, for an out-of-memory kill", "The certificate", "The browser console"], c: 1,
        why: "The kernel kills without giving the process a chance to log. dmesg or the journal records it." },
      { q: "A 2-core machine shows a load average of 8. What does that mean?",
        a: ["It is 8% busy", "Far more work wants the CPU than there are cores, so tasks are waiting", "It has 8 GB of free memory", "Eight users are logged in"], c: 1,
        why: "Load roughly counts tasks running or waiting to run. Above the core count means queuing." }
    ]
  }
  ]
});
