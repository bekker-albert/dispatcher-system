(function(){
  const supportedCreateTypes=['task','expense','income','project','habit','workout','goal','note'];
  state.analyticsRange=[7,30,90].includes(Number(state.analyticsRange))?Number(state.analyticsRange):30;

  function safeDialogOpen(dialog){
    if(!dialog)return;
    try{if(!dialog.open)dialog.showModal()}catch{try{dialog.setAttribute('open','')}catch{}}
  }

  openEditor=function(type,id=null,extra=null){
    editor={type,id,extra:extra||{}};
    const item=getEntity(type,id)||{};
    const dialog=document.querySelector('#editor-dialog');
    const fields=document.querySelector('#editor-fields');
    const error=document.querySelector('#editor-error');
    if(!dialog||!fields||!error){toast('Редактор недоступен');return}
    error.hidden=true;
    document.querySelector('#editor-kicker').textContent=id?'Редактирование':'Создание';
    document.querySelector('#editor-title').textContent=editorTitle(type,id);
    document.querySelector('#editor-submit').textContent=id?'Сохранить':'Создать';
    try{
      fields.innerHTML=editorFields(type,item,extra||{})+(id?`<button type="button" class="secondary danger-btn" style="width:100%;margin-top:14px" onclick="deleteEntity('${type}','${id}');closeDialog('editor-dialog')">Удалить</button>`:'');
      safeDialogOpen(dialog);
      setTimeout(()=>fields.querySelector('input,textarea,select')?.focus(),100);
    }catch(err){
      console.error('Editor open error',type,err);
      error.textContent='Не удалось открыть форму. Ошибка записана в диагностике.';
      error.hidden=false;
      safeDialogOpen(dialog);
    }
  };
  window.openEditor=openEditor;

  function bindQuickCreate(){
    document.querySelectorAll('[data-create]').forEach(button=>{
      button.type='button';
      button.onclick=event=>{
        event.preventDefault();event.stopPropagation();
        const type=button.dataset.create;
        if(!supportedCreateTypes.includes(type)){toast('Неизвестный тип записи');return}
        document.body.classList.add('dialog-opening');
        closeDialog('quick-dialog');
        setTimeout(()=>{document.body.classList.remove('dialog-opening');openEditor(type,null,{})},110);
      };
    });
  }
  bindQuickCreate();

  document.querySelectorAll('.nav-item').forEach(button=>{
    button.type='button';
    button.onclick=()=>{
      if(button.dataset.page==='more')state.moreView='home';
      setPage(button.dataset.page);
    };
  });

  function analyticsSnapshot(days){
    const end=new Date(today);end.setHours(12,0,0,0);
    const start=addDays(end,-days+1);
    let planned=0,completed=0,overdue=0,plannedMinutes=0,completedMinutes=0;
    const byProject=new Map(),byPriority={high:{planned:0,done:0},normal:{planned:0,done:0},low:{planned:0,done:0}};
    const daily=[];
    for(let i=0;i<days;i++){
      const d=addDays(start,i),key=dayKey(d),items=tasksForDate(key);
      let dayPlanned=0,dayDone=0;
      items.forEach(task=>{
        const done=taskDone(task,key),duration=Number(task.duration||0),pid=task.project||'none';
        planned++;dayPlanned++;plannedMinutes+=duration;
        if(done){completed++;dayDone++;completedMinutes+=duration}
        if(!done&&dateTime(key,task.time||'23:59')<new Date())overdue++;
        if(!byProject.has(pid))byProject.set(pid,{planned:0,done:0});
        const row=byProject.get(pid);row.planned++;if(done)row.done++;
        const priority=byPriority[task.priority]||byPriority.normal;priority.planned++;if(done)priority.done++;
      });
      daily.push({key,planned:dayPlanned,done:dayDone});
    }
    let streak=0;
    for(let i=daily.length-1;i>=0;i--){const x=daily[i];if(!x.planned)continue;if(x.done===x.planned)streak++;else break}
    return {days,planned,completed,overdue,plannedMinutes,completedMinutes,byProject,byPriority,daily,percent:planned?Math.round(completed/planned*100):0,streak};
  }

  function bucketBars(snapshot){
    const size=Math.max(1,Math.ceil(snapshot.days/12)),buckets=[];
    for(let i=0;i<snapshot.daily.length;i+=size){
      const rows=snapshot.daily.slice(i,i+size),planned=rows.reduce((s,x)=>s+x.planned,0),done=rows.reduce((s,x)=>s+x.done,0);
      buckets.push({label:dateFmt(rows[rows.length-1].key,{day:'2-digit',month:'2-digit'}),planned,done,pct:planned?Math.round(done/planned*100):0});
    }
    const max=Math.max(1,...buckets.map(x=>x.planned));
    return `<div class="analytics-bars">${buckets.map(x=>`<div class="analytics-bar-wrap" title="${x.done} из ${x.planned}"><div class="analytics-bar" style="height:${Math.max(4,Math.round(x.done/max*100))}%"></div><span>${x.label}</span></div>`).join('')}</div>`;
  }

  function projectAnalytics(snapshot){
    const rows=[...snapshot.byProject.entries()].map(([id,x])=>({name:id==='none'?'Без проекта':project(id)?.name||'Удаленный проект',...x,pct:x.planned?Math.round(x.done/x.planned*100):0})).sort((a,b)=>b.planned-a.planned);
    if(!rows.length)return '<div class="empty">Нет данных за выбранный период.</div>';
    return `<div class="analytics-list">${rows.map(x=>`<div class="analytics-row"><span class="label">${esc(x.name)}</span><span class="track"><i style="width:${x.pct}%"></i></span><small>${x.done}/${x.planned}</small></div>`).join('')}</div>`;
  }

  function priorityAnalytics(snapshot){
    const names={high:'Высокий',normal:'Обычный',low:'Низкий'};
    return `<div class="analytics-list">${Object.entries(snapshot.byPriority).map(([key,x])=>{const pct=x.planned?Math.round(x.done/x.planned*100):0;return `<div class="analytics-row"><span class="label">${names[key]}</span><span class="track"><i style="width:${pct}%"></i></span><small>${x.done}/${x.planned}</small></div>`}).join('')}</div>`;
  }

  function analyticsView(){
    const a=analyticsSnapshot(state.analyticsRange);
    return `<div class="analytics-range">${[7,30,90].map(n=>`<button type="button" class="${state.analyticsRange===n?'active':''}" onclick="setAnalyticsRange(${n})">${n} дней</button>`).join('')}</div>
      <div class="analytics-grid">
        <article class="card analytics-card"><small>Выполнение</small><strong>${a.percent}%</strong><small>${a.completed} из ${a.planned} задач</small></article>
        <article class="card analytics-card"><small>Просрочено сейчас</small><strong>${a.overdue}</strong><small>за выбранный период</small></article>
        <article class="card analytics-card"><small>Закрытая нагрузка</small><strong>${Math.round(a.completedMinutes/60)} ч</strong><small>из ${Math.round(a.plannedMinutes/60)} ч плана</small></article>
        <article class="card analytics-card"><small>Серия</small><strong>${a.streak}</strong><small>полностью закрытых дней</small></article>
        <article class="card analytics-card analytics-wide"><div class="row-between"><div><strong style="font-size:17px;margin:0">Динамика выполнения</strong><small>Высота столбца — выполненные задачи</small></div></div>${bucketBars(a)}</article>
        <article class="card analytics-card analytics-wide"><strong style="font-size:17px;margin:0 0 14px">По проектам</strong>${projectAnalytics(a)}</article>
        <article class="card analytics-card analytics-wide"><strong style="font-size:17px;margin:0 0 14px">По приоритетам</strong>${priorityAnalytics(a)}</article>
      </div>`;
  }

  renderPlan=function(){
    const key=state.selectedDate,d=new Date(key+'T12:00:00');
    const days=Array.from({length:21},(_,i)=>addDays(d,i-10));
    const tasks=tasksForDate(key),tx=transactionsForDate(key),workouts=workoutsForDate(key);
    document.querySelector('#plan').innerHTML=`
      <div class="plan-toolbar"><button type="button" onclick="moveSelectedDate(-1)">‹</button><button type="button" class="today-btn" onclick="selectDate('${dayKey(today)}')">${dateFmt(d,{day:'numeric',month:'long',year:d.getFullYear()!==today.getFullYear()?'numeric':undefined})}</button><button type="button" onclick="moveSelectedDate(1)">›</button></div>
      <div class="date-strip" id="date-strip">${days.map(x=>`<button type="button" data-date="${dayKey(x)}" class="date-chip ${dayKey(x)===key?'selected':''}" onclick="selectDate('${dayKey(x)}')"><span>${dateFmt(x,{weekday:'short'})}</span><strong>${x.getDate()}</strong></button>`).join('')}</div>
      <div class="view-switch" style="margin:10px 0"><button type="button" class="${state.planMode==='agenda'?'active':''}" onclick="setPlanMode('agenda')">Повестка</button><button type="button" class="${state.planMode==='month'?'active':''}" onclick="setPlanMode('month')">Месяц</button><button type="button" class="${state.planMode==='analytics'?'active':''}" onclick="setPlanMode('analytics')">Аналитика</button></div>
      ${state.planMode==='month'?monthCalendar(d):state.planMode==='analytics'?analyticsView():agendaView(key,tasks,tx,workouts)}`;
    requestAnimationFrame(()=>document.querySelector('#date-strip .selected')?.scrollIntoView({behavior:'auto',inline:'center',block:'nearest'}));
  };

  function setAnalyticsRange(days){state.analyticsRange=Number(days);save();render()}
  function openAnalytics(){page='plan';state.planMode='analytics';render()}
  window.setAnalyticsRange=setAnalyticsRange;window.openAnalytics=openAnalytics;

  renderAssistant=function(){
    document.querySelector('#assistant').innerHTML=`<div class="assistant-wrap">
      <div class="mode-note"><div class="mode-icon">🎙</div><div><strong>Голосовые команды — локальный режим</strong><small>Речь распознаёт системный сервис Android, часто Google. Команды выполняет встроенная логика приложения. Облачный ИИ сейчас не подключён.</small></div></div>
      <div class="voice-card"><button type="button" class="voice-btn ${voiceListening?'listening':''}" onclick="startVoice()">🎙</button><div><strong>${voiceListening?'Слушаю…':'Продиктовать команду'}</strong><br><small>${native()?'Нажмите и говорите':'Голос доступен в APK'}</small></div></div>
      <div class="chips"><button type="button" class="chip" onclick="quickCommand('Что у меня сегодня?')">Что сегодня?</button><button type="button" class="chip" onclick="quickCommand('Какой баланс?')">Баланс</button><button type="button" class="chip" onclick="quickCommand('Что просрочено?')">Просрочено</button></div>
      <div class="chat" id="chat">${state.messages.map(m=>`<div class="bubble ${m.role}">${esc(m.text)}</div>`).join('')}</div>
      <form class="chat-form" id="chat-form"><input id="chat-input" placeholder="Напишите команду…"><button type="submit" class="send">↑</button></form></div>`;
    document.querySelector('#chat-form').onsubmit=e=>{e.preventDefault();const input=document.querySelector('#chat-input');quickCommand(input.value);input.value=''};
    requestAnimationFrame(()=>{const chat=document.querySelector('#chat');if(chat)chat.scrollTop=chat.scrollHeight});
  };
  headings.assistant=['Помощник','Локальные команды · голос Android'];

  function runInterfaceDiagnostics(){
    const checks=[];
    const check=(name,fn)=>{try{const result=fn();checks.push({name,ok:result!==false})}catch(error){checks.push({name,ok:false,error:String(error.message||error)})}};
    check('Основные страницы',()=>['today','plan','assistant','finance','more'].every(id=>document.getElementById(id)));
    check('Нижняя навигация',()=>document.querySelectorAll('.nav-item').length===5);
    check('Быстрое добавление',()=>document.querySelectorAll('[data-create]').length===supportedCreateTypes.length);
    supportedCreateTypes.forEach(type=>check(`Форма: ${type}`,()=>{const html=editorFields(type,{},{});return typeof html==='string'&&html.length>0}));
    check('Форма сферы жизни',()=>editorFields('area',{},{}).length>0);
    check('Поиск',()=>typeof globalSearch==='function');
    check('Резервная копия',()=>typeof openBackup==='function');
    check('Аналитика задач',()=>analyticsSnapshot(7).days===7);
    check('Уведомления',()=>typeof syncAllNotifications==='function');
    const ids=[...document.querySelectorAll('[id]')].map(x=>x.id),duplicates=ids.filter((x,i)=>ids.indexOf(x)!==i);
    check('Уникальные элементы интерфейса',()=>duplicates.length===0);
    return checks;
  }

  function renderDiagnostics(){
    const checks=runInterfaceDiagnostics(),failed=checks.filter(x=>!x.ok);
    document.querySelector('#more').innerHTML=`${subnav('Диагностика','Проверка элементов приложения')}<article class="card self-test ${failed.length?'bad':'good'}"><div class="row-between"><strong>${failed.length?'Найдены ошибки':'Проверка пройдена'}</strong><span class="counter">${checks.length-failed.length}/${checks.length}</span></div><ul>${checks.map(x=>`<li>${x.ok?'✓':'✕'} ${esc(x.name)}${x.error?` — ${esc(x.error)}`:''}</li>`).join('')}</ul></article><button type="button" class="primary" style="width:100%;margin-top:12px" onclick="showDiagnostics()">Проверить еще раз</button>`;
  }
  function showDiagnostics(){page='more';state.moreView='diagnostics';render()}
  window.showDiagnostics=showDiagnostics;

  const originalRenderMore=renderMore;
  renderMore=function(){if(state.moreView==='diagnostics')return renderDiagnostics();return originalRenderMore()};
  const originalRenderMoreHome=renderMoreHome;
  renderMoreHome=function(){
    originalRenderMoreHome();
    const grid=document.querySelector('#more .module-grid');
    if(grid){
      grid.insertAdjacentHTML('beforeend','<article class="card module-card" onclick="openAnalytics()"><div class="module-icon">▥</div><h3>Аналитика задач</h3><p>Выполнение, нагрузка, проекты и приоритеты</p></article>');
      grid.insertAdjacentHTML('beforeend','<article class="card module-card" onclick="showDiagnostics()"><div class="module-icon">✓</div><h3>Диагностика</h3><p>Проверка форм, ссылок и основных функций</p></article>');
    }
  };

  window.addEventListener('error',event=>{console.error('UI error',event.error||event.message)});
  window.addEventListener('unhandledrejection',event=>{console.error('UI rejection',event.reason)});
  render();
})();
