const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');

// 1. INTERCEPT THE APP
let capturedApp;
let capturedServer;
const originalListen = express.application.listen;

express.application.listen = function (...args) {
    capturedApp = this;
    capturedServer = originalListen.apply(this, args);
    return capturedServer;
};

// 2. MOCK REDIS
jest.mock('../redis', () => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(null),
    setEx: jest.fn().mockResolvedValue(null),
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(null),
    quit: jest.fn().mockResolvedValue(null),
    isReadyStatus: false
}));

// 3. MOCK AUTH
jest.mock('../middlewares/auth.middleware', () => (req, res, next) => {
    req.user = { id: '1', role: 'NGO' };
    next();
});

// 4. MOCK MODELS
jest.mock('../models/NGO.model');
jest.mock('../models/user.model');
jest.mock('../models/carehome.model');

// 5. LOAD APP
require('../app');
const app = capturedApp;

const { NGO } = require('../models/NGO.model');

afterAll(async () => {
    if (capturedServer) {
        await new Promise((resolve) => capturedServer.close(resolve));
        console.log("🛑 Test Environment: Captured Server Closed");
    }
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }
});

describe('CareConnect: NGO Registration', () => {

    beforeEach(() => jest.clearAllMocks());

    // ─── TEST 1: Successful registration ──────────────────
    test('POST /api/ngo/register should return 201 on success', async () => {

        NGO.mockImplementation(() => ({
            save: jest.fn().mockResolvedValue(true)
        }));

        const res = await request(app)
            .post('/api/ngo/register')
            .send({
                Ngoname: 'HelpAll Foundation',
                darpan_id: 'HR/2020/123456',
                year_established: 2010,
                email: 'helpall@ngo.com',
                password: 'securePass123',
                phone: '9876543210',
                address: 'Chennai, Tamil Nadu',
                account_holder_name: 'HelpAll Foundation',
                account_number: '1234567890',
                ifsc: 'HDFC0001234'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('NGO Registration successful');
    });

    // ─── TEST 2: Duplicate email ───────────────────────────
    test('POST /api/ngo/register should return 500 if email already exists', async () => {

        NGO.mockImplementation(() => ({
            save: jest.fn().mockRejectedValue({
                code: 11000,
                message: 'E11000 duplicate key error — email already exists'
            })
        }));

        const res = await request(app)
            .post('/api/ngo/register')
            .send({
                Ngoname: 'Duplicate NGO',
                darpan_id: 'HR/2020/999999',
                year_established: 2015,
                email: 'helpall@ngo.com',
                password: 'anotherPass',
                phone: '9876543210',
                address: 'Mumbai',
                account_holder_name: 'Duplicate NGO',
                account_number: '9999999999',
                ifsc: 'ICIC0001234'
            });

        expect(res.statusCode).toBe(500);
    });
});