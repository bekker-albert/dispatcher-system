(function(){
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
