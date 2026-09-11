const fs = require('fs');
const path = require('path');

const ALL_20_KEYS = [
  "AQ.Ab8RN6JQvJjqbu_KwhS6SeCMklVrkn6UO0eLX823yMCY9gXM9A",
  "AQ.Ab8RN6LUOCQS9WwVdCoW1bTJ4u8S6PdTmn-t8gmhAGu4rOUQMQ",
  "AQ.Ab8RN6LnbeGSrsPvVC2IRjcyV-ScvQbLdC4hiaLjRUYlTk9nKw",
  "AQ.Ab8RN6LRcFc7ZLNfv8sT5DaGLVcVAmQPoPvDZg4L5g2gCNxQBA",
  "AQ.Ab8RN6JrZn-2b8RqNFZlr_HimuWnvys1aklTyNaOCqI8cv1vUw",
  "AQ.Ab8RN6J5TlTTIgxjuhZgPAnPbHduDgPI_9Sx2R_2mDnx9cbDiQ",
  "AQ.Ab8RN6KIImWYQ51P647KvVQo-bAuoj9-mnsteNemFEvhIU2DOA",
  "AQ.Ab8RN6LKAFq4FY9r6CykD_7DJvtItBGL7sfzsHzNJW-vQESMpw",
  "AQ.Ab8RN6IUK2SgSUHRvfrUgkMYh5ZuUkU6ARM0xV_tKg901ZFyVA",
  "AQ.Ab8RN6LxIk7ajnDHC39c8HL8idUj_qHEEHZeHVhgQQJd6IVneg",
  "AQ.Ab8RN6KUEHlTK1rT6BDHzBwN3DT31L3L1kFriKNwaPSzZ_94Cg",
  "AQ.Ab8RN6LQUsXZaXFWOu7LxhO1noUzb_RAUuKrdkWA8u5_0RdyyA",
  "AQ.Ab8RN6J11YpEGf4L9cmBzNkXmFSeKG1c97JlM8ympwksIjmJSQ",
  "AQ.Ab8RN6KGyO7LdzYEgcDARmK334qSXG689ngaloM9-Mbl3g5VUg",
  "AQ.Ab8RN6L5ny1C1LsZNy8FdxzzqK0LYub9mSFVvfnprdwduJx8pQ",
  "AQ.Ab8RN6LgzhQhuXeK0P69gw9u_kyxv8jlWTsII--OlfbGDGMddg",
  "AQ.Ab8RN6LENXueegwE82g3Oar7laqRNtDkWxgVA2cnIBEpiRhZsA",
  "AQ.Ab8RN6I1nbEbhyw1ZPatFRlKk9ncAV-SrcfarJHYvztbPU-pYg",
  "AQ.Ab8RN6JqjVgnLduoyC8IHvGKU0-4lZtqHOMGKCQ32w398vWb-Q",
  "AQ.Ab8RN6JCqpqGwgnjLGH5FuV3Ep3kbFGGNiH7XrFvfBqNKHuUxw"
];

const RESILIENT_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite-preview',
  'gemini-2.5-flash-lite',
  'gemma-4-26b-a4b-it',
  'gemma-4-31b-it',
  'gemini-flash-latest'
];

console.log('⚡ Patching all bots with resilient multi-tier models and unified 20-key pool...');

// 1. Patch Chemistry
const chemFiles = [
  'public/labs/lab-ktra15p/gemini_ai.js',
  'public/labs/lab-ktra15p/public/gemini_ai.js',
  'public/labs/lab-ktra15p/dist/gemini_ai.js',
  'public/labs/lab-hoa-sandbox/gemini_ai.js'
];

chemFiles.forEach(f => {
  const fp = path.resolve(f);
  if (fs.existsSync(fp)) {
    let c = fs.readFileSync(fp, 'utf-8');
    // Replace key pools
    const keysJson = JSON.stringify(ALL_20_KEYS, null, 2);
    c = c.replace(/const COMMANDER_API_KEYS = \[[\s\S]*?\];/, `const COMMANDER_API_KEYS = ${keysJson};`);
    c = c.replace(/const GENERAL_API_KEYS = \[[\s\S]*?\];/, `const GENERAL_API_KEYS = ${keysJson};`);
    
    // Replace models
    const modelsJson = JSON.stringify(RESILIENT_MODELS, null, 2);
    c = c.replace(/const modelsToTry = \[[\s\S]*?\];/, `const modelsToTry = ${modelsJson};`);

    // Optimize timeout to 4.5s
    c = c.replace(/setTimeout\(\(\)\s*=>\s*controller\.abort\(\),\s*\d+\)/g, 'setTimeout(() => controller.abort(), 4500)');
    
    fs.writeFileSync(fp, c, 'utf-8');
    console.log('✅ Patched Chem source:', f);
  }
});

// Patch Chem bundle
const chemBundle = path.resolve('public/labs/lab-ktra15p/dist/assets/index-DbqG5P_q.js');
if (fs.existsSync(chemBundle)) {
  let c = fs.readFileSync(chemBundle, 'utf-8');
  const keysStr = JSON.stringify(ALL_20_KEYS);
  c = c.replace(/const COMMANDER_API_KEYS=\[[\s\S]*?\];let commanderKeyIdx/, `const COMMANDER_API_KEYS=${keysStr};let commanderKeyIdx`);
  c = c.replace(/const GENERAL_API_KEYS=\[[\s\S]*?\];let generalKeyIdx/, `const GENERAL_API_KEYS=${keysStr};let generalKeyIdx`);
  c = c.replace(/modelsToTry=\[[\s\S]*?\]/, `modelsToTry=${JSON.stringify(RESILIENT_MODELS)}`);
  fs.writeFileSync(chemBundle, c, 'utf-8');
  console.log('✅ Patched Chem bundle');
}

// 2. Patch Bio bundle
const bioBundle = path.resolve('public/labs/lab_sinh/dist/assets/index-2SVj7IJ4.js');
if (fs.existsSync(bioBundle)) {
  let c = fs.readFileSync(bioBundle, 'utf-8');
  const keysStr = JSON.stringify(ALL_20_KEYS);
  c = c.replace(/hi=\[`AQ.Ab8RN6[\s\S]*?`\],gi=0/, `hi=${keysStr},gi=0`);
  c = c.replace(/_i=\[`gemini-[\s\S]*?`\]/, `_i=${JSON.stringify(RESILIENT_MODELS)}`);
  fs.writeFileSync(bioBundle, c, 'utf-8');
  console.log('✅ Patched Bio bundle');
}

// 3. Patch Math Tutor
const mathFile = path.resolve('public/labs/toan/frontend/src/components/ui/AITutorPanel.js');
if (fs.existsSync(mathFile)) {
  let c = fs.readFileSync(mathFile, 'utf-8');
  const keysJson = JSON.stringify(ALL_20_KEYS, null, 2);
  c = c.replace(/const MATH_API_KEYS = \[[\s\S]*?\];/, `const MATH_API_KEYS = ${keysJson};`);
  c = c.replace(/const MODELS = \[[\s\S]*?\];/, `const MODELS = ${JSON.stringify(RESILIENT_MODELS, null, 2)};`);
  fs.writeFileSync(mathFile, c, 'utf-8');
  console.log('✅ Patched Math Tutor');
}

// 4. Patch Physics Tutor
const physFile = path.resolve('public/labs/PhysicsLab/js/physics-ai-chatbot.js');
if (fs.existsSync(physFile)) {
  let c = fs.readFileSync(physFile, 'utf-8');
  const keysJson = JSON.stringify(ALL_20_KEYS, null, 2);
  c = c.replace(/const PHYSICS_API_KEYS = \[[\s\S]*?\];/, `const PHYSICS_API_KEYS = ${keysJson};`);
  c = c.replace(/const MODELS = \[[\s\S]*?\];/, `const MODELS = ${JSON.stringify(RESILIENT_MODELS, null, 2)};`);
  fs.writeFileSync(physFile, c, 'utf-8');
  console.log('✅ Patched Physics Tutor');
}

console.log('🎉 ALL AI BOTS FULLY REINFORCED WITH 20 KEYS & 7 RESILIENT GEMINI MODELS!');
