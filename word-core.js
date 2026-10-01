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
   word-config.js 의 WORD_API 에 구글 앱스 스크립트 주소가 적혀 있으면
   그곳에 함께 저장해 온 교회가 같은 나눔을 본다(server 모드).
   주소가 비어 있거나 연결이 안 되면 이 기기에만 저장한다(local 모드).
   어느 쪽이든 화면은 똑같이 돌아간다.

   어린이 글은 서버로 보내되 돌려받지 않는다. 목사님이 시트에서만 보신다. */
var WordStore=(function(){
  var K='dongsan_word_db', KC='dongsan_word_custom';
  var mode='local';
  var api=(typeof WORD_API==='string'?WORD_API:'').trim();

  function raw(){try{return JSON.parse(localStorage.getItem(K))||{}}catch(e){return {}}}
  function db(){var d=raw();if(!d.confirms)d.confirms=[];if(!d.shares)d.shares=[];return d}
  function save(d){try{localStorage.setItem(K,JSON.stringify(d))}catch(e){}}

  /* 앱스 스크립트는 text/plain 으로 보내야 미리 확인(preflight) 없이 통과한다 */
  function post(action,rec){
    return fetch(api,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
                      body:JSON.stringify({action:action,rec:rec})})
      .then(function(r){if(!r.ok)throw new Error('bad');return r.json()})
      .then(function(d){if(d&&d.ok===false)throw new Error(d.error||'거절됨');return d||{}});
  }

  function init(){
    if(!api)return Promise.resolve(mode='local');
    return fetch(api+'?action=ping')
      .then(function(r){if(!r.ok)throw new Error('no api');return r.json()})
      .then(function(d){mode=(d&&d.ok)?'server':'local';return mode})
      .catch(function(){mode='local';return mode});
  }

  function feed(date){
    if(mode==='server'){
      return fetch(api+'?action=feed&date='+encodeURIComponent(date)).then(function(r){return r.json()})
        .then(function(d){
          if(!d||d.ok===false)return localFeed(date);
          /* 서버가 돌려주는 나눔은 어른 글뿐이다. 어린이는 자기가 쓴 것만 이 기기에서 보탠다. */
          var mine=localFeed(date).shares.filter(function(s){return s.ver==='kids'});
          return {confirms:d.confirms||[],shares:(d.shares||[]).concat(mine)};
        })
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
    if(mode==='server')return post('confirm',rec).catch(function(){});
    return Promise.resolve();
  }

  function unconfirm(rec){
    var d=db();
    d.confirms=d.confirms.filter(function(c){return !(c.date===rec.date&&c.name===rec.name&&c.ver===rec.ver)});
    save(d);
    if(mode==='server')return post('confirm/delete',rec).catch(function(){});
    return Promise.resolve();
  }

  function share(rec){
    rec.id=rec.id||wUid();rec.ts=rec.ts||Date.now();rec.amens=rec.amens||[];
    var d=db();d.shares.push(rec);save(d);
    if(mode==='server')return post('share',rec).catch(function(){}).then(function(){return rec});
    return Promise.resolve(rec);
  }

  function removeShare(id,name){
    var d=db();d.shares=d.shares.filter(function(s){return !(s.id===id&&s.name===name)});save(d);
    if(mode==='server')return post('share/delete',{id:id,name:name}).catch(function(){});
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
    if(mode==='server')return post('amen',{id:id,name:name}).catch(function(){});
    return Promise.resolve();
  }

  /* 교회 서버에 묻기 (함께 읽은 수, 목사님 답장 등). 서버가 없거나 옛 판이면 null */
  function ask(params){
    if(mode!=='server')return Promise.resolve(null);
    var q=Object.keys(params).map(function(k){return encodeURIComponent(k)+'='+encodeURIComponent(params[k])}).join('&');
    return fetch(api+'?'+q+'&t='+Date.now()).then(function(r){return r.json()}).catch(function(){return null});
  }
  /* 이 기기에서 쓴 나눔 글 */
  function myShares(ver){return db().shares.filter(function(s){return !ver||s.ver===ver})}

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

  return {init:init,get mode(){return mode},ask:ask,myShares:myShares,feed:feed,confirm:confirm,unconfirm:unconfirm,share:share,removeShare:removeShare,
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
/* 은혜의 하루 — 이레 가운데 하루는 빠져도 연속이 이어진다.
   한 번 끊기면 다시 시작할 마음이 꺾이기 쉬워서 둔 너그러움이다.
     · 빠진 날 바로 앞날을 읽었어야 한다. 이틀을 잇달아 빠지면 끊긴다.
     · 은혜의 하루끼리는 이레 넘게 떨어져 있어야 한다.
     · 빠진 날은 연속 일수에 세지 않는다. 이어 줄 뿐이다.
   지난 날 말씀을 읽고 확인하면 그날이 채워져 은혜의 하루도 돌려받는다. */
var GRACE_GAP=7;
function wordStreakOf(done){
  var t=WordData.today(),n=0,cur=t,grace=[];
  if(!done[t])cur=WordData.shift(t,-1);       /* 오늘 아직이면 어제부터 센다 */
  for(;;){
    if(done[cur]){n++;cur=WordData.shift(cur,-1);continue}
    var before=WordData.shift(cur,-1),last=grace[grace.length-1];
    var roomy=!last||WordData.dayIndex(last)-WordData.dayIndex(cur)>=GRACE_GAP;
    if(done[before]&&roomy){grace.push(cur);cur=before;continue}
    break;
  }
  if(!n)grace=[];
  return {days:n,total:Object.keys(done).length,doneMap:done,grace:grace};
}
function wordStreak(name,ver){
  var done={};
  WordStore.myConfirms(name,ver).forEach(function(c){done[c.date]=true});
  return wordStreakOf(done);
}
/* 오늘 앞으로 읽지 못하고 지나간 날들 (가장 최근 것부터, 이레 안쪽만).
   한 번도 읽은 적이 없는 분께는 빈 목록을 돌려준다. */
function wordMissed(done){
  var t=WordData.today(),out=[];
  if(!Object.keys(done).length)return out;
  for(var i=1;i<=7;i++){
    var ds=WordData.shift(t,-i);
    if(done[ds])break;
    out.push(ds);
  }
  return out.length===7?[]:out;               /* 이레를 넘게 쉬었으면 오늘부터 새로 */
}

/* ---------- 온 교회가 함께 ----------
   이번 주 온 교회(어른·어린이)가 누른 「읽었습니다」 수를 막대로 보여 준다.
   이름은 오가지 않고 숫자만 온다. 서버가 옛 판이면 아무것도 그리지 않는다. */
function wTogether(cb){
  WordStore.ask({action:'together'}).then(function(d){cb(d&&d.ok&&d.week?d:null)});
}

/* ---------- 이름 묻기 ----------
   이름이 없을 때 설정 화면으로 보내지 않고, 그 자리에서 한 칸만 묻는다.
   저장하면 하려던 일(확인·나눔·아멘)을 이어서 한다. */
function wAskName(opt,done){
  opt=opt||{};
  var ov=document.getElementById('wName');
  /* 겉 상자는 flex 로 그리므로 hidden 속성 대신 display 로 여닫는다 */
  function hide(){if(ov)ov.style.display='none'}
  if(!ov){
    ov=document.createElement('div');ov.id='wName';
    ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-labelledby','wNameT');
    ov.style.cssText='position:fixed;inset:0;z-index:9998;background:rgba(30,24,18,.45);'+
      'display:none;align-items:flex-end;justify-content:center;padding:0 12px calc(12px + env(safe-area-inset-bottom))';
    ov.innerHTML='<form style="width:100%;max-width:440px;background:var(--lt-fffaf2,#fffaf2);border-radius:20px;padding:20px 18px 16px;'+
      'box-shadow:0 12px 40px rgba(0,0,0,.25);font-family:inherit">'+
      '<div id="wNameT" style="font-size:17px;font-weight:700;color:var(--dt-3a2e22,#3a2e22);margin-bottom:4px"></div>'+
      '<div id="wNameS" style="font-size:13px;color:#8a795f;line-height:1.7;margin-bottom:12px"></div>'+
      '<input id="wNameIn" maxlength="12" autocomplete="name" style="width:100%;font-size:17px;padding:13px 14px;'+
      'border:1px solid var(--lt-e0cdae,#e0cdae);border-radius:12px;background:var(--lt-ffffff,#fff);color:var(--dt-3a2e22,#3a2e22);font-family:inherit;outline:none">'+
      '<div style="display:flex;gap:8px;margin-top:12px">'+
      '<button type="button" id="wNameX" style="flex:none;padding:14px 16px;border:1px solid var(--lt-e0cdae,#e0cdae);border-radius:12px;'+
      'background:var(--lt-f4e6d3,#f4e6d3);color:var(--dt-6b5a45,#6b5a45);font-size:15px;font-family:inherit;cursor:pointer">나중에</button>'+
      '<button type="submit" id="wNameOk" style="flex:1;padding:14px;border:none;border-radius:12px;color:#fff;'+
      'font-size:16px;font-weight:700;font-family:inherit;cursor:pointer"></button></div></form>';
    document.body.appendChild(ov);
    ov.addEventListener('click',function(e){if(e.target===ov)hide()});
    document.getElementById('wNameX').onclick=function(){hide()};
  }
  document.getElementById('wNameT').textContent=opt.title||'이름을 알려 주세요';
  document.getElementById('wNameS').textContent=opt.sub||'한 번만 적으시면 이 휴대폰이 기억합니다.';
  var inp=document.getElementById('wNameIn'),ok=document.getElementById('wNameOk');
  inp.placeholder=opt.placeholder||'예) 김은혜';
  ok.textContent=opt.ok||'저장하고 계속';
  ok.style.background=opt.color||'linear-gradient(135deg,#b3593f,#8f4531)';
  ov.querySelector('form').onsubmit=function(e){
    e.preventDefault();
    var n=inp.value.trim();
    if(!n){inp.focus();return}
    hide();
    done(n);
  };
  inp.value='';ov.style.display='flex';
  setTimeout(function(){inp.focus()},60);
}

/* 한 번 누른 버튼은 일이 끝날 때까지 잠근다.
   저장에 1~2초가 걸리는 사이 한 번 더 누르면 같은 글이 두 번 올라가던 일을 막는다. */
function wOnce(btn,busyText,work){
  if(btn&&btn.dataset.busy)return;
  var label=btn?btn.textContent:'';
  if(btn){btn.dataset.busy='1';btn.disabled=true;if(busyText)btn.textContent=busyText}
  var free=function(){if(btn){delete btn.dataset.busy;btn.disabled=false;if(busyText&&btn.textContent===busyText)btn.textContent=label}};
  return Promise.resolve().then(work).then(function(v){free();return v},function(e){free();throw e});
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
  /* 각주 기호만 걷어낸다.
     개역개정 원문의 괄호·대괄호는 본문이므로 절대 지우지 않는다 —
     통째로 지우면 신 3:9·3:11 은 빈 절이 되고 145절이 훼손된다. */
  function clean(t){
    return String(t||'')
      .replace(/\([a-z](?:\s[^)]*)?\)/g,'')     // "(a 또는 …)", "(a)" 같은 각주 괄호
      .replace(/(^|\s)[a-z](?=[가-힣])/g,'$1')    // 낱말 앞에 붙은 각주 문자
      .replace(/[a-z]:(?=\d)/g,'')                // "창a:1" → "창1"
      .replace(/\s{2,}/g,' ').trim();
  }
  function verses(passage,doClean){
    var r=WordData.parseRef(passage);
    if(!r||typeof BIBLE_DATA==='undefined')return [];
    var bk=BIBLE_DATA[r.book];
    if(!bk||!bk.data)return [];
    var out=[],multi=String(r.chapter)!==String(r.toChapter||r.chapter);
    WordData.refSpans(r,bk).forEach(function(sp){
      var ch=bk.data[sp.chapter];
      for(var v=sp.from;v<=sp.to;v++){
        if(!ch[String(v)])continue;
        out.push({v:multi?sp.chapter+':'+v:v,t:doClean?clean(ch[String(v)]):ch[String(v)]});
      }
    });
    return out;
  }
  /* 본문 데이터에 빠져 있는 절 번호 (이 성경 파일에는 일부 절이 누락돼 있다) */
  function missing(passage){
    var r=WordData.parseRef(passage);
    if(!r||typeof BIBLE_DATA==='undefined')return [];
    var bk=BIBLE_DATA[r.book];
    if(!bk||!bk.data)return [];
    var out=[],multi=String(r.chapter)!==String(r.toChapter||r.chapter);
    WordData.refSpans(r,bk).forEach(function(sp){
      var ch=bk.data[sp.chapter];
      for(var v=sp.from;v<=sp.to;v++)if(!ch[String(v)])out.push(multi?sp.chapter+':'+v:v);
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
  return {load:load,verses:verses,one:one,plain:plain,clean:clean,missing:missing,get ready(){return ready}};
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
  /* 단톡방에 올리기 좋은 짧은 카드.
     길면 넘기고, 짧으면 누른다 — 구절 하나, 물음 하나, 주소 하나. */
  var SITE='https://ryussuny.github.io/dongsan-church/';
  function card(day,verse,verseRef){
    var p=day.date.split('-');
    var t='🌅 '+(+p[1])+'월 '+(+p[2])+'일 '+WordData.weekday(day.date)+(WordData.weekday(day.date)==='주일'?'':'요일')+' · 오늘의 말씀\n'+
      day.passage+'\n「'+day.title+'」';
    if(verse)t+='\n\n“'+verse+'”'+(verseRef?' ('+verseRef+')':'');
    var q=day.adult&&day.adult.questions&&day.adult.questions[0];
    if(q)t+='\n\n💭 '+q;
    t+='\n\n👉 오늘 말씀 읽기 (어른·어린이)\n'+SITE+'word.html';
    return t;
  }
  return {text:text,send:send,card:card};
})();

/* ---------- 소리 내어 읽어 주기 ----------
   긴 글을 한 번에 넘기면 몇몇 휴대폰에서 중간에 멈춘다.
   그래서 절이나 문장 단위로 잘라 차례로 읽는다.
   onChange 는 읽기 시작·끝날 때 버튼 모양을 바꾸라고 부른다. */
var WordVoice=(function(){
  var on=false,queue=[],hook=null;
  function supported(){return 'speechSynthesis' in window}
  function set(v){on=v;if(hook)try{hook(v)}catch(e){}}
  function pieces(t){
    var out=[];
    (Array.isArray(t)?t:[t]).forEach(function(x){
      (String(x||'').match(/[^.!?]+[.!?]*/g)||[]).forEach(function(s){  /* 문장마다 끊는다 */
        s=s.trim();
        while(s.length>180){var cut=s.lastIndexOf(' ',180);if(cut<60)cut=180;out.push(s.slice(0,cut));s=s.slice(cut).trim()}
        if(s)out.push(s);
      });
    });
    return out;
  }
  function next(){
    if(!on)return;
    var s=queue.shift();
    if(!s){set(false);return}
    var u=new SpeechSynthesisUtterance(s);
    u.lang='ko-KR';u.rate=rate;u.pitch=pitch;
    u.onend=next;u.onerror=function(){queue=[];set(false)};
    window.speechSynthesis.speak(u);
  }
  var rate=.92,pitch=1.05;
  /* t: 글 하나 또는 글 목록. o: {rate,pitch,onChange} */
  function speak(t,o){
    if(!supported()){wToast('이 기기는 읽어 주기를 지원하지 않습니다');return}
    stop();o=o||{};
    rate=o.rate||.92;pitch=o.pitch||1.05;hook=o.onChange||null;
    queue=pieces(t);set(true);next();
  }
  function stop(){queue=[];if(supported())window.speechSynthesis.cancel();if(on)set(false)}
  return {supported:supported,speak:speak,stop:stop,get playing(){return on}};
})();

if(typeof module!=='undefined'&&module.exports)module.exports={WordStore:WordStore,WordUser:WordUser,WordBible:WordBible};
