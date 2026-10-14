/* Live Data tab. Exposes global Live. Needs $ (app.js) and Validator. */
const Live={sock:null,url:'',req:null,log:[],
EX:{modbus:['40001','502'],s7:['DB1.DBD4','102'],ab:['Motor1.Speed','44818'],omron:['D100','9600'],mitsubishi:['D100','5000'],ge:['%R100','18245']},
msg(t,bad){const e=$('#lstat');e.textContent=t;e.className=bad?'err':'hint'},
loadClient(url){return new Promise((res,rej)=>{if(window.io)return res();const s=document.createElement('script');
 s.src=url+'/socket.io/socket.io.js';s.onload=res;s.onerror=()=>rej(new Error('Cannot reach the backend at '+url+'. Is it running?'));document.head.append(s)})},
bind(s){
 s.on('connect',()=>{Live.msg('Backend connected'+(Live.req?'. Starting feed...':'.'));if(Live.req)s.emit('subscribe',Live.req)});
 s.on('hello',h=>Live.msg('Backend ready'+(h.mock?' in MOCK MODE: values are simulated.':'.')));
 s.on('status',x=>{if(x.state==='connected'&&Live.req)Live.msg('Reading '+Live.req.address+' from '+Live.req.ip+(x.mock?' (mock data)':''));
  else if(x.state==='disconnected'&&Live.req){Live.req=null;Live.msg('Feed stopped by the server after repeated errors.',1)}});
 s.on('value',x=>Live.show(x));
 s.on('feed-error',x=>{Live.msg(x.message,1);if(!x.transient)Live.req=null});
 s.on('connect_error',()=>Live.msg('Cannot reach the backend at '+Live.url+'. Is it running? If this page is hosted elsewhere, add its origin to ALLOWED_ORIGINS.',1));
 s.on('disconnect',()=>Live.msg('Backend connection lost.',1))},
show(x){const v=x.value,t=new Date(x.ts).toLocaleTimeString(),txt=typeof v==='boolean'?(v?'ON':'OFF'):String(v);
 $('#lval').textContent=txt;$('#lmeta').textContent='Updated '+t+' | quality '+x.quality+(x.mock?' | MOCK':'');
 Live.log.unshift(t+' '+txt);Live.log=Live.log.slice(0,8);$('#llog').textContent=Live.log.join('   |   ')},
async connect(){const url=$('#lurl').value.trim().replace(/\/+$/,''),ip=$('#lip').value.trim(),addr=$('#laddr').value.trim(),pt=$('#lport').value.trim();
 const e=(!/^https?:\/\/[^\s]+$/.test(url)&&'Backend URL must start with http:// or https://')||Validator.ip(ip)||(pt&&Validator.port(pt))||(!addr&&'Enter a tag address.');
 if(e)return Live.msg(e,1);
 Live.msg('Connecting to the backend...');
 try{await Live.loadClient(url)}catch(x){return Live.msg(x.message,1)}
 if(!Live.sock||Live.url!==url){if(Live.sock)Live.sock.close();Live.url=url;Live.sock=io(url);Live.bind(Live.sock)}
 const num=i=>{const v=$(i).value.trim();return v===''?null:+v};
 Live.log=[];Live.req={id:'live1',protocol:$('#lproto').value,ip,address:addr,type:$('#ltype').value,port:pt?+pt:null,rack:num('#lrack'),slot:num('#lslot'),swap:$('#lswap').value==='1',intervalMs:num('#lint')||1000};
 if(Live.sock.connected)Live.sock.emit('subscribe',Live.req)},
stop(){if(Live.sock&&Live.req)Live.sock.emit('unsubscribe','live1');Live.req=null;$('#lval').textContent='--';$('#lmeta').textContent='No data yet';Live.msg('Disconnected.')}};
$('#lgo').onclick=()=>Live.connect();
$('#lstop').onclick=()=>Live.stop();
$('#lproto').onchange=()=>{const e=Live.EX[$('#lproto').value];$('#laddr').value=e[0];$('#lport').placeholder=e[1]};