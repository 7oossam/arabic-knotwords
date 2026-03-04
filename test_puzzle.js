const fs = require('fs');
const code = fs.readFileSync('script.js', 'utf8');
const puzzleString = code.match(/const puzzles = (\{[\s\S]*?\n\};)/)[1];

let puzzles;
eval('puzzles = ' + puzzleString);

console.log(JSON.stringify(puzzles, null, 2));
