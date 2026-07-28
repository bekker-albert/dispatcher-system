(function(){
  const TODAY_KEY=dayKey(today);
  const style=document.createElement('style');
  style.id='v31-styles';
  style.textContent=`
    .task-check-v31{width:24px!important;height:24px!important;border-radius:50%!important;border:1.5px solid #7f8799!important;background:transparent!important;color:#fff!important;display:grid!important;place-items:center!important;padding:0!important;font-size:13px!important;font-weight:900!important;line-height:1!important;transition:.16s ease}
    .task-check-v31.done{background:var(--primary)!important;border-color:var(--primary)!important;box-shadow:0 0 0 3px rgba(125,101,255,.12)}
    .priority-mark-v31{width:20px;height:20px;border-radius:7px;display:grid;place-items:center;flex:0 0 auto;font-size:11px;font-weight:950;border:1px solid var(--border);background:var(--surface-2);color:var(--muted)}
    .priority-mark-v31.high{font-size:15px;color:#ff8790;border-color:rgba(255,109,119,.34);background:rgba(255,109,119,.13);line-height:1}
    .priority-mark-v31.normal{color:var(--orange)}.priority-mark-v31.low{color:var(--muted)}
    .important-row-v31{cursor:pointer}.important-row-v31 .plan-entry-icon-v30{font-size:15px;font-weight:950;color:var(--red);background:rgba(255,109,119,.13)}
    #plan .month-grid{gap:3px;padding:3px 0 5px}
    #plan .month-grid .dow{font-size:9px;padding:4px 0}
    #plan .month-day{min-height:43px;border-radius:10px;padding:4px;font-size:11px}
    #plan .month-day .num{font-size:11px}
    #plan .month-day .dots{gap:2px;margin-top:5px;min-height:4px}
    #plan .month-day .dots i{width:4px;height:4px}
    #plan .plan-nav{grid-template-columns:34px 1fr 34px;margin-bottom:6px}
    #plan .plan-nav button{height:34px;border-radius:10px}
    .selected-day-caption-v31{display:block;color:var(--muted);font-size:10px;margin-top:3px;text-transform:capitalize}
    #task-view-dialog-v31{width:min(calc(100% - 22px),430px);padding:0;overflow:hidden;border-radius:24px}
    #task-view-dialog-v31::backdrop{background:rgba(0,0,0,.72);backdrop-filter:blur(4px)}
    .task-view-v31{padding:17px}.task-view-head-v31{display:flex;align-items:flex-start;gap:10px}.task-view-head-v31>div{flex:1;min-width:0}
    .task-view-kind-v31{display:inline-flex;align-items:center;gap:6px;color:var(--primary);font-size:11px;font-weight:850;margin-bottom:6px}
    .task-view-head-v31 h2{font-size:20px;line-height:1.28;margin:0;overflow-wrap:anywhere}.task-view-close-v31{width:36px;height:36px;border:0;border-radius:12px;background:var(--surface-2);font-size:22px;padding:0}
    .task-view-badges-v31{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.task-view-badge-v31{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--border);border-radius:10px;padding:6px 8px;background:var(--surface-2);font-size:10px;font-weight:800;color:var(--muted)}
    .task-view-badge-v31.high{color:#ff8790;border-color:rgba(255,109,119,.3);background:rgba(255,109,119,.1)}
    .task-view-details-v31{margin-top:14px;border:1px solid var(--border);border-radius:15px;overflow:hidden}.task-view-detail-v31{display:grid;grid-template-columns:92px minmax(0,1fr);gap:10px;padding:10px 11px;border-top:1px solid var(--border);font-size:12px}.task-view-detail-v31:first-child{border-top:0}.task-view-detail-v31 span{color:var(--muted)}.task-view-detail-v31 strong{font-weight:750;overflow-wrap:anywhere}
    .task-view-description-v31{margin-top:13px;padding:12px;border-radius:14px;background:var(--surface-2);font-size:12px;line-height:1.48;color:#c8cdd8;white-space:pre-wrap}
    .task-view-actions-v31{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:15px}.task-view-actions-v31 button{border:0;border-radius:13px;padding:12px;font-weight:850}.task-view-cancel-v31{background:var(--surface-2)}.task-view-edit-v31{background:var(--primary);color:#fff}
  `;
  document.head.appendChild(style);

  const kindMapV31={task:{icon:'✓',name:'Задача'},assignment:{icon:'↗',name:'Поручение'},trip:{icon:'✈',name:'Командировка'},event:{icon:'◉',name:'Событие'}};
  const priorityMapV31={high:{icon:'!',name:'Важно'},normal:{icon:'•',name:'Обычная'},low:{icon:'↓',name:'Низкая'}};
  function kindInfoV31(item){return kindMapV31[item?.kind]||kindMapV31.task}
  function priorityInfoV31(item){return priorityMapV31[item?.priority]||priorityMapV31.normal}
  function dateLabelV31(value){return dateFmt(value,{day:'2-digit',month:'short',year:'numeric'})}
  function periodLabelV31(item){const start=item.date||TODAY_KEY,end=item.endDate||start;return start===end?dateLabelV31(start):`${dateLabelV31(start)} — ${dateLabelV31(end)}`}
  function timeLabelV31(item){const start=item.startTime||item.time||'',end=item.endTime||'';return start?`${start}${end?`–${end}`:''}`:'Не указано'}
  function reminderLabelV31(item){const values=Array.isArray(item.reminders)?item.reminders:[];if(!values.length)return 'Нет';const value=Number(values[0]||0),hours=Math.floor(value/60),minutes=value%60;return `${hours?`${hours} ч `:''}${minutes?`${minutes} мин`:hours?'':'0 мин'} до начала${values.length>1?` · ещё ${values.length-1}`:''}`}

  let taskViewContextV31=null;
  function ensureTaskViewDialogV31(){
    let dialog=document.querySelector('#task-view-dialog-v31');if(dialog)return dialog;
    dialog=document.createElement('dialog');dialog.id='task-view-dialog-v31';
    dialog.innerHTML=`<div class="task-view-v31"><div class="task-view-head-v31"><div><div class="task-view-kind-v31" id="task-view-kind-v31"></div><h2 id="task-view-title-v31"></h2><div class="task-view-badges-v31" id="task-view-badges-v31"></div></div><button type="button" class="task-view-close-v31" aria-label="Закрыть">×</button></div><div class="task-view-details-v31" id="task-view-details-v31"></div><div class="task-view-description-v31" id="task-view-description-v31" hidden></div><div class="task-view-actions-v31"><button type="button" class="task-view-cancel-v31">Закрыть</button><button type="button" class="task-view-edit-v31">✎ Изменить</button></div></div>`;
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
    dialog.querySelector('.task-view-close-v31').onclick=()=>dialog.close();dialog.querySelector('.task-view-cancel-v31').onclick=()=>dialog.close();dialog.querySelector('.task-view-edit-v31').onclick=editTaskFromViewV31;
    document.body.appendChild(dialog);return dialog;
  }
  function openTaskViewV31(id,key=''){
    const item=state.tasks.find(task=>task.id===id);if(!item)return;
    taskViewContextV31={id,key:key||item.date||TODAY_KEY};const dialog=ensureTaskViewDialogV31(),kind=kindInfoV31(item),priority=priorityInfoV31(item),projectItem=project(item.project),done=taskDone(item,taskViewContextV31.key);
    dialog.querySelector('#task-view-kind-v31').innerHTML=`<span>${kind.icon}</span><span>${esc(kind.name)}</span>`;dialog.querySelector('#task-view-title-v31').textContent=item.title||'Без названия';
    dialog.querySelector('#task-view-badges-v31').innerHTML=`<span class="task-view-badge-v31 ${item.priority==='high'?'high':''}">${priority.icon} ${esc(priority.name)}</span><span class="task-view-badge-v31">${done?'✓ Выполнено':'○ В работе'}</span>`;
    const details=[['Период',periodLabelV31(item)],['Время',timeLabelV31(item)]];if(projectItem)details.push(['Проект',projectItem.name]);if(item.reminders?.length)details.push(['Напоминание',reminderLabelV31(item)]);
    dialog.querySelector('#task-view-details-v31').innerHTML=details.map(([label,value])=>`<div class="task-view-detail-v31"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('');
    const description=String(item.description||'').trim(),descriptionNode=dialog.querySelector('#task-view-description-v31');descriptionNode.hidden=!description;descriptionNode.textContent=description;
    try{if(!dialog.open)dialog.showModal()}catch{dialog.setAttribute('open','')}
  }
  function editTaskFromViewV31(){const context=taskViewContextV31,dialog=document.querySelector('#task-view-dialog-v31');try{dialog?.close()}catch{dialog?.removeAttribute('open')}if(context)setTimeout(()=>openEditor('task',context.id),70)}
  window.openTaskViewV31=openTaskViewV31;window.editTaskFromViewV31=editTaskFromViewV31;

  function taskCheckV31(item,key){const done=taskDone(item,key);return `<button type="button" class="task-check task-check-v31 ${done?'done':''}" aria-label="${done?'Вернуть в работу':'Отметить выполненным'}" onclick="event.stopPropagation();toggleTask('${item.id}','${key}')">${done?'✓':''}</button>`}
  function todayTaskRowV31(item,key){const kind=kindInfoV31(item),priority=priorityInfoV31(item);return `<div class="today-record-v30" data-task-id="${item.id}">${taskCheckV31(item,key)}<div class="today-record-main-v30" onclick="openTaskViewV31('${item.id}','${key}')"><div class="today-record-title-v30"><span class="record-kind-v30">${kind.icon}</span><strong>${esc(item.title)}</strong><span class="priority-mark-v31 ${item.priority||'normal'}" title="${esc(priority.name)}">${priority.icon}</span></div><div class="today-record-period-v30"><span>▦</span><span>${esc(periodLabelV31(item))}</span></div></div><button type="button" class="menu-btn" onclick="event.stopPropagation();taskMenu('${item.id}','${key}')">⋮</button></div>`}
  function simpleNoteV31(item){return `<div class="plan-entry-v30" onclick="openEditor('note','${item.id}')"><span class="plan-entry-icon-v30">✎</span><div class="plan-entry-main-v30"><strong>${esc(item.title)}</strong><small>${esc((item.body||'Без текста').replace(/\s+/g,' ').slice(0,80))}</small></div><span>›</span></div>`}
  function simpleTransactionV31(item,key){const title=item.type==='income'?(item.sourceName||item.note||'Доход'):(category(item.category)?.name||item.note||'Расход');return `<div class="plan-entry-v30" onclick="openEditor('${item.type}','${item.id}')"><span class="plan-entry-icon-v30">${item.type==='income'?'+':'−'}₸</span><div class="plan-entry-main-v30"><strong>${esc(title)}</strong><small>${dateLabelV31(key)} · ${txSettled(item,key)?(item.type==='income'?'Получено':'Оплачено'):'Запланировано'}</small></div><span class="${item.type==='income'?'positive':'negative'}">${item.type==='income'?'+':'−'}${money(item.amount)}</span></div>`}
  function simpleWorkoutV31(item){return `<div class="plan-entry-v30" onclick="openEditor('workout','${item.id}')"><span class="plan-entry-icon-v30">⚡</span><div class="plan-entry-main-v30"><strong>${esc(item.title)}</strong><small>${dateLabelV31(item.date)}${item.time?` · ${item.time}`:''}</small></div><span>›</span></div>`}
  function windowV31(title,count,content,actions=''){return `<section class="simple-window-v30"><div class="simple-window-head-v30"><h3>${esc(title)}</h3><div>${count===undefined?'':`<small>${count}</small>`}${actions}</div></div><div class="simple-window-list-v30">${content||'<div class="simple-empty-v30">Записей нет.</div>'}</div></section>`}
  function importantRowV31(item){if(item.kind==='task'){const task=state.tasks.find(row=>row.id===item.id);if(!task)return '';return `<div class="plan-entry-v30 important-row-v31" data-important-task-id="${task.id}" onclick="openTaskViewV31('${task.id}','${TODAY_KEY}')"><span class="plan-entry-icon-v30">!</span><div class="plan-entry-main-v30"><strong>${esc(task.title)}</strong><small>${esc(periodLabelV31(task))}</small></div><span>›</span></div>`}return `<div class="plan-entry-v30 important-row-v31" onclick="${item.action}"><span class="plan-entry-icon-v30">${item.urgent?'!':'⚑'}</span><div class="plan-entry-main-v30"><strong>${esc(item.title)}</strong><small>${esc(item.meta||'')}</small></div><span>›</span></div>`}
  function renderTodayV31(){
    const all=tasksForDate(TODAY_KEY),important=window.importantItemsV26?window.importantItemsV26():[],importantTaskIds=new Set(important.filter(item=>item.kind==='task').map(item=>item.id));
    const allTrips=all.filter(item=>item.kind==='trip'),allRegular=all.filter(item=>item.kind!=='trip'),trips=allTrips.filter(item=>!importantTaskIds.has(item.id)),regular=allRegular.filter(item=>!importantTaskIds.has(item.id)),done=allRegular.filter(item=>taskDone(item,TODAY_KEY)).length;
    const habits=state.habits.filter(item=>habitDue(item,TODAY_KEY)),habitDoneCount=habits.filter(item=>habitDone(item,TODAY_KEY)).length,transactions=transactionsForDate(TODAY_KEY),workouts=workoutsForDate(TODAY_KEY),notes=state.notes.slice().sort((a,b)=>(Number(b.pinned)-Number(a.pinned))||((b.updatedAt||0)-(a.updatedAt||0))).slice(0,3),importantHtml=important.map(importantRowV31).join('');
    document.querySelector('#today').innerHTML=`<div class="today-icon-grid v30"><button type="button" class="today-icon-stat" onclick="setPage('plan')"><i>✓</i><b>${done}/${allRegular.length}</b><small>задачи</small></button><button type="button" class="today-icon-stat" onclick="setPage('analytics');setAnalyticsSectionV27('trips')"><i>✈</i><b>${allTrips.length}</b><small>командировки</small></button><button type="button" class="today-icon-stat" onclick="setPage('finance')"><i>₸</i><b>${transactions.filter(item=>item.type==='expense'&&!txSettled(item,TODAY_KEY)).length}</b><small>платежи</small></button><button type="button" class="today-icon-stat" onclick="openMore('sport')"><i>↻</i><b>${habitDoneCount}/${habits.length}</b><small>привычки</small></button><button type="button" class="today-icon-stat" onclick="openMore('sport');setMoreTab('workouts')"><i>⚡</i><b>${workouts.length}</b><small>спорт</small></button></div>${importantHtml?windowV31('Важное',important.length,importantHtml):''}${windowV31('Заметки',notes.length,notes.map(simpleNoteV31).join(''),'<button type="button" class="tiny-icon-btn" onclick="openEditor(\'note\')">＋</button>')}${windowV31('Задачи, поручения и события',regular.length,regular.map(item=>todayTaskRowV31(item,TODAY_KEY)).join(''),'<button type="button" class="tiny-icon-btn" onclick="openEditor(\'task\',null,{date:\''+TODAY_KEY+'\'})">＋</button>')}${trips.length?windowV31('Командировки',trips.length,trips.map(item=>todayTaskRowV31(item,TODAY_KEY)).join('')):''}${windowV31('Финансы',transactions.length,transactions.map(item=>simpleTransactionV31(item,TODAY_KEY)).join(''))}${workouts.length?windowV31('Тренировки',workouts.length,workouts.map(simpleWorkoutV31).join('')):''}`;
  }

  function selectedDateV31(){return state.selectedDate||TODAY_KEY}
  function monthStartV31(){const selected=new Date(`${selectedDateV31()}T12:00:00`);return new Date(selected.getFullYear(),selected.getMonth(),1,12)}
  function monthCalendarV31(){const month=monthStartV31(),start=addDays(month,-((month.getDay()+6)%7)),cells=Array.from({length:42},(_,index)=>addDays(start,index));return `<div class="month-grid compact-month-v31">${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(label=>`<div class="dow">${label}</div>`).join('')}${cells.map(date=>{const key=dayKey(date),count=tasksForDate(key).length+transactionsForDate(key).length+workoutsForDate(key).length;return `<button type="button" class="month-day ${date.getMonth()!==month.getMonth()?'other':''} ${key===selectedDateV31()?'selected':''}" onclick="selectPlanDateV31('${key}')"><span class="num">${date.getDate()}</span><div class="dots">${Array.from({length:Math.min(count,3)},()=>'<i></i>').join('')}</div></button>`}).join('')}</div>`}
  function planTaskRowV31(item,key){const kind=kindInfoV31(item),priority=priorityInfoV31(item);return `<div class="plan-entry-v30" data-plan-task-id="${item.id}" onclick="openTaskViewV31('${item.id}','${key}')"><span class="plan-entry-icon-v30">${kind.icon}</span><div class="plan-entry-main-v30"><strong>${esc(item.title)}</strong><small>${esc(periodLabelV31(item))} · ${esc(timeLabelV31(item))} · ${esc(priority.name)}</small></div><span>›</span></div>`}
  function selectedDayEntriesV31(){const key=selectedDateV31(),rows=[];tasksForDate(key).forEach(item=>rows.push({sort:item.startTime||item.time||'99:99',html:planTaskRowV31(item,key)}));transactionsForDate(key).forEach(item=>rows.push({sort:item.time||'99:99',html:simpleTransactionV31(item,key)}));workoutsForDate(key).forEach(item=>rows.push({sort:item.time||'99:99',html:simpleWorkoutV31(item)}));return rows.sort((a,b)=>a.sort.localeCompare(b.sort)).map(item=>item.html).join('')}
  function renderPlanV31(){const month=monthStartV31(),selected=new Date(`${selectedDateV31()}T12:00:00`),entries=selectedDayEntriesV31();document.querySelector('#plan').innerHTML=`<div class="plan-nav"><button type="button" onclick="movePlanMonthV31(-1)">‹</button><strong>${dateFmt(month,{month:'long',year:'numeric'})}</strong><button type="button" onclick="movePlanMonthV31(1)">›</button></div>${monthCalendarV31()}<section class="simple-window-v30"><div class="simple-window-head-v30"><div><h3>Записи выбранного дня</h3><small class="selected-day-caption-v31">${dateFmt(selected,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</small></div></div><div class="plan-month-list-v30">${entries||'<div class="simple-empty-v30">На выбранную дату записей нет.</div>'}</div></section>`}
  function selectPlanDateV31(key){state.selectedDate=key;save();render()}
  function movePlanMonthV31(step){const selected=new Date(`${selectedDateV31()}T12:00:00`),targetMonth=new Date(selected.getFullYear(),selected.getMonth()+step,1,12),lastDay=new Date(targetMonth.getFullYear(),targetMonth.getMonth()+1,0).getDate(),day=Math.min(selected.getDate(),lastDay);state.selectedDate=dayKey(new Date(targetMonth.getFullYear(),targetMonth.getMonth(),day,12));save();render()}
  window.selectPlanDateV31=selectPlanDateV31;window.movePlanMonthV31=movePlanMonthV31;

  taskCard=function(item,key){const done=taskDone(item,key),kind=kindInfoV31(item),priority=priorityInfoV31(item),projectItem=project(item.project);return `<article class="card task record-card-v29 ${done?'done':''}" data-task-record="${item.id}">${taskCheckV31(item,key)}<div class="record-main-v29" onclick="openTaskViewV31('${item.id}','${key}')"><div class="record-title-line-v29"><span class="record-type-v29 ${item.kind||'task'}">${kind.icon}</span><span class="record-title-v29">${esc(item.title)}</span><span class="priority-mark-v31 ${item.priority||'normal'}">${priority.icon}</span></div><div class="record-meta-v29"><span class="period">▦ ${esc(periodLabelV31(item))}</span><span>◷ ${esc(timeLabelV31(item))}</span>${projectItem?`<span>▰ ${esc(projectItem.name)}</span>`:''}</div>${item.description?`<div class="record-description-v29">${esc(item.description)}</div>`:''}</div><button type="button" class="menu-btn" onclick="event.stopPropagation();taskMenu('${item.id}','${key}')">⋮</button></article>`};
  window.taskCard=taskCard;

  function patchTaskOpenersV31(root){if(!root)return;root.querySelectorAll('[onclick]').forEach(node=>{const code=node.getAttribute('onclick')||'',match=code.match(/openEditor\('task','([^']+)'\)/);if(match&&!node.closest('#editor-dialog'))node.setAttribute('onclick',`openTaskViewV31('${match[1]}')`)})}
  const previousGlobalSearchV31=globalSearch;
  globalSearch=function(query){return previousGlobalSearchV31(query).map(item=>{const match=String(item.action||'').match(/openEditor\('task','([^']+)'\)/);return match?{...item,action:`openTaskViewV31('${match[1]}')`}:item})};window.globalSearch=globalSearch;

  headings.plan=['План','Календарь и записи выбранного дня'];
  const previousRenderV31=render;
  render=function(){previousRenderV31();renderTodayV31();renderPlanV31();patchTaskOpenersV31(document.querySelector('#analytics'));if(page==='more')patchTaskOpenersV31(document.querySelector('#more'));const footer=[...document.querySelectorAll('#more p')].find(node=>node.textContent.includes('Штаб AI'));if(footer)footer.textContent='Штаб AI · 3.1.0';document.querySelectorAll('button:not([type])').forEach(button=>button.type='button')};
  window.render=render;
  window.__shtabDiagnostics={...(window.__shtabDiagnostics||{}),uiVersion:()=> '3.1.0',importantTaskDuplicates:()=>{const important=new Set([...document.querySelectorAll('#today [data-important-task-id]')].map(node=>node.dataset.importantTaskId));return [...document.querySelectorAll('#today [data-task-id]')].filter(node=>important.has(node.dataset.taskId)).length},selectedPlanDate:()=>selectedDateV31(),taskViewOpen:()=>Boolean(document.querySelector('#task-view-dialog-v31')?.open)};
  render();
})();
//# sourceURL=chunk27.js
