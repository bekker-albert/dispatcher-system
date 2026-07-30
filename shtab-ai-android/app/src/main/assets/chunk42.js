(function(){
  const ITEM_HEIGHT_V462=52;
  const style=document.createElement('style');
  style.id='v462-time-wheel-styles';
  style.textContent=`
    .custom-select-trigger-v461.time-wheel-trigger-v462 .custom-select-arrow-v461{font-size:0}
    .custom-select-trigger-v461.time-wheel-trigger-v462 .custom-select-arrow-v461::before{content:'◷';font-size:15px}
    #time-wheel-dialog-v462{width:min(100%,460px);margin:auto auto 0;padding:0;border:1px solid rgba(125,101,255,.28);border-bottom:0;border-radius:27px 27px 0 0;background:#151821;color:var(--text);overflow:hidden;box-shadow:0 -22px 70px rgba(0,0,0,.62)}
    #time-wheel-dialog-v462::backdrop{background:rgba(0,0,0,.74);backdrop-filter:blur(7px)}
    .time-wheel-sheet-v462{display:flex;flex-direction:column;max-height:82vh;padding-bottom:env(safe-area-inset-bottom)}
    .time-wheel-handle-v462{width:42px;height:4px;border-radius:99px;background:#45495a;margin:9px auto 2px}
    .time-wheel-head-v462{display:grid;grid-template-columns:minmax(0,1fr) 38px;gap:10px;align-items:center;padding:12px 17px 13px;border-bottom:1px solid var(--border)}
    .time-wheel-head-v462 small{display:block;color:#a996ff;font-size:9px;font-weight:850;text-transform:uppercase;letter-spacing:.07em}
    .time-wheel-head-v462 h2{font-size:20px;line-height:1.22;margin:3px 0 0}
    .time-wheel-close-v462{width:38px;height:38px;border:0;border-radius:13px;background:var(--surface-2);color:var(--text);font-size:23px;padding:0}
    .time-wheel-summary-v462{margin:13px 16px 2px;padding:12px 14px;border:1px solid rgba(125,101,255,.28);border-radius:16px;background:rgba(125,101,255,.09);text-align:center;color:#e4dfff;font-size:16px;font-weight:850;letter-spacing:.02em}
    .time-wheel-columns-v462{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:13px 16px 5px}
    .time-wheel-column-v462{min-width:0}
    .time-wheel-column-v462>span{display:block;text-align:center;color:var(--muted);font-size:10px;font-weight:800;margin-bottom:7px}
    .time-wheel-viewport-v462{position:relative;height:260px;border:1px solid var(--border);border-radius:20px;background:linear-gradient(180deg,#11131b,#191c27 50%,#11131b);overflow:hidden}
    .time-wheel-focus-v462{position:absolute;z-index:2;left:7px;right:7px;top:50%;height:${ITEM_HEIGHT_V462}px;transform:translateY(-50%);border:1px solid rgba(125,101,255,.48);border-radius:15px;background:rgba(125,101,255,.14);box-shadow:0 0 0 1px rgba(125,101,255,.04),inset 0 1px 0 rgba(255,255,255,.04);pointer-events:none}
    .time-wheel-fade-top-v462,.time-wheel-fade-bottom-v462{position:absolute;z-index:3;left:0;right:0;height:76px;pointer-events:none}
    .time-wheel-fade-top-v462{top:0;background:linear-gradient(180deg,#11131b 12%,rgba(17,19,27,0))}
    .time-wheel-fade-bottom-v462{bottom:0;background:linear-gradient(0deg,#11131b 12%,rgba(17,19,27,0))}
    .time-wheel-list-v462{position:absolute;inset:0;z-index:1;overflow-y:auto;scroll-snap-type:y mandatory;overscroll-behavior:contain;scrollbar-width:none;padding:${(260-ITEM_HEIGHT_V462)/2}px 0}
    .time-wheel-list-v462::-webkit-scrollbar{display:none}
    .time-wheel-item-v462{width:100%;height:${ITEM_HEIGHT_V462}px;display:grid;place-items:center;scroll-snap-align:center;border:0;background:transparent;color:#777d8f;font-size:18px;font-weight:760;padding:0;transition:color .13s ease,transform .13s ease,opacity .13s ease}
    .time-wheel-item-v462.selected{color:#fff;font-size:24px;font-weight:900;transform:scale(1.04)}
    .time-wheel-actions-v462{display:grid;grid-template-columns:1fr 1.45fr;gap:10px;padding:12px 16px 15px}
    .time-wheel-actions-v462 button{min-height:50px;border-radius:16px;font-size:13px;font-weight:850}
    .time-wheel-cancel-v462{border:1px solid var(--border);background:var(--surface-2);color:var(--text)}
    .time-wheel-apply-v462{border:0;background:linear-gradient(145deg,#8b71ff,#654bdf);color:#fff;box-shadow:0 8px 23px rgba(101,75,223,.3)}
    @media(max-height:680px){.time-wheel-viewport-v462{height:218px}.time-wheel-list-v462{padding:${(218-ITEM_HEIGHT_V462)/2}px 0}.time-wheel-summary-v462{margin-top:8px}.time-wheel-columns-v462{padding-top:9px}}
  `;
  document.head.appendChild(style);

  let activePairV462=null,draftHoursV462='0',draftMinutesV462='0',scanQueuedV462=false;
  const numericOptionsV462=select=>[...select.options].every(option=>option.value===''||Number.isFinite(Number(option.value)));
  const twoDigitsV462=value=>String(Number(value)||0).padStart(2,'0');
  const pairForSelectV462=select=>{
    const match=String(select?.name||'').match(/^(.*?)(Hours|Minutes)$/);if(!match)return null;
    const form=select.form;if(!form)return null;
    const hours=form.elements[`${match[1]}Hours`],minutes=form.elements[`${match[1]}Minutes`];
    if(!(hours instanceof HTMLSelectElement)||!(minutes instanceof HTMLSelectElement)||!numericOptionsV462(hours)||!numericOptionsV462(minutes))return null;
    return{base:match[1],hours,minutes,title:match[1]==='reminder'?'За сколько напомнить':'Выберите часы и минуты'};
  };
  function ensureTimeWheelDialogV462(){
    let dialog=document.querySelector('#time-wheel-dialog-v462');if(dialog)return dialog;
    dialog=document.createElement('dialog');dialog.id='time-wheel-dialog-v462';
    dialog.innerHTML=`<div class="time-wheel-sheet-v462"><div class="time-wheel-handle-v462"></div><div class="time-wheel-head-v462"><div><small>Выбор времени</small><h2 id="time-wheel-title-v462">За сколько напомнить</h2></div><button type="button" class="time-wheel-close-v462" aria-label="Закрыть">×</button></div><div class="time-wheel-summary-v462" id="time-wheel-summary-v462"></div><div class="time-wheel-columns-v462"><div class="time-wheel-column-v462"><span>Часы</span><div class="time-wheel-viewport-v462"><div class="time-wheel-focus-v462"></div><div class="time-wheel-fade-top-v462"></div><div class="time-wheel-fade-bottom-v462"></div><div class="time-wheel-list-v462" id="time-wheel-hours-v462" data-unit="hours"></div></div></div><div class="time-wheel-column-v462"><span>Минуты</span><div class="time-wheel-viewport-v462"><div class="time-wheel-focus-v462"></div><div class="time-wheel-fade-top-v462"></div><div class="time-wheel-fade-bottom-v462"></div><div class="time-wheel-list-v462" id="time-wheel-minutes-v462" data-unit="minutes"></div></div></div></div><div class="time-wheel-actions-v462"><button type="button" class="time-wheel-cancel-v462">Отмена</button><button type="button" class="time-wheel-apply-v462">Готово</button></div></div>`;
    const cancel=()=>dialog.close();dialog.querySelector('.time-wheel-close-v462').onclick=cancel;dialog.querySelector('.time-wheel-cancel-v462').onclick=cancel;dialog.querySelector('.time-wheel-apply-v462').onclick=commitTimeWheelV462;dialog.addEventListener('click',event=>{if(event.target===dialog)cancel()});dialog.addEventListener('close',()=>{activePairV462=null});document.body.appendChild(dialog);return dialog;
  }
  function valuesFromSelectV462(select){return[...select.options].filter(option=>option.value!=='').map(option=>({value:String(Number(option.value)),label:twoDigitsV462(option.value)}))}
  function updateSummaryV462(){const summary=document.querySelector('#time-wheel-summary-v462');if(summary)summary.textContent=`${twoDigitsV462(draftHoursV462)} ч ${twoDigitsV462(draftMinutesV462)} мин`}
  function markSelectedV462(list,value){list.querySelectorAll('.time-wheel-item-v462').forEach(item=>item.classList.toggle('selected',item.dataset.value===String(Number(value))))}
  function setDraftValueV462(unit,value,{scroll=false}={}){
    const normalized=String(Number(value)||0);if(unit==='hours')draftHoursV462=normalized;else draftMinutesV462=normalized;
    const list=document.querySelector(unit==='hours'?'#time-wheel-hours-v462':'#time-wheel-minutes-v462');if(list){markSelectedV462(list,normalized);if(scroll){const item=list.querySelector(`[data-value="${CSS.escape(normalized)}"]`);if(item)list.scrollTop=item.offsetTop-(list.clientHeight-ITEM_HEIGHT_V462)/2}}
    updateSummaryV462();
  }
  function renderWheelV462(list,values,selected,unit){
    list.innerHTML='';values.forEach(entry=>{const button=document.createElement('button');button.type='button';button.className='time-wheel-item-v462';button.dataset.unit=unit;button.dataset.value=entry.value;button.textContent=entry.label;button.onclick=()=>{setDraftValueV462(unit,entry.value);button.scrollIntoView({block:'center',behavior:'smooth'})};list.appendChild(button)});
    let timer=0;list.onscroll=()=>{clearTimeout(timer);timer=setTimeout(()=>{const index=Math.max(0,Math.min(values.length-1,Math.round(list.scrollTop/ITEM_HEIGHT_V462)));setDraftValueV462(unit,values[index]?.value??0)},70)};
    requestAnimationFrame(()=>{setDraftValueV462(unit,selected,{scroll:true})});
  }
  function openTimeWheelV462(select){
    const pair=pairForSelectV462(select);if(!pair)return;activePairV462=pair;draftHoursV462=String(Number(pair.hours.value)||0);draftMinutesV462=String(Number(pair.minutes.value)||0);
    const dialog=ensureTimeWheelDialogV462();dialog.querySelector('#time-wheel-title-v462').textContent=pair.title;renderWheelV462(dialog.querySelector('#time-wheel-hours-v462'),valuesFromSelectV462(pair.hours),draftHoursV462,'hours');renderWheelV462(dialog.querySelector('#time-wheel-minutes-v462'),valuesFromSelectV462(pair.minutes),draftMinutesV462,'minutes');updateSummaryV462();
    try{if(!dialog.open)dialog.showModal()}catch{dialog.setAttribute('open','')}
  }
  function commitTimeWheelV462(){
    if(!activePairV462)return;const{hours,minutes}=activePairV462;hours.value=draftHoursV462;minutes.value=draftMinutesV462;[hours,minutes].forEach(select=>{select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}))});ensureTimeWheelDialogV462().close();
  }
  function decorateTimeWheelSelectV462(select){
    const pair=pairForSelectV462(select),shell=select.closest('.custom-select-shell-v461'),trigger=shell?.querySelector('.custom-select-trigger-v461');if(!pair||!trigger||trigger.dataset.timeWheelV462==='true')return;
    trigger.dataset.timeWheelV462='true';trigger.classList.add('time-wheel-trigger-v462');trigger.onclick=event=>{event.preventDefault();event.stopPropagation();openTimeWheelV462(select)};trigger.setAttribute('aria-label',`${pair.title}: ${twoDigitsV462(pair.hours.value)} часов ${twoDigitsV462(pair.minutes.value)} минут`);
  }
  function enhanceTimeWheelsV462(root=document){root.querySelectorAll?.('select.custom-select-native-v461').forEach(decorateTimeWheelSelectV462)}
  function queueEnhanceV462(){if(scanQueuedV462)return;scanQueuedV462=true;requestAnimationFrame(()=>{scanQueuedV462=false;enhanceTimeWheelsV462()})}
  new MutationObserver(queueEnhanceV462).observe(document.documentElement,{childList:true,subtree:true});
  const previousOpenEditorV462=openEditor;openEditor=function(type,id=null,extra=null){previousOpenEditorV462(type,id,extra);queueEnhanceV462()};window.openEditor=openEditor;
  const previousRenderV462=render;render=function(){previousRenderV462();queueEnhanceV462();const footer=[...document.querySelectorAll('#more p')].find(node=>node.textContent.includes('Штаб AI'));if(footer)footer.textContent='Штаб AI · 4.6.2'};window.render=render;
  window.openTimeWheelV462=openTimeWheelV462;window.commitTimeWheelV462=commitTimeWheelV462;window.setDraftValueV462=setDraftValueV462;
  window.__shtabDiagnostics={...(window.__shtabDiagnostics||{}),uiVersion:()=> '4.6.2',timeWheelTriggerCountV462:()=>document.querySelectorAll('[data-time-wheel-v462="true"]').length,timeWheelTitleV462:()=>document.querySelector('#time-wheel-title-v462')?.textContent||'',timeWheelSummaryV462:()=>document.querySelector('#time-wheel-summary-v462')?.textContent||''};
  enhanceTimeWheelsV462();render();
})();
//# sourceURL=chunk42.js
