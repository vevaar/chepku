// server.js
const express = require('express');
const cors = require('cors');
const { trimVideo } = require('./videoTrimmer');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/trim-video', async (req, res) => {
  try {
    const { videoUrl, startTime, endTime } = req.body;
    console.log('Received request to trim video:', { videoUrl, startTime, endTime });

    // Send an immediate response
    res.json({ message: 'Video trimming request received. Processing started.' });

    // Start the trimming process
    const outputFileName = `trimmed_${Date.now()}.mp4`;
    const trimmedVideoPath = await trimVideo(videoUrl, startTime, endTime, outputFileName);
    
    console.log('Video trimming completed. File saved at:', trimmedVideoPath);
  } catch (error) {
    console.error('Error during video trimming:', error);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

