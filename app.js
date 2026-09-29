const KEY='alliance-prototype-v1';
let alliances=JSON.parse(localStorage.getItem(KEY)||'[]');
let selectedDays=3;

const $=s=>document.querySelector(s);
const save=()=>localStorage.setItem(KEY,JSON.stringify(alliances));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
function status(a){
  const now=Date.now(), end=new Date(a.expiresAt).getTime(), lockEnd=new Date(a.lockedUntil).getTime();
  if(now<end)return {label:'Active',cls:'green',until:end,mode:'active'};
  if(now<lockEnd)return {label:'Bloquée',cls:'red',until:lockEnd,mode:'locked'};
  return {label:'Disponible',cls:'',until:0,mode:'available'};
}
function fmt(ms){
  if(ms<=0)return '00j 00h 00m 00s';
  let s=Math.floor(ms/1000), d=Math.floor(s/86400);s%=86400;
  let h=Math.floor(s/3600);s%=3600;let m=Math.floor(s/60);s%=60;
  return `${String(d).padStart(2,'0')}j ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
}
function render(){
  const now=Date.now();
  alliances=alliances.filter(a=>a && a.org);
  const active=alliances.filter(a=>status(a).mode==='active').length;
  const locked=alliances.filter(a=>status(a).mode==='locked').length;
  $('#stats').innerHTML=`<div class="stat"><div class="muted">ALLIANCES ACTIVES</div><div class="n">${active}</div></div><div class="stat"><div class="muted">EN PÉRIODE DE BLOCAGE</div><div class="n">${locked}</div></div><div class="stat"><div class="muted">DURÉE MAXIMUM</div><div class="n">4 jours</div></div>`;
  $('#count').textContent=alliances.length+' enregistrement(s)';
  if(!alliances.length){$('#tableWrap').innerHTML='<div class="empty">Aucune alliance pour le moment.<br><br><button class="primary" onclick="showCreate()">Créer la première alliance</button></div>';return}
  $('#tableWrap').innerHTML=`<table class="table"><thead><tr><th>Organisation</th><th>Allié</th><th>Type</th><th>Durée</th><th>Statut</th><th>Temps restant</th><th></th></tr></thead><tbody>${alliances.map(a=>{
    const s=status(a);
    return `<tr><td><b>${esc(a.org)}</b></td><td>${esc(a.partner)}</td><td><span class="badge">${esc(a.type)}</span></td><td>${a.days} jour${a.days>1?'s':''}</td><td><span class="badge ${s.cls}">${s.label}</span></td><td class="timer" data-until="${s.until}" data-mode="${s.mode}">${s.mode==='active'?'Alliance : '+fmt(s.until-now):s.mode==='locked'?'Disponible dans : '+fmt(s.until-now):'Disponible'}</td><td><button class="danger" onclick="removeAlliance('${a.id}')">Suppr.</button></td></tr>`}).join('')}</tbody></table>`;
}
function checkOrg(org){
  const n=org.trim().toLowerCase(), now=Date.now();
  const existing=alliances.find(a=>a.org.trim().toLowerCase()===n);
  if(!existing)return null;
  const s=status(existing);
  if(s.mode==='active')return {kind:'active',text:`Cette organisation possède déjà une alliance active pendant ${fmt(s.until-now)}.`};
  if(s.mode==='locked')return {kind:'locked',text:`Cette organisation est bloquée. Nouvelle création possible dans <b>${fmt(s.until-now)}</b>.`};
  return null;
}
function showCreate(){
  $('.nav[data-view="create"]').click();
}
function updateNotice(){
  const org=$('#org').value;
  const n=checkOrg(org);
  const box=$('#lockNotice');
  if(n){box.classList.remove('hidden');box.innerHTML='⛔ '+n.text}else box.classList.add('hidden');
}
function toast(t){const x=$('#toast');x.textContent=t;x.style.opacity=1;x.style.transform='translateY(0)';setTimeout(()=>{x.style.opacity=0;x.style.transform='translateY(10px)'},2600)}
function removeAlliance(id){if(confirm('Supprimer cet enregistrement ?')){alliances=alliances.filter(a=>a.id!==id);save();render();toast('Enregistrement supprimé.');}}
window.removeAlliance=removeAlliance;window.showCreate=showCreate;

document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.nav').forEach(x=>x.classList.remove('active'));b.classList.add('active');
  document.querySelectorAll('.view').forEach(x=>x.classList.add('hidden'));$('#'+b.dataset.view).classList.remove('hidden');
  $('#pageTitle').textContent=b.dataset.view==='create'?'Créer une alliance':'Tableau de bord';
  if(b.dataset.view==='create')updateNotice();
});
$('#headerCreate').onclick=showCreate;
$('#org').addEventListener('input',updateNotice);
document.querySelectorAll('.dur').forEach(b=>b.onclick=()=>{selectedDays=+b.dataset.days;document.querySelectorAll('.dur').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')});
$('#allianceForm').onsubmit=e=>{
 e.preventDefault();
 const org=$('#org').value.trim(), partner=$('#partner').value.trim(), type=document.querySelector('input[name=type]:checked').value;
 const conflict=checkOrg(org);
 if(conflict){updateNotice();toast('Création impossible pour cette organisation.');return}
 const created=Date.now(), expires=created+selectedDays*86400000, locked=expires+7*86400000;
 alliances.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),org,partner,type,days:selectedDays,createdAt:new Date(created).toISOString(),expiresAt:new Date(expires).toISOString(),lockedUntil:new Date(locked).toISOString()});
 save();e.target.reset();selectedDays=3;document.querySelectorAll('.dur').forEach(x=>x.classList.toggle('selected',x.dataset.days==='3'));toast('Alliance créée avec succès.');document.querySelector('.nav[data-view="dashboard"]').click();render();
};
$('#resetBtn').onclick=()=>{if(confirm('Effacer toutes les données du prototype ?')){alliances=[];save();render();toast('Données réinitialisées.')}};
setInterval(()=>{render();},1000);
render();