const fs = require('fs');
const path = require('path');

const bridgePath = path.resolve('public/labs/shared/stem-lab-ai-bridge.js');
let content = fs.readFileSync(bridgePath, 'utf-8');

// Replace wrapper
const oldWrapper = `(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.StemLabAIBridge = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {`;

const newWrapper = `(function (root, factory) {
  const exported = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = exported;
  }
  if (typeof define === 'function' && define.amd) {
    define([], () => exported);
  }
  const globalTarget = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : root));
  if (globalTarget) {
    globalTarget.StemLabAIBridge = exported;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this), function () {`;

if (content.includes(oldWrapper)) {
  content = content.replace(oldWrapper, newWrapper);
}

fs.writeFileSync(bridgePath, content, 'utf-8');
fs.writeFileSync(path.resolve('public/labs/PhysicsLab/stem-lab-ai-bridge.js'), content, 'utf-8');
fs.writeFileSync(path.resolve('public/labs/lab_sinh/dist/stem-lab-ai-bridge.js'), content, 'utf-8');
console.log('✅ Universal UMD wrapper updated!');
