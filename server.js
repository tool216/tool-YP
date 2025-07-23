const express = require('express');
const axios = require('axios');
const ytdl = require('ytdl-core');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// API to get video info
app.get('/api/videoinfo', async (req, res) => {
    try {
        const videoUrl = req.query.url;
        if (!ytdl.validateURL(videoUrl)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        const info = await ytdl.getInfo(videoUrl);
        const formats = ytdl.filterFormats(info.formats, 'videoandaudio');
        
        const result = {
            title: info.videoDetails.title,
            thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
            duration: info.videoDetails.lengthSeconds,
            formats: formats.map(format => ({
                quality: format.qualityLabel || 'Audio',
                type: format.mimeType.split(';')[0],
                url: format.url,
                itag: format.itag
            }))
        };

        res.json(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch video info' });
    }
});

// API to download video
app.get('/api/download', async (req, res) => {
    try {
        const videoUrl = req.query.url;
        const itag = req.query.itag;
        
        if (!ytdl.validateURL(videoUrl)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        const info = await ytdl.getInfo(videoUrl);
        const format = ytdl.chooseFormat(info.formats, { quality: itag });
        
        res.header('Content-Disposition', `attachment; filename="${info.videoDetails.title}.mp4"`);
        ytdl(videoUrl, { format: format }).pipe(res);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to download video' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
