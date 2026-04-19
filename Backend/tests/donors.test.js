const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');

let capturedApp;
let capturedServer;
const originalListen = express.application.listen;

express.application.listen = function (...args) {
    capturedApp = this;
    capturedServer = originalListen.apply(this, args);
    return capturedServer;
};

jest.mock('../redis', () => ({
    get: jest.fn(),
    set: jest.fn(),
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(null),
    quit: jest.fn().mockResolvedValue(null),
    isReadyStatus: true
}));

jest.mock('../middlewares/auth.middleware', () => (req, res, next) => {
    req.user = { _id: '4', role: 'Donor' }; // ✅ Capital D matches authorizeRoles("Donor")
    next();
});

require('../app');
const app = capturedApp;

const { User } = require('../models/user.model');
jest.mock('../models/user.model');

afterAll(async () => {
    if (capturedServer) {
        await new Promise((resolve) => capturedServer.close(resolve));
        console.log("🛑 Test Environment: Captured Server Closed");
    }
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }
});

describe('CareConnect: Donor Dashboard Diagnostics', () => {

    test('Diagnostic: List all registered routes', () => {
        console.log("--- Registered Routes ---");
        app._router.stack.forEach((middleware) => {
            if (middleware.route) {
                console.log(`PATH: ${middleware.route.path}`);
            } else if (middleware.name === 'router') {
                middleware.handle.stack.forEach((handler) => {
                    if (handler.route) {
                        console.log(`PATH: ${handler.route.path}`);
                    }
                });
            }
        });
        console.log("-------------------------");
    });

    test('GET /api/donor/dashboard/:userId should return 200', async () => {
        const mockUser = {
            userId: '4',
            name: 'CH VENAKTA DHEERAJ',
            email: 'venkatadheeraj.vd@gmail.com'
        };

        User.findOne.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(mockUser)
        });

        const res = await request(app).get('/api/donor/dashboard/4');

        if (res.statusCode === 404) {
            console.warn("⚠️ Still 404. Check the 'Registered Routes' log above.");
        }
        if (res.statusCode === 401 || res.statusCode === 403) {
            console.warn(`⚠️ Auth/Role blocked the route — got ${res.statusCode}:`, res.body);
        }

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user.name).toBe('CH VENAKTA DHEERAJ');
    });
});