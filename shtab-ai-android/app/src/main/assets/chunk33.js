(function(){
  const TODAY_V42=dayKey(today);
  const allowedUpcomingDaysV42=[0,1,3,7,14,30];
  let upcomingDaysV42=Number(state.settings?.upcomingEventDays);
  if(!allowedUpcomingDaysV42.includes(upcomingDaysV42)){
    upcomingDaysV42=7;
    state.settings.upcomingEventDays=7;
    localStorage.setItem(STORAGE,JSON.stringify(state));
  }

  const style=document.createElement('style');
  style.id='v42-styles';
  style.textContent=`
    #today .today-icon-grid{display:none!important}
    .upcoming-events-v42{margin-top:1px!important;border-color:rgba(98,226,178,.28)!important;background:linear-gradient(145deg,rgba(29,45,46,.96),rgba(20,24,33,.98))!important}
    .upcoming-events-v42 .simple-window-head-v30{background:rgba(98,226,178,.045)}
    .upcoming-events-v42 .simple-window-head-v30 h3{display:flex;align-items:center;gap:7px}.upcoming-events-v42 .simple-window-head-v30 h3:before{content:'◉';width:25px;height:25px;border-radius:9px;display:grid;place-items:center;background:rgba(98,226,178,.12);color:#62e2b2;font-size:12px}
    .upcoming-caption-v42{display:flex;align-items:center;gap:6px}.upcoming-caption-v42 span{font-size:9px;color:#8fe8c7;background:rgba(98,226,178,.09);border:1px solid rgba(98,226,178,.2);border-radius:8px;padding:5px 7px}
    .upcoming-row-v42{display:grid;grid-template-columns:38px minmax(0,1fr) auto;gap:9px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer}.upcoming-row-v42:last-child{border-bottom:0}
    .upcoming-date-v42{width:38px;height:38px;border-radius:12px;background:rgba(98,226,178,.1);display:grid;place-items:center;text-align:center;color:#62e2b2}.upcoming-date-v42 b{font-size:14px;line-height:1}.upcoming-date-v42 small{font-size:8px;text-transform:uppercase;margin-top:2px}
    .upcoming-main-v42{min-width:0}.upcoming-main-v42 strong{display:block;font-size:12px;line-height:1.3;white-space:normal;overflow-wrap:anywhere}.upcoming-main-v42 small{display:block;color:var(--muted);font-size:9px;margin-top:4px}.upcoming-row-v42>span{font-size:15px;color:var(--muted)}
    .more-overview-v42{padding:14px;margin:2px 0 12px}.more-overview-head-v42{display:flex;align-items:center;gap:11px}.more-overview-mark-v42{width:44px;height:44px;border-radius:15px;display:grid;place-items:center;background:linear-gradient(145deg,#4a3a8f,#26204c);color:#fff;font-weight:900}.more-overview-head-v42 strong{display:block;font-size:15px}.more-overview-head-v42 small{display:block;color:var(--muted);font-size:10px;margin-top:3px}.more-overview-stats-v42{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:12px}.more-overview-stats-v42 div{background:var(--surface-2);border-radius:11px;padding:8px;text-align:center}.more-overview-stats-v42 b{display:block;font-size:16px}.more-overview-stats-v42 small{display:block;color:var(--muted);font-size:8px;margin-top:3px}
    .more-group-v42{border:1px solid var(--border);border-radius:17px;background:var(--surface);overflow:hidden;margin:10px 0 14px}.more-group-title-v42{padding:9px 12px;border-bottom:1px solid var(--border);font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
    .more-row-v42{width:100%;display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:10px;align-items:center;border:0;border-bottom:1px solid var(--border);background:transparent;color:var(--text);padding:11px 12px;text-align:left}.more-row-v42:last-child{border-bottom:0}.more-row-icon-v42{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:var(--surface-2);color:var(--primary);font-size:14px}.more-row-main-v42{min-width:0}.more-row-main-v42 strong{display:block;font-size:13px}.more-row-main-v42 small{display:block;color:var(--muted);font-size:9px;line-height:1.3;margin-top:3px}.more-row-v42>span:last-child{color:var(--muted);font-size:16px}.more-row-count-v42{display:inline-flex!important;align-items:center;gap:7px!important}.more-row-count-v42 b{font-size:10px;color:var(--muted);font-weight:800}
    .settings-select-v42{min-width:125px;border:1px solid var(--border);background:var(--surface-2);color:var(--text);border-radius:11px;padding:9px 10px;font-size:11px}
    .setting-card-v42 h3{margin-bottom:5px}.setting-card-v42>p{margin-top:0}
    @media(max-width:360px){.more-overview-stats-v42{gap:5px}.upcoming-row-v42{grid-template-columns:35px minmax(0,1fr) auto}.upcoming-date-v42{width:35px;height:35px}}
  `;
  document.head.appendChild(style);

  function upcomingRangeLabelV42(days){return days===0?'Сегодня':days===1?'1 день':`${days} дней`}
  function upcomingEventsV42(){
    const days=Number(state.settings.upcomingEventDays??7),now=new Date(),end=new Date(addDays(today,days));end.setHours(23,59,59,999);const rows=[],seen=new Set();
    state.tasks.filter(item=>item.kind==='event'&&item.status!=='archived').forEach(item=>{
      for(let offset=0;offset<=days;offset++){
        const key=dayKey(addDays(today,offset));if(!taskOccursOn(item,key)||taskDone(item,key))continue;
        const when=dateTime(key,item.startTime||item.time||'23:59');if(when<now||when>end)continue;
        const token=`${item.id}:${key}`;if(seen.has(token))continue;seen.add(token);rows.push({item,key,when});
      }
    });
    return rows.sort((a,b)=>a.when-b.when);
  }
  function upcomingRowV42(row){const date=row.when,day=date.getDate(),month=dateFmt(date,{month:'short'}).replace('.',''),time=row.item.startTime||row.item.time||'Весь день';return `<div class="upcoming-row-v42" data-upcoming-event-id="${row.item.id}" onclick="openTaskViewV31('${row.item.id}','${row.key}')"><div class="upcoming-date-v42"><b>${day}</b><small>${esc(month)}</small></div><div class="upcoming-main-v42"><strong>${esc(row.item.title)}</strong><small>${dateFmt(date,{weekday:'long',day:'numeric',month:'long'})} · ${esc(time)}</small></div><span>›</span></div>`}
  function upcomingSectionV42(){const days=Number(state.settings.upcomingEventDays??7),rows=upcomingEventsV42();return `<section class="simple-window-v30 upcoming-events-v42"><div class="simple-window-head-v30"><h3>Приближающиеся события</h3><div class="upcoming-caption-v42"><span>${upcomingRangeLabelV42(days)}</span><small>${rows.length}</small></div></div><div class="simple-window-list-v30">${rows.length?rows.map(upcomingRowV42).join(''):'<div class="simple-empty-v30">На выбранный срок событий нет.</div>'}</div></section>`}
  function enhanceTodayV42(){const root=document.querySelector('#today');if(!root)return;root.querySelectorAll('.today-icon-grid,.upcoming-events-v42').forEach(node=>node.remove());root.insertAdjacentHTML('afterbegin',upcomingSectionV42())}

  function moreRowV42(icon,title,subtitle,action,count=''){return `<button type="button" class="more-row-v42" onclick="${action}"><span class="more-row-icon-v42">${icon}</span><span class="more-row-main-v42"><strong>${esc(title)}</strong><small>${esc(subtitle)}</small></span><span class="more-row-count-v42">${count!==''?`<b>${count}</b>`:''}›</span></button>`}
  function moreGroupV42(title,rows){return `<section class="more-group-v42"><div class="more-group-title-v42">${esc(title)}</div>${rows.join('')}</section>`}
  function renderMoreHomeV42(){
    const openTasks=state.tasks.filter(item=>item.status!=='archived'&&item.status!=='completed').length,projects=state.projects.filter(item=>item.status!=='archived').length,notes=state.notes.length,habits=state.habits.filter(item=>item.active).length,workouts=state.workouts.length,goals=state.goals.filter(item=>item.status!=='archived').length;
    document.querySelector('#more').innerHTML=`<article class="card more-overview-v42"><div class="more-overview-head-v42"><div class="more-overview-mark-v42">АБ</div><div><strong>Альберт Беккер</strong><small>Личная система планирования</small></div></div><div class="more-overview-stats-v42"><div><b>${openTasks}</b><small>открыто</small></div><div><b>${projects}</b><small>проектов</small></div><div><b>${notes}</b><small>заметок</small></div></div></article>${moreGroupV42('Организация',[moreRowV42('▰','Проекты','Рабочие и личные направления',"openMore('projects')",projects),moreRowV42('✎','Заметки','Идеи, информация и быстрые записи',"openMore('notes')",notes)])}${moreGroupV42('Личное развитие',[moreRowV42('⚡','Спорт и привычки','Регулярность, тренировки и серии',"openMore('sport')",habits+workouts),moreRowV42('◎','Цели','Измеримые результаты и прогресс',"openMore('goals')",goals)])}${moreGroupV42('Приложение',[moreRowV42('⚙','Настройки','События, уведомления, голос и поведение',"openMore('settings')"),moreRowV42('⇄','Данные','Резервная копия и обслуживание',"openMore('data')")])}<p class="muted" style="text-align:center;margin-top:22px">Штаб AI · 4.2.0</p>`;
  }

  function renderSettingsV42(){const s=state.settings,days=Number(s.upcomingEventDays??7);document.querySelector('#more').innerHTML=`${subnav('Настройки','События, уведомления и поведение')}
    <article class="card setting-card setting-card-v42"><h3>Вкладка «Сегодня»</h3><p>Настройте, за сколько дней событие появится в окне приближающихся событий.</p><div class="setting-row"><div><strong>Показывать события заранее</strong><small>Учитывается дата и время начала события</small></div><select class="settings-select-v42" onchange="setUpcomingEventDaysV42(this.value)">${[[0,'В день события'],[1,'За 1 день'],[3,'За 3 дня'],[7,'За 7 дней'],[14,'За 14 дней'],[30,'За 30 дней']].map(([value,label])=>`<option value="${value}" ${days===value?'selected':''}>${label}</option>`).join('')}</select></div></article>
    <article class="card setting-card setting-card-v42"><h3>Уведомления</h3><p>Напоминания о задачах, событиях, командировках, спорте и привычках.</p>${settingSwitch('Уведомления включены','Разрешение Android и локальные сигналы','notifications',s.notifications)}${settingSwitch('Утренний план',`Ежедневно в ${s.morningTime}`,'morningSummary',s.morningSummary)}${settingSwitch('Вечерний обзор',`Ежедневно в ${s.eveningTime}`,'eveningReview',s.eveningReview)}${settingSwitch('Повтор после срока','Дополнительный сигнал, пока запись не закрыта','overdueReminder',s.overdueReminder)}${settingSwitch('Тихие часы',`${s.quietStart}–${s.quietEnd}`,'quietHours',s.quietHours)}<button type="button" class="secondary" style="width:100%;margin-top:12px" onclick="requestNotifications()">Открыть разрешения уведомлений</button></article>
    <article class="card setting-card setting-card-v42"><h3>Расписание и голос</h3><div class="setting-row"><div><strong>Утренний план</strong><small>Время ежедневного обзора</small></div><input type="time" value="${s.morningTime}" onchange="setSetting('morningTime',this.value)"></div><div class="setting-row"><div><strong>Вечерний обзор</strong><small>Время подведения итогов</small></div><input type="time" value="${s.eveningTime}" onchange="setSetting('eveningTime',this.value)"></div><div class="setting-row"><div><strong>Начало тихих часов</strong></div><input type="time" value="${s.quietStart}" onchange="setSetting('quietStart',this.value)"></div><div class="setting-row"><div><strong>Конец тихих часов</strong></div><input type="time" value="${s.quietEnd}" onchange="setSetting('quietEnd',this.value)"></div>${settingSwitch('Озвучивать ответы','Помощник отвечает голосом','speakResponses',s.speakResponses)}</article>
    <article class="card setting-card setting-card-v42"><h3>Новые записи</h3><p>Напоминания и поведение по умолчанию.</p>${reminderGrid(s.defaultReminderOffsets)}<button type="button" class="primary" style="width:100%;margin-top:12px" onclick="saveDefaultReminders()">Сохранить напоминания</button>${settingSwitch('Подтверждать удаление','Защита от случайного удаления','confirmDelete',s.confirmDelete)}${settingSwitch('Скрывать выполненное','В рабочих списках','hideCompleted',s.hideCompleted)}</article>`}

  function renderDataV42(){const tasks=state.tasks.length,projects=state.projects.length,habits=state.habits.length,workouts=state.workouts.length,goals=state.goals.length,notes=state.notes.length;document.querySelector('#more').innerHTML=`${subnav('Данные','Локальное хранение')}<article class="card setting-card"><h3>Резервная копия</h3><p>Сохраняет задачи, события, командировки, проекты, спорт, цели, заметки и настройки.</p><div class="inline-actions"><button type="button" class="primary" onclick="openBackup('export')">Создать копию</button><button type="button" class="secondary" onclick="openBackup('import')">Восстановить</button></div></article><article class="card setting-card"><h3>Обслуживание</h3><div class="setting-row"><div><strong>Удалить выполненные задачи</strong><small>Повторяющиеся записи сохранятся</small></div><button type="button" class="mini-btn" onclick="clearCompleted()">Очистить</button></div><div class="setting-row"><div><strong>Полный сброс</strong><small>Удалит все локальные данные приложения</small></div><button type="button" class="mini-btn danger-btn" onclick="resetData()">Сбросить</button></div></article><article class="card setting-card"><h3>Содержимое</h3><p>Проектов: ${projects} · записей: ${tasks} · привычек: ${habits} · тренировок: ${workouts} · целей: ${goals} · заметок: ${notes}</p></article>`}

  window.setUpcomingEventDaysV42=function(value){const days=Number(value);state.settings.upcomingEventDays=allowedUpcomingDaysV42.includes(days)?days:7;save();render()};
  window.openQuickCreateV42=function(type='task'){
    if(type==='note'){openEditor('note');return}
    const kind=['trip','event'].includes(type)?type:'task';openEditor('task',null,{kind});const select=document.querySelector('#editor-fields [name="kind"]');if(select)select.value=kind;const title=document.querySelector('#editor-title');if(title)title.textContent={task:'Задача',trip:'Командировка',event:'Событие'}[kind];
  };
  const previousNativeV42=window.openFromNativeV40;
  window.openFromNativeV40=function(target='today',focus=''){if(target==='quick_create'){window.openQuickCreateV42(focus);return}if(previousNativeV42)return previousNativeV42(target,focus);setPage(target)};

  renderMoreHome=renderMoreHomeV42;window.renderMoreHome=renderMoreHomeV42;
  renderSettings=renderSettingsV42;window.renderSettings=renderSettingsV42;
  renderData=renderDataV42;window.renderData=renderDataV42;

  const previousRenderV42=render;
  render=function(){previousRenderV42();if(page==='today')enhanceTodayV42();if(page==='more'){if(state.moreView==='home')renderMoreHomeV42();else if(state.moreView==='settings')renderSettingsV42();else if(state.moreView==='data')renderDataV42()}const footer=[...document.querySelectorAll('#more p')].find(node=>node.textContent.includes('Штаб AI'));if(footer)footer.textContent='Штаб AI · 4.2.0';document.querySelectorAll('button:not([type])').forEach(button=>button.type='button')};window.render=render;
  window.__shtabDiagnostics={...(window.__shtabDiagnostics||{}),uiVersion:()=> '4.2.0',todayIconCount:()=>document.querySelectorAll('#today .today-icon-grid').length,upcomingWindowCount:()=>document.querySelectorAll('#today .upcoming-events-v42').length,upcomingEventDays:()=>Number(state.settings.upcomingEventDays),upcomingEventCount:()=>document.querySelectorAll('#today .upcoming-row-v42').length,moreFinanceVisible:()=>/финанс|бюджет|доход|расход/i.test(document.querySelector('#more')?.textContent||''),moreGroupCount:()=>document.querySelectorAll('#more .more-group-v42').length};
  render();
})();
//# sourceURL=chunk33.js
