import crypto from "node:crypto";

export function createSecret() {
  return crypto.randomBytes(32);
}

export function encryptSecret(secret: Buffer) {
  if (!process.env.WEBHOOK_SECRET_ENC_KEY) {
    throw new Error("WEBHOOK_SECRET_ENC_KEY is not set");
  }

  const nonce = crypto.randomBytes(12);
  const key = Buffer.from(process.env.WEBHOOK_SECRET_ENC_KEY, "base64");

  const cipher = crypto.createCipheriv("aes-256-gcm", key, nonce);
  const ct = Buffer.concat([cipher.update(secret), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ct: Buffer.concat([ct, tag]),
    nonce,
  };
}

export function decryptSecret(ct: Buffer, nonce: Buffer): Buffer {
  if (!process.env.WEBHOOK_SECRET_ENC_KEY) {
    throw new Error("WEBHOOK_SECRET_ENC_KEY is not set");
  }

  const key = Buffer.from(process.env.WEBHOOK_SECRET_ENC_KEY, "base64");

  const authTag = ct.subarray(-16);
  const ciphertext = ct.subarray(0, -16);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, nonce);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
