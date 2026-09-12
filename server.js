const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1. Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 2. Sarvam AI Malayalam TTS Endpoint
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
    if (!apiKey) {
      return res.status(500).json({
        error: 'Sarvam API key is not configured on backend server.'
      });
    }

    const selectedSpeaker = speaker || 'kavitha';

    // Call Sarvam AI Text-to-Speech API
    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey
      },
      body: JSON.stringify({
        inputs: [text.trim()],
        target_language_code: 'ml-IN',
        speaker: selectedSpeaker,
        model: 'bulbul:v3'
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return res.status(502).json({
        error: `Sarvam API request failed with status ${response.status}`,
        details: response.status === 401 ? 'Authentication failed' : 'Upstream TTS error'
      });
    }

    const data = await response.json();
    const base64Audio = data && Array.isArray(data.audios) ? data.audios[0] : null;

    if (!base64Audio) {
      return res.status(502).json({
        error: 'Sarvam API did not return valid audio data.'
      });
    }

    const audioBuffer = Buffer.from(base64Audio, 'base64');
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Length', audioBuffer.length);
    return res.send(audioBuffer);

  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return res.status(504).json({ error: 'Sarvam TTS request timed out after 10 seconds.' });
    }
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
