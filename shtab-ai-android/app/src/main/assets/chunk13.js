(function(){
  const style=document.createElement('style');
  style.id='confirm-v23-styles';
  style.textContent=`
    #app-confirm-dialog{width:min(100% - 28px,440px);max-width:440px;border:0;border-radius:22px;padding:0;background:var(--surface);color:var(--text);box-shadow:0 24px 80px rgba(0,0,0,.48)}
    #app-confirm-dialog::backdrop{background:rgba(0,0,0,.66);backdrop-filter:blur(3px)}
    .app-confirm{padding:20px}
    .app-confirm-icon{width:48px;height:48px;border-radius:15px;display:grid;place-items:center;background:rgba(255,109,119,.13);color:var(--red);font-size:23px;font-weight:800;margin-bottom:14px}
    .app-confirm h3{font-size:20px;line-height:1.25;margin:0 0 8px}
    .app-confirm p{font-size:14px;line-height:1.48;color:var(--muted);margin:0;white-space:pre-line}
    .app-confirm-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:20px}
    .app-confirm-actions button{border:0;border-radius:14px;padding:13px 14px;font-weight:800;font-size:14px}
    .app-confirm-cancel{background:var(--surface-2);color:var(--text)}
    .app-confirm-accept{background:var(--red);color:#fff}
  `;
  document.head.appendChild(style);

  function ensureConfirmDialog(){
    let dialog=document.querySelector('#app-confirm-dialog');
    if(dialog)return dialog;
    dialog=document.createElement('dialog');
    dialog.id='app-confirm-dialog';
    dialog.innerHTML=`<div class="app-confirm"><div class="app-confirm-icon">!</div><h3 id="app-confirm-title"></h3><p id="app-confirm-message"></p><div class="app-confirm-actions"><button type="button" class="app-confirm-cancel" id="app-confirm-cancel">Отмена</button><button type="button" class="app-confirm-accept" id="app-confirm-accept">Удалить</button></div></div>`;
    document.body.appendChild(dialog);
    return dialog;
  }

  function askAppConfirm({title='Подтвердите действие',message='',confirmText='Удалить'}={}){
    const dialog=ensureConfirmDialog();
    const titleEl=dialog.querySelector('#app-confirm-title');
    const messageEl=dialog.querySelector('#app-confirm-message');
    const cancel=dialog.querySelector('#app-confirm-cancel');
    const accept=dialog.querySelector('#app-confirm-accept');
    titleEl.textContent=title;
    messageEl.textContent=message;
    accept.textContent=confirmText;
    return new Promise(resolve=>{
      let finished=false;
      const finish=value=>{
        if(finished)return;finished=true;
        dialog.removeEventListener('cancel',onCancel);
        dialog.removeEventListener('click',onBackdrop);
        try{dialog.close()}catch{dialog.removeAttribute('open')}
        resolve(value);
      };
      const onCancel=event=>{event.preventDefault();finish(false)};
      const onBackdrop=event=>{if(event.target===dialog)finish(false)};
      cancel.onclick=()=>finish(false);
      accept.onclick=()=>finish(true);
      dialog.addEventListener('cancel',onCancel);
      dialog.addEventListener('click',onBackdrop);
      try{if(!dialog.open)dialog.showModal()}catch{dialog.setAttribute('open','')}
    });
  }
  window.askAppConfirm=askAppConfirm;

  function entityLabel(type,item){
    const names={task:'задачу',project:'проект',expense:'расход',income:'доход',account:'счёт',budget:'бюджет',category:'категорию',habit:'привычку',workout:'тренировку',goal:'цель',note:'заметку',area:'сферу'};
    const title=item?.title||item?.name||item?.note||'';
    return {kind:names[type]||'запись',title:String(title).trim()};
  }

  function removeEntityNow(type,id){
    const map={task:'tasks',project:'projects',expense:'transactions',income:'transactions',account:'accounts',budget:'budgets',category:'categories',habit:'habits',workout:'workouts',goal:'goals',note:'notes',area:'areas'};
    const collection=map[type];if(!collection||!Array.isArray(state[collection]))return false;
    if(type==='project')state.tasks.forEach(task=>{if(task.project===id)task.project=''});
    if(type==='area'){
      if(state.areas.length<=1){toast('Нельзя удалить единственную сферу');return false}
      const fallback=state.areas.find(area=>area.id!==id)?.id||'';
      state.projects.forEach(project=>{if(project.area===id)project.area=fallback});
      state.habits.forEach(habit=>{if(habit.area===id)habit.area=fallback});
      state.goals.forEach(goal=>{if(goal.area===id)goal.area=fallback});
    }
    state[collection]=state[collection].filter(item=>item.id!==id);
    save();render();toast('Удалено');return true;
  }

  deleteEntity=async function(type,id){
    const item=getEntity(type,id)||(type==='area'?state.areas.find(x=>x.id===id):null);
    if(!item)return;
    const label=entityLabel(type,item);
    let message=label.title?`«${label.title}» будет удалена без возможности отмены.`:`Запись будет удалена без возможности отмены.`;
    if(type==='project'){
      const count=state.tasks.filter(task=>task.project===id).length;
      if(count)message=`Проект «${label.title||'Без названия'}» будет удалён.\n${count} задач останутся в общем списке без проекта.`;
    }
    if(type==='area'){
      if(state.areas.length<=1){toast('Нельзя удалить единственную сферу');return}
      const count=state.projects.filter(project=>project.area===id).length;
      message=`Сфера «${label.title||'Без названия'}» будет удалена.${count?`\nПроекты (${count}) будут перенесены в другую сферу.`:''}`;
    }
    const approved=state.settings.confirmDelete===false?true:await askAppConfirm({title:`Удалить ${label.kind}?`,message,confirmText:'Удалить'});
    if(approved)removeEntityNow(type,id);
  };
  window.deleteEntity=deleteEntity;

  clearCompleted=async function(){
    const removable=state.tasks.filter(task=>(task.recurrence?.type||'none')==='none'&&task.status==='completed');
    if(!removable.length){toast('Выполненных разовых задач нет');return}
    const approved=await askAppConfirm({title:'Очистить выполненные задачи?',message:`Будет удалено задач: ${removable.length}. Повторяющиеся задачи сохранятся.`,confirmText:'Очистить'});
    if(!approved)return;
    state.tasks=state.tasks.filter(task=>(task.recurrence?.type||'none')!=='none'||task.status!=='completed');
    save();render();toast('Выполненные задачи удалены');
  };
  window.clearCompleted=clearCompleted;

  resetData=async function(){
    const approved=await askAppConfirm({title:'Сбросить все данные?',message:'Будут удалены задачи, проекты, финансы, привычки, тренировки, цели, заметки и настройки. Это действие нельзя отменить.',confirmText:'Сбросить'});
    if(!approved)return;
    state=seed();save();render();toast('Данные сброшены');
  };
  window.resetData=resetData;

  // Стандартные браузерные подтверждения в приложении запрещены.
  window.confirm=function(){console.error('Native confirm is disabled');return false};

  const previousRenderMoreHome=renderMoreHome;
  renderMoreHome=function(){previousRenderMoreHome();const footer=[...document.querySelectorAll('#more p')].find(x=>x.textContent.includes('Штаб AI'));if(footer)footer.textContent='Штаб AI · 2.3.0'};

  render();
})();