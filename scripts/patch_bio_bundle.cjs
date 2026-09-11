const fs = require('fs');
const path = require('path');

const bundlePath = path.resolve('public/labs/lab_sinh/dist/assets/index-DBstUBNA.js');
let content = fs.readFileSync(bundlePath, 'utf-8');

// 1. Fix models
content = content.replace('"gemini-3.6-flash"', '"gemini-2.0-flash"');

// 2. Add subject boundary guard before cache check
const targetPattern = 'd(``),l(t),_(t),p(!0);if(window.StemLabAIBridge&&typeof window.StemLabAIBridge.checkLabLearnedCache==="function")';

const replacement = `d(\`\`),l(t),_(t),p(!0);if(window.StemLabAIBridge&&typeof window.StemLabAIBridge.checkSubjectBoundary==="function"){try{let guard=window.StemLabAIBridge.checkSubjectBoundary(e,"sinh");if(!guard.allowed){await new Promise(r=>setTimeout(r,250));let ans=guard.refusal,fin=[...t,{sender:"bot",text:ans}];l(fin),_(fin),p(!1);window.StemLabAIBridge.logLabReasoning({query:e,subject:"SINH",intent:"subject_boundary_guard",aiResponseText:ans,isCacheHit:!0,labTitle:"Lab Sinh Học THPT"});return;}}catch(_){}}if(window.StemLabAIBridge&&typeof window.StemLabAIBridge.checkLabLearnedCache==="function")`;

if (!content.includes('checkSubjectBoundary(e,"sinh")')) {
  if (content.includes(targetPattern)) {
    content = content.replace(targetPattern, replacement);
    fs.writeFileSync(bundlePath, content, 'utf-8');
    console.log('✅ Successfully patched Lab Sinh dist bundle with subject boundary guard and valid models!');
  } else {
    console.error('❌ Could not find target pattern in Lab Sinh bundle');
  }
} else {
  console.log('ℹ️ Already patched Lab Sinh bundle');
}
