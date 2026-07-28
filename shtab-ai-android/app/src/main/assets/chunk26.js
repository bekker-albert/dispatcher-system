(function(){
  const style=document.createElement('style');
  style.id='v30-directory-clean-styles';
  style.textContent=`
    .directory-row-v30{grid-template-columns:minmax(0,1fr) auto!important}
    .directory-mark-v30{display:none!important}
  `;
  document.head.appendChild(style);

  function normalizeDirectoryButtonsV30(){document.querySelectorAll('#more button:not([type])').forEach(button=>button.type='button')}
  function projectRowV30Clean(item){return `<div class="directory-row-v30"><button type="button" class="directory-name-v30" onclick="openProject('${item.id}')">${esc(item.name)}</button><div class="directory-actions-v30"><button type="button" aria-label="Изменить проект" title="Изменить" onclick="openEditor('project','${item.id}')">✎</button><button type="button" class="danger" aria-label="Удалить проект" title="Удалить" onclick="deleteEntity('project','${item.id}')">×</button></div></div>`}
  function areaRowV30Clean(item){return `<div class="directory-row-v30"><button type="button" class="directory-name-v30" onclick="openEditor('area','${item.id}')">${esc(item.name)}</button><div class="directory-actions-v30"><button type="button" aria-label="Изменить сферу" title="Изменить" onclick="openEditor('area','${item.id}')">✎</button><button type="button" class="danger" aria-label="Удалить сферу" title="Удалить" onclick="deleteEntity('area','${item.id}')">×</button></div></div>`}
  function renderProjectsV30Clean(){const projects=state.projects.slice().sort((a,b)=>a.name.localeCompare(b.name,'ru')),areas=state.areas.slice().sort((a,b)=>a.name.localeCompare(b.name,'ru'));document.querySelector('#more').innerHTML=`${subnav('Проекты','Проекты и сферы')}<section class="directory-window-v30"><div class="directory-head-v30"><h3>Проекты</h3><span>${projects.length}</span></div><div class="directory-list-v30">${projects.length?projects.map(projectRowV30Clean).join(''):'<div class="simple-empty-v30">Проектов пока нет.</div>'}</div><button type="button" class="directory-add-v30" onclick="openEditor('project')">＋ Проект</button></section><section class="directory-window-v30"><div class="directory-head-v30"><h3>Сферы</h3><span>${areas.length}</span></div><div class="directory-list-v30">${areas.length?areas.map(areaRowV30Clean).join(''):'<div class="simple-empty-v30">Сфер пока нет.</div>'}</div><button type="button" class="directory-add-v30" onclick="openEditor('area')">＋ Сфера</button></section>`;normalizeDirectoryButtonsV30()}
  renderProjects=renderProjectsV30Clean;window.renderProjects=renderProjectsV30Clean;

  const previousRenderV30Clean=render;
  render=function(){previousRenderV30Clean();if(page==='more'&&state.moreView==='projects')renderProjectsV30Clean();const footer=[...document.querySelectorAll('#more p')].find(node=>node.textContent.includes('Штаб AI'));if(footer)footer.textContent='Штаб AI · 3.0.0';document.querySelectorAll('button:not([type])').forEach(button=>button.type='button')};
  window.render=render;
  window.__shtabDiagnostics={...(window.__shtabDiagnostics||{}),uiVersion:()=> '3.0.0'};
  render();
})();
//# sourceURL=chunk26.js
