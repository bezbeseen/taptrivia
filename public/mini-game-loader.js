(() => {
  'use strict';

  const SOURCES = {
    closest: 'https://raw.githubusercontent.com/bezbeseen/weddingmarking/22988013d8da0fd0ee2102cbcaf1ddb81a7cf901/tap-trivia/marc-copy/local/closest-wins-plugin.js',
    price: 'https://raw.githubusercontent.com/bezbeseen/weddingmarking/73c562df5ff6927e0ecd2e4848ff4ecfa8068bf6/tap-trivia/marc-copy/local/price-guess-plugin.js',
    what: 'https://raw.githubusercontent.com/bezbeseen/weddingmarking/22988013d8da0fd0ee2102cbcaf1ddb81a7cf901/tap-trivia/marc-copy/local/what-came-first-plugin.js',
    rapid: 'https://raw.githubusercontent.com/bezbeseen/weddingmarking/22988013d8da0fd0ee2102cbcaf1ddb81a7cf901/tap-trivia/marc-copy/local/rapid-fire-plugin.js'
  };

  let rotationIndex = 0;
  let readyPromise = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Could not load mini game: ' + src));
      document.head.appendChild(script);
    });
  }

  async function loadPatchedWhatCameFirst() {
    const response = await fetch(SOURCES.what, { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not load What Came First.');
    let code = await response.text();

    code = code.replace(
      /  function pickPair\(category\)\{[\s\S]*?\n  \}\n\n  function launch\(hostApi\)/,
`  function pickPair(){
    const all=[];
    Object.entries(EVENTS).forEach(([category,bank])=>bank.forEach((e,i)=>all.push({e,i,category,key:category+'::'+i})));
    let used=usedByCategory.get('__all__');
    if(!used){used=new Set();usedByCategory.set('__all__',used);}
    let available=all.filter(x=>!used.has(x.key));
    if(available.length<2){used.clear();available=all.slice();}
    available=shuffle(available);

    const maxGap=(year)=>year>=2010?4:year>=1970?8:year>=1930?20:year>=1850?40:Infinity;
    const stop=new Set(['the','a','an','and','or','of','to','in','on','for','with','at','from','by','was','were','is','are','became','began','ended','first','united','states','american']);
    const tokens=text=>new Set(String(text).toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(w=>w.length>3&&!stop.has(w)));
    const tooRelated=(a,b)=>{
      const A=tokens(a),B=tokens(b);
      const common=[...A].filter(w=>B.has(w));
      if(common.length>=2)return true;
      const al=String(a).toLowerCase(),bl=String(b).toLowerCase();
      const subjects=['civil war','world war','beatles','super bowl','olympic','olympics','berlin wall','apollo','moon','disneyland','michael jackson','taylor swift','facebook','google','youtube','nba','nfl','world cup'];
      return subjects.some(s=>al.includes(s)&&bl.includes(s));
    };

    for(const first of available){
      const candidates=shuffle(available.filter(x=>x.key!==first.key&&x.e[1]!==first.e[1]));
      const valid=candidates.filter(second=>{
        const newer=Math.max(first.e[1],second.e[1]);
        const gap=Math.abs(first.e[1]-second.e[1]);
        return gap<=maxGap(newer)&&!tooRelated(first.e[0],second.e[0]);
      });
      const second=valid[0];
      if(!second)continue;
      used.add(first.key);used.add(second.key);
      const catLabel=first.category===second.category?first.category:first.category+' · '+second.category;
      return {event_A:first.e[0],year_A:first.e[1],event_B:second.e[0],year_B:second.e[1],correct_first:first.e[1]<second.e[1]?'A':'B',category:catLabel};
    }
    return null;
  }

  function launch(hostApi)`
    );

    code = code.replace(
      /    function chooseCategory\(\)\{[\s\S]*?\n    \}\n\n    function showTurn\(\)/,
`    function chooseCategory(){
      if(turn>=players.length){finish();return;}
      current=pickPair();
      showTurn();
    }

    function showTurn()`
    );

    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    try {
      await loadScript(url);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function ensureReady() {
    if (readyPromise) return readyPromise;
    readyPromise = Promise.all([
      loadScript(SOURCES.closest),
      loadScript(SOURCES.price),
      loadPatchedWhatCameFirst(),
      loadScript(SOURCES.rapid)
    ]).catch((error) => {
      console.error(error);
      throw error;
    });
    return readyPromise;
  }

  function launchWhatCameFirstTwoRounds(api) {
    const plugin = window.TapWhatCameFirstPlugin;
    if (!plugin?.launch) return;
    let round = 1;

    const startRound = () => {
      plugin.launch(api);
      const wire = window.setInterval(() => {
        const overlay = document.getElementById('tapWhatCameFirst');
        if (!overlay) return;
        const kicker = overlay.querySelector('.wcf-kicker');
        if (kicker && !kicker.dataset.twoRoundLabel) {
          kicker.dataset.twoRoundLabel = '1';
          kicker.textContent = 'Round ' + round + ' of 2 · ' + kicker.textContent;
        }
        const back = overlay.querySelector('#wcfBack');
        if (back && !back.dataset.twoRoundWired) {
          back.dataset.twoRoundWired = '1';
          if (round === 1) {
            back.textContent = 'Start Round 2';
            back.addEventListener('click', () => {
              round = 2;
              window.setTimeout(startRound, 60);
            });
          } else {
            back.textContent = 'Back to trivia';
          }
          window.clearInterval(wire);
        }
      }, 40);
    };

    startRound();
  }

  window.__launchTapMiniGame = async () => {
    const api = window.__tapMiniGameAPI;
    if (!api?.getPlayers?.().length) return;

    try {
      await ensureReady();
    } catch {
      return;
    }

    const slot = rotationIndex++ % 4;
    if (slot === 0 && window.TapClosestWinsPlugin?.launch) {
      window.TapClosestWinsPlugin.launch(api);
      return;
    }
    if (slot === 1 && window.TapPriceGuessPlugin?.launch) {
      window.TapPriceGuessPlugin.launch(api);
      return;
    }
    if (slot === 2) {
      launchWhatCameFirstTwoRounds(api);
      return;
    }
    if (window.TapRapidFirePlugin?.launch) {
      window.TapRapidFirePlugin.launch(api);
    }
  };

  ensureReady();
})();
