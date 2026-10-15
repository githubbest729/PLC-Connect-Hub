/* Main application: routing, events, rendering. Loaded after the js/ modules. */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let S=[],T=[],B=[],last=[];
function toast(m,bad){const e=$('#tst');e.textContent=m;e.className='on'+(bad?' bad':'');clearTimeout(toast.t);toast.t=setTimeout(()=>{e.className=''},1600)}
function copy(t){const ok=()=>toast('Copied!');
 (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(ok,()=>{const a=document.createElement('textarea');a.value=t;document.body.append(a);a.select();try{document.execCommand('copy');ok()}catch(e){toast('Copy failed',1)}a.remove()})}
function download(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:type||'text/csv'}));a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}

const TABS=['map','proto','vault','proj','live'];
function route(t){if(!TABS.includes(t))t='map';
 $$('#tabs button').forEach(b=>{const a=b.dataset.t===t;b.classList.toggle('act',a);b.setAttribute('aria-selected',a)});
 $$('.view').forEach(s=>s.classList.toggle('on',s.id===t))}
addEventListener('hashchange',()=>route(location.hash.slice(1)));
$('#tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(b){location.hash=b.dataset.t;route(b.dataset.t)}});

/* Tag mapper */
function doConv(){const o=$('#mapOut'),b=$('#brand').value,a=$('#addr').value,e=Validator.tag(b,a);
 if(e){o.innerHTML=Tpl.err(e);return}
 const r=TagConv.convert(b,a,$('#ovr').value);
 let h=Tpl.row('Tag name',r.name)+Tpl.row('Wonderware type',r.ww)+Tpl.row('Item (DAS)',r.das)+Tpl.row('OPC item',r.opc)+Tpl.row('PLC data type',r.type)+(r.info?Tpl.row('Protocol detail',r.info):'');
 if(r.guess)h+=Tpl.empty('Symbolic tag type assumed to be REAL. Use the type override if it differs.');
 if(r.type!=='BOOL'&&r.type!=='STRING'){const v=['#rmin','#rmax','#emin','#emax'].map(i=>parseFloat($(i).value)),s=v.some(isNaN)?null:TagConv.scale(v[0],v[1],v[2],v[3],r.name);
  h+=s?Tpl.row('Scaling formula',s.f)+Tpl.row('QuickScript',s.qs):Tpl.err('Scaling ranges must be numbers and raw min and max must differ.')}
 if(r.ifix){const i=r.ifix,g=['#rmin','#rmax','#emin','#emax'].map(x=>parseFloat($(x).value));
  h+='<h2>GE iFIX database</h2>'+Tpl.row('iFIX block type',i.block)+Tpl.row('iFIX tag name',i.tag)+Tpl.row('iFIX I/O address',i.addr)+Tpl.row('iFIX reference',i.ref)+(i.block==='AI'&&!g.some(isNaN)?Tpl.row('iFIX scaling','LIN: Raw '+g[0]+'..'+g[1]+' -> EGU '+g[2]+'..'+g[3]):'')+Tpl.empty('Driver name and field labels vary by iFIX version. Confirm in iFIX Database Manager.')}
 h+='<p style="margin:.6rem 0"><button class="pri" data-act="live" data-pr="'+b+'" data-a="'+Tpl.esc(b==='s7'?r.opc:r.das)+'" data-t="'+r.type+'">Send to Live Data</button></p>';
 o.innerHTML=h+Tpl.empty('Check item syntax against your installed DAS or OPC server (DASSIDirect, DASABCIP, DASABTCP, Omron, Mitsubishi or GE).')}
$('#conv').onclick=doConv;$('#brand').onchange=()=>{$('#addr').value=TagConv.EX[$('#brand').value]||'';doConv()};$('#addr').onkeydown=e=>{if(e.key==='Enter')doConv()};
function csvRun(){const t=$('#csvIn').value.trim();if(!t)return toast('Paste CSV rows or import a file',1);
 last=TagConv.bulk(t);const n=last.length-1,ok=last.slice(1).filter(r=>!r[8]).length;
 $('#csvOut').innerHTML=n?'<p class="hint">'+ok+' converted, '+(n-ok)+' with errors.</p>'+Tpl.table(last[0],last.slice(1)):Tpl.err('No data rows found.');
 toast(ok+' of '+n+' converted',ok<n)}
$('#csvGo').onclick=csvRun;
$('#csvTpl').onclick=()=>{$('#csvIn').value=TagConv.template();toast('Template loaded')};
$('#csvDl').onclick=()=>last.length>1?download('wonderware-tags.csv',TagConv.toCSV(last)):toast('Convert a CSV first',1);
$('#csvFile').onchange=e=>{const f=e.target.files[0];if(f)f.text().then(t=>{$('#csvIn').value=t;csvRun()});e.target.value=''};

/* Protocols */
function mb(){const v=$('#reg').value.trim(),o=$('#mbOut'),z=$('#zb').value==='1';
 if(!v){o.innerHTML=Tpl.empty('Enter a register such as 40001.');return}
 const e=Validator.modbus(v,z);if(e){o.innerHTML=Tpl.err(e);return}
 const r=TagConv.modbus(v,$('#fc').value,z);
 o.innerHTML=r?Tpl.row('Function code','FC0'+r.fc+(r.pre?' ('+r.pre+')':''))+Tpl.row('PDU offset (decimal)',String(r.off))+Tpl.row('PDU offset (hex)',r.hex)+Tpl.row('Second word of 32-bit value',String(r.next)):Tpl.err('Could not calculate that register.')}
function ipo(){const a=$('#ip').value.trim(),p=$('#port').value.trim(),o=$('#ipOut'),e=Validator.ip(a)||Validator.port(p);
 if(e){o.innerHTML=Tpl.err(e);return}
 o.innerHTML=Tpl.row('IP:Port',a+':'+p)+Tpl.row('OPC UA URL','opc.tcp://'+a+':'+p)+Tpl.row('Modbus TCP','tcp://'+a+':'+p)}
['#reg','#fc','#zb'].forEach(i=>$(i).addEventListener('input',mb));
$('#pp').onchange=()=>{$('#port').value=$('#pp').value;ipo()};['#ip','#port'].forEach(i=>$(i).addEventListener('input',ipo));

/* Snippet vault */
function vr(){const q=$('#vs').value.toLowerCase(),l=S.filter(s=>(s.t+s.y+s.c).toLowerCase().includes(q));
 $('#vList').innerHTML=l.length?l.map(Tpl.snippet).join(''):Tpl.empty('No snippets match. Write one above and press Save snippet.')}
function clr(){['#vid','#vt','#vc'].forEach(i=>$(i).value='');$('#vstat').textContent=''}
Editor.bindTab($('#vc'));
$('#vc').addEventListener('input',()=>{$('#vstat').textContent=Editor.stats($('#vc').value)});
$('#vfmt').onclick=()=>{$('#vc').value=Editor.format($('#vc').value,$('#vy').value);$('#vc').dispatchEvent(new Event('input'));toast('Formatted')};
$('#vmin').onclick=()=>{$('#vc').value=Editor.minify($('#vc').value,$('#vy').value);$('#vc').dispatchEvent(new Event('input'));toast('Minified')};
$('#vclr').onclick=clr;$('#vs').addEventListener('input',vr);
$('#vsave').onclick=async()=>{const t=$('#vt').value.trim(),c=$('#vc').value.trim(),y=$('#vy').value;
 if(!t||!c)return toast('Title and code are required',1);
 const w=Editor.check(c,y),s={t,y,c:Editor.format(c,y)},id=+$('#vid').value;if(id)s.id=id;
 try{await DB.put('snippets',s);S=await DB.all('snippets')}catch(e){return toast('Could not save: storage unavailable',1)}
 toast(w?'Saved, but '+w:'Snippet saved',!!w);clr();vr()};

/* Projects and BOM */
function rt(){$('#kan').innerHTML=['To do','In progress','Done'].map((n,i)=>Tpl.col(n,T.filter(t=>t.s===i))).join('')}
function rb(){$('#bom').innerHTML=Tpl.bomTable(B)}
$('#tadd').onclick=async()=>{const v=$('#tn').value.trim();if(!v)return toast('Enter a task title',1);
 try{await DB.put('tasks',{t:v,s:0,due:$('#td').value});T=await DB.all('tasks')}catch(e){return toast('Could not save task',1)}
 $('#tn').value='';$('#td').value='';rt();toast('Task added')};
$('#badd').onclick=async()=>{const i=$('#bi').value.trim(),q=parseFloat($('#bq').value),p=parseFloat($('#bp').value);
 if(!i||!(q>0)||!(p>=0))return toast('Enter item, quantity above 0 and a unit price',1);
 try{await DB.put('bom',{i,q,p});B=await DB.all('bom')}catch(e){return toast('Could not save item',1)}
 ['#bi','#bq','#bp'].forEach(x=>$(x).value='');rb();toast('Item added')};

/* Delegated actions */
const ACT={
 async mv(id,d){const t=T.find(x=>x.id===id);if(!t)return;t.s=Math.max(0,Math.min(2,t.s+d));await DB.put('tasks',t);rt()},
 async dt(id){await DB.del('tasks',id);T=T.filter(x=>x.id!==id);rt()},
 async db(id){await DB.del('bom',id);B=B.filter(x=>x.id!==id);rb()},
 async sd(id){if(!confirm('Delete this snippet?'))return;await DB.del('snippets',id);S=S.filter(x=>x.id!==id);vr()},
 live(id,d,b){const p=b.dataset.pr,t=b.dataset.t;$('#lproto').value=p;$('#laddr').value=b.dataset.a;$('#ltype').value=['BOOL','INT','DINT','REAL'].includes(t)?t:'';$('#lport').placeholder=Live.EX[p][1];location.hash='live';route('live');toast('Sent to Live Data. Press Connect & Read.')},
 lrm(id){Live.remove('f'+id)},
 se(id){const s=S.find(x=>x.id===id);if(!s)return;$('#vid').value=s.id;$('#vt').value=s.t;$('#vy').value=s.y;$('#vc').value=s.c;$('#vc').dispatchEvent(new Event('input'));$('#vt').scrollIntoView({behavior:'smooth'});toast('Editing snippet')}};
document.addEventListener('click',e=>{const b=e.target.closest('[data-c],[data-act]');if(!b)return;
 if(b.dataset.c!==undefined)return copy(decodeURIComponent(b.dataset.c));
 const f=ACT[b.dataset.act];if(f)Promise.resolve(f(+b.dataset.id,+b.dataset.d,b)).catch(()=>{})});

/* Init: render UI first so a storage failure never leaves a blank page */
(async()=>{route(location.hash.slice(1));mb();ipo();vr();rt();rb();
 try{await DB.seed();[S,T,B]=await Promise.all([DB.all('snippets'),DB.all('tasks'),DB.all('bom')])}
 catch(e){toast('Storage unavailable: data will not be saved',1)}
 vr();rt();rb()})();