(function(){
  const TODAY_V45=dayKey(today);
  const style=document.createElement('style');
  style.id='v45-unified-styles';
  style.textContent=`
    .bottom-nav{grid-template-columns:repeat(5,minmax(0,1fr))!important;overflow:visible!important;align-items:end!important;padding-left:7px!important;padding-right:7px!important}
    .bottom-nav .nav-item{min-width:0!important}
    .bottom-nav>#fab.nav-add-v45{position:relative!important;inset:auto!important;z-index:40!important;display:flex!important;visibility:visible!important;opacity:1!important;flex-direction:column!important;align-items:center!important;justify-content:flex-end!important;gap:1px!important;width:100%!important;height:64px!important;margin:0!important;padding:0 2px 4px!important;border:0!important;background:transparent!important;color:var(--muted)!important;box-shadow:none!important;transform:none!important}
    .nav-add-icon-v45{width:52px!important;height:52px!important;margin-top:-16px!important;border-radius:18px!important;display:grid!important;place-items:center!important;background:linear-gradient(145deg,#8c72ff,#5b43d3)!important;color:#fff!important;border:1px solid rgba(255,255,255,.18)!important;box-shadow:0 9px 25px rgba(91,67,211,.42)!important;font-size:30px!important;font-weight:500!important;line-height:1!important}
    .nav-add-v45 small{display:block!important;font-size:8px!important;line-height:1!important;color:#bcb7d5!important;font-weight:800!important;white-space:nowrap!important}
    .nav-add-v45:active .nav-add-icon-v45{transform:scale(.95)}
    #today .simple-window-v30{border-radius:18px!important}
    .today-life-row-v45,.today-goal-row-v45{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px 0;border-bottom:1px solid var(--border)}
    .today-life-row-v45:last-child,.today-goal-row-v45:last-child{border-bottom:0}
    .today-life-main-v45,.today-goal-main-v45{min-width:0;cursor:pointer}
    .today-life-main-v45 strong,.today-goal-main-v45 strong{display:block;font-size:12px;line-height:1.35;white-space:normal;overflow-wrap:anywhere}
    .today-life-main-v45 small,.today-goal-main-v45 small{display:block;color:var(--muted);font-size:9px;line-height:1.4;margin-top:4px}
    .today-life-type-v45{width:28px;height:28px;border-radius:10px;display:grid;place-items:center;background:var(--surface-2);color:var(--primary);font-size:13px;font-weight:900}
    .today-life-check-v45{width:25px!important;height:25px!important}
    .today-goal-progress-v45{height:5px;border-radius:8px;background:var(--surface-2);overflow:hidden;margin-top:7px}.today-goal-progress-v45 span{display:block;height:100%;border-radius:8px;background:linear-gradient(90deg,var(--primary),#55d6ff)}
    .today-goal-actions-v45{display:flex;gap:5px}.today-goal-actions-v45 button{width:28px;height:28px;border:1px solid var(--border);border-radius:9px;background:var(--surface-2);color:var(--text);font-size:15px;padding:0}.today-goal-actions-v45 button:last-child{color:#ddd7ff;border-color:rgba(125,101,255,.35);background:rgba(125,101,255,.11)}
    .today-section-link-v45{width:27px;height:27px;border:0;border-radius:9px;background:var(--surface-2);color:var(--muted);font-size:16px;padding:0}
    @media(max-width:350px){.nav-add-icon-v45{width:48px!important;height:48px!important}.today-life-row-v45,.today-goal-row-v45{gap:8px}.today-goal-actions-v45 button{width:26px;height:26px}}
  `;
  document.head.appendChild(style);

  const directSectionsV45=root=>[...root.children].filter(node=>node.classList?.contains('simple-window-v30'));
  const sectionTitleV45=section=>section.querySelector('.simple-window-head-v30 h3')?.textContent.trim()||'';
  const findSectionV45=(root,title)=>directSectionsV45(root).find(section=>sectionTitleV45(section)===title);
  const simpleWindowV45=(title,count,rows,action='')=>`<section class="simple-window-v30" data-today-section-v45="${esc(title)}"><div class="simple-window-head-v30"><h3>${esc(title)}</h3><div><small>${count}</small>${action}</div></div><div class="simple-window-list-v30">${rows}</div></section>`;
  const deadlineLabelV45=value=>value?dateFmt(value,{day:'numeric',month:'short',year:new Date(`${value}T12:00:00`).getFullYear()!==today.getFullYear()?'numeric':undefined}):'Без срока';

  function habitRowV45(item){
    const done=habitDone(item,TODAY_V45),time=String(item.reminderTimes?.[0]||''),target=`${Number(item.target||1)} ${item.unit||'раз'}`;
    return `<div class="today-life-row-v45" data-today-habit-id="${item.id}"><button type="button" class="check-v40 today-life-check-v45 ${done?'done':''}" aria-label="${done?'Вернуть привычку':'Отметить привычку'}" onclick="event.stopPropagation();toggleHabit('${item.id}','${TODAY_V45}')">✓</button><div class="today-life-main-v45" onclick="openEditor('habit','${item.id}')"><strong>${esc(item.name)}</strong><small>Привычка · ${esc(target)}${time?` · ${esc(time)}`:''}</small></div><span class="today-life-type-v45">↻</span></div>`;
  }
  function workoutRowV45(item){
    const done=item.status==='completed';
    return `<div class="today-life-row-v45" data-today-workout-id="${item.id}"><button type="button" class="check-v40 today-life-check-v45 ${done?'done':''}" aria-label="${done?'Вернуть тренировку':'Завершить тренировку'}" onclick="event.stopPropagation();toggleWorkout('${item.id}')">✓</button><div class="today-life-main-v45" onclick="openEditor('workout','${item.id}')"><strong>${esc(item.title)}</strong><small>Тренировка${item.time?` · ${esc(item.time)}`:''}${item.duration?` · ${Number(item.duration)} мин`:''}</small></div><span class="today-life-type-v45">⚡</span></div>`;
  }
  function goalRowV45(item){
    const current=Number(item.current||0),target=Math.max(0,Number(item.target||0)),pct=target?Math.max(0,Math.min(100,Math.round(current/target*100))):0,deadline=item.deadline?`Срок: ${deadlineLabelV45(item.deadline)}`:'Без установленного срока',unit=item.unit||'';
    return `<div class="today-goal-row-v45" data-today-goal-id="${item.id}"><span class="today-life-type-v45">◎</span><div class="today-goal-main-v45" onclick="openEditor('goal','${item.id}')"><strong>${esc(item.title)}</strong><small>${current}/${target}${unit?` ${esc(unit)}`:''} · ${esc(deadline)}</small><div class="today-goal-progress-v45"><span style="width:${pct}%"></span></div></div><div class="today-goal-actions-v45"><button type="button" aria-label="Уменьшить прогресс" onclick="event.stopPropagation();updateGoal('${item.id}',-1)">−</button><button type="button" aria-label="Увеличить прогресс" onclick="event.stopPropagation();updateGoal('${item.id}',1)">＋</button></div></div>`;
  }
  function sportSectionV45(){
    const habits=state.habits.filter(item=>item.active&&habitDue(item,TODAY_V45)),workouts=workoutsForDate(TODAY_V45),rows=habits.map(habitRowV45).concat(workouts.map(workoutRowV45));
    return rows.length?simpleWindowV45('Спорт и привычки',rows.length,rows.join(''),'<button type="button" class="today-section-link-v45" aria-label="Открыть спорт и привычки" onclick="openMore(\'sport\')">›</button>'):'';
  }
  function goalsSectionV45(){
    const goals=state.goals.filter(item=>item.status!=='archived'&&item.status!=='completed').sort((a,b)=>(a.deadline||'9999-12-31').localeCompare(b.deadline||'9999-12-31')||String(a.title||'').localeCompare(String(b.title||''),'ru'));
    return goals.length?simpleWindowV45('Цели',goals.length,goals.map(goalRowV45).join(''),'<button type="button" class="today-section-link-v45" aria-label="Открыть цели" onclick="openMore(\'goals\')">›</button>'):'';
  }
  function removeEmptyWindowsV45(root){
    directSectionsV45(root).forEach(section=>{
      const title=sectionTitleV45(section);if(title==='Приближающиеся')return;
      if(title==='Тренировки'){section.remove();return}
      const list=section.querySelector('.simple-window-list-v30'),hasContent=Boolean(list&&[...list.children].some(child=>!child.classList.contains('simple-empty-v30')));
      if(!hasContent)section.remove();
    });
  }
  function reorderTodayV45(root){
    const order=['Приближающиеся','Важное','Задачи, поручения и события','Командировки','Спорт и привычки','Цели','Заметки'];
    order.forEach(title=>{const section=findSectionV45(root,title);if(section)root.appendChild(section)});
  }
  function enhanceTodayV45(){
    const root=document.querySelector('#today');if(!root)return;
    root.querySelectorAll('[data-today-section-v45]').forEach(node=>node.remove());
    removeEmptyWindowsV45(root);
    const sport=sportSectionV45(),goals=goalsSectionV45();
    if(sport)root.insertAdjacentHTML('beforeend',sport);
    if(goals)root.insertAdjacentHTML('beforeend',goals);
    removeEmptyWindowsV45(root);
    reorderTodayV45(root);
  }
  function auditApplicationV45(){
    const ids=[...document.querySelectorAll('[id]')].map(node=>node.id),duplicates=ids.filter((id,index)=>ids.indexOf(id)!==index),buttonsWithoutType=document.querySelectorAll('button:not([type])').length,financeVisible=Boolean(document.querySelector('#finance:not([hidden]),[data-page="finance"]')),add=document.querySelector('.bottom-nav>#fab.nav-add-v45'),addStyle=add?getComputedStyle(add):null;
    return{duplicates:[...new Set(duplicates)],buttonsWithoutType,financeVisible,pages:['today','plan','analytics','more','assistant'].every(id=>Boolean(document.querySelector('#'+id))),centralAdd:Boolean(add&&addStyle&&addStyle.display!=='none'&&addStyle.visibility!=='hidden'&&Number(addStyle.opacity||1)>0),quickTypes:[...document.querySelectorAll('#quick-dialog [data-create]')].map(button=>button.dataset.create)};
  }

  const previousRenderV45=render;
  render=function(){
    previousRenderV45();
    if(page==='today')enhanceTodayV45();
    const footer=[...document.querySelectorAll('#more p')].find(node=>node.textContent.includes('Штаб AI'));if(footer)footer.textContent='Штаб AI · 4.5.1';
    document.querySelectorAll('button:not([type])').forEach(button=>button.type='button');
  };
  window.render=render;
  window.__shtabDiagnostics={...(window.__shtabDiagnostics||{}),uiVersion:()=> '4.5.1',todaySectionsV45:()=>directSectionsV45(document.querySelector('#today')).map(sectionTitleV45),todayHabitCountV45:()=>document.querySelectorAll('#today [data-today-habit-id]').length,todayWorkoutCountV45:()=>document.querySelectorAll('#today [data-today-workout-id]').length,todayGoalCountV45:()=>document.querySelectorAll('#today [data-today-goal-id]').length,applicationAuditV45:auditApplicationV45};
  render();
})();
//# sourceURL=chunk37.js
