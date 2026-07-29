(function(){
  window.openFromNativeV40=function(target='today',group=''){
    if(target==='analytics'){
      setPage('analytics');
      if(group&&group!=='all')setTimeout(()=>window.openAnalyticsDetailsV41?.('all',group),25);
      return;
    }
    setPage(target);
  };
  window.__shtabDiagnostics={...(window.__shtabDiagnostics||{}),uiVersion:()=> '4.1.0',analyticsCategoryCount:()=>document.querySelectorAll('#analytics .category-v41').length,analyticsSummaryCount:()=>document.querySelectorAll('#analytics .analytics-summary-button-v41').length};
})();
//# sourceURL=chunk32.js