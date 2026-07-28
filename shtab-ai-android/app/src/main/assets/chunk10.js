const _editorTitleV2=editorTitle;
editorTitle=function(type,id){if(type==='area')return 'Сфера жизни';return _editorTitleV2(type,id)};
const _getEntityV2=getEntity;
getEntity=function(type,id){if(type==='area')return id?state.areas.find(x=>x.id===id)||null:null;return _getEntityV2(type,id)};
const _editorFieldsV2=editorFields;
editorFields=function(type,x={},extra={}){
  if(type==='area')return `${f('name','Название сферы',x.name||'','text','required')}${f('icon','Значок',x.icon||'●','text','maxlength="3"')}${f('color','Цвет',x.color||'#7d65ff','color')}`;
  let html=_editorFieldsV2(type,x,extra);
  if(type==='task')html+=ta('subtasks','Подзадачи — по одной в строке',(x.subtasks||[]).map(s=>typeof s==='string'?s:s.title).join('\n'),4);
  return html;
};
const _submitEditorV2=submitEditor;
submitEditor=function(form){
  if(editor.type==='area'){
    const fd=new FormData(form),name=String(fd.get('name')||'').trim();if(!name){showEditorError('Введите название сферы.');return}
    const data={name,icon:String(fd.get('icon')||'●').trim()||'●',color:String(fd.get('color')||'#7d65ff')};
    const obj=editor.id?state.areas.find(x=>x.id===editor.id):null;if(obj)Object.assign(obj,data);else state.areas.push({...data,id:uid('area')});
    save();closeDialog('editor-dialog');toast('Сфера сохранена');render();return;
  }
  const subtaskLines=editor.type==='task'?String(new FormData(form).get('subtasks')||'').split('\n').map(x=>x.trim()).filter(Boolean):[];
  const taskId=editor.type==='task'?editor.id:null;_submitEditorV2(form);
  if(editor.type==='task'){
    const task=taskId?state.tasks.find(x=>x.id===taskId):state.tasks.slice().sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))[0];
    if(task){task.subtasks=subtaskLines.map((title,i)=>({id:task.subtasks?.[i]?.id||uid('sub'),title,done:task.subtasks?.[i]?.done||false}));save();render()}
  }
};
const _deleteEntityV2=deleteEntity;
deleteEntity=function(type,id){
  if(type!=='project'&&type!=='area')return _deleteEntityV2(type,id);
  if(state.settings.confirmDelete&&!confirm('Удалить запись?'))return;
  if(type==='project'){
    const count=state.tasks.filter(t=>t.project===id).length;
    if(count&&!confirm(`В проекте ${count} задач. Удалить проект и оставить задачи без проекта?`))return;
    state.tasks.forEach(t=>{if(t.project===id)t.project=''});state.projects=state.projects.filter(x=>x.id!==id);
  }else{
    if(state.areas.length<=1){toast('Нельзя удалить единственную сферу');return}
    const fallback=state.areas.find(a=>a.id!==id)?.id||'';state.projects.forEach(p=>{if(p.area===id)p.area=fallback});state.habits.forEach(h=>{if(h.area===id)h.area=fallback});state.goals.forEach(g=>{if(g.area===id)g.area=fallback});state.areas=state.areas.filter(x=>x.id!==id);
  }
  save();render();
};
window.deleteEntity=deleteEntity;
const _renderProjectsV2=renderProjects;
renderProjects=function(){
  _renderProjectsV2();const root=document.querySelector('#more'),chips=root.querySelector('.chips');
  if(chips&&!chips.querySelector('[data-add-area]'))chips.insertAdjacentHTML('beforeend','<button data-add-area class="chip" onclick="openEditor(\'area\')">＋ Сфера</button>');
  root.insertAdjacentHTML('beforeend',`<div class="section-head"><h3>Сферы жизни</h3><span class="counter">${state.areas.length}</span></div>${state.areas.map(a=>`<article class="card project"><div class="project-head"><span class="project-bar" style="background:${a.color}"></span><div style="flex:1"><h3>${esc(a.icon)} ${esc(a.name)}</h3><p>Проектов: ${state.projects.filter(p=>p.area===a.id).length}</p></div><div class="inline-actions"><button class="mini-btn" onclick="openEditor('area','${a.id}')">Изм.</button><button class="mini-btn danger-btn" onclick="deleteEntity('area','${a.id}')">Удалить</button></div></div></article>`).join('')}`);
};
