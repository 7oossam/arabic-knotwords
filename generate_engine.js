const fs = require('fs');
const path = require('path');

// Load word bank
const wordBankPath = path.join(__dirname, 'word_bank.json');
const wordBank = JSON.parse(fs.readFileSync(wordBankPath, 'utf8'));

// Helper: shuffle array
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

class CrosswordGenerator {
    constructor(subject, maxRows, maxCols) {
        this.subject = subject;
        this.wordsData = shuffle([...wordBank[subject]]);
        this.maxRows = maxRows;
        this.maxCols = maxCols;
        this.grid = Array.from({ length: maxRows }, () => Array(maxCols).fill(' '));
        this.placedWords = [];
        this.rowCluesMap = {}; // mapping row index to clue string
        this.colCluesMap = {}; // mapping col index to clue string
    }

    canPlaceWord(word, startRow, startCol, isHorizontal) {
        if (startRow < 0 || startCol < 0) return false;

        if (isHorizontal) {
            if (startCol + word.length > this.maxCols) return false;
        } else {
            if (startRow + word.length > this.maxRows) return false;
        }

        let intersects = false;

        for (let i = 0; i < word.length; i++) {
            const r = isHorizontal ? startRow : startRow + i;
            const c = isHorizontal ? startCol + i : startCol;

            const currentCell = this.grid[r][c];

            if (currentCell !== ' ' && currentCell !== word[i]) {
                return false; // Collision
            }

            if (currentCell === word[i]) {
                intersects = true;
            } else {
                // If it's an empty space, ensure we aren't creating invalid adjacent letters.
                // We check adjacent cells strictly perpendicular to the word direction to avoid placing parallel touching words.
                if (isHorizontal) {
                    if (r > 0 && this.grid[r - 1][c] !== ' ') return false;
                    if (r < this.maxRows - 1 && this.grid[r + 1][c] !== ' ') return false;
                } else {
                    if (c > 0 && this.grid[r][c - 1] !== ' ') return false;
                    if (c < this.maxCols - 1 && this.grid[r][c + 1] !== ' ') return false;
                }
            }
        }

        // Check bounds before and after the word to ensure it doesn't touch another word inline
        if (isHorizontal) {
            if (startCol > 0 && this.grid[startRow][startCol - 1] !== ' ') return false;
            if (startCol + word.length < this.maxCols && this.grid[startRow][startCol + word.length] !== ' ') return false;
        } else {
            if (startRow > 0 && this.grid[startRow - 1][startCol] !== ' ') return false;
            if (startRow + word.length < this.maxRows && this.grid[startRow + word.length][startCol] !== ' ') return false;
        }

        return this.placedWords.length === 0 ? true : intersects;
    }

    placeWord(wordObj, startRow, startCol, isHorizontal) {
        const { word, clue } = wordObj;
        for (let i = 0; i < word.length; i++) {
            const r = isHorizontal ? startRow : startRow + i;
            const c = isHorizontal ? startCol + i : startCol;
            this.grid[r][c] = word[i];

            // Note: Since knotwords groups words tightly,
            // assigning clues based on primary direction is enough for now.
            // If overlapping, we'll keep the first assigned clue or merge.
            if (isHorizontal && !this.rowCluesMap[r]) {
                this.rowCluesMap[r] = clue;
            } else if (!isHorizontal && !this.colCluesMap[c]) {
                this.colCluesMap[c] = clue;
            }
        }
        this.placedWords.push({ word, r: startRow, c: startCol, isHorizontal });
    }

    generate() {
        if (this.wordsData.length === 0) return false;

        // Try to place the first word roughly in the middle
        let firstWordObj = null;
        let startRow = Math.floor(this.maxRows / 2);
        let startCol = 0;
        let placedFirst = false;

        // Find a first word that fits
        while (this.wordsData.length > 0 && !placedFirst) {
            firstWordObj = this.wordsData.shift();
            startCol = Math.max(0, Math.floor((this.maxCols - firstWordObj.word.length) / 2));

            if (this.canPlaceWord(firstWordObj.word, startRow, startCol, true)) {
                this.placeWord(firstWordObj, startRow, startCol, true);
                placedFirst = true;
            } else if (this.canPlaceWord(firstWordObj.word, 0, 0, true)) {
                this.placeWord(firstWordObj, 0, 0, true);
                placedFirst = true;
            } else {
                // Return it to the pool in case it fits as an intersecting word later
                this.wordsData.push(firstWordObj);
            }

            // Safety limit in case none fit initially
            if (!placedFirst && this.wordsData.indexOf(firstWordObj) === 0) break;
        }

        if (!placedFirst) return false;

        // Keep trying to place remaining words to build the grid
        let attempts = 0;
        while (attempts < 50 && this.wordsData.length > 0) {
            // We rotate through the words to try fitting as many as possible
            const wordObj = this.wordsData.shift();

            if (this.tryPlaceIntersecting(wordObj)) {
                // If placed, reset attempts and continue, we can potentially place more.
                attempts = 0;
            } else {
                // If we couldn't place it, push it to the back to maybe try later if the grid expands
                this.wordsData.push(wordObj);
                attempts++;
            }

            if (this.placedWords.length >= 6) break; // Arbitrary good amount for a filled puzzle
        }

        return this.placedWords.length >= 2; // Success if we placed at least 2 intersecting words
    }

    tryPlaceIntersecting(wordObj) {
        const { word } = wordObj;

        // Find all possible intersections with already placed letters
        const possiblePlacements = [];

        for (let r = 0; r < this.maxRows; r++) {
            for (let c = 0; c < this.maxCols; c++) {
                if (this.grid[r][c] !== ' ' && word.includes(this.grid[r][c])) {
                    // find matching letter indices in the new word
                    for (let i = 0; i < word.length; i++) {
                        if (word[i] === this.grid[r][c]) {
                            // Try placing horizontally crossing a vertical cell
                            if (this.canPlaceWord(word, r, c - i, true)) {
                                possiblePlacements.push({ r, c: c - i, isHoriz: true });
                            }
                            // Try placing vertically crossing a horizontal cell
                            if (this.canPlaceWord(word, r - i, c, false)) {
                                possiblePlacements.push({ r: r - i, c, isHoriz: false });
                            }
                        }
                    }
                }
            }
        }

        if (possiblePlacements.length > 0) {
            // Pick a random valid placement to keep grids diverse
            const placement = possiblePlacements[Math.floor(Math.random() * possiblePlacements.length)];
            this.placeWord(wordObj, placement.r, placement.c, placement.isHoriz);
            return true;
        }

        return false;
    }

    getSolution() {
        return {
            grid: this.grid,
            rowClues: this.rowCluesMap,
            colClues: this.colCluesMap
        };
    }

    // Polyomino Region Generation
    generateRegions(minSize = 4, maxSize = 6) {
        // Collect all filled cells
        const filledCells = [];
        for (let r = 0; r < this.maxRows; r++) {
            for (let c = 0; c < this.maxCols; c++) {
                if (this.grid[r][c] !== ' ') {
                    filledCells.push([r, c]);
                }
            }
        }

        const regions = [];
        const unassigned = new Set(filledCells.map(([r, c]) => `${r},${c}`));

        // Helper to find adjacent unassigned cells
        const getAdjacent = (r, c) => {
            const adj = [
                [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]
            ];
            return adj.filter(([nr, nc]) => unassigned.has(`${nr},${nc}`));
        };

        let regionIdCounter = 0;

        while (unassigned.size > 0) {
            // Start a new region with a random unassigned cell
            const startStr = Array.from(unassigned)[0];
            const [sr, sc] = startStr.split(',').map(Number);

            const currentRegionCells = [[sr, sc]];
            unassigned.delete(startStr);

            // Target size between minSize and maxSize
            const targetSize = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;

            while (currentRegionCells.length < targetSize) {
                // Find all valid neighbors for current region
                const neighbors = [];
                currentRegionCells.forEach(([cr, cc]) => {
                    neighbors.push(...getAdjacent(cr, cc));
                });

                if (neighbors.length === 0) break; // Trapped, finish region early

                // Pick a random neighbor to grow the polyomino
                const nextCell = neighbors[Math.floor(Math.random() * neighbors.length)];
                currentRegionCells.push(nextCell);
                unassigned.delete(`${nextCell[0]},${nextCell[1]}`);
            }

            // Record region
            regions.push({
                id: `r${regionIdCounter++}`,
                cells: currentRegionCells,
                letters: currentRegionCells.map(([r, c]) => this.grid[r][c]).sort(() => Math.random() - 0.5) // Shuffle letters for the player
            });
        }

        // Fix tiny leftover regions (size < minSize) by merging them with adjacent regions if possible
        let consolidated = true;
        while (consolidated) {
            consolidated = false;
            for (let i = 0; i < regions.length; i++) {
                if (regions[i].cells.length < minSize) {
                    const smallRegion = regions[i];

                    // Find an adjacent region to merge into
                    let merged = false;
                    for (const [r, c] of smallRegion.cells) {
                        const adj = [[r-1, c], [r+1, c], [r, c-1], [r, c+1]];
                        for (const [nr, nc] of adj) {
                            const adjRegion = regions.find(reg => reg.id !== smallRegion.id && reg.cells.some(([rr, cc]) => rr === nr && cc === nc));
                            if (adjRegion && adjRegion.cells.length < maxSize + 2) { // allowable flex for merging
                                adjRegion.cells.push(...smallRegion.cells);
                                adjRegion.letters.push(...smallRegion.letters);
                                adjRegion.letters.sort(() => Math.random() - 0.5); // reshuffle
                                regions.splice(i, 1);
                                merged = true;
                                consolidated = true;
                                break;
                            }
                        }
                        if (merged) break;
                    }
                }
            }
        }

        return regions;
    }
}

// Format output to match game's expected JSON
function generateGamePuzzle(subject, rows, cols) {
    const gen = new CrosswordGenerator(subject, rows, cols);
    const success = gen.generate();

    if (!success) {
        return null;
    }

    const solutionData = gen.getSolution();
    const regions = gen.generateRegions(4, 6);

    // Convert clue maps to arrays matching the row/col index
    const rowClues = Array(rows).fill(null);
    for (const [r, clue] of Object.entries(solutionData.rowClues)) {
        rowClues[r] = clue;
    }

    const colClues = Array(cols).fill(null);
    for (const [c, clue] of Object.entries(solutionData.colClues)) {
        colClues[c] = clue;
    }

    return {
        theme: subject,
        rows: rows,
        cols: cols,
        solution: solutionData.grid,
        rowClues: rowClues,
        colClues: colClues,
        regions: regions
    };
}

// Generate an easy, medium, and large puzzle
const subjects = Object.keys(wordBank);

// Use a while loop to ensure we always get a valid generated puzzle, since random generation can occasionally fail
function getValidPuzzle(subject, rows, cols) {
    let puzzle = null;
    let attempts = 0;
    while (!puzzle && attempts < 100) {
        puzzle = generateGamePuzzle(subject, rows, cols);
        attempts++;
    }
    return puzzle;
}

const newPuzzles = {
    easy: getValidPuzzle(subjects[0], 4, 4),
    medium: getValidPuzzle(subjects[1], 5, 5),
    large: getValidPuzzle(subjects[2], 6, 6)
};

console.log(JSON.stringify(newPuzzles, null, 2));
