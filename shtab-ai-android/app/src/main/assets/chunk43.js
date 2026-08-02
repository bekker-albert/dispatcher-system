(function(){
  const TODAY_V470_OVERDUE=dayKey(today);
  const DAY_MS_V470_OVERDUE=86400000;
  const style=document.createElement('style');
  style.id='v470-overdue-today-styles';
  style.textContent=`
    .today-overdue-v470{border-color:rgba(255,94,107,.5)!important;box-shadow:0 0 0 1px rgba(255,94,107,.07),0 14px 35px rgba(90,18,27,.16)!important}
    .today-overdue-v470 .simple-window-head-v30{background:linear-gradient(145deg,rgba(91,26,36,.42),rgba(27,20,29,.92))!important;border-bottom-color:rgba(255,94,107,.28)!important}
    .today-overdue-v470 .simple-window-head-v30 h3{color:#ff9da5!important}.today-overdue-count-v470{min-width:25px;height:25px;padding:0 7px;border-radius:9px;display:grid;place-items:center;background:rgba(255,94,107,.13);border:1px solid rgba(255,94,107,.32);color:#ff9da5;font-size:10px;font-weight:900}
    .today-overdue-row-v470{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:10px;align-items:start;padding:11px 0;border-bottom:1px solid var(--border)}.today-overdue-row-v470:last-child{border-bottom:0}
    .today-overdue-check-v470{width:25px!important;height:25px!important;margin-top:2px;border-color:rgba(255,94,107,.55)!important;color:#ff9da5!important;background:rgba(255,94,107,.06)!important}
    .today-overdue-main-v470{min-width:0;cursor:pointer}.today-overdue-main-v470 strong{display:block;color:#fff;font-size:13px;line-height:1.34;white-space:normal;overflow-wrap:anywhere}.today-overdue-meta-v470{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}.today-overdue-meta-v470 span{display:inline-flex;align-items:center;min-height:21px;padding:3px 7px;border-radius:8px;background:var(--surface-2);color:var(--muted);font-size:9px;line-height:1.25}.today-overdue-meta-v470 .expired{background:rgba(255,94,107,.12);color:#ff9099;border:1px solid rgba(255,94,107,.24);font-weight:850}.today-overdue-menu-v470{width:28px;height:28px;border:0;background:transparent;color:var(--muted);font-size:20px;padding:0;line-height:1}
    @media(max-width:350px){.today-overdue-row-v470{gap:8px}.today-overdue-main-v470 strong{font-size:12px}.today-overdue-meta-v470 span{padding:3px 5px}}
  `;
  document.head.appendChild(style);

  const dateAtNoonV470=value=>new Date(`${value}T12:00:00`);
  const addKeyDaysV470=(key,days)=>dayKey(addDays(dateAtNoonV470(key),days));
  const spanDaysV470=(start,end)=>Math.max(0,Math.round((dateAtNoonV470(end)-dateAtNoonV470(start))/DAY_MS_V470_OVERDUE));
  const kindInfoV470=kind=>({task:{icon:'✓',label:'Задача'},assignment:{icon:'↗',label:'Поручение'},trip:{icon:'✈',label:'Командировка'},event:{icon:'◉',label:'Событие'}}[kind]||{icon:'✓',label:'Задача'});
  function occurrenceSpanV470(item,key=''){
    const originalStart=item.date||key||TODAY_V470_OVERDUE,originalEnd=item.endDate||originalStart,duration=spanDaysV470(originalStart,originalEnd),start=key||originalStart,due=key?addKeyDaysV470(start,duration):originalEnd;
    const hasTime=item.timeEnabled!==false&&Boolean(item.endTime||item.startTime||item.time),endTime=hasTime?(item.endTime||item.startTime||item.time):'23:59';
    return{start,due,endTime,hasTime,moment:new Date(`${due}T${endTime}:59`)};
  }
  function activeTaskV470(item){return item&&item.status!=='archived'&&item.status!=='completed'}
  function firstOverdueOccurrenceV470(item,now=new Date()){
    if(!activeTaskV470(item))return null;
    const recurrence=item.recurrence?.type||'none';
    if(recurrence==='none'){
      const span=occurrenceSpanV470(item);return !taskDone(item,span.start)&&span.moment<now?{item,key:span.start,...span}:null;
    }
    const start=item.date||TODAY_V470_OVERDUE,hardEnd=item.recurrenceEnd&&item.recurrenceEnd<TODAY_V470_OVERDUE?item.recurrenceEnd:TODAY_V470_OVERDUE;
    let cursor=dateAtNoonV470(start),end=dateAtNoonV470(hardEnd),guard=0;
    while(cursor<=end&&guard<3660){
      const key=dayKey(cursor);
      if(taskOccursOn(item,key)){
        const span=occurrenceSpanV470(item,key);
        if(span.moment<now&&!taskDone(item,key))return{item,key,...span};
      }
      cursor=addDays(cursor,1);guard++;
    }
    return null;
  }
  function overdueRowsV470(now=new Date()){
    return state.tasks.map(item=>firstOverdueOccurrenceV470(item,now)).filter(Boolean).sort((a,b)=>a.due.localeCompare(b.due)||(a.endTime||'').localeCompare(b.endTime||'')||String(a.item.title||'').localeCompare(String(b.item.title||''),'ru'));
  }
  function overdueRowV470(row){
    const info=kindInfoV470(row.item.kind),period=row.start===row.due?dateFmt(row.due,{day:'2-digit',month:'short',year:'numeric'}):`${dateFmt(row.start,{day:'2-digit',month:'short'})} — ${dateFmt(row.due,{day:'2-digit',month:'short',year:'numeric'})}`;
    const deadline=row.hasTime?`${period} · до ${row.endTime}`:period;
    return `<div class="today-overdue-row-v470" data-overdue-task-id="${row.item.id}" data-overdue-key="${row.key}"><button type="button" class="task-check today-overdue-check-v470" aria-label="Выполнить" onclick="event.stopPropagation();toggleTask('${row.item.id}','${row.key}')">✓</button><div class="today-overdue-main-v470" onclick="openTaskViewV31('${row.item.id}','${row.key}')"><strong>${esc(row.item.title)}</strong><div class="today-overdue-meta-v470"><span>${info.icon} ${esc(info.label)}</span><span>${esc(deadline)}</span><span class="expired">Срок истёк</span></div></div><button type="button" class="today-overdue-menu-v470" aria-label="Действия" onclick="event.stopPropagation();taskMenu('${row.item.id}','${row.key}')">⋮</button></div>`;
  }
  function overdueSectionV470(rows){return `<section class="simple-window-v30 today-overdue-v470" data-today-overdue-v470><div class="simple-window-head-v30"><h3>Срок истёк</h3><span class="today-overdue-count-v470">${rows.length}</span></div><div class="simple-window-list-v30">${rows.map(overdueRowV470).join('')}</div></section>`}
  function enhanceTodayOverdueV470(){
    const root=document.querySelector('#today');if(!root)return;
    root.querySelector('[data-today-overdue-v470]')?.remove();
    const rows=overdueRowsV470();if(!rows.length)return;
    const upcoming=root.querySelector('.upcoming-events-v42');
    if(upcoming)upcoming.insertAdjacentHTML('afterend',overdueSectionV470(rows));else root.insertAdjacentHTML('afterbegin',overdueSectionV470(rows));
  }
  const previousRenderV470Overdue=render;
  render=function(){previousRenderV470Overdue();if(page==='today')enhanceTodayOverdueV470()};
  window.render=render;
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&page==='today')render()});
  if(!/jsdom/i.test(navigator.userAgent))setInterval(()=>{if(page==='today')enhanceTodayOverdueV470()},60000);
  window.__shtabDiagnostics={...(window.__shtabDiagnostics||{}),overdueRowsV470:(now)=>overdueRowsV470(now?new Date(now):new Date()),overdueTodayIdsV470:()=>[...document.querySelectorAll('#today [data-overdue-task-id]')].map(node=>node.dataset.overdueTaskId)};
  render();
})();
//# sourceURL=chunk43.js
