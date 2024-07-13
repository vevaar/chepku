// index.js
const express = require('express');
const cors = require('cors');
const { trimVideo } = require('./videoTrimmer');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Store active SSE connections
const clients = new Set();

app.post('/trim-video', async (req, res) => {
  const { videoUrl, startTime, endTime, trimVideo: shouldTrimVideo, trimAudio } = req.body;
  console.log('Received request to trim video:', { videoUrl, startTime, endTime, shouldTrimVideo, trimAudio });

  // Send initial response
  res.json({ message: 'Video trimming started' });

  const outputFileNameBase = `trimmed_${Date.now()}`;
  
  try {
    const trimmedFilePaths = await trimVideo(videoUrl, startTime, endTime, outputFileNameBase, shouldTrimVideo, trimAudio, 
      (message) => {
        // Send progress updates to all connected clients
        clients.forEach(client => client.res.write(`data: ${JSON.stringify({ message })}\n\n`));
      }
    );
    
    // Send completion message with all file paths
    clients.forEach(client => client.res.write(`data: ${JSON.stringify({ message: 'Trimming completed', filePaths: trimmedFilePaths })}\n\n`));
  } catch (error) {
    console.error('Error during trimming:', error);
    clients.forEach(client => client.res.write(`data: ${JSON.stringify({ error: 'An error occurred during trimming' })}\n\n`));
  }
});

app.get('/progress', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const client = { id: Date.now(), res };
  clients.add(client);

  req.on('close', () => {
    clients.delete(client);
  });
});

app.get('/download/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'output', filename);
  res.download(filePath, (err) => {
    if (err) {
      res.status(404).send('File not found');
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));