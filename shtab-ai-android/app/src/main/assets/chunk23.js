(function(){
  const preserved=window.__v28PreservedTaskDetails||{};
  let restored=false;
  state.tasks.forEach(task=>{
    const details=preserved[task.id];
    if(!details)return;
    task.tags=JSON.parse(JSON.stringify(details.tags||[]));
    task.subtasks=JSON.parse(JSON.stringify(details.subtasks||[]));
    restored=true;
  });
  if(restored)save();

  const previousSubmitEditorV28Preserve=submitEditor;
  submitEditor=function(form){
    if(editor.type==='task'&&editor.id){
      const id=editor.id;
      const original=state.tasks.find(item=>item.id===id);
      const tags=JSON.parse(JSON.stringify(original?.tags||[]));
      const subtasks=JSON.parse(JSON.stringify(original?.subtasks||[]));
      previousSubmitEditorV28Preserve(form);
      const dialog=document.querySelector('#editor-dialog');
      if(!dialog?.open){
        const updated=state.tasks.find(item=>item.id===id);
        if(updated){
          updated.tags=tags;
          updated.subtasks=subtasks;
          save();
          render();
        }
      }
      return;
    }
    previousSubmitEditorV28Preserve(form);
  };
  window.submitEditor=submitEditor;
  window.__shtabDiagnostics={
    ...(window.__shtabDiagnostics||{}),
    taskHiddenDetails:id=>{
      const task=state.tasks.find(item=>item.id===id);
      return task?JSON.parse(JSON.stringify({tags:task.tags||[],subtasks:task.subtasks||[]})):null;
    }
  };
  delete window.__v28PreservedTaskDetails;
})();
//# sourceURL=chunk23.js