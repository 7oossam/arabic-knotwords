const puzzles = {
    easy: {
        theme: "فواكه", rows: 3, cols: 4,
        solution: [
            ['ت', 'و', 'ت', ' '],
            ['و', ' ', ' ', ' '],
            ['ت', 'ف', 'ا', 'ح']
        ],
        rowClues: ["فاكهة صيفية حلوة المذاق وحباتها صغيرة", "", "ثمرة دائرية من أشهر الفواكه وأكثرها فائدة"],
        colClues: ["فاكهة صيفية حلوة المذاق وحباتها صغيرة", "", "", ""],
        regions: [
            { id: 'r0', cells: [[0,0], [1,0], [2,0]], letters: ['ت', 'و', 'ت'] },
            { id: 'r1', cells: [[0,1], [0,2], [2,1], [2,2], [2,3]], letters: ['و', 'ت', 'ف', 'ا', 'ح'] }
        ]
    },
    medium: {
        theme: "ألوان", rows: 4, cols: 6,
        solution: [
            ['ا', 'ص', 'ف', 'ر', ' ', 'ا'],
            ['ب', ' ', ' ', ' ', ' ', 'ح'],
            ['ي', ' ', ' ', ' ', ' ', 'م'],
            ['ض', ' ', 'ا', 'خ', 'ض', 'ر']
        ],
        rowClues: ["لون الشمس والذهب", "", "", "لون النباتات والأشجار"],
        colClues: ["لون الثلج والغيوم الصافية", "", "", "", "", "لون الدم والنار"],
        regions: [
            { id: 'r0', cells: [[0,0], [1,0], [2,0], [3,0]], letters: ['ا', 'ب', 'ي', 'ض'] },
            { id: 'r1', cells: [[0,1], [0,2], [0,3]], letters: ['ص', 'ف', 'ر'] },
            { id: 'r2', cells: [[3,2], [3,3], [3,4], [3,5]], letters: ['ا', 'خ', 'ض', 'ر'] },
            { id: 'r3', cells: [[0,5], [1,5], [2,5]], letters: ['ا', 'ح', 'م'] }
        ]
    },
    large: {
        theme: "حيوانات", rows: 10, cols: 7,
        solution: [
            ['ع', ' ', ' ', ' ', ' ', ' ', ' '],
            ['ن', ' ', ' ', ' ', ' ', ' ', ' '],
            ['ك', ' ', ' ', ' ', ' ', ' ', ' '],
            ['ب', ' ', ' ', ' ', ' ', ' ', ' '],
            ['و', ' ', ' ', ' ', ' ', ' ', ' '],
            ['ت', 'م', 'س', 'ا', 'ح', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', 'د', ' ', ' ', ' ', ' '],
            [' ', ' ', 'ل', ' ', ' ', ' ', ' '],
            [' ', 'س', 'ل', 'ح', 'ف', 'ا', 'ة']
        ],
        rowClues: ["", "", "", "", "", "زاحف مائي ضخم ذو فكين قويين", "", "", "", "زاحف بطيء يتميز بصدفة صلبة"],
        colClues: ["من الحشرات المشهورة بنسج الشباك", "", "حيوان بحري ذكي ومحبوب", "", "", "", ""],
        regions: [
            { id: 'r0', cells: [[0,0], [1,0], [2,0], [3,0], [4,0]], letters: ['ع', 'ن', 'ك', 'ب', 'و'] },
            { id: 'r1', cells: [[5,0], [5,1], [5,2], [5,3], [5,4]], letters: ['ت', 'م', 'س', 'ا', 'ح'] },
            { id: 'r2', cells: [[7,2], [8,2], [9,2]], letters: ['د', 'ل', 'ل'] },
            { id: 'r3', cells: [[9,1], [9,3], [9,4], [9,5], [9,6]], letters: ['س', 'ح', 'ف', 'ا', 'ة'] }
        ]
    }
};

let currentPuzzle = null;
let mistakesLeft = 5;
let maxMistakes = 5;
let floorLevel = 1;
let gridState = [];
let selectedCell = null;let playerRelics = [];
let chiselActive = false;
let chiselUses = 0;
let hintsLeft = 3;
let hintModeActive = false;
let revealedHints = { row: [], col: [] };

const availableRelics = [
    { id: 'extra_heart', title: 'قلب إضافي', desc: 'استعد خطأ واحد فورا', type: 'passive' },
    { id: 'iron_resolve', title: 'عزيمة حديدية', desc: 'زيادة الحد الأقصى للأخطاء بمقدار ١', type: 'passive' },
    { id: 'the_chisel', title: 'الإزميل', desc: 'مرة واحدة في كل لغز: قم بتقسيم منطقة كبيرة إلى قسمين', type: 'active' }
];

document.addEventListener("DOMContentLoaded", () => {
    setupNextButton();
    setupSubmitButton();
    setupRestartButton();
    setupHintButton();
    updateStatsUI();
    loadPuzzleForCurrentFloor();
});

function setupHintButton() {
    const hintBtn = document.getElementById('btn-hint');
    hintBtn.addEventListener('click', () => {
        if (hintsLeft > 0 && !hintModeActive) {
            hintModeActive = true;
            hintBtn.classList.add('active');
            document.getElementById('region-letters').innerText = 'اختر خلية لإظهار تلميحات الصف والعمود';

            // clear active selections
            selectedCell = null;
            renderBoardSelections();
            updateKeyboard();
        } else if (hintModeActive) {
            // Cancel hint mode
            hintModeActive = false;
            hintBtn.classList.remove('active');
            document.querySelectorAll('.hint-arrow').forEach(el => el.remove());
            document.getElementById('region-letters').innerText = 'الرجاء اختيار منطقة';
            updateKeyboard();
        }
    });
}

function updateStatsUI() {
    document.getElementById('floor-level').innerText = floorLevel;
    document.getElementById('hearts-text').innerText = '❤️'.repeat(mistakesLeft) + '🖤'.repeat(maxMistakes - mistakesLeft);
    const hintBtn = document.getElementById('btn-hint');
    document.getElementById('hints-left').innerText = hintsLeft;
    hintBtn.disabled = hintsLeft <= 0;
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
        hintsLeft = 3;
        hintModeActive = false;
        revealedHints = { row: [], col: [] };
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
    document.getElementById('clue-display').style.display = 'none';

    // clear hint mode if active
    hintModeActive = false;
    document.getElementById('btn-hint').classList.remove('active');
    revealedHints = { row: [], col: [] };

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

            if (currentPuzzle.solution[r][c] === ' ') {
                cellDiv.classList.add('empty');
                gridState[r][c] = ' '; // auto-fill empty cells to avoid breaking check logic
                board.appendChild(cellDiv);
                continue;
            }

            const region = cellToRegion[`${r},${c}`];
            if (region) {
                if (r === 0 || cellToRegion[`${r-1},${c}`] !== region || currentPuzzle.solution[r-1]?.[c] === ' ') cellDiv.classList.add('border-top-thick');
                if (r === currentPuzzle.rows - 1 || cellToRegion[`${r+1},${c}`] !== region || currentPuzzle.solution[r+1]?.[c] === ' ') cellDiv.classList.add('border-bottom-thick');
                if (c === 0 || cellToRegion[`${r},${c-1}`] !== region || currentPuzzle.solution[r][c-1] === ' ') cellDiv.classList.add('border-right-thick');
                if (c === currentPuzzle.cols - 1 || cellToRegion[`${r},${c+1}`] !== region || currentPuzzle.solution[r][c+1] === ' ') cellDiv.classList.add('border-left-thick');

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

    if (hintModeActive) {
        showHintArrowsForCell(r, c);
        return;
    }

    selectedCell = { r, c };
    renderBoardSelections();
    updateKeyboard();
}

function showHintArrowsForCell(r, c) {
    // Remove old arrows
    document.querySelectorAll('.hint-arrow').forEach(el => el.remove());

    const targetCell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
    if (!targetCell) return;

    const rowArrow = document.createElement('div');
    rowArrow.className = 'hint-arrow row-arrow';
    rowArrow.innerText = '⬅️';
    rowArrow.addEventListener('click', (e) => {
        e.stopPropagation();
        revealHint('row', r);
    });

    const colArrow = document.createElement('div');
    colArrow.className = 'hint-arrow col-arrow';
    colArrow.innerText = '⬇️';
    colArrow.addEventListener('click', (e) => {
        e.stopPropagation();
        revealHint('col', c);
    });

    targetCell.appendChild(rowArrow);
    targetCell.appendChild(colArrow);
}


function revealHint(type, index) {
    const isAlreadyRevealed = revealedHints[type].includes(index);
    if (!isAlreadyRevealed && hintsLeft <= 0) return;

    if (!isAlreadyRevealed) {
        hintsLeft--;
        revealedHints[type].push(index);
    }

    hintModeActive = false;
    document.getElementById('btn-hint').classList.remove('active');
    updateStatsUI();


    // Remove all arrows
    document.querySelectorAll('.hint-arrow').forEach(el => el.remove());

    const clueContainer = document.getElementById('clue-display');
    const clueTextSpan = document.getElementById('clue-text');

    let label = '';
    let clueStr = '';

    if (type === 'row') {
        label = `الصف ${index + 1}`;
        clueStr = currentPuzzle.rowClues ? currentPuzzle.rowClues[index] : 'لا يوجد تلميح مسجل لهذا الصف.';
    } else {
        label = `العمود ${index + 1}`;
        clueStr = currentPuzzle.colClues ? currentPuzzle.colClues[index] : 'لا يوجد تلميح مسجل لهذا العمود.';
    }

    clueTextSpan.innerHTML = `<strong>تلميح ${label}:</strong> ${clueStr}`;
    clueContainer.style.display = 'block';

    // Select the cell back normally and update UI
    if (selectedCell) {
        updateKeyboard();
    } else {
        document.getElementById('region-letters').innerText = 'الرجاء اختيار منطقة';
    }
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
        if (!hintModeActive && !chiselActive) {
            regionText.innerText = 'الرجاء اختيار منطقة';
        }
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
        hintsLeft = 3;
        hintModeActive = false;
        revealedHints = { row: [], col: [] };
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
