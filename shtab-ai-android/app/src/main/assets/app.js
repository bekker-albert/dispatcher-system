const STORAGE='shtab-ai-v1';
const pad=n=>String(n).padStart(2,'0');
const dayKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const uid=()=>`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
const now=new Date();
const esc=s=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const seed=()=>({
 projects:[
  {id:'aidarly',name:'Айдарлы',description:'Бюджет, запуск проекта и диспетчеризация',color:'#7c5cfc'},
  {id:'dispatch',name:'Диспетчерская служба',description:'Текущие задачи, GPS и отчетность',color:'#00cfe8'},
  {id:'personal',name:'Личное',description:'Личные дела и автомобиль',color:'#28c76f'}],
 tasks:[
  {id:uid(),title:'Сверить текущие задачи диспетчерской службы',date:dayKey(now),time:'17:30',project:'dispatch',priority:'high',completed:false},
  {id:uid(),title:'Подготовить вопросы по бюджету Айдарлы',date:dayKey(addDays(now,1)),time:'10:00',project:'aidarly',priority:'high',completed:false},
  {id:uid(),title:'Проверить статус пилотного проекта CARVIS',date:dayKey(addDays(now,1)),time:'14:00',project:'dispatch',priority:'normal',completed:false}],
 messages:[{role:'assistant',text:'Я готов. В версии 1 могу создавать, переносить и завершать задачи, показывать план и просроченное. Голосовой разговор будет в версии 2.'}],
 selectedDate:dayKey(now)});
let state;try{state=JSON.parse(localStorage.getItem(STORAGE))||seed()}catch{state=seed()}
let page='today';
const project=id=>state.projects.find(p=>p.id===id);
const due=t=>new Date(`${t.date}T${t.time||'18:00'}:00`);
const short=d=>new Intl.DateTimeFormat('ru-RU',{day:'2-digit',month:'2-digit'}).format(d);
const titleDate=d=>new Intl.DateTimeFormat('ru-RU',{weekday:'long',day:'numeric',month:'long'}).format(d);

function native(){return typeof Android!=='undefined'}
function syncNotification(t){
 if(!native())return;
 try{if(t.completed||due(t)<=new Date())Android.cancelNotification(t.id);else Android.scheduleNotification(t.id,t.title,due(t).getTime())}catch{}
}
function syncAllNotifications(){state.tasks.forEach(syncNotification)}
window.syncAllNotifications=syncAllNotifications;
function save(){localStorage.setItem(STORAGE,JSON.stringify(state));syncAllNotifications()}

const headings={today:['Добрый день, Альберт',titleDate(now)],plan:['План','Задачи по дням'],assistant:['Помощник','Текстовый режим · версия 1'],projects:['Проекты','Работа и личные направления'],more:['Еще','Настройки и развитие']};
function render(){
 renderToday();renderPlan();renderAssistant();renderProjects();renderMore();
 document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id===page));
 document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.page===page));
 document.querySelector('#page-title').textContent=headings[page][0];document.querySelector('#page-subtitle').textContent=headings[page][1];
 document.querySelector('#fab').style.display=page==='assistant'?'none':'block';
}
function taskCard(t){const p=project(t.project),late=!t.completed&&due(t)<new Date();return `<article class="card task ${t.completed?'completed':''}"><button class="task-check" onclick="toggleTask('${t.id}')">${t.completed?'✓':''}</button><div><div class="task-title">${esc(t.title)}</div><div class="task-meta"><span class="${late?'overdue':''}">◷ ${short(due(t))}, ${t.time}</span>${p?`<span style="color:${p.color}">▰ ${esc(p.name)}</span>`:''}${t.priority==='high'?'<span style="color:#ff9f43">⚑ Высокий</span>':''}</div></div><button class="dot-menu" onclick="deleteTask('${t.id}')">⋮</button></article>`}
function renderToday(){
 const list=state.tasks.filter(t=>t.date===dayKey(now)).sort((a,b)=>a.time.localeCompare(b.time));
 const done=list.filter(t=>t.completed).length,progress=list.length?Math.round(done/list.length*100):0;
 const late=state.tasks.filter(t=>!t.completed&&due(t)<new Date()).length;
 const next=state.tasks.filter(t=>!t.completed&&due(t)>new Date()).sort((a,b)=>due(a)-due(b))[0];
 document.querySelector('#today').innerHTML=`<div class="hero"><div class="hero-row"><div class="ai-mark">✦</div><span class="badge">Версия 1</span></div><div><small>${next?'Следующее дело':'План свободен'}</small><h2>${next?esc(next.title):'Добавьте новую задачу или спланируйте проект.'}</h2>${next?`<div class="due">◷ ${short(due(next))}, ${next.time}</div>`:''}</div></div><div class="metrics"><div class="metric"><div class="metric-icon">✓</div><strong>${progress}%</strong><small>выполнено сегодня</small></div><div class="metric"><div class="metric-icon">⚠</div><strong>${late}</strong><small>просрочено</small></div></div><div class="section-head"><h3>Быстрые команды</h3></div><div class="chips"><button class="chip" onclick="quickCommand('Что у меня сегодня?')">☀ Что сегодня?</button><button class="chip" onclick="openTaskDialog(true)">＋ На завтра</button></div><div class="section-head"><h3>Сегодня</h3><span class="counter">${list.length}</span></div>${list.length?list.map(taskCard).join(''):'<div class="card empty">На сегодня задач нет.</div>'}`;
}
function renderPlan(){const days=Array.from({length:7},(_,i)=>addDays(now,i)),list=state.tasks.filter(t=>t.date===state.selectedDate).sort((a,b)=>a.time.localeCompare(b.time));document.querySelector('#plan').innerHTML=`<div class="date-strip">${days.map(d=>`<button class="date-chip ${dayKey(d)===state.selectedDate?'selected':''}" onclick="selectDate('${dayKey(d)}')"><span>${new Intl.DateTimeFormat('ru-RU',{weekday:'short'}).format(d)}</span><strong>${d.getDate()}</strong></button>`).join('')}</div><div class="section-head"><h3>${new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long'}).format(new Date(state.selectedDate+'T12:00:00'))}</h3><span class="counter">${list.length}</span></div>${list.length?list.map(taskCard).join(''):'<div class="card empty">День свободен.</div>'}`}
function renderAssistant(){document.querySelector('#assistant').innerHTML=`<div class="assistant-wrap"><div class="voice-note">🎙️ <div><strong>Голосовой разговор — версия 2</strong><br><small>Сейчас доступен текстовый режим</small></div></div><div class="chips"><button class="chip" onclick="quickCommand('Что у меня сегодня?')">Что сегодня?</button><button class="chip" onclick="quickCommand('Что просрочено?')">Просрочено</button><button class="chip" onclick="quickCommand('Покажи проекты')">Проекты</button></div><div class="chat" id="chat">${state.messages.map(m=>`<div class="bubble ${m.role}">${esc(m.text)}</div>`).join('')}</div><form class="chat-form" id="chat-form"><input id="chat-input" placeholder="Напишите команду…"><button class="send">↑</button></form></div>`;document.querySelector('#chat-form').onsubmit=e=>{e.preventDefault();const input=document.querySelector('#chat-input');quickCommand(input.value);input.value=''};requestAnimationFrame(()=>{const c=document.querySelector('#chat');if(c)c.scrollTop=c.scrollHeight})}
function renderProjects(){document.querySelector('#projects').innerHTML=state.projects.map(p=>{const all=state.tasks.filter(t=>t.project===p.id),done=all.filter(t=>t.completed).length,progress=all.length?Math.round(done/all.length*100):0;return `<article class="card project"><div class="project-head"><span class="project-bar" style="background:${p.color}"></span><div style="flex:1"><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p></div><strong>${progress}%</strong></div><div class="progress"><span style="width:${progress}%;background:${p.color}"></span></div><p>Открыто задач: ${all.filter(t=>!t.completed).length}</p></article>`}).join('')}
function renderMore(){document.querySelector('#more').innerHTML=`<article class="card more-card"><div class="profile"><div class="avatar">АБ</div><div><strong>Альберт Беккер</strong><p style="margin:4px 0;color:var(--muted)">Начальник диспетчерской службы</p></div></div></article><article class="card more-card voice-v2"><div style="font-size:30px">〽</div><h3>Версия 2: голосовой разговор</h3><p>Потоковый диалог, озвучивание плана и подтверждение действий голосом.</p></article><button class="secondary" onclick="resetData()">Восстановить стартовые данные</button><p style="text-align:center;color:var(--muted);margin-top:24px">Штаб AI · 1.0.0</p>`}
window.toggleTask=x=>{const t=state.tasks.find(t=>t.id===x);if(t){t.completed=!t.completed;save();render()}};
window.deleteTask=x=>{if(confirm('Удалить задачу?')){if(native())try{Android.cancelNotification(x)}catch{}state.tasks=state.tasks.filter(t=>t.id!==x);save();render()}};
window.selectDate=x=>{state.selectedDate=x;save();render()};
window.openTaskDialog=tomorrow=>{const d=document.querySelector('#task-dialog');document.querySelector('#task-title').value='';document.querySelector('#task-date').value=dayKey(tomorrow?addDays(now,1):now);document.querySelector('#task-time').value='18:00';document.querySelector('#task-project').innerHTML='<option value="">Без проекта</option>'+state.projects.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');d.showModal()};
function parseDue(text){let d=new Date(),s=text.toLowerCase();if(s.includes('послезавтра'))d=addDays(d,2);else if(s.includes('завтра'))d=addDays(d,1);let h=18,m=0;const tm=s.match(/\b(?:в|на)\s*(\d{1,2})[:.](\d{2})\b/);if(tm){h=+tm[1];m=+tm[2]}else if(s.includes('утром'))h=9;else if(s.includes('после обеда'))h=15;else if(s.includes('вечером'))h=19;d.setHours(h,m,0,0);return d}
function cleanTitle(s){return s.replace(/^(добавь задачу|создай задачу|запланируй)\s*/i,'').replace(/\b(сегодня|завтра|послезавтра|утром|вечером)\b/gi,'').replace(/\b(до|после) обеда\b/gi,'').replace(/\b(?:в|на)\s*\d{1,2}[:.]\d{2}\b/gi,'').replace(/\s+/g,' ').trim()}
function answer(text){const l=text.toLowerCase().replaceAll('ё','е');if(l.includes('что у меня сегодня')||l.includes('план на сегодня')){const a=state.tasks.filter(t=>t.date===dayKey(now)&&!t.completed);return a.length?a.map(t=>`• ${t.time} — ${t.title}`).join('\n'):'На сегодня задач нет.'}if(l.includes('просроч')){const a=state.tasks.filter(t=>!t.completed&&due(t)<new Date());return a.length?a.map(t=>`• ${short(due(t))}, ${t.time} — ${t.title}`).join('\n'):'Просроченных задач нет.'}if(l.includes('покажи проекты')||l==='проекты')return state.projects.map(p=>`• ${p.name}: открыто ${state.tasks.filter(t=>t.project===p.id&&!t.completed).length}`).join('\n');if(/^(заверши|закрой|выполни) задачу/.test(l)){const f=l.replace(/^(заверши|закрой|выполни) задачу\s*/,'');const t=state.tasks.find(x=>!x.completed&&x.title.toLowerCase().includes(f));if(!t)return `Не нашел задачу «${f}».`;t.completed=true;return `Задача «${t.title}» завершена.`}if(/^(добавь задачу|создай задачу|запланируй)/.test(l)){const d=parseDue(l),name=cleanTitle(text);if(!name)return 'Не понял название задачи.';const p=state.projects.find(p=>l.includes(p.name.toLowerCase()));state.tasks.push({id:uid(),title:name[0].toUpperCase()+name.slice(1),date:dayKey(d),time:`${pad(d.getHours())}:${pad(d.getMinutes())}`,project:p?.id||'',priority:'normal',completed:false});return `Создал задачу «${name}» на ${short(d)}, ${pad(d.getHours())}:${pad(d.getMinutes())}.`}return 'В версии 1 я понимаю команды: создать или завершить задачу, показать план на сегодня, просроченное и проекты.'}
window.quickCommand=text=>{text=String(text||'').trim();if(!text)return;state.messages.push({role:'user',text});state.messages.push({role:'assistant',text:answer(text)});save();page='assistant';render()};
window.resetData=()=>{if(confirm('Заменить текущие данные стартовыми?')){state=seed();save();render()}};
document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>{page=b.dataset.page;render()});
document.querySelector('#fab').onclick=()=>openTaskDialog(false);
document.querySelector('#task-form').onsubmit=e=>{e.preventDefault();const title=document.querySelector('#task-title').value.trim();if(!title)return;state.tasks.push({id:uid(),title,date:document.querySelector('#task-date').value,time:document.querySelector('#task-time').value,project:document.querySelector('#task-project').value,priority:document.querySelector('#task-priority').value,completed:false});save();document.querySelector('#task-dialog').close();render()};
document.querySelector('#notify-btn').onclick=()=>{if(native()){Android.requestNotifications();syncAllNotifications()}else alert('Системные напоминания доступны в APK.')};
render();syncAllNotifications();
