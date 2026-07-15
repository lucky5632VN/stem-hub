const text = "đường thẳng \\Delta";
const regex = /\\Delta/g;
console.log(text.replace(regex, 'Δ'));
