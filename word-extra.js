/* ===========================================================
   동산감리교회 · 오늘의 말씀 — 더 깊이, 더 재미있게
   어른·어린이 화면이 함께 쓰는 것들을 모았다.

     where   지금 이야기, 어디쯤일까 (성경 큰 이야기 속 오늘의 자리)
     hook    읽기 전 궁금증 한 줄
     quiz    요일마다 다른 퀴즈 (빈칸 채우기 · 순서 맞추기 · 고르기)
     cards   성경 인물 카드
     memory  이번 주 암송 구절
     week    한 주 돌아보기
     table   오늘의 식탁 질문

   화면 그리기는 각 페이지가 맡고, 이 파일은 내용과 규칙만 낸다.
   word-data.js · word-core.js 다음에 불러야 한다.
   =========================================================== */
var WordExtra=(function(){

  /* ---------- 날마다 같은 결과가 나오는 섞기 ----------
     같은 날 같은 퀴즈는 누가 열어도, 몇 번을 열어도 같은 순서로 나와야 한다. */
  function hash(s){var h=2166136261;s=String(s);for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
  function rng(key){
    var x=hash(key)||1;
    return function(){x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;return x/4294967296};
  }
  function shuffle(arr,key){
    var a=arr.slice(),r=rng(key);
    for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}
    return a;
  }

  /* ---------- 성경 큰 이야기 ---------- */
  var ERAS=[
    {n:'창조',e:'🌍'},{n:'족장',e:'⛺'},{n:'출애굽',e:'🌊'},{n:'가나안',e:'🏞️'},{n:'사사',e:'⚖️'},
    {n:'통일 왕국',e:'👑'},{n:'나뉜 왕국',e:'💔'},{n:'포로와 귀환',e:'🧱'},{n:'예수님',e:'✝️'},{n:'교회',e:'🕊️'}
  ];
  /* 책마다 [이 장까지, 시대 번호] — 앞에서부터 처음 맞는 것을 쓴다.
     여기 없는 책(사도행전부터 요한계시록까지)은 교회 시대로 본다. */
  var BOOK_ERA={
    '창세기':[[11,0],[50,1]],'출애굽기':[[40,2]],'레위기':[[27,2]],'민수기':[[36,2]],'신명기':[[34,2]],
    '여호수아':[[24,3]],'사사기':[[21,4]],'룻기':[[4,4]],
    '사무엘상':[[7,4],[31,5]],'사무엘하':[[24,5]],'열왕기상':[[11,5],[22,6]],'열왕기하':[[24,6],[25,7]],
    '역대상':[[29,5]],'역대하':[[9,5],[35,6],[36,7]],'에스라':[[10,7]],'느헤미야':[[13,7]],'에스더':[[10,7]],
    '욥기':[[42,1]],'시편':[[150,5]],'잠언':[[31,5]],'전도서':[[12,5]],'아가':[[8,5]],
    '이사야':[[66,6]],'예레미야':[[52,6]],'예레미야애가':[[5,7]],'에스겔':[[48,7]],'다니엘':[[12,7]],
    '호세아':[[14,6]],'요엘':[[3,6]],'아모스':[[9,6]],'오바댜':[[1,6]],'요나':[[4,6]],'미가':[[7,6]],
    '나훔':[[3,6]],'하박국':[[3,6]],'스바냐':[[3,6]],'학개':[[2,7]],'스가랴':[[14,7]],'말라기':[[4,7]],
    '마태복음':[[28,8]],'마가복음':[[16,8]],'누가복음':[[24,8]],'요한복음':[[21,8]]
  };
  /* 읽기표가 길게 머무는 책은 장마다 지금 무슨 일이 벌어지는지 한 줄로 알려 준다 */
  var STORY={
    '열왕기상':[[2,'다윗에서 솔로몬으로 왕위가 넘어가다'],[11,'통일 왕국 · 솔로몬 왕 · 성전을 짓다'],
               [16,'나라가 남유다와 북이스라엘로 나뉘다'],[22,'북이스라엘 · 아합 왕 · 선지자 엘리야']],
    '열왕기하':[[1,'북이스라엘 · 아하시야 왕 · 선지자 엘리야'],[2,'엘리야가 하늘로 올라가고 엘리사가 뒤를 잇다'],
               [8,'북이스라엘 · 선지자 엘리사의 때'],[10,'북이스라엘 · 예후 왕'],[12,'남유다 · 아달랴와 어린 왕 요아스'],
               [13,'북이스라엘 · 엘리사가 세상을 떠나다'],[16,'두 나라의 왕들이 차례로 바뀌다'],
               [17,'북이스라엘이 앗수르에 무너지다 (주전 722년)'],[20,'남유다만 남다 · 히스기야 왕 · 선지자 이사야'],
               [21,'남유다 · 므낫세와 아몬 왕'],[23,'남유다 · 요시야 왕이 말씀을 다시 찾다'],
               [24,'남유다의 마지막 왕들 · 선지자 예레미야의 때'],[25,'예루살렘이 바벨론에 무너지다 (주전 586년)']],
    '사무엘상':[[3,'사사 시대의 끝 · 제사장 엘리와 어린 사무엘'],[7,'법궤를 빼앗겼다 돌아오다 · 사사 사무엘'],
               [12,'백성이 왕을 구하다 · 사울이 첫 왕이 되다'],[15,'사울 왕의 불순종'],
               [17,'다윗이 기름 부음을 받고 골리앗을 이기다'],[20,'다윗과 요나단 · 사울의 시기'],
               [30,'쫓기는 다윗 · 광야에서 빚으시는 시간'],[31,'사울 왕이 죽다']],
    '사무엘하':[[4,'다윗이 헤브론에서 유다의 왕이 되다'],[7,'온 이스라엘의 왕 다윗 · 예루살렘과 영원한 언약'],
               [10,'다윗의 나라가 굳게 서다'],[12,'다윗의 죄와 나단의 책망'],[18,'아들 압살롬의 반역'],
               [20,'다윗이 예루살렘으로 돌아오다'],[24,'다윗의 마지막 노래와 이야기']]
  };
  function pick(list,ch){for(var i=0;i<list.length;i++)if(ch<=list[i][0])return list[i][1];return list[list.length-1][1]}
  function where(day){
    var r=WordData.parseRef(day.passage);
    if(!r)return null;
    var ch=parseInt(r.chapter,10),book=r.book;
    var era=BOOK_ERA[book]?pick(BOOK_ERA[book],ch):9;
    var total=(typeof BIBLE_DATA!=='undefined'&&BIBLE_DATA[book]&&BIBLE_DATA[book].chapters)||0;
    return {era:era,eras:ERAS,book:book,ch:ch,total:total,story:STORY[book]?pick(STORY[book],ch):''};
  }

  /* ---------- 읽기 전 궁금증 ----------
     목사님이 따로 적어 두신 물음(hook)이 있으면 그것을, 없으면 그날 퀴즈를
     읽기 전 물음으로 쓴다. 답은 본문 안에 있고, 읽은 뒤에 열린다. */
  function hook(day){
    if(day.hook&&day.hook.q)return {q:day.hook.q,a:day.hook.a||''};
    var z=day.kids&&day.kids.quiz;
    if(!z||!z.q)return null;
    return {q:z.q,a:z.c[z.a]};
  }

  /* ---------- 요일마다 다른 퀴즈 ----------
     월·목 빈칸 채우기(핵심 구절), 수·토 순서 맞추기(본문 세 절), 나머지 고르기.
     본문을 아직 못 받았거나 재료가 모자라면 고르기로 돌아간다. */
  var KIND={'월':'blank','목':'blank','수':'order','토':'order'};
  function bare(w){return String(w).replace(/[.,!?“”"'‘’()·:;]+$/g,'').replace(/^[“"'‘(]+/,'')}
  function choice(day){
    var z=day.kids.quiz,idx=z.c.map(function(_,i){return i});
    var ord=shuffle(idx,'c'+day.date);
    return {type:'choice',q:z.q,c:ord.map(function(i){return z.c[i]}),a:ord.indexOf(z.a)};
  }
  function blank(day,text){
    var w=String(text||'').split(/\s+/).filter(Boolean);
    var cand=[];
    w.forEach(function(t,i){var b=bare(t);if(i>0&&b.length>=2&&!/\d/.test(b))cand.push(i)});
    if(cand.length<3)return null;
    var r=rng('b'+day.date),hit=cand[Math.floor(r()*cand.length)],ans=bare(w[hit]);
    var others=shuffle(cand.filter(function(i){return bare(w[i])!==ans}),'o'+day.date);
    var seen={},wrong=[];
    others.forEach(function(i){var b=bare(w[i]);if(!seen[b]&&wrong.length<2){seen[b]=1;wrong.push(b)}});
    if(wrong.length<2)return null;
    var c=shuffle([ans].concat(wrong),'bc'+day.date);
    var at=w[hit].indexOf(ans),pre=w[hit].slice(0,at),post=w[hit].slice(at+ans.length);   /* 따옴표·마침표는 제자리에 둔다 */
    var head=w.slice(0,hit).join(' '),rest=w.slice(hit+1).join(' ');
    return {type:'blank',q:'말씀에서 빠진 낱말은 무엇일까요?',
            before:head+(head?' ':'')+pre,after:post+(rest?' '+rest:''),
            c:c,a:c.indexOf(ans),ref:day.kids.verseRef};
  }
  function cut(t,n){t=String(t);return t.length>n?t.slice(0,n).replace(/\s+\S*$/,'')+'…':t}
  function order(day,verses){
    if(!verses||verses.length<3)return null;
    var n=verses.length,pickI=[0,Math.floor((n-1)/2),n-1];
    if(pickI[1]===0||pickI[1]===n-1)return null;
    var items=pickI.map(function(i,k){return {k:k,v:verses[i].v,t:cut(verses[i].t,34)}});
    var sh=shuffle(items,'o'+day.date);
    if(sh[0].k===0&&sh[1].k===1)sh=[sh[1],sh[2],sh[0]];      /* 이미 맞춰진 채로 나오지 않게 */
    return {type:'order',q:'오늘 본문에서 일어난 차례대로 눌러 보세요',items:sh};
  }
  function quiz(day,opt){
    opt=opt||{};
    var kind=KIND[WordData.weekday(day.date)]||'choice',out=null;
    if(kind==='blank')out=blank(day,opt.keyText);
    if(kind==='order')out=order(day,opt.verses);
    return out||choice(day);
  }

  /* ---------- 성경 인물 카드 ----------
     at: [책, 장] — 그 장이 들어 있는 날 도장을 찍으면 카드가 들어온다. 장이 0이면 그 책 어디든. */
  var CARDS=[
    {id:'adam',n:'아담과 하와',e:'🌿',t:'하나님의 형상대로 지음받은 첫 사람',at:[['창세기',1],['창세기',2]]},
    {id:'noah',n:'노아',e:'🚢',t:'하나님 말씀대로 방주를 지은 사람',at:[['창세기',6]]},
    {id:'abraham',n:'아브라함',e:'⭐',t:'하나님의 부르심에 길을 떠난 믿음의 조상',at:[['창세기',12]]},
    {id:'isaac',n:'이삭',e:'🐏',t:'여호와 이레를 겪은 약속의 아들',at:[['창세기',22]]},
    {id:'joseph',n:'요셉',e:'🌈',t:'형들을 용서한 꿈꾸는 사람',at:[['창세기',37],['창세기',50]]},
    {id:'moses',n:'모세',e:'🌊',t:'백성을 이끌고 홍해를 건넌 지도자',at:[['출애굽기',0]]},
    {id:'joshua',n:'여호수아',e:'🎺',t:'강하고 담대하게 가나안에 들어간 지도자',at:[['여호수아',0]]},
    {id:'ruth',n:'룻',e:'🌾',t:'“어머니의 하나님이 나의 하나님” 하고 따라간 며느리',at:[['룻기',0]]},
    {id:'hannah',n:'한나',e:'🙏',t:'울며 기도한 사무엘의 어머니',at:[['사무엘상',1]]},
    {id:'eli',n:'엘리',e:'🕯️',t:'어린 사무엘과 함께 성전을 지킨 제사장',at:[['사무엘상',1]]},
    {id:'samuel',n:'사무엘',e:'👂',t:'“말씀하옵소서” 하고 대답한 아이',at:[['사무엘상',3]]},
    {id:'saul',n:'사울',e:'🫏',t:'나귀를 찾다가 왕이 된 이스라엘의 첫 왕',at:[['사무엘상',9]]},
    {id:'jonathan',n:'요나단',e:'🏹',t:'다윗을 목숨처럼 아낀 친구',at:[['사무엘상',14],['사무엘상',18]]},
    {id:'david',n:'다윗',e:'🎶',t:'하나님이 중심을 보고 고르신 목동 왕',at:[['사무엘상',16]]},
    {id:'goliath',n:'골리앗',e:'🗿',t:'돌 하나에 쓰러진 거인',at:[['사무엘상',17]]},
    {id:'abigail',n:'아비가일',e:'🧺',t:'지혜로운 말로 싸움을 막은 여인',at:[['사무엘상',25]]},
    {id:'mephibosheth',n:'므비보셋',e:'🍽️',t:'왕의 식탁에 초대받은 친구의 아들',at:[['사무엘하',9]]},
    {id:'nathan',n:'나단',e:'👉',t:'“당신이 그 사람이라” 말한 선지자',at:[['사무엘하',7],['사무엘하',12]]},
    {id:'mighty',n:'세 용사',e:'💧',t:'목숨 걸고 물을 떠 온 다윗의 용사들',at:[['사무엘하',23]]},
    {id:'solomon',n:'솔로몬',e:'👑',t:'무엇보다 지혜를 구한 왕',at:[['열왕기상',3],['사무엘하',12]]},
    {id:'elijah',n:'엘리야',e:'🔥',t:'갈멜산에서 불로 응답받은 선지자',at:[['열왕기상',17],['열왕기상',18],['열왕기하',2]]},
    {id:'elisha',n:'엘리사',e:'🧥',t:'엘리야의 겉옷을 이어받은 선지자',at:[['열왕기하',2]]},
    {id:'shunammite',n:'수넴 여인',e:'🏡',t:'엘리사를 위해 작은 방을 내어 준 여인',at:[['열왕기하',4]]},
    {id:'naaman',n:'나아만',e:'🫧',t:'요단강에 일곱 번 몸을 씻고 나은 장군',at:[['열왕기하',5]]},
    {id:'joash',n:'요아스',e:'👶',t:'일곱 살에 왕이 된 아이',at:[['열왕기하',11]]},
    {id:'hezekiah',n:'히스기야',e:'🛡️',t:'하나님만 의지한 왕',at:[['열왕기하',18]]},
    {id:'isaiah',n:'이사야',e:'📯',t:'“두려워하지 말라” 하나님 말씀을 전한 선지자',at:[['열왕기하',19],['이사야',0]]},
    {id:'josiah',n:'요시야',e:'📜',t:'잃어버린 말씀을 다시 찾은 왕',at:[['열왕기하',22]]},
    {id:'nehemiah',n:'느헤미야',e:'🧱',t:'무너진 성벽을 다시 쌓은 사람',at:[['느헤미야',0]]},
    {id:'esther',n:'에스더',e:'👸',t:'“죽으면 죽으리이다” 용기를 낸 왕비',at:[['에스더',0]]},
    {id:'daniel',n:'다니엘',e:'🦁',t:'사자굴에서도 하나님을 섬긴 사람',at:[['다니엘',0]]},
    {id:'jonah',n:'요나',e:'🐋',t:'다시 기회를 받은 선지자',at:[['요나',0]]},
    {id:'magi',n:'동방 박사',e:'🎁',t:'별을 따라 아기 예수님께 온 사람들',at:[['마태복음',2]]},
    {id:'shepherds',n:'목자들',e:'🐑',t:'예수님 나신 기쁜 소식을 처음 들은 사람들',at:[['누가복음',2]]},
    {id:'jesus',n:'예수님',e:'✝️',t:'우리를 구원하러 오신 하나님의 아들',at:[['마태복음',0],['마가복음',0],['누가복음',0],['요한복음',0]]},
    {id:'peter',n:'베드로',e:'🎣',t:'예수님을 보고 물 위를 걸었던 제자',at:[['마태복음',14]]},
    {id:'samaritan',n:'선한 사마리아 사람',e:'🩹',t:'강도 만난 이웃을 도와준 사람',at:[['누가복음',10]]},
    {id:'prodigal',n:'돌아온 아들',e:'🏠',t:'아버지 품으로 돌아온 아들',at:[['누가복음',15]]},
    {id:'zacchaeus',n:'삭개오',e:'🌳',t:'뽕나무에 올라가 예수님을 만난 세리',at:[['누가복음',19]]},
    {id:'boy',n:'도시락 소년',e:'🐟',t:'보리떡 다섯 개와 물고기 두 마리를 드린 아이',at:[['요한복음',6]]},
    {id:'mary',n:'막달라 마리아',e:'🌅',t:'부활하신 예수님을 처음 만난 사람',at:[['요한복음',20]]},
    {id:'paul',n:'사도 바울',e:'✉️',t:'여러 교회에 편지를 써 보낸 사도',
     at:[['로마서',0],['고린도전서',0],['갈라디아서',0],['에베소서',0],['빌립보서',0]]}
  ];
  /* 이 본문에서 만나는 카드들 */
  function cardsIn(passage){
    var r=WordData.parseRef(passage);if(!r)return [];
    var c1=parseInt(r.chapter,10),c2=parseInt(r.toChapter||r.chapter,10);
    return CARDS.filter(function(k){
      return k.at.some(function(a){return a[0]===r.book&&(a[1]===0||(a[1]>=c1&&a[1]<=c2))});
    });
  }
  /* 도장 찍은 날들로 모은 카드 {id: 처음 받은 날} */
  function collected(dates,custom){
    var got={};
    dates.slice().sort().forEach(function(ds){
      cardsIn(WordData.forDate(ds,custom).passage).forEach(function(k){if(!got[k.id])got[k.id]=ds});
    });
    return got;
  }
  function cardHint(k){
    var a=k.at[0];return a[1]?a[0]+' '+a[1]+'장에서 만나요':a[0]+'에서 만나요';
  }

  /* ---------- 이번 주 암송 구절 ----------
     한 주는 월요일에 시작해 주일에 끝난다. 그 주 핵심 구절 가운데 가장 짧은 것을 고른다.
     날이 갈수록 가려지는 낱말이 늘어나고, 주일에는 전부 가려진다. */
  function monday(ds){
    var dow=new Date(WordData.dayIndex(ds)*86400000).getUTCDay();      /* 0=주일 */
    return WordData.shift(ds,-((dow+6)%7));
  }
  /* 읽기표 기간에는 주마다 외울 만한 구절을 골라 두었다(월요일 날짜 → 구절, 외울 부분).
     그 밖의 주는 그 주 핵심 구절 가운데 문장이 끝나는 가장 짧은 절을 고른다. */
  var MEMORY={
    '2026-09-21':['열왕기하 17:39','오직 너희 하나님 여호와만을 경외하라 그가 너희를 모든 원수의 손에서 건져내리라'],
    '2026-09-28':['열왕기하 20:5','내가 네 기도를 들었고 네 눈물을 보았노라'],
    '2026-10-05':['열왕기하 23:3','마음을 다하고 뜻을 다하여 여호와께 순종하고 그의 계명과 법도와 율례를 지켜'],
    '2026-10-12':['사무엘상 2:2',''],
    '2026-10-19':['사무엘상 3:10','말씀하옵소서 주의 종이 듣겠나이다'],
    '2026-10-26':['사무엘상 7:12','여호와께서 여기까지 우리를 도우셨다'],
    '2026-11-02':['사무엘상 15:22','순종이 제사보다 낫고 듣는 것이 숫양의 기름보다 나으니'],
    '2026-11-09':['사무엘상 17:45','나는 만군의 여호와의 이름 곧 네가 모욕하는 이스라엘 군대의 하나님의 이름으로 네게 나아가노라'],
    '2026-11-16':['사무엘상 24:12',''],
    '2026-11-23':['사무엘상 30:6','그의 하나님 여호와를 힘입고 용기를 얻었더라'],
    '2026-11-30':['사무엘하 7:22','주는 위대하시니 이는 우리 귀로 들은 대로는 주와 같은 이가 없고 주 외에는 신이 없음이니이다'],
    '2026-12-07':['사무엘하 9:7','무서워하지 말라 내가 반드시 네 아버지 요나단으로 말미암아 네게 은총을 베풀리라'],
    '2026-12-14':['사무엘하 15:21','내 주 왕께서 어느 곳에 계시든지 사나 죽으나 종도 그 곳에 있겠나이다'],
    '2026-12-21':['사무엘하 22:2','여호와는 나의 반석이시요 나의 요새시요 나를 위하여 나를 건지시는 자시요']
  };
  function memory(ds,custom){
    if(!WordBible.ready)return null;
    var mon=monday(ds),best=null,fx=MEMORY[mon];
    if(fx){
      var full=WordBible.one(fx[0],true);
      if(full&&(!fx[1]||full.indexOf(fx[1])>=0))best={ref:fx[0],text:fx[1]||full};
    }
    var cand=null;
    for(var i=0;i<7&&!best;i++){
      var d=WordData.forDate(WordData.shift(mon,i),custom),ref=d.kids&&d.kids.verseRef;
      var t=ref?WordBible.one(ref,true):'';
      if(!t)continue;
      /* “…행하였으나”처럼 문장이 끝나지 않은 절은 외우기 어색하니 뒤로 미룬다 */
      var whole=/(다|라|요|서|냐|까)[.!?”"]*$/.test(t)?0:1;
      if(!cand||whole<cand.whole||(whole===cand.whole&&t.length<cand.text.length))cand={ref:ref,text:t,whole:whole};
    }
    best=best||cand;
    if(!best)return null;
    best.week=mon;
    best.step=WordData.dayIndex(ds)-WordData.dayIndex(mon);             /* 0(월) ~ 6(주일) */
    var words=best.text.split(/\s+/).filter(Boolean);
    var ratio=[0,.2,.35,.5,.65,.8,1][best.step]||0;
    var hideN=Math.round(words.length*ratio);
    var ord=shuffle(words.map(function(_,i){return i}),'m'+mon),hidden={};
    ord.slice(0,hideN).forEach(function(i){hidden[i]=true});
    best.words=words.map(function(w,i){return {w:w,hide:!!hidden[i]}});
    return best;
  }
  var MK='dongsan_word_memory';
  function memoryDone(){try{return JSON.parse(localStorage.getItem(MK))||{}}catch(e){return {}}}
  function markMemory(week,ref){var m=memoryDone();m[week]=ref||true;try{localStorage.setItem(MK,JSON.stringify(m))}catch(e){}return m}

  /* ---------- 한 주 돌아보기 ----------
     토요일과 주일에 그 주 월~토 이야기를 한 줄씩 묶는다. */
  function isReviewDay(ds){var w=WordData.weekday(ds);return w==='토'||w==='주일'}
  function week(ds,custom){
    var mon=monday(ds),out=[];
    for(var i=0;i<6;i++){
      var d=WordData.forDate(WordData.shift(mon,i),custom);
      var line=(d.kids&&!d.kids.auto&&d.kids.summary)||'';
      out.push({date:d.date,passage:d.passage,title:d.title,line:line,quiz:d.kids&&!d.kids.auto?choice(d):null});
    }
    return out;
  }

  /* ---------- 오늘의 식탁 질문 ----------
     어른 화면과 어린이 화면에 같은 물음이 나가야 식탁에서 이어진다.
     따로 적어 둔 물음(tq)이 없는 날은 어른 묵상 질문 대신 누구나 답할 수 있는 물음을 쓴다. */
  function table(day){
    return day.tq||('「'+day.title+'」 이야기에서 가장 마음에 남은 장면은 무엇인가요? 오늘 그 말씀대로 산 순간이 있었나요?');
  }

  return {where:where,eras:ERAS,hook:hook,quiz:quiz,cards:CARDS,cardsIn:cardsIn,collected:collected,cardHint:cardHint,
          monday:monday,memory:memory,memoryDone:memoryDone,markMemory:markMemory,
          isReviewDay:isReviewDay,week:week,table:table,shuffle:shuffle};
})();
