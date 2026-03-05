const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_URL = 'https://github.com/jamalamch/Arabic-Words-Sentences.git';
const TMP_DIR = path.join(__dirname, 'tmp_arabic_words');
const ARABIC_DIR = path.join(TMP_DIR, 'ArabicMots3-8Litter-Json');
const OUT_FILE = path.join(__dirname, 'word_bank.json');

// Normalization function
function normalizeArabic(text) {
    if (!text) return '';
    // Remove diacritics (tashkeel)
    let normalized = text.replace(/[\u0617-\u061A\u064B-\u0652]/g, '');
    // Normalize Alef forms to bare Alef
    normalized = normalized.replace(/[أإآ]/g, 'ا');
    // Remove Tatweel/Kashida
    normalized = normalized.replace(/ـ/g, '');
    return normalized.trim();
}

// Check if a string contains ONLY Arabic letters
function isPureArabic(text) {
    return /^[\u0621-\u064A]+$/.test(text);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Generate a simple clue since we don't have real definitions
function generateClue(word) {
    // Basic idea: "كلمة تتكون من X حروف تبدأ بحرف Y"
    const len = word.length;
    const firstChar = word.charAt(0);
    return `كلمة تتكون من ${len} حروف تبدأ بحرف ${firstChar}`;
}

async function buildDb() {
    // 1. Clone repository if not exists
    if (!fs.existsSync(TMP_DIR)) {
        console.log(`Cloning repository from ${REPO_URL} into ${TMP_DIR}...`);
        execSync(`git clone ${REPO_URL} ${TMP_DIR}`, { stdio: 'inherit' });
    } else {
        console.log(`Repository already exists at ${TMP_DIR}. Using existing files.`);
    }

    const allWordsSet = new Set();
    const files = fs.readdirSync(ARABIC_DIR).filter(f => f.endsWith('.json'));
    console.log(`Found ${files.length} JSON files.`);

    // 2. Process all JSON files
    for (const file of files) {
        const filePath = path.join(ARABIC_DIR, file);
        try {
            const fileData = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(fileData);

            for (const item of data) {
                if (item.mot) {
                    const norm = normalizeArabic(item.mot);
                    // Filter: must be >= 2 characters, pure Arabic (no spaces or foreign chars)
                    if (norm.length >= 2 && isPureArabic(norm)) {
                        allWordsSet.add(norm);
                    }
                }
            }
        } catch (e) {
            console.error(`Error processing ${file}: ${e.message}`);
        }
    }

    const allWords = Array.from(allWordsSet);
    console.log(`Total unique, valid, normalized Arabic words: ${allWords.length}`);

    // 3. Separate into short (<= 5) and long (> 5)
    const shortWords = [];
    const longWords = [];

    for (const w of allWords) {
        if (w.length <= 5) {
            shortWords.push(w);
        } else {
            longWords.push(w);
        }
    }

    shuffleArray(shortWords);
    shuffleArray(longWords);

    let shortIndex = 0;
    let longIndex = 0;

    function getNextShort() {
        if (shortIndex >= shortWords.length) shortIndex = 0;
        return shortWords[shortIndex++];
    }

    function getNextLong() {
        if (longIndex >= longWords.length) longIndex = 0;
        return longWords[longIndex++];
    }

    const newDb = {};

    // 4. Generate 35 categories of 1000 words each (60% short, 40% long)
    for (let i = 1; i <= 35; i++) {
        const categoryName = `مجموعة ${i}`;
        const catWords = [];

        for (let s = 0; s < 600; s++) {
            const word = getNextShort();
            catWords.push({ word: word, clue: generateClue(word) });
        }

        for (let l = 0; l < 400; l++) {
            const word = getNextLong();
            catWords.push({ word: word, clue: generateClue(word) });
        }

        shuffleArray(catWords);

        newDb[categoryName] = catWords;
    }

    // 5. Write to output file
    fs.writeFileSync(OUT_FILE, JSON.stringify(newDb, null, 2), 'utf8');
    console.log(`Successfully wrote database to ${OUT_FILE}`);

    // Optional: Clean up temporary directory to save space
    console.log(`Cleaning up ${TMP_DIR}...`);
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
    console.log(`Cleanup complete.`);
}

buildDb();
