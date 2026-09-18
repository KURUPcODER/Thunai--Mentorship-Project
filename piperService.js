const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });
if (!process.env.PIPER_MODEL_PATH && fs.existsSync(path.resolve(__dirname, '.env.example'))) {
  dotenv.config({ path: path.resolve(__dirname, '.env.example') });
}

/**
 * Resolves the appropriate python executable command on the machine.
 */
function getPythonExecutable() {
  if (process.env.PIPER_PYTHON_PATH && fs.existsSync(process.env.PIPER_PYTHON_PATH)) {
    return process.env.PIPER_PYTHON_PATH;
  }
  const candidates = [
    'C:\\Program Files\\Python311\\python.exe',
    'python',
    'python3'
  ];
  for (const cand of candidates) {
    try {
      const res = spawnSync(cand, ['-m', 'piper', '--help'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
      });
      if (res.status === 0 || (res.stdout && res.stdout.includes('piper'))) {
        return cand;
      }
    } catch (e) {}
  }
  return 'python';
}

/**
 * Synthesizes Malayalam text to WAV audio buffer using local Piper TTS.
 * @param {string} text - Malayalam text to synthesize
 * @returns {Promise<Buffer>} WAV audio buffer
 */
async function synthesizePiper(text) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new Error('Invalid or missing text parameter for Piper TTS.');
  }

  const modelPath = (process.env.PIPER_MODEL_PATH || '').trim();
  if (!modelPath) {
    throw new Error('PIPER_MODEL_PATH environment variable is not configured.');
  }

  if (!fs.existsSync(modelPath)) {
    throw new Error(`Piper model file not found at PIPER_MODEL_PATH: ${modelPath}`);
  }

  const pythonExe = getPythonExecutable();
  const uniqueId = Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  const tempDir = os.tmpdir();
  const inFile = path.join(tempDir, `piper_in_${uniqueId}.txt`).replace(/\\/g, '/');
  const outFile = path.join(tempDir, `piper_out_${uniqueId}.wav`).replace(/\\/g, '/');

  try {
    // Write Malayalam text as UTF-8 with trailing newline so Piper reads it completely
    const cleanText = text.trim() + '\n';
    fs.writeFileSync(inFile, cleanText, 'utf8');

    const cleanModelPath = modelPath.replace(/\\/g, '/');
    const res = spawnSync(pythonExe, [
      '-m', 'piper',
      '-m', cleanModelPath,
      '-i', inFile,
      '-f', outFile
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
      timeout: 30000
    });

    if (res.error) {
      throw new Error(`Piper process execution error: ${res.error.message}`);
    }

    if (res.status !== 0) {
      const stderr = res.stderr ? res.stderr.trim() : 'Unknown process exit code';
      throw new Error(`Piper process failed with exit code ${res.status}: ${stderr}`);
    }

    if (!fs.existsSync(outFile)) {
      throw new Error('Piper process completed but output WAV file was not created.');
    }

    const audioBuffer = fs.readFileSync(outFile);
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('Piper generated an empty WAV file.');
    }

    return audioBuffer;

  } finally {
    // Guaranteed cleanup of temporary input and output files
    try {
      if (fs.existsSync(inFile)) fs.unlinkSync(inFile);
    } catch (e) {}
    try {
      if (fs.existsSync(outFile)) fs.unlinkSync(outFile);
    } catch (e) {}
  }
}

module.exports = {
  synthesizePiper,
  getPythonExecutable
};
