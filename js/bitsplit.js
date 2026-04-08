/**
 * bitsplit.js — browser decoder for bitsplit-encoded files.
 *
 * Usage:
 *   const bytes = await Bitsplit.decode(blockUrl, key);
 *   Bitsplit.showImage(blockUrl, key, imgElement);
 *   Bitsplit.playVideo(blockUrl, key, canvasElement);
 */

const Bitsplit = (() => {
  const KEY_BITS = 128n;
  const HEAD_LEN = 17;

  /**
   * Parse a bitsplit key string "data:count:size".
   */
  function parseKey(key) {
    const parts = key.trim().split(":");
    return {
      keyData: BigInt(parts[0]),
      count: Number(parts[1]),
      size: Number(parts[2]),
    };
  }

  /**
   * Convert a BigInt to a Uint8Array of exactly `len` bytes (big-endian).
   */
  function bigintToBytes(n, len) {
    const out = new Uint8Array(len);
    for (let i = len - 1; i >= 0; i--) {
      out[i] = Number(n & 0xffn);
      n >>= 8n;
    }
    return out;
  }

  /**
   * Decode a block (Uint8Array) with a key string. Returns Uint8Array.
   */
  function decodeBytes(block, key) {
    const { keyData, count, size } = parseKey(key);

    if (size <= 16 || count === 0) {
      return decodeSmall(keyData, count, size, block);
    }

    const totalBits = count + Number(KEY_BITS);
    const totalBytes = Math.ceil(totalBits / 8);
    const nz = size - totalBytes;
    const fb = totalBits - (totalBytes - 1) * 8;

    if (fb < 1 || fb > 8 || nz + HEAD_LEN > size) {
      return decodeBigint(keyData, count, size, block);
    }

    const expectedBlock = totalBytes - 16;
    const actualBlock = block.length;
    const missing = expectedBlock - actualBlock;

    const out = new Uint8Array(size);

    if (missing > 0) {
      // Old format: leading zeros were stripped
      const headInt = keyData << BigInt(fb);
      const headBytes = bigintToBytes(headInt, HEAD_LEN);
      out.set(headBytes, nz);
      if (block.length > 0) {
        out.set(block, nz + HEAD_LEN + missing - 1);
      }
    } else {
      // New streaming format
      const remainder = block[0];
      const headInt = (keyData << BigInt(fb)) | BigInt(remainder);
      const headBytes = bigintToBytes(headInt, HEAD_LEN);
      out.set(headBytes, nz);
      if (block.length > 1) {
        out.set(block.subarray(1), nz + HEAD_LEN);
      }
    }

    return out;
  }

  function decodeSmall(keyData, count, size, block) {
    let indices = 0n;
    for (let i = 0; i < block.length; i++) {
      indices = (indices << 8n) | BigInt(block[i]);
    }
    const number = (keyData << BigInt(count)) | indices;
    return bigintToBytes(number, size);
  }

  function decodeBigint(keyData, count, size, block) {
    return decodeSmall(keyData, count, size, block);
  }

  /**
   * Fetch a block from a URL and decode it.
   */
  async function decode(blockUrl, key) {
    const res = await fetch(blockUrl);
    if (!res.ok) throw new Error(`Failed to fetch block: ${res.status}`);
    const buf = await res.arrayBuffer();
    return decodeBytes(new Uint8Array(buf), key);
  }

  /**
   * Decode and display an image in an <img> element.
   */
  async function showImage(blockUrl, key, imgElement) {
    const bytes = await decode(blockUrl, key);
    const { size } = parseKey(key);

    // Detect MIME type from magic bytes
    const mime = detectMime(bytes);
    const blob = new Blob([bytes], { type: mime });
    const url = URL.createObjectURL(blob);

    imgElement.onload = () => URL.revokeObjectURL(url);
    imgElement.src = url;
  }

  /**
   * Decode and play a video on a <canvas> element.
   * Video is rendered frame-by-frame — no downloadable <video> src.
   */
  async function playVideo(blockUrl, key, canvas, options = {}) {
    const bytes = await decode(blockUrl, key);
    const mime = detectMime(bytes);
    const blob = new Blob([bytes], { type: mime });

    // Decode using hidden video + canvas rendering
    const video = document.createElement("video");
    video.muted = options.muted !== false;
    video.loop = options.loop || false;
    video.playsInline = true;

    const ctx = canvas.getContext("2d");
    const url = URL.createObjectURL(blob);
    video.src = url;

    // Block right-click on canvas
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    const controller = {
      video,
      play() { video.play(); },
      pause() { video.pause(); },
      seek(t) { video.currentTime = t; },
      get duration() { return video.duration; },
      get currentTime() { return video.currentTime; },
      get paused() { return video.paused; },
      destroy() {
        video.pause();
        video.src = "";
        URL.revokeObjectURL(url);
      },
    };

    function render() {
      if (!video.paused && !video.ended) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
      }
      requestAnimationFrame(render);
    }

    video.addEventListener("loadeddata", () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      render();
      if (options.autoplay !== false) video.play();
    });

    // Audio support: create audio context from the video
    if (!options.muted) {
      try {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(video);
        source.connect(audioCtx.destination);
      } catch (e) {
        // Audio not supported or blocked
      }
    }

    return controller;
  }

  /**
   * Detect MIME type from file magic bytes.
   */
  function detectMime(bytes) {
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
    if (bytes[0] === 0x89 && bytes[1] === 0x50) return "image/png";
    if (bytes[0] === 0x47 && bytes[1] === 0x49) return "image/gif";
    if (bytes[0] === 0x52 && bytes[1] === 0x49) return "image/webp";
    // Video
    if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70)
      return "video/mp4";
    if (bytes[0] === 0x1a && bytes[1] === 0x45) return "video/webm";
    return "application/octet-stream";
  }

  return { decode, decodeBytes, showImage, playVideo, parseKey };
})();

if (typeof module !== "undefined") module.exports = Bitsplit;
