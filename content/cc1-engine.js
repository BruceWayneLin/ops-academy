M({
  id: 'cc1', n: 1, track: 'cocos',
  title: 'How the engine works',
  zh: '遊戲引擎每一格畫面在做什麼、場景怎麼由節點和元件組成、你的程式什麼時候被呼叫、東西在畫面上的位置怎麼算，以及圖片和聲音怎麼載入。',
  time: '1 to 2 weeks',
  blurb: 'What a game engine does every frame, how a scene is built from nodes and components, when your code runs, where things sit on screen, and how pictures and sounds are loaded. Everything later in the track stands on this.',
  lessons: [
  {
    id: 'cc-what', lv: 1, mins: 14,
    title: 'What a game engine is, and how Cocos runs in a browser',
    zh: '網頁是一堆 DOM 元素，資料變了才改那一塊；遊戲只有一張 canvas，引擎每秒把整個畫面重畫大約 60 次：讀輸入、更新每個物件、畫出這一格。移動要乘上 dt，快手機和慢手機才會一樣快。',
    body: `
<p>Welcome to the Cocos Creator track. Over three modules it takes you from &ldquo;what is a game engine?&rdquo; to the structure of a complete game. This module explains how the engine works. The next one covers scripts, input and movement. The last one puts it all together into the architecture of a real game.</p>
<p>Cocos scripts are written in TypeScript. This track explains only what Cocos adds. The language itself is taught in the TypeScript track, behind its own tab. If a line of TypeScript here puzzles you, look there.</p>
<h3>What a game engine is</h3>
<p>A <b>game engine</b> is a large program that does the jobs every game needs, so that you only write the part that makes your game different. Drawing pictures fast, playing sound, reading taps and keys, loading files, keeping time: the engine does all of that. You describe what is on the screen and how it should behave.</p>
<p>Think of a theatre. The engine is the building: the stage, the lights, the curtain and the stage crew. You bring the actors and the script. Nobody builds a new lighting rig for every play.</p>
<p><b>Cocos Creator</b> is two things in one download. The <b>editor</b> is the desktop app where you lay out screens, drag in pictures and attach scripts. The <b>engine</b> is the code that actually runs your game on the player's device. It is free, its scripts are TypeScript, and it is widely used for 2D games on phones and in browsers.</p>
<h3>A web page and a game are drawn differently</h3>
<p>You already know how a web page appears. The browser keeps a tree of DOM elements, works out where each one goes, and paints them. When data changes, Vue updates only the elements that depend on it, and the browser repaints only that part.</p>
<p>A Cocos game in a browser is, almost entirely, one DOM element: a <code>&lt;canvas&gt;</code>. The cards, the buttons and the text are not in the DOM at all. The engine paints every one of them itself, as coloured pixels on that canvas, using <b>WebGL</b>: the browser's way of letting a page use the graphics chip (the GPU) directly.</p>
<table>
<tr><th></th><th>A Vue page</th><th>A Cocos game</th></tr>
<tr><td>What is on the page</td><td>Many DOM elements</td><td>One canvas</td></tr>
<tr><td>Who draws</td><td>The browser, element by element</td><td>The engine, through WebGL on the GPU</td></tr>
<tr><td>When it draws</td><td>When data changes</td><td>Every frame, about 60 times a second</td></tr>
<tr><td>What a button is</td><td>A <code>&lt;button&gt;</code> element</td><td>A picture, plus code that checks whether a tap landed on it</td></tr>
</table>
<h3>The game loop</h3>
<p>A game works like a flip book. Each page is one still picture, called a <b>frame</b>. Flip fast enough and the pictures seem to move. The engine makes those pages one after another for as long as the game runs, and every time round it does the same three steps:</p>
<div class="flow"><span class="box">1. Read input<small>taps, clicks, keys</small></span><span class="arr">&rarr;</span><span class="box hot">2. Update<small>every object moves, decides, changes</small></span><span class="arr">&rarr;</span><span class="box">3. Render<small>draw the whole frame</small></span><span class="arr">&rarr;</span><span class="box">Back to 1<small>about 60 times a second</small></span></div>
<p>This ring is the <b>game loop</b>. In step 2 the engine calls the <code>update</code> function of every active component in the scene. In step 3 it draws the whole picture again, even the parts that did not change. That sounds wasteful, but the GPU is built for exactly this, and drawing everything each time is simpler and more predictable than tracking what changed.</p>
<p>At 60 frames a second, each round has about 16.7 milliseconds. If the work in one frame takes longer, the next frame is late and the game stutters. That one number is behind most performance advice in game development.</p>
<h3>Delta time: why movement is multiplied by dt</h3>
<p>Suppose you move a ball 5 pixels every frame. On a phone that manages 60 frames a second, the ball travels 300 pixels a second. On an older phone that manages 30, it travels 150. Same code, half the speed. And whenever one frame is slow, the ball slows down with it.</p>
<p>The fix is to think per second, not per frame. Each time the engine calls <code>update</code>, it passes <b>dt</b>, short for delta time: the number of seconds since the last frame. At 60 frames a second, dt is about 0.0167. Multiply your speed by dt and the ball covers the same distance each second on any device:</p>
<pre><code>import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Mover')
export class Mover extends Component {
    @property
    speed = 200; // pixels per second

    update(dt: number) {
        const p = this.node.position;
        // distance this frame = speed x time this frame
        this.node.setPosition(p.x + this.speed * dt, p.y, p.z);
    }
}</code></pre>
<p>At 60 frames a second the ball moves 200 &times; 0.0167, about 3.3 pixels, each frame. At 30 frames a second it moves about 6.7 pixels each frame. Either way it covers 200 pixels a second.</p>
<h3>Try it below</h3>
<p>Press Play. The frame counter climbs and the ball crosses the strip, at the speed of your screen. Watch the dt readout: on most screens it is about 16.7 ms, and it jumps when the browser is busy, yet the ball keeps an even speed. Press Pause (the same button) and the loop stops, so nothing moves. Then tick Slow motion and press Play again. Now the three steps light up one at a time, and at each Update the text shows the sum: the old x plus speed &times; dt.</p>
<div class="widget" data-w="cc-loop"></div>
<h3>Vue comparison</h3>
<p>Vue is <b>reactive</b>: nothing happens until data changes, and then Vue patches only the DOM that depends on it. A game engine works the other way. It redraws the whole picture every frame whether anything changed or not, and your code runs every frame inside <code>update</code>. In Vue you ask &ldquo;what must change when this data changes?&rdquo;. In a game you ask &ldquo;where should everything be in this frame?&rdquo;.</p>
<h3>Editor, runtime and build</h3>
<p>The <b>editor</b> is where you work. The <b>runtime</b> is the engine code that ships inside your game and runs the loop on the player's device. The editor never ships. Players only ever get the runtime and your content.</p>
<div class="flow"><span class="box">Editor<small>scenes, assets, scripts</small></span><span class="arr">&rarr;</span><span class="box">Preview<small>runs it in your browser</small></span><span class="arr">&rarr;</span><span class="box hot">Build<small>Project, then Build</small></span><span class="arr">&rarr;</span><span class="box">A game folder<small>web, Android, iOS and more</small></span></div>
<p><b>Preview</b>, the play button at the top of the editor, runs your game in a browser straight away. A <b>build</b> turns the project into something you can ship: it compiles your TypeScript to JavaScript, packs your pictures and sounds, adds the runtime, and writes the result into the project's <code>build</code> folder. For the web, that is a folder with an <code>index.html</code> you can put on any web server, much like the <code>dist</code> folder of a Vite project.</p>
<h3>Going deeper: the same game as a phone app</h3>
<p>For Android and iOS, the build makes a native app project. Your scripts still run as JavaScript, inside a JavaScript engine packed into the app, and the drawing goes through the phone's own graphics system rather than WebGL. Your code stays the same. Only the runtime underneath changes.</p>
<h3>Going deeper: not quite one element</h3>
<p>A few special components lay a real DOM element over the canvas on the web: a text input box while you type in it, for example, or a video player. Everything else is pixels. This is why browser tools such as Inspect Element show you almost nothing about a running game.</p>
<h3>Going deeper: frame rate is a target, not a promise</h3>
<p>60 frames a second is the usual target, and you can change it. But a slow phone, a heavy frame or a browser tab in the background will give fewer frames, and the gaps between frames are never perfectly equal. Code that uses dt does not mind. Code that assumes exactly 60 breaks in every one of those cases.</p>`,
    tryNote: 'Paste into the browser console (Command+Option+J in Chrome) while your project is running in Preview.',
    try: [
      ['document.querySelectorAll("canvas").length', 'How many canvas elements the page has: one. The whole game is drawn on it.'],
      ['cc.director.getTotalFrames()', 'How many frames have been drawn so far. Run it twice, a few seconds apart: it grows by about 60 each second.'],
      ['cc.game.frameRate = 10', 'Asks for only 10 frames a second. The game turns choppy, but anything that uses dt still moves at the same speed. Set it back with cc.game.frameRate = 60.'],
      ['cc.game.pause()', 'Stops the game loop, so nothing moves or redraws. cc.game.resume() starts it again.']
    ],
    own: `Create a new empty 2D project, or open one you already have. Add a sprite, attach the <code>Mover</code> script above, and preview it. Then make a second version that moves 5 pixels per frame without dt. Use <code>cc.game.frameRate</code> in the console to compare 60, 30 and 10 frames a second, and write down which version keeps the same speed.`,
    terms: [['game engine', '遊戲引擎'], ['game loop', '遊戲迴圈'], ['frame', '影格'], ['delta time (dt)', '幀間隔時間'], ['canvas', '畫布'], ['render', '繪製'], ['editor', '編輯器'], ['build', '建置']],
    quiz: [
      { q: "A Cocos game is running in a browser. What is the game drawn on?",
        a: ["One DOM element per card and button", "One canvas element, which the engine paints every frame", "A Vue component tree", "Nothing in the page; it runs outside the browser"], c: 1,
        why: "The cards, buttons and text are pixels the engine paints onto one canvas with WebGL. They are not DOM elements." },
      { q: "Why is movement inside update multiplied by dt?",
        a: ["To make the code shorter", "Because dt counts how many frames have passed", "So that speed is measured per second and stays the same at 30 or 60 frames a second", "Because WebGL cannot draw without it"], c: 2,
        why: "dt is the time since the last frame. Speed times dt gives the right distance for that frame, however long it took." },
      { q: "What three steps does each round of the game loop do, in order?",
        a: ["Read input, update, render", "Render, read input, save", "Load, build, preview", "Update, wait for data to change, patch the DOM"], c: 0,
        why: "Read what the player did, let every object change, then draw the whole frame. Then start again." }
    ]
  },
  {
    id: 'cc-tree', lv: 1, mins: 14,
    title: 'Scene, Node and Component',
    zh: '場景是一棵節點樹。節點本身是空的，只有位置、旋轉、縮放和子節點；元件才讓它有能力：Sprite 畫圖、Label 顯示文字、你寫的腳本決定行為。父節點一動，子節點就跟著動。',
    body: `
<p>Everything in a Cocos game is built from three ideas. Learn them now and the rest of the engine will make sense.</p>
<table>
<tr><th>Idea</th><th>What it is</th><th>Everyday picture</th></tr>
<tr><td><b>Scene</b></td><td>One screen of the game, such as a menu or a game table, saved as a file</td><td>A stage set</td></tr>
<tr><td><b>Node</b></td><td>One thing in the scene. On its own it is empty: a name, a place and a list of children</td><td>An empty hook on the stage that things hang from</td></tr>
<tr><td><b>Component</b></td><td>An ability attached to a node</td><td>What hangs on the hook: a painted card, a sign with words, an actor following a script</td></tr>
</table>
<h3>The scene is a tree</h3>
<p>A scene holds nodes, and every node can hold more nodes, its <b>children</b>. That makes a tree, the same shape as folders inside folders. The editor shows it in the Hierarchy panel. Here is a small scene for Higher or Lower, a card game where the player guesses whether the next card will be higher or lower than the current one:</p>
<div class="tiers"><b>Scene</b><div><span class="box">The scene itself</span></div><b>Top level</b><div><span class="box">Canvas</span></div><b>Under Canvas</b><div><span class="box">Camera</span><span class="box hot">Table</span><span class="box">ScoreLabel</span><span class="box">HigherButton</span><span class="box">LowerButton</span></div><b>Under Table</b><div><span class="box">CurrentCard</span><span class="box">NextCard</span></div></div>
<p><b>Canvas</b> is the node that holds everything 2D: buttons, text and cards. It has a Camera inside it that films the 2D content. If you add a 2D node to a scene that has no Canvas yet, the editor creates one for you. Your own nodes go under Canvas.</p>
<h3>A node: position, rotation, scale and children</h3>
<p>Select any node and the Inspector panel shows what it has. Every node, without exception, has these:</p>
<ul>
<li>A <b>name</b>, so that you can find it.</li>
<li>A <b>position</b>: x, y and z. In 2D you use x and y.</li>
<li>A <b>rotation</b>. In 2D you only turn around z, and <code>node.angle</code> gives that turn in degrees.</li>
<li>A <b>scale</b>: 1 is normal size, 2 is twice as big.</li>
<li>A parent and a list of children.</li>
<li><code>active</code>: on or off.</li>
</ul>
<p>That is all. A node cannot draw anything by itself, and an empty node is invisible. It is still useful, as a handle that groups and moves other nodes, the way Table groups the two cards above.</p>
<h3>Components give a node abilities</h3>
<p>To make a node do something, you add a <b>component</b> to it: Add Component in the Inspector, or from code. A few you will use every day:</p>
<table>
<tr><th>Component</th><th>Gives the node</th></tr>
<tr><td><code>UITransform</code></td><td>A width, a height and an anchor point. Every 2D node has one (see the lesson on position and size).</td></tr>
<tr><td><code>Sprite</code></td><td>A picture to draw</td></tr>
<tr><td><code>Label</code></td><td>Text to draw</td></tr>
<tr><td><code>Button</code></td><td>Reacts to taps, and changes its look while pressed</td></tr>
<tr><td>Your own script</td><td>Any behaviour you write, such as &ldquo;check the guess and add a point&rdquo;</td></tr>
</table>
<p>One node can carry several components. A card node might have a UITransform, a Sprite for the card face, and your own <code>Card</code> script that knows its value. Building things from small parts attached to an empty holder, instead of one big class per kind of object, is called <b>composition</b>. The whole engine is built this way.</p>
<h3>Parents carry their children</h3>
<p>A child's position is not measured from the corner of the screen. It is measured from its parent. If CurrentCard is at x = -80 and its parent Table is at x = 100, the card appears at 100 + (-80) = 20. Move Table, and both cards go with it, without their own numbers changing. Turn or scale Table, and the cards turn and grow with it too.</p>
<p>So every node has two positions:</p>
<ul>
<li>The <b>local position</b>, relative to its parent. This is the number in the Inspector, and <code>node.position</code> in code.</li>
<li>The <b>world position</b>: where it really ends up, after all its parents are added in. In code it is <code>node.worldPosition</code>.</li>
</ul>
<h3>Try it below</h3>
<p>On the left is the tree: Canvas, Table under it, and two cards under Table. On the right is the stage. Drag the Table x and Table y sliders: both cards travel with the Table. Watch the readouts. Each card's local position, measured from Table, never changes. Its world position, on screen, changes with every move. Drag Table angle and the cards turn with it. Then untick Table is active and both cards vanish with their parent.</p>
<div class="widget" data-w="cc-tree"></div>
<h3>Active and inactive</h3>
<p>Setting a node's <code>active</code> to false switches it off. It is not drawn, its scripts stop running every frame, and the same happens to all its children. Set it back to true and everything returns, with its state kept. Use this to hide a panel you will show again, rather than destroying it and building it a second time. A child whose own <code>active</code> is true stays hidden while its parent is off. <code>node.activeInHierarchy</code> tells you whether a node is really on.</p>
<h3>The same tree from code</h3>
<p>Everything you do in the editor, you can also do in a script. Inside a component, <code>this.node</code> is the node the component is attached to.</p>
<pre><code>import { _decorator, Component, Node, Label } from 'cc';
const { ccclass } = _decorator;

@ccclass('TableBuilder')
export class TableBuilder extends Component {
    start() {
        const table = new Node('Table');
        table.layer = this.node.layer;          // see Going deeper
        this.node.addChild(table);              // Table is now our child
        const card = new Node('Card');
        card.layer = this.node.layer;
        card.addComponent(Label).string = '7';  // now it can show text
        table.addChild(card);
        card.setPosition(-80, 0, 0);            // measured from Table
        table.setPosition(100, 0, 0);           // the card moves too
    }
}</code></pre>
<p>To find nodes, <code>this.node.getChildByName('Table')</code> looks among the direct children, and <code>find('Canvas/Table/Card')</code> follows a path from the top of the scene. To reach a component on a node, use <code>getComponent</code>, as in <code>card.getComponent(Label)</code>.</p>
<div class="warn">Do not change <code>node.position.x</code> directly. The position you read is meant to be read only, and the engine will not notice the change. Always call <code>setPosition</code>, as above.</div>
<h3>Vue comparison</h3>
<table>
<tr><th>Cocos</th><th>Vue</th></tr>
<tr><td>The scene tree in the Hierarchy panel</td><td>The component tree in Vue DevTools</td></tr>
<tr><td>A node</td><td>An element, such as a <code>&lt;div&gt;</code></td></tr>
<tr><td>The components on a node</td><td>What you put on an element: directives that add behaviour, and a script that drives it</td></tr>
<tr><td>A child moves with its parent</td><td>A child element moves when its parent box moves</td></tr>
<tr><td><code>active = false</code></td><td>Close to <code>v-show</code>: hidden but kept. The difference is that scripts on it stop, and are told so.</td></tr>
</table>
<p>One difference matters a lot. In the DOM, CSS lays a child out inside its parent's box. In Cocos there is no layout by default: a child simply sits at an offset from its parent. The tree is also the coordinate system.</p>
<h3>Going deeper: layers and the camera</h3>
<p>Each node also has a <b>layer</b>, and a camera only films the layers it is set to see. Nodes you create in the editor under Canvas get the UI_2D layer that the Canvas camera films. A node made with <code>new Node()</code> in code gets the default layer, so it can be in exactly the right place and still be invisible. That is why the example copies its parent's layer. If a node you created in code does not show up, check this first.</p>
<h3>Going deeper: drawing order</h3>
<p>2D nodes are drawn in tree order: a parent before its children, and earlier brothers and sisters before later ones. So the last child appears on top. To bring a card to the front, move it to the end of its parent's list with <code>card.setSiblingIndex(table.children.length - 1)</code>.</p>`,
    tryNote: 'Paste into the browser console while your project is running in Preview. Replace Table with the name of one of your own nodes.',
    try: [
      ['cc.director.getScene().children.map(n => n.name)', 'The names of the top-level nodes in the running scene, such as Canvas.'],
      ['cc.find("Canvas").children.map(n => n.name)', 'The children of Canvas: the next level of the tree.'],
      ['cc.find("Canvas").components.map(c => cc.js.getClassName(c))', 'The components on the Canvas node, such as cc.UITransform and cc.Canvas.'],
      ['cc.find("Canvas/Table").active = false', 'The node disappears together with all its children. Set it back to true to bring them back.']
    ],
    own: `In a project of your own, build the Higher or Lower table in the editor: a Table node under Canvas, and two card nodes under Table, each with a Sprite or a Label. Move, turn and scale Table in the Inspector and watch the cards follow. Write down each card's local position, then check its world position in the console with <code>cc.find('Canvas/Table/CurrentCard').worldPosition</code> and explain the difference.`,
    terms: [['scene', '場景'], ['node', '節點'], ['component', '元件'], ['parent', '父節點'], ['child', '子節點'], ['local position', '本地座標'], ['world position', '世界座標'], ['composition', '組合']],
    quiz: [
      { q: "A scene contains an empty node with no components. What do you see on screen?",
        a: ["A white square", "Its name written in small letters", "A grey placeholder box", "Nothing: a node only draws once a component such as Sprite or Label is added"], c: 3,
        why: "A node is only a holder with a place and children. Drawing comes from components." },
      { q: "Table is at x = 100. Its child Card is at x = -80. Table moves to x = 150. What is the card's local x now?",
        a: ["-80", "20", "70", "150"], c: 0,
        why: "Local position is measured from the parent, so it does not change. The card's world x moved from 20 to 70." },
      { q: "You set a panel node's active to false. What happens to its children?",
        a: ["They stay visible", "They are destroyed", "They are switched off too, and come back when the panel is switched on again", "They move up to the top of the scene"], c: 2,
        why: "Switching a node off switches off its whole branch. Its state is kept for when it comes back." }
    ]
  },
  {
    id: 'cc-lifecycle', lv: 1, mins: 15,
    title: 'The component lifecycle: when your code runs',
    zh: '你不用自己呼叫元件的函式，引擎會在固定時機呼叫：onLoad 抓參照、onEnable 每次打開時、start 在第一次 update 之前、update 每一格、lateUpdate 在大家都更新完之後、onDisable 關掉時、onDestroy 銷毀時記得把監聽器拿掉。',
    body: `
<p>You never call your component's functions to get it going. The engine calls them for you, at fixed moments in the component's life: when it is created, before its first frame, on every frame, when it is switched off, and when it is destroyed. These functions are the <b>lifecycle callbacks</b>. Knowing which one runs when, and what belongs in each, prevents most beginner bugs.</p>
<p>An everyday picture: a new employee. On the first morning they find their desk and tools (onLoad). Every time they arrive, they sign in (onEnable). On day one they wait until the whole team is in before starting real work (start). Then they do their job, again and again (update). When they go on leave, they sign out (onDisable). When they leave for good, they hand back their keys (onDestroy).</p>
<h3>The whole life, in order</h3>
<div class="flow"><span class="box">onLoad<small>once</small></span><span class="arr">&rarr;</span><span class="box">onEnable<small>each time it is switched on</small></span><span class="arr">&rarr;</span><span class="box">start<small>once, before the first update</small></span><span class="arr">&rarr;</span><span class="box hot">update, lateUpdate<small>every frame</small></span><span class="arr">&rarr;</span><span class="box">onDisable<small>each time it is switched off</small></span><span class="arr">&rarr;</span><span class="box">onDestroy<small>once, at the end</small></span></div>
<table>
<tr><th>Callback</th><th>When it runs</th><th>What to put there</th></tr>
<tr><td><code>onLoad</code></td><td>Once, the first time the node is switched on: usually when the scene loads, or when a new node joins the scene</td><td>Find references to other nodes and components, and keep them in fields</td></tr>
<tr><td><code>onEnable</code></td><td>Right after <code>onLoad</code>, and again every time the node or the component is switched back on</td><td>Start listening to events that matter only while it is on</td></tr>
<tr><td><code>start</code></td><td>Once, just before this component's first <code>update</code></td><td>Start timers. Read values that other components prepared in their <code>onLoad</code>.</td></tr>
<tr><td><code>update(dt)</code></td><td>Every frame, while the component is on</td><td>Small, quick changes: move a little, count down a little</td></tr>
<tr><td><code>lateUpdate(dt)</code></td><td>Every frame, after every component's <code>update</code> has run</td><td>Things that must follow others, such as a camera following a player who moved in <code>update</code></td></tr>
<tr><td><code>onDisable</code></td><td>Every time the component is disabled or its node is switched off</td><td>Undo what <code>onEnable</code> did</td></tr>
<tr><td><code>onDestroy</code></td><td>Once, when the component or its node is destroyed</td><td>Remove listeners from things that live on, such as the global <code>input</code>. Release assets you loaded.</td></tr>
</table>
<p>You only write the callbacks you need. A component with nothing but <code>update</code> is perfectly normal.</p>
<h3>Try it below</h3>
<p>Press the buttons and read the log. Create node runs <code>onLoad</code> and then <code>onEnable</code>. The first Next frame runs <code>start</code>, then <code>update</code> and <code>lateUpdate</code>. Later frames run only <code>update</code> and <code>lateUpdate</code>, because <code>start</code> runs once in a component's life. Hide (active = false) runs <code>onDisable</code>, and while the node is hidden, Next frame calls nothing at all. Show runs <code>onEnable</code> again, but not <code>onLoad</code> or <code>start</code>. Destroy runs <code>onDisable</code> if the node was on, then <code>onDestroy</code>.</p>
<div class="widget" data-w="cc-lifecycle"></div>
<h3>A real example</h3>
<p>Here is the round timer of Higher or Lower. Each part sits in the callback where it belongs:</p>
<pre><code>import { _decorator, Component, Label, input, Input, EventKeyboard } from 'cc';
const { ccclass } = _decorator;

@ccclass('Round')
export class Round extends Component {
    private label: Label | null = null;
    private left = 10;

    onLoad() {
        this.label = this.getComponent(Label);     // find references once
        input.on(Input.EventType.KEY_DOWN, this.onKey, this);
    }
    start() { this.schedule(this.tick, 1); }      // call tick every second
    tick() {
        this.left -= 1;
        if (this.label) this.label.string = String(this.left);
    }
    onKey(e: EventKeyboard) { console.log('key', e.keyCode); }
    onDestroy() { input.off(Input.EventType.KEY_DOWN, this.onKey, this); }
}</code></pre>
<p>The <code>input</code> object belongs to the whole game, not to this node. It lives on after the node is destroyed. Without the <code>input.off</code> in <code>onDestroy</code>, every key press would still call <code>onKey</code> on a component that no longer exists. Every <code>on</code> needs a matching <code>off</code>: <code>onLoad</code> pairs with <code>onDestroy</code>, and <code>onEnable</code> pairs with <code>onDisable</code> when the listener should be heard only while the node is on.</p>
<h3>Never do heavy work in update</h3>
<p><code>update</code> runs about 60 times a second, for every active component. A job that takes 1 millisecond is nothing once. In 50 components, every frame, it uses 50 milliseconds, three times the whole frame budget. So inside <code>update</code>:</p>
<ul>
<li>Do not search the tree with <code>find</code> or <code>getComponent</code>. Do it once in <code>onLoad</code> and keep the result.</li>
<li>Do not load files or build big objects. Prepare them earlier.</li>
<li>Do not use <code>update</code> for things that happen once a second. Use <code>this.schedule</code>, as the timer above does.</li>
</ul>
<h3>Order across several components</h3>
<ul>
<li>When a scene loads, every <code>onLoad</code> runs before any <code>start</code>. So in <code>start</code> you can safely use what other components set up in their <code>onLoad</code>.</li>
<li>On one node, components run in the order they are listed in the Inspector, from top to bottom.</li>
<li>Do not rely on the order between different nodes. When one script must go first, give it the <code>@executionOrder</code> decorator with a smaller number. The default is 0. It affects <code>onLoad</code>, <code>onEnable</code>, <code>start</code>, <code>update</code> and <code>lateUpdate</code>.</li>
<li>Within one frame, every <code>update</code> finishes before any <code>lateUpdate</code> begins.</li>
</ul>
<h3>Vue comparison</h3>
<table>
<tr><th>Cocos</th><th>Closest in Vue</th><th>Where they differ</th></tr>
<tr><td><code>onLoad</code></td><td><code>created</code>, or the top of <code>setup</code></td><td>In <code>onLoad</code> the scene already exists, so you can find other nodes. In <code>created</code> there is no DOM yet.</td></tr>
<tr><td><code>onEnable</code></td><td><code>onActivated</code>, inside a KeepAlive</td><td>In Vue only cached components get it. In Cocos every component does.</td></tr>
<tr><td><code>start</code></td><td><code>onMounted</code></td><td><code>start</code> waits for the first frame, after every <code>onLoad</code> in the scene.</td></tr>
<tr><td><code>update(dt)</code>, <code>lateUpdate(dt)</code></td><td>Nothing</td><td>Vue runs code when data changes. These run every frame regardless.</td></tr>
<tr><td><code>onDisable</code></td><td><code>onDeactivated</code>, inside a KeepAlive</td><td>The same difference as <code>onEnable</code></td></tr>
<tr><td><code>onDestroy</code></td><td><code>onBeforeUnmount</code>, <code>onUnmounted</code></td><td>The same job: clean up listeners and timers</td></tr>
</table>
<p>Treat this table as a memory aid, not an exact match. The ideas are close, but the moments are not identical.</p>
<h3>Going deeper: destroy happens at the end of the frame</h3>
<p><code>node.destroy()</code> does not remove the node at once. The node is switched off immediately, so <code>onDisable</code> runs, and the real destruction, with <code>onDestroy</code>, happens at the end of the current frame. After that, <code>node.isValid</code> is false. Code that may touch a node after it is gone, such as a reply that arrives later from a timer or the network, should check <code>isValid</code> first.</p>
<h3>Going deeper: removing is not destroying</h3>
<p><code>node.removeFromParent()</code> takes a node out of the tree, but the node still exists in memory, ready to be added somewhere else. That is useful for moving a node between parents. A node you remove and never add back or destroy is simply leaked memory.</p>
<h3>Going deeper: switching off one component</h3>
<p>Setting <code>this.enabled = false</code> switches off only that one component. Its <code>update</code> stops and its <code>onDisable</code> runs, but the node stays on screen and its other components carry on.</p>`,
    tryNote: 'First an editor step, then paste into the browser console while Preview is running.',
    try: [
      ['In the editor: write a LifeLog script that calls console.log in each callback except update and lateUpdate, attach it to a node named Card under Canvas, then press Preview', 'The console shows onLoad, onEnable and start, once each.'],
      ['cc.find("Canvas/Card").active = false', 'onDisable is logged. Set it back to true: onEnable runs, but onLoad and start do not.'],
      ['cc.find("Canvas/Card").getComponent("LifeLog").enabled = false', 'Only that one component is switched off. onDisable runs, but the node stays on screen.'],
      ['cc.find("Canvas/Card").destroy()', 'onDisable, then onDestroy. After this frame the node is gone from the tree.']
    ],
    own: `Pick one component in a project of yours and sort its code by callback: what it finds, what it starts, what runs every frame and what it cleans up. Then check two things. Does it call <code>find</code> or <code>getComponent</code> inside <code>update</code>? Move that to <code>onLoad</code>. Does every <code>input.on</code> or <code>director.on</code> have a matching <code>off</code> in <code>onDestroy</code> or <code>onDisable</code>? Add the ones that are missing.`,
    terms: [['lifecycle', '生命週期'], ['callback', '回呼'], ['reference', '參照'], ['listener', '監聽器'], ['execution order', '執行順序'], ['destroy', '銷毀'], ['timer', '計時器']],
    quiz: [
      { q: "Where should a component look up the other components it needs?",
        a: ["In update, every frame, so they are always fresh", "In onLoad, once, keeping them in fields", "In onDestroy", "In lateUpdate"], c: 1,
        why: "Searching every frame wastes time. Find them once in onLoad and keep the result." },
      { q: "A node was hidden with active = false and is now shown again. Which callbacks run when it is shown?",
        a: ["onLoad, onEnable and start", "start only", "onLoad only", "onEnable only"], c: 3,
        why: "onLoad and start run once in a component's life. onEnable runs every time it is switched back on." },
      { q: "A script calls input.on in onLoad but never calls input.off. What goes wrong?",
        a: ["After the node is destroyed, the global input keeps calling the function of a component that no longer exists", "Nothing; Cocos removes every listener automatically", "The game refuses to start", "The node can no longer be hidden"], c: 0,
        why: "input belongs to the whole game and outlives the node. Remove the listener in onDestroy." }
    ]
  },
  {
    id: 'cc-coords', lv: 2, mins: 15,
    title: 'Position, size, anchor and coordinate spaces',
    zh: 'UITransform 存寬高和錨點；位置指的是「錨點」在父節點裡的位置，(0.5, 0.5) 是正中間。Y 軸往上，跟 DOM 相反。本地座標和世界座標可以互相換算。設計解析度加上 Fit Width／Fit Height 決定畫面怎麼縮放，Widget 讓節點貼住螢幕邊緣。',
    body: `
<p>In CSS you place a box with <code>top</code> and <code>left</code>, and its top-left corner sits there. Cocos asks a different question: which point of the box sits at the position? That point is the <b>anchor point</b>. Once the anchor makes sense, most &ldquo;why is my sprite in the wrong place?&rdquo; questions answer themselves.</p>
<h3>UITransform: size and anchor</h3>
<p>Every 2D node has a <code>UITransform</code> component, holding two things:</p>
<ul>
<li>The <b>content size</b>: the width and height of the node's box.</li>
<li>The anchor point: a point inside the box, written as fractions of its width and height. (0, 0) is the bottom-left corner, (1, 1) is the top-right corner, and the default, (0.5, 0.5), is the centre.</li>
</ul>
<p>Picture pinning a photo to a corkboard. Where the pin goes into the board is the position. Where the pin goes through the photo is the anchor. Push it through the middle and the photo spreads evenly around the pin. Push it through the bottom-left corner and the photo extends up and to the right of the pin.</p>
<div class="note">The rule: a node's position is where its anchor point sits, inside its parent. And the parent's inside starts at the parent's own anchor point. A child at (0, 0) sits exactly on its parent's anchor, which for a default parent is the centre, not a corner.</div>
<h3>Working out the edges</h3>
<p>For a node at position (x, y), with width w, height h and anchor (ax, ay):</p>
<table>
<tr><th>Edge</th><th>Formula</th><th>Example: x = 100, y = 50, w = 200, h = 80, anchor (0.5, 0.5)</th></tr>
<tr><td>Left</td><td>x - ax &times; w</td><td>100 - 100 = 0</td></tr>
<tr><td>Right</td><td>left + w</td><td>0 + 200 = 200</td></tr>
<tr><td>Bottom</td><td>y - ay &times; h</td><td>50 - 40 = 10</td></tr>
<tr><td>Top</td><td>bottom + h</td><td>10 + 80 = 90</td></tr>
</table>
<p>Change the anchor to (0, 0) and the left edge becomes x itself, and the bottom edge y itself: the box now starts at the position and grows to the right and upwards.</p>
<h3>Try it below</h3>
<p>The green cross marks the node's position, and it stays where it is while you change the anchor. Drag Anchor x and Anchor y: the rectangle slides around the fixed cross, because you are choosing which point of the rectangle sits on it. At (0, 0) the cross is on the bottom-left corner. At (1, 1) it is on the top-right. Then drag Position x and Position y: now the cross and the rectangle move together. The readout shows the four edges, so you can check the formulas above. The rectangle is 120 &times; 80.</p>
<div class="widget" data-w="cc-anchor"></div>
<h3>Y points up</h3>
<p>In the DOM, y grows downwards: the top of the page is 0, and a bigger number is lower down. In Cocos, as in school mathematics, y grows <b>upwards</b>. A bigger y is higher on the screen, so moving a card up by 50 means adding 50 to its y. This catches every web developer at least once.</p>
<div class="tiers"><b>DOM</b><div><span class="box">(0, 0) is the top-left corner</span><span class="box">y grows downwards</span></div><b>Cocos</b><div><span class="box hot">(0, 0) is the parent's anchor</span><span class="box hot">y grows upwards</span></div></div>
<h3>Local and world coordinates</h3>
<p>As the lesson on scenes showed, a node's <code>position</code> is in <b>local coordinates</b>: measured from its parent. Its position in <b>world coordinates</b> is where it ends up in the whole scene. For 2D content under a Canvas, world (0, 0) is the bottom-left corner of the visible area, and the Canvas node itself sits in the middle.</p>
<p>You need to convert whenever two things live under different parents. A tap arrives in world coordinates: to know where it landed on the Table, convert it into Table's space. To move a card from one parent to another without it jumping, take its world position and convert it into the new parent's space.</p>
<pre><code>import { Node, Vec3, UITransform } from 'cc';

function demo(table: Node, card: Node) {
    const ui = table.getComponent(UITransform)!;
    // world to local: this world point, seen from Table
    const local = ui.convertToNodeSpaceAR(new Vec3(400, 300, 0));
    // local to world: where Table's anchor is in the world
    const world = ui.convertToWorldSpaceAR(new Vec3(0, 0, 0));
    // shortcut for a node's own world position
    console.log(local, world, card.worldPosition);
}</code></pre>
<p>The AR at the end of both names means &ldquo;relative to the anchor point&rdquo;: in that space, (0, 0) is the node's anchor.</p>
<h3>Design resolution: one layout for every screen</h3>
<p>Phones come in many shapes, and you do not lay out a scene for each one. You choose one <b>design resolution</b>, for example 720 &times; 1280 for a portrait game, and lay everything out in those units. When the game runs, the engine scales that design to fit the real screen. How it scales is set in Project Settings, under Project Data, with two checkboxes:</p>
<table>
<tr><th>Ticked</th><th>Always visible</th><th>On a screen of a different shape</th></tr>
<tr><td>Fit Width</td><td>The full design width</td><td>A taller screen shows extra space above and below. A wider one cuts some off the top and bottom.</td></tr>
<tr><td>Fit Height</td><td>The full design height</td><td>A wider screen shows extra space at the sides. A narrower one cuts some off the sides.</td></tr>
<tr><td>Both</td><td>The whole design</td><td>Empty bars appear where the shapes differ</td></tr>
<tr><td>Neither</td><td>The screen is always filled</td><td>Part of the design is cut off on one side</td></tr>
</table>
<p>For example, a portrait game can tick Fit Width and draw its background a little taller than the design, so that the extra space on long phones never looks empty. <code>view.getVisibleSize()</code> tells you how much of the design area is actually on screen.</p>
<h3>Widget: sticking to the edges</h3>
<p>With extra space above and below on tall phones, a score placed at a fixed y can end up floating in the middle. The <b>Widget</b> component fixes this. Add it to a node and tick the edges it should stick to, with a distance for each, such as 20 from the top and 20 from the right. The engine then works out the position on every screen, relative to the parent. Tick both left and right, and the node also stretches to the parent's width, much like <code>left: 0; right: 0</code> in CSS.</p>
<pre><code>import { _decorator, Component, Widget } from 'cc';
const { ccclass } = _decorator;

@ccclass('PinTopRight')
export class PinTopRight extends Component {
    onLoad() {
        const w = this.getComponent(Widget) ?? this.addComponent(Widget);
        w.isAlignTop = true;
        w.top = 20;
        w.isAlignRight = true;
        w.right = 20;
        w.updateAlignment();   // apply it now
    }
}</code></pre>
<h3>Going deeper</h3>
<ul>
<li><b>Scale and rotation turn around the anchor.</b> A card with anchor (0.5, 0) grows upwards from its bottom edge and spins around its bottom centre. Choose the anchor for how a node should animate, not only for where it sits.</li>
<li><b>Bounding boxes.</b> <code>getBoundingBox()</code> on a UITransform gives the node's rectangle in its parent's space, and <code>getBoundingBoxToWorld()</code> gives it in world space. Use them to test whether two cards overlap.</li>
<li><b>Touch positions.</b> A touch event's <code>getUILocation()</code> is in the same world space as the UI. Convert it with <code>convertToNodeSpaceAR</code> to know where on a node the finger landed.</li>
<li><b>Widgets cost a little.</b> A Widget whose align mode is ALWAYS realigns whenever it or its parent changes, and with many moving nodes that work adds up. For something that only needs to adjust when the window size changes, ON_WINDOW_RESIZE is enough.</li>
</ul>`,
    tryNote: 'Paste into the browser console while your project is running in Preview.',
    try: [
      ['cc.view.getDesignResolutionSize()', 'The design resolution set in Project Settings.'],
      ['cc.view.getVisibleSize()', 'How much of the design area this screen shows. Compare it with the design resolution, then switch the preview to another device size and run it again.'],
      ['cc.find("Canvas").worldPosition', 'The Canvas sits in the middle of the screen, so this is about half the visible width and half the visible height.'],
      ['cc.find("Canvas").getComponent("cc.UITransform").anchorPoint', 'The anchor point of the Canvas: (0.5, 0.5), its centre.']
    ],
    own: `Take a screen you have built and pick three nodes. For each one, write down its anchor, position and size, and work out its four edges by hand with the formulas above. Check one of them in the console with <code>getBoundingBoxToWorld()</code>. If any element should hug an edge of the screen, replace its fixed position with a Widget and preview on two different device sizes.`,
    terms: [['anchor point', '錨點'], ['content size', '內容尺寸'], ['coordinate space', '座標空間'], ['local coordinates', '本地座標'], ['world coordinates', '世界座標'], ['design resolution', '設計解析度'], ['Widget component', 'Widget 元件']],
    quiz: [
      { q: "A node is 200 wide, its anchor x is 0, and its position x is 100. Where is its left edge?",
        a: ["0", "-100", "100", "200"], c: 2,
        why: "Left = x - ax × w = 100 - 0 × 200 = 100. With anchor x at 0, the box starts at the position." },
      { q: "You add 50 to a node's y. Which way does it move on screen?",
        a: ["Up", "Down", "Left", "It depends on the anchor"], c: 0,
        why: "In Cocos the y axis points up, the opposite of the DOM." },
      { q: "A score label must stay 20 pixels below the top of the screen on every phone. What is the right tool?",
        a: ["A fixed position worked out on one phone", "A different design resolution", "An anchor of (0.5, 0.5)", "A Widget aligned to the top, with a distance of 20"], c: 3,
        why: "A Widget works out the position from the parent's edges on every screen size." }
    ]
  },
  {
    id: 'cc-assets', lv: 2, mins: 15,
    title: 'Assets: pictures, sounds, prefabs and loading',
    zh: '資源就是放在 assets 資料夾、被編輯器匯入的檔案：圖片、圖集、音效、Prefab、場景。每個資源都有 uuid，記在 .meta 檔裡。Prefab 是可以一直複製的節點樹，就像一個 .vue 檔。執行中載入是非同步的；用完要釋放，手機的貼圖記憶體很有限。',
    body: `
<p>Everything your game uses that is not code is an <b>asset</b>: pictures, sounds, fonts, animations, even the scenes themselves. In the editor they live in the Assets panel, which shows the project's <code>assets</code> folder. Drop a file into it and the editor imports it, turning it into something the engine can use quickly.</p>
<h3>The kinds you will meet</h3>
<table>
<tr><th>Asset</th><th>What it is</th><th>Used by</th></tr>
<tr><td>Image</td><td>A .png or .jpg file. The engine turns it into a <b>texture</b>: a picture loaded onto the GPU.</td><td>Everything that draws</td></tr>
<tr><td>SpriteFrame</td><td>A rectangle of a texture, ready to draw: the whole image, or one part of it</td><td>The <code>Sprite</code> component</td></tr>
<tr><td>Sprite atlas</td><td>Many small pictures packed into one big image, plus a list of where each one is</td><td>Sprites that share it</td></tr>
<tr><td>Audio clip</td><td>A sound file, such as .mp3</td><td>The <code>AudioSource</code> component</td></tr>
<tr><td>Prefab</td><td>A saved node tree, ready to copy</td><td>Your scripts, through <code>instantiate</code></td></tr>
<tr><td>Scene</td><td>A whole screen: a node tree saved as a file</td><td><code>director.loadScene</code></td></tr>
</table>
<h3>Why atlases</h3>
<p>Imagine 52 card faces as 52 separate images. The GPU has to switch pictures before drawing each card, and every switch costs time. Pack all 52 into one <b>atlas</b> and the engine can often draw them together in one batch. Fewer, bigger images also mean fewer files to download. You can make an atlas with an outside tool such as TexturePacker, or let the editor do it: create an Auto Atlas in a folder, and the images in that folder are packed together when you build.</p>
<h3>The asset database and uuids</h3>
<p>When the editor imports a file, it gives it a <b>uuid</b>: a long id that no other asset shares. It writes that uuid, together with the import settings, into a small <code>.meta</code> file next to the original. Scenes and prefabs point at assets by uuid, never by file name.</p>
<div class="flow"><span class="box">card-back.png<small>your file</small></span><span class="arr">&rarr;</span><span class="box">card-back.png.meta<small>uuid and import settings</small></span><span class="arr">&rarr;</span><span class="box">library folder<small>the imported, engine-ready copy</small></span><span class="arr">&rarr;</span><span class="box hot">A scene file<small>points at the uuid</small></span></div>
<p>This is why you can rename or move an asset inside the Assets panel and nothing breaks: the uuid stays the same. It is also why you must not move files around in Finder without their .meta files. Lose the .meta and the file gets a new uuid, and every scene that used it now points at nothing. Commit the .meta files to git. The <code>library</code> and <code>temp</code> folders are generated by the editor and can be rebuilt, so they stay out of git.</p>
<h3>Prefabs: a node tree you can copy</h3>
<p>Building one card by hand is fine. Building 52 is not. Build one card in the scene, with its picture, its label and its script, then drag the node from the Hierarchy panel into the Assets panel. That saves it as a <b>Prefab</b>. From then on your code can make as many fresh copies as it likes:</p>
<pre><code>import { _decorator, Component, Prefab, instantiate } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Deck')
export class Deck extends Component {
    @property(Prefab)
    cardPrefab: Prefab | null = null;   // drag the prefab here in the Inspector

    draw(index: number) {
        if (!this.cardPrefab) return;
        const card = instantiate(this.cardPrefab);  // a new copy of the whole tree
        card.setPosition(index * 40, 0, 0);
        this.node.addChild(card);                   // nothing shows until it has a parent
    }
}</code></pre>
<p>Edit the prefab once and every copy made from it afterwards changes, along with every instance already placed in your scenes. A prefab can also contain other prefabs.</p>
<h3>Vue comparison</h3>
<table>
<tr><th>Cocos</th><th>Vue</th></tr>
<tr><td>A Prefab asset</td><td>A <code>.vue</code> file: a reusable piece, defined once</td></tr>
<tr><td><code>instantiate</code>, then <code>addChild</code></td><td>Writing <code>&lt;Card /&gt;</code> in a template: a new instance is created and mounted</td></tr>
<tr><td>Fields marked with <code>@property</code>, set in the Inspector</td><td>Props</td></tr>
<tr><td>A prefab inside a prefab</td><td>A component used inside another component</td></tr>
</table>
<p>One difference: Vue creates instances for you from the template. In Cocos, prefabs you place in a scene in the editor are created when the scene loads, but anything dynamic, such as one card per round, you create yourself in code.</p>
<h3>Loading while the game runs</h3>
<p>Assets that a scene uses are loaded together with the scene. Sometimes you need something only later: a card design the player picks, a level they open. For that, put the assets in a folder named <code>resources</code> inside <code>assets</code>, and load them by path:</p>
<pre><code>import { _decorator, Component, Sprite, SpriteFrame, resources } from 'cc';
const { ccclass } = _decorator;

@ccclass('CardBack')
export class CardBack extends Component {
    start() {
        // path inside assets/resources, without the file extension
        resources.load('cards/back/spriteFrame', SpriteFrame, (err, frame) =&gt; {
            if (err) { console.error(err); return; }
            this.getComponent(Sprite)!.spriteFrame = frame;
        });
        console.log('this line runs first');
    }
}</code></pre>
<p>Note the <code>/spriteFrame</code> at the end of the path. The image file is <code>cards/back.png</code>, but a Sprite needs the SpriteFrame inside it, and in Cocos Creator 3.x you ask for it by adding its name to the path.</p>
<h3>Why loading is asynchronous</h3>
<p>Reading a file takes time: from storage on a phone, or over the network in a browser, sometimes hundreds of milliseconds. If <code>resources.load</code> waited for the file, the game loop would stop and the screen would freeze. So the call is <b>asynchronous</b>: it returns at once, the loop keeps running, and your callback runs later, when the file has arrived. That is why &ldquo;this line runs first&rdquo; is printed before the picture appears. Code that needs the asset must go inside the callback, or after an <code>await</code> if you wrap the call in a Promise, as the TypeScript track's lesson on asynchronous code shows.</p>
<h3>Asset Bundles: load whole groups on demand</h3>
<p>The <code>resources</code> folder is one built-in <b>Asset Bundle</b>. You can make your own: select a folder in the Assets panel and tick Is Bundle in the Inspector. Each bundle is built as its own package, and its assets are downloaded only when you ask for them:</p>
<pre><code>import { assetManager, Prefab, instantiate, Node } from 'cc';

function openShop(parent: Node) {
    assetManager.loadBundle('shop', (err, bundle) =&gt; {
        if (err) { console.error(err); return; }
        bundle.load('ShopPanel', Prefab, (err2, prefab) =&gt; {
            if (err2) { console.error(err2); return; }
            parent.addChild(instantiate(prefab));
        });
    });
}</code></pre>
<p>Vue comparison: this is code splitting. A lazy route such as <code>component: () =&gt; import('./Shop.vue')</code> keeps the shop out of the first download. A bundle does the same for game assets. The first screen appears sooner, and players who never open the shop never download it.</p>
<h3>Releasing assets, and why phones care</h3>
<p>A loaded picture sits in memory as an uncompressed texture, and its size has nothing to do with the size of the .png file. A 2048 &times; 2048 image takes 2048 &times; 2048 &times; 4 bytes, which is 16 MB, even if the file was 300 KB. Load enough of those and a phone may close your game without warning.</p>
<p>So when you are done with something you loaded yourself, release it:</p>
<pre><code>import { assetManager, resources, SpriteFrame, Asset } from 'cc';

// release one asset you loaded by path
resources.release('cards/back/spriteFrame', SpriteFrame);

// or release an asset object you are holding
function drop(asset: Asset) {
    assetManager.releaseAsset(asset);
}</code></pre>
<p>Release only what is truly no longer shown: a sprite still using a released texture can turn blank. The engine keeps a <b>reference count</b> for each asset, so that a texture still needed by another asset is not freed by mistake. If you keep a loaded asset in a field for later, call <code>addRef()</code> on it to say &ldquo;I am using this&rdquo;, and <code>decRef()</code> when you are done. For whole scenes, tick Auto Release Assets on a scene, and what it used is freed when you switch to another scene, apart from what the next scene also needs.</p>
<h3>Going deeper</h3>
<ul>
<li><b>Everything in resources ships.</b> Assets outside <code>resources</code> and other bundles go into the build only if something in the build uses them. Everything inside <code>resources</code> ships whether it is used or not, because the engine cannot know which paths your code will ask for. Keep that folder lean.</li>
<li><b>Compressed textures.</b> For phones, you can choose GPU-friendly compressed formats such as ASTC or ETC2 in the texture compression settings. A texture stored that way takes a fraction of the memory.</li>
<li><b>Preloading.</b> <code>director.preloadScene('Game')</code> downloads the next scene while the player is still on the menu, so the switch is much quicker.</li>
</ul>`,
    tryNote: 'Paste into the browser console while Preview is running. The last item is done in Finder.',
    try: [
      ['cc.assetManager.bundles.forEach(b => console.log(b.name))', 'The bundles loaded right now, such as main and internal, plus resources if your project has that folder.'],
      ['cc.assetManager.assets.count', 'How many assets are in memory now. Load something or switch scenes, then run it again.'],
      ['cc.resources.load("cards/back/spriteFrame", cc.SpriteFrame, (err, a) => console.log(err || a))', 'Replace the path with an image inside your own resources folder. The result is printed a moment later, not at once.'],
      ['In Finder: open your project folder, find any image inside assets, and open the .meta file next to it with a text editor', 'The uuid line is the id that scenes use to point at this image.']
    ],
    own: `In a project of your own, make a card prefab and a <code>Deck</code> script that lays five cards in a row from it. Then move the card-back image into a <code>resources</code> folder and load it by path while the game runs, logging one line before the call and one inside the callback to see the order. Finally, work out how much GPU memory your three largest images take, using width &times; height &times; 4.`,
    terms: [['asset', '資源'], ['texture', '貼圖'], ['sprite atlas', '圖集'], ['uuid', '唯一識別碼'], ['prefab', '預製體'], ['instantiate', '實例化'], ['asynchronous', '非同步'], ['reference count', '參照計數']],
    quiz: [
      { q: "Why must a .meta file always travel with its asset?",
        a: ["It holds the picture itself", "It holds the uuid that scenes and prefabs use to find the asset", "It makes the file smaller", "Git refuses the asset without it"], c: 1,
        why: "Scenes point at uuids, not file names. A lost .meta means a new uuid and broken references." },
      { q: "What does instantiate(cardPrefab) give you?",
        a: ["The path of the prefab file", "A promise that resolves later", "Nothing; it changes the prefab itself", "A new node tree copied from the prefab, which appears once you add it to a parent"], c: 3,
        why: "It makes a fresh copy of the saved tree. Add it to a parent in the scene to see it." },
      { q: "A 1024 × 1024 PNG file is 200 KB. Roughly how much GPU memory does it take once loaded as an ordinary texture?",
        a: ["200 KB", "1 MB", "4 MB", "16 MB"], c: 2,
        why: "1024 × 1024 pixels × 4 bytes each is 4 MB. The file size does not matter once it is a texture." }
    ]
  }
  ]
});
