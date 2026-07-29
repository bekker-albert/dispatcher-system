import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const legacyPath=path.resolve('ui-smoke-v45.mjs');
const generatedPath=path.resolve('.ui-smoke-v451-full.generated.mjs');
let fullAudit=fs.readFileSync(legacyPath,'utf8');
fullAudit=fullAudit
  .replaceAll("4.5.0","4.5.1")
  .replaceAll("versionCode = 21","versionCode = 22")
  .replaceAll("All v4.5 conditional","All v4.5.1 conditional");
fs.writeFileSync(generatedPath,fullAudit);
try{
  await import(`${pathToFileURL(generatedPath).href}?run=${Date.now()}`);
}finally{
  fs.rmSync(generatedPath,{force:true});
}

const root=path.resolve('app/src/main');
const patch=fs.readFileSync(path.join(root,'assets/patch.css'),'utf8');
const chunk=fs.readFileSync(path.join(root,'assets/chunk37.js'),'utf8');
const html=fs.readFileSync(path.join(root,'assets/index.html'),'utf8');
const manifest=fs.readFileSync(path.join(root,'AndroidManifest.xml'),'utf8');
const application=fs.readFileSync(path.join(root,'java/kz/shtabai/app/ShtabApplication.java'),'utf8');

const assert=(value,message)=>{if(!value)throw new Error(message)};
assert(html.includes('<button type="button" class="nav-add-v45" id="fab"'),'Central add is absent from packaged HTML');
assert((html.match(/data-page="/g)||[]).length===4,'Expected four page destinations around the central add');
assert(patch.includes('.bottom-nav>#fab.nav-add-v45')&&patch.includes('display:flex!important')&&patch.includes('visibility:visible!important'),'Static high-specificity visibility protection is missing');
assert(chunk.includes('.bottom-nav>#fab.nav-add-v45')&&chunk.includes("uiVersion:()=> '4.5.1'"),'Runtime visibility protection or UI version is missing');
assert(manifest.includes('android:name=".ShtabApplication"'),'Version-aware application is not registered');
assert(application.includes('clearCache(true)')&&application.includes('BuildConfig.VERSION_CODE'),'WebView interface cache is not refreshed per APK version');
assert(!application.includes('deleteAllData')&&!application.includes('WebStorage.getInstance().deleteAllData'),'Cache refresh must not delete local user data');
console.log('✓ packaged central add exists and cannot be hidden by legacy #fab rules');
console.log('✓ APK update refreshes only cached interface assets and preserves DOM storage');
console.log('\nAll v4.5.1 central add visibility and cache-refresh tests passed.');
