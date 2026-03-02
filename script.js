const puzzles = {
    easy: {
        theme: "الحياة اليومية", rows: 4, cols: 4,
        solution: [['ع', 'م', 'ا', 'ل'], ['ل', 'ع', 'ب', 'ه'], ['ي', 'ن', 'ا', 'م'], ['م', 'ى', 'ت', 'ا']],
        regions: [
            { id: 'r0', cells: [[0,0], [0,1], [1,0]], letters: ['ع', 'م', 'ل'] },
            { id: 'r1', cells: [[0,2], [0,3], [1,2], [1,3]], letters: ['ا', 'ل', 'ب', 'ه'] },
            { id: 'r2', cells: [[1,1], [2,1], [3,1]], letters: ['ع', 'ن', 'ى'] },
            { id: 'r3', cells: [[2,0], [3,0]], letters: ['ي', 'م'] },
            { id: 'r4', cells: [[2,2], [2,3], [3,2], [3,3]], letters: ['ا', 'م', 'ت', 'ا'] }
        ]
    },
    medium: {
        theme: "شخصيات وصفات", rows: 5, cols: 5,
        solution: [['م', 'ك', 'ت', 'و', 'ب'], ['ح', 'ا', 'ر', 'س', 'ه'], ['م', 'ح', 'ب', 'و', 'ب'], ['د', 'ا', 'خ', 'ل', 'ي'], ['س', 'ي', 'ر', 'ت', 'ه']],
        regions: [
            { id: 'r0', cells: [[0,0], [0,1], [1,0], [2,0]], letters: ['م', 'ك', 'ح', 'م'] },
            { id: 'r1', cells: [[0,2], [0,3], [0,4], [1,4]], letters: ['ت', 'و', 'ب', 'ه'] },
            { id: 'r2', cells: [[1,1], [1,2], [1,3]], letters: ['ا', 'ر', 'س'] },
            { id: 'r3', cells: [[2,1], [2,2], [3,2], [4,2]], letters: ['ح', 'ب', 'خ', 'ر'] },
            { id: 'r4', cells: [[3,0], [3,1], [4,0], [4,1]], letters: ['د', 'ا', 'س', 'ي'] },
            { id: 'r5', cells: [[2,3], [2,4], [3,3], [3,4]], letters: ['و', 'ب', 'ل', 'ي'] },
            { id: 'r6', cells: [[4,3], [4,4]], letters: ['ت', 'ه'] }
        ]
    },
    large: {
        theme: "التكنولوجيا والبرمجة", rows: 6, cols: 6,
        solution: [['م', 'س', 'ت', 'ق', 'ب', 'ل'], ['ت', 'ع', 'ل', 'ي', 'م', 'ي'], ['ب', 'ر', 'ن', 'ا', 'م', 'ج'], ['ح', 'ا', 'س', 'و', 'ب', 'ي'], ['ت', 'ط', 'ب', 'ي', 'ق', 'ي'], ['م', 'ب', 'ر', 'م', 'ج', 'ي']],
        regions: [
            { id: 'r0', cells: [[0,0], [0,1], [1,0], [1,1], [2,0]], letters: ['م', 'س', 'ت', 'ع', 'ب'] },
            { id: 'r1', cells: [[0,2], [0,3], [1,2], [1,3]], letters: ['ت', 'ق', 'ل', 'ي'] },
            { id: 'r2', cells: [[0,4], [0,5], [1,4], [1,5]], letters: ['ب', 'ل', 'م', 'ي'] },
            { id: 'r3', cells: [[2,1], [2,2], [3,1], [3,2], [4,1]], letters: ['ر', 'ن', 'ا', 'س', 'ط'] },
            { id: 'r4', cells: [[2,3], [2,4], [2,5]], letters: ['ا', 'م', 'ج'] },
            { id: 'r5', cells: [[3,0], [4,0], [5,0], [5,1]], letters: ['ح', 'ت', 'م', 'ب'] },
            { id: 'r6', cells: [[3,3], [3,4], [3,5]], letters: ['و', 'ب', 'ي'] },
            { id: 'r7', cells: [[4,2], [4,3], [5,2], [5,3]], letters: ['ب', 'ي', 'ر', 'م'] },
            { id: 'r8', cells: [[4,4], [4,5], [5,4], [5,5]], letters: ['ق', 'ي', 'ج', 'ي'] }
        ]
    }
};

let currentPuzzle = null;
let mistakesLeft = 5;
let maxMistakes = 5;
let floorLevel = 1;
let gridState = [];
let selectedCell = null;
let playerRelics = [];
let chiselActive = false;
let chiselUses = 0;

const availableRelics = [
    { id: 'extra_heart', title: 'قلب إضافي', desc: 'استعد خطأ واحد فورا', type: 'passive' },
    { id: 'iron_resolve', title: 'عزيمة حديدية', desc: 'زيادة الحد الأقصى للأخطاء بمقدار ١', type: 'passive' },
    { id: 'the_chisel', title: 'الإزميل', desc: 'مرة واحدة في كل لغز: قم بتقسيم منطقة كبيرة إلى قسمين', type: 'active' }
];

document.addEventListener("DOMContentLoaded", () => {
    setupNextButton();
    setupSubmitButton();
    setupRestartButton();
    updateStatsUI();
    loadPuzzleForCurrentFloor();
});

function updateStatsUI() {
    document.getElementById('floor-level').innerText = floorLevel;
    document.getElementById('hearts-text').innerText = '❤️'.repeat(mistakesLeft) + '🖤'.repeat(maxMistakes - mistakesLeft);
}

function updateActiveRelicsUI() {
    const container = document.getElementById('active-relics-container');
    const activeRelics = playerRelics.filter(r => availableRelics.find(ar => ar.id === r).type === 'active');

    if (activeRelics.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';
    container.innerHTML = '';

    if (activeRelics.includes('the_chisel')) {
        const btn = document.createElement('button');
        btn.className = 'relic-btn';
        btn.innerText = `استخدام الإزميل (${1 - chiselUses}/1)`;
        btn.disabled = chiselUses >= 1 || chiselActive;
        btn.addEventListener('click', () => {
            if (chiselUses < 1) {
                chiselActive = true;
                btn.innerText = 'اختر منطقة للتقسيم...';
                btn.disabled = true;
                document.getElementById('region-letters').innerText = 'اختر منطقة تحتوي على ٤ خلايا أو أكثر لتقسيمها';
            }
        });
        container.appendChild(btn);
    }
}

function setupSubmitButton() {
    document.getElementById('btn-submit').addEventListener('click', () => {
        validateSubmission();
    });
}

function setupRestartButton() {
    document.getElementById('btn-restart').addEventListener('click', () => {
        document.getElementById('game-over-overlay').classList.remove('visible');
        mistakesLeft = 5;
        maxMistakes = 5;
        floorLevel = 1;
        playerRelics = [];
        updateStatsUI();
        loadPuzzleForCurrentFloor();
    });
}

function showDraftPhase() {
    const overlay = document.getElementById('draft-overlay');
    const choicesContainer = document.getElementById('draft-choices');
    choicesContainer.innerHTML = '';

    // Pick 3 random relics (for now just showing all available if <= 3)
    let options = [...availableRelics].sort(() => 0.5 - Math.random()).slice(0, 3);

    options.forEach(relic => {
        const btn = document.createElement('button');
        btn.className = 'draft-btn';
        btn.innerHTML = `<span class="draft-title">${relic.title}</span><span class="draft-desc">${relic.desc}</span>`;
        btn.addEventListener('click', () => {
            applyRelic(relic);
            overlay.classList.remove('visible');
            loadPuzzleForCurrentFloor();
        });
        choicesContainer.appendChild(btn);
    });

    overlay.classList.add('visible');
}

function applyRelic(relic) {
    if (!playerRelics.includes(relic.id)) playerRelics.push(relic.id);

    if (relic.id === 'extra_heart') {
        mistakesLeft = Math.min(mistakesLeft + 1, maxMistakes);
    } else if (relic.id === 'iron_resolve') {
        maxMistakes += 1;
        mistakesLeft += 1;
    }
    updateStatsUI();
}

function loadPuzzleForCurrentFloor() {
    const puzzleSequence = ['easy', 'medium', 'large'];
    const difficultyIdx = (floorLevel - 1) % puzzleSequence.length;
    const difficulty = puzzleSequence[difficultyIdx];
    loadPuzzle(difficulty);
}

function loadPuzzle(difficulty) {
    // deep clone to avoid mutating original templates
    currentPuzzle = JSON.parse(JSON.stringify(puzzles[difficulty]));
    gridState = Array.from({ length: currentPuzzle.rows }, () => Array(currentPuzzle.cols).fill(''));
    selectedCell = null;
    chiselActive = false;
    chiselUses = 0;
    const themeText = document.getElementById('theme-text');
    if (themeText) themeText.innerText = currentPuzzle.theme || "عام";
    renderBoard();
    updateKeyboard();
    updateActiveRelicsUI();
}

function renderBoard() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    board.style.gridTemplateColumns = `repeat(${currentPuzzle.cols}, 60px)`;
    board.style.gridTemplateRows = `repeat(${currentPuzzle.rows}, 60px)`;

    const cellToRegion = {};
    currentPuzzle.regions.forEach(region => {
        region.cells.forEach(([r, c]) => cellToRegion[`${r},${c}`] = region);
    });

    for (let r = 0; r < currentPuzzle.rows; r++) {
        for (let c = 0; c < currentPuzzle.cols; c++) {
            const cellDiv = document.createElement('div');
            cellDiv.className = 'cell';
            cellDiv.dataset.row = r;
            cellDiv.dataset.col = c;

            const region = cellToRegion[`${r},${c}`];
            if (region) {
                if (r === 0 || cellToRegion[`${r-1},${c}`] !== region) cellDiv.classList.add('border-top-thick');
                if (r === currentPuzzle.rows - 1 || cellToRegion[`${r+1},${c}`] !== region) cellDiv.classList.add('border-bottom-thick');
                if (c === 0 || cellToRegion[`${r},${c-1}`] !== region) cellDiv.classList.add('border-right-thick');
                if (c === currentPuzzle.cols - 1 || cellToRegion[`${r},${c+1}`] !== region) cellDiv.classList.add('border-left-thick');

                if (region.cells[0][0] === r && region.cells[0][1] === c) {
                    const hintDiv = document.createElement('div');
                    hintDiv.className = 'region-hint';
                    hintDiv.innerText = [...region.letters].join(' ');
                    cellDiv.appendChild(hintDiv);
                }
            }

            const textSpan = document.createElement('span');
            textSpan.className = 'letter-content';
            textSpan.innerText = gridState[r][c];
            cellDiv.appendChild(textSpan);
            cellDiv.addEventListener('click', () => selectCell(r, c));
            board.appendChild(cellDiv);
        }
    }
}

function selectCell(r, c) {
    if (chiselActive) {
        const region = getRegionForCell(r, c);
        if (region && region.cells.length >= 4) {
            applyChisel(region);
        } else {
            document.getElementById('region-letters').innerText = 'هذه المنطقة صغيرة جداً للتقسيم!';
            setTimeout(() => {
                chiselActive = false;
                updateActiveRelicsUI();
                updateKeyboard();
            }, 1500);
        }
        return;
    }
    selectedCell = { r, c };
    renderBoardSelections();
    updateKeyboard();
}

function applyChisel(region) {
    chiselActive = false;
    chiselUses++;

    // Split logic: take roughly half the cells for the new region
    const splitIndex = Math.floor(region.cells.length / 2);
    const newCells = region.cells.splice(splitIndex);

    // Split the letters accordingly (simplistic approach: just take matching letters from solution)
    const originalLetters = [];
    region.cells.forEach(([r, c]) => originalLetters.push(currentPuzzle.solution[r][c]));
    region.letters = originalLetters;

    const newLetters = [];
    newCells.forEach(([r, c]) => newLetters.push(currentPuzzle.solution[r][c]));

    // Shuffle the letters so the hint is scrambled
    region.letters.sort(() => Math.random() - 0.5);
    newLetters.sort(() => Math.random() - 0.5);

    const newRegion = {
        id: region.id + '_split',
        cells: newCells,
        letters: newLetters
    };

    currentPuzzle.regions.push(newRegion);

    renderBoard();
    updateActiveRelicsUI();
    selectedCell = null;
    updateKeyboard();
}

function renderBoardSelections() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => cell.classList.remove('selected', 'selected-region'));

    if (!selectedCell) return;
    const region = getRegionForCell(selectedCell.r, selectedCell.c);

    cells.forEach(cell => {
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        if (region && region.cells.some(pos => pos[0] === r && pos[1] === c)) cell.classList.add('selected-region');
        if (r === selectedCell.r && c === selectedCell.c) cell.classList.add('selected');
    });
}

function getRegionForCell(r, c) {
    return currentPuzzle.regions.find(reg => reg.cells.some(pos => pos[0] === r && pos[1] === c));
}

function updateKeyboard() {
    const keyboardContainer = document.getElementById('keyboard');
    const regionText = document.getElementById('region-letters');
    keyboardContainer.innerHTML = '';

    if (!selectedCell) {
        regionText.innerText = 'الرجاء اختيار منطقة';
        return;
    }

    const region = getRegionForCell(selectedCell.r, selectedCell.c);
    if (!region) return;

    const letterCounts = {};
    region.letters.forEach(l => letterCounts[l] = (letterCounts[l] || 0) + 1);

    region.cells.forEach(([r, c]) => {
        const char = gridState[r][c];
        if (char && letterCounts[char] > 0) letterCounts[char]--;
    });

    regionText.innerText = 'الحروف المتاحة:';
    const uniqueLetters = [...new Set(region.letters)];

    uniqueLetters.forEach(letter => {
        const btn = document.createElement('button');
        btn.className = 'key';
        btn.innerText = letter;
        if (letterCounts[letter] <= 0) {
            btn.classList.add('used');
            btn.disabled = true;
        }
        btn.addEventListener('click', () => handleKeyPress(letter));
        keyboardContainer.appendChild(btn);
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'key delete';
    delBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg>';
    delBtn.addEventListener('click', () => handleKeyPress('Backspace'));
    keyboardContainer.appendChild(delBtn);
}

function handleKeyPress(key) {
    if (!selectedCell) return;
    if (key === 'Backspace') {
        gridState[selectedCell.r][selectedCell.c] = '';
    } else {
        gridState[selectedCell.r][selectedCell.c] = key;
        advanceSelection();
    }
    updateBoardUI();
    updateKeyboard();
    checkIfBoardIsFull();
}

function checkIfBoardIsFull() {
    let isComplete = true;
    for (let r = 0; r < currentPuzzle.rows; r++) {
        for (let c = 0; c < currentPuzzle.cols; c++) {
            if (gridState[r][c] === '') {
                isComplete = false;
                break;
            }
        }
    }
    const submitBtn = document.getElementById('btn-submit');
    submitBtn.disabled = !isComplete;
    if (!isComplete) {
        document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('error'));
    }
}

function validateSubmission() {
    let isCorrect = true;
    for (let r = 0; r < currentPuzzle.rows; r++) {
        for (let c = 0; c < currentPuzzle.cols; c++) {
            if (gridState[r][c] !== currentPuzzle.solution[r][c]) {
                isCorrect = false;
                break;
            }
        }
    }

    if (isCorrect) {
        document.getElementById('win-overlay').classList.add('visible');
    } else {
        mistakesLeft--;
        updateStatsUI();
        checkRegionsForErrors();

        if (mistakesLeft <= 0) {
            document.getElementById('final-floor-text').innerText = `وصلت إلى الطابق: ${floorLevel}`;
            document.getElementById('game-over-overlay').classList.add('visible');
        }
    }
}

function checkRegionsForErrors() {
    document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('error'));
    currentPuzzle.regions.forEach(region => {
        let isRegionFilled = true, isRegionCorrect = true;
        region.cells.forEach(([r, c]) => {
            if (gridState[r][c] === '') isRegionFilled = false;
            else if (gridState[r][c] !== currentPuzzle.solution[r][c]) isRegionCorrect = false;
        });
        if (isRegionFilled && !isRegionCorrect) {
            region.cells.forEach(([r, c]) => {
                const domCell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
                if (domCell) domCell.classList.add('error');
            });
        }
    });
}

function setupNextButton() {
    document.getElementById('btn-next').addEventListener('click', () => {
        document.getElementById('win-overlay').classList.remove('visible');
        floorLevel++;
        updateStatsUI();

        if (floorLevel % 3 === 0) {
            showDraftPhase();
        } else {
            loadPuzzleForCurrentFloor();
        }
    });
}

function advanceSelection() {
    if (!selectedCell) return;
    const region = getRegionForCell(selectedCell.r, selectedCell.c);
    if (!region) return;

    let currentIndex = region.cells.findIndex(([r, c]) => r === selectedCell.r && c === selectedCell.c);
    for (let i = 1; i < region.cells.length; i++) {
        const [nr, nc] = region.cells[(currentIndex + i) % region.cells.length];
        if (gridState[nr][nc] === '') {
            selectCell(nr, nc);
            return;
        }
    }
    for (let r = 0; r < currentPuzzle.rows; r++) {
        for (let c = 0; c < currentPuzzle.cols; c++) {
            if (gridState[r][c] === '') {
                selectCell(r, c);
                return;
            }
        }
    }
}

function updateBoardUI() {
    document.querySelectorAll('.cell').forEach(cell => {
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        const textSpan = cell.querySelector('.letter-content');
        if (textSpan) textSpan.innerText = gridState[r][c];
    });
}
