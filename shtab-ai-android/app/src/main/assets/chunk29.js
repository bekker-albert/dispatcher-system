(function(){
  const TODAY_KEY_V40=dayKey(today);
  const kindDataV40={
    task:{icon:'✓',name:'Задача',group:'tasks'},
    assignment:{icon:'↗',name:'Поручение',group:'tasks'},
    trip:{icon:'✈',name:'Командировка',group:'trips'},
    event:{icon:'◉',name:'Событие',group:'events'}
  };
  const analyticsNamesV40={tasks:'Задачи',trips:'Командировки',events:'События'};
  const analyticsVerbsV40={tasks:'выполнено',trips:'завершено',events:'проведено'};

  const style=document.createElement('style');
  style.id='v40-styles';
  style.textContent=`
    #finance,[data-page="finance"]{display:none!important}
    .bottom-nav{grid-template-columns:repeat(4,minmax(0,1fr))!important}
    .today-icon-grid.v40{grid-template-columns:repeat(5,minmax(0,1fr));gap:4px}
    .today-icon-grid.v40 .today-icon-stat{min-width:0;padding:5px 0}
    .today-icon-grid.v40 .today-icon-stat i{width:30px;height:30px;margin-bottom:4px}
    .today-icon-grid.v40 .today-icon-stat b{font-size:12px}
    .today-icon-grid.v40 .today-icon-stat small{font-size:8px;overflow:hidden;text-overflow:ellipsis}
    .task-check-v40{width:24px!important;height:24px!important;border-radius:50%!important;border:1.5px solid #697286!important;background:rgba(255,255,255,.025)!important;color:#aeb5c5!important;display:grid!important;place-items:center!important;padding:0!important;font-size:13px!important;font-weight:900!important;line-height:1!important;flex:0 0 auto}
    .task-check-v40.done{background:var(--primary)!important;border-color:var(--primary)!important;color:#fff!important;box-shadow:0 0 0 3px rgba(125,101,255,.12)}
    .important-task-v40{grid-template-columns:24px minmax(0,1fr) 24px!important;gap:9px!important;align-items:center!important}
    .important-mark-v40{width:22px;height:22px;border-radius:8px;display:grid;place-items:center;font-size:15px;font-weight:950;color:#ff8790;background:rgba(255,109,119,.13);border:1px solid rgba(255,109,119,.34)}
    .priority-v40{width:20px;height:20px;border-radius:7px;display:grid;place-items:center;flex:0 0 auto;font-size:11px;font-weight:950;border:1px solid var(--border);background:var(--surface-2);color:var(--muted)}
    .priority-v40.high{font-size:15px;color:#ff8790;border-color:rgba(255,109,119,.34);background:rgba(255,109,119,.13)}
    .priority-v40.normal{color:var(--orange)}
    .analytics-toolbar-v40{display:flex;gap:6px;overflow-x:auto;padding:2px 0 8px;scrollbar-width:none}
    .analytics-toolbar-v40::-webkit-scrollbar{display:none}
    .analytics-toolbar-v40 button{border:1px solid var(--border);background:var(--surface);color:var(--muted);border-radius:11px;padding:8px 11px;white-space:nowrap;font-size:10px;font-weight:850}
    .analytics-toolbar-v40 button.active{background:rgba(125,101,255,.17);border-color:rgba(125,101,255,.5);color:#ddd7ff}
    .analytics-summary-v40{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:4px 0 10px}
    .analytics-summary-card-v40{border:1px solid var(--border);background:linear-gradient(145deg,rgba(39,43,58,.96),rgba(20,23,33,.96));border-radius:16px;padding:11px 8px;min-width:0}
    .analytics-summary-card-v40 small{display:block;color:var(--muted);font-size:9px;line-height:1.25;min-height:23px}
    .analytics-summary-card-v40 strong{display:block;font-size:21px;margin-top:4px;line-height:1}
    .analytics-summary-card-v40 strong.good{color:var(--green)}
    .analytics-summary-card-v40 strong.bad{color:var(--red)}
    .analytics-category-grid-v40{display:grid;gap:8px;margin:0 0 11px}
    .analytics-category-v40{border:1px solid var(--border);background:var(--surface);border-radius:17px;padding:12px;cursor:pointer}
    .analytics-category-v40.active{border-color:rgba(125,101,255,.55);box-shadow:0 0 0 2px rgba(125,101,255,.08)}
    .analytics-category-head-v40{display:grid;grid-template-columns:32px minmax(0,1fr) auto;gap:9px;align-items:center}
    .analytics-category-icon-v40{width:32px;height:32px;border-radius:11px;display:grid;place-items:center;background:rgba(125,101,255,.13);color:var(--primary);font-size:14px;font-weight:900}
    .analytics-category-head-v40 strong{display:block;font-size:13px}.analytics-category-head-v40 small{display:block;color:var(--muted);font-size:9px;margin-top:3px}
    .analytics-category-percent-v40{font-size:19px;font-weight:900}
    .analytics-progress-v40{height:6px;border-radius:10px;background:var(--surface-2);overflow:hidden;margin-top:10px}
    .analytics-progress-v40 span{display:block;height:100%;border-radius:10px;background:linear-gradient(90deg,var(--primary),#55d6ff)}
    .analytics-category-foot-v40{display:flex;justify-content:space-between;gap:8px;color:var(--muted);font-size:9px;margin-top:7px}.analytics-category-foot-v40 .late{color:var(--red)}
    .analytics-trend-v40{border:1px solid var(--border);border-radius:17px;background:var(--surface);padding:12px;margin-bottom:11px}
    .analytics-trend-v40 h3{font-size:13px;margin:0 0 10px}.analytics-bars-v40{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;height:90px;align-items:end}
    .analytics-bar-wrap-v40{height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:5px}.analytics-bar-v40{width:100%;max-width:25px;min-height:4px;border-radius:7px 7px 3px 3px;background:linear-gradient(180deg,#8c72ff,#4a37be)}.analytics-bar-wrap-v40 b{font-size:8px}.analytics-bar-wrap-v40 small{font-size:8px;color:var(--muted)}
    .analytics-completed-v40{border:1px solid var(--border);border-radius:17px;background:var(--surface);overflow:hidden;padding:0 10px}
    .analytics-completed-row-v40{display:grid;grid-template-columns:24px 28px minmax(0,1fr) auto;gap:8px;align-items:center;padding:11px 0;border-bottom:1px solid var(--border)}.analytics-completed-row-v40:last-child{border-bottom:0}
    .analytics-completed-row-v40>i{width:27px;height:27px;border-radius:9px;display:grid;place-items:center;background:var(--surface-2);color:var(--primary);font-style:normal;font-size:11px}.analytics-completed-row-v40>div{min-width:0}.analytics-completed-row-v40 strong{display:block;font-size:12px;line-height:1.3;overflow-wrap:anywhere}.analytics-completed-row-v40 small{display:block;color:var(--muted);font-size:9px;margin-top:4px}.analytics-completed-row-v40>b{font-size:9px;color:var(--green);white-space:nowrap}
    .finance-removed-note-v40{padding:12px;border:1px solid var(--border);border-radius:14px;color:var(--muted);font-size:11px;background:var(--surface)}
    @media(max-width:350px){.analytics-summary-card-v40 strong{font-size:18px}.today-icon-grid.v40 .today-icon-stat small{font-size:7px}}
  `;
  document.head.appendChild(style);

  function kindInfoV40(item){return kindDataV40[item?.kind]||kindDataV40.task}
  function dateLabelV40(value){return dateFmt(value,{day:'2-digit',month:'short',year:'numeric'})}
  function periodLabelV40(item){const start=item.date||TODAY_KEY_V40,end=item.endDate||start;return start===end?dateLabelV40(start):`${dateLabelV40(start)} — ${dateLabelV40(end)}`}
  function timeLabelV40(item){const start=item.startTime||item.time||'',end=item.endTime||'';return start?`${start}${end?`–${end}`:''}`:'Без времени'}
  function checkV40(item,key,extra=''){const done=taskDone(item,key);return `<button type="button" class="task-check task-check-v40 ${done?'done':''} ${extra}" data-complete-task-id="${item.id}" data-complete-key="${key}" aria-label="${done?'Вернуть в работу':'Отметить выполненным'}" onclick="event.stopPropagation();toggleTask('${item.id}','${key}')">✓</button>`}
  function windowV40(title,count,content,actions=''){return `<section class="simple-window-v30"><div class="simple-window-head-v30"><h3>${esc(title)}</h3><div>${count===undefined?'':`<small>${count}</small>`}${actions}</div></div><div class="simple-window-list-v30">${content||'<div class="simple-empty-v30">Записей нет.</div>'}</div></section>`}
  function noteRowV40(item){return `<div class="plan-entry-v30" onclick="openEditor('note','${item.id}')"><span class="plan-entry-icon-v30">✎</span><div class="plan-entry-main-v30"><strong>${esc(item.title)}</strong><small>${esc((item.body||'Без текста').replace(/\s+/g,' ').slice(0,80))}</small></div><span>›</span></div>`}
  function workoutRowV40(item){return `<div class="plan-entry-v30" onclick="openEditor('workout','${item.id}')"><span class="plan-entry-icon-v30">⚡</span><div class="plan-entry-main-v30"><strong>${esc(item.title)}</strong><small>${dateLabelV40(item.date)}${item.time?` · ${item.time}`:''}</small></div><span>›</span></div>`}
  function taskRowV40(item,key){const kind=kindInfoV40(item),priority=item.priority||'normal',priorityIcon=priority==='high'?'!':priority==='low'?'↓':'•';return `<div class="today-record-v30" data-task-id="${item.id}">${checkV40(item,key)}<div class="today-record-main-v30" onclick="openTaskViewV31('${item.id}','${key}')"><div class="today-record-title-v30"><span class="record-kind-v30">${kind.icon}</span><strong>${esc(item.title)}</strong><span class="priority-v40 ${priority}">${priorityIcon}</span></div><div class="today-record-period-v30"><span>▦</span><span>${esc(periodLabelV40(item))}</span></div></div><button type="button" class="menu-btn" onclick="event.stopPropagation();taskMenu('${item.id}','${key}')">⋮</button></div>`}
  function importantRowV40(entry){
    if(entry.kind==='task'){
      const item=state.tasks.find(task=>task.id===entry.id);if(!item)return '';
      return `<div class="plan-entry-v30 important-row-v31 important-task-v40" data-important-task-id="${item.id}" onclick="openTaskViewV31('${item.id}','${TODAY_KEY_V40}')">${checkV40(item,TODAY_KEY_V40,'important-check-v40')}<div class="plan-entry-main-v30"><strong>${esc(item.title)}</strong><small>${esc(periodLabelV40(item))}</small></div><span class="important-mark-v40">!</span></div>`;
    }
    return `<div class="plan-entry-v30 important-row-v31" onclick="${entry.action}"><span class="plan-entry-icon-v30">${entry.urgent?'!':'⚑'}</span><div class="plan-entry-main-v30"><strong>${esc(entry.title)}</strong><small>${esc(entry.meta||'')}</small></div><span>›</span></div>`;
  }

  function removeFinanceUiV40(){
    document.querySelector('[data-page="finance"]')?.remove();
    document.querySelector('#finance')?.setAttribute('hidden','');
    document.querySelectorAll('#quick-dialog [data-create="expense"],#quick-dialog [data-create="income"]').forEach(node=>node.remove());
    const search=document.querySelector('#global-search');if(search)search.placeholder='Задачи, проекты, события, заметки…';
    document.querySelectorAll('#assistant .chip').forEach(button=>{if(/баланс|доход|расход|бюджет|финанс|платеж/i.test(button.textContent))button.remove()});
    document.querySelectorAll('#more .directory-row-v30').forEach(row=>{if(row.querySelector('.directory-name-v30')?.textContent.trim().includes('Финансы'))row.remove()});
  }

  const previousSetPageV40=setPage;
  setPage=function(target){previousSetPageV40(target==='finance'?'analytics':target)};
  window.setPage=setPage;
  const previousUpcomingV40=upcomingItems;
  upcomingItems=function(){return previousUpcomingV40().filter(item=>item.kind!=='finance')};
  window.upcomingItems=upcomingItems;
  const previousSearchV40=globalSearch;
  globalSearch=function(query){return previousSearchV40(query).filter(item=>!/(openEditor\('(income|expense|budget|account|category)'|setPage\('finance')/.test(String(item.action||'')))};
  window.globalSearch=globalSearch;
  const previousQuickCommandV40=quickCommand;
  quickCommand=function(text){if(/баланс|доход|расход|бюджет|финанс|платеж/i.test(String(text||''))){toast('Финансовый модуль убран из приложения');return}return previousQuickCommandV40(text)};
  window.quickCommand=quickCommand;
  const previousAreaOptionsV40=areaOptions;
  areaOptions=function(selected=''){return previousAreaOptionsV40(selected).replace(/<option value="finance"[^>]*>.*?<\/option>/,'')};
  window.areaOptions=areaOptions;

  function renderTodayV40(){
    const all=tasksForDate(TODAY_KEY_V40),important=window.importantItemsV26?window.importantItemsV26():[],importantTaskIds=new Set(important.filter(item=>item.kind==='task').map(item=>item.id));
    const tasks=all.filter(item=>item.kind!=='trip'&&item.kind!=='event'),trips=all.filter(item=>item.kind==='trip'),events=all.filter(item=>item.kind==='event');
    const regular=tasks.concat(events).filter(item=>!importantTaskIds.has(item.id)),regularTrips=trips.filter(item=>!importantTaskIds.has(item.id));
    const completedTasks=tasks.filter(item=>taskDone(item,TODAY_KEY_V40)).length;
    const habits=state.habits.filter(item=>habitDue(item,TODAY_KEY_V40)),habitDoneCount=habits.filter(item=>habitDone(item,TODAY_KEY_V40)).length,workouts=workoutsForDate(TODAY_KEY_V40);
    const notes=state.notes.slice().sort((a,b)=>(Number(b.pinned)-Number(a.pinned))||((b.updatedAt||0)-(a.updatedAt||0))).slice(0,3);
    document.querySelector('#today').innerHTML=`<div class="today-icon-grid v40"><button type="button" class="today-icon-stat" onclick="setPage('analytics');setAnalyticsFocusV40('tasks')"><i>✓</i><b>${completedTasks}/${tasks.length}</b><small>задачи</small></button><button type="button" class="today-icon-stat" onclick="setPage('analytics');setAnalyticsFocusV40('trips')"><i>✈</i><b>${trips.length}</b><small>командировки</small></button><button type="button" class="today-icon-stat" onclick="setPage('analytics');setAnalyticsFocusV40('events')"><i>◉</i><b>${events.length}</b><small>события</small></button><button type="button" class="today-icon-stat" onclick="openMore('sport')"><i>↻</i><b>${habitDoneCount}/${habits.length}</b><small>привычки</small></button><button type="button" class="today-icon-stat" onclick="openMore('sport');setMoreTab('workouts')"><i>⚡</i><b>${workouts.length}</b><small>спорт</small></button></div>${important.length?windowV40('Важное',important.length,important.map(importantRowV40).join('')):''}${windowV40('Заметки',notes.length,notes.map(noteRowV40).join(''),'<button type="button" class="tiny-icon-btn" onclick="openEditor(\'note\')">＋</button>')}${windowV40('Задачи, поручения и события',regular.length,regular.map(item=>taskRowV40(item,TODAY_KEY_V40)).join(''),'<button type="button" class="tiny-icon-btn" onclick="openEditor(\'task\',null,{date:\''+TODAY_KEY_V40+'\'})">＋</button>')}${regularTrips.length?windowV40('Командировки',regularTrips.length,regularTrips.map(item=>taskRowV40(item,TODAY_KEY_V40)).join('')):''}${workouts.length?windowV40('Тренировки',workouts.length,workouts.map(workoutRowV40).join('')):''}`;
  }

  function selectedPlanDateV40(){return state.selectedDate||TODAY_KEY_V40}
  function monthStartV40(){const selected=new Date(`${selectedPlanDateV40()}T12:00:00`);return new Date(selected.getFullYear(),selected.getMonth(),1,12)}
  function monthCalendarV40(){const month=monthStartV40(),start=addDays(month,-((month.getDay()+6)%7)),cells=Array.from({length:42},(_,index)=>addDays(start,index));return `<div class="month-grid compact-month-v31">${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(label=>`<div class="dow">${label}</div>`).join('')}${cells.map(date=>{const key=dayKey(date),count=tasksForDate(key).length+workoutsForDate(key).length;return `<button type="button" class="month-day ${date.getMonth()!==month.getMonth()?'other':''} ${key===selectedPlanDateV40()?'selected':''}" onclick="selectPlanDateV40('${key}')"><span class="num">${date.getDate()}</span><div class="dots">${Array.from({length:Math.min(count,3)},()=>'<i></i>').join('')}</div></button>`}).join('')}</div>`}
  function planTaskRowV40(item,key){const kind=kindInfoV40(item);return `<div class="plan-entry-v30 plan-task-check-v32" data-plan-task-id="${item.id}" onclick="openTaskViewV31('${item.id}','${key}')">${checkV40(item,key,'plan-check-v40')}<span class="plan-entry-icon-v30">${kind.icon}</span><div class="plan-entry-main-v30"><strong>${esc(item.title)}</strong><small>${esc(periodLabelV40(item))} · ${esc(timeLabelV40(item))}</small></div><span>›</span></div>`}
  function selectedDayEntriesV40(){const key=selectedPlanDateV40(),rows=[];tasksForDate(key).forEach(item=>rows.push({sort:item.startTime||item.time||'99:99',html:planTaskRowV40(item,key)}));workoutsForDate(key).forEach(item=>rows.push({sort:item.time||'99:99',html:workoutRowV40(item)}));return rows.sort((a,b)=>a.sort.localeCompare(b.sort)).map(item=>item.html).join('')}
  function renderPlanV40(){const month=monthStartV40(),selected=new Date(`${selectedPlanDateV40()}T12:00:00`),entries=selectedDayEntriesV40();document.querySelector('#plan').innerHTML=`<div class="plan-nav"><button type="button" onclick="movePlanMonthV40(-1)">‹</button><strong>${dateFmt(month,{month:'long',year:'numeric'})}</strong><button type="button" onclick="movePlanMonthV40(1)">›</button></div>${monthCalendarV40()}<section class="simple-window-v30"><div class="simple-window-head-v30"><div><h3>Записи выбранного дня</h3><small class="selected-day-caption-v31">${dateFmt(selected,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</small></div></div><div class="plan-month-list-v30">${entries||'<div class="simple-empty-v30">На выбранную дату записей нет.</div>'}</div></section>`}
  function selectPlanDateV40(key){state.selectedDate=key;save();render()}
  function movePlanMonthV40(step){const selected=new Date(`${selectedPlanDateV40()}T12:00:00`),target=new Date(selected.getFullYear(),selected.getMonth()+step,1,12),last=new Date(target.getFullYear(),target.getMonth()+1,0).getDate(),day=Math.min(selected.getDate(),last);state.selectedDate=dayKey(new Date(target.getFullYear(),target.getMonth(),day,12));save();render()}
  window.selectPlanDateV40=selectPlanDateV40;window.movePlanMonthV40=movePlanMonthV40;

  function analyticsStartV40(period){
    if(period==='all'){
      const dates=state.tasks.map(item=>item.date).filter(Boolean).sort();
      return dates[0]||dayKey(addDays(today,-365));
    }
    return dayKey(addDays(today,-Number(period||30)+1));
  }
  function inRangeV40(key,start,end=TODAY_KEY_V40){return key>=start&&key<=end}
  function itemCompletedV40(item,key){return item.status==='completed'||(item.completedDates||[]).includes(key)||((item.recurrence?.type||'none')==='none'&&(item.completedDates||[]).length>0)}
  function analyticsOccurrencesV40(period){
    const start=analyticsStartV40(period),end=TODAY_KEY_V40,rows=[];
    state.tasks.filter(item=>item.status!=='archived'&&kindInfoV40(item).group).forEach(item=>{
      const recurrence=item.recurrence?.type||'none';
      if(recurrence==='none'){
        const due=item.endDate||item.date||TODAY_KEY_V40;if(!inRangeV40(due,start,end))return;
        rows.push({item,key:item.date||due,due,group:kindInfoV40(item).group,done:itemCompletedV40(item,item.date||due)});
        return;
      }
      let cursor=new Date(`${start}T12:00:00`),finish=new Date(`${end}T12:00:00`),guard=0;
      while(cursor<=finish&&guard<740){const key=dayKey(cursor);if(taskOccursOn(item,key))rows.push({item,key,due:key,group:kindInfoV40(item).group,done:itemCompletedV40(item,key)});cursor=addDays(cursor,1);guard++}
    });
    return rows;
  }
  function metricV40(rows,group){const list=rows.filter(row=>row.group===group),done=list.filter(row=>row.done),late=list.filter(row=>!row.done&&row.due<TODAY_KEY_V40);return {group,total:list.length,done:done.length,late:late.length,pct:list.length?Math.round(done.length/list.length*100):0,rows:list}}
  function analyticsPeriodLabelV40(period){return period==='all'?'за всё время':`за ${period} дней`}
  function analyticsCategoryV40(metric){const icons={tasks:'✓',trips:'✈',events:'◉'},active=(state.analyticsFocusV40||'all')===metric.group;return `<article class="analytics-category-v40 ${active?'active':''}" onclick="setAnalyticsFocusV40('${metric.group}')"><div class="analytics-category-head-v40"><span class="analytics-category-icon-v40">${icons[metric.group]}</span><div><strong>${analyticsNamesV40[metric.group]}</strong><small>${metric.done} ${analyticsVerbsV40[metric.group]} из ${metric.total}</small></div><span class="analytics-category-percent-v40">${metric.pct}%</span></div><div class="analytics-progress-v40"><span style="width:${metric.pct}%"></span></div><div class="analytics-category-foot-v40"><span>Осталось: ${Math.max(0,metric.total-metric.done)}</span><span class="${metric.late?'late':''}">Просрочено: ${metric.late}</span></div></article>`}
  function completionDateV40(row){const dates=(row.item.completedDates||[]).slice().sort();return dates.at(-1)||row.due}
  function completedRowV40(row){const item=row.item,kind=kindInfoV40(item),key=row.key;return `<div class="analytics-completed-row-v40" data-analytics-task-id="${item.id}" onclick="openTaskViewV31('${item.id}','${key}')">${checkV40(item,key,'analytics-check-v40')}<i>${kind.icon}</i><div><strong>${esc(item.title)}</strong><small>${esc(kind.name)} · ${dateLabelV40(completionDateV40(row))}</small></div><b>Готово</b></div>`}
  function trendV40(rows){const days=Array.from({length:7},(_,index)=>addDays(today,index-6)),values=days.map(date=>{const key=dayKey(date);return rows.filter(row=>row.done&&completionDateV40(row)===key).length}),max=Math.max(1,...values);return `<section class="analytics-trend-v40"><h3>Выполнено за последние 7 дней</h3><div class="analytics-bars-v40">${days.map((date,index)=>`<div class="analytics-bar-wrap-v40"><b>${values[index]}</b><span class="analytics-bar-v40" style="height:${Math.max(4,Math.round(values[index]/max*64))}px"></span><small>${dateFmt(date,{weekday:'short'}).replace('.','')}</small></div>`).join('')}</div></section>`}
  function renderAnalyticsV40(){
    const period=state.analyticsPeriodV40||'30',focus=state.analyticsFocusV40||'all',rows=analyticsOccurrencesV40(period),metrics=['tasks','trips','events'].map(group=>metricV40(rows,group)),total=metrics.reduce((sum,item)=>sum+item.total,0),done=metrics.reduce((sum,item)=>sum+item.done,0),late=metrics.reduce((sum,item)=>sum+item.late,0),pct=total?Math.round(done/total*100):0;
    const completed=rows.filter(row=>row.done&&(focus==='all'||row.group===focus)).sort((a,b)=>completionDateV40(b).localeCompare(completionDateV40(a))).slice(0,12);
    document.querySelector('#analytics').innerHTML=`<div class="analytics-toolbar-v40">${[['7','7 дней'],['30','30 дней'],['90','90 дней'],['all','Всё время']].map(([value,label])=>`<button type="button" class="${period===value?'active':''}" onclick="setAnalyticsPeriodV40('${value}')">${label}</button>`).join('')}</div><div class="analytics-summary-v40"><article class="analytics-summary-card-v40"><small>Выполнено ${analyticsPeriodLabelV40(period)}</small><strong class="good">${done}</strong></article><article class="analytics-summary-card-v40"><small>Общий процент выполнения</small><strong>${pct}%</strong></article><article class="analytics-summary-card-v40"><small>Осталось просроченных</small><strong class="${late?'bad':'good'}">${late}</strong></article></div><div class="analytics-toolbar-v40">${[['all','Все'],['tasks','Задачи'],['trips','Командировки'],['events','События']].map(([value,label])=>`<button type="button" class="${focus===value?'active':''}" onclick="setAnalyticsFocusV40('${value}')">${label}</button>`).join('')}</div><div class="analytics-category-grid-v40">${metrics.map(analyticsCategoryV40).join('')}</div>${trendV40(rows)}<div class="section-head"><h3>Последние выполненные</h3><span class="counter">${completed.length}</span></div><div class="analytics-completed-v40">${completed.length?completed.map(completedRowV40).join(''):'<div class="simple-empty-v30">За выбранный период выполненных записей нет.</div>'}</div>`;
  }
  function setAnalyticsPeriodV40(value){state.analyticsPeriodV40=value;save();render()}
  function setAnalyticsFocusV40(value){state.analyticsFocusV40=value;save();if(page!=='analytics')setPage('analytics');else render()}
  window.setAnalyticsPeriodV40=setAnalyticsPeriodV40;window.setAnalyticsFocusV40=setAnalyticsFocusV40;

  function widgetPayloadV40(){
    const todayItems=tasksForDate(TODAY_KEY_V40),open=todayItems.filter(item=>!taskDone(item,TODAY_KEY_V40));
    const tasks=open.filter(item=>kindInfoV40(item).group==='tasks'),trips=open.filter(item=>kindInfoV40(item).group==='trips'),events=open.filter(item=>kindInfoV40(item).group==='events');
    const importantIds=new Set((window.importantItemsV26?window.importantItemsV26():[]).filter(item=>item.kind==='task').map(item=>item.id));open.filter(item=>item.priority==='high').forEach(item=>importantIds.add(item.id));
    return {tasks:tasks.length,trips:trips.length,events:events.length,important:importantIds.size,taskMeta:`${tasks.filter(item=>item.priority==='high').length} важные`,tripMeta:trips.length?'сегодня':'нет',eventMeta:events.length?'сегодня':'нет',importantMeta:importantIds.size?'под контролем':'спокойно',updated:Date.now()};
  }
  function syncShtabWidgetV40(){try{if(typeof Android!=='undefined'&&typeof Android.updateWidget==='function')Android.updateWidget(JSON.stringify(widgetPayloadV40()))}catch(error){console.error(error)}}
  window.syncShtabWidgetV40=syncShtabWidgetV40;
  window.openFromNativeV40=function(target='today',focus=''){setPage(target);if(target==='analytics'&&focus)setAnalyticsFocusV40(focus)};

  const previousSaveV40=save;
  save=function(){previousSaveV40();syncShtabWidgetV40()};
  window.save=save;
  headings.today=['Сегодня','Задачи, события и планы дня'];
  headings.plan=['План','Календарь и записи выбранного дня'];
  headings.analytics=['Аналитика','Выполнение задач, событий и командировок'];

  const previousRenderV40=render;
  render=function(){
    previousRenderV40();
    removeFinanceUiV40();
    if(page==='finance')page='analytics';
    renderTodayV40();renderPlanV40();renderAnalyticsV40();
    document.querySelectorAll('.page').forEach(node=>node.classList.toggle('active',node.id===page));
    document.querySelectorAll('.nav-item').forEach(node=>node.classList.toggle('active',node.dataset.page===page));
    const heading=headings[page]||headings.today;document.querySelector('#page-title').textContent=heading[0];document.querySelector('#page-subtitle').textContent=heading[1];
    if(page==='assistant')document.querySelectorAll('#assistant .chip').forEach(button=>{if(/баланс|доход|расход|бюджет|финанс|платеж/i.test(button.textContent))button.remove()});
    if(page==='more'&&state.moreView==='projects')document.querySelectorAll('#more .directory-row-v30').forEach(row=>{if(row.querySelector('.directory-name-v30')?.textContent.trim().includes('Финансы'))row.remove()});
    const footer=[...document.querySelectorAll('#more p')].find(node=>node.textContent.includes('Штаб AI'));if(footer)footer.textContent='Штаб AI · 4.0.0';
    document.querySelectorAll('button:not([type])').forEach(button=>button.type='button');
    syncShtabWidgetV40();
  };
  window.render=render;
  window.__shtabDiagnostics={...(window.__shtabDiagnostics||{}),uiVersion:()=> '4.0.0',financeVisible:()=>Boolean(document.querySelector('[data-page="finance"]')||!document.querySelector('#finance')?.hidden),analyticsCategoryCount:()=>document.querySelectorAll('#analytics .analytics-category-v40').length,analyticsSummaryCount:()=>document.querySelectorAll('#analytics .analytics-summary-card-v40').length,widgetPayload:()=>widgetPayloadV40(),quickFinanceButtons:()=>document.querySelectorAll('#quick-dialog [data-create="expense"],#quick-dialog [data-create="income"]').length};
  render();
})();
//# sourceURL=chunk29.js
