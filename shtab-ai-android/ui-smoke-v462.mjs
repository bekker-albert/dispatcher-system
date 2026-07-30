import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {JSDOM,VirtualConsole} from 'jsdom';

const baselinePath=path.resolve('ui-smoke-v461.mjs');
const generatedPath=path.resolve('.ui-smoke-v462-full.generated.mjs');
let fullAudit=fs.readFileSync(baselinePath,'utf8');
fullAudit=fullAudit
  .replaceAll("scripts.at(-1)==='chunk41.js'","scripts.at(-1)==='chunk42.js'")
  .replaceAll('chunk41 must be loaded last','chunk42 must be loaded last')
  .replaceAll('4.6.1','4.6.2')
  .replaceAll('versionCode = 25','versionCode = 26')
  .replaceAll('All v4.6.1 unified','All v4.6.2 unified');
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
window.eval(`${packedScripts}\n;window.__stateV462=state;window.__todayKeyV462=dayKey(today);`);

const assert=(value,message)=>{if(!value)throw new Error(message)};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const keyOffset=(key,days)=>{const date=new Date(`${key}T12:00:00`);date.setDate(date.getDate()+days);return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`};
await wait(25);
assert(errors.length===0,`Runtime errors: ${errors.join('; ')}`);
assert(scripts.at(-1)==='chunk42.js','chunk42 must be loaded last');
assert(window.__shtabDiagnostics.uiVersion()==='4.6.2','UI version is not 4.6.2');

const state=window.__stateV462,todayKey=window.__todayKeyV462,yesterday=keyOffset(todayKey,-1),threeDaysAgo=keyOffset(todayKey,-3),tomorrow=keyOffset(todayKey,1);
const common={description:'',startTime:'08:00',endTime:'17:00',time:'08:00',duration:540,project:'',priority:'normal',status:'active',recurrence:{type:'none',interval:1},reminders:[],completedDates:[],createdAt:Date.now()};
state.tasks=[
  {...common,id:'overdue-task-v462',kind:'task',title:'Просроченная задача',date:yesterday,endDate:yesterday},
  {...common,id:'overdue-assignment-v462',kind:'assignment',title:'Просроченное поручение',date:yesterday,endDate:yesterday},
  {...common,id:'overdue-event-v462',kind:'event',title:'Просроченное событие',date:yesterday,endDate:yesterday},
  {...common,id:'overdue-trip-v462',kind:'trip',title:'Просроченная командировка',date:yesterday,endDate:yesterday},
  {...common,id:'completed-v462',kind:'task',title:'Уже выполнено',date:yesterday,endDate:yesterday,completedDates:[yesterday]},
  {...common,id:'archived-v462',kind:'task',title:'Закрыто',date:yesterday,endDate:yesterday,status:'archived'},
  {...common,id:'future-v462',kind:'task',title:'Будущая задача',date:tomorrow,endDate:tomorrow},
  {...common,id:'recurring-v462',kind:'task',title:'Повторяющаяся просрочка',date:threeDaysAgo,endDate:threeDaysAgo,recurrence:{type:'daily',interval:1}},
  {...common,id:'today-time-v462',kind:'task',title:'Срок сегодня',date:todayKey,endDate:todayKey,endTime:'18:00'}
];
window.render();
await wait(20);
let ids=window.__shtabDiagnostics.overdueTodayIdsV462();
for(const id of ['overdue-task-v462','overdue-assignment-v462','overdue-event-v462','overdue-trip-v462','recurring-v462'])assert(ids.includes(id),`${id} disappeared from Today after deadline`);
for(const id of ['completed-v462','archived-v462','future-v462','today-time-v462'])assert(!ids.includes(id),`${id} incorrectly rendered as expired`);
assert(ids.filter(id=>id==='recurring-v462').length===1,'Recurring expired record is duplicated for every missed day');
const section=window.document.querySelector('#today [data-today-overdue-v462]');
assert(section,'Expired section is missing from Today');
assert(section.classList.contains('today-overdue-v462'),'Expired section does not have red styling');
assert(section.textContent.includes('Срок истёк'),'Expired status label is missing');
assert(window.document.querySelector('[data-overdue-task-id="overdue-task-v462"] .expired'),'Expired row is not visibly marked red');
assert(!window.__shtabDiagnostics.importantItemsV461().some(item=>item.id==='overdue-task-v462'),'Expiration incorrectly changes normal priority to Important');

const midday=`${todayKey}T12:00:00`,evening=`${todayKey}T19:00:00`;
assert(!window.__shtabDiagnostics.overdueRowsV462(midday).some(row=>row.item.id==='today-time-v462'),'Record expired before its final time');
assert(window.__shtabDiagnostics.overdueRowsV462(evening).some(row=>row.item.id==='today-time-v462'),'Record did not expire after its final time');

window.document.querySelector('[data-overdue-task-id="overdue-task-v462"] .today-overdue-check-v462').click();
await wait(15);
ids=window.__shtabDiagnostics.overdueTodayIdsV462();
assert(!ids.includes('overdue-task-v462'),'Completed expired task remains in Today');
state.tasks.find(item=>item.id==='overdue-assignment-v462').status='archived';window.render();await wait(12);
assert(!window.__shtabDiagnostics.overdueTodayIdsV462().includes('overdue-assignment-v462'),'Closed expired assignment remains in Today');
state.tasks=state.tasks.filter(item=>item.id!=='overdue-event-v462');window.render();await wait(12);
assert(!window.__shtabDiagnostics.overdueTodayIdsV462().includes('overdue-event-v462'),'Deleted expired event remains in Today');

const source=fs.readFileSync(path.join(root,'chunk42.js'),'utf8');
assert(source.includes("item.status!=='archived'&&item.status!=='completed'"),'Resolved statuses are not excluded');
assert(source.includes('span.moment<now'),'Expiration is not based on final date and time');
assert(source.includes('firstOverdueOccurrenceV462'),'Recurring records are not deduplicated');
console.log('✓ expired tasks, assignments, events and trips remain visible in Today');
console.log('✓ red expiration starts only after the final date and time');
console.log('✓ completion, closing or deletion removes the record; recurring items do not duplicate daily');
console.log('✓ expiration does not change normal priority to Important');
console.log('\nAll v4.6.2 expired-record persistence tests passed.');
