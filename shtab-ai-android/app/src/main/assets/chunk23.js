(function(){
  const TODAY_KEY=dayKey(today);

  const preserved=window.__v28PreservedTaskDetails||{};
  let restored=false;
  state.tasks.forEach(task=>{
    const old=preserved[task.id];
    if(!old)return;
    if(!(task.tags||[]).length&&(old.tags||[]).length){task.tags=JSON.parse(JSON.stringify(old.tags));restored=true}
    if(!(task.subtasks||[]).length&&(old.subtasks||[]).length){task.subtasks=JSON.parse(JSON.stringify(old.subtasks));restored=true}
  });
  if(restored)localStorage.setItem(STORAGE,JSON.stringify(state));

  const style=document.createElement('style');
  style.id='v29-styles';
  style.textContent=`
    .today-section-v29{margin:12px 0 15px;border:1px solid var(--border);border-radius:17px;background:var(--surface);overflow:hidden}
    .today-section-head-v29{display:grid;grid-template-columns:30px minmax(0,1fr) auto;gap:9px;align-items:center;padding:10px 11px;border-bottom:1px solid var(--border);background:rgba(255,255,255,.012)}
    .today-section-head-v29>i{width:29px;height:29px;border-radius:10px;display:grid;place-items:center;background:var(--surface-2);color:var(--primary);font-style:normal;font-size:13px}
    .today-section-head-v29 h3{font-size:14px;line-height:1.2;margin:0}.today-section-head-v29 small{display:block;color:var(--muted);font-size:9px;margin-top:2px}
    .today-section-actions-v29{display:flex;gap:5px}.today-section-actions-v29 button{width:29px;height:29px;border:1px solid var(--border);border-radius:10px;background:var(--surface-2);color:var(--primary);padding:0;font-size:15px}
    .record-list-v29{padding:0 10px}.record-list-v29>.record-row-v29:last-child{border-bottom:0}
    .record-row-v29{display:grid;grid-template-columns:29px minmax(0,1fr) 27px;gap:9px;align-items:start;padding:10px 0;border-bottom:1px solid var(--border)}
    .record-row-v29 .task-check{width:23px;height:23px;margin:2px 0 0 3px;border-radius:8px;flex:0 0 auto}
    .record-main-v29{min-width:0;cursor:pointer}.record-title-line-v29{display:flex;align-items:flex-start;gap:7px;min-width:0}
    .record-type-v29{width:25px;height:25px;border-radius:9px;display:grid;place-items:center;flex:0 0 auto;font-size:12px;font-weight:900;background:rgba(125,101,255,.13);color:var(--primary)}
    .record-type-v29.assignment{background:rgba(64,200,232,.12);color:var(--cyan)}.record-type-v29.trip{background:rgba(255,173,77,.13);color:var(--orange)}.record-type-v29.event{background:rgba(55,207,123,.12);color:var(--green)}
    .record-title-v29{font-size:13px;line-height:1.28;font-weight:790;white-space:normal;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;flex:1;min-width:0;padding-top:3px}
    .record-priority-v29{height:22px;min-width:22px;border-radius:8px;padding:0 6px;display:inline-flex;align-items:center;justify-content:center;gap:4px;border:1px solid var(--border);background:var(--surface-2);font-size:10px;font-weight:900;flex:0 0 auto}
    .record-priority-v29.high{color:var(--red);border-color:rgba(255,109,119,.28);background:rgba(255,109,119,.09)}.record-priority-v29.normal{color:var(--orange)}.record-priority-v29.low{color:var(--muted)}
    .record-priority-v29 em{font-style:normal;font-size:8px;font-weight:800}
    .record-meta-v29{display:flex;flex-wrap:wrap;gap:5px;margin:7px 0 0 32px}.record-meta-v29 span{display:inline-flex;align-items:center;gap:4px;min-height:22px;padding:3px 7px;border-radius:8px;background:var(--surface-2);color:var(--muted);font-size:9px;line-height:1.2;max-width:100%}.record-meta-v29 span b{color:var(--primary);font-size:10px}.record-meta-v29 .period{color:var(--text)}
    .record-description-v29{margin:7px 0 0 32px;color:#bec3d0;font-size:10px;line-height:1.38;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .record-menu-v29{border:0;background:transparent;color:var(--muted);font-size:20px;line-height:1;padding:2px 1px 0}
    .record-row-v29.done{opacity:.66}.record-row-v29.done .record-title-v29{text-decoration:line-through}
    .record-card-v29{padding:11px 10px;margin-bottom:9px;display:grid;grid-template-columns:31px minmax(0,1fr) 27px;gap:9px;align-items:start}.record-card-v29 .record-meta-v29,.record-card-v29 .record-description-v29{margin-left:32px}
    .important-row-v29{display:grid;grid-template-columns:29px minmax(0,1fr) auto;gap:9px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer}.important-row-v29:last-child{border-bottom:0}.important-icon-v29{width:27px;height:27px;border-radius:9px;display:grid;place-items:center;background:rgba(255,173,77,.12);color:var(--orange);font-weight:900}.important-row-v29.urgent .important-icon-v29{background:rgba(255,109,119,.12);color:var(--red)}.important-row-v29 strong{display:block;font-size:12px;line-height:1.28}.important-row-v29 small{display:block;color:var(--muted);font-size:9px;margin-top:3px}.important-row-v29>span:last-child{color:var(--muted)}
    .simple-row-v29{display:grid;grid-template-columns:29px minmax(0,1fr) auto;gap:9px;align-items:center;padding:9px 0;border-bottom:1px solid var(--border);cursor:pointer}.simple-row-v29:last-child{border-bottom:0}.simple-row-v29>i{width:27px;height:27px;border-radius:9px;display:grid;place-items:center;background:var(--surface-2);color:var(--primary);font-style:normal;font-size:11px}.simple-row-v29 strong{display:block;font-size:12px;line-height:1.25;white-space:normal;overflow-wrap:anywhere}.simple-row-v29 small{display:block;color:var(--muted);font-size:9px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.simple-row-v29>b{font-size:10px;white-space:nowrap}
    .plan-week-day-v29{margin:11px 0 14px}.plan-week-head-v29{display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:9px;align-items:center;margin:0 2px 7px}.plan-week-head-v29 .plan-day-number{width:34px;height:34px}.plan-week-head-v29 strong{display:block;font-size:13px}.plan-week-head-v29 small{display:block;color:var(--muted);font-size:9px;margin-top:2px}
    .plan-day-card-v29{border:1px solid var(--border);border-radius:16px;background:var(--surface);overflow:hidden}.plan-day-card-v29 .record-list-v29{padding:0 10px}
    @media(max-width:360px){.record-priority-v29 em{display:none}.record-meta-v29 span{padding:3px 5px}.today-section-head-v29{grid-template-columns:28px minmax(0,1fr) auto}}
  `;
  document.head.appendChild(style);

  function typeInfo(kind){return {task:{icon:'✓',name:'Задача'},assignment:{icon:'↗',name:'Поручение'},trip:{icon:'✈',name:'Командировка'},event:{icon:'◉',name:'Событие'}}[kind]||{icon:'✓',name:'Задача'}}
  function priorityInfo(value){return value==='high'?{icon:'!',label:'Важно',cls:'high'}:value==='low'?{icon:'↓',label:'Низкая',cls:'low'}:{icon:'•',label:'Обычная',cls:'normal'}}
  function taskPeriodV29(task){const start=task.date||TODAY_KEY,end=task.endDate||start;if(start===end)return dateFmt(start,{day:'numeric',month:'short',year:new Date(start+'T12:00:00').getFullYear()!==today.getFullYear()?'numeric':undefined});return `${dateFmt(start,{day:'numeric',month:'short'})} — ${dateFmt(end,{day:'numeric',month:'short',year:'numeric'})}`}
  function taskTimeV29(task){const start=task.startTime||task.time||'',end=task.endTime||'';if(!start&&!end)return 'Без времени';return `${start||'—'}${end?`–${end}`:''}`}
  function taskRecordV29(task,key,{card=false}={}){
    const done=taskDone(task,key),type=typeInfo(task.kind),priority=priorityInfo(task.priority),p=project(task.project);
    return `<article class="${card?'card record-card-v29':'record-row-v29'} ${done?'done':''}" data-task-record="${task.id}">
      <button type="button" class="task-check" aria-label="${done?'Вернуть в работу':'Отметить выполненным'}" onclick="toggleTask('${task.id}','${key}')">${done?'✓':''}</button>
      <div class="record-main-v29" onclick="openEditor('task','${task.id}')">
        <div class="record-title-line-v29"><span class="record-type-v29 ${task.kind||'task'}" title="${type.name}">${type.icon}</span><strong class="record-title-v29">${esc(task.title)}</strong><span class="record-priority-v29 ${priority.cls}" title="${priority.label} важность"><b>${priority.icon}</b><em>${priority.label}</em></span></div>
        <div class="record-meta-v29"><span class="period"><b>▦</b>${esc(taskPeriodV29(task))}</span><span><b>◷</b>${esc(taskTimeV29(task))}</span>${p?`<span style="color:${p.color}"><b>▰</b>${esc(p.name)}</span>`:''}${task.reminders?.length?'<span><b>◴</b>Напоминание</span>':''}</div>
        ${task.description?`<div class="record-description-v29">${esc(task.description)}</div>`:''}
      </div>
      <button type="button" class="record-menu-v29" aria-label="Действия" onclick="event.stopPropagation();taskMenu('${task.id}','${key}')">⋮</button>
    </article>`;
  }

  taskCard=function(task,key){return taskRecordV29(task,key,{card:true})};
  window.taskCard=taskCard;

  function sectionHeadV29(icon,title,count,actions=[]){return `<div class="today-section-head-v29"><i>${icon}</i><div><h3>${esc(title)}</h3><small>${count===undefined?'':`${count} записей`}</small></div><div class="today-section-actions-v29">${actions.map(action=>`<button type="button" aria-label="${esc(action.label)}" title="${esc(action.label)}" onclick="${action.onclick}">${action.icon}</button>`).join('')}</div></div>`}
  function noteRowV29(note){return `<div class="simple-row-v29" onclick="openEditor('note','${note.id}')"><i>${note.pinned?'◆':'✎'}</i><div><strong>${esc(note.title)}</strong><small>${esc((note.body||'Без текста').replace(/\s+/g,' ').slice(0,100))}</small></div><b>›</b></div>`}
  function transactionRowV29(item,key){const title=item.type==='income'?(item.sourceName||item.note||'Доход'):(category(item.category)?.name||item.note||'Расход');return `<div class="simple-row-v29" onclick="openEditor('${item.type}','${item.id}')"><i>${item.type==='income'?'+':'−'}₸</i><div><strong>${esc(title)}</strong><small>${txSettled(item,key)?(item.type==='income'?'Получено':'Оплачено'):'Запланировано'} · ${dateFmt(key,{day:'numeric',month:'short'})}</small></div><b class="${item.type==='income'?'positive':'negative'}">${item.type==='income'?'+':'−'}${money(item.amount)}</b></div>`}
  function workoutRowV29(item){return `<div class="simple-row-v29" onclick="openEditor('workout','${item.id}')"><i>⚡</i><div><strong>${esc(item.title)}</strong><small>${item.time||'без времени'} · ${item.duration||0} мин</small></div><b>›</b></div>`}
  function importantRowsV29(){const items=window.importantItemsV26?window.importantItemsV26():[];return items.map(item=>`<div class="important-row-v29 ${item.urgent?'urgent':''}" onclick="${item.action}"><span class="important-icon-v29">${item.urgent?'!':'⚑'}</span><div><strong>${esc(item.title)}</strong><small>${esc(item.meta)}</small></div><span>›</span></div>`).join('')}

  function renderTodayV29(){
    const key=TODAY_KEY,tasks=tasksForDate(key),done=tasks.filter(task=>taskDone(task,key)).length,habits=state.habits.filter(habit=>habitDue(habit,key)),habitDoneCount=habits.filter(habit=>habitDone(habit,key)).length,transactions=transactionsForDate(key),workouts=workoutsForDate(key),notes=state.notes.slice().sort((a,b)=>(Number(b.pinned)-Number(a.pinned))||((b.updatedAt||0)-(a.updatedAt||0))).slice(0,3),important=importantRowsV29();
    document.querySelector('#today').innerHTML=`<div class="today-icon-grid"><button type="button" class="today-icon-stat" onclick="setPage('plan')"><i>✓</i><b>${done}/${tasks.length}</b><small>задачи</small></button><button type="button" class="today-icon-stat" onclick="setPage('finance')"><i>₸</i><b>${transactions.filter(item=>item.type==='expense'&&!txSettled(item,key)).length}</b><small>платежи</small></button><button type="button" class="today-icon-stat" onclick="openMore('sport')"><i>↻</i><b>${habitDoneCount}/${habits.length}</b><small>привычки</small></button><button type="button" class="today-icon-stat" onclick="openMore('sport');setMoreTab('workouts')"><i>⚡</i><b>${workouts.length}</b><small>спорт</small></button></div>
      ${important?`<section class="today-section-v29">${sectionHeadV29('!','Важное',undefined)}<div class="record-list-v29">${important}</div></section>`:''}
      <section class="today-section-v29">${sectionHeadV29('✓','Задачи, поручения и события',tasks.length,[{icon:'＋',label:'Добавить запись',onclick:`openEditor('task',null,{date:'${key}'})`}])}<div class="record-list-v29">${tasks.length?tasks.map(task=>taskRecordV29(task,key)).join(''):'<div class="plan-empty-line">На сегодня записей нет.</div>'}</div></section>
      <section class="today-section-v29">${sectionHeadV29('✎','Заметки',notes.length,[{icon:'＋',label:'Добавить заметку',onclick:"openEditor('note')"},{icon:'›',label:'Все заметки',onclick:"openMore('notes')"}])}<div class="record-list-v29">${notes.length?notes.map(noteRowV29).join(''):'<div class="plan-empty-line">Заметок пока нет.</div>'}</div></section>
      <section class="today-section-v29">${sectionHeadV29('₸','Финансы',transactions.length,[{icon:'−',label:'Добавить расход',onclick:`openEditor('expense',null,{date:'${key}'})`},{icon:'＋',label:'Добавить доход',onclick:`openEditor('income',null,{date:'${key}'})`}])}<div class="record-list-v29">${transactions.length?transactions.map(item=>transactionRowV29(item,key)).join(''):'<div class="plan-empty-line">Операций сегодня нет.</div>'}</div></section>
      ${workouts.length?`<section class="today-section-v29">${sectionHeadV29('⚡','Тренировки',workouts.length,[{icon:'＋',label:'Добавить тренировку',onclick:`openEditor('workout',null,{date:'${key}'})`}])}<div class="record-list-v29">${workouts.map(workoutRowV29).join('')}</div></section>`:''}`;
  }

  function startOfWeekV29(key){const date=new Date(`${key}T12:00:00`),offset=(date.getDay()+6)%7;return addDays(date,-offset)}
  function planRowsV29(key){const tasks=tasksForDate(key),transactions=transactionsForDate(key),workouts=workoutsForDate(key);return tasks.map(task=>taskRecordV29(task,key)).join('')+transactions.map(item=>transactionRowV29(item,key)).join('')+workouts.map(workoutRowV29).join('')}
  function dayBlockV29(date){const key=dayKey(date),count=tasksForDate(key).length+transactionsForDate(key).length+workoutsForDate(key).length;return `<section class="plan-week-day-v29 ${key===TODAY_KEY?'today':''}"><div class="plan-week-head-v29"><span class="plan-day-number">${date.getDate()}</span><div><strong>${dateFmt(date,{weekday:'long'})}</strong><small>${dateFmt(date,{month:'long',year:'numeric'})} · ${count} записей</small></div><button type="button" class="tiny-icon-btn" aria-label="Добавить запись" onclick="openEditor('task',null,{date:'${key}'})">＋</button></div><div class="plan-day-card-v29"><div class="record-list-v29">${count?planRowsV29(key):'<div class="plan-empty-line">План свободен.</div>'}</div></div></section>`}
  function monthV29(){const selected=new Date(`${state.selectedDate||TODAY_KEY}T12:00:00`),first=new Date(selected.getFullYear(),selected.getMonth(),1,12),start=addDays(first,-((first.getDay()+6)%7)),cells=Array.from({length:42},(_,index)=>addDays(start,index));return `<div class="month-grid">${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(label=>`<div class="dow">${label}</div>`).join('')}${cells.map(date=>{const key=dayKey(date),count=tasksForDate(key).length+transactionsForDate(key).length+workoutsForDate(key).length;return `<button type="button" class="month-day ${date.getMonth()!==selected.getMonth()?'other':''} ${key===TODAY_KEY?'selected':''}" onclick="selectPlanDateV28('${key}')"><span class="num">${date.getDate()}</span><div class="dots">${Array.from({length:Math.min(count,4)},()=>'<i></i>').join('')}</div></button>`}).join('')}</div>`}
  function periodDatesV29(){const start=new Date(`${state.planPeriodStart}T12:00:00`),end=new Date(`${state.planPeriodEnd}T12:00:00`),days=[];for(let date=new Date(start),guard=0;date<=end&&guard<367;date=addDays(date,1),guard++)days.push(new Date(date));return days}
  function periodV29(){const content=periodDatesV29().map(date=>{const key=dayKey(date),count=tasksForDate(key).length+transactionsForDate(key).length+workoutsForDate(key).length;return count?dayBlockV29(date):''}).join('');return `<div class="period-picker"><label>Начало периода<input type="date" value="${state.planPeriodStart}" onchange="setPlanPeriodV28('start',this.value)"></label><label>Окончание периода<input type="date" value="${state.planPeriodEnd}" onchange="setPlanPeriodV28('end',this.value)"></label></div>${content||'<div class="card empty">В выбранном периоде записей нет.</div>'}`}
  function planLabelV29(){const selected=new Date(`${state.selectedDate||TODAY_KEY}T12:00:00`);if(state.planView==='month')return dateFmt(selected,{month:'long',year:'numeric'});const start=startOfWeekV29(state.selectedDate||TODAY_KEY),end=addDays(start,6);return `${dateFmt(start,{day:'numeric',month:'short'})} — ${dateFmt(end,{day:'numeric',month:'short',year:'numeric'})}`}
  function renderPlanV29(){const nav=state.planView==='period'?'':`<div class="plan-nav"><button type="button" onclick="movePlanV28(-1)">‹</button><strong>${esc(planLabelV29())}</strong><button type="button" onclick="movePlanV28(1)">›</button></div>`;let content='';if(state.planView==='month')content=monthV29();else if(state.planView==='period')content=periodV29();else{const start=startOfWeekV29(state.selectedDate||TODAY_KEY);content=Array.from({length:7},(_,index)=>dayBlockV29(addDays(start,index))).join('')}document.querySelector('#plan').innerHTML=`<div class="plan-view-tabs"><button type="button" class="${state.planView==='week'?'active':''}" onclick="setPlanViewV28('week')">Неделя</button><button type="button" class="${state.planView==='month'?'active':''}" onclick="setPlanViewV28('month')">Месяц</button><button type="button" class="${state.planView==='period'?'active':''}" onclick="setPlanViewV28('period')">Период</button></div>${nav}${content}`}

  const previousSubmitV29=submitEditor;
  submitEditor=function(form){
    if(editor.type!=='task')return previousSubmitV29(form);
    const id=editor.id,existing=id?state.tasks.find(task=>task.id===id):null,details=existing?{tags:JSON.parse(JSON.stringify(existing.tags||[])),subtasks:JSON.parse(JSON.stringify(existing.subtasks||[]))}:null;
    previousSubmitV29(form);
    if(details&&id){const task=state.tasks.find(item=>item.id===id);if(task){task.tags=details.tags;task.subtasks=details.subtasks;save();render()}}
  };
  window.submitEditor=submitEditor;

  const previousRenderV29=render;
  render=function(){previousRenderV29();renderTodayV29();renderPlanV29();document.querySelectorAll('button:not([type])').forEach(button=>button.type='button')};
  window.render=render;
  window.__shtabDiagnostics={...(window.__shtabDiagnostics||{}),recordHierarchy:()=>({records:document.querySelectorAll('[data-task-record]').length,priorities:document.querySelectorAll('.record-priority-v29').length,periods:document.querySelectorAll('.record-meta-v29 .period').length,typeIcons:document.querySelectorAll('.record-type-v29').length}),taskHiddenDetails:id=>{const task=state.tasks.find(item=>item.id===id);return task?JSON.parse(JSON.stringify({tags:task.tags||[],subtasks:task.subtasks||[]})):null}};
  delete window.__v28PreservedTaskDetails;
  headings.today=['Сегодня','Важное видно сразу'];headings.plan=['План','Записи с периодом и приоритетом'];
  render();
})();
//# sourceURL=chunk23.js
