const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/batsmen_images', express.static(path.join(__dirname, 'batsmen_images')));
app.use('/bowlers_images', express.static(path.join(__dirname, 'bowlers_images')));

// Load batsmen and bowler stats from CSV
let batsmenStats = [];
let bowlerStats = [];

// Load Batsmen CSV
// Function to sanitize player names for image paths
function sanitizePlayerName(name) {
  return name
    .split(' (')[0] // Remove everything in parentheses and the parentheses
    .trim() // Remove leading and trailing spaces
    .replace(/[^\w\s]/g, '') // Remove non-alphanumeric characters except spaces
    .replace(/\s+/g, '_'); // Replace spaces with underscores
}

// Example of usage in CSV parsing
fs.createReadStream('batsman_data.csv')
  .pipe(csv())
  .on('data', (row) => {
    if (row.Player && typeof row.Player === 'string') {
      const playerName = sanitizePlayerName(row.Player);
      batsmenStats.push({ ...row, Player: playerName });
    }
  })
  .on('end', () => {
    console.log('Batsmen CSV file successfully processed');
  })
  .on('error', (error) => {
    console.error('Error reading batsmen CSV file:', error.message);
  });

fs.createReadStream('bowler_data.csv')
  .pipe(csv())
  .on('data', (row) => {
    if (row.Player && typeof row.Player === 'string') {
      const playerName = sanitizePlayerName(row.Player);
      bowlerStats.push({ ...row, Player: playerName });
    }
  })
  .on('end', () => {
    console.log('Bowler CSV file successfully processed');
  })
  .on('error', (error) => {
    console.error('Error reading bowler CSV file:', error.message);
  });

// Function to select two random players
function getTwoRandomPlayers(playerStats) {
  if (playerStats.length < 2) {
    throw new Error('Not enough players in stats');
  }
  const shuffled = playerStats.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 2);
}

// Function to sanitize player names for image paths
// function sanitizePlayerName(name) {
//   return name.replace(/[^\w\s]/g, '').replace(/\s+/g, '_');
// }

// Generate random questions for different stats
function generateRandomQuestions(playerStats, type) {
  const questions = [];

  for (let i = 0; i < 10; i++) {
    const [player1, player2] = getTwoRandomPlayers(playerStats);

    // Randomly choose stat type for comparison
    let questionText, correctAnswer, statType;

    if (type === 'batsmen') {
      statType = Math.random() > 0.5 ? 'Runs' : 'Average'; 
      if (statType === 'Runs') {
        questionText = `Who has scored more runs: ${player1.Player} or ${player2.Player}?`;
        correctAnswer = player1.Runs > player2.Runs ? player1.Player : player2.Player;
      } else {
        questionText = `Who has a better average: ${player1.Player} or ${player2.Player}?`;
        correctAnswer = player1.Ave > player2.Ave ? player1.Player : player2.Player;
      }
    } else if (type === 'bowlers') {
      statType = Math.random() > 0.5 ? 'Wickets' : 'Economy Rate';
      if (statType === 'Wickets') {
        questionText = `Who has taken more wickets: ${player1.Player} or ${player2.Player}?`;
        correctAnswer = player1.Wkts > player2.Wkts ? player1.Player : player2.Player;
      } else {
        questionText = `Who has a better economy rate: ${player1.Player} or ${player2.Player}?`;
        correctAnswer = player1.Econ < player2.Econ ? player1.Player : player2.Player;
      }
    }

    // Use correct image folder for either batsmen or bowlers
    const imageFolder = type === 'batsmen' ? '/batsmen_images/' : '/bowlers_images/';

    questions.push({
      text: questionText,
      options: [
        { label: player1.Player, isCorrect: player1.Player === correctAnswer, image: `${imageFolder}${sanitizePlayerName(player1.Player)}.jpg` },
        { label: player2.Player, isCorrect: player2.Player === correctAnswer, image: `${imageFolder}${sanitizePlayerName(player2.Player)}.jpg` }
      ],
      correctStats: type === 'batsmen'
        ? `${player1.Player}: ${player1.Runs} runs, ${player1.Ave} avg | ${player2.Player}: ${player2.Runs} runs, ${player2.Ave} avg`
        : `${player1.Player}: ${player1.Wkts} wickets, ${player1.Econ} econ | ${player2.Player}: ${player2.Wkts} wickets, ${player2.Econ} econ`
    });
  }

  return questions;
}

// Endpoint to serve a quiz based on player type (batsmen or bowlers)
app.get('/quiz/:type', (req, res) => {
  const { type } = req.params;
  let playerData;

  if (type === 'batsmen') {
    playerData = batsmenStats;
  } else if (type === 'bowlers') {
    playerData = bowlerStats;
  } else {
    return res.status(400).json({ error: 'Invalid quiz type' });
  }

  // Generate 10 random questions with the respective image folder
  const questions = generateRandomQuestions(playerData, type);
  res.json(questions);
});

// Route to serve player images based on type (batsmen or bowlers)
app.get('/images/:type/:player_name.jpg', (req, res) => {
  const { type, player_name } = req.params;

  // Sanitize player name to match image file format
  const sanitizedPlayerName = sanitizePlayerName(player_name);
  const imagePath = path.join(__dirname, `${type}_images`, `${sanitizedPlayerName}.jpg`);

  // Log the image path for debugging
  console.log(`Looking for image at: ${imagePath}`);

  // Check if image exists
  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    console.error(`Image not found: ${imagePath}`);
    res.status(404).json({ error: 'Image not found' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
