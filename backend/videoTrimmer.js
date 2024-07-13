const ffmpeg = require('fluent-ffmpeg');
const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');

async function trimVideo(videoUrl, startTime, endTime, outputFileNameBase, trimVideo, trimAudio, progressCallback) {
  return new Promise(async (resolve, reject) => {
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    const tempOutputPath = path.join(outputDir, `temp_${outputFileNameBase}.mp4`);

    try {
      progressCallback('Starting video download...');
      
      await youtubedl(videoUrl, {
        output: tempOutputPath,
        format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
      });

      progressCallback('Video downloaded successfully. Starting trimming process...');

      const trimmedFilePaths = [];

      if (trimVideo) {
        const videoOutputPath = path.join(outputDir, `${outputFileNameBase}_video.mp4`);
        await trimVideoWithAudio(tempOutputPath, videoOutputPath, startTime, endTime, progressCallback);
        trimmedFilePaths.push(path.basename(videoOutputPath));
      }

      if (trimAudio) {
        const audioOutputPath = path.join(outputDir, `${outputFileNameBase}_audio.mp3`);
        await extractAudio(tempOutputPath, audioOutputPath, startTime, endTime, progressCallback);
        trimmedFilePaths.push(path.basename(audioOutputPath));
      }

      fs.unlinkSync(tempOutputPath);

      progressCallback('Temporary file deleted. Process complete.');
      resolve(trimmedFilePaths);
    } catch (error) {
      console.error('Error in trimVideo:', error);
      reject(error);
    }
  });
}

async function trimVideoWithAudio(inputPath, outputPath, startTime, endTime, progressCallback) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(endTime - startTime)
      .output(outputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .on('progress', (progress) => {
        progressCallback(`Processing video with audio: ${progress.percent ? progress.percent.toFixed(1) : 'N/A'}% done`);
      })
      .on('end', () => {
        progressCallback('Video trimming with audio finished');
        resolve();
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        reject(err);
      })
      .run();
  });
}

async function extractAudio(inputPath, outputPath, startTime, endTime, progressCallback) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(endTime - startTime)
      .noVideo()
      .audioCodec('libmp3lame')
      .output(outputPath)
      .on('progress', (progress) => {
        progressCallback(`Processing audio: ${progress.percent ? progress.percent.toFixed(1) : 'N/A'}% done`);
      })
      .on('end', () => {
        progressCallback('Audio extraction finished');
        resolve();
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        reject(err);
      })
      .run();
  });
}

module.exports = { trimVideo };