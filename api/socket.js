const { createServer } = require('http');
const { Server } = require('socket.io');
const express = require('express');
const path = require('path');

// Game modülünü yükle
let Game;
try {
    Game = require('../game.js');
} catch (error) {
    console.error('Game.js yüklenemedi:', error);
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
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    transports: ['polling'],
    allowEIO3: true,
    path: '/api/socket.io/',
    serveClient: false
});

let rooms = {};

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    socket.emit('connectionTest', 'Connection successful');
    
    socket.on('ping', (timestamp) => {
        socket.emit('pong', timestamp);
    });

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
            callback({ success: true, message: `Oda '${odaAdi}' başarıyla oluşturuldu.` });
            io.to(odaAdi).emit('playerList', rooms[odaAdi].players);
        } catch (error) {
            console.error('createRoom hatası:', error);
            callback({ success: false, message: 'Sunucu hatası oluştu.' });
        }
    });

    socket.on('joinRoom', ({ odaAdi, sifre, nickname }, callback) => {
        try {
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
            callback({ success: true, message: `Oda '${odaAdi}' katıldınız.` });
            io.to(odaAdi).emit('playerList', room.players);
        } catch (error) {
            console.error('joinRoom hatası:', error);
            callback({ success: false, message: 'Sunucu hatası oluştu.' });
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        
        for (const [roomName, room] of Object.entries(rooms)) {
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                
                if (room.players.length === 0) {
                    delete rooms[roomName];
                } else {
                    const ownerExists = room.players.some(p => p.isOwner);
                    if (!ownerExists && room.players.length > 0) {
                        room.players[0].isOwner = true;
                    }
                    io.to(roomName).emit('playerList', room.players);
                }
                break;
            }
        }
    });
});

module.exports = (req, res) => {
    if (!res.socket.server.io) {
        console.log('Setting up Socket.IO');
        res.socket.server.io = io;
        
        // HTTP server'ı socket server olarak ayarla
        io.attach(res.socket.server);
    }
    
    app(req, res);
};
