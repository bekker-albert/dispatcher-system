(function(){
  const TODAY_V462=dayKey(today);
  const DAY_MS_V462=86400000;
  const style=document.createElement('style');
  style.id='v462-overdue-today-styles';
  style.textContent=`
    .today-overdue-v462{border-color:rgba(255,94,107,.5)!important;box-shadow:0 0 0 1px rgba(255,94,107,.07),0 14px 35px rgba(90,18,27,.16)!important}
    .today-overdue-v462 .simple-window-head-v30{background:linear-gradient(145deg,rgba(91,26,36,.42),rgba(27,20,29,.92))!important;border-bottom-color:rgba(255,94,107,.28)!important}
    .today-overdue-v462 .simple-window-head-v30 h3{color:#ff9da5!important}.today-overdue-count-v462{min-width:25px;height:25px;padding:0 7px;border-radius:9px;display:grid;place-items:center;background:rgba(255,94,107,.13);border:1px solid rgba(255,94,107,.32);color:#ff9da5;font-size:10px;font-weight:900}
    .today-overdue-row-v462{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:10px;align-items:start;padding:11px 0;border-bottom:1px solid var(--border)}.today-overdue-row-v462:last-child{border-bottom:0}
    .today-overdue-check-v462{width:25px!important;height:25px!important;margin-top:2px;border-color:rgba(255,94,107,.55)!important;color:#ff9da5!important;background:rgba(255,94,107,.06)!important}
    .today-overdue-main-v462{min-width:0;cursor:pointer}.today-overdue-main-v462 strong{display:block;color:#fff;font-size:13px;line-height:1.34;white-space:normal;overflow-wrap:anywhere}.today-overdue-meta-v462{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}.today-overdue-meta-v462 span{display:inline-flex;align-items:center;min-height:21px;padding:3px 7px;border-radius:8px;background:var(--surface-2);color:var(--muted);font-size:9px;line-height:1.25}.today-overdue-meta-v462 .expired{background:rgba(255,94,107,.12);color:#ff9099;border:1px solid rgba(255,94,107,.24);font-weight:850}.today-overdue-menu-v462{width:28px;height:28px;border:0;background:transparent;color:var(--muted);font-size:20px;padding:0;line-height:1}
    @media(max-width:350px){.today-overdue-row-v462{gap:8px}.today-overdue-main-v462 strong{font-size:12px}.today-overdue-meta-v462 span{padding:3px 5px}}
  `;
  document.head.appendChild(style);

  const dateAtNoonV462=value=>new Date(`${value}T12:00:00`);
  const addKeyDaysV462=(key,days)=>dayKey(addDays(dateAtNoonV462(key),days));
  const spanDaysV462=(start,end)=>Math.max(0,Math.round((dateAtNoonV462(end)-dateAtNoonV462(start))/DAY_MS_V462));
  const kindInfoV462=kind=>({task:{icon:'✓',label:'Задача'},assignment:{icon:'↗',label:'Поручение'},trip:{icon:'✈',label:'Командировка'},event:{icon:'◉',label:'Событие'}}[kind]||{icon:'✓',label:'Задача'});
  function occurrenceSpanV462(item,key=''){
    const originalStart=item.date||key||TODAY_V462,originalEnd=item.endDate||originalStart,duration=spanDaysV462(originalStart,originalEnd),start=key||originalStart,due=key?addKeyDaysV462(start,duration):originalEnd,endTime=item.endTime||item.startTime||item.time||'23:59';
    return{start,due,endTime,moment:new Date(`${due}T${endTime}:59`)};
  }
  function activeTaskV462(item){return item&&item.status!=='archived'&&item.status!=='completed'}
  function firstOverdueOccurrenceV462(item,now=new Date()){
    if(!activeTaskV462(item))return null;
    const recurrence=item.recurrence?.type||'none';
    if(recurrence==='none'){
      const span=occurrenceSpanV462(item);return !taskDone(item,span.start)&&span.moment<now?{item,key:span.start,...span}:null;
    }
    const start=item.date||TODAY_V462,hardEnd=item.recurrenceEnd&&item.recurrenceEnd<TODAY_V462?item.recurrenceEnd:TODAY_V462;
    let cursor=dateAtNoonV462(start),end=dateAtNoonV462(hardEnd),guard=0;
    while(cursor<=end&&guard<3660){
      const key=dayKey(cursor);
      if(taskOccursOn(item,key)){
        const span=occurrenceSpanV462(item,key);
        if(span.moment<now&&!taskDone(item,key))return{item,key,...span};
      }
      cursor=addDays(cursor,1);guard++;
    }
    return null;
  }
  function overdueRowsV462(now=new Date()){
    return state.tasks.map(item=>firstOverdueOccurrenceV462(item,now)).filter(Boolean).sort((a,b)=>a.due.localeCompare(b.due)||(a.endTime||'').localeCompare(b.endTime||'')||String(a.item.title||'').localeCompare(String(b.item.title||''),'ru'));
  }
  function overdueRowV462(row){
    const info=kindInfoV462(row.item.kind),period=row.start===row.due?dateFmt(row.due,{day:'2-digit',month:'short',year:'numeric'}):`${dateFmt(row.start,{day:'2-digit',month:'short'})} — ${dateFmt(row.due,{day:'2-digit',month:'short',year:'numeric'})}`;
    return `<div class="today-overdue-row-v462" data-overdue-task-id="${row.item.id}" data-overdue-key="${row.key}"><button type="button" class="task-check today-overdue-check-v462" aria-label="Выполнить" onclick="event.stopPropagation();toggleTask('${row.item.id}','${row.key}')">✓</button><div class="today-overdue-main-v462" onclick="openTaskViewV31('${row.item.id}','${row.key}')"><strong>${esc(row.item.title)}</strong><div class="today-overdue-meta-v462"><span>${info.icon} ${esc(info.label)}</span><span>${esc(period)} · до ${esc(row.endTime)}</span><span class="expired">Срок истёк</span></div></div><button type="button" class="today-overdue-menu-v462" aria-label="Действия" onclick="event.stopPropagation();taskMenu('${row.item.id}','${row.key}')">⋮</button></div>`;
  }
  function overdueSectionV462(rows){return `<section class="simple-window-v30 today-overdue-v462" data-today-overdue-v462><div class="simple-window-head-v30"><h3>Срок истёк</h3><span class="today-overdue-count-v462">${rows.length}</span></div><div class="simple-window-list-v30">${rows.map(overdueRowV462).join('')}</div></section>`}
  function enhanceTodayOverdueV462(){
    const root=document.querySelector('#today');if(!root)return;
    root.querySelector('[data-today-overdue-v462]')?.remove();
    const rows=overdueRowsV462();if(!rows.length)return;
    const upcoming=root.querySelector('.upcoming-events-v42');
    if(upcoming)upcoming.insertAdjacentHTML('afterend',overdueSectionV462(rows));else root.insertAdjacentHTML('afterbegin',overdueSectionV462(rows));
  }
  const previousRenderV462=render;
  render=function(){previousRenderV462();if(page==='today')enhanceTodayOverdueV462();const footer=[...document.querySelectorAll('#more p')].find(node=>node.textContent.includes('Штаб AI'));if(footer)footer.textContent='Штаб AI · 4.6.2'};
  window.render=render;
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&page==='today')render()});
  if(!/jsdom/i.test(navigator.userAgent))setInterval(()=>{if(page==='today')enhanceTodayOverdueV462()},60000);
  window.__shtabDiagnostics={...(window.__shtabDiagnostics||{}),uiVersion:()=> '4.6.2',overdueRowsV462:(now)=>overdueRowsV462(now?new Date(now):new Date()),overdueTodayIdsV462:()=>[...document.querySelectorAll('#today [data-overdue-task-id]')].map(node=>node.dataset.overdueTaskId)};
  render();
})();
//# sourceURL=chunk42.js
