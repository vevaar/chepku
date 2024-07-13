// server.js
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
  const { videoUrl, startTime, endTime } = req.body;
  console.log('Received request to trim video:', { videoUrl, startTime, endTime });

  // Send initial response
  res.json({ message: 'Video trimming started' });

  const outputFileName = `trimmed_${Date.now()}.mp4`;
  
  try {
    const trimmedVideoPath = await trimVideo(videoUrl, startTime, endTime, outputFileName, 
      (message) => {
        // Send progress updates to all connected clients
        clients.forEach(client => client.res.write(`data: ${JSON.stringify({ message })}\n\n`));
      }
    );
    
    // Send completion message
    clients.forEach(client => client.res.write(`data: ${JSON.stringify({ message: 'Video trimming completed', filePath: path.basename(trimmedVideoPath) })}\n\n`));
  } catch (error) {
    console.error('Error during video trimming:', error);
    clients.forEach(client => client.res.write(`data: ${JSON.stringify({ error: 'An error occurred during video trimming' })}\n\n`));
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

