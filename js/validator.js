/* Input validation. Exposes global Validator. Each check returns '' when valid, else a message. */
const Validator={
ipOk:s=>{const p=String(s).trim().split('.');return p.length===4&&p.every(x=>/^\d{1,3}$/.test(x)&&+x<=255)},
ip:s=>Validator.ipOk(s)?'':'IP address must be four numbers from 0 to 255, for example 192.168.1.10.',
port:s=>/^\d+$/.test(String(s).trim())&&+s>=1&&+s<=65535?'':'Port must be a whole number from 1 to 65535.',
modbus(s,zero){s=String(s).trim();if(!/^\d{1,6}$/.test(s))return'Register must be 1 to 6 digits.';
 if(s.length>=5&&!'0134'.includes(s[0]))return'Five- and six-digit registers must start with 0, 1, 3 or 4.';
 const n=s.length>=5?+s.slice(1):+s,max=s.length===5?9999:65536;
 return n>=(zero?0:1)&&n<=max?'':'Register address must be between '+(zero?0:1)+' and '+max+'.'},
tag:(b,a)=>TagConv.convert(b,a).err||''};