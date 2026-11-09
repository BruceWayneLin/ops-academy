M({
  id: 'ts1', n: 1, track: 'ts',
  title: 'Values and types',
  zh: 'TypeScript 的第一步：值、變數和型別，陣列與物件，聯集，函式，還有最常讓程式當掉的 null 和 undefined。',
  time: '1 to 2 weeks',
  blurb: 'What TypeScript adds to JavaScript, and the types you use every day: single values, collections, unions, functions, and the missing values behind most crashes. Everything later in the track builds on this.',
  lessons: [
  {
    id: 'ts-values', lv: 1, mins: 14,
    title: 'Variables, values and types: what TypeScript adds',
    zh: 'TypeScript 就是 JavaScript 加上型別標籤：寫的時候檢查，檢查完就擦掉，瀏覽器跑的還是 JavaScript。變數是一個貼了標籤的盒子，標籤寫著裡面能放哪一種值。',
    body: `
<p>A program spends its whole life storing values and passing them around: a score, a player's name, whether the game is over. JavaScript lets you put any value anywhere. That freedom is pleasant for ten lines and painful for ten thousand, because a mistake such as putting a word where a number belongs only shows up when the code runs, often in front of a user.</p>
<p><b>TypeScript</b> is JavaScript with one addition: you can label each value with its <b>type</b>, meaning what kind of value it is. A program called the <b>type checker</b> reads your labels before anything runs and tells you where they do not fit. Then the labels are removed, and what is left is ordinary JavaScript.</p>
<div class="flow"><span class="box">game.ts<small>JavaScript plus type labels</small></span><span class="arr">&rarr;</span><span class="box hot">Type checker<small>tsc, or your editor</small></span><span class="arr">&rarr;</span><span class="box">game.js<small>labels erased</small></span><span class="arr">&rarr;</span><span class="box">Browser<small>runs JavaScript only</small></span></div>
<p>Keep this picture in mind for the whole track. The browser never sees a type. Types exist only while you write and build. They are like the spell checker in a word processor: very useful while you type, and gone from the printed page.</p>
<h3>A variable is a labelled box</h3>
<p>A <b>variable</b> is a named box that holds a <b>value</b>. In TypeScript the box also carries a label saying what may go inside.</p>
<pre><code>let score: number = 0;       // a box named score, for numbers
let player: string = 'Ada';  // a box for text
let gameOver: boolean = false;

score = 1;        // fine: a number
score = 'one';    // error: a string does not fit</code></pre>
<p>The part after the colon, <code>: number</code>, is a <b>type annotation</b>. It is the label on the box. Delete every annotation and the file is valid JavaScript again, which is exactly what the checker's output is.</p>
<h3>The three basic types</h3>
<table>
<tr><th>Type</th><th>Holds</th><th>Examples</th></tr>
<tr><td><code>string</code></td><td>Text</td><td><code>'Ada'</code>, <code>'7 of hearts'</code></td></tr>
<tr><td><code>number</code></td><td>Any everyday number: whole, decimal or negative</td><td><code>0</code>, <code>7</code>, <code>-2.5</code></td></tr>
<tr><td><code>boolean</code></td><td>Yes or no</td><td><code>true</code>, <code>false</code></td></tr>
</table>
<p>There is one type for everyday numbers. Whole numbers and decimals are both <code>number</code>, so <code>7</code> and <code>7.5</code> go in the same kind of box.</p>
<h3>const or let</h3>
<p>You create a box with <code>const</code> or <code>let</code>.</p>
<ul>
<li><code>const</code>: the box is sealed after the first value goes in. You cannot put a different value in it later.</li>
<li><code>let</code>: the box can be emptied and refilled, with another value of the same type.</li>
</ul>
<pre><code>const maxRounds = 10;
let round = 1;
round = round + 1;   // fine
maxRounds = 11;      // error: cannot assign to a constant</code></pre>
<p>Use <code>const</code> by default, and <code>let</code> only when the value really changes. You will also see <code>var</code> in old code. It is the older form, with confusing rules. Do not use it in new code.</p>
<h3>Type inference: the checker reads the first value</h3>
<p>You do not have to label every box. If you put a value in when you create the variable, the checker works out the type from it. This is <b>type inference</b>.</p>
<pre><code>let score = 0;        // inferred: number
let player = 'Ada';   // inferred: string
const best = 10;      // inferred: 10, this exact number
score = 'ten';        // still an error: score holds numbers</code></pre>
<p>Look at <code>best</code>. A <code>const</code> can never change, so the checker gives it the narrowest possible type: the value <code>10</code> itself, not just any number. This detail becomes useful in the lesson on union types.</p>
<p>So when should you write an annotation yourself?</p>
<ul>
<li><b>Leave it out</b> when the variable starts with a value. The inferred type is the same, and the code is shorter.</li>
<li><b>Write it</b> when the variable starts empty (<code>let nextCard: number;</code>), on function parameters (covered in the lesson on functions), and when you want the label to state your intent.</li>
</ul>
<h3>When and how the checker tells you</h3>
<p>The checker runs in two places.</p>
<div class="flow"><span class="box">You type<small>in VS Code</small></span><span class="arr">&rarr;</span><span class="box hot">Red underline<small>within a second</small></span><span class="arr">&rarr;</span><span class="box">You build<small>tsc or vue-tsc</small></span><span class="arr">&rarr;</span><span class="box bad">List of errors<small>the build can stop here</small></span></div>
<p>In the editor, the same checker runs in the background while you type and underlines each mistake. Hover over the underline to read the message. When you build, <code>tsc</code> (or <code>vue-tsc</code> in a Vue project) prints every error with its file, line, column and an error number:</p>
<pre><code>game.ts:6:1 - error TS2322: Type 'string' is not assignable to type 'number'.</code></pre>
<p>Read it as: in game.ts, at line 6, column 1, you tried to put a string into a box labelled number. &ldquo;Is not assignable to&rdquo; is the phrase you will see most often. It always means &ldquo;this value does not fit that label&rdquo;.</p>
<div class="warn">Two facts surprise almost everyone. First, by default <code>tsc</code> still writes the .js file even when there are errors. Second, the Vite dev server removes types without checking them at all, so a page can run with type errors in it. The red underline and the type check in the build are what protect you. Do not ignore them.</div>
<h3>Strict mode</h3>
<p>The checker has a main switch called <code>strict</code>, set in the project file <code>tsconfig.json</code>. Most new projects turn it on. Two of the checks it switches on matter from the first day:</p>
<table>
<tr><th>Check</th><th>Without strict</th><th>With strict</th></tr>
<tr><td><code>noImplicitAny</code></td><td>A parameter with no type silently becomes <code>any</code>, which means &ldquo;anything, do not check&rdquo;</td><td>Error: you must say what the parameter is</td></tr>
<tr><td><code>strictNullChecks</code></td><td><code>null</code> and <code>&#117;ndefined</code> fit in every box</td><td>A box accepts them only if its label says so</td></tr>
</table>
<p>Without strict, TypeScript checks far less than you would expect. If you join a project and type errors seem strangely rare, open <code>tsconfig.json</code> and look for <code>"strict": true</code>.</p>
<h3>Going deeper: types are promises, not run-time checks</h3>
<p>Because the labels are erased, nothing checks them while the program runs. If a server sends <code>{"score": "12"}</code> and your code says the score is a number, TypeScript will not notice. It believed your label. A type describes what you promise the data looks like. Where data comes in from outside (a server, local storage, user input), check it with ordinary code before you trust it.</p>
<p>The same goes for <code>any</code>. A value of type <code>any</code> switches the checker off for that value, and the hole spreads: whatever you read from it is <code>any</code> too. When you truly do not know a type, the safer label is <code>unknown</code>, which forces you to check the value before you use it.</p>
<h3>Vue comparison</h3>
<p>In a .vue file, <code>&lt;script setup lang="ts"&gt;</code> tells Vue's compiler that the block is TypeScript. Without <code>lang="ts"</code>, the first annotation is a syntax error. Inference works the same way inside it:</p>
<pre><code>&lt;script setup lang="ts"&gt;
import { ref } from 'vue';
const score = ref(0);   // a Ref holding a number
score.value = 'ten';    // error, as before
&lt;/script&gt;</code></pre>
<p>The editor extension (Vue - Official) and <code>vue-tsc</code> run the same TypeScript checker over your .vue files. Everything in this track applies inside <code>&lt;script setup lang="ts"&gt;</code>.</p>`,
    tryNote: 'Paste each snippet into the TypeScript Playground (https://www.typescriptlang.org/play). Errors appear as red underlines. Hover over a name to see its type. The .JS tab on the right shows the JavaScript that comes out.',
    try: [
      ['let score = 0;\nscore = "ten";', 'score is underlined: a string is not assignable to type number. Inference gave the box its label from the first value.'],
      ['const best = 10;\nlet current = 10;', 'Hover over each name. best has the type 10, current has the type number.'],
      ['let player: string = "Ada";\nlet round: number = 1;', 'Open the .JS tab: the same two lines with every annotation removed.'],
      ['function double(n) {\n  return n * 2;\n}', 'With strict on (the Playground default), n is underlined because it implicitly has the type any. Change it to n: number and the error goes away.']
    ],
    own: `Open a TypeScript file from a project of yours, or a .vue file with <code>&lt;script setup lang="ts"&gt;</code>. Hover over five variables and write down the type the editor shows for each one. For each, decide whether its annotation could be left out because inference already gives the same type. Then open <code>tsconfig.json</code> and find out whether <code>strict</code> is on. It may be set in another file that the <code>extends</code> line points to.`,
    terms: [['type', '型別'], ['value', '值'], ['variable', '變數'], ['type annotation', '型別註記'], ['type inference', '型別推論'], ['type checker', '型別檢查器'], ['strict mode', '嚴格模式']],
    quiz: [
      { q: "What does the browser receive when you build a TypeScript project?",
        a: ["The .ts file, and the browser checks the types", "Plain JavaScript with the type labels removed", "A binary file made by the type checker", "JavaScript plus a file of types that it checks while running"], c: 1,
        why: "Types are checked before the code runs and then erased. The browser only ever runs JavaScript." },
      { q: "What type does TypeScript infer for <code>let round = 1</code>?",
        a: ["any", "1", "No type, because there is no annotation", "number"], c: 3,
        why: "A let may change later, so the checker widens it to number. A const with the same value would get the type 1." },
      { q: "Your code has a type error, and you open the page with the Vite dev server. What happens?",
        a: ["The page runs anyway, because Vite removes types without checking them", "The page refuses to load", "Vite fixes the error for you", "The browser shows the type error"], c: 0,
        why: "Vite only strips the types. Checking happens in the editor and in the build step (tsc or vue-tsc), so do not ignore the red underlines." }
    ]
  },
  {
    id: 'ts-collections', lv: 1, mins: 13,
    title: 'Arrays, objects, tuples and Record',
    zh: '陣列是一排有編號的盒子，物件是一格一格有名字的欄位。加 ? 表示這格可以沒有，readonly 表示不准改。元組是長度固定、每格型別固定的陣列；Record 是事先不知道會有哪些鍵的物件。',
    body: `
<p>One box holds one value. Real programs hold many: the cards in a deck, the details of one player, the best score of everyone who has played. TypeScript gives you four shapes for groups of values, and each one has a picture.</p>
<h3>Arrays: a row of numbered boxes</h3>
<p>An <b>array</b> is a row of boxes that all take the same type. The boxes are numbered from 0, and that number is the <b>index</b>.</p>
<div class="flow"><span class="box">7<small>[0]</small></span><span class="box">12<small>[1]</small></span><span class="box">3<small>[2]</small></span><span class="box hot">9<small>[3]</small></span><span class="arr">&larr; four boxes, the last index is 3</span></div>
<pre><code>const hand: number[] = [7, 12, 3, 9];
hand[0];          // 7, the first card
hand.length;      // 4
hand.push(5);     // fine: a number
hand.push('K');   // error: a string is not a number</code></pre>
<p>Write the type as <code>number[]</code> and read it as &ldquo;array of numbers&rdquo;. You will also see <code>Array&lt;number&gt;</code>, which means exactly the same; the lesson on generics explains the angle brackets. If the array starts with values, inference gives the type for you: <code>const hand = [7, 12, 3]</code> is already <code>number[]</code>.</p>
<p>An empty array is the one case to label yourself, because there is nothing for the checker to read: <code>const discards: number[] = [];</code></p>
<h3>Objects: named slots</h3>
<p>An <b>object</b> groups values that belong together, and gives each one a name instead of a number. Each named slot is a <b>property</b>. Think of a form with labelled fields.</p>
<div class="tiers"><b>Card</b><div><span class="box">rank<small>number</small></span><span class="box">suit<small>string</small></span><span class="box">faceUp<small>boolean</small></span></div></div>
<pre><code>type Card = {
  rank: number;     // 1 to 13
  suit: string;
  faceUp: boolean;
};

const current: Card = { rank: 7, suit: 'hearts', faceUp: true };
current.rank;     // 7
current.colour;   // error: colour does not exist on Card</code></pre>
<p><code>type Card = { ... }</code> gives the shape a name, so you can reuse it. This is a <b>type alias</b>. (The lesson on interfaces shows the other way to name a shape.) When you write a Card out directly, the checker insists on all three properties with the right types. A missing property, a misspelt one or an extra one is an error.</p>
<h3>Optional properties: a slot that may be empty</h3>
<p>Some fields on a form may be left blank. Mark them with a question mark. This is an <b>optional property</b>.</p>
<pre><code>type Player = {
  name: string;
  nickname?: string;   // may be missing
};

const a: Player = { name: 'Ada' };                // fine
const b: Player = { name: 'Bo', nickname: 'B' };  // fine
a.nickname.toUpperCase();   // error: a.nickname is possibly &#117;ndefined</code></pre>
<p>Reading an optional property gives <code>string | &#117;ndefined</code>: a string, or nothing at all. The checker will not let you use it as a string until you have checked that it is there. The lesson on null and undefined shows the ways to check.</p>
<h3>readonly: a slot you may read but not change</h3>
<pre><code>type FixedCard = {
  readonly rank: number;
  readonly suit: string;
};
const c: FixedCard = { rank: 7, suit: 'hearts' };
c.rank = 8;          // error: rank is read-only

const deck: readonly number[] = [1, 2, 3];
deck.push(4);        // error: no push on a readonly array</code></pre>
<p>Do not confuse <code>readonly</code> with <code>const</code>. They protect different things:</p>
<table>
<tr><th>Keyword</th><th>Stops</th><th>Example</th></tr>
<tr><td><code>const</code></td><td>Putting a different value in the variable</td><td><code>hand = []</code> is an error, but <code>hand.push(5)</code> is fine</td></tr>
<tr><td><code>readonly</code></td><td>Changing the slots inside</td><td><code>c.rank = 8</code> and <code>deck.push(4)</code> are errors</td></tr>
</table>
<p>Like every type, <code>readonly</code> is erased. It stops your code from changing the value, but it does not freeze the object while the program runs. <code>Object.freeze</code> does that.</p>
<h3>Tuples: a fixed number of boxes, each with its own type</h3>
<p>Sometimes you want a short row where each position means something different and the length never changes. That is a <b>tuple</b>.</p>
<div class="flow"><span class="box">'Ada'<small>[0] string</small></span><span class="box">12<small>[1] number</small></span><span class="arr">exactly two, in this order</span></div>
<pre><code>const entry: [string, number] = ['Ada', 12];
const who = entry[0];     // string
const points = entry[1];  // number
entry[2];                 // error: there is no position 2

// labels make the meaning clear and change nothing else
type Round = [current: number, next: number];
const r: Round = [7, 11];</code></pre>
<p>You meet tuples when a function hands back two things at once, such as a value and a function that changes it. Use them for two or three positions. Beyond that, an object with named properties is easier to read.</p>
<h3>Record: keys you do not know in advance</h3>
<p>An object type lists its property names when you write the code. But think of a table of best scores: the names are whoever turns up to play. For this, use <code>Record</code>.</p>
<div class="flow"><span class="box">'Ada'<small>12</small></span><span class="box">'Bo'<small>9</small></span><span class="box">'Cy'<small>15</small></span><span class="box hot">any new name<small>always a number</small></span></div>
<pre><code>const best: Record&lt;string, number&gt; = {};
best['Ada'] = 12;
best['Bo'] = 9;
best['Cy'] = 'ten';   // error: values must be numbers

type Level = 'easy' | 'hard';
const target: Record&lt;Level, number&gt; = { easy: 5, hard: 10 };   // both keys required</code></pre>
<p>Read <code>Record&lt;string, number&gt;</code> as &ldquo;any string as a key, each holding a number&rdquo;. When the key type is a fixed list of words, as with <code>Level</code>, the object must have every one of them. That list-of-words type is the subject of the next lesson.</p>
<h3>Picking the right shape</h3>
<table>
<tr><th>You have</th><th>Use</th><th>Type</th></tr>
<tr><td>Many values of the same kind</td><td>Array</td><td><code>number[]</code></td></tr>
<tr><td>One thing with several known fields</td><td>Object</td><td><code>{ rank: number; suit: string }</code></td></tr>
<tr><td>Two or three positions with fixed meanings</td><td>Tuple</td><td><code>[string, number]</code></td></tr>
<tr><td>A lookup table whose keys come from data</td><td>Record</td><td><code>Record&lt;string, number&gt;</code></td></tr>
</table>
<h3>Going deeper: a missing key is not caught</h3>
<p>Reading <code>best['Zoe']</code> from a <code>Record&lt;string, number&gt;</code> gives the type <code>number</code>, but while the program runs the value is <code>&#117;ndefined</code>, because nobody called Zoe has played. The checker assumes every string key exists. The same is true of arrays: <code>hand[99]</code> is typed <code>number</code> but holds nothing. There are two ways to make this honest. Turn on the <code>noUncheckedIndexedAccess</code> setting, which adds <code>| &#117;ndefined</code> to every such read (it is not part of <code>strict</code>). Or use a <code>Map</code>, whose <code>get</code> already returns <code>number | &#117;ndefined</code>.</p>
<h3>Going deeper: a tuple is still an array</h3>
<p>The checker blocks <code>entry[2]</code>, but <code>entry.push(99)</code> is allowed, because underneath a tuple is an ordinary array. Write <code>readonly [string, number]</code> when the length must truly stay fixed.</p>
<h3>Vue comparison</h3>
<p>Props in <code>&lt;script setup lang="ts"&gt;</code> are an object type, and optional props use the same question mark:</p>
<pre><code>const props = defineProps&lt;{
  title: string;
  cards: number[];
  subtitle?: string;   // optional prop
}&gt;();</code></pre>
<p>Props are also read-only from the child's side. The type Vue gives <code>props</code> marks every property <code>readonly</code>, which is why <code>props.title = 'x'</code> is a type error.</p>`,
    tryNote: 'Paste each snippet into the TypeScript Playground (https://www.typescriptlang.org/play) and read the red underlines.',
    try: [
      ['const hand = [7, 12, 3];\nhand.push("K");', 'Inference made hand an array of numbers, so the string is refused.'],
      ['type Player = { name: string; nickname?: string };\nconst p: Player = { name: "Ada" };\np.nickname.toUpperCase();', 'The last line is underlined: p.nickname is possibly undefined.'],
      ['const entry: [string, number] = ["Ada", 12];\nentry[2];\nentry.push(99);', 'Position 2 is an error, but push is allowed. A tuple is still an array underneath.'],
      ['const best: Record<string, number> = {};\nconst zoe = best["Zoe"];', 'Hover over zoe: the type says number, although the table is empty.']
    ],
    own: `Find an object your code receives from a server, such as a user profile or an item in a list. Write a <code>type</code> for it. Mark with <code>?</code> every property that can be missing, and with <code>readonly</code> every property your code should never change. Then find one place where your code builds a lookup table keyed by id or by name, and give it a <code>Record</code> type.`,
    terms: [['array', '陣列'], ['index', '索引'], ['object', '物件'], ['property', '屬性'], ['optional property', '可選屬性'], ['readonly', '唯讀'], ['tuple', '元組'], ['type alias', '型別別名']],
    quiz: [
      { q: "What is the difference between <code>const hand = [7, 12]</code> and <code>const hand: readonly number[] = [7, 12]</code>?",
        a: ["None: const already makes the array unchangeable", "Both stop hand = [], but only the second also stops hand.push(3)", "The second one is frozen while the program runs", "The first one cannot be read"], c: 1,
        why: "const stops you putting a different array in the variable. readonly stops changes to the array itself. Neither freezes anything while the program runs." },
      { q: "Which type fits a table of best scores, where the keys are player names nobody knows in advance?",
        a: ["[string, number]", "{ name: string; score: number }", "Record&lt;string, number&gt;", "string[]"], c: 2,
        why: "A Record maps any string key to a value of one type. A tuple has a fixed length, and an object type has fixed property names." },
      { q: "A type has <code>nickname?: string</code>. What type do you get when you read <code>p.nickname</code>?",
        a: ["string", "any", "string | null", "string | &#117;ndefined"], c: 3,
        why: "The question mark means the property may be missing, and a missing property reads as &#117;ndefined." }
    ]
  },
  {
    id: 'ts-unions', lv: 2, mins: 15,
    title: 'Union and literal types, and enum',
    zh: '用 | 把型別接起來，意思是「其中一種」。像 「higher」|「lower」 這樣的字面值型別，就是一張允許的單字清單，打錯字當場抓到。用 typeof 或 === 檢查過，型別就會縮小。很多團隊用字面值聯集取代 enum。',
    body: `
<p>So far each box has taken one kind of value. Real data is less tidy. An id is a number in one place and a string in another. A guess in Higher or Lower is one of exactly two words. A <b>union type</b> says &ldquo;one of these&rdquo;, and a <b>literal type</b> says &ldquo;exactly this value&rdquo;. Together they are the most useful idea in everyday TypeScript.</p>
<h3>Union: this or that</h3>
<p>Join types with a vertical bar, and read it as &ldquo;or&rdquo;:</p>
<pre><code>let id: string | number;
id = 42;        // fine
id = 'p-42';    // fine
id = true;      // error: a boolean is neither</code></pre>
<div class="flow"><span class="box hot">string | number</span><span class="arr">accepts</span><span class="box">'p-42'</span><span class="box">42</span><span class="arr">refuses</span><span class="box bad">true</span></div>
<p>The catch: while the checker only knows &ldquo;string or number&rdquo;, it lets you do only what is safe for both. <code>id.toUpperCase()</code> is an error, because numbers have no <code>toUpperCase</code>. You first have to find out which one you have.</p>
<h3>Narrowing: finding out which one</h3>
<p>Check the value with ordinary JavaScript, and inside each branch the checker knows more. This is called <b>narrowing</b>.</p>
<pre><code>function label(id: string | number): string {
  if (typeof id === 'string') {
    return id.toUpperCase();      // here id is string
  }
  return 'No. ' + id.toFixed(0);  // here id can only be number
}</code></pre>
<div class="flow"><span class="box">id: string | number</span><span class="arr">&rarr;</span><span class="box hot">typeof id === 'string'?</span><span class="arr">yes &rarr;</span><span class="box">string</span><span class="arr">no &rarr;</span><span class="box">number</span></div>
<p>The checker follows your <code>if</code>, <code>else</code>, <code>return</code> and <code>switch</code> just as the program will run them. After the <code>return</code> inside the <code>if</code>, the string case is gone, so only number is left. <code>typeof</code> always gives one of a few fixed words: <code>'string'</code>, <code>'number'</code>, <code>'boolean'</code>, <code>'object'</code>, <code>'function'</code>, <code>'&#117;ndefined'</code>, and two rarer ones.</p>
<h3>Literal types: a list of allowed words</h3>
<p>A type can also be one exact value. Join a few and you get a list of allowed words, like the choices in a drop-down menu:</p>
<pre><code>type Guess = 'higher' | 'lower';

function check(guess: Guess, current: number, next: number): boolean {
  if (guess === 'higher') return next &gt; current;
  return next &lt; current;   // here guess can only be 'lower'
}

check('higher', 7, 11);   // fine
check('hihger', 7, 11);   // error: not one of the allowed words</code></pre>
<p>Compare this with <code>guess: string</code>. With a plain string, a typo goes unnoticed until a player loses a round they should have won. With the literal union, the checker catches the typo, the editor offers the two words as you type, and narrowing with <code>===</code> works: once <code>guess</code> is not <code>'higher'</code>, it must be <code>'lower'</code>.</p>
<p>Remember <code>const best = 10</code> from the first lesson, whose type was <code>10</code>. That was a literal type. <code>let</code> widens it to <code>number</code>, because a <code>let</code> may change.</p>
<h3>Going deeper: unions of objects</h3>
<p>Literal types are most powerful as a tag inside objects. Give each shape a property with a different fixed word, and checking that one property tells the checker the whole shape:</p>
<pre><code>type Result =
  | { kind: 'right'; points: number }
  | { kind: 'wrong'; correctCard: number };

function message(r: Result): string {
  switch (r.kind) {
    case 'right': return '+' + r.points;
    case 'wrong': return 'It was ' + r.correctCard;
  }
}</code></pre>
<p>This pattern is called a <b>discriminated union</b>, and you will see it everywhere: replies from a server (success or failure), game events, screen states (loading, ready, error). Inside <code>case 'right'</code> only <code>points</code> exists, so you cannot read a property the current state does not have. If someone later adds a third kind, this function stops compiling, because it can now reach its end without returning a string. That is the checker reminding you to handle the new case.</p>
<h3>enum: named constants</h3>
<p>TypeScript also has the <b>enum</b>, a way to give names to a set of values. You will meet two kinds:</p>
<pre><code>enum Direction { Up, Down }                   // numeric: Up is 0, Down is 1
enum Level { Easy = 'easy', Hard = 'hard' }   // string

let d: Direction = Direction.Up;
let l: Level = Level.Hard;
l = 'hard';    // error: you must write Level.Hard</code></pre>
<p>Enums are unusual. A normal enum is one of the few TypeScript features that is not erased: <code>Level</code> becomes a real JavaScript object in the output, so it adds code to your bundle. A numeric enum also stores plain numbers, so a log line or a saved file shows <code>0</code> where you meant Up.</p>
<h3>Why many teams prefer literal unions</h3>
<table>
<tr><th>Question</th><th>Literal union</th><th>enum</th></tr>
<tr><td>How you write a value</td><td><code>'easy'</code></td><td><code>Level.Easy</code></td></tr>
<tr><td>Code in the output</td><td>None: erased like any type</td><td>An object</td></tr>
<tr><td>Does a plain string such as <code>'easy'</code> fit?</td><td>Yes</td><td>No, you must write the enum member</td></tr>
<tr><td>Readable in logs and network data</td><td>Yes</td><td>String enums yes, numeric enums no</td></tr>
</table>
<p>Enums are not wrong, and older code uses them a lot, so you must be able to read them. For new code, a literal union does the same job with less machinery. TypeScript 5.8 even added a setting, <code>erasableSyntaxOnly</code>, that reports enums as errors, for projects whose tools only strip types away.</p>
<h3>as const: the third way</h3>
<p>Sometimes you want the list of words as a real value too, for example to show both choices as buttons. Write the array once, add <code>as const</code>, and take the type from it:</p>
<pre><code>const GUESSES = ['higher', 'lower'] as const;
type Guess = typeof GUESSES[number];   // 'higher' | 'lower'

for (const g of GUESSES) console.log(g);   // real values, at run time</code></pre>
<p><code>as const</code> tells the checker: do not widen anything here. Without it, <code>GUESSES</code> would be <code>string[]</code> and the exact words would be lost. With it, the array is <code>readonly ['higher', 'lower']</code>. Read <code>typeof GUESSES[number]</code> as &ldquo;the type of any item in GUESSES&rdquo;. The same trick on an object gives you named constants without an enum. Copy the second line as a pattern; <code>keyof</code> gives the property names.</p>
<pre><code>const Speed = { Slow: 'slow', Fast: 'fast' } as const;
type Speed = typeof Speed[keyof typeof Speed];   // 'slow' | 'fast'</code></pre>
<h3>Going deeper: when a word becomes a string again</h3>
<pre><code>const round = { guess: 'higher' };   // guess: string, as objects can change
check(round.guess, 7, 11);           // error: string is not assignable to Guess

const fixed: { guess: Guess } = { guess: 'higher' };   // fine</code></pre>
<p>Properties of an object are widened just like a <code>let</code>, because the object may be changed later. When you meet &ldquo;Type string is not assignable to type ...&rdquo; and the value is clearly one of the words, give the object a type, or add <code>as const</code>.</p>
<h3>Vue comparison</h3>
<pre><code>defineProps&lt;{ size: 'small' | 'large' }&gt;();
const emit = defineEmits&lt;{ guess: [value: 'higher' | 'lower'] }&gt;();
emit('guess', 'higher');   // both the event name and the value are checked</code></pre>
<p>A literal union on a prop gives the parent component autocomplete, and an error for <code>size="medium"</code>. The <code>defineEmits</code> form shown here (Vue 3.3 and later) lists each event with a tuple of its arguments, so the event name and its value are both checked.</p>`,
    tryNote: 'Paste each snippet into the TypeScript Playground (https://www.typescriptlang.org/play).',
    try: [
      ['type Guess = "higher" | "lower";\nlet g: Guess = "hihger";', 'The typo is caught. Delete the word, type a quote mark, and the editor offers the two allowed words.'],
      ['function f(id: string | number) {\n  if (typeof id === "string") return id;\n  return id;\n}', 'Hover over each id in the return lines: the first is string, the second is number. That is narrowing.'],
      ['enum Level { Easy = "easy", Hard = "hard" }\nconst GUESSES = ["higher", "lower"] as const;', 'Open the .JS tab: the enum became a real object, while the as const line produced nothing extra.'],
      ['const round = { guess: "higher" };\nconst fixed = { guess: "higher" } as const;', 'Hover over both names: round has guess: string, fixed has readonly guess: "higher".']
    ],
    own: `Search your code for a <code>string</code> property or parameter that can only ever hold a few fixed words, such as a status, a size, a tab name or a sort order. Change its type to a literal union and run the type check. Every error it reports is either a typo that was already there or a place that needs narrowing. If your code uses an <code>enum</code>, paste it into the Playground once and look at the object it turns into.`,
    terms: [['union type', '聯集型別'], ['literal type', '字面值型別'], ['narrowing', '型別縮小'], ['discriminated union', '可辨識聯集'], ['enum', '列舉'], ['widening', '型別放寬']],
    quiz: [
      { q: "<code>id</code> is <code>string | number</code>. Inside <code>if (typeof id === 'string') { ... }</code>, what is the type of id?",
        a: ["string | number", "string", "number", "any"], c: 1,
        why: "The check narrows the union. In the else branch, or after a return inside the if, only number is left." },
      { q: "Why do many teams choose <code>'easy' | 'hard'</code> over an enum?",
        a: ["Literal unions are checked while the program runs", "Enums cannot hold strings", "Enums are slower to type-check", "Literal unions are erased, add nothing to the output, and accept plain strings such as 'easy'"], c: 3,
        why: "An enum becomes a real JavaScript object, and a string enum refuses the plain string. Neither is checked while the program runs." },
      { q: "Without <code>as const</code>, what type does <code>const GUESSES = ['higher', 'lower']</code> have?",
        a: ["string[]", "readonly ['higher', 'lower']", "'higher' | 'lower'", "[string, string]"], c: 0,
        why: "The items are widened to string, because an array can change. as const keeps the exact words and makes the array readonly." }
    ]
  },
  {
    id: 'ts-functions', lv: 1, mins: 14,
    title: 'Functions, arrow functions and callbacks',
    zh: '函式也是值：可以放進變數，也可以當參數傳出去。回呼函式就是交給別人、讓他晚點再執行的一張紙條。參數一定要標型別，回傳型別通常推論得出來。',
    body: `
<p>A <b>function</b> is a named set of steps that you can run whenever you like. In Higher or Lower you need steps to draw a card, to check a guess and to add to the score. You have written functions for years. This lesson looks at them the way TypeScript sees them, and at one idea that changes how you read code: a function is a value, just like a number.</p>
<h3>Parameters in, a value out</h3>
<pre><code>function checkGuess(guess: 'higher' | 'lower', current: number, next: number): boolean {
  if (guess === 'higher') return next &gt; current;
  return next &lt; current;
}

checkGuess('higher', 7, 11);   // true
checkGuess('higher', 7);       // error: expected 3 arguments, but got 2</code></pre>
<div class="tiers"><b>Parameters</b><div><span class="box">guess<small>'higher' | 'lower'</small></span><span class="box">current<small>number</small></span><span class="box">next<small>number</small></span></div><b>Return type</b><div><span class="box hot">boolean<small>written after the )</small></span></div></div>
<p>Each <b>parameter</b> needs a type, because the checker cannot guess what callers will pass. Under <code>strict</code>, a parameter without one is an error (callbacks are the exception, as you will see below). The <b>return type</b> after the brackets is often optional: the checker infers it from the <code>return</code> lines. Writing it anyway is good practice for functions that other files use, because then a mistake inside the function is reported inside the function, and not at every caller.</p>
<p>A function that returns nothing useful has the return type <code>void</code>.</p>
<h3>Arrow functions: the short form</h3>
<pre><code>// the same function, written two ways
function double(n: number): number { return n * 2; }
const double2 = (n: number): number =&gt; n * 2;</code></pre>
<p>An <b>arrow function</b> is written as the parameters, then <code>=&gt;</code>, then the body. If the body is a single expression, its value is returned without the word <code>return</code>. If you need several lines, use braces and <code>return</code> as usual.</p>
<h3>A function is a value</h3>
<p>Look at <code>const double2 = ...</code> again. It puts a function into a box, exactly as <code>const score = 0</code> puts a number into one. Anything you can do with a value, you can do with a function: keep it in a variable, put it in an object, pass it to another function, return it from one.</p>
<pre><code>const rules = {
  easy: (a: number, b: number) =&gt; b &gt;= a,   // a tie counts as higher
  hard: (a: number, b: number) =&gt; b &gt; a,
};
const isHigher = rules.hard;   // no brackets: the function itself, not run
isHigher(7, 11);               // brackets: run it now, gives true</code></pre>
<p>The brackets make all the difference. <code>isHigher</code> is a recipe card. <code>isHigher(7, 11)</code> is cooking the recipe and getting the dish.</p>
<h3>Callbacks: a note handed to someone to run later</h3>
<p>A <b>callback</b> is a function you give to someone else, for them to run when the time comes. It is like leaving a note with a neighbour: &ldquo;when the parcel arrives, sign for it.&rdquo; You write the note now. They carry it out later, perhaps more than once.</p>
<div class="flow"><span class="box">You write the note<small>() =&gt; showNextCard()</small></span><span class="arr">hand it to &rarr;</span><span class="box">setTimeout, map, a click listener</span><span class="arr">&rarr;</span><span class="box hot">They run it<small>later, when the moment comes</small></span></div>
<pre><code>function showNextCard(): void { console.log('next card'); }

setTimeout(showNextCard, 1000);                     // once, in one second
document.body.addEventListener('click', () =&gt; showNextCard());  // on every click

const hand = [7, 12, 3];
const doubled = hand.map(n =&gt; n * 2);              // once per card: [14, 24, 6]</code></pre>
<p>Notice that <code>n</code> in the last line has no annotation, and yet it is a number. The checker knows that <code>map</code> on a <code>number[]</code> will pass in numbers, so it fills in the type. This is called <b>contextual typing</b>, and it is why callbacks rarely need labels.</p>
<div class="warn">The most common callback mistake is <code>setTimeout(showNextCard(), 1000)</code>. The brackets run the function now and pass its result, which is nothing, to <code>setTimeout</code>. Pass the function itself: <code>setTimeout(showNextCard, 1000)</code>. TypeScript usually catches this one, because the result is not a function.</div>
<h3>Optional and default parameters</h3>
<pre><code>function addPoints(score: number, points = 1): number {
  return score + points;
}
addPoints(5);      // 6: points uses its default
addPoints(5, 3);   // 8

function greet(name: string, title?: string): string {
  return title ? title + ' ' + name : name;   // title is string | &#117;ndefined
}</code></pre>
<p>A <b>default parameter</b> (<code>points = 1</code>) may be left out by the caller, and its type is inferred from the default value. An optional parameter (<code>title?</code>) may also be left out, but then it is <code>&#117;ndefined</code> inside the function, so you must check it before use. Optional parameters must come after the required ones.</p>
<h3>Writing the type of a function</h3>
<p>When a function is a value, you sometimes need to write its type. It looks like an arrow function without a body:</p>
<pre><code>type Rule = (current: number, next: number) =&gt; boolean;
type OnGuess = (guess: 'higher' | 'lower') =&gt; void;

const hard: Rule = (a, b) =&gt; b &gt; a;   // a and b are inferred as number

function onButton(handler: OnGuess): void {
  handler('higher');
}</code></pre>
<div class="tiers"><b>Takes</b><div><span class="box">(current: number, next: number)</span></div><b>Gives back</b><div><span class="box hot">=&gt; boolean</span></div></div>
<p>Read <code>(current: number, next: number) =&gt; boolean</code> as &ldquo;a function that takes two numbers and gives back a boolean&rdquo;. This <b>function type</b> is how you say that a parameter is a callback, and it is how library types describe every callback they accept.</p>
<h3>Why callbacks are usually arrow functions</h3>
<p>There are two reasons. The first is length: <code>n =&gt; n * 2</code> is easier to read in the middle of a line than <code>function (n) { return n * 2; }</code>. The second matters more and has to do with <code>this</code>. An arrow function has no <code>this</code> of its own; it uses the one from the code around it. A normal <code>function</code> gets a new <code>this</code> that depends on who calls it, which is a classic source of bugs when callbacks are used inside classes. The lesson on closures explains this properly. For now, the rule is simple: use arrow functions for callbacks.</p>
<h3>Going deeper: two surprises in function types</h3>
<ul>
<li><b>Parameter names are required, and they are only names.</b> In <code>(guess: string) =&gt; void</code>, the word <code>guess</code> is just a label. If you write <code>(string) =&gt; void</code>, TypeScript reads <code>string</code> as a parameter name with no type. Under <code>strict</code> this is an error, which saves you; without strict you silently get <code>any</code>.</li>
<li><b>Fewer parameters are fine.</b> A callback may ignore parameters it does not need. <code>map</code> passes each item, its index and the whole array, yet <code>n =&gt; n * 2</code> is accepted. Taking fewer is safe. Requiring more than the caller will pass is an error.</li>
</ul>
<h3>Vue comparison</h3>
<p>Vue's Composition API is built on passing functions as values. <code>computed(() =&gt; score.value * 2)</code> hands Vue a function that it runs to work out the value, and runs again after <code>score</code> has changed. <code>watch(score, (next, prev) =&gt; ...)</code> hands it a callback whose two parameter types Vue fills in by contextual typing. <code>onMounted(() =&gt; ...)</code> is a note that says &ldquo;run this once the component is on the page&rdquo;. And in a template, <code>@click="checkGuess"</code> passes the function itself, while <code>@click="checkGuess('higher')"</code> is wrapped in a small function by Vue's compiler, so it does not run until the click.</p>`,
    tryNote: 'Paste each snippet into the TypeScript Playground (https://www.typescriptlang.org/play). To see output, press Run and open the Logs tab.',
    try: [
      ['const hand = [7, 12, 3];\nconst doubled = hand.map(n => n * 2);', 'Hover over n: it is a number, though nobody wrote the type. Contextual typing filled it in.'],
      ['function showNextCard(): void {}\nsetTimeout(showNextCard(), 1000);', 'An error: the brackets run the function and pass its result. Delete the brackets after showNextCard to pass the function itself.'],
      ['type Rule = (current: number, next: number) => boolean;\nconst hard: Rule = (a, b) => b > a;\nconsole.log(hard(7, 11));', 'Hover over a: it is a number, taken from Rule. Press Run and the Logs tab shows true.'],
      ['type Bad = (string) => void;', 'An error under strict: string is read as a parameter name with no type.']
    ],
    own: `Find three callbacks in your own code: one passed to an array method such as <code>map</code> or <code>filter</code>, one passed to <code>setTimeout</code> or an event listener, and one passed to a Vue function such as <code>watch</code> or <code>computed</code>. Hover over each callback's parameters and note the types that contextual typing gave them. Then pick one function that other files call and write its return type by hand.`,
    terms: [['function', '函式'], ['parameter', '參數'], ['return type', '回傳型別'], ['arrow function', '箭頭函式'], ['callback', '回呼函式'], ['contextual typing', '上下文型別'], ['default parameter', '預設參數'], ['function type', '函式型別']],
    quiz: [
      { q: "What is the difference between <code>setTimeout(showNextCard, 1000)</code> and <code>setTimeout(showNextCard(), 1000)</code>?",
        a: ["The first is not valid TypeScript", "None: both show the card after one second", "The first passes the function to run later; the second runs it now and passes its result", "The second runs it twice"], c: 2,
        why: "Without brackets you hand over the function itself. With brackets you call it at once and pass whatever it returns." },
      { q: "In <code>[7, 12, 3].map(n =&gt; n * 2)</code>, why does <code>n</code> need no type annotation?",
        a: ["map on a number[] tells the checker it will pass numbers, so the type is filled in from the context", "Parameters of arrow functions are always any", "Annotations are not allowed in arrow functions", "The checker skips callbacks"], c: 0,
        why: "This is contextual typing. The type of the place a callback is passed to decides the types of its parameters." },
      { q: "Which type describes a function that takes a guess word and returns nothing?",
        a: ["(string) =&gt; void", "(guess: 'higher' | 'lower') =&gt; void", "function: void", "void(guess)"], c: 1,
        why: "Parameter names are required in function types. In (string) =&gt; void, string is a parameter name with no type." }
    ]
  },
  {
    id: 'ts-null', lv: 2, mins: 15,
    title: 'null and undefined: when a value is missing',
    zh: 'undefined 是「從來沒放東西」，null 是「刻意放空」。執行時最常見的當機，就是對它們讀屬性。用型別守衛、?.、?? 先處理；! 只是叫檢查器別管，不會真的檢查。strictNullChecks 會逼你把這些情況都處理好。',
    body: `
<p>Ask front-end developers which error they have seen most often, and many will quote this one:</p>
<pre><code>TypeError: Cannot read properties of &#117;ndefined (reading 'name')</code></pre>
<p>It means the code asked for the <code>name</code> of something, and there was nothing there. JavaScript has two ways to say &ldquo;nothing&rdquo;. This lesson covers both, and how TypeScript makes the checker find these mistakes before your users do.</p>
<h3>Two kinds of nothing</h3>
<table>
<tr><th>&nbsp;</th><th><code>&#117;ndefined</code></th><th><code>null</code></th></tr>
<tr><td>Means</td><td>Nothing was ever put here</td><td>Someone deliberately put &ldquo;empty&rdquo; here</td></tr>
<tr><td>Like</td><td>A form field nobody filled in</td><td>A form field where someone wrote &ldquo;none&rdquo;</td></tr>
<tr><td>Comes from</td><td>A missing property, an optional parameter not passed, a function with no <code>return</code>, a search with no match</td><td>Code that chose it: an element that is not on the page, a field a server sent as empty, your own &ldquo;not chosen yet&rdquo;</td></tr>
</table>
<p>For most purposes treat them the same: the value is missing. What matters is that a value which might be missing is a different kind of thing from one that is always there, and the type should say which.</p>
<h3>What strictNullChecks changes</h3>
<p>Without <code>strictNullChecks</code>, <code>null</code> and <code>&#117;ndefined</code> fit in every box. The checker assumes every value is present, and the crash waits until the program runs. With it (it is part of <code>strict</code>), a box accepts them only if its label says so:</p>
<pre><code>let chosen: string = null;          // error with strictNullChecks
let picked: string | null = null;   // fine: the label allows it

const el = document.querySelector('#score');   // Element | null
el.textContent = '0';                          // error: 'el' is possibly 'null'</code></pre>
<div class="flow"><span class="box">A value that may be missing<small>string | &#117;ndefined</small></span><span class="arr">&rarr;</span><span class="box hot">Check it<small>if, ?., ??</small></span><span class="arr">&rarr;</span><span class="box">Safe to use<small>string</small></span></div>
<p>This may be the most valuable check TypeScript has. Each of these errors is a crash that would have happened to some user on some day. The rest of the lesson is the toolkit for dealing with them.</p>
<h3>Type guards: check, then use</h3>
<p>A <b>type guard</b> is any check that the checker understands. After it, the type is narrowed, exactly as with unions in the lesson before. In fact <code>string | null</code> is just a union.</p>
<pre><code>function showName(name: string | null | &#117;ndefined) {
  if (name) {
    console.log(name.toUpperCase());   // here name is string
  }
}

function setScore(el: Element | null, score: number) {
  if (el === null) return;             // leave early if missing
  el.textContent = String(score);      // from here on, el is Element
}</code></pre>
<table>
<tr><th>Guard</th><th>Removes</th><th>Watch out</th></tr>
<tr><td><code>if (x)</code></td><td><code>null</code> and <code>&#117;ndefined</code></td><td>Also skips <code>0</code>, <code>''</code> and <code>false</code>, which may be real values</td></tr>
<tr><td><code>x !== null</code></td><td><code>null</code> only</td><td><code>&#117;ndefined</code> still gets through</td></tr>
<tr><td><code>x != null</code></td><td>Both</td><td>The one place where the loose <code>!=</code> is used on purpose</td></tr>
<tr><td><code>typeof x === 'string'</code></td><td>Everything that is not a string</td><td>Good for unions of basic types</td></tr>
<tr><td><code>'error' in r</code></td><td>Object shapes without that property</td><td>For unions of objects, as below</td></tr>
</table>
<pre><code>type Reply = { cards: number[] } | { error: string };

function handle(r: Reply) {
  if ('error' in r) {
    console.log(r.error);          // r is { error: string }
  } else {
    console.log(r.cards.length);   // r is { cards: number[] }
  }
}</code></pre>
<h3>Optional chaining: stop quietly if something is missing</h3>
<p><b>Optional chaining</b>, written <code>?.</code>, reads a property only if the thing before it exists. If that thing is <code>null</code> or <code>&#117;ndefined</code>, the whole expression stops and gives <code>&#117;ndefined</code>, with no crash.</p>
<pre><code>type Player = { name: string; stats?: { best: number } };

function bestOf(p: Player | null) {
  return p?.stats?.best;   // number | &#117;ndefined
}

function finish(onDone?: () =&gt; void) {
  onDone?.();              // call it only if one was passed
}</code></pre>
<div class="flow"><span class="box">p</span><span class="arr">?.</span><span class="box">stats</span><span class="arr">?.</span><span class="box">best</span><span class="arr">&rarr;</span><span class="box hot">a number, or &#117;ndefined<small>missing anywhere: stop, no crash</small></span></div>
<p><code>?.</code> does not make the value appear. It turns a crash into an <code>&#117;ndefined</code> that you still have to deal with, usually with the next operator.</p>
<h3>?? versus ||: the zero problem</h3>
<p>To supply a fallback value, older code uses <code>||</code>, and it has a trap. <code>||</code> uses the right side whenever the left side is <b>falsy</b>, and falsy includes real values: <code>0</code>, <code>''</code> and <code>false</code>. The <b>nullish coalescing</b> operator <code>??</code> uses the right side only when the left side is <code>null</code> or <code>&#117;ndefined</code>.</p>
<pre><code>function startingBest(saved: number | null): number {
  return saved ?? 10;   // 10 only when nothing was saved
}
startingBest(null);   // 10
startingBest(0);      // 0: a real score is kept
// with || in place of ??, startingBest(0) would give 10</code></pre>
<table>
<tr><th>Left side</th><th><code>x || 10</code></th><th><code>x ?? 10</code></th></tr>
<tr><td><code>null</code> or <code>&#117;ndefined</code></td><td>10</td><td>10</td></tr>
<tr><td><code>0</code></td><td>10</td><td>0</td></tr>
<tr><td><code>''</code> or <code>false</code></td><td>10</td><td>Kept as it is</td></tr>
<tr><td><code>7</code></td><td>7</td><td>7</td></tr>
</table>
<p>A rule of thumb: use <code>??</code> for default values. Use <code>||</code> only when you really mean &ldquo;any falsy value counts as missing&rdquo;, such as treating an empty search box as no search. Its cousin <code>??=</code> assigns only when the variable is missing: <code>options.speed ??= 1</code>.</p>
<h3>The ! assertion: &ldquo;trust me&rdquo;</h3>
<p>Writing <code>!</code> after a value tells the checker: this is not null or undefined, stop warning me. It is called the <b>non-null assertion</b>.</p>
<pre><code>const el = document.querySelector('#score')!;   // Element, no more error
el.textContent = '0';</code></pre>
<div class="warn">The <code>!</code> is erased like every type, so nothing is checked when the program runs. If the element is missing (a renamed id, a component that is not on the page yet), the crash still happens. Only now the checker has been told to stay quiet, and the error appears far from its cause. Use <code>!</code> only when you can say why the value must exist. A check costs one line, and a clear error such as <code>throw new Error('#score not found')</code> tells the next person exactly what went wrong.</div>
<h3>Going deeper: your own type guard</h3>
<p>When the check is more involved, put it in a function whose return type is a <b>type predicate</b>, written <code>x is Card</code>. The checker then narrows wherever the function is used:</p>
<pre><code>type Card = { rank: number; suit: string };

function isCard(x: unknown): x is Card {
  if (typeof x !== 'object' || x === null) return false;
  return 'rank' in x &amp;&amp; typeof x.rank === 'number'
      &amp;&amp; 'suit' in x &amp;&amp; typeof x.suit === 'string';
}

const data: unknown = JSON.parse('{"rank": 7, "suit": "hearts"}');
if (isCard(data)) console.log(data.rank);   // data is Card here</code></pre>
<p>This is the honest way to handle data from outside: start from <code>unknown</code>, check, then trust. The checker believes the predicate completely, so make sure the check inside really proves what the return type promises.</p>
<h3>Going deeper: where missing values come from</h3>
<table>
<tr><th>Source</th><th>Type you get</th></tr>
<tr><td><code>cards.find(...)</code> on a <code>Card[]</code></td><td><code>Card | &#117;ndefined</code></td></tr>
<tr><td><code>scores.get(name)</code> on a <code>Map&lt;string, number&gt;</code></td><td><code>number | &#117;ndefined</code></td></tr>
<tr><td><code>document.querySelector(...)</code></td><td><code>Element | null</code></td></tr>
<tr><td><code>localStorage.getItem(key)</code></td><td><code>string | null</code></td></tr>
<tr><td>An optional property or parameter</td><td>Its type, plus <code>| &#117;ndefined</code></td></tr>
<tr><td><code>JSON.parse(...)</code></td><td><code>any</code>: nothing is checked at all</td></tr>
</table>
<h3>Vue comparison</h3>
<p>A template ref is <code>null</code> until the component is on the page, and its type says so:</p>
<pre><code>const input = ref&lt;HTMLInputElement | null&gt;(null);

onMounted(() =&gt; {
  input.value?.focus();   // safe even if the element sits behind a v-if
});</code></pre>
<p>Props declared with <code>?</code> are <code>&#117;ndefined</code> when the parent does not pass them, so the same tools apply: <code>props.subtitle ?? ''</code>, or a default value through <code>withDefaults</code>.</p>`,
    tryNote: 'Paste each snippet into the TypeScript Playground (https://www.typescriptlang.org/play). To see output, press Run and open the Logs tab.',
    try: [
      ['const el = document.querySelector("#score");\nel.textContent = "0";', 'The checker says el is possibly null. Wrap the second line in if (el) { ... } and the error goes away.'],
      ['function best(saved: number | null) {\n  return [saved || 10, saved ?? 10];\n}\nconsole.log(best(0));', 'Press Run: the Logs tab shows [10, 0]. Only ?? keeps the real score of 0.'],
      ['type P = { name: string; stats?: { best: number } };\nconst p: P = { name: "Ada" };\nconsole.log(p.stats?.best);', 'No crash: the log shows undefined. Delete the ? and the checker underlines p.stats.'],
      ['const cards = [7, 12, 3];\nconst big = cards.find(c => c > 20);', 'Hover over big: number | undefined. A search can come back empty-handed.']
    ],
    own: `Turn on <code>strictNullChecks</code> (or the whole of <code>strict</code>) in a small project of yours, or in a copy of a larger one, and run the type check. Do not try to fix everything. Pick five errors, and for each write down where the missing value comes from and what the user would see if it really were missing. Then search the code for non-null assertions, a <code>!</code> straight after a name or a closing bracket as in <code>el!.focus()</code>, and decide for each one whether it should be a real check.`,
    terms: [['type guard', '型別守衛'], ['optional chaining', '可選串連'], ['nullish coalescing', '空值合併'], ['falsy', '假值'], ['non-null assertion', '非空值斷言'], ['type predicate', '型別述詞'], ['runtime', '執行階段']],
    quiz: [
      { q: "A saved best score can be 0. Which expression gives 10 only when nothing was saved?",
        a: ["saved! || 10", "saved?.10", "saved || 10", "saved ?? 10"], c: 3,
        why: "|| treats 0 as missing, because 0 is falsy. ?? replaces only null and &#117;ndefined." },
      { q: "What does the <code>!</code> in <code>document.querySelector('#score')!</code> do when the program runs?",
        a: ["It throws a clear error if the element is missing", "It waits until the element exists", "Nothing: it is erased, and only the checker stops warning", "It returns an empty element"], c: 2,
        why: "The non-null assertion belongs to the types, so it disappears from the JavaScript. If the element is missing, the code still crashes, only later." },
      { q: "With <code>strictNullChecks</code> on, which line is an error?",
        a: ["let a: string = null;", "let b: string | null = null;", "let c: string | &#117;ndefined = &#117;ndefined;", "let d = null;"], c: 0,
        why: "A plain string box does not accept null. The label has to include it, as in string | null." }
    ]
  }
  ]
});
