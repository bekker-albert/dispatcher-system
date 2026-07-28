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

const scripts=Array.from({length:16},(_,index)=>fs.readFileSync(path.join(root,`chunk${index+1}.js`),'utf8')).join('\n;\n');
try{window.eval(scripts)}catch(error){errors.push(`initialization: ${error.stack||error}`)}
const wait=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const run=async(name,fn)=>{try{await fn();process.stdout.write(`✓ ${name}\n`)}catch(error){errors.push(`${name}: ${error.stack||error}`);process.stdout.write(`✕ ${name}\n`)}};

function auditButtons(rootNode=window.document){
  rootNode.querySelectorAll('button').forEach(button=>assert(Boolean(button.getAttribute('type')),`Button without explicit type: ${button.textContent.trim().slice(0,40)}`));
}

function auditInlineHandlers(rootNode=window.document){
  const ignored=new Set(['if','for','while','switch','catch','function','setTimeout']);
  rootNode.querySelectorAll('[onclick]').forEach(element=>{
    const code=element.getAttribute('onclick')||'';
    for(const match of code.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)\s*\(/g)){
      const name=match[1];if(ignored.has(name))continue;
      let value;
      try{value=window.eval(name)}catch{value=undefined}
      assert(typeof value==='function',`Unresolved onclick function ${name}: ${code}`);
    }
  });
}

await run('initial render and global controls',async()=>{
  assert(window.document.querySelector('#today.active'),'Today page is not active');
  assert(window.document.querySelectorAll('.nav-item').length===5,'Bottom navigation count');
  auditButtons();auditInlineHandlers();
});

await run('Today shows important or urgent instead of nearest card',async()=>{
  window.setPage('today');
  const today=window.document.querySelector('#today');
  assert(!today.querySelector('.today-compact-summary'),'Nearest summary card is still visible');
  assert(!today.textContent.includes('Ближайшее'),'Nearest wording is still visible');
  const important=today.querySelector('.important-section');
  assert(important,'Important/urgent section is missing for seeded high-priority task');
  assert(/Важное|Срочное/.test(important.textContent),'Important/urgent heading missing');
  assert(today.querySelector('.today-notes'),'Notes are not visible on Today');
  auditButtons(today);auditInlineHandlers(today);
});

await run('all quick-create forms open and close',async()=>{
  for(const type of ['task','expense','income','project','habit','workout','goal','note']){
    window.document.querySelector('#fab').click();
    assert(window.document.querySelector('#quick-dialog').open,`Quick dialog not open for ${type}`);
    window.document.querySelector(`[data-create="${type}"]`).click();
    await wait(170);
    assert(window.document.querySelector('#editor-dialog').open,`Editor not open for ${type}`);
    assert(window.document.querySelector('#editor-fields').children.length>0,`Editor fields empty for ${type}`);
    auditButtons(window.document.querySelector('#editor-dialog'));auditInlineHandlers(window.document.querySelector('#editor-dialog'));
    window.document.querySelector('#editor-cancel').click();
  }
});

await run('period tasks cross month boundaries',async()=>{
  window.openEditor('task');
  const form=window.document.querySelector('#editor-form');
  form.elements.kind.value='trip';form.elements.title.value='Командировка в Астану';form.elements.date.value='2026-07-30';form.elements.endDate.value='2026-08-03';form.elements.time.value='09:00';
  form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
  const trip=window.eval("state.tasks.find(item=>item.title==='Командировка в Астану')");
  assert(trip,'Period task was not saved');
  assert(window.eval(`tasksForDate('2026-08-01').some(item=>item.id==='${trip.id}')`),'Task missing inside period');
  assert(!window.eval(`tasksForDate('2026-08-04').some(item=>item.id==='${trip.id}')`),'Task visible after period');
});

await run('task action sheet and app confirmation',async()=>{
  window.setPage('today');
  const menu=window.document.querySelector('.task .menu-btn');assert(menu,'Task menu missing');menu.click();
  const sheet=window.document.querySelector('#task-actions-dialog');assert(sheet?.open,'Task action sheet did not open');
  const remove=sheet.querySelector('[data-v24-task-action="delete"]');assert(remove,'Delete action missing');remove.click();await wait(120);
  const confirmation=window.document.querySelector('#app-confirm-dialog');assert(confirmation?.open,'App confirmation did not open');
  assert(!confirmation.textContent.includes('file://'),'file:// leaked into confirmation');
  confirmation.querySelector('#app-confirm-cancel').click();assert(!confirmation.open,'Confirmation did not close');
});

await run('Budget is a dedicated More module',async()=>{
  window.openMore('home');
  const module=window.document.querySelector('[data-module="budget"]');assert(module,'Budget module missing in More');module.click();await wait(40);
  const more=window.document.querySelector('#more');
  assert(more.textContent.includes('Статьи расходов'),'Expense categories section missing');
  assert(more.textContent.includes('Распределение'),'Allocation section missing');
  assert(more.textContent.includes('Счета'),'Accounts section missing');
  auditButtons(more);auditInlineHandlers(more);
});

await run('budget editor only distributes existing categories',async()=>{
  window.openMore('budget');window.openBudgetEditorV25();
  const form=window.document.querySelector('#editor-form');
  assert(form.elements.amount,'Total budget field missing');
  assert(window.document.querySelector('#budget-allocation-list'),'Allocation list missing');
  assert(!window.document.querySelector('#budget-new-category-name'),'Inline category creation remains in budget editor');
  assert(!window.document.querySelector('#editor-dialog').textContent.includes('Создать статью'),'Create category action remains inside budget editor');
  form.elements.name.value='Бюджет августа';form.elements.month.value='2026-08';form.elements.amount.value='1000000';
  window.addBudgetAllocationRow();
  const row=window.document.querySelector('.budget-allocation-row');assert(row,'Allocation row not added');
  row.querySelector('[name=allocationAmount]').value='300000';
  form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
  const budget=window.eval("state.budgets.find(item=>item.month==='2026-08')");
  assert(budget?.amount===1000000,'Budget amount not saved');assert(budget.allocations.length===1,'Allocation not saved');
});

await run('expense categories CRUD lives in More Budget',async()=>{
  window.openMore('budget');window.openExpenseCategoryEditorV25();
  let form=window.document.querySelector('#editor-form');
  assert(form.elements.type?.value==='expense','Expense category type is not fixed');
  form.elements.name.value='Командировки';form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
  window.openMore('budget');
  let card=[...window.document.querySelectorAll('.budget-category-card')].find(node=>node.textContent.includes('Командировки'));assert(card,'Created expense category not shown');
  card.querySelector('button').click();await wait(50);
  form=window.document.querySelector('#editor-form');form.elements.name.value='Служебные командировки';form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
  window.openMore('budget');
  card=[...window.document.querySelectorAll('.budget-category-card')].find(node=>node.textContent.includes('Служебные командировки'));assert(card,'Edited category not shown');
  card.querySelector('button.danger').click();await wait(80);
  const confirmation=window.document.querySelector('#app-confirm-dialog');assert(confirmation?.open,'Category delete confirmation missing');confirmation.querySelector('#app-confirm-cancel').click();
});

await run('expense editor only selects a category',async()=>{
  window.openEditor('expense');
  const dialog=window.document.querySelector('#editor-dialog');
  assert(dialog.querySelector('select[name="category"]'),'Expense category selector missing');
  assert(!dialog.querySelector('#budget-new-category-name'),'Category creation input leaked into expense editor');
  assert(dialog.textContent.includes('Еще → Бюджет'),'Budget center hint missing');
  window.closeDialog('editor-dialog');
});

await run('Finance remains an operations screen',async()=>{
  window.setPage('finance');const finance=window.document.querySelector('#finance');
  assert(finance.textContent.includes('Операции'),'Operations section missing');
  assert(!finance.textContent.includes('＋ Статья'),'Category creation remains in Finance');
  assert(!finance.querySelector('.account-strip'),'Account settings remain in Finance');
  const settings=finance.querySelector('.budget-link');assert(settings,'Budget settings link missing');settings.click();
  assert(window.document.querySelector('#more').textContent.includes('Статьи расходов'),'Budget link did not open Budget center');
});

await run('bottom navigation and every More module',async()=>{
  for(const page of ['today','plan','assistant','finance','more']){
    window.document.querySelector(`.nav-item[data-page="${page}"]`).click();
    assert(window.document.querySelector(`#${page}`).classList.contains('active'),`${page} not active`);
    auditButtons();auditInlineHandlers();
  }
  for(const view of ['projects','budget','sport','goals','notes','settings','data']){
    window.openMore(view);assert(window.document.querySelector('#more').textContent.length>20,`Empty More view ${view}`);auditButtons(window.document.querySelector('#more'));auditInlineHandlers(window.document.querySelector('#more'));
  }
});

await run('plan modes and analytics',async()=>{
  window.setPage('plan');
  for(const mode of ['agenda','month','analytics']){window.setPlanMode(mode);assert(window.document.querySelector('#plan').textContent.length>20,`Empty plan mode ${mode}`);auditButtons(window.document.querySelector('#plan'));auditInlineHandlers(window.document.querySelector('#plan'))}
  assert(window.document.querySelector('#plan').textContent.includes('Выполнение'),'Analytics not rendered');
});

await run('profile card opens profile editor',async()=>{
  window.openMore('home');const profile=window.document.querySelector('#more .profile-entry');assert(profile,'Clickable profile missing');profile.click();await wait(100);assert(window.document.querySelector('#owner-name-input'),'Profile editor did not open');
});

await run('notes, search, backup and diagnostics',async()=>{
  window.openEditor('note');let form=window.document.querySelector('#editor-form');form.elements.title.value='Важная заметка';form.elements.body.value='Быстро видимая информация';form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));window.setPage('today');assert(window.document.querySelector('#today').textContent.includes('Важная заметка'),'Note not visible on Today');
  window.document.querySelector('#search-btn').click();assert(window.document.querySelector('#search-dialog').open,'Search did not open');window.document.querySelector('#search-dialog').close();
  window.openBackup('export');assert(window.document.querySelector('#backup-dialog').open,'Backup did not open');assert(window.document.querySelector('#backup-text').value.includes('"version"'),'Backup is empty');window.document.querySelector('#backup-dialog').close();
  window.showDiagnostics();assert(window.document.querySelector('#more').textContent.includes('Проверка пройдена'),'Diagnostics failed');
});

await run('voice and notification helpers do not crash',async()=>{window.requestNotifications();window.startVoice();await wait(30)});

if(errors.length){console.log('\nSmoke test failures:');errors.forEach(error=>console.log(`- ${error}`));process.exit(1)}
console.log('\nAll interface, navigation and clickability tests passed.');
