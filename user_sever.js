const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let players = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinGame', (username) => {
        players[socket.id] = { username, choice: null };
        io.emit('playersUpdate', players);
    });

    socket.on('makeChoice', (choice) => {
        if (players[socket.id]) {
            players[socket.id].choice = choice;
            checkWinner();
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playersUpdate', players);
    });
});

function checkWinner() {
    const playerIds = Object.keys(players);
    if (playerIds.length === 2) {
        const [player1, player2] = playerIds;
        const choice1 = players[player1].choice;
        const choice2 = players[player2].choice;

        if (choice1 && choice2) {
            let result;
            if (choice1 === choice2) {
                result = 'It\'s a tie!';
            } else if (
                (choice1 === 'rock' && choice2 === 'scissors') ||
                (choice1 === 'scissors' && choice2 === 'paper') ||
                (choice1 === 'paper' && choice2 === 'rock')
            ) {
                result = `${players[player1].username} wins!`;
            } else {
                result = `${players[player2].username} wins!`;
            }

            io.emit('gameResult', result);
            // Reset choices
            players[player1].choice = null;
            players[player2].choice = null;
            io.emit('playersUpdate', players);
        }
    }
}

// 提供靜態文件服務
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = 3000;
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
