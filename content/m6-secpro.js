M({
  id: 'pro', n: 6,
  title: 'Security as a profession',
  zh: '資安專業：攻擊手法、滲透測試、藍隊偵測、事件應變、弱點管理、法規合規',
  time: '6 to 8 weeks, after module 5',
  blurb: 'The working knowledge of a security engineer: how attacks unfold, how to test and detect them, how to respond, and the rules the industry runs on.',
  lessons: [
  {
    id: 'pro-field', lv: 2, mins: 10,
    title: 'The security field and its jobs',
    zh: '資安分很多種工作：藍隊（防守、監控）、紅隊（經授權的攻擊測試）、應用程式安全、雲端安全、法規治理。有開發背景的人，走應用程式安全或雲端安全最快。',
    body: `
<p>&ldquo;Cybersecurity&rdquo; is a group of quite different jobs. Knowing the map lets you aim at the one that fits what you already have.</p>
<table>
<tr><th>Area</th><th>What the day looks like</th><th>Typical titles</th></tr>
<tr><td><b>Blue team</b> (defence)</td><td>Watching alerts, investigating suspicious activity, writing detection rules, responding to incidents</td><td>SOC analyst, detection engineer, incident responder</td></tr>
<tr><td><b>Red team</b> (authorised offence)</td><td>Attacking systems with permission to find the holes first, and writing reports</td><td>Penetration tester, red teamer</td></tr>
<tr><td><b>Application security</b></td><td>Reviewing designs and code, threat modelling, security tools in the pipeline, helping developers fix flaws</td><td>AppSec engineer, product security engineer</td></tr>
<tr><td><b>Cloud and infrastructure security</b></td><td>Identity and access, network design, hardening Kubernetes, managing secrets, automating all of it</td><td>Cloud security engineer, DevSecOps engineer</td></tr>
<tr><td><b>Governance, risk and compliance</b></td><td>Policies, risk assessments, audits against standards, reviewing suppliers</td><td>GRC analyst, ISO 27001 auditor, security manager</td></tr>
</table>
<h3>Which fits a developer</h3>
<p>The shortest paths from software development are <b>application security</b> and <b>cloud security</b>. Both need someone who can read code, understands how systems are built, and can automate. Those are the hard parts to teach, and you already have them. The security knowledge can be added on top, and that is what modules 5 and 6 are for.</p>
<p>The usual entry job, SOC analyst, involves shift work and watching alerts. It is a common way in for people with no technical background. For an experienced developer it is a step down.</p>
<h3>Going deeper: how the teams work together</h3>
<ul>
<li>The red team finds a way in and writes down how.</li>
<li>The blue team checks whether it noticed. If it did not, it writes a new detection.</li>
<li><b>Purple teaming</b> is the two working side by side, attack by attack, so that every technique tried ends in a detection that works.</li>
</ul>
<h3>Going deeper: demand in Taiwan</h3>
<ul>
<li>The Cyber Security Management Act (資通安全管理法) requires government agencies and designated critical organisations to employ dedicated security staff holding recognised certificates. The financial regulator sets similar rules for banks and insurers. This produces steady demand.</li>
<li>Many roles in Taiwan combine technical work with compliance work, especially ISO 27001.</li>
<li>Product companies and foreign employers hire for application and cloud security, and they test skill directly in interviews.</li>
</ul>
<h3>What every one of these jobs requires</h3>
<p>Clear writing. A finding that nobody understands does not get fixed, and an incident report that cannot be followed protects nobody. Practise by writing up every exercise in this module.</p>`,
    own: `Read ten current job postings for &ldquo;security engineer&rdquo;, &ldquo;DevSecOps&rdquo; and &ldquo;cloud security&rdquo; in the market you want (104, LinkedIn, or the remote boards you already use). Copy every requirement into one list and count how often each appears. The most frequent ten items are your study priorities.`,
    terms: [['blue team', '藍隊（防守方）'], ['red team', '紅隊（攻擊方）'], ['application security', '應用程式安全'], ['SOC', '資安監控中心'], ['GRC', '治理、風險與合規'], ['penetration tester', '滲透測試人員']],
    quiz: [
      { q: "For an experienced developer, which security roles are the most natural move?",
        a: ["SOC analyst on night shifts", "Application security or cloud security engineering", "Physical security guard", "Malware reverse engineer"], c: 1,
        why: "Both build directly on reading code, understanding architecture and automating work." },
      { q: "What is purple teaming?",
        a: ["A third, separate team", "Red and blue working together so that each attack technique ends in a working detection", "Testing without permission", "A kind of firewall"], c: 1,
        why: "It turns the red team's findings directly into the blue team's detections." }
    ]
  },
  {
    id: 'pro-attack', lv: 3, mins: 14,
    title: 'How an attack unfolds',
    zh: '攻擊是一連串步驟：偵察、取得入口、站穩、提權、偷憑證、橫向移動、把資料或錢弄走。防守方只要在其中一步擋下或發現，整條鏈就斷了。MITRE ATT&CK 是共通的技術目錄。',
    body: `
<p>An attack is a sequence of steps, each of which must succeed. Defenders who understand the sequence can place a barrier or an alarm at every step, and only one of them has to work.</p>
<table>
<tr><th>Stage</th><th>What the attacker does</th><th>What stops or reveals it</th></tr>
<tr><td><b>Reconnaissance</b></td><td>Maps your domains, addresses, open ports, technologies, staff names, leaked passwords</td><td>Expose less. Know what is visible from outside.</td></tr>
<tr><td><b>Initial access</b></td><td>Phishing, a stolen password, a flaw in something internet-facing, a poisoned dependency</td><td>Second factors, patching, a WAF, lockfiles</td></tr>
<tr><td><b>Persistence</b></td><td>Makes sure they can return: a new user, an added SSH key, a scheduled job, a new cloud access key</td><td>Alerts on new users and keys, file integrity checks</td></tr>
<tr><td><b>Privilege escalation</b></td><td>Goes from an ordinary account to administrator: weak sudo rules, an unpatched kernel, the Docker socket, an over-generous cloud role</td><td>Least privilege, patching, hardened containers</td></tr>
<tr><td><b>Credential access</b></td><td>Collects secrets: .env files, cloud key files, environment variables, the metadata service, browser sessions</td><td>A secrets manager, IMDSv2, short-lived credentials</td></tr>
<tr><td><b>Lateral movement</b></td><td>Uses those secrets to reach other machines and services</td><td>Segmentation, zero trust, distinct secrets per service</td></tr>
<tr><td><b>Exfiltration and impact</b></td><td>Copies data out, steals funds, encrypts everything for ransom</td><td>Outbound controls, spending limits, immutable backups, a kill switch</td></tr>
</table>
<h3>MITRE ATT&amp;CK</h3>
<p><b>ATT&amp;CK</b> is a free public catalogue of everything attackers have been seen to do. Its columns are goals (&ldquo;tactics&rdquo;, much like the stages above) and its cells are methods (&ldquo;techniques&rdquo;), each with real examples and advice on detection. It gives red teams, blue teams and vendors a common vocabulary. Marking which techniques you can detect shows your blind spots.</p>
<h3>A worked example</h3>
<p>A plausible attack on a small gaming platform:</p>
<ol>
<li>A developer's laptop is infected through a fake job-offer document.</li>
<li>The malware collects SSH keys and cloud credentials from the home folder.</li>
<li>The attacker logs in to the server with the SSH key. It looks like a normal login.</li>
<li>They run <code>docker ps</code> and read the environment of each container.</li>
<li>One of them holds the wallet's private key.</li>
<li>The wallet is emptied in a single transaction.</li>
</ol>
<p>Any one of these would have broken the chain: a passphrase or hardware key for SSH; SSH closed to the internet; an alert on a login from a new country; the key held only by an isolated signer; a signer with a daily limit; a hot wallet holding one day's float.</p>
<h3>Going deeper: turning the saying around</h3>
<p>People say &ldquo;the defender must be right every time and the attacker only once&rdquo;. In a well-instrumented system the reverse is closer to the truth: the attacker must go unnoticed at every stage, and the defender needs to notice only once. This is why detection gets as much attention as prevention.</p>
<h3>Going deeper: dwell time</h3>
<p><b>Dwell time</b> is how long an attacker is inside before being noticed. In organisations with poor monitoring it is measured in weeks or months. Every day of it lets the attacker reach more.</p>`,
    own: `Take the worked example and write it again for your own setup, step by step, using your real machines and where your real secrets are kept. At each step, write what would stop it today and what would detect it today. Steps where both answers are &ldquo;nothing&rdquo; are your priorities.`,
    terms: [['reconnaissance', '偵察'], ['initial access', '初始入侵'], ['persistence', '持續潛伏'], ['privilege escalation', '權限提升'], ['lateral movement', '橫向移動'], ['exfiltration', '資料外洩'], ['dwell time', '潛伏時間']],
    quiz: [
      { q: "What is lateral movement?",
        a: ["Moving a server to another region", "Using access gained on one system to reach other systems", "Scanning for open ports", "Encrypting files for ransom"], c: 1,
        why: "Segmentation and distinct secrets per service are what limit it." },
      { q: "What is MITRE ATT&amp;CK used for?",
        a: ["Encrypting traffic", "A shared catalogue of attacker techniques, used to plan and measure detection", "Scanning for viruses", "Issuing certificates"], c: 1,
        why: "It gives every team the same names for the same behaviours and exposes gaps in coverage." },
      { q: "In the worked example, which single change limits the loss even if every other step succeeds?",
        a: ["A longer SSH key", "A signer service with a daily limit and a small hot wallet", "A faster server", "More log storage"], c: 1,
        why: "It caps what the attacker can take, whatever they manage to reach." }
    ]
  },
  {
    id: 'pro-pentest', lv: 3, mins: 14,
    title: 'Penetration testing, done legally',
    zh: '滲透測試＝經過書面授權的攻擊演練。沒授權去測別人的系統就是犯罪。流程：定範圍、偵察、找漏洞、證明影響、寫報告。報告才是真正的產品。',
    body: `
<p>A <b>penetration test</b> is an attack carried out with permission, to find weaknesses before a real attacker does. Written permission is what separates a profession from a crime.</p>
<div class="warn"><b>Permission comes first.</b> Before any test there must be a written agreement stating what may be tested (the scope), when, by which methods, and whom to call if something breaks. Testing a system without it is a criminal offence: in Taiwan under the Criminal Code's chapter on offences against computer use (articles 358 to 363), and under similar laws elsewhere. Good intentions are no defence.</div>
<h3>The method</h3>
<ol>
<li><b>Scoping.</b> Agree targets, limits and timing.</li>
<li><b>Reconnaissance.</b> Passive first: DNS records, certificate logs, public code, job adverts. Then active: scanning for open ports and services.</li>
<li><b>Enumeration.</b> For each service, find the version, the endpoints, the parameters and the kinds of user.</li>
<li><b>Vulnerability analysis.</b> Match what you found against known flaws, and reason about the application's own logic.</li>
<li><b>Exploitation.</b> Prove that a flaw is real with the least harm possible. Read one record, not the whole table.</li>
<li><b>Post-exploitation.</b> Show what the access leads to, within scope.</li>
<li><b>Reporting.</b> See below.</li>
<li><b>Retest</b> after fixes.</li>
</ol>
<h3>The report is the product</h3>
<table>
<tr><th>Section</th><th>For whom</th></tr>
<tr><td>Executive summary: overall risk in plain words</td><td>Managers</td></tr>
<tr><td>Each finding: title, severity, affected system, evidence, steps to reproduce, impact, fix</td><td>Engineers</td></tr>
<tr><td>Method and scope</td><td>Auditors</td></tr>
</table>
<p>A finding that an engineer cannot reproduce will not be fixed. Clear writing is the skill that distinguishes a professional tester.</p>
<h3>The tools</h3>
<table>
<tr><th>Tool</th><th>Use</th></tr>
<tr><td>nmap</td><td>Find open ports and identify services</td></tr>
<tr><td>Burp Suite</td><td>A proxy that sits between browser and site so you can read and alter every request. The main tool for web testing.</td></tr>
<tr><td>ffuf, gobuster</td><td>Discover hidden paths and files</td></tr>
<tr><td>nuclei</td><td>Run thousands of known checks</td></tr>
<tr><td>Metasploit</td><td>A framework of ready-made exploits, for practice environments</td></tr>
<tr><td>Wireshark</td><td>Look at network traffic packet by packet</td></tr>
</table>
<p>Tools find the easy things. The valuable findings come from understanding how the application is meant to work and asking what happens when it is used in a different way.</p>
<h3>Where to practise legally</h3>
<ul>
<li><b>PortSwigger Web Security Academy:</b> free, in the browser, and the best for web testing.</li>
<li><b>TryHackMe and Hack The Box:</b> guided machines to break into, with free tiers.</li>
<li><b>OWASP Juice Shop:</b> a deliberately broken shop you run locally.</li>
<li><b>Your own development copy.</b></li>
<li><b>Bug bounty programmes:</b> companies that publish a scope and pay for findings. Stay strictly inside the published scope.</li>
</ul>
<h3>Going deeper: certificates in this area</h3>
<p>eJPT is an entry-level practical exam. <b>OSCP</b> is the respected hands-on standard: a 24-hour exam in which you break into real machines and then write a report. CEH is widely recognised by HR departments and appears on Taiwan's official list, and practitioners value it less because it is a multiple-choice exam.</p>`,
    tryNote: 'Run on your Mac, against your own domain and server only. The first needs: brew install nmap.',
    try: [
      ['nmap -sV -Pn --top-ports 100 YOUR_SERVER_IP', 'What an attacker learns in the first minute: open ports and the software behind each.'],
      [`curl -s "https://crt.sh/?q=YOUR_DOMAIN&output=json" | python3 -c "import sys,json; print('\\n'.join(sorted({r['name_value'] for r in json.load(sys.stdin)})))"`, 'Every hostname that has ever had a certificate under your domain, from public logs. Attackers start here.'],
      ['curl -s https://internetdb.shodan.io/YOUR_SERVER_IP', 'What an internet-wide scanner has already recorded about your server.']
    ],
    own: `Run all three against your own domain and server. Any hostname or open port you did not expect is a finding. Write a short report in the format above: summary, findings with severity and evidence, and fixes. Remove real addresses before sharing it. This is your first penetration-test report.`,
    terms: [['penetration test', '滲透測試'], ['scope', '測試範圍'], ['enumeration', '列舉'], ['exploit', '漏洞利用'], ['finding', '發現事項'], ['severity', '嚴重程度'], ['bug bounty', '漏洞獎勵計畫']],
    quiz: [
      { q: "What must exist before any penetration test begins?",
        a: ["A new laptop", "Written authorisation that defines the scope", "A VPN subscription", "A certificate from the target's CA"], c: 1,
        why: "Without it the same actions are a criminal offence." },
      { q: "What is the main deliverable of a penetration test?",
        a: ["A list of tools used", "A report with findings that can be reproduced and fixed", "A video of the attack", "The stolen data"], c: 1,
        why: "The client pays for knowledge they can act on." },
      { q: "During exploitation you gain access to a customer table. What is the professional action?",
        a: ["Download the whole table as proof", "Read the minimum needed to prove the flaw, record it, and stop", "Delete a row to show impact", "Post it online"], c: 1,
        why: "The goal is to prove risk while causing as little harm as possible." }
    ]
  },
  {
    id: 'pro-blue', lv: 3, mins: 13,
    title: 'Blue team: logs, SIEM and detection',
    zh: '藍隊的流程：收集日誌、集中到 SIEM、寫偵測規則、判讀警報、應變。小團隊最划算的偵測是「誘餌」：放一把假金鑰，有人用就立刻通知，幾乎不會誤報。',
    body: `
<p>The blue team's work is a loop: <b>collect</b> records of what happens, <b>detect</b> what should not be happening, <b>triage</b> each alert, and <b>respond</b>.</p>
<h3>What to collect, in order of value</h3>
<ol>
<li><b>Identity records:</b> logins, failures, password and second-factor changes.</li>
<li><b>Cloud audit logs:</b> every API call.</li>
<li><b>Endpoint records:</b> which processes ran on servers and laptops.</li>
<li><b>Network records:</b> DNS lookups, connections in and out.</li>
<li><b>Application events:</b> administrative actions, withdrawals, permission changes.</li>
</ol>
<h3>The SIEM</h3>
<p>A <b>SIEM</b> (security information and event management system) gathers all of these in one place, puts them into a common shape, and runs detection queries over them continuously. Splunk, Elastic, Microsoft Sentinel, and the open-source Wazuh are examples.</p>
<h3>What a detection looks like</h3>
<p>A detection is a question asked of the logs again and again:</p>
<ul>
<li>Twenty failed logins followed by a success from the same address within ten minutes.</li>
<li>A console login that used no second factor.</li>
<li>A new access key created for an administrator.</li>
<li>A database server opening a connection to an address outside the country.</li>
<li>A command that downloads a script and pipes it straight into a shell on a production machine.</li>
</ul>
<h3>Triage</h3>
<p>For each alert: is it real? How far does it reach? How serious is it? Then either escalate it or close it with a note explaining why. A good analyst is one who can close false alarms quickly and correctly.</p>
<h3>Going deeper: detection engineering</h3>
<p>Detections are treated like software. Write the rule. Test it by simulating the attack (the open project Atomic Red Team provides small safe tests for many ATT&amp;CK techniques). Tune it until false alarms are rare. Record what to do when it fires. Keep it under version control. <b>Sigma</b> is a common format for writing rules that can be converted for most SIEMs.</p>
<h3>Going deeper: indicators and behaviours</h3>
<p>An <b>indicator of compromise</b> is a specific trace: a file hash, an address, a domain. Attackers change these in minutes. A <b>behaviour</b>, such as &ldquo;reads credentials from the metadata service and then calls the API from a new address&rdquo;, is much harder for them to change. Detections built on behaviour last. Detections built on indicators expire.</p>
<h3>Going deeper: canaries</h3>
<div class="note">A <b>canary</b> (or honeytoken) is a fake secret that nobody has a legitimate reason to touch: a fake cloud access key in a file named like a real one, a fake administrator account, a fake record in the database. When it is used, you are told at once. There are almost no false alarms, it costs nothing, and it tells you the one thing that matters: someone is where they should not be. For a small team this is the best detection available.</div>
<h3>Measures of a blue team</h3>
<p>Mean time to detect, mean time to respond, and the share of alerts that turn out to be false.</p>`,
    tryNote: 'On an Ubuntu server over SSH. These only read.',
    try: [
      ['sudo journalctl -u ssh --since yesterday --no-pager | grep -c "Failed password"', 'How many times the internet tried to guess an SSH password since yesterday. If password login is off, they cannot succeed.'],
      [`sudo journalctl -u ssh --since yesterday --no-pager | grep "Failed password" | grep -oE "from [0-9.]+" | sort | uniq -c | sort -rn | head -5`, 'The five most persistent addresses. This is a detection query in its simplest form.'],
      ['last -a | head -15', 'Recent successful logins and where they came from. Do you recognise every address?']
    ],
    own: `Place one canary. Generate a fake AWS access key at canarytokens.org (free), and save it on a server you run, in a file named like a real credentials file. If you ever receive that email, someone is reading your disk, and you will know within minutes. Add a second one to your laptop.`,
    terms: [['SIEM', '安全資訊與事件管理系統'], ['detection rule', '偵測規則'], ['triage', '分級判讀'], ['false positive', '誤報'], ['indicator of compromise', '入侵指標'], ['honeytoken', '誘餌憑證'], ['mean time to detect', '平均偵測時間']],
    quiz: [
      { q: "For a small team, which detection gives the most signal with the least noise?",
        a: ["Alerting on every failed login", "A canary credential that alerts when anyone uses it", "Alerting on high CPU", "Reading all logs by hand each morning"], c: 1,
        why: "Nobody has a legitimate reason to use it, so every alert means something." },
      { q: "Why are detections based on behaviour more durable than those based on indicators?",
        a: ["They use less storage", "Attackers change addresses and file hashes easily, and changing how they operate is much harder", "Behaviours are encrypted", "Indicators are illegal to store"], c: 1,
        why: "A new server costs an attacker minutes. A new method costs real effort." },
      { q: "What is triage?",
        a: ["Deleting old logs", "Deciding for each alert whether it is real, how far it reaches and how serious it is", "Encrypting backups", "Writing firewall rules"], c: 1,
        why: "It turns a stream of alerts into a short list of things that need action." }
    ]
  },
  {
    id: 'pro-ir', lv: 4, mins: 13,
    title: 'Incident response and forensics',
    zh: '被入侵時：先隔離、先保全證據，不要急著重開機或刪檔案（記憶體裡的證據最先消失）。查出入口、範圍、後門；從乾淨映像檔重建；所有可能被看到的機密全部輪替。',
    body: `
<p>When a real intrusion is suspected, what you do in the first hour decides how much you will ever learn about it. The instinct to reboot and tidy up destroys the evidence.</p>
<h3>The phases</h3>
<table>
<tr><th>Phase</th><th>Work</th></tr>
<tr><td><b>Preparation</b></td><td>A written plan, contact list, access for responders, logging in place, tested backups. Done long before.</td></tr>
<tr><td><b>Detection and analysis</b></td><td>Confirm it is real. Establish what is affected.</td></tr>
<tr><td><b>Containment</b></td><td>Stop it spreading, without destroying evidence.</td></tr>
<tr><td><b>Eradication</b></td><td>Remove the attacker's access and close the hole they used.</td></tr>
<tr><td><b>Recovery</b></td><td>Bring clean systems back, and watch them closely.</td></tr>
<tr><td><b>Lessons learned</b></td><td>The postmortem.</td></tr>
</table>
<h3>Preserving evidence</h3>
<p>Evidence disappears at different speeds. Collect it in order of <b>volatility</b>:</p>
<ol>
<li><b>Memory:</b> running processes, open connections, keys in use. Lost on reboot.</li>
<li><b>Live state:</b> who is logged in, what is listening, recent commands.</li>
<li><b>Disk:</b> files, logs, timestamps.</li>
<li><b>Remote logs and backups.</b></li>
</ol>
<p>In the cloud the practical steps are: take a snapshot of the disk; cut the machine off with a firewall rule and leave it running; then investigate a copy. Record a hash of each piece of evidence, and note who handled it and when. That <b>chain of custody</b> is what makes it usable if the police become involved.</p>
<h3>The questions to answer</h3>
<ul>
<li><b>How did they get in?</b> If you do not find out, they will come back the same way.</li>
<li><b>What did they reach?</b> Which machines, data and secrets.</li>
<li><b>What did they leave behind?</b> New users, SSH keys added to authorised lists, scheduled jobs, new services, altered programs, new cloud users or keys.</li>
<li><b>When?</b> Build a timeline from login records, command history, file times and cloud audit logs.</li>
</ul>
<h3>Recovery</h3>
<p>Rebuild from clean images. A machine an attacker controlled cannot be trusted again, however carefully it is cleaned. Rotate every secret the machine could read. Fix the way in. Then restore service in stages, with extra monitoring.</p>
<h3>Going deeper: obligations</h3>
<p>Many laws require you to tell people. Taiwan's Personal Data Protection Act (個人資料保護法) requires notifying those whose data was leaked. Agencies under the Cyber Security Management Act must report an incident within one hour of learning of it. Regulated industries have their own deadlines. Find out which apply to you before you need to know.</p>
<h3>Going deeper: when cryptocurrency is stolen</h3>
<ul>
<li>Movements on a blockchain are public. Record the transaction and follow the funds.</li>
<li>Contact the exchanges the funds are heading for at once. They can sometimes freeze deposits, and minutes matter.</li>
<li>Report to the police, and keep every log.</li>
<li>Pause withdrawals and move what remains to keys the attacker cannot have seen.</li>
</ul>
<h3>Going deeper: rehearsal</h3>
<p>A <b>tabletop exercise</b> is a rehearsal on paper. Someone describes a scenario and the team talks through what each person would do. It costs an hour, and it shows that nobody knows where the recovery codes are while that discovery is still harmless.</p>`,
    tryNote: 'First-look commands on a Linux server. All of them only read. Practise now, so that they are familiar on a bad day.',
    try: [
      ['who; last -a | head; sudo lastb | head', 'Who is logged in, recent logins, and recent failed attempts.'],
      ['ps auxf | less', 'Every process as a tree. Look for anything you do not recognise, and anything started by the web server user.'],
      ['sudo ss -tnp', 'Every open TCP connection and the process that owns it.'],
      ['cat ~/.ssh/authorized_keys; crontab -l; ls /etc/cron.d', 'Common places for an attacker to leave a way back in.'],
      ['sudo find / -xdev -type f -mtime -2 -not -path "/proc/*" -not -path "/var/lib/docker/*" 2>/dev/null | head -40', 'Files changed in the last two days.']
    ],
    own: `Run a tabletop exercise alone, for twenty minutes, on paper. The scenario: &ldquo;A user reports that their account has just made a payment they did not approve, and your logs show an administrator login you do not recognise.&rdquo; Write your first ten actions in order, with the exact command or console page for each. Any step where you write &ldquo;not sure how&rdquo; is this week's homework.`,
    terms: [['incident response', '事件應變'], ['forensics', '數位鑑識'], ['volatility', '揮發性'], ['chain of custody', '證據保管鏈'], ['eradication', '根除'], ['backdoor', '後門'], ['tabletop exercise', '桌上演練']],
    quiz: [
      { q: "You suspect a server has been compromised. What should you do first?",
        a: ["Reboot it to clear the attacker out", "Isolate it at the firewall and take a snapshot, leaving it running", "Delete the suspicious files", "Reinstall the operating system at once"], c: 1,
        why: "Rebooting and deleting destroy the evidence you need to learn how they got in and what they reached." },
      { q: "Which evidence disappears first?",
        a: ["Backups", "Files on disk", "The contents of memory", "Printed reports"], c: 2,
        why: "Memory is lost at power-off or reboot, and it holds running processes, connections and keys." },
      { q: "Why rebuild a compromised machine and not clean it?",
        a: ["Rebuilding is faster", "You cannot be sure you found everything the attacker changed", "Cleaning is illegal", "The hardware is damaged"], c: 1,
        why: "A single missed backdoor gives them the machine again." }
    ]
  },
  {
    id: 'pro-vuln', lv: 3, mins: 11,
    title: 'Vulnerability management',
    zh: '弱點管理＝持續地「盤點、掃描、排優先、修、確認」。排優先不能只看 CVSS 分數：對外開放、而且已經有人在利用的弱點要最先修。',
    body: `
<p>New flaws are announced every day in the software you run. <b>Vulnerability management</b> is the routine that keeps you ahead of them: know what you have, find what is wrong with it, decide what matters, fix it, and confirm.</p>
<h3>The vocabulary</h3>
<table>
<tr><th>Term</th><th>Meaning</th></tr>
<tr><td><b>CVE</b></td><td>A public ID for one known flaw, such as CVE-2021-44228</td></tr>
<tr><td><b>CVSS</b></td><td>A severity score from 0 to 10: how bad the flaw is in theory</td></tr>
<tr><td><b>EPSS</b></td><td>An estimate of the probability that the flaw will be exploited soon</td></tr>
<tr><td><b>KEV</b></td><td>A list, kept by the US agency CISA, of flaws confirmed to have been exploited in real attacks</td></tr>
<tr><td><b>Zero-day</b></td><td>A flaw that attackers know about before a fix exists</td></tr>
<tr><td><b>N-day</b></td><td>A flaw with a fix available that you have not applied. Most real attacks use these.</td></tr>
</table>
<h3>The cycle</h3>
<div class="flow"><span class="box">Inventory<small>what do we run?</small></span><span class="arr">&rarr;</span><span class="box">Scan</span><span class="arr">&rarr;</span><span class="box hot">Prioritise</span><span class="arr">&rarr;</span><span class="box">Fix or mitigate</span><span class="arr">&rarr;</span><span class="box">Verify</span></div>
<h3>Prioritising</h3>
<p>A scanner will report hundreds of items. Sorting by CVSS alone is a mistake. Ask three things of each:</p>
<ol>
<li><b>Can an attacker reach it?</b> A flaw in something facing the internet outranks the same flaw on an internal tool.</li>
<li><b>Is it being exploited?</b> Anything on the KEV list comes first.</li>
<li><b>What would it give them?</b></li>
</ol>
<p>A flaw scored 7.5 that is internet-facing and on the KEV list should be fixed today. A flaw scored 9.8 in a library function your code never calls can wait for the normal update.</p>
<h3>When you cannot patch at once</h3>
<p>Reduce the exposure another way: block the vulnerable path with a WAF rule, switch the feature off, or restrict who can reach it. Or accept the risk in writing, with a named owner and a review date. Ignoring it silently is the one choice that is not allowed.</p>
<h3>Going deeper: scanners by layer</h3>
<table>
<tr><th>Layer</th><th>Tools</th></tr>
<tr><td>Libraries in your code</td><td>npm audit, Dependabot, Snyk</td></tr>
<tr><td>Container images</td><td>Trivy, Grype</td></tr>
<tr><td>Servers and networks</td><td>Nessus, OpenVAS</td></tr>
<tr><td>Cloud configuration</td><td>Prowler, ScoutSuite, the provider's own security hub</td></tr>
<tr><td>Infrastructure code</td><td>Checkov, tfsec, Trivy</td></tr>
<tr><td>Your own code</td><td>Static analysis (Semgrep, CodeQL) and dynamic scanning of the running app</td></tr>
</table>
<h3>Going deeper: looking at yourself from outside</h3>
<p>Search engines such as Shodan and Censys continuously scan the whole internet and publish what they find. Attackers use them to pick targets. Look yourself up regularly. It is the cheapest way to learn what you are exposing.</p>
<h3>Going deeper: time limits</h3>
<p>Mature teams set deadlines by severity and exposure, for example 48 hours for a critical internet-facing flaw and 30 days for a high one, and report how often they meet them. Software past its end of support receives no fixes at all, so replacing it must be planned in advance.</p>`,
    tryNote: 'On your Mac. The first needs: brew install trivy (it downloads a database of about 60 MB on first use).',
    try: [
      ['trivy fs --scanners vuln,secret,misconfig .', 'Run inside a project folder. Known flaws in dependencies, secrets left in files, and risky configuration.'],
      ['curl -s https://internetdb.shodan.io/YOUR_SERVER_IP', 'Open ports and known flaws that a public scanner has already linked to your address.']
    ],
    own: `Fill in a table with one row for each of these: the operating system on each of your servers, the reverse proxy, Docker itself, and your main language runtime. Columns: version, facing the internet or not, date last updated, still supported or not. Any row that is internet-facing and out of support is this month's task.`,
    terms: [['vulnerability', '漏洞／弱點'], ['CVE', '通用漏洞編號'], ['severity score', '嚴重度分數'], ['zero-day', '零時差漏洞'], ['mitigation', '緩解措施'], ['end of support', '終止支援'], ['inventory', '資產盤點']],
    quiz: [
      { q: "Which should be fixed first?",
        a: ["CVSS 9.8, in an internal library function your code never calls", "CVSS 7.5, on an internet-facing server and listed as actively exploited", "CVSS 4.0, on a test machine", "They should be fixed in order of CVSS only"], c: 1,
        why: "Reachable and being exploited beats a higher theoretical score." },
      { q: "What is an n-day vulnerability?",
        a: ["A flaw with no fix yet", "A known flaw whose fix exists and has not been applied", "A flaw that expires after n days", "A flaw found during the night"], c: 1,
        why: "Most real-world attacks use these, because many systems are patched late." },
      { q: "A fix cannot be applied this week. What is acceptable?",
        a: ["Say nothing and hope", "Reduce exposure another way, or accept the risk in writing with an owner and a review date", "Delete the scanner's report", "Turn off the scanner"], c: 1,
        why: "The decision must be visible and owned." }
    ]
  },
  {
    id: 'pro-grc', lv: 3, mins: 12,
    title: 'Governance, risk and compliance',
    zh: '治理與合規：把風險寫下來、決定怎麼處理（降低、轉移、避免、接受），並依標準（ISO 27001、SOC 2、PCI DSS）證明你真的有在做。台灣很多資安職缺一半是這塊。',
    body: `
<p>Engineers often regard this as paperwork. It is how an organisation decides what to protect, proves that it does, and obtains the budget for it. Large customers and regulators ask for it, and in Taiwan many security jobs are half engineering and half this.</p>
<h3>Risk management</h3>
<ol>
<li><b>Identify:</b> list assets and what could happen to each.</li>
<li><b>Assess:</b> how likely, and how damaging.</li>
<li><b>Treat:</b> choose one of four options.</li>
<li><b>Record</b> the decision in a <b>risk register</b>, with an owner and a review date.</li>
</ol>
<table>
<tr><th>Treatment</th><th>Meaning</th><th>Example</th></tr>
<tr><td>Mitigate</td><td>Reduce the likelihood or the damage</td><td>Add a second login factor</td></tr>
<tr><td>Transfer</td><td>Let someone else carry it</td><td>Insurance, a managed service</td></tr>
<tr><td>Avoid</td><td>Stop doing the risky thing</td><td>Do not store card numbers at all</td></tr>
<tr><td>Accept</td><td>Decide knowingly to live with it</td><td>Signed by the person responsible</td></tr>
</table>
<h3>Controls</h3>
<p>A <b>control</b> is anything that reduces a risk. Controls are <b>preventive</b> (a firewall), <b>detective</b> (an alert) or <b>corrective</b> (a backup). They are also technical, administrative (a policy, training) or physical (a locked room).</p>
<h3>The standards you will meet</h3>
<table>
<tr><th>Standard</th><th>What it is</th><th>Where it matters</th></tr>
<tr><td><b>ISO/IEC 27001</b></td><td>A standard for running an information security management system (ISMS). An organisation is audited and certified against it.</td><td>Very common in Taiwan and Europe</td></tr>
<tr><td><b>SOC 2</b></td><td>An auditor's report on a service provider's controls</td><td>Selling software to US companies</td></tr>
<tr><td><b>PCI DSS</b></td><td>Rules for anyone handling payment card data</td><td>Card payments</td></tr>
<tr><td><b>NIST Cybersecurity Framework</b></td><td>A way to organise a programme: govern, identify, protect, detect, respond, recover</td><td>A widely used reference</td></tr>
<tr><td><b>CIS Controls</b></td><td>Eighteen groups of practical safeguards, with a starter set marked for small organisations</td><td>The best first checklist for a small organisation</td></tr>
</table>
<h3>Law in Taiwan</h3>
<ul>
<li><b>Personal Data Protection Act</b> (個人資料保護法): rules on collecting, using and protecting personal data, and on notifying people when it leaks.</li>
<li><b>Cyber Security Management Act</b> (資通安全管理法): applies to government agencies and designated organisations. It sets responsibility levels, required staff and certificates, audits and incident reporting.</li>
<li>The financial regulator adds its own rules for banks, insurers and securities firms.</li>
</ul>
<h3>Going deeper: how an audit works</h3>
<p>An auditor does not take your word. For each control they ask for <b>evidence</b> that it operated over the period: tickets, logs, screenshots, records of reviews. This is where engineering helps. If access is granted through code review, deployments go through a pipeline, and infrastructure is defined in git, the evidence produces itself. The practice is called <b>compliance as code</b>.</p>
<h3>Going deeper: compliance and security differ</h3>
<p>A company can pass an audit and still be broken into, because a standard checks that controls exist and operate, and cannot check that they are sufficient against a determined attacker. What compliance does give is a minimum level and a written record. Real security is built on top of that.</p>
<h3>Going deeper: documents in order of detail</h3>
<p>A <b>policy</b> says what must be true (&ldquo;all administrative access requires a second factor&rdquo;). A <b>standard</b> says how it is measured. A <b>procedure</b> gives the steps. A <b>business continuity plan</b> covers how the organisation carries on during a disaster.</p>`,
    own: `Start a risk register for a system you run, with ten rows. Columns: asset, what could happen, likelihood from 1 to 5, impact from 1 to 5, current control, next action, review date. Put your most valuable key, the cloud root account, your own laptop and your main server in the first four rows. A kept-up risk register is exactly what an ISO 27001 auditor asks to see first.`,
    terms: [['governance', '治理'], ['compliance', '合規'], ['risk register', '風險登錄表'], ['control', '控制措施'], ['audit', '稽核'], ['ISMS', '資訊安全管理系統'], ['evidence', '佐證資料'], ['policy', '政策']],
    quiz: [
      { q: "What are the four ways to treat a risk?",
        a: ["Ignore, hide, deny, delay", "Mitigate, transfer, avoid, accept", "Scan, patch, test, deploy", "Encrypt, hash, sign, encode"], c: 1,
        why: "Every recorded risk gets one of these, chosen on purpose." },
      { q: "What does ISO/IEC 27001 certify?",
        a: ["That a product has no bugs", "That an organisation runs an information security management system that meets the standard", "That staff passed an exam", "That a network is fast"], c: 1,
        why: "It certifies the management system, the way the organisation runs security. It does not certify a product." },
      { q: "An organisation passes its audit. What does that prove?",
        a: ["It cannot be hacked", "The required controls exist and operated during the period audited", "It needs no further security work", "Its software has no flaws"], c: 1,
        why: "Compliance sets a floor and a record. It does not guarantee safety." }
    ]
  }
  ]
});
