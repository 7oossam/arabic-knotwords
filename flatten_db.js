const fs = require('fs');

const wordBank = require('./word_bank.json');
const flatDictionary = {};

// Group all words by length
for (const category in wordBank) {
    for (const item of wordBank[category]) {
        const word = item.word;
        const len = word.length;
        if (!flatDictionary[len]) {
            flatDictionary[len] = new Set();
        }
        flatDictionary[len].add(word);
    }
}

// Convert Sets back to Arrays
const finalDict = {};
let totalWords = 0;
for (const len in flatDictionary) {
    finalDict[len] = Array.from(flatDictionary[len]);
    totalWords += finalDict[len].length;
}

console.log(`Total unique words: ${totalWords}`);
console.log('Words by length:');
for (const len in finalDict) {
    console.log(`Length ${len}: ${finalDict[len].length}`);
}

fs.writeFileSync('flat_dictionary.json', JSON.stringify(finalDict, null, 2));
