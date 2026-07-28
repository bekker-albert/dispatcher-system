import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const sourcePath=path.resolve('ui-smoke.mjs');
const generatedPath=path.resolve('.ui-smoke-v26.generated.mjs');
const source=fs.readFileSync(sourcePath,'utf8').replace('Array.from({length:19}', 'Array.from({length:20}');
fs.writeFileSync(generatedPath,source,'utf8');
try{await import(`${pathToFileURL(generatedPath).href}?v=${Date.now()}`)}finally{try{fs.unlinkSync(generatedPath)}catch{}}