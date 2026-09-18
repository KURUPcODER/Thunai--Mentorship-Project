const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/**
 * Utility: Split text into chunks of at most maxLen characters,
 * respecting sentence and word boundaries for Malayalam text.
 */
function splitTextIntoChunks(text, maxLen = 450) {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) {
    return [trimmed];
  }

  // Split into sentences / paragraphs using common punctuation (. ? ! । \n)
  const sentences = trimmed.split(/(?<=[.?!।\n])\s+/);
  const chunks = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if (!sentence) continue;

    if (sentence.length > maxLen) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }
      const words = sentence.split(/\s+/);
      for (const word of words) {
        if (!word) continue;
        if (word.length > maxLen) {
          let remainingWord = word;
          while (remainingWord.length > 0) {
            chunks.push(remainingWord.slice(0, maxLen));
            remainingWord = remainingWord.slice(maxLen);
          }
        } else if ((currentChunk + " " + word).trim().length > maxLen) {
          chunks.push(currentChunk.trim());
          currentChunk = word;
        } else {
          currentChunk = currentChunk ? currentChunk + " " + word : word;
        }
      }
    } else if ((currentChunk + " " + sentence).trim().length > maxLen) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk = currentChunk ? currentChunk + " " + sentence : sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(c => c.length > 0);
}

/**
 * Utility: Combine multiple WAV audio buffers into a single valid WAV buffer.
 */
function combineWavBuffers(buffers) {
  if (!buffers || buffers.length === 0) return Buffer.alloc(0);
  if (buffers.length === 1) return buffers[0];

  function getPcmPayload(buf) {
    const dataIdx = buf.indexOf('data');
    if (dataIdx !== -1 && dataIdx + 8 <= buf.length) {
      const dataSize = buf.readUInt32LE(dataIdx + 4);
      return buf.subarray(dataIdx + 8, Math.min(buf.length, dataIdx + 8 + dataSize));
    }
    return buf.subarray(44);
  }

  const pcmPayloads = buffers.map(getPcmPayload);
  const totalPcmSize = pcmPayloads.reduce((sum, p) => sum + p.length, 0);

  const header = Buffer.from(buffers[0].subarray(0, 44));
  if (header.length >= 44) {
    header.writeUInt32LE(totalPcmSize + 36, 4);
    const dataIdx = header.indexOf('data');
    if (dataIdx !== -1 && dataIdx + 8 <= header.length) {
      header.writeUInt32LE(totalPcmSize, dataIdx + 4);
    }
  }

  return Buffer.concat([header, ...pcmPayloads]);
}

const { synthesizePiper } = require('./piperService');

// 1. Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 2. Sarvam AI Malayalam TTS Endpoint (with local Piper TTS fallback)
app.post('/api/tts', async (req, res) => {
  try {
    const { text, language, speaker } = req.body || {};

    if (language === 'en') {
      return res.status(400).json({
        error: 'English TTS is handled client-side via Web Speech API. Do not send English TTS requests to backend.'
      });
    }

    if (language !== 'ml') {
      return res.status(400).json({
        error: 'Unsupported language. Only Malayalam ("ml") TTS is supported by backend.'
      });
    }

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        error: 'Invalid or missing "text" parameter.'
      });
    }

    const apiKey = (process.env.SARVAM_API_KEY || '').trim();
    let sarvamError = null;

    // STEP A: Try Sarvam Primary if API key exists
    if (apiKey) {
      try {
        const selectedSpeaker = speaker || 'kavitha';
        const textChunks = splitTextIntoChunks(text, 450);

        const chunkPromises = textChunks.map(async (chunk) => {
          const response = await fetch('https://api.sarvam.ai/text-to-speech', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-subscription-key': apiKey
            },
            body: JSON.stringify({
              inputs: [chunk],
              target_language_code: 'ml-IN',
              speaker: selectedSpeaker,
              model: 'bulbul:v3'
            }),
            signal: AbortSignal.timeout(10000)
          });

          if (!response.ok) {
            const errText = await response.text().catch(() => '(could not read body)');
            const logLine = `[${new Date().toISOString()}] Sarvam FAILED — HTTP ${response.status} ${response.statusText}\nBody: ${errText}\n---\n`;
            fs.appendFileSync('sarvam_debug.log', logLine);

            const err = new Error(`Sarvam API request failed with status ${response.status}`);
            err.status = response.status;
            throw err;
          }

          const data = await response.json();
          const base64Audio = data && Array.isArray(data.audios) ? data.audios[0] : null;

          if (!base64Audio) {
            throw new Error('Sarvam API did not return valid audio data.');
          }

          return Buffer.from(base64Audio, 'base64');
        });

        const audioBuffers = await Promise.all(chunkPromises);
        const finalAudioBuffer = combineWavBuffers(audioBuffers);

        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Content-Length', finalAudioBuffer.length);
        res.setHeader('X-TTS-Provider', 'sarvam-primary');
        return res.send(finalAudioBuffer);
      } catch (err) {
        sarvamError = err.message || 'Sarvam synthesis failed';
        console.warn(`[TTS Fallback] Sarvam AI failed (${sarvamError}). Attempting local Piper fallback...`);
      }
    } else {
      sarvamError = 'Sarvam API key not configured';
      console.warn(`[TTS Fallback] Sarvam API key missing. Attempting local Piper fallback...`);
    }

    // STEP B: Fallback to Piper TTS
    try {
      const piperAudioBuffer = await synthesizePiper(text);
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Length', piperAudioBuffer.length);
      res.setHeader('X-TTS-Provider', 'piper-fallback');
      return res.status(200).send(piperAudioBuffer);
    } catch (piperErr) {
      console.error(`[TTS Fallback Error] Piper TTS also failed: ${piperErr.message}`);
      return res.status(502).json({
        error: 'All Malayalam TTS providers failed.',
        sarvamError: sarvamError,
        piperError: piperErr.message
      });
    }

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error processing TTS request.' });
  }
});

// Preserve static preview server behavior
app.get('/', (req, res) => {
  res.redirect('/extension/preview.html');
});

app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Thunai Server & Preview running at http://localhost:${PORT}/extension/preview.html`);
});
