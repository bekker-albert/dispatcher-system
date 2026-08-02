(function(){
  const NativeObserver=window.MutationObserver;
  const tracked=[];
  window.__shtabNativeObserverV470=NativeObserver;
  window.__shtabTrackedObserversV470=tracked;
  window.MutationObserver=class ShtabTrackedObserverV470 extends NativeObserver{
    constructor(callback){super(callback);tracked.push(this)}
  };
})();
//# sourceURL=chunk44pre.js
