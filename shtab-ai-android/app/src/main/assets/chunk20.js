(function(){
  const previousOpenEditorV26=openEditor;
  openEditor=function(type,id=null,extra=null){
    previousOpenEditorV26(type,id,extra);
    if(type==='expense'||type==='income')setTimeout(()=>{const form=document.querySelector('#editor-form');if(form?.elements.repeat)form.elements.repeat.onchange=refreshTransactionFormV26;refreshTransactionFormV26()},0);
  };
  window.openEditor=openEditor;
  try{Object.defineProperty(window,'state',{configurable:true,get:()=>state})}catch{}
  window.__shtabDiagnostics={...(window.__shtabDiagnostics||{}),financeMonth:()=>state.financeMonth,todayKey:()=>dayKey(today)};
  render();
})();
//# sourceURL=chunk20.js