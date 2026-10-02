// Helper gọi API
const API = {
  async get(url){ const r = await fetch(url); return r.json(); },
  async post(url, data){
    const r = await fetch(url, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
    return r.json();
  },
  async put(url, data){
    const r = await fetch(url, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
    return r.json();
  },
  async del(url){ const r = await fetch(url, {method:'DELETE'}); return r.json(); },
  async postForm(url, fd){
    const r = await fetch(url, {method:'POST', body:fd});
    return r.json();
  }
};

function fmtMoney(n){
  return Number(n||0).toLocaleString('vi-VN') + '₫';
}
function fmtDate(s){
  if(!s) return '';
  const d = new Date(s); return d.toLocaleDateString('vi-VN');
}
function fmtDateTime(s){
  if(!s) return '';
  const d = new Date(s);
  return d.toLocaleString('vi-VN', {hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit', year:'numeric'});
}
function thuName(n){
  return {2:'Thứ 2',3:'Thứ 3',4:'Thứ 4',5:'Thứ 5',6:'Thứ 6',7:'Thứ 7',8:'Chủ nhật'}[n] || '';
}
function escapeHtml(s){
  return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function toast(msg, type='success'){
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  document.getElementById('toasts').appendChild(el);
  setTimeout(()=>el.remove(), 3000);
}