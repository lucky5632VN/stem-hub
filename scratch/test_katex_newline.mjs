import katex from 'katex';

let rendered = katex.renderToString("\\sqrt{3}", { displayMode: false });
console.log('Before strip newlines, contains \\n:', rendered.includes('\n'));

rendered = rendered.replace(/\r?\n/g, ' ');
console.log('After strip newlines, contains \\n:', rendered.includes('\n'));
console.log('SVG path d preview:', rendered.match(/d="([^"]+)"/)?.[1].substring(0, 50));

// Test paragraph replacement
const block = `Here is formula: ${rendered}`;
const paragraph = block.replace(/\n/g, '<br />');
console.log('Paragraph contains <br /> inside d:', paragraph.includes('<br />'));
