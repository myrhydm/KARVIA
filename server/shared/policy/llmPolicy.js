/**
 * LLM Policy Ticket Verification (iBrain-issued tickets)
 *
 * Lightweight verifier that enforces presence and basic validity of
 * short-lived JWT tickets when IBRAIN_ENFORCE_LLM_POLICY=true.
 *
 * If jsonwebtoken is available and IBRIAN_POLICY_SECRET is set, we verify
 * signatures (HS256). Otherwise, we perform best-effort parsing and expiry checks.
 */

let jwt = null;
try {
  // Optional dependency; engines may not all depend on jsonwebtoken
  jwt = require('jsonwebtoken');
} catch (_) {
  jwt = null;
}

function base64UrlDecode(str) {
  try {
    const pad = '='.repeat((4 - (str.length % 4)) % 4);
    const b64 = (str + pad).replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(b64, 'base64').toString('utf8');
  } catch (e) {
    return null;
  }
}

function parseJwtUnsafe(token) {
  if (!token || typeof token !== 'string' || token.split('.').length < 2) return null;
  const parts = token.split('.');
  const payloadStr = base64UrlDecode(parts[1]);
  if (!payloadStr) return null;
  try {
    return JSON.parse(payloadStr);
  } catch (e) {
    return null;
  }
}

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

async function enforceOrThrow(ticket, expectedAudience = 'planner-llm') {
  const enforce = String(process.env.IBRAIN_ENFORCE_LLM_POLICY || '').toLowerCase() === 'true';
  if (!enforce) return { enforced: false, allowed: true };

  if (!ticket) {
    throw new Error('LLM policy: missing plan ticket (X-Plan-Ticket)');
  }

  const secret = process.env.IBRAIN_POLICY_SECRET;
  if (jwt && secret) {
    try {
      const decoded = jwt.verify(ticket, secret, { algorithms: ['HS256'] });
      if (expectedAudience && decoded.aud && decoded.aud !== expectedAudience) {
        throw new Error(`LLM policy: invalid audience (expected ${expectedAudience})`);
      }
      if (decoded.allowLLM === false) {
        throw new Error('LLM policy: LLM not allowed for this request');
      }
      return { enforced: true, allowed: true, claims: decoded };
    } catch (err) {
      throw new Error(`LLM policy: ticket verification failed - ${err.message}`);
    }
  }

  // Fallback: best-effort payload checks without signature verification
  const payload = parseJwtUnsafe(ticket);
  if (!payload) {
    throw new Error('LLM policy: invalid ticket format');
  }
  if (payload.exp && payload.exp < nowSeconds()) {
    throw new Error('LLM policy: ticket expired');
  }
  if (expectedAudience && payload.aud && payload.aud !== expectedAudience) {
    throw new Error(`LLM policy: invalid audience (expected ${expectedAudience})`);
  }
  if (payload.allowLLM === false) {
    throw new Error('LLM policy: LLM not allowed for this request');
  }
  return { enforced: true, allowed: true, claims: payload };
}

module.exports = { enforceOrThrow };

