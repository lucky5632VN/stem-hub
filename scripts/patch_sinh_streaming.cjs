const fs = require('fs');
const path = require('path');

// 1. Patch src/components/Chatbot.jsx
const jsxPath = path.resolve('public/labs/lab_sinh/src/components/Chatbot.jsx');
let jsx = fs.readFileSync(jsxPath, 'utf-8');

// Disable auto-scroll
jsx = jsx.replace('const scrollToBottom = () => {\n        messagesEndRef.current?.scrollIntoView({ behavior: \'smooth\' });\n    };', 'const scrollToBottom = () => {};');
jsx = jsx.replace('useEffect(() => {\n        scrollToBottom();\n    }, [messages]);', '// Auto-scroll disabled per user preference\n    // useEffect(() => { scrollToBottom(); }, [messages]);');

fs.writeFileSync(jsxPath, jsx, 'utf-8');
console.log('✅ Updated Chatbot.jsx auto-scroll removal');

// 2. Patch dist/assets/index-DBstUBNA.js
const bundlePath = path.resolve('public/labs/lab_sinh/dist/assets/index-DBstUBNA.js');
let bundle = fs.readFileSync(bundlePath, 'utf-8');

// Disable auto-scroll in bundle: replace h=()=>{m.current?.scrollIntoView({behavior:`smooth`})} with h=()=>{}
bundle = bundle.replace('h=()=>{m.current?.scrollIntoView({behavior:`smooth`})}', 'h=()=>{}');

// Create typewriter streaming helper in bundle
// We can define streamBot inside vi() right after d(``),l(t),_(t),p(!0);
const streamHelper = `let stBot=async(fullTxt)=>{p(!1);let words=fullTxt.split(" "),cur="";let delay=Math.max(10,Math.min(25,Math.floor(1600/Math.max(1,words.length))));l([...t,{sender:"bot",text:""}]);for(let i=0;i<words.length;i++){cur+=(i===0?"":" ")+words[i];let snap=cur;l(prev=>{let next=[...prev];next[next.length-1]={sender:"bot",text:snap};return next;});await new Promise(r=>setTimeout(r,delay));}let fin=[...t,{sender:"bot",text:fullTxt}];l(fin),_(fin);};`;

// Replace subject guard direct output:
// Original: let ans=guard.refusal,fin=[...t,{sender:"bot",text:ans}];l(fin),_(fin),p(!1);
// New: let ans=guard.refusal;await stBot(ans);
bundle = bundle.replace(
  'let ans=guard.refusal,fin=[...t,{sender:"bot",text:ans}];l(fin),_(fin),p(!1);',
  'let ans=guard.refusal;await stBot(ans);'
);

// Replace cache hit direct output:
// Original: let ans=ch.answer,fin=[...t,{sender:"bot",text:ans}];l(fin),_(fin),p(!1);
// New: let ans=ch.answer;await stBot(ans);
bundle = bundle.replace(
  'let ans=ch.answer,fin=[...t,{sender:"bot",text:ans}];l(fin),_(fin),p(!1);',
  'let ans=ch.answer;await stBot(ans);'
);

// Replace gemini response direct output:
// Original: let n=[...t,{sender:`bot`,text:s_rep}];l(n),_(n),a=!0;
// New: a=!0;await stBot(s_rep);
bundle = bundle.replace(
  'let n=[...t,{sender:`bot`,text:s_rep}];l(n),_(n),a=!0;',
  'a=!0;await stBot(s_rep);'
);

// Inject stBot right after d(``),l(t),_(t),p(!0);
if (!bundle.includes('let stBot=async(fullTxt)')) {
  bundle = bundle.replace('d(``),l(t),_(t),p(!0);', 'd(``),l(t),_(t),p(!0);' + streamHelper);
}

fs.writeFileSync(bundlePath, bundle, 'utf-8');
console.log('✅ Updated Lab Sinh bundle with typewriter streaming and no auto-scroll');
