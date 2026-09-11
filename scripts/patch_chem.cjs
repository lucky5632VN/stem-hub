const fs = require('fs');
const path = require('path');

const files = [
  path.resolve('public/labs/lab-ktra15p/gemini_ai.js'),
  path.resolve('public/labs/lab-ktra15p/public/gemini_ai.js'),
  path.resolve('public/labs/lab-ktra15p/dist/gemini_ai.js')
];

const guardCode = `    // ⚡ BƯỚC 0: KIỂM TRA RANH GIỚI MÔN HỌC (SUBJECT BOUNDARY GUARD)
    if (window.StemLabAIBridge && typeof window.StemLabAIBridge.checkSubjectBoundary === 'function') {
      try {
        const guard = window.StemLabAIBridge.checkSubjectBoundary(text, 'hoa');
        if (!guard.allowed) {
          this.addMessage('ai', guard.refusal);
          this.showTyping(false);
          window.StemLabAIBridge.logLabReasoning({
            query: text,
            subject: 'HOA',
            intent: 'subject_boundary_guard',
            aiResponseText: guard.refusal,
            isCacheHit: true,
            labTitle: labTitle
          });
          return;
        }
      } catch (gErr) {
        console.warn('[Lab Hóa AI] Subject guard error:', gErr);
      }
    }

    // ⚡ BƯỚC 1: KIỂM TRA BỘ NHỚ AI TỰ HỌC (CACHE HIT) GIỐNG TRỢ LÝ NOVA`;

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    content = content.replace("'gemini-3.6-flash'", "'gemini-2.0-flash'");
    content = content.replace('"gemini-3.6-flash"', '"gemini-2.0-flash"');
    if (!content.includes("checkSubjectBoundary(text, 'hoa')")) {
      content = content.replace("// ⚡ BƯỚC 1: KIỂM TRA BỘ NHỚ AI TỰ HỌC (CACHE HIT) GIỐNG TRỢ LÝ NOVA", guardCode);
    }
    fs.writeFileSync(file, content, 'utf-8');
    console.log('✅ Patched', file);
  }
});

// Also patch dist/assets/index-DbqG5P_q.js if needed
const bundleFile = path.resolve('public/labs/lab-ktra15p/dist/assets/index-DbqG5P_q.js');
if (fs.existsSync(bundleFile)) {
  let bundleContent = fs.readFileSync(bundleFile, 'utf-8');
  bundleContent = bundleContent.replace('"gemini-3.6-flash"', '"gemini-2.0-flash"');
  bundleContent = bundleContent.replace("'gemini-3.6-flash'", "'gemini-2.0-flash'");
  
  const targetPattern = 'this.addMessage(`user`,t),e.value=``,this.showTyping(!0);let n=this.activeBot===`lab`?`Lab Hóa QuantumLab (Thao tác)`:`Lab Hóa Học THPT (Lý thuyết)`;if(window.StemLabAIBridge&&typeof window.StemLabAIBridge.checkLabLearnedCache==`function`)';
  
  const replacement = 'this.addMessage(`user`,t),e.value=``,this.showTyping(!0);let n=this.activeBot===`lab`?`Lab Hóa QuantumLab (Thao tác)`:`Lab Hóa Học THPT (Lý thuyết)`;if(window.StemLabAIBridge&&typeof window.StemLabAIBridge.checkSubjectBoundary==`function`){try{let e=window.StemLabAIBridge.checkSubjectBoundary(t,`hoa`);if(!e.allowed){this.addMessage(`ai`,e.refusal),this.showTyping(!1),window.StemLabAIBridge.logLabReasoning({query:t,subject:`HOA`,intent:`subject_boundary_guard`,aiResponseText:e.refusal,isCacheHit:!0,labTitle:n});return}}catch(e){console.warn(`[Lab Hóa AI] Subject guard error:`,e)}}if(window.StemLabAIBridge&&typeof window.StemLabAIBridge.checkLabLearnedCache==`function`)';
  
  if (!bundleContent.includes('checkSubjectBoundary(t,`hoa`)')) {
    if (bundleContent.includes(targetPattern)) {
      bundleContent = bundleContent.replace(targetPattern, replacement);
      fs.writeFileSync(bundleFile, bundleContent, 'utf-8');
      console.log('✅ Patched Lab Hóa dist bundle index-DbqG5P_q.js');
    } else {
      console.warn('⚠️ Could not find target pattern in Lab Hóa dist bundle');
    }
  } else {
    console.log('ℹ️ Already patched Lab Hóa dist bundle');
  }
}
