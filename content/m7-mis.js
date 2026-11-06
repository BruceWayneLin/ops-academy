M({
  id: 'mis', n: 7,
  title: 'MIS: running a company\'s IT',
  zh: 'MIS（公司內部 IT）：帳號、電腦、辦公室網路、備份',
  time: '1 to 2 weeks',
  blurb: 'The parts of corporate IT that overlap with DevOps and security: identity, devices, the office network and backups.',
  lessons: [
  {
    id: 'mis-identity', lv: 2, mins: 12,
    title: 'What MIS is, and identity as its core',
    zh: 'MIS 是讓公司的人能安全順利工作的那群人。核心是「身分」：所有系統都用同一個帳號登入（單一登入），進公司自動開通、離職一鍵停用。',
    body: `
<p><b>MIS</b> (management information systems, usually just called &ldquo;IT&rdquo;) is the team that keeps a company's own people working: their accounts, laptops, network, software, backups and questions. DevOps serves the product. MIS serves the staff. In small companies one person often does both.</p>
<h3>Identity is the centre</h3>
<p>A company uses dozens of systems: email, chat, code hosting, the cloud console, payroll. If each has its own account and password, nobody can tell who has access to what, and a person who leaves keeps access for months.</p>
<p>The answer is an <b>identity provider</b>: one directory of people and groups that every other system trusts.</p>
<table>
<tr><th>Product</th><th>Where you meet it</th></tr>
<tr><td>Microsoft Entra ID (formerly Azure AD)</td><td>Companies using Microsoft 365</td></tr>
<tr><td>Google Workspace</td><td>Companies using Gmail and Google Drive</td></tr>
<tr><td>Okta, and similar</td><td>Companies that want a provider independent of both</td></tr>
<tr><td>Active Directory</td><td>The classic system that runs on the company's own servers. Still everywhere in established companies in Taiwan.</td></tr>
</table>
<h3>Single sign-on</h3>
<p>With <b>single sign-on</b> (SSO), a person logs in once to the identity provider, with a second factor, and every application accepts that. One place to enforce strong login. One place to see who has access. One switch to turn a person off.</p>
<h3>The life of an account</h3>
<table>
<tr><th>Event</th><th>What must happen</th></tr>
<tr><td><b>Joiner</b></td><td>Accounts created from the person's role on day one</td></tr>
<tr><td><b>Mover</b></td><td>New access added and old access removed. Access that is never removed piles up over the years.</td></tr>
<tr><td><b>Leaver</b></td><td>Disabled at the identity provider within the hour. Files handed over, tokens and keys cancelled, devices returned.</td></tr>
</table>
<h3>Going deeper: the protocols</h3>
<ul>
<li><b>SAML</b> is the older standard, based on XML, common in enterprise software.</li>
<li><b>OpenID Connect</b> (OIDC) is the modern one, built on OAuth 2.0 and using JSON tokens.</li>
<li>Both work the same way. The application sends you to the identity provider. It confirms who you are. It sends back a signed statement that the application trusts.</li>
<li><b>SCIM</b> creates and disables accounts in applications automatically when the directory changes.</li>
<li><b>LDAP</b> and <b>Kerberos</b> are the protocols inside Active Directory.</li>
</ul>
<h3>Going deeper: good habits</h3>
<ul>
<li><b>No shared accounts.</b> With a shared login there is no record of who did what, and you cannot remove one person.</li>
<li><b>A password manager</b> for the whole company.</li>
<li><b>Separate administrator accounts</b> from the ones used for email and browsing.</li>
<li><b>A sealed emergency account</b> for the day the identity provider is itself unavailable.</li>
<li><b>Access reviews</b> every quarter: each manager confirms who should still have what.</li>
<li><b>Conditional access:</b> sensitive systems require a company-managed device as well as the right person.</li>
</ul>
<p>The overlap with DevOps is direct: the same identity provider should sit in front of the cloud console, the code host, dashboards, the VPN and every admin panel.</p>`,
    own: `Even a company of one follows the same rules. List every account that only you can open and that the business depends on: the cloud root user, the domain registrar, the code host, the CDN, payment and banking accounts, app-store developer accounts. Is each in a password manager with a second factor? If your phone were lost today, could you still get into each one?`,
    terms: [['identity provider', '身分提供者'], ['single sign-on', '單一登入'], ['directory', '目錄服務'], ['provisioning', '帳號開通'], ['offboarding', '離職停權'], ['access review', '權限盤點']],
    quiz: [
      { q: "What is the main security benefit of single sign-on?",
        a: ["Users type fewer passwords", "Strong login is enforced in one place, and one switch disables a person everywhere", "Applications run faster", "It removes the need for a second factor"], c: 1,
        why: "Convenience is a side effect. Central control is the purpose." },
      { q: "An employee leaves today. What is the first step?",
        a: ["Wait for the end of the month", "Disable their account at the identity provider", "Change the office Wi-Fi name", "Delete their emails"], c: 1,
        why: "With single sign-on, that one action removes access everywhere at once." },
      { q: "Why are shared accounts a problem?",
        a: ["They cost more", "Nobody can tell who did what, and one person's access cannot be removed", "They are slower", "Browsers block them"], c: 1,
        why: "Accountability and revocation both depend on each person having their own identity." }
    ]
  },
  {
    id: 'mis-devices', lv: 2, mins: 10,
    title: 'Devices and endpoints',
    zh: '筆電才是真正的邊界：上面有登入狀態、SSH 金鑰、雲端憑證。基本功：全碟加密、自動更新、螢幕鎖、可遠端鎖定與清除。裝置遺失要有處理流程。',
    body: `
<p>A laptop holds live sessions for email and chat, saved passwords, SSH keys and cloud credentials. Whoever controls the laptop controls everything its owner can reach. For most companies the laptop is the real perimeter.</p>
<h3>Managing devices centrally</h3>
<p><b>MDM</b> (mobile device management) lets a company enrol its laptops and phones and then apply settings to all of them: install software, enforce policies, and lock or erase a device remotely. Jamf is common for Apple devices, Microsoft Intune for Windows and mixed fleets.</p>
<h3>The baseline for every device</h3>
<table>
<tr><th>Setting</th><th>Why</th></tr>
<tr><td>Full-disk encryption (FileVault, BitLocker)</td><td>A stolen laptop that is switched off reveals nothing</td></tr>
<tr><td>Screen lock after a few minutes</td><td>A laptop left open in a café</td></tr>
<tr><td>Automatic updates for the system and the browser, with a deadline</td><td>Most attacks on laptops use flaws already fixed</td></tr>
<tr><td>Firewall on</td><td>Hostile networks</td></tr>
<tr><td>No administrator rights for daily work</td><td>Malware inherits the rights of the user who runs it</td></tr>
<tr><td>Endpoint protection that reports centrally (EDR)</td><td>Someone finds out when a machine is infected</td></tr>
<tr><td>Backups</td><td>Loss, theft, ransomware</td></tr>
<tr><td>An inventory: who has which device</td><td>You cannot protect what you do not know about</td></tr>
</table>
<h3>When a device is lost</h3>
<ol>
<li>Lock or erase it remotely.</li>
<li>End the owner's sessions at the identity provider.</li>
<li>Rotate every key and token that was on it.</li>
<li>Check the logs for use of those credentials after the loss.</li>
</ol>
<h3>Going deeper: a developer's machine</h3>
<ul>
<li>Keep secrets in the system keychain or a password manager, and out of plain-text files in the home folder.</li>
<li>Protect SSH keys with a passphrase, or keep them on a hardware key.</li>
<li>Prefer short-lived cloud sessions obtained through single sign-on to permanent access keys in a file.</li>
<li>Be careful with what you install. A build tool or editor extension runs with all your access.</li>
</ul>
<h3>Going deeper: phishing</h3>
<p>Most intrusions into companies begin with a person being deceived: a fake login page, a document that needs macros enabled, a message that appears to come from the boss. Training helps a little. What helps most is login that resists phishing (passkeys), so that a deceived user has nothing useful to give away.</p>
<h3>Going deeper: personal devices</h3>
<p>When staff use their own phones or laptops, either keep work data in a separately managed profile, or allow those devices to reach web applications only, with nothing stored locally.</p>`,
    tryNote: 'Run on your Mac. These only read.',
    try: [
      ['fdesetup status', 'Whether the disk is encrypted.'],
      ['/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate', 'Whether the firewall is on.'],
      ['ls -la ~/.aws/credentials ~/.ssh/ 2>/dev/null', 'The cloud keys and SSH keys that live on this machine in files.'],
      ['sw_vers', 'Your macOS version. Compare it with the versions Apple still supplies security fixes for.']
    ],
    own: `Your own laptop probably holds everything: cloud keys, SSH keys, saved logins. Is disk encryption on? If it were stolen while unlocked, list every credential that would need to be rotated. Keep that list. Also check whether your operating system version still receives security fixes, which matters when deciding what should live on that machine.`,
    terms: [['endpoint', '端點裝置'], ['MDM', '行動裝置管理'], ['full-disk encryption', '全碟加密'], ['EDR', '端點偵測與回應'], ['remote wipe', '遠端清除'], ['asset inventory', '資產清冊']],
    quiz: [
      { q: "What does full-disk encryption protect against?",
        a: ["Phishing emails", "Someone reading the disk of a lost or stolen laptop that is switched off", "Slow networks", "Software bugs"], c: 1,
        why: "Without the login, the disk is unreadable. It does nothing once the machine is unlocked." },
      { q: "A laptop holding SSH keys and cloud credentials is stolen. Beyond erasing it remotely, what else must be done?",
        a: ["Nothing, the erase is enough", "End the owner's sessions and rotate every key and token that was on it", "Buy the same model", "Change the Wi-Fi password only"], c: 1,
        why: "The erase may not arrive in time. Credentials that could have been copied must be made useless." }
    ]
  },
  {
    id: 'mis-office', lv: 2, mins: 11,
    title: 'The office network and backups',
    zh: '辦公室網路用 VLAN 分區（員工、訪客、伺服器、印表機與攝影機），區與區之間有防火牆規則。Wi-Fi 最好每人自己的帳號登入。備份照 3-2-1，而且要真的還原過。',
    body: `
<h3>The parts of an office network</h3>
<div class="flow"><span class="box">Internet</span><span class="arr">&rarr;</span><span class="box hot">Firewall / router</span><span class="arr">&rarr;</span><span class="box">Switches</span><span class="arr">&rarr;</span><span class="box">Wi-Fi access points</span><span class="box">Desktops, printers</span><span class="box">Servers, NAS</span></div>
<ul>
<li>The <b>firewall or router</b> connects the office to the internet and controls what passes. FortiGate, pfSense and UniFi are common.</li>
<li><b>Switches</b> connect wired devices. <b>Access points</b> provide Wi-Fi.</li>
<li><b>DHCP</b> gives each device its address automatically. An internal <b>DNS</b> gives names to internal machines.</li>
</ul>
<h3>VLANs: several networks on one set of cables</h3>
<p>A <b>VLAN</b> is a virtual network. The same switches carry several, kept apart, with firewall rules deciding what may cross between them.</p>
<table>
<tr><th>Zone</th><th>Who</th><th>May reach</th></tr>
<tr><td>Staff</td><td>Company laptops</td><td>Internet, servers</td></tr>
<tr><td>Guests</td><td>Visitors' devices</td><td>Internet only</td></tr>
<tr><td>Servers</td><td>File server, NAS</td><td>Only what they need</td></tr>
<tr><td>Devices</td><td>Printers, cameras, TVs, door systems</td><td>As little as possible. These are rarely updated and easily taken over.</td></tr>
</table>
<h3>Wi-Fi</h3>
<ul>
<li><b>One shared password</b> (WPA2 or WPA3 Personal) leaves with every person who has ever known it.</li>
<li><b>Enterprise mode</b> (802.1X): each person logs in to the Wi-Fi with their own account or certificate. Remove the person and their access ends.</li>
<li>Guest Wi-Fi is always a separate, isolated zone.</li>
</ul>
<h3>Working from elsewhere</h3>
<table>
<tr><th>Approach</th><th>How it works</th><th>Weakness</th></tr>
<tr><td>Classic VPN (IPsec, OpenVPN, WireGuard)</td><td>The remote laptop joins the office network</td><td>Once in, it can often reach everything</td></tr>
<tr><td>Zero-trust access (Tailscale, Cloudflare Access)</td><td>Each application is reached separately, after checking the person and the device</td><td>More to set up</td></tr>
</table>
<h3>Backups</h3>
<p>The 3-2-1 rule from lesson 4.5 applies to the office as well: three copies, two kinds of storage, one elsewhere, and one that cannot be altered. Two additions:</p>
<ul>
<li><b>Cloud services need backing up too.</b> Google and Microsoft protect you from their own failures. They do not protect you from your own deletions, or from an attacker who gets into an account.</li>
<li><b>Restore something every quarter</b> and time it.</li>
</ul>
<h3>Going deeper: the dull things that cause outages</h3>
<ul>
<li>A domain or certificate that was not renewed. Keep a calendar of every renewal.</li>
<li>One internet line with no second one.</li>
<li>No battery backup (UPS) on the network equipment.</li>
<li>Router and firewall firmware that has not been updated for years. These devices face the internet and are attacked constantly.</li>
<li>One person who knows all the passwords.</li>
</ul>
<h3>Going deeper: documentation</h3>
<p>A network diagram, a plan of addresses, a list of suppliers and contracts, and an administrator password vault that more than one trusted person can open. In an emergency this is the difference between an hour and a day.</p>
<div class="note"><b>Career note.</b> MIS is broad and involves a lot of contact with people. DevOps is narrower, deeper and built around automation. The parts worth having for both are identity, networking, a security baseline, and backups, which is what this module has covered.</div>`,
    tryNote: 'Run on your Mac, on your home network.',
    try: [
      ['networksetup -getinfo Wi-Fi', 'Your address, the router, and the subnet mask that DHCP gave you.'],
      ['arp -a', 'The devices your Mac has seen on the local network. Do you recognise all of them?'],
      ['scutil --dns | grep nameserver | sort -u', 'Which DNS servers you are using.']
    ],
    own: `Apply this at home. Which devices share your network? Is there a separate network for guests and for things like TVs and cameras? When was the router's firmware last updated? If you reach any machine at home remotely, how is that path protected, and what could someone who reached that machine do next?`,
    terms: [['VLAN', '虛擬區域網路'], ['switch', '交換器'], ['access point', '無線基地台'], ['DHCP', '動態主機設定協定'], ['firmware', '韌體'], ['UPS', '不斷電系統']],
    quiz: [
      { q: "What is a VLAN for?",
        a: ["Making Wi-Fi faster", "Keeping groups of devices apart on the same equipment, with rules for what may cross", "Encrypting email", "Backing up files"], c: 1,
        why: "Guests, printers and staff share switches and still cannot reach each other unless a rule allows it." },
      { q: "What is the advantage of enterprise Wi-Fi login over one shared password?",
        a: ["Longer range", "Each person has their own credentials, which can be removed individually", "It is free", "It needs no access points"], c: 1,
        why: "A shared password cannot be taken back from one person without changing it for everyone." },
      { q: "The company keeps all its documents in a cloud drive. Does it still need its own backup?",
        a: ["No, the provider backs everything up", "Yes: the provider does not protect against your own deletions or a compromised account", "Only for photos", "Only if the files are large"], c: 1,
        why: "The provider keeps the service running. The data is your responsibility." }
    ]
  }
  ]
});
