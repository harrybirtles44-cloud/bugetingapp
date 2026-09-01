const MODEL = 'gemini-3.7-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// OPTIONAL: Add your Gemini API keys here.
// WARNING: Any key placed in client-side code can be viewed by website visitors.
// For a public production site, use a server/serverless proxy instead.
const GEMINI_API_KEYS = [
  'AQ.Ab8RN6Lunl25LZNeXlbTjxZHl9pPD-Z0qcHqt0_ZFRJKiVsaqQ',
  'AQ.Ab8RN6LXy0NxtVe3zeut3jwh5HYcDzm80_DMsvoSXtJ9dkZS8Q',
  'AQ.Ab8RN6JeQlqq_4d9_XaLoyqIsjOxU5ckSr_Pufh_o4enI4OuyQ'
].filter(k => k && !k.startsWith('PASTE_'));
const categories = ['Housing','Food','Transport','Shopping','Entertainment','Bills','Health','Education','Other'];
const seedTransactions = [
  {id:1,name:'Salary',category:'Income',type:'income',amount:2400,date:todayMinus(3)},
  {id:2,name:'Rent',category:'Housing',type:'expense',amount:850,date:todayMinus(4)},
  {id:3,name:'Supermarket',category:'Food',type:'expense',amount:74.28,date:todayMinus(2)},
  {id:4,name:'Train',category:'Transport',type:'expense',amount:28.5,date:todayMinus(2)},
  {id:5,name:'Streaming',category:'Entertainment',type:'expense',amount:15.99,date:todayMinus(1)},
  {id:6,name:'Freelance',category:'Income',type:'income',amount:180,date:todayMinus(1)},
  {id:7,name:'New shoes',category:'Shopping',type:'expense',amount:62,date:todayMinus(6)}
];
const defaultBudgets = [
  {category:'Housing',limit:900},{category:'Food',limit:300},{category:'Transport',limit:160},{category:'Shopping',limit:180},{category:'Entertainment',limit:100},{category:'Bills',limit:220}
];
const state = {
  transactions: load('bf_transactions', seedTransactions),
  budgets: load('bf_budgets', defaultBudgets),
  goals: load('bf_goals', [{id:1,name:'Emergency fund',target:1500,current:420,date:''}]),
  apiKey: localStorage.getItem('bf_gemini_key') || GEMINI_API_KEYS[0] || '',
  view:'dashboard'
};

function todayMinus(n){const d=new Date();d.setDate(d.getDate()-n);return d.toISOString().slice(0,10)}
function load(k,f){try{const v=JSON.parse(localStorage.getItem(k));return v ?? structuredClone(f)}catch{return structuredClone(f)}}
function save(){localStorage.setItem('bf_transactions',JSON.stringify(state.transactions));localStorage.setItem('bf_budgets',JSON.stringify(state.budgets));localStorage.setItem('bf_goals',JSON.stringify(state.goals))}
function money(n){return '£'+Number(n||0).toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2})}
function monthKey(d){return d.slice(0,7)}
function currentMonth(){return new Date().toISOString().slice(0,7)}
function monthData(){const m=currentMonth();return state.transactions.filter(t=>monthKey(t.date)===m)}
function totals(){const tx=monthData();const income=tx.filter(t=>t.type==='income').reduce((a,t)=>a+t.amount,0);const spent=tx.filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount,0);const saved=Math.max(income-spent,0);return {income,spent,saved,rate:income?saved/income*100:0}}
function showToast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200)}
function setView(view){state.view=view;document.querySelectorAll('.nav-item[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));document.getElementById(view+'View').classList.remove('hidden');document.getElementById('pageTitle').textContent=view==='ai'?'AI advisor':view==='goals'?'Savings goals':view.charAt(0).toUpperCase()+view.slice(1);renderAll();document.getElementById('sidebar').classList.remove('open');window.scrollTo({top:0,behavior:'smooth'})}
function renderDashboard(){const t=totals();document.getElementById('incomeMetric').textContent=money(t.income);document.getElementById('spentMetric').textContent=money(t.spent);document.getElementById('savedMetric').textContent=money(t.saved);document.getElementById('savingRateMetric').textContent=Math.round(t.rate)+'%';const safe=Math.max(t.income-t.spent,0);document.getElementById('safeToSpend').textContent=money(safe);const budgetTotal=state.budgets.reduce((a,b)=>a+b.limit,0);const used=state.budgets.reduce((a,b)=>a+categorySpent(b.category),0);const pct=budgetTotal?Math.min(100,Math.round(used/budgetTotal*100)):0;document.getElementById('monthProgress').textContent=pct+'%';document.querySelector('.ring').style.setProperty('--p',pct+'%');
 const sums={};monthData().filter(x=>x.type==='expense').forEach(t=>sums[t.category]=(sums[t.category]||0)+t.amount);const max=Math.max(...Object.values(sums),1);document.getElementById('spendBars').innerHTML=Object.entries(sums).sort((a,b)=>b[1]-a[1]).slice(0,7).map(([c,v])=>`<div class="bar-row"><span>${c}</span><div class="bar-track"><i class="bar-fill" style="width:${Math.max(4,v/max*100)}%"></i></div><span class="bar-amount">${money(v)}</span></div>`).join('') || '<p class="small-muted">No spending yet.</p>';
 const budgets=state.budgets.slice(0,5);document.getElementById('budgetMini').innerHTML=budgets.map(b=>budgetLineHTML(b)).join('') || '<p class="small-muted">Add your first budget.</p>';
 const recent=state.transactions.slice().sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id).slice(0,6);document.getElementById('recentTable').innerHTML=recent.map(txRow).join('')||emptyRow(4,'No transactions yet');
}
function categorySpent(c){return monthData().filter(t=>t.type==='expense'&&t.category===c).reduce((a,t)=>a+t.amount,0)}
function budgetLineHTML(b){const spent=categorySpent(b.category),p=b.limit?Math.min(100,spent/b.limit*100):0,cls=p>=100?'over':p>=80?'warn':'';return `<div class="budget-line"><div><span>${b.category}</span><small>${money(spent)} / ${money(b.limit)}</small></div><div class="budget-status"><i class="${cls}" style="width:${p}%"></i></div><strong>${Math.round(p)}%</strong></div>`}
function txRow(t,del=false){return `<tr><td><span class="tx-name">${esc(t.name)}</span></td><td><span class="pill">${t.category}</span></td><td><span class="pill">${t.type}</span></td><td>${t.date}</td><td class="${t.type==='income'?'amount-pos':'amount-neg'}">${t.type==='income'?'+':'-'}${money(t.amount)}</td>${del?`<td><button class="delete-btn" data-delete="${t.id}">Delete</button></td>`:''}</tr>`}
function emptyRow(cols,msg){return `<tr><td colspan="${cols}" class="small-muted" style="text-align:center;padding:30px">${msg}</td></tr>`}
function renderTransactions(){const q=document.getElementById('transactionSearch').value.trim().toLowerCase();const type=document.getElementById('transactionType').value;const cat=document.getElementById('transactionCategory').value;const list=state.transactions.slice().filter(t=>(!q||t.name.toLowerCase().includes(q)||t.category.toLowerCase().includes(q))&&(type==='all'||t.type===type)&&(cat==='all'||t.category===cat)).sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);document.getElementById('transactionsTable').innerHTML=list.map(t=>txRow(t,true)).join('')||emptyRow(6,'No matching transactions.');}
function renderBudgets(){document.getElementById('budgetGrid').innerHTML=state.budgets.map(b=>{const s=categorySpent(b.category),p=b.limit?Math.min(100,s/b.limit*100):0,cls=p>=100?'over':p>=80?'warn':'';return `<article class="budget-card"><div class="budget-card-top"><div><p class="eyebrow">MONTHLY</p><h3>${b.category}</h3></div><button class="delete-btn" data-budget-delete="${b.category}">Delete</button></div><div class="progress-big"><i class="${cls}" style="width:${p}%"></i></div><div class="budget-meta"><span>${money(s)} spent</span><strong>${money(b.limit)} limit</strong></div></article>`}).join('')||'<p class="small-muted">No budgets yet.</p>'}
function renderGoals(){document.getElementById('goalGrid').innerHTML=state.goals.map(g=>{const p=Math.min(100,g.target?g.current/g.target*100:0);return `<article class="goal-card"><p class="eyebrow">SAVINGS GOAL</p><h3>${esc(g.name)}</h3><div class="goal-ring-mini" style="--p:${p}%"><span>${Math.round(p)}%</span></div><p class="target">${money(g.current)} of ${money(g.target)}${g.date?' • '+g.date:''}</p><div style="display:flex;gap:8px;margin-top:15px"><button class="btn soft" data-goal-add="${g.id}">Add £50</button><button class="btn soft" data-goal-delete="${g.id}">Delete</button></div></article>`}).join('')||'<p class="small-muted">Create your first savings goal.</p>'}
function renderApi(){document.getElementById('apiKeyInput').value=state.apiKey;document.getElementById('apiStatusDot').classList.toggle('on',!!state.apiKey)}
function renderAll(){renderDashboard();renderTransactions();renderBudgets();renderGoals();renderApi();}
function populateCategories(){const options=categories.map(c=>`<option>${c}</option>`).join('');document.getElementById('txCategory').innerHTML=options;document.getElementById('budgetCategory').innerHTML=options;document.getElementById('transactionCategory').innerHTML='<option value="all">All categories</option>'+options}
function esc(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function openModal(id){document.getElementById(id).classList.remove('hidden');if(id==='transactionModal')document.getElementById('txDate').value=todayMinus(0)}
function closeModal(id){document.getElementById(id).classList.add('hidden')}

async function askGemini(prompt){
  const keys = GEMINI_API_KEYS.length ? GEMINI_API_KEYS : (state.apiKey ? [state.apiKey] : []);
  if(!keys.length) throw new Error('Add a Gemini API key in script.js first.');
  const t=totals();
  const snapshot={month:currentMonth(),income:t.income,spent:t.spent,saved:t.saved,savingsRate:`${t.rate.toFixed(1)}%`,transactions:state.transactions.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,40),budgets:state.budgets,goals:state.goals};
  const system=`You are BudgetFlow AI, a careful personal budgeting assistant. Give practical, conservative budgeting guidance based only on the user's supplied data. Do not claim to be a financial adviser. Never promise investment returns. Use GBP (£) and UK spelling. Flag missing information. Keep the answer clear with short sections and actionable steps. Here is the user's current local budget snapshot:\n${JSON.stringify(snapshot,null,2)}\n\nUser question: ${prompt}`;

  let lastError = null;
  for(let i=0;i<keys.length;i++){
    const key = keys[i];
    try{
      const res=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{role:'user',parts:[{text:system}]}],generationConfig:{temperature:0.4,maxOutputTokens:900}})});
      if(!res.ok){
        let msg='Gemini request failed';
        try{const e=await res.json();msg=e?.error?.message||msg}catch{}
        lastError = new Error(msg);
        continue;
      }
      const data=await res.json();
      const answer=data?.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('');
      if(answer) return answer;
      lastError = new Error('No response received.');
    }catch(err){ lastError = err; }
  }
  throw lastError || new Error('All Gemini API keys failed.');
}
function addChat(role,text){const box=document.getElementById('chatMessages');const div=document.createElement('div');div.className=role==='user'?'user-msg':'assistant-msg';div.innerHTML=role==='user'?`<p>${esc(text)}</p>`:`<strong>BudgetFlow AI</strong><p>${esc(text)}</p>`;box.appendChild(div);box.scrollTop=box.scrollHeight}

// Navigation
 document.querySelectorAll('.nav-item[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>{const target=b.dataset.open;if(target==='transactions')openModal('transactionModal');else setView(target)}));
document.getElementById('mobileMenu').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));
document.getElementById('quickAdd').addEventListener('click',()=>openModal('transactionModal'));document.getElementById('addTransactionBtn').addEventListener('click',()=>openModal('transactionModal'));document.getElementById('addBudgetBtn').addEventListener('click',()=>openModal('budgetModal'));document.getElementById('addGoalBtn').addEventListener('click',()=>openModal('goalModal'));document.getElementById('settingsBtn').addEventListener('click',()=>setView('ai'));

document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.add('hidden')}));

document.getElementById('transactionForm').addEventListener('submit',e=>{e.preventDefault();state.transactions.push({id:Date.now(),name:document.getElementById('txName').value.trim(),amount:+document.getElementById('txAmount').value,type:document.getElementById('txType').value,category:document.getElementById('txCategory').value,date:document.getElementById('txDate').value});save();e.target.reset();closeModal('transactionModal');renderAll();showToast('Transaction added');});
document.getElementById('budgetForm').addEventListener('submit',e=>{e.preventDefault();const category=document.getElementById('budgetCategory').value,limit=+document.getElementById('budgetAmount').value;state.budgets=state.budgets.filter(b=>b.category!==category);state.budgets.push({category,limit});save();e.target.reset();closeModal('budgetModal');renderAll();showToast('Budget saved');});
document.getElementById('goalForm').addEventListener('submit',e=>{e.preventDefault();state.goals.push({id:Date.now(),name:document.getElementById('goalName').value.trim(),target:+document.getElementById('goalTarget').value,current:+document.getElementById('goalCurrent').value||0,date:document.getElementById('goalDate').value});save();e.target.reset();closeModal('goalModal');renderAll();showToast('Savings goal created');});

document.addEventListener('click',e=>{const d=e.target.closest('[data-delete]');if(d){state.transactions=state.transactions.filter(t=>String(t.id)!==d.dataset.delete);save();renderAll();showToast('Transaction deleted')}const bd=e.target.closest('[data-budget-delete]');if(bd){state.budgets=state.budgets.filter(b=>b.category!==bd.dataset.budgetDelete);save();renderAll();showToast('Budget removed')}const gd=e.target.closest('[data-goal-delete]');if(gd){state.goals=state.goals.filter(g=>String(g.id)!==gd.dataset.goalDelete);save();renderAll();showToast('Goal removed')}const ga=e.target.closest('[data-goal-add]');if(ga){const g=state.goals.find(x=>String(x.id)===ga.dataset.goalAdd);if(g){g.current=Math.min(g.target,g.current+50);save();renderAll();showToast('£50 added to goal')}}});

['transactionSearch','transactionType','transactionCategory'].forEach(id=>document.getElementById(id).addEventListener('input',renderTransactions));

document.getElementById('saveApiKey').addEventListener('click',()=>{state.apiKey=document.getElementById('apiKeyInput').value.trim();if(state.apiKey)localStorage.setItem('bf_gemini_key',state.apiKey);else localStorage.removeItem('bf_gemini_key');renderApi();showToast(state.apiKey?'Gemini key saved locally':'Gemini key cleared')});
document.getElementById('clearApiKey').addEventListener('click',()=>{state.apiKey='';localStorage.removeItem('bf_gemini_key');renderApi();showToast('Gemini key cleared')});

document.querySelectorAll('.prompt-row button').forEach(b=>b.addEventListener('click',()=>{document.getElementById('chatInput').value=b.dataset.prompt;document.getElementById('chatInput').focus()}));
document.getElementById('chatForm').addEventListener('submit',async e=>{e.preventDefault();const input=document.getElementById('chatInput'),btn=document.getElementById('sendAiBtn');const text=input.value.trim();if(!text)return;addChat('user',text);input.value='';btn.disabled=true;btn.textContent='Thinking…';try{const answer=await askGemini(text);addChat('assistant',answer)}catch(err){addChat('assistant','I could not reach Gemini: '+err.message)}finally{btn.disabled=false;btn.innerHTML='Send <span>→</span>'}});

populateCategories();renderAll();
