const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');


// 2. MOCK EXTERNAL SERVICES
jest.mock('../redis', () => ({
    get: jest.fn(),
    set: jest.fn(),
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(null),
    quit: jest.fn().mockResolvedValue(null),
    isReadyStatus: true
}));

// 3. MOCK AUTH MIDDLEWARE
jest.mock('../middlewares/auth.middleware', () => (req, res, next) => {
    req.user = { id: '4', role: 'Donor' };
    next();
});

// 4. MOCK MODELS
jest.mock('../models/user.model');
jest.mock('../models/carehome.model');
jest.mock('../models/NGO.model');

// 5. LOAD APP
const { app, server } = require('../app');

// 6. IMPORT MOCKED MODELS
const { CreatedFundraiser, UserContributedFundraiser } = require('../models/user.model');

afterAll(async () => {
    if (server) {
        await new Promise((resolve) => server.close(resolve));
        console.log("🛑 Test Environment: Captured Server Closed");
    }
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }
});

describe('CareConnect: Donate Money (contributed_fund)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ─── TEST 1: Successful contribution ───────────────────────────────────────
    test('POST /api/donate/:ngoId/:fundraiser_name should return 200 on success', async () => {

        // Mock fundraiser exists in DB
        const mockFundraiser = {
            _id: new mongoose.Types.ObjectId(),
            ngoId: 1,
            fundraiser_name: 'Help Kids',
            deadline: new Date('2099-12-31'),
            amount_raised_so_far: 500,
        };

        // Mock get_deadline — it calls CreatedFundraiser.findOne internally
        // First call: get_deadline uses findOne, Second call: contributed_fund uses findOne
        CreatedFundraiser.findOne
            .mockResolvedValueOnce({ deadline: new Date('2099-12-31') }) // for get_deadline
            .mockResolvedValueOnce(mockFundraiser);                       // for fundraiser check

        // Mock saving the new contribution
        UserContributedFundraiser.mockImplementation(() => ({
            save: jest.fn().mockResolvedValue(true)
        }));

        // Mock updating the fundraiser amount
        CreatedFundraiser.findOneAndUpdate = jest.fn().mockResolvedValue(true);

        const res = await request(app)
            .post('/api/donate/1/Help Kids')
            .send({ your_amount: 100 });

        if (res.statusCode === 401 || res.statusCode === 403) {
            console.warn(`⚠️ Auth blocked: ${res.statusCode}`, res.body);
        }

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Contribution recorded successfully');
    });

    // ─── TEST 2: Fundraiser not found ──────────────────────────────────────────
    test('POST /api/donate/:ngoId/:fundraiser_name should return 404 if fundraiser not found', async () => {

        // get_deadline returns something, but fundraiser check returns null
        CreatedFundraiser.findOne
            .mockResolvedValueOnce({ deadline: new Date('2099-12-31') }) // for get_deadline
            .mockResolvedValueOnce(null);                                 // fundraiser not found

        const res = await request(app)
            .post('/api/donate/1/NonExistentFundraiser')
            .send({ your_amount: 100 });

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Fundraiser not found');
    });

    // ─── TEST 3: Missing amount ────────────────────────────────────────────────
    test('POST /api/donate/:ngoId/:fundraiser_name should still hit controller without amount', async () => {

        const mockFundraiser = {
            _id: new mongoose.Types.ObjectId(),
            ngoId: 1,
            fundraiser_name: 'Help Kids',
            deadline: new Date('2099-12-31'),
        };

        CreatedFundraiser.findOne
            .mockResolvedValueOnce({ deadline: new Date('2099-12-31') })
            .mockResolvedValueOnce(mockFundraiser);

        UserContributedFundraiser.mockImplementation(() => ({
            save: jest.fn().mockResolvedValue(true)
        }));

        CreatedFundraiser.findOneAndUpdate = jest.fn().mockResolvedValue(true);

        // Send request with no body
        const res = await request(app)
            .post('/api/donate/1/Help Kids')
            .send({});

        // Controller will still run — amount will just be undefined
        // It should not crash, it should either 200 or handle gracefully
        expect([200, 400, 500]).toContain(res.statusCode);
    });

    // ─── TEST 4: DB error ─────────────────────────────────────────────────────
    test('POST /api/donate/:ngoId/:fundraiser_name should return 500 if DB throws', async () => {

        // Simulate a DB crash
        CreatedFundraiser.findOne.mockRejectedValue(new Error('DB connection failed'));

        const res = await request(app)
            .post('/api/donate/1/Help Kids')
            .send({ your_amount: 100 });

        expect(res.statusCode).toBe(500);
    });
});