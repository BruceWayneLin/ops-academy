M({
  id: 'cc2', n: 2, track: 'cocos',
  title: 'Scripts, input and movement',
  zh: '腳本、輸入與動畫：寫元件腳本讓節點有行為、接住觸控和事件、用現成元件拼出 UI，再讓它們動起來。',
  time: '1 to 2 weeks',
  blurb: 'Write your own components, react to taps and buttons, build screens from the standard UI parts, and make things move with tweens and animation clips.',
  lessons: [
  {
    id: 'cc-scripts', lv: 1, mins: 14,
    title: 'Writing a component script',
    zh: '元件腳本就是一個繼承 Component 的 class：@ccclass 把它登記給引擎，@property 把欄位放到編輯器上讓你填。要用別的節點，最穩的做法是在編輯器裡拖進欄位，而不是在程式裡用名字去找。',
    body: `
<p>A <b>component script</b> is a TypeScript file that gives a node behaviour. The node is the thing in the scene. The script is what it does. A card node with a Sprite already shows a picture. Add your own script to it and the card can flip, keep its value, and tell the game it was picked.</p>
<p>Think of a node as a blank toy figure, and of components as the parts you clip onto it: a picture, a text label, a button, and a small brain that you write yourself. Your script is one more clip-on part, the same kind of thing as the engine's own Sprite or Label.</p>
<div class="tiers"><b>Node</b><div><span class="box hot">Card<small>name, position, parent, children</small></span></div><b>Components</b><div><span class="box">UITransform<small>size and anchor</small></span><span class="box">Sprite<small>draws the picture</small></span><span class="box hot">Card<small>your script</small></span></div></div>
<h3>The shape of every script</h3>
<p>Right-click in the Assets panel, choose Create, then TypeScript, and Cocos writes this for you, with your own name in place of Card:</p>
<pre><code>import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Card')
export class Card extends Component {
    start() {
    }

    update(deltaTime: number) {
    }
}</code></pre>
<ul>
<li><code>from 'cc'</code>: everything the engine offers comes from one module called <code>cc</code>.</li>
<li><code>_decorator</code> holds the two decorators you need. The second line takes them out, so you can write <code>@ccclass</code> rather than <code>@_decorator.ccclass</code>.</li>
<li><code>extends Component</code> makes your class a component. It can sit on a node, and the engine calls its life-cycle methods such as <code>onLoad</code>, <code>start</code> and <code>update</code> (the lesson on the component life cycle covers them).</li>
<li><code>export</code> lets other scripts import the class.</li>
</ul>
<h3>Decorators, simply</h3>
<p>A line that starts with <code>@</code> is a <b>decorator</b>. It is a function that runs once, when the class is defined, and sticks a label on whatever comes right after it. It does not change how your code runs line by line. It tells the engine and the editor something about the class.</p>
<table>
<tr><th>Decorator</th><th>Goes on</th><th>Tells the engine</th></tr>
<tr><td><code>@ccclass('Card')</code></td><td>The class</td><td>&ldquo;This is a component class called Card.&rdquo; Without it, the editor cannot add the script to a node.</td></tr>
<tr><td><code>@property</code></td><td>A field</td><td>&ldquo;Show this field in the Inspector, and save its value with the scene.&rdquo;</td></tr>
</table>
<p>Keep each <code>@ccclass</code> name unique in the project. The usual habit is to make the file name, the class name and the <code>@ccclass</code> name the same.</p>
<h3>@property: a field the editor can fill</h3>
<pre><code>import { _decorator, Component, Label, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Card')
export class Card extends Component {
    @property
    value = 7;                           // a number box in the Inspector

    @property(Label)
    valueLabel: Label | null = null;     // a slot: drag a Label into it

    @property([SpriteFrame])
    faces: SpriteFrame[] = [];           // a list of pictures
}</code></pre>
<p>For a plain number, string or boolean, <code>@property</code> alone is enough. The editor works out the type from the starting value. For anything from the engine, such as a Node, a Label or a picture, put the type in brackets, so the editor knows what may be dropped into the slot. Square brackets inside make it a list.</p>
<p>Select the node and the Inspector shows your Card component with three fields. Drag the Label node from the Hierarchy panel onto the Value Label slot. That saved link is a <b>reference</b>. When the scene loads, the engine fills <code>valueLabel</code> with that exact Label before your <code>onLoad</code> runs.</p>
<div class="flow"><span class="box">Hierarchy<small>the Label node</small></span><span class="arr">drag &rarr;</span><span class="box">Inspector slot<small>Value Label</small></span><span class="arr">saved in the scene &rarr;</span><span class="box hot">this.valueLabel<small>ready in onLoad</small></span></div>
<div class="warn">The value in the Inspector wins. The <code>= 7</code> in your code is only the starting value used when the component is first added. Change it to <code>= 9</code> later, and every card already placed in a scene keeps its saved 7. When a number &ldquo;will not change&rdquo;, look at the Inspector first.</div>
<p><b>Vue comparison.</b> A <code>@property</code> is close to a prop. The component declares what it needs, and someone outside supplies it. In Vue the parent's template passes props. In Cocos you supply them by hand in the Inspector, and they are saved in the scene file. Dragging a node into a slot is like a template ref: a direct handle on one thing, not a search.</p>
<table>
<tr><th>Cocos</th><th>Vue</th></tr>
<tr><td>A class that extends Component</td><td>The script part of a .vue file</td></tr>
<tr><td>A <code>@property</code> field</td><td>A prop</td></tr>
<tr><td>A dragged node reference</td><td>A template ref</td></tr>
<tr><td><code>this.node</code></td><td>The component's root element</td></tr>
<tr><td><code>find('Canvas/Board')</code></td><td><code>document.querySelector</code></td></tr>
</table>
<h3>Reaching other things from code</h3>
<table>
<tr><th>You write</th><th>You get</th></tr>
<tr><td><code>this.node</code></td><td>The node this script sits on</td></tr>
<tr><td><code>this.getComponent(Sprite)</code></td><td>The Sprite on the same node, or <code>null</code> if there is none</td></tr>
<tr><td><code>this.node.getChildByName('Face')</code></td><td>The direct child called Face, or <code>null</code></td></tr>
<tr><td><code>this.node.parent</code></td><td>The parent node</td></tr>
<tr><td><code>find('Canvas/Board/Deck')</code></td><td>The node at that path from the top of the scene, or <code>null</code></td></tr>
</table>
<h3>Why dragging beats finding by name</h3>
<p>Finding by name works until someone renames a node or moves it under a new parent. Then <code>find</code> quietly returns <code>null</code>, and the game breaks at run time with &ldquo;Cannot read properties of null&rdquo;, often far from the real cause. A dragged reference follows the node. Rename it or move it, and the link still points at it. An empty slot is also plain to see in the Inspector, so a missing link shows up before you press Play.</p>
<p>Keep finding by name for things you cannot drag, such as a node created while the game runs. When you do use it, look the node up once in <code>onLoad</code> and keep it in a field. Do not search the tree in <code>update</code>, every frame.</p>
<h3>Adding a component in code</h3>
<pre><code>// inside a method of Card; glowFrame is a @property SpriteFrame
const glow = new Node('Glow');
glow.layer = this.node.layer;              // same layer, so the same camera draws it
const sprite = glow.addComponent(Sprite);  // a UITransform is added too
sprite.spriteFrame = this.glowFrame;
this.node.addChild(glow);</code></pre>
<p><code>addComponent</code> creates the component, attaches it and returns it, so you can set it up straight away. A Sprite needs a UITransform for its size, and Cocos adds one for you. Most of the time, though, it is easier to build the node in the editor, save it as a prefab, and make copies with <code>instantiate</code>. Then you can see it and change it without touching code.</p>
<h3>A complete script: a card that flips when clicked</h3>
<pre><code>import { _decorator, Component, Node, Label } from 'cc';
const { ccclass, property } = _decorator;
@ccclass('Card')
export class Card extends Component {
    @property(Node) front: Node | null = null;   // drag the Front child here
    @property(Node) back: Node | null = null;    // drag the Back child here
    @property(Label) valueLabel: Label | null = null;
    @property value = 7;
    private faceUp = false;
    onLoad() {
        this.node.on(Node.EventType.TOUCH_END, this.flip, this);
    }
    flip() {
        if (!this.front || !this.back || !this.valueLabel) return;  // a slot is empty
        this.faceUp = !this.faceUp;
        this.front.active = this.faceUp;
        this.back.active = !this.faceUp;
        this.valueLabel.string = String(this.value);
    }
}</code></pre>
<ol>
<li>Create a node called Card under the Canvas. Make sure it has a UITransform, and set its size to that of a card, for example 200 by 280.</li>
<li>Give it two children, Front and Back, each with a Sprite. Put a Label inside Front. Untick Front, so the back shows first.</li>
<li>Drag the script onto Card. Drag Front, Back and the Label into the three slots.</li>
<li>Press Play and click the card.</li>
</ol>
<p>Setting <code>active</code> to false hides a node and everything under it, and its scripts stop running. The line in <code>onLoad</code> listens for a click on the card itself. The next lesson explains it in full.</p>
<h3>Going deeper: what @ccclass really does</h3>
<p>When TypeScript is compiled, a class becomes a plain JavaScript function, and the type information is gone. The engine still needs to know, while the game runs, which fields to show, which to save, and what type each one has. Decorators are how that information survives. <code>@ccclass</code> records the class in the engine's list of classes under its name. Each <code>@property</code> adds a field to a list kept for that class. When a scene loads, the engine reads the saved data, creates your component, and copies the saved values into the listed fields. A field without <code>@property</code> is not on the list, so it is neither shown nor saved. It starts from its code value every time.</p>
<h3>Going deeper: rules that save hours</h3>
<ul>
<li><b>Do not set things up in a constructor.</b> The engine creates components itself and fills the saved fields afterwards. Use <code>onLoad</code>.</li>
<li><b>Look things up once.</b> Call <code>getComponent</code> in <code>onLoad</code> and keep the result in a field.</li>
<li><b>Expect null.</b> Every lookup can fail. The <code>| null</code> on the field type is TypeScript reminding you, and the lesson on null and undefined shows how to handle it.</li>
</ul>`,
    tryNote: 'Open the browser preview of a Cocos Creator 3.8 project, open the developer tools (Option-Command-I on a Mac), and paste each line into the Console.',
    try: [
      ['cc.director.getScene().children.map(n => n.name)', 'The names of the top-level nodes in the running scene.'],
      ['cc.find("Canvas").children.map(n => n.name)', 'The direct children of the Canvas, found by path.'],
      ['cc.find("Canvas").getComponentsInChildren(cc.Component).map(c => c.node.name + ": " + cc.js.getClassName(c))', 'Every component under the Canvas and the node it sits on. Your own scripts appear under their @ccclass names.']
    ],
    own: `Open a project of your own and find one script that reaches another node with <code>find</code> or <code>getChildByName</code>. Replace that lookup with a <code>@property</code> slot and drag the node into it. Then rename the node and press Play: the dragged version still works, and you can see why. If you have no such script yet, build the flipping card from this lesson.`,
    terms: [['component', '元件'], ['script', '腳本'], ['decorator', '裝飾器'], ['property', '屬性'], ['reference', '參照'], ['Inspector', '屬性檢查器'], ['Hierarchy', '層級管理器'], ['prefab', '預製物件']],
    quiz: [
      { q: "You change <code>@property speed = 300</code> to <code>= 500</code> in code, but a ship already placed in the scene still moves at 300. Why?",
        a: ["The script did not compile", "The scene saved 300 for that component, and the saved value wins over the code default", "@property only works for strings", "Speeds above 300 are not allowed"], c: 1,
        why: "The code value is only used when the component is first added. After that, the Inspector value saved in the scene is what loads." },
      { q: "Why is dragging a reference into a @property slot safer than calling find('Canvas/Board/Deck')?",
        a: ["Dragging is faster to type", "find only works inside update", "find cannot reach nodes under the Canvas", "A dragged reference keeps pointing at the node after it is renamed or moved, while a path quietly returns null"], c: 3,
        why: "A path is a guess about names. A dragged reference is a link to the node itself." },
      { q: "What does <code>@ccclass('Card')</code> do?",
        a: ["It registers the class with the engine under the name Card, so the editor can add it to nodes and scenes can load it", "It makes the class run faster", "It creates a node called Card in the scene", "It imports the Card class from the cc module"], c: 0,
        why: "Decorators carry information the engine needs at run time. @ccclass is what makes a class a component the editor knows about." }
    ]
  },
  {
    id: 'cc-input', lv: 2, mins: 16,
    title: 'Input and events',
    zh: '手指點到螢幕，引擎先做點擊判定：找出最上面、點在範圍內、而且有在監聽的那個節點，把事件交給它，再沿著父節點一路往上冒泡。自己的事件用 emit 和 on 傳；全遊戲共用的訊息就用一個 EventTarget 當事件匯流排。有 on 就一定要有 off。',
    body: `
<p>A game has to react: a tap on a card, a press on a button, a drag across the table. Cocos delivers all of these as <b>events</b>. An event is a small message, such as &ldquo;a touch started here, at this point&rdquo;, handed to every function that asked for it. Those functions are <b>listeners</b>.</p>
<p>If you have written <code>addEventListener('click', fn)</code> on a web page, you already know the idea. The names differ. The shape is the same.</p>
<h3>Touch events on a node</h3>
<pre><code>onLoad() {
    this.node.on(Node.EventType.TOUCH_START, this.onDown, this);
    this.node.on(Node.EventType.TOUCH_END, this.onUp, this);
}

onDown(event: EventTouch) {
    const p = event.getUILocation();     // where, in UI coordinates
    console.log('down at', p.x, p.y);
}

onUp(event: EventTouch) {
    console.log('released on', this.node.name);
}</code></pre>
<p>The third argument, <code>this</code>, is the <b>target</b> of the listener: the object that becomes <code>this</code> inside it. Leave it out, and <code>this</code> inside <code>onDown</code> is no longer your component, so <code>this.node</code> fails.</p>
<table>
<tr><th>Event</th><th>Fires when</th></tr>
<tr><td><code>TOUCH_START</code></td><td>A finger goes down on the node, or the mouse button is pressed on it</td></tr>
<tr><td><code>TOUCH_MOVE</code></td><td>That finger moves, even if it has left the node</td></tr>
<tr><td><code>TOUCH_END</code></td><td>The finger lifts inside the node</td></tr>
<tr><td><code>TOUCH_CANCEL</code></td><td>The finger lifts outside the node</td></tr>
<tr><td><code>MOUSE_ENTER</code>, <code>MOUSE_LEAVE</code>, <code>MOUSE_WHEEL</code></td><td>Desktop only: hover and the scroll wheel</td></tr>
</table>
<p>In a desktop browser a mouse click also arrives as touch events, so listening for touches covers phones and computers alike. Use the mouse events only for things phones do not have, such as hover.</p>
<h3>How a touch finds its node</h3>
<p>The finger lands on the glass. Which node gets the touch? The engine runs a <b>hit test</b>:</p>
<div class="flow"><span class="box">Finger on the screen<small>a point in pixels</small></span><span class="arr">&rarr;</span><span class="box">Browser<small>sends a touch</small></span><span class="arr">&rarr;</span><span class="box">Engine input<small>converts the point</small></span><span class="arr">&rarr;</span><span class="box">Hit test<small>top first, listeners only</small></span><span class="arr">&rarr;</span><span class="box hot">Target node<small>gets TOUCH_START</small></span></div>
<ol>
<li>It considers only active nodes that are listening for touches.</li>
<li>It asks them from the top down. Whatever is drawn on top is asked first. A child is drawn above its parent, and a later sibling above an earlier one.</li>
<li>For each one, it asks the node's UITransform: is the point inside your rectangle? The first &ldquo;yes&rdquo; wins. That node is the event's target, and nodes below it never see this touch.</li>
</ol>
<div class="tiers"><b>On top</b><div><span class="box hot">Popup backdrop<small>BlockInputEvents</small></span></div><b>Middle</b><div><span class="box">Card<small>listener</small></span><span class="box">Higher button</span><span class="box">Lower button</span></div><b>Bottom</b><div><span class="box">Table picture<small>no listener: never hit</small></span></div></div>
<h3>What blocks a touch, and what does not</h3>
<table>
<tr><th>On top of the point</th><th>Result</th></tr>
<tr><td>A picture with no listener</td><td>Does not block. The touch goes to the listening node underneath.</td></tr>
<tr><td>A node with a listener, or a Button</td><td>Takes the touch. Nodes below never see it.</td></tr>
<tr><td>A node with a <code>BlockInputEvents</code> component</td><td>Swallows every touch on its rectangle. Put one on a popup's dark backdrop so the game behind it cannot be pressed.</td></tr>
<tr><td>A listening node with opacity 0</td><td>Still hit. Invisible is not the same as gone. Set <code>active = false</code> to really remove it.</td></tr>
<tr><td>A node hidden by its parent's Mask</td><td>Not hit where the Mask hides it.</td></tr>
</table>
<p>The first row surprises people. A large decorative image on top does not stop clicks to the buttons beneath it, until it has a listener or a BlockInputEvents.</p>
<h3>Bubbling: the event travels up</h3>
<p>Once the target is found, the event does not stop there. It <b>bubbles</b>. After the target's listeners run, the parent's listeners for the same event run, then the grandparent's, all the way to the top. DOM events on a web page do the same.</p>
<div class="flow"><span class="box hot">Card<small>the target: its listeners run first</small></span><span class="arr">&rarr;</span><span class="box">Hand<small>parent</small></span><span class="arr">&rarr;</span><span class="box">Table<small>grandparent</small></span><span class="arr">&rarr;</span><span class="box">Canvas</span></div>
<p>Say that in Higher or Lower a tap on the empty table deals the next card, so the Table node listens for TOUCH_END. The cards sit inside the Table, and a tap on a card flips it. Without help, a tap on a card would flip it and then bubble up and deal a card as well. The card's listener stops it:</p>
<pre><code>onCardTouched(event: EventTouch) {
    this.flip();
    event.propagationStopped = true;    // the Table never hears about it
}</code></pre>
<p>Inside a listener, <code>event.target</code> is the node that was hit, and <code>event.currentTarget</code> is the node whose listener is running now. <b>Vue comparison:</b> stopping the event is <code>@click.stop</code>, or <code>stopPropagation()</code> in plain DOM code.</p>
<h3>The Button component</h3>
<p>For anything the player presses on purpose, use a <b>Button</b> rather than raw touch events. It shows a pressed look, ignores a press that slides off before the finger lifts, and can be switched off with <code>interactable = false</code>. There are two ways to connect it.</p>
<p><b>In the editor.</b> In the Button's Click Events list, add an entry, drag in the node that has your script, then choose the component and the method. The optional CustomEventData text is passed to the method, which lets two buttons share one method:</p>
<pre><code>// Higher button: CustomEventData = higher
// Lower button:  CustomEventData = lower
onGuess(event: EventTouch, choice: string) {
    this.guess(choice === 'higher');
}</code></pre>
<p><b>In code.</b> A Button sends a click event on its own node. The listener receives the Button.</p>
<pre><code>this.higherButton.node.on(Button.EventType.CLICK, this.onHigher, this);</code></pre>
<h3>Your own events: emit and on</h3>
<p>Nodes can carry messages you invent. One script calls <code>emit</code>, and every listener registered with <code>on</code> for the same name runs.</p>
<pre><code>// Card.ts: tell whoever is listening
this.node.emit('card-flipped', this.value);

// Table.ts: listen on that card's node
card.on('card-flipped', this.onCardFlipped, this);

onCardFlipped(value: number) {
    console.log('card shows', value);
}</code></pre>
<p>Two things to know. <code>emit</code> passes up to five extra arguments straight to the listener. And an event sent with <code>emit</code> does not bubble: only listeners on that exact node hear it.</p>
<p><b>Vue comparison.</b> <code>this.node.emit</code> is <code>emit('card-flipped', value)</code> inside a Vue component, and <code>on</code> is the parent's <code>@card-flipped</code>. The difference is that a Vue parent listens in its template, while in Cocos the listener needs a reference to the node and subscribes in code.</p>
<h3>An event bus for the whole game</h3>
<p>Sometimes the sender and the listener are far apart. The score label at the top of the screen wants to know when a guess was right, but it has no link to the game logic. Give the whole game one shared <code>EventTarget</code>:</p>
<pre><code>// events.ts
import { EventTarget } from 'cc';
export const bus = new EventTarget();

// Game.ts
bus.emit('score-changed', this.score);

// ScoreLabel.ts
onLoad()    { bus.on('score-changed', this.onScore, this); }
onDestroy() { bus.off('score-changed', this.onScore, this); }
onScore(score: number) { this.label.string = String(score); }</code></pre>
<p>An <b>event bus</b> like this is the Cocos version of mitt, or the old Vue 2 &ldquo;event bus&rdquo;: a module that everyone imports, so any part can talk to any other. Use it for news the whole game cares about, such as &ldquo;score changed&rdquo; or &ldquo;round over&rdquo;. Do not use it where a direct reference would do. A bus hides who depends on whom.</p>
<h3>Every on needs an off</h3>
<p>Every <code>on</code> needs a matching <code>off</code>, with the same event name, the same function and the same target. Forget it, and one of two things goes wrong:</p>
<table>
<tr><th>Forgot to off</th><th>What happens</th></tr>
<tr><td>The scene changes and the ScoreLabel is destroyed</td><td>The bus still holds its listener. The next score change calls into a dead component: an error, or silent work on a node that is gone. It is also a <b>memory leak</b>: the dead component can never be freed.</td></tr>
<tr><td>You subscribe in <code>onEnable</code> but never unsubscribe in <code>onDisable</code></td><td>Each time the node is shown again, one more copy of the listener is added. The second time round, each right guess scores two points.</td></tr>
</table>
<div class="warn">Two habits prevent both. Pair them: <code>onLoad</code> with <code>onDestroy</code>, or <code>onEnable</code> with <code>onDisable</code>. And listen with a named method, never an inline arrow function. <code>off</code> needs the very same function, and an arrow function written inline is a new function every time. <code>bus.targetOff(this)</code> removes everything this component added to the bus in one line.</div>
<p>Listeners on the component's own node go away when that node is destroyed. Anything that outlives the component, such as the bus, another node or the global <code>input</code> object, keeps its listeners until you remove them.</p>
<h3>Going deeper</h3>
<ul>
<li><b>Only listening nodes take part in the hit test.</b> This differs from the DOM. A touch on a plain child does not make that child the target. So one listener on a parent, reading <code>event.target</code>, tells you the parent, not the card under the finger. Give each card its own listener.</li>
<li><b>Capture.</b> <code>node.on(type, fn, this, true)</code> listens on the way down, before the target's own listeners run. ScrollView listens this way, so it still sees a drag that starts on a Button inside it, even though a Button stops its touches from bubbling.</li>
<li><b>Letting a touch through.</b> Setting <code>event.preventSwallow = true</code> lets the next node below try the same touch. It is rarely needed.</li>
<li><b>Your own bubbling events.</b> <code>this.node.dispatchEvent(new Event('card-picked', true))</code> sends an event that bubbles up the parents like a touch. Here <code>Event</code> is the one imported from <code>cc</code>.</li>
<li><b>Keyboard and screen-wide input</b> come from the global <code>input</code> object, not from a node:</li>
</ul>
<pre><code>import { input, Input, EventKeyboard, KeyCode } from 'cc';

onLoad()    { input.on(Input.EventType.KEY_DOWN, this.onKey, this); }
onDestroy() { input.off(Input.EventType.KEY_DOWN, this.onKey, this); }
onKey(e: EventKeyboard) {
    if (e.keyCode === KeyCode.ARROW_UP) this.guess(true);     // higher
    if (e.keyCode === KeyCode.ARROW_DOWN) this.guess(false);  // lower
}</code></pre>`,
    tryNote: 'Open the browser preview of a Cocos Creator 3.8 project, open the developer tools, and paste each line into the Console.',
    try: [
      ['cc.find("Canvas").on(cc.Node.EventType.TOUCH_START, e => console.log("hit:", e.target.name, "listening:", e.currentTarget.name))', 'Now tap around the preview. Each touch that reaches the Canvas prints the node that was hit and the node listening. A tap on empty space hits the Canvas itself. A tap on a Button may print nothing, because the Button stops it.'],
      ['cc.find("Canvas").on("hello", v => console.log("got", v)); cc.find("Canvas").emit("hello", 42)', 'A custom event: listen, then emit. It prints got 42.'],
      ['const bus = new cc.EventTarget(); bus.on("score", s => console.log("score", s)); bus.emit("score", 3); bus.emit("score", 4)', 'A tiny event bus. Both messages reach the one listener.']
    ],
    own: `In a project of your own, search for <code>.on(</code>. For each listener, check that a matching <code>off</code> exists with the same name, function and target, and that the pair is <code>onLoad</code> with <code>onDestroy</code> or <code>onEnable</code> with <code>onDisable</code>. Fix any that are missing. Then put a dark backdrop with <code>BlockInputEvents</code> behind a popup, and check that the buttons behind it can no longer be pressed.`,
    terms: [['event', '事件'], ['listener', '監聽函式'], ['hit test', '點擊判定'], ['bubbling', '冒泡'], ['propagation', '傳遞'], ['event bus', '事件匯流排'], ['memory leak', '記憶體洩漏'], ['target', '目標']],
    quiz: [
      { q: "A large decorative image with no listeners sits on top of a Button. What happens when the player taps where they overlap?",
        a: ["Nothing: the image blocks the tap", "The Button gets the tap, because nodes without listeners are skipped by the hit test", "Both of them receive it", "The engine throws an error"], c: 1,
        why: "Only active nodes that listen take part in the hit test. To block taps, give the image a BlockInputEvents component." },
      { q: "After the player leaves the game screen and comes back, every right guess scores two points. What is the most likely cause?",
        a: ["The score tween ran twice", "The event bus is broken", "A listener is added in onEnable and never removed in onDisable, so a second copy was added", "Buttons always fire twice on phones"], c: 2,
        why: "Each onEnable added one more listener. Pair onEnable with onDisable, or onLoad with onDestroy." },
      { q: "Inside a card's TOUCH_END listener, what stops the parent Table's TOUCH_END listener from also running?",
        a: ["event.propagationStopped = true", "return false", "this.node.off()", "event.target = null"], c: 0,
        why: "Touch events bubble up the parents. Setting propagationStopped ends the trip at the card." }
    ]
  },
  {
    id: 'cc-ui', lv: 1, mins: 15,
    title: 'UI building blocks',
    zh: 'UI 是用幾個現成元件拼出來的：Sprite 顯示圖片（按鈕和面板用九宮格才不會拉變形）、Label 顯示文字、Button 處理按下、Layout 自動排列（像 flexbox）、ScrollView 和 Mask 負責捲動與裁切、Widget 貼齊螢幕邊緣。圖片放進同一張圖集，手機上的 draw call 才會少。',
    body: `
<p>A game screen is built from a handful of ready-made components, the way a web page is built from a handful of HTML elements. Learn these seven and you can build almost any menu, panel or card.</p>
<table>
<tr><th>Component</th><th>Does</th><th>Closest web idea</th></tr>
<tr><td>Sprite</td><td>Shows a picture</td><td><code>&lt;img&gt;</code>, or a background image</td></tr>
<tr><td>Label</td><td>Shows text</td><td><code>&lt;span&gt;</code></td></tr>
<tr><td>Button</td><td>Reacts to presses, with a pressed look</td><td><code>&lt;button&gt;</code></td></tr>
<tr><td>Layout</td><td>Arranges its children in a row, a column or a grid</td><td>Flexbox, CSS grid</td></tr>
<tr><td>ScrollView</td><td>Scrolls content that is larger than its window</td><td><code>overflow: auto</code></td></tr>
<tr><td>Mask</td><td>Hides whatever falls outside its shape</td><td><code>overflow: hidden</code></td></tr>
<tr><td>Widget</td><td>Keeps a node at a set distance from its parent's edges</td><td><code>position: absolute</code> with top and right</td></tr>
</table>
<p>Each of them needs a <b>UITransform</b> on the same node, which holds the size and the anchor point. The editor adds it for you.</p>
<h3>Sprite: a picture</h3>
<p>A Sprite draws a <b>SpriteFrame</b>: one image, or one piece of a bigger image. Drag an image from the Assets panel into its Sprite Frame slot. Its Type decides how the picture fills the node:</p>
<table>
<tr><th>Type</th><th>Use it for</th></tr>
<tr><td>Simple</td><td>Most pictures: a card face, an icon. The whole image stretches to the node's size.</td></tr>
<tr><td>Sliced</td><td>Buttons and panels that must stretch without spoiling their corners</td></tr>
<tr><td>Tiled</td><td>Repeating a small pattern across a large area</td></tr>
<tr><td>Filled</td><td>Progress bars and round timers that are only partly full</td></tr>
</table>
<h3>Sliced, or 9-slice: stretching without ugly corners</h3>
<p>Stretch a rounded button image to three times its width, and the round corners turn into flat ovals. <b>9-slice</b> fixes this. Select the image's SpriteFrame in the Assets panel and press Edit in the Inspector to open the Sprite Editor. There you set four borders, which cut the image into nine parts. Then set the Sprite's Type to Sliced, and each part stretches in its own way:</p>
<table>
<tr><td><b>Corner</b><small>never stretches</small></td><td><b>Top edge</b><small>stretches sideways only</small></td><td><b>Corner</b><small>never stretches</small></td></tr>
<tr><td><b>Left edge</b><small>stretches up and down only</small></td><td><b>Centre</b><small>stretches both ways</small></td><td><b>Right edge</b><small>stretches up and down only</small></td></tr>
<tr><td><b>Corner</b><small>never stretches</small></td><td><b>Bottom edge</b><small>stretches sideways only</small></td><td><b>Corner</b><small>never stretches</small></td></tr>
</table>
<p>The corners keep their exact pixels, so a small button and a large panel can share one small image.</p>
<h3>Label: text</h3>
<p>By default a Label uses the phone's system font: no download, but it looks slightly different on each device. For a fixed look, drag in a TTF font file. For a score in a hand-drawn style, use a <b>bitmap font</b>: one image holding every character. The Overflow setting decides what happens when the text is too long for the box:</p>
<table>
<tr><th>Overflow</th><th>When the text is too long</th></tr>
<tr><td>None</td><td>The box grows to fit the text</td></tr>
<tr><td>Clamp</td><td>The text is cut off at the edge of the box</td></tr>
<tr><td>Shrink</td><td>The font gets smaller until the text fits</td></tr>
<tr><td>Resize Height</td><td>The width stays, the text wraps, and the box grows taller</td></tr>
</table>
<p>With Clamp and Shrink, the Enable Wrap Text box decides whether a long line breaks onto the next line. Shrink is the safe choice for a score: 9 and 10,000 both fit the same box.</p>
<h3>Button: transitions</h3>
<p>A Button usually sits on a node with a Sprite. Its Transition setting gives the player feedback:</p>
<table>
<tr><th>Transition</th><th>What the player sees</th></tr>
<tr><td>None</td><td>No change</td></tr>
<tr><td>Color</td><td>A tint for each state: normal, pressed, hover, disabled</td></tr>
<tr><td>Sprite</td><td>A different picture for each state</td></tr>
<tr><td>Scale</td><td>A slight grow or shrink while pressed (Zoom Scale)</td></tr>
</table>
<p>The disabled look shows while <code>interactable</code> is false. In Higher or Lower, switch both guess buttons off while a card is turning, so the player cannot guess twice.</p>
<h3>Layout: rows, columns and grids</h3>
<p>Put a Layout on a parent, and it places the children for you. Add or remove a child, and the rest move to fill the space.</p>
<table>
<tr><th>Layout setting</th><th>Close CSS idea</th></tr>
<tr><td>Type: Horizontal</td><td><code>display: flex</code></td></tr>
<tr><td>Type: Vertical</td><td><code>flex-direction: column</code></td></tr>
<tr><td>Type: Grid</td><td><code>flex-wrap: wrap</code>, or CSS grid</td></tr>
<tr><td>Spacing X and Y</td><td><code>gap</code></td></tr>
<tr><td>Padding</td><td><code>padding</code></td></tr>
<tr><td>Resize Mode: Container</td><td>The parent grows or shrinks to fit its children, like <code>width: fit-content</code></td></tr>
<tr><td>Resize Mode: Children</td><td>The children are resized to fill the parent, roughly <code>flex: 1</code></td></tr>
</table>
<p>Three things catch people. A Layout arranges only active direct children, so a hidden child leaves no gap. It owns their positions, so a position you set by hand is overwritten. And it updates later in the frame, not the moment you add a child; call <code>layout.updateLayout()</code> if you need the new positions at once.</p>
<h3>ScrollView and Mask</h3>
<p>A ScrollView is a window onto a bigger sheet. The ready-made one (right-click in the Hierarchy, Create, UI Component, ScrollView) comes in three parts:</p>
<div class="tiers"><b>ScrollView</b><div><span class="box">ScrollView<small>handles the drag and the bounce</small></span></div><b>view</b><div><span class="box hot">view<small>a Mask: the visible window</small></span></div><b>content</b><div><span class="box">content<small>Layout, Resize Mode Container</small></span><span class="box">row</span><span class="box">row</span><span class="box">row</span></div></div>
<p>The view node has a <b>Mask</b>, which hides everything outside its rectangle, so rows scrolled out of the window vanish at its edge. Give content a vertical Layout with Resize Mode Container, and it grows as you add rows, so the ScrollView always knows how far it can scroll. A Mask with its type set to an ellipse, over a square photo, is also how you make a round profile picture.</p>
<p>A thousand rows, each a real node, is slow. The usual fix creates only the rows that fit on screen and reuses them as the list scrolls, like a virtual scroller in Vue.</p>
<h3>Widget: sticking to the screen edges</h3>
<p>Phones come in many shapes. A pause button placed at a fixed position sits in the corner on one phone and partly off the screen on another. A <b>Widget</b> says &ldquo;stay 20 pixels from my parent's top edge and 20 from its right edge&rdquo;, and the engine works out the position for each screen.</p>
<p>Tick Top and Right, set both to 20, and you have the Cocos version of <code>top: 20px; right: 20px</code>. Tick both Left and Right and the node stretches to its parent's width. On phones with a notch, the SafeArea component keeps a node clear of it. One warning: a Widget whose Align Mode is Always puts the node back whenever the node or its parent changes, so it fights any tween that tries to move that node.</p>
<h3>Putting it together: a card for Higher or Lower</h3>
<div class="tiers"><b>Card</b><div><span class="box hot">Card<small>Sprite (Sliced), Button, your script</small></span></div><b>Children</b><div><span class="box">Value<small>Label, the big number</small></span><span class="box">Suit<small>Sprite, a small icon, Widget</small></span></div></div>
<ol>
<li>Create a node called Card under the Canvas. Add a Sprite set to Sliced, with a rounded rectangle image whose borders are set. Make the node 200 by 280.</li>
<li>Add a child called Value with a Label: font size 96, centred, Overflow Shrink, so 10 still fits.</li>
<li>Add a child called Suit with a Sprite for the suit icon, and a Widget with Top and Left at 16, so it stays in the corner at any card size.</li>
<li>Add a Button to Card with Transition Scale, and connect its Click Event to a method on your script.</li>
<li>Drag Card into the Assets panel to make it a prefab, so the game can create as many cards as it needs.</li>
</ol>
<h3>Going deeper: draw calls, and why atlases matter on phones</h3>
<p>To put pixels on the screen, the engine sends the graphics chip a <b>draw call</b>: &ldquo;draw these shapes with this image&rdquo;. Each one has a fixed cost, and phones feel it most. A few dozen are nothing. Several hundred can make a cheap phone drop frames.</p>
<p>The engine saves draw calls by <b>batching</b>: nodes next to each other in drawing order that use the same image and material go out as one call. The catch is &ldquo;the same image&rdquo;. Twenty icons in twenty separate files can cost twenty draw calls. Pack them into one <b>texture atlas</b>, a single large image with all twenty inside, and they can share one.</p>
<div class="flow"><span class="box bad">20 separate images<small>up to 20 draw calls</small></span><span class="arr">pack &rarr;</span><span class="box hot">1 atlas<small>can be 1 draw call</small></span></div>
<ul>
<li><b>Cocos packs atlases for you.</b> Right-click a folder in the Assets panel, then Create, Auto Atlas. Its images are packed when you build, so count draw calls in a build.</li>
<li><b>Order matters.</b> Nodes are drawn in tree order. A system-font Label is drawn from a texture of its own, so card picture, Label, card picture, Label breaks the batch at every step.</li>
<li><b>Each Mask adds draw calls.</b> Use one only where it is needed.</li>
<li><b>Watch the number.</b> The stats panel in the corner of the preview has a Draw Call line.</li>
</ul>`,
    tryNote: 'Open the browser preview of a Cocos Creator 3.8 project, open the developer tools, and paste each line into the Console.',
    try: [
      ['cc.director.getScene().getComponentsInChildren(cc.Label).map(l => l.node.name + ": " + l.string)', 'Every Label in the scene and the text it shows.'],
      ['cc.director.getScene().getComponentsInChildren(cc.Sprite).map(s => s.node.name + ": " + (s.spriteFrame ? s.spriteFrame.name : "none"))', 'Every Sprite and the picture it shows. Many different pictures can mean many draw calls.'],
      ['cc.director.getScene().getComponentsInChildren(cc.Layout).map(l => l.node.name)', 'Every node whose children are arranged by a Layout.'],
      ['cc.profiler.showStats()', 'Shows the stats panel if it is hidden. Find the Draw Call line.']
    ],
    own: `Rebuild one screen you know, from your work or from a game you like, using only the seven components in this lesson. Use a Sliced sprite for every panel and button, a Layout for every row of buttons, and a Widget for everything that belongs at an edge. Then preview it on two very different screen shapes (the browser preview lets you pick a device) and fix whatever moves where it should not. Finish by noting the Draw Call number.`,
    terms: [['sprite', '精靈圖'], ['9-slice', '九宮格'], ['bitmap font', '點陣字型'], ['layout', '自動排列'], ['mask', '遮罩'], ['draw call', '繪製呼叫'], ['batching', '批次合併'], ['texture atlas', '圖集']],
    quiz: [
      { q: "A rounded button image is stretched to three times its width, and its corners look squashed. What is the fix?",
        a: ["Add a Mask over it", "Use a Layout with Resize Mode Children", "Set the Sprite Type to Sliced and set the borders in the Sprite Editor", "Export the image at three times the size"], c: 2,
        why: "With 9-slice, the corners never stretch. Only the edges and the centre do." },
      { q: "Why does packing thirty icons into one atlas usually make a phone game faster?",
        a: ["Sprites next to each other that share one image can be drawn in one draw call", "Atlases make the CPU run at a higher speed", "Atlases skip the hit test", "Phones cannot load more than ten files"], c: 0,
        why: "Batching needs the same image. One atlas turns many images into one." },
      { q: "You add a child to a node with a Layout and read the child's position on the next line. It is not yet where the Layout will put it. Why?",
        a: ["A Layout ignores new children", "The child is inactive", "Positions are always in world space", "The Layout updates later in the frame; call updateLayout() to apply it at once"], c: 3,
        why: "The Layout applies changes later in the frame, not at the moment the tree changes." }
    ]
  },
  {
    id: 'cc-tween', lv: 2, mins: 16,
    title: 'Movement and animation',
    zh: '要讓東西動有兩種寫法：在 update 裡用 dt 每一格自己算位置，或交給 tween 說「0.3 秒內移到那裡」。tween 可以串接、同時進行、加緩動；美術做好的動畫片段用 Animation 元件播，角色動作用 Spine 或 DragonBones。節點要銷毀前，記得把 tween 停掉。',
    body: `
<p>Movement on a screen is an illusion. The engine draws a still picture about sixty times a second. If a card is a little further to the right in each picture, your eye sees it slide. Animating means deciding where things are in each of those pictures, and Cocos gives you two ways to decide. You can work it out yourself every frame, or you can describe the motion once and let a <b>tween</b> work it out.</p>
<h3>Way 1: move it yourself in update, with dt</h3>
<pre><code>@property speed = 300;   // pixels per second

update(dt: number) {
    const p = this.node.position;
    this.node.setPosition(p.x + this.speed * dt, p.y, p.z);
}</code></pre>
<p><code>dt</code> is short for <b>delta time</b>: the number of seconds since the last frame, about 0.016 at 60 frames a second and 0.033 at 30. Multiplying by it keeps the speed the same on every phone. Without it, &ldquo;move 5 pixels a frame&rdquo; runs twice as fast on a 120 Hz phone as on a 60 Hz one.</p>
<div class="note">In Cocos Creator 3, <code>node.position</code> is read-only. <code>this.node.position.x += 5</code> is refused by TypeScript, and even when forced it does not move the node properly. Always call <code>setPosition</code>.</div>
<h3>Way 2: a tween</h3>
<p>Most UI motion is not continuous. It is &ldquo;go from here to there in 0.3 seconds, then stop&rdquo;. Writing that in update means counting time, working out how far along you are, and stopping at the end. A tween does all of it:</p>
<pre><code>import { tween, Vec3 } from 'cc';

tween(this.node)
    .to(0.3, { position: new Vec3(0, 200, 0) })   // move there in 0.3 s
    .start();                                     // nothing happens without start()</code></pre>
<p>Read it as a sentence: &ldquo;Tween this node: go to position (0, 200, 0) over 0.3 seconds. Start.&rdquo; Every frame, the tween system works out where the node should be and puts it there.</p>
<table>
<tr><th></th><th>update with dt</th><th>Tween</th></tr>
<tr><td>Best for</td><td>Continuous motion driven by the player or the game: a ship being steered, a block falling</td><td>A fixed motion with a start and an end: a card sliding in, a button popping, a panel fading out</td></tr>
<tr><td>You write</td><td>The rule for one frame</td><td>Where to end and how long to take</td></tr>
<tr><td>It stops</td><td>When your code says so</td><td>By itself, at the end</td></tr>
</table>
<h3>Chaining steps</h3>
<p>Each call adds a step, and the steps run one after another:</p>
<pre><code>tween(this.node)
    .to(0.2, { scale: new Vec3(1.2, 1.2, 1) })   // grow to 1.2 (to: absolute)
    .by(0.2, { angle: 15 })                      // turn 15 more degrees (by: relative)
    .delay(0.5)                                  // wait half a second
    .call(() =&gt; console.log('done'))             // run any code
    .start();</code></pre>
<table>
<tr><th>Step</th><th>Means</th></tr>
<tr><td><code>to(time, props)</code></td><td>Change the properties to these values</td></tr>
<tr><td><code>by(time, props)</code></td><td>Change the properties by these amounts, from wherever they are now</td></tr>
<tr><td><code>delay(time)</code></td><td>Wait</td></tr>
<tr><td><code>call(fn)</code></td><td>Run a function, then carry on</td></tr>
<tr><td><code>set(props)</code></td><td>Jump straight to these values</td></tr>
</table>
<p>A tween can change number properties on any object, not only on nodes. Nodes in Cocos Creator 3 have no opacity of their own, so to fade a node, put a <code>UIOpacity</code> component on it and tween that: <code>tween(opacity).to(0.3, { opacity: 0 })</code>.</p>
<h3>Sequence and parallel</h3>
<p>Chained steps already form a sequence. To do two things at the same time, describe each motion as its own tween and pass them to <code>parallel</code>. The outer chain moves on when both have finished.</p>
<pre><code>const slide = tween(card).to(0.4, { position: new Vec3(0, 0, 0) });
const turn = tween(card).to(0.4, { angle: 0 });

tween(card)
    .parallel(slide, turn)            // both at once
    .call(() =&gt; this.reveal())
    .start();</code></pre>
<div class="tiers"><b>Sequence</b><div><span class="box">slide 0.4 s</span><span class="arr">&rarr;</span><span class="box">turn 0.4 s</span><span class="arr">&rarr;</span><span class="box hot">reveal<small>at 0.8 s</small></span></div><b>Parallel</b><div><span class="box">slide 0.4 s<small>at the same time as</small></span><span class="box">turn 0.4 s</span><span class="arr">&rarr;</span><span class="box hot">reveal<small>at 0.4 s</small></span></div></div>
<p><code>sequence(a, b)</code> works the same way and runs its tweens in order, which is useful as one part of a <code>parallel</code>.</p>
<h3>Easing: how the motion feels</h3>
<p>Without easing, a tween moves at one steady speed and stops dead, which looks mechanical. An <b>easing</b> function changes the speed through the motion. Pass it as the third argument: <code>{ easing: 'quadOut' }</code>.</p>
<p>The table shows how far along the motion is (0% is the start, 100% the end) at five evenly spaced moments:</p>
<table>
<tr><th>Time</th><th>linear</th><th>quadIn</th><th>quadOut</th><th>backOut</th></tr>
<tr><td>0%</td><td>0%</td><td>0%</td><td>0%</td><td>0%</td></tr>
<tr><td>25%</td><td>25%</td><td>6%</td><td>44%</td><td>82%</td></tr>
<tr><td>50%</td><td>50%</td><td>25%</td><td>75%</td><td>109%</td></tr>
<tr><td>75%</td><td>75%</td><td>56%</td><td>94%</td><td>106%</td></tr>
<tr><td>100%</td><td>100%</td><td>100%</td><td>100%</td><td>100%</td></tr>
</table>
<p>Here is the same thing as dots, one dot for each equal slice of time. Where the dots are close, the node is moving slowly. Where they are far apart, it is moving fast.</p>
<pre><code>          0%                                   100%
linear    o....o....o....o....o....o....o....o....o
quadIn    ooo...o...o.....o.....o........o........o
quadOut   o........o........o.....o.....o...o...ooo
backOut   o...................o............o......oo oo   (past the end, then back)</code></pre>
<ul>
<li><b>quadOut</b> starts fast and stops gently. It is the usual choice for things arriving on screen.</li>
<li><b>quadIn</b> starts gently and ends fast. It suits things leaving.</li>
<li><b>backOut</b> shoots past the end and settles back, like a spring. It suits a pop.</li>
<li>Other names follow the same pattern, for example <code>sineInOut</code>, <code>cubicOut</code>, <code>bounceOut</code> and <code>elasticOut</code>.</li>
</ul>
<p><b>Vue comparison.</b> Easing is <code>transition-timing-function</code> in the CSS of a Vue transition. <code>ease-out</code> is close to <code>quadOut</code>.</p>
<h3>Repeating and stopping</h3>
<pre><code>// pulse the Deal button for ever
tween(this.dealButton)
    .to(0.5, { scale: new Vec3(1.1, 1.1, 1) })
    .to(0.5, { scale: new Vec3(1, 1, 1) })
    .union()              // join the two steps into one
    .repeatForever()
    .start();

// later: stop every tween on that node
Tween.stopAllByTarget(this.dealButton);</code></pre>
<p><code>repeat(n)</code> and <code>repeatForever()</code> repeat only the one step just before them, which is why <code>union()</code> joins the earlier steps into one first. To stop a single tween, keep what <code>start()</code> returns and call <code>stop()</code> on it.</p>
<h3>The Animation component: clips made in the editor</h3>
<p>Tweens are code. For motion that should be shaped by eye, use the Animation editor. It is a timeline where you set <b>keyframes</b>: &ldquo;at 0 seconds the node is here, at 0.5 seconds it is there&rdquo;, for position, scale, rotation, colour, and even which picture a Sprite shows. The result is an <b>animation clip</b> asset. Put an Animation component on the node, add the clip to its Clips list, and play it from code:</p>
<pre><code>const anim = this.getComponent(Animation)!;
anim.play('win');                                       // the clip's name
anim.once(Animation.EventType.FINISHED, this.onWinDone, this);</code></pre>
<p>Tick Play On Load and choose a Default Clip, and it plays by itself when the node appears. You can also add events on the timeline that call a method on your script at a chosen moment, for example to play a sound as a card lands.</p>
<table>
<tr><th></th><th>Tween</th><th>Animation clip</th></tr>
<tr><td>Made in</td><td>Code</td><td>The Animation editor</td></tr>
<tr><td>Values</td><td>Decided while the game runs: &ldquo;slide to wherever the next slot is&rdquo;</td><td>Fixed in advance</td></tr>
<tr><td>Who can shape it</td><td>A programmer</td><td>A designer or an artist too</td></tr>
</table>
<h3>Spine and DragonBones: skeletal animation</h3>
<p>Drawing every frame of a running character as a separate picture takes a lot of memory. <b>Skeletal animation</b> stores the character once, cut into parts such as head, arms and legs, pins the parts to a skeleton of bones, and animates only the bones. The result is smooth, small and easy to change.</p>
<p>Spine and DragonBones are the two such tools that Cocos supports. An artist builds and animates the character in the tool and exports a few files: the skeleton data, an atlas and its image. You drop them into the Assets panel and add an <code>sp.Skeleton</code> component (for Spine) or a <code>dragonBones.ArmatureDisplay</code> component (for DragonBones). Playing an animation is then one line, such as <code>skeleton.setAnimation(0, 'idle', true)</code>. Before the artist exports, check which Spine version your engine version supports. A version mismatch is a common reason a skeleton will not load.</p>
<h3>Flipping a card with a scale tween</h3>
<p>A card flip looks 3D, but it is a 2D trick. Squash the card's width to zero, swap the back for the face while it is edge-on, then stretch it back out:</p>
<div class="flow"><span class="box">Back showing<small>scale x 1</small></span><span class="arr">0.15 s &rarr;</span><span class="box">Edge-on<small>scale x 0</small></span><span class="arr">swap &rarr;</span><span class="box hot">Face switched on<small>still edge-on</small></span><span class="arr">0.15 s &rarr;</span><span class="box">Face showing<small>scale x 1</small></span></div>
<pre><code>flip() {
    if (this.flipping) return;           // ignore taps during a flip
    this.flipping = true;
    Tween.stopAllByTarget(this.node);
    tween(this.node)
        .to(0.15, { scale: new Vec3(0, 1, 1) }, { easing: 'quadIn' })
        .call(() =&gt; this.showFace())     // swap while edge-on
        .to(0.15, { scale: new Vec3(1, 1, 1) }, { easing: 'quadOut' })
        .call(() =&gt; { this.flipping = false; })
        .start();
}</code></pre>
<p>quadIn on the way in and quadOut on the way out make the card move fastest when it is edge-on, which is what a real card does.</p>
<h3>Going deeper: tweening a number</h3>
<p>A tween can drive a plain object too. This counts the score up to its new value, and <code>onUpdate</code> runs on every frame of the tween:</p>
<pre><code>private counter = { value: 0 };

showScore(score: number) {
    tween(this.counter)
        .to(0.5, { value: score }, {
            onUpdate: () =&gt; { this.label.string = String(Math.round(this.counter.value)); },
        })
        .start();
}</code></pre>
<h3>Warning: tweens can outlive their nodes</h3>
<div class="warn">A tween belongs to the engine's tween system, not to the node. If a node is destroyed, or the scene changes, in the middle of a tween, do not count on the tween noticing. A tween on a plain object, like the counter above, has no node to notice at all. Any <code>call</code> or <code>onUpdate</code> can then reach into objects that no longer exist, and you get &ldquo;Cannot read properties of null&rdquo; at random-looking moments. The fix is a habit: stop your tweens in <code>onDestroy</code>.</div>
<pre><code>onDestroy() {
    Tween.stopAllByTarget(this.node);
    Tween.stopAllByTarget(this.counter);
}</code></pre>`,
    tryNote: 'Open the browser preview of a Cocos Creator 3.8 project, open the developer tools, and paste the lines into the Console in order. The first one picks a node to play with.',
    try: [
      ['var n = cc.find("Canvas").children.find(c => !c.getComponent(cc.Camera)); n.name', 'Picks the first node under the Canvas that is not the camera, and shows its name.'],
      ['cc.tween(n).by(0.5, { angle: 360 }).start()', 'Spins it once around in half a second.'],
      ['cc.tween(n).to(0.15, { scale: new cc.Vec3(0, 1, 1) }).to(0.15, { scale: new cc.Vec3(1, 1, 1) }).start()', 'Squashes it flat and back: the card-flip motion without the face swap.'],
      ['cc.tween(n).by(0.5, { position: new cc.Vec3(0, 80, 0) }, { easing: "backOut" }).start()', 'Moves it up 80 pixels with an overshoot. Run it again with linear in place of backOut and compare.'],
      ['cc.tween(n).by(1, { angle: 90 }).repeatForever().start()', 'Turns it for ever. The next line stops it.'],
      ['cc.Tween.stopAllByTarget(n)', 'Stops every tween still running on that node.']
    ],
    own: `Find one motion in a project of your own that is written by hand in <code>update</code> with a timer or a counter, such as a panel sliding in. Rewrite it as a tween with an easing, and add <code>Tween.stopAllByTarget</code> in <code>onDestroy</code>. If you have none, build the card flip from this lesson, and switch the Higher and Lower buttons off while the card is turning.`,
    terms: [['tween', '補間動畫'], ['easing', '緩動'], ['delta time', '影格間隔時間'], ['keyframe', '關鍵影格'], ['animation clip', '動畫片段'], ['skeletal animation', '骨骼動畫'], ['frame rate', '影格率']],
    quiz: [
      { q: "Why do you multiply the speed by dt when moving a node in update?",
        a: ["It makes update run more often", "Cocos does not call update without it", "So the speed in pixels per second is the same at 30, 60 or 120 frames a second", "To turn pixels into metres"], c: 2,
        why: "dt is the time since the last frame. Speed times time gives the same distance per second on every device." },
      { q: "What repeats in <code>tween(node).to(0.3, A).to(0.3, B).repeat(3).start()</code>?",
        a: ["Both steps, three times", "Nothing, because repeat must come after start", "The whole tween, for ever", "Only the step to B, because repeat applies to the step just before it"], c: 3,
        why: "Use union() before repeat to join the earlier steps into one, then repeat that." },
      { q: "A round ends and the scene changes while a score count-up tween on a plain object is still running. Its onUpdate writes to a Label that has been destroyed. What prevents this?",
        a: ["Calling Tween.stopAllByTarget on that object in onDestroy", "Using a longer duration", "Using linear easing", "Nothing is needed: the engine always stops it"], c: 0,
        why: "A tween on a plain object is not tied to any node. Stop it yourself when the component goes away." }
    ]
  }
  ]
});
