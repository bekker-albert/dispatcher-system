(function(){
  state.settings=state.settings||{};
  if(!String(state.settings.ownerName||'').trim())state.settings.ownerName='Альберт Беккер';

  const style=document.createElement('style');
  style.id='today-v22-styles';
  style.textContent=`
    .today-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0 16px}
    .today-metrics .dash-card{min-height:0;padding:10px 11px;display:grid;grid-template-columns:30px 1fr;grid-template-rows:auto auto;column-gap:9px;align-items:center}
    .today-metrics .dash-card .icon{grid-row:1/3;width:30px;height:30px;border-radius:10px;display:grid;place-items:center;font-size:15px;margin:0}
    .today-metrics .dash-card strong{font-size:19px;line-height:1;margin:0}
    .today-metrics .dash-card small{font-size:11px;line-height:1.2;margin-top:3px;color:var(--muted)}
    .today-notes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:15px}
    .today-note{padding:11px;min-height:92px;display:flex;flex-direction:column;gap:6px;overflow:hidden}
    .today-note h4{font-size:14px;line-height:1.25;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .today-note p{font-size:12px;line-height:1.35;color:var(--muted);margin:0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
    .today-note .note-pin{font-size:10px;color:var(--primary);margin-left:auto}
    .today-note.empty-note{grid-column:1/-1;min-height:0;display:flex;flex-direction:row;align-items:center;justify-content:space-between}
    .section-head .text-action{border:0;background:transparent;color:var(--primary);padding:6px 0;font-weight:700}
    #task-actions-dialog{width:min(100% - 18px,520px);max-width:520px;margin:auto auto 8px;border:0;border-radius:24px 24px 18px 18px;padding:0;background:var(--surface);color:var(--text)}
    #task-actions-dialog::backdrop{background:rgba(0,0,0,.62);backdrop-filter:blur(2px)}
    .task-sheet{padding:8px 14px 16px}
    .task-sheet-handle{width:42px;height:4px;border-radius:9px;background:var(--border);margin:2px auto 13px}
    .task-sheet-head{display:flex;align-items:flex-start;gap:10px;padding:0 2px 12px}
    .task-sheet-head>div{flex:1;min-width:0}
    .task-sheet-head h3{font-size:18px;line-height:1.25;margin:2px 0 5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .task-sheet-head p{margin:0;color:var(--muted);font-size:12px}
    .task-actions-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .task-action{border:1px solid var(--border);border-radius:15px;background:var(--surface-2);color:var(--text);padding:12px;text-align:left;display:flex;gap:10px;align-items:center;min-height:54px}
    .task-action span{width:28px;height:28px;border-radius:9px;background:rgba(125,101,255,.15);display:grid;place-items:center;flex:0 0 auto}
    .task-action b{font-size:13px}
    .task-action.danger{color:var(--red)}
    .task-action.danger span{background:rgba(255,109,119,.12)}
    .task-sheet-cancel{width:100%;margin-top:9px;border:0;border-radius:14px;padding:13px;background:transparent;color:var(--muted);font-weight:700}
    .profile-settings-card input[type=text]{width:100%;margin-top:8px}
    @media(max-width:360px){.today-note{grid-column:1/-1}.task-actions-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  function ownerName(){return String(state.settings.ownerName||'Владелец').trim()||'Владелец'}
  function ownerFirstName(){return ownerName().split(/\s+/)[0]||'Владелец'}
  function ownerInitials(){return ownerName().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()).join('')||'Я'}
  function recentNotes(){return state.notes.slice().sort((a,b)=>(Number(b.pinned)-Number(a.pinned))||((b.updatedAt||0)-(a.updatedAt||0))).slice(0,4)}
  function todayNotesHtml(){
    const notes=recentNotes();
    if(!notes.length)return `<article class="card today-note empty-note"><div><strong>Заметок пока нет</strong><p>Запишите мысль, номер, идею или важную информацию.</p></div><button type="button" class="mini-btn" onclick="openEditor('note')">＋</button></article>`;
    return notes.map(n=>`<article class="card today-note" onclick="openEditor('note','${n.id}')"><div class="row-between"><h4>${esc(n.title)}</h4>${n.pinned?'<span class="note-pin">◆</span>':''}</div><p>${esc(n.body||'Без текста')}</p></article>`).join('');
  }

  renderToday=function(){
    const key=dayKey(today),tasks=tasksForDate(key),done=tasks.filter(t=>taskDone(t,key)).length;
    const habits=state.habits.filter(h=>habitDue(h,key)),habitDoneCount=habits.filter(h=>habitDone(h,key)).length;
    const tx=transactionsForDate(key).filter(x=>x.status!=='actual'&&!txSettled(x,key));
    const workouts=workoutsForDate(key).filter(w=>w.status!=='completed');
    const next=upcomingItems()[0];
    document.querySelector('#today').innerHTML=`
      <div class="hero"><div class="hero-top"><div class="assistant-mark">${esc(ownerInitials())}</div><span class="badge">${esc(ownerFirstName())}</span></div><div><small>${next?'Следующее событие':'План свободен'}</small><h2>${next?esc(next.title):'На сегодня срочных событий нет.'}</h2>${next?`<p>◷ ${dateFmt(next.when,{day:'2-digit',month:'2-digit'})}, ${pad(next.when.getHours())}:${pad(next.when.getMinutes())}</p>`:''}</div></div>
      <div class="today-metrics">
        <article class="card dash-card" onclick="setPage('plan')"><div class="icon">✓</div><strong>${done}/${tasks.length}</strong><small>задач сегодня</small></article>
        <article class="card dash-card" onclick="setPage('finance')"><div class="icon">₸</div><strong>${tx.length}</strong><small>платежей сегодня</small></article>
        <article class="card dash-card" onclick="openMore('sport')"><div class="icon">↻</div><strong>${habitDoneCount}/${habits.length}</strong><small>привычек выполнено</small></article>
        <article class="card dash-card" onclick="openMore('sport');setMoreTab('workouts')"><div class="icon">⚡</div><strong>${workouts.length}</strong><small>тренировок</small></article>
      </div>
      <div class="section-head"><h3>Заметки</h3><button type="button" class="text-action" onclick="openMore('notes')">Все заметки</button></div>
      <div class="today-notes">${todayNotesHtml()}</div>
      <div class="section-head"><h3>Задачи</h3><span class="counter">${tasks.length}</span></div>${taskList(tasks,key)}
      <div class="section-head"><h3>Платежи и тренировки</h3></div>${tx.length?tx.map(x=>transactionCard(x,key)).join(''):''}${workouts.length?workouts.map(workoutCard).join(''):''}${!tx.length&&!workouts.length?'<div class="card empty">На сегодня платежей и тренировок нет.</div>':''}`;
  };

  function ensureTaskActionsDialog(){
    let dialog=document.querySelector('#task-actions-dialog');
    if(dialog)return dialog;
    dialog=document.createElement('dialog');
    dialog.id='task-actions-dialog';
    dialog.className='sheet-dialog';
    dialog.innerHTML='<div class="task-sheet"><div class="task-sheet-handle"></div><div class="task-sheet-head"><div><small>Действия с задачей</small><h3 id="task-sheet-title"></h3><p id="task-sheet-meta"></p></div><button type="button" class="close-btn" data-task-action="cancel">×</button></div><div class="task-actions-grid" id="task-actions-grid"></div><button type="button" class="task-sheet-cancel" data-task-action="cancel">Отмена</button></div>';
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
    document.body.appendChild(dialog);
    return dialog;
  }

  let taskActionContext=null;
  taskMenu=function(id,key){
    const task=state.tasks.find(x=>x.id===id);if(!task)return;
    taskActionContext={id,key};
    const dialog=ensureTaskActionsDialog();
    dialog.querySelector('#task-sheet-title').textContent=task.title;
    dialog.querySelector('#task-sheet-meta').textContent=`${dateFmt(key,{day:'numeric',month:'long'})} · ${task.time||'без времени'}`;
    const done=taskDone(task,key),canMove=(task.recurrence?.type||'none')==='none';
    dialog.querySelector('#task-actions-grid').innerHTML=`
      <button type="button" class="task-action" data-task-action="edit"><span>✎</span><b>Изменить</b></button>
      <button type="button" class="task-action" data-task-action="complete"><span>${done?'↶':'✓'}</span><b>${done?'Вернуть в работу':'Выполнено'}</b></button>
      ${canMove?'<button type="button" class="task-action" data-task-action="tomorrow"><span>→</span><b>На завтра</b></button>':''}
      <button type="button" class="task-action" data-task-action="duplicate"><span>⧉</span><b>Дублировать</b></button>
      <button type="button" class="task-action danger" data-task-action="delete"><span>×</span><b>Удалить</b></button>`;
    dialog.querySelectorAll('[data-task-action]').forEach(button=>button.onclick=()=>runTaskAction(button.dataset.taskAction));
    try{if(!dialog.open)dialog.showModal()}catch{dialog.setAttribute('open','')}
  };

  function runTaskAction(action){
    const context=taskActionContext,dialog=ensureTaskActionsDialog();
    if(action==='cancel'){dialog.close();return}
    if(!context)return;
    const task=state.tasks.find(x=>x.id===context.id);if(!task){dialog.close();return}
    dialog.close();
    if(action==='edit'){setTimeout(()=>openEditor('task',task.id),80);return}
    if(action==='complete'){toggleTask(task.id,context.key);return}
    if(action==='tomorrow'){
      task.date=dayKey(addDays(new Date(context.key+'T12:00:00'),1));task.status='active';task.completedDates=[];save();render();toast('Перенесено на завтра');return;
    }
    if(action==='duplicate'){
      const copy=JSON.parse(JSON.stringify(task));copy.id=uid('task');copy.title=task.title+' — копия';copy.status='active';copy.completedDates=[];copy.createdAt=Date.now();state.tasks.push(copy);save();render();toast('Копия создана');return;
    }
    if(action==='delete'){setTimeout(()=>deleteEntity('task',task.id),50)}
  }
  window.taskMenu=taskMenu;

  const previousRenderMoreHome=renderMoreHome;
  renderMoreHome=function(){
    previousRenderMoreHome();
    const root=document.querySelector('#more');
    const profile=root.querySelector('.setting-card');
    if(profile){
      const avatar=profile.querySelector('.assistant-mark');if(avatar)avatar.textContent=ownerInitials();
      const strong=profile.querySelector('strong');if(strong)strong.textContent=ownerName();
    }
    const footer=[...root.querySelectorAll('p')].find(x=>x.textContent.includes('Штаб AI'));if(footer)footer.textContent='Штаб AI · 2.2.0';
  };

  const previousRenderSettings=renderSettings;
  renderSettings=function(){
    previousRenderSettings();
    const root=document.querySelector('#more');
    const sub=root.querySelector('.subnav');
    const card=document.createElement('article');
    card.className='card setting-card profile-settings-card';
    card.innerHTML=`<h3>Профиль</h3><p>Это имя отображается на главном экране и в профиле приложения.</p><label class="field"><span>Имя владельца</span><input id="owner-name-input" type="text" value="${esc(ownerName())}" placeholder="Введите имя"></label><button type="button" class="primary" style="width:100%;margin-top:10px" onclick="saveOwnerName()">Сохранить имя</button>`;
    if(sub)sub.insertAdjacentElement('afterend',card);else root.prepend(card);
  };

  function saveOwnerName(){
    const input=document.querySelector('#owner-name-input'),value=String(input?.value||'').trim();
    if(!value){toast('Введите имя владельца');input?.focus();return}
    state.settings.ownerName=value;save();render();toast('Имя сохранено');
  }
  window.saveOwnerName=saveOwnerName;

  const previousRender=render;
  render=function(){
    headings.today=['Сегодня',`Добрый день, ${ownerFirstName()}`];
    previousRender();
  };
  window.render=render;

  render();
})();