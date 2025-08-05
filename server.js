const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

// Game modülünü try-catch ile yükle
let Game;
try {
    Game = require('./game.js');
} catch (error) {
    console.error('Game.js yüklenemedi:', error);
    // Basit bir fallback Game class'ı
    Game = class {
        constructor() {
            this.players = new Map();
            this.sequence = [];
        }
        addPlayer() { return true; }
        removePlayer() { return true; }
        getGameState() { return {}; }
    };
}

const app = express();

// Express middleware for parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.IO test endpoint
app.get('/socket.io/test', (req, res) => {
    res.json({ message: 'Socket.IO endpoint is working', status: 'OK' });
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: false
    },
    allowEIO3: true,
    transports: ['polling', 'websocket'],
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    maxHttpBufferSize: 1e6,
    connectTimeout: 45000,
    path: '/socket.io/',
    serveClient: true,
    cookie: false,
    destroyUpgrade: false,
    destroyUpgradeTimeout: 1000
});

// Hosting için port ayarı (cPanel otomatik port atar)
const PORT = process.env.PORT || 3000;

// Static dosyaları serve et - express.static middleware
app.use('/', express.static(path.join(__dirname, 'public'), {
    maxAge: '1h',
    etag: false,
    setHeaders: (res, filePath) => {
        try {
            if (filePath.endsWith('.css')) {
                res.setHeader('Content-Type', 'text/css');
            } else if (filePath.endsWith('.js')) {
                res.setHeader('Content-Type', 'application/javascript');
            } else if (filePath.endsWith('.svg')) {
                res.setHeader('Content-Type', 'image/svg+xml');
            } else if (filePath.endsWith('.html')) {
                res.setHeader('Content-Type', 'text/html');
            }
        } catch (error) {
            console.error('Static file header error:', error);
        }
    }
}));

// Ana sayfa route'u
app.get('/', (req, res) => {
    try {
        const indexPath = path.join(__dirname, 'public', 'index.html');
        res.sendFile(indexPath, (err) => {
            if (err) {
                console.error('Index.html serve error:', err);
                res.status(500).send('Internal Server Error');
            }
        });
    } catch (error) {
        console.error('Route error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// API routes
app.get('/api/status', (req, res) => {
    try {
        res.json({ 
            status: 'running', 
            rooms: Object.keys(rooms).length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Status API error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Debug için static file route'ları
app.get('/debug/files', (req, res) => {
    const fs = require('fs');
    const publicDir = path.join(__dirname, 'public');
    const files = fs.readdirSync(publicDir, { withFileTypes: true });
    const fileList = files.map(file => ({
        name: file.name,
        isDirectory: file.isDirectory()
    }));
    res.json(fileList);
});

let rooms = {}; // Oda bilgilerini sakla

io.on('connection', (socket) => {
    try {
        console.log(`Bir kullanıcı bağlandı: ${socket.id}`);
        
        // Heartbeat mekanizması
        socket.isAlive = true;
        socket.on('pong', () => {
            socket.isAlive = true;
        });
        
        // Bağlantı ping test
        socket.emit('connectionTest', 'Bağlantı başarılı');
        
        // Ping-pong test
        socket.on('ping', (timestamp) => {
            socket.emit('pong', timestamp);
        });
        
        // Hata yakalama
        socket.on('error', (error) => {
            console.error(`Socket hatası ${socket.id}:`, error);
        });
    } catch (error) {
        console.error('Socket connection error:', error);
    }

    socket.on('createRoom', ({ odaAdi, sifre, nickname }, callback) => {
        try {
            if (rooms[odaAdi]) {
                return callback({ success: false, message: 'Bu oda adı zaten mevcut.' });
            }
            rooms[odaAdi] = {
                password: sifre,
                players: [{ id: socket.id, nickname: nickname, isOwner: true }],
                game: null,
                gameTimeout: null
            };
            socket.join(odaAdi);
            socket.nickname = nickname;
            socket.currentRoom = odaAdi;
            console.log(`Oda oluşturuldu: ${odaAdi}`);
            callback({ success: true, message: `Oda '${odaAdi}' başarıyla oluşturuldu.` });
            io.to(odaAdi).emit('playerList', rooms[odaAdi].players);
        } catch (error) {
            console.error('createRoom hatası:', error);
            callback({ success: false, message: 'Sunucu hatası oluştu.' });
        }
    });

    socket.on('joinRoom', ({ odaAdi, sifre, nickname }, callback) => {
        const room = rooms[odaAdi];
        if (!room) {
            return callback({ success: false, message: 'Oda bulunamadı.' });
        }
        if (room.password !== sifre) {
            return callback({ success: false, message: 'Şifre yanlış.' });
        }
        if (room.game) {
            return callback({ success: false, message: 'Oyun zaten başladı.' });
        }
        room.players.push({ id: socket.id, nickname: nickname, isOwner: false });
        socket.join(odaAdi);
        socket.nickname = nickname;
        socket.currentRoom = odaAdi;
        console.log(`${nickname} odaya katıldı: ${odaAdi}`);
        callback({ success: true, message: `'${odaAdi}' odasına katıldınız.` });
        io.to(odaAdi).emit('playerList', room.players);
    });

    socket.on('startGame', ({ odaAdi }) => {
        const room = rooms[odaAdi];
        if (!room || !room.players.find(p => p.id === socket.id && p.isOwner)) {
            return;
        }
        if (room.game) {
            return;
        }

        console.log(`Oyun başlatılıyor: ${odaAdi}`);
        const game = new Game(room.players.map(p => ({ id: p.id, nickname: p.nickname })));
        room.game = game;
        
        io.to(odaAdi).emit('gameStarted', game.getInitialSequence());

        // Sabit aralıklı, deltaTime tabanlı oyun döngüsü
        let lastTime = Date.now();
        const gameLoop = () => {
            try {
                const currentRoom = rooms[odaAdi];
                if (!currentRoom || !currentRoom.game) {
                    console.log(`[${odaAdi}] Oyun döngüsü durduruluyor: Oda veya oyun mevcut değil.`);
                    return;
                }

                const now = Date.now();
                const deltaTime = now - lastTime;
                lastTime = now;

                currentRoom.game.update(deltaTime);
                
                io.to(odaAdi).emit('gameStateUpdate', currentRoom.game.getAllPlayerStates());

                if (currentRoom.game.isGameOver()) {
                    console.log(`Oyun bitti: ${odaAdi}`);
                    io.to(odaAdi).emit('gameOver', { finalScores: currentRoom.game.getFinalScores() });
                    if (currentRoom.gameTimeout) clearInterval(currentRoom.gameTimeout);
                    currentRoom.game = null;
                    currentRoom.gameTimeout = null;
                }
            } catch (error) {
                console.error(`[${odaAdi}] Oyun döngüsünde kritik hata:`, error);
                io.to(odaAdi).emit('gameOver', { message: 'Sunucu hatası nedeniyle oyun sonlandırıldı.' });
                if (rooms[odaAdi]) {
                    if (rooms[odaAdi].gameTimeout) clearInterval(rooms[odaAdi].gameTimeout);
                    rooms[odaAdi].game = null;
                    rooms[odaAdi].gameTimeout = null;
                }
            }
        };

        // setInterval ile döngüyü başlat
        room.gameTimeout = setInterval(gameLoop, 50); // Saniyede 20 kare
    });

    socket.on('playerInput', ({ input }) => {
        const roomName = socket.currentRoom;
        const room = rooms[roomName];
        if (room && room.game) {
            room.game.handleInput(socket.id, input);
            // Girdiden hemen sonra durumu yayınla ki daha akıcı hissettirsin
            const allPlayerStates = room.game.getAllPlayerStates();
            io.to(roomName).emit('gameStateUpdate', allPlayerStates);
        }
    });

    socket.on('activatePower', ({ power }) => {
        const roomName = socket.currentRoom;
        const room = rooms[roomName];
        if (room && room.game) {
            const success = room.game.activatePower(socket.id, power);
            if (success) {
                // Güç kullanımını odadaki herkese bildir
                io.to(roomName).emit('powerActivated', { powerType: power, userId: socket.id });
                // Skoru ve durumu anında güncellemek için ek yayın
                const allPlayerStates = room.game.getAllPlayerStates();
                io.to(roomName).emit('gameStateUpdate', allPlayerStates);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`Bir kullanıcı ayrıldı: ${socket.id}`);
        const roomName = socket.currentRoom;
        const room = rooms[roomName];
        if (room) {
            // Oyuncu oyun sırasında ayrılırsa oyunu bitir
            if (room.game) {
                io.to(roomName).emit('gameOver', { message: `${socket.nickname || 'Bir oyuncu'} oyundan ayrıldı.` });
                if (room.gameTimeout) clearInterval(room.gameTimeout); // setInterval clearInterval ile durdurulur
                room.game = null;
                room.gameTimeout = null;
            }

            room.players = room.players.filter(p => p.id !== socket.id);
            
            if (room.players.length === 0) {
                console.log(`Oda kapatılıyor: ${roomName}`);
                delete rooms[roomName];
            } else {
                const ownerExists = room.players.some(p => p.isOwner);
                if (!ownerExists && room.players.length > 0) {
                    room.players[0].isOwner = true;
                }
                io.to(roomName).emit('playerList', room.players);
            }
        }
    });
});

// Vercel için export
if (process.env.VERCEL) {
    // Vercel serverless function olarak çalıştırılıyor
    module.exports = server; // app yerine server export et
    module.exports.io = io; // Socket.IO'yu da export et
} else {
    // Local development
    server.listen(PORT, () => {
        console.log(`Sunucu ${PORT} portunda çalışıyor.`);
    });
    
    // Heartbeat mekanizması - bağlantıları kontrol et
    setInterval(() => {
        io.sockets.sockets.forEach((socket) => {
            if (socket.isAlive === false) {
                console.log(`Socket ${socket.id} yanıt vermiyor, bağlantı kesiliyor.`);
                return socket.terminate();
            }
            
            socket.isAlive = false;
            socket.ping();
        });
    }, 30000); // Her 30 saniyede bir kontrol et
}
