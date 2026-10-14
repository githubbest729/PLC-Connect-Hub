/* Address conversion and CSV bulk tools. Exposes global TagConv. */
const TagConv={
WW:{BOOL:'I/O Discrete',BYTE:'I/O Integer',INT:'I/O Integer',DINT:'I/O Integer',REAL:'I/O Real',STRING:'I/O Message'},
HEAD:['TagName','Brand','PLCAddress','PLCType','WonderwareType','DASItem','OPCItem','Scaling','Error'],
name:a=>a.replace(/[^A-Za-z0-9]+/g,'_').replace(/^_|_$/g,'').replace(/^(\d)/,'T_$1'),
convert(b,a,ov){a=String(a||'').trim();if(!a)return{err:'Enter a PLC address or tag.'};if(ov&&!['REAL','DINT','INT'].includes(ov))ov='';let m,ty,das,opc;
if(b==='s7'){a=a.toUpperCase().replace(/\s/g,'');
 if(m=a.match(/^DB(\d+)\.DB([XBWD])(\d+)(?:\.([0-7]))?$/)){const[,d,t,o,bit]=m;
  ty={X:'BOOL',B:'BYTE',W:'INT',D:'REAL'}[t];if(t==='D'&&ov)ty=ov;
  const pre={BYTE:'B',INT:'INT',DINT:'DINT',REAL:'REAL'};
  das='DB'+d+','+(ty==='BOOL'?'X'+o+'.'+(bit||0):pre[ty]+o);opc='DB'+d+'.DB'+t+o+(t==='X'?'.'+(bit||0):'')}
 else if(m=a.match(/^([MIQ])([BWD])?(\d+)(?:\.([0-7]))?$/)){ty=m[2]?{B:'BYTE',W:'INT',D:ov||'REAL'}[m[2]]:'BOOL';das=a;opc=a}
 else return{err:'Unrecognised S7 address. Examples: DB1.DBD4, DB5.DBX0.1, MW20, M10.0, I0.0.'}}
else{
 if(m=a.match(/^(ST|[NFBLSTC])(\d+):(\d+)(\/\d+|\.\w+)?$/i)){const f=m[1].toUpperCase();
  ty=f==='ST'?'STRING':f==='F'?'REAL':f==='L'?'DINT':(m[4]&&m[4][0]==='/')?'BOOL':'INT';das=a;opc='Channel1.PLC1.'+a}
 else if(/^[A-Za-z_][\w.\[\]]*$/.test(a)){ty=ov||'REAL';das=a;opc='Channel1.PLC1.'+a}
 else return{err:'Unrecognised Allen-Bradley address. Examples: Motor1.Speed, N7:0, F8:5, B3:0/1.'}}
return{type:ty,das,opc,name:TagConv.name(a),ww:TagConv.WW[ty],guess:b==='ab'&&!/:/.test(a)&&!ov}},
scale(rmin,rmax,emin,emax,n){if(rmax===rmin)return null;const r=emax-emin,w=rmax-rmin;
 return{f:'Eng = (Raw - '+rmin+') * '+r+' / '+w+' + '+emin,qs:n+'_Eng = ('+n+' - '+rmin+') * '+r+' / '+w+' + '+emin+';'}},
modbus(r,fcDef,zero){const s=String(r).trim();if(!/^\d+$/.test(s))return null;let fc=+fcDef,num=+s,pre='';
 const M={0:[1,'Coil'],1:[2,'Discrete Input'],3:[4,'Input Register'],4:[3,'Holding Register']};
 if((s.length===5||s.length===6)&&M[s[0]]){fc=M[s[0]][0];num=+s.slice(1);pre=M[s[0]][1]}
 const off=zero?num:num-1;if(off<0)return null;
 return{fc,pre,off,hex:'0x'+off.toString(16).toUpperCase().padStart(4,'0'),next:off+1}},
parseCSV(t){const rows=[];let r=[],f='',q=false;
 for(let i=0;i<t.length;i++){const c=t[i];
  if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
  else if(c==='"')q=true;else if(c===','){r.push(f);f=''}
  else if(c==='\n'||c==='\r'){if(c==='\r'&&t[i+1]==='\n')i++;r.push(f);rows.push(r);r=[];f=''}else f+=c}
 if(f||r.length){r.push(f);rows.push(r)}return rows.filter(x=>x.some(y=>y.trim()))},
toCSV:rows=>rows.map(r=>r.map(v=>{v=String(v==null?'':v);return /[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}).join(',')).join('\r\n'),
template:()=>TagConv.toCSV([['brand','address','type','rawMin','rawMax','engMin','engMax'],['s7','DB1.DBD4','REAL','0','27648','0','100'],['s7','M10.0','','','','',''],['ab','N7:0','','0','32767','0','100'],['ab','Motor1.Speed','REAL','0','1800','0','1800']]),
bulk(t){const rows=TagConv.parseCSV(t);if(rows.length&&/^brand$/i.test(rows[0][0].trim()))rows.shift();
 return[TagConv.HEAD].concat(rows.map(r=>{const[bd='',a='',ov='',n1,n2,n3,n4]=r.map(x=>x.trim()),b=/^s/i.test(bd)?'s7':'ab',c=TagConv.convert(b,a,ov.toUpperCase());
  if(c.err)return['',b,a,'','','','','',c.err];
  let sc='';if(c.type!=='BOOL'&&c.type!=='STRING'){const v=[n1,n2,n3,n4].map((x,i)=>x===''||x===undefined?[0,27648,0,100][i]:+x),s=v.some(isNaN)?null:TagConv.scale(v[0],v[1],v[2],v[3],c.name);sc=s?s.f:''}
  return[c.name,b,a,c.type,c.ww,c.das,c.opc,sc,'']}))}};