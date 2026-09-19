const mongoose = require('mongoose');

/**
 * PaymentTransaction — tracks every fundraiser payment attempt through Cashfree.
 *
 * Lifecycle:
 *   PENDING  → created when checkout is initiated
 *   SUCCEEDED → webhook confirms successful payment, donation record is created
 *   FAILED   → webhook reports failure or explicit cancellation
 *
 * Idempotency:
 *   cashfreeOrderId has a unique sparse index so duplicate webhooks for the same
 *   order cannot produce duplicate fulfilled donations.
 */
const paymentTransactionSchema = new mongoose.Schema(
  {
    /** CareConnect donor userId (numeric) */
    userId: {
      type: Number,
      required: true,
      index: true,
    },

    /** NGO ngoId (numeric) */
    ngoId: {
      type: Number,
      required: true,
    },

    /** ObjectId of the CreatedFundraiser document */
    fundraiserObjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CreatedFundraiser',
      required: true,
    },

    /** Fundraiser name — stored for audit without requiring a join */
    fundraiserName: {
      type: String,
      required: true,
    },

    /**
     * The amount the donor intended for the fundraiser (in INR).
     * This is the amount stored in UserContributedFundraiser.amount_contributed
     * and added to CreatedFundraiser.amount_raised_so_far.
     */
    donationAmount: {
      type: Number,
      required: true,
      min: 1,
    },

    /**
     * Platform tip = 8% of donationAmount, computed server-side.
     * This is an ADDITIONAL charge on top of donationAmount.
     * It is NOT deducted from the fundraiser contribution.
     */
    platformTip: {
      type: Number,
      required: true,
      min: 0,
    },

    /**
     * Total charged to the donor = donationAmount + platformTip.
     * This is the amount sent to Cashfree for actual payment processing.
     */
    totalAmount: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      default: 'INR',
    },

    /** PENDING | SUCCEEDED | FAILED */
    status: {
      type: String,
      enum: ['PENDING', 'SUCCEEDED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },

    /**
     * Cashfree order_id (e.g. "CC_<id>").
     * Unique sparse index: a null value is allowed (before Cashfree order is
     * created), but once set, no two transactions may share the same order ID.
     * This is the primary idempotency key for webhook processing.
     */
    cashfreeOrderId: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },

    /** payment_session_id returned by Cashfree Create Order */
    cashfreePaymentSessionId: {
      type: String,
    },

    /**
     * ObjectId of the UserContributedFundraiser document created on success.
     * Null until the donation is fulfilled.
     */
    donationRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserContributedFundraiser',
      default: null,
    },

    /** Timestamp when the payment was confirmed by Cashfree */
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
  }
);

const PaymentTransaction = mongoose.model('PaymentTransaction', paymentTransactionSchema);

module.exports = { PaymentTransaction };
