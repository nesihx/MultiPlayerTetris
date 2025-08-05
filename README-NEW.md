# Multiplayer Tetris Server

Modern serverless architecture ile Vercel'de çalışan multiplayer Tetris oyunu.

## 🚀 Deployment

### Vercel (Production)
```bash
vercel --prod
```

### Local Development
```bash
npm run dev
# veya
vercel dev
```

## 📁 Yapı

```
/api
├── socket.js     # Socket.IO serverless function
├── index.js      # Static file server
└── health.js     # Health check endpoint

/public           # Client-side dosyalar
├── index.html
├── tetris.js
├── style.css
└── images/

server.local.js   # Local development server
```

## 🔧 Özellikler

- ✅ Serverless Socket.IO
- ✅ Real-time multiplayer
- ✅ Oda sistemi (şifreli)
- ✅ Özel güçler
- ✅ Leaderboard
- ✅ Auto-reconnection

## 🌐 Endpoints

- `/api/health` - Health check
- `/socket.io/` - Socket.IO endpoint
- `/` - Ana sayfa
