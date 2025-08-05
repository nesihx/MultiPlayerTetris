import { Server } from 'socket.io';

let rooms = {};
let io;

const SocketHandler = (req, res) => {
    if (!res.socket.server.io) {
        console.log('Initializing Socket.IO');
        
        io = new Server(res.socket.server, {
            path: '/api/socket',
            addTrailingSlash: false,
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            },
            transports: ['polling'],
            allowEIO3: true,
            pingTimeout: 60000,
            pingInterval: 25000
        });

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

        res.socket.server.io = io;
    }
    
    res.end();
};

export default SocketHandler;
