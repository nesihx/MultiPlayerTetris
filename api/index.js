const path = require('path');
const fs = require('fs');

module.exports = (req, res) => {
    try {
        let filePath;
        
        // URL'ye göre dosya yolunu belirle
        if (req.url === '/' || req.url === '/index.html') {
            filePath = path.join(__dirname, '../public/index.html');
        } else {
            // Static dosyalar için
            const cleanUrl = req.url.split('?')[0]; // Query string'i kaldır
            filePath = path.join(__dirname, '../public', cleanUrl);
        }
        
        // Dosya var mı kontrol et
        if (!fs.existsSync(filePath)) {
            res.status(404).json({ error: 'File not found' });
            return;
        }
        
        // Dosya tipine göre content-type belirle
        const ext = path.extname(filePath).toLowerCase();
        const contentTypes = {
            '.html': 'text/html',
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.svg': 'image/svg+xml',
            '.gif': 'image/gif',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.ico': 'image/x-icon'
        };
        
        const contentType = contentTypes[ext] || 'application/octet-stream';
        
        // Dosyayı oku ve gönder
        const fileContent = fs.readFileSync(filePath);
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.status(200).send(fileContent);
        
    } catch (error) {
        console.error('Static file serve error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
