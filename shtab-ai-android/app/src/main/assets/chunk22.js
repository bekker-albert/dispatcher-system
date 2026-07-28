(function(){
  window.__v28PreservedTaskDetails={};
  state.tasks.forEach(task=>{
    window.__v28PreservedTaskDetails[task.id]={
      tags:JSON.parse(JSON.stringify(task.tags||[])),
      subtasks:JSON.parse(JSON.stringify(task.subtasks||[]))
    };
  });
})();
//# sourceURL=chunk22.js