(function(){
  state.analyticsRange=[7,30,90].includes(Number(state.analyticsRange))?Number(state.analyticsRange):30;
  const TODAY_KEY=dayKey(today);
  const taskKindLabelsV26={task:'Задача',assignment:'Поручение',trip:'Командировка',event:'Событие'};

  const style=document.createElement('style');
  style.id='v26-core-styles';
  style.textContent=`
    #fab{display:none!important}
    .section-head.v26{gap:10px;align-items:center}
    .section-head.v26 h3{flex:1;min-width:0}
    .section-tools{display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end}
    .section-add{border:1px solid var(--border);background:var(--surface-2);color:var(--primary);border-radius:11px;padding:7px 9px;font-size:12px;font-weight:800;line-height:1}
    .section-add.primary-add{background:rgba(125,101,255,.14)}
    .tx-state-note{display:flex;gap:10px;align-items:flex-start;padding:11px 12px;border-radius:13px;background:var(--surface-2);margin:9px 0 11px}
    .tx-state-note .tx-state-icon{width:31px;height:31px;border-radius:10px;display:grid;place-items:center;background:rgba(125,101,255,.14);color:var(--primary);font-weight:900;flex:0 0 auto}
    .tx-state-note strong{display:block;font-size:13px}
    .tx-state-note small{display:block;color:var(--muted);font-size:11px;line-height:1.35;margin-top:3px}
    .tx-reminder-panel{padding:11px;border:1px solid var(--border);border-radius:14px;margin:8px 0}
    .tx-reminder-panel[hidden],.tx-reminder-toggle[hidden]{display:none!important}
    .tx-details{border:1px solid var(--border);border-radius:14px;padding:0 11px;margin-top:10px}
    .tx-details summary{padding:12px 0;font-weight:800;font-size:13px;cursor:pointer}
    .tx-details .field{margin:0 0 11px}
    .transaction.v26{grid-template-columns:38px minmax(0,1fr) auto auto;align-items:center}
    .transaction.v26 .tx-main{min-width:0}
    .transaction.v26 .tx-main h4{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .tx-status{display:inline-flex;margin-top:5px;padding:4px 7px;border-radius:8px;font-size:10px;font-weight:800;background:var(--surface-2);color:var(--muted)}
    .tx-status.planned{color:#ffad4d;background:rgba(255,173,77,.12)}
    .tx-status.actual{color:#37cf7b;background:rgba(55,207,123,.12)}
    #transaction-actions-dialog{width:min(100% - 18px,520px);max-width:520px;margin:auto auto 8px;border:0;border-radius:24px 24px 18px 18px;padding:0;background:var(--surface);color:var(--text)}
    #transaction-actions-dialog::backdrop{background:rgba(0,0,0,.62);backdrop-filter:blur(2px)}
    @media(max-width:360px){.transaction.v26{grid-template-columns:34px minmax(0,1fr) auto}.transaction.v26>strong{grid-column:2/3}}
  `;
  document.head.appendChild(style);

  function sectionHeadV26(title,count,buttons=[]){
    return `<div class="section-head v26"><h3>${esc(title)}</h3>${count===null||count===undefined?'':`<span class="counter">${count}</span>`}<div class="section-tools">${buttons.map(button=>`<button type="button" class="section-add ${button.primary?'primary-add':''}" data-local-add="${esc(button.type||'action')}" onclick="${button.action}">${esc(button.label)}</button>`).join('')}</div></div>`;
  }
  window.sectionHeadV26=sectionHeadV26;
  window.taskKindLabelsV26=taskKindLabelsV26;

  function openEditorV26(type,id=null,extra=null){
    editor={type,id,extra:extra||{}};
    const item=getEntity(type,id)||{},dialog=document.querySelector('#editor-dialog'),fields=document.querySelector('#editor-fields'),error=document.querySelector('#editor-error');
    if(!dialog||!fields||!error){toast('Редактор недоступен');return}
    error.hidden=true;
    document.querySelector('#editor-kicker').textContent=id?'Редактирование':'Создание';
    document.querySelector('#editor-title').textContent=editorTitle(type,id);
    document.querySelector('#editor-submit').textContent=id?'Сохранить':'Создать';
    const allowDelete=id&&!['expense','income'].includes(type);
    try{
      fields.innerHTML=editorFields(type,item,extra||{})+(allowDelete?`<button type="button" class="secondary danger-btn" style="width:100%;margin-top:14px" onclick="deleteEntity('${type}','${id}');closeDialog('editor-dialog')">Удалить</button>`:'');
      if(!id&&extra?.date){
        const dateInput=fields.querySelector('[name=date]');if(dateInput)dateInput.value=extra.date;
        const endInput=fields.querySelector('[name=endDate]');if(endInput)endInput.value=extra.date;
      }
      try{if(!dialog.open)dialog.showModal()}catch{dialog.setAttribute('open','')}
      if(type==='expense'||type==='income')setTimeout(refreshTransactionFormV26,0);
      setTimeout(()=>fields.querySelector('input:not([type=hidden]),textarea,select')?.focus(),100);
    }catch(openError){
      console.error('Editor open error',type,openError);error.textContent='Не удалось открыть форму.';error.hidden=false;
      try{if(!dialog.open)dialog.showModal()}catch{dialog.setAttribute('open','')}
    }
  }
  openEditor=openEditorV26;window.openEditor=openEditorV26;

  const previousEditorFieldsV26=editorFields;
  function transactionFieldsV26(type,item={},extra={}){
    const date=item.date||extra.date||TODAY_KEY,isFuture=date>TODAY_KEY,status=item.status||(isFuture?'planned':'actual');
    const repeat=item.recurrence?.type||'none',notifyEnabled=item.notifyEnabled!==undefined?Boolean(item.notifyEnabled):Boolean(item.reminders?.length);
    const categoryLabel=type==='expense'?'Статья расходов':'Источник дохода';
    const stateTitle=status==='actual'?(type==='expense'?'Будет учтено как оплаченный расход':'Будет учтено как полученный доход'):(type==='expense'?'Будет сохранено как запланированный расход':'Будет сохранено как ожидаемый доход');
    return `<input type="hidden" name="status" value="${esc(status)}">
      ${f('amount','Сумма, ₸',item.amount||'','number','required min="0.01" step="0.01"')}
      <div class="field-row">${f('date','Дата',date,'date','required onchange="refreshTransactionFormV26()"')}${sel('account','Счёт',accountOptions(item.account||state.accounts[0]?.id))}</div>
      ${sel('category',categoryLabel,categoryOptions(type,item.category||''))}${ta('note','Комментарий',item.note||'',3)}
      <div class="tx-state-note" id="tx-state-note"><span class="tx-state-icon">${status==='actual'?'✓':'◷'}</span><div><strong id="tx-state-title">${esc(stateTitle)}</strong><small id="tx-state-help">${status==='actual'?'Время и напоминание для фактической операции не требуются.':'Напоминание можно включить отдельно.'}</small></div></div>
      <label class="check-option tx-reminder-toggle" id="tx-reminder-toggle"><input type="checkbox" name="notifyEnabled" ${notifyEnabled?'checked':''} onchange="refreshTransactionFormV26()"><span>${type==='expense'?'Напомнить об оплате':'Напомнить о поступлении'}</span></label>
      <div class="tx-reminder-panel" id="tx-reminder-panel" ${notifyEnabled?'':'hidden'}>${f('time','Время напоминания',item.time||'09:00','time')}<label class="field"><span>Когда напомнить</span>${reminderGrid(item.reminders?.length?item.reminders:[1440,60])}</label></div>
      <details class="tx-details" ${repeat!=='none'?'open':''}><summary>Повторение</summary>${sel('repeat','Повторять',repeatOptions(repeat))}</details>`;
  }

  editorFields=function(type,item={},extra={}){
    if(type==='expense'||type==='income')return transactionFieldsV26(type,item||{},extra||{});
    return previousEditorFieldsV26(type,item||{},extra||{});
  };
  window.editorFields=editorFields;

  function refreshTransactionFormV26(){
    const form=document.querySelector('#editor-form');if(!form||!['expense','income'].includes(editor.type))return;
    const date=String(form.elements.date?.value||TODAY_KEY),repeat=String(form.elements.repeat?.value||'none'),hiddenStatus=form.elements.status;
    if(!editor.id&&hiddenStatus)hiddenStatus.value=date>TODAY_KEY?'planned':'actual';
    const status=String(hiddenStatus?.value||'planned'),isActual=status==='actual',type=editor.type;
    const title=document.querySelector('#tx-state-title'),help=document.querySelector('#tx-state-help'),icon=document.querySelector('#tx-state-note .tx-state-icon');
    if(title)title.textContent=isActual?(type==='expense'?'Будет учтено как оплаченный расход':'Будет учтено как полученный доход'):(type==='expense'?'Будет сохранено как запланированный расход':'Будет сохранено как ожидаемый доход');
    if(help)help.textContent=isActual?'Время и напоминание для фактической операции не требуются.':(date<TODAY_KEY?'Срок прошёл. Операция останется в плане, пока вы не отметите её выполненной.':'Напоминание можно включить отдельно.');
    if(icon)icon.textContent=isActual?'✓':'◷';
    const allowReminder=!isActual||repeat!=='none',toggle=document.querySelector('#tx-reminder-toggle'),checkbox=form.elements.notifyEnabled,panel=document.querySelector('#tx-reminder-panel');
    if(toggle)toggle.hidden=!allowReminder;if(!allowReminder&&checkbox)checkbox.checked=false;if(panel)panel.hidden=!(allowReminder&&checkbox?.checked);
  }
  window.refreshTransactionFormV26=refreshTransactionFormV26;

  const previousSubmitEditorV26=submitEditor;
  submitEditor=function(form){
    if(editor.type==='expense'||editor.type==='income'){
      const fd=new FormData(form),get=key=>String(fd.get(key)||'').trim(),num=key=>Number(fd.get(key)||0);
      const amount=num('amount'),date=get('date'),accountId=get('account'),categoryId=get('category');
      if(!(amount>0)){showEditorError('Укажите сумму больше нуля.');return}if(!date){showEditorError('Укажите дату.');return}if(!accountId){showEditorError('Выберите счёт.');return}if(!categoryId){showEditorError(editor.type==='expense'?'Выберите статью расходов.':'Выберите источник дохода.');return}
      const existing=editor.id?state.transactions.find(item=>item.id===editor.id):null;
      const notifyEnabled=Boolean(form.elements.notifyEnabled?.checked&&!document.querySelector('#tx-reminder-toggle')?.hidden);
      const data={type:editor.type,amount,date,account:accountId,category:categoryId,status:get('status')||(date>TODAY_KEY?'planned':'actual'),time:notifyEnabled?(get('time')||'09:00'):'09:00',recurrence:{type:get('repeat')||'none',interval:1},note:get('note'),notifyEnabled,reminders:notifyEnabled?checkedReminders(form):[],settledDates:existing?.settledDates||[],createdAt:existing?.createdAt||Date.now()};
      if(existing)Object.assign(existing,data);else state.transactions.push({...data,id:uid('tx')});
      save();closeDialog('editor-dialog');toast(editor.type==='expense'?'Расход сохранён':'Доход сохранён');render();return;
    }
    previousSubmitEditorV26(form);
  };
  window.submitEditor=submitEditor;

  function toggleTransactionSettlementV26(id,key){
    const tx=state.transactions.find(item=>item.id===id);if(!tx)return;const settled=txSettled(tx,key);
    if((tx.recurrence?.type||'none')==='none')tx.status=settled?'planned':'actual';else{tx.settledDates=tx.settledDates||[];tx.settledDates=settled?tx.settledDates.filter(item=>item!==key):[...tx.settledDates,key]}
    save();render();toast(settled?'Возвращено в план':(tx.type==='expense'?'Отмечено оплаченным':'Отмечено полученным'));
  }
  window.toggleTransactionSettlementV26=toggleTransactionSettlementV26;

  function ensureTransactionActionsDialogV26(){
    let dialog=document.querySelector('#transaction-actions-dialog');if(dialog)return dialog;
    dialog=document.createElement('dialog');dialog.id='transaction-actions-dialog';dialog.innerHTML='<div class="task-sheet"><div class="task-sheet-handle"></div><div class="task-sheet-head"><div><small>Действия с операцией</small><h3 id="tx-sheet-title"></h3><p id="tx-sheet-meta"></p></div><button type="button" class="close-btn" data-tx-action="cancel">×</button></div><div class="task-actions-grid" id="tx-actions-grid"></div><button type="button" class="task-sheet-cancel" data-tx-action="cancel">Отмена</button></div>';
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});document.body.appendChild(dialog);return dialog;
  }
  function runTransactionActionV26(action){
    const context=window.__txActionContextV26,dialog=document.querySelector('#transaction-actions-dialog');if(action==='cancel'){dialog?.close();return}if(!context)return;
    const tx=state.transactions.find(item=>item.id===context.id);if(!tx){dialog?.close();return}dialog?.close();
    if(action==='edit'){setTimeout(()=>openEditor(tx.type,tx.id),70);return}if(action==='settle'){toggleTransactionSettlementV26(tx.id,context.key);return}
    if(action==='duplicate'){const copy=JSON.parse(JSON.stringify(tx));copy.id=uid('tx');copy.note=(tx.note||category(tx.category)?.name||'Операция')+' — копия';copy.status='planned';copy.settledDates=[];copy.createdAt=Date.now();state.transactions.push(copy);save();render();toast('Копия операции создана');return}
    if(action==='delete')setTimeout(()=>deleteEntity(tx.type,tx.id),50);
  }
  function transactionMenuV26(id,key){
    const tx=state.transactions.find(item=>item.id===id);if(!tx)return;window.__txActionContextV26={id,key};const dialog=ensureTransactionActionsDialogV26(),settled=txSettled(tx,key);
    dialog.querySelector('#tx-sheet-title').textContent=category(tx.category)?.name||tx.note||(tx.type==='expense'?'Расход':'Доход');dialog.querySelector('#tx-sheet-meta').textContent=`${money(tx.amount)} · ${dateFmt(key,{day:'numeric',month:'long'})}`;
    dialog.querySelector('#tx-actions-grid').innerHTML=`<button type="button" class="task-action" data-tx-action="edit"><span>✎</span><b>Изменить</b></button><button type="button" class="task-action" data-tx-action="settle"><span>${settled?'↶':'✓'}</span><b>${settled?'Вернуть в план':tx.type==='expense'?'Оплачено':'Получено'}</b></button><button type="button" class="task-action" data-tx-action="duplicate"><span>⧉</span><b>Дублировать</b></button><button type="button" class="task-action danger" data-tx-action="delete"><span>×</span><b>Удалить</b></button>`;
    dialog.querySelectorAll('[data-tx-action]').forEach(button=>button.onclick=()=>runTransactionActionV26(button.dataset.txAction));try{if(!dialog.open)dialog.showModal()}catch{dialog.setAttribute('open','')}
  }
  window.transactionMenuV26=transactionMenuV26;

  transactionCard=function(tx,key){
    const cat=category(tx.category),settled=txSettled(tx,key),planned=!settled,title=cat?.name||tx.note||'Операция';
    const meta=[dateFmt(key,{day:'2-digit',month:'2-digit'}),account(tx.account)?.name||'',planned&&tx.notifyEnabled?`🔔 ${tx.time||'09:00'}`:''].filter(Boolean).join(' · ');
    return `<article class="card transaction v26"><div class="tx-icon" style="color:${cat?.color||'#aaa'}">${tx.type==='income'?'+':'−'}</div><div class="tx-main" onclick="openEditor('${tx.type}','${tx.id}')"><h4>${esc(title)}</h4><p>${esc(meta)}</p><span class="tx-status ${planned?'planned':'actual'}">${planned?'Запланировано':tx.type==='expense'?'Оплачено':'Получено'}</span></div><strong class="${tx.type==='income'?'positive':'negative'}">${tx.type==='income'?'+':'−'}${money(tx.amount)}</strong><button type="button" class="menu-btn" onclick="event.stopPropagation();transactionMenuV26('${tx.id}','${key}')">⋮</button></article>`;
  };
  window.transactionCard=transactionCard;

  const previousToggleTaskV26=toggleTask;
  toggleTask=function(id,key){
    const task=state.tasks.find(item=>item.id===id);if(!task)return;const isPeriod=(task.recurrence?.type||'none')==='none'&&(task.endDate||task.date)>task.date;if(!isPeriod)return previousToggleTaskV26(id,key);
    task.completedDates=task.completedDates||[];task.completedDates=task.completedDates.includes(key)?task.completedDates.filter(item=>item!==key):[...task.completedDates,key];
    const start=new Date(task.date+'T12:00:00'),end=new Date((task.endDate||task.date)+'T12:00:00'),all=[];for(let date=new Date(start);date<=end;date=addDays(date,1))all.push(dayKey(date));task.status=all.every(item=>task.completedDates.includes(item))?'completed':'active';save();render();
  };
  window.toggleTask=toggleTask;

  function monthBudgetV26(month){return state.budgets.find(item=>item.month===month)||null}
  function budgetStatsV26(budget,month){const rows=monthTransactions(month),expenses=rows.filter(item=>item.type==='expense'),actual=expenses.filter(item=>item.settled).reduce((sum,item)=>sum+Number(item.amount||0),0),planned=expenses.reduce((sum,item)=>sum+Number(item.amount||0),0),allocated=(budget?.allocations||[]).reduce((sum,item)=>sum+Number(item.amount||0),0),amount=Number(budget?.amount||0);return {rows,expenses,actual,planned,allocated,amount,free:amount-allocated,remaining:amount-actual}}
  window.monthBudgetV26=monthBudgetV26;window.budgetStatsV26=budgetStatsV26;
})();
//# sourceURL=chunk17.js