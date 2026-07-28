(function(){
  window.__shtabDiagnostics={
    taskByTitle:title=>{const task=state.tasks.find(x=>x.title===title);return task?JSON.parse(JSON.stringify(task)):null},
    taskIdsForDate:key=>tasksForDate(key).map(x=>x.id),
    budgetForMonth:month=>{const budget=state.budgets.find(x=>x.month===month);return budget?JSON.parse(JSON.stringify(budget)):null}
  };
})();
//# sourceURL=chunk15.js
