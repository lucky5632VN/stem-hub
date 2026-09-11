const fs = require('fs');
const path = require('path');

const file = path.resolve('public/labs/lab_sinh/dist/assets/index-2SVj7IJ4.js');
let content = fs.readFileSync(file, 'utf-8');

const target = '_i=[`gemini-2.0-flash`,`gemini-1.5-flash`,`gemini-1.5-pro`,`gemini-2.0-flash-lite`]';
const replacement = '_i=[`gemini-2.5-flash`,`gemini-2.5-flash-lite`,`gemini-flash-latest`,`gemini-2.0-flash`]';

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content, 'utf-8');
  console.log('✅ Successfully updated models in public/labs/lab_sinh/dist/assets/index-2SVj7IJ4.js');
} else {
  console.error('❌ Could not find target in file');
}
