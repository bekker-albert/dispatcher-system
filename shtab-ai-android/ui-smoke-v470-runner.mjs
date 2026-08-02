import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const legacyPath=path.resolve('ui-smoke-v45.mjs');
const auditPath=path.resolve('ui-smoke-v470.mjs');
const generatedPath=path.resolve('.ui-smoke-v470-run.generated.mjs');
const legacyOriginal=fs.readFileSync(legacyPath,'utf8');
const auditOriginal=fs.readFileSync(auditPath,'utf8');
const adaptedLegacy=legacyOriginal.replaceAll('#task-menu-dialog-v43','#task-menu-dialog-v470');
const adaptedAudit=auditOriginal
  .replace(
    "for(const source of scripts)window.eval(fs.readFileSync(path.join(root,source),'utf8'));",
    "window.eval(scripts.map(source=>fs.readFileSync(path.join(root,source),'utf8')).join('\\n;\\n'));"
  )
  .replaceAll("scripts.at(-1)==='chunk44.js'","scripts.at(-1)==='chunk45.js'")
  .replaceAll('chunk44 is not loaded last','chunk45 is not loaded last')
  .replace("const state=window.eval('state');","const state=window.__shtabStateV470;");
fs.writeFileSync(legacyPath,adaptedLegacy);
fs.writeFileSync(generatedPath,adaptedAudit);
try{
  await import(`${pathToFileURL(generatedPath).href}?run=${Date.now()}`);
}finally{
  fs.writeFileSync(legacyPath,legacyOriginal);
  fs.rmSync(generatedPath,{force:true});
}
