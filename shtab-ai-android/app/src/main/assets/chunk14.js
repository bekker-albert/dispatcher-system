(function(){
  let migrationChanged=false;

  function normalizeV24Data(){
    state.tasks=state.tasks.map(task=>{
      const next={...task};
      next.kind=next.kind||'task';
      next.date=next.date||dayKey(today);
      next.endDate=next.endDate||next.date;
      next.recurrenceEnd=next.recurrenceEnd||'';
      if(next.endDate<next.date)next.endDate=next.date;
      return next;
    });

    const modern=[],legacy=[];
    state.budgets.forEach(budget=>{
      if(Array.isArray(budget.allocations)&&budget.amount!==undefined)modern.push({
        ...budget,
        id:budget.id||uid('budget'),
        month:budget.month||state.financeMonth,
        name:budget.name||'Основной бюджет',
        amount:Number(budget.amount||0),
        allocations:budget.allocations.map(row=>({category:row.category,amount:Number(row.amount||0)})).filter(row=>row.category)
      });
      else if(budget&&budget.category)legacy.push(budget);
    });
    if(legacy.length){
      const groups=new Map();
      legacy.forEach(item=>{
        const month=item.month||state.financeMonth;
        if(!groups.has(month))groups.set(month,[]);
        groups.get(month).push({category:item.category,amount:Number(item.limit||0)});
      });
      groups.forEach((allocations,month)=>{
        modern.push({id:uid('budget'),month,name:'Перенесённый бюджет',amount:allocations.reduce((s,x)=>s+x.amount,0),allocations});
      });
      migrationChanged=true;
    }
    if(legacy.length||modern.length!==state.budgets.length)state.budgets=modern;
  }
  normalizeV24Data();

  const style=document.createElement('style');
  style.id='v24-styles';
  style.textContent=`
    .today-compact-summary{display:flex;align-items:center;gap:11px;padding:11px 12px;margin:8px 0 10px;min-height:56px}
    .today-compact-icon{width:34px;height:34px;border-radius:11px;background:rgba(125,101,255,.15);display:grid;place-items:center;color:var(--primary);font-weight:900;flex:0 0 auto}
    .today-compact-summary>div{min-width:0;flex:1}
    .today-compact-summary small{display:block;color:var(--muted);font-size:11px;margin-bottom:2px}
    .today-compact-summary strong{display:block;font-size:14px;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .today-compact-summary span{font-size:11px;color:var(--muted);white-space:nowrap}
    .task-kind{font-weight:700;color:var(--primary)}
    .task-period{color:var(--muted)}
    .profile-entry{cursor:pointer}
    .profile-entry .profile-chevron{font-size:22px;color:var(--muted);margin-left:8px}
    .budget-summary{padding:15px;margin:10px 0 14px}
    .budget-summary .budget-main{font-size:28px;font-weight:900;margin:4px 0 10px}
    .budget-kpis{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .budget-kpi{background:var(--surface-2);border-radius:13px;padding:10px}
    .budget-kpi small{display:block;color:var(--muted);font-size:10px;margin-bottom:4px}
    .budget-kpi strong{font-size:14px}
    .allocation-list{display:flex;flex-direction:column;gap:8px;margin-top:12px}
    .allocation-card{border:1px solid var(--border);border-radius:14px;padding:11px;background:var(--surface-2)}
    .allocation-card .allocation-line{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}
    .allocation-card .allocation-meta{font-size:11px;color:var(--muted);margin-top:5px}
    .allocation-card .progress{margin-top:8px}
    .budget-editor-note{padding:10px 11px;border-radius:12px;background:rgba(64,200,232,.09);font-size:12px;color:var(--muted);line-height:1.4;margin:8px 0 12px}
    .budget-allocation-list{display:flex;flex-direction:column;gap:8px;margin-top:8px}
    .budget-allocation-row{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(90px,.8fr) 38px;gap:7px;align-items:end}
    .budget-allocation-row label{margin:0}
    .budget-allocation-row button{height:42px;border:1px solid var(--border);border-radius:12px;background:var(--surface-2);color:var(--red);font-size:19px}
    .budget-add-row{width:100%;margin-top:9px}
    .budget-new-category{display:grid;grid-template-columns:1fr auto;gap:7px;margin-top:12px;padding-top:12px;border-top:1px solid var(--border)}
    .budget-new-category input{min-width:0}
    .budget-new-category button{white-space:nowrap}
    @media(max-width:360px){
      .budget-allocation-row{grid-template-columns:1fr 100px 36px}
      .budget-new-category{grid-template-columns:1fr}
    }
  `;
  document.head.appendChild(style);

  const taskKindLabels={task:'Задача',assignment:'Поручение',trip:'Командировка',event:'Событие'};
  function taskKindOptions(value='task'){
    return Object.entries(taskKindLabels).map(([key,label])=>`<option value="${key}" ${value===key?'selected':''}>${label}</option>`).join('');
  }
  function periodLabel(task){
    const start=task.date||dayKey(today),end=task.endDate||start;
    if(end===start)return dateFmt(start,{day:'2-digit',month:'2-digit'});
    return `${dateFmt(start,{day:'2-digit',month:'2-digit'})}–${dateFmt(end,{day:'2-digit',month:'2-digit',year:'numeric'})}`;
  }

  function recentNotesV24(){
    return state.notes.slice().sort((a,b)=>(Number(b.pinned)-Number(a.pinned))||((b.updatedAt||0)-(a.updatedAt||0))).slice(0,4);
  }
  function todayNotesHtmlV24(){
    const notes=recentNotesV24();
    if(!notes.length)return `<article class="card today-note empty-note"><div><strong>Заметок пока нет</strong><p>Запишите мысль, номер, идею или важную информацию.</p></div><button type="button" class="mini-btn" onclick="openEditor('note')">＋</button></article>`;
    return notes.map(note=>`<article class="card today-note" onclick="openEditor('note','${note.id}')"><div class="row-between"><h4>${esc(note.title)}</h4>${note.pinned?'<span class="note-pin">◆</span>':''}</div><p>${esc(note.body||'Без текста')}</p></article>`).join('');
  }

  const previousTaskOccursOn=taskOccursOn;
  taskOccursOn=function(task,key){
    if(task.status==='archived')return false;
    const start=task.date||dayKey(today),end=task.endDate||start;
    const recurrence=task.recurrence?.type||'none';
    if(recurrence==='none')return key>=start&&key<=end;
    if(task.recurrenceEnd&&key>task.recurrenceEnd)return false;
    return previousTaskOccursOn(task,key);
  };
  window.taskOccursOn=taskOccursOn;

  const previousEditorFields=editorFields;
  editorFields=function(type,item={},extra={}){
    if(type==='task'){
      const task=item||{},reminders=task.reminders||state.settings.defaultReminderOffsets;
      const start=task.date||state.selectedDate||dayKey(today),end=task.endDate||start;
      return `${sel('kind','Тип записи',taskKindOptions(task.kind||'task'))}
        ${f('title','Название',task.title||'','text','required placeholder="Что нужно сделать?"')}
        ${ta('description','Описание и детали',task.description||'')}
        <div class="field-row">${f('date','Начало периода',start,'date','required')}${f('endDate','Окончание периода',end,'date','required')}</div>
        <div class="field-row">${f('time','Время',task.time||'18:00','time')}${f('duration','Длительность в день, минут',task.duration||30,'number','min="0"')}</div>
        <div class="field-row">${sel('priority','Приоритет',`<option value="low" ${task.priority==='low'?'selected':''}>Низкий</option><option value="normal" ${!task.priority||task.priority==='normal'?'selected':''}>Обычный</option><option value="high" ${task.priority==='high'?'selected':''}>Высокий</option>`)}${sel('project','Проект',projectOptions(task.project||extra?.project||''))}</div>
        ${f('tags','Метки через запятую',(task.tags||[]).join(', '))}
        <div class="field-row">${sel('repeat','Повтор',repeatOptions(task.recurrence?.type||'none'))}${f('recurrenceEnd','Повторять до',task.recurrenceEnd||'','date')}</div>
        <label class="field"><span>Напоминания</span>${reminderGrid(reminders)}</label>
        <label class="check-option" style="margin-top:12px"><input type="checkbox" name="repeatUntilDone" ${task.repeatUntilDone?'checked':''}><span>Повторять сигнал после срока, пока не выполнено</span></label>
        ${ta('subtasks','Подзадачи — по одной в строку',(task.subtasks||[]).map(s=>typeof s==='string'?s:s.title).join('\n'),4)}`;
    }
    if(type==='budget'){
      const budget=item||{},allocations=Array.isArray(budget.allocations)?budget.allocations:[];
      return `${f('name','Название бюджета',budget.name||'Основной бюджет','text','required')}
        <div class="field-row">${f('month','Месяц',budget.month||state.financeMonth,'month','required')}${f('amount','Общий бюджет, ₸',budget.amount||'','number','required min="0" step="0.01"')}</div>
        <div class="budget-editor-note">Укажите весь доступный бюджет, затем распределите его между статьями расходов. Суммы можно менять в любой момент — это и есть перераспределение.</div>
        <label class="field"><span>Распределение по статьям</span><div id="budget-allocation-list" class="budget-allocation-list">${allocations.map(row=>budgetAllocationRow(row)).join('')}</div></label>
        <button type="button" class="secondary budget-add-row" onclick="addBudgetAllocationRow()">＋ Добавить статью расходов</button>
        <div class="budget-new-category"><input id="budget-new-category-name" type="text" placeholder="Новая статья расходов"><button type="button" class="mini-btn" onclick="addBudgetCategoryInline()">Создать статью</button></div>`;
    }
    return previousEditorFields(type,item||{},extra||{});
  };
  window.editorFields=editorFields;

  function budgetAllocationRow(row={}){
    const id=uid('allocation');
    return `<div class="budget-allocation-row" data-allocation-id="${id}">
      ${sel('allocationCategory','Статья',categoryOptions('expense',row.category||''))}
      ${f('allocationAmount','Сумма, ₸',row.amount||'','number','min="0" step="0.01"')}
      <button type="button" aria-label="Удалить строку" onclick="this.closest('.budget-allocation-row').remove()">×</button>
    </div>`;
  }
  function addBudgetAllocationRow(row={}){
    const list=document.querySelector('#budget-allocation-list');if(!list)return;
    list.insertAdjacentHTML('beforeend',budgetAllocationRow(row));
  }
  window.addBudgetAllocationRow=addBudgetAllocationRow;

  function refreshBudgetCategorySelects(selectedByIndex=[]){
    document.querySelectorAll('#budget-allocation-list select[name=allocationCategory]').forEach((select,index)=>{
      const selected=selectedByIndex[index]||select.value;
      select.innerHTML=categoryOptions('expense',selected);
      select.value=selected;
    });
  }
  function addBudgetCategoryInline(){
    const input=document.querySelector('#budget-new-category-name'),name=String(input?.value||'').trim();
    if(!name){toast('Введите название статьи');input?.focus();return}
    const existing=state.categories.find(c=>c.type==='expense'&&c.name.toLowerCase()===name.toLowerCase());
    const selected=[...document.querySelectorAll('#budget-allocation-list select[name=allocationCategory]')].map(x=>x.value);
    const categoryId=existing?.id||uid('cat');
    if(!existing)state.categories.push({id:categoryId,name,type:'expense',color:'#ffad4d'});
    if(input)input.value='';
    refreshBudgetCategorySelects(selected);
    addBudgetAllocationRow({category:categoryId,amount:0});
    localStorage.setItem(STORAGE,JSON.stringify(state));
    toast(existing?'Статья уже существует':'Статья добавлена');
  }
  window.addBudgetCategoryInline=addBudgetCategoryInline;

  function readBudgetAllocations(form){
    const map=new Map();
    form.querySelectorAll('.budget-allocation-row').forEach(row=>{
      const categoryId=row.querySelector('[name=allocationCategory]')?.value||'';
      const amount=Number(row.querySelector('[name=allocationAmount]')?.value||0);
      if(!categoryId)return;
      map.set(categoryId,(map.get(categoryId)||0)+Math.max(0,amount));
    });
    return [...map.entries()].map(([category,amount])=>({category,amount}));
  }

  const previousSubmitEditor=submitEditor;
  submitEditor=function(form){
    if(editor.type==='task'){
      const fd=new FormData(form),get=key=>String(fd.get(key)||'').trim(),num=key=>Number(fd.get(key)||0);
      const title=get('title'),start=get('date'),end=get('endDate')||start;
      if(!title){showEditorError('Введите название.');return}
      if(!start){showEditorError('Укажите начало периода.');return}
      if(end<start){showEditorError('Окончание не может быть раньше начала.');return}
      const recurrenceEnd=get('recurrenceEnd');
      if(recurrenceEnd&&recurrenceEnd<start){showEditorError('Дата окончания повторов не может быть раньше начала.');return}
      const existing=editor.id?state.tasks.find(x=>x.id===editor.id):null;
      const lines=get('subtasks').split('\n').map(x=>x.trim()).filter(Boolean);
      const data={
        kind:get('kind')||'task',title,description:get('description'),date:start,endDate:end,
        time:get('time')||'18:00',duration:num('duration'),project:get('project'),priority:get('priority')||'normal',
        tags:get('tags').split(',').map(x=>x.trim()).filter(Boolean),
        recurrence:{type:get('repeat')||'none',interval:1},recurrenceEnd,
        reminders:checkedReminders(form),repeatUntilDone:form.elements.repeatUntilDone?.checked||false
      };
      if(existing){
        Object.assign(existing,data);
        existing.subtasks=lines.map((title,index)=>({id:existing.subtasks?.[index]?.id||uid('sub'),title,done:existing.subtasks?.[index]?.done||false}));
      }else{
        state.tasks.push({...data,id:uid('task'),status:'active',subtasks:lines.map(title=>({id:uid('sub'),title,done:false})),completedDates:[],createdAt:Date.now()});
      }
      save();closeDialog('editor-dialog');toast('Сохранено');render();return;
    }
    if(editor.type==='budget'){
      const fd=new FormData(form),name=String(fd.get('name')||'').trim(),month=String(fd.get('month')||'').trim(),amount=Number(fd.get('amount')||0);
      if(!name){showEditorError('Введите название бюджета.');return}
      if(!month){showEditorError('Укажите месяц.');return}
      if(amount<0){showEditorError('Бюджет не может быть отрицательным.');return}
      const allocations=readBudgetAllocations(form),allocated=allocations.reduce((s,x)=>s+x.amount,0);
      if(allocated>amount){showEditorError(`Распределено больше бюджета на ${money(allocated-amount)}.`);return}
      const existing=editor.id?state.budgets.find(x=>x.id===editor.id):null;
      const data={name,month,amount,allocations,updatedAt:Date.now()};
      if(existing)Object.assign(existing,data);else state.budgets.push({...data,id:uid('budget'),createdAt:Date.now()});
      state.financeMonth=month;
      save();closeDialog('editor-dialog');toast('Бюджет сохранён');render();return;
    }
    previousSubmitEditor(form);
  };
  window.submitEditor=submitEditor;

  taskCard=function(task,key){
    const p=project(task.project),done=taskDone(task,key);
    const dueKey=task.endDate||key,late=!done&&dateTime(dueKey,task.time||'23:59')<new Date();
    const hasPeriod=(task.endDate||task.date)!==task.date;
    return `<article class="card task ${done?'done':''}">
      <button type="button" class="task-check" onclick="toggleTask('${task.id}','${key}')">${done?'✓':''}</button>
      <div onclick="openEditor('task','${task.id}')">
        <div class="task-title">${esc(task.title)}</div>
        <div class="task-meta">
          <span class="task-kind">${esc(taskKindLabels[task.kind]||taskKindLabels.task)}</span>
          <span class="${late?'late':'task-period'}">◷ ${hasPeriod?esc(periodLabel(task)):esc(task.time||'без времени')}</span>
          ${task.duration?`<span>${task.duration} мин/день</span>`:''}
          ${p?`<span style="color:${p.color}">▰ ${esc(p.name)}</span>`:''}
          ${task.priority==='high'?'<span class="high">⚑ Высокий</span>':''}
          ${task.recurrence?.type!=='none'?'<span>↻ Повтор</span>':''}
          ${task.reminders?.length?`<span>🔔 ${task.reminders.length}</span>`:''}
        </div>
        ${task.description?`<div class="task-notes">${esc(task.description)}</div>`:''}
      </div>
      <button type="button" class="menu-btn" onclick="event.stopPropagation();taskMenu('${task.id}','${key}')">⋮</button>
    </article>`;
  };
  window.taskCard=taskCard;

  function ensureV24TaskActionsDialog(){
    let dialog=document.querySelector('#task-actions-dialog');
    if(dialog)return dialog;
    dialog=document.createElement('dialog');
    dialog.id='task-actions-dialog';
    dialog.className='sheet-dialog';
    dialog.innerHTML='<div class="task-sheet"><div class="task-sheet-handle"></div><div class="task-sheet-head"><div><small>Действия с задачей</small><h3 id="task-sheet-title"></h3><p id="task-sheet-meta"></p></div><button type="button" class="close-btn" data-task-action="cancel">×</button></div><div class="task-actions-grid" id="task-actions-grid"></div><button type="button" class="task-sheet-cancel" data-task-action="cancel">Отмена</button></div>';
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
    document.body.appendChild(dialog);
    return dialog;
  }

  function runV24TaskAction(action){
    const context=window.__v24TaskActionContext;
    const dialog=document.querySelector('#task-actions-dialog');
    if(action==='cancel'){dialog?.close();return}
    if(!context)return;
    const task=state.tasks.find(x=>x.id===context.id);if(!task){dialog?.close();return}
    dialog?.close();
    if(action==='edit'){setTimeout(()=>openEditor('task',task.id),80);return}
    if(action==='complete'){toggleTask(task.id,context.key);return}
    if(action==='tomorrow'){
      const start=new Date((task.date||context.key)+'T12:00:00');
      const end=new Date((task.endDate||task.date||context.key)+'T12:00:00');
      task.date=dayKey(addDays(start,1));task.endDate=dayKey(addDays(end,1));
      if(task.recurrenceEnd)task.recurrenceEnd=dayKey(addDays(new Date(task.recurrenceEnd+'T12:00:00'),1));
      task.status='active';task.completedDates=[];save();render();toast('Период перенесён на день');return;
    }
    if(action==='duplicate'){
      const copy=JSON.parse(JSON.stringify(task));copy.id=uid('task');copy.title=task.title+' — копия';copy.status='active';copy.completedDates=[];copy.createdAt=Date.now();state.tasks.push(copy);save();render();toast('Копия создана');return;
    }
    if(action==='delete'){setTimeout(()=>deleteEntity('task',task.id),50)}
  }
  taskMenu=function(id,key){
    const task=state.tasks.find(x=>x.id===id);if(!task)return;
    window.__v24TaskActionContext={id,key};
    const dialog=ensureV24TaskActionsDialog();
    dialog.querySelector('#task-sheet-title').textContent=task.title;
    dialog.querySelector('#task-sheet-meta').textContent=`${taskKindLabels[task.kind]||'Задача'} · ${periodLabel(task)}`;
    const done=taskDone(task,key),canMove=(task.recurrence?.type||'none')==='none';
    dialog.querySelector('#task-actions-grid').innerHTML=`
      <button type="button" class="task-action" data-v24-task-action="edit"><span>✎</span><b>Изменить</b></button>
      <button type="button" class="task-action" data-v24-task-action="complete"><span>${done?'↶':'✓'}</span><b>${done?'Вернуть в работу':'Выполнено'}</b></button>
      ${canMove?'<button type="button" class="task-action" data-v24-task-action="tomorrow"><span>→</span><b>Сдвинуть на день</b></button>':''}
      <button type="button" class="task-action" data-v24-task-action="duplicate"><span>⧉</span><b>Дублировать</b></button>
      <button type="button" class="task-action danger" data-v24-task-action="delete"><span>×</span><b>Удалить</b></button>`;
    dialog.querySelectorAll('[data-v24-task-action]').forEach(button=>button.onclick=()=>runV24TaskAction(button.dataset.v24TaskAction));
    dialog.querySelectorAll('[data-task-action="cancel"]').forEach(button=>button.onclick=()=>runV24TaskAction('cancel'));
    try{if(!dialog.open)dialog.showModal()}catch{dialog.setAttribute('open','')}
  };
  window.taskMenu=taskMenu;

  function monthBudget(month){return state.budgets.find(b=>b.month===month)||null}
  function budgetMonthStats(budget,month){
    const list=monthTransactions(month),expenses=list.filter(x=>x.type==='expense');
    const actual=expenses.filter(x=>x.settled).reduce((s,x)=>s+Number(x.amount||0),0);
    const planned=expenses.reduce((s,x)=>s+Number(x.amount||0),0);
    const allocated=(budget?.allocations||[]).reduce((s,x)=>s+Number(x.amount||0),0);
    const amount=Number(budget?.amount||0);
    return {amount,allocated,free:amount-allocated,actual,planned,remaining:amount-actual,list,expenses};
  }
  function allocationCards(budget,stats){
    if(!budget?.allocations?.length)return '<div class="card empty">Статьи расходов ещё не распределены.</div>';
    return `<div class="allocation-list">${budget.allocations.map(row=>{
      const cat=category(row.category),actual=stats.expenses.filter(x=>x.category===row.category&&x.settled).reduce((s,x)=>s+Number(x.amount||0),0);
      const planned=stats.expenses.filter(x=>x.category===row.category).reduce((s,x)=>s+Number(x.amount||0),0);
      const limit=Number(row.amount||0),pct=limit?Math.round(actual/limit*100):0;
      return `<article class="allocation-card">
        <div class="allocation-line"><strong>${esc(cat?.name||'Статья')}</strong><strong class="${actual>limit?'negative':''}">${money(limit)}</strong></div>
        <div class="allocation-meta">План расходов: ${money(planned)} · факт: ${money(actual)}</div>
        <div class="progress"><span style="width:${Math.min(100,pct)}%;background:${actual>limit?'var(--red)':cat?.color||'var(--primary)'}"></span></div>
      </article>`;
    }).join('')}</div>`;
  }

  renderFinance=function(){
    const list=monthTransactions(state.financeMonth),budget=monthBudget(state.financeMonth),stats=budgetMonthStats(budget,state.financeMonth);
    const income=list.filter(x=>x.type==='income'&&x.settled).reduce((s,x)=>s+Number(x.amount||0),0);
    const totalBalance=state.accounts.filter(a=>a.active!==false).reduce((s,a)=>s+accountBalance(a.id),0);
    document.querySelector('#finance').innerHTML=`
      <div class="plan-toolbar"><button type="button" onclick="moveFinanceMonth(-1)">‹</button><button type="button" class="today-btn">${dateFmt(state.financeMonth+'-01',{month:'long',year:'numeric'})}</button><button type="button" onclick="moveFinanceMonth(1)">›</button></div>
      <article class="card budget-summary" onclick="${budget?`openEditor('budget','${budget.id}')`:`openEditor('budget')`}">
        <small>${budget?esc(budget.name):'Бюджет месяца не задан'}</small>
        <div class="budget-main">${money(stats.amount)}</div>
        <div class="budget-kpis">
          <div class="budget-kpi"><small>Распределено</small><strong>${money(stats.allocated)}</strong></div>
          <div class="budget-kpi"><small>Свободно</small><strong class="${stats.free<0?'negative':'positive'}">${money(stats.free)}</strong></div>
          <div class="budget-kpi"><small>Расход факт</small><strong class="negative">${money(stats.actual)}</strong></div>
          <div class="budget-kpi"><small>Остаток бюджета</small><strong class="${stats.remaining<0?'negative':'positive'}">${money(stats.remaining)}</strong></div>
        </div>
      </article>
      <div class="chips">
        <button type="button" class="chip" onclick="${budget?`openEditor('budget','${budget.id}')`:`openEditor('budget')`}">◎ ${budget?'Перераспределить':'Внести бюджет'}</button>
        <button type="button" class="chip" onclick="openEditor('expense')">− Расход</button>
        <button type="button" class="chip" onclick="openEditor('income')">＋ Доход</button>
        <button type="button" class="chip" onclick="openEditor('category')">＋ Статья</button>
      </div>
      <div class="section-head"><h3>Распределение бюджета</h3><span class="counter">${budget?.allocations?.length||0}</span></div>
      ${allocationCards(budget,stats)}
      <div class="section-head"><h3>Счета</h3><span class="counter">${money(totalBalance)}</span></div>
      <div class="account-strip">${state.accounts.filter(a=>a.active!==false).map(a=>`<article class="card account-card" onclick="openEditor('account','${a.id}')"><small>${esc(a.type==='cash'?'Наличные':a.type==='card'?'Карта':'Счёт')}</small><strong>${money(accountBalance(a.id))}</strong><p style="margin:5px 0 0;color:${a.color}">${esc(a.name)}</p></article>`).join('')}</div>
      <div class="section-head"><h3>Операции</h3><span class="counter">${list.length}</span></div>
      <p class="muted" style="margin:-5px 0 10px">Доход факт: ${money(income)} · план расходов: ${money(stats.planned)}</p>
      ${list.length?list.sort((a,b)=>b.occurrenceDate.localeCompare(a.occurrenceDate)).map(x=>transactionCard(x,x.occurrenceDate)).join(''):'<div class="card empty">Операций пока нет.</div>'}`;
  };
  window.renderFinance=renderFinance;

  renderToday=function(){
    const key=dayKey(today),tasks=tasksForDate(key),done=tasks.filter(t=>taskDone(t,key)).length;
    const habits=state.habits.filter(h=>habitDue(h,key)),habitDoneCount=habits.filter(h=>habitDone(h,key)).length;
    const tx=transactionsForDate(key).filter(x=>x.status!=='actual'&&!txSettled(x,key));
    const workouts=workoutsForDate(key).filter(w=>w.status!=='completed');
    const next=upcomingItems()[0];
    document.querySelector('#today').innerHTML=`
      <article class="card today-compact-summary">
        <div class="today-compact-icon">${next?next.kind==='finance'?'₸':next.kind==='workout'?'⚡':'→':'✓'}</div>
        <div><small>${next?'Ближайшее':'Сегодня'}</small><strong>${next?esc(next.title):'Срочных событий нет'}</strong></div>
        <span>${next?`${dateFmt(next.when,{day:'2-digit',month:'2-digit'})} ${pad(next.when.getHours())}:${pad(next.when.getMinutes())}`:'свободно'}</span>
      </article>
      <div class="today-metrics">
        <article class="card dash-card" onclick="setPage('plan')"><div class="icon">✓</div><strong>${done}/${tasks.length}</strong><small>задач сегодня</small></article>
        <article class="card dash-card" onclick="setPage('finance')"><div class="icon">₸</div><strong>${tx.length}</strong><small>платежей сегодня</small></article>
        <article class="card dash-card" onclick="openMore('sport')"><div class="icon">↻</div><strong>${habitDoneCount}/${habits.length}</strong><small>привычек выполнено</small></article>
        <article class="card dash-card" onclick="openMore('sport');setMoreTab('workouts')"><div class="icon">⚡</div><strong>${workouts.length}</strong><small>тренировок</small></article>
      </div>
      <div class="section-head"><h3>Заметки</h3><button type="button" class="text-action" onclick="openMore('notes')">Все заметки</button></div>
      <div class="today-notes">${todayNotesHtmlV24()}</div>
      <div class="section-head"><h3>Задачи и периоды</h3><span class="counter">${tasks.length}</span></div>${taskList(tasks,key)}
      <div class="section-head"><h3>Платежи и тренировки</h3></div>${tx.length?tx.map(x=>transactionCard(x,key)).join(''):''}${workouts.length?workouts.map(workoutCard).join(''):''}${!tx.length&&!workouts.length?'<div class="card empty">На сегодня платежей и тренировок нет.</div>':''}`;
  };
  window.renderToday=renderToday;

  function openProfileSettings(){
    page='more';state.moreView='settings';render();
    setTimeout(()=>{const input=document.querySelector('#owner-name-input');input?.scrollIntoView({behavior:'smooth',block:'center'});input?.focus()},80);
  }
  window.openProfileSettings=openProfileSettings;

  const previousRenderMoreHome=renderMoreHome;
  renderMoreHome=function(){
    previousRenderMoreHome();
    const root=document.querySelector('#more'),profile=root.querySelector('.setting-card');
    if(profile){
      profile.classList.add('profile-entry');
      profile.onclick=openProfileSettings;
      const head=profile.querySelector('.project-head');
      if(head&&!head.querySelector('.profile-chevron'))head.insertAdjacentHTML('beforeend','<span class="profile-chevron">›</span>');
    }
    const footer=[...root.querySelectorAll('p')].find(x=>x.textContent.includes('Штаб AI'));
    if(footer)footer.textContent='Штаб AI · 2.4.0';
  };
  window.renderMoreHome=renderMoreHome;

  const previousRenderSettings=renderSettings;
  renderSettings=function(){
    previousRenderSettings();
    const profileCard=document.querySelector('#more .profile-settings-card');
    if(profileCard)profileCard.id='profile-settings-card';
  };
  window.renderSettings=renderSettings;

  const previousRender=render;
  render=function(){
    previousRender();
    headings.today=['Сегодня',titleDate(today)];
    if(page==='today'){
      document.querySelector('#page-title').textContent='Сегодня';
      document.querySelector('#page-subtitle').textContent=titleDate(today);
    }
  };
  window.render=render;

  if(migrationChanged)localStorage.setItem(STORAGE,JSON.stringify(state));
  render();
})();
//# sourceURL=chunk14.js
