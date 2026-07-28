(function(){
  const TODAY_KEY=dayKey(today);

  function importantItemsV26(){
    const now=new Date(),items=[],used=new Set();
    state.tasks.forEach(task=>{
      if(task.status==='archived'||task.status==='completed')return;
      const end=task.endDate||task.date||TODAY_KEY;
      if(end<TODAY_KEY&&!used.has(task.id)){items.push({id:task.id,kind:'task',urgent:true,title:task.title,meta:`Просрочено с ${dateFmt(end,{day:'2-digit',month:'2-digit'})}`,action:`openEditor('task','${task.id}')`,sort:0});used.add(task.id)}
    });
    tasksForDate(TODAY_KEY).filter(task=>!taskDone(task,TODAY_KEY)).forEach(task=>{
      if(used.has(task.id))return;const due=dateTime(TODAY_KEY,task.time||'23:59'),urgent=due<now;
      if(urgent||task.priority==='high'||task.kind==='trip'){items.push({id:task.id,kind:'task',urgent,title:task.title,meta:`${taskKindLabelsV26[task.kind]||'Задача'} · ${task.time||'без времени'}`,action:`openEditor('task','${task.id}')`,sort:urgent?1:2});used.add(task.id)}
    });
    transactionsForDate(TODAY_KEY).filter(item=>item.type==='expense'&&!txSettled(item,TODAY_KEY)).forEach(item=>items.push({id:item.id,kind:'finance',urgent:true,title:category(item.category)?.name||item.note||'Платёж',meta:`Оплатить сегодня · ${money(item.amount)}`,action:`openEditor('expense','${item.id}')`,sort:1}));
    return items.sort((a,b)=>a.sort-b.sort).slice(0,4);
  }
  function importantSectionV26(){
    const items=importantItemsV26();if(!items.length)return '';
    return `<section class="important-section">${sectionHeadV26(items.some(item=>item.urgent)?'Срочное':'Важное',items.length,[{label:'План',action:"setPage('plan')",type:'plan'}])}<div class="important-list">${items.map(item=>`<article class="card important-row ${item.urgent?'urgent':''}" onclick="${item.action}"><span class="important-icon">${item.kind==='finance'?'₸':item.urgent?'!':'⚑'}</span><div><strong>${esc(item.title)}</strong><small>${esc(item.meta)}</small></div><span>${item.urgent?'Срочно':'Важно'}</span></article>`).join('')}</div></section>`;
  }
  window.importantItemsV26=importantItemsV26;

  function recentNotesV26(){return state.notes.slice().sort((a,b)=>(Number(b.pinned)-Number(a.pinned))||((b.updatedAt||0)-(a.updatedAt||0))).slice(0,4)}
  function todayNotesV26(){const notes=recentNotesV26();if(!notes.length)return '<div class="card empty">Заметок пока нет.</div>';return notes.map(note=>`<article class="card today-note" onclick="openEditor('note','${note.id}')"><div class="row-between"><h4>${note.pinned?'<span class="note-pin">◆</span> ':''}${esc(note.title)}</h4></div><p>${esc(note.body||'Без текста')}</p></article>`).join('')}

  renderToday=function(){
    const tasks=tasksForDate(TODAY_KEY),done=tasks.filter(task=>taskDone(task,TODAY_KEY)).length;
    const habits=state.habits.filter(habit=>habitDue(habit,TODAY_KEY)),habitDoneCount=habits.filter(habit=>habitDone(habit,TODAY_KEY)).length;
    const transactions=transactionsForDate(TODAY_KEY).filter(item=>!txSettled(item,TODAY_KEY)),workouts=workoutsForDate(TODAY_KEY).filter(item=>item.status!=='completed');
    document.querySelector('#today').innerHTML=`${importantSectionV26()}
      <div class="today-metrics"><article class="card dash-card" onclick="setPage('plan')"><div class="icon">✓</div><strong>${done}/${tasks.length}</strong><small>дел сегодня</small></article><article class="card dash-card" onclick="setPage('finance')"><div class="icon">₸</div><strong>${transactions.filter(item=>item.type==='expense').length}</strong><small>платежей сегодня</small></article><article class="card dash-card" onclick="openMore('sport')"><div class="icon">↻</div><strong>${habitDoneCount}/${habits.length}</strong><small>привычек выполнено</small></article><article class="card dash-card" onclick="openMore('sport');setMoreTab('workouts')"><div class="icon">⚡</div><strong>${workouts.length}</strong><small>тренировок</small></article></div>
      ${sectionHeadV26('Заметки',state.notes.length,[{label:'＋',action:"openEditor('note')",type:'note',primary:true},{label:'Все',action:"openMore('notes')",type:'notes'}])}<div class="today-notes">${todayNotesV26()}</div>
      ${sectionHeadV26('Задачи, поручения и командировки',tasks.length,[{label:'＋',action:`openEditor('task',null,{date:'${TODAY_KEY}'})`,type:'task',primary:true}])}${taskList(tasks,TODAY_KEY)}
      ${sectionHeadV26('Финансы сегодня',transactions.length,[{label:'＋ расход',action:`openEditor('expense',null,{date:'${TODAY_KEY}'})`,type:'expense',primary:true},{label:'＋ доход',action:`openEditor('income',null,{date:'${TODAY_KEY}'})`,type:'income'}])}${transactions.length?transactions.map(item=>transactionCard(item,TODAY_KEY)).join(''):'<div class="card empty">Операций на сегодня нет.</div>'}
      ${sectionHeadV26('Тренировки',workouts.length,[{label:'＋',action:`openEditor('workout',null,{date:'${TODAY_KEY}'})`,type:'workout',primary:true}])}${workouts.length?workouts.map(workoutCard).join(''):'<div class="card empty">Тренировок на сегодня нет.</div>'}`;
  };
  window.renderToday=renderToday;

  agendaView=function(key,tasks,transactions,workouts){
    return `${sectionHeadV26('Задачи, поручения и командировки',tasks.length,[{label:'＋',action:`openEditor('task',null,{date:'${key}'})`,type:'task',primary:true}])}${taskList(tasks,key)}
      ${sectionHeadV26('Финансы',transactions.length,[{label:'＋ расход',action:`openEditor('expense',null,{date:'${key}'})`,type:'expense',primary:true},{label:'＋ доход',action:`openEditor('income',null,{date:'${key}'})`,type:'income'}])}${transactions.length?transactions.map(item=>transactionCard(item,key)).join(''):'<div class="card empty">Операций на этот день нет.</div>'}
      ${sectionHeadV26('Тренировки',workouts.length,[{label:'＋',action:`openEditor('workout',null,{date:'${key}'})`,type:'workout',primary:true}])}${workouts.length?workouts.map(workoutCard).join(''):'<div class="card empty">Тренировок на этот день нет.</div>'}`;
  };
  window.agendaView=agendaView;

  function categoryUsageV26(id){const budget=monthBudgetV26(state.financeMonth);return {allocated:Number(budget?.allocations?.find(row=>row.category===id)?.amount||0),operations:state.transactions.filter(item=>item.category===id).length}}
  function allocationCardsV26(budget,stats){
    if(!budget?.allocations?.length)return '<div class="card empty">Бюджет пока не распределён.</div>';
    return `<div class="allocation-list">${budget.allocations.map(row=>{const cat=category(row.category),actual=stats.expenses.filter(item=>item.category===row.category&&item.settled).reduce((sum,item)=>sum+Number(item.amount||0),0),planned=stats.expenses.filter(item=>item.category===row.category).reduce((sum,item)=>sum+Number(item.amount||0),0),allocated=Number(row.amount||0),percent=allocated?Math.round(actual/allocated*100):0;return `<article class="allocation-card" onclick="openBudgetEditorV25()"><div class="allocation-line"><strong>${esc(cat?.name||'Статья')}</strong><strong class="${actual>allocated?'negative':''}">${money(allocated)}</strong></div><div class="allocation-meta">План: ${money(planned)} · факт: ${money(actual)}</div><div class="progress"><span style="width:${Math.min(100,percent)}%;background:${actual>allocated?'var(--red)':cat?.color||'var(--primary)'}"></span></div></article>`}).join('')}</div>`;
  }

  function renderBudgetCenterV26(){
    const budget=monthBudgetV26(state.financeMonth),stats=budgetStatsV26(budget,state.financeMonth),categories=state.categories.filter(item=>item.type==='expense');
    document.querySelector('#more').innerHTML=`${subnav('Бюджет','Бюджет месяца, статьи расходов и счета')}<div class="plan-toolbar"><button type="button" onclick="moveBudgetMonthV25(-1)">‹</button><button type="button" class="today-btn">${dateFmt(state.financeMonth+'-01',{month:'long',year:'numeric'})}</button><button type="button" onclick="moveBudgetMonthV25(1)">›</button></div>
      <article class="card budget-center-summary"><div class="row-between"><div><small>${budget?esc(budget.name):'Бюджет месяца не задан'}</small><div class="budget-main">${money(stats.amount)}</div></div><button type="button" class="section-add primary-add" onclick="openBudgetEditorV25()">${budget?'Изменить':'Внести'}</button></div><div class="budget-kpis"><div class="budget-kpi"><small>Распределено</small><strong>${money(stats.allocated)}</strong></div><div class="budget-kpi"><small>Свободно</small><strong class="${stats.free<0?'negative':'positive'}">${money(stats.free)}</strong></div><div class="budget-kpi"><small>Расход факт</small><strong class="negative">${money(stats.actual)}</strong></div><div class="budget-kpi"><small>Остаток</small><strong class="${stats.remaining<0?'negative':'positive'}">${money(stats.remaining)}</strong></div></div></article>
      ${sectionHeadV26('Распределение',budget?.allocations?.length||0,[{label:'Изменить',action:'openBudgetEditorV25()',type:'budget',primary:true}])}${allocationCardsV26(budget,stats)}
      ${sectionHeadV26('Статьи расходов',categories.length,[{label:'＋',action:'openExpenseCategoryEditorV25()',type:'category',primary:true}])}<div class="budget-category-list">${categories.length?categories.map(item=>{const usage=categoryUsageV26(item.id);return `<article class="card budget-category-card"><span class="budget-category-dot" style="background:${item.color||'#98a0b3'}"></span><div onclick="openExpenseCategoryEditorV25('${item.id}')"><strong>${esc(item.name)}</strong><small>Распределено: ${money(usage.allocated)} · операций: ${usage.operations}</small></div><div class="budget-category-actions"><button type="button" onclick="openExpenseCategoryEditorV25('${item.id}')">Изм.</button><button type="button" class="danger" onclick="deleteExpenseCategoryV25('${item.id}')">Удалить</button></div></article>`}).join(''):'<div class="card empty">Добавьте первую статью расходов.</div>'}</div>
      ${sectionHeadV26('Счета',state.accounts.filter(item=>item.active!==false).length,[{label:'＋',action:"openEditor('account')",type:'account',primary:true}])}<div class="account-strip">${state.accounts.filter(item=>item.active!==false).map(item=>`<article class="card account-card" onclick="openEditor('account','${item.id}')"><small>${esc(item.type==='cash'?'Наличные':item.type==='card'?'Карта':'Счёт')}</small><strong>${money(accountBalance(item.id))}</strong><p style="margin:5px 0 0;color:${item.color}">${esc(item.name)}</p></article>`).join('')}</div>`;
  }
  window.renderBudgetCenterV26=renderBudgetCenterV26;

  renderFinance=function(){
    const list=monthTransactions(state.financeMonth),budget=monthBudgetV26(state.financeMonth),stats=budgetStatsV26(budget,state.financeMonth),income=list.filter(item=>item.type==='income'&&item.settled).reduce((sum,item)=>sum+Number(item.amount||0),0),totalBalance=state.accounts.filter(item=>item.active!==false).reduce((sum,item)=>sum+accountBalance(item.id),0);
    document.querySelector('#finance').innerHTML=`<div class="plan-toolbar"><button type="button" onclick="moveFinanceMonth(-1)">‹</button><button type="button" class="today-btn">${dateFmt(state.financeMonth+'-01',{month:'long',year:'numeric'})}</button><button type="button" onclick="moveFinanceMonth(1)">›</button></div><article class="card finance-budget-compact"><div><small>${budget?'Остаток бюджета':'Бюджет не задан'}</small><strong>${money(stats.remaining)}</strong><small>${budget?`из ${money(stats.amount)} · расход факт ${money(stats.actual)}`:'Настройте бюджет и статьи расходов'}</small></div><button type="button" class="budget-link" onclick="openMore('budget')">Бюджет</button></article><div class="finance-hero"><small>Общий остаток по счетам</small><div class="money-main">${money(totalBalance)}</div><div class="money-row"><div class="money-mini"><span>Доход факт</span><strong class="positive">${money(income)}</strong></div><div class="money-mini"><span>Расход факт</span><strong class="negative">${money(stats.actual)}</strong></div></div><p class="muted" style="margin:12px 0 0">Запланировано расходов: ${money(stats.planned)}</p></div>${sectionHeadV26('Операции',list.length,[{label:'＋ расход',action:"openEditor('expense')",type:'expense',primary:true},{label:'＋ доход',action:"openEditor('income')",type:'income'}])}${list.length?list.sort((a,b)=>b.occurrenceDate.localeCompare(a.occurrenceDate)).map(item=>transactionCard(item,item.occurrenceDate)).join(''):'<div class="card empty">Операций пока нет.</div>'}`;
  };
  window.renderFinance=renderFinance;

  const previousRenderMoreV26=renderMore;
  renderMore=function(){if((state.moreView||'home')==='budget')return renderBudgetCenterV26();return previousRenderMoreV26()};
  window.renderMore=renderMore;

  function enhanceModuleAddsV26(){
    const root=document.querySelector('#more');if(!root)return;
    if(state.moreView==='projects'){
      root.querySelectorAll('.chips button').forEach(button=>{if(button.textContent.includes('＋ Проект')||button.textContent.includes('＋ Сфера'))button.remove()});
      const list=root.querySelector('.chips + div');if(list&&!list.previousElementSibling?.classList.contains('section-head'))list.insertAdjacentHTML('beforebegin',sectionHeadV26('Проекты',state.projects.filter(project=>state.moreTab==='archived'?project.status==='archived':project.status!=='archived').length,[{label:'＋',action:"openEditor('project')",type:'project',primary:true}]));
      [...root.querySelectorAll('.section-head')].filter(head=>head.querySelector('h3')?.textContent==='Сферы жизни').forEach(head=>{if(!head.querySelector('[data-local-add]'))head.insertAdjacentHTML('beforeend','<div class="section-tools"><button type="button" class="section-add primary-add" data-local-add="area" onclick="openEditor(\'area\')">＋</button></div>')});
    }
    if(state.moreView==='sport'){
      root.querySelectorAll('.chips button').forEach(button=>{if(button.textContent.includes('＋ Добавить'))button.remove()});const content=root.querySelector('.chips + div');
      if(content&&!content.previousElementSibling?.classList.contains('section-head')){const workouts=state.moreTab==='workouts',count=workouts?state.workouts.length:state.habits.filter(item=>item.active).length;content.insertAdjacentHTML('beforebegin',sectionHeadV26(workouts?'Тренировки':'Привычки',count,[{label:'＋',action:`openEditor('${workouts?'workout':'habit'}')`,type:workouts?'workout':'habit',primary:true}]))}
    }
    if(state.moreView==='goals'){root.querySelector('.chips')?.remove();const content=root.querySelector('.subnav + div')||root.querySelector('[style*="margin-top"]');if(content&&!root.querySelector('[data-local-add="goal"]'))content.insertAdjacentHTML('beforebegin',sectionHeadV26('Цели',state.goals.filter(item=>item.status!=='archived').length,[{label:'＋',action:"openEditor('goal')",type:'goal',primary:true}]))}
    if(state.moreView==='notes'){root.querySelector('.chips')?.remove();const content=root.querySelector('.subnav + div')||root.querySelector('[style*="margin-top"]');if(content&&!root.querySelector('[data-local-add="note"]'))content.insertAdjacentHTML('beforebegin',sectionHeadV26('Заметки',state.notes.length,[{label:'＋',action:"openEditor('note')",type:'note',primary:true}]))}
  }

  const previousGlobalSearchV26=globalSearch;
  globalSearch=function(query){
    const q=String(query||'').toLowerCase().trim();if(!q)return[];const result=previousGlobalSearchV26(q),seen=new Set(result.map(item=>item.action));const push=item=>{if(!seen.has(item.action)){seen.add(item.action);result.push(item)}};
    state.transactions.filter(item=>`${item.note||''} ${category(item.category)?.name||''} ${item.amount}`.toLowerCase().includes(q)).forEach(item=>push({type:item.type==='expense'?'Расход':'Доход',title:`${category(item.category)?.name||item.note||'Операция'} — ${money(item.amount)}`,action:`openEditor('${item.type}','${item.id}')`}));
    state.workouts.filter(item=>`${item.title} ${item.plan||''}`.toLowerCase().includes(q)).forEach(item=>push({type:'Тренировка',title:item.title,action:`openEditor('workout','${item.id}')`}));state.goals.filter(item=>item.title.toLowerCase().includes(q)).forEach(item=>push({type:'Цель',title:item.title,action:`openEditor('goal','${item.id}')`}));state.habits.filter(item=>`${item.name} ${item.description||''}`.toLowerCase().includes(q)).forEach(item=>push({type:'Привычка',title:item.name,action:`openEditor('habit','${item.id}')`}));state.categories.filter(item=>item.name.toLowerCase().includes(q)).forEach(item=>push({type:item.type==='expense'?'Статья расходов':'Категория дохода',title:item.name,action:item.type==='expense'?"openMore('budget')":`openEditor('category','${item.id}')`}));return result.slice(0,40);
  };
  window.globalSearch=globalSearch;

  const previousRenderMoreHomeV26=renderMoreHome;
  renderMoreHome=function(){previousRenderMoreHomeV26();const footer=[...document.querySelectorAll('#more p')].find(node=>node.textContent.includes('Штаб AI'));if(footer)footer.textContent='Штаб AI · 2.6.0'};
  window.renderMoreHome=renderMoreHome;

  const previousRenderV26=render;
  render=function(){previousRenderV26();const fab=document.querySelector('#fab');if(fab)fab.style.display='none';enhanceModuleAddsV26();document.querySelectorAll('button:not([type])').forEach(button=>button.type=button.closest('form')&&button.classList.contains('send')?'submit':'button')};
  window.render=render;
  window.__shtabDiagnostics={...(window.__shtabDiagnostics||{}),importantItems:()=>importantItemsV26().map(item=>({...item})),localAddCount:()=>document.querySelectorAll('[data-local-add]').length,transactionByNote:note=>{const item=state.transactions.find(row=>row.note===note);return item?JSON.parse(JSON.stringify(item)):null}};
  render();
})();
//# sourceURL=chunk18.js