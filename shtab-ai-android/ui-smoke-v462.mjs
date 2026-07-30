import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const sourcePath=path.resolve('ui-smoke-v461.mjs');
const generatedPath=path.resolve('.ui-smoke-v462.generated.mjs');
let audit=fs.readFileSync(sourcePath,'utf8');
audit=audit
  .replace(`.replaceAll("scripts.at(-1)==='chunk40.js'","scripts.at(-1)==='chunk41.js'")`,`.replaceAll("scripts.at(-1)==='chunk40.js'","scripts.at(-1)==='chunk42.js'")`)
  .replace(`.replaceAll('chunk40 is not loaded last','chunk41 is not loaded last')`,`.replaceAll('chunk40 is not loaded last','chunk42 is not loaded last')`)
  .replaceAll('4.6.1','4.6.2')
  .replaceAll('versionCode = 25','versionCode = 26')
  .replace("const {window}=dom;","const {window}=dom;window.CSS=window.CSS||{};window.CSS.escape=window.CSS.escape||((value)=>String(value).replace(/[^a-zA-Z0-9_-]/g,'\\\\$&'));" )
  .replace("assert(scripts.at(-1)==='chunk41.js','chunk41 must be loaded last');","assert(scripts.at(-1)==='chunk42.js','chunk42 must be loaded last');")
  .replace(`const reminderHours=form.elements.reminderHours;
reminderHours.closest('.custom-select-shell-v461').querySelector('.custom-select-trigger-v461').click();
await wait(4);
customDialog=window.document.querySelector('#custom-select-dialog-v461');
assert(!customDialog.querySelector('#custom-select-search-wrap-v461').hidden,'Long custom select does not provide search');
customDialog.close();`, `const reminderHours=form.elements.reminderHours;
const reminderMinutes=form.elements.reminderMinutes;
const hourTrigger=reminderHours.closest('.custom-select-shell-v461').querySelector('.custom-select-trigger-v461');
const minuteTrigger=reminderMinutes.closest('.custom-select-shell-v461').querySelector('.custom-select-trigger-v461');
assert(hourTrigger.dataset.timeWheelV462==='true'&&minuteTrigger.dataset.timeWheelV462==='true','Hour and minute controls were not converted to one wheel picker');
hourTrigger.click();
await wait(12);
const wheelDialog=window.document.querySelector('#time-wheel-dialog-v462');
assert(wheelDialog?.open,'Time wheel did not open');
assert(!customDialog.open,'Generic option sheet opened instead of the time wheel');
assert(wheelDialog.querySelector('#time-wheel-title-v462').textContent==='За сколько напомнить','Technical field name is visible instead of a human title');
assert(wheelDialog.querySelectorAll('.time-wheel-column-v462').length===2,'Time wheel must contain hour and minute columns');
assert(!wheelDialog.querySelector('input[type="search"]'),'Time wheel must not contain option search');
assert(wheelDialog.querySelectorAll('#time-wheel-hours-v462 .time-wheel-item-v462').length>=24,'Hour wheel is incomplete');
assert(wheelDialog.querySelectorAll('#time-wheel-minutes-v462 .time-wheel-item-v462').length===60,'Minute wheel is incomplete');
window.setDraftValueV462('hours','2');
window.setDraftValueV462('minutes','30');
assert(window.__shtabDiagnostics.timeWheelSummaryV462()==='02 ч 30 мин','Wheel summary did not update');
wheelDialog.querySelector('.time-wheel-apply-v462').click();
assert(reminderHours.value==='2'&&reminderMinutes.value==='30','Wheel values were not written back to the form');
assert(!wheelDialog.open,'Time wheel did not close after applying');`)
  .replace("const chunkSource=fs.readFileSync(path.join(root,'chunk41.js'),'utf8');","const chunkSource=fs.readFileSync(path.join(root,'chunk41.js'),'utf8');const wheelSource=fs.readFileSync(path.join(root,'chunk42.js'),'utf8');")
  .replace("assert(chunkSource.includes(\"item.priority==='high'||item.important===true\"),'Important priority rule is not strict');","assert(chunkSource.includes(\"item.priority==='high'||item.important===true\"),'Important priority rule is not strict');assert(wheelSource.includes('time-wheel-list-v462')&&wheelSource.includes('scroll-snap-type:y mandatory'),'Wheel picker styling or snap behavior is missing');")
  .replace("console.log('✓ every native select is replaced by the unified styled selection sheet');","console.log('✓ ordinary selects use the styled sheet while hour/minute pairs use a two-column wheel');")
  .replace("All v4.6.2 unified control and priority tests passed.","All v4.6.2 wheel picker, unified control and priority tests passed.");
fs.writeFileSync(generatedPath,audit);
try{
  await import(`${pathToFileURL(generatedPath).href}?run=${Date.now()}`);
}finally{
  fs.rmSync(generatedPath,{force:true});
}
