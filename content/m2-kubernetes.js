M({
  id: 'k8s', n: 2,
  title: 'Containers, Kubernetes and automation',
  zh: '容器、Kubernetes、基礎設施即程式碼、CI/CD',
  time: '6 to 8 weeks',
  blurb: 'Package software so it runs the same everywhere, let a system keep it running, and make every change through code.',
  lessons: [
  {
    id: 'ctr-what', lv: 2, mins: 12,
    title: 'What a container really is',
    zh: '容器不是小型虛擬機，而是一個被「戴上眼罩（看不到別人）＋給了預算（CPU 與記憶體上限）」的普通 Linux 行程。映像檔是唯讀的一疊檔案層。',
    body: `
<p>A container is a way to package a program with everything it needs, so that it runs the same on your laptop and on a server. It is often described as a small virtual machine. It is something simpler: an ordinary Linux process that has been given blinkers and a budget.</p>
<ul>
<li><b>Blinkers (namespaces):</b> the process gets its own view of the system. It sees only its own processes, its own network, its own files.</li>
<li><b>A budget (cgroups):</b> the kernel caps how much CPU and memory it may use.</li>
</ul>
<table>
<tr><th></th><th>Virtual machine</th><th>Container</th></tr>
<tr><td>Contains</td><td>A whole operating system</td><td>One program and its files</td></tr>
<tr><td>Kernel</td><td>Its own</td><td>Shared with the host</td></tr>
<tr><td>Starts in</td><td>Tens of seconds</td><td>Under a second</td></tr>
<tr><td>Isolation</td><td>Strong</td><td>Weaker: a kernel bug or a careless setting can break it</td></tr>
</table>
<h3>Images and containers</h3>
<p>An <b>image</b> is a read-only stack of file layers plus a note about what to run. Each instruction in a Dockerfile adds a layer. A <b>container</b> is a running image with a thin writable layer on top. That layer disappears when the container is removed, so anything worth keeping goes in a <b>volume</b>.</p>
<h3>Why operations people like them</h3>
<ul>
<li>The same artifact goes from laptop to production. &ldquo;It worked on my machine&rdquo; stops being a problem.</li>
<li>You replace containers and never patch them in place. Every copy is known to be identical.</li>
<li>Rolling back means running the previous image.</li>
</ul>
<h3>Going deeper: a good image</h3>
<ul>
<li><b>Small base</b> (slim or distroless). Fewer packages means fewer security holes.</li>
<li><b>Multi-stage build:</b> compile in one stage, copy only the result into the final image.</li>
<li><b>Run as a non-root user.</b> By default the process inside is root.</li>
<li><b>Pin versions.</b> <code>node:22.11-slim</code>, not <code>node:latest</code>.</li>
<li><b>One process per container</b>, logging to standard output.</li>
<li><b>No secrets in the image.</b> Layers are permanent, and <code>docker history</code> shows them to anyone who has the image.</li>
</ul>
<h3>Going deeper: how containers escape</h3>
<p>Three settings hand a container the keys to the host: <code>--privileged</code>, mounting the Docker socket (<code>/var/run/docker.sock</code>) into it, and mounting host directories such as <code>/</code>. Any one of them makes &ldquo;break into this container&rdquo; equal to &ldquo;own the machine&rdquo;.</p>
<p>On a Mac, containers run inside a small Linux virtual machine (colima, in your case), because they need a Linux kernel.</p>`,
    tryNote: 'Run on your Mac with colima started. The alpine image is about 8 MB.',
    try: [
      ['docker run --rm alpine ps aux', 'The container sees only its own process. That is the blinkers.'],
      ['docker run --rm -m 64m alpine cat /sys/fs/cgroup/memory.max', 'Prints 67108864: the 64 MB budget, enforced by the kernel.'],
      ['docker run --rm alpine id', 'uid=0. Unless the image says otherwise, the process inside is root.']
    ],
    own: `Pick one of your own images. How large is it (<code>docker images</code>)? Does it run as root? (<code>docker inspect -f "{{.Config.User}}" IMAGE</code> prints nothing when no user was set, which means root.) Does <code>docker history --no-trunc IMAGE</code> show a password or key that was passed in at build time?`,
    terms: [['container', '容器'], ['image', '映像檔'], ['layer', '層'], ['volume', '儲存卷'], ['namespace', '命名空間'], ['registry', '映像檔倉庫']],
    quiz: [
      { q: "What is the key technical difference between a container and a virtual machine?",
        a: ["Containers are always faster to download", "A container shares the host's kernel, a virtual machine runs its own", "Virtual machines cannot use networks", "Containers cannot run databases"], c: 1,
        why: "Sharing the kernel makes containers light and quick, and also makes their isolation weaker." },
      { q: "A container writes a file to its own filesystem and is then removed. What happens to the file?",
        a: ["It is saved into the image", "It is lost, unless it was written to a volume", "It moves to the host's home directory", "It is uploaded to the registry"], c: 1,
        why: "The writable layer belongs to that container and goes with it." }
    ]
  },
  {
    id: 'k8s-idea', lv: 2, mins: 12,
    title: 'Kubernetes: the idea and the machinery',
    zh: 'Kubernetes 的核心只有一個：你宣告「想要的狀態」，它不斷比較現況、把差距補上，就像恆溫器。機器掛了，上面的容器會自動在別台重開。',
    body: `
<p>Suppose you have fifty containers and ten machines. Something has to decide where each container runs, restart the ones that crash, move them when a machine dies, roll out new versions, and route traffic to them. <b>Kubernetes</b> is that something.</p>
<h3>The one idea</h3>
<p>You do not tell Kubernetes what to do. You tell it what you want: &ldquo;three copies of game-api version 1.4, each with half a CPU&rdquo;. It compares that with reality, over and over, and corrects any difference. A thermostat works the same way. This loop is called <b>reconciliation</b>, and the rest of Kubernetes is detail built on it.</p>
<h3>The machinery</h3>
<div class="tiers">
<b>Control plane</b><div><span class="box hot">API server<small>the only door, everything talks to it</small></span><span class="box">etcd<small>the database of wanted and actual state</small></span><span class="box">Scheduler<small>picks a machine for each new pod</small></span><span class="box">Controllers<small>the thermostats</small></span></div>
<b>Each node</b><div><span class="box">kubelet<small>starts and stops containers as told</small></span><span class="box">Container runtime<small>containerd</small></span><span class="box">kube-proxy<small>network rules</small></span></div>
</div>
<p>You talk to the API server with a tool called <code>kubectl</code>, usually by handing it YAML files that describe what you want.</p>
<h3>What follows from this</h3>
<ul>
<li><b>Self-healing.</b> A machine dies, and its containers are started somewhere else without anyone being woken.</li>
<li><b>You stop fixing things by hand.</b> You change the description, and the system changes reality.</li>
<li><b>etcd is the cluster's memory.</b> It is run as three or five copies and backed up.</li>
</ul>
<h3>Going deeper: sizes of Kubernetes</h3>
<ul>
<li><b>Managed</b> (EKS, GKE, AKS): the provider runs the control plane. This is what most companies use.</li>
<li><b>k3s:</b> the whole thing as one small program. Right for learning, edge devices and small production.</li>
</ul>
<div class="note"><b>An honest view.</b> Kubernetes pays for itself when there are many services, teams or machines. For a handful of containers on one machine, Docker Compose is simpler and enough. Learn Kubernetes because the industry runs on it and employers ask for it, and because its ideas (declare the wanted state, check health, roll out gradually) apply everywhere.</div>`,
    tryNote: 'Run in a free Killercoda Kubernetes playground (killercoda.com/playgrounds). It runs in the browser and puts no load on your Mac.',
    try: [
      ['kubectl get nodes -o wide', 'The machines in the cluster.'],
      ['kubectl get pods -A', 'Everything running, including Kubernetes\' own parts.'],
      ['kubectl create deployment hello --image=nginx --replicas=3 && kubectl get pods -w', 'Ask for three copies and watch them appear. Press Control+C to stop watching.'],
      ['kubectl delete pod $(kubectl get pods -l app=hello -o name | head -1 | cut -d/ -f2) && kubectl get pods', 'Kill one. A replacement is already starting: the thermostat noticed.'],
      ['kubectl delete deployment hello', 'Clean up.']
    ],
    own: `Write down what restarts your containers today when one crashes: a Docker restart policy, systemd, or nothing? Then write what would happen if the machine itself died tonight. The gap between those two answers is what an orchestrator fills.`,
    terms: [['cluster', '叢集'], ['node', '節點'], ['control plane', '控制平面'], ['desired state', '期望狀態'], ['reconciliation', '調和'], ['orchestrator', '編排器']],
    quiz: [
      { q: "You delete one pod that belongs to a Deployment set to 3 replicas. What happens?",
        a: ["The Deployment now runs with 2", "A controller sees 2 where 3 are wanted and creates a replacement", "The whole Deployment is deleted", "Nothing, until you run a command"], c: 1,
        why: "Reality no longer matches the wanted state, so the loop closes the gap." },
      { q: "Which component stores the state of the cluster?",
        a: ["kubelet", "The scheduler", "etcd", "kube-proxy"], c: 2,
        why: "etcd holds what was asked for and what exists. Lose it without a backup and the cluster forgets everything." }
    ]
  },
  {
    id: 'k8s-objects', lv: 2, mins: 12,
    title: 'The core objects',
    zh: 'Pod 是最小單位、Deployment 維持 N 份、Service 給一個固定的名字與位址、Ingress 管對外的 HTTP 路由、ConfigMap／Secret 放設定。',
    body: `
<p>Everything in Kubernetes is an <b>object</b>: a small description of something you want to exist. Seven objects cover most real work.</p>
<table>
<tr><th>Object</th><th>What it is</th></tr>
<tr><td><b>Pod</b></td><td>The smallest unit: one container, sometimes a few that share an address. Pods are disposable. When a pod is replaced, the new one has a new address.</td></tr>
<tr><td><b>Deployment</b></td><td>&ldquo;Keep N identical pods running, and replace them gradually when the version changes.&rdquo;</td></tr>
<tr><td><b>Service</b></td><td>A stable name and address in front of a changing set of pods. It also spreads traffic across them.</td></tr>
<tr><td><b>Ingress</b></td><td>HTTP routing from outside: this hostname and path go to that Service. Usually ends TLS as well.</td></tr>
<tr><td><b>ConfigMap</b></td><td>Settings that are not secret.</td></tr>
<tr><td><b>Secret</b></td><td>Settings that are secret.</td></tr>
<tr><td><b>Namespace</b></td><td>A folder that groups objects, for separating teams or environments.</td></tr>
</table>
<div class="flow"><span class="box">Internet</span><span class="arr">&rarr;</span><span class="box">Ingress</span><span class="arr">&rarr;</span><span class="box hot">Service<small>stable name</small></span><span class="arr">&rarr;</span><span class="box">Pod</span><span class="box">Pod</span><span class="box">Pod</span></div>
<h3>Labels hold it together</h3>
<p>Objects find each other through <b>labels</b>. Pods carry <code>app: web</code>. The Service says &ldquo;send traffic to anything labelled <code>app: web</code>&rdquo;. Nothing is wired by address.</p>
<pre><code>apiVersion: apps/v1
kind: Deployment
metadata: { name: web }
spec:
  replicas: 3
  selector: { matchLabels: { app: web } }
  template:
    metadata: { labels: { app: web } }
    spec:
      containers:
      - name: web
        image: nginx:1.27
        ports: [{ containerPort: 80 }]
---
apiVersion: v1
kind: Service
metadata: { name: web }
spec:
  selector: { app: web }
  ports: [{ port: 80, targetPort: 80 }]</code></pre>
<p>Other pods can now reach this at <code>http://web</code>. Kubernetes runs its own DNS for Service names.</p>
<h3>Going deeper</h3>
<ul>
<li><b>Service types.</b> ClusterIP is reachable inside the cluster only (the default). NodePort opens a port on every machine. LoadBalancer asks the cloud for a real load balancer.</li>
<li><b>A Secret is only Base64-encoded by default.</b> Anyone who can read the object can read the value. Turn on encryption at rest, restrict who may read Secrets, or keep the real values in a secrets manager.</li>
<li><b>Ingress needs a controller</b> to do the work, such as Traefik, HAProxy or your cloud provider's own. The long-popular ingress-nginx controller was retired in 2026, and a newer design called Gateway API is replacing Ingress.</li>
</ul>`,
    tryNote: 'In a Killercoda playground. Save the YAML above as web.yaml first (paste it into: cat > web.yaml).',
    try: [
      ['kubectl apply -f web.yaml && kubectl get deploy,pods,svc -l app=web', 'Create the objects and list them. Run the second half again until the pods are Running.'],
      ['kubectl run tmp --rm -it --restart=Never --image=busybox -- wget -qO- http://web | head -4', 'From a throwaway pod, call the Service by name.'],
      ['kubectl scale deploy web --replicas=5 && kubectl get endpointslices -l kubernetes.io/service-name=web', 'Scale up. The Service follows the new pods by label.']
    ],
    own: `On paper, translate your current Docker setup into these objects. Each long-running container becomes a Deployment. The routing in your proxy becomes an Ingress. Your .env files become ConfigMaps and Secrets. Published ports become Services. You now know what a move to Kubernetes would involve.`,
    terms: [['pod', 'Pod（容器組）'], ['deployment', 'Deployment（部署）'], ['service', 'Service（服務）'], ['ingress', 'Ingress（入口）'], ['label', '標籤'], ['selector', '選擇器'], ['replica', '副本']],
    quiz: [
      { q: "Why is a Service needed in front of pods?",
        a: ["Pods cannot use the network on their own", "Pod addresses change whenever a pod is replaced, and a Service gives one stable name that follows them", "It makes containers start faster", "It encrypts the pods"], c: 1,
        why: "Pods come and go. Callers need something that stays put." },
      { q: "How is the value in a Kubernetes Secret protected by default?",
        a: ["Encrypted with AES", "Hashed with SHA-256", "Only Base64-encoded, which is not protection", "Stored on a separate machine"], c: 2,
        why: "Base64 is encoding. Real protection comes from encryption at rest and strict access rules." }
    ]
  },
  {
    id: 'k8s-health', lv: 3, mins: 14,
    title: 'Health, resources, scaling and rollouts',
    zh: '探針告訴 Kubernetes 容器是「卡住了」還是「還沒準備好」；requests 是保留量、limits 是上限（超過記憶體上限會被殺）；滾動更新一批一批換、有問題可以退回。',
    body: `
<p>Kubernetes can only keep an application healthy if the application tells it what healthy means. Four settings do that.</p>
<h3>1. Probes</h3>
<table>
<tr><th>Probe</th><th>Question</th><th>On failure</th></tr>
<tr><td><b>Liveness</b></td><td>Am I stuck?</td><td>The container is restarted</td></tr>
<tr><td><b>Readiness</b></td><td>Can I take traffic right now?</td><td>The pod is taken out of the Service. It is not killed.</td></tr>
<tr><td><b>Startup</b></td><td>Have I finished booting?</td><td>The other probes wait</td></tr>
</table>
<p>The classic mistake is a liveness probe that checks the database. The database slows down for a moment, every pod fails, and Kubernetes restarts all of them, which turns a hiccup into an outage. Liveness should test only the process itself.</p>
<h3>2. Requests and limits</h3>
<ul>
<li>A <b>request</b> is what the scheduler reserves for the container. It is guaranteed.</li>
<li>A <b>limit</b> is a hard cap. Above the memory limit the container is killed (&ldquo;OOMKilled&rdquo;). Above the CPU limit it is slowed down, and not killed.</li>
<li>With no requests set, pods crowd onto machines and starve each other.</li>
</ul>
<pre><code>resources:
  requests: { cpu: 250m, memory: 256Mi }
  limits:   { memory: 512Mi }
readinessProbe:
  httpGet: { path: /ready, port: 8080 }
  periodSeconds: 5
livenessProbe:
  httpGet: { path: /alive, port: 8080 }
  periodSeconds: 10</code></pre>
<h3>3. Scaling</h3>
<p>A <b>HorizontalPodAutoscaler</b> adds and removes pods to hold a metric, such as CPU, near a target. A <b>cluster autoscaler</b> adds machines when pods no longer fit. Both take time: a new machine needs minutes. Keep enough spare capacity to cover that delay.</p>
<h3>4. Rollouts</h3>
<p>A <b>rolling update</b> starts a few new pods, waits until they pass readiness, removes a few old ones, and repeats. If the new version never becomes ready, the rollout stops and the old pods keep serving. <code>kubectl rollout undo</code> goes back a version.</p>
<h3>Going deeper: shutting down gracefully</h3>
<p>When a pod is to be removed it receives SIGTERM and has 30 seconds by default before it is killed. A well-behaved server uses that time to stop accepting new work, finish what is in progress, and close connections. A server that ignores SIGTERM drops users on every deploy.</p>
<h3>Going deeper: things with state</h3>
<p>Pods are disposable, so data needs a <b>PersistentVolume</b>, a disk that outlives the pod. A <b>StatefulSet</b> gives each pod a stable name (<code>db-0</code>, <code>db-1</code>) and its own disk. Many teams still keep databases on a managed service outside the cluster and run only stateless apps inside it. That is a sensible default.</p>
<p>A <b>PodDisruptionBudget</b> tells Kubernetes how many pods of an app must stay up during planned work such as draining a machine.</p>`,
    tryNote: 'In a Killercoda playground, using the Deployment named web from lesson 2.3.',
    try: [
      ['kubectl set image deploy/web web=nginx:1.28 && kubectl rollout status deploy/web', 'A rolling update to a new version.'],
      ['kubectl rollout history deploy/web && kubectl rollout undo deploy/web', 'See the versions, then go back one.'],
      ['kubectl set image deploy/web web=nginx:no-such-version; sleep 20; kubectl get pods -l app=web', 'A broken release. New pods fail to start and the old ones keep serving. Undo it afterwards.']
    ],
    own: `For one of your services, answer three questions. How does it show it is ready for traffic after starting? How long does starting take? What does it do when it receives SIGTERM: drop its users, or finish the work in progress first? Those three answers are its readiness probe, its startup probe and its grace period.`,
    terms: [['probe', '探針'], ['liveness', '存活探測'], ['readiness', '就緒探測'], ['resource limit', '資源上限'], ['autoscaling', '自動擴展'], ['rolling update', '滾動更新'], ['rollback', '回復上一版'], ['graceful shutdown', '優雅關閉']],
    quiz: [
      { q: "A pod's readiness probe starts failing. What does Kubernetes do?",
        a: ["Restarts the container", "Stops sending it traffic and leaves it running", "Deletes the Deployment", "Adds more memory"], c: 1,
        why: "Readiness controls traffic only. Restarting is the job of the liveness probe." },
      { q: "A container uses more memory than its limit. What happens?",
        a: ["It is slowed down", "It is killed and reported as OOMKilled", "The limit rises automatically", "Nothing"], c: 1,
        why: "Memory cannot be throttled the way CPU can, so the container is killed." },
      { q: "Why should a liveness probe not depend on the database?",
        a: ["Databases cannot answer probes", "A brief database problem would make every pod restart at once", "It uses too much CPU", "Probes must use UDP"], c: 1,
        why: "A shared dependency in a liveness check converts a small fault into a mass restart." }
    ]
  },
  {
    id: 'iac', lv: 3, mins: 12,
    title: 'Infrastructure as code',
    zh: '把伺服器、網路、防火牆的設定寫成檔案放進 git，而不是在主控台點來點去。這樣才有紀錄、可以審查、可以重建。',
    body: `
<p>If you build servers by clicking in a web console, there is no record of what was done, nobody reviewed it, and you cannot repeat it. Six months later the question &ldquo;who opened that port, and why?&rdquo; has no answer.</p>
<p><b>Infrastructure as code</b> means the setup lives in files in git. Changes are reviewed like any other code. History shows who changed what. The whole environment can be rebuilt from nothing, and a test environment can be a true copy of production.</p>
<h3>Terraform</h3>
<p>Terraform (and OpenTofu, its open-source twin) is the standard tool. You describe what should exist. It works out how to get there.</p>
<pre><code>resource "aws_security_group_rule" "https" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.web.id
}</code></pre>
<ul>
<li><code>plan</code> shows the difference between your files and reality, and changes nothing.</li>
<li><code>apply</code> makes reality match the files.</li>
<li>The <b>state file</b> records what Terraform created, so it knows what it owns. It is precious and may contain secrets. Teams keep it in shared storage with a lock, and never in git.</li>
<li><b>Drift</b> is when someone changes something by hand. The next plan shows it.</li>
</ul>
<h3>For Kubernetes</h3>
<ul>
<li><b>Helm</b> packages a set of YAML files as a &ldquo;chart&rdquo; with adjustable values, so the same chart serves staging and production.</li>
<li><b>GitOps</b> (Argo CD, Flux): an agent in the cluster watches a git repository and applies whatever is there. A deploy is a merge. A rollback is a revert. Nobody needs direct access to production.</li>
</ul>
<h3>Going deeper: pets and cattle</h3>
<p>A &ldquo;pet&rdquo; server has a name, was set up by hand, and is nursed back to health when it is ill. &ldquo;Cattle&rdquo; servers are identical and numbered, and a sick one is replaced. Code turns pets into cattle. The test is simple: if this machine vanished right now, could you have an identical one serving traffic within the hour, working only from git and your backups?</p>
<h3>Going deeper: modules and environments</h3>
<p>Repeated pieces (a service with its load balancer and alarms) are written once as a <b>module</b> and reused with different inputs. Each environment gets its own state. Secrets are referenced by name and fetched at run time, and never written into the files.</p>`,
    tryNote: 'A free exercise on your Mac that creates only a local file. Install with: brew install opentofu. Then make an empty folder and run these inside it.',
    try: [
      ['printf \'resource "local_file" "hello" {\\n  filename = "hello.txt"\\n  content  = "managed by code"\\n}\\n\' > main.tf && tofu init', 'Write the description and download the provider.'],
      ['tofu plan', 'It says it will create one file. Nothing has happened yet.'],
      ['tofu apply -auto-approve && cat hello.txt', 'Now it exists.'],
      ['echo "edited by hand" > hello.txt && tofu plan', 'Drift: the tool sees that reality no longer matches the code and offers to put it back.']
    ],
    own: `Imagine moving everything to a new machine tomorrow. Whatever exists only on the old machine would be lost, and scheduled jobs are the classic thing to forget. List everything that today exists only as hand-made state on a server: the crontab, the proxy configuration, firewall rules, .env files. Each item is a candidate to move into a git repository.`,
    terms: [['infrastructure as code', '基礎設施即程式碼'], ['declarative', '宣告式'], ['state file', '狀態檔'], ['drift', '設定飄移'], ['GitOps', 'GitOps'], ['module', '模組']],
    quiz: [
      { q: "What is the Terraform state file?",
        a: ["A log of who ran commands", "A record of the real resources Terraform manages, used to work out what must change", "A backup of your database", "A list of passwords for the team"], c: 1,
        why: "It connects your files to real resources. Lose it and Terraform no longer knows what it owns." },
      { q: "In a GitOps setup, how is a new version deployed?",
        a: ["An engineer runs kubectl on their laptop", "A change is merged into git and an agent in the cluster applies it", "Files are copied to the server by FTP", "The cluster is rebuilt"], c: 1,
        why: "Git is the source of truth. The cluster pulls changes, and people do not push them." }
    ]
  },
  {
    id: 'cicd', lv: 3, mins: 12,
    title: 'CI/CD: from commit to production',
    zh: 'CI：每次推程式碼就自動建置與測試。CD：通過的版本自動（或一鍵）上線。原則是「只建一次、同一個映像檔一路推到正式站」，而且隨時能退版。',
    body: `
<p><b>Continuous integration</b> (CI) means every push is built and tested automatically, so a break is found in minutes and by a machine. <b>Continuous delivery</b> (CD) means every build that passes can be released automatically or with one click. Together they form the <b>pipeline</b>, and the pipeline should be the only road to production.</p>
<div class="flow"><span class="box">Commit</span><span class="arr">&rarr;</span><span class="box">Build image</span><span class="arr">&rarr;</span><span class="box">Test</span><span class="arr">&rarr;</span><span class="box">Scan<small>dependencies, image, secrets</small></span><span class="arr">&rarr;</span><span class="box">Push<small>tagged with the commit ID</small></span><span class="arr">&rarr;</span><span class="box">Staging</span><span class="arr">&rarr;</span><span class="box hot">Production<small>gradually</small></span><span class="arr">&rarr;</span><span class="box">Watch, roll back</span></div>
<h3>Rules that prevent most disasters</h3>
<ul>
<li><b>Build once.</b> The image tested in staging is the same file that goes to production. Only configuration differs.</li>
<li><b>Tag with the commit ID</b>, never <code>latest</code>. You always know exactly what is running, and rolling back is precise.</li>
<li><b>Keep it fast.</b> A pipeline that takes an hour gets bypassed.</li>
<li><b>Secrets come from the pipeline's secret store</b>, never from the repository.</li>
<li><b>A release is not finished at &ldquo;deployed&rdquo;.</b> It is finished when the error rate and latency still look normal afterwards.</li>
</ul>
<h3>Ways to release</h3>
<table>
<tr><th>Strategy</th><th>How</th><th>Trade-off</th></tr>
<tr><td>Rolling</td><td>Replace servers a few at a time</td><td>Simple. Old and new run side by side for a while.</td></tr>
<tr><td>Blue-green</td><td>Run a complete second copy, then switch traffic</td><td>Instant rollback. Double the cost during the switch.</td></tr>
<tr><td>Canary</td><td>Send 1 to 5% of traffic to the new version, compare, widen</td><td>A bad release hurts few users. Needs good metrics.</td></tr>
<tr><td>Feature flag</td><td>Ship the code switched off, turn it on later</td><td>Separates deploying from releasing. Flags pile up.</td></tr>
</table>
<h3>Going deeper: database changes</h3>
<p>During a rollout, old and new code run together against one database, so a schema change must work with both. The safe pattern is <b>expand, then contract</b>: add the new column; deploy code that writes to both; copy the old data across; switch reads to the new column; and only then remove the old one. Each step can be rolled back on its own.</p>
<h3>Going deeper: trust in the pipeline</h3>
<p>The pipeline holds the power to change production, which makes it a prime target. Protect the main branch with required reviews. Let the pipeline obtain short-lived cloud credentials at run time (OIDC) so no long-lived keys are stored. Remember that a malicious dependency runs inside the pipeline with access to its secrets.</p>
<p>Common tools: GitHub Actions, GitLab CI, Jenkins, Argo CD.</p>`,
    own: `You probably already follow a release routine by hand: run the tests, check in a browser, build, deploy. Write those steps as a numbered list. Mark each step that a machine could run without you. That list is the first draft of your pipeline file.`,
    terms: [['continuous integration', '持續整合'], ['continuous delivery', '持續交付'], ['pipeline', '管線'], ['canary release', '金絲雀發布'], ['blue-green deployment', '藍綠部署'], ['feature flag', '功能開關'], ['schema migration', '結構遷移']],
    quiz: [
      { q: "Why tag images with the commit ID and not &quot;latest&quot;?",
        a: ["It makes images smaller", "You know exactly which code is running and can roll back to an exact version", "The registry requires it", "It makes builds faster"], c: 1,
        why: "&quot;latest&quot; changes meaning over time. A commit ID never does." },
      { q: "What is a canary release?",
        a: ["Releasing on a quiet day", "Sending a small share of traffic to the new version first, and widening it if the numbers stay healthy", "Releasing to staff only, permanently", "Releasing without tests"], c: 1,
        why: "It limits the damage of a bad release to a few users and gives real data before going wide." },
      { q: "You need to rename a database column on a live system. What is the safe way?",
        a: ["Rename it and deploy the new code at the same moment", "Add the new column, write to both, copy the data, switch reads, then drop the old column", "Stop the site for the change", "Rename it and fix errors as they come"], c: 1,
        why: "Old and new code run together during a rollout. Each step must work with both." }
    ]
  },
  {
    id: 'k8s-prod', lv: 4, mins: 15,
    title: 'Kubernetes in production',
    zh: '進階：叢集網路怎麼通、權限怎麼管（RBAC）、多團隊怎麼隔離、怎麼升級、以及正式環境最常踩的坑。這是 CKA 與資深面試會問的層次。',
    body: `
<p>Running a few pods is easy. This lesson covers what separates someone who has used Kubernetes from someone trusted to run it, and it is the level the CKA exam and senior interviews work at.</p>
<h3>Networking</h3>
<ul>
<li>Every pod gets its own IP address, and every pod can reach every other pod directly. A plugin (the <b>CNI</b>: Calico, Cilium, Flannel) makes this true across machines.</li>
<li>A Service is a virtual address. kube-proxy, or eBPF programs in newer setups, rewrite packets so that traffic to it lands on a real pod.</li>
<li><b>CoreDNS</b> answers names such as <code>web.shop.svc.cluster.local</code>.</li>
<li><b>By default all pods may talk to all pods.</b> A <b>NetworkPolicy</b> is a firewall between pods. Production clusters begin with a deny-all policy and then open what is needed.</li>
</ul>
<h3>Who may do what: RBAC</h3>
<p>A <b>Role</b> lists allowed actions on kinds of objects (&ldquo;read pods in this namespace&rdquo;). A <b>RoleBinding</b> gives it to a user or to a <b>ServiceAccount</b>, which is the identity a pod runs as. Rules of practice: applications never get cluster-admin; each app has its own ServiceAccount with the least it needs; and few people can read Secrets.</p>
<h3>Pod security</h3>
<p>The <b>Pod Security Standards</b> define levels. The &ldquo;restricted&rdquo; level forbids running as root, privilege escalation, host mounts and privileged mode. Enforce it per namespace. This blocks most of the container escapes from lesson 2.1.</p>
<h3>Sharing a cluster</h3>
<p>Namespaces plus resource quotas plus network policies plus RBAC give soft separation between teams. Where a breach in one team must never reach another (payments, for example), use separate clusters or separate cloud accounts.</p>
<h3>Upgrades</h3>
<p>A new minor version arrives about three times a year, and each is supported for about a year. Upgrade one minor version at a time: control plane first, then nodes. Each node is <b>drained</b> (its pods moved off) before it is replaced. PodDisruptionBudgets keep enough copies of each app alive during the process. Check for removed APIs before every upgrade.</p>
<h3>Extending it</h3>
<ul>
<li>A <b>custom resource</b> adds a new kind of object. An <b>operator</b> is a controller that manages it, with operational knowledge written as code: cert-manager for certificates, database operators for clusters with failover.</li>
<li>A <b>service mesh</b> (Istio, Linkerd) places a proxy beside every pod. You get encryption between services, retries, traffic splitting and detailed metrics without changing application code. The price is complexity. Add one when you have a concrete need.</li>
</ul>
<h3>Failures you will meet</h3>
<table>
<tr><th>Symptom</th><th>Usual cause</th></tr>
<tr><td>CrashLoopBackOff</td><td>The app exits at start: bad config, missing secret, failed dependency. Read <code>kubectl logs --previous</code>.</td></tr>
<tr><td>Pending</td><td>No machine has room for its requests, or its volume cannot attach. Read <code>kubectl describe pod</code>.</td></tr>
<tr><td>ImagePullBackOff</td><td>Wrong image name or tag, missing registry credentials, or rate limits.</td></tr>
<tr><td>OOMKilled</td><td>Memory limit too low, or a leak.</td></tr>
<tr><td>Slow for no clear reason</td><td>CPU limits throttling the app, or slow DNS lookups inside the cluster.</td></tr>
<tr><td>Pods evicted</td><td>The machine ran short of memory or disk.</td></tr>
</table>
<p>The debugging routine never changes: <code>kubectl get</code>, then <code>describe</code> for events, then <code>logs</code>, then <code>exec</code> into the pod or attach a debug container.</p>`,
    own: `Do the free &ldquo;CKA&rdquo; scenarios on Killercoda until you can fix a broken cluster without notes. Then write one page: &ldquo;If my main service ran on Kubernetes, what would its Deployment, Service, probes, resource numbers and network policy be?&rdquo; This document is a portfolio piece, and it is also the answer to a common interview question.`,
    terms: [['RBAC', '角色型存取控制'], ['service account', '服務帳號'], ['network policy', '網路政策'], ['drain', '排空節點'], ['operator', 'Operator（維運控制器）'], ['service mesh', '服務網格'], ['multi-tenancy', '多租戶']],
    quiz: [
      { q: "In a new cluster with no NetworkPolicy, which pods can talk to which?",
        a: ["None", "Only pods in the same namespace", "Every pod can reach every other pod", "Only pods with the same label"], c: 2,
        why: "The default is open. Isolation has to be added, usually starting from a deny-all policy." },
      { q: "What does a service mesh mainly provide?",
        a: ["Cheaper machines", "Encryption between services, traffic control and metrics, without changing application code", "A replacement for the database", "Faster image builds"], c: 1,
        why: "Proxies beside each pod handle the network concerns. The cost is extra moving parts." },
      { q: "A pod is in CrashLoopBackOff. What is the most useful first command?",
        a: ["kubectl delete namespace", "kubectl logs with the --previous flag", "Restart the node", "Increase replicas"], c: 1,
        why: "The container that just died holds the reason. --previous shows its output." }
    ]
  }
  ]
});
