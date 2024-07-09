const ffmpeg = require('fluent-ffmpeg');
const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');

async function trimVideo(videoUrl, startTime, endTime, outputFileName) {
  return new Promise(async (resolve, reject) => {
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    const outputPath = path.join(outputDir, outputFileName);
    const tempOutputPath = path.join(outputDir, `temp_${outputFileName}`);

    try {
      console.log('Starting video download...');
      
      // Download the entire video first
      await youtubedl(videoUrl, {
        output: tempOutputPath,
        format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
      });

      console.log('Video downloaded successfully. Checking file...');

      // Check if the file exists and has content
      if (!fs.existsSync(tempOutputPath) || fs.statSync(tempOutputPath).size === 0) {
        throw new Error('Downloaded file is missing or empty');
      }

      console.log('File check passed. Starting trimming process...');

      // Use FFmpeg to trim the video
      await new Promise((ffmpegResolve, ffmpegReject) => {
        ffmpeg(tempOutputPath)
          .setStartTime(startTime)
          .setDuration(endTime - startTime)
          .output(outputPath)
          .on('progress', (progress) => {
            console.log(`Processing: ${progress.percent ? progress.percent.toFixed(1) : 'N/A'}% done`);
          })
          .on('end', () => {
            console.log('Video trimming finished');
            ffmpegResolve();
          })
          .on('error', (err) => {
            console.error('FFmpeg error:', err);
            ffmpegReject(err);
          })
          .run();
      });

      // Delete the temporary full video file
      fs.unlinkSync(tempOutputPath);

      console.log('Temporary file deleted. Process complete.');
      resolve(outputPath);
    } catch (error) {
      console.error('Error in trimVideo:', error);
      reject(error);
    }
  });
}

module.exports = { trimVideo };