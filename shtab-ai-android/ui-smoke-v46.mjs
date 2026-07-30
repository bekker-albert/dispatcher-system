import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {JSDOM,VirtualConsole} from 'jsdom';

const baselinePath=path.resolve('ui-smoke-v45.mjs');
const generatedPath=path.resolve('.ui-smoke-v46-full.generated.mjs');
let fullAudit=fs.readFileSync(baselinePath,'utf8');
fullAudit=fullAudit
  .replaceAll("scripts.at(-1)==='chunk39.js'","scripts.at(-1)==='chunk40.js'")
  .replaceAll('chunk39 must be loaded last','chunk40 must be loaded last')
  .replaceAll('4.5.2','4.6.0')
  .replaceAll('versionCode = 23','versionCode = 24')
  .replaceAll('All v4.5.2 conditional','All v4.6.0 conditional');
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
window.HTMLElement.prototype.close=function(){this.open=false;this.removeAttribute('open')};
Object.defineProperty(window.navigator,'clipboard',{value:{writeText:async()=>{}},configurable:true});
const scheduled=[];
window.Android={requestInitialPermissions(){},requestNotifications(){},requestExactAlarmPermission(){},scheduleNotification(...args){scheduled.push(args)},cancelNotification(){},startVoiceInput(){},speak(){},showToast(){},updateWidget(){}};
const packedScripts=scripts.map(source=>fs.readFileSync(path.join(root,source),'utf8')).join('\n;\n');
window.eval(`${packedScripts}\n;window.__stateV46=state;`);

const assert=(value,message)=>{if(!value)throw new Error(message)};
assert(errors.length===0,`Runtime errors: ${errors.join('; ')}`);
assert(scripts.at(-1)==='chunk40.js','chunk40 is not loaded last');
assert(window.__shtabDiagnostics.uiVersion()==='4.6.0','UI version is not 4.6.0');
assert(window.__shtabDiagnostics.repeatOptionsV46().join(',')==='daily,weekday,weekdays,weekends','Required repeat modes are missing');

const base={status:'active',date:'2026-08-03',recurrenceEnd:'',recurrence:{type:'weekday',interval:1,weekday:1}};
assert(window.taskOccursOn(base,'2026-08-03'),'Monday recurrence misses its start date');
assert(window.taskOccursOn(base,'2026-08-10'),'Monday recurrence misses next Monday');
assert(!window.taskOccursOn(base,'2026-08-11'),'Monday recurrence appears on Tuesday');
assert(window.taskOccursOn({...base,recurrence:{type:'weekdays',interval:1}},'2026-08-07'),'Weekdays misses Friday');
assert(!window.taskOccursOn({...base,recurrence:{type:'weekdays',interval:1}},'2026-08-08'),'Weekdays appears on Saturday');
assert(window.taskOccursOn({...base,recurrence:{type:'weekends',interval:1}},'2026-08-08'),'Weekends misses Saturday');
assert(window.taskOccursOn({...base,recurrence:{type:'weekends',interval:1}},'2026-08-09'),'Weekends misses Sunday');
assert(!window.taskOccursOn({...base,recurrence:{type:'weekends',interval:1}},'2026-08-10'),'Weekends appears on Monday');
assert(!window.taskOccursOn({...base,recurrenceEnd:'2026-08-09'},'2026-08-10'),'Recurrence continues after its end date');

window.openEditor('task');
let form=window.document.querySelector('#editor-form');
let repeat=form.elements.repeat;
const taskModes=[...repeat.options].map(option=>option.value);
for(const mode of ['daily','weekday','weekdays','weekends'])assert(taskModes.includes(mode),`Task mode missing: ${mode}`);
repeat.value='weekday';repeat.dispatchEvent(new window.Event('change',{bubbles:true}));
assert(!window.document.querySelector('.recurrence-weekday-v46').hidden,'Weekday selector stays hidden');
form.elements.title.value='Проверить недельное напоминание';
form.elements.date.value='2026-08-03';
form.elements.endDate.value='2026-08-03';
form.elements.startTime.value='09:00';
form.elements.endTime.value='10:00';
form.elements.repeatWeekday.value='3';
form.elements.reminderEnabled.checked=true;
form.elements.reminderHours.value='0';
form.elements.reminderMinutes.value='15';
window.submitEditor(form);
const savedTask=window.__stateV46.tasks.at(-1);
assert(savedTask.recurrence.type==='weekday'&&savedTask.recurrence.weekday===3,'Selected weekday was not saved');
assert(savedTask.reminders.length===1&&savedTask.reminders[0]===15,'Reminder offset was not preserved');

window.openEditor('habit');
form=window.document.querySelector('#editor-form');
const frequency=form.elements.frequency;
const habitModes=[...frequency.options].map(option=>option.value);
for(const mode of ['daily','weekday','weekdays','weekends'])assert(habitModes.includes(mode),`Habit mode missing: ${mode}`);
frequency.value='weekends';frequency.dispatchEvent(new window.Event('change',{bubbles:true}));
form.elements.name.value='Привычка выходного дня';
form.elements.reminderTimes.value='09:00';
window.submitEditor(form);
const savedHabit=window.__stateV46.habits.at(-1);
assert(savedHabit.frequency==='weekends'&&savedHabit.days.join(',')==='6,0','Weekend habit schedule was not saved');
assert(window.habitDue(savedHabit,'2026-08-08'),'Weekend habit misses Saturday');
assert(!window.habitDue(savedHabit,'2026-08-10'),'Weekend habit appears on Monday');

const notificationSource=fs.readFileSync(path.join(root,'chunk9.js'),'utf8');
assert(notificationSource.includes('taskOccursOn(t,key)'),'Task notifications do not use occurrence schedule');
assert(notificationSource.includes('habitDue(h,key)'),'Habit notifications do not use occurrence schedule');
console.log('✓ every day, selected weekday, weekdays and weekends calculate correctly');
console.log('✓ task and habit editors save the selected reminder schedule');
console.log('✓ recurrence end stops future occurrences and Android notification planning uses the same schedule');
console.log('\nAll v4.6.0 reminder schedule tests passed.');
