import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {JSDOM,VirtualConsole} from 'jsdom';

const baselinePath=path.resolve('ui-smoke-v46.mjs');
const generatedPath=path.resolve('.ui-smoke-v461-full.generated.mjs');
let fullAudit=fs.readFileSync(baselinePath,'utf8');
fullAudit=fullAudit
  .replaceAll("scripts.at(-1)==='chunk40.js'","scripts.at(-1)==='chunk41.js'")
  .replaceAll('chunk40 is not loaded last','chunk41 is not loaded last')
  .replaceAll('4.6.0','4.6.1')
  .replaceAll('versionCode = 24','versionCode = 25')
  .replaceAll('All v4.6.0 reminder','All v4.6.1 reminder');
fs.writeFileSync(generatedPath,fullAudit);
try{
  await import(`${pathToFileURL(generatedPath).href}?run=${Date.now()}`);
}finally{
  fs.rmSync(generatedPath,{force:true});
}

const root=path.resolve('app/src/main/assets');
const htmlSource=fs.readFileSync(path.join(root,'index.html'),'utf8');
const scripts=[...htmlSource.matchAll(/<script[^>]+src="([^"]+)"[^>]*><\/script>/g)].map(match=>match[1]);
const html=htmlSource.replace(/<script[^>]+src="[^"]+"[^>]*><\/script>/g,'');
const virtualConsole=new VirtualConsole();
const errors=[];
virtualConsole.on('jsdomError',error=>errors.push(String(error.message||error)));
const dom=new JSDOM(html,{url:'https://shtab-ai.local/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole});
const {window}=dom;
window.console.error=(...args)=>errors.push(args.map(String).join(' '));
window.confirm=()=>{throw new Error('system confirm forbidden')};
window.prompt=()=>{throw new Error('system prompt forbidden')};
window.alert=()=>{throw new Error('system alert forbidden')};
window.requestAnimationFrame=callback=>setTimeout(callback,0);
window.cancelAnimationFrame=id=>clearTimeout(id);
window.HTMLElement.prototype.scrollIntoView=function(){};
window.HTMLElement.prototype.showModal=function(){this.open=true;this.setAttribute('open','')};
window.HTMLElement.prototype.close=function(){this.open=false;this.removeAttribute('open');this.dispatchEvent(new window.Event('close'))};
Object.defineProperty(window.navigator,'clipboard',{value:{writeText:async()=>{}},configurable:true});
window.Android={requestInitialPermissions(){},requestNotifications(){},requestExactAlarmPermission(){},scheduleNotification(){},cancelNotification(){},startVoiceInput(){},speak(){},showToast(){},updateWidget(){}};
const packedScripts=scripts.map(source=>fs.readFileSync(path.join(root,source),'utf8')).join('\n;\n');
window.eval(`${packedScripts}\n;window.__stateV461=state;window.__todayKeyV461=dayKey(today);`);

const assert=(value,message)=>{if(!value)throw new Error(message)};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
await wait(20);
assert(errors.length===0,`Runtime errors: ${errors.join('; ')}`);
assert(scripts.at(-1)==='chunk41.js','chunk41 must be loaded last');
assert(window.__shtabDiagnostics.uiVersion()==='4.6.1','UI version is not 4.6.1');

for(const type of ['task','project','habit','workout','goal','area']){
  window.openEditor(type);
  await wait(12);
  const dialog=window.document.querySelector('#editor-dialog');
  const selects=[...dialog.querySelectorAll('select:not([multiple])')];
  for(const select of selects){
    assert(select.classList.contains('custom-select-native-v461'),`${type}: native select was not hidden`);
    const shell=select.closest('.custom-select-shell-v461');
    assert(shell?.querySelector('.custom-select-trigger-v461'),`${type}: custom select trigger is missing`);
  }
  dialog.close();
}

window.openEditor('task');
await wait(12);
let form=window.document.querySelector('#editor-form');
const priority=form.elements.priority;
const priorityTrigger=priority.closest('.custom-select-shell-v461').querySelector('.custom-select-trigger-v461');
priorityTrigger.click();
await wait(4);
let customDialog=window.document.querySelector('#custom-select-dialog-v461');
assert(customDialog?.open,'Custom select sheet did not open');
assert(customDialog.querySelector('.custom-select-sheet-v461'),'Styled custom select sheet is missing');
assert(!customDialog.querySelector('[type="radio"]'),'Custom select must not use system radio rows');
const highOption=[...customDialog.querySelectorAll('.custom-select-option-v461')].find(button=>button.textContent.includes('Высокий'));
assert(highOption,'High priority option is missing from custom sheet');
highOption.click();
assert(priority.value==='high','Custom select did not update the native form value');
assert(!customDialog.open,'Custom select sheet did not close after selection');

const reminderHours=form.elements.reminderHours;
reminderHours.closest('.custom-select-shell-v461').querySelector('.custom-select-trigger-v461').click();
await wait(4);
customDialog=window.document.querySelector('#custom-select-dialog-v461');
assert(!customDialog.querySelector('#custom-select-search-wrap-v461').hidden,'Long custom select does not provide search');
customDialog.close();
window.document.querySelector('#editor-dialog').close();

const dynamicLabel=window.document.createElement('label');
dynamicLabel.className='field';
dynamicLabel.innerHTML='<span>Динамический список</span><select name="dynamic"><option value="a">Первый</option><option value="b">Второй</option></select>';
window.document.body.appendChild(dynamicLabel);
await wait(15);
assert(dynamicLabel.querySelector('select').classList.contains('custom-select-native-v461'),'Dynamically added select was not converted');
assert(window.__shtabDiagnostics.nativeVisibleSelectCountV461()===0,'At least one native select remains exposed');

const state=window.__stateV461,todayKey=window.__todayKeyV461;
state.tasks=state.tasks.filter(item=>!['normal-v461','high-v461'].includes(item.id));
const common={kind:'task',title:'Проверка важности',description:'',date:todayKey,endDate:todayKey,startTime:'00:01',endTime:'23:59',time:'00:01',duration:60,project:'',status:'active',recurrence:{type:'none',interval:1},reminders:[],completedDates:[],createdAt:Date.now()};
state.tasks.push({...common,id:'normal-v461',title:'Обычный приоритет',priority:'normal'});
state.tasks.push({...common,id:'high-v461',title:'Высокий приоритет',priority:'high'});
window.render();
await wait(12);
const important=window.__shtabDiagnostics.importantItemsV461();
assert(!important.some(item=>item.id==='normal-v461'),'Normal priority incorrectly appears in Important');
assert(important.some(item=>item.id==='high-v461'),'High priority is missing from Important');
const importantIds=[...window.document.querySelectorAll('#today [data-important-task-id]')].map(node=>node.dataset.importantTaskId);
assert(!importantIds.includes('normal-v461'),'Normal priority rendered inside Important window');
assert(importantIds.includes('high-v461'),'High priority did not render inside Important window');

window.openTaskViewV31('normal-v461',todayKey);
await wait(4);
const taskDialog=window.document.querySelector('#task-view-dialog-v31');
const actionLabels=window.__shtabDiagnostics.taskViewActionLabelsV461();
assert(taskDialog.querySelectorAll('.task-view-close-v31').length===1,'Task view must have one top-right close control');
assert(!actionLabels.some(label=>label==='Закрыть'),'Duplicate bottom Close button remains');
assert(actionLabels.length===2,'Task view must contain exactly two bottom actions');
assert(actionLabels[0].includes('Выполнить')&&actionLabels[1].includes('Изменить'),'Task view actions must be Complete and Edit');
taskDialog.querySelector('.task-view-complete-v461').click();
assert(state.tasks.find(item=>item.id==='normal-v461').completedDates.includes(todayKey)||state.tasks.find(item=>item.id==='normal-v461').status==='completed','Complete action did not update the task');

const chunkSource=fs.readFileSync(path.join(root,'chunk41.js'),'utf8');
assert(chunkSource.includes('pointer-events:none!important'),'Native select interaction is not blocked');
assert(chunkSource.includes("item.priority==='high'||item.important===true"),'Important priority rule is not strict');
console.log('✓ every native select is replaced by the unified styled selection sheet');
console.log('✓ task view has only Complete and Edit, with one top-right close control');
console.log('✓ normal priority never enters Important; high priority still does');
console.log('\nAll v4.6.1 unified control and priority tests passed.');
