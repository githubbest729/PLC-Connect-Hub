/* IndexedDB layer. Exposes global DB. */
const DB=(()=>{let db;
const open=()=>db?Promise.resolve(db):new Promise((res,rej)=>{if(!window.indexedDB)return rej(new Error('IndexedDB unavailable'));const r=indexedDB.open('plch',1);
r.onupgradeneeded=()=>['snippets','tasks','bom'].forEach(s=>r.result.createObjectStore(s,{keyPath:'id',autoIncrement:true}));
r.onsuccess=()=>res(db=r.result);r.onerror=()=>rej(r.error)});
const tx=(s,m,f)=>open().then(d=>new Promise((res,rej)=>{const t=d.transaction(s,m),q=f(t.objectStore(s));t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error)}));
const SEED={
snippets:[
{t:'Historian: last hour, 1-minute cyclic',y:'SQL',c:`SELECT DateTime, TagName, Value
FROM Runtime.dbo.History
WHERE TagName IN ('Tank1_Level')
AND DateTime >= DATEADD(hh, -1, GETDATE())
AND wwRetrievalMode = 'Cyclic'
AND wwResolution = 60000`},
{t:'Historian: 7-day daily average',y:'SQL',c:`SELECT DATEADD(dd, DATEDIFF(dd, 0, DateTime), 0) AS Day, TagName, AVG(Value) AS AvgValue
FROM Runtime.dbo.AnalogHistory
WHERE TagName = 'Pump1_Flow'
AND DateTime >= DATEADD(dd, -7, GETDATE())
GROUP BY DATEADD(dd, DATEDIFF(dd, 0, DateTime), 0), TagName
ORDER BY Day`},
{t:'Historian: list tags by prefix',y:'SQL',c:`SELECT TOP 100 TagName, Description
FROM Runtime.dbo.Tag
WHERE TagName LIKE 'Tank%'
ORDER BY TagName`},
{t:'4-20 mA scaling with high-high alarm',y:'QuickScript',c:`{ Scale 4-20 mA raw value to 0-100 percent }
Tank1_Level = (Tank1_Raw - 4) * (100 - 0) / (20 - 4) + 0;
IF Tank1_Level > 90 THEN
  Tank1_HiHi = 1;
ELSE
  Tank1_HiHi = 0;
ENDIF;`},
{t:'Siemens 0-27648 scaling with clamp',y:'QuickScript',c:`{ Scale S7 analog input to 0-10 bar }
Pump1_Press = Pump1_Raw * 10.0 / 27648.0;
IF Pump1_Press < 0 THEN
  Pump1_Press = 0;
ENDIF;
IF Pump1_Press > 10 THEN
  Pump1_Press = 10;
ENDIF;`}],
tasks:[
{t:'Map Site A Modbus Tags',s:0,due:''},{t:'Prepare Site B alarm list',s:0,due:''},{t:'Review MCC panel schedules',s:0,due:''},
{t:'Configure OPC server for PLC-02',s:1,due:''},{t:'Build tank farm graphics',s:1,due:''},
{t:'Site survey and I/O count',s:2,due:''},{t:'Issue BOM estimate rev A',s:2,due:''}],
bom:[
{i:'S7-1500 CPU 1515-2 PN',q:1,p:9800},{i:'DI 32x24VDC module',q:2,p:1450},{i:'AI 8xU/I module',q:2,p:2300},
{i:'Industrial Ethernet switch',q:2,p:1900},{i:'24 VDC PSU 10 A',q:2,p:780},{i:'Cable and terminals (lot)',q:1,p:3500}]};
return{all:s=>tx(s,'readonly',o=>o.getAll()),put:(s,v)=>tx(s,'readwrite',o=>o.put(v)),del:(s,id)=>tx(s,'readwrite',o=>o.delete(id)),count:s=>tx(s,'readonly',o=>o.count()),
async seed(){for(const s in SEED)if(!(await DB.count(s)))for(const v of SEED[s])await DB.put(s,{...v}).catch(()=>{})}}})();