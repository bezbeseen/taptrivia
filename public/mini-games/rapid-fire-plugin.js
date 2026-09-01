(() => {
  'use strict';

  const BANK={
    Science:[['What planet is known as the Red Planet?','Mars'],['What gas do plants absorb from the atmosphere?','Carbon dioxide'],['What is H2O commonly called?','Water'],['What organ pumps blood through the body?','Heart'],['What is the center of an atom called?','Nucleus'],['What force keeps us on Earth?','Gravity'],['What is the closest star to Earth?','The Sun'],['How many planets are in our solar system?','8'],['What is the hardest natural substance?','Diamond'],['What blood cells fight infection?','White blood cells'],['What scale measures acidity?','pH'],['What is the chemical symbol for gold?','Au'],['What gas makes up most of Earth’s atmosphere?','Nitrogen'],['What part of a plant performs most photosynthesis?','Leaves'],['What is the largest organ in the human body?','Skin'],['What molecule carries genetic information?','DNA'],['What is the boiling point of water in Celsius at sea level?','100 degrees'],['What is the smallest unit of an element?','Atom']],
    Geography:[['What is the capital of France?','Paris'],['What is the largest ocean?','Pacific Ocean'],['What river runs through Egypt?','Nile'],['What country contains Rome?','Italy'],['What is the capital of Japan?','Tokyo'],['What continent is Brazil in?','South America'],['What is the largest country by area?','Russia'],['What desert covers much of North Africa?','Sahara'],['What country is shaped like a boot?','Italy'],['What is the capital of Canada?','Ottawa'],['What mountain range includes Everest?','Himalayas'],['What sea separates Europe and Africa?','Mediterranean Sea'],['What is the capital of Australia?','Canberra'],['Which continent contains Kenya?','Africa'],['What is the longest river in South America?','Amazon River'],['What country has Madrid as its capital?','Spain'],['Which U.S. state is known as the Aloha State?','Hawaii'],['What is the capital of Mexico?','Mexico City']],
    Sports:[['How many points is a touchdown worth?','6'],['How many players are on a basketball team on court?','5'],['What sport uses a puck?','Hockey'],['How many strikes make an out in baseball?','3'],['What sport uses a shuttlecock?','Badminton'],['What country hosted the 2016 Summer Olympics?','Brazil'],['How many holes are in a standard golf round?','18'],['What sport has a scrum?','Rugby'],['What is three goals by one player called?','Hat trick'],['What sport uses love as a score?','Tennis'],['How many bases are on a baseball field?','4'],['What sport is played at Wimbledon?','Tennis'],['How many points is a free throw worth in basketball?','1'],['How many players are on the field for one soccer team?','11'],['In what sport would you throw a touchdown pass?','Football'],['What race is 26.2 miles long?','Marathon'],['What sport uses a pommel horse?','Gymnastics'],['What sport is associated with the Stanley Cup?','Hockey']],
    History:[['Who was the first U.S. president?','George Washington'],['In what year did World War II end?','1945'],['Which ancient civilization built the pyramids at Giza?','Egyptians'],['Who wrote the Declaration of Independence?','Thomas Jefferson'],['What ship sank on its maiden voyage in 1912?','Titanic'],['Who was president during the U.S. Civil War?','Abraham Lincoln'],['What empire was ruled by Julius Caesar?','Roman Empire'],['What wall fell in 1989?','Berlin Wall'],['What war was fought between the North and South in the United States?','Civil War'],['Who was the first person to walk on the Moon?','Neil Armstrong'],['What country gifted the Statue of Liberty to the United States?','France'],['Which city was buried by Mount Vesuvius in AD 79?','Pompeii'],['Who was known as the Maid of Orleans?','Joan of Arc'],['What document begins with We the People?','U.S. Constitution'],['Which empire used Constantinople as its capital?','Byzantine Empire'],['Who was the British prime minister during most of World War II?','Winston Churchill'],['What year did the American Revolution officially end?','1783'],['Who discovered penicillin?','Alexander Fleming']],
    Movies:[['Who directed Jaws?','Steven Spielberg'],['What movie features the character Rocky Balboa?','Rocky'],['What color pill does Neo take in The Matrix?','Red'],['What movie features a shark named Bruce?','Finding Nemo'],['What is the name of the cowboy in Toy Story?','Woody'],['What movie features the line May the Force be with you?','Star Wars'],['Who played Jack in Titanic?','Leonardo DiCaprio'],['What fictional archaeologist carries a whip and wears a fedora?','Indiana Jones'],['What movie features the character Forrest Gump?','Forrest Gump'],['What is the name of the kingdom in Frozen?','Arendelle'],['Which movie features a DeLorean time machine?','Back to the Future'],['Who is Simba’s father in The Lion King?','Mufasa'],['What movie features the character Hannibal Lecter?','The Silence of the Lambs'],['What is the name of the hotel in The Shining?','Overlook Hotel'],['Which movie has a character named Ferris Bueller?','Ferris Bueller’s Day Off'],['What movie features the quote I’ll be back?','The Terminator'],['Who directed Pulp Fiction?','Quentin Tarantino'],['What movie series features Katniss Everdeen?','The Hunger Games']],
    Television:[['What city is Friends set in?','New York City'],['What family lives at 742 Evergreen Terrace?','The Simpsons'],['What is the name of the paper company in The Office?','Dunder Mifflin'],['Who is the chemistry teacher in Breaking Bad?','Walter White'],['What sitcom features the bar Cheers?','Cheers'],['What is the name of the coffee shop in Friends?','Central Perk'],['What animated family includes Peter, Lois, Meg, Chris, and Stewie?','Family Guy'],['What TV series features a throne made of swords?','Game of Thrones'],['Who lives in a pineapple under the sea?','SpongeBob SquarePants'],['What series follows agents Mulder and Scully?','The X-Files'],['What sitcom stars Jerry, George, Elaine, and Kramer?','Seinfeld'],['What is the name of the town in Stranger Things?','Hawkins'],['What hospital drama features Meredith Grey?','Grey’s Anatomy'],['What TV family includes Archie and Edith Bunker?','All in the Family'],['What sitcom features the character Sheldon Cooper?','The Big Bang Theory'],['What series follows survivors of a zombie apocalypse led by Rick Grimes?','The Walking Dead'],['What show features the phrase Winter is coming?','Game of Thrones'],['What is the name of the bar in How I Met Your Mother?','MacLaren’s Pub']],
    Music:[['Which band recorded Hey Jude?','The Beatles'],['Who is known as the King of Pop?','Michael Jackson'],['Who sang Purple Rain?','Prince'],['Which singer recorded Rolling in the Deep?','Adele'],['What instrument has 88 keys?','Piano'],['Which band featured Freddie Mercury?','Queen'],['Who sang Like a Prayer?','Madonna'],['What singer is known as The Boss?','Bruce Springsteen'],['Which group recorded Hotel California?','Eagles'],['Who sang Jolene?','Dolly Parton'],['Which band recorded Smells Like Teen Spirit?','Nirvana'],['Who released the album Thriller?','Michael Jackson'],['Which singer recorded Respect?','Aretha Franklin'],['What band featured Mick Jagger as lead singer?','The Rolling Stones'],['Who sang Ring of Fire?','Johnny Cash'],['Which artist recorded Born This Way?','Lady Gaga'],['What band recorded Sweet Child o’ Mine?','Guns N’ Roses'],['Who sang Shake It Off?','Taylor Swift']],
    'Food & Drink':[['What fruit is used to make guacamole?','Avocado'],['What grain is traditionally used in risotto?','Rice'],['What cheese is commonly used on pizza?','Mozzarella'],['What country is sushi associated with?','Japan'],['What legume is the main ingredient in hummus?','Chickpeas'],['What drink is made from fermented grapes?','Wine'],['What spice gives curry a common yellow color?','Turmeric'],['What nut is used to make marzipan?','Almond'],['What is tofu mainly made from?','Soybeans'],['What fruit is dried to make a prune?','Plum'],['What Italian dessert contains coffee-soaked ladyfingers?','Tiramisu'],['What herb is the main ingredient in traditional pesto?','Basil'],['What vegetable is used to make sauerkraut?','Cabbage'],['What spirit is traditionally used in a margarita?','Tequila'],['What pastry is used for profiteroles?','Choux pastry'],['What citrus fruit is used in key lime pie?','Key lime'],['What bean is used to make traditional refried beans most commonly?','Pinto beans'],['What is the main ingredient in mashed potatoes?','Potatoes']],
    Literature:[['Who wrote Romeo and Juliet?','William Shakespeare'],['Who wrote 1984?','George Orwell'],['What is the surname of the sisters in Little Women?','March'],['Who wrote The Great Gatsby?','F. Scott Fitzgerald'],['What detective lives at 221B Baker Street?','Sherlock Holmes'],['Who wrote Pride and Prejudice?','Jane Austen'],['What boy wizard attends Hogwarts?','Harry Potter'],['Who wrote The Catcher in the Rye?','J. D. Salinger'],['What is the name of the whale in Moby-Dick?','Moby Dick'],['Who wrote To Kill a Mockingbird?','Harper Lee'],['What fantasy land is entered through a wardrobe?','Narnia'],['Who wrote The Hobbit?','J. R. R. Tolkien'],['What is the first name of Dr. Watson?','John'],['Who wrote The Odyssey?','Homer'],['What novel features Atticus Finch?','To Kill a Mockingbird'],['Who wrote Frankenstein?','Mary Shelley'],['What novel begins with Call me Ishmael?','Moby-Dick'],['Who wrote The Chronicles of Narnia?','C. S. Lewis']],
    Technology:[['What does CPU stand for?','Central Processing Unit'],['What company created the iPhone?','Apple'],['What does URL stand for?','Uniform Resource Locator'],['What does Wi-Fi allow devices to do?','Connect wirelessly to a network'],['What company created Windows?','Microsoft'],['What does RAM stand for?','Random Access Memory'],['What device moves a pointer on a computer screen?','Mouse'],['What does USB stand for?','Universal Serial Bus'],['What search engine is owned by Alphabet?','Google'],['What does GPS stand for?','Global Positioning System'],['What type of software is Chrome?','Web browser'],['What does PDF stand for?','Portable Document Format'],['What company makes the PlayStation?','Sony'],['What does HDMI carry?','Digital audio and video'],['What is phishing designed to steal?','Personal information'],['What symbol is used in every standard email address?','@'],['What company owns Android?','Google'],['What does AI stand for?','Artificial Intelligence']]
  };

  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shuffle=a=>{const x=a.slice();for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];}return x;};
  let overlay=null;

  function ensure(){
    overlay=document.getElementById('tapRapidFire');
    if(overlay)return overlay;
    const style=document.createElement('style');
    style.textContent=`#tapRapidFire{position:fixed;inset:0;z-index:245;background:#111214;color:#fff;overflow:auto;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}#tapRapidFire *{box-sizing:border-box}#tapRapidFire .rf-wrap{max-width:920px;margin:0 auto;padding:30px 20px 48px}#tapRapidFire .rf-kicker{text-transform:uppercase;letter-spacing:.14em;font-weight:900;opacity:.7}#tapRapidFire h2{font-size:clamp(46px,8vw,78px);margin:8px 0 12px;line-height:.96}#tapRapidFire .rf-sub{font-size:22px;font-weight:750;opacity:.82;margin-bottom:22px}#tapRapidFire .rf-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}#tapRapidFire .rf-card{background:#202226;border-radius:22px;padding:24px;margin:16px 0}#tapRapidFire .rf-big{font-size:clamp(28px,5vw,46px);font-weight:900;line-height:1.12}#tapRapidFire button{min-height:66px;border:0;border-radius:16px;padding:12px 16px;font-size:21px;font-weight:900;cursor:pointer}.rf-primary{background:#fff;color:#111}.rf-good{background:#15803d;color:#fff}.rf-bad{background:#b42318;color:#fff}.rf-result{font-size:clamp(30px,6vw,52px);font-weight:950;margin:14px 0}`;
    document.head.appendChild(style);
    overlay=document.createElement('div');overlay.id='tapRapidFire';document.body.appendChild(overlay);return overlay;
  }

  function shell(title,sub,body){
    ensure().innerHTML=`<div class="rf-wrap"><div class="rf-kicker">Mini game break</div><h2>${esc(title)}</h2><div class="rf-sub">${esc(sub)}</div>${body}</div>`;
  }
  function close(){overlay?.remove();overlay=null;}

  function launch(hostApi){
    const players=hostApi?.getPlayers?.()||[];
    const last=hostApi?.getLastPlaceIndexes?.()||[];
    if(!players.length||!last.length)return;

    const choosePlayer=cb=>{
      if(last.length===1){cb(last[0]);return;}
      shell('Rock Paper Scissors','Last place is tied. Play RPS, then tap the winner.',`<div class="rf-grid">${last.map(i=>`<button class="rf-primary" data-rps="${i}">${esc(players[i]?.name||'Player')}</button>`).join('')}</div>`);
      overlay.querySelectorAll('[data-rps]').forEach(b=>b.onclick=()=>cb(Number(b.dataset.rps)));
    };

    choosePlayer(i=>{
      // Exactly three choices, freshly randomized on every Rapid Fire launch.
      const categories=shuffle(Object.keys(BANK).filter(c=>BANK[c].length>=15)).slice(0,3);
      shell('Rapid Fire',`${players[i]?.name} is in last place. Choose one of these 3 random categories.`,`<div class="rf-grid">${categories.map(c=>`<button class="rf-primary" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}</div>`);
      overlay.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>run(i,b.dataset.cat));
    });

    function run(i,category){
      // Fresh deck every game. Every eligible category contains at least 15 questions.
      const questions=shuffle(BANK[category]);
      let n=0,correct=0,seconds=60,timer=null,finished=false;

      const finish=()=>{
        if(finished)return;finished=true;clearInterval(timer);
        const p=hostApi.getPlayers()[i];
        let label='No score change';
        if(correct>=11){
          const newScore=Math.max((p?.score||0)+4,(hostApi.getLeaderScore?.()||0)-1);
          hostApi.setScore?.(i,newScore);label=`Score moves to ${newScore}`;
        }else if(correct>=8){hostApi.addPoints?.(i,2);label='+2 points';}
        else if(correct>=4){hostApi.addPoints?.(i,1);label='+1 point';}
        shell('Rapid Fire complete',`${correct} correct.`,`<div class="rf-result">${esc(label)}</div><button class="rf-primary" id="rfDone">Back to trivia</button>`);
        overlay.querySelector('#rfDone').onclick=close;
      };

      const draw=()=>{
        if(finished)return;
        if(n>=questions.length){finish();return;}
        const q=questions[n];
        shell('Rapid Fire',`${players[i]?.name} · ${category} · ${seconds}s · ${correct} correct · Question ${n+1} of ${questions.length}`,`<div class="rf-card"><div class="rf-big">${esc(q[0])}</div><div class="rf-sub" style="margin-top:16px">Answer: ${esc(q[1])}</div></div><div class="rf-grid"><button class="rf-good" id="rfCorrect">Correct</button><button class="rf-bad" id="rfPass">Pass</button><button class="rf-primary" id="rfFinish">Finish</button></div>`);
        overlay.querySelector('#rfCorrect').onclick=()=>{correct++;n++;draw();};
        overlay.querySelector('#rfPass').onclick=()=>{n++;draw();};
        overlay.querySelector('#rfFinish').onclick=finish;
      };

      timer=setInterval(()=>{seconds--;if(seconds<=0)finish();else draw();},1000);
      draw();
    }
  }

  window.TapRapidFirePlugin=Object.freeze({launch});
})();