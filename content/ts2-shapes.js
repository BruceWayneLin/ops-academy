M({
  id: 'ts2', n: 2, track: 'ts',
  title: 'Classes and shapes',
  zh: '類別與形狀：用模子做物件、用模子做模子、只描述形狀的介面、標籤晚點才填的泛型。',
  time: '1 to 2 weeks',
  blurb: 'Classes as moulds, inheritance and abstract base classes, interfaces as shapes, and generics as boxes with a blank label. These are the building blocks under every framework and game engine you will use.',
  lessons: [
  {
    id: 'ts-class', lv: 1, mins: 14,
    title: 'A class, grown from zero',
    zh: '要很多個長得一樣的物件，就做一個模子：class。new 用模子壓出一個，constructor 收下每一個需要的資料。private／protected 是「誰可以碰」，static 是「屬於模子本身，不屬於每一個複製品」。',
    body: `
<p>You already know objects. This lesson grows a class out of them, one step at a time, using a card game as the example: <b>Higher or Lower</b>. A card is face up on the table, the player guesses whether the next card will be higher or lower, and scores a point for each right guess.</p>
<h3>Step 1: you already know objects</h3>
<p>An object is a bundle of named values. One card is a rank, from 1 (ace) to 13 (king), and a suit:</p>
<pre><code>const card = { rank: 5, suit: 'hearts' };
console.log(card.rank); // 5</code></pre>
<p>That is fine for one card. A deck has 52.</p>
<h3>Step 2: many objects of the same shape want a mould</h3>
<p>Write 52 objects by hand and sooner or later one of them says <code>rnak</code>, or holds its rank as text. Every card is meant to have the same shape and the same abilities, such as answering &ldquo;am I higher than that card?&rdquo;. When you need many objects that are all alike, you want a <b>mould</b>: one place that says what every copy looks like, so that every copy comes out the same. In TypeScript that mould is a <b>class</b>.</p>
<div class="tiers"><b>Mould</b><div><span class="box hot">class Card<small>rank, suit, isHigherThan()</small></span></div><b>new</b><div><span class="arr">&darr; new Card(5, 'hearts')</span><span class="arr">&darr; new Card(12, 'spades')</span><span class="arr">&darr; new Card(1, 'clubs')</span></div><b>Copies</b><div><span class="box">5 of hearts</span><span class="box">12 of spades</span><span class="box">1 of clubs</span></div></div>
<p>One mould, many copies. Each copy is called an <b>instance</b> of the class. Each has its own rank and suit, and they all share the same abilities.</p>
<h3>Step 3: new presses one out, the constructor takes what each one needs</h3>
<pre><code>class Card {
  rank: number;
  suit: string;

  constructor(rank: number, suit: string) {
    this.rank = rank;
    this.suit = suit;
  }

  isHigherThan(other: Card): boolean {
    return this.rank &gt; other.rank;
  }
}

const a = new Card(5, 'hearts');
const b = new Card(12, 'spades');
console.log(b.isHigherThan(a)); // true</code></pre>
<p>Read it from the top:</p>
<ul>
<li><b>Fields</b> (<code>rank</code>, <code>suit</code>) are the values every copy holds. The type says what may go in.</li>
<li>The <b>constructor</b> is a function that runs once for each new copy. Its parameters are what you must hand over to make one: here, a rank and a suit.</li>
<li><b>Methods</b> (<code>isHigherThan</code>) are functions that every copy can use. Any card can answer the question.</li>
</ul>
<p>When you write <code>new Card(5, 'hearts')</code>, three things happen in order:</p>
<div class="flow"><span class="box">1. Make an empty object</span><span class="arr">&rarr;</span><span class="box hot">2. Run the constructor<small>with this set to that new object</small></span><span class="arr">&rarr;</span><span class="box">3. Hand the object back<small>it is stored in a</small></span></div>
<h3>Step 4: this means &ldquo;the copy I was called on&rdquo;</h3>
<p>Inside the constructor and the methods, <code>this</code> is the particular copy. In <code>b.isHigherThan(a)</code>, <code>this</code> is <code>b</code> and <code>other</code> is <code>a</code>. The same method code serves all 52 cards because <code>this</code> changes with each call.</p>
<p>One trap, so that you recognise it later: <code>this</code> is decided by how a method is called, not by where it was written. Take the method off the object, call it on its own, and <code>this</code> is lost. Continuing the example above:</p>
<pre><code>const check = b.isHigherThan;
check(a);                          // crash: this is &#117;ndefined
const safe = () =&gt; b.isHigherThan(a);
safe();                            // fine: called on b</code></pre>
<p>TypeScript does not warn you about the first line. It bites when you pass a method as a callback, to a timer or a click handler. Wrap it in an arrow function, as in the last two lines. This is also why Cocos Creator&rsquo;s <code>node.on(...)</code> takes an extra argument: the object to use as <code>this</code>.</p>
<h3>Step 5: public, private, protected: who may touch it</h3>
<p>The words you can put in front of a field or a method to control who may use it are called <b>access modifiers</b>.</p>
<table>
<tr><th>Word</th><th>Who may read or change it</th><th>Like</th></tr>
<tr><td><code>public</code> (the default)</td><td>Anyone who holds the object</td><td>The face of a card on the table</td></tr>
<tr><td><code>private</code></td><td>Only code inside this class</td><td>The order of the cards in the dealer&rsquo;s deck</td></tr>
<tr><td><code>protected</code></td><td>This class, and classes built from it (next lesson)</td><td>A family recipe</td></tr>
<tr><td><code>readonly</code></td><td>Anyone may read it. It is set once, in the field or in the constructor, and never again.</td><td>Printed in ink, not written in pencil</td></tr>
</table>
<p>A deck is a good place to use them. Nobody outside should reach in and rearrange the cards. They should only draw.</p>
<pre><code>class Deck {
  static readonly SIZE = 52;
  private cards: Card[] = [];
  constructor() {
    for (const suit of ['hearts', 'diamonds', 'clubs', 'spades']) {
      for (let rank = 1; rank &lt;= 13; rank++) {
        this.cards.push(new Card(rank, suit));
      }
    }
  }
  draw(): Card | &#117;ndefined {
    return this.cards.pop();
  }
}

const deck = new Deck();
deck.draw();             // fine
deck.cards = [];         // error: cards is private
console.log(Deck.SIZE);  // 52</code></pre>
<p>The private check happens while you type, in the editor and when the code is compiled. The JavaScript that finally runs knows nothing about it, because <code>private</code> is erased. That is enough to stop mistakes, which is its purpose.</p>
<h3>Step 6: static belongs to the mould, not to each copy</h3>
<p>Some things are about cards in general, not about one card: how many cards make a full deck, or how many cards have been made so far. Mark them <code>static</code>. A <b>static member</b> lives on the class itself, so you reach it through the class name, as in <code>Deck.SIZE</code>, and not through a copy.</p>
<pre><code>class Card {
  static made = 0;     // one number, kept on the mould
  rank: number;        // one per copy
  suit: string;

  constructor(rank: number, suit: string) {
    this.rank = rank;
    this.suit = suit;
    Card.made += 1;
  }
}

new Card(5, 'hearts');
new Card(12, 'spades');
console.log(Card.made); // 2</code></pre>
<div class="tiers"><b>On the mould</b><div><span class="box hot">Card.made<small>one value, shared by all</small></span><span class="box hot">Deck.SIZE<small>read through the class name</small></span></div><b>On each copy</b><div><span class="box">card.rank</span><span class="box">card.suit</span><span class="box">card.isHigherThan()</span></div></div>
<p>You have used static members for years without the name: <code>Date.now()</code> and <code>Array.isArray()</code> are called on the class, while <code>[1, 2].includes(2)</code> is called on one array.</p>
<h3>Step 7: when to use a class, and when not</h3>
<table>
<tr><th>You have</th><th>Use</th></tr>
<tr><td>Just data: a score row, a settings object, an answer from a server</td><td>A plain object, described by a type (the lesson on interfaces)</td></tr>
<tr><td>One job with no memory: work out a score, format a time</td><td>A function</td></tr>
<tr><td>Many copies, each with its own state and the same behaviour: cards, enemies, timers</td><td>A class</td></tr>
<tr><td>Something that must guard its own state: a deck that only lets you draw</td><td>A class with private fields</td></tr>
<tr><td>A framework that asks for one: Cocos Creator, many game engines</td><td>A class that extends the framework&rsquo;s base class (next lesson)</td></tr>
</table>
<p>Data that arrives as JSON is made of plain objects. It is not an instance of your class and has none of its methods, however well its shape matches.</p>
<h3>Vue comparison</h3>
<p>A <code>.vue</code> file is a mould too. Write <code>&lt;PlayingCard /&gt;</code> three times and Vue presses out three instances, each with its own <code>ref</code> state, all sharing one template and one set of functions. Props play the part of constructor arguments. The difference is who presses: Vue makes instances for you when it renders, while with a class you call <code>new</code> yourself. Vue&rsquo;s Composition API leans on functions and plain objects; Cocos Creator leans on classes.</p>
<h3>Going deeper: what a class is at runtime</h3>
<p>A class is still JavaScript. After compiling, <code>Card</code> is a function, and its methods are stored once, on an object called <code>Card.prototype</code> that every card links to. That is why 52 cards do not hold 52 copies of <code>isHigherThan</code>: each copy holds its own fields and borrows the methods from the mould. A method written as an arrow-function field, such as <code>check = () =&gt; this.rank</code>, is different. Every copy gets its own function, which keeps <code>this</code> fixed but costs a little memory per copy.</p>
<p>The class name is also a type, so you can write <code>let current: Card</code>.</p>
<h3>Going deeper: two shortcuts and one rule</h3>
<ul>
<li><b>Parameter properties.</b> <code>constructor(public readonly rank: number, public readonly suit: string) {}</code> declares the two fields and fills them in, in one line. You will see this often in other people&rsquo;s code, and in the next lessons.</li>
<li><b>Real privacy.</b> A field whose name starts with <code>#</code>, such as <code>#cards</code>, is private in JavaScript itself, so nothing outside can reach it even while the code runs. TypeScript&rsquo;s <code>private</code> is a check before the code runs.</li>
<li><b>Every field must get a value.</b> In strict mode, TypeScript complains when a field gets no starting value and is not set in the constructor (&ldquo;has no initializer and is not definitely assigned&rdquo;). Give it a value, mark it optional, or, if a framework fills it in later, write <code>rank!: number</code>, which means &ldquo;trust me, it will be set&rdquo;.</li>
</ul>`,
    tryNote: 'Paste each snippet into the TypeScript Playground (typescriptlang.org/play), press Run, and read the Logs panel. Hover over a red underline to read the error.',
    try: [
      ['class Card {\n  constructor(public rank: number, public suit: string) {}\n  isHigherThan(other: Card) { return this.rank > other.rank; }\n}\nconsole.log(new Card(12, "spades").isHigherThan(new Card(5, "hearts")));', 'Two copies from one mould. The log shows <code>true</code>.'],
      ['class Deck {\n  private cards: number[] = [1, 2, 3];\n}\nnew Deck().cards;', 'A red underline: <code>cards</code> is private. Open the .JS tab and see that the word <code>private</code> is gone from the output.'],
      ['class Card {\n  static made = 0;\n  constructor() { Card.made += 1; }\n}\nnew Card(); new Card();\nconsole.log(Card.made);', 'One counter on the mould, shared by every copy. The log shows 2.'],
      ['class Card {\n  constructor(public rank: number) {}\n  show() { return this.rank; }\n}\nconst f = new Card(5).show;\nconsole.log(f());', 'No red underline, but Run throws an error: the method was taken off its object, so <code>this</code> is &#117;ndefined.']
    ],
    own: `Find a place in your own code, or in a small project, where several objects of the same shape are built by hand: the items of a list, the enemies of a small game, the cards of a quiz. Turn them into a class with a constructor. Make one field <code>private</code> and one <code>readonly</code>, and add one <code>static</code> member. Then write one sentence on whether the class is really better there than plain objects, and why.`,
    terms: [['class', '類別'], ['instance', '實例'], ['constructor', '建構函式'], ['field', '欄位'], ['method', '方法'], ['access modifier', '存取修飾詞'], ['static member', '靜態成員'], ['readonly', '唯讀']],
    quiz: [
      { q: "What does <code>new Card(5, 'hearts')</code> do?",
        a: ["It changes the Card class so that every card has rank 5", "It makes a new object, runs the constructor with this set to that object, and hands the object back", "It copies the last card that was made", "It only declares a type; nothing exists when the code runs"], c: 1,
        why: "new presses one fresh copy out of the mould. The constructor fills in that copy, and the class itself is unchanged." },
      { q: "A deck keeps its cards in <code>private cards: Card[]</code>. Code outside the class writes <code>deck.cards = []</code>. What happens?",
        a: ["The deck is emptied without any warning", "JavaScript checks the word private and throws an error when the line runs", "The line is silently skipped", "TypeScript marks the line as an error while you write it"], c: 3,
        why: "private is checked by TypeScript before the code runs. It is erased from the JavaScript, so its job is to stop the mistake in the editor." },
      { q: "Which of these should be a static member?",
        a: ["The number of cards in a full deck, which is the same for every deck", "The rank of one card", "The cards left in one particular deck", "The score of one player"], c: 0,
        why: "Static is for things that belong to the mould, not to one copy. Every deck has the same full size; each card has its own rank." }
    ]
  },
  {
    id: 'ts-extends', lv: 2, mins: 15,
    title: 'extends, super, override and abstract',
    zh: 'extends 是照一個模子再做一個模子。子類別的 constructor 要先呼叫 super(...)；override 可以蓋掉父類別的方法，也可以用 super.method() 先跑父類別的再加工。abstract 是「留空格給子類別填的表格」。繼承別疊太深，換成組合。',
    body: `
<p>In the last lesson one mould made many copies. This lesson makes a mould from another mould. It is the idea behind every framework that says &ldquo;extend our base class and fill in these methods&rdquo;, including Cocos Creator.</p>
<h3>Step 1: a mould built from another mould</h3>
<p>Higher or Lower can be played by different kinds of player: a person pressing buttons, a computer player that guesses at random, a smarter one that plays the odds. They have a lot in common: a name, a score, a way to add a point. They differ in one thing: how they choose a guess.</p>
<p>Writing the name and score into three classes would be copying. Write them once, in a class for players in general, and build the others from it with <code>extends</code>:</p>
<pre><code>class Player {
  score = 0;
  constructor(public name: string) {}  // declares and sets name
  addPoint(): void {
    this.score += 1;
  }
  describe(): string {
    return this.name + ': ' + this.score;
  }
}

class SmartPlayer extends Player {
  guess(current: number): 'higher' | 'lower' {
    return current &lt;= 7 ? 'higher' : 'lower';
  }
}

const mia = new SmartPlayer('Mia');
mia.addPoint();               // written in Player, works here
console.log(mia.describe());  // Mia: 1</code></pre>
<p><code>Player</code> is the <b>base class</b>, or parent. <code>SmartPlayer</code> is a <b>subclass</b>, or child. The child gets everything the parent has and adds its own. This is <b>inheritance</b>, and the test for it is the phrase &ldquo;is a&rdquo;: a smart player <em>is a</em> player.</p>
<div class="tiers"><b>Base</b><div><span class="box">Player<small>name, score, addPoint(), describe()</small></span></div><b>Children</b><div><span class="box hot">SmartPlayer<small>+ guess(): plays the odds</small></span><span class="box hot">RandomPlayer<small>+ guess(): flips a coin</small></span><span class="box hot">LoudPlayer<small>changes describe()</small></span></div></div>
<h3>Step 2: a child constructor calls super(...) first</h3>
<p>Sometimes a child needs extra data of its own. Then it writes its own constructor, and the first thing that constructor must do is call <code>super(...)</code>, which runs the parent&rsquo;s constructor.</p>
<pre><code>class TimedPlayer extends Player {
  secondsPerGuess: number;

  constructor(name: string, seconds: number) {
    super(name);                    // build the Player part first
    this.secondsPerGuess = seconds; // then the extra part
  }
}</code></pre>
<p>Think of a house with an extension. The extension is fixed to the main house, so the main house has to stand first. Until <code>super(...)</code> has run, the Player part of the object does not exist, so TypeScript will not let you touch <code>this</code> before it, and JavaScript would throw an error if you did. A child with no constructor of its own gets one automatically, which hands all its arguments to the parent. That is why <code>SmartPlayer</code> above needed none.</p>
<h3>Step 3: override a method, or extend it with super.method()</h3>
<p>A child can replace a method it inherited by writing one with the same name. That is an <b>override</b>. Inside it, <code>super.describe()</code> calls the parent&rsquo;s version, so the child can keep what the parent does and add to it:</p>
<pre><code>class LoudPlayer extends Player {
  override describe(): string {
    return super.describe().toUpperCase() + '!';
  }
}

const sam = new LoudPlayer('Sam');
console.log(sam.describe()); // SAM: 0!</code></pre>
<p>The word <code>override</code> is optional by default, but it is worth writing. It tells TypeScript &ldquo;I mean to replace a parent method&rdquo;, so if the parent&rsquo;s method is renamed, or you mistype the name, you get an error and not a silent new method. The setting <code>noImplicitOverride</code> makes the word required.</p>
<h3>Which method runs?</h3>
<p>When you call a method, JavaScript looks for it in the object&rsquo;s own class first, then in the parent, then in the parent&rsquo;s parent, and runs the first one it finds.</p>
<div class="flow"><span class="box">sam.describe()</span><span class="arr">&rarr;</span><span class="box hot">LoudPlayer<small>has describe: runs it</small></span><span class="arr">super.describe() &rarr;</span><span class="box">Player<small>its describe runs inside</small></span></div>
<div class="flow"><span class="box">sam.addPoint()</span><span class="arr">&rarr;</span><span class="box bad">LoudPlayer<small>no addPoint here</small></span><span class="arr">&rarr;</span><span class="box hot">Player<small>found: runs it</small></span></div>
<p>The search starts from what the object really is, not from the type of the variable. A variable typed <code>Player</code> that holds a <code>LoudPlayer</code> still runs the loud version. That is what lets one piece of code work with every kind of player.</p>
<h3>Step 4: abstract: a form with blanks the child must fill in</h3>
<p>Every player must be able to guess, but a player in general has no way of guessing. Only the particular kinds do. Mark the class <code>abstract</code> and leave the method as a blank:</p>
<pre><code>abstract class Player {
  score = 0;
  constructor(public name: string) {}
  abstract guess(current: number): 'higher' | 'lower';  // the blank

  play(current: number, next: number): void {            // already filled in
    const g = this.guess(current);
    const right = g === 'higher' ? next &gt; current : next &lt; current;
    if (right) this.score += 1;
  }
}

class RandomPlayer extends Player {
  override guess(): 'higher' | 'lower' {
    return Math.random() &lt; 0.5 ? 'higher' : 'lower';
  }
}

const bot = new RandomPlayer('Bot');
bot.play(5, 9);</code></pre>
<p>An <b>abstract class</b> is a form with blanks, and <code>guess</code> is an <b>abstract method</b>: a blank with a label but no answer. You cannot hand in the form itself, so <code>new Player('x')</code> is an error. A child that leaves a blank empty is an error too. A child may ignore parameters it does not need, which is why <code>RandomPlayer</code>&rsquo;s <code>guess</code> takes none. In return, the parent can already use the blank: <code>play</code> calls <code>this.guess</code> without knowing which kind of player it is, and each child&rsquo;s own <code>guess</code> runs.</p>
<h3>The base-class pattern in frameworks and game engines</h3>
<p>Look at <code>play</code> again. The parent decides <em>when</em> to guess and what happens afterwards. The child decides only <em>how</em>. Frameworks are built the same way. They give you a base class whose methods do nothing yet. You extend it and fill in the ones you need, and the framework calls them at the right moment. You never call them yourself. People sum this up as &ldquo;don&rsquo;t call us, we&rsquo;ll call you&rdquo;.</p>
<div class="flow"><span class="box">The engine adds your object</span><span class="arr">&rarr;</span><span class="box hot">start()<small>once, before the first frame</small></span><span class="arr">&rarr;</span><span class="box hot">update(dt)<small>every frame</small></span><span class="arr">&rarr;</span><span class="box">onDestroy()<small>once, when it is removed</small></span></div>
<p>That is what a Cocos Creator script looks like: <code>class Hud extends Component</code>, with <code>start()</code> and <code>update(dt)</code> filled in. The Cocos track covers which of these methods exist and in what order they run.</p>
<h3>Vue comparison</h3>
<p>Vue lifecycle hooks are the same idea: you write <code>onMounted(() =&gt; ...)</code> and Vue calls it at the right time. Only the way you hand it over differs. Vue asks you to register a function. A class-based engine asks you to override a method.</p>
<table>
<tr><th>Vue 3</th><th>Close to, in a class-based engine</th></tr>
<tr><td><code>onMounted(() =&gt; ...)</code></td><td><code>start() { ... }</code></td></tr>
<tr><td><code>onUnmounted(() =&gt; ...)</code></td><td><code>onDestroy() { ... }</code></td></tr>
<tr><td>A composable shared by several components</td><td>A base class shared by several children, or a second component on the same object</td></tr>
</table>
<div class="warn"><b>Keep inheritance chains short.</b> A chain like Player &rarr; BotPlayer &rarr; SmartBot &rarr; TournamentSmartBot means that to know what one method does, you open four files, and a change in the base class can break every child below it. One level, such as extending a framework&rsquo;s base class, is normal. Past two levels, stop and consider composition.</div>
<h3>The alternative: composition</h3>
<p><b>Composition</b> means &ldquo;has a&rdquo; in place of &ldquo;is a&rdquo;. In place of a new subclass for every way of guessing, give one Player class a guessing part that you plug in:</p>
<pre><code>type Brain = (current: number) =&gt; 'higher' | 'lower';

const coinFlip: Brain = () =&gt; (Math.random() &lt; 0.5 ? 'higher' : 'lower');
const odds: Brain = (current) =&gt; (current &lt;= 7 ? 'higher' : 'lower');

class Player {
  score = 0;
  constructor(public name: string, private brain: Brain) {}

  guess(current: number): 'higher' | 'lower' {
    return this.brain(current);
  }
}

const mia = new Player('Mia', odds);
const bot = new Player('Bot', coinFlip);</code></pre>
<p>Now a new way of playing is a new function, not a new class, and you could even swap a player&rsquo;s brain in the middle of a game. Cocos Creator itself works this way: a node in the scene <em>has</em> components, such as a sprite, a button and your own script, in place of being one deep chain of classes.</p>
<h3>Going deeper: protected, and a constructor trap</h3>
<p><code>protected</code> is the door between parent and child. A <code>protected score</code> can be changed by <code>Player</code> and by every subclass, but not by code outside. Use it when the children really need the field. When they do not, prefer <code>private</code> plus a method.</p>
<p>The trap: do not call a method that a child can override from the parent&rsquo;s constructor. The parent&rsquo;s constructor runs inside <code>super(...)</code>, before the child&rsquo;s own fields have been given their values. If the child&rsquo;s version of the method reads one of those fields, it sees <code>&#117;ndefined</code>.</p>`,
    tryNote: 'Paste each snippet into the TypeScript Playground (typescriptlang.org/play). Press Run for the ones that log, and hover over red underlines to read the errors.',
    try: [
      ['class A { hello() { return "A"; } }\nclass B extends A {\n  override hello() { return super.hello() + "B"; }\n}\nconsole.log(new B().hello());', 'The child runs the parent version first, then adds to it. The log shows AB.'],
      ['class A { constructor(public n: string) {} }\nclass B extends A {\n  constructor() { this.n = "x"; super("y"); }\n}', 'An error on <code>this</code>: super must be called before this is touched. Swap the two statements and it goes away.'],
      ['abstract class Player {\n  abstract guess(): string;\n}\nnew Player();\nclass Bot extends Player {}', 'Two errors: you cannot make an instance of an abstract class, and Bot leaves the blank <code>guess</code> empty.'],
      ['class A { hi() { return 1; } }\nclass B extends A {\n  override hey() { return 2; }\n}', 'A typo caught: <code>override</code> on a method the parent does not have is an error.']
    ],
    own: `Find a base class you extend, at work or in a tutorial project: a Cocos Creator component, or a class from a library. List the methods you override, and for each one write down who calls it and when. Then look for a chain of three or more <code>extends</code> in your own code. If you find one, sketch on paper how it would look with composition: one class that has a part plugged in.`,
    terms: [['inheritance', '繼承'], ['base class', '基底類別'], ['subclass', '子類別'], ['override', '覆寫'], ['abstract class', '抽象類別'], ['abstract method', '抽象方法'], ['composition', '組合']],
    quiz: [
      { q: "Why must a child constructor call <code>super(...)</code> before it uses <code>this</code>?",
        a: ["Because super makes the code run faster", "It does not have to; it is only a style rule", "The parent part of the object must be built first, so this is not ready until super has run", "Because super deletes the parent&rsquo;s fields"], c: 2,
        why: "Like a house before its extension: the parent&rsquo;s constructor sets up its part, and only then can the child add its own." },
      { q: "A variable typed <code>Player</code> holds a <code>LoudPlayer</code>. You call <code>describe()</code>. Where does the search for the method start?",
        a: ["At Player, because that is the type of the variable", "At LoudPlayer, because the search starts from the class the object really belongs to", "At whichever class was written last in the file", "Nowhere; calling it is an error"], c: 1,
        why: "The object decides. LoudPlayer has its own describe, so that runs, and it may call super.describe() inside." },
      { q: "What is an abstract method?",
        a: ["A method that runs faster than a normal one", "A method that only code outside the class may call", "A method that is private to the parent", "A blank in the parent class that every child you can create must fill in"], c: 3,
        why: "The parent names the method and its type but gives no body. You cannot create a Player itself; each child supplies its own guess." }
    ]
  },
  {
    id: 'ts-interface', lv: 2, mins: 14,
    title: 'interface, type alias and implements',
    zh: 'interface 只描述形狀，不做出任何東西，編譯完就消失。TypeScript 看形狀不看名字：形狀對就能用。物件形狀用 interface、聯集等其他東西用 type。class 寫 implements 是承諾「我符合這份合約」。',
    body: `
<p>A class does two jobs at once: it describes a shape, and it makes objects of that shape. Very often you need only the first job. This lesson is about describing shapes, and it is the part of TypeScript you will use most in everyday front-end code.</p>
<h3>Step 1: describing a shape without making anything</h3>
<p>The server sends back a list of high scores. You did not make those objects and you will not add methods to them. You only want TypeScript to know what is inside. An <b>interface</b> is a description of a shape and nothing more. Think of the outline of a card drawn on the table: it shows where a card goes, but it is not a card.</p>
<pre><code>interface HighScore {
  name: string;
  points: number;
}

const best: HighScore = { name: 'Mia', points: 12 };
const typo: HighScore = { name: 'Sam', pionts: 9 };   // error</code></pre>
<p>An interface exists only while you write code. After compiling it is gone completely: no code, no object, nothing to <code>new</code>. It costs nothing at runtime and protects you while you type.</p>
<h3>Step 2: if it has the right shape, it fits</h3>
<p>TypeScript checks shapes, not names. This is called <b>structural typing</b>. A value fits an interface if it has the members the interface asks for, with the right types, whatever it is called and wherever it came from.</p>
<pre><code>interface HasRank {
  rank: number;
}

function isHigher(a: HasRank, b: HasRank): boolean {
  return a.rank &gt; b.rank;
}

class Card {
  constructor(public rank: number, public suit: string) {}
}

const fromServer = { rank: 3, suit: 'clubs', faceUp: true };
isHigher(new Card(9, 'hearts'), fromServer);   // fine: both have a rank</code></pre>
<div class="tiers"><b>The shape</b><div><span class="box hot">HasRank<small>needs rank: number</small></span></div><b>Fits</b><div><span class="box">new Card(9, 'hearts')<small>has a rank, and more</small></span><span class="box">fromServer<small>a plain object with a rank</small></span></div><b>Does not fit</b><div><span class="box bad">{ value: 3 }<small>no rank</small></span><span class="box bad">{ rank: '3' }<small>rank is text, not a number</small></span></div></div>
<p>Notice that <code>Card</code> never mentions <code>HasRank</code>. It fits anyway. Extra members are fine. Missing members, or members of the wrong type, are not. People call this duck typing: if it walks like a duck and quacks like a duck, it is a duck. Languages such as Java and C# work the other way, by name: a class fits only if it says that it does.</p>
<h3>Step 3: interface or type alias?</h3>
<p>A <b>type alias</b> gives a name to any type, with the word <code>type</code>:</p>
<pre><code>type Guess = 'higher' | 'lower';                       // a union
type Brain = (current: number) =&gt; Guess;               // a function
type HighScoreToo = { name: string; points: number };  // an object shape</code></pre>
<p>For an object shape the two are nearly interchangeable. The differences:</p>
<table>
<tr><th>Can it</th><th><code>interface</code></th><th><code>type</code></th></tr>
<tr><td>Describe an object shape</td><td>Yes</td><td>Yes</td></tr>
<tr><td>Name a union, or a simple type like <code>string</code></td><td>No</td><td>Yes</td></tr>
<tr><td>Build on another shape</td><td>With <code>extends</code></td><td>With <code>&amp;</code></td></tr>
<tr><td>Be declared twice with the same name</td><td>Yes: the two merge</td><td>No: it is an error</td></tr>
</table>
<p>A common rule, and the one the TypeScript handbook suggests: use <code>interface</code> for object shapes until you need something only <code>type</code> can do, such as a union. Many teams simply pick one style for objects and keep to it. Either is fine. Mixing them at random is the only real mistake.</p>
<h3>Step 4: optional and readonly members</h3>
<pre><code>interface PlayerInfo {
  readonly id: string;     // set once, never changed
  name: string;
  avatarUrl?: string;      // may be missing
}

const p: PlayerInfo = { id: 'p1', name: 'Mia' };   // fine without avatarUrl
p.name = 'Mia Chen';                                // fine
p.id = 'p2';                                        // error: read-only
const url = p.avatarUrl;                            // string | &#117;ndefined</code></pre>
<p>A <code>?</code> after a name makes it an <b>optional property</b>: it may be left out. When you read it you get <code>string | &#117;ndefined</code>, so TypeScript makes you check before you use it. <code>readonly</code> means the value can be set when the object is made but not changed later. Both are checks before the code runs, like <code>private</code>.</p>
<h3>Step 5: implements: a contract a class promises to keep</h3>
<p>An interface can also list methods. A class can then promise to have them, by writing <code>implements</code>. The interface is a <b>contract</b>, and TypeScript holds the class to it.</p>
<pre><code>interface CardSource {
  draw(): number | &#117;ndefined;
  remaining(): number;
}

class Deck implements CardSource {
  private cards = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

  draw(): number | &#117;ndefined {
    return this.cards.pop();
  }

  remaining(): number {
    return this.cards.length;
  }
}</code></pre>
<p>Leave out <code>remaining</code> and the error appears on the class line: the class &ldquo;incorrectly implements&rdquo; the interface. Now the rest of the game can be written against <code>CardSource</code> and not against <code>Deck</code>. A test can pass in a fake source that deals cards in a fixed order, and the game cannot tell the difference.</p>
<div class="flow"><span class="box">Game<small>only knows CardSource</small></span><span class="arr">&rarr;</span><span class="box hot">CardSource<small>draw(), remaining()</small></span><span class="arr">&larr; kept by</span><span class="box">Deck<small>the real one</small></span><span class="box">FixedDeck<small>for tests</small></span></div>
<table>
<tr><th></th><th><code>extends</code> a class</th><th><code>implements</code> an interface</th></tr>
<tr><td>What the class gets</td><td>The parent&rsquo;s code: fields and methods</td><td>Nothing: only a check</td></tr>
<tr><td>How many</td><td>One parent</td><td>As many interfaces as you like</td></tr>
<tr><td>It means</td><td>&ldquo;is a kind of&rdquo;</td><td>&ldquo;promises to be able to&rdquo;</td></tr>
</table>
<h3>Step 6: interfaces can build on interfaces</h3>
<pre><code>interface Named { name: string; }
interface Scored { score: number; }

interface RankedPlayer extends Named, Scored {
  place: number;
}

const leader: RankedPlayer = { name: 'Mia', score: 12, place: 1 };</code></pre>
<p>An interface can extend several others at once. A value of the new shape needs everything from all of them.</p>
<h3>Vue comparison: typing defineProps</h3>
<p>You have used interfaces in Vue already. In a <code>&lt;script setup lang="ts"&gt;</code> block, the type you hand to <code>defineProps</code> is an interface or a type alias, and Vue turns it into its props definition when it compiles the component:</p>
<pre><code>&lt;script setup lang="ts"&gt;
interface Props {
  rank: number;
  suit: string;
  faceUp?: boolean;     // optional prop
}

const props = withDefaults(defineProps&lt;Props&gt;(), { faceUp: false });
const emit = defineEmits&lt;{ guess: [choice: 'higher' | 'lower'] }&gt;();
&lt;/script&gt;</code></pre>
<p>A <code>?</code> becomes a prop that is not required, and <code>withDefaults</code> gives it a value when it is missing. The emit line uses the shorter syntax from Vue 3.3 onwards. With Vue&rsquo;s official editor extension, the parent&rsquo;s template is checked against the interface too: pass text to <code>rank</code> on <code>&lt;PlayingCard&gt;</code> and the editor marks it, because the interface asks for a number.</p>
<h3>Going deeper: four things worth knowing</h3>
<ul>
<li><b>Interfaces vanish at runtime.</b> You cannot write <code>x instanceof HasRank</code>. And data from a server is not checked against an interface just because you wrote its name next to it. If the server sends something else, TypeScript cannot know. For outside data, check at runtime as well.</li>
<li><b>A fresh object literal is checked more strictly.</b> <code>const s: HasRank = { rank: 3, colour: 'red' }</code> is an error, because a property the type does not know, written straight into a literal, is most likely a typo. The same object passed in through a variable is fine, as in Step 2.</li>
<li><b>implements adds nothing to the class.</b> It does not give the class&rsquo;s methods their parameter types; you still write those in the class. It only checks that the class fits.</li>
<li><b>Declaration merging.</b> Two <code>interface</code> declarations with the same name merge into one. Libraries use this so that you can add fields to their types, for example adding your own property to the global <code>Window</code> interface.</li>
</ul>`,
    tryNote: 'Paste each snippet into the TypeScript Playground (typescriptlang.org/play). Hover over red underlines to read the errors, and press Run for the one that logs.',
    try: [
      ['interface HasRank { rank: number }\nconst card = { rank: 9, suit: "hearts" };\nconst r: HasRank = card;\nconsole.log(r.rank);', 'Fits: the shape matches, and the extra <code>suit</code> does no harm when it comes in through a variable.'],
      ['interface HasRank { rank: number }\nconst r: HasRank = { rank: 9, suit: "hearts" };', 'The same object written straight into the literal is an error: TypeScript suspects <code>suit</code> is a typo.'],
      ['interface CardSource { draw(): number; }\nclass Deck implements CardSource {}', 'The contract is broken: <code>draw</code> is missing. Add <code>draw() { return 1; }</code> inside the class and the error goes.'],
      ['interface A { x: number }\ninterface A { y: number }\nconst a: A = { x: 1 };', 'The two declarations merged, so <code>y</code> is now required as well.']
    ],
    own: `Pick one answer your front end receives from a server and write an interface for it. Mark the fields that can be missing with <code>?</code> and the IDs with <code>readonly</code>. Then find one Vue component that still declares its props with the runtime <code>props: { ... }</code> object, and change it to <code>defineProps&lt;Props&gt;()</code> with <code>withDefaults</code>. Check that the parent template still passes the type check.`,
    terms: [['interface', '介面'], ['type alias', '型別別名'], ['structural typing', '結構化型別'], ['optional property', '選擇性屬性'], ['implements', '實作'], ['contract', '合約'], ['declaration merging', '宣告合併']],
    quiz: [
      { q: "<code>Card</code> never mentions <code>HasRank</code>, but it has a field <code>rank: number</code>. Can you pass a Card where a HasRank is expected?",
        a: ["No: the class must write implements HasRank first", "Only if Card has no other fields", "Yes: TypeScript checks the shape, not the name", "Only when the code is running"], c: 2,
        why: "This is structural typing. Card has everything HasRank asks for, so it fits. Extra fields do no harm." },
      { q: "Which of these can be written with <code>type</code> but not with <code>interface</code>?",
        a: ["<code>{ name: string; points: number }</code>", "An object with a readonly id", "An object with an optional field", "<code>'higher' | 'lower'</code>"], c: 3,
        why: "An interface always describes an object shape. A union of values needs a type alias." },
      { q: "What does <code>class Deck implements CardSource</code> add to Deck?",
        a: ["Nothing that runs: it is a check that Deck has everything CardSource lists", "It copies the code of CardSource&rsquo;s methods into Deck", "It makes Deck an abstract class", "It lets Deck extend a second class"], c: 0,
        why: "An interface has no code to give. implements is a promise, and TypeScript checks that the class keeps it." }
    ]
  },
  {
    id: 'ts-generics', lv: 2, mins: 15,
    title: 'Generics',
    zh: '泛型就是「標籤先空著，用的時候才填」的盒子。你早就在用：Array<number>、Promise<string>、Record<K, V>、Vue 的 ref<number>()。自己寫 first<T>()、用 extends 限制 T 能填什麼，讀一長串尖括號就從最裡面往外讀。',
    body: `
<p>This lesson explains the angle brackets: the <code>&lt;T&gt;</code> you see in library code and the <code>&lt;number&gt;</code> you have been typing after <code>ref</code> in Vue. The idea behind them is small and very useful.</p>
<h3>Step 1: the same function, wanted for different types</h3>
<p>Here is a small helper: give it a list, and it gives back the first item. For a list of numbers it is easy to type:</p>
<pre><code>function firstNumber(items: number[]): number | &#117;ndefined {
  return items[0];
}</code></pre>
<p>Now you want the same thing for a list of names, then for a list of cards. Writing three copies is silly. Using <code>any</code> works, but it throws the type away: what comes out is <code>any</code>, and TypeScript stops helping you.</p>
<pre><code>function firstAny(items: any[]): any {
  return items[0];
}

const who = firstAny(['Mia', 'Sam']);
who.toFixed(2);   // no warning, but it crashes: text has no toFixed</code></pre>
<h3>Step 2: leave a blank, fill it in later</h3>
<p>Picture a storage box with a blank label. When you take it off the shelf, you write &ldquo;cards&rdquo; on the label. From then on only cards go in, and anything you take out is known to be a card. <b>Generics</b> are that box: a type with a blank in it, filled in when it is used.</p>
<pre><code>function first&lt;T&gt;(items: T[]): T | &#117;ndefined {
  return items[0];
}

const n = first([3, 7, 9]);        // T is number: n is number | &#117;ndefined
const s = first(['Mia', 'Sam']);   // T is string: s is string | &#117;ndefined
s?.toFixed(2);                     // error: toFixed does not exist on string</code></pre>
<p>The <code>&lt;T&gt;</code> after the name declares the blank. <code>T</code> is a <b>type parameter</b>: a name that stands for a type, the way a function parameter stands for a value. You write <code>T</code> wherever that type belongs: the list is a list of <code>T</code>, and what comes back is a <code>T</code> or nothing.</p>
<p>When you call the function, TypeScript looks at what you passed and fills in <code>T</code> for you. This is <b>type inference</b>. You can also fill it in yourself, as in <code>first&lt;number&gt;([3, 7, 9])</code>. The type you write between the brackets is a <b>type argument</b>.</p>
<div class="flow"><span class="box">first&lt;T&gt;<small>a blank label</small></span><span class="arr">called with [3, 7, 9] &rarr;</span><span class="box hot">T = number<small>the label is filled in</small></span><span class="arr">&rarr;</span><span class="box">returns number | &#117;ndefined<small>known exactly</small></span></div>
<h3>Step 3: you have used them already</h3>
<table>
<tr><th>You wrote</th><th>The blank is filled with</th><th>It means</th></tr>
<tr><td><code>Array&lt;number&gt;</code>, the same as <code>number[]</code></td><td><code>number</code></td><td>A list of numbers</td></tr>
<tr><td><code>Promise&lt;string&gt;</code></td><td><code>string</code></td><td>A string that will arrive later</td></tr>
<tr><td><code>Record&lt;string, number&gt;</code></td><td><code>string</code> and <code>number</code></td><td>An object whose keys are strings and whose values are numbers</td></tr>
<tr><td><code>Map&lt;string, Card&gt;</code></td><td><code>string</code> and <code>Card</code></td><td>A lookup from a name to a card</td></tr>
<tr><td><code>ref&lt;number&gt;(0)</code> in Vue</td><td><code>number</code></td><td>A reactive box that holds a number, typed <code>Ref&lt;number&gt;</code></td></tr>
</table>
<p>So you have been filling in blanks for a long time. The rest of this lesson is about making your own.</p>
<h3>Step 4: generic classes and interfaces</h3>
<p>A class can have a blank too. In Higher or Lower the cards already played go on a discard pile. A pile of what? Cards today, but the same pile would work for anything:</p>
<pre><code>class Pile&lt;T&gt; {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  top(): T | &#117;ndefined {
    return this.items[this.items.length - 1];
  }
}

const discard = new Pile&lt;number&gt;();   // a pile of ranks
discard.push(12);
discard.push('queen');                  // error: not a number</code></pre>
<p>Interfaces take blanks the same way. A very common one in front-end code wraps every answer from a server:</p>
<pre><code>interface ApiResult&lt;T&gt; {
  ok: boolean;
  data: T;
  error?: string;
}

type ScoresResult = ApiResult&lt;{ name: string; points: number }[]&gt;;

async function loadScores(): Promise&lt;ScoresResult&gt; {
  const res = await fetch('/api/scores');
  return res.json();
}</code></pre>
<p>One interface, written once, serves every endpoint: <code>ApiResult&lt;PlayerInfo&gt;</code>, <code>ApiResult&lt;Card[]&gt;</code>, and so on.</p>
<h3>Step 5: constraints limit what the blank may hold</h3>
<p>Sometimes the function needs to know a little about <code>T</code>. To find the highest card it must read <code>rank</code>, but a bare <code>T</code> could be anything, even a number, so TypeScript refuses: &ldquo;Property 'rank' does not exist on type 'T'&rdquo;. A <b>constraint</b> says what <code>T</code> must at least have:</p>
<pre><code>function highest&lt;T extends { rank: number }&gt;(items: T[]): T | &#117;ndefined {
  let best: T | &#117;ndefined;
  for (const item of items) {
    if (best === &#117;ndefined || item.rank &gt; best.rank) best = item;
  }
  return best;
}

const winner = highest([{ rank: 5, suit: 'hearts' }, { rank: 12, suit: 'spades' }]);
console.log(winner?.suit);   // spades, and TypeScript knows it has a suit</code></pre>
<p>Read <code>T extends { rank: number }</code> as &ldquo;T can be any type, as long as it has a numeric rank&rdquo;. Here <code>extends</code> means &ldquo;fits the shape of&rdquo;, the structural check from the last lesson, not class inheritance. And because <code>T</code> is still the full type you passed in, the result keeps its <code>suit</code>. Had you written <code>items: { rank: number }[]</code> without a generic, the result would only be known to have a rank.</p>
<h3>Step 6: reading a long line of angle brackets</h3>
<p>Sooner or later you meet a type like this one:</p>
<pre><code>type Hands = Promise&lt;ApiResult&lt;Record&lt;string, Card[]&gt;&gt;&gt;;</code></pre>
<p>Do not read it from the left. Find the innermost part, say in words what it is, then step out one layer at a time, each time wrapping the words you already have:</p>
<div class="flow"><span class="box">Card[]<small>a list of cards</small></span><span class="arr">&rarr;</span><span class="box">Record&lt;string, &hellip;&gt;<small>one list per player name</small></span><span class="arr">&rarr;</span><span class="box">ApiResult&lt;&hellip;&gt;<small>in the usual server wrapper</small></span><span class="arr">&rarr;</span><span class="box hot">Promise&lt;&hellip;&gt;<small>which will arrive later</small></span></div>
<p>Put together: &ldquo;an answer that will arrive later, in the usual wrapper, holding a list of cards for each player name&rdquo;. The <code>&gt;&gt;&gt;</code> at the end just closes the layers in reverse order. If a type like this is used in more than one place, give it a name with <code>type</code>, as above, so that nobody has to read it twice.</p>
<h3>Vue comparison</h3>
<p><code>ref&lt;number&gt;()</code> with no starting value gives <code>Ref&lt;number | &#117;ndefined&gt;</code>, because the box starts empty. <code>defineProps&lt;Props&gt;()</code> from the last lesson is a generic call too: you fill its blank with your props interface. And Vue 3.3 added generic components: <code>&lt;script setup lang="ts" generic="T"&gt;</code> lets one list component take items of any type and still type-check the slot that shows each item.</p>
<h3>Going deeper</h3>
<ul>
<li><b>Several blanks, linked.</b> <code>function pick&lt;T, K extends keyof T&gt;(obj: T, key: K): T[K]</code> takes an object and one of its own keys, and returns the type of that key&rsquo;s value. <code>keyof T</code> is the union of T&rsquo;s key names.</li>
<li><b>Utility types.</b> TypeScript ships ready-made generics: <code>Partial&lt;T&gt;</code> makes every field optional, and there are <code>Readonly&lt;T&gt;</code>, <code>Pick&lt;T, K&gt;</code>, <code>Omit&lt;T, K&gt;</code> and <code>ReturnType&lt;F&gt;</code>. A form that edits some fields of a player can take a <code>Partial&lt;PlayerInfo&gt;</code>.</li>
<li><b>Defaults.</b> <code>interface ApiResult&lt;T = unknown&gt;</code> fills the blank with <code>unknown</code> when nobody says otherwise.</li>
<li><b>Generics vanish at runtime.</b> You cannot write <code>new T()</code>, because no T is left when the code runs. Pass the class itself instead. Cocos Creator does exactly this: <code>node.getComponent(Sprite)</code> takes the class and gives back a <code>Sprite | null</code>.</li>
<li><b>Do not overdo it.</b> If <code>T</code> appears only once in a function&rsquo;s signature, it links nothing, and a plain type would do. A good generic connects an input to an output.</li>
</ul>`,
    tryNote: 'Paste each snippet into the TypeScript Playground (typescriptlang.org/play). Hover over names to see the types TypeScript worked out, and over red underlines to read the errors.',
    try: [
      ['function first<T>(items: T[]): T | undefined {\n  return items[0];\n}\nconst s = first(["Mia", "Sam"]);\nconsole.log(s);', 'Hover over <code>s</code>: TypeScript filled in T as string, so s is <code>string | &#117;ndefined</code>.'],
      ['function highest<T>(items: T[]) {\n  return items[0].rank;\n}', 'An error: a bare T might not have a rank. Change <code>&lt;T&gt;</code> to <code>&lt;T extends { rank: number }&gt;</code> and it goes.'],
      ['class Pile<T> {\n  items: T[] = [];\n  push(item: T) { this.items.push(item); }\n}\nconst p = new Pile<number>();\np.push("queen");', 'The label says number, so text is refused.'],
      ['type Hands = Promise<Record<string, number[]>>;\nlet h: Hands;\nh = Promise.resolve({ mia: [5, 12] });', 'It fits. Change 12 to &quot;Q&quot; and read the error, then read the type from the inside out.']
    ],
    own: `Find a helper in your own code that takes or returns <code>any</code>, or one that has been copied for two different types. Rewrite it as one generic function, with a constraint if it reads a field. Then find the longest type in your project and write it out in words, from the inside out. If it appears more than once, give it a name with <code>type</code>.`,
    terms: [['generics', '泛型'], ['type parameter', '型別參數'], ['type argument', '型別引數'], ['type inference', '型別推斷'], ['constraint', '條件約束'], ['utility type', '工具型別']],
    quiz: [
      { q: "In <code>function first&lt;T&gt;(items: T[]): T | &#117;ndefined</code>, what is T?",
        a: ["A special type that means any", "A type parameter: a blank that is filled with a real type each time the function is used", "A variable that holds the first item", "The name of a class that must be imported"], c: 1,
        why: "T stands for a type, the way items stands for a value. Call it with numbers and T is number." },
      { q: "Why can <code>highest&lt;T&gt;(items: T[])</code> not read <code>item.rank</code> until you add <code>extends { rank: number }</code>?",
        a: ["Generic functions can never read fields", "Because rank is private", "A bare T could be any type, so TypeScript cannot promise that it has a rank", "Because the list might be empty"], c: 2,
        why: "The constraint narrows what T may be, and in return TypeScript lets you use what every allowed T is sure to have." },
      { q: "Read <code>Promise&lt;Record&lt;string, number[]&gt;&gt;</code> from the inside out. What is it?",
        a: ["A list of promises", "A string that will arrive later", "An object that holds one promise for each key", "Something that will arrive later: an object whose string keys each hold a list of numbers"], c: 3,
        why: "number[] is a list of numbers. Record wraps that into an object keyed by strings. Promise says the whole object arrives later." }
    ]
  }
  ]
});
