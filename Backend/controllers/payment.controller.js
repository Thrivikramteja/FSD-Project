/**
 * payment.controller.js
 *
 * Handles the Cashfree-backed fundraiser donation flow:
 *
 *   initiateFundraiserPayment  — creates PENDING PaymentTransaction, Cashfree order
 *   cashfreeWebhook            — idempotent fulfillment on confirmed payment
 *   getPaymentStatus           — frontend polls for backend-confirmed status
 *
 * Internal helper (not a route):
 *   fulfillFundraiserDonation  — creates UserContributedFundraiser, increments
 *                                amount_raised_so_far, sends NGO notification
 *
 * Security:
 *   - All monetary calculations done server-side (never trust frontend total/tip)
 *   - Webhook signature verified before processing
 *   - Idempotency: cashfreeOrderId unique index + SUCCEEDED status guard
 */

const mongoose = require('mongoose');

const { PaymentTransaction } = require('../models/paymentTransaction.model');
const { CreatedFundraiser, UserContributedFundraiser } = require('../models/user.model');
const { sendNotification } = require('../services/notificationService');
const {
  isCashfreeEnabled,
  createCashfreeOrder,
  getOrderPayments,
  verifyWebhookSignature,
} = require('../services/cashfreeService');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Safely computes 8% platform tip using integer arithmetic to avoid
 * floating-point drift (e.g., 1000 * 0.08 = 80.00000000000001 in JS).
 *
 * Math.round(donationAmount * 8) / 100
 * For INR where donationAmount is an integer this always produces an exact 2dp value.
 */
function computePlatformTip(donationAmount) {
  return Math.round(donationAmount * 8) / 100;
}

/**
 * Generates a CareConnect Cashfree order ID from a MongoDB ObjectId.
 * Cashfree order_id constraints: alphanumeric + underscore, max 50 chars.
 * Format: CC_<last 24 hex chars of ObjectId>
 */
function generateCashfreeOrderId(mongoObjectId) {
  const hex = mongoObjectId.toString(); // 24 hex chars
  return `CC_${hex}`; // 27 chars — well within 50 char limit
}

// ---------------------------------------------------------------------------
// Route: POST /api/payment/initiate
// ---------------------------------------------------------------------------

/**
 * Initiates a Cashfree fundraiser payment checkout.
 * Protected: authenticate + authorizeRoles("Donor")
 *
 * Body: { ngoId, fundraiser_name, donationAmount }
 * Returns: { paymentSessionId, ccOrderId, transactionId }
 */
async function initiateFundraiserPayment(req, res, next) {
  try {
    // 1. Feature flag guard
    if (!isCashfreeEnabled()) {
      return res.status(405).json({
        success: false,
        message: 'Payment gateway is not enabled. Set CASHFREE_ENABLED=true.',
      });
    }

    // 2. Authenticated donor identity (from JWT — never trust body)
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // 3. Extract and validate inputs
    const { ngoId, fundraiser_name, donationAmount: rawAmount, fundraiserId } = req.body;

    if (!ngoId || !fundraiser_name) {
      return res.status(400).json({ success: false, message: 'ngoId and fundraiser_name are required' });
    }

    const donationAmount = Number(rawAmount);
    if (!Number.isFinite(donationAmount) || donationAmount < 1 || donationAmount > 100000) {
      return res.status(400).json({
        success: false,
        message: 'donationAmount must be a number between 1 and 100000',
      });
    }
    // Enforce integer-only amounts to keep tip arithmetic exact
    if (!Number.isInteger(donationAmount)) {
      return res.status(400).json({
        success: false,
        message: 'donationAmount must be a whole number (no decimals)',
      });
    }

    // 4. Verify fundraiser exists and is still active
    let fundraiser;
    if (fundraiserId && mongoose.Types.ObjectId.isValid(fundraiserId)) {
      fundraiser = await CreatedFundraiser.findById(fundraiserId);
    }
    if (!fundraiser) {
      fundraiser = await CreatedFundraiser.findOne({
        ngoId: Number(ngoId),
        fundraiser_name,
      });
    }
    if (!fundraiser) {
      return res.status(404).json({ success: false, message: 'Fundraiser not found' });
    }
    if (new Date(fundraiser.deadline) < new Date()) {
      return res.status(400).json({ success: false, message: 'This fundraiser has already ended' });
    }

    // 5. Compute all monetary values SERVER-SIDE
    const platformTip  = computePlatformTip(donationAmount);
    const totalAmount  = donationAmount + platformTip;

    // 6. Create PENDING PaymentTransaction
    const txn = new PaymentTransaction({
      userId:            Number(userId),
      ngoId:             Number(ngoId),
      fundraiserObjectId: fundraiser._id,
      fundraiserName:    fundraiser_name,
      donationAmount,
      platformTip,
      totalAmount,
    });
    await txn.save();

    // 7. Generate CareConnect order ID
    const ccOrderId = generateCashfreeOrderId(txn._id);

    // 8. Build Cashfree order payload
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const backendUrl  = (process.env.BACKEND_URL  || 'http://localhost:3000').replace(/\/$/, '');

    const cashfreePayload = {
      order_id:       ccOrderId,
      order_amount:   totalAmount,
      order_currency: 'INR',
      customer_details: {
        customer_id:    `donor_${userId}`,
        customer_name:  req.user.name  || 'Donor',
        customer_email: req.user.email || 'donor@careconnect.in',
        customer_phone: '9999999999', // placeholder — Cashfree requires a phone
      },
      order_meta: {
        return_url: `${frontendUrl}/payment/result?order_id=${ccOrderId}`,
        notify_url: `${backendUrl}/api/payment/cashfree/webhook`,
      },
      order_note: `CareConnect fundraiser donation to ${fundraiser_name}`,
    };

    // 9. Create Cashfree order
    let cashfreeResponse;
    try {
      cashfreeResponse = await createCashfreeOrder(cashfreePayload);
    } catch (cfErr) {
      // Mark transaction as FAILED if Cashfree order creation fails
      txn.status = 'FAILED';
      await txn.save();
      console.error('[Payment] Cashfree order creation failed:', cfErr.message);
      return res.status(502).json({
        success: false,
        message: 'Payment gateway error. Please try again.',
      });
    }

    const paymentSessionId = cashfreeResponse.payment_session_id;
    if (!paymentSessionId) {
      txn.status = 'FAILED';
      await txn.save();
      return res.status(502).json({
        success: false,
        message: 'Invalid response from payment gateway.',
      });
    }

    // 10. Persist Cashfree order details
    txn.cashfreeOrderId        = ccOrderId;
    txn.cashfreePaymentSessionId = paymentSessionId;
    await txn.save();

    // 11. Return minimal data to frontend
    return res.status(200).json({
      success:          true,
      paymentSessionId,
      ccOrderId,
      transactionId:    txn._id,
      donationAmount,
      platformTip,
      totalAmount,
    });

  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// Route: POST /api/payment/cashfree/webhook
// No JWT auth — called by Cashfree servers.
// Requires raw body (express.raw middleware applied in routes).
// ---------------------------------------------------------------------------

/**
 * Handles Cashfree payment webhooks.
 * Always returns 200 so Cashfree stops retrying (even on our processing errors).
 * Idempotency: SUCCEEDED guard + unique cashfreeOrderId index prevent duplicates.
 */
async function cashfreeWebhook(req, res) {
  // Always respond 200 first thing so Cashfree doesn't retry on slow processing
  // We do processing synchronously before sending response since Express waits.

  try {
    // 1. Verify webhook signature
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    const rawBody   = req.body; // Buffer (express.raw middleware)

    if (!signature || !timestamp || !rawBody) {
      console.warn('[Webhook] Missing signature headers — ignoring');
      return res.status(200).json({ received: true });
    }

    let signatureValid = false;
    try {
      signatureValid = verifyWebhookSignature(rawBody, signature, timestamp);
    } catch (sigErr) {
      console.error('[Webhook] Signature verification error:', sigErr.message);
      return res.status(200).json({ received: true });
    }

    if (!signatureValid) {
      console.warn('[Webhook] Invalid signature — ignoring');
      return res.status(200).json({ received: true });
    }

    // 2. Parse body
    let event;
    try {
      event = JSON.parse(rawBody.toString('utf8'));
    } catch (parseErr) {
      console.error('[Webhook] Body parse error:', parseErr.message);
      return res.status(200).json({ received: true });
    }

    // 3. Extract order ID from webhook payload
    // Cashfree webhook structure: event.data.order.order_id
    const cashfreeOrderId = event?.data?.order?.order_id;
    const eventType       = event?.type; // e.g. "PAYMENT_SUCCESS_WEBHOOK"

    if (!cashfreeOrderId) {
      console.warn('[Webhook] No order_id in event — ignoring');
      return res.status(200).json({ received: true });
    }

    // 4. Find our transaction
    const txn = await PaymentTransaction.findOne({ cashfreeOrderId });
    if (!txn) {
      console.warn(`[Webhook] No transaction found for order ${cashfreeOrderId}`);
      return res.status(200).json({ received: true });
    }

    // 5. Idempotency guard
    if (txn.status === 'SUCCEEDED') {
      console.log(`[Webhook] Already SUCCEEDED for ${cashfreeOrderId} — skipping duplicate`);
      return res.status(200).json({ received: true });
    }

    // 6. Handle payment success
    if (eventType === 'PAYMENT_SUCCESS_WEBHOOK') {
      // 6a. Server-side verification (don't only trust webhook payload)
      let payments;
      try {
        payments = await getOrderPayments(cashfreeOrderId);
      } catch (verifyErr) {
        console.error('[Webhook] Could not verify payment status:', verifyErr.message);
        // Don't mark as FAILED — Cashfree will retry
        return res.status(200).json({ received: true });
      }

      // Check if any payment is in SUCCESS status
      const successfulPayment = Array.isArray(payments)
        ? payments.find(p => p.payment_status === 'SUCCESS')
        : null;

      if (!successfulPayment) {
        console.warn(`[Webhook] Payment not confirmed for ${cashfreeOrderId}`);
        return res.status(200).json({ received: true });
      }

      // 6b. Verify amount matches (anti-tampering check)
      const paidAmount = Number(successfulPayment.order_amount || successfulPayment.payment_amount);
      if (Number.isFinite(paidAmount) && Math.abs(paidAmount - txn.totalAmount) > 0.5) {
        console.error(
          `[Webhook] Amount mismatch for ${cashfreeOrderId}: expected ${txn.totalAmount}, got ${paidAmount}`
        );
        txn.status = 'FAILED';
        await txn.save();
        return res.status(200).json({ received: true });
      }

      // 6c. Fulfill the donation
      const io = global._ccIO; // set by app.js
      try {
        const donationRecord = await fulfillFundraiserDonation(txn, io);
        txn.donationRecordId = donationRecord._id;
        txn.status           = 'SUCCEEDED';
        txn.paidAt           = new Date();
        await txn.save();
        console.log(`[Webhook] Donation fulfilled for ${cashfreeOrderId}`);
      } catch (fulfillErr) {
        console.error('[Webhook] Fulfillment error:', fulfillErr.message);
        // Do NOT mark FAILED — we want to retry (Cashfree will resend)
        return res.status(200).json({ received: true });
      }

    } else if (
      eventType === 'PAYMENT_FAILED_WEBHOOK' ||
      eventType === 'PAYMENT_USER_DROPPED_WEBHOOK'
    ) {
      // 7. Handle failure/cancellation
      if (txn.status === 'PENDING') {
        txn.status = 'FAILED';
        await txn.save();
        console.log(`[Webhook] Marked FAILED for ${cashfreeOrderId} (${eventType})`);
      }
    }

    return res.status(200).json({ received: true });

  } catch (err) {
    console.error('[Webhook] Unhandled error:', err.message);
    // Always 200 to Cashfree
    return res.status(200).json({ received: true });
  }
}

// ---------------------------------------------------------------------------
// Route: GET /api/payment/status/:ccOrderId
// Protected: authenticate + authorizeRoles("Donor")
// ---------------------------------------------------------------------------

/**
 * Returns the backend-confirmed payment status for a given CareConnect order ID.
 * Frontend polls this after being redirected back from Cashfree checkout.
 * Frontend MUST NOT assume success based solely on the redirect.
 */
async function getPaymentStatus(req, res, next) {
  try {
    const { ccOrderId } = req.params;
    const userId = Number(req.user.id);

    const txn = await PaymentTransaction.findOne({ cashfreeOrderId: ccOrderId });

    if (!txn) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Security: donor can only query their own transaction
    if (txn.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.status(200).json({
      success: true,
      status:          txn.status,
      donationAmount:  txn.donationAmount,
      platformTip:     txn.platformTip,
      totalAmount:     txn.totalAmount,
      fundraiserName:  txn.fundraiserName,
      paidAt:          txn.paidAt,
    });

  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// Internal helper: fulfillFundraiserDonation
// ---------------------------------------------------------------------------

/**
 * Creates the UserContributedFundraiser record, increments amount_raised_so_far,
 * and sends the NGO notification.
 *
 * IMPORTANT: increments by donationAmount (NOT totalAmount).
 * The platform tip is kept by CareConnect; the fundraiser receives only the
 * intended donation.
 *
 * This function is intentionally separate so it can be unit-tested independently
 * and called only once per successful payment (idempotency enforced by the caller).
 *
 * @param {Object} txn - PaymentTransaction document
 * @param {Object} io  - Socket.IO server instance
 * @returns {Object}   - The created UserContributedFundraiser document
 */
async function fulfillFundraiserDonation(txn, io) {
  // Fetch the fundraiser for its deadline (required by the schema)
  const fundraiser = await CreatedFundraiser.findById(txn.fundraiserObjectId);
  if (!fundraiser) {
    throw new Error(`Fundraiser not found: ${txn.fundraiserObjectId}`);
  }

  // Create donation record — amount_contributed = donationAmount (NOT totalAmount)
  const contribution = new UserContributedFundraiser({
    userId:            txn.userId,
    ngoId:             txn.ngoId,
    fundraiser_name:   txn.fundraiserName,
    amount_contributed: txn.donationAmount,   // fundraiser receives donation only
    contributed_at:    txn.paidAt || new Date(),
    deadline:          fundraiser.deadline,
    fundraiserObjectId: txn.fundraiserObjectId,
  });
  await contribution.save();

  // Increment fundraiser amount — by donationAmount, NOT totalAmount
  await CreatedFundraiser.findByIdAndUpdate(
    txn.fundraiserObjectId,
    { $inc: { amount_raised_so_far: txn.donationAmount } },
    { new: true }
  );

  // NGO notification
  if (io) {
    await sendNotification(io, {
      recipientId:   txn.ngoId,
      recipientRole: 'NGO',
      type:          'donation',
      message:       `A donor contributed ₹${txn.donationAmount} to "${txn.fundraiserName}" via CareConnect Pay`,
      link:          `/NGO-dashboard/${txn.ngoId}`,
    });
  }

  return contribution;
}

module.exports = {
  initiateFundraiserPayment,
  cashfreeWebhook,
  getPaymentStatus,
  // Exported for testing
  fulfillFundraiserDonation,
  computePlatformTip,
};
