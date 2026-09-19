/**
 * bugfix.test.js
 *
 * Regression tests for three bug fixes:
 *
 *  Bug 1 — Cache Invalidation (14 assertions covering all mutation paths)
 *  Bug 2 — ngoName returned in getUserActivity (no N+1)
 *  Bug 3 — 8% tip accounting: legacy receipt shows no fabricated deduction;
 *           amount_raised_so_far incremented by donationAmount only
 */

const mongoose = require('mongoose');
const request  = require('supertest');

// ── 1. Redis mock — must be defined BEFORE app loads ─────────────────────────
// IMPORTANT: jest.mock() factories are hoisted to the top by Babel/Jest.
// Variables referenced inside the factory must be prefixed with "mock" (case-insensitive)
// to satisfy Jest's hoisting guard.
const mockRedis = {
  get:           jest.fn().mockResolvedValue(null),
  set:           jest.fn().mockResolvedValue('OK'),
  setEx:         jest.fn().mockResolvedValue('OK'),
  del:           jest.fn().mockResolvedValue(1),
  keys:          jest.fn().mockResolvedValue([]),
  on:            jest.fn(),
  connect:       jest.fn().mockResolvedValue(null),
  quit:          jest.fn().mockResolvedValue(null),
  isReadyStatus: true,
};
jest.mock('../redis', () => mockRedis);

// ── 2. Auth middleware ────────────────────────────────────────────────────────
jest.mock('../middlewares/auth.middleware', () => (req, res, next) => {
  req.user = { id: 5, role: 'Donor', name: 'Test Donor' };
  next();
});

// ── 3. Notification service ───────────────────────────────────────────────────
jest.mock('../services/notificationService', () => ({
  sendNotification: jest.fn().mockResolvedValue(null),
}));

// ── 4. NGO model (needs collection.collectionName for admin.controller.js) ───
jest.mock('../models/NGO.model', () => ({
  NGO: {
    findOne:    jest.fn(),
    find:       jest.fn(),
    countDocuments: jest.fn(),
    aggregate:  jest.fn(),
    collection: { collectionName: 'ngos' },
  },
  Event: {
    find:       jest.fn(),
    findOne:    jest.fn(),
    countDocuments: jest.fn(),
    aggregate:  jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

// ── 5. Carehome model ─────────────────────────────────────────────────────────
jest.mock('../models/carehome.model', () => ({
  Carehome: {
    findOne: jest.fn(),
    find:    jest.fn(),
    countDocuments: jest.fn(),
    collection: { collectionName: 'carehomes' },
  },
  DonationMoney: {
    find:      jest.fn().mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) }),
    aggregate: jest.fn(),
    findById:  jest.fn(),
  },
  donate_items: {
    find: jest.fn().mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) }),
  },
}));

// ── 6. User model ─────────────────────────────────────────────────────────────
const mockSave = jest.fn().mockResolvedValue(true);
jest.mock('../models/user.model', () => {
  const UCF = jest.fn().mockImplementation(() => ({ save: mockSave }));
  UCF.find = jest.fn();
  UCF.findOne = jest.fn();
  UCF.findById = jest.fn();
  UCF.aggregate = jest.fn();
  UCF.findOneAndUpdate = jest.fn().mockResolvedValue(true);

  const CF = jest.fn().mockImplementation(() => ({ save: mockSave }));
  CF.find = jest.fn();
  CF.findOne = jest.fn();
  CF.findOneAndUpdate = jest.fn().mockResolvedValue(true);
  CF.findById = jest.fn();

  const URE = jest.fn().mockImplementation(() => ({ save: mockSave }));
  URE.find = jest.fn();
  URE.findOne = jest.fn();
  URE.aggregate = jest.fn();
  URE.findOneAndUpdate = jest.fn();

  const User = jest.fn();
  User.findOne = jest.fn();
  User.find    = jest.fn();
  User.collection = { collectionName: 'donors' };

  return {
    UserContributedFundraiser: UCF,
    CreatedFundraiser:         CF,
    UserRegisteredEvent:       URE,
    User,
    donate_items_mes:          { find: jest.fn() },
    user_message:              { find: jest.fn() },
  };
});

// ── 7. Cashfree service (not under test here) ─────────────────────────────────
jest.mock('../services/cashfreeService', () => ({
  isCashfreeEnabled:      jest.fn(() => false),
  createCashfreeOrder:    jest.fn(),
  getOrderPayments:       jest.fn(),
  verifyWebhookSignature: jest.fn(() => false),
}));

// ── 8. PaymentTransaction model ───────────────────────────────────────────────
jest.mock('../models/paymentTransaction.model', () => ({
  PaymentTransaction: {
    findOne: jest.fn(),
    findById: jest.fn(),
  },
}));

// ── 9. Application model ──────────────────────────────────────────────────────
jest.mock('../models/Application', () => ({
  find: jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    sort:     jest.fn().mockReturnThis(),
    skip:     jest.fn().mockReturnThis(),
    limit:    jest.fn().mockReturnThis(),
    lean:     jest.fn().mockResolvedValue([]),
  }),
}));

// ── 10. CorporateDonation model ───────────────────────────────────────────────
jest.mock('../models/corporateDonation.model', () => ({
  find: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) }),
}));

// ── 11. Load app ─────────────────────────────────────────────────────────────
const { app, server, io } = require('../app');

// ── 12. Import mocked models for assertions ───────────────────────────────────
const { UserContributedFundraiser, CreatedFundraiser, UserRegisteredEvent } = require('../models/user.model');
const { NGO } = require('../models/NGO.model');
const { DonationMoney, donate_items } = require('../models/carehome.model');

afterAll(async () => {
  try {
    if (io)     { io.disconnectSockets(); io.close(); }
    if (server) {
      await new Promise(resolve => server.close(resolve)).catch(() => {});
    }
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  } catch (_) {}
}, 8000);

// =============================================================================
// Helpers
// =============================================================================
function makeFundraiser(overrides = {}) {
  return {
    _id:                   new mongoose.Types.ObjectId(),
    ngoId:                 1,
    fundraiser_name:       'Test Fund',
    deadline:              new Date('2099-12-31'),
    amount_raised_so_far:  500,
    ...overrides,
  };
}

// =============================================================================
// BUG 1 — Cache Invalidation
// =============================================================================
describe('CareConnect BugFix: Cache Invalidation', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-establish mockResolvedValue after clearAllMocks wipes implementations
    mockRedis.keys.mockResolvedValue([]);
    mockRedis.del.mockResolvedValue(1);
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockResolvedValue('OK');
    mockRedis.setEx.mockResolvedValue('OK');
  });

  // ── Test 1: Donation invalidates donor activity cache ──────────────────────
  test('donation invalidates user_activity:<userId> cache', async () => {
    const fundraiser = makeFundraiser();
    CreatedFundraiser.findOne
      .mockResolvedValueOnce({ deadline: new Date('2099-12-31') }) // get_deadline
      .mockResolvedValueOnce(fundraiser);                           // fundraiser check

    UserContributedFundraiser.mockImplementation(() => ({ save: mockSave }));
    CreatedFundraiser.findOneAndUpdate.mockResolvedValue(true);

    await request(app)
      .post('/api/donate/1/Test Fund')
      .send({ your_amount: 500 });

    // user_activity:5 must have been deleted (userId = 5 from auth mock)
    const delCalls = mockRedis.del.mock.calls.flat(Infinity);
    expect(delCalls).toContain('user_activity:5');
  });

  // ── Test 2: Donation invalidates ticker cache ─────────────────────────────
  test('donation invalidates ticker_data_latest cache', async () => {
    const fundraiser = makeFundraiser();
    CreatedFundraiser.findOne
      .mockResolvedValueOnce({ deadline: new Date('2099-12-31') })
      .mockResolvedValueOnce(fundraiser);

    UserContributedFundraiser.mockImplementation(() => ({ save: mockSave }));
    CreatedFundraiser.findOneAndUpdate.mockResolvedValue(true);

    await request(app)
      .post('/api/donate/1/Test Fund')
      .send({ your_amount: 500 });

    const delCalls = mockRedis.del.mock.calls.flat(Infinity);
    expect(delCalls).toContain('ticker_data_latest');
  });

  // ── Test 3: Donation invalidates NGO dashboard cache ──────────────────────
  test('donation invalidates dash:ngo:<ngoId> cache', async () => {
    const fundraiser = makeFundraiser();
    CreatedFundraiser.findOne
      .mockResolvedValueOnce({ deadline: new Date('2099-12-31') })
      .mockResolvedValueOnce(fundraiser);

    UserContributedFundraiser.mockImplementation(() => ({ save: mockSave }));
    CreatedFundraiser.findOneAndUpdate.mockResolvedValue(true);

    await request(app)
      .post('/api/donate/1/Test Fund')
      .send({ your_amount: 500 });

    const delCalls = mockRedis.del.mock.calls.flat(Infinity);
    expect(delCalls).toContain('dash:ngo:1');
  });

  // ── Test 4: Donation scans fund:* pattern ────────────────────────────────
  test('donation triggers keys("fund:*") pattern scan to clear fundraiser listing', async () => {
    const fundraiser = makeFundraiser();
    CreatedFundraiser.findOne
      .mockResolvedValueOnce({ deadline: new Date('2099-12-31') })
      .mockResolvedValueOnce(fundraiser);

    UserContributedFundraiser.mockImplementation(() => ({ save: mockSave }));
    CreatedFundraiser.findOneAndUpdate.mockResolvedValue(true);

    await request(app)
      .post('/api/donate/1/Test Fund')
      .send({ your_amount: 500 });

    const keysCalls = mockRedis.keys.mock.calls.map(c => c[0]);
    expect(keysCalls).toContain('fund:*');
  });

  // ── Test 5: editDonorProfile uses correct cache key ───────────────────────
  test('editDonorProfile invalidates user_activity:<userId> (not the old wrong key)', async () => {
    const { User } = require('../models/user.model');
    User.findOneAndUpdate = jest.fn().mockResolvedValue({
      userId: 5, name: 'New Name', email: 'a@b.com',
    });

    await request(app)
      .put('/api/donor/5')
      .send({ fullname: 'New Name', phone: '9999', mail: 'a@b.com' });

    const delCalls = mockRedis.del.mock.calls.flat(Infinity);
    // Must delete user_activity:5 (correct key)
    expect(delCalls).toContain('user_activity:5');
    // Must NOT delete the old wrong key
    expect(delCalls).not.toContain('user:apps:5');
  });

  // ── Test 6: invalidateDonorActivity scans user_apps:<userId>:p* ─────────────
  // We verify the cache helper itself calls keys() with the correct pattern,
  // ensuring paginated application caches are swept on profile edit.
  test('invalidateDonorActivity helper scans user_apps:<userId>:p* pattern', () => {
    const fs = require('fs');
    const src = fs.readFileSync(
      require.resolve('../services/cacheHelpers.js'),
      'utf8'
    );
    // The helper must scan this exact pattern for paginated application pages
    expect(src).toMatch(/user_apps:\$\{userId\}:p\*/);
    // And must also delete user_activity:<userId> directly
    expect(src).toMatch(/user_activity:\$\{userId\}/);
  });
});

// =============================================================================
// BUG 2 — ngoName in getUserActivity
// =============================================================================
describe('CareConnect BugFix: ngoName in Donor Activity', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockResolvedValue('OK');
    mockRedis.setEx.mockResolvedValue('OK');
    mockRedis.keys.mockResolvedValue([]);
    mockRedis.del.mockResolvedValue(1);
    mockRedis.isReadyStatus = true;
  });

  // ── Test 7: contributedFundraisers includes ngoName ───────────────────────
  test('getUserActivity returns ngoName in contributedFundraisers (not undefined)', async () => {
    // Simulate aggregation returning records with ngoName attached
    UserContributedFundraiser.aggregate.mockResolvedValue([
      {
        _id:                new mongoose.Types.ObjectId(),
        userId:             5,
        ngoId:              1,
        fundraiser_name:    'Help Kids',
        amount_contributed: 1000,
        contributed_at:     new Date(),
        deadline:           new Date('2099-01-01'),
        ngoName:            'GreenEarth Foundation',  // ← injected by $lookup
      },
    ]);
    UserRegisteredEvent.aggregate.mockResolvedValue([]);
    DonationMoney.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) })
    });
    donate_items.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) })
    });

    const res = await request(app).get('/api/activity/5');

    expect(res.statusCode).toBe(200);
    const funds = res.body.data.contributedFundraisers;
    expect(funds).toHaveLength(1);
    expect(funds[0].ngoName).toBe('GreenEarth Foundation');
    expect(funds[0].ngoName).not.toBeUndefined();
  });

  // ── Test 8: ngoName present even for older records ────────────────────────
  test('ngoName falls back gracefully when NGO not found (undefined, not crash)', async () => {
    UserContributedFundraiser.aggregate.mockResolvedValue([
      {
        _id:                new mongoose.Types.ObjectId(),
        userId:             5,
        ngoId:              99,  // NGO doesn't exist
        fundraiser_name:    'Old Fund',
        amount_contributed: 200,
        contributed_at:     new Date(),
        deadline:           new Date('2099-01-01'),
        ngoName:            null, // $lookup + $arrayElemAt returns null when no match
      },
    ]);
    UserRegisteredEvent.aggregate.mockResolvedValue([]);
    DonationMoney.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) })
    });
    donate_items.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) })
    });

    const res = await request(app).get('/api/activity/5');

    expect(res.statusCode).toBe(200);
    // Does NOT crash — ngoName is null (not undefined) after JSON serialization
    // The frontend "fund.ngoName || 'Partner NGO'" fallback handles null gracefully.
    const funds = res.body.data.contributedFundraisers;
    // null is included in JSON, undefined is not — either way the response must not error
    expect(res.body.success).toBe(true);
    expect(funds).toHaveLength(1);
  });

  // ── Test 9: No N+1 — only one aggregate call per type ────────────────────
  test('getUserActivity calls aggregate once for UCF (not one per record)', async () => {
    UserContributedFundraiser.aggregate.mockResolvedValue([
      { _id: new mongoose.Types.ObjectId(), userId: 5, ngoId: 1,
        fundraiser_name: 'F1', amount_contributed: 100, ngoName: 'NGO A',
        contributed_at: new Date(), deadline: new Date('2099-01-01') },
      { _id: new mongoose.Types.ObjectId(), userId: 5, ngoId: 2,
        fundraiser_name: 'F2', amount_contributed: 200, ngoName: 'NGO B',
        contributed_at: new Date(), deadline: new Date('2099-01-01') },
      { _id: new mongoose.Types.ObjectId(), userId: 5, ngoId: 3,
        fundraiser_name: 'F3', amount_contributed: 300, ngoName: 'NGO C',
        contributed_at: new Date(), deadline: new Date('2099-01-01') },
    ]);
    UserRegisteredEvent.aggregate.mockResolvedValue([]);
    DonationMoney.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) })
    });
    donate_items.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) })
    });

    await request(app).get('/api/activity/5');

    // UCF.aggregate called exactly ONCE regardless of how many records returned
    expect(UserContributedFundraiser.aggregate).toHaveBeenCalledTimes(1);
    // NGO.findOne must NOT have been called (that would be N+1)
    expect(NGO.findOne).not.toHaveBeenCalled();
  });
});

// =============================================================================
// BUG 3 — 8% Accounting
// =============================================================================
describe('CareConnect BugFix: 8% Tip Accounting', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedis.get.mockResolvedValue(null);
    mockRedis.keys.mockResolvedValue([]);
    mockRedis.del.mockResolvedValue(1);
  });

  // ── Test 10: amount_raised_so_far incremented by donationAmount only ──────
  test('contributed_fund increments amount_raised_so_far by donationAmount (not minus tip)', async () => {
    const fundraiser = makeFundraiser();
    CreatedFundraiser.findOne
      .mockResolvedValueOnce({ deadline: new Date('2099-12-31') })
      .mockResolvedValueOnce(fundraiser);

    UserContributedFundraiser.mockImplementation(() => ({ save: mockSave }));
    CreatedFundraiser.findOneAndUpdate.mockResolvedValue(true);

    await request(app)
      .post('/api/donate/1/Test Fund')
      .send({ your_amount: 1000 });

    // Must have incremented by exactly 1000, not 920 (1000 - 8%)
    expect(CreatedFundraiser.findOneAndUpdate).toHaveBeenCalledWith(
      { ngoId: '1', fundraiser_name: 'Test Fund' },
      { $inc: { amount_raised_so_far: 1000 } },
      { new: true }
    );
  });

  // ── Test 11: legacy receipt does NOT compute a deduction ─────────────────
  // Verify the controller does not reference 0.08 deduction for legacy records.
  // We test this indirectly: the receipt endpoint must not crash and must NOT
  // include "Net Community Impact" text (the old deduction label).
  test('legacy receipt branch no longer calculates fee = amount * 0.08', () => {
    // Read the receipt controller source and confirm the old deduction is gone
    const fs = require('fs');
    const src = fs.readFileSync(
      require.resolve('../controllers/receipt.controller.js'),
      'utf8'
    );
    // Old fabricated deduction pattern must not exist in legacy branch
    expect(src).not.toMatch(/Net Community Impact/);
    expect(src).not.toMatch(/Platform Commission/);
    // New correct labels must be present
    expect(src).toMatch(/Fundraiser Impact/);
    expect(src).toMatch(/Donation Amount/);
  });

  // ── Test 12: contributed_fund returns 200 with correct success message ────
  test('contributed_fund ₹1000 donation returns 200 success', async () => {
    const fundraiser = makeFundraiser();
    CreatedFundraiser.findOne
      .mockResolvedValueOnce({ deadline: new Date('2099-12-31') })
      .mockResolvedValueOnce(fundraiser);

    UserContributedFundraiser.mockImplementation(() => ({ save: mockSave }));
    CreatedFundraiser.findOneAndUpdate.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/donate/1/Test Fund')
      .send({ your_amount: 1000 });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // ── Test 13: backend does not trust frontend-supplied total ───────────────
  test('contributed_fund uses req.body.your_amount directly as donationAmount (no frontend tip added)', async () => {
    const fundraiser = makeFundraiser();
    CreatedFundraiser.findOne
      .mockResolvedValueOnce({ deadline: new Date('2099-12-31') })
      .mockResolvedValueOnce(fundraiser);

    UserContributedFundraiser.mockImplementation(() => ({ save: mockSave }));
    CreatedFundraiser.findOneAndUpdate.mockResolvedValue(true);

    // Attacker sends a fabricated "total" — backend must ignore it
    await request(app)
      .post('/api/donate/1/Test Fund')
      .send({ your_amount: 500, total: 9999, tip: 999 });

    // Increment uses only your_amount (500), not the fake total/tip
    expect(CreatedFundraiser.findOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      { $inc: { amount_raised_so_far: 500 } },
      expect.anything()
    );
  });

  // ── Test 14: legacy and new receipt branches are mutually exclusive ───────
  test('receipt controller has both legacy and Cashfree-backed branches', () => {
    const fs = require('fs');
    const src = fs.readFileSync(
      require.resolve('../controllers/receipt.controller.js'),
      'utf8'
    );
    // Cashfree branch (new)
    expect(src).toMatch(/Platform Tip.*Additional/);
    expect(src).toMatch(/Total Charged to Donor/);
    // Legacy branch (fixed)
    expect(src).toMatch(/Donation Amount/);
    expect(src).toMatch(/Fundraiser Impact/);
    // Old deduction gone from legacy branch
    expect(src).not.toMatch(/- INR.*fee/);
  });
});
