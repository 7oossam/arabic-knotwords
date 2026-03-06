const fs = require('fs');

const rawData = fs.readFileSync('arabic.json', 'utf8');
const data = JSON.parse(rawData);

// Normalize Arabic words: remove diacritics (tashkeel), tatweel, and unify Alefs
function normalizeArabic(word) {
    if(!word) return "";
    return word
        .replace(/[\u064B-\u065F\u0670]/g, '') // remove tashkeel and tatweel
        .replace(/[أإآء]/g, 'ا') // unify alefs (we don't unify hamza completely unless it's on an alef, actually knotwords usually unifies all Alefs to bare alef to be easier)
        .trim();
}

let flatDictionary = {};
let wordCount = 0;

for (const entry of data) {
    if (!entry.diacritized_word) continue;

    // Some words are multiple words "في المنزل". We only want single words.
    let word = normalizeArabic(entry.diacritized_word);

    if (word.includes(' ') || word.includes('-') || word.includes('ةَ')) {
        continue;
    }

    // Also, usually crosswords don't include extremely short conjunctions if they don't fit the length,
    // but the generator will filter by length anyway.

    // Extra validation: must contain only Arabic letters
    if (!/^[\u0621-\u064A]+$/.test(word)) {
        continue;
    }

    let len = word.length;
    if (len < 3 || len > 8) continue; // Only keep standard lengths

    if (!flatDictionary[len]) {
        flatDictionary[len] = new Set();
    }
    flatDictionary[len].add(word);
}

const finalDict = {};
for (const len in flatDictionary) {
    finalDict[len] = Array.from(flatDictionary[len]);
    wordCount += finalDict[len].length;
}

console.log(`Total unique high-quality words extracted: ${wordCount}`);
for (const len in finalDict) {
    console.log(`Length ${len}: ${finalDict[len].length}`);
}

fs.writeFileSync('flat_dictionary.json', JSON.stringify(finalDict, null, 2));

// Generate clues file mapping word -> english_translation for potential hints
let clues = {};
for (const entry of data) {
    if (!entry.diacritized_word) continue;
    let word = normalizeArabic(entry.diacritized_word);
    if (!clues[word] && entry.english_translation) {
        clues[word] = entry.english_translation.split(';')[0]; // Just take first translation
    }
}
fs.writeFileSync('word_clues.json', JSON.stringify(clues, null, 2));
