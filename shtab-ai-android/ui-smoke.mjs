import fs from 'node:fs';
import path from 'node:path';
import {JSDOM,VirtualConsole} from 'jsdom';

const root=path.resolve('app/src/main/assets');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script[^>]+src="[^"]+"[^>]*><\/script>/g,'');
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
window.Android={requestNotifications(){},requestExactAlarmPermission(){},scheduleNotification(){},cancelNotification(){},startVoiceInput(){setTimeout(()=>window.onVoiceError?.('Тестовый режим'),0)},speak(){},showToast(){}};

const scripts=Array.from({length:19},(_,index)=>fs.readFileSync(path.join(root,`chunk${index+1}.js`),'utf8')).join('\n;\n');
try{window.eval(scripts)}catch(error){errors.push(`initialization: ${error.stack||error}`)}
const wait=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const run=async(name,fn)=>{try{await fn();process.stdout.write(`✓ ${name}\n`)}catch(error){errors.push(`${name}: ${error.stack||error}`);process.stdout.write(`✕ ${name}\n`)}};
const iso=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const now=new Date(),todayKey=iso(now),tomorrowKey=iso(new Date(now.getFullYear(),now.getMonth(),now.getDate()+1));

function auditButtons(rootNode=window.document){rootNode.querySelectorAll('button').forEach(button=>assert(Boolean(button.getAttribute('type')),`Button without explicit type: ${button.textContent.trim().slice(0,40)}`))}
function auditInlineHandlers(rootNode=window.document){
  const ignored=new Set(['if','for','while','switch','catch','function','setTimeout']);
  rootNode.querySelectorAll('[onclick]').forEach(element=>{const code=element.getAttribute('onclick')||'';for(const match of code.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)\s*\(/g)){const name=match[1];if(ignored.has(name))continue;let value;try{value=window.eval(name)}catch{value=undefined}assert(typeof value==='function',`Unresolved onclick function ${name}: ${code}`)}});
}

await run('initial render, navigation and removal of global add',async()=>{
  assert(window.document.querySelector('#today.active'),'Today page is not active');
  assert(window.document.querySelectorAll('.nav-item').length===5,'Bottom navigation count');
  assert(window.getComputedStyle(window.document.querySelector('#fab')).display==='none','Global FAB is still visible');
  auditButtons();auditInlineHandlers();
});

await run('Today uses contextual additions and important items',async()=>{
  window.setPage('today');const today=window.document.querySelector('#today');
  assert(!today.textContent.includes('Ближайшее'),'Nearest wording remains');
  assert(!today.querySelector('.today-compact-summary'),'Nearest card remains');
  assert(today.querySelector('.important-section'),'Important/urgent section missing');
  for(const type of ['task','note','expense','income','workout'])assert(today.querySelector(`[data-local-add="${type}"]`),`Local add missing on Today: ${type}`);
  assert(today.querySelector('.today-notes'),'Notes not visible on Today');
  auditButtons(today);auditInlineHandlers(today);
});

await run('expense form is automatic and context-sensitive',async()=>{
  window.openEditor('expense');await wait(30);
  let form=window.document.querySelector('#editor-form'),dialog=window.document.querySelector('#editor-dialog');
  assert(form.elements.status?.type==='hidden','Visible status selector remains');
  assert(!dialog.querySelector('select[name="status"]'),'State dropdown remains');
  assert(!dialog.querySelector('.danger-btn'),'Delete button remains inside expense form');
  assert(dialog.querySelector('#tx-reminder-toggle').hidden,'Reminder toggle visible for actual expense');
  assert(dialog.querySelector('#tx-reminder-panel').hidden,'Reminder fields visible for actual expense');
  form.elements.amount.value='25000';form.elements.date.value=tomorrowKey;window.refreshTransactionFormV26();
  assert(form.elements.status.value==='planned','Future expense was not made planned automatically');
  assert(!dialog.querySelector('#tx-reminder-toggle').hidden,'Reminder toggle missing for future expense');
  assert(dialog.querySelector('#tx-reminder-panel').hidden,'Reminder fields should stay hidden until enabled');
  form.elements.notifyEnabled.checked=true;window.refreshTransactionFormV26();
  assert(!dialog.querySelector('#tx-reminder-panel').hidden,'Reminder fields did not open');
  form.elements.note.value='Будущий расход';
  form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
  const expense=window.__shtabDiagnostics.transactionByNote('Будущий расход');
  assert(expense?.status==='planned','Future expense status not saved');
  assert(expense.notifyEnabled&&expense.reminders.length,'Reminder settings not saved');
});

await run('past or current expense is actual without time and reminder',async()=>{
  window.openEditor('expense');await wait(20);const form=window.document.querySelector('#editor-form');
  form.elements.amount.value='1000';form.elements.date.value=todayKey;window.refreshTransactionFormV26();
  assert(form.elements.status.value==='actual','Current expense is not actual automatically');
  assert(window.document.querySelector('#tx-reminder-toggle').hidden,'Reminder is available for current actual expense');
  form.elements.note.value='Расход сегодня';form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
  const expense=window.__shtabDiagnostics.transactionByNote('Расход сегодня');assert(expense?.status==='actual','Actual expense not saved');assert(!expense.notifyEnabled&&!expense.reminders.length,'Actual expense kept reminder data');
});

await run('transaction actions replace editor deletion and change settlement',async()=>{
  window.setPage('finance');
  let row=[...window.document.querySelectorAll('.transaction.v26')].find(node=>node.textContent.includes('25 000')||node.textContent.includes('25 000'));
  assert(row,'Future transaction card not found');row.querySelector('.menu-btn').click();
  let sheet=window.document.querySelector('#transaction-actions-dialog');assert(sheet?.open,'Transaction action sheet did not open');
  assert(sheet.querySelector('[data-tx-action="settle"]'),'Settlement action missing');sheet.querySelector('[data-tx-action="settle"]').click();
  assert(window.__shtabDiagnostics.transactionByNote('Будущий расход')?.status==='actual','Transaction was not marked actual');
  window.setPage('finance');row=[...window.document.querySelectorAll('.transaction.v26')].find(node=>node.textContent.includes('25 000')||node.textContent.includes('25 000'));row.querySelector('.menu-btn').click();sheet=window.document.querySelector('#transaction-actions-dialog');sheet.querySelector('[data-tx-action="delete"]').click();await wait(100);
  const confirmation=window.document.querySelector('#app-confirm-dialog');assert(confirmation?.open,'Delete confirmation missing');assert(!confirmation.textContent.includes('file://'),'file:// leaked into confirmation');confirmation.querySelector('#app-confirm-cancel').click();
});

await run('period trip crosses months and completes by day',async()=>{
  window.openEditor('task');const form=window.document.querySelector('#editor-form');
  form.elements.kind.value='trip';form.elements.title.value='Командировка в Астану';form.elements.date.value='2026-07-30';form.elements.endDate.value='2026-08-03';form.elements.time.value='09:00';form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
  let trip=window.__shtabDiagnostics.taskByTitle('Командировка в Астану');assert(trip,'Trip was not saved');
  assert(window.__shtabDiagnostics.taskIdsForDate('2026-08-01').includes(trip.id),'Trip missing inside period');assert(!window.__shtabDiagnostics.taskIdsForDate('2026-08-04').includes(trip.id),'Trip visible after period');
  window.toggleTask(trip.id,'2026-08-01');trip=window.__shtabDiagnostics.taskByTitle('Командировка в Астану');assert(trip.completedDates.includes('2026-08-01'),'Period day not completed');assert(trip.status==='active','Whole period completed after one day');
});

await run('contextual plus exists in every management section',async()=>{
  window.setPage('plan');window.setPlanMode('agenda');for(const type of ['task','expense','income','workout'])assert(window.document.querySelector(`#plan [data-local-add="${type}"]`),`Plan local add missing: ${type}`);
  window.setPage('finance');for(const type of ['expense','income'])assert(window.document.querySelector(`#finance [data-local-add="${type}"]`),`Finance local add missing: ${type}`);
  window.openMore('projects');assert(window.document.querySelector('[data-local-add="project"]'),'Project local add missing');assert(window.document.querySelector('[data-local-add="area"]'),'Area local add missing');
  window.openMore('sport');assert(window.document.querySelector('[data-local-add="habit"]'),'Habit local add missing');window.setMoreTab('workouts');assert(window.document.querySelector('[data-local-add="workout"]'),'Workout local add missing');
  window.openMore('goals');assert(window.document.querySelector('[data-local-add="goal"]'),'Goal local add missing');window.openMore('notes');assert(window.document.querySelector('[data-local-add="note"]'),'Note local add missing');
  window.openMore('budget');for(const type of ['budget','category','account'])assert(window.document.querySelector(`[data-local-add="${type}"]`),`Budget center local add missing: ${type}`);
});

await run('budget center owns categories, distribution and accounts',async()=>{
  window.openMore('budget');const more=window.document.querySelector('#more');assert(more.textContent.includes('Статьи расходов'),'Expense categories missing');assert(more.textContent.includes('Распределение'),'Distribution missing');assert(more.textContent.includes('Счета'),'Accounts missing');
  window.openBudgetEditorV25();let form=window.document.querySelector('#editor-form');assert(!window.document.querySelector('#budget-new-category-name'),'Inline category creation remains');form.elements.name.value='Бюджет месяца';form.elements.month.value=window.eval('state.financeMonth');form.elements.amount.value='1000000';window.addBudgetAllocationRow();const row=window.document.querySelector('.budget-allocation-row');row.querySelector('[name=allocationAmount]').value='300000';form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
  const month=window.eval('state.financeMonth'),budget=window.__shtabDiagnostics.budgetForMonth(month);assert(budget?.amount===1000000&&budget.allocations.length===1,'Budget and allocation not saved');
});

await run('Plan analytics includes tasks, trips and budget',async()=>{
  window.setPage('plan');window.setPlanMode('analytics');const plan=window.document.querySelector('#plan');
  assert(plan.textContent.includes('Задачи и поручения'),'Task analytics missing');assert(plan.textContent.includes('Командировки'),'Trip analytics missing');assert(plan.textContent.includes('Бюджет'),'Budget analytics missing');assert(plan.textContent.includes('1 000 000')||plan.textContent.includes('1 000 000'),'Budget amount missing in analytics');
  const taskAnalytics=window.__shtabDiagnostics.taskAnalytics(30),tripAnalytics=window.__shtabDiagnostics.tripAnalytics(30),budgetAnalytics=window.__shtabDiagnostics.budgetAnalytics(window.eval('state.financeMonth'));
  assert(taskAnalytics.byKind.assignment,'Assignment analytics missing');assert(tripAnalytics.count>=1,'Trip not counted in analytics');assert(budgetAnalytics.amount===1000000,'Budget analytics amount incorrect');
  auditButtons(plan);auditInlineHandlers(plan);
});

await run('all pages, modules and inline actions resolve',async()=>{
  for(const page of ['today','plan','assistant','finance','more']){window.document.querySelector(`.nav-item[data-page="${page}"]`).click();assert(window.document.querySelector(`#${page}`).classList.contains('active'),`${page} not active`);auditButtons();auditInlineHandlers()}
  for(const view of ['projects','budget','sport','goals','notes','settings','data']){window.openMore(view);assert(window.document.querySelector('#more').textContent.length>20,`Empty More view ${view}`);auditButtons(window.document.querySelector('#more'));auditInlineHandlers(window.document.querySelector('#more'))}
});

await run('profile, notes, search, backup and diagnostics',async()=>{
  window.openMore('home');const profile=window.document.querySelector('#more .profile-entry');assert(profile,'Clickable profile missing');profile.click();await wait(80);assert(window.document.querySelector('#owner-name-input'),'Profile editor did not open');
  window.openEditor('note');let form=window.document.querySelector('#editor-form');form.elements.title.value='Важная заметка';form.elements.body.value='Быстро видимая информация';form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));window.setPage('today');assert(window.document.querySelector('#today').textContent.includes('Важная заметка'),'Note not visible on Today');
  window.document.querySelector('#search-btn').click();assert(window.document.querySelector('#search-dialog').open,'Search did not open');const input=window.document.querySelector('#global-search');input.value='Будущий расход';input.dispatchEvent(new window.Event('input',{bubbles:true}));assert(window.document.querySelector('#search-results').textContent.includes('Расход'),'Finance search result missing');window.document.querySelector('#search-dialog').close();
  window.openBackup('export');assert(window.document.querySelector('#backup-dialog').open,'Backup did not open');assert(window.document.querySelector('#backup-text').value.includes('"version"'),'Backup empty');window.document.querySelector('#backup-dialog').close();window.showDiagnostics();assert(window.document.querySelector('#more').textContent.includes('Проверка пройдена'),'Diagnostics failed');
});

await run('voice and notification helpers do not crash',async()=>{window.requestNotifications();window.startVoice();await wait(30)});

if(errors.length){console.log('\nAudit failures:');errors.forEach(error=>console.log(`- ${error}`));process.exit(1)}
console.log('\nAll business logic, interface, navigation and clickability tests passed.');