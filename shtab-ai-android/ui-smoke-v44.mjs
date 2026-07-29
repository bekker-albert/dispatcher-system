import fs from 'node:fs';
import path from 'node:path';
import {JSDOM,VirtualConsole} from 'jsdom';

const root=path.resolve('app/src/main/assets');
const htmlSource=fs.readFileSync(path.join(root,'index.html'),'utf8');
const scripts=[...htmlSource.matchAll(/<script[^>]+src="([^"]+)"[^>]*><\/script>/g)].map(match=>match[1]);
const html=htmlSource.replace(/<script[^>]+src="[^"]+"[^>]*><\/script>/g,'');
const errors=[],virtualConsole=new VirtualConsole();
virtualConsole.on('jsdomError',error=>errors.push(String(error.message||error)));
const dom=new JSDOM(html,{url:'https://shtab-ai.local/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole});
const {window}=dom;
window.console.error=(...args)=>errors.push(args.map(String).join(' '));
window.confirm=()=>{throw new Error('system confirm forbidden')};window.prompt=()=>{throw new Error('system prompt forbidden')};window.alert=()=>{throw new Error('system alert forbidden')};
window.requestAnimationFrame=callback=>setTimeout(callback,0);window.HTMLElement.prototype.scrollIntoView=function(){};window.HTMLElement.prototype.showModal=function(){this.open=true;this.setAttribute('open','')};window.HTMLElement.prototype.close=function(){this.open=false;this.removeAttribute('open')};
Object.defineProperty(window.navigator,'clipboard',{value:{writeText:async()=>{}},configurable:true});
window.Android={requestInitialPermissions(){},requestNotifications(){},requestExactAlarmPermission(){},scheduleNotification(){},cancelNotification(){},startVoiceInput(){},speak(){},showToast(){},updateWidget(){}};

const parts=[];
for(const source of scripts){
  if(source==='chunk36.js')parts.push(`
    const __t=dayKey(today),__y=dayKey(addDays(today,-1)),__m2=dayKey(addDays(today,-2)),__m3=dayKey(addDays(today,-3)),__p1=dayKey(addDays(today,1)),__p2=dayKey(addDays(today,2)),__p3=dayKey(addDays(today,3));
    state.tasks=[];state.habits=[];state.workouts=[];state.goals=[];state.notes=[];state.settings.upcomingEventDays=7;
    const base={description:'',project:'',priority:'normal',tags:[],subtasks:[],recurrence:{type:'none',interval:1},recurrenceEnd:'',reminders:[],repeatUntilDone:false,status:'active',completedDates:[],createdAt:Date.now()};
    state.tasks.push({...base,id:'done-long',kind:'task',title:'Очень длинное название выполненной записи, которое должно переноситься без горизонтального сжатия и деформации текста',date:__y,endDate:__y,startTime:'09:00',time:'09:00',endTime:'10:00',status:'completed',completedDates:[__y]});
    state.tasks.push({...base,id:'active-until-tonight',kind:'task',title:'Активна до конца сегодняшнего дня',date:__m2,endDate:__t,startTime:'08:00',time:'08:00',endTime:'23:59'});
    state.tasks.push({...base,id:'future-end',kind:'task',title:'Многодневная задача с будущей датой окончания',date:__y,endDate:__p1,startTime:'08:00',time:'08:00',endTime:'18:00'});
    state.tasks.push({...base,id:'expired-final',kind:'task',title:'Срок действительно истёк по последней дате',date:__m3,endDate:__y,startTime:'08:00',time:'08:00',endTime:'18:00'});
    state.tasks.push({...base,id:'daily-one-row',kind:'task',title:'Ежедневная повторяющаяся задача',date:__t,endDate:__t,startTime:'11:00',time:'11:00',endTime:'11:30',recurrence:{type:'daily',interval:1}});
    state.tasks.push({...base,id:'trip-period',kind:'trip',title:'Командировка с периодом',date:__p1,endDate:__p3,startTime:'07:00',time:'07:00',endTime:'20:00'});
    state.tasks.push({...base,id:'event-one',kind:'event',title:'Будущее событие',date:__p2,endDate:__p2,startTime:'15:00',time:'15:00',endTime:'16:00'});
    state.habits.push({id:'habit-one',name:'Ближайшая привычка',description:'',area:'health',frequency:'daily',days:[1,2,3,4,5,6,0],target:1,unit:'раз',reminderTimes:['09:00'],logs:{},active:true,createdAt:Date.now()});
    state.workouts.push({id:'workout-one',title:'Будущая тренировка',type:'other',date:__p2,time:'19:00',duration:45,plan:'',result:'',reminders:[],status:'planned',createdAt:Date.now()});
    state.goals.push({id:'goal-one',title:'Цель с будущим сроком',area:'personal',current:0,target:1,unit:'результат',deadline:__p3,reminders:[],status:'active',createdAt:Date.now()});
    state.notes.push({id:'note-one',title:'Заметка с датой',body:'',tags:[],pinned:false,reminderDate:__p2,reminderTime:'12:00',updatedAt:Date.now(),createdAt:Date.now()});
  `);
  parts.push(fs.readFileSync(path.join(root,source),'utf8'));
}
try{window.eval(parts.join('\n;\n'))}catch(error){errors.push(`initialization: ${error.stack||error}`)}
const assert=(value,message)=>{if(!value)throw new Error(message)};
const run=async(name,test)=>{try{await test();console.log(`✓ ${name}`)}catch(error){errors.push(`${name}: ${error.stack||error}`);console.log(`✕ ${name}`)}};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

await run('version and patch order',async()=>{assert(scripts.indexOf('chunk36.js')>scripts.indexOf('chunk35.js'),'chunk36 order is wrong');assert(window.__shtabDiagnostics.uiVersion()==='4.4.0','UI version is not 4.4.0')});
await run('completed rows are not horizontally compressed',async()=>{window.setAnalyticsPeriodV40('7');window.setPage('analytics');const row=window.document.querySelector('[data-analytics-task-id="done-long"]');assert(row?.classList.contains('completed-row-v44'),'New completed row layout missing');assert(row.children.length===2,'Completed row still uses squeezed multi-column layout');assert(row.querySelector('strong')?.textContent.includes('Очень длинное'),'Long completed title missing');const css=window.document.querySelector('#v44-styles')?.textContent||'';assert(css.includes('grid-template-columns:32px minmax(0,1fr)'),'Responsive completed grid missing');assert(css.includes('white-space:normal'),'Completed title wrapping missing')});
await run('expired status uses the final date and time',async()=>{const rows=window.__shtabDiagnostics.analyticsRowsV44('7'),byId=id=>rows.find(row=>row.item.id===id);assert(byId('expired-final')?.expired===true,'Actually expired record not counted');assert(byId('active-until-tonight')?.expired===false,'Record was expired before its final time');assert(!byId('future-end'),'Record with future final date entered the historical period');window.setPage('analytics');assert(window.document.querySelector('.analytics-period-note-v41')?.textContent.includes('последней дате'),'Final-date explanation missing')});
await run('upcoming shows one row per record with its period',async()=>{window.setUpcomingEventDaysV42(7);window.setPage('today');const rows=[...window.document.querySelectorAll('#today [data-upcoming-token]')],tokens=rows.map(row=>row.dataset.upcomingToken);assert(tokens.length===new Set(tokens).size,'Upcoming records are duplicated');assert(rows.filter(row=>row.dataset.upcomingToken==='task:daily-one-row').length===1,'Recurring task duplicated by day');const trip=rows.find(row=>row.dataset.upcomingToken==='task:trip-period');assert(trip?.textContent.includes('Период:'),'Trip period label missing');assert(trip?.textContent.includes('—'),'Multi-day period range missing');for(const type of ['task','trip','event','habit','workout','goal','note'])assert(rows.some(row=>row.dataset.upcomingType===type),`Upcoming type missing: ${type}`)});
await run('scheduled notes can be edited',async()=>{window.openEditor('note','note-one');const dialog=window.document.querySelector('#editor-dialog');assert(dialog.open,'Note editor did not open');assert(dialog.querySelector('[name="reminderDate"]')?.value,'Scheduled note date missing');assert(dialog.querySelector('[name="reminderTime"]')?.value==='12:00','Scheduled note time missing');dialog.close()});
await run('retained pages render and buttons remain valid',async()=>{for(const page of ['today','plan','analytics','more','assistant']){window.setPage(page);assert(window.document.querySelector(`#${page}.active`),`${page} page inactive`)}window.document.querySelectorAll('button').forEach(button=>assert(button.getAttribute('type'),'Button type missing'));await wait(20)});

if(errors.length){console.log('\nAudit failures:');errors.forEach(error=>console.log(`- ${error}`));process.exit(1)}
console.log('\nAll v4.4 analytics final-date, readable rows and deduplicated upcoming tests passed.');
