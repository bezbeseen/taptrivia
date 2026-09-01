(() => {
  'use strict';

  const EVENTS={
    'U.S. History':[
      ['The Declaration of Independence was adopted by the Continental Congress.',1776],
      ['The U.S. Constitution was signed in Philadelphia.',1787],
      ['George Washington became the first president of the United States.',1789],
      ['The Louisiana Purchase doubled the size of the United States.',1803],
      ['The War of 1812 began between the United States and Britain.',1812],
      ['The Erie Canal opened, linking the Great Lakes with the Hudson River.',1825],
      ['California became the 31st state.',1850],
      ['The American Civil War began with the attack on Fort Sumter.',1861],
      ['The Emancipation Proclamation took effect.',1863],
      ['The American Civil War ended.',1865],
      ['The transcontinental railroad was completed at Promontory Summit.',1869],
      ['Yellowstone became the first national park in the United States.',1872],
      ['The Statue of Liberty was dedicated in New York Harbor.',1886],
      ['The first modern Olympic Games were held in Athens.',1896],
      ['The Wright brothers completed the first powered airplane flight.',1903],
      ['The Panama Canal opened to commercial traffic.',1914],
      ['Women gained the constitutional right to vote nationwide under the 19th Amendment.',1920],
      ['The first talking feature film, The Jazz Singer, was released.',1927],
      ['The New York Stock Exchange crash helped mark the beginning of the Great Depression.',1929],
      ['The Golden Gate Bridge opened to the public.',1937],
      ['The United States entered World War II after the attack on Pearl Harbor.',1941],
      ['World War II ended.',1945],
      ['Jackie Robinson broke Major League Baseball’s modern color barrier.',1947],
      ['The first commercial color television broadcasts began in the United States.',1951],
      ['The U.S. Supreme Court decided Brown v. Board of Education.',1954],
      ['Disneyland opened in Anaheim, California.',1955],
      ['The Interstate Highway System was authorized.',1956],
      ['Alaska became the 49th state.',1959],
      ['Hawaii became the 50th state.',1959],
      ['The March on Washington for Jobs and Freedom took place.',1963],
      ['The Civil Rights Act was signed into law.',1964],
      ['The Voting Rights Act was signed into law.',1965],
      ['Apollo 11 landed humans on the Moon.',1969],
      ['The Watergate break-in took place in Washington, D.C.',1972],
      ['Richard Nixon resigned from the presidency.',1974],
      ['The first Space Shuttle mission launched.',1981],
      ['The Challenger space shuttle disaster occurred.',1986],
      ['The Americans with Disabilities Act was signed into law.',1990],
      ['The World Trade Center attacks occurred on September 11.',2001],
      ['Barack Obama was inaugurated as president.',2009]
    ],
    'World History':[
      ['The Magna Carta was sealed in England.',1215],
      ['Christopher Columbus reached the Caribbean on his first voyage across the Atlantic.',1492],
      ['Martin Luther published the Ninety-five Theses.',1517],
      ['The Spanish Armada attempted to invade England.',1588],
      ['The Mayflower reached New England.',1620],
      ['The Great Fire of London began.',1666],
      ['The French Revolution began with the storming of the Bastille.',1789],
      ['Napoleon Bonaparte was crowned emperor of France.',1804],
      ['The Battle of Waterloo ended Napoleon’s rule.',1815],
      ['Queen Victoria began her reign.',1837],
      ['The first Opium War ended with the Treaty of Nanking.',1842],
      ['The Crimean War began.',1853],
      ['The Suez Canal opened.',1869],
      ['The Eiffel Tower opened to the public.',1889],
      ['The first modern Olympic Games were held in Athens.',1896],
      ['The Titanic sank in the North Atlantic.',1912],
      ['World War I began in Europe.',1914],
      ['The Russian Revolution brought the Bolsheviks to power.',1917],
      ['World War I ended with the armistice.',1918],
      ['The League of Nations began operations.',1920],
      ['Adolf Hitler became chancellor of Germany.',1933],
      ['World War II began in Europe after Germany invaded Poland.',1939],
      ['D-Day landings took place in Normandy.',1944],
      ['The United Nations was founded.',1945],
      ['India gained independence from Britain.',1947],
      ['The People’s Republic of China was established.',1949],
      ['The Korean War began.',1950],
      ['The Berlin Wall was built.',1961],
      ['The Cuban Missile Crisis occurred.',1962],
      ['The Six-Day War took place in the Middle East.',1967],
      ['The first Earth Day was observed.',1970],
      ['The Vietnam War ended with the fall of Saigon.',1975],
      ['The Soviet Union invaded Afghanistan.',1979],
      ['The Berlin Wall opened.',1989],
      ['The Soviet Union dissolved.',1991],
      ['Nelson Mandela became president of South Africa.',1994],
      ['Hong Kong was transferred from British to Chinese rule.',1997],
      ['The euro entered circulation as physical currency.',2002],
      ['The Summer Olympics opened in Beijing.',2008],
      ['The United Kingdom formally left the European Union.',2020]
    ],
    'Sports':[
      ['The first modern Olympic Games were held in Athens.',1896],
      ['The first World Series was played.',1903],
      ['The Indianapolis 500 was first held.',1911],
      ['Babe Ruth joined the New York Yankees.',1920],
      ['The first FIFA World Cup was held in Uruguay.',1930],
      ['Jesse Owens won four gold medals at the Berlin Olympics.',1936],
      ['Jackie Robinson debuted for the Brooklyn Dodgers.',1947],
      ['The NBA was formed through the merger of the BAA and NBL.',1949],
      ['Roger Bannister ran the first officially recorded sub-four-minute mile.',1954],
      ['The first Super Bowl was played.',1967],
      ['The New York Jets won Super Bowl III.',1969],
      ['The Miami Dolphins completed the NFL’s only perfect Super Bowl-era season.',1972],
      ['Billie Jean King defeated Bobby Riggs in the Battle of the Sexes tennis match.',1973],
      ['Muhammad Ali defeated George Foreman in the Rumble in the Jungle.',1974],
      ['The NBA adopted the three-point line.',1979],
      ['The United States men’s hockey team defeated the Soviet Union at the Lake Placid Olympics.',1980],
      ['The first NCAA men’s basketball tournament used a 64-team field.',1985],
      ['Mike Tyson became the youngest heavyweight boxing champion.',1986],
      ['Wayne Gretzky was traded from Edmonton to Los Angeles.',1988],
      ['The first modern-era U.S. Dream Team competed in Olympic basketball.',1992],
      ['Major League Baseball began interleague regular-season play.',1997],
      ['Tiger Woods won his first Masters Tournament.',1997],
      ['The New England Patriots won their first Super Bowl.',2002],
      ['LeBron James entered the NBA.',2003],
      ['The Boston Red Sox ended an 86-year World Series championship drought.',2004],
      ['Michael Phelps won eight gold medals at one Olympic Games.',2008],
      ['The New Orleans Saints won their first Super Bowl.',2010],
      ['The Golden State Warriors won the first championship of their Stephen Curry era.',2015],
      ['The Chicago Cubs won the World Series for the first time in 108 years.',2016],
      ['The Philadelphia Eagles won their first Super Bowl.',2018],
      ['The Toronto Raptors won their first NBA championship.',2019],
      ['The Kansas City Chiefs won Super Bowl LIV.',2020],
      ['The Milwaukee Bucks won the NBA championship.',2021],
      ['Argentina won the FIFA World Cup in Qatar.',2022],
      ['The Denver Nuggets won their first NBA championship.',2023]
    ],
    'Movies & TV':[
      ['Snow White and the Seven Dwarfs premiered as Disney’s first animated feature film.',1937],
      ['The Wizard of Oz was released in theaters.',1939],
      ['Citizen Kane was released.',1941],
      ['I Love Lucy premiered on television.',1951],
      ['Disneyland opened in California.',1955],
      ['The Twilight Zone premiered on television.',1959],
      ['The Flintstones premiered in prime time.',1960],
      ['The Beatles first appeared on The Ed Sullivan Show.',1964],
      ['Star Trek premiered on NBC.',1966],
      ['Sesame Street premiered on public television.',1969],
      ['The Godfather was released.',1972],
      ['Saturday Night Live premiered.',1975],
      ['Star Wars was released in theaters.',1977],
      ['Dallas premiered on CBS.',1978],
      ['MTV began broadcasting.',1981],
      ['E.T. the Extra-Terrestrial was released.',1982],
      ['The Cosby Show premiered on NBC.',1984],
      ['Back to the Future was released.',1985],
      ['The Simpsons debuted as a half-hour television series.',1989],
      ['Seinfeld premiered on NBC.',1989],
      ['The Silence of the Lambs was released.',1991],
      ['Jurassic Park was released.',1993],
      ['Friends premiered on NBC.',1994],
      ['Toy Story became the first fully computer-animated feature film.',1995],
      ['Titanic was released in theaters.',1997],
      ['The Sopranos premiered on HBO.',1999],
      ['The Lord of the Rings: The Fellowship of the Ring was released.',2001],
      ['American Idol premiered in the United States.',2002],
      ['Lost premiered on ABC.',2004],
      ['The Office premiered in the United States.',2005],
      ['Breaking Bad premiered on AMC.',2008],
      ['Avatar was released in theaters.',2009],
      ['Game of Thrones premiered on HBO.',2011],
      ['Stranger Things premiered on Netflix.',2016],
      ['Black Panther was released in theaters.',2018],
      ['Parasite won the Academy Award for Best Picture.',2020],
      ['Oppenheimer was released in theaters.',2023]
    ],
    'Music':[
      ['The first commercial phonograph recordings were sold.',1889],
      ['Louis Armstrong made influential Hot Five recordings.',1925],
      ['Billboard published its first national record chart.',1940],
      ['Elvis Presley released Heartbreak Hotel.',1956],
      ['The Beatles released their first UK single, Love Me Do.',1962],
      ['The Beatles first appeared on The Ed Sullivan Show.',1964],
      ['Bob Dylan released Like a Rolling Stone.',1965],
      ['The Beatles released Sgt. Pepper’s Lonely Hearts Club Band.',1967],
      ['The Woodstock music festival was held in New York.',1969],
      ['Led Zeppelin released Stairway to Heaven on Led Zeppelin IV.',1971],
      ['David Bowie released The Rise and Fall of Ziggy Stardust and the Spiders from Mars.',1972],
      ['Pink Floyd released The Dark Side of the Moon.',1973],
      ['Queen released Bohemian Rhapsody.',1975],
      ['The Bee Gees dominated the Saturday Night Fever soundtrack.',1977],
      ['Michael Jackson released Off the Wall.',1979],
      ['MTV began broadcasting music videos.',1981],
      ['Michael Jackson released Thriller.',1982],
      ['Prince released Purple Rain.',1984],
      ['Whitney Houston released her debut studio album.',1985],
      ['Nirvana released Nevermind.',1991],
      ['Dr. Dre released The Chronic.',1992],
      ['Mariah Carey released All I Want for Christmas Is You.',1994],
      ['The Fugees released The Score.',1996],
      ['Britney Spears released ...Baby One More Time.',1998],
      ['Eminem released The Marshall Mathers LP.',2000],
      ['Beyoncé released her first solo studio album, Dangerously in Love.',2003],
      ['Taylor Swift released her debut studio album.',2006],
      ['Lady Gaga released The Fame.',2008],
      ['Adele released the album 21.',2011],
      ['Beyoncé released her self-titled visual album without advance announcement.',2013],
      ['Kendrick Lamar released To Pimp a Butterfly.',2015],
      ['Childish Gambino released This Is America.',2018],
      ['Bad Bunny released Un Verano Sin Ti.',2022],
      ['Taylor Swift began the Eras Tour.',2023]
    ],
    'Science & Technology':[
      ['Johannes Gutenberg’s movable-type printing press was operating in Europe.',1450],
      ['Isaac Newton published Principia Mathematica.',1687],
      ['Benjamin Franklin conducted his famous kite experiment on electricity.',1752],
      ['Edward Jenner introduced the smallpox vaccine.',1796],
      ['The first public railway using steam locomotives opened in England.',1825],
      ['Samuel Morse sent the first long-distance telegraph message in the United States.',1844],
      ['Charles Darwin published On the Origin of Species.',1859],
      ['Alexander Graham Bell received a U.S. patent for the telephone.',1876],
      ['Thomas Edison demonstrated a practical incandescent light bulb.',1879],
      ['Karl Benz patented a gasoline-powered automobile.',1886],
      ['The Wright brothers completed the first powered airplane flight.',1903],
      ['Albert Einstein published his special theory of relativity.',1905],
      ['The first commercial radio station, KDKA, began broadcasting.',1920],
      ['Alexander Fleming discovered penicillin.',1928],
      ['The first programmable electronic general-purpose computer, ENIAC, was unveiled.',1946],
      ['Chuck Yeager became the first person confirmed to break the sound barrier.',1947],
      ['The structure of DNA was described by Watson and Crick.',1953],
      ['Sputnik 1 became the first artificial satellite in orbit.',1957],
      ['Yuri Gagarin became the first human in space.',1961],
      ['Apollo 11 landed humans on the Moon.',1969],
      ['The first commercial microprocessor, the Intel 4004, was released.',1971],
      ['The first handheld mobile phone call was made.',1973],
      ['The Apple II personal computer went on sale.',1977],
      ['IBM introduced its first personal computer.',1981],
      ['The Domain Name System was introduced.',1983],
      ['The World Wide Web was proposed by Tim Berners-Lee.',1989],
      ['The first website went online.',1991],
      ['Amazon was founded.',1994],
      ['Google was founded.',1998],
      ['Wikipedia launched.',2001],
      ['Facebook launched from Harvard.',2004],
      ['YouTube launched.',2005],
      ['Apple introduced the first iPhone.',2007],
      ['Instagram launched.',2010],
      ['The first image of a black hole was released.',2019],
      ['NASA’s Perseverance rover landed on Mars.',2021],
      ['The James Webb Space Telescope began science operations.',2022]
    ]
  };

  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shuffle=a=>{const x=a.slice();for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];}return x;};
  const usedByCategory=new Map();

  function ensureOverlay(){
    let overlay=document.getElementById('tapWhatCameFirst');
    if(overlay)return overlay;
    const style=document.createElement('style');
    style.id='tapWhatCameFirstStyles';
    style.textContent=`#tapWhatCameFirst{position:fixed;inset:0;z-index:235;background:#101114;color:#fff;overflow:auto;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}#tapWhatCameFirst *{box-sizing:border-box}#tapWhatCameFirst .wcf-wrap{max-width:1000px;margin:0 auto;padding:28px 20px 48px}#tapWhatCameFirst .wcf-kicker{text-transform:uppercase;letter-spacing:.14em;font-size:13px;font-weight:900;opacity:.66}#tapWhatCameFirst h2{font-size:clamp(44px,8vw,76px);line-height:.95;margin:8px 0 12px}#tapWhatCameFirst .wcf-sub{font-size:21px;font-weight:750;opacity:.8;margin-bottom:20px}#tapWhatCameFirst .wcf-scoreboard{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px;margin:16px 0 22px}#tapWhatCameFirst .wcf-score{background:#24272d;border-radius:15px;padding:11px 13px;display:flex;justify-content:space-between;gap:10px;font-weight:900}#tapWhatCameFirst .wcf-score.current{outline:3px solid #fff}#tapWhatCameFirst .wcf-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}#tapWhatCameFirst .wcf-catgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}#tapWhatCameFirst .wcf-card{background:#202329;border-radius:22px;padding:22px;display:flex;flex-direction:column;min-height:250px}#tapWhatCameFirst .wcf-label{font-size:14px;text-transform:uppercase;letter-spacing:.1em;font-weight:900;opacity:.62}#tapWhatCameFirst .wcf-event{font-size:clamp(24px,4vw,36px);font-weight:900;line-height:1.15;margin:12px 0 20px;flex:1}#tapWhatCameFirst button{border:0;border-radius:16px;min-height:68px;padding:12px 16px;font-size:22px;font-weight:950;cursor:pointer;background:#fff;color:#111}#tapWhatCameFirst .wcf-choice{width:100%;margin-top:auto}#tapWhatCameFirst .wcf-year{font-size:clamp(44px,8vw,70px);font-weight:950;margin-top:12px}#tapWhatCameFirst .wcf-result{font-size:clamp(36px,7vw,62px);font-weight:950;margin:16px 0}#tapWhatCameFirst .wcf-primary{width:100%;margin-top:18px}#tapWhatCameFirst .correct{outline:4px solid #35c979}@media(max-width:720px){#tapWhatCameFirst .wcf-grid,#tapWhatCameFirst .wcf-catgrid{grid-template-columns:1fr}}`;
    document.head.appendChild(style);
    overlay=document.createElement('div');overlay.id='tapWhatCameFirst';document.body.appendChild(overlay);return overlay;
  }

  function pickPair(category){
    const bank=EVENTS[category]||[];
    let used=usedByCategory.get(category);
    if(!used){used=new Set();usedByCategory.set(category,used);}
    let available=bank.map((e,i)=>({e,i})).filter(x=>!used.has(x.i));
    if(available.length<2){used.clear();available=bank.map((e,i)=>({e,i}));}
    available=shuffle(available);
    let first=available[0],second=null;
    const candidates=available.slice(1).filter(x=>x.e[1]!==first.e[1]);
    // Prefer pairs close enough to be genuinely playable rather than obvious century-apart comparisons.
    const close=candidates.filter(x=>Math.abs(x.e[1]-first.e[1])<=25);
    second=(close.length?shuffle(close):candidates)[0];
    if(!second)return null;
    used.add(first.i);used.add(second.i);
    const aFirst=first.e[1]<second.e[1];
    return {event_A:first.e[0],year_A:first.e[1],event_B:second.e[0],year_B:second.e[1],correct_first:aFirst?'A':'B',category};
  }

  function launch(hostApi){
    const players=hostApi?.getPlayers?.()||[];
    if(!players.length)return;
    const overlay=ensureOverlay();
    let turn=0,current=null;
    const scoreboard=currentIndex=>`<div class="wcf-scoreboard">${players.map((p,i)=>`<div class="wcf-score ${i===currentIndex?'current':''}"><span>${esc((p.avatar||'')+' '+p.name)}</span><strong>${p.score}</strong></div>`).join('')}</div>`;

    function chooseCategory(){
      if(turn>=players.length){finish();return;}
      const p=players[turn];
      const categories=shuffle(Object.keys(EVENTS)).slice(0,3);
      overlay.innerHTML=`<div class="wcf-wrap"><div class="wcf-kicker">Mini game break · Player ${turn+1} of ${players.length}</div><h2>Before & After</h2><div class="wcf-sub">${esc(p.name)}, choose a category. You’ll see two factual events and pick the one that happened first.</div>${scoreboard(turn)}<div class="wcf-catgrid">${categories.map(c=>`<button data-cat="${esc(c)}">${esc(c)}</button>`).join('')}</div></div>`;
      overlay.querySelectorAll('[data-cat]').forEach(btn=>btn.onclick=()=>{current=pickPair(btn.dataset.cat);showTurn();});
    }

    function showTurn(){
      const p=players[turn],q=current;
      if(!q){chooseCategory();return;}
      overlay.innerHTML=`<div class="wcf-wrap"><div class="wcf-kicker">${esc(q.category)} · Player ${turn+1} of ${players.length}</div><h2>What Came First?</h2><div class="wcf-sub">${esc(p.name)}, choose the factual event that happened first.</div>${scoreboard(turn)}<div class="wcf-grid"><div class="wcf-card"><div class="wcf-label">Event A</div><div class="wcf-event">${esc(q.event_A)}</div><button class="wcf-choice" data-choice="A">A happened first</button></div><div class="wcf-card"><div class="wcf-label">Event B</div><div class="wcf-event">${esc(q.event_B)}</div><button class="wcf-choice" data-choice="B">B happened first</button></div></div></div>`;
      overlay.querySelectorAll('[data-choice]').forEach(btn=>btn.onclick=()=>reveal(btn.dataset.choice));
    }

    function reveal(choice){
      const p=players[turn],q=current,correct=choice===q.correct_first;
      if(correct)hostApi.addPoints?.(p.index,1);
      overlay.innerHTML=`<div class="wcf-wrap"><div class="wcf-kicker">Answer revealed · ${esc(q.category)}</div><h2>${correct?'Correct!':'Not this time'}</h2>${scoreboard(turn)}<div class="wcf-grid"><div class="wcf-card ${q.correct_first==='A'?'correct':''}"><div class="wcf-label">Event A</div><div class="wcf-event">${esc(q.event_A)}</div><div class="wcf-year">${q.year_A}</div></div><div class="wcf-card ${q.correct_first==='B'?'correct':''}"><div class="wcf-label">Event B</div><div class="wcf-event">${esc(q.event_B)}</div><div class="wcf-year">${q.year_B}</div></div></div><div class="wcf-result">${correct?esc(p.name)+' +1 point':esc(p.name)+' +0 points'}</div><button class="wcf-primary" id="wcfNext">${turn+1<players.length?'Next player':'Finish mini game'}</button></div>`;
      overlay.querySelector('#wcfNext').onclick=()=>{turn++;current=null;chooseCategory();};
    }

    function finish(){
      overlay.innerHTML=`<div class="wcf-wrap"><div class="wcf-kicker">Mini game complete</div><h2>Back to Tap Trivia</h2>${scoreboard(-1)}<button class="wcf-primary" id="wcfDone">Continue</button></div>`;
      overlay.querySelector('#wcfDone').onclick=()=>overlay.remove();
    }

    chooseCategory();
  }

  window.TapWhatCameFirstPlugin=Object.freeze({launch});
})();