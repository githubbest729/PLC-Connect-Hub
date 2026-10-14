if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js').catch(console.warn));
const net=()=>{const n=document.getElementById('net');if(n){n.textContent=navigator.onLine?'Online':'Offline mode';n.style.color=navigator.onLine?'#7ee0a5':'#f2a900'}};
addEventListener('online',net);addEventListener('offline',net);net();