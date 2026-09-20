const express = require('express');
const router  = express.Router();

const authenticate    = require('../middlewares/auth.middleware');
const authorizeRoles  = require('../middlewares/role.middleware');
const {
  initiateFundraiserPayment,
  cashfreeWebhook,
  getPaymentStatus,
} = require('../controllers/payment.controller');

/**
 * POST /api/payment/cashfree/webhook
 *
 * Called by Cashfree servers — NO JWT authentication.
 * Uses express.raw() so the raw body is available for HMAC-SHA256 signature
 * verification. This route must be registered BEFORE express.json() processes
 * the request body (handled in app.js by mounting the raw router first).
 */
router.post(
  '/api/payment/cashfree/webhook',
  express.raw({ type: 'application/json' }),
  cashfreeWebhook
);

/**
 * POST /api/payment/initiate
 * Protected: Donor only.
 * Body: { ngoId, fundraiser_name, donationAmount }
 * Returns: { paymentSessionId, ccOrderId, transactionId, donationAmount, platformTip, totalAmount }
 */
router.post(
  '/api/payment/initiate',
  authenticate,
  authorizeRoles('Donor'),
  initiateFundraiserPayment
);

/**
 * GET /api/payment/status/:ccOrderId
 * Protected: Donor only.
 * Frontend polls this after returning from Cashfree checkout to get
 * backend-confirmed payment status.
 */
router.get(
  '/api/payment/status/:ccOrderId',
  authenticate,
  authorizeRoles('Donor'),
  getPaymentStatus
);

module.exports = router;
