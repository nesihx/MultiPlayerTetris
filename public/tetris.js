// Canvas ve oyun değişkenleri
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');

// Oyun sabitleri
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;

// Oyun durumu
let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1; // Bunlar artık sunucudan gelecek
let lines = 0; // Bunlar artık sunucudan gelecek
let myPlayerId = null; // Socket.id'miz
let allPlayerStates = []; // Tüm oyuncuların durumları
let isGameRunning = false;
let isPaused = false;

const bombImage = new Image();
bombImage.src = 'images/bomba.gif';


// Tetris parçaları (Tetrominos) - Artık anahtarla erişilebilir bir nesne
const PIECES_MAP = {
    'I': {
        shape: [
            [1, 1, 1, 1]
        ],
        color: '#00f5ff' // I parça - cyan
    },
    'O': {
        shape: [
            [1, 1],
            [1, 1]
        ],
        color: '#ffff00' // O parça - sarı
    },
    'T': {
        shape: [
            [0, 1, 0],
            [1, 1, 1]
        ],
        color: '#9932cc' // T parça - mor
    },
    'S': {
        shape: [
            [0, 1, 1],
            [1, 1, 0]
        ],
        color: '#00ff00' // S parça - yeşil
    },
    'Z': {
        shape: [
            [1, 1, 0],
            [0, 1, 1]
        ],
        color: '#ff0000' // Z parça - kırmızı
    },
    'J': {
        shape: [
            [1, 0, 0],
            [1, 1, 1]
        ],
        color: '#ffa500' // J parça - turuncu
    },
    'L': {
        shape: [
            [0, 0, 1],
            [1, 1, 1]
        ],
        color: '#0000ff' // L parça - mavi
    }
};

// Oyun tahtasını başlat
function initBoard() {
    board = [];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        board[y] = new Array(BOARD_WIDTH).fill(0);
    }
    console.log('Oyun tahtası başlatıldı.');
}

// Skoru güncelle
function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = lines;
}

// Parçayı çiz
function drawPiece(ctx, piece, offsetX = 0, offsetY = 0, blockSize = BLOCK_SIZE) {
    if (!piece) return;

    if (piece.type === 'bomb') {
        ctx.drawImage(bombImage, (piece.x + offsetX) * blockSize, (piece.y + offsetY) * blockSize, blockSize, blockSize);
        return;
    }
    ctx.fillStyle = piece.color;
    
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                ctx.fillRect(
                    (piece.x + x) * blockSize + offsetX,
                    (piece.y + y) * blockSize + offsetY,
                    blockSize - 1, blockSize - 1);
            }
        }
    }
}

// Sonraki parçayı çiz
function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (nextPiece) {
        const blockSize = 20;
        const offsetX = (nextCanvas.width - nextPiece.shape[0].length * blockSize) / 2;
        const offsetY = (nextCanvas.height - nextPiece.shape.length * blockSize) / 2;
        
        // Bomba parçası özel durumu
        if (nextPiece.type === 'bomb') {
            nextCtx.drawImage(bombImage, offsetX, offsetY, blockSize, blockSize);
            return;
        }
        
        // Normal parçalar için
        nextCtx.fillStyle = nextPiece.color;
        for (let y = 0; y < nextPiece.shape.length; y++) {
            for (let x = 0; x < nextPiece.shape[y].length; x++) {
                if (nextPiece.shape[y][x]) {
                    nextCtx.fillRect(
                        offsetX + x * blockSize,
                        offsetY + y * blockSize,
                        blockSize - 1, 
                        blockSize - 1
                    );
                }
            }
        }
    }
}

// Oyun tahtasını çiz
function draw() {
    // Arka planı temizle
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Tahtayı çiz
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (board[y][x]) {
                ctx.fillStyle = board[y][x];
                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
            }
        }
    }
    
    // Mevcut parçayı çiz
    if (currentPiece) {
        drawPiece(ctx, currentPiece);
    }
    
    // Sonraki parçayı çiz
    drawNextPiece();
}

// Oyunu başlat
function startGame(sequence) {
    console.log('startGame çağrıldı, gelen sıra:', sequence);
    initBoard();
    if (!sequence || sequence.length === 0) {
        console.error('Sunucudan parça sırası alınamadı. Oyun başlatılamıyor.');
        return;
    }

    score = 0;
    level = 1;
    lines = 0;
    isGameRunning = true;
    
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('pauseScreen').style.display = 'none';
    
    updateScore();
    console.log('Oyun başlatıldı. Sunucudan durum güncellemeleri bekleniyor.');
}

// Oyun bitti
function gameOver(data) {
    isGameRunning = false;
    document.getElementById('opponent-boards-container').style.display = 'none';
    
    // Liderlik tablosunu oluştur
    if (data.finalScores && data.finalScores.length > 0) {
        createLeaderboard(data.finalScores);
    }
    
    // Kendi skorumuzu göster
    const myFinalState = allPlayerStates.find(p => p.id === myPlayerId);
    if (myFinalState) {
        document.getElementById('finalScore').textContent = myFinalState.score;
    }
    
    document.getElementById('gameOver').style.display = 'flex';
    console.log('Oyun bitti!', data);
}

function createLeaderboard(finalScores) {
    const leaderboardList = document.getElementById('leaderboard-list');
    if (!leaderboardList) return;
    
    leaderboardList.innerHTML = '';
    
    // Skorlara göre sırala (yüksekten alçağa)
    const sortedScores = finalScores.sort((a, b) => b.score - a.score);
    
    sortedScores.forEach((player, index) => {
        const rank = index + 1;
        const isCurrentPlayer = player.id === myPlayerId;
        
        const item = document.createElement('div');
        item.className = `leaderboard-item ${isCurrentPlayer ? 'current-player' : ''}`;
        
        item.innerHTML = `
            <div class="player-rank">${rank}.</div>
            <div class="player-name">${player.nickname}${isCurrentPlayer ? ' (Sen)' : ''}</div>
            <div class="player-score">${player.score}</div>
        `;
        
        leaderboardList.appendChild(item);
    });
}

function togglePause() {
    if (!isGameRunning) return;
    isPaused = !isPaused;
    document.getElementById('pauseScreen').style.display = isPaused ? 'flex' : 'none';
}

// Klavye kontrolleri
document.addEventListener('keydown', (e) => {
    if (!isGameRunning) {
        return;
    }

    if (e.key.toLowerCase() === 'p') {
        togglePause();
        return;
    }

    if (isPaused) return; // Duraklatıldıysa girdi gönderme

    switch (e.key) {
        case '1':
            activatePower('hourglass');
            break;
        case '2':
            activatePower('lightning');
            break;
        case '3':
            activatePower('bomb');
            break;
        case 'ArrowLeft':
            socket.emit('playerInput', { input: 'left' });
            break;
        case 'ArrowRight':
            socket.emit('playerInput', { input: 'right' });
            break;
        case 'ArrowDown':
            socket.emit('playerInput', { input: 'down' });
            break;
        case 'ArrowUp':
            socket.emit('playerInput', { input: 'rotate' });
            break;
        case ' ':
            socket.emit('playerInput', { input: 'drop' });
            e.preventDefault(); // Sayfa kaydırmayı engelle
            break;
    }
});

function activatePower(powerType) {
    const powerButton = document.getElementById(`power-${powerType}`);
    if (!powerButton || powerButton.classList.contains('disabled') || !isGameRunning || isPaused) {
        return;
    }
    socket.emit('activatePower', { power: powerType });
}



function updatePowerButtons(currentScore) {
    document.querySelectorAll('.power').forEach(button => {
        const cost = parseInt(button.dataset.cost, 10);
        if (currentScore >= cost) {
            button.classList.remove('disabled');
        } else {
            button.classList.add('disabled');
        }
    });
}
// Özel Güçler Arayüzü
function setupPowerButtons() {
    document.querySelectorAll('.power').forEach(button => {
        button.addEventListener('click', () => {
            activatePower(button.dataset.power);
        });
    });
}

// WebSocket bağlantısı - Vercel için optimize edilmiş
const socket = io({
    transports: ['polling'],
    upgrade: false,
    timeout: 20000,
    forceNew: false,
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10,
    maxReconnectionAttempts: 10,
    randomizationFactor: 0.5,
    path: '/socket.io/',
    autoConnect: true,
    pingTimeout: 120000,
    pingInterval: 25000
});

// Bağlantı hatalarını dinle
socket.on('connect_error', (error) => {
    console.error('Socket.IO bağlantı hatası:', error.message);
    const roomMessageEl = document.getElementById('roomMessage');
    if (roomMessageEl) {
        roomMessageEl.textContent = `Sunucuya bağlanılamadı: ${error.message}`;
    }
    
    // Ekranları güvenli konuma getir
    const gameContainer = document.getElementById('gameContainer');
    const waitingRoomDisplay = document.getElementById('waitingRoom');
    const roomSelectionContainer = document.getElementById('roomSelection');
    
    if (gameContainer) gameContainer.style.display = 'none';
    if (waitingRoomDisplay) waitingRoomDisplay.style.display = 'none';
    if (roomSelectionContainer) roomSelectionContainer.style.display = 'flex';
});

socket.on('disconnect', (reason) => {
    console.log('Bağlantı kesildi:', reason);
    const roomMessageEl = document.getElementById('roomMessage');
    
    if (roomMessageEl) {
        roomMessageEl.textContent = 'Bağlantı kesildi. Yeniden bağlanmaya çalışılıyor...';
    }
    
    // Belirli durumlarda manuel yeniden bağlanma
    if (reason === 'io server disconnect' || reason === 'ping timeout' || reason === 'transport close') {
        setTimeout(() => {
            if (!socket.connected) {
                socket.connect();
            }
        }, 1000);
    }
});

socket.on('reconnect', (attemptNumber) => {
    console.log('Yeniden bağlandı, deneme sayısı:', attemptNumber);
    const roomMessageEl = document.getElementById('roomMessage');
    if (roomMessageEl) {
        roomMessageEl.textContent = 'Başarıyla yeniden bağlandı.';
    }
});

socket.on('reconnect_error', (error) => {
    console.error('Yeniden bağlanma hatası:', error);
});

socket.on('reconnect_failed', () => {
    console.error('Yeniden bağlanma başarısız');
    const roomMessageEl = document.getElementById('roomMessage');
    if (roomMessageEl) {
        roomMessageEl.textContent = 'Sunucuya bağlanılamadı. Sayfa yenileniyor...';
    }
    
    // 5 saniye sonra sayfayı yenile
    setTimeout(() => {
        window.location.reload();
    }, 5000);
});

// Bağlantı başarılı olduğunda
socket.on('connect', () => {
    console.log('Socket.IO sunucuya başarıyla bağlandı:', socket.id);
    myPlayerId = socket.id;
    const roomMessageEl = document.getElementById('roomMessage');
    if (roomMessageEl) {
        roomMessageEl.textContent = 'Sunucuya bağlandı.';
    }
});

// Bağlantı test mesajı
socket.on('connectionTest', (message) => {
    console.log('Sunucu test mesajı:', message);
});

// Heartbeat için ping-pong
socket.on('ping', () => {
    socket.emit('pong');
});

// DOM yükleme kontrolü
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM yüklendi, oyun başlatılıyor...');
    
    // Tüm gerekli elementleri kontrol et
    const requiredElements = [
        'roomSelection', 'waitingRoom', 'roomMessage', 'gameContainer',
        'createTab', 'joinTab', 'nicknameInput', 'createRoomName',
        'createRoomPassword', 'joinRoomName', 'joinRoomPassword'
    ];
    
    const missingElements = [];
    requiredElements.forEach(id => {
        if (!document.getElementById(id)) {
            missingElements.push(id);
        }
    });
    
    if (missingElements.length > 0) {
        console.error('Eksik HTML elementleri:', missingElements);
        alert('Sayfa eksik elementler içeriyor. Sayfayı yenileyin: ' + missingElements.join(', '));
        return;
    }
    
    initializeGame();
});

// Oyun başlatma fonksiyonu
function initializeGame() {
    // Element kontrolü
    const roomSelectionContainer = document.getElementById('roomSelection');
    const waitingRoomDisplay = document.getElementById('waitingRoom');
    const roomMessage = document.getElementById('roomMessage');
    const gameContainer = document.getElementById('gameContainer');

    if (!roomSelectionContainer || !waitingRoomDisplay || !roomMessage || !gameContainer) {
        console.error('Gerekli HTML elementleri bulunamadı!');
        return;
    }

    // Başlangıçta sadece oda seçimi görünür
    gameContainer.style.display = 'none';
    waitingRoomDisplay.style.display = 'none';
    roomSelectionContainer.style.display = 'flex';

    // Güç butonlarını ayarla
    setupPowerButtons();

    console.log('Oyun başarıyla başlatıldı.');
}

// Oda arayüzü ve fonksiyonları - Global değişkenler
let roomSelectionContainer, waitingRoomDisplay, roomMessage, gameContainer;

// Sekme geçiş fonksiyonu
function switchTab(tab) {
    const createTab = document.getElementById('createTab');
    const joinTab = document.getElementById('joinTab');
    const buttons = document.querySelectorAll('.tab-buttons button');
    
    if (!createTab || !joinTab) {
        console.error('Tab elementleri bulunamadı');
        return;
    }
    
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if (tab === 'create') {
        createTab.style.display = 'flex';
        joinTab.style.display = 'none';
        const createButton = document.querySelector('button[onclick="switchTab(\'create\')"]');
        if (createButton) createButton.classList.add('active');
    } else {
        createTab.style.display = 'none';
        joinTab.style.display = 'flex';
        const joinButton = document.querySelector('button[onclick="switchTab(\'join\')"]');
        if (joinButton) joinButton.classList.add('active');
    }
}

// Global değişkenler
let isRoomOwner = false;
let currentRoom = null;
let myNickname = '';

function createRoom() {
    const odaAdi = document.getElementById('createRoomName')?.value.trim();
    const sifre = document.getElementById('createRoomPassword')?.value || '';
    const nickname = document.getElementById('nicknameInput')?.value.trim();
    
    const roomMessageEl = document.getElementById('roomMessage');
    
    if (!nickname) {
        if (roomMessageEl) roomMessageEl.textContent = 'Takma ad giriniz.';
        return;
    }
    if (!odaAdi) {
        if (roomMessageEl) roomMessageEl.textContent = 'Oda adı giriniz.';
        return;
    }
    
    myNickname = nickname;
    socket.emit('createRoom', { odaAdi, sifre, nickname }, (res) => {
        if (roomMessageEl) roomMessageEl.textContent = res.message;
        if (res.success) {
            isRoomOwner = true;
            currentRoom = odaAdi;
            showWaitingRoom();
        }
    });
}

function joinRoom() {
    const odaAdi = document.getElementById('joinRoomName')?.value.trim();
    const sifre = document.getElementById('joinRoomPassword')?.value || '';
    const nickname = document.getElementById('nicknameInput')?.value.trim();
    
    const roomMessageEl = document.getElementById('roomMessage');
    
    if (!nickname) {
        if (roomMessageEl) roomMessageEl.textContent = 'Takma ad giriniz.';
        return;
    }
    if (!odaAdi) {
        if (roomMessageEl) roomMessageEl.textContent = 'Oda adı giriniz.';
        return;
    }
    
    myNickname = nickname;
    socket.emit('joinRoom', { odaAdi, sifre, nickname }, (res) => {
        if (roomMessageEl) roomMessageEl.textContent = res.message;
        if (res.success) {
            isRoomOwner = false;
            currentRoom = odaAdi;
            showWaitingRoom();
        }
    });
}

function showWaitingRoom() {
    document.getElementById('currentRoomName').textContent = currentRoom;
    roomSelectionContainer.style.display = 'none';
    waitingRoomDisplay.style.display = 'flex';
}

function startMultiplayerGame() {
    if (!isRoomOwner) return;
    socket.emit('startGame', { odaAdi: currentRoom });
}

function goBackToRoomSelection() {
    // Oyun durumunu sıfırla
    isGameRunning = false;
    isPaused = false;
    
    // Ekranları güvenli şekilde gizle
    const gameContainer = document.getElementById('gameContainer');
    const waitingRoomDisplay = document.getElementById('waitingRoom');
    const gameOverScreen = document.getElementById('gameOver');
    const pauseScreen = document.getElementById('pauseScreen');
    const roomSelectionContainer = document.getElementById('roomSelection');
    
    if (gameContainer) gameContainer.style.display = 'none';
    if (waitingRoomDisplay) waitingRoomDisplay.style.display = 'none';
    if (gameOverScreen) gameOverScreen.style.display = 'none';
    if (pauseScreen) pauseScreen.style.display = 'none';
    
    // Oda seçim ekranını göster
    if (roomSelectionContainer) {
        roomSelectionContainer.style.display = 'flex';
    } else {
        console.error('Room selection container bulunamadı!');
    }
    
    // Inputları güvenli şekilde temizle
    const createRoomName = document.getElementById('createRoomName');
    const createRoomPassword = document.getElementById('createRoomPassword');
    const joinRoomName = document.getElementById('joinRoomName');
    const joinRoomPassword = document.getElementById('joinRoomPassword');
    const nicknameInput = document.getElementById('nicknameInput');
    
    if (createRoomName) createRoomName.value = '';
    if (createRoomPassword) createRoomPassword.value = '';
    if (joinRoomName) joinRoomName.value = '';
    if (joinRoomPassword) joinRoomPassword.value = '';
    if (nicknameInput) nicknameInput.value = '';
    
    // Room durumunu sıfırla
    currentRoom = null;
    isRoomOwner = false;
    myNickname = '';
    
    console.log('Ana menüye dönüldü.');
}

function showWaitingRoom() {
    const roomSelectionContainer = document.getElementById('roomSelection');
    const waitingRoomDisplay = document.getElementById('waitingRoom');
    const startGameBtn = document.getElementById('startGameBtn');
    const currentRoomNameSpan = document.getElementById('currentRoomName');
    
    if (roomSelectionContainer) roomSelectionContainer.style.display = 'none';
    if (waitingRoomDisplay) waitingRoomDisplay.style.display = 'flex';
    if (startGameBtn) startGameBtn.style.display = isRoomOwner ? 'inline-block' : 'none';
    if (currentRoomNameSpan) currentRoomNameSpan.textContent = currentRoom || 'Bilinmeyen Oda';
    
    console.log('Bekleme odası gösterildi. Oda sahibi mi:', isRoomOwner);
}

function updateWaitingPlayers(players) {
    if (!players || players.length === 0) {
        document.getElementById('waitingPlayers').innerHTML = 'Henüz oyuncu yok.';
        return;
    }
    document.getElementById('waitingPlayers').innerHTML = players.map((p, i) => `<span>${isRoomOwner && i === 0 ? '👑 ' : ''}${p.nickname}</span>`).join('<br>');
    console.log('Oyuncu listesi güncellendi:', players.map(p => p.nickname).join(', '));
}

socket.on('playerList', (players) => {
    updateWaitingPlayers(players);
});

// "Oyunu Başlat" butonu için startGame fonksiyonu
function startGameButtonHandler() {
    console.log('Oyunu Başlat butonuna basıldı.');
    if (!isRoomOwner || !currentRoom) {
        console.warn('Oda sahibi değilsiniz veya oda seçili değil. Oyun başlatılamıyor.');
        return;
    }
    socket.emit('startGame', { odaAdi: currentRoom });
}

// HTML'deki startGame butonu artık bu fonksiyonu çağıracak
document.getElementById('startGameBtn').onclick = startGameButtonHandler;
setupPowerButtons();


// Oyun başlatıldığında Tetris ekranına geç
socket.on('gameStarted', (tetrominoSequence) => {
    console.log('Sunucudan "gameStarted" olayı alındı, sıra:', tetrominoSequence);
    waitingRoomDisplay.style.display = 'none'; // Bekleme odasını gizle
    gameContainer.style.display = 'flex'; // Oyun ekranını göster
    document.getElementById('opponent-boards-container').style.display = 'block';
    // Sunucudan gelen sıra ile oyunu başlat
    startGame(tetrominoSequence);
});

// Sunucudan gelen oyun durumu güncellemelerini işle
socket.on('gameStateUpdate', (states) => {
    if (!isGameRunning) return;

    allPlayerStates = states;
    const myState = states.find(p => p.id === myPlayerId);

    if (myState) {
        board = myState.board;
        currentPiece = myState.currentPiece;
        nextPiece = myState.nextPiece;
        score = myState.score;
        level = myState.level;
        lines = myState.lines;
        updateScore();
        updatePowerButtons(myState.score);
        draw(); // Ana oyun tahtasını çiz
    }

    renderOtherPlayers(states.filter(p => p.id !== myPlayerId));
});

function showPowerAnimation(powerType) {
    const overlay = document.getElementById('power-animation-overlay');
    if (!overlay) return;

    // Animasyonun her seferinde yeniden başlaması için içeriği temizleyip yeniden oluşturuyoruz.
    overlay.innerHTML = '';
    const img = document.createElement('img');
    img.src = `images/${powerType === 'hourglass' ? 'kumsaati' : (powerType === 'lightning' ? 'yildirim' : 'bomba')}.svg`;
    img.alt = `${powerType} animasyonu`;

    overlay.appendChild(img);
    overlay.classList.add('active');

    // Animasyon bittiğinde 'active' sınıfını kaldırarak bir sonraki animasyona hazırla
    img.addEventListener('animationend', () => {
        overlay.classList.remove('active');
    }, { once: true });
}

socket.on('powerActivated', ({ powerType, userId }) => {
    showPowerAnimation(powerType);
});

function renderOtherPlayers(states) {
    const container = document.getElementById('opponent-canvases');
    container.innerHTML = '';
    if (!states || states.length === 0) return;
    states.forEach(playerState => {
        // Her oyuncu için bir kutu ve canvas oluştur
        const boardDiv = document.createElement('div');
        boardDiv.className = 'other-player-board';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'other-player-name';
        nameDiv.textContent = playerState.nickname;

        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'other-player-score';
        scoreDiv.textContent = `Skor: ${playerState.score}`;

        const canvas = document.createElement('canvas');
        canvas.width = 80;
        canvas.height = 160;
        canvas.className = 'other-player-canvas';
        boardDiv.appendChild(nameDiv);
        boardDiv.appendChild(scoreDiv);
        boardDiv.appendChild(canvas);
        container.appendChild(boardDiv);
        // Board durumunu çiz
        if (playerState.board) {
            drawMiniBoard(canvas, playerState);
        }
    });
}

function drawMiniBoard(canvas, state) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const board = state.board;
    const rows = board.length;
    const cols = board[0].length;
    const blockSize = Math.min(canvas.width / cols, canvas.height / rows);
    // Tahtayı çiz
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (board[y][x]) {
                ctx.fillStyle = board[y][x];
                ctx.fillRect(x * blockSize, y * blockSize, blockSize - 1, blockSize - 1);
            }
        }
    }
    // Aktif parçayı çiz
    if (state.currentPiece) {
        const p = state.currentPiece;
        ctx.fillStyle = p.color;
        for (let y = 0; y < p.shape.length; y++) {
            for (let x = 0; x < p.shape[y].length; x++) {
                if (p.shape[y][x]) {
                    const drawX = (p.x + x) * blockSize;
                    const drawY = (p.y + y) * blockSize;
                    ctx.fillRect(drawX, drawY, blockSize - 1, blockSize - 1);
                }
            }
        }
    }
}

socket.on('gameOver', (data) => {
    console.log('Sunucudan "gameOver" olayı alındı.');
    gameOver(data);
});
