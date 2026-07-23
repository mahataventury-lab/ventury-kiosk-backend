const crypto = require("crypto");

/** Generates a random device token (64 hex chars), like the example in the runbook. */
function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

/** Hashes a token with SHA-256 for storage, so raw tokens never sit in the DB. */
function hashToken(token) {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

/** Constant-time comparison to avoid timing side-channels on token checks. */
function safeEqual(a, b) {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = { generateToken, hashToken, safeEqual };
