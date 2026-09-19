/**
 * cashfreeService.js
 *
 * Thin wrapper around the Cashfree Payments API (sandbox mode).
 * All credentials are read from environment variables at call-time so that
 * the application boots safely when CASHFREE_ENABLED=false (no credentials
 * required at startup).
 *
 * Cashfree API version targeted: 2025-01-01
 * Sandbox base URL: https://sandbox.cashfree.com/pg
 *
 * Webhook signature scheme (current Cashfree docs):
 *   HMAC-SHA256( timestamp + rawBody, CASHFREE_SECRET_KEY )
 *   The result is compared to the x-webhook-signature header.
 */

const crypto = require('crypto');
const https  = require('https');

// ---------------------------------------------------------------------------
// Feature flag
// ---------------------------------------------------------------------------

/**
 * Returns true only when CASHFREE_ENABLED is explicitly set to "true".
 * Defaults to false so the app boots safely without credentials.
 */
function isCashfreeEnabled() {
  return process.env.CASHFREE_ENABLED === 'true';
}

// ---------------------------------------------------------------------------
// Internal HTTP helper (avoids adding axios/got as a dependency for two calls)
// ---------------------------------------------------------------------------

function cashfreeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const appId     = process.env.CASHFREE_APP_ID     || '';
    const secretKey = process.env.CASHFREE_SECRET_KEY || '';
    const apiVersion = process.env.CASHFREE_API_VERSION || '2025-01-01';
    const env       = process.env.CASHFREE_ENV        || 'sandbox';

    // Sandbox base: api.sandbox.cashfree.com  Production base: api.cashfree.com
    const hostname = env === 'production'
      ? 'api.cashfree.com'
      : 'sandbox.cashfree.com';

    const payload = body ? JSON.stringify(body) : '';

    const options = {
      hostname,
      port: 443,
      path: `/pg${path}`,
      method,
      headers: {
        'Content-Type':  'application/json',
        'x-api-version': apiVersion,
        'x-client-id':   appId,
        'x-client-secret': secretKey,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            const err = new Error(
              parsed.message || `Cashfree API error ${res.statusCode}`
            );
            err.statusCode = res.statusCode;
            err.cashfreeResponse = parsed;
            reject(err);
          }
        } catch (parseErr) {
          reject(new Error(`Cashfree response parse error: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Creates a Cashfree order and returns the response including payment_session_id.
 *
 * @param {Object} payload - Order payload per Cashfree Create Order API
 * @returns {Promise<Object>} - Cashfree order object { order_id, payment_session_id, ... }
 */
async function createCashfreeOrder(payload) {
  return cashfreeRequest('POST', '/orders', payload);
}

/**
 * Fetches all payments for a given Cashfree order_id.
 * Use this server-side to confirm payment status instead of trusting client redirects.
 *
 * @param {string} cashfreeOrderId
 * @returns {Promise<Array>} - Array of payment objects
 */
async function getOrderPayments(cashfreeOrderId) {
  return cashfreeRequest('GET', `/orders/${encodeURIComponent(cashfreeOrderId)}/payments`, null);
}

/**
 * Verifies a Cashfree webhook signature.
 *
 * Cashfree current signature scheme (as per official docs):
 *   HMAC-SHA256( timestamp + rawBody, CASHFREE_SECRET_KEY )
 *   where timestamp is the value of the x-webhook-timestamp header.
 *   The resulting digest is base64-encoded and compared to x-webhook-signature.
 *
 * @param {string|Buffer} rawBody    - Raw request body (before JSON parsing)
 * @param {string}        signature  - Value of x-webhook-signature header
 * @param {string}        timestamp  - Value of x-webhook-timestamp header
 * @returns {boolean}
 */
function verifyWebhookSignature(rawBody, signature, timestamp) {
  const secretKey = process.env.CASHFREE_SECRET_KEY || '';
  const bodyStr   = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
  const data      = timestamp + bodyStr;
  const computed  = crypto
    .createHmac('sha256', secretKey)
    .update(data)
    .digest('base64');
  return crypto.timingSafeEqual(
    Buffer.from(computed),
    Buffer.from(signature)
  );
}

module.exports = {
  isCashfreeEnabled,
  createCashfreeOrder,
  getOrderPayments,
  verifyWebhookSignature,
};
