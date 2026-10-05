/* 엑셀(.xlsx) 파일을 브라우저 안에서 읽는다 — 바깥 라이브러리 없이.
   .xlsx 는 ZIP 묶음이고, 그 안의 workbook.xml · sharedStrings.xml · sheetN.xml 을 풀어 읽는다.
   파일은 이 기기 밖으로 나가지 않는다.
   XlsxRead(arrayBuffer) → Promise<[{name, rows:[[문자열…]…]}]> */
(function(){
  function u16(v,o){return v.getUint16(o,true)}
  function u32(v,o){return v.getUint32(o,true)}
  function unzipIndex(buf){
    const v=new DataView(buf);let e=-1;
    for(let i=buf.byteLength-22;i>=Math.max(0,buf.byteLength-65557);i--){if(u32(v,i)===0x06054b50){e=i;break}}
    if(e<0)throw new Error('엑셀(.xlsx) 파일이 아닙니다');
    const n=u16(v,e+10);let p=u32(v,e+16);const out={},dec=new TextDecoder();
    for(let k=0;k<n;k++){
      if(u32(v,p)!==0x02014b50)break;
      const method=u16(v,p+10),csize=u32(v,p+20),nl=u16(v,p+28),xl=u16(v,p+30),cl=u16(v,p+32),off=u32(v,p+42);
      const name=dec.decode(new Uint8Array(buf,p+46,nl));
      out[name]={method,csize,off};p+=46+nl+xl+cl;
    }
    return out;
  }
  async function unzipText(buf,idx,name){
    const f=idx[name];if(!f)return null;
    const v=new DataView(buf);
    if(u32(v,f.off)!==0x04034b50)throw new Error('파일이 손상되었습니다');
    const start=f.off+30+u16(v,f.off+26)+u16(v,f.off+28);
    const raw=new Uint8Array(buf,start,f.csize);
    let bytes;
    if(f.method===0)bytes=raw;
    else if(f.method===8){
      if(typeof DecompressionStream==='undefined')throw new Error('이 브라우저는 엑셀 파일을 바로 읽지 못합니다. CSV 로 저장해 주세요');
      const ds=new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      bytes=new Uint8Array(await new Response(ds).arrayBuffer());
    }else throw new Error('읽을 수 없는 압축 방식입니다');
    return new TextDecoder('utf-8').decode(bytes);
  }
  const xml=t=>new DOMParser().parseFromString(t,'application/xml');
  const tags=(n,t)=>Array.from(n.getElementsByTagNameNS('*',t));
  function colIndex(ref){const m=/^[A-Z]+/.exec(ref||'');if(!m)return -1;let n=0;for(const c of m[0])n=n*26+c.charCodeAt(0)-64;return n-1}
  async function XlsxRead(buf){
    const idx=unzipIndex(buf);
    const wb=xml(await unzipText(buf,idx,'xl/workbook.xml')||'');
    const relsT=await unzipText(buf,idx,'xl/_rels/workbook.xml.rels');
    const rel={};if(relsT)tags(xml(relsT),'Relationship').forEach(r=>rel[r.getAttribute('Id')]=r.getAttribute('Target'));
    const ssT=await unzipText(buf,idx,'xl/sharedStrings.xml');
    const ss=ssT?tags(xml(ssT),'si').map(si=>tags(si,'t').map(t=>t.textContent).join('')):[];
    const out=[];
    for(const sh of tags(wb,'sheet')){
      const rid=sh.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id')||sh.getAttribute('r:id');
      let tgt=rel[rid]||'';tgt=tgt.replace(/^\//,'');if(!tgt.startsWith('xl/'))tgt='xl/'+tgt;
      const t=await unzipText(buf,idx,tgt);if(!t)continue;
      const rows=[];
      for(const r of tags(xml(t),'row')){
        const row=[];let auto=0;
        for(const c of tags(r,'c')){
          let i=colIndex(c.getAttribute('r'));if(i<0)i=auto;auto=i+1;
          const type=c.getAttribute('t'),v=tags(c,'v')[0];let val='';
          if(type==='s'&&v)val=ss[+v.textContent]||'';
          else if(type==='inlineStr')val=tags(c,'t').map(x=>x.textContent).join('');
          else if(type==='b'&&v)val=v.textContent==='1'?'TRUE':'FALSE';
          else if(v)val=v.textContent;
          row[i]=val;
        }
        for(let i=0;i<row.length;i++)if(row[i]==null)row[i]='';
        if(row.some(x=>String(x).trim()))rows.push(row);
      }
      out.push({name:sh.getAttribute('name')||'',rows});
    }
    return out;
  }
  window.XlsxRead=XlsxRead;
})();
