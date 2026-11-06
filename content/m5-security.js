M({
  id: 'sec', n: 5,
  title: 'Security fundamentals',
  zh: '資安基礎：防守思維、網站攻擊、登入、機密管理、雲端權限、網路防護',
  time: '6 to 8 weeks, alongside modules 1 to 4',
  blurb: 'How systems are attacked and how they are defended. Start this module on day one and read it in parallel with the others.',
  lessons: [
  {
    id: 'sec-think', lv: 2, mins: 12,
    title: 'What security is, and how defenders think',
    zh: '資安不是「絕對不被駭」，而是管理風險：保護什麼、防誰、出事時損害多大。三個核心原則：最小權限、多層防禦、假設已被入侵。',
    body: `
<p><b>Security</b> is the work of keeping a system doing what its owner intends, even while someone is trying to make it do something else. No system is unbreakable. The aim is to manage <b>risk</b>: how likely something is, multiplied by how bad it would be.</p>
<h3>What is being protected</h3>
<table>
<tr><th>Property</th><th>Meaning</th><th>A failure looks like</th></tr>
<tr><td><b>Confidentiality</b></td><td>Only the right people can read it</td><td>Customer data published</td></tr>
<tr><td><b>Integrity</b></td><td>Only the right people can change it</td><td>Balances edited, code tampered with</td></tr>
<tr><td><b>Availability</b></td><td>It is there when needed</td><td>The site knocked offline</td></tr>
</table>
<h3>Threat modelling: four questions</h3>
<ol>
<li><b>What are we protecting?</b> List the assets: user funds, private keys, passwords, personal data, the admin panel.</li>
<li><b>What can go wrong?</b> Who would attack, and by which route? Automated scanners that hit everything. Cheats and fraudsters. Someone targeting the wallet. A stolen laptop. An insider.</li>
<li><b>What are we doing about each?</b></li>
<li><b>Did it work?</b> Test it.</li>
</ol>
<h3>The principles</h3>
<ul>
<li><b>Least privilege.</b> Every person and every program gets only the access its job needs. When one is compromised, the damage stays small.</li>
<li><b>Defence in depth.</b> Several independent layers. Assume each one will fail some day.</li>
<li><b>Assume breach.</b> Design so that an attacker who is already inside one part cannot reach everything. The size of what they can reach is called the <b>blast radius</b>.</li>
<li><b>Secure by default.</b> Closed unless opened on purpose.</li>
<li><b>Small attack surface.</b> Fewer open ports, fewer dependencies, fewer administrators.</li>
<li><b>Simplicity.</b> Complicated systems hide holes.</li>
</ul>
<h3>Going deeper: how break-ins really happen</h3>
<p>Films show clever exploits. Real incidents are mostly dull:</p>
<ul>
<li>A stolen or guessed password, often obtained by phishing or reused from another site that leaked.</li>
<li>A known flaw that had a fix available for months and was never applied.</li>
<li>A mistake in configuration: a database or storage bucket open to the internet, an admin panel with a default password.</li>
<li>A bug in the application's own access checks.</li>
</ul>
<p>Doing the basics well stops most attackers.</p>
<h3>Going deeper: STRIDE, a checklist for &ldquo;what can go wrong&rdquo;</h3>
<table>
<tr><th>Threat</th><th>Example</th></tr>
<tr><td><b>S</b>poofing</td><td>Pretending to be another user or server</td></tr>
<tr><td><b>T</b>ampering</td><td>Changing data in transit or in storage</td></tr>
<tr><td><b>R</b>epudiation</td><td>Denying an action because nothing recorded it</td></tr>
<tr><td><b>I</b>nformation disclosure</td><td>Reading what should be private</td></tr>
<tr><td><b>D</b>enial of service</td><td>Making it unavailable</td></tr>
<tr><td><b>E</b>levation of privilege</td><td>A normal user becoming an administrator</td></tr>
</table>
<p>Where money is involved, attackers are motivated and patient. Assume you are a target, and concentrate on limiting what any single failure can cost.</p>`,
    own: `Write a one-page threat model for a system you run. List the assets, most valuable first. List the ways in: the website, the API, the admin panel, SSH, the build process, your own laptop. For each asset, write the shortest path an attacker could take to it. Two short paths turn up again and again in real audits: a high-value key that every service can read, and an admin panel with no second login factor. Check whether either applies to you.`,
    terms: [['risk', '風險'], ['threat model', '威脅模型'], ['asset', '資產'], ['least privilege', '最小權限'], ['defence in depth', '縱深防禦'], ['attack surface', '攻擊面'], ['blast radius', '影響範圍']],
    quiz: [
      { q: "What is the purpose of least privilege?",
        a: ["To make logins faster", "To limit the damage when one account or program is compromised", "To reduce the cloud bill", "To remove the need for passwords"], c: 1,
        why: "An attacker inherits the access of whatever they take over. Less access means less damage." },
      { q: "Which is the most common way real systems are broken into?",
        a: ["Breaking modern encryption", "Stolen passwords, unpatched known flaws and configuration mistakes", "Guessing private keys", "Physical theft of servers"], c: 1,
        why: "Attackers take the easy route, and the easy route is usually a missed basic." },
      { q: "What does &quot;assume breach&quot; ask you to do?",
        a: ["Give up on prevention", "Design so that an attacker inside one part cannot reach the rest", "Tell customers they have been hacked", "Turn off logging"], c: 1,
        why: "Prevention still matters. This principle adds a second question: what happens when prevention fails?" }
    ]
  },
  {
    id: 'sec-web', lv: 3, mins: 15,
    title: 'Web application attacks',
    zh: '最常見的嚴重漏洞是「存取控制沒做好」（改個 ID 就看到別人的資料）。另外要懂注入、XSS、CSRF、SSRF。遊戲類再加一條：絕不相信客戶端送來的結果、金額、時間。',
    body: `
<p>These are the flaws found again and again in web applications. For each: what it is, a small example, and the defence. Practise them legally in the free labs at PortSwigger's Web Security Academy.</p>
<h3>Broken access control</h3>
<p>The server fails to check that this user may touch this object. It is the most common serious flaw.</p>
<pre><code>GET /api/orders/1001      your order
GET /api/orders/1002      someone else's, and the server returns it</code></pre>
<p><b>Defence:</b> on every request, check on the server that the logged-in user owns or may access the object. Never trust an ID, a role, a price or an &ldquo;isAdmin&rdquo; flag sent by the client. Deny by default. Test with two accounts.</p>
<h3>Injection</h3>
<p>Input from the user ends up being run as code.</p>
<pre><code>query = "SELECT * FROM users WHERE name = '" + name + "'"
name  = ' OR '1'='1          the query now returns every user</code></pre>
<p><b>Defence:</b> parameterised queries, always. The database then treats input as data and never as part of the command. The same idea applies to shell commands: never build one from user input.</p>
<h3>Cross-site scripting (XSS)</h3>
<p>An attacker gets their own script to run in other users' browsers, for example through a chat message that contains a script tag. The script acts as the victim: it can read the page, send requests and steal sessions.</p>
<p><b>Defence:</b> escape everything you display. Frameworks do this by default, so the danger is in the escape hatches: <code>v-html</code>, <code>innerHTML</code>, <code>dangerouslySetInnerHTML</code>. Add a Content-Security-Policy header and mark session cookies HttpOnly.</p>
<h3>Cross-site request forgery (CSRF)</h3>
<p>A malicious page makes the victim's browser send a request to your site. The browser attaches the victim's cookies automatically, so the request looks genuine.</p>
<p><b>Defence:</b> <code>SameSite</code> cookies, anti-CSRF tokens, and requiring a custom header on requests that change something.</p>
<h3>Server-side request forgery (SSRF)</h3>
<p>The server fetches a URL supplied by the user, and the attacker points it at an internal address. The classic target is <code>http://169.254.169.254/</code>, the cloud metadata service, which hands out the server's cloud credentials.</p>
<p><b>Defence:</b> allow only known destinations, block private address ranges, and require IMDSv2 on AWS.</p>
<h3>Security misconfiguration</h3>
<p>Default passwords. Debug mode left on. Error pages that show stack traces. A <code>.git</code> folder or <code>.env</code> file reachable from the web.</p>
<h3>Going deeper: flaws specific to games and money</h3>
<ul>
<li><b>Trusting the client.</b> The client is in the attacker's hands. It must never decide outcomes, balances, prices or timing. The server validates every action against the real state.</li>
<li><b>Race conditions.</b> Sending the same withdrawal twenty times at once to pass the balance check twenty times. The defence is the atomic update from lesson 3.2.</li>
<li><b>Replay.</b> Capturing a valid request and sending it again. Use one-time values and idempotency keys.</li>
<li><b>Logic abuse.</b> Using features exactly as built, in an order nobody imagined: bonuses claimed repeatedly, negative amounts, rounding in the player's favour.</li>
</ul>
<div class="warn"><b>The law.</b> Test only systems you own, or have written permission to test. Trying these against anyone else's site is a crime in Taiwan and almost everywhere else, even if you only look.</div>`,
    tryNote: 'Run on your Mac, against your own site only.',
    try: [
      ['for p in .env .git/config; do curl -s -o /dev/null -w "$p -> %{http_code}\\n" https://YOUR_SITE/$p; done', 'Both should print 403 or 404. If either prints 200, open that address in a browser. Unless it shows your normal app page, your secrets or source code are public.'],
      ['curl -sI https://YOUR_SITE | grep -i -E "content-security-policy|strict-transport|x-frame-options|set-cookie"', 'Which protective headers you send, and how your cookies are flagged.']
    ],
    own: `Create two test accounts on a development copy of your platform. Logged in as A, try to read or change B's data by swapping IDs in requests: order history, profile, payments. Then send the same payment or withdrawal request ten times in parallel. Write up whatever you find, with severity, evidence and the fix. That is a security assessment report for your portfolio.`,
    terms: [['access control', '存取控制'], ['injection', '注入'], ['cross-site scripting', '跨站腳本攻擊'], ['CSRF', '跨站請求偽造'], ['SSRF', '伺服器端請求偽造'], ['race condition', '競爭條件'], ['parameterised query', '參數化查詢']],
    quiz: [
      { q: "Changing /orders/1001 to /orders/1002 shows another user's order. What is the fix?",
        a: ["Make order IDs longer", "Check on the server that the order belongs to the logged-in user", "Hide the URL in the browser", "Add a CAPTCHA"], c: 1,
        why: "Hard-to-guess IDs help a little. Only a server-side ownership check fixes it." },
      { q: "What is the standard defence against SQL injection?",
        a: ["Removing quote characters from input", "Parameterised queries", "A longer database password", "HTTPS"], c: 1,
        why: "Parameters keep data separate from the command. Filtering characters is fragile and gets bypassed." },
      { q: "A game client sends &quot;I won 500&quot; to the server and the server credits 500. What is wrong?",
        a: ["The amount should be encrypted", "The server trusts a result decided by the client, which the player controls", "The request should use GET", "Nothing"], c: 1,
        why: "The server must work out the result itself from the state it holds." }
    ]
  },
  {
    id: 'sec-auth', lv: 3, mins: 13,
    title: 'Authentication and sessions',
    zh: '密碼只存「加鹽的慢雜湊」（argon2id／bcrypt）。後台與碰錢的帳號一定要多因素驗證，最強的是通行金鑰。Session cookie 要設 HttpOnly、Secure、SameSite。',
    body: `
<p><b>Authentication</b> answers &ldquo;who are you?&rdquo;. <b>Authorisation</b> answers &ldquo;what are you allowed to do?&rdquo;. A <b>session</b> is how the server remembers the answer to the first question between requests.</p>
<h3>Storing passwords</h3>
<p>Never store the password. Store a <b>slow, salted hash</b> of it, using argon2id or bcrypt. &ldquo;Salted&rdquo; means a random value is mixed in for each user, so that two identical passwords give different hashes. &ldquo;Slow&rdquo; means each guess costs an attacker real time. MD5 and plain SHA-256 are fast, which is exactly the wrong quality here.</p>
<h3>How accounts are taken over</h3>
<ul>
<li><b>Credential stuffing.</b> Email and password pairs leaked from other sites are tried on yours. It works because people reuse passwords. This is the most common attack on logins.</li>
<li><b>Phishing.</b> A fake login page collects the password.</li>
<li><b>Guessing.</b> Common passwords are tried against many accounts.</li>
</ul>
<p>Defences: limit attempts per account and per address, refuse passwords known from breaches, and add a second factor.</p>
<h3>Multi-factor authentication, weakest to strongest</h3>
<table>
<tr><th>Method</th><th>Weakness</th></tr>
<tr><td>Code by SMS</td><td>The phone number can be hijacked</td></tr>
<tr><td>Authenticator app (TOTP)</td><td>A fake page can pass the code along in real time</td></tr>
<tr><td>Push approval with number matching</td><td>Depends on the user paying attention</td></tr>
<tr><td><b>Passkeys and security keys</b> (WebAuthn)</td><td>Resistant to phishing: the key is tied to the real site's name</td></tr>
</table>
<p>For administrators and anything that moves money, a second factor is required.</p>
<h3>Sessions</h3>
<p>After login the server gives the browser a random session ID in a cookie. Three flags matter:</p>
<ul>
<li><code>HttpOnly</code>: scripts cannot read it, so XSS cannot steal it.</li>
<li><code>Secure</code>: sent only over HTTPS.</li>
<li><code>SameSite</code>: held back from most requests that start on other sites, which blocks most CSRF.</li>
</ul>
<h3>Going deeper: sessions or tokens</h3>
<table>
<tr><th></th><th>Server-side session</th><th>JWT (signed token)</th></tr>
<tr><td>Where the data lives</td><td>On the server (Redis). The cookie holds only an ID.</td><td>Inside the token itself</td></tr>
<tr><td>Cancelling it</td><td>Easy: delete it</td><td>Hard: it is valid until it expires</td></tr>
<tr><td>A lookup per request</td><td>Yes</td><td>No</td></tr>
</table>
<p>JWT rules: keep them short-lived (5 to 15 minutes) with a separate refresh token. Verify the signature and the expected algorithm. Put nothing secret inside, since it is only Base64. Keeping one in localStorage exposes it to XSS.</p>
<h3>Going deeper: the weak doors</h3>
<ul>
<li><b>Password reset</b> is part of authentication and is often the easiest way in. Reset links must be random, single-use and short-lived.</li>
<li><b>One-time keys in URLs</b> end up in logs and browser history. Exchange them for a session at once, and make them expire in seconds.</li>
<li><b>OAuth and OpenID Connect</b> (&ldquo;Sign in with Google&rdquo;): your app never sees the password. It receives a signed statement from the identity provider. Use a well-tested library for it.</li>
</ul>`,
    tryNote: 'Run on your Mac.',
    try: [
      ["printf 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' | base64 --decode; echo", 'The first part of a JWT, decoded with no key. Tokens are signed, and not hidden.'],
      ['curl -sI https://YOUR_SITE/ | grep -i set-cookie', 'Check that your session cookie carries HttpOnly, Secure and SameSite.']
    ],
    own: `Check every admin panel and dashboard you run. If any has no second factor, turning it on is the most valuable hour in this course. After that, check the three flags on your session cookie, and measure how long any one-time key or link you issue stays usable.`,
    terms: [['authentication', '身分驗證'], ['authorisation', '授權'], ['session', '工作階段'], ['salt', '鹽'], ['multi-factor authentication', '多因素驗證'], ['passkey', '通行金鑰'], ['credential stuffing', '撞庫攻擊'], ['phishing', '釣魚']],
    quiz: [
      { q: "How should user passwords be stored?",
        a: ["Encrypted with AES so support staff can read them", "As a slow salted hash such as argon2id or bcrypt", "As SHA-256 with no salt", "In Base64"], c: 1,
        why: "One-way, unique per user, and expensive to guess against." },
      { q: "Which second factor resists phishing?",
        a: ["A code sent by SMS", "A code from an authenticator app", "A passkey or hardware security key", "A security question"], c: 2,
        why: "It is tied to the genuine site's name, so it does nothing on a fake page." },
      { q: "What does the HttpOnly flag on a cookie do?",
        a: ["Forces HTTP and blocks HTTPS", "Stops JavaScript from reading the cookie", "Makes the cookie expire sooner", "Encrypts the cookie"], c: 1,
        why: "A script injected by an attacker then cannot read the session ID." }
    ]
  },
  {
    id: 'sec-secrets', lv: 3, mins: 13,
    title: 'Secrets and keys',
    zh: '機密（密碼、金鑰、私鑰）絕不進 git、不寫進映像檔；執行時才從機密管理服務拿。高價值的簽章金鑰要再多一層：只放在一個隔離的「簽章服務」，其他服務只能請它簽、看不到鑰匙。',
    body: `
<p>A <b>secret</b> is anything that grants access: a database password, an API key, a token-signing key, a TLS private key, a wallet's private key, a cloud access key. Whoever holds the secret holds the access.</p>
<h3>Where secrets leak</h3>
<ul>
<li><b>Git history.</b> It is permanent, and automated tools find keys pushed to public repositories within minutes.</li>
<li><b>Container image layers.</b></li>
<li><b>Logs, error messages and crash reports</b> that print the environment.</li>
<li><b>Chat messages, screenshots, laptops and backups.</b></li>
</ul>
<h3>The rules</h3>
<ol>
<li><b>Never in git.</b> If a secret was ever committed, it is compromised. Change it. Deleting the line does nothing, because the history still has it.</li>
<li><b>Fetch at run time</b> from a secrets store: AWS Secrets Manager, Parameter Store, Vault.</li>
<li><b>Each service gets only its own secrets.</b> The lobby has no need for the database administrator's password.</li>
<li><b>Rotate.</b> Change secrets on a schedule, and at once when someone leaves or a leak is suspected. Build the system so that rotation is routine.</li>
<li><b>Better still, have no long-lived secret.</b> A server with a cloud <b>role</b> receives temporary credentials automatically.</li>
<li><b>Record every read.</b></li>
</ol>
<h3>High-value keys: the signer pattern</h3>
<p>Some keys can do so much damage that the usual rules are not enough: a wallet key, a token-signing key, a code-signing key. For these, the key should never be readable by ordinary services at all.</p>
<div class="tiers">
<b>Risky</b><div><span class="box bad">Lobby<small>has the key</small></span><span class="box bad">Game server<small>has the key</small></span><span class="box bad">Admin<small>has the key</small></span><span class="box bad">Worker<small>has the key</small></span></div>
<b>Safer</b><div><span class="box">Lobby</span><span class="box">Game server</span><span class="box">Admin</span><span class="box">Worker</span><span class="arr">&rarr; &ldquo;please sign this&rdquo; &rarr;</span><span class="box hot">Signer<small>the only place the key exists</small></span></div>
</div>
<p>The <b>signer</b> is one small, isolated service, or a hardware module or cloud key service. It offers a single narrow operation, &ldquo;sign this withdrawal&rdquo;, and applies its own rules: a maximum per transaction, a maximum per day, an allowed-address list, a rate limit, a second approval above a threshold. It records every signature.</p>
<p>If any other service is broken into, the attacker can ask for signatures within those limits. They cannot take the key and leave.</p>
<h3>Going deeper: hot and cold</h3>
<p>A <b>hot wallet</b> is online and signs automatically. Keep in it only what you can afford to lose, about one day of withdrawals. The rest stays in <b>cold storage</b>, offline or needing several people to approve, and the hot wallet is topped up from it by hand. A theft is then limited to one day's float.</p>
<h3>Going deeper: catching leaks</h3>
<ul>
<li>A <b>pre-commit scanner</b> such as gitleaks blocks secrets before they reach git.</li>
<li>Scan the existing history once.</li>
<li>Place <b>canary</b> credentials: fake keys that raise an alarm the moment anyone tries them (lesson 6.4).</li>
</ul>`,
    tryNote: 'Run on your Mac, inside one of your own repositories. Both only read.',
    try: [
      ['git log --all --oneline -S "PRIVATE KEY" | head', 'Commits in history that added or removed the text "PRIVATE KEY" (the first ten). Any result needs a look.'],
      ['git log --all --oneline -S "AKIA" | head', 'The same for long-lived AWS access key IDs, which start with AKIA.']
    ],
    own: `Find the most valuable secret in a system you run: a signing key, a payment API key, a database administrator password. Count how many services and people can read it today. Design the fix on paper first. Which one service truly needs it? If it is a signing key, what limits should a signer enforce? Then build it on a development copy with a test key. This redesign, written up, is the strongest security item you can put in a portfolio.`,
    terms: [['secret', '機密'], ['secrets manager', '機密管理服務'], ['rotation', '輪替'], ['signer', '簽章服務'], ['hot wallet', '熱錢包'], ['cold storage', '冷儲存'], ['hardware security module', '硬體安全模組']],
    quiz: [
      { q: "An API key was committed to git and removed in the next commit. Is it safe?",
        a: ["Yes, it is gone from the latest version", "No, it is still in the history and must be changed", "Yes, if the repository is private", "Only if the commit message is edited"], c: 1,
        why: "History keeps everything. Treat the key as leaked and rotate it." },
      { q: "What does the signer pattern achieve?",
        a: ["Faster signing", "An attacker who breaks into another service can request limited signatures and cannot steal the key", "It removes the need for a database", "It makes keys shorter"], c: 1,
        why: "The key exists in one isolated place that enforces its own limits." },
      { q: "Why keep only a small amount in a hot wallet?",
        a: ["Transaction fees are lower", "It limits the loss if the online key is ever misused", "Blockchains require it", "Small wallets are faster"], c: 1,
        why: "The hot wallet is the exposed one. The bulk stays where automated systems cannot reach it." }
    ]
  },
  {
    id: 'sec-iam', lv: 3, mins: 13,
    title: 'Cloud identity and access (IAM)',
    zh: '在雲端，「身分」就是邊界：有了對的憑證，駭客不用漏洞，直接登入就好。root 帳號鎖好、開多因素、不留存取金鑰；機器用「角色」拿短期憑證，不要用長期金鑰。',
    body: `
<p>In the cloud, <b>identity is the perimeter</b>. An attacker holding the right credentials needs no exploit. They simply log in and use the API. Most serious cloud breaches are stories about credentials.</p>
<h3>The pieces (AWS names)</h3>
<table>
<tr><th>Thing</th><th>What it is</th><th>Rule</th></tr>
<tr><td><b>Root user</b></td><td>The owner of the account. It can do anything, including closing it.</td><td>A strong password and a second factor. No access keys. Use it almost never.</td></tr>
<tr><td><b>IAM user</b></td><td>A permanent identity with a password or access keys</td><td>Keep as few as possible.</td></tr>
<tr><td><b>Role</b></td><td>An identity that is taken on temporarily and yields short-lived credentials</td><td>The preferred way for machines, pipelines and people.</td></tr>
<tr><td><b>Policy</b></td><td>A document listing allowed actions on resources</td><td>As narrow as the job allows.</td></tr>
</table>
<h3>How a decision is made</h3>
<p>Everything is denied by default. An <code>Allow</code> in a policy grants access. An explicit <code>Deny</code> anywhere overrides every Allow.</p>
<pre><code>{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject"],
    "Resource": "arn:aws:s3:::my-backups/saves/*"
  }]
}</code></pre>
<p>This allows reading files in one folder of one bucket and nothing more. Compare it with <code>"Action": "*", "Resource": "*"</code>, which hands over the whole account.</p>
<h3>Who should use what</h3>
<ul>
<li><b>Programs on a server:</b> an <b>instance role</b>. The code receives temporary credentials automatically and no key is stored on disk.</li>
<li><b>The build pipeline:</b> a role taken on through OIDC. No stored keys.</li>
<li><b>People:</b> single sign-on with a second factor, taking on roles. No shared logins.</li>
</ul>
<h3>Going deeper: guard rails for the account</h3>
<ul>
<li><b>CloudTrail</b> records every API call: who did what, and when. Switch it on for all regions and send the logs somewhere an attacker cannot delete them.</li>
<li><b>Billing alarms.</b> Stolen keys are often used to mine cryptocurrency, and the bill is the first sign.</li>
<li><b>GuardDuty</b> watches for suspicious behaviour. <b>Access Analyzer</b> lists everything shared outside the account.</li>
<li><b>S3 Block Public Access</b>, switched on for the whole account.</li>
<li><b>IMDSv2 required</b> on every instance. It defeats the SSRF attack from lesson 5.2.</li>
<li><b>Separate accounts</b> for production and development. An account boundary is the strongest wall the cloud offers.</li>
</ul>
<h3>Going deeper: writing least-privilege policies</h3>
<p>Start from what the code really calls. Limit the resource to specific names. Add conditions where you can, such as a source address or a required second factor. Review regularly: the console shows when each permission was last used, and unused ones should go.</p>`,
    tryNote: 'Run on your Mac if the AWS command line is configured. Both only read.',
    try: [
      ['aws iam get-account-summary --query "SummaryMap.{RootMFA:AccountMFAEnabled,RootAccessKeys:AccountAccessKeysPresent,Users:Users}"', 'The targets are RootMFA 1 and RootAccessKeys 0.'],
      ['aws iam list-users --query "Users[].{name:UserName,created:CreateDate,lastLogin:PasswordLastUsed}" --output table', 'Every permanent identity in the account.']
    ],
    own: `Run the summary. Then list every access key that exists, where a copy of it is stored (a laptop, a server, a pipeline) and how old it is. Any key more than a year old, and any key with administrator rights that sits on a server, goes on the list to fix. Finally, check that a billing alarm exists.`,
    terms: [['identity', '身分'], ['role', '角色'], ['policy', '政策'], ['access key', '存取金鑰'], ['temporary credentials', '短期憑證'], ['audit log', '稽核日誌'], ['root user', '根使用者']],
    quiz: [
      { q: "One policy allows an action and another explicitly denies it. What is the result?",
        a: ["Allowed", "Denied", "It depends on which was written first", "The account is locked"], c: 1,
        why: "An explicit deny always wins." },
      { q: "How should an application on a cloud server obtain its cloud credentials?",
        a: ["From access keys in a config file", "From an instance role that supplies temporary credentials", "From the root account's keys", "From environment variables set by hand"], c: 1,
        why: "Nothing long-lived is stored, so there is nothing to steal from the disk or from git." },
      { q: "What is the right setup for the root user of a cloud account?",
        a: ["Used daily for convenience", "Second factor on, no access keys, used almost never", "Shared among the team", "Disabled permanently"], c: 1,
        why: "Nothing inside its own account can restrict it, so it must be protected and kept out of daily use." }
    ]
  },
  {
    id: 'sec-net', lv: 3, mins: 13,
    title: 'Network security at scale',
    zh: '網路要分層隔離：對外層、應用層、資料層，資料庫只接受應用層連線。後台不放在公開網路上。零信任＝不因為「在內網」就信任，每個請求都要驗證。',
    body: `
<p>A flat network, in which every machine can reach every other, means that one compromised machine exposes everything. The answer is <b>segmentation</b>: divide the network into zones and allow only the connections each zone needs.</p>
<div class="tiers">
<b>Public</b><div><span class="box">CDN and WAF</span><span class="arr">&rarr;</span><span class="box">Load balancer</span></div>
<b>Private: app</b><div><span class="box">App servers<small>accept traffic only from the load balancer</small></span></div>
<b>Private: data</b><div><span class="box hot">Database, Redis<small>accept traffic only from the app servers</small></span></div>
</div>
<p>In a cloud network this is done by having security groups name each other: the database's group allows its port only from the app servers' group.</p>
<h3>Administrative access</h3>
<ul>
<li>No SSH open to the internet. Use the provider's session tool, or a private network such as WireGuard or Tailscale.</li>
<li>Admin panels and dashboards are not on the public internet. Put them behind single sign-on with a second factor, a VPN, or a short list of allowed addresses.</li>
</ul>
<h3>Zero trust</h3>
<p>The older model was a castle: hard walls, and trust for everything inside. <b>Zero trust</b> removes the trust. Being on the internal network grants nothing. Every request, from a person or a service, must prove who it is and is checked against a policy. Services identify themselves to each other with mutual TLS or signed tokens.</p>
<h3>At the edge</h3>
<table>
<tr><th>Threat</th><th>Defence</th></tr>
<tr><td>Floods of raw traffic (volumetric DDoS)</td><td>A CDN or the provider's network absorbs them. Basic protection is automatic on the large clouds.</td></tr>
<tr><td>Many expensive requests such as logins or searches (application-layer DDoS)</td><td>Rate limits, caching, challenge pages, and making the expensive endpoints cheap.</td></tr>
<tr><td>Known exploit patterns and bots</td><td>A <b>WAF</b> (web application firewall) filters them. It is a safety net, and no substitute for fixing the code.</td></tr>
</table>
<h3>Going deeper</h3>
<ul>
<li><b>Hide the origin.</b> If attackers know your server's real address and it accepts traffic from anyone, they go around the CDN and the WAF. The origin should accept only the CDN.</li>
<li><b>Layers of rate limiting:</b> per address at the edge, per account in the application, and an overall breaker.</li>
<li><b>Control outbound traffic.</b> A server that can only reach the few destinations it needs cannot easily send your data out or download an attacker's tools.</li>
<li><b>Kubernetes</b> allows all pods to talk to all pods by default. Start with a deny-all NetworkPolicy.</li>
</ul>
<div class="note">For gambling and gaming sites, extortion by DDoS is routine. Having a CDN and WAF in front is a basic requirement for staying online.</div>`,
    tryNote: 'Run on your Mac, against your own server only. Replace ORIGIN_IP and YOUR_SITE.',
    try: [
      ['curl -s -o /dev/null -w "%{http_code}\\n" --connect-timeout 5 -H "Host: YOUR_SITE" http://ORIGIN_IP/', 'If this prints 200 or a redirect code, anyone who knows the address can skip your CDN.'],
      ['nc -vz -w 3 ORIGIN_IP 22', 'If this succeeds from an ordinary internet connection, SSH is open to the world.']
    ],
    own: `Answer three questions about your setup. Can your server's address be reached directly, going around any CDN? Can the admin path be opened from any address on earth? Is SSH open to everyone? Each &ldquo;yes&rdquo; is a finding. Write it up with its fix.`,
    terms: [['segmentation', '網路分段'], ['zero trust', '零信任'], ['WAF', '網站應用程式防火牆'], ['DDoS', '分散式阻斷服務攻擊'], ['rate limiting', '速率限制'], ['VPN', '虛擬私人網路'], ['mutual TLS', '雙向 TLS']],
    quiz: [
      { q: "What is the best inbound rule for a database's security group?",
        a: ["Allow the database port from anywhere, with a strong password", "Allow the database port only from the app servers' security group", "Allow all ports from the office", "Allow nothing, including the app"], c: 1,
        why: "Only the tier that needs the database can reach it, and the rule keeps working as servers change." },
      { q: "What is the core idea of zero trust?",
        a: ["Trust nobody and block everything", "Being inside the network grants nothing: every request must prove its identity and be authorised", "Use no passwords", "Trust only the office network"], c: 1,
        why: "It removes the assumption that &quot;internal&quot; means &quot;safe&quot;." },
      { q: "Why must the origin server accept traffic only from the CDN?",
        a: ["To save bandwidth", "Otherwise attackers can reach it directly and bypass the CDN's protections", "CDNs require it by contract", "It improves SEO"], c: 1,
        why: "A protection that can be walked around protects nothing." }
    ]
  },
  {
    id: 'sec-supply', lv: 3, mins: 13,
    title: 'Supply chain, patching, detection and response',
    zh: '你跑的程式大多是別人寫的（套件、基底映像檔），所以要鎖版本、掃漏洞、定期更新。再來是「偵測」：一定會有被入侵的一天，重點是幾分鐘發現還是幾個月。',
    body: `
<h3>The supply chain</h3>
<p>Most of the code you run was written by others: operating system packages, base images, hundreds of libraries pulled in by the ones you chose, build tools. Each is a way in. Attackers publish malicious packages with names close to popular ones, and take over the accounts of real maintainers.</p>
<ul>
<li><b>Lock versions.</b> Commit the lockfile and install with <code>npm ci</code>, so every build uses exactly the same code.</li>
<li><b>Scan</b> dependencies and images for known flaws in the pipeline: <code>npm audit</code>, Trivy.</li>
<li><b>Update on a schedule.</b> Tools such as Dependabot and Renovate open the update for you.</li>
<li><b>Think before adding a dependency.</b> Each one brings its own dependencies.</li>
<li><b>Protect the pipeline.</b> A malicious package runs inside it and can read its secrets.</li>
</ul>
<h3>Patching</h3>
<p>Most server break-ins use a flaw whose fix was already available. Turn on automatic security updates for the operating system. Rebuild images at least monthly. Know which of your software has passed its end of support, since it no longer receives fixes. Patch anything facing the internet first.</p>
<h3>Hardening containers</h3>
<ul>
<li>Run as a non-root user, with a read-only filesystem where possible.</li>
<li>Never use <code>--privileged</code>.</li>
<li>Never mount the Docker socket into a container. Access to it is root on the host.</li>
<li>Set memory and CPU limits.</li>
</ul>
<h3>Detection</h3>
<p>Some day something will get in. What matters is whether you notice in minutes or in months. Collect, and send off the machine to a place an attacker cannot erase:</p>
<ul>
<li>Cloud audit logs: who did what.</li>
<li>Login records: successes, failures, changes to second factors.</li>
<li>Administrative actions.</li>
<li>Business events: withdrawals, changes of permission.</li>
</ul>
<p>Alert on events that are never normal: a root login, a new access key, a firewall rule opened to the world, an administrator logging in from a new country, an unusual withdrawal.</p>
<h3>Response: written before it is needed</h3>
<ol>
<li><b>Contain.</b> Isolate the machine, cancel keys and sessions, pause withdrawals. Build this <b>kill switch</b> in advance.</li>
<li><b>Preserve evidence.</b> Take a snapshot of the disk before changing anything.</li>
<li><b>Rebuild from clean images.</b> Never trust a machine that was compromised.</li>
<li><b>Rotate every secret</b> the machine could see.</li>
<li><b>Notify</b> users and authorities as the law requires.</li>
<li><b>Review</b>, blamelessly.</li>
</ol>
<h3>Going deeper: verifying what you run</h3>
<ul>
<li>An <b>SBOM</b> (software bill of materials) lists every component in a build. When a new flaw is announced, it tells you in seconds whether you are affected.</li>
<li><b>Signed images</b> (cosign) let the cluster refuse anything your pipeline did not build.</li>
<li><b>Pin base images by digest</b>, the hash of the image, so that a name cannot silently start pointing at different contents.</li>
</ul>`,
    tryNote: 'The first two run on the server and only read. The third runs on your Mac inside a project folder.',
    try: [
      ['docker ps -q | xargs docker inspect -f "{{.Name}} privileged={{.HostConfig.Privileged}} user={{.Config.User}}"', 'An empty user means root. privileged=true is a red flag.'],
      ['docker ps -q | xargs docker inspect -f "{{.Name}} {{range .Mounts}}{{.Source}} {{end}}" | grep docker.sock', 'Any container listed here effectively has root on the host.'],
      ['npm audit --omit=dev', 'Known flaws in the libraries your project ships with.']
    ],
    own: `Build a kill switch first: one command or one admin button that pauses the most dangerous action in your system, such as payouts. Then answer this: if your main server were compromised tonight, which secrets could the attacker read from it? Write that list down and keep it. It is your rotation checklist for the worst day.`,
    terms: [['supply chain', '供應鏈'], ['dependency', '相依套件'], ['vulnerability', '漏洞'], ['patch', '修補'], ['hardening', '強化'], ['detection', '偵測'], ['containment', '圍堵'], ['kill switch', '緊急開關']],
    quiz: [
      { q: "Why is mounting the Docker socket into a container dangerous?",
        a: ["It slows the container", "Whoever controls that container can control Docker, which means root on the host", "It fills the disk", "It disables logging"], c: 1,
        why: "The socket is the control channel for every container on the machine." },
      { q: "A server was compromised. What is the right way to recover it?",
        a: ["Delete the suspicious files and carry on", "Rebuild it from a clean image and rotate every secret it could see", "Reboot it", "Change the root password only"], c: 1,
        why: "You cannot know everything the attacker changed. Start clean, and assume every secret on it was read." },
      { q: "What is the purpose of committing a lockfile?",
        a: ["It makes installs slower and safer", "Every build installs exactly the same versions, so new code cannot slip in unnoticed", "It encrypts dependencies", "It removes unused packages"], c: 1,
        why: "Reproducible builds, and a change in dependencies becomes a visible, reviewable change." }
    ]
  }
  ]
});
