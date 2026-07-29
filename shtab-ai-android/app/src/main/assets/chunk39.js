(function(){
  const ADD_ID='central-add-v452';
  let enforcing=false;

  function openQuickV452(){
    const dialog=document.querySelector('#quick-dialog');
    if(!dialog)return;
    try{dialog.showModal()}catch{dialog.setAttribute('open','')}
  }

  function enforceCentralAddV452(){
    if(enforcing)return;
    enforcing=true;
    try{
      const nav=document.querySelector('.bottom-nav');
      const add=document.getElementById(ADD_ID);
      const legacy=document.querySelector('#fab.legacy-fab-v452');
      if(legacy){
        legacy.setAttribute('aria-hidden','true');
        legacy.tabIndex=-1;
      }
      if(!nav||!add)return;
      const analytics=nav.querySelector('[data-page="analytics"]');
      if(add.parentElement!==nav)nav.insertBefore(add,analytics||null);
      else if(analytics&&add.nextElementSibling!==analytics)nav.insertBefore(add,analytics);
      add.type='button';
      add.onclick=event=>{event.preventDefault();event.stopPropagation();openQuickV452()};
      add.style.setProperty('display','flex','important');
      add.style.setProperty('visibility','visible','important');
      add.style.setProperty('opacity','1','important');
      nav.style.setProperty('grid-template-columns','repeat(5,minmax(0,1fr))','important');
    }finally{enforcing=false}
  }

  window.openQuickV452=openQuickV452;
  window.enforceCentralAddV452=enforceCentralAddV452;

  const previousRenderV452=render;
  render=function(){previousRenderV452();enforceCentralAddV452()};
  window.render=render;

  const observer=new MutationObserver(()=>enforceCentralAddV452());
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
  enforceCentralAddV452();
  render();
})();
//# sourceURL=chunk39.js
