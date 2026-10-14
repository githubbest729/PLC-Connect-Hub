/* First-time product tour. Exposes global Tour. Needs $ and route() from app.js. */
const Tour={
KEY:'plch_tour',active:false,i:0,
steps:[
{t:'Welcome to PLC-Connect Hub',b:'A one-minute tour of the five tools. Everything works offline once the app has loaded. Skip any time and replay it later from the Help button.'},
{sel:'#tabs',tab:'map',t:'Five tools, one bar',b:'Tag Mapper converts PLC addresses to Wonderware syntax. Protocols has the Modbus calculator and IP:port copy. Snippets stores your SQL and QuickScripts. Projects tracks tasks and the BOM. Live Data reads values from a PLC through the companion server.'},
{sel:'#map details.how',tab:'map',t:'How to use panels',b:'Every tool has a How to use panel like this one. Click its title to open or close it whenever you need a reminder.'},
{sel:'#map .fg',tab:'map',t:'Tag Mapper inputs',b:'Pick a PLC brand (Siemens, Allen-Bradley, Omron, Mitsubishi or GE), type an address such as DB1.DBD4, N7:0 or D100, set the raw and engineering ranges, then press Convert. You get the Wonderware tag type, DAS item, OPC item and scaling script, each with a Copy button.'},
{sel:'#vc',tab:'vault',t:'Snippet Vault',b:'Write or paste SQL or QuickScript here and press Save snippet. Snippets are stored locally in this browser (IndexedDB), so they work offline and never leave your device. Format tidies code; Edit reloads a saved snippet.'},
{sel:'#kan',tab:'proj',t:'Projects board',b:'Move site tasks across To do, In progress and Done with Back and Next. The BOM estimate below the board totals in AED with 5% VAT.'},
{sel:'#live .fg',tab:'live',t:'Live Data',b:'Enter the PLC IP, protocol and tag address, then press Connect and Read. The value streams in from the backend you run on your PC. Use npm run mock in the backend folder to try it without hardware.'},
{sel:'#helpBtn',tab:'map',t:'Replay any time',b:'Press Help whenever you want to see this tour again.'}],
get(){try{return localStorage.getItem(Tour.KEY)}catch(e){return null}},
set(v){try{localStorage.setItem(Tour.KEY,v)}catch(e){}},
start(){if(Tour.active)return;Tour.active=true;document.body.classList.add('touring');$('#tour').hidden=false;Tour.show(0)},
end(v){Tour.active=false;clearTimeout(Tour.p);Tour.set(v);$('#tour').hidden=true;document.body.classList.remove('touring');route('map');scrollTo(0,0);$('#helpBtn').focus()},
show(n){const s=Tour.steps[n],last=n===Tour.steps.length-1;Tour.i=n;
 $('#tt').textContent=s.t;$('#tb').textContent=s.b;$('#tc').textContent=(n+1)+' of '+Tour.steps.length;
 $('#tprev').disabled=n===0;$('#tnext').textContent=last?'Done':'Next';$('#tskip').hidden=last;
 if(s.tab)route(s.tab);
 const el=s.sel?$(s.sel):null;if(el)el.scrollIntoView({block:'center'});
 Tour.place(el);clearTimeout(Tour.p);Tour.p=setTimeout(()=>Tour.place(el),s.tab?330:60);
 $('#tnext').focus({preventScroll:true})},
place(el){const sp=$('#tspot'),tip=$('#ttip'),pad=8,vw=innerWidth,vh=innerHeight;let r;
 if(el){const b=el.getBoundingClientRect();r={x:b.left-pad,y:b.top-pad,w:b.width+pad*2,h:b.height+pad*2}}
 else r={x:vw/2,y:vh/2,w:0,h:0};
 sp.style.left=r.x+'px';sp.style.top=r.y+'px';sp.style.width=r.w+'px';sp.style.height=r.h+'px';
 const tw=tip.offsetWidth,th=tip.offsetHeight;let x,y;
 if(!el){x=(vw-tw)/2;y=(vh-th)/2}
 else{x=Math.min(Math.max(8,r.x),vw-tw-8);
  if(vh-(r.y+r.h)-12>=th)y=r.y+r.h+12;else if(r.y-12>=th)y=r.y-th-12;else y=vh-th-8}
 tip.style.left=x+'px';tip.style.top=Math.max(8,y)+'px'}};
$('#tnext').onclick=()=>Tour.i===Tour.steps.length-1?Tour.end('done'):Tour.show(Tour.i+1);
$('#tprev').onclick=()=>{if(Tour.i>0)Tour.show(Tour.i-1)};
$('#tskip').onclick=()=>Tour.end('skipped');
$('#helpBtn').onclick=()=>Tour.start();
addEventListener('keydown',e=>{if(!Tour.active)return;
 if(e.key==='Escape')Tour.end('skipped');
 else if(e.key==='ArrowRight')$('#tnext').click();
 else if(e.key==='ArrowLeft')$('#tprev').click();
 else if(e.key==='Tab'){const b=[...document.querySelectorAll('#ttip button')].filter(x=>!x.hidden&&!x.disabled),f=b.indexOf(document.activeElement);e.preventDefault();b[(f+(e.shiftKey?-1:1)+b.length)%b.length].focus()}});
addEventListener('resize',()=>{if(Tour.active)Tour.show(Tour.i)});
if(!Tour.get())setTimeout(()=>Tour.start(),700);