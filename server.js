// Simple HTTP server for development
const http = require('http');
const fs = require('fs');
const path = require('path');

// Allow specifying a different port via command line argument
// Example: node server.js 3001
const customPort = process.argv[2];
const PORT = customPort || process.env.PORT || 3000;
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    // Default to index.html for root path
    let filePath = '.' + (req.url === '/' ? '/index.html' : req.url);
    
    // Get the file extension
    const extname = path.extname(filePath);
    let contentType = MIME_TYPES[extname] || 'application/octet-stream';
    
    // Read the file
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // File not found
                fs.readFile('./index.html', (err, content) => {
                    if (err) {
                        res.writeHead(500);
                        res.end('Server Error');
                        return;
                    }
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(content, 'utf-8');
                });
            } else {
                // Server error
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            // Success
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Log requests for debugging
server.on('request', (req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('Press Ctrl+C to stop the server');
    
    // Display local IP addresses for network access
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    
    console.log('\nAvailable on:');
    Object.keys(nets).forEach((name) => {
        const net = nets[name];
        for (const netInterface of net) {
            if (netInterface.family === 'IPv4' && !netInterface.internal) {
                console.log(`  http://${netInterface.address}:${PORT}/`);
            }
        }
    });
});
