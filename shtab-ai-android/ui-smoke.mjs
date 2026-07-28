import fs from 'node:fs';
import path from 'node:path';
import {JSDOM,VirtualConsole} from 'jsdom';

const root=path.resolve('app/src/main/assets');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script[^>]+src="[^"]+"[^>]*><\/script>/g,'');
const javaSource=fs.readFileSync(path.resolve('app/src/main/java/kz/shtabai/app/MainActivity.java'),'utf8');
const virtualConsole=new VirtualConsole();
const errors=[];
virtualConsole.on('jsdomError',error=>errors.push(String(error.message||error)));
virtualConsole.on('error',error=>errors.push(String(error)));
const dom=new JSDOM(html,{url:'https://shtab-ai.local/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole});
const {window}=dom;
window.console.error=(...args)=>errors.push(args.map(String).join(' '));
window.confirm=()=>{throw new Error('Native browser confirm must not be used')};
window.prompt=()=>{throw new Error('Native browser prompt must not be used')};
window.alert=()=>{};
window.requestAnimationFrame=callback=>setTimeout(callback,0);
window.HTMLElement.prototype.scrollIntoView=function(){};
window.HTMLElement.prototype.showModal=function(){this.open=true;this.setAttribute('open','')};
window.HTMLElement.prototype.close=function(){this.open=false;this.removeAttribute('open')};
Object.defineProperty(window.navigator,'clipboard',{value:{writeText:async()=>{}},configurable:true});
let initialPermissionRequests=0;
window.Android={requestInitialPermissions(){initialPermissionRequests++},requestNotifications(){},requestExactAlarmPermission(){},scheduleNotification(){},cancelNotification(){},startVoiceInput(){setTimeout(()=>window.onVoiceError?.('Тестовый режим'),0)},speak(){},showToast(){}};

const scripts=Array.from({length:20},(_,index)=>fs.readFileSync(path.join(root,`chunk${index+1}.js`),'utf8')).join('\n;\n');
try{window.eval(scripts)}catch(error){errors.push(`initialization: ${error.stack||error}`)}
const wait=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const run=async(name,fn)=>{try{await fn();process.stdout.write(`✓ ${name}\n`)}catch(error){errors.push(`${name}: ${error.stack||error}`);process.stdout.write(`✕ ${name}\n`)}};
const iso=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const now=new Date(),todayKey=iso(now),yesterdayKey=iso(new Date(now.getFullYear(),now.getMonth(),now.getDate()-1)),tomorrowKey=iso(new Date(now.getFullYear(),now.getMonth(),now.getDate()+1)),tripEndKey=iso(new Date(now.getFullYear(),now.getMonth(),now.getDate()+3));

function auditButtons(rootNode=window.document){rootNode.querySelectorAll('button').forEach(button=>assert(Boolean(button.getAttribute('type')),`Button without explicit type: ${button.textContent.trim().slice(0,40)}`))}
function auditInlineHandlers(rootNode=window.document){
  const ignored=new Set(['if','for','while','switch','catch','function','setTimeout']);
  rootNode.querySelectorAll('[onclick]').forEach(element=>{
    const code=element.getAttribute('onclick')||'';
    for(const match of code.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)\s*\(/g)){
      const name=match[1];if(ignored.has(name))continue;
      let value;try{value=window.eval(name)}catch{value=undefined}
      assert(typeof value==='function',`Unresolved onclick function ${name}: ${code}`);
    }
  });
}

await run('navigation architecture and assistant placement',async()=>{
  const nav=[...window.document.querySelectorAll('.nav-item')];
  assert(nav.length===5,'Bottom navigation must contain five items');
  assert(nav.map(item=>item.dataset.page).join(',')==='today,plan,analytics,finance,more','Bottom navigation order is incorrect');
  assert(!nav.some(item=>item.dataset.page==='assistant'),'Assistant remains in bottom navigation');
  const assistant=window.document.querySelector('#assistant-btn');
  assert(assistant&&assistant.textContent.includes('✦'),'Recognizable assistant icon is missing in top bar');
  assistant.click();assert(window.document.querySelector('#assistant').classList.contains('active'),'Top assistant button did not open assistant');
  window.setPage('today');auditButtons();auditInlineHandlers();
});

await run('first launch requests only required Android permissions',async()=>{
  await wait(650);
  assert(initialPermissionRequests===1,'Initial permission request was not triggered exactly once');
  assert(javaSource.includes('Manifest.permission.POST_NOTIFICATIONS'),'Notification permission is not requested');
  assert(javaSource.includes('Manifest.permission.RECORD_AUDIO'),'Microphone permission is not requested');
  assert(javaSource.includes('ACTION_REQUEST_SCHEDULE_EXACT_ALARM'),'Exact reminder permission is not requested');
  assert(!javaSource.includes('ACCESS_FINE_LOCATION')&&!javaSource.includes('READ_CONTACTS'),'Unnecessary sensitive permissions are requested');
});

await run('Today notes are full width and contextual additions remain',async()=>{
  window.setPage('today');const today=window.document.querySelector('#today');
  const styleText=[...window.document.querySelectorAll('style')].map(node=>node.textContent).join('\n');
  assert(styleText.includes('.today-notes{grid-template-columns:1fr!important}'),'Notes layout is not full width');
  assert(today.querySelector('.today-notes'),'Notes container is missing');
  for(const type of ['task','note','expense','income','workout'])assert(today.querySelector(`[data-local-add="${type}"]`),`Contextual add is missing: ${type}`);
});

await run('confirmed past expense cannot be returned to plan',async()=>{
  window.openEditor('expense');await wait(20);let form=window.document.querySelector('#editor-form');
  form.elements.amount.value='1234';form.elements.date.value=yesterdayKey;window.refreshTransactionFormV26();form.elements.note.value='Проверенный прошлый расход';
  form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
  const expense=window.__shtabDiagnostics.transactionByNote('Проверенный прошлый расход');assert(expense?.status==='actual','Past expense was not saved as actual');
  window.transactionMenuV26(expense.id,yesterdayKey);const sheet=window.document.querySelector('#transaction-actions-dialog');
  assert(sheet?.open,'Transaction menu did not open');assert(!sheet.querySelector('[data-tx-action="settle"]'),'Confirmed expense still has return-to-plan action');assert(!sheet.textContent.includes('Вернуть в план'),'Return-to-plan wording remains');
  sheet.querySelector('[data-tx-action="cancel"]').click();
});

await run('future expense can be confirmed once',async()=>{
  window.openEditor('expense');await wait(20);const form=window.document.querySelector('#editor-form');
  form.elements.amount.value='25000';form.elements.date.value=tomorrowKey;window.refreshTransactionFormV26();form.elements.note.value='Будущий расход';
  form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
  const expense=window.__shtabDiagnostics.transactionByNote('Будущий расход');assert(expense?.status==='planned','Future expense was not saved as planned');
  window.transactionMenuV26(expense.id,tomorrowKey);let sheet=window.document.querySelector('#transaction-actions-dialog');assert(sheet.querySelector('[data-tx-action="settle"]'),'Future expense has no confirmation action');
  sheet.querySelector('[data-tx-action="settle"]').click();assert(window.__shtabDiagnostics.transactionByNote('Будущий расход')?.status==='actual','Expense was not confirmed');
  window.transactionMenuV26(expense.id,tomorrowKey);sheet=window.document.querySelector('#transaction-actions-dialog');assert(!sheet.querySelector('[data-tx-action="settle"]'),'Confirmed future expense can still be reversed');sheet.querySelector('[data-tx-action="cancel"]').click();
});

await run('income requires manual source and has no repetition',async()=>{
  window.openEditor('income');await wait(20);const dialog=window.document.querySelector('#editor-dialog'),form=window.document.querySelector('#editor-form');
  assert(form.elements.sourceName,'Manual income source field is missing');assert(!form.elements.repeat&&!dialog.textContent.includes('Повторение'),'Income repetition controls remain');
  form.elements.sourceName.value='Заработная плата';form.elements.amount.value='500000';form.elements.date.value=todayKey;window.refreshTransactionFormV26();
  form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
  const income=window.__shtabDiagnostics.transactionBySource('Заработная плата');assert(income?.sourceName==='Заработная плата','Income source was not saved');assert((income.recurrence?.type||'none')==='none','Income was saved as recurring');
  window.setPage('finance');assert(window.document.querySelector('#finance').textContent.includes('Заработная плата'),'Income source is not shown as operation title');
});

await run('budget amount and allocation are separate forms',async()=>{
  window.setPage('finance');const finance=window.document.querySelector('#finance');assert(finance.querySelector('[data-local-add="budget"]'),'Budget input action is missing');
  window.openBudgetAmountV27();await wait(20);let form=window.document.querySelector('#editor-form');
  assert(form.elements.amount&&form.elements.month,'Budget amount form is incomplete');assert(!window.document.querySelector('#budget-allocation-list'),'Allocation leaked into budget amount form');
  form.elements.name.value='Бюджет проверки';form.elements.amount.value='1000000';form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
  const month=window.eval('state.financeMonth'),budget=window.__shtabDiagnostics.financeBudget(month);assert(budget?.amount===1000000,'Budget amount was not saved');
  window.openBudgetAllocationV27();await wait(20);form=window.document.querySelector('#editor-form');
  assert(form.elements.budgetId,'Allocation form is not linked to budget');assert(!form.elements.amount&&!form.elements.month,'Budget amount fields leaked into allocation form');
  const list=window.document.querySelector('#budget-allocation-list');list.innerHTML='';window.addBudgetAllocationRowV27();const row=list.querySelector('.budget-allocation-row');assert(row,'Allocation row was not added');
  row.querySelector('[name="allocationAmount"]').value='300000';form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
  const updated=window.__shtabDiagnostics.financeBudget(month);assert(updated.allocations.length===1&&updated.allocations[0].amount===300000,'Allocation was not saved separately');
});

await run('Plan is a single calendar and agenda without duplicated modes',async()=>{
  window.setPage('plan');const plan=window.document.querySelector('#plan');
  assert(plan.querySelector('.date-strip'),'Plan date calendar is missing');assert(!plan.querySelector('.view-switch'),'Agenda/month/analytics switch remains in Plan');assert(!plan.textContent.includes('Аналитика'),'Analytics remains inside Plan');assert(!plan.textContent.includes('Бюджет месяца'),'Budget card remains inside Plan');assert(plan.textContent.includes('Повестка выбранного дня'),'Selected-day agenda is missing');auditButtons(plan);auditInlineHandlers(plan);
});

await run('Analytics is a separate bottom tab without budget',async()=>{
  window.setPage('analytics');const analytics=window.document.querySelector('#analytics');assert(analytics.classList.contains('active'),'Analytics page is not active');
  assert(analytics.textContent.includes('Задачи')&&analytics.textContent.includes('Командировки')&&analytics.textContent.includes('Проекты'),'Analytics sections are incomplete');assert(!analytics.textContent.includes('Бюджет месяца'),'Budget analytics remains in general Analytics');
  window.setAnalyticsSectionV27('trips');assert(window.document.querySelector('#analytics').textContent.includes('Текущие и ближайшие'),'Trip analytics did not open');auditButtons(window.document.querySelector('#analytics'));auditInlineHandlers(window.document.querySelector('#analytics'));
});

await run('budget belongs to Finance and financial settings remain accessible',async()=>{
  window.setPage('finance');const finance=window.document.querySelector('#finance');assert(finance.textContent.includes('Бюджет проверки'),'Budget is not shown in Finance');assert(finance.textContent.includes('Исполнение бюджета'),'Budget execution is missing in Finance');
  window.openMore('budget');const more=window.document.querySelector('#more');assert(more.textContent.includes('Финансовые настройки'),'Financial settings screen did not open');assert(more.textContent.includes('Статьи расходов')&&more.textContent.includes('Счета'),'Categories or accounts are missing from financial settings');
});

await run('trip periods remain visible and complete by day',async()=>{
  window.openEditor('task');const form=window.document.querySelector('#editor-form');form.elements.kind.value='trip';form.elements.title.value='Тестовая командировка';form.elements.date.value=tomorrowKey;form.elements.endDate.value=tripEndKey;form.elements.time.value='09:00';form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
  let trip=window.__shtabDiagnostics.taskByTitle('Тестовая командировка');assert(trip,'Trip was not saved');assert(window.__shtabDiagnostics.taskIdsForDate(tomorrowKey).includes(trip.id),'Trip is missing on first day');window.toggleTask(trip.id,tomorrowKey);trip=window.__shtabDiagnostics.taskByTitle('Тестовая командировка');assert(trip.status==='active','Completing one day completed the whole trip');
  window.setPage('analytics');window.setAnalyticsSectionV27('trips');assert(window.document.querySelector('#analytics').textContent.includes('Тестовая командировка'),'Future trip is missing from analytics');
});

await run('all pages, modules and handlers resolve',async()=>{
  for(const page of ['today','plan','analytics','finance','more']){window.setPage(page);assert(window.document.querySelector(`#${page}`).classList.contains('active'),`${page} is not active`);auditButtons();auditInlineHandlers()}
  window.setPage('assistant');assert(window.document.querySelector('#assistant').classList.contains('active'),'Assistant route is broken');auditButtons();auditInlineHandlers();
  for(const view of ['projects','budget','sport','goals','notes','settings','data']){window.openMore(view);assert(window.document.querySelector('#more').textContent.length>20,`Empty More view ${view}`);auditButtons(window.document.querySelector('#more'));auditInlineHandlers(window.document.querySelector('#more'))}
});

await run('search, backup and app confirmation remain functional',async()=>{
  window.document.querySelector('#search-btn').click();assert(window.document.querySelector('#search-dialog').open,'Search did not open');window.document.querySelector('#search-dialog').close();
  window.openBackup('export');assert(window.document.querySelector('#backup-dialog').open,'Backup did not open');assert(window.document.querySelector('#backup-text').value.includes('sourceName'),'Backup does not contain new income data');window.document.querySelector('#backup-dialog').close();
  const expense=window.__shtabDiagnostics.transactionByNote('Проверенный прошлый расход');window.transactionMenuV26(expense.id,yesterdayKey);const sheet=window.document.querySelector('#transaction-actions-dialog');sheet.querySelector('[data-tx-action="delete"]').click();await wait(80);
  const confirmation=window.document.querySelector('#app-confirm-dialog');assert(confirmation?.open,'App confirmation did not open');assert(!confirmation.textContent.includes('file://'),'Technical file URL leaked into confirmation');confirmation.querySelector('#app-confirm-cancel').click();
});

if(errors.length){console.log('\nAudit failures:');errors.forEach(error=>console.log(`- ${error}`));process.exit(1)}
console.log('\nAll version 2.7 business logic, interface and Android permission tests passed.');
