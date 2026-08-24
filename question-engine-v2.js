(function(global){
  const DATABASE_URL='Tap_Trivia_Question_Database.csv';
  const DB_NAME='tapTriviaQuestionDatabase';
  const DB_STORE='files';
  const DB_KEY='final-question-database-v1';
  const CATEGORIES=['General Knowledge','Geography','Movies','Music','Literature & Language','History','Television','Sports','Arts, Culture & Technology','Science & Nature','Food & Drink','Pop Culture & Celebrities'].map(name=>({id:name,name}));
  let database=null,loadingPromise=null;
  const shuffle=items=>{const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  function parseCsv(text){const rows=[];let row=[],field='',quoted=false;for(let i=0;i<text.length;i++){const ch=text[i];if(quoted){if(ch==='"'){if(text[i+1]==='"'){field+='"';i++}else quoted=false}else field+=ch}else if(ch==='"')quoted=true;else if(ch===','){row.push(field);field=''}else if(ch==='\n'){row.push(field);field='';if(row.some(v=>v!==''))rows.push(row);row=[]}else if(ch!=='\r')field+=ch}if(field!==''||row.length){row.push(field);if(row.some(v=>v!==''))rows.push(row)}if(!rows.length)return[];const header=rows.shift().map((h,i)=>i===0?h.replace(/^\uFEFF/,''):h);return rows.map(values=>{const out={};header.forEach((key,i)=>out[key]=values[i]??'');return out})}
  function normalize(row){
    const sourceQuestion=(row.question||'').trim(),answer=(row.answers||'').trim(),category=(row.assigned_category||'General Knowledge').trim(),difficulty=(row.difficulty||'').trim().toLowerCase();
    const options=[row.option_a,row.option_b,row.option_c,row.option_d].map(v=>(v||'').trim()).filter(Boolean);
    const declared=(row.type||'').trim().toLowerCase();
    const answerLower=answer.toLowerCase();
    const type=(answerLower==='true'||answerLower==='false')?'boolean':(declared==='multiple'||options.length===4?'multiple':(declared==='boolean'?'boolean':'open'));
    return{id:(row.question_id||'').trim(),sourceQuestion,answer,category,categoryId:category,difficulty,type,options,source:(row.source||'Tap Trivia Question Database').trim()||'Tap Trivia Question Database'};
  }
  function normalizeCsv(text){return parseCsv(text).map(normalize).filter(q=>q.sourceQuestion&&q.answer&&q.difficulty)}
  function openDb(){return new Promise((resolve,reject)=>{if(!('indexedDB' in global))return reject(new Error('This browser does not support local database storage.'));const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(DB_STORE))db.createObjectStore(DB_STORE)};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('Could not open local database storage.'))})}
  async function readStoredCsv(){try{const db=await openDb();return await new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readonly');const req=tx.objectStore(DB_STORE).get(DB_KEY);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error)})}catch(_){return null}}
  async function writeStoredCsv(text){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).put(text,DB_KEY);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||new Error('Could not save the question database.'))})}
  async function importFile(file,onStatus){if(!file)throw new Error('Choose the Tap Trivia question database CSV.');onStatus&&onStatus('Reading '+file.name+'...');const text=await file.text();const rows=normalizeCsv(text);if(!rows.length)throw new Error('That file does not contain usable Tap Trivia questions.');await writeStoredCsv(text);database=rows;onStatus&&onStatus(database.length+' questions saved on this browser.');return database.length}
  async function init(onStatus){if(database)return database;if(loadingPromise)return loadingPromise;loadingPromise=(async()=>{onStatus&&onStatus('Loading Tap Trivia question database...');const stored=await readStoredCsv();if(stored){const rows=normalizeCsv(stored);if(rows.length){database=rows;onStatus&&onStatus(database.length+' questions loaded from this browser.');return database}}let response=null;try{response=await fetch(DATABASE_URL,{cache:'no-store'})}catch(_){}if(response&&response.ok){const text=await response.text();const rows=normalizeCsv(text);if(rows.length){database=rows;try{await writeStoredCsv(text)}catch(_){}onStatus&&onStatus(database.length+' questions loaded from the Tap Trivia database.');return database}}throw new Error('Load the current Tap_Trivia_Question_Database.csv once on this browser to begin. No outside trivia service will be used.')})();try{return await loadingPromise}finally{loadingPromise=null}}
  function formatForGame(q){
    if(q.type==='boolean'){
      return {...q,options:['True','False'],question:'['+q.category+']\nTrue or False\n'+q.sourceQuestion};
    }
    if(q.type==='multiple'&&q.options.length===4){
      const opts=shuffle(q.options);
      return {...q,options:opts,question:'['+q.category+']\nThis is a multiple choice question.\n'+q.sourceQuestion+'\n'+opts.map((opt,i)=>String.fromCharCode(65+i)+'. '+opt).join('\n')};
    }
    return {...q,question:'['+q.category+']\n'+q.sourceQuestion};
  }
  function buildQueue(items){
    const byCategory=new Map();
    for(const q of items){if(!byCategory.has(q.category))byCategory.set(q.category,[]);const arr=byCategory.get(q.category);arr.push({...q,categoryPosition:arr.length})}
    const remaining=new Map([...byCategory].map(([cat,arr])=>[cat,arr.slice()]));
    const lastPos=new Map(),lastSeen=new Map();
    const output=[];
    let lastCat=null,run=0,step=0;
    while(true){
      const eligible=[];
      for(const [cat,arr] of remaining){
        if(!arr.length)continue;
        if(cat===lastCat&&run>=2)continue;
        const prior=lastPos.get(cat);
        const validIndices=[];
        for(let i=0;i<arr.length;i++){if(prior===undefined||Math.abs(arr[i].categoryPosition-prior)>=50)validIndices.push(i)}
        if(!validIndices.length)continue;
        eligible.push({cat,arr,validIndices,lastSeen:lastSeen.has(cat)?lastSeen.get(cat):-100000});
      }
      if(!eligible.length)break;
      eligible.sort((a,b)=>a.lastSeen-b.lastSeen);
      const oldest=eligible[0].lastSeen;
      const band=eligible.filter(x=>x.lastSeen<=oldest+2);
      const chosen=band[Math.floor(Math.random()*band.length)];
      const idx=chosen.validIndices[Math.floor(Math.random()*chosen.validIndices.length)];
      const q=chosen.arr.splice(idx,1)[0];
      output.push(formatForGame(q));
      lastPos.set(chosen.cat,q.categoryPosition);lastSeen.set(chosen.cat,step++);
      if(chosen.cat===lastCat)run++;else{lastCat=chosen.cat;run=1}
    }
    return output;
  }
  async function load({difficulty,onStatus}){
    if(!difficulty)throw new Error('Choose a difficulty.');
    const data=await init(onStatus),wanted=String(difficulty).toLowerCase();
    const matches=data.filter(q=>q.difficulty===wanted);
    if(!matches.length)throw new Error('No questions are available for that difficulty.');
    onStatus&&onStatus('Randomizing '+matches.length+' questions across all 12 categories...');
    const queue=buildQueue(matches);
    if(!queue.length)throw new Error('Could not build a valid randomized question queue.');
    onStatus&&onStatus(queue.length+' questions ready across all categories.');
    return queue;
  }
  function updatePlayerDefaults(){const box=document.getElementById('nameFields');if(!box)return;[...box.querySelectorAll('input')].forEach((input,i)=>{if(input.dataset.tapTriviaDefaulted)return;input.value='Player '+(i+1);input.dataset.tapTriviaDefaulted='1'})}
  global.TapTriviaQuestionEngine={version:4,databaseUrl:DATABASE_URL,categories:CATEGORIES,init,load,importFile,databaseSize:()=>database?database.length:0,cacheSize:()=>database?database.length:0};
  function boot(){updatePlayerDefaults();const box=document.getElementById('nameFields');if(box)new MutationObserver(updatePlayerDefaults).observe(box,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})(window);
