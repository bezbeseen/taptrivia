(()=>{
  const root=document.getElementById('slap15');
  if(!root)return;
  let cache=null;
  let pending=null;
  const label=level=>level==='smart'?'Smart AF':level.charAt(0).toUpperCase()+level.slice(1);
  function seededShuffle(items,seed){
    const arr=items.slice();let s=seed>>>0;
    const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};
    for(let i=arr.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}
    return arr;
  }
  function variantQuestion(text,level,variant){
    const q=text.trim().replace(/\s+/g,' ').replace(/\?$/,'');
    const styles={
      easy:['What is the answer to this: ','Quick one: ','Name this: ','Identify this: '],
      medium:['Answer this: ','Identify the correct answer: ','Trivia question: ','Name the answer: '],
      hard:['Be precise: ','Give the exact answer: ','Advanced trivia: ','Identify precisely: '],
      smart:['Smart AF: ','No hints — identify this: ','Expert-level: ','Give the most precise answer: ']
    };
    return (styles[level]||styles.medium)[variant%4]+q+'?';
  }
  function buildPool(source,level,count,seed){
    const shuffled=seededShuffle(source,seed);const out=[];const seen=new Set();let pass=0;
    while(out.length<count){
      for(let i=0;i<shuffled.length&&out.length<count;i++){
        const item=shuffled[i];
        const question=pass===0?variantQuestion(item.question,level,pass):variantQuestion(item.question,level,pass+(i%4));
        const key=question.toLowerCase();if(seen.has(key))continue;seen.add(key);
        out.push({question,answer:item.answer,difficulty:level,order:out.length+1});
      }
      pass++;
    }
    return seededShuffle(out,seed+777).map((q,i)=>({...q,order:i+1}));
  }
  async function loadQuestionBanks(level){
    if(cache)return cache;
    if(pending)return pending;
    pending=(async()=>{
      if(!('DecompressionStream' in window))throw new Error('This browser cannot open the question data.');
      const encoded=(window.SLAP15_DATA||'').replace(/\s+/g,'');
      if(!encoded)throw new Error('Question data did not load. Refresh the page and try again.');
      const qtext=root.querySelector('#qtext');if(qtext)qtext.textContent='Loading '+label(level)+' questions...';
      const binary=atob(encoded);const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
      const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      const raw=JSON.parse(await new Response(stream).text());
      const flattened=raw.flat().map(q=>Array.isArray(q)?{question:q[0],answer:q[1]}:q).filter(q=>q&&q.question&&q.answer);
      const unique=[...new Map(flattened.map(q=>[q.question.trim().toLowerCase(),q])).values()];
      const easy=buildPool(unique,'easy',1500,1101);
      const medium=buildPool(unique,'medium',1500,2202);
      const hard=buildPool(unique,'hard',1500,3303);
      const smart=buildPool(unique,'smart',1500,4404);
      const mix=seededShuffle([...easy.slice(0,300),...medium.slice(0,750),...hard.slice(0,300),...smart.slice(0,150)],5505).map((q,i)=>({...q,difficulty:'mix',order:i+1}));
      cache={easy,medium,hard,smart,mix};
      root.__questionBanks=cache;
      if(root.__setQuestionBanks)root.__setQuestionBanks(cache);
      return cache;
    })();
    try{return await pending}finally{pending=null}
  }
  root.__loadQuestionBanks=loadQuestionBanks;
})();
