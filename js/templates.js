/* HTML string templates. Exposes global Tpl. */
const Tpl={
esc:s=>{const d=document.createElement('div');d.textContent=s==null?'':s;return d.innerHTML},
row:(l,v)=>'<div class="row"><span>'+l+'</span><code>'+Tpl.esc(v)+'</code><button data-c="'+encodeURIComponent(v)+'">Copy</button></div>',
err:m=>'<p class="err" role="alert">'+Tpl.esc(m)+'</p>',
empty:m=>'<p class="hint">'+m+'</p>',
snippet:s=>`<article class="sc"><div style="display:flex;justify-content:space-between;gap:.5rem"><b>${Tpl.esc(s.t)}</b><span class="tag">${s.y}</span></div><pre class="sn">${Tpl.esc(s.c)}</pre><button data-c="${encodeURIComponent(s.c)}">Copy</button> <button data-act="se" data-id="${s.id}">Edit</button> <button data-act="sd" data-id="${s.id}">Delete</button></article>`,
task:t=>`<div class="card"><b>${Tpl.esc(t.t)}</b>${t.due?'<small>Due '+Tpl.esc(t.due)+'</small>':''}<div>${t.s>0?`<button data-act="mv" data-id="${t.id}" data-d="-1">Back</button>`:''}${t.s<2?`<button data-act="mv" data-id="${t.id}" data-d="1">Next</button>`:''}<button data-act="dt" data-id="${t.id}">Delete</button></div></div>`,
col:(n,l)=>`<div class="col"><h3>${n} <small class="hint">${l.length}</small></h3>${l.map(Tpl.task).join('')||Tpl.empty('Nothing here yet.')}</div>`,
bomRow:b=>`<tr><td>${Tpl.esc(b.i)}</td><td>${b.q} x ${b.p.toFixed(2)}</td><td>${(b.q*b.p).toFixed(2)}</td><td><button data-act="db" data-id="${b.id}">Remove</button></td></tr>`,
bomTable(l){if(!l.length)return Tpl.empty('No BOM items yet. Add the first item above.');const s=l.reduce((a,b)=>a+b.q*b.p,0),v=s*.05;
 return '<div class="sc"><table><tr><th>Item</th><th>Qty x unit</th><th>AED</th><th></th></tr>'+l.map(Tpl.bomRow).join('')+`<tr><td colspan="2">Subtotal</td><td>${s.toFixed(2)}</td><td></td></tr><tr><td colspan="2">VAT 5%</td><td>${v.toFixed(2)}</td><td></td></tr><tr><td colspan="2"><b>Total</b></td><td><b>${(s+v).toFixed(2)}</b></td><td></td></tr></table></div>`},
table:(h,r)=>'<div class="sc"><table><tr>'+h.map(x=>'<th>'+x+'</th>').join('')+'</tr>'+r.map(x=>'<tr>'+x.map(c=>'<td'+(c&&x[8]?' class="err"':'')+'>'+Tpl.esc(c)+'</td>').join('')+'</tr>').join('')+'</table></div>'};