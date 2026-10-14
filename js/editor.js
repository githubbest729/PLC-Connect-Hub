/* Snippet text handling. Exposes global Editor. */
const Editor={
out:(c,f)=>c.split(/("[^"\n]*"|'[^'\n]*')/).map((p,i)=>i%2?p:f(p)).join(''),
tidy:c=>c.replace(/\r/g,'').replace(/[ \t]+$/gm,'').replace(/\n{3,}/g,'\n\n').trim(),
sql(c){const K=/\b(select|from|where|group by|order by|inner join|left join|join|on|and|or|insert into|values|update|set|delete from|as|between|having|desc|asc|in|top|distinct|union|is|not|null|like)\b/gi;
 return Editor.out(Editor.tidy(c),p=>p.replace(K,m=>m.toUpperCase())).replace(/\s+\b(FROM|WHERE|GROUP BY|ORDER BY|HAVING|UNION|INNER JOIN|LEFT JOIN)\b/g,'\n$1')},
qs(c){let d=0;return Editor.tidy(c).split('\n').map(l=>{l=l.trim();const u=l.toUpperCase();
 if(/^(ENDIF|ELSE|ELSEIF|NEXT|ENDWHILE)\b/.test(u))d=Math.max(0,d-1);
 const r=l?'  '.repeat(d)+l:'';
 if(/^(IF|ELSEIF)\b.*\bTHEN$/.test(u)||/^ELSE$/.test(u)||/^(FOR|WHILE)\b.*\bDO$/.test(u))d++;return r}).join('\n')},
format:(c,y)=>y==='SQL'?Editor.sql(c):Editor.qs(c),
minify(c,y){c=y==='SQL'?c.replace(/--.*$/gm,''):c.replace(/\{[^}]*\}/g,'');return Editor.out(c,p=>p.replace(/\s+/g,' ')).trim()},
check(c,y){const o=(c.match(/\(/g)||[]).length,k=(c.match(/\)/g)||[]).length;if(o!==k)return'unbalanced parentheses';
 if(y==='QuickScript'&&(c.match(/\bIF\b/gi)||[]).length!==(c.match(/\bENDIF\b/gi)||[]).length)return'IF and ENDIF counts differ';return''},
stats:c=>(c?c.split('\n').length:0)+' lines, '+c.length+' characters',
bindTab(ta){ta.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const s=ta.selectionStart;ta.setRangeText('  ',s,ta.selectionEnd,'end');ta.dispatchEvent(new Event('input'))}})}};