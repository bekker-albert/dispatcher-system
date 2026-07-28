function renderToday(){
  const key=dayKey(today),tasks=tasksForDate(key),done=tasks.filter(t=>taskDone(t,key)).length;
  const habits=state.habits.filter(h=>habitDue(h,key)),habitDoneCount=habits.filter(h=>habitDone(h,key)).length;
  const tx=transactionsForDate(key).filter(x=>x.status!=='actual'&&!txSettled(x,key));
  const workouts=workoutsForDate(key).filter(w=>w.status!=='completed');
  const next=upcomingItems()[0];
  document.querySelector('#today').innerHTML=`
    <div class="hero"><div class="hero-top"><div class="assistant-mark">✦</div><span class="badge">Личная система</span></div><div><small>${next?'Следующее событие':'План свободен'}</small><h2>${next?esc(next.title):'Добавьте задачу, платеж, тренировку или цель.'}</h2>${next?`<p>◷ ${dateFmt(next.when,{day:'2-digit',month:'2-digit'})}, ${pad(next.when.getHours())}:${pad(next.when.getMinutes())}</p>`:''}</div></div>
    <div class="dashboard-grid">
      <article class="card dash-card" onclick="setPage('plan')"><div class="icon">✓</div><strong>${done}/${tasks.length}</strong><small>задач сегодня</small></article>
      <article class="card dash-card" onclick="setPage('finance')"><div class="icon">₸</div><strong>${tx.length}</strong><small>платежей сегодня</small></article>
      <article class="card dash-card" onclick="openMore('sport')"><div class="icon">↻</div><strong>${habitDoneCount}/${habits.length}</strong><small>привычек выполнено</small></article>
      <article class="card dash-card" onclick="openMore('sport')"><div class="icon">⚡</div><strong>${workouts.length}</strong><small>тренировок</small></article>
    </div>
    <div class="section-head"><h3>Быстро</h3></div><div class="chips"><button class="chip" onclick="openEditor('task')">＋ Задача</button><button class="chip" onclick="openEditor('expense')">− Расход</button><button class="chip" onclick="startVoice()">🎙 Команда</button><button class="chip" onclick="quickCommand('Что у меня сегодня?')">План дня</button></div>
    <div class="section-head"><h3>Задачи</h3><span class="counter">${tasks.length}</span></div>${taskList(tasks,key)}
    <div class="section-head"><h3>Деньги и спорт</h3></div>${tx.length?tx.map(x=>transactionCard(x,key)).join(''):''}${workouts.length?workouts.map(workoutCard).join(''):''}${!tx.length&&!workouts.length?'<div class="card empty">На сегодня платежей и тренировок нет.</div>':''}`;
}
function taskList(list,key){const visible=state.settings.hideCompleted?list.filter(t=>!taskDone(t,key)):list;return visible.length?visible.map(t=>taskCard(t,key)).join(''):'<div class="card empty">Задач нет.</div>'}
function taskCard(t,key){const p=project(t.project),done=taskDone(t,key),late=!done&&dateTime(key,t.time)<new Date();return `<article class="card task ${done?'done':''}"><button class="task-check" onclick="toggleTask('${t.id}','${key}')">${done?'✓':''}</button><div onclick="openEditor('task','${t.id}')"><div class="task-title">${esc(t.title)}</div><div class="task-meta"><span class="${late?'late':''}">◷ ${t.time||'без времени'}</span>${t.duration?`<span>${t.duration} мин</span>`:''}${p?`<span style="color:${p.color}">▰ ${esc(p.name)}</span>`:''}${t.priority==='high'?'<span class="high">⚑ Высокий</span>':''}${t.recurrence?.type!=='none'?'<span>↻ Повтор</span>':''}${t.reminders?.length?`<span>🔔 ${t.reminders.length}</span>`:''}</div>${t.description?`<div class="task-notes">${esc(t.description)}</div>`:''}</div><button class="menu-btn" onclick="event.stopPropagation();taskMenu('${t.id}','${key}')">⋮</button></article>`}

function renderPlan(){
  const key=state.selectedDate,d=new Date(key+'T12:00:00');
  const days=Array.from({length:21},(_,i)=>addDays(d,i-10));
  const tasks=tasksForDate(key),tx=transactionsForDate(key),workouts=workoutsForDate(key);
  document.querySelector('#plan').innerHTML=`
    <div class="plan-toolbar"><button onclick="moveSelectedDate(-1)">‹</button><button class="today-btn" onclick="selectDate('${dayKey(today)}')">${dateFmt(d,{day:'numeric',month:'long',year:d.getFullYear()!==today.getFullYear()?'numeric':undefined})}</button><button onclick="moveSelectedDate(1)">›</button></div>
    <div class="date-strip" id="date-strip">${days.map(x=>`<button data-date="${dayKey(x)}" class="date-chip ${dayKey(x)===key?'selected':''}" onclick="selectDate('${dayKey(x)}')"><span>${dateFmt(x,{weekday:'short'})}</span><strong>${x.getDate()}</strong></button>`).join('')}</div>
    <div class="view-switch" style="margin:10px 0"><button class="${state.planMode==='agenda'?'active':''}" onclick="setPlanMode('agenda')">Повестка</button><button class="${state.planMode==='month'?'active':''}" onclick="setPlanMode('month')">Месяц</button></div>
    ${state.planMode==='month'?monthCalendar(d):agendaView(key,tasks,tx,workouts)}`;
  requestAnimationFrame(()=>document.querySelector('#date-strip .selected')?.scrollIntoView({behavior:'auto',inline:'center',block:'nearest'}));
}
function agendaView(key,tasks,tx,workouts){return `<div class="section-head"><h3>${titleDate(new Date(key+'T12:00:00'))}</h3><span class="counter">${tasks.length+tx.length+workouts.length}</span></div>${taskList(tasks,key)}${tx.map(x=>transactionCard(x,key)).join('')}${workouts.map(workoutCard).join('')}${!tasks.length&&!tx.length&&!workouts.length?'<div class="card empty">День свободен.</div>':''}`}
function monthCalendar(d){const first=new Date(d.getFullYear(),d.getMonth(),1),start=addDays(first,-((first.getDay()+6)%7));const cells=Array.from({length:42},(_,i)=>addDays(start,i));return `<div class="month-grid">${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(x=>`<div class="dow">${x}</div>`).join('')}${cells.map(x=>{const k=dayKey(x),count=tasksForDate(k).length+transactionsForDate(k).length+workoutsForDate(k).length;return `<button class="month-day ${x.getMonth()!==d.getMonth()?'other':''} ${k===state.selectedDate?'selected':''}" onclick="selectDate('${k}');setPlanMode('agenda')"><span class="num">${x.getDate()}</span><div class="dots">${Array.from({length:Math.min(count,4)},()=>'<i></i>').join('')}</div></button>`}).join('')}</div>`}

function renderAssistant(){document.querySelector('#assistant').innerHTML=`<div class="assistant-wrap"><div class="voice-card"><button class="voice-btn ${voiceListening?'listening':''}" onclick="startVoice()">🎙</button><div><strong>${voiceListening?'Слушаю…':'Голосовой помощник'}</strong><br><small>${native()?'Нажмите и скажите команду':'Голос доступен в APK'}</small></div></div><div class="chips"><button class="chip" onclick="quickCommand('Что у меня сегодня?')">Что сегодня?</button><button class="chip" onclick="quickCommand('Какой баланс?')">Баланс</button><button class="chip" onclick="quickCommand('Что просрочено?')">Просрочено</button></div><div class="chat" id="chat">${state.messages.map(m=>`<div class="bubble ${m.role}">${esc(m.text)}</div>`).join('')}</div><form class="chat-form" id="chat-form"><input id="chat-input" placeholder="Напишите команду…"><button class="send">↑</button></form></div>`;document.querySelector('#chat-form').onsubmit=e=>{e.preventDefault();const i=document.querySelector('#chat-input');quickCommand(i.value);i.value=''};requestAnimationFrame(()=>{const c=document.querySelector('#chat');if(c)c.scrollTop=c.scrollHeight})}

function monthTransactions(month){const [y,m]=month.split('-').map(Number),days=new Date(y,m,0).getDate(),arr=[];for(let i=1;i<=days;i++){const k=`${y}-${pad(m)}-${pad(i)}`;transactionsForDate(k).forEach(tx=>arr.push({...tx,occurrenceDate:k,settled:txSettled(tx,k)}))}return arr}
function accountBalance(id){let total=Number(account(id)?.openingBalance||0);state.transactions.forEach(tx=>{if(tx.account!==id||tx.status!=='actual')return;total+=tx.type==='income'?Number(tx.amount):-Number(tx.amount)});return total}
