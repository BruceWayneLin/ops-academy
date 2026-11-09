M({
  id: 'cc3', n: 3, track: 'cocos',
  title: 'Architecture of a real game',
  zh: '真正的遊戲怎麼組織：資料和畫面分開、用狀態機管一局、跟伺服器對話、建置上線、除錯，最後從空專案自己做出一款「猜高低」。',
  time: '2 to 3 weeks',
  blurb: 'How to organise a game so that it keeps working as it grows: Model, View and Controller, a state machine for each round, talking to a server, shipping a build, and finding bugs. You finish by building Higher or Lower from an empty project.',
  lessons: [
  {
    id: 'cc-mvc', lv: 2, mins: 16,
    title: 'Model, View, Controller: keeping rules out of buttons',
    zh: '把遊戲拆成三塊：Model 只管資料和規則，完全不碰節點；View 只負責畫畫面、回報點擊；Controller 把兩邊接起來。資料只往一個方向流：點擊 → Controller → Model 改變 → 事件 → View 重畫。',
    body: `
<p>Every game starts small. You add a Higher button, give it a script, and in its click handler you read the card on screen, pick a new one, compare them and update the score label. It works. Then the game grows, and that one handler becomes the place where everything goes wrong.</p>
<p>This lesson is about splitting a game into three parts so that it keeps working as it grows. The split is called <b>Model, View, Controller</b>, or MVC. The example in this whole module is <b>Higher or Lower</b>: one card is face up, the player guesses whether the next card will be higher or lower, and each right guess scores a point. A wrong guess ends the game, and an equal card counts as wrong.</p>
<h3>Why rules inside buttons fall apart</h3>
<p>Here is the first version most people write. It sits on the Higher button.</p>
<pre><code>// HigherButton.ts: the rule lives inside a button (avoid this)
onClick() {
  const now = Number(this.cardLabel.string);
  const next = Math.ceil(Math.random() * 13);
  if (next &gt; now) {
    this.scoreLabel.string = String(Number(this.scoreLabel.string) + 1);
  }
  this.cardLabel.string = String(next);
}
</code></pre>
<p>For one day, nothing here is wrong. Now look at what the next few weeks bring:</p>
<table>
<tr><th>New requirement</th><th>What happens to this code</th></tr>
<tr><td>A Lower button</td><td>The same code is copied into a second script with one sign changed. Two copies of the rule start to drift apart.</td></tr>
<tr><td>A flip animation</td><td>The label must not change until the card has turned, so the click handler starts waiting for animations.</td></tr>
<tr><td>A 10-second timer</td><td>The timer needs the same rule, so it reaches into the button script, or copies the rule a third time.</td></tr>
<tr><td>A server picks the next card</td><td>The rule has to leave the button anyway, and nothing else is ready to receive it.</td></tr>
<tr><td>A results screen</td><td>The score exists only as the text of a label, so the results screen reads it back out of another node.</td></tr>
</table>
<p>The root problem: the game's <b>state</b> (the current card, the score) is stored in the screen itself, and the rules are scattered wherever a click happens. MVC gives each of them one home. The general idea, one job for each part, is called separation of concerns.</p>
<h3>The three parts</h3>
<div class="tiers"><b>Model</b><div><span class="box hot">State<small>current card, score, game over</small></span><span class="box hot">Rules<small>was this guess right?</small></span></div><b>Controller</b><div><span class="box">Wiring<small>listens to both sides</small></span><span class="box">Order<small>what happens after what</small></span></div><b>View</b><div><span class="box">Nodes and components<small>Labels, Sprites, Buttons</small></span><span class="box">Reports clicks<small>emits &ldquo;guess&rdquo;</small></span></div></div>
<ul>
<li>The <b>Model</b> holds the state and the rules. It is plain TypeScript. It knows nothing about nodes, labels or the screen. It would run with no scene at all.</li>
<li>The <b>View</b> draws what it is told and reports what the player did. It never decides anything. A View script with an <code>if</code> about the score is a sign that a rule has leaked out of the Model.</li>
<li>The <b>Controller</b> connects the two. It listens for clicks from the View, calls the Model, and tells the View to redraw when the Model changes.</li>
</ul>
<p>An everyday picture: a restaurant. The kitchen (Model) cooks and decides what a dish is. The dining room (View) is where guests look and point at the menu. The waiter (Controller) carries orders one way and plates the other. Guests never walk into the kitchen, and the cook never lays the tables.</p>
<h3>Data flows one way</h3>
<p>The most important rule of the split is its direction. Data goes round one loop and never takes a short cut:</p>
<div class="flow"><span class="box">Click<small>View reports &ldquo;higher&rdquo;</small></span><span class="arr">&rarr;</span><span class="box">Controller<small>calls model.guess()</small></span><span class="arr">&rarr;</span><span class="box hot">Model changes<small>new card, new score</small></span><span class="arr">&rarr;</span><span class="box">Event<small>&ldquo;changed&rdquo;</small></span><span class="arr">&rarr;</span><span class="box">View redraws<small>from the Model</small></span></div>
<p>The View does not touch the score label when the button is pressed. It waits until the Model says something changed, then draws whatever the Model now holds. So the screen cannot disagree with the state, because the truth lives in one place only.</p>
<h3>The split in code</h3>
<p><b>Step one: the Model's state.</b> It imports only <code>EventTarget</code>, a small object that sends and receives named events. It is not a node.</p>
<pre><code>import { EventTarget } from 'cc';
export type Guess = 'higher' | 'lower';

export class GameModel {
  readonly events = new EventTarget();
  private deck: number[] = [];
  current = 0;
  score = 0;
  over = false;

  newGame(deck: number[]) {
    this.deck = deck.slice();
    this.current = this.deck.shift()!;
    this.score = 0;
    this.over = false;
    this.events.emit('changed');
  }
</code></pre>
<p><b>Step two: the rule</b>, inside the same class. This is the only place in the whole game that knows what a right guess is.</p>
<pre><code>  guess(g: Guess) {
    if (this.over) return;
    const next = this.deck.shift()!;
    const right = g === 'higher' ? next &gt; this.current : next &lt; this.current;
    this.current = next;
    if (right) this.score++;
    this.over = !right || this.deck.length === 0;
    this.events.emit('changed');
  }
}
</code></pre>
<p><b>Step three: the View.</b> The two Buttons call these methods through their Click Events, set in the Inspector. The View passes clicks on and draws when asked.</p>
<pre><code>import { _decorator, Component, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameView')
export class GameView extends Component {
  @property(Label) card: Label | null = null;
  @property(Label) score: Label | null = null;

  clickHigher() { this.node.emit('guess', 'higher'); }
  clickLower() { this.node.emit('guess', 'lower'); }

  draw(card: number, score: number, over: boolean) {
    this.card!.string = String(card);
    this.score!.string = (over ? 'Final score: ' : 'Score: ') + score;
  }
}
</code></pre>
<p><b>Step four: the Controller</b> connects them. <code>makeDeck()</code> returns a shuffled array of 52 card values, 1 to 13, four of each; the capstone lesson writes it.</p>
<pre><code>import { _decorator, Component } from 'cc';
import { GameModel, Guess } from './GameModel';
import { GameView } from './GameView';
import { makeDeck } from './Deck';
const { ccclass, property } = _decorator;

@ccclass('GameController')
export class GameController extends Component {
  @property(GameView) view: GameView | null = null;
  private model = new GameModel();

  onLoad() {
    this.model.events.on('changed', this.redraw, this);
    this.view!.node.on('guess', this.onGuess, this);
  }
  start() { this.model.newGame(makeDeck()); }
  private onGuess(g: Guess) { this.model.guess(g); }
  private redraw() { this.view!.draw(this.model.current, this.model.score, this.model.over); }
}
</code></pre>
<p>Now replay the table of requirements. A Lower button is one line in the View, and the rule is untouched. A timer is the Controller calling the Model when time runs out. A results screen is a second View that reads the same Model. When a server arrives (the lesson on talking to a server), only the inside of <code>guess()</code> changes.</p>
<h3>Vue comparison</h3>
<table>
<tr><th>In Vue</th><th>In this Cocos split</th></tr>
<tr><td>The state of a Pinia (or Vuex) store</td><td>The Model's fields: <code>current</code>, <code>score</code>, <code>over</code></td></tr>
<tr><td>Store actions</td><td>Model methods such as <code>guess()</code></td></tr>
<tr><td>A component's template</td><td>The View: nodes, Labels, Sprites</td></tr>
<tr><td>A child component calling <code>emit('click')</code></td><td>The View calling <code>this.node.emit('guess', 'higher')</code></td></tr>
<tr><td>The page component that wires the store to its children</td><td>The Controller</td></tr>
<tr><td>Reactivity redraws the template for you</td><td>Nothing redraws by itself. The Model emits an event, and the View redraws on purpose.</td></tr>
</table>
<p>The last row is the big difference. Cocos has no reactivity. In Vue you change <code>store.score</code> and the screen follows. In Cocos, changing <code>model.score</code> does nothing to the screen until someone emits an event and someone else listens for it. That is why the event step is drawn in the loop above: in Vue it is hidden, here you write it yourself.</p>
<h3>Going deeper: how fine should events be?</h3>
<p>Start with one <code>changed</code> event and a View that redraws everything. It is simple, and it cannot get out of step. Split it into finer events, such as <code>scoreChanged</code> and <code>cardRevealed</code>, only when a View needs to know <em>what</em> changed: to count the score up, say, or to flip only the new card. Send the facts the View needs as event arguments, never nodes.</p>
<h3>Going deeper: testing the Model</h3>
<p>Because the Model receives its deck as an argument, you can hand it one you chose. With <code>[3, 9, 5]</code> the first card is 3, so a guess of higher must score one point, and then a guess of lower must score a second and end the game. To run such checks outside Cocos, with a test runner in Node, replace <code>EventTarget</code> with a ten-line emitter of your own, so that the file imports nothing from <code>'cc'</code>.</p>
<p>You will also meet the names MVP and MVVM. They differ in who talks to whom. What they share with MVC is the main idea of this lesson: state and rules live apart from the screen.</p>`,
    tryNote: 'Paste into the browser console while the preview of a Cocos project is open.',
    try: [
      ["cc.find('Canvas').getComponentsInChildren(cc.Component).map((c) => cc.js.getClassName(c))", 'Every component under the Canvas, by class name. The names that do not start with cc. are your own scripts. Ask of each one: does it draw, decide, or connect?'],
      ["cc.find('Canvas').getComponentsInChildren(cc.Button).map((b) => b.node.name)", 'Every button in the scene. For each one, find the code that runs on click and see whether it changes game state by itself.'],
      ["cc.find('Canvas').getComponent('GameController').model", 'For the Higher or Lower project, with GameController on the Canvas: the Model. Its fields are the whole state of the game, and there is no node in sight.']
    ],
    own: `Pick one screen of a game or app you work on. List every piece of state it shows (numbers, flags, lists) and write next to each one where it is stored today: in a label, in a component field, in a shared store. Then sketch the split: which fields would go into a Model, which scripts are pure View, and what the Controller would listen for. Do not rewrite anything yet. The list alone usually shows where the bugs come from.`,
    terms: [['Model', '模型'], ['View', '視圖'], ['Controller', '控制器'], ['state', '狀態'], ['one-way data flow', '單向資料流'], ['event', '事件'], ['separation of concerns', '關注點分離']],
    quiz: [
      { q: "In the MVC split, which part decides whether a guess of higher was right?",
        a: ["The Higher button's script", "The View, when it redraws", "The Model", "The Controller, by reading the label"], c: 2,
        why: "Rules live in the Model, in one place. The View only draws and reports clicks, and the Controller only connects." },
      { q: "The player presses Higher. When should the score label change?",
        a: ["At once, in the button's click handler, so it feels quick", "After the Model has changed and emitted its event, when the View redraws from the Model", "Only when the scene is reloaded", "When the Controller reads the new value from the label"], c: 1,
        why: "Data flows one way: click, Controller, Model, event, redraw. The label always shows what the Model holds." },
      { q: "What does Cocos do on screen when your code changes model.score?",
        a: ["Nothing, until an event is emitted and the View redraws", "It redraws the score label automatically, as Vue would", "It throws an error, because the Model has no node", "It saves the score into the scene file"], c: 0,
        why: "Cocos has no reactivity system. The event step that Vue hides from you is one you write yourself." }
    ]
  },
  {
    id: 'cc-state', lv: 2, mins: 15,
    title: 'A state machine for one round',
    zh: '一局遊戲不是一堆 true／false 旗標，而是「現在在哪一個狀態」：等待、發牌、猜、翻牌、結算。每個狀態有進入和離開時要做的事、有自己的計時器，只能走到表上允許的下一個狀態。斷線重連時，直接跳到伺服器說的那個狀態。',
    body: `
<p>Watch a vending machine. While it is waiting, it takes coins. While it is dropping a can, pressing buttons does nothing. While it is giving change, it will not take another coin. It is always in exactly one situation, and that situation decides which buttons mean anything. That is a <b>state machine</b>: a fixed list of <b>states</b>, exactly one of them current, and a fixed list of allowed moves between them, called <b>transitions</b>.</p>
<p>A round of Higher or Lower works the same way. This lesson builds the state machine that runs one.</p>
<h3>The problem it solves</h3>
<p>Without a state machine, a game collects flags: <code>isDealing</code>, <code>isRevealing</code>, <code>canClick</code>, <code>gameOver</code>. Four true-or-false flags make 16 combinations, and most of them are nonsense: dealing and revealing at once, or game over but still clickable. Every bug report turns into &ldquo;which combination were we in?&rdquo;. A state machine replaces all of them with one variable that holds one of five names. The impossible combinations cannot even be written down.</p>
<h3>The states of one round</h3>
<div class="flow"><span class="box">waiting<small>Play button shown</small></span><span class="arr">Play &rarr;</span><span class="box">dealing<small>the first card arrives</small></span><span class="arr">&rarr;</span><span class="box hot">guessing<small>Higher and Lower enabled</small></span><span class="arr">guess &rarr;</span><span class="box">revealing<small>the next card flips</small></span><span class="arr">wrong &rarr;</span><span class="box">result<small>final score</small></span><span class="arr">&rarr; waiting</span></div>
<div class="flow"><span class="box">revealing</span><span class="arr">right guess &rarr;</span><span class="box hot">guessing<small>the revealed card is now the current one</small></span></div>
<p>The second line is the loop that makes the game: each right guess goes back to guessing with a new current card. A wrong guess, or an empty deck, goes on to the result.</p>
<h3>What each state does</h3>
<table>
<tr><th>State</th><th>On enter</th><th>On exit</th><th>Timer</th><th>Can go to</th></tr>
<tr><td>waiting</td><td>Show the Play button</td><td>Hide it</td><td>None</td><td>dealing</td></tr>
<tr><td>dealing</td><td>Get the first card, play the deal animation</td><td>Nothing</td><td>Give up after 5 seconds</td><td>guessing, or back to waiting if it failed</td></tr>
<tr><td>guessing</td><td>Enable Higher and Lower, start the countdown</td><td>Disable both, stop the countdown</td><td>10 seconds, then the round is lost</td><td>revealing, result</td></tr>
<tr><td>revealing</td><td>Flip the next card, update the score</td><td>Nothing</td><td>As long as the flip takes</td><td>guessing, result</td></tr>
<tr><td>result</td><td>Show the final score</td><td>Hide it</td><td>3 seconds, or a tap</td><td>waiting</td></tr>
</table>
<p><b>Enter</b> and <b>exit</b> are the two moments a state gets to act. Enter sets up everything the state needs. Exit undoes whatever must not outlive it, above all its timers. That pairing is what stops one state's leftovers from leaking into the next.</p>
<h3>Building it</h3>
<p><b>Step one: write the allowed transitions down as data.</b></p>
<pre><code>export type Phase = 'waiting' | 'dealing' | 'guessing' | 'revealing' | 'result';

const NEXT: Record&lt;Phase, Phase[]&gt; = {
  waiting: ['dealing'],
  dealing: ['guessing', 'waiting'],
  guessing: ['revealing', 'result'],
  revealing: ['guessing', 'result'],
  result: ['waiting'],
};
</code></pre>
<p><b>Step two: the machine</b>, in the same file. Each state has a handler with <code>enter</code> and <code>exit</code>. <code>go()</code> refuses any move that is not in the table. <code>jump()</code> skips the check, for one special case further down.</p>
<pre><code>export interface PhaseHandler { enter(data?: unknown): void; exit(): void; }

export class RoundFsm {
  phase: Phase = 'waiting';
  constructor(private handlers: Record&lt;Phase, PhaseHandler&gt;) { handlers.waiting.enter(); }

  go(to: Phase, data?: unknown): boolean {
    if (!NEXT[this.phase].includes(to)) {
      console.warn('blocked: ' + this.phase + ' -&gt; ' + to);
      return false;
    }
    this.jump(to, data);
    return true;
  }
  jump(to: Phase, data?: unknown) {
    this.handlers[this.phase].exit();
    this.phase = to;
    this.handlers[to].enter(data);
  }
}
</code></pre>
<p><b>Step three: one handler</b>, inside the Controller. The timer starts on enter and is always removed on exit. <code>setGuessEnabled()</code> is a small View method that sets <code>interactable</code> on both Buttons. Create the machine in <code>onLoad</code>, once all five handlers exist.</p>
<pre><code>private guessing: PhaseHandler = {
  enter: () =&gt; {
    this.view!.setGuessEnabled(true);
    this.scheduleOnce(this.onTimeUp, 10);
  },
  exit: () =&gt; {
    this.view!.setGuessEnabled(false);
    this.unschedule(this.onTimeUp);
  },
};

private onTimeUp() { this.fsm.go('result'); }
</code></pre>
<h3>Clicks in the wrong state</h3>
<p>Players double-click, tap during animations, and press a button one frame before it is disabled. Disabling buttons outside guessing is good manners, but it is not the defence. The defence is a <b>guard</b>: one line at the top of the click handler that checks the state.</p>
<pre><code>private onGuess(g: Guess) {
  if (this.fsm.phase !== 'guessing') return;   // ignore clicks in any other state
  this.fsm.go('revealing', g);
}
</code></pre>
<p>The first click moves the round to revealing, so the second click of a double-click finds the wrong state and is ignored. One guess, one point at most, however fast the fingers are. The same rule applies to everything that can arrive late: a timer, a network message, the end of an animation. Each one asks &ldquo;am I still in the state I was meant for?&rdquo; before it acts.</p>
<h3>Reconnecting in the middle of a round</h3>
<p>Suppose the phone loses its signal for eight seconds during guessing. When it reconnects, the client must not replay waiting, dealing and guessing from the start. It asks the server where the round stands, and gets back a <b>snapshot</b> such as:</p>
<pre><code>{ "phase": "guessing", "current": 9, "score": 4, "secondsLeft": 6 }
</code></pre>
<p>Then it jumps straight there with <code>fsm.jump(snap.phase, snap)</code>. That is what <code>jump()</code> is for. It works only if every state's enter can build its whole screen from data alone: guessing's enter shows card 9, a score of 4, and a countdown starting at 6. An enter that assumes &ldquo;dealing already put the card on the table&rdquo; breaks on reconnect. Write every enter as if the player had only just arrived.</p>
<h3>Going deeper: who owns the clock</h3>
<p>In the offline version above, the client's own timer ends the round. Against a server, the server's timer is the real one and the client's countdown is only a display. If both ended the round, a slow phone and the server could disagree about whether a last-second guess counted. So the client shows the countdown and waits, and the server announces when time is up. This is also why the snapshot sends <code>secondsLeft</code> and not a clock time: a phone's clock can be minutes wrong, but &ldquo;six seconds from now&rdquo; means the same everywhere.</p>
<h3>Going deeper: machines inside machines</h3>
<p>Real games nest state machines. The whole app has states of its own (loading, lobby, playing, disconnected), and the round machine runs only inside &ldquo;playing&rdquo;. A settings panel can open on top without the round noticing. Keep each machine small, and let the outer one start and stop the inner one, rather than building one machine with forty states.</p>
<h3>Vue comparison</h3>
<p>In Vue you might drive a page with <code>v-if</code> on several booleans. A state machine is like one <code>phase</code> ref with a <code>v-if</code> for each value, with one difference: in Vue any code can set any value, while <code>go()</code> refuses moves that are not in the table. That refusal, and the warning it prints, is what catches bugs early.</p>`,
    tryNote: 'Paste into the browser console while the preview of your Higher or Lower project is open, with GameController on the Canvas.',
    try: [
      ["cc.find('Canvas').getComponent('GameController').fsm.phase", 'The state the round is in right now. Run it again during each part of a round.'],
      ["cc.find('Canvas').getComponent('GameController').fsm.go('result')", 'From waiting this move is not allowed. It returns false and prints a blocked warning.'],
      ["cc.find('Canvas').getComponent('GameController').fsm.jump('guessing', { phase: 'guessing', current: 7, score: 3, secondsLeft: 5 })", 'Pretend you have just reconnected. If every enter builds its screen from data, you see card 7, a score of 3 and five seconds on the clock.']
    ],
    own: `Find a screen at work with two or more true-or-false flags that together describe what is going on, such as loading, editing and saving. Write down every combination that can really happen, give each one a name, and draw the arrows between them. Then recall one bug report about that screen and find which arrow was missing, or which combination should have been impossible.`,
    terms: [['state machine', '狀態機'], ['state', '狀態'], ['transition', '轉換'], ['enter and exit', '進入與離開'], ['snapshot', '快照'], ['timer', '計時器'], ['guard', '防護條件']],
    quiz: [
      { q: "During revealing, the player taps Higher twice. What should happen?",
        a: ["Both taps score, because the player was fast", "The taps are saved for the next guessing state", "Nothing: the click handler sees the round is not in guessing and ignores them", "The game throws an error"], c: 2,
        why: "Clicks are checked against the current state. Outside guessing, a guess means nothing." },
      { q: "Why must a state's exit remove the timer that its enter started?",
        a: ["Timers use a lot of memory", "Otherwise the timer can fire later, in another state, and act on a round that has moved on", "Cocos allows only one timer at a time", "Because exit runs before enter"], c: 1,
        why: "Enter and exit come in pairs. Whatever enter starts, exit stops, so nothing leaks into the next state." },
      { q: "After a reconnect in the middle of a round, the server says the round is in guessing. What should the client do?",
        a: ["Jump straight to guessing and build that screen from the snapshot", "Play waiting, dealing and guessing again from the start", "Ask the player to start a new game", "Stay in whatever state it was in before the connection dropped"], c: 0,
        why: "The server's snapshot is the truth. jump() goes there directly, and an enter written from data rebuilds the screen." }
    ]
  },
  {
    id: 'cc-net', lv: 3, mins: 18,
    title: 'Talking to a server',
    zh: '一次性的請求用 HTTP，一局進行中的即時遊戲用 WebSocket。訊息分兩種：有 id 的請求和回覆（靠 id 配對），以及伺服器主動送來的推播。輸贏永遠由伺服器決定。斷線用退避的方式重連，連回來先重新同步狀態；開發時用本機的模擬伺服器。',
    body: `
<p>Until now the Model decided whether a guess was right. In a real game that cannot stay on the phone. Anything the client decides, a player can change, by editing memory or by sending fake messages. So the next card and the score come from a <b>server</b>, and the client becomes a very good display of what the server says.</p>
<h3>Two ways to talk</h3>
<p><b>HTTP</b> is like sending a letter and getting a letter back. You ask one question, you get one answer, and that exchange is over. <b>WebSocket</b> is like a phone call that stays open: once connected, either side can speak at any moment, with no new connection for each sentence.</p>
<table>
<tr><th></th><th>HTTP</th><th>WebSocket</th></tr>
<tr><td>Shape</td><td>One request, one response, done</td><td>One long connection, messages both ways</td></tr>
<tr><td>Can the server speak first?</td><td>No. It can only answer.</td><td>Yes, at any time</td></tr>
<tr><td>Cost per message</td><td>Full headers on every request</td><td>A few bytes once connected</td></tr>
<tr><td>Use it for</td><td>Logging in, loading a profile, a leaderboard, a shop</td><td>A round in progress: guesses, reveals, timers</td></tr>
</table>
<p>Most games use both: HTTP before and after play, and one WebSocket during it. In a Cocos web build, <code>fetch</code> and <code>WebSocket</code> are simply the browser's own, exactly as in a Vue app.</p>
<h3>Two kinds of message</h3>
<p>Once a WebSocket is open, two different things travel down it, and the client must tell them apart.</p>
<ul>
<li>A <b>reply</b> answers something the client asked. &ldquo;Start a game&rdquo; gets back the first card.</li>
<li>A <b>push</b> is something the server says on its own: time is up, the server restarts in five minutes, a friend came online.</li>
</ul>
<p>Replies need matching. The client may have several questions in flight, and the answers need not come back in order. So every request carries an <b>id</b>, and its reply carries the same id back. Pushes have no id. Every message, in both directions, uses the same <b>envelope</b>:</p>
<pre><code>interface Envelope {
  type: string;     // what kind of message: 'start', 'guess', 'timeUp'
  id?: number;      // only on requests and their replies
  data: unknown;    // the content, different for each type
  error?: string;   // set on a reply when the request failed
}
</code></pre>
<p>The first line below is a request and its reply. The second is a push.</p>
<div class="flow"><span class="box">Client sends<small>{ type: 'guess', id: 7, data: { guess: 'higher' } }</small></span><span class="arr">&rarr;</span><span class="box">Server checks its deck</span><span class="arr">&rarr;</span><span class="box hot">Reply<small>{ type: 'guess', id: 7, data: { card: 11, correct: true, score: 5 } }</small></span><span class="arr">&rarr;</span><span class="box">Client finds request 7<small>and hands it the data</small></span></div>
<div class="flow"><span class="box">The server's timer runs out</span><span class="arr">&rarr;</span><span class="box hot">Push<small>{ type: 'timeUp', data: { score: 5 } }</small></span><span class="arr">&rarr;</span><span class="box">No id, so it is news<small>emit an event, the state machine reacts</small></span></div>
<h3>A small client</h3>
<p><b>Step one: receiving.</b> If a message has an id we are waiting for, it is a reply: settle that request. Otherwise it is a push: emit it as an event.</p>
<pre><code>import { EventTarget } from 'cc';

export class Net {
  readonly pushes = new EventTarget();
  private ws: WebSocket | null = null;
  private url = '';
  private nextId = 1;
  private pending = new Map&lt;number, (msg: Envelope) =&gt; void&gt;();

  connect(url: string) {
    this.url = url;
    this.ws = new WebSocket(url);
    this.ws.onclose = () =&gt; this.onClose();
    this.ws.onmessage = (ev) =&gt; {
      const msg: Envelope = JSON.parse(ev.data);
      const done = msg.id !== undefined ? this.pending.get(msg.id) : undefined;
      if (done) { this.pending.delete(msg.id!); done(msg); }
      else this.pushes.emit(msg.type, msg.data);
    };
  }
</code></pre>
<p><b>Step two: sending</b>, in the same class. Each request gets the next id and a promise that its reply will settle.</p>
<pre><code>  request(type: string, data: unknown): Promise&lt;any&gt; {
    const id = this.nextId++;
    return new Promise((resolve, reject) =&gt; {
      this.pending.set(id, (msg) =&gt; (msg.error ? reject(new Error(msg.error)) : resolve(msg.data)));
      this.ws!.send(JSON.stringify({ type, id, data }));
    });
  }
}
</code></pre>
<p>Using it reads like any async code in a Vue app. The Model's <code>guess()</code> becomes <code>applyReveal()</code>, which only stores what the server said.</p>
<pre><code>const r = await net.request('guess', { guess: 'higher' });
model.applyReveal(r.card, r.correct, r.score);
net.pushes.on('timeUp', (d: { score: number }) =&gt; fsm.go('result', d));
</code></pre>
<h3>The server decides, the client never does</h3>
<table>
<tr><th>The client sends</th><th>The server sends back</th></tr>
<tr><td>&ldquo;Start a game&rdquo;</td><td>The first card. The rest of the deck stays on the server.</td></tr>
<tr><td>&ldquo;I guess higher&rdquo;</td><td>The next card, whether the guess was right, and the new score</td></tr>
<tr><td>Nothing, while the player thinks</td><td>&ldquo;Time is up&rdquo;, when the server's own timer ends</td></tr>
</table>
<p>The client never sends &ldquo;I was right&rdquo; or &ldquo;my score is 6&rdquo;, and it never receives the next card before the guess. If the whole deck were sent at the start, anyone could read it in the browser's Network panel. The rule from the first lesson moves out of the client's Model and into the server. The server, for its part, treats every client message as a request it is free to refuse.</p>
<h3>When the connection drops</h3>
<p>On phones, connections drop all the time: a lift, a tunnel, a switch from Wi-Fi to mobile data. The <code>onclose</code> event tells you. Two things must happen next.</p>
<p><b>Reconnect, with backoff.</b> Do not retry in a tight loop. Wait 1 second, then 2, 4, 8, 16, and then every 30, adding a random fraction of a second each time. The growing wait spares a server that is struggling, and the random part stops ten thousand phones from reconnecting in the same second after a server restart. These lines go inside <code>Net</code>:</p>
<pre><code>private attempt = 0;   // set back to 0 in onopen

private onClose() {
  this.pending.forEach((done) =&gt; done({ type: 'error', data: null, error: 'disconnected' }));
  this.pending.clear();
  const wait = Math.min(30, 2 ** this.attempt) + Math.random();
  this.attempt++;
  setTimeout(() =&gt; this.connect(this.url), wait * 1000);
}
</code></pre>
<p>The first line fails every request still waiting, so no code is left awaiting a reply that will never come.</p>
<p><b>Resynchronise.</b> While you were away, the round went on. The server may have revealed a card, or ended the round on time. So the first message on a new connection asks for the whole picture:</p>
<div class="flow"><span class="box">onclose</span><span class="arr">&rarr;</span><span class="box">wait 1, 2, 4&hellip; seconds</span><span class="arr">&rarr;</span><span class="box">connect again</span><span class="arr">&rarr;</span><span class="box hot">request('resume')<small>a snapshot of the round</small></span><span class="arr">&rarr;</span><span class="box">fsm.jump(snap.phase, snap)</span></div>
<p>This is the <code>jump()</code> from the lesson on state machines. Never try to work out what you missed from the messages you happened to receive. Ask, and believe the answer. The server must also know which player is coming back, so the resume request carries a token the client received when it logged in; how that works depends on your back end.</p>
<h3>A mock server: develop without the back end</h3>
<p>The real server may not exist yet, may be down, or may make you play five rounds to reach the case you are testing. So write a <b>mock</b>: a class with the same shape as <code>Net</code> that runs the rules locally, with a short delay so that it feels like a network. First the shape:</p>
<pre><code>import { EventTarget } from 'cc';
import { makeDeck } from './Deck';
import { Guess } from './GameModel';

export class MockNet {
  readonly pushes = new EventTarget();
  private deck: number[] = [];
  private current = 0;
  private score = 0;

  request(type: string, data: any): Promise&lt;any&gt; {
    const reply = type === 'start' ? this.start() : this.guess(data.guess);   // two types so far
    return new Promise((resolve) =&gt; setTimeout(() =&gt; resolve(reply), 300));
  }
</code></pre>
<p>Then the rules, inside the same class. They are the rules from the first lesson, now standing exactly where the real server will stand.</p>
<pre><code>  private start() {
    this.deck = makeDeck();
    this.current = this.deck.shift()!;
    this.score = 0;
    return { card: this.current };
  }
  private guess(g: Guess) {
    const next = this.deck.shift()!;
    const correct = g === 'higher' ? next &gt; this.current : next &lt; this.current;
    this.current = next;
    if (correct) this.score++;
    return { card: next, correct, score: this.score, over: !correct || this.deck.length === 0 };
  }
}
</code></pre>
<p>Give both classes one interface, and the rest of the game never knows which one it has:</p>
<pre><code>export interface GameNet {
  readonly pushes: EventTarget;
  request(type: string, data: unknown): Promise&lt;any&gt;;
}

const net: GameNet = useMock ? new MockNet() : new Net();
</code></pre>
<p>Where <code>useMock</code> comes from is the subject of the lesson on building and shipping.</p>
<h3>Going deeper: make the mock misbehave</h3>
<p>The mock's best use is rehearsing bad days. Give it switches: a three-second delay, replies in the wrong order, a request that is never answered, a disconnect in the middle of guessing, a timeUp push that arrives just after the player guessed. Each is a real thing that happens on phones, and each is hard to produce on demand with the real server. A game that survives all of them against the mock survives most of them in the wild.</p>
<h3>Going deeper: timeouts and repeats</h3>
<ul>
<li>Give every request a <b>timeout</b>. If no reply arrives within, say, 8 seconds, reject it and let the state machine decide, usually by showing &ldquo;reconnecting&rdquo; and resynchronising.</li>
<li>A request can reach the server even though its reply was lost. If the client then sends the guess again, the server could count it twice. So each guess carries the round number and the guess number, and the server ignores one it has already seen. A request that is safe to send twice is called <b>idempotent</b>.</li>
<li>Messages from an old round can still be on their way when a new round starts. Put the round number in pushes too, and drop any that do not match the current round.</li>
</ul>
<h3>Vue comparison</h3>
<p>You have written <code>await axios.get(url)</code> in Vue. That is the HTTP half, unchanged. The WebSocket half has no everyday Vue equivalent. The closest is a store action that awaits a reply, plus a listener that updates the store whenever the server pushes. The mock is the same idea as mocking an API in a Vue unit test, except that you use it all day during development, not only in tests.</p>`,
    tryNote: 'Paste into the browser console while the preview of a Cocos project is open. The last one needs the Higher or Lower project with the mock switched on.',
    try: [
      ["const ws = new WebSocket('ws://localhost:59999'); ws.onclose = (e) => console.log('closed, code', e.code);", 'A connection to a port where nothing is listening. You get a close event with code 1006: this is what a lost connection looks like to your code.'],
      ['[0, 1, 2, 3, 4, 5, 6].map((n) => Math.min(30, 2 ** n))', 'The backoff waits, in seconds, for the first seven attempts: 1, 2, 4, 8, 16, 30, 30.'],
      ["cc.find('Canvas').getComponent('GameController').net.request('start', {}).then(console.log)", 'While the round is in waiting, ask the mock to start a game and print the reply: only the first card, never the deck. With the real server, open the Network panel, pick WS, and read the messages of the connection.']
    ],
    own: `Take one feature at work that talks to a back end and list every message it sends and receives. Mark each one as a request, a reply or a push, and write down which side decides the outcome. Then answer the two questions this lesson is about: what does the screen do if the connection drops halfway, and how does it find out what it missed?`,
    terms: [['request', '請求'], ['reply', '回覆'], ['push', '推播'], ['envelope', '訊息信封'], ['backoff', '退避'], ['resynchronise', '重新同步'], ['mock server', '模擬伺服器'], ['idempotent', '冪等']],
    quiz: [
      { q: "A message arrives with no id. What is it?",
        a: ["A reply to the most recent request", "A push that the server sent on its own", "A broken message that should be dropped", "A request from the server that needs an answer"], c: 1,
        why: "Only requests and their replies carry an id. A message without one is news from the server, so the client emits it as an event." },
      { q: "Why does the client get only the next card after each guess, and not the whole deck at the start?",
        a: ["To save bandwidth", "Because JSON cannot hold 52 numbers", "Anything the client holds, a player can read, so the server keeps the deck and decides", "WebSocket messages can hold only one card"], c: 2,
        why: "The server decides outcomes. A deck sent to the browser could be read in the Network panel before every guess." },
      { q: "After a dropped connection, why wait 1, 2, 4, 8 seconds plus a random part, rather than retrying at once in a loop?",
        a: ["To spare a struggling server, and to stop every phone reconnecting in the same second", "Browsers forbid reconnecting within one second", "The random part makes the connection more secure", "So that the player notices the problem"], c: 0,
        why: "A growing wait gives the server room to recover, and the random part spreads thousands of reconnects over time." }
    ]
  },
  {
    id: 'cc-build', lv: 2, mins: 15,
    title: 'Building and shipping',
    zh: '預覽是在自己廚房試吃，建置才是打包出貨。web-mobile 的建置裡有 index.html、引擎、你的程式和資源包。貼圖要壓縮；開發、預備、正式三種環境的設定，分成「建置時寫死」和「啟動時才讀」兩種。放上 CDN 時靠帶指紋的檔名更新快取，最後交給管線用命令列建置。',
    body: `
<p>Pressing Preview in the editor and handing a game to players are two different things. Preview is tasting from the pot in your own kitchen. A <b>build</b> is packing the dish into sealed, labelled boxes that survive delivery. This lesson walks from the pot to the player's phone.</p>
<h3>Preview is not the game</h3>
<table>
<tr><th></th><th>Preview</th><th>Build (Web Mobile)</th></tr>
<tr><td>Where it runs</td><td>A small server inside the editor, usually <code>localhost:7456</code></td><td>Any web server or CDN</td></tr>
<tr><td>Your scripts</td><td>Compiled as you go, readable, with source maps</td><td>Compiled once, packed and usually minified</td></tr>
<tr><td>Assets</td><td>Read one by one from the project</td><td>Packed into bundles, optionally with compressed textures and fingerprinted names</td></tr>
<tr><td>Engine</td><td>The full engine with its checks and warnings</td><td>Only the engine modules ticked in Project Settings</td></tr>
<tr><td>Speed and size</td><td>Not representative</td><td>What players get</td></tr>
</table>
<p>So a game that runs well in preview can still fail as a build. A texture can be too big for a phone. An asset loaded by path in code can be missing because it was not inside <code>resources</code> or a bundle, so the build left it out. Build early, and test the build, not only the preview.</p>
<h3>Making a build</h3>
<p>Open <b>Project &rarr; Build</b>, choose <b>Web Mobile</b> as the platform, and press Build. Web Mobile is meant for phone browsers; Web Desktop suits a page on a computer. The result lands in <code>build/web-mobile</code> inside your project.</p>
<h3>What a build contains</h3>
<div class="tiers"><b>The page</b><div><span class="box">index.html<small>what the player opens</small></span><span class="box">style.css and start-up scripts</span></div><b>The engine</b><div><span class="box">cocos-js<small>the engine, trimmed to what you use</small></span></div><b>Your game</b><div><span class="box hot">assets/main<small>your scenes and scripts</small></span><span class="box">assets/resources<small>things loaded by path</small></span><span class="box">assets/internal<small>the engine's own assets</small></span><span class="box">your own bundles<small>loaded when needed</small></span></div><b>Settings</b><div><span class="box">src<small>start-up settings: which bundles and scenes exist</small></span></div></div>
<p>Each folder under <code>assets</code> is an <b>asset bundle</b>, or bundle for short: a package of assets with its own list of contents. Inside a bundle, <code>import</code> holds the saved data of scenes, prefabs and materials, and <code>native</code> holds raw files such as images and sounds. The exact layout can differ a little between versions, so open your own build and look.</p>
<p>You can turn any folder of your project into a bundle: select it and tick <b>Is Bundle</b> in the Inspector. Load it later with <code>assetManager.loadBundle()</code>. This is how a game keeps its first download small: the title screen and the first level ship in <code>main</code>, and the rest arrives when the player gets there.</p>
<h3>Compressing textures</h3>
<p>A PNG is small on disk, but the graphics chip cannot draw from a PNG. Before drawing, the image is unpacked to raw pixels at 4 bytes each. A 1024 &times; 1024 image becomes 4 MB of graphics memory, whether the PNG file was 80 KB or 800 KB. Compressed texture formats are formats the graphics chip can draw from directly:</p>
<table>
<tr><th>A 1024 &times; 1024 image as</th><th>Graphics memory</th></tr>
<tr><td>PNG, unpacked</td><td>4 MB</td></tr>
<tr><td>ETC2</td><td>0.5 MB without transparency, 1 MB with it</td></tr>
<tr><td>PVRTC, 4 bits per pixel</td><td>0.5 MB</td></tr>
<tr><td>ASTC, 6 &times; 6 blocks</td><td>about 0.45 MB</td></tr>
</table>
<p>Which formats a phone can use depends on its graphics chip, so you usually list more than one. In Cocos you choose a compression preset for each image in the Inspector, and define the presets in Project Settings. At run time the engine picks a format the device supports. Compression costs a little quality, so check text and thin edges on a real phone.</p>
<p>Small images such as icons and buttons are better merged into one sheet. Create an <b>Auto Atlas</b> asset in a folder, and at build time Cocos packs the images of that folder into one texture: fewer files to download and, as the lesson on debugging shows, fewer draw calls.</p>
<h3>Settings per environment</h3>
<p>The same game usually runs in three places: <b>development</b> (your machine, often with the mock server), <b>staging</b> (a copy of production for testing) and <b>production</b> (real players). What changes between them is a handful of settings: the server address, whether the mock is on, how much is logged, whether a debug panel exists.</p>
<p>The important question is <em>when</em> each setting is read.</p>
<table>
<tr><th></th><th>Read at build time</th><th>Read at start-up</th></tr>
<tr><td>How</td><td>Constants compiled into the code, such as <code>DEBUG</code> and <code>PREVIEW</code> from <code>'cc/env'</code></td><td>A <code>config.json</code> next to <code>index.html</code>, fetched when the game starts</td></tr>
<tr><td>To change it</td><td>Build again</td><td>Replace one small file on the server</td></tr>
<tr><td>Good for</td><td>Leaving debug tools out of the code entirely</td><td>Server addresses and switches that differ per environment</td></tr>
</table>
<pre><code>import { PREVIEW } from 'cc/env';

export interface AppConfig { wsUrl: string; useMock: boolean; }

export async function loadConfig(): Promise&lt;AppConfig&gt; {
  if (PREVIEW) return { wsUrl: '', useMock: true };   // editor preview: no server needed
  const res = await fetch('config.json', { cache: 'no-store' });
  return (await res.json()) as AppConfig;
}
</code></pre>
<p>With start-up settings you can build once, test that exact build on staging, then copy the very same files to production with a different <code>config.json</code>. What you tested is what ships. Everything in that file is public, so it holds addresses and switches, never passwords or keys.</p>
<h3>Hosting on a CDN</h3>
<p>A web build is nothing but static files, so any web server can host it. Real games put them on a <b>CDN</b>: a network of servers around the world that keep copies close to the players. CDNs and browsers cache hard, which brings the classic problem: you ship a fix, and players keep running yesterday's files.</p>
<p>The answer is <b>cache busting</b> through file names. Tick <b>MD5 Cache</b> in the Build panel, and Cocos adds a short fingerprint of each file's contents to its name, so a file such as <code>index.js</code> becomes something like <code>index.5b2f1.js</code>. Change the file and its name changes, so no cache can serve the old one by mistake. <code>index.html</code> keeps its name, because it is the address players open.</p>
<div class="flow"><span class="box">index.html<small>no-cache: checked on every visit</small></span><span class="arr">points to</span><span class="box hot">fingerprinted files<small>cached for a year</small></span><span class="arr">&rarr;</span><span class="box">next release<small>new names, so old copies never match</small></span></div>
<p>Two rules follow. Serve the fingerprinted files with a long cache time, and serve <code>index.html</code> and <code>config.json</code> with <code>Cache-Control: no-cache</code>, so the browser checks for a new one every time. And when uploading, put the new fingerprinted files up first and <code>index.html</code> last, so that nobody gets a page pointing at files that are not there yet. Keep the old files for a few days too, because players in the middle of a session still need them.</p>
<h3>Building in a pipeline</h3>
<p>Building by hand works until someone forgets a step. A <b>pipeline</b> on a build server does it the same way every time:</p>
<div class="flow"><span class="box">Push to git</span><span class="arr">&rarr;</span><span class="box">The build server checks out the project</span><span class="arr">&rarr;</span><span class="box hot">Cocos Creator builds from the command line</span><span class="arr">&rarr;</span><span class="box">Upload to staging with the staging config.json</span><span class="arr">&rarr;</span><span class="box">Test</span><span class="arr">&rarr;</span><span class="box">Copy the same files to production</span></div>
<p>Cocos Creator can be started from the command line with a project path and build options, and then it builds without anyone touching the editor. The option names have changed between versions, so take them from the page on command-line publishing in the manual for your exact version, and keep the build settings in the project's repository so that every machine builds the same way. The build machine needs the same Cocos Creator version as the project.</p>
<h3>Vue comparison</h3>
<table>
<tr><th>Vue with Vite</th><th>Cocos Creator</th></tr>
<tr><td><code>npm run dev</code></td><td>Preview</td></tr>
<tr><td><code>npm run build</code> into <code>dist/</code></td><td>Build into <code>build/web-mobile</code></td></tr>
<tr><td>Hashed names such as <code>index-4f2a91c3.js</code></td><td>MD5 Cache</td></tr>
<tr><td><code>import.meta.env</code> and <code>.env.staging</code></td><td><code>'cc/env'</code> constants, or your own <code>config.json</code></td></tr>
<tr><td>Lazy-loaded routes</td><td>Bundles loaded with <code>assetManager.loadBundle()</code></td></tr>
</table>`,
    tryNote: 'Steps in the editor first, then lines for the browser console on the built game.',
    try: [
      ['Project > Build > Web Mobile, tick MD5 Cache, press Build, then open build/web-mobile in Finder', 'Find the folders from the picture above, and the fingerprints in the file names.'],
      ['Press Run on the finished build task, then open the browser console on that page', 'The editor serves the build like a web server, so it behaves the way it will for players.'],
      ["performance.getEntriesByType('resource').map((r) => r.name.split('/').slice(-2).join('/'))", 'Every file the page downloaded, with its folder. Find the engine, your bundles and the fingerprinted names.'],
      ["Math.round(performance.getEntriesByType('resource').reduce((s, r) => s + r.transferSize, 0) / 1024) + ' KB'", 'How much the first load cost over the network. Reload and run it again: with caching working, most files cost almost nothing the second time.']
    ],
    own: `Build a project of yours, then fill in a short table: the size of the whole build folder, of the engine, and of each bundle, plus the three biggest images with their sizes in pixels. Work out the graphics memory each of those three needs when unpacked (width &times; height &times; 4 bytes). Then write down where your server address lives today, and whether changing it would need a new build.`,
    terms: [['build', '建置'], ['preview', '預覽'], ['asset bundle', '資源包'], ['texture compression', '貼圖壓縮'], ['environment', '環境'], ['staging', '預備環境'], ['cache busting', '強制更新快取'], ['pipeline', '管線']],
    quiz: [
      { q: "A PNG of 1024 by 1024 pixels is 120 KB on disk. About how much graphics memory does it use when drawn without compression?",
        a: ["120 KB", "1 MB", "4 MB", "16 MB"], c: 2,
        why: "Unpacked, every pixel takes 4 bytes: 1024 times 1024 times 4 is about 4 MB. The file size on disk does not matter." },
      { q: "You want to test one build on staging, then ship exactly the same files to production. Where should the server address live?",
        a: ["In a constant compiled into the code", "In a config.json next to index.html, read at start-up", "In the scene file", "In the player's browser storage"], c: 1,
        why: "A setting read at start-up can differ per environment without a new build, so the files you tested are the files you ship." },
      { q: "Why is index.html uploaded last and served with no-cache, while the other files are cached for a long time?",
        a: ["index.html is the largest file", "CDNs cannot cache HTML", "The browser requires it for WebGL", "Fingerprinted files never change under the same name, but index.html keeps its name and must always point at files that already exist"], c: 3,
        why: "New contents mean new fingerprinted names, so those are safe to cache. index.html is the one file whose name stays the same." }
    ]
  },
  {
    id: 'cc-debug', lv: 2, mins: 15,
    title: 'Debugging and common pitfalls',
    zh: '最常見的幾種毛病：節點看不到、點了沒反應、參考是 null、監聽器觸發兩次、越玩越慢、手機記憶體爆掉。每一種都照「症狀、原因、解法」整理好，再配上瀏覽器主控台、中斷點、效能統計面板和印出節點樹這幾樣工具。',
    body: `
<p>Most bugs in a Cocos game are not clever. They are the same dozen mistakes everyone makes, and each has a typical <b>symptom</b>: what you see. This lesson lists them by symptom, with the usual <b>cause</b> and the <b>fix</b>, after a short tour of the tools that tell you which one you have. Think of it as the checklist a mechanic runs before opening the engine.</p>
<h3>The tools first</h3>
<ul>
<li><b>The browser console.</b> Run the preview in Chrome and open the developer tools (Cmd+Option+I on a Mac). Red lines are errors, with the file and line number. In preview the global <code>cc</code> object is there, so you can inspect the running game by typing.</li>
<li><b>Breakpoints.</b> In the Sources panel, press Cmd+P and type the name of your script. Preview serves source maps, so you see your TypeScript. Click a line number to pause there, or write <code>debugger;</code> in your code. While paused, hover over a variable to see its value.</li>
<li><b>The stats panel.</b> Cocos has a small built-in profiler. Run <code>cc.profiler.showStats()</code> in the console. A panel in the corner shows the frame rate, the time per frame, the number of draw calls and more. Watch it while you play.</li>
<li><b>The node tree.</b> The editor shows the scene as you built it. A small console function shows it as it is now, including the nodes your code created.</li>
</ul>
<pre><code>function tree(n, depth = 0) {
  console.log(' '.repeat(depth * 2) + n.name + (n.active ? '' : '  (inactive)'));
  n.children.forEach((c) =&gt; tree(c, depth + 1));
}
tree(cc.director.getScene());
</code></pre>
<p>On a real phone, connect it to your computer with a cable: Safari's Web Inspector (in the Develop menu) for an iPhone, <code>chrome://inspect</code> in Chrome for Android. The console and breakpoints then work on the page running on the phone.</p>
<h3>1. A node is not visible</h3>
<p>Work along this chain in order. Most cases end in the first three boxes.</p>
<div class="flow"><span class="box">Active?<small>itself and every parent</small></span><span class="arr">&rarr;</span><span class="box">Size and scale?<small>not zero</small></span><span class="arr">&rarr;</span><span class="box hot">Layer?<small>one the camera draws</small></span><span class="arr">&rarr;</span><span class="box">Position?<small>inside the camera's view</small></span><span class="arr">&rarr;</span><span class="box">Opacity and colour?</span><span class="arr">&rarr;</span><span class="box">Order?<small>not behind a sibling</small></span></div>
<table>
<tr><th>Cause</th><th>How to check</th><th>Fix</th></tr>
<tr><td>It, or a parent, is inactive</td><td><code>node.activeInHierarchy</code> is false</td><td>Activate the parent too. One inactive parent hides everything below it.</td></tr>
<tr><td>Zero size or zero scale</td><td>The size in its <code>UITransform</code>, or a scale left at 0 by an interrupted tween</td><td>Give it a size; stop old tweens before starting new ones</td></tr>
<tr><td>Wrong layer</td><td>A node made with <code>new Node()</code> starts on the Default layer, which the 2D camera does not draw</td><td>Set <code>node.layer = Layers.Enum.UI_2D</code>, or copy the parent's layer</td></tr>
<tr><td>Outside the camera</td><td>Its position is far off screen</td><td>Remember that a position is relative to the parent</td></tr>
<tr><td>Transparent</td><td>A <code>UIOpacity</code> at 0, a colour with alpha 0, or a Sprite with no image</td><td>Undo the fade that set it</td></tr>
<tr><td>Behind another node</td><td>In 2D, later siblings are drawn on top of earlier ones</td><td>Move it later in the tree, or call <code>setSiblingIndex()</code></td></tr>
</table>
<h3>2. Clicks do nothing</h3>
<table>
<tr><th>Cause</th><th>How to check</th><th>Fix</th></tr>
<tr><td>Another node on top takes the touch</td><td>A transparent full-screen panel, a popup that faded out but is still active, or a <code>BlockInputEvents</code> component. Deactivate suspects one at a time.</td><td>Deactivate overlays when they are hidden, do not just fade them</td></tr>
<tr><td>No area to touch</td><td>The node has no <code>UITransform</code>, or its size is 0</td><td>Give the node a size that covers what the player sees</td></tr>
<tr><td>Button switched off</td><td><code>interactable</code> is false, or the Button component is disabled</td><td>Check which state is supposed to enable it</td></tr>
<tr><td>Handler not wired</td><td>The Click Events entry points at a method that has since been renamed</td><td>Pick the method again in the Inspector, or register in code with <code>node.on()</code></td></tr>
</table>
<p>In Higher or Lower there is one more cause, and it is not a bug: the round is not in guessing, so the click is ignored on purpose. Log the state first.</p>
<h3>3. A reference is null</h3>
<p>The symptom is an error such as <code>Cannot read properties of null (reading 'string')</code>. The causes, from most to least common: a <code>@property</code> field that was never filled in by dragging in the Inspector; a node that was renamed, so <code>find()</code> or <code>getChildByName()</code> no longer finds it; <code>getComponent()</code> called on a different node from the one that has the component. Fix the cause. Then, in <code>onLoad</code>, check required references with a clear message, so that the next error names the missing field and not some line deep in your code.</p>
<h3>4. A listener fires twice</h3>
<p>The symptom: one click scores two points, or an error comes from a node destroyed long ago. The cause is an <code>on()</code> without a matching <code>off()</code>. A listener added in <code>onEnable</code> is added again every time the node is shown. A listener on a long-lived object, such as a shared <code>EventTarget</code>, keeps calling a component after its node has gone. The fix is to pair them:</p>
<pre><code>onEnable() { model.events.on('changed', this.redraw, this); }
onDisable() { model.events.off('changed', this.redraw, this); }
// or, when the component goes away for good:
onDestroy() { model.events.targetOff(this); }
</code></pre>
<p>Listeners on a node are cleared when that node is destroyed. Listeners on anything that outlives it are your job. It is the same rule as in Vue: whatever you add with <code>addEventListener</code> in <code>onMounted</code>, you remove in <code>onUnmounted</code>.</p>
<h3>5. The game slows down over time</h3>
<table>
<tr><th>Cause</th><th>Sign</th><th>Fix</th></tr>
<tr><td>Heavy work in <code>update</code></td><td>Slow from the start: <code>find()</code>, <code>getComponent()</code> or new objects every frame</td><td>Look things up once in <code>onLoad</code>, and reuse one <code>Vec3</code></td></tr>
<tr><td>Nodes that are never destroyed: a memory leak</td><td>The node count keeps growing round after round</td><td>Destroy what you create, or reuse nodes with a <code>NodePool</code></td></tr>
<tr><td>Timers and tweens that never stop</td><td>Work goes on for screens that are closed</td><td><code>unschedule()</code> in exit or <code>onDisable</code>; <code>Tween.stopAllByTarget(node)</code></td></tr>
<tr><td>Too many draw calls</td><td>The stats panel shows draw calls in the hundreds</td><td>Put images that appear together into one atlas, and keep nodes that share an atlas next to each other in the tree</td></tr>
</table>
<p>A <b>draw call</b> is one order from the engine to the graphics chip: draw this batch of shapes with this texture. Cocos merges neighbouring nodes that use the same texture and material into one batch. A node with a different texture in between, often a Label, cuts the batch in two. Twenty cards from one atlas can be a single draw call. The same twenty cards with a label after each one can be close to forty.</p>
<h3>6. The phone runs out of memory</h3>
<p>The symptom: the game is fine on your computer, but on a phone the page reloads by itself or the browser shows an error page, often after a few levels. The browser killed the tab for using too much memory, and on phones the biggest user is almost always textures. Remember the arithmetic from the lesson on building: a 2048 &times; 2048 image is 16 MB of graphics memory once unpacked, however small its file. The fixes are smaller images (a phone rarely needs 2048 pixels for one object), compressed texture formats, and releasing what you no longer need: <code>bundle.releaseAll()</code> for a bundle you are done with, or <code>assetManager.releaseAsset()</code> for one asset. Measure on the oldest phone you support, not on your own.</p>
<h3>Going deeper: make problems visible on purpose</h3>
<ul>
<li>Log every state transition with the time. When a report says &ldquo;it froze after I guessed&rdquo;, the log says which state it froze in.</li>
<li>In a debug build, show the current state, the connection status and the last message in a small corner of the screen. Testers can then send a screenshot that already holds the answer.</li>
<li>Keep the six checks above as a short list next to your code. The second time a bug appears, the list solves it in a minute.</li>
</ul>
<h3>Vue comparison</h3>
<p>In Vue, Vue Devtools shows you the component tree and its state. For a Cocos game in the browser, the console and a function like <code>tree()</code> above do that job: the node tree is your component tree, and a component's fields are its state.</p>`,
    tryNote: 'Paste into the browser console while the preview of a Cocos project is open. Replace Canvas/Card with the path of a node in your own scene.',
    try: [
      ["(function tree(n, d) { console.log(' '.repeat(d * 2) + n.name + (n.active ? '' : '  (inactive)')); n.children.forEach((c) => tree(c, d + 1)); })(cc.director.getScene(), 0)", 'The node tree as it is right now, with inactive nodes marked.'],
      ['cc.profiler.showStats()', 'The stats panel: frame rate, frame time, draw calls and more. Play for a minute and watch which numbers move.'],
      ["const n = cc.find('Canvas/Card'); [n.activeInHierarchy, n.layer === cc.Layers.Enum.UI_2D, n.getComponent(cc.UITransform).contentSize, n.scale]", 'The first checks for a node you cannot see: active, on the 2D layer, a real size, a real scale.'],
      ['(function count(n) { return 1 + n.children.reduce((s, c) => s + count(c), 0); })(cc.director.getScene())', 'How many nodes exist now. Play for a while and run it again. If the number keeps growing, something is never destroyed.']
    ],
    own: `Pick the last bug that took you more than an hour, at work or in a project of your own. Write it up in the format of this lesson: the symptom as the user saw it, the real cause, the fix, and the check that would have found it in five minutes. Then start a running list of such checks and keep it next to your code.`,
    terms: [['symptom', '症狀'], ['breakpoint', '中斷點'], ['console', '主控台'], ['draw call', '繪製呼叫'], ['memory leak', '記憶體洩漏'], ['listener', '監聽器'], ['layer', '圖層'], ['profiler', '效能分析器']],
    quiz: [
      { q: "You create a node with new Node(), add a Sprite to it and put it under the Canvas. It does not appear. What is the most likely cause?",
        a: ["Sprites cannot be created in code", "The node is on the Default layer, which the 2D camera does not draw", "The Canvas only shows nodes made in the editor", "New nodes stay inactive until the scene reloads"], c: 1,
        why: "A node made in code starts on the Default layer. Set its layer to UI_2D, or copy the parent's layer." },
      { q: "One click on Higher scores two points, but only after the player has opened the settings screen, which hides the game and shows it again. What should you look for?",
        a: ["A texture that is too large", "A missing UITransform", "Too many draw calls", "A listener added in onEnable with no matching off in onDisable"], c: 3,
        why: "Hiding and showing the node runs onEnable again. Without an off in onDisable, the listener is now there twice." },
      { q: "The stats panel shows 300 draw calls for a screen of cards. Which change helps most?",
        a: ["Put the card images into one atlas and keep the cards next to each other in the tree", "Raise the frame rate in Project Settings", "Use larger PNG files", "Move the code from update into start"], c: 0,
        why: "Neighbouring nodes that share a texture are merged into one batch, so one atlas and a sensible order cut the draw calls." }
    ]
  },
  {
    id: 'cc-capstone', lv: 3, mins: 20,
    title: 'Capstone: build Higher or Lower from an empty project',
    zh: '從空專案做出完整的猜高低，分八個里程碑：場景與版面、卡牌 Prefab、牌堆 Model、狀態機、輸入、補間動畫、本機模擬伺服器、建置與上線。每一步都寫了要做什麼、怎麼確認真的做好了、卡住時回去讀哪一課。',
    body: `
<p>This is where the module comes together. You will build Higher or Lower from an empty project, in eight milestones. Each one says what to build, how to <b>check</b> that it works before you move on, and which lesson to reread if you are stuck. Do them in order. Each stands on the one before, and a milestone is done only when its check passes, not when its code is written.</p>
<p>The rules once more: one card is face up; the player guesses whether the next card is higher or lower; a right guess scores a point and the revealed card becomes the current one; a wrong guess, an equal card or the end of the deck ends the game. From milestone 7 on, the deck lives on the (mock) server, as it will in a real game.</p>
<div class="flow"><span class="box">1 Scene</span><span class="arr">&rarr;</span><span class="box">2 Card prefab</span><span class="arr">&rarr;</span><span class="box">3 Deck model</span><span class="arr">&rarr;</span><span class="box hot">4 State machine</span><span class="arr">&rarr;</span><span class="box">5 Input</span><span class="arr">&rarr;</span><span class="box">6 Tweens</span><span class="arr">&rarr;</span><span class="box hot">7 Mock server</span><span class="arr">&rarr;</span><span class="box">8 Build and deploy</span></div>
<h3>The files you will end up with</h3>
<div class="tiers"><b>Model</b><div><span class="box">Deck.ts</span><span class="box">GameModel.ts</span></div><b>Round</b><div><span class="box hot">RoundFsm.ts</span><span class="box">GameController.ts</span></div><b>View</b><div><span class="box">GameView.ts</span><span class="box">CardView.ts</span></div><b>Network</b><div><span class="box">Net.ts</span><span class="box">MockNet.ts</span><span class="box">config.ts</span></div></div>
<h3>Milestone 1: scene and layout</h3>
<p><b>Build:</b> a new 2D project with one scene. Under the Canvas: a table area in the middle for the cards, a score label at the top, Higher and Lower buttons at the bottom, a Play button, and a result panel that starts inactive. Add a <code>Widget</code> to the score label and to the buttons so that they stick to the edges of the screen.</p>
<p><b>Check:</b> preview, then make the browser window tall and narrow, then wide and short. The label and the buttons stay on screen and stay where they belong.</p>
<p><b>If stuck:</b> reread the lessons on the node tree and on coordinates.</p>
<h3>Milestone 2: card prefab</h3>
<p><b>Build:</b> a Card node with a background Sprite, a Label for the value, and a back face. Give it a <code>CardView</code> script with <code>show(value)</code> and <code>faceDown()</code>, showing A, J, Q and K for 1, 11, 12 and 13. Drag the node into the Assets panel to make it a <b>prefab</b>, delete it from the scene, and create cards in code with <code>instantiate()</code>. Nodes in a prefab keep the layer they had in the editor, so these cards are visible; a card built with <code>new Node()</code> would not be (see the lesson on debugging).</p>
<p><b>Check:</b> from a test script, create three cards side by side showing 1, 7 and 13. They read A, 7 and K.</p>
<p><b>If stuck:</b> reread the lessons on assets and on scripts.</p>
<h3>Milestone 3: deck model</h3>
<p><b>Build:</b> <code>Deck.ts</code> with a fair shuffle, and <code>GameModel.ts</code> from the lesson on Model, View, Controller.</p>
<pre><code>export function makeDeck(): number[] {
  const d: number[] = [];
  for (let v = 1; v &lt;= 13; v++) d.push(v, v, v, v);   // 52 cards; suits do not matter here
  for (let i = d.length - 1; i &gt; 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}
</code></pre>
<p>This is the <b>Fisher&ndash;Yates shuffle</b>: every order of the cards is equally likely. The popular one-liner <code>sort(() =&gt; Math.random() - 0.5)</code> is not fair; some orders come up more often than others.</p>
<p><b>Check:</b> log <code>makeDeck()</code> a few times: 52 values, four of each, in a different order each time. Then call <code>newGame([3, 9, 5])</code> and <code>guess('higher')</code> by hand, and see the score become 1.</p>
<p><b>If stuck:</b> reread the lesson on Model, View, Controller.</p>
<h3>Milestone 4: state machine</h3>
<p><b>Build:</b> <code>RoundFsm.ts</code> from the lesson on state machines, and the five handlers in <code>GameController</code>. For now, fake the wait for a server: dealing moves on to guessing after half a second with <code>scheduleOnce</code>.</p>
<p><b>Check:</b> log each transition. One game prints waiting, dealing, guessing, revealing, guessing&hellip; result, waiting. Calling <code>fsm.go('result')</code> from waiting in the console prints a blocked warning.</p>
<p><b>If stuck:</b> reread the lesson on a state machine for one round.</p>
<h3>Milestone 5: input</h3>
<p><b>Build:</b> the Buttons call <code>GameView</code>, which emits <code>guess</code>. The Controller ignores it outside guessing. The Buttons are enabled in guessing's enter and disabled in its exit. The Play button, and a tap on the result panel, follow the same path.</p>
<p><b>Check:</b> double-click Higher as fast as you can: one guess, at most one point. Click during revealing: nothing happens. Leave the game alone for ten seconds in guessing: the game ends.</p>
<p><b>If stuck:</b> reread the lesson on input, and the section on clicks in the wrong state.</p>
<h3>Milestone 6: tweens</h3>
<p><b>Build:</b> a deal (the card slides from the deck to the table), a flip (shrink to zero width, change the face, grow back) and a small bounce on the score. Revealing exits only when the flip has finished. In <code>CardView</code>, with <code>tween</code>, <code>Tween</code> and <code>Vec3</code> imported from <code>'cc'</code>:</p>
<pre><code>flip(value: number, done: () =&gt; void) {
  Tween.stopAllByTarget(this.node);
  tween(this.node)
    .to(0.15, { scale: new Vec3(0, 1, 1) })
    .call(() =&gt; this.show(value))
    .to(0.15, { scale: new Vec3(1, 1, 1) })
    .call(done)
    .start();
}
</code></pre>
<p><b>Check:</b> play fast for a minute. No card is ever left half-turned or invisible. A scale stuck at 0 is the classic sign of an interrupted tween.</p>
<p><b>If stuck:</b> reread the lesson on tweens.</p>
<h3>Milestone 7: a local mock server</h3>
<p><b>Build:</b> <code>MockNet</code> from the lesson on talking to a server, and the <code>GameNet</code> interface that it and <code>Net</code> share. The rule leaves <code>GameModel</code>: <code>guess()</code> becomes <code>applyReveal()</code>, which only stores what the server said. Revealing's enter sends the guess and starts the flip when the reply arrives. Teach the mock two more things: a <code>timeUp</code> push when ten seconds pass in guessing (the client's countdown becomes display only), and an answer to <code>resume</code> with a snapshot.</p>
<p><b>Check:</b> the whole game plays against the mock. Set the mock's delay to 3 seconds: the game waits in revealing, and nothing can be clicked. Add a switch that drops the connection in the middle of guessing: the game comes back in the right state with the right score.</p>
<p><b>If stuck:</b> reread the lesson on talking to a server, and the part on reconnecting in the lesson on state machines.</p>
<h3>Milestone 8: build and deploy</h3>
<p><b>Build:</b> <code>config.ts</code> with <code>loadConfig()</code> from the lesson on building, read before the first round. A Web Mobile build with MD5 Cache ticked, and the card images in an Auto Atlas. A <code>config.json</code> that keeps the mock on for now. Upload the folder to any static host, <code>index.html</code> last, and <b>deploy</b> it where your phone can reach it.</p>
<p><b>Check:</b> the game runs on your phone. In a debug build, the stats panel shows a steady frame rate and only a few draw calls for the table. Change the colour of the card back, build, upload again: the phone shows the new colour after an ordinary reload, without clearing any cache.</p>
<p><b>If stuck:</b> reread the lessons on building and on debugging.</p>
<h3>Ideas to take it further</h3>
<ul>
<li><b>A best score</b> that survives a reload, saved with <code>sys.localStorage</code>.</li>
<li><b>Sound</b> for the deal, the flip and a wrong guess, with a mute switch that is remembered.</li>
<li><b>A streak bonus</b>: every fifth right guess in a row is worth two points. Add it to the mock first, as a server would.</li>
<li><b>A real server</b>: a small Node.js program that speaks the same envelope over WebSocket. The client should not change at all. If it has to, the mock was not honest.</li>
<li><b>A leaderboard</b> over HTTP, loaded on the result screen.</li>
<li><b>Several players at once</b>, all guessing on the same card against one countdown. Pushes become the main kind of message, and the server drives the state machine.</li>
<li><b>Tests</b> for <code>GameModel</code> and <code>RoundFsm</code> that run without the editor.</li>
</ul>`,
    tryNote: 'Paste into the browser console while the preview of your finished Higher or Lower project is open, with GameController on the Canvas.',
    try: [
      ["const g = cc.find('Canvas').getComponent('GameController'); [g.fsm.phase, g.model.current, g.model.score]", 'The state, the current card and the score in one line. Run it at each step of a round.'],
      ['(function count(n) { return 1 + n.children.reduce((s, c) => s + count(c), 0); })(cc.director.getScene())', 'Milestone 6: run it, play ten rounds, run it again. The node count should stay the same, or every round is leaving cards behind.'],
      ["cc.find('Canvas').getComponent('GameController').net.request('resume', {}).then(console.log)", 'Milestone 7: ask the mock for a snapshot, as a reconnect would. It should match what is on the screen.']
    ],
    own: `Finish all eight milestones. Then change one rule without touching any View script: an equal card now counts as right. If the change spreads beyond the mock (and perhaps a test), find what leaked out of the rules and move it back. Finally, hand the game to someone on their own phone and write down the first three things they did that you did not expect.`,
    terms: [['milestone', '里程碑'], ['prefab', '預製物件'], ['shuffle', '洗牌'], ['Fisher–Yates shuffle', 'Fisher–Yates 洗牌法'], ['check', '驗收檢查'], ['deploy', '部署']],
    quiz: [
      { q: "Why is a milestone done only when its check passes, and not when its code is written?",
        a: ["Cocos refuses to build until the checks pass", "Each milestone stands on the one before, so a hidden bug surfaces later, where it is much harder to find", "Checks make the game run faster", "Code that has not been checked cannot be saved"], c: 1,
        why: "Checking each step while it is fresh keeps bugs small and close to their cause." },
      { q: "In milestone 7 the rule moves out of GameModel and into the mock. Why?",
        a: ["The mock runs faster than the Model", "To make GameModel shorter", "Cocos does not allow rules inside a Model", "The mock stands where the real server will stand, and the server must own the rules"], c: 3,
        why: "With the rule in the mock, switching to the real server changes nothing in the client." },
      { q: "After a quick burst of clicks, a card stays invisible. Which cause is most likely?",
        a: ["An interrupted flip tween left its scale at 0", "The deck ran out", "The texture is not compressed", "The WebSocket closed"], c: 0,
        why: "A tween stopped halfway leaves the node wherever it was. Stop old tweens and always finish with a known scale." }
    ]
  }
  ]
});
