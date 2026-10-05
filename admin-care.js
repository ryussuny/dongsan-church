/* 동산교회 관리자 — 엑셀 명단·전화심방 계획 가져오기
   「교인 명단 2026.xlsx」(장년 교인 · 자녀·청소년 · 교회학교 · 고령 집중돌봄)와
   「심방 계획 2026.xlsx」(심방 계획표)를 읽어 이 기기에만 저장한다.
   admin.html 의 S · notify · esc · phoneFmt · phoneDigits · birthFmt · memberMerge · renderAdminMembers 를 쓴다. */

const CARE_COLS={
  name:/^(이름|성명|성도명|교인명|name)$/i, phone:/(휴대폰|핸드폰|전화|연락처|phone|mobile)/i, role:/^(직분|role)$/i,
  gender:/^(성별)$/, birthday:/(생일|생년월일|birth)/i, lunar:/^(음\/양|음양|양\/음)$/, age:/^(나이)/, zone:/(속회|구역|소그룹|교구)/,
  area:/^(지역)$/, address:/(주소)/, note:/^(비고|특이사항)$/, grade:/^(학년)$/
};
const PLAN_COLS={
  date:/심방\s*예정일/, weekday:/^요일$/, order:/^순번$/, name:/^이름$/, role:/^직분$/, age:/^나이/, phone:/(휴대폰|연락처|전화)/,
  area:/^지역$/, zone:/속회/, priority:/우선순위/, called:/통화\s*여부/, calledDate:/실제\s*통화일/,
  prayer:/기도제목/, special:/특이사항/, followup:/후속\s*조치/
};
const SKIP_SHEETS=/(현황|요약|확인\s*필요|가이드|안내)/;

function excelDate(v){
  const s=String(v||'').trim();if(!s)return '';
  if(/^\d{5}(\.\d+)?$/.test(s)){const n=parseFloat(s);if(n>20000&&n<80000){const d=new Date(Date.UTC(1899,11,30)+Math.round(n)*86400000);return d.toISOString().slice(0,10)}}
  if(/^\d{8}$/.test(s))return s.slice(0,4)+'-'+s.slice(4,6)+'-'+s.slice(6,8);
  return birthFmt(s)||'';
}
function headerRow(rows){
  for(let i=0;i<Math.min(rows.length,6);i++){if(rows[i].some(c=>String(c).trim()==='이름'))return i}
  return -1;
}
function colMap(head,cols){
  const m={};head.forEach((h,i)=>{h=String(h).trim();for(const k in cols)if(m[k]==null&&cols[k].test(h)){m[k]=i;break}});return m;
}
function cell(r,i){return i==null?'':String(r[i]==null?'':r[i]).trim()}

/* 엑셀 묶음 → {members:[{group,list}], plan:[], care:[이름…]} */
function careParse(sheets){
  const res={members:[],plan:null,care:[],skipped:[]};
  sheets.forEach(sh=>{
    const hi=headerRow(sh.rows);
    if(hi<0||SKIP_SHEETS.test(sh.name)){res.skipped.push(sh.name);return}
    const head=sh.rows[hi],body=sh.rows.slice(hi+1);
    const hs=head.map(h=>String(h).trim());
    if(hs.some(h=>PLAN_COLS.date.test(h))){
      const m=colMap(head,PLAN_COLS),weekCol=hs.findIndex(h=>!h);
      let week='';
      res.plan=(res.plan||[]).concat(body.map((r,i)=>{
        if(weekCol>=0&&cell(r,weekCol))week=cell(r,weekCol);
        const name=cell(r,m.name);if(!name)return null;
        return {id:'v'+i+'_'+name,week:(weekCol>=0?cell(r,weekCol):'')||week,date:excelDate(cell(r,m.date)),weekday:cell(r,m.weekday),
          order:cell(r,m.order),name,role:cell(r,m.role),age:cell(r,m.age),phone:phoneFmt(cell(r,m.phone)),area:cell(r,m.area),zone:cell(r,m.zone),
          priority:cell(r,m.priority).toUpperCase(),called:/완료|^o$|^y/i.test(cell(r,m.called)),calledDate:excelDate(cell(r,m.calledDate)),
          prayer:cell(r,m.prayer),special:cell(r,m.special),followup:cell(r,m.followup)};
      }).filter(Boolean));
      return;
    }
    if(hs.includes('월')&&hs.includes('일')){res.skipped.push(sh.name);return} // 생일 달력은 명단과 겹친다
    const m=colMap(head,CARE_COLS);
    if(/집중\s*돌봄/.test(sh.name)){res.care=res.care.concat(body.map(r=>cell(r,m.name)).filter(Boolean));return}
    const group=sh.name.replace(/\s*교인$/,'').trim()||'교인';
    const list=body.map(r=>{
      const name=cell(r,m.name);if(!name||name.length>20)return null;
      const x={name,group,phone:phoneFmt(cell(r,m.phone)),role:cell(r,m.role),gender:cell(r,m.gender),birthday:excelDate(cell(r,m.birthday)),
        lunar:/음/.test(cell(r,m.lunar)),age:cell(r,m.age),zone:cell(r,m.zone),area:cell(r,m.area),address:cell(r,m.address),note:cell(r,m.note),grade:cell(r,m.grade)};
      if(x.area==='미분류')x.area='';
      if(x.birthday&&x.birthday.slice(0,4)>String(new Date().getFullYear()-1))x.birthday='0000'+x.birthday.slice(4); // 생년이 잘못 적힌 줄은 월·일만 믿는다
      Object.keys(x).forEach(k=>{if(x[k]===''||x[k]===false)delete x[k]});
      return x;
    }).filter(Boolean);
    if(list.length)res.members.push({group,list});
  });
  return res;
}

async function careImportXlsx(file){
  let sheets;
  try{sheets=await XlsxRead(await file.arrayBuffer())}catch(e){alert(e.message||'엑셀 파일을 읽지 못했습니다');return}
  const r=careParse(sheets);
  const lines=r.members.map(g=>`· ${g.group} ${g.list.length}명`);
  if(r.care.length)lines.push(`· 고령 집중돌봄 ${r.care.length}명 (표시만)`);
  if(r.plan)lines.push(`· 전화심방 계획 ${r.plan.length}명`);
  if(!lines.length){alert('이 파일에서 명단이나 심방 계획을 찾지 못했습니다.\n첫 줄에 「이름」 칸이 있는 시트인지 확인해 주세요.');return}
  if(!confirm(`「${file.name}」에서 찾았습니다.\n\n${lines.join('\n')}\n\n이 기기에만 저장합니다. 넣을까요?\n(같은 사람은 한 번만 들어가고, 빈 칸만 채웁니다)`))return;
  const msg=[];
  if(r.members.length){
    let all=[];r.members.forEach(g=>all=all.concat(g.list));
    const m=memberMerge(all,'xlsx');msg.push(`교인 새로 ${m.added}명${m.updated?' · 보완 '+m.updated+'명':''} (전체 ${m.total}명)`);
  }
  if(r.care.length){
    const ms=S.get('members',[]);let n=0;ms.forEach(x=>{if(r.care.includes(x.name)&&!x.care){x.care=true;n++}});S.set('members',ms);
  }
  if(r.plan){
    const old=S.get('visitPlan',[]),key=v=>v.name+'|'+v.date;
    const oldMap={};old.forEach(v=>oldMap[key(v)]=v);
    const merged=r.plan.map(v=>{const o=oldMap[key(v)];if(!o)return v;
      ['called','calledDate','prayer','special','followup'].forEach(k=>{if(!v[k]&&o[k])v[k]=o[k]});return v});
    S.set('visitPlan',merged);msg.push(`전화심방 계획 ${merged.length}명`);
  }
  renderAdminMembers();if(document.getElementById('pg-visit').classList.contains('active'))renderVisits();
  notify(msg.join(' · '));
}

/* ---------- 전화심방 계획 ---------- */
let planWeek=null;
function planToday(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function planWeeks(plan){
  const w={};plan.forEach(v=>{const k=v.week||'기타';(w[k]=w[k]||[]).push(v)});
  return Object.keys(w).sort((a,b)=>(parseInt(a)||99)-(parseInt(b)||99)).map(k=>({week:k,items:w[k].sort((a,b)=>(a.date||'').localeCompare(b.date||'')||(+a.order||0)-(+b.order||0))}));
}
function planCurrentWeek(weeks){
  const t=planToday();
  for(const w of weeks){const ds=w.items.map(v=>v.date).filter(Boolean).sort();if(!ds.length)continue;
    const mon=new Date(ds[0]);mon.setDate(mon.getDate()-((mon.getDay()+6)%7));const end=new Date(mon);end.setDate(end.getDate()+6);
    if(t>=mon.toISOString().slice(0,10)&&t<=end.toISOString().slice(0,10))return w.week}
  const next=weeks.find(w=>w.items.some(v=>v.date>=t));return next?next.week:(weeks[0]&&weeks[0].week);
}
function renderVisitPlan(){
  const box=document.getElementById('visitPlan');if(!box)return;
  const plan=S.get('visitPlan',[]);
  if(!plan.length){box.innerHTML=`<div class="st">📅 전화심방 계획</div><div class="cs-empty">아직 계획이 없습니다.<br>교인 화면의 「📥 명단 가져오기」에서 「심방 계획」 엑셀 파일을 고르면 여기에 나옵니다.</div>`;return}
  const weeks=planWeeks(plan);if(!planWeek||!weeks.some(w=>w.week===planWeek))planWeek=planCurrentWeek(weeks);
  const cur=weeks.find(w=>w.week===planWeek)||weeks[0],done=plan.filter(v=>v.called).length,t=planToday();
  const pc={A:'background:#FDECEA;color:#B23A2E',B:'background:#FFF3D6;color:#8B6914',C:'background:#EEF0F4;color:#4A4A6A'};
  box.innerHTML=`<div class="st" style="display:flex;justify-content:space-between;align-items:center"><span>📅 전화심방 계획</span><span style="font-size:11px;color:var(--text-light);font-weight:400">완료 ${done}/${plan.length}</span></div>
    <div style="display:flex;gap:4px;overflow-x:auto;padding-bottom:6px;margin-bottom:6px">${weeks.map(w=>{const d=w.items.filter(v=>v.called).length;
      return `<button type="button" class="chip" data-week="${esc(w.week)}" style="border:1px solid var(--border);cursor:pointer;font-size:11px;padding:5px 9px;white-space:nowrap;${w.week===cur.week?'background:var(--navy);color:#fff':'background:var(--cream)'}">${esc(w.week)} ${d}/${w.items.length}</button>`}).join('')}</div>
    ${cur.items.map(v=>{const tel=phoneDigits(v.phone),late=!v.called&&v.date&&v.date<t;
      return `<div class="list-item" style="flex-direction:column;align-items:stretch;gap:6px;${v.called?'opacity:.6':''}">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
          <div style="min-width:0"><div class="name">${v.priority?`<span class="chip" style="${pc[v.priority]||pc.C}">${esc(v.priority)}</span> `:''}${esc(v.name)} <span style="font-size:11px;font-weight:400;color:var(--text-mid)">${esc(v.role||'')}${v.age?' · '+esc(v.age)+'세':''}</span></div>
            <div class="sub">${esc((v.date||'').slice(5).replace('-','/'))} ${esc(v.weekday||'')}${late?' <b style="color:var(--danger)">· 지남</b>':''} · ${esc([v.zone,v.area].filter(x=>x&&x!=='미분류').join(' · '))}${v.called?' · ✅ '+esc((v.calledDate||'').slice(5).replace('-','/'))+' 통화':''}</div></div>
          ${tel?`<a href="tel:${tel}" class="btn btn-o" style="text-decoration:none;padding:6px 10px" aria-label="${esc(v.name)}에게 전화">📞</a>`:''}
        </div>
        ${v.prayer||v.special||v.followup?`<div style="font-size:11px;color:var(--text-mid);line-height:1.6;background:var(--cream);border-radius:6px;padding:6px 8px">${v.prayer?'🙏 '+esc(v.prayer)+'<br>':''}${v.special?'📌 '+esc(v.special)+'<br>':''}${v.followup?'➡ '+esc(v.followup):''}</div>`:''}
        <div style="display:flex;gap:6px">
          <button class="btn ${v.called?'btn-o':'btn-n'}" style="flex:1;justify-content:center" data-done="${esc(v.id)}">${v.called?'완료 취소':'✓ 통화 완료'}</button>
          <button class="btn btn-o" data-memo="${esc(v.id)}">📝 메모</button>
          <button class="btn btn-o" data-cs="${esc(v.id)}">🎧</button>
        </div>
      </div>`}).join('')}
    <div style="display:flex;gap:6px;margin-top:8px"><button class="btn btn-o" style="flex:1;justify-content:center" onclick="planExportCsv()">엑셀(CSV)로 내보내기</button></div>`;
  box.querySelectorAll('[data-week]').forEach(b=>b.onclick=()=>{planWeek=b.dataset.week;renderVisitPlan()});
  box.querySelectorAll('[data-done]').forEach(b=>b.onclick=()=>planToggle(b.dataset.done));
  box.querySelectorAll('[data-memo]').forEach(b=>b.onclick=()=>planMemo(b.dataset.memo));
  box.querySelectorAll('[data-cs]').forEach(b=>b.onclick=()=>{const v=S.get('visitPlan',[]).find(x=>x.id===b.dataset.cs);if(!v)return;
    const m=S.get('members',[]).find(x=>x.name===v.name);if(m)counselStartFor(m.id);else{go('counsel',document.querySelector('.nb[data-pg=counsel]'));document.getElementById('csMember').value=v.name}});
}
function planToggle(id){
  const plan=S.get('visitPlan',[]),v=plan.find(x=>x.id===id);if(!v)return;
  v.called=!v.called;v.calledDate=v.called?planToday():'';
  S.set('visitPlan',plan);
  if(v.called){ // 심방 기록에도 한 줄 남긴다
    const visits=S.get('visits',[]);let nid=S.get('visitNextId',1);
    visits.push({id:nid,date:v.calledDate,target:v.name,type:'전화심방',pastor:'담임목사',note:[v.prayer&&'기도: '+v.prayer,v.special,v.followup&&'후속: '+v.followup].filter(Boolean).join(' / '),planId:v.id});
    S.set('visits',visits);S.set('visitNextId',nid+1);notify(v.name+' 통화 완료');
  }else S.set('visits',S.get('visits',[]).filter(x=>x.planId!==v.id));
  renderVisits();
}
function planMemo(id){
  const plan=S.get('visitPlan',[]),v=plan.find(x=>x.id===id);if(!v)return;
  const p=prompt(v.name+' 님 기도제목',v.prayer||'');if(p===null)return;
  const s=prompt('특이사항',v.special||'');if(s===null)return;
  const f=prompt('후속 조치',v.followup||'');if(f===null)return;
  v.prayer=p.trim();v.special=s.trim();v.followup=f.trim();S.set('visitPlan',plan);
  const visits=S.get('visits',[]),rec=visits.find(x=>x.planId===v.id);
  if(rec){rec.note=[v.prayer&&'기도: '+v.prayer,v.special,v.followup&&'후속: '+v.followup].filter(Boolean).join(' / ');S.set('visits',visits)}
  renderVisits();notify('메모를 저장했습니다');
}
function planExportCsv(){
  const plan=S.get('visitPlan',[]);if(!plan.length)return;
  const q=x=>/[",\n]/.test(x||'')?'"'+String(x).replace(/"/g,'""')+'"':String(x||'');
  const head=['주차','심방 예정일','요일','순번','이름','직분','나이','휴대폰','지역','속회','우선순위','통화 여부','실제 통화일','기도제목','특이사항','후속 조치'];
  const rows=plan.map(v=>[v.week,v.date,v.weekday,v.order,v.name,v.role,v.age,v.phone,v.area,v.zone,v.priority,v.called?'완료':'',v.calledDate,v.prayer,v.special,v.followup].map(q).join(','));
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['﻿'+head.join(',')+'\n'+rows.join('\n')],{type:'text/csv'}));
  a.download=`동산교회_전화심방_${planToday()}.csv`;a.click();
}
/* 홈 알림에 쓰는 이번 주 요약 */
function planThisWeek(){
  const plan=S.get('visitPlan',[]);if(!plan.length)return null;
  const weeks=planWeeks(plan),wk=planCurrentWeek(weeks),w=weeks.find(x=>x.week===wk);if(!w)return null;
  return {week:wk,total:w.items.length,done:w.items.filter(v=>v.called).length,todo:w.items.filter(v=>!v.called).map(v=>v.name)};
}
