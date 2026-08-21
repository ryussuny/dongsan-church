/* ===========================================================
   동산감리교회 · 오늘의 말씀 나눔 — 공용 코어
   저장소(서버/기기), 사용자, 읽음확인, 나눔글, 아멘, 연속일수,
   성경 본문 로더, 공유 유틸을 담당한다.
   word-adult.html / word-kids.html 이 함께 사용한다.
   =========================================================== */

/* ---------- 작은 유틸 ---------- */
function wEsc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function wUid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function wToast(msg){
  var e=document.getElementById('wToast');
  if(!e){e=document.createElement('div');e.id='wToast';document.body.appendChild(e);
    e.style.cssText='position:fixed;left:50%;bottom:86px;transform:translateX(-50%) translateY(20px);'+
      'background:#22303f;color:#fff;padding:12px 20px;border-radius:999px;font-size:15px;font-weight:600;'+
      'z-index:9999;opacity:0;transition:.25s;max-width:88%;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.25)';}
  e.textContent=msg;e.style.opacity='1';e.style.transform='translateX(-50%) translateY(0)';
  clearTimeout(e._t);e._t=setTimeout(function(){e.style.opacity='0';e.style.transform='translateX(-50%) translateY(20px)'},2200);
}

/* ---------- 저장소 ----------
   기본은 이 기기(localStorage).
   같은 도메인에 아래 API가 있으면 자동으로 서버 공유 모드로 전환한다.
     GET  /api/word/feed?date=YYYY-MM-DD  -> {confirms:[...],shares:[...]}
     POST /api/word/confirm  {date,name,ver,quizOk,missionOk}
     POST /api/word/share    {id,date,name,ver,text,mood}
     POST /api/word/amen     {id,name}
   서버가 없으면 모든 기록은 이 기기에만 저장된다(앱에 그대로 표시). */
var WordStore=(function(){
  var K='dongsan_word_db', KC='dongsan_word_custom';
  var mode='local', api='/api/word';

  function raw(){try{return JSON.parse(localStorage.getItem(K))||{}}catch(e){return {}}}
  function db(){var d=raw();if(!d.confirms)d.confirms=[];if(!d.shares)d.shares=[];return d}
  function save(d){try{localStorage.setItem(K,JSON.stringify(d))}catch(e){}}

  function post(path,body){
    return fetch(api+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
      .then(function(r){if(!r.ok)throw new Error('bad');return r.json().catch(function(){return {}})});
  }

  function init(){
    return fetch(api+'/feed?date='+WordData.today(),{headers:{'Accept':'application/json'}})
      .then(function(r){if(!r.ok)throw new Error('no api');return r.json()})
      .then(function(){mode='server';return mode})
      .catch(function(){mode='local';return mode});
  }

  function feed(date){
    if(mode==='server'){
      return fetch(api+'/feed?date='+date).then(function(r){return r.json()})
        .then(function(d){return {confirms:d.confirms||[],shares:d.shares||[]}})
        .catch(function(){return localFeed(date)});
    }
    return Promise.resolve(localFeed(date));
  }
  function localFeed(date){
    var d=db();
    return {confirms:d.confirms.filter(function(c){return c.date===date}),
            shares:d.shares.filter(function(s){return s.date===date})};
  }

  function confirm(rec){
    var d=db(),i=-1;
    d.confirms.forEach(function(c,idx){if(c.date===rec.date&&c.name===rec.name&&c.ver===rec.ver)i=idx});
    if(i>=0)d.confirms[i]=Object.assign({},d.confirms[i],rec);else d.confirms.push(Object.assign({ts:Date.now()},rec));
    save(d);
    if(mode==='server')return post('/confirm',rec).catch(function(){});
    return Promise.resolve();
  }

  function unconfirm(rec){
    var d=db();
    d.confirms=d.confirms.filter(function(c){return !(c.date===rec.date&&c.name===rec.name&&c.ver===rec.ver)});
    save(d);
    if(mode==='server')return post('/confirm/delete',rec).catch(function(){});
    return Promise.resolve();
  }

  function share(rec){
    rec.id=rec.id||wUid();rec.ts=rec.ts||Date.now();rec.amens=rec.amens||[];
    var d=db();d.shares.push(rec);save(d);
    if(mode==='server')return post('/share',rec).catch(function(){}).then(function(){return rec});
    return Promise.resolve(rec);
  }

  function removeShare(id,name){
    var d=db();d.shares=d.shares.filter(function(s){return !(s.id===id&&s.name===name)});save(d);
    if(mode==='server')return post('/share/delete',{id:id,name:name}).catch(function(){});
    return Promise.resolve();
  }

  function amen(id,name){
    var d=db(),changed=false;
    d.shares.forEach(function(s){
      if(s.id!==id)return;
      s.amens=s.amens||[];
      var i=s.amens.indexOf(name);
      if(i>=0)s.amens.splice(i,1);else s.amens.push(name);
      changed=true;
    });
    if(changed)save(d);
    if(mode==='server')return post('/amen',{id:id,name:name}).catch(function(){});
    return Promise.resolve();
  }

  /* 내 기록 전체 (연속일수/스티커 계산용) */
  function myConfirms(name,ver){
    return db().confirms.filter(function(c){return c.name===name&&(!ver||c.ver===ver)});
  }
  function allConfirms(){return db().confirms}

  /* 관리자·부모가 지정한 오늘의 말씀 */
  function custom(){try{return JSON.parse(localStorage.getItem(KC))||{}}catch(e){return {}}}
  function setCustom(date,obj){var c=custom();if(obj)c[date]=obj;else delete c[date];localStorage.setItem(KC,JSON.stringify(c));return c}

  function exportAll(){return JSON.stringify({db:db(),custom:custom()},null,2)}
  function importAll(txt){
    var o=JSON.parse(txt);
    if(o.db)save({confirms:o.db.confirms||[],shares:o.db.shares||[]});
    if(o.custom)localStorage.setItem(KC,JSON.stringify(o.custom));
  }

  return {init:init,get mode(){return mode},feed:feed,confirm:confirm,unconfirm:unconfirm,share:share,removeShare:removeShare,
          amen:amen,myConfirms:myConfirms,allConfirms:allConfirms,custom:custom,setCustom:setCustom,
          exportAll:exportAll,importAll:importAll};
})();

/* ---------- 사용자 ---------- */
var WordUser=(function(){
  var K='dongsan_word_profile';
  function get(){
    var p={};
    try{p=JSON.parse(localStorage.getItem(K))||{}}catch(e){p={}}
    if(!p.name){try{p.name=JSON.parse(localStorage.getItem('dongsan_userName'))||''}catch(e){p.name=''}}
    if(!p.font)p.font=17;
    return p;
  }
  function set(p){
    var cur=get(),next=Object.assign({},cur,p);
    localStorage.setItem(K,JSON.stringify(next));
    if(next.name)try{localStorage.setItem('dongsan_userName',JSON.stringify(next.name))}catch(e){}
    return next;
  }
  function members(){
    try{var m=JSON.parse(localStorage.getItem('dongsan_members'))||[];return Array.isArray(m)?m:[]}catch(e){return []}
  }
  return {get:get,set:set,members:members};
})();

/* ---------- 연속 읽기(스트릭) ---------- */
function wordStreak(name,ver){
  var done={};
  WordStore.myConfirms(name,ver).forEach(function(c){done[c.date]=true});
  var t=WordData.today(),n=0,cur=t;
  if(!done[t])cur=WordData.shift(t,-1);       /* 오늘 아직이면 어제부터 센다 */
  while(done[cur]){n++;cur=WordData.shift(cur,-1)}
  return {days:n,total:Object.keys(done).length,doneMap:done};
}

/* ---------- 성경 본문 ---------- */
var WordBible=(function(){
  var loading=null,ready=false;
  function load(){
    if(ready)return Promise.resolve(true);
    if(loading)return loading;
    loading=new Promise(function(res){
      if(typeof BIBLE_DATA!=='undefined'){ready=true;return res(true)}
      var s=document.createElement('script');
      s.src='dongsan_bible.js';
      s.onload=function(){ready=(typeof BIBLE_DATA!=='undefined');res(ready)};
      s.onerror=function(){res(false)};
      document.head.appendChild(s);
    });
    return loading;
  }
  /* 각주 기호 정리: "a태초에 …(a 또는 '…')" → "태초에 …" */
  function clean(t){
    return String(t||'')
      .replace(/\([a-z] [^)]*\)/g,'')
      .replace(/([가-힣,.\s"“”'’]|^)([a-z])(?=[가-힣])/g,'$1')
      .replace(/\s{2,}/g,' ').trim();
  }
  function verses(passage,doClean){
    var r=WordData.parseRef(passage);
    if(!r||typeof BIBLE_DATA==='undefined')return [];
    var bk=BIBLE_DATA[r.book];
    if(!bk||!bk.data||!bk.data[r.chapter])return [];
    var ch=bk.data[r.chapter],out=[];
    Object.keys(ch).map(Number).sort(function(a,b){return a-b}).forEach(function(v){
      if(v>=r.from&&v<=r.to)out.push({v:v,t:doClean?clean(ch[v]):ch[v]});
    });
    return out;
  }
  function one(ref,doClean){
    var v=verses(ref,doClean);
    return v.length?v[0].t:'';
  }
  function plain(passage,doClean){
    return verses(passage,doClean).map(function(x){return x.t}).join(' ');
  }
  return {load:load,verses:verses,one:one,plain:plain,clean:clean,get ready(){return ready}};
})();

/* ---------- 공유 ---------- */
var WordShare=(function(){
  function text(day,body,who){
    var t='📖 오늘의 말씀 ('+day.date+')\n'+day.passage+' · '+day.title+'\n\n'+(body||'');
    if(who)t+='\n\n— '+who+' 드림';
    t+='\n\n동산감리교회 오늘의 말씀 나눔';
    return t;
  }
  function send(t){
    if(navigator.share){
      return navigator.share({text:t}).then(function(){wToast('공유했습니다')}).catch(function(){});
    }
    if(navigator.clipboard&&navigator.clipboard.writeText){
      return navigator.clipboard.writeText(t).then(function(){wToast('복사했습니다. 카톡에 붙여넣기 하세요')})
        .catch(function(){fallback(t)});
    }
    fallback(t);return Promise.resolve();
  }
  function fallback(t){
    var ta=document.createElement('textarea');ta.value=t;ta.style.cssText='position:fixed;opacity:0';
    document.body.appendChild(ta);ta.select();
    try{document.execCommand('copy');wToast('복사했습니다')}catch(e){wToast('복사를 지원하지 않는 기기입니다')}
    document.body.removeChild(ta);
  }
  return {text:text,send:send};
})();

/* ---------- 소리 내어 읽어 주기(어린이용) ---------- */
var WordVoice=(function(){
  var on=false;
  function supported(){return 'speechSynthesis' in window}
  function speak(t){
    if(!supported()){wToast('이 기기는 읽어주기를 지원하지 않아요');return}
    stop();
    var u=new SpeechSynthesisUtterance(String(t||'').slice(0,600));
    u.lang='ko-KR';u.rate=.92;u.pitch=1.05;
    u.onend=function(){on=false};
    on=true;window.speechSynthesis.speak(u);
  }
  function stop(){if(supported()){window.speechSynthesis.cancel();on=false}}
  return {supported:supported,speak:speak,stop:stop,get playing(){return on}};
})();

if(typeof module!=='undefined'&&module.exports)module.exports={WordStore:WordStore,WordUser:WordUser,WordBible:WordBible};
