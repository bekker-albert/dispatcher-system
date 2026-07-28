function notificationTitle(kind,title){if(kind==='finance')return `Финансы: ${title}`;if(kind==='habit')return `Привычка: ${title}`;if(kind==='workout')return `Тренировка: ${title}`;if(kind==='goal')return `Цель: ${title}`;return title}
function scheduleNative(id,title,body,when,channel='normal'){if(!native()||!state.settings.notifications||when<=new Date())return;const d=adjustQuiet(when);try{Android.scheduleNotification(id,title,body,d.getTime(),channel)}catch{try{Android.scheduleNotification(id,title,d.getTime())}catch{}}state.scheduledNotificationIds.push(id)}
function syncAllNotifications(){
  if(!native())return;try{(state.scheduledNotificationIds||[]).forEach(id=>Android.cancelNotification(id))}catch{}state.scheduledNotificationIds=[];
  if(!state.settings.notifications){localStorage.setItem(STORAGE,JSON.stringify(state));return}
  const horizon=addDays(today,60);
  state.tasks.forEach(t=>{for(let i=0;i<=60;i++){const key=dayKey(addDays(today,i));if(!taskOccursOn(t,key)||taskDone(t,key))continue;const due=dateTime(key,t.time);(t.reminders||[]).forEach(off=>scheduleNative(`task:${t.id}:${key}:${off}`,notificationTitle('task',t.title),t.description||'Запланированная задача',new Date(due.getTime()-off*60000),t.priority==='high'?'important':'normal'));if(t.repeatUntilDone){[10,30,60].forEach(after=>scheduleNative(`task:${t.id}:${key}:after${after}`,t.title,'Задача еще не отмечена выполненной',new Date(due.getTime()+after*60000),'important'))}}});
  state.transactions.forEach(tx=>{for(let i=0;i<=60;i++){const key=dayKey(addDays(today,i));if(!transactionOccursOn(tx,key)||txSettled(tx,key))continue;const due=dateTime(key,tx.time||'09:00');(tx.reminders||[]).forEach(off=>scheduleNative(`tx:${tx.id}:${key}:${off}`,notificationTitle('finance',category(tx.category)?.name||tx.sourceName||tx.note||'Платеж'),`${tx.type==='expense'?'Расход':'Доход'} ${money(tx.amount)}`,new Date(due.getTime()-off*60000),'finance'))}});
  state.habits.forEach(h=>{for(let i=0;i<=30;i++){const key=dayKey(addDays(today,i));if(!habitDue(h,key)||habitDone(h,key))continue;(h.reminderTimes||[]).forEach(tm=>scheduleNative(`habit:${h.id}:${key}:${tm}`,notificationTitle('habit',h.name),h.description||'Отметьте выполнение',dateTime(key,tm),'health'))}});
  state.workouts.forEach(w=>{if(w.status==='completed')return;const due=dateTime(w.date,w.time);(w.reminders||[]).forEach(off=>scheduleNative(`workout:${w.id}:${off}`,notificationTitle('workout',w.title),w.plan||`${w.duration} минут`,new Date(due.getTime()-off*60000),'health'))});
  state.goals.forEach(g=>{if(g.status!=='active'||!g.deadline)return;const due=dateTime(g.deadline,'09:00');(g.reminders||[]).forEach(off=>scheduleNative(`goal:${g.id}:${off}`,notificationTitle('goal',g.title),`${g.current}/${g.target} ${g.unit||''}`,new Date(due.getTime()-off*60000),'normal'))});
  for(let i=0;i<30;i++){const key=dayKey(addDays(today,i));if(state.settings.morningSummary)scheduleNative(`summary:morning:${key}`,'План на день','Откройте Штаб AI и проверьте задачи, платежи и привычки.',dateTime(key,state.settings.morningTime),'normal');if(state.settings.eveningReview)scheduleNative(`summary:evening:${key}`,'Итоги дня','Отметьте выполненное и перенесите незавершенное.',dateTime(key,state.settings.eveningTime),'normal')}
  localStorage.setItem(STORAGE,JSON.stringify(state));
}
window.syncAllNotifications=syncAllNotifications;

function openQuick(){document.querySelector('#quick-dialog')?.showModal()}
function closeDialog(id){document.querySelector('#'+id)?.close()}
function openMore(v){page='more';state.moreView=v;state.moreTab=v==='sport'?'habits':'active';render()}
function setMoreTab(v){state.moreTab=v;render()}
function selectDate(k){state.selectedDate=k;save();render()}
function moveSelectedDate(n){selectDate(dayKey(addDays(new Date(state.selectedDate+'T12:00:00'),n)))}
function setPlanMode(m){state.planMode=m;save();render()}
function moveFinanceMonth(n){const [y,m]=state.financeMonth.split('-').map(Number),d=new Date(y,m-1+n,1);state.financeMonth=monthKey(d);save();render()}
function setSetting(k,v){state.settings[k]=v;save();render()}
function saveDefaultReminders(){state.settings.defaultReminderOffsets=checkedReminders(document.querySelector('#more'));save();toast('Настройки сохранены')}
function requestNotifications(){if(native())try{Android.requestNotifications()}catch{}else toast('Доступно в APK')}
function clearCompleted(){if(state.settings.confirmDelete&&!confirm('Удалить выполненные разовые задачи?'))return;state.tasks=state.tasks.filter(t=>t.recurrence?.type!=='none'||t.status!=='completed');save();render()}
function resetData(){if(confirm('Удалить все данные и вернуть стартовые?')){state=seed();save();render()}}
function openBackup(mode){const d=document.querySelector('#backup-dialog'),t=document.querySelector('#backup-text');d.dataset.mode=mode;document.querySelector('#backup-title').textContent=mode==='export'?'Резервная копия':'Восстановление';document.querySelector('#backup-help').textContent=mode==='export'?'Скопируйте текст и сохраните в надежном месте.':'Вставьте ранее сохраненный текст.';t.value=mode==='export'?JSON.stringify(state,null,2):'';document.querySelector('#backup-copy').style.display=mode==='export'?'inline-block':'none';document.querySelector('#backup-apply').style.display=mode==='import'?'inline-block':'none';d.showModal()}
function globalSearch(q){q=q.toLowerCase().trim();if(!q)return[];const out=[];state.tasks.filter(x=>(x.title+' '+x.description).toLowerCase().includes(q)).forEach(x=>out.push({type:'Задача',title:x.title,action:`openEditor('task','${x.id}')`}));state.projects.filter(x=>(x.name+' '+x.description).toLowerCase().includes(q)).forEach(x=>out.push({type:'Проект',title:x.name,action:`openEditor('project','${x.id}')`}));state.notes.filter(x=>(x.title+' '+x.body).toLowerCase().includes(q)).forEach(x=>out.push({type:'Заметка',title:x.title,action:`openEditor('note','${x.id}')`}));return out.slice(0,30)}

window.setPage=setPage;window.openMore=openMore;window.openEditor=openEditor;window.openProject=openProject;window.setMoreTab=setMoreTab;window.toggleProjectArchive=toggleProjectArchive;window.toggleTask=toggleTask;window.taskMenu=taskMenu;window.toggleHabit=toggleHabit;window.toggleWorkout=toggleWorkout;window.updateGoal=updateGoal;window.quickCommand=quickCommand;window.startVoice=startVoice;window.selectDate=selectDate;window.moveSelectedDate=moveSelectedDate;window.setPlanMode=setPlanMode;window.moveFinanceMonth=moveFinanceMonth;window.setSetting=setSetting;window.saveDefaultReminders=saveDefaultReminders;window.requestNotifications=requestNotifications;window.clearCompleted=clearCompleted;window.resetData=resetData;window.openBackup=openBackup;

document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>setPage(b.dataset.page));
document.querySelector('#fab')?.addEventListener('click',openQuick);
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeDialog(b.dataset.close));
document.querySelectorAll('[data-create]').forEach(b=>b.onclick=()=>{closeDialog('quick-dialog');openEditor(b.dataset.create)});
document.querySelector('#editor-close').onclick=()=>closeDialog('editor-dialog');document.querySelector('#editor-cancel').onclick=()=>closeDialog('editor-dialog');document.querySelector('#editor-form').onsubmit=e=>{e.preventDefault();submitEditor(e.currentTarget)};
const legacyNotifyButton=document.querySelector('#notify-btn');if(legacyNotifyButton)legacyNotifyButton.onclick=requestNotifications;
document.querySelector('#search-btn').onclick=()=>{const d=document.querySelector('#search-dialog'),i=document.querySelector('#global-search');i.value='';document.querySelector('#search-results').innerHTML='';d.showModal();setTimeout(()=>i.focus(),80)};
document.querySelector('#global-search').oninput=e=>{document.querySelector('#search-results').innerHTML=globalSearch(e.target.value).map(x=>`<div class="search-result" onclick="closeDialog('search-dialog');${x.action}"><strong>${esc(x.title)}</strong><br><small>${x.type}</small></div>`).join('')||'<div class="empty">Ничего не найдено.</div>'};
document.querySelector('#backup-copy').onclick=async()=>{try{await navigator.clipboard.writeText(document.querySelector('#backup-text').value);toast('Скопировано')}catch{document.querySelector('#backup-text').select();document.execCommand('copy');toast('Скопировано')}};
document.querySelector('#backup-apply').onclick=()=>{try{const x=JSON.parse(document.querySelector('#backup-text').value);state=(x&&Number(x.version)>=2)?x:migrateOld(x);normalizeState();save();closeDialog('backup-dialog');render();toast('Данные восстановлены')}catch{toast('Неверный формат копии')}};

render();syncAllNotifications();