// Minimal standalone pure-JS PNG generator for 16, 32, 48, 128 icons
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createSolidPNG(width, height, r, g, b, a = 255) {
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      // create a sleek rounded look with gold border
      const isBorder = (x <= 1 || x >= width - 2 || y <= 1 || y >= height - 2);
      const isCenter = Math.hypot(x - width/2, y - height/2) < width * 0.35;
      
      if (isBorder) {
        rawData[pxOffset] = 245;     // Gold R
        rawData[pxOffset + 1] = 197; // Gold G
        rawData[pxOffset + 2] = 24;  // Gold B
        rawData[pxOffset + 3] = 255;
      } else if (isCenter) {
        rawData[pxOffset] = 56;      // Cyan/Sky R
        rawData[pxOffset + 1] = 189; // Cyan/Sky G
        rawData[pxOffset + 2] = 248; // Cyan/Sky B
        rawData[pxOffset + 3] = 255;
      } else {
        rawData[pxOffset] = r;
        rawData[pxOffset + 1] = g;
        rawData[pxOffset + 2] = b;
        rawData[pxOffset + 3] = a;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);

    // CRC
    let crc = 0xFFFFFFFF;
    for (let i = 4; i < 8 + len; i++) {
      const byte = buf[i];
      for (let j = 0; j < 8; j++) {
        if ((crc ^ byte) & 1) {
          crc = (crc >>> 1) ^ 0xEDB88320;
        } else {
          crc = crc >>> 1;
        }
      }
    }
    buf.writeInt32BE(~crc, 8 + len);
    return buf;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconSizes = [16, 32, 48, 128];
const iconsDir = path.join(__dirname, 'extension', 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

iconSizes.forEach(size => {
  const pngBuf = createSolidPNG(size, size, 11, 15, 25, 255); // near-black navy #0B0F19
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), pngBuf);
  console.log(`Generated icon-${size}.png`);
});
