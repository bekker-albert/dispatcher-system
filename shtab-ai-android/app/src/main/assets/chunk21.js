(function(){
  function txTitleV271(tx){return tx.type==='income'?(tx.sourceName||tx.note||category(tx.category)?.name||'Доход'):(category(tx.category)?.name||tx.note||'Расход')}
  transactionMenuV27=function(id,key){
    const tx=state.transactions.find(x=>x.id===id);if(!tx)return;
    transactionMenuV26(id,key);
    const dialog=document.querySelector('#transaction-actions-dialog');if(!dialog)return;
    dialog.querySelector('#tx-sheet-title').textContent=txTitleV271(tx);
    if(txSettled(tx,key))dialog.querySelector('[data-tx-action="settle"]')?.remove();
  };
  window.transactionMenuV27=transactionMenuV27;

  function allocationCardsV271(budget,stats){
    if(!budget?.allocations?.length)return '<div class="card empty">Бюджет пока не распределён по статьям.</div>';
    return `<div class="allocation-list">${budget.allocations.map(row=>{const cat=category(row.category),actual=stats.expenses.filter(x=>x.category===row.category&&x.settled).reduce((s,x)=>s+Number(x.amount||0),0),planned=stats.expenses.filter(x=>x.category===row.category).reduce((s,x)=>s+Number(x.amount||0),0),allocated=Number(row.amount||0),pct=allocated?Math.round(actual/allocated*100):0;return `<article class="allocation-card" onclick="openEditor('budgetAllocation','${budget.id}')"><div class="allocation-line"><strong>${esc(cat?.name||'Статья')}</strong><strong class="${actual>allocated?'negative':''}">${money(allocated)}</strong></div><div class="allocation-meta">План: ${money(planned)} · факт: ${money(actual)}</div><div class="progress"><span style="width:${Math.min(100,pct)}%;background:${actual>allocated?'var(--red)':cat?.color||'var(--primary)'}"></span></div></article>`}).join('')}</div>`;
  }

  function renderFinanceV271(){
    const list=monthTransactions(state.financeMonth),budget=monthBudgetV26(state.financeMonth),stats=budgetStatsV26(budget,state.financeMonth),income=list.filter(x=>x.type==='income'&&x.settled).reduce((s,x)=>s+Number(x.amount||0),0),totalBalance=state.accounts.filter(x=>x.active!==false).reduce((s,x)=>s+accountBalance(x.id),0);
    document.querySelector('#finance').innerHTML=`<div class="plan-toolbar"><button type="button" onclick="moveFinanceMonth(-1)">‹</button><button type="button" class="today-btn">${dateFmt(state.financeMonth+'-01',{month:'long',year:'numeric'})}</button><button type="button" onclick="moveFinanceMonth(1)">›</button></div><article class="card budget-center-summary"><small>${budget?esc(budget.name):'Бюджет месяца не внесён'}</small><div class="budget-main">${money(stats.amount)}</div><div class="budget-kpis"><div class="budget-kpi"><small>Распределено</small><strong>${money(stats.allocated)}</strong></div><div class="budget-kpi"><small>Свободно</small><strong>${money(stats.free)}</strong></div><div class="budget-kpi"><small>Расход факт</small><strong>${money(stats.actual)}</strong></div><div class="budget-kpi"><small>Остаток</small><strong>${money(stats.remaining)}</strong></div></div></article><div class="finance-actions-v27"><button type="button" class="primary" onclick="openEditor('budgetAmount','${budget?.id||''}')">${budget?'Изменить бюджет':'Внести бюджет'}</button><button type="button" onclick="${budget?`openEditor('budgetAllocation','${budget.id}')`:`toast('Сначала внесите бюджет')`}">Распределить</button></div><div class="budget-detail-v27">${sectionHeadV26('Исполнение по статьям',budget?.allocations?.length||0,[])}${allocationCardsV271(budget,stats)}</div><div class="finance-hero"><small>Общий остаток по счетам</small><div class="money-main">${money(totalBalance)}</div><div class="money-row"><div class="money-mini"><span>Доход факт</span><strong class="positive">${money(income)}</strong></div><div class="money-mini"><span>Расход факт</span><strong class="negative">${money(stats.actual)}</strong></div></div></div>${sectionHeadV26('Операции',list.length,[{label:'＋ расход',action:"openEditor('expense')",type:'expense',primary:true},{label:'＋ доход',action:"openEditor('income')",type:'income'}])}${list.length?list.sort((a,b)=>b.occurrenceDate.localeCompare(a.occurrenceDate)).map(x=>transactionCard(x,x.occurrenceDate)).join(''):'<div class="card empty">Операций пока нет.</div>'}`;
  }
  window.renderFinanceV271=renderFinanceV271;
  const previousRenderV271=render;
  render=function(){previousRenderV271();if(page==='finance')renderFinanceV271()};
  window.render=render;
  render();
})();
//# sourceURL=chunk21.js