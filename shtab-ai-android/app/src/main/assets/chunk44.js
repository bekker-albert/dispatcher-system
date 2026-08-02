(function(){
  const TODAY_V470=dayKey(today);
  const DAY_MS_V470=86400000;
  const style=document.createElement('style');
  style.id='v470-plan-time-reminder-styles';
  style.textContent=`
    .task-time-toggle-v470{margin:12px 0 10px!important}.task-time-field-v470[hidden]{display:none!important}
    .reminder-mode-grid-v470{display:grid;grid-template-columns:1fr;gap:9px;margin-bottom:10px}.reminder-days-v470[hidden],.reminder-hours-v470[hidden]{display:none!important}
    .reminder-days-card-v470{display:grid;grid-template-columns:42px minmax(0,1fr) 42px;gap:9px;align-items:center;border:1px solid var(--border);border-radius:16px;background:var(--surface-2);padding:9px}.reminder-days-card-v470 button{width:42px;height:42px;border:1px solid var(--border);border-radius:13px;background:#151823;color:var(--text);font-size:22px;padding:0}.reminder-days-card-v470 input{min-width:0;text-align:center;font-size:18px;font-weight:900;background:transparent;border:0;color:var(--text);padding:8px}.reminder-days-card-v470 input:focus{outline:0}.reminder-preview-v470{display:block;margin-top:9px;padding:8px 10px;border-radius:11px;background:rgba(125,101,255,.09);color:#cfc7ff;font-size:10px;font-weight:850;text-align:center}
    .timer-wheel.reminder-hours-v470{display:block!important}.timer-wheel.reminder-hours-v470>label{display:block!important}.timer-wheel.reminder-hours-v470>label+label{display:none!important}.timer-wheel.reminder-hours-v470>label>span{display:block;margin-bottom:6px;color:var(--muted);font-size:10px}.timer-wheel.reminder-hours-v470 .custom-select-value-v461{font-size:16px!important;font-weight:900!important;letter-spacing:.04em}.timer-wheel.reminder-hours-v470 .custom-select-trigger-v461{min-height:52px!important}
    .plan-view-tabs-v470{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:10px 0 12px}.plan-view-tabs-v470 button{min-height:42px;border:1px solid var(--border);border-radius:13px;background:var(--surface);color:var(--muted);font-size:11px;font-weight:850}.plan-view-tabs-v470 button.active{border-color:rgba(125,101,255,.5);background:rgba(125,101,255,.14);color:#ddd7ff}
    .plan-archive-window-v470{border:1px solid var(--border);border-radius:18px;background:var(--surface);overflow:hidden}.plan-archive-head-v470{padding:13px 14px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center}.plan-archive-head-v470 h3{margin:0;font-size:15px}.plan-archive-head-v470 small{color:var(--muted)}.plan-archive-list-v470{padding:0 13px}.plan-archive-row-v470{display:grid;grid-template-columns:31px minmax(0,1fr) auto;gap:10px;align-items:center;padding:12px 0;border-bottom:1px solid var(--border)}.plan-archive-row-v470:last-child{border-bottom:0}.plan-archive-icon-v470{width:31px;height:31px;border-radius:11px;display:grid;place-items:center;background:rgba(55,207,123,.11);color:#70e8a3;font-size:13px;font-weight:900}.plan-archive-icon-v470.closed{background:rgba(152,160,179,.1);color:#aeb5c5}.plan-archive-main-v470{min-width:0;cursor:pointer}.plan-archive-main-v470 strong{display:block;font-size:12px;line-height:1.35;overflow-wrap:anywhere}.plan-archive-main-v470 small{display:block;color:var(--muted);font-size:9px;line-height:1.4;margin-top:4px}.plan-archive-actions-v470{display:flex;gap:5px}.plan-archive-actions-v470 button{min-height:30px;border:1px solid var(--border);border-radius:10px;background:var(--surface-2);color:var(--muted);font-size:9px;font-weight:800;padding:5px 8px}.plan-archive-status-v470{display:inline-flex;margin-top:5px;padding:3px 6px;border-radius:7px;background:rgba(55,207,123,.1);color:#70e8a3;font-size:8px;font-weight:850}.plan-archive-status-v470.closed{background:rgba(152,160,179,.1);color:#aeb5c5}
    .task-menu-head-v470{display:grid;grid-template-columns:minmax(0,1fr) 36px;gap:10px;align-items:start}.task-menu-head-v470 button{width:36px;height:36px;border:0;border-radius:12px;background:var(--surface-2);color:var(--text);font-size:22px;padding:0}.action-row-v470.close i{background:rgba(255,177,77,.1)!important;color:#ffb14d!important}
    .completed-hidden-v470{display:none!important}
    @media(max-width:350px){.plan-archive-row-v470{grid-template-columns:28px minmax(0,1fr)}.plan-archive-actions-v470{grid-column:2;justify-content:flex-start}.reminder-days-card-v470{grid-template-columns:38px minmax(0,1fr) 38px}.reminder-days-card-v470 button{width:38px;height:38px}}
  `;
  document.head.appendChild(style);

  if(!['active','archive'].includes(state.planArchiveViewV470))state.planArchiveViewV470='active';

  const dateAtNoonV470=value=>new Date(`${value}T12:00:00`);
  const addKeyDaysV470=(key,days)=>dayKey(addDays(dateAtNoonV470(key),days));
  const spanDaysV470=(start,end)=>Math.max(0,Math.round((dateAtNoonV470(end)-dateAtNoonV470(start))/DAY_MS_V470));
  const twoV470=value=>String(Math.max(0,Number(value)||0)).padStart(2,'0');
  const kindV470=item=>({task:['✓','Задача'],assignment:['↗','Поручение'],trip:['✈','Командировка'],event:['◉','Событие']}[item?.kind]||['✓','Задача']);
  const hasTimeV470=item=>item?.timeEnabled!==false&&Boolean(item?.startTime||item?.endTime||item?.time);
  function occurrenceEndKeyV470(item,key){const start=item.date||key,end=item.endDate||start;return key&&key!==start?addKeyDaysV470(key,spanDaysV470(start,end)):end}
  function periodTextV470(item,key=''){
    const start=key||item.date||TODAY_V470,end=occurrenceEndKeyV470(item,key||'');
    const dates=start===end?dateFmt(start,{day:'2-digit',month:'short',year:'numeric'}):`${dateFmt(start,{day:'2-digit',month:'short'})} — ${dateFmt(end,{day:'2-digit',month:'short',year:'numeric'})}`;
    if(!hasTimeV470(item))return `${dates} · без времени`;
    const begin=item.startTime||item.time||'',finish=item.endTime||'';return `${dates}${begin?` · ${begin}${finish?`–${finish}`:''}`:''}`;
  }

  function hourOptionsV470(selected){let html='';for(let value=0;value<=24;value++)html+=`<option value="${value}" ${Number(selected)===value?'selected':''}>${twoV470(value)}</option>`;return html}
  function minuteOptionsV470(selected){let html='';for(let value=0;value<=59;value++)html+=`<option value="${value}" ${Number(selected)===value?'selected':''}>${twoV470(value)}</option>`;return html}
  function reminderModeV470(item,offset){if(item?.reminderMode==='days'||item?.reminderMode==='hours')return item.reminderMode;return offset>=1440&&offset%1440===0?'days':'hours'}

  const previousEditorFieldsV470=editorFields;
  editorFields=function(type,item={},extra={}){
    const html=previousEditorFieldsV470(type,item||{},extra||{});if(type!=='task')return html;
    const template=document.createElement('template');template.innerHTML=html;
    const hasTime=item?.timeEnabled!==undefined?Boolean(item.timeEnabled):Boolean(item?.startTime||item?.endTime||item?.time);
    const periodGrid=template.content.querySelector('.task-period-grid');
    if(periodGrid){
      periodGrid.insertAdjacentHTML('beforebegin',`<label class="check-option task-time-toggle-v470"><input type="checkbox" name="timeEnabled" ${hasTime?'checked':''} onchange="refreshTaskControlsV470()"><span>Указать время начала и окончания</span></label>`);
      ['startTime','endTime'].forEach(name=>{const input=template.content.querySelector(`[name="${name}"]`);if(!input)return;input.required=false;const field=input.closest('label')||input.parentElement;field?.classList.add('task-time-field-v470');if(!hasTime)field?.setAttribute('hidden','')});
    }
    const reminderEnabled=Boolean(item?.reminders?.length),offset=Number(item?.reminders?.[0]??state.settings.defaultReminderOffsets?.[0]??60),mode=reminderModeV470(item,offset),days=Math.max(1,Number(item?.reminderDays||Math.round(offset/1440)||1));
    let hours=mode==='hours'?Math.floor(offset/60):0,minutes=mode==='hours'?offset%60:0;if(hours>24){hours=24;minutes=0}if(hours===24)minutes=0;
    const box=template.content.querySelector('#task-reminder-box'),oldPreview=template.content.querySelector('#task-reminder-preview');
    if(box){
      const timer=box.querySelector('.timer-wheel');if(timer){timer.classList.add('reminder-hours-v470');timer.hidden=mode!=='hours';const h=timer.querySelector('[name="reminderHours"]'),m=timer.querySelector('[name="reminderMinutes"]');if(h)h.innerHTML=hourOptionsV470(hours);if(m)m.innerHTML=minuteOptionsV470(minutes)}
      box.insertAdjacentHTML('afterbegin',`<div class="reminder-mode-grid-v470"><label class="field"><span>Способ напоминания</span><select name="reminderMode" onchange="refreshTaskControlsV470()"><option value="hours" ${mode==='hours'?'selected':''}>За часы и минуты</option><option value="days" ${mode==='days'?'selected':''}>За количество дней</option></select></label></div>`);
      box.insertAdjacentHTML('beforeend',`<div class="reminder-days-v470" ${mode==='days'?'':'hidden'}><span style="display:block;margin:0 0 6px;color:var(--muted);font-size:10px">Количество дней</span><div class="reminder-days-card-v470"><button type="button" onclick="stepReminderDaysV470(-1)">−</button><input type="number" name="reminderDays" min="1" max="365" value="${days}" onchange="refreshTaskControlsV470()"><button type="button" onclick="stepReminderDaysV470(1)">＋</button></div></div><span class="reminder-preview-v470" id="reminder-preview-v470"></span>`);
    }
    oldPreview?.remove();
    const enabled=template.content.querySelector('[name="reminderEnabled"]');if(enabled)enabled.setAttribute('onchange','refreshTaskControlsV470()');
    return template.innerHTML;
  };
  window.editorFields=editorFields;

  function normalizeCombinedTimeV470(){
    const form=document.querySelector('#editor-form');if(!form||editor.type!=='task')return;
    const hours=form.elements.reminderHours,minutes=form.elements.reminderMinutes;if(!hours||!minutes)return;
    if(Number(hours.value)>=24){hours.value='24';minutes.value='0'}
    const hourLabel=hours.closest('label'),minuteLabel=minutes.closest('label');if(hourLabel){hourLabel.querySelector(':scope > span')?.replaceChildren(document.createTextNode('За сколько напомнить'));hourLabel.classList.add('reminder-combined-v470')}if(minuteLabel)minuteLabel.hidden=true;
    const trigger=hourLabel?.querySelector('.custom-select-trigger-v461'),value=trigger?.querySelector('.custom-select-value-v461');if(value)value.textContent=`${twoV470(hours.value)}:${twoV470(minutes.value)}`;if(trigger)trigger.setAttribute('aria-label',`За сколько напомнить: ${twoV470(hours.value)}:${twoV470(minutes.value)}`);
    if(!hours.dataset.v470Bound){hours.dataset.v470Bound='true';[hours,minutes].forEach(select=>{select.addEventListener('change',()=>setTimeout(()=>{normalizeCombinedTimeV470();refreshTaskControlsV470()},0));select.addEventListener('input',()=>setTimeout(normalizeCombinedTimeV470,0))})}
  }
  function enhanceWheelDialogV470(){
    const dialog=document.querySelector('#time-wheel-dialog-v462');if(!dialog||dialog.dataset.v470Enhanced==='true')return;dialog.dataset.v470Enhanced='true';
    const summary=dialog.querySelector('#time-wheel-summary-v462');if(summary)new MutationObserver(()=>{const match=summary.textContent.match(/(\d+)\s*ч\s*(\d+)\s*мин/);if(match)summary.textContent=`${twoV470(match[1])}:${twoV470(match[2])}`}).observe(summary,{childList:true,characterData:true,subtree:true});
    dialog.querySelector('.time-wheel-apply-v462')?.addEventListener('click',()=>{const hour=dialog.querySelector('#time-wheel-hours-v462 .selected')?.dataset.value,minute=dialog.querySelector('#time-wheel-minutes-v462 .selected')?.dataset.value;if(Number(hour)===24&&Number(minute)!==0)dialog.querySelector('#time-wheel-minutes-v462 [data-value="0"]')?.click()},true);
    dialog.addEventListener('close',()=>setTimeout(()=>{normalizeCombinedTimeV470();refreshTaskControlsV470()},0));
  }
  function refreshTaskControlsV470(){
    const form=document.querySelector('#editor-form');if(!form||editor.type!=='task')return;
    const timeEnabled=Boolean(form.elements.timeEnabled?.checked);form.querySelectorAll('.task-time-field-v470').forEach(field=>field.hidden=!timeEnabled);
    const enabled=Boolean(form.elements.reminderEnabled?.checked),box=form.querySelector('#task-reminder-box'),repeat=form.querySelector('#task-repeat-until');if(box)box.hidden=!enabled;if(repeat)repeat.hidden=!enabled;
    const mode=form.elements.reminderMode?.value||'hours',hoursBox=form.querySelector('.reminder-hours-v470'),daysBox=form.querySelector('.reminder-days-v470');if(hoursBox)hoursBox.hidden=mode!=='hours';if(daysBox)daysBox.hidden=mode!=='days';
    const daysInput=form.elements.reminderDays;if(daysInput){daysInput.value=String(Math.max(1,Math.min(365,Number(daysInput.value)||1)))}
    const hours=form.elements.reminderHours,minutes=form.elements.reminderMinutes;if(hours&&minutes&&Number(hours.value)>=24){hours.value='24';minutes.value='0'}
    const preview=form.querySelector('#reminder-preview-v470');if(preview)preview.textContent=mode==='days'?`За ${Number(daysInput?.value||1)} дн.`:`За ${twoV470(hours?.value)}:${twoV470(minutes?.value)}`;
    normalizeCombinedTimeV470();enhanceWheelDialogV470();
  }
  window.refreshTaskControlsV470=refreshTaskControlsV470;
  window.stepReminderDaysV470=step=>{const form=document.querySelector('#editor-form'),input=form?.elements.reminderDays;if(!input)return;input.value=String(Math.max(1,Math.min(365,Number(input.value||1)+Number(step||0))));refreshTaskControlsV470()};

  const previousOpenEditorV470=openEditor;
  openEditor=function(type,id=null,extra=null){previousOpenEditorV470(type,id,extra);setTimeout(()=>{refreshTaskControlsV470();enhanceWheelDialogV470()},20)};
  window.openEditor=openEditor;

  const previousSubmitEditorV470=submitEditor;
  const minutesOfV470=value=>{const match=String(value||'').match(/^(\d{1,2}):(\d{2})$/);return match?Number(match[1])*60+Number(match[2]):0};
  submitEditor=function(form){
    if(editor.type!=='task')return previousSubmitEditorV470(form);
    const fd=new FormData(form),get=key=>String(fd.get(key)||'').trim(),title=get('title'),start=get('date'),end=get('endDate')||start,timeEnabled=Boolean(form.elements.timeEnabled?.checked),startTime=timeEnabled?(get('startTime')||'09:00'):'',endTime=timeEnabled?(get('endTime')||startTime):'';
    if(!title){showEditorError('Введите название.');return}if(!start||!end){showEditorError('Укажите начало и окончание периода.');return}if(end<start){showEditorError('Окончание не может быть раньше начала.');return}if(timeEnabled&&start===end&&minutesOfV470(endTime)<minutesOfV470(startTime)){showEditorError('Время окончания не может быть раньше начала.');return}
    const recurrenceEnd=get('recurrenceEnd');if(recurrenceEnd&&recurrenceEnd<start){showEditorError('Окончание повторов не может быть раньше начала.');return}
    const recurrenceType=get('repeat')||'none',weekday=recurrenceType==='weekday'?Number(get('repeatWeekday')):undefined,recurrence={type:recurrenceType,interval:1};if(recurrenceType==='weekday')recurrence.weekday=Number.isInteger(weekday)?weekday:dateAtNoonV470(start).getDay();
    const reminderEnabled=Boolean(form.elements.reminderEnabled?.checked),reminderMode=get('reminderMode')||'hours',reminderDays=Math.max(1,Math.min(365,Number(get('reminderDays'))||1));let reminderHours=Math.max(0,Math.min(24,Number(get('reminderHours'))||0)),reminderMinutes=Math.max(0,Math.min(59,Number(get('reminderMinutes'))||0));if(reminderHours===24)reminderMinutes=0;const reminderOffset=reminderMode==='days'?reminderDays*1440:reminderHours*60+reminderMinutes;
    const existing=editor.id?state.tasks.find(item=>item.id===editor.id):null,duration=timeEnabled?Math.max(0,minutesOfV470(endTime)-minutesOfV470(startTime)):0;
    const data={kind:get('kind')||'task',title,description:get('description'),date:start,endDate:end,timeEnabled,startTime,endTime,time:startTime,duration,project:get('project'),priority:get('priority')||'normal',tags:existing?.tags||[],subtasks:existing?.subtasks||[],recurrence,recurrenceEnd,reminders:reminderEnabled?[reminderOffset]:[],reminderMode,reminderDays:reminderMode==='days'?reminderDays:undefined,repeatUntilDone:reminderEnabled&&Boolean(form.elements.repeatUntilDone?.checked)};
    if(existing)Object.assign(existing,data);else state.tasks.push({...data,id:uid('task'),status:'active',completedDates:[],createdAt:Date.now()});
    save();closeDialog('editor-dialog');toast('Сохранено');render();
  };
  window.submitEditor=submitEditor;

  const previousSyncNotificationsV470=syncAllNotifications;
  syncAllNotifications=function(){
    const snapshots=state.tasks.map(item=>({item,time:item.time}));state.tasks.forEach(item=>{if(!hasTimeV470(item)&&!item.time)item.time='09:00'});
    try{return previousSyncNotificationsV470()}finally{snapshots.forEach(({item,time})=>{item.time=time})}
  };
  window.syncAllNotifications=syncAllNotifications;

  toggleTask=function(id,key){
    const item=state.tasks.find(task=>task.id===id);if(!item)return;const actualKey=key||item.date||TODAY_V470,done=taskDone(item,actualKey),recurring=(item.recurrence?.type||'none')!=='none';
    item.completedDates=item.completedDates||[];
    if(recurring){item.completedAtByDate=item.completedAtByDate||{};if(done){item.completedDates=item.completedDates.filter(value=>value!==actualKey);delete item.completedAtByDate[actualKey]}else{if(!item.completedDates.includes(actualKey))item.completedDates.push(actualKey);item.completedDates.sort();item.completedAtByDate[actualKey]=Date.now()}}
    else if(done){item.status='active';item.completedDates=[];delete item.completedAt;delete item.archiveReason}
    else{item.status='completed';item.completedDates=[actualKey];item.completedAt=Date.now();item.archiveReason='completed'}
    save();render();toast(done?'Возвращено в работу':'Перемещено в архив плана');
  };
  window.toggleTask=toggleTask;

  function archiveEntriesV470(){
    const rows=[];state.tasks.forEach(item=>{
      const recurring=(item.recurrence?.type||'none')!=='none';
      if(recurring)(item.completedDates||[]).forEach(key=>rows.push({item,key,type:'completed',timestamp:Number(item.completedAtByDate?.[key]||item.completedAt||0)}));
      else if(item.status==='completed'||(item.completedDates||[]).length)rows.push({item,key:(item.completedDates||[])[0]||item.date,type:'completed',timestamp:Number(item.completedAt||0)});
      if(item.status==='archived')rows.push({item,key:item.archivedKey||item.date,type:'closed',timestamp:Number(item.archivedAt||0)});
    });return rows.sort((a,b)=>(b.timestamp-a.timestamp)||String(b.key||'').localeCompare(String(a.key||''))||String(a.item.title||'').localeCompare(String(b.item.title||''),'ru'));
  }
  function archiveRowV470(row){const info=kindV470(row.item),closed=row.type==='closed',click=closed?`openEditor('task','${row.item.id}')`:`openTaskViewV31('${row.item.id}','${row.key}')`;return `<div class="plan-archive-row-v470" data-plan-archive-task-id="${row.item.id}" data-plan-archive-key="${row.key}" data-plan-archive-type="${row.type}"><span class="plan-archive-icon-v470 ${closed?'closed':''}">${closed?'×':info[0]}</span><div class="plan-archive-main-v470" onclick="${click}"><strong>${esc(row.item.title)}</strong><small>${esc(info[1])} · ${esc(periodTextV470(row.item,row.key))}</small><span class="plan-archive-status-v470 ${closed?'closed':''}">${closed?'Закрыто':'Выполнено'}</span></div><div class="plan-archive-actions-v470">${closed?`<button type="button" onclick="restoreTaskV470('${row.item.id}')">Вернуть</button>`:''}<button type="button" onclick="deleteEntity('task','${row.item.id}')">Удалить</button></div></div>`}
  function planTabsV470(){return `<div class="plan-view-tabs-v470"><button type="button" class="${state.planArchiveViewV470==='active'?'active':''}" onclick="setPlanArchiveViewV470('active')">План</button><button type="button" class="${state.planArchiveViewV470==='archive'?'active':''}" onclick="setPlanArchiveViewV470('archive')">Архив</button></div>`}
  function renderPlanArchiveV470(){const root=document.querySelector('#plan'),rows=archiveEntriesV470();root.innerHTML=`${planTabsV470()}<section class="plan-archive-window-v470"><div class="plan-archive-head-v470"><h3>Архив плана</h3><small>${rows.length}</small></div><div class="plan-archive-list-v470">${rows.length?rows.map(archiveRowV470).join(''):'<div class="simple-empty-v30">В архиве пока нет записей.</div>'}</div></section>`}
  function enhanceActivePlanV470(){
    const root=document.querySelector('#plan');if(!root)return;if(!root.querySelector('.plan-view-tabs-v470')){const nav=root.querySelector('.plan-nav');if(nav)nav.insertAdjacentHTML('afterend',planTabsV470());else root.insertAdjacentHTML('afterbegin',planTabsV470())}
    const key=state.selectedDate||TODAY_V470;root.querySelectorAll('[data-plan-task-id]').forEach(row=>{const item=state.tasks.find(task=>task.id===row.dataset.planTaskId);if(item&&(item.status==='completed'||item.status==='archived'||taskDone(item,key)))row.remove()});
    root.querySelectorAll('.month-day').forEach(button=>{const match=(button.getAttribute('onclick')||'').match(/selectPlanDateV40\('([^']+)'/);if(!match)return;const dateKey=match[1],count=tasksForDate(dateKey).filter(item=>item.status!=='completed'&&item.status!=='archived'&&!taskDone(item,dateKey)).length+workoutsForDate(dateKey).filter(item=>item.status!=='completed').length;const dots=button.querySelector('.dots');if(dots)dots.innerHTML=Array.from({length:Math.min(count,3)},()=>'<i></i>').join('')});
    const list=root.querySelector('.plan-month-list-v30');if(list&&!list.querySelector('[data-plan-task-id],.plan-entry-v30'))list.innerHTML='<div class="simple-empty-v30">На выбранную дату открытых записей нет.</div>';
  }
  function enhancePlanV470(){if(page!=='plan')return;if(state.planArchiveViewV470==='archive')renderPlanArchiveV470();else enhanceActivePlanV470()}
  window.setPlanArchiveViewV470=mode=>{state.planArchiveViewV470=mode==='archive'?'archive':'active';save();render()};
  window.restoreTaskV470=id=>{const item=state.tasks.find(task=>task.id===id);if(!item)return;item.status='active';delete item.archivedAt;delete item.archivedKey;delete item.archiveReason;save();render();toast('Возвращено в план')};
  window.closeTaskV470=(id,key='')=>{const item=state.tasks.find(task=>task.id===id);if(!item)return;item.status='archived';item.archivedAt=Date.now();item.archivedKey=key||item.date;item.archiveReason='closed';save();render();toast('Запись закрыта и перемещена в архив')};

  function cleanCompletedTodayV470(){
    const root=document.querySelector('#today');if(!root)return;
    root.querySelectorAll('[data-task-id]').forEach(row=>{const item=state.tasks.find(task=>task.id===row.dataset.taskId);if(item&&taskDone(item,TODAY_V470))row.remove()});
    root.querySelectorAll('[data-important-task-id]').forEach(row=>{const item=state.tasks.find(task=>task.id===row.dataset.importantTaskId);if(item&&taskDone(item,TODAY_V470))row.remove()});
    [...root.children].filter(node=>node.classList?.contains('simple-window-v30')&&!node.classList.contains('upcoming-events-v42')&&!node.hasAttribute('data-today-overdue-v470')).forEach(section=>{const list=section.querySelector('.simple-window-list-v30');if(list&&![...list.children].some(child=>!child.classList.contains('simple-empty-v30')))section.remove()});
  }

  let menuContextV470=null;
  function taskMenuDialogV470(){let dialog=document.querySelector('#task-menu-dialog-v470');if(dialog)return dialog;dialog=document.createElement('dialog');dialog.id='task-menu-dialog-v470';dialog.className='shtab-dialog-v43';dialog.innerHTML=`<div class="shtab-dialog-body-v43"><div class="task-menu-head-v470"><div><div class="shtab-dialog-icon-v43">•••</div><h2>Действия с записью</h2><p id="task-menu-title-v470"></p></div><button type="button" aria-label="Закрыть">×</button></div><div class="action-list-v43"><button type="button" class="action-row-v43" data-action="edit"><i>✎</i><span><strong>Изменить</strong><small>Открыть редактор записи</small></span><span>›</span></button><button type="button" class="action-row-v43" data-action="tomorrow"><i>→</i><span><strong>Перенести на завтра</strong><small>Сдвинуть весь период на один день</small></span><span>›</span></button><button type="button" class="action-row-v43" data-action="copy"><i>⧉</i><span><strong>Создать копию</strong><small>Добавить отдельную запись</small></span><span>›</span></button><button type="button" class="action-row-v43 action-row-v470 close" data-action="close"><i>□</i><span><strong>Закрыть</strong><small>Убрать запись в архив без отметки выполнения</small></span><span>›</span></button><button type="button" class="action-row-v43 danger" data-action="delete"><i>×</i><span><strong>Удалить</strong><small>Удалить запись из приложения</small></span><span>›</span></button></div></div>`;dialog.querySelector('.task-menu-head-v470 button').onclick=()=>dialog.close();dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});dialog.querySelectorAll('[data-action]').forEach(button=>button.onclick=()=>runTaskMenuActionV470(button.dataset.action));document.body.appendChild(dialog);return dialog}
  function runTaskMenuActionV470(action){const context=menuContextV470,dialog=taskMenuDialogV470();dialog.close();if(!context)return;const item=state.tasks.find(task=>task.id===context.id);if(!item)return;if(action==='edit')return openEditor('task',item.id);if(action==='tomorrow'){const old=item.date,next=dayKey(addDays(new Date((context.key||old)+'T12:00:00'),1)),delta=(dateAtNoonV470(next)-dateAtNoonV470(old))/DAY_MS_V470;item.date=next;if(item.endDate)item.endDate=addKeyDaysV470(item.endDate,delta);save();render();toast('Перенесено на завтра');return}if(action==='copy'){state.tasks.push({...JSON.parse(JSON.stringify(item)),id:uid('task'),title:item.title+' — копия',completedDates:[],completedAtByDate:{},status:'active',createdAt:Date.now()});save();render();toast('Копия создана');return}if(action==='close')return window.closeTaskV470(item.id,context.key);if(action==='delete')return deleteEntity('task',item.id)}
  taskMenu=function(id,key=''){const item=state.tasks.find(task=>task.id===id);if(!item)return;menuContextV470={id,key};const dialog=taskMenuDialogV470();dialog.querySelector('#task-menu-title-v470').textContent=item.title||'Без названия';try{if(!dialog.open)dialog.showModal()}catch{dialog.setAttribute('open','')}};
  window.taskMenu=taskMenu;

  function queueEnhanceV470(){requestAnimationFrame(()=>{refreshTaskControlsV470();enhanceWheelDialogV470()})}
  new MutationObserver(queueEnhanceV470).observe(document.documentElement,{childList:true,subtree:true});
  const previousRenderV470=render;
  render=function(){previousRenderV470();enhancePlanV470();if(page==='today')cleanCompletedTodayV470();queueEnhanceV470();const footer=[...document.querySelectorAll('#more p')].find(node=>node.textContent.includes('Штаб AI'));if(footer)footer.textContent='Штаб AI · 4.7.0'};
  window.render=render;
  headings.plan=['План','Календарь, открытые записи и архив'];
  window.__shtabDiagnostics={...(window.__shtabDiagnostics||{}),uiVersion:()=> '4.7.0',archiveEntriesV470:()=>archiveEntriesV470().map(row=>({id:row.item.id,key:row.key,type:row.type})),planArchiveViewV470:()=>state.planArchiveViewV470,reminderPreviewV470:()=>document.querySelector('#reminder-preview-v470')?.textContent||'',timeEnabledV470:()=>Boolean(document.querySelector('#editor-form')?.elements.timeEnabled?.checked),wheelSummaryV470:()=>document.querySelector('#time-wheel-summary-v462')?.textContent||''};
  render();
})();
//# sourceURL=chunk44.js
