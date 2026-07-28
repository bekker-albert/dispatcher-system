const STORAGE='shtab-ai-os-v2';
const OLD_STORAGE='shtab-ai-v1';
const pad=n=>String(n).padStart(2,'0');
const dayKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const monthKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}`;
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const uid=(p='id')=>`${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const money=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(Number(n)||0)+' ₸';
const dateFmt=(v,o={day:'numeric',month:'long'})=>new Intl.DateTimeFormat('ru-RU',o).format(typeof v==='string'?new Date(v+'T12:00:00'):v);
const native=()=>typeof Android!=='undefined';
const today=new Date();

function seed(){
  const d0=dayKey(today),d1=dayKey(addDays(today,1));
  return {
    version:2,
    settings:{notifications:true,defaultReminderOffsets:[15],morningSummary:true,morningTime:'07:30',eveningReview:true,eveningTime:'20:30',overdueReminder:true,quietHours:false,quietStart:'22:00',quietEnd:'07:00',speakResponses:true,confirmDelete:true,hideCompleted:false,currency:'KZT'},
    areas:[
      {id:'work',name:'Работа',icon:'▰',color:'#7d65ff'},
      {id:'personal',name:'Личное',icon:'⌂',color:'#37cf7b'},
      {id:'health',name:'Здоровье и спорт',icon:'⚡',color:'#ffad4d'},
      {id:'finance',name:'Финансы',icon:'₸',color:'#40c8e8'},
      {id:'learning',name:'Развитие',icon:'◎',color:'#d78cff'}],
    projects:[
      {id:'aidarly',name:'Айдарлы',description:'Бюджет, запуск и диспетчеризация',color:'#7d65ff',area:'work',status:'active',createdAt:Date.now()},
      {id:'dispatch',name:'Диспетчерская служба',description:'GPS, отчетность и текущие вопросы',color:'#40c8e8',area:'work',status:'active',createdAt:Date.now()},
      {id:'personal',name:'Личные дела',description:'Дом, автомобиль и документы',color:'#37cf7b',area:'personal',status:'active',createdAt:Date.now()}],
    tasks:[
      {id:uid('task'),title:'Сверить текущие задачи диспетчерской службы',description:'Проверить открытые вопросы и сроки.',date:d0,time:'17:30',duration:30,project:'dispatch',priority:'high',status:'active',tags:['работа'],subtasks:[],recurrence:{type:'none',interval:1},reminders:[30,10],repeatUntilDone:false,completedDates:[],createdAt:Date.now()},
      {id:uid('task'),title:'Подготовить вопросы по бюджету Айдарлы',description:'Собрать изменения и спорные позиции.',date:d1,time:'10:00',duration:60,project:'aidarly',priority:'high',status:'active',tags:['бюджет'],subtasks:[],recurrence:{type:'none',interval:1},reminders:[1440,60],repeatUntilDone:true,completedDates:[],createdAt:Date.now()}],
    accounts:[
      {id:'cash',name:'Наличные',type:'cash',openingBalance:0,color:'#37cf7b',active:true},
      {id:'card',name:'Банковская карта',type:'card',openingBalance:0,color:'#7d65ff',active:true}],
    categories:[
      {id:'salary',name:'Зарплата',type:'income',color:'#37cf7b'},
      {id:'other-income',name:'Другие доходы',type:'income',color:'#40c8e8'},
      {id:'housing',name:'Жилье и коммунальные',type:'expense',color:'#ffad4d'},
      {id:'transport',name:'Транспорт и топливо',type:'expense',color:'#ff6d77'},
      {id:'food',name:'Продукты и питание',type:'expense',color:'#d78cff'},
      {id:'health-exp',name:'Здоровье и спорт',type:'expense',color:'#37cf7b'},
      {id:'other-expense',name:'Прочее',type:'expense',color:'#98a0b3'}],
    transactions:[],budgets:[],
    habits:[
      {id:uid('habit'),name:'Пить воду',description:'Контроль воды в течение дня',area:'health',frequency:'daily',days:[1,2,3,4,5,6,0],target:1,unit:'день',reminderTimes:['09:00','14:00'],logs:{},active:true,createdAt:Date.now()}],
    workouts:[],
    goals:[
      {id:uid('goal'),title:'Тренироваться регулярно',area:'health',target:12,current:0,unit:'тренировок',deadline:dayKey(addDays(today,60)),status:'active',reminders:[10080],createdAt:Date.now()}],
    notes:[],
    messages:[{role:'assistant',text:'Я готов управлять задачами, проектами, финансами, привычками, спортом, целями и заметками. Нажмите микрофон или напишите команду.'}],
    selectedDate:d0,financeMonth:monthKey(today),planMode:'agenda',moreView:'home',moreTab:'active',scheduledNotificationIds:[]
  };
}

function migrateOld(old){
  const s=seed();
  if(!old||typeof old!=='object')return s;
  if(Array.isArray(old.projects))s.projects=old.projects.map(p=>({...p,area:p.area||'work',status:p.status||'active',createdAt:p.createdAt||Date.now()}));
  if(Array.isArray(old.tasks))s.tasks=old.tasks.map(t=>({id:t.id||uid('task'),title:t.title||'Без названия',description:t.description||'',date:t.date||dayKey(today),time:t.time||'18:00',duration:t.duration||30,project:t.project||'',priority:t.priority||'normal',status:t.completed?'completed':'active',tags:t.tags||[],subtasks:t.subtasks||[],recurrence:t.recurrence||{type:'none',interval:1},reminders:Array.isArray(t.reminders)?t.reminders:[15],repeatUntilDone:false,completedDates:t.completed?[t.date]:[],createdAt:t.createdAt||Date.now()}));
  if(Array.isArray(old.messages))s.messages=old.messages;
  return s;
}

let state;
try{
  const stored=JSON.parse(localStorage.getItem(STORAGE)||'null');
  if(stored)state=stored;else state=migrateOld(JSON.parse(localStorage.getItem(OLD_STORAGE)||'null'));
}catch{state=seed()}
normalizeState();
let page='today';
let editor={type:null,id:null,extra:null};
let voiceListening=false;

function normalizeState(){
  const base=seed();
  state={...base,...state,settings:{...base.settings,...(state.settings||{})}};
  ['areas','projects','tasks','accounts','categories','transactions','budgets','habits','workouts','goals','notes','messages','scheduledNotificationIds'].forEach(k=>{if(!Array.isArray(state[k]))state[k]=base[k]||[]});
  state.tasks=state.tasks.map(t=>({...t,description:t.description||'',duration:t.duration||30,tags:t.tags||[],subtasks:t.subtasks||[],recurrence:t.recurrence||{type:'none',interval:1},reminders:Array.isArray(t.reminders)?t.reminders:state.settings.defaultReminderOffsets,completedDates:t.completedDates||[],status:t.status||'active'}));
}
function save(){localStorage.setItem(STORAGE,JSON.stringify(state));syncAllNotifications()}
function project(id){return state.projects.find(x=>x.id===id)}
function area(id){return state.areas.find(x=>x.id===id)}
function account(id){return state.accounts.find(x=>x.id===id)}
function category(id){return state.categories.find(x=>x.id===id)}
function toast(text){const t=document.createElement('div');t.className='toast';t.textContent=text;document.body.appendChild(t);setTimeout(()=>t.remove(),2300)}
function dateTime(date,time='18:00'){return new Date(`${date}T${time}:00`)}
function inQuietHours(d){if(!state.settings.quietHours)return false;const [sh,sm]=state.settings.quietStart.split(':').map(Number),[eh,em]=state.settings.quietEnd.split(':').map(Number);const m=d.getHours()*60+d.getMinutes(),s=sh*60+sm,e=eh*60+em;return s>e?(m>=s||m<e):(m>=s&&m<e)}
function adjustQuiet(d){if(!inQuietHours(d))return d;const [h,m]=state.settings.quietEnd.split(':').map(Number);const x=new Date(d);x.setHours(h,m,0,0);if(x<=d)x.setDate(x.getDate()+1);return x}
function titleDate(d){return dateFmt(d,{weekday:'long',day:'numeric',month:'long'})}
function projectOptions(selected=''){return `<option value="">Без проекта</option>`+state.projects.filter(p=>p.status!=='archived').map(p=>`<option value="${p.id}" ${p.id===selected?'selected':''}>${esc(p.name)}</option>`).join('')}
function areaOptions(selected=''){return state.areas.map(a=>`<option value="${a.id}" ${a.id===selected?'selected':''}>${esc(a.icon+' '+a.name)}</option>`).join('')}
function accountOptions(selected=''){return state.accounts.filter(a=>a.active!==false).map(a=>`<option value="${a.id}" ${a.id===selected?'selected':''}>${esc(a.name)}</option>`).join('')}
function categoryOptions(type,selected=''){return state.categories.filter(c=>c.type===type).map(c=>`<option value="${c.id}" ${c.id===selected?'selected':''}>${esc(c.name)}</option>`).join('')}
const repeatOptions=v=>`<option value="none" ${v==='none'?'selected':''}>Не повторять</option><option value="daily" ${v==='daily'?'selected':''}>Каждый день</option><option value="weekdays" ${v==='weekdays'?'selected':''}>По будням</option><option value="weekly" ${v==='weekly'?'selected':''}>Каждую неделю</option><option value="monthly" ${v==='monthly'?'selected':''}>Каждый месяц</option><option value="yearly" ${v==='yearly'?'selected':''}>Каждый год</option>`;
const reminderChoices=[0,5,10,15,30,60,120,180,1440,2880,10080];
function reminderLabel(n){if(n===0)return 'В момент';if(n<60)return `За ${n} мин`;if(n<1440)return `За ${n/60} ч`;if(n===1440)return 'За 1 день';if(n===2880)return 'За 2 дня';if(n===10080)return 'За неделю';return `За ${n} мин`}
function reminderGrid(selected=[]){return `<div class="check-grid">${reminderChoices.map(n=>`<label class="check-option"><input type="checkbox" name="reminder" value="${n}" ${selected.includes(n)?'checked':''}><span>${reminderLabel(n)}</span></label>`).join('')}</div>`}
function checkedReminders(form){return [...form.querySelectorAll('[name=reminder]:checked')].map(x=>Number(x.value)).sort((a,b)=>b-a)}

