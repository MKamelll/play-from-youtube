// Dependencies
const { Bar, Presets } = require('cli-progress');
const mm = require('music-metadata');
const { Decoder } = require('lame');
const Speaker = require('speaker');
const fs = require('fs');
const { PassThrough } = require('stream');
// Play a song wuth the path
(async function play(songPath) {
  if (!songPath) {
    return;
  }

  // Create a song read stream
  const songStream = fs.createReadStream(songPath);
  const songSize = fs.statSync(songPath).size;
  const mimeType = 'audio/mp3';

  // Song length in seconds
  let songlengthInSeconds = await getSonglength(songPath, mimeType, songSize);
  songlengthInSeconds = songlengthInSeconds + 1; // Add the additional second of the setTimeout
  let secondsPassed = 0;

  // progress bar
  const pbar = new Bar({}, Presets.shades_classic);
  const pbarTotal = songlengthInSeconds;

  // Start the bar
  pbar.start(pbarTotal, 0);

  // Create the Speaker instance
  const speaker = new Speaker({
    channels: 2, // 2 channels
    bitDepth: 16, // 16-bit samples
    sampleRate: 44100 // 44,100 Hz sample rate
  });

  // Create the MP3 to PCM instance
  const decoder = new Decoder();

  // Update the progress bar every second
  setInterval(() => {
    secondsPassed += 1;
    pbar.update(secondsPassed);
  }, 1000);

  /*
   * Add the remaining seconds after the stream ends
   * because otherwise it gets stuck at 98% and guessing
   * that the stream ends the script with a proccess exit
   * before running last intervals
   */
  songStream.on('close', () => {
    const secondsRemain = pbarTotal - secondsPassed;
    setTimeout(() => {
      pbar.increment(secondsRemain);
      pbar.stop();
    }, 1000);
  });

  const log = new PassThrough();
  log.on('data', chunk => {
    console.log(chunk.length);
  });

  // Play
  songStream
    .pipe(log)
    .pipe(decoder)
    .pipe(speaker);
})('song.mp3');

// Get the song size
function getSonglength(songPath, mimeType, songSize) {
  return new Promise((resolve, reject) => {
    if (!songPath || !mimeType || !songSize) {
      reject('Not all paramaters to get song size 😢');
    }

    // Parse the audio file and returns an object
    // with the format.duration to get duration
    // in seconds
    mm.parseFile(songPath, mimeType, { fileSize: songSize })
      .then(metaData => {
        // prettier-ignore
        const songDuration = parseInt(metaData.format.duration);
        resolve(songDuration);
      })
      .catch(e => reject(e));
  });
}
