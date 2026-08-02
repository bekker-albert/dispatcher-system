(function(){
  const NativeObserver=window.__shtabNativeObserverV470||window.MutationObserver;
  (window.__shtabTrackedObserversV470||[]).forEach(observer=>observer.disconnect());
  window.MutationObserver=NativeObserver;

  let enhanceQueued=false;
  function queueSafeEnhanceV470(){
    if(enhanceQueued)return;
    enhanceQueued=true;
    requestAnimationFrame(()=>{
      enhanceQueued=false;
      window.refreshTaskControlsV470?.();
    });
  }
  new NativeObserver(mutations=>{
    const elementAdded=mutations.some(mutation=>[...mutation.addedNodes].some(node=>node.nodeType===1));
    if(elementAdded)queueSafeEnhanceV470();
  }).observe(document.documentElement,{childList:true,subtree:true});

  const previousSyncV470=window.syncAllNotifications;
  const safeSyncV470=function(){
    const result=previousSyncV470?.();
    try{localStorage.setItem(STORAGE,JSON.stringify(state))}catch{}
    return result;
  };
  try{syncAllNotifications=safeSyncV470}catch{}
  window.syncAllNotifications=safeSyncV470;

  Object.defineProperty(window,'__shtabStateV470',{configurable:true,get:()=>state});
  window.__shtabDiagnostics={...(window.__shtabDiagnostics||{}),uiVersion:()=> '4.7.0',safeObserverV470:()=>true};
  queueSafeEnhanceV470();
})();
//# sourceURL=chunk45.js
