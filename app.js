const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>{const d=document.createElement('div');d.textContent=s;return d.innerHTML};
const toast=m=>{const e=$('#toast');e.textContent=m;e.classList.add('on');setTimeout(()=>e.classList.remove('on'),1200)};
const cp=t=>(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('Copied'),()=>{const a=document.createElement('textarea');a.value=t;document.body.append(a);a.select();document.execCommand('copy');a.remove();toast('Copied')});
document.addEventListener('click',e=>{const c=e.target.dataset&&e.target.dataset.c;if(c!=null)cp(decodeURIComponent(c))});
const row=(l,v)=>'<div class="row"><span>'+l+'</span><code>'+esc(v)+'</code><button data-c="'+encodeURIComponent(v)+'">Copy</button></div>';
$$('#tabs button').forEach(b=>b.onclick=()=>{$$('#tabs button').forEach(x=>x.classList.toggle('act',x===b));$$('main section').forEach(s=>s.hidden=s.id!==b.dataset.t)});
$('#tabs button').click();

/* Tag mapper */
$('#go').onclick=()=>{const r=TagConv.convert($('#brand').value,$('#addr').value,$('#ovr').value),o=$('#mapOut');
if(r.err){o.innerHTML='<p class="err">'+r.err+'</p>';return}
let h=row('Tag name',r.name)+row('Wonderware type',r.ww)+row('Item (DAS)',r.das)+row('OPC item',r.opc)+row('PLC data type',r.type);
if(r.guess)h+='<p class="hint">Symbolic tag type assumed as REAL. Use the type override if it differs.</p>';
if(r.type!=='BOOL'&&r.type!=='STRING'){const g=i=>+$(i).value,s=TagConv.scale(g('#rmin'),g('#rmax'),g('#emin'),g('#emax'),r.name);
h+=s?row('Scaling formula',s.f)+row('QuickScript',s.qs):'<p class="err">Raw min and max must differ.</p>'}
o.innerHTML=h};
$('#addr').onkeydown=e=>{if(e.key==='Enter')$('#go').click()};

/* Protocols */
const mb=()=>{const r=TagConv.modbus($('#reg').value,$('#fc').value,$('#zb').value==='1'),o=$('#mbOut');
o.innerHTML=r?row('Function code','FC0'+r.fc+(r.pre?' ('+r.pre+')':''))+row('PDU offset (dec)',String(r.off))+row('PDU offset (hex)',r.hex)+row('Second word of 32-bit',String(r.next)):'<p class="hint">Enter a numeric register, for example 40001.</p>'};
['#reg','#fc','#zb'].forEach(i=>$(i).oninput=mb);mb();
const ipo=()=>{const a=$('#ip').value.trim(),p=$('#port').value.trim();$('#ipOut').innerHTML=row('IP:Port',a+':'+p)+row('OPC UA URL','opc.tcp://'+a+':'+p)+row('Modbus TCP target','tcp://'+a+':'+p)};
$('#pp').onchange=()=>{$('#port').value=$('#pp').value;ipo()};['#ip','#port'].forEach(i=>$(i).oninput=ipo);ipo();

/* Snippet vault */
let V=DB.get('vault',[{id:1,t:'Historian: last hour, 1-min cyclic',y:'SQL',c:"SELECT DateTime, TagName, Value\nFROM Runtime.dbo.History\nWHERE TagName IN ('Tank1_Level')\nAND DateTime >= DATEADD(hh,-1,GETDATE())\nAND wwRetrievalMode = 'Cyclic'\nAND wwResolution = 60000"},{id:2,t:'Tank level alarm message',y:'QuickScript',c:'IF Tank1_Level.Alarm == 1 THEN\n  LogMessage("Tank1 level alarm active");\nENDIF;'}]);
const fmt=(c,y)=>{c=c.replace(/[ \t]+$/gm,'').trim();return y==='SQL'?c.replace(/\b(select|from|where|group by|order by|inner join|left join|join|on|and|or|insert into|values|update|set|delete|as|between|having|desc|asc|in|top)\b/gi,m=>m.toUpperCase()).replace(/\s+(FROM|WHERE|GROUP BY|ORDER BY|AND|INNER JOIN|LEFT JOIN)\b/g,'\n$1'):c};
$('#vfmt').onclick=()=>{$('#vc').value=fmt($('#vc').value,$('#vy').value)};
$('#vsave').onclick=()=>{const t=$('#vt').value.trim(),c=$('#vc').value.trim();if(!t||!c)return toast('Title and code required');V.unshift({id:Date.now(),t,y:$('#vy').value,c:fmt(c,$('#vy').value)});DB.set('vault',V);$('#vt').value=$('#vc').value='';vr()};
function vr(){const q=$('#vs').value.toLowerCase(),l=V.filter(s=>(s.t+s.c).toLowerCase().includes(q));
$('#vList').innerHTML=l.length?l.map(s=>'<div class="sc"><b>'+esc(s.t)+'</b> <small>'+s.y+'</small><pre class="sn">'+esc(s.c)+'</pre><button data-c="'+encodeURIComponent(s.c)+'">Copy</button> <button data-d="'+s.id+'">Delete</button></div>').join(''):'<p class="hint">No snippets yet. Paste a query or script above and save it.</p>'}
$('#vs').oninput=vr;$('#vList').addEventListener('click',e=>{const d=e.target.dataset.d;if(d){V=V.filter(s=>s.id!=d);DB.set('vault',V);vr()}});vr();

/* Projects and BOM */
let T=DB.get('tasks',[]),B=DB.get('bom',[]);const ST=['To do','In progress','Done'];
function tr(){$('#kan').innerHTML=ST.map((n,i)=>'<div class="col"><h3>'+n+'</h3>'+T.map((t,j)=>t.s===i?'<div class="card">'+esc(t.t)+'<br>'+(i>0?'<button data-m="'+j+',-1">Back</button>':'')+(i<2?'<button data-m="'+j+',1">Next</button>':'')+'<button data-m="'+j+',0">Delete</button></div>':'').join('')+'</div>').join('')}
$('#kan').onclick=e=>{const m=e.target.dataset.m;if(!m)return;const[j,d]=m.split(',').map(Number);if(d===0)T.splice(j,1);else T[j].s+=d;DB.set('tasks',T);tr()};
$('#tadd').onclick=()=>{const v=$('#tn').value.trim();if(v){T.push({t:v,s:0});$('#tn').value='';DB.set('tasks',T);tr()}};tr();
function br(){const tot=B.reduce((a,x)=>a+x.q*x.p,0);$('#bom').innerHTML='<table>'+B.map((x,i)=>'<tr><td>'+esc(x.i)+'</td><td>'+x.q+' x '+x.p.toFixed(2)+'</td><td>'+(x.q*x.p).toFixed(2)+'</td><td><button data-b="'+i+'">Remove</button></td></tr>').join('')+'<tr><td colspan="2"><b>Total AED</b></td><td colspan="2"><b>'+tot.toFixed(2)+'</b></td></tr></table>'}
$('#bom').onclick=e=>{const i=e.target.dataset.b;if(i!=null){B.splice(+i,1);DB.set('bom',B);br()}};
$('#badd').onclick=()=>{const i=$('#bi').value.trim(),q=+$('#bq').value,p=+$('#bp').value;if(i&&q>0){B.push({i,q,p});['#bi','#bq','#bp'].forEach(x=>$(x).value='');DB.set('bom',B);br()}};br();