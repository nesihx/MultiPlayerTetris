@echo off
echo Tetris Multiplayer Game - Deploy Hazirlik
echo ==========================================
echo.
echo cPanel'de Node.js desteği olmadığı için alternatif hosting seçenekleri:
echo.

@echo off
echo Tetris Multiplayer Game - Deploy Hazirlik
echo ==========================================
echo.
echo cPanel'de Node.js desteği olmadığı için alternatif hosting seçenekleri:
echo.

echo 1. RAILWAY (ÖNERİLEN - SOCKET.IO DESTEKLİ)
echo ==========================================
echo - railway.app'e GitHub ile giriş yapın
echo - New Project + Deploy from GitHub
echo - Repository'yi seçin
echo - WebSocket tam destekli!
echo.

echo 2. RENDER (ÜCRETSİZ - SOCKET.IO DESTEKLİ)
echo =========================================
echo - render.com'a kaydolun
echo - GitHub repo bağlayın
echo - Web Service olarak deploy edin
echo - WebSocket tam destekli!
echo.

echo 3. CYCLIC (KOLAY VE HIZLI)
echo ===========================
echo - cyclic.sh'e GitHub ile giriş yapın
echo - Repository'yi seçip deploy edin
echo - Socket.IO uyumlu!
echo.

echo 4. HEROKU (PAYLİ AMA İSTİKRARLI)
echo ================================
echo - heroku.com'a kaydolun
echo - Heroku CLI indirin
echo - Bu klasörde: heroku create app-name
echo - git push heroku main
echo.

echo 5. VERCEL (SINIRLI SOCKET.IO DESTEĞİ)
echo =====================================
echo - vercel.com'a GitHub ile giriş yapın
echo - Repository'yi seçip deploy edin
echo - NOT: WebSocket sınırlı, polling modunda çalışır
echo.

REM GitHub için hazırlık
echo.
echo 6. GitHub Repository Hazırlığı
echo ==============================
echo - Tüm dosyalar hazırlandı (.gitignore, Procfile, vercel.json, .nvmrc)
echo - Socket.IO bağlantı sorunları düzeltildi
echo - HTML form sorunları çözüldü
echo - Bu klasörü GitHub'a yükleyin
echo - Yukarıdaki platformlardan birini seçin
echo.
echo ÖNERİ: Railway veya Render kullanın, çünkü WebSocket tam destekli!
echo.

echo DOSYALAR HAZIR! GitHub'a yükleyebilirsiniz.
echo.
echo SORUN GİDERME:
echo - Eğer Vercel'de sorun yaşıyorsanız Railway deneyin
echo - Bağlantı kopma sorunları için sayfa yenileme otomatik
echo - Form hatası düzeltildi (password fieldları artık form içinde)
echo.
pause
