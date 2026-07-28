(function(){
  const readability=document.createElement('style');
  readability.id='v29-readability';
  readability.textContent=`
    .record-title-v29{font-size:14px!important;font-weight:810!important;line-height:1.32!important}
    .record-meta-v29 span{font-size:10px!important;min-height:23px!important}
    .record-description-v29{font-size:11px!important;line-height:1.42!important}
    .record-row-v29{padding:11px 0!important}
    .simple-row-v29 strong{font-size:13px!important}
    .today-section-head-v29 h3{font-size:15px!important}
  `;
  document.head.appendChild(readability);
  const previousRenderV29Final=render;
  render=function(){
    previousRenderV29Final();
    const footer=[...document.querySelectorAll('#more p')].find(node=>node.textContent.includes('Штаб AI'));
    if(footer)footer.textContent='Штаб AI · 2.9.0';
  };
  window.render=render;
  window.__shtabDiagnostics={...(window.__shtabDiagnostics||{}),uiVersion:()=> '2.9.0'};
  render();
})();
//# sourceURL=chunk24.js
