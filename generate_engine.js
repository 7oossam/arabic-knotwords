const fs = require('fs');
const flatDictionary = require('./flat_dictionary.json');

// Helper to shuffle array
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate an irregular, compact crossword-style polyomino
function generateCompactTemplate(minWords = 8) {
    let rows = getRandomInt(7, 10);
    let cols = getRandomInt(7, 10);
    let template = Array.from({ length: rows }, () => Array(cols).fill(0));

    // Core seed
    let startR = Math.floor(rows / 2) - 1;
    let startC = Math.floor(cols / 2) - 1;
    template[startR][startC] = 1;
    template[startR][startC+1] = 1;
    template[startR+1][startC] = 1;
    template[startR+1][startC+1] = 1;

    let iterations = getRandomInt(20, 35);
    for(let i=0; i<iterations; i++) {
        let r = getRandomInt(0, rows-1);
        let c = getRandomInt(0, cols-1);

        if(template[r][c] === 0) {
            let adj = false;
            // Check for adjacent filled cells
            if(r > 0 && template[r-1][c] === 1) adj = true;
            if(r < rows-1 && template[r+1][c] === 1) adj = true;
            if(c > 0 && template[r][c-1] === 1) adj = true;
            if(c < cols-1 && template[r][c+1] === 1) adj = true;

            if(adj) template[r][c] = 1;
        }
    }

    // Now punch exactly 2 to 4 holes to force empty spaces inside the block
    let holes = getRandomInt(2, 4);
    for (let h = 0; h < holes; h++) {
        let r = getRandomInt(1, rows-2);
        let c = getRandomInt(1, cols-2);
        if (template[r][c] === 1) {
            template[r][c] = 0;
        }
    }

    // To ensure empty cells, just let the original grid expansion naturally leave corners empty
    // Punching holes often breaks word structures into single letters or makes impossible crossword puzzles.

    // Trim empty rows and cols
    let top = rows, bottom = -1, left = cols, right = -1;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (template[r][c] === 1) {
                if (r < top) top = r;
                if (r > bottom) bottom = r;
                if (c < left) left = c;
                if (c > right) right = c;
            }
        }
    }

    if (bottom < top || right < left) return null;

    let trimmed = [];
    for (let r = top; r <= bottom; r++) {
        let newRow = [];
        for (let c = left; c <= right; c++) {
            newRow.push(template[r][c]);
        }
        trimmed.push(newRow);
    }

    let tr = trimmed.length;
    let tc = trimmed[0].length;

    // Reject 1-letter words (invalid in our crosswords) - Wait, we only care about real words.
    // If a cell doesn't belong to a horizontal OR vertical word > 1 letter, it's an orphan.
    for (let r = 0; r < tr; r++) {
        for (let c = 0; c < tc; c++) {
            if (trimmed[r][c] === 1) {
                let isH = (c > 0 && trimmed[r][c - 1] === 1) || (c < tc - 1 && trimmed[r][c + 1] === 1);
                let isV = (r > 0 && trimmed[r - 1][c] === 1) || (r < tr - 1 && trimmed[r + 1][c] === 1);
                if (!isH && !isV) return null; // Orphan cell
            }
        }
    }

    let intersections = 0;
    let wordCount = 0;

    // Count horizontal words
    for (let r = 0; r < tr; r++) {
        let len = 0;
        for (let c = 0; c <= tc; c++) {
            if (c < tc && trimmed[r][c] === 1) len++;
            else {
                if (len > 1) {
                    wordCount++;
                    if (len > 7) return null; // Reject long words
                }
                len = 0;
            }
        }
    }
    // Count vertical words
    for (let c = 0; c < tc; c++) {
        let len = 0;
        for (let r = 0; r <= tr; r++) {
            if (r < tr && trimmed[r][c] === 1) len++;
            else {
                if (len > 1) {
                    wordCount++;
                    if (len > 7) return null; // Reject long words to avoid empty candidate lists
                }
                len = 0;
            }
        }
    }

    for (let r = 0; r < tr; r++) {
        for (let c = 0; c < tc; c++) {
            if (trimmed[r][c] === 1) {
                let isH = (c > 0 && trimmed[r][c - 1] === 1) || (c < tc - 1 && trimmed[r][c + 1] === 1);
                let isV = (r > 0 && trimmed[r - 1][c] === 1) || (r < tr - 1 && trimmed[r + 1][c] === 1);
                if (isH && isV) intersections++;
            }
        }
    }

    // Ensure we meet the minimum word requirement.
    // Ensure we meet the minimum word requirement and enforce a bit more intersection
    if (wordCount >= minWords && wordCount <= minWords + 6 && intersections >= 2) {
        return trimmed;
    }
    return null;
}

class Solver {
    constructor(template) {
        this.template = template;
        this.rows = template.length;
        this.cols = template[0].length;
        this.grid = template.map(row => row.map(val => val === 1 ? ' ' : null));

        this.slots = [];
        this.initSlots();
        this.wordsUsed = new Set();
        this.cache = new Map();
    }

    initSlots() {
        // Collect Horizontal slots
        for (let r = 0; r < this.rows; r++) {
            let startC = -1;
            for (let c = 0; c <= this.cols; c++) {
                if (c < this.cols && this.grid[r][c] !== null) {
                    if (startC === -1) startC = c;
                } else {
                    if (startC !== -1 && c - startC > 1) {
                        this.slots.push({ r, c: startC, len: c - startC, dir: 'H' });
                    }
                    startC = -1;
                }
            }
        }
        // Collect Vertical slots
        for (let c = 0; c < this.cols; c++) {
            let startR = -1;
            for (let r = 0; r <= this.rows; r++) {
                if (r < this.rows && this.grid[r][c] !== null) {
                    if (startR === -1) startR = r;
                } else {
                    if (startR !== -1 && r - startR > 1) {
                        this.slots.push({ r: startR, c, len: r - startR, dir: 'V' });
                    }
                    startR = -1;
                }
            }
        }
    }

    getPattern(slot) {
        let pattern = '';
        for (let i = 0; i < slot.len; i++) {
            const r = slot.dir === 'V' ? slot.r + i : slot.r;
            const c = slot.dir === 'H' ? slot.c + i : slot.c;
            pattern += this.grid[r][c] || ' ';
        }
        return pattern;
    }

    getPossibleWords(pattern) {
        if (this.cache.has(pattern)) {
            return this.cache.get(pattern).filter(w => !this.wordsUsed.has(w));
        }

        const len = pattern.length;
        const candidates = flatDictionary[len] || [];
        const regexStr = '^' + pattern.replace(/ /g, '.') + '$';
        const regex = new RegExp(regexStr);

        const matched = candidates.filter(w => regex.test(w));
        this.cache.set(pattern, matched);

        return matched.filter(w => !this.wordsUsed.has(w));
    }

    solve(slotIndex = 0) {
        if (slotIndex >= this.slots.length) return true;

        const remainingSlots = this.slots.slice(slotIndex);

        // MRV Heuristic
        let bestSlot = null;
        let minOptions = Infinity;

        for (const slot of remainingSlots) {
            const pattern = this.getPattern(slot);
            const options = this.getPossibleWords(pattern).length;

            if (options === 0) return false;

            if (options < minOptions) {
                minOptions = options;
                bestSlot = slot;
            }
        }

        const actualIndex = this.slots.indexOf(bestSlot);
        [this.slots[slotIndex], this.slots[actualIndex]] = [this.slots[actualIndex], this.slots[slotIndex]];
        const currentSlot = this.slots[slotIndex];

        const pattern = this.getPattern(currentSlot);
        let candidates = this.getPossibleWords(pattern);

        candidates = shuffle([...candidates]);

        for (const word of candidates) {
            let oldChars = [];
            for (let i = 0; i < currentSlot.len; i++) {
                const r = currentSlot.dir === 'V' ? currentSlot.r + i : currentSlot.r;
                const c = currentSlot.dir === 'H' ? currentSlot.c + i : currentSlot.c;
                oldChars.push(this.grid[r][c]);
                this.grid[r][c] = word[i];
            }

            this.wordsUsed.add(word);

            if (this.solve(slotIndex + 1)) return true;

            for (let i = 0; i < currentSlot.len; i++) {
                const r = currentSlot.dir === 'V' ? currentSlot.r + i : currentSlot.r;
                const c = currentSlot.dir === 'H' ? currentSlot.c + i : currentSlot.c;
                this.grid[r][c] = oldChars[i];
            }
            this.wordsUsed.delete(word);
        }

        return false;
    }
}

function generatePuzzleWithRetries(minWords) {
    let attempts = 0;
    while (attempts < 10000) {
        attempts++;
        let t = generateCompactTemplate(minWords);
        if (!t) continue;

        let solver = new Solver(t);
        if (solver.solve()) {
            // Reformat grid so null spaces are real spaces ' '
            let finalGrid = solver.grid.map(row => row.map(cell => cell === null ? ' ' : cell));
            return {
                rows: solver.rows,
                cols: solver.cols,
                grid: finalGrid,
                words: Array.from(solver.wordsUsed)
            };
        }
    }
    return null;
}

function generateRegion(grid) {
    let rows = grid.length;
    let cols = grid[0].length;
    let unassigned = [];
    for(let r=0; r<rows; r++) {
        for(let c=0; c<cols; c++) {
            if(grid[r][c] !== ' ') {
                unassigned.push({r,c});
            }
        }
    }

    let regions = [];
    let regionId = 0;

    while(unassigned.length > 0) {
        // Start a new region
        let idx = Math.floor(Math.random() * unassigned.length);
        let seed = unassigned.splice(idx, 1)[0];
        let currentRegion = { id: 'r'+regionId++, cells: [[seed.r, seed.c]], letters: [grid[seed.r][seed.c]] };

        // Grow region
        let targetSize = getRandomInt(2, 5); // Smaller target size forces MORE regions
        let grown = true;

        while(currentRegion.cells.length < targetSize && grown) {
            grown = false;
            // Find adjacent unassigned cells
            let neighbors = [];
            for(let i=0; i<unassigned.length; i++) {
                let cell = unassigned[i];
                for(let rc of currentRegion.cells) {
                    if((Math.abs(rc[0] - cell.r) === 1 && rc[1] === cell.c) ||
                       (Math.abs(rc[1] - cell.c) === 1 && rc[0] === cell.r)) {
                        neighbors.push({idx: i, cell: cell});
                        break;
                    }
                }
            }

            if(neighbors.length > 0) {
                let chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
                unassigned.splice(chosen.idx, 1);
                currentRegion.cells.push([chosen.cell.r, chosen.cell.c]);
                currentRegion.letters.push(grid[chosen.cell.r][chosen.cell.c]);
                grown = true;
            }
        }

        // Sort letters to act as a hint, not the solution order
        currentRegion.letters.sort();
        regions.push(currentRegion);
    }

    // We intentionally leave small regions (sizes 1-2) occasionally for more polyomino variety
    // but we can merge size 1 into another if it's completely isolated
    let consolidated = true;
    while(consolidated) {
        consolidated = false;
        for(let i=0; i<regions.length; i++) {
            if(regions[i].cells.length === 1) { // Only force merge single cells
                // Find adjacent region to merge into
                let merged = false;
                for(let rc of regions[i].cells) {
                    for(let j=0; j<regions.length; j++) {
                        if(i===j) continue;
                        for(let rc2 of regions[j].cells) {
                            if((Math.abs(rc[0] - rc2[0]) === 1 && rc[1] === rc2[1]) ||
                               (Math.abs(rc[1] - rc2[1]) === 1 && rc[0] === rc2[0])) {

                                // Only merge if target region isn't already too big (max 5)
                                if(regions[j].cells.length + regions[i].cells.length <= 5) {
                                    regions[j].cells.push(...regions[i].cells);
                                    regions[j].letters.push(...regions[i].letters);
                                    regions[j].letters.sort();
                                    regions.splice(i, 1);
                                    merged = true;
                                    consolidated = true;
                                    break;
                                }
                            }
                        }
                        if(merged) break;
                    }
                    if(merged) break;
                }
            }
        }
    }

    return regions;
}

const wordClues = require('./word_clues.json');
let trainingData = [];
try {
    trainingData = JSON.parse(fs.readFileSync('puzzle_training_data.json', 'utf8'));
} catch (e) {
    // If it doesn't exist yet, we just proceed.
}

const getPuzzleHash = (p) => JSON.stringify(p.solution) + '_' + JSON.stringify(p.words);

function generateFinalPuzzles(count) {
    let finalBank = [];
    let attempts = 0;

    // We can use training data to avoid generating exactly the same rejected puzzles over and over.
    let rejectedHashes = new Set(trainingData.filter(t => !t.approved).map(t => t.hash));

    while (finalBank.length < count && attempts < count * 100) {
        attempts++;
        let p = generatePuzzleWithRetries(7); // At least 7 words
        if (p) {
            if (rejectedHashes.has(getPuzzleHash(p))) {
                console.log("Skipping a previously rejected puzzle layout/word combination...");
                continue;
            }

            let regions = generateRegion(p.grid);

            // Re-run if we didn't generate enough regions (e.g. less than wordCount - 2)
            if (regions.length < Math.max(4, p.words.length - 2)) {
                continue; // Skip and try again
            }

            let clues = {};
            for(let word of p.words) {
                clues[word] = wordClues[word] || `تلميح للكلمة: ${word}`;
            }

            finalBank.push({
                theme: "ألغاز الكلمات",
                rows: p.rows,
                cols: p.cols,
                solution: p.grid,
                regions: regions,
                clues: clues,
                words: p.words
            });
            console.log(`Generated puzzle ${finalBank.length}/${count}`);
        }
    }
    return finalBank;
}

let gamePuzzles = generateFinalPuzzles(30);

// We need to output this into a JS file format that script.js expects
// script.js currently has hardcoded puzzles = { easy, medium, large }
// We will replace that with an array of levels.

let puzzleJsContent = `const puzzles = ${JSON.stringify(gamePuzzles, null, 2)};\n\n// We need to modify script.js to support an array of puzzles instead of fixed easy/medium/large`;

fs.writeFileSync('generated_puzzles.json', JSON.stringify(gamePuzzles, null, 2));
console.log("30 Puzzles generated and saved to generated_puzzles.json");
