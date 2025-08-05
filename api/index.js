import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function handler(req, res) {
    try {
        let filePath;
        const { file } = req.query;
        
        // URL'ye göre dosya yolunu belirle
        if (file) {
            // Query parameter'dan gelen dosya
            filePath = path.join(__dirname, '../public', file);
        } else if (req.url === '/' || req.url === '/index.html') {
            filePath = path.join(__dirname, '../public/index.html');
        } else {
            // Static dosyalar için
            const cleanUrl = req.url.split('?')[0]; // Query string'i kaldır
            filePath = path.join(__dirname, '../public', cleanUrl);
        }
        
        // Security check - public klasörü dışına çıkmayı engelle
        const publicDir = path.join(__dirname, '../public');
        const resolvedPath = path.resolve(filePath);
        const resolvedPublicDir = path.resolve(publicDir);
        
        if (!resolvedPath.startsWith(resolvedPublicDir)) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        
        // Dosya var mı kontrol et
        if (!fs.existsSync(filePath)) {
            // Index.html'e fallback
            if (!file) {
                filePath = path.join(__dirname, '../public/index.html');
                if (!fs.existsSync(filePath)) {
                    res.status(404).json({ error: 'File not found' });
                    return;
                }
            } else {
                res.status(404).json({ error: 'File not found' });
                return;
            }
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
}
