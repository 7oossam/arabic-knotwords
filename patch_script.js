const fs = require('fs');

const scriptContent = fs.readFileSync('script.js', 'utf8');
const generatedPuzzles = fs.readFileSync('generated_puzzles.json', 'utf8');

const regex = /const puzzles = \[\s*\{[\s\S]*?\}\s*\];/;
const replacement = `const puzzles = ${generatedPuzzles};`;

const newScript = scriptContent.replace(regex, replacement);
fs.writeFileSync('script.js', newScript);
