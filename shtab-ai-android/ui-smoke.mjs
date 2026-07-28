import fs from 'node:fs';
import path from 'node:path';
import {JSDOM,VirtualConsole} from 'jsdom';

const root=path.resolve('app/src/main/assets');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script[^>]+src="[^"]+"[^>]*><\/script>/g,'');
const virtualConsole=new VirtualConsole();
const errors=[];
virtualConsole.on('jsdomError',e=>errors.push(String(e.message||e)));
virtualConsole.on('error',e=>errors.push(String(e)));
const dom=new JSDOM(html,{url:'https://shtab-ai.local/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole});
const {window}=dom;
window.console.error=(...args)=>errors.push(args.map(String).join(' '));
window.confirm=()=>{throw new Error('Native browser confirm must not be used')};
window.prompt=()=> '1';
window.alert=()=>{};
window.requestAnimationFrame=cb=>setTimeout(cb,0);
window.HTMLElement.prototype.scrollIntoView=function(){};
window.HTMLElement.prototype.showModal=function(){this.open=true;this.setAttribute('open','')};
window.HTMLElement.prototype.close=function(){this.open=false;this.removeAttribute('open')};
Object.defineProperty(window.navigator,'clipboard',{value:{writeText:async()=>{}},configurable:true});
window.Android={
  requestNotifications(){},requestExactAlarmPermission(){},
  scheduleNotification(){},cancelNotification(){},
  startVoiceInput(){setTimeout(()=>window.onVoiceError?.('Тестовый режим'),0)},
  speak(){},showToast(){}
};

const scripts=Array.from({length:13},(_,i)=>fs.readFileSync(path.join(root,`chunk${i+1}.js`),'utf8')).join('\n;\n');
try{window.eval(scripts)}catch(error){errors.push(`initialization: ${error.stack||error}`)}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const run=async(name,fn)=>{try{await fn();process.stdout.write(`✓ ${name}\n`)}catch(error){errors.push(`${name}: ${error.stack||error}`);process.stdout.write(`✕ ${name}\n`)}};

await run('initial render',async()=>{
  assert(window.document.querySelector('#today.active'),'Today page is not active');
  assert(window.document.querySelectorAll('.nav-item').length===5,'Bottom navigation count');
});

await run('Today compact layout',async()=>{
  window.setPage('today');
  const today=window.document.querySelector('#today');
  assert(!today.textContent.includes('Быстро'),'Obsolete quick section is visible');
  assert(today.querySelectorAll('.today-metrics .dash-card').length===4,'Compact metric cards missing');
  assert(today.textContent.includes('Заметки'),'Notes section is not visible on Today');
  assert(today.querySelector('.today-notes'),'Today notes container missing');
});

await run('all quick-create forms',async()=>{
  const types=['task','expense','income','project','habit','workout','goal','note'];
  for(const type of types){
    window.document.querySelector('#fab').click();
    assert(window.document.querySelector('#quick-dialog').open,`Quick dialog not open for ${type}`);
    window.document.querySelector(`[data-create="${type}"]`).click();
    await wait(160);
    assert(window.document.querySelector('#editor-dialog').open,`Editor not open for ${type}`);
    assert(window.document.querySelector('#editor-fields').children.length>0,`Editor fields empty for ${type}`);
    window.document.querySelector('#editor-cancel').click();
  }
});

await run('styled task actions and app confirmation',async()=>{
  window.setPage('today');
  let menu=window.document.querySelector('.task .menu-btn');
  assert(menu,'Task menu button missing');
  menu.click();
  let dialog=window.document.querySelector('#task-actions-dialog');
  assert(dialog?.open,'Task action sheet did not open');
  assert(dialog.querySelectorAll('.task-action').length>=4,'Task action buttons missing');
  const edit=dialog.querySelector('[data-task-action="edit"]');
  edit.click();
  await wait(120);
  assert(window.document.querySelector('#editor-dialog').open,'Edit action did not open editor');
  window.closeDialog('editor-dialog');

  window.setPage('today');
  menu=window.document.querySelector('.task .menu-btn');
  menu.click();
  dialog=window.document.querySelector('#task-actions-dialog');
  dialog.querySelector('[data-task-action="delete"]').click();
  await wait(120);
  const confirmDialog=window.document.querySelector('#app-confirm-dialog');
  assert(confirmDialog?.open,'App confirmation dialog did not open');
  assert(confirmDialog.textContent.includes('Удалить задачу'),'Delete confirmation title missing');
  assert(!confirmDialog.textContent.includes('file://'),'Technical file URL leaked into confirmation');
  confirmDialog.querySelector('#app-confirm-cancel').click();
  assert(!confirmDialog.open,'Confirmation dialog did not close on cancel');
  assert(window.document.querySelector('.task'),'Task was deleted after cancel');
});

await run('bottom navigation',async()=>{
  for(const page of ['today','plan','assistant','finance','more']){
    window.document.querySelector(`.nav-item[data-page="${page}"]`).click();
    assert(window.document.querySelector(`#${page}`).classList.contains('active'),`${page} not active`);
  }
});

await run('plan modes and analytics',async()=>{
  window.setPage('plan');
  for(const mode of ['agenda','month','analytics']){window.setPlanMode(mode);assert(window.document.querySelector('#plan').textContent.length>20,`Empty ${mode}`)}
  assert(window.document.querySelector('#plan').textContent.includes('Выполнение'),'Analytics not rendered');
  window.setAnalyticsRange(7);
});

await run('more modules',async()=>{
  for(const view of ['projects','sport','goals','notes','settings','data']){window.openMore(view);assert(window.document.querySelector('#more').textContent.length>20,`Empty more view ${view}`)}
  window.showDiagnostics();
  assert(window.document.querySelector('#more').textContent.includes('Проверка пройдена'),'Diagnostics failed');
});

await run('owner profile settings',async()=>{
  window.openMore('settings');
  const input=window.document.querySelector('#owner-name-input');
  assert(input,'Owner name input missing');
  input.value='Тестовый Владелец';
  window.saveOwnerName();
  window.openMore('home');
  assert(window.document.querySelector('#more').textContent.includes('Тестовый Владелец'),'Owner name not reflected in profile');
  window.setPage('today');
  assert(window.document.querySelector('#page-subtitle').textContent.includes('Тестовый'),'Owner greeting not updated');
});

await run('notes stay visible',async()=>{
  window.openEditor('note');
  const form=window.document.querySelector('#editor-form');
  form.elements.title.value='Важная заметка';
  form.elements.body.value='Информация, которую нужно быстро увидеть на главном экране.';
  form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
  window.setPage('today');
  assert(window.document.querySelector('#today').textContent.includes('Важная заметка'),'Created note not visible on Today');
});

await run('search and backup dialogs',async()=>{
  window.document.querySelector('#search-btn').click();
  assert(window.document.querySelector('#search-dialog').open,'Search dialog not open');
  window.document.querySelector('#search-dialog').close();
  window.openBackup('export');
  assert(window.document.querySelector('#backup-dialog').open,'Backup dialog not open');
  assert(window.document.querySelector('#backup-text').value.includes('"version"'),'Backup data absent');
  window.document.querySelector('#backup-dialog').close();
});

await run('direct editors and helpers',async()=>{
  for(const type of ['area','account','budget','category']){
    window.openEditor(type);
    assert(window.document.querySelector('#editor-dialog').open,`Direct editor not open ${type}`);
    window.closeDialog('editor-dialog');
  }
  window.requestNotifications();
  window.startVoice();
  await wait(20);
});

if(errors.length){
  console.log('\nSmoke test failures:');
  errors.forEach(e=>console.log(`- ${e}`));
  process.exit(1);
}
console.log('\nAll interface smoke tests passed.');