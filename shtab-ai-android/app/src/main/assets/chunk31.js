(function(){
  const TODAY_V41=dayKey(today);
  const GROUPS_V41={tasks:{name:'Задачи и поручения',icon:'✓',done:'выполнено'},trips:{name:'Командировки',icon:'✈',done:'завершено'},events:{name:'События',icon:'◉',done:'проведено'}};
  const kindGroupV41=item=>item?.kind==='trip'?'trips':item?.kind==='event'?'events':'tasks';

  const style=document.createElement('style');style.id='v41-analytics-styles';style.textContent=`
    .analytics-period-note-v41{border:1px solid rgba(125,101,255,.25);background:rgba(125,101,255,.08);border-radius:13px;padding:10px 11px;color:#c9c3ef;font-size:10px;line-height:1.45;margin:1px 0 10px}
    .analytics-summary-v41{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:4px 0 11px}
    .analytics-summary-button-v41{border:1px solid var(--border);background:linear-gradient(145deg,rgba(39,43,58,.96),rgba(20,23,33,.96));border-radius:16px;padding:11px 8px;min-width:0;text-align:left;color:var(--text)}
    .analytics-summary-button-v41 small{display:block;color:var(--muted);font-size:9px;line-height:1.25;min-height:23px}.analytics-summary-button-v41 strong{display:block;font-size:21px;margin-top:4px;line-height:1}.analytics-summary-button-v41 .good{color:var(--green)}.analytics-summary-button-v41 .bad{color:var(--red)}
    .analytics-summary-button-v41.clickable{cursor:pointer}.analytics-summary-button-v41.clickable:active{transform:scale(.98)}
    .category-v41{border:1px solid var(--border);background:var(--surface);border-radius:17px;padding:12px}.category-v41+.category-v41{margin-top:8px}
    .category-head-v41{display:grid;grid-template-columns:32px minmax(0,1fr) auto;gap:9px;align-items:center}.category-icon-v41{width:32px;height:32px;border-radius:11px;display:grid;place-items:center;background:rgba(125,101,255,.13);color:var(--primary);font-size:14px;font-weight:900}.category-head-v41 strong{display:block;font-size:13px}.category-head-v41 small{display:block;color:var(--muted);font-size:9px;margin-top:3px}.category-pct-v41{font-size:19px;font-weight:900}
    .category-progress-v41{height:6px;border-radius:10px;background:var(--surface-2);overflow:hidden;margin-top:10px}.category-progress-v41 span{display:block;height:100%;border-radius:10px;background:linear-gradient(90deg,var(--primary),#55d6ff)}
    .category-actions-v41{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;margin-top:8px}.category-actions-v41 button{border:1px solid var(--border);background:var(--surface-2);color:var(--muted);border-radius:9px;padding:7px 4px;font-size:8px;font-weight:800}.category-actions-v41 button.bad{color:#ff8790;border-color:rgba(255,109,119,.25);background:rgba(255,109,119,.08)}
    .trend-v41{border:1px solid var(--border);border-radius:17px;background:var(--surface);padding:12px;margin:11px 0}.trend-v41 h3{font-size:13px;margin:0}.trend-v41>small{display:block;color:var(--muted);font-size:9px;margin:4px 0 11px}.bars-v41{display:grid;gap:6px;height:96px;align-items:end}.bar-wrap-v41{height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:5px;min-width:0}.bar-v41{width:100%;max-width:28px;min-height:4px;border-radius:7px 7px 3px 3px;background:linear-gradient(180deg,#8c72ff,#4a37be)}.bar-wrap-v41 b,.bar-wrap-v41 small{font-size:8px}.bar-wrap-v41 small{color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
    #analytics-details-dialog-v41{width:min(calc(100% - 22px),440px);max-height:82vh;padding:0;overflow:hidden;border-radius:23px}#analytics-details-dialog-v41::backdrop{background:rgba(0,0,0,.72);backdrop-filter:blur(4px)}
    .analytics-dialog-v41{display:flex;flex-direction:column;max-height:82vh}.analytics-dialog-head-v41{display:flex;align-items:flex-start;gap:10px;padding:15px;border-bottom:1px solid var(--border)}.analytics-dialog-head-v41>div{flex:1;min-width:0}.analytics-dialog-head-v41 h2{font-size:18px;margin:0}.analytics-dialog-head-v41 p{font-size:10px;color:var(--muted);line-height:1.4;margin:5px 0 0}.analytics-dialog-head-v41 button{width:34px;height:34px;border:0;border-radius:11px;background:var(--surface-2);font-size:21px;padding:0}.analytics-dialog-list-v41{overflow:auto;padding:0 12px 12px}
    .analytics-detail-row-v41{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:9px;align-items:center;padding:11px 0;border-bottom:1px solid var(--border);cursor:pointer}.analytics-detail-row-v41:last-child{border-bottom:0}.analytics-detail-row-v41>i{width:27px;height:27px;border-radius:9px;display:grid;place-items:center;background:var(--surface-2);color:var(--primary);font-style:normal}.analytics-detail-row-v41 strong{display:block;font-size:12px;line-height:1.3;overflow-wrap:anywhere}.analytics-detail-row-v41 small{display:block;color:var(--muted);font-size:9px;margin-top:4px}.analytics-detail-row-v41>b{font-size:9px;white-space:nowrap;color:var(--muted)}.analytics-detail-row-v41>b.bad{color:#ff8790}.analytics-detail-row-v41>b.good{color:var(--green)}
  `;document.head.appendChild(style);

  function analyticsStartV41(period){
    if(period==='all')return state.tasks.map(item=>item.date).filter(Boolean).sort()[0]||TODAY_V41;
    return dayKey(addDays(today,-Number(period||30)+1));
  }
  function isDoneV41(item,key){return item.status==='completed'||(item.completedDates||[]).includes(key)||((item.recurrence?.type||'none')==='none'&&(item.completedDates||[]).length>0)}
  function completionDateV41(row){const dates=(row.item.completedDates||[]).slice().sort();return dates.at(-1)||row.due}
  function analyticsRowsV41(period){
    const start=analyticsStartV41(period),rows=[];
    state.tasks.filter(item=>item.status!=='archived').forEach(item=>{
      const group=kindGroupV41(item),recurrence=item.recurrence?.type||'none';
      if(recurrence==='none'){
        const due=item.endDate||item.date||TODAY_V41;
        if(due>=start&&due<=TODAY_V41)rows.push({item,key:item.date||due,due,group,done:isDoneV41(item,item.date||due)});
        return;
      }
      let cursor=new Date(`${start}T12:00:00`),end=new Date(`${TODAY_V41}T12:00:00`),guard=0;
      while(cursor<=end&&guard<740){const key=dayKey(cursor);if(taskOccursOn(item,key))rows.push({item,key,due:key,group,done:isDoneV41(item,key)});cursor=addDays(cursor,1);guard++}
    });
    return rows.map(row=>({...row,expired:!row.done&&row.due<TODAY_V41}));
  }
  function metricV41(rows,group){const list=rows.filter(row=>row.group===group),done=list.filter(row=>row.done).length,expired=list.filter(row=>row.expired).length,open=list.length-done;return {group,list,total:list.length,done,expired,open,pct:list.length?Math.round(done/list.length*100):0}}
  function periodLabelV41(period){return period==='all'?'за всё время':`за ${period} дней`}

  function ensureDetailsDialogV41(){
    let dialog=document.querySelector('#analytics-details-dialog-v41');if(dialog)return dialog;
    dialog=document.createElement('dialog');dialog.id='analytics-details-dialog-v41';dialog.innerHTML=`<div class="analytics-dialog-v41"><div class="analytics-dialog-head-v41"><div><h2 id="analytics-dialog-title-v41"></h2><p id="analytics-dialog-subtitle-v41"></p></div><button type="button" aria-label="Закрыть">×</button></div><div class="analytics-dialog-list-v41" id="analytics-dialog-list-v41"></div></div>`;
    dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});document.body.appendChild(dialog);return dialog;
  }
  function detailRowV41(row){const info=GROUPS_V41[row.group],status=row.done?'Выполнено':row.expired?'Срок истёк':'Открыто',statusClass=row.done?'good':row.expired?'bad':'';return `<div class="analytics-detail-row-v41" onclick="document.querySelector('#analytics-details-dialog-v41')?.close();openTaskViewV31('${row.item.id}','${row.key}')"><i>${info.icon}</i><div><strong>${esc(row.item.title)}</strong><small>${esc(info.name)} · срок ${dateFmt(row.due,{day:'2-digit',month:'short',year:'numeric'})}</small></div><b class="${statusClass}">${status}</b></div>`}
  function openAnalyticsDetailsV41(mode='all',group=''){
    const period=state.analyticsPeriodV40||'30',all=analyticsRowsV41(period),rows=all.filter(row=>(!group||row.group===group)&&(mode==='all'||(mode==='done'&&row.done)||(mode==='expired'&&row.expired)||(mode==='open'&&!row.done&&!row.expired)));
    const names={all:'Все записи периода',done:'Выполненные записи',expired:'Записи с истёкшим сроком',open:'Открытые записи'},dialog=ensureDetailsDialogV41();
    dialog.querySelector('#analytics-dialog-title-v41').textContent=group?`${GROUPS_V41[group].name}: ${names[mode].toLowerCase()}`:names[mode];
    dialog.querySelector('#analytics-dialog-subtitle-v41').textContent=mode==='expired'?`Дата окончания попала в выбранный период, но запись до сих пор не выполнена. Период: ${periodLabelV41(period)}.`:`Показаны записи ${periodLabelV41(period)}.`;
    dialog.querySelector('#analytics-dialog-list-v41').innerHTML=rows.length?rows.sort((a,b)=>b.due.localeCompare(a.due)).map(detailRowV41).join(''):'<div class="simple-empty-v30">Подходящих записей нет.</div>';
    try{if(!dialog.open)dialog.showModal()}catch{dialog.setAttribute('open','')}
  }
  window.openAnalyticsDetailsV41=openAnalyticsDetailsV41;

  function categoryCardV41(metric){const info=GROUPS_V41[metric.group];return `<article class="category-v41"><div class="category-head-v41"><span class="category-icon-v41">${info.icon}</span><div><strong>${info.name}</strong><small>${metric.done} ${info.done} из ${metric.total} ${periodLabelV41(state.analyticsPeriodV40||'30')}</small></div><span class="category-pct-v41">${metric.pct}%</span></div><div class="category-progress-v41"><span style="width:${metric.pct}%"></span></div><div class="category-actions-v41"><button type="button" onclick="openAnalyticsDetailsV41('done','${metric.group}')">Выполнено: ${metric.done}</button><button type="button" onclick="openAnalyticsDetailsV41('open','${metric.group}')">Открыто: ${Math.max(0,metric.open-metric.expired)}</button><button type="button" class="${metric.expired?'bad':''}" onclick="openAnalyticsDetailsV41('expired','${metric.group}')">Срок истёк: ${metric.expired}</button></div></article>`}

  function trendBucketsV41(rows,period){
    const start=analyticsStartV41(period),startDate=new Date(`${start}T12:00:00`),endDate=new Date(`${TODAY_V41}T12:00:00`),days=Math.max(1,Math.round((endDate-startDate)/86400000)+1),count=period==='7'?7:period==='30'?6:period==='90'?6:Math.min(8,Math.max(1,Math.ceil(days/30))),size=Math.max(1,Math.ceil(days/count)),buckets=[];
    for(let i=0;i<count;i++){
      const from=addDays(startDate,i*size),to=i===count-1?endDate:addDays(from,size-1);if(from>endDate)break;
      const fromKey=dayKey(from),toKey=dayKey(to),value=rows.filter(row=>row.done&&completionDateV41(row)>=fromKey&&completionDateV41(row)<=toKey).length,label=period==='7'?dateFmt(from,{weekday:'short'}).replace('.',''):period==='all'?dateFmt(from,{month:'short',year:'2-digit'}).replace('.',''):dateFmt(from,{day:'2-digit',month:'2-digit'});
      buckets.push({value,label});
    }
    return buckets;
  }
  function trendV41(rows,period){const buckets=trendBucketsV41(rows,period),max=Math.max(1,...buckets.map(bucket=>bucket.value));return `<section class="trend-v41"><h3>Динамика выполнения ${periodLabelV41(period)}</h3><small>График перестраивается вместе с выбранным периодом.</small><div class="bars-v41" style="grid-template-columns:repeat(${buckets.length},minmax(0,1fr))">${buckets.map(bucket=>`<div class="bar-wrap-v41"><b>${bucket.value}</b><span class="bar-v41" style="height:${Math.max(4,Math.round(bucket.value/max*64))}px"></span><small>${esc(bucket.label)}</small></div>`).join('')}</div></section>`}
  function completedRowV41(row){const info=GROUPS_V41[row.group];return `<div class="completed-row-v40" data-analytics-task-id="${row.item.id}" onclick="openTaskViewV31('${row.item.id}','${row.key}')"><span class="plan-entry-icon-v30">${info.icon}</span><div><strong>${esc(row.item.title)}</strong><small>${esc(info.name)} · ${dateFmt(completionDateV41(row),{day:'2-digit',month:'short',year:'numeric'})}</small></div><b>Готово</b></div>`}

  function renderAnalyticsV41(){
    const period=state.analyticsPeriodV40||'30',rows=analyticsRowsV41(period),metrics=['tasks','trips','events'].map(group=>metricV41(rows,group)),total=rows.length,done=rows.filter(row=>row.done).length,expired=rows.filter(row=>row.expired).length,pct=total?Math.round(done/total*100):0,recent=rows.filter(row=>row.done).sort((a,b)=>completionDateV41(b).localeCompare(completionDateV41(a))).slice(0,12);
    document.querySelector('#analytics').innerHTML=`<div class="analytics-tools-v40">${[['7','7 дней'],['30','30 дней'],['90','90 дней'],['all','Всё время']].map(([value,label])=>`<button type="button" class="${period===value?'active':''}" onclick="setAnalyticsPeriodV40('${value}')">${label}</button>`).join('')}</div><div class="analytics-period-note-v41">Все показатели ниже рассчитаны по записям, дата окончания которых попадает в выбранный период. <b>«Срок истёк»</b> означает, что дата окончания уже прошла, а запись до сих пор не выполнена.</div><div class="analytics-summary-v41"><button type="button" class="analytics-summary-button-v41 clickable" onclick="openAnalyticsDetailsV41('done')"><small>Выполнено ${periodLabelV41(period)}</small><strong class="good">${done}</strong></button><button type="button" class="analytics-summary-button-v41 clickable" onclick="openAnalyticsDetailsV41('all')"><small>Процент выполнения</small><strong>${pct}%</strong></button><button type="button" class="analytics-summary-button-v41 clickable" onclick="openAnalyticsDetailsV41('expired')"><small>Срок истёк</small><strong class="${expired?'bad':'good'}">${expired}</strong></button></div><div class="category-grid-v40">${metrics.map(categoryCardV41).join('')}</div>${trendV41(rows,period)}<div class="section-head"><h3>Выполненные записи ${periodLabelV41(period)}</h3><span class="counter">${recent.length}</span></div><div class="completed-v40">${recent.length?recent.map(completedRowV41).join(''):'<div class="simple-empty-v30">За выбранный период выполненных записей нет.</div>'}</div>`;
  }

  const previousSetPeriodV41=window.setAnalyticsPeriodV40;
  window.setAnalyticsPeriodV40=function(value){state.analyticsPeriodV40=value;save();render()};setAnalyticsPeriodV40=window.setAnalyticsPeriodV40;
  window.setAnalyticsFocusV40=function(group=''){if(page!=='analytics')setPage('analytics');else render();if(group&&group!=='all')setTimeout(()=>openAnalyticsDetailsV41('all',group),20)};setAnalyticsFocusV40=window.setAnalyticsFocusV40;

  const previousRenderV41=render;
  render=function(){previousRenderV41();renderAnalyticsV41();const footer=[...document.querySelectorAll('#more p')].find(node=>node.textContent.includes('Штаб AI'));if(footer)footer.textContent='Штаб AI · 4.1.0';document.querySelectorAll('button:not([type])').forEach(button=>button.type='button')};window.render=render;
  window.__shtabDiagnostics={...(window.__shtabDiagnostics||{}),uiVersion:()=> '4.1.0',analyticsFilterTabs:()=>document.querySelectorAll('#analytics .analytics-tools-v40').length-1,analyticsExpiredClickable:()=>Boolean(document.querySelector('#analytics .analytics-summary-button-v41[onclick*="expired"]')),analyticsPeriodText:()=>document.querySelector('#analytics')?.textContent||'',analyticsDetailsOpen:()=>Boolean(document.querySelector('#analytics-details-dialog-v41')?.open)};
  render();
})();
//# sourceURL=chunk31.js