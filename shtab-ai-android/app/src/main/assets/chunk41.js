(function(){
  const TODAY_V461=dayKey(today);
  const style=document.createElement('style');
  style.id='v461-unified-controls-styles';
  style.textContent=`
    .custom-select-shell-v461{display:block;position:relative;width:100%;min-width:0}
    select.custom-select-native-v461{position:absolute!important;left:0!important;bottom:0!important;width:1px!important;height:1px!important;min-height:0!important;margin:0!important;padding:0!important;opacity:0!important;pointer-events:none!important;clip-path:inset(50%)!important;overflow:hidden!important;border:0!important}
    .custom-select-trigger-v461{width:100%;min-height:46px;display:grid;grid-template-columns:minmax(0,1fr) 30px;align-items:center;gap:9px;padding:10px 10px 10px 13px;border:1px solid var(--border);border-radius:14px;background:linear-gradient(145deg,rgba(27,30,42,.98),rgba(17,19,28,.98));color:var(--text);text-align:left;box-shadow:inset 0 1px 0 rgba(255,255,255,.025);transition:border-color .16s ease,background .16s ease,transform .12s ease}
    .custom-select-trigger-v461:active{transform:scale(.99)}.custom-select-trigger-v461:focus-visible{outline:0;border-color:rgba(125,101,255,.72);box-shadow:0 0 0 3px rgba(125,101,255,.12)}
    .custom-select-trigger-v461:disabled{opacity:.5}.custom-select-value-v461{min-width:0;font-size:12px;font-weight:780;line-height:1.35;white-space:normal;overflow-wrap:anywhere}.custom-select-arrow-v461{width:28px;height:28px;border-radius:10px;display:grid;place-items:center;background:rgba(125,101,255,.11);color:#ad9dff;font-size:15px}
    #custom-select-dialog-v461{width:min(100%,460px);max-height:78vh;margin:auto auto 0;padding:0;border:1px solid rgba(125,101,255,.25);border-bottom:0;border-radius:25px 25px 0 0;background:#151821;color:var(--text);overflow:hidden;box-shadow:0 -20px 65px rgba(0,0,0,.58)}
    #custom-select-dialog-v461::backdrop{background:rgba(0,0,0,.72);backdrop-filter:blur(6px)}
    .custom-select-sheet-v461{display:flex;flex-direction:column;max-height:78vh}.custom-select-handle-v461{width:42px;height:4px;border-radius:99px;background:#45495a;margin:9px auto 2px}.custom-select-head-v461{display:grid;grid-template-columns:minmax(0,1fr) 36px;gap:10px;align-items:center;padding:11px 15px 13px;border-bottom:1px solid var(--border)}
    .custom-select-head-v461 small{display:block;color:#a996ff;font-size:9px;font-weight:850;text-transform:uppercase;letter-spacing:.06em}.custom-select-head-v461 h2{font-size:18px;line-height:1.25;margin:3px 0 0;overflow-wrap:anywhere}.custom-select-close-v461{width:36px;height:36px;border:0;border-radius:12px;background:var(--surface-2);color:var(--text);font-size:22px;padding:0}
    .custom-select-search-wrap-v461{padding:10px 13px 3px}.custom-select-search-v461{width:100%;min-height:43px;border:1px solid var(--border);border-radius:13px;background:#0f1118;color:var(--text);padding:10px 12px;font-size:12px}.custom-select-search-v461:focus{outline:0;border-color:rgba(125,101,255,.65);box-shadow:0 0 0 3px rgba(125,101,255,.1)}
    .custom-select-options-v461{overflow:auto;padding:8px 12px calc(13px + env(safe-area-inset-bottom));scrollbar-width:none}.custom-select-options-v461::-webkit-scrollbar{display:none}.custom-select-option-v461{width:100%;min-height:50px;display:grid;grid-template-columns:minmax(0,1fr) 28px;gap:10px;align-items:center;border:1px solid transparent;border-radius:14px;background:transparent;color:var(--text);padding:10px 10px 10px 12px;text-align:left;margin:2px 0}.custom-select-option-v461 span{font-size:13px;line-height:1.35;overflow-wrap:anywhere}.custom-select-option-v461 i{width:26px;height:26px;border-radius:9px;display:grid;place-items:center;background:var(--surface-2);color:transparent;font-style:normal;font-size:15px;font-weight:900}.custom-select-option-v461.selected{border-color:rgba(125,101,255,.4);background:rgba(125,101,255,.12);color:#e5e0ff}.custom-select-option-v461.selected i{background:rgba(125,101,255,.2);color:#a996ff}.custom-select-option-v461:disabled{opacity:.4}.custom-select-empty-v461{padding:22px 12px;text-align:center;color:var(--muted);font-size:11px}
    #task-view-dialog-v31 .task-view-actions-v31{grid-template-columns:1fr 1fr!important}.task-view-complete-v461{background:linear-gradient(145deg,#846cff,#6248dc)!important;color:#fff!important;box-shadow:0 7px 20px rgba(98,72,220,.25)}#task-view-dialog-v31 .task-view-edit-v31{background:var(--surface-2)!important;color:var(--text)!important;border:1px solid var(--border)!important}
  `;
  document.head.appendChild(style);

  let selectCounterV461=0,activeSelectV461=null,selectObserverQueuedV461=false;
  const textOfSelectedV461=select=>select.selectedOptions?.[0]?.textContent?.trim()||select.options?.[select.selectedIndex]?.textContent?.trim()||'Выберите значение';
  function fieldTitleV461(select){
    const field=select.closest('.field');
    if(field){const direct=[...field.children].find(node=>node.tagName==='SPAN');if(direct?.textContent.trim())return direct.textContent.trim()}
    return select.getAttribute('aria-label')||select.name||'Выберите значение';
  }
  function syncCustomSelectV461(select){
    const shell=select.closest('.custom-select-shell-v461'),button=shell?.querySelector('.custom-select-trigger-v461'),value=button?.querySelector('.custom-select-value-v461');if(!button||!value)return;
    value.textContent=textOfSelectedV461(select);button.disabled=select.disabled;button.setAttribute('aria-label',`${fieldTitleV461(select)}: ${value.textContent}`);
  }
  function ensureCustomSelectDialogV461(){
    let dialog=document.querySelector('#custom-select-dialog-v461');if(dialog)return dialog;
    dialog=document.createElement('dialog');dialog.id='custom-select-dialog-v461';dialog.innerHTML=`<div class="custom-select-sheet-v461"><div class="custom-select-handle-v461"></div><div class="custom-select-head-v461"><div><small>Выбор значения</small><h2 id="custom-select-title-v461"></h2></div><button type="button" class="custom-select-close-v461" aria-label="Закрыть">×</button></div><div class="custom-select-search-wrap-v461" id="custom-select-search-wrap-v461" hidden><input type="search" class="custom-select-search-v461" id="custom-select-search-v461" placeholder="Найти вариант…" autocomplete="off"></div><div class="custom-select-options-v461" id="custom-select-options-v461" role="listbox"></div></div>`;
    dialog.querySelector('.custom-select-close-v461').onclick=()=>dialog.close();dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});dialog.addEventListener('close',()=>{activeSelectV461=null;const search=dialog.querySelector('#custom-select-search-v461');if(search)search.value=''});dialog.querySelector('#custom-select-search-v461').addEventListener('input',event=>renderCustomSelectOptionsV461(event.target.value));document.body.appendChild(dialog);return dialog;
  }
  function optionRowsV461(select,query=''){
    const needle=String(query||'').trim().toLocaleLowerCase('ru-RU');return [...select.options].filter(option=>!needle||option.textContent.toLocaleLowerCase('ru-RU').includes(needle));
  }
  function renderCustomSelectOptionsV461(query=''){
    const dialog=ensureCustomSelectDialogV461(),list=dialog.querySelector('#custom-select-options-v461');list.innerHTML='';if(!activeSelectV461)return;
    const options=optionRowsV461(activeSelectV461,query);if(!options.length){list.innerHTML='<div class="custom-select-empty-v461">Подходящих вариантов нет.</div>';return}
    options.forEach(option=>{const button=document.createElement('button');button.type='button';button.className=`custom-select-option-v461 ${option.selected?'selected':''}`;button.disabled=option.disabled;button.setAttribute('role','option');button.setAttribute('aria-selected',option.selected?'true':'false');const label=document.createElement('span');label.textContent=option.textContent.trim();const check=document.createElement('i');check.textContent='✓';button.append(label,check);button.onclick=()=>{if(!activeSelectV461||option.disabled)return;activeSelectV461.value=option.value;activeSelectV461.dispatchEvent(new Event('input',{bubbles:true}));activeSelectV461.dispatchEvent(new Event('change',{bubbles:true}));syncCustomSelectV461(activeSelectV461);dialog.close()};list.appendChild(button)});
    requestAnimationFrame(()=>list.querySelector('.selected')?.scrollIntoView({block:'center',behavior:'auto'}));
  }
  function openCustomSelectV461(select){
    if(!select||select.disabled)return;activeSelectV461=select;const dialog=ensureCustomSelectDialogV461(),title=dialog.querySelector('#custom-select-title-v461'),searchWrap=dialog.querySelector('#custom-select-search-wrap-v461'),search=dialog.querySelector('#custom-select-search-v461');title.textContent=fieldTitleV461(select);searchWrap.hidden=select.options.length<=9;search.value='';renderCustomSelectOptionsV461();try{if(!dialog.open)dialog.showModal()}catch{dialog.setAttribute('open','')}if(!searchWrap.hidden)setTimeout(()=>search.focus(),80)
  }
  function decorateSelectV461(select){
    if(!(select instanceof HTMLSelectElement)||select.multiple)return;if(select.classList.contains('custom-select-native-v461')){syncCustomSelectV461(select);return}
    const parent=select.parentNode;if(!parent)return;const shell=document.createElement('span');shell.className='custom-select-shell-v461';shell.dataset.customSelectId=`select-v461-${++selectCounterV461}`;parent.insertBefore(shell,select);shell.appendChild(select);select.classList.add('custom-select-native-v461');select.tabIndex=-1;
    const trigger=document.createElement('button');trigger.type='button';trigger.className='custom-select-trigger-v461';trigger.innerHTML='<span class="custom-select-value-v461"></span><span class="custom-select-arrow-v461">⌄</span>';trigger.onclick=event=>{event.preventDefault();event.stopPropagation();openCustomSelectV461(select)};shell.appendChild(trigger);select.addEventListener('change',()=>syncCustomSelectV461(select));new MutationObserver(()=>syncCustomSelectV461(select)).observe(select,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','selected']});syncCustomSelectV461(select);
  }
  function enhanceAllSelectsV461(root=document){root.querySelectorAll?.('select:not([multiple])').forEach(decorateSelectV461)}
  function queueSelectEnhancementV461(){if(selectObserverQueuedV461)return;selectObserverQueuedV461=true;setTimeout(()=>{selectObserverQueuedV461=false;enhanceAllSelectsV461()},0)}
  new MutationObserver(queueSelectEnhancementV461).observe(document.documentElement,{childList:true,subtree:true});

  const previousImportantItemsV461=window.importantItemsV26;
  function importantItemsV461(){
    const rows=[],used=new Set(),important=item=>item.priority==='high'||item.important===true,add=(item,key,urgent=false)=>{if(!item||used.has(item.id)||!important(item)||taskDone(item,key))return;used.add(item.id);rows.push({id:item.id,kind:'task',urgent,title:item.title,meta:`${item.priority==='high'?'Высокий приоритет':'Отмечено важным'} · ${dateFmt(item.endDate||item.date,{day:'2-digit',month:'2-digit',year:'numeric'})}`,action:`openTaskViewV31('${item.id}','${key}')`,sort:urgent?0:1})};
    tasksForDate(TODAY_V461).forEach(item=>add(item,TODAY_V461,false));state.tasks.filter(item=>item.status!=='archived'&&item.status!=='completed'&&important(item)&&(item.recurrence?.type||'none')==='none'&&(item.endDate||item.date||TODAY_V461)<TODAY_V461).forEach(item=>add(item,item.date||TODAY_V461,true));return rows.sort((a,b)=>a.sort-b.sort||a.title.localeCompare(b.title,'ru')).slice(0,6);
  }
  window.importantItemsV26=importantItemsV461;try{importantItemsV26=importantItemsV461}catch{}

  let taskViewContextV461=null;
  const previousOpenTaskViewV461=window.openTaskViewV31;
  function enhanceTaskViewActionsV461(id,key){
    const item=state.tasks.find(task=>task.id===id),dialog=document.querySelector('#task-view-dialog-v31'),actions=dialog?.querySelector('.task-view-actions-v31');if(!item||!dialog||!actions)return;taskViewContextV461={id,key:key||item.date||TODAY_V461};const done=taskDone(item,taskViewContextV461.key);actions.innerHTML=`<button type="button" class="task-view-complete-v461">${done?'↶ Вернуть в работу':'✓ Выполнить'}</button><button type="button" class="task-view-edit-v31">✎ Изменить</button>`;actions.querySelector('.task-view-complete-v461').onclick=()=>{const context=taskViewContextV461;dialog.close();if(context)toggleTask(context.id,context.key)};actions.querySelector('.task-view-edit-v31').onclick=()=>{dialog.close();setTimeout(()=>openEditor('task',id),70)};
  }
  function openTaskViewV461(id,key=''){previousOpenTaskViewV461(id,key);enhanceTaskViewActionsV461(id,key)}
  window.openTaskViewV31=openTaskViewV461;try{openTaskViewV31=openTaskViewV461}catch{}

  const previousOpenEditorV461=openEditor;
  openEditor=function(type,id=null,extra=null){previousOpenEditorV461(type,id,extra);enhanceAllSelectsV461(document.querySelector('#editor-dialog')||document)};window.openEditor=openEditor;
  const previousRenderV461=render;
  render=function(){previousRenderV461();enhanceAllSelectsV461();const footer=[...document.querySelectorAll('#more p')].find(node=>node.textContent.includes('Штаб AI'));if(footer)footer.textContent='Штаб AI · 4.6.1'};window.render=render;
  window.enhanceAllSelectsV461=enhanceAllSelectsV461;
  window.__shtabDiagnostics={...(window.__shtabDiagnostics||{}),uiVersion:()=> '4.6.1',customSelectCountV461:()=>document.querySelectorAll('.custom-select-shell-v461').length,nativeVisibleSelectCountV461:()=>document.querySelectorAll('select:not(.custom-select-native-v461)').length,importantItemsV461:()=>importantItemsV461(),taskViewActionLabelsV461:()=>[...document.querySelectorAll('#task-view-dialog-v31 .task-view-actions-v31 button')].map(button=>button.textContent.trim())};
  enhanceAllSelectsV461();render();
})();
//# sourceURL=chunk41.js
