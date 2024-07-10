// server.js
const express = require('express');
const cors = require('cors');
const { trimVideo } = require('./videoTrimmer');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/trim-video', async (req, res) => {
  try {
    const { videoUrl, startTime, endTime } = req.body;
    console.log('Received request to trim video:', { videoUrl, startTime, endTime });

    const outputFileName = `trimmed_${Date.now()}.mp4`;
    const trimmedVideoPath = await trimVideo(videoUrl, startTime, endTime, outputFileName);
    
    console.log('Video trimming completed. File saved at:', trimmedVideoPath);
    
    // Send the file path to the client
    res.json({ message: 'Video trimming completed', filePath: path.basename(trimmedVideoPath) });
  } catch (error) {
    console.error('Error during video trimming:', error);
    res.status(500).json({ error: 'An error occurred during video trimming' });
  }
});
// New endpoint for downloading the trimmed video
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

