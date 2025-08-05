# Tetris Multiplayer Game - Ücretsiz Hosting Seçenekleri

## 🚀 cPanel'de Node.js Desteği Yoksa - Alternatifler

### **1. VERCEl (ÖNERİLEN - En Kolay)**

**Adımlar:**
1. [GitHub](https://github.com) hesabı oluşturun
2. Bu projeyi GitHub'a yükleyin:
   ```bash
   git init
   git add .
   git commit -m "Tetris game initial commit"
   git remote add origin https://github.com/kullaniciadi/tetris-game.git
   git push -u origin main
   ```
3. [Vercel](https://vercel.com)'e GitHub ile giriş yapın
4. "New Project" → GitHub repository seçin
5. Deploy! (Otomatik çalışır)

**Avantajları:**
- ✅ Tamamen ücretsiz
- ✅ Otomatik SSL
- ✅ Hızlı CDN
- ✅ Otomatik deploy

---

### **2. HEROKU (Güvenilir)**

**Adımlar:**
1. [Heroku](https://heroku.com)'ya kaydolun
2. [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) indirin
3. Terminal'de:
   ```bash
   heroku login
   heroku create tetris-game-yourname
   git init
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```

**Avantajları:**
- ✅ Güvenilir platform
- ✅ Kolay yönetim
- ✅ Database desteği

---

### **3. RAILWAY (Hızlı)**

**Adımlar:**
1. [Railway](https://railway.app)'e GitHub ile giriş yapın
2. "New Project" → "Deploy from GitHub"
3. Repository seçin
4. Otomatik deploy!

**Avantajları:**
- ✅ Çok hızlı setup
- ✅ Modern interface
- ✅ Otomatik domain

---

### **4. RENDER (Alternatif)**

**Adımlar:**
1. [Render](https://render.com)'a kaydolun
2. "New" → "Web Service"
3. GitHub repo bağlayın
4. Build Command: `npm install`
5. Start Command: `npm start`

---

## 📋 Hızlı Başlangıç

### En Kolay Yol - Vercel:

1. **GitHub'a yükleyin:**
   - GitHub hesabı oluşturun
   - "New repository" oluşturun
   - Bu klasörü yükleyin

2. **Vercel'e deploy edin:**
   - vercel.com'a GitHub ile giriş yapın
   - Repository'yi seçin
   - Deploy butonuna basın

3. **Oyunu test edin:**
   - Vercel size bir URL verecek
   - O URL'e gidip oyunu test edin

## 🎮 Multiplayer Test

Deploy edildikten sonra:
1. Farklı cihazlardan/browserlardan siteye girin
2. Bir kişi oda oluştursun
3. Diğeri odaya katılsın
4. Multiplayer Tetris oynayın!

## 🔧 Sorun Giderme

### Build Hatası
- `npm install` çalışıyor mu kontrol edin
- Node.js version 14+ olduğundan emin olun

### Socket.IO Sorunu
- Platform'un WebSocket desteği var mı kontrol edin
- Browser console'da hata var mı bakın

### Domain Sorunu
- HTTPS kullanıyor musunuz kontrol edin
- CORS ayarları doğru mu bakın

## 📞 Yardım

Sorun yaşıyorsanız:
1. Browser F12 → Console'da hata mesajları var mı bakın
2. Platform'un documentation'ını okuyun
3. GitHub Issues'a sorabilirsiniz
