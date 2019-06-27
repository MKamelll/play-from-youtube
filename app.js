// Dependencies
const { Bar, Presets } = require('cli-progress');
const { audioDetails } = require('./audioUrl');
const ffmpeg = require('fluent-ffmpeg');
const fetch = require('node-fetch');
const Speaker = require('speaker');
const lame = require('lame');

async function parseUrls() {
  // Parse the args for the url
  const audioUrl = 2 in process.argv ? process.argv[2] : false;
  await play(audioUrl);
}

// Play a song with the url
async function play(audioUrl) {
  if (!audioUrl) {
    return;
  }

  // Get details of a song from the audio url
  const songDetails = await audioDetails(audioUrl);

  // song name
  const songName = songDetails.songName;

  // Song length in seconds
  let songlengthInSeconds = songDetails.durationInSeconds;
  songlengthInSeconds = songlengthInSeconds + 1; // Add the additional second of the setTimeout
  let secondsPassed = 0;

  // Create a song stream from response body
  const response = await fetch(songDetails.bestQualityAudio.url);
  let body = response.body;
  body._readableState.highWaterMark = 65536;

  // progress bar
  const pbar = new Bar({}, Presets.shades_classic);
  const pbarTotal = songlengthInSeconds;

  // Show songName with the progress bar
  console.log(`\n#Playing: ${songName}`);
  // Start the bar
  pbar.start(pbarTotal, 0);

  // Create the Speaker instance
  const channels = 2;
  const bitDepth = 16;
  const speakerSampleRate = 44100;
  const speaker = new Speaker({
    channels, // 2 channels
    bitDepth, // 16-bit samples
    speakerSampleRate // 44,100 Hz sample rate
  });

  // Create the MP3 to PCM instance
  const mp3Decoder = new lame.Decoder();

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
  speaker.on('flush', () => {
    const secondsRemain = pbarTotal - secondsPassed;
    pbar.increment(secondsRemain);
    pbar.stop();
  });

  // Play
  const format = 'mp3';

  // Format incoming response into mp3 -> PCM -> speaker
  ffmpeg(body)
    .toFormat(format)
    .pipe(mp3Decoder)
    .pipe(speaker);
}

// Exports
module.exports = {
  parseUrls
};
