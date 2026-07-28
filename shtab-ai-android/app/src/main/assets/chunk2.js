function taskOccursOn(t,key){
  if(t.status==='archived')return false;
  const start=new Date(t.date+'T12:00:00'),d=new Date(key+'T12:00:00');if(d<start)return false;
  const type=t.recurrence?.type||'none';
  if(type==='none')return t.date===key;
  const diff=Math.round((d-start)/86400000);
  if(type==='daily')return diff%(t.recurrence.interval||1)===0;
  if(type==='weekdays')return d.getDay()!==0&&d.getDay()!==6;
  if(type==='weekly')return d.getDay()===start.getDay()&&Math.floor(diff/7)%(t.recurrence.interval||1)===0;
  if(type==='monthly')return d.getDate()===start.getDate();
  if(type==='yearly')return d.getDate()===start.getDate()&&d.getMonth()===start.getMonth();
  return false;
}
function taskDone(t,key){return t.status==='completed'||(t.completedDates||[]).includes(key)}
function tasksForDate(key){return state.tasks.filter(t=>taskOccursOn(t,key)).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'))}
function transactionOccursOn(tx,key){
  const start=new Date(tx.date+'T12:00:00'),d=new Date(key+'T12:00:00');if(d<start)return false;
  const type=tx.recurrence?.type||'none';if(type==='none')return tx.date===key;
  const diff=Math.round((d-start)/86400000);
  if(type==='daily')return diff%(tx.recurrence.interval||1)===0;
  if(type==='weekdays')return d.getDay()!==0&&d.getDay()!==6;
  if(type==='weekly')return d.getDay()===start.getDay();
  if(type==='monthly')return d.getDate()===start.getDate();
  if(type==='yearly')return d.getDate()===start.getDate()&&d.getMonth()===start.getMonth();
  return false;
}
function txSettled(tx,key){return tx.status==='actual'||(tx.settledDates||[]).includes(key)}
function transactionsForDate(key){return state.transactions.filter(t=>transactionOccursOn(t,key)).sort((a,b)=>(a.time||'12:00').localeCompare(b.time||'12:00'))}
function habitDue(h,key){const d=new Date(key+'T12:00:00');if(!h.active)return false;if(h.frequency==='daily')return true;if(h.frequency==='weekdays')return d.getDay()!==0&&d.getDay()!==6;if(h.frequency==='weekly')return (h.days||[]).includes(d.getDay());if(h.frequency==='custom')return (h.days||[]).includes(d.getDay());return true}
function habitDone(h,key){return Number((h.logs||{})[key]||0)>=Number(h.target||1)}
function workoutsForDate(key){return state.workouts.filter(w=>w.date===key).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'))}
function upcomingItems(){
  const arr=[];
  for(let i=0;i<31;i++){
    const key=dayKey(addDays(today,i));
    tasksForDate(key).forEach(t=>{if(!taskDone(t,key))arr.push({kind:'task',when:dateTime(key,t.time),title:t.title,id:t.id,key})});
    transactionsForDate(key).forEach(tx=>{if(tx.status!=='actual'&&!txSettled(tx,key))arr.push({kind:'finance',when:dateTime(key,tx.time||'09:00'),title:`${tx.type==='expense'?'Оплата':'Поступление'}: ${category(tx.category)?.name||tx.note||'операция'}`,id:tx.id,key})});
    workoutsForDate(key).forEach(w=>{if(w.status!=='completed')arr.push({kind:'workout',when:dateTime(key,w.time),title:w.title,id:w.id,key})});
  }
  return arr.filter(x=>x.when>=new Date()).sort((a,b)=>a.when-b.when);
}

const headings={today:['Сегодня',titleDate(today)],plan:['План','Календарь и повестка'],assistant:['Помощник','Текст и голос'],finance:['Финансы','План, факт и уведомления'],more:['Еще','Все модули и настройки']};
function setPage(p){page=p;state.moreView=p==='more'?state.moreView:'home';render()}
function render(){
  renderToday();renderPlan();renderAssistant();renderFinance();renderMore();
  document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id===page));
  document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.page===page));
  document.querySelector('#page-title').textContent=headings[page][0];document.querySelector('#page-subtitle').textContent=headings[page][1];
  document.querySelector('#fab').style.display=page==='assistant'?'none':'block';
}

