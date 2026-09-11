const fs = require('fs');
const path = require('path');

const bundlePath = path.resolve('public/labs/toan/frontend/dist/assets/index-Cd56pKg9.js');
let content = fs.readFileSync(bundlePath, 'utf-8');

const targetStr = `notes:"Gia su STEM Toan 3D phan tich va da luu kien thuc moi vao learned_knowledge."});
      }
    }}
    let t=/`;

const fixedStr = `notes:"Gia su STEM Toan 3D phan tich va da luu kien thuc moi vao learned_knowledge."});
      }
    }
    let t=/`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, fixedStr);
  fs.writeFileSync(bundlePath, content, 'utf-8');
  console.log('✅ Replaced targetStr with LF');
} else {
  // Try CRLF
  const targetCRLF = targetStr.replace(/\n/g, '\r\n');
  const fixedCRLF = fixedStr.replace(/\n/g, '\r\n');
  if (content.includes(targetCRLF)) {
    content = content.replace(targetCRLF, fixedCRLF);
    fs.writeFileSync(bundlePath, content, 'utf-8');
    console.log('✅ Replaced targetStr with CRLF');
  } else {
    // Regex replace
    content = content.replace(/(notes:"Gia su STEM Toan 3D phan tich va da luu kien thuc moi vao learned_knowledge\."\}\);\s*\}\s*)\}\s*(\}\s*let t=\/)/, '$1$2');
    fs.writeFileSync(bundlePath, content, 'utf-8');
    console.log('✅ Replaced via regex');
  }
}
