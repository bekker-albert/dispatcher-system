import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const legacyPath=path.resolve('ui-smoke-v45.mjs');
const original=fs.readFileSync(legacyPath,'utf8');
const adapted=original.replaceAll('#task-menu-dialog-v43','#task-menu-dialog-v470');
fs.writeFileSync(legacyPath,adapted);
try{
  await import(`${pathToFileURL(path.resolve('ui-smoke-v470.mjs')).href}?run=${Date.now()}`);
}finally{
  fs.writeFileSync(legacyPath,original);
}
