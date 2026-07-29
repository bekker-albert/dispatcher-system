(function(){
  const TYPES_V45=['task','note','project','habit','workout','goal'];
  window.openQuickCreateTypeV45=function(type){
    const normalized=String(type||'');
    if(!TYPES_V45.includes(normalized)){toast('Неизвестный тип записи');return}
    closeDialog('quick-dialog');
    openEditor(normalized);
  };
  function wireQuickCreateV45(){
    document.querySelectorAll('#quick-dialog [data-create]').forEach(button=>{
      button.type='button';
      button.onclick=event=>{event?.preventDefault?.();window.openQuickCreateTypeV45(button.dataset.create)};
    });
  }
  wireQuickCreateV45();
  const previousRenderV45Routes=render;
  render=function(){previousRenderV45Routes();wireQuickCreateV45()};
  window.render=render;
  window.__shtabDiagnostics={...(window.__shtabDiagnostics||{}),quickCreateTypesV45:()=>TYPES_V45.slice()};
  render();
})();
//# sourceURL=chunk38.js
