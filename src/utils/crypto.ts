// src/utils/crypto.ts
// Standard FIPS 180-4 SHA-256 implementation in pure TypeScript for TraceRoot.
// Works seamlessly in React Native Hermes, Expo Go, Web, and Node.js with zero native dependencies.

function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

export function sha256(ascii: string): string {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i: number;
  let j: number;
  let result = '';

  const words: number[] = [];

  // Initial hash value: first 32 bits of the fractional parts of the square roots of the first 8 primes
  let hash: number[] = [];
  // Round constants: first 32 bits of the fractional parts of the cube roots of the first 64 primes
  const k: number[] = [];

  let primeCounter = 0;
  const isComposite: Record<number, boolean> = {};

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = candidate * candidate; i < 312; i += candidate) {
        isComposite[i] = true;
      }
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      }
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter++;
    }
  }

  // Pre-processing (Padding)
  const utf8Bytes: number[] = [];
  for (i = 0; i < ascii.length; i++) {
    const code = ascii.charCodeAt(i);
    if (code < 128) {
      utf8Bytes.push(code);
    } else if (code < 2048) {
      utf8Bytes.push(192 | (code >> 6), 128 | (code & 63));
    } else if (code < 55296 || code >= 57344) {
      utf8Bytes.push(224 | (code >> 12), 128 | ((code >> 6) & 63), 128 | (code & 63));
    } else {
      i++;
      const code2 = 65536 + (((code & 1023) << 10) | (ascii.charCodeAt(i) & 1023));
      utf8Bytes.push(
        240 | (code2 >> 18),
        128 | ((code2 >> 12) & 63),
        128 | ((code2 >> 6) & 63),
        128 | (code2 & 63)
      );
    }
  }

  const utf8BitLength = utf8Bytes.length * 8;
  utf8Bytes.push(128); // Append a single '1' bit
  while ((utf8Bytes.length + 8) % 64 !== 0) {
    utf8Bytes.push(0);
  }

  // Append length in bits as 64-bit big-endian integer (high 32 bits, then low 32 bits)
  const highBits = Math.floor(utf8BitLength / 0x100000000);
  const lowBits = utf8BitLength >>> 0;

  utf8Bytes.push((highBits >>> 24) & 255);
  utf8Bytes.push((highBits >>> 16) & 255);
  utf8Bytes.push((highBits >>> 8) & 255);
  utf8Bytes.push(highBits & 255);

  utf8Bytes.push((lowBits >>> 24) & 255);
  utf8Bytes.push((lowBits >>> 16) & 255);
  utf8Bytes.push((lowBits >>> 8) & 255);
  utf8Bytes.push(lowBits & 255);

  for (i = 0; i < utf8Bytes.length; i += 4) {
    words.push(
      (utf8Bytes[i] << 24) |
      (utf8Bytes[i + 1] << 16) |
      (utf8Bytes[i + 2] << 8) |
      utf8Bytes[i + 3]
    );
  }

  // Process each 512-bit chunk (16 32-bit words)
  const w: number[] = new Array(64);
  for (i = 0; i < words.length; i += 16) {
    for (j = 0; j < 16; j++) {
      w[j] = words[i + j];
    }
    for (j = 16; j < 64; j++) {
      const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
      const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
      w[j] = (((w[j - 16] + s0) | 0) + ((w[j - 7] + s1) | 0)) | 0;
    }

    let a = hash[0];
    let b = hash[1];
    let c = hash[2];
    let d = hash[3];
    let e = hash[4];
    let f = hash[5];
    let g = hash[6];
    let h = hash[7];

    for (j = 0; j < 64; j++) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (((((h + s1) | 0) + ch) | 0) + ((k[j] + w[j]) | 0)) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >>> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }

  return result;
}

export interface RecordIntegrityPayload {
  harvestId: string;
  farmerId: string;
  stage: string;
  activityType: string;
  timestamp: string;
  inputs?: any;
  conditions?: any;
  notes?: string;
  latitude?: number | null;
  longitude?: number | null;
  photoUrl?: string | null;
  isCorrection?: boolean;
  correctsId?: string | null;
  previousHash?: string | null;
}

/**
 * Computes canonical SHA-256 integrity hash for an append-only TraceRoot cultivation record.
 */
export function generateRecordIntegrityHash(payload: RecordIntegrityPayload): string {
  const canonicalString = JSON.stringify({
    harvestId: payload.harvestId,
    farmerId: payload.farmerId,
    stage: payload.stage.toLowerCase(),
    activityType: payload.activityType.trim(),
    timestamp: payload.timestamp,
    inputs: payload.inputs || null,
    conditions: payload.conditions || null,
    notes: payload.notes?.trim() || '',
    lat: payload.latitude !== undefined && payload.latitude !== null ? Number(payload.latitude).toFixed(6) : null,
    lng: payload.longitude !== undefined && payload.longitude !== null ? Number(payload.longitude).toFixed(6) : null,
    photoUrl: payload.photoUrl || null,
    isCorrection: !!payload.isCorrection,
    correctsId: payload.correctsId || null,
    previousHash: payload.previousHash || null,
  });

  return sha256(canonicalString);
}
