DEEP({ 'pro-attack': `
<p>上一課給了你一張攻擊的階段表：偵察、初始入侵、持續潛伏、權限提升、憑證存取、橫向移動、資料外洩，還有一句很重要的話——防守方只要在其中一步擋下或發現，整條鏈就斷了。這一章把那句話變成一套可以操作的功夫：我們會先把「攻擊是一連串步驟」這件事徹底想通，再學防守方和攻擊方共通的語言 MITRE ATT&amp;CK（戰術、技術、程序到底差在哪、偵測涵蓋怎麼畫出來），然後一個階段一個階段看它會留下什麼痕跡、防守方最該在哪裡下警報，最後用一個小型雲端遊戲公司被入侵的完整案例，從<b>防守方的角度</b>走一遍，標出每一道控制措施會在哪裡把攻擊擋下來。整章都站在守方這一邊——我們學攻擊，是為了更會防守。</p>

<h3><span class="badge lv1">基礎</span>一、攻擊是一條鏈，不是一次爆破</h3>
<p>電影裡駭客敲幾行字就進了系統，那是演的。真實的入侵像小偷闖空門：要先踩點（這家人幾點出門）、找到一扇沒鎖好的窗、爬進去、找到保險箱、撬開、把東西搬出來、再從容離開。<b>每一步都得成功，下一步才做得下去。</b>這對防守方是天大的好消息——你不需要每一步都防住，你只要在任何一步把鏈子剪斷，整場攻擊就停在那裡。</p>
<figure class="figure"><svg viewBox="0 0 660 190" class="fg" style="width:100%;max-width:660px" role="img" aria-label="攻擊鏈七個環節從偵察到外洩，剪斷任何一環，後面的環節就無法進行">
<text x="330" y="22" text-anchor="middle" class="fg-t lg">攻擊鏈：每一環都要成功才能往下</text>
<rect x="16" y="44" width="72" height="40" rx="6" class="fg-b"/><text x="52" y="69" text-anchor="middle" class="fg-t sm">偵察</text>
<rect x="108" y="44" width="72" height="40" rx="6" class="fg-b"/><text x="144" y="69" text-anchor="middle" class="fg-t sm">入侵</text>
<rect x="200" y="44" width="72" height="40" rx="6" class="fg-b"/><text x="236" y="69" text-anchor="middle" class="fg-t sm">潛伏</text>
<rect x="292" y="44" width="72" height="40" rx="6" class="fg-b warm"/><text x="328" y="69" text-anchor="middle" class="fg-t warm">提權</text>
<rect x="384" y="44" width="72" height="40" rx="6" class="fg-b"/><text x="420" y="69" text-anchor="middle" class="fg-t sm">偷鑰</text>
<rect x="476" y="44" width="72" height="40" rx="6" class="fg-b"/><text x="512" y="69" text-anchor="middle" class="fg-t sm">橫移</text>
<rect x="568" y="44" width="72" height="40" rx="6" class="fg-b"/><text x="604" y="69" text-anchor="middle" class="fg-t sm">外洩</text>
<line x1="88" y1="64" x2="104" y2="64" class="fg-l"/><line x1="180" y1="64" x2="196" y2="64" class="fg-l"/><line x1="272" y1="64" x2="288" y2="64" class="fg-l on"/><line x1="364" y1="64" x2="380" y2="64" class="fg-l"/><line x1="456" y1="64" x2="472" y2="64" class="fg-l"/><line x1="548" y1="64" x2="564" y2="64" class="fg-l"/>
<text x="328" y="112" text-anchor="middle" class="fg-t acc">在這裡剪斷</text>
<path d="M328 84 L318 104 M328 84 L338 104" class="fg-l on"/>
<line x1="364" y1="130" x2="640" y2="130" class="fg-l dim dash"/>
<text x="500" y="124" text-anchor="middle" class="fg-t sm">後面這些就做不成了</text>
</svg><figcaption>攻擊方要七環全過；防守方只要剪斷任何一環就贏。這就是為什麼「縱深防禦」——每一環都放一道關卡——這麼有效。</figcaption></figure>
<p>把這個觀念再翻一次，就得到一句面試金句：<b>大家常說「防守方每次都得做對，攻擊方只要對一次」，但在一個監測做得夠齊全的系統裡，反過來才對——攻擊者每一環都不能被發現，防守方只要發現一次就夠了。</b>這也是為什麼現代資安把「偵測」看得跟「預防」一樣重：就算你擋不住每一環，只要你能在某一環發現它，就能在它造成大傷害之前把它踢出去。</p>

<h3><span class="badge lv2">進階</span>二、共通語言：戰術、技術、程序</h3>
<p>防守方、攻擊方、資安廠商要能對話，得先有一套大家都認的名詞。這套名詞就是 MITRE ATT&amp;CK，它把攻擊行為分成三層，由粗到細：<b>戰術</b>（tactic）、<b>技術</b>（technique）、<b>程序</b>（procedure），合起來常簡稱 TTP。這三個字非常容易混，用一個比喻一次講清楚。</p>
<figure class="figure"><svg viewBox="0 0 640 250" class="fg" style="width:100%;max-width:640px" role="img" aria-label="戰術技術程序三層：戰術是為什麼，技術是怎麼做的一類，程序是這次的具體做法">
<rect x="20" y="30" width="180" height="190" rx="8" class="fg-b alt"/>
<text x="110" y="54" text-anchor="middle" class="fg-t alt">戰術 tactic</text>
<text x="110" y="78" text-anchor="middle" class="fg-t sm">＝為什麼</text>
<text x="110" y="100" text-anchor="middle" class="fg-t sm">攻擊者的目標</text>
<text x="110" y="140" text-anchor="middle" class="fg-t sm">例：</text>
<text x="110" y="162" text-anchor="middle" class="fg-t sm">「憑證存取」</text>
<text x="110" y="184" text-anchor="middle" class="fg-t sm">（我要拿到金鑰）</text>
<rect x="230" y="30" width="180" height="190" rx="8" class="fg-b hot"/>
<text x="320" y="54" text-anchor="middle" class="fg-t acc">技術 technique</text>
<text x="320" y="78" text-anchor="middle" class="fg-t sm">＝怎麼做的一類</text>
<text x="320" y="100" text-anchor="middle" class="fg-t sm">達成目標的方法</text>
<text x="320" y="140" text-anchor="middle" class="fg-t sm">例：</text>
<text x="320" y="162" text-anchor="middle" class="fg-t sm">「從中繼資料</text>
<text x="320" y="184" text-anchor="middle" class="fg-t sm">服務取憑證」</text>
<rect x="440" y="30" width="180" height="190" rx="8" class="fg-b"/>
<text x="530" y="54" text-anchor="middle" class="fg-t">程序 procedure</text>
<text x="530" y="78" text-anchor="middle" class="fg-t sm">＝這次的具體做法</text>
<text x="530" y="100" text-anchor="middle" class="fg-t sm">某團體的獨門實作</text>
<text x="530" y="140" text-anchor="middle" class="fg-t sm">例：</text>
<text x="530" y="162" text-anchor="middle" class="fg-t sm">某惡意程式</text>
<text x="530" y="184" text-anchor="middle" class="fg-t sm">的實際步驟</text>
<line x1="200" y1="125" x2="228" y2="125" class="fg-l"/><polygon points="228,125 220,120.5 220,129.5" class="fg-a"/>
<line x1="410" y1="125" x2="438" y2="125" class="fg-l"/><polygon points="438,125 430,120.5 430,129.5" class="fg-a"/>
<text x="320" y="240" text-anchor="middle" class="fg-t sm">越往右越具體，攻擊者越容易換；越往左越抽象，越難換</text>
</svg><figcaption>戰術是「為了什麼」，技術是「用哪一類方法」，程序是「這一次的具體做法」。防守若只盯最右邊的具體程序，攻擊者改一下就躲掉了。</figcaption></figure>
<p>用一句話串起來：攻擊者的<b>戰術</b>是「憑證存取」（他想拿到金鑰），他用的<b>技術</b>是「從雲端中繼資料服務取出臨時憑證」，而他的<b>程序</b>是某個惡意程式裡那段具體的實作。ATT&amp;CK 這份免費公開的目錄，把大家看過的所有技術都編了號、附上真實案例和偵測建議，就像一本攻擊手法的百科全書。它的價值不在教你攻擊，而在<b>讓每個團隊用同樣的名字稱呼同樣的行為</b>——紅隊說「我用了這個技術」，藍隊就能查「我偵測得到它嗎」。</p>

<h3><span class="badge lv2">進階</span>三、偵測涵蓋怎麼畫出來</h3>
<p>有了共通的技術清單，防守方就能做一件很有力的事：把「我偵測得到哪些技術、哪些是盲點」畫成一張熱力圖。做法是拿 ATT&amp;CK 的矩陣（橫軸是戰術，直欄裡每一格是一個技術），把你有偵測規則的格子塗綠，沒有的留白。塗完，你的盲點就一目了然。</p>
<figure class="figure"><svg viewBox="0 0 640 240" class="fg" style="width:100%;max-width:640px" role="img" aria-label="ATT&CK 涵蓋矩陣：每欄是一個戰術，格子塗綠代表偵測得到，留白代表盲點">
<text x="320" y="22" text-anchor="middle" class="fg-t">把偵測得到的技術塗綠，盲點自己現形</text>
<text x="70" y="52" text-anchor="middle" class="fg-t sm">初始入侵</text><text x="190" y="52" text-anchor="middle" class="fg-t sm">提權</text><text x="310" y="52" text-anchor="middle" class="fg-t sm">憑證存取</text><text x="430" y="52" text-anchor="middle" class="fg-t sm">橫向移動</text><text x="550" y="52" text-anchor="middle" class="fg-t sm">外洩</text>
<rect x="20" y="62" width="100" height="30" rx="4" class="fg-b hot"/><rect x="140" y="62" width="100" height="30" rx="4" class="fg-b hot"/><rect x="260" y="62" width="100" height="30" rx="4" class="fg-b"/><rect x="380" y="62" width="100" height="30" rx="4" class="fg-b hot"/><rect x="500" y="62" width="100" height="30" rx="4" class="fg-b"/>
<rect x="20" y="98" width="100" height="30" rx="4" class="fg-b"/><rect x="140" y="98" width="100" height="30" rx="4" class="fg-b hot"/><rect x="260" y="98" width="100" height="30" rx="4" class="fg-b hot"/><rect x="380" y="98" width="100" height="30" rx="4" class="fg-b"/><rect x="500" y="98" width="100" height="30" rx="4" class="fg-b hot"/>
<rect x="20" y="134" width="100" height="30" rx="4" class="fg-b hot"/><rect x="140" y="134" width="100" height="30" rx="4" class="fg-b"/><rect x="260" y="134" width="100" height="30" rx="4" class="fg-b"/><rect x="380" y="134" width="100" height="30" rx="4" class="fg-b"/><rect x="500" y="134" width="100" height="30" rx="4" class="fg-b"/>
<rect x="260" y="98" width="100" height="30" rx="4" class="fg-l on" fill="none"/>
<text x="90" y="200" class="fg-t sm acc">■ 綠＝偵測得到</text>
<text x="330" y="200" class="fg-t sm">□ 白＝盲點，這一格要補</text>
<text x="320" y="224" text-anchor="middle" class="fg-t sm">看這張圖，就知道下一條偵測規則該寫在哪</text>
</svg><figcaption>一欄一個戰術，一格一個技術。塗綠的是你守得住的，留白的是攻擊者可以安全走過的路。這張圖把「我們到底守得怎樣」變成看得見的東西。</figcaption></figure>
<p>這張圖在面試裡很好用。當面試官問「你會怎麼衡量一個防守團隊的能力」，你不要只答「看有沒有被打進來」，而是答：「把我們的偵測規則對照 ATT&amp;CK 畫一張涵蓋矩陣，找出盲點，再依據『攻擊者最常走哪幾格』排優先順序去補。」這就是專業和業餘的差別——<b>把防守從『感覺』變成『可以量的東西』。</b></p>

<h3><span class="badge lv3">專業</span>四、每一階段的痕跡，和你最該下警報的地方</h3>
<p>防守的核心技巧是：知道攻擊者走到每一階段時，會在日誌裡留下什麼痕跡，以及哪一個痕跡最值得你押注去偵測。下面這張表就是藍隊的作戰地圖——注意「最佳偵測點」那一欄，它告訴你把有限的力氣花在哪裡回報最高。</p>
<table>
<tr><th>階段</th><th>典型痕跡（防守方看得到的）</th><th>最佳偵測點</th></tr>
<tr><td><b>偵察</b></td><td>外部掃描器對你的連接埠一輪一輪探</td><td>難防也不急；重點是「知道自己從外面看起來長怎樣」</td></tr>
<tr><td><b>初始入侵</b></td><td>一次來自陌生國家的登入、一個沒看過的行程被網頁伺服器帳號啟動</td><td>「不可能的移動」：同一帳號短時間在兩個遙遠地點登入</td></tr>
<tr><td><b>持續潛伏</b></td><td>多了一個使用者、authorized_keys 多了一把金鑰、多了一個排程工作</td><td>新使用者、新金鑰、新排程一出現就發警報</td></tr>
<tr><td><b>權限提升</b></td><td>一般帳號忽然用了 sudo、碰了 Docker socket</td><td>非管理帳號執行提權相關指令</td></tr>
<tr><td><b>憑證存取</b></td><td>有人讀取 .env、金鑰檔、或對中繼資料服務發出請求</td><td>行程存取中繼資料服務、或大量讀取金鑰檔</td></tr>
<tr><td><b>橫向移動</b></td><td>一台機器忽然去連它平常從不連的另一台</td><td>偏離「平常連線關係」的內部連線</td></tr>
<tr><td><b>資料外洩</b></td><td>大量資料往外送、對外連到陌生位址</td><td>對外流量異常放大、連到從沒連過的目的地</td></tr>
</table>
<p>看出一個模式沒有？<b>最好的偵測點，幾乎都是「這件事偏離了平常的樣子」。</b>一個帳號平常只從台灣登入、忽然從別的地方來；一台資料庫伺服器平常只被後端連、忽然自己往外連。防守的底層功夫，就是先把「正常長什麼樣」摸清楚，異常才顯得出來。這也是為什麼收集日誌要有優先順序——身分登入紀錄和雲端稽核日誌，通常是投報率最高的兩項。</p>

<h3><span class="badge lv3">專業</span>五、一個小型雲端遊戲公司被入侵：從防守方走一遍</h3>
<p>把前面所有東西合起來，用一個很可能真的發生的案例。整段都從<b>防守方事後重建</b>的角度講：攻擊走了哪幾環、我們在日誌裡會看到什麼、以及每一環本來有哪一道控制措施可以把它擋下來。</p>
<figure class="figure"><svg viewBox="0 0 660 330" class="fg" style="width:100%;max-width:660px" role="img" aria-label="入侵的六個步驟由上往下，右側標出每一步本來可以擋下它的控制措施">
<text x="150" y="22" text-anchor="middle" class="fg-t lg warm">攻擊走的路</text>
<text x="510" y="22" text-anchor="middle" class="fg-t lg acc">本來能擋下它的關卡</text>
<rect x="20" y="36" width="270" height="36" rx="6" class="fg-b warm"/><text x="32" y="59" class="fg-t sm">1 開發者筆電中了假工作邀約</text>
<rect x="370" y="36" width="270" height="36" rx="6" class="fg-b hot"/><text x="382" y="59" class="fg-t sm">郵件過濾·端點防護·資安意識</text>
<rect x="20" y="82" width="270" height="36" rx="6" class="fg-b warm"/><text x="32" y="105" class="fg-t sm">2 惡意程式收走金鑰與雲端憑證</text>
<rect x="370" y="82" width="270" height="36" rx="6" class="fg-b hot"/><text x="382" y="105" class="fg-t sm">金鑰加通關密語·改用硬體金鑰</text>
<rect x="20" y="128" width="270" height="36" rx="6" class="fg-b warm"/><text x="32" y="151" class="fg-t sm">3 用 SSH 金鑰登入伺服器</text>
<rect x="370" y="128" width="270" height="36" rx="6" class="fg-b hot"/><text x="382" y="151" class="fg-t sm">SSH 不對外·陌生國家登入告警</text>
<rect x="20" y="174" width="270" height="36" rx="6" class="fg-b warm"/><text x="32" y="197" class="fg-t sm">4 讀出每個容器的環境變數</text>
<rect x="370" y="174" width="270" height="36" rx="6" class="fg-b hot"/><text x="382" y="197" class="fg-t sm">機密放管理服務·不塞環境變數</text>
<rect x="20" y="220" width="270" height="36" rx="6" class="fg-b warm"/><text x="32" y="243" class="fg-t sm">5 其中一個容器有錢包私鑰</text>
<rect x="370" y="220" width="270" height="36" rx="6" class="fg-b hot"/><text x="382" y="243" class="fg-t sm">私鑰交隔離簽署服務保管</text>
<rect x="20" y="266" width="270" height="36" rx="6" class="fg-b warm"/><text x="32" y="289" class="fg-t sm">6 一筆交易把錢包搬空</text>
<rect x="370" y="266" width="270" height="36" rx="6" class="fg-b hot"/><text x="382" y="289" class="fg-t sm">每日上限·熱錢包只放一天份</text>
<line x1="150" y1="72" x2="150" y2="82" class="fg-l warm"/><line x1="150" y1="118" x2="150" y2="128" class="fg-l warm"/><line x1="150" y1="164" x2="150" y2="174" class="fg-l warm"/><line x1="150" y1="210" x2="150" y2="220" class="fg-l warm"/><line x1="150" y1="256" x2="150" y2="266" class="fg-l warm"/>
<text x="330" y="320" text-anchor="middle" class="fg-t sm">左邊任一步被右邊那道關卡擋下，右下角的損失就不會發生</text>
</svg><figcaption>同一場攻擊，左邊是它走的六步，右邊是每一步本來就有的一道關卡。只要任何一道有裝、有開，這場攻擊就停在那一行。</figcaption></figure>
<p>一步一步看防守方的視角：</p>
<ol>
<li><b>入口。</b>一位開發者的筆電因為一份假的工作邀約文件而中毒。防守端看得到的痕跡：端點防護可能攔到那個行程。本來的關卡：郵件過濾、端點防護、還有最便宜的一道——員工知道「不明附件不要開」。</li>
<li><b>偷鑰。</b>惡意程式從家目錄收走 SSH 金鑰和雲端憑證。這一步在筆電上幾乎無聲。本來的關卡：SSH 金鑰加通關密語，或改用拔不走的硬體金鑰，讓偷到的檔案不能直接用。</li>
<li><b>登入。</b>攻擊者拿金鑰登入伺服器——日誌上看起來就是一次正常登入。這正是最關鍵的偵測機會：如果有「陌生國家登入就告警」，這裡就會亮燈。本來的關卡：SSH 根本不對網際網路開放。</li>
<li><b>找鑰。</b>攻擊者讀出每個容器的環境變數。本來的關卡：機密不塞在環境變數裡，改放機密管理服務，並對「大量讀取機密」下偵測。</li>
<li><b>命中。</b>其中一個容器裡放著錢包私鑰。本來的關卡：私鑰根本不該放在應用容器裡，應交給一個隔離的簽署服務保管，應用只能「請它簽」，拿不到鑰匙本身。</li>
<li><b>搬空。</b>一筆交易把錢包清空。本來的關卡：簽署服務設每日上限、熱錢包只放一天份的周轉金——就算前面全破，損失也被封頂。</li>
</ol>
<p>這個案例的教學重點不是「怎麼攻擊」，而是<b>縱深防禦</b>：你不需要每一道都完美，你需要的是「有好幾道」。攻擊者要全部繞過才會得手；你只要有一道生效就贏。最後那道「每日上限 + 小額熱錢包」特別值得記——它是一道「就算其他全失守，也能把損失封頂」的關卡，面試很愛問這種「單點改變、限制最大損失」的設計。</p>

<h3><span class="badge lv4">專家</span>六、潛伏時間：為什麼偵測比你想的更重要</h3>
<p><b>潛伏時間</b>（dwell time）是指攻擊者進來之後、到被發現之前，在你系統裡待了多久。在監控做得差的組織，這個數字是用「週」甚至「月」在算的。這就是偵測的全部意義所在：攻擊鏈不是瞬間完成的，中間有一段你看得到、也來得及反應的時間窗，問題只在你有沒有在看。</p>
<figure class="figure"><svg viewBox="0 0 640 200" class="fg" style="width:100%;max-width:640px" role="img" aria-label="潛伏時間時間軸：入侵後經過很長一段才被發現，期間攻擊者碰到的範圍越來越大">
<line x1="40" y1="60" x2="620" y2="60" class="fg-l dim"/><polygon points="626,60 618,55.5 618,64.5" class="fg-a"/>
<circle cx="80" cy="60" r="7" class="fg-lamp on"/><text x="80" y="42" text-anchor="middle" class="fg-t sm warm">入侵</text>
<circle cx="540" cy="60" r="7" class="fg-lamp on"/><text x="540" y="42" text-anchor="middle" class="fg-t sm acc">被發現</text>
<path d="M80 86 L540 86 L540 150 L80 110 Z" class="fg-l warm" fill="none"/>
<text x="300" y="104" text-anchor="middle" class="fg-t sm warm">潛伏時間（常常是幾週、幾個月）</text>
<text x="300" y="138" text-anchor="middle" class="fg-t sm">每多一天，攻擊者能碰到的範圍就更大</text>
<text x="560" y="175" class="fg-t sm acc">偵測得越早</text>
<text x="80" y="175" class="fg-t sm">這個三角形越小</text>
</svg><figcaption>入侵到發現之間的三角形，就是你的損失。偵測能力決定它在哪裡被切斷——切得越早，攻擊者碰到的東西越少。</figcaption></figure>
<p>把潛伏時間和前面的攻擊鏈疊起來看，你就懂了縱深防禦和偵測的分工：<b>預防</b>是想辦法讓攻擊者卡在前面幾環；<b>偵測</b>是承認「總有一天會有人過關」，所以要在他還在鏈子中段、還沒搬到最值錢的東西之前，發現他、把他踢出去。兩者缺一不可：只做預防，破了就一路到底；只做偵測，天天救火。</p>

<h3><span class="badge lv4">專家</span>七、好的偵測盯「行為」，不盯「指紋」</h3>
<p>最後一個把你和一般人拉開的觀念。偵測可以盯兩種東西：具體的<b>入侵指標</b>（indicator of compromise，例如一個檔案雜湊值、一個 IP、一個網域），或抽象的<b>行為</b>（例如「讀了中繼資料服務的憑證，接著從一個新位址呼叫 API」）。這兩種偵測的壽命，差得非常遠。</p>
<figure class="figure"><svg viewBox="0 0 640 210" class="fg" style="width:100%;max-width:640px" role="img" aria-label="指標型偵測壽命很短攻擊者幾分鐘就換掉，行為型偵測壽命很長難以更改">
<text x="160" y="24" text-anchor="middle" class="fg-t">盯指紋：換一個 IP 就失效</text>
<rect x="40" y="40" width="80" height="34" rx="5" class="fg-b"/><text x="80" y="62" text-anchor="middle" class="fg-t sm">規則：封鎖 IP-A</text>
<line x1="120" y1="57" x2="200" y2="57" class="fg-l"/><polygon points="200,57 192,52.5 192,61.5" class="fg-a"/>
<rect x="210" y="40" width="80" height="34" rx="5" class="fg-b warm"/><text x="250" y="62" text-anchor="middle" class="fg-t sm warm">攻擊者換 IP-B</text>
<text x="160" y="94" text-anchor="middle" class="fg-t sm warm">壽命：幾分鐘</text>
<line x1="20" y1="110" x2="620" y2="110" class="fg-l dim"/>
<text x="160" y="140" text-anchor="middle" class="fg-t">盯行為：很難繞過</text>
<rect x="40" y="156" width="250" height="34" rx="5" class="fg-b hot"/><text x="165" y="178" text-anchor="middle" class="fg-t sm acc">規則：讀憑證後從新位址呼叫 API</text>
<text x="470" y="150" text-anchor="middle" class="fg-t acc">攻擊者要改「做事的方式」</text>
<text x="470" y="172" text-anchor="middle" class="fg-t sm">才躲得掉——成本高得多</text>
<text x="470" y="194" text-anchor="middle" class="fg-t sm acc">壽命：很長</text>
</svg><figcaption>換一個 IP 或檔名，攻擊者只要幾分鐘；但要改掉「他達成目的所必須做的那串動作」，困難得多。所以好偵測盯行為。</figcaption></figure>
<p>為什麼這很重要？因為指標是攻擊者最容易換的東西——換一台伺服器、重新編譯一次程式讓雜湊值變掉，都是幾分鐘的事。但「行為」往往是他<b>為了達成目的而不得不做</b>的動作串，改起來要重新設計整套手法，成本高太多。所以同樣的力氣，寫一條行為型偵測遠比維護一長串會過期的指標划算。這也是「偵測工程」這個新興職位的核心思路：把偵測規則當軟體在維護——寫規則、用安全的方式模擬攻擊來測它、調到很少誤報、記下它響的時候該怎麼辦、放進版本控制。下一課的藍隊會把這套做法講得更細。</p>

<h3>八、常見誤解</h3>
<table>
<tr><th>誤解</th><th>實際上</th></tr>
<tr><td>駭客幾秒就攻破系統</td><td>真實入侵是一連串步驟，中間有一段你看得到、來得及反應的潛伏時間。</td></tr>
<tr><td>防守方每一步都得守住</td><td>攻擊鏈環環相扣，剪斷任何一環就停。你要的是「有好幾道關卡」，不是每一道都完美。</td></tr>
<tr><td>做好預防就不用偵測</td><td>預防遲早會被繞過；偵測是在攻擊者還沒搬到最值錢的東西前發現他。兩者分工，缺一不可。</td></tr>
<tr><td>戰術、技術、程序差不多</td><td>戰術是為什麼、技術是哪一類方法、程序是這次的具體做法。越具體越好換，偵測別只盯最具體那層。</td></tr>
<tr><td>封鎖壞 IP 就能擋住攻擊者</td><td>IP、檔案雜湊這類指標幾分鐘就能換。盯「行為」才有長久的偵測力。</td></tr>
<tr><td>MITRE ATT&amp;CK 是攻擊教學</td><td>它是防守和攻擊的共通目錄，主要價值是給大家同一套名詞、並讓偵測盲點現形。</td></tr>
</table>

<h3>九、跟你的工作連起來</h3>
<ul>
<li><b>後端（Node.js、Go）：</b>你寫的每一個對外端點都是「初始入侵」那一環的候選入口。把「這個輸入如果是惡意的會怎樣」變成反射，等於在替攻擊鏈的第一環加關卡。</li>
<li><b>雲端與容器（Docker、雲端伺服器）：</b>案例裡「讀容器環境變數拿到私鑰」是真實世界最常見的失守點之一。把機密搬出環境變數、改放管理服務，就是在堵「憑證存取」那一環。</li>
<li><b>遊戲 / 即時服務：</b>只要碰到金流或虛擬資產，案例最後那道「每日上限 + 小額熱錢包」就是你最該先裝的一道——它讓「就算被打進來，也賠不多」。</li>
<li><b>日誌習慣：</b>你平常為了除錯而留的登入日誌、API 日誌，就是防守方的眼睛。寫程式時多留一句「誰、從哪、做了什麼」，未來事後重建攻擊鏈時會感謝自己。</li>
</ul>

<h3>十、面試會怎麼問</h3>
<ol>
<li>「描述一下一場典型的入侵會經過哪些階段。防守方最好的機會在哪裡？」</li>
<li>「戰術、技術、程序有什麼不同？為什麼偵測不該只盯程序？」</li>
<li>「MITRE ATT&amp;CK 是什麼？你會怎麼用它來評估一個團隊的防守能力？」</li>
<li>「什麼是潛伏時間？為什麼它讓『偵測』和『預防』一樣重要？」</li>
<li>「給你那個小遊戲公司被偷錢包的案例，只准改一個地方，你改哪裡？為什麼？」</li>
<li>「為什麼盯行為的偵測，比盯 IP 或檔案雜湊的偵測更耐久？」</li>
</ol>
<details class="reveal"><summary>看參考答案</summary>
<ol>
<li>偵察、初始入侵、持續潛伏、權限提升、憑證存取、橫向移動、資料外洩。每一環都要成功下一環才做得下去，所以防守方只要在任何一環擋下或發現，整條鏈就斷。最好的機會通常在「初始入侵」之後、「資料外洩」之前那段潛伏時間裡發現異常。</li>
<li>戰術是攻擊者的目標（為什麼），技術是達成目標的一類方法（怎麼做），程序是某次攻擊的具體實作。程序最容易換——改個檔名、換台機器就不同了——所以偵測若只盯程序，攻擊者微調一下就躲掉；盯技術或行為才耐久。</li>
<li>ATT&amp;CK 是一份公開的攻擊技術目錄，給紅藍隊和廠商共通的詞彙。評估團隊時，把現有偵測規則對照矩陣塗成涵蓋圖，找出盲點，再依攻擊者最常用的技術排序去補。它把防守能力從「感覺」變成「可量」。</li>
<li>潛伏時間是入侵到被發現之間的時長。因為攻擊鏈需要時間走完，這段時間就是防守方反應的窗口。預防會被繞過，偵測則是在這窗口內把攻擊者揪出來、在他造成大傷害前踢掉，所以兩者同等重要。</li>
<li>改「私鑰的保管方式 + 每日上限」。把私鑰從應用容器移到隔離簽署服務、並設每日提領上限、熱錢包只放一天份。這樣就算前面每一步都得逞，單一事件能被搬走的金額也被封頂。這是一個典型的「限制最大損失」設計。</li>
<li>因為 IP、檔案雜湊這類指標是攻擊者最容易換的東西，幾分鐘就能換掉；而「為了達成目的不得不做的那串動作」要改就得重新設計整套手法，成本高得多。所以行為型偵測壽命長、投報率高。</li>
</ol>
</details>

<h3>十一、練功題（做得出來才算真的懂）</h3>
<ol>
<li>把攻擊鏈七個階段默寫出來，每一階段寫一句「防守方在日誌裡會看到什麼」。</li>
<li>拿本課的雲端遊戲公司案例，照你自己的環境重寫一遍：用你真實的機器、你真正放機密的地方。每一步寫下「今天有什麼能擋它、今天有什麼能偵測它」。兩個都寫「沒有」的步驟，就是你要優先處理的。</li>
<li>用「憑證存取」這個戰術，各舉一個技術和一個程序的例子，說明三者的粒度差在哪。</li>
<li>挑三個你偵測得到的攻擊技術、三個你偵測不到的，畫一張自己的迷你涵蓋圖。白格子就是你這個月的功課。</li>
<li>解釋為什麼「封鎖這個壞 IP」是一條壽命很短的偵測規則，再把它改寫成一條盯行為、壽命較長的規則。</li>
<li>用自己的話說明：為什麼在一個監測齊全的系統裡，「攻擊方只要對一次」這句話其實反過來才對？</li>
</ol>
<details class="reveal"><summary>看答案</summary>
<ol>
<li>參考：偵察（外部掃描）、初始入侵（陌生登入或奇怪行程）、潛伏（多了使用者或金鑰）、提權（一般帳號用 sudo）、憑證存取（讀金鑰檔或中繼資料服務）、橫移（連到平常不連的機器）、外洩（對外流量暴增）。</li>
<li>沒有標準答案，重點是你誠實標出「擋不住也偵測不到」的那幾步。那幾步就是你的待辦清單。</li>
<li>戰術：憑證存取。技術：從雲端中繼資料服務取臨時憑證（一類方法）。程序：某惡意程式裡那段具體呼叫的實作。粒度由粗到細，越細越容易被攻擊者換掉。</li>
<li>重點是「白格子現形」這個動作本身——它把你看不見的風險變成一張看得見、可排序的清單。</li>
<li>「封鎖 IP-A」只要攻擊者換成 IP-B 就失效，幾分鐘的事。改寫成例如「任何行程讀取憑證後，立刻從一個新位址對外呼叫 API 就告警」——這盯的是他不得不做的行為，難繞過。</li>
<li>因為攻擊鏈要七環全過，每一環都留痕跡；只要防守方在任何一環發現一次，就能把他踢掉。所以是「攻擊者每一環都不能被發現，防守方只要發現一次」。</li>
</ol>
</details>

<h3>十二、想再挖深</h3>
<ul>
<li><b>MITRE ATT&amp;CK</b>（<a href="https://attack.mitre.org/">attack.mitre.org</a>）：這一章的主角，攻擊技術的公開大目錄，每個技術都附偵測與緩解建議。</li>
<li><b>MITRE ATT&amp;CK Navigator</b>：官方的免費網頁工具，就是用來畫本課那種偵測涵蓋熱力圖的。</li>
<li><b>Atomic Red Team</b>（<a href="https://github.com/redcanaryco/atomic-red-team">github.com/redcanaryco/atomic-red-team</a>）：為許多 ATT&amp;CK 技術提供小而安全的測試，讓你在自己的環境裡驗證「我這條偵測到底響不響」。</li>
<li><b>Lockheed Martin Cyber Kill Chain</b>：攻擊鏈這個觀念的經典出處，和 ATT&amp;CK 互補，面試常被一起問。</li>
<li><b>Verizon Data Breach Investigations Report（DBIR）</b>：每年一份、免費，用大量真實案例統計「攻擊者實際上最常怎麼得手」，幫你把防守力氣花在對的地方。</li>
</ul>
` });
