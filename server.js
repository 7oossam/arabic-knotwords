const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

const TRAINING_FILE = 'puzzle_training_data.json';
const GENERATED_PUZZLES_FILE = 'generated_puzzles.json';

// Ensure training file exists
if (!fs.existsSync(TRAINING_FILE)) {
    fs.writeFileSync(TRAINING_FILE, JSON.stringify([]));
}

// Get the next puzzle to judge
app.get('/next-puzzle', (req, res) => {
    try {
        const trainingData = JSON.parse(fs.readFileSync(TRAINING_FILE, 'utf8'));
        const allPuzzles = JSON.parse(fs.readFileSync(GENERATED_PUZZLES_FILE, 'utf8'));

        // A simple way to generate a hash to identify puzzles
        const getPuzzleHash = (p) => JSON.stringify(p.solution) + '_' + JSON.stringify(p.words);

        const judgedHashes = new Set(trainingData.map(d => d.hash));

        // Find a puzzle that hasn't been judged yet
        let nextPuzzle = allPuzzles.find(p => !judgedHashes.has(getPuzzleHash(p)));

        if (!nextPuzzle) {
            return res.json({ done: true, message: "No more unjudged puzzles in generated_puzzles.json!" });
        }

        res.json({ done: false, puzzle: nextPuzzle, hash: getPuzzleHash(nextPuzzle) });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Save a judgment
app.post('/judge', (req, res) => {
    try {
        const { hash, puzzle, approved, notes } = req.body;

        let trainingData = JSON.parse(fs.readFileSync(TRAINING_FILE, 'utf8'));

        trainingData.push({
            hash,
            puzzle,
            approved,
            notes,
            timestamp: new Date().toISOString()
        });

        fs.writeFileSync(TRAINING_FILE, JSON.stringify(trainingData, null, 2));

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Judging tool running at http://localhost:${PORT}/judge.html`);
});
