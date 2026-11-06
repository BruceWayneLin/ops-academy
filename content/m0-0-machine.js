M({
  id: 'fnd',
  lessons: [
  {
    id: 'mach-switch', lv: 1, mins: 10,
    title: 'Everything is a switch: why computers use 0 and 1',
    zh: '電腦從頭到尾只用一種零件：開關。關是 0、開是 1。開關夠多，就能表示任何數字；而文字、圖片、聲音、指令全部都是數字。',
    body: `
<p>A computer is built from one kind of part, repeated billions of times: a <b>switch</b>. A switch is either off or on. We write off as <b>0</b> and on as <b>1</b>. One switch holding one of those two values is called a <b>bit</b>.</p>
<p>Click the switch. That lamp is everything a computer knows how to do at the lowest level: let current through, or stop it.</p>
<div class="widget" data-w="circuit"></div>
<h3>Why only two states?</h3>
<p>Because two states are easy to tell apart. Imagine reading a signal lamp across a foggy field. &ldquo;Lit or dark&rdquo; you will get right every time. &ldquo;Which of ten brightness levels&rdquo; you will get wrong. Electricity inside a chip is noisy in the same way, so engineers chose the two states that cannot be confused.</p>
<h3>One switch is not much. Many are.</h3>
<table>
<tr><th>Switches</th><th>Different patterns</th><th>Enough for</th></tr>
<tr><td>1</td><td>2</td><td>Yes or no</td></tr>
<tr><td>2</td><td>4</td><td>Four directions</td></tr>
<tr><td>8</td><td>256</td><td>One letter, or one shade of grey</td></tr>
<tr><td>16</td><td>65,536</td><td>Any character in most languages</td></tr>
<tr><td>32</td><td>about 4 billion</td><td>One colour with transparency</td></tr>
<tr><td>64</td><td>about 18 billion billion</td><td>Any number you are likely to need</td></tr>
</table>
<p>Each extra switch doubles the count. That doubling is why a small number of switches goes a very long way.</p>
<h3>Counting with switches</h3>
<p>In everyday numbers each place is worth ten times the one to its right: ones, tens, hundreds. In <b>binary</b> each place is worth two times the one to its right: 1, 2, 4, 8, 16. To read a binary number, add up the places that are on. Try it: turn on 8, 4 and 1 below and you get 13.</p>
<div class="widget" data-w="bits"></div>
<h3>Everything is a number</h3>
<p>This is the idea that makes a calculator into a computer. Once a machine can store numbers, it can store anything, because we agree on what the numbers mean:</p>
<table>
<tr><th>Thing</th><th>Stored as</th></tr>
<tr><td>A letter</td><td>One number per character. A is 65.</td></tr>
<tr><td>A colour</td><td>Three numbers: how much red, green and blue</td></tr>
<tr><td>A photo</td><td>Millions of colours in a grid</td></tr>
<tr><td>Sound</td><td>The height of the sound wave, measured 44,100 times a second</td></tr>
<tr><td>A video</td><td>Many photos a second, plus sound</td></tr>
<tr><td>A program</td><td>A list of numbered instructions, each one a number</td></tr>
</table>
<p>So the question &ldquo;how can a machine do everything?&rdquo; becomes a smaller one: how can switches store numbers and change them? The next five lessons answer that, one layer at a time.</p>`,
    tryNote: 'Run on your Mac.',
    try: [
      ['python3 -c "print(bin(13), int(\'1101\', 2), ord(\'A\'), chr(65))"', '13 in binary, 1101 back to decimal, the number behind the letter A, and the letter behind 65.']
    ],
    own: `Write your age in binary by hand, then check it with the switches above. Then work out how many switches you need to count to one million. Keep doubling: 2, 4, 8, and so on, until you pass it.`,
    terms: [['bit', '位元'], ['binary', '二進位'], ['switch', '開關'], ['decimal', '十進位'], ['pattern', '組合']],
    quiz: [
      { q: "Why do computers use two states and not ten?",
        a: ["Two states are easy to tell apart reliably, even when the signal is noisy", "Ten states would use less electricity", "Binary numbers are shorter to write", "It was a historical accident with no reason"], c: 0,
        why: "On or off is hard to misread. Ten levels of the same signal blur into each other." },
      { q: "How many different patterns can 8 switches hold?",
        a: ["8", "16", "64", "256"], c: 3,
        why: "Each switch doubles the count: eight 2s multiplied together make 256." },
      { q: "What is the binary number 1101 in everyday numbers?",
        a: ["4", "11", "13", "1,101"], c: 2,
        why: "The places are worth 8, 4, 2 and 1. The ones that are on are 8, 4 and 1, which add up to 13." }
    ]
  },
  {
    id: 'mach-transistor', lv: 1, mins: 11,
    title: 'The transistor: a switch with no moving parts',
    zh: '電晶體就是「用電來開關的開關」：控制腳有電，電流就通。因為一顆的輸出可以去控制下一顆，開關才能自己推動開關——這是自動運算的起點。',
    body: `
<p>A light switch needs a finger. A computer cannot have a finger on each of its billions of switches, so it uses a switch that is flipped by electricity itself. That switch is the <b>transistor</b>.</p>
<p>A transistor has three connections: current comes <b>in</b>, current goes <b>out</b>, and a third one, the <b>control</b>, decides whether the path between them is open. Put a voltage on the control and current flows. Take it away and current stops. Think of a tap on a water pipe, where the handle is turned by water pressure from another pipe.</p>
<div class="fig" data-w="fig-transistor"></div>
<h3>Why this one part changes everything</h3>
<p>The output of one transistor can be wired to the control of another. So one switch can flip the next, which flips the next. Nobody has to touch anything. Wire them in the right patterns and the switches work out answers by themselves. Every later lesson in this part is about which patterns.</p>
<h3>Small, fast and many</h3>
<table>
<tr><th>Year</th><th>Machine</th><th>Switches</th></tr>
<tr><td>1945</td><td>ENIAC, a computer that filled a room</td><td>About 18,000 glass vacuum tubes</td></tr>
<tr><td>1947</td><td>The first transistor, at Bell Labs</td><td>1</td></tr>
<tr><td>1971</td><td>Intel 4004, the first processor on one chip</td><td>2,300 transistors</td></tr>
<tr><td>2020</td><td>Apple M1, the chip in your Mac</td><td>16 billion transistors</td></tr>
</table>
<p>Each transistor in a modern chip is a few tens of nanometres across, thousands of times thinner than a hair, and can switch billions of times a second.</p>
<h3>Going deeper: what it is made of</h3>
<p>Transistors are made of <b>silicon</b>, which is a <b>semiconductor</b>: a material that can be made to conduct or not conduct. Tiny amounts of other elements are added to create regions that carry current in different ways, and the control connection sits on top, separated by a layer of insulation only a few atoms thick. A voltage on the control pulls charge into the gap beneath it and completes the path.</p>
<h3>Going deeper: how chips are made, and why wafers are round</h3>
<div class="fig" data-w="fig-wafer"></div>
<p>Chip making starts with a single perfect crystal of silicon. A small seed crystal is dipped into molten silicon and pulled out slowly while it turns. The crystal grows as a cylinder, the way a candle grows when dipped. The cylinder is sliced into thin discs called <b>wafers</b>. That is why wafers are round.</p>
<p>Patterns are then printed onto the wafer with light, layer upon layer, building all the transistors and the wires between them at once. One wafer holds hundreds of identical rectangular chips. They are cut apart, tested, and each is sealed in a package with metal contacts. The chip is square. Only the wafer it was cut from is round.</p>
<h3>Going deeper: heat</h3>
<p>A transistor uses a little energy each time it switches. Billions of them switching billions of times a second add up to real heat, which is why chips need cooling and why phones get warm under load. Heat, more than anything else, limits how fast a chip can run (lesson 0.8).</p>`,
    tryNote: 'Run on your Mac.',
    try: [
      ['sysctl -n machdep.cpu.brand_string', 'The name of the chip in your computer.']
    ],
    own: `Look up the chip in your computer and the one in your phone. For each, find two numbers: how many transistors it has, and its process size in nanometres. Then work out how many ENIACs' worth of switches you carry in your pocket.`,
    terms: [['transistor', '電晶體'], ['semiconductor', '半導體'], ['silicon', '矽'], ['wafer', '晶圓'], ['chip', '晶片'], ['integrated circuit', '積體電路']],
    quiz: [
      { q: "What makes a transistor different from a light switch?",
        a: ["It is larger", "It is flipped by an electrical signal, so one switch can control another", "It can only be used once", "It needs no electricity"], c: 1,
        why: "Because electricity flips it, the output of one can drive the next, and circuits can run by themselves." },
      { q: "Why are silicon wafers round?",
        a: ["Round chips are faster", "The silicon crystal is grown as a cylinder by pulling and turning it, then sliced into discs", "Squares cannot be printed on", "To fit inside round computers"], c: 1,
        why: "The shape comes from how the crystal grows. The chips cut from the wafer are rectangular." },
      { q: "What does the control connection of a transistor do?",
        a: ["It stores a number", "It decides whether current can pass between the other two connections", "It cools the chip", "It measures the temperature"], c: 1,
        why: "A voltage on the control opens the path. No voltage closes it." }
    ]
  },
  {
    id: 'mach-gates', lv: 1, mins: 11,
    title: 'Logic gates: decisions made of switches',
    zh: '兩個開關串聯，兩個都開才通——這是 AND；並聯，任一個開就通——這是 OR；反過來就是 NOT。這幾種小電路叫邏輯閘，任何「是或否」的規則都能用它們拼出來。',
    body: `
<p>Wire two switches one after the other, and current reaches the lamp only if <b>both</b> are on. Wire them side by side, and current gets through if <b>either</b> is on. Those two wirings are the first two <b>logic gates</b>: small circuits that take 0s and 1s in and give a 0 or 1 out according to a fixed rule.</p>
<p>Choose a gate below and flip the inputs. Watch which row of the table lights up.</p>
<div class="widget" data-w="gates"></div>
<h3>The basic gates</h3>
<table>
<tr><th>Gate</th><th>Output is 1 when</th><th>In words</th></tr>
<tr><td><b>AND</b></td><td>Both inputs are 1</td><td>&ldquo;this and that&rdquo;</td></tr>
<tr><td><b>OR</b></td><td>At least one input is 1</td><td>&ldquo;this or that&rdquo;</td></tr>
<tr><td><b>NOT</b></td><td>The input is 0</td><td>&ldquo;the opposite&rdquo;</td></tr>
<tr><td><b>XOR</b></td><td>The inputs are different</td><td>&ldquo;one or the other, not both&rdquo;</td></tr>
<tr><td><b>NAND</b></td><td>Not both inputs are 1</td><td>AND followed by NOT</td></tr>
</table>
<p>Inside a chip each gate is a handful of transistors. A NOT gate takes two. A NAND gate takes four.</p>
<h3>Any rule you can state, you can build</h3>
<p>Take the rule &ldquo;open the door if the card is valid <b>and</b> the code is right, <b>or</b> if the master key is used&rdquo;. That is one AND gate feeding one OR gate. Every rule made of and, or and not can be built the same way, however long. This is what turns switches into something that can decide.</p>
<h3>Going deeper: one gate is enough</h3>
<p>Every other gate can be built from NAND gates alone. A NOT is a NAND with its two inputs joined. An AND is a NAND followed by that NOT. So in principle an entire computer can be made from one kind of gate repeated billions of times, which is very convenient for a factory.</p>
<h3>Going deeper: where the idea came from</h3>
<p>In 1854 George Boole showed that reasoning with true and false follows rules like arithmetic. In 1937 a student named Claude Shannon noticed that electrical switches obey exactly those rules. That observation is the bridge between logic and electronics, and all of computing stands on it.</p>
<h3>Going deeper: you already use these</h3>
<p>The <code>&amp;&amp;</code>, <code>||</code> and <code>!</code> in your code are AND, OR and NOT. The operators <code>&amp;</code>, <code>|</code> and <code>^</code> apply AND, OR and XOR to every bit of two numbers at once.</p>`,
    tryNote: 'Run on your Mac.',
    try: [
      ['node -e "console.log(1&1, 1&0, 1|0, 1^1, 1^0)"', 'AND, AND, OR, XOR, XOR on single bits. Compare with the table.'],
      ['node -e "console.log((6&3).toString(2), (6|3).toString(2), (6^3).toString(2))"', 'The same gates applied to every bit of 6 (110) and 3 (011) at once.']
    ],
    own: `Write one real rule from your own code as gates, on paper. For example: &ldquo;allow the action if the user is logged in and (is the owner or is an admin)&rdquo;. Draw it as boxes and count how many gates it needs.`,
    terms: [['logic gate', '邏輯閘'], ['input', '輸入'], ['output', '輸出'], ['truth table', '真值表'], ['in series', '串聯'], ['in parallel', '並聯']],
    quiz: [
      { q: "Two switches are wired one after the other, in series. When does the lamp light?",
        a: ["When either switch is on", "Only when both switches are on", "When both are off", "Always"], c: 1,
        why: "Current must pass through both. This wiring is an AND gate." },
      { q: "What does an XOR gate output when both inputs are 1?",
        a: ["0", "1", "2", "It depends on the wiring"], c: 0,
        why: "XOR gives 1 only when the inputs differ. This is exactly what addition needs, as the next lesson shows." },
      { q: "Why is the NAND gate special?",
        a: ["It is the fastest gate", "Every other gate can be built from NAND gates alone", "It uses no transistors", "It can store a number"], c: 1,
        why: "It is universal, so one repeated building block is enough for a whole computer." }
    ]
  },
  {
    id: 'mach-add', lv: 1, mins: 12,
    title: 'Arithmetic from gates: how switches add',
    zh: '兩個位元相加：「和」就是 XOR、「進位」就是 AND，兩個閘就能加一位。一位一位串起來就能加任何數字；減、乘、除、比大小都是加法的變形。所以開關真的會算數。',
    body: `
<p>Here is the moment switches start doing mathematics. Add two single bits and there are only four cases:</p>
<table>
<tr><th>A</th><th>B</th><th>A + B</th><th>Written as two bits</th></tr>
<tr><td>0</td><td>0</td><td>0</td><td>0 0</td></tr>
<tr><td>0</td><td>1</td><td>1</td><td>0 1</td></tr>
<tr><td>1</td><td>0</td><td>1</td><td>0 1</td></tr>
<tr><td>1</td><td>1</td><td>2</td><td>1 0</td></tr>
</table>
<p>Look at the right-hand digit: it is 1 only when A and B differ. That is an XOR gate. Look at the left-hand digit, the carry: it is 1 only when both are 1. That is an AND gate. So two gates add two bits. This small circuit is called a <b>half adder</b>.</p>
<div class="fig" data-w="fig-halfadder"></div>
<h3>From one bit to any number</h3>
<p>To add longer numbers, do what you do on paper: add one column, pass the carry to the next column. Each column needs a slightly larger circuit that also takes the carry coming in (a <b>full adder</b>, five gates). Chain four of them and you can add 4-bit numbers. Chain 64 and you have the adder inside your computer.</p>
<p>Set two numbers below and watch the carries travel from right to left.</p>
<div class="widget" data-w="adder"></div>
<h3>Everything else is addition in disguise</h3>
<table>
<tr><th>Operation</th><th>How the chip does it</th></tr>
<tr><td>Subtract</td><td>Add the negative. To make a number negative, flip every bit and add 1.</td></tr>
<tr><td>Multiply</td><td>Shift and add, the way long multiplication works on paper</td></tr>
<tr><td>Divide</td><td>Shift and subtract, repeatedly</td></tr>
<tr><td>Compare</td><td>Subtract, then look at whether the result is zero or negative</td></tr>
</table>
<p>The part of a processor that holds these circuits is the <b>ALU</b>, the arithmetic and logic unit.</p>
<h3>From 0 to everything</h3>
<p>This is the answer to how a machine that only knows 0 and 1 can do so much. Whatever you see a computer do, underneath it is doing three things, very fast:</p>
<ul>
<li><b>Move</b> a number from one place to another.</li>
<li><b>Combine</b> two numbers: add them, compare them.</li>
<li><b>Choose</b> what to do next, based on a result.</li>
</ul>
<p>Searching text is comparing numbers. Drawing a picture is arithmetic on the numbers for each dot. Playing a video is moving numbers to the screen thirty times a second. An AI model is an enormous amount of multiplying and adding.</p>
<h3>Going deeper</h3>
<ul>
<li><b>Overflow.</b> An 8-bit adder holds 0 to 255. Add 1 to 255 and the carry falls off the end, leaving 0.</li>
<li><b>Speed.</b> Waiting for a carry to ripple through 64 columns is slow, so real adders use extra gates to work out the carries ahead of time.</li>
<li><b>Decimals.</b> Numbers with a fractional part are stored as a pattern of digits and a position for the point, with dedicated circuits for their arithmetic.</li>
</ul>`,
    tryNote: 'Run on your Mac.',
    try: [
      ['python3 -c "a,b=0b0110,0b0011; print(bin(a^b), bin((a&b)<<1), bin(a+b))"', 'For 6 + 3: the sum bits without carries (XOR), the carries (AND, moved one place left), and the full answer.'],
      ['python3 -c "print((255 + 1) & 0xFF)"', 'What an 8-bit adder gives for 255 + 1: the carry falls off and 0 is left.']
    ],
    own: `Add 5 and 6 in binary on paper, column by column, writing each carry above the next column. Then set the same numbers in the adder above and check every carry against yours.`,
    terms: [['adder', '加法器'], ['carry', '進位'], ['half adder', '半加器'], ['full adder', '全加器'], ['ALU', '算術邏輯單元'], ['overflow', '溢位']],
    quiz: [
      { q: "In a half adder, which gate produces the carry?",
        a: ["OR", "XOR", "AND", "NOT"], c: 2,
        why: "A carry happens only when both bits are 1, which is exactly what AND detects." },
      { q: "How does a chip subtract?",
        a: ["With a separate subtracting machine", "It makes the second number negative and adds", "It cannot subtract", "By counting backwards one at a time"], c: 1,
        why: "Flipping every bit and adding 1 gives the negative. The same adder then does the work." },
      { q: "At the lowest level, what three things does a computer do?",
        a: ["Read, write and print", "Move numbers, combine numbers, and choose the next step", "Draw, play sound and connect", "Start, run and stop"], c: 1,
        why: "Everything else is a very long sequence of those three." }
    ]
  },
  {
    id: 'mach-memory', lv: 1, mins: 13,
    title: 'Memory and the clock: how a circuit remembers',
    zh: '把閘的輸出接回自己的輸入，形成一個迴圈，它就會「撐住」上一次的值——這就是記憶一個位元的方法。一排這種電路是暫存器，幾十億個加上編號就是記憶體。時脈則是讓所有零件同步的節拍。',
    body: `
<p>The gates so far have no memory. Change the inputs and the output changes at once. Nothing is kept. So how can a circuit made of the same gates remember anything?</p>
<h3>The trick: a loop</h3>
<p>Take the output of a gate and wire it back to its own input, through a second gate. Now the circuit feeds itself. Whatever value is in the loop keeps the loop in that state. It holds.</p>
<p>Press Set below, then let go. The input is gone, and the output stays at 1. The loop is holding it. That is one bit of memory.</p>
<div class="widget" data-w="latch"></div>
<p>Nothing mysterious is stored. A remembered 1 is simply current that keeps going round a loop of two gates, each one keeping the other on. Press Reset and the loop settles the other way and holds 0 just as firmly. Engineers call this circuit a <b>latch</b>, and a slightly more careful version a <b>flip-flop</b>.</p>
<h3>From one bit to a memory</h3>
<ul>
<li>Put 64 of these side by side and you have a <b>register</b>: a place that holds one 64-bit number. A processor has a few dozen. They are the fastest memory there is.</li>
<li>Put billions in a grid, give every group of eight a number (its <b>address</b>), and you have <b>memory</b> (RAM). It works like a wall of numbered mailboxes: say the number, and you can read what is inside or put something new in.</li>
</ul>
<div class="widget" data-w="ram"></div>
<p>Main memory uses an even smaller cell than a loop of gates: a tiny bucket of electric charge, full for 1 and empty for 0. The buckets leak, so the chip tops them up many times a second. Cut the power and every bucket drains, which is why RAM forgets when the computer is switched off. An SSD traps the charge so that it stays without power, at the cost of being much slower.</p>
<h3>The clock: one beat for everything</h3>
<p>Signals take a little time to pass through gates. If each part of the chip acted whenever it liked, parts would read values that were still changing. So the chip has a <b>clock</b>: a signal that flips between 0 and 1 at a perfectly steady rate. Every register takes in its new value on the same beat, like rowers pulling on the drum.</p>
<div class="fig" data-w="fig-clock"></div>
<p>A 3 GHz processor ticks three billion times a second. Between two ticks, signals race through the gates. The tick must not come before the slowest path has finished, and that sets the top speed of the chip.</p>
<h3>Going deeper: fast and small, or large and slow</h3>
<table>
<tr><th>Kind</th><th>Size</th><th>Time to read</th><th>Keeps data without power?</th></tr>
<tr><td>Registers</td><td>A few hundred bytes</td><td>Less than 1 nanosecond</td><td>No</td></tr>
<tr><td>Cache, inside the processor</td><td>Megabytes</td><td>1 to 20 nanoseconds</td><td>No</td></tr>
<tr><td>Memory (RAM)</td><td>Gigabytes</td><td>About 100 nanoseconds</td><td>No</td></tr>
<tr><td>SSD</td><td>Hundreds of gigabytes</td><td>About 100 microseconds</td><td>Yes</td></tr>
</table>
<p>Fast memory is expensive and takes space, so a computer has a little of the fast kind and a lot of the slow kind, and keeps what it is using right now in the fast part.</p>
<h3>Going deeper: why &ldquo;turn it off and on again&rdquo; works</h3>
<p>Every loop in the machine holds whatever it was last set to, including values left behind by a bug. Cutting the power empties all of them, and the machine starts again from a known state.</p>`,
    tryNote: 'Run on your Mac.',
    try: [
      ['sysctl -n hw.memsize', 'The size of your memory in bytes. Every one of those bytes has its own address.'],
      ['sysctl -n hw.l1dcachesize hw.l2cachesize', 'The sizes in bytes of two levels of cache inside your processor.']
    ],
    own: `Explain to someone, or write in five sentences, how a loop of two gates can hold a bit after the input is gone. If you can say it without looking, you understand what memory is at the bottom. Then say why the same computer forgets everything when the power is cut.`,
    terms: [['memory', '記憶體'], ['latch', '栓鎖器'], ['flip-flop', '正反器'], ['register', '暫存器'], ['address', '位址'], ['clock', '時脈'], ['feedback loop', '回授迴圈']],
    quiz: [
      { q: "How does a circuit made of gates remember a bit?",
        a: ["It writes the bit on a tiny disk", "The output is wired back to the input, forming a loop that holds its own state", "It uses a very slow gate", "It stores the bit in the clock"], c: 1,
        why: "The loop keeps itself in whichever state it was last pushed into, even after the input goes away." },
      { q: "Why does RAM lose its contents when the power is cut?",
        a: ["The addresses are erased first", "Each bit is held by current or charge that needs power to stay", "It is deleted on purpose for safety", "The clock runs backwards"], c: 1,
        why: "A loop needs current to keep going round, and a charge cell leaks. Without power both drain." },
      { q: "What is the clock for?",
        a: ["To show the time of day", "To make every register take its new value on the same beat, after signals have settled", "To cool the chip", "To count how many programs are running"], c: 1,
        why: "Without a shared beat, parts would read values that were still changing." }
    ]
  },
  {
    id: 'mach-cycle', lv: 1, mins: 14,
    title: 'The CPU cycle: fetch, decode, execute, repeat',
    zh: 'CPU 一輩子只做一件事，而且不停地繞圈：取出下一道指令、看懂它、執行它，再取下一道。這個圈每秒繞幾十億次。會「有條件地跳到別的指令」就能做判斷和迴圈，這就夠寫出任何程式。',
    body: `
<p>You now have all the parts: an adder that calculates, registers that remember, memory with numbered boxes, and a clock that keeps time. A <b>CPU</b> (central processing unit, the processor) is those parts wired together with one more: a <b>control unit</b> that makes them take turns.</p>
<h3>The whole life of a CPU</h3>
<p>A program is a list of very simple instructions stored in memory, one per box. The CPU keeps one special register, the <b>program counter</b>, which holds the address of the next instruction. Then it does the same three steps, for ever:</p>
<ol>
<li><b>Fetch.</b> Read the instruction from the address in the program counter.</li>
<li><b>Decode.</b> Work out what that instruction asks for.</li>
<li><b>Execute.</b> Do it, and move the program counter to the next instruction.</li>
</ol>
<p>Then back to step 1. Drawn on paper, the three steps form a ring, which is why pictures of how a CPU works look like a circle. It is called the <b>instruction cycle</b>, and it never stops while the power is on.</p>
<h3>Watch one run</h3>
<p>This is a complete, tiny CPU. Its program adds 5 + 4 + 3 + 2 + 1. Press Step and follow one instruction at a time around the ring. Watch the program counter, the box being read, and the running total.</p>
<div class="widget" data-w="cpu"></div>
<h3>Only four kinds of instruction</h3>
<table>
<tr><th>Kind</th><th>Does</th><th>In the example</th></tr>
<tr><td>Move</td><td>Copy a number between memory and a register</td><td>LOAD, STORE</td></tr>
<tr><td>Calculate</td><td>Add, subtract, compare, AND, OR</td><td>ADD, SUB</td></tr>
<tr><td>Jump</td><td>Change which instruction comes next</td><td>JUMP</td></tr>
<tr><td>Jump if</td><td>Jump only if the last result was zero (or negative, and so on)</td><td>JUMPZ</td></tr>
</table>
<p>The last kind is the important one. &ldquo;Jump if&rdquo; lets a program make a decision and lets it repeat a section until something is true. Every <code>if</code> and every loop you have ever written becomes a &ldquo;jump if&rdquo;.</p>
<h3>Why such simple steps are enough</h3>
<p>Each step is trivial. The power comes from speed and repetition. A modern processor completes several instructions on every tick of a clock that ticks billions of times a second. In the time it takes you to blink, one core runs about a billion instructions.</p>
<h3>Going deeper: how real processors go faster</h3>
<ul>
<li><b>Pipelining.</b> Like an assembly line: while one instruction is being executed, the next is already being decoded and the one after is being fetched.</li>
<li><b>Guessing.</b> At a &ldquo;jump if&rdquo; the processor guesses which way it will go and starts work on that path. A right guess saves time. A wrong guess means throwing that work away.</li>
<li><b>Several cores.</b> A core is one complete cycle like the one above. A chip with eight cores runs eight of them side by side.</li>
</ul>
<h3>Going deeper: interruptions</h3>
<p>A key press, a network packet or a timer can send a signal called an <b>interrupt</b>. The CPU finishes the current instruction, saves its place, runs a short piece of the operating system to deal with the event, and then returns to where it was. That is how one processor appears to do many things at once, and it is the basis of what an operating system does (lesson 0.9).</p>`,
    tryNote: 'Run on your Mac.',
    try: [
      ['python3 -c "import time; t=time.time(); s=sum(range(100000000)); print(s, round(time.time()-t, 2), \'seconds\')"', 'Python adds up one hundred million numbers. Each addition is many trips round the cycle, and it still finishes in about a second.']
    ],
    own: `Run the tiny CPU to the end and write down how many steps it took. Then predict, before trying, how the total and the step count would change if the starting number were 10 and not 5. The pattern you find is why programmers care about how the amount of work grows with the size of the input.`,
    terms: [['CPU', '中央處理器'], ['instruction', '指令'], ['program counter', '程式計數器'], ['fetch', '擷取'], ['decode', '解碼'], ['execute', '執行'], ['instruction cycle', '指令週期'], ['interrupt', '中斷']],
    quiz: [
      { q: "What are the three steps a CPU repeats?",
        a: ["Start, run, stop", "Fetch, decode, execute", "Read, print, save", "Load, sort, send"], c: 1,
        why: "Get the next instruction, work out what it means, do it. Then again." },
      { q: "What does the program counter hold?",
        a: ["The number of programs running", "The address of the next instruction", "The current time", "The result of the last addition"], c: 1,
        why: "It is the CPU's bookmark. A jump instruction works by changing it." },
      { q: "Which kind of instruction makes decisions and loops possible?",
        a: ["Move", "Add", "Jump only if a condition is true", "Halt"], c: 2,
        why: "Without it a program could only run straight through once. With it, a program can choose and repeat." }
    ]
  },
  {
    id: 'mach-code', lv: 1, mins: 12,
    title: 'From machine code to the code you write',
    zh: '指令本身也是數字，跟資料放在同一塊記憶體裡——換一串數字，同一台機器就做別的事。我們寫的高階語言會被翻譯成這些數字。只要有記憶體、簡單運算和條件跳躍，就能算出任何「寫得成步驟」的東西。',
    body: `
<p>In the tiny CPU of the last lesson, look at how the program was stored: as numbers in memory boxes, next to the data. An instruction is a number too. Part of the number says what to do (add, load, jump) and the rest says to which box.</p>
<h3>The stored program</h3>
<p>This is one of the great ideas of the last century. Because instructions are numbers in memory, changing the program needs no rewiring. Put a different list of numbers in memory and the same machine becomes a calculator, a camera, a game or a web server. The machine is general. The list of numbers makes it specific.</p>
<h3>Three ways to write the same thing</h3>
<table>
<tr><th>Level</th><th>Looks like</th><th>Who reads it</th></tr>
<tr><td>Machine code</td><td><code>30 45 62</code></td><td>The CPU</td></tr>
<tr><td>Assembly</td><td><code>LOAD total</code>, <code>ADD n</code>, <code>STORE total</code></td><td>People, with effort. One line per instruction.</td></tr>
<tr><td>High-level language</td><td><code>total = total + n</code></td><td>People. One line becomes many instructions.</td></tr>
</table>
<p>Nobody writes long lists of numbers by hand. You write in a high-level language, and another program translates it:</p>
<ul>
<li>A <b>compiler</b> translates the whole program ahead of time into machine code (C, Go, Rust).</li>
<li>An <b>interpreter</b> reads your code and carries it out step by step as it goes (Python).</li>
<li>A <b>just-in-time compiler</b> does both: it starts by interpreting and compiles the busy parts while running (JavaScript in a browser).</li>
</ul>
<h3>The tower</h3>
<p>Each layer is built only from the one below it, and hides it. This is how something as simple as a switch ends up running an app.</p>
<div class="fig" data-w="fig-tower"></div>
<h3>Different processors speak different machine code</h3>
<p>The set of instructions a processor understands is its <b>instruction set</b>. Intel and AMD chips use one called x86-64. Phones and Apple's M-series chips use another called ARM64. A program compiled for one will not run on the other without translation. This is why software downloads sometimes ask &ldquo;Intel or Apple silicon?&rdquo;, and why container images come in <code>amd64</code> and <code>arm64</code> versions, which you will meet in module 2.</p>
<h3>Can it really compute everything?</h3>
<p>In 1936 Alan Turing described a machine with memory, a few simple operations and a conditional jump, and argued that it can carry out any procedure that can be written down as exact steps, given enough time and memory. Nobody has found a counter-example since. Your phone, a supercomputer and the tiny CPU from the last lesson are equal in this sense. They differ only in speed and size.</p>
<p>The limits are real, though. Some problems have no step-by-step procedure at all. Others have one that would take longer than the age of the universe. So &ldquo;from 0 to everything&rdquo; means: everything that can be turned into steps, and that finishes in a reasonable time.</p>
<h3>Going deeper: who thought of it</h3>
<p>The stored-program design was written down in 1945 in a report by John von Neumann, drawing on work by several teams. Nearly every computer since has followed it, which is why processors of any brand have the same basic parts you saw in the last lesson.</p>`,
    tryNote: 'Run on your Mac. The first command needs the Xcode command line tools.',
    try: [
      ["echo 'int add(int a, int b) { return a + b; }' | cc -x c -O1 -S -o - - | grep -A3 '_add:'", 'A one-line C function, translated to assembly for your processor. Look for the single add instruction.'],
      ['uname -m', 'The instruction set of your machine: arm64 on Apple silicon, x86_64 on Intel.'],
      ['file /bin/ls', 'One file holding two translations of the same program, one for each instruction set.']
    ],
    own: `Take one line of your own code, such as a loop that sums a list, and write by hand the instructions the tiny CPU would need for it, using only LOAD, ADD, SUB, STORE, JUMP and JUMPZ. It will take about ten lines. That exercise is what a compiler does for you millions of times.`,
    terms: [['machine code', '機器碼'], ['assembly', '組合語言'], ['compiler', '編譯器'], ['interpreter', '直譯器'], ['instruction set', '指令集'], ['stored program', '內儲程式'], ['high-level language', '高階語言']],
    quiz: [
      { q: "What does &quot;stored program&quot; mean?",
        a: ["Programs are kept on paper", "Instructions are numbers held in the same memory as data, so changing the program needs no rewiring", "Each program has its own computer", "Programs cannot be changed after they are written"], c: 1,
        why: "Load different numbers and the same machine does a different job." },
      { q: "Why can a program built for an Intel chip not run directly on an Apple M1?",
        a: ["The M1 is too fast", "The two chips understand different sets of instructions", "Apple blocks all other software", "Intel programs are too large"], c: 1,
        why: "x86-64 and ARM64 are different machine codes. The program must be translated or built again." },
      { q: "What does a compiler do?",
        a: ["It makes the processor faster", "It translates code written by people into the processor's instructions", "It stores files", "It connects to the network"], c: 1,
        why: "It turns a high-level language into machine code ahead of time." }
    ]
  },
  {
    id: 'mach-fast', lv: 1, mins: 11,
    title: 'Why it is fast, and what limits it',
    zh: '變快有三條路：時脈更快、每一拍做更多事、核心更多。時脈在 2005 年左右被「熱」擋住，之後主要靠多核心。記憶體比 CPU 慢很多，所以 CPU 內建快取。32 位元最多只能定址 4 GB。',
    body: `
<p>A processor gets more work done in three ways: a faster clock, more work per tick, and more cores. Each has run into a wall, and the walls explain most of what you read on a specification sheet.</p>
<h3>1. A faster clock, until heat stopped it</h3>
<p>For decades clocks got faster every year. Around 2005 they stopped, at 3 to 4 GHz. The reason is heat. The energy used rises steeply with clock speed, and chips had reached the point where they could not be cooled. Clock speeds have risen only a little since then.</p>
<h3>2. More work per tick</h3>
<p>Designers made each tick count for more: longer pipelines, better guessing at jumps, several instructions started at once. This is why a 3 GHz chip of today is many times faster than a 3 GHz chip of 2005.</p>
<h3>3. More cores</h3>
<p>When one cycle could not go faster, chips were given several. Your M1 has eight: four fast ones and four that are slower and use far less power. But eight cores only help if the work can be split into parts that run at the same time. A program written as one sequence of steps uses one core, however many are there.</p>
<h3>Memory is the slow part</h3>
<p>The processor can do hundreds of instructions in the time it takes to fetch one value from main memory. So it keeps copies of recently used values in a small, very fast memory of its own, called the <b>cache</b>. Finding the value there is a <b>hit</b>. Having to go to main memory is a <b>miss</b>, and costs about a hundred times more. Programs that work through data in order, and keep related data close together, run much faster for this reason alone.</p>
<h3>What &ldquo;64-bit&rdquo; means</h3>
<p>It is the width of the processor's registers, and so the largest number it handles in one step. That includes addresses. A 32-bit address can name about 4 billion bytes, so a 32-bit program can use at most 4 GB of memory. A 64-bit address has no practical limit. Code that runs in a browser as WebAssembly usually uses 32-bit addresses, which is the reason for the 4 GB ceiling that large browser games run into.</p>
<h3>Going deeper: the other kind of processor</h3>
<p>A <b>GPU</b> (graphics processing unit) takes the opposite approach to a CPU. In place of a few clever cores it has thousands of simple ones that all do the same operation on different data at once. That suits pictures, where every dot needs the same arithmetic, and it suits AI, which is the same multiplication repeated billions of times.</p>
<h3>Going deeper: the hard limits</h3>
<ul>
<li><b>Heat</b>, as above.</li>
<li><b>The speed of light.</b> In one tick of a 3 GHz clock, a signal can travel about 10 centimetres at most. Chips are small partly so that signals can cross them in time.</li>
<li><b>The size of atoms.</b> The smallest parts of a transistor are now a few dozen atoms across. There is not much room left to shrink.</li>
</ul>
<h3>Reading a specification</h3>
<table>
<tr><th>It says</th><th>It means</th></tr>
<tr><td>8-core</td><td>Eight instruction cycles running side by side</td></tr>
<tr><td>3.2 GHz</td><td>3.2 billion ticks a second for each core</td></tr>
<tr><td>5 nm</td><td>The generation of manufacturing. Smaller means more transistors in the same area and less energy per switch.</td></tr>
<tr><td>16 GB</td><td>About sixteen billion numbered bytes of main memory</td></tr>
<tr><td>64-bit</td><td>Registers and addresses are 64 switches wide</td></tr>
</table>
<p>You now know what a computer is, from the switch upward. The next lesson looks at the same machine from above: what happens when it runs your code.</p>`,
    tryNote: 'Run on your Mac.',
    try: [
      ['sysctl -n hw.ncpu', 'How many cores your machine has.'],
      ['sysctl -n hw.perflevel0.physicalcpu hw.perflevel1.physicalcpu', 'On Apple silicon: the number of fast cores, then the number of efficient ones.']
    ],
    own: `Find the specification line for a server you use or could rent, for example &ldquo;2 vCPU, 4 GB&rdquo;. Using this lesson, say in plain words what each number means for a program running on it: how many things it can do at once, and how much it can hold in memory before it must use the disk.`,
    terms: [['clock speed', '時脈頻率'], ['core', '核心'], ['cache', '快取'], ['cache miss', '快取未命中'], ['GPU', '圖形處理器'], ['64-bit', '64 位元']],
    quiz: [
      { q: "Why did processor clock speeds stop rising around 2005?",
        a: ["Nobody needed faster computers", "Heat: energy use rises steeply with clock speed and chips could no longer be cooled", "Clocks became too expensive", "The law forbade it"], c: 1,
        why: "After that, speed came from doing more per tick and from adding cores." },
      { q: "A program is written as a single sequence of steps and runs on an 8-core chip. How many cores does it use?",
        a: ["All eight", "Four", "One", "None"], c: 2,
        why: "Extra cores help only when the work is split into parts that can run at the same time." },
      { q: "Why can a 32-bit program use at most about 4 GB of memory?",
        a: ["Memory chips were small then", "A 32-bit address can only name about 4 billion different bytes", "It is a licence restriction", "The clock is too slow"], c: 1,
        why: "An address is a number, and 32 switches give about 4 billion patterns." }
    ]
  }
  ]
});
