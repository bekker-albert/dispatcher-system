import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {JSDOM,VirtualConsole} from 'jsdom';

const baselinePath=path.resolve('ui-smoke-v462.mjs');
const generatedPath=path.resolve('.ui-smoke-v470-baseline.generated.mjs');
let baseline=fs.readFileSync(baselinePath,'utf8');
baseline=baseline
  .replaceAll("scripts.at(-1)==='chunk42.js'","scripts.at(-1)==='chunk44.js'")
  .replaceAll('chunk42 must be loaded last','chunk44 must be loaded last')
  .replaceAll('4.6.2','4.7.0')
  .replaceAll('versionCode = 26','versionCode = 27')
  .replaceAll('#task-menu-dialog-v43','#task-menu-dialog-v470')
  .replace("assert(window.__shtabDiagnostics.timeWheelSummaryV462()==='02 ч 30 мин','Wheel summary did not update');","await wait(5);assert(window.__shtabDiagnostics.wheelSummaryV470()==='02:30','Wheel summary did not update to HH:MM');");
fs.writeFileSync(generatedPath,baseline);
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
window.CSS=window.CSS||{};window.CSS.escape=window.CSS.escape||((value)=>String(value).replace(/[^a-zA-Z0-9_-]/g,'\\$&'));
Object.defineProperty(window.navigator,'clipboard',{value:{writeText:async()=>{}},configurable:true});
window.Android={requestInitialPermissions(){},requestNotifications(){},requestExactAlarmPermission(){},scheduleNotification(){},cancelNotification(){},startVoiceInput(){},speak(){},showToast(){},updateWidget(){}};
for(const source of scripts)window.eval(fs.readFileSync(path.join(root,source),'utf8'));
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const assert=(value,message)=>{if(!value)throw new Error(message)};
await wait(60);
assert(errors.length===0,`Runtime errors: ${errors.join('; ')}`);
assert(scripts.at(-1)==='chunk44.js','chunk44 is not loaded last');
assert(window.__shtabDiagnostics.uiVersion()==='4.7.0','UI version is not 4.7.0');

const state=window.eval('state');
state.tasks=[];state.workouts=[];state.notes=[];state.habits=[];state.goals=[];state.projects=[];state.selectedDate='2026-08-02';state.planArchiveViewV470='active';
window.render();

window.openEditor('task');
await wait(50);
let form=window.document.querySelector('#editor-form');
assert(form.elements.timeEnabled&&!form.elements.timeEnabled.checked,'New record must start without mandatory time');
assert([...form.querySelectorAll('.task-time-field-v470')].every(field=>field.hidden),'Optional time fields are visible by default');
form.elements.timeEnabled.checked=true;form.elements.timeEnabled.dispatchEvent(new window.Event('change',{bubbles:true}));
assert([...form.querySelectorAll('.task-time-field-v470')].every(field=>!field.hidden),'Time fields did not appear after enabling time');
form.elements.timeEnabled.checked=false;form.elements.timeEnabled.dispatchEvent(new window.Event('change',{bubbles:true}));
form.elements.reminderEnabled.checked=true;form.elements.reminderEnabled.dispatchEvent(new window.Event('change',{bubbles:true}));
await wait(25);
assert([...form.elements.reminderHours.options].map(option=>Number(option.value)).at(-1)===24,'Hour wheel is not limited to 24 hours');
assert(form.elements.reminderHours.options.length===25,'Hour wheel must contain 00 through 24');
form.elements.reminderMode.value='days';form.elements.reminderMode.dispatchEvent(new window.Event('change',{bubbles:true}));
form.elements.reminderDays.value='3';window.refreshTaskControlsV470();
assert(!form.querySelector('.reminder-days-v470').hidden&&form.querySelector('.reminder-hours-v470').hidden,'Day reminder mode did not switch the controls');
form.elements.title.value='Запись без времени';form.elements.date.value='2026-08-02';form.elements.endDate.value='2026-08-04';form.elements.repeat.value='none';
window.submitEditor(form);
let saved=state.tasks.find(item=>item.title==='Запись без времени');
assert(saved&&saved.timeEnabled===false&&saved.startTime===''&&saved.endTime===''&&saved.time==='','Optional time was not saved as empty');
assert(saved.reminderMode==='days'&&saved.reminders[0]===4320&&saved.reminderDays===3,'Three-day reminder was not saved correctly');

window.openEditor('task');await wait(45);form=window.document.querySelector('#editor-form');
form.elements.title.value='Напоминание за 24 часа';form.elements.date.value='2026-08-05';form.elements.endDate.value='2026-08-05';form.elements.timeEnabled.checked=true;form.elements.timeEnabled.dispatchEvent(new window.Event('change',{bubbles:true}));form.elements.startTime.value='09:00';form.elements.endTime.value='10:00';form.elements.reminderEnabled.checked=true;form.elements.reminderEnabled.dispatchEvent(new window.Event('change',{bubbles:true}));form.elements.reminderMode.value='hours';form.elements.reminderHours.value='24';form.elements.reminderMinutes.value='30';window.submitEditor(form);
saved=state.tasks.find(item=>item.title==='Напоминание за 24 часа');
assert(saved.reminderMode==='hours'&&saved.reminders[0]===1440,'24-hour reminder was not clamped to 24:00');

const overdue={id:'overdue-v470',kind:'assignment',title:'Просроченное поручение',description:'',date:'2026-07-30',endDate:'2026-08-01',timeEnabled:false,startTime:'',endTime:'',time:'',priority:'normal',status:'active',recurrence:{type:'none',interval:1},completedDates:[],reminders:[]};
state.tasks.push(overdue);
const overdueRows=window.__shtabDiagnostics.overdueRowsV470('2026-08-02T12:00:00');
assert(overdueRows.some(row=>row.item.id===overdue.id),'No-time overdue item disappeared instead of remaining in Today');

const oneTime={id:'complete-v470',kind:'task',title:'Завершить и архивировать',description:'',date:'2026-08-02',endDate:'2026-08-02',timeEnabled:false,startTime:'',endTime:'',time:'',priority:'normal',status:'active',recurrence:{type:'none',interval:1},completedDates:[],reminders:[]};
state.tasks.push(oneTime);window.toggleTask(oneTime.id,'2026-08-02');
assert(oneTime.status==='completed'&&Number(oneTime.completedAt)>0,'Completed one-time item was not marked for archive');
assert(window.__shtabDiagnostics.archiveEntriesV470().some(row=>row.id===oneTime.id&&row.type==='completed'),'Completed one-time item is missing from plan archive');
window.setPage('plan');window.setPlanArchiveViewV470('archive');await wait(25);
assert(window.document.querySelector(`[data-plan-archive-task-id="${oneTime.id}"]`),'Completed item is not rendered in plan archive');
window.setPlanArchiveViewV470('active');await wait(25);
assert(!window.document.querySelector(`#plan [data-plan-task-id="${oneTime.id}"]`),'Completed item remains in active plan');
window.toggleTask(oneTime.id,'2026-08-02');
assert(oneTime.status==='active'&&!window.__shtabDiagnostics.archiveEntriesV470().some(row=>row.id===oneTime.id),'Return to work did not remove item from archive');

const recurring={id:'repeat-v470',kind:'event',title:'Повторяющееся событие',description:'',date:'2026-08-02',endDate:'2026-08-02',timeEnabled:false,startTime:'',endTime:'',time:'',priority:'normal',status:'active',recurrence:{type:'daily',interval:1},completedDates:[],reminders:[]};
state.tasks.push(recurring);window.toggleTask(recurring.id,'2026-08-02');
assert(recurring.status==='active'&&recurring.completedDates.includes('2026-08-02'),'Recurring completion must archive only the occurrence');
assert(window.__shtabDiagnostics.archiveEntriesV470().some(row=>row.id===recurring.id&&row.key==='2026-08-02'),'Completed recurring occurrence is missing from archive');

const closed={id:'closed-v470',kind:'trip',title:'Закрытая командировка',description:'',date:'2026-08-03',endDate:'2026-08-04',timeEnabled:false,startTime:'',endTime:'',time:'',priority:'normal',status:'active',recurrence:{type:'none',interval:1},completedDates:[],reminders:[]};
state.tasks.push(closed);window.closeTaskV470(closed.id,'2026-08-03');
assert(closed.status==='archived'&&closed.archiveReason==='closed','Close action did not archive the record');
assert(window.__shtabDiagnostics.archiveEntriesV470().some(row=>row.id===closed.id&&row.type==='closed'),'Closed item is missing from archive');

window.setPage('today');await wait(25);
assert(!window.document.querySelector(`#today [data-task-id="${recurring.id}"]`),'Completed occurrence remains in Today');
assert(errors.length===0,`Runtime errors after scenarios: ${errors.join('; ')}`);

const chunk43=fs.readFileSync(path.join(root,'chunk43.js'),'utf8');
const chunk44=fs.readFileSync(path.join(root,'chunk44.js'),'utf8');
assert(chunk43.includes('Срок истёк')&&chunk43.includes('timeEnabled!==false'),'Merged overdue behavior is missing');
assert(chunk44.includes('Архив плана')&&chunk44.includes('reminderMode')&&chunk44.includes('timeEnabled'),'Archive or optional scheduling code is missing');
console.log('✓ expired records remain in Today until explicit action');
console.log('✓ completion moves one-time and recurring occurrences into plan archive');
console.log('✓ time is optional and hour wheel is limited to 24:00 in HH:MM format');
console.log('✓ reminders support hours/minutes or a selected number of days');
console.log('\nAll Shtab AI 4.7.0 plan archive, optional time and reminder tests passed.');
