const TagConv={
WW:{BOOL:'I/O Discrete',BYTE:'I/O Integer',INT:'I/O Integer',DINT:'I/O Integer',REAL:'I/O Real',STRING:'I/O Message'},
name:a=>a.replace(/[^A-Za-z0-9]+/g,'_').replace(/^_|_$/g,'').replace(/^(\d)/,'T_$1'),
convert(b,a,ov){a=a.trim();if(!a)return{err:'Enter a PLC address or tag.'};let m,ty,das,opc;
if(b==='s7'){a=a.toUpperCase().replace(/\s/g,'');
 if(m=a.match(/^DB(\d+)\.DB([XBWD])(\d+)(?:\.([0-7]))?$/)){const[,d,t,o,bit]=m;
  ty={X:'BOOL',B:'BYTE',W:'INT',D:'REAL'}[t];if(t==='D'&&ov)ty=ov;
  const pre={BYTE:'B',INT:'INT',DINT:'DINT',REAL:'REAL'};
  das='DB'+d+','+(ty==='BOOL'?'X'+o+'.'+(bit||0):pre[ty]+o);
  opc='DB'+d+'.DB'+t+o+(t==='X'?'.'+(bit||0):'')}
 else if(m=a.match(/^([MIQ])([BWD])?(\d+)(?:\.([0-7]))?$/)){
  ty=m[2]?{B:'BYTE',W:'INT',D:ov||'REAL'}[m[2]]:'BOOL';das=a;opc=a}
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
return{fc,pre,off,hex:'0x'+off.toString(16).toUpperCase().padStart(4,'0'),ref:off+1,next:off+1}}};