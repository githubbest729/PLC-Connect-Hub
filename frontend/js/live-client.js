/* Live Data tab (watchlist). Exposes global Live. Needs $ (app.js), Validator and Tpl. */
const Live={sock:null,url:'',feeds:new Map(),n:0,
EX:{modbus:['40001','502'],s7:['DB1.DBD4','102'],ab:['Motor1.Speed','44818'],omron:['D100','9600'],mitsubishi:['D100','5000'],ge:['%R100','18245']},
msg(t,bad){const e=$('#lstat');e.textContent=t;e.className=bad?'err':'hint'},
fmt:v=>typeof v==='boolean'?(v?'ON':'OFF'):String(v),
loadClient(url){return new Promise((res,rej)=>{if(window.io)return res();const s=document.createElement('script');
 s.src=url+'/socket.io/socket.io.js';s.onload=res;s.onerror=()=>rej(new Error('Cannot reach the backend at '+url+'. Is it running?'));document.head.append(s)})},
bind(s){
 s.on('connect',()=>{Live.msg('Backend connected.');Live.feeds.forEach(f=>s.emit('subscribe',f.req))});
 s.on('hello',h=>Live.msg('Backend ready'+(h.mock?' in MOCK MODE: values are simulated.':'.')));
 s.on('status',x=>{const f=Live.feeds.get(x.id);if(!f)return;f.state=x.state==='connected'?'live':'stopped';if(x.mock!==undefined)f.mock=x.mock;Live.draw()});
 s.on('value',x=>{const f=Live.feeds.get(x.id);if(!f)return;Object.assign(f,{v:x.value,ts:x.ts,err:'',mock:x.mock,state:'live'});Live.big(f);Live.draw()});
 s.on('feed-error',x=>{const f=Live.feeds.get(x.id);if(f){f.err=x.message;if(!x.transient)f.state='stopped'}Live.msg(x.message,1);Live.draw()});
 s.on('connect_error',()=>Live.msg('Cannot reach the backend at '+Live.url+'. Is it running? If this page is hosted elsewhere, add its origin to ALLOWED_ORIGINS.',1));
 s.on('disconnect',()=>{Live.feeds.forEach(f=>{f.state='waiting'});Live.msg('Backend connection lost. Reconnecting...',1);Live.draw()})},
big(f){$('#lval').textContent=Live.fmt(f.v);$('#lmeta').textContent=f.req.address+' | '+new Date(f.ts).toLocaleTimeString()+(f.mock?' | MOCK':'')},
draw(){const l=[...Live.feeds.entries()];
 $('#lfeeds').innerHTML=l.length?'<div class="sc"><table><tr><th>Tag</th><th>Source</th><th>Value</th><th>Updated</th><th>Status</th><th></th></tr>'+l.map(([id,f])=>'<tr><td>'+Tpl.esc(f.req.address)+'</td><td>'+f.req.protocol+' '+Tpl.esc(f.req.ip)+'</td><td><b>'+(f.v===undefined?'--':Tpl.esc(Live.fmt(f.v)))+'</b></td><td>'+(f.ts?new Date(f.ts).toLocaleTimeString():'')+'</td><td'+(f.err?' class="err"':'')+'>'+Tpl.esc(f.err||f.state)+'</td><td><button data-act="lrm" data-id="'+id.slice(1)+'">Remove</button></td></tr>').join('')+'</table></div>':Tpl.empty('No tags yet. Fill in the form and press Connect &amp; Read.')},
async connect(){const url=$('#lurl').value.trim().replace(/\/+$/,''),ip=$('#lip').value.trim(),addr=$('#laddr').value.trim(),pt=$('#lport').value.trim();
 const e=(!/^https?:\/\/[^\s]+$/.test(url)&&'Backend URL must start with http:// or https://')||Validator.ip(ip)||(pt&&Validator.port(pt))||(!addr&&'Enter a tag address.');
 if(e)return Live.msg(e,1);
 Live.msg('Connecting to the backend...');
 try{await Live.loadClient(url)}catch(x){return Live.msg(x.message,1)}
 if(!Live.sock||Live.url!==url){if(Live.sock){Live.sock.close();Live.feeds.clear()}Live.url=url;Live.sock=io(url);Live.bind(Live.sock)}
 const num=i=>{const v=$(i).value.trim();return v===''?null:+v};
 const req={protocol:$('#lproto').value,ip,address:addr,type:$('#ltype').value,port:pt?+pt:null,rack:num('#lrack'),slot:num('#lslot'),swap:$('#lswap').value==='1',intervalMs:num('#lint')||1000};
 for(const[id,f]of [...Live.feeds])if(['protocol','ip','address','port'].every(k=>f.req[k]===req[k]))Live.remove(id);
 if(Live.feeds.size>=20)return Live.msg('Watchlist is full (20 tags). Remove one first.',1);
 const id='f'+(++Live.n);req.id=id;Live.feeds.set(id,{req,state:'connecting'});Live.draw();
 if(Live.sock.connected){Live.sock.emit('subscribe',req);Live.msg('Added '+addr+' to the watchlist.')}},
remove(id){if(!Live.feeds.has(id))return;if(Live.sock)Live.sock.emit('unsubscribe',id);Live.feeds.delete(id);Live.draw()},
stopAll(){[...Live.feeds.keys()].forEach(id=>Live.remove(id));$('#lval').textContent='--';$('#lmeta').textContent='No data yet';Live.msg('Disconnected.')}};
$('#lgo').onclick=()=>Live.connect();
$('#lstop').onclick=()=>Live.stopAll();
$('#lproto').onchange=()=>{const e=Live.EX[$('#lproto').value];$('#laddr').value=e[0];$('#lport').placeholder=e[1]};
Live.draw();