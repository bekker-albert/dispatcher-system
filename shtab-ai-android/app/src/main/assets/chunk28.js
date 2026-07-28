(function(){
  const TODAY_KEY_V32=dayKey(today);
  const style=document.createElement('style');
  style.id='v32-completion-styles';
  style.textContent=`
    .task-check-v31{color:#aeb5c5!important}
    .task-check-v31.pending{border-color:#697286!important;background:rgba(255,255,255,.025)!important;color:#aeb5c5!important}
    .task-check-v31.pending:hover,.task-check-v31.pending:active{border-color:var(--primary)!important;color:#d9d3ff!important;background:rgba(125,101,255,.1)!important}
    .task-check-v31.done{color:#fff!important}
    .important-task-row-v32{grid-template-columns:24px minmax(0,1fr) 24px!important;gap:9px!important;align-items:center!important}
    .important-task-row-v32 .task-check-v31{margin:0!important}
    .important-mark-right-v32{width:22px!important;height:22px!important;border-radius:8px!important;display:grid!important;place-items:center!important;margin:0!important;font-size:15px!important;font-weight:950!important;color:#ff8790!important;background:rgba(255,109,119,.13)!important;border:1px solid rgba(255,109,119,.34)!important}
    .plan-task-check-v32{grid-template-columns:24px 27px minmax(0,1fr) auto!important;gap:8px!important;align-items:center!important}
    .analytics-task-check-v32{grid-template-columns:24px 28px minmax(0,1fr) auto!important;gap:8px!important}
    .plan-task-check-v32 .task-check-v31,.analytics-task-check-v32 .task-check-v31{margin:0!important}
    .task-view-complete-v32{grid-column:1/-1;background:rgba(125,101,255,.13)!important;color:#d8d1ff!important;border:1px solid rgba(125,101,255,.3)!important}
    .task-view-complete-v32.done{background:rgba(55,207,123,.12)!important;color:#79e9a9!important;border-color:rgba(55,207,123,.3)!important}
  `;
  document.head.appendChild(style);

  function taskKeyV32(item,preferred=''){
    if(preferred&&taskOccursOn(item,preferred))return preferred;
    if(taskOccursOn(item,TODAY_KEY_V32))return TODAY_KEY_V32;
    return item.date||TODAY_KEY_V32;
  }
  function checkMarkupV32(item,key,extraClass=''){
    const actualKey=taskKeyV32(item,key),done=taskDone(item,actualKey);
    return `<button type="button" class="task-check task-check-v31 ${done?'done':'pending'} ${extraClass}" data-complete-task-id="${item.id}" data-complete-key="${actualKey}" aria-label="${done?'Вернуть в работу':'Отметить выполненным'}" onclick="event.stopPropagation();toggleTask('${item.id}','${actualKey}')">✓</button>`;
  }
  function makeExistingChecksVisibleV32(root=document){
    root.querySelectorAll('.task-check-v31').forEach(button=>{
      const done=button.classList.contains('done');button.textContent='✓';button.classList.toggle('pending',!done);
    });
  }
  function enhanceImportantV32(){
    document.querySelectorAll('#today [data-important-task-id]').forEach(row=>{
      const item=state.tasks.find(task=>task.id===row.dataset.importantTaskId);if(!item)return;
      row.classList.add('important-task-row-v32');
      if(!row.querySelector('.task-check-v31'))row.insertAdjacentHTML('afterbegin',checkMarkupV32(item,TODAY_KEY_V32,'important-check-v32'));
      const main=row.querySelector('.plan-entry-main-v30');
      const mark=row.querySelector('.plan-entry-icon-v30');
      [...row.children].forEach(child=>{if(child!==main&&child!==mark&&!child.classList.contains('task-check-v31')&&child.tagName==='SPAN')child.remove()});
      if(mark){mark.textContent='!';mark.className='important-mark-right-v32';row.appendChild(mark)}
    });
  }
  function enhancePlanChecksV32(){
    document.querySelectorAll('#plan [data-plan-task-id]').forEach(row=>{
      const item=state.tasks.find(task=>task.id===row.dataset.planTaskId);if(!item)return;
      row.classList.add('plan-task-check-v32');
      if(!row.querySelector('.task-check-v31'))row.insertAdjacentHTML('afterbegin',checkMarkupV32(item,state.selectedDate||TODAY_KEY_V32,'plan-check-v32'));
    });
  }
  function enhanceAnalyticsChecksV32(){
    document.querySelectorAll('#analytics .deadline-row-v30[onclick*="openTaskViewV31"]').forEach(row=>{
      const match=(row.getAttribute('onclick')||'').match(/openTaskViewV31\('([^']+)'/),item=match?state.tasks.find(task=>task.id===match[1]):null;if(!item)return;
      row.classList.add('analytics-task-check-v32');row.dataset.analyticsTaskId=item.id;
      if(!row.querySelector('.task-check-v31'))row.insertAdjacentHTML('afterbegin',checkMarkupV32(item,taskKeyV32(item),'analytics-check-v32'));
    });
  }
  function enhanceCompletionControlsV32(){enhanceImportantV32();enhancePlanChecksV32();enhanceAnalyticsChecksV32();makeExistingChecksVisibleV32()}

  const previousOpenTaskViewV32=window.openTaskViewV31;
  function openTaskViewV32(id,key=''){
    previousOpenTaskViewV32(id,key);
    const item=state.tasks.find(task=>task.id===id),dialog=document.querySelector('#task-view-dialog-v31');if(!item||!dialog)return;
    const actualKey=taskKeyV32(item,key),actions=dialog.querySelector('.task-view-actions-v31');let complete=actions?.querySelector('.task-view-complete-v32');
    if(actions&&!complete){complete=document.createElement('button');complete.type='button';complete.className='task-view-complete-v32';actions.prepend(complete)}
    if(complete){const done=taskDone(item,actualKey);complete.classList.toggle('done',done);complete.textContent=done?'↶ Вернуть в работу':'✓ Выполнить';complete.onclick=()=>{try{dialog.close()}catch{dialog.removeAttribute('open')}toggleTask(item.id,actualKey)}}
  }
  window.openTaskViewV31=openTaskViewV32;openTaskViewV31=openTaskViewV32;

  const previousRenderV32=render;
  render=function(){previousRenderV32();enhanceCompletionControlsV32();const footer=[...document.querySelectorAll('#more p')].find(node=>node.textContent.includes('Штаб AI'));if(footer)footer.textContent='Штаб AI · 3.2.0'};
  window.render=render;
  window.__shtabDiagnostics={...(window.__shtabDiagnostics||{}),uiVersion:()=> '3.2.0',importantCompletionLayout:()=>{const row=document.querySelector('#today [data-important-task-id]');return row?[...row.children].map(node=>node.className||node.tagName):[]},visibleCompletionCount:()=>document.querySelectorAll('.task-check-v31').length};
  render();
})();
//# sourceURL=chunk28.js
