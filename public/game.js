// Game.js - Client side game logic

const PIECES_MAP = {
    'I': { shape: [[1, 1, 1, 1]], color: '#00f5ff' },
    'O': { shape: [[1, 1], [1, 1]], color: '#ffff00' },
    'T': { shape: [[0, 1, 0], [1, 1, 1]], color: '#9932cc' },
    'S': { shape: [[0, 1, 1], [1, 1, 0]], color: '#00ff00' },
    'Z': { shape: [[1, 1, 0], [0, 1, 1]], color: '#ff0000' },
    'J': { shape: [[1, 0, 0], [1, 1, 1]], color: '#ffa500' },
    'L': { shape: [[0, 0, 1], [1, 1, 1]], color: '#0000ff' }
};
const PIECE_TYPES = Object.keys(PIECES_MAP);

const POWER_COSTS = {
    hourglass: 100,
    lightning: 200,
    bomb: 300,
};

class Player {
    constructor(id, nickname) {
        this.id = id;
        this.nickname = nickname;
        this.board = this.createBoard();
        this.piece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.isGameOver = false;
        this.sequenceIndex = 0; // Her oyuncu kendi parça sırasını takip eder

        // Zaman tabanlı oyun döngüsü için
        this.dropCounter = 0;
        this.dropInterval = 1000; // Başlangıç düşme hızı (ms)
        this.speedModifier = 1.0; // 1.0 = normal, >1.0 = yavaş, <1.0 = hızlı
        this.effectTimeout = null; // Güç efektlerinin süresini tutmak için
    }

    createBoard() {
        return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
    }

    updateDropInterval() {
        this.dropInterval = (1000 - (this.level - 1) * 50) * this.speedModifier;
        this.dropInterval = Math.max(100, this.dropInterval); // Minimum 100ms
    }

    getState() {
        return {
            id: this.id,
            nickname: this.nickname,
            board: this.board,
            currentPiece: this.piece,
            nextPiece: this.nextPiece,
            score: this.score,
            level: this.level,
            lines: this.lines,
            isGameOver: this.isGameOver,
        };
    }
}

class Game {
    constructor(playersInfo) { // [{id, nickname}, ...]
        this.players = new Map();
        this.tetrominoSequence = this.generateSequence(30);

        playersInfo.forEach(playerInfo => {
            const player = new Player(playerInfo.id, playerInfo.nickname);
            this.players.set(playerInfo.id, player);
            this.spawnNewPiece(player);
        });
    }

    generateSequence(bags = 20) {
        const sequence = [];
        for (let i = 0; i < bags; i++) {
            const bag = [...PIECE_TYPES].sort(() => Math.random() - 0.5);
            sequence.push(...bag);
        }
        return sequence;
    }

    getInitialSequence() {
        return this.tetrominoSequence;
    }

    spawnNewPiece(player) {
        if (player.sequenceIndex >= this.tetrominoSequence.length - 10) {
            this.tetrominoSequence.push(...this.generateSequence(15));
        }

        player.piece = this.createPiece(this.tetrominoSequence[player.sequenceIndex]);
        player.nextPiece = this.createPiece(this.tetrominoSequence[player.sequenceIndex + 1]);

        if (!this.isValidMove(player, player.piece)) {
            player.isGameOver = true;
        }
    }

    createPiece(type) {
        if (type === 'bomb') {
            return { type: 'bomb', shape: [[1]], color: '#333333', x: Math.floor(BOARD_WIDTH / 2), y: 0 };
        }
        const pieceData = PIECES_MAP[type];
        return {
            type: type,
            shape: pieceData.shape,
            color: pieceData.color,
            x: Math.floor(BOARD_WIDTH / 2) - Math.floor(pieceData.shape[0].length / 2),
            y: 0
        };
    }

    isValidMove(player, piece, dx = 0, dy = 0) {
        if (!piece) return false;
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const newX = piece.x + x + dx;
                    const newY = piece.y + y + dy;
                    if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT || (newY >= 0 && player.board[newY][newX])) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    placePiece(player) {
        if (!player.piece) return;
        const piece = player.piece;
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const boardY = piece.y + y;
                    const boardX = piece.x + x;
                    if (boardY >= 0) {
                        player.board[boardY][boardX] = piece.color;
                    }
                }
            }
        }
    }

    detonateBomb(player, centerX, centerY) {
        for (let y = centerY - 1; y <= centerY + 1; y++) {
            for (let x = centerX - 1; x <= centerX + 1; x++) {
                if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
                    player.board[y][x] = 0;
                }
            }
        }
    }

    clearLines(player) {
        let linesCleared = 0;
        for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
            if (player.board[y].every(cell => cell !== 0)) {
                player.board.splice(y, 1);
                player.board.unshift(new Array(BOARD_WIDTH).fill(0));
                linesCleared++;
                y++;
            }
        }
        if (linesCleared > 0) {
            player.lines += linesCleared;
            const linePoints = [0, 100, 300, 500, 800]; // 1, 2, 3, 4 satır için puanlar
            player.score += (linePoints[linesCleared] || 1200) * player.level;
            player.level = Math.floor(player.lines / 10) + 1;
            player.updateDropInterval();
        }
    }

    rotatePiece(piece) {
        if (!piece || piece.type === 'bomb') return;
        const shape = piece.shape;
        const newShape = shape[0].map((_, colIndex) => shape.map(row => row[colIndex]).reverse());
        piece.shape = newShape;
    }

    lockPieceAndContinue(player) {
        if (player.piece && player.piece.type === 'bomb') {
            this.detonateBomb(player, player.piece.x, player.piece.y);
        } else {
            this.placePiece(player);
            this.clearLines(player);
        }

        player.sequenceIndex++;
        this.spawnNewPiece(player);
    }

    update(deltaTime) {
        this.players.forEach(player => {
            if (player.isGameOver || !player.piece) return;

            player.dropCounter += deltaTime;
            if (player.dropCounter >= player.dropInterval) {
                if (this.isValidMove(player, player.piece, 0, 1)) {
                    player.piece.y++;
                } else {
                    this.lockPieceAndContinue(player);
                }
                player.dropCounter = 0;
            }
        });
    }

    activatePower(playerId, powerType) {
        const player = this.players.get(playerId);
        if (!player || player.score < POWER_COSTS[powerType]) {
            return; // Yeterli puan yok
        }

        player.score -= POWER_COSTS[powerType];
        const DURATION = 10000; // 10 saniye

        switch (powerType) {
            case 'hourglass': // Herkesi yavaşlat
                this.players.forEach(p => {
                    if (p.effectTimeout) clearTimeout(p.effectTimeout);
                    p.speedModifier = 1.5; // Yavaşlat
                    p.updateDropInterval();
                    p.effectTimeout = setTimeout(() => {
                        p.speedModifier = 1.0;
                        p.updateDropInterval();
                    }, DURATION);
                });
                break;

            case 'lightning': // Diğerlerini hızlandır
                this.players.forEach(p => {
                    if (p.id !== playerId) {
                        if (p.effectTimeout) clearTimeout(p.effectTimeout);
                        p.speedModifier = 0.5; // Hızlandır
                        p.updateDropInterval();
                        p.effectTimeout = setTimeout(() => {
                            p.speedModifier = 1.0;
                            p.updateDropInterval();
                        }, DURATION);
                    }
                });
                break;

            case 'bomb':
                player.piece = this.createPiece('bomb');
                break;
        }
    }

    handleInput(playerId, input) {
        const player = this.players.get(playerId);
        if (!player || player.isGameOver || !player.piece) return;

        switch (input) {
            case 'left':
                if (this.isValidMove(player, player.piece, -1, 0)) player.piece.x--;
                break;
            case 'right':
                if (this.isValidMove(player, player.piece, 1, 0)) player.piece.x++;
                break;
            case 'down':
                if (this.isValidMove(player, player.piece, 0, 1)) {
                    player.piece.y++;
                    player.score += 1;
                    player.dropCounter = 0; // Manuel düşürme sayacı sıfırlar
                }
                break;
            case 'rotate':
                const originalShape = JSON.parse(JSON.stringify(player.piece.shape));
                this.rotatePiece(player.piece);
                if (!this.isValidMove(player, player.piece)) {
                    player.piece.shape = originalShape;
                }
                break;
            case 'drop':
                while (this.isValidMove(player, player.piece, 0, 1)) {
                    player.piece.y++;
                    player.score += 2;
                }
                this.lockPieceAndContinue(player); // Parçayı kilitle ve devam et
                break;
        }
    }

    getAllPlayerStates() {
        return Array.from(this.players.values()).map(p => p.getState());
    }

    isGameOver() {
        return [...this.players.values()].every(p => p.isGameOver);
    }

    getFinalScores() {
        return Array.from(this.players.values()).map(p => ({ nickname: p.nickname, score: p.score }));
    }
}

module.exports = Game;