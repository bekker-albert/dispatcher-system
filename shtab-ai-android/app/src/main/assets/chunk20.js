(function(){
  const TODAY_KEY=dayKey(today);
  let migrationChanged=false;

  function incomeFallbackCategoryV27(){
    let item=state.categories.find(row=>row.type==='income'&&row.id==='other-income')||state.categories.find(row=>row.type==='income');
    if(!item){item={id:'other-income',name:'Доход',type:'income',color:'#37cf7b'};state.categories.push(item);migrationChanged=true}
    return item.id;
  }
  const fallbackIncomeCategory=incomeFallbackCategoryV27();
  state.transactions.forEach(item=>{
    if(item.type!=='income')return;
    if(!String(item.sourceName||'').trim()){item.sourceName=String(item.note||category(item.category)?.name||'Доход').trim()||'Доход';migrationChanged=true}
    if((item.recurrence?.type||'none')!=='none'){item.recurrence={type:'none',interval:1};migrationChanged=true}
    if(!item.category){item.category=fallbackIncomeCategory;migrationChanged=true}
  });
  if(migrationChanged)localStorage.setItem(STORAGE,JSON.stringify(state));

  const style=document.createElement('style');
  style.id='v27-styles';
  style.textContent=`
    .assistant-top-btn{font-size:20px;font-weight:900;color:var(--primary);background:rgba(125,101,255,.14)!important}
    .today-notes{grid-template-columns:1fr!important}
    .today-note{min-height:76px!important;width:100%}
    .finance-budget-panel{padding:14px;margin:10px 0 14px}
    .finance-budget-panel .budget-main{font-size:27px;font-weight:900;margin:4px 0 11px}
    .finance-budget-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
    .finance-budget-actions button{border:1px solid var(--border);border-radius:13px;padding:11px;background:var(--surface-2);color:var(--text);font-weight:800}
    .finance-budget-actions button.primary{background:rgba(125,101,255,.16);color:var(--primary)}
    .finance-budget-actions button:disabled{opacity:.45}
    .finance-settings-note{padding:13px;margin:10px 0 14px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center}
    .finance-settings-note small{display:block;color:var(--muted);margin-top:4px}
    .allocation-editor-summary{padding:11px 12px;border-radius:13px;background:var(--surface-2);margin:8px 0 12px}
    .allocation-editor-summary strong{display:block;font-size:18px;margin-top:4px}
    .analytics-tabs-v27{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:8px 0 14px}
    .analytics-tabs-v27 button{border:1px solid var(--border);background:var(--surface-2);color:var(--muted);padding:9px 7px;border-radius:12px;font-weight:800;font-size:12px}
    .analytics-tabs-v27 button.active{color:var(--primary);background:rgba(125,101,255,.13)}
    .plan-day-title{margin:11px 0 4px;color:var(--muted);font-size:12px}
    @media(max-width:360px){.finance-budget-actions{grid-template-columns:1fr}.finance-settings-note{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  state.analyticsSection=state.analyticsSection||'tasks';
  headings.analytics=['Аналитика','Задачи, командировки и проекты'];
  headings.plan=['План','Календарь и повестка'];
  headings.finance=['Финансы','Бюджет, распределение и операции'];

  const previousEditorTitleV27=editorTitle;
  editorTitle=function(type,id){if(type==='allocation')return 'Распределение бюджета';return previousEditorTitleV27(type,id)};
  window.editorTitle=editorTitle;

  const previousEditorFieldsV27=editorFields;
  function incomeFieldsV27(item={},extra={}){
    const date=item.date||extra.date||TODAY_KEY,isFuture=date>TODAY_KEY,status=item.status||(isFuture?'planned':'actual');
    const notifyEnabled=item.notifyEnabled!==undefined?Boolean(item.notifyEnabled):Boolean(item.reminders?.length);
    const source=String(item.sourceName||item.note||category(item.category)?.name||'').trim();
    return `<input type="hidden" name="status" value="${esc(status)}"><input type="hidden" name="category" value="${esc(item.category||fallbackIncomeCategory)}">
      ${f('sourceName','Источник дохода',source,'text','required placeholder="Зарплата, возврат, продажа…"')}
      ${f('amount','Сумма, ₸',item.amount||'','number','required min="0.01" step="0.01"')}
      <div class="field-row">${f('date','Дата поступления',date,'date','required onchange="refreshTransactionFormV26()"')}${sel('account','Счёт',accountOptions(item.account||state.accounts[0]?.id))}</div>
      ${ta('note','Комментарий',item.note&&item.note!==source?item.note:'',3)}
      <div class="tx-state-note" id="tx-state-note"><span class="tx-state-icon">${status==='actual'?'✓':'◷'}</span><div><strong id="tx-state-title">${status==='actual'?'Будет учтено как полученный доход':'Будет сохранено как ожидаемый доход'}</strong><small id="tx-state-help">${status==='actual'?'Время и напоминание не требуются.':'Напоминание можно включить отдельно.'}</small></div></div>
      <label class="check-option tx-reminder-toggle" id="tx-reminder-toggle"><input type="checkbox" name="notifyEnabled" ${notifyEnabled?'checked':''} onchange="refreshTransactionFormV26()"><span>Напомнить о поступлении</span></label>
      <div class="tx-reminder-panel" id="tx-reminder-panel" ${notifyEnabled?'':'hidden'}>${f('time','Время напоминания',item.time||'09:00','time')}<label class="field"><span>Когда напомнить</span>${reminderGrid(item.reminders?.length?item.reminders:[1440,60])}</label></div>`;
  }
  function budgetAmountFieldsV27(item={}){
    return `${f('name','Название бюджета',item.name||'Основной бюджет','text','required')}
      <div class="field-row">${f('month','Месяц',item.month||state.financeMonth,'month','required')}${f('amount','Сумма бюджета, ₸',item.amount||'','number','required min="0" step="0.01"')}</div>
      <div class="budget-editor-note">Здесь указывается только общий бюджет месяца. Распределение по статьям выполняется отдельным действием во вкладке «Финансы».</div>`;
  }
  function allocationRowV27(row={}){
    return `<div class="budget-allocation-row">${sel('allocationCategory','Статья',categoryOptions('expense',row.category||''))}${f('allocationAmount','Сумма, ₸',row.amount||'','number','min="0" step="0.01"')}<button type="button" aria-label="Удалить строку" onclick="this.closest('.budget-allocation-row').remove()">×</button></div>`;
  }
  function allocationFieldsV27(extra={}){
    const budget=state.budgets.find(item=>item.id===extra.budgetId)||window.monthBudgetV26(state.financeMonth);
    if(!budget)return '<div class="card empty">Сначала внесите бюджет месяца.</div>';
    const allocated=(budget.allocations||[]).reduce((sum,row)=>sum+Number(row.amount||0),0);
    return `<input type="hidden" name="budgetId" value="${esc(budget.id)}"><div class="allocation-editor-summary"><small>Доступный бюджет</small><strong>${money(budget.amount)}</strong><small>Сейчас распределено: ${money(allocated)}</small></div><label class="field"><span>Распределение по статьям</span><div id="budget-allocation-list" class="budget-allocation-list">${(budget.allocations||[]).map(allocationRowV27).join('')}</div></label><button type="button" class="secondary budget-add-row" onclick="addBudgetAllocationRowV27()">＋ Добавить строку распределения</button>`;
  }
  editorFields=function(type,item={},extra={}){
    if(type==='income')return incomeFieldsV27(item||{},extra||{});
    if(type==='budget')return budgetAmountFieldsV27(item||{});
    if(type==='allocation')return allocationFieldsV27(extra||{});
    return previousEditorFieldsV27(type,item||{},extra||{});
  };
  window.editorFields=editorFields;

  function addBudgetAllocationRowV27(){
    const list=document.querySelector('#budget-allocation-list');if(!list)return;
    if(!state.categories.some(item=>item.type==='expense')){toast('Сначала создайте статью расходов');return}
    list.insertAdjacentHTML('beforeend',allocationRowV27());
  }
  window.addBudgetAllocationRowV27=addBudgetAllocationRowV27;

  function readAllocationsV27(form){
    const grouped=new Map();
    form.querySelectorAll('.budget-allocation-row').forEach(row=>{const categoryId=row.querySelector('[name=allocationCategory]')?.value||'',amount=Math.max(0,Number(row.querySelector('[name=allocationAmount]')?.value||0));if(categoryId)grouped.set(categoryId,(grouped.get(categoryId)||0)+amount)});
    return [...grouped.entries()].map(([category,amount])=>({category,amount}));
  }

  const previousSubmitEditorV27=submitEditor;
  submitEditor=function(form){
    if(editor.type==='income'){
      const fd=new FormData(form),get=key=>String(fd.get(key)||'').trim(),amount=Number(fd.get('amount')||0),date=get('date'),sourceName=get('sourceName'),accountId=get('account');
      if(!sourceName){showEditorError('Укажите источник дохода.');return}if(!(amount>0)){showEditorError('Укажите сумму больше нуля.');return}if(!date){showEditorError('Укажите дату поступления.');return}if(!accountId){showEditorError('Выберите счёт.');return}
      const existing=editor.id?state.transactions.find(item=>item.id===editor.id):null,notifyEnabled=Boolean(form.elements.notifyEnabled?.checked&&!document.querySelector('#tx-reminder-toggle')?.hidden);
      const data={type:'income',sourceName,amount,date,account:accountId,category:get('category')||fallbackIncomeCategory,status:get('status')||(date>TODAY_KEY?'planned':'actual'),time:notifyEnabled?(get('time')||'09:00'):'09:00',recurrence:{type:'none',interval:1},note:get('note'),notifyEnabled,reminders:notifyEnabled?checkedReminders(form):[],settledDates:existing?.settledDates||[],createdAt:existing?.createdAt||Date.now()};
      if(existing)Object.assign(existing,data);else state.transactions.push({...data,id:uid('tx')});save();closeDialog('editor-dialog');toast('Доход сохранён');render();return;
    }
    if(editor.type==='budget'){
      const fd=new FormData(form),name=String(fd.get('name')||'').trim(),month=String(fd.get('month')||'').trim(),amount=Number(fd.get('amount')||0);
      if(!name){showEditorError('Введите название бюджета.');return}if(!month){showEditorError('Укажите месяц.');return}if(amount<0){showEditorError('Бюджет не может быть отрицательным.');return}
      const existing=(editor.id?state.budgets.find(item=>item.id===editor.id):null)||state.budgets.find(item=>item.month===month);
      if(existing)Object.assign(existing,{name,month,amount,updatedAt:Date.now(),allocations:existing.allocations||[]});else state.budgets.push({id:uid('budget'),name,month,amount,allocations:[],createdAt:Date.now(),updatedAt:Date.now()});
      state.financeMonth=month;save();closeDialog('editor-dialog');toast('Бюджет внесён');render();return;
    }
    if(editor.type==='allocation'){
      const fd=new FormData(form),budgetId=String(fd.get('budgetId')||''),budget=state.budgets.find(item=>item.id===budgetId);if(!budget){showEditorError('Бюджет не найден.');return}
      const allocations=readAllocationsV27(form),allocated=allocations.reduce((sum,row)=>sum+row.amount,0);if(allocated>Number(budget.amount||0)){showEditorError(`Распределено больше бюджета на ${money(allocated-Number(budget.amount||0))}.`);return}
      budget.allocations=allocations;budget.updatedAt=Date.now();save();closeDialog('editor-dialog');toast('Распределение сохранено');render();return;
    }
    previousSubmitEditorV27(form);
  };
  window.submitEditor=submitEditor;

  function openBudgetAmountV27(){const budget=window.monthBudgetV26(state.financeMonth);openEditor('budget',budget?.id||null,{month:state.financeMonth})}
  function openBudgetAllocationV27(){const budget=window.monthBudgetV26(state.financeMonth);if(!budget){toast('Сначала внесите бюджет месяца');return}if(!state.categories.some(item=>item.type==='expense')){toast('Сначала создайте статью расходов');openMore('budget');return}openEditor('allocation',null,{budgetId:budget.id})}
  window.openBudgetAmountV27=openBudgetAmountV27;window.openBudgetAllocationV27=openBudgetAllocationV27;window.openBudgetEditorV25=openBudgetAmountV27;

  function transactionTitleV27(tx){return tx.type==='income'?(tx.sourceName||tx.note||'Доход'):(category(tx.category)?.name||tx.note||'Расход')}
  transactionCard=function(tx,key){
    const cat=category(tx.category),settled=txSettled(tx,key),planned=!settled,title=transactionTitleV27(tx),meta=[dateFmt(key,{day:'2-digit',month:'2-digit'}),account(tx.account)?.name||'',planned&&tx.notifyEnabled?`🔔 ${tx.time||'09:00'}`:''].filter(Boolean).join(' · ');
    return `<article class="card transaction v26"><div class="tx-icon" style="color:${cat?.color||'#aaa'}">${tx.type==='income'?'+':'−'}</div><div class="tx-main" onclick="openEditor('${tx.type}','${tx.id}')"><h4>${esc(title)}</h4><p>${esc(meta)}</p><span class="tx-status ${planned?'planned':'actual'}">${planned?'Запланировано':tx.type==='expense'?'Оплачено':'Получено'}</span></div><strong class="${tx.type==='income'?'positive':'negative'}">${tx.type==='income'?'+':'−'}${money(tx.amount)}</strong><button type="button" class="menu-btn" onclick="event.stopPropagation();transactionMenuV26('${tx.id}','${key}')">⋮</button></article>`;
  };
  window.transactionCard=transactionCard;

  const previousTransactionMenuV27=window.transactionMenuV26;
  window.transactionMenuV26=function(id,key){
    previousTransactionMenuV27(id,key);
    const tx=state.transactions.find(item=>item.id===id),dialog=document.querySelector('#transaction-actions-dialog');if(!tx||!dialog)return;
    dialog.querySelector('#tx-sheet-title').textContent=transactionTitleV27(tx);
    if(txSettled(tx,key))dialog.querySelector('[data-tx-action="settle"]')?.remove();
  };

  function budgetCategoryAnalyticsV27(data){
    if(!data.byCategory.length)return '<div class="card empty">Распределение бюджета не задано.</div>';
    return `<div class="analytics-budget-list">${data.byCategory.map(row=>{const percent=row.allocated?Math.round(row.actual/row.allocated*100):0;return `<div class="analytics-budget-row"><div><strong>${esc(row.name)}</strong><small>План ${money(row.planned)} · факт ${money(row.actual)} из ${money(row.allocated)}</small><div class="analytics-track"><i style="width:${Math.min(100,percent)}%;background:${row.actual>row.allocated?'var(--red)':'var(--primary)'}"></i></div></div><b>${percent}%</b></div>`}).join('')}</div>`;
  }

  renderFinance=function(){
    const list=monthTransactions(state.financeMonth),budget=window.monthBudgetV26(state.financeMonth),stats=window.budgetStatsV26(budget,state.financeMonth),analytics=window.budgetAnalyticsV26(state.financeMonth),income=list.filter(item=>item.type==='income'&&item.settled).reduce((sum,item)=>sum+Number(item.amount||0),0),totalBalance=state.accounts.filter(item=>item.active!==false).reduce((sum,item)=>sum+accountBalance(item.id),0);
    document.querySelector('#finance').innerHTML=`<div class="plan-toolbar"><button type="button" onclick="moveFinanceMonth(-1)">‹</button><button type="button" class="today-btn">${dateFmt(state.financeMonth+'-01',{month:'long',year:'numeric'})}</button><button type="button" onclick="moveFinanceMonth(1)">›</button></div>
      <article class="card finance-budget-panel"><small>${budget?esc(budget.name):'Бюджет месяца не внесён'}</small><div class="budget-main">${money(stats.amount)}</div><div class="budget-kpis"><div class="budget-kpi"><small>Распределено</small><strong>${money(stats.allocated)}</strong></div><div class="budget-kpi"><small>Свободно</small><strong class="${stats.free<0?'negative':'positive'}">${money(stats.free)}</strong></div><div class="budget-kpi"><small>Расход факт</small><strong class="negative">${money(stats.actual)}</strong></div><div class="budget-kpi"><small>Остаток</small><strong class="${stats.remaining<0?'negative':'positive'}">${money(stats.remaining)}</strong></div></div><div class="finance-budget-actions"><button type="button" class="primary" data-local-add="budget" onclick="openBudgetAmountV27()">${budget?'Изменить бюджет':'Внести бюджет'}</button><button type="button" data-local-add="allocation" onclick="openBudgetAllocationV27()" ${budget?'':'disabled'}>Распределить бюджет</button></div></article>
      ${sectionHeadV26('Исполнение бюджета',budget?.allocations?.length||0,[{label:'Настройки статей',action:"openMore('budget')",type:'category'}])}${budgetCategoryAnalyticsV27(analytics)}
      <div class="finance-hero"><small>Общий остаток по счетам</small><div class="money-main">${money(totalBalance)}</div><div class="money-row"><div class="money-mini"><span>Доход факт</span><strong class="positive">${money(income)}</strong></div><div class="money-mini"><span>Расход факт</span><strong class="negative">${money(stats.actual)}</strong></div></div><p class="muted" style="margin:12px 0 0">Запланировано расходов: ${money(stats.planned)}</p></div>
      ${sectionHeadV26('Операции',list.length,[{label:'＋ расход',action:"openEditor('expense')",type:'expense',primary:true},{label:'＋ доход',action:"openEditor('income')",type:'income'}])}${list.length?list.sort((a,b)=>b.occurrenceDate.localeCompare(a.occurrenceDate)).map(item=>transactionCard(item,item.occurrenceDate)).join(''):'<div class="card empty">Операций пока нет.</div>'}`;
  };
  window.renderFinance=renderFinance;

  function renderFinancialSettingsV27(){
    const categories=state.categories.filter(item=>item.type==='expense');
    document.querySelector('#more').innerHTML=`${subnav('Финансовые настройки','Статьи расходов и счета')}<article class="card finance-settings-note"><div><strong>Бюджет находится во вкладке «Финансы»</strong><small>Внесение общей суммы и распределение выполняются отдельными действиями.</small></div><button type="button" class="section-add primary-add" onclick="setPage('finance')">Открыть</button></article>
      ${sectionHeadV26('Статьи расходов',categories.length,[{label:'＋',action:'openExpenseCategoryEditorV25()',type:'category',primary:true}])}<div class="budget-category-list">${categories.length?categories.map(item=>{const usage=state.transactions.filter(row=>row.category===item.id).length;return `<article class="card budget-category-card"><span class="budget-category-dot" style="background:${item.color||'#98a0b3'}"></span><div onclick="openExpenseCategoryEditorV25('${item.id}')"><strong>${esc(item.name)}</strong><small>Операций: ${usage}</small></div><div class="budget-category-actions"><button type="button" onclick="openExpenseCategoryEditorV25('${item.id}')">Изм.</button><button type="button" class="danger" onclick="deleteExpenseCategoryV25('${item.id}')">Удалить</button></div></article>`}).join(''):'<div class="card empty">Добавьте первую статью расходов.</div>'}</div>
      ${sectionHeadV26('Счета',state.accounts.filter(item=>item.active!==false).length,[{label:'＋',action:"openEditor('account')",type:'account',primary:true}])}<div class="account-strip">${state.accounts.filter(item=>item.active!==false).map(item=>`<article class="card account-card" onclick="openEditor('account','${item.id}')"><small>${esc(item.type==='cash'?'Наличные':item.type==='card'?'Карта':'Счёт')}</small><strong>${money(accountBalance(item.id))}</strong><p style="margin:5px 0 0;color:${item.color}">${esc(item.name)}</p></article>`).join('')}</div>`;
  }
  const previousRenderMoreV27=renderMore;
  renderMore=function(){if((state.moreView||'home')==='budget')return renderFinancialSettingsV27();return previousRenderMoreV27()};
  window.renderMore=renderMore;

  renderPlan=function(){
    const key=state.selectedDate,d=new Date(key+'T12:00:00'),days=Array.from({length:21},(_,index)=>addDays(d,index-10)),tasks=tasksForDate(key),transactions=transactionsForDate(key),workouts=workoutsForDate(key);
    document.querySelector('#plan').innerHTML=`<div class="plan-toolbar"><button type="button" onclick="moveSelectedDate(-1)">‹</button><button type="button" class="today-btn" onclick="selectDate('${TODAY_KEY}')">${dateFmt(d,{day:'numeric',month:'long',year:d.getFullYear()!==today.getFullYear()?'numeric':undefined})}</button><button type="button" onclick="moveSelectedDate(1)">›</button></div><div class="date-strip" id="date-strip">${days.map(date=>`<button type="button" data-date="${dayKey(date)}" class="date-chip ${dayKey(date)===key?'selected':''}" onclick="selectDate('${dayKey(date)}')"><span>${dateFmt(date,{weekday:'short'})}</span><strong>${date.getDate()}</strong></button>`).join('')}</div><p class="plan-day-title">Повестка выбранного дня</p>${agendaView(key,tasks,transactions,workouts)}`;
    requestAnimationFrame(()=>document.querySelector('#date-strip .selected')?.scrollIntoView({behavior:'auto',inline:'center',block:'nearest'}));
  };
  window.renderPlan=renderPlan;

  function setAnalyticsSectionV27(section){state.analyticsSection=section;save();render()}
  window.setAnalyticsSectionV27=setAnalyticsSectionV27;
  function renderAnalyticsV27(){
    const days=state.analyticsRange,taskData=window.taskAnalyticsV26(days),tripData=window.tripAnalyticsV26(days),section=state.analyticsSection;
    const tabs=`<div class="analytics-tabs-v27"><button type="button" class="${section==='tasks'?'active':''}" onclick="setAnalyticsSectionV27('tasks')">Задачи</button><button type="button" class="${section==='trips'?'active':''}" onclick="setAnalyticsSectionV27('trips')">Командировки</button><button type="button" class="${section==='projects'?'active':''}" onclick="setAnalyticsSectionV27('projects')">Проекты</button></div><div class="analytics-range">${[7,30,90].map(value=>`<button type="button" class="${days===value?'active':''}" onclick="setAnalyticsRange(${value})">${value} дней</button>`).join('')}</div>`;
    let body='';
    if(section==='trips')body=`<div class="analytics-v26-grid"><article class="card analytics-v26-card"><small>Командировок</small><strong>${tripData.count}</strong><small>в выбранном окне</small></article><article class="card analytics-v26-card"><small>Дней</small><strong>${tripData.tripDays}</strong><small>в командировках</small></article><article class="card analytics-v26-card"><small>Активно</small><strong>${tripData.active}</strong><small>сейчас</small></article><article class="card analytics-v26-card"><small>Ближайшие</small><strong>${tripData.upcoming}</strong><small>запланировано</small></article><article class="card analytics-v26-card wide"><small>Текущие и ближайшие</small><div class="analytics-trip-list">${tripData.nextTrips.length?tripData.nextTrips.map(task=>`<div class="analytics-trip-row" onclick="openEditor('task','${task.id}')"><div><strong>${esc(task.title)}</strong><small>${dateFmt(task.date,{day:'2-digit',month:'2-digit'})}–${dateFmt(task.endDate||task.date,{day:'2-digit',month:'2-digit',year:'numeric'})}</small></div><b>›</b></div>`).join(''):'<div class="empty">Командировок нет.</div>'}</div></article></div>`;
    else if(section==='projects'){
      const rows=[...state.projects].map(projectItem=>{let planned=0,done=0;for(let index=0;index<days;index++){const key=dayKey(addDays(today,-index));tasksForDate(key).filter(task=>task.project===projectItem.id).forEach(task=>{planned++;if(taskDone(task,key))done++})}return {projectItem,planned,done,percent:planned?Math.round(done/planned*100):0}}).sort((a,b)=>b.planned-a.planned);
      body=`<div class="analytics-list">${rows.length?rows.map(row=>`<div class="analytics-row" onclick="openProject('${row.projectItem.id}')"><span class="label">${esc(row.projectItem.name)}</span><span class="track"><i style="width:${row.percent}%"></i></span><small>${row.done}/${row.planned}</small></div>`).join(''):'<div class="card empty">Проектов нет.</div>'}</div>`;
    }else body=`<div class="analytics-v26-grid"><article class="card analytics-v26-card"><small>Выполнение</small><strong>${taskData.percent}%</strong><small>${taskData.done} из ${taskData.planned}</small></article><article class="card analytics-v26-card"><small>Просрочено</small><strong>${taskData.overdue}</strong><small>уникальных записей</small></article><article class="card analytics-v26-card"><small>Закрытая нагрузка</small><strong>${Math.round(taskData.doneMinutes/60)} ч</strong><small>из ${Math.round(taskData.minutes/60)} ч</small></article><article class="card analytics-v26-card"><small>Запланировано</small><strong>${taskData.planned}</strong><small>выполнений</small></article></div>`;
    document.querySelector('#analytics').innerHTML=tabs+body;
  }
  window.renderAnalyticsV27=renderAnalyticsV27;

  const previousAssistantAnswerV27=assistantAnswer;
  assistantAnswer=function(text){const before=state.transactions.length,result=previousAssistantAnswerV27(text);state.transactions.slice(before).filter(item=>item.type==='income').forEach(item=>{item.sourceName=String(item.note||'Доход').trim()||'Доход';item.recurrence={type:'none',interval:1};item.category=item.category||fallbackIncomeCategory});return result};
  window.assistantAnswer=assistantAnswer;

  const previousRenderMoreHomeV27=renderMoreHome;
  renderMoreHome=function(){previousRenderMoreHomeV27();const module=document.querySelector('#more [data-module="budget"]');if(module){const title=module.querySelector('h3'),description=module.querySelector('p');if(title)title.textContent='Финансовые настройки';if(description)description.textContent='Статьи расходов и счета'}const footer=[...document.querySelectorAll('#more p')].find(node=>node.textContent.includes('Штаб AI'));if(footer)footer.textContent='Штаб AI · 2.7.0'};
  window.renderMoreHome=renderMoreHome;

  function configureAssistantButtonV27(){const button=document.querySelector('#assistant-btn');if(!button)return;button.textContent='✦';button.setAttribute('aria-label','Открыть помощника');button.title='Помощник';button.onclick=()=>setPage('assistant')}
  const previousRenderV27=render;
  render=function(){previousRenderV27();renderAnalyticsV27();configureAssistantButtonV27();document.querySelectorAll('button:not([type])').forEach(button=>button.type=button.closest('form')&&button.classList.contains('send')?'submit':'button')};
  window.render=render;

  if(native()&&!localStorage.getItem('shtab-ai-permissions-requested')){localStorage.setItem('shtab-ai-permissions-requested','1');setTimeout(()=>{try{Android.requestInitialPermissions()}catch{}},500)}
  window.__shtabDiagnostics={...(window.__shtabDiagnostics||{}),transactionBySource:source=>{const item=state.transactions.find(row=>row.sourceName===source);return item?JSON.parse(JSON.stringify(item)):null},financeBudget:month=>{const budget=window.monthBudgetV26(month);return budget?JSON.parse(JSON.stringify(budget)):null},analyticsSection:()=>state.analyticsSection};
  render();
})();
//# sourceURL=chunk20.js
