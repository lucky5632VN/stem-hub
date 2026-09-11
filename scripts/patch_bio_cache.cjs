const fs = require('fs');
const path = require('path');

const filePath = path.resolve('e:/project/cuoc_thi_AI/public/labs/lab_sinh/dist/assets/index-DBstUBNA.js');
let code = fs.readFileSync(filePath, 'utf8');

const targetStr = 'd(``),l(t),_(t),p(!0);';
const targetIndex = code.indexOf(targetStr);

if (targetIndex === -1) {
  console.error('targetStr not found!');
  process.exit(1);
}

const cacheCheckCode = 'if(window.StemLabAIBridge&&typeof window.StemLabAIBridge.checkLabLearnedCache==="function"){try{let ch=await window.StemLabAIBridge.checkLabLearnedCache(e,"sinh",0.68);if(ch&&ch.hit){await new Promise(r=>setTimeout(r,300));let ans=ch.answer,fin=[...t,{sender:"bot",text:ans}];l(fin),_(fin),p(!1);window.StemLabAIBridge.logLabReasoning({query:e,subject:"SINH",aiResponseText:ans,isCacheHit:!0,labTitle:"Lab Sinh Học THPT",score:ch.score});return;}}catch(_){}}';

// Check if already present
if (code.includes('checkLabLearnedCache')) {
  console.log('Already has checkLabLearnedCache');
} else {
  code = code.slice(0, targetIndex + targetStr.length) + cacheCheckCode + code.slice(targetIndex + targetStr.length);
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Successfully patched checkLabLearnedCache into index-DBstUBNA.js!');
}
