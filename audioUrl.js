// Dependencies
const ydl = require('youtube-dl');

// Extract info
function audioDetails(videoUrl) {
  return new Promise((resolve, reject) => {
    if (!videoUrl) {
      reject('Come on human, where is the video url?');
    }

    // Get all info of a video url
    ydl.getInfo(videoUrl, (err, info) => {
      if (err) reject('Could not get info!', err);
      const songName = info.title;
      const durationInSeconds = info._duration_raw;
      const bestQualityAudio = getBestAudio(info);
      resolve({
        songName,
        durationInSeconds,
        bestQualityAudio
      });
    });
  });
}

// Extract best quality audio
function getBestAudio(info) {
  // Get only results that contain audio only in their
  // format description
  const audioResultsOnly = info.formats.filter(result =>
    result.format.includes('audio only')
  );

  // Check the higher quality one of all audio urls
  const bestQualityAudio = audioResultsOnly.reduce(
    (bestAudio, currentResult) => {
      if (!('abr' in bestAudio)) {
        bestAudio = currentResult;
      }
      if (currentResult.abr > bestAudio.abr) {
        return currentResult;
      }
      return bestAudio;
    },
    {}
  );
  return bestQualityAudio.url;
}

// Exports
module.exports = {
  audioDetails
};
