const fs = require('fs');
let s = fs.readFileSync('js/quiz-database.js', 'utf8');

// The regex matches a single $, capturing what is before and after, to ensure it doesn't match $$
// It uses a while loop to handle sequential replacements cleanly due to non-overlapping captures
let previous = '';
while (s !== previous) {
    previous = s;
    // Replace $...$ (that are not $$) with \\( ... \\)
    s = s.replace(/(^|[^\$])\$([^\$]+?)\$([^\$]|$)/g, '$1\\\\($2\\\\)$3');
}

fs.writeFileSync('js/quiz-database.js', s);
console.log('Fixed math symbols.');
