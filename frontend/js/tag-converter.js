/* Address conversion and CSV bulk tools. Exposes global TagConv. */
const TagConv={
WW:{BOOL:'I/O Discrete',BYTE:'I/O Integer',INT:'I/O Integer',DINT:'I/O Integer',REAL:'I/O Real',STRING:'I/O Message'},
HEAD:['TagName','Brand','PLCAddress','PLCType','WonderwareType','DASItem','OPCItem','Scaling','Error','iFIXReference'],
name:a=>a.replace(/[^A-Za-z0-9]+/g,'_').replace(/^_|_$/g,'').replace(/^(\d)/,'T_$1'),
convert(b,a,ov){a=String(a||'').trim();if(!a)return{err:'Enter a PLC address or tag.'};if(ov&&!['REAL','DINT','INT'].includes(ov))ov='';if(TagConv[b+'Conv'])return TagConv[b+'Conv'](a,ov);let m,ty,das,opc;
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
EX:{s7:'DB1.DBD4',ab:'N7:0',omron:'D100',mitsubishi:'D100',ge:'%R100'},
brandOf:b=>/^s/i.test(b)?'s7':/^o/i.test(b)?'omron':/^m/i.test(b)?'mitsubishi':/^g/i.test(b)?'ge':'ab',
mk:(ty,a,das,info,ifix)=>({type:ty,das,opc:'Channel1.PLC1.'+das.replace('%',''),name:TagConv.name(a),ww:TagConv.WW[ty],info,ifix}),
omronConv(a,ov){a=a.toUpperCase().replace(/\s/g,'');const m=a.match(/^(CIO|DM|D|W|H)(\d{1,5})(?:\.(\d{1,2}))?$/);
 if(!m)return{err:'Unrecognised Omron address. Examples: D100, CIO10, W5, H1, D100.05 (areas CIO, D, W, H).'};
 const ar=m[1]==='DM'?'D':m[1],w=+m[2],bit=m[3];
 if(bit!==undefined&&+bit>15)return{err:'Omron bit number must be 0 to 15.'};
 const lim={CIO:6143,W:511,H:1535,D:32767}[ar];if(w>lim)return{err:ar+' word address must be 0 to '+lim+' (check your CPU model).'};
 const isBit=bit!==undefined,code=isBit?{CIO:'30',W:'31',H:'32',D:'02'}[ar]:{CIO:'B0',W:'B1',H:'B2',D:'82'}[ar],ty=isBit?'BOOL':ov||'INT',das=ar+w+(isBit?'.'+bit.padStart(2,'0'):'');
 return TagConv.mk(ty,a,das,'FINS memory area 0x'+code+' ('+ar+(isBit?' bit':' word')+'), word '+w+(isBit?', bit '+(+bit):'')+(ty==='DINT'||ty==='REAL'?', 32-bit = 2 words (low word first)':''))},
mitsubishiConv(a,ov){a=a.toUpperCase().replace(/\s/g,'');const m=a.match(/^([DMXY])([0-9A-F]{1,6})$/);
 if(!m)return{err:'Unrecognised MELSEC address. Examples: D100, M10, X1F, Y20 (areas D, M, X, Y).'};
 const ar=m[1],n=m[2];if((ar==='D'||ar==='M')&&!/^\d+$/.test(n))return{err:ar+' addresses are decimal. Only X and Y are hexadecimal.'};
 const code={D:'A8',M:'90',X:'9C',Y:'9D'}[ar],ty=ar==='D'?ov||'INT':'BOOL',xy=ar==='X'||ar==='Y';
 return TagConv.mk(ty,a,ar+n,'MC protocol device code 0x'+code+' ('+(ar==='D'?'data register':'relay')+'), '+(xy?'hex number (Q/L/iQ-R; FX series uses octal) ':'decimal number ')+n+(ty==='DINT'||ty==='REAL'?', 32-bit = 2 registers':''))},
geConv(a,ov){a=a.toUpperCase().replace(/\s/g,'');const m=a.match(/^%?(R|I|Q|M)(\d{1,5})(?:\.(\d{1,2}))?$/);
 if(!m)return{err:'Unrecognised GE address. Examples: %R100, %I1, %Q10, %M5, %R100.5.'};
 const ar=m[1],n=+m[2],bit=m[3];if(n<1)return{err:'GE addresses start at 1.'};
 if(bit!==undefined&&(ar!=='R'||+bit<1||+bit>16))return{err:'A bit suffix is only valid on %R and must be 1 to 16.'};
 const ty=(ar!=='R'||bit!==undefined)?'BOOL':ov||'INT',addr='%'+ar+n+(bit!==undefined?'.'+bit:''),tag=TagConv.name(addr).toUpperCase().slice(0,30);
 const mem={R:'register memory (16-bit words)',I:'discrete inputs',Q:'discrete outputs',M:'internal discrete memory'}[ar];
 return TagConv.mk(ty,addr,addr,'SRTP '+mem+', address '+n+(bit!==undefined?', bit '+bit:'')+(ty==='DINT'||ty==='REAL'?' (2 registers)':''),{block:ty==='BOOL'?'DI':'AI',tag,addr,ref:'FIX32.THISNODE.'+tag+'.F_CV'})},
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
template:()=>TagConv.toCSV([['brand','address','type','rawMin','rawMax','engMin','engMax'],['s7','DB1.DBD4','REAL','0','27648','0','100'],['s7','M10.0','','','','',''],['ab','N7:0','','0','32767','0','100'],['ab','Motor1.Speed','REAL','0','1800','0','1800'],['omron','D100','','0','1000','0','100'],['mitsubishi','D200','','0','4000','0','100'],['ge','%R100','','0','32000','0','100']]),
bulk(t){const rows=TagConv.parseCSV(t);if(rows.length&&/^brand$/i.test(rows[0][0].trim()))rows.shift();
 return[TagConv.HEAD].concat(rows.map(r=>{const[bd='',a='',ov='',n1,n2,n3,n4]=r.map(x=>x.trim()),b=TagConv.brandOf(bd),c=TagConv.convert(b,a,ov.toUpperCase());
  if(c.err)return['',b,a,'','','','','',c.err,''];
  let sc='';if(c.type!=='BOOL'&&c.type!=='STRING'){const v=[n1,n2,n3,n4].map((x,i)=>x===''||x===undefined?[0,27648,0,100][i]:+x),s=v.some(isNaN)?null:TagConv.scale(v[0],v[1],v[2],v[3],c.name);sc=s?s.f:''}
  return[c.name,b,a,c.type,c.ww,c.das,c.opc,sc,'',c.ifix?c.ifix.ref:'']}))}};