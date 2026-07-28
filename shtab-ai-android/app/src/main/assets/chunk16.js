(function(){
  const style=document.createElement('style');
  style.id='v25-styles';
  style.textContent=`
    .important-section{margin:8px 0 12px}
    .important-list{display:flex;flex-direction:column;gap:7px}
    .important-row{display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 11px}
    .important-row .important-icon{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:rgba(255,173,77,.13);color:var(--orange,#ffad4d);font-weight:900}
    .important-row.urgent .important-icon{background:rgba(255,109,119,.13);color:var(--red)}
    .important-row>div{min-width:0}
    .important-row strong{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .important-row small{display:block;color:var(--muted);font-size:11px;margin-top:3px}
    .important-row>span{font-size:10px;font-weight:800;padding:5px 7px;border-radius:9px;background:var(--surface-2);color:var(--muted)}
    .budget-center-summary{padding:15px;margin:10px 0 13px}
    .budget-center-summary .budget-main{font-size:27px;font-weight:900;margin:4px 0 11px}
    .budget-center-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 14px}
    .budget-category-list{display:flex;flex-direction:column;gap:8px}
    .budget-category-card{display:grid;grid-template-columns:12px minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px 12px}
    .budget-category-dot{width:10px;height:38px;border-radius:8px}
    .budget-category-card strong{display:block;font-size:14px}
    .budget-category-card small{display:block;color:var(--muted);font-size:11px;margin-top:3px}
    .budget-category-actions{display:flex;gap:6px}
    .budget-category-actions button{border:1px solid var(--border);background:var(--surface-2);color:var(--text);border-radius:10px;padding:8px 9px;font-size:12px}
    .budget-category-actions button.danger{color:var(--red)}
    .finance-budget-compact{padding:13px;margin:10px 0 12px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center}
    .finance-budget-compact strong{display:block;font-size:20px;margin-top:3px}
    .finance-budget-compact small{color:var(--muted)}
    .finance-budget-compact .budget-link{border:0;background:var(--surface-2);color:var(--primary);border-radius:12px;padding:10px 11px;font-weight:800}
    .expense-category-hint{padding:9px 10px;border-radius:11px;background:rgba(125,101,255,.09);color:var(--muted);font-size:11px;line-height:1.4;margin:8px 0 0}
    .expense-category-hint button{border:0;background:transparent;color:var(--primary);font-weight:800;padding:0}
  `;
  document.head.appendChild(style);

  function monthBudgetV25(month){return state.budgets.find(item=>item.month===month)||null}
  function budgetStatsV25(budget,month){
    const rows=monthTransactions(month),expenses=rows.filter(item=>item.type==='expense');
    const actual=expenses.filter(item=>item.settled).reduce((sum,item)=>sum+Number(item.amount||0),0);
    const planned=expenses.reduce((sum,item)=>sum+Number(item.amount||0),0);
    const allocated=(budget?.allocations||[]).reduce((sum,item)=>sum+Number(item.amount||0),0);
    const amount=Number(budget?.amount||0);
    return {rows,expenses,actual,planned,allocated,amount,free:amount-allocated,remaining:amount-actual};
  }

  function categoryUsageV25(categoryId,month=state.financeMonth){
    const budget=monthBudgetV25(month);
    const allocated=Number(budget?.allocations?.find(row=>row.category===categoryId)?.amount||0);
    const operations=state.transactions.filter(item=>item.category===categoryId).length;
    const actual=monthTransactions(month).filter(item=>item.type==='expense'&&item.category===categoryId&&item.settled).reduce((sum,item)=>sum+Number(item.amount||0),0);
    return {allocated,operations,actual};
  }

  function budgetAllocationCardsV25(budget,stats){
    if(!budget?.allocations?.length)return '<div class="card empty">Бюджет пока не распределён по статьям.</div>';
    return `<div class="allocation-list">${budget.allocations.map(row=>{
      const cat=category(row.category),actual=stats.expenses.filter(item=>item.category===row.category&&item.settled).reduce((sum,item)=>sum+Number(item.amount||0),0);
      const planned=stats.expenses.filter(item=>item.category===row.category).reduce((sum,item)=>sum+Number(item.amount||0),0);
      const allocated=Number(row.amount||0),percent=allocated?Math.round(actual/allocated*100):0;
      return `<article class="allocation-card" onclick="openBudgetEditorV25()"><div class="allocation-line"><strong>${esc(cat?.name||'Статья')}</strong><strong class="${actual>allocated?'negative':''}">${money(allocated)}</strong></div><div class="allocation-meta">План: ${money(planned)} · факт: ${money(actual)}</div><div class="progress"><span style="width:${Math.min(100,percent)}%;background:${actual>allocated?'var(--red)':cat?.color||'var(--primary)'}"></span></div></article>`;
    }).join('')}</div>`;
  }

  function openBudgetEditorV25(){
    const budget=monthBudgetV25(state.financeMonth);
    openEditor('budget',budget?.id||null);
  }
  window.openBudgetEditorV25=openBudgetEditorV25;

  function openExpenseCategoryEditorV25(id=null){openEditor('category',id,{forceType:'expense'})}
  window.openExpenseCategoryEditorV25=openExpenseCategoryEditorV25;

  function moveBudgetMonthV25(step){
    const [year,month]=state.financeMonth.split('-').map(Number);
    state.financeMonth=monthKey(new Date(year,month-1+step,1));
    save();render();
  }
  window.moveBudgetMonthV25=moveBudgetMonthV25;

  async function deleteExpenseCategoryV25(id){
    const item=state.categories.find(row=>row.id===id&&row.type==='expense');if(!item)return;
    const usage=categoryUsageV25(id);
    const approved=await askAppConfirm({
      title:'Удалить статью расходов?',
      message:`«${item.name}» будет удалена.${usage.operations?`\nОпераций со статьёй: ${usage.operations}. Они будут перенесены в «Прочее».`:''}${usage.allocated?`\nРаспределение ${money(usage.allocated)} будет перенесено в «Прочее».`:''}`,
      confirmText:'Удалить'
    });
    if(!approved)return;
    let fallback=state.categories.find(row=>row.type==='expense'&&row.id!==id&&row.id==='other-expense')||state.categories.find(row=>row.type==='expense'&&row.id!==id);
    if(!fallback){fallback={id:uid('cat'),name:'Прочее',type:'expense',color:'#98a0b3'};state.categories.push(fallback)}
    state.transactions.forEach(row=>{if(row.category===id)row.category=fallback.id});
    state.budgets.forEach(budget=>{
      const source=(budget.allocations||[]).find(row=>row.category===id);if(!source)return;
      const target=(budget.allocations||[]).find(row=>row.category===fallback.id);
      if(target)target.amount=Number(target.amount||0)+Number(source.amount||0);else source.category=fallback.id;
      budget.allocations=(budget.allocations||[]).filter((row,index,list)=>list.findIndex(other=>other.category===row.category)===index);
    });
    state.categories=state.categories.filter(row=>row.id!==id);
    save();render();toast('Статья удалена');
  }
  window.deleteExpenseCategoryV25=deleteExpenseCategoryV25;

  function renderBudgetCenterV25(){
    const budget=monthBudgetV25(state.financeMonth),stats=budgetStatsV25(budget,state.financeMonth);
    const expenseCategories=state.categories.filter(item=>item.type==='expense');
    document.querySelector('#more').innerHTML=`
      ${subnav('Бюджет','Бюджет месяца, статьи расходов и счета')}
      <div class="plan-toolbar"><button type="button" onclick="moveBudgetMonthV25(-1)">‹</button><button type="button" class="today-btn">${dateFmt(state.financeMonth+'-01',{month:'long',year:'numeric'})}</button><button type="button" onclick="moveBudgetMonthV25(1)">›</button></div>
      <article class="card budget-center-summary">
        <small>${budget?esc(budget.name):'Бюджет месяца не задан'}</small>
        <div class="budget-main">${money(stats.amount)}</div>
        <div class="budget-kpis">
          <div class="budget-kpi"><small>Распределено</small><strong>${money(stats.allocated)}</strong></div>
          <div class="budget-kpi"><small>Свободно</small><strong class="${stats.free<0?'negative':'positive'}">${money(stats.free)}</strong></div>
          <div class="budget-kpi"><small>Расход факт</small><strong class="negative">${money(stats.actual)}</strong></div>
          <div class="budget-kpi"><small>Остаток</small><strong class="${stats.remaining<0?'negative':'positive'}">${money(stats.remaining)}</strong></div>
        </div>
      </article>
      <div class="budget-center-actions">
        <button type="button" class="chip" onclick="openBudgetEditorV25()">◎ ${budget?'Изменить распределение':'Внести бюджет'}</button>
        <button type="button" class="chip" onclick="openExpenseCategoryEditorV25()">＋ Статья расходов</button>
        <button type="button" class="chip" onclick="openEditor('account')">＋ Счёт</button>
      </div>
      <div class="section-head"><h3>Распределение</h3><span class="counter">${budget?.allocations?.length||0}</span></div>
      ${budgetAllocationCardsV25(budget,stats)}
      <div class="section-head"><h3>Статьи расходов</h3><span class="counter">${expenseCategories.length}</span></div>
      <div class="budget-category-list">${expenseCategories.length?expenseCategories.map(item=>{
        const usage=categoryUsageV25(item.id);
        return `<article class="card budget-category-card"><span class="budget-category-dot" style="background:${item.color||'#98a0b3'}"></span><div onclick="openExpenseCategoryEditorV25('${item.id}')"><strong>${esc(item.name)}</strong><small>Распределено: ${money(usage.allocated)} · операций: ${usage.operations}</small></div><div class="budget-category-actions"><button type="button" onclick="openExpenseCategoryEditorV25('${item.id}')">Изм.</button><button type="button" class="danger" onclick="deleteExpenseCategoryV25('${item.id}')">Удалить</button></div></article>`;
      }).join(''):'<div class="card empty">Добавьте первую статью расходов.</div>'}</div>
      <div class="section-head"><h3>Счета</h3><span class="counter">${state.accounts.filter(item=>item.active!==false).length}</span></div>
      <div class="account-strip">${state.accounts.filter(item=>item.active!==false).map(item=>`<article class="card account-card" onclick="openEditor('account','${item.id}')"><small>${esc(item.type==='cash'?'Наличные':item.type==='card'?'Карта':'Счёт')}</small><strong>${money(accountBalance(item.id))}</strong><p style="margin:5px 0 0;color:${item.color}">${esc(item.name)}</p></article>`).join('')}</div>`;
  }
  window.renderBudgetCenterV25=renderBudgetCenterV25;

  const previousRenderMoreV25=renderMore;
  renderMore=function(){if((state.moreView||'home')==='budget')return renderBudgetCenterV25();return previousRenderMoreV25()};
  window.renderMore=renderMore;

  const previousRenderMoreHomeV25=renderMoreHome;
  renderMoreHome=function(){
    previousRenderMoreHomeV25();
    const grid=document.querySelector('#more .module-grid');
    if(grid&&!grid.querySelector('[data-module="budget"]')){
      const card=document.createElement('article');
      card.className='card module-card';card.dataset.module='budget';card.onclick=()=>openMore('budget');
      card.innerHTML='<div class="module-icon">₸</div><h3>Бюджет</h3><p>Бюджет месяца, статьи расходов, распределение и счета</p>';
      const settings=[...grid.children].find(node=>node.textContent.includes('Настройки'));
      if(settings)grid.insertBefore(card,settings);else grid.appendChild(card);
    }
    const footer=[...document.querySelectorAll('#more p')].find(node=>node.textContent.includes('Штаб AI'));
    if(footer)footer.textContent='Штаб AI · 2.5.0';
  };
  window.renderMoreHome=renderMoreHome;

  function budgetAllocationRowV25(row={}){
    return `<div class="budget-allocation-row">${sel('allocationCategory','Статья',categoryOptions('expense',row.category||''))}${f('allocationAmount','Сумма, ₸',row.amount||'','number','min="0" step="0.01"')}<button type="button" aria-label="Удалить строку" onclick="this.closest('.budget-allocation-row').remove()">×</button></div>`;
  }

  const previousEditorFieldsV25=editorFields;
  editorFields=function(type,item={},extra={}){
    if(type==='budget'){
      const budget=item||{},allocations=Array.isArray(budget.allocations)?budget.allocations:[];
      return `${f('name','Название бюджета',budget.name||'Основной бюджет','text','required')}<div class="field-row">${f('month','Месяц',budget.month||state.financeMonth,'month','required')}${f('amount','Общий бюджет, ₸',budget.amount||'','number','required min="0" step="0.01"')}</div><div class="budget-editor-note">Здесь распределяется уже заданный бюджет. Статьи расходов создаются, редактируются и удаляются в разделе «Еще → Бюджет».</div><label class="field"><span>Распределение по статьям</span><div id="budget-allocation-list" class="budget-allocation-list">${allocations.map(row=>budgetAllocationRowV25(row)).join('')}</div></label><button type="button" class="secondary budget-add-row" onclick="addBudgetAllocationRow()">＋ Добавить строку распределения</button>`;
    }
    if(type==='category'&&extra?.forceType==='expense')return `${f('name','Название статьи расходов',item?.name||'','text','required')}<input type="hidden" name="type" value="expense">${f('color','Цвет',item?.color||'#ffad4d','color')}`;
    const html=previousEditorFieldsV25(type,item||{},extra||{});
    if(type==='expense')return `${html}<div class="expense-category-hint">Статьи расходов настраиваются в разделе <button type="button" onclick="closeDialog('editor-dialog');openMore('budget')">Еще → Бюджет</button>.</div>`;
    return html;
  };
  window.editorFields=editorFields;

  renderFinance=function(){
    const list=monthTransactions(state.financeMonth),budget=monthBudgetV25(state.financeMonth),stats=budgetStatsV25(budget,state.financeMonth);
    const income=list.filter(item=>item.type==='income'&&item.settled).reduce((sum,item)=>sum+Number(item.amount||0),0);
    const totalBalance=state.accounts.filter(item=>item.active!==false).reduce((sum,item)=>sum+accountBalance(item.id),0);
    document.querySelector('#finance').innerHTML=`
      <div class="plan-toolbar"><button type="button" onclick="moveFinanceMonth(-1)">‹</button><button type="button" class="today-btn">${dateFmt(state.financeMonth+'-01',{month:'long',year:'numeric'})}</button><button type="button" onclick="moveFinanceMonth(1)">›</button></div>
      <article class="card finance-budget-compact"><div><small>${budget?'Бюджет месяца':'Бюджет не задан'}</small><strong>${money(stats.remaining)}</strong><small>остаток из ${money(stats.amount)} · факт расходов ${money(stats.actual)}</small></div><button type="button" class="budget-link" onclick="openMore('budget')">Настроить</button></article>
      <div class="finance-hero"><small>Общий остаток по счетам</small><div class="money-main">${money(totalBalance)}</div><div class="money-row"><div class="money-mini"><span>Доход факт</span><strong class="positive">${money(income)}</strong></div><div class="money-mini"><span>Расход факт</span><strong class="negative">${money(stats.actual)}</strong></div></div><p class="muted" style="margin:12px 0 0">Запланировано расходов: ${money(stats.planned)}</p></div>
      <div class="chips"><button type="button" class="chip" onclick="openEditor('income')">＋ Доход</button><button type="button" class="chip" onclick="openEditor('expense')">− Расход</button><button type="button" class="chip" onclick="openMore('budget')">◎ Бюджет</button></div>
      <div class="section-head"><h3>Операции</h3><span class="counter">${list.length}</span></div>
      ${list.length?list.sort((a,b)=>b.occurrenceDate.localeCompare(a.occurrenceDate)).map(item=>transactionCard(item,item.occurrenceDate)).join(''):'<div class="card empty">Операций пока нет.</div>'}`;
  };
  window.renderFinance=renderFinance;

  function importantItemsV25(){
    const key=dayKey(today),now=new Date(),items=[],used=new Set();
    state.tasks.forEach(task=>{
      if(task.status==='archived'||task.status==='completed')return;
      const end=task.endDate||task.date||key;
      if(end<key&&!used.has(task.id)){items.push({id:task.id,kind:'task',urgent:true,title:task.title,meta:`Просрочено с ${dateFmt(end,{day:'2-digit',month:'2-digit'})}`,action:`openEditor('task','${task.id}')`,sort:0});used.add(task.id)}
    });
    tasksForDate(key).filter(task=>!taskDone(task,key)).forEach(task=>{
      if(used.has(task.id))return;
      const due=dateTime(key,task.time||'23:59'),urgent=due<now;
      if(urgent||task.priority==='high'){items.push({id:task.id,kind:'task',urgent,title:task.title,meta:`${task.kind==='trip'?'Командировка':task.kind==='assignment'?'Поручение':'Задача'} · ${task.time||'без времени'}`,action:`openEditor('task','${task.id}')`,sort:urgent?1:2});used.add(task.id)}
    });
    transactionsForDate(key).filter(item=>item.type==='expense'&&!txSettled(item,key)).forEach(item=>items.push({id:item.id,kind:'finance',urgent:true,title:category(item.category)?.name||item.note||'Платёж',meta:`Оплатить сегодня · ${money(item.amount)}`,action:`openEditor('expense','${item.id}')`,sort:1}));
    return items.sort((a,b)=>a.sort-b.sort).slice(0,3);
  }

  function importantSectionV25(){
    const items=importantItemsV25();if(!items.length)return '';
    return `<section class="important-section"><div class="section-head"><h3>${items.some(item=>item.urgent)?'Срочное':'Важное'}</h3><button type="button" class="text-action" onclick="setPage('plan')">Открыть план</button></div><div class="important-list">${items.map(item=>`<article class="card important-row ${item.urgent?'urgent':''}" onclick="${item.action}"><span class="important-icon">${item.kind==='finance'?'₸':item.urgent?'!':'⚑'}</span><div><strong>${esc(item.title)}</strong><small>${esc(item.meta)}</small></div><span>${item.urgent?'Срочно':'Важно'}</span></article>`).join('')}</div></section>`;
  }

  const previousRenderTodayV25=renderToday;
  renderToday=function(){
    previousRenderTodayV25();
    const root=document.querySelector('#today');
    root.querySelector('.today-compact-summary')?.remove();
    root.insertAdjacentHTML('afterbegin',importantSectionV25());
  };
  window.renderToday=renderToday;

  function normalizeButtonsV25(root=document){
    root.querySelectorAll('button:not([type])').forEach(button=>{button.type=button.closest('form')&&button.classList.contains('send')?'submit':'button'});
  }
  const previousRenderV25=render;
  render=function(){previousRenderV25();normalizeButtonsV25()};
  window.render=render;
  normalizeButtonsV25();

  window.__shtabDiagnostics={...(window.__shtabDiagnostics||{}),importantItems:()=>importantItemsV25().map(item=>({...item})),expenseCategoryIds:()=>state.categories.filter(item=>item.type==='expense').map(item=>item.id)};
  render();
})();
//# sourceURL=chunk16.js
