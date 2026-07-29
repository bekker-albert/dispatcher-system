(function(){
  const todayKeyV41=dayKey(today),previousImportantV41=window.importantItemsV26;
  window.importantItemsV26=function(){
    const rows=previousImportantV41?previousImportantV41().slice():[],ids=new Set(rows.filter(row=>row.kind==='task').map(row=>row.id));
    tasksForDate(todayKeyV41).filter(item=>item.priority==='high'&&!taskDone(item,todayKeyV41)&&!ids.has(item.id)).forEach(item=>rows.push({kind:'task',id:item.id,title:item.title,meta:'Высокий приоритет',urgent:true,action:`openTaskViewV31('${item.id}','${todayKeyV41}')`}));
    return rows;
  };
  window.openFromNativeV40=function(target='today',group=''){
    if(target==='analytics'){
      setPage('analytics');
      if(group&&group!=='all')setTimeout(()=>window.openAnalyticsDetailsV41?.('all',group),25);
      return;
    }
    setPage(target);
  };
  window.__shtabDiagnostics={...(window.__shtabDiagnostics||{}),uiVersion:()=> '4.1.0',analyticsCategoryCount:()=>document.querySelectorAll('#analytics .category-v41').length,analyticsSummaryCount:()=>document.querySelectorAll('#analytics .analytics-summary-button-v41').length};
  render();
})();
//# sourceURL=chunk32.js