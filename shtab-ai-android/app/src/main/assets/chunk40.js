(function(){
  const WEEKDAYS_V46=[
    [1,'Каждый понедельник'],[2,'Каждый вторник'],[3,'Каждую среду'],[4,'Каждый четверг'],[5,'Каждую пятницу'],[6,'Каждую субботу'],[0,'Каждое воскресенье']
  ];
  const style=document.createElement('style');
  style.id='v46-reminder-schedule-styles';
  style.textContent=`
    .recurrence-weekday-v46,.habit-weekday-v46,.habit-custom-days-v46{margin-top:10px}
    .recurrence-weekday-v46[hidden],.habit-weekday-v46[hidden],.habit-custom-days-v46[hidden]{display:none!important}
    .recurrence-note-v46{display:block;margin:7px 2px 0;color:var(--muted);font-size:9px;line-height:1.4}
  `;
  document.head.appendChild(style);

  const dateAtNoonV46=value=>new Date(`${value}T12:00:00`);
  const weekdayFromDateV46=value=>value?dateAtNoonV46(value).getDay():new Date().getDay();
  const weekdayOptionsV46=selected=>WEEKDAYS_V46.map(([value,label])=>`<option value="${value}" ${Number(selected)===value?'selected':''}>${label}</option>`).join('');
  const repeatOptionsV46=value=>{
    const selected=value==='weekly'?'weekday':value;
    return [
      ['none','Не повторять'],
      ['daily','Каждый день'],
      ['weekday','День недели'],
      ['weekdays','Будние дни'],
      ['weekends','Выходные дни'],
      ['monthly','Каждый месяц'],
      ['yearly','Каждый год']
    ].map(([key,label])=>`<option value="${key}" ${selected===key?'selected':''}>${label}</option>`).join('');
  };

  const previousTaskOccursOnV46=taskOccursOn;
  taskOccursOn=function(item,key){
    if(item.status==='archived')return false;
    if(item.recurrenceEnd&&key>item.recurrenceEnd)return false;
    const startKey=item.date||key,start=dateAtNoonV46(startKey),date=dateAtNoonV46(key);
    if(date<start)return false;
    const recurrence=item.recurrence||{type:'none',interval:1},type=recurrence.type||'none',diff=Math.round((date-start)/86400000),day=date.getDay(),interval=Math.max(1,Number(recurrence.interval||1));
    if(type==='none')return startKey===key;
    if(type==='daily')return diff%interval===0;
    if(type==='weekdays')return day>=1&&day<=5;
    if(type==='weekends')return day===0||day===6;
    if(type==='weekday')return day===Number(recurrence.weekday??start.getDay())&&Math.floor(diff/7)%interval===0;
    if(type==='weekly')return day===start.getDay()&&Math.floor(diff/7)%interval===0;
    if(type==='monthly')return date.getDate()===start.getDate();
    if(type==='yearly')return date.getDate()===start.getDate()&&date.getMonth()===start.getMonth();
    return previousTaskOccursOnV46(item,key);
  };
  window.taskOccursOn=taskOccursOn;

  const previousHabitDueV46=habitDue;
  habitDue=function(item,key){
    if(!item.active)return false;
    const day=dateAtNoonV46(key).getDay(),frequency=item.frequency||'daily';
    if(frequency==='daily')return true;
    if(frequency==='weekdays')return day>=1&&day<=5;
    if(frequency==='weekends')return day===0||day===6;
    if(frequency==='weekday'||frequency==='weekly'||frequency==='custom')return (item.days||[]).map(Number).includes(day);
    return previousHabitDueV46(item,key);
  };
  window.habitDue=habitDue;

  const previousEditorFieldsV46=editorFields;
  editorFields=function(type,item={},extra={}){
    const html=previousEditorFieldsV46(type,item||{},extra||{});
    if(type!=='task'&&type!=='habit')return html;
    const template=document.createElement('template');template.innerHTML=html;
    if(type==='task'){
      const repeat=template.content.querySelector('[name="repeat"]');
      if(repeat){
        const current=item.recurrence?.type||'none',selected=current==='weekly'?'weekday':current,defaultDay=Number(item.recurrence?.weekday??weekdayFromDateV46(item.date||extra?.date||state.selectedDate||dayKey(today)));
        repeat.innerHTML=repeatOptionsV46(selected);
        const label=repeat.closest('.field');if(label?.querySelector('span'))label.querySelector('span').textContent='Повтор записи и напоминания';
        const row=repeat.closest('.field-row')||label;
        row?.insertAdjacentHTML('afterend',`<label class="field recurrence-weekday-v46" ${selected==='weekday'?'':'hidden'}><span>День недели</span><select name="repeatWeekday">${weekdayOptionsV46(defaultDay)}</select><small class="recurrence-note-v46">Запись и уведомление будут повторяться в выбранный день.</small></label>`);
      }
    }
    if(type==='habit'){
      const frequency=template.content.querySelector('[name="frequency"]'),daysField=template.content.querySelector('[name="days"]')?.closest('.field');
      if(frequency){
        const current=item.frequency||'daily',selected=current==='weekly'?'weekday':current,defaultDay=Number((item.days||[])[0]??weekdayFromDateV46(dayKey(today)));
        frequency.innerHTML=[['daily','Каждый день'],['weekday','День недели'],['weekdays','Будние дни'],['weekends','Выходные дни'],['custom','Выбранные дни']].map(([key,label])=>`<option value="${key}" ${selected===key?'selected':''}>${label}</option>`).join('');
        if(frequency.closest('.field')?.querySelector('span'))frequency.closest('.field').querySelector('span').textContent='Расписание привычки и напоминаний';
        frequency.closest('.field')?.insertAdjacentHTML('afterend',`<label class="field habit-weekday-v46" ${selected==='weekday'?'':'hidden'}><span>День недели</span><select name="habitWeekday">${weekdayOptionsV46(defaultDay)}</select></label>`);
      }
      if(daysField){daysField.classList.add('habit-custom-days-v46');daysField.hidden=(item.frequency||'daily')!=='custom';const span=daysField.querySelector('span');if(span)span.textContent='Выбранные дни недели числами 1–7'}
    }
    return template.innerHTML;
  };
  window.editorFields=editorFields;

  function refreshRecurrenceFieldsV46(){
    const form=document.querySelector('#editor-form');if(!form)return;
    if(editor.type==='task'){
      const type=form.elements.repeat?.value||'none',weekday=document.querySelector('.recurrence-weekday-v46');if(weekday)weekday.hidden=type!=='weekday';
      if(form.elements.repeat)form.elements.repeat.onchange=refreshRecurrenceFieldsV46;
    }
    if(editor.type==='habit'){
      const type=form.elements.frequency?.value||'daily',weekday=document.querySelector('.habit-weekday-v46'),custom=document.querySelector('.habit-custom-days-v46');if(weekday)weekday.hidden=type!=='weekday';if(custom)custom.hidden=type!=='custom';
      if(form.elements.frequency)form.elements.frequency.onchange=refreshRecurrenceFieldsV46;
    }
  }
  window.refreshRecurrenceFieldsV46=refreshRecurrenceFieldsV46;

  const previousOpenEditorV46=openEditor;
  openEditor=function(type,id=null,extra=null){previousOpenEditorV46(type,id,extra);setTimeout(refreshRecurrenceFieldsV46,0)};
  window.openEditor=openEditor;

  const toMinutesV46=value=>{const match=String(value||'00:00').match(/^(\d{1,2}):(\d{2})$/);return match?Number(match[1])*60+Number(match[2]):0};
  const dateTimeV46=(date,time)=>new Date(`${date}T${time||'00:00'}:00`);
  const previousSubmitEditorV46=submitEditor;
  submitEditor=function(form){
    const fd=new FormData(form),get=key=>String(fd.get(key)||'').trim(),num=key=>Number(fd.get(key)||0);
    if(editor.type==='task'){
      const title=get('title'),start=get('date'),end=get('endDate')||start,startTime=get('startTime')||'09:00',endTime=get('endTime')||startTime;
      if(!title){showEditorError('Введите название.');return}
      if(!start||!end){showEditorError('Укажите начало и окончание периода.');return}
      if(dateTimeV46(end,endTime)<dateTimeV46(start,startTime)){showEditorError('Окончание не может быть раньше начала.');return}
      const recurrenceEnd=get('recurrenceEnd');if(recurrenceEnd&&recurrenceEnd<start){showEditorError('Окончание повторов не может быть раньше начала.');return}
      const recurrenceType=get('repeat')||'none',weekday=recurrenceType==='weekday'?Number(get('repeatWeekday')):undefined,reminderEnabled=Boolean(form.elements.reminderEnabled?.checked),reminderOffset=Number(form.elements.reminderHours?.value||0)*60+Number(form.elements.reminderMinutes?.value||0),existing=editor.id?state.tasks.find(item=>item.id===editor.id):null,dailyDuration=Math.max(0,toMinutesV46(endTime)-toMinutesV46(startTime));
      const recurrence={type:recurrenceType,interval:1};if(recurrenceType==='weekday')recurrence.weekday=Number.isInteger(weekday)?weekday:weekdayFromDateV46(start);
      const data={kind:get('kind')||'task',title,description:get('description'),date:start,endDate:end,startTime,endTime,time:startTime,duration:dailyDuration,project:get('project'),priority:get('priority')||'normal',tags:existing?.tags||[],subtasks:existing?.subtasks||[],recurrence,recurrenceEnd,reminders:reminderEnabled?[reminderOffset]:[],repeatUntilDone:reminderEnabled&&Boolean(form.elements.repeatUntilDone?.checked)};
      if(existing)Object.assign(existing,data);else state.tasks.push({...data,id:uid('task'),status:'active',completedDates:[],createdAt:Date.now()});
      save();closeDialog('editor-dialog');toast('Сохранено');render();return;
    }
    if(editor.type==='habit'){
      const name=get('name');if(!name){showEditorError('Заполните обязательное поле.');return}
      const frequency=get('frequency')||'daily',customDays=get('days').split(',').map(value=>Number(value.trim())).filter(value=>value>=1&&value<=7).map(value=>value===7?0:value),weekday=Number(get('habitWeekday')),days=frequency==='daily'?[1,2,3,4,5,6,0]:frequency==='weekdays'?[1,2,3,4,5]:frequency==='weekends'?[6,0]:frequency==='weekday'?[Number.isInteger(weekday)?weekday:weekdayFromDateV46(dayKey(today))]:(customDays.length?customDays:[1,2,3,4,5,6,0]),times=get('reminderTimes').split(',').map(value=>value.trim()).filter(value=>/^\d{1,2}:\d{2}$/.test(value)),existing=editor.id?state.habits.find(item=>item.id===editor.id):null;
      const data={name,description:get('description'),area:get('area'),frequency,days,reminderTimes:times,target:num('target')||1,unit:get('unit')||'раз',active:true,logs:existing?.logs||{},createdAt:existing?.createdAt||Date.now()};
      if(existing)Object.assign(existing,data);else state.habits.push({...data,id:uid('habit')});
      save();closeDialog('editor-dialog');toast('Сохранено');render();return;
    }
    previousSubmitEditorV46(form);
  };
  window.submitEditor=submitEditor;

  const previousRenderV46=render;
  render=function(){previousRenderV46();const footer=[...document.querySelectorAll('#more p')].find(node=>node.textContent.includes('Штаб AI'));if(footer)footer.textContent='Штаб AI · 4.6.0'};
  window.render=render;
  window.__shtabDiagnostics={...(window.__shtabDiagnostics||{}),uiVersion:()=> '4.6.0',repeatOptionsV46:()=>['daily','weekday','weekdays','weekends'],taskOccursOnV46:(item,key)=>taskOccursOn(item,key),habitDueV46:(item,key)=>habitDue(item,key)};
  render();
})();
//# sourceURL=chunk40.js
