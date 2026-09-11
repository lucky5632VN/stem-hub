const fs = require('fs');
const path = require('path');

// 1. Patch AITutorPanel.tsx
const tsxPath = path.resolve('public/labs/toan/frontend/src/components/ui/AITutorPanel.tsx');
if (fs.existsSync(tsxPath)) {
  let tsx = fs.readFileSync(tsxPath, 'utf-8');
  // Remove auto-scroll
  tsx = tsx.replace(
    `  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);`,
    `  useEffect(() => {
    // Auto-scroll disabled per user preference
  }, [messages, isLoading]);`
  );
  fs.writeFileSync(tsxPath, tsx, 'utf-8');
  console.log('✅ Patched AITutorPanel.tsx');
}

// 2. Patch AITutorPanel.js
const jsPath = path.resolve('public/labs/toan/frontend/src/components/ui/AITutorPanel.js');
if (fs.existsSync(jsPath)) {
  let js = fs.readFileSync(jsPath, 'utf-8');
  js = js.replace(
    `  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);`,
    `  useEffect(() => {
    // Auto-scroll disabled per user preference
  }, [messages, isLoading]);`
  );
  fs.writeFileSync(jsPath, js, 'utf-8');
  console.log('✅ Patched AITutorPanel.js');
}

// 3. Patch index-Cd56pKg9.js
const bundlePath = path.resolve('public/labs/toan/frontend/dist/assets/index-Cd56pKg9.js');
let bundle = fs.readFileSync(bundlePath, 'utf-8');

// Disable auto-scroll
bundle = bundle.replace(
  '(0,W.useEffect)(()=>{g.current&&(g.current.scrollTop=g.current.scrollHeight)},[c,f])',
  '(0,W.useEffect)(()=>{},[c,f])'
);

// Stream typewriter helper
const streamMathHelper = `let stMath=async(fullTxt,baseMsgs)=>{p(!1);let words=fullTxt.split(" "),cur="";let delay=Math.max(10,Math.min(25,Math.floor(1600/Math.max(1,words.length))));let mid=crypto.randomUUID();l([...baseMsgs,{id:mid,role:"ai",content:"",timestamp:new Date}]);for(let i=0;i<words.length;i++){cur+=(i===0?"":" ")+words[i];let snap=cur;l(prev=>{let next=[...prev];next[next.length-1]={...next[next.length-1],content:snap};return next;});await new Promise(r=>setTimeout(r,delay));}let fin=[...baseMsgs,{id:mid,role:"ai",content:fullTxt,timestamp:new Date}];l(fin),E(fin);};`;

// Replace `let r=[...n,{id:crypto.randomUUID(),role:`ai`,content:s,timestamp:new Date}]; l(r),E(r);` with `await stMath(s,n);`
const targetOutput = 'let r=[...n,{id:crypto.randomUUID(),role:`ai`,content:s,timestamp:new Date}];l(r),E(r);';
const altTargetOutput = 'let r=[...n,{id:crypto.randomUUID(),role:"ai",content:s,timestamp:new Date}];l(r),E(r);';

if (!bundle.includes('let stMath=async(')) {
  // Inject helper at start of D callback
  bundle = bundle.replace('let D=(0,W.useCallback)(async e=>{', 'let D=(0,W.useCallback)(async e=>{' + streamMathHelper);
}

if (bundle.includes(targetOutput)) {
  bundle = bundle.replace(targetOutput, 'await stMath(s,n);');
  console.log('✅ Replaced targetOutput with await stMath(s,n)');
} else if (bundle.includes(altTargetOutput)) {
  bundle = bundle.replace(altTargetOutput, 'await stMath(s,n);');
  console.log('✅ Replaced altTargetOutput with await stMath(s,n)');
} else {
  // Regex match for `let r=[...n,{id:crypto.randomUUID(),role:[`"]ai[`"],content:s,timestamp:new Date}];\s*l\(r\),E\(r\);`
  bundle = bundle.replace(/let r=\[\.\.\.n,\{id:crypto\.randomUUID\(\),role:[`"]ai[`"],content:s,timestamp:new Date\}\];\s*l\(r\),E\(r\);/, 'await stMath(s,n);');
  console.log('✅ Replaced via regex in Lab Toán bundle');
}

fs.writeFileSync(bundlePath, bundle, 'utf-8');
console.log('✅ Successfully patched Lab Toán bundle with typewriter streaming and no auto-scroll');
