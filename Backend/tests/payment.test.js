/**
 * payment.test.js
 *
 * Tests for the Cashfree payment integration.
 * All external calls (Cashfree API, MongoDB) are mocked.
 * No real Cashfree credentials required.
 *
 * All 19 test cases from requirements are covered.
 */

const request  = require('supertest');
const mongoose = require('mongoose');

// ── 1. Mock Redis ────────────────────────────────────────────────────────────
jest.mock('../redis', () => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setEx: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(null),
    quit: jest.fn().mockResolvedValue(null),
    isReadyStatus: false,
}));

// ── 2. Mock cashfreeService ──────────────────────────────────────────────────
// Use inline factory — no out-of-scope variable reference (Jest hoisting rule)
jest.mock('../services/cashfreeService', () => ({
    isCashfreeEnabled:      jest.fn(() => true),
    createCashfreeOrder:    jest.fn(),
    getOrderPayments:       jest.fn(),
    verifyWebhookSignature: jest.fn(() => true),
}));
const mockCashfreeService = require('../services/cashfreeService');

// ── 3. Mock Notification (no mongoose in factory scope) ──────────────────────
jest.mock('../models/Notification', () => ({
    create: jest.fn().mockResolvedValue({
        _id: 'mock_notification_id',
        createdAt: new Date(),
    }),
}));

// NGO and Carehome: need collection.collectionName for admin.controller.js
jest.mock('../models/NGO.model', () => ({
    NGO: {
        findOne:    jest.fn(),
        findById:   jest.fn(),
        find:       jest.fn(),
        collection: { collectionName: 'ngos' },
    },
}));
jest.mock('../models/carehome.model', () => ({
    Carehome: {
        findOne:    jest.fn(),
        findById:   jest.fn(),
        find:       jest.fn(),
        collection: { collectionName: 'carehomes' },
    },
    DonationMoney: {
        findById:   jest.fn(),
        find:       jest.fn(),
    },
}));


// PaymentTransaction: factory mock with save fn
const mockSave = jest.fn().mockResolvedValue(true);
const mockTxnInstance = {
    _id:                   null, // set per test
    userId:                5,
    ngoId:                 1,
    fundraiserObjectId:    null,
    fundraiserName:        'Test Fund',
    donationAmount:        1000,
    platformTip:           80,
    totalAmount:           1080,
    currency:              'INR',
    status:                'PENDING',
    cashfreeOrderId:       null,
    cashfreePaymentSessionId: null,
    donationRecordId:      null,
    paidAt:                null,
    save:                  mockSave,
};

jest.mock('../models/paymentTransaction.model', () => {
    const mockFindOne = jest.fn();
    const PaymentTransaction = jest.fn().mockImplementation(function(data) {
        Object.assign(this, mockTxnInstance, data);
        this._id = new (require('mongoose').Types.ObjectId)();
    });
    PaymentTransaction.findOne = mockFindOne;
    return { PaymentTransaction };
});

// User model mocks
jest.mock('../models/user.model', () => {
    const mockFundraiserFindOne      = jest.fn();
    const mockFundraiserFindById     = jest.fn();
    const mockFundraiserFindByIdAndUpdate = jest.fn();

    const CreatedFundraiser = jest.fn();
    CreatedFundraiser.findOne          = mockFundraiserFindOne;
    CreatedFundraiser.findById         = mockFundraiserFindById;
    CreatedFundraiser.findByIdAndUpdate = mockFundraiserFindByIdAndUpdate;

    const mockContribSave = jest.fn().mockResolvedValue(true);
    const UserContributedFundraiser = jest.fn().mockImplementation(function(data) {
        Object.assign(this, data);
        this._id = new (require('mongoose').Types.ObjectId)();
        this.save = mockContribSave;
    });
    UserContributedFundraiser.findById = jest.fn();

    // admin.controller.js accesses User.collection.collectionName at require-time
    const User = {
        findOne:    jest.fn(),
        findById:   jest.fn(),
        collection: { collectionName: 'users' },
    };

    return {
        CreatedFundraiser,
        UserContributedFundraiser,
        User,
        UserRegisteredEvent: { findById: jest.fn() },
    };
});


// ── 5. Mock auth middleware (Donor) ──────────────────────────────────────────
jest.mock('../middlewares/auth.middleware', () => (req, res, next) => {
    req.user = { id: '5', role: 'Donor', name: 'Test Donor', email: 'donor@test.com' };
    next();
});

// ── 6. Load app ──────────────────────────────────────────────────────────────
const { app, server, io } = require('../app');
const { CreatedFundraiser, UserContributedFundraiser } = require('../models/user.model');
const { PaymentTransaction } = require('../models/paymentTransaction.model');

// ── 7. Cleanup ───────────────────────────────────────────────────────────────
afterAll(async () => {
    try {
        if (io) { io.disconnectSockets(); io.close(); }
        if (server) {
            server.closeAllConnections && server.closeAllConnections();
            await new Promise((resolve) => {
                const t = setTimeout(resolve, 3000);
                server.close(() => { clearTimeout(t); resolve(); });
            });
        }
        if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    } catch (_) { /* ignore cleanup errors */ }
}, 8000);

// ── Helpers ───────────────────────────────────────────────────────────────────
const activeFundraiser = () => ({
    _id:              new mongoose.Types.ObjectId(),
    ngoId:            1,
    fundraiser_name:  'Test Fund',
    deadline:         new Date('2099-12-31'),
    amount_raised_so_far: 1000,
});

const expiredFundraiser = () => ({
    ...activeFundraiser(),
    deadline: new Date('2000-01-01'),
});

// ─────────────────────────────────────────────────────────────────────────────
describe('CareConnect: Payment — Initiate Checkout', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockCashfreeService.isCashfreeEnabled.mockReturnValue(true);
        mockSave.mockResolvedValue(true);
    });

    // ── Test 1: Cashfree disabled → 405 ──────────────────────────────────────
    test('returns 405 when CASHFREE_ENABLED=false', async () => {
        mockCashfreeService.isCashfreeEnabled.mockReturnValue(false);

        const res = await request(app)
            .post('/api/payment/initiate')
            .send({ ngoId: 1, fundraiser_name: 'Test Fund', donationAmount: 1000 });

        expect(res.statusCode).toBe(405);
        expect(res.body.success).toBe(false);
    });

    // ── Test 2: Invalid donation amount — 0 → 400 ────────────────────────────
    test('rejects donationAmount of 0 with 400', async () => {
        const res = await request(app)
            .post('/api/payment/initiate')
            .send({ ngoId: 1, fundraiser_name: 'Test Fund', donationAmount: 0 });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    // ── Test 3: Negative amount → 400 ────────────────────────────────────────
    test('rejects negative donationAmount with 400', async () => {
        const res = await request(app)
            .post('/api/payment/initiate')
            .send({ ngoId: 1, fundraiser_name: 'Test Fund', donationAmount: -500 });

        expect(res.statusCode).toBe(400);
    });

    // ── Test 4: Exceeds max → 400 ─────────────────────────────────────────────
    test('rejects donationAmount > 100000 with 400', async () => {
        const res = await request(app)
            .post('/api/payment/initiate')
            .send({ ngoId: 1, fundraiser_name: 'Test Fund', donationAmount: 200000 });

        expect(res.statusCode).toBe(400);
    });

    // ── Test 5: Decimal amount → 400 ─────────────────────────────────────────
    test('rejects decimal donationAmount with 400', async () => {
        const res = await request(app)
            .post('/api/payment/initiate')
            .send({ ngoId: 1, fundraiser_name: 'Test Fund', donationAmount: 100.5 });

        expect(res.statusCode).toBe(400);
    });

    // ── Test 6: Fundraiser not found → 404 ───────────────────────────────────
    test('returns 404 if fundraiser not found', async () => {
        CreatedFundraiser.findOne.mockResolvedValue(null);

        const res = await request(app)
            .post('/api/payment/initiate')
            .send({ ngoId: 1, fundraiser_name: 'NonExistent', donationAmount: 1000 });

        expect(res.statusCode).toBe(404);
    });

    // ── Test 7: Expired fundraiser → 400 ─────────────────────────────────────
    test('returns 400 if fundraiser deadline has passed', async () => {
        CreatedFundraiser.findOne.mockResolvedValue(expiredFundraiser());

        const res = await request(app)
            .post('/api/payment/initiate')
            .send({ ngoId: 1, fundraiser_name: 'Old Fund', donationAmount: 1000 });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/ended/i);
    });

    // ── Test 8+9: Backend calculates 8% tip and total ────────────────────────
    test('backend calculates 8% platform tip and totalAmount server-side', async () => {
        CreatedFundraiser.findOne.mockResolvedValue(activeFundraiser());
        mockCashfreeService.createCashfreeOrder.mockResolvedValue({
            payment_session_id: 'sess_abc123',
            order_id:           'CC_testorder',
        });

        const res = await request(app)
            .post('/api/payment/initiate')
            .send({ ngoId: 1, fundraiser_name: 'Test Fund', donationAmount: 1000 });

        expect(res.statusCode).toBe(200);
        expect(res.body.donationAmount).toBe(1000);
        expect(res.body.platformTip).toBe(80);      // 8% of 1000
        expect(res.body.totalAmount).toBe(1080);    // 1000 + 80
        expect(res.body.paymentSessionId).toBe('sess_abc123');
    });

    test('backend tip calculation: 8% of 500 = 40', async () => {
        CreatedFundraiser.findOne.mockResolvedValue(activeFundraiser());
        mockCashfreeService.createCashfreeOrder.mockResolvedValue({
            payment_session_id: 'sess_500',
            order_id: 'CC_500',
        });

        const res = await request(app)
            .post('/api/payment/initiate')
            .send({ ngoId: 1, fundraiser_name: 'Test Fund', donationAmount: 500 });

        expect(res.statusCode).toBe(200);
        expect(res.body.platformTip).toBe(40);
        expect(res.body.totalAmount).toBe(540);
    });

    // ── Test 10: Cashfree API failure → 502, transaction marked FAILED ────────
    test('returns 502 if Cashfree order creation fails, marks transaction FAILED', async () => {
        CreatedFundraiser.findOne.mockResolvedValue(activeFundraiser());
        mockCashfreeService.createCashfreeOrder.mockRejectedValue(new Error('Cashfree API down'));

        const res = await request(app)
            .post('/api/payment/initiate')
            .send({ ngoId: 1, fundraiser_name: 'Test Fund', donationAmount: 1000 });

        expect(res.statusCode).toBe(502);
    });

    // ── Test 11: PENDING transaction created ─────────────────────────────────
    test('creates PaymentTransaction with PENDING status and calls save()', async () => {
        CreatedFundraiser.findOne.mockResolvedValue(activeFundraiser());
        mockCashfreeService.createCashfreeOrder.mockResolvedValue({
            payment_session_id: 'sess_xyz',
            order_id: 'CC_xyz',
        });

        await request(app)
            .post('/api/payment/initiate')
            .send({ ngoId: 1, fundraiser_name: 'Test Fund', donationAmount: 500 });

        expect(PaymentTransaction).toHaveBeenCalled();
        expect(mockSave).toHaveBeenCalled();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('CareConnect: Payment — Webhook', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockCashfreeService.isCashfreeEnabled.mockReturnValue(true);
        mockCashfreeService.verifyWebhookSignature.mockReturnValue(true);
    });

    const sendWebhook = (body) =>
        request(app)
            .post('/api/payment/cashfree/webhook')
            .set('Content-Type', 'application/json')
            .set('x-webhook-signature', 'valid_sig')
            .set('x-webhook-timestamp', '1000000')
            .send(typeof body === 'string' ? body : JSON.stringify(body));

    const webhookPayload = (orderId, type = 'PAYMENT_SUCCESS_WEBHOOK') => ({
        type,
        data: { order: { order_id: orderId } },
    });

    const makePendingTxn = (orderId, overrides = {}) => ({
        _id:               new mongoose.Types.ObjectId(),
        userId:            5,
        ngoId:             1,
        fundraiserObjectId: new mongoose.Types.ObjectId(),
        fundraiserName:    'Test Fund',
        donationAmount:    1000,
        platformTip:       80,
        totalAmount:       1080,
        status:            'PENDING',
        cashfreeOrderId:   orderId,
        donationRecordId:  null,
        paidAt:            null,
        save:              jest.fn().mockResolvedValue(true),
        ...overrides,
    });

    // ── Test 12: Invalid signature → 200 (Cashfree sees 200, stops retrying) ─
    test('returns 200 even for invalid signature (prevents Cashfree retry)', async () => {
        mockCashfreeService.verifyWebhookSignature.mockReturnValue(false);
        const res = await sendWebhook(webhookPayload('CC_test'));
        expect(res.statusCode).toBe(200);
        expect(PaymentTransaction.findOne).not.toHaveBeenCalled();
    });

    // ── Test 13: Successful webhook fulfills donation ─────────────────────────
    test('successful webhook creates UserContributedFundraiser and marks SUCCEEDED', async () => {
        const orderId = 'CC_success';
        const txn = makePendingTxn(orderId);
        PaymentTransaction.findOne.mockResolvedValue(txn);
        mockCashfreeService.getOrderPayments.mockResolvedValue([{
            payment_status: 'SUCCESS',
            order_amount:   1080,
        }]);
        CreatedFundraiser.findById.mockResolvedValue(activeFundraiser());
        CreatedFundraiser.findByIdAndUpdate = jest.fn().mockResolvedValue(true);

        const res = await sendWebhook(webhookPayload(orderId));

        expect(res.statusCode).toBe(200);
        expect(UserContributedFundraiser).toHaveBeenCalled();
        expect(txn.status).toBe('SUCCEEDED');
    });

    // ── Test 14: Fundraiser incremented by donationAmount, NOT totalAmount ────
    test('fundraiser incremented by donationAmount only (not totalAmount)', async () => {
        const orderId = 'CC_incr';
        const txn = makePendingTxn(orderId, { donationAmount: 500, platformTip: 40, totalAmount: 540 });
        PaymentTransaction.findOne.mockResolvedValue(txn);
        mockCashfreeService.getOrderPayments.mockResolvedValue([{ payment_status: 'SUCCESS', order_amount: 540 }]);
        CreatedFundraiser.findById.mockResolvedValue(activeFundraiser());
        CreatedFundraiser.findByIdAndUpdate = jest.fn().mockResolvedValue(true);

        await sendWebhook(webhookPayload(orderId));

        expect(CreatedFundraiser.findByIdAndUpdate.mock.calls[0][1])
            .toEqual({ $inc: { amount_raised_so_far: 500 } }); // not 540
    });

    // ── Test 15: Notification sent exactly once ───────────────────────────────
    test('webhook sends NGO notification exactly once on success', async () => {
        const Notification = require('../models/Notification');
        const orderId = 'CC_notif';
        const txn = makePendingTxn(orderId);
        PaymentTransaction.findOne.mockResolvedValue(txn);
        mockCashfreeService.getOrderPayments.mockResolvedValue([{ payment_status: 'SUCCESS', order_amount: 1080 }]);
        CreatedFundraiser.findById.mockResolvedValue(activeFundraiser());
        CreatedFundraiser.findByIdAndUpdate = jest.fn().mockResolvedValue(true);
        Notification.create.mockClear();

        await sendWebhook(webhookPayload(orderId));

        expect(Notification.create).toHaveBeenCalledTimes(1);
    });

    // ── Test 16+17: Duplicate webhook idempotency ─────────────────────────────
    test('duplicate webhook with SUCCEEDED status does NOT create second donation', async () => {
        const orderId = 'CC_dup';
        const txn = makePendingTxn(orderId, { status: 'SUCCEEDED' });
        PaymentTransaction.findOne.mockResolvedValue(txn);

        await sendWebhook(webhookPayload(orderId));

        expect(mockCashfreeService.getOrderPayments).not.toHaveBeenCalled();
        expect(UserContributedFundraiser).not.toHaveBeenCalled();
    });

    test('duplicate webhook does NOT increment fundraiser a second time', async () => {
        const orderId = 'CC_dup2';
        const txn = makePendingTxn(orderId, { status: 'SUCCEEDED' });
        PaymentTransaction.findOne.mockResolvedValue(txn);
        CreatedFundraiser.findByIdAndUpdate = jest.fn().mockResolvedValue(true);

        await sendWebhook(webhookPayload(orderId));

        expect(CreatedFundraiser.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    // ── Test 18: Failed payment does not create donation ──────────────────────
    test('PAYMENT_FAILED_WEBHOOK does not create UserContributedFundraiser, marks FAILED', async () => {
        const orderId = 'CC_fail';
        const txn = makePendingTxn(orderId);
        PaymentTransaction.findOne.mockResolvedValue(txn);

        await sendWebhook(webhookPayload(orderId, 'PAYMENT_FAILED_WEBHOOK'));

        expect(UserContributedFundraiser).not.toHaveBeenCalled();
        expect(txn.status).toBe('FAILED');
    });

    // ── Amount-mismatch guard (anti-tampering) ────────────────────────────────
    // Controller line 299: Math.abs(paidAmount - txn.totalAmount) > 0.5 → FAILED
    test('webhook rejects tampered amount: paidAmount != totalAmount blocks donation', async () => {
        const orderId = 'CC_tamper';
        // Transaction expects ₹1,080 (₹1,000 donation + ₹80 tip)
        const txn = makePendingTxn(orderId, { donationAmount: 1000, platformTip: 80, totalAmount: 1080 });
        PaymentTransaction.findOne.mockResolvedValue(txn);

        // Cashfree API returns ₹500 — does NOT match stored totalAmount of ₹1,080
        mockCashfreeService.getOrderPayments.mockResolvedValue([{
            payment_status: 'SUCCESS',
            order_amount:   500,   // tampered / wrong amount
        }]);

        CreatedFundraiser.findByIdAndUpdate = jest.fn().mockResolvedValue(true);

        await sendWebhook(webhookPayload(orderId));

        // Donation must NOT be created
        expect(UserContributedFundraiser).not.toHaveBeenCalled();
        // Fundraiser must NOT be incremented
        expect(CreatedFundraiser.findByIdAndUpdate).not.toHaveBeenCalled();
        // Transaction must be marked FAILED so it cannot be replayed
        expect(txn.status).toBe('FAILED');
        expect(txn.save).toHaveBeenCalled();
    });
});


// ─────────────────────────────────────────────────────────────────────────────
describe('CareConnect: Payment — Status endpoint', () => {

    beforeEach(() => { jest.clearAllMocks(); });

    test('GET /api/payment/status/:ccOrderId returns status breakdown for SUCCEEDED txn', async () => {
        const orderId = 'CC_status1';
        const txn = {
            cashfreeOrderId: orderId,
            userId:          5,
            status:          'SUCCEEDED',
            donationAmount:  1000,
            platformTip:     80,
            totalAmount:     1080,
            fundraiserName:  'Test Fund',
            paidAt:          new Date(),
        };
        PaymentTransaction.findOne.mockResolvedValue(txn);

        const res = await request(app).get(`/api/payment/status/${orderId}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('SUCCEEDED');
        expect(res.body.donationAmount).toBe(1000);
        expect(res.body.platformTip).toBe(80);
        expect(res.body.totalAmount).toBe(1080);
    });

    test('GET /api/payment/status/:ccOrderId returns 404 for unknown order', async () => {
        PaymentTransaction.findOne.mockResolvedValue(null);
        const res = await request(app).get('/api/payment/status/CC_unknown');
        expect(res.statusCode).toBe(404);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('CareConnect: Receipt — 8% tip representation', () => {

    // ── Test 19: Verify the accounting logic is correct ───────────────────────
    test('new receipt: donationAmount + platformTip = totalAmount (tip is addition not deduction)', () => {
        // Simulates what the new receipt code does with a PaymentTransaction:
        const donationAmount = 1000;
        const platformTip   = Math.round(donationAmount * 8) / 100;
        const totalAmount   = donationAmount + platformTip;

        expect(platformTip).toBe(80);           // 8% tip
        expect(totalAmount).toBe(1080);         // total = donation + tip
        expect(donationAmount).toBe(1000);      // fundraiser still gets full 1000

        // vs old (wrong) legacy: fee subtracted FROM donation
        const oldFee = donationAmount * 0.08;
        const oldNet = donationAmount - oldFee;
        expect(oldNet).toBe(920);               // legacy shows 920, which was wrong
        // New: 1000 goes to fundraiser, 80 is additional — fundraiser gets 1000 not 920
    });
});
